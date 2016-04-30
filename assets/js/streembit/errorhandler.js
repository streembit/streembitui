
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

var streembit = streembit || {};


streembit.Error = (function (module, logger, events) {
    
    module.Codes = {
        PEERCOMM: 0,
        FINDKEY: 1,
        FINDRANGE: 2,
        FINDMESSAGES: 3    
    }
    
    function handleFindMessages(err) {

        if (!err) {
            streembit.notify.error("Error in finding messages: unknow error" ); 
        }
        else {
            if (!err.message) {
                if (typeof err == "string") {
                    if (err.indexOf("0x0100") > -1) {
                        //  no messages exist for the account, not an error
                        streembit.notify.taskbarmsg("There are no messages for the account");
                    }
                    else {
                        streembit.notify.error("Error in finding messages: " + err);
                    }
                }
                else {
                    streembit.notify.error("Error in finding messages:  %j", err);
                }
            }
            else {
                if (err.message.indexOf("0x0100") > -1) {
                    //  no messages exist for the account, not an error
                    streembit.notify.taskbarmsg("There are no messages for the account");
                }
                else {
                    streembit.notify.error("Error in finding messages: " + err.message);
                }
            }
        }
    }
    
    module.init = function () {
        events.on(streembit.DEFS.EVENT_ERROR, function (errorcode, err) {
            switch (errorcode) {
                case module.Codes.PEERCOMM:                    
                    break;
                case module.Codes.FINDKEY:
                    break;
                case module.Codes.FINDRANGE:
                    break;
                case module.Codes.FINDMESSAGES:
                    handleFindMessages(err);
                    break;
                default:
                    break;
            }
        });    
    }
    
    return module;

}(streembit.Error || {}, streembit.logger, global.appevents));
