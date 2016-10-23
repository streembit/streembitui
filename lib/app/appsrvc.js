'use strict';

import appevents from "./libs/events/AppEvents"
import logger from './logger'

let symobj = Symbol();

class AppSrvc {
    constructor(singleton) {
        if (symobj !== singleton) {
            throw new Error('Only one singleton instance is allowed.');
        }
        this.is_network_ready = ko.observable(false);
    }

    static get instance() {
        if (!this[symobj])
            this[symobj] = new AppSrvc(symobj);

        return this[symobj]
    }

    createDataDir(callback) {
        
    }

    load() {
        return new Promise((resolve, reject) => {

            appevents.onAppInit(function () {
                logger.info("Application is intialized");
            });

            resolve(true);         
        });
    }

    get network_ready() {
        return this.is_network_ready;
    }

    set network_ready(value) {
        this.is_network_ready(value);
    }
}

export default AppSrvc.instance