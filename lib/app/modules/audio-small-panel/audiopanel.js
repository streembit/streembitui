(function () {
  define(
    [
      'appevents', 'contactlist', 'peercomm', 'groupcall', 'webrtccall', 'filesender', 'errhandler', 'errcodes', './audiopanel.html!text'
    ]
    , function (appevents, contactlist, peercomm, groupcall, webrtccall, filesender, errhandler, errcodes, template) {

      function AudioPanelVM(params) {
        postbox.subscribe(function(newValue) {
             viewModel.audioPanelVisibility(newValue.page, newValue.params);
        }, this, "navigateInof");

        var viewModel = {
          audioPanelShow: ko.observable(false),
          isMuted: ko.observable(false),
          isLow: ko.observable(false),
          smGroup: ko.observableArray([]),
          groupNames: ko.observableArray([]),
          callData: ko.observable({
            name: ''
            , pkeyhash: ''
          }),

          init: function() {
            appevents.addListener("newParticipant", viewModel.updateGroup);
          },

          updateGroup: function(event) {
            if(event == 'addNewParticipant') {
              var temp = viewModel.smGroup();
              for (var i = 0; i < groupcall.participants.length; i++) {
                var exists = false;
                for(index in temp) {
                  if(temp[index].name == groupcall.participants[i].name) {
                    exists = true;
                  }
                }
                if(!exists) {
                  viewModel.smGroup.push(groupcall.participants[i]);
                  viewModel.groupNames.push(groupcall.participants[i].name);
                }
              }
            } else {
              var temp = viewModel.smGroup();
              for (var i = 0; i < temp.length; i++) {
                var exists = false;
                for(index in  groupcall.participants) {
                  if(temp[i].name == groupcall.participants[index].name) {
                    exists = true;
                  }
                }

                if(!exists) {
                  viewModel.groupNames.remove(temp[i].name);
                  viewModel.smGroup.remove(function(item) {
                    return item.name == temp[i].name;
                  });
                }
              }
            }
          },

          showchat: function () {
            var contName = document.querySelectorAll('.all-contacts-field > div .text-main')
            for (var i = 0; i < contName.length; i++) {
              if (contName[i].innerText === window.callData.contact.name) {
                contName[i].click();
              }
            }
          },

          hangup: function () {
            const group = groupcall.participants;
            groupcall.hangupAll();

            for(var index in group) {
              peercomm.hangup_call(group[index], 1);
            }

            appevents.navigate('dashboard');
            window.callData = null;
            appevents.removeSignal("StreamVisualizerevent", viewModel.updateSmallSpeaker);
            viewModel.audioPanelShow(false);
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

          , contacts: ko.observableArray([])

          , showInvite: ko.observable(false)

          , show_invite: function () {
            this.showInvite(true);

            if (!viewModel.contacts().length) {
              for(var index in contactlist.contacts) {
                viewModel.contacts.push(Object.assign(new viewModel.Contact(),  contactlist.contacts[index]));
              }
            }
          },

          inviteContactSm: function (contact) {
            groupcall.invite(contact).then((result) => {
                if(result) {
                    //update the group call participants to update the view
                    for (var i = viewModel.smGroup().length; i < groupcall.participants.length; i++) {
                        viewModel.smGroup.push(groupcall.participants[i]);
                        viewModel.groupNames.push(groupcall.participants[i].name);
                    }
                }
            })
            this.showInvite(false);
          },

          //called on each view navigation
          audioPanelVisibility: function(page, params) {
            // if there is audio call and you are not in the audio call view
            if (page != "audio-call" && window.callData && window.callData.calltype == "audiocall") {
              //if the small panel is hidden => set up and show the small panel
              if (viewModel.audioPanelShow() == false) {
                viewModel.audioPanelShow(true);
                var AudioPanel = document.querySelectorAll('#smallScreenAudioCall1 .remote-audio-wrapper');

                AudioPanel.forEach(function(pNode) {
                  pNode.innerHTML = "";
                  document.querySelectorAll('#contacts-audio .remote-audio-wrapper div').forEach(function(node) {
                    if(pNode.getAttribute('data-key') == node.getAttribute('data-key')) {
                      pNode.appendChild(node);
                      node.querySelector('.remote-audio').play();
                    }
                  })
                })

                appevents.addListener("StreamVisualizerevent", viewModel.updateSmallSpeaker);
              }
            } else {  // there is no audio call or you are in the call view => hide the small panel
              viewModel.audioPanelShow(false);
              appevents.removeSignal("StreamVisualizerevent", viewModel.updateSmallSpeaker);
            }

            if(page == "audio-call") {  //if you are in the call view page
              if (window.callData) {  //if there is an audio call => restor the audio elements from the small panel
                setTimeout(function () {
                  var AudioPanel = document.querySelectorAll('#contacts-audio .remote-audio-wrapper');
                  if(AudioPanel) {
                    AudioPanel.forEach(function(pNode) {
                      pNode.innerHTML = "";
                      document.querySelectorAll('.audio-container .remote-audio-wrapper div').forEach(function(node) {
                        if(pNode.getAttribute('data-key') == node.getAttribute('data-key')) {
                          pNode.appendChild(node);
                          node.querySelector('.remote-audio').play();
                        }
                      })
                    })
                  }
                }, 1000);
              } else {  //if there is no audio call
                viewModel.callData(params.contact);
              }
            }
          },

          updateSmallSpeaker: function (event) {
            if(event =='StreamVisualizerUp') {
              viewModel.isLow(false);
            } else {
              viewModel.isLow(true);
            }
          },

          close_add_group_sm: function () {
            this.showInvite(false);
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

        viewModel.contacts.subscribe(function(newValue) {
            postbox.notifySubscribers(newValue, "contactsUpdate");
        });

        viewModel.init();
        return viewModel;
      }
      return {
        viewModel: AudioPanelVM
        , template: template
      };
    }
  );
}());
