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

var constants = require('./constants');
var hat = require('hat');
var merge = require('merge');

/**
 * Represents a [JSON-RPC 2.0](http://www.jsonrpc.org/specification) request or
 * response; used by {@link RPC#send}.
 *
 * Note that the value of the contact property will be replaced by the
 * {@link Contact} your implementation uses.
 *
 * The decision to use JSON-RPC as the message format was made to allow for
 * other language implementations and services to easily communicate with the
 * network, using a widely recognized and used format.
 * @constructor
 * @param {Object} spec
 * @param {String} spec.id - Message ID
 * @param {String} spec.method - Method name to include in request message
 * @param {Object} spec.params - Named parameters for request message
 * @param {Object} spec.result - Result data for response message
 * @param {Error} spec.error - Error object to convert to message
 */
function Message(spec) {
    if (!(this instanceof Message)) {
        return new Message(spec);
    }

    this.jsonrpc = '2.0';

    if (Message.isRequest(spec)) {
        this.id = spec.id || Message.createID();
        this.method = spec.method;
        this.params = spec.params;
    } else if (Message.isResponse(spec)) {
        this.id = spec.id;
        this.result = merge({}, spec.result);
        if (spec.error) {
            this.error = {
                code: -32603,
                message: spec.error.message
            };
        }
    } else {
        throw new Error('Invalid message specification');
    }
}

/**
 * Serialize message to a Buffer
 * @returns {Buffer}
 */
Message.prototype.serialize = function () {
    return new Buffer(JSON.stringify(this), 'utf8');
};

/**
 * Returns a boolean indicating if this message is a request
 * @param {Message} message - Message instance to inspect
 * @returns {Boolean}
 */
Message.isRequest = function (parsed) {
    return !!(parsed.method && parsed.params);
};

/**
 * Returns a boolean indicating if this message is a response
 * @param {Message} message - Message instance to inspect
 * @returns {Boolean}
 */
Message.isResponse = function (parsed) {
    return !!(parsed.id && (parsed.result || parsed.error));
};

/**
 * Create a Message instance from a buffer
 * @param {Buffer} buffer - Binary blob to convert to message object
 * @returns {Message}
 */
Message.fromBuffer = function (buffer) {
    function _convertByteArrays(key, value) {
        return value && value.type === 'Buffer' ? new Buffer(value.data) : value;
    }

    var parsed = JSON.parse(buffer.toString('utf8'), _convertByteArrays);
    var message = new Message(parsed);

    return message;
};

/**
 * Returns a message id
 * @returns {String}
 */
Message.createID = function () {
    return hat.rack(constants.B)();
};

module.exports = Message;
