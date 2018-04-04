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
Author: Streembit team
Copyright (C) Streembit 2017
-------------------------------------------------------------------------------------------------------------------------
*/

'use strict';


import defs from "definitions";

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
import settings from "settings";
import contactsutil from "contactsutil";
import peercomm from "peercomm";
import contactlist from "contactlist";
import errhandler from "./errorhandler";
import webrtcfile from "webrtcfile";
import connections from "connections";
import webrtcscreen from "webrtcscreen";
import transport from "transport";
import BcService from "bcservice";
import tasks from "tasks";
import apputils from "apputils";
import iothubhander from "iothandler";

export default class {
    constructor() {
        this.isdatabase = false;
    }

    //
    // Global even handler
    //
    create_event_handlers () {
        return new Promise((resolve, reject) => {

            // create an application wide event handler
            // to try to have less opened event handler
            appevents.onAppEvent(
                (eventcmd, payload, info) => {
                    try {
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
                                transport.init();
                                break;
                            case appevents.TYPES.ONTRANSPORTINIT:
                                // the transport has been initialized
                                // start additional services
                                iothubhander.init();
                                break;
                            case appevents.TYPES.ONIOTHUBADDED:
                                try {
                                    // the transport has been initialized
                                    // start additional services
                                    console.log('PL', payload)
                                    iothubhander.createhub_byid(payload, (err) => {
                                        console.log(err)
                                        if (err) {
                                            streembit.notify.error("Add IoT hub error: %j", err);
                                        }
                                        else {
                                            //navigate to the devices section
                                            appevents.navigate("devices");
                                        }
                                    });
                                }
                                catch (e) {
                                    streembit.notify.error("Add IoT hub error:: %j", e);
                                }
                                break
                            case appevents.TYPES.ONWSMSGRECEIVE:
                                peercomm.onPeerMessage(payload);
                                break
                            case appevents.TYPES.ONPEERSEND:
                                transport.peersend(payload);
                                break;
                            case appevents.TYPES.ONNETSEND:
                                transport.netsend(payload);
                                break;                           
                            case appevents.TYPES.ONAPPNETFAILED:
                                // the connection was broken or failed, need to recreate it
                                transport.netstart();
                                break;                                
                            default:
                                break;
                        }
                    }
                    catch (err) {
                        logger.error("Error in application event handler %j", err.message);
                    }
                }
            );

            resolve();
        });
    }

    async load() {
        try {

            // will throw an exception upon invalid configuration entries
            Config.init();
            logger.create("debug");

            uihandler.init(ko, $);

            await Localres();

            // create the tasks handler
            await tasks.load();

            uihandler.set_load_info('appload-logger', true);
            await viewreg.load();

            uihandler.set_load_info('appload-databind');
            await AppUI();

            logger.debug("Logger is initialized");
            uihandler.set_load_info('appload-application');

            // load the application service object that maintains system wide variables
            await AppSrvc.load(defs.USER_TYPE_HUMAN);
                
            uihandler.set_load_info('appload-events');
            await this.create_event_handlers();                
                
            await errhandler.load();                                
                
            uihandler.set_load_info('appload-datadir');
            await Datadir.makedir();                
                
            uihandler.set_load_info('appload-database');
            await Database.init();                
                
            this.isdatabase = true;
            uihandler.set_load_info('appload-settings');
            await settings.load();                
                
            uihandler.set_load_info('appload-logger', true);
            await logger.init(settings.loglevel);                
                
            uihandler.set_load_info('appload-accounts');
            await Accounts.load();                
                
            // update the settings if any account exists
            var exists = Accounts.count() > 0;
            await settings.refresh_accountexists(exists);                
                
            uihandler.set_load_info('appload-contacts');
            await contactlist.load();                
                
            uihandler.set_load_info('appload-contact-handler');
            await contactsutil.load();                
                
            var bcservice = new BcService();
            await bcservice.init();       

            await connections.init();
                
            //determine the start page of the app
            await apputils.loadstartpage();                
                
            uihandler.unblockwin();
            uihandler.on_load_complete();
            logger.info('Application resource initialization is completed');
            uihandler.set_load_info('appload-complete');                

            // ublock the window
            uihandler.unblockwin();

            //
        }
        catch (err) {
            try {
                uihandler.unblockwin();
            }
            catch (e) { }

            try {
                uihandler.on_appload_error(err);
            }
            catch (e) { }

            try {
                logger.error("Error in initializing Streembit application: " + err.message);
            }
            catch (e) { }

            if (streembit.notify.error) {
                // streembit.notify.error("Error in initializing Streembit application: " + err.message);
                streembit.notify.error(errhandler.getmsg(errcodes.UI_ERR_INITIALIZING_STR_APP) + err.message);
                streembit.notify.error(errhandler.getmsg(errcode))
            }
            else {
                alert("Error in initalizing App: " + err.message);
            }
        }        
    }

}

