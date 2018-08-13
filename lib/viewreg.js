/*

This file is part of Streembit application. 
Streembit is an open source communication application. 

Streembit is a free software: you can redistribute it and/or modify it under the terms of the GNU General Public License 
as published by the Free Software Foundation, either version 3.0 of the License, or (at your option) any later version.

Streembit is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty 
of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU General Public License for more details.

You should have received a copy of the GNU General Public License along with Streembit software.  
If not, see http://www.gnu.org/licenses/.
 
-------------------------------------------------------------------------------------------------------------------------
Author: Tibor Zsolt Pardi 
Copyright (C) Streembit 2017
-------------------------------------------------------------------------------------------------------------------------

*/

'use strict';
(function () {

    //var ko = require("knockout");
    //var abouttpl = require('./app/views/about/about.html!text');
    var emptytpl = require('./app/views/empty/view.html!text');

    var viewregister = {};

    viewregister.load = function () {
        return new Promise((resolve, reject) => {
            // this is need for knockout to make sure the require exists from the AMD loader
            if (!window['require']) {
                window['require'] = SystemJS && SystemJS.amdRequire ? SystemJS.amdRequire : 0;
            }

            ko.components.register('errorview', { require: './lib/app/views/errorview/errorview' });
            ko.components.register('initui', { require: './lib/app/views/initui/initui' });
            ko.components.register('dashboard', { require: './lib/app/views/dashboard/dashboard' });
            ko.components.register('activity', { require: './lib/app/views/activity/activity' });
            ko.components.register('mobileactivity', { require: './lib/app/views/mobileactivity/mobileactivity' });
            ko.components.register('connection', { require: './lib/app/views/connection/connection' });
            ko.components.register('enrollinit', { require: './lib/app/views/enrollinit/enrollinit' });
            ko.components.register('enroll', { require: './lib/app/views/enroll/enroll' });
            ko.components.register('initaccount', { require: './lib/app/views/init-account/initaccount' });
            ko.components.register('createaccount', { require: './lib/app/views/create-account/createaccount' });
            ko.components.register('changepassword', { require: './lib/app/views/change-password/changepwd' });
            ko.components.register('netinfo', { require: './lib/app/views/netinfo/netinfo' });
            ko.components.register('settings', { require: './lib/app/views/settings/settings' });
            ko.components.register('contacts-bar', { require: './lib/app/views/contacts-bar/contactsbar' });
            ko.components.register('contact', { require: './lib/app/views/contact/contact' });
            ko.components.register('contact-chat', { require: './lib/app/views/contact-chat/contactchat' });
            ko.components.register('video-call', { require: './lib/app/views/contact-videocall/videocall' });
            ko.components.register('video-panel', { require: './lib/app/modules/video-small-panel/videopanel' });
            ko.components.register('audio-call', { require: './lib/app/views/contact-audiocall/audiocall' });
            ko.components.register('audio-panel', { require: './lib/app/modules/audio-small-panel/audiopanel' });
            ko.components.register('sendfile', { require: './lib/app/views/sendfile/sendfilevm' });
            ko.components.register('help', { require: './lib/app/views/help/helpvm' });
            ko.components.register('help-overview_', { require: './lib/app/views/help-overview_/help-overview_' });
            ko.components.register('help-setup-configuration_', { require: './lib/app/views/help-setup-configuration_/help-setup-configuration_' });
            ko.components.register('help-streembit-network_', { require: './lib/app/views/help-streembit-network_/help-streembit-network_' });
            ko.components.register('help-security-and-encryption_', { require: './lib/app/views/help-security-and-encryption_/help-security-and-encryption_' });
            ko.components.register('screenreceive', { require: './lib/app/views/screenreceive/screenreceivevm' });
            ko.components.register('screenshare', { require: './lib/app/views/screenshare/screensharevm' });
            ko.components.register('offline-contact-request', { require: './lib/app/views/offline-cont-request/offlinerequest' });
            ko.components.register('my-contacts', {require: './lib/app/views/my-contacts/mycontacts' });
            ko.components.register('accept-contact-request', { require: './lib/app/views/accept-cont-request/acceptcontrequest' });
            ko.components.register('logs', { require: './lib/app/views/logs/logs' });
            ko.components.register('certificates', { require: './lib/app/views/certificates/certificates' });
            ko.components.register('tasks', { require: './lib/app/views/tasks/tasksvm' });
            ko.components.register('addiothub', { require: './lib/app/views/addiothub/addiothub.js' });
            ko.components.register('addiotdevice', { require: './lib/app/views/addiotdevice/addiotdevice.js' });
            ko.components.register('devices', { require: './lib/app/views/devices/devices.js' });
            ko.components.register('wallet', { require: './lib/app/views/wallet/walletvm.js' });
            ko.components.register('emptyview', { template: emptytpl });

            resolve();
        });
    }

    module.exports = viewregister;

}());