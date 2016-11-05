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

var database = require("database");
var config = require("appconfig");

(function () {
    
    var settings_data;

    var settings = {

        getdata: function (callback) {
            database.get(database.SETTINGSDB, "settings").then(
                function (result) {
                    var val = (result && result.data) ? result.data: config.appconfig
                    callback(null, val);
                    // update the database if there is no data in it
                    if (!result || !result.data) {
                        settings.update(config.appconfig, function () { });
                    }
                },
                function (err) {
                    callback(err);
                }
            );  
        },

        load: function () {
            return new Promise(function (resolve, reject) {
                settings.getdata(function (err, result) {
                    if (err) {
                        reject(err);
                    }
                    else {
                        settings_data = result;          
                        resolve();
                    }
                });
            });            
        },

        update: function (data, callback) {
            try {
                if (!data) {
                    return callback("invalid settings, the data parameter must exist.");
                }

                var field = {
                    key: "settings",
                    data: data
                };

                database.update(database.SETTINGSDB, field).then(
                    function () {
                        settings_data = data;
                        callback(null);
                    },
                    function (err) {
                        callback(err);
                    }
                );
            }
            catch (err) {
                callback(err);
            }
        }
    };

    Object.defineProperty(settings, 'iceservers', {
        get: function () {
            return settings_data.ice_resolvers;
        }
    })

    Object.defineProperty(settings, 'transport', {
        get: function () {
            return settings_data.transport;
        }
    })

    Object.defineProperty(settings, 'wsfallback', {
        get: function () {
            return settings_data.wsfallback;
        },
        set: function (value) {
            settings_data.wsfallback = value;
        }
    })

    module.exports = settings;

})();