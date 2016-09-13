define(['knockout', 'text!./initui.html', 'appsrvc'], function (ko, template, appsrvc) {

    function InitUIViewModel(params) {
        this.route = params.route;
    }

    return { viewModel: InitUIViewModel, template: template };
});
