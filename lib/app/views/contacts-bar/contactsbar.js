
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

'use strict';

(function () {

    define(
        ['appsrvc', 'contactlist', 'connections', 'uuid', 'peercomm', 'appevents', 'apputils', 'secure-random', 'settings', 'definitions', 'peermsg', 'errhandler', 'errcodes', 'contactsutil', 'uihandler', 'utilities', 'database', './contactsbar.html!text'],
        function (appsrvc, contactlist, connections, uuid, peercomm, appevents, apputils, secrand, settings, defs, peermsg, errhandler, errcodes, contactsutil, uihandler, utilities, database, template) {

            function RecentListItemViewModel (contact, templatename, dataobj) {
                var viewModel = {
                    contact: contact,
                    template_name: ko.observable(templatename),
                    datactx: dataobj
                };

                return viewModel;
            }

            function ContactsListVm() {

                function merge(contact, param) {
                    for (var prop in param) {
                        if (!contact[prop]) {
                            contact[prop] = param[prop];
                        }
                    }
                    return contact;
                }

                function Contact(user_type) {
                    this.isonline = ko.observable(false);
                    this.isoffline = ko.observable(false);
                    this.isnotviewing = ko.observable(false);
                    this.lastping = ko.observable(0);
                    this.actionicon = ko.observable("");
                    this.actiontype = "";
                    this.usertypeicon = "";
                    this.warnicon = ko.observable("");
                    this.warning = ko.observable("");
                    this.files = ko.observableArray([]);
                    if (user_type == "human") {
                        this.usertypeicon = "glyphicon glyphicon-user";
                    }
                    else if (user_type == "device") {
                        this.usertypeicon = "glyphicon glyphicon-cog";
                    }
                    this.error = ko.observable("");
                };

                var viewModel = {
                    contacts: ko.observableArray([]),
                    contact_lookup: ko.observable(),
                    issearch: ko.observable(false),
                    active_tab: ko.observable("contacts"),
                    is_recent_msg: ko.observable(false),
                    recent_messages: ko.observableArray([]),
                    show_addcontact_panel: ko.observable(false),
                    addcontact_name: ko.observable(""),
                    addcontact_obj: 0,
                    selected_contact_name: "",
                    scrollContacts: ko.observable(),
                    make_connection_inprogress: false,
                    errorCallAndHangup: ko.observable(false),
                    forCont: ko.observable(0),

                    dispose: function () {
                        console.log("ContactsListVm dispose");
                        appevents.removeSignal("oncontactevent", this.onContactEvent);
                    },

                    init: function () {
                        viewModel.contacts([]);
                        var list = contactlist.contacts;
                        

                        if(list && list.length > 0) {
                            for(var i = 0; i<list.length; i++) {
                                var exists = false;
                                for (var j = 0; j < viewModel.contacts().length; j++) {
                                    if (list[i].name == viewModel.contacts()[j].name) {
                                        exists = true;
                                        break;
                                    }
                                }
                                if (exists) {
                                    continue;
                                }

                                var contact = new Contact(list[i].user_type);
                                if (!list[i].avatar) {
                                    list[i].avatar = null;
                                }
                                var contobj = merge(contact, list[i]);

                                viewModel.contacts.push(contobj);

                                var account = contact.name;
                                viewModel.recent_messages.remove(function (item) {
                                    return item.contact && item.contact.name == account;
                                })
                            }

                            if(viewModel.forCont() == 0 && !list.length == 0 && $(window).width() > 425) {
                                viewModel.forCont(1);
                                $('.top-panelopen-contactsbar').trigger('click'); 
                                $('.top-panelopen-contactsbar').addClass('changeColorIcon');  
                            }
                            
                        }

                    },

                    onContactEvent: function (event, payload, param, data) {
                        switch (event) {
                            case "contacts-init":
                                viewModel.init();
                                break;
                            case "add-contact":
                                viewModel.add_contact(payload, param, data);
                                break;
                            case "update-contact":
                                viewModel.update_contact(payload, param, data);
                                break;
                            case "contact-last-ping":
                                viewModel.onLastPing(payload, param, data);
                                break;
                            case "contact-online":
                                viewModel.onContactOnline(payload, param, data);
                                break;
                            case "contact-offline":
                                viewModel.onContactOffline(payload, param, data);
                                break;
                            case "on-text-message":
                                viewModel.onTextMessage(payload, param, data);
                                break;
                            case "on-chat-history":
                                viewModel.onChatHistory(payload, param, data);
                                break;
                            case "on-remove-contact":
                                viewModel.remove_byname(payload, param, data);
                                break;
                            case "on-selected-contact-change":
                                viewModel.onSelectedContactChange(payload, param, data);
                                break;
                            case "on-contact-warning":
                                viewModel.onContactWarning(payload, param, data);
                                break;
                            case "on-contact-error":
                                viewModel.onContactError(payload, param, data);
                                break;
                            default:
                                break;
                        }
                    },

                    onSelectedContactChange: function (contactname) {
                        if (contactname) {
                            viewModel.selected_contact_name = contactname;
                        }
                    },

                    onContactWarning: function (account, warn) {
                        try {
                            var contacts = viewModel.contacts();
                            for (var i = 0; i < contacts.length; i++) {
                                if (contacts[i].name == account) {
                                    contacts[i].warnicon("glyphicon glyphicon glyphicon-alert");
                                    contacts[i].warning(warn);
                                    contacts[i].isonline(false);
                                    contacts[i].isoffline(true);
                                    break;
                                }
                            }
                        }
                        catch (err) {
                            streembit.notify.error(errhandler.getmsg(errcodes.UI_CONTACT_ONCONTACTWARNING, err, true));
                        }
                    },

                    rmWarning: function (item) {
                        item.warnicon('');
                    },

                    onContactError: function (account, error) {
                        try {
                            var contacts = viewModel.contacts();
                            for (var i = 0; i < contacts.length; i++) {
                                if (contacts[i].name == account) {
                                    contacts[i].error(error);
                                    contacts[i].actionicon("glyphicon glyphicon-exclamation-sign");
                                    contacts[i].actiontype = "errormsg";
                                    contacts[i].isonline(false);
                                    contacts[i].isoffline(true);
                                    break;
                                }
                            }
                        }
                        catch (err) {
                            streembit.notify.error(errhandler.getmsg(errcodes.UI_CONTACT_ONCONTACTERROR, err, true));
                        }
                    },

                    onLastPing: function (account) {
                        try {
                            var contacts = viewModel.contacts();
                            for (var i = 0; i < contacts.length; i++) {
                                if (contacts[i].name == account) {
                                    contacts[i].lastping(Date.now());
                                    break;
                                }
                            }
                        }
                        catch (err) {
                            streembit.notify.error(errhandler.getmsg(errcodes.UI_CONTACT_ONLASTPING, err, true));
                        }
                    },

                    onContactOnline: function (account, isonline) {
                        try {
                            var contacts = viewModel.contacts();
                            for (var i = 0; i < contacts.length; i++) {
                                if (contacts[i].name === account) {
                                    contacts[i].isonline(isonline);
                                    if (isonline) {
                                        contacts[i].warnicon('');
                                        contacts[i].warning('');
                                        contacts[i].actionicon('');
                                        contacts[i].isoffline(false);
                                    }

                                    break;
                                }
                            }
                        }
                        catch (err) {
                            streembit.notify.error(errhandler.getmsg(errcodes.UI_CONTACT_ONCONTACTONLINE, err, true));
                        }
                    },
                    
                    onContactOffline: function(account, isoffline){
                        try{
                            var contacts = viewModel.contacts();
                            for(var i = 0; i < contacts.length; i++){
                                if (contacts[i].name === account) {
                                    contacts[i].isoffline(true);
                                    if (isoffline) {
                                        contacts[i].warnicon('');
                                        contacts[i].warning('');
                                        contacts[i].actionicon('');
                                        contacts[i].isonline(false);
                                    }

                                    break;
                                }
                            }
                        }
                        catch (err) {
                            streembit.notify.error(errhandler.getmsg(errcodes.UI_CONTACT_ONCONTACTOFFLINE, err, true));
                        }
                    },

                    dosearch: function () {
                        viewModel.addcontact_name("");
                        viewModel.addcontact_obj = 0;
                        viewModel.show_addcontact_panel(false);
                        viewModel.issearch(!viewModel.issearch());
                    },

                    onTextMessage: function (sender, data) {
                        try {
                            if (sender == viewModel.selected_contact_name &&
                                (
                                    appsrvc.currentview == "contact-chat" ||
                                    appsrvc.currentview == "audio-call" ||
                                    appsrvc.currentview == "video-call"
                                ))
                            {
                                return;
                            }

                            var contacts = viewModel.contacts();
                            for (var i = 0; i < contacts.length; i++) {

                                if (contacts[i].name == sender.sender) {
                                    contacts[i].actionicon("fa fa-envelope");
                                    contacts[i].actiontype = "textmsg";
                                    break;
                                }
                            }
                        }
                        catch (err) {
                            streembit.notify.error(errhandler.getmsg(errcodes.UI_CONTACT_ONTEXTMESSAGE, err, true));
                        }
                    },

                    onChatHistory: function (payload) {
                        try {
                            if (payload.text.chat === 'rm') {
                                database.del(database.CHATHISTORY, `${appsrvc.pubkeyhash}/${payload.text.pkeyhash}`).then(
                                    () => streembit.notify.success('Request of chat history deletion has been processed'),
                                    err => streembit.notify.error(errhandler.getmsg(errcodes.UI_PROCESSING_DELETION_CHATHISTORY, +err))
                                    
                                );
                                return;
                            }

                            const data = {
                                key: `${appsrvc.pubkeyhash}/${payload.text.pkeyhash}`,
                                chat: peermsg.aes256encrypt(appsrvc.privateKeyHex, JSON.stringify(payload.text.chat))
                            };
                            database.update(database.CHATHISTORY, data).then(
                                () => streembit.notify.success('Chat history sync received'),
                                err => streembit.notify.error(errhandler.getmsg(errcodes.UI_SYNCING_CHAT, +err))
                                
                            );
                        } catch (err) {
                            streembit.notify.error(errhandler.getmsg(errcodes.UI_SYNCING_CHAT, +err))
                        }
                    },

                    onFileReceive: function (sender, blob, filename, filesize) {
                        try {
                            var contacts = viewModel.contacts();
                            for (var i = 0; i < contacts.length; i++) {
                                if (contacts[i].name == sender) {
                                    contacts[i].actionicon("glyphicon glyphicon-file");
                                    contacts[i].actiontype = "filercv";
                                    var fileobj = {
                                        blob: blob,
                                        name: filename,
                                        size: filesize
                                    };
                                    contacts[i].files.push(fileobj);
                                    break;
                                }
                            }
                        }
                        catch (err) {
                            streembit.notify.error(errhandler.getmsg(errcodes.UI_CONTACT_ONFILERECEIVE, err, true));
                        }
                    },

                    itemAction: function (item) {
                        try {
                            if (item.actiontype == "textmsg") {
                                var options = {
                                    contact: item,
                                    issession: true
                                };
                                appevents.navigate("contact-chat", options);
                                item.actiontype = "";
                                item.actionicon("");
                                viewModel.selected_contact_name = item.name;
                            }
                            else if (item.actiontype == "filercv") {
                                appevents.dispatch("display-view", "contact-filercv", item);
                                item.actiontype = "";
                                item.actionicon("");
                            }
                            else if (item.actiontype == "errormsg") {
                                item.actiontype = "";
                                item.actionicon("");
                                streembit.notify.error(errhandler.getmsg(errcodes.UI_CONTACT_ERROR, item.error()));       
                                item.error("")
                            }
                            if($(window).width() < 425) {
                                $('.contacts-container').css({'width': '0', 'transition': '0.5s'});
                                $('.contacts-container').removeClass('activate');
                                $('.for-main-content').css({'margin-right': '0', 'transition': '0.5s'});
                            }
                        }
                        catch (err) {
                            // streembit.notify.error("contact itemAction error %j", err, true);
                            streembit.notify.error(errhandler.getmsg(errcodes.UI_CONTACT_ITEMACTION, err, true));
                        }
                    },

                    itemSelect: function (item) {
                        //appevents.dispatch("on-contact-selected", item);
                        viewModel.selected_contact_name = item.name;
                        appevents.dispatch("on-appui-event", "hide-contacts-bar", item);
                        $('.for-main-content').css({'margin-right': '0'});
                    },

                    quickChatFromContCall: function (item) {
                        var taskTimer, taskid;
                        try {
                           
                            var created = false, reported = false;
      
                            viewModel.make_connection_inprogress = true;

                            taskid = uuid.v1();
                            connections.create(item, true, taskid, function (err, webrtcconn) {
                                //viewModel.unblockwait();
                                viewModel.make_connection_inprogress = false;
                                appevents.dispatch("on-task-event", "close", "send", taskid);
                                clearTimeout(taskTimer);

                                if (err) {
                                    reported = true;
                                    // return streembit.notify.error("Error in starting chat: %j", err, true);
                                    return streembit.notify.error(errhandler.getmsg(errcodes.UI_STARTING_CHAT, err, true));
                                }

                                var options = {
                                    contact: item,
                                    issession: true,
                                    webrtcconn: webrtcconn,
                                    sender: true
                                };

                                appevents.navigate("contact-chat", options);
                                created = true;

                            });

                            taskTimer = setTimeout(function () {
                                if (!created && !reported) {
                                    // streembit.notify.error("Error in starting chat: no reply from the contact", null, true);
                                    streembit.notify.error(errhandler.getmsg(errcodes.UI_CHAT_REPLY_FROM_CONTACT, null, true));
                                    viewModel.make_connection_inprogress = false;
                                    appevents.dispatch("on-task-event", "close", "send", taskid);
                                }
                            },
                            15000);
                        }
                        catch (err) {
                            viewModel.make_connection_inprogress = false;
                            appevents.dispatch("on-task-event", "close", "send", taskid);
                            clearTimeout(taskTimer);
                            // streembit.notify.error("Start chat error: %j", err);
                            streembit.notify.error(errhandler.getmsg(errcodes.UI_START_CHAT_ERROR, err));
                        }
                    },

                    waitscreen: function (msg) {
                        debugger;
                        var template = $("#callprogress-template")[0].innerHTML;
                        var html = $(template);
                        html.find("#wait-msg-tag-quick").text(msg + " " + 'Lusine');
                        var waitmsg = html[0].outerHTML;
                        uihandler.blockview(waitmsg);
                    },

                    hangup: function (item) {
                        $('#hangupCallFromContactPanel').on('click', function () {
                            debugger;
                            viewModel.errorCallAndHangup(true);
                            return peercomm.hangup_call(item, null, {msg : 'hangup'});
                        })
                    },

                    quickCallFromContCall: function (item) {
                        try {
                            if (viewModel.make_connection_inprogress == true) {
                                return streembit.notify.info("Please wait ... making a connection is in progress.", null, true);
                            }

                            viewModel.make_connection_inprogress = true;

                            var call_type;
                            call_type = defs.CALLTYPE_AUDIO;

                            viewModel.waitscreen("Calling");
                            viewModel.hangup();

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
                                    return peercomm.call(item, call_type, true);
                                },
                                function (err) {
                                    throw new Error(err);
                                }
                                )
                                .then(
                                function (isaccepted) {

                                    uihandler.unblockwiew();
                                    viewModel.make_connection_inprogress = false;

                                    console.log("Call accepted: " + isaccepted);
                                    if (isaccepted == true) {
                                        var uioptions = {
                                            contact: item,
                                            calltype: call_type,
                                            iscaller: true
                                        };
                                        var viewname = "audio-call";
                                        appevents.navigate(viewname, uioptions);
                                    }else if (isaccepted == false) {
                                        appevents.navigate('dashboard');
                                        if(viewModel.errorCallAndHangup() == true) {
                                            logger.debug('you hangup the call');
                                        }else{
                                            setTimeout(function () {
                                                streembit.notify.info("Contact " + item.name + " declined the call");
                                            }, 500);
                                        }
                                    }
                                    else {
                                        setTimeout(function () {
                                            // streembit.notify.error("Unable to establish call with contact " + viewModel.contact.name);
                                            streembit.notify.error(errhandler.getmsg(errcodes.UI_ESTABLISH_CALL_WITHCONTACT, + viewModel.contact.name));
                                        }, 500);
                                    }
                                },
                                function (err) {
                                    viewModel.unblockwait();
                                    viewModel.make_connection_inprogress = false;
                                    // streembit.notify.error("Error in starting video call: %j", err);
                                    streembit.notify.error(errhandler.getmsg(errcodes.UI_STARTING_VIDEO_CALL, err));
                                }
                            );
                        }
                        catch (merr) {
                            // streembit.notify.error("Error in starting video call: %j", merr);
                            streembit.notify.error(errhandler.getmsg(errcodes.UI_STARTING_VIDEO_CALL, merr));
                            viewModel.make_connection_inprogress = false;
                        }
                    },

                    remove: function (item) {
                        var result = confirm("Contact '" + item.name + "' will be removed from the contacts list.");
                        if (result) {
                            contactlist.remove(item.name, function () {
                                viewModel.contacts.remove(item);
                                appevents.dispatch("display-view", "emptyview");
                                appevents.navigate("dashboard");
                                streembit.notify.success("Contact'" + item.name + "' removed from the contacts list.");
                            });
                        }
                    },

                    remove_byname: function (account, callback) {
                        var item = null;
                        for (var i = 0; i < viewModel.contacts().length; i++) {
                            if (viewModel.contacts()[i].name == account) {
                                item = viewModel.contacts()[i];
                                break;
                            }
                        }
                        if (!item)
                            return;

                        var result = confirm("Contact '" + item.name + "' will be removed from the contacts list.");
                        if (result) {
                            // delete from the local db
                            contactlist.remove(item.name, function () {
                                viewModel.contacts.remove(item);
                                appevents.dispatch("display-view", "emptyview");
                                appevents.navigate("dashboard");
                                streembit.notify.success("Contact'" + item.name + "' removed from the contacts list.");
                            });
                        }
                    },

                    delete_byname: function (account, callback) {
                        var item = null;
                        for (var i = 0; i < viewModel.contacts().length; i++) {
                            if (viewModel.contacts()[i].name == account) {
                                item = viewModel.contacts()[i];
                                break;
                            }
                        }
                        if (!item)
                            return;

                        viewModel.contacts.remove(item);
                    },

                    add_contact: function (result) {
                        if (result) {
                            var exists = false;
                            for (var j = 0; j < viewModel.contacts().length; j++) {
                                if (result.name == viewModel.contacts()[j].name) {
                                    exists = true;
                                    break;
                                }
                            }
                            if (exists) {
                                return;
                            }

                            var contact = new Contact(result.user_type);
                            var contobj = merge(contact, result);

                            viewModel.contacts.push(contobj);

                            // remove it from the recent messages list
                            var account = contact.name;
                            viewModel.recent_messages.remove(function (item) {
                                return item.contact && item.contact.name == account;
                            })
                        }
                    },

                    update_contact: function (account, obj) {
                        var item = null;

                        for (var i = 0; i < viewModel.contacts().length; i++) {
                            if (viewModel.contacts()[i].name == account) {
                                item = viewModel.contacts()[i];
                                break;
                            }
                        }

                        if (!item) return;

                        for (var prop in obj) {
                            item[prop] = obj[prop];
                        }
                    },
                    addContactFromContBar: function () {
                        appevents.navigate('accept-contact-request');
                    },

                    search: function () {
                        // TODO either remove as obsolete or review
                    },

                    onSendAddContactRequest: function () {
                        //appevents.dispatch("on-send-addcontact-request", viewModel.addcontact_obj);
                        var reset = function () {
                            viewModel.addcontact_name("");
                            viewModel.addcontact_obj = 0;
                            viewModel.show_addcontact_panel(false);
                        };

                        var unblocked = false;

                        try {

                            if (this.addcontact_obj.account == appsrvc.username) {
                                return streembit.notify.error(errhandler.getmsg(errcodes.UI_ADDYOURSELFCONTACT));
                            }

                            // block the UI
                            uihandler.blockwin();

                            // create a contact object
                            var contact = {
                                public_key: this.addcontact_obj.public_key, // BS58 public key
                                publickeyhex: utilities.bs58toHex(this.addcontact_obj.public_key),
                                address: this.addcontact_obj.address,
                                port: this.addcontact_obj.port,
                                name: this.addcontact_obj.account,
                                user_type: this.addcontact_obj.user_type || "human",
                                protocol: this.addcontact_obj.protocol,
                                connkey: ""
                            };

                            //  send the encrypted contact request reply with the connection key and
                            //  the connection details of this user
                            contactsutil.add_contact(contact, function (err) {
                                // unblock the UI
                                uihandler.unblockwin();
                                unblocked = true;

                                if (err) {
                                    return streembit.notify.error(errhandler.getmsg(errcodes.UI_ADDCONTACT, err));
                                }

                                reset();
                            });
                        }
                        catch (err) {
                            // unblock the UI
                            uihandler.unblockwin();
                            unblocked = true;
                            streembit.notify.error(errhandler.getmsg(errcodes.UI_ADDCONTACT, err));
                        }

                        setTimeout(function () {
                            if (!unblocked) {
                                unblocked = true;
                                uihandler.unblockwin();
                                reset();
                            }
                        }, 10000);

                    },

                    onShowContacts: function () {
                        viewModel.active_tab("contacts");
                    },

                    onShowRecents: function () {
                        viewModel.active_tab("recent");
                        viewModel.is_recent_msg(false);
                    }


                };

                // add event listeners
                appevents.addListener("oncontactevent", viewModel.onContactEvent);
                $('.top-panelopen-contactsbar').removeClass('changeColorIcon'); 
                // initialize the view model
                //viewModel.init();

                return viewModel;
            };

            return {
                viewModel: ContactsListVm,
                template: template
            };
        });

} ());
