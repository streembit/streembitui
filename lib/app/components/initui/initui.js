//import BaseVM from "../BaseVM";

//export default class InitUIVm extends BaseVM { 
//    constructor(params) {
//        super(params);
//    }
//}

//(function () {

//    var viewModel = function(params) {
//        this.route = (params && params.route) ? params.route : 0;
//        this.page = (params && params.page) ? params.page : 0;
//    };

//    module.exports = viewModel;

//}());


(function () {
    define(['knockout', './initui.html!text'], function (ko, template) {
        function InitUiViewModel(params) {
            this.route = (params && params.route) ? params.route : 0;
            this.page = (params && params.page) ? params.page : 0;
        }

        return {
            viewModel: InitUiViewModel,
            template: template
        };
    });
}());
