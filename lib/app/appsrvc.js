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

function AppSrvc() {
    if (!(this instanceof AppSrvc)) {
        return new AppSrvc()
    }

    this.is_account_connected = ko.observable(false);
    this.peernode = null;
    this.transport_type = null;
    this.is_net_connected = false;
    this.netport = 0;
    this.netaddress = null;
    this.upnp_gateway = null;
    this.upnp_address = null;
    this.user_private_key = null;
    this.user_public_key = null;
    this.user_name = null;
    this.crypto_key = null;
}


AppSrvc.prototype.load = function () {
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

Object.defineProperty(AppSrvc.prototype, 'account_connected', {
    get: function() {
        return this.is_account_connected;
    },
    set: function(value) {
        this.is_account_connected(value);
    }
})

Object.defineProperty(AppSrvc.prototype, 'net_connected', {
    get: function () {
        return this.is_net_connected;
    },
    set: function (value) {
        this.is_net_connected = value;
    }
})

Object.defineProperty(AppSrvc.prototype, 'node', {
    get: function () {
        return this.peernode;
    },
    set: function (value) {
        this.peernode =value;
    }
})

Object.defineProperty(AppSrvc.prototype, 'transport', {
    get: function () {
        return this.transport_type;
    },
    set: function (value) {
        this.transport_type = value;
    }
})

Object.defineProperty(AppSrvc.prototype, 'port', {
    get: function () {
        return this.netport;
    },
    set: function (value) {
        this.netport = value;
    }
})

Object.defineProperty(AppSrvc.prototype, 'address', {
    get: function () {
        return this.netaddress;
    },
    set: function (value) {
        this.netaddress = value;
    }
})

Object.defineProperty(AppSrvc.prototype, 'upnpgateway', {
    get: function () {
        return this.upnp_gateway;
    },
    set: function (value) {
        this.upnp_gateway = value;
    }
})

Object.defineProperty(AppSrvc.prototype, 'upnpaddress', {
    get: function () {
        return this.upnp_address;
    },
    set: function (value) {
        this.upnp_address = value;
    }
})

Object.defineProperty(AppSrvc.prototype, 'privatekey', {
    get: function () {
        return this.user_private_key;
    },
    set: function (value) {
        this.user_private_key = value;
    }
})


Object.defineProperty(AppSrvc.prototype, 'publickey', {
    get: function () {
        return this.user_public_key;
    },
    set: function (value) {
        this.user_public_key = value;
    }
})


Object.defineProperty(AppSrvc.prototype, 'username', {
    get: function () {
        return this.user_name;
    },
    set: function (value) {
        this.user_name = value;
    }
})

Object.defineProperty(AppSrvc.prototype, 'cryptokey', {
    get: function () {
        return this.crypto_key;
    },
    set: function (value) {
        this.crypto_key = value;
    }
})

module.exports = new AppSrvc();