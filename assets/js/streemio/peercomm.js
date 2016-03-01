'use strict';

var streemio = streemio || {};

var util = require('util');
var assert = require('assert');
var wotmsg = require("./libs/message/wotmsg");
var uuid = require("uuid");
var Map = require("collections/map");
var secrand = require('secure-random');


streemio.TransportFactory = (function (module, logger, events, config) {
    
    Object.defineProperty(module, "transport", {
        get: function () {
            if (!config) {
                throw new Error("transport get error: config is empty");
            }
            if (!config.transport) {
                throw new Error("transport configuration is missing");
            }
            
            var transport;
            switch (config.transport) {
                case "tcp":
                    transport = streemio.PeerTransport;
                    break;
                case "ws":
                    transport = streemio.WebSocketTransport;
                    break;
                default:
                    throw new Error("Not implemented transport type " + config.transport);
            }
            
            return transport;
        },
    });
    
    module.get_contact_transport = function (contact) {
        if (!config) {
            throw new Error("transport get error: config is empty");
        }
        
        if (!config.transport) {
            throw new Error("transport configuration is missing");
        }

        if (!contact || !contact.protocol) {
            throw new Error("get_contact_transport error: contact.transport value is empty");
        }
        
        if (config.transport == "ws") {
            //  whatever transport the contact uses this account can communicate only via WS
            transport = streemio.PeerTransport;
        }
        else {
            var transport;
            switch (contact.protocol) {
                case "tcp":
                    transport = streemio.PeerTransport;
                    break;
                case "ws":
                    transport = streemio.WebSocketTransport;
                    break;
                default:
                    throw new Error("Not implemented transport type " + config.transport);
            }
        }

        return transport;
    }
    
    return module;

}(streemio.TransportFactory || {}, global.applogger, global.appevents, global.appconfig));



streemio.Node = (function (module, logger, events, config) {
    
    module.init = function (seeds, callback) {
        var transport = streemio.TransportFactory.transport;
        transport.init(seeds, callback);
    }
    
    module.put = function (key, value, callback) {
        var transport = streemio.TransportFactory.transport;
        transport.put(key, value, callback);
    }
    
    module.get = function (key, callback) {
        var transport = streemio.TransportFactory.transport;
        transport.get(key, callback);
    }
    
    module.find = function (key, callback) {
        var transport = streemio.TransportFactory.transport;
        transport.find(key, callback);
    }
    
    module.find_account = function (account) {
        return new Promise(function (resolve, reject) {
            try {
                var transport = streemio.TransportFactory.transport;
                transport.get_node(account, function (err, contacts) {
                    if (err) {
                        reject(err);
                    }
                    else {
                        resolve(contacts);
                    }
                });
            }
            catch (err) {
                reject(err);
            }
        });
    }
    
    module.peer_send = function (contact, data) {
        // select a transport based on the contact's protocol
        var transport = streemio.TransportFactory.get_contact_transport(contact);
        transport.peer_send(contact, data);
    }
    
    module.get_messages = function (account, callback) {
        var transport = streemio.TransportFactory.transport;
        transport.get_messages(account, callback);
    }
    
    module.delete_item = function (key, request) {
        var transport = streemio.TransportFactory.transport;
        transport.delete_item(key, request);
    }
    
    module.delete_messages = function (request, callback) {
        var transport = streemio.TransportFactory.transport;
        transport.delete_messages(request, callback);
    }
    
    module.validate_connection = function (callback) {
        var transport = streemio.TransportFactory.transport;
        transport.validate_connection(callback);
    }
    
    module.is_node_connected = function () {
        var transport = streemio.TransportFactory.transport;
        return transport.is_node_connected();
    }

    return module;

}(streemio.Node || {}, global.applogger, global.appevents, global.appconfig));



streemio.Message = (function (module, logger, events) {
    
    module.getvalue = function (val) {
        return wotmsg.base64decode(val);
    }
    
    module.decode = function (payload, public_key) {
        return wotmsg.decode(payload, public_key);
    }
    
    module.aes256decrypt = function (symmetric_key, cipher_text) {
        return wotmsg.aes256decrypt(symmetric_key, cipher_text);
    }
    
    module.aes256encrypt = function (symmetric_key, data) {
        return wotmsg.aes256encrypt(symmetric_key, data);
    }
    
    module.decrypt_ecdh = function (rcpt_private_key, rcpt_public_key, sender_public_key, jwe_input) {
        return wotmsg.decrypt_ecdh(rcpt_private_key, rcpt_public_key, sender_public_key, jwe_input);
    }
    
    module.getpayload = function (msg) {
        return wotmsg.getpayload(msg);
    }
    
    module.create_peermsg = function (data, notbuffer) {
        var message = {
            type: "PEERMSG",
            data: data
        };
        var strobj = JSON.stringify(message);
        if (notbuffer) {
            return strobj;
        }
        
        var buffer = new Buffer(strobj);
        return buffer;
    }
    
    module.create_id = function () {
        var temp = uuid.v4().toString();
        var id = temp.replace(/-/g, '');
        return id;
    }
    
    return module;

}(streemio.Message || {}, global.applogger, global.appevents));



