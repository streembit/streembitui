  'use strict';
 $(document).ready(function() {  
 // init bootpag
        $('.demo1').bootpag({
            total: 50,
            page: 2,
            maxVisible: 5,
            leaps: true,
            firstLastUse: true,
            first: '←',
            last: '→',
            wrapClass: 'pagination',
            activeClass: 'active',
            disabledClass: 'disabled',
            nextClass: 'next',
            prevClass: 'prev',
            lastClass: 'last',
            firstClass: 'first'
        }).on("page", function(event, num){
            $(".content1").html("Page " + num); // or some ajax content loading...
        }); 

        $('.demo2').bootpag({
           total: 23,
           page: 3,
           maxVisible: 10
        }).on('page', function(event, num){
            $(".content2").html("Page " + num); // or some ajax content loading...
        });

        $('.jqpagination').jqPagination({
    paged: function(page) {
        // do something with the page variable
    }
});
        });