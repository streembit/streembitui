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
            'appevents', 'contactlist', 'peercomm', 'appsrvc', 'definitions', 'utilities',
            'webrtccall', 'webrtcdata', 'filesender', 'uuid', 'secure-random', 'connections', './audiocall.html!text'
        ],
        function (
            appevents, contactlist, peercomm, appsrvc, defs, utilities,
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
                    attendees: params.attendees || [],
                    iscaller: params.iscaller,
                    calltype: params.calltype,
                    peerhangup: false,
                    call_timer_obj: null,
                    videoConnCallback: 0,
                    showChatCallback: 0,
                    chatitems: ko.observableArray([]),
                    chatmsg: ko.observable(''),
                    ischatdisplay: false,
                    isaudio: ko.observable(true),
                    make_connection_inprogress: false,
                    webrtcconn: {},
                    contacts: ko.observableArray([]),
                    inChat: ko.observableArray([params.contact]),
                    secid: null,

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
                        // try {
                        //     webrtccall.hangup();
                        //     if (!viewModel.peerhangup) {
                        //         peercomm.hangup_call(viewModel.contact);
                        //     }
                        //     if (viewModel.call_timer_obj) {
                        //         clearTimeout(viewModel.call_timer_obj);
                        //     }

                        //     //
                        //     appevents.removeSignal("on-cmd-hangup-call", viewModel.onPeerHangup);
                        //     appevents.removeSignal("on-remotestream-connect", viewModel.onRemoteStreamConnect);
                        //     appevents.removeSignal("oncontactevent", viewModel.onTextMessage);
                        //     appevents.removeSignal("on-invite-accepted", viewModel.sendNewAttendeeDetails);
                        //     appevents.removeSignal("new-attendee-call", viewModel.addAttendee);
                        //     appevents.removeSignal("on-groupchat-add", viewModel.onGroupchatAdd);
                        // }
                        // catch (err) {
                        //     streembit.notify.error("AudioCallVM dispose %j", err, true);
                        // }
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
                        appevents.addListener("on-invite-accepted", viewModel.sendNewAttendeeDetails);
                        appevents.addListener("new-attendee-call", viewModel.addAttendee);
                        appevents.addListener("on-groupchat-add", viewModel.onGroupchatAdd);

                        var options = {
                            contact: this.contact,
                            iscaller: this.iscaller,
                            calltype: this.calltype
                        };
                        if(!window.callData || !window.callData.inited) {
                            window.callData.inited = true;
                            webrtccall.initcall(null, null, options);
                        }

                        const sesskeys = peercomm.getsesskeys();
                        $.each(this.attendees, (idx, atd) => {
                            if (sesskeys[atd.name] && sesskeys[atd.name].contact_public_key) {
                                setTimeout(() => {
                                    this.addAttendee(atd, defs.CALLTYPE_AUDIO, true);
                                }, 2000);
                            }
                        });

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
                    },

                    onPeerHangup: function () {
                        viewModel.peerhangup = true;
                        webrtccall.hangup();
                        window.callData = null;

                        if (viewModel.call_timer_obj) {
                            clearInterval(viewModel.call_timer_obj);
                        }

                        // navigate to dashboard
                        appevents.navigate("dashboard");

                        $('#smallScreenAudioCall1 div').appendTo('#call .forShowChatPos');
                        $('.forShowChatPos div').addClass('normalAudDiv');
                        $('#call .forShowChatPos').find('.normalAudDiv').after($('.remote-audio'));
                        $('.forShowChatPos div').removeClass('smallWindowPos');

                        streembit.notify.info("The call has been terminated by the contact", null, true);
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

                    calltimeproc: function () {
                        var value = 0;
                        var callTime = $("#calltime");

                        if ( viewModel.call_timer_obj) {
                            clearInterval( viewModel.call_timer_obj);
                        }

                        viewModel.call_timer_obj = setInterval(function () {
                            value++;
                            var txt = viewModel.toHHMMSS(value);
                            callTime.text(txt);
                        }, 1000);
                    },

                    onRemoteStreamConnect: function () {
                        console.log("AudioCallVM viewmodel onRemoteStreamConnect");
                        viewModel.calltimeproc();
                    },

                    invite: function (item) {
                        if (!this.inChat().filter(c => c.pkeyhash === item.pkeyhash).length) {
                            if (this.make_connection_inprogress === true) {
                                return streembit.notify.info("Please wait ... making a connection is in progress.", null, true);
                            }

                            if (!item.isonline() === false || (typeof item.error === 'function' && item.error().length)) {
                                return streembit.notify.error("Unable to establish this contact.", null, true);
                            }

                            try {
                                peercomm.ping(item, true, 10000)
                                    .then(
                                        function () {
                                            return peercomm.get_contact_session(item);
                                        },
                                        function (err) {
                                            throw new Error(err);
                                        }
                                    )
                                    .then(
                                        function () {
                                            const taskid = uuid.v1();
                                            connections.create(item, true, taskid, function(err, webrtcconn) {
                                                viewModel.make_connection_inprogress = false;
                                                appevents.dispatch("on-task-event", "close", "send", taskid);

                                                if (err) {
                                                    return streembit.notify.error(`Error starting connection with ${item.name}: %j`, err, true);
                                                }
                                                if (!webrtcconn) {
                                                    return streembit.notify.error(`Error starting WebRTC connection with ${item.name}`, null, true);
                                                }

                                                const sid = secrand.randomBuffer(32).toString("hex");
                                                appsrvc.groupchat_id = sid;

                                                const payload = {
                                                    sid: sid,
                                                    type: defs.CALLTYPE_AUDIO,
                                                    attendees: viewModel.inChat()
                                                };
                                                const message = { cmd: defs.PEERMSG_GROUPCHAT_INVITE, sender: appsrvc.username, text: JSON.stringify(payload) };
                                                const peermsg = peercomm.get_peer_message(item, message);

                                                viewModel.webrtcconn[item.pkeyhash] = webrtcconn;
                                                viewModel.webrtcconn[item.pkeyhash].send(peermsg);
                                            });
                                        },
                                        function (err) {
                                            throw new Error(err);
                                        }
                                    );
                            } catch (err) {
                                streembit.notify.error(`Error on calling ${item.name} %j`, err)
                            }
                        }
                    },

                    addAttendee: function (attendee, ctype, iscaller = true) {
                        this.inChat.push(attendee);
                        const options = {
                            contact: attendee,
                            iscaller: iscaller,
                            calltype: ctype,
                            elnum: this.inChat().length - 1
                        };
                        setTimeout(() => {
                            webrtccall.initcall(null, null, options);
                        }, 500);
                    },

                    sendNewAttendeeDetails: function (attendee) {
                        const msg = {
                            sid: appsrvc.groupchat_id,
                            calltype: defs.CALLTYPE_AUDIO,
                            attendee: attendee
                        };

                        if (!viewModel.webrtcconn[viewModel.contact.pkeyhash]) {
                            const taskid = uuid.v1();
                            connections.create(viewModel.contact, true, taskid, function (err, webrtcconn) {
                                if (err) {
                                    return streembit.notify.error("Error sending new attendee data to contact: %j", err, true);
                                }
                                if (!webrtcconn) {
                                    return streembit.notify.error("Error creating WebRTC connection on sending attendee data to contact", null, true);
                                }

                                appevents.dispatch("on-task-event", "close", "send", taskid);

                                viewModel.webrtcconn[viewModel.contact.pkeyhash] = webrtcconn;
                                viewModel.sendchat(JSON.stringify(msg), defs.PEERMSG_GROUPCHAT_ADD);
                            });
                        } else {
                            viewModel.sendchat(JSON.stringify(msg), defs.PEERMSG_GROUPCHAT_ADD);
                        }

                        viewModel.addAttendee(attendee, defs.CALLTYPE_AUDIO);
                    },

                    sendfile: function () {
                        if (!peercomm.is_peer_session(viewModel.contact.name)) {
                            return streembit.notify.error_popup("Invalid contact session");
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

                    hangup: function () {
                        webrtccall.hangup();
                        peercomm.hangup_call(viewModel.contact);
                        window.callData = null;
                                           
                        // navigate to dashboard
                        appevents.navigate("dashboard");

                        if (viewModel.call_timer_obj) {
                            clearInterval(viewModel.call_timer_obj);
                        }

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

                    onGroupchatAdd: function (payload) {
                        try {
                            const data = JSON.parse(payload.text);
                            // peercomm.ping(data.attendee, true, 5000)
                            //     .then(
                            //         () => peercomm.get_contact_session(data.attendee),
                            //         err => { throw new Error(err) } )
                            //     .then(
                            //         () => {
                            //             appsrvc.groupchat_id = data.sid;
                            //             viewModel.addAttendee(data.attendee, data.calltype);
                            //         },
                            //         err => {
                            //             throw new Error(err);
                            //         }
                            //     )
                            //     .catch((err) => {
                            //         throw new Error(err);
                            //     });
                            const taskid = uuid.v1();
                            connections.create(data.attendee, true, taskid, function(err, webrtcconn) {
                                appevents.dispatch("on-task-event", "close", "send", taskid);

                                if (err) {
                                    return streembit.notify.error(`Error starting connection with ${data.attendee.name}: %j`, err, true);
                                }
                                if (!webrtcconn) {
                                    return streembit.notify.error(`Error starting WebRTC connection with ${data.attendee.name}`, null, true);
                                }

                                viewModel.webrtcconn[data.attendee.pkeyhash] = webrtcconn;

                                viewModel.addAttendee(data.attendee, data.calltype, false);
                            });

                        } catch (err) {
                            streembit.notify.error('Error connecting with new group chat member %j', err);
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

                    get_secid() {
                        if (viewModel.secid) {
                            return viewModel.secid;
                        }
                        viewModel.secid = secrand.randomBuffer(32).toString("hex");
                        return viewModel.secid;
                    }
                };

                viewModel.groupcallInvite = ko.computed(() => viewModel.contacts().filter(c => !viewModel.inChat().filter(inc => c.name === inc.name).length));

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
