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

'use strict';

var appsrvc = require("appsrvc");
var moisrvc = require("moisrvc");
var user = require("user");
var peermsg = require("peermsg");
var secrand = require('secure-random');
var logger = require('applogger');

(function () {

    var session = {};

    session.create = function (callback) {
        try {
            if (!callback || (typeof callback != "function")) {
                return streembit.notify.error("Error in creating user session, invalid callback function");
            }

            var payload = { account: appsrvc.username, email: user.email};
            var id = secrand.randomBuffer(8).toString("hex");
            var timestamp = Date.now();
            payload[peermsg.MSGFIELD.TIMES] = timestamp;
            var data = peermsg.create_jwt_token(appsrvc.cryptokey, id, payload, null, null, appsrvc.username, null, null);

            moisrvc.send("createsession", data,
                function (ret) {
                    if (!ret || ret.status != 0 || !ret.result || !ret.result.sessionid || !ret.result.certificate) {
                        return callback("invalid user session value received from the server");
                    }
                    appsrvc.sessionid = ret.result.sessionid;
                    var obj;
                    if (ret.result.certificate && Array.isArray(ret.result.certificate)) {
                        obj = ret.result.certificate[0];
                    }
                    appsrvc.certificate = obj;

                    if (ret.result.idqascore) {                        
                        appsrvc.idqascore = ret.result.idqascore;
                    }
                    
                    callback();

                },
                function (err) {
                    // unblock when ajax activity stops 
                    callback(err);
                }
            );
        }
        catch (err) {
            callback(err);
        }       
    };

    module.exports = session;

})();