(function () {
  define(
    [
      'appevents', 'contactlist', 'peercomm', 'peermsg', 'appsrvc', 'definitions', 'utilities', 'groupcall'
      , 'webrtccall', 'webrtcdata', 'filesender', 'uuid', 'database', 'secure-random', 'connections', 'errhandler', 'errcodes', './audiopanel.html!text'
    ]
    , function (appevents, contactlist, peercomm, peermsg, appsrvc, defs, utilities, groupcall
      , webrtccall, webrtcdata, filesender, uuid, database, secrand, connections, errhandler, errcodes, template) {
      function AudioPanelVM(params) {
        postbox.subscribe(function(newValue) {
             viewModel.audioPanelVisibility(newValue.page, newValue.params);
        }, this, "navigateInof");

        var viewModel = {
          audioPanelShow: ko.observable(false),
          isMuted: ko.observable(false),
          callData: ko.observable({
            name: ''
            , pkeyhash: ''
          }),

          showchat: function () {
            var contName = $('.all-contacts-field > div').find($('.text-main'));
            for (var i = 0; i < contName.length; i++) {
              if (contName[i].innerText === window.callData.contact.name) {
                contName.eq(i).trigger('click');
                setTimeout(function () {
                  $('.smallScrChatBtn').trigger('click');
                }, 500);
              }
            }
          },

          hangup: function () {
            const group = groupcall.participants;
            groupcall.hangupAll();

            $.each(group, (pix, p) => {
              peercomm.hangup_call(p, 1);
            });

            $.each(contactlist.contacts, (idx, item) => {
              $('.all-contacts-part .list-group-item').eq(idx).removeClass('selected');
            })

            appevents.navigate('dashboard');
            window.callData = null;

            viewModel.audioPanelShow(false);
          }

          , remove_audio: function (a) {
            webrtccall.toggle_audio(false, function () {
              //toggle microphone mute
              viewModel.isMuted(!viewModel.isMuted());
            });
          },

          sendfile: function () {
            try {
              var recipients = [];
              var smallDivName = $('#smallScreenAudioCall1 .smallSpeakerWind .user-name');
              $.each(smallDivName, (a, b) => {
                var name = smallDivName.eq(a).html();
                $.each(contactlist.contacts, (idx, cnt) => {
                  if (name == cnt.name) {
                    recipients.push(cnt);
                  }
                })
              })
              var filetask = new filesender();
              filetask.run(recipients);
            } catch (err) {
              streembit.notify.error(errhandler.getmsg(errcodes.UI_SEND_FILE_ERROR, err));
            }
          }

          , contacts: ko.observableArray([])

          , showInvite: ko.observable(false)

          , show_invite: function () {
            // false then true to change the value if it is already true, this important to make the subscribe work
            this.showInvite(false);
            this.showInvite(true);

            if (!$('.add-to-group-sm-in-chat .all-contacts-part').children().length) {
              $.each(contactlist.contacts, (idx, c) => {
                viewModel.contacts.push(Object.assign(new viewModel.Contact(), c));
              });
            }

            $.each(contactlist.contacts, (idx, c) => {
              if (c.user_type !== 'human' || c.name === window.callData.contact.name) {
                return;
              }
              var contactL = $('.add-to-group-sm-in-chat .all-contacts-part .for-add-group-call .list-group-item');
              var elemNode = $('<span data-bind="click: inviteContactSm" class="showAddContBtn"><i class="fa fa-user-plus addUserIcon" style="color:#366297;font-size:16px"></i></span>')[0];
              var selectedContName = contactL.eq(idx).find('.text-main').html();
              var vm = {
                inviteContactSm: function () {
                  groupcall.invite(c);
                  if (selectedContName == c.name) {
                    contactL.eq(idx).addClass('selected');
                    contactL.eq(idx).next().remove();
                  }
                }
              };
              ko.applyBindings(vm, elemNode);
              if (!contactL.eq(idx).hasClass('selected')) {
                contactL.eq(idx).after(elemNode);
              }
            });
          },

          //called on each view navigation
          audioPanelVisibility: function(page, params) {
            // if there is audio call and you are not in the audio call view
            if (page != "audio-call" && window.callData && window.callData.calltype == "audiocall") {
              //if the small panel is hidden => set up and show the small panel
              if (viewModel.audioPanelShow() == false) {
                viewModel.audioPanelShow(true);
                var AudioPanel = document.querySelector('#smallScreenAudioCall1 .sm-audio-container');
                document.querySelectorAll('.audio-container').forEach(function(node) {
                  AudioPanel.appendChild(node);
                  node.querySelector('.remote-audio').play();
                })
              }
            } else {  // there is no audio call or you are in the call view => hide the small panel
              viewModel.audioPanelShow(false);
            }

            if(page == "audio-call") {  //if you are in the call view page
              if (window.callData) {  //if there is an audio call => restor the audio elements from the small panel
                setTimeout(function () {
                  var AudioPanel = document.querySelector('#contacts-audio');
                  if(AudioPanel) {
                    AudioPanel.innerHTML = "";
                    document.querySelectorAll('.audio-container').forEach(function(node) {
                      AudioPanel.appendChild(node);
                      node.querySelector('.remote-audio').play();
                    })
                  }
                }, 500);
              } else {  //if there is no audio call
                viewModel.callData(params.contact);
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

        viewModel.showInvite.subscribe(function(newValue) {
            postbox.notifySubscribers(newValue, "showInviteModal");
        });

        viewModel.contacts.subscribe(function(newValue) {
            postbox.notifySubscribers(newValue, "contactsUpdate");
        });
        return viewModel;
      }
      return {
        viewModel: AudioPanelVM
        , template: template
      };
    }
  );
}());
