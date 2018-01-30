
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
        ['appsrvc', 'contactlist', 'peercomm', 'appevents', 'apputils', 'settings', 'contactsutil', 'uihandler', 'utilities', './contactsbar.html!text'],
        function (appsrvc, contactlist, peercomm, appevents, apputils, settings, contactsutil, uihandler, utilities, template) {

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

                dispose: function () {
                    console.log("ContactsListVm dispose");        
                    appevents.addListener("oncontactevent", this.onContactEvent);
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
                            var contobj = merge(contact, list[i]);

                            viewModel.contacts.push(contobj);

                            var account = contact.name;
                            viewModel.recent_messages.remove(function (item) {
                                return item.contact && item.contact.name == account;
                            })
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
                        case "on-text-message": 
                            viewModel.onTextMessage(payload, param, data);
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
                                break;
                            }
                        }
                    }
                    catch (err) {
                        streembit.notify.error("contact onContactWarning error %j", err, true);
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
                                break;
                            }
                        }
                    }
                    catch (err) {
                        streembit.notify.error("contact onContactError error %j", err, true);
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
                            if (contacts[i].name === account) {
                                contacts[i].isonline(isonline);
                                if (isonline) {
                                    contacts[i].warnicon('');
                                    contacts[i].warning('');
                                    contacts[i].actionicon('');
                                }

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
                        if (data.sender == viewModel.selected_contact_name &&
                            (appsrvc.currentview == "contact-chat" || appsrvc.currentview == "audio-call" || appsrvc.currentview == "video-call")) {
                            return;
                        }

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
                            streembit.notify.error("Contact error: %j", item.error());
                            item.error("")
                        }
                    }
                    catch (err) {
                        streembit.notify.error("contact itemAction error %j", err, true);
                    }
                },

                itemSelect: function (item) {
                    //appevents.dispatch("on-contact-selected", item);
                    viewModel.selected_contact_name = item.name;
                    appevents.dispatch("on-appui-event", "hide-contacts-bar", item);
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
                            return streembit.notify.error("Can't add yourself as a contact.");
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
                                return streembit.notify.error("Add contact error %j", err);
                            }
                           
                            reset();
                        });
                    }
                    catch (err) {
                        // unblock the UI
                        uihandler.unblockwin();
                        unblocked = true;
                        streembit.notify.error("Add contact error %j", err);
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



