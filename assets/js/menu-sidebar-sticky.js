  'use strict';
$(window).scroll(function(){
 	if($("body").hasClass("sidebar-collapse")==false){
	 	if($(window).width()<767)
	 		var sidbar_top = 100 - $(window).scrollTop();
	 	else
	 		var sidbar_top = 50 - $(window).scrollTop();
			setMenuscroll(sidbar_top);
	}
	else{
		$('.main-sidebar').css('position','absolute');
	}
});
function setMenuscroll(sidbar_top){
	if(sidbar_top>0){
		$('.main-sidebar').css('padding-top',sidbar_top);
        $('.main-sidebar').css('top','0');
        $('.main-sidebar').css('position','fixed');
	}
	else{
        $('.main-sidebar').css('padding-top','0');
        $('.main-sidebar').css('top','0');
        $('.main-sidebar').css('position','fixed');
    }
}
$('.sidebar-toggle').on('click',function(){
  var $window = $(window);
  if($window.width() < 767){
    setMenu();
  }
else{
  if($("body").hasClass("sidebar-collapse") == true){
       $("#sidebar-scroll").slimScroll({destroy: true});
       $("body").removeClass("fixed");
       $("body").addClass("header-fixed");
       $(".sidebar").css('overflow','visible');
       $(".sidebar-menu").css('overflow','visible');
       $(".sidebar-menu").css('height','auto');
  }
  else{
    var a= $(window).height()-70;
    $('#sidebar-scroll').height($(window).height()-70);
    $("#sidebar-scroll").slimScroll({
         height: a,
          allowPageScroll: false,
          wheelStep:5,
          color: '#fff'
    });
    $("body").removeClass("header-fixed");
    $("body").addClass("fixed");
    $("#sidebar-scroll").css('width','100%');
    $(".sidebar").css('overflow','inherit');
    $(".sidebar-menu").css('overflow','inherit');
  }
}
});

window.addEventListener('load', setMenu, false);
window.addEventListener('resize', setMenu, false);
function setMenu(){
	var $window = $(window);
    if ($window.width() < 1024 && $window.width() >= 767) {
     	$("#sidebar-scroll").slimScroll({destroy: true});
        $("body").removeClass("fixed");
        $("body").addClass("sidebar-collapse");
        $(".sidebar").css('overflow','visible');
        $(".sidebar-menu").css('overflow','visible');
        $(".sidebar-menu").css('height','auto');
        var sidbar_top = 50 - $(window).scrollTop();
		setMenuscroll(sidbar_top);
    } 
    else if($window.width() < 767){
      
      $("#sidebar-scroll").slimScroll({destroy: true});
        $("body").removeClass("fixed");
        $("body").addClass("sidebar-collapse");
        $(".sidebar").css('overflow','visible');
        $(".sidebar-menu").css('overflow','visible');
        $(".sidebar-menu").css('height','auto');
       
    }
    else if($window.width() >= 1024){
    	var a= $(window).height()-70;
        $('#sidebar-scroll').height($(window).height()-70);
        $("#sidebar-scroll").slimScroll({
             height: a,
              allowPageScroll: false,
              wheelStep:5,
              color: '#000'
        });
        $("body").addClass("fixed");
        $("body").removeClass("sidebar-collapse");
        $("#sidebar-scroll").css('width','100%');
        $(".sidebar").css('overflow','inherit');
        $(".sidebar-menu").css('overflow','inherit');
        var sidbar_top = 50 - $(window).scrollTop();
		setMenuscroll(sidbar_top);
    }
    else{
    	$("body").removeClass("sidebar-collapse");
    	$("body").addClass("fixed");
    	var sidbar_top = 100 - $(window).scrollTop();
		setMenuscroll(sidbar_top);
    }
}