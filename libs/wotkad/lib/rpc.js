/*

This file is part of Streemio application. 
Streemio is an open source project to create a real time communication system for humans and machines. 

Streemio is a free software: you can redistribute it and/or modify it under the terms of the GNU General Public License 
as published by the Free Software Foundation, either version 3.0 of the License, or (at your option) any later version.

Streemio is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of 
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU General Public License for more details.

You should have received a copy of the GNU General Public License along with W3C Web-of-Things-Framework.  
If not, see http://www.gnu.org/licenses/.
 
-------------------------------------------------------------------------------------------------------------------------
Author: Tibor Zsolt Pardi 
Copyright (C) 2016 The Streemio software development team
-------------------------------------------------------------------------------------------------------------------------

This source file is based on https://github.com/gordonwritescode  

*/

'use strict';

var inherits = require('util').inherits;
var events = require('events');
var assert = require('assert');
var dgram = require('dgram');
var hat = require('hat');
var merge = require('merge');
var constants = require('./constants');
var Contact = require('./contact');
var Message = require('./message');

inherits(RPC, events.EventEmitter);

/**
* Represents an RPC interface
* @constructor
* @param {object} options
*/
function RPC(options) {

    assert(this instanceof RPC, 'Invalid instance supplied');

    var self = this;

    events.EventEmitter.call(this);
    
    this._log = options.log;

    this._createMessageID = hat.rack(constants.B);
    this._pendingCalls = {};

    //this._log.debug('create node contact object');

    this._contact = this._createContact(options);

    //this._log.debug('contact created');

    setInterval(this._expireCalls.bind(this), constants.T_RESPONSETIMEOUT + 5);
}

/**
* Send a RPC to the given contact
* #send
* @param {object} contact
* @param {object} message
* @param {function} callback
*/
RPC.prototype.send = function (contact, message, callback) {

    contact = this._createContact(contact);

    //assert(contact.address && contact.port, 'Invalid contact supplied');
    //assert(contact instanceof Contact, 'Invalid contact supplied');
    assert(message instanceof Message, 'Invalid message supplied');

    merge(message.params, {
        rpcID: this._createMessageID()
    });

    var data = message.serialize();
    var offset = 0;
    
    //this._log.debug('RPC.send');

    this._send(data, contact);

    if (typeof callback === 'function') {
        //this._log.debug('RPC.send add pendingCalls');
        this._pendingCalls[message.params.rpcID] = {
            timestamp: Date.now(),
            callback: callback
        };
    }
};

//  The message parameter must be a buffer
RPC.prototype.peer_send = function (contact, message) {
    assert(contact && contact.address && contact.port, 'RPC peer_send error: Invalid contact supplied');
    assert(message && (typeof message == "object" || typeof message == "Object" || typeof message == "Buffer" || typeof message == "buffer"), 
        'RPC peer_send error: Invalid message supplied');

    //var data = new Buffer(JSON.stringify(message), 'utf8');
    this._send(message, contact);
};


/**
* Close the underlying socket
* #close
*/
RPC.prototype.close = function() {
    this._close();
};

/**
* Handle incoming messages
* #_handleMessage
* @param {buffer} buffer
* @param {object} info
*/
RPC.prototype._handleMessage = function(buffer, info) {
    var message;
    var data;
    var params;
    var contact;

    try {
        data = JSON.parse(buffer.toString('utf8'));
        params = data.params;
        contact = this._createContact(params);
        message = new Message(data.type, params, contact);

        //this._log.debug('received valid message %j', message); 
    } 
    catch (err) {
        this.emit('MESSAGE_DROP', buffer, info);
        return this._log.error('_handleMessage error %j', err); 
    }

    var referenceID = message.params.referenceID;
    var pendingCall = this._pendingCalls[referenceID];

    if (referenceID && pendingCall) {
        //this._log.debug('_handleMessage call callback', message); 
        pendingCall.callback(null, message.params);
        delete this._pendingCalls[referenceID];
        
        if (message.type == "PONG") {
            this.emit(message.type, message.params, info);
        }
    } 
    else {
        this.emit('CONTACT_SEEN', contact);
        
        //this._log.debug('_handleMessage emit message %s', message.type); 
        this.emit(message.type, message.params, info);
    }
};

/**
* Expire RPCs that have not received a reply
* #_expireCalls
*/
RPC.prototype._expireCalls = function() {
    for (var rpcID in this._pendingCalls) {
        var pendingCall = this._pendingCalls[rpcID];
        var timePassed = Date.now() - pendingCall.timestamp;

        if (timePassed > constants.T_RESPONSETIMEOUT) {
            this._log.error('_expireCalls rpcID: ' + rpcID); 
            pendingCall.callback(new Error('RPC with ID `' + rpcID + '` timed out'));
            delete this._pendingCalls[rpcID];
        }
    }
};

/* istanbul ignore next */
/**
* Unimplemented stub, called on close()
* #_close
*/
RPC.prototype._close = function() {
    throw new Error('Method not implemented');
};

/* istanbul ignore next */
/**
* Unimplemented stub, called on send()
* #_send
* @param {buffer} data
* @param {Contact} contact
*/
RPC.prototype._send = function(data, contact) {
    throw new Error('Method not implemented');
};

/* istanbul ignore next */
/**
* Unimplemented stub, called in RPC()
* #_createContact
* @param {object} options
*/
RPC.prototype._createContact = function(options) {
    throw new Error('Method not implemented');
};

module.exports = RPC;
