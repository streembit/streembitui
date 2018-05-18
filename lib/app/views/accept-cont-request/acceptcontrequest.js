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
Author: Tibor Zsolt Pardi 
Copyright (C) Streembit 2017
-------------------------------------------------------------------------------------------------------------------------

*/

'use strict';

(function () {
    define([
        'appsrvc', 'appevents', 'bs58check', 'contactsutil', 'peermsg', 'errhandler', 'errcodes', 'uihandler', 'utilities', './acceptcontrequest.html!text'],
        function ( appsrvc, appevents, bs58check, contactsutil, peermsg, errhandler, errcodes, uihandler, utilities, template) {

        function AcceptContRequestVm(params) {
            if (!appsrvc.account_connected) {
                appevents.navigate("createaccount");
                // return streembit.notify.error("First connect to the Streembit network");
                return streembit.notify.error(errhandler.getmsg(errcodes.UI_FIRST_CONNECT_STR_NETWORK));
            }

            const keys = ['avatar', 'email', 'phone', 'addressVal', 'country', 'website', 'social'];

            var vm = {
                showcontent: ko.observable(false),
                request: ko.observable(),
                account: ko.observable(),
                public_key: ko.observable(),
                usertype: ko.observable(),
                port: ko.observable(),
                address: ko.observable(),
                transport: ko.observable(),
                connkey: ko.observable(),
                avatar: ko.observable(),
                email: ko.observable(),
                phone: ko.observable(),
                addressVal: ko.observable(),
                country: ko.observable(),
                website: ko.observable(),
                social: ko.observable(),

                addcontact: function () {

                    var unblocked = false;

                    try {

                        var contact_name = vm.account();
                        if (contact_name == appsrvc.username) {
                            return streembit.notify.error(errhandler.getmsg(errcodes.UI_ADDYOURSELFCONTACT));
                        }
   
                        // block the UI
                        uihandler.blockwin();

                        // create a contact object
                        var contact = {
                            public_key: vm.public_key(), // BS58 public key
                            publickeyhex: utilities.bs58toHex(vm.public_key()),
                            pkeyhash: utilities.keyToHexToRmd160ToBs58(vm.public_key()),
                            address: vm.address(),
                            port: vm.port(),
                            name: contact_name,
                            user_type: vm.usertype(),
                            protocol: vm.transport(),
                            connkey: "",
                            avatar: vm.avatar(),
                            email: vm.email(),
                            phone: vm.phone(),
                            addressVal: vm.addressVal(),
                            country: vm.country(),
                            website: vm.website(),
                            social: vm.social()
                        };

                        //  send the encrypted contact request reply with the connection key and 
                        //  the connection details of this user
                        contactsutil.add_contact(contact, function (err) {
                            // unblock the UI
                            uihandler.unblockwin();
                            unblocked = true;

                            if (err) {
                                return streembit.notify.error(errhandler.getmsg(errcodes.UI_ADDCONTACT, err));
                            }                            
                            
                            appevents.navigate("dashboard");
                        });

                    }
                    catch (err) {
                        // unblock the UI
                        uihandler.unblockwin();
                        unblocked = true;
                        streembit.notify.error(errhandler.getmsg(errcodes.UI_ADDCONTACT, err));
                    }

                    setTimeout(function () {
                        if (!unblocked) {
                            unblocked = true;
                            uihandler.unblockwin();
                        }
                    }, 20000);

                },

                parse: function (value) {
                    try {

                        if (!value) {
                            return vm.showcontent(false);
                        }

                        var lookupstr = "STREEMBIT CONTACT OFFER ---";
                        var pos = value.indexOf(lookupstr);
                        if (pos < 0) {
                            vm.showcontent(false);
                            return streembit.notify.error(errhandler.getmsg(errcodes.UI_INVALIDCONTACT));
                        }

                        var tmp1 = value.substring(pos + lookupstr.length);
                        pos = tmp1.indexOf("--- END STREEMBIT CONTACT OFFER");
                        if (pos < 0) {
                            vm.showcontent(false);
                            return streembit.notify.error(errhandler.getmsg(errcodes.UI_INVALIDCONTACT));
                        }
                        var jwtstr = $.trim(tmp1.substring(0, pos));

                        var payload = peermsg.getpayload(jwtstr);
                        var bs58buffer = bs58check.decode(payload.iss);
                        var publickey = bs58buffer.toString("hex");    
                        var decodedmsg = peermsg.decode(jwtstr, publickey);
                        if (!decodedmsg) {
                            return streembit.notify.error(errhandler.getmsg(errcodes.UI_SIGNATURE_VERIFICATION));
                        }
                     
                        var obj = JSON.parse(decodedmsg.data);
                        if (!obj.account || !obj.public_key || !obj.usertype || !obj.port || !obj.address || !obj.transport ) {
                            vm.showcontent(false);
                            return streembit.notify.error(errhandler.getmsg(errcodes.UI_INVALID_CONTACT_OFFER));
                        }

                        keys.forEach(key => {
                            obj[key] = obj[key] || null;
                        });

                        if (payload.iss != obj.public_key) {
                            vm.showcontent(false);
                            return streembit.notify.error(errhandler.getmsg(errcodes.UI_PUBLIC_KEY_MISMATCH));
                        }

                        vm.account(obj.account);
                        vm.public_key(obj.public_key);
                        vm.usertype(obj.usertype);
                        vm.port(obj.port);
                        vm.address(obj.address);
                        vm.transport(obj.transport);

                        keys.forEach(key => {
                            vm[key](obj[key]);
                        });

                        vm.showcontent(true);
                    }
                    catch (err) {
                        vm.showcontent(false);
                        streembit.notify.error(errhandler.getmsg(errcodes.UI_PARSING_CONTACT_OFFER));
                    }
                }
            };

            vm.request.subscribe(function (newValue) {
                vm.parse(newValue);                
            });

            return vm;
        }

        return {
            viewModel: AcceptContRequestVm,
            template: template
        };
    });

}());



