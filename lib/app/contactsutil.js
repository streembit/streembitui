
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

    const defs = require("definitions");
    const peercomm = require("peercomm");
    const appsrvc = require("appsrvc");
    const database = require("database");
    const async = require("async");
    const appevents = require("appevents");
    const logger = require("applogger");
    const contactlist = require("contactlist");
    const ContactHandler = require("contact");
    const utilities = require("utilities");
    const errhandler = require("errhandler");
    const errcodes = require("errcodes");

    var handler = {};   

  
    function ping(contact) {
        peercomm.ping(contact, false, 8000)
        .then(
            function () {
                    appevents.dispatch("oncontactevent", "contact-last-ping", contact.name);
                    appevents.dispatch("oncontactevent", "contact-online", contact.name, true);
                    appevents.dispatch("oncontactevent", "update-contact", contact.name, { lastping: Date.now() });
                    contactlist.update_lastping(contact.name);
                    logger.debug("contact " + contact.name + " is online");
              
            },
            function (err) {
                appevents.dispatch("oncontactevent", "contact-last-ping", contact.name);
                appevents.dispatch("oncontactevent", "contact-online", contact.name, false);
                //  if the contact is offline then that is not an error 
                if ((typeof err == 'string' && err.indexOf("TIMEDOUT") > -1) || (err.message && err.message.indexOf("TIMEDOUT") > -1)) {
                    logger.debug("Ping to contact " + contact.name + " timed out");
                }
                else {
                    logger.debug("Ping to contact " + contact.name + " error: %j", err);
                }
            }
        );
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
                    appevents.dispatch("oncontactevent", "on-remove-contact", account);
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

    function on_contact_error(account, error) {
        if (!account) {
            return streembit.notify.error("validate_contact error: invalid parameters");
        }

        var contacts = contactlist.contacts;
        for (var i = 0; i < contacts.length; i++) {
            if (contacts[i].name == account) {
                contacts[i].error = error;
            }
        }

        appevents.dispatch("oncontactevent", "on-contact-error", account, error);
    }
    
    function init_contact(contact, callback) {
        try {
            var account = contact.name;
            var public_key = contact.public_key;
            logger.debug("initializing contact: " + account + ", public_key: " + public_key);

            // send a contact offer
            peercomm.send_contact_offer(appsrvc.username, appsrvc.pubkeyhash, appsrvc.publicKeyBs58, public_key,
                appsrvc.connsymmkey, appsrvc.transport, appsrvc.host, appsrvc.port, appsrvc.usertype,
                (err) => {
                    if (err) {
                        streembit.notify.error( "Sending sent contact offer to " + account + " failed, error: %j", err, true)
                    }
                }
            );

            var contactobj = new ContactHandler(contact);
            contactobj.find((err, result) => {
                try {
                    if (err) {
                        if (typeof err !== "string" && typeof err !== "number") {
                            // add info if this is an object
                            err.info = "contact name " + account;
                        }
                        var msg = errhandler.getmsg(errcodes.UI_FINDCONTACT, err);
                        streembit.notify.error(msg, null, true);
                        on_contact_error(account, msg);
                        return callback();
                    }

                    if (!result || account != result.name) {
                        var msg = errhandler.getmsg(errcodes.UI_FINDCONTACT);
                        msg += ". Contact: " + account;
                        on_contact_error(account, msg);
                        streembit.notify.error(msg, null, true);
                        return callback();
                    }

                    contactlist.updateDB(result);
                    appevents.dispatch("oncontactevent", "update-contact", account, result);

                    callback();

                    // ping
                    ping(result);

                    //
                }
                catch (xe) {
                    streembit.notify.error("Contact find result exception %j", xe, true);
                }

            });
            
        }
        catch (err) {
            callback();
            streembit.notify.error("init_contact error: %j", err, true);
        }
    }

    //  Call this when the UI receives an add contact request 
    //  and the user accept it
    handler.add_contact = function (contact, cbfunc) {

        var isoffer_complete = false;

        if (!contact.publickeyhex) {
            contact.publickeyhex = utilities.bs58toHex(contact.public_key);
        }

        async.waterfall([
            function (callback) {
                // first add an offer
                peercomm.send_contact_offer(
                    appsrvc.username,
                    appsrvc.pubkeyhash,
                    appsrvc.publicKeyBs58,
                    contact.public_key,
                    appsrvc.connsymmkey,
                    appsrvc.transport,
                    appsrvc.host,
                    appsrvc.port,
                    appsrvc.usertype,
                    callback);
            },
            function (callback) {
                isoffer_complete = true;
                // if it was successfull add to the database
                contactlist.add_contact(contact, callback);   
            },
            function (callback) {
                appevents.dispatch("oncontactevent", "add-contact", contact);
                var contactobj = new ContactHandler(contact);
                contactobj.find(callback);
            },
            function (result, callback) {
                if (!result || !result.name || contact.name != result.name) {
                    callback("Couldn't find contact details on the network");
                }
                else {
                    contactlist.update(result, function () {                        
                        callback(null, result);
                    });
                }
            },
            function (result, callback) {
                ping(result);
                callback();
            }
        ],
        function (err) {
            if (err && !isoffer_complete) {
                return cbfunc(err);
            }
            else if (err && isoffer_complete) {
                streembit.notify.info("Contact offer was added, but offer from the contact was not received", null, true);
            }
            
            cbfunc();            
        });
    }    
    
    handler.init = function (callback) {
        try {
            if (!appsrvc.username) {
                throw new Error("the user account is not initialized.");
            }

            // we have the contact list
            // initialize the contacts bar
            appevents.dispatch("oncontactevent", "contacts-init");

            // iterate through the contacts and ping them
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

                //
            });
        }
        catch (err) {
            streembit.notify.error("Error in initializing contacts: %j", err, true);
        }
    }
    
    handler.on_account_init = function (account) {
        setTimeout(function () {
            handler.init();
        }, 1000);
    }

    handler.load = function () {
        return new Promise(function (resolve, reject) {
            // create an event handlers
            appevents.addListener("account-init", handler.on_account_init);
            appevents.addListener("ping-contact", ping);

            resolve();
        });          
    }
    
    module.exports = handler;

}());
