  'use strict';
$(document).ready(function() {
  /* menu scroll fixed */
 $(window).scroll(function(){
  if($(window).width()>767){
  var sidbar_top =50 - $(window).scrollTop();
  if($(window).scrollTop()>50){
    $('.main-sidebar').css('position','fixed');
        $('.main-sidebar').css('top','0');
    $('.main-sidebar').css('padding-top','0');
  }
  else{
    $('.main-sidebar').css('position','absolute');
    $('.main-sidebar').css('padding-top','50px');
    }
  }
  else{
    $('.main-sidebar').css('position','absolute');
    $('.main-sidebar').css('padding-top','100px');
  }
 });
});

