/*

This file is part of DoorClient application. 
DoorClient is an open source project to manage reliable identities. 

DoorClient is a free software: you can redistribute it and/or modify it under the terms of the GNU General Public License 
as published by the Free Software Foundation, either version 3.0 of the License, or (at your option) any later version.

DoorClient is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty 
of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU General Public License for more details.

You should have received a copy of the GNU General Public License along with DoorClient software.  
If not, see http://www.gnu.org/licenses/.
 
-------------------------------------------------------------------------------------------------------------------------
Author: Tibor Zsolt Pardi 
Copyright (C) Authenticity Institute 2017
-------------------------------------------------------------------------------------------------------------------------

*/


(function () {
    define(['appevents', './enrollinit.html!text'], function ( appevents, template) {
        function EnrollInitViewModel(params) {

            this.enroll_type = ko.observable(0);
            this.is_enrolltype_error = ko.observable(false);

            this.start_enroll = function () {
                var mode = this.enroll_type();
                // validate the enroll type
                // TODO handle here other enrollment types once they are available within the business
                if (mode != 1) {
                    return this.is_enrolltype_error(true);
                }
                this.is_enrolltype_error(false);

                appevents.navigate("enroll", { mode: mode });
            };
        }

        return {
            viewModel: EnrollInitViewModel,
            template: template,
        };
    });
}());
