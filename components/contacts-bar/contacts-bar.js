define(['knockout', 'text!./contacts-bar.html', 'appsrvc'], function (ko, template, appsrvc) {

    function ConstactsViewModel(params) {
        this.appsrvc = appsrvc;
        this.route = params.route;
    }

    return { viewModel: ConstactsViewModel, template: template };
});
