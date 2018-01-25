"use strict";
$(document).ready(function(){
	
var a= $(window).height()-70;
    $(".user-box").slimScroll({
             height: a,
              allowPageScroll: false,
            color :'#1b8bf9'
        });

	// search
	$(".search-text").on("keyup", function() {
		
	    var g = $(this).val().toLowerCase();
	    $(".userlist-box .media-body .chat-header").each(function() {
	    	
	        var s = $(this).text().toLowerCase();
	        $(this).closest('.userlist-box')[ s.indexOf(g) !== -1 ? 'show' : 'hide' ]();
	    });
	});

	
});