﻿/*

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


(function () {
    define(['i18next', 'appevents', 'settings','./help.html!text'], function ( i18next, appevents, settings, template) {
        function HelpViewModel(params) {
            this.showIntitleCollapse = ko.observable(true);
            this.showIntitleCollapse1 = ko.observable(true);
            this.showIntitleCollapse2 = ko.observable(true);
            this.showIntitleCollapse3 = ko.observable(true);
            this.showIntitleCollapse4 = ko.observable(true);
            this.Icon = ko.observable('fa fa-lg fa-plus-circle');
            this.init = function(){
                this.titleCollapse = function(){
                    if(this.showIntitleCollapse() == true){
                        this.showIntitleCollapse(false);
                    }else{
                        this.showIntitleCollapse(true);
                    }
                }

                this.titleCollapse1 = function(){
                    if(this.showIntitleCollapse1() == true){
                        this.showIntitleCollapse1(false);
                        this.Icon('fa fa-lg fa-minus-circle');
                    }else{
                        this.showIntitleCollapse1(true);
                        this.Icon('fa fa-lg fa-plus-circle');
                    }
                }

                this.titleCollapse2 = function(){
                    if(this.showIntitleCollapse2() == true){
                        this.showIntitleCollapse2(false);
                    }else{
                        this.showIntitleCollapse2(true);
                    }
                }
                this.titleCollapse3 = function(){
                    if(this.showIntitleCollapse3() == true){
                        this.showIntitleCollapse3(false);
                    }else{
                        this.showIntitleCollapse3(true);
                        this.showIntitleCollapse4(!this.showIntitleCollapse4());
                    }
                }
                this.titleCollapse4 = function () {
                    this.showIntitleCollapse4(!this.showIntitleCollapse4());
                }
                this.scrollToTop = function () {

                    if($(window).width() < 425) {
                        $("#app-container").animate({ scrollTop: 1150 }, 400);
                    }
                    else{
                        $("#app-container").animate({ scrollTop: 0 }, 400);
                        this.showIntitleCollapse4(!this.showIntitleCollapse4());
                    }
                }
                                

                var components = ['whatstreembitui_', 'opensource_', 'systemarchitecture_', 'security_', 'internetdevices_', 'settings_', 'addcontacthp_', 'contactoffer_', 'iotdevices_', 'addandmydevices_', 'accountnetwork_', 'mycontacts_', 'createaccount_', 'backupaccount_', 'restoreaccount_', 'deleteaccount_', 'logfiles_', 'connectpublic_', 'connectprivate_', 'sharekeys_', 'cleardatabase_', 'securityimplementation_', 'protectedkeyspair_', 'mitigaterisksofattacks_', 'howsecurecrypto_'];
                $.each(components, (idx, com) => {
                    if (!ko.components.isRegistered(com)) {
                        ko.components.register(com, { require: `./lib/app/views/help/${com}/${com}`});
                    }
                });

            }
                   
            this.init();
        }
        return {
            viewModel: HelpViewModel,
            template: template
        };
    });
}());
