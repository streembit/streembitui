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
        var localization = new Localization();    

        localization.load()
            .then(() => {
                var info = i18next.t('appload-streembit');
                loader.info = info;
                return Components.load()
            })
            .then(() => {
                return AppSrvc.load()
            })
            .then(() => {
                return Router.load()
            })
            .then(router => {
                return Binder.load(router, AppSrvc)
            })
            .then(() => {
                console.log('init chain is completed');
                //$("#load-container").hide();
                //$("#navbar-section").show();
                //$("#main").show();
            })
            .catch(function (err) {
                console.log('catch error handler: ' + err);
            });

        /*
        Components.load()
            .then(() => {
                return AppSrvc.load()
            })
            .then(() => {
                return Router.load()
            })
            .then(router => {
                return Binder.load(router, AppSrvc)
            })
            .then(() => {
                console.log('init chain is completed');
                $("#load-container").hide();
                $("#navbar-section").show();
                $("#main").show();
            })
            .catch(function (err) {
                console.log('catch error handler: ' + err);
            });
        */
    }
}

export default new App()


