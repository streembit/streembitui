  'use strict';
    $(document).ready(function() {

            $(".icofont-minus").unbind('click').on('click',function(e) {
           
              e.preventDefault();
                var $this = $(this);
                var port = $($this.parents('.card'));
                var card = $(port).children('.card-block').slideToggle();
                
            });
            $(".icofont-close").on('click',function(e) {
                var $this = $(this);
                $($this.parents('.card').remove());
            });
            $(".icofont-refresh").on('click',function(e) {
                var $this = $(this);
                var port = $($this.parents('.card'));
                var loader = '<div class="btry-loader"><div class="btry inner"><div class="btry-charge"></div></div></div>';
                setTimeout( function() {  
                   $(e.target.offsetParent).css('opacity','0.4');   
                    port.append(loader);//$(card).show();
                    
                },100);
                setTimeout( function() { 
                    $(e.target.offsetParent).css('opacity','1'); 
                    port.children('.btry-loader').remove();
                },4000);
            });
        });
        $(window).on('load',function() {
            var $container = $('.filter-container');
            $container.isotope({
                filter: '*',
                animationOptions: {
                    duration: 750,
                    easing: 'linear',
                    queue: false
                }
            });
            var $grid = $('.default-grid').isotope({
                itemSelector: '.default-grid-item',
                masonry: {}
            });
        });
        
        
     
