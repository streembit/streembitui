import ko from "knockout";

class Binder {
    constructor() { }

    load(router, appsrvc) {
        //debugger;
        return new Promise((resolve, reject) => {
            // KO data binding
            ko.applyBindings({ route: router.currentRoute, appsrvc: appsrvc });
            resolve();
        });        
    }
}

export default new Binder()