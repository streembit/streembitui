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


(function () {
    define(
        ['knockout', 'appevents', 'contactlist', 'peercomm', 'appsrvc', 'definitions', 'apputils', 'makeusabrew/bootbox', './contactchat.html!text'],
        function (ko, appevents, contactlist, peercomm, appsrvc, defs, apputils, bootbox, template) {

        function ContactChatVM(params) {
            var viewModel = {
                contact: params.contact,
                contact_name: ko.observable(params.contact.name),
                chatitems: ko.observableArray([]),
                chatmsg: ko.observable(''),
                username: ko.observable(appsrvc.username),
                issession: ko.observable(params.issession),
                btncaption: ko.observable(params.issession ? 'Send Message' : 'Send Offline Message'),
                lblheader: ko.observable(params.issession ? ('Chat with ' + params.contact.name) : ('Offline message to ' + params.contact.name)),

                dispose: function () {
                    console.log("ContactChatVM dispose");
                    appevents.removeSignal("on-text-message", this.onTextMessage);
                },

                init: function () {
                    try {
                        appevents.addListener("on-text-message", this.onTextMessage);

                        var items = appsrvc.get_textmsg(this.contact.name);
                        if (items && items.length) {
                            var new_array = items.slice(0);
                            this.chatitems(new_array);
                        }
                    }
                    catch (err) {
                        streembit.notify.error("Chat view error %j", err);
                    }
                },

                copy: function () {

                },

                sendchat: function () {
                    try {
                        var msg = $.trim(this.chatmsg());
                        if (!msg) { return }
                        
                        if (this.issession() == true) {
                            var message = { cmd: defs.PEERMSG_TXTMSG, sender: appsrvc.username, text: msg};
                            var contact = contactlist.get_contact(this.contact.name);
                            peercomm.send_peer_message(contact, message);
                            //  update the list with the sent message
                            message.time = apputils.timeNow();
                            this.onTextMessage(message);
                            appsrvc.add_textmsg(viewModel.contact.name, message);
                            this.chatmsg('');
                        }
                        else {                                
                            viewModel.sendoffline(msg, function (err) {
                                if (err) {
                                    streembit.notify.error("Send off-line message error %j", err);
                                }
                                else {
                                    viewModel.chatmsg('');
                                    streembit.notify.info("The off-line message has been sent to the network. Once the contact is on-line the message will be delivered", 5000);
                                }
                            });
                        }                        
                    }
                    catch (err) {
                        streembit.notify.error("Send chat error %j", err);
                    }
                },

                sendfile: function () {
                    if (!peercomm.is_peer_session(viewModel.contact.name)) {
                        return streembit.notify.error("Invalid contact session");
                    }

                    streembit.UI.showSendFile(viewModel.contact);
                },

                sendoffline: function (message, callback) {
                    try {
                        if (message) {
                            peercomm.send_offline_message(this.contact, message, defs.MSG_TEXT, callback);
                        }
                    }
                    catch (err) {
                        callback(err);
                    }
                },

                onTextMessage: function (msg) {
                    viewModel.chatitems.push(msg);
                    var $cont = $('.chatitemswnd');
                    $cont[0].scrollTop = $cont[0].scrollHeight;                   
                }
            };

            viewModel.init();

            return viewModel;
        }

        return {
            viewModel: ContactChatVM,
            template: template
        };
    });
}());
