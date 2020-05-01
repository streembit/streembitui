/*

This file is part of STREEMBIT application. 
STREEMBIT is an open source project to manage reliable identities. 

STREEMBIT is a free software: you can redistribute it and/or modify it under the terms of the GNU General Public License 
as published by the Free Software Foundation, either version 3.0 of the License, or (at your option) any later version.

STREEMBIT is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty 
of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU General Public License for more details.

You should have received a copy of the GNU General Public License along with STREEMBIT software.  
If not, see http://www.gnu.org/licenses/.
 
-------------------------------------------------------------------------------------------------------------------------
Author: Tibor Zsolt Pardi 
Copyright (C) Authenticity Institute 2017
-------------------------------------------------------------------------------------------------------------------------

*/

'use strict';

(function () {

    define(['appevents', 'appsrvc', './connection.html!text'], function (appevents, appsrvc, template) {

        function ConnectionVm() {
            const CONNECTION_STATUS = [
                'Peer Connected',
                'No Connection!'
            ];

            var viewModel = {
                lastupdate: ko.observable(Date.now()),
                connect: ko.observable(false),
                txtConnectStatus: ko.observable(CONNECTION_STATUS[1]),
                connectInfoPanel: ko.observable(false),
                transport: ko.observable(''),
                host: ko.observable(''),
                port: ko.observable(''),
                accountConnected: ko.observable(''),
                account: ko.observable(''),
                pkhash: ko.observable(''),
                publickey: ko.observable(''),

                init: function (callback) {
                    appevents.addListener("on-connection-status", viewModel.onConnectionStatus);
                },

                
                
                onConnectionStatus: function (status, host = null, port = null) {
                    if ((!host && !port) || (host === appsrvc.host && port === appsrvc.port)) {
                        viewModel.connect(status);
                        viewModel.txtConnectStatus(status ? CONNECTION_STATUS[0] : CONNECTION_STATUS[1]);
                    }
                },

                showConnectionDetails: function () {
                    if (!this.connect()) {
                        return;
                    }
                    
                    this.transport(appsrvc.transport);
                    this.host(appsrvc.host);
                    this.port(appsrvc.port);
                    this.accountConnected(appsrvc.account_connected);
                    this.account(appsrvc.username);
                    this.pkhash(appsrvc.privateKeyHex);
                    this.publickey(appsrvc.pubkeyhash);

                    this.connectInfoPanel(true);
                },

                closePanel: function () {
                    this.connectInfoPanel(false);
                }
            };

            viewModel.init();

            return viewModel;
        }

        return {
            viewModel: ConnectionVm,
            template: template
        };
    });

}());
