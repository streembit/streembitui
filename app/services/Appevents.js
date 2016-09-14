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
    }

    this.CONTACT_ONLINE = "contact-online";

    events.EventEmitter.call(this);
}


module.exports = AppEvents;