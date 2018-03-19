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

const database = require("database");
const config = require("appconfig");
const logger = require("logger");
const errcodes = require("errcodes");
const errhandler = require("errhandler");

(function () {

    var settings_data;

    var settings = {

        getwspeers: function () {
            try {

                function errhandler(errmsg, url) {
                    streembit.notify.error(errmsg + " URL: " + url, null, true);
                }

                logger.info("Populating WS peer list from Github repository");
                var url = settings_data.wspeerlisturl;
                $.ajax({
                    url: url,
                    type: 'GET',
                    success: function (res) {
                        try {
                            var seedlist = JSON.parse(res);
                            if (!seedlist || !Array.isArray(seedlist) || !seedlist.length) {
                                // throw new Error("invalid seed list")
                                throw new Error(errhandler.getmsg(errcodes.UI_INVALID_SEED_LIST))
                            }

                            // receieved an array, use this instead of the the existing array from the database
                            var data = settings_data;
                            data.bootseeds = seedlist;
                            settings.update(data, function () { });
                        }
                        catch (err) {
                            // errhandler( "Error in populating WS peer list, + " + err.message, url);
                            errhandler(errhandler.getmsg(errcodes.WS_POPULATING_PEER_LIST) + err.message, url);
                        }
                    },
                    error: function () {
                        // errhandler("Error in populating WS peer list from Github repository", url);
                        errhandler(errhandler.getmsg(errcodes.WS_POPULATING_PEER_LIST_FROM_GITREPO, url));
                    }
                });
            }
            catch (err) {
                logger.error("Error in populating WS peer list from Github repository " + err.message);
            }
        },

        getdata: function (callback) {
            database.get(database.SETTINGSDB, "settings").then(
                function (result) {
                    var val = (result && result.data) ? result.data : config.appconfig;
                    val.tcpport = val.tcpport || config.appconfig.tcpport;
                    val.isaccountexists = val.isaccountexists || false;

                    // TODO !!! remove this once all developers have run this module and the database is updated
                    // enforce a few settings here to support the new version
                    // enforce the WS transport
                    var needsave = false;
                    val.transport = "ws";
                    if (val.bootseeds && Array.isArray(val.bootseeds)) {
                        val.bootseeds.forEach(
                            (item) => {
                                if (!item.host && item.address) {
                                    item.host = item.address;
                                    delete item.address;
                                    needsave = true;
                                }
                            }
                        );
                    }

                    if (val.hasOwnProperty("askwsfallback")) {
                        delete val.askwsfallback;
                        needsave = true;
                    }
                    if (val.hasOwnProperty("askwspublish")) {
                        delete val.askwspublish;
                        needsave = true;
                    }
                    if (val.hasOwnProperty("wsfallback")) {
                        delete val.wsfallback;
                        needsave = true;
                    }
                    if (val.hasOwnProperty("wspublish")) {
                        delete val.wspublish;
                        needsave = true;
                    }
                    if (val.hasOwnProperty("private_net_seed")) {
                        delete val.private_net_seed;
                        needsave = true;
                    }

                    if (!val.wspeerlisturl) {
                        val.wspeerlisturl = config.appconfig.wspeerlisturl;
                    }

                    if (needsave) {
                        settings.update(val, function () { });
                    }

                    // END TODO !!!

                    callback(null, val);
                    // update the database if there is no data in it
                    if (!result || !result.data) {
                        settings.update(val, function () { });
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

                        // get the WS from the streembit repo
                        settings.getwspeers();

                        // don't wait for the network operation
                        resolve();
                    }
                });
            });
        },

        update: function (data, callback) {
            try {
                if (!data) {
                    // return callback("invalid settings, the data parameter must exist.");
                    return callback(errhandler.getmsg(errcodes.UI_INVALID_SETTINGS_DATA_PARAMS_MUST_EXIST));
                }

                var field = {
                    key: "settings",
                    data: data
                };

                database.update(database.SETTINGSDB, field).then(
                    function () {
                        settings_data = data;
                        callback(null, settings_data);
                    },
                    function (err) {
                        callback(err);
                    }
                );
            }
            catch (err) {
                callback(err);
            }
        },

        update_accountexists: function (value, callback) {
            settings_data.isaccountexists = value;
            settings.update(settings_data, function (err) {
                callback(err);
            });
        },

        refresh_accountexists: function (exists) {
            try {
                settings_data.isaccountexists = exists;
                return new Promise(function (resolve, reject) {
                    settings.update(settings_data,function (err) {
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

    Object.defineProperty(settings, 'tcpport', {
        get: function () {
            return settings_data.tcpport;
        }
    });

    Object.defineProperty(settings, 'bootseeds', {
        get: function () {
            return settings_data.bootseeds;
        }
    });

    Object.defineProperty(settings, 'lastseed', {
        get: function () {
            return settings_data.lastseed;
        },
        set: function (value) {
            settings_data.lastseed = value;
            settings.update(settings_data, function () { });
        }
    });

    Object.defineProperty(settings, 'loglevel', {
        get: function () {
            return settings_data.loglevel;
        }
    })

    Object.defineProperty(settings, 'isaccountexists', {
        get: function () {
            return settings_data.isaccountexists;
        }
    });

    Object.defineProperty(settings, 'wspeerlisturl', {
        get: function () {
            return settings_data.wspeerlisturl || config.appconfig.remote_seed_url;
        }
    });

    module.exports = settings;

})();