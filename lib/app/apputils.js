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
var contactlist = require("contactlist");
var peermsg = require("peermsg"); 
var defs = require("definitions"); 
var bootbox = require("makeusabrew/bootbox"); 
var appsrvc = require("appsrvc"); 
var peercomm = require("peercomm"); 
var accounts = require("accounts"); 


(function () {

    var apputils = apputils || {};

    var blocked_contacts = blocked_contacts || [];
    var pending_contacts = pending_contacts || [];

    apputils.backup_account = function() {
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

            database.del(database.TEMPCONTDB, deletecontact.name).then(
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

    apputils.handle_account_messages = function (payload) {
        if (!payload) { return; }

        if (payload.error) {
            return streembit.notify.error("Get offline messages error:  %j", e. true);
        }

        var count = payload.count;
        var messages = payload.messages;
        if (!messages || !messages.length) { return; }

        var list = [];

        for (var i = 0; i < messages.length; i++) {
            var key = messages[i].key;
            if (!key) { continue; }

            var keyarr = key.split("/");
            if (keyarr.length < 3) { continue; }

            if (keyarr[0] != user.name || keyarr[1] != "message") { continue; }

            var hash = keyarr[keyarr.length - 1];
            var data = messages[i].value;

            var payload = peermsg.getpayload(data);
            var sender = payload.iss;
            var contact = contactlist.get_contact(sender);

            var public_key = contact ? contact.public_key : null;
            if (!public_key) {
                //  try to get it from the message 
                public_key = payload.data.public_key;
                if (!public_key) { continue; }
            }

            var message = peermsg.decode(data, public_key);
            if (!message)
                continue;

            list.push({ key: key, message: message });
        }

        if (list.length) {
            appevents.dispatch("on-account-messages", list);
        }
    }

    apputils.timeNow = function () {
        var d = new Date(),
            h = (d.getHours() < 10 ? '0' : '') + d.getHours(),
            m = (d.getMinutes() < 10 ? '0' : '') + d.getMinutes();
        var value = h + ':' + m;
        return value;
    };

    apputils.accept_call = function (sender, type, resultfn) {

        if (type != defs.CALLTYPE_VIDEO && type != defs.CALLTYPE_AUDIO) {
            return streembit.notify.error("Invalid call type received from " + sender, null, true);
        }

        var ctype;
        if (type == defs.CALLTYPE_VIDEO) {
            ctype = "video";
        }
        else {
            ctype = "audio";
        }
        var msg = "Incoming " + ctype + " call from " + sender + ". Accept call?";

        var audioctrl = document.getElementById('ringsound1');
        audioctrl.muted = false;
        audioctrl.play();

        try {
            bootbox.dialog({
                message: msg,
                title: "Incoming call",
                closeButton: false,
                buttons: {
                    danger: {
                        label: "Decline",
                        callback: function () {
                            audioctrl.pause();
                            audioctrl.muted = true;
                            resultfn(false);
                        }
                    },
                    success: {
                        label: "Accept",
                        callback: function () {
                            audioctrl.pause();
                            audioctrl.muted = true;
                            resultfn(true);
                        }
                    }
                }
            });
        }
        catch (err) {
            audioctrl.pause();
            audioctrl.muted = true;
            resultfn(false);
        }

    };

    apputils.delete_account = function (callback) {
        try {
            var username = user.name;
            if (!username) {
                throw new Error("the account is not initialized");
            }

            var account = accounts.get_account(username);
            if (!account) {
                throw new Error("The account does not exists");
            }

            if (!appsrvc.account_connected) {
                throw new Error("The account is not connected to the Streembit network");
            }

            bootbox.confirm("Your account will be removed from the Streembit network. Click on OK to continue!", function (result) {
                if (result) {
                    peercomm.delete_public_key(function (err) {
                        if (err) {
                            return streembit.notify.error("Delete account error %j", err);
                        }

                        accounts.delete(username, function () {
                            callback();
                        });
                    });
                }
            });

        }
        catch (err) {
            streembit.notify.error("Delete account error: %j", err);
        }       
    }

    apputils.restore_account = function (callback) {
        try {

            filedialog.initialize({
                type: 'open',
                accept: ['.dat'],
                path: '~/Documents'
            });

            filedialog.readTextFile(function (err, buffer, path) {
                var text = null;
                try {
                    if (!buffer) {
                        throw new Error("not a valid Streembit account backup");
                    }

                    var data = (typeof buffer == "string") ? buffer : buffer.toString();
                    var find1 = "---BEGIN STREEMBIT KEY---\n";
                    var pos1 = data.indexOf(find1);
                    if (pos1 == -1) {
                        throw new Error("not a valid Streembit account backup");
                    }
                    var pos2 = data.indexOf("\n---END STREEMBIT KEY---");
                    if (pos2 == -1) {
                        throw new Error("not a valid Streembit account backup");
                    }

                    var start = find1.length;
                    var decoded = data.substring(start, pos2);
                    text = window.atob(decoded);
                }
                catch (e) {
                    return streembit.notify.error("Invalid account backup data. Error: %j", e);
                }

                if (!text) {
                    return streembit.notify.error("Invalid account backup data");
                }

                var userobj;
                try {
                    userobj = JSON.parse(text);
                }
                catch (err) { }

                if (!userobj) {
                    return streembit.notify.error("Invalid account backup data");
                }

                // get the password
                var box = bootbox.dialog({
                    title: "Private key password",
                    message: '<div class="row"><div class="col-md-12">   ' +
                    '<input id="privkeypwd" name="privkeypwd" type="password" class="form-control input-md"> ' +
                    '</div></div>',
                    buttons: {
                        danger: {
                            label: "Cancel",
                            className: 'btn-default',
                            callback: function () {
                            }
                        },
                        success: {
                            label: "OK",
                            className: 'btn-default',
                            callback: function () {
                                try {
                                    var result = $('#privkeypwd').val();
                                    if (result === null) {
                                        return bootbox.alert("Enter the private key password!");
                                    }

                                    user.restore(result, userobj, callback);                                
                                }
                                catch (e) {
                                    bootbox.alert("Error in initializing the account: " + e.message);
                                }
                            }
                        }
                    }

                });
            });


        }
        catch (e) {
            streembit.notify.error("Account restore error: %j", e);
        }
    }

    module.exports = apputils;

}());