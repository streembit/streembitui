  'use strict';
$(document).ready(function() {
/*======= Progressbar js starts ======= */
    var progression1 = 0;
    var progression2 = 0;
    var progression3 = 0;
    var progression4 = 0;
   var progress = setInterval(function() {

        $('.progress .progress-text1').text(progression1 + '%');
        $('.progress .progress-text1').css({
            'left': progression1 + '%'
        });
        $('.progress .progress-text1').css({
            'top': '-25px'
        });
        $('.progress .progress-bar1').css({
            'width': progression1 + '%'
        });

        if (progression1 == 45) {
            clearInterval(progress);

        } else
        progression1 += 1;

    }, 50);

    var progress1 = setInterval(function() {
        $('.progress .progress-text2').text(progression2 + '%');
        $('.progress .progress-text2').css({
            'left': progression2 + '%'
        });
        $('.progress .progress-text2').css({
            'top': '-25px'
        });
        $('.progress .progress-bar2').css({
            'width': progression2 + '%'
        });
        if (progression2 == 85) {
            clearInterval(progress1);

        } else
        progression2 += 1;

    }, 50);
    var progress2 = setInterval(function() {
        $('.progress .progress-text3').text(progression3 + '%');
        $('.progress .progress-text3').css({
            'left': progression3 + '%'
        });
        $('.progress .progress-text3').css({
            'top': '-25px'
        });
        $('.progress .progress-bar3').css({
            'width': progression3 + '%'
        });
        if (progression3 == 60) {
            clearInterval(progress2);

        } else
        progression3 += 1;

    }, 50);
    var progress3 = setInterval(function() {
        $('.progress .progress-text4').text(progression4 + '%');
        $('.progress .progress-text4').css({
            'left': progression4 + '%'
        });
        $('.progress .progress-text4').css({
            'top': '-25px'
        });
        $('.progress .progress-bar4').css({
            'width': progression4 + '%'
        });
        if (progression4 == 90) {
            clearInterval(progress3);

        } else
        progression4 += 1;

    }, 100);

    $('#widget-product-list').DataTable({
        "paging": false,
        "ordering": false,
        "bLengthChange": false,
        "info": false,
        "searching": false
    });


    /*Counter Js Starts*/
    $('.counter').counterUp({
        delay: 10,
        time: 400
    });
    /*Counter Js Ends*/

        // Area Chart Starts

        $(window).resize(function() {
           window.morrisChart.redraw();
           $('#areachart').html('');
           var wid = $('#areachart').parent().width();
           rikshaw_chart(wid);
           pietyChart();
       });
        var wid = $('#areachart').parent().width();

        function rikshaw_chart(wid) {
            var graph = new Rickshaw.Graph({
                element: document.querySelector("#areachart"),
                width: wid,
                height: 200,
                series: [{
                    color: '#2196F3',
                    data: [{
                        x: 0,
                        y: 10
                    }, {
                        x: 1,
                        y: 16
                    }, {
                        x: 2,
                        y: 50
                    }, {
                        x: 3,
                        y: 25
                    }, {
                        x: 4,
                        y: 15
                    }, {
                        x: 5,
                        y: 15
                    }, {
                        x: 6,
                        y: 35
                    }, {
                        x: 7,
                        y: 15
                    }]
                }]
            });

            graph.render();
        }
        rikshaw_chart(wid);
        // Area Chart ends

        // Chartlist chart js start
        /*Threshold plugin for Chartist start*/
        new Chartist.Line('.ct-chart11', {
            labels: ['Nov', 'Dec', 'Jan', 'Feb'],
            fillcolor: '#ff3366',
            series: [
            [2, 8, 12, 7, 10, 16]
            ]
        }, {
            showArea: false,
            axisY: {
                onlyInteger: true
            },
            plugins: [
            Chartist.plugins.ctThreshold({
                threshold: 4
            })
            ]
        });
        new Chartist.Line('.ct-chart1', {
            labels: ['Nov', 'Dec', 'Jan', 'Feb'],
            series: [
            [5, -4, 3, 7, 10]
            ]
        }, {
            showArea: false,
            axisY: {
                onlyInteger: true
            },
            plugins: [
            Chartist.plugins.ctThreshold({
                threshold: 4
            })
            ]
        });

        var defaultOptions = {
            threshold: 0,
            classNames: {
                aboveThreshold: 'ct-threshold-above',
                belowThreshold: 'ct-threshold-below'
            },
            maskNames: {
                aboveThreshold: 'ct-threshold-mask-above',
                belowThreshold: 'ct-threshold-mask-below'
            }
        };
        // Chartlist chart js end

        // Pie Chart js start

        pietyChart();
        function pietyChart(){
            $.fn.peity.defaults.pie = {
                delimiter: null,
                fill: ["#2196F3", "#ccc"],
                height: null,
                radius: 15,
                width: null
            }
            $("span.pie").peity("pie");
        };
        // Pie Chart js end

        // Custom-line chart js start
        $(".customchart").sparkline([15, 30, 27, 35], {
            type: 'line',
            width: '600px',
            height: '200px',
            tooltipClassname: 'abc',
            chartRangeMax: '50',
            lineColor: '#fff',
            fillColor: '#2196F3',
        });

        $(".customchart").sparkline([0, 5, 10, 7], {
            type: 'line',
            width: '300px',
            height: '200px',
            composite: '!0',
            tooltipClassname: 'abc',
            chartRangeMax: '40',
            fillColor: '#2196f3',
            lineColor: '#fff'
        });
        // Custom-line chart js end

        /*Bar*/
        $(".barchart").sparkline([5, 6, 2, 4, 9, 1, 2, 8, 3, 6, 4, 2, 9, 6, 4, 8, 6, 4], {
            type: 'bar',
            barWidth: '10px',
            height: '50px',
            barSpacing: '5px',
            tooltipClassname: 'abc'
        });

        //  Resource bar
        $(".resource-barchart").sparkline([5, 6, 2, 4, 9, 1, 2, 8, 3, 6, 4, 2, 9, 8, 5, 7, 8], {
            type: 'bar',
            barWidth: '15px',
            height: '50px',
            barColor: '#fff',
            tooltipClassname: 'abc'
        });


        //  Clock widget js start
        function Clock_dg(prop) {
            var angle = 360 / 60,
            date = new Date();
            var h = date.getHours();
            if (h > 12) {
                h = h - 12;
            }

            var hour = h;
            var minute = date.getMinutes(),
            second = date.getSeconds(),
           hourAngle = (360 / 12) * hour + (360 / (12 * 60)) * minute;

            $('#minute')[0].style[prop] = 'rotate(' + angle * minute + 'deg)';
            $('#second')[0].style[prop] = 'rotate(' + angle * second + 'deg)';
            $('#hour')[0].style[prop] = 'rotate(' + hourAngle + 'deg)';
        }
        $(function() {
            var props = 'transform WebkitTransform MozTransform OTransform msTransform'.split(' '),
            prop,
            el = document.createElement('div');

            for (var i = 0, l = props.length; i < l; i++) {
                if (typeof el.style[props[i]] !== "undefined") {
                    prop = props[i];
                    break;
                }
            }
            setInterval(function() {
                Clock_dg(prop)
            }, 100);
        });
        //  Clock widget js end

        // C3 chart js
        /*Pie Chart*/

    var chart = c3.generate({
        bindto: '#chart3',
        data: {
            // iris data from R
            columns: [
                ['Chrome', 130],
                ['Safari', 30],
                ['Firefox', 200]
            ],
            type: 'pie'
        },
        legend: {
            show: true
        },
        color: {
            pattern: ['#d62728', '#2ca02c', '#9467bd']
        }

    });

        /*Donut Hole*/

    /*placeholder3 js*/

    var $window = $(window);
    var windowHeight = $(window).innerHeight();
    if ($window.width() >= 767) {
        var chart = c3.generate({
            bindto: '#placeholder3',
            size: {
                height: 300
            },
            data: {
                columns: [
                    ['Mans Wear', 12],
                    ['Womans Wear', 58],
                    ['Childrens Wear', 28],
                    ['Electronics', 25],
                    ['Accesories', 25]
                ],
                type: 'donut'

            },
            color: {
                pattern: ['#3f51b5', '#1B8BF9', '#4caf50','#f69026', '#9467bd']
            },
            donut: {
                label: {
                    threshold: 1
                }
            },
            legend: {
                position: "right"
            }
        });
    } else {
        var chart = c3.generate({
            bindto: '#placeholder3',
            size: {
                height: 300
            },
            data: {
                columns: [
                    ['Mans Wear', 12],
                    ['Womans Wear', 58],
                    ['Childrens Wear', 28],
                    ['Electronics', 25],
                    ['Accesories', 25]
                ],
                type: 'donut'

            },
            color: {
                pattern: ['#3f51b5', '#1B8BF9', '#4caf50','#f69026', '#9467bd']
            },
            donut: {
                label: {
                    threshold: 1
                }
            }
        });
    }




        // Owl carousel js
        $(".slider-center").owlCarousel({
            dots: true,
            nav: true,
            autoplay: true,
            autoplayTimeout: 1000,
            margin: 10,
            smartSpeed: 1000,
            loop: true,
            slideSpeed: 300,
            items: 1,
            // rtl: true, this start a image from right side to left
            singleItem: true,
            responsiveClass: true,
            responsive: {
                0: {
                    items: 1,
                    nav: true
                },
                1000: {
                    items: 1,
                    nav: true,
                    loop: true
                }
            }

        });

        // Morris js
        /*Area chart*/
        morrisChart();
        function morrisChart() {
          window.morrisChart = Morris.Area({
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
            ykeys: ['a', 'b'],
            labels: ['<i class="fa fa-user fa fa-circle-thin m-r-5"></i> Statistic #1', '<i class="fa fa-user fa fa-circle-thin m-r-5"></i>Statistic #2']
        });
      }

//add scroll to table

$(".widget-table-scroll").slimScroll({
                height: 273,
                 allowPageScroll: false,
                 wheelStep:5,
                 color: '#000'
           });

});

$('.to-do-list input[type=checkbox]').on('click',function(){
    
        if($(this).prop('checked'))
            $(this).parent().addClass('done-task');
        else
            $(this).parent().removeClass('done-task');
    });
