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

'use strict';


var inherits = require('util').inherits;
var events = require('events');
var signals = require('signals');

var signalobj;

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
        ONACCOUNTMSG: "onAccountMsg",
        ONPEERERROR: "onPeerError",
        ONFILEINIT: "onFileInit",
        ONSCREENOFFER: "onScreenOffer",
        ONCHATOFFER: "onChatOffer",
        ONFCHUNKSEND: "onFileChunkSend",
        ONFILECANCEL: "onFileCancel",
        ONINITPROGRESS: "onInitProgress",
        ONUSRKEYINIT: "onUserKeyInit"
    };
    
    this.CONTACT_ONLINE = "contact-online";
    this.APP_UINOTIFY = "app-ui-notify";
    this.UINAVIGATE = "ui-navigate";
    this.PEERMESSAGE = "peer-message-receive";

    this.APP_CMD = "application-command";

    this.ERROREVENT = "app-error-event";

    this.WS_MSG_RECEIVE = "ws-msg-receive";
    this.WS_IOTDATARCV_EVENT = "ws-iotdatarcv-event";

    events.EventEmitter.call(this);
}

AppEvents.prototype.navigate = function(page, params){
    this.emit(this.UINAVIGATE, page, params);
}

AppEvents.prototype.onNavigate = function (callback) {
    this.on(this.UINAVIGATE, function (page, params) {
        callback(page, params);
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


AppEvents.prototype.onPeerMsg = function (callback) {
    this.on(this.PEERMESSAGE, function (payload, info) {
        callback(payload, info);
    });
}

AppEvents.prototype.peermsg = function (payload, info) {
    this.emit(this.PEERMESSAGE, payload, info);
}

AppEvents.prototype.onError = function (callback) {
    this.on(this.ERROREVENT, function (errorcode, err, param) {
        callback(errorcode, err, param);
    });
}

AppEvents.prototype.error = function (errorcode, err, param) {
    this.emit(this.ERROREVENT, errorcode, err, param);
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

var SignalObj = (function(){

    function SignalEmitter() {
        this._signals = {};
    }

    var _proto = SignalEmitter.prototype = {

        addListener: function (id, handler, scope, priority) {
            if (!this._signals[id]) {
                this._signals[id] = new signals.Signal();
            }
            return this._signals[id].add(handler, scope, priority);
        },

        removeListener: function (id, handler) {
            var sig = this._signals[id];
            if (!sig) return;
            sig.remove(handler);
        },

        getSignal: function (id) {
            return this._signals[id];
        },

        dispatch: function (id, args) {
            var sig = this._signals[id];
            if (!sig) return;
            if (args) {
                sig.dispatch.apply(sig, args);
            } else {
                sig.dispatch();
            }
        }
    };

    SignalEmitter.augment = function (target) {
        SignalEmitter.call(target);
        for (var key in _proto) {
            if (_proto.hasOwnProperty(key)) {
                target[key] = _proto[key];
            }
        }
    };

    return SignalEmitter;
 
})();

AppEvents.prototype.addListener = function (event, handler) {
    try {
        signalobj.addListener(event, handler);
    }
    catch (err) {
        console.log("AppEvents.addListener error: %s", err.message);
    }
}

AppEvents.prototype.dispatch = function (event, param1, param2, param3, param4, param5) {
    try {
        var array = [];
        if (param1) {
            array.push(param1);
        }
        if (param2) {
            array.push(param2);
        }
        if (param3) {
            array.push(param3);
        }
        if (param4) {
            array.push(param4);
        }
        if (param5) {
            array.push(param5);
        }
        signalobj.dispatch(event, array);
    }
    catch (err) {
        console.log("AppEvents.dispatch error: %s", err.message);
    }
}

AppEvents.prototype.removeSignal = function (event, handler) {
    try {
        signalobj.removeListener(event, handler);
    }
    catch (err) {
        console.log("AppEvents.dispatch error: %s", err.message);
    }
}


var instance;
if (!instance) {
    instance = new AppEvents();
    signalobj = new SignalObj();
}

module.exports = instance;
