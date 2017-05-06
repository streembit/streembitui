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
    var logger = require('./kad/lib/logger');

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
            logobj = new logger(numloglevel);
        },

        log: function (type, msg, val1, val2) {
            try {
                var logmsg = msg;
                if (val2 && val1) {
                    logmsg = util.format(msg, val1, val2);
                    logobj[type](util.format(msg, val1, val2));
                }
                else if (val1) {
                    logmsg = util.format(msg, val1);
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