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

Websocket implementation of the City of Osmio P2P network

*/

'use strict';

var async = require('async');
var logger = require('./logger');
var config = require('./config');
var Seeds = require('./seeds').default;
var auth = require('./auth');
var appevents = require("appevents");
var user = require('./user');
var appsrvc = require('./appsrvc');
var defs = require('./definitions');
var settings = require('./settings');
var socketio = require('socket.io-client');
var Buffer = require('buffer').Buffer;


const SOCKCONN_TIMEOUT = 8000;

function TransportWsNet(address, port) {

    this.protocol = streembit.globals.wsprotocol || "https";
    this.wssocket = 0;
    this.host = 0;
    this.port = port;
    this.address = address;
    this.connected = false;
    this.lastping = false;

    this.get_socket = function (callback) {
        try {
            var self = this;

            var socket = this.wssocket;
            if (socket) {
                return callback(null, socket);
            }          

            if (!this.address || !this.port) {
                return callback("cannot create WS socket if the address or port is missing");
            }

            this.create(this.address, this.port, function (err) {
                if (err) {
                    return callback(err);
                }

                socket = self.wssocket;
                if (!socket) {
                    return callback("failed to create contact socket");
                }

                var request = {
                    account: appsrvc.username,
                    publickey: appsrvc.publicKeyBs58,
                    pkhash: appsrvc.pubkeyhash,
                    transport: appsrvc.transport,
                    type: appsrvc.usertype
                };
                socket.emit('register_account', request, function (err) {
                    callback(null, socket);
                });
            });
        }
        catch (err) {
            callback(err);
        }
    }


    this.onMessage = function(data) {
    }

    this.onDisconnect = function (event) {
        logger.info('web socket is disconnected %s', (event || ""), null, true);       
    }

    this.onPerrMsg = function(data) {
        try {
            if (!data || !data.contact || !data.contact.name || data.contact.name != appsrvc.username || !data.message) {
                return logger.error("WS peer message error: invalid message context");
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
            appevents.peermsg(message.data);

        }
        catch (e) {
            logger.error("socket io message error: %j", e)
        }
    }

    this.onPutMsg = function (item) {
    }

    this.onContactDisconnect = function (account) {
        console.log("account: " + account + " ws disconnect");
        appevents.dispatch("oncontactevent", "contact-online", account, false);
    }

    this.create = function (host, port, callback) {
        var self = this;

        if (!host) {
            return callback("invalid WS host");
        }
        if (!port) {
            return callback("invalid WS port");
        }

        var server = this.protocol + "://" + host + ":" + port;
        logger.info("create web socket: " + server);        

        var socket = 0;
        var connected = false;

        var conntimer = setTimeout(
            function () {
                if (!self.wssocket || !connected) {
                    callback("web socket connect to " + host + " timed out");
                }
            },
            SOCKCONN_TIMEOUT
        );

        try {
            var params = {
                'reconnection': true,
                'reconnectionDelay': 5000,
                'reconnectionDelayMax': 6000,
                'reconnectionAttempts': 1000,
                "timeout": 10000
            };
            socket = socketio(server, params);
            if (!socket) {
                throw new Error("Error in creating web socket");
            }

            this.host = server;
        }
        catch (err) {
            return callback("Create ewb socket error: " + err.message);
        }        
     
        socket.on("connect_error", function (err) {
            streembit.notify.error("web socket connect error: %j", err, true);
        });

        socket.on("reconnect_failed", function (err) {
            streembit.notify.error("Web socket reconnect error", null, true);
        });

        socket.on('error', function (err) {
            streembit.notify.error("web socket error: %j", err, true);
        });

        socket.on('connect', function () {
            logger.debug('web socket is connected');

            connected = true;
            self.wssocket = socket;

            var request = {
                account: appsrvc.username,
                publickey: appsrvc.publicKeyBs58,
                pkhash: appsrvc.pubkeyhash,
                transport: appsrvc.transport
            };
            socket.emit('register_account', request, function (err) {
                clearTimeout(conntimer);

                self.connected = true;

                // call the callback
                callback();

                streembit.notify.info("WS connected socketid: " + socket.id, null, true);
            });            
        });

        socket.on('peermsg', this.onPerrMsg);
        socket.on('message', this.onMessage);
        socket.on('put', this.onPutMsg);
        socket.on('disconnect', this.onDisconnect);  
        socket.on('contact_disconnect', this.onContactDisconnect);  

        socket.on('reconnecting', function (number) {
            streembit.notify.info("WS reconnecting count: " + number, null, true);
        });  

        socket.on('reconnect', function (number) {
            streembit.notify.info("WS reconnected following " + number + " attempt", null, true);
        }); 

        //
    }

    this.init = function (callback) {
        var self = this;
        try {
            logger.debug("TransportWsNet init");
            if (!this.address || !this.port) {
                throw new Error("invalid WS host and port configuration");
            }

            this.wssocket = null;

            this.create(this.address, this.port,
                function (err) {
                    if (err) {
                        return callback(err);
                    }

                    // register

                    appsrvc.node = self;
                    appsrvc.address = self.address;
                    appsrvc.port = self.port;
                    appsrvc.transport = defs.TRANSPORT_WS;
                    appsrvc.net_connected = true;

                    callback();               
                }
            );
        }
        catch (e) {
            callback(e);
        }
    }

    this.disconnect = function (callback) {
        appsrvc.node = null;
        appsrvc.net_connected = false;
        callback();
    }

    this.validateContacts = function (callback) {
        callback();
    }

    this.put = function (key, value, callback) { 
        try {
            if (!appsrvc.username || !appsrvc.publickeyhex) {
                throw new Error("the account is not initialized");
            }

            var socket = this.get_socket(function (sockerr, socket) {
                if (!socket) {
                    throw new Error("web socket get error");
                }

                var request = { key: key, value: value, account: appsrvc.username, publickeyhex: appsrvc.publickeyhex };
                socket.emit("put", request, function (err) {
                    callback(err);
                });
            });            
        }
        catch (err) {
            callback(err);
        }
    }

    this.get = function (key, callback) {
        try {
            if (!callback || (typeof callback != "function"))
                throw new Error("invalid callback at node get");

            var socket = this.get_socket(function (sockerr, socket) {
                if (!socket) {
                    return callback("web socket does not exists");
                }

                //  For this public key upload message the key is the device name
                socket.emit("get", key, function (err, data) {
                    callback(err, data);
                });
            });            
        }
        catch (err) {
            callback(err);
        }
    }

    this.create_peermsg = function (data, notbuffer) {
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

    this.peer_send = function (contact, data) {
        try {
            var self = this;

            if (!data) {
                throw new Error("peer_send invalid data parameter");
            }
            if (!contact || !contact.address || !contact.port) {
                throw new Error("peer_send invalid contact parameter");
            }            

            this.get_socket(function (sockerr, socket) {
                if (sockerr) {
                    return logger.error("web socket get error:  %j", err);
                }
                if (!socket) {
                    return logger.error("web socket could not create for contact " + contact.name);
                }

                var message = self.create_peermsg(data, true);
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
                        return streembit.notify.error("WS peer message send error: %j", err, true);
                    }
                });

            });

        }
        catch (err) {
            logger.error("peer_send error:  %j", err);
        }
    }

    this.find_contact = function (account, callback) {
        var socket = this.get_socket(function (sockerr, socket) {
            if (!socket) {
                return callback("web socket does not exists");
            }

            socket.emit("find_contact", account, function (response) {
                if (!response) {
                    return callback("unspecified error from the WS hub.");
                }
                if (response.result == null || response.result != 0 || response.error) {
                    return callback(response.error || "unspecified error from the WS hub");
                }

                callback(null, response.contact);
            });
        });        
    }

}

module.exports = TransportWsNet;