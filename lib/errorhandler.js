
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

    var appevents = require('appevents');
    var logger = require('applogger');

    const NOMSGERR = "0x0100";

    var errhandler = {};

    function handleFindMessages(err) {
        if (!err) {
            return streembit.notify.error("Error in finding messages: unknow error", null, true);
        }

        if ((err.message && typeof err.message == "string" && err.message.indexOf(NOMSGERR) > -1) ||
            (typeof err == "string" && err.indexOf(NOMSGERR) > -1)) {
            streembit.notify.info("There are no messages for the account", null, true);
        }
        else {
            streembit.notify.error("Error in finding messages:  %j", err, null, true);
        } 
    }

    errhandler.Codes = {
        PEERCOMM: "peercomm",
        FINDKEY: "findkey",
        FINDRANGE: "findrange",
        FINDMESSAGES: "findmessages"
    }

    errhandler.load = function () {

        return new Promise(function (resolve, reject) {
            appevents.on(appevents.ERROREVENT, function (errorcode, err) {
                try {
                    switch (errorcode) {
                        case errhandler.Codes.PEERCOMM:
                            break;
                        case errhandler.Codes.FINDKEY:
                            break;
                        case errhandler.Codes.FINDRANGE:
                            break;
                        case errhandler.Codes.FINDMESSAGES:
                            handleFindMessages(err);
                            break;
                        default:
                            break;
                    }
                }
                catch (e) {
                    logger.error("Error in ErrorHandler %j", e);
                }
            });

            // return the promise
            resolve();
        });     

    }

    module.exports = errhandler;

}());
