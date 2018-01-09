/*
 
This file is part of Streembit application. 
Streembit is an open source communication application. 

Streembit is a free software: you can redistribute it and/or modify it under the terms of the GNU General Public License 
as published by the Free Software Foundation, either version 3.0 of the License, or (at your option) any later version.

Streembit is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of 
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU General Public License for more details.

You should have received a copy of the GNU General Public License along with Streembit software.  
If not, see http://www.gnu.org/licenses/.
 
-------------------------------------------------------------------------------------------------------------------------
Author: Tibor Zsolt Pardi 
Copyright (C) Streembit 2017
-------------------------------------------------------------------------------------------------------------------------
  
*/

/**
 * Implementation is based on https://github.com/kadtools/kad 
 * Huge thanks to Gordon Hall https://github.com/gordonwritescode the author of kad library!
 * @module kad
 * @license GPL-3.0
 * @author Gordon Hall gordon@gordonwritescode.com
 */


'use strict';

var assert = require('assert');
var inherits = require('util').inherits;
var events = require('events');
var async = require('async');
var _ = require('lodash');
var constants = require('./constants');
var utils = require('./utils');
var Message = require('./message');
var Logger = require('./logger');
var Bucket = require('./bucket');
var Contact = require('./contact');
var Item = require('./item');

/**
 * Represents a routing table of known {@link Contact}s; used by {@link Node}.
 * @constructor
 * @param {Object} options
 * @param {Logger} options.logger - Logger instance to use
 * @param {RPC} options.transport - Transport adapter (RPC) to use
 * @param {Router~validator} options.validator - Key-Value validation function
 * @emits Router#add
 * @emits Router#drop
 * @emits Router#shift
 */
function Router(options) {
    if (!(this instanceof Router)) {
        return new Router(options);
    }

    this._log = options.logger || new Logger(4);
    this._buckets = {};
    this._rpc = options.transport;
    this._self = this._rpc._contact;
    this._validator = options.validator;

    this.inactive_contacts = {};

    Object.defineProperty(this, 'length', {
        get: this._getSize.bind(this),
        enumerable: false,
        configurable: false
    });
}
/**
 * Called when a value is returned from a lookup to validate it
 * @callback Router~validator
 * @param {String} key - The key at which the value is stored
 * @param {String} value - The returned value from the lookup
 * @param {Function} callback - Called with boolean indicating validity
 */

/**
 * Add event is triggered when a new {@link Contact} is added to the router
 * @event Router#add
 */

/**
 * Drop event is triggered when a {@link Contact} is dropped from the router
 * @event Router#drop
 */

/**
 * Shift event is triggered when a {@link Contact} changes position in a
 * {@link Bucket}
 * @event Router#shift
 */

// NB: Don't ping contact at bucket head if seen within the last 5 minutes
Router.PING_TTL = 300000;

inherits(Router, events.EventEmitter);

/**
 * Execute this router's find operation with the shortlist
 * @param {String} type - One of "NODE" or "VALUE"
 * @param {String} key - Key to use for lookup
 * @param {Router~lookupCallback} callback - Called when the lookup is complete
 * @param {Boolean} [aggressiveLookup=false] - Iterate until K contacts are
 * found even if there is no improvement
 */
Router.prototype.lookup = function (type, key, callback, aggressiveLookup, itemcallback) {
    assert(['NODE', 'VALUE'].indexOf(type) !== -1, 'Invalid search type');

    var state = this._createLookupState(type, key, {
        aggressiveLookup: aggressiveLookup,
        itemcallback: itemcallback
    });

    if (!state.closestNode) {
        return callback(new Error('Not connected to any peers'));
    }

    state.closestNodeDistance = utils.getDistance(
        state.hashedKey,
        state.closestNode.nodeID
    );

    this._log.debug('lookup() performing network walk for ' + type + ' key: ' + key);
    this._iterativeFind(state, state.shortlist, callback);
};
/**
 * This callback is called upon completion of {@link Router#lookup}
 * @callback Router~lookupCallback
 * @param {Error|null} err - The error object, if any
 * @param {String} type - One of "NODE" or "VALUE"
 * @param {Array|String} result - The {@link Contact}s returned or the value
 */

