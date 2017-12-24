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


import appevents from "appevents";
import logger from 'applogger';
import devbctansport from 'devbctansport';

let m_bctransport = null;

class BcService {

    constructor() {    
        this.bctransport = null;
        this.eventListeners = [];
    }

    static get bctransport() {
        return m_bctransport;
    }

    static set bctransport(value) {
        m_bctransport = value;
    }


    onBcCommand(payload) {
        try {
            console.log("onBcCommand");
            if (!BcService.bctransport) {
                // the this.bctransport object must be initialized
                return logger.error("invalid bctransport at bcservice.onBcCommand");
            }

            var command = payload.cmd;
            if (!command || typeof command != "string" || !command.length) {
                return logger.error("invalid command at bcservice.onBcCommand, command must be a valid string");
            }

            var callback = payload.callback;
            if (callback) {
                if (typeof callback != "function") {
                    return logger.error("invalid callback at bcservice.onBcCommand, callback must be a function");
                }
            }

            // validate the data item for commands that expect data
            switch (command) {
                case "txlist":
                case "receive":
                case "send":
                    if (!payload.data) {
                        return callback("invalid data parameter at bcservice.onBcCommand, data exists for " + command);
                    }
                    break;
                default:
                    break;
            }

            switch (command) {
                case "send":
                    BcService.bctransport.send(payload.data, callback);
                    break;
                default:
                    callback("invalid callback at bcservice.onBcCommand, callback must be a function");
            }
        }
        catch (err) {
            var errmsg = "onBcCommand exception: " + err.message;
            if (payload && payload.callback && typeof callback == "function") {
                payload.callback(errmsg);
            }
            else {
                logger.error(errmsg);
            }
        }
    }

    onBcEvent(payload) {

    }

    init() {
        return new Promise(
            (resolve, reject) => {
                try {
                    logger.debug("bcservice init");

                    if (streembit.globals.devbcnet) {
                        BcService.bctransport = devbctansport;
                    }
                    else {
                        //TODO live bc transport
                        return reject("live BC transport is not implemented. Set the streembit.globals.devbcnet flag to true to use the DEV bc transport.")
                    }

                    BcService.bctransport.init();

                    // create an event handlers
                    appevents.addListener("on-bc-command", this.onBcCommand);
                    appevents.addListener("on-bc-event", this.onBcEvent);

                    resolve();

                    //
                }
                catch (err) {
                    reject("bchandler init error: " + err.message);
                }
            }
        );       
        
    }

}

export default BcService;


