'use strict';

(function () {

    define(
        ['i18next', 'user', './remnemonic.html!text'],
        function (i18next, user, template) {

            function RestoreByMnemonicVm(params) {

                this.ismnemonic_error = ko.observable(false);
                this.valid_mnemonic = ko.observable(false);
                this.mnemonic = ko.observable("");
                this.mnemonicerrormsg = ko.observable("");

                this.onMnemonicBlur = function() {

                    this.ismnemonic_error(false);
                    this.mnemonicerrormsg("");

                    if (!this.validateMnemonicText()) {
                        this.mnemonicerrormsg(i18next.t("errmsg-remnemonic-invalid"));
                        this.ismnemonic_error(true);
                        return false;
                    }

                    this.valid_mnemonic(true);

                    return true;
                };

                this.validateMnemonicText = function () {
                    var mnemonic = this.mnemonic();
                    mnemonic = $.trim(mnemonic).replace(/[\r\n]/, ' ').replace(/\s+/, ' ');
                    if (!mnemonic || mnemonic.length < 36) {
                        return this.validateMnemonicFailed();
                    }

                    var Rx_mne = /^[a-z ]+$/im;
                    if (!Rx_mne.test(mnemonic)) {
                        return this.validateMnemonicFailed("errmsg-remnemonic-invalid");
                    }

                    var mne_r = mnemonic.split(' ');
                    if (mne_r.length < 12) {
                        return this.validateMnemonicFailed("errmsg-remnemonic-invalid");
                    }

                    $.each(mne_r, (idx, mne) => {
                        if (mne.length < 3) {
                            return this.validateMnemonicFailed("errmsg-remnemonic-invalid");
                        }
                    });

                    if (!user.validate_mnemonic(mnemonic)) {
                        return this.validateMnemonicFailed("errmsg-remnemonic-validation-failed");
                    }

                    return true;
                };

                this.validateMnemonicFailed = function() {
                    this.mnemonicerrormsg(i18next.t("errmsg-remnemonic-invalid"));
                    this.ismnemonic_error(true);
                    return false;
                };
            }

            return {
                viewModel: RestoreByMnemonicVm,
                template: template
            };
        });

}());
