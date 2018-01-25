  'use strict';
    $(document).ready(function() {
 dashboard();

 /*Counter Js Starts*/
$('.counter').counterUp({
    delay: 10,
    time: 400
});
/*Counter Js Ends*/

//  Resource bar
    $(".resource-barchart").sparkline([5, 6, 2, 4, 9, 1, 2, 8, 3, 6, 4,2,1,5], {
              type: 'bar',
              barWidth: '15px',
              height: '80px',
              barColor: '#fff',
            tooltipClassname:'abc'
          });


            function digclock() {
                var d = new Date()
                var t = d.toLocaleTimeString()

                document.getElementById("system-clock").innerHTML = t
            }

            setInterval(function() {
                digclock()
            }, 1000)
            
            function setHeight() {
                var $window = $(window);
                var windowHeight = $(window).height();
                if ($window.width() >= 320) {
                    $('.user-list').parent().parent().css('min-height', windowHeight);
                    $('.chat-window-inner-content').css('max-height', windowHeight);
                    $('.user-list').parent().parent().css('right', -300);
                }
            };
            setHeight();

            $(window).on('load',function() {
                setHeight();
            });
        });

 $(window).resize(function() {
        dashboard();
        //  Resource bar
    $(".resource-barchart").sparkline([5, 6, 2, 4, 9, 1, 2, 8, 3, 6, 4,2,1,5], {
              type: 'bar',
              barWidth: '15px',
              height: '80px',
              barColor: '#fff',
            tooltipClassname:'abc'
          });
    });

function dashboard(){


     //website States
            var myChart = echarts.init(document.getElementById('website-stats'));

            var option = {
            tooltip : {
                trigger: 'axis'
            },
            legend: {
                data:['Users','Pages/Visits','Visits']
            },

            toolbox: {
                show : false,
                feature : {
                    mark : {show: true},
                    dataView : {show: true, readOnly: false},
                    magicType : {show: true, type: ['line', 'bar', 'stack', 'tiled']},
                    restore : {show: true},
                    saveAsImage : {show: true}
                }
            },
            color: ["#1B8BF9", "#BBC9EC", "#49C1F7"],
            calculable : true,
            xAxis : [
                {
                    type : 'category',
                    boundaryGap : false,
                    data : ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday']
                }
            ],
            yAxis : [
                {
                    type : 'value'
                }
            ],
            series : [
                {
                    name:'Visits',
                    type:'line',
                    smooth:true,
                    itemStyle: {normal: {areaStyle: {type: 'default'}}},
                    data:[10, 12, 21, 54, 260, 830, 710]
                },
                {
                    name:'Pages/Visits',
                    type:'line',
                    smooth:true,
                    itemStyle: {normal: {areaStyle: {type: 'default'}}},
                    data:[30, 182, 434, 791, 390, 30, 10]
                },
                {
                    name:'Users',
                    type:'line',
                    smooth:true,
                    itemStyle: {normal: {areaStyle: {type: 'default'}}},
                    data:[1320, 1132, 601, 234, 120, 90, 20]
                }
            ],
            grid: {
                zlevel: 0,
                z: 0,
                x: 40,
                y: 40,
                x2: 40,
                y2: 40,
                backgroundColor: 'rgba(0,0,0,0)',
                borderColor: '#fff',
                },
        };

        // Load data into the ECharts instance
        myChart.setOption(option);



};
