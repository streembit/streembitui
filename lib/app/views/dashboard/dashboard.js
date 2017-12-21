/*

This file is part of STREEMBIT application. 
STREEMBIT is an open source project to manage reliable identities. 

STREEMBIT is a free software: you can redistribute it and/or modify it under the terms of the GNU General Public License 
as published by the Free Software Foundation, either version 3.0 of the License, or (at your option) any later version.

STREEMBIT is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty 
of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU General Public License for more details.

You should have received a copy of the GNU General Public License along with STREEMBIT software.  
If not, see http://www.gnu.org/licenses/.
 
-------------------------------------------------------------------------------------------------------------------------
Author: Tibor Zsolt Pardi 
Copyright (C) Authenticity Institute 2017
-------------------------------------------------------------------------------------------------------------------------

*/


(function () {
    define([ 'appevents', 'uihandler', './dashboard.html!text'],
        function (appevents, uihandler, template) {
        function DashboardViewModel(params) {
            var viewModel = {
                device_count: ko.observable(0),

                init: function () {
                    console.log("dashboard init");
                    uihandler.on_account_load_complete();

                    /*
				 * VECTOR MAP
				 */

                    data_array = {
                        "US": 4977,
                        "AU": 4873,
                        "IN": 3671,
                        "BR": 2476,
                        "TR": 1476,
                        "CN": 146,
                        "CA": 134,
                        "BD": 100
                    };

                    $('#vector-map').vectorMap({
                        map: 'world_mill_en',
                        backgroundColor: '#fff',
                        regionStyle: {
                            initial: {
                                fill: '#c4c4c4'
                            },
                            hover: {
                                "fill-opacity": 1
                            }
                        },
                        series: {
                            regions: [{
                                values: data_array,
                                scale: ['#85a8b6', '#4d7686'],
                                normalizeFunction: 'polynomial'
                            }]
                        },
                        onRegionLabelShow: function (e, el, code) {
                            if (typeof data_array[code] == 'undefined') {
                                e.preventDefault();
                            } else {
                                var countrylbl = data_array[code];
                                el.html(el.html() + ': ' + countrylbl + ' visits');
                            }
                        }
                    });

                    if ($.fn.sparkline) {
                        var barColor,
                            sparklineHeight,
                            sparklineBarWidth,
                            sparklineBarSpacing,
                            sparklineNegBarColor,
                            sparklineStackedColor,
                            thisLineColor,
                            thisLineWidth,
                            thisFill,
                            thisSpotColor,
                            thisMinSpotColor,
                            thisMaxSpotColor,
                            thishighlightSpotColor,
                            thisHighlightLineColor,
                            thisSpotRadius,
                            pieColors,
                            pieWidthHeight,
                            pieBorderColor,
                            pieOffset,
                            thisBoxWidth,
                            thisBoxHeight,
                            thisBoxRaw,
                            thisBoxTarget,
                            thisBoxMin,
                            thisBoxMax,
                            thisShowOutlier,
                            thisIQR,
                            thisBoxSpotRadius,
                            thisBoxLineColor,
                            thisBoxFillColor,
                            thisBoxWhisColor,
                            thisBoxOutlineColor,
                            thisBoxOutlineFill,
                            thisBoxMedianColor,
                            thisBoxTargetColor,
                            thisBulletHeight,
                            thisBulletWidth,
                            thisBulletColor,
                            thisBulletPerformanceColor,
                            thisBulletRangeColors,
                            thisDiscreteHeight,
                            thisDiscreteWidth,
                            thisDiscreteLineColor,
                            thisDiscreteLineHeight,
                            thisDiscreteThrushold,
                            thisDiscreteThrusholdColor,
                            thisTristateHeight,
                            thisTristatePosBarColor,
                            thisTristateNegBarColor,
                            thisTristateZeroBarColor,
                            thisTristateBarWidth,
                            thisTristateBarSpacing,
                            thisZeroAxis,
                            thisBarColor,
                            sparklineWidth,
                            sparklineValue,
                            sparklineValueSpots1,
                            sparklineValueSpots2,
                            thisLineWidth1,
                            thisLineWidth2,
                            thisLineColor1,
                            thisLineColor2,
                            thisSpotRadius1,
                            thisSpotRadius2,
                            thisMinSpotColor1,
                            thisMaxSpotColor1,
                            thisMinSpotColor2,
                            thisMaxSpotColor2,
                            thishighlightSpotColor1,
                            thisHighlightLineColor1,
                            thishighlightSpotColor2,
                            thisFillColor1,
                            thisFillColor2;

                        $('.sparkline:not(:has(>canvas))').each(function () {
                            var $this = $(this),
                                sparklineType = $this.data('sparkline-type') || 'bar';

                            // PIE CHART
                            if (sparklineType == 'pie') {

                                pieColors = $this.data('sparkline-piecolor') || ["#B4CAD3", "#4490B1", "#98AA56", "#da532c", "#6E9461", "#0099c6", "#990099", "#717D8A"];
                                pieWidthHeight = $this.data('sparkline-piesize') || 90;
                                pieBorderColor = $this.data('border-color') || '#45494C';
                                pieOffset = $this.data('sparkline-offset') || 0;

                                $this.sparkline('html', {
                                    type: 'pie',
                                    width: pieWidthHeight,
                                    height: pieWidthHeight,
                                    tooltipFormat: '<span style="color: {{color}}">&#9679;</span> ({{percent.1}}%)',
                                    sliceColors: pieColors,
                                    borderWidth: 1,
                                    offset: pieOffset,
                                    borderColor: pieBorderColor
                                });

                                $this = null;

                            }
                        });

                    }

                    if ($.fn.easyPieChart) {

                        $('.easy-pie-chart').each(function () {
                            var $this = $(this),
                                barColor = $this.css('color') || $this.data('pie-color'),
                                trackColor = $this.data('pie-track-color') || 'rgba(0,0,0,0.04)',
                                size = parseInt($this.data('pie-size')) || 25;

                            $this.easyPieChart({

                                barColor: barColor,
                                trackColor: trackColor,
                                scaleColor: false,
                                lineCap: 'butt',
                                lineWidth: parseInt(size / 8.5),
                                animate: 1500,
                                rotate: -90,
                                size: size,
                                onStep: function (from, to, percent) {
                                    $(this.el).find('.percent').text(Math.round(percent));
                                }

                            });

                            $this.show();

                            $this = null;
                        });

                    } // end if
                }
            };

            setTimeout(function () {
                viewModel.init();
            },
            100);          

            return viewModel;
        }  

        return {
            viewModel: DashboardViewModel,
            template: template
        };
    });
}());
