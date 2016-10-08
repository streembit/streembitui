'use strict';

import configdef from '../config/config.json!';

let symobj = Symbol();

class Config {

    constructor(singleton) {
        if (symobj !== singleton) {
            throw new Error('Only one singleton instance is allowed.');
        }

        if (!configdef) {
            throw new Error("config.json configration file is missing");
        }

        if (!configdef.appconfig) {
            throw new Error("appconfig section is missing from config.json configration");
        }

        if (!configdef || !configdef.routes) {
            throw new Error("route definition is missing from the config.json configration file");
        }

        this.devmode = configdef.appconfig.isdevmode;
        this.viewroutes = configdef.routes;
        this.appcfg = configdef.appconfig;
    }

    static get instance() {
        if (!this[symobj])
            this[symobj] = new Config(symobj);

        return this[symobj]
    }

    get isdevmode() {
        return this.devmode;
    }
    set isdevmode(value) {
        this.devmode = value;
    }

    get routes() {
        return this.viewroutes;
    }
    set routes(value) {
        this.viewroutes = value;
    }

    get appconfig() {
        return this.appcfg;
    }
    set appconfig(value) {
        this.appcfg = value;
    }

}

export default Config.instance;