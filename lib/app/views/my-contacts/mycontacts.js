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
        ['appsrvc', 'contactlist', 'errhandler', 'errcodes', 'appevents', './mycontacts.html!text'],
        function (appsrvc, contactlist, errhandler, errcodes, appevents, template) {

        function RecentViewModel (contact, templatename, dataobj) {
            var viewModel = {
                contact: contact,
                template_name: ko.observable(templatename),
                datactx: dataobj
            };

            return viewModel;
        }
        
        function ContactListVm() {

            function merge(contact, param) {
                for (var prop in param) {
                    if (!contact[prop]) {
                        contact[prop] = param[prop];
                    }
                }
                return contact;
            }

            function ContactU(user_type) {
                this.lastping = ko.observable(0);
                this.actionicon = ko.observable("");
                this.actiontype = "";
                this.usertypeicon = "";
                
            };

            var myContactsVM = {
                contacts: ko.observableArray([]),
                contact_lookup: ko.observable(),
                is_recent_msg: ko.observable(false),
                recent_messages: ko.observableArray([]),
                selected_contact_name: "",
                          

                dispose: function () {
                    console.log("ContactsListVm dispose");        
                    appevents.addListener("oncontactevent", this.onContactEvent);
                },


                init: function () {
                    myContactsVM.contacts([]);
                    var list = contactlist.contacts;
                    
                    if(list && list.length > 0) {
                        for(var i = 0; i<list.length; i++) {
                            var exists = false;
                            for (var j = 0; j < myContactsVM.contacts().length; j++) {
                                if (list[i].name == myContactsVM.contacts()[j].name) {
                                    exists = true;
                                    break;
                                }
                            }
                            if (exists) {
                                continue;
                            }
                            
                            var contact = new ContactU(list[i].user_type);
                            if (!list[i].avatar) {
                                list[i].avatar = null;
                            }
                            if(typeof list[i].email === 'undefined'){
                                list[i].email = '';
                            }
                            if(typeof list[i].phone === 'undefined'){
                                list[i].phone = '';   
                            }
                            if(typeof list[i].addressVal === 'undefined'){
                                list[i].addressVal = '';   
                            }
                            if(typeof list[i].country === 'undefined'){
                                list[i].country = '';   
                            }
                            if(typeof list[i].website === 'undefined'){
                                list[i].website = '';   
                            }
                            if(typeof list[i].social === 'undefined'){
                                list[i].social = '';   
                            }

                            myContactsVM.contacts.push(list[i]);

                            var account = contact.name;
                            myContactsVM.recent_messages.remove(function (item) {
                                return item.contact && item.contact.name == account;
                            })


                        }
                    }
                },   


                onContactEvent: function (event, payload, param, data) {
                    switch (event) {
                        case "contacts-init":
                            myContactsVM.init();
                            break;
                        case "update-contact":
                            myContactsVM.update_contact(payload, param, data);
                            break;
                        case "contact-last-ping":
                            myContactsVM.onLastPing(payload, param, data);
                            break;   
                        case "on-text-message":
                            myContactsVM.onTextMessage(payload, param, data);
                            break;
                        case "on-remove-mycontact":
                            myContactsVM.remove_byname_mycontact(payload, param, data);
                            break;
                        case "on-selected-contact-change":
                            myContactsVM.onSelectedContactChange(payload, param, data);
                            break;
                        default:
                            break;
                    }
                },

                remove: function (){
                    appevents.dispatch("oncontactevent", "on-remove-mycontact", this.name);  
                },

                remove_byname_mycontact: function (account, callback) {
                    var item = null;
                    for (var i = 0; i < myContactsVM.contacts().length; i++) {
                        if (myContactsVM.contacts()[i].name == account) {
                            item = myContactsVM.contacts()[i];
                            break;
                        }
                    }
                    if (!item)
                        return;

                    var result = confirm("Contact '" + item.name + "' will be deleted from My Contacts.");
                    if (result) {
                        // delete from the local db
                        contactlist.remove(item.name, function () {
                            myContactsVM.contacts.remove(item);
                            appevents.dispatch("display-view", "emptyview");
                            streembit.notify.success("Contact'" + item.name + "' deleted from My Contacts.");
                        });
                    }
                },
                onSelectedContactChange: function (contactname) {
                    if (contactname) {
                        myContactsVM.selected_contact_name = contactname;
                    }
                },

                onLastPing: function (account) {
                    try {
                        var contacts = myContactsVM.contacts();
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

                onShowContacts: function () {
                    myContactsVM.active_tab("contacts");
                },

                onShowRecents: function () {
                    myContactsVM.active_tab("recent");
                    myContactsVM.is_recent_msg(false);
                },

            };

                  
            // add event listeners
            appevents.addListener("oncontactevent", myContactsVM.onContactEvent);

            // initialize the view model
            myContactsVM.init();

            return myContactsVM;
        };        

        return {
            viewModel: ContactListVm,
            template: template
        };
    });

} ());




