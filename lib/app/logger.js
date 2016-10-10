'use strict';

(function () {

    var logobj, util;

    var web_logger = {

        log_error: function (err, param) {
            try {
                if (!err) {
                    return;
                }

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
            logobj.error(err, param);
        },

        info: function (msg, val1, val2, val3, val4) {
            logobj.info(msg, val1, val2, val3, val4);
        },

        debug: function (msg, val1, val2, val3, val4) {
            logobj.debug(msg, val1, val2, val3, val4);
        },

        warn: function (msg, val1, val2, val3, val4) {
            logobj.warn(msg, val1, val2, val3, val4);
        }
    };

    module.exports = Logger;
})();