'use strict';

import Resources from './resources';

import Localization from './localization';

import uihandler from "uihandler";

import AppSrvc from 'appsrvc'
import Components from './viewreg';
import Binder from './bind';
import Config from 'appconfig';
import logger from 'applogger';
import Database from 'database';
import Datadir from 'datadir';
import Accounts from 'accounts';
import StreembitNet from 'streembitnet';
import i18next from 'i18next';
import appevents from "appevents";
import cmdhandler from "cmdhandler";

var App = {

    load: function () {
        try {
            // will throw an exception upon invalid configuration entries
            Config.init();

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
                    return Accounts.load();
                })
                .then(() => {
                    uihandler.set_load_info(i18next.t('appload-components'));
                    return Components.load();
                })
                .then(() => {
                    //return Binder.load(router, AppSrvc);
                    return Binder.load();
                })
                .then(() => {
                    return cmdhandler.listen();
                })
                .then(router => {
                    // initialize, connect to the Streembit network
                    uihandler.set_load_info(i18next.t('appload-streembitconn'));
                    return StreembitNet.init();
                })
                .then(() => {
                    uihandler.unblockwin();
                    uihandler.on_load_complete();
                    console.log('Initialization promise chain is completed');
                    appevents.appinit();
                })
                .catch(function (err) {
                    uihandler.unblockwin();
                    uihandler.on_appload_error(err);
                    logger.error("App load error. %j", err);
                });

        }
        catch (err) {
            if (logger) {
                logger.error("Error in initalizing App: " + err.messsage);
                if (streembit.notify.error) {
                    streembit.notify.error("Error in initalizing App: " + err.messsage);
                }
            }
            else {
                alert("Error in initalizing App: " + err.messsage);
            }
        }
    }
}

export default App;


