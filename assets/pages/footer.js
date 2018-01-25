 $(document).ready(function() {
  window.addEventListener('load', setSize, false);
window.addEventListener('resize', setSize, false);
function setSize(){
    if($(window).height()>$('body').height() )
      $('.footer-bg').css('position','fixed');
    else
      $('.footer-bg').css('position','absolute');
}
});