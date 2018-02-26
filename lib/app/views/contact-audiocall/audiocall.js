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
        [
            'appevents', 'contactlist', 'peercomm', 'appsrvc', 'definitions', 'utilities', 'groupcall',
            'webrtccall', 'webrtcdata', 'filesender', 'uuid', 'secure-random', 'connections', './audiocall.html!text'
        ],
        function (
            appevents, contactlist, peercomm, appsrvc, defs, utilities, groupcall,
            webrtccall, webrtcdata, filesender, uuid, secrand, connections, template) {

            function showChatControl() {
                $(".chat_items").css({
                    display: 'flex',
                });
                $('#call canvas, #call  audio').css({ height: 32, width: 200 });
                $('.forShowChatPos').css({'float': 'left', 'margin-left': '15px'});
                $('.media-call-content').css({ flexDirection: 'row' });
                $('.chat-fill-area').css({ height: ($('.content-panel').height() - 260), 'width': '86%' });
                $(".chat_items").show();
                $(function () {
                    $(window).on('resize', function () {
                        $('.chat-fill-area').css({ height: ($('.content-panel').height() - 260) });
                    })
                });
            }

            function AudioCallVM(params) {
                var viewModel = {
                    localVideo: "localvid",
                    remoteVideo: "remotevid",
                    contact: params.contact,
                    contact_name: ko.observable(params.contact.name),
                    contact_avatar: ko.observable(params.contact.avatar),
                    iscaller: params.iscaller,
                    calltype: params.calltype,
                    peerhangup: false,
                    call_timer_obj: {},
                    videoConnCallback: 0,
                    showChatCallback: 0,
                    chatitems: ko.observableArray([]),
                    chatmsg: ko.observable(''),
                    ischatdisplay: false,
                    isaudio: ko.observable(true),
                    make_connection_inprogress: false,
                    webrtcconn: {},
                    contacts: ko.observableArray([]),
                    group: ko.observableArray([]),
                    secid: null,
                    contactTyping: ko.observable(false),
                    contact_is_typing: ko.observable(''),

                    isMe: function(sender) {
                        return sender === appsrvc.username;
                    },
                    isContactNoAva: function(sender) {
                        return sender !== appsrvc.username && !this.contact_avatar;
                    },
                    isContactWithAva: function(sender) {
                        return sender !== appsrvc.username && this.contact_avatar;
                    },

                    Contact: function() {
                        this.isonline = ko.observable();
                        this.isoffline = ko.observable();
                        this.lastping = ko.observable(0);
                        this.error = ko.observable("");
                        this.warnicon = ko.observable("");
                        this.warning = ko.observable("");
                    },

                    dispose: function () {
                        try {
                            webrtccall.hangup();
                            groupcall.reset();

                            if (!viewModel.peerhangup) {
                                peercomm.hangup_call(viewModel.contact);
                            }
                            if (viewModel.call_timer_obj) {
                                $.each(viewModel.call_timer_obj, (tix, t) => {
                                    clearTimeout(t);
                                });
                            }

                            //
                            appevents.removeSignal("on-cmd-hangup-call", viewModel.onPeerHangup);
                            appevents.removeSignal("on-remotestream-connect", viewModel.onRemoteStreamConnect);
                            appevents.removeSignal("oncontactevent", viewModel.onTextMessage);
                            appevents.removeSignal("groupcallevent", viewModel.onGroupcallEvent);
                            appevents.removeSignal("ontyping", this.onContactTyping);
                        }
                        catch (err) {
                            streembit.notify.error("AudioCallVM dispose %j", err, true);
                        }
                    },

                    init: function () {
                        $('#call canvas').css({ height: 220, width: 308 });
                        $('#call  audio').css({ width: 308});
                        $('.forShowChatPos').css({'float': 'none', 'margin-left': '0px'});
                        $('.chat-fill-area').css({ height: ($('.content-panel').height() - 260), 'width': '100%' });
                        $(function () {
                            $(window).on('resize', function () {
                                $('.chat-fill-area').css({ height: ($('.content-panel').height() - 260) });
                            })
                        });

                        $.each(contactlist.contacts, (idx, c) => {
                            if (c.user_type !== 'human' || c.name === this.contact.name) {
                                return true;
                            }
                            this.contacts.push(Object.assign(new this.Contact(), c));
                        });

                        //
                        appevents.addListener("on-cmd-hangup-call", viewModel.onPeerHangup);
                        appevents.addListener("on-remotestream-connect", viewModel.onRemoteStreamConnect);
                        appevents.addListener("oncontactevent", viewModel.onTextMessage);
                        appevents.addListener("groupcallevent", viewModel.onGroupcallEvent);
                        appevents.addListener("ontyping", this.onContactTyping);

                        const options = {
                            contact: this.contact,
                            iscaller: this.iscaller,
                            calltype: this.calltype
                        };

                        if(!window.callData || !window.callData.inited) {
                            window.callData.inited = true;
                            webrtccall.initcall(null, null, options, err => {
                                if (err) {
                                    return streembit.notify.error('Start WebRTC call error, %j', err);
                                }

                                console.log(`Call with ${options.contact.name} initiated`);

                                if (params.sid) {
                                    viewModel.updateGroupCall({sid: params.sid});
                                }

                                groupcall.add(options.contact);
                                $('[data-invite=' + options.contact.pkeyhash + ']').hide();

                                if (params.attendees) {
                                    // initcall for each
                                    setTimeout(() => {
                                        $.each(params.attendees, (idx, atd) => {
                                            groupcall.updateDOM(atd, 'add');

                                            options.contact = atd;
                                            options.elnum = groupcall.participants.length;

                                            webrtccall.initcall(null, null, options, err => {
                                                if (err) {
                                                    groupcall.updateDOM(atd);
                                                    return streembit.notify.error('Start WebRTC call error, %j', err);
                                                }

                                                console.log(`Call with ${options.contact.name} initiated`);

                                                groupcall.add(atd);
                                                $('[data-invite=' + atd.pkeyhash + ']').hide();
                                            });
                                        });
                                    }, 2500);
                                }
                            });
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

                        appevents.dispatch("oncontactevent", "on-selected-contact-change", this.contact.name);

                        $('body').on('click', '.rm_partee', function() {
                            viewModel.hangup_gcpart($(this).parent().attr('id'));
                        });
                    },

                    hangup: function () {
                        if (viewModel.call_timer_obj) {
                            $.each(viewModel.call_timer_obj, (tix, t) => {
                                clearTimeout(t);
                            });
                        }

                        const group = groupcall.participants;

                        groupcall.hangupAll();

                        $.each(group, (pix, p) => {
                            peercomm.hangup_call(p, 1);
                        });
                    },

                    hangup_gcpart: function (pkeyhash) {
                        const bypk = groupcall.participants.filter(p => p.pkeyhash === pkeyhash);
                        if (!bypk.length) {
                            return streembit.notify.error('Error on removing participant, Not found by pkeyhash');
                        }

                        groupcall.hangupCall(bypk[0]);

                        peercomm.hangup_call(bypk[0]);
                    },

                    onPeerHangup: function (sender, payload) {
                        try {
                            const data = JSON.parse(payload.data);
                            if (data.group > 0) {
                                groupcall.hangupAll();
                                return streembit.notify.info("Group call has been terminated");
                            }

                            const partee = groupcall.participants.filter(p => p.name === sender)[0];
                            if (partee) {
                                groupcall.hangupCall(partee);
                            }

                            streembit.notify.info("The call has been terminated by the contact", null, true);
                        } catch (e) {
                            streembit.notify.error('Error processing onPerrHangup: %j', e);
                        }
                    },

                    toHHMMSS: function (value) {
                        var seconds = Math.floor(value),
                            hours = Math.floor(seconds / 3600);
                        seconds -= hours * 3600;
                        var minutes = Math.floor(seconds / 60);
                        seconds -= minutes * 60;

                        if (hours < 10) { hours = "0" + hours; }
                        if (minutes < 10) { minutes = "0" + minutes; }
                        if (seconds < 10) { seconds = "0" + seconds; }
                        return hours + ':' + minutes + ':' + seconds;
                    },

                    calltimeproc: function (contact) {
                        var value = 0;
                        viewModel.call_timer_obj[contact.pkeyhash] = setInterval(function () {
                            value++;
                            var txt = viewModel.toHHMMSS(value);
                            $('[data-calltime=' +contact.pkeyhash+ ']').find('span').eq(1).text(txt);
                        }, 1000);
                    },

                    onRemoteStreamConnect: function (contact) {
                        console.log("AudioCallVM viewmodel onRemoteStreamConnect for " +contact.name);
                        viewModel.calltimeproc(contact);
                    },

                    invite: function (item) {
                        groupcall.invite(item);
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

                    showchat: function () {
                        var taskTimer, taskid;
                        try {
                            if (viewModel.make_connection_inprogress == true) {
                                return streembit.notify.info("Please wait ... making a connection is in progress.", null, true);
                            }

                            var created = false, reported = false;

                            viewModel.make_connection_inprogress = true;

                            taskid = uuid.v1();
                            connections.create(viewModel.contact, true, taskid, function (err, webrtcconn) {

                                viewModel.make_connection_inprogress = false;
                                appevents.dispatch("on-task-event", "close", "send", taskid);
                                clearTimeout(taskTimer);

                                if (err) {
                                    reported = true;
                                    return streembit.notify.error("Error in starting chat: %j", err, true);
                                }

                                if (!webrtcconn) {
                                    reported = true;
                                    return streembit.notify.error("Error in starting chat, no WebRTC connection", null, true);
                                }

                                viewModel.webrtcconn[viewModel.contact.pkeyhash] = webrtcconn;

                                // add messages from appsrvc
                                viewModel.synchronizeTextMessages();

                                showChatControl();
                            });

                            taskTimer = setTimeout(function () {
                                    if (!created && !reported) {
                                        //viewModel.unblockwait();
                                        streembit.notify.error("Error in starting chat: no reply from the contact", null, true);
                                        viewModel.make_connection_inprogress = false;
                                        appevents.dispatch("on-task-event", "close", "send", taskid);
                                    }
                                },
                                35000);
                        }
                        catch (err) {
                            viewModel.make_connection_inprogress = false;
                            appevents.dispatch("on-task-event", "close", "send", taskid);
                            clearTimeout(taskTimer);
                            streembit.notify.error("Start chat error: %j", err);
                        }
                    },

                    add_audio: function () {
                        webrtccall.toggle_audio(true, function () {
                            viewModel.isaudio(true);
                            // TODO send to the peer
                        });
                    },

                    remove_audio: function () {
                        webrtccall.toggle_audio(false, function () {
                            viewModel.isaudio(false);
                            // TODO send to the peer
                        });
                    },

                    sendchat: function (msg = null, type = null) {
                        try {
                            const msgSend = msg || $.trim(this.chatmsg());
                            if (!msgSend) { return }

                            if (!viewModel.webrtcconn[this.contact.pkeyhash]) {
                                viewModel.webrtcconn[this.contact.pkeyhash] = connections.get(this.contact.name);
                            }

                            if (!viewModel.webrtcconn[this.contact.pkeyhash]) {
                                throw new Error("invalid WebRTC data connection")
                            }

                            var message = { cmd: type || defs.PEERMSG_TXTMSG, sender: appsrvc.username, text: msgSend };
                            var contact = contactlist.get_contact(this.contact.name);
                            var peermsg = peercomm.get_peer_message(contact, message);
                            viewModel.webrtcconn[this.contact.pkeyhash].send(peermsg);
                            // assuming this is a regular chat message
                            if (!msg) {
                                //  update the list with the sent message
                                message.time = utilities.timeNow();
                                this.addTextMessage(message);
                                appsrvc.add_textmsg(viewModel.contact.name, message);
                                this.chatmsg('');
                            }
                        }
                        catch (err) {
                            streembit.notify.error("Send chat error %j", err, true);
                        }
                    },

                    onContactTyping: function() {
                        viewModel.contact_is_typing(viewModel.contact_name() + " " + "is typing...");
                    },

                    typing: function() {
                        try {
                            if (!peercomm.is_peer_session(viewModel.contact.name)) {
                                return streembit.notify.error("Unable to send data. No session exists with the contact");
                            }
                           
                            var message = { cmd: defs.PEERMSG_TYPING, sender: appsrvc.username};
                            var contact = contactlist.get_contact(this.contact.name);
                            var peermsg = peercomm.get_peer_message(contact, message);
                            
                            if (!viewModel.webrtcconn[this.contact.pkeyhash]) {
                                viewModel.webrtcconn[this.contact.pkeyhash] = connections.get(this.contact.name);
                            }

                            viewModel.webrtcconn[this.contact.pkeyhash].send(peermsg);
                        
                        }
                        catch (err) {
                            streembit.notify.error("Send chat error %j", err);
                        }
                    },

                    addTextMessage: function (msg) {
                        var add = true;
                        viewModel.chatitems().forEach(
                            (item) => {
                                if (item.time == msg.time && item.text == msg.text) {
                                    add = false;
                                }
                            }
                        );
                        if (add) {
                            viewModel.chatitems.push(msg);
                            var $cont = $('.chatitemswnd');
                            $cont[0].scrollTop = $cont[0].scrollHeight;
                        }
                    },

                    onTextMessage: function (event, msg) {
                        if (event === "on-text-message") {
                            viewModel.showTextMessage(msg);
                        }
                    },

                    showTextMessage: function (msg) {
                        if (viewModel.ischatdisplay == false) {
                            showChatControl();
                            viewModel.ischatdisplay = true;
                            // add messages from appsrvc
                            viewModel.synchronizeTextMessages();
                        }
                        viewModel.addTextMessage(msg);
                    },

                    // make sure the previously received/sent text messages are displayed
                    synchronizeTextMessages() {
                        if (viewModel.chatitems().length == 0) {
                            var items = appsrvc.get_textmsg(viewModel.contact.name);
                            if (items && items.length) {
                                var new_array = items.slice(0);
                                viewModel.chatitems(new_array);
                            }
                        }
                    },

                    onGroupcallEvent: function (event, payload) {
                        switch (event) {
                            case "update-groupcall":
                                viewModel.updateGroupCall(payload);
                                break;
                            case "add-to-groupcall":
                                viewModel.addToGroupCall(payload);
                                break;
                            default:
                                break;
                        }
                    },

                    updateGroupCall: function (setts) {
                        if (typeof setts.sid !== 'undefined') {
                            groupcall.setSid(setts.sid);
                        }
                    },

                    addToGroupCall(payload) {
                        // if it is first invited person
                        // set groupcall sid
                        const groupCallSID = groupcall.getSid();
                        if (!groupCallSID) {
                            viewModel.updateGroupCall(payload);
                        }
                        // otherwise verify
                        else if (groupCallSID !== payload.sid) {
                            return streembit.notify.error('Error verifying groupcall identity');
                        }

                        groupcall.updateDOM(payload.attendee, 'add');

                        let options = {
                            contact: payload.attendee,
                            iscaller: true,
                            calltype: defs.CALLTYPE_AUDIO,
                            elnum: groupcall.participants.length
                        };

                        peercomm.ping(payload.attendee, false, 10000)
                            .then(() => {
                                return peercomm.get_contact_session(payload.attendee);
                            })
                            .then(() => {
                                setTimeout(() => {
                                    webrtccall.initcall(null, null, options, err => {
                                        if (err) {
                                            // send hangup request to attendee
                                            groupcall.updateDOM(payload.attendee);
                                            return streembit.notify.error('Error on start WebRTC call with ' + payload.attendee.name + ', %j', err);
                                        }

                                        groupcall.add(payload.attendee);
                                        $('[data-invite=' +payload.attendee.pkeyhash+ ']').hide();

                                        console.log(`Call with ${payload.attendee.name} initiated`);
                                    });
                                }, 2000)
                            })
                            .catch(function (err) {
                                // send hangup request to attendee
                                return streembit.notify.error("Error pinging new groupchat attendee: %j", err);
                            });

                    },

                    get_secid() {
                        if (viewModel.secid) {
                            return viewModel.secid;
                        }
                        viewModel.secid = secrand.randomBuffer(32).toString("hex");
                        return viewModel.secid;
                    }
                };

                viewModel.init();

                return viewModel;
            }

            return {
                viewModel: AudioCallVM,
                template: template
            };

        }
    ); // define end

}());
