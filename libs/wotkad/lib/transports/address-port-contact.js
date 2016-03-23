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

var assert = require('assert');
var Contact = require('../contact');
var inherits = require('util').inherits;
var utils = require('../utils');

inherits(AddressPortContact, Contact);

/**
* Represent a contact (or peer)
* @constructor
* @param {object} options
*/
function AddressPortContact(options) {

    if (!(this instanceof AddressPortContact)) {
        return new AddressPortContact(options);
    }

    assert(typeof options == "object", 'Invalid options were supplied');
    assert(typeof options.address === 'string', 'Invalid address was supplied');
    assert(typeof options.port === 'number', 'Invalid port was supplied');
    assert(typeof options.account === 'string', 'Invalid account was supplied');

    this.address = options.address;
    this.port = options.port;
    this.account = options.account;

    Contact.call(this, options)
}


/**
* Generate a NodeID by taking the SHA1 hash of the account
* #_createNodeID
*/
AddressPortContact.prototype._createNodeID = function() {
    return utils.createID(this.account); 
};

/**
* Generate a user-friendly string for the contact
* #_toString
*/
AddressPortContact.prototype.toString = function() {
    return this.address + ':' + this.port;
};

module.exports = AddressPortContact;
