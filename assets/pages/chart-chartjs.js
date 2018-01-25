 "use strict";
$(document).ready(function(){
 /*Doughnut chart*/
  var ctx = document.getElementById("myChart");
  var data = {
    labels: [
      "A","B","C","D "     ],
    datasets: [
      {
        data: [40,10,40,10],
        backgroundColor: [
          "#2196F3",
          "#ff5252",
          "#4CAF50",
          "#f57c00"
        ],
        borderWidth:[
          "0px",
          "0px",
          "0px",
          "0px"
        ] ,
        borderColor:[
          "#2196F3",
          "#ff5252",
          "#4CAF50",
          "#f57c00"

        ]
      }]
  };

  var myDoughnutChart = new Chart(ctx, {
    type: 'doughnut',
    data: data
  });


  /*Bar chart*/
  var data1 = {
    labels: [0,1,2,3,4,5,6,7],
    datasets: [
      {
        label: "My First dataset",
        backgroundColor: [
          'rgba(64, 196, 255, 1)',
          'rgba(64, 196, 255, 1)',
          'rgba(64, 196, 255, 1)',
          'rgba(64, 196, 255, 1)',
          'rgba(64, 196, 255, 1)',
          'rgba(64, 196, 255, 1)',
          'rgba(64, 196, 255, 1)'
        ],
        hoverBackgroundColor:[
          'rgba(64, 196, 255, 0.4)',
          'rgba(64, 196, 255, 0.4)',
          'rgba(64, 196, 255, 0.4)',
          'rgba(64, 196, 255, 0.4)',
          'rgba(64, 196, 255, 0.4)',
          'rgba(64, 196, 255, 0.4)',
          'rgba(64, 196, 255, 0.4)'
        ],
        data: [65, 59, 80, 81, 56, 55, 50],
      },
      {
        label: "My second dataset",
        backgroundColor: [
          'rgba(245, 124, 0, 1)',
          'rgba(245, 124, 0, 1)',
          'rgba(245, 124, 0, 1)',
          'rgba(245, 124, 0, 1)',
          'rgba(245, 124, 0, 1)',
          'rgba(245, 124, 0, 1)',
          'rgba(245, 124, 0, 1)'
        ],
        hoverBackgroundColor:[
          'rgba(245, 124, 0, 0.4)',
          'rgba(245, 124, 0, 0.4)',
          'rgba(245, 124, 0, 0.4)',
          'rgba(245, 124, 0, 0.4)',
          'rgba(245, 124, 0, 0.4)',
          'rgba(245, 124, 0, 0.4)',
          'rgba(245, 124, 0, 0.4)'
        ],
        data: [60, 69, 85, 91, 58, 50, 45],
      }
    ]
  };

  var bar=document.getElementById("barChart").getContext('2d');
  var myBarChart = new Chart(bar, {
    type: 'bar',
    data: data1,
    options: {
      barValueSpacing:20
    }
  });


  /*Radar chart*/
  var radarElem=document.getElementById("radarChart");

  var data2 = {
    labels: ["Eating", "Drinking", "Sleeping", "Designing", "Coding", "Cycling", "Running"],
    datasets: [
      {
        label: "My First dataset",
        backgroundColor: "rgba(33, 150, 243, 0.2)",
        borderColor: "rgba(33, 150, 243, 1)",
        pointBackgroundColor: "rgba(33, 150, 243, 1)",
        pointBorderColor: "#fff",
        pointHoverBackgroundColor: "#fff",
        pointHoverBorderColor: "rgba(33, 150, 243, 1)",
        data: [65, 59, 90, 81, 56, 55, 40]
      },
      {
        label: "My Second dataset",
        backgroundColor: "rgba(255, 82, 82, 0.2)",
        borderColor: "rgba(255, 82, 82, 1)",
        pointBackgroundColor: "rgba(255, 82, 82, 1)",
        pointBorderColor: "#fff",
        pointHoverBackgroundColor: "#fff",
        pointHoverBorderColor: "rgba(255, 82, 82, 1)",
        data: [28, 48, 40, 19, 96, 27, 100]
      }
    ]
  };
  var myRadarChart = new Chart(radarElem, {
    type: 'radar',
    data: data2,
    options: {
      scale: {
        reverse: true,
        ticks: {
          beginAtZero: true
        }
      }
    }
  });

  /*Polar chart*/
  var polarElem=document.getElementById("polarChart");

  var data3 = {
    datasets: [{
      data: [
        11,
        16,
        7,
        3,
        14
      ],
      backgroundColor: [
        "#2196F3",
        "#ff5252",
        "#4CAF50",
        "#FF0084",
        "#f57c00"
      ],
      label: 'My dataset' // for legend
    }],
    labels: [
      "Blue",
      "Red",
      "Green",
      "Pink",
      "Orange"
    ]
  };

  new Chart(polarElem, {
    data: data3,
    type: 'polarArea',
    options: {
      elements: {
        arc: {
          borderColor: "#000000"
        }
      }
    }
  });

  /*Pie chart*/
  var pieElem=document.getElementById("pieChart");
  var data4 = {
    labels: [
      "Red",
      "Blue"
    ],
    datasets: [
      {
        data: [30, 50],
        backgroundColor: [
          "#ff5252",
          "#2196F3"
        ],
        hoverBackgroundColor: [
          "#ff5252",
          "#2196F3"
        ]
      }]
  };

  var myPieChart = new Chart(pieElem,{
    type: 'pie',
    data: data4
  });
});