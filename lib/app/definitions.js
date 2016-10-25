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


(function () {

    var definitions = {
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
    };

    module.exports = definitions;

})();