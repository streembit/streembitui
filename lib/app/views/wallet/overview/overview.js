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
                
                
                this.pointNumber = ko.observable(5);
                this.maxLimit = ko.observable(false);
                this.minLimit = ko.observable(false);
                this.propose = ko.observableArray([
                    {name: 'Always'},
                    {name: 'If the fee is low'},
                    {name: 'Never'}
                ])
                this.feeUnit = ko.observableArray([
                    {name: 'sat/byte'},
                    {name: 'mSBCoin/kB'},
                ])
                this.currency = ko.observableArray([
                    {name: 'DOP'},
                    {name: 'BTN'},
                    {name: 'GIP'}
                ])

                this.pointIncrease = function(){
                    this.pointNumber(this.pointNumber() + 1);
                    if(this.pointNumber() === 6){
                        this.maxLimit(true);
                        this.minLimit(false);
                    }else{
                        this.maxLimit(false);
                        this.minLimit(false);
                    }
                }

                this.pointDecrease = function(){
                    this.pointNumber(this.pointNumber() - 1);
                    if(this.pointNumber() === 0){
                        this.minLimit(true);
                        this.maxLimit(false);
                    }else{
                        this.minLimit(false);
                        this.maxLimit(false);
                    }
                }
            }
            return {
                viewModel: OverviewModel,
                template: template
            };

    });
}());
