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
        ['knockout', 'appevents', 'peercomm', 'appsrvc', 'definitions', 'makeusabrew/bootbox', 'uihandler', './contactdetails.html!text'],
        function (ko, appevents, peercomm, appsrvc, defs, bootbox, uihandler, template) {
        function ContactVM(params) {

            var viewModel = {
                name: ko.observable(params.name),
                address: ko.observable(params.address),
                port: ko.observable(params.port),
                public_key: ko.observable(params.public_key),
                type: ko.observable(params.type),
                protocol: ko.observable(params.protocol),
                contact: params,

                waitscreen: function (msg) {
                    var template = $("#callprogress-template")[0].innerHTML;
                    var html = $(template);
                    html.find("#wait-msg-tag").text(msg + " " + viewModel.contact.name);
                    var waitmsg = html[0].outerHTML;
                    uihandler.blockview(waitmsg);
                },

                unblockwait: function () {
                    uihandler.unblockwiew();
                },

                call: function (type) {
                    try {
                        var call_type;
                        if (type == 'video') {
                            call_type = defs.CALLTYPE_VIDEO;
                        }
                        else if (type == 'audio') {
                            call_type = defs.CALLTYPE_AUDIO;
                        }

                        viewModel.waitscreen("Calling");

                        peercomm.ping(this.contact, true, 10000)
                            .then(
                            function () {
                                return peercomm.get_contact_session(viewModel.contact);
                            },
                            function (err) {
                                throw new Error(err);
                            }
                            )
                            .then(
                            function () {
                                return peercomm.call(viewModel.contact, call_type, true);
                            },
                            function (err) {
                                throw new Error(err);
                            }
                            )
                            .then(
                            function (isaccepted) {
                                viewModel.unblockwait();
                                console.log("Call accepted: " + isaccepted);
                                if (isaccepted == true) {
                                    var uioptions = {
                                        contact: viewModel.contact,
                                        calltype: call_type,
                                        iscaller: true
                                    };
                                    if (type == 'video') {
                                        appevents.dispatch("display-view", "video-call", uioptions);
                                    }
                                }
                                else if (isaccepted == false) {
                                    setTimeout(function () {
                                        streembit.notify.info("Contact " + viewModel.contact.name + " declined the call");
                                    }, 500);
                                }
                                else {
                                    setTimeout(function () {
                                        streembit.notify.error("Unable to establish call with contact " + viewModel.contact.name);
                                    }, 500);
                                }
                            },
                            function (err) {
                                viewModel.unblockwait();
                                streembit.notify.error("Error in starting video call: %j", err);
                            }
                            );
                    }
                    catch (merr) {
                        streembit.notify.error("Error in starting video call: %j", merr);
                    }
                },

                on_sharescreen_error: function (err) {
                    events.emit(events.TYPES.ONAPPNAVIGATE, defs.CMD_USERSTART);
                    streembit.notify.error_popup("Error in starting share screen. %j", err);
                },

                on_sharescreen_reply: function (isaccepted) {
                    if (isaccepted == true) {
                        streembit.logger.info("Share screen request was accepted by " + viewModel.contact.name);
                        var uioptions = {
                            contact: viewModel.contact,
                            iscaller: true
                        };
                        events.emit(events.TYPES.ONAPPNAVIGATE, defs.CMD_SENDER_SHARESCREEN, null, uioptions);
                    }
                    else if (isaccepted == false) {
                        events.emit(events.TYPES.ONAPPNAVIGATE, defs.CMD_USERSTART);
                        setTimeout(function () {
                            streembit.notify.info_panel("Contact " + viewModel.contact.name + " declined the share screen request");
                        }, 500);
                    }
                    else {
                        events.emit(events.TYPES.ONAPPNAVIGATE, defs.CMD_USERSTART);
                        setTimeout(function () {
                            streembit.notify.error("Unable to establish share screen with contact " + viewModel.contact.name);
                        }, 500);
                    }
                },

                sharescreen: function () {
                    peercomm.ping(this.contact, true, 10000)
                        .then(
                        function () {
                            return peercomm.get_contact_session(viewModel.contact);
                        },
                        function (err) {
                            throw new Error(err);
                        }
                        )
                        .then(
                        function () {
                            peercomm.offer_sharescreen(viewModel.contact, viewModel.on_sharescreen_reply, viewModel.on_sharescreen_error);
                        },
                        function (err) {
                            events.emit(events.TYPES.ONAPPNAVIGATE, defs.CMD_USERSTART);
                            streembit.notify.error_popup("Error in starting share screen. %j", err);
                        }
                        );
                },

                chat: function () {
                    // block the UI
                    viewModel.waitscreen("Creating session with");

                    peercomm.ping(this.contact, true, 6000)
                        .then(
                            function () {
                                return peercomm.get_contact_session(viewModel.contact);
                            },
                            function (err) {
                                throw new Error(err);
                            }
                        )
                        .then(
                            function (session) {
                                // unblock the UI
                                viewModel.unblockwait();

                                var options = {
                                    contact: viewModel.contact,
                                    issession: session ? true : false
                                };
                                appevents.dispatch("display-view", "contact-chat", options);
                            },
                            function (err) {
                                // unblock the UI
                                viewModel.unblockwait();

                                streembit.notify.error("Error in creating peer session: %j", err, true);

                                var text = "It seems the contact is off-line. You can send an off-line message to the contact. The network will store the message and deliver it once the contact is on-line.";
                                bootbox.confirm(text, function (result) {
                                    if (result) {
                                        var options = {
                                            contact: viewModel.contact,
                                            issession: false
                                        };
                                        //events.emit(events.TYPES.ONAPPNAVIGATE, defs.CMD_CONTACT_CHAT, null, options);
                                        appevents.dispatch("display-view", "contact-chat", options);
                                    }
                                });
                            });
                },

                sendfile: function () {
                    peercomm.ping(this.contact, true, 5000)
                        .then(
                            function () {
                                return peercomm.get_contact_session(viewModel.contact);
                            },
                            function (err) {
                                throw new Error(err);
                            }
                        )
                        .then(
                            function (session) {
                                streembit.UI.showSendFile(viewModel.contact);
                            },
                            function (err) {
                                streembit.notify.error("Error in starting file transfer: %j", err);
                            }
                        );
                },

                remove: function () {
                    appevents.dispatch("on-remove-contact", this.name());
                    appevents.dispatch("display-view", "emptyview");                    
                }
            };

            return viewModel;
        }

        return {
            viewModel: ContactVM,
            template: template
        };
    });
}());
