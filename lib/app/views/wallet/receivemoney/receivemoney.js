(function () {
    define(
        ['appevents', 'uihandler', './receivemoney.html!text'],
        function (appevents, uihandle, template) {
            function MyReceiveMoney(params) {
            	var viewModel = {
            	    // Fields
                    address: ko.observable(),
                    amount: ko.observable(),
                    label: ko.observable(),
                    addressPanel: ko.observable(false),
                    // Errors
                    errAddress: ko.observable(false),
                    errTxtAddress: ko.observable(''),
                    errAmount: ko.observable(false),
                    errTxtAmount: ko.observable(''),
                    errLabel: ko.observable(false),
                    errTxtLabel: ko.observable(''),
                    // QRCode element
                    qrel: '#addr-qrcode',
                    addressClass: '.payment-to',

                    generateAddress: function () {
                        appevents.dispatch("on-payment-request", {}, this.requestPaymentCallback);
                    },

                    clear: function () {

                    },

                    requestPaymentCallback: function(address) {
                        uihandle.qrGenerate(viewModel.qrel, address);
                        $(viewModel.addressClass).text(address);
                        viewModel.addressPanel(true);
                    }
                };

                return viewModel;
            }

            ko.bindingHandlers.fadeVisible = {
                init: function(element, valueAccessor) {
                    $(element).toggle(ko.unwrap(valueAccessor()));
                },
                update: function(element, valueAccessor) {
                    ko.unwrap(valueAccessor()) ? $(element).fadeIn() : $(element).fadeOut();
                }
            };

            return {
                viewModel: MyReceiveMoney,
                template: template
            };

            ko.applyBindings(new MyReceiveMoney());
    });
}());
