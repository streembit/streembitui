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

(function () {

    var appevents = require("appevents");
    var WebRTCData = require('webrtcdata');
    var peercomm = require('peercomm');

    var handler = {};

    var list_of_connections = {};

    handler.create_receiver = function (contact) {
        console.log("connections.createnew()");
        if (!contact || !contact.name) {
            throw new Error("invalid contact at connections create");
        }

        if (list_of_connections[contact.name]) {
            //  remove if it is exists
            handler.remove(contact.name);
        }

        var webrtcdata = new WebRTCData(contact);
        webrtcdata.createchannel(false, function () {
            list_of_connections[contact.name] = webrtcdata;
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
                        list_of_connections[contact.name] = webrtcdata;
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
        var conn = list_of_connections[contactname];
        if (conn) {
            return true;
        }
        else {
            return false;
        }
    }

    handler.get = function (contactname) {
        return list_of_connections[contactname];
    }

    handler.connected = function (contactname) {
        var conn = list_of_connections[contactname];
        return conn && conn.connected ? true : false;
    }

    handler.remove = function (contactname) {
        if (list_of_connections[contactname]) {
            try {
                list_of_connections[contactname].close();
            }
            catch (err) {}

            try {
                list_of_connections[contactname] = null;
                delete list_of_connections[contactname];
            }
            catch (err) {}
        }
    }

    handler.onclosed = function (contactname) {
        if (list_of_connections[contactname]) {
            try {
                list_of_connections[contactname] = null;
                delete list_of_connections[contactname];
            }
            catch (err) { }
        }
    }

    module.exports = handler;

} ());

