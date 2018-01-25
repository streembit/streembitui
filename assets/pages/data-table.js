  'use strict';
$(document).ready(function() {
      var simple = $('#simpletable').DataTable();

      var advance = $('#advanced-table').DataTable( {
      dom: 'Bfrtip',
      buttons: [
        'copy', 'csv', 'excel', 'pdf', 'print'
      ]
    } );

 // Setup - add a text input to each footer cell
    $('#simpletable tfoot th').each( function () {
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

// Setup - add a text input to each footer cell
    $('#advanced-table tfoot th').each( function () {
        var title = $(this).text();
        $(this).html( '<div class="md-input-wrapper"><input type="text" class="md-form-control" placeholder="Search '+title+'" /></div>' );
    } );
      // Apply the search
    advance.columns().every( function () {
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