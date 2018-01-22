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


(function () {
    define(
        ['appevents', 'contactlist', 'peercomm', 'appsrvc', 'definitions',
         'utilities', 'connections', 'filesender', './contactchat.html!text'],
        function (
            appevents, contactlist, peercomm, appsrvc, defs,utilities, connections, filesender, template) {

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
                webrtcconn: params.webrtcconn,

                dispose: function () {
                    console.log("ContactChatVM dispose");      
                    try {
                        viewModel.webrtcconn.close();
                    }
                    catch (err) { }

                    try {
                        appevents.removeSignal("oncontactevent", this.onTextMessage);
                        appevents.removeSignal("on-webrtc-connection-closed", this.onConnectionClosed);
                    }
                    catch (err) { }
                },

                init: function () {
                    try {

                        if (!viewModel.webrtcconn) {
                            viewModel.webrtcconn = connections.get(viewModel.contact.name);
                        }

                        if (!viewModel.webrtcconn) {
                            throw new Error("WebRTC connection does not exists");
                        }

                        appevents.addListener("oncontactevent", this.onTextMessage);
                        appevents.addListener("on-webrtc-connection-closed", this.onConnectionClosed);

                        var items = appsrvc.get_textmsg(this.contact.name);
                        if (items && items.length) {
                            var new_array = items.slice(0);
                            this.chatitems(new_array);
                        }

                        $("#txtChatCtrl").keyup(function (e) {
                            var code = e.which;
                            if (code == 13) {
                                e.preventDefault();
                                var text = $.trim($("#txtChatCtrl").val());
                                if (text) {
                                    viewModel.chatmsg(text);
                                    viewModel.sendchat();
                                }
                            }
                        });      
                    }
                    catch (err) {
                        streembit.notify.error("Chat view error %j", err);
                    }
                },

                copy: function () {

                },

                sendchat: function () {
                    try {
                        if (!this.issession()) {
                            return streembit.notify.error("Unable to send chat message. No session exists with the contact");
                        }

                        var msg = $.trim(this.chatmsg());
                        if (!msg) { return }                        
                
                        var message = { cmd: defs.PEERMSG_TXTMSG, sender: appsrvc.username, text: msg };                            
                        var contact = contactlist.get_contact(this.contact.name);
                        var peermsg = peercomm.get_peer_message(contact, message); 
                        viewModel.webrtcconn.send(peermsg);
                        //peercomm.send_peer_message(contact, message);                            
                        //  update the list with the sent message
                        message.time = utilities.timeNow();
                        this.addTextMessage(message);
                        appsrvc.add_textmsg(viewModel.contact.name, message);
                        this.chatmsg('');

                        //
                    }
                    catch (err) {
                        streembit.notify.error("Send chat error %j", err);
                    }
                },

                sendfile: function () {
                    if (!peercomm.is_peer_session(viewModel.contact.name)) {
                        return streembit.notify.error("Invalid contact session");
                    }

                    try {
                        var filetask = new filesender();
                        filetask.run(this.contact);
                    }
                    catch (err) {
                        streembit.notify.error("Send file error: %j", err);
                    }
                },

                addTextMessage: function (msg) {
                    viewModel.chatitems.push(msg);
                    var $cont = $('.chatitemswnd');
                    $cont[0].scrollTop = $cont[0].scrollHeight;
                },

                onTextMessage: function (event, msg) {
                    if (event == "on-text-message") {
                        viewModel.addTextMessage(msg);
                    }
                },

                onConnectionClosed: function (contactname) {
                    if (contactname == viewModel.contact.name) {
                        // navigate to the contact view
                        appevents.dispatch("on-contact-selected", viewModel.contact);
                        appevents.dispatch("oncontactevent", "on-selected-contact-change", contactname);
                        streembit.notify.error("The connection with contact " + contactname + " was closed", null, true);
                    }
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
