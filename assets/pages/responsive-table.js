  'use strict';
$(function() {
    $('#bs-deps').on('hide.bs.collapse show.bs.collapse', function () {
      $('#bs-deps-toggle').children('span').toggleClass('fa-chevron-down').toggleClass('fa-chevron-up');
    })
  });