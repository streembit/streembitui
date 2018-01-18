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

Websocket implementation of the Streembit P2P network

*/

'use strict';

const async = require('async');
const logger = require('./logger');
const config = require('./config');
const Seeds = require('./seeds').default;
const auth = require('./auth');
const appevents = require("appevents");
const user = require('./user');
const appsrvc = require('./appsrvc');
const defs = require('./definitions');
const settings = require('./settings');
const Buffer = require('buffer').Buffer;
const secrand = require('secure-random');
const utilities = require('utilities');

const SOCKCONN_TIMEOUT = 8000;

function TransportWsNet() {
    this.wssocket = 0;
    this.host = 0;
    this.port = 0;
    this.server = 0;
    this.connected = false;
    this.lastping = false;
    this.pendingmsgs = new Map();
    this.wstoken = null;
    // list of available WS peers
    this.wspeers = 0;

    this.onMessage = function (data) {
        try {
            //console.log("ws message ", event.data ? event.data : event);
            var response = JSON.parse(event.data);
            var error = response.error;

            if (response.txn) {
                if (!this.pendingmsgs.has(response.txn)) {
                    if (error) {
                        throw new Error("WebSocket onMessage received error " + error);
                    }
                    return;
                }

                var txn = response.txn;
                var pendingval = this.pendingmsgs.get(txn);
                var callback = pendingval.callback;

                // remove the pending txn
                this.pendingmsgs.delete(txn);

                if (!callback) {
                    if (error) {
                        throw new Error("WebSocket onMessage received error " + error);
                    }
                }
                else {
                    if (error) {
                        return callback(error);
                    }

                    callback(null, response.payload);
                }

                //
            }
            else {
                appevents.emit(
                    appevents.WS_MSG_RECEIVE,
                    response.payload
                );
            }

            //
        }
        catch (err) {
            logger.error("WebSocket onMessage error %j", err);
        }
    }


    this.get_socket = function (callback) {
        try {
            var self = this;

            var socket = this.wssocket;
            if (socket) {
                return callback(null, socket);
            }          

            if (!this.host || !this.port) {
                return callback("cannot create WS socket if the host or port is missing");
            }

            this.create(this.host, this.port, function (err) {
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

        var server = "ws://"  + host + ":" + port;
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
            try {
                socket = new WebSocket(server);
            }
            catch (err) {
                return callback("Create WebSocket error " + err.message);
            }

            this.server = server;
        }
        catch (err) {
            return callback("Create web socket error: " + err.message);
        }     

        if (!socket) {
            return callback("Create web socket object error");
        }    

        socket.onerror = (e) => {
            streembit.notify.error("Web socket error", null, true);
        };

        socket.onopen = (e) => {
            try {
                logger.debug('web socket is connected');

                connected = true;
                self.wssocket = socket;
                appsrvc.transport = defs.TRANSPORT_WS;

                var request = {
                    action: "register",
                    account: appsrvc.username,
                    publickey: appsrvc.publicKeyBs58,
                    pkhash: appsrvc.pubkeyhash,
                    transport: appsrvc.transport,
                    txn: secrand.randomBuffer(8).toString("hex")
                };

                this.pendingmsgs.set(
                    request.txn,
                    {
                        time: Date.now(),
                        callback: (err, payload) => {
                            if (err) {
                                return callback('web socket register failed at ' + (this.host || "WS handler") + ' error: ' + (err.message || err));
                            }

                            appsrvc.net_connected = true;
                            callback(null, payload); 

                            logger.info('web socket is registered at ' + host + ":" + port + " token: " + payload.token);  
                        }
                    });

                var message = JSON.stringify(request);
                socket.send(message);
            }
            catch (err) {
                logger.error("WebSocket onopen error %j", err);
            }
        };

        // Listen for messages
        socket.onmessage = (e) => {
            this.onMessage(e);
            //socket.on('peermsg', this.onPerrMsg);
            //socket.on('message', this.onMessage);
            //socket.on('put', this.onPutMsg);
            //socket.on('disconnect', this.onDisconnect);
            //socket.on('contact_disconnect', this.onContactDisconnect);  
        };

        //
    }

    this.monitor = function () {
        setInterval(
            () => {
                var current = Date.now();
                for (var [key, value] of this.pendingmsgs) {
                    var time = value.time;
                    if (current - time > 40000) {
                        this.pendingmsgs.delete(key);
                    }
                }
            },
            30000
        );
    }

    this.getwspeers= function (callback) {

        Seeds.load(
            (err, seeds) => {
                if (err) {
                    return err;
                }

                // get a random seed
                var seed = utilities.getrandomitem(seeds);
                if (!seed || !seed.address || !seed.port) {
                    return callback("invalid transport seed")
                }

                var url = 'http://' + seed.address + ":" + seed.port;

                var data = {
                    "type": "getwspeers"
                };

                $.ajax({
                    url: url,
                    type: "POST",
                    data: JSON.stringify(data),
                    contentType: "application/json; charset=utf-8",
                    cache: false,
                    success: function (response) {
                        try {
                            var obj = JSON.parse(response);
                            if (!obj || !obj.wspeers || !obj.wspeers.length) {
                                return callback("invalid wspeers list received");
                            }

                            callback(null, obj.wspeers);
                        }
                        catch (err) {
                            callback("getting wspeers error: " + err.message);
                        }

                        
                    },
                    error: function (request, status, error) {
                        callback(error ? error : "ajax POST error");
                    }
                });

            }
        );        
    }

    this.init = function (callback) {
        var self = this;

        this.wssocket = null;

        try {
            logger.debug("TransportWsNet init");

            // find out the available WS peer
            // must call a seed. Any seeds must have the available WS handler 
            this.getwspeers(
                (err, wspeers) => {
                    if (err) {
                        return callback(err);
                    }

                    if (!Array.isArray(wspeers) || !wspeers.length){
                        return callback("invalid wspeers list received");
                    }

                    this.wspeers = wspeers;

                    // use the the first one
                    this.host = wspeers[0].wshost;
                    this.port = wspeers[0].wsport;

                    this.monitor();

                    this.create(this.host, this.port,
                        (err, payload) => {
                            if (err) {
                                return callback(err);
                            }

                            self.wstoken = payload.token;
                            appsrvc.node = self;
                            appsrvc.address = self.host;
                            appsrvc.port = self.port;

                            callback();

                            //   
                        }
                    );
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

    this.put = function (key, value, cbfunc) { 
        try {
            if (!appsrvc.username || !appsrvc.publickeyhex) {
                throw new Error("the account is not initialized");
            }

            this.get_socket((sockerr, socket) => {
                if (!socket) {
                    return cbfunc("web socket get error");
                }

                var request = {
                    action: "put",
                    key: key,
                    value: value,
                    account: appsrvc.username,
                    publickeyhex: appsrvc.publickeyhex,
                    txn: secrand.randomBuffer(8).toString("hex")
                };

                this.pendingmsgs.set(
                    request.txn,
                    {
                        time: Date.now(),
                        callback: (err) => {
                            cbfunc(err);
                        }
                    }
                );

                var message = JSON.stringify(request);
                socket.send(message);

            });            
        }
        catch (err) {
            cbfunc(err);
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