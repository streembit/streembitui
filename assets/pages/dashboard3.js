  'use strict';
$(document).ready(function() {
/*Counter Js Starts*/
$('.counter').counterUp({
    delay: 10,
    time: 400
});
/*Counter Js Ends*/
        // Custom line chart primary
        $(".customchart-primary").sparkline([430,430,333,430,430,545,445,415,356,321,369,437,310,215,226,378,445,252,238,365,526,625], {
            type: 'line',
            width: '718px',
            height: '120px',
            tooltipClassname: 'customTooltipClass',
            tooltipOffsety: '10',
            chartRangeMax: '0',
            lineColor: '#2f80e7',
            spotColor: '#2f80e7',
            highlightLineColor: 'transparent',
            highlightSpotColor: 'transparent',
            maxSpotColor: '#2f80e7',
            spotColor: '#2f80e7',
            fillColor: '#2f80e7'
        });

            // Flow chart js

            var myChart = echarts.init(document.getElementById('newc'));

            var option = {


                grid: {
                    zlevel: 0,
                    x: 20,
                    x2: 20,
                    y: 20,
                    y2: 20,
                    borderWidth: 0,
                    backgroundColor: 'rgba(0,0,0,0)',
                    borderColor: 'rgba(0,0,0,0)',
                },

                // Add tooltip
                tooltip: {
                    trigger: 'axis',
                    axisPointer: {
                        type: 'shadow', // line|shadow
                        lineStyle: {
                            color: 'rgba(0,0,0,.5)',
                            width: 1
                        },
                        shadowStyle: {
                            color: 'rgba(0,0,0,.1)'
                        }
                    }
                },

                // Add legend
                legend: {
                    data: []
                },
                toolbox: {
                    orient: 'vertical',
                    show: true,
                    showTitle: true,
                    color: ['#bdbdbd', '#bdbdbd', '#bdbdbd', '#bdbdbd'],
                    feature: {
                        mark: {
                            show: false
                        },
                        dataZoom: {
                            show: true,
                            title: {
                                dataZoom: 'Data Zoom',
                                dataZoomReset: 'Reset Zoom'
                            }
                        },
                        dataView: {
                            show: false,
                            readOnly: true
                        },
                        magicType: {
                            show: true,
                            itemSize: 12,
                            itemGap: 12,
                            title: {
                                line: 'Area',
                                bar: 'Bar'
                            },
                            type: ['line', 'bar']
                        },
                        restore: {
                            show: false
                        },
                        saveAsImage: {
                            show: true,
                            title: 'Save as Image'
                        }
                    }
                },

                // Enable drag recalculate
                calculable: true,

                // Horizontal axis
                xAxis: [{
                    type: 'category',
                    boundaryGap: false,
                    data: ['Chrome', 'Firefox', 'Safari', 'Opera', 'IE'],
                    axisLine: {
                        show: true,
                        onZero: true,
                        lineStyle: {
                            color: 'rgba(63,81,181,1.0)',
                            type: 'solid',
                            width: '2',
                            shadowColor: 'rgba(0,0,0,0)',
                            shadowBlur: 5,
                            shadowOffsetX: 3,
                            shadowOffsetY: 3,
                        },
                    },
                    axisTick: {
                        show: false,
                    },
                    splitLine: {
                        show: false,
                        lineStyle: {
                            color: '#fff',
                            type: 'solid',
                            width: 0,
                            shadowColor: 'rgba(0,0,0,0)',
                        },
                    },
                }],

                // Vertical axis
                yAxis: [{
                    type: 'value',
                    splitLine: {
                        show: false,
                        lineStyle: {
                            color: 'fff',
                            type: 'solid',
                            width: 0,
                            shadowColor: 'rgba(0,0,0,0)',
                        },
                    },
                    axisLabel: {
                        show: false,
                    },
                    axisTick: {
                        show: false,
                    },
                    axisLine: {
                        show: false,
                        onZero: true,
                        lineStyle: {
                            color: '#1b8bf9',
                            type: 'solid',
                            width: '0',
                            shadowColor: 'rgba(0,0,0,0)',
                            shadowBlur: 5,
                            shadowOffsetX: 3,
                            shadowOffsetY: 3,
                        },
                    },


                }],

                // Add series
                series: [{
                    name: 'Total Visits',
                    type: 'line',
                    smooth: true,
                    symbol: 'none',
                    symbolSize: 2,
                    showAllSymbol: true,
                    itemStyle: {
                        normal: {
                            color: '#1b8bf9',
                            borderWidth: 4,
                            borderColor: '#1b8bf9',
                            areaStyle: {
                                color: '#1b8bf9',
                                type: 'default'
                            }
                        }
                    },

                    data: [500, 200, 322, 212, 99]
                }]
            };

            // Load data into the ECharts instance
            myChart.setOption(option);



            // Speedometer js
            var myChart = echarts.init(document.getElementById('speed-count'));

            var option = {

                tooltip: {
                    formatter: "{b} : {c}%"
                },
                toolbox: {
                    show: false,
                    feature: {
                        mark: {
                            show: false
                        },
                        restore: {
                            show: false
                        },
                        saveAsImage: {
                            show: true
                        }
                    }
                },
                series: [{
                    name: 'Server Load',
                    type: 'gauge',
                    center: ['50%', '50%'],
                    radius: ['0%', '100%'],
                    axisLine: {
                        show: true,
                        lineStyle: {
                            color: [
                            [0.2, '#4CAF50'],
                            [0.8, '#1b8bf9'],
                            [1, '#F44336 ']
                            ],
                            width: 10
                        }
                    },
                    title: {
                        show: false,
                        offsetCenter: [0, '120%'],
                        textStyle: {
                            color: '#333',
                            fontSize: 15
                        }
                    },
                    detail: {
                        show: true,
                        backgroundColor: 'rgba(0,0,0,0)',
                        borderWidth: 0,
                        borderColor: '#ccc',
                        width: 100,
                        height: 40,
                        offsetCenter: [0, '40%'],
                        formatter: '{value}%',
                        textStyle: {
                            color: 'auto',
                            fontSize: 20
                        }
                    },

                    data: [{
                        value: 50,
                        name: 'Server Load (MB)'
                    }]
                }]
            };

            clearInterval(timeTicket);
            var timeTicket = setInterval(function() {
                option.series[0].data[0].value = (Math.random() * 100).toFixed(2) - 0;
                myChart.setOption(option, true);
            }, 2000);



            /*Bar*/
            $(".barchart").sparkline([5, 6, 2, 4, 9, 1, 2, 8, 3, 6, 4, 2, 9, 6, 4, 8, 6, 4], {
                type: 'bar',
                barWidth: '10px',
                height: '50px',
                barSpacing: '5px',
                tooltipClassname: 'abc'
            });

            /*Pie chart*/
            // var pieElem = document.getElementById("pieChart");
            // var data4 = {
            //     labels: [
            //     "Red",
            //     "Blue",
            //     "Yellow"
            //     ],
            //     datasets: [{
            //         data: [30, 15, 20, 10],
            //         backgroundColor: [
            //         "#222",
            //         "#b8b8b8",
            //         "#00dac7",
            //         "#5C5C5C"
            //         ],
            //         hoverBackgroundColor: [
            //         "#222",
            //         "#b8b8b8",
            //         "#00dac7",
            //         "#5C5C5C"
            //         ]
            //     }]
            // };

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



        // toggle full screen
        function toggleFullScreen() {
            if (!document.fullscreenElement && // alternative standard method
                !document.mozFullScreenElement && !document.webkitFullscreenElement) { // current working methods
                if (document.documentElement.requestFullscreen) {
                    document.documentElement.requestFullscreen();
                } else if (document.documentElement.mozRequestFullScreen) {
                    document.documentElement.mozRequestFullScreen();
                } else if (document.documentElement.webkitRequestFullscreen) {
                    document.documentElement.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
                }
            } else {
                if (document.cancelFullScreen) {
                    document.cancelFullScreen();
                } else if (document.mozCancelFullScreen) {
                    document.mozCancelFullScreen();
                } else if (document.webkitCancelFullScreen) {
                    document.webkitCancelFullScreen();
                }
            }
        }

        // keydown event handler
        document.addEventListener('keydown', function(e) {
            if (e.keyCode == 13 || e.keyCode == 70) { // F or Enter key
                toggleFullScreen();
            }
        }, false);
        
$('#world-map-markers').vectorMap({
    map: "world_mill_en",
            scaleColors: ["#2196F3", "#1B8BF9"],
            normalizeFunction: "polynomial",
            hoverOpacity: .7,
            hoverColor: !1,
            regionStyle: {
                initial: {
                    fill: "#EC407A"
                }
            },
            markerStyle: {
                initial: {
                    r: 9,
                    fill: "#2196F3",
                    "fill-opacity": .9,
                    stroke: "#fff",
                    "stroke-width": 7,
                    "stroke-opacity": .4
                },
                hover: {
                    stroke: "#fff",
                    "fill-opacity": 1,
                    "stroke-width": 1.5
                }
            },
            backgroundColor: "transparent",
            markers: [{
                latLng: [41.9, 12.45],
                name: "Vatican City"
            }, {
                latLng: [43.73, 7.41],
                name: "Monaco"
            }, {
                latLng: [-.52, 166.93],
                name: "Nauru"
            }, {
                latLng: [-8.51, 179.21],
                name: "Tuvalu"
            }, {
                latLng: [43.93, 12.46],
                name: "San Marino"
            }, {
                latLng: [47.14, 9.52],
                name: "Liechtenstein"
            }, {
                latLng: [7.11, 171.06],
                name: "Marshall Islands"
            }, {
                latLng: [17.3, -62.73],
                name: "Saint Kitts and Nevis"
            }, {
                latLng: [3.2, 73.22],
                name: "Maldives"
            }, {
                latLng: [35.88, 14.5],
                name: "Malta"
            }, {
                latLng: [12.05, -61.75],
                name: "Grenada"
            }, {
                latLng: [13.16, -61.23],
                name: "Saint Vincent and the Grenadines"
            }, {
                latLng: [13.16, -59.55],
                name: "Barbados"
            }, {
                latLng: [17.11, -61.85],
                name: "Antigua and Barbuda"
            }, {
                latLng: [-4.61, 55.45],
                name: "Seychelles"
            }, {
                latLng: [7.35, 134.46],
                name: "Palau"
            }, {
                latLng: [42.5, 1.51],
                name: "Andorra"
            }, {
                latLng: [14.01, -60.98],
                name: "Saint Lucia"
            }, {
                latLng: [6.91, 158.18],
                name: "Federated States of Micronesia"
            }, {
                latLng: [1.3, 103.8],
                name: "Singapore"
            }, {
                latLng: [1.46, 173.03],
                name: "Kiribati"
            }, {
                latLng: [-21.13, -175.2],
                name: "Tonga"
            }, {
                latLng: [15.3, -61.38],
                name: "Dominica"
            }, {
                latLng: [-20.2, 57.5],
                name: "Mauritius"
            }, {
                latLng: [26.02, 50.55],
                name: "Bahrain"
            }, {
                latLng: [.33, 6.73],
                name: "São Tomé and Príncipe"
            }]
});
       