/**
 * Returns the number of contacts in the routing table - used as the getter for
 * the Router#length property
 * @private
 */
Router.prototype._getSize = function () {
    var total = 0;

    for (var k in this._buckets) {
        total += this._buckets[k].getSize();
    }

    return total;
};

/**
 * Empties the routing table, clearing all known contacts
 */
Router.prototype.empty = function () {
    this._buckets = {};
    this.emit('remove', this._self);
};

/**
 * Removes the given contact from the routing table
 * @param {Contact} contact - The contact to drop from the router
 * @returns {Boolean} Operation succeeded (contact was in expected bucket)
 */
Router.prototype.removeContact = function (contact) {
    var index = utils.getBucketIndex(this._self.nodeID, contact.nodeID);
    var bucket = this._buckets[index];

    this._log.debug('removing contact %j', contact);
    assert(index < constants.B, 'Bucket index may not exceed B');    

    if (!bucket) {
        return false;
    }

    bucket.removeContact(contact);

    this.inactive_contacts[contact.nodeID] = Date.now();

    this.emit('drop', contact, bucket, bucket.indexOf(contact));

    return true;
};

/**
 * Returns the {@link Contact} in the routing table by the given node ID
 * @param {String} nodeID - The nodeID of the {@link Contact} to return
 * @returns {Contact|null}
 */
Router.prototype.getContactByNodeID = function (nodeID) {
    for (var k in this._buckets) {
        var contacts = this._buckets[k].getContactList();

        for (var i = 0; i < contacts.length; i++) {
            if (nodeID === contacts[i].nodeID) {
                return contacts[i];
            }
        }
    }

    return null;
};

/**
 * Creates a state machine for a lookup operation
 * @private
 * @param {String} type - One of 'NODE' or 'VALUE'
 * @param {String} key - 160 bit key
 * @param {Object} options
 * @param {Boolean} [options.aggressiveLookup=false] - Iterate until K contacts
 * are found even if there is no improvement
 * @returns {Object} Lookup state machine
 */
Router.prototype._createLookupState = function (type, key, options) {
    options = typeof options !== 'object' ? {} : options;

    var state = {
        type: type,
        key: key,
        hashedKey: utils.createID(key),
        limit: constants.ALPHA,
        previousClosestNode: null,
        contacted: {},
        foundValue: false,
        value: null,
        contactsWithoutValue: [],
        aggressiveLookup: !!options.aggressiveLookup,
        completedIterations: 0,
        itemcallback: options.itemcallback
    };
    state.shortlist = this.getNearestContacts(
        key,
        state.limit,
        this._self.nodeID
    );
    state.closestNode = state.shortlist[0];

    return state;
};

/**
 * Execute the find operation for this router type
 * @private
 * @param {Object} state - State machine returned from _createLookupState()
 * @param {Array} contacts - List of contacts to query
 * @param {Function} callback
 */
Router.prototype._iterativeFind = function (state, contacts, callback) {
    var self = this;
    var failures = 0;

    function queryContact(contact, next) {
        self._queryContact(state, contact, function (err) {
            if (err) {
                self._log.error("_queryContact error: %j", err.message ? err.message : err);
                failures++;
            }

            next();
        });
    }

    this._log.debug('starting contact iteration for key %s', state.key);
    async.each(contacts, queryContact, function () {
        self._log.debug('iterate returned for key: ' + state.key + ' len: ' + contacts.length + ' failures: ' + failures);
        if (failures === contacts.length) {
            return callback(new Error('Lookup operation failed to return results'));
        }

        self._handleQueryResults(state, callback);
    });
};

/**
 * Send this router's RPC message to the contact
 * @private
 * @param {Object} state - State machine returned from _createLookupState()
 * @param {Contact} contact - Contact to query
 * @param {Function} callback
 */
