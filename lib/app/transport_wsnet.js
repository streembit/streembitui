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
const errhandler = require("errhandler");
const errcodes = require("errcodes");

const SOCKCONN_TIMEOUT = 8000;

function TransportWsNet() {
    this.wssocket = 0;
    this.host = 0;
    this.port = 0;
    this.server = 0;
    this.isconnected = false;
    this.lastping = false;
    this.pendingmsgs = new Map();
    this.session_token = null;

    this.onMessage = function (message) {
        try {
            //console.log("ws message ", event.data ? event.data : event);
            //var message = JSON.parse(event.data);
            var error = message.error;

            if (message.txn) {
                // txn exists, this is a response 
                if (!this.pendingmsgs.has(message.txn)) {
                    if (error) {
                        throw new Error("WebSocket onMessage received error " + error);
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
                appevents.emit( appevents.WS_MSG_RECEIVE, message );
            }

            //
        }
        catch (err) {
            logger.error("WebSocket onMessage error, %j", err);
        }
    };

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

            this.create(this.host, this.port, 
                (err, payload) => {
                    if (!err && payload.token) {
                        this.monitor();
                    }

                    callback(err);
                }
            );
        }
        catch (err) {
            callback(err);
        }
    };


    this.onDisconnect = function (event) {
        logger.info('web socket is disconnected %s', (event || ""), null, true);       
    };

    this.onPutMsg = function (item) {
    };

    this.onContactDisconnect = function (account) {
        console.log("account: " + account + " ws disconnect");
        appevents.dispatch("oncontactevent", "contact-online", account, false);
    };

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
                this.wssocket = socket;
                appsrvc.transport = defs.TRANSPORT_WS;

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

                            this.session_token = payload.token;
                            
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

        socket.onclose = (e) => {
            logger.error("WebSocket has been closed");
            this.update_connection_status(false);
        };

        // Listen for messages
        socket.onmessage = (e) => {
            var message = JSON.parse(e.data);
            this.onMessage(message);
        };
    };

    this.monitor = function () {
        setInterval(
            () => {
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
            },
            5000
        );
    };

    this.socketPingPong = function () {
        try {
            if (this.isconnected) {
                this.isconnected = navigator.onLine;
                if (this.isconnected) {
                    return;
                }

                this.update_connection_status(false);
            }
            if (this.isconnected === false) {
                // call create
                // on fail break the interval
                console.info('Retrying to create...');
                return this.create(this.host, this.port, (err, payload) => {
                    if (err || !payload.token) {
                        return;
                    }

                    this.session_token = payload.token;
                    this.update_connection_status(true, this.host, this.port);
                });
            }

            var socket = this.wssocket;
            var start;

            var request = {
                action: "ping",
                pkhash: appsrvc.pubkeyhash,
                token: this.session_token,
                txn: this.getTxn()
            };

            this.pendingmsgs.set(
                request.txn,
                {
                    time: Date.now(),
                    callback: (err, payload) => {
                        if (err) {
                            return streembit.notify.error('failed to send ping with error: ' + (err.message || err), null, true);
                        }

                        var complete = Date.now();
                        logger.debug('Having pong: ' + payload.pong + ", query elapsed time: " + (complete-start) + " ms");

                        this.isconnected = payload.pong ? true : false;
                    }
                });           

            logger.debug("Sending ping ...");
            start = Date.now();
            socket.send(JSON.stringify(request));
        }
        catch (err) {
            streembit.notify.error('ping send error: ' + err.message, null, true);
        }
    };

    this.getwspeers_fromseeds = function (callback) {
        Seeds.load(
            (err, seeds) => {
                if (err) {
                    return err;
                }

                // get a random seed
                var seed = utilities.getrandomitem(seeds);
                if (!seed || !seed.host || !seed.port) {
                    return callback("invalid transport seed")
                }

                var url = 'http://' + seed.host + ":" + seed.port;

                var data = {
                    "type": "getwspeers"
                };

                $.ajax({
                    url: url,
                    type: "POST",
                    data: JSON.stringify(data),
                    cache: false,
                    success: function (response) {
                        try {
                            var obj = JSON.parse(response);
                            if (obj.error) {
                                return callback(obj);
                            }

                            if (!obj || !obj.wspeers || !obj.wspeers.length) {
                                return callback("invalid wspeers list received");
                            }

                            callback(null, obj.wspeers);
                        }
                        catch (err) {
                            callback("get wspeers error: " + err.message);
                        }
                    },
                    error: function (request, status, error) {
                        callback("getwspeers ajax POST failed " + ((error + "") || ""));
                    }
                });
            }
        );
    };

    this.init = function (callback) {
        var self = this;

        this.wssocket = null;

        try {
            logger.debug("TransportWsNet init");

            var fromseeds = function(cb) {
                // find out the available WS peer
                // must call a seed. Any seeds must have the available WS handler 
                self.getwspeers_fromseeds(
                    (err, wspeers) => {
                        if (err) {
                            return callback(err);
                        }

                        if (!Array.isArray(wspeers) || !wspeers.length) {
                            return callback("invalid wspeers list received");
                        }

                        // use the the first one
                        self.host = wspeers[0].wshost;
                        self.port = wspeers[0].wsport;

                        cb();
                    }
                );
            }
           
            var fromcontact = function(cb) {
                 // use this function when the host and port was set upon the initialization of this class
                // that happens when we want to connect to a contact WS peer
                if (!self.host || !self.port) {
                    return callback("invalid host and port setting from contact");
                }

                // the host and port already exists, nothing to do
                cb();
            }

            const get_wspeer_params = (this.host && this.port) ? fromcontact : fromseeds;

            get_wspeer_params(
                (err) => {
                    if (err) {
                        return callback(err);
                    }

                    this.create(this.host, this.port,
                        (err, payload) => {
                            if (!err && payload.token) {
                                this.monitor();
                            }

                            callback(err);
                        }
                    );
                }
            );

        }
        catch (e) {
            callback(e);
        }
    };

    this.update_lastseed = function (err) {
        settings.lastseed = err ? {} : { host: this.host, port: this.port };
    };

    this.update_connection_status = function(status, host, port) {
        appevents.dispatch('on-connection-status', status, host, port);
        this.isconnected = status;
    };

    this.disconnect = function (callback) {
        appsrvc.node = null;
        appsrvc.net_connected = false;
        callback();
    };

    this.validateContacts = function (callback) {
        callback();
    };

    this.put = function (key, value, cbfunc) { 
        try {
            if (!appsrvc.username || !appsrvc.publickeyhex) {
                throw new Error("the account is not initialized");
            }

            this.get_socket((sockerr, socket) => {
                try {
                    if (sockerr) {
                        return cbfunc(sockerr);
                    }

                    if (!socket) {
                        return cbfunc("web socket get error");
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
                }
                catch (e) {
                    cbfunc(e);
                }

            });            
        }
        catch (err) {
            cbfunc(err);
        }
    };

    this.get = function (key, cbfunc) {
        try {
            if (!cbfunc || (typeof cbfunc != "function"))
                throw new Error("invalid callback at node get");

            var socket = this.get_socket((sockerr, socket) => {
                try {
                    if (sockerr) {
                        return cbfunc(sockerr);
                    }

                    if (!socket) {
                        return cbfunc("web socket does not exists");
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
                catch (e) {
                    cbfunc(e);
                }
            });            
        }
        catch (err) {
            cbfunc(err);
        }
    };

    this.peer_send = function (contact, data) {
        try {
            var self = this;

            if (!data) {
                throw new Error("invalid data parameter");
            }
            if (!contact) {
                throw new Error("invalid contact object");
            }
            if (!contact.address || !contact.port) {
                throw new Error("invalid contact transport");
            }
            if (!contact.pkeyhash) {
                throw new Error("invalid contact pkeyhash");
            }

            this.get_socket((sockerr, socket) => {
                try {
                    if (sockerr) {
                        return cbfunc(sockerr);
                    }

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
                                    streembit.notify.error(msg, null, true);
                                }
                            }
                        }
                    );

                    var message = JSON.stringify(request);
                    socket.send(message);

                    //
                }
                catch (e) {
                    streembit.notify.error("WS peer_send error: %j", e, true);
                }
            });

        }
        catch (err) {
            logger.error("WS peer_send error:  %j", err);
        }
    };


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
}

module.exports = TransportWsNet;
