'use strict';

(function () {

    var ko = require("knockout");
    var abouttpl = require('./app/components/about/about.html!text');

    var uicomp = {};

    uicomp.load = function () {
        return new Promise(function (resolve, reject) {

            if (!window['require']) {
                window['require'] = SystemJS && SystemJS.amdRequire ? SystemJS.amdRequire : 0;
            }

            ko.components.register('initui', { require: './lib/app/components/initui/initui' });
            ko.components.register('connectpublic', { require: './lib/app/components/connect-public/connectpublic' });
            ko.components.register('createaccount', { require: './lib/app/components/create-account/createaccount' });
            ko.components.register('about', { template: abouttpl });

            resolve();
        });
    }

    module.exports = uicomp;

}());