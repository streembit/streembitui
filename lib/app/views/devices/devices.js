/*

This file is part of Streembit application. 
Streembit is an open source communication application. 

Streembit is a free software: you can redistribute it and/or modify it under the terms of the GNU General Public License 
as published by the Free Software Foundation", either version 3.0 of the License", or (at your option) any later version.

Streembit is distributed in the hope that it will be useful", but WITHOUT ANY WARRANTY; without even the implied warranty 
of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU General Public License for more details.

You should have received a copy of the GNU General Public License along with Streembit software.  
If not", see http://www.gnu.org/licenses/.
 
-------------------------------------------------------------------------------------------------------------------------
Author: Tibor Zsolt Pardi 
Copyright (C) Streembit 2017
-------------------------------------------------------------------------------------------------------------------------

*/


(function () {
    define(['appevents', 'appsrvc', 'database', 'logger', 'definitions', 'async', 'errhandler', 'errcodes','./view.html!text'], function (appevents, appsrvc, database, logger, defs, async, errhandler, errcodes, template) {

        const template_map = {
            0: "",
            1: "gateway",
            2: "onoff_switch",
            3: "onoff_switch_with_power",
            4: "level_control",
            5: "alarms",
            6: "door_lock",
            7: "window_covering",
            8: "pump_configuration_and_control",
            9: "thermostat",
            10: "fan_control",
            11: "color_control",
            12: "illuminance",
            13: "illuminance_level",
            13: "temperature",
            15: "pressure",
            16: "flow",
            17: "relative_humidit",
            18: "temperatue_&_rel_humidity",
            19: "occupancy",
            20: "power"
        };

        class Feature {
            constructor(data, device) {
                if (!data) {
                    // throw new Error("Invalid feature type");
                    throw new Error(errhandler.getmsg(errcodes.UI_INVALID_FEATURE_TYPE));
                }
                this.type = data;
                this.settings = {};

                if (!device.id) {
                    // throw new Error("Invalid device ID");
                    throw new Error(errhandler.getmsg(errcodes.UI_INVALID_DEVICE_ID));
                }
                this.deviceid = device.id;

                if (!device.gateway) {
                    // throw new Error("Invalid gateway data");
                    throw new Error(errhandler.getmsg(errcodes.UI_INVALID_GATEWAY_DATA));
                }
                this.gateway = device.gateway;
                if (!device.network) {
                    // throw new Error("Invalid network type data");
                    throw new Error(errhandler.getmsg(errcodes.UI_INVALID_NETWORK_TYPE_DATA));
                }
                this.network = device.network;

                this.device = device;

                this.template_name = ko.observable("feature-inactive-device");

                //
            }

            send(message, callback) {
                this.template_name("receiving-data");
                message.id = this.deviceid;
                message.feature = this.type;
                appevents.dispatch("iot-hub-send", this.gateway, message, callback);
            }

            read() {
            }
            
            report_error(errmsg, err) {
                console.log("IOT ERROR: " + errmsg);
                if (!err) {
                    switch (errmsg) {
                        case -4:
                        case "-4":
                        case -2:
                        case "-2":
                            this.template_name("feature-error-deviceoffline");
                            break;
                        default:
                            logger.error("IoT device feature error: " + errmsg);
                            break;
                    }
                }
                else {
                    if (typeof err === "string") {
                        logger.error("IoT device feature error: " + errmsg + " " + err);
                    }
                    else {
                        if (err.message) {
                            logger.error("IoT device feature error: " + errmsg + " " + err.message);
                        }
                        else {
                            logger.error("IoT device feature error: " + errmsg );
                        }
                    }
                }
            }

            init() {
            }

            refresh() {
            }

            on_datarcv(payload) {
            }

            //
        }

        class ElectricityMeasurement extends Feature {
            constructor(data, device) {
                super(data, device);
                this.power_consumption = ko.observable(0);
                this.voltage = ko.observable(0);
            }

            read() {
                try {
                    console.log("read electricity measurement");
                    var message = {
                        id: this.deviceid,
                        cmd: defs.IOTCMD_READVALUES  // read the data from the device
                    };
                    this.send(message, (err, response) => {
                        try {
                            if (err) {
                                // report the error
                                return super.report_error(err);
                            }

                            if (!response) {
                                // report the error
                                return super.report_error("Invalid IoT feature response");
                            }

                            this.power_consumption(response.power_consumption);
                            this.voltage(response.voltage);

                            this.template_name("feature-electric-measurement");

                            //
                        }
                        catch (serr) {
                            super.report_error(serr);
                        }
                    });
                }
                catch (err) {
                    super.report_error(err);
                }
            }

            init(wait) {
                setTimeout(
                    () => {
                        this.read()
                    },
                    wait
                );
            }

            refresh(wait) {
                setTimeout(
                    () => {
                        this.read()
                    },
                    wait
                );
            }

            on_datarcv(payload) {
                try {
                    if (payload && payload.hasOwnProperty("power_consumption")) {
                        this.power_consumption(payload.power_consumption);
                        //console.log("power_consumption report received");
                        if (this.template_name() != "feature-electric-measurement") {
                            this.template_name("feature-electric-measurement");
                        }
                    }
                    if (payload && payload.hasOwnProperty("voltage")) {
                        this.voltage(payload.voltage);
                        //console.log("voltage report received");
                        if (this.template_name() != "feature-electric-measurement") {
                            this.template_name("feature-electric-measurement");
                        }
                    }
                }
                catch (err) {
                    super.report_error(err);
                }
            }
        }

        class OnOffSwitch extends Feature {
            constructor(data, device) {
                super(data, device);
                this.ctrlstatus = ko.observable(false);
            }

            toggle() {
                var status = this.ctrlstatus();
                console.log("switch toggle to turn " + (status ? "OFF" : "ON"));
                var message = {
                    cmd: defs.IOTCMD_TOGGLE  // 2 = toggle
                };
                this.send(message, (err, response) => {
                    try {
                        if (err) {
                            // report the error
                            return super.report_error(err);;
                        }

                        if (!response) {
                            return super.report_error("Invalid IoT feature response");
                        }

                        var status = response.switch_status == 1 ? true : false;
                        this.ctrlstatus(status);
                        this.template_name("feature-on-off-switch");

                        this.device.signal_change(this);
                    }
                    catch (e) {
                        super.report_error(err);
                    }

                    //
                });
            }

            read() {
                try {
                    console.log("read switch status");
                    var message = {
                        id: this.deviceid,
                        cmd: defs.IOTCMD_READVALUES  // read the data from the device
                    };
                    this.send(message, (err, response) => {
                        try {
                            if (err) {
                                // report the error
                                return super.report_error(err);
                            }

                            if (!response) {
                                // report the error
                                return super.report_error("Invalid IoT feature response");
                            }

                            this.ctrlstatus(response.switch_status);
                            this.template_name("feature-on-off-switch");

                            //
                        }
                        catch (serr) {
                            super.report_error(serr);
                        }
                    });
                }
                catch (err) {
                    super.report_error(err);
                }            
            }

            init(wait) {
                setTimeout(
                    () => {
                        this.read()
                    },
                    wait
                );
            }

            refresh(wait) {
                setTimeout(
                    () => {
                        this.read()
                    },
                    wait
                );
            }

            on_datarcv(payload) {
                try {
                    if (payload && payload.hasOwnProperty("switch_status")){
                        this.ctrlstatus(payload.switch_status);
                        //console.log("switch_status report received");
                        if (this.template_name() != "feature-on-off-switch") {
                            this.template_name("feature-on-off-switch");
                        }
                    }
                }
                catch (err) {
                    super.report_error(err);
                }
            }
        }

        class TempratureMeasurement extends Feature {
            constructor(data, device) {
                super(data, device);
                this.temperature = ko.observable(0);
                this.integral = ko.observable(0);
                this.decimal = ko.observable(0);
                this.is_single_digit = ko.observable(false);                
            }

            read() {   
                console.log("read temperature value");
                var message = {
                    id: this.deviceid,
                    cmd: defs.IOTCMD_READVALUES  // read the data from the device
                };
                this.send(message, (err, response) => {
                    try {
                        if (err) {
                            // report the error
                            return super.report_error(err);
                        }

                        if (!response) {
                            // report the error
                            return super.report_error("Invalid IoT feature response");
                        }

                        this.setvalue(response.temperature);
                        this.template_name("feature-temperature-measurement");

                        //
                    }
                    catch (serr) {
                        super.report_error(serr);
                    }
                });
            }

            setvalue(val) {
                if (!val) {
                    this.integral(0);
                    this.decimal(0);
                }
                else if (val > 0) {
                    var num = Math.floor(val);
                    var decimal = val - num;
                    var dec = decimal.toFixed(1) * 10;
                    this.integral(num);
                    this.decimal(dec);
                }
                else {
                    var posnum = Math.abs(val); // Change to positive
                    var num = Math.floor(posnum);
                    var decimal = posnum - num;
                    var dec = decimal.toFixed(1) * 10;
                    this.integral('-' + num);
                    this.decimal(dec);                   
                }
            }

            init(wait) {
                setTimeout(
                    () => {
                        this.read()
                    },
                    wait
                );                
            }

            refresh(wait) {
                setTimeout(
                    () => {
                        this.read()
                    },
                    wait
                );
            }

            on_datarcv(payload) {
                try {
                    if (payload && payload.hasOwnProperty("temperature")) {
                        this.setvalue(payload.temperature);
                        //console.log("temperature report received");
                        if (this.template_name() != "feature-temperature-measurement") {
                            this.template_name("feature-temperature-measurement");
                        }
                    }
                }
                catch (err) {
                    super.report_error(err);
                }
            }
        }

        class HumidityMeasurement extends Feature {
            constructor(data, device) {
                super(data, device);
                this.humidity = ko.observable(0);
                this.integral = ko.observable(0);
                this.decimal = ko.observable(0);
                this.is_single_digit = ko.observable(false);
            }

            read() {
                console.log("read humidity value");
                var message = {
                    id: this.deviceid,
                    cmd: defs.IOTCMD_READVALUES  // read the data from the device
                };
                this.send(message, (err, response) => {
                    try {
                        if (err) {
                            // report the error
                            return super.report_error(err);
                        }

                        if (!response) {
                            // report the error
                            return super.report_error("Invalid IoT feature response");
                        }

                        response.humidity = parseFloat(response.humidity);
                        if (response.humidity) {
                            this.setvalue(response.humidity);
                            this.template_name("feature-relhumidity-measurement");
                        }

                        //
                    }
                    catch (serr) {
                        super.report_error(serr);
                    }
                });
            }

            setvalue(val) {
                console.log('humidity value:', val);
                if (!val || val <= 0) {
                    this.integral(0);
                    this.decimal(0);
                }
                else {
                    var hmy = Math.round(val) / 100 + '';
                    var [num, dec] = hmy.split('.');
                    this.integral(+num);
                    this.decimal(+dec);
                }
            }

            init(wait) {
                setTimeout(
                    () => {
                        this.read()
                    },
                    wait
                );
            }

            refresh(wait) {
                setTimeout(
                    () => {
                        this.read()
                    },
                    wait
                );
            }

            on_datarcv(payload) {
                try {
                    if (payload && payload.hasOwnProperty("humidity")) {
                        this.setvalue(payload.humidity);
                        if (this.template_name() !== "feature-relhumidity-measurement") {
                            this.template_name("feature-relhumidity-measurement");
                        }
                    }
                }
                catch (err) {
                    super.report_error(err);
                }
            }
        }

        class OccupancySensing extends Feature {
            constructor(data, device) {
                super(data, device);
                this.isoccupancy = ko.observable(0);
                this.ring_time = 10000; // show the ring for 10 seconds
            }

            read() {
                console.log("read occupancy state");
                var message = {
                    id: this.deviceid,
                    cmd: defs.IOTCMD_READVALUES  // read the data from the device
                };
                this.send(message, (err, response) => {
                    try {
                        if (err) {
                            // report the error
                            return super.report_error(err);
                        }

                        if (!response) {
                            // report the error
                            return super.report_error("Invalid IoT feature response");
                        }

                        this.isoccupancy(response.occupancy);
                        this.template_name("feature-occupancy-sensing");

                        var value = parseInt(response.occupancy);
                        if (value == 1) {
                            setTimeout(
                                () => {
                                    this.isoccupancy(false);
                                },
                                this.ring_time
                            );
                        }

                        //
                    }
                    catch (serr) {
                        super.report_error(serr);
                    }
                });
            }

            init(wait) {
                setTimeout(
                    () => {
                        this.read()
                    },
                    wait
                );
            }

            refresh(wait) {
                setTimeout(
                    () => {
                        this.read()
                    },
                    wait
                );
            }

            on_datarcv(payload) {
                try {
                    if (payload && payload.hasOwnProperty("occupancy")) {
                        this.isoccupancy(payload.occupancy);
                        //console.log("temperature report received");
                        if (this.template_name() != "feature-occupancy-sensing") {
                            this.template_name("feature-occupancy-sensing");
                        }

                        var value = parseInt(payload.occupancy);
                        if (value == 1) {
                            setTimeout(
                                () => {
                                    this.isoccupancy(false);
                                },
                                this.ring_time
                            );
                        }
                    }
                }
                catch (err) {
                    super.report_error(err);
                }
            }
        }

        class ZWaveNetInfo {
            constructor(data) {
            }
        }

        class SLowPANNetInfo {
            constructor(data) {
            }
        }

        class ZigbeeNetInfo {
            constructor(data) {
                this.manufacturername = ko.observable('');
                this.modelidentifier = ko.observable('');
                this.hwversion = ko.observable();
                this.address64 = ko.observable();
                this.address16 = ko.observable();
            }
        }

        class GatewayInfo {
            constructor(data) {
                this.deviceid = ko.observable('');
                this.manufacturername = ko.observable('');
                this.modelidentifier = ko.observable('');
                this.hwversion = ko.observable();
                this.address64 = ko.observable(data.address64);
                this.address16 = ko.observable();
                this.protocol = ko.observable();
                this.security = ko.observable();
                this.secure_hardware = ko.observable();
                this.platform = ko.observable("Streembit");
            }
        }

        function map_features(features, parent) {
            var list = [];
            if (!features || !Array.isArray(features) || features.length == 0) {
                return list;
            }

            for (var i = 0; i < features.length; i++) {
                var handler = 0;
                switch (features[i]) {
                    case defs.IOT_FUNCTION_SWITCH:
                        handler = OnOffSwitch;
                        break;
                    case defs.IOT_FUNCTION_ELECTRICITY_MEASUREMENT:
                        handler = ElectricityMeasurement;
                        break;
                    case defs.IOT_FUNCTION_TEMPERATURE_SENSING:
                        handler = TempratureMeasurement;
                        break;
                    case defs.IOT_FUNCTION_RELHUMIDITY_SENSING:
                        handler = HumidityMeasurement;
                        break;
                    case defs.IOT_FUNCTION_OCCUPANCY_SENSING:
                        handler = OccupancySensing;
                        break;                    
                    default:
                        break;
                }
                if (handler) {
                    var obj = new handler(features[i], parent);
                    list.push(obj);
                }
            }

            return list;
        }

        class Device {
            constructor(data) {
                this.data = data;
                this.id = data.id;
                this.type = data.type;
                this.gateway = data.gateway;
                this.network = data.network;
                this.name = ko.observable(data.name);

                this.newid = ko.observable('');
                this.is_newid_error = ko.observable(false);
                this.newname = ko.observable('');
                this.is_newname_error = ko.observable(false);

                this.features = 0;

                this.errorlogs = ko.observableArray([]);

                this.template_name = ko.observable('features-template');
                this.network_info_template = ko.observable('empty-template');
                this.show_netinfo = false;

                this.users = ko.observableArray([]);
                this.user_form_errors = ko.observableArray([]);
                this.adduser_form_errors = ko.observableArray([false, false, false, false]);
                this.isCurrentUser = ko.observableArray([]);
                this.isCurrentUserAdmin = ko.observable(false);

                this.user_add_active = ko.observable(false);
                this.add_username = ko.observable('');
                this.add_isadmin = ko.observable('');
                this.add_publickey = ko.observable('');
                this.add_settings = ko.observable('');

                this.networkinfo = ko.observable({});
                if (data.network == 0) {
                    var netdata = {
                        address64: this.id
                    };
                    this.networkinfo = new GatewayInfo(netdata);
                }
                else if (data.network == defs.IOT_NETWORK_ZIGBEE) {
                    var netdata = {
                        address64: this.id
                    };
                    this.networkinfo = new ZigbeeNetInfo(netdata);
                }
                else if (data.network == defs.IOT_NETWORK_ZWAVE) {
                    this.networkinfo = new ZWaveNetInfo({});
                }
                else if (data.network == defs.IOT_NETWORK_SLOWPAN) {
                    this.networkinfo = new SLowPANNetInfo({});
                }

                // create the feature set
                if (data.features) {
                    this.features = ko.observableArray(map_features(data.features, this));
                }

                // end constructor
            }

            signal_change(caller) {
                var features = this.features();
                features.forEach((item) => {
                    if (caller != item) {
                        item.read();
                    }
                });
            }
        

            set_zigbee_netinfo(response) {
                this.networkinfo.manufacturername(response.manufacturername);
                this.networkinfo.modelidentifier(response.modelidentifier);
                this.networkinfo.hwversion(response.hwversion);
                this.networkinfo.address64(response.address64);
                this.networkinfo.address16(response.address16);
            }

            set_gateway_netinfo(response) {
                this.networkinfo.deviceid(this.id);
                this.networkinfo.manufacturername(response.manufacturername);
                this.networkinfo.modelidentifier(response.modelidentifier);
                this.networkinfo.hwversion(response.hwversion);
                this.networkinfo.address64(response.address64);
                this.networkinfo.address16(!response.address16 ? '0000' : response.address16);
                this.networkinfo.protocol(response.protocol);
                this.networkinfo.security(response.security);
                this.networkinfo.secure_hardware(response.secure_hardware);
            }

            set_netinfo(response) {
                if (!response) {
                    // throw new Error("invalid network info response")
                    throw new Error(errhandler.getmsg(errcodes.UI_INVALID_NETWORK_INFO_RESPONSE))
                }

                if (this.network == 0) {
                    this.set_gateway_netinfo(response);
                }
                else if (this.network == defs.IOT_NETWORK_ZIGBEE) {
                    this.set_zigbee_netinfo(response);
                }
            }

            report_error(errmsg, err) {
                console.log(JSON.stringify(errmsg))
                console.log(err)
                if (!err) {
                    logger.error("IoT device error: " + errmsg);
                }
                else {
                    if (typeof err === "string") {
                        logger.error("IoT device error: " + errmsg + " " + err);
                    }
                    else {
                        if (err.message) {
                            logger.error("IoT device error: " + errmsg + " " + err.message);
                        }
                        else {
                            logger.error("IoT device error: " + errmsg);
                        }
                    }
                }
            }

            get_netinfo() {
                try {
                    var message = {
                        id: this.id,
                        cmd: defs.IOTCMD_DEVICE_DETAILS  // read the data from the device
                    };
                    this.send(message, (err, response) => {
                        try {
                            if (err || !response) {
                                // report the error
                                return this.report_error(err || 'Empty response received');
                            }

                            this.set_netinfo(response);
                        }
                        catch (serr) {
                            this.report_error(serr);
                        }
                    });
                }
                catch (err) {
                    this.report_error(err);
                }            
            }

            set_userlist(data) {
                if (!data) {
                    return;
                }
                $.each(data.users, (udx, u) => {
                    this.user_form_errors.push({
                        username: false,
                        isadmin: false,
                        publickey: false,
                        settings: false
                    });
                    this.isCurrentUser.push(u.pkhash === appsrvc.pubkeyhash);
                    if (u.pkhash === appsrvc.pubkeyhash) {
                        this.isCurrentUserAdmin(u.isadmin === 1);
                    }
                });
                this.users(data.users);
            }

            get_userlist() {
                try {
                    const message = {
                        cmd: defs.IOT_REQUEST_USER_LIST  // get users list from HUB
                    };
                    this.send(message, (err, response) => {
                        try {
                            if (err || !response) {
                                return this.report_error(err || 'Invalid user list received');
                            }

                            this.set_userlist(response);
                        }
                        catch (serr) {
                            this.report_error(serr);
                        }
                    });
                }
                catch (err) {
                    this.report_error(err);
                }
            }

            toggle_shownetwork_info() {
                if (!this.show_netinfo) {
                    if (this.network == 0) {
                        this.network_info_template("gateway-info-template");
                    }
                    else if (this.network == 1) {
                        this.network_info_template("zigbee-info-template");
                    }
                    else if (this.network == 2) {
                        this.network_info_template("zwave-info-template");
                    }
                    else if (this.network == 3) {
                        this.network_info_template("slowpan-info-template");
                    }

                    this.show_netinfo = true;
                }
                else {
                    this.network_info_template('empty-template');
                    this.show_netinfo = false;
                }
            }

            cancel_edit() {
                this.template_name("features-template");
            }

            send(message, callback) {
                message.id = this.id;
                appevents.dispatch("iot-hub-send", this.gateway, message, callback);
            }

            edit_device() {
                this.newid(this.id);
                this.newname(this.name());
                this.is_newname_error(false);
                this.is_newid_error(false);
                this.template_name("edit_device");
            }

            update_settings(data) {
                if (!data || !data.id || !data.name || !data.type || !data.features) {
                    // throw new Error("invalid device update data. ID, type and name fields are required.");
                    throw new Error(errhandler.getmsg(errcodes.UI_INVALID_DEVICE_UPDATE_DATA))
                }

                this.data = data;
                this.id = data.id;
                this.type = data.type;    
                this.network = data.network;    
                this.name(data.name);

                return data;
            }

            refresh() {
                var features = this.features();
                for (var i = 0; i < features.length; i++) {
                    features[i].refresh(((i + 1) * 1000));
                };
            }

            init() {
                this.get_netinfo();
                var features = this.features();
                var wait;
                for (var i = 0; i < features.length; i++){
                    wait = (i + 1) * 1000;
                    features[i].init(wait);
                };
            }

            on_datarcv(payload) {
                var features = this.features();
                for (var i = 0; i < features.length; i++) {
                    if (features[i].type == payload.feature) {
                        features[i].on_datarcv(payload);
                        break;
                    }
                };
            }
        }

        class GatewayDevice extends Device {
            constructor(data) {
                data.network = 0;
                data.gateway = data.id;
                super(data);
                this.publickey = ko.observable(data.publickey);
                this.add_device_mode = ko.observable(false);
                this.iotdevices = ko.observableArray([]);
                this.isedit_mode = ko.observable(false);
                this.authenticated = ko.observable(false);
                this.newpublickey = ko.observable('');
                this.is_newpublickey_error = ko.observable(false);
                this.unconfigured_devices = ko.observableArray([]);
                this.hubdevicelist = ko.observableArray([]);
                this.new_join_interval = ko.observable(30);
                this.enable_timer = ko.observable();

                this.host = data.host;
                this.port = data.port;
            }

            find_device(id) {
                var device = 0;
                var devicearray = this.iotdevices();
                if (devicearray.length) {
                    devicearray.forEach((item) => {
                        if (item.id == id) {
                            device = item;
                        }
                    });
                }
                return device;
            }

            handle_datarcv_event(payload) {
                console.log("handle_datarcv_event: " + JSON.stringify(payload));
                if (payload.event && payload.event == defs.IOT_NEW_DEVICE_JOINED) {
                    if (this.unconfigured_devices().filter(d => d.deviceid === payload.device.deviceid).length < 1) {
                        this.unconfigured_devices.push(payload.device);

                        console.log("IOT_NEW_DEVICE_JOINED: " + JSON.stringify(payload));
                        this.on_newdevice_join(payload);
                    }
                }
                else {
                    if (payload.deviceid) {
                        var deviceid = payload.deviceid;
                        var device = this.find_device(deviceid);
                        if (device) {
                            device.on_datarcv(payload);
                        }
                    }
                }
            }

            show_device_list() {

            }

            remove_device(device) {
                var removeitem = 0;
                for (var i = 0; i < this.iotdevices().length; i++) {
                    if (this.iotdevices()[i].id == device.deviceid) {
                        removeitem = this.iotdevices()[i];
                        break;
                    }
                }

                if (removeitem) {
                    this.iotdevices.remove(removeitem);
                }
            }

            initialize_device(item) {
                if (!item.id) {
                    item.id = item.deviceid;
                }

                var existing = this.find_device(item.id);
                if (existing) {
                    return;
                }

                var device = new Device(item);
                this.iotdevices.push(device);
                device.init();
            }

            on_list_devices_response() {
                // call the devices initialization 
                var devicearray = this.iotdevices();
                if (devicearray.length) {
                    devicearray.forEach((device) => {
                        device.init();
                    });
                }
            }

            cancel_edit_unconfigured_devices() {
                this.isedit_mode(false);
                this.template_name('empty-template');
            }

            submit_devices_configuration() {
                let error_reported = false;
                let devices = this.unconfigured_devices();
                let updatelist = [];
                devices.forEach(
                    (device) => {
                        let item = {
                            deviceid: device.deviceid,
                            permission: 0
                        };
                        let permitted = parseInt(device.permitted());                        
                        if (permitted == 1) {
                            item.permission = 1;
                            item.devicename = device.devicename().trim();
                            if (!item.devicename) {
                                error_reported = true;
                                // return streembit.notify.error("The device name is required for permitted devices.");
                                return streembit.notify.error(errhandler.getmsg(errcodes.UI_DEVICE_NAME_REQUIRED));
                            }
                            let features = [];
                            device.features.forEach(
                                (obj) => {
                                    let selected = obj.selected();
                                    if (selected) {
                                        features.push(obj.type);
                                    }
                                }
                            );
                            item.features = features;
                        }
                        updatelist.push(item);
                    }
                );

                if (error_reported) {
                    return;
                }

                if (updatelist.length > 0) {
                    var message = {
                        event: defs.IOT_DEVICES_LIST_CONFIGURE,
                        id: this.id,
                        list: updatelist
                    };
                    this.send(message, (err, response) => {
                        try {
                            // replies with the permitted list of devices
                            if (err) {
                                return this.report_error(err);
                            }

                            var devicelist = response.devicelist;
                            if (!devicelist || !Array.isArray(devicelist) || !devicelist.length) {
                                // throw new Error("invalid device list was sent by the Hub");
                                throw new Error(errhandler.getmsg(errcodes.UI_INVALID_DEVICE_LIST_SENT))
                            }

                            devicelist.forEach(
                                (device) => {
                                    if (device.type == defs.IOT_DEVICE_ENDDEVICE) {
                                        device.gateway = this.id;
                                        if (device.protocol == "zigbee") {
                                            device.network = defs.IOT_NETWORK_ZIGBEE;
                                        }
                                        this.initialize_device(device);
                                    }
                                }
                            );

                            // close the edit view
                            this.isedit_mode(false);
                            this.template_name('empty-template');    

                            //
                        }
                        catch (err) {
                            this.report_error("Device configuration response error: ", err);
                        }    
                        //
                    });
                }
                else {
                    this.isedit_mode(false);
                    this.template_name('empty-template');                    
                }
            }

            on_newdevice_join(payload) {
                try {
                    console.log("on_newdevice_join()");

                    if (!payload || !payload.gateway || !payload.device) {
                        // throw new Error("Invalid new device join data was received");
                        throw new Error(errhandler.getmsg(errcodes.UI_INVALID_DEVICE_JOIN_DATA));
                    }                    
                    
                    let gateway = payload.gateway;
                    let device = payload.device;

                    let protocol = device.protocol;
                    if (!protocol) {
                        // throw new Error("Invalid new device join data. Protocol must be defined.");
                        throw new Error(errhandler.getmsg(errcodes.UI_PROTOCOL_MUSTBE_DEFINED));
                    }

                    let permission = device.permission;
                    if (permission != defs.IOT_PERMISSION_NOTCOMISSIONED) {
                        // throw new Error("Invalid permission. Permission must be IOT_PERMISSION_NOTCOMISSIONED");
                        throw new Error(errhandler.getmsg(errcodes.UI_PERMISSION_MUST_IOT_PERMISSION_NOTCOMISSIONED));
                    }

                    let features = [];

                    if (device.protocol == "zigbee") {
                        console.log("on_newdevice_join() -> device.protocol == 'zigbee'");
                        device.permitted = ko.observable("1");
                        let name;
                        if (device.modelidentifier) {
                            name = device.modelidentifier + " ";
                        }
                        if (device.name) {
                            name += device.name;
                        }
                        if (!name) {
                            name = "Zigbee device";
                        }
                        device.devicename = ko.observable(name);
                        if (!device.features) {
                            // throw new Error("No feature list was recieved for device " + device.deviceid);
                            throw new Error(errhandler.getmsg(errcodes.UI_NO_FEATURE_LIST_FORDEVICE) + device.deviceid);
                        }                      

                        device.features.forEach(
                            (feature) => {
                                switch (feature) {
                                    case 2:
                                        features.push({
                                            name: "On/Off Switch",
                                            type: feature,
                                            selected: ko.observable(true)
                                        })
                                        break;
                                    case 3:
                                        features.push({
                                            name: "Electricity Measurement",
                                            type: feature,
                                            selected: ko.observable(true)
                                        })
                                        break;
                                    case 4:
                                        features.push({
                                            name: "Temperature Measurement",
                                            type: feature,
                                            selected: ko.observable(true)
                                        })
                                        break;
                                    case 5:
                                        features.push({
                                            name: "Relative Humidity Measurement",
                                            type: feature,
                                            selected: ko.observable(true)
                                        })
                                        break;
                                    case 6:
                                        features.push({
                                            name: "Occupancy",
                                            type: feature,
                                            selected: ko.observable(true)
                                        })
                                        break;
                                    case 9:
                                        features.push({
                                            name: "Alarms",
                                            type: feature,
                                            selected: ko.observable(true)
                                        })
                                        break;
                                    default:
                                        break;
                                }
                            }
                        );
                    }
                    else {
                        //TODO Z-wave
                    }

                    if (!features.length) {
                        // throw new Error("No feature list was recieved for device " + device.deviceid);
                        throw new Error(errhandler.getmsg(errcodes.UI_NO_FEATURE_LIST_FORDEVICE) + device.deviceid);
                    }

                    device.features = features;

                    let isopen = confirm("There is a new device joined to the IoT Hub. Would you like to review the details and authorize or deny the device?");
                    if (isopen) {
                        // show the list of not permitted devices for the user
                        this.template_name("unconfigured-" + protocol + "-devices-template");
                        this.isedit_mode(true);
                    }

                    //
                }
                catch (err) {
                    this.report_error("New device join error: " + err.message);
                }
            }

            list_devices_request() {
                try {
                    var message = {
                        event: defs.IOT_REQUEST_DEVICES_LIST,
                        id: this.id
                    };
                    this.send(message, (err, response) => {
                        try {
                            if (err) {
                                // report the error
                                return this.report_error(err);
                            }

                            this.unconfigured_devices([]);
                            var protocol;
                            var gateway = response.deviceid;

                            if (response && response.devicelist && Array.isArray(response.devicelist)) {

                                var rcvdevicelist = response.devicelist;
                                rcvdevicelist.forEach(
                                    (device) => {
                                        if (device.deviceid == this.id) {
                                            this.set_netinfo(device);
                                            protocol = device.protocol.toLowerCase();
                                        }
                                        else {
                                            let permission = device.permission;
                                            if (permission == defs.IOT_PERMISSION_ALLOWED) {
                                                // add it to the devices list
                                                device.gateway = gateway;
                                                this.initialize_device(device);
                                            }
                                            else if (permission == defs.IOT_PERMISSION_NOTCOMISSIONED) {
                                                let features = [];
                                                if (device.protocol == "zigbee") {
                                                    device.permitted = ko.observable("1");
                                                    let name;
                                                    if (device.modelidentifier) {
                                                        name = device.modelidentifier + " ";
                                                    }
                                                    if (device.name) {
                                                        name += device.name;
                                                    }
                                                    if (!name) {
                                                        name = "Zigbee device";
                                                    }
                                                    device.devicename = ko.observable(name);
                                                    if (!device.features) {
                                                        // throw new Error("No feature list was recieved for device " + device.deviceid);
                                                        throw new Error(errhandler.getmsg(errcodes.UI_NO_FEATURE_LIST_FORDEVICE) + device.deviceid);
                                                    }

                                                    device.features.forEach(
                                                        (feature) => {
                                                            switch (feature) {
                                                                case 2:
                                                                    features.push({
                                                                        name: "On/Off Switch",
                                                                        type: feature,
                                                                        selected: ko.observable(true)                                                                            
                                                                    })
                                                                    break;
                                                                case 3:
                                                                    features.push({
                                                                        name: "Electricity Measurement",
                                                                        type: feature,
                                                                        selected: ko.observable(true)
                                                                    })
                                                                    break;
                                                                case 4:
                                                                    features.push({
                                                                        name: "Temperature Measurement",
                                                                        type: feature,
                                                                        selected: ko.observable(true)
                                                                    })
                                                                    break;
                                                                case 5:
                                                                    features.push({
                                                                        name: "Relative Humidity Measurement",
                                                                        type: feature,
                                                                        selected: ko.observable(true)
                                                                    })
                                                                    break;
                                                                case 6:
                                                                    features.push({
                                                                        name: "Occupancy",
                                                                        type: feature,
                                                                        selected: ko.observable(true)
                                                                    })
                                                                    break;
                                                                default:
                                                                    break;
                                                            }                                                            
                                                        }
                                                    );
                                                }
                                                else {
                                                    //TODO Z-wave
                                                }
                                                device.features = features;                                                
                                                this.unconfigured_devices.push(device);
                                            }
                                        }
                                    }
                                );

                                if (this.unconfigured_devices().length > 0) {
                                    // show the list of not permitted devices for the user
                                    this.template_name("unconfigured-" + protocol + "-devices-template");
                                    this.isedit_mode(true);
                                }
                                else {
                                    this.on_list_devices_response();
                                }
                            }
                        }
                        catch (serr) {
                            this.report_error(serr);
                        }
                        //
                    });
                }
                catch (err) {
                    this.report_error(err);
                }            
            }

            get_hub_status() {
                logger.debug("IoT Hub " + this.id + " get_hub_status()");
                try {
                    var message = {
                        event: defs.IOT_HUB_STATUS,
                        id: this.id
                    };
                    this.send(message, (err, response) => {
                        try {
                            if (err) {
                                // report the error
                                return this.report_error(err);
                            }

                            var isauth = response.authenticated;
                            this.authenticated(isauth);
                            logger.debug("IoT Hub authenticated: " + (isauth ? "TRUE" : "FALSE") + " returned");                           
                            
                        }
                        catch (serr) {
                            this.report_error(serr);
                        }
                        //
                    });
                }
                catch (err) {
                    this.report_error(err);
                }
            }

            init() {
                this.get_netinfo();
                this.get_userlist();
                this.get_hub_status();
                this.list_devices_request();
                $(document).on('click', '.hub-details > li > a', function() {
                    $('header a').find('i').removeClass('fa-arrow-circle-o-up').addClass('fa-arrow-circle-o-down');
                    $(this).find('i').removeClass('fa-arrow-circle-o-down').addClass('fa-arrow-circle-o-up');
                });
            }

            submit_edit_device(item, thisobj) {
                // store that to find the item in the array before update
                var current_id = item.id;

                var deviceobj = 0;
                for (var i = 0; i < thisobj.iotdevices().length; i++) {
                    if (thisobj.iotdevices()[i].id == item.id) {
                        deviceobj = thisobj.iotdevices()[i];
                    }
                }

                if (!deviceobj) {
                    // return streembit.notify.error("Couldn't process the device update");
                    return streembit.notify.error(errhandler.getmsg(errcodes.UI_COULDNT_PROCESS_DEVICE_UPDATE));
                }

                var newdata = {
                    id: 0,
                    name: "",
                    gateway: deviceobj.data.gateway,
                    type: deviceobj.data.type,
                    network: deviceobj.data.network,
                    features: deviceobj.data.features
                };

                var idval = $.trim(item.newid());
                if (!idval) {
                    return item.is_newid_error(true);
                }
                item.is_newid_error(false);
                idval = idval.toLowerCase();    // use lower case for the MAC
                newdata.id = idval;

                var name = $.trim(item.newname());
                if (!name) {
                    return item.is_newname_error(true);
                }
                item.is_newname_error(false);
                newdata.name = name;

                var final_data = 0;
                try {
                    final_data = item.update_settings(newdata);
                    if (!final_data) {
                        // must be an error with one of the settings in the derived classes
                        return;
                    }
                }
                catch (err) {
                    // return streembit.notify.error("Couldn't process the device update, error %s", err.message);
                    return streembit.notify.error(errhandler.getmsg(errcodes.UI_COULDNT_PROCESS_DEVICE_UPDATE, err.message));
                }

                var newarr = [];
                for (var i = 0; i < thisobj.data.devices.length; i++) {
                    if (thisobj.data.devices[i].id == current_id) {
                        // skip the deleted item
                        newarr.push(final_data);
                    }
                    else {
                        newarr.push(thisobj.data.devices[i]);
                    }
                }
                thisobj.data.devices = newarr;

                // save it to the database
                database.update(database.IOTDEVICESDB, thisobj.data).then(
                    () => {
                        // close the edit view
                        deviceobj.cancel_edit();
                    },
                    (err) => {
                        // streembit.notify.error("Add IoT device database update error %j", err);
                        streembit.notify.error(errhandler.getmsg(errcodes.UI_ADD_IOT_DEVICE_DB_UPDATE, err));
                    }
                );              

            }

            delete_device(item, thisobj) {
                item.deviceid = item.id;
                this.delete_device_fromdb(item, thisobj);
            }

            devicetype_factory(data) {
                var device = 0;
                switch (data.type) {
                    case 2:
                        device = new SwitchDevice(data);
                        break;
                    default:
                        throw new Error("device type " + data.type + " is not implemented");
                }

                return device;
            }

            refresh() {
            }

            enable_gateway_join() {
                try {
                    var interval = this.new_join_interval();
                    if (interval < 30 || interval > 240) {
                        // return streembit.notify.error("Invalid join interval. The value must be between 30 and 240 seconds");
                        return streembit.notify.error(errhandler.getmsg(errcodes.UI_INVALID_INTERVAL))
                    }

                    var message = {
                        event: defs.IOT_ENABLE_JOIN_REQUEST,
                        id: this.id,
                        interval: interval
                    };
                    this.send(
                        message,
                        (err, response) => {
                            try {
                                if (err) {
                                    // report the error
                                    return this.report_error(err);
                                }

                                streembit.notify.info("The device join on the Hub was enabled.");

                                // show the timer
                                var count = interval; 
                                this.enable_timer(interval);
                                let timer = setInterval(
                                    () => {
                                        this.enable_timer(count--);
                                        if (count <= 0) {
                                            this.enable_timer(0);
                                            clearInterval(timer);
                                        }
                                    },
                                    1000
                                );

                                //
                            }
                            catch (e) {
                                this.report_error("Querying devices list error: ", e);
                            }
                        }
                    );

                    //
                }
                catch (err) {
                    this.report_error(err);
                }
            }

            delete_device_fromdb(item, thisobj) {
                try {
                    var confresp = confirm("The device will be deleted from the Hub database. Would you like to continue?");
                    if (!confresp) {
                        return;
                    }

                    let updated_device = item;
                    var message = {
                        event: defs.IOT_DELETE_DEVICE_REQUEST,
                        id: this.id,
                        payload: {
                            deviceid: updated_device.deviceid
                        }
                    };

                    this.send(
                        message,
                        (err, response) => {
                            try {
                                if (err) {
                                    // report the error
                                    // return streembit.notify.error("Delete device error: %j", err);
                                    return streembit.notify.error(errhandler.getmsg(errcodes.UI_DELETE_DEVICE_ERR, err));
                                }

                                if (response && response.isdeleted) {
                                    // remove it from the managed device list
                                    this.remove_device(updated_device);
                                    this.hubdevicelist.remove(updated_device);
                                }
                                else {
                                    // return streembit.notify.error("Error in deleting the device");
                                    return streembit.notify.error(errcodes.UI_ERR_DELETE_DEVICE);
                                }

                                //
                            }
                            catch (e) {
                                // streembit.notify.error("Delete device error: %j", e);
                                streembit.notify.error(errhandler.getmsg(errcodes.UI_DELETE_DEVICE_ERR, e));
                            }
                        }
                    );
                }
                catch (err) {
                    this.report_error(err);
                }
            }

            set_device_permission(item, permission, thisobj) {
                try {
                    let updated_device = item;
                    var message = {
                        event: defs.IOT_SET_DEVICE_PERMISSION_REQUEST,
                        id: this.id,
                        payload: {
                            deviceid: updated_device.deviceid,
                            permission: permission
                        }
                    };           

                    this.send(
                        message,
                        (err, response) => {
                            try {
                                if (err) {
                                    // report the error
                                    // return streembit.notify.error("Set device permission error: %j", err);
                                    return streembit.notify.error(errcodes.UI_SET_DEVICE_PERMISSION_ERR, err);
                                }

                                if (response.deviceid != updated_device.deviceid || response.permission != permission) {
                                    // return streembit.notify.error("Error in setting device permission. Gateway failed to send a valid reply.");
                                    return streembit.notify.error(errhandler.getmsg(errcodes.UI_SETTING_DEVICE_PERMISION));
                                }

                                if (permission == 1) {
                                    // add it to the device list
                                    updated_device.gateway = this.id;
                                    updated_device.permission = 1;
                                    this.initialize_device(updated_device);
                                }
                                else if (permission == 2) {
                                    // remove it from the managed device list
                                    this.remove_device(updated_device);
                                }

                                updated_device.uipermission(permission);  

                                //
                            }
                            catch (e) {
                                // streembit.notify.error("Set device permission error: %j", e);
                                streembit.notify.error(errcodes.UI_SET_DEVICE_PERMISSION_ERR, e);
                            }
                        }
                    );

                    
                }
                catch (err) {
                    this.report_error(err);
                }
            }
            
            edit_hub() {
                // get the devices list
                try {
                    var message = {
                        event: defs.IOT_ALLDEVICES_LIST_REQUEST,
                        id: this.id,
                    };
                    this.send(
                        message,
                        (err, response) => {
                            try {
                                if (err) {
                                    // report the error
                                    return this.report_error(err);
                                }

                                if (!response && !response.devicelist && !Array.isArray(response.devicelist)) {
                                    // streembit.notify.error("Empty devices list returned from the ioT Hub.");
                                    streembit.notify.error(errhandler.getmsg(errcodes.UI_EMPTY_DEVICES_RETURNED));
                                }
                                else {
                                    var devarray =
                                        response.devicelist.map(
                                        (item) => {
                                            if (item.protocol == "zigbee") {
                                                item.network = defs.IOT_NETWORK_ZIGBEE;
                                                if (item.type == 1) {
                                                    item.typename = "Zigbee coordinator";
                                                }
                                                else if (item.type == 2) {
                                                    item.typename = "Zigbee end device";
                                                }                                                
                                            }

                                            if (item.details) {
                                                try {
                                                    item.details = JSON.parse(item.details);
                                                }
                                                catch (err) { }
                                            }

                                            for (var prop in item.details) {
                                                if (!item.details[prop]) {
                                                    item.details[prop] = "";
                                                }
                                            }

                                            item.uipermission = ko.observable(item.permission);

                                            return item;
                                        }
                                    );

                                    this.hubdevicelist(devarray);
                                }
                                
                                //
                            }
                            catch (e) {
                                this.report_error("Querying devices list error: ", e);
                            }
                        }
                    );                    

                    //
                }
                catch (err) {
                    this.report_error(err);
                }

                // 
                this.new_join_interval(30);
                this.enable_timer(0)

                this.newname(this.name());
                this.is_newname_error(false);
                this.isedit_mode(true);
                this.newpublickey(this.publickey());
                this.is_newpublickey_error(false);
                this.template_name('edit_hub');

            }

            cancel_edit_hub() {
                this.isedit_mode(false);
                this.template_name('empty-template');
            }

            submit_edit_hub() {

                var name = $.trim(this.newname());
                if (!name || !/^[a-z_0-9\.\-]{2,64}$/i.test(name)) {
                    return this.is_newname_error(true);
                }
                this.is_newname_error(false);
                this.data.name = name;

                var publickey = $.trim(this.newpublickey());
                if (!publickey || !/^[a-z0-9]{64,256}$/i.test(publickey)) {
                    return this.is_newpublickey_error(true);
                }
                var isnew_pk = publickey !== this.newpublickey();
                this.is_newpublickey_error(false);
                this.data.publickey = publickey;

                // save it to the database
                database.update(database.IOTDEVICESDB, this.data).then(
                    () => {
                        this.isedit_mode(false);
                        this.template_name('empty-template');
                        this.name(this.newname());
                        if (isnew_pk) {
                            this.publickey(publickey);
                            this.init();
                        }
                    },
                    (err) => {
                        // streembit.notify.error("Add IoT device database update error %j", err);
                        streembit.notify.error(errhandler.getmsg(errcodes.UI_ADD_IOT_DEVICE_DB_UPDATE, err));
                    }
                );                
            }

            manage_users() {
                this.isedit_mode(true);
                this.template_name("manage_users");
            }

            cancel_manage_users(item) {
                this.isedit_mode(false);
                this.template_name('empty-template');
            }

            submit_delete_user(item, ev) {
                const idx = ko.contextFor(ev.target).$index();
                try {
                    bootbox.dialog({
                        message: 'User will be deleted from CLI. you sure?',
                        title: 'Confirm deletion',
                        closeButton: false,
                        buttons: {
                            danger: {
                                label: "Decline",
                                callback: () => {}
                            },
                            success: {
                                label: "Delete",
                                callback: () => {
                                    try {
                                        const message = {
                                            uid: item.userid,
                                            cmd: defs.IOTCMD_USER_DELETE
                                        };
                                        this.send(message, (err, response) => {
                                            try {
                                                if (response.result === 'success') {
                                                    this.get_userlist();
                                                    this.isCurrentUser([ ...this.isCurrentUser().slice(0, idx), ...this.isCurrentUser().slice(0, idx+1) ]);
                                                } else {
                                                    logger.error('Delete request failed with response: %j', response);
                                                }
                                            }
                                            catch (serr) {
                                                logger.error(serr);
                                            }
                                        });
                                    }
                                    catch (err) {
                                        throw new Error(err);
                                    }
                                }
                            }
                        }
                    });
                }
                catch (err) {
                    logger.error(err);
                }
            }

            submit_update_user(item, ev) {
                const idx = ko.contextFor(ev.target).$index();
                const { username, publickey, isadmin, settings } = item;

                let form_errors = { username: false, isadmin: false, publickey: false, settings: false };

                if (!/^[a-z0-9\._\-]{3,64}$/i.test(username)) {
                    form_errors.username = true;
                }

                if (!this.isCurrentUser()[idx] && !/^[a-f0-9]{64,256}$/i.test(publickey)) {
                    form_errors.publickey = true;
                }

                if (+isadmin !== 0 && +isadmin !== 1) {
                    form_errors.isadmin = true;
                }

                if (settings !== '{}') {
                    try {
                        const json_test = JSON.parse(settings);
                    } catch (err) {
                        form_errors.settings = true;
                    }
                }

                let ufe = this.user_form_errors();
                ufe[idx] = form_errors;
                this.user_form_errors(ufe);

                if (Object.values(form_errors).indexOf(true) > -1) {
                    return;
                }

                try {
                    const message = {
                        uid: item.userid,
                        cmd: defs.IOTCMD_USER_UPDATE,
                        user: item
                    };
                    this.send(message, (err, response) => {
                        try {
                            if (response.result === 'success') {
                                this.get_userlist();
                            } else {
                                logger.error('Update request failed with response: %j', response);
                            }
                        }
                        catch (serr) {
                            logger.error(serr);
                        }
                    });
                }
                catch (err) {
                    logger.error(err);
                }

                // this.isedit_mode(false);
                // this.template_name('empty-template');
            }

            toggle_adduser() {
                this.user_add_active(!this.user_add_active());
            }

            submit_add_user(item) {
                let form_errors = [ false, false, false, false ];

                form_errors[0] = !/^[a-z0-9\._\-]{3,64}$/i.test(this.add_username());
                form_errors[1] = this.add_isadmin().length < 1 || (+this.add_isadmin() !== 0 && +this.add_isadmin() !== 1);
                form_errors[2] = !/^[a-f0-9]{64,256}$/i.test(this.add_publickey());
                if (this.add_settings() === '') {
                    this.add_settings('{}')
                }
                if (this.add_settings() !== '{}') {
                    try {
                        const json_test = JSON.parse(this.add_settings());
                    } catch (err) {
                        form_errors[3] = true;
                    }
                }

                this.adduser_form_errors(form_errors);

                if (Object.values(form_errors).indexOf(true) > -1) {
                    return;
                }

                try {
                    const message = {
                        cmd: defs.IOTCMD_USER_ADD,
                        user: {
                            username: this.add_username(),
                            isadmin: this.add_isadmin(),
                            publickey: this.add_publickey(),
                            settings: this.add_settings()
                        }
                    };
                    this.send(message, (err, response) => {
                        try {
                            if (response.result === 'success') {
                                this.get_userlist();
                                this.add_username('');
                                this.add_isadmin('');
                                this.add_publickey('');
                                this.add_settings('');
                                this.user_add_active(false);
                                this.isCurrentUser.push(false);
                            } else {
                                logger.error('Add user request failed with response: %j', response);
                            }
                        }
                        catch (serr) {
                            logger.error(serr);
                        }
                    });
                }
                catch (err) {
                    logger.error(err);
                }
            }

            manage_devices() {
                this.isedit_mode(true);
                this.template_name("manage_devices");
            }

            cancel_manage_devices() {
                this.isedit_mode(false);
                this.template_name('empty-template');
            }

            submit_manage_devices() {
                this.isedit_mode(false);
                this.template_name('empty-template');
            }
        }

        function DevicesViewModel(params) {

            var viewModel = {
                iothubs: ko.observableArray([]),               

                datarcv_event_handler: function() {
                    appevents.on(
                        appevents.WS_IOTDATARCV_EVENT,
                        function (payload) {
                            try {                           
                                var hubs = viewModel.iothubs();
                                for (var i = 0; i < hubs.length; i++) {
                                    console.log("send WS_IOTDATARCV_EVENT to " + hubs[i].id);
                                    hubs[i].handle_datarcv_event(payload);                                    
                                }
                            }
                            catch (err) {
                                logger.error("Data receiver error: %j", err);
                            }
                        }
                    );
                },

                create: function() {
                   appevents.navigate('addiothub');

                    const deviceMenuLis = $('.left-side-main-menu').find('li.open > ul').find('li').not('[role="separator"]');
                    deviceMenuLis.removeClass('active').eq(1).addClass('active');
                },

                init: function () {
                    //debugger;
                    viewModel.iothubs([]);
                    database.IoTDB.get_devices(function (err, result) {
                        if (err) {
                            // return streembit.notify.error("Initialize devices list error: %j", err);
                            return streembit.notify.error(errhandler.getmsg(errcodes.UI_INITIALIZE_DEVICES_LIST_ERR, err));
                        }
                        if (result && Array.isArray(result)){             
                            result.forEach((item) => {
                                var gateway = new GatewayDevice(item);
                                viewModel.iothubs.push(gateway);
                                gateway.init();
                            });                            
                        }      
                    });

                    // start the event handler
                    viewModel.datarcv_event_handler();
                },

                removehub: function (item) {

                    var answer = confirm("All associated, configured devices and data of this IoT Hub will be deleted from the local database. Do you want to continue?");
                    if (!answer) { return; }

                    database.del(database.IOTDEVICESDB, item.id).then(
                        function () {
                            viewModel.iothubs.remove(item); 
                        },
                        function (err) {
                            // streembit.notify.error("Delete device error: %j", err);
                            streembit.notify.error(errhandler.getmsg(errcodes.UI_DELETE_DEVICE_ERR, err));
                        }
                    );
                }              

            };

            viewModel.init();

            return viewModel;
        }

        return {
            viewModel: DevicesViewModel,
            template: template
        };
    });
}());
