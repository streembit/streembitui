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
    var logger = require('./logger');
    var PeerToPeerNet = require('./peernetwork');
    var WebSocketNet = require('./wsnetwork');

    var peernet = {};

    peernet.netclient = null;

    Object.defineProperty(peernet, 'client', {
        get: function () {
            return peernet.netclient;
        },
        set: function (value) {
            peernet.netclient = value;
        }
    })

    function netfactory() {
        if (streembit && streembit.globals && streembit.globals.nwmode) {
            return new PeerToPeerNet();
        }
        else {
            return new WebSocketNet();
        }
    }

    peernet.getseeds = function () {
        if (!peernet.netclient) {
            return [];
        }
        else {
            return peernet.netclient.getseeds();
        }
    }

    peernet.init = function() {
        peernet.netclient = null;
        return new Promise((resolve, reject) => {
            logger.debug("Initialize Streembit Network");

            // get the network factory
            peernet.netclient = netfactory();
            peernet.netclient.init().
                then(() => {
                    resolve();
                })
                .catch(function (err) {
                    reject(err);
                });
        });
    }

    module.exports = peernet;

})();