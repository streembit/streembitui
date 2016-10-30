'use strict';

(function () {

    var ko = require("knockout");
    var abouttpl = require('./app/views/about/about.html!text');

    var uicomp = {};

    uicomp.load = function () {
        return new Promise(function (resolve, reject) {

            // this is need for knockout to make sure the require exists from the AMD loader
            if (!window['require']) {
                window['require'] = SystemJS && SystemJS.amdRequire ? SystemJS.amdRequire : 0;
            }

            ko.components.register('initui', { require: './lib/app/views/initui/initui' });
            ko.components.register('connectpublic', { require: './lib/app/views/connect-public/connectpublic' });
            ko.components.register('createaccount', { require: './lib/app/views/create-account/createaccount' });
            ko.components.register('netinfo', { require: './lib/app/views/netinfo/netinfo' });
            ko.components.register('settings', { require: './lib/app/views/settings/settings' });
            ko.components.register('about', { template: abouttpl });

            resolve();
        });
    }

    module.exports = uicomp;

}());