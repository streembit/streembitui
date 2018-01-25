"use strict";
$(document).ready(function(){
$(window).resize(function() {
     barChart();
updatingChart();
dataChart();
        });

barChart();
updatingChart();
dataChart();

          /* bar chart */
          function barChart() {
                $(".bar-colours-1").peity("bar", {
        fill:  ["#ff5252", "#f57c00"]
    });

    $(".bar-colours-2").peity("bar", {
        fill:  ["#2196F3", "#4CAF50"]
    });     
        }
   
   function updatingChart(){
         /*updating chart*/
    var updatingChart = $(".updating-chart").peity("line", { width: 200 ,fill: "#2196F3" ,stroke : "#2196F3"});
    var updatingChart1 = $(".updating-chart1").peity("line", { width: 200 ,fill: "#ff5252",stroke : "#ff5252"});
    var updatingChart2 = $(".updating-chart2").peity("line", { width: 200 ,fill: "#4CAF50",stroke : "#4CAF50"});
    var updatingChart3 = $(".updating-chart3").peity("line", { width: 200 ,fill: "#f57c00",stroke : "#f57c00"});

    setInterval(function() {
        var random = Math.round(Math.random() * 10)
        var values = updatingChart.text().split(",")
        values.shift()
        values.push(random)

        updatingChart
                .text(values.join(","))
                .change()
    }, 1000);

   }

   function dataChart(){
        /*DATA-ATTRIBUTES CHARTS */
    $(".data-attributes span").peity("donut");
    /*Pie Charts*/
    $("span.pie_1").peity("pie",{
        fill : ["#2196F3","#ff5252"]
    });
     $("span.pie_2").peity("pie",{
        fill : ["#4CAF50","#f57c00"]
    });
      $("span.pie_3").peity("pie",{
        fill : ["#f57c00","#2196F3"]
    });
       $("span.pie_4").peity("pie",{
        fill : ["#CB2027","#2196F3"]
    });
        $("span.pie_5").peity("pie",{
        fill : ["#40c4ff","#ff5252"]
    });
         $("span.pie_6").peity("pie",{
        fill : ["#2196F3","#4CAF50"]
    });
          $("span.pie_7").peity("pie",{
        fill : ["#ff5252","#517FA4"]
    });
   }
 });
