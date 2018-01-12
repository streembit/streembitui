'use strict';
(function () {
    define(
        ['i18next', 'definitions', 'appevents', 'settings', 'uihandler', './signmessage.html!text'], 
        function (i18next, definitions, appevents, settings, uihandler, template) {

            function SignMessageModel(params) {
              
                this.tabChange = function(){
                    console.log(7777)
                }

            }

            return {
                viewModel: SignMessageModel,
                template: template
            };
            ko.applyBindings(new SignMessageModel());
    });
}());