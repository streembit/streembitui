var path = require('path');
var fs = require('fs');
var winston = require('winston');
var util = require('util');

var DevConsole = winston.transports.DevConsole = function (options) {
    this.name = 'DevConsole';
    this.level = options.level || 'debug';
};

util.inherits(DevConsole, winston.Transport);

DevConsole.prototype.log = function (level, msg, meta, callback) {
    console.log(msg);
    callback(null, true);
};

var logger = {};

function log_error(err, param) {
    try {
        if (!err) {
            return;
        }

        if (param) {
            var msg = err;
            if (typeof err == 'string') {
                if(err.indexOf("%j") > -1 ) {
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
            logger.error(msg);
            return msg;
        }
        else {
            logger.error(err);
            return err;
        }       
    }
    catch (e) {
        if (err) {
            // still log to the console
            console.log(err.message ? err.message : err);
        }
    }
}

function level_log(level, msg, val1, val2, val3, val4) {
    try {
        
        if (!logger.log) {
            console.log(msg);
            return;   
        }

        if (msg) {
            if (val1 != undefined && val2 != undefined && val3 != undefined && val4 != undefined) {
                msg = util.format(msg, val1, val2, val3, val4);
                logger.log(level, msg);
            }
            else if (val1 != undefined && val2 != undefined && val3 != undefined) {
                msg = util.format(msg, val1, val2, val3);
                logger.log(level, msg);
            }
            else if (val1 != undefined && val2 != undefined) {
                msg = util.format(msg, val1, val2);
                logger.log(level, msg);
            }
            else if (val1 != undefined) {
                msg = util.format(msg, val1);
                logger.log(level, msg);
            }
            else {
                logger.log(level, msg);
            }

            if (logger.taskbar_info_proc && level == "info") {
                logger.taskbar_info_proc(msg);
            }
        }
    }
    catch (e) {
        if (msg) {
            // still log to the console
            console.log(msg)
        }
    }
}

function log_info(msg, val1, val2, val3, val4) {
    level_log("info", msg, val1, val2, val3, val4);
}

function log_debug(msg, val1, val2, val3, val4) {
    level_log("debug", msg, val1, val2, val3, val4);
}



function config_log(loglevel, logpath, excpath, taskbar_infofn) {
    var transports = [        
        new winston.transports.Console({
            level: loglevel,
            json: false,
            colorize: true
        }),
        new (winston.transports.File)({
            filename: logpath,
            level: loglevel,
            json: true,
            maxsize: 4096000, //4MB
            maxFiles: 100,
            tailable: true,
            colorize: false
        })
    ];
    
    
    logger = new (winston.Logger)({
        exitOnError: false,
        transports: transports,
        exceptionHandlers: [
            new winston.transports.File({
                filename: excpath,
                json: true
            }),
            new winston.transports.Console({
                level: loglevel,
                json: false,
                colorize: true
            })
        ]
    });

    if (taskbar_infofn) {
        logger.taskbar_info_proc = taskbar_infofn;
    }
}

function init_log(loglevel, logdir, taskbar_infofn, callback) {
    
    var logspath = null;
    if (logdir) {
        logspath = logdir;
    }
    else {
        var wdir = process.cwd();
        logspath = path.join(wdir, logsdir);    
    }

    console.log("logger.init logs directory: %s", logspath);
    // set the global logs path
    global.logspath = logspath;
    
    var logfilePath = path.join(logspath, 'streemio.log');
    var exceptionFileLog = path.join(logspath, 'exception.log');
    
    var level = loglevel || "debug";
    
    fs.open(logspath, 'r', function (err, fd) {
        if (err && err.code == 'ENOENT') {
            /* the directory doesn't exist */
            console.log("Creating logs directory at " + logspath);
            fs.mkdir(logspath, function (err) {
                if (err) {
                    // failed to create the log directory, most likely due to insufficient permission
                    if (callback) {
                        callback("Error in creating logs directory: " + err.message ? err.message : err);
                    }
                    else {
                        console.log("Error in creating logs directory: " + err.message ? err.message : err);
                    }
                }
                else {
                    config_log(level, logfilePath, exceptionFileLog, taskbar_infofn);

                    if (callback) {
                        callback();
                    }
                    logger.info("logspath: " + logspath);
                }
            });
        }
        else {
            console.log("logs directory " + logspath + " exists");
            var tmpfilename = "/streemio_" + Date.now() + ".log";
            var newfile = path.join(logspath, tmpfilename);
            console.log("newfile: %s", newfile);
            fs.rename(logfilePath, newfile, function (err) {
                if (err) {
                    if (err.code && err.code != "ENOENT") {
                        if (callback) {
                            callback("Error in creating renaming log file: " + err.message ? err.message : err);
                        }
                        else {
                            return console.log("fs.rename error: %j", err);
                        }
                    }
                    // continue if the streemio.log does not exists, that is not an error
                }

                if (!err) {
                    console.log("log file renamed to: %s", newfile);
                }

                config_log(level, logfilePath, exceptionFileLog, taskbar_infofn);

                if (callback) {
                    callback();
                }
                logger.info("logspath: " + logspath);
            });
        }
    });
}

function set_level(newlevel) {
    if (logger && logger.transports) {
        for (var i = 0; i < logger.transports.length; i++) {
            logger.transports[i].level = newlevel; 
        }
    }
}

exports.error = log_error;
exports.info = log_info;
exports.debug = log_debug;
exports.init = init_log;
exports.setlevel = set_level;