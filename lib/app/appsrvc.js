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

Application service implementation

*/

'use strict';

var appevents = require("appevents");
var logger = require('applogger');
var createHash = require('create-hash');


(function () {

    var is_account_connected = false;
    var peernode = null;
    var transport_type = null;
    var user_type = null;
    var is_net_connected = false;
    var netport = 0;
    var netaddress = null;
    var upnp_gateway = null;
    var upnp_address = null;
    var user_ecckey = null;
    var user_name = null;
    var user_shared_symmkey = null;
    var currview = null;
    var textmessages = {};
    var srv_session = null;
    var srv_certificate = null;
    var email_address = null;
    var data_cryptkey = null;
    var user_idqascore = null;
    var user_mnemonic = null;
    var ws_host = null;
    var ws_port = null;

    var appsrvc = appsrvc || {};

    appsrvc.load = function (usertype) {
        var self = this;
        return new Promise((resolve, reject) => {
            // put here additional initialization for this global resource sharing object
            appsrvc.usertype = usertype;
            resolve();
        });
    };

    appsrvc.add_textmsg = function (contact, msg) {
        if (!textmessages[contact]) {
            textmessages[contact] = [];
        }

        var array = textmessages[contact];
        array.push(msg);
    }

    appsrvc.get_textmsg = function (contact) {
        if (!textmessages[contact]) {
            textmessages[contact] = [];
        }

        return textmessages[contact];
    }

    appsrvc.reset_account = function () {
        is_account_connected = false;
        user_name = null;
        user_ecckey = null;
    }

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

    Object.defineProperty(appsrvc, 'usertype', {
        get: function () {
            return user_type;
        },
        set: function (value) {
            user_type = value;
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

    Object.defineProperty(appsrvc, 'host', {
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

    Object.defineProperty(appsrvc, 'userecckey', {
        get: function () {
            return user_ecckey;
        },
        set: function (value) {
            user_ecckey = value;
        }
    })

    Object.defineProperty(appsrvc, 'privatekey', {
        get: function () {
            return user_ecckey.privateKey;
        }
    })

    Object.defineProperty(appsrvc, 'privateKeyHex', {
        get: function () {
            return user_ecckey.privateKeyHex;
        }
    })

    Object.defineProperty(appsrvc, 'publickey', {
        get: function () {
            return user_ecckey.publicKey;
        }
    })

    Object.defineProperty(appsrvc, 'publickeyhex', {
        get: function () {
            return user_ecckey.publicKeyHex;
        }
    })

    Object.defineProperty(appsrvc, 'pubkeyhash', {
        get: function () {
            return user_ecckey.pubkeyhash;
        }
    })

    Object.defineProperty(appsrvc, 'pubkeyrmd160hash', {
        get: function () {
            var buffer = user_ecckey.publicKeyrmd160;
            return buffer.toString("hex");
        }
    })

    Object.defineProperty(appsrvc, 'publicKeyBs58', {
        get: function () {
            return user_ecckey.publicKeyBs58;
        }
    })

    Object.defineProperty(appsrvc, 'cryptokey', {
        get: function () {
            return user_ecckey.cryptoKey;
        }
    })

    Object.defineProperty(appsrvc, 'connsymmkey', {
        get: function () {
            return user_shared_symmkey;
        },
        set: function (value) {
            user_shared_symmkey = value;
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

    Object.defineProperty(appsrvc, "is_user_initialized", {
        get: function () {
            var isuser = user_name && user_ecckey;
            return isuser ? true : false;
        }
    });

    Object.defineProperty(appsrvc, "currentview", {
        get: function () {
            return currview;
        },
        set: function (value) {
            currview = value;
        }
    });

    Object.defineProperty(appsrvc, "sessionid", {
        get: function () {
            return srv_session;
        },
        set: function (value) {
            srv_session = value;
        }
    });

    Object.defineProperty(appsrvc, "certificate", {
        get: function () {
            return srv_certificate;
        },
        set: function (value) {
            srv_certificate = value;
        }
    });

    Object.defineProperty(appsrvc, "email", {
        get: function () {
            return email_address;
        },
        set: function (value) {
            email_address = value;
        }
    });

    Object.defineProperty(appsrvc, "datacryptkey", {
        get: function () {
            return data_cryptkey;
        },
        set: function (value) {
            data_cryptkey = value;
        }
    });

    // 
    Object.defineProperty(appsrvc, "mnemonicPhrase", {
        get: function () {
            return user_mnemonic;
        },
        set: function (value) {
            user_mnemonic = value;
        }
    });


    Object.defineProperty(appsrvc, "wshost", {
        get: function () {
            return ws_host;
        },
        set: function (value) {
            ws_host = value;
        }
    });

    Object.defineProperty(appsrvc, "wsport", {
        get: function () {
            return ws_port;
        },
        set: function (value) {
            ws_port = value;
        }
    });


    module.exports = appsrvc;

}());