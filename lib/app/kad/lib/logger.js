/*
 
This file is part of Streembit application. 
Streembit is an open source communication application. 

Streembit is a free software: you can redistribute it and/or modify it under the terms of the GNU General Public License 
as published by the Free Software Foundation, either version 3.0 of the License, or (at your option) any later version.

Streembit is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of 
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU General Public License for more details.

You should have received a copy of the GNU General Public License along with Streembit software.  
If not, see http://www.gnu.org/licenses/.
 
-------------------------------------------------------------------------------------------------------------------------
Author: Tibor Zsolt Pardi 
Copyright (C) Streembit 2017
-------------------------------------------------------------------------------------------------------------------------
  
*/

/**
 * Implementation is based on https://github.com/kadtools/kad 
 * Huge thanks to Gordon Hall https://github.com/gordonwritescode & https://github.com/bookchin the author of kad library!
 * @module kad
 * @license GPL-3.0
 * @author Gordon Hall gordon@gordonwritescode.com
 */


'use strict';


/**
* Kad, by default, prints log messages to the console using pretty-printed
* status messages. There are different types of messages indicating the nature
* or severity, `error`, `warn`, `info`, `debug`. You can tell Kad which of these
* messages types you want to see by passing a {@link Logger} with option from
* 0 - 4.
* @constructor
* @param {Number} level - Log verbosity (0-4)
* @param {String} prefix - Optional prefix for log output
*/
function Logger(level, prefix) {
    if (!(this instanceof Logger)) {
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
Logger.prototype._bindLogTypes = function () {
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

module.exports = Logger;