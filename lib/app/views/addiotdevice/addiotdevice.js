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


(function () {
    define(['appevents', 'database', 'logger', 'definitions', './view.html!text'], function (appevents, database, logger, defs, template) {

        function Feature(_type, _text) {
            this.type = _type;
            this.text = _text;
        }

        class AddIotDeviceVM {
            constructor(params){
                this.gatewayid= params.id;
                this.newid= ko.observable('');
                this.is_newid_error= ko.observable(false);
                this.iderror_text= ko.observable('This field is required.');
                this.newname= ko.observable('');
                this.is_newname_error= ko.observable(false);
                this.selected_newnetwork= ko.observable('');
                this.is_selected_newnetwork_error = ko.observable(false);
                this.is_feature_error = ko.observable(false);
                this.features= ko.observableArray([]);
                this.completefn= params.on_new_device;
                this.gatewaydata= params.data;
                this. selected_feature= ko.observable(0);
                this.parenthub = params;
            }


            cancel_add () {
                this.parenthub.template_name('empty-template');
                if (this.parenthub.cancel_add) {
                    this.parenthub.cancel_add();
                }
            }

            delete_feature(item, thisobj) {
                thisobj.features.remove((obj) => {
                    return obj.type == item.type;
                })
            }

            add_feature () {
                var feature = this.selected_feature();
                var value = parseInt(feature);
                if (value < 2) {
                    return;
                }

                for (var i = 0; i < this.features().length; i++) {
                    if (this.features()[i].type == value) {
                        return;
                    }
                }

                var txt = defs.DEVICE_FEATURES[value];
                var obj = new Feature(value, txt);
                this.features.push(obj);

                this.selected_feature('0');
                this.is_feature_error(false);
            }

            submit () {

                try {
                    var device = {
                        id: 0,
                        name: "",
                        gateway: this.gatewayid,
                        type: 2,  // type 2 = end device, type 1 = gateway
                        network: 0,
                        features: []
                    }; 

                    var data = this.gatewaydata;

                    var idval = $.trim(this.newid());
                    if (!idval) {
                        this.iderror_text("This field is required.");
                        return this.is_newid_error(true);
                    }

                    idval = idval.toLowerCase();    // use lower case for the MAC

                    var exists = false;
                    data.devices.forEach((item) => {
                        if (item.id == idval) {
                            exists = true;
                        }
                    });
                    if (exists) {
                        this.iderror_text("A device with the same ID already exists in the Hub.");
                        return this.is_newid_error(true);
                    }
                    this.is_newid_error(false);

                    device.id = idval;

                    var name = $.trim(this.newname());
                    if (!name) {
                        return this.is_newname_error(true);
                    }
                    this.is_newname_error(false);
                    device.name = name;

                    var selectednet = this.selected_newnetwork();
                    var network = parseInt(selectednet);
                    if (!network) {
                        return this.is_selected_newnetwork_error(true);
                    }
                    this.is_selected_newnetwork_error(false);
                    device.network = network;

                    var featurelen = this.features().length;
                    if (!featurelen) {
                        return this.is_feature_error(true); 
                    }
                    this.is_feature_error(false);

                    for (var i = 0; i < featurelen; i++) {
                        device.features.push({
                            type: this.features()[i].type,
                            settings: { }
                        });
                    }

                    // add to the parent object
                    data.devices.push(device);

                    // save it to the database
                    database.update(database.IOTDEVICESDB, data).then(
                        () => {
                            //navigate to the iotdevices section
                            this.completefn(device, this.parenthub);
                        },
                        (err) => {
                            logger.error("Add IoT device database update error %j", err);
                        }
                    );
                    //     
                }
                catch (err) {
                    streembit.notify.error("Add IoT device error %j", err);
                }
            }

        }

        return {
            viewModel: AddIotDeviceVM,
            template: template
        };
    });
}());
