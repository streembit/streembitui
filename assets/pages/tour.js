  'use strict';
$(document).ready(function() {

var enjoyhint_instance = new EnjoyHint({});

//simple config.
//Only one step - highlighting(with description) "New" button
//hide EnjoyHint after a click on the button.
var enjoyhint_script_steps = [
  
  {
    'click .drop-image' : 'Show your profile settings'
  },
  {
    'click .displayChatbox' : 'Chatting with your friends'
  },
];

//set script config
enjoyhint_instance.set(enjoyhint_script_steps);

//run Enjoyhint script
enjoyhint_instance.run();


           });