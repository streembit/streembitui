
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

    const appevents = require('appevents');
    const logger = require('applogger');
    const util = require("util");
    const errcodes = require("errcodes");
    const i18next = require("i18next");

    var errhandler = {};

    function get_errorcode_msg(errorcode) {
        var errcodestr;
        if (!errorcode || errorcode < 1 || errorcode > errcodes.MAX_ERROR_CODE) {
            // invalid error code
            errcodestr = "PROCERROR";
        }
        else {
            for (var field in errcodes) {
                if (errcodes[field] == errorcode) {
                    errcodestr = field.toString();
                }
            }
        }

        if (!errcodestr) {
            errcodestr = "PROCERROR";
        }

        var localerr = i18next.t("errcode_" + errcodestr);
        if (!localerr) {
            localerr = "Application error";
        }

        return localerr;
    }

    errhandler.getmsg = function (errorcode, err, param) {
        // get the field name that is related to the errorcode
        var errmsg = get_errorcode_msg(errorcode);
        errmsg += ". ";

        if (err) {
            var sub_error_msg = "";
            // add an error field if any 
            if (err.error && typeof err.error == "number" && err.error > 0 && err.error < errcodes.MAX_ERROR_CODE) {
                // this seems a valid errcode
                sub_error_msg = get_errorcode_msg(err.error);                  
            }
            else if (typeof err == "Error" || typeof err == "error" || typeof err == "object" || typeof err == "Object") {
                if (err.message) {
                    sub_error_msg = err.message;
                }
            }
            else if (typeof err === 'string') {
                sub_error_msg = err;
            }

            // msg field could exists from CLI
            if (err.msg) {
                var err_reason;
                if (typeof err.msg == "number" && err.msg > 0 && err.msg < errcodes.MAX_ERROR_CODE) {
                    err_reason = get_errorcode_msg(err.msg);

                }
                else if (typeof err.msg == "string") {
                    err_reason = err.msg;
                }

                if (err_reason) {
                    var reason_word = i18next.t("reason-word");
                    if (reason_word == "reason-word") {
                        // the i18 couldn't find this word, just return the English "Reason" word
                        reason_word = "Reason";
                    }

                    if (sub_error_msg) {
                        sub_error_msg += ". ";
                    }
                    sub_error_msg += reason_word;
                    sub_error_msg += ": ";
                    sub_error_msg += err_reason;
                }
            }              

            // check if the info field exists
            if (err.info && typeof err.info == "string" && err.info.length > 0) {
                var info_word = i18next.t("info-word");
                if (info_word == "info-word") {
                    // the i18 couldn't find this word, just return the English "Info" word
                    info_word = "Info";
                }

                if (sub_error_msg) {
                    sub_error_msg += ". ";
                }
                sub_error_msg += info_word;
                sub_error_msg += ": ";
                sub_error_msg += err.info;
            }

            if (sub_error_msg) {
                var error_word = i18next.t("error-word");
                if (error_word == "error_word") {
                    // the i18 couldn't find this word, just return the English "Error" word
                    error_word = "Error";
                }
                // since we know there is an error will follow put a colon
                errmsg += error_word + ": " + sub_error_msg;
            }
        }

        if (param) {
            if (typeof param == "Error" || typeof param == "error" || typeof param == "object" || typeof param == "Object") {
                if (param.message) {
                    errmsg += " " + param.message;
                }
            }
            else if (typeof param === 'string') {
                errmsg += " " + param;
            }
        }

        return errmsg;
    }


    errhandler.load = function () {
        return new Promise(function (resolve, reject) {
            appevents.onError(function (errorcode, err, param) {
                try {
                    switch (errorcode) {
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
