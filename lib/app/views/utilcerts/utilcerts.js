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

    define(
        ['appsrvc', 'user', 'definitions', 'jsrsasign', 'uihandler', 'moisrvc', './view.html!text'],
        function (appsrvc, user, defs, jsrsa, uihandler, moisrvc, template) {

        function CertItem(index, data) {
            var viewModel = ko.mapping.fromJS(data);
            viewModel.index = ko.observable(index);
            viewModel.template = ko.observable('');

            return viewModel;
        }

        function UtilCertVm() {

            var viewModel = {
                encrypted_private_key: ko.observable(),
                certificates: ko.observableArray(),

                init: function (callback) {
                    try {
                        if (appsrvc.certificate && appsrvc.certificate.client_cert_details) {
                            viewModel.cert = appsrvc.certificate.client_cert_details;
                        }
                        //debugger;
                        viewModel.cert_encrypted_privkey = user.cert_encrypted_privkey;

                        viewModel.publickey = appsrvc.publickeyhex;
                        viewModel.encoded_publickey = appsrvc.publicKeyBs58;

                        this.getdata();
                    }
                    catch (err) {
                        doorclient.notify.error("Certificates init error: %j", err);
                    }
                },

                getdata: function () {
                    try {
                        var self = this;

                        this.certificates([]);

                        // invoke blockui
                        uihandler.blockwin();

                        moisrvc.sendauth("getutilcerts", {},
                            function (ret) {
                                // unblock when ajax activity stops 
                                uihandler.unblockwin();

                                if (!ret || ret.status != 0) {
                                    return doorclient.notify.error("Error in getting file cabinets");
                                }

                                if (ret.result) {
                                    var index = 1;
                                    var collection = [];
                                    ret.result.forEach((item) => {
                                        var cert = new CertItem(index++, item);
                                        collection.push(cert);
                                    });

                                    self.certificates(collection);
                                }
                            },
                            function (err) {
                                // unblock when ajax activity stops 
                                uihandler.unblockwin();
                                doorclient.notify.error("Error in getting file cabinets", err);
                            }
                        );
                    }
                    catch (e) {
                        uihandler.unblockwin();
                        doorclient.notify.error("Error in getting file cabinets %", e.message);
                    }
                },

                generate_ecckey: function (curve) {
                    if (curve != "secp256k1" && curve != "secp256r1" && curve != "secp384r1") {
                        throw new Error("Invalid EC curve");
                    }
                    var ecKeypair = jsrsa.KEYUTIL.generateKeypair("EC", curve);
                    return ecKeypair;
                },

                generate_rsakey: function (algo) {
                    try {

                        var rsaKeypair = jsrsa.KEYUTIL.generateKeypair("RSA", 2048);
                        return rsaKeypair;
                    }
                    catch (err) {
                        throw err;
                    }
                },

                add_utilcert: function () {
                    try {
                        //debugger;
                        //var action;

                        var self = this;

                        var certdetails = { "type": "x509", "bits": 0, "publickey": 0, "algo": 0 };

                        var pubkey = user.public_key;
                        var pkey = this.generate_rsakey();                        

                        if (!pkey || !pkey.prvKeyObj) {
                            throw new Error("unexpeted error in generating key pair");
                        }

                        var pkbdf2pwd = user.pkbdf2_password_hash;
                        var encprvk = jsrsa.KEYUTIL.getPEM(pkey.prvKeyObj, "PKCS8PRV", pkbdf2pwd);
                        this.encrypted_private_key(encprvk);

                        certdetails.publickey = jsrsa.KEYUTIL.getPEM(pkey.pubKeyObj);
                        certdetails.algo = "RSA";
                        certdetails.bits = 2048;

                        var data = {
                            publickey: pubkey,
                            algo: "RSA2048",
                            cert: certdetails,
                            identity: "AccountableAnonymity"
                        };

                        moisrvc.sendauth("addutilcert", data,
                            function (result) {
                                // unblock when ajax activity stops 
                                uihandler.unblockwin();

                                if (!result || result.status != 0) {
                                    return doorclient.notify.error("invalid certificate save result value returned from the server");
                                }

                                // get the data
                                self.getdata();
                            },
                            function (err) {
                                // unblock when ajax activity stops 
                                uihandler.unblockwin();
                                doorclient.notify.error("Error in generating utility certificate", err);
                            }
                        );

                    }
                    catch (err) {
                        uihandler.unblockwin();
                        doorclient.notify.error("Error in generating utility certificate", err);
                    }  
                }
            };

            viewModel.init();

            return viewModel;
        }       

        return {
            viewModel: UtilCertVm,
            template: template
        };
    });

}());



