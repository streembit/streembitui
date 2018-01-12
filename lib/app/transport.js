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

*/


'use strict';

import appevents from "appevents";
import logger from 'applogger';
import IotHubs from './transport_iothubs';
import streembitnet from "streembitnet";
import peercomm from "peercomm";

export default class {

    constructor() {
        this.iothubs = null;
    }

    transportscheck() {
        setInterval(() => {
            try {
                this.iothubs.check_connections();
            }
            catch (err) {
                logger.error("transport init error: %j", err);
            }
        },
        60000);
    }

    iotstart() {
        try {
            // create connection to IoT hubs
            this.iothubs = new IotHubs();
            this.iothubs.init();
            //
        }
        catch (err) {
            logger.error("transport IoT init error: %j", err);
        }
    }

    publish() {
        this.publish = function () {
            return new Promise((resolve, reject) => {
                var public_key = appsrvc.publicKeyBs58;
                var address = appsrvc.address;
                var port = appsrvc.port;
                var transport = appsrvc.transport;
                var type = appsrvc.usertype;
                var symcryptkey = appsrvc.connsymmkey;

                peercomm.publish_user(symcryptkey, appsrvc.pubkeyhash, public_key, transport, address, port, type, function (err) {
                    if (err) {
                        reject(err);
                    }
                    else {
                        resolve();
                    }
                });

            });
        };

    }

    netstart() {
        var timer = null;
        var processed = false;

        streembitnet.init()
            .then(() => {
                return this.publish();
            })
            .then(() => {
                processed = true;
                if (timer) {
                    clearTimeout(timer);
                }
                appsrvc.account_connected = true;
                appevents.dispatch("account-init", accobj.account);
                streembit.notify.success("The account has been initialized on the Streembit network.", null, true);

                // register
                streembitnet.register_at_ws();
                //
            })
        .catch(function (err) {
            // unblock the UI
            processed = true;
            if (timer) {
                clearTimeout(timer);
            }
            streembit.notify.error("Error in publishing user: %j", err);
        });

        timer = setTimeout(function () {
            if (!processed) {
                streembit.notify.error("Error in connecting Streembit, timed out");
            }
        }, 30000);

    }

    init() {
        try {
            logger.debug("transport init");

            // create the Streembit P2P KAD connection
            this.netstart();

            this.iotstart();

            // start the health check monitor
            this.transportscheck();

            //
        }
        catch (err) {
            logger.error("transport init error: %j", err);
        }
    }

}

 