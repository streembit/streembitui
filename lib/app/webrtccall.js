﻿/*

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
var errcodes = require("errcodes");
var errhandler = require("errhandler");



(function () {

    //  stream visualizer
    var WIDTH = 308;
    var HEIGHT = 231;
    var SMOOTHING = 0.8;
    var FFT_SIZE = 2048;
    const LOW_FREQ = 120;

    var isNegotiating = false;  // Workaround for Chrome: skip nested negotiations

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

        //checking for low frequency
        let isLow = true;
        for(let i = 0; i < this.freqs.length; i++) {
            if(this.freqs[i] > LOW_FREQ) {
                isLow = false;
                break;
            }
        }

        if(!$('.spallWindMuteIc').hasClass('muted')) {
            if(isLow) {
                $('.smSpeakSt > i').removeClass('fa fa-volume-up');
                $('.smSpeakSt > i').addClass('fa fa-volume-off');
                $('.smSpeakSt > i').css({'color': '#999'});
            } else {
                $('.smSpeakSt > i').removeClass('fa fa-volume-off');
                $('.smSpeakSt > i').addClass('fa fa-volume-up');
                $('.smSpeakSt > i').css({'color': '#6893c7'});
            }
        }

        this.canvas.width = WIDTH;
        this.canvas.height = HEIGHT;

        // Draw the frequency domain chart.
        for (var i = 0; i < this.analyser.frequencyBinCount; i++) {
            var value = this.freqs[i];
            var percent = value / 256;
            var height = HEIGHT * percent;
            var offset = HEIGHT - height - 1;
            var barWidth = WIDTH / this.analyser.frequencyBinCount;
            var hue = i / this.analyser.frequencyBinCount * 270;
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
    webrtccall.connection = {};
    webrtccall.ice_servers = 0;
    window.isCallReady = false;

    var localVideo;
    var contactVideo;
    var mediaStreams = [];
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
                if (remoteStream && !webrtccall.is_outgoing_call) {
                    logger.debug('WebRTC: call onRemoteStreamAdded()');
                    onRemoteStreamAdded(remoteStream);
                }
            }
        };

        connection.oniceconnectionstatechange = function () {
            console.log('ICE state change, state: ' + connection.iceConnectionState + ' event: %j', event);
        };
        connection.onsignalingstatechange =  function () {  // Workaround for Chrome: skip nested negotiations
            if(webrtccall.options.calltype == "videocall") // this weakaround only needed in case of video call
                isNegotiating = (connection.signalingState != "stable");
        };
        connection.onnegotiationneeded = function () {
            if (isNegotiating && webrtccall.options.calltype == "videocall") {
                logger.debug("WebRTC: connection.onnegotiationneeded -> SKIP nested negotiations");
                return;
            }
            isNegotiating = true;
            if (webrtccall.is_outgoing_call) {
                logger.debug('WebRTC: connection.onnegotiationneeded -> create offer');

                var offerOptions = {
                    offerToReceiveAudio: 1,
                    offerToReceiveVideo: 1
                };
                // Send an offer for a connection
                connection.createOffer(offerOptions).then( function (offer) {
                        return connection.setLocalDescription(offer);
                }).then(function() {
                        logger.debug("WebRTC: createOffer() callback. Send sdp localDescription");
                        var message = { cmd: defs.PEERMSG_CALL_WEBRTC, type: "sdp", "sdp": connection.localDescription };
                        peercomm.send_peer_message(webrtccall.options.contact, message);
                })
                .catch(function(reason) {
                    // streembit.notify.error("setLocalDescription error: %j", err, true);
                    streembit.notify.error(errhandler.getmsg(errcodes.UI_SETLOCALDESCRIPTION_ERR, err, true));
                    logger.error('connection createOffer error: ' + error);
                 });
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

    function getConnection(name) {
        if (!webrtccall.connection[name]) {
            webrtccall.connection[name] = create_connection();
        }
        return webrtccall.connection[name];
    }

    // Process a newly received Candidate signal
    function onCandidateSignalReceived(connection, candidate) {
        logger.debug('WebRTC: candidate %j', candidate);

        connection.addIceCandidate(new RTCIceCandidate(candidate)).then(
            function () {
            },
            function (err) {
                // streembit.notify.error("WEBRTC: addIceCandidate error: %j", err, true);
                streembit.notify.error(errhandler.getmsg(errcodes.UI_WEBRTC_ADDICECANDIDATE_ERR, err, true));
            }
        );
    }

    // Process a newly received SDP signal
    function onSdpSignalReceived(connection, sdp) {
        logger.debug('WebRTC: processing sdp signal');
        var tdesc = new RTCSessionDescription(sdp);
        logger.debug('desc.type == ' + tdesc.type);

        connection.setRemoteDescription(tdesc)
        .then(function () {
             if (connection.remoteDescription.type == "offer" )
                onReadyForStream(connection);
        })
        .then(function () {
            //  only the callee creates an answer
            if (connection.remoteDescription.type == "offer" && !webrtccall.is_outgoing_call) { 
                logger.info('WebRTC: received offer, sending response');
                connection.createAnswer()
                .then(function (answer) {
                    if(answer)
                        connection.setLocalDescription(answer);
                }).then(function () {
                    logger.debug('WebRTC: send sdp connection.localDescription:');
                    logger.debug('%j', connection.localDescription);
                    var message = { cmd: defs.PEERMSG_CALL_WEBRTC, type: "sdp", "sdp": connection.localDescription };
                    peercomm.send_peer_message(webrtccall.options.contact, message);
                })
            }
            else if (connection.remoteDescription.type == "answer") {
                logger.info('WebRTC: caller setRemoteDescription success');
            }
        }).catch(function(err) {
            // streembit.notify.error("setRemoteDescription error: %j", err, true);
            streembit.notify.error(errhandler.getmsg(errcodes.UI_SETREMOTEDESCRIPTION_ERR, err, true));
        });
    }

    // Hand off a new signal from the signaler to the connection
    // listen on the data received event
    webrtccall.onSignalReceive = function (data) {
        var connection = getConnection(webrtccall.options.contact.name);

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
            // streembit.notify.error("Show video error: %j", err, true);
            streembit.notify.error(errhandler.getmsg(errhandler.UI_SHOW_VIDEO_ERR, err, true));
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
            // streembit.notify.error("Hide video error: %j", err, true);
            streembit.notify.error(errhandler.getmsg(errcodes.UI_HIDE_VIDEO_ERR, err, true));
        }
    }

    webrtccall.toggle_audio = function (ismute, callback) {
        var audioTrackses = [];
        var audioTracks;
        mediaStreams.forEach(function (mediaStream) {
            audioTrackses.push(mediaStream.getAudioTracks());
        });
        if (audioTrackses.length === 0) {
            logger.debug('toggle_audio() No local audio available.');
            return;
        }

        logger.debug('Toggling audio mute state.');
        audioTrackses.forEach(function(audioTracks) {
            for (var i = 0; i < audioTracks.length; ++i) {
                audioTracks[i].enabled = !audioTracks[i].enabled;
                
                logger.debug('Audio ' + (audioTracks[i].enabled ? 'unmuted.' : 'muted.'));
            }
        });
        callback();
    }

    function onReadyForStream(connection) {
        try {
            if (mediaStreams.length == 0) {
                return streembit.notify.error('Invalid media stream');
            }
            // mediaStreams.forEach(function (mediaStream) {
            //     connection.addStream(mediaStream);
            // });
            var lastStream = mediaStreams[Object.keys(mediaStreams)[Object.keys(mediaStreams).length - 1]];
            connection.addStream(lastStream);
        }
        catch (err) {
            logger.error("onReadyForStream error " + err.message);
        }
    }

    //  public methods
    function call_contact() {
        try {
            if (mediaStreams.length == 0) {
                // return streembit.notify.error('Invalid media stream');
                return streembit.notify.error(errhandler.getmsg(errcodes.UI_INVALID_MEDIA_STREAM));
            }
            if(!$('#smallScreenVideoCall1').hasClass('active')) {
            //  create a connection
            var connection = getConnection(webrtccall.options.contact.name);
            // Add our audio/video stream
            mediaStreams.forEach(function (mediaStream) {
                // connection.addStream(mediaStream);
                console.log(mediaStream);
            });
            var lastStream = mediaStreams[Object.keys(mediaStreams)[Object.keys(mediaStreams).length - 1]];
            connection.addStream(lastStream);
            logger.debug('stream added to connection at the caller end');
            } else {
                $("#videoCall .remotevid").remove();
                $(".call-with .call-time").remove();
                var smVideo = $('#smallScreenVideoCall1 .remotevid').detach();
                var callTime = $('#smallScreenVideoCall1 .call-time').detach();
                $("#videoCall .remotevid_parent").append(smVideo);
                $(".call-with").append(callTime);
                $('#smallScreenVideoCall1').removeClass('active');
                $('#remotevid').get(0).play();
            }
        }
        catch (err) {
            // streembit.notify.error("call_contact error %j", err);
            streembit.notify.error(errhandler.getmsg(errcodes.UI_CALL_CONTACT_ERR, err));
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
                var elnum = webrtccall.options.elnum || 0;
                var audio = document.getElementsByClassName('remote-audio')[elnum];
                audio.srcObject = eventStream;

                try {
                    var canvas = document.getElementsByClassName('audio-viz')[elnum];
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

            appevents.dispatch("on-remotestream-connect", webrtccall.options.contact);
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

            mediaStreams.push(stream);

            // create the connection and perform the call
            if (webrtccall.is_outgoing_call) {
                call_contact();
            }
            // add event handlers
            appevents.addListener("on-call-webrtc-signal", webrtccall.onSignalReceive);
            // Remove and execute all items in the array
            while (window.signalsQueue.length > 0) {
                (window.signalsQueue.shift())();   
            }
            window.isCallReady = true;
        }
        catch (err) {
            logger.error("onStreamCreated error " + err.message);
        }
    }

    webrtccall.hangup = function () {
        logger.debug("MediaCall hangup()");
        isNegotiating = false;  // Workaround for Chrome: skip nested negotiations
        try {
            if (webrtccall.connection.length) {
                $.each(webrtccall.connection, (i, c) => {
                    c.close();
                });
                webrtccall.connection = {};
            }
        }
        catch (e) { }


        try {
            if (mediaStreams.length > 0) {
                mediaStreams.forEach(function (mediaStream) {
                    mediaStream.getAudioTracks().forEach(function (track) {
                        track.stop();
                    });
                });
                mediaStreams.forEach(function (mediaStream) {
                    mediaStream.getVideoTracks().forEach(function (track) {
                            track.stop();
                    });
                });
                mediaStreams = [];

                var remoteAudioEls = document.getElementsByClassName('remote-audio');
                if (remoteAudioEls.length) {
                    Array.prototype.forEach.call(remoteAudioEls, audioEL => {
                        audioEL.srcObject = null;
                    });
                }
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
        window.isCallReady = false;
        window.signalsQueue = []; //Queue for the audio and video call signals
    }

    function onLocalLoadedMetaData() {
        console.log('Local video videoWidth: ' + this.videoWidth + 'px,  videoHeight: ' + this.videoHeight + 'px');
    }

    function onContactLoadedMetaData() {
        console.log('Remote video videoWidth: ' + this.videoWidth + 'px,  videoHeight: ' + this.videoHeight + 'px');
    }

    //  public methods
    webrtccall.initcall = function (localvideo, contactvideo, options, callback) {
        if (typeof callback !== 'function') {
            // TODO add callback to video call and throw from here
            callback = err => {
                if (err) {
                    streembit.notify.error(err);
                }
            };
        }
        try {
            webrtccall.options = options;
            webrtccall.is_outgoing_call = options.iscaller;
            webrtccall.connection[webrtccall.options.contact.name] = null;
            webrtccall.ice_servers = settings.iceservers;

            if (!webrtccall.ice_servers) {
                // throw new Error("Ice resolver configuration is missing");
                throw new Error(errhandler.getmsg(errcodes.UI_ICE_RESOLVER_CONFIG_ISMISSING));
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
                .then(callback)
                .catch(function (error) {
                    if (error.name === 'ConstraintNotSatisfiedError') {
                        callback(
                            'The resolution ' + constraints.video.width.exact + 'x' + constraints.video.width.exact +
                            ' px is not supported by your device.'
                        );
                    }
                    else if (error.name === 'PermissionDeniedError') {
                        callback(
                            'Permissions have not been granted to use your camera and ' +
                            'microphone, you need to allow the page access to your devices in order for the application to work.'
                        );
                    }
                    else if (error.name === 'NotFoundError') {
                        callback(
                            'Your camera and microphone devices returned not found error (NotFoundError).'
                        );
                    }
                    else {
                        callback('Get user media error: %j', error);
                    }
                });
        }
        catch (err) {
            // streembit.notify.error("Media call initialization error: %j", err);
            streembit.notify.error(errhandler.getmsg(errcodes.UI_MEDIA_CALL_INITIALIZE_ERR, err));
        }
    }


    module.exports = webrtccall;

}());