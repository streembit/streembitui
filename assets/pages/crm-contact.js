 "use strict";
 $(document).ready(function() {
     $('#date').bootstrapMaterialDatePicker({
         time: false,
         clearButton: true
     });
        $('#crm-contact').DataTable({
            "paging":   true,
            "ordering": false,
            "bLengthChange": true,
            "info":     false

        });
        var simple = $('#crm-contact').DataTable();
     $('#crm-contact tfoot th').each( function () {
         var title = $(this).text();
         $(this).html( '<div class="md-input-wrapper"><input type="text" class="md-form-control" placeholder="Search '+title+'" /></div>' );
     } );
     // Apply the search
     simple.columns().every( function () {
         var that = this;

         $( 'input', this.footer() ).on( 'keyup change', function () {
             if ( that.search() !== this.value ) {
                 that
                     .search( this.value )
                     .draw();
             }
         } );
     } );

    } );