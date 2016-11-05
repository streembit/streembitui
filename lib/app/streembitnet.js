/*

This file is part of Streembit application. 
Streembit is an open source project to create a real time communication system for humans and machines. 

Streembit is a free software: you can redistribute it and/or modify it under the terms of the GNU General Public License 
as published by the Free Software Foundation, either version 3.0 of the License, or (at your option) any later version.

Streembit is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty 
of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU General Public License for more details.

You should have received a copy of the GNU General Public License along with Streembit software.  
If not, see http://www.gnu.org/licenses/.
 
-------------------------------------------------------------------------------------------------------------------------
Author: Tibor Zsolt Pardi 
Copyright (C) 2016 The Streembit software development team
-------------------------------------------------------------------------------------------------------------------------

*/

'use strict';


(function () {

    var appevents = require("appevents");
    var logger = require('./logger');
    var TransPeerNet = require('./transport_peernet');
    var TransWsNet = require('./transport_wsnet.js');
    var defs = require('./definitions');
    var settings = require('./settings');
    var appsrvc = require('./appsrvc');
    var uihandler = require('./uihandler');

    var peernet = {};

    peernet.netclient = null;

    Object.defineProperty(peernet, 'client', {
        get: function () {
            return peernet.netclient;
        },
        set: function (value) {
            peernet.netclient = value;
        }
    })

    function netfactory(transport) {
        if ((streembit && streembit.globals && streembit.globals.nwmode) &&
            transport == defs.TRANSPORT_TCP) {
            return new TransPeerNet();
        }
        else {
            return new TransWsNet();
        }
    }

    peernet.getseeds = function () {
        if (!peernet.netclient) {
            return [];
        }
        else {
            return peernet.netclient.getseeds();
        }
    }

    peernet.connect = function (transport, callback) {
        appsrvc.net_connected = false;

        peernet.netclient = netfactory(transport);
        peernet.netclient.init(function (err) {
            callback(err);
        });
    }

    peernet.init = function () {
        peernet.netclient = null;
        return new Promise((resolve, reject) => {
            logger.debug("Initialize Streembit Network");

            peernet.connect(settings.transport, function (err) {
                if (err) {
                    if ((peernet.netclient instanceof TransPeerNet) && (settings.transport == defs.TRANSPORT_TCP) && settings.wsfallback) {
                        // if the transport was TCP and the WS fallback is enabled then try connecting via WS 
                        // prompt and ask whether the user want to connect via WS or not
                        if (uihandler.getconfirm(defs.APPMSG_NOPEER_WSUSEPROMPT)) {
                            // the user selcted to connect via WS
                            peernet.connect(defs.TRANSPORT_WS, function (err) {
                                if (err) {
                                    reject(err);
                                }
                                else {
                                    resolve();
                                }
                            })
                        }
                        else {
                            reject("Not connected to the Streembit network. Error: " + (err.message ? err.message : err));
                        }
                    }
                    else {
                        // it seems the Websocket connection failed
                        reject("Error in connecting to the Streembit network." + + (err.message ? err.message : err));
                    }
                }
                else {
                    resolve();
                }
            });
        });
    }

    module.exports = peernet;

})();