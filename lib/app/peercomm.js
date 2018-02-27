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

const util = require('util');
const peermsg = require("peermsg");
const Map = require("collections/map");
const secrand = require('secure-random');
const createHash = require('create-hash');
const appsrvc = require('./appsrvc');
const logger = require('./logger');
const defs = require('./definitions');
const appevents = require("appevents");
const contactlist = require("contactlist");
const apputils = require("apputils");
const utilities = require("utilities");
const bs58check = require('bs58check');
const Buffer = require('jspm/nodelibs-buffer').Buffer;
const WebRTCData = require('webrtcdata');


(function () {

    var msgmap = new Map();
    var list_of_sessionkeys = {};
    var list_of_waithandlers = {};

    var peercomm = {};

    peercomm.onPeerError = function (payload) {
        try {
            var err = payload.error, contact = payload.contact, data = payload.data;
            // get the jti field from the data
            var ishandled = false;
            if (data) {
                var buffer = new Buffer(data).toString();
                var obj = JSON.parse(buffer);
                if (obj.data) {
                    var msg = peermsg.getpayload(obj.data);
                    if (msg && msg.jti) {
                        var handler = list_of_waithandlers[msg.jti];
                        if (handler && handler.waitfunc && handler.rejectfunc && handler.resolvefunc) {
                            try {
                                streembit.notify.hideprogress();
                                clearTimeout(handler.waitfunc);
                                return handler.rejectfunc(err);
                            }
                            catch (e) { }
                        }
                    }
                }
            }

            if (!ishandled) {
                //TODO don't show all errors
                streembit.notify.error("onPeerError error %j", err);
            }
        }
        catch (e) {
            logger.error("onPeerError error %j", e);
        }
    }

    function create_id() {
        var id = secrand.randomBuffer(8).toString("hex");
        return id;
    }

    function peersend(contact, data, callback ) {
        appevents.peersend(contact, data, callback);
    }

    function netsend(key, value, callback) {
        appevents.netsend(key, value, callback);
    }

    function create_hash_id(data) {
        if (typeof data != "string") {
            data = JSON.stringify(data);
        }
        var hashid = createHash('sha1').update(data).digest().toString('hex');
        return hashid;
    }

    function closeWaithandler(jti, result) {
        var handler = list_of_waithandlers[jti];
        if (handler) {
            try {
                streembit.notify.hideprogress();
            }
            catch (e) { }

            try {
                if (handler.waitfunc) {
                    clearTimeout(handler.waitfunc);
                }
            }
            catch (e) { }

            try {
                if (handler.resolvefunc) {
                    handler.resolvefunc(result);
                }
            }
            catch (e) { }

            try {
                delete list_of_waithandlers[jti];
            }
            catch (e) { }
        }
        else {
            console.log("closeWaithandler jti: " + jti + " NO HANDLER");
        }
    }

    function handleAcceptKey(sender, payload, msgtext) {
        try {
            logger.debug("Accept Key message received");
            // the msgtext is encrypted with the session symmetric key
            var session = list_of_sessionkeys[sender];
            if (!session) {
                throw new Error("Accept key unable to complete, session does not exist for " + sender);
            }

            var symmetric_key = session.symmetric_key;
            var plaintext = peermsg.decrypt(symmetric_key, msgtext);
            var data = JSON.parse(plaintext);
            //  must have the request_jti field
            var jti = data[peermsg.MSGFIELD.REQJTI]

            logger.debug("key for list of session accepted by " + sender);
            list_of_sessionkeys[sender].accepted = true;

            // find the wait handler, remove it and return the promise
            closeWaithandler(jti);
        }
        catch (e) {
            streembit.notify.error("handleAcceptKey error %j", e);
        }
    }

    function handleKeyExchange(sender, public_key, payload, msgtext) {
        try {
            logger.debug("Peer exchange key request received");

            var message = JSON.parse(msgtext);

            if (message.public_key != public_key) {
                throw new Error("invalid public key for contact " + sender);
            }

            // create a session by performing a symmetric key exchange
            var data = message.data;
            // decrypt the message to get the symmetric key
            var plaintext = peermsg.ecdh_decrypt(appsrvc.cryptokey, public_key, data);
            var plain_data = JSON.parse(plaintext);
            if (!plain_data)
                throw new Error("invalid message data for key exchange contact " + sender);

            var session_symmkey = plain_data.symmetric_key;
            if (!session_symmkey) {
                throw new Error("invalid session symmetric key for contact " + sender);
            }

            // send key accepted message
            var data = {};
            data[peermsg.MSGFIELD.REQJTI] = payload.jti;

            var contact = contactlist.get_contact(sender);
            var jti = create_id();
            var encoded_msgbuffer = peermsg.create_symm_msg(peermsg.PEERMSG.ACCK, jti, appsrvc.cryptokey, session_symmkey, data, appsrvc.username, sender);

            peersend(contact, encoded_msgbuffer, (err) => {
                if (err) {
                    return streembit.notify.error("Peer send message error %j", err, true);
                }

                logger.debug("received symm key %s from contact %s, ACCK sent", session_symmkey, sender);

                list_of_sessionkeys[sender] = {
                    symmetric_key: session_symmkey,
                    contact_public_key: message.public_key,
                    timestamp: Date.now(),
                    accepted: true
                };
            });

        }
        catch (e) {
            streembit.notify.error("Handle key exchange error %j", e);
        }
    }

    function handlePing(sender, payload, msgtext) {
        try {
            logger.debug("Ping request received");

            var message = JSON.parse(msgtext);
            var timestamp = message[peermsg.MSGFIELD.TIMES];
            var public_key = message[peermsg.MSGFIELD.ECDHPK];
            var address = message[peermsg.MSGFIELD.HOST];
            var port = message[peermsg.MSGFIELD.PORT];
            var protocol = message[peermsg.MSGFIELD.PROTOCOL];
            logger.debug("Ping from: " + sender + ", address: " + address + ", port: " + port + ", protocol: " + protocol + ", public_key: " + public_key );

            if (!list_of_sessionkeys[sender]) {
                list_of_sessionkeys[sender] = {};
            }
            list_of_sessionkeys[sender].contact_public_key = public_key;
            logger.debug("handlePing public_key: " + public_key + " for " + sender);

            // send Ping reply message
            var data = {};
            data[peermsg.MSGFIELD.REQJTI] = payload.jti;
            data[peermsg.MSGFIELD.ECDHPK] = appsrvc.publickeyhex;

            var contact = contactlist.get_contact(sender);
            if (!contact) {
                throw new Error("Ping error: contact not exists");
            }

            contact.address = address;
            contact.port = port;
            contact.protocol = protocol;
            // update the contact with the latest address, port adn protocol data
            contactlist.update(contact, function () {
                try {
                    var jti = create_id();
                    var encoded_msgbuffer = peermsg.create_typedmsg(peermsg.PEERMSG.PREP, jti, appsrvc.cryptokey, data, appsrvc.username, sender);

                    peersend(contact, encoded_msgbuffer, (err) => {
                        if (err) {
                            return streembit.notify.error("Handle ping peer send error %j", err, true);
                        }

                        // update the contact online indicator
                        appevents.dispatch("oncontactevent", "contact-online", sender, true);


                        // update address, port, etc.
                        appevents.dispatch("oncontactevent", "update-contact", contact.name, contact);
                    });

                }
                catch (se) {
                    streembit.notify.error("Handle ping error %j", se, true);
                }
            });

        }
        catch (e) {
            streembit.notify.error("handlePing error %j", e, true);
        }
    }

    function handlePingReply(sender, payload, msgtext) {
        try {
            logger.debug("Ping reply (PREP) message received");

            var data = JSON.parse(msgtext);
            //  must have the request_jti field
            var jti = data[peermsg.MSGFIELD.REQJTI];
            var public_key = data[peermsg.MSGFIELD.ECDHPK];

            if (!list_of_sessionkeys[sender]) {
                list_of_sessionkeys[sender] = {};
            }
            list_of_sessionkeys[sender].contact_public_key = public_key;
            logger.debug("handlePingReply public_key: " + public_key + " for " + sender);

            // find the wait handler, remove it and return the promise
            closeWaithandler(jti);

            // update the contact online indicator
            appevents.dispatch("oncontactevent", "contact-online", sender, true);
        }
        catch (e) {
            streembit.notify.error("handlePingReply error %j", e);
        }
    }

    //
    function handleHangupCall(sender, payload, msgtext) {
        try {
            logger.debug("Hangup call (HCAL) message received");

            var session = list_of_sessionkeys[sender];
            if (!session) {
                throw new Error("handleHangupCall error, session does not exist for " + sender);
            }

            appevents.dispatch("on-cmd-hangup-call", sender, payload);
            //
        }
        catch (e) {
            streembit.notify.error("handleCallReply error %j", e);
        }
    }

    function handleShareScreenOffer(sender, payload, msgtext) {
        try {
            logger.debug("Share screen offer received");

            var session = list_of_sessionkeys[sender];
            if (!session) {
                throw new Error("Share screen offer error, session does not exist for " + sender);
            }

            var msg = JSON.parse(msgtext);
            var taskid = msg[peermsg.MSGFIELD.TASKID];

            apputils.accept_sharescreen(sender, function (result) {
                var data = {};
                data[peermsg.MSGFIELD.REQJTI] = payload.jti;
                data[peermsg.MSGFIELD.RESULT] = result ? true : false;
                data[peermsg.MSGFIELD.TASKID] = taskid;

                var contact = contactlist.get_contact(sender);
                var jti = create_id();
                var encoded_msgbuffer = peermsg.create_typedmsg(peermsg.PEERMSG.RSSC, jti, appsrvc.cryptokey, data, appsrvc.username, sender);

                peersend(contact, encoded_msgbuffer, (err) => {
                    if (err) {
                        return streembit.notify.error("Peer send message error %j", err, true);
                    }

                    // if the call was accepted on the UI then navigate to the share screen view and wait for the WebRTC session
                    if (result) {
                        var params = {
                            contact: contact,
                            taskid: taskid
                        };
                        appevents.send(appevents.TYPES.ONSCREENOFFER, params);
                    }
                });
            });
        }
        catch (e) {
            streembit.notify.error("Handle share screen offer error %j", e, true);
        }
    }

    function handleShareScreenReply(sender, payload, msgtext) {
        try {
            logger.debug("Share screen reply (RSSC) message received");

            var session = list_of_sessionkeys[sender];
            if (!session) {
                throw new Error("handleCallReply error, session does not exist for " + sender);
            }

            var data = JSON.parse(msgtext);
            //  must have the request_jti field
            var jti = data[peermsg.MSGFIELD.REQJTI];
            var result = data[peermsg.MSGFIELD.RESULT];

            // find the wait handler, remove it and return the promise
            closeWaithandler(jti, result);
        }
        catch (e) {
            streembit.notify.error("Share screen reply handler error %j", e);
        }
    }

    function handleCall(sender, payload, msgtext) {
        try {
            logger.debug("Call request received");

            var session = list_of_sessionkeys[sender];
            if (!session) {
                throw new Error("session does not exist for " + sender);
            }

            var message = JSON.parse(msgtext);
            var calltype = message[peermsg.MSGFIELD.CALLT];
            if (!calltype) {
                throw new Error("invalid call type");
            }
            logger.debug("call type: " + calltype);

            let msg = null, title = null, invite = false, sound = null;
            if (typeof message.payload !== 'undefined') {
                invite = true;
                if (!message.payload.sid) {
                    return streembit.notify.error('Invalid invite received from %j', message.payload.sender || 'international mystery guy');
                }

                msg = message.payload.msg;
                title = message.payload.title;
                if (calltype === 'chat') {
                    sound = 'ringsound2';
                }
            }

            apputils.accept_call(sender, calltype, msg, title, sound,  function (result) {
                var data = {};
                data[peermsg.MSGFIELD.REQJTI] = payload.jti;
                data[peermsg.MSGFIELD.CALLT] = calltype;
                data[peermsg.MSGFIELD.RESULT] = result ? true : false;

                var contact = contactlist.get_contact(sender);
                var jti = create_id();
                var encoded_msgbuffer = peermsg.create_typedmsg(peermsg.PEERMSG.CREP, jti, appsrvc.cryptokey, data, appsrvc.username, sender);

                peersend(contact, encoded_msgbuffer, (err) => {
                    if (err) {
                        return streembit.notify.error("Peer send message error %j", err, true);
                    }

                    // as the call was accepted on the UI then navigate to the video call view and wait for the WebRTC session
                    if (result) {
                        const uioptions = {
                            contact: contact,
                            calltype: calltype,
                            iscaller: false // this is the recipient of the call -> iscaller = false
                        };
                        if (invite) {
                            uioptions.attendees = message.payload.attendees;
                            uioptions.sid = message.payload.sid;
                        }
                        if (calltype === 'chat') {
                            uioptions.issession = true;
                        }

                        const view = (calltype === "videocall") ? "video-call" : (calltype === "audiocall") ? "audio-call" : "contact-chat";
                        appevents.navigate(view, uioptions);
                    }
                });
            });
        }
        catch (e) {
            streembit.notify.error("Handle call error %j", e);
        }
    }

    function handleCallReply(sender, payload, msgtext) {
        try {
            logger.debug("Call reply (CREP) message received");

            var session = list_of_sessionkeys[sender];
            if (!session) {
                throw new Error("handleCallReply error, session does not exist for " + sender);
            }

            var data = JSON.parse(msgtext);
            //  must have the request_jti field
            var jti = data[peermsg.MSGFIELD.REQJTI];
            var calltype = data[peermsg.MSGFIELD.CALLT];
            var result = data[peermsg.MSGFIELD.RESULT];

            // find the wait handler, remove it and return the promise
            closeWaithandler(jti, result);

        }
        catch (e) {
            streembit.notify.error("handleCallReply error %j", e);
        }
    }

    function handleGroupAdd(sender, payload, msgtext) {
        try {
            logger.debug("Group add request (GCAD) message received");

            var session = list_of_sessionkeys[sender];
            if (!session) {
                throw new Error("handleGroupAdd error, session does not exist for " + sender);
            }

            const data = JSON.parse(msgtext);
            const payload = JSON.parse(data.payload);
            if (
                [defs.CALLTYPE_AUDIO, defs.CALLTYPE_VIDEO].indexOf(data[peermsg.MSGFIELD.CALLT]) ||
                !payload ||
                !payload[peermsg.MSGFIELD.GSID] ||
                !payload['attendee']
            ) {
                // send hangup request to attendee
                return streembit.notify.error('Invalid group add payload received');
            }

            payload.sid = payload[peermsg.MSGFIELD.GSID];
            delete payload[peermsg.MSGFIELD.GSID];

            appevents.dispatch('groupcallevent', 'add-to-groupcall', payload);
        }
        catch (e) {
            streembit.notify.error("handleGroupAdd error %j", e);
        }
    }

    function handleOfferTextChat(sender, payload, data) {
        try {
            logger.debug("Offer text chat request received");

            var session = list_of_sessionkeys[sender];
            if (!session) {
                throw new Error("session does not exist for " + sender);
            }

            var params = JSON.parse(data);
            if (!params)
                throw new Error("invalid data from " + sender);

            var contact = contactlist.get_contact(sender);
            params.contact = contact;
            appevents.send(appevents.TYPES.ONCHATOFFER, params);

            //
        }
        catch (e) {
            streembit.notify.error("Handle offer text chat error:  %j", e, true);
        }
    }

    function handleFileInit(sender, payload, data) {
        try {
            logger.debug("File init request received");

            if (!window.FileReader) {
                return alert('A contact want to send you a file, but FileReader API is not supported by your browser. File send is terminating.');
            }

            var session = list_of_sessionkeys[sender];
            if (!session) {
                throw new Error("handleFileInit error, session does not exist for " + sender);
            }

            var params = JSON.parse(data);
            if (!params || !params.file_name || !params.file_size)
                throw new Error("handleFileInit error, invalid file data from " + sender);

            apputils.accept_file(sender, params.file_name, params.file_size, params.action_type, function (result) {
                var data = {};
                data[peermsg.MSGFIELD.REQJTI] = payload.jti;
                data[peermsg.MSGFIELD.RESULT] = result === true;

                var contact = contactlist.get_contact(sender);
                var jti = create_id();
                var encoded_msgbuffer = peermsg.create_typedmsg(peermsg.PEERMSG.CREP, jti, appsrvc.cryptokey, data, appsrvc.username, sender);

                peersend(contact, encoded_msgbuffer, (err) => {
                    if (err) {
                        return streembit.notify.error("Peer send message error %j", err, true);
                    }

                    if (result) {
                        params.contact = contact;
                        appevents.send(appevents.TYPES.ONFILEINIT, params);
                    }
                });
            });
        }
        catch (e) {
            streembit.notify.error("handleFileInit error %j", e);
        }
    }

    function handleFileReply(sender, payload, msgtext) {
        try {
            logger.debug("File reply (FREP) message received");

            var session = list_of_sessionkeys[sender];
            if (!session) {
                throw new Error("handleCallReply error, session does not exist for " + sender);
            }

            var data = JSON.parse(msgtext);
            //  must have the request_jti field
            var jti = data[peermsg.MSGFIELD.REQJTI];
            var result = data[peermsg.MSGFIELD.RESULT];

            // find the wait handler, remove it and return the promise
            closeWaithandler(jti, result);

        }
        catch (e) {
            streembit.notify.error("handleCallReply error %j", e);
        }
    }

    function handleAddContactRequest(sender, payload, msgtext) {
        try {
            logger.debug("Add contact request message received");

            var data = JSON.parse(msgtext);
            var contact = {
                name: sender,
                protocol: data[peermsg.MSGFIELD.PROTOCOL],
                address: data[peermsg.MSGFIELD.HOST],
                port: data[peermsg.MSGFIELD.PORT],
                public_key: data[peermsg.MSGFIELD.PUBKEY],
                user_type: data[peermsg.MSGFIELD.UTYPE]
            };

            appevents.dispatch("on-netreceive-addcontact", contact);

            // close, don't reply here
        }
        catch (e) {
            streembit.notify.error("handleAddContactRequest error %j", e);
        }
    }

    /*
     * The contact replied with an accept for the add contact request
     */
    function handleAddContactAcceptReply(sender, payload, msgtext) {
        try {
            logger.debug("Add contact request message received");

            var data = JSON.parse(msgtext);
            var account = data.sender;
            if (sender != account) {
                throw new Error("invalid account, the account and sender do not match");
            }

            appevents.dispatch("on-netreceive-addcontact-accepted", account);

            // close, don't reply here
        }
        catch (e) {
            streembit.notify.error("handleAddContactRequest error %j", e);
        }
    }

    /*
     * The contact replied with a deny (DACR) for the add contact request
     */
    function handleAddContactDenyReply(sender, payload, msgtext) {
        try {
            logger.debug("Add contact request message received");

            var data = JSON.parse(msgtext);
            var account = data.sender;
            if (sender != account) {
                throw new Error("invalid account, the account and sender do not match");
            }

            appevents.dispatch("on-netreceive-addcontact-denied", account);

            // close, don't reply here
        }
        catch (e) {
            streembit.notify.error("handleAddContactDenyReply error %j", e);
        }
    }

    function handleSymmMessage(sender, payload, msgtext) {
        try {
            //logger.debug("handleSymmMessage message received");

            // the msgtext is encrypted with the session symmetric key
            var session = list_of_sessionkeys[sender];
            if (!session) {
                throw new Error("handleSymmMessage error, session does not exist for " + sender);
            }

            var symmetric_key = session.symmetric_key;

            var plaintext = peermsg.decrypt(symmetric_key, msgtext);
            var data = JSON.parse(plaintext);

            //  process the data
            if (!data || !data.cmd)
                return;

            switch (data.cmd) {
                case defs.PEERMSG_TXTMSG:
                    try {
                        data.time = utilities.timeNow();
                        appsrvc.add_textmsg(data.sender, data);
                        appevents.dispatch("oncontactevent", "on-text-message", data);
                    }
                    catch (e) {
                        streembit.notify.error("Error in handling chat message %j", e);
                    }
                    break;

                case defs.PEERMSG_TYPING:
                    appevents.dispatch("ontyping");
                    break;

                case defs.PEERMSG_CALL_WEBRTC:
                    appevents.dispatch("on-call-webrtc-signal", data);
                    break;

                case defs.PEERMSG_CALL_WEBRTCSS:
                    appevents.dispatch("on-webrtc-screen-signal", data);
                    break;

                case defs.PEERMSG_CALL_WEBRTCAA:
                    appevents.dispatch("on-audio-webrtc-signal", data);
                    break;

                case defs.PEERMSG_FILE_WEBRTC:
                    appevents.dispatch("on-webrtc-file-signal", data);
                    break;

                case defs.PEERMSG_DATA_WEBRTC:
                    appevents.dispatch("on-webrtc-data-signal", data);
                    break;

                case defs.PEERMSG_FSEND:
                    appevents.emit(appevents.APPEVENT, appevents.TYPES.ONFCHUNKSEND, data);
                    break;

                case defs.PEERMSG_FEXIT:
                    //logger.debug("PEERMSG_FSEND message received");
                    appevents.emit(appevents.APPEVENT, appevents.TYPES.ONFILECANCEL, data);
                    break;

                case defs.PEERMSG_DEVDESC:
                    //logger.debug("PEERMSG_DEVDESC message received");
                    appevents.emit(appevents.APPEVENT, "peermsg_devdesc", { sender: sender, data: data });
                    break;

                case defs.PEERMSG_DEVREAD_PROP_REPLY:
                    //logger.debug("PEERMSG_DEVREAD_PROP_REPLY message received");
                    appevents.emit(appevents.APPEVENT, "peermsg_devread_prop_reply", { sender: sender, data: data.payload });
                    break;

                case defs.PEERMSG_DEVSUBSC_REPLY:
                    //logger.debug("PEERMSG_DEVSUBSC_REPLY message received");
                    appevents.emit(appevents.APPEVENT, "peermsg_devsubsc_reply", { sender: sender, data: data.payload });
                    break;

                case defs.PEERMSG_DEV_EVENT:
                    //logger.debug("PEERMSG_DEV_EVENT message received");
                    appevents.emit(appevents.APPEVENT, "peermsg_dev_event", { sender: sender, data: data.payload });
                    break;

                default:
                    break;
            }
        }
        catch (e) {
            streembit.notify.error("handleSymmMessage error %j", e);
        }
    }

    peercomm.onPeerMessage = function (message) {
        try {
            if (!message || !message.contact || !message.contact.pkhash || !message.payload) {
                return logger.error("WS peer message error: invalid message context", null, true);
            }

            if (message.contact.pkhash != appsrvc.pubkeyhash) {
                return logger.error("WS peer message error: invalid message contact", null, true);
            }

            //var payload = JSON.parse( message.payload);
            if (!message.payload) {
                return streembit.notify.error("WS peer message error: invalid message payload", null, true);
            }

            //
            peercomm.processPeerMsg(message.payload);
        }
        catch (e) {
            logger.error("onPeerMessage error: %j", e)
        }
    }

    peercomm.processPeerMsg = function (data, info) {
        try {
            if (!appsrvc.account_connected) {
                return streembit.notify.info("Peer message received but the user is not initialized", null, true);
            }

            var msgarray = peermsg.get_msg_array(data);
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
            if (!public_key) {
                throw new Error("no public key for contact " + sender);
            }

            var message = peermsg.decode(data, public_key);
            if (!message || !message.data) {
                throw new Error("invalid JWT message");
            }

            switch (message.sub) {
                case peermsg.PEERMSG.EXCH:
                    handleKeyExchange(sender, public_key, payload, message.data);
                    break;
                case peermsg.PEERMSG.ACCK:
                    handleAcceptKey(sender, payload, message.data);
                    break;
                case peermsg.PEERMSG.PING:
                    handlePing(sender, payload, message.data);
                    break;
                case peermsg.PEERMSG.PREP:
                    handlePingReply(sender, payload, message.data);
                    break;
                case peermsg.PEERMSG.SYMD:
                    handleSymmMessage(sender, payload, message.data);
                    break;
                case peermsg.PEERMSG.CALL:
                    handleCall(sender, payload, message.data);
                    break;
                case peermsg.PEERMSG.CREP:
                    handleCallReply(sender, payload, message.data);
                    break;
                case peermsg.PEERMSG.GCAD:
                    handleGroupAdd(sender, payload, message.data);
                    break;
                case peermsg.PEERMSG.SSCA:
                    handleShareScreenOffer(sender, payload, message.data);
                    break;
                case peermsg.PEERMSG.RSSC:
                    handleShareScreenReply(sender, payload, message.data);
                    break;
                case peermsg.PEERMSG.FILE:
                    handleFileInit(sender, payload, message.data);
                    break;
                case peermsg.PEERMSG.FREP:
                    handleFileReply(sender, payload, message.data);
                    break;
                case peermsg.PEERMSG.HCAL:
                    handleHangupCall(sender, payload, message.data);
                    break;
                case peermsg.PEERMSG.ACRQ:
                    handleAddContactRequest(sender, payload, message.data);
                    break;
                case peermsg.PEERMSG.AACR:
                    handleAddContactAcceptReply(sender, payload, message.data);
                    break;
                case peermsg.PEERMSG.DACR:
                    handleAddContactDenyReply(sender, payload, message.data);
                    break;
                case peermsg.PEERMSG.OFTX:
                    handleOfferTextChat(sender, payload, message.data);
                    break;

                default:
                    break;
            }
        }
        catch (err) {
            streembit.notify.error("Error in handling peer message: %j", err, true);
        }
    }

    function dequeuemsg(key) {
        var value = msgmap.get(key);
        msgmap.delete(key);
        return value;
    }

    //
    //  Wait on certain messages such as the key exchanges and peer session establish operations
    //
    function wait_peer_reply(jti, timeout, showprog) {

        return new Promise(function (resolve, reject) {

            var waitproc = null;

            try {
                var waitForComplete = function (waitms) {
                    var index = 0;
                    var count = parseInt((waitms / 1000)) || 15;
                    waitproc = setInterval(
                        function () {
                            index++;
                            if (index < count) {
                                return;
                            }

                            try {
                                clearTimeout(waitproc);
                                waitproc = null;
                            }
                            catch (e) { }

                            try {
                                if (showprog) {
                                    streembit.notify.hideprogress();
                                }
                                reject("TIMEDOUT");
                                delete list_of_waithandlers[jti];
                            }
                            catch (e) { }
                        },
                        1000
                    );

                    return {
                        jti: jti,
                        waitfunc: waitproc,
                        rejectfunc: reject,
                        resolvefunc: resolve
                    }
                }

                var timeoutval = timeout || 15000;
                var waithandler = waitForComplete(timeoutval);
                list_of_waithandlers[jti] = waithandler;

                if (showprog) {
                    logger.debug("Waiting reply from peer ... ");
                }

                logger.debug("wait peer complete jti: " + jti);

            }
            catch (err) {
                if (waitproc) {
                    clearTimeout(waitproc);
                    waitproc = null;
                }
                reject(err);
            }

        });
    }

    function exchange_session_key(contact) {
        return new Promise(function (resolve, reject) {
            try {

                var account = contact.name;

                // Ping must be performed before the key exchange, there fore the public_key must exists at this point
                if (!list_of_sessionkeys[account] || !list_of_sessionkeys[account].contact_public_key) {
                    return reject("contact ecdh public key doesn't exists. Must PING first to get the ecdh public key.");
                }

                var public_key = list_of_sessionkeys[account].contact_public_key;

                // create a symmetric key for the session
                var random_bytes = secrand.randomBuffer(32);
                var session_symmkey = createHash('sha256').update(random_bytes).digest().toString('hex');

                logger.debug("exchange symm key %s with contact %s", session_symmkey, account);
                logger.debug("using ecdh public key %s", public_key);

                var plaindata = { symmetric_key: session_symmkey };
                var cipher = peermsg.ecdh_encypt(appsrvc.cryptokey, public_key, plaindata);

                var data = {
                    account: appsrvc.username,
                    public_key: appsrvc.publickeyhex,
                    address: appsrvc.host,
                    port: appsrvc.port
                };
                data[peermsg.MSGFIELD.DATA] = cipher;

                var jti = create_id();
                var encoded_msgbuffer = peermsg.create_typedmsg(peermsg.PEERMSG.EXCH, jti, appsrvc.cryptokey, data, appsrvc.username, account);

                try {
                    peersend(contact, encoded_msgbuffer, (err) => {
                        if (err) {
                            return reject(err);
                        }

                        //  insert the session key into the list
                        list_of_sessionkeys[account] = {
                            symmetric_key: session_symmkey,
                            contact_public_key: contact.public_key,
                            timestamp: Date.now(),
                            accepted: false
                        };

                        resolve(jti);

                        //
                    });
                }
                catch (pserr) {
                    reject(pserr);
                    streembit.notify.error("Peer send message error %j", pserr, true);
                }
            }
            catch (err) {
                reject(err);
            }
        });
    }


    peercomm.send_peer_message = function (contact, message) {
        try {
            //logger.debug("send_peer_message()");

            if (!contact) {
                throw new Error("invalid contact parameter");
            }
            if (!message) {
                throw new Error("invalid message parameter");
            }

            if (!appsrvc.cryptokey) {
                throw new Error("invalid use crypto key");
            }

            var account = contact.name;
            var session = list_of_sessionkeys[account];
            if (!session || !session.accepted || !session.symmetric_key) {
                throw new Error("contact session key doesn't exists");
            }

            var jti = create_id();
            var encoded_msgbuffer = peermsg.create_symm_msg(peermsg.PEERMSG.SYMD, jti, appsrvc.cryptokey, session.symmetric_key, message, appsrvc.username, account);
            peersend(contact, encoded_msgbuffer, (err) => {
                if(err) {
                    streembit.notify.error("Send peer message error: %j", err, true);
                }
            });

            //
        }
        catch (e) {
            streembit.notify.error("Send peer message error: %j", e, true);
        }
    }

    peercomm.get_peer_message = function (contact, message) {
        try {
            //logger.debug("send_peer_message()");

            if (!contact) {
                throw new Error("invalid contact parameter");
            }
            if (!message) {
                throw new Error("invalid message parameter");
            }

            if (!appsrvc.cryptokey) {
                throw new Error("invalid use crypto key");
            }

            var account = contact.name;
            var session = list_of_sessionkeys[account];
            if (!session || !session.accepted || !session.symmetric_key) {
                throw new Error("contact session key doesn't exists");
            }

            var jti = create_id();
            var encoded_msgbuffer = peermsg.create_symm_msg(peermsg.PEERMSG.SYMD, jti, appsrvc.cryptokey, session.symmetric_key, message, appsrvc.username, account);

            return encoded_msgbuffer;
            //
        }
        catch (e) {
            streembit.notify.error("Get peer message error: %j", e, true);
        }
    }

    peercomm.ping = function (contact, showprogress, timeout, msgtype = null) {

        let pingMaxRetry = 4; // 3 attempts
        timeout = timeout || 10000;

        return new Promise(function pingPromise(resolve, reject) {
            const retry = function (err) {
                if (--pingMaxRetry > 0) {
                    logger.info('waiting on ping retry ..');
                    setTimeout(() => {
                        return pingPromise(resolve, reject);
                    }, timeout);
                } else {
                    console.log('Sending offer ..');
                    try {
                        peercomm.send_contact_offer(appsrvc.username, appsrvc.pubkeyhash, appsrvc.publicKeyBs58, contact.public_key,
                            appsrvc.connsymmkey, appsrvc.transport, appsrvc.host, appsrvc.port, appsrvc.usertype,
                            (pserr) => {
                                if (pserr) {
                                    logger.debug("Sending new contact offer failed %j", pserr);
                                    reject(pserr);
                                    return;
                                }

                                appevents.dispatch("re-find-contact", contact, showprogress, timeout, msgtype);
                                reject(err);
                            }
                        );
                    }
                    catch (pscerr) {
                        logger.debug("Error on sending new contact offer %j", pscerr);
                        reject(pscerr);
                    }
                }
            };

            try {
                var account = contact.name;
                var data = {}
                data[peermsg.MSGFIELD.TIMES] = Date.now();
                data[peermsg.MSGFIELD.ECDHPK] = appsrvc.publickeyhex;
                data[peermsg.MSGFIELD.PROTOCOL] = appsrvc.transport;
                data[peermsg.MSGFIELD.HOST] = appsrvc.host;
                data[peermsg.MSGFIELD.PORT] = appsrvc.port;
                if (msgtype === peermsg.PEERMSG.GPNG) {
                    data['attendee'] = contact;
                }

                var jti = create_id();
                var encoded_msgbuffer = peermsg.create_typedmsg(peermsg.PEERMSG.PING, jti, appsrvc.cryptokey, data, appsrvc.username, account);

                try {
                    peersend(contact, encoded_msgbuffer,
                        (err) => {
                            if (err) {
                                return retry(err);
                            }

                            wait_peer_reply(jti, timeout, showprogress)
                                .then(
                                    () => {
                                        resolve();
                                    },
                                    (err) => {
                                        return retry(err);
                                    }
                                );
                        }
                    );
                }
                catch (pserr) {
                    return retry(pserr);
                }
            }
            catch (err) {
                return retry(err);
            }
        });
    }

    peercomm.hangup_call = function (contact, group) {

        return new Promise(function (resolve, reject) {
            try {
                var account = contact.name;
                var data = {}
                data[peermsg.MSGFIELD.TIMES] = Date.now();
                data['group'] = group || 0;

                var jti = create_id();
                var encoded_msgbuffer = peermsg.create_typedmsg(peermsg.PEERMSG.HCAL, jti, appsrvc.cryptokey, data, appsrvc.username, account);

                try {
                    peersend(contact, encoded_msgbuffer, (err) => {
                        if (err) {
                            return reject(err);
                        }

                        resolve();
                    });
                }
                catch (pserr) {
                    reject(pserr);
                    streembit.notify.error("Peer send message error %j", pserr, true);
                }

                // don't wait for reply
            }
            catch (err) {
                reject(err);
            }
        });
    }

    peercomm.call = function (contact, type, showprogress, payload = null) {

        return new Promise(function (resolve, reject) {
            try {

                var account = contact.name;
                var data = {}
                data[peermsg.MSGFIELD.CALLT] = type;
                if (payload) {
                    data.payload = payload;
                }

                var jti = create_id();
                var encoded_msgbuffer = peermsg.create_typedmsg(peermsg.PEERMSG.CALL, jti, appsrvc.cryptokey, data, appsrvc.username, account);

                try {
                    peersend(contact, encoded_msgbuffer, (err) => {
                        if (err) {
                            return reject(err);
                        }

                        wait_peer_reply(jti, 10000, showprogress)
                            .then(
                                (isaccepted) => {
                                    resolve(isaccepted);
                                },
                                (err) => {
                                    reject(err);
                                }
                            );
                    });
                }
                catch (pserr) {
                    reject(pserr);
                    streembit.notify.error("Peer send message error %j", pserr, true);
                }
            }
            catch (err) {
                reject(err);
            }
        });
    }

    peercomm.group_add = function (contact, type, sid, partee) {
        try {
            var account = contact.name;
            var data = {}
            data[peermsg.MSGFIELD.CALLT] = type;
            var payload = {};
            payload[peermsg.MSGFIELD.GSID] = sid;
            payload['attendee'] = partee;
            data['payload'] = JSON.stringify(payload);

            var jti = create_id();
            var encoded_msgbuffer = peermsg.create_typedmsg(peermsg.PEERMSG.GCAD, jti, appsrvc.cryptokey, data, appsrvc.username, account);

            try {
                peersend(contact, encoded_msgbuffer, (err) => {
                    if (err) {
                        throw new Error(err);
                    }
                });
            }
            catch (pserr) {
                throw new Error(pserr);
            }
        }
        catch (err) {
            throw new Error(err);
        }
    }

    peercomm.group_callready = function(contact, type, sid, pkhash) {
        try {
            var account = contact.name;
            var data = {}
            data[peermsg.MSGFIELD.CALLT] = type;
            data[peermsg.MSGFIELD.GSID] = sid;
            data[peermsg.MSGFIELD.ECDHPK] = pkhash;

            var jti = create_id();
            var encoded_msgbuffer = peermsg.create_typedmsg(peermsg.PEERMSG.GCRP, jti, appsrvc.cryptokey, data, appsrvc.username, account);

            try {
                peersend(contact, encoded_msgbuffer, (err) => {
                    if (err) {
                        throw new Error(err);
                    }
                });
            }
            catch (pserr) {
                throw new Error(pserr);
            }
        }
        catch (err) {
            throw new Error(err);
        }
    }

    peercomm.offer_sharescreen = function (contact, taskid, resolve, reject) {
        try {
            var account = contact.name;
            var data = {}
            data[peermsg.MSGFIELD.TIMES] = Date.now();
            data[peermsg.MSGFIELD.TASKID] = taskid;

            var jti = create_id();
            var encoded_msgbuffer = peermsg.create_typedmsg(peermsg.PEERMSG.SSCA, jti, appsrvc.cryptokey, data, appsrvc.username, account);

            try {
                peersend(contact, encoded_msgbuffer, (err) => {
                    if (err) {
                        return reject(err);
                    }

                    wait_peer_reply(jti, 15000, true).then(resolve, reject);

                    //
                });
            }
            catch (pserr) {
                reject(pserr);
                streembit.notify.error("Peer send message error %j", pserr, true);
            }
        }
        catch (err) {
            reject(err);
        }
    }

    peercomm.offer_textchat = function (contact) {
        return new Promise((resolve, reject) => {
            try {
                var account = contact.name;
                var data = {}
                data[peermsg.MSGFIELD.TIMES] = Date.now();

                var jti = create_id();
                var encoded_msgbuffer = peermsg.create_typedmsg(peermsg.PEERMSG.OFTX, jti, appsrvc.cryptokey, data, appsrvc.username, account);

                try {
                    peersend(contact, encoded_msgbuffer, (err) => {
                        if (err) {
                            return reject(err);
                        }

                        resolve();
                    });
                }
                catch (pserr) {
                    reject(pserr);
                    streembit.notify.error("Peer send message error %j", pserr, true);
                }
            }
            catch (err) {
                reject(err);
            }
        });
    }

    peercomm.initfile = function (contact, filename, filesize, filehash, filetype, actiontype, timeout) {

        return new Promise(function (resolve, reject) {
            try {

                var account = contact.name;
                var data = {}
                data[peermsg.MSGFIELD.CALLT] = defs.CALLTYPE_FILET;
                data.file_name = filename;
                data.file_size = filesize;
                data.file_hash = filehash;
                data.file_type = filetype;
                data.action_type = actiontype;

                var jti = create_id();
                var encoded_msgbuffer = peermsg.create_typedmsg(peermsg.PEERMSG.FILE, jti, appsrvc.cryptokey, data, appsrvc.username, account);

                try {
                    peersend(contact, encoded_msgbuffer, (err) => {
                        if (err) {
                            return reject(err);
                        }

                        wait_peer_reply(jti, timeout || 30000, false)
                            .then(
                                (isaccepted) => {
                                    resolve(isaccepted);
                                },
                                (err) => {
                                    reject(err);
                                }
                            );
                    });
                }
                catch (pserr) {
                    reject(pserr);
                    streembit.notify.error("Peer send message error %j", pserr, true);
                }
            }
            catch (err) {
                reject(err);
            }
        });
    }

    peercomm.is_peer_session = function (account) {
        var val = list_of_sessionkeys[account];
        return val ? true : false;
    }

    peercomm.getsesskeys = function() {
        return list_of_sessionkeys;
    }

    peercomm.publish_user = function (symcryptkey, key, public_key, transport, address, port, type, callback) {
        try {
            if (!callback || typeof callback != "function") {
                return callback("publish_user error: invalid callback parameter")
            }

            //  publishing user data
            if (!public_key || !address || (transport == "tcp" && !port)) {
                return callback("invalid parameters at publish user");
            }

            var ctype = type || defs.USER_TYPE_HUMAN;

            var payload = {};
            payload.type = peermsg.MSGTYPE.PUBPK;

            if (transport == defs.TRANSPORT_WS) {
                payload[peermsg.MSGFIELD.ACCOUNT] = appsrvc.username;
                payload[peermsg.MSGFIELD.PUBKEY] = public_key;
                payload[peermsg.MSGFIELD.PROTOCOL] = transport;
                payload[peermsg.MSGFIELD.HOST] = address;
                payload[peermsg.MSGFIELD.PORT] = port;
                payload[peermsg.MSGFIELD.UTYPE] = ctype;
            }
            else {
                if (!symcryptkey) {
                    return callback("invalid connection key at publish user");
                }

                // for TCP direct connection encrypt the connection details
                var plain = {};
                plain[peermsg.MSGFIELD.ACCOUNT] = appsrvc.username;
                plain[peermsg.MSGFIELD.PUBKEY] = public_key;
                plain[peermsg.MSGFIELD.PROTOCOL] = transport;
                plain[peermsg.MSGFIELD.HOST] = address;
                plain[peermsg.MSGFIELD.PORT] = port;
                plain[peermsg.MSGFIELD.UTYPE] = ctype;

                var cipher = peermsg.aes256encrypt(symcryptkey, JSON.stringify(plain));
                payload[peermsg.MSGFIELD.CIPHER] = cipher;
            }

            logger.debug("publish_user with key: %s", key);

            var value = peermsg.create_jwt_token(appsrvc.cryptokey, create_id(), payload, null, null, public_key, null, null);

            //  For this public key upload message the key is the device name
            netsend(key, value, (err) => {
                if (err) {
                    return callback(err.message ? err.message : err);
                }

                logger.debug("peer key " + key + " published");
                callback();
            });
        }
        catch (e) {
            callback("Publish peer user error: " + e.message);
        }
    }

    peercomm.send_contact_offer = function (account, user_pkhash, user_public_key, contact_bs58public_key, connsymmkey, transport, address, port, type, callback) {
        try {
            if (!callback || typeof callback != "function") {
                return callback("offer contact error: invalid callback parameter")
            }

            if (!account || !user_pkhash || !user_public_key || !address || !contact_bs58public_key || !connsymmkey || (transport == "tcp" && !port)) {
                return callback("offer contact error: invalid parameters");
            }

            // decode the contact's rmd160 key
            var buffer = bs58check.decode(contact_bs58public_key);
            var contact_public_key = buffer.toString("hex");

            var hexbuffer = new Buffer(contact_public_key, 'hex');
            var rmd160buffer = createHash('rmd160').update(hexbuffer).digest();
            var contact_pkhash = bs58check.encode(rmd160buffer);

            //  publish the public keys so this client can communicate with the devices
            //  via direct peer to peer messaging as well
            // create the WoT message

            var plain = {};
            plain[peermsg.MSGFIELD.ACCOUNT] = account;
            plain[peermsg.MSGFIELD.PUBKEY] = user_public_key;
            plain[peermsg.MSGFIELD.PROTOCOL] = transport;
            plain[peermsg.MSGFIELD.HOST] = address;
            plain[peermsg.MSGFIELD.PORT] = port;
            plain[peermsg.MSGFIELD.UTYPE] = type || defs.USER_TYPE_HUMAN;
            plain[peermsg.MSGFIELD.SYMKEY] = connsymmkey;

            var plaindata = JSON.stringify(plain);
            var cipher = peermsg.ecdh_encypt(appsrvc.cryptokey, contact_public_key, plaindata);

            var payload = {};
            payload.type = peermsg.MSGTYPE.CAMSG;
            payload[peermsg.MSGFIELD.CIPHER] = cipher;

            var value = peermsg.create_jwt_token(appsrvc.cryptokey, create_id(), payload, null, null, user_public_key, null, contact_bs58public_key);
            var key = user_pkhash + "/" + contact_pkhash;
            // put the message to the network
            netsend(key, value, (err) => {
                if (err) {
                    return callback(err.message ? err.message : err);
                }

                logger.debug("contact offer " + key + " was published");
                callback();
            });
        }
        catch (e) {
            callback("Publish peer user error: " + e.message);
        }
    }

    peercomm.session = function (account) {
        var session = list_of_sessionkeys[account];
        if (session && session.accepted && session.symmetric_key) {
            //  the session is already exists
            return session;
        }
        else {
            return null;
        }
    }

    peercomm.get_contact_session = function (contact, showprog) {

        return new Promise(function (resolve, reject) {
            try {
                var account = contact.name;

                // create the session
                exchange_session_key(contact)
                    .then(
                        (jti) => {
                            return wait_peer_reply(jti, 5000, showprog || false);
                        },
                        (err) => {
                            reject(err);
                        }
                    )
                    .then(
                        (data) => {
                            //  must be the data in the session list
                            var session = list_of_sessionkeys[account];
                            resolve(session);
                        },
                        (err) => {
                            reject(err);
                        }
                    )
            }
            catch (err) {
                reject(err);
            }
        });
    }

    peercomm.getsessionkey = function (account) {
        return list_of_sessionkeys[account];
    }

    module.exports = peercomm;

}());
