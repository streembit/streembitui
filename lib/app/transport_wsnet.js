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
const auth = require('./auth');
const appevents = require("appevents");
const user = require('./user');
const appsrvc = require('./appsrvc');
const defs = require('./definitions');
const settings = require('./settings');
const Buffer = require('buffer').Buffer;
const bs58check = require('bs58check');
const secrand = require('secure-random');
const errhandler = require("errhandler");
const errcodes = require("errcodes");
const tasks = require("tasks").default;
const peermsg = require("peermsg");
const database = require("database");

const SOCKCONN_TIMEOUT = 10000;

function TransportWsNet(host, port) {
    this.wssocket = 0;
    this.host = host;
    this.port = port;
    this.protocol = "";
    this.server = 0;
    this.isconnected = false;
    this.lastping = false;
    this.pendingmsgs = new Map();
    this.session_token = null;
    this.connection_attempts = 0; 
    this.last_connection_event = 0; 
    this.iserror = 0;
    this.isclosed = 0;

    this.onMessage = function (message) {
        try {
            this.last_connection_event = Date.now();
            var error = message.error;

            if (message.txn) {
                // txn exists, this is a response 
                if (!this.pendingmsgs.has(message.txn)) {
                    if (error) {
                        // throw new Error("WebSocket onMessage received error " + error);
                        throw new Error(errhandler.getmsg(errcodes.WS_ONMESSAGE_RECEIVED_ERR) +error);
                    }
                    return;
                }

                var txn = message.txn;
                var pendingval = this.pendingmsgs.get(txn);
                var callback = pendingval.callback;

                // remove the pending txn
                this.pendingmsgs.delete(txn);

                if (!callback) {
                    if (error) {
                        var errmsg = "Error code: " + error + ".";
                        if (message.msg) {
                            errmsg += "Reason: " + message.msg;
                        }
                        throw new Error(errmsg);
                    }
                }
                else {
                    if (error) {
                        // return the message as it includes the error
                        // the caller must handle this error
                        return callback(message);
                    }

                    callback(null, message.payload);
                }

                //
            }
            else {
                // PEERMSG
                appevents.emit(appevents.WS_MSG_RECEIVE, message);
                appevents.send(appevents.TYPES.ONWSMSGRECEIVE, message);
            }

            //
        }
        catch (err) {
            logger.error("WebSocket onMessage error, %j", err);
        }
    };

    this.create = function (host, port, callback) {
        var self = this;

        if (!host) {
            // return callback("invalid WS host");
            return callback(errhandler.getmsg(errcodes.WS_INVALID_HOST));
        }
        if (!port) {
            // return callback("invalid WS port");
            return callback(errhandler.getmsg(errcodes.WS_INVALID_PORT));
        }

        var protocol = streembit.globals.protocol == "https" ? "wss" : "ws";
        var server = protocol + "://"  + host + ":" + port;
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
            socket = new WebSocket(server);
            if (!socket) {
                // return callback("Create web socket object error");
                return callback(errhandler.getmsg(errcodes.WS_CREATE_OBJECT_ERR));
            }   
            this.server = server;
        }
        catch (err) {
            // return callback("Create WebSocket error " + err.message);
            return callback(errhandler.getmsg(errcodes.WS_CREATE_ERR) + err.message);
        }     
        
        socket.onerror = (e) => {
            this.iserror = true;
            // streembit.notify.error("Web socket error", null, true);
            streembit.notify.error(errhandler.getmsg(errcodes.WS_ERR, null, true));
        };

        socket.onopen = (e) => {
            try {
                logger.debug('web socket is connected');

                connected = true;
                this.wssocket = socket;               

                this.isconnected = true;
                this.protocol = protocol;

                var request = {
                    action: "register",
                    account: appsrvc.username,
                    publickey: appsrvc.publicKeyBs58,
                    pkhash: appsrvc.pubkeyhash,
                    transport: appsrvc.transport,
                    txn: this.getTxn()
                };

                this.pendingmsgs.set(
                    request.txn,
                    {
                        time: Date.now(),
                        callback: (err, payload) => {
                            if (err) {
                                // add the host to the error info field
                                err.info = "WS transport " + host + ":" + port;
                                return callback(err);
                            }

                            this.session_token = payload;
                            callback(null, payload); 

                            logger.info('web socket is registered at ' + host + ":" + port + " token: " + payload);  
                        }
                    });

                var message = JSON.stringify(request);
                socket.send(message);
            }
            catch (err) {
                logger.error("WebSocket onopen error %j", err);
            }
        };

        socket.onclose = (e) => {
            this.isconnected = false;
            this.isclosed = true;
            logger.debug("WebSocket " + this.host + ":" + this.port + " has been closed");            
        };

        // Listen for messages
        socket.onmessage = (e) => {
            var message = JSON.parse(e.data);
            this.onMessage(message);
        };
    };

    this.monitor = function () {
        // start the connection status monitor
        try {
            var taskname = "ws_check_connections_" + this.host + "_" + this.port;
            tasks.addTask(taskname, 5000, () => {
                try {
                    // execute the heartbeat monitor
                    this.socketPingPong();

                    var current = Date.now();
                    for (var [key, value] of this.pendingmsgs) {
                        var time = value.time;
                        if (current - time > 35000) {
                            var callback = value.callback;
                            if (callback) {
                                callback("WS request txn " + key + " timed out");
                            }
                            this.pendingmsgs.delete(key);
                        }
                    }
                }
                catch (err) {
                    logger.error("WebSocket monitor callback error %j", err);
                }

            });
        }
        catch (err) {
            logger.error("WebSocket monitor error %j", err);
        }       
    };

    this.socketPingPong = function () {
        // TODO, potentially Ping from here to the CLI WS peer
        var state;
        if (!this.wssocket || (this.wssocket && (!this.wssocket.readyState || this.wssocket.readyState != 1))) {
            console.log("WS socket state is not OPEN");
            this.isconnected = false;
        }
    };

    this.init = function (callback) {
        if (!this.host || !this.port) {
            // return callback("initializaing WebSocket failed, invalid host and port");
            return callback(errhandler.getmsg(errcodes.WS_INITIALIZING_FAILED_INVAL_HOST_PORT))
        }

        var self = this;
        this.wssocket = null;        
        this.connection_attempts++;

        try {
            logger.debug("TransportWsNet init at " + this.host + ":" + this.port);

            this.create(this.host, this.port,
                (err, payload) => {
                    if (!err && payload) {
                        try {
                            const jwt = peermsg.getpayload(payload);
                            const jwt_obj = JSON.parse(jwt.data);

                            const bs58buffer = bs58check.decode(jwt.iss);
                            const public_key = bs58buffer.toString("hex");
                            const jwt_decode = peermsg.decode(payload, public_key);
                            if (!jwt_decode || !jwt_obj.sign) {
                                this.wssocket.close();
                                // return callback("Socket signature validation failed");
                                return callback(errhandler.getmsg(errcodes.WS_SIGNATURE_VALID_FAILED));
                            }

                            const data = {
                                key: Date.now(),
                                host: this.host,
                                port: this.port,
                                sign: jwt_obj.sign
                            };
                            database.update(database.WSCONNLOG, data).then(
                                () => {
                                    this.monitor();
                                    callback(null);
                                },
                                err => callback(err)
                            );
                        } catch (err) {
                            callback(err);
                        }
                    } else {
                        // callback(err || "Invalid response from server");
                        callback(err || errhandler.getmsg(errcodes.UI_INVALID_RESPONSE_FROM_SERVER));
                    }
                }
            );      
        }
        catch (e) {
            callback(e);
        }
    };

    this.disconnect = function (callback) {
        callback();
    };

    this.put = function (key, value, cbfunc) { 
        try {
            if (!appsrvc.username || !appsrvc.publickeyhex) {
                // throw new Error("the account is not initialized");
                throw new Error(errhandler.getmsg(errcodes.WS_ONMESSAGE_RECEIVED_ERR));
            }

            var socket = this.wssocket;
            if (!socket) {
                // return cbfunc("web socket does not exists");
                return cbfunc(errhandler.getmsg(errcodes.WS_DOESNT_EXIST));
            }

            var request = {
                action: "dhtput",
                key: key,
                value: value,
                account: appsrvc.username,
                publickeyhex: appsrvc.publickeyhex,
                txn: this.getTxn()
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

            //
        }
        catch (err) {
            cbfunc(err);
        }
    };

    this.get = function (key, cbfunc) {
        try {
            if (!cbfunc || (typeof cbfunc != "function"))
                // throw new Error("invalid callback at node get");
                throw new Error(errhandler.getmsg(errcodes.UI_INVALID_CB_AT_NODE_GET));

            var socket = this.wssocket;
            if (!socket) {
                // return cbfunc("web socket does not exists");
                return cbfunc(errhandler.getmsg(errcodes.WS_DOESNT_EXIST));
            }

            var request = {
                action: "dhtget",
                key: key,
                txn: this.getTxn()
            };

            this.pendingmsgs.set(
                request.txn,
                {
                    time: Date.now(),
                    callback: (err, payload) => {
                        cbfunc(err, payload);
                    }
                }
            );

            var message = JSON.stringify(request);
            socket.send(message);

            logger.debug('dhtget sent txn: ' + request.txn + " key: " + key);                          
        }
        catch (err) {
            cbfunc(err);
        }
    };

    this.peer_send = function (contact, data) {
        try {
            var self = this;

            if (!data) {
                // throw new Error("invalid data parameter");
                throw new Error(errhandler,getmsg(errcodes.UI_INVALID_DATA_PARAMS));
            }
            if (!contact) {
                // throw new Error("invalid contact object");
                throw new Error(errhandler.getmsg(errcodes.UI_INVALID_CONTACT_OBJECT));
            }
            if (!contact.address || !contact.port) {
                // throw new Error("invalid contact transport");
                throw new Error(errhandler.getmsg(errcodes.UI_INVALID_CONTACT_TRANSPORT));
            }
            if (!contact.pkeyhash) {
                // throw new Error("invalid contact pkeyhash");
                throw new Error(errhandler.getmsg(errcodes.UI_INVALID_CONTACT_PKEYHASH));
            }      

            var socket = this.wssocket;
            if (!socket) {
                throw new Error("web socket with " + contact.address + ":" + contact.port + " does not exists for contact");
            }

            //var peermsg = self.create_peermsg(data, true);
            var request = {
                action: "peermsg",
                txn: this.getTxn(),
                contact: {
                    pkhash: contact.pkeyhash
                },
                payload: data
            };

            this.pendingmsgs.set(
                request.txn,
                {
                    time: Date.now(),
                    callback: (err, payload) => {
                        if (err) {
                            err.info = "contact " + contact.name + " cannot reached at WS host " + self.host + ":" + self.port;
                            var msg = errhandler.getmsg(errcodes.WS_PEERCOMM, err);
                            if (err.error === 0x4007) {
                                streembit.notify.info(msg, null, true);
                                return appevents.dispatch("oncontactevent", "on-contact-warning", contact.name, msg);
                            }

                            streembit.notify.error(msg, null, true);
                        }
                    }
                }
            );

            var message = JSON.stringify(request);
            socket.send(message);

        }
        catch (err) {
            logger.error("WS peer_send error:  %j", err);
        }
    };

    this.ping = function (callback) {
        try {
            var self = this;
            var socket = this.wssocket;
            if (!socket) {
                throw new Error("web socket with " + contact.address + ":" + contact.port + " does not exists for contact");
            }

            //var peermsg = self.create_peermsg(data, true);
            var request = {
                action: "ping",
                txn: this.getTxn(),
                token: this.session_token,
                pkhash: appsrvc.pubkeyhash
            };

            this.pendingmsgs.set(
                request.txn,
                {
                    time: Date.now(),
                    callback: (err, payload) => {
                        if (err) {
                            return callback(false);
                        }
                        var isalive = payload && payload.pong && payload.pong == 1 ? true : false;
                        callback(isalive );
                    }
                }
            );

            var message = JSON.stringify(request);
            socket.send(message);

        }
        catch (err) {
            logger.error("WS peer_send error:  %j", err);
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
    };

    this.getTxn = function () {
        return secrand.randomBuffer(8).toString("hex");
    };

    this.dispose = function () {
        var taskname = "ws_check_connections_" + this.host + "_" + this.port;
        tasks.deleteTask(taskname);
    };

}

module.exports = TransportWsNet;
