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

var streembit = streembit || {};

streembit.DEFS = (function (module) {
    return {
        APP_PORT: 8905,             //  Appliction port
        BOOT_PORT: 32319,           //  Discovery port for the Streembit network
        WS_PORT: 32318,             //  Default Web Socket port
        
        TRANSPORT_TCP: "tcp",       //  TCP/IP
        TRANSPORT_WS: "ws",         //  websocket
        
        PRIVATE_NETWORK: "private",
        PUBLIC_NETWORK: "public",

        USER_TYPE_HUMAN: "human",
        USER_TYPE_DEVICE: "device",
        USER_TYPE_SERVICE: "service",
        
        CMD_APP_JOINPRIVATENET: "app_join_private_network",
        CMD_APP_JOINPUBLICNET: "app_join_public_network",
        CMD_APP_CREATEACCOUNT: "app_create_account",
        CMD_APP_RESTOREACCOUNT: "app_restore_account",
        CMD_APP_INITACCOUNT: "app_init_account",
        
        CMD_USERSTART: "userstart",
        CMD_SETTINGS: 'settings',
        CMD_CONTACT_SELECT: 'contact_select',
        CMD_CONTACT_CALL: 'contact_call',
        CMD_SENDER_SHARESCREEN: 'sender_sharescreen',
        CMD_RECIPIENT_SHARESCREEN: 'recipient_sharescreen',
        CMD_HANGUP_CALL: 'hangup_call',
        CMD_CONTACT_CHAT: 'contact_chat',
        CMD_INIT_USER: 'init_user',
        CMD_CHANGE_KEY: 'change_key',
        CMD_PUBLISH_DATA: 'publish_data',
        CMD_LOGIN: 'login',
        CMD_EMPTY_SCREEN: 'empty_screen',
        CMD_FILE_INIT: 'file_init',
        CMD_CONTACT_FILERCV: 'contact_filercv',
        CMD_ACCOUNT_INFO: "account_info",
        CMD_ACCOUNT_MESSAGES: "account_messages",
        CMD_CALL_PROGRESS: "callprogress",
        CMD_CONNECT_DEVICE: "connect_device",
        CMD_HELP: "help",
        
        ERR_CODE_SYSTEMERR: 0x1000,
        ERR_CODE_INVALID_CONTACT: 0x1001,
        
        CALLTYPE_VIDEO: "videocall",
        CALLTYPE_AUDIO: "audiocall",
        CALLTYPE_FILET: "filetransfer",
        
        PEERMSG_CALL_WEBRTC: "CALL_WEBRTC",
        PEERMSG_CALL_WEBRTCSS: "CALL_WEBRTCSS", // offer share screen
        PEERMSG_CALL_WEBRTCAA: "CALL_WEBRTCAA", // auto audio call (audio call with screen sharing without prompting the user)
        PEERMSG_FILE_WEBRTC: "FILE_WEBRTC",
        PEERMSG_TXTMSG: "TXTMSG",
        PEERMSG_FSEND: "FSEND",
        PEERMSG_FRECV: "FRECV",
        PEERMSG_FEXIT: "FEXIT",
        PEERMSG_DEVDESC_REQ: "DEVDESCREQ",
        PEERMSG_DEVDESC: "DEVDESC",
        PEERMSG_DEVREAD_PROP: "DEVREADPROP",
        PEERMSG_DEVREAD_PROP_REPLY: "DEVREADPROP_REPLY",
        PEERMSG_DEVSUBSC: "DEVSUBSC",
        PEERMSG_DEVSUBSC_REPLY: "DEVSUBSC_REPLY",
        PEERMSG_DEV_EVENT: "DEV_EVENT",
        
        MSG_TEXT: "text",
        MSG_ADDCONTACT: "addcontact",
        MSG_ACCEPTCONTACT: "acceptcontact",
        MSG_DECLINECONTACT: "declinecontact",

        EVENT_ERROR: "app_error_event"
    }

}(streembit.DEFS || {}))




var gui = require('nw.gui');
global.appgui = gui;

var path = require('path');
var fs = require('fs');

//global.appgui.Window.get().showDevTools();

