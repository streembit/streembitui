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
import appsrvc from "appsrvc";
import errcodes from "errcodes";
import errhandler from "errhandler";

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
        return new Promise((resolve, reject) => {
            try {
                var public_key = appsrvc.publicKeyBs58;
                var address = appsrvc.address;
                var port = appsrvc.port;
                var transport = appsrvc.transport;
                var type = appsrvc.usertype;
                var symcryptkey = appsrvc.connsymmkey;
                var pkeyhash = appsrvc.pubkeyhash;

                peercomm.publish_user(symcryptkey, pkeyhash, public_key, transport, address, port, type, (err) => {
                    if (err) {
                        reject(err);
                    }
                    else {
                        resolve();
                    }
                });
            }
            catch (e) {
                reject(e);
            }
        });       
    }

    netstart() {
        var timer = null;
        var processed = false;

        streembitnet.init()
            .then(() => {
                processed = true;
                if (timer) {
                    clearTimeout(timer);
                }

                appsrvc.net_connected = true;
                appsrvc.account_connected = true;
                appevents.dispatch("account-init", appsrvc.username);
                streembit.notify.success("The account has been initialized on the Streembit network.", null, true);

                //
            })
            .catch((err) => {
                // unblock the UI
                processed = true;
                if (timer) {
                    clearTimeout(timer);
                }
                streembit.notify.error(errhandler.getmsg(errcodes.UI_CONNECT_TONETWORK, err ));
            });

        timer = setTimeout(function () {
            if (!processed) {
                streembit.notify.error("Error in connecting Streembit, timed out");
            }
        }, 30000);

    }

    on_peer_message(message) {
        try {
            if (!message || !message.contact || !message.contact.pkhash || !message.payload ) {
                return logger.error("WS peer message error: invalid message context");
            }

            if (message.contact.pkhash != appsrvc.pubkeyhash ) {
                return logger.error("WS peer message error: invalid message contact");
            }

            //var payload = JSON.parse( message.payload);
            if (!message.payload) {
                return streembit.notify.error("WS peer message error: invalid message payload");
            }

            //if (!payload.data) {
            //    return streembit.notify.error("WS peer message error: invalid message data at web socket peermsg");
            //}

            //  raise an application event that a peer sent a message
            appevents.peermsg(message.payload);

        }
        catch (e) {
            logger.error("WS peer message error: %j", e)
        }
    }

    on_message() {
        try {
            appevents.on(
                appevents.WS_MSG_RECEIVE,
                (message) => {
                    if (message && message.type) {
                        switch (message.type) {
                            case "PEERMSG":
                                this.on_peer_message(message);
                                break;
                            default:
                                //TODO
                                break;
                        }
                    }
                }
            );
        }
        catch (err) {
            logger.error("transport on_message error: %j", err);
        }
    }

    init() {
        try {
            logger.debug("transport init");

            // create the Streembit P2P KAD connection
            this.netstart();

            this.iotstart();

            // start the health check monitor
            this.transportscheck();

            this.on_message();

            //
        }
        catch (err) {
            logger.error("transport init error: %j", err);
        }
    }

}

 