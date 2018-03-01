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
    const connections = require('connections');
    const uuid = require('uuid');
    const peercomm = require('peercomm');
    const secrand = require('secure-random');
    const defs = require('definitions');
    const logger = require('./logger');

    let sid = null;

    let chat = {};

    chat.participants = [];
    chat.active = [];
    chat.inprogress = false;
    chat.DOMaudio = '.remoteaudio_parent';
    chat.DOMcalltime = '.chattime_parent';

    // TODO monitor the participants, webrtc connections, etc.
    function monitor() {

    }

    chat.init = function () {
        monitor();
    };

    chat.setSid = function (secid) {
        if (!secid) {
            sid = secrand.randomBuffer(32).toString("hex");
            return;
        }

        sid = secid;
    };

    chat.getSid = function () {
        return sid;
    };

    chat.exclude = function (partee) {
        
    };

    chat.excludeAll = function () {
        $.each(chat.active, (i, p) => {
            chat.exclude(p);
        });
    };

    chat.reset = function () {
        sid = null;
        chat.excludeAll();
        chat.participants = [];
        chat.active = [];
        chat.inprogress = false;
    };

    chat.updateDOM = function(partee, type = null) {
        if (type === 'add') {
            // add audio
            const audioPattern = $(chat.DOMaudio).find('div').eq(0).html();
            $(chat.DOMaudio).append(
                $('<div></div>').attr('id', partee.pkeyhash).html(audioPattern)
            );
            $('#' +partee.pkeyhash).removeAttr('data-bind').find('h3').removeAttr('data-bind').text(partee.name);

            // add calltime
            const ct = $(chat.DOMcalltime).find('div').eq(0).html();
            $(chat.DOMcalltime).append(
                $('<div></div>').attr({ 'data-calltime': partee.pkeyhash }).html(ct)
            );
            $(`[data-calltime="${partee.pkeyhash}"]`).find('span').eq(0).text(partee.name).find('span').eq(1).text('');

            return;
        }

        $(`#${partee.pkeyhash}`).remove();
        $(`[data-calltime=${partee.pkeyhash}]`).remove();
    };

    chat.add = function (partee) {
        if (chat.participants.filter(p => p.pkeyhash === partee.pkeyhash).length) {
            return;
        }

        const sesskeys = peercomm.getsesskeys();
        if (sesskeys[partee.name] && sesskeys[partee.name].contact_public_key) {
            chat.participants.push(partee);
            chat.active.push(partee);
        } else {
            streembit.notify.error('Can not add participant ' +partee.name+ ', session key does not exist');
        }
    };

    chat.invite = function (item) {
        if (chat.inprogress === true) {
            return streembit.notify.info("Please wait ... making a connection is in progress.", null, true);
        }

        if (!chat.active.filter(c => c.pkeyhash === item.pkeyhash).length) {
            chat.inprogress = true;
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
                            chat.setSid();
                            const payload = {
                                sid: chat.getSid(),
                                sender: appsrvc.username,
                                attendees: chat.active,
                                msg: `Join a group chat with ${appsrvc.username}, ${chat.active.map(atd => atd.name).join(', ')}`,
                                title: `Incoming invitation from ${appsrvc.username}.`
                            };
                            return peercomm.call(item, defs.CALLTYPE_CHAT, true, payload);
                        },
                        function (err) {
                            throw new Error(err);
                        }
                    )
                    .then(
                        function (result) {
                            logger.info("Invite accepted: " +result);

                            if (result) {
                                chat.openWebRTCConnection(item);
                            }
                            else if (!result) {
                                streembit.notify.info("Invitation declined");
                            }
                            else {
                                streembit.notify.info("Invitation timed out");
                            }
                        },
                        function (err) {
                            chat.inprogress = false;
                            streembit.notify.error("Error inviting new person: %j", err);
                        }
                    );
            } catch (err) {
                chat.inprogress = false;
                streembit.notify.error(`Error on inviting ${item.name} %j`, err)
            }
        }
    };

    chat.openWebRTCConnection = function (contact) {
        const conn = connections.get(contact.name);
        if (conn) {
            appevents.dispatch("groupchatevent", "add-webrtcconn", contact, conn);
            return;
        }

        try {
            const taskid = uuid.v1();
            connections.create(contact, true, taskid, function (err, webrtcconn) {
                appevents.dispatch("on-task-event", "close", "send", taskid);

                if (err) {
                    throw new Error("Error initiating chat connection with " +contact.name+ ": " +err);
                }

                appevents.dispatch("groupchatevent", "add-webrtcconn", contact, webrtcconn);
            });
        }
        catch (err) {
            appevents.dispatch("on-task-event", "close", "send", taskid);
            throw new Error("Error initiating WebRTC connection: " +err.message);
        }
    };

    module.exports = chat;

})();