Router.prototype._queryContact = function (state, contactInfo, callback) {
    var self = this;
    var contact = this._rpc._createContact(contactInfo);
    var message = new Message({
        method: 'FIND_' + state.type,
        params: { key: state.key, contact: this._self }
    });

    this._log.debug('querying contact: ' + contact.address + ' nodeID: ' + contact.nodeID + ' message.id: ' + message.id + '  for key ' + state.key);
    this._rpc.send(contact, message, function (err, response) {
        if (err) {
            self._log.error(
                'query failed, removing contact from shortlist, reason %s',
                err.message
            );
            self._removeFromShortList(state, contact.nodeID);
            self.removeContact(contact);
            return callback(err);
        }

        self._handleFindResult(state, response, contact, callback);
    });
};

/**
 * Handle the results of the contact query
 * @private
 * @param {Object} state - State machine returned from _createLookupState()
 * @param {Message} message - Received response to FIND_* RPC
 * @param {Contact} contact - Sender of the message
 * @param {Function} callback
 */
Router.prototype._handleFindResult = function (state, msg, contact, callback) {
    var distance = utils.getDistance(state.hashedKey, contact.nodeID);

    state.contacted[contact.nodeID] = this.updateContact(contact);
    if (state.itemcallback && typeof state.itemcallback == "function") {
        state.itemcallback(contact);
    }

    if (utils.compareKeys(distance, state.closestNodeDistance) === -1) {
        state.previousClosestNode = state.closestNode;
        state.closestNode = contact;
        state.closestNodeDistance = distance;
    }

    if (state.type === 'NODE') {
        this._addToShortList(state, msg.result.nodes);
        return callback();
    }

    if (!msg.result.item) {
        state.contactsWithoutValue.push(contact);
        this._addToShortList(state, msg.result.nodes);
        return callback();
    }

    this._validateFindResult(state, msg, contact, callback);
};

/**
 * Validates the data returned from a find
 * @private
 * @param {Object} state - State machine returned from _createLookupState()
 * @param {Message} message - Received response to FIND_* RPC
 * @param {Contact} contact - Sender of the message
 * @param {Function} callback
 */
Router.prototype._validateFindResult = function (state, msg, contact, done) {
    var self = this;
    var item = msg.result.item;

    function rejectContact() {
        self._removeFromShortList(state, contact.nodeID);
        self.removeContact(contact);
        done();
    }

    this._log.debug('validating result from %s', contact.nodeID);
    this._validateKeyValuePair(state.key, item.value, function (valid) {
        if (!valid) {
            self._log.warn('failed to validate key/value pair for %s', state.key);
            return rejectContact();
        }

        state.foundValue = true;
        state.value = item.value;
        state.item = item;
        done();
    });
};

/**
 * Add contacts to the shortlist, preserving nodeID uniqueness
 * @private
 * @param {Object} state - State machine returned from _createLookupState()
 * @param {Array} contacts - Contacts to add to the shortlist
 */
Router.prototype._addToShortList = function (state, contacts) {
    assert(Array.isArray(contacts), 'No contacts supplied');
    state.shortlist = state.shortlist.concat(contacts);
    state.shortlist = _.uniqBy(state.shortlist, 'nodeID');
};

/**
 * Remove contacts with the nodeID from the shortlist
 * @private
 * @param {Object} state - State machine returned from _createLookupState()
 * @param {String} nodeID - Node ID of the contact to remove
 */
Router.prototype._removeFromShortList = function (state, nodeID) {
    state.shortlist = _.reject(state.shortlist, function (c) {
        return c.nodeID === nodeID;
    });
};

/**
 * Handle the results of all the executed queries
 * @private
 * @param {Object} state - State machine returned from _createLookupState()
 * @param {Function} callback
 */
