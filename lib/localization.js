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

*/

import i18next from 'i18next';

export default function () {
    return new Promise((resolve, reject) => {
        i18next.init({
            lng: 'en',
            resources: {
                en: {
                    translation: {
                        "appname-title": "Streembit",
                        "appname-sub-title": "Decentralized, peer-to-peer, secure communication system for humans and machines",
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
                        "hdr-restore-mnemonic": "Restore by mnemonic",
                        "lbl-restore-mnemonic": "Restore private key by mnemonic",
                        "lbl-restore-mnemonic-submit": "Restore",
                        "errmsg-remnemonic-invalid": "Invalid mnemonic",
                        "errmsg-remnemonic-validation-failed": "Mnemonic validation failed. Check spelling and wording",
                        // view titles
                        "view-title-dashboard": "Dashboard",
                        "view-title-help": "Help",
                        "view-title-settings": "Settings",
                        "view-title-mywallet": "My Wallet",
                        "view-title-netinfo": "Account, network info",
                        "view-title-logs": "Logs",
                        "view-title-certificates": "X.509 certificates",
                        "view-title-utilcerts": "Utility certificates",
                        "view-title-commsecurity": "Communication security",
                        "view-title-addiothub": "Add IoT Hub",
                        "view-title-devices": "My Devices",
                        "view-title-wallet": "Ankit's Wallet",
                        //my added text
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
                        "col-fees": "Fees",
                        "col-transactions": "Transactions",
                        "col-appearance" : "Appearance",
                        "col-fiat": "Fiat",
                        "col-identity": "Identity",
                        "tab-payTo": "Pay To:",
                        "tab-label": "Label:",
                        "tab-amount": "Amount:",
                        "tab-transaction-fees": "Transaction Fees",
                        "tab-SBCoin": "SBCoin/kB",
                        "tab-request-replace-be-fee": "Request replace be Fee",
                        "btn-clear": "Clear",
                        "tab-message": "Message",
                        "tab-request-payment-history": "Requested Payment History",
                        "tb-header-text-date": "Date",
                        "tb-header-test-label": "Label",
                        "tb-header-amount-req": "Amount Requested (SBCoin)",
                        "tb-header-amount-tranc": "Amount Transacted (SBCoin)",
                        "tb-header-type": "Type",
                        "nav-overview": "Overview",
                        "nav-send-money": "Send Money",
                        "nav-receive-money": "Receive Money",
                        "coin-name": "SBCoin",
                        
                    }
                },
                de: {
                    translation: {
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
                        "lbl-initui-restore": "Wiederherstellung Konto"
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


