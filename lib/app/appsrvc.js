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

Application service implementation

*/

'use strict';

var appevents = require("appevents");
var logger = require('applogger');
// knockout
var ko = require("knockout");


(function (appsrvc) {

    var is_account_connected = false;
    var peernode = null;
    var transport_type = null;
    var is_net_connected = false;
    var netport = 0;
    var netaddress = null;
    var upnp_gateway = null;
    var upnp_address = null;
    var user_private_key = null;
    var user_public_key = null;
    var user_name = null;
    var crypto_key = null;

    appsrvc.load = function () {
        var self = this;
        return new Promise((resolve, reject) => {

            appevents.onAppEvent(function (eventcmd, payload, info) {
                switch (eventcmd) {
                    case appevents.TYPES.ONUSERPUBLISH:
                        self.account_connected = true;
                        logger.debug("event: ONUSERPUBLISH");
                        break;
                    default:
                        break;
                }
            });

            appevents.onAppInit(function () {
                logger.info("Application is initialized");
            });

            resolve(true);
        });
    };

    Object.defineProperty(appsrvc, 'account_connected', {
        get: function () {
            return is_account_connected;
        },
        set: function (value) {
            is_account_connected = value;
        }
    })

    Object.defineProperty(appsrvc, 'net_connected', {
        get: function () {
            return is_net_connected;
        },
        set: function (value) {
            is_net_connected = value;
        }
    })

    Object.defineProperty(appsrvc, 'node', {
        get: function () {
            return peernode;
        },
        set: function (value) {
            peernode = value;
        }
    })

    Object.defineProperty(appsrvc, 'transport', {
        get: function () {
            return transport_type;
        },
        set: function (value) {
            transport_type = value;
        }
    })

    Object.defineProperty(appsrvc, 'port', {
        get: function () {
            return netport;
        },
        set: function (value) {
            netport = value;
        }
    })

    Object.defineProperty(appsrvc, 'address', {
        get: function () {
            return netaddress;
        },
        set: function (value) {
            netaddress = value;
        }
    })

    Object.defineProperty(appsrvc, 'upnpgateway', {
        get: function () {
            return upnp_gateway;
        },
        set: function (value) {
            upnp_gateway = value;
        }
    })

    Object.defineProperty(appsrvc, 'upnpaddress', {
        get: function () {
            return upnp_address;
        },
        set: function (value) {
            upnp_address = value;
        }
    })

    Object.defineProperty(appsrvc, 'privatekey', {
        get: function () {
            return user_private_key;
        },
        set: function (value) {
            user_private_key = value;
        }
    })


    Object.defineProperty(appsrvc, 'publickey', {
        get: function () {
            return user_public_key;
        },
        set: function (value) {
            user_public_key = value;
        }
    })


    Object.defineProperty(appsrvc, 'username', {
        get: function () {
            return user_name;
        },
        set: function (value) {
            user_name = value;
        }
    })

    Object.defineProperty(appsrvc, 'cryptokey', {
        get: function () {
            return crypto_key;
        },
        set: function (value) {
            crypto_key = value;
        }
    })

    module.exports = appsrvc;

}(streembit.appsrvc || {}));