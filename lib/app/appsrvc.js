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

Application service implementation

*/


'use strict';

import appevents from "./libs/events/AppEvents";
import logger from './logger';
// knockout
import ko from "knockout";

let symobj = Symbol();

class AppSrvc {
    constructor(singleton) {
        if (symobj !== singleton) {
            throw new Error('Only one singleton instance is allowed.');
        }
        this.is_account_connected = ko.observable(false);
        this.peernode = null;
        this.transport_type = null;
        this.is_net_connected = false;
        this.netport = 0;
        this.netaddress = null;
        this.upnp_gateway = null;
        this.upnp_address = null;
        this.user_private_key = null;
        this.user_public_key = null;
        this.user_name = null;
        this.crypto_key = null;
    }

    static get instance() {
        if (!this[symobj])
            this[symobj] = new AppSrvc(symobj);

        return this[symobj]
    }

    load() {
        return new Promise((resolve, reject) => {

            appevents.onAppInit(function () {
                logger.info("Application is initialized");
            });

            resolve(true);         
        });
    }

    get account_connected() {
        return this.is_account_connected;
    }

    set account_connected(value) {
        this.is_account_connected(value);
    }

    get net_connected() {
        return this.is_net_connected;
    }

    set net_connected(value) {
        this.is_net_connected = value;
    }

    get node() {
        return this.peernode;
    }

    set node(value) {
        this.peernode = value;
    }

    get transport() {
        return this.transport_type;
    }

    set transport(value) {
        this.transport_type = value;
    }

    get port() {
        return this.netport;
    }

    set port(value) {
        this.netport = value;
    }

    get address() {
        return this.netaddress;
    }

    set address(value) {
        this.netaddress = value;
    }

    get upnpgateway() {
        return this.upnp_gateway;
    }

    set upnpgateway(value) {
        this.upnp_gateway = value;
    }

    get upnpaddress() {
        return this.upnp_address;
    }

    set upnpaddress(value) {
        this.upnp_address = value;
    }

    get privatekey() {
        return this.user_private_key;
    }

    set privatekey(value) {
        this.user_private_key = value;
    }

    get publickey() {
        return this.user_public_key;
    }

    set publickey(value) {
        this.user_public_key = value;
    }

    get username() {
        return this.user_name;
    }

    set username(value) {
        this.user_name = value;
    }

    get cryptokey() {
        return this.crypto_key;
    }

    set cryptokey(value) {
        this.crypto_key = value;
    }
}

export default AppSrvc.instance