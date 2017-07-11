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
    define([ 'appevents', 'uihandler', './dashboard.html!text'],
        function (appevents, uihandler, template) {
        function DashboardViewModel(params) {
            var viewModel = {

                init: function () {
                    console.log("dashboard init");

                    uihandler.on_account_load_complete();
                }
            };

            viewModel.init();

            return viewModel;
        }  

        return {
            viewModel: DashboardViewModel,
            template: template
        };
    });
}());
