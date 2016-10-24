'use strict';

class Network {
    constructor() {
        this.isconnected = false;
    }

    get connected() {
        return this.isconnected;
    }

    set connected(value) {
        this.isconnected = value;
    }

    validate_connection(callback) {
        callback();
    }

    put(key, value, callback) {
        callback();
    }

    get(key, callback) {
        callback();
    }

    find_contact(account, public_key) {
        return new Promise(function (resolve, reject) {
            resolve();
        });
    }

    peer_send(contact, data) {
    }

    get_range (msgkey, callback) {
        callback();
    }

    delete_item (key, request) {
    }  

    getseeds() {
        return [];
    }  
}

export default Network;