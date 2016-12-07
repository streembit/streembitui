/*

This file is part of Streembit application. 
Streembit is an open source project to create a real time communication system for humans and machines. 

Streembit is a free software: you can redistribute it and/or modify it under the terms of the GNU General Public License 
as published by the Free Software Foundation, either version 3.0 of the License, or (at your option) any later version.

Streembit is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty 
of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU General Public License for more details.

You should have received a copy of the GNU General Public License along with Streembit software.  
If not, see http://www.gnu.org/licenses/.
 
-------------------------------------------------------------------------------------------------------------------------
Author: Tibor Zsolt Pardi 
Copyright (C) 2016 The Streembit software development team
-------------------------------------------------------------------------------------------------------------------------

*/

(function () {
    var $ = require('jquery');
    var appevents = require('appevents');
    var ko = require('knockout');

    var progressctrl = {
        init: function (element, valueAccessor, allBindings, viewModel, bindingContext) {
            var max = allBindings.get('max');
            if (max && typeof max == "function") {
                element.max = max();
            }
        },
        update: function (element, valueAccessor, allBindings) {
            var val = ko.utils.unwrapObservable(valueAccessor());
            if (val) {
                element.value = val;
            }
        }
    };

    var bindobj = {
        init: function () {
            ko.bindingHandlers['progressctrl'] = progressctrl;
        }
    };

    module.exports = bindobj;
})();
