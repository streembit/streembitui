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

var configdef = require('../config.json!');
var appconfig = require('../config.app.json!');

var Config = {

    init: function () {
        if (!configdef) {
            throw new Error("config.json configration file is missing");
        }

        if (!configdef.appconfig) {
            throw new Error("appconfig section is missing from config.json configration");
        }

        streembit.globals.nwmode = appconfig.nwmode == false ? false : true;
        streembit.globals.wsprotocol = appconfig.wsprotocol || "http";
        if (!streembit.globals.nwmode) {
            configdef.appconfig.transport = "ws";
            configdef.appconfig.wspublish = true;
            configdef.appconfig.askwspublish = true;
            configdef.appconfig.wsfallback = true;
        }
    }
}

Object.defineProperty(Config, 'appconfig', {
    get: function () {
        return configdef.appconfig;
    }
})

module.exports = Config;

