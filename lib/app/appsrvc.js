import ko from "knockout";

class AppSrvc {
    constructor() {
        this.is_network_ready = ko.observable(false);
    }

    load() {
        return new Promise((resolve, reject) => {
            //reject('appservc error');
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


export default new AppSrvc()