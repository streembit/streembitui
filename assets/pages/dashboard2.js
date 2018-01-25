  'use strict';
$(document).ready(function() {
/*Counter Js Starts*/
$('.counter').counterUp({
    delay: 10,
    time: 400
});
/*Counter Js Ends*/
          // Area Chart Starts

          $(window).resize(function() {
              $('#areachart').html('');
              var wid = $('#areachart').parent().width();
              rikshaw_chart(wid);
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
            // Custom line chart primary
            $(".customchart-primary").sparkline([2, 5, 3, 7, 4, 5], {
                type: 'line',
                width: '100%',
                height: '75px',
                tooltipClassname: 'abc',
                chartRangeMax: '0',
                lineColor: '#2f80e7',
                spotColor: '#2f80e7',
                highlightLineColor: '#2f80e7',
                highlightSpotColor: '#2f80e7',
                maxSpotColor: '#2f80e7',
                spotColor: '#2f80e7',
                fillColor: '#2f80e7'
            });


            // Custom line chart success
            $(".customchart-success").sparkline([5, 4, 7, 3, 5, 2], {
                type: 'line',
                width: '100%',
                height: '75px',
                tooltipClassname: 'abc',
                chartRangeMax: '0',
                lineColor: '#4ca250',
                spotColor: '#4ca250',
                highlightLineColor: '#4ca250',
                highlightSpotColor: '#4ca250',
                maxSpotColor: '#4ca250',
                spotColor: '#4ca250',
                fillColor: '#4ca250'
            });

            // Custom line chart success
            $(".customchart-warning").sparkline([15, 22, 27, 23, 25, 20], {
                type: 'line',
                width: '100%',
                height: '75px',
                tooltipClassname: 'abc',
                chartRangeMax: '0',
                lineColor: '#de7203',
                spotColor: '#de7203',
                highlightLineColor: '#de7203',
                highlightSpotColor: '#de7203',
                maxSpotColor: '#de7203',
                spotColor: '#de7203',
                fillColor: '#de7203'
            });




            // Live chart js
            function generateNumber(min, max) {
                min = typeof min !== 'undefined' ? min : 1;
                max = typeof max !== 'undefined' ? max : 100;

                return Math.floor((Math.random() * max) + min);
            }

            var chart,
                categories = ['Categorie 1', 'Categorie 2', 'Categorie 3', 'Categorie 4', 'ategorie 5', 'Categorie 6', 'ategorie 7', 'Categorie 8', 'Categorie 9', 'Categorie 10', 'Categorie 11', 'Categorie 12', 'Categorie 13', 'Categorie 14', 'Categorie 15', 'Categorie 16', 'Categorie 17', 'Categorie 18', 'Categorie 19', 'Categorie 20', 'Categorie 21', 'Categorie 22', 'Categorie 23', 'Categorie 24', 'Categorie 25', 'Categorie 26', 'Categorie 27', 'Categorie 28', 'Categorie 29', 'Categorie 30'],
                serie1 = [13, 13, 46, 61, 23, 12, 24, 16, 14, 12, 12, 24, 19, 13, 11, 11, 14, 11, 11, 11, 11, 13, 22, 10, 18, 15, 24, 31, 19, 10],
                serie2 = [52, 41, 58, 63, 55, 46, 45, 41, 38, 54, 50, 39, 48, 70, 63, 60, 58, 63, 83, 89, 83, 79, 83, 100, 104, 108, 52, 46, 83, 89],
                $aapls;



            chart = new Highcharts.Chart({
                chart: {
                    renderTo: 'graph',
                    type: 'column',
                    backgroundColor: 'transparent',
                    height: 151,
                    marginLeft: 3,
                    marginRight: 3,
                    marginBottom: 0,
                    marginTop: 0
                },
                title: {
                    text: ''
                },
                xAxis: {
                    lineWidth: 0,
                    tickWidth: 0,
                    labels: {
                        enabled: false
                    },
                    categories: categories
                },
                yAxis: {
                    labels: {
                        enabled: false
                    },
                    gridLineWidth: 0,
                    title: {
                        text: null,
                    },
                },
                series: [{
                    name: 'Awesomness',
                    data: serie1
                }, {
                    name: 'More Awesomness',
                    color: '#fff',
                    type: 'line',
                    data: serie2
                }],
                credits: {
                    enabled: false
                },
                legend: {
                    enabled: false
                },
                plotOptions: {
                    column: {
                        borderWidth: 0,
                        color: '#3d9e68',
                        shadow: false
                    },
                    line: {
                        marker: {
                            enabled: false
                        },
                        lineWidth: 3
                    }
                },
                tooltip: {
                    enabled: false
                }
            });

            setInterval(function() {
                chart.series[0].addPoint(generateNumber(), true, true);
                chart.series[1].addPoint(generateNumber(50, 150), true, true);
            }, 1000);



            setInterval(function() {
                $('.info-aapl span').each(function(index, elem) {
                    $(elem).animate({
                        height: generateNumber(1, 40)
                    });
                });
            }, 3000);



            // Clock with calender js
            var info = {};
            var cities = [{
                name: 'Athens',
                utc: '+3'
            }, {
                name: 'London',
                utc: '+1'
            }, {
                name: 'Berlin',
                utc: '+2'
            }, {
                name: 'Paris',
                utc: '+2'
            }, {
                name: 'Taipei',
                utc: '+8'
            }, {
                name: 'Bangkok',
                utc: '+7'
            }, {
                name: 'Singapore',
                utc: '+8'
            }, {
                name: 'Prague',
                utc: '+2'
            }, {
                name: 'Toronto',
                utc: '-4'
            }, {
                name: 'Seoul',
                utc: '+9'
            }, {
                name: 'Rome',
                utc: '+2'
            }, {
                name: 'New York',
                utc: '-4'
            }, {
                name: 'Shanghai',
                utc: '+8'
            }, {
                name: 'Barcelona',
                utc: '+2'
            }, {
                name: 'Milan',
                utc: '+2'
            }, {
                name: 'Amsterdam',
                utc: '+2'
            }, {
                name: 'Vienna',
                utc: '+2'
            }, {
                name: 'Beijing',
                utc: '+8'
            }];
            var monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
            var current = 0;




            function init() {
                var date = new Date();
                $('.date').text(monthNames[date.getMonth()] + ' ' + date.getDate());
                $('.year').text(date.getFullYear());

                //fetch weather data
                for (var i = 0; i < cities.length; i++) {
                    var date = new Date();
                    $.getJSON('http://api.openweathermap.org/data/2.5/weather?APPID=c458144dcb333ecebc0dca40460acf7b&q=' + cities[i].name + '&callback=?&units=metric', null,
                        function(data) {
                            if (data.cod == '404') return;
                            info[data.name] = {
                                name: data.name,
                                country: data.sys.country,
                                temp: data.main.temp,
                                weather: data.weather[0].main,
                                des: data.weather[0].description,
                                hum: data.main.humidity,
                                wind: data.wind.speed
                            };
                        }).done(function(data) {
                        if (data.name == 'Beijing')
                            update();

                    });
                }

            }
            setTimes();
            init();


            //set the local times in degrees so it shows in the clock
            function setTimes() {
                var date = new Date();
                for (var j = 0; j < cities.length; j++) {
                    var hours = (date.getUTCHours() > 11) ? date.getUTCHours() - 12 + parseInt(cities[j].utc, 10) : date.getUTCHours() + parseInt(cities[j].utc, 10);
                    cities[j].hours = (hours / 12) * 360;
                    cities[j].minoutes = (date.getUTCMinutes() / 60) * 360;

                }

            }

            //update all information for each place
            function update() {
                $('.update').addClass('anim');
                var city = info[cities[current].name];

                $('.place').text(city.name + ',' + city.country);
                $('.temp span').html(city.temp + '<sup>o</sup>C');
                $('.main').text(city.weather);
                $('.des').text(city.des);
                $('.wind span').html(city.wind + 'm/s');
                $('.humidity span').html(city.hum + '%');
                $('.hour').css('transform', 'rotate(' + cities[current].hours + 'deg)');
                $('.min').css('transform', 'rotate(' + cities[current].minoutes + 'deg)');
                current = (current + 1) % 18;
                setTimeout(update, 6000);
            }

            //after fade animation has finished remove the class that caused it so it can be reused
            $('.update').on('webkitAnimationEnd oAnimationEnd msAnimationEnd animationend', function() {
                $('.anim').removeClass('anim');
            });

            //  Resource bar
            $(".resource-barchart").sparkline([5, 6, 2, 4, 9, 1, 2, 8, 3, 6, 4, 2, 9, 8, 5, 7, 8], {
                type: 'bar',
                barWidth: '15px',
                height: '80px',
                barColor: '#fff',
                tooltipClassname: 'abc'
            });


            function digclock() {
                var d = new Date()
                var t = d.toLocaleTimeString()

               /* document.getElementById("system-clock").innerHTML = t;*/
            }

            setInterval(function() {
                digclock()
            }, 1000);

            /*Pie chart*/
            var pieElem = document.getElementById("pieChart");
            var data4 = {
                labels: [
                    "Red",
                    "Blue",
                    "Yellow"
                ],
                datasets: [{
                    data: [30, 15, 20, 10],
                    backgroundColor: [
                        "#222",
                        "#b8b8b8",
                        "#00dac7",
                        "#5C5C5C"
                    ],
                    hoverBackgroundColor: [
                        "#222",
                        "#b8b8b8",
                        "#00dac7",
                        "#5C5C5C"
                    ]
                }]
            };

            // Click handlers
            $(".sidebar-btn").on("click", function() {
                var $this = $(this);
                var action = $this.attr("data-action");
                var side = $this.attr("data-side");
                $(".sidebar." + side).trigger("sidebar:" + action);
                return false;
            });
            $(".closebtn").on("click", function() {
                $(".sidebar.right").css('right', '-350px');
            });
            $(".right-sidebar-panel").on("click", function() {
                return false;
            });
            /*Side-bar Menu Ends*/

            function setHeight() {
                var $window = $(window);
                var windowHeight = $(window).height();
                if ($window.width() >= 320) {
                    $('.user-list').parent().parent().css('min-height', windowHeight);
                    $('.user-list').parent().parent().css('right', -300);
                }
            };
            setHeight();

            $(window).on('load',function() {
                setHeight();
            });
    
      
});

$('.to-do-list input[type=checkbox]').click(function(){
        if($(this).prop('checked'))
            $(this).parent().addClass('done-task');
        else
            $(this).parent().removeClass('done-task');
    });