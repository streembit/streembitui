  'use strict';
   $(document).ready(function() {
           
            function setHeight() {
                var $window = $(window);
                windowHeight = $(window).height();
                if ($window.width() >= 320) {
                    $('.user-list').parent().parent().css('min-height', windowHeight);
                    $('.chat-window-inner-content').css('max-height', windowHeight);
                    $('.user-list').parent().parent().css('right', -300);
                }
            };
            setHeight();

            $(window).on('load',function() {
                setHeight();
            });

            /*open chatbox*/
            $('.displayChatbox').on('click', function() {
                var options = {
                    direction: 'right'
                };
                $('.showChat').toggle('slide', options, 500);
            });

            $('.userlist-box').on('click', function() {

                /* $('.showChat').css('display', 'none');*/
                /*get user data*/
                /*dataId = $(this).attr('data-id');
                dataStatus = $(this).data('status');
                dataUserName = $(this).attr('data-username');
                _return = false;
                                   $("#pcapp-wrapper").append('<div class="showChat_inner"><a class="back_chatBox" onclick="backFunction()">back</a><p>'+ dataUserName  +'</p></div>');*/
                var options = {
                    direction: 'right'
                };
                $('.showChat_inner').toggle('slide', options, 500);
            });

            $('.back_chatBox').on('click', function() {

                /*$('.showChat_inner').css('display', 'none');*/
                var options = {
                    direction: 'right'
                };
                $('.showChat_inner').toggle('slide', options, 500);
                $('.showChat').css('display', 'block');
            });
        });

        