/*

This file is part of STREEMBIT application. 
STREEMBIT is an open source project to manage reliable identities. 

STREEMBIT is a free software: you can redistribute it and/or modify it under the terms of the GNU General Public License 
as published by the Free Software Foundation, either version 3.0 of the License, or (at your option) any later version.

STREEMBIT is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty 
of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU General Public License for more details.

You should have received a copy of the GNU General Public License along with STREEMBIT software.  
If not, see http://www.gnu.org/licenses/.
 
-------------------------------------------------------------------------------------------------------------------------
Author: Tibor Zsolt Pardi 
Copyright (C) Authenticity Institute 2017
-------------------------------------------------------------------------------------------------------------------------

*/

'use strict';

(function () {

    const maxmsg = 10;

    define(['appevents', 'appsrvc', 'contactlist', 'peercomm', 'peermsg', './activity.html!text'], function (appevents, appsrvc, contactlist, peercomm, peermsg, template) {

        function ActivityVm() {
            var viewModel = {
                activitymsg: ko.observable(),
                msgcount: ko.observable(0),
                notifycount: ko.observable(0),
                errorcount: ko.observable(0),
                lastupdate: ko.observable(Date.now()),
                list_of_errors: ko.observableArray([]),
                list_of_notifications: ko.observableArray([]),
                list_of_messages: ko.observableArray([]),
                template: ko.observable('error-activity-template'),
                contentShow: ko.observable(false),
                contentShowNot: ko.observable(false),
                contentShowMessage: ko.observable(false),
                contentShowError: ko.observable(false),
                msgTriangle: ko.observable(false),
                ntfTriangle: ko.observable(false),
                errTriangle: ko.observable(false),
                messages: ko.observableArray([]),
                localdatemsg: ko.observable(Date.now()),
               
                dispose: function () {
                    appevents.removeSignal("oncontactevent", this.onContactEvent);
                },

                init: function (callback) {
                    appevents.addListener("on-activity", viewModel.onactivity);
                               
                },

                onContactEvent: function (event, payload, param, data) {
                    switch (event) {
                        case "on-activity":
                            viewModel.onactivity(payload, param, data);
                            break;
                        case "on-text-message":
                            viewModel.onTextMessage(payload, param, data);
                            break;
                        default:
                            break;
                    }
                },

                onactivity: function (activity) {
                    if (!activity || !activity.type || !activity.msg) {
                        return;
                    }

                    if (!activity.time) {
                        activity.time = Date.now();
                    }

                    viewModel.lastupdate(activity.time);

                    let type = activity.type;
                    let count, len;
                    switch (type) {
                        case "error":
                            count = viewModel.errorcount();
                            viewModel.errorcount(count + 1);
                            viewModel.list_of_errors.unshift(activity);
                            len = viewModel.list_of_errors().length;
                            if (len > maxmsg) {
                                viewModel.list_of_errors.pop();
                            }
                            break;
                        case "notify":
                            count = viewModel.notifycount();
                            viewModel.notifycount(count + 1);
                            viewModel.list_of_notifications.unshift(activity);
                            len = viewModel.list_of_notifications().length;
                            if (len > maxmsg) {
                                viewModel.list_of_notifications.pop();
                            }
                            break;
                        case "msg":
                            count = viewModel.msgcount();
                            viewModel.msgcount(count + 1);
                            viewModel.list_of_messages.unshift(activity);
                            len = viewModel.list_of_messages().length;
                            if (len > maxmsg) {
                                viewModel.list_of_messages.pop();
                            }
                            break;
                        default:
                            break;
                    }
                },

                onTextMessage: function (sender, data){
                    var contacts = contactlist.contacts;
                    for (var i = 0; i < contacts.length; i++) {
                         
                         viewModel.localdatemsg(sender.time);

                         if (contacts[i].name == sender.sender) {
                                    
                            let countmsg;

                            var date = new Date();
                            var dateToStr = date.toLocaleString();
                            
                            viewModel.messages.unshift({text: sender.text, isSendMsg: true, senderName: sender.sender, sendMsgTime: dateToStr});
                            
                            countmsg = viewModel.msgcount();
                            viewModel.msgcount(countmsg + 1);

                            break;
                        }
                    }
                },

                show_messages: function (data, event) {
                    if (document.getElementsByClassName("ajax-notifications")[0].style.display == 'none') {
                        viewModel.disable_messages();
                    }
                    viewModel.contentShowMessage(!viewModel.contentShowMessage());
                    viewModel.contentShowNot(false);
                    viewModel.contentShowError(false);
                    viewModel.contentShow(viewModel.contentShowMessage());
                    viewModel.template("message-activity-template");
                    // viewModel.activitycount(viewModel.activitycount() - viewModel.msgcount());
                    viewModel.msgTriangle(!viewModel.msgTriangle()),
                    viewModel.ntfTriangle(false),
                    viewModel.errTriangle(false),
                    viewModel.msgcount(0);
                },

                show_notifications: function () {
                    if (document.getElementsByClassName("ajax-notifications")[0].style.display == 'none') {
                        viewModel.disable_messages();
                    }
                    viewModel.contentShowNot(!viewModel.contentShowNot());
                    viewModel.contentShowMessage(false);
                    viewModel.contentShowError(false);
                    viewModel.contentShow(viewModel.contentShowNot());
                    viewModel.template("notification-activity-template");
                    // viewModel.activitycount(viewModel.activitycount() - viewModel.notifycount());
                    viewModel.ntfTriangle(!viewModel.ntfTriangle()),
                    viewModel.msgTriangle(false),
                    viewModel.errTriangle(false),
                    viewModel.notifycount(0);
                },

                show_errors: function () {
                    if (document.getElementsByClassName("ajax-notifications")[0].style.display == 'none') {
                        viewModel.disable_messages();
                    }
                    viewModel.contentShowError(!viewModel.contentShowError());
                    viewModel.contentShowMessage(false);
                    viewModel.contentShowNot(false);
                    viewModel.contentShow(viewModel.contentShowError());
                    viewModel.template("error-activity-template");
                    // viewModel.activitycount(viewModel.activitycount() - viewModel.errorcount());
                    viewModel.errTriangle(!viewModel.errTriangle()),
                    viewModel.msgTriangle(false),
                    viewModel.ntfTriangle(false),
                    viewModel.errorcount(0);

                },
                disable_messages: function() {
                    viewModel.contentShowMessage(false);
                    viewModel.contentShowNot(false);
                    viewModel.contentShowError(false);
                    viewModel.contentShow(false);
                    viewModel.msgTriangle(false);
                    viewModel.ntfTriangle(false);
                    viewModel.errTriangle(false);
                }
                
            };

            // add event listeners
            appevents.addListener("oncontactevent", viewModel.onContactEvent);

            viewModel.init();
            return viewModel;
        };

        return {
            viewModel: ActivityVm,
            template: template
        };
    });

}());
