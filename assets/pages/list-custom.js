  'use strict';
 $(document).ready(function() {  
 	stroll.bind( '.scroll-list' );
		$("#dynamic-list-four-button, #dynamic-list-four-close").on("click", function() {
		$("#dynamic-list-four-slider-wrap").toggleClass("open");
	});

	$("#dynamic-list-five-button").on("click", function() {
		$(this)
				.toggleClass("open")
				.find(".details")
				.slideToggle();
	});

	$("#dynamic-list-six-button").on("click", function() {

		$("#dynamic-list-six-list").toggleClass("open");

		$(this)
				.toggleClass("open")
				.find(".details")
				.slideToggle();
	});

	var a= $(".cards").height();
    $(".cards").slimScroll({
             height: a,
              allowPageScroll: false,
            color :'#000'
        });

    var a= $(".wave").height();
    $(".wave").slimScroll({
             height: a,
              allowPageScroll: false,
            color :'#000'
        });

     var a= $(".flip").height();
    $(".flip").slimScroll({
             height: a,
              allowPageScroll: false,
            color :'#000'
        });

     var a= $(".helix").height();
    $(".helix").slimScroll({
             height: a,
              allowPageScroll: false,
            color :'#000'
        });

      var a= $(".fan").height();
    $(".fan").slimScroll({
             height: a,
              allowPageScroll: false,
            color :'#000'
        });

     var a= $(".twirl").height();
    $(".twirl").slimScroll({
             height: a,
              allowPageScroll: false,
            color :'#000'
        });
	});