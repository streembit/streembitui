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
Author: Streembit team
Copyright (C) Streembit 2017
-------------------------------------------------------------------------------------------------------------------------

*/

'use strict';


import appevents from "appevents";
import logger from 'applogger';
import devbctansport from 'devbctansport';
import errhandler from "errhandler";
import errcodes from "errcodes";

let m_bctransport = null;

class BcService {

    constructor() {    
        this.bctransport = null;
        this.eventListeners = [];
    }

    static get bctransport() {
        return m_bctransport;
    }

    static set bctransport(value) {
        m_bctransport = value;
    }

    requestPayment(data, callback) {
        var label = data.label || null,
            amount = +data.amount || null,
            message = data.message || null;

        //TODO validate the params
        if (!callback || typeof callback !== 'function') {
            return logger.error("invalid callback at bcservice.requestPayment, callback must be a function");
        }
        if (label && !/^[a-z0-9 _\-]{,40}$/im.test(label)) {
            return callback('Invalid Label');
            return callback(errhandler.getmsg(errcodes.UI_INVALID_LABEL))
        }
        if (amount && (isNaN(amount) || amount <= 0)) {
            return callback('Invalid Amount');
        }
        if (message && !/^[a-z0-9 ,\._!\?#%&\(\)\+\-]{2,100}$/im.test(message)) {
            return callback('Invalid Message');
        }

        // TODO
        // use a set of hard coded addresses here and return it one by one
        var mock_addr = [
            '1ASxnLK197VdAfwMjSpRiM55ybA5UvBZ5V',
            '1JA2YH2uyiLWQk83FX7hAuhmX8HXojE4HB',
            '16zL1wcmQeyhqCj7c8NUwmP6GwrNUWk7RN',
            '1LKcpXyFFNhRvy3yZyUQMUg6FpGRKse4rS',
            '19qd2eGsKE4yfa9Bkvt6XeV7paxgyUpVD9',
            '14qqjbKXVhV6hbYFXGACsExjaCon7mcjSU',
            '1KbB4F6j7pdQwiXDbnUkMfoPKGHjeE6U8g',
            '19HEGLuvn9W8HT5jE1sxaWkJ8BRr9mFzwD',
            '133wmmCmv8YeSkuwbDuYvk5gbAwQSw2UYS',
            '1BTdZe6AoRX4HzPaXYTvc4PTmJYGibfuhW',
            '1DBBKt6AwYzPVkXPZDNKpS45udyUvhasLV',
            '1Esjw324rXARMdzvkxArDAXbJeu2T4AJbt',
            '1MFDZmBV9PiQ9yneSd2CEj1LbG2Q9PRHUF',
            '1MNGgka8eXNtD1PYEqLzJ7V5EWEN6y17FH',
            '1Cs4MG93VJcmePb1kusUjc7EeTXWgSfHBG',
            '1AVL2ssCQ7YDQQXaxuaKpRNRhvu6nA6hp8',
            '17Y2RSnnK33EACACoqcSULNhvGPDsvuNLX',
            '1NEWt3Ke2xbX8izxibfxadHVZuwrqbeSXN',
            '3Hwuzp86zrH6VQnrXaH36cikBNZke1uytg',
            '1FGmiTi3q2569ZTMrpRLTCpBByXSMF77Sj',
            '1LevQfNfftev9GmyYd2gGvUdXhFsd4LUCJ',
            '1A29YCUrVcBx2pmbbGRHofUwGeoew7qXYt',
            '15tqqxQWvXW4tPjrePVDEyUBfbV3KYGwJS',
            '1EpD6ozPqS2jfwV9xBj5gUvVMYhoW9LAGC',
            '1AHaArmYbxgJSXxqVKj6zXjkNoa7Gy69CC',
            '1KW4eBun9fZ42MSrsBLXaSNsdLMsBBVvCc',
            '14SQJk82BAGXh8rxAFdCRhUvjgjvnYpoH5',
            '1HKrATZcW5NvdmVU776yhXWcSn6HvsCMzU',
            '12o2vgWEf9HDJ3umMD8571z63jny9JxW7g',
            '1CuKwpmjMK4EY8sE7k8wkNwLeuWhyQ7tAd'
        ];

        var address = mock_addr[Math.floor(Math.random() * mock_addr.length)];

        return callback(null, address);

        // the address generation procedure will be here

    }

    signAndVerifyMessage(data, callback){

        var mock_addr = [
            '1ASxnLK197VdAfwMjSpRiM55ybA5UvBZ5V',
            '1JA2YH2uyiLWQk83FX7hAuhmX8HXojE4HB',
            '16zL1wcmQeyhqCj7c8NUwmP6GwrNUWk7RN',
            '1LKcpXyFFNhRvy3yZyUQMUg6FpGRKse4rS',
            '19qd2eGsKE4yfa9Bkvt6XeV7paxgyUpVD9',
            '14qqjbKXVhV6hbYFXGACsExjaCon7mcjSU',
            '1KbB4F6j7pdQwiXDbnUkMfoPKGHjeE6U8g',
            '19HEGLuvn9W8HT5jE1sxaWkJ8BRr9mFzwD',
            '133wmmCmv8YeSkuwbDuYvk5gbAwQSw2UYS',
            '1BTdZe6AoRX4HzPaXYTvc4PTmJYGibfuhW',
            '1DBBKt6AwYzPVkXPZDNKpS45udyUvhasLV',
            '1Esjw324rXARMdzvkxArDAXbJeu2T4AJbt',
            '1MFDZmBV9PiQ9yneSd2CEj1LbG2Q9PRHUF',
            '1MNGgka8eXNtD1PYEqLzJ7V5EWEN6y17FH',
            '1Cs4MG93VJcmePb1kusUjc7EeTXWgSfHBG',
            '1AVL2ssCQ7YDQQXaxuaKpRNRhvu6nA6hp8',
            '17Y2RSnnK33EACACoqcSULNhvGPDsvuNLX',
            '1NEWt3Ke2xbX8izxibfxadHVZuwrqbeSXN',
            '3Hwuzp86zrH6VQnrXaH36cikBNZke1uytg',
            '1FGmiTi3q2569ZTMrpRLTCpBByXSMF77Sj',
            '1LevQfNfftev9GmyYd2gGvUdXhFsd4LUCJ',
            '1A29YCUrVcBx2pmbbGRHofUwGeoew7qXYt',
            '15tqqxQWvXW4tPjrePVDEyUBfbV3KYGwJS',
            '1EpD6ozPqS2jfwV9xBj5gUvVMYhoW9LAGC',
            '1AHaArmYbxgJSXxqVKj6zXjkNoa7Gy69CC',
            '1KW4eBun9fZ42MSrsBLXaSNsdLMsBBVvCc',
            '14SQJk82BAGXh8rxAFdCRhUvjgjvnYpoH5',
            '1HKrATZcW5NvdmVU776yhXWcSn6HvsCMzU',
            '12o2vgWEf9HDJ3umMD8571z63jny9JxW7g',
            '1CuKwpmjMK4EY8sE7k8wkNwLeuWhyQ7tAd'
        ];

        var recipientaddress = data.recipientaddress || null
        
        if(!callback || typeof callback !== 'function') {
            return logger.error("callback must be a function");
        }
        if(!recipientaddress){
            return callback("Empty address");
        }
       
        if (recipientaddress && !/^[a-z0-9 _\-]{1,40}$/im.test(recipientaddress)) {
            return callback('Invalid Address');
        }

        switch (data.type) {
            case "sign":
                if ($.inArray(recipientaddress, mock_addr) === -1) {
                    return callback('Invalid sign');
                }
                var msg = 'MIIFDjBABgkqhkiG9w0BBQ0wMzAbBgkqhkiG9w0BBQwwDgMBQGCCqGSIb3DQMHBAgD1kGN4ZslJgSCBMi1xk9jhlPxPc9g73NQbtqZwI+9X5OhpSg/2ALxlCCjbqvzgSu8gfFZ4yo+X0R+meOaudPTBxoSgCCM51poFgaqt4l6VlTN4FRpj+c/WcblK948UAda/bWVmZjXfY4Tztah0CuqlAldOQBzu8TwE7WDH0ga/iLNvWYexG7FHLRiq5hTj0g9mUPEbeTXuPtOkTEb';
                break;
            case "verify":
                if ($.inArray(recipientaddress, mock_addr) === -1) {
                    return callback('Invalid verify');
                }
                var msg = true;
                break;
        }

        return callback(null, msg);

    }

    onBcCommand(payload) {
        try {
            console.log("onBcCommand");
            if (!BcService.bctransport) {
                // the this.bctransport object must be initialized
                return logger.error("invalid bctransport at bcservice.onBcCommand");
            }

            var command = payload.cmd;
            if (!command || typeof command != "string" || !command.length) {
                return logger.error("invalid command at bcservice.onBcCommand, command must be a valid string");
            }

            var callback = payload.callback;
            if (callback) {
                if (typeof callback != "function") {
                    return logger.error("invalid callback at bcservice.onBcCommand, callback must be a function");
                }
            }

            // validate the data item for commands that expect data
            switch (command) {
                case "txlist":
                case "receive":
                case "send":
                    if (!payload.data) {
                        // return callback("invalid data parameter at bcservice.onBcCommand, data exists for " + command);
                        return callback(errhandler.getmsg(errcodes.UI_INVALID_DATA_PARAMS_AT_BCSERVICE) + command);
                    }
                    break;
                default:
                    break;
            }

            switch (command) {
                case "send":
                    BcService.bctransport.send(payload.data, callback);
                    break;
                case "requestpayment":
                    this.requestPayment(payload.data, callback);
                    break;
                case "sign":
                    payload.data.type = 'sign';
                    this.signAndVerifyMessage(payload.data, callback);
                    break;
                case "verify":
                    payload.data.type = 'verify';
                    this.signAndVerifyMessage(payload.data, callback);
                default:
                    // callback("invalid callback at bcservice.onBcCommand, callback must be a function");
                    callback(errhandler.getmsg(errcodes.UI_INVALID_CB_ATBCSERVICE));
            }
        }
        catch (err) {
            var errmsg = "onBcCommand exception: " + err.message;
            if (payload && payload.callback && typeof callback == "function") {
                payload.callback(errmsg);
            }
            else {
                logger.error(errmsg);
            }
        }
    }

    onBcEvent(payload) {

    }

    init() {
        return new Promise(
            (resolve, reject) => {
                try {
                    logger.debug("bcservice init");

                    if (streembit.globals.devbcnet) {
                        BcService.bctransport = devbctansport;
                    }
                    else {
                        //TODO live bc transport
                        return reject("live BC transport is not implemented. Set the streembit.globals.devbcnet flag to true to use the DEV bc transport.")
                    }

                    BcService.bctransport.init();

                    // create an event handlers
                    appevents.addListener("on-bc-command", this.onBcCommand);
                    appevents.addListener("on-bc-event", this.onBcEvent);
                    appevents.addListener("on-payment-request", this.requestPayment);
                    appevents.addListener("on-sign-verify-message", this.signAndVerifyMessage);

                    resolve();

                    //
                }
                catch (err) {
                    reject("bchandler init error: " + err.message);
                }
            }
        );       
        
    }

}

export default BcService;


