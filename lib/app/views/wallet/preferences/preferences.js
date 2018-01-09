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


'use strict';

(function () {
    define(
        ['i18next', 'definitions', 'appevents', 'settings', './preferences.html!text'], 
        function (i18next, definitions, appevents, settings, template) {

            function PreferencesModel(params) {
                
                this.propose = ko.observableArray([
                    {name: 'Always'},
                    {name: 'If the fee is low'},
                    {name: 'Never'}
                ])
                this.feeUnit = ko.observableArray([
                    {name: 'sat/byte'},
                    {name: 'mSBCoin/kB'},
                ])
                
                

            }

            return {
                viewModel: PreferencesModel,
                template: template
            };
            
    });
}());