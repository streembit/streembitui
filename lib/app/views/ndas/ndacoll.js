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

'use strict';

(function () {

    define(
        ['appsrvc', 'user', 'definitions', 'jsrsasign', 'uihandler', 'moisrvc', './view.html!text'],
        function (appsrvc, user, defs, jsrsa, uihandler, moisrvc, template) {

            function NdaVm() {

                var viewModel = {

                    ndas: ko.observableArray([]),

                    init: function (callback) {
                        try {                           
                        }
                        catch (err) {
                            doorclient.notify.error("Certificates init error: %j", err);
                        }
                    },

                    on_item_click: function (item, e) {
                        var element = e.currentTarget;
                        $('.glyphicon', element)
                            .toggleClass('glyphicon-chevron-right')
                            .toggleClass('glyphicon-chevron-down');
                        
                    },

                    upgrade: function (item) {
                        var reply = confirm("Would you like to upgrade to this level your IDQA score?");
                        if (reply) {
                            alert("Currently the upgrade to this level is not available. Please contact your service provider for more information about how you can improve your IDQA score!");
                        }
                    },

                    getdata: function () {
                        try {
                            var self = this;

                            this.certificates([]);

                            // invoke blockui
                            uihandler.blockwin();

                            moisrvc.sendauth("getidqa", {},
                                function (ret) {
                                    // unblock when ajax activity stops 
                                    uihandler.unblockwin();

                                    if (!ret || ret.status != 0) {
                                        return doorclient.notify.error("Error in getting file cabinets");
                                    }

                                    if (ret.result) {
                                        var index = 1;
                                        var collection = [];
                                        ret.result.forEach((item) => {
                                            var cert = new CertItem(index++, item);
                                            collection.push(cert);
                                        });

                                        self.certificates(collection);
                                    }
                                },
                                function (err) {
                                    // unblock when ajax activity stops 
                                    uihandler.unblockwin();
                                    doorclient.notify.error("Error in getting file cabinets", err);
                                }
                            );
                        }
                        catch (e) {
                            uihandler.unblockwin();
                            doorclient.notify.error("Error in getting file cabinets %", e.message);
                        }
                    }        
                };

                viewModel.init();

                return viewModel;
            }       

            return {
                viewModel: NdaVm,
                template: template
            };
        });

}());



