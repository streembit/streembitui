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
        ['knockout', 'appevents', 'contactlist', 'peercomm', 'appsrvc', 'definitions', 'apputils', 'makeusabrew/bootbox', 'webrtclib', './videocall.html!text'],
        function (ko, appevents, contactlist, peercomm, appsrvc, defs, apputils, bootbox, webrtclib, template) {

            function resize_video_controls() {
                $('.localvid_parent').css("display", "");
                $('.localvid_parent').css("justify-content");
                $('.localvid_parent').css("margin-bottom", 0);
                $('.localvid_parent').css("position", 'absolute');

                var vh = $('.remotevid_parent').height();
                var h = vh - 10;
                var w = parseInt(h * 1.3333);
                var video = $("#remotevid");
                $(video).width(w);

                var rpos = $('#remotevid').position();
                var rwidth = $('#remotevid').width();
                var local_left = (rpos.left + rwidth) - 166;
                $('.localvid_parent').css({
                    position: 'absolute',
                    top: 10,
                    left: local_left
                });
                $('.localvid_parent').css('zIndex', '9999');
            }

            function onRemoteVidConn() {
                resize_video_controls();
                var local_video = document.getElementById("localvid");
                local_video.muted = true; // !important, without this the sound will be echoing
            }

            function onWindowResize() {
                resize_video_controls();
            }

            function showChatControl(callback) {

                // show the chat window
                var chatContainer = $(".chat_items");
                $(chatContainer).css({
                    flex: 1,
                    display: 'flex',
                });

                resize_video_controls();

                var parent_div_width = $('.media-call-content').width();
                var parent_div_height = $('.media-call-content').height();

                var video_h = parent_div_height - 300;
                if (video_h < 500) {
                    video_h = 500;
                }

                $('.video_ctrls_items').css({
                    'min-height': video_h + 'px'
                });

                resize_video_controls();

                $(chatContainer).css({
                    flex: 1,
                    display: 'flex',
                });

                callback();

                resize_video_controls();
            }

            function VideoCallVM(params) {
                var viewModel = {
                    localVideo: "localvid",
                    remoteVideo: "remotevid",
                    contact: params.contact,
                    contact_name: ko.observable(params.contact.name),
                    iscaller: params.iscaller,
                    calltype: params.calltype,
                    isvideocall: ko.observable(false),
                    isaudiocall: ko.observable(false),
                    peerhangup: false,
                    calltime: ko.observable(0),
                    call_timer_obj: null,
                    videoConnCallback: 0,
                    showChatCallback: 0,
                    chatitems: ko.observableArray([]),
                    chatmsg: ko.observable(''),
                    ischatdisplay: false,
                    isvideo: ko.observable(true),
                    isaudio: ko.observable(true),

                    dispose: function () {
                        try {
                            webrtclib.hangup();
                            if (!viewModel.peerhangup) {
                                peercomm.hangup_call(viewModel.contact);
                            }
                            if (viewModel.call_timer_obj) {
                                clearTimeout(viewModel.call_timer_obj);
                            }

                            //
                            appevents.removeSignal("on-video-connect", viewModel.onRemoteVideoConnect);
                            appevents.removeSignal("on-cmd-hangup-call", viewModel.onPeerHangup);
                        }
                        catch (err) {
                            streembit.notify.error("Mediacall dispose %j", err, true);
                        }
                    },

                    init: function () {
                        this.isvideocall(this.calltype == defs.CALLTYPE_VIDEO);
                        this.isaudiocall(this.calltype == defs.CALLTYPE_AUDIO);
                        var options = {
                            contact: this.contact,
                            iscaller: this.iscaller,
                            calltype: this.calltype
                        };
                        webrtclib.init(viewModel.localVideo, viewModel.remoteVideo, options);

                        //
                        appevents.addListener("on-video-connect", viewModel.onRemoteVideoConnect);
                        appevents.addListener("on-cmd-hangup-call", viewModel.onPeerHangup);

                        // add window resize event handler
                        $(window).resize(onWindowResize);
                    },

                    onPeerHangup: function () {
                        viewModel.peerhangup = true;
                        webrtclib.hangup();
                        // navigate to empty screen
                        appevents.dispatch("display-view", "emptyview");
                        streembit.notify.info("The call has been terminated by the contact");
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
                        viewModel.call_timer_obj = setInterval(function () {
                            value++;
                            var txt = viewModel.toHHMMSS(value);
                            viewModel.calltime(txt);
                        }, 1000);
                    },

                    onRemoteVideoConnect: function () {
                        console.log("VideoCallVM viewmodel onRemoteVideoConnect");
                        onRemoteVidConn();
                        viewModel.calltimeproc();
                    },

                    sendfile: function () {
                        if (!peercomm.is_peer_session(viewModel.contact.name)) {
                            return streembit.notify.error_popup("Invalid contact session");
                        }

                        streembit.UI.showSendFile(viewModel.contact);
                    },

                    showchat: function () {
                        if (viewModel.showChatCallback) {
                            viewModel.showChatCallback(function () {
                                // initialize the chat items
                                var items = streembit.Session.get_textmsg(viewModel.contact.name);
                                var new_array = items.slice(0);
                                viewModel.chatitems(new_array);
                                viewModel.ischatdisplay = true;
                            });
                        }
                    },

                    add_video: function () {
                        webrtclib.show_video(function () {
                            viewModel.isvideo(true);
                            // TODO send to the peer
                        });
                    },

                    remove_video: function () {
                        webrtclib.hide_video(function () {
                            viewModel.isvideo(false);
                            // TODO send to the peer
                        });
                    },

                    add_audio: function () {
                        webrtclib.toggle_audio(true, function () {
                            viewModel.isaudio(true);
                            // TODO send to the peer
                        });
                    },

                    remove_audio: function () {
                        webrtclib.toggle_audio(false, function () {
                            viewModel.isaudio(false);
                            // TODO send to the peer
                        });
                    },

                    hangup: function () {
                        webrtclib.hangup();
                        peercomm.hangup_call(viewModel.contact);

                        // navigate to empty screen
                        appevents.dispatch("display-view", "emptyview");
                     
                        if (viewModel.call_timer_obj) {
                            clearTimeout(viewModel.call_timer_obj);
                        }
                    },

                    sendchat: function () {
                        try {
                            var msg = $.trim(this.chatmsg());
                            if (!msg) { return }

                            var message = { cmd: defs.PEERMSG_TXTMSG, sender: appsrvc.username, text: msg };
                            var contact = contactlist.get_contact(this.contact.name);
                            peercomm.send_peer_message(contact, message);
                            //  update the list with the sent message
                            message.time = apputils.timeNow();
                            this.onTextMessage(message);
                            appsrvc.add_textmsg(viewModel.contact.name, message);
                            this.chatmsg('');
                        }
                        catch (err) {
                            streembit.notify.error("Send chat error %j", err, true);
                        }
                    },

                    onTextMessage: function (msg) {
                        viewModel.chatitems.push(msg);
                        var $cont = $('.chatitemswnd');
                        $cont[0].scrollTop = $cont[0].scrollHeight;

                        if (viewModel.ischatdisplay == false) {
                            viewModel.showchat();
                        }
                    }
                };

                viewModel.init();

                return viewModel;
            }

            return {
                viewModel: VideoCallVM,
                template: template
            };

        }
    ); // define end

}());
