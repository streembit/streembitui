
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

'use strict';

(function () {

    define(
        ['knockout', 'appsrvc', 'contactlist', 'peercomm', 'appevents', 'apputils', './contactsbar.html!text'],
        function (ko, appsrvc, contactlist, peercomm, appevents, apputils, template) {

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
                this.lastping = ko.observable(0);
                this.actionicon = ko.observable("");
                this.actiontype = "";
                this.usertypeicon = "";
                this.files = ko.observableArray([]);
                if (user_type == "human") {
                    this.usertypeicon = "glyphicon glyphicon-user";
                }
                else if (user_type == "device") {
                    this.usertypeicon = "glyphicon glyphicon-cog";
                }
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

                dispose: function () {
                    console.log("ContactsListVm dispose");
                    appevents.removeSignal("on-receive-add", this.onReceiveAddContact);
                    appevents.removeSignal("add-contact", this.add_contact);
                    appevents.removeSignal("update-contact", this.update_contact);
                    appevents.removeSignal("contact-last-ping", this.onLastPing);
                    appevents.removeSignal("contact-online", this.onContactOnline);
                    appevents.removeSignal("on-text-message", this.onTextMessage);
                },

                init: function () {
                    // add event listners
                    appevents.addListener("on-receive-add", this.onReceiveAddContact);
                    appevents.addListener("add-contact", this.add_contact);
                    appevents.addListener("update-contact", this.update_contact);
                    appevents.addListener("contact-last-ping", this.onLastPing);
                    appevents.addListener("contact-online", this.onContactOnline);
                    appevents.addListener("on-text-message", this.onTextMessage);

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
                            var contobj = merge(contact, list[i]);
                            viewModel.contacts.push(contobj);

                            var account = contact.name;
                            viewModel.recent_messages.remove(function (item) {
                                return item.contact && item.contact.name == account;
                            })
                        }
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
                        streembit.notify.error("contact onLastPing error %j", err, true);
                    }
                },

                onContactOnline: function (account, isonline) {
                    try {
                        var contacts = viewModel.contacts();
                        for (var i = 0; i < contacts.length; i++) {
                            if (contacts[i].name == account) {
                                contacts[i].isonline(isonline);
                                break;
                            }
                        }
                    }
                    catch (err) {
                        streembit.notify.error("contact onContactOnline error %j", err, true);
                    }
                },

                dosearch: function () {
                    viewModel.addcontact_name("");
                    viewModel.addcontact_obj = 0;
                    viewModel.show_addcontact_panel(false);
                    viewModel.issearch(!viewModel.issearch());
                },

                onTextMessage: function (data) {
                    try {
                        var contacts = viewModel.contacts();
                        for (var i = 0; i < contacts.length; i++) {
                            if (contacts[i].name == data.sender) {
                                contacts[i].actionicon("glyphicon glyphicon-envelope");
                                contacts[i].actiontype = "textmsg";
                                break;
                            }
                        }
                    }
                    catch (err) {
                        streembit.notify.error("contact onTextMessage error %j", err, true);
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
                        streembit.notify.error("contact onFileReceive error %j", err, true);
                    }
                },

                itemAction: function (item) {
                    try {
                        if (item.actiontype == "textmsg") {
                            var options = {
                                contact: item,
                                issession: true
                            };
                            appevents.dispatch("display-view", "contact-chat", options);
                            item.actiontype = "";
                            item.actionicon("");
                        }
                        else if (item.actiontype == "filercv") {
                            appevents.dispatch("display-view", "contact-filercv", item);
                            item.actiontype = "";
                            item.actionicon("");
                        }
                    }
                    catch (err) {
                        streembit.notify.error("contact itemAction error %j", err, true);
                    }
                },

                itemSelect: function (item) {
                    appevents.dispatch("on-contact-selected", item);
                },

                remove: function (item) {
                    bootbox.confirm("Contact '" + item.name + "' will be removed from the contacts list.", function (result) {
                        if (result) {
                            contactlist.remove(item.name, function () {
                                viewModel.contacts.remove(item);
                                events.emit(events.TYPES.ONAPPNAVIGATE, streembit.DEFS.CMD_EMPTY_SCREEN);
                            });
                        }
                    });
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

                    bootbox.confirm("Contact '" + item.name + "' will be removed from the contacts list.", function (result) {
                        if (result) {
                            // delete from the local db
                            contactlist.remove(item.name, function () {
                                viewModel.contacts.remove(item);
                                events.emit(events.TYPES.ONAPPNAVIGATE, streembit.DEFS.CMD_EMPTY_SCREEN);
                            });
                        }
                    });
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

                search: function () {
                    try {
                        viewModel.addcontact_name("");
                        viewModel.addcontact_obj = 0;
                        viewModel.show_addcontact_panel(false);

                        var self = this;
                        var account = $.trim(this.contact_lookup());
                        if (!account) {
                            return streembit.notify.error("Enter the human or device account name");
                        }

                        if (contactlist.exists(account)) {
                            return streembit.notify.info("This contact is already exists in the contact list");;
                        }

                        peercomm.get_published_contact(account, function (err, contact) {
                            if (err) {
                                return streembit.notify.error('The search for contact "' + account + '" returned no result');
                            }

                            if (contact) {
                                self.contact_lookup("");
                                self.addcontact_name(contact.name);
                                self.addcontact_obj = contact;
                                self.show_addcontact_panel(true);
                            }
                        });             
                    }
                    catch (err) {
                        streembit.notify.error("contact search error %j", err, true)
                    }
                },

                onSendAddContactRequest: function () {
                    appevents.dispatch("on-send-addcontact-request", viewModel.addcontact_obj);
                    viewModel.addcontact_name("");
                    viewModel.addcontact_obj = 0;
                    viewModel.show_addcontact_panel(false);
                },

                onShowContacts: function () {
                    viewModel.active_tab("contacts");
                },

                onShowRecents: function () {
                    viewModel.active_tab("recent");
                    viewModel.is_recent_msg(false);
                },

                acceptAddContact: function (obj) {
                    try {
                        var contact = obj.contact;
                        contactlist.update_contact(contact, function () {
                            viewModel.add_contact(contact);
                            viewModel.active_tab("contacts");
                            viewModel.is_recent_msg(false);
                            appevents.dispatch("ping-contact", contact);
                            // send the contact accepted reply
                            peercomm.send_accept_addcontact_reply(contact);
                            // remove it from the pending contacts
                            apputils.delete_pending_contact(contact.name, function () {});
                        });
                    }
                    catch (err) {
                        streembit.notify.error("Accept contact error %j", err, true)
                    }
                },

                declineAddContact: function (obj) {
                    try {                        
                        var contact = obj.contact;
                        peercomm.send_decline_addcontact_reply(contact);
                        var account = contact.name;
                        viewModel.recent_messages.remove(function (item) {
                            return item.contact && item.contact.name == account;
                        })
                    }
                    catch (err) {
                        streembit.notify.error("Decline contact error %j", err);
                    }                    
                },

                onReceiveAddContact: function (contact) {
                    viewModel.recent_messages.push(new RecentListItemViewModel(contact, "addcontact-recent-messages", {}));
                    viewModel.is_recent_msg(true);
                }

            };

            // initialize the view model
            viewModel.init();

            return viewModel;
        };        

        return {
            viewModel: ContactsListVm,
            template: template
        };
    });

} ());



