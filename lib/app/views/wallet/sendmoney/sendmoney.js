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

'use strict';

(function () {
    define(
        ['i18next', 'streembitnet', 'settings', './sendmoney.html!text'], 
        function (i18next, streembitnet, settings, template) {

            function MySendMoneyModel(params) {
                var self = this;
                self.payBit = ko.observable();
                self.inputText = ko.observable();
                self.amountText = ko.observable();
                self.feesText = ko.observable();
                
                self.clear = function(a) {
                    self.payBit(null);
                    self.inputText(null);
                    self.amountText(null);
                    self.feesText(null);
                                 
                }
            
            }
            return {
                viewModel: MySendMoneyModel,
                template: template
            };

    });
}());
