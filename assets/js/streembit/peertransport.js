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
                    port: config.tcpport,
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
                    
                    streembit.User.port = config.tcpport;
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

        //for (var i = 0; i < bootdata.seeds.length; i++) {
        //    //if (!bootdata.seeds[i].port) {
        //    //    bootdata.seeds[i].port = DEFAULT_STREEMBIT_PORT;
        //    //}

        //    //if (streembit.Main.network_type == streembit.DEFS.PRIVATE_NETWORK) {
        //    //    if (!bootdata.seeds[i].account) {
        //    //        return resultfn("Invalid seed configuration data. The seed must have an account in a private network");
        //    //    }
        //    //}
        //    //else {
        //    //    if (!bootdata.seeds[i].account) {
        //    //        var str = "" + bootdata.seeds[i].address + ":" + bootdata.seeds[i].port;
        //    //        var buffer = new Buffer(str);
        //    //        var acc = nodecrypto.createHash('sha1').update(buffer).digest().toString('hex');
        //    //        bootdata.seeds[i].account = acc;
        //    //    }
        //    //}
            
        //    //// remove our own account id in case if it is in the list
        //    //if (bootdata.seeds[i].account != accountId) {
        //    //    seedlist.push(bootdata.seeds[i]);
        //    //    logger.debug("seed: %j", bootdata.seeds[i]);
        //    //}
        //    seedlist.push(bootdata.seeds[i]);
        //    logger.debug("seed: %j", bootdata.seeds[i]);
        //}        
        
        //var options = {
        //    onnodeerror: onNodeError,
        //    onnetworkerror: onNetworkError,
        //    log: logger,
        //    port: config.tcpport,
        //    account: accountId,
        //    seeds: seedlist, 
        //    peermsgHandler: onPeerMessage,
        //    storage: db,
        //    is_private_network: is_private_network,
        //    private_network_accounts: private_network_accounts
        //};
        
        //try {
        //    var peernode = streembitkad(options);
        //    peernode.create(function (err) {
        //        if (err) {
        //            return resultfn(err);
        //        }
                
        //        logger.debug("peernode.create complete");
                
        //        obj.is_connected = true;
        //        obj.node = peernode;
                
        //        var address = obj.node.Address;
        //        var port = obj.node.Port;
        //        if (!address || !port) {
        //            return resultfn("Invalid peer address and port");
        //        }
                
        //        streembit.User.address = address;
        //        streembit.User.port = port;
                
        //        obj.node.is_seedcontact_exists(function (result) {
        //            if (result) {
        //                logger.debug("seed contact exists in buckets");
        //                resultfn();
        //            }
        //            else {
        //                resultfn("communication with seeds failed");
        //            }
        //        });    
        //    });
            
        //    // handle msgstored event
        //    peernode.on('msgstored', msg_stored);

            //
            //
        //}
        //catch (e) {            
        //    resultfn(e);
        //}
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
