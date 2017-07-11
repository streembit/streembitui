/*

This file is part of DoorClient application. 
DoorClient is an open source project to manage reliable identities. 

DoorClient is a free software: you can redistribute it and/or modify it under the terms of the GNU General Public License 
as published by the Free Software Foundation, either version 3.0 of the License, or (at your option) any later version.

DoorClient is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty 
of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU General Public License for more details.

You should have received a copy of the GNU General Public License along with DoorClient software.  
If not, see http://www.gnu.org/licenses/.
 
-------------------------------------------------------------------------------------------------------------------------
Author: Tibor Zsolt Pardi 
Copyright (C) Authenticity Institute 2017
-------------------------------------------------------------------------------------------------------------------------

*/

'use strict';

const settings = require("settings");
const appsrvc = require("appsrvc");
const peermsg = require("peermsg");
var secrand = require('secure-random');

(function () {

    var mailsrvc = {};

    mailsrvc.send = function(action, params, doneCallback, failCallback) {
        var route = settings.moisrv.protocol + "://" + settings.moisrv.host + ":" + settings.moisrv.port + "/" + action;
        var data = JSON.stringify(params);
        $.ajax({
            url: route,
            type: "POST",
            dataType: "json",
            contentType: "application/json",
            data: data
        }).done(function (retval) {
            //  handle here the error
            if (!retval || retval.error ) {
                if (failCallback && failCallback.constructor == Function) {
                    failCallback(retval.error);
                }
                else {
                    doorclient.notify.error("Error in communicating with the MOI server %s", retval.error);
                }
            }
            else {
                doneCallback(retval);
            }
        }).fail(function (jqXHR, textStatus) {
            if (failCallback) {
                failCallback("server " + textStatus);
            }
            else {
                doorclient.notify.error("Error in communicating with the MOI server: server error");
            }
        });
    }


    mailsrvc.sendauth = function (action, payload, doneCallback, failCallback) {
        var sessionid = appsrvc.sessionid;
        if (!sessionid) {
            return failCallback("invalid user session ID")
        }

        var cryptokey = appsrvc.cryptokey;
        if (!cryptokey) {
            return failCallback("invalid user cryptography key")
        }

        payload[peermsg.MSGFIELD.SESSIONID] = sessionid;
        payload[peermsg.MSGFIELD.ACCOUNT] = appsrvc.username;
        payload[peermsg.MSGFIELD.EMAIL] = appsrvc.email;
        var id = secrand.randomBuffer(8).toString("hex");
        var data = peermsg.create_jwt_token(cryptokey, id, payload, null, null, appsrvc.username, null, null);        
        var jsondata = JSON.stringify(data);

        var route = settings.moisrv.protocol + "://" + settings.moisrv.host + ":" + settings.moisrv.port + "/" + action;

        $.ajax({
            url: route,
            type: "POST",
            dataType: "json",
            contentType: "application/json",
            data: jsondata
        }).done(function (retval) {
            //  handle here the error
            if (!retval || retval.error) {
                if (failCallback && failCallback.constructor == Function) {
                    failCallback(retval.error);
                }
                else {
                    doorclient.notify.error("Error in communicating with the MOI server %s", retval.error);
                }
            }
            else {
                doneCallback(retval);
            }
        }).fail(function (jqXHR, textStatus) {
            if (failCallback) {
                failCallback("server " + textStatus);
            }
            else {
                doorclient.notify.error("Error in communicating with the MOI server: server error");
            }
        });
    }


    module.exports = mailsrvc;

})();


