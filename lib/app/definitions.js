﻿/*

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


(function () {

    var definitions = {
        DEFAULT_SEED_PORT: 32320,
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
        PEERMSG_DATA_WEBRTC: "DATA_WEBRTC", // data related WebRTC offers, accept, etc.
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

        APPMSG_NOPEER_WSUSEPROMPT: "appmsg-nopeer-wsuseprompt",
        APPMSG_WSPUBLISHPROMPT: "appmsg-askwspublish",

        IOT_DEVICE_GATEWAY: 1,
        IOT_DEVICE_ENDDEVICE: 2,

        IOT_PERMISSION_NOTCOMISSIONED: 0,
        IOT_PERMISSION_ALLOWED: 1,
        IOT_PERMISSION_DENIED: 2,

        IOT_REQUEST_DEVICES_LIST: 0x01,
        IOT_DEVICES_LIST_RESPONSE: 0x02,
        IOT_DEVICES_LIST_CONFIGURE: 0x03,
        IOT_ALLDEVICES_LIST_REQUEST: 0x04,
        IOT_ALLDEVICES_LIST_RESPONSE: 0x05,
        IOT_SET_DEVICE_PERMISSION_REQUEST: 0x06,
        IOT_SET_DEVICE_PERMISSION_RESPONSE: 0x07,
        IOT_ENABLE_JOIN_REQUEST: 0x08,
        IOT_ENABLE_JOIN_RESPONSE: 0x09,
        IOT_DELETE_DEVICE_REQUEST: 0x0a,
        IOT_NEW_DEVICE_JOINED: 0x0b,
        IOT_HUB_STATUS: 0x0c,

        IOTCMD_DEVICE_DETAILS: 0x00,
        IOTCMD_READVALUES: 0x01,
        IOTCMD_TOGGLE: 0x02,
        IOTCMD_TURNOFF: 0x03,
        IOTCMD_TURNON: 0x04,
        IOTCMD_CONFIGURE_REPORT: 0x05,

        IOT_NETWORK_ZIGBEE: 1,
        IOT_NETWORK_ZWAVE: 2,
        IOT_NETWORK_SLOWPAN: 3,

        IOT_FUNCTION_SWITCH: 2,
        IOT_FUNCTION_ELECTRICITY_MEASUREMENT: 3,
        IOT_FUNCTION_TEMPERATURE_SENSING: 4,
        IOT_FUNCTION_RELHUMIDITY_SENSING: 5,
        IOT_FUNCTION_OCCUPANCY_SENSING: 6,

        DEVICE_FEATURES: {
            2: "On/Off Switch",
            3: "Electricity Measurement",
            4: "Temperature Measurement",
            5: "Relative Humidity Measurement",
            6: "Occupancy Sensing",
            7: "Gas sensor",
            8: "Level Control",
            9: "Alarms",
            10: "Door Lock",
            11: "Window Covering",
            12: "Pump Configuration and Control",
            13: "Thermostat",
            14: "Fan Control",
            15: "Color Control",
            16: "Illuminance Measurement",
            17: "Illuminance Level Sensing",
            18: "Pressure Measurement",
            19: "Flow Measurement",
            20: "Water presence sensor",
            21: "Video streaming",
            22: "Vehicle CAN interface",
            23: "Drone controller"
        },

        PROPERTY_HWVERSION: "hwversion",
        PROPERTY_MANUFACTURERNAME: "manufacturername",
        PROPERTY_MODELIDENTIFIER: "modelidentifier",
        PROPERTY_SWITCH_STATUS: "switchstatus",
        PROPERTY_ACTIVEPOWER: "activepower",
        PROPERTY_VOLTAGE: "voltage",
        PROPERTY_TEMPERATURE: "temperature",
        PROPERTY_RELATIVE_HUMIDITY: "relative_humidity",
        PROPERTY_POWERDIVISOR: "power_divisor",
        PROPERTY_POWERMULTIPLIER: "power_multiplier",

        MIN_REPORTING_INTERVAL: 60000,
        MAX_REPORTING_INTERVAL: (60000 * 60),

        STREEMBITSDIV: 0.00000001, 
        STREEMBITSMUL: 100000000,
   
        MAXVAL: 0xfffffff0
    };

    module.exports = definitions;

})();