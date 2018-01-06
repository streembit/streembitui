(function () {
    define(
        ['i18next', 'appevents', 'uihandler', './receivemoney.html!text'],
        function (i18next, appevents, uihandle, template) {
            function MyReceiveMoney(params) {
            	var viewModel = {
            	    // Fields
                    message: ko.observable(),
                    amount: ko.observable(),
                    label: ko.observable(),
                    addressPanel: ko.observable(false),
                    // Errors
                    errMessage: ko.observable(false),
                    errTxtMessage: ko.observable(''),
                    errAmount: ko.observable(false),
                    errTxtAmount: ko.observable(''),
                    errLabel: ko.observable(false),
                    errTxtLabel: ko.observable(''),
                    // QRCode element
                    qrcode_element: '#addr-qrcode',
                    addressClass: '.payment-to',

                    // Validation
                    validateForm: function () {
                        var message = this.message(),
                            amount = this.amount(),
                            label = this.label();
                        if (message && message.length && !/^[a-z0-9 ,\._!\?#%&\(\)\+\-]{2,100}$/im.test(message)) {
                            this.errMessage(true);
                            this.errTxtMessage(i18next.t('errmsg-wallet-receive-message'));
                        } else {
                            this.errMessage(false);
                            this.errTxtMessage('');
                        }
                        if (amount && amount.length && (isNaN(+amount) || +amount <= 0)) {
                            this.errAmount(true);
                            this.errTxtAmount(i18next.t('errmsg-wallet-send-amount'));
                        } else {
                            this.errAmount(false);
                            this.errTxtAmount('');
                        }
                        if (label && label.length && !/^[a-z0-9 _\-]{2,40}$/im.test(label)) {
                            this.errLabel(true);
                            this.errTxtLabel(i18next.t('errmsg-wallet-receive-label'));
                        } else {
                            this.errLabel(false);
                            this.errTxtLabel('');
                        }

                        if (this.errMessage() === true || this.errAmount() === true || this.errLabel() === true) {
                            return false;
                        }

                        return true;
                    },

                    clear: function () {
                        this.message('');
                        this.amount('');
                        this.label('');
                        this.errMessage(false);
                        this.errTxtMessage('');
                        this.errAmount(false);
                        this.errTxtAmount('');
                        this.errLabel(false);
                        this.errTxtLabel('');
                    },

                    closePanel: function () {
                        this.addressPanel(false);
                        $(viewModel.addressClass).text('');
                        $(viewModel.qrcode_element).html('');
                        this.clear();
                    },

                    copyUri: function () {

                    },

                    copyAddress: function () {

                    },

                    saveImg: function () {

                    },

                    generateAddress: function () {
                        if (this.validateForm()) {
                            appevents.dispatch("on-payment-request", {}, this.requestPaymentCallback);
                        }
                    },

                    updateIndexDB: function () {

                    },

                    requestPaymentCallback: function(err, address) {
                        if (err) {
                            return streembit.notify.error(err);
                        }
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