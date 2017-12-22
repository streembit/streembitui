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
Copyright (C) Streembit 2017
-------------------------------------------------------------------------------------------------------------------------

*/

(function () {
    define(
        ['./overview.html!text'], 
        function (template) {
            function OverviewModel(params) {
                var self = this;
                self.pointNumber = ko.observable(5);
                self.maxLimit = ko.observable(false);
                self.minLimit = ko.observable(false);
                self.propose = ko.observableArray([
                    {name: 'Always'},
                    {name: 'If the fee is low'},
                    {name: 'Never'}
                ])
                self.feeUnit = ko.observableArray([
                    {name: 'sat/byte'},
                    {name: 'mSBCoin/kB'},
                ])
                self.currency = ko.observableArray([
                    {name: 'DOP'},
                    {name: 'BTN'},
                    {name: 'GIP'}
                ])

                self.pointIncrease = function(){
                    self.pointNumber(self.pointNumber() + 1);
                    if(self.pointNumber() === 6){
                        self.maxLimit(true);
                        self.minLimit(false);
                    }else{
                        self.maxLimit(false);
                        self.minLimit(false);
                    }
                }

                self.pointDecrease = function(){
                    self.pointNumber(self.pointNumber() - 1);
                    if(self.pointNumber() === 0){
                        self.minLimit(true);
                        self.maxLimit(false);
                    }else{
                        self.minLimit(false);
                        self.maxLimit(false);
                    }
                }
            }
            return {
                viewModel: OverviewModel,
                template: template
            };

    });
}());
