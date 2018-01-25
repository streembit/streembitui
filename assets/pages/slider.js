  'use strict';
 $(document).ready(function() {  
 /*owl carosel slider */
 $(".slider-center").owlCarousel({
        dots: true,
        nav:true,
        autoplay:true,
        autoplayTimeout:1000,
        margin:10,
        smartSpeed:1000,
        loop:true,
        slideSpeed:300,
        items:5,
        // rtl: true, this start a image from right side to left
        singleItem:true,
         responsiveClass:true,
        responsive:{
        0:{
            items:1,
            nav:true
        },
        600:{
            items:3,
            nav:true
        },
        1000:{
            items:6,
            nav:true,
            loop:true
        }
    }
        
       });

     /*swiper slider */
        var swiper = new Swiper('.swiper-container', {
        pagination: '.swiper-pagination',
        slidesPerView: 6,
        paginationClickable: true,
        spaceBetween: 30,
        Speed: 1000,
        loop:true,
        autoplay:1000,
        effect:'slide',
        breakpoints: {
            1199: {
                slidesPerView: 6
            },
            992: {
                slidesPerView: 3,
                spaceBetween: 30
            },
            640: {
                slidesPerView: 1,
                spaceBetween: 20
            }

        }
    });
    });