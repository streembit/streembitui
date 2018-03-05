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
        ['appevents', 'uihandler', 'async', 'contactlist', 'peercomm', 'peermsg', 'appsrvc', 'definitions', 'utilities', 'connections', 'filesender', 'database', 'groupchat', './contactchat.html!text'],
        function (appevents, uihandler, async, contactlist, peercomm, peermsg, appsrvc, defs, utilities, connections, filesender, database, groupchat, template) {

            function ContactChatVM(params) {

            var viewModel = {
                contact: params.contact,
                contacts: ko.observableArray([]),
                contact_name: ko.observable(params.contact.name),
                contact_avatar: ko.observable(params.contact.avatar),
                chatitems: ko.observableArray([]),
                chatmsg: ko.observable(''),
                username: ko.observable(appsrvc.username),
                issession: ko.observable(params.issession),
                btncaption: ko.observable(params.issession ? 'Send Message' : 'Send Offline Message'),
                lblheader: params.issession ? ('Chat with ' + params.contact.name) : ('Offline message to ' + params.contact.name),
                webrtcconn: {},
                contactTyping: ko.observable(false),
                contact_is_typing: ko.observable(''),
                invite: ko.observableArray([]),
                inviteDialog: ko.observable(false),

                isMe: function(sender) {
                    return sender === appsrvc.username;
                },
                isContactNoAva: function(sender) {
                    return sender !== appsrvc.username && !this.contact_avatar;
                },
                isContactWithAva: function(sender) {
                    return sender !== appsrvc.username && this.contact_avatar;
                },

                dispose: function () {
                    console.log("ContactChatVM dispose");      
                    try {
                        // close each connection
                        viewModel.webrtcconn[viewModel.contact.pkeyhash].close();
                    }
                    catch (err) { }

                    try {
                        appevents.removeSignal("oncontactevent", this.onChatMessage);
                        appevents.removeSignal("on-webrtc-connection-closed", this.onConnectionClosed);
                        appevents.removeSignal("on-chatimg-complete", this.addMyimg);
                        appevents.removeSignal("ontyping", this.onContactTyping);
                        appevents.removeSignal("groupchatevent", this.groupChatEvent);
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

                        if (params.attendees && params.attendees.length) {
                            if (!params.sid) {
                                streembit.notify.error('Invalid groupchat identifier');
                                return appevents.navigate('dashboard');
                            }

                            uihandler.blockview();
                            groupchat.setSid(params.sid);
                            groupchat.inprogress = true;
                            //async.eachSeries([ this.contact, ...params.attendees ], groupchat.openWebRTCConnection, err => {
                            async.eachSeries(params.attendees, groupchat.openWebRTCConnection, err => {
                                uihandler.unblockwiew();
                                groupchat.inprogress = false;

                                if (err || !this.webrtcconn[viewModel.contact.pkeyhash]) {
                                    groupchat.reset();
                                    streembit.notify.error('Error opening WebRTC group connection, %j', err || this.contact.name+ ' has no active connection');

                                    appevents.navigate('dashboard');
                                    return;
                                }
                            });
                        } else {
                            this.webrtcconn[this.contact.pkeyhash] = params.webrtcconn;

                            if (!this.webrtcconn[this.contact.pkeyhash]) {
                                this.webrtcconn[this.contact.pkeyhash] = connections.get(this.contact.name);
                            }

                            if (!this.webrtcconn[this.contact.pkeyhash]) {
                                throw new Error("WebRTC connection does not exists");
                            }
                        }

                        groupchat.add(this.contact);

                        $.each(contactlist.contacts, (idx, c) => {
                            if (c.user_type !== 'human') {
                                return true;
                            }

                            this.contacts.push(c);
                            if (c.pkeyhash !== this.contact.pkeyhash) {
                                this.invite.push(c);
                            }
                        });
                        
                        var items = appsrvc.get_textmsg(this.contact.name);
                        if (items && items.length) {
                            const new_array = items.slice(0);
                            this.chatitems(new_array);
                        }

                        $("#txtChatCtrl").keyup(function (e) {
                            const code = e.which;
                            if (code === 13) {
                                e.preventDefault();
                                const text = $.trim($("#txtChatCtrl").val());
                                if (text) {
                                    viewModel.chatmsg(text);
                                    viewModel.sendchat();
                                }
                            }
                        });

                        appevents.addListener("oncontactevent", this.onChatMessage);
                        appevents.addListener("on-webrtc-connection-closed", this.onConnectionClosed);
                        appevents.addListener("ontyping", this.onContactTyping);
                        appevents.addListener("on-chatimg-complete", this.addMyimg);
                        appevents.addListener("groupchatevent", this.groupChatEvent);
                    }
                    catch (err) {
                        streembit.notify.error("Chat view error %j", err);
                    }
                },

                copy: function () {

                },

                showinvite: function () {
                    this.inviteDialog(!this.inviteDialog());
                },

                sendinvite: function (item) {
                    console.log('sending chat invite to ' +item.name);
                    viewModel.inviteDialog(false);
                    groupchat.invite(item);
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
                        // if (groupchat.active.length > 1)
                        // send everyone
                        viewModel.webrtcconn[viewModel.contact.pkeyhash].send(peermsg);
                        
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
                        console.log('ERR SEND FILE:', err);
                        streembit.notify.error("Send file error: %j", err.message);
                    }
                },

                savechat: function () {
                    // send chat history to the contact
                    if (!this.issession()) {
                        return streembit.notify.error("Unable to sync chat history. No session exists with the contact");
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
                                viewModel.webrtcconn[viewModel.contact.pkeyhash].send(peermsg);
                            }
                            catch (err) {
                                streembit.notify.error("Error sending chat history: %j", err);
                            }

                            streembit.notify.success('Chat history saved');
                        },
                        err => streembit.notify.error('Error saving chat history: %j' +err)
                    );
                },

                rmchat: function () {
                    if (!this.issession()) {
                        return streembit.notify.error("Unable to sync chat history. No session exists with the contact");
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
                                    viewModel.webrtcconn[viewModel.contact.pkeyhash].send(peermsg);
                                }
                                catch (err) {
                                    streembit.notify.error("Error sending chat history: %j", err);
                                }

                                streembit.notify.success('Chat history has been deleted')
                            },
                            err => streembit.notify.error('Error deleting chat history: %j' +err)
                        );
                    }
                },

                chatimage: function () {
                    if (!peercomm.is_peer_session(viewModel.contact.name)) {
                        return streembit.notify.error("Invalid contact session");
                    }

                    try {
                        var filetask = new filesender();
                        filetask.run(this.contact, 'chatimg');
                    }
                    catch (err) {
                        console.log('ERR SEND FILE:', err);
                        streembit.notify.error("Send file error: %j", err.message);
                    }
                },

                addTextMessage: function (msg) {
                    viewModel.chatitems.push(msg);
                    var $cont = $('.chatitemswnd');
                    $cont[0].scrollTop = $cont[0].scrollHeight;
                },

                onChatMessage: function (event, msg, type = null, contact = null) {
                    if (msg.sender === viewModel.contact.name || contact.name === viewModel.contact.name) {
                        if (event === "on-text-message") {
                            msg.text = `<span>${msg.text}</span>`;
                            viewModel.addTextMessage(msg);
                        }
                        else if (event === 'on-media-message') {
                            let data = {
                                time: utilities.timeNow(),
                                sender: contact.name
                            };
                            switch (type) {
                                case 'image':
                                    const reader = new FileReader();
                                    reader.readAsDataURL(msg);
                                    reader.onloadend = function() {
                                        data.text = `<img src="${reader.result}" style="max-width:100%;height:auto;" />`;
                                        viewModel.chatitems.push(data);
                                        let $cont = $('.chatitemswnd');
                                        $cont[0].scrollTop = $cont[0].scrollHeight;
                                    };
                                    break;
                                default:
                                    break;
                            }
                        }
                    }
                },
       
                onContactTyping: function() {
                    viewModel.contact_is_typing(viewModel.contact_name() + " " + "is typing...");
                },

                typing: function() {
                    try {
                        if (!this.issession()) {
                            return streembit.notify.error("Unable to send data. No session exists with the contact");
                        }
                        var message = { cmd: defs.PEERMSG_TYPING, sender: appsrvc.username};
                        //var contact = contactlist.get_contact(this.contact.name);
                        //var peermsg = peercomm.get_peer_message(contact, message);

                        async.each(groupchat.active,
                            partee => {
                            console.log('typing to', partee);
                                if (!viewModel.webrtcconn[partee.pkeyhash]) {
                                    const conn = connections.get(partee.name);
                                    if (!conn) {
                                        throw new Error('Unable to connect to ' +partee.name);
                                    }
                                    viewModel.webrtcconn[partee.pkeyhash] = conn;
                                }

                                var contact = contactlist.get_contact(partee.name);
                                var peermsg = peercomm.get_peer_message(contact, message);

                                viewModel.webrtcconn[partee.pkeyhash].send(peermsg);
                            },
                            err => {
                                throw new Error(err);
                            });
                    }
                    catch (err) {
                        streembit.notify.error("Send typing error %j", err);
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
                        let $cont = $('.chatitemswnd');
                        $cont[0].scrollTop = $cont[0].scrollHeight;
                    };
                },

                groupChatEvent: function (handler, contact, payload) {
                    switch (handler) {
                        case "update-groupchat":
                            if (!groupchat.active.filter(a => a.pkeyhash === contact.pkeyhash).length) {
                                viewModel.invite(viewModel.invite().filter(inv => inv.pkeyhash !== contact.pkeyhash));
                                $('#chatinfo').text($('#chatinfo').text()+ ', ' +contact.name);
                                groupchat.add(contact);
                                streembit.notify.success(contact.name+ ' joined our conference');
                            }
                            break;
                        case "add-webrtcconn":
                            viewModel.webrtcconn[contact.pkeyhash] = payload;
                            viewModel.groupChatEvent('update-groupchat', contact);
                            break;
                        default:
                            break;
                    }
                },

                onConnectionClosed: function (contactname) {
                    if (contactname === viewModel.contact.name) {
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
