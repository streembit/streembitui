(function () {
  define(
    [
      'appevents', 'contactlist', 'peercomm', 'peermsg', 'appsrvc', 'definitions', 'utilities', 'groupcall'
      , 'webrtccall', 'webrtcdata', 'filesender', 'uuid', 'database', 'secure-random', 'connections', 'errhandler', 'errcodes', './videopanel.html!text'
    ]
    , function (appevents, contactlist, peercomm, peermsg, appsrvc, defs, utilities, groupcall
      , webrtccall, webrtcdata, filesender, uuid, database, secrand, connections, errhandler, errcodes, template) {
      function VideoPanelVM(params) {
        postbox.subscribe(function(newValue) {
             viewModel.videoPanelVisibility(newValue.page, newValue.params);
        }, this, "navigateInof");

        var viewModel = {
          videoPanelVisibility: function(page, params) {
            if (page != "video-call" && window.callData && window.callData.calltype == "videocall") {
              if (!$('#smallScreenVideoCall1').hasClass('active')) {
                $('#smallScreenVideoCall1').addClass('active');
                var smVideo = $("#remotevid").detach();
                var callTime = $(".call-with .call-time").detach();
                $('#smallScreenVideoCall1').append(smVideo);
                $('#smallScreenVideoCall1').append(callTime);
                $('#remotevid').get(0).play();
              } else if(page == "video-call" && window.callData && window.callData.calltype == "videocall") {
                    var smVideo = $("#smallScreenVideoCall1 .remotevid").detach();
                    var callTime = $("#smallScreenVideoCall1 .call-time").detach();
                    $(".call-with .call-time").remove();
                    $(".call-with").append(callTime);
                    $(".remotevid_parent .remotevid").remove();
                    $(".remotevid_parent").append(smVideo);
                    $('#remotevid').get(0).play();
                    $('#smallScreenVideoCall1').removeClass('active');
              }
            }
          }
          , hangup: function () {
            webrtccall.hangup();
            peercomm.hangup_call(window.callData.contact);
            // navigate to empty screen
            appevents.dispatch("on-contact-selected", window.callData.contact);
            window.callData = null;
            $('#smallScreenVideoCall1 .remotevid').remove();
            $('#smallScreenVideoCall1 .call-time').remove();
            $('#smallScreenVideoCall1').removeClass('active');
            appevents.removeSignal("on-remotestream-connect", viewModel.onRemoteStreamConnect);
            appevents.removeSignal("on-cmd-hangup-call", viewModel.onPeerHangup);
            appevents.removeSignal("oncontactevent", viewModel.onTextMessage);
          }
          , remove_audio: function (a) {
            webrtccall.toggle_audio(false, function () {
              $('.spallWindMuteIc').toggleClass('muted');
              if ($('.spallWindMuteIc').hasClass('muted')) {
                $('.spallWindMuteIc').removeClass('fa fa-microphone');
                $('.spallWindMuteIc').addClass('fa fa-microphone-slash');
                $('.spallWindMuteIc').css({
                    'color': '#a90329'
                  });
                $('.smSpeakSt > i').removeClass('fa fa-volume-up');
                $('.smSpeakSt > i').removeClass('fa fa-volume-off');
              } else {
                $('.spallWindMuteIc').removeClass('fa fa-microphone-slash');
                $('.spallWindMuteIc').addClass('fa fa-microphone');
                $('.spallWindMuteIc').css({
                    'color': '#366297'
                  });
                $('.smSpeakSt > i').addClass('fa fa-volume-up');
              }
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
            this.showInvite(true);
            $('.add-all-contacts-field').css({
                'visibility': 'visible'
            });
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
                  $('.add-all-contacts-field').css({
                      'visibility': 'hidden'
                    });
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
