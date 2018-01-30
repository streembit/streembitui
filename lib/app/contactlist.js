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

    var appsrvc = require("appsrvc");
    var database = require("database");
    var defs = require("definitions");

    var list_of_contacts = {};

    var handler = {};

    function merge(contact, param) {
        for (var prop in param) {
            if (!contact[prop]) {
                contact[prop] = param[prop];
            }
        }
        return contact;
    }

    handler.load = function () {
        return new Promise((resolve, reject) => {
            try {
                handler.getcontacts(function (err) {
                    if (err) {
                        reject(err);
                    }
                    else {
                        resolve();
                    }
                });
            }
            catch (err) {
                reject(err);
            }           
        });        
    }

    handler.getcontacts = function (callback) {
        try {
            list_of_contacts = {};
            database.getall(database.CONTACTSDB, function (err, result) {
                if (err) {
                    return callback(err);
                }

                if (!result || !result.length) {
                    return callback();
                }

                for (var i = 0; i < result.length; i++) {
                    list_of_contacts[result[i].account] = result[i].contacts;
                }

                callback();
            });
        }
        catch (err) {
            callback(err);
        }           
    }

    handler.get_contact = function (account) {
        var contact = null;
        var contacts = list_of_contacts[appsrvc.username];
        if (contacts) {
            for (var i = 0; i < contacts.length; i++) {
                if (contacts[i].name == account) {
                    contact = contacts[i];
                    break;
                }
            }
        }
        return contact;
    }

    handler.exists = function (account) {
        var isexists = false;
        var contacts = list_of_contacts[appsrvc.username];
        if (contacts) {
            for (var i = 0; i < contacts.length; i++) {
                if (contacts[i].name == account) {
                    isexists = true;
                    break;
                }
            }
        }
        return isexists;
    }

    handler.get_public_key = function (account) {
        var pk = null;
        var contacts = list_of_contacts[appsrvc.username];
        if (contacts) {
            for (var i = 0; i < contacts.length; i++) {
                if (contacts[i].name == account) {
                    pk = contacts[i].public_key;
                    break;
                }
            }
        }
        return pk;
    }

    handler.get_publickey_hex = function (account) {
        var pk = null;
        var contacts = list_of_contacts[appsrvc.username];
        if (contacts) {
            for (var i = 0; i < contacts.length; i++) {
                if (contacts[i].name == account) {
                    pk = contacts[i].publickeyhex;
                    break;
                }
            }
        }
        return pk;
    }

    handler.updateDB = function (contact) {
        var contacts = list_of_contacts[appsrvc.username];
        if (!contacts) {
            list_of_contacts[appsrvc.username] = [];
            contacts = list_of_contacts[appsrvc.username];
        }

        for (var i = 0; i < contacts.length; i++) {
            if (contacts[i].name == contact.name) {
                contacts[i] = contact;
                break;
            }
        }

        database.ContactsDB.update_contact(appsrvc.username, contact).then(
            function () {
            },
            function (err) {
                streembit.notify.error("Database update contact error %j", err, true);
            }
        );
    }

    handler.update_contact = function (contact, callback) {
        var contacts = list_of_contacts[appsrvc.username];
        if (!contacts) {
            list_of_contacts[appsrvc.username] = [];
            contacts = list_of_contacts[appsrvc.username];
        }

        for (var i = 0; i < contacts.length; i++ ){
            if (contacts[i].name == contact.name) {
                contacts[i] = contact;
                break;
            }
        }
        database.ContactsDB.update_contact(appsrvc.username, contact).then(
            function () {
            },
            function (err) {
                streembit.notify.error("Database update add contact error %j", err, true);
            }
        );

        callback();
    }

    handler.add_contact = function (contact, callback) {
        var contacts = list_of_contacts[appsrvc.username];
        if (!contacts) {
            list_of_contacts[appsrvc.username] = [];
            contacts = list_of_contacts[appsrvc.username];
        }

        var updated = false;
        for (var i = 0; i < contacts.length; i++) {
            if (contacts[i].name == contact.name) {
                contacts[i] = contact;
                updated = true;
                break;
            }
        }

        if (!updated) {
            contacts.push(contact);
        }

        database.ContactsDB.update_contact(appsrvc.username, contact).then(
            function () {
                handler.getcontacts(function () {
                    callback();
                });
            },
            function (err) {
                streembit.notify.error("Database update add contact error %j", err, true);
            }
        );        
    }

    handler.update = function (contact, callback) {
        var updated_contact = {};
        merge(updated_contact, contact);
        handler.update_contact(updated_contact, callback);
    }

    handler.remove = function (name, callback) {
        var newcontacts = [];
        var contacts = list_of_contacts[appsrvc.username];
        for (var i = 0; i < contacts.length; i++) {
            if (contacts[i].name != name) {
                newcontacts.push(contacts[i]);
            }
        }
        list_of_contacts[appsrvc.username] = newcontacts;

        database.ContactsDB.delete_contact(appsrvc.username, name, function (err) {
            if (err) {
                return streembit.notify.error("Delete contact error %j", err);
            }            

            handler.getcontacts(callback);
        });        
    }

    handler.update_lastping = function (name, callback) {
        var contacts = list_of_contacts[appsrvc.username];
        for (var i = 0; i < contacts.length; i++) {
            if (contacts[i].name == name) {
                contacts[i].lastping = Date.now();
                break;
            }
        }
    }

    Object.defineProperty(handler, 'contacts', {
        get: function () {
            if (!appsrvc.username) {
                return [];
            }
            else {
                return list_of_contacts[appsrvc.username] ? list_of_contacts[appsrvc.username] : [];
            }
        }
    })

    module.exports = handler;

}());