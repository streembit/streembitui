  'use strict';
window.addEventListener('load', setMenu, false);
window.addEventListener('resize', setMenu, false);
function setMenu(){
	var $window = $(window);
    if ($window.width() < 1024 && $window.width() >= 767) {
     	$("body").addClass("sidebar-collapse");
     	$("body").removeClass("fixed");
     	$("#sidebar-scroll").css('width','100%');
    	$("#sidebar-scroll").slimScroll({destroy: true});
        $(".sidebar").css('overflow','visible');
        $(".sidebar-menu").css('overflow','visible');
    } 
    else if($window.width() >= 1024){
    	$("#sidebar-scroll").css('width','100%');
    	$("#sidebar-scroll").slimScroll({destroy: true});
        $(".sidebar").css('overflow','visible');
        $(".sidebar-menu").css('overflow','visible');
        $("body").removeClass("fixed");
    }
    else if($window.width() < 767){
      
        $("body").addClass("sidebar-collapse");
      $("body").removeClass("fixed");
      $("#sidebar-scroll").css('width','100%');
      $("#sidebar-scroll").slimScroll({destroy: true});
        $(".sidebar").css('overflow','visible');
        $(".sidebar-menu").css('overflow','visible');
    }
    else{
    	$("body").removeClass("sidebar-collapse");
    	$("body").addClass("fixed");
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
}

 