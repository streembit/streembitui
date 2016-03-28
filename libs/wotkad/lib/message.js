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
var constants = require('./constants');
var merge = require('merge');
var Contact = require('./contact');

/**
* Represents a message to be sent over RPC
* @constructor
* @param {string} type
* @param {object} params
* @param {object} fromContact
*/
function Message(type, params, fromContact) {
    if (!(this instanceof Message)) {
        return new Message(type, params, fromContact);
    }

    assert(constants.MESSAGE_TYPES.indexOf(type) !== -1, 'Invalid message type');
    assert(fromContact instanceof Contact, 'Invalid contact supplied');

    this.type = type;
    this.params = merge(params, fromContact);
}

/**
* Serialize message to a Buffer
* #serialize
*/
Message.prototype.serialize = function() {
    return new Buffer(JSON.stringify(this), 'utf8');
};

module.exports = Message;
