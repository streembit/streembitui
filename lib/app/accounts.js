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

    var appevents = require("appevents");
    var database = require('./database');

    var accounts = {};

    accounts.list = [];

    function get_accounts(callback) {
        database.getall(database.ACCOUNTSDB, function (err, result) {
            if (err) {
                return callback(err);
            }

            // set the list
            accounts.list = result;

            if (callback) {
                callback();
            }
        });
    }

    accounts.load = function () {
        try {
            return new Promise(function (resolve, reject) {
                get_accounts(function (err) {
                    if (err) {
                        reject();
                    }
                    else {
                        resolve();
                    }
                });
            });            
        }
        catch (err) {
            reject(err);
        }
    }

    accounts.update = function (user, callback) {
        database.AccountsDB.put(user, function (add_err) {
            if (add_err) {
                return callback(add_err);
            }

            get_accounts(function (get_err) {
                if (get_err) {
                    return callback(get_err);
                }

                callback();
            });            
        });
    }

    accounts.exists = function (account) {
        for (var i = 0; i < accounts.list.length; i++) {
            if (accounts.list[i].account == account) {
                return true;
            }
        }
        return false;
    }

    accounts.get_account = function(name, callback) {
        for (var i = 0; i < accounts.list.length; i++) {
            if (accounts.list[i].account == name) {
                return accounts.list[i];
            }
        }
        return 0;
    }

    accounts.delete = function (name, callback) {
        database.del(database.ACCOUNTSDB, name).then(
            function () {
                if (callback) {
                    callback();
                }
                get_accounts(function () {});
            },
            function (err) {
                streembit.notify.error("Deleting account from local database error %j", err);
            }
        );
    }

    accounts.count = function () {
        return accounts.list.length;
    }

    module.exports = accounts;

})();