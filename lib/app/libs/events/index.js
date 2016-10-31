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
    this.CONTACTS = "contacts-event";
    this.ACCOUNTINIT = "account-net-init";

    this.APP_CMD = "application-command";

    events.EventEmitter.call(this);
}

AppEvents.prototype.appinit = function (route) {
    this.emit(this.APP_INIT);
}

AppEvents.prototype.navigate = function(page, params){
    this.emit(this.UINAVIGATE, page, params);
}

AppEvents.prototype.onNavigate = function (callback) {
    this.on(this.UINAVIGATE, function (page, params) {
        callback(page, params);
    });
}

AppEvents.prototype.onAppInit = function (callback) {
    this.on(this.APP_INIT, function () {
        callback();
    });
}

AppEvents.prototype.send = function (cmd, payload, info) {
    this.emit(this.APPEVENT, cmd, payload, info);
}

AppEvents.prototype.onAppEvent = function (callback) {
    this.on(this.APPEVENT, function (eventcmd, payload, info) {
        callback(eventcmd, payload, info);
    });
}

AppEvents.prototype.onAppCommand = function (callback) {
    this.on(this.APP_CMD, function (cmd) {
        callback(cmd);
    });
}

AppEvents.prototype.cmd = function (cmd, payload) {
    this.emit(this.APP_CMD, cmd, payload );
}

AppEvents.prototype.contacts = function (event, data, payload) {
    this.emit(this.CONTACTS, event, data, payload);
}

AppEvents.prototype.onContactsEvent = function (callback) {
    this.on(this.CONTACTS, function (event, data, payload) {
        callback(event, data, payload);
    });
}

AppEvents.prototype.onAccountInit = function (callback) {
    this.on(this.ACCOUNTINIT, function (account) {
        callback(account);
    });
}

AppEvents.prototype.accountinit = function (account) {
    this.emit(this.ACCOUNTINIT, account);
}


//
//  Remove event listener instances
//
AppEvents.prototype.remove = function (event, handler) {
    try {
        this.removeListener(event, handler);
    }
    catch (err) {
        console.log("AppEvents.remove error: %s", err.message);
    }
}

var instance;
if (!instance) {
    instance = new AppEvents();
}

module.exports = instance;
