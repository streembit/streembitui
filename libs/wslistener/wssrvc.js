/*

This file is part of Streemio application. 
Streemio is an open source project to create a real time communication system for humans and machines. 

Streemio is a free software: you can redistribute it and/or modify it under the terms of the GNU General Public License 
as published by the Free Software Foundation, either version 3.0 of the License, or (at your option) any later version.

Streemio is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of 
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU General Public License for more details.

You should have received a copy of the GNU General Public License along with W3C Web-of-Things-Framework.  
If not, see http://www.gnu.org/licenses/.
 
-------------------------------------------------------------------------------------------------------------------------
Author: Tibor Zsolt Pardi 
Copyright (C) 2016 The Streemio software development team
-------------------------------------------------------------------------------------------------------------------------

*/


var logger = require('streemio/libs/logger/logger');
var HashMap = require('hashmap');
var http = require('http');
var appevents = require('streemio/libs/events/AppEvents');
var wotmsg = require('streemio/libs/message/wotmsg');

var WebSocketSrv = exports.WebSocketSrv = function () {
    try {
        this.server = 0;
        this.listOfClients = new HashMap();
    }
    catch (e) {
        logger.error(e);
    }
};

WebSocketSrv.prototype.onPeerMessage = function (recipient, data) {
    try {
        
        var msgarray = wotmsg.get_msg_array(data);
        if (!msgarray || !msgarray.length || msgarray.length != 3)
            throw new Error("invalid message");
        
        var header = msgarray[0];
        var payload = msgarray[1];
        if (!payload || !payload.aud)
            throw new Error("invalid aud element");
        
        // get the account from the list
        var client = this.listOfClients.get(payload.aud);
        if (!client) {
            // TODO
            return;
        }
        
        var sender = payload.iss;
        if (!sender)
            throw new Error("invalid sender element");
        
        //  get the public key for the sender only contacts are 
        //  allowed communicate with eachother via peer to peer
        var public_key = client.publickey;
        if (!public_key) {
            throw new Error("peer message sender '" + sender + "' is not a contact");
        }
        
        var message = wotmsg.decode(data, public_key);
        if (!message || !message.data)
            throw new Error("invalid JWT message");
        
        // forward the message to the recipient contact
        var socket = client.socket;
        
    }
    catch (err) {
        logger.error("onPeerMessage error %j", err);
    }
}


WebSocketSrv.prototype.find_contact = function (contact, callback) {
    try {
        if (!global.streemo_node) {
            throw new Error("peermsg error: streemo node is not connected");
        }
        
        global.streemo_node.find(contact, function (err, data) {
            if (err) {
                return callback(err);
            }
            
            try {
                var payload = wotmsg.getpayload(data);
                var contact_details = payload.data;
                callback(null, contact_details);
            }
            catch (e) {
                callback(e);
            }
        });

    }
    catch (err) {
        logger.error("find_contact error %j", err);
    }
}

WebSocketSrv.prototype.start = function (io) {
    var self = this;
    
    io.on('connection', function (socket) {
        
        var client = socket;
        
        socket.on("register_account", function (request, callback) {
            try {
                var account = request.account;
                var publickey = request.publickey;
                self.listOfClients.set(account, { publickey: publickey, socketid: socket.id, socket: socket });
                callback();
                logger.debug("ws register_account from: " + account);
            }
            catch (err) {
                logger.error(err);
            }
        });
        
        socket.on("put", function (request, callback) {
            try {
                if (!request.key || !request.value) {
                    return callback("invalid request parameter");
                }
                
                if (!global.streemo_node) {
                    return callback("error: 0x0110, the node is not initialized");
                }
                
                global.streemo_node.put(request.key, request.value, function (err) {
                    if (err) {
                        logger.error("node.put error: %j", err);
                        return callback(err);
                    }

                    callback(null);
                    
                    // broadcast the message
                    logger.debug("boradcast to ws peers");
                    socket.broadcast.emit("put", request);
                    
                    logger.debug("ws put for key: " + request.key);

                    // trye delete the message from the local storage if the message is a DELMSG type
                    if (request.key.indexOf("delmsg") > -1) {
                        global.streemo_node.delete_account_message(request, function (err) {
                            logger.error("Deleting message failed. error: %j", err);
                        });
                    }

                    //
                });
            }
            catch (err) {
                logger.error(err);
            }
        });
        
        socket.on("peermsg", function (request, callback) {
            try {
                var contact = request.contact;
                if (contact) {
                    var recipient = contact.name;
                    if (recipient) {
                        //logger.debug("ws peermsg from socket.id: " + socket.id);
                        var contactobj = self.listOfClients.get(recipient);
                        if (contactobj && contactobj.socket) {
                            contactobj.socket.emit("peermsg", request);                            
                            callback();
                            //logger.debug("ws peermsg sent to: " + recipient);
                        }
                        else {
                            //  do nothing, wait until the contact will try to find this account
                            callback("ws peermsg contact: " + recipient + " is not connected to web socket, message is not routed");
                        }
                    }
                }
            }
            catch (err) {
                logger.error(err);
            }
        });
        
        socket.on("find", function (key, callback) {
            try {
                if (!key) {
                    return callback("invalid key parameter");
                }
                
                if (!global.streemo_node) {
                    return callback("error: 0x0110, the node is not initialized");
                }
                
                global.streemo_node.find(key, function (err, msg) {
                    callback(err, msg);
                });
            }
            catch (err) {
                logger.error(err);
            }
        });
        
        socket.on("get_account_messages", function (account, msgkey, callback) {
            try {
                if (!account) {
                    return callback("invalid key parameter");
                }
                if (!msgkey) {
                    return callback("invalid msgkey parameter");
                }
                
                if (!global.streemo_node) {
                    return callback("error: 0x0110, the node is not initialized");
                }
                
                global.streemo_node.get_stored_messages(account, msgkey, function (err, count, msgs) {
                    var reply = "";
                    if (err) {
                        reply = { error: err };
                    }
                    else {
                        reply = { error: 0, count: count, messages: msgs };
                    }
                    callback(null, reply);
                });

            }
            catch (err) {
                logger.error(err);
            }
        });
        
        socket.on("disconnect", function () {
            try {
                var account;
                self.listOfClients.forEach(function (value, key) {
                    if (socket.id == value.socketid) {
                        account = key;
                    }
                });
                if (account) {
                    self.listOfClients.remove(account);
                }
            }
            catch (err) {
                logger.error(err);
            }
        });


    });
    
    logger.info("websocketsrv app srv initialized");
}

WebSocketSrv.prototype.init = function () {
    try {
        var srv = http.createServer(function (request, response) {
            // TODO handle this connection 
            logger.debug((new Date()) + ' received request for ' + request.url);
            response.writeHead(404);
            response.end();
        });
        srv.listen(32318, function () {
            logger.info((new Date()) + ' Server is listening on port 32318');
        });
        
        this.server = srv;
        
        var io = require('socket.io')(this.server);
        this.start(io);

    }
    catch (err) {
        logger.error(err);
    }
};





