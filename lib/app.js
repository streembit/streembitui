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
import logger from './app/logger';
import Database from './app/database';
import Datadir from './app/datadir'

import i18next from 'i18next';

import AppEvents from "./app/streembitlib/events/AppEvents";

//import elliptic from "elliptic";

import slib from "./app/streembitlib/libs";

var App = {

    load: function() {
        debugger;

        var a = slib.message.getpayload();

        var key = new slib.crypto.EccKey('secp256k1');
        var publickey = key.publicKeyHex;

        //var EC = elliptic.ec;

        //// Create and initialize EC context
        //// (better do it once and reuse it)
        //var ec = new EC('secp256k1');

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
                return Datadir.makedir();
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


