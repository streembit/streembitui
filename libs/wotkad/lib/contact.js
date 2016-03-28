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

var assert = require('assert');
var utils = require('./utils');

/**
* Represent a contact (or peer)
* @constructor
* @param {object} options
*/
function Contact(options) {

    assert(this instanceof Contact, 'Invalid instance was supplied');
    assert(typeof options == "object", 'Invalid options were supplied');

    Object.defineProperty(
        this, 
        'nodeID', {
            value: options.nodeID || this._createNodeID(),
            configurable: false,
            enumerable: true
        }
    );

    assert(utils.isValidKey(this.nodeID), 'Invalid nodeID was supplied');

    this.seen();
}

/**
* Updates the lastSeen property to right now
* #seen
*/
Contact.prototype.seen = function() {
    this.lastSeen = Date.now();
};

/* istanbul ignore next */
/**
* Unimplemented stub, called when no nodeID is passed to constructor.
* #_createNodeID
*/
Contact.prototype._createNodeID = function() {
    throw new Error('Method not implemented');
};

module.exports = Contact;
