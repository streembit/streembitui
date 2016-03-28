/*

This file is part of Streemio application. 
Streemio is an open source project to create a real time communication system for humans and machines. 

Streemio is a free software: you can redistribute it and/or modify it under the terms of the GNU General Public License 
as published by the Free Software Foundation, either version 3.0 of the License, or (at your option) any later version.

Streemio is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of 
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU General Public License for more details.

You should have received a copy of the GNU General Public License along with Streemio software.  
If not, see http://www.gnu.org/licenses/.
 
-------------------------------------------------------------------------------------------------------------------------
Author: Tibor Zsolt Pardi 
Copyright (C) 2016 The Streemio software development team
-------------------------------------------------------------------------------------------------------------------------

This source file is based on https://github.com/gordonwritescode  

*/


'use strict';

var inherits = require('util').inherits;
var clarinet = require('clarinet');
var net = require('net');
var AddressPortContact = require('./address-port-contact');
var Message = require('../message');
var RPC = require('../rpc');
var utils = require('../utils');

inherits(TCPTransport, RPC);

/**
* Represents an RPC interface over TCP
* @constructor
* @param {object} options
*/
function TCPTransport(options) {
    if (!(this instanceof TCPTransport)) {
        return new TCPTransport(options);
    }
    
    RPC.call(this, options);
}


TCPTransport.prototype.init = function(callback) {
    var self = this;
    
    this._socket = net.createServer(this._handleConnection.bind(this));
    
    this._socket.on('error', function(err) {
        var contact = self._contact;
        self._log.error('failed to bind to supplied address %s', contact.address);
        self._log.error('error %j', err);
        
        self._socket.close();
        
        callback(err);
    });
    
    this._socket.on('listening', function() {
        var address = self._socket.address();
        self._log.info("opened TCP listener on %j", address);
        self.emit('ready');
        
        callback();
    });
    
    this._socket.listen(this._contact.port); //, this._contact.address);
}

/**
* Create a TCP Contact
* #_createContact
* @param {object} options
*/
TCPTransport.prototype._createContact = function(options) {
    return new AddressPortContact(options);
};

/**
* Send a RPC to the given contact
* #_send
* @param {buffer} data
* @param {Contact} contact
*/
TCPTransport.prototype._send = function (data, contact) {
    var self = this;
    var sock = net.createConnection(contact.port, contact.address);
    
    sock.on('error', function (err) {
        self.emit("NODE_ERROR", err, contact, data);
        self._log.error('TCPTransport send error: %j', err);
    });
    
    sock.end(data);
};

/**
* Close the underlying socket
* #_close
*/
TCPTransport.prototype._close = function() {
    this._socket.close();
};

TCPTransport.prototype.report_fault_msg = function (address, port) {

};


/**
* Handle incoming connection
* #_handleConnection
* @param {object} socket
*/
TCPTransport.prototype._handleConnection = function (socket) {
    
    var self = this;
    
    var addr = socket.remoteAddress;
    var port = socket.remotePort;
    var parser = clarinet.createStream();
    var buffer = '';
    var opened = 0;
    var closed = 0;
    
    //this._log.info('connection opened with %s:%s', addr, port);
    
    parser.on('openobject', function(key) {
        opened++;
    });
    
    parser.on('closeobject', function() {
        closed++;
        
        if (opened === closed) {
            var msgobj = null;
            try {
                msgobj = JSON.parse(buffer);
            }
            catch (e) {
                //  TODO check the sender for DDoS and other issues
                buffer = '';
                opened = 0;
                closed = 0;
                return self.report_fault_msg(addr, port);
            }
            
            try {
                if (msgobj && msgobj.type) {
                    switch (msgobj.type) {
                        case "DISCOVERY":
                            self._log.debug('DISCOVERY message');
                            var reply = JSON.stringify({ address: addr });
                            socket.write(reply);
                            break;

                        case "PEERMSG":
                            self.emit('PEERMSG', msgobj, { address: addr, port: port });
                            break;

                        case "MSGREQUEST":
                            var account = msgobj.account;
                            var msgkey = msgobj.msgkey;
                            
                            self.emit('MSGREQUEST', account, msgkey, function (err, count, msgs) {
                                var reply = "";
                                if (err) {
                                    reply = JSON.stringify({ error: err });
                                }
                                else {
                                    reply = JSON.stringify({ error: 0, count: count, messages: msgs });
                                }
                                socket.write(reply);
                                socket.end();
                            });
                            break;

                        default:
                            self._handleMessage(Buffer(buffer), { address: addr, port: port });
                            break
                    }
                }
            }
            catch (e) {
                self._log.error('TCP process message object error: %j', e);
            }
            
            buffer = '';
            opened = 0;
            closed = 0;
        }
    });
    
    parser.on('error', function (err) {
        try {
            self._log.error('parser error: %j', err);
            socket.close();
        }
        catch (err) { }
    });
    
    socket.on('error', function (err) {
        var clientaddr = addr + ":" + port;
        self._log.error('error communicating with peer %s error: %j', clientaddr, err);
    });
    
    socket.on('data', function(data) {
        buffer += data.toString('utf8');
        //self._log.debug('buffer: ' + buffer);
        parser.write(data.toString('utf8'));
    });
    
    socket.on('end', function () {
        //self._log.debug('client socket disconnected');
    });
};

module.exports = TCPTransport;
