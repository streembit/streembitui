import ko from "knockout";
import crossroads from "crossroads";
import jssignals from "bower:js-signals@1.0.0.js";
import hasher from "hasher";

class Router {
    constructor(config) {
        var currentRoute = this.currentRoute = ko.observable('initui');

        ko.utils.arrayForEach(config.routes, function (route) {
            crossroads.addRoute(route.url, function (requestParams) {
                //console.log(requestParams);
                currentRoute(ko.utils.extend(requestParams, route.params));
            });
        });

        this.activateCrossroads();
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
}

class RouterHandler {
    load() {
        return new Router({
            routes: [
                { url: '', params: { page: 'initui' } },
                { url: 'connect-to-public', params: { page: 'connect-to-public' } },
                { url: 'contacts-bar', params: { page: 'contacts-bar' } },
                { url: 'about', params: { page: 'about' } }
            ]
        });
    }
}

export default new RouterHandler()



