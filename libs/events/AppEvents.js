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
        ONOFFLINEMSG: "onOfflineMsg",
        ONPEERERROR: "onPeerError",
        ONFCHUNKSEND: "onFileChunkSend",
        ONFILECANCEL: "onFileCancel",
        ONINITPROGRESS: "onInitProgress"
    }
    
    this.CONTACT_ONLINE = "contact-online";

    events.EventEmitter.call(this);
}


module.exports = AppEvents;
