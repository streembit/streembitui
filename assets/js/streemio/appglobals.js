'use strict';

var streemio = streemio || {};

streemio.DEFS = (function (module) {
    return {
        APP_PORT: 8905,             //  Appliction port
        BOOT_PORT: 32319,           //  Discovery port for the Streemio network
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
        CMD_HELP: "help",
        
        ERR_CODE_SYSTEMERR: 0x1000,
        ERR_CODE_INVALID_CONTACT: 0x1001,
        
        CALLTYPE_VIDEO: "videocall",
        CALLTYPE_AUDIO: "audiocall",
        CALLTYPE_FILET: "filetransfer",
        
        PEERMSG_CALL_WEBRTC: "CALL_WEBRTC",
        PEERMSG_FILE_WEBRTC: "FILE_WEBRTC",
        PEERMSG_TXTMSG: "TXTMSG",
        PEERMSG_FSEND: "FSEND",
        PEERMSG_FRECV: "FRECV",
        PEERMSG_FEXIT: "FEXIT"
    }

}(streemio.DEFS || {}))


var gui = require('nw.gui');
global.appgui = gui;

var path = require('path');
var fs = require('fs');

//global.appgui.Window.get().showDevTools();

streemio.config = (function (module) {

    var config_data = {
        "isdevmode": true,
        "loglevel": "debug",
        "transport": streemio.DEFS.TRANSPORT_TCP,
        "wsfallback": true,
        "tcpport": streemio.DEFS.APP_PORT,
        "wsport": streemio.DEFS.WS_PORT,
        "bootseeds": [
            "seed.streemio.org", "seed.streemio.net"
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
            return config_data.transport || streemio.DEFS.TRANSPORT_TCP;
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
    
    Object.defineProperty(module, "tcpport", {
        get: function () {
            return config_data.tcpport || streemio.DEFS.APP_PORT;
        },
        
        set: function (value) {
            config_data.tcpport = value;
        }
    });
    
    Object.defineProperty(module, "wsport", {
        get: function () {
            return config_data.wsport || streemio.DEFS.WS_PORT;
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

}(streemio.config || {}));

// initialize the event handler

var AppEvents = require("./libs/events/AppEvents");
global.appevents = new AppEvents();

// initialize the logger
var logger = require("./libs/logger/logger");

streemio.logger = (function (module) {
    var logger = require("./libs/logger/logger");
    module = logger;

    return module;

}(streemio.logger || {}));



