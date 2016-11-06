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
            var user_context = {
                "privatekey": key.privateKeyHex,
                "timestamp": Date.now()
            };

            var cipher_context = peermsg.aes256encrypt(symcrypt_key, JSON.stringify(user_context));

            var publicKey = key.publicKeyHex;

            addToDB(account, publicKey, cipher_context, function () {
                usrobj.crypto_key = key;
                usrobj.name = account;

                appsrvc.cryptokey = key.cryptoKey;
                appsrvc.username = account;
                appsrvc.privatekey = key.privateKey;
                appsrvc.publickey = key.publicKey;
                appsrvc.publickeyhex = key.publicKeyHex;

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
                streembit.notify.error("Error in initializing the account, most likely an incorrect password");
                return false;
            }

            usrobj.crypto_key = key;
            usrobj.name = account_name;

            appsrvc.cryptokey = key.cryptoKey;
            appsrvc.username = account_name;
            appsrvc.privatekey = key.privateKey;
            appsrvc.publickey = key.publicKey;
            appsrvc.publickeyhex = key.publicKeyHex;

            streembit.ui.set_account_title(account_name);

            // the account exists and the encrypted entropy is correct!
            return true;
        }
        catch (err) {
            streembit.notify.error("Account initialize error. Select a saved account and enter the valid password.");
            return false;
        }
    };

    usrobj.backup = function (callback) {
        try {
            debugger;

            if (!usrobj.name) {
                return callback("the account is not initialized");
            }

            
        }
        catch (err) {
            callback( err);
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
                streembit.notify.error("Error in restoring the account Incorrect password or invalid backup data");
                return false;
            }

            //  encrypt this
            var user_context = {
                "privatekey": key.privateKeyHex,
                "timestamp": Date.now()
            };

            var cipher_context = peermsg.aes256encrypt(pbkdf2, JSON.stringify(user_context));

            var publicKey = key.publicKeyHex;

            addToDB(account, publicKey, cipher_context, function () {
                usrobj.crypto_key = key;
                usrobj.name = account;

                appsrvc.cryptokey = key.cryptoKey;
                appsrvc.username = account;
                appsrvc.privatekey = key.privateKey;
                appsrvc.publickey = key.publicKey;
                appsrvc.publickeyhex = key.publicKeyHex;

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

    usrobj.update_public_key = function (new_key_password) {
        logger.debug("Publish update_public_key");

        try {
            if (!usrobj.is_user_initialized) {
                return streembit.notify.error("The user account has not been initialized. To change the passphrase you must be connected to the Streembit network.");
            }

            if (!new_key_password) {
                return streembit.notify.error("Invalid parameters, the passphrase is required");
            }

            var current_public_key = usrobj.public_key;
            if (!current_public_key) {
                return streembit.notify.error("The user account has not been initialized. To change the passphrase you must be connected to the Streembit network.");
            }

            var account = usrobj.name;
            if (!account) {
                return streembit.notify.error("The user account has not been initialized. To change the passphrase you must be connected to the Streembit network.");
            }

            var pbkdf2 = getCryptPassword(new_key_password, account);

            // get an entropy for the ECC key
            var entropy = secrand.randomBuffer(32).toString("hex");

            // create ECC key
            var key = new EccKey(entropy);
            var new_public_key = key.publicKeyHex;

            logger.debug("Updating public key on the network");
            streembit.PeerNet.update_public_key(new_public_key, function (err) {
                if (err) {
                    return streembit.notify.error_popup("Publish updated public key error %j", err);
                }

                //  encrypt this
                var user_context = {
                    "pk_entropy": entropy,
                    "timestamp": Date.now(),
                    "ecdhkeys": usrobj.ecdhkeys
                };

                var cipher_context = streembit.Message.aes256encrypt(pbkdf2, JSON.stringify(user_context));

                addToDB(account, new_public_key, cipher_context, function () {
                    usrobj.crypto_key = key;

                    streembit.notify.success("The public key has been updloaded to the network");
                    events.emit(events.TYPES.ONAPPNAVIGATE, streembit.DEFS.CMD_EMPTY_SCREEN);
                });
            });
        }
        catch (err) {
            streembit.notify.error("User initialize error: %j", err);
            callback(err);
        }
    }

    usrobj.clear = function () {
        usrobj.crypto_key = null;
        usrobj.name = null;
    }

    module.exports = usrobj;

}());

