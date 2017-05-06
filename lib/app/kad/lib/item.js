/*
 
This file is part of Streembit application. 
Streembit is an open source project to create a real time communication system for humans and machines. 

Streembit is a free software: you can redistribute it and/or modify it under the terms of the GNU General Public License 
as published by the Free Software Foundation, either version 3.0 of the License, or (at your option) any later version.

Streembit is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of 
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU General Public License for more details.

You should have received a copy of the GNU General Public License along with Streembit software.  
If not, see http://www.gnu.org/licenses/.
 
-------------------------------------------------------------------------------------------------------------------------
Author: Tibor Zsolt Pardi 
Copyright (C) 2016 The Streembit software development team
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
var utils = require('./utils');

/**
 * Storage model for DHT items, which is serialized to JSON before being passed
 * to the storage adapter
 * @constructor
 * @param {String} key - Lookup key
 * @param {String|Object|Array} value - Stored value
 * @param {String} publisher - Original publisher's nodeID
 * @param {Number} timestamp - Optional UNIX timestamp of original publication
 */
function Item(key, value, publisher, timestamp) {
    if (!(this instanceof Item)) {
        return new Item(key, value, publisher, timestamp);
    }

    assert(typeof key === 'string', 'Invalid key supplied');
    assert(utils.isValidKey(publisher), 'Invalid publisher nodeID supplied');

    if (timestamp) {
        assert(typeof timestamp === 'number', 'Invalid timestamp supplied');
        assert(Date.now() >= timestamp, 'Timestamp cannot be in the future');
    }

    this.key = key;
    this.value = value;
    this.publisher = publisher;
    this.timestamp = timestamp || Date.now();
}

module.exports = Item;
