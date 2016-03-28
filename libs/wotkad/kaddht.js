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
var async = require('async');
var Node = require('./lib/node');

/**
* Creates a new K-Node and returns it
* #createNode
* @param {object} options
* @param {function} onConnect
*/
module.exports = function createNode(options) {
    return new Node(options);
};

module.exports.Bucket = require('./lib/bucket');
module.exports.Contact = require('./lib/contact');
module.exports.Message = require('./lib/message');
module.exports.Node = require('./lib/node');
module.exports.Router = require('./lib/router');
module.exports.transports = require('./lib/transports');
module.exports.utils = require('./lib/utils');
module.exports.constants = require('./lib/constants');
