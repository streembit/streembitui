  'use strict';
  $(document).ready(function() { 
  Sortable.create(draggablePanelList, {
        group: 'draggablePanelList',
        animation: 100
      });
       
         Sortable.create(draggableMultiple, {
        group: 'draggableMultiple',
        animation: 100
      });
         Sortable.create(draggableWithoutImg, {
        group: 'draggableWithoutImg',
        animation: 100
      });
       });