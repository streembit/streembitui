'use strict';

import $ from 'jquery';
import bootstrap from 'bootstrap';

// load the resources
import 'bootstrap/css/bootstrap.css!';
import 'font-awesome/css/font-awesome.css!';
import './css/streembit.css!';

import ko from "knockout";

import AppSrvc from './app/appsrvc'
import RouterHandler from './router';
import Components from './components';
import Binder from './bind';
import Router from './router';

class App {
    constructor() { }

    load() {
        debugger;

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
            })
            .catch(function (err) {
                console.log('catch error handler: ' + err);
            });
    }
}

export default new App()

