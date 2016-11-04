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

'use strict';

(function () {

    var ko = require("knockout");
    var abouttpl = require('./app/views/about/about.html!text');
    var emptyviewtpl = require('./app/views/empty/view.html!text');

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
            ko.components.register('streembit-app', { require: './lib/app/views/streembit-app/streembitapp' });
            ko.components.register('contacts-bar', { require: './lib/app/views/contacts-bar/contactsbar' });
            ko.components.register('account-messages', { require: './lib/app/views/account-messages/accountmsg' });
            ko.components.register('contact-details', { require: './lib/app/views/contact-details/contactdetails' });
            ko.components.register('contact-chat', { require: './lib/app/views/contact-chat/contactchat' });
            ko.components.register('video-call', { require: './lib/app/views/contact-videocall/videocall' });

            ko.components.register('about', { template: abouttpl });
            ko.components.register('emptyview', { template: emptyviewtpl });

            resolve();
        });
    }

    module.exports = uicomp;

}());