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
var utils = require('./utils');

/**
 * The base class from which custom contacts inherit; used by the included
 * {@link AddressPortContact}. Nodes provide each other with contact
 * information which indicates how others should communicate with them.
 * @constructor
 * @param {Object} options
 * @param {String} options.nodeID - Optional known 160 bit node ID
 */
function Contact(options) {
    if (!(this instanceof Contact)) {
        return new Contact(options);
    }

    assert(typeof options === 'object', 'Invalid options were supplied');

    Object.defineProperty(this, 'nodeID', {
        value: options.nodeID || this._createNodeID(),
        configurable: false,
        enumerable: true
    });

    assert(utils.isValidKey(this.nodeID), 'Invalid nodeID was supplied');

    this.seen();
}

/**
 * Updates the lastSeen property to right now
 */
Contact.prototype.seen = function () {
    this.lastSeen = Date.now();
};

/**
 * Validator function for determining if contact is okay
 * @abstract
 * @returns {Boolean}
 */
Contact.prototype.valid = function () {
    return true;
};

/**
 * Unimplemented stub, called when no nodeID is passed to constructor.
 * @private
 * @abstract
 */
Contact.prototype._createNodeID = function () {
    throw new Error('Method not implemented');
};

module.exports = Contact;