streembit.config = (function (module) {

    var config_data = {
        "isdevmode": false, //  set this to true when run the software with "\path\to\nw\nw.exe ." so in development mode 
        "loglevel": "debug",
        "transport": streembit.DEFS.TRANSPORT_TCP,
        "wsfallback": true,
        "tcpport": streembit.DEFS.APP_PORT,
        "wsport": streembit.DEFS.WS_PORT,
        "bootseeds": [
            { "address": "seed.streemio.org", "port": 32320, "public_key": "033b726f5ff2fc02a009ab2ef0844b807372af4b13d1236c2df9752de1ee93f5fa" },
            { "address": "seed.streemio.net", "port": 32320, "public_key": "033d92278f9440c8b4061dddf862f5e224d0ff312e642edfa2c93c86671442609f" },
            { "address": "seed.streemio.biz", "port": 32320, "public_key": "026f2303d7932ed86bf21b7150bcd45024f3926d37b615798855994b6b53e8b81b" },
            { "address": "seed.streemo.uk", "port": 32320, "public_key": "035f4881a0c7d50af6fcf7cc40c3eab60c382bf7f8cd83cd2a3ff5064afd893c70" }
        ],
        "ice_resolvers": [
            { "url": "stun:stun.l.google.com:19302" }, { "url": "stun:stun1.l.google.com:19302" }, { "url": "stun:stun2.l.google.com:19302" }
        ],
        "private_net_seed": { "account": "", "host": "", "port": 0 },
        "pending_contacts": []
    };    
    

    Object.defineProperty(module, "data", {
        get: function () {
            return config_data;           
        },
        
        set: function (value) {
            config_data = value;
        }
    });

    Object.defineProperty(module, "isdevmode", {
        get: function () {
            return config_data.isdevmode;
        },
        
        set: function (value) {
            config_data.isdevmode = value;
        }
    });
    
    Object.defineProperty(module, "loglevel", {
        get: function () {
            return config_data.loglevel || "debug";
        },
        
        set: function (value) {
            config_data.loglevel = value;
        }
    });
    
    Object.defineProperty(module, "transport", {
        get: function () {
            return config_data.transport || streembit.DEFS.TRANSPORT_TCP;
        },
        
        set: function (value) {
            config_data.transport = value;
        }
    });
    
    Object.defineProperty(module, "wsfallback", {
        get: function () {
            return config_data.wsfallback;
        },
        
        set: function (value) {
            config_data.wsfallback = value;
        }
    });
    
    Object.defineProperty(module, "tcpaddress", {
        get: function () {
            return config_data.tcpaddress;
        },
        
        set: function (value) {
            config_data.tcpaddress = value;
        }
    });
    
    Object.defineProperty(module, "tcpport", {
        get: function () {
            return config_data.tcpport || streembit.DEFS.APP_PORT;
        },
        
        set: function (value) {
            config_data.tcpport = value;
        }
    });
    
    Object.defineProperty(module, "wsport", {
        get: function () {
            return config_data.wsport || streembit.DEFS.WS_PORT;
        },
        
        set: function (value) {
            config_data.wsport = value;
        }
    });

    Object.defineProperty(module, "bootseeds", {
        get: function () {
            return config_data.bootseeds;
        },
        
        set: function (value) {
            config_data.bootseeds = value;
        }
    });
    
    Object.defineProperty(module, "ice_resolvers", {
        get: function () {
            return config_data.ice_resolvers;
        },
        
        set: function (value) {
            config_data.ice_resolvers = value;
        }
    });
    
    Object.defineProperty(module, "private_net_seed", {
        get: function () {
            return config_data.private_net_seed;
        },
        
        set: function (value) {
            config_data.private_net_seed = value;
        }
    });
    
    module.set_config = function(obj) {
        module.data = obj;
    }

    return module;

}(streembit.config || {}));

// initialize the event handler

var AppEvents = require("streembitlib/events/AppEvents");
global.appevents = new AppEvents();

// initialize the logger
var logger = require("streembitlib/logger/logger");

streembit.logger = (function (module) {
    var logger = require("streembitlib/logger/logger");
    module = logger;

    return module;

}(streembit.logger || {}));



