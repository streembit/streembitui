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

Application service implementation

*/

'use strict';

var appevents = require("appevents");
var logger = require('applogger');
var user = require('user');
var accounts = require('accounts');
var filedialog = require("filedialog");
var database = require("database");

(function () {

    var apputils = apputils || {};

    var blocked_contacts = blocked_contacts || [];
    var pending_contacts = pending_contacts || [];

    function backup_account() {
        try {
            var username = user.name;
            if (!username) {
                throw new Error("the account is not initialized");
            }

            var account = accounts.get_account(username);
            if (!account) {
                throw new Error("The account does not exists");
            }

            filedialog.initialize({
                type: 'save',
                accept: ['streembit.dat'],
                path: '~/Documents',
                defaultSavePath: 'streembit.dat'
            });

            var objext = JSON.stringify(account);
            var encoded = window.btoa(objext);

            var text = "---BEGIN STREEMBIT KEY---\n";
            text += encoded;
            text += "\n---END STREEMBIT KEY---";

            var file_name = "streembit_" + username + ".dat";
            filedialog.saveTextFile(text, file_name, function () {
                streembit.notify.success("Account backup is completed.");
            });            

        }
        catch (err) {
            streembit.notify.error("Account backup error: %j", err);
        }       
    }

    apputils.get_pending_contacts = function (callback) {
        database.getall(database.TEMPCONTDB, function (err, result) {
            if (err) {
                if (callback) {
                    callback(err);
                }
                return streembit.notify.error("Database get pending contacts error %j", err, true);
            }

            pending_contacts = (result && result.length) ? result : [];

            if (callback) {
                callback(null, pending_contacts);
            }
        });
    };

    apputils.listof_pending_contacts = function () {
        return pending_contacts;
    }

    apputils.listen = function () {
        return new Promise((resolve, reject) => {
            // create a command listener
            appevents.onAppCommand(function (cmd, payload) {
                switch (cmd) {
                    case "backup-account":
                        logger.debug("cmd: backup-account");
                        backup_account();
                        break;
                    default:
                        break;
                }
            });

            // populate the pending contacts list
            apputils.get_pending_contacts();

            resolve(true);
        });
    };       

    apputils.get_pending_contact = function (account) {
        var pending_contact = null;
        try {
            // get pending contacts from the database
            for (var i = 0; i < pending_contacts.length; i++) {
                if (pending_contacts[i].name == account) {
                    pending_contact = pending_contacts[i];
                    break;
                }
            }

            return pending_contact;                       
        }
        catch (e) {
            streembit.notify.error("Get pending contact error: %j", e, true);
        }
    }

    apputils.delete_pending_contact = function (contact_name, callback) {
        try {

            var deletecontact;
            for (var i = 0; i < pending_contacts.length; i++) {
                if (pending_contacts[i].name == contact_name) {
                    deletecontact = pending_contacts[i];
                    break;
                }
            }

            database.update(database.TEMPCONTDB, deletecontact).then(
                function () {
                    if (callback) {
                        callback(null);
                    }
                    apputils.get_pending_contacts();
                },
                function (err) {
                    if (callback) {
                        callback(err);
                    }                   
                }
            );
        }
        catch (e) {
            logger.error("Delete from panding contact database error: %j", e);
            if (callback) {
                callback(e);
            }
        }
    }

    apputils.add_pending_contact = function (contact, callback) {

        var exists = false;
        for (var i = 0; i < pending_contacts.length; i++) {
            if (pending_contacts[i].name == contact.name) {
                //update the timestamps of the add contact request
                contact.addrequest_update = new Date().getTime();
                pending_contacts[i] = contact;
                exists = true;
                break;
            }
        }

        if (!exists) {
            contact.addrequest_update = new Date().getTime();
            pending_contacts.push(contact);
        }

        database.update(database.TEMPCONTDB, contact).then(
            function () {
                logger.debug("Updated pending contact database");
                callback(null);
                apputils.get_pending_contacts();
            },
            function (err) {
                callback(err);
            }
        );
    }

    apputils.add_blocked_contact = function (contact_name, callback) {

        var contact = {
            name: contact_name,
            data: null
        };
        blocked_contacts.push(contact);

        database.update(database.BLOCKCONTDB, blocked_contacts).then(
            function () {
                logger.debug("Updated blocked contacts database");
                callback(null);
            },
            function (err) {
                streembit.notify.error("Update blocked contacts error %j", err, true);
                callback(err);
            }
        );
    }

    module.exports = apputils;

}());