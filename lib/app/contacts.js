
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

    var defs = require("definitions");
    var peercomm = require("peercomm");
    var appsrvc = require("appsrvc");
    var net = require("streembitnet");
    var database = require("database");
    var async = require("async");
    var apputils = require("apputils");
    var appevents = require("appevents");
    var logger = require("applogger");

    var handler = {
        is_initialized: false
    };

    var contacts = [];
    var pending_contacts = {};
    
    var Contact = function (param) {
        var contobj = {
            isonline: ko.observable(false),
            lastping: ko.observable(0),
            errors: [],
            public_key: "", 
            address: "", 
            port: 0, 
            name: "",                    
            protocol: "",
            user_type: "",
            
            ping: function () {
                var _self = this;
                
                peercomm.ping(this, false, 30000)
                .then(
                    function () {
                        _self.lastping(Date.now());
                        _self.isonline(true);
                        logger.debug("contact " + _self.name + " is online");
                    },
                    function (err) {
                        _self.lastping(Date.now());
                        _self.isonline(false);
                        //  if the contact is offline then that is not an error 
                        if ((typeof err == 'string' && err.indexOf("TIMEDOUT") > -1) || (err.message && err.message.indexOf("TIMEDOUT") > -1)) {
                            logger.debug("Ping to contact " + self.name + " timed out");
                        }
                        else {
                            _self.errors.push(util.format("Ping to contact error: %j", err));
                        }
                    }
                );
            }
        };
        
        if (param) {
            for (var prop in param) {
                contobj[prop] = param[prop];
            }
        }
        
        return contobj;
    };
    
    function pending_contact_handler() {

        var pcontacts = apputils.listof_pending_contacts ();
        if (!pcontacts || !pcontacts.length) {
            return;
        }
        
        var index = 0;
        var pctimer = setInterval(
            function () {
                var account = pcontacts[index].name;
                handler.search(account, function (contact) {
                    handler.send_addcontact_request(contact, function () {
                    });
                });
                
                index++;
                if (index >= pcontacts.length) {
                    clearTimeout(pctimer);
                }
            },
            5000
        );
    }
    
    function update_contact(account, obj) {
        if (!account || !obj) {
            return streembit.notify.error("update_contact error: invalid parameters");
        }
        
        for (var i = 0; i < contacts.length; i++) {
            if (contacts[i].name == account) {
                if (obj.public_key != contacts[i].public_key) {
                    streembit.notify.error("update_contact error. Invalid contact received from the network. Contact " + account + " will be removed from the contact list");
                    // remove from the list
                    //TODO signal the contacts viewmodel to refersh the contact list
                    //  remove from the local db
                    return handler.remove(account);
                }
                
                contacts[i].address = obj.address;
                contacts[i].port = obj.port;
                contacts[i].public_key = obj.public_key || contacts[i].public_key;
                contacts[i].protocol = obj.protocol  ? obj.protocol : defs.TRANSPORT_TCP;
                contacts[i].user_type = obj.user_type;
            }
        }
        
        var contact = handler.get_contact(account);
        if (!contact) return;
        
        logger.debug("contact " + account + " populated from network and updated. address: " + contact.address + ". port: " + contact.port + ". protocol: " + contact.protocol);
    }
    
    function ping_contact(account) {
        if (!account) {
            return streembit.notify.error("ping_contact error: invalid parameters");
        }
        
        var contact = handler.get_contact(account);
        if (!contact) return;
        
        contact.ping();
        
        logger.debug("ping contact " + account);
    }
    
    function updateDB(contact) {
        database.ContactsDB.update_contact(appsrvc.username, contact).then(
            function () {
            },
            function (err) {
                streembit.notify.error("Database update add contact error %j", err);
            }                        
        );
    }
    
    function init_contact(param, callback) {
        try {
            var account = param.name;
            var public_key = param.public_key;
            logger.debug("initialzing, find contact: " + account + ", public_key: " + public_key);
            
            peercomm.get_published_contact(account, function (err, contact) {
                if (err) {
                    streembit.notify.error("Contact search error %j", err);
                    return callback();
                }
                if (!contact || account != contact.name) {
                    streembit.notify.error("Couldn't find contact " + account + " on the network");
                    return callback();
                }
                
                //callback(contact);
                updateDB(contact);
                update_contact(account, contact);
                appevents.contacts("updatecontact", account, contact);
                
                net.client.find_contact(account, public_key)
                .then(
                    function (contact_node) {
                        if (contact_node && contact_node.name == account && contact_node.address && contact_node.port && contact_node.protocol) {
                            if (contact_node.address != contact.address || 
                                contact_node.port != contact.port || 
                                contact_node.protocol != contact.protocol) {
                                contact.address = contact_node.address;
                                contact.port = contact_node.port;
                                contact.protocol = contact_node.protocol;
                                updateDB(contact);
                                update_contact(account, contact);
                                appevents.contacts("updatecontact", account, contact);
                            }
                        }
                        callback();
                    },
                    function (err) {
                        logger.error("find_contact error: %j", err);
                        callback();
                    }
                );
            //
            });
        }
        catch (err) {
            callback();
            logger.error("init_contact error: %j", err);
        }
    }
    
    function init_contacts() {
        async.eachSeries(contacts, init_contact, function (err) {
            var msg = "Contacts initialization";
            if (err) {
                msg += " error: " + err;
            }
            else {
                msg += " completed.";
            }
            streembit.notify.info(msg, null, true);
            
            // get the offline messages
            var key = appsrvc.username + "/message";
            peercomm.get_account_messages(key);
        });
    }
    
    handler.update_contact_database = function (contact, callback) {
        var updobj = {
            public_key: contact.public_key,  
            address: contact.address, 
            port: contact.port, 
            name: contact.name,
            protocol: contact.protocol,
            user_type: contact.user_type
        };
        database.ContactsDB.update_contact(appsrvc.username, updobj).then(
            function () {
                for (var i = 0; i < contacts.length; i++) {
                    if (contacts[i].name == contact.name) {
                        if (contact.address) {
                            contacts[i].address = contact.address;
                        }
                        if (contact.port) {
                            contacts[i].port = contact.port;
                        }
                        if (contact.protocol) {
                            contacts[i].protocol = contact.protocol;
                        }
                        appevents.contacts("updatecontact", contacts[i].name, contacts[i]);
                        break;
                    }
                }
                callback();
            },
            function (err) {
                callback(err);
                streembit.notify.error("Update contact database error: %j", err);
            }                        
        );
    };
    
    handler.on_receive_addcontact = function (request) {
        var account = request.name;
        
        //  if it exists then return the accept add contact
        if (handler.exists(account)) {
            var existing_contact = handler.get_contact(account);
            var existing_publickey = existing_contact.public_key;
            if (existing_publickey != request.public_key) {
                streembit.notify.error("Add contact request from " + account + " received an invalid public key: " + request.public_key)
            }
            else {
                existing_contact.address = request.address;
                existing_contact.port = request.port;
                existing_contact.protocol = request.protocol;
                // the contact already exists -> send back an accept contact message
                peercomm.send_accept_addcontact_reply(existing_contact);
            }
        }
        else {
            handler.search(account, function (contact) {
                if (contact.public_key != request.public_key || contact.user_type != request.user_type) {
                    return streembit.notify.error("Add contact request from " + account + " recieved with invalid public key");
                }
                contact.address = request.address;
                contact.port = request.port;
                contact.protocol = request.protocol;
                appevents.contacts("receiveadd", contact);
            });
        }
    }
    
    handler.offline_addcontact_accepted = function (account) {
        handler.search(account, function (contact) {
            if (!contact) {
                return streembit.notify.error("Error in populating contact '" + account + "' data");
            }
            handler.accept_contact(contact);
        });
    }
    
    handler.offline_addcontact_declined = function (account) {
        handler.search(account, function (contact) {
            if (!contact) {
                return streembit.notify.error("Error in populating contact '" + account + "' data");
            }
            peercomm.declinecontact_message(contact, function () {
            });
        });
    }
    
    handler.decline_contact = function (contact) {
        try {
            peercomm.send_decline_addcontact_reply(contact);
        }
        catch (err) {
            streembit.notify.error("decline_contact() error %j", err);
        }
    }
    
    //  Call this when the UI receives an add contact request 
    //  and the user accept it
    handler.accept_contact = function (contact) {
        database.ContactsDB.update_contact(appsrvc.username, contact).then(
            function () {
                var contobj = new Contact(contact);
                contacts.push(contobj);
                appevents.contacts("addcontact", contobj);
                // send the contact accepted reply
                peercomm.send_accept_addcontact_reply(contact);
            },
            function (err) {
                streembit.notify.error("Database update add contact error %j", err);
            }                        
        );
    }
    
    //  Call this when the contact returns via the network an accept add contact reply
    //  or when the contact sends an exchange key message 
    handler.handle_addcontact_accepted = function (account) {
        var contact = pending_contacts[account];
        if (contact) {
            var contobj = new Contact(contact);
            contacts.push(contobj);
            database.ContactsDB.update_contact(appsrvc.username, contact).then(
                function () {
                    // add to the viewmodel
                    appevents.contacts("addcontact", contobj);
                    
                    // delete from the database
                    apputils.delete_pending_contact(account, function () {
                        delete pending_contacts[account];
                    });
                    
                    // ping to the contact
                    contobj.ping();
                },
                function (err) {
                    streembit.notify.error("Database update add contact error %j", err);
                }                        
            );
        }
    }
    
    handler.handle_addcontact_denied = function (account) {
        apputils.delete_pending_contact(account, function () {
            delete pending_contacts[account];
        });
        streembit.notify.info_panel("Contact " + account + " has denied your add contact request");
    }
    
    handler.send_addcontact_request = function (contact, callback) {
        //  refresh the pending contacts database
        apputils.add_pending_contact(contact, function (err) {
            if (err) {
                return streembit.notify.error("Error in adding contact: %j", err, true)
            }
            
            var account = contact.name;
            peercomm.send_addcontact_request(contact);
            logger.info("Sending contact request to %s.", account);
            pending_contacts[account] = contact;
            callback();
            
            //  check here if the contact request was accepted
            //  put a persistent message if the contact request was still pending 
            setTimeout(
                function () {
                    var pendingc = pending_contacts[account];
                    if (pendingc) {
                        peercomm.addcontact_message(pendingc, function () { });
                    }
                },
                30000
            );
        });
    }
    
    handler.get_contact = function (account) {
        var contact = null;
        for (var i = 0; i < contacts.length; i++) {
            if (contacts[i].name == account) {
                contact = contacts[i];
                break;
            }
        }
        return contact;
    }
    
    handler.get_public_key = function (account) {
        var pk = null;
        for (var i = 0; i < contacts.length; i++) {
            if (contacts[i].name == account) {
                pk = contacts[i].public_key;
                break;
            }
        }
        return pk;
    }
    
    handler.exists = function (account) {
        var isexists = false;
        for (var i = 0; i < contacts.length; i++) {
            if (contacts[i].name == account) {
                isexists = true;
                break;
            }
        }
        return isexists;
    }
    
    handler.remove = function (name, callback) {
        database.ContactsDB.delete_contact(appsrvc.username, name, function (err) {
            if (err) {
                return streembit.notify.error("Delete contact error %j", err);
            }
            
            var pos = contacts.map(function (e) { return e.name; }).indexOf(name);
            contacts.splice(pos, 1);
            if (callback) {
                callback();
            }
        });
    }
    
    handler.search = function (account, callback) {
        try {
            logger.debug("search contact: " + account);
            peercomm.get_published_contact(account, function (err, contact) {
                if (err) {
                    return streembit.notify.error('The search for contact "' + account + '" returned no result');
                }
                
                callback(contact);
                                
            });
        }
        catch (err) {
            streembit.notify.error("Contact search error %j", err)
        }
    }
    
    handler.on_online = function (account) {
        var contact = handler.get_contact(account);
        if (contact) {
            contact.isonline(true);
        }
    }
    
    handler.on_contactseen = function (contobj) {
        try {
            var account = contobj.account;
            var contact = handler.get_contact(account);
            if (!contact) return;
            
            if (contobj.public_key != contact.public_key) {
                //TODO
                return;
            }
            
            if (contobj.address != contact.address || contact.port != contobj.port) {
                contact.address = contobj.address;
                contact.port = contobj.port;
                contact.protocol = contobj.protocol ? contobj.protocol : defs.TRANSPORT_TCP;
                
                var updobj = {
                    public_key: contact.public_key, 
                    address: contact.address, 
                    port: contact.port, 
                    name: account,
                    protocol: contact.protocol,
                    user_type: contact.user_type
                };
                
                handler.update_contact_database(updobj, function (err) {
                    if (err) {
                        //TODO
                        return;
                    }
                });
            }
            
            handler.on_online(account);
        }
        catch (err) {
            streembit.notify.error("on_contact_online() error: %j", err);
        }
    }
    
    handler.init = function (callback) {
        try {
            if (!appsrvc.username) {
                throw new Error("the user account is not initialized.");
            }

            database.ContactsDB.get_contacts(appsrvc.username, function (err, result) {
                if (err) {
                    return streembit.notify.error("ContactsDB.get_contacts error %j", err, true);
                }
                
                for (var i = 0; i < result.length; i++) {
                    var exists = false;
                    var contact = result[i];
                    for (var j = 0; j < contacts.length; j++) {
                        if (contact.name == contacts[j].name) {
                            exists = true;
                            break;
                        }
                    }
                    if (exists) {
                        continue;
                    }
                    
                    // add to the contacts list
                    var contobj = new Contact(contact);
                    contacts.push(contobj);
                }

                handler.is_initialized = true;

                //
                if (callback) {
                    callback(contacts);
                }

                // iterate through the contacts and ping them
                init_contacts();
                
                setTimeout(
                    function () {
                        // start the pending contact handler
                        pending_contact_handler();
                    },
                    10000
                );
                
            });
        }
        catch (err) {
            streembit.notify.error("Error in initializing contacts: %j", err, true);
        }
    }
    
    handler.list_of_contacts = function () {
        return contacts;
    }

    handler.on_account_init = function (account) {
        console.log("on_account_init: " + account)
        handler.init();
    }

    handler.load = function () {
        return new Promise(function (resolve, reject) {
            // create an event handler for initialization
            appevents.onAccountInit(handler.on_account_init);
            resolve();
        });          
    }
    
    module.exports = handler;

}());
