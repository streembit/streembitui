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
Author: Streembit development team
Copyright (C) Streembit 2017
-------------------------------------------------------------------------------------------------------------------------

*/

import i18next from 'i18next';

// TODO get this from a resource files based on the language
var ErrorCodes = {
    "en": {

    }
};

export default function () {
    return new Promise((resolve, reject) => {
        i18next.init({
            lng: 'en',
            resources: {
                en: {
                    translation: {                        
                        "appname-title": "Streembit",
                        "appname-sub-title": "Decentralized, peer-to-peer communication system for humans and machines",
                        "appload-streembit": "Load Streembit",
                        "appload-application": "Load application",
                        "appload-components": "Loading UI components",
                        "appload-datadir": "Create application data directory",
                        "appload-databind": "Create data binders",
                        "appload-database": "Load database",
                        "appload-logger": "Creating application logger",
                        "appload-settings": "Load settings from local database",
                        "appload-accounts": "Load accounts from local database",
                        "appload-apputils": "Create application utility handler",
                        "appload-contacts": "Load contacts from local database",
                        "appload-contact-handler": "Initialize contacts handler",
                        "appload-events": "Create event handlers",
                        "appload-kademlia": "Load Kademlia DHT",
                        "appload-streembitconn": "Connecting to the Streembit P2P network",
                        "appload-complete": "Application resource loading has been completed",
                        "lbl-initui-connect": "Connect",
                        "lbl-initui-newaccount": "New Account",
                        "lbl-initui-initexisting": "Initialize Existing Account",
                        "lbl-initui-restore": "Restore Account",
                        "lbl-createaccount-create": "Create new Streembit account",
                        "lbl-connectto-public-net": "Initialize Streembit account",
                        "lbl-connect": "Connect",
                        "lbl-submit": "Submit",
                        "lbl-streembitacc": "Streembit account",
                        "lbl-saved-accounts": "Saved accounts",
                        "lbl-privkeypassword": "Private key password",
                        "lbl-confirmpassword": "Confirm private key password",
                        "lbl-changepwd-title": "Change your Streembit password",
                        "lbl-changepwd-change": "Change password",
                        "errmsg-createaccount-accountname": "The account name must be between 6-20 characters and it can only contain alphanumeric characters (letters a-z, A-Z and numbers 0-9)",
                        "errmsg-createaccount-exists": "The account already exists in your account list.",
                        "errmsg-createaccount-pwdrequired": "Password is required",
                        "errmsg-createaccount-pwdlength": "The password must be at least 8 characters",
                        "errmsg-createaccount-nospaceallowed": "The password must not contain empty space",
                        "errmsg-createaccount-lowercaseneed": "The password must contain at least one lower case letter",
                        "errmsg-createaccount-uppercaseneed": "The password must contain at least one upper case letter",
                        "errmsg-createaccount-digitneed": "The password must contain at least one digit",
                        "errmsg-createaccount-specialcharneed": "The password must contain at least one special character",
                        "errmsg-createaccount-pwdconfirm": "Password confirm input value is required",
                        "errmsg-createaccount-pwdconfirmmatch": "The password and its confirm are not the same",
                        "errmsg-connectaccount-select": "Select an account from the saved account list",
                        "appmsg-nopeer-wsuseprompt": "Unable to connect via the TCP peer connection. Most likely your firewall, port forwarding or UPnP configuration is blocking the communication via TCP.\nWould you like to use WebSocket connection? Your signalling and contact discovery will be performed by a WebSocket server, but your video, audio, text communication and file sending will still be fully encrypted and peer-to-peer.",
                        "appmsg-askwspublish": "Would you like to publish data to Streembit WebSocket hubs? Using WebSocket enables communication with users who are unable to etablish a TCP connection. Using WS signalling your video, audio, text communication and file sending will still be fully encrypted and peer-to-peer.",
                        "errmsg-wallet-send-recipient": "Recipient is a string 30-40 chars long. no blanks, no special chars",
                        "errmsg-wallet-send-amount": "Amount is not empty, can be a floating",
                        "errmsg-wallet-send-fees": "Fees is not empty, can be a floating",
                        "errmsg-wallet-receive-message": "Message contains chars that we do not accept",
                        "errmsg-wallet-receive-label": "Label contain unacceptable characters",
                        "errmsg-transport-send": "There is an error processing your request. Please, try again later",
                        "lbl-restore-account": "Restore Account",
                        "lbl-restore-backup": "Restore from Backup",
                        "ttlbtn-restore-mnemonic": "Restore from Mnemonic",
                        "btn-hide-restore-mnemonic": "Hide mnemonic field",
                        "sbm-restore-mnemonic": "Restore",
                        "lbl-mnemonic": "Mnemonic",
                        "lbl-restore-mnemonic": "Restore private key from Mnemonic",
                        "errmsg-remnemonic-invalid": "Invalid mnemonic",
                        "errmsg-remnemonic-validation-failed": "Mnemonic validation failed. Check spelling and wording",
                        // view titles
                        "view-title-dashboard": "Dashboard",
                        "view-title-help": "Help",
                        "view-title-settings": "Settings",
                        "view-title-netinfo": "Account, network info",
                        "view-title-logs": "Logs",
                        "view-title-certificates": "X.509 certificates",
                        "view-title-utilcerts": "Utility certificates",
                        "view-title-commsecurity": "Communication security",
                        "view-title-addiothub": "Add IoT Hub",
                        "view-title-devices": "My Devices",
                        "view-title-wallet": "Wallet",
                        "view-title-balance": "Balance",
                        "view-title-contact": "Contact details",
                        "view-title-contact-chat": "Text chat",
                        "view-title-audio-call": "Audio Call",
                        "view-title-offline-contact-request": "Create offline contact offer",
                        "view-title-accept-contact-request": "Add contact",
                        "wal-dinamic-fees": "Use dynamic fees",
                        "wal-fees-manually": "Edit fees manually",
                        "wal-propose-replace": "Propose Replace-By-Fee:",
                        "wal-fee-unit": "Fee Unit:",
                        "wal-change-address": "Use change addresses",
                        "wal-multiple-change-address": "Use multiple change addresses",
                        "wal-coin-section": "Coin Section",
                        "wal-confirmed-coins": "Spend only confirmed coins",
                        "wal-language" : "Language:",
                        "wal-decimal-point": "Zeros after decimal point:",
                        "wal-base-unit": "Base unit",
                        "wal-currency": "Fiat currency",
                        "wal-history-rates": "Show history rates",
                        "wal-fiatBalance-address": "Show fiat balance for addresses",
                        "wal-open-alias": "Open Alias:",
                        "wal-ssl-certificate": "SSL certificate:",
                        "col-balance": "Balance",
                        "col-recent-transactions": "Recent transactions",
                        "col-appearance" : "Appearance",
                        "col-fiat": "Fiat",
                        "col-identity": "Identity",
                        "tab-payTo": "Pay To:",
                        "tab-label": "Label:",
                        "tab-amount": "Amount:",
                        "tab-address": "Address",
                        "tab-transaction-fees": "Transaction Fees",
                        "tab-SBCoin": "SBCoin/kB",
                        "tab-request-replace-be-fee": "Request replace be Fee",
                        "btn-clear": "Clear",
                        "btn-copy-uri": "Copy URI",
                        "btn-copy-address": "Copy Address",
                        "btn-save-image": "Save Image",
                        "btn-close": "Close",
                        "tab-message": "Message",
                        "tab-request-payment-history": "Requested Payment History",
                        "tb-header-text-date": "Date",
                        "tb-header-text-address": "Address",
                        "tb-header-test-label": "Label",
                        "tb-header-amount-req": "Amount",
                        "tb-header-amount-tranc": "Amount Transacted (SBCoin)",
                        "tb-header-type": "Type",
                        "tb-header-balance": "Balance",
                        "nav-overview": "Overview",
                        "nav-send-money": "Send Money",
                        "nav-receive-money": "Receive Money",
                        "nav-transactions": "Transactions",
                        "coin-name": "SBCoin",
                        "mainMenuFile": "File",
                        "delete": "Delete",
                        "backup": "Backup",
                        "menu-title-security": "Security",
                        "menu-title-actions": "Actions",
                        "menu-item-restore-wallet": "Restore wallet",
                        "menu-item-backup-wallet": "Backup wallet",
                        "menu-item-delete-wallet": "Delete wallet",
                        "menu-item-password": "Password",
                        "menu-item-seed": "Seed",
                        "menu-item-private-keys": "Private keys",
                        "menu-item-history": "Export history",
                        "menu-title-settings": "Settings",
                        "menu-item-contract": "Create smart contract",
                        "menu-item-preferences": "Preferences",
                        "menu-item-network": "Network",
                        "menu-item-sign-message": "Sign message",
                        "menu-item-verify-message": "Verify message",
                        "menu-item-encrypt": "Encrypt",
                        "menu-item-load-transaction": "Load transaction",
                        "menu-item-from-text": "from text",
                        "menu-item-from-blockchain": "from blockchain",
                        "menu-item-qr-code": "from QR code",
                        "menu-item-documentation": "Documentation",
                        "password-item-title": "Your wallet is password protected and encrypted.Use this dialog to change the password.",
                        "text": "At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque corrupti quos dolores et quas molestias excepturi sint occaecati cupiditate non provident, similique sunt in culpa qui officia deserunt mollitia animi, id est laborum et dolorum fuga. Et harum quidem rerum facilis est et expedita distinctio. Nam libero tempore, cum soluta nobis est eligendi optio cumque nihil impedit quo minus id quod maxime placeat facere possimus, omnis voluptas assumenda est, omnis dolor repellendus. Temporibus autem quibusdam et aut officiis debitis aut rerum necessitatibus saepe eveniet ut et voluptates repudiandae sint et molestiae non recusandae. Itaque earum rerum hic tenetur a sapiente delectus, ut aut reiciendis voluptatibus maiores alias consequatur aut perferendis doloribus asperiores repellat.",
                        "delete-text": "You are about to delete a and all of its contents.",
                        "deleteOp": "This operation is permanent and cannot be undone.",
                        "passworddialog": "Your wallet is password protected and encrypted.Use this dialog to change the password.",
                        "currentpass": "Current Password:",
                        "newpassword": "New Password:",
                        "confirmpass": "Confirm Password:",
                        "enterpass" : "Please enter your password",
                        "next-button": "Next",
                        "col-fees": "Fees",
                        "layout-fixed-header": "Fixed Header",
                        "layout-fixed-navigation": "Fixed Navigation",
                        "layout-fixed-ribbon": "Fixed Ribbon",
                        "layout-fixed-footer": "Fixed Footer",
                        "layout-inside": "Inside .container",
                        "layout-rtl-support": "RTL Support",
                        "layout-menu": "Menu on top",
                        "layout-for-colorblind": "For Colorblind",
                        "layout-colorblind-experimental": "experimental",
                        "layout-smartadmin-skins": "SmartAdmin Skins",
                        "layout-smart-default": "Smart Default",
                        "layout-dark-elegance": "Dark Elegance",
                        "layout-ultra-light": "Ultra Light",
                        "layout-google-skin": "Google Skin",
                        "layout-pixelSmash": "PixelSmash",
                        "layout-glass": "Glass",
                        "layout-MaterialDesign": "MaterialDesign",
                        "layout-options": "Layout Options",
                        "layout-clear-localstorage": "Clear Localstorage",
                        "factory-reset": "Factory Reset",
                        "clear-localstorage-text": "Would you like to RESET all your saved widgets and clear LocalStorage?",
                        "localstorage-btn-yes": "YES",
                        "localstorage-btn-no": "NO",
                        "nav-sing-message": "Sign Message",
                        "nav-verify-message": "Verify Message",
                        "sign-message-text": "You can sign messages/agreements with your addresses to prove you can receive bitcoins sent to them. Be careful not to sign anything vague or random, as phishing attacks may try to trick you into signing your identity over to them. Only sign fully-detailed statements you agree to.",
                        "sign-message-signature": "Signature",
                        "message-clear": "Clear All",
                        "verify-message-text": "Enter the receiver's address, message (ensure you copy line breaks, spaces, tabs, etc. exactly) and signature below to verify the message. Be careful not to read more into the signature than what is in the signed message itself, to avoid being tricked by a man-in-the-middle attack. Note that this only proves the signing party receives with the address, it cannot prove sendership of any transaction!",
                        "helpitem-overview-whatstreembitui": "What is Streembit?",
                        "helpitem-overview-opensource": "Open source",
                        "helpitem-overview-systemarchitecture": "System architecture",
                        "helpitem-overview-internet-devices": "Internet of Things devices",
                        "helpitem-settings-config": "Settings, configuration",
                        "helpitem-settings-config-your-streembit": "Configure your Streembit",
                        "helpitem-settings-config-create-account": "Create account",
                        "helpitem-settings-config-backup-account": "Backup account",
                        "helpitem-settings-config-delete-account": "Delete account",
                        "helpitem-settings-config-log-files": "Log files",
                        "helpitem-network": "Streembit network",
                        "helpitem_network_connect_public": "Connect to public network",
                        "helpitem_network_connect_private": "Connect to private network",
                        "helpitem-network-share-keys": "Share your keys",
                        "helpitem-system": "System",
                        "helpitem-system-clear-database": "Clear database",
                        // messages of connection info panel
                        "current-connection-header": "Current Connection Info",
                        "current-connection-account": "Account",
                        "current-connection-transport": "Transport",
                        "current-connection-host": "Host",
                        "current-connection-port": "Port",
                        "current-connection-pubkey": "Public key",
                        // messages for error codes, add an 'errcode_' prefix at the message
                        "errcode_SYSTEM": "System error",
                        "errcode_BADPARAM": "Bad paramater was sent to the procedure",
                        "errcode_INVALID_PAYLOAD": "Invalid payload was sent to the procedure",
                        "errcode_EVENT": "Event handler failed",
                        "errcode_DATABASE": "Database failed",
                        "errcode_HTTP": "HTTP procedure failed",
                        "errcode_HTTP_HANDLEREQUEST": "HTTP handle request failed",
                        "errcode_HTTP_NOWSINFO": "No WS info available at HTTP procedure",
                        "errcode_HTTP_NOWSPEERS": "There are no WS peers available at the HTTP procedure",
                        "errcode_WS": "WebSocket procedure failed",
                        "errcode_WS_ONSEND": "WebSocket onsend handler procedure failed",
                        "errcode_WS_PING": "WebSocket ping procedure failed",
                        "errcode_WS_REGISTER": "WebSocket register client procedure failed",
                        "errcode_WS_DHTPUT": "WebSocket dhtput procedure procedure failed",
                        "errcode_WS_DHTGET": "WebSocket dhtget procedure procedure failed",
                        "errcode_WS_PEERMSG": "WebSocket peer message procedure failed",
                        "errcode_WS_CONTACT_SESSION": "WebSocket session does not exists for contact",
                        "errcode_WS_PEERCOMM": "WebSocket peer communication error",
                        "errcode_UI_CONNECT_TONETWORK": "Error in connecting to Streembit network",
                        "errcode_UI_ON_PEERMSG": "Error in handling message from peer",
                        "errcode_UI_WEBRTC_FILE": "WebRTC file send procedure failed",
                        "errcode_UI_WEBRTC_DATA": "WebRTC data send procedure failed",
                        "errcode_UI_WEBRTC_SCREENSHARE": "WebRTC screen share procedure failed",
                        "errcode_UI_FINDCONTACT": "Finding contact failed",
                        // generic error in case there is no error code
                        "errcode_PROCERROR": "Procedure failed",
                        "errcode_MAX_ERROR_CODE": "0xFFFF",
                        "ERROR": "Application error",
                        // miscellaneous
                        "error-word": "Error",
                        "reason-word": "Reason",
                        "info-word": "Info",


                    }
                },
                de: {
                    translation: {
                        "ERROR": "Anwendungsfehler",
                        "appname-title": "Streembit",
                        "appname-sub-title": "German Decentralized, peer-to-peer, secure communication system for humans and machines",
                        "appload-streembit": "German Load Streembit",
                        "appload-locals": "German Load localization resources",
                        "appload-database": "German Load database",
                        "appload-logger": "German Load application logger",
                        "appload-kademlia": "German Load Kademlia DHT",
                        "lbl-initui-connect": "Verbunden",
                        "lbl-initui-newaccount": "Neues Konto",
                        "lbl-initui-initexisting": "Initialisieren Bestehenden Konto",
                        "lbl-initui-restore": "Wiederherstellung Konto",

                        // errors
                        // TODO

                        // miscellaneous
                        "error-word": "Fehler",
                        "reason-word": "Grund"
                    }
                }
            }
        },
        (err, t) => {
            if (!err) {
                console.log('Local resources loaded');
                resolve();
            }
            else {
                reject(err);
            }
        });
    }); 
}


