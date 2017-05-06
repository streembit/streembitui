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


(function () {
    var logger = require("logger");

    var dataDir = {

        makedir: function () {
            return new Promise(function (resolve, reject) {
                if (!streembit.globals.nwmode) {
                    return resolve();
                }

                var datapath = null;
                var datadir = 'data';

                var path = nwrequire('path');
                var fs = nwrequire('fs');

                // the data paths is in the same directory as the executable
                var wdir = process.cwd();
                datapath = path.join(wdir, datadir);

                logger.info("Application data path: %s", datapath);

                fs.open(datapath, 'r', function (err, fd) {
                    if (err && err.code == 'ENOENT') {
                        /* the directory doesn't exist */
                        fs.mkdir(datapath, function (err) {
                            if (err) {
                                // failed to create the log directory, most likely due to insufficient permission
                                reject(err);
                            }
                            else {
                                global.datapath = datapath;
                                resolve();
                            }
                        });
                    }
                    else {
                        global.datapath = datapath;
                        resolve();
                    }
                });        
            });

            
        }

    };

    module.exports = dataDir;
})();