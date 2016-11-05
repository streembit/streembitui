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

    var logobj;
    var util = require("util");

    var web_logger = {

        log_error: function (err, param) {
            try {
                if (!err) { return; }

                if (param) {
                    var msg = err;
                    if (typeof err == 'string') {
                        if (err.indexOf("%j") > -1) {
                            //  the Error object is not formated well from the util library
                            //  send only the message field if that is an Eror object
                            if (param.message && (typeof param == "Error" || typeof param == "error" || typeof param == "object" || typeof param == "Object")) {
                                err = err.replace("%j", "%s");
                                msg = util.format(err, param.message);
                            }
                            else if (typeof param == 'string') {
                                err = err.replace("%j", "%s");
                                msg = util.format(err, param);
                            }
                        }
                        else {
                            msg = util.format(err, param);
                        }
                    }
                    else {
                        msg = err;
                    }
                    console.log(msg);
                    return msg;
                }
                else {
                    console.log(err);
                    return err;
                }
            }
            catch (e) {
                if (err) {
                    console.log(err.message ? err.message : err);
                }
            }
        },

        error: function (err, param) {
            this.log_error(err, param);
        },

        info: function (msg) {
            console.log(msg);
        },

        debug: function (msg) {
            console.log(msg);
        },

        warn: function (msg) {
            console.log(msg);
        }
    };

    var Logger = {
        init: function (level) {
            return new Promise(function(resolve, reject){
                console.log("Creating logger");

                if (streembit.globals.nwmode) {
                    logobj = nwrequire("streembitlib/logger/logger");
                    var path = nwrequire('path');
                    // the logs dir is in the same directory as the executable
                    var wdir = process.cwd();
                    var logspath = path.join(wdir, 'logs');

                    console.log('log level: ' + level);
                    console.log('log path: ' + logspath);

                    logobj.init(level, logspath, null, function (err) {
                        if (!err) {
                            resolve();
                        }
                        else {
                            reject(err);
                        }
                    });
                }
                else {
                    util = require("util");
                    logobj = web_logger;
                    resolve();
                }
            });
        },

        error: function (err, param) {
            if (logobj && logobj.error) {
                logobj.error(err, param);
            }
            else {
                console.log(err, param);
            }
        },

        info: function (msg, val1, val2, val3, val4) {
            if (logobj && logobj.info) {
                logobj.info(msg, val1, val2, val3, val4);
            }
            else {
                console.log(msg);
            }
        },

        debug: function (msg, val1, val2, val3, val4) {
            if (logobj && logobj.debug) {
                logobj.debug(msg, val1, val2, val3, val4);
            }
            else {
                console.log(msg);
            }            
        },

        warn: function (msg, val1, val2, val3, val4) {
            if (logobj && logobj.warn) {
                logobj.warn(msg, val1, val2, val3, val4);
            }
            else {
                console.log(msg);
            }                  
        }
    };

    module.exports = Logger;
})();