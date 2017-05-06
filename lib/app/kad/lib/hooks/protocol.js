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
var merge = require('merge');
var Message = require('../message');

/**
 * Factory for protocol extentions
 * @function
 * @param {Object} protocolspec - dictionary of methods
 * @returns {Function}
 */
module.exports = function ProtocolFactory(protocolspec) {
  assert(typeof protocolspec === 'object', 'Invalid protocol specification');

  return function protocol(message, contact, next) {
    var rpc = this;

    // if this is a response, just pass it along to execute callback
    if (Message.isResponse(message)) {
      return next();
    }

    // lookup the method defined in the protocol spec
    var method = protocolspec[message.method];

    // pass on message if it is not defined in protocol
    if (typeof method !== 'function') {
      return next();
    }

    // call the method and halt the middleware stack here
    method.call(rpc, message.params, function(err, result) {
      var reply = new Message({
        error: err,
        result:  merge({ contact: rpc._contact }, result),
        id: message.id
      });

      rpc.send(contact, reply);
    });
  };
};
