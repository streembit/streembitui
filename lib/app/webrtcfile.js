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

    var webrtcfile = webrtcfile || {};
    webrtcfile.options = {};
    webrtcfile.is_outgoing_call = false;
    webrtcfile.connection = 0;
    webrtcfile.ice_servers = 0;

    webrtcfile.onrcvstatechange = function () { };

    var dataChannel;

    function create_connection(label, onstatechange, outgoing) {

        if (!label) {
            // throw new Error("Invalid WebRTC connection init parameters");
            throw new Error(errhandler.getmsg(errcodes.UI_WEBRTC_CONN_INIT_PARAMS));
        }

        logger.debug('WebRTC: creating connection for ' + webrtcfile.options.contact.name);

        webrtcfile.is_outgoing_call = outgoing;
        
        // Create a new PeerConnection
        var servers = { iceServers: webrtcfile.ice_servers };
        var connection = new RTCPeerConnection(servers);

        if (webrtcfile.is_outgoing_call) {
            dataChannel = connection.createDataChannel(label);
            //dataChannel.binaryType = 'arraybuffer';
            console.log('created WebRTC send data channel');

            dataChannel.onopen = onstatechange;
            dataChannel.onclose = onstatechange;
        }
        else {
            // for the incoming call 
            connection.ondatachannel = webrtcfile.onReceiveChannel;
        }

        // ICE Candidate Callback
        connection.onicecandidate = function (event) {
            if (event.candidate) {
                // Found a new candidate
                logger.debug('WebRTC: onicecandidate, candidate: %j', event.candidate);
                var message = { cmd: defs.PEERMSG_FILE_WEBRTC, type: "candidate", "candidate": event.candidate };
                peercomm.send_peer_message(webrtcfile.options.contact, message);
            }
            else {
                logger.debug('WebRTC: ICE candidate gathering is completed');
            }
        };

        connection.onnegotiationneeded = function () {
            if (webrtcfile.is_outgoing_call) {
                logger.debug('WebRTC: connection.onnegotiationneeded -> create offer');

                // Send an offer for a connection
                connection.createOffer(
                    function (desc) {
                        try {
                            connection.setLocalDescription(desc, function () {
                                logger.debug("WebRTC: createOffer() callback. Send sdp localDescription");
                                var message = { cmd: defs.PEERMSG_FILE_WEBRTC, type: "sdp", "sdp": connection.localDescription };
                                peercomm.send_peer_message(webrtcfile.options.contact, message);
                            });
                        }
                        catch (err) {
                            // webrtcfile.onerror("setLocalDescription error: %j", err );
                            webrtcfile.onerror(errhandler.getmsg(errcodes.UI_SETLOCALDESCRIPTION_ERR, err));
                        }
                    },
                    function (error) {
                        // webrtcfile.onerror('connection createOffer error: %j', error);
                        webrtcfile.onerror(errhandler.getmsg(errcodes.UI_CONN_CREATEOFFER_ERR, error));
                    }
                );
            }
        }

        // And return it
        return connection;
    }

    function getConnection(label, onstatechange, outgoing) {
        if (!webrtcfile.connection) {
            webrtcfile.connection = create_connection(label, onstatechange, outgoing);
        }
        return webrtcfile.connection;
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
                    // webrtcfile.onerror("WEBRTC: addIceCandidate error: %j", err);
                    webrtcfile.onerror(errhandler.getmsg(errcodes.UI_WEBRTC_ADDICECANDIDATE_ERR, err));
                }
            );
        }
        catch (err) {
            // webrtcfile.onerror("WEBRTC: addIceCandidate error: %j", err);
            webrtcfile.onerror(errhandler.getmsg(errcodes.UI_WEBRTC_ADDICECANDIDATE_ERR, err));
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
                    if (connection.remoteDescription.type == "offer" && !webrtcfile.is_outgoing_call) { //  only the callee creates an answer
                        logger.info('WebRTC: received offer, sending response');
                        connection.createAnswer(
                            function (desc) {
                                connection.setLocalDescription(desc, function () {
                                    logger.debug('WebRTC: send sdp connection.localDescription:');
                                    logger.debug('%j', connection.localDescription);
                                    var message = { cmd: defs.PEERMSG_FILE_WEBRTC, type: "sdp", "sdp": connection.localDescription };
                                    peercomm.send_peer_message(webrtcfile.options.contact, message);
                                });
                            },
                            function (error) {
                                // webrtcfile.onerror('Error creating session description: ' + error);
                                webrtcfile.onerror(errhandler.getmsg(errcodes.UI_ERR_CREATING_SESSION_DESCRIPTION) + error);
                            }
                        );
                    }
                    else if (connection.remoteDescription.type == "answer") {
                        logger.info('WebRTC: caller setRemoteDescription success');
                    }
                },
                function (error) {
                    // webrtcfile.onerror('setRemoteDescription error: %j', error);
                    webrtcfile.onerror(errhandler.getmsg(errcodes.UI_SETREMOTEDESCRIPTION_ERR, error));
                }
            );
        }
        catch (err) {
            // webrtcfile.onerror("setRemoteDescription error: %j", err);
            webrtcfile.onerror(errhandler.getmsg(errcodes.UI_SETREMOTEDESCRIPTION_ERR, err));
        }
    }

    function onReceiveChannelStateChange() {
        var readyState = dataChannel.readyState;
        console.log('Receive channel state is: ' + readyState);
    }

    function onReceiveDataCallback(event) {
        if (!event || !event.data ) {
            return console.log('onReceiveDataCallback() invalid data');
        }

        if (typeof event.data === "string") {
            var data;
            try {
                data = JSON.parse(event.data);
            }
            catch (e) {
            }
            if (!data) {
                // webrtcfile.onerror("Invalid file data received");
                webrtcfile.onerror(errhandler.getmsg(errcodes.UI_INVALID_FILE_DATA_RECEIVED));
            }

            filetrans.onFileChunkReceive(data);
        }
        else {
            // webrtcfile.onerror("Invalid type of event data: %j", (typeof event.data));
            webrtcfile.onerror(errhandler.getmsg(errcodes.UI_INVALID_TYPEOF_EVENT_DATA, (typeof event.data)));
        }
    }

    webrtcfile.onReceiveChannel = function (event) {
        console.log('onReceiveChannel()');
        dataChannel = event.channel;
        //dataChannel.binaryType = 'arraybuffer';

        dataChannel.onmessage = onReceiveDataCallback;

        dataChannel.onopen = webrtcfile.onrcvstatechange;
        dataChannel.onclose = onReceiveChannelStateChange;
    }

    // Hand off a new signal from the signaler to the connection
    // listen on the data received event
    webrtcfile.onSignalReceive = function (data) {
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
            // webrtcfile.onerror('onReceiveSignal error: unknown signal type');
            webrtcfile.onerror(errhandler.getmsg(errcodes.UI_ONRECEIVESIGNAL_ERR_UNKNOWSIGNALTYPE))
        }
    }


    function closeDataChannel() {
        try {
            if (dataChannel) {
                dataChannel.close();
                console.log('Closed data channel with label: ' + dataChannel.label);
            }            

            if (webrtcfile.connection) {
                webrtcfile.connection.close();
                webrtcfile.connection = null;
                console.log('Closed webrtc peer connections');
            }

            webrtcfile.dispose();
        }
        catch (err) {
            // streembit.notify.error("Close data channel error: %j", err, true)
            streembit.notify.error(errhandler.getmsg(errcodes.UI_CLOSE_DATA_CHANNEL_ERR, err, true))
        }
    }

    function create_webrtc_connection(label, onstatechange, outgoing) {
        //  create a connection 
        getConnection(label, onstatechange, outgoing);
    }

    webrtcfile.dispose = function () {
        logger.debug("webrtcfile dispose()");   
        appevents.removeSignal("on-webrtc-file-signal", webrtcfile.onSignalReceive);
    }

    webrtcfile.cancel = function () {
        logger.debug("webrtcfile cancel()");       

        webrtcfile.dispose();
    }

    webrtcfile.send = function (data) {
        try {
            dataChannel.send(data);
            console.log('senddata');
        }
        catch (err) {
            // webrtcfile.onerror("File transfer error %j", err);
            webrtcfile.onerror(errhandler.getmsg(errcodes.UI_FILE_TRANSFER_ERR, err));
        }
    }

    //
    //  Send file initialization
    //  
    webrtcfile.sendfile = function (params) {
        try {
            webrtcfile.onerror = null;
            webrtcfile.connection = null;
            webrtcfile.ice_servers = settings.iceservers;

            if (!webrtcfile.ice_servers) {
                // throw new Error("Ice resolver configuration is missing");
                throw new Error(errhandler.getmsg(errcodes.UI_ICE_RESOLVER_CONFIG_ISMISSING));
            }

            if (!params || !params.file || !params.filehash) {
                // throw new Error("invalid parameters");
                throw new Error(errhandler.getmsg(errcodes.UI_INVALID_PARAMS));
            }
            var hash = params.filehash;

            if (!params.file.size) {
                // throw new Error("cannot send empty file");
                throw new Error(errhandler.getmsg(errcodes.UI_CANNOT_SEND_EMPTY_FILE));
            }

            webrtcfile.options = params;

            var contact = params.contact;
            if (!contact) {
                // throw new Error("contact parameter is missing");
                throw new Error(errhandler.getmsg(errcodes.UI_CONTACT_PARAMS_ISMISSING));
            }           

            webrtcfile.onerror = function (err, param) {
                try {                   
                    try {
                        appevents.error( 0x8200, err, param);
                        appevents.dispatch("on-task-event", "error", "send", hash, err);
                    }
                    catch (e) { }

                    closeDataChannel();
                }
                catch (e) { }
            };

            var onsend = params.onsend || function () { };
            var onerror = webrtcfile.onerror;                 

            var oncomplete = function (hash) {
                console.log('FILE SEND onCOMPLETE', params);
                // close the data channels
                setTimeout(function () {
                    closeDataChannel();
                },
                1000);

                if (params.oncomplete) {
                    params.oncomplete(hash, params.file);
                }
            };            

            var onread = function (result) {
                if (!result || !result.hash || !result.chunk || !result.length || !result.hasOwnProperty('offset')) {
                    filetrans.cancel(hash);
                    // webrtcfile.onerror("Error in receiving file read data.");
                    webrtcfile.onerror(errhandler.getmsg(errcodes.UI_ERR_RECEIVING_FILE_READ_DATA));
                    return;
                }

                var data = JSON.stringify(result);
                webrtcfile.send(data);

                // notify
                var currlen = result.offset + result.length;
                onsend(result.hash, currlen);
            };

            function onDataChannelStateChange() {
                var readyState = dataChannel.readyState;
                console.log('Send channel state is: ' + readyState);
                if (readyState === 'open') {
                    // start sending the file
                    try {
                        filetrans.initsend(
                            params.file, params.file.name, params.file.size,
                            params.filehash, params.file.type, params.file.path,
                            onread, oncomplete, onerror);

                        appevents.dispatch("on-task-event", "connected", "send", hash);
                    }
                    catch (err) {
                        if (webrtcfile.onerror) {
                            // webrtcfile.onerror("filetrans.initsend error" + (err.message ? (": " + err.message)  : ""));
                            webrtcfile.onerror(errhandler.getmsg(errcodes.UI_FILETRANS_INITSEND_ERR) + (err.message ? (": " + err.message)  : ""));
                        }
                    }
                }
                else if (readyState === 'close') {
                    //TODO
                }
            }     

            // this is the file sender, this is the outgoing call
            // create the WebRTC connection
            create_webrtc_connection(params.filehash, onDataChannelStateChange, true);

            // wait for the signals
            appevents.addListener("on-webrtc-file-signal", webrtcfile.onSignalReceive);
        }
        catch (err) {
            if (webrtcfile.onerror) {
                // webrtcfile.onerror("Send file webrtc error: %j", err);
                webrtcfile.onerror(errhandler.getmsg(errcodes.UI_SEND_FILE_WEBRTC_ERR, err));
            }
            else {
                throw err;
            }
        }
    };


    //
    //  Receive file initialization
    //  
    webrtcfile.receivefile = function (params) {
        try {
            webrtcfile.connection = null;
            webrtcfile.ice_servers = settings.iceservers;

            if (!webrtcfile.ice_servers) {
                // throw new Error("Ice resolver configuration is missing");
                throw new Error(errhandler.getmsg(errcodes.UI_ICE_RESOLVER_CONFIG_ISMISSING));
            }

            if (!params || !params.file_size || !params.file_name || !params.file_hash) {
                // throw new Error("invalid file receive parameters");
                throw new Error(errhandler.getmsg(errcodes.UI_INVALID_FILE_RECEIVE_PARAMS));
            }            

            webrtcfile.options = params;

            var contact = params.contact;
            if (!contact) {
                // throw new Error("contact parameter is missing");
                throw new Error(errhandler.getmsg(errcodes.UI_CONTACT_PARAMS_ISMISSING));
            }

            var hash = params.file_hash;

            appevents.dispatch("on-task-event", "add", {
                proc: "info",
                type: "file",
                mode: "receive",
                file_name: params.file_name,
                taskid: hash,
                file_size: params.file_size,
                file_type: params.file_type,
                contact: contact
            });    

            webrtcfile.onerror = function (err, param) {
                try {
                    appevents.error( 0x8200, err, param);
                    appevents.dispatch("on-task-event", "error", "receive", hash, err);
                }
                catch (e) { }
            };

            var oncomplete = function () {
                closeDataChannel();

                if (params.oncomplete) {
                    params.oncomplete;
                }               
            }; 

            webrtcfile.onrcvstatechange = function () {
                var readyState = dataChannel.readyState;
                if (readyState === 'open') {        
                    appevents.dispatch("on-task-event", "connected", "receive", hash);
                }
            }

            appevents.dispatch("on-task-event", "connect", "receive", hash);
            appevents.addListener("on-webrtc-file-signal", webrtcfile.onSignalReceive);
            // create the WebRTC connection
            // this is the file receiver, the third param is false
            create_webrtc_connection(hash, null, false);

            var file = { size: params.file_size, name: params.file_name, type: params.file_type, actiontype: params.action_type, hash: hash };
            var options = {
                contact: contact,
                file: file,
                is_sender: false
            };

            filetrans.initreceive(options, oncomplete);
            
        }
        catch (err) {
            // webrtcfile.onerror("Receive file webrtc error: %j", err);
            webrtcfile.onerror(errhandler.getmsg(errcodes.UI_RECEIVE_FILE_WEBRTC_ERR, err));
        }
    };

    module.exports = webrtcfile;

}());

