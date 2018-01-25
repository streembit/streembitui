  'use strict';
$(document).ready(function() {
var a= $(window).height()-70;
        $('#sidebar-scroll').height($(window).height()-70);
        $("#sidebar-scroll").slimScroll({
             height: a,
              allowPageScroll: false,
              wheelStep:5,
              color: '#000'

        });

$('.sidebar-toggle').on('click',function(){
          if($("body").hasClass("sidebar-collapse") == true){
               $("#sidebar-scroll").slimScroll({destroy: true});
               $(".sidebar").css('overflow','visible');
               $(".sidebar-menu").css('overflow','visible');
          }
          else{
            var a= $(window).height()-70;
            $('#sidebar-scroll').height($(window).height()-70);
            $("#sidebar-scroll").slimScroll({
                 height: a,
                  allowPageScroll: false,
                  wheelStep:5,
                  color: '#000'
            });
            $("#sidebar-scroll").css('width','100%');
            $(".sidebar").css('overflow','inherit');
            $(".sidebar-menu").css('overflow','inherit');
          }
        });
});
 $(window).scroll(function(){
 /*if($(window).scrollTop()<=50){
 			var sidbar_top = 50 - $(window).scrollTop();
            $('.main-sidebar').css('position','absolute');
            $('.main-sidebar').css('padding-top',sidbar_top);

        }
        else if($(window).scrollTop()>52){*/
        	var sidbar_top = 50 - $(window).scrollTop();
        	if(sidbar_top>0){
        		console.log(sidbar_top);
        		$('.main-sidebar').css('padding-top',sidbar_top);
		        $('.main-sidebar').css('top','0');
		        $('.main-sidebar').css('position','fixed');
        	}
        	else{
	            $('.main-sidebar').css('padding-top','0');
	            $('.main-sidebar').css('top','0');
	            $('.main-sidebar').css('position','fixed');
	        }
        //}
 });