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
    const contactutils = require('contactutils');
    const connections = require('connections');
    const uuid = require('uuid');
    const secrand = require('secure-random');
    const defs = require('definitions');
    const logger = require('./logger');

    let call = {};

    // TODO monitor the participants, webrtc connections, etc.
    function monitor() {

    }

    call.participants = [];
    call.pending = [];
    call.inprogress = false;
    call.sid = null;
    call.webrtcconn = {};
    call.DOMaudio = '.remoteaudio_parent';

    call.hangupCall = function (partee) {
        call.updateDOM(partee);

        try {
            webrtccall.connection[partee.name].close();
            webrtccall.connection[partee.name] = null;
            call.webrtcconn[partee.pkeyhash].close();
        }
        catch (e) { }

        call.participants = call.participants.filter(p => p.pkeyhash !== partee.pkeyhash);
        if (call.participants.length < 1) {
            appevents.navigate('dashboard');
        }
    };

    call.hangupAll = function () {
        $.each(call.participants, (i, p) => {
            call.hangupCall(p);
        });
    };

    call.init = function () {
        monitor();
    };

    call.add = function (partee) {
        const sesskeys = peercomm.getsesskeys();
        if (sesskeys[partee.name] && sesskeys[partee.name].contact_public_key) {
            call.participants.push(partee);
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
                                    sid: sid,
                                    type: defs.CALLTYPE_AUDIO,
                                    attendees: call.participants
                                };
                                const message = { cmd: defs.PEERMSG_GROUPCHAT_INVITE, sender: appsrvc.username, text: JSON.stringify(payload) };
                                const peermsg = peercomm.get_peer_message(item, message);

                                call.webrtcconn[item.pkeyhash] = webrtcconn;
                                webrtcconn.send(peermsg);
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
            
            let payload = {};
            payload[peermsg.MSGFIELD.GSID] = null;
            payload[peermsg.MSGFIELD.CURRSIG] = appsrvc.pubkeyhash;
            
            if (call.inprogress) {
                payload[peermsg.MSGFIELD.RESULT] = false;
                const msgraw = { cmd: defs.PEERMSG_GROUPCHAT_INVITE_RESP, sender: appsrvc.username, text: JSON.stringify(payload) };
                const msg = peercomm.get_peer_message(contact, msgraw);

                return call.webrtcconn[contact.pkeyhash].send(msg);
            }

            call.inprogress = true;
            const message = `${sender} is inviting you to join a ${data.type.replace(/call/,'')} chat with ${data.attendees.map(atd => atd.name).join(', ')}`;

            apputils.accept_invite(message, function (result) {
                call.webrtcconn[contact.pkeyhash] = connections.get(contact.name);

                let payload = {};
                payload[peermsg.MSGFIELD.GSID] = data.sid;
                payload[peermsg.MSGFIELD.CURRSIG] = appsrvc.pubkeyhash;
                payload[peermsg.MSGFIELD.RESULT] = result;
                const msgraw = { cmd: defs.PEERMSG_GROUPCHAT_INVITE_RESP, sender: appsrvc.username, text: JSON.stringify(payload) };
                const msg = peercomm.get_peer_message(contact, msgraw);

                call.webrtcconn[contact.pkeyhash].send(msg);

                call.inprogress = false;

                if (result) {
                    call.sid = data.sid;
                    call.pending = data.attendees.push(contact);
                    const uioptions = {
                        contact: contact,
                        attendees: data.attendees,
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
                const invited_contact = this.contacts().filter(c => c.pkeyhash === data[peermsg.MSGFIELD.CURRSIG]);
                if (!invited_contact.length) {
                    return streembit.notify.error("Invalid public key provided in invite response");
                }

                // Init connection with him
                call.webrtcadd(invited_contact, 'initial');
            } else {
                streembit.notify.error("Invitation declined");
            }
        }
        catch (err) {
            throw new Error('Unable to handle invite response: ' +err.message);
        }
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

    call.webrtcadd = function (partee, type = null) {
        call.inprogress = true;
        // add invited person to participants list
        call.participants.push(partee);
        call.updateDOM(partee, 'add');

        const options = {
            contact: partee,
            iscaller: true,
            calltype: defs.CALLTYPE_AUDIO,
            elnum: call.participants.length - 1
        };
        webrtccall.initcall(null, null, options, err => {
            if (err) {
                call.hangupCall(partee);
                return streembit.notify.error(err);
            }

            call.inprogress = false;
            
            // send connection open signal to partee
            call.connectionOpen(partee);
            
            if (type === 'initial') {
                // send participant details to other attendees
                call.broadcastParticipants(partee); 
            }
        });
    };

    call.initcall = function(payload) {
        try {
            const data = JSON.stringify(payload.text);
            call.sid = data[peermsg.MSGFIELD.GSID];
            call.webrtcadd(data.attendee);
        } catch (err) {
            streembit.notify.error('Error adding new group call participant, %j', err);
        }
    };

    call.connectionOpen = function (partee) {
        if (!call.webrtcconn[partee.pkeyhash]) {
            return streembit.notify.error('Open WebRTC connection not found');
        }

        let payload = {};
        payload[peermsg.MSGFIELD.GSID] = call.sid;
        payload[peermsg.MSGFIELD.CURRSIG] = appsrvc.pubkeyhash;
        const msgraw = { cmd: defs.PEERMSG_GROUPCHAT_CONNECTION_OPEN, sender: appsrvc.username, text: JSON.stringify(payload) };
        const msg = peercomm.get_peer_message(partee, msgraw);

        call.webrtcconn[partee.pkeyhash].send(msg);
    };
    
    call.onConnectionOpen = function (payload) {
        // check if one WebRTC connection is already in progress
        if (call.inprogress) {
            setTimeout(() => {
                call.onConnectionOpen(payload);
            }, 1000);
            return;
        }

        try {
            const data = JSON.parse(payload.text);
            if (data[peermsg.MSGFIELD.GSID] !== call.sid) {
                throw new Error('Invalid group call ID');
            }
            // open WebRTC connection in response
            const sender = call.pending.filter(c => data[peermsg.MSGFIELD.CURRSIG] === c.pkeyhash);
            if (!sender) {
                throw new Error('Sender not found');
            }

            call.inprogress = true;
            call.updateDOM(sender, 'add');
            call.participants.push(sender);

            const options = {
                contact: sender,
                iscaller: false,
                calltype: defs.CALLTYPE_AUDIO,
                elnum: call.participants.length - 1
            };
            webrtccall.initcall(null, null, options, err => {
                call.inprogress = false;
                if (err) {
                    call.hangupCall(sender);
                    return streembit.notify.error(err);
                }

                call.pending = call.pending.filter(c => data[peermsg.MSGFIELD.CURRSIG] !== c.pkeyhash);
            });
        } catch (err) {
            streembit.notify.error('Error in on connection open processing: %j', err);
        }
    };

    call.broadcastParticipants = function (partee) {
        const msg = {
            [peermsg.MSGFIELD.GSID]: call.sid,
            calltype: defs.CALLTYPE_AUDIO,
            attendee: partee
        };

        $.each(call.participants, (i, p) => {
            const message = { cmd: defs.PEERMSG_GROUPCHAT_ADD, sender: appsrvc.username, text: JSON.stringify(msg) };
            const peermsg = peercomm.get_peer_message(p, message);

            if (!call.webrtcconn[p.pkeyhash]) {
                const taskid = uuid.v1();
                connections.create(p, true, taskid, function (err, webrtcconn) {
                    if (err) {
                        return streembit.notify.error("Error sending new attendee data to contact: %j", err, true);
                    }
                    if (!webrtcconn) {
                        return streembit.notify.error("Error creating WebRTC connection on sending attendee data to contact", null, true);
                    }

                    appevents.dispatch("on-task-event", "close", "send", taskid);

                    call.webrtcconn[p.pkeyhash] = webrtcconn;

                    var contact = contactlist.get_contact(this.contact.name);
                    var peermsg = peercomm.get_peer_message(contact, message);
                    call.webrtcconn[p.pkeyhash].send(peermsg);
                });
            } else {
                call.webrtcconn[p.pkeyhash].send(peermsg);
            }
        });
    };

    module.exports = call;

})();