$(document).ready(function() {
//waves effect js start
 Waves.init();
    Waves.attach('.flat-buttons', ['waves-button']);
    Waves.attach('.float-buttons', ['waves-button', 'waves-float']);
    Waves.attach('.float-button-light', ['waves-button', 'waves-float', 'waves-light']);
    Waves.attach('.flat-buttons',['waves-button', 'waves-float', 'waves-light','flat-buttons']);
//waves effect js end



	/* --------------------------------------------------------
       Color picker - demo only
       --------------------------------------------------------   */
    $('<div class="color-picker"><a href="#" class="handle"><i class="icofont icofont-color-bucket"></i></a><div class="settings-header"><h3>Setting panel</h3></div><div class="section"><h3 class="color">Normal color schemes:</h3><div class="colors"><a href="#" class="color-1" ></a><a href="#" class="color-2" ></a><a href="#" class="color-3" ></a><a href="#" class="color-4" ></a><a href="#" class="color-5"></a></div></div><div class="section"><h3 class="color">Inverse color:</h3><div><a href="#" class="color-inverse"><img class="img img-fluid img-thumbnail" src="assets/images/inverse-layout.jpg" /></a></div></div></div>').appendTo($('body'));

      /*Gradient Color*/
      /*Normal Color */
      $(".color-1").on('click',function() {
          $("#color").attr("href", "assets/css/color/color-1.min.css");
          return false;
      });
      $(".color-2").on('click',function() {
          $("#color").attr("href", "assets/css/color/color-2.min.css");
          return false;
      });
      $(".color-3").on('click',function() {
          $("#color").attr("href", "assets/css/color/color-3.min.css");
          return false;
      });
      $(".color-4").on('click',function() {
          $("#color").attr("href", "assets/css/color/color-4.min.css");
          return false;
      });
      $(".color-5").on('click',function() {
          $("#color").attr("href", "assets/css/color/color-5.min.css");
          return false;
      });
        $(".color-inverse").on('click',function() {
            $("#color").attr("href", "assets/css/color/inverse.min.css");
            return false;
        });


      $('.color-picker').animate({
          right: '-239px'
      });

      $('.color-picker a.handle').click(function(e) {
          e.preventDefault();
          var div = $('.color-picker');
          if (div.css('right') === '-239px') {
              $('.color-picker').animate({
                  right: '0px'
              });
          } else {
              $('.color-picker').animate({
                  right: '-239px'
              });
          }
      });
});
