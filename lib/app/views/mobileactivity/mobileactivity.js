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

    define(['appevents', 'appsrvc', 'contactlist', 'peercomm', 'peermsg', './mobileactivity.html!text'], function (appevents, appsrvc, contactlist, peercomm, peermsg, template) {

        function mobileActivityVm() {
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
                messages: ko.observableArray([]),
                localdatemsg: ko.observable(Date.now()),
                browserNotif: ko.observable(false),
                count: ko.observable(0),
               
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
                            viewModel.count();
                            if (!document.hasFocus()) {
                                $('#addBrowserNotif').remove();
                                viewModel.count(viewModel.count() + 1);
                                var canvas = document.createElement('canvas');
                                canvas.width = 20;
                                canvas.height = 20;
                                var ctx = canvas.getContext('2d');
                                var centerX = canvas.width / 2;
                                var centerY = canvas.height / 2;
                                var radius = 10;
                                var img = new Image();
                                img.src = 'favicon.ico';
                                img.onload = function() {
                                    ctx.arc(centerX, centerY, radius, 0, 10 * Math.PI, false);
                                    ctx.drawImage(img, 0, 0);
                                    ctx.fillStyle = "#fb711f";
                                    ctx.fill();
                                                                       
                                    ctx.fillStyle = '#FFFFFF';
                                    ctx.font = 'bold 15px sans-serif';
                                    ctx.fillText(viewModel.count(), 6, 15);

                                    var link = document.createElement('link');
                                    link.type = 'image/x-icon';
                                    link.rel = 'shortcut icon';
                                    link.id = 'addBrowserNotif'
                                    link.href = canvas.toDataURL("image/x-icon");
                                    document.getElementsByTagName('head')[0].appendChild(link);
                                }
                                var audio = new Audio('notifysound.mp3');
                                audio.play();
                                
                            }else{
                                return viewModel.count(0);
                            }

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
                    viewModel.errorcount(0);

                },
                disable_messages: function() {
                    viewModel.contentShowMessage(false);
                    viewModel.contentShowNot(false);
                    viewModel.contentShowError(false);
                    viewModel.contentShow(false);
                }
                
            };

            // add event listeners
            appevents.addListener("oncontactevent", viewModel.onContactEvent);

            viewModel.init();
            return viewModel;
        };

        return {
            viewModel: mobileActivityVm,
            template: template
        };
    });

}());
