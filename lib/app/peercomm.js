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

var util = require('util');
var peermsg = require("peermsg"); 
var Map = require("collections/map");
var secrand = require('secure-random');
var createHash = require('create-hash');
var appsrvc = require('./appsrvc');
var net = require('./streembitnet');
var logger = require('./logger');
var defs = require('./definitions');
var appevents = require("appevents"); 
var contactlist = require("contactlist");
var apputils = require("apputils");

(function () {
    
    var msgmap = new Map();
    var list_of_sessionkeys = {};
    var list_of_waithandlers = {};

    var percomm = {};
    
    percomm.get_published_contact = function (account, callback) {
        net.client.get(account, function (err, msg) {
            try {
                if (err) {
                    return callback(err);
                }
                
                // parse the message
                var payload = peermsg.getpayload(msg);
                if (!payload || !payload.data || !payload.data.type || payload.data.type != peermsg.MSGTYPE.PUBPK 
                            || payload.data[peermsg.MSGFIELD.PUBKEY] == null ) {
                    return callback("get_published_contact error: invalid contact payload");
                }
                
                var decoded = peermsg.decode(msg, payload.data[peermsg.MSGFIELD.PUBKEY]);
                if (!decoded || !decoded.data[peermsg.MSGFIELD.PUBKEY]) {
                    return callback("get_published_contact error: invalid decoded contact payload");
                }
                
                var pkey = decoded.data[peermsg.MSGFIELD.PUBKEY];
                if (!pkey) {
                    return callback("get_published_contact error: no public key was published by contact " + account);
                }
                
                var cipher = decoded.data[peermsg.MSGFIELD.CIPHER];
                var contactskeys = decoded.data["contactskeys"];
                if (cipher && contactskeys && Array.isArray(contactskeys)) {
                    
                    var symmkey = null;
                    for (var i = 0; i < contactskeys.length; i++) {
                        if (contactskeys[i].account == appsrvc.username) {
                            symmkey = contactskeys[i].symmkey;
                            break;
                        }
                    }
                    
                    if (!symmkey) {
                        return callback("get_published_contact error: no symmkey field is published from contact " + account);
                    }
                    
                    // decrypt the symmkey fild
                    var plaintext = peermsg.ecdh_decrypt(appsrvc.publickey, pkey, symmkey);
                    var keydata = JSON.parse(plaintext);
                    var session_symmkey = keydata.symmetric_key;
                    if (!session_symmkey) {
                        return callback("get_published_contact error: invalid session symmetric key for contact " + sender);
                    }
                    
                    // decrypt the cipher with the session_symmkey
                    var plaintext = streembit.Message.aes256decrypt(session_symmkey, cipher);
                    var connection = JSON.parse(plaintext);
                    if (!connection) {
                        return callback("get_published_contact error: no connection details field is published from contact " + account);
                    }
                    
                    if (connection.account != account) {
                        return callback("get_published_contact error: account mismatch was published from contact " + account);
                    }
                    
                    var address = connection[peermsg.MSGFIELD.HOST];
                    if (!address) {
                        return callback("get_published_contact error: no address field is published from contact " + account);
                    }
                    
                    var port = connection[peermsg.MSGFIELD.PORT];
                    if (!port) {
                        return callback("get_published_contact error: no port field is published from contact " + account);
                    }
                    
                    var protocol = connection[peermsg.MSGFIELD.PROTOCOL];
                    if (!protocol) {
                        return callback("get_published_contact error: no protocol field is published from contact " + account);
                    }
                    
                    var utype = connection[peermsg.MSGFIELD.UTYPE];

                    var contact = {
                        public_key: pkey, 
                        address: address, 
                        port: port, 
                        name: account, 
                        user_type: utype, 
                        protocol: protocol
                    };

                    callback(null, contact);
                }
                else {
                    var address = decoded.data[peermsg.MSGFIELD.HOST];
                    var port = decoded.data[peermsg.MSGFIELD.PORT];
                    var utype = decoded.data[peermsg.MSGFIELD.UTYPE];
                    var protocol = peermsg.MSGFIELD.PROTOCOL ? decoded.data[peermsg.MSGFIELD.PROTOCOL] : defs.TRANSPORT_TCP;
                    var contact = {
                        public_key: pkey,  
                        address: address, 
                        port: port, 
                        name: account, 
                        user_type: utype, 
                        protocol: protocol
                    };

                    callback(null, contact);
                }                
            }
            catch (e) {
                callback("get_published_contact error: " + e.message);
            }
        });
    }
    
    percomm.onPeerError = function (payload) {
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
        var id = secrand.randomBuffer(16).toString("hex");
        return id;
    }

    function create_hash_id(data) {
        if (typeof data != "string") {
            data = JSON.stringify(data);
        }
        var hashid = createHash('sha1').update(data).digest().toString('hex');
        return hashid;
    }
    
    function closeWaithandler(jti, result) {
        //console.log("closeWaithandler jti: " + jti);
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
                    //console.log("closeWaithandler call resolvefunc jti: " + jti + " result: " + result);
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
            //console.log("closeWaithandler jti: " + jti + " NO HANDLER");
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
            net.client.peer_send(contact, encoded_msgbuffer);
            
            logger.debug("received symm key %s from contact %s", session_symmkey, sender);
            
            list_of_sessionkeys[sender] = {
                symmetric_key: session_symmkey,
                contact_public_key: message.public_key,
                timestamp: Date.now(),
                accepted: true
            };
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
            contactlist.update_contact_database(contact, function () {
                try {
                    var jti = create_id();
                    var encoded_msgbuffer = peermsg.create_typedmsg(peermsg.PEERMSG.PREP, jti, appsrvc.cryptokey, data, appsrvc.username, sender);
                    net.client.peer_send(contact, encoded_msgbuffer);

                    // update the contact online indicator
                    appevents.dispatch("contact-online", sender, true);
                    // update address, port, etc.
                    appevents.dispatch("update-contact", contact.name, contact);
                }
                catch (e) {
                    streembit.notify.error("Handle ping, after database update error %j", e, true);
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
            appevents.dispatch("contact-online", sender, true);
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
            
            appevents.emit(appevents.TYPES.ONAPPNAVIGATE, defs.CMD_HANGUP_CALL, sender);

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
            
            streembit.UI.accept_sharescreen(sender, function (result) {
                var data = {};
                data[peermsg.MSGFIELD.REQJTI] = payload.jti;
                data[peermsg.MSGFIELD.RESULT] = result ? true : false;
                
                var contact = contactlist.get_contact(sender);
                var jti = create_id();
                var encoded_msgbuffer = peermsg.create_typedmsg(peermsg.PEERMSG.RSSC, jti, appsrvc.cryptokey, data, appsrvc.username, sender);
                net.client.peer_send(contact, encoded_msgbuffer);
                
                // if the call was accepted on the UI then navigate to the share screen view and wait for the WebRTC session
                if (result) {
                    var uioptions = {
                        contact: contact,
                        iscaller: false // this is the recepient of the call -> iscaller = false 
                    };
                    appevents.emit(appevents.TYPES.ONAPPNAVIGATE, defs.CMD_RECIPIENT_SHARESCREEN, null, uioptions);
                }
            });
        }
        catch (e) {
            streembit.notify.error("handleShareScreenOffer error %j", e, true);
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
            
            //console.log("handleShareScreenReply jti:" + jti);

            // find the wait handler, remove it and return the promise
            closeWaithandler(jti, result);

        }
        catch (e) {
            streembit.notify.error("handleCallReply error %j", e);
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
            
            apputils.accept_call(sender, calltype, function (result) {
                var data = {};
                data[peermsg.MSGFIELD.REQJTI] = payload.jti;
                data[peermsg.MSGFIELD.CALLT] = calltype;
                data[peermsg.MSGFIELD.RESULT] = result ? true : false;
                
                var contact = contactlist.get_contact(sender);
                var jti = create_id();
                var encoded_msgbuffer = peermsg.create_typedmsg(peermsg.PEERMSG.CREP, jti, appsrvc.cryptokey, data, appsrvc.username, sender);
                net.client.peer_send(contact, encoded_msgbuffer);
                
                // as the call was accepted on the UI then navigate to the video call view and wait for the WebRTC session
                if (result) {
                    var uioptions = {
                        contact: contact,
                        calltype: calltype,
                        iscaller: false // this is the recepient of the call -> iscaller = false 
                    };

                    var view = calltype == "videocall" ? "video-call" : "audio-call";
                    appevents.dispatch("display-view", view, uioptions);
                }
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
    
    function handleFileInit(sender, payload, data) {
        try {
            logger.debug("File init request received");
            
            var session = list_of_sessionkeys[sender];
            if (!session) {
                throw new Error("handleFileInit error, session does not exist for " + sender);
            }
            
            var obj = JSON.parse(data);
            if (!obj || !obj.file_name || !obj.file_size)
                throw new Error("handleFileInit error, invalid file data from " + sender);
            
            streembit.UI.accept_file(sender, obj.file_name, obj.file_size, function (result) {
                var data = {};
                data[peermsg.MSGFIELD.REQJTI] = payload.jti;
                data[peermsg.MSGFIELD.RESULT] = result ? true : false;
                
                var contact = contactlist.get_contact(sender);
                var jti = create_id();
                var encoded_msgbuffer = peermsg.create_typedmsg(peermsg.PEERMSG.CREP, jti, appsrvc.cryptokey, data, appsrvc.username, sender);
                net.client.peer_send(contact, encoded_msgbuffer);
                
                if (result) {
                    appevents.emit(appevents.TYPES.ONAPPNAVIGATE, defs.CMD_FILE_INIT, sender, obj);
                }
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
                        data.time = apputils.timeNow();
                        appsrvc.add_textmsg(data.sender, data);
                        appevents.dispatch("on-text-message", data); 
                    }
                    catch (e) {
                        streembit.notify.error("Error in handling chat message %j", e);
                    }
                    break;

                case defs.PEERMSG_CALL_WEBRTC:
                    //logger.debug("WEBRTC peer message received");
                    appevents.dispatch("on-call-webrtc-signal", data);
                    break;

                case defs.PEERMSG_CALL_WEBRTCSS:
                    //logger.debug("WEBRTC peer message received");
                    appevents.emit(appevents.APPEVENT, appevents.TYPES.ONCALLWEBRTC_SSCSIG, data);
                    break;

                case defs.PEERMSG_CALL_WEBRTCAA:
                    //logger.debug("WEBRTC peer message received");
                    appevents.emit(appevents.APPEVENT, appevents.TYPES.ONCALLWEBRTC_SSAUDIOSIG, data);
                    break;

                case defs.PEERMSG_FILE_WEBRTC:
                    //logger.debug("WEBRTC peer message received");
                    appevents.emit(appevents.APPEVENT, appevents.TYPES.ONFILEWEBRTCSIGNAL, data);
                    break;

                case defs.PEERMSG_FSEND:
                    //logger.debug("PEERMSG_FSEND message received");
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

    percomm.find_contact = function (account, public_key) {
        return new Promise(function (resolve, reject) {
            try {
                net.client.find_contact(account, public_key, function (err, contact) {
                    if (err) {
                        reject(err);
                    }
                    else {
                        resolve(contact);
                    }
                });
            }
            catch (err) {
                reject(err);
            }
        });
    }
    
    percomm.onPeerMessage = function (data, info) {
        try {
            if (!appsrvc.account_connected) {
                throw new Error("the application user is not yet initialized");
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
            var public_key = contactlist.get_public_key(sender);
            if (!public_key) {
                if (payload.sub != peermsg.PEERMSG.ACRQ 
                    && payload.sub != peermsg.PEERMSG.EXCH 
                    && payload.sub != peermsg.PEERMSG.AACR 
                    && payload.sub != peermsg.PEERMSG.DACR
                    && payload.sub != peermsg.PEERMSG.PING) {
                    throw new Error("peer message sender '" + sender + "' is not a contact");
                }
                
                if (payload.sub == peermsg.PEERMSG.ACRQ) {
                    //  if the message is an add contact request then continue as the contact does not exists yet
                    //  get the public key from the payload
                    try {
                        var msgdata = JSON.parse(payload.data);
                        public_key = msgdata.public_key;
                        if (!public_key) {
                            throw new Error("no public key exists in request");
                        }
                    }
                    catch (err) {
                        throw new Error("Add contact request error: " + err.message + ". Contact: " + sender);
                    }
                }
                else if (payload.sub == peermsg.PEERMSG.EXCH || 
                            payload.sub == peermsg.PEERMSG.AACR || 
                            payload.sub == peermsg.PEERMSG.DACR ||
                            payload.sub == peermsg.PEERMSG.PING ) {
                    //  It is possible that the add contact request of this account was received, but the accept reply
                    //  was never received by the account. However, the exchange message indicates that the contact 
                    //  accepted the add contact request.
                    //  If there is a pending contact request then try processing the message
                    
                    // Try to get the public key from the pending contacts list
                    var pending_contact = apputils.get_pending_contact(sender);
                    if (pending_contact) {
                        if (!pending_contact.public_key) {
                            throw new Error("pending contact exists, but there is no public key in the data");
                        }
                        public_key = pending_contact.public_key;
                        if (!public_key) {
                            throw new Error("pending contact exists, but no public key exists for it");
                        }
                    }
                }
            }

            if (!public_key) {
                public_key = contactlist.get_public_key(sender);
            }

            if (!public_key) {
                throw new Error("no public key for contact " + sender);
            }
            var message = peermsg.decode(data, public_key);
            if (!message || !message.data) {
                throw new Error("invalid JWT message");
            }
            
            if (message.sub == peermsg.PEERMSG.EXCH || message.sub == peermsg.PEERMSG.PING ) {
                var pending_contact = apputils.get_pending_contact(sender);
                if (pending_contact) {
                    // remove from the pending contacts and add to the contacts list
                    appevents.dispatch("on-netreceive-addcontact-accepted", sender);
                }
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
                console.log("wait_peer_reply jti: " + jti);

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
                    streembit.notify.info("Waiting reply from peer ... ", null, true);
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
                    address: appsrvc.address, 
                    port: appsrvc.port
                };
                data[peermsg.MSGFIELD.DATA] = cipher;
                
                var jti = create_id();
                var encoded_msgbuffer = peermsg.create_typedmsg(peermsg.PEERMSG.EXCH, jti, appsrvc.cryptokey, data, appsrvc.username, account);
                net.client.peer_send(contact, encoded_msgbuffer);
                
                //  insert the session key into the list
                list_of_sessionkeys[account] = {
                    symmetric_key: session_symmkey,
                    contact_public_key: contact.public_key,
                    timestamp: Date.now(),
                    accepted: false
                };
                
                resolve(jti);
            }
            catch (err) {
                reject(err);
            }
        });
    }
    
    percomm.send_offline_message = function (contact, message, msgtype, callback) {
        try {            
            if (!contact) {
                throw new Error("invalid contact parameter");
            }
            if (!message) {
                throw new Error("invalid message parameter");
            }
            
            var account = contact.name;
            var rcpt_ecdh_public_key = contact.public_key;
            
            var plaindata = { message: message };
            var cipher = peermsg.ecdh_encypt(appsrvc.cryptokey, rcpt_ecdh_public_key, plaindata);
            
            var timestamp = Date.now();
            var payload = {};
            payload.type = peermsg.MSGTYPE.OMSG;
            payload[peermsg.MSGFIELD.PUBKEY] = appsrvc.publickeyhex;
            payload[peermsg.MSGFIELD.REKEY] = rcpt_ecdh_public_key;
            payload[peermsg.MSGFIELD.TIMES] = timestamp;
            payload[peermsg.MSGFIELD.CIPHER] = cipher;
            payload[peermsg.MSGFIELD.MSGTYPE] = msgtype;
            
            var jti = create_id();
            var value = peermsg.create(appsrvc.cryptokey, jti, payload, null, null, appsrvc.username, null, account);
            var key = account + "/message/" + jti;
            // put the message to the network
            net.client.put(key, value, function (err) {
                callback(err);
            });
        }
        catch (e) {
            callback( e);
        }
    }
    
    percomm.addcontact_message = function (contact, callback) {
        try {
            if (!contact) {
                throw new Error("invalid contact parameter");
            }

            var account = contact.name;

            var timestamp = Date.now();
            var payload = {};
            payload.type = peermsg.MSGTYPE.OMSG;
            payload[peermsg.MSGFIELD.PUBKEY] = appsrvc.publickeyhex;
            payload[peermsg.MSGFIELD.TIMES] = contact.addrequest_create || Date.now();
            payload[peermsg.MSGFIELD.MSGTYPE] = defs.MSG_ADDCONTACT;
            
            var hashdata = account + "/message/" + defs.MSG_ADDCONTACT + "/" + appsrvc.username;
            var jti = create_hash_id(hashdata);
            var value = peermsg.create(appsrvc.cryptokey, jti, payload, null, null, appsrvc.username, null, account);
            var key = account + "/message/" + jti;
            // put the message to the network
            net.client.put(key, value, function (err) {
                if (err) {
                    return streembit.notify.error("Send off-line message error %j", err);
                }
                logger.debug("sent persistent addcontact request " + key);
                callback();
            });
        }
        catch (e) {
            streembit.notify.error("Add contact message error %j", e);
        }
    }
    
    percomm.declinecontact_message = function (contact, callback) {
        try {            
            if (!contact) {
                throw new Error("invalid contact parameter");
            }
            
            var account = contact.name;
            
            var timestamp = Date.now();
            var payload = {};
            payload.type = peermsg.MSGTYPE.OMSG;
            payload[peermsg.MSGFIELD.PUBKEY] = appsrvc.publickeyhex;
            payload[peermsg.MSGFIELD.TIMES] = contact.addrequest_create || Date.now();
            payload[peermsg.MSGFIELD.MSGTYPE] = defs.MSG_DECLINECONTACT;
            
            var hashdata = account + "/message/" + defs.MSG_DECLINECONTACT + "/" + appsrvc.username;
            var jti = create_hash_id(hashdata);
            var value = peermsg.create(appsrvc.cryptokey, jti, payload, null, null, appsrvc.username, null, account);
            var key = account + "/message/" + jti;
            // put the message to the network
            net.client.put(key, value, function (err) {
                if (err) {
                    return streembit.notify.error("declinecontact_message error %j", err);
                }
                logger.debug("sent persistent declinecontact_message request " + key);
                callback();
            });
        }
        catch (e) {
            streembit.notify.error("declinecontact_message error %j", e);
        }
    }
    
    percomm.send_peer_message = function (contact, message) {
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
            net.client.peer_send(contact, encoded_msgbuffer);
        }
        catch (e) {
            streembit.notify.error("Send peer message error: %j", e, true);
        }
    }
   
    percomm.ping = function (contact, showprogress, timeout) {
        
        return new Promise(function (resolve, reject) {
            try {
                
                var account = contact.name;
                var data = {}
                data[peermsg.MSGFIELD.TIMES] = Date.now();
                data[peermsg.MSGFIELD.ECDHPK] = appsrvc.publickeyhex;
                data[peermsg.MSGFIELD.PROTOCOL] = appsrvc.transport;
                data[peermsg.MSGFIELD.HOST] = appsrvc.address;
                data[peermsg.MSGFIELD.PORT] = appsrvc.port;
                
                var jti = create_id();
                var encoded_msgbuffer = peermsg.create_typedmsg(peermsg.PEERMSG.PING, jti, appsrvc.cryptokey, data, appsrvc.username, account);
                net.client.peer_send(contact, encoded_msgbuffer);
                
                var timeoutval = timeout || 10000;
                wait_peer_reply(jti, timeoutval, showprogress)
                .then(
                    function () {
                        resolve();
                    },
                    function (err) {
                        reject(err);
                    }                    
                );
            }
            catch (err) {
                reject(err);
            }
        });
    }
    
    percomm.send_addcontact_request = function (contact) {
        try {           
            //debugger;     
            var account = contact.name;
            var data = { sender: appsrvc.username };
            data[peermsg.MSGFIELD.PUBKEY] = appsrvc.publickeyhex;
            data[peermsg.MSGFIELD.PROTOCOL] = appsrvc.transport;
            data[peermsg.MSGFIELD.HOST] = appsrvc.address;
            data[peermsg.MSGFIELD.PORT] = appsrvc.port;
            data[peermsg.MSGFIELD.UTYPE] = defs.USER_TYPE_HUMAN;
                
            var jti = create_id();
            var encoded_msgbuffer = peermsg.create_typedmsg(peermsg.PEERMSG.ACRQ, jti, appsrvc.cryptokey, data, appsrvc.username, account);
            net.client.peer_send(contact, encoded_msgbuffer);
        }
        catch (err) {
            streembit.notify.error("Send add contact request error:  %j", err);
        }        
    }
    
    percomm.send_accept_addcontact_reply = function (contact) {
        try {
            var account = contact.name;
            var data = { sender: appsrvc.username };

            var jti = create_id();
            var encoded_msgbuffer = peermsg.create_typedmsg(peermsg.PEERMSG.AACR, jti, appsrvc.cryptokey, data, appsrvc.username, account);
            net.client.peer_send(contact, encoded_msgbuffer);
        }
        catch (err) {
            streembit.notify.error("Send addcontact request error:  %j", err);
        }
    }
    
    percomm.send_decline_addcontact_reply = function (contact) {
        try {
            var account = contact.name;
            var data = { sender: appsrvc.username };
            
            var jti = create_id();
            var encoded_msgbuffer = peermsg.create_typedmsg(peermsg.PEERMSG.DACR, jti, appsrvc.cryptokey, data, appsrvc.username, account);
            net.client.peer_send(contact, encoded_msgbuffer);
        }
        catch (err) {
            streembit.notify.error("Send decline contact reply error:  %j", err);
        }
    }
    
    percomm.hangup_call = function (contact) {
        
        return new Promise(function (resolve, reject) {
            try {                
                var account = contact.name;
                var data = {}
                data[peermsg.MSGFIELD.TIMES] = Date.now();
                
                var jti = create_id();
                var encoded_msgbuffer = peermsg.create_typedmsg(peermsg.PEERMSG.HCAL, jti, appsrvc.cryptokey, data, appsrvc.username, account);
                net.client.peer_send(contact, encoded_msgbuffer);
                
                // don't wait for reply
            }
            catch (err) {
                reject(err);
            }
        });
    }
    
    percomm.call = function (contact, type, showprogress) {
        
        return new Promise(function (resolve, reject) {
            try {
                
                var account = contact.name;
                var data = {}
                data[peermsg.MSGFIELD.CALLT] = type;
                
                var jti = create_id();
                var encoded_msgbuffer = peermsg.create_typedmsg(peermsg.PEERMSG.CALL, jti, appsrvc.cryptokey, data, appsrvc.username, account);
                net.client.peer_send(contact, encoded_msgbuffer);
                
                wait_peer_reply(jti, 10000, showprogress)
                .then(
                    function (isaccepted) {
                        resolve(isaccepted);
                    },
                    function (err) {
                        reject(err);
                    }                    
                );
            }
            catch (err) {
                reject(err);
            }
        });
    }
    
    percomm.offer_sharescreen = function (contact, resolve, reject) {
        try {                
            var account = contact.name;
            var data = {}
            data[peermsg.MSGFIELD.TIMES] = Date.now();
                
            var jti = create_id();
            var encoded_msgbuffer = peermsg.create_typedmsg(peermsg.PEERMSG.SSCA, jti, appsrvc.cryptokey, data, appsrvc.username, account);
            net.client.peer_send(contact, encoded_msgbuffer);
                
            //console.log("offer_sharescreen jti:" + jti);

            wait_peer_reply(jti, 15000, true).then(resolve, reject);
                          
        }
        catch (err) {
            reject(err);
        }       
    }
    
    percomm.initfile = function (contact, file, showprogress, timeout) {
        
        return new Promise(function (resolve, reject) {
            try {
                
                var account = contact.name;
                var data = {}
                data[peermsg.MSGFIELD.CALLT] = defs.CALLTYPE_FILET;
                data.file_name = file.name;
                data.file_size = file.size;
                data.file_hash = file.hash;
                data.file_type = file.type;

                var jti = create_id();
                var encoded_msgbuffer = peermsg.create_typedmsg(peermsg.PEERMSG.FILE, jti, appsrvc.cryptokey, data, appsrvc.username, account);
                net.client.peer_send(contact, encoded_msgbuffer);
                
                wait_peer_reply(jti, timeout || 30000, showprogress)
                .then(
                    function (isaccepted) {
                        resolve(isaccepted);
                    },
                    function (err) {
                        reject(err);
                    }                    
                );
            }
            catch (err) {
                reject(err);
            }
        });
    }
    
    percomm.is_peer_session = function (account) {
        var val = list_of_sessionkeys[account];
        return val ? true : false;
    }
    
    percomm.get_account_messages = function (msgkey, page, start, callback) {
        try {
            logger.debug("get_account_messages");
            
            var querystring = 'key=' + msgkey + '&page=' + (page > 0 ? page : 10) + '&start=' + (start > 0 ? start : 0);
            
            net.client.get_range(querystring, function (err, result) {
                if (callback) {
                    callback(err, result);
                }
            });
        }
        catch (e) {
            streembit.notify.error("Get account messages error:  %j", e, true);
        }
    }
    
    percomm.delete_item = function (key, request) {
        try {
            net.client.delete_item(key, request);
        }
        catch (e) {
            streembit.notify.error("delete_item error:  %j", e);
        }
    }
    
    percomm.delete_message = function (msgid, callback) {
        try {            
            if (!msgid) {
                return callback("delete_message error: invalid msgid")    
            }

            var payload = {};
            payload.type = peermsg.MSGTYPE.DELMSG;
            payload[peermsg.MSGFIELD.MSGID] = msgid

            var jti = create_id();
            var value = peermsg.create(appsrvc.cryptokey, jti, payload, null, null, appsrvc.username);

            var key = appsrvc.username + "/message/" + msgid;
            // put the message to the network
            net.client.put(key, value, function (err) {
                callback(err);
            });
        }
        catch (e) {
            streembit.notify.error("delete_message error:  %j", e);
        }
    }
    
    percomm.delete_public_key = function (callback) {
        try {
            //  publishing user data
            if (!appsrvc.publickeyhex || !appsrvc.address || !appsrvc.port) {
                return callback("invalid user context data");
            }
            
            //  publish the public keys so this client can communicate with the devices
            //  via direct peer to peer messaging as well
            // create the WoT message 
            var payload = {};
            payload.type = peermsg.MSGTYPE.DELPK;
            payload[peermsg.MSGFIELD.PUBKEY] = appsrvc.publickeyhex;
            
            logger.debug("publish delete key: %j", payload);
            
            var value = peermsg.create(appsrvc.cryptokey, create_id(), payload);
            var key = appsrvc.username;
            
            //  For this public key upload message the key is the device name
            net.client.put(key, value, function (err) {
                if (err) {
                    return callback(err);
                }
                
                logger.debug("peer update public key published");
                //  the public key has been uplodad, other peers can verify the messages -> ready to process device messages
                callback();
            });
        }
        catch (e) {
            callback(e);
        }
    }
    
    percomm.update_public_key = function (new_public_key, callback) {
        try {
            //  publishing user data
            if (!appsrvc.publickeyhex || !appsrvc.address || !appsrvc.port) {
                return callback("invalid user context data");
            }
            
            if (!new_public_key) {
                return callback("invalid new public key");
            }
            
            //  publish the public keys so this client can communicate with the devices
            //  via direct peer to peer messaging as well
            // create the WoT message 
            var payload = {};
            payload.type = peermsg.MSGTYPE.UPDPK;
            payload[peermsg.MSGFIELD.PUBKEY] = new_public_key;
            payload[peermsg.MSGFIELD.LASTPKEY] = appsrvc.publickeyhex;
            payload[peermsg.MSGFIELD.PROTOCOL] = appsrvc.transport;
            payload[peermsg.MSGFIELD.HOST] = appsrvc.address;
            payload[peermsg.MSGFIELD.PORT] = appsrvc.port;
            payload[peermsg.MSGFIELD.UTYPE] = defs.USER_TYPE_HUMAN;
            
            logger.debug("publish update key: %j", payload);
            
            var value = peermsg.create(appsrvc.cryptokey, create_id(), payload);
            var key = appsrvc.username;
            
            //  For this public key upload message the key is the device name
            net.client.put(key, value, function (err) {
                if (err) {
                    return callback(err);
                }
                
                logger.debug("peer update public key published");
                //  the public key has been uplodad, other peers can verify the messages -> ready to process device messages
                callback();
            });
        }
        catch (e) {
            callback(e);
        }
    }
    
    percomm.publish_user = function (public_key, transport, address, port, type, callback) {
        try {
            if (!callback || typeof callback != "function") {
                return streembit.notify.error("publish_user error: invalid callback parameter")
            }

            //  publishing user data
            if (!public_key || !address || (transport == "tcp" && !port)) {
                return callback("invalid parameters at publish user");
            }
            
            //  publish the public keys so this client can communicate with the devices
            //  via direct peer to peer messaging as well
            // create the WoT message 
            var payload = {};
            payload.type = peermsg.MSGTYPE.PUBPK;
            payload[peermsg.MSGFIELD.PUBKEY] = public_key;
            payload[peermsg.MSGFIELD.PROTOCOL] = transport;
            payload[peermsg.MSGFIELD.HOST] = address;
            payload[peermsg.MSGFIELD.PORT] = port;
            payload[peermsg.MSGFIELD.UTYPE] = type || defs.USER_TYPE_HUMAN;
            
            logger.debug("publish_user: %j", payload);
            
            var value = peermsg.create(appsrvc.cryptokey, create_id(), payload);
            var key = appsrvc.username;
            
            //  For this public key upload message the key is the device name
            net.client.put(key, value, function (err) {
                if (err) {
                    return callback("Publish user error: " + (err.message ? err.message : err));
                }                

                logger.debug("peer published");
                
                callback();  

                //  the public key has been uplodad, other peers can verify the messages -> ready to process device messages
                appevents.send(appevents.TYPES.ONUSERPUBLISH);
            });
        }
        catch (e) {
            callback("Publish peer user error: " + e.message);
        }
    }
    
    percomm.session = function (account) {
        var session = list_of_sessionkeys[account];
        if (session && session.accepted && session.symmetric_key) {
            //  the session is already exists
            return session;
        }
        else {
            return null;
        }
    }
    
    percomm.get_contact_session = function (contact, showprog) {
        
        return new Promise(function (resolve, reject) {
            try {
                var account = contact.name;
                
                // create the session
                exchange_session_key(contact)
                .then(
                    function (jti) {
                        return wait_peer_reply(jti, 5000, showprog || false);
                    },
                    function (err) {
                        reject(err);
                    }
                )
                .then(
                    function (data) {
                        //  must be the data in the session list
                        var session = list_of_sessionkeys[account];
                        resolve(session);
                    },
                    function (err) {
                        reject(err);
                    }
                )
            }
            catch (err) {
                reject(err);
            }
        });
    }

    percomm.validate_connection = function () {
        return new Promise(function (resolve, reject) {
            net.client.validate_connection(function (err) {
                if (err) {
                    reject(err);
                }
                else {
                    resolve();
                }
            });
        });
    }    
    
    module.exports = percomm;

}());
