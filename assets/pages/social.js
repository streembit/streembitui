  'use strict';
 $(document).ready(function(){
   $('#date').bootstrapMaterialDatePicker({
     time: false,
     clearButton: true
   });

   $('#profile-lightgallery').lightGallery();

//    Edit information
  $('#edit-info').hide();

  $('#edit-cancel').on('click',function(){ 
 var c=$('#edit-btn').find( "i" );
   c.removeClass('icofont-close');
      c.addClass('icofont-edit');
    $('#view-info').show();
    $('#edit-info').hide();
  });

$('#edit-save').on('click',function(){ 
 var c=$('#edit-btn').find( "i" );
   c.removeClass('icofont-close');
      c.addClass('icofont-edit');
    $('#view-info').show();
    $('#edit-info').hide();
  });


$('#edit-btn').on('click',function(){
  var b=$(this).find( "i" );
    var edit_class=b.attr('class');
    if(edit_class=='icofont icofont-edit'){
      b.removeClass('icofont-edit');
      b.addClass('icofont-close');
      $('#view-info').hide();
      $('#edit-info').show();
    }
    else{
     b.removeClass('icofont-close');
      b.addClass('icofont-edit');
      $('#view-info').show();
      $('#edit-info').hide();
    }
  });


//    Edit contact
  $('#edit-contact-info').hide();

 $('#contact-save').on('click',function(){   
 var c=$('#edit-Contact').find( "i" );
   c.removeClass('icofont-close');
      c.addClass('icofont-edit');
    $('#contact-info').show();
    $('#edit-contact-info').hide();
  });

  $('#contact-cancel').on('click',function(){   
 var c=$('#edit-Contact').find( "i" );
   c.removeClass('icofont-close');
      c.addClass('icofont-edit');
    $('#contact-info').show();
    $('#edit-contact-info').hide();
  });

$('#edit-Contact').on('click',function(){
  var b=$(this).find( "i" );
    var edit_class=b.attr('class');
    if(edit_class=='icofont icofont-edit'){
      b.removeClass('icofont-edit');
      b.addClass('icofont-close');
      $('#contact-info').hide();
      $('#edit-contact-info').show();
    }
    else{
     b.removeClass('icofont-close');
      b.addClass('icofont-edit');
      $('#contact-info').show();
      $('#edit-contact-info').hide();
    }
  });
  
//    Edit work
  $('#edit-contact-work').hide();

 $('#work-save').on('click',function(){
 var c=$('#edit-work').find( "i" );
   c.removeClass('icofont-close');
      c.addClass('icofont-edit');
    $('#work-info').show();
    $('#edit-contact-work').hide();
  });
  
  $('#work-cancel').on('click',function(){
 var c=$('#edit-work').find( "i" );
   c.removeClass('icofont-close');
      c.addClass('icofont-edit');
    $('#work-info').show();
    $('#edit-contact-work').hide();
  });

$('#edit-work').on('click',function(){
  var b=$(this).find( "i" );
    var edit_class=b.attr('class');
    if(edit_class=='icofont icofont-edit'){
      b.removeClass('icofont-edit');
      b.addClass('icofont-close');
      $('#work-info').hide();
      $('#edit-contact-work').show();
    }
    else{
     b.removeClass('icofont-close');
      b.addClass('icofont-edit');
      $('#work-info').show();
      $('#edit-contact-work').hide();
    }
  });
  

 $('#post-new').hide();

  $('#post-message').keyup(function(){
   if(($(this).val()!="")){
     $('#post-new').show();
   }
   else
     $('#post-new').hide();
});
          });