/*

This file is part of Streemio application. 
Streemio is an open source project to create a real time communication system for humans and machines. 

Streemio is a free software: you can redistribute it and/or modify it under the terms of the GNU General Public License 
as published by the Free Software Foundation, either version 3.0 of the License, or (at your option) any later version.

Streemio is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty 
of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU General Public License for more details.

You should have received a copy of the GNU General Public License along with Streemio software.  
If not, see http://www.gnu.org/licenses/.
 
-------------------------------------------------------------------------------------------------------------------------
Author: Tibor Zsolt Pardi 
Copyright (C) 2016 The Streemio software development team
-------------------------------------------------------------------------------------------------------------------------

*/

'use strict';

var streemio = streemio || {};

const DB_VERSION = 1;

const DB_NAME = 'streemio-database';

const DB_ACCOUNTS_STORE_NAME = 'accounts';
const DB_CONTACTS_STORE_NAME = 'contacts';
const DB_STREEMIO_STORE_NAME = 'streemiodb';
const DB_SETTINGS_STORE_NAME = 'settingsdb';

streemio.DB = (function (module, logger, events){
    
    var db = {};
    
    module.is_initialized = false;
    
    function getObjectStore(store_name, mode) {
        if (!mode) {
            mode = "readwrite";
        }
        var tx = db.transaction(store_name, mode);
        return tx.objectStore(store_name);
    }
    
    function create_objectstores() {
        logger.debug("DB create_objectstores");

        var accounts_store = db.createObjectStore(DB_ACCOUNTS_STORE_NAME, { keyPath: 'account' });
        var contacts_store = db.createObjectStore(DB_CONTACTS_STORE_NAME, { keyPath: 'name' });
        var streemio_store = db.createObjectStore(DB_STREEMIO_STORE_NAME, { keyPath: 'key' });
        var settings_store = db.createObjectStore(DB_SETTINGS_STORE_NAME, { keyPath: 'key' });
    }
    
    module.update = function (dbstore, data) {
        return new Promise(function (resolve, reject) {
            var objectStore = getObjectStore(dbstore);
            var updateRequest = objectStore.put(data);

            updateRequest.onerror = function (error) {
                reject(error);
            };
            
            updateRequest.onsuccess = function (event) {
                resolve();
            };            
        });
    }
    

    // this is kfor the streemiodb stoe
    module.del = function (dbstore, key) {
        return new Promise(function (resolve, reject) {
            var objectStore = getObjectStore(dbstore);
            var deleteRequest = objectStore.delete(key);
            
            deleteRequest.onerror = function (error) {
                reject(error);
            };
            
            deleteRequest.onsuccess = function (event) {
                resolve();
            };
        });
    }
    
    module.get = function (dbstore, key ) {
        return new Promise(function (resolve, reject) {
            var objectStore = getObjectStore(dbstore);
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
        var objectStore = getObjectStore(dbstore);
        return objectStore;
    }
    
    module.getall = function (dbstore, callback) {        
        var result = [];
        var objectStore = getObjectStore(dbstore);
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
                reject(error);
            };
            
            request.onsuccess = function (event) {
                db = event.target.result;
                module.is_initialized = true;
                resolve();
            };
            
            request.onupgradeneeded = function (event) {                
                db = event.target.result;
                create_objectstores();
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
            };  
        });        
    }
    
    module.ACCOUNTSDB = DB_ACCOUNTS_STORE_NAME;
    module.CONTACTDB = DB_CONTACTS_STORE_NAME;
    module.MAINDB = DB_STREEMIO_STORE_NAME;
    module.SETTINGSDB = DB_SETTINGS_STORE_NAME;

    return module;

}(streemio.DB || {}, streemio.logger, global.appevents));

streemio.MainDB = (function (module, db, logger) {
    
    var EventEmitter = require('events').EventEmitter;
    
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
                logger.error("IndexedDbStorage get error %j", err);
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
                logger.error("IndexedDbStorage put error %j", err);
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
                logger.error("IndexedDbStorage del error %j", err);
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

}(streemio.MainDB || {}, streemio.DB, streemio.logger));

streemio.AccountsDB = (function (module, db, logger) {
    
    module.get = function (key, cb) {
        db.get(db.ACCOUNTSDB, key).then(
            function (value) {
                cb(null, value);
            },
            function (err) {
                logger.error("APPDB get error %j", err);
                cb(err);
            }
        );
    }
    
    module.put = function ( data, cb) {
        db.update(db.ACCOUNTSDB, data).then(
            function () {
                cb(null);
            },
            function (err) {
                logger.error("APPDB put error %j", err);
                cb(err);
            }
        );
    }
    
    return module;

}(streemio.AccountsDB || {}, streemio.DB, streemio.logger));

