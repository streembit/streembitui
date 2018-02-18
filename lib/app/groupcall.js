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

    let sid = null;

    let call = {};

    call.participants = [];
    call.pending = [];
    call.recipient = false;
    call.inprogress = false;
    call.webrtcconn = {};
    call.webrtccalls = [];
    call.DOMaudio = '.remoteaudio_parent';

    // TODO monitor the participants, webrtc connections, etc.
    function monitor() {

    }

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
        call.updateDOM(partee);

        try {
            webrtccall.connection[partee.name].close();
            webrtccall.connection[partee.name] = null;
            call.webrtcconn[partee.pkeyhash].close();
            delete call.webrtccalls[partee.pkeyhash];

            peercomm.hangup_call(partee);
        }
        catch (e) { }

        // send group member hangup

        call.participants = call.participants.filter(p => p.pkeyhash !== partee.pkeyhash);
        if (call.participants.length < 1) {
            webrtccall.hangup();
            appevents.navigate('dashboard');
        }
    };

    call.hangupAll = function () {
        $.each(call.participants, (i, p) => {
            call.hangupCall(p);
        });
    };

    call.reset = function () {
        sid = null;
        call.hangupAll();
        call.participants = [];
        call.pending = [];
        call.recipient = false;
        call.inprogress = false;
        call.webrtcconn = {};
        call.webrtccalls = [];
    };

    call.updateDOM = function(partee, type = null) {
        if (type === 'add') {
            const audioPattern = $(call.DOMaudio).find('div').eq(0).html();
            $(call.DOMaudio).append(
                $('<div></div>').attr('id', partee.pkeyhash).html(audioPattern)
            );
            $('#' +partee.pkeyhash).removeAttr('data-bind').find('h3').removeAttr('data-bind').text(partee.name);

            return;
        }

        $(`#${partee.pkeyhash}`).remove();
    };

    call.add = function (partee) {
        const sesskeys = peercomm.getsesskeys();
        if (sesskeys[partee.name] && sesskeys[partee.name].contact_public_key) {
            call.participants.push(partee);
        } else {
            streembit.notify.error('Can not add participant ' +partee.name+ ', session key does not exist');
        }
    };

    call.invite = function (item) {
        if (call.inprogress === true) {
            return streembit.notify.info("Please wait ... making a connection is in progress.", null, true);
        }

        if (!call.participants.filter(c => c.pkeyhash === item.pkeyhash).length) {
            if (!item.isonline() === false || (typeof item.error === 'function' && item.error().length)) {
                return streembit.notify.error("Unable to establish a connection with this contact.", null, true);
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
                               attendees: call.participants
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
                                    elnum: call.participants.length
                                };

                                webrtccall.initcall(null, null, options, err => {
                                    if (err) {
                                        call.updateDOM(item);
                                        return streembit.notify.error('Start WebRTC call error, %j', err);
                                    }

                                    console.log(`Call with ${item.name} initiated`);

                                    const sid = call.getSid();

                                    $.each(call.participants, (idx, p) => {
                                        setTimeout(() => {
                                            peercomm.group_add(p, defs.CALLTYPE_AUDIO, sid, item);
                                        }, 500);
                                    });

                                    call.add(item);
                                });
                            }
                            else if (!result) {
                                setTimeout(function () {
                                    streembit.notify.info("Contact " + item.name + " declined the call");
                                }, 500);
                            }
                            else {
                                setTimeout(function () {
                                    streembit.notify.error("Unable to establish call with contact " + item.name);
                                }, 500);
                            }
                        },
                        function (err) {
                            call.inprogress = false;
                            streembit.notify.error("Error in starting video call: %j", err);
                        }
                    );
            } catch (err) {
                call.inprogress = false;
                streembit.notify.error(`Error on inviting ${item.name} %j`, err)
            }
        }
    };

    module.exports = call;

})();
