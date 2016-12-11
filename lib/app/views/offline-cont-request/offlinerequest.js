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

    define([
        'knockout', 'appsrvc', 'appevents', 'bs58check', 'secure-random', 'peermsg', './offlinerequest.html!text'],
        function (ko, appsrvc, appevents, bs58check, secrand, peermsg, template) {

        function OfflineRequestVm(params) {
            try {
                if (!appsrvc.cryptokey || !appsrvc.account_connected) {
                    appevents.navigate("initui");
                    return streembit.notify.error("First initialize the account by connecting to the Streembit network");
                }

                var pk = appsrvc.publicKeyBs58;

                this.showcontent = ko.observable(false);
                this.account = ko.observable(appsrvc.username);
                this.public_key = ko.observable(pk);
                this.usertype = ko.observable(appsrvc.usertype);
                this.port = ko.observable(appsrvc.port);
                this.address = ko.observable(appsrvc.address);
                this.transport = ko.observable(appsrvc.transport);

                this.request = {
                    account: appsrvc.username,
                    public_key: pk,
                    usertype: appsrvc.usertype,
                    port: appsrvc.port,
                    address: appsrvc.address,
                    transport: appsrvc.transport
                };

                var id = secrand.randomBuffer(8).toString("hex");
                var jwttoken = peermsg.create_jwt_token(appsrvc.cryptokey, id, JSON.stringify(this.request), null, null, pk, null, null);

                this.jsonstr = ko.observable(jwttoken);

                this.onshowcontent = function () {
                    this.showcontent(true);
                }
            }
            catch(err) {
                streembit.notify.error("Error in creating offline contact request %j", err);
            }
        }           

        return {
            viewModel: OfflineRequestVm,
            template: template
        };
    });

}());



