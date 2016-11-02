
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
    var contactlist = require("contactlist");

    var handler = {};
    var pending_contacts = {};
  
    function ping(contact) {
        peercomm.ping(contact, false, 30000)
        .then(
            function () {
                appevents.dispatch("contact-last-ping", contact.name);
                appevents.dispatch("contact-online", contact.name, true);
                logger.debug("contact " + contact.name + " is online");
            },
            function (err) {
                appevents.dispatch("contact-last-ping", contact.name);
                appevents.dispatch("contact-online", contact.name, false);
                //  if the contact is offline then that is not an error 
                if ((typeof err == 'string' && err.indexOf("TIMEDOUT") > -1) || (err.message && err.message.indexOf("TIMEDOUT") > -1)) {
                    logger.debug("Ping to contact " + self.name + " timed out");
                }
            }
        );
    }
    
    function pending_contact_handler() {

        apputils.get_pending_contacts(function (err, pcontacts) {
            if (err) {
                return err;
            }

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
        });
    }      
        
    function validate_contact(account, obj) {
        if (!account || !obj) {
            return streembit.notify.error("validate_contact error: invalid parameters");
        }

        var contacts = contactlist.contacts;
        for (var i = 0; i < contacts.length; i++) {
            if (contacts[i].name == account) {
                if (obj.public_key != contacts[i].public_key) {
                    streembit.notify.error(
                        "Validate contact error. Invalid contact received from the network. Contact " + account + " will be removed from the contact list",
                        null,
                        true
                    );
                    // remove from the list
                    //TODO signal the contacts viewmodel to refersh the contact list
                    //  remove from the local db
                    return contactlist.remove(account);
                }
                
                contacts[i].address = obj.address;
                contacts[i].port = obj.port;
                contacts[i].public_key = obj.public_key || contacts[i].public_key;
                contacts[i].protocol = obj.protocol  ? obj.protocol : defs.TRANSPORT_TCP;
                contacts[i].user_type = obj.user_type;

            }
        }
        
        var contact = contactlist.get_contact(account);
        if (!contact) return;
        
        logger.debug("contact " + account + " populated from network and updated. address: " + contact.address + ". port: " + contact.port + ". protocol: " + contact.protocol);
    }
    
    function init_contact(param, callback) {
        try {
            var account = param.name;
            var public_key = param.public_key;
            logger.debug("initializing with find contact: " + account + ", public_key: " + public_key);
            
            peercomm.get_published_contact(account, function (err, contact) {
                if (err) {
                    streembit.notify.error("Contact search error %j", err);
                    return callback();
                }
                if (!contact || account != contact.name) {
                    streembit.notify.error("Couldn't find contact " + account + " on the network", null, true);
                    return callback();
                }
                
                contactlist.updateDB(contact);
                validate_contact(account, contact);
                appevents.dispatch("update-contact", account, contact);

                peercomm.find_contact(account, public_key)
                .then(
                    function (contact_node) {
                        if (contact_node && contact_node.name == account && contact_node.address && contact_node.port && contact_node.protocol) {
                            if (contact_node.address != contact.address || 
                                contact_node.port != contact.port || 
                                contact_node.protocol != contact.protocol) {
                                contact.address = contact_node.address;
                                contact.port = contact_node.port;
                                contact.protocol = contact_node.protocol;

                                contactlist.updateDB(contact);
                                validate_contact(account, contact);

                                appevents.dispatch("update-contact", account, contact);
                            }
                        }
                        callback();
                    },
                    function (err) {
                        streembit.notify.error("find_contact error: %j", err, true);
                        callback();
                    }
                );
            });
        }
        catch (err) {
            callback();
            streembit.notify.error("init_contact error: %j", err, true);
        }
    }
    
    function init_contacts() {
        try {
            var contacts = contactlist.contacts;
            async.eachSeries(contacts, init_contact, function (err) {
                var msg = "Contacts initialization";
                if (err) {
                    msg += " error: " + err;
                }
                else {
                    msg += " completed.";
                }
                streembit.notify.info(msg, null, true);

                // get the offline messages for the account
                console.log("call get_account_messages");
                var key = appsrvc.username + "/message";
                peercomm.get_account_messages(key);
            });
        }
        catch (err) {
            logger.error("init_contacts error: %j", err);
        }
    }
    
    handler.on_receive_addcontact = function (request) {
        var account = request.name;
        
        //  if it exists then return the accept add contact
        if (contactlist.exists(account)) {
            var existing_contact = contactlist.get_contact(account);
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
                appevents.dispatch("on-receive-add", contact);
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
        contactlist.update_contact(contact, function () {
            appevents.dispatch("add-contact", contact);
            // send the contact accepted reply
            peercomm.send_accept_addcontact_reply(contact);
        });
    }
    
    //  Call this when the contact returns via the network an "accept add contact" reply
    //  or when the contact sends an exchange key message 
    handler.handle_addcontact_accepted = function (account) {
        var contact = pending_contacts[account];
        if (contact) {
            contactlist.update_contact(contact, function () {
                // add to the viewmodel
                appevents.dispatch("add-contact", contobj);

                // delete from the database
                apputils.delete_pending_contact(account, function () {
                    delete pending_contacts[account];
                });

                // ping to the contact
                ping(contact);
            });
            
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
    
    
    handler.init = function (callback) {
        try {
            if (!appsrvc.username) {
                throw new Error("the user account is not initialized.");
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

        }
        catch (err) {
            streembit.notify.error("Error in initializing contacts: %j", err, true);
        }
    }
    
    handler.on_account_init = function (account) {
        console.log("Contacts signalled on_account_init: " + account)
        handler.init();
    }

    handler.load = function () {
        return new Promise(function (resolve, reject) {
            // create an event handlers
            appevents.addListener("account-init", handler.on_account_init);
            appevents.addListener("on-netreceive-addcontact", handler.on_receive_addcontact);            
            appevents.addListener("on-netreceive-addcontact-accepted", handler.handle_addcontact_accepted);
            appevents.addListener("on-netreceive-addcontact-denied", handler.handle_addcontact_denied);
            appevents.addListener("on-offline-addcontact-accepted", handler.offline_addcontact_accepted);
            appevents.addListener("on-offline-addcontact-declined", handler.offline_addcontact_declined);

            resolve();
        });          
    }
    
    module.exports = handler;

}());
