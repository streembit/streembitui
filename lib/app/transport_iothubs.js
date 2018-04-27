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
const appevents = require("appevents");
const appsrvc = require('./appsrvc');
const defs = require('./definitions');
const settings = require('./settings');
const Buffer = require('buffer').Buffer;
const secrand = require('secure-random');
const bs58check = require('bs58check');
const peermsg = require('peermsg');
const createHash = require('create-hash');
const createHmac = require('create-hmac');
const errcodes = require("errcodes");
const errhandler = require("errhandler");
const utilities = require("utilities");
const database = require("database");
const appconfig = require('../config.app.json!');

const SOCKCONN_TIMEOUT = 8000;

function IoTHub(host, port, id, publickey, devices) {
    this.protocol = appconfig.protocol !== 'https' ? defs.TRANSPORT_WS : defs.TRANSPORT_WSS;
    this.wssocket = 0;
    this.host = host;
    this.port = port;
    this.connected = false;
    this.authenticated = false;
    this.lastping = false;
    this.id = id;
    this.publickey = publickey;
    this.devices = devices;
    this.pendingmsgs = new Map();
    this.authtoken = 0;
    this.symmcryptkey = 0;

    this.onMessage = function (event) {
        try {
            //console.log("ws message ", event.data ? event.data : event);
            var response = JSON.parse(event.data);
            var error = response.error;

            if (error) {
                throw new Error(error);
            }

            if (response.payload && !response.payload.hasOwnProperty('authenticated')) {
                response.payload = peermsg.aes256decrypt(this.symmcryptkey, response.payload);
                response.payload = JSON.parse(response.payload);
            }

            if (response.txn) {
                if (!this.pendingmsgs.has(response.txn)) {
                    if (error) {
                        // throw new Error("WebSocket onMessage received error " + error);
                        throw new Error(errhandler.getmsg(errcodes.WS_ONMESSAGE_RECEIVED_ERR, error));
                    }
                }

                var txn = response.txn;
                var callback = this.pendingmsgs.get(txn);

                // remove the pending txn
                this.pendingmsgs.delete(txn);

                if (!callback) {
                    if (error) {
                        // throw new Error("WebSocket onMessage received error " + error);
                        throw new Error(errhandler.getmsg(errcodes.WS_ONMESSAGE_RECEIVED_ERR, error));
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
                console.log("WS_IOTDATARCV_EVENT");
                appevents.emit(
                    appevents.WS_IOTDATARCV_EVENT,
                    response.payload
                );
            }

            //
        }
        catch (err) {
            logger.error("WebSocket onMessage error %j", err);
        }
    }

    this.onDisconnect = function (event) {
        logger.info('web socket is disconnected %s', (event || ""), null, true);
    }

    this.send = function (message, callback) {
        if (!this.wssocket) {
            // return callback("The IoT hub is not connected via WS sockets.");
            return callback(errhandler.getmsg(errcodes.UI_IOTHUB_ISNT_CONN_VIA_WS));
        }

        var txn = secrand.randomBuffer(8).toString("hex");
        var hmac = createHmac('sha256', this.authtoken);
        hmac.update(txn);
        var hmacdigest = hmac.digest('hex');

        this.pendingmsgs.set(txn, callback);

        // TODO encryption changes
        /*
            do the symmetric encryption
            use the this.symmcryptkey which was created in auth
        */
        try {
            var cipher = peermsg.aes256encrypt(this.symmcryptkey, JSON.stringify(message));
        } catch (err) {
            throw new Error(err);
        }

        var data = {
            txn :txn,
            pkhash: appsrvc.pubkeyhash,
            hmacdigest: hmacdigest,
            cipher: cipher
        };

        var strmsg = JSON.stringify(data);
        this.wssocket.send(strmsg)
    }

    this.sendauth = function (message, callback) {
        if (!this.wssocket) {
            return;
        }

        var txn = secrand.randomBuffer(8).toString("hex");
        message.txn = txn;
        this.pendingmsgs.set(txn, callback);

        var strmsg = JSON.stringify(message);
        this.wssocket.send(strmsg)
    }

    this.open = function (callback) {
        var self = this;

        try {
            if (!this.host) {
                // return callback("invalid WS host");
                return callback(errhandler.getmsg(errcodes.WS_INVALID_HOST));
            }
            if (!this.port) {
                // return callback("invalid WS port");
                return callback(errhandler.getmsg(errcodes.WS_INVALID_PORT));
            }
            if (this.protocol != "ws" && this.protocol != "wss") {
                // return callback("invalid WS protocol");
                return callback(errhandler.getmsg(errcodes.WS_INVALID_PROTOCOL));
            }

            var wsserver = this.protocol + "://" + this.host + ":" + this.port;
            logger.debug("create web socket at " + wsserver);

            var conntimer = 0;
            var is_wsconnected = false;
            try {
                this.wssocket = new WebSocket(wsserver);
            }
            catch (err) {
                console.log("Create WebSocket error " + err.message);
                return callback(errhandler.getmsg(errcodes.WS_CREATE_ERR, err.message));
            }

            this.wssocket.onopen = (e) => {
                is_wsconnected = true;
                if (conntimer) {
                    clearTimeout(conntimer);
                }
                this.connected = true;
                callback();
            };

            // Listen for messages
            this.wssocket.onmessage = (e) => {
                this.onMessage(e);
            };

            this.wssocket.onerror = (e) => {
                var errmsg = "IoTHub WebSocket error at " + this.host + ":" + this.port + ".";
                if (e.data) {
                    errmsg += " Error: " + e.data;
                }
                streembit.notify.error(errmsg, null, true);
            };

            this.wssocket.onclose = (e) => {
                this.connected = false;
                logger.info('web socket is disconnected %s', (e || ""), true);
            };

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
            // return callback("Create websocket error: " + err.message);
            return callback(errhandler.getmsg(errcodes.WS_CREATE_ERR, err.message));
        }

    }
}


function IoTHubsHandler(address, port) {
    this.hubs = new Map();

    this.create_connection = function (id, publickey, port, host, devices, callback) {
        try {
            var conn = new IoTHub(host, port, id, publickey, devices );
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

    this.authenticate = function (id, devices, callback) {
        try {
            var hub = this.hubs.get(id);
            var hub_public_key = hub.publickey;
            var buffer = bs58check.decode(hub_public_key);
            var hub_public_key = buffer.toString("hex");

            logger.debug("Authenticate at IoT hub, hub publickey: %s", hub_public_key);

            var user_public_key = appsrvc.publicKeyBs58;

            var token = secrand.randomBuffer(32).toString("hex");
            var plain = {
                session_token: token,
                pkhash: appsrvc.pubkeyhash,
                devices: devices
            };

            var plaindata = JSON.stringify(plain);
            var cipher = peermsg.ecdh_encypt(appsrvc.cryptokey, hub_public_key, plaindata);

            var payload = {
                type: peermsg.MSGTYPE.IOTAUTH
            };
            payload[peermsg.MSGFIELD.CIPHER] = cipher;

            var msgid = secrand.randomBuffer(8).toString("hex");
            var jwtoken = peermsg.create_jwt_token(appsrvc.cryptokey, msgid, payload, null, null, user_public_key, null, hub_public_key);

            var message = {
                auth: true,
                jwt: jwtoken
            };

            hub.sendauth(message, function (err, response) {
                if (err) {
                    // return streembit.notify.error("IoT Hub responded authenticate error: %j", err, true);
                    return streembit.notify.error(errhandler.getmsg(errcodes.UI_IOT_RESPONDED_AUTHENTICATE_ERR, err, true));
                }

                // expecting response.authenticated == true
                if (!response || !response.authenticated) {
                    return logger.error("IoT Hub reponded authentication failed");
                }

                // set the security token
                hub.authtoken = token;
                hub.authenticated = true;
                streembit.notify.info("Authenticated at IOT Hub " + hub.host, null, true);

                // TODO create a symmetric encryption key here
                let sha1st = createHash("sha512").update(hub.authtoken).digest("hex");
                hub.symmcryptkey = createHash("sha512").update(sha1st).digest("hex");

                callback();
            });

            //
        }
        catch (err) {
            logger.error("IoT hub authenticate error: %j", err);
        }
    }

    this.inithub = function (device, callback) {
        if (!device || !device.id || !device.publickey || !device.port || !device.host) {
            return callback("IoT inithub invaluid device paramaters")
        }

        var id = device.id;
        var publickey = device.publickey;
        var devices = device.devices;
        logger.debug("init IoT Hub id: " + id);

        var devicearray = [];
        devicearray.push(id);
        devices.forEach(
            (device) => {
                devicearray.push(device.id);
            }
        );

        var publickey = device.publickey;
        var port = device.port;
        var host = device.host;

        if (appconfig.protocol !== 'https' && device.localip) {
            host = device.localip;
        }

        var self = this;

        var connect = function(id, publickey, port, host, devices) {
            self.create_connection(id, publickey, port, host, devices, (err) => {
                if (err) {
                    if (appconfig.protocol !== 'https' && device.localip) {
                        device.localip = false;
                        host = device.externalip || device.host;
                        return connect(id, publickey, port, host, devices)
                    } else if (device.externalip) {
                        device.externalip = false;
                        return connect(id, publickey, port, device.host, devices)
                    }

                    return streembit.notify.error(errhandler.getmsg(errcodes.UI_IOTHUBSHANDLER_INITHUB_ERR, err, true));
                }

                // initialize the session with the gateway
                self.authenticate(id, devicearray, () => {
                    database.get(database.IOTDEVICESDB, id).then(
                        function (dev) {
                            dev.port = port;
                            dev.host = host;
                            database.update(database.IOTDEVICESDB, dev).then(
                                function () {
                                    callback();
                                },
                                function (perr) {
                                    logger.error("CONTACTSDB put error %j", perr);
                                    callback(perr);
                                }
                            );
                        },
                        function (err) {
                            logger.error("IndexedDbStorage del error %j", err);
                            callback(err);
                        }
                    );
                });
            });
        }

        connect(id, publickey, port, host, devices);
    }

    this.check_connections = function (devices) {
        try {
            devices.forEach((item) => {
                var conn;
                if (this.hubs.has(item.id)) {
                    conn = this.hubs.get(item.id);
                }

                if (!conn || !conn.connected) {
                    try {
                        this.inithub(item.id, item);
                    }
                    catch (err) {
                        streembit.notify.error(errhandler.getmsg(errcodes.UI_IOTHUBSHANDLER_INITHUB_ERR, err, true));
                    }
                }
            });

            //
        }
        catch (e) {
            streembit.notify.error(errhandler.getmsg(errcodes.UI_IOTHUBSHANDLER_CHECK_CONN_ERR, e, true));
        }
    }

    this.listen = function () {
        appevents.addListener("iot-hub-send", (id, message, callback) => {
            //debugger;
            try {
                if (!this.hubs || !this.hubs.has(id)) {
                    // return callback("The IoT Hub is inactive.");
                    return callback(errhandler.getmsg(errcodes.UI_IOTHUB_IS_INACTIVE));
                }

                var msgevent = message.event;
                var hub = this.hubs.get(id);

                switch (msgevent) {
                    case defs.IOT_HUB_STATUS:
                        var response = {
                            authenticated: hub.authenticated
                        };
                        callback(null, response);
                        break;
                    default:
                        hub.send(message, callback);
                        break;
                }

                //
            }
            catch (err) {
                streembit.notify.error(errhandler.getmsg(errcodes.WS_HUB_SEND_ERR, err.message));
            }
        });
    }
}

module.exports = IoTHubsHandler;