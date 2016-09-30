'use strict';

import ko from "knockout";
import crossroads from "crossroads";
import jssignals from "bower:js-signals@1.0.0.js";
import hasher from "hasher";
import Config from './app/config';

class Router {
    constructor(config) {
        var currentRoute = this.currentRoute = ko.observable('initui');
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
                    self.currentRoute(ko.utils.extend(requestParams, route.params));
                });
            });

            self.activateCrossroads();

            resolve(self);
        });        
    }
}

export default new Router()