Router.prototype._handleQueryResults = function (state, callback) {
    if (state.foundValue) {
        this._log.debug('a value was returned from query %s', state.key);
        return this._handleValueReturned(state, callback);
    }

    state.completedIterations++;

    var closestNodeUnchanged = state.closestNode === state.previousClosestNode;
    var shortlistFull = state.shortlist.length >= constants.K;
    var shouldNotContinue = state.aggressiveLookup ?
        state.completedIterations === constants.ALPHA && shortlistFull :
        (closestNodeUnchanged || shortlistFull);

    if (shouldNotContinue) {
        this._log.debug(
            'shortlist is full or there are no known nodes closer to key %s',
            state.key
        );
        return callback(null, 'NODE', state.shortlist);
    }

    var remainingContacts = _.reject(state.shortlist, function (c) {
        return state.contacted[c.nodeID];
    });

    if (remainingContacts.length === 0) {
        this._log.debug('there are no more remaining contacts to query');
        return callback(null, 'NODE', state.shortlist);
    }

    //this._log.debug('state.shortlist %j', state.shortlist);

    //this._log.debug('continuing with iterative query for key %s', state.key);

    var remcontacts = remainingContacts.splice(0, constants.ALPHA);
    //this._log.debug('contacts to _iterativeFind: %j', remcontacts);

    var contacts = [];
    for (var i = 0; i < remcontacts.length; i++) {
        var nodeID = remcontacts[i].nodeID;
        // check the inactive contact list
        if (this.inactive_contacts[nodeID]) {
            this._log.debug(nodeID + ' is inactive contact');
            continue;
        }

        contacts.push(remcontacts[i]);
    }

    if (contacts.length == 0) {
        this._log.debug('inactive was removed, contacts.length = 0, return ');
        return callback(null, 'NODE', state.shortlist);
    }

    this._iterativeFind(
        state,
        contacts,
        callback
    );
};

/**
 * Handle a value being returned and store at closest nodes that didn't have it
 * @private
 * @param {Object} state - State machine returned from _createLookupState()
 * @param {Function} callback
 */
Router.prototype._handleValueReturned = function (state, callback) {
    var self = this;

    var distances = state.contactsWithoutValue.map(function (contact) {
        return {
            distance: utils.getDistance(contact.nodeID, self._self.nodeID),
            contact: contact
        };
    });

    distances.sort(function (a, b) {
        return utils.compareKeys(a.distance, b.distance);
    });

    if (distances.length >= 1) {
        var item = state.item;
        var closestWithoutValue = distances[0].contact;
        var message = new Message({
            method: 'STORE',
            params: {
                item: new Item(item.key, item.value, item.publisher, item.timestamp),
                contact: this._self
            }
        });

        this._rpc.send(closestWithoutValue, message);
    }

    callback(null, 'VALUE', state.value);
};

/**
 * Refreshes the buckets farther than the closest known
 * @param {Array} contacts - Results returned from findNode()
 * @param {Router~refreshBeyondCallback} done - Called upon successful refresh
 */
Router.prototype.refreshBucketsBeyondClosest = function (contacts, done) {
    var bucketIndexes = Object.keys(this._buckets);
    var leastBucket = _.min(bucketIndexes);

    function bucketFilter(index) {
        return index > leastBucket;
    }

    var refreshBuckets = bucketIndexes.filter(bucketFilter);
    var queue = async.queue(this.refreshBucket.bind(this), 1);

    this._log.debug('refreshing buckets farthest than closest known');

    refreshBuckets.forEach(function (index) {
        queue.push(index);
    });

    done();
};
/**
 * This callback is called upon completion of
 * {@link Router#refreshBucketsBeyondClosest}
 * @callback Router~refreshBeyondCallback
 */

/**
 * Refreshes the bucket at the given index
 * @param {Number} index
 * @param {Function} callback
 */
Router.prototype.refreshBucket = function (index, callback) {
    var random = utils.getRandomInBucketRangeBuffer(index);
    this.findNode(random.toString('hex'), {
        aggressiveCache: true
    }, callback);
};
/**
 * This callback is called upon completion of {@link Router#refreshBucket}
 * @callback Router~refreshCallback
 * @param {Error|null} err - The error object, if any
 * @param {Array} contacts - The list of {@link Contact}s refreshed
 */

/**
 * Search contacts for the value at given key
 * @param {String} key - The lookup key for the desired value
 * @param {Router~findValueCallback} callback - Called upon lookup completion
 */
Router.prototype.findValue = function (key, callback) {
    var self = this;

    this._log.debug('searching for value at key %s', key);

    this.lookup('VALUE', key, function (err, type, value) {
        if (err || type === 'NODE') {
            return callback(new Error('Failed to find value for key: ' + key));
        }

        //self._log.debug('found value for key %s', key);

        callback(null, value);
    });
};
/**
 * This callback is called upon completion of {@link Router#findValue}
 * @callback Router~findValueCallback
 * @param {Error|null} err - The error object, if any
 * @param {String} value - The value returned from the lookup
 */

