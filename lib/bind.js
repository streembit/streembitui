import $ from 'jquery';
import ko from "knockout";
import i18next from 'i18next';
import i18nextko from "./bindinghandlers/i18next-ko";
import AppSrvc from 'appsrvc';
import appevents from "appevents";

var Binder = {
    load: function () {  //function (router, appsrvc) {
        return new Promise((resolve, reject) => {
            var language = i18next.language;
            i18nextko.init(ko, $, language);

            var vm = {
                route: ko.observable(), //router.currentRoute,
                appsrvc: AppSrvc,

                nav: function (page) {
                    if (!page) {
                        page = 'initui';
                    }
                    vm.route({ page: page });
                },

                cmd: function (action) {
                    if (action) {
                        appevents.cmd(action);
                    }
                }
            };

            vm.route({ page: 'initui' });

            appevents.onNavigate(function (page, params) {
                if (page) {
                    var nav = { "page": page, "params": params };
                    vm.route(nav);
                }
            });

            // KO data binding
            ko.applyBindings(vm); //{ route: router.currentRoute, appsrvc: appsrvc });
            resolve();
        });       
    }
};

export default Binder;


