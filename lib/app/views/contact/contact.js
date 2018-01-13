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
            'appevents', 'peercomm', 'appsrvc', 'definitions', "connections", "screenshare", "uuid", "webrtcscreen",
            'makeusabrew/bootbox', 'uihandler', 'filesender', 'utilities', './contact.html!text'
        ],
        function (
            appevents, peercomm, appsrvc, defs, connections, screenshare, uuid, webrtcscreen,
            bootbox, uihandler, filesender, utilities, template) {

        function ContactVM(params) {

            var viewModel = {
                name: ko.observable(params.name),
                address: ko.observable(params.address),
                port: ko.observable(params.port),
                public_key: ko.observable(params.public_key),
                type: ko.observable(params.type),
                protocol: ko.observable(params.protocol),
                connection_info: ko.computed(function () {
                    var noconndata = !params.protocol || !params.address || !params.port;
                    if (noconndata) {
                        return "NO CONNECTION DATA!"
                    }
                    else {
                        return params.protocol + "://" + params.address + ":" + params.port;
                    }
                }),
                connection_error: ko.observable((!params.protocol || !params.address || !params.port) ? true : false),
                contact: params,
                timer: null,
                make_connection_inprogress: false,

                dispose: function () {
                    if (viewModel.timer) {
                        try {
                            clearTimeout(viewModel.timer);
                        }
                        catch (err) { }
                    }
                },

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

                ping: function () {
                    var pinged = false, reported = false;
                    uihandler.blockwin();
                    peercomm.ping(this.contact, true, 10000).then(
                        function () {
                            pinged = true;
                            uihandler.unblockwin();
                            streembit.notify.info("Ping to " + viewModel.name() + " was completed. The contact is online", null, true);
                        },
                        function (err) {
                            reported = true;
                            uihandler.unblockwin();
                            viewModel.make_connection_inprogress = false;
                            streembit.notify.error("Error in pinging to contact: %j", err);
                        }
                    );

                    taskTimer = setTimeout(function () {
                        uihandler.unblockwin();
                        if (!pinged && !reported) {
                            //viewModel.unblockwait();
                            streembit.notify.error("Error in pinging contact", null, true);
                        }                        
                    },
                    15000);
                },

                call: function (type) {
                    try {
                        if (viewModel.make_connection_inprogress == true) {
                            return streembit.notify.info("Please wait ... making a connection is in progress.", null, true);
                        }

                        viewModel.make_connection_inprogress = true;

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
                                viewModel.make_connection_inprogress = false;

                                console.log("Call accepted: " + isaccepted);
                                if (isaccepted == true) {
                                    var uioptions = {
                                        contact: viewModel.contact,
                                        calltype: call_type,
                                        iscaller: true
                                    };
                                    var viewname = (type == 'video') ? "video-call" : "audio-call";
                                    appevents.dispatch("display-view", viewname, uioptions);
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
                                viewModel.make_connection_inprogress = false;
                                streembit.notify.error("Error in starting video call: %j", err);
                            }
                        );
                    }
                    catch (merr) {
                        streembit.notify.error("Error in starting video call: %j", merr);
                        viewModel.make_connection_inprogress = false;
                    }
                },

                sharescreen: function () {
                    var taskTimer, taskid;
                    try {
                        if (!streembit.globals.nwmode) {
                            return alert("Screen sharing is available only in the desktop version of Streembit. Download the free and open source Streembit desktop to use its screen sharing functionality.");
                        }

                        if (viewModel.make_connection_inprogress == true) {
                            return streembit.notify.info("Please wait ... making a connection is in progress.", null, true);
                        }

                        var created = false, reported = false;                        

                        viewModel.make_connection_inprogress = true;

                        taskid = uuid.v1();
                        var screentask = new screenshare();
                        screentask.run(this.contact, taskid).then(
                            function () {
                                created = true;
                                clearTimeout(taskTimer);
                                // it seems the screen share offer was accepted, initiate webrtc from the screen share viewmodel
                                webrtcscreen.share(
                                    viewModel.contact,
                                    taskid,
                                    function () {
                                        // onconnect
                                        var param = {
                                            contact: viewModel.contact
                                        };
                                        appevents.dispatch("display-view", "screenshare", param);
                                        appevents.dispatch("on-task-event", "close", "send", taskid);
                                    },
                                    function (err) {
                                        //oneerror
                                        streembit.notify.error("Error in sharing the screen: %j", err);                                        
                                        appevents.dispatch("on-task-event", "close", "send", taskid);
                                        viewModel.make_connection_inprogress = false;
                                    }
                                );
                            },
                            function (err) {
                                clearTimeout(taskTimer);
                                streembit.notify.error("Error in sharing the screen: %j", err);
                                appevents.dispatch("on-task-event", "close", "send", taskid);
                                reported = true;
                                viewModel.make_connection_inprogress = false;
                            }
                        );

                        taskTimer = setTimeout(function () {
                            if (!created && !reported) {
                                streembit.notify.error("Error in sharing screen, no reply from the contact", null, true);
                                appevents.dispatch("on-task-event", "close", "send", taskid);
                                viewModel.make_connection_inprogress = false;
                            }
                        },
                        35000);

                    }
                    catch (err) {
                        appevents.dispatch("on-task-event", "close", "send", taskid);
                        clearTimeout(taskTimer);
                        streembit.notify.error("Screen share error: %j", err);
                    }
                },

                chat: function () {
                    var taskTimer, taskid;
                    try {
                        if (viewModel.make_connection_inprogress == true) {
                            return streembit.notify.info("Please wait ... making a connection is in progress.", null, true);
                        }

                        // block the UI
                        //viewModel.waitscreen("Creating session with");

                        var created = false, reported = false;
  
                        viewModel.make_connection_inprogress = true;

                        taskid = uuid.v1();
                        connections.create(viewModel.contact, true, taskid, function (err, webrtcconn) {
                            //viewModel.unblockwait();
                            viewModel.make_connection_inprogress = false;
                            appevents.dispatch("on-task-event", "close", "send", taskid);
                            clearTimeout(taskTimer);

                            if (err) {
                                reported = true;
                                
                                return streembit.notify.error("Error in starting chat: %j", err, true);
                            }

                            var options = {
                                contact: viewModel.contact,
                                issession: true,
                                webrtcconn: webrtcconn,
                                sender: true
                            };
                            appevents.dispatch("display-view", "contact-chat", options);
                            created = true;
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

                sendfile: function () {
                    try {
                        if (viewModel.make_connection_inprogress == true) {
                            return streembit.notify.info("Please wait ... making a connection is in progress.", null, true);
                        }

                        var filetask = new filesender();
                        filetask.run(this.contact);
                    }
                    catch (err) {
                        streembit.notify.error("Send file error: %j", err);
                    }
                },

                remove: function () {
                    appevents.dispatch("oncontactevent", "on-remove-contact", this.name());                                     
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
