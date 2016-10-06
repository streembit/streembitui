import $ from 'jquery';
import ko from "knockout";
import i18next from 'i18next';
import i18nextko from "./bindinghandlers/i18next-ko";

class Binder {
    constructor() { }

    load(router, appsrvc) {        
        return new Promise((resolve, reject) => {
            debugger;
            var language = i18next.language;
            i18nextko.init(ko, $, language);
            // KO data binding
            ko.applyBindings({ route: router.currentRoute, appsrvc: appsrvc });
            resolve();
        });        
    }
}

export default new Binder()