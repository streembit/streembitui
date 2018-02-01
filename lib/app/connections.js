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
Author: Streembit team
Copyright (C) Streembit 2017
-------------------------------------------------------------------------------------------------------------------------
*/

// WebRTC and WebSocket connection manager

'use strict';

(function () {

    const appevents = require("appevents");
    const WebRTCData = require('webrtcdata');
    const peercomm = require('peercomm');
    const settings = require('settings');
    const WsNet = require('./transport_wsnet.js');
    const Seeds = require('./seeds').default;
    const utilities = require('utilities');
    const logger = require('logger');
    const tasks = require("tasks").default;
    const appsrvc = require('appsrvc');
    const defs = require('definitions');

    var handler = {};

    //
    //  WebRTC connections handler section
    //

    // WebRTC connection list
    var list_of_webrtc_connections = {};

    handler.create_receiver = function (contact) {
        console.log("connections.createnew()");
        if (!contact || !contact.name) {
            throw new Error("invalid contact at connections create");
        }

        if (list_of_webrtc_connections[contact.name]) {
            //  remove if it is exists
            handler.remove(contact.name);
        }

        var webrtcdata = new WebRTCData(contact);
        webrtcdata.createchannel(false, function () {
            list_of_webrtc_connections[contact.name] = webrtcdata;
            webrtcdata.onclosed = handler.onclosed;
        });
    };

    handler.create = function (contact, issender, taskid, callback) {
        console.log("connections.create()");
        if (!contact || !contact.name) {
            throw new Error("invalid contact at connections create");
        }

        if (!callback || typeof callback != "function") {
            throw new Error("invalid callback at connections create");
        }

        //  if it is a sender check if the connection exists and then use the existing connection
        //  for recipient must create a new connection as it was issued a "OFTX" peer message, which
        //  means the sender want to initialize a new connection
        if (issender) {
            var obj = handler.get(contact.name);
            if (obj && handler.connected(contact.name)) {
                if (callback) {
                    callback(null, obj);
                }
                return;
            }
        }

        // start a task
        appevents.dispatch("on-task-event", "add", {
            proc: "info",
            type: "chat",
            mode: "send",
            taskid: taskid,
            contact: contact,
            showconnect: true
        });

        peercomm.ping(contact, true, 10000)
            .then(() => {
                return peercomm.get_contact_session(contact);
            })
            .then(() => {
                return peercomm.offer_textchat(contact);
            })
            .then(() => {
                // open the webrtc data channel
                var webrtcdata = new WebRTCData(contact);
                webrtcdata.createchannel(issender, function (err) {
                    if (err) {
                        callback(err)
                    }
                    else {
                        list_of_webrtc_connections[contact.name] = webrtcdata;
                        webrtcdata.onclosed = handler.onclosed;
                        callback(null, webrtcdata);
                    }
                });
            })
            .catch(function (err) {
                callback(err);
            }
        );
    };

    handler.exists = function (contactname) {
        var conn = list_of_webrtc_connections[contactname];
        if (conn) {
            return true;
        }
        else {
            return false;
        }
    }

    handler.get = function (contactname) {
        return list_of_webrtc_connections[contactname];
    }

    handler.connected = function (contactname) {
        var conn = list_of_webrtc_connections[contactname];
        return conn && conn.connected ? true : false;
    }

    handler.remove = function (contactname) {
        if (list_of_webrtc_connections[contactname]) {
            try {
                list_of_webrtc_connections[contactname].close();
            }
            catch (err) {}

            try {
                list_of_webrtc_connections[contactname] = null;
                delete list_of_webrtc_connections[contactname];
            }
            catch (err) {}
        }
    }

    handler.onclosed = function (contactname) {
        if (list_of_webrtc_connections[contactname]) {
            try {
                list_of_webrtc_connections[contactname] = null;
                delete list_of_webrtc_connections[contactname];
            }
            catch (err) { }
        }
    }

    //
    //  End WebRTC connections handler secion
    //

    //
    //  WebSocket connections handler section
    //  maintains the application main WS and
    //  this contacts' WS connections
    //

    // WebSocket connection list
    var list_of_ws_connections = {};
    // this is the application net client
    handler.appnet = null;
    handler.failed_hosts = [];
    handler.list_of_hosts = [];
    handler.appnet_init_started = 0;
    handler.appnet_init_host = 0;
    handler.appnet_init_port = 0;
    // indicate the appnet WS had error, this will force the monitor
    // to try anothe host without delay
    handler.appnet_con_error = false;

    function add_netconn_task(host, port) {
        appevents.dispatch("on-task-event", "add", {
            proc: "info",
            type: "network",
            mode: "send",
            taskid: handler.appnet_init_started,
            host: host,
            port: port
        });
    }

    function delete_netconn_task() {
        appevents.dispatch("on-task-event", "close", "send", handler.appnet_init_started);
    }

    function excludeHosts(array, exclude) {
        if (Array.isArray(array) && Array.isArray(exclude)) {
            var filtered = array.filter(function (rem) {
                var additem = true;
                exclude.forEach(
                    (exc) => {
                        if (exc.host == rem.host && exc.port == rem.port) {
                            additem = false;
                        }
                    }
                );
                return additem;
            });

            return filtered;
        }
    }

    function isFailedHost(host, port) {
        handler.failed_hosts.forEach(
            (item) => {
                if (item.host == host && obj.port == item.port) {
                    return true;
                }
            }
        );
        return false;
    }

    function updateFailedHost(host, port) {
        //both params must have value 
        if (port && host) {
            if (!isFailedHost(host, port)) {
                handler.failed_hosts.push({ host: host, port: port });
            }
        }
    }

    function pickaseed(array) {
        return utilities.getrnditem(array);

        // TODO comment the random func above and comment out this line below for development purpose to test an array of seeds in sequence
        // to test always just return the firs item
        // return array[0];
    }

    function gethost_fromseeds(callback) {
        Seeds.load(
            (err, seeds) => {
                if (err) {
                    return err;
                }

                // normalize by excluding the failed arrays
                var normalized = excludeHosts(seeds, handler.failed_hosts);

                // get a random seed
                var seed = pickaseed(normalized);
                if (!seed || !seed.host || !seed.port) {
                    return callback("could not get a WS peer at connection handler")
                }

                // store the host and port, so the monitor knows to which WS peer we try to connect
                handler.appnet_init_host = seed.host;
                handler.appnet_init_port = seed.port;

                // create a progress task
                add_netconn_task(seed.host, seed.port);

                // TODO !!! remove the next line it is for test purpose or comment out to just test the UI
                // return callback(null, seed.host, seed.port);

                var url = streembit.globals.protocol + '://' + seed.host + ":" + seed.port;

                var data = {
                    "type": "getwspeers"
                };

                $.ajax({
                    url: url,
                    type: "POST",
                    data: JSON.stringify(data),
                    cache: false,
                    success: function (response) {
                        try {
                            var obj = JSON.parse(response);
                            if (obj.error) {
                                return callback(obj);
                            }

                            if (!obj || !obj.wspeers || !obj.wspeers.length) {
                                return callback("invalid wspeers list received");
                            }

                            if (!Array.isArray(obj.wspeers) || !obj.wspeers.length) {
                                return callback("invalid wspeers list received");
                            }

                            callback(null, obj.wspeers[0].wshost, obj.wspeers[0].wsport);
                        }
                        catch (err) {
                            callback("get wspeers error: " + err.message);
                        }
                    },
                    error: function (request, status, error) {
                        delete_netconn_task();
                        callback("getwspeers at " + url + " failed " + ((error + "") || ""));
                    },
                    timeout: 5000
                });
            }
        );
    };

    //
    // manage failed connections
    //
    function cleanup_ws_connection(wshandler) {
        try {
            wshandler.dispose();
            var key = wshandler.host + ":" + wshandler.port;
            delete list_of_ws_connections[key];
        }
        catch (err) { }
    }


    //
    //  return a host, first try the last seed, next a seed from the gihub repository
    //  last a seed from the config file whichever exists in this order
    //
    function gethost(callback) {
        // first try to get the last used seed
        var lastseed = settings.lastseed;
        if (lastseed && lastseed.host && lastseed.port) {
            var failed = isFailedHost(lastseed.host, lastseed.port);
            if (!failed) {
                // the last seed has not in the failed list
                // try to reuse it 
                return callback(null, lastseed.host, lastseed.port);
            }
        }

        // try to get a peer from the seed list of settings
        gethost_fromseeds(
            (err, host, port) => {
                if (!err && host && port) {
                    return callback(null, host, port);
                }

                // TODO instead of call the callback above since it was an error, it seems no peer available 
                // from the settings seeds array or we tried all (and they are in the failed list), get the seeds from the config.js file 
                callback(err);
            }
        );
    }

    handler.monitor_appconnection = function () {
        try {

            var connected = false;
            if (!navigator.onLine) {
                // the internet connection is broken, the WS connection was broken
                // need to reinitialize the WS application connection
                if (handler.appnet) {
                    handler.appnet.isconnected = false;
                }
            }
            else {
                if (handler.appnet) {
                    connected = handler.appnet.isconnected;
                }                
            }

            handler.update_connection_status(connected);

            if (connected) {
                // check the last activity
                var lastevent = handler.appnet.last_connection_event;
                if (lastevent > 0) {
                    // last event is not null, so it was already initialized
                    // determine whether or not there is a ping needed
                    var currtime = Date.now();
                    if (currtime - lastevent > 120000) { // in every 2 minutes
                        // ping to check the status
                        handler.appnet.ping(
                            (isconn) => {
                                handler.update_connection_status(isconn);
                            }
                        );
                    }
                }
            }

            if (!connected) {
                if (!handler.appnet_con_error) {
                    var currtime = Date.now();
                    if (currtime - handler.appnet_init_started < 30000) {  // give 30 seconds to try to connect
                        return;
                    }
                }

                // the connection init attempt was longer than 10 seconds
                if (!handler.appnet) {
                    if (!handler.appnet_init_host || !handler.appnet_init_port) {
                        // the init host & port was never set
                        // perhaps run out from hosts? try to handle this scenario
                        // TODO handle this
                        return;
                    }

                    var key = handler.appnet_init_host + ":" + handler.appnet_init_port;
                    var wshandler = list_of_ws_connections[key];
                    if (!wshandler) {
                        // was removed already ... add this host to the failed list
                        updateFailedHost(handler.appnet_init_host, handler.appnet_init_port);
                        // signal the transport that the connection is broken
                        // the transport must intialize the connection as there is the logic
                        // to set resource upon successfull or failed connections
                        return appevents.send(appevents.TYPES.ONAPPNETFAILED);
                    }

                    // the wshandler exists
                    if (wshandler.isclosed || wshandler.iserror || !wshandler.isconnected) {
                        // add it host to the failed list
                        handler.failed_hosts.push({ host: handler.appnet_init_host, port: handler.appnet_init_port });
                        // remove it
                        wshandler.dispose();
                        delete list_of_ws_connections[key];
                        return appevents.send(appevents.TYPES.ONAPPNETFAILED);
                    }

                    // this WS peer is not responding -> needs to be removed
                }
            }
        }
        catch (err) {
            logger.error("monitor_appconnection error: %j", err)
        }
    };

    handler.update_lastseed = function () {
        if (handler.appnet && handler.appnet.host && handler.appnet.port && handler.appnet.isconnected) {
            settings.lastseed = { host: handler.appnet.host, port: handler.appnet.port };
        }
        else {
            settings.lastseed = {};
        }
    };

    // update the application net connection status
    handler.update_connection_status = function (status) {
        if (handler.appnet) {
            handler.appnet.isconnected = status;
        }
        appevents.dispatch('on-connection-status', status);
    };

    handler.get_ws_connection = function (host, port, callback) {
        if (!callback || typeof callback !== "function") {
            return logger.error("get_ws_connection error: invalid callback function");
        }

        if (!host || !port) {
            return callback("get_ws_connection invalid connection parameters")
        }

        var key = host + ":" + port;
        var wshandler = list_of_ws_connections[key];

        if (!wshandler) {
            wshandler = new WsNet(host, port);
            wshandler.init(
                (err) => {     
                    if (err) {
                        // failed to connect
                        cleanup_ws_connection(wshandler);
                        callback(err);
                    }
                    else {
                        // add it the list of WS connections
                        list_of_ws_connections[key] = wshandler;
                        callback(null, wshandler);
                    }                    
                }
            );
        }
        else {
            callback(null, wshandler);
        }
        
    };

    handler.get_contact_ws_connection = function (host, port, callback) {
        // get the host and port from the seeds
        handler.get_ws_connection(host, port, callback );
    };

    handler.create_app_netclient = function (callback) {
        try {

            handler.appnet_init_host = 0;
            handler.appnet_init_port = 0;
            handler.appnet_con_error = false;
            handler.appnet_init_started = Date.now();

            // from this point an appnetclient must exists
            // it needs to be monitored
            tasks.addTask("app_connection_monitor", 3000, () => {
                try {
                    handler.monitor_appconnection();
                }
                catch (err) {
                    logger.error("connections task callback error: %j", err)
                }
            });

            // get the host and port from the seeds
            gethost(
                (err, host, port) => {
                    if (err) {
                        delete_netconn_task();
                        handler.appnet_con_error = true;
                        return callback(err);
                    }

                    try {
                        handler.get_ws_connection(
                            host, port,
                            (err, wsobj) => {
                                try {
                                    // close the task
                                    delete_netconn_task();

                                    if (err) {      
                                        handler.appnet_con_error = true;
                                        return callback(err);
                                    }

                                    if (!wsobj) {
                                        handler.appnet_con_error = true;
                                        return callback("Unable to create application net connection");
                                    }

                                    // set the application appnet
                                    handler.appnet = wsobj;
                                    appsrvc.transport = defs.TRANSPORT_WS;
                                    appsrvc.node = handler.appnet;
                                    appsrvc.host = handler.appnet.host;
                                    appsrvc.port = handler.appnet.port;
                                    appsrvc.wsprotocol = handler.appnet.protocol;

                                    handler.update_lastseed();

                                    callback();
                                }
                                catch (e) {
                                    delete_netconn_task();
                                    callback("create_app_netclient error: " + e.message);
                                }
                            }
                        );
                    }
                    catch (e) {
                        handler.appnet_con_error = true;
                        delete_netconn_task();
                        callback("create_app_netclient error: " + e.message);
                    }
                }
            );
        }
        catch (err) {
            callback("create_app_netclient error: " + err.message);
        }
    }

    //
    //  End WebSocket connections handler section
    //

    //
    // initialization
    // 

    handler.init = function () {
        return new Promise((resolve, reject) => {
            try {
                // add initialization logic here
                resolve();
            }
            catch (err) {
                reject(err);
            }
        });
    };

    module.exports = handler;

} ());

