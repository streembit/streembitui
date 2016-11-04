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

import Resources from './resources';

import Localization from './localization';

import uihandler from "uihandler";

import AppSrvc from 'appsrvc'
import Components from './viewreg';
import Binder from './bind';
import Config from 'appconfig';
import logger from 'applogger';
import Database from 'database';
import Datadir from 'datadir';
import Accounts from 'accounts';
import StreembitNet from 'streembitnet';
import i18next from 'i18next';
import appevents from "appevents";
import apputils from "apputils";
import settings from "settings";
import contacts from "contacts";
import peercomm from "peercomm";
import contactlist from "contactlist";
import errhandler from "./errorhandler";
import webrtclib from "webrtclib";

var StreembitApplication = {

    peermsg_handler: function (payload, info) {
        try {
            console.log("peermsg_handler received a message");
            peercomm.onPeerMessage(payload, info);
        }
        catch (err) {
            // display the error in the taskbar
            streembit.notify.error("Peer message handling error: %j", err, true);
        }
    },

    create_event_handlers: function () {
        return new Promise((resolve, reject) => {

            // create an application wide event handler
            appevents.onAppEvent(function (eventcmd, payload, info) {
                switch (eventcmd) {
                    case appevents.TYPES.ONUSERPUBLISH:
                        AppSrvc.account_connected = true;
                        logger.debug("event: ONUSERPUBLISH");
                        break;
                    case appevents.TYPES.ONACCOUNTMSG:
                        apputils.handle_account_messages(payload);
                        logger.debug("event: ONACCOUNTMSG");
                        break;
                    default:
                        break;
                }
            });

            // create the peermsg event handler
            appevents.onPeerMsg(StreembitApplication.peermsg_handler);

            resolve();
        });        
    },

    load: function () {
        try {
            // will throw an exception upon invalid configuration entries
            Config.init();

            uihandler.init(ko, $);

            Localization.load()
                .then(() => {
                    uihandler.set_load_info(i18next.t('appload-logger'), true);
                    return logger.init(Config.appconfig.loglevel)
                })
                .then(() => {
                    logger.debug("Logger is initialized");
                    uihandler.set_load_info(i18next.t('appload-application'));

                    // load the application service object that maintains system wide variables
                    return AppSrvc.load();
                })
                .then(() => {
                    uihandler.set_load_info(i18next.t('appload-events'));
                    return StreembitApplication.create_event_handlers();
                })
                .then(() => {
                    return errhandler.load();
                })
                .then(() => {
                        uihandler.set_load_info(i18next.t('appload-components'));
                        return Components.load();
                })
                .then(() => {
                    uihandler.set_load_info(i18next.t('appload-datadir'));
                    return Binder.load();
                })
                .then(() => {
                    uihandler.set_load_info(i18next.t('appload-databind'));
                    return Datadir.makedir();
                })
                .then(() => {
                    uihandler.set_load_info(i18next.t('appload-database'));
                    return Database.init();
                })
                .then(() => {
                    uihandler.set_load_info(i18next.t('appload-settings'));
                    return settings.load();
                })
                .then(() => {
                    uihandler.set_load_info(i18next.t('appload-accounts'));
                    return Accounts.load();
                })
                .then(() => {
                    uihandler.set_load_info(i18next.t('appload-contacts'));
                    return contactlist.load();
                })
                .then(() => {
                    uihandler.set_load_info(i18next.t('appload-apputils'));
                    return apputils.listen();
                })
                .then(() => {
                    uihandler.set_load_info(i18next.t('appload-contact-handler'));
                    return contacts.load();
                })
                .then(() => {
                    uihandler.set_load_info(i18next.t('appload-streembitconn'));
                    return StreembitNet.init();
                })
                .then(() => {
                    uihandler.unblockwin();
                    uihandler.on_load_complete();
                    console.log('Initialization promise chain is completed');
                    uihandler.set_load_info(i18next.t('appload-complete'));
                })
                .catch(function (err) {
                    uihandler.unblockwin();
                    uihandler.on_appload_error(err);
                    logger.error("StreembitApplication load error. %j", err);
                });

        }
        catch (err) {
            if (logger) {
                logger.error("Error in initalizing StreembitApplication: " + err.messsage);
                if (streembit.notify.error) {
                    streembit.notify.error("Error in initalizing StreembitApplication: " + err.messsage);
                }
            }
            else {
                alert("Error in initalizing StreembitApplication: " + err.messsage);
            }
        }
    }
}

export default StreembitApplication;


