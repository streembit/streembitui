'use strict';

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

    load() {
        return new Promise((resolve, reject) => {
            setTimeout(function () {
                resolve(true);
            }, 1000);            
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