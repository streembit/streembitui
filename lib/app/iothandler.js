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
Author: Streembit team
Copyright (C) Streembit 2018
-------------------------------------------------------------------------------------------------------------------------

*/


'use strict';

import appevents from "appevents"
import logger from 'applogger'
import IotHubs from './transport_iothubs'
import appsrvc from "appsrvc"
import errcodes from "errcodes"
import errhandler from "errhandler"
import database from 'database'
import transport from 'transport'
import async from 'async'
import peermsg from 'peermsg'
import utilities from "utilities"

let singleton = Symbol();
let singletonCheck = Symbol();

class IoTHandler {

    constructor(enforcer) {
        if (enforcer != singletonCheck) {
            throw "Cannot construct singleton";
        }

        this.iothubs = null;
    }

    static get instance() {
        if (!this[singleton]) {
            this[singleton] = new IoTHandler(singletonCheck);
        }
        return this[singleton];
    }

    iot_transport_monitor() {
        try {
            this.iothubs.check_connections();
        }
        catch (err) {
            logger.error("transport init error: %j", err);
        }
    }

    hostinfo(device, callback) {
        try {
            //debugger;
            const id = device.id;
            const publickey = device.publickey;

            if (!device) {
                throw new Error('Device not found by ID');
            }

            const key = `${device.pkhash}/${appsrvc.pubkeyhash}`;
            transport.netget(key, (err, result) => {
                //debugger;
                if (err) {
                    return callback('Transport get error: ' + err.msg);
                }
                if (!result) {
                    return callback('Device discovery data not found on the Streembit network');
                }

                try {
                    let msg;
                    if (result.value && typeof result.value === "string") {
                        msg = result.value;
                    }
                    else {
                        msg = result;
                    }

                    // parse the message
                    var payload = peermsg.getpayload(msg);
                    if (!payload || !payload.data || !payload.data.type || payload.data.type != peermsg.MSGTYPE.CAMSG) {
                        return callback("hostinfo error: invalid device payload");
                    }

                    const publickeyhex = utilities.bs58toHex(publickey);

                    var isspkey = payload.iss;
                    if (isspkey !== publickey) {
                        return callback("hostinfo error: public key mismatch with device: " + publickey + ", new request is required");
                    }

                    var decoded = peermsg.decode(msg, publickeyhex);
                    if (!decoded || !decoded.data.cipher) {
                        return callback("hostinfo error: invalid decoded contact payload");
                    }

                    var cipher = decoded.data.cipher;
                    var plaintext = peermsg.ecdh_decrypt(appsrvc.cryptokey, publickeyhex, cipher);
                    var connection = JSON.parse(plaintext);
                    if (!connection) {
                        return callback("hostinfo error: no connection details field is published for " + device.publickey);
                    }

                    var host = connection[peermsg.MSGFIELD.HOST];
                    if (!host) {
                        return callback("hostinfo error: no address field is published for " + device.publickey);
                    }

                    var port = connection[peermsg.MSGFIELD.PORT];
                    if (!port) {
                        return callback("hostinfo error: no port field is published for " + device.publickey);
                    }

                    var protocol = connection[peermsg.MSGFIELD.PROTOCOL];
                    if (!protocol) {
                        return callback("hostinfo error: no protocol field is published for " + device.publickey);
                    }

                    var localip = connection[peermsg.MSGFIELD.LOCALIP];
                    if (typeof localip !== 'string' || !/^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}$/.test(localip)) {
                        logger.info('local IPv4 of IoT device is invalid:', localip);
                        localip = false;
                    }

                    callback(null, host, port, protocol, localip);
                }
                catch (locerr) {
                    return callback("hostinfo error: " + locerr.message);
                }      

            });        
        }
        catch (excerr) {
            return callback("gethostinfo error: " + excerr.message);
        }        
    }

    getdevices(callback) {
        database.IoTDB.get_devices((err, result) => {
            if (err) {
                return streembit.notify.error(errhandler.getmsg(errcodes.UI_IOTHUB_INITIALIZE_DEVICES_LIST_ERR, err, true));
            }
            if (!result || !Array.isArray(result) || !result.length) {
                logger.debug("No IoT devices in the database");
                result = [];
            }

            callback(result);
        });
    }

    getdevice_byid(id, callback) {
        database.IoTDB.get_devices((err, devices) => {
            if (err) {
                return callback(err);
            }
            if (!devices && !Array.isArray(devices)) {
                callback()
            }
            else {
                var device;  
                devices.forEach(
                    (item) => {
                        if (item.id == id) {
                            device = item;
                        }
                    }
                );
                callback(null, device);
            }
        });
    }

    createhub(device, callback) {
        this.hostinfo(device, (err, host, port, protocol, localip) => {
            if (err) {
                return callback(err);
            }
            device.port = port;
            device.host = host;
            device.localip = localip;
            device.protocol = protocol;

            // call inithub
            this.iothubs.inithub(device, (err) => {
                callback(err);
            });
        });
    }

    createhub_byid(id, callback) {
        this.getdevice_byid(id, (err, device) => {
            this.createhub(device, (err) => {
                callback(err);
            });
        });
    }

    initdevices(devices, callback) {
        if (!devices || !Array.isArray(devices) || !devices.length){
            return callback();
        }

        async.each(
            devices,
            (device, done) => {
                this.createhub(device, (err) => {
                    if (err) {
                        streembit.notify.error("IoT handler createhub error: %j", err, true);
                    }
                    done();
                });
            },
            (err) => {
                callback(err);
            }
        );
    }

    init() {
        try {
            //debugger;
            logger.debug("IoTHandler init");

            // create connectins to IoT hubs
            this.iothubs = new IotHubs();

            this.getdevices((devices) => {
                // get the host info
                this.initdevices(devices, (err) => {
                    if (err) {
                        streembit.notify.error("IoT handler initdevices error: %j", err, true);
                    }
                    this.iothubs.listen();
                });                
            });

            //
        }
        catch (err) {
            logger.error("IoTHandler init error: %j", err);
        }
    }
}

export default IoTHandler.instance;

