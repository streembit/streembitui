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

'use strict';


import defs from "definitions";

import Resources from './resources';

import Localres from './localization';

import uihandler from "uihandler";

import AppSrvc from 'appsrvc';
import viewreg from './viewreg';
import AppUI from './appui';
import Config from 'appconfig';
import logger from 'applogger';
import Database from 'database';
import Datadir from 'datadir';
import Accounts from 'accounts';
import appevents from "appevents";
import apputils from "apputils";
import settings from "settings";
import contactsutil from "contactsutil";
import peercomm from "peercomm";
import contactlist from "contactlist";
import errhandler from "./errorhandler";
import webrtcfile from "webrtcfile";
import connections from "connections";
import webrtcscreen from "webrtcscreen";
import Transport from "transport";
import BcService from "bcservice";

var App = {

    isdatabase: false,

    peermsg_handler: function (payload, info) {
        try {
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
                    case appevents.TYPES.ONFILEINIT:
                        webrtcfile.receivefile(payload);
                        logger.debug("event: ONFILEINIT");
                        break;
                    case appevents.TYPES.ONCHATOFFER:
                        if (payload && payload.contact) {
                            connections.create_receiver(payload.contact);
                            logger.debug("event: ONCHATOFFER");
                        }                        
                        break;
                    case appevents.TYPES.ONSCREENOFFER:
                        if (payload && payload.contact) {
                            webrtcscreen.receive(payload);
                            logger.debug("event: ONSCREENOFFER");
                        }
                        break;
                    case appevents.TYPES.ONUSRKEYINIT:
                        // the user key has been initialized
                        // start the transport listener, so once the user key is created 
                        // then the transport try to connect to various networks
                        var transport = new Transport();
                        transport.init();
                        break;
                    default:
                        break;
                }
            });

            // create the peermsg event handler
            appevents.onPeerMsg(App.peermsg_handler);

            resolve();
        });        
    },

    load: function () {
        try {

            // will throw an exception upon invalid configuration entries
            Config.init();
            logger.create("debug");

            uihandler.init(ko, $);

            Localres()
                .then(() => {
                    uihandler.set_load_info('appload-logger', true);
                    return 
                })
                .then(() => {
                    uihandler.set_load_info('appload-components');
                    return viewreg.load();  
                })
                .then(() => {
                    uihandler.set_load_info('appload-databind');
                    return AppUI();
                })
                .then(() => {
                    logger.debug("Logger is initialized");
                    uihandler.set_load_info('appload-application');

                    // load the application service object that maintains system wide variables
                    return AppSrvc.load(defs.USER_TYPE_HUMAN);
                })
                .then(() => {
                    uihandler.set_load_info('appload-events');
                    return App.create_event_handlers();
                })
                .then(() => {
                    return errhandler.load();
                })                
                .then(() => {
                    uihandler.set_load_info('appload-datadir');
                    return Datadir.makedir();
                })
                .then(() => {
                    uihandler.set_load_info('appload-database');
                    return Database.init();
                })
                .then(() => {
                    App.isdatabase = true;
                    uihandler.set_load_info('appload-settings');
                    return settings.load();
                })
                .then(() => {
                    uihandler.set_load_info('appload-logger', true);
                    return logger.init(settings.loglevel)
                })
                .then(() => {
                    uihandler.set_load_info('appload-accounts');
                    return Accounts.load();
                })
                .then(() => {
                    uihandler.set_load_info('appload-contacts');
                    return contactlist.load();
                })
                .then(() => {
                    uihandler.set_load_info('appload-apputils');
                    return apputils.listen();
                })
                .then(() => {
                    uihandler.set_load_info('appload-contact-handler');
                    return contactsutil.load();
                })
                .then(() => {
                    var bcservice = new BcService();
                    return bcservice.init();
                })
                .then(() => {
                    // determine the start page of the app
                    return apputils.loadstartpage();
                })
                .then(() => {
                    uihandler.unblockwin();
                    uihandler.on_load_complete();
                    logger.info('Application resource initialization is completed');
                    uihandler.set_load_info('appload-complete');
                })
                .catch(function (err) {
                    uihandler.unblockwin();
                    uihandler.on_appload_error(err);                    
                    logger.error("App load error. %j", err);
                });

        }
        catch (err) {
            try {
                uihandler.unblockwin();
            }
            catch (e) { }

            try {
                logger.error("Error in initializing Streembit application: " + err.message);   
            }
            catch (e) { }                   

            if (streembit.notify.error) {
                streembit.notify.error("Error in initializing Streembit application: " + err.message);
            }
            else {
                alert("Error in initalizing App: " + err.message);
            }
        }
    }
}

export default App;


