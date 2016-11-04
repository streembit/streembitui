/*

This file is part of Streembit application. 
Streembit is an open source project to create a real time communication system for humans and machines. 

Streembit is a free software: you can redistribute it and/or modify it under the terms of the GNU General Public License 
as published by the Free Software Foundation, either version 3.0 of the License, or (at your option) any later version.

Streembit is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty 
of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU General Public License for more details.

You should have received a copy of the GNU General Public License along with Streembit software.  
If not, see http://www.gnu.org/licenses/.
 
-------------------------------------------------------------------------------------------------------------------------
Author: Tibor Zsolt Pardi 
Copyright (C) 2016 The Streembit software development team
-------------------------------------------------------------------------------------------------------------------------

*/

'use strict';

(function () {

    var settings = require("settings");
    var logger = require("applogger");
    var webrtcadapter = require("webrtc-adapter");
    var defs = require("definitions");
    var peercomm = require("peercomm");

    var webrtclib = webrtclib || {};
    webrtclib.options = {};
    webrtclib.is_outgoing_call = false;
    webrtclib.connection = 0;
    webrtclib.ice_servers = 0;

    var localVideo;
    var contactVideo;
    var mediaStream;
    var remoteStream;

    function create_connection() {
        logger.debug('WebRTC: creating connection for ' + webrtclib.options.contact.name);

        // Create a new PeerConnection
        var servers = { iceServers: webrtclib.ice_servers };
        var connection = new RTCPeerConnection(servers);

        // ICE Candidate Callback
        connection.onicecandidate = function (event) {
            if (event.candidate) {
                // Found a new candidate
                logger.debug('WebRTC: onicecandidate, candidate: %j', event.candidate);
                var message = { cmd: defs.PEERMSG_CALL_WEBRTC, type: "candidate", "candidate": event.candidate };
                peercomm.send_peer_message(webrtclib.options.contact, message);
            }
            else {
                logger.debug('WebRTC: ICE candidate gathering is completed');
                if (remoteStream) {
                    logger.debug('WebRTC: call onRemoteStreamAdded()');
                    onRemoteStreamAdded(remoteStream);
                }
            }
        };

        connection.onstatechange = function () {
            var states = {
                'iceConnectionState': connection.iceConnectionState,
                'iceGatheringState': connection.iceGatheringState,
                'readyState': connection.readyState,
                'signalingState': connection.signalingState
            };

            logger.debug(JSON.stringify(states));
        };

        connection.onnegotiationneeded = function () {
            if (webrtclib.is_outgoing_call) {
                logger.debug('WebRTC: connection.onnegotiationneeded -> create offer');

                // Send an offer for a connection
                connection.createOffer(
                    function (desc) {
                        try {
                            connection.setLocalDescription(desc, function () {
                                logger.debug("WebRTC: createOffer() callback. Send sdp localDescription");
                                var message = { cmd: defs.PEERMSG_CALL_WEBRTC, type: "sdp", "sdp": connection.localDescription };
                                peercomm.send_peer_message(webrtclib.options.contact, message);
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
            if (webrtclib.is_outgoing_call) {
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
        if (!webrtclib.connection) {
            webrtclib.connection = create_connection();
        }
        return webrtclib.connection;
    }

    // Process a newly received Candidate signal
    function onCandidateSignalReceived(connection, candidate) {
        logger.debug('WebRTC: candidate %j', candidate);
        try {
            connection.addIceCandidate(new RTCIceCandidate(candidate));
        }
        catch (err) {
            streembit.notify.error("addIceCandidate error: %j", err, true);
        }
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
                    if (connection.remoteDescription.type == "offer" && !webrtclib.is_outgoing_call) { //  only the callee creates an answer
                        logger.info('WebRTC: received offer, sending response');
                        onReadyForStream(connection);
                        connection.createAnswer(
                            function (desc) {
                                connection.setLocalDescription(desc, function () {
                                    logger.debug('WebRTC: send sdp connection.localDescription:');
                                    logger.debug('%j', connection.localDescription);
                                    var message = { cmd: defs.PEERMSG_CALL_WEBRTC, type: "sdp", "sdp": connection.localDescription };
                                    peercomm.send_peer_message(webrtclib.options.contact, message);
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
    webrtclib.onSignalReceive = function (data) {
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

    webrtclib.show_video = function (callback) {
        var videoTracks = mediaStream.getVideoTracks();
        if (videoTracks.length === 0) {
            logger.debug('No local video available.');
            return;
        }

        trace('Toggling video mute state.');
        for (var i = 0; i < videoTracks.length; ++i) {
            videoTracks[i].enabled = true;
        }

        logger.debug('Video ' + (videoTracks[0].enabled ? 'unmuted.' : 'muted.'));
        if (videoTracks[0].enabled) {
            callback();
        }
    }

    webrtclib.hide_video = function (callback) {
        var videoTracks = mediaStream.getVideoTracks();
        if (videoTracks.length === 0) {
            logger.debug('No local video available.');
            return;
        }

        trace('Toggling video mute state.');
        for (var i = 0; i < videoTracks.length; ++i) {
            videoTracks[i].enabled = false;
        }

        logger.debug('Video ' + (videoTracks[0].enabled ? 'unmuted.' : 'muted.'));
        if (!videoTracks[0].enabled) {
            callback();
        }
    }

    webrtclib.toggle_audio = function (ismute, callback) {
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
                return streembit.notify.error_popup('Invalid media stream');
            }

            //  create a connection 
            var connection = getConnection(webrtclib.options.contact.name);
            // Add our audio/video stream
            connection.addStream(mediaStream);
            logger.debug('stream added to connection at the caller end');
        }
        catch (err) {
            streembit.notify.error_popup("call_contact error %j", err);
        }
    }


    function onStreamRemoved(streamId) {
        try {
            logger.debug('Remove remote stream from contact video element');

            webrtclib.hangup();
        }
        catch (err) {
            logger.error("onStreamRemoved error " + err.message);
        }
    }


    function onRemoteStreamAdded(eventStream) {
        try {
            if (webrtclib.options.calltype == "videocall") {

                logger.debug('Bind remote stream to contact video element');
                // Bind the remote stream to the contact video control                
                contactVideo.srcObject = eventStream;

            }
            else {
                logger.debug('Bind remote stream to audio element');
                var audio = document.querySelector('audio');
                audio.srcObject = eventStream; //event.stream;
            }

            if (eventStream.active) {
                logger.debug("onRemoteStreamAdded: eventStream is active");
            }

            app_events.emit(app_events.APPEVENT, app_events.TYPES.ONVIDEOCONNECT);
        }
        catch (err) {
            logger.error("onRemoteStreamAdded error: %j", err);
        }
    }

    // private variables and methods
    function onStreamCreated(stream) {
        try {
            logger.debug('Received local stream');

            if (webrtclib.options.calltype == "videocall") {
                localVideo.srcObject = stream;
            }
            else {
                var audioTracks = stream.getAudioTracks();
                logger.debug('Using audio device: ' + audioTracks[0].label);
            }

            mediaStream = stream;

            // create the connection and perform the call
            if (webrtclib.is_outgoing_call) {
                call_contact();
            }
        }
        catch (err) {
            logger.error("onStreamCreated error " + err.message);
        }
    }

    webrtclib.hangup = function () {
        logger.debug("MediaCall hangup()");
        if (webrtclib.connection) {
            try {
                webrtclib.connection.close();
                webrtclib.connection = null;
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
                contactVideo.src = '';
            }

            if (localVideo) {
                localVideo.pause();
                localVideo.src = "";
            }
        }
        catch (e) { }
    }

    function onLocalLoadedMetaData() {
        console.log('Local video videoWidth: ' + this.videoWidth + 'px,  videoHeight: ' + this.videoHeight + 'px');
    }

    function onContactLoadedMetaData() {
        console.log('Remote video videoWidth: ' + this.videoWidth + 'px,  videoHeight: ' + this.videoHeight + 'px');
    }

    //  public methods
    webrtclib.init = function (localvideo, contactvideo, options) {
        try {
            webrtclib.options = options;
            webrtclib.is_outgoing_call = options.iscaller;
            webrtclib.connection = null;
            webrtclib.ice_servers = settings.iceservers;

            if (!webrtclib.ice_servers) {
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
                        streembit.notify.error('The resolution ' + constraints.video.width.exact + 'x' + constraints.video.width.exact + ' px is not supported by your device.');
                    } else if (error.name === 'PermissionDeniedError') {
                        streembit.notify.error('Permissions have not been granted to use your camera and ' +
                            'microphone, you need to allow the page access to your devices in order for the demo to work.');
                    }
                    else {
                        streembit.notify.error('getUserMedia error: %j', error);
                    }
                });
        }
        catch (err) {
            streembit.notify.error("Media call initialization error: %j", err);
        }
    }

    module.exports = webrtclib;;

}());

