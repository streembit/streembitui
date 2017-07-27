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
    define(['appevents', 'database', 'logger', 'definitions', './view.html!text'], function (appevents, database, logger, defs, template) {

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
            constructor(data) {
                this.type = data.type;
                this.settings = data.settings;
            }

        }

        class ElectricityMeasurement extends Feature {
            constructor(data) {
                super(data);
                this.power_consumption = ko.observable(0);
                this.voltage = ko.observable(0);
            }


        }

        class OnOffSwitch extends Feature {
            constructor(data) {
                super(data);
                this.ctrlstatus = ko.observable(false);
            }

            toggle() {

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
                this.address64 = data.address64;
                this.address16 = 0;
                this.iddle_enable = 0;
                this.relationship = 0;
                this.permitjoin = 0;
                this.depth = 0;
                this.lqi = 0;
            }
        }

        function map_features(features) {
            var list = [];
            if (!features || !Array.isArray(features) || features.length == 0) {
                return list;
            }

            for (var i = 0; i < features.length; i++) {
                var obj = 0;
                switch (features[i].type) {
                    case 2:
                        obj = new OnOffSwitch(features[i]);
                        break;
                    case 3:
                        obj = new ElectricityMeasurement(features[i]);
                        break;
                    default:
                        break;
                }
                if (obj) {
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
                this.network = data.network;    
                this.name = ko.observable(data.name);

                this.newid = ko.observable('');
                this.is_newid_error = ko.observable(false);
                this.newname = ko.observable('');
                this.is_newname_error = ko.observable(false);

                this.features = 0;

                if (data.features) {
                    this.features = ko.observableArray(map_features(data.features));
                }

                this.template_name = ko.observable('features-template');
                this.network_info_template = ko.observable('empty-template');
                this.show_netinfo = false;

                this.networkinfo = ko.observable({});
                if (data.network == 1) {
                    var netdata = {
                        address64: this.id
                    };
                    this.networkinfo = new ZigbeeNetInfo(netdata);
                }
                else if (data.network == 2) {
                    this.networkinfo = new ZWaveNetInfo({});
                }
                else if (data.network == 3) {
                    this.networkinfo = new SLowPANNetInfo({});
                }
            }          

            toggle_network_info() {
                if (!this.show_netinfo) {
                    if (this.network == 1) {
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
                var gateway = this.data.gateway ? this.data.gateway : this.id;                
                appevents.dispatch("iot-hub-send", gateway, message, callback);
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
                    throw new Error("invalid device update data. ID, type and name fields are required.");
                }

                this.data = data;
                this.id = data.id;
                this.type = data.type;    
                this.network = data.network;    
                this.name(data.name);

                return data;
            }

            refresh() {

            }

            init() {

            }
        }

        class OccupancyDevice extends Device {
            constructor(data) {
                super(data);
                this.template_name("occupancy_device");
            }

            cancel_edit() {
                this.template_name("occupancy_device");
            }

            update_settings(data) {
                return super.update_settings(data);
            }

            turnon() {

            }

            turnoff() {

            }
        }

        class SmartPlugDevice extends Device {
            constructor(data) {
                super(data);
                this.ctrlstatus = ko.observable(false);
                this.statustext = ko.observable("UNKNOWN");
                this.refresh_interval = ko.observable(data.refresh_interval || 60000); // in milliseconds, 60000 is the default val 
                this.is_interval_error = ko.observable(false);
                this.power_consumption = ko.observable(0);
                this.voltage = ko.observable(0);

                this.template_name("smart_plug_device");
                this.settings_template("smart_plug_device_settings");
            }

            send(message, callback) {
                super.send(message, callback);
            }

            cancel_edit() {
                this.template_name("smart_plug_device");
            }

            update_settings(data) {
                //check the refresh interval
                var val = parseInt(this.refresh_interval());
                if (isNaN(val) || val < 30000 || val > 3600000) {
                    this.is_interval_error(true);
                    return null;
                }
                // update the return value with this switch specific settings
                data.refresh_interval = val;

                return super.update_settings(data);
            }

            turnon() {
                console.log('trun ON ');
            }

            turnoff() {
                console.log('trun OFF ');
            }

            set_statustext(switch_status) {
                switch (switch_status) {
                    case 0:
                        this.statustext("OFF");
                        break;
                    case 1:
                        this.statustext("ON");
                        break
                    case -2:
                        this.statustext("TIMED OUT");
                        break;
                    default:
                        this.statustext("UNKNOWN");
                        break;
                }
            }

            toggle() {
                var status = this.ctrlstatus();
                console.log("switch toggle to turn " + (!status ? "OFF" : "ON"));
                var message = {
                    id: this.id,
                    cmd: defs.IOTCMD_TOGGLE  // 2 = toggle
                };
                this.send(message, (err, response) => {
                    if (err) {
                        // report the error
                        return;
                    }

                    if (!response) {
                        return;
                    }

                    this.set_statustext(response.switch_status);
                    var status = response.switch_status == 1 ? true : false;
                    this.ctrlstatus(status);
                    this.power_consumption(response.power_consumption);
                    this.voltage(response.voltage);
                    this.param1(response.details.address64);
                    this.param2(response.details.address16);
                    this.param3(response.details.iddle_enable);
                    this.param4(response.details.relationship);
                    this.param5(response.details.permitjoin);
                    this.param6(response.details.depth);
                    this.param7(response.details.lqi);
                });
            }

            read() {
                // get the status of the swithc
                console.log("read switch status");
                var message = {
                    id: this.id,
                    cmd: defs.IOTCMD_READSWITCH  // read switch status
                };
                this.send(message, (err, response) => {
                    if (err) {
                        // report the error
                        return;
                    }

                    if (!response) {
                        return;
                    }

                    this.set_statustext(response.switch_status);
                    this.ctrlstatus(response.switch_status);
                    this.power_consumption(response.power_consumption);
                    this.voltage(response.voltage);
                    this.param1(response.details.address64);
                    this.param2(response.details.address16);
                    this.param3(response.details.iddle_enable);
                    this.param4(response.details.relationship);
                    this.param5(response.details.permitjoin);
                    this.param6(response.details.depth);
                    this.param7(response.details.lqi);
                });
            }

            init() {
                this.read();
            }
        }

        class SwitchDevice extends Device {
            constructor(data) {
                super(data);
                this.ctrlstatus = ko.observable(false);
                this.statustext = ko.observable("UNKNOWN");
                this.refresh_interval = ko.observable(data.refresh_interval || 60000); // in milliseconds, 60000 is the default val 
                this.is_interval_error = ko.observable(false);
                this.power_consumption = ko.observable(0);
                this.voltage = ko.observable(0);

                this.template_name("onoff_switch_device");
                this.settings_template("onoff_switch_device_settings");
            }

            send(message, callback) {
                super.send(message, callback);
            }

            cancel_edit() {
                this.template_name("onoff_switch_device");
            }

            update_settings(data) {
                //check the refresh interval
                var val = parseInt(this.refresh_interval());
                if (isNaN(val) || val < 30000 || val > 3600000) {
                    this.is_interval_error(true);
                    return null;
                }
                // update the return value with this switch specific settings
                data.refresh_interval = val;

                return super.update_settings(data);
            }

            turnon() {
                console.log('trun ON ');
            }

            turnoff() {
                console.log('trun OFF ');
            }

            set_statustext(switch_status) {
                switch (switch_status) {
                    case 0:
                        this.statustext("OFF");
                        break;
                    case 1:
                        this.statustext("ON");
                        break
                    case -2:
                        this.statustext("TIMED OUT");
                        break;
                    default:
                        this.statustext("UNKNOWN");
                        break;
                }
            }

            toggle() {
                var status = this.ctrlstatus();
                console.log("switch toggle to turn " + (!status ? "OFF" : "ON"));
                var message = {                    
                    id: this.id, 
                    cmd: defs.IOTCMD_TOGGLE  // 2 = toggle
                };
                this.send(message, (err, response) => {
                    if (err) {
                        // report the error
                        return;
                    }

                    if (!response) {
                        return;
                    }

                    this.set_statustext(response.switch_status);   
                    var status = response.switch_status == 1 ? true : false;
                    this.ctrlstatus(status);
                    this.power_consumption(response.power_consumption);
                    this.voltage(response.voltage);
                    this.param1(response.details.address64);
                    this.param2(response.details.address16);
                    this.param3(response.details.iddle_enable);
                    this.param4(response.details.relationship);
                    this.param5(response.details.permitjoin);
                    this.param6(response.details.depth);
                    this.param7(response.details.lqi);
                });
            }

            read() {
                // get the status of the swithc
                console.log("read switch status");
                var message = {
                    id: this.id,
                    cmd: defs.IOTCMD_READSWITCH  // read switch status
                };
                this.send(message, (err, response) => {
                    if (err) {
                        // report the error
                        return;
                    }

                    if (!response) {
                        return;
                    }

                    this.set_statustext(response.switch_status);
                    this.ctrlstatus(response.switch_status);
                    this.power_consumption(response.power_consumption);
                    this.voltage(response.voltage);
                    this.param1(response.details.address64);
                    this.param2(response.details.address16);
                    this.param3(response.details.iddle_enable);
                    this.param4(response.details.relationship);
                    this.param5(response.details.permitjoin);
                    this.param6(response.details.depth);
                    this.param7(response.details.lqi);
                });
            }

            init() {
                this.read();
            }
        }

        class GatewayDevice extends Device {
            constructor(data) {
                super(data);
                this.publickey = ko.observable(data.publickey);
                this.add_device_mode = ko.observable(false);
                this.iotdevices = ko.observableArray([]);
                this.isedit_mode = ko.observable(false);

                // initialize the devices list
                if (data.devices && Array.isArray(data.devices)) {
                    data.devices.forEach((item) => {
                        //var device = 0;
                        //switch (item.type) {
                        //    case 2:
                        //        device = new SwitchDevice(item);
                        //        break;
                        //    default:
                        //        break;
                        //}

                        //if (device) {
                        //    this.iotdevices.push(device);
                        //    device.init();
                        //}
                        var device = new Device(item);
                        this.iotdevices.push(device);
                        device.init();
                    });
                }
            }

            on_new_device(device, $context) {
                console.log("new device");
                //var data = $context.data;
                // data.devices.push(device);
                var newdevice = new Device(device);
                $context.iotdevices.push(newdevice);
                $context.template_name('empty-template');
            }

            submit_edit_device(item, thisobj) {
                //debugger;

                // store that to find the item in the array before update
                var current_id = item.id;

                var deviceobj = 0;
                for (var i = 0; i < thisobj.iotdevices().length; i++) {
                    if (thisobj.iotdevices()[i].id == item.id) {
                        deviceobj = thisobj.iotdevices()[i];
                    }
                }

                if (!deviceobj) {
                    return streembit.notify.error("Couldn't process the device update");
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
                    return streembit.notify.error("Couldn't process the device update, error %s", err.message);
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
                        streembit.notify.error("Add IoT device database update error %j", err);
                    }
                );              

            }

            delete_device(item, thisobj) {
                var answer = confirm("The device will be permanently removed from the IoT Hub and all device settings will be deleted. Do you want to continue?");
                if (!answer) { return; }

                var newarr = [];
                for (var i = 0; i < thisobj.data.devices.length; i++) {
                    if (thisobj.data.devices[i].id == item.id) {
                        // skip the deleted item
                        continue;
                    }
                    newarr.push(thisobj.data.devices[i]);
                }
                thisobj.data.devices = newarr;

                // save it to the database
                database.update(database.IOTDEVICESDB, thisobj.data).then(
                    () => {
                        //remove from teh observable array
                        thisobj.iotdevices.remove(function (obj) {
                            return obj.id == item.id;
                        }) 
                    },
                    (err) => {
                        streembit.notify.error("Add IoT device database update error %j", err);
                    }
                );
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

            edit_hub() {
                this.selected_newdevice(0);
                this.is_newdevice_error(false);
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
                this.isedit_mode(false);
                this.template_name('empty-template');

                this.name(this.newname());
                this.publickey(this.newpublickey());
            }

            add () {                
            }

            add_device () {                                
                this.template_name("add_device");
            }                

            cancel_add () {
                this.template_name('empty-template');
            }
        }

        function DevicesViewModel(params) {

            var viewModel = {
                iothubs: ko.observableArray([]),                              

                init: function () {
                    viewModel.iothubs([]);
                    database.IoTDB.get_devices(function (err, result) {
                        if (err) {
                            return streembit.notify.error("Initialize devices list error: %j", err);
                        }
                        if (result && Array.isArray(result)){             
                            result.forEach((item) => {
                                viewModel.iothubs.push(new GatewayDevice(item));
                            });                            
                        }      
                    });
                },

                removehub: function (item) {

                    var answer = confirm("All associated, configured devices and data of this IoT Hub will be deleted from the local database. Do you want to continue?");
                    if (!answer) { return; }

                    database.del(database.IOTDEVICESDB, item.id).then(
                        function () {
                            viewModel.iothubs.remove(item); 
                        },
                        function (err) {
                            streembit.notify.error("Delete device error: %j", err);
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
