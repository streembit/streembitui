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
                    qrcode_element: '#addr-qrcode',
                    addressClass: '.payment-to',

                    generateAddress: function () {
                        appevents.dispatch("on-payment-request", {}, this.requestPaymentCallback);
                    },

                    clear: function () {
                        this.address('');
                        this.amount('');
                        this.label('');
                        this.errAddress(false);
                        this.errTxtAddress('');
                        this.errAmount(false);
                        this.errTxtAmount('');
                        this.errLabel(false);
                        this.errTxtLabel('');
                    },

                    closePanel: function () {
                        this.addressPanel(false);
                        $(viewModel.addressClass).text('');
                        $(viewModel.qrcode_element).html('');
                    },

                    requestPaymentCallback: function(address) {
                        uihandle.qrGenerate(viewModel.qrcode_element, address);
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