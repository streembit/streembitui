'use strict';

import Resources from './resources';

import Loader from './loader';
import Localization from './localization';

import AppSrvc from './app/appsrvc'
import RouterHandler from './router';
import Components from './components';
import Binder from './bind';
import Router from './router';

import i18next from 'i18next';

class App {
    constructor() { }

    load() {
        //debugger;
        var loader = new Loader("load-info");

        Localization.load()
            .then(() => {
                loader.info = i18next.t('appload-application');
                return AppSrvc.load()
            })
            .then(() => {
                loader.info = i18next.t('appload-components');
                return Components.load()
            })            
            .then(() => {
                return Router.load()
            })
            .then(router => {
                return Binder.load(router, AppSrvc)
            })
            .then(() => {
                $("#load-container").hide();
                $("#navbar-section").show();
                $("#main").show();
                console.log('init chain is completed');
            })
            .catch(function (err) {
                console.log('catch error handler: ' + err);
            });
        
    }
}

export default new App()


