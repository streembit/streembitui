"use strict";
$(document).ready(function(){
  /*scroll*/
    $(".user-box-users").slimScroll({
             height: "90%",
              allowPageScroll: false,
            color :'#1b8bf9'
        });

 setContactBox();
   function setContactBox(){
   	  var $window = $(window);
if ($window.width() < 991) {
 
    	$(".contact-box").css('display','none');
      $(".contact-btn").css('display','block');
    }
    else{
   
      $('.contact-box').css('display','block');;
     $(".contact-btn").css('display','none');
    }

   };
 $(window).resize(function() {
   setContactBox();
    
 });
 /*toggle button click*/
  $('.contact-btn').on('click', function() {

  
                var options = {
                    direction: 'right'
                };
                $('.contact-box').toggle('slide', options, 500);
  
});
// search
  $("#search-users").on("keyup", function() {

      var g = $(this).val().toLowerCase();
      $(".contact-box .media-body .users-header").each(function() {

          var s = $(this).text().toLowerCase();
          $(this).closest('.friendlist-box')[ s.indexOf(g) !== -1 ? 'show' : 'hide' ]();
      });
  });
        });