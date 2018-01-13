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
Copyright (C) Streembit 2017
-------------------------------------------------------------------------------------------------------------------------

*/


(function () {

    const appevents = require("appevents");
    const secrand = require('secure-random');
    const createHash = require('create-hash');

    var bcTransport = {};

    bcTransport.send = function (data, callback) {
        try {

            if (callback) {
                if ((data.amount/100000000) == 5) {
                    return callback("some BC error when sending 5 to test the whole thing");
                }
                else {
                    callback(null, { dispatched: true });
                }
            }

            setTimeout(
                () => {
                    // return the transaction number
                    // mock data from this mimick service
                    var rndstr = secrand.randomBuffer(32).toString("hex");
                    var txid = createHash("sha256").update(rndstr).digest("hex");
                    var payload = {
                        "event": "sendresult",
                        "error": false,
                        "txid": txid
                    };
                    appevents.dispatch("on-bc-event", payload);

                },
                3000
            );
        }
        catch (err) {
            if (callback) {
                callback(err)
            }
            else {
                //TODO
            }
        }
    }

    bcTransport.init = function () {
        console.log("bcTransport init");
    };

    module.exports = bcTransport;

}());
