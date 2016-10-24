﻿'use strict';

import Resources from './resources';

import Localization from './localization';

import uihandler from "./app/uihandler";

import AppSrvc from './app/appsrvc'
import RouterHandler from './router';
import Components from './components';
import Binder from './bind';
import Router from './router';
import Config from './app/config';
import logger from './app/logger';
import Database from './app/database';
import Datadir from './app/datadir';
import StreembitNet from './app/streembitnet';

import i18next from 'i18next';

import appevents from "./app/libs/events/AppEvents";


var App = {

    load: function() {

        uihandler.init(ko, $);

        Localization.load()
            .then(() => {
                uihandler.set_load_info(i18next.t('appload-logger'));
                return logger.init(Config.appconfig.loglevel)
            })    
            .then(() => {
                logger.debug("Logger is initialized");
                uihandler.set_load_info(i18next.t('appload-application'));

                // load the application service object that maintains system wide variables
                return AppSrvc.load();
            })   
            .then(() => {
                return Datadir.makedir();
            })   
            .then(() => {
                uihandler.set_load_info(i18next.t('appload-database'));
                return Database.init();
            })       
            .then(() => {
                uihandler.set_load_info(i18next.t('appload-components'));
                return Components.load();
            })            
            .then(() => {
                return Router.load();
            })
            .then(router => {
                return Binder.load(router, AppSrvc);
            })
            .then(router => {
                // initialize, connect to the Streembit network
                uihandler.set_load_info(i18next.t('appload-streembitconn'));
                return StreembitNet.init();
            })
            .then(() => {
                uihandler.on_load_complete();
                console.log('Initialization promise chain is completed');
                appevents.appinit();
            })
            .catch(function (err) {
                uihandler.on_appload_error(err);
                logger.error("App load error. %j", err);
            });   
    }
}

export default App;

