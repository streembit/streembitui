  'use strict';
 if( $('.cd-stretchy-nav').length > 0 ) {

        var stretchyNavs = $('.cd-stretchy-nav');

        stretchyNavs.each(function(){

            var stretchyNav = $(this),
            stretchyNavTrigger = stretchyNav.find('.cd-nav-trigger');

            stretchyNavTrigger.on('click', function(event){

                event.preventDefault();
                stretchyNav.toggleClass('nav-is-visible');
            });
        });

    }

    // b- menu start
    $('.b-menu-icon').on('click', function(event){
        $('.b-menu-left').toggle();
        $('.b-menu-right').toggle();
        $(this).toggleClass('radius');
        $(this).toggleClass('rotate-remove-plus');
         $('.b-menu-main').slideToggle();
    });

    // b- menu open on page load
    $(document).ready(function(){
        var $window = $(window);
        var windowHeight = $(window).innerHeight();
        if ($window.width() >= 767) {
            $('.b-menu-left').toggle();
            $('.b-menu-right').toggle();
            $('.b-menu-icon').addClass('radius');
            $('.b-menu-icon').removeClass('rotate-remove-plus');
            $('.b-menu-main').slideToggle();
        }
    });

    $('ul.b-menu-right li.dropup-mega,ul.b-menu-left li.dropup-mega,ul.b-menu-right li.dropup,ul.b-menu-left li.dropup').on('hover',function () {
        $(this).find('.dropdown-menu').stop(true, true).delay(200).fadeIn(500);
    }, function () {
        $(this).find('.dropdown-menu').stop(true, true).delay(200).fadeOut(500);
    });
