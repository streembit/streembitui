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
        'appsrvc', 'appevents', 'bs58check', 'errhandler', 'errcodes', 'secure-random', 'peermsg', './offlinerequest.html!text'],
        function ( appsrvc, appevents, bs58check, errhandler, errcodes, secrand, peermsg, template) {

        const MAX_FILE_SIZE = 64 * 1024;

        function OfflineRequestVm(params) {
            try {
                if (!appsrvc.cryptokey || !appsrvc.account_connected) {
                    appevents.navigate("initaccount");
                    return streembit.notify.error(errhandler.getmsg(errcodes.UI_INITIALIZE_ACCOUNT_BY_CONNECT_STR));
                }

                var pk = appsrvc.publicKeyBs58;

                this.showcontent = ko.observable(false);
                this.account = ko.observable(appsrvc.username);
                this.public_key = ko.observable(pk);
                this.usertype = ko.observable(appsrvc.usertype);
                this.port = ko.observable(appsrvc.port);
                this.address = ko.observable(appsrvc.host);
                this.transport = ko.observable(appsrvc.transport);
                this.jsonstr = ko.observable('');
                this.email = ko.observable('');
                this.phone = ko.observable('');
                this.addressVal = ko.observable('');
                this.country = ko.observable('');
                this.website = ko.observable('');
                this.social = ko.observable('');
                this.avatar = ko.observable('');

                this.request = {
                    account: appsrvc.username,
                    public_key: pk,
                    usertype: appsrvc.usertype,
                    port: appsrvc.port,
                    address: appsrvc.host,
                    transport: appsrvc.transport,
                    avatar: appsrvc.avatar
                };

                this.genJsonToken = () => {
                    const id = secrand.randomBuffer(8).toString("hex");
                    if(this.request.avatar != null) {
                        localStorage.setItem('avatar', this.request.avatar);
                    }
                    const jwttoken = peermsg.create_jwt_token(appsrvc.cryptokey, id, JSON.stringify(this.request), null, null, pk, null, null);

                    const offer = `-- BEGIN STREEMBIT CONTACT OFFER ---\n${jwttoken}\n--- END STREEMBIT CONTACT OFFER ---`;
                    this.jsonstr(offer);
                };

                this.onshowcontent = () => {
                    this.showcontent(true);
                };

                this.copyToClipboard = () => {
                    $('#contact-offer').select();
                    try {
                        document.execCommand('copy');
                        streembit.notify.success('Contact offer has been copied to clipboard');
                    } catch (e) {
                        streembit.notify.error(errhandler.getmsg(errcodes.UI_COPYING_NOT_SUPPORTED));
                    }

                    if ( document.selection ) {
                        document.selection.empty();
                    } else if ( window.getSelection ) {
                        window.getSelection().removeAllRanges();
                    }
                };

                this.processAvatar = (data, e) => {
                    const file = e.target.files[0];
                    if (file.size > MAX_FILE_SIZE) {
                        return streembit.notify.error(errhandler.getmsg(errcodes.UI_MAX_ALLOW_FILE_SIZE, +Math.floor(file.size/1024)+ 'Kb'));
                    }
                    const reader  = new FileReader();
                    if (file) {
                        reader.readAsDataURL(file);
                    }

                    reader.onloadend = (evt) => {
                        this.avatar(reader.result);
                        this.request.avatar = ko.utils.unwrapObservable(this.avatar());
                        // appsrvc.avatar = this.request.avatar;
                        this.genJsonToken();
                    };
                    reader.onerror = (err) => {
                        return streembit.notify.error(err.message);
                    };
                };

                this.processEmail = () => {
                    this.processFiled('email');
                };

                this.processPhoneNum = () => {
                    this.processFiled('phone');    
                };

                this.processAddress = () => {
                    this.processFiled('addressVal');    
                };

                this.processCountry = () => {
                    this.processFiled('country');    
                };

                this.processWebsite = () => {
                    this.processFiled('website');    
                };

                this.processSocial = () => {
                    this.processFiled('social');    
                };

                this.processFiled = key => {
                    var value = this[key]();

                    if(!value) {
                        if(this.request[key]) {
                            delete this.request[key];
                            this.genJsonToken();
                        }
                        return;
                    }

                    if(key === 'email' && !/^[a-zA-Z][\w\.-]*@[a-zA-Z]+\.[a-zA-Z]{2,}$/.test(value)) {
                        if(this.request[key]) {
                            delete this.request[key];
                            this.genJsonToken();
                        }
                        return;
                    }
                    

                    this.request[key] = ko.utils.unwrapObservable(this[key]());
                    this.genJsonToken();
                };

                this.rmAvatar = () => {
                    this.avatar('');
                    delete this.request.avatar;
                    this.genJsonToken();
                };

                this.genJsonToken();
            }
            catch(err) {
                streembit.notify.error(errhandler.getmsg(errcodes.UI_CREATING_OFF_CONTACT_REQ, err));
            }
        }           

        return {
            viewModel: OfflineRequestVm,
            template: template
        };
    });

}());



