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

    var util = require("util");
    var logobj;

    function BaseLogger(level, prefix) {
        if (!(this instanceof BaseLogger)) {
            return new Logger(level, prefix);
        }

        this.prefix = prefix;
        this.level = level || 0;
        this.types = {
            debug: {
                level: 4
            },
            info: {
                level: 3
            },
            warn: {
                level: 2
            },
            error: {
                level: 1
            }
        };

        this._bindLogTypes();
    }

    /**
    * Sets up log types as instance methods
    * @private
    */
    BaseLogger.prototype._bindLogTypes = function () {
        var self = this;

        Object.keys(this.types).forEach(function (type) {
            self[type] = function () {
                if (self.level >= self.types[type].level) {
                    var prefix = '{' + type + '}';
                    var args = Array.prototype.slice.call(arguments);

                    args[0] = prefix + ' ' + args[0];

                    console.log.apply(console, args);
                }
            };
        });
    };

    var typemap = {
        debug: 4,
        info: 3,
        warn: 2,
        error: 1
    };

    var logs = {
        "debug": {
            proc: "debug", level: 4, data: []
        },
        "info": {
            proc: "info", level: 3, data: []
        },
        "warn": {
            proc: "warn", level: 2, data: []
        },
        "error": {
            proc: "error", level: 1, data: []
        }
    };

    var Logger = {

        storefn: null,

        level: 1,

        init: function (level) {
            var self = this;
            return new Promise(function (resolve, reject) {
                self.create(level);
                resolve();             
            });
        },

        add: function (type, message) {
            var msg = { time: Date.now(), message: message };
            var level = Logger.level;
            Object.keys(logs).forEach(function (item) {
                if (level >= logs[item].level && logs[item].proc == type) {
                    logs[item].data.push(msg);
                }
            });
        },

        getlogs: function (type) {
            return logs[type].data;
        },

        create: function (level) {           

            var numloglevel = 1;
            switch (level) {
                case "debug":
                    numloglevel = 4;
                    break;
                case "info":
                    numloglevel = 3;
                    break;
                case "warn":
                    numloglevel = 2;
                    break;
                default:
                    break;
            }

            Logger.level = numloglevel;
            logobj = new BaseLogger(numloglevel);
        },

        log: function (type, msg, val1, val2) {
            try {
                var logmsg = msg;
                if (val2 && val1) {
                    logmsg = util.format(msg, val1.message || val1, val2.message || val2);
                    logobj[type](util.format(msg, val1, val2));
                }
                else if (val1 || typeof val1 == 'string') {
                    var param = val1;
                    var err = msg;
                    if (typeof err == 'string') {
                        if (err.indexOf("%j") > -1) {
                            //  the Error object is not formated well from the util library
                            //  send only the message field if that is an Eror object
                            if (param.message && (typeof param == "Error" || typeof param == "error" || typeof param == "object" || typeof param == "Object")) {
                                err = err.replace("%j", "%s");
                                logmsg = util.format(err, param.message);
                            }
                            else if (typeof param == 'string') {
                                err = err.replace("%j", "%s");
                                logmsg = util.format(err, param);
                            }
                        }
                        else {
                            logmsg = util.format(err, param);
                        }
                    }
                    else {
                        logmsg = util.format(msg, val1.message || val1);                        
                    }

                    logobj[type](logmsg);
                }
                else {
                    logobj[type](msg);
                }

                // write to the database
                Logger.add(type, logmsg);
                
            }
            catch (err) {
                console.log("logger error: %s", err.message);
            }
        },

        error: function (msg, val1, val2) {
            if (logobj && logobj.error) {
                this.log('error', msg, val1, val2);
            }
            else {
                console.log(msg, val1);
            }
        },

        info: function (msg, val1, val2) {
            if (logobj && logobj.info) { 
                this.log('info', msg, val1, val2);
            }
            else {
                console.log(msg);
            }
        },

        debug: function (msg, val1, val2) {
            if (logobj && logobj.debug) {
                this.log('debug', msg, val1, val2);
            }
            else {
                console.log(msg);
            }            
        },

        warn: function (msg, val1) {
            if (logobj && logobj.warn) {
                this.log('warn', msg, val1);
            }
            else {
                console.log(msg);
            }                  
        }
    };

    module.exports = Logger;
})();