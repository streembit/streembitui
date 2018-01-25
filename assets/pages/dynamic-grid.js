  'use strict';
 $(document).ready(function() {  
  var $grid = $('.default-grid').isotope({
   itemSelector: '.default-grid-item',
   masonry: {
   }
 });

  /*======= Filterning js starts ======= */
  $(window).on('load',function(){
    var $container = $('.filter-container');
    $container.isotope({
      filter: '*',
      animationOptions: {
        duration: 750,
        easing: 'linear',
        queue: false
      }
    });

    $('.sorting-filter li .filter-tab').on('click',function(){
      $('.sorting-filter .current').removeClass('current');
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
  }); 

  /*======= Filterning js ends ======= */ 

  /*======= Sorting js starts ======= */
  $(window).on('load',function(){
    var $container = $('.sorting-container');
    $container.isotope({
      sortBy : 'name_asc',
      sortAscending : true,
      filter: '*',
      animationOptions: {
        duration: 750,
        easing: 'linear',
        queue: false
      }
    });
$('.sorting_txt-filter li .sorting-tab').on('click',function(){
  // get href attribute, minus the '#'
  var sortName = $(this).val();
  $('#container').isotope({ sortBy : sortName });
  return false;
});

    $('.sorting_txt-filter li .sorting-tab').on('click',function(){
      $('.sorting_txt-filter .current').removeClass('current');
      $(this).addClass('current');
      var order_tab = ($(this).val());
      var selector = $(this).attr('data-filter');
      if(order_tab=="asc")
      	order_tab=true;
      else
      	order_tab=false;
      $container.isotope({
        sortAscending: order_tab,
        filter: selector,
        animationOptions: {
          duration: 750,
          easing: 'linear',
          queue: false
        }
      });
      return false;
    }); 
  }); 

  /*======= Sorting js ends ======= */  
});