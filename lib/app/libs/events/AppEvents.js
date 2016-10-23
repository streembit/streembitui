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

'use strict';


var inherits = require('util').inherits;
var events = require('events');

inherits(AppEvents, events.EventEmitter);

function AppEvents() {
    
    this.APPEVENT = "streembit-app-event";

    this.TYPES = {
        ONAPPNAVIGATE: "onAppNavigate",
        ONUSERINIT: "onUserInitialize",
        ONUSERPUBLISH: "onUserPublish",
        ONDATAPUBLISH: "onDataPublish",
        ONCALLWEBRTCSIGNAL: "onCallWebrtcSignal",               //  For video/audio calls
        ONCALLWEBRTC_SSCSIG: "onCallWebrtcSscSig",              //  For screeen share
        ONCALLWEBRTC_SSAUDIOSIG: "onCallWebrtcSsAudioSig",      //  For screeen share audio call signals
        ONFILEWEBRTCSIGNAL: "onFileWebrtcSignal",
        ONVIDEOCONNECT: "onVideoConnect",
        ONTEXTMSG: "onTextMsg",
        ONPEERMSG: "onPeerMsg",
        ONACCOUNTMSG: "onAccountMsg",
        ONPEERERROR: "onPeerError",
        ONFCHUNKSEND: "onFileChunkSend",
        ONFILECANCEL: "onFileCancel",
        ONINITPROGRESS: "onInitProgress"
    };
    
    this.CONTACT_ONLINE = "contact-online";
    this.APP_INIT = "app-init";
    this.APP_UINOTIFY = "app-ui-notify";
    this.UINAVIGATE = "ui-navigate";

    events.EventEmitter.call(this);
}

AppEvents.prototype.navigate = function(route){
    this.emit(this.UINAVIGATE, route);
}

AppEvents.prototype.appinit = function (route) {
    this.emit(this.APP_INIT);
}

AppEvents.prototype.onNavigate = function (callback) {
    this.on(this.UINAVIGATE, function (value) {
        callback(value);
    });
}

AppEvents.prototype.onAppInit = function (callback) {
    this.on(this.APP_INIT, function () {
        callback();
    });
}


var instance;
if (!instance) {
    instance = new AppEvents();
}

module.exports = instance;
