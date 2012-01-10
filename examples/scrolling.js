<!-- A little JS to do sticky headers -->
<script src="../js/waypoints.min.js"></script>
<script type="text/javascript">
  // track headers as they scroll in and out of view
  var headerStack = [];
  
  $(document).ready(function() {
    $.waypoints.settings.scrollThrottle = 30;
    
    // TODO: dynamically instantiate the header holder here
    $('.dialog-header').first().clone().appendTo('.header-holder');
    
    $('.dialog-header').waypoint(function(event, direction) {
      if ( direction === "down" ) {
        headerStack.push( $('.header-holder > .dialog-header').detach() );
        $(this).clone().appendTo('.header-holder');
      } else {
        if ( headerStack.length > 0 ) {
          $('.header-holder > .dialog-header').detach();
          headerStack.pop().appendTo('.header-holder');
        }
      }
    }, {
      offset: 127
    });
  });
</script>