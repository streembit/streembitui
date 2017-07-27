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
    define(['appevents', 'database', 'logger', './view.html!text'], function (appevents, database, logger, template) {

        function AddIotHubVM(params) {

            var viewModel = {
                id: ko.observable(''),
                is_id_error: ko.observable(false),
                name: ko.observable(''),
                is_name_error: ko.observable(false),
                publickey: ko.observable(''),
                is_publickey_error: ko.observable(false),

                submit: function () {
                    this.is_id_error(true);

                    try {   
                        var device = { id: 0, type: 1, name: "", devices: [] }; // gateway = 1

                        var idval = $.trim(this.id());
                        if (!idval) {
                            return this.is_id_error(true);
                        }
                        this.is_id_error(false);
                        idval = idval.toLowerCase();    // use lower case for the MAC
                        device.id = idval;

                        var name = $.trim(this.name());
                        if (!name ){
                            return this.is_name_error(true);
                        }
                        this.is_name_error(false);
                        device.name = name;

                        var publickey = $.trim(this.publickey());
                        if (!publickey) {
                            return this.is_publickey_error(true);
                        }
                        device.publickey = publickey;
                        this.is_publickey_error(false);                                               

                        // save it to the database
                        database.update(database.IOTDEVICESDB, device).then(
                            function () {
                                //navigate to the devices section
                                appevents.navigate("devices");
                            },
                            function (err) {
                                logger.error("Add IoT device database update error %j", err);
                            }
                        );

                        //     
                    }
                    catch (err) {
                        streembit.notify.error("Add IoT device error %j", err);
                    }
                },

                cancel: function () {
                    appevents.navigate("dashboard");
                }
            };

            return viewModel;

        }

        return {
            viewModel: AddIotHubVM,
            template: template
        };
    });
}());
