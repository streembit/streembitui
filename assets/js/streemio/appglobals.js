'use strict';

var streemio = streemio || {};

streemio.DEFS = (function (module) {
    return {
        BOOT_PORT: 32319,           //  Discovery port for the Streemio network
        WS_PORT: 32318,             //  Default Web Socket port
        
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

        CMD_CONTACT_SELECT: 'contact_select',
        CMD_VIDEO_CALL: 'video_call',
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

streemio.config = (function (config) {
    var module = {};
    
    var m_config;
    
    function dev_load_config() {
        var wdir = process.cwd();
        var filepath = path.join(wdir, 'streemio.conf');
        var data = fs.readFileSync(filepath, 'utf8');
        var confobj = JSON.parse(data);
        return confobj;
    }

    function load_config() {
        var nwPath = process.execPath;
        var nwDir = path.dirname(nwPath);   
        var filepath = path.join(nwDir, 'streemio.conf');
        var data = fs.readFileSync(filepath, 'utf8');
        var confobj = JSON.parse(data);
        return confobj;
    }

    Object.defineProperty(module, "data", {
        get: function () {
            var errinfo = null;
            try {
                if (!m_config) {
                    m_config = load_config();
                }
                return m_config;
            }
            catch (err) {
                errinfo = err.message;
            }

            try {
                if (!m_config) {
                    m_config = dev_load_config();
                }
                return m_config;
            }
            catch (err) {
                errinfo = err.message;
            }

            if (!m_config) {
                alert("The streemio.conf configuration file must exists in the application root directory")
            }
        }
    });
    

    return module;

}(streemio.config || {}));


global.appconfig = streemio.config.data;

var AppEvents = require("./libs/events/AppEvents");
global.appevents = new AppEvents();

// initialize the logger
var logspath = null;
if (global.appconfig && global.appconfig.appexec && global.appconfig.appexec == 'dev') {
    var wdir = process.cwd();
    logspath = path.join(wdir, 'logs');
}
else {
    var nwPath = process.execPath;
    var nwDir = path.dirname(nwPath);
    logspath = path.join(nwDir, 'logs');
}

var logger = require("./libs/logger/logger");

var level = global.appconfig && global.appconfig.log && global.appconfig.log.level ? global.appconfig.log.level : "debug";
console.log('log level: ' + level);
console.log('log path: ' + logspath);
logger.init(level, logspath);

global.applogger = logger;

