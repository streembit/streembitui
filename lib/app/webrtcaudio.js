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
var errcodes = require("errcodes");
var errhandler = require("errhandler");

(function () {

    function WebRtcAudio() {

        var webrtcaudio = {};

        webrtcaudio.is_outgoing_call = false;
        webrtcaudio.connection = 0;
        webrtcaudio.ice_servers = 0;

        var mediaStream;
        var remoteStream;

        webrtcaudio.onconnect = function () { };
        webrtcaudio.onremotestream = function () { };

        function create_connection() {
            logger.debug('webrtcaudio: creating connection for ' + webrtcaudio.contact.name);
    
            // Create a new PeerConnection
            var servers = { iceServers: webrtcaudio.ice_servers };
            var connection = new RTCPeerConnection(servers);
          

            connection.oniceconnectionstatechange = function () {
                var iceState = connection.iceConnectionState;
                if (iceState == "connected") {
                    if (remoteStream) {
                        logger.debug('webrtcaudio: call onRemoteStreamAdded()');
                        onRemoteStreamAdded(remoteStream);
                    }

                    webrtcaudio.onconnect();
                }
            };

            // ICE Candidate Callback
            connection.onicecandidate = function (event) {
                if (event.candidate) {
                    // Found a new candidate
                    logger.debug('webrtcaudio: onicecandidate, candidate: %j', event.candidate);
                    var message = { cmd: defs.PEERMSG_CALL_WEBRTCAA, type: "candidate", "candidate": event.candidate };
                    peercomm.send_peer_message(webrtcaudio.contact, message);
                }
            };

            connection.onnegotiationneeded = function () {
                if (webrtcaudio.is_outgoing_call) {
                    logger.debug('webrtcaudio: connection.onnegotiationneeded -> create offer');

                    var offerOptions = {
                        offerToReceiveAudio: true,
                        offerToReceiveVideo: false
                    };

                    // Send an offer for a connection
                    connection.createOffer(offerOptions).then(
                        function (desc) {
                            try {
                                connection.setLocalDescription(desc, function () {
                                    logger.debug("webrtcaudio: createOffer() callback. Send sdp localDescription");
                                    var message = { cmd: defs.PEERMSG_CALL_WEBRTCAA, type: "sdp", "sdp": connection.localDescription };
                                    peercomm.send_peer_message(webrtcaudio.contact, message);
                                });
                            }
                            catch (err) {
                                webrtcaudio.onerror(err);
                            }
                        },
                        function (error) {
                            webrtcaudio.onerror(error);
                        }
                    );
                }
            }

            connection.onaddstream = function (evt) {
                logger.debug('webrtcaudio: connection.onaddstream, set remote stream');
                remoteStream = evt.stream;
            };

            connection.onremovestream = function (event) {
                logger.debug('webrtcaudio: connection.onremovestream');
                // A stream was removed
                onStreamRemoved(event.stream.id);
            };

            // And return it
            return connection;
        }

        function getConnection() {
            if (!webrtcaudio.connection) {
                webrtcaudio.connection = create_connection();
            }
            return webrtcaudio.connection;
        }

        // Process a newly received Candidate signal
        function onCandidateSignalReceived(connection, candidate) {
            logger.debug('webrtcaudio: candidate %j', candidate);

            connection.addIceCandidate(
                new RTCIceCandidate(candidate)
            ).then(
                function () {
                },
                function (err) {
                    webrtcaudio.onerror(err);
                }
                );
        }

        // Process a newly received SDP signal
        function onSdpSignalReceived(connection, sdp) {

            logger.debug('webrtcaudio: processing sdp signal');

            var tdesc = new RTCSessionDescription(sdp);
            //logger.debug('sdp desc %j', tdesc);
            logger.debug('desc.type == ' + tdesc.type);

            connection.setRemoteDescription(
                tdesc,
                function () {
                    if (connection.remoteDescription.type == "offer" && !webrtcaudio.is_outgoing_call) { //  only the callee creates an answer
                        logger.info('webrtcaudio: received offer, sending response');

                        onReadyForStream(connection);

                        connection.createAnswer(
                            function (desc) {
                                connection.setLocalDescription(desc, function () {
                                    logger.debug('webrtcaudio: send sdp connection.localDescription:');
                                    logger.debug('%j', connection.localDescription);
                                    var message = { cmd: defs.PEERMSG_CALL_WEBRTCAA, type: "sdp", "sdp": connection.localDescription };
                                    peercomm.send_peer_message(webrtcaudio.contact, message);
                                });
                            },
                            function (error) {
                                webrtcaudio.onerror(error);
                            }
                        );
                    }
                },
                function (error) {
                    // webrtcaudio.onerror('setRemoteDescription error: %j', error);
                    webrtcaudio.onerror(errhandler.getmsg(errcodes.UI_SETREMOTEDESCRIPTION_ERR, error));
                }
            );
        }

        // Hand off a new signal from the signaler to the connection
        // listen on the data received event
        webrtcaudio.onSignalReceive = function (data) {
            //var signal = JSON.parse(data);
            var connection = getConnection();

            logger.debug('webrtcaudio: webrtcaudio received signal type: %s', data.type);

            // Route signal based on type
            if (data.sdp) {
                onSdpSignalReceived(connection, data.sdp);
            }
            else if (data.candidate) {
                onCandidateSignalReceived(connection, data.candidate);
            }
            else {
                // webrtcaudio.onerror('onReceiveSignal error: unknown signal type');
                webrtcaudio.onerror(errhandler.getmsg(errcodes.UI_ONRECEIVESIGNAL_ERR_UNKNOWSIGNALTYPE));
            }
        }

        webrtcaudio.toggle_audio = function (ismute, callback) {
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
                    // return streembit.notify.error('Invalid media stream', null, true);
                    return streembit.notify.error(errhandler.getmsg(errcodes.UI_INVALID_MEDIA_STREAM, null, true));
                }

                connection.addStream(mediaStream);
            }
            catch (err) {
                // webrtcaudio.onerror("onReadyForStream error " + err.message);
                webrtcaudio.onerror(errhandler.getmsg(errcodes.UI_ONREADYFORSTREAM_ERR) + err.message);
            }
        }

        //  public methods
        function call_contact() {
            try {
                if (!mediaStream) {
                    // return streembit.notify.error('Invalid media stream', null, true);
                    return streembit.notify.error(errhandler.getmsg(errcodes.UI_INVALID_MEDIA_STREAM, null, true));
                }

                //  create a connection 
                var connection = getConnection();
                // Add our audio/video stream
                connection.addStream(mediaStream);
                logger.debug('stream added to connection at the caller end');
            }
            catch (err) {
                // webrtcaudio.onerror("call_contact error %j", err);
                webrtcaudio.onerror(errhandler.getmsg(errcodes.UI_CALL_CONTACT_ERR, err));
            }
        }


        function onStreamRemoved(streamId) {
            try {
                webrtcaudio.hangup();
            }
            catch (err) {
                // webrtcaudio.onerror("onStreamRemoved error " + err.message);
                webrtcaudio.onerror(errhandler.getmsg(errcodes.UI_ONSTREAMREMOVED_ERR) + err.message);
            }
        }


        function onRemoteStreamAdded(eventStream) {
            try {
                logger.debug('Bind remote stream to audio element');
                var audio = document.getElementById('contactaudio');
                audio.srcObject = eventStream;
                logger.debug('Remote stream binded to audio element');

                appevents.dispatch("on-remotestream-connect");
            }
            catch (err) {
                // webrtcaudio.onerror("onRemoteStreamAdded error: %j", err);
                webrtcaudio.onerror(errhandler.getmsg(errcodes.UI_ONREMOTESTREAMADDED_ERR, err));
            }
        }

        // private variables and methods
        function onStreamCreated(stream) {
            try {
                logger.debug('webrtcaudio: onStreamCreated()');

                var audioTracks = stream.getAudioTracks();
                logger.debug('Using audio device: ' + audioTracks[0].label);

                mediaStream = stream;

                // create the connection and perform the call
                if (webrtcaudio.is_outgoing_call) {
                    call_contact();
                }
            }
            catch (err) {
                // webrtcaudio.onerror("onStreamCreated error " + err.message);
                webrtcaudio.onerror(errhandler.getmsg(errcodes.UI_ONSTREAMCREATED_ERR) + err.message);
            }
        }

        webrtcaudio.hangup = function () {
            logger.debug("webrtcaudio hangup()");

            if (webrtcaudio.connection) {
                try {
                    webrtcaudio.connection.close();
                }
                catch (e) { }
            }

            webrtcaudio.connection = null;

            try {
                if (mediaStream) {
                    mediaStream.getAudioTracks().forEach(function (track) {
                        track.stop();
                    });
                }
            }
            catch (e) { }

            appevents.removeSignal("on-audio-webrtc-signal", webrtcaudio.onSignalReceive);
        }

        //  public methods
        webrtcaudio.init = function (contact, iscaller) {
            try {
                if (!contact) {
                    // throw new Error("contact parameter is missing");
                    throw new Error(errhandler.getmsg(errcodes.UI_CONTACT_PARAMS_ISMISSING));
                }

                if (!settings.iceservers) {
                    // throw new Error("Ice resolver configuration is missing");
                    throw new Error(errhandler.getmsg(errcodes.UI_ICE_RESOLVER_CONFIG_ISMISSING));
                }

                webrtcaudio.contact = contact;
                webrtcaudio.is_outgoing_call = iscaller;
                webrtcaudio.connection = null;
                webrtcaudio.ice_servers = settings.iceservers;

                logger.debug("audio call with %s", contact.name);

                // add event handlers
                appevents.addListener("on-audio-webrtc-signal", webrtcaudio.onSignalReceive);

                var params = { audio: true, video: false };

                navigator.mediaDevices.getUserMedia(params)
                .then(onStreamCreated)
                .catch(function (error) {
                    if (error.name === 'PermissionDeniedError') {
                        streembit.notify.error(
                            'Permissions have not been granted to use your camera and ' +
                            'microphone, you need to allow the page access to your devices in order for the application to work.'
                        );
                    }
                    else {
                        // streembit.notify.error('Get user media error: %j', error);
                        streembit.notify.error(errhandler.getmsg(errcodes.UI_GET_USER_MEDIA_ERR, error));
                    }
                });
                               
            }
            catch (err) {
                // streembit.notify.error("Media call initialization error: %j", err);
                streembit.notify.error(errhandler.getmsg(errcodes.UI_MEDIA_CALL_INITIALIZE_ERR, err));
            }
        };

        webrtcaudio.onerror = function (err, param) {
            streembit.notify.error(err, param, true);
        };

        return webrtcaudio;
    }

    module.exports = WebRtcAudio;

}());

