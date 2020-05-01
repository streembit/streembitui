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
        [ 'appsrvc', 'logger', './logs.html!text'],
        function (appsrvc, logger, template) {

        function format_log_date(time) {
            return 
        }

        function LogsVm(params) {
            var viewModel = {
                errors: ko.observableArray([]),
                infos: ko.observableArray([]),
                debugs: ko.observableArray([]),

                init: function (errlist, infolist, debuglist) {
                    try {
                        if (!errlist || !errlist.length) {
                            errlist = [];
                        }
                        if (!infolist || !infolist.length) {
                            infolist = [];
                        }
                        if (!debuglist || !debuglist.length) {
                            debuglist = [];
                        }
                        this.errors(logger.getlogs("error"));
                        this.infos(logger.getlogs("info"));
                        this.debugs(logger.getlogs("debug"));
                    }
                    catch (err) {
                        streembit.logger.error("add_message error %j", err);
                    }
                }
            };

            viewModel.init();

            return viewModel;
        }           

        return {
            viewModel: LogsVm,
            template: template
        };
    });

}());



