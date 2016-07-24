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


streembit.WebSocketTransport = (function (module, logger, events, config) {
    
    var port = config.wsport || streembit.DEFS.WS_PORT;

    module.wsport = port;
    module.list_of_servers = {};

    function get_account_socket() {
        var host = streembit.User.address;
        var socket = module.list_of_servers[host];
        return socket;
    }
    
    function create_wssocket(host, port, connectfn, errorfn) {
        var server = "http://" + host + ":" + (port || module.wsport);
        logger.info("create web socket: " + server);
        
        var socket = 0;
        
        try {
            socket = io(server, {
                'reconnection': true,
                'reconnectionDelay': 1000,
                'reconnectionDelayMax' : 5000,
                'reconnectionAttempts': 2
            });
        }
        catch (err) {            
            if (errorfn) {
                return errorfn("create socket io error: " + err.message);
            }
            else {
                return streembit.notify.error("create socket io error: %j", err);
            }
        }
        
        if (socket) {
            
            socket.on("connect_error", function (err) {
                if (errorfn) {
                    errorfn("WebSocket connect error: " + err.message);
                }
                else {
                    streembit.notify.error("ws socket connect error: %j", err);
                }
            });
            
            socket.on("reconnect_failed", function (err) {
                streembit.notify.error("socket io reconnect_failed: %j", err);
            });
            
            socket.on('connect', function () {
                logger.debug('web socket is connected');
                
                module.list_of_servers[host] = socket;
                
                if (connectfn) {
                    connectfn();
                }
            });
            
            socket.on('peermsg', function (data) {
                try {
                    if (!data || !data.contact || !data.contact.name || data.contact.name != streembit.User.name || !data.message) {
                        return logger.error("WS peermsg() error: invalid message context");
                    }
                    
                    var message = JSON.parse(data.message);
                    if (!message) {
                        return streembit.notify.error("Invalid message at web socket peermsg");
                    }
                    if (!message.type || message.type != "PEERMSG") {
                        return streembit.notify.error("Invalid message type at web socket peermsg");
                    }
                    if (!message.data) {
                        return streembit.notify.error("Invalid message data at web socket peermsg");
                    }
                    
                    //  raise an application event that a peer sent a message
                    events.emit(events.APPEVENT, events.TYPES.ONPEERMSG, message.data, null);
                    
                }
                catch (e) {
                    logger.error("socket io message error: %j", e)
                }
            });
            
            socket.on('message', function (data) {
                try {

                }
                catch (e) {
                    logger.error("socket io message error: %j", e)
                }
            });
            
            socket.on('put', function (item) {
                if (!item || !item.key)
                    return;
                
                var key = item.key;
                if (item && key && item.value) {
                    if (key.indexOf("/") == -1) {
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
            });
            
            socket.on('disconnect', function () {
                logger.debug('web socket is disconnected ');
            //TODO reconnect
            });
            
            socket.on('error', function (err) {
                try {
                    if (errorfn) {
                        errorfn(err);
                    }
                    logger.error('web socker error: %j', err);
                    events.emit(events.APPEVENT, events.TYPES.ONPEERERROR, { error: err });
                }
                catch (e) {
                    logger.error("socket io error: %j", e)
                }
            });
        }

    }
    
    function get_contact_socket(host, port, callback) {
        var socket = module.list_of_servers[host];
        if (!socket) {
            create_wssocket(host, port, function () {
                socket = module.list_of_servers[host];
                var request = { account: streembit.User.name, publickey: streembit.User.public_key };
                socket.emit('register_account', request, function (err) {
                    callback(socket);
                });
            });
        }
        else {
            callback(socket);
        }
    }
    
    module.is_node_connected = function () {
        var connected = false;
        var host = streembit.User.address;
        if (host) {
            var socket = module.list_of_servers[host];
            if (socket) {
                connected = true;
            }
        }
        return connected;
    }

    module.init = function (bootdata, callback) {
        logger.debug("WebSocketTransport init");
        
        if (!bootdata || !bootdata.seeds || !bootdata.seeds.length) {
            return resultfn("Invalid seeds");
        }
        
        var host = bootdata.seeds[0].host;
        var port = bootdata.seeds[0].port;
        create_wssocket(host, port, 
            function () {
                streembit.User.address = host;
                streembit.User.port = port;
                callback();
            },
            function (err) {    //  error handler
                callback(err);
            }
        );
    }

    module.validate_contacts = function (callback) {
        try {
            callback(null, 1);
        }
        catch (e) {
            callback(e);
        }
    }

    module.validate_connection = function (callback) {
        callback();
    }
    
    module.find_contact = function (account, public_key, callback) {
        var socket = get_account_socket();
        if (!socket) {
            return callback("web socket does not exists");
        }
        
        socket.emit("find_contact", account, public_key, function (err, contact) {
            callback(err, contact);
        });
    }
    
    module.put = function (key, value, callback) {
        var socket = get_account_socket();
        if (!socket) {
            return callback("web socket does not exists");
        }
        
        var request = { key: key, value: value };
        socket.emit("put", request, function (err) {
            if (err) {
                return callback(err);
            }
            
            if (key != streembit.User.name) {
                return callback();
            }
            
            if (streembit.User.public_key) {
                request = { account: streembit.User.name, publickey: streembit.User.public_key };
                socket.emit('register_account', request, function (err) {
                    callback(err);
                });
            }
        });
    }
    
    module.get = function (key, callback) {
        var socket = get_account_socket();
        if (!socket) {
            return callback("web socket does not exists");
        }
        
        socket.emit("get", key, function (err, data) {
            callback(err, data);
        });
    }
    
    function get_socket_forcontact(contact, callback) {
        if (contact.protocol != streembit.DEFS.TRANSPORT_WS) {
            //  try to route the messagfe via the web socket server 
            //  since this account is using web socket ws is the only option to reach the contact
            var socket = get_account_socket();
            if (!socket) {
                return callback("web socket does not exists");
            }
            
            callback(null, socket);
        }
        else {
            get_contact_socket(contact.address, contact.port, function (socket) {
                if (!socket) {
                    return callback("web socket for " + contact.address + " does not exists");
                }
                
                callback(null, socket);
            });
        }
    }
    
    module.peer_send = function (contact, data) {
        try {
            
            if (!data) {
                throw new Error("peer_send invalid data parameter");
            }
            if (!contact) {
                throw new Error("peer_send invalid contact parameter");
            }
            if (!contact.protocol) {
                throw new Error("peer_send invalid contact protocol parameter");
            }
            
            get_socket_forcontact(contact, function (err, socket) {
                if (err) {
                    return logger.error("peer_send error:  %j", err);
                }
                if (!socket) {
                    return logger.error("web socket could not create for contact " + contact.name);
                }
                
                var message = streembit.Message.create_peermsg(data, true);
                var request = {
                    contact: {
                        name: contact.name, 
                        protocol: contact.protocol, 
                        address: contact.address, 
                        port: contact.port
                    }, 
                    message: message
                };
                socket.emit("peermsg", request, function (err) {
                    if (err) {
                        return logger.error("WS peer_send error: " + err);
                    }
                    
                    logger.debug("ws peermsg sent to " + contact.name + " socket.id: " + socket.id)
                });

            });

        }
        catch (err) {
            logger.error("peer_send error:  %j", err);
        }
    }
    
    module.get_range = function ( msgkey, callback) {
        try {            
            var socket = get_account_socket();
            if (!socket) {
                return callback("web socket does not exists");
            }
            
            socket.emit("get_range", msgkey, function (err, result) {
                callback(err, result);
            });            
        }
        catch (err) {
            logger.error("get_account_messages error:  %j", err);
        }
    }
    
    module.get_seeds = function () {
        return [];
    }    
    
    return module;

}(streembit.WebSocketTransport || {}, streembit.logger, global.appevents, streembit.config));

