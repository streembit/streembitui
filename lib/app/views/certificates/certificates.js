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

    define(['appsrvc', 'user', 'definitions', 'errhandler', 'errcodes', './certificates.html!text'], function (appsrvc, user, defs, errhandler, errcodes, template) {

        function CertsVm() {

            var viewModel = {
                init: function (callback) {
                    try {

                        if (appsrvc.certificate && appsrvc.certificate.client_cert_details) {
                            viewModel.cert = appsrvc.certificate.client_cert_details;
                        }
                        viewModel.cert_encrypted_privkey = user.cert_encrypted_privkey;
                    }
                    catch (err) {
                        // streembit.notify.error("Certificates init error: %j", err);
                        streembit.notify.error(errhandler.getmsg(errcodes.UI_CERTIFICATES_INIT, err));
                    }
                }              
            };

            viewModel.init();

            return viewModel;
        }       

        return {
            viewModel: CertsVm,
            template: template
        };
    });

}());



