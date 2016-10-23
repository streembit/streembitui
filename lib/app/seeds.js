'use strict';

import config from './config';

const LIST = 0;
const ANYCAST = 1;

class Seeds {
    constructor() {
    }

    loadConfigSeeds(callback) {
        if (!config.appconfig || !config.appconfig.bootseeds || !Array.isArray(config.appconfig.bootseeds)) {
            return callback("Invalid seeds in the config file")
        }

        callback(null, config.appconfig.bootseeds);
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