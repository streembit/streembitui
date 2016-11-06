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
import apputils from "apputils";
import appsrvc from "appsrvc";
import user from "user";

function MainVM() {
    var viewModel = {
        route: ko.observable({ page: 'initui' }),

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

            viewModel.route(navroute);
        },

        cmd: function (action) {
            if (action) {
                switch (action) {
                    case 'delete-account':
                        console.log("cmd: " + action);
                        break;
                    default:
                        appevents.cmd(action);
                        break;
                }
            }
        },

        onNavigate: function (page, params) {
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

            viewModel.route(nav);
        },

        deleteAccount: function () {
            console.log("cmd: deleteAccount");
            apputils.delete_account(function () {
                appsrvc.reset_account();
                user.clear();
                streembit.ui.reset_title();
                viewModel.route({ page: 'initui' });
            });
        },

        backupAccount: function () {
            console.log("cmd: backupAccount");
            apputils.backup_account();            
        },

        restoreAccount: function () {
            console.log("cmd: restoreAccount");
            apputils.restore_account(function () {
                console.log("account restored")
            });
        }
    };

    return viewModel;
}

export default function() {
    return new Promise((resolve, reject) => {
        // initialize the locals/languages binding handlers
        var language = i18next.language;
        i18nextko.init(ko, $, (language || "en"));

        // initialize the main viewmodel
        var vm = new MainVM();
        appevents.onNavigate(vm.onNavigate);
        // KO data binding
        ko.applyBindings(vm);

        resolve();
    });       
}



