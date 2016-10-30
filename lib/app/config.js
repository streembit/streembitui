'use strict';

var configdef = require('./config.json!');

var Config = {

    init: function () {
        if (!configdef) {
            throw new Error("config.json configration file is missing");
        }

        if (!configdef.appconfig) {
            throw new Error("appconfig section is missing from config.json configration");
        }
    }
}

Object.defineProperty(Config, 'isdevmode', {
    get: function () {
        return configdef.appconfig.isdevmode;
    }
})


Object.defineProperty(Config, 'appconfig', {
    get: function () {
        return configdef.appconfig;
    }
})

module.exports = Config;

