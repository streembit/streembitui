'use strict';

var ecckey = require('cryptlib');

(function () {
    var ko, $;
    var appevents = require("appevents");
    var util = require("util");

    var components = {

        load: function (knockout, jquery) {
            ko = knockout || window.ko;
            $ = jquery || window.$;

            util.format("a");
        }
    };

    module.exports = components;
}());




/*
import ko from "knockout";

// about
import abouttpl from './app/components/about/about.html!text';
// navbar
import navbartpl from './app/components/navbar/navbar.html!text';
import NavBarVm from './app/components/navbar/navbar';
// initUI
import inituitpl from './app/components/initui/initui.html!text';
import InitUIVm from './app/components/initui/initui';
// contacts bar
import contactsbartpl from './app/components/contacts-bar/contacts-bar.html!text';
import ContactsBarVm from './app/components/contacts-bar/contacts-bar';
// create account
import createaccountpl from './app/components/create-account/createaccount.html!text';
import CreateAccountVm from './app/components/create-account/createaccount';
// netinfo
import netinfotpl from './app/components/netinfo/netinfo.html!text';
import NetinfoVm from './app/components/netinfo/netinfo';
//connect-public
import connectpublictpl from './app/components/connect-public/connectpublic.html!text';
import ConnectPublicVm from './app/components/connect-public/connectpublic';


var Components = {

    load: function() {
        //debugger;

        return new Promise((resolve, reject) => {
            ko.components.register(
                'navbar',
                {
                    viewModel: NavBarVm,
                    template: navbartpl
                }
            );

            ko.components.register('initui',
                {
                    viewModel: InitUIVm,
                    template: inituitpl
                }
            );

            ko.components.register('about', {
                template: abouttpl
            });

            ko.components.register('contactsbar',
                {
                    viewModel: ContactsBarVm,
                    template: contactsbartpl
                }
            );

            ko.components.register('createaccount',
                {
                    viewModel: CreateAccountVm,
                    template: createaccountpl
                }
            );

            ko.components.register('netinfo',
                {
                    viewModel: NetinfoVm,
                    template: netinfotpl
                }
            );

            ko.components.register('connectpublic',
                {
                    viewModel: ConnectPublicVm,
                    template: connectpublictpl
                }
            );

            resolve();
        });
    }
}


export default Components;

*/

//(function () {

//    var components = {};

//    components.load = function () {

//        ko.components.register('initui',
//            {
//                viewModel: { require: './app/components/initui/initui'},
//                template: { require: './app/components/initui/initui.html!text' }
//            }
//        );
//    }

//    module.exports = components;

//})();