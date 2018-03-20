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
import appsrvc from "appsrvc"
import errcodes from "errcodes"
import errhandler from "errhandler"
import tasks from "tasks"
import connections from "connections"

let singleton = Symbol();
let singletonCheck = Symbol();

class Transport {

    constructor(enforcer) {
        if (enforcer != singletonCheck) {
            throw "Cannot construct singleton";
        }

        this.iothubs = null;
    }

    static get instance() {
        if (!this[singleton]) {
            this[singleton] = new Transport(singletonCheck);
        }
        return this[singleton];
    }

    get_contact_transport (contact_address, contact_port, callback) {
        connections.get_contact_ws_connection(contact_address, contact_port, callback);
    }

    netsend(payload) {
        var callback;
        try {
            if (!payload) {
                return logger.error("invalid payload");
            }
            var key = payload.key, value = payload.value;
            callback = payload.callback;
            if (!callback || typeof callback !== "function") {
                return logger.error("invalid callback function");
            }
            if (!key || !value) {
                throw new Error(errhandler.getmsg(errcodes.UI_INVALID_PARAMS_KEYVAL_REQUIRED));
            }

            var conn = connections.appnet;
            conn.put(key, value, callback);

            //
        }
        catch (err) {
            if (callback) {
                callback(err);
            }
        }
    }


    netget(payload, callback) {
        try {
            if (!callback || typeof callback !== "function") {
                return logger.error("invalid callback function");
            };
            if (!payload) {
                throw new Error(errhandler.getmsg(errcodes.UI_INVALID_PARAMS_KEYVAL_REQUIRED));
            }

            var conn = connections.appnet;
            conn.get(payload, callback);

            //
        }
        catch (err) {
            if (callback) {
                callback(err);
            }
        }
    }

    peersend(payload) {
        var callback;
        try {
            if (!payload) {
                return logger.error("invalid payload");
            }
            var contact = payload.contact, data = payload.data;
            callback = payload.callback;
            if (!callback || typeof callback !== "function") {
                return logger.error("invalid callback function");
            }
            if (!contact || !contact.protocol || !contact.address || !contact.port) {
                // throw new Error("invalid contact object, port and host are required.");
                throw new Error(errhandler.getmsg(errcodes.UI_PORT_HOST_REQUIRED));
            }
    
            // select a transport based on the contact's protocol
            connections.get_ws_connection(contact.address, contact.port, (err, conn) => {
                if (err) {
                    callback(err);
                }

                conn.peer_send(contact, data);
                callback();
            });
        }
        catch (err) {
            if (callback) {
                callback(err);
            }
        }     
    }


    netstart() {
        try {
            var processed = false;

            var timer = setTimeout(
                () => {
                    if (!processed) {
                        // streembit.notify.error("Error in connecting Streembit, timed out");
                        streembit.notify.error(errhandler.getmsg(errcodes.UI_CONNECTING_STR_TIMEOUT));
                    }
                },
                30000
            );

            logger.debug("Initialize Streembit Network");
            connections.create_app_netclient(
                (err) => {
                    processed = true;
                    if (timer) {
                        clearTimeout(timer);
                    }
                    if (err) {
                        return streembit.notify.error(errhandler.getmsg(errcodes.UI_CONNECT_TONETWORK, err), null, true);
                    }

                    appsrvc.net_connected = true;
                    appsrvc.account_connected = true;
                    appevents.dispatch("account-init", appsrvc.username);
                    streembit.notify.success("The account has been initialized on the Streembit network.", null, true);

                    // signal the ONTRANSPORTINIT app event
                    appevents.emit(appevents.APPEVENT, appevents.TYPES.ONTRANSPORTINIT);
                }
            );
        }
        catch (err) {
            logger.error("transport Net start error: %j", err);
        }
    }

    init() {
        try {
            logger.debug("transport init");

            // create the Streembit P2P KAD connection
            this.netstart();

            // TODO start the connections monitor

            //
        }
        catch (err) {
            logger.error("transport init error: %j", err);

        }

    }
}

export default Transport.instance;

 