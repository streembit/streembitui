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

import appevents from "appevents";
import logger from 'applogger';
import IotHubs from './transport_iothubs';

export default class {

    constructor() {
        this.iothubs = null;
    }

    transportscheck() {
        setInterval(() => {
            try {
                this.iothubs.check_connections();
            }
            catch (err) {
                logger.error("transport init error: %j", err);
            }
        },
        60000);
    }

    init() {
        try {
            logger.debug("transport init");

            // create the Streembit P2P KAD connection

            // create connection to IoT hubs
            this.iothubs = new IotHubs();
            this.iothubs.init();

            // start the health check monitor
            this.transportscheck();

            //
        }
        catch (err) {
            logger.error("transport init error: %j", err);
        }
    }

}

 