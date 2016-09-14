'use strict';

define(['knockout', 'jquery'], function (ko, $) {

    const DB_VERSION = 3;

    const DB_NAME = 'streembitdb';

    const DB_ACCOUNTS_STORE_NAME = 'accountsdb';
    const DB_CONTACTS_STORE_NAME = 'contactsdb';
    const DB_STREEMBIT_STORE_NAME = 'streembitdb';
    const DB_SETTINGS_STORE_NAME = 'settingsdb';
    const DB_BLOCKCHAIN_STORE_NAME = 'blockchaindb';

    var module = {};
    var db = {};

    module.is_initialized = false;

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
                    case DB_BLOCKCHAIN_STORE_NAME:
                        db.createObjectStore(DB_BLOCKCHAIN_STORE_NAME, { keyPath: 'key' });
                        break;
                    default:
                        throw new Error("failed to create object store " + DB_BLOCKCHAIN_STORE_NAME);
                }
            }
        }
        catch (cerr) {
            throw new Error("error in creating object store " + DB_BLOCKCHAIN_STORE_NAME + ": " + cerr.message);
        }

        return store;
    }

    function create_objectstores() {
        console.log("DB create_objectstores");

        try {
            db.createObjectStore(DB_ACCOUNTS_STORE_NAME, { keyPath: 'account' });
        }
        catch (err) {
            console.log("createObjectStore " + DB_ACCOUNTS_STORE_NAME + " error: " + err.message);
        }

        try {
            db.createObjectStore(DB_CONTACTS_STORE_NAME, { keyPath: 'account' });
        }
        catch (err) {
            console.log("createObjectStore " + DB_CONTACTS_STORE_NAME + " error: " + err.message);
        }

        try {
            db.createObjectStore(DB_STREEMBIT_STORE_NAME, { keyPath: 'key' });
        }
        catch (err) {
            console.log("createObjectStore " + DB_STREEMBIT_STORE_NAME + " error: " + err.message);
        }

        try {
            db.createObjectStore(DB_SETTINGS_STORE_NAME, { keyPath: 'key' });
        }
        catch (err) {
            console.log("createObjectStore " + DB_SETTINGS_STORE_NAME + " error: " + err.message);
        }

        try {
            db.createObjectStore(DB_BLOCKCHAIN_STORE_NAME, { keyPath: 'key' });
        }
        catch (err) {
            console.log("createObjectStore " + DB_BLOCKCHAIN_STORE_NAME + " error: " + err.message);
        }
    }

    module.update = function (dbstore, data) {
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


    // this is kfor the streembitdb stoe
    module.del = function (dbstore, key) {
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

    module.get = function (dbstore, key) {
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

    module.object_store = function (dbstore) {
        var objectStore = get_objectstore(dbstore);
        return objectStore;
    }

    module.getall = function (dbstore, callback) {
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

    module.init = function () {
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

                    module.is_initialized = true;
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

    module.clear = function () {
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

    module.ACCOUNTSDB = DB_ACCOUNTS_STORE_NAME;
    module.CONTACTSDB = DB_CONTACTS_STORE_NAME;
    module.MAINDB = DB_STREEMBIT_STORE_NAME;
    module.SETTINGSDB = DB_SETTINGS_STORE_NAME;
    module.BLOCKCHAINDB = DB_BLOCKCHAIN_STORE_NAME;

    var mainDB = (function (module, db) {
        //debugger;
        var EventEmitter = require("events").EventEmitter;

        module.get = function (key, cb) {
            db.get(db.MAINDB, key).then(
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
                    cb(err);
                }
            );
        }

        // the node object sends a JSON stringified message
        module.put = function (key, datastr, cb) {
            var data = JSON.parse(datastr);
            if (!data || !data.key || key != data.key) {
                throw new Error("Invalid data, key must exists in the data object");
            }

            // must insert into the IndexedDb a javascript object that is having a "key" field
            db.update(db.MAINDB, data).then(
                function () {
                    cb(null, data)
                },
                function (err) {
                    cb(err);
                }
            );
        }

        module.del = function (key, cb) {
            db.del(db.MAINDB, key).then(
                function () {
                    cb(null)
                },
                function (err) {
                    cb(err);
                }
            );
        }

        module.createReadStream = function () {
            var stream = new EventEmitter()
            setTimeout(function () {
                var objectStore = db.object_store(db.MAINDB);
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

        return module;

    } ({}, db));

    module.MainDB = mainDB;

    var accountsDB = (function (module, db) {
        module.get = function (key, cb) {
            db.get(db.ACCOUNTSDB, key).then(
                function (value) {
                    cb(null, value);
                },
                function (err) {
                    cb(err);
                }
            );
        }

        module.put = function (data, cb) {
            db.update(db.ACCOUNTSDB, data).then(
                function () {
                    cb(null);
                },
                function (err) {
                    cb(err);
                }
            );
        }

        return module;

    } ({}, db));


    module.AccountsDB = accountsDB;

    var contactsDB = (function (module, db) {

        module.get_contacts = function (account, cb) {
            if (!account) {
                return cb("invalid account parameter");
            }

            db.get(db.CONTACTSDB, account).then(
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
                    cb(err);
                }
            );
        }

        module.update_contact = function (account, contact) {
            return new Promise(function (resolve, reject) {
                if (!account) {
                    return reject("invalid account parameter");
                }
                if (!contact) {
                    return reject("invalid contact parameter");
                }

                module.get_contacts(account, function (err, contacts) {
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

                    db.update(db.CONTACTSDB, data).then(
                        function () {
                            resolve(null);
                        },
                        function (perr) {
                            reject(perr);
                        }
                    );
                });
            });
        }

        module.delete_contact = function (account, name, cb) {
            if (!account) {
                return cb("invalid account parameter");
            }
            if (!name) {
                return cb("invalid name parameter");
            }

            module.get_contacts(account, function (err, contacts) {
                if (err) {
                    return cb(err);
                }

                var data = { account: account, contacts: [] };

                if (contacts && contacts.length > 0) {
                    var pos = contacts.map(function (e) { return e.name; }).indexOf(name);
                    contacts.splice(pos, 1);
                    data.contacts = contacts;
                }

                db.update(db.CONTACTSDB, data).then(
                    function () {
                        cb(null);
                    },
                    function (perr) {
                        cb(perr);
                    }
                );
            });
        }

        return module;

    } ({}, db));

    module.ContactsDB = contactsDB;

    console.log("return datasrvc");

    return module;
});


