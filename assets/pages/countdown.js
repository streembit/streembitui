"use strict";
$(document).ready(function(){
    var myDate = new Date();
    myDate.setDate(myDate.getDate() + 3);
    $("#countdown").countdown(myDate, function (event) {
        $(this).html(
            event.strftime(
                '<div class="row"><div class="col-3"><div class="time">%D</div><span class="text">days</span></div><div class="col-3"><div class="time">%H</div><span class="text">hrs</span></div><div class="col-3"><div class="time">%M</div><span class="text">mins</span></div><div class="col-3"><div class="time">%S</div><span class="text">sec</span></div></div>'
            )
        );
    });
});	