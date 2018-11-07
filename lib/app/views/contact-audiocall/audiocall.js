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
            'appevents', 'contactlist', 'peercomm', 'peermsg', 'appsrvc', 'definitions', 'utilities', 'groupcall',
            'webrtccall', 'webrtcdata', 'filesender', 'uuid', 'database', 'secure-random', 'connections', 'errhandler', 'errcodes', './audiocall.html!text'
        ],
        function (
            appevents, contactlist, peercomm, peermsg, appsrvc, defs, utilities, groupcall,
            webrtccall, webrtcdata, filesender, uuid, database, secrand, connections, errhandler, errcodes, template) {

            function AudioCallVM(params) {
                var viewModel = {
                    contact: params.contact,
                    contact_name: ko.observableArray([]),
                    contact_avatar: ko.observable(params.contact.avatar),
                    iscaller: params.iscaller,
                    calltype: params.calltype,
                    peerhangup: false,
                    call_timer_obj: {},
                    videoConnCallback: 0,
                    showChatCallback: 0,
                    chatitems: ko.observableArray([]),
                    chatmsg: ko.observable(''),
                    isChatDisplay: ko.observable(false),
                    isaudio: ko.observable(true),
                    make_connection_inprogress: false,
                    webrtcconn: {},
                    contacts: ko.observableArray([]),
                    group: ko.observableArray([]),
                    groupNames: ko.observableArray([]),
                    secid: null,
                    contactTyping: ko.observable(false),
                    contact_is_typing: ko.observable(),
                    show_contact_invite: ko.observable(false),
                    contactsSelected: ko.observableArray([]),
                    contactTyp: ko.observable(params.contact.name),
                    navigatedPage: ko.observable({page:'', params:''}),

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
                            // appevents.removeSignal("on-cmd-hangup-call", viewModel.onPeerHangup);
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
                        for(var index in contactlist.contacts) {
                            this.contacts.push(Object.assign(new this.Contact(), contactlist.contacts[index]));
                        }

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
                                    // return streembit.notify.error('Start WebRTC call error, %j', err);
                                    return streembit.notify.error(errhandler.getmsg(errcodes.UI_START_WEBRTC_CALL, err));
                                }
                                console.log(`Call with ${options.contact.name} initiated`);

                                if (params.sid) {
                                    viewModel.updateGroupCall({sid: params.sid});
                                }

                                groupcall.add(options.contact);

                                if (params.attendees) {
                                    // initcall for each
                                    setTimeout(() => {
                                        for(var index in params.attendees) {
                                            options.contact = params.attendees[index];
                                            options.elnum = groupcall.participants.length;

                                            webrtccall.initcall(null, null, options, err => {
                                                if (err) {
                                                    // return streembit.notify.error('Start WebRTC call error, %j', err);
                                                    return streembit.notify.error(errhandler.getmsg(errcodes.UI_START_WEBRTC_CALL, err));
                                                }
                                                console.log(`Call with ${options.contact.name} initiated`);

                                                groupcall.add(params.attendees[index]);
                                                //update the group call participants
                                                for (var i = viewModel.group().length; i < groupcall.participants.length; i++) {
                                                    viewModel.group.push(groupcall.participants[i]);
                                                    viewModel.groupNames.push(groupcall.participants[i].name);
                                                    appevents.dispatch("newParticipant", "addNewParticipant");
                                                }
                                            });
                                        }
                                    }, 2500);
                                }

                                //add the first partee to the group call array
                                viewModel.group.push(groupcall.participants[0]);
                                viewModel.groupNames.push(groupcall.participants[0].name);
                                appevents.dispatch("newParticipant", "addNewParticipant");
                            });
                        } else {
                            //update the group call in case the user added new participants from the small panel
                            var participantNum = viewModel.group().length;
                            for (var i = participantNum; i < groupcall.participants.length; i++) {
                                viewModel.group.push(groupcall.participants[i]);
                                viewModel.groupNames.push(groupcall.participants[i].name);
                            }
                        }

                        document.getElementById("txtChatCtrl").onkeyup  = function(e) {
                            var code = e.which;
                            if (code == 13) {
                                e.preventDefault();
                                var text = document.getElementById('txtChatCtrl').value;
                                text = text.trim();
                                if (text) {
                                    viewModel.chatmsg(text);
                                    viewModel.sendchat();
                                }
                            }
                        }

                        appevents.dispatch("oncontactevent", "on-selected-contact-change", this.contact.name);
                    },

                    showInviteButton: function(contact) {
                        var isInCall = false;
                        for(var index in group) {
                            if(group[index].name == contact.name) {
                                isInCall = true;
                            }
                        }
                        return isInCall;
                    },

                    hangup: function () {
                        if (viewModel.call_timer_obj) {
                            for(var index in viewModel.call_timer_obj) {
                                clearTimeout(viewModel.call_timer_obj[index]);
                            }
                        }

                        const group = groupcall.participants;
                        window.callData = null;

                        groupcall.hangupAll();
                        viewModel.group.removeAll();
                        viewModel.groupNames.removeAll();
                        appevents.dispatch("newParticipant", "removeParticipant");

                        for(var index in group) {
                            peercomm.hangup_call(group[index], 1);
                        }

                        appevents.removeSignal("groupcallevent", viewModel.onGroupcallEvent);
                        appevents.removeSignal("on-cmd-hangup-call", viewModel.onPeerHangup);
                    },

                    hangup_gcpart: function (contact) {
                        const bypk = groupcall.participants.filter(p => p.pkeyhash === contact.pkeyhash);
                        if (!bypk.length) {
                            // return streembit.notify.error('Error on removing participant, Not found by pkeyhash');
                            return streembit.notify.error(errhandler.getmsg(errcodes.UI_REMOVING_PARTICIPANT));
                        }

                        viewModel.group.remove(bypk[0]);
                        viewModel.groupNames.remove(bypk[0].name);
                        groupcall.hangupCall(bypk[0]);
                        peercomm.hangup_call(bypk[0]);
                        appevents.dispatch("newParticipant", "removeParticipant");
                    },

                    onPeerHangup: function (sender, payload) {
                        try {
                            if (viewModel.call_timer_obj) {
                                for(var index in viewModel.call_timer_obj) {
                                    clearTimeout(viewModel.call_timer_obj[index]);
                                }
                            }

                            const group = groupcall.participants;
                            window.callData = null;

                            for(var index in group) {
                                if(group.length > 1){
                                    groupcall.hangupAll();
                                    return streembit.notify.info("Group call has been terminated");
                                }else{
                                    groupcall.hangupAll();
                                    return streembit.notify.info("Call Terminated");
                                }
                            }

                            const partee = groupcall.participants.filter(p => p.name === sender)[0];
                            if (partee) {
                                viewModel.group.remove(partee);
                                viewModel.groupNames.remove(partee.name);
                                groupcall.hangupCall(partee);
                                appevents.dispatch("newParticipant", "removeParticipant");
                            }

                            streembit.notify.info("The call has been terminated by the contact", null, true);
                        } catch (e) {
                            // streembit.notify.error('Error processing onPerrHangup: %j', e);
                            streembit.notify.error(errhandler.getmsg(errcodes.UI_PROCESSING_ONPERRHANGUP, e));
                        }
                    },

                    onRemoteStreamConnect: function (contact) {
                        console.log("AudioCallVM viewmodel onRemoteStreamConnect for " +contact.name);
                        groupcall.calltimeproc(contact);
                    },

                    show_invite: function () {
                        viewModel.show_contact_invite(true);
                    },

                    inviteContact: function(contact) {
                        groupcall.invite(contact).then((result) => {
                            if(result) {
                                //update the group call participants to update the view
                                for (var i = viewModel.group().length; i < groupcall.participants.length; i++) {
                                    viewModel.group.push(groupcall.participants[i]);
                                    viewModel.groupNames.push(groupcall.participants[i].name);
                                }
                                appevents.dispatch("newParticipant", "addNewParticipant");
                            }
                        })
                        //hide the pop-up
                        viewModel.show_contact_invite(false);
                    },

                    close_add_group: function () {
                        viewModel.show_contact_invite(false);
                    },

                    sendfile: function () {
                        if (!peercomm.is_peer_session(viewModel.contact.name)) {
                            // return streembit.notify.error("Invalid contact session");
                            return streembit.notify.error(errhandler.getmsg(errcodes.UI_INVALID_CONTACT_SESSION));
                        }

                        try {
                            var recipients = [];
                            var callDivName = document.querySelectorAll('.forShowChatPos .user-name-div');

                            for(var index in callDivName) {
                                var nameMainDiv = callDivName[index].innerHTML;
                                for(var i in contactlist.contacts) {
                                    if(nameMainDiv == contactlist.contacts[i].name) {
                                        recipients.push(contactlist.contacts[i]);
                                    }
                                }
                            }

                            var filetask = new filesender();
                            filetask.run(recipients);
                        }
                        catch (err) {
                            // streembit.notify.error("Send file error: %j", err);
                            streembit.notify.error(errhandler.getmsg(errcodes.UI_SEND_FILE_ERROR, err));
                        }
                    },

                    showchat: function () {
                        try {
                            if (viewModel.make_connection_inprogress == true) {
                                return streembit.notify.info("Please wait ... making a connection is in progress.", null, true);
                            }

                            var groupContCall = groupcall.participants;
                            viewModel.contactsSelected = [];
                            ko.utils.arrayFilter(groupContCall, function(cont, idx) {
                                ko.utils.arrayFilter(viewModel.contacts(), function(ctn, num) {
                                    if(ctn.name == cont.name){
                                        viewModel.contactsSelected.push(ctn);
                                        if(viewModel.contact_name.indexOf(ctn.name) == -1){
                                            viewModel.contact_name.push(ctn.name);
                                        }
                                    }
                                });
                            });
                            viewModel.isChatDisplay(true);
                            viewModel.connectToContact();

                            //show the small audio panel
                            viewModel.navigatedPage({page: "audio-chat-view", params: ""});
                        }
                        catch (err) {
                            viewModel.make_connection_inprogress = false;
                            appevents.dispatch("on-task-event", "close", "send", taskid);
                            clearTimeout(taskTimer);
                            // streembit.notify.error("Start chat error: %j", err);
                            streembit.notify.error(errhandler.getmsg(errcodes.UI_START_CHAT_ERROR, err));
                        }
                    },
                    connectToContact: function () {
                        var taskTimer, taskid;
                        var created = false, reported = false;
                        ctn = viewModel.contactsSelected[0];
                        viewModel.contactsSelected.shift();
                        viewModel.make_connection_inprogress = true;
                        taskid = uuid.v1();
                        if(!connections.connected(ctn.name)) {
                            connections.create(ctn, true, taskid, function (err, webrtcconn) {
                                viewModel.make_connection_inprogress = false;
                                appevents.dispatch("on-task-event", "close", "send", taskid);
                                clearTimeout(taskTimer);

                                if (err) {
                                    reported = true;
                                    // return streembit.notify.error("Error in starting chat: %j", err, true);
                                    return streembit.notify.error(errhandler.getmsg(errcodes.UI_STARTING_CHAT, err, true));
                                }

                                if (!webrtcconn) {
                                    reported = true;
                                    // return streembit.notify.error("Error in starting chat, no WebRTC connection", null, true);
                                    return streembit.notify.error(errhandler.getmsg(errcodes.UI_STARTING_CHAT_NO_WEBRTC_CONN, null, true));
                                }

                                viewModel.webrtcconn[ctn.pkeyhash] = webrtcconn;

                                // add messages from appsrvc
                                viewModel.synchronizeTextMessages();

                            });
                            taskTimer = setTimeout(function () {
                                if (!created && !reported) {
                                    //viewModel.unblockwait();
                                    // streembit.notify.error("Error in starting chat: no reply from the contact", null, true);
                                    streembit.notify.error(errhandler.getmsg(errcodes.UI_CHAT_REPLY_FROM_CONTACT, null, true));
                                    viewModel.make_connection_inprogress = false;
                                    appevents.dispatch("on-task-event", "close", "send", taskid);
                                }
                            },
                            35000);
                        } else {
                            // add messages from appsrvc
                            viewModel.synchronizeTextMessages();
                        }
                        //loop throug all contacts in case of group calls
                        if (viewModel.contactsSelected.length > 0) {
                            viewModel.connectToContact();
                        }
                    },
                    savechat: function () {
                        // send chat history to the contact
                        if (!peercomm.is_peer_session(viewModel.contact.name)) {
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

                                    if (!viewModel.webrtcconn[this.contact.pkeyhash]) {
                                        viewModel.webrtcconn[this.contact.pkeyhash] = connections.get(this.contact.name);
                                    }

                                    viewModel.webrtcconn[this.contact.pkeyhash].send(peermsg);
                                }
                                catch (err) {
                                    streembit.notify.error(errhandler.getmsg(errcodes.UI_SENDING_CHAT_HISTORY, err));
                                }

                                streembit.notify.success('Chat history saved');
                            },
                            err => streembit.notify.error(errhandler.getmsg(errcodes.UI_ERROR_SAVING_CHAT_HISTORY, +err))
                        );
                    },
                    rmchat: function () {
                        if (!peercomm.is_peer_session(viewModel.contact.name)) {
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

                                        if (!viewModel.webrtcconn[this.contact.pkeyhash]) {
                                            viewModel.webrtcconn[this.contact.pkeyhash] = connections.get(this.contact.name);
                                        }

                                        viewModel.webrtcconn[this.contact.pkeyhash].send(peermsg);

                                    }
                                    catch (err) {
                                        streembit.notify.error(errhandler.getmsg(errcodes.UI_SENDING_CHAT_HISTORY, err));
                                    }

                                    streembit.notify.success('Chat history has been deleted')
                                },
                                err => streembit.notify.error(errhandler.getmsg(errcodes.UI_DELETING_CHAT_HISTORY, +err))
                            );
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
                            var cont = document.querySelector('.chatitemswnd');
                            if(cont){
                                cont.scrollTop = cont.scrollHeight;
                            }
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

                            var groupCont = groupcall.participants, myMsg = msg;

                            ko.utils.arrayFilter(groupCont, function(cont, idx) {
                                ko.utils.arrayFilter(viewModel.contacts(), function(ctn, nm) {

                                    if(cont.name == ctn.name){
                                        msg = myMsg;
                                        const msgSend = msg || viewModel.chatmsg().trim();

                                        if (!msgSend) { return }
                                        else {myMsg = msgSend}

                                        if (!viewModel.webrtcconn[ctn.pkeyhash] || viewModel.webrtcconn[ctn.pkeyhash] == 'undefined') {
                                            viewModel.webrtcconn[ctn.pkeyhash] = connections.get(ctn.name);
                                        }

                                        if (!viewModel.webrtcconn[ctn.pkeyhash]) {
                                            // throw new Error("invalid WebRTC data connection")
                                            throw new Error(errhandler.getmsg(errcodes.UI_INVALID_WEBRTC_DATA_CONN));
                                        }

                                        var message = { cmd: type || defs.PEERMSG_TXTMSG, sender: appsrvc.username, text: msgSend };
                                        var contact = contactlist.get_contact(ctn.name);
                                        var peermsg = peercomm.get_peer_message(contact, message);

                                        viewModel.webrtcconn[ctn.pkeyhash].send(peermsg);

                                        // assuming this is a regular chat message
                                        if (!msg) {
                                            //  update the list with the sent message
                                            message.time = utilities.timeNow();
                                            viewModel.addTextMessage(message);
                                            appsrvc.add_textmsg(cont.name, message);
                                            viewModel.chatmsg('');
                                        }
                                    }
                                })
                            })
                        }
                        catch (err) {
                            // streembit.notify.error("Send chat error %j", err, true);
                            streembit.notify.error(errhandler.getmsg(errcodes.UI_SEND_CHAT_ERROR, err, true));
                        }
                    },

                    sendChatMsg: function() {
                        var text = document.querySelector("#txtChatCtrl").value.trim();
                        if (text) {
                            viewModel.chatmsg(text);
                            viewModel.sendchat();
                        }
                    },

                    onContactTyping: function() {
                        viewModel.contact_is_typing(viewModel.contactTyp() + " " + "is typing...");
                    },

                    typing: function() {
                        try {
                            if (!peercomm.is_peer_session(viewModel.contact.name)) {
                                // return streembit.notify.error("Unable to send data. No session exists with the contact");
                                return streembit.notify.error(errhandler.getmsg(errcodes.UI_UNABLE_SEND_DATA));
                            }
                            var groupCnt = groupcall.participants;
                            ko.utils.arrayFilter(groupCnt, function(cont, idx) {
                                ko.utils.arrayFilter(viewModel.contacts(), function(ctn, nm) {

                                    if(cont.name == ctn.name){

                                        if (!viewModel.webrtcconn[ctn.pkeyhash]  || viewModel.webrtcconn[ctn.pkeyhash] == 'undefined') {
                                            viewModel.webrtcconn[ctn.pkeyhash] = connections.get(ctn.name);
                                        }

                                        var message = { cmd: defs.PEERMSG_TYPING, sender: appsrvc.username};
                                        var peermsg = peercomm.get_peer_message(ctn, message);

                                        viewModel.webrtcconn[ctn.pkeyhash].send(peermsg);
                                    }
                                })
                            })
                        }
                        catch (err) {
                            // streembit.notify.error("Send chat error %j", err);
                            streembit.notify.error(errhandler.getmsg(errcodes.UI_SEND_CHAT_ERROR, err));
                        }
                    },


                    onTextMessage: function (event, msg, type = null, contact = null) {
                        var groupContact = groupcall.participants;
                        ko.utils.arrayFilter(groupContact, function(cont, idx) {
                            ko.utils.arrayFilter(viewModel.contacts(), function(ctn, nm) {
                                if (msg.sender === ctn.name) {
                                    if (event === "on-text-message") {
                                        msg.text = `${msg.text}`;
                                        viewModel.addTextMessage(msg);
                                    }
                                }
                            })
                        })
                    },

                    showTextMessage: function (msg) {
                        if (viewModel.isChatDisplay == false) {
                            viewModel.isChatDisplay(true);
                            // add messages from appsrvc
                            viewModel.synchronizeTextMessages();
                        }
                        viewModel.addTextMessage(msg);
                    },

                    // make sure the previously received/sent text messages are displayed
                    synchronizeTextMessages() {
                        if (viewModel.chatitems().length == 0) {
                            var groupCnt = groupcall.participants;
                            ko.utils.arrayFilter(groupCnt, function(cont, idx) {
                                ko.utils.arrayFilter(viewModel.contacts(), function(ctn, nm) {
                                    if(cont.name == ctn.name){
                                        var items = appsrvc.get_textmsg(ctn.name);
                                        if (items && items.length) {
                                            var new_array = items.slice(0);
                                            viewModel.chatitems(new_array);
                                        }
                                    }
                                })
                            })
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
                            // return streembit.notify.error('Error verifying groupcall identity');
                            return streembit.notify.error(errhandler.getmsg(errcodes.UI_VERIFYING_GROUPCALL_IDENTITY));
                        }

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
                                            // return streembit.notify.error('Error on start WebRTC call with ' + payload.attendee.name + ', %j', err);
                                            return streembit.notify.error(errhandler.getmsg(errcodes.UI_ERR_START_WEBRTC_CALL) + payload.attendee.name, err);
                                        }

                                        groupcall.add(payload.attendee);
                                        //update the group call participants
                                        for (var i = viewModel.group().length; i < groupcall.participants.length; i++) {
                                            viewModel.group.push(groupcall.participants[i]);
                                            viewModel.groupNames.push(groupcall.participants[i].name);
                                        }
                                        appevents.dispatch("newParticipant", "addNewParticipant");

                                        console.log(`Call with ${payload.attendee.name} initiated`);
                                    });
                                }, 2000)
                            })
                            .catch(function (err) {
                                // send hangup request to attendee
                                // return streembit.notify.error("Error pinging new groupchat attendee: %j", err);
                                return streembit.notify.error(errhandler.getmsg(errcodes.UI_PINGING_NEW_GROUPCHAT_ATTENDEE, err));
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

                viewModel.navigatedPage.subscribe(function(newValue) {
                    postbox.notifySubscribers(newValue, "navigateInof");
                });

                return viewModel;
            }

            return {
                viewModel: AudioCallVM,
                template: template
            };
        }
    ); // define end
}());
