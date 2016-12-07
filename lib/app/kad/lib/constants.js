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

/**
 * @module kad/constants
 */

'use strict';

var ms = require('ms');

module.exports = {

    /** @constant {Number} ALPHA - Degree of parallelism */
    ALPHA: 3,

    /** @constant {Number} B - Number of bits for nodeID creation */
    B: 160,

    /** @constant {Number} K - Number of contacts held in a bucket */
    K: 20,

    /** @constant {Number} T_REFRESH - Interval for performing router refresh */
    T_REFRESH: ms('3600s'),

    /** @constant {Number} T_REPLICATE - Interval for replicating local data */
    T_REPLICATE: ms('3600s'),

    /** @constant {Number} T_REPUBLISH - Interval for republishing data */
    T_REPUBLISH: ms('86400s'),

    /** @constant {Number} T_EXPIRE - Interval for expiring local data entries */
    T_EXPIRE: ms('86405s'),

    /** @constant {Number} T_RESPONSETIMEOUT - Time to wait for RPC response */
    T_RESPONSETIMEOUT: ms('5s'),

    /** @constant {Array} MESSAGE_TYPES - Allowed RPC methods */
    MESSAGE_TYPES: [
        'PING',
        'STORE',
        'FIND_NODE',
        'FIND_VALUE'
    ]

};