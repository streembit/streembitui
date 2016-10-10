'use strict';

import Resources from './resources';

import Localization from './localization';

import uihandler from "./app/uihandler";

import AppSrvc from './app/appsrvc'
import RouterHandler from './router';
import Components from './components';
import Binder from './bind';
import Router from './router';
import Config from './app/config';
import logger from './app/logger'
import Database from './app/database'

import i18next from 'i18next';

import AppEvents from "./streembitlib/events/AppEvents"

var App = {

    load: function() {
        //debugger;
        uihandler.init(ko, $);

        Localization.load()
            .then(() => {
                uihandler.set_load_info(i18next.t('appload-logger'));
                return logger.init(Config.appconfig.loglevel)
            })    
            .then(() => {
                logger.debug("Logger is initialized");
                uihandler.set_load_info(i18next.t('appload-application'));
                return AppSrvc.load()
            })   
            .then(() => {
                uihandler.set_load_info(i18next.t('appload-database'));
                return Database.init();
            })       
            .then(() => {
                uihandler.set_load_info(i18next.t('appload-components'));
                return Components.load()
            })            
            .then(() => {
                return Router.load()
            })
            .then(router => {
                return Binder.load(router, AppSrvc)
            })
            .then(() => {
                uihandler.on_load_complete();
                console.log('init chain is completed');

                AppEvents.emit(AppEvents.APP_INIT);
            })
            .catch(function (err) {
                logger.error("App load error. %j", err);
            });
        
    }
}

export default App;


