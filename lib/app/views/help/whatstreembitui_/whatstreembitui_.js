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
        ['./en/whatstreembitui_.html!text'], 
        function (template) {
            function WhatStreemModel(params) {
                
                
                
            }
            return {
                viewModel: WhatStreemModel,
                 template: { require: 'lib/app/views/help/whatstreembitui_/' + window.currentLang + '/whatstreembitui_.html!text' },
            };

    });
}());
