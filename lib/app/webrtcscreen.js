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
var filetrans = require("filetrans");
var errcodes = require("errcodes");
var errhandler = require("errhandler");


(function () {

    const WEBRTCERR = "webrtc";

    var webrtcscreen = webrtcscreen || {};
    webrtcscreen.contact = 0;
    webrtcscreen.is_outgoing_call = false;
    webrtcscreen.connection = 0;
    webrtcscreen.ice_servers = 0;
    webrtcscreen.connection_id = 0;

    webrtcscreen.onconnect = function () { };
    webrtcscreen.onremotestream = function () { };

    var screenVideo;
    var mediaStream;
    var remoteStream;

    function create_connection(taskid) {

        if (!taskid) {
            // throw new Error("Invalid WebRTC connection init parameters");
            throw new Error(errhandler.getmsg(errcodes.UI_WEBRTC_CONN_INIT_PARAMS));
        }

        webrtcscreen.connection_taskid = taskid;

        logger.debug('WebRTC: creating connection for ' + webrtcscreen.contact.name);
       
        // Create a new PeerConnection
        var servers = { iceServers: webrtcscreen.ice_servers };
        var connection = new RTCPeerConnection(servers);

        connection.oniceconnectionstatechange = function () {
            var iceState = connection.iceConnectionState;
            if (iceState == "connected") {
                if (remoteStream) {
                    logger.debug('WebRTC: call onRemoteStreamAdded()');
                    onRemoteStreamAdded();
                }

                webrtcscreen.onconnect();
            }            
        };

        // ICE Candidate Callback
        connection.onicecandidate = function (event) {
            if (event.candidate) {
                // Found a new candidate
                logger.debug('WebRTC: onicecandidate, candidate: %j', event.candidate);
                var message = { cmd: defs.PEERMSG_CALL_WEBRTCSS, type: "candidate", "candidate": event.candidate };
                peercomm.send_peer_message(webrtcscreen.contact, message);
            }
        };

        connection.onnegotiationneeded = function () {
            if (webrtcscreen.is_outgoing_call) {
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
                                var message = { cmd: defs.PEERMSG_CALL_WEBRTCSS, type: "sdp", "sdp": connection.localDescription };
                                peercomm.send_peer_message(webrtcscreen.contact, message);
                            });
                        }
                        catch (err) {
                            // webrtcscreen.onerror("setLocalDescription error: %j", err );
                            webrtcscreen.onerror(errhandler.getmsg(errcodes.UI_SETLOCALDESCRIPTION_ERR, err));
                        }
                    },
                    function (error) {
                        // webrtcscreen.onerror('connection createOffer error: %j', error);
                        webrtcscreen.onerror(errhandler.getmsg(errcodes.UI_CONN_CREATEOFFER_ERR, error));
                    }
                );
            }
        }

        connection.onaddstream = function (evt) {
            logger.debug('WebRTC: connection.onaddstream, set remote stream');
            remoteStream = evt.stream;
        };

        connection.onremovestream = function (event) {
            logger.debug('WebRTC: connection.onremovestream');
            // A stream was removed
            onStreamRemoved(event.stream.id);
        };

        // And return it
        return connection;
    }

    function getConnection(id) {
        if (!webrtcscreen.connection) {
            webrtcscreen.connection = create_connection(id);
        }
        return webrtcscreen.connection;
    }

    // Process a newly received Candidate signal
    function onCandidateSignalReceived(connection, candidate) {
        logger.debug('WebRTC: candidate %j', candidate);
        try {
            connection.addIceCandidate(
                new RTCIceCandidate(candidate)
            ).then(
                function () {                    
                },
                function (err) {
                    // webrtcscreen.onerror("WEBRTC: addIceCandidate error: %j", err);
                    webrtcscreen.onerror(errhandler.getmsg(errcodes.UI_WEBRTC_ADDICECANDIDATE_ERR, err));
                }
            );
        }
        catch (err) {
            // webrtcscreen.onerror("WEBRTC: addIceCandidate error: %j", err);
            webrtcscreen.onerror(errhandler.getmsg(errcodes.UI_WEBRTC_ADDICECANDIDATE_ERR, err));
        }
    }

    // Process a newly received SDP signal
    function onSdpSignalReceived(connection, sdp) {

        logger.debug('WebRTC: processing sdp signal');

        var tdesc = new RTCSessionDescription(sdp);
        //logger.debug('sdp desc %j', tdesc);
        logger.debug('desc.type == ' + tdesc.type);

        connection.setRemoteDescription(
            tdesc,
            function () {
                if (connection.remoteDescription.type == "offer" && !webrtcscreen.is_outgoing_call) { //  only the callee creates an answer
                    logger.info('WebRTC: received offer, sending response');
                    connection.createAnswer(
                        function (desc) {
                            connection.setLocalDescription(desc, function () {
                                logger.debug('WebRTC: send sdp connection.localDescription:');
                                logger.debug('%j', connection.localDescription);
                                var message = { cmd: defs.PEERMSG_CALL_WEBRTCSS, type: "sdp", "sdp": connection.localDescription };
                                peercomm.send_peer_message(webrtcscreen.contact, message);
                            });
                        },
                        function (error) {
                            // webrtcscreen.onerror('Error creating session description: ' + error);
                            webrtcscreen.onerror(errhandler.getmsg(errcodes.UI_ERR_CREATING_SESSION_DESCRIPTION) + error);
                        }
                    );
                }
                else if (connection.remoteDescription.type == "answer") {
                    logger.info('WebRTC: caller setRemoteDescription success');
                }
            },
            function (error) {
                // webrtcscreen.onerror('setRemoteDescription error: %j', error);
                webrtcscreen.onerror(errhandler.getmsg(errcodes.UI_SETREMOTEDESCRIPTION_ERR, error));
            }
        );   
    }


    function onStreamRemoved(streamId) {
        try {
            logger.debug('Remove remote stream from contact video element');

            webrtcscreen.hangup();
        }
        catch (err) {
            logger.error("onStreamRemoved error " + err.message);
        }
    }

    function onRemoteStreamAdded() {
        try {
            if (!remoteStream) {
                // throw new Error("the remote stream is invalid")
                throw new Error(errhandler.getmsg(errcodes.UI_REMOTE_STREAM_INVALID))
            }

            logger.debug('Bind remote stream to screen video element');
            // Bind the remote stream to the contact video control

            //  screenVideo should be initialised by now
            //screenVideo.srcObject = remoteStream;
            webrtcscreen.onremotestream(remoteStream);
        }
        catch (err) {
            // webrtcscreen.onerror("onRemoteStreamAdded error: %j", err);
            webrtcscreen.onerror(errhandler.getmsg(errcodes.UI_ONREMOTESTREAMADDED_ERR, err));
        }
    }

    webrtcscreen.hangup = function () {
        if (webrtcscreen.connection) {
            try {
                webrtcscreen.connection.close();
                webrtcscreen.connection = null;
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
            mediaStream = null;
        }
        catch (e) { }

        webrtcscreen.dispose();
    }

    // Hand off a new signal from the signaler to the connection
    // listen on the data received event
    webrtcscreen.onSignalReceive = function (data) {
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
            // webrtcscreen.onerror('onReceiveSignal error: unknown signal type');
            webrtcscreen.onerror(errhandler.getmsg(errcodes.UI_ONRECEIVESIGNAL_ERR_UNKNOWSIGNALTYPE));
        }
    }


    webrtcscreen.dispose = function () {
        logger.debug("webrtcscreen dispose()");   
        appevents.removeSignal("on-webrtc-screen-signal", webrtcscreen.onSignalReceive);        
    }

    //  public methods
    webrtcscreen.init_connection = function (taskid, stream) {
        if (!stream) {
            // throw new Error('Invalid sharescreen media stream');
            throw new Error(errhandler.getmsg(errcodes.UI_INVALID_SHARECREEN_MEDIA_STREAM));
        }

        mediaStream = stream;

        //  create a connection 
        var connection = getConnection(taskid);
        // Add our audio/video stream
        connection.addStream(mediaStream);
        logger.debug('stream added to connection at the caller end');
    }

    function get_nw_screen(callback, errorfn) {
        if (!streembit.globals.scn) {
            streembit.globals.scn = nw.Screen.Init();
        }

        // get video stream, nw.js prompts only "entire screen" available
        streembit.globals.scn.chooseDesktopMedia(["screen"], function (streamid, args) {
            navigator.webkitGetUserMedia({
                audio: false,
                video: {
                    mandatory: {
                        chromeMediaSource: 'desktop',
                        chromeMediaSourceId: streamid,
                        maxWidth: 960,
                        maxHeight: 620,
                        minFrameRate: 20,
                        maxFrameRate: 60
                    },
                    optional: []
                }
            },
            function (stream) {
                callback(stream)
            },
            function (err) {
                errorfn(err);
            });
        });
    }

    function get_web_screen(callback, errorfn) {
        // errorfn("Screen sharing in web browser is not supported.")
        errorfn(errhandler.getmsg(errcodes.UI_SCREENSHARING_WEBBROWSER_NOTSUPPORT))
    }

    function get_screen(callback, errorfn) {
        if (streembit.globals.nwmode) {
            get_nw_screen(callback, errorfn);
        }
        else {
            get_web_screen(callback, errorfn);
        }
    }

    //
    //  Send file initialization
    //  
    webrtcscreen.share = function (contact, taskid, onconnect, onerror) {
        try {
            webrtcscreen.onerror = null;
            webrtcscreen.connection = null;
            webrtcscreen.is_outgoing_call = true;

            webrtcscreen.ice_servers = settings.iceservers;
            if (!webrtcscreen.ice_servers) {
                // throw new Error("Ice resolver configuration is missing");
                throw new Error(errhandler.getmsg(errcodes.UI_ICE_RESOLVER_CONFIG_ISMISSING));
            }

            if (!contact || !contact.name) {
                // throw new Error("contact parameter is missing");
                throw new Error(errhandler.getmsg(errcodes.UI_CONTACT_PARAMS_ISMISSING));
            }     

            if (!onconnect || (typeof onconnect != "function")) {
                // throw new Error("onconnect callback parameter is missing");
                throw new Error(errhandler.getmsg(errcodes.UI_ONCONNECT_CB_PARAMS_MISSING));
            }  

            if (!onerror || (typeof onerror != "function")) {
                // throw new Error("onerror callback parameter is missing");
                throw new Error(errhandler.getmsg(errcodes.UI_ONERR_CB_PARAM_MISSING));
            }  

            webrtcscreen.contact = contact;  

            webrtcscreen.onerror = function (err, param) {
                try {                   
                    onerror(err, param);
                }
                catch (e) { }
            };
            
            webrtcscreen.onconnect = function () {
                onconnect();                
            }

            logger.debug("Screen share to %s", contact.name);

            get_screen(
                function (stream) {
                    try {
                        appevents.addListener("on-webrtc-screen-signal", webrtcscreen.onSignalReceive);
                        // create the connection and perform the call
                        webrtcscreen.init_connection(taskid, stream);                       
                    }
                    catch (err) {
                        onerror(err);
                    }
                },
                function (err) {
                    onerror(err);
                }
            );           
        }
        catch (err) {
            onerror(err);
        }
    };


    //
    //  Receive screen initialization
    //  
    webrtcscreen.receive = function (params) {
        try {
            webrtcscreen.connection = null;
            webrtcscreen.ice_servers = settings.iceservers;
            webrtcscreen.is_outgoing_call = false;

            if (!webrtcscreen.ice_servers) {
                // throw new Error("Ice resolver configuration is missing");
                throw new Error(errhandler.getmsg(errcodes.UI_ICE_RESOLVER_CONFIG_ISMISSING));
            }    

            var contact = params.contact;
            if (!contact) {
                // throw new Error("contact parameter is missing");
                throw new Error(errhandler.getmsg(errcodes.UI_CONTACT_PARAMS_ISMISSING));
            }
            webrtcscreen.contact = contact;  

            var taskid = params.taskid;
            if (!taskid) {
                // throw new Error("taskid parameter is missing");
                throw new Error(errhandler.getmsg(errcodes.UI_TASKID_PARAM_MISSING));
            }

            appevents.dispatch("on-task-event", "add", {
                proc: "info",
                type: "screen",
                mode: "receive",
                taskid: taskid,
                contact: contact,
                showconnect: true
            });    

            webrtcscreen.onerror = function (err, param) {
                try {
                    appevents.error( 0x8202, err, param);
                    appevents.dispatch("on-task-event", "close", "receive", taskid);
                }
                catch (e) { }
            };

            webrtcscreen.onconnect = function () {
                if (params.onconnect) {
                    params.onconnect();
                }
                appevents.dispatch("on-task-event", "close", "receive", taskid);
            }

            webrtcscreen.onremotestream = function (stream) {
                if (!webrtcscreen.is_outgoing_call) {
                    var params = {
                        contact: contact,
                        taskid: taskid,
                        stream: stream
                    };
                    appevents.dispatch("display-view", "screenreceive", params);
                }                
            }

            appevents.dispatch("on-task-event", "connect", "receive", taskid);
            appevents.addListener("on-webrtc-screen-signal", webrtcscreen.onSignalReceive);
            // create the WebRTC connection
            // this is the screen receiver, the third param is false
            getConnection(taskid);

            //
        }
        catch (err) {
            // webrtcscreen.onerror("Receive screen webrtc error: %j", err);
            webrtcscreen.onerror(errhandler.getmsg(errcodes.UI_RECEIVE_SCREEN_WEBRTC_ERR, err));
        }
    };

    module.exports = webrtcscreen;

}());

