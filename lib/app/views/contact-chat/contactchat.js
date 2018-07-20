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
        ['appevents', 'contactlist', 'peercomm', 'peermsg', 'appsrvc', 'definitions',
            'utilities', 'connections', 'filesender', 'database', 'errhandler', 'errcodes', './contactchat.html!text'],
        function (
            appevents, contactlist, peercomm, peermsg, appsrvc, defs, utilities, connections, filesender, database, errhandler, errcodes, template) {

            function ContactChatVM(params) {

                var viewModel = {
                    contact: params.contact,
                    contact_name: ko.observable(params.contact.name),
                    contact_avatar: ko.observable(params.contact.avatar),
                    chatitems: ko.observableArray([]),
                    chatmsg: ko.observable(''),
                    username: ko.observable(appsrvc.username),
                    avatar: ko.observable(params.contact.name || null),
                    issession: ko.observable(params.issession),
                    btncaption: ko.observable(params.issession ? 'Send' : 'Send Offline Message'),
                    lblheader: ko.observable(params.issession ? ('Chat with ' + params.contact.name) : ('Offline message to ' + params.contact.name)),
                    webrtcconn: params.webrtcconn,
                    contactTyping: ko.observable(false),
                    contact_is_typing: ko.observable(''),
                    my_avatar: ko.observable(localStorage.avatar),
                    forKeyboardMobile: ko.observable(),
                    changeHeightOnMobile: ko.observable(),

                    isContactWithAva: function(sender) {
                        return sender !== appsrvc.username && this.contact_avatar;
                    },

                    dispose: function () {

                        console.log("ContactChatVM dispose");
                        // try {
                        //     viewModel.webrtcconn.close();
                        // }
                        // catch (err) { }

                        try {
                            appevents.removeSignal("oncontactevent", this.onChatMessage);
                            appevents.removeSignal("on-webrtc-connection-closed", this.onConnectionClosed);
                            appevents.removeSignal("ontyping", this.onContactTyping);

                        }
                        catch (err) { }
                    },

                    init: function () {
                        try {
                            $('.chat-fill-area').css({ height: ($(window).height() - 400) });

                            $(function () {
                                $(window).on('resize', function () {
                                    $('.chat-fill-area').css({ height: ($(window).height() - 400) });
                                })
                            });

                            var items = appsrvc.get_textmsg(this.contact.name);
                            if(items && items.length) {
                                var array = items.slice(0);
                                this.chatitems(array);
                            }

                            if (!viewModel.webrtcconn) {
                                viewModel.webrtcconn = connections.get(viewModel.contact.name);
                            }

                            if (!viewModel.webrtcconn) {
                                // throw new Error("WebRTC connection does not exists");
                                throw new Error(errhandler.getmsg(errcodes.UI_WEBRTC_CONN_DOESNOT_EXISTS));
                            }

                            appevents.addListener("oncontactevent", this.onChatMessage);
                            appevents.addListener("on-webrtc-connection-closed", this.onConnectionClosed);
                            appevents.addListener("ontyping", this.onContactTyping);

                            var items = appsrvc.get_textmsg(this.contact.name);
                            if (items && items.length) {
                                var new_array = items.slice(0);
                                this.chatitems(new_array);
                            } else {
                                this.chatitems([]);
                                database.get(database.CHATHISTORY, `${appsrvc.pubkeyhash}/${this.contact.pkeyhash}`).then(
                                    res => {
                                        if (res) {
                                            let chat = peermsg.aes256decrypt(appsrvc.privateKeyHex, res.chat);
                                            chat = JSON.parse(chat);
                                            $.each(chat, (cid, m) => {
                                                this.chatitems.push(m);
                                                appsrvc.add_textmsg(this.contact.name, m);
                                            });
                                        }
                                    },
                                    err => streembit.notify.error(errhandler.getmsg(errcodes.UI_ERROR_SAVING_CHAT_HISTORY, +err))
                                    // streembit.notify.error('Error saving chat history: %j' +err)
                                );
                            }

                            $("#txtChatCtrl").keyup(function (e) {
                                var code = e.which;
                                if (code == 13) {
                                    e.preventDefault();
                                    var text = $.trim($("#txtChatCtrl").val());
                                    if(localStorage.avatar == undefined) {
                                        $('.chat-sender img').css({'display': 'none'});
                                    }else{
                                        viewModel.my_avatar(localStorage.avatar);
                                    }
                                    if (text) {
                                        viewModel.chatmsg(text);
                                        viewModel.sendchat();
                                    }
                                }
                            });

                            if ($('#call').css('display') !== 'none') {

                                if ($('.calltime_parent').css('display') === 'block') {
                                    $('#text-chat-area').children().eq(0).css('padding', '');
                                    if ($(window).width() < 425) {
                                        $('#text-chat-area').children().eq(0).css('padding-top', '20px');
                                    } else {
                                        $('#text-chat-area').children().eq(0).css('padding-top', '30px');
                                    }
                                    $('#text-chat-area').children().eq(0).css('padding-right', '12px');
                                }
                            } else {
                                $('#text-chat-area').children().eq(0).css('padding', '10px');

                            }
                        }
                        catch (err) {
                            // streembit.notify.error("Chat view error %j", err);
                            streembit.notify.error(errhandler.getmsg(errcodes.UI_CHAT_VIEW_ERROR, err));
                        }
                    },

                    copy: function () {

                    },

                    sendchat: function () {
                        try {
                            if (!this.issession()) {
                                // return streembit.notify.error("Unable to send chat message. No session exists with the contact");
                                return streembit.notify.error(errhandler.getmsg(errcodes.UI_UNABLE_SEND_CHAT_MESSAGE));
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
                            // streembit.notify.error("Send chat error %j", err);
                            streembit.notify.error(errhandler.getmsg(errcodes.UI_SEND_CHAT_ERROR, err));
                        }
                    },

                    sendfile: function () {
                        if (!peercomm.is_peer_session(viewModel.contact.name)) {
                            // return streembit.notify.error("Invalid contact session");
                            return streembit.notify.error(errhandler.getmsg(errcodes.UI_INVALID_CONTACT_SESSION));
                        }

                        try {
                            var filetask = new filesender();
                            filetask.run(this.contact);
                        }
                        catch (err) {
                            console.log('ERR SEND FILE:', err);
                            // streembit.notify.error("Send file error: %j", err.message);
                            streembit.notify.error(errhandler.getmsg(errcodes.UI_SEND_FILE_ERROR, err.message));
                        }
                    },

                    savechat: function () {
                        // send chat history to the contact
                        if (!this.issession()) {
                            // return streembit.notify.error("Unable to sync chat history. No session exists with the contact");
                            return streembit.notify.error(errhandler.getmsg(errcodes.UI_UNABLE_SYNC_CHAT_HISTORY));
                        }

                        const data = {
                            key: `${appsrvc.pubkeyhash}/${this.contact.pkeyhash}`,
                            chat: peermsg.aes256encrypt(appsrvc.privateKeyHex, JSON.stringify(this.chatitems()))
                        };
                        database.update(database.CHATHISTORY, data).then(
                            () => {
                                try {
                                    const send = {
                                        pkeyhash: appsrvc.pubkeyhash,
                                        chat: this.chatitems()
                                    };
                                    const message = { cmd: defs.PEERMSG_CHTHIS, sender: appsrvc.username, text: send };
                                    const peermsg = peercomm.get_peer_message(viewModel.contact, message);
                                    viewModel.webrtcconn.send(peermsg);
                                }
                                catch (err) {
                                    // streembit.notify.error("Error sending chat history: %j", err);
                                    streembit.notify.error(errhandler.getmsg(errcodes.UI_SENDING_CHAT_HISTORY, err));
                                }

                                streembit.notify.success('Chat history saved');
                            },
                            err => streembit.notify.error(errhandler.getmsg(errcodes.UI_ERROR_SAVING_CHAT_HISTORY, +err))
                            // streembit.notify.error('Error saving chat history: %j' +err)
                        );
                    },

                    rmchat: function () {
                        if (!this.issession()) {
                            // return streembit.notify.error("Unable to sync chat history. No session exists with the contact");
                            return streembit.notify.error(errhandler.getmsg(errcodes.UI_UNABLE_SYNC_CHAT_HISTORY));
                        }

                        const remove = confirm("Chat history to be removed completely.");
                        if (remove) {
                            database.del(database.CHATHISTORY, `${appsrvc.pubkeyhash}/${this.contact.pkeyhash}`).then(
                                () => {
                                    try {
                                        const send = {
                                            pkeyhash: appsrvc.pubkeyhash,
                                            chat: 'rm'
                                        };
                                        const message = { cmd: defs.PEERMSG_CHTHIS, sender: appsrvc.username, text: send };
                                        const peermsg = peercomm.get_peer_message(viewModel.contact, message);
                                        viewModel.webrtcconn.send(peermsg);
                                    }
                                    catch (err) {
                                        // streembit.notify.error("Error sending chat history: %j", err);
                                        streembit.notify.error(errhandler.getmsg(errcodes.UI_SENDING_CHAT_HISTORY, err));
                                    }

                                    streembit.notify.success('Chat history has been deleted')
                                },
                                err => streembit.notify.error(errhandler.getmsg(errcodes.UI_DELETING_CHAT_HISTORY, +err))
                                // streembit.notify.error('Error deleting chat history: %j' +err)
                            );
                        }
                    },

                    addTextMessage: function (msg) {
                        viewModel.chatitems.push(msg);
                        var $cont = $('.chatitemswnd');
                        $cont[0].scrollTop = $cont[0].scrollHeight;
                    },

                    onChatMessage: function (event, msg, type = null, contact = null) {
                        if (msg && ((contact && contact.name === viewModel.contact.name) || msg.sender === viewModel.contact.name)) {
                            if (event === "on-text-message") {
                                msg.text = `<span>${msg.text}</span>`;
                                viewModel.addTextMessage(msg);
                            }
                        }
                    },

                    onContactTyping: function(sender) {
                        if (sender === viewModel.contact_name()) {
                            viewModel.contact_is_typing(viewModel.contact_name() + " " + "is typing...");
                            $('.contact-is-typing').show();
                        }
                    },

                    typing: function() {
                        try {
                            if (!this.issession()) {
                                // return streembit.notify.error("Unable to send data. No session exists with the contact");
                                return streembit.notify.error(errhandler.getmsg(errcodes.UI_UNABLE_SEND_DATA));
                            }
                            var message = { cmd: defs.PEERMSG_TYPING, sender: appsrvc.username};
                            var contact = contactlist.get_contact(this.contact.name);
                            var peermsg = peercomm.get_peer_message(contact, message);
                            viewModel.webrtcconn.send(peermsg);
                        }
                        catch (err) {
                            // streembit.notify.error("Send chat error %j", err);
                            streembit.notify.error(errhandler.getmsg(errcodes.UI_SEND_CHAT_ERROR, err));
                        }
                    },

                    blurTextareaMobile: function () {
                        viewModel.forKeyboardMobile(false);
                        viewModel.changeHeightOnMobile(false);
                    },

                    focusTextareaMobile: function () {
                        if($(window).width() < 425) {
                            viewModel.forKeyboardMobile(true);
                            
                        }
                        if($(window).width() < 375) {
                            viewModel.changeHeightOnMobile(true);
                            
                        }
                    },

                    addMyimg: function (file) {
                        let data = {
                            time: utilities.timeNow(),
                            sender: appsrvc.username
                        };
                        const reader = new FileReader();
                        reader.readAsDataURL(file);
                        reader.onloadend = function() {
                            data.text = `<img src="${reader.result}" style="max-width:100%;height:auto;" />`;
                            viewModel.chatitems.push(data);
                            appsrvc.add_textmsg(viewModel.contact.name, data);
                            let $cont = $('.chatitemswnd');
                            $cont[0].scrollTop = $cont[0].scrollHeight;
                        };
                    },

                    onConnectionClosed: function (contactname) {
                        if (contactname === viewModel.contact.name) {
                            // navigate to the contact view
                            appevents.dispatch("on-contact-selected", viewModel.contact);
                            appevents.dispatch("oncontactevent", "on-selected-contact-change", contactname);
                            appevents.dispatch("oncontactevent", "contact-offline", contactname, true, 'dashboard');
                            // streembit.notify.error("The connection with contact " + contactname + " was closed", null, true);
                            streembit.notify.error(errhandler.getmsg(errcodes.UI_CONN_WAS_CLOSED_FOR_CONTACT) + contactname, null, true);
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
