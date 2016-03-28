/*

This file is part of Streemio application. 
Streemio is an open source project to create a real time communication system for humans and machines. 

Streemio is a free software: you can redistribute it and/or modify it under the terms of the GNU General Public License 
as published by the Free Software Foundation, either version 3.0 of the License, or (at your option) any later version.

Streemio is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of 
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU General Public License for more details.

You should have received a copy of the GNU General Public License along with Streemio software.  
If not, see http://www.gnu.org/licenses/.
 
-------------------------------------------------------------------------------------------------------------------------
Author: Tibor Zsolt Pardi 
Copyright (C) 2016 The Streemio software development team
-------------------------------------------------------------------------------------------------------------------------

This source file is based on https://github.com/gordonwritescode  

*/


'use strict';

var _ = require('lodash');
var assert = require('assert');
var constants = require('./constants');
var Contact = require('./contact');

/**
* Represents a contact bucket
* @constructor
*/
function Bucket() {
  if (!(this instanceof Bucket)) {
    return new Bucket();
  }

  this._contacts = [];
}

/**
* Return the number of contacts in this bucket
* #getSize
*/
Bucket.prototype.getSize = function() {
  return this._contacts.length;
};

/**
* Return the list of contacts in this bucket
* #getContactList
*/
Bucket.prototype.getContactList = function() {
  return _.clone(this._contacts);
};

/**
* Return the contact at the given index
* #getContact
* @param {number} index
*/
Bucket.prototype.getContact = function(index) {
  assert(index >= 0, 'Contact index cannot be negative');
  assert(index < constants.B, 'Contact index cannot be greater than `B`');

  return this._contacts[index] || null;
};

/**
* Adds the contact to the bucket
* #addContact
* @param {object} contact
*/
Bucket.prototype.addContact = function(contact) {
    assert(contact instanceof Contact, 'Invalid contact supplied');

    if (!this.hasContact(contact.nodeID)) {
        var index = _.sortedIndex(this._contacts, contact, function(contact) {
            return contact.lastSeen;
        });

        this._contacts.splice(index, 0, contact);
    }

    return this;
};

/**
* Removes the contact from the bucket
* #removeContact
* @param {object} contact
*/
Bucket.prototype.removeContact = function(contact) {
  var index = this.indexOf(contact);

  if (index >= 0) {
    this._contacts.splice(index, 1);
  }

  return this;
};

/**
* Returns boolean indicating that the nodeID is contained in the bucket
* #hasContact
* @param {string} nodeID
*/
Bucket.prototype.hasContact = function(nodeID) {
  for (var i = 0; i < this.getSize(); i++) {
    if (this._contacts[i].nodeID === nodeID) {
      return true;
    }
  }

  return false;
};

/**
* Returns the index of the given contact
* #indexOf
* @param {object} contact
*/
Bucket.prototype.indexOf = function(contact) {
    assert(contact instanceof Contact, 'Invalid contact supplied');

    for (var i = 0; i < this.getSize(); i++) {
        if (this.getContact(i).nodeID === contact.nodeID) {
            return i;
        }
    }

    return -1;
};

module.exports = Bucket;
