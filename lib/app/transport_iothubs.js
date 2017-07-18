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
var appevents = require("appevents");
var appsrvc = require('./appsrvc');
var defs = require('./definitions');
var settings = require('./settings');
var socketio = require('socket.io-client');
var Buffer = require('buffer').Buffer;

const SOCKCONN_TIMEOUT = 8000;

function IoTHub(host, port, protocol, id, publickey, devices) {

    this.protocol = protocol || "ws"; // ws or wss (wss for WS over TLS)
    this.wssocket = 0;
    this.host = host;
    this.port = port;
    this.connected = false;
    this.lastping = false;
    this.id = id;
    this.publickey = publickey;
    this.devices = devices;


    this.onMessage = function (event) {
    }

    this.onError = function (event) {
        logger.error("IoTHub WebSocket error %j", evt.data);
    }

    this.onDisconnect = function (event) {
        logger.info('web socket is disconnected %s', (event || ""), null, true);
    }


    this.open = function (callback) {
        var self = this;

        try {
            if (!this.host) {
                return callback("invalid WS host");
            }
            if (!this.port) {
                return callback("invalid WS port");
            }
            if (this.protocol != "ws" && this.protocol != "wss") {
                return callback("invalid WS protocol");
            }

            var wsserver = "ws://" + this.host + ":" + this.port;
            logger.debug("create web socket at " + wsserver);

            var conntimer = 0;
            var is_wsconnected = false;
            this.wssocket = new WebSocket(wsserver);

            this.wssocket.onopen = (e) => {
                is_wsconnected = true;                
                if (conntimer) {
                    clearTimeout(conntimer);
                }
                this.connected = true;
                callback();
            };         

            // Listen for messages
            this.wssocket.onmessage = this.onMessage;
            this.wssocket.onerror = this.onError;
            this.wssocket.onclose = this.onDisconnect;

            conntimer = setTimeout(
                () => {
                    if (!is_wsconnected) {
                        return callback("web socket connect to " + this.host + " timed out");
                    }

                    this.connected = true;
                },
                SOCKCONN_TIMEOUT
            );

            //
        }
        catch (err) {
            return callback("Create websocket error: " + err.message);
        }

    }
}


function IoTHubsHandler(address, port) {

    this.hubs = new Map();

    this.gethostinfo = function (id, host, port, callback) {
        //TODO get the host infor from hte DHT
        callback(null, host, port);
    }

    this.create_connection = function (id, publickey, port, host, protocol, devices, callback) {
        try {
            var conn = new IoTHub(host, port, protocol, id, publickey, devices);
            conn.open((err) => {
                if (err) {
                    return callback(err);
                }

                this.hubs.set(id, conn);
                callback();
            });
        }
        catch (err) {
            callback(err);
        }
    }

    this.inithub = function (id, device) {
        logger.debug("init IoT Hub id: " + id + " host: " + device.host + " port: " + device.port);

        var publickey = device.publickey;
        var protocol = device.protocol;
        var devices = device.devices;

        async.waterfall(
            [
                (callback) => {
                    this.gethostinfo(id, device.host, device.port, callback)
                },
                (host, port, callback) => {
                    this.create_connection(id, publickey, port, host, protocol, devices, callback);
                }            
            ],
            (err) => {
                if (err) {
                    logger.error("IoTHubsHandler inithub() error %j", err);
                }

            }
        );
    }

    this.init = function (callback) {
        var self = this;
        try {
            logger.debug("IoTHubsHandler init");

            // get all iot hubs from the database 
            // mock
            var dbhubs = new Map();
            dbhubs.set(
                "0013a20041679c00",
                {
                    publickey: "3e3LURL47XwiGYL4wR5smZ7ZJzLNVNpyETLpHAj3e1S6kML8gVeoj7kA6oR8noVHu8QdZpkaQWTGiQrh4RgQvy3RMjwf4q",
                    port: 32318,
                    host: "192.168.1.76",
                    protocol: "ws",
                    devices: [
                        {
                            "type": 2,
                            "id": "000d6f000bbc50b6"
                        }
                    ]
                }
            );

            for (var [key, value] of dbhubs) {
                this.inithub(key, value);
            }


            /*
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
            */
        }
        catch (e) {
            logger.error("IoTHubsHandler init error %j", e);
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

module.exports = IoTHubsHandler;