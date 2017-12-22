(function () {
    define(
        ['./receivemoney.html!text'], 
        function (template) {
            function MyReceiveMoney(params) {
            	var self = this;
            	
            }
            return {
                viewModel: MyReceiveMoney,
                template: template
            };

    });
}());
