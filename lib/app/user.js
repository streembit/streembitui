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

var ecckey = require('cryptlib');
var secrand = require('secure-random');
var createHash = require('create-hash');
var logger = require('./logger');
var peermsg = require("peermsg");
var database = require('./database');
var events = require("appevents");
var appsrvc = require('./appsrvc');
var accounts = require('./accounts');

(function () {
    var usrobj = {};

    var m_name = null;
    var key = null;
    var m_port = null;
    var m_address = null;

    Object.defineProperty(usrobj, "name", {
        get: function () {
            return m_name;
        },

        set: function (value) {
            m_name = value;
        }
    });

    Object.defineProperty(usrobj, "port", {
        get: function () {
            return m_port;
        },

        set: function (value) {
            m_port = value;
        }
    });

    Object.defineProperty(usrobj, "address", {
        get: function () {
            return m_address;
        },

        set: function (value) {
            m_address = value;
        }
    });

    Object.defineProperty(usrobj, "crypto_key", {
        get: function () {
            return key;
        },

        set: function (value) {
            key = value;
        }
    });

    Object.defineProperty(usrobj, "private_key", {
        get: function () {
            return key ? key.privateKey : '';
        }
    });

    Object.defineProperty(usrobj, "public_key", {
        get: function () {
            return key ? key.publicKeyHex : '';
        }
    });

    Object.defineProperty(usrobj, "is_user_initialized", {
        get: function () {
            var isuser = m_name && key && ecdhkey;
            return isuser ? true : false;
        }
    });

    function getCryptPassword(password, account) {
        var text = password + account;
        var salt = createHash('sha256').update(text).digest('hex');
        var pwdhex = createHash('sha256').update(salt).digest('hex');
        return pwdhex;
    }

    function addToDB(account, publickey, cipher_context, callback) {
        var user = {
            "account": account,
            "public_key": publickey,
            "cipher": cipher_context
        };

        accounts.update(user, function (err) {
            if (err) {
                return streembit.notify.error("Database update error %j", err);
            }

            logger.debug("Account was added to database");

            if (callback) {
                callback();
            }
        });
    }

    usrobj.create_account = function (account, password, callback) {
        try {

            if (!account || !password)
                throw new Error("create_account invalid parameters");

            var symcrypt_key = getCryptPassword(password, account);

            // get an entropy for the ECC key
            var rndstr = secrand.randomBuffer(32).toString("hex");
            var entropy = createHash("sha256").update(rndstr).digest("hex");

            // create ECC key
            var key = new ecckey();
            key.generateKey(entropy);

            //  encrypt this
            var skrnd = secrand.randomBuffer(32).toString("hex");
            var skhash = createHash("sha256").update(skrnd).digest("hex");
            var user_context = {
                "privatekey": key.privateKeyHex,
                "connsymmkey": skhash,
                "timestamp": Date.now()
            };

            var cipher_context = peermsg.aes256encrypt(symcrypt_key, JSON.stringify(user_context));

            var publicKey = key.publicKeyHex;

            addToDB(account, publicKey, cipher_context, function () {
                usrobj.crypto_key = key;
                usrobj.name = account;

                appsrvc.username = account;
                appsrvc.userecckey = key;
                appsrvc.connsymmkey = user_context.connsymmkey

                streembit.ui.set_account_title(account);

                callback();
            });
        }
        catch (err) {
            logger.error("create_account error %j", err);
            callback(err);
        }
    };

    usrobj.initialize = function (user, password) {
        try {
            if (!user || !password) {
                streembit.notify.error("Invalid parameters, the account and passwords are required");
                return false;
            }

            var account_name = user.account;
            if (!account_name) {
                streembit.notify.error("Invalid account name");
                return false;
            }

            var pbkdf2 = getCryptPassword(password, account_name);

            // decrypt the cipher
            var plain_text;
            try {
                plain_text = peermsg.aes256decrypt(pbkdf2, user.cipher);
            }
            catch (err) {
                if (err.message && err.message.indexOf("decrypt") > -1) {
                    streembit.notify.error("Account initialize error, most likely an incorrect password was entered");
                }
                else {
                    streembit.notify.error("Account initialize error: %j", err);
                }
                return false;
            }

            var userobj;
            try {
                userobj = JSON.parse(plain_text);
                if (!userobj || !userobj.privatekey || !userobj.timestamp || !userobj.connsymmkey) {
                    throw new Error("invalid password or invalid user object stored");
                }
            }
            catch (e) {
                streembit.notify.error("Account initialize error. Select a saved account and enter the valid password. The encrypted account information must exists on the computer.");
                return false;
            }

            var hexPrivatekey = userobj.privatekey;

            // create ECC key
            var key = new ecckey();
            key.keyFromPrivate(hexPrivatekey, 'hex');

            if (key.publicKeyHex != user.public_key) {
                streembit.notify.error("Error in initializing the account, most likely an incorrect password");
                return false;
            }

            usrobj.crypto_key = key;
            usrobj.name = account_name;

            appsrvc.username = account_name;
            appsrvc.connsymmkey = userobj.connsymmkey;
            appsrvc.userecckey = key;

            streembit.ui.set_account_title(account_name);

            // the account exists and the encrypted entropy is correct!
            return true;
        }
        catch (err) {
            streembit.notify.error("Account initialize error. Select a saved account and enter the valid password.");
            return false;
        }
    };

    usrobj.restore = function (password, user, callback) {
        try {
            if (!user || !user.account) {
                throw new Error("invalid user data");
            }

            var account = user.account;

            var pbkdf2 = getCryptPassword(password, account);

            // decrypt the cipher
            var plain_text;
            try {
                plain_text = peermsg.aes256decrypt(pbkdf2, user.cipher);
            }
            catch (err) {
                if (err.message && err.message.indexOf("decrypt") > -1) {
                    streembit.notify.error("Account initialize error, most likely an incorrect password was entered");
                }
                else {
                    streembit.notify.error("Account initialize error: %j", err);
                }
                return false;
            }

            var userobj;
            try {
                userobj = JSON.parse(plain_text);
                if (!userobj || !userobj.privatekey || !userobj.timestamp) {
                    throw new Error("invalid password");
                }
            }
            catch (e) {
                streembit.notify.error("Account initialize error. Select a saved account and enter the valid password.");
                return false;
            }

            var hexPrivatekey = userobj.privatekey;

            // create ECC key
            var key = new ecckey();
            key.keyFromPrivate(hexPrivatekey, 'hex');
            if (key.publicKeyHex != user.public_key) {
                streembit.notify.error("Error in restoring the account, incorrect password or invalid backup data");
                return false;
            }
            
            if (!userobj.connsymmkey) {
                streembit.notify.error("Error in restoring the account, incorrect connection key in backup data");
                return false;
            }

            //  encrypt this
            var user_context = {
                "privatekey": key.privateKeyHex,
                "connsymmkey": userobj.connsymmkey,
                "timestamp": Date.now()
            };

            var cipher_context = peermsg.aes256encrypt(pbkdf2, JSON.stringify(user_context));

            var publicKey = key.publicKeyHex;

            addToDB(account, publicKey, cipher_context, function () {
                usrobj.crypto_key = key;
                usrobj.name = account;

                appsrvc.username = account;
                appsrvc.userecckey = key;
                appsrvc.connsymmkey = userobj.connsymmkey;

                streembit.ui.set_account_title(account);
                streembit.notify.success("The account has been restored and initialized. You can connect to the Streembit network");

                if (callback) {
                    callback();
                }
            });
        }
        catch (e) {
            streembit.notify.error("Account restore error: %j", e);
        }
    };

    usrobj.change_password = function (user, password, callback) {
        try {
            if (!user || !password) {
                streembit.notify.error("Invalid parameters, the account and passwords are required");
                return false;
            }

            var account = user.account;
            if (!account) {
                streembit.notify.error("Invalid account name");
                return false;
            }

            if (usrobj.name != account) {
                streembit.notify.error("Account " + account + " is not initialized");
                return false;
            }

            var publicKey = appsrvc.publickeyhex;
            if (publicKey != user.public_key) {
                streembit.notify.error("Account " + account + " is not initialized");
                return false;
            }

            if (!appsrvc.privateKeyHex || !appsrvc.connsymmkey) {
                streembit.notify.error("the existing crypto key is invalid");
                return false;
            }

            var symcrypt_key = getCryptPassword(password, account);
            var user_context = {
                "privatekey": appsrvc.privateKeyHex,
                "connsymmkey": appsrvc.connsymmkey,
                "timestamp": Date.now()
            };

            var cipher_context = peermsg.aes256encrypt(symcrypt_key, JSON.stringify(user_context));
            addToDB(account, user.public_key, cipher_context, function () {
                callback();
            });
        }
        catch (err) {
            callback(err);
        }
    };

    usrobj.clear = function () {
        usrobj.crypto_key = null;
        usrobj.name = null;
    }

    module.exports = usrobj;

}());

