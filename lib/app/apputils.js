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
//var bootbox = require("makeusabrew/bootbox"); 
var appsrvc = require("appsrvc"); 
var accounts = require("accounts"); 
var uihandler = require("uihandler"); 
var utilities = require("utilities");
var settings = require("settings");

(function () {

    var apputils = apputils || {};

    apputils.clear_database = function () {
        var process = confirm("All settings and data will be removed from the local database. We strongly suggest to clear the database if you use Streembit on a shared/public computer.  Make sure you made a backup if you want to keep using your account.");
        if (process) {
            database.clear().then(
                function () {
                    streembit.notify.success("The database was cleared successfully");
                },
                function (err) {
                    streembit.notify.error("Database clear error %j", err);
                }
            );
        }
    };

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
                //streembit.notify.success("Account backup is completed.");
            });            

        }
        catch (err) {
            streembit.notify.error("Account backup error: %j", err);
        }       
    }

    apputils.backup_contacts = function () {
        try {
            var username = appsrvc.username;
            if (!username) {
                throw new Error("the account is not initialized");
            }

            var account = accounts.get_account(username);
            if (!account) {
                throw new Error("The account does not exists");
            }

            // get the contacts 
            database.ContactsDB.get_contacts(username, function (err, result) {
                if (err) {
                    return streembit.notify.error("Database get contacts error %j", err, true);
                }

                if (!result || !result.length) {
                    return alert("No contact exists for this account");
                }

                var text = JSON.stringify(result);
                var file_name = "contacts.dat";

                filedialog.initialize({
                    type: 'save',
                    accept: ['contacts.dat'],
                    path: '~/Documents',
                    defaultSavePath: 'contacts.dat'
                });

                filedialog.saveTextFile(text, file_name, function () {
                    streembit.notify.success("Contacts backup is completed.", null, true);
                });
            });            

        }
        catch (err) {
            streembit.notify.error("Account backup error: %j", err);
        }
    }
    
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

    apputils.accept_invite = function (msg, resultfn) {
        try {
            bootbox.dialog({
                message: msg,
                title: "Invitation to join a chat",
                closeButton: false,
                buttons: {
                    danger: {
                        label: "Decline",
                        callback: function () {
                            resultfn(false);
                        }
                    },
                    success: {
                        label: "Accept",
                        callback: function () {
                            resultfn(true);
                        }
                    }
                }
            });
        }
        catch (err) {
            resultfn(false);
        }
    }

    apputils.restore_account = function (cbfunc) {
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

                var dlgcontent = '<div class="row"><div class="col-md-12">   ' +
                    '<input id="privkeypwd" name="privkeypwd" type="password" class="form-control input-md"> ' +
                    '</div></div>';

                // get the password
                var box = bootbox.dialog({
                    title: "Private key password",
                    message: dlgcontent,
                    buttons: {
                        danger: {
                            label: "Cancel",
                            className: 'btn-light',
                            callback: function () {
                            }
                        },
                        success: {
                            label: "OK",
                            className: 'btn-light',
                            callback: function () {
                                try {
                                    var result = $('#privkeypwd').val();
                                    if (result === null) {
                                        return bootbox.alert("Enter the private key password!");
                                    }

                                    user.restore(result, userobj, cbfunc);                                
                                }
                                catch (e) {
                                    bootbox.alert("Error in initializing the account: " + e.message);
                                }
                            }
                        }
                    }
                });

                box.init(function () {
                    $(".modal-header").css("padding", "4px 8px 4px 12px");
                });
            });


        }
        catch (e) {
            streembit.notify.error("Account restore error: %j", e);
        }
    }

    apputils.restore_contacts = function (callback) {
        try {
            var username = appsrvc.username;
            if (!username) {
                throw new Error("the account is not initialized");
            }            

            filedialog.initialize({
                type: 'open',
                accept: ['.dat'],
                path: '~/Documents'
            });

            filedialog.readTextFile(function (err, buffer, path) {
                var data;
                try {
                    if (!buffer) {
                        throw new Error("not a valid Streembit contact backup");
                    }

                    var text = (typeof buffer == "string") ? buffer : buffer.toString();
                    try {
                        data = JSON.parse(text);
                    }
                    catch (e) { }
                    if (!data) {
                        throw new Error("not a valid Streembit contact backup");
                    }
                }
                catch (e) {
                    return streembit.notify.error("Streembit contacts restore error: %j", e);
                }

                bootbox.confirm("Restore the contacts list. All existing contact data will be overwritten", function (result) {
                    if (result) {
                        // save to the database
                        database.ContactsDB.update(username, data, function (err) {
                            if (err) {
                                return streembit.notify.error("Contacts restore error: %j", e);
                            }

                            streembit.notify.success("The contacts have been restored.");
                        });
                    }
                });
            });              
                   
        }
        catch (e) {
            streembit.notify.error("Contacts restore error: %j", e);
        }
    }

    apputils.accept_file = function (sender, file_name, file_size, action_type, callback) {
        if (action_type === 'chatimg') {
            return callback(true);
        }
        var size = utilities.format_bytes(file_size);
        var text = "Incoming file transfer from " + sender + ". File name: " + file_name + ".  File size: " + size + ". Accept file?";
        bootbox.confirm(text, function (result) {
            callback(result);
        });
    }

    apputils.accept_sharescreen = function (sender, resultfn) {

        var msg = "Contact " + sender + " offers screen sharing for you. Would you like to view the screen of contact " + sender + "? (Your screen won't be shared)";

        var audioctrl = document.getElementById('ringsound1');
        audioctrl.muted = false;
        audioctrl.play();

        try {

            bootbox.dialog({
                message: msg,
                title: "Screen share offer",
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
    }

    apputils.getversion = function (callback) {

        $.getJSON('https://api.github.com/repos/authenticity/streembit/releases', {}, function (data) {
            var version;
            if (Array.isArray(data) && data.length > 0) {
                if (data[0].tag_name) {
                    version = data[0].tag_name;
                }
            }

            if (!version) {
                return callback(true);
            }

            callback(null, version);
        })
        .fail(function () { callback(true) }); 
    }

    apputils.loadstartpage = function () {
        return new Promise((resolve, reject) => {
            var isaccount = settings.isaccountexists;
            var startpage = isaccount ? "initaccount" : "createaccount";
            appevents.navigate(startpage);
            resolve();
        });
    };    

    apputils.ping = function (host, port, callback) {

        var url = streembit.globals.protocol + '://' + host + ":" + port;

        var data = {
            "type": "ping"
        };

        var start = Date.now();

        $.ajax({
            url: url,
            type: "POST",
            data: JSON.stringify(data),
            cache: false,
            success: function (response) {
                try {
                    var obj = JSON.parse(response);
                    if (obj.error) {
                        return callback(obj.error);
                    }      

                    if (obj.result != 0) {
                        return callback("invalid ping result");
                    }

                    var end = Date.now();
                    var elapsed = end - start;
                    callback(null, elapsed);
                }
                catch (err) {
                    callback("ping wspeers error: " + err.message);
                }
            },
            error: function (request, status, error) {
                callback("ping at " + url + " failed " + ((error + "") || ""));
            },
            timeout: 5000
        });
    }

    //
    module.exports = apputils;

}());