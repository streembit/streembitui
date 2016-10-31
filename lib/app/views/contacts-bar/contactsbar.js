
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

    define(['knockout', 'appsrvc', 'contacts', 'appevents', './contactsbar.html!text'], function (ko, appsrvc, contacts_handler, appevents, template) {

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
                this.actionicon = ko.observable("")
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

                init: function (list) {
                    if (!list || list.length == 0) {
                        return;
                    }

                    for (var i = 0; i < list.length; i++) {
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
                },

                dosearch: function () {
                    viewModel.addcontact_name("");
                    viewModel.addcontact_obj = 0;
                    viewModel.show_addcontact_panel(false);

                    if (!streembit.Main.is_node_initialized) {
                        return streembit.notify.error_popup("The Streembit account is not initialized. First log-in with your Streembit account");
                    }

                    viewModel.issearch(!viewModel.issearch());
                },

                onTextMessage: function (data) {
                    try {
                        var contacts = viewModel.contacts();
                        for (var i = 0; i < contacts.length; i++) {
                            if (contacts[i].name == data.sender) {
                                contacts[i].actionicon("glyphicon glyphicon-envelope");
                                contacts[i].actiontype = "textmsg";
                                data.time = streembit.util.timeNow();
                                streembit.Session.add_textmsg(data.sender, data);
                                break;
                            }
                        }
                    }
                    catch (err) {
                        streembit.logger.error("contact onTextMessage error %j", err);
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
                        streembit.logger.error("contact onFileReceive error %j", err);
                    }
                },

                itemAction: function (item) {
                    try {
                        if (item.actiontype == "textmsg") {
                            var options = {
                                contact: item,
                                issession: true
                            };
                            events.emit(events.TYPES.ONAPPNAVIGATE, streembit.DEFS.CMD_CONTACT_CHAT, null, options);
                            item.actiontype = "";
                            item.actionicon("");
                        }
                        else if (item.actiontype == "filercv") {
                            events.emit(events.TYPES.ONAPPNAVIGATE, streembit.DEFS.CMD_CONTACT_FILERCV, item);
                            item.actiontype = "";
                            item.actionicon("");
                        }
                    }
                    catch (err) {
                        streembit.logger.error("contact itemAction error %j", err);
                    }
                },

                itemSelect: function (item) {
                    events.emit(events.TYPES.ONAPPNAVIGATE, streembit.DEFS.CMD_CONTACT_SELECT, item);
                },

                remove: function (item) {
                    bootbox.confirm("Contact '" + item.name + "' will be removed from the contacts list.", function (result) {
                        if (result) {
                            streembit.Contacts.remove(item.name, function () {
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
                            streembit.Contacts.remove(item.name, function () {
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
                            return streembit.notify.error_popup("Enter the human or device account name");
                        }

                        if (streembit.Contacts.exists(account)) {
                            return streembit.notify.info("This contact is already exists in the contact list");;
                        }

                        streembit.Contacts.search(account, function (contact) {
                            if (contact) {
                                self.contact_lookup("");
                                self.addcontact_name(contact.name);
                                self.addcontact_obj = contact;
                                self.show_addcontact_panel(true);
                            }
                        });

                    }
                    catch (err) {
                        streembit.logger.error("contact search error %j", err)
                    }
                },

                onSendAddContactRequest: function () {
                    streembit.Contacts.send_addcontact_request(viewModel.addcontact_obj, function () {
                        viewModel.addcontact_name("");
                        viewModel.addcontact_obj = 0;
                        viewModel.show_addcontact_panel(false);
                    });
                },

                onShowContacts: function () {
                    viewModel.active_tab("contacts");
                },

                onShowRecents: function () {
                    viewModel.active_tab("recent");
                    viewModel.is_recent_msg(false);
                },

                acceptAddContact: function (obj) {
                    var contact = obj.contact;
                    streembit.Contacts.accept_contact(contact);
                },

                declineAddContact: function (obj) {
                    var contact = obj.contact;
                    streembit.Contacts.decline_contact(contact);
                    var account = contact.name;
                    viewModel.recent_messages.remove(function (item) {
                        return item.contact && item.contact.name == account;
                    })
                },

                onReceiveAddContact: function (contact) {
                    viewModel.recent_messages.push(new streembit.vms.RecentListItemViewModel(contact, "addcontact-recent-messages", {}));
                    viewModel.is_recent_msg(true);
                }

            };

            if (!contacts_handler.is_initialized) {
                contacts_handler.init(function (list) {
                    viewModel.init(list);
                });
            }
            else {
                var list = contacts_handler.list_of_contacts();
                viewModel.init(list);
            }

            return viewModel;
        };        

        return {
            viewModel: ContactsListVm,
            template: template
        };
    });

} ());



