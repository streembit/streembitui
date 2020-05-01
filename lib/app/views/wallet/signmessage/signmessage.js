'use strict';
(function () {
    define(
        ['i18next', 'definitions', 'appevents', 'settings', 'uihandler', 'database', './signmessage.html!text'], 
        function (i18next, definitions, appevents, settings, uihandler, database, template) {

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

                    $(document).off('keyup', '#recipientAddressField').on('keyup', '#recipientAddressField', function (e){
                        window.recipientAddressField = $(this).val();
                    });

                    $('#tab1 .signMsgBtn').off('click').on('click', function(){
                         appevents.dispatch("on-sign-verify-message", {recipientaddress: window.recipientAddressField, type:'sign'}, signMessageCallback);
                    })
                    
                    function signMessageCallback(err, message){
                        if(err){
                            $.notify({
                                // options
                                message: err, 
                            },{
                                // settings
                                type: 'danger',
                                z_index: 2000,
                            });
                        } else {
                            $('textarea#signMessageTextarea').html(message);
                            $.notify({
                                // options
                                message: 'Successfully signed' 
                            },{
                                // settings
                                type: 'success',
                                z_index: 2000,
                            });
                        }
                    }

                    $('#tab1 .signClearBtn').off('click').on('click' ,function(){
                        $('#tab1 #recipientAddressField').val("");
                        $('#signMessageTextarea').html("");
                        $('.generateSignature').val("");

                    })

                    $(document).off('keyup', '#recAddressField').on('keyup', '#recAddressField', function (e){
                        window.recAddressField = $(this).val();
                    });

                    $('#tab2 .verifyMsgBtn').off('click').on('click' ,function(){
                        appevents.dispatch("on-sign-verify-message", {recipientaddress: window.recAddressField, type:'verify'}, verifyMessageCallback);
                    })

                    function verifyMessageCallback(err, message){
                        if(err){
                            $.notify({
                                // options
                                message: err,
                            },{
                                // settings
                                type: 'danger',
                                z_index: 2000,
                            });
                        }else{
                            $.notify({
                                // options
                                message: 'Successfully verified' 
                            },{
                                // settings
                                type: 'success',
                                z_index: 2000,
                            });
                        }
                    }

                    $('#tab2 .verifyClearBtn').off('click').on('click' ,function(){
                        $('.recAddressField').val("");
                        $('.verifyTextAr').html("");
                        $('.verifyTextAr2').html("");
                    })

                    $('#tab1 .addressBookBtn').off('click').on('click' ,function(){
                        console.log('address book')
                    })

                    $('#tab1 .fileTextBtn').off('click').on('click' ,function(){
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