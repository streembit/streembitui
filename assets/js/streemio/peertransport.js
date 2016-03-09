
'use strict';

var streemio = streemio || {};

var assert = require('assert');
var wotmsg = require("./libs/message/wotmsg");
var wotkad = require('./libs/wotkad/kaddht'); 
var uuid = require("uuid");
var nodecrypto = require("crypto");

streemio.PeerTransport = (function (obj, logger, events, config, db) {
    
    var DEFAULT_STREEMIO_PORT = 32320;

    obj.node = 0;
    obj.is_publickey_uplodaed = false;
    obj.is_connected = false;
    
    function onPeerMessage (message, info) {
        try {
            if (!message) {
                return streemio.notify.error ("Invalid message at onPeerMessage");  
            }            
            if (!message.type || message.type != "PEERMSG") {
                return streemio.notify.error("Invalid message type at onPeerMessage");  
            }
            if (!message.data) {
                return streemio.notify.error("Invalid message data at onPeerMessage");
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
                //  send to the VM and update if it is on the contact list
                //streemio.Session.contactsvm.update_contact(item.key, item);
                events.emit(events.CONTACT_ONLINE, item.key, item);
            }
            else {
                var msgkey = streemio.User.name + "/message/";
                if (key.indexOf(msgkey) > -1 && item.recipient == streemio.User.name) {
                    //logger.debug("off-line message item: %j", item);
                    var items = [item];
                    events.emit(events.APPEVENT, events.TYPES.ONOFFLINEMSG, items);
                }
            }
        }
    }
    
    function onNodeError(err, contact, data) {
        //logger.error("onNodeError: %j", err);     
        events.emit(events.APPEVENT, events.TYPES.ONPEERERROR, { error: err, contact: contact, data: data });
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
        if (obj.node && obj.is_connected == true) {
            obj.node.close();
            obj.is_connected = false;
        }
        
        if (!bootdata || !bootdata.seeds || !bootdata.seeds.length) {
            return resultfn("Invalid seeds");
        }
        
        var is_private_network = bootdata.isprivate_network;
        var private_network_accounts = bootdata.private_accounts;
        
        streemio.User.port = config.tcpport;
        var accountId;
        if (streemio.Main.network_type == streemio.DEFS.PUBLIC_NETWORK) {
            if (is_private_network && private_network_accounts && private_network_accounts.length) {
                return resultfn("Public network is requested. The seed is a private network.");
            }            
        }
        else {
            if (!is_private_network || !private_network_accounts || !private_network_accounts.length) {
                return resultfn("Invalid private network information boot data");
            }
        }
        
        accountId = streemio.User.name || get_account_id();
        logger.debug("Current peer account is " + accountId);        
        
        var seedlist = [];

        for (var i = 0; i < bootdata.seeds.length; i++) {
            if (!bootdata.seeds[i].port) {
                bootdata.seeds[i].port = DEFAULT_STREEMIO_PORT;
            }

            if (streemio.Main.network_type == streemio.DEFS.PRIVATE_NETWORK) {
                if (!bootdata.seeds[i].account) {
                    return resultfn("Invalid seed configuration data. The seed must have an account in a private network");
                }
            }
            else {
                if (!bootdata.seeds[i].account) {
                    var str = "" + bootdata.seeds[i].address + ":" + bootdata.seeds[i].port;
                    var buffer = new Buffer(str);
                    var acc = nodecrypto.createHash('sha1').update(buffer).digest().toString('hex');
                    bootdata.seeds[i].account = acc;
                }
            }
            
            // remove our own account id in case if it is in the list
            if (bootdata.seeds[i].account != accountId) {
                seedlist.push(bootdata.seeds[i]);
                logger.debug("seed: %j", bootdata.seeds[i]);
            }
        }        
        
        var options = {
            errhandler: onNodeError,
            log: logger,
            port: config.tcpport,
            account: accountId,
            seeds: seedlist, 
            peermsgHandler: onPeerMessage,
            storage: db,
            is_private_network: is_private_network,
            private_network_accounts: private_network_accounts,
            is_gui_node: true,
            contact_exist_lookupfn: streemio.Session.contactsvm.exists
        };
        
        try {
            var peernode = wotkad(options);
            peernode.create(function (err, value) {
                if (err) {
                    return resultfn(err);
                }                
            });
            
            var result_return_processing = false;

            peernode.on('connect', function (err, nodeval) {
                if (err) {
                    return resultfn("peer connect error: " +  err.message ? err.message : err);
                }
                
                logger.debug("node connected %j", nodeval);                
                
                
                if (result_return_processing == false) {
                    result_return_processing = true;
                    
                    logger.debug("--- setting node values");

                    obj.is_connected = true;
                    obj.node = peernode;
                    
                    var address = obj.node.Address;
                    var port = obj.node.Port;
                    if (!address || !port) {
                        return resultfn("Invalid address and port peer data");
                    }
                    
                    streemio.User.address = address;
                    streemio.User.port = port;

                    obj.node.is_seedcontact_exists(function (result) {
                        if (result) {
                            logger.debug("seed contact exists in buckets");
                            resultfn();
                        }
                        else {
                            resultfn("communication with seeds failed");
                        }  
                    });
                    
                }
            });
            
            peernode.on('msgstored', msg_stored);
        }
        catch (e) {            
            callback(e);
        }
    }    
    
    obj.validate_connection = function (callback) {
        try {
            obj.node.validate_connection(function (err) {
                if (err) {
                    //  it was an error
                    //  close the node connection 
                    if (obj.node && obj.is_connected == true) {
                        obj.node.close();
                        obj.is_connected = false;
                        obj.node = null;
                    }
                }
                callback(err);
            });
        }
        catch (e) {
            callback(e);
        }
    }

    obj.put = function (key, value, callback) {
        //  For this public key upload message the key is the device name
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
    
    obj.get_node = function (account, callback) {
        if (!callback || (typeof callback != "function"))
            throw new Error("invalid callback at find_node");
        
        //  For this public key upload message the key is the device name
        obj.node.getNode(account, function (err, msg) {
            callback(err, msg);
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
            
            var message = streemio.Message.create_peermsg(data);
            var options = { address: contact.address, port: contact.port };
            obj.node.peer_send(options, message);
        }
        catch (err) {
            logger.error("peer_send error:  %j", err);
        }
    }
    
    obj.get_messages = function (account, callback) {
        try {
            if (!account ) {
                throw new Error("get_messages invalid account parameter");
            }

            obj.node.msg_request(account, callback);
        }
        catch (err) {
            logger.error("get_messages error:  %j", err);
        }
    }
    
    obj.delete_messages = function (request, callback) {
        try {
            if (!request) {
                throw new Error("delete_messages invalid request parameter");
            }
            
            obj.node.delete_messages(request, callback);
        }
        catch (err) {
            logger.error("delete_messages error:  %j", err);
        }
    }
    
    obj.delete_item = function (key, request) {
        obj.node.delete_item(key, request);
    }

    return obj;

}(streemio.PeerTransport || {}, streemio.logger, global.appevents, streemio.config, streemio.MainDB));
