  'use strict';
$(document).ready(function() {  
/*======= Portfolio js starts ======= */
 
        var $container = $('.portfolioContainer');
        $container.isotope({
            filter: '*',
            animationOptions: {
                duration: 750,
                easing: 'linear',
                queue: false
            }
        });

        $('.portfolioFilter li .btn').on('click',function(){
            $('.portfolioFilter .current').removeClass('current');
            $(this).addClass('current');
            var selector = $(this).attr('data-filter');
            $container.isotope({
                filter: selector,
                animationOptions: {
                    duration: 750,
                    easing: 'linear',
                    queue: false
                }
            });
            return false;
        });

    /*======= Portfolio js ends ======= */
    /*----------------------------------------------------
     TESTIMONIAL SLIDER
     ----------------------------------------------------*/

    $('#testimonial-slider').slick({
        slidesToShow: 1,
        slidesToScroll: 1,
        arrows: false,
        autoplay: false,
        draggable: true,
        fade: true,
        asNavFor: '#testimonial-carousel'
    });

    $('#testimonial-carousel').slick({
        slidesToShow: 1,
        slidesToScroll: 1,
        asNavFor: '#testimonial-slider',
        dots: true,
        arrows: false,
        centerMode: true,
        autoplay: false,
        focusOnSelect: true,
        centerPadding: '40px',
        responsive: [,
            {
                breakpoint: 600,
                settings: {
                    autoplay: false,
                    dots: true,
                    slidesToShow: 1,
                    centerPadding: '0px',
                    centerMode: true
                }
            },
            {
                breakpoint: 992,
                settings: {
                    slidesToShow: 1,
                    centerMode: true
                }
            },
            {
                breakpoint: 1199,
                settings: {
                    centerPadding: '10px'

                }
            }
        ]
    });
    //Our Clients start
    $('.ourclientsslid').slick({
        infinite: true,
        slidesToShow: 6,
        slidesToScroll: 6,
        dots: false,
        arrows:false,
        autoplay: true,
        autoplaySpeed: 6000,
        responsive: [
            {
                breakpoint: 1024,
                settings: {
                    slidesToShow: 4,
                    slidesToScroll: 4,
                    infinite: true,
                    dots: false
                }
            },
            {
                breakpoint: 800,
                settings: {
                    slidesToShow: 3,
                    slidesToScroll: 3,
                    dots: false
                }
            },
            {
                breakpoint: 480,
                settings: {
                    slidesToShow: 2,
                    slidesToScroll: 2,
                    dots: false
                }

            }
        ]
    });
    //Our Clients End
    // Add smooth scrolling on all links inside the navbar
    // Add smooth scrolling on all links inside the navbar
    $("#navbarResponsive a").on('click', function(event) {

        // Prevent default anchor click behavior
        event.preventDefault();

        // Store hash
        var hash = this.hash;

        // Using jQuery's animate() method to add smooth page scroll
        // The optional number (800) specifies the number of milliseconds it takes to scroll to the specified area
        $('html, body').animate({
            scrollTop: $(hash).offset().top
        }, 800, function(){

            // Add hash (#) to URL when done scrolling (default click behavior)
            window.location.hash = hash;
        });
    });
//    End Smooth Scrolling
});

    /*------------------------------------------
   Scroll Up Button
   ------------------------------------------*/
  $(window).scroll(function () {
      if ($(this).scrollTop() > 600) {
          $('.scrollup').fadeIn();
      } else {
          $('.scrollup').fadeOut();
      }
  });

  $('.scrollup').click(function () {
      $("html, body").animate({
          scrollTop: 0
      }, 600);
      return false;
  });