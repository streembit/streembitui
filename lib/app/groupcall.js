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
Author: Streembit team
Copyright (C) Streembit 2018
-------------------------------------------------------------------------------------------------------------------------

*/

'use strict';

(function () {

    const appsrvc = require('appsrvc');
    const appevents = require('appevents');
    const webrtccall = require('webrtccall');
    const peercomm = require('peercomm');
    const secrand = require('secure-random');
    const defs = require('definitions');
    const logger = require('./logger');
    const errhandler = require("errhandler");
    const errcodes = require("errcodes");
    const contactlist = require("contactlist");

    let sid = null;

    let call = {};

    call.participants = [];
    call.active = [];
    call.pending = [];
    call.recipient = false;
    call.inprogress = false;
    call.DOMaudio = '.forShowChatPos';
    call.DOMcalltime = '.calltime_parent';

    // TODO monitor the participants, webrtc connections, etc.
    function monitor() {

    }

    call.call_timer_obj = {};

    call.toHHMMSS = function (value) {
        var seconds = Math.floor(value),
        hours = Math.floor(seconds / 3600);
        seconds -= hours * 3600;
        var minutes = Math.floor(seconds / 60);
        seconds -= minutes * 60;

        if (hours < 10) { hours = "0" + hours; }
        if (minutes < 10) { minutes = "0" + minutes; }
        if (seconds < 10) { seconds = "0" + seconds; }
        return hours + ':' + minutes + ':' + seconds;
    };

    call.calltimeproc = function (contact) {
        var value = 0;

        if (call.call_timer_obj[contact.pkeyhash]) {
            clearInterval(call.call_timer_obj[contact.pkeyhash]);
        }

        call.call_timer_obj[contact.pkeyhash] = setInterval(function () {
            value++;
            var txt = call.toHHMMSS(value);
            $('[data-calltime=' +contact.pkeyhash+ ']').find('span').eq(1).text(txt);
        }, 1000);
    };

    call.init = function () {
        monitor();
    };

    call.setSid = function (secid) {
        if (!secid) {
            sid = secrand.randomBuffer(32).toString("hex");
            return;
        }

        sid = secid;
    };

    call.getSid = function () {
        return sid;
    };

    call.hangupCall = function (partee) {
        try {
            if (webrtccall.connection[partee.name]) {
                try {
                    webrtccall.connection[partee.name].close();
                    delete webrtccall.connection[partee.name];
                }
                catch (e) { }
            }

            $('#' +partee.pkeyhash).find('.remote-audio').srcObject = null;
            call.updateDOM(partee);

            if (call.call_timer_obj) {
                $.each(call.call_timer_obj, (tix, t) => {
                    clearTimeout(t);
                });
            }
        }
        catch (e) {
            console.log(e);
        }

        if ($('.forShowChatPos > div').length <= 1) {
            $('.forShowChatPos > div > img').hide();
        }

        call.active = call.active.filter(a => a.pkeyhash !== partee.pkeyhash);
        if (call.active.length < 1) {
            webrtccall.hangup();
            call.reset();
            appevents.navigate('dashboard');

            $('#smallScreenAudioCall1 > div').remove();
            $('#smallScreenAudioCall1 span div').remove();
            $('#smallScreenAudioCall1 span audio').remove();
            $('#call .forShowChatPos > div').remove();
        }
    };

    call.hangupAll = function () {
        $.each(call.active, (i, p) => {
            call.hangupCall(p);
        });
    };

    call.reset = function () {
        sid = null;
        call.hangupAll();
        call.participants = [];
        call.active = [];
        call.pending = [];
        call.recipient = false;
        call.inprogress = false;
    };

    call.updateDOM = function(partee, type = null) {
        if (type === 'add') {
            // add audio
            const audioPattern = $(call.DOMaudio).find('div').eq(0).html();
            if(!$('#call .forShowChatPos > div[id="'+partee.pkeyhash+'"]').length){
                const cantainer = $('<div id="'+partee.pkeyhash+'" style="clear:both; text-align:center"></div>');
                    cantainer.append('<span class="user-name-div">'+partee.name+'</span>');
                    cantainer.append('<img src="/lib/images/clear.png" width="14" height="14" alt="" class="rm_partee" style="cursor: pointer" />');
                    cantainer.append('<div style="text-align: center;">\
                                            <canvas class="audio-viz" style="background-color: #666;height:220px;width:308px;display:inline-block"></canvas>\
                                          </div>');
                    cantainer.append('<audio class="remote-audio" controls autoplay></audio>');
                    $(call.DOMaudio).append(cantainer);
                
                // $(call.DOMaudio).append(
                //     $('<div></div>').attr('id', partee.pkeyhash).html(audioPattern)
                // );
                // $('#' +partee.pkeyhash).removeAttr('data-bind').find('span').removeAttr('data-bind').text(partee.name);

                // add calltime
                const ct = $(call.DOMcalltime).find('div').eq(0).html();
                $(call.DOMcalltime).append(
                    $('<div></div>').attr({ 'data-calltime': partee.pkeyhash }).html(ct)
                );
                $(`[data-calltime="${partee.pkeyhash}"]`).find('span').eq(0).text(partee.name).end().find('span').eq(1).text('');
            }


            if ($('.forShowChatPos > div').length > 1) {
                $('.forShowChatPos > div > img').show();
            } else {
                $('.forShowChatPos > div > img').hide();
            }
            return;
        }

        $(`#${partee.pkeyhash}`).remove();
        $(`[data-calltime=${partee.pkeyhash}]`).remove();
        $('#smallScreenAudioCall1 span div').remove();
        $('#smallScreenAudioCall1 span audio').remove();
    };

    call.add = function (partee) {
        const sesskeys = peercomm.getsesskeys();
        if (sesskeys[partee.name] && sesskeys[partee.name].contact_public_key) {
            call.participants.push(partee);
            call.active.push(partee);
        } else {
            // streembit.notify.error('Can not add participant ' +partee.name+ ', session key does not exist');
            streembit.notify.error(errhandler.getmsg(errcodes.UI_CANT_ADD_PARTICIPANT) + partee.name , errhandler.getmsg(errcodes.UI_SESSION_KEY_DOESNT_EXIST));
        }
    };

    call.invite = function (item) {
        if (call.inprogress === true) {
            return streembit.notify.info("Please wait ... making a connection is in progress.", null, true);
        }

        if (!call.active.filter(c => c.pkeyhash === item.pkeyhash).length) {
            if ((typeof item.error === 'function' && item.error().length)) {
                // return streembit.notify.error("Unable to establish a connection with this contact.", null, true);
                return streembit.notify.error(errhandler.getmsg(errcodes.UI_UNABLE_ESTABLISH_CONN_WITH_CONTACT, null, true));
            }

            call.inprogress = true;
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
                            call.setSid();
                            const payload = {
                                sid: call.getSid(),
                                sender: appsrvc.username,
                                attendees: call.active
                            };
                            return peercomm.call(item, defs.CALLTYPE_AUDIO, true, payload);
                        },
                        function (err) {
                            throw new Error(err);
                        }
                    )
                    .then(
                        function (result) {
                            logger.info("Invite accepted: " +result);

                            if (result) {
                                call.updateDOM(item, 'add');

                                let options = {
                                    contact: item,
                                    iscaller: true,
                                    calltype: defs.CALLTYPE_AUDIO,
                                    elnum: call.active.length
                                };

                                webrtccall.initcall(null, null, options, err => {
                                    if (err) {
                                        call.updateDOM(item);
                                        // return streembit.notify.error('Start WebRTC call error, %j', err);
                                        return streembit.notify.error(errhandler.getmsg(errcodes.UI_START_WEBRTC_CALL, err));
                                    }

                                    console.log(`Call with ${item.name} initiated`);

                                    const sid = call.getSid();

                                    $.each(call.active, (idx, p) => {
                                        setTimeout(() => {
                                            peercomm.group_add(p, defs.CALLTYPE_AUDIO, sid, item);
                                        }, 500);
                                    });

                                    call.add(item);
                                    $('[data-invite=' +item.pkeyhash+ ']').hide();
                                    if ($('.add-audio-call > div > button[style="display: none;"]').length === $('.add-audio-call > div > button').length) {
                                        $('.add-audio-call').hide();
                                    }
                                });
                                if($('#smallScreenAudioCall1').length){
                                    $('#smallScreenAudioCall1').css({'width': '215px'});

                                    if($('#smallScreenAudioCall1').css('display') == 'block'){
                                        $.each($('.forShowChatPos > div'), (eix, el) => {
                                            const groupCallSmAdd = $('<div></div>').attr({ 'data-cid': $(el).attr('id') });
                                            groupCallSmAdd.toggleClass('smallSpeakerWind');
                                            groupCallSmAdd.append($('<span class="user-name"></span>').text($(el).find('span').text()));
                                            groupCallSmAdd.append($('<div></div>').append($(el).find('.remote-audio')).css({ position: 'absolute', opacity: 0, height: 1, bottom: 30 }));
                                            groupCallSmAdd.append($('<div></div>').css({ float: 'none',  }).append($(el).find('.audio-viz')).css({'display':'none'}));
                                            groupCallSmAdd.append($('<div></div>').html('').css({ float: 'none', clear: 'both', width: '100%', height: 0, background: '#c4c4c4' }));

                                            $('#smallScreenAudioCall1 .for-group-users').append(groupCallSmAdd);
                                            $('#smallScreenAudioCall1').css({'width': '215px'});
                                            
                                            if($('.smSpeakSt').length && !$('.for-group-users').length){
                                                $('.smSpeakSt').before($('<div class="for-group-users"></div>'));
                                                var oldD =  $('.smallSpeakerWind').detach();
                                                $('.for-group-users').append(oldD);
                                                $('.smSpeakSt').css({'display': 'inline-block', 'width': '50%'});
                                            }
                                                                            
                                        });
                                        
                                    }

                                }
                            }
                            else if (!result) {
                                $.each(contactlist.contacts, (idx, item) => {
                                    $('.all-contacts-part .list-group-item').eq(idx).removeClass('selected');
                                })
                                
                                setTimeout(function () {
                                    streembit.notify.info("Contact " + item.name + " declined the call");
                                }, 500);

                            }
                            else {
                                setTimeout(function () {
                                    // streembit.notify.error("Unable to establish call with contact " + item.name);
                                    streembit.notify.error(errhandler.getmsg(errcodes.UI_ESTABLISH_CALL_WITHCONTACT) + item.name);
                                }, 500);
                            }
                        },
                        function (err) {
                            call.inprogress = false;
                            // streembit.notify.error("Error in starting video call: %j", err);
                            streembit.notify.error(errhandler.getmsg(errcodes.UI_STARTING_VIDEO_CALL, err));
                        }
                    );
            } catch (err) {
                call.inprogress = false;
                // streembit.notify.error(`Error on inviting ${item.name} %j`, err)
                streembit.notify.error(errhandler.getmsg(errcodes.UI_ERR_INVITING) + `${item.name}`, err)
            }
        }
    };

    module.exports = call;

})();