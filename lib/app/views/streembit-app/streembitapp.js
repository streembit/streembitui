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

    define(['knockout', 'appevents', './streembitapp.html!text'], function (ko, appevents, template) {

        function StreembitAppVm() {
            var viewModel = {
                viewname: ko.observable("emptyview"),
                viewparams: ko.observable(),

                dispose: function () {
                    console.log("StreembitAppVm dispose");
                    appevents.removeSignal("on-account-messages", this.onAccountMessages);
                    appevents.removeSignal("on-contact-selected", this.onContactSelect);
                    appevents.removeSignal("display-view", this.displayview);
                },

                init: function (callback) {
                    try {
                        //  listen here for account messages
                        appevents.addListener("display-view", this.displayview);
                        appevents.addListener("on-account-messages", this.onAccountMessages);
                        appevents.addListener("on-contact-selected", this.onContactSelect);
                    }
                    catch (err) {
                        streembit.notify.error("Settings init error: %j", err);
                    }
                },

                displayview: function (view, params) {
                    try {
                        viewModel.viewname(view);
                        viewModel.viewparams(params);
                    }
                    catch (err) {
                        streembit.notify.error("Error in displaying the view: %j", err);
                    }                    
                },

                onAccountMessages: function (messages) {
                    if (!messages || !Array.isArray(messages)) { return }

                    viewModel.displayview("account-messages", messages);
                },

                onContactSelect: function (contact) {
                    viewModel.displayview("contact-details", contact);
                }
            };

            viewModel.init();

            return viewModel;
        }           

        return {
            viewModel: StreembitAppVm,
            template: template
        };
    });

}());



