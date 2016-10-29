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

    define(['knockout', 'user', 'appsrvc', 'streembitnet', './netinfo.html!text'], function (ko, user, appsrvc, streembitnet, template) {

        function NetInfoVm(params) {
            this.route = params.route;
            this.account = ko.observable(user.name);
            this.public_key = ko.observable(user.public_key);
            this.seeds = ko.observableArray([]);
            this.port = ko.observable(appsrvc.port);
            this.address = ko.observable(appsrvc.address);
            this.upnpaddress = ko.observable(appsrvc.upnpaddress);
            this.upnpgateway = ko.observable(appsrvc.upnpgateway);
            this.transport = ko.observable(appsrvc.transport);
            this.net_connected = ko.observable(appsrvc.net_connected);

            var seedarray = streembitnet.getseeds();
            if (seedarray) {
                this.seeds(seedarray);
            }
        }           

        return {
            viewModel: NetInfoVm,
            template: template
        };
    });

}());



