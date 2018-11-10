(function () {
  define(
    [
      'appevents', 'contactlist', 'peercomm', 'groupcall', 'webrtccall', 'filesender', 'errhandler', 'errcodes', './videopanel.html!text'
    ]
    , function (appevents, contactlist, peercomm, groupcall, webrtccall, filesender, errhandler, errcodes, template) {

      function VideoPanelVM(params) {

        postbox.subscribe(function(newValue) {
             viewModel.videoPanelVisibility(newValue.page, newValue.params);
        }, this, "navigateInof");

        var viewModel = {
          videoPanelShow: ko.observable(false)
          , isMuted: ko.observable(false)
          , contacts: ko.observableArray([])
          , showInvite: ko.observable(false)
          , page: ko.observable('')

          //called on each view navigation
          , videoPanelVisibility: function(page, params) {
            viewModel.page(page)
            // if there is video call and you are not in the video call view
            if (page != "video-call" && window.callData && window.callData.calltype == "videocall") {
              //if the small panel is hidden => set up and show the small panel
              if (viewModel.videoPanelShow() == false) {
                viewModel.videoPanelShow(true);
              }
            } else { // there is no video call or you are in the call view => hide the small panel
              viewModel.videoPanelShow(false);
            }
          }

          , hangup: function () {
            webrtccall.hangup();
            peercomm.hangup_call(window.callData.contact);
            // navigate to empty screen
            appevents.dispatch("on-contact-selected", window.callData.contact);
            window.callData = null;

            viewModel.videoPanelShow(false);
            appevents.removeSignal("on-remotestream-connect", viewModel.onRemoteStreamConnect);
            appevents.removeSignal("on-cmd-hangup-call", viewModel.onPeerHangup);
            appevents.removeSignal("oncontactevent", viewModel.onTextMessage);
          }

          , remove_audio: function () {
            webrtccall.toggle_audio(false, function () {
              //toggle microphone mute
              viewModel.isMuted(!viewModel.isMuted());
            });
          },

          sendfile: function () {
            try {
              var recipients = [];
              var smallDivName = document.querySelectorAll('#smallScreenAudioCall1 .smallSpeakerWind .user-name');
              for(var index in smallDivName) {
                  var name = smallDivName[index].innerHTML;
                  for(var i in contactlist.contacts) {
                      if(name == contactlist.contacts[i].name) {
                          recipients.push(contactlist.contacts[i]);
                      }
                  }
              }

              var filetask = new filesender();
              filetask.run(recipients);
            } catch (err) {
              streembit.notify.error(errhandler.getmsg(errcodes.UI_SEND_FILE_ERROR, err));
            }
          }

          , showchat: function () {
            var contName = document.querySelectorAll('.all-contacts-field > div .text-main')
            for (var i = 0; i < contName.length; i++) {
              if (contName[i].innerText === window.callData.contact.name) {
                contName[i].click();
              }
            }
          },

          Contact: function () {
            this.isonline = ko.observable();
            this.isoffline = ko.observable();
            this.lastping = ko.observable(0);
            this.error = ko.observable("");
            this.warnicon = ko.observable("");
            this.warning = ko.observable("");
          }
        };
        return viewModel;
      }

      return {
        viewModel: VideoPanelVM
        , template: template
      };
    }
  );
}());
