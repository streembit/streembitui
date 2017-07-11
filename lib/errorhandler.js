
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


(function () {

    var appevents = require('appevents');
    var logger = require('applogger');
    var util = require("util");

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


    function errmsg (err, param) {
        try {
            if (!err) { return "" }

            var msg = err;
            if (param) {                
                if (typeof err == 'string') {
                    if (err.indexOf("%j") > -1) {
                        //  the Error object is not formated well from the util library
                        //  send only the message field if that is an Eror object
                        if (param.message && (typeof param == "Error" || typeof param == "error" || typeof param == "object" || typeof param == "Object")) {
                            err = err.replace("%j", "%s");
                            msg = util.format(err, param.message);
                        }
                        else if (typeof param === 'string') {
                            err = err.replace("%j", "%s");
                            msg = util.format(err, param);
                        }
                        else {
                            msg = err + " " + param;
                        }
                    }
                    else {
                        msg = util.format(err, param);
                    }
                }
                else {
                    if (err instanceof Error) {
                        msg = err.message + " " + param;
                    }
                    else {
                        msg = new String(err);
                    }
                }                
            }
            else {
                if (err instanceof Error) {
                    msg = err.message;
                }
                else {
                    var str = new String(err);
                    msg = str.toString();
                }
            }

            return msg;
        }
        catch (e) {
            if (err) {
                return err;
            }
            else {
                return "";
            }
        }
    }

    function handleWebrtcError(err, param) {
        if (!err) { return }

        var msg = errmsg(err, param );
        streembit.notify.error(msg, null, true);
    }

    errhandler.Codes = {
        PEERCOMM: "peercomm",
        FINDKEY: "findkey",
        FINDMESSAGES: "findmessages",
        WEBRTC: "webrtc"
    }

    errhandler.load = function () {

        return new Promise(function (resolve, reject) {
            appevents.onError(function (errorcode, err, param) {
                try {
                    switch (errorcode) {
                        case errhandler.Codes.PEERCOMM:
                            break;
                        case errhandler.Codes.FINDKEY:
                            break;
                        case errhandler.Codes.FINDMESSAGES:
                            handleFindMessages(err);
                            break;
                        case errhandler.Codes.WEBRTC:
                            handleWebrtcError(err, param);
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
