"use strict";
   $(document).ready(function(){
    $(".fab-icon").on('click',function(){
      $(".fab-icon i").toggleClass("toolbar-active");
    }); 

    /*Radial button*/
     $('.fab').on('click',function(){
    $('.radial').toggleClass('open');
  });    

  /*floating action button*/ 
  $(".popout .btn").on('click',function() {

  $(this).toggleClass("active");
  $(this).closest(".popout").find(".panel").toggleClass("active");
});
$(document).on('click',function() {
  $(".popout .panel").removeClass("active");
  $(".popout .btn").removeClass("active");
});
$(".popout .panel").on('click',function(event) {

  event.stopPropagation();
});
$(".popout .btn").on('click',function(event) {
  event.stopPropagation();
});

/*Fab expand animation*/
  var $fab = $('#fab-expand');
var isExpanded = false;

$fab.on('click', function () {

  if (!isExpanded) {
    $fab.addClass('is-expanding');
    
    setTimeout(function () {
      $fab.find('.icofont').removeClass('icofont-plus').addClass('icofont-ui-close expand-close');
      $fab.removeClass('is-expanding').addClass('expanded');
      isExpanded = true;
      $fab.trigger('expanded');
    }, 500);
  }
});

$fab.on('click', '.expand-close', function (e) {
 
  var $close = $(this);
  e.stopPropagation();
  $fab.find('.inner-content').remove();
  $fab.removeClass('expanded').addClass('is-closing');

  setTimeout(function () {
    $close.removeClass('icofont-ui-close pull-right expand-close').addClass('icofont-plus');
    $fab.removeClass('is-closing');
    isExpanded = false;
  }, 500);
});

$fab.on('expanded', function () {
  $fab.append('<h1 class="inner-content">Content<h1/>');
});

 var links = [
    {
      "bgcolor":"#7cb342",
      "icon":"<i class='icofont icofont-plus'></i>"
    },
    {

      "bgcolor":"#f1c40f",
      "color":"fffff",
      "icon":"<i class='icofont icofont-pencil-alt-2'></i>"
      // "target":"_blank"
    },
    {
      "bgcolor":"#2ecc71",
      "color":"#fffff",
      "icon":"<i class='icofont icofont-speech-comments'></i>"
    },
    {
      "url":"#anchor",
      "bgcolor":"#e74c3c",
      "color":"#fffff",
      "icon":"A"
    }
    ];
    var options = {
      rotate: false
    };
    $('#vertical-fab').jqueryFab(links, options);

  });
