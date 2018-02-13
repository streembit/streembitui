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
Author: Streembit team
Copyright (C) Streembit 2018
-------------------------------------------------------------------------------------------------------------------------

*/

'use strict';

(function () {

    var appevents = require("appevents");
    var logger = require('./logger');
    var appsrvc = require('appsrvc');
    var peermsg = require('peermsg');

    var call = {};

    // TODO monitor the participants, webrtc connections, etc.
    function monitor() {

    }

    call.participants = [];

    call.hangup = function () {
    };

    call.init = function () {
        monitor();
    };

    module.exports = call;

})();