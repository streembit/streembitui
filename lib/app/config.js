'use strict';

var configdef = require('../config/config.json!');

var Config = {

    init: function () {

        if (!configdef) {
            throw new Error("config.json configration file is missing");
        }

        if (!configdef.appconfig) {
            throw new Error("appconfig section is missing from config.json configration");
        }

        if (!configdef.routes) {
            throw new Error("route definition is missing from the config.json configration file");
        }
    }
}

Object.defineProperty(Config, 'isdevmode', {
    get: function () {
        return configdef.appconfig.isdevmode;
    }
})

Object.defineProperty(Config, 'routes', {
    get: function () {
        return configdef.routes;
    }
})

Object.defineProperty(Config, 'appconfig', {
    get: function () {
        return configdef.appconfig;
    }
})

module.exports = Config;