streemio.PeerNet = (function (module, logger, events, config) {
    
    var msgmap = new Map();
    var list_of_sessionkeys = {};
    var list_of_waithandlers = {};
    
    module.find_contact = function (account, callback) {
        streemio.Node.find(account, function (err, msg) {
            try {
                if (err) {
                    return callback(err);
                }
                
                // parse the message
                var payload = wotmsg.getpayload(msg);
                if (!payload || !payload.data || !payload.data.type || payload.data.type != wotmsg.MSGTYPE.PUBPK 
                            || payload.data[wotmsg.MSGFIELD.PUBKEY] == null || payload.data[wotmsg.MSGFIELD.ECDHPK] == null) {
                    return callback("get_contact error: invalid contact payload");
                }
                
                var decoded = wotmsg.decode(msg, payload.data[wotmsg.MSGFIELD.PUBKEY]);
                if (!decoded || !decoded.data[wotmsg.MSGFIELD.PUBKEY]) {
                    return callback("get_contact error: invalid decoded contact payload");
                }
                
                var pkey = decoded.data[wotmsg.MSGFIELD.PUBKEY];
                var ecdhpk = decoded.data[wotmsg.MSGFIELD.ECDHPK];
                var address = decoded.data[wotmsg.MSGFIELD.HOST];
                var port = decoded.data[wotmsg.MSGFIELD.PORT];
                var utype = decoded.data[wotmsg.MSGFIELD.UTYPE];
                var protocol = wotmsg.MSGFIELD.PROTOCOL ? decoded.data[wotmsg.MSGFIELD.PROTOCOL] : "tcp";
                var contact = { public_key: pkey, ecdh_public: ecdhpk, address: address, port: port, name: account, user_type: utype, protocol: protocol };
                callback(null, contact);
            }
            catch (e) {
                callback("get_contact error: " + e.message);
            }
        });
    }
    
    module.onPeerError = function (payload) {
        try {
            var err = payload.error, contact = payload.contact, data = payload.data;
            // get the jti field from the data
            var ishandled = false;
            if (data) {
                var buffer = new Buffer(data).toString();
                var obj = JSON.parse(buffer);
                if (obj.data) {
                    var msg = wotmsg.getpayload(obj.data);
                    if (msg && msg.jti) {
                        var handler = list_of_waithandlers[msg.jti];
                        if (handler && handler.waitfunc && handler.rejectfunc && handler.resolvefunc) {
                            try {
                                streemio.notify.hideprogress();
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
                streemio.notify.error("onPeerError error %j", err);
            }
        }
        catch (e) {
            logger.error("onPeerError error %j", e);
        }
    }
    
    function closeWaithandler(jti, result) {
        var handler = list_of_waithandlers[jti];
        if (handler) {
            try {
                streemio.notify.hideprogress();
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
            var plaintext = wotmsg.decrypt(symmetric_key, msgtext);
            var data = JSON.parse(plaintext);
            //  must have the request_jti field
            var jti = data[wotmsg.MSGFIELD.REQJTI]
            
            logger.debug("key for list of session accepted by " + sender);
            list_of_sessionkeys[sender].accepted = true;
            
            // find the wait handler, remove it and return the promise
            closeWaithandler(jti);
        }
        catch (e) {
            streemio.notify.error("handleAcceptKey error %j", e);
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
            var ecdh_public = message.ecdh_public_key;
            var plaintext = wotmsg.ecdh_decrypt(streemio.User.ecdh_key, ecdh_public, data);
            var plain_data = JSON.parse(plaintext);
            if (!plain_data)
                throw new Error("invalid message data for key exchange contact " + sender);
            
            var session_symmkey = plain_data.symmetric_key;
            if (!session_symmkey) {
                throw new Error("invalid session symmetric key for contact " + sender);
            }
            
            // send key accepted message
            var data = {};
            data[wotmsg.MSGFIELD.REQJTI] = payload.jti;
            
            var contact = streemio.Contacts.get_contact(sender);
            var jti = streemio.Message.create_id();
            var encoded_msgbuffer = wotmsg.create_symm_msg(wotmsg.PEERMSG.ACCK, jti, streemio.User.private_key, session_symmkey, data, streemio.User.name, sender);
            streemio.Node.peer_send(contact, encoded_msgbuffer);
            
            logger.debug("received symm key %s from contact %s", session_symmkey, sender);
            
            list_of_sessionkeys[sender] = {
                symmetric_key: session_symmkey,
                contact_ecdh_public: ecdh_public,
                contact_public_key: message.public_key,
                timestamp: Date.now(),
                accepted: true
            };
        }
        catch (e) {
            streemio.notify.error("handleKeyExchange error %j", e);
        }
    }
    
    function handlePing(sender, payload, msgtext) {
        try {
            logger.debug("Ping request received");
            
            var message = JSON.parse(msgtext);
            var timestamp = message[wotmsg.MSGFIELD.TIMES];
            var ecdh_public = message[wotmsg.MSGFIELD.ECDHPK];
            logger.debug("Ping timestamp: " + timestamp + " ecdh_public: " + ecdh_public + " from " + sender);
            
            if (!list_of_sessionkeys[sender]) {
                list_of_sessionkeys[sender] = {};
            }
            list_of_sessionkeys[sender].contact_ecdh_public = ecdh_public;
            logger.debug("handlePing ecdh_public: " + ecdh_public + " for " + sender);
            
            // send Ping reply message
            var data = {};
            data[wotmsg.MSGFIELD.REQJTI] = payload.jti;
            data[wotmsg.MSGFIELD.ECDHPK] = streemio.User.ecdh_public_key;
            
            var contact = streemio.Contacts.get_contact(sender);
            if (!contact) {
                throw new Error("invalid contact object");    
            }

            var jti = streemio.Message.create_id();
            var encoded_msgbuffer = wotmsg.create_msg(wotmsg.PEERMSG.PREP, jti, streemio.User.private_key, data, streemio.User.name, sender);
            streemio.Node.peer_send(contact, encoded_msgbuffer);
            
            // update the contact online indicator
            streemio.Contacts.on_online(sender);
        }
        catch (e) {
            streemio.notify.error("handlePing error %j", e);
        }
    }
    
    function handlePingReply(sender, payload, msgtext) {
        try {
            logger.debug("Ping reply (PREP) message received");
            
            var data = JSON.parse(msgtext);
            //  must have the request_jti field
            var jti = data[wotmsg.MSGFIELD.REQJTI];
            var ecdh_public = data[wotmsg.MSGFIELD.ECDHPK];
            
            if (!list_of_sessionkeys[sender]) {
                list_of_sessionkeys[sender] = {};
            }
            list_of_sessionkeys[sender].contact_ecdh_public = ecdh_public;
            logger.debug("handlePingReply ecdh_public: " + ecdh_public + " for " + sender);
            
            // find the wait handler, remove it and return the promise
            closeWaithandler(jti);
            
            // update the contact online indicator
            streemio.Contacts.on_online(sender);
        }
        catch (e) {
            streemio.notify.error("handlePingReply error %j", e);
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
            
            events.emit(events.TYPES.ONAPPNAVIGATE, streemio.DEFS.CMD_HANGUP_CALL, sender);

        }
        catch (e) {
            streemio.notify.error("handleCallReply error %j", e);
        }
    }
    
    function handleCall(sender, payload, msgtext) {
        try {
            logger.debug("Call request received");
            
            var session = list_of_sessionkeys[sender];
            if (!session) {
                throw new Error("handleCall error, session does not exist for " + sender);
            }
            
            var message = JSON.parse(msgtext);
            var calltype = message[wotmsg.MSGFIELD.CALLT];
            if (!calltype) {
                throw new Error("invalid call type");
            }
            logger.debug("call type: " + calltype);
            
            streemio.UI.accept_call(sender, calltype, function (result) {
                var data = {};
                data[wotmsg.MSGFIELD.REQJTI] = payload.jti;
                data[wotmsg.MSGFIELD.CALLT] = calltype;
                data[wotmsg.MSGFIELD.RESULT] = result ? true : false;
                
                var contact = streemio.Contacts.get_contact(sender);
                var jti = streemio.Message.create_id();
                var encoded_msgbuffer = wotmsg.create_msg(wotmsg.PEERMSG.CREP, jti, streemio.User.private_key, data, streemio.User.name, sender);
                streemio.Node.peer_send(contact, encoded_msgbuffer);
                
                // if the call was accepted on the UI then navigate to the video call view and wait for the WebRTC session
                if (result) {
                    var uioptions = {
                        contact: contact,
                        calltype: calltype,
                        iscaller: false // this is the recepient of the call -> iscaller = false 
                    };
                    events.emit(events.TYPES.ONAPPNAVIGATE, streemio.DEFS.CMD_VIDEO_CALL, null, uioptions);
                }
            });
        }
        catch (e) {
            streemio.notify.error("handleCall error %j", e);
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
            var jti = data[wotmsg.MSGFIELD.REQJTI];
            var calltype = data[wotmsg.MSGFIELD.CALLT];
            var result = data[wotmsg.MSGFIELD.RESULT];
            
            // find the wait handler, remove it and return the promise
            closeWaithandler(jti, result);

        }
        catch (e) {
            streemio.notify.error("handleCallReply error %j", e);
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
            
            streemio.UI.accept_file(sender, obj.file_name, obj.file_size, function (result) {
                var data = {};
                data[wotmsg.MSGFIELD.REQJTI] = payload.jti;
                data[wotmsg.MSGFIELD.RESULT] = result ? true : false;
                
                var contact = streemio.Contacts.get_contact(sender);
                var jti = streemio.Message.create_id();
                var encoded_msgbuffer = wotmsg.create_msg(wotmsg.PEERMSG.CREP, jti, streemio.User.private_key, data, streemio.User.name, sender);
                streemio.Node.peer_send(contact, encoded_msgbuffer);
                
                if (result) {
                    events.emit(events.TYPES.ONAPPNAVIGATE, streemio.DEFS.CMD_FILE_INIT, sender, obj);
                }
            });

        }
        catch (e) {
            streemio.notify.error("handleFileInit error %j", e);
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
            var jti = data[wotmsg.MSGFIELD.REQJTI];
            var result = data[wotmsg.MSGFIELD.RESULT];
            
            // find the wait handler, remove it and return the promise
            closeWaithandler(jti, result);

        }
        catch (e) {
            streemio.notify.error("handleCallReply error %j", e);
        }
    }
    
    function handleAddContactRequest(sender, payload, msgtext) {
        try {
            logger.debug("Add contact request message received");
            
            var data = JSON.parse(msgtext);
            var contact = {
                name: sender,
                protocol: data[wotmsg.MSGFIELD.PROTOCOL],
                address: data[wotmsg.MSGFIELD.HOST],
                port: data[wotmsg.MSGFIELD.PORT],
                public_key: data[wotmsg.MSGFIELD.PUBKEY],
                user_type: data[wotmsg.MSGFIELD.UTYPE]
            };

            streemio.Contacts.on_receive_addcontact(contact);

            // close, don't reply here
        }
        catch (e) {
            streemio.notify.error("handleAddContactRequest error %j", e);
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
                   
            streemio.Contacts.handle_addcontact_accepted(account);

            // close, don't reply here
        }
        catch (e) {
            streemio.notify.error("handleAddContactRequest error %j", e);
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
            
            streemio.Contacts.handle_addcontact_denied(account);

            // close, don't reply here
        }
        catch (e) {
            streemio.notify.error("handleAddContactDenyReply error %j", e);
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
            var plaintext = wotmsg.decrypt(symmetric_key, msgtext);
            var data = JSON.parse(plaintext);
            
            //  process the data 
            if (!data || !data.cmd)
                return;
            
            switch (data.cmd) {
                case streemio.DEFS.PEERMSG_TXTMSG:
                    try {
                        if (streemio.Session.curent_viewmodel && streemio.Session.curent_viewmodel.onTextMessage) {
                            streemio.Session.curent_viewmodel.onTextMessage(data);
                        }
                        else {
                            // signal the contact list about the message
                            streemio.Session.contactsvm.onTextMessage(data);
                        }
                    }
                    catch (e) {
                        streemio.notify.error("Error in handling chat message %j", e);
                    }
                    break;

                case streemio.DEFS.PEERMSG_CALL_WEBRTC:
                    //logger.debug("WEBRTC peer message received");
                    events.emit(events.APPEVENT, events.TYPES.ONCALLWEBRTCSIGNAL, data);
                    break;

                case streemio.DEFS.PEERMSG_FILE_WEBRTC:
                    //logger.debug("WEBRTC peer message received");
                    events.emit(events.APPEVENT, events.TYPES.ONFILEWEBRTCSIGNAL, data);
                    break;

                case streemio.DEFS.PEERMSG_FSEND:
                    //logger.debug("PEERMSG_FSEND message received");
                    events.emit(events.APPEVENT, events.TYPES.ONFCHUNKSEND, data);
                    break;

                case streemio.DEFS.PEERMSG_FEXIT:
                    //logger.debug("PEERMSG_FSEND message received");
                    events.emit(events.APPEVENT, events.TYPES.ONFILECANCEL, data);
                    break;

                default:
                    break;
            }
        }
        catch (e) {
            streemio.notify.error("handleSymmMessage error %j", e);
        }
    }
    
    module.onPeerMessage = function (data, info) {
        try {
            if (!streemio.User.is_user_initialized) {
                throw new Error("the application user is not yet initialized");
            }
            
            var msgarray = wotmsg.get_msg_array(data);
            if (!msgarray || !msgarray.length || msgarray.length != 3)
                throw new Error("invalid message");
            
            var header = msgarray[0];
            var payload = msgarray[1];
            if (!payload || !payload.aud)
                throw new Error("invalid aud element");
            
            if (payload.aud != streemio.User.name) {
                throw new Error("aud is " + payload.aud + " invalid for user " + streemio.User.name);
            }
            
            var sender = payload.iss;
            if (!sender)
                throw new Error("invalid sender element");
            
            //  get the public key for the sender only contacts are 
            //  allowed communicate with eachother via peer to peer
            //debugger;
            var public_key = streemio.Contacts.get_public_key(sender);
            if (!public_key) {
                if (payload.sub != wotmsg.PEERMSG.ACRQ 
                    && payload.sub != wotmsg.PEERMSG.EXCH 
                    && payload.sub != wotmsg.PEERMSG.AACR 
                    && payload.sub != wotmsg.PEERMSG.DACR
                    && payload.sub != wotmsg.PEERMSG.PING) {
                    throw new Error("peer message sender '" + sender + "' is not a contact");
                }
                
                if (payload.sub == wotmsg.PEERMSG.ACRQ) {
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
                else if (payload.sub == wotmsg.PEERMSG.EXCH || 
                            payload.sub == wotmsg.PEERMSG.AACR || 
                            payload.sub == wotmsg.PEERMSG.DACR ||
                            payload.sub == wotmsg.PEERMSG.PING ) {
                    //  It is possible that the add contact request of this account was received, but the accept reply
                    //  was never received by the account. However, the exchange message indicates that the contact 
                    //  accepted the add contact request.
                    //  If there is a pending contact request then try processing the message
                    
                    // Try to get the public key from the pending contacts list
                    var pending_contact = streemio.Session.get_pending_contact(sender);
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
            
            var message = wotmsg.decode(data, public_key);
            if (!message || !message.data) {
                throw new Error("invalid JWT message");
            }
            
            if (message.sub == wotmsg.PEERMSG.EXCH || message.sub == wotmsg.PEERMSG.PING ) {
                var pending_contact = streemio.Session.get_pending_contact(sender);
                if (pending_contact) {
                    // remove from the pending contacts and add to the contacts list
                    streemio.Contacts.handle_addcontact_accepted(sender);
                }
            }            

            switch (message.sub) {
                case wotmsg.PEERMSG.EXCH:
                    handleKeyExchange(sender, public_key, payload, message.data);
                    break;
                case wotmsg.PEERMSG.ACCK:
                    handleAcceptKey(sender, payload, message.data);
                    break;
                case wotmsg.PEERMSG.PING:
                    handlePing(sender, payload, message.data);
                    break;
                case wotmsg.PEERMSG.PREP:
                    handlePingReply(sender, payload, message.data);
                    break;
                case wotmsg.PEERMSG.SYMD:
                    handleSymmMessage(sender, payload, message.data);
                    break;
                case wotmsg.PEERMSG.CALL:
                    handleCall(sender, payload, message.data);
                    break;
                case wotmsg.PEERMSG.CREP:
                    handleCallReply(sender, payload, message.data);
                    break;
                case wotmsg.PEERMSG.FILE:
                    handleFileInit(sender, payload, message.data);
                    break;
                case wotmsg.PEERMSG.FREP:
                    handleFileReply(sender, payload, message.data);
                    break;
                case wotmsg.PEERMSG.HCAL:
                    handleHangupCall(sender, payload, message.data);
                    break;
                case wotmsg.PEERMSG.ACRQ:
                    handleAddContactRequest(sender, payload, message.data);
                    break;
                case wotmsg.PEERMSG.AACR:
                    handleAddContactAcceptReply(sender, payload, message.data);
                    break;
                case wotmsg.PEERMSG.DACR:
                    handleAddContactDenyReply(sender, payload, message.data);
                    break;

                default:
                    break;
            }
        }
        catch (err) {
            streemio.notify.error("onPeerMessage error %j", err);
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
                                    streemio.notify.hideprogress();
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
                    streemio.notify.showprogress("Waiting reply from peer ... ");
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
                
                // Ping must be performed before the key exchange, there fore the ecdh_public must exists at this point
                if (!list_of_sessionkeys[account] || !list_of_sessionkeys[account].contact_ecdh_public) {
                    return reject("contact ecdh public key doesn't exists. Must PING first to get the ecdh public key.");
                }
                
                var ecdh_public = list_of_sessionkeys[account].contact_ecdh_public; //contact.ecdh_public;
                
                // create a symmetric key for the session
                var random_bytes = secrand.randomBuffer(32);
                var session_symmkey = nodecrypto.createHash('sha256').update(random_bytes).digest().toString('hex');
                
                logger.debug("exchange symm key %s with contact %s", session_symmkey, account);
                logger.debug("using ecdh public key %s", ecdh_public);
                
                var plaindata = { symmetric_key: session_symmkey };
                var cipher = wotmsg.ecdh_encypt(streemio.User.ecdh_key, ecdh_public, plaindata);
                
                var data = {
                    account: streemio.User.name, 
                    public_key: streemio.User.public_key,
                    ecdh_public_key: streemio.User.ecdh_public_key, 
                    address: streemio.User.address, 
                    port: streemio.User.port
                };
                data[wotmsg.MSGFIELD.DATA] = cipher;
                
                var jti = streemio.Message.create_id();
                var encoded_msgbuffer = wotmsg.create_msg(wotmsg.PEERMSG.EXCH, jti, streemio.User.private_key, data, streemio.User.name, account);
                streemio.Node.peer_send(contact, encoded_msgbuffer);
                
                //  insert the session key into the list
                list_of_sessionkeys[account] = {
                    symmetric_key: session_symmkey,
                    contact_ecdh_public: contact.ecdh_public,
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
    
    module.send_offline_message = function (contact, message, callback) {
        try {
            logger.debug("send_offline_message()");
            
            if (!contact) {
                throw new Error("invalid contact parameter");
            }
            if (!message) {
                throw new Error("invalid message parameter");
            }
            
            var account = contact.name;
            var rcpt_ecdh_public_key = contact.ecdh_public;
            
            var plaindata = { message: message };
            var cipher = wotmsg.ecdh_encypt(streemio.User.ecdh_key, rcpt_ecdh_public_key, plaindata);
            
            var timestamp = Date.now();
            var payload = {};
            payload.type = wotmsg.MSGTYPE.OMSG;
            payload[wotmsg.MSGFIELD.PUBKEY] = streemio.User.public_key;
            payload[wotmsg.MSGFIELD.SEKEY] = streemio.User.ecdh_public_key;
            payload[wotmsg.MSGFIELD.REKEY] = rcpt_ecdh_public_key;
            payload[wotmsg.MSGFIELD.TIMES] = timestamp;
            payload[wotmsg.MSGFIELD.CIPHER] = cipher;
            
            var jti = streemio.Message.create_id();
            var value = wotmsg.create(streemio.User.private_key, jti, payload, null, null, streemio.User.name, null, account);
            var key = account + "/message/" + jti;
            // put the message to the network
            streemio.Node.put(key, value, function (err) {
                if (err) {
                    return streemio.notify.error("Send off-line message error %j", err);
                }
                logger.debug("sent off-line message " + key);
                callback();
            });
        }
        catch (e) {
            streemio.notify.error("send_offline_message error %j", e);
        }
    }
    
    module.send_peer_message = function (contact, message) {
        try {
            //logger.debug("send_peer_message()");
            
            if (!contact) {
                throw new Error("invalid contact parameter");
            }
            if (!message) {
                throw new Error("invalid message parameter");
            }
            
            var account = contact.name;
            var session = list_of_sessionkeys[account];
            if (!session && !session.accepted && !session.symmetric_key) {
                throw new Error("contact session key doesn't exists");
            }
            
            var jti = streemio.Message.create_id();
            var encoded_msgbuffer = wotmsg.create_symm_msg(wotmsg.PEERMSG.SYMD, jti, streemio.User.private_key, session.symmetric_key, message, streemio.User.name, account);
            streemio.Node.peer_send(contact, encoded_msgbuffer);
        }
        catch (e) {
            streemio.notify.error("send_peer_message error %j", e);
        }
    }
   
    module.ping = function (contact, showprogress, timeout) {
        
        return new Promise(function (resolve, reject) {
            try {
                
                var account = contact.name;
                var data = {}
                data[wotmsg.MSGFIELD.TIMES] = Date.now();
                data[wotmsg.MSGFIELD.ECDHPK] = streemio.User.ecdh_public_key;
                
                var jti = streemio.Message.create_id();
                var encoded_msgbuffer = wotmsg.create_msg(wotmsg.PEERMSG.PING, jti, streemio.User.private_key, data, streemio.User.name, account);
                streemio.Node.peer_send(contact, encoded_msgbuffer);
                
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
    
    module.send_addcontact_request = function (contact) {
        try {                
            var account = contact.name;
            var data = { sender: streemio.User.name };
            data[wotmsg.MSGFIELD.PUBKEY] = streemio.User.public_key;
            data[wotmsg.MSGFIELD.ECDHPK] = streemio.User.ecdh_public_key;
            data[wotmsg.MSGFIELD.PROTOCOL] = config.transport;
            data[wotmsg.MSGFIELD.HOST] = streemio.User.address;
            data[wotmsg.MSGFIELD.PORT] = streemio.User.port;
            data[wotmsg.MSGFIELD.UTYPE] = streemio.DEFS.USER_TYPE_HUMAN;
                
            var jti = streemio.Message.create_id();
            var encoded_msgbuffer = wotmsg.create_msg(wotmsg.PEERMSG.ACRQ, jti, streemio.User.private_key, data, streemio.User.name, account);
            streemio.Node.peer_send(contact, encoded_msgbuffer);
        }
        catch (err) {
            streemio.notify.error("send_addcontact_request error:  %j", err);
        }        
    }
    
    module.send_accept_addcontact_reply = function (contact) {
        try {
            var account = contact.name;
            var data = { sender: streemio.User.name };

            var jti = streemio.Message.create_id();
            var encoded_msgbuffer = wotmsg.create_msg(wotmsg.PEERMSG.AACR, jti, streemio.User.private_key, data, streemio.User.name, account);
            streemio.Node.peer_send(contact, encoded_msgbuffer);
        }
        catch (err) {
            streemio.notify.error("send_addcontact_request error:  %j", err);
        }
    }
    
    module.send_decline_addcontact_reply = function (contact) {
        try {
            var account = contact.name;
            var data = { sender: streemio.User.name };
            
            var jti = streemio.Message.create_id();
            var encoded_msgbuffer = wotmsg.create_msg(wotmsg.PEERMSG.DACR, jti, streemio.User.private_key, data, streemio.User.name, account);
            streemio.Node.peer_send(contact, encoded_msgbuffer);
        }
        catch (err) {
            streemio.notify.error("send_addcontact_request error:  %j", err);
        }
    }
    
    module.hangup_call = function (contact) {
        
        return new Promise(function (resolve, reject) {
            try {                
                var account = contact.name;
                var data = {}
                data[wotmsg.MSGFIELD.TIMES] = Date.now();
                
                var jti = streemio.Message.create_id();
                var encoded_msgbuffer = wotmsg.create_msg(wotmsg.PEERMSG.HCAL, jti, streemio.User.private_key, data, streemio.User.name, account);
                streemio.Node.peer_send(contact, encoded_msgbuffer);
                
                // don't wait for reply
            }
            catch (err) {
                reject(err);
            }
        });
    }
    
    module.call = function (contact, type, showprogress) {
        
        return new Promise(function (resolve, reject) {
            try {
                
                var account = contact.name;
                var data = {}
                data[wotmsg.MSGFIELD.CALLT] = type;
                
                var jti = streemio.Message.create_id();
                var encoded_msgbuffer = wotmsg.create_msg(wotmsg.PEERMSG.CALL, jti, streemio.User.private_key, data, streemio.User.name, account);
                streemio.Node.peer_send(contact, encoded_msgbuffer);
                
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
    
    module.initfile = function (contact, file, showprogress, timeout) {
        
        return new Promise(function (resolve, reject) {
            try {
                
                var account = contact.name;
                var data = {}
                data[wotmsg.MSGFIELD.CALLT] = streemio.DEFS.CALLTYPE_FILET;
                data.file_name = file.name;
                data.file_size = file.size;
                data.file_hash = file.hash;
                data.file_type = file.type;

                var jti = streemio.Message.create_id();
                var encoded_msgbuffer = wotmsg.create_msg(wotmsg.PEERMSG.FILE, jti, streemio.User.private_key, data, streemio.User.name, account);
                streemio.Node.peer_send(contact, encoded_msgbuffer);
                
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
    
    module.is_peer_session = function (account) {
        var val = list_of_sessionkeys[account];
        return val ? true : false;
    }
    
    module.get_messages = function () {
        try {
            logger.debug("get_messages");
            
            streemio.Node.get_messages(streemio.User.name, function (err, result) {
                if (err) {
                    return streemio.notify.error("get_messages error:  %j", err);
                }
                
                events.emit(events.APPEVENT, events.TYPES.ONOFFLINEMSG, result);
            });
        }
        catch (e) {
            streemio.notify.error("get_messages error:  %j", e);
        }
    }
    
    module.delete_item = function (key, request) {
        try {
            streemio.Node.delete_item(key, request);
        }
        catch (e) {
            streemio.notify.error("delete_item error:  %j", e);
        }
    }
    
    module.delete_messages = function (callback) {
        try {
            
            var payload = {};
            payload.type = wotmsg.MSGTYPE.DEL;
            payload[wotmsg.MSGFIELD.TIMES] = Date.now();
            
            var jti = streemio.Message.create_id();
            var request = wotmsg.create(streemio.User.private_key, jti, payload, null, null, streemio.User.name);
            streemio.Node.delete_messages(request, callback);
        }
        catch (e) {
            streemio.notify.error("delete_messages error:  %j", e);
        }
    }
    
    module.delete_public_key = function (callback) {
        try {
            //  publishing user data
            if (!streemio.User.public_key || !streemio.User.ecdh_public_key || !streemio.User.address || !streemio.User.port) {
                return callback("invalid user context data");
            }
            
            //  publish the public keys so this client can communicate with the devices
            //  via direct peer to peer messaging as well
            // create the WoT message 
            var payload = {};
            payload.type = wotmsg.MSGTYPE.DELPK;
            payload[wotmsg.MSGFIELD.PUBKEY] = streemio.User.public_key;
            
            logger.debug("publish delete key: %j", payload);
            
            var value = wotmsg.create(streemio.User.private_key, streemio.Message.create_id(), payload);
            var key = streemio.User.name;
            
            //  For this public key upload message the key is the device name
            streemio.Node.put(key, value, function (err) {
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
    
    module.update_public_key = function (new_public_key, callback) {
        try {
            //  publishing user data
            if (!streemio.User.public_key || !streemio.User.ecdh_public_key || !streemio.User.address || !streemio.User.port) {
                return callback("invalid user context data");
            }
            
            if (!new_public_key) {
                return callback("invalid new public key");
            }
            
            //  publish the public keys so this client can communicate with the devices
            //  via direct peer to peer messaging as well
            // create the WoT message 
            var payload = {};
            payload.type = wotmsg.MSGTYPE.UPDPK;
            payload[wotmsg.MSGFIELD.PUBKEY] = new_public_key;
            payload[wotmsg.MSGFIELD.LASTPKEY] = streemio.User.public_key;
            payload[wotmsg.MSGFIELD.ECDHPK] = streemio.User.ecdh_public_key;
            payload[wotmsg.MSGFIELD.PROTOCOL] = config.transport;
            payload[wotmsg.MSGFIELD.HOST] = streemio.User.address;
            payload[wotmsg.MSGFIELD.PORT] = streemio.User.port;
            payload[wotmsg.MSGFIELD.UTYPE] = streemio.DEFS.USER_TYPE_HUMAN;
            
            logger.debug("publish update key: %j", payload);
            
            var value = wotmsg.create(streemio.User.private_key, streemio.Message.create_id(), payload);
            var key = streemio.User.name;
            
            //  For this public key upload message the key is the device name
            streemio.Node.put(key, value, function (err) {
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
    
    module.publish_user = function (callback) {
        try {
            if (!callback) {
                return streemio.notify.error("publish_user error: invalid callback parameter")
            }

            //  publishing user data
            if (!streemio.User.public_key || !streemio.User.ecdh_public_key || !streemio.User.address || !streemio.User.port) {
                return callback("invalid user context data");
            }
            
            //  publish the public keys so this client can communicate with the devices
            //  via direct peer to peer messaging as well
            // create the WoT message 
            var payload = {};
            payload.type = wotmsg.MSGTYPE.PUBPK;
            payload[wotmsg.MSGFIELD.PUBKEY] = streemio.User.public_key;
            payload[wotmsg.MSGFIELD.ECDHPK] = streemio.User.ecdh_public_key;
            payload[wotmsg.MSGFIELD.PROTOCOL] = config.transport;
            payload[wotmsg.MSGFIELD.HOST] = streemio.User.address;
            payload[wotmsg.MSGFIELD.PORT] = streemio.User.port;
            payload[wotmsg.MSGFIELD.UTYPE] = streemio.DEFS.USER_TYPE_HUMAN;
            
            logger.debug("publish_user: %j", payload);
            
            var value = wotmsg.create(streemio.User.private_key, streemio.Message.create_id(), payload);
            var key = streemio.User.name;
            
            //  For this public key upload message the key is the device name
            streemio.Node.put(key, value, function (err, results) {
                if (err) {
                    return callback("Publish user error: " + (err.message ? err.message : err));
                }                

                if (results && results.length) {
                    var success = false;
                    for (var i = 0; i < results.length; i++) {
                        var contact_account = (results[i].contact && results[i].contact.account) ? results[i].contact.account : "unknown";
                        var contact_address = (results[i].contact && results[i].contact.address) ? results[i].contact.address : "unknown";
                        var contact_port = (results[i].contact && results[i].contact.port) ? results[i].contact.port : "unknown";
                        if (results[i].status != 0) {                            
                            var error = (results[i].error && results[i].error.message)  ? results[i].error.message : "unknown error";
                            logger.info("Error in publishing account public key at contact account: " + contact_account + ", address: " + contact_address + ", port: " + contact_port + ". Error: " + error);
                        }
                        else {
                            //  at least one node has succeeded so the operation completed
                            logger.debug("Published account public key at contact account:" + contact_account + ", address: " + contact_address + ", port: " + contact_port + " completed");
                            success = true;
                        }
                    }

                    if (!success) {
                        return callback("Publish user error: no results array returned");
                    }
                }
                
                logger.debug("peer published");
                
                callback();  

                //  the public key has been uplodad, other peers can verify the messages -> ready to process device messages
                events.emit(events.APPEVENT, events.TYPES.ONUSERPUBLISH);
            });
        }
        catch (e) {
            callback("Publish peer user error:  %j", e);
        }
    }
    
    module.session = function (account) {
        var session = list_of_sessionkeys[account];
        if (session && session.accepted && session.symmetric_key) {
            //  the session is already exists
            return session;
        }
        else {
            return null;
        }
    }
    
    module.get_contact_session = function (contact) {
        
        return new Promise(function (resolve, reject) {
            try {
                var account = contact.name;
                
                // create the session
                exchange_session_key(contact)
                .then(
                    function (jti) {
                        return wait_peer_reply(jti, 5000, true);
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
    
    module.validate_connection = function () {
        return new Promise(function (resolve, reject) {
            streemio.Node.validate_connection(function (err) {
                if (err) {
                    reject(err);
                }
                else {
                    resolve();
                }
            });
        });
    }
    
    module.init = function (seeds) {
        return new Promise(function (resolve, reject) {
            streemio.Node.init(seeds, function (err, result) {
                if (err) {
                    reject(err);
                }
                else {
                    resolve();
                }
            });
        });
    }
    
    
    return module;

}(streemio.PeerNet || {}, global.applogger, global.appevents, global.appconfig));
