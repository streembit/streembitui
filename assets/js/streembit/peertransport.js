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

var streembit = streembit || {};

var assert = require('assert');
var wotmsg = require("streembitlib/message/wotmsg");
var kad = require('streembitlib/kadlib'); 
var uuid = require("uuid");
var nodecrypto = require("crypto");

streembit.PeerTransport = (function (obj, logger, events, config, db) {
    
    var DEFAULT_STREEMBIT_PORT = 32320;

    obj.node = 0;
    obj.is_publickey_uplodaed = false;
    obj.is_connected = false;
    
    var listOfContacts = {};
    
    //  TODO validate the time and remove contact after an idle period
    function updateContact(contact) {
        if (contact && contact.account) {
            var cobj = {
                public_key: contact.public_key,
                nodeID: contact.nodeID,
                address: contact.address,
                port: contact.port,
                updated: Date.now()
            }
            listOfContacts[contact.account] = cobj;
        }
    }
    
    function isContactAllowed(contact) {
        //TODO for private networks    
        return true;
    }

    function validateMessage(params, contact, callback) {
        var is_update_key = false, is_system_update_key = false, msgid = 0;
        
        try {
            var payload = wotmsg.getpayload(params.value);
            if (!payload || !payload.data || !payload.data.type) {
                return callback("validateMessage error invalid payload");
            }
            
            if (payload.data.type == wotmsg.MSGTYPE.PUBPK || payload.data.type == wotmsg.MSGTYPE.UPDPK || payload.data.type == wotmsg.MSGTYPE.DELPK) {
                if (!payload.data[wotmsg.MSGFIELD.PUBKEY]) {
                    return callback("validateMessage error invalid public key payload");
                }
                is_update_key = true;
            }
            
            var account_key;
            if (is_update_key) {
                //  is_update_key == true -> the publisher claims this is a public key store, update or delete message
                //  check if the existing key does exits and if yes then validate the message
                account_key = params.key;
            }
            else {
                //  get the iss field of the JSON web token message
                account_key = payload.iss;
            }
            
            if (!account_key) {
                return callback("validateMessage error: invalid public key account field");
            }
            
            if (payload.data.type == wotmsg.MSGTYPE.DELMSG) {
                msgid = payload.data[wotmsg.MSGFIELD.MSGID];
                if (!msgid) {
                    return callback("validateMessage error: invalid MSGID for delete message");
                }
            }
        }
        catch (err) {
            return callback("onKadMessage error: " + err.message);
        }
        
        thisobj.node.get(account_key, function (err, value) {
            try {
                if (err) {
                    if (is_update_key && err.message && err.message.indexOf("error: 0x0100") > -1) {
                        logger.debug('validateMessage PUBPK key not exists on the network, allow to complete PUBPK message');
                        //  TODO check whether the public key matches with private network keys
                        return callback(null, true);
                    }
                    else {
                        return callback('validateMessage get existing PK error: ' + err.message);
                    }
                }
                else {
                    logger.debug("validateMessage decode wot message");
                    var stored_payload = wotmsg.getpayload(value);
                    var stored_pkkey = stored_payload.data[wotmsg.MSGFIELD.PUBKEY];
                    if (!stored_pkkey) {
                        return callback('validateMessage error: stored public key does not exists');
                    }
                    
                    if (contact.public_key != stored_pkkey) {
                        return callback('validateMessage error: stored public key and contact public key do not match');
                    }
                    
                    //  if this is a private network then the public key must matches with the account's key in the list of public key
                    //  TODO check whether the public key matches with private network keys
                    
                    logger.debug("validateMessage validate account: " + account_key + " public key: " + stored_pkkey);
                    
                    if (payload.data.type == wotmsg.MSGTYPE.PUBPK || 
                        payload.data.type == wotmsg.MSGTYPE.UPDPK || 
                        payload.data.type == wotmsg.MSGTYPE.DELPK ||
                        payload.data.type == wotmsg.MSGTYPE.OMSG ||
                        payload.data.type == wotmsg.MSGTYPE.DELMSG) {
                        var decoded_msg = wotmsg.decode(params.value, stored_pkkey);
                        if (!decoded_msg) {
                            return callback('VERIFYFAIL ' + account);
                        }
                        
                        //  passed the validation -> add to the network
                        logger.debug('validateMessage validation for msgtype: ' + payload.data.type + '  is OK');
                        
                        //node._log.debug('data: %j', params);
                        callback(null, true);
                    }
                }
            }
            catch (val_err) {
                logger.error("validateMessage error: " + val_err.message);
            }
        });
    }
    
    function onKadMessage(message, contact, next) {
        try {
            
            // TODO check for the private network
            if (!isContactAllowed(contact)) {
                return next(new Error('Message dropped, reason: contact ' + contact.account + ' is not allowed'));
            }
            
            if (!message || !message.method || message.method != "STORE" || 
                !message.params || !message.params.item || !message.params.item.key) {
                updateContact(contact);
                // only validate the STORE messages
                return next();
            }
            
            logger.debug('validate STORE key: ' + message.params.item.key);
            
            validateMessage(message.params.item, contact, function (err, isvalid) {
                if (err) {
                    return next(new Error('Message dropped, error: ' + ((typeof err === 'string') ? err : (err.message ? err.message :  "validation failed"))));
                }
                if (!isvalid) {
                    return next(new Error('Message dropped, reason: validation failed'));
                }
                
                // valid message
                return next();
            });
        }
        catch (err) {
            logger.error("onKadMessage error: " + err.message);
            next("onKadMessage error: " + err.message);
        }
    }    
    
    function onPeerMessage (message, info) {
        try {
            if (!message) {
                return streembit.notify.error ("Invalid message at onPeerMessage");  
            }            
            if (!message.type || message.type != "PEERMSG") {
                return streembit.notify.error("Invalid message type at onPeerMessage");  
            }
            if (!message.data) {
                return streembit.notify.error("Invalid message data at onPeerMessage");
            }
            
            //  raise an application event that a peer sent a message
            events.emit(events.APPEVENT, events.TYPES.ONPEERMSG, message.data, info);
            
        }
        catch (err) {
            logger.error("onPeerMessage error %j", err );
        }
    }    
    
    function msg_stored(node_id, item) {
        if (!item || !item.key || !item.hash)
            return;
        
        //logger.debug("peertransport msg_stored, item.key: " + item.key);
        
        var key = item.key;
        if (item && key && item.value ) {
            if ( key.indexOf("/") == -1) {
                //  this is a contact update
                //events.emit(events.CONTACT_ONLINE, item.key, item);
            }
            else {
                var msgkey = streembit.User.name + "/message/";
                if (key.indexOf(msgkey) > -1 && item.recipient == streembit.User.name) {
                    //logger.debug("off-line message item: %j", item);
                    var items = [item];
                    events.emit(events.APPEVENT, events.TYPES.ONACCOUNTMSG, items);
                }
            }
        }
    }    

    function onTransportError(err) {
        logger.error('RPC error: %j', err);
    }
    
    function get_account_id() {
        var id = uuid.v4().toString();
        var accountId = id.replace(/-/g, '');
        return accountId;        
    }
    
    obj.is_node_connected = function () {
        return obj.is_connected;
    }
    
    obj.init = function (bootdata, resultfn) {
        try {
            var self = obj;
            if (obj.node && obj.is_connected == true) {
                obj.node.disconnect(function () {
                    self.is_connected = false;
                    self.node = null;
                    self.init(bootdata, resultfn);
                });
            }
            else {
                if (!bootdata || !bootdata.seeds || !bootdata.seeds.length) {
                    return resultfn("Invalid seeds");
                }
                
                var seedlist = [];
                
                for (var i = 0; i < bootdata.seeds.length; i++) {
                    seedlist.push(bootdata.seeds[i]);
                    logger.debug("seed: %j", bootdata.seeds[i]);
                }
                
                assert(bootdata.address, "address must be passed to node initialization");
                assert(config.tcpport, "port must be passed to node initialization");
                assert(streembit.User.public_key, "account public key must be initialized");
                assert(streembit.User.name, "account name  key must be initialized");
                
                var param = {
                    address: bootdata.address,
                    port: bootdata.port,
                    account: streembit.User.name,
                    public_key: streembit.User.public_key
                };
                
                var contact = kad.contacts.StreembitContact(param);
                
                var transport_options = {
                    logger: logger
                };
                var transport = kad.transports.TCP(contact, transport_options);
                                
                transport.after('open', function (next) {
                    // exit middleware stack if contact is blacklisted
                    logger.info('TCP peer connection is opened');
                    
                    // otherwise pass on
                    next();
                });
                
                // message validator
                transport.before('receive', onKadMessage);

                // handle errors from RPC
                transport.on('error', onTransportError);
                
                var options = {
                    transport: transport,
                    logger: logger,
                    storage: db,
                    seeds: seedlist,
                    onPeerMessage: onPeerMessage
                };
                
                kad.create(options, function (err, peer) {
                    if (err) {
                        streembit.User.address = "";
                        streembit.User.port = 0;
                        return resultfn(err);
                    }
                    
                    logger.debug("peernode.create complete");
                    
                    streembit.User.port = bootdata.port;
                    streembit.User.address = bootdata.address;
                    
                    obj.is_connected = true;
                    obj.node = peer;
                    
                    resultfn();
                });
            }
        }
        catch (e) {
            resultfn(e);
        }
    }    
    
    obj.validate_connection = function (callback) {
        try {
            if (!obj.node || !obj.is_connected) {
                return callback("the node is not connected");
            }

            var count = 0;
            var buckets = obj.node._router._buckets;;
            if (buckets) {
                for (var prop in buckets) {
                    var bucket = buckets[prop];
                    if (bucket._contacts) {
                        for (var i = 0; i < bucket._contacts.length; i++) {
                            logger.debug("bucket contact: %j", bucket._contacts[i]);
                            count++;
                        }
                    }
                }
            }
            
            if (!count) {
                // if seeds are defined then contacts mustr exists in the bucket
                callback("no contacts exist in the bucket");
            }
            else {
                callback();
            }           
        }
        catch (e) {
            callback(e);
        }
    }

    obj.put = function (key, value, callback) {
        //  For this public key upload message the key is the device name
        //  false == don't store locally
        obj.node.put(key, value, function (err, results) {
            if (callback) {
                callback(err, results);
            }
        });
    }
    
    obj.get = function (key, callback) {
        if (!callback || (typeof callback != "function"))
            throw new Error("invalid callback at node get");

        //  For this public key upload message the key is the device name
         obj.node.get(key, function (err, msg) {
            callback(err, msg);
        });
    }
    
    obj.find = function (key, callback) {
        if (!callback || (typeof callback != "function"))
            throw new Error("invalid callback at node find");
        
        //  For this public key upload message the key is the device name
        obj.node.find(key, function (err, msg) {
            callback(err, msg);
        });
    }
    
    obj.find_contact = function (account, public_key, callback) {
        if (!callback || (typeof callback != "function"))
            throw new Error("invalid callback at find_node");
        
        //  For this public key upload message the key is the device name
        kad.find_contact(obj.node, account, public_key, function (err, contact) {
            if (!err && contact && contact.account == account) {
                contact.protocol = streembit.DEFS.TRANSPORT_TCP;
                contact.name = account;
                callback(err, contact);
            }
            else {
                callback(err, null);
            }
        });
    }    

    obj.peer_send = function (contact, data) {
        try {
            if (!data) {
                throw new Error("peer_send invalid data parameter");
            }
            if (!contact) {
                throw new Error("peer_send invalid contact parameter");
            }
            
            var message = streembit.Message.create_peermsg(data);
            var options = { address: contact.address, port: contact.port };
            obj.node.peer_send(options, message);
        }
        catch (err) {
            logger.error("peer_send error:  %j", err);
        }
    }
    
    obj.get_account_messages = function (account, msgkey, callback) {
        try {
            if (!account ) {
                throw new Error("get_account_messages invalid account parameter");
            }

            obj.node.get_account_messages(account, msgkey, callback);
        }
        catch (err) {
            logger.error("get_account_messages error:  %j", err);
        }
    }    
    
    obj.delete_item = function (key, request) {
        obj.node.delete_item(key, request);
    }

    return obj;

}(streembit.PeerTransport || {}, streembit.logger, global.appevents, streembit.config, streembit.MainDB));
