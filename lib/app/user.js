
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

var ecckey = require('./libs/index').crypto;
var secrand = require('secure-random');
var createHash = require('create-hash');
var logger = require('./logger');
var slib = require("./libs/index");
var database = require('./database');
var events = require("./libs/events/AppEvents");

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

        database.AccountsDB.put(user, function (err) {
            if (err) {
                return streembit.notify.error("Database update error %j", err);
            }

            logger.debug("database user updated");

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

            var cipher_context = slib.message.aes256encrypt(symcrypt_key, JSON.stringify(user_context));

            var publicKey = key.publicKeyHex;
            console.log(publicKey);

            addToDB(account, publicKey, cipher_context, function () {
                usrobj.crypto_key = key;
                usrobj.name = account;

                events.emit(events.APPEVENT, events.TYPES.ONUSERINIT);

                streembit.UI.set_account_title(account);

                callback();
            });
        }
        catch (err) {
            logger.error("create_account error %j", err);
            callback(err);
        }
    };

    usrobj.create_anonym_account = function () {
        try {

            var password = secrand.randomBuffer(32).toString("hex");
            var account = nodecrypto.createHash('sha1').update(password).digest().toString('hex');

            // create ECC key
            var key = new EccKey(password);

            // create a ECDH key
            var ecdh_key = nodecrypto.createECDH('secp256k1');
            ecdh_key.generateKeys();

            //  encrypt this
            var ecdhkeyarr = [];
            ecdhkeyarr.push({
                ecdh_private_key: ecdh_key.getPrivateKey('hex'),
                ecdh_public_key: ecdh_key.getPublicKey('hex')
            });

            usrobj.crypto_key = key;
            usrobj.ecdh_key = ecdh_key;
            usrobj.name = account;
            usrobj.ecdhkeys = ecdhkeyarr;

        }
        catch (err) {
            logger.error("create_account error %j", err);
        }
    };

    usrobj.initialize = function (user, password, callback) {
        try {
            if (!user || !password) {
                return streembit.notify.error_popup("Invalid parameters, the account and passwords are required");
            }

            var account_name = user.account;
            if (!account_name) {
                return streembit.notify.error_popup("Invalid account name");
            }

            var pbkdf2 = getCryptPassword(password, account_name);

            // decrypt the cipher
            var plain_text;
            try {
                plain_text = streembit.Message.aes256decrypt(pbkdf2, user.cipher);
            }
            catch (err) {
                if (err.message && err.message.indexOf("bad decrypt") > -1) {
                    return streembit.notify.error_popup("User initialize error: incorrect password");
                }
                else {
                    return streembit.notify.error_popup("User initialize error: %j", err);
                }
            }

            var userobj = JSON.parse(plain_text);

            var entropy = userobj.pk_entropy;

            // create ECC key
            var key = new EccKey(entropy);

            if (key.publicKeyHex != user.public_key) {
                return streembit.notify.error_popup("Error in initializing the account, invalid password");
            }

            // the account exists and the encrypted entropy is correct!

            if (!userobj.ecdhkeys) {
                userobj.ecdhkeys = [];
            }

            var ecdh_key = nodecrypto.createECDH('secp256k1');

            if (userobj.ecdhkeys.length == 0) {
                // create a ECDH key
                ecdh_key.generateKeys();

                userobj.timestamp = Date.now();
                userobj.ecdhkeys.push({
                    ecdh_private_key: ecdh_key.getPrivateKey('hex'),
                    ecdh_public_key: ecdh_key.getPublicKey('hex')
                });
            }
            else {
                try {
                    var ecdhprivate = userobj.ecdhkeys[0].ecdh_private_key;
                    ecdh_key.setPrivateKey(ecdhprivate, 'hex');
                }
                catch (e) {
                    userobj.ecdhkeys = [];
                    ecdh_key.generateKeys();
                    userobj.timestamp = Date.now();
                    userobj.ecdhkeys.push({
                        ecdh_private_key: ecdh_key.getPrivateKey('hex'),
                        ecdh_public_key: ecdh_key.getPublicKey('hex')
                    });
                    streembit.notify.error("ECDH exception occured when setting private key. New ECDH array is created");
                }
            }

            var cipher_context = streembit.Message.aes256encrypt(pbkdf2, JSON.stringify(userobj));

            addToDB(account_name, key.publicKeyHex, cipher_context, function () {

                usrobj.crypto_key = key;
                usrobj.ecdh_key = ecdh_key;
                usrobj.name = account_name;
                usrobj.ecdhkeys = userobj.ecdhkeys;

                events.emit(events.APPEVENT, events.TYPES.ONUSERINIT);

                streembit.UI.set_account_title(account_name);

                callback();
            });
        }
        catch (err) {
            streembit.notify.error_popup("User initialize error: %j", err);
        }
    };

    usrobj.backup = function () {
        try {
            if (!usrobj.name) {
                throw new Error("the account is not initialized");
            }

            streembit.AccountsDB.get(usrobj.name, function (err, user) {
                if (err) {
                    throw new Error(err);
                }
                if (!user) {
                    throw new Error("The account does not exists");
                }

                streembit.Fdialog.initialize({
                    type: 'save',
                    accept: ['streembit.dat'],
                    path: '~/Documents',
                    defaultSavePath: 'streembit.dat'
                });

                var objext = JSON.stringify(user);
                var encoded = window.btoa(objext);

                var text = "---BEGIN STREEMBIT KEY---\n";
                text += encoded;
                text += "\n---END STREEMBIT KEY---";

                var file_name = "streembit_" + usrobj.name + ".dat";
                streembit.Fdialog.saveTextFile(text, file_name, function () {
                    logger.debug("File saved in", path);
                });

            });
        }
        catch (err) {
            streembit.notify.error_popup("Account backup error: %j", err);
        }
    };

    usrobj.restore = function () {
        try {
            var user = null;
            var account = null;

            streembit.Fdialog.initialize({
                type: 'open',
                accept: ['.dat'],
                path: '~/Documents'
            });

            streembit.Fdialog.readTextFile(function (err, buffer, path) {
                var text = null;
                try {
                    if (!buffer) {
                        throw new Error("invalid key backup buffer");
                    }

                    var data = buffer.toString();
                    var find1 = "---BEGIN STREEMBIT KEY---\n";
                    var pos1 = data.indexOf(find1);
                    if (pos1 == -1) {
                        throw new Error("invalid key backup data");
                    }
                    var pos2 = data.indexOf("\n---END STREEMBIT KEY---");
                    if (pos2 == -1) {
                        throw new Error("invalid key backup data");
                    }

                    var start = find1.length;
                    var decoded = data.substring(start, pos2);
                    text = window.atob(decoded);
                }
                catch (e) {
                    return streembit.notify.error_popup("Invalid key backup data. Error: %j", e);
                }

                if (!text) {
                    return streembit.notify.error_popup("Invalid key backup data");
                }

                user = JSON.parse(text);
                account = user.account;

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
                            label: "Login",
                            className: 'btn-default',
                            callback: function () {
                                try {
                                    var result = $('#privkeypwd').val();
                                    if (result === null) {
                                        return bootbox.alert("Enter the private key password!");
                                    }

                                    var pbkdf2 = getCryptPassword(result, account);

                                    // decrypt the cipher
                                    var plain_text = streembit.Message.aes256decrypt(pbkdf2, user.cipher);
                                    var userobj = JSON.parse(plain_text);

                                    var entropy = userobj.pk_entropy;

                                    // create ECC key
                                    var key = new EccKey(entropy);

                                    if (key.publicKeyHex != user.public_key) {
                                        return bootbox.alert("Error in initializing the account, invalid password");
                                    }

                                    // the account exists and the encrypted entropy is correct!

                                    // create a ECDH key
                                    var ecdh_key = nodecrypto.createECDH('secp256k1');
                                    ecdh_key.generateKeys();

                                    userobj.timestamp = Date.now();
                                    userobj.ecdhkeys.push({
                                        ecdh_private_key: ecdh_key.getPrivateKey('hex'),
                                        ecdh_public_key: ecdh_key.getPublicKey('hex')
                                    });

                                    if (userobj.ecdhkeys.length > 5) {
                                        userobj.ecdhkeys.shift();
                                        if (userobj.ecdhkeys.length > 5) {
                                            var removecount = userobj.ecdhkeys.length - 5;
                                            userobj.ecdhkeys.splice(0, removecount);
                                        }
                                    }

                                    var cipher_context = streembit.Message.aes256encrypt(pbkdf2, JSON.stringify(userobj));

                                    addToDB(account, key.publicKeyHex, cipher_context, function (err) {

                                        usrobj.crypto_key = key;
                                        usrobj.ecdh_key = ecdh_key;
                                        usrobj.name = account;
                                        usrobj.ecdhkeys = userobj.ecdhkeys;

                                        events.emit(events.APPEVENT, events.TYPES.ONUSERINIT);

                                        streembit.UI.set_account_title(account);

                                        streembit.notify.success("The account has been initialized");

                                        streembit.UI.show_startscreen();

                                    });
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
            streembit.notify.error_popup("Account restore error: %j", e);
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
        usrobj.ecdh_key = null;
    }

    module.exports =  usrobj;

}());

