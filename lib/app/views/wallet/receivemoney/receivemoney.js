(function () {
    define(
        ['i18next', 'appevents', 'uihandler', 'database', './receivemoney.html!text'],
        function (i18next, appevents, uihandle, database, template) {
            function MyReceiveMoney(params) {
            	var viewModel = {
            	    // Fields
                    message: ko.observable(),
                    amount: ko.observable(),
                    label: ko.observable(),
                    addressPanel: ko.observable(false),
                    transactions: ko.observableArray([]),
                    address: null,
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
                        return this.ctrlc(`streambit:${this.address}`);
                    },

                    copyAddress: function () {
                        return this.ctrlc(this.address);
                    },

                    ctrlc: function (txt) {
                        if (!this.address) {
                            return;
                        }
                        uihandle.copyToClipboard(txt);
                    },

                    saveImg: function () {
                        if (!this.address) {
                            return;
                        }
                        var qrCodeBlock = $('#addr-qrcode');
                        uihandle.saveImgFromCanvas(qrCodeBlock, this.address);
                    },

                    generateAddress: function () {
                        if (this.validateForm()) {
                            appevents.dispatch("on-payment-request", {}, this.requestPaymentCallback);
                        }
                    },

                    updateIndexDB: function (data, callback) {
                        database.update(database.BCPAYMENTREQUESTS, data).then(
                            () => callback(null, data), err => callback(err)
                        )
                    },

                    requestPaymentCallback: function(err, address) {
                        if (err) {
                            return streembit.notify.error(err);
                        }

                        if (viewModel.validateForm()) { // protect on direct access
                            viewModel.address = address;
                            var data = {
                                key: address,
                                time: +new Date(), // ms
                                amount: viewModel.amount(),
                                label: viewModel.label(),
                                message: viewModel.message()
                            };
                            // Async DB update
                            viewModel.updateIndexDB(data, viewModel.reportUpdateDB);

                            // and show modal unrelated(?) to result of DB saving
                            uihandle.qrGenerate(viewModel.qrcode_element, address);
                            $(viewModel.addressClass).text(address);
                            viewModel.addressPanel(true);
                        }
                    },

                    reportUpdateDB: function (err, data) {
                        if (err) {
                            return streembit.notify.error(err);
                        }

                        viewModel.transactions([ ...viewModel.transactions(), data ]);

                        streembit.notify.success('Address successfully saved in DB');
                    },

                    init: function () {
                        // get payment request collections
                        database.getall(database.BCPAYMENTREQUESTS, (err, result) => {
                            if (err) {
                                return streembit.notify.error(err);
                            }

                            this.transactions(result);
                        });
                    }
                };

            	viewModel.init();

                return viewModel;
            }

            return {
                viewModel: MyReceiveMoney,
                template: template
            };
    });
}());