/**
 * Search contacts for nodes close to the given key
 * @param {String} nodeID - The nodeID the search for neighbors
 * @param {Object} [options]
 * @param {Boolean} [options.aggressiveLookup=false] - Iterate until K contacts
 * are found even if there is no improvement
 * @param {Boolean} [options.aggressiveCache=false] - Try to add all results
 * from any FIND_NODE RPC to the routing table
 * @param {Router~findNodeCallback} callback - Called upon lookup completion
 */
Router.prototype.findNode = function (nodeID, options, callback) {
    var self = this;

    if (typeof options === 'function') {
        callback = options;
        options = {};
    }

    this._log.debug('searching for nodes close to key %s', nodeID);
    this.lookup('NODE', nodeID, function (err, type, contacts) {
        if (err) {
            return callback(err);
        }

        //self._log.debug('found %d nodes close to key %s', contacts.length, nodeID);

        var result = [];
        for (var i = 0; i < contacts.length; i++) {
            var nodeID = contacts[i].nodeID;
            // check the inactive contact list
            if (self.inactive_contacts[nodeID]) {
                continue;
            }

            result.push(contacts[i]);
        }

        if (options.aggressiveCache) {
            result.forEach(function (contact) {
                self.updateContact(new self._self.constructor(
                    JSON.parse(JSON.stringify(contact))
                ));
            });
        }

        callback(null, result);
    }, options.aggressiveLookup, options.itemcallback);
};
/**
 * This callback is called upon completion of {@link Router#findNode}
 * @callback Router~findNodeCallback
 * @param {Error|null} err - The error object, if any
 * @param {Array} value - The {@link Contact}s returned from the lookup
 */

/**
 * Update the contact's status
 * @param {Contact} contact - Contact to update
 * @param {Router~updateContactCallback} callback - Optional completion calback
 * @returns {Contact}
 */
Router.prototype.updateContact = function (contact, callback) {
    var bucketIndex = utils.getBucketIndex(this._self.nodeID, contact.nodeID);

    this._log.debug('updating contact %j', contact);
    assert(bucketIndex < constants.B, 'Bucket index cannot exceed B');

    if (!this._buckets[bucketIndex]) {
        this._log.debug('creating new bucket for contact at index %d', bucketIndex);
        this._buckets[bucketIndex] = new Bucket();
    }

    var bucket = this._buckets[bucketIndex];
    var done = callback || function () { };

    contact.seen();

    if (this.inactive_contacts[contact.nodeID]) {
        this._log.debug('remove contact %s from inactive list', contact.nodeID);
        this.inactive_contacts[contact.nodeID] = null;
        delete this.inactive_contacts[contact.nodeID];
    }

    if (bucket.hasContact(contact.nodeID)) {
        this._moveContactToTail(contact, bucket, done);
    } else if (bucket.getSize() < constants.K) {
        this._moveContactToHead(contact, bucket, done);
    } else {
        this._pingContactAtHead(contact, bucket, done);
    }

    return contact;
};
/**
 * This callback is called upon completion of {@link Router#updateContact}
 * @callback Router~updateContactCallback
 */

/**
* Move the contact to the bucket's tail
* @private
* @param {Contact} contact
* @param {Bucket} bucket
* @param {Function} callback
*/
Router.prototype._moveContactToTail = function (contact, bucket, callback) {
    this._log.debug('contact already in bucket, moving to tail');
    bucket.removeContact(contact);
    bucket.addContact(contact);
    this.emit('shift', contact, bucket, bucket.indexOf(contact));
    callback(null, true);
};

/**
 * Move the contact to the bucket's head
 * @private
 * @param {Contact} contact
 * @param {Bucket} bucket
 * @param {Function} callback
 */
Router.prototype._moveContactToHead = function (contact, bucket, callback) {
    this._log.debug('contact not in bucket, moving to head');
    bucket.addContact(contact);
    this.emit('add', contact, bucket, bucket.indexOf(contact));
    callback(null, true);
};

