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
var appsrvc = require("appsrvc");
var peermsg = require("peermsg");
var contactlist = require("contactlist");
var utilities = require("utilities");

(function () {

    const WEBRTCERR = "webrtc";

    const VALID_MSG_TYPES = [
        defs.PEERMSG_TXTMSG,
        defs.PEERMSG_GROUPCHAT_INVITE,
        defs.PEERMSG_GROUPCHAT_INVITE_RESP,
        defs.PEERMSG_TYPING
    ];

    function WebRTCData(contact) {

        var dataChannel;
        var webrtcdata = {};

        if (!contact || !contact.name) {
            throw new Error("invalid contact at WebRTCData constructor");
        }

        webrtcdata.contact = contact;

        webrtcdata.connected = false;

        webrtcdata.is_outgoing_call = false;
        webrtcdata.connection = 0;
        webrtcdata.ice_servers = 0;

        webrtcdata.onrcvstatechange = function () { };

        function create_connection() {

            // Create a new PeerConnection
            var servers = { iceServers: webrtcdata.ice_servers };
            var connection = new RTCPeerConnection(servers);

            logger.debug('WebRTC: connection for ' + webrtcdata.contact.name );

            if (webrtcdata.is_outgoing_call) {
                var label = appsrvc.username + "-data-" + contact.name;;
                logger.debug('WebRTC: creating data channel for ' + ' label: ' + label);

                dataChannel = connection.createDataChannel(label);

                dataChannel.onopen = webrtcdata.onrcvstatechange;
                dataChannel.onclose = webrtcdata.onrcvstatechange;
                dataChannel.onmessage = onReceiveDataCallback;
            }
            else {
                // for the incoming call
                connection.ondatachannel = webrtcdata.onReceiveChannel;
            }

            // ICE Candidate Callback
            connection.onicecandidate = function (event) {
                if (event.candidate) {
                    // Found a new candidate
                    logger.debug('WebRTC: onicecandidate, candidate: %j', event.candidate);
                    var message = { cmd: defs.PEERMSG_DATA_WEBRTC, type: "candidate", "candidate": event.candidate };
                    peercomm.send_peer_message(webrtcdata.contact, message);
                }
                else {
                    logger.debug('WebRTC: ICE candidate gathering is completed');
                }
            };

            connection.onnegotiationneeded = function () {
                if (webrtcdata.is_outgoing_call) {
                    logger.debug('WebRTC: connection.onnegotiationneeded -> create offer');

                    // Send an offer for a connection
                    connection.createOffer(
                        function (desc) {
                            try {
                                connection.setLocalDescription(desc, function () {
                                    logger.debug("WebRTC: createOffer() callback. Send sdp localDescription");
                                    var message = { cmd: defs.PEERMSG_DATA_WEBRTC, type: "sdp", "sdp": connection.localDescription };
                                    peercomm.send_peer_message(webrtcdata.contact, message);
                                });
                            }
                            catch (err) {
                                webrtcdata.onerror("setLocalDescription error: %j", err);
                            }
                        },
                        function (error) {
                            webrtcdata.onerror('connection createOffer error: %j', error);
                        }
                    );
                }
            }

            // And return it
            return connection;
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
                        webrtcdata.onerror("WEBRTC: addIceCandidate error: %j", err);
                    }
                );
            }
            catch (err) {
                webrtcdata.onerror("WEBRTC: addIceCandidate error: %j", err);
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
                        if (connection.remoteDescription.type == "offer" && !webrtcdata.is_outgoing_call) { //  only the callee creates an answer
                            logger.info('WebRTC: received offer, sending response');
                            connection.createAnswer(
                                function (desc) {
                                    connection.setLocalDescription(desc, function () {
                                        logger.debug('WebRTC: send sdp connection.localDescription:');
                                        logger.debug('%j', connection.localDescription);
                                        var message = { cmd: defs.PEERMSG_DATA_WEBRTC, type: "sdp", "sdp": connection.localDescription };
                                        peercomm.send_peer_message(webrtcdata.contact, message);
                                    });
                                },
                                function (error) {
                                    webrtcdata.onerror('Error creating session description: ' + error);
                                }
                            );
                        }
                        else if (connection.remoteDescription.type == "answer") {
                            logger.info('WebRTC: caller setRemoteDescription success');
                        }
                    },
                    function (error) {
                        webrtcdata.onerror('setRemoteDescription error: %j', error);
                    }
                );
            }
            catch (err) {
                webrtcdata.onerror("setRemoteDescription error: %j", err);
            }
        }

        function onReceiveChannelStateChange() {
            var readyState = dataChannel.readyState;
            console.log('Receive channel state is: ' + readyState);
        }

        function handleMessage(msg) {
            try {
                if (!appsrvc.account_connected)
                    throw new Error("the application user is not yet initialized");

                var msgarray = peermsg.get_msg_array(msg);
                if (!msgarray || !msgarray.length || msgarray.length != 3)
                    throw new Error("invalid message");

                var header = msgarray[0];
                var payload = msgarray[1];
                if (!payload || !payload.aud)
                    throw new Error("invalid aud element");

                if (payload.aud != appsrvc.username) {
                    throw new Error("aud is " + payload.aud + " invalid for user " + appsrvc.username);
                }

                var sender = payload.iss;
                if (!sender)
                    throw new Error("invalid sender element");

                //  get the public key for the sender only contacts are
                //  allowed communicate with eachother via peer to peer
                var public_key = contactlist.get_publickey_hex(sender);
                if (!public_key)
                    throw new Error("The public key must exists for the sender");

                var message = peermsg.decode(msg, public_key);
                if (!message || !message.data) {
                    throw new Error("invalid JWT message");
                }

                var session = peercomm.getsessionkey(sender);
                if (!session) {
                    throw new Error("handleSymmMessage error, session does not exist for " + sender);
                }

                var symmetric_key = session.symmetric_key;
                var plaintext = peermsg.decrypt(symmetric_key, message.data);
                var data;
                try {
                    data = JSON.parse(plaintext);
                }
                catch (e) {
                }

                //  process the data
                if (!data || !data.cmd) {
                    throw new Error("invalid data received");
                }

                if (VALID_MSG_TYPES.indexOf(data.cmd) < 0) {
                    throw new Error("invalid data command received, 'TXTMSG' is expected");
                }

                switch (data.cmd) {
                    case defs.PEERMSG_TXTMSG:
                        data.time = utilities.timeNow();
                        appsrvc.add_textmsg(data.sender, data);
                        appevents.dispatch("oncontactevent", "on-text-message", data);
                        break;
                    case defs.PEERMSG_GROUPCHAT_INVITE:
                        appevents.dispatch("oncontactevent", "on-invite-message", data);
                        break;
                    case defs.PEERMSG_GROUPCHAT_INVITE_RESP:
                        appevents.dispatch("oncontactevent", "on-invite-message-resp", data);
                        break;
                    default:
                        throw new Error('Unsupported message type');
                        break;
                }
            }
            catch (err) {
                webrtcdata.onerror('Handle message error: ', err.message);
            }

        }

        function onReceiveDataCallback(event) {
            try {
                if (!event || !event.data) { return; }

                if (typeof event.data === "string") {
                    handleMessage(event.data);
                }
            }
            catch (err) {
                webrtcdata.onerror('WebRTC receive data error: ', err.message);
            }
        }

        webrtcdata.onReceiveChannel = function (event) {
            console.log('onReceiveChannel()');
            dataChannel = event.channel;

            dataChannel.onmessage = onReceiveDataCallback;

            dataChannel.onopen = webrtcdata.onrcvstatechange;
            dataChannel.onclose = webrtcdata.onrcvstatechange;
        }

        // Hand off a new signal from the signaler to the connection
        // listen on the data received event
        webrtcdata.onSignalReceive = function (data) {
            //var signal = JSON.parse(data);
            var connection = get_webrtc_connection();

            logger.debug('WebRTC: received signal type: %s', data.type);

            // Route signal based on type
            if (data.sdp) {
                onSdpSignalReceived(connection, data.sdp);
            }
            else if (data.candidate) {
                onCandidateSignalReceived(connection, data.candidate);
            }
            else {
                webrtcdata.onerror('onReceiveSignal error: unknown signal type');
            }
        }


        function closeDataChannel() {
            try {
                if (dataChannel) {
                    dataChannel.close();
                    console.log('Closed data channel with label: ' + dataChannel.label);
                }
            }
            catch (err) {}

            try {
                if (webrtcdata.connection) {
                    webrtcdata.connection.close();
                    webrtcdata.connection = null;
                    console.log('Closed webrtc peer connections');
                }
            }
            catch (err) {}

            try {
                webrtcdata.connected = false;
                webrtcdata.dispose();
            }
            catch (err) {}
        }

        function get_webrtc_connection() {
            if (!webrtcdata.connection) {
                webrtcdata.connection = create_connection();
            }
            return webrtcdata.connection;
        }

        webrtcdata.close = function () {
            logger.debug("webrtcdata close()");
            closeDataChannel();
        }

        webrtcdata.dispose = function () {
            logger.debug("webrtcdata dispose()");
            appevents.removeSignal("on-webrtc-data-signal", webrtcdata.onSignalReceive);
        }

        webrtcdata.send = function (data) {
            try {
                if (!webrtcdata.connected || dataChannel.readyState == "closed") {
                    return appevents.dispatch("on-webrtc-connection-closed", webrtcdata.contact.name);
                }

                dataChannel.send(data);
                console.log('senddata');
            }
            catch (err) {
                webrtcdata.onerror("Data send error %j", err);
            }
        }

        webrtcdata.onclosed = function () {
        };

        webrtcdata.onerror = function (err, param) {
            try {
                appevents.error( 0x8201, err, param);
            }
            catch (e) { }
        };

        //
        //  Send file initialization
        //
        webrtcdata.createchannel = function (issender, callback) {
            try {
                webrtcdata.is_outgoing_call = issender;
                webrtcdata.connection = null;
                webrtcdata.ice_servers = settings.iceservers;

                if (!webrtcdata.ice_servers) {
                    throw new Error("Ice resolver configuration is missing at create channel");
                }

                if (!webrtcdata.contact) {
                    throw new Error("Contact parameter is missing at create channel");
                }

                var onerror = webrtcdata.onerror;

                webrtcdata.onrcvstatechange = function() {
                    var readyState = dataChannel.readyState;
                    console.log('Send channel state is: ' + readyState);
                    if (readyState === 'open') {
                        webrtcdata.connected = true;
                        // return the promise
                        callback();
                    }
                    else {
                        webrtcdata.connected = false;
                        try {
                            webrtcdata.onclosed(webrtcdata.contact.name);
                            appevents.dispatch("on-webrtc-connection-closed", webrtcdata.contact.name);
                        }
                        catch (err) { }
                    }
                }

                // wait for the signals
                appevents.addListener("on-webrtc-data-signal", webrtcdata.onSignalReceive);

                // this is the file sender, this is the outgoing call
                // create the WebRTC connection
                get_webrtc_connection();

            }
            catch (err) {
                webrtcdata.onerror(err);
                callback(err);
            }
        };

        return webrtcdata;
    }

    module.exports = WebRTCData;

}());
