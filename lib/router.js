'use strict';

import ko from "knockout";
import crossroads from "crossroads";
import jssignals from "js-signals";
import hasher from "hasher";
import Config from 'appconfig';
import appevents from "appevents";

class Router {
    constructor(config) {
        this.currentRoute = ko.observable('initui');
    }

    activateCrossroads() {

        function parseHash(newHash, oldHash) {
            crossroads.parse(newHash);
        }

        crossroads.normalizeFn = crossroads.NORM_AS_OBJECT;
        hasher.initialized.add(parseHash);
        hasher.changed.add(parseHash);
        hasher.init();
    }

    load() {
        if (!Config.routes) {
            throw new Error("routes parameter is required");
        }

        var routes = Config.routes;

        var self = this;
        return new Promise((resolve, reject) => {
            ko.utils.arrayForEach(routes, function (route) {
                crossroads.addRoute(route.url, function (requestParams) {
                    var request = ko.utils.extend(requestParams, route.params);
                    self.currentRoute(request);
                });
            });

            self.activateCrossroads();

            resolve(self);
            self.navigate_handler();
        });        
    }

    navigate_handler() {
        var self = this;
        //appevents.on(appevents.UINAVIGATE, function (value) {
        appevents.onNavigate(function (value) {
            if (!value) {
                return;
            }
            var request = { "page": value };
            self.currentRoute(request);
        });
    }
}

export default new Router()



