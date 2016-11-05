/*

This file is part of Streembit application. 
Streembit is an open source project to create a real time communication system for humans and machines. 

Streembit is a free software: you can redistribute it and/or modify it under the terms of the GNU General Public License 
as published by the Free Software Foundation, either version 3.0 of the License, or (at your option) any later version.

Streembit is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty 
of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU General Public License for more details.

You should have received a copy of the GNU General Public License along with Streembit software.  
If not, see http://www.gnu.org/licenses/.
 
-------------------------------------------------------------------------------------------------------------------------
Author: Tibor Zsolt Pardi 
Copyright (C) 2016 The Streembit software development team
-------------------------------------------------------------------------------------------------------------------------

*/

import $ from 'jquery';
import ko from "knockout";
import i18next from 'i18next';
import i18nextko from "./bindinghandlers/i18next-ko";
import AppSrvc from 'appsrvc';
import appevents from "appevents";


export default function() {
    return new Promise((resolve, reject) => {
        var language = i18next.language;
        i18nextko.init(ko, $, (language || "en"));

        var vm = {
            route: ko.observable(), //router.currentRoute,
            //appsrvc: AppSrvc,

            nav: function (page, params) {
                var navroute = {
                    "page": "",
                    "params": params
                };
                if (page) {
                    navroute.page = page;
                }
                else {
                    if (AppSrvc.account_connected) {
                        console.log("loading streembit app");
                        navroute.page = streembit.view.mainapp || "streembit-app";
                    }
                    else {
                        navroute.page = "initui";
                    }
                }
                vm.route(navroute);
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



