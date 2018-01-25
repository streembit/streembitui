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
    });

   

    // toggle full screen
    function toggleFullScreen() {
        if (!document.fullscreenElement &&    // alternative standard method
                !document.mozFullScreenElement && !document.webkitFullscreenElement) {  // current working methods
            if (document.documentElement.requestFullscreen) {
                document.documentElement.requestFullscreen();
            } else if (document.documentElement.mozRequestFullScreen) {
                document.documentElement.mozRequestFullScreen();
            } else if (document.documentElement.webkitRequestFullscreen) {
                document.documentElement.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
            }
        } else {
            if (document.cancelFullScreen) {
                document.cancelFullScreen();
            } else if (document.mozCancelFullScreen) {
                document.mozCancelFullScreen();
            } else if (document.webkitCancelFullScreen) {
                document.webkitCancelFullScreen();
            }
        }
    }

    // keydown event handler
    document.addEventListener('keydown', function(e) {
        if (e.keyCode == 13 || e.keyCode == 70) { // F or Enter key
            toggleFullScreen();
        }
    }, false);