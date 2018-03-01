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

import config from './config';
import settings from './settings';
import defs from "definitions";
import errcodes from "errcodes";
import errhandler from "errhandler";

const LIST = 0;
const ANYCAST = 1;

class Seeds {
    constructor() {
    }

    loadConfigSeeds(callback) {
        try {
            if (!settings || !settings.bootseeds || !Array.isArray(settings.bootseeds)) {
                return callback("Invalid seeds in the settings database")
            }

            var seeds = settings.bootseeds;
            // ensure the ports of the seeds are correct
            seeds.forEach(function (item, index, array) {
                if (!item.host || typeof item.host != "string" || item.host.trim().length == 0) {
                    // throw new Error("Application error: address for a seed is required")
                    throw new Error(errhandler.getmsg(errcodes.UI_APP_ERR_ADDRESS_SEED_REQ))
                }
                if (!item.port) {
                    item.port = defs.DEFAULT_SEED_PORT;
                }
            });

            callback(null, seeds);
        }
        catch (e) {
            callback(e);
        }
    }

    loadAnycastSeeds(callback) {
        return callback("Anycast seed handling is not implemented")
    }

    seedFactory(callback) {
        var mode = config.appconfig.seedmode;
        switch (mode) {
            case ANYCAST:
                this.loadAnycastSeeds(callback)
                break;
            default:
                this.loadConfigSeeds(callback);
                break;
        }
    }

    load(callback) {
        return this.seedFactory(callback);
    }

}

export default new Seeds();