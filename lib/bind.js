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

                nav: function (page, params) {
                    var nav = {
                        "page": "",
                        "params": params
                    };
                    if (page) {
                        nav.page = page;
                    }
                    else {
                        if (AppSrvc.account_connected) {
                            console.log("loading streembit app");
                            nav.page = streembit.view.mainapp || "streembit-app";
                        }
                        else {
                            nav.page = "initui";
                        }
                    }
                    vm.route(nav);
                },

                cmd: function (action) {
                    if (action) {
                        appevents.cmd(action);
                    }
                }
            };

            vm.route({ page: 'initui' });

            appevents.onNavigate(function (page, params) {
                var nav = {
                    "page": "",
                    "params": params
                };
                if (page) {
                    nav.page = page;
                }
                else {
                    if (AppSrvc.account_connected) {
                        console.log("loading streembit app");
                        nav.page = streembit.view.mainapp || "streembit-app";
                    }
                    else {
                        nav.page = "initui";
                    }
                }
                vm.route(nav);
            });

            // KO data binding
            ko.applyBindings(vm); 
            resolve();
        });       
    }
};

export default Binder;


