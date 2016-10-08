'use strict';

var logobj;

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
}


if (streembit.globals.uimode == 'nw') {
    logobj = require("streembitlib/logger/logger");
    var path = require('path');
}
else {
    var util = require("util");
    logobj = web_logger;
}

let symobj = Symbol();
class Logger {

    constructor(singleton) {
        if (symobj !== singleton) {
            throw new Error('Only one Logger singleton instance is allowed.');
        }
        this.logobj = null;
    }

    static get instance() {
        if (!this[symobj])
            this[symobj] = new Logger(symobj);

        return this[symobj]
    }

    get logger () {
        if (!logobj) {
            throw new Error("the logger is not initialized");
        }
        return logobj;
    }

    init (level) {
        return new Promise((resolve, reject) => {
            console.log("Creating logger");

            if (streembit.globals.uimode == 'nw') {
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
                resolve();
            }
        });
    }
       
    error (err, param) {
        logobj.error(err, param);
    }

    info(msg, val1, val2, val3, val4) {
        logobj.info( msg, val1, val2, val3, val4);
    }

    debug (msg, val1, val2, val3, val4) {
        logobj.debug( msg, val1, val2, val3, val4);
    }

    warn (msg, val1, val2, val3, val4) {
        logobj.warn(msg, val1, val2, val3, val4);
    }

}

export default Logger.instance