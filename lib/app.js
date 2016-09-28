import $ from 'jquery';
import bootstrap from 'bootstrap';

import config from './config/config.json!';

// load the resources
import 'bootstrap/css/bootstrap.css!';
import 'font-awesome/css/font-awesome.css!';
import './css/streembit.css!';

import ko from "knockout";

import AppSrvc from './app/appsrvc'
import RouterHandler from './router';
import UiComponents from './uicomponents';

class App {
    constructor() { }

    registerComponents() {
        UiComponents.load();
    }

    load() {
        //debugger;

        // register the UI components for routing
        this.registerComponents();

        // create the router
        var router = RouterHandler.load();

        // KO data binding
        ko.applyBindings({ route: router.currentRoute, appsrvc: AppSrvc });
    }
}

export default new App()

