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

    var appevents = require("appevents");
    var logger = require('./logger');
    var appsrvc = require('appsrvc');
    var peermsg = require('peermsg');
    var database = require('./database');
    var user = require('./user');

    var auth = {};

    function validateMessage(params, contact, callback) {
        var is_update_key = false, is_system_update_key = false, msgid = 0;

        try {
            var payload = peermsg.getpayload(params.value);
            if (!payload || !payload.data || !payload.data.type) {
                return callback("validateMessage error invalid payload");
            }

            if (payload.data.type == peermsg.MSGTYPE.PUBPK ||
                payload.data.type == peermsg.MSGTYPE.UPDPK ||
                payload.data.type == peermsg.MSGTYPE.DELPK) {
                if (!payload.data[peermsg.MSGFIELD.PUBKEY]) {
                    return callback("validateMessage error invalid public key payload");
                }
                is_update_key = true;
            }

            var account_key;
            if (is_update_key) {
                //  is_update_key == true -> the publisher claims this is a public key store, update or delete message
                //  check if the existing key does exits and if yes then validate the message
                account_key = params.key;
            }
            else {
                //  get the iss field of the JSON web token message
                account_key = payload.iss;
            }

            if (!account_key) {
                return callback("validateMessage error: invalid public key account field");
            }

            if (payload.data.type == peermsg.MSGTYPE.DELMSG) {
                // only the owner (recipient) of the message can delete the message
                try {
                    var msgtags = params.key.split("/");
                    if (!msgtags || !msgtags.length || msgtags.length < 3 || msgtags[0] != account_key || msgtags[1] != "message") {
                        return callback("validateMessage error: delete message failed.");
                    }
                }
                catch (err) {
                    return callback("validateMessage error: delete message failed, parse exception");
                }
            }
        }
        catch (err) {
            return callback("onKadMessage error: " + err.message);
        }

        var node = appsrvc.node;
        node.get(account_key, function (err, value) {
            try {
                if (err) {
                    if (is_update_key && err.message && err.message.indexOf("0x0100") > -1) {
                        logger.debug('validateMessage PUBPK key not exists on the network, allow to complete PUBPK message');
                        //  TODO check whether the public key matches with private network keys
                        return callback(null, true);
                    }
                    else {
                        return callback('validateMessage get existing PK error: ' + err.message);
                    }
                }
                else {
                    logger.debug("validateMessage decode wot message");
                    var stored_payload = peermsg.getpayload(value);
                    var stored_pkkey = stored_payload.data[peermsg.MSGFIELD.PUBKEY];
                    if (!stored_pkkey) {
                        return callback('validateMessage error: stored public key does not exists');
                    }

                    //  if this is a private network then the public key must matches with the account's key in the list of public key
                    //  TODO check whether the public key matches with private network keys

                    if (payload.data.type == peermsg.MSGTYPE.PUBPK) {
                        if (payload.data[peermsg.MSGFIELD.PUBKEY] != stored_pkkey) {
                            return callback('validateMessage error: stored public key and message public key do not match');
                        }
                    }

                    logger.debug("validateMessage validate account: " + account_key + " public key: " + stored_pkkey);

                    if (payload.data.type == peermsg.MSGTYPE.PUBPK ||
                        payload.data.type == peermsg.MSGTYPE.UPDPK ||
                        payload.data.type == peermsg.MSGTYPE.DELPK ||
                        payload.data.type == peermsg.MSGTYPE.OMSG ||
                        payload.data.type == peermsg.MSGTYPE.DELMSG) {

                        var decoded_msg = peermsg.decode(params.value, stored_pkkey);
                        if (!decoded_msg) {
                            return callback('VERIFYFAIL ' + account);
                        }

                        //  passed the validation -> add to the network
                        logger.debug('validateMessage validation for msgtype: ' + payload.data.type + '  is OK');

                        //node._log.debug('data: %j', params);
                        callback(null, true);
                    }
                }
            }
            catch (val_err) {
                logger.error("validateMessage error: " + val_err.message);
            }
        });
    }

    function isContactAllowed (contact) {
        //TODO for private networks    
        return true;
    }

    auth.onKadMessage = function(message, contact, next) {
        try {

            // TODO check for the private network
            if (!isContactAllowed(contact)) {
                return next(new Error('Message dropped, reason: contact ' + contact.account + ' is not allowed'));
            }

            if (!message || !message.method || message.method != "STORE" ||
                !message.params || !message.params.item || !message.params.item.key) {

                // only validate the STORE messages
                return next();
            }

            logger.debug('validate STORE key: ' + message.params.item.key);

            validateMessage(message.params.item, contact, function (err, isvalid) {
                if (err) {
                    return next(new Error('Message dropped, error: ' + ((typeof err === 'string') ? err : (err.message ? err.message : "validation failed"))));
                }
                if (!isvalid) {
                    return next(new Error('Message dropped, reason: validation failed'));
                }

                // valid message
                return next();
            });
        }
        catch (err) {
            logger.error("onKadMessage error: " + err.message);
            next("onKadMessage error: " + err.message);
        }
    }

    auth.expireHandler = function(data, callback) {
        try {
            if (!data || !data.key || !data.value) {
                logger.debug("delete invalid message");
                return callback(true);
            }

            var msgobj = JSON.parse(data.value);
            if (!msgobj || !msgobj.value) {
                // invalid data
                return callback(true);
            }

            // get the payload
            var payload = peermsg.getpayload(msgobj.value);

            if (data.key.indexOf("/") == -1) {
                //  The account-key messages publishes the public key of the account to the network
                //  Delete the message if it is marked to be deleted, otherwise never delete the account-key messages           

                if ((!payload || !payload.data || !payload.data.type) || payload.data.type == peermsg.MSGTYPE.DELPK) {
                    logger.debug('DELETE public key of ' + data.key);
                    return callback(true);
                }

                // return, no delete
                return callback();
            }

            if (!msgobj.timestamp) {
                logger.debug("delete message without timestamp, key: %s", data.key);
                return callback(true);
            }

            // check for MSGTYPE.DELMSG
            if (payload.data.type == peermsg.MSGTYPE.DELMSG) {
                logger.debug("delete message with type DELMSG, key: %s", data.key);
                return callback(true);
            }

            var currtime = Date.now();
            var expiry_time = 0;
            var keyitems = data.key.split("/");
            if (keyitems && keyitems.length > 2 && keyitems[1] == "message") {
                expiry_time = value.timestamp + T_MSG_EXPIRE;
            }
            else {
                expiry_time = value.timestamp + T_ITEM_EXPIRE;
            }

            if (expiry_time <= currtime) {
                logger.debug("delete expired message %s", data.key);
                callback(true);
            }
            else {
                callback();
            }
        }
        catch (err) {
            // delete the time which triggered error
            callback(true);
            logger.error("expireHandler error: %j", err);
        }
    }

    auth.findRangeMessages = function (query, callback) {
        try {
            logger.debug('findRangeMessages for %s', query);

            var db = database.getkaddb();

            var stream = db.createReadStream();

            var key, count = 0, page = 10, start = 0;
            var messages = [];

            var params = querystring.parse(query);
            if (!params.key) {
                return callback('key is missing in range query');
            }
            key = params.key;

            if (params.page) {
                page = params.page;
            }
            if (params.start) {
                start = params.start;
            }

            stream.on('data', function (data) {
                if (data && data.key && (typeof data.key === 'string') && data.value && (typeof data.value === 'string')) {
                    try {
                        if (data.key.indexOf(key) > -1) {
                            var jsonobj = JSON.parse(data.value);
                            if (jsonobj.value) {
                                var payload = peermsg.getpayload(jsonobj.value);
                                if (payload.data.type != peermsg.MSGTYPE.DELMSG) {
                                    if (count >= start && messages.length < page) {
                                        messages.push({ key: data.key, value: jsonobj.value });
                                    }
                                    count++;
                                }
                            }
                        }
                    }
                    catch (err) {
                        logger.error('findRangeMessages error: %j', err);
                    }
                }
            });

            stream.on('error', function (err) {
                callback(err.message ? err.message : err);
            });

            stream.on('end', function () {
                callback(null, count, page, start, messages);
            });
        }
        catch (err) {
            logger.error('findRangeMessages error: %j', err);
            callback(err.message ? err.message : err);
        }
    }

    module.exports = auth;

})();