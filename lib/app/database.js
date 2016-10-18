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

import logger from './logger';
import events from 'events';

//var EventEmitter = require('events').EventEmitter;


var streembitdb = (function () {

    const DB_VERSION = 3;
    const DB_NAME = 'streembitdb';

    var database = {}, db = {};

    var EventEmitter = events.EventEmitter;

    database.ACCOUNTSDB = 'accountsdb';
    database.CONTACTSDB = 'contactsdb';
    database.MAINDB = 'streembitdb';
    database.SETTINGSDB = 'settingsdb';
    database.BLOCKCHAINDB = 'blockchaindb';

    database.is_initialized = false;

    function get_objectstore(store_name, mode) {
        if (!mode) {
            mode = "readwrite";
        }
        var tx = db.transaction(store_name, mode);
        return tx.objectStore(store_name);
    }

    function validate_objectstore(store_name) {
        var store, err;
        try {
            store = get_objectstore(store_name);
        }
        catch (e) {
            err = e;
        }

        try {
            if (!store) {
                switch (store_name) {
                    case database.BLOCKCHAINDB:
                        db.createObjectStore(database.BLOCKCHAINDB, { keyPath: 'key' });
                        break;
                    default:
                        throw new Error("failed to create object store " + database.BLOCKCHAINDB);
                }
            }
        }
        catch (cerr) {
            throw new Error("error in creating object store " + database.BLOCKCHAINDB + ": " + cerr.message);
        }

        return store;
    }

    function create_objectstores() {
        console.log("DB create_objectstores");

        try {
            db.createObjectStore(database.ACCOUNTSDB, { keyPath: 'account' });
        }
        catch (err) {
            console.log("createObjectStore " + database.ACCOUNTSDB + " error: " + err.message);
        }

        try {
            db.createObjectStore(database.CONTACTSDB, { keyPath: 'account' });
        }
        catch (err) {
            console.log("createObjectStore " + database.CONTACTSDB + " error: " + err.message);
        }

        try {
            db.createObjectStore(database.MAINDB, { keyPath: 'key' });
        }
        catch (err) {
            console.log("createObjectStore " + database.MAINDB + " error: " + err.message);
        }

        try {
            db.createObjectStore(database.SETTINGSDB, { keyPath: 'key' });
        }
        catch (err) {
            console.log("createObjectStore " + database.SETTINGSDB + " error: " + err.message);
        }

        try {
            db.createObjectStore(database.BLOCKCHAINDB, { keyPath: 'key' });
        }
        catch (err) {
            console.log("createObjectStore " + database.BLOCKCHAINDB + " error: " + err.message);
        }
    }

    database.update = function (dbstore, data) {
        return new Promise(function (resolve, reject) {
            var objectStore = get_objectstore(dbstore);
            var updateRequest = objectStore.put(data);

            updateRequest.onerror = function (error) {
                reject(error);
            };

            updateRequest.onsuccess = function (event) {
                resolve();
            };
        });
    }

    // this is for the streembitdb store
    database.del = function (dbstore, key) {
        return new Promise(function (resolve, reject) {
            var objectStore = get_objectstore(dbstore);
            var deleteRequest = objectStore.delete(key);

            deleteRequest.onerror = function (error) {
                reject(error);
            };

            deleteRequest.onsuccess = function (event) {
                resolve();
            };
        });
    }

    database.get = function (dbstore, key) {
        return new Promise(function (resolve, reject) {
            var objectStore = get_objectstore(dbstore);
            var getRequest = objectStore.get(key);

            getRequest.onerror = function (error) {
                reject(error);
            };

            getRequest.onsuccess = function (evt) {
                var value = evt.target.result;
                resolve(value);
            };
        });
    }

    database.object_store = function (dbstore) {
        var objectStore = get_objectstore(dbstore);
        return objectStore;
    }

    database.getall = function (dbstore, callback) {
        var result = [];
        var objectStore = get_objectstore(dbstore);
        var request = objectStore.openCursor();
        request.onsuccess = function (event) {
            var cursor = event.target.result;
            if (cursor && cursor.value) {
                // cursor.value contains the current record being iterated through
                result.push(cursor.value);
                try {
                    cursor.continue();
                }
                catch (e) {
                    // it seems the continue() always fails, this is a bug in webkit
                    callback(null, result);
                }
            }
            else {
                // no more results
                callback(null, result);
            }
        };

        request.onerror = function (error) {
            callback(error);
        };
    }

    database.init = function () {
        return new Promise(function (resolve, reject) {

            logger.debug("DB init");

            var request = window.indexedDB.open(DB_NAME, DB_VERSION);

            request.onerror = function (error) {
                console.log("DB init onerror: %j", error);
                reject(error);
            };

            request.onsuccess = function (event) {
                try {
                    console.log("DB init onsuccess");
                    db = event.target.result;

                    database.is_initialized = true;
                    resolve();
                }
                catch (err) {
                    reject(err);
                }
            };

            request.onupgradeneeded = function (event) {
                try {
                    console.log("DB init onupgradeneeded, upgrading the database");

                    db = event.target.result;

                    db.onerror = function (event) {
                        reject('Error in upgrading the database');
                    };

                    create_objectstores();

                    //validate_objectstore(DB_BLOCKCHAIN_STORE_NAME);

                }
                catch (err) {
                    console.log("onupgradeneeded error: %j", err);
                    reject(err);
                }
            };
        });
    }

    database.clear = function () {
        return new Promise(function (resolve, reject) {
            var DBDeleteRequest = window.indexedDB.deleteDatabase(DB_NAME);
            DBDeleteRequest.onerror = function (event) {
                reject("Error deleting database.");
            };
            DBDeleteRequest.onsuccess = function (event) {
                resolve();
                console.log("deleteDatabase complete");
            };
        });
    }

    // MainDB
    database.MainDB = {};

    database.MainDB.get = function (key, cb) {
        db.get(database.MAINDB, key).then(
            function (data) {
                try {
                    if (data && data.key && data.key == key) {
                        cb(null, JSON.stringify(data));
                    }
                    else {
                        cb("Couldn't find data for the key");
                    }
                }
                catch (err) {
                    return cb(err);
                }
            },
            function (err) {
                logger.error("IndexedDbStorage get error %j", err);
                cb(err);
            }
        );
    }

    // the node object sends a JSON stringified message
    database.MainDB.put = function (key, datastr, cb) {
        var data = JSON.parse(datastr);
        if (!data || !data.key || key != data.key) {
            throw new Error("Invalid data, key must exists in the data object");
        }

        // must insert into the IndexedDb a javascript object that is having a "key" field
        db.update(database.MAINDB, data).then(
            function () {
                cb(null, data)
            },
            function (err) {
                logger.error("IndexedDbStorage put error %j", err);
                cb(err);
            }
        );
    }

    database.MainDB.del = function (key, cb) {
        db.del(database.MAINDB, key).then(
            function () {
                cb(null)
            },
            function (err) {
                logger.error("IndexedDbStorage del error %j", err);
                cb(err);
            }
        );
    }

    database.MainDB.createReadStream = function () {
        var stream = new EventEmitter()
        setTimeout(function () {
            var objectStore = db.object_store(database.MAINDB);
            var request = objectStore.openCursor();
            request.onsuccess = function (event) {
                var cursor = event.target.result;
                if (cursor && cursor.value) {
                    // cursor.value contains the current record being iterated through
                    var val = JSON.stringify(cursor.value);
                    stream.emit('data', { key: cursor.value.key, value: val })
                    try {
                        cursor.continue();
                    }
                    catch (e) {
                        // it seems the continue() always fails, this is a bug in webkit
                        stream.emit('error', error);
                    }
                }
                else {
                    // no more results
                    stream.emit('end');
                }
            };

            request.onerror = function (error) {
                stream.emit('error', error);
            };
        });

        return stream;
    }

    // AccountsDB
    database.AccountsDB = {};

    database.AccountsDB.get = function (key, cb) {
        db.get(database.ACCOUNTSDB, key).then(
            function (value) {
                cb(null, value);
            },
            function (err) {
                logger.error("ACCOUNTSDB get error %j", err);
                cb(err);
            }
        );
    }

    database.AccountsDB.put = function (data, cb) {
        db.update(database.ACCOUNTSDB, data).then(
            function () {
                cb(null);
            },
            function (err) {
                logger.error("ACCOUNTSDB put error %j", err);
                cb(err);
            }
        );
    }

    //  ContactsDB
    database.ContactsDB = {};

    database.ContactsDB.get_contacts = function (account, cb) {
        if (!account) {
            return cb("invalid account parameter");
        }

        db.get(database.CONTACTSDB, account).then(
            function (value) {
                var contacts;
                if (!value || !value.contacts) {
                    contacts = [];
                }
                else {
                    contacts = value.contacts;
                }

                cb(null, contacts);
            },
            function (err) {
                logger.error("CONTACTSDB get error %j", err);
                cb(err);
            }
        );
    }

    database.ContactsDB.update_contact = function (account, contact) {
        return new Promise(function (resolve, reject) {
            if (!account) {
                return reject("invalid account parameter");
            }
            if (!contact) {
                return reject("invalid contact parameter");
            }

            database.ContactsDB.get_contacts(account, function (err, contacts) {
                if (err) {
                    return reject(err);
                }

                var data = { account: account, contacts: [] };

                if (contacts && contacts.length > 0) {
                    var isupdated = false;
                    for (var i = 0; i < contacts.length; i++) {
                        if (contacts[i].name == contact.name) {
                            data.contacts.push(contact);
                            isupdated = true;
                        }
                        else {
                            data.contacts.push(contacts[i]);
                        }
                    }

                    if (!isupdated) {
                        data.contacts.push(contact);
                    }
                }
                else {
                    //  the database was empty
                    data.contacts.push(contact);
                }

                db.update(database.CONTACTSDB, data).then(
                    function () {
                        resolve(null);
                    },
                    function (perr) {
                        logger.error("CONTACTSDB put error %j", perr);
                        reject(perr);
                    }
                );
            });
        });
    }

    database.ContactsDB.delete_contact = function (account, name, cb) {
        if (!account) {
            return cb("invalid account parameter");
        }
        if (!name) {
            return cb("invalid name parameter");
        }

        database.ContactsDB.get_contacts(account, function (err, contacts) {
            if (err) {
                return cb(err);
            }

            var data = { account: account, contacts: [] };

            if (contacts && contacts.length > 0) {
                var pos = contacts.map(function (e) { return e.name; }).indexOf(name);
                contacts.splice(pos, 1);
                data.contacts = contacts;
            }

            db.update(database.CONTACTSDB, data).then(
                function () {
                    cb(null);
                },
                function (perr) {
                    logger.error("CONTACTSDB put error %j", perr);
                    cb(perr);
                }
            );
        });
    }

    return database;

})();

export default streembitdb;


