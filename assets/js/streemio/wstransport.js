
'use strict';

var streemio = streemio || {};


streemio.WebSocketTransport = (function (module, logger, events, config) {
    
    var port = 32318;
    if (config && config.p2p && config.p2p.settings && config.p2p.settings.wsport) {
        port = config.p2p.settings.wsport;
    }
    module.wsport = port;
    module.list_of_servers = {};
    
    function get_account_socket() {
        var host = streemio.User.address;
        var socket = module.list_of_servers[host];
        return socket;
    }
    
    function create_wssocket(host, port, connectfn, errorfn) {
        var server = "http://" + host + ":" + (port || module.wsport);
        logger.debug("create web socket: " + server);
        
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
                return streemio.notify.error("create socket io error: %j", err);
            }
        }
        
        if (socket) {
            
            socket.on("connect_error", function (err) {
                if (errorfn) {
                    return errorfn("ws socket connect error: " + err.message);
                }
                else {
                    return streemio.notify.error("ws socket connect error: %j", err);
                }
            });
            
            socket.on("reconnect_failed", function (err) {
                logger.error("socket io reconnect_failed: %j", err);
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
                    if (!data || !data.contact || !data.contact.name || data.contact.name != streemio.User.name || !data.message) {
                        return logger.error("WS peermsg() error: invalid message context");
                    }
                    
                    var message = JSON.parse(data.message);
                    if (!message) {
                        return streemio.notify.error("Invalid message at web socket peermsg");
                    }
                    if (!message.type || message.type != "PEERMSG") {
                        return streemio.notify.error("Invalid message type at web socket peermsg");
                    }
                    if (!message.data) {
                        return streemio.notify.error("Invalid message data at web socket peermsg");
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
                var request = { account: streemio.User.name, publickey: streemio.User.public_key };
                socket.emit('register_account', request, function (err) {
                    callback(socket);
                });
            });
        }
        else {
            callback(socket);
        }
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
                streemio.User.address = host;
                streemio.User.port = port;
                callback();
            },
            function (err) {    //  error handler
                callback(err);
            }
        );
    }
    
    module.validate_connection = function (callback) {
        callback();
    }
    
    module.get_node = function (account, callback) {
        callback();
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
            
            if (key != streemio.User.name) {
                return callback();
            }
            
            if (streemio.User.public_key) {
                request = { account: streemio.User.name, publickey: streemio.User.public_key };
                socket.emit('register_account', request, function (err) {
                    callback(err);
                });
            }
        });
    }
    
    module.find = function (account, callback) {
        var socket = get_account_socket();
        if (!socket) {
            return callback("web socket does not exists");
        }
        
        socket.emit("find", account, function (err, data) {
            callback(err, data);
        });
    }
    
    function get_socket_forcontact(contact, callback) {
        if (contact.protocol != streemio.DEFS.TRANSPORT_WS) {
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
                
                var message = streemio.Message.create_peermsg(data, true);
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
    
    return module;

}(streemio.WebSocketTransport || {}, global.applogger, global.appevents, global.appconfig));

