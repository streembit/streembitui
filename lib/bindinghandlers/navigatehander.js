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

    var navigateHandler = {
        init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
        },

        update: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
            var value = ko.toJS(valueAccessor());
            var page = value.page;
            appevents.navigate(page);
        }
    };

    var navobj = {
        init: function () {
            ko.bindingHandlers['navigate'] = navigateHandler;
        }
    };

    module.exports = navobj;
})();
