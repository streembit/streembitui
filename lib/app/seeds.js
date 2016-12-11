'use strict';

import config from './config';
import settings from './settings';

const LIST = 0;
const ANYCAST = 1;

const DEFAULT_STREEMBIT_PORT = 32320;

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
                if (!item.address || typeof item.address != "string" || item.address.trim().length == 0) {
                    throw new Exception("Application error: address for a seed is required")
                }
                if (!item.port) {
                    item.port = DEFAULT_STREEMBIT_PORT;
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