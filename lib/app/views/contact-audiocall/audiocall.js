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

            function showChatControl() {
                $(".chat_items").css({
                    display: 'flex',
                });

                $('.media-call-content').css({ flexDirection: 'row' });
                $('.chat-fill-area').css({ height: ($('.content-panel').height() - 260), 'width': '100%'});
                $('.footer-chat-controls').css({'width': '100%'});
                $(".chat_items").show();
                $('.add-audio-call').css({'right': '80px', 'top':'60px', 'left': 'auto'});
                $('.add-audio-call').addClass('changeplace');

                if(!$('.for-group-users').length){
                    var numb = 0;
                    $.each($('.forShowChatPos > div'), (eix, el) => {
                        const duringCallDiv = $('<div></div>').attr({ 'data-cid': $(el).attr('id') });
                        duringCallDiv.toggleClass('smallSpeakerWind');
                        duringCallDiv.append($('<span class="user-name"></span>').text($(el).find('span').text()));
                        duringCallDiv.append($('<div></div>').append($(el).find('.remote-audio')).css({ position: 'absolute', opacity: 0, height: 1, bottom: 30 }));
                        duringCallDiv.append($('<div></div>').css({ float: 'none',  }).append($(el).find('.audio-viz')).css({'display':'none'}));
                        duringCallDiv.append($('<div></div>').html('').css({ float: 'none', clear: 'both', width: '100%', height: 0, background: '#c4c4c4' }));

                        if(!$('.smSpeakSt').length){
                            $('#smallScreenAudioCall1').append(duringCallDiv);
                        }else{
                            $('.smSpeakSt').before(duringCallDiv);
                        }
                        if(numb == 0){
                            $('.smallSpeakerWind').after('<div class="smSpeakSt" style="text-align:center;"><i class="fa fa-volume-up" style="font-size:45px;color:#6893c7"></i></div>');
                            numb++;
                        }else{
                            $('#smallScreenAudioCall1').css({'width': '215px'});
                            
                            if($('.smSpeakSt').length){
                                $('.smSpeakSt').before($('<div class="for-group-users"></div>'));
                                var oldDiv =  $('.smallSpeakerWind').detach();
                                $('.for-group-users').append(oldDiv);
                                $('.smSpeakSt').css({'display': 'inline-block', 'width': '50%'});
                            }
                        }
                        
                    });
                }
                $('.add-audio-call.changeplace').css({'display': 'none'});
                $("#call").children('div').hide();
                const audio = $('#smallScreenAudioCall1').find('audio');
                $.each(audio, (eix, el) => {
                    $('#smallScreenAudioCall1').find('audio')[eix].play();
                });
                $('#smallScreenAudioCall1').find('canvas').css({ width: '200px', height: 64 });
                $('#smallScreenAudioCall1').show();

                if($(".contacts-container").hasClass('activate')){
                    $('#smallScreenAudioCall1').css({'right':'240px'});
                }else{
                    $('#smallScreenAudioCall1').css({'right':'0px'});
                }

                var audioPlay = $('#smallScreenAudioCall1 span div');
                $.each(audioPlay, (cnt, num) => {
                    audioPlay.eq(num).next()[num].play();
                })
                $('#smallScreenAudioCall1').css({'right': 0});
                $('.save-rm-chat-audio').css({'display':'block'});
                $('.callbuttons').css({'display': 'none'});
                $('.chat-name-during-audiocall').css({'display': 'block'});
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
                    ischatdisplay: false,
                    isaudio: ko.observable(true),
                    make_connection_inprogress: false,
                    webrtcconn: {},
                    contacts: ko.observableArray([]),
                    group: ko.observableArray([]),
                    secid: null,
                    contactTyping: ko.observable(false),
                    contact_is_typing: ko.observable(),
                    showInvite: ko.observable(false),
                    show_contact_invite: ko.observable(false),
                    contactsSelected: ko.observableArray([]),
                    contactTyp: ko.observable(params.contact.name),

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
                        //     groupcall.reset();

                        //     if (!viewModel.peerhangup) {
                        //         peercomm.hangup_call(viewModel.contact);
                        //     }
                        //     if (viewModel.call_timer_obj) {
                        //         $.each(viewModel.call_timer_obj, (tix, t) => {
                        //             clearTimeout(t);
                        //         });
                        //     }

                        //     //
                        //     appevents.removeSignal("on-cmd-hangup-call", viewModel.onPeerHangup);
                        //     appevents.removeSignal("on-remotestream-connect", viewModel.onRemoteStreamConnect);
                        //     appevents.removeSignal("oncontactevent", viewModel.onTextMessage);
                        //     appevents.removeSignal("groupcallevent", viewModel.onGroupcallEvent);
                        //     appevents.removeSignal("ontyping", this.onContactTyping);
                        // }
                        // catch (err) {
                        //     streembit.notify.error("AudioCallVM dispose %j", err, true);
                        // }
                    },

                    init: function () {
                        $('#call canvas').css({ height: 220, width: 308 });
                        $('#call  audio').css({ width: 308});
                        $('.forShowChatPos').css({'float': 'none', 'margin-left': '200px'});
                        $('.calltime_parent').css({'right': '20px'});
                        if($(window).width() < 1366) {
                            $('.forShowChatPos').css({'float': 'none', 'margin-left': '10px'});
                        }
                        $('.chat-fill-area').css({ height: ($('.content-panel').height() - 260), 'width': '100%' });
                        
                        var normScr = $('#smallScreenAudioCall1 span').find('div:eq(0)');
                        var normCan = $('#smallScreenAudioCall1 span div');
                        var normAud = $('#smallScreenAudioCall1 span audio');
                        $('.calltime_parent').css({'display': 'block'});
                        $('#call .forShowChatPos').append(normScr);
                        $('#call .forShowChatPos div').append(normCan);
                        $('#call .forShowChatPos div:eq(1)').after(normAud);
                        // $('.forShowChatPos div:eq(1)').next()[0].play();
                        var audioPl = $('#smallScreenAudioCall1 span div');
                        $.each(audioPl, (cnt, num) => {
                            audioPl.eq(num).next()[num].play();
                        })
                        $('.forShowChatPos').find('canvas').css({'display': 'inline-block'});
                        $('.add-audio-call.changeplace').css({'display': 'block'});

                        $(function () {
                            $(window).on('resize', function () {
                                $('.chat-fill-area').css({ height: ($('.content-panel').height() - 260) });
                            })
                        });

                        $.each(contactlist.contacts, (idx, c) => {
                            // if (c.user_type !== 'human' || c.name === this.contact.name) {
                            //     return true;
                            // }
                            this.contacts.push(Object.assign(new this.Contact(), c));
                        });

                        //
                        appevents.addListener("on-cmd-hangup-call", viewModel.onPeerHangup);
                        appevents.addListener("on-remotestream-connect", viewModel.onRemoteStreamConnect);
                        appevents.addListener("oncontactevent", viewModel.onTextMessage);
                        appevents.addListener("groupcallevent", viewModel.onGroupcallEvent);
                        appevents.addListener("ontyping", this.onContactTyping);
                        appevents.addListener("on-chatimg-complete", this.addMyimg);

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
                                                    // return streembit.notify.error('Start WebRTC call error, %j', err);
                                                    return streembit.notify.error(errhandler.getmsg(errcodes.UI_START_WEBRTC_CALL, err));
                                                }

                                                console.log(`Call with ${options.contact.name} initiated`);

                                                groupcall.add(atd);
                                                $('[data-invite=' + atd.pkeyhash + ']').hide();
                                                if ($('.add-audio-call > div > button[style="display: none;"]').length === $('.add-audio-call > div > button').length) {
                                                    $('.add-audio-call').hide();
                                                }
                                            });
                                        });
                                    }, 2500);
                                }
                            });
                        }

                        setTimeout(() => {
                            const activeAu = $('#call .forShowChatPos > div');
                            $.each(activeAu, (eix, el) => {
                                $('[data-invite="' + $(el).attr('id') + '"]').hide();
                            });

                            if ($('.add-audio-call > div > button[style="display: none;"]').length === $('.add-audio-call > div > button').length) {
                                $('.add-audio-call').hide();
                            }
                        }, 500);

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
                        window.callData = null;

                        groupcall.hangupAll();

                        $.each(group, (pix, p) => {
                            peercomm.hangup_call(p, 1);
                        });

                        $.each(contactlist.contacts, (idx, item) => {
                            $('.all-contacts-part .list-group-item').eq(idx).removeClass('selected');
                        })

                        $('#smallScreenAudioCall1').css({'width': '160px'});
                    },

                    hangup_gcpart: function (pkeyhash) {
                        const bypk = groupcall.participants.filter(p => p.pkeyhash === pkeyhash);
                        if (!bypk.length) {
                            // return streembit.notify.error('Error on removing participant, Not found by pkeyhash');
                            return streembit.notify.error(errhandler.getmsg(errcodes.UI_REMOVING_PARTICIPANT));
                        }

                        groupcall.hangupCall(bypk[0]);

                        peercomm.hangup_call(bypk[0]);
                    },

                    onPeerHangup: function (sender, payload) {
                        try {
                            if (viewModel.call_timer_obj) {
                                $.each(viewModel.call_timer_obj, (tix, t) => {
                                    clearTimeout(t);
                                });
                            }

                            const group = groupcall.participants;
                            window.callData = null;
                            
                            $.each(group, (c, n) => {
                                if(group.length > 1){
                                    groupcall.hangupAll();
                                    return streembit.notify.info("Group call has been terminated");
                                }else{
                                    groupcall.hangupAll();
                                    return streembit.notify.info("Call Terminated");
                                }
                            });


                            const partee = groupcall.participants.filter(p => p.name === sender)[0];
                            if (partee) {
                                groupcall.hangupCall(partee);
                            }
                            
                            streembit.notify.info("The call has been terminated by the contact", null, true);

                            $('#smallScreenAudioCall1 span div').remove();
                            $('#smallScreenAudioCall1 span audio').remove();

                            $.each(contactlist.contacts, (idx, item) => {
                                $('.all-contacts-part .list-group-item').eq(idx).removeClass('selected');
                            })

                            $('#smallScreenAudioCall1').css({'width': '160px'});
                            $('.add-all-contacts-field').css({'visibility': 'hidden'});
                            // const data = JSON.parse(payload.data);
                            // if (data.group > 1) {
                            //     groupcall.hangupAll();
                            //     $('#call .forShowChatPos > div').remove();
                            //     return streembit.notify.info("Group call has been terminated");
                            // }else{
                            //     groupcall.hangupAll();
                            //     return streembit.notify.info("Call Terminated");
                            // }


                        } catch (e) {
                            // streembit.notify.error('Error processing onPerrHangup: %j', e);
                            streembit.notify.error(errhandler.getmsg(errcodes.UI_PROCESSING_ONPERRHANGUP, e));
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

                        if (viewModel.call_timer_obj[contact.pkeyhash]) {
                            clearInterval(viewModel.call_timer_obj[contact.pkeyhash]);
                        }

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

                    show_invite: function () {
                        viewModel.show_contact_invite(true);
                        // if(!$('.all-contacts-part').children().length) {
                        //     $.each(contactlist.contacts, (idx, c) => {
                        //         viewModel.contacts.push(Object.assign(new viewModel.Contact(), c));
                        //     });
                        // }
                        $.each(contactlist.contacts, (idx, item) => {
                            if (item.user_type !== 'human' || item.name === this.contact.name) {
                                return;
                            }

                            var contactL = $('.add-all-contacts-field .for-add-group-call .list-group-item');
                            var elemNode = $('<span data-bind="click: inviteContact" class="showAddContBtn"><i class="fa fa-user-plus addUserIcon" style="color:#366297;font-size:16px"></i></span>')[0];
                            var selectedContName =  contactL.eq(idx).find('.text-main').html();
                            var vm = { 
                                inviteContact: function(){ 
                                    groupcall.invite(item);
                                    viewModel.show_contact_invite(false);
                                    if(selectedContName == item.name){
                                        contactL.eq(idx).addClass('selected');
                                        contactL.eq(idx).next().remove();
                                    }
                                } 
                            };

                            ko.applyBindings(vm, elemNode);
                            
                            if(!contactL.eq(idx).hasClass('selected')){
                                contactL.eq(idx).after(elemNode);
                            }

                        });

                    },

                    close_add_group: function () {
                        viewModel.show_contact_invite(false);
                    },

                    invite: function (item) {
                        this.showInvite(false);
                        groupcall.invite(item);
                    },

                    sendfile: function () {
                        if (!peercomm.is_peer_session(viewModel.contact.name)) {
                            // return streembit.notify.error("Invalid contact session");
                            return streembit.notify.error(errhandler.getmsg(errcodes.UI_INVALID_CONTACT_SESSION));
                        }

                        try {
                            var recipients = [];
                            var callDivName = $('#call .forShowChatPos .user-name-div');
                            $.each(callDivName, (a, b) => {
                                var nameMainDiv = callDivName.eq(a).html();
                                $.each(contactlist.contacts, (idx, cont) => {
                                    if(nameMainDiv == cont.name) {
                                        recipients.push(cont);
                                    }  
                                })
                            })
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
                            viewModel.connectToContact();
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

                            showChatControl();
                            if (viewModel.contactsSelected.length > 0) {
                                viewModel.connectToContact();
                            }

                        });

                        $('.calltime_parent').css({'display': 'block'});

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
                    chatimage: function () {
                        if (!peercomm.is_peer_session(viewModel.contact.name)) {
                            return streembit.notify.error(errhandler.getmsg(errcodes.UI_INVALID_CONTACT_SESSION));
                        }

                        try {
                            var filetask = new filesender();
                            filetask.run(this.contact, 'chatimg');
                        }
                        catch (err) {
                            console.log('ERR SEND FILE:', err);
                            streembit.notify.error(errhandler.getmsg(errcodes.UI_SEND_FILE_ERROR, err.message));
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
                            if(typeof $cont[0] !== 'undefined'){
                                $cont[0].scrollTop = $cont[0].scrollHeight;
                            }
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
                                        const msgSend = msg || $.trim(viewModel.chatmsg());

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
                                        var contact = contactlist.get_contact(ctn.name);
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
                            })
                        })
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
                                            // return streembit.notify.error('Error on start WebRTC call with ' + payload.attendee.name + ', %j', err);
                                            return streembit.notify.error(errhandler.getmsg(errcodes.UI_ERR_START_WEBRTC_CALL) + payload.attendee.name, err);
                                        }

                                        groupcall.add(payload.attendee);
                                        $('[data-invite=' +payload.attendee.pkeyhash+ ']').hide();
                                        if ($('.add-audio-call > div > button[style="display: none;"]').length === $('.add-audio-call > div > button').length) {
                                            $('.add-audio-call').hide();
                                        }

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

                return viewModel;
            }

            return {
                viewModel: AudioCallVM,
                template: template
            };

        }
    ); // define end

}());