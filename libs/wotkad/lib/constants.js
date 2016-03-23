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

var ms = require('ms');

/**
* Protocol constants
* #exports
* @see http://xlattice.sourceforge.net/components/protocol/kademlia/specs.html#constants
*/
module.exports = {
    
    ALPHA: 3,
    B: 160,
    K: 20,
    
    // TODO make these configurable
    T_REFRESH: ms('86300s'),
    T_REPLICATE: ms('86300s'),  
    T_REPUBLISH: ms('86300s'),
    T_EXPIRE: ms('86400s'),   // must be bigger than the replicate so the to be delete keys can be replicated before their delete
    
    T_OFFLMSGREP: 5000,
    
    // TODO make this configurable
    T_MSG_EXPIRE: ms('259200s'), // 72 hours of message expiry
    
    // TODO make this configurable
    T_ITEM_EXPIRE: ms('86460s'), // 24 hours of item expiry
    
    T_RESPONSETIMEOUT: ms('5s'),
    
    T_MAINTAIN_INTERVAL: 120000,     
   
    MESSAGE_TYPES: [
        'PING',
        'PONG',
        'STORE',
        'STORE_REPLY',
        'FIND_NODE',
        'FIND_NODE_REPLY',
        'FIND_VALUE',
        'FIND_VALUE_REPLY',
        'PEERMSG'
    ]

};
