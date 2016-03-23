/*

This file is part of Streemio application. 
Streemio is an open source project to create a real time communication system for humans and machines. 

Streemio is a free software: you can redistribute it and/or modify it under the terms of the GNU General Public License 
as published by the Free Software Foundation, either version 3.0 of the License, or (at your option) any later version.

Streemio is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of 
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU General Public License for more details.

You should have received a copy of the GNU General Public License along with W3C Web-of-Things-Framework.  
If not, see http://www.gnu.org/licenses/.
 
-------------------------------------------------------------------------------------------------------------------------
Author: Tibor Zsolt Pardi 
Copyright (C) 2016 The Streemio software development team
-------------------------------------------------------------------------------------------------------------------------

*/


var events = require("events");

var eventEmitter = new events.EventEmitter();

exports.onProperty = function (thing, patch, data) {
    var payload = {
        thing: thing,
        patch: patch,
        data: data
    };
    eventEmitter.emit("thingevent", "propertychange", payload);
}

exports.onEventSignalled = function (thing, event, data) {
    var payload = {
        thing: thing,
        event: event,
        data: data
    };
    eventEmitter.emit("thingevent", "eventsignall", payload);
}

exports.onDeviceMessage = function (data) {
    eventEmitter.emit("device_msg", data);
}

exports.onDevicePropertyChanged = function (data) {
    eventEmitter.emit("device_property_changed", data);
}

exports.onDeviceEventSignalled = function (data) {
    eventEmitter.emit("device_event_signalled", data);
}


exports.emitter = eventEmitter;