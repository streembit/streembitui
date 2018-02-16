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
    const apputils = require('apputils');
    const webrtccall = require('webrtccall');
    const peermsg = require('peermsg');
    const peercomm = require('peercomm');
    const contactlist = require('contactlist');
    const connections = require('connections');
    const uuid = require('uuid');
    const secrand = require('secure-random');
    const defs = require('definitions');
    const logger = require('./logger');

    let call = {};

    call.participants = [];
    call.pending = [];
    call.recipient = false;
    call.inprogress = false;
    call.sid = null;
    call.webrtcconn = {};
    call.webrtccalls = [];
    call.DOMaudio = '.remoteaudio_parent';

    // TODO monitor the participants, webrtc connections, etc.
    function monitor() {

    }

    call.init = function () {
        monitor();
    };

    call.hangupCall = function (partee) {
        call.updateDOM(partee);

        try {
            webrtccall.connection[partee.name].close();
            webrtccall.connection[partee.name] = null;
            call.webrtcconn[partee.pkeyhash].close();
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

    call.updateDOM = function(partee, type = null) {
        if (type === 'add') {
            const audioPattern = $(call.DOMaudio).find('div').eq(0).html();
            $(call.DOMaudio).append(
                $('<div></div>').attr('id', partee.pkeyhash).html(audioPattern)
            );

            return;
        }

        $(`#${partee.pkeyhash}`).remove();
    };

    call.add = function (partee) {
        const sesskeys = peercomm.getsesskeys();
        if (sesskeys[partee.name] && sesskeys[partee.name].contact_public_key) {
            call.participants.add(partee);
        } else {
            streembit.notify.error('Can not add participant ' +partee.name+ ', session key does not exist');
        }
    };

    call.getWebrtcCall = function(pkhash) {
        if (!call.webrtccalls[pkhash]) {
            call.webrtccalls[pkhash] = Object.assign({}, webrtccall);
        }

        return call.webrtccalls[pkhash];
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
                        () => peercomm.get_contact_session(item),
                        err => {
                            call.inprogress = false;
                            throw new Error(err);
                        }
                    )
                    .then(
                        () => {
                            const taskid = uuid.v1();
                            connections.create(item, true, taskid, function(err, webrtcconn) {

                                call.inprogress = false;
                                appevents.dispatch("on-task-event", "close", "send", taskid);

                                if (err) {
                                    return streembit.notify.error(`Error starting connection with ${item.name}: %j`, err, true);
                                }
                                if (!webrtcconn) {
                                    return streembit.notify.error(`Error starting WebRTC connection with ${item.name}`, null, true);
                                }

                                const sid = call.sid = secrand.randomBuffer(32).toString("hex");

                                const payload = {
                                    type: defs.CALLTYPE_AUDIO,
                                    attendees: call.participants
                                };
                                payload[peermsg.MSGFIELD.GSID] = sid;
                                const msgraw = { cmd: defs.PEERMSG_GROUPCHAT_INVITE, sender: appsrvc.username, text: JSON.stringify(payload) };
                                const msg = peercomm.get_peer_message(item, msgraw);

                                call.webrtcconn[item.pkeyhash] = webrtcconn;
                                webrtcconn.send(msg);

                                call.add(item);
                            });
                        },
                        err => {
                            throw new Error(err);
                        }
                    );
            } catch (err) {
                call.inprogress = false;
                streembit.notify.error(`Error on inviting ${item.name} %j`, err)
            }
        }
    };

    call.inviteIn = function (payload) {
        try {
            const data = JSON.parse(payload.text);
            const sender = payload.sender;
            const contact = contactlist.get_contact(sender);
            if (!contact) {
                throw new Error('Invite sender not found in your contacts list');
            }

            let payload_send = {};
            payload_send[peermsg.MSGFIELD.GSID] = null;
            payload_send[peermsg.MSGFIELD.CURRSIG] = appsrvc.pubkeyhash;

            if (call.inprogress) {
                payload_send[peermsg.MSGFIELD.RESULT] = false;
                const msgraw = { cmd: defs.PEERMSG_GROUPCHAT_INVITE_RESP, sender: appsrvc.username, text: JSON.stringify(payload_send) };
                const msg = peercomm.get_peer_message(contact, msgraw);

                return call.webrtcconn[contact.pkeyhash].send(msg);
            }

            call.inprogress = true;
            const message = `${sender} is inviting you to join ${data.type.replace(/call/,'')} chat with ${data.attendees.map(atd => atd.name).join(', ')}`;

            apputils.accept_invite(message, function (result) {
                call.webrtcconn[contact.pkeyhash] = connections.get(contact.name);

                payload_send[peermsg.MSGFIELD.GSID] = data[peermsg.MSGFIELD.GSID];
                payload_send[peermsg.MSGFIELD.RESULT] = result;
                const msgraw = { cmd: defs.PEERMSG_GROUPCHAT_INVITE_RESP, sender: appsrvc.username, text: JSON.stringify(payload_send) };
                const msg = peercomm.get_peer_message(contact, msgraw);

                call.webrtcconn[contact.pkeyhash].send(msg);

                call.inprogress = false;

                if (result) {
                    call.sid = data[peermsg.MSGFIELD.GSID];
                    call.pending = data.attendees;
                    call.recipient = true;

                    const uioptions = {
                        contact: contact,
                        calltype: data.type,
                        iscaller: false
                    };
                    appevents.navigate(data.type.replace(/call/, '-call'), uioptions);
                }
            })
        }
        catch (err) {
            call.inprogress = false;
            throw new Error('Accept invite call fails. ' +err.message);
        }
    };

    call.inviteResp = function (payload) {
        try {
            let data = JSON.parse(payload.text);
            if (data[peermsg.MSGFIELD.GSID] !== call.sid) {
                data[peermsg.MSGFIELD.RESULT] = false;
            }

            if (data[peermsg.MSGFIELD.RESULT]) {
                const invited_contact = call.participants.filter(c => c.pkeyhash === data[peermsg.MSGFIELD.CURRSIG]);
                if (!invited_contact.length) {
                    return streembit.notify.error("Invalid public key provided in invite response");
                }

                // Init connection with him
                call.webrtcadd(invited_contact[0], 'initial');
            } else {
                streembit.notify.error("Invitation declined");
            }
        }
        catch (err) {
            throw new Error('Unable to handle invite response: ' +err.message);
        }
    };

    call.webrtcadd = function (partee, type = null, iscaller = true) {
        call.inprogress = true;
        call.updateDOM(partee, 'add');

        const webrtccaller = call.getWebrtcCall(partee.pkeyhash);

        const options = {
            contact: partee,
            iscaller: iscaller,
            calltype: defs.CALLTYPE_AUDIO,
            elnum: call.participants.length - 1
        };
        webrtccaller.initcall(null, null, options, err => {
            if (err) {
                call.hangupCall(partee);
                return streembit.notify.error(err);
            }

            call.inprogress = false;

            if (type === 'initial') {
                // send participant details to other attendees
                call.broadcastParticipants(partee);
            } else {
                // add to participants list
                call.add(partee);
            }
        });
    };

    call.initcall = function(payload) {
        try {

            const data = JSON.parse(payload);
            call.sid = data[peermsg.MSGFIELD.GSID];

            peercomm.ping(data.attendee, true, 10000)
                .then(
                    () => peercomm.get_contact_session(data.attendee),
                    err => {
                        call.inprogress = false;
                        throw new Error(err);
                    }
                )
                .then(
                    () => {
                        call.webrtcadd(data.attendee);
                        const type = defs.CALLTYPE_AUDIO;
                        peercomm.group_callready(data.attendee, type, call.sid, appsrvc.pubkeyhash);
                    },
                    err => {
                        throw new Error(err);
                    }
                );

        } catch (err) {
            streembit.notify.error('Error adding new group call participant, %j', err);
        }
    };

    call.readycall = function (payload) {
        if (payload[peermsg.MSGFIELD.GSID] !== call.sid) {
            return streembit.notify.error('Invalid group call secret ID');
        }

        const caller = this.pending.filter(c => payload[peermsg.MSGFIELD.ECDHPK] === c.pkeyhash);
        if (!caller.length) {
            return streembit.notify.error('Invalid private key supplied on ready call');
        }

        call.webrtcadd(caller[0], null, false);
    };

    call.connectionOpen = function (partee) {
        /*let payload = {};
        payload[peermsg.MSGFIELD.GSID] = call.sid;
        payload[peermsg.MSGFIELD.CURRSIG] = appsrvc.pubkeyhash;
        const msgraw = { cmd: defs.PEERMSG_GROUPCHAT_CONNECTION_OPEN, sender: appsrvc.username, text: JSON.stringify(payload) };

        if (!call.webrtcconn[partee.pkeyhash]) {
            try {
                peercomm.ping(partee, true, 10000)
                    .then(
                        () => peercomm.get_contact_session(partee),
                        err => {
                            call.inprogress = false;
                            throw new Error(err);
                        }
                    )
                    .then(
                        () => {
                            const taskid = uuid.v1();
                            connections.create(partee, true, taskid, function(err, webrtcconn) {

                                call.inprogress = false;
                                appevents.dispatch("on-task-event", "close", "send", taskid);

                                if (err) {
                                    return streembit.notify.error(`Error starting connection with ${item.name}: %j`, err, true);
                                }
                                if (!webrtcconn) {
                                    return streembit.notify.error(`Error starting WebRTC connection with ${item.name}`, null, true);
                                }

                                const msg = peercomm.get_peer_message(partee, msgraw);
                                call.webrtcconn[partee.pkeyhash] = webrtcconn;
                                call.webrtcconn[partee.pkeyhash].send(msg);
                            });
                        },
                        err => {
                            throw new Error(err);
                        }
                    );
            } catch (err) {
                call.inprogress = false;
                streembit.notify.error(`Error on initiating connection with ${partee.name} %j`, err)
            }
        } else {
            const msg = peercomm.get_peer_message(partee, msgraw);
            call.webrtcconn[partee.pkeyhash].send(msg);
        }*/
    };

    call.onConnectionOpen = function (payload) {
        // check if one WebRTC connection is already in progress
        /*if (call.inprogress) {
            setTimeout(() => {
                call.onConnectionOpen(payload);
            }, 1000);
            return;
        }

        try {
            call.inprogress = true;

            const data = JSON.parse(payload.text);
            if (data[peermsg.MSGFIELD.GSID] !== call.sid) {
                throw new Error('Invalid group call ID');
            }
            // open WebRTC connection in response
            const sender = call.pending.filter(c => data[peermsg.MSGFIELD.CURRSIG] === c.pkeyhash);
            if (!sender.length) {
                throw new Error('Sender not found');
            }

            if (call.connopen) {
                call.updateDOM(sender[0], 'add');
            }
            call.add(sender[0]);

            const options = {
                contact: sender[0],
                iscaller: true,
                calltype: defs.CALLTYPE_AUDIO,
                elnum: call.participants.length - 1
            };
            webrtccall.initcall(null, null, options, err => {
                call.inprogress = false;

                if (err) {
                    call.hangupCall(sender[0]);
                    return streembit.notify.error(err);
                }

                if (!call.connopen) {
                    call.connopen = true;
                }
                call.pending = call.pending.filter(c => data[peermsg.MSGFIELD.CURRSIG] !== c.pkeyhash);
            });
        } catch (err) {
            streembit.notify.error('Error in on connection open processing: %j', err);
        }*/
    };

    call.broadcastParticipants = function (partee) {
        $.each(call.participants, (i, p) => {
            if (p.pkeyhash === partee.pkeyhash) {
                return true;
            }

            const type = defs.CALLTYPE_AUDIO;
            peercomm.group_add(p, type, call.sid, partee);

            // const msgraw = { cmd: defs.PEERMSG_GROUPCHAT_ADD, sender: appsrvc.username, text: JSON.stringify(payload) };
            // const msg = peercomm.get_peer_message(p, msgraw);
            //
            // if (!call.webrtcconn[p.pkeyhash]) {
            //     const taskid = uuid.v1();
            //     connections.create(p, true, taskid, function (err, webrtcconn) {
            //         if (err) {
            //             return streembit.notify.error("Error sending new attendee data to contact: %j", err, true);
            //         }
            //         if (!webrtcconn) {
            //             return streembit.notify.error("Error creating WebRTC connection on sending attendee data to contact", null, true);
            //         }
            //
            //         appevents.dispatch("on-task-event", "close", "send", taskid);
            //
            //         call.webrtcconn[p.pkeyhash] = webrtcconn;
            //         call.webrtcconn[p.pkeyhash].send(msg);
            //     });
            // } else {
            //     call.webrtcconn[p.pkeyhash].send(msg);
            // }
        });
    };

    module.exports = call;

})();
