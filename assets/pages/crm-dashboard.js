"use strict";
 $(document).ready(function() {
        var progression1 = 0;
        var progression2 = 0;
        var progression3 = 0;
        var progression4 = 0;
        var progression5 = 0;
        var progress = setInterval(function()
        {

            $('.progress .faq-text1').text(progression1 + '%');
            $('.progress .faq-text1').css({'left':progression1+'%'});
            $('.progress .faq-text1').css({'top':'-20px'});
            $('.progress .faq-bar1').css({'width':progression1+'%'});

            if(progression1 == 70) {
                clearInterval(progress);

            } else
                progression1 += 1;

        }, 100);

        var progress1 = setInterval(function()
        {
            $('.progress .faq-text2').text(progression2 + '%');
            $('.progress .faq-text2').css({'left':progression2+'%'});
            $('.progress .faq-text2').css({'top':'-20px'});
            $('.progress .faq-bar2').css({'width':progression2+'%'});
            if(progression2 == 85) {
                clearInterval(progress1);

            } else
                progression2 += 1;

        }, 100);
        var progress2 = setInterval(function()
        {
            $('.progress .faq-text3').text(progression3 + '%');
            $('.progress .faq-text3').css({'left':progression3+'%'});
            $('.progress .faq-text3').css({'top':'-20px'});
            $('.progress .faq-bar3').css({'width':progression3+'%'});
            if(progression3 == 50) {
                clearInterval(progress2);

            } else
                progression3 += 1;

        }, 100);
        var progress3 = setInterval(function()
        {
            $('.progress .faq-text4').text(progression4 + '%');
            $('.progress .faq-text4').css({'left':progression4+'%'});
            $('.progress .faq-text4').css({'top':'-20px'});
            $('.progress .faq-bar4').css({'width':progression4+'%'});
            if(progression4 == 95) {
                clearInterval(progress3);

            } else
                progression4 += 1;

        }, 100);
        var progress4 = setInterval(function()
        {
            $('.progress .faq-text5').text(progression5 + '%');
            $('.progress .faq-text5').css({'left':progression5+'%'});
            $('.progress .faq-text5').css({'top':'-20px'});
            $('.progress .faq-bar5').css({'width':progression5+'%'});
            if(progression5 == 65) {
                clearInterval(progress4);

            } else
                progression5 += 1;

        }, 100);

          areaChart();
  $(window).resize(function() {
    window.areaChart.redraw();
  });

        // Morris js
        function areaChart() {
  window.areaChart = Morris.Area({
            element: 'area-example',
            data: [{
                y: '2006',
                a: 200,
                b: 40
            }, {
                y: '2007',
                a: 75,
                b: 65
            }, {
                y: '2008',
                a: 50,
                b: 40
            }, {
                y: '2009',
                a: 75,
                b: 85
            }, {
                y: '2010',
                a: 70,
                b: 40
            }, {
                y: '2011',
                a: 200,
                b: 65
            }, {
                y: '2012',
                a: 100,
                b: 90
            }],
            xkey: 'y',
            redraw: true,
            ykeys: ['a', 'b'],
            labels: ['<i class="icofont icofont-ui-user-group m-r-5"></i> Statistic #1', '<i class="icofont icofont-ui-user-group m-r-5"></i>Statistic #2']
        });
}
       
         $('#contact-list').DataTable({
        fixedHeader: true,
        "scrollY": 572,
        "paging":  false,
        "ordering": false,
        "bLengthChange": false,
        "searching": false,
        "info":     false

    });

// add scroll to data table
$(".dataTables_scrollBody").slimScroll({
                height: 675,
                 allowPageScroll: false,
                 wheelStep:5,
                 color: '#000'
           });

    });