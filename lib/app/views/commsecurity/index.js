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

(function () {

    define(['appsrvc', 'user', 'definitions', './view.html!text'], function (appsrvc, user, defs, template) {

        function CommSecurityVm() {

            var viewModel = {
                init: function (callback) {
                    try {
                        viewModel.publickey = appsrvc.publickeyhex;
                        viewModel.encoded_publickey = appsrvc.publicKeyBs58;
                        viewModel.privatekey = appsrvc.privateKeyHex;
                    }
                    catch (err) {
                        doorclient.notify.error("Certificates init error: %j", err);
                    }
                }              
            };

            viewModel.init();

            return viewModel;
        }       

        return {
            viewModel: CommSecurityVm,
            template: template
        };
    });

}());



