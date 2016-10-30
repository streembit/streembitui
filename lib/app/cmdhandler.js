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


(function () {

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

    var cmdhandler = cmdhandler || {};

    cmdhandler.listen = function () {
        return new Promise((resolve, reject) => {
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
            resolve(true);
        });
    };

    module.exports = cmdhandler;

}());