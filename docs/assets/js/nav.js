/**
 * Standard JS for ReFLEX topnav
 */
 
// tiny pop-overs
$(function () {
  $("#profile_nav_li").tooltip({
    selector: "a[rel=tooltip]",
    placement: "bottom"
  });
})
 
// report abuse form
$(function() {      
  // reset visual state after closing
  var closeReportAbuseDialog = function () {   
    $('#report_abuse_modal').modal('hide');
    $('#report_abuse_success').hide();
    $('#submission_failure_add_details').hide();
    $('#submission_failure_reporting_error').hide();
    $('#report_abuse_success').hide();
    $('#main_report_abuse_dialog').show();
    $('#report_abuse_form #report_text').val('');
  }

  // close buttons
  $('#cancel_abuse_report').click(closeReportAbuseDialog);
  $('#close_abuse_report').click(closeReportAbuseDialog);
  $('#report_abuse_x').click(closeReportAbuseDialog);

  // submit button
  $('#report_abuse_form').submit(function(ev){
    // stop form from submitting normally
    ev.preventDefault();
  
    // get form values
    var $form = $( this ),
      report_text = $form.find( '#report_text' ).val(),
      url = 'http://localhost:5555/report_abuse';
    
    // check that the user entered something
    if ( report_text.length > 0 ) {
      // clean up any previous error messages
      $('#submission_failure_add_details').hide();
      $('#submission_failure_reporting_error').hide();
    
      // Mirror the synchronous behavior of the old form
      $.ajaxSetup({async:false});
      
      // send the data using post and put the results in a div
      $.post( url, { 'report_text': report_text }, function( data ) {
        $('#main_report_abuse_dialog').hide();
        $('#report_abuse_success').show();
        $.ajaxSetup({async:true});
      })
      .error(function(){
        $('#submission_failure_reporting_error').show();
        $.ajaxSetup({async:true});
      });  
    } else {
      $('#submission_failure_add_details').show();
    }
  });
});