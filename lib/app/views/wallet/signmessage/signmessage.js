'use strict';
(function () {
    define(
        ['i18next', 'definitions', 'appevents', 'settings', 'uihandler', './signmessage.html!text'], 
        function (i18next, definitions, appevents, settings, uihandler, template) {

            function SignMessageModel(params) {
                $('body').on('click', '.content-panel .dividerLine', function(){
                    $('.tabs .tab-links a[href="#tab1"]').trigger('click');
                })
                
                $(document).on('click', '.tabs .tab-links a', function(e)  {
                    var currentAttrValue = $(this).attr('href');

                    // Show/Hide Tabs
                    $('.tabs ' + currentAttrValue).show().siblings().hide();
             
                    // Change/remove current tab to active
                    $(this).parent('li').addClass('active').siblings().removeClass('active');
             

                    $('#tab1 .signMsgBtn').click(function(){
                        console.log('sign message')
                    })

                    $('#tab1 .signClearBtn').click(function(){
                        console.log('clear sign')
                        $('#tab1 .recipientAddressField').val("");
                        
                    })

                    $('#tab2 .verifyMsgBtn').click(function(){
                        console.log('verify message')
                    })

                    $('#tab2 .verifyClearBtn').click(function(){
                        console.log('clear verify')
                    })

                    $('#tab1 .addressBookBtn').click(function(){
                        console.log('address book')
                    })

                    $('#tab1 .fileTextBtn').click(function(){
                        console.log('file text')
                    })

                    e.preventDefault();
                });
               
            }
           
            return {
                viewModel: SignMessageModel,
                template: template
            };
           
    });
}());