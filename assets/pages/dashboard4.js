  'use strict';
  $(document).ready(function() {
/*Counter Js Starts*/
$('.counter').counterUp({
    delay: 10,
    time: 400
});
/*Counter Js Ends*/
            function setHeight() {
                var $window = $(window);
                var windowHeight = $(window).height();
                if ($window.width() >= 320) {
                    $('.user-list').parent().parent().css('min-height', windowHeight);
                    $('.user-list').parent().parent().css('right', -300);
                }
            };
            setHeight();

            $(window).on('load',function() {
                setHeight();
            });

            //add scroll to table

$(".dasboard-4-table-scroll").slimScroll({
                height: 330,
                 allowPageScroll: false,
                 wheelStep:5,
                 color: '#000'
           });
        });

      