/**
 * Ping the contact at head and if no response, replace with contact
 * @private
 * @param {Contact} contact
 * @param {Bucket} bucket
 * @param {Function} callback
 */
Router.prototype._pingContactAtHead = function (contact, bucket, callback) {
    var self = this;
    var ping = new Message({ method: 'PING', params: { contact: this._self } });
    var head = bucket.getContact(0);

    if (!head) {
        return callback(null, false); // NB: Do nothing if no contact at head
    }

    // NB: Let's not DoS our head contact in the event that this bucket is
    // NB: very busy - instead let's check the last time we saw her and if
    // NB: we have communicated via other means with that contact and we
    // NB: do not need to ping her.
    if (Date.now() - head.lastSeen < Router.PING_TTL) {
        return callback(null, false);
    }

    // NB: Prevent PING to death if a large update is applied to this bucket
    // NB: by pretending to have seen the head contact just now
    head.seen();

    this._log.debug('no room in bucket, sending PING to contact at head');
    this._rpc.send(head, ping, function (err) {
        if (err) {
            //self._log.debug('head contact did not respond, replacing with new');

            // NB: It's possible that the head contact has changed between pings
            // NB: timeout, so we need to make sure that we get the *most* stale
            // NB: contact.
            head = bucket.getContact(0) || head;

            bucket.removeContact(head);
            bucket.addContact(contact);
            self.emit('drop', head, bucket, bucket.indexOf(head));
            self.emit('add', contact, bucket, bucket.indexOf(contact));
            callback(null, true);
        } else {
            bucket.removeContact(head);
            bucket.addContact(head);
            callback(null, false);
        }
    });
};

/**
 * Return contacts closest to the given key
 * @param {String} key - Lookup key for getting close {@link Contact}s
 * @param {Number} limit - Maximum number of contacts to return
 * @param {String} nodeID - Node ID to exclude from results
 * @returns {Array}
 */
Router.prototype.getNearestContacts = function (key, limit, nodeID) {
    var self = this;
    var contacts = [];
    var index = utils.getBucketIndex(this._self.nodeID, utils.createID(key));
    var ascBucketIndex = index;
    var descBucketIndex = index;

    function addNearestFromBucket(bucket) {
        self._getNearestFromBucket(
            bucket,
            utils.createID(key),
            limit - contacts.length
        ).forEach(function addToContacts(contact) {
            var isContact = contact instanceof Contact;
            var poolNotFull = contacts.length < limit;
            var notRequester = contact.nodeID !== nodeID;

            if (isContact && poolNotFull && notRequester) {
                contacts.push(contact);
            }
        });
    }

    addNearestFromBucket(this._buckets[index]);

    while (contacts.length < limit && ascBucketIndex < constants.B) {
        ascBucketIndex++;
        addNearestFromBucket(this._buckets[ascBucketIndex]);
    }

    while (contacts.length < limit && descBucketIndex >= 0) {
        descBucketIndex--;
        addNearestFromBucket(this._buckets[descBucketIndex]);
    }

    return contacts;
};

/**
 * Get the contacts closest to the key from the given bucket
 * @private
 * @param {Bucket} bucket
 * @param {String} key
 * @param {Number} limit
 * @returns {Array}
 */
Router.prototype._getNearestFromBucket = function (bucket, key, limit) {
    if (!bucket) {
        return [];
    }

    var nearest = bucket.getContactList().map(function addDistance(contact) {
        return {
            contact: contact,
            distance: utils.getDistance(contact.nodeID, key)
        };
    }).sort(function sortKeysByDistance(a, b) {
        return utils.compareKeys(a.distance, b.distance);
    }).splice(0, limit).map(function pluckContact(c) {
        return c.contact;
    });

    return nearest;
};

/**
 * Validates a key/value pair (defaults to true)
 * @private
 * @param {String} key
 * @param {String} value
 * @param {Function} callback
 */
Router.prototype._validateKeyValuePair = function (key, value, callback) {
    if (typeof this._validator === 'function') {
        return this._validator(key, value, callback);
    }

    callback(true);
};

module.exports = Router;