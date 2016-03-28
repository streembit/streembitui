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

*/

'use strict';

var inherits = require('util').inherits;
var events = require('events');

inherits(AppEvents, events.EventEmitter);


function AppEvents() {
    
    this.APPEVENT = "streemio-app-event";

    this.TYPES = {
        ONAPPNAVIGATE: "onAppNavigate",
        ONUSERINIT: "onUserInitialize",
        ONUSERPUBLISH: "onUserPublish",
        ONDATAPUBLISH: "onDataPublish",
        ONCALLWEBRTCSIGNAL: "onCallWebrtcSignal",
        ONFILEWEBRTCSIGNAL: "onFileWebrtcSignal",
        ONVIDEOCONNECT: "onVideoConnect",
        ONTEXTMSG: "onTextMsg",
        ONPEERMSG: "onPeerMsg",
        ONACCOUNTMSG: "onAccountMsg",
        ONPEERERROR: "onPeerError",
        ONFCHUNKSEND: "onFileChunkSend",
        ONFILECANCEL: "onFileCancel",
        ONINITPROGRESS: "onInitProgress"
    }
    
    this.CONTACT_ONLINE = "contact-online";

    events.EventEmitter.call(this);
}


module.exports = AppEvents;
