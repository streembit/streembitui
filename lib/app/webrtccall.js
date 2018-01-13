/*

This file is part of Streembit application. 
Streembit is an open source communication application. 

Streembit is a free software: you can redistribute it and/or modify it under the terms of the GNU General Public License 
as published by the Free Software Foundation, either version 3.0 of the License, or (at your option) any later version.

Streembit is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty 
of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU General Public License for more details.

You should have received a copy of the GNU General Public License along with Streembit software.  
If not, see http://www.gnu.org/licenses/.
 
-------------------------------------------------------------------------------------------------------------------------
Author: Tibor Zsolt Pardi 
Copyright (C) Streembit 2017
-------------------------------------------------------------------------------------------------------------------------

*/

'use strict';

var settings = require("settings");
var logger = require("applogger");
var webrtcadapter = require("webrtc-adapter");
var defs = require("definitions");
var peercomm = require("peercomm");
var appevents = require("appevents");


(function () {

    //  stream visualizer
    var WIDTH = 308;
    var HEIGHT = 231;
    var SMOOTHING = 0.8;
    var FFT_SIZE = 2048;

    function StreamVisualizer(stream, canvas) {
        console.log('Creating StreamVisualizer with stream and canvas: ', stream, canvas);
        this.canvas = canvas;
        this.drawContext = this.canvas.getContext('2d');

        // cope with browser differences
        if (typeof AudioContext === 'function') {
            this.context = new AudioContext();
        } else if (typeof webkitAudioContext === 'function') {
            this.context = new webkitAudioContext(); // eslint-disable-line new-cap
        } else {
            alert('Sorry! Web Audio is not supported by this browser');
        }

        // Create a MediaStreamAudioSourceNode from the stream
        this.source = this.context.createMediaStreamSource(stream);
        console.log('Created Web Audio source from remote stream: ', this.source);

        this.analyser = this.context.createAnalyser();
        //  this.analyser.connect(this.context.destination);
        this.analyser.minDecibels = -140;
        this.analyser.maxDecibels = 0;
        this.freqs = new Uint8Array(this.analyser.frequencyBinCount);
        this.times = new Uint8Array(this.analyser.frequencyBinCount);

        this.source.connect(this.analyser);

        this.startTime = 0;
        this.startOffset = 0;
    }

    StreamVisualizer.prototype.start = function () {
        requestAnimationFrame(this.draw.bind(this));
    };

    StreamVisualizer.prototype.draw = function () {
        this.analyser.smoothingTimeConstant = SMOOTHING;
        this.analyser.fftSize = FFT_SIZE;

        // Get the frequency data from the currently playing music
        this.analyser.getByteFrequencyData(this.freqs);
        this.analyser.getByteTimeDomainData(this.times);


        this.canvas.width = WIDTH;
        this.canvas.height = HEIGHT;
        // Draw the frequency domain chart.
        for (var i = 0; i < this.analyser.frequencyBinCount; i++) {
            var value = this.freqs[i];
            var percent = value / 256;
            var height = HEIGHT * percent;
            var offset = HEIGHT - height - 1;
            var barWidth = WIDTH / this.analyser.frequencyBinCount;
            var hue = i / this.analyser.frequencyBinCount * 360;
            this.drawContext.fillStyle = 'hsl(' + hue + ', 100%, 50%)';
            this.drawContext.fillRect(i * barWidth, offset, barWidth, height);
        }

        // Draw the time domain chart.
        for (i = 0; i < this.analyser.frequencyBinCount; i++) {
            value = this.times[i];
            percent = value / 256;
            height = HEIGHT * percent;
            offset = HEIGHT - height - 1;
            barWidth = WIDTH / this.analyser.frequencyBinCount;
            this.drawContext.fillStyle = 'white';
            this.drawContext.fillRect(i * barWidth, offset, 1, 2);
        }

        requestAnimationFrame(this.draw.bind(this));
    };

    StreamVisualizer.prototype.getFrequencyValue = function (freq) {
        var nyquist = this.context.sampleRate / 2;
        var index = Math.round(freq / nyquist * this.freqs.length);
        return this.freqs[index];
    };

    //  end stream visualizer


    var webrtccall = webrtccall || {};
    webrtccall.options = {};
    webrtccall.is_outgoing_call = false;
    webrtccall.connection = 0;
    webrtccall.ice_servers = 0;

    var localVideo;
    var contactVideo;
    var mediaStream;
    var remoteStream;

    function create_connection() {
        logger.debug('WebRTC: creating connection for ' + webrtccall.options.contact.name);

        // Create a new PeerConnection
        var servers = { iceServers: webrtccall.ice_servers };
        var connection = new RTCPeerConnection(servers);

        // ICE Candidate Callback
        connection.onicecandidate = function (event) {
            if (event.candidate) {
                // Found a new candidate
                logger.debug('WebRTC: onicecandidate, candidate: %j', event.candidate);
                var message = { cmd: defs.PEERMSG_CALL_WEBRTC, type: "candidate", "candidate": event.candidate };
                peercomm.send_peer_message(webrtccall.options.contact, message);
            }
            else {
                logger.debug('WebRTC: ICE candidate gathering is completed');
                if (remoteStream) {
                    logger.debug('WebRTC: call onRemoteStreamAdded()');
                    onRemoteStreamAdded(remoteStream);
                }
            }
        };

        connection.oniceconnectionstatechange = function () {
            console.log('ICE state change, state: ' + connection.iceConnectionState + ' event: %j', event);
        };

        connection.onnegotiationneeded = function () {
            if (webrtccall.is_outgoing_call) {
                logger.debug('WebRTC: connection.onnegotiationneeded -> create offer');

                var offerOptions = {
                    offerToReceiveAudio: 1,
                    offerToReceiveVideo: 1
                };

                // Send an offer for a connection
                connection.createOffer(offerOptions).then(
                    function (desc) {
                        try {
                            connection.setLocalDescription(desc, function () {
                                logger.debug("WebRTC: createOffer() callback. Send sdp localDescription");
                                var message = { cmd: defs.PEERMSG_CALL_WEBRTC, type: "sdp", "sdp": connection.localDescription };
                                peercomm.send_peer_message(webrtccall.options.contact, message);
                            });
                        }
                        catch (err) {
                            streembit.notify.error("setLocalDescription error: %j", err, true);
                        }
                    },
                    function (error) {
                        logger.error('connection createOffer error: ' + error);
                    }
                );
            }
        }

        connection.onaddstream = function (evt) {
            logger.debug('WebRTC: connection.onaddstream, set remote stream');
            remoteStream = evt.stream;
            if (webrtccall.is_outgoing_call) {
                logger.debug('is_outgoing_call == true, call onRemoteStreamAdded()');
                onRemoteStreamAdded(evt.stream);
            }
        };

        connection.onremovestream = function (event) {
            logger.debug('WebRTC: connection.onremovestream');
            // A stream was removed
            onStreamRemoved(event.stream.id);
        };

        // And return it
        return connection;
    }

    function getConnection() {
        if (!webrtccall.connection) {
            webrtccall.connection = create_connection();
        }
        return webrtccall.connection;
    }

    // Process a newly received Candidate signal
    function onCandidateSignalReceived(connection, candidate) {
        logger.debug('WebRTC: candidate %j', candidate);
     
        connection.addIceCandidate(new RTCIceCandidate(candidate)).then(
            function () {                    
            },
            function (err) {
                streembit.notify.error("WEBRTC: addIceCandidate error: %j", err, true);
            }
        );
    }

    // Process a newly received SDP signal
    function onSdpSignalReceived(connection, sdp) {

        logger.debug('WebRTC: processing sdp signal');

        var tdesc = new RTCSessionDescription(sdp);
        //logger.debug('sdp desc %j', tdesc);
        logger.debug('desc.type == ' + tdesc.type);

        try {
            connection.setRemoteDescription(
                tdesc,
                function () {
                    if (connection.remoteDescription.type == "offer" && !webrtccall.is_outgoing_call) { //  only the callee creates an answer
                        logger.info('WebRTC: received offer, sending response');
                        onReadyForStream(connection);
                        connection.createAnswer(
                            function (desc) {
                                connection.setLocalDescription(desc, function () {
                                    logger.debug('WebRTC: send sdp connection.localDescription:');
                                    logger.debug('%j', connection.localDescription);
                                    var message = { cmd: defs.PEERMSG_CALL_WEBRTC, type: "sdp", "sdp": connection.localDescription };
                                    peercomm.send_peer_message(webrtccall.options.contact, message);
                                });
                            },
                            function (error) {
                                logger.error('Error creating session description: ' + error);
                            }
                        );
                    }
                    else if (connection.remoteDescription.type == "answer") {
                        logger.info('WebRTC: caller setRemoteDescription success');
                    }
                },
                function (error) {
                    logger.error('setRemoteDescription error: %j', error);
                }
            );
        }
        catch (err) {
            streembit.notify.error("setRemoteDescription error: %j", err, true);
        }
    }

    // Hand off a new signal from the signaler to the connection
    // listen on the data received event
    webrtccall.onSignalReceive = function (data) {
        //var signal = JSON.parse(data);
        var connection = getConnection();

        logger.debug('WebRTC: received signal type: %s', data.type);

        // Route signal based on type
        if (data.sdp) {
            onSdpSignalReceived(connection, data.sdp);
        }
        else if (data.candidate) {
            onCandidateSignalReceived(connection, data.candidate);
        }
        else {
            logger.error('onReceiveSignal error: unknown signal type');
        }
    }

    webrtccall.show_video = function (callback) {
        try {
            var videoTracks = mediaStream.getVideoTracks();
            if (videoTracks.length === 0) {
                logger.debug('No local video available.');
                return;
            }

            for (var i = 0; i < videoTracks.length; ++i) {
                videoTracks[i].enabled = true;
            }

            logger.debug('Video ' + (videoTracks[0].enabled ? 'unmuted.' : 'muted.'));
            if (videoTracks[0].enabled) {
                callback();
            }
        }
        catch (err) {
            streembit.notify.error("Show video error: %j", err, true);
        }
    }

    webrtccall.hide_video = function (callback) {
        try {
            var videoTracks = mediaStream.getVideoTracks();
            if (videoTracks.length === 0) {
                logger.debug('No local video available.');
                return;
            }

            for (var i = 0; i < videoTracks.length; ++i) {
                videoTracks[i].enabled = false;
            }

            logger.debug('Video ' + (videoTracks[0].enabled ? 'unmuted.' : 'muted.'));
            if (!videoTracks[0].enabled) {
                callback();
            }
        }
        catch (err) {
            streembit.notify.error("Hide video error: %j", err, true);
        }
    }

    webrtccall.toggle_audio = function (ismute, callback) {
        var audioTracks = mediaStream.getAudioTracks();
        if (audioTracks.length === 0) {
            logger.debug('toggle_audio() No local audio available.');
            return;
        }

        logger.debug('Toggling audio mute state.');
        for (var i = 0; i < audioTracks.length; ++i) {
            audioTracks[i].enabled = !audioTracks[i].enabled;
        }

        logger.debug('Audio ' + (audioTracks[0].enabled ? 'unmuted.' : 'muted.'));
        callback();
    }

    function onReadyForStream(connection) {
        try {
            if (!mediaStream) {
                return streembit.notify.error_popup('Invalid media stream');
            }

            connection.addStream(mediaStream);
        }
        catch (err) {
            logger.error("onReadyForStream error " + err.message);
        }
    }

    //  public methods
    function call_contact() {
        try {
            if (!mediaStream) {
                return streembit.notify.error('Invalid media stream');
            }

            //  create a connection 
            var connection = getConnection(webrtccall.options.contact.name);
            // Add our audio/video stream
            connection.addStream(mediaStream);
            logger.debug('stream added to connection at the caller end');
        }
        catch (err) {
            streembit.notify.error("call_contact error %j", err);
        }
    }


    function onStreamRemoved(streamId) {
        try {
            logger.debug('Remove remote stream from contact video element');

            webrtccall.hangup();
        }
        catch (err) {
            logger.error("onStreamRemoved error " + err.message);
        }
    }


    function onRemoteStreamAdded(eventStream) {
        try {
            if (webrtccall.options.calltype == "videocall") {

                logger.debug('Bind remote stream to contact video element');
                // Bind the remote stream to the contact video control                
                contactVideo.srcObject = eventStream;
            }
            else {
                logger.debug('Bind remote stream to audio element');
                var audio = document.querySelector('audio');
                audio.srcObject = eventStream; 

                try {
                    var canvas = document.querySelector('canvas');
                    if (canvas) {
                        var streamVisualizer = new StreamVisualizer(eventStream, canvas);
                        streamVisualizer.start();
                    }
                }
                catch (err) { }
            }

            if (eventStream.active) {
                logger.debug("onRemoteStreamAdded: eventStream is active");
            }

            appevents.dispatch("on-remotestream-connect");
        }
        catch (err) {
            logger.error("onRemoteStreamAdded error: %j", err);
        }
    }

    // private variables and methods
    function onStreamCreated(stream) {
        try {
            logger.debug('Received local stream');

            if (webrtccall.options.calltype == "videocall") {
                localVideo.srcObject = stream;
            }
            else {
                var audioTracks = stream.getAudioTracks();
                logger.debug('Using audio device: ' + audioTracks[0].label);
            }

            mediaStream = stream;

            // create the connection and perform the call
            if (webrtccall.is_outgoing_call) {
                call_contact();
            }
        }
        catch (err) {
            logger.error("onStreamCreated error " + err.message);
        }
    }

    webrtccall.hangup = function () {
        logger.debug("MediaCall hangup()");
        if (webrtccall.connection) {
            try {
                webrtccall.connection.close();
                webrtccall.connection = null;
            }
            catch (e) { }
        }

        try {
            if (mediaStream) {
                mediaStream.getAudioTracks().forEach(function (track) {
                    track.stop();
                });

                mediaStream.getVideoTracks().forEach(function (track) {
                    track.stop();
                });
            }
        }
        catch (e) { }

        try {
            if (contactVideo) {
                contactVideo.srcObject = null;
            }

            if (localVideo) {
                localVideo.pause();
                localVideo.srcObject = null;
            }
        }
        catch (e) { }

        appevents.removeSignal("on-call-webrtc-signal", webrtccall.onSignalReceive);
    }

    function onLocalLoadedMetaData() {
        console.log('Local video videoWidth: ' + this.videoWidth + 'px,  videoHeight: ' + this.videoHeight + 'px');
    }

    function onContactLoadedMetaData() {
        console.log('Remote video videoWidth: ' + this.videoWidth + 'px,  videoHeight: ' + this.videoHeight + 'px');
    }

    //  public methods
    webrtccall.initcall = function (localvideo, contactvideo, options) {
        try {
            webrtccall.options = options;
            webrtccall.is_outgoing_call = options.iscaller;
            webrtccall.connection = null;
            webrtccall.ice_servers = settings.iceservers;

            if (!webrtccall.ice_servers) {
                throw new Error("Ice resolver configuration is missing");
            }

            logger.debug(options.calltype + " with %s", options.contact.name);

            if (options.calltype == "videocall") {
                localVideo = document.getElementById(localvideo);
                localVideo.addEventListener('loadedmetadata', onLocalLoadedMetaData);
                contactVideo = document.getElementById(contactvideo);
                contactVideo.addEventListener('loadedmetadata', onContactLoadedMetaData);
            }

            var params = {};
            if (options.calltype == "videocall") {
                params = { audio: true, video: true };
            }
            else {
                params = { audio: true, video: false };
            }

            navigator.mediaDevices.getUserMedia(params)
                .then(onStreamCreated)
                .catch(function (error) {
                    if (error.name === 'ConstraintNotSatisfiedError') {
                        streembit.notify.error(
                            'The resolution ' + constraints.video.width.exact + 'x' + constraints.video.width.exact +
                            ' px is not supported by your device.'
                        );
                    }
                    else if (error.name === 'PermissionDeniedError') {
                        streembit.notify.error(
                            'Permissions have not been granted to use your camera and ' +
                            'microphone, you need to allow the page access to your devices in order for the application to work.'
                        );
                    }
                    else if (error.name === 'NotFoundError') {
                        streembit.notify.error(
                            'Your camera and microphone devices returned not found error (NotFoundError).'
                        );
                    }
                    else {
                        streembit.notify.error('Get user media error: %j', error);
                    }
                });

            // add event handlers
            appevents.addListener("on-call-webrtc-signal", webrtccall.onSignalReceive);
        }
        catch (err) {
            streembit.notify.error("Media call initialization error: %j", err);
        }
    }


    module.exports = webrtccall;

}());

