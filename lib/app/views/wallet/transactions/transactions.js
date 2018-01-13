(function () {
    define(
        ['./transactions.html!text'], 
        function (template) {
            function MyTransactions(params) {
            	var self = this;
                self.date = ko.observableArray([
                    {name: 'Today'},
                    {name: 'This Week'},
                    {name: 'This Month'},
                    {name: 'This Year'},
                    {name: 'Custom Range'}
                ])
                self.opTransactions = ko.observableArray([
                    {name: 'All Transactions'},
                    {name: 'Sent To'},
                    {name: 'Received From'},
                    {name: 'To Myself'},
                    {name: 'Custom Range'},
                ])
            }
            return {
                viewModel: MyTransactions,
                template: template
            };

    });
}());
