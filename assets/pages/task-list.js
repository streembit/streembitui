  'use strict';
$(document).ready(function() {

    var task = $('#task-table').DataTable();
$(".icofont-ui-delete").on('click',function() {

                $(this).parent().parent().parent().fadeOut();
            });
            var i=6;
            $("#add-btn").on("click", function() {  
            $(".md-form-control").removeClass("md-valid");
                var task = $('.add_task_todo').val();
                if(task == "" || task == undefined){                 
                    alert("please enter task");
                }
                else{          
                    var add_todo = $('<div class="to-do-list" id="'+i+'"><div class="rkmd-checkbox checkbox-rotate"><label class="input-checkbox checkbox-primary "><input type="checkbox" onclick="check_task('+i+')" id="checkbox'+i+'"><span class="checkbox"></span></label><label >'+ task +'</label></div><div class="f-right"><a onclick="delete_todo('+i+');" href="#"><i class="icofont icofont-ui-delete"></i></a></div></div>');
                 i++;
                $(add_todo).appendTo(".new-task").hide().fadeIn(300);
                $('.add_task_todo').val('');
                }
                
            });



     $('#task-table').DataTable();

        $('.min-date').bootstrapMaterialDatePicker({
            time: false,
            format: 'DD/MM/YYYY',
            clearButton: true
        });
        $('.min-date').bootstrapMaterialDatePicker({
            minDate: new Date()
        });
        var d = new Date();
        var strDate = d.getDate() + "/" + (d.getMonth() + 1) + "/" + d.getFullYear();
        $('.min-date').val(strDate);
        
 /*Sweetalert */
       
    });
$('.to-do-list input[type=checkbox]').on('click',function(){
    if($(this).prop('checked'))
        $(this).parent().addClass('done-task');
    else
        $(this).parent().removeClass('done-task');
});

function delete_todo(e){
    $('#'+e).fadeOut();
}

function check_task(elem){
    if($('#checkbox'+elem).prop('checked'))
        $('#checkbox'+elem).parent().addClass('done-task');
    else
        $('#checkbox'+elem).parent().removeClass('done-task');
}


