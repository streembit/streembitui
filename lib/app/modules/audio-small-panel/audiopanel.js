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

        let $call = $("#call"), $main = $("#main"), smallMediaContainer = $('#smallScreenAudioCall1');
        var viewModel = {
          audioPanelShow: ko.observable(false),
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
            $('.add-all-contacts-field').css({
                'visibility': 'hidden'
              });
            appevents.navigate('dashboard');
            window.callData = null;
            $('.calltime_parent').css({
                'display': 'none'
              });
            var audiorem = $('#smallScreenAudioCall1 .remote-audio');
            var canvasviz = $('#smallScreenAudioCall1 .audio-viz');
            $('#call .forShowChatPos img').next().append(canvasviz);
            $('#call .forShowChatPos img').next().after(audiorem);
            $('#smallScreenAudioCall1 > div').remove();
            $('#smallScreenAudioCall1 span div').remove();
            $('#smallScreenAudioCall1 span audio').remove();
            $('#smallScreenAudioCall1').css({
                'width': '160px'
              });
            viewModel.audioPanelShow(false);
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
            // false then true to change the value if it is already true, this important to make the subscribe work
            this.showInvite(false);
            this.showInvite(true);
            $('.add-all-contacts-field').css({
                'visibility': 'visible'
              });
            if ($(".contacts-container").hasClass('activate')) {
              $('.add-all-contacts-field').css({
                  'margin-left': '-316px'
                });
            } else {
              $('.add-all-contacts-field').css({
                  'margin-left': '-195px'
                });
            }
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
          audioPanelVisibility: function(page, params) {
            if (page != "audio-call" && window.callData && window.callData.calltype == "audiocall") {
              if (smallMediaContainer.css('display') !== 'block') {
                var counter = 0;
                $.each($('.forShowChatPos > div'), (eix, el) => {
                  const excerpt = $('<div></div>').attr({
                      'data-cid': $(el).attr('id')
                    });
                  excerpt.toggleClass('smallSpeakerWind');
                  excerpt.append($('<span class="user-name"></span>').text($(el).find('span').text()));
                  excerpt.append($('<div></div>').append($(el).find('.remote-audio')).css({
                      position: 'absolute'
                      , opacity: 0
                      , height: 1
                      , bottom: 30
                    }));
                  excerpt.append($('<div></div>').css({
                      float: 'none'
                     }).append($(el).find('.audio-viz')).css({
                      'display': 'none'
                    }));
                  excerpt.append($('<div></div>').html('').css({
                      float: 'none'
                      , clear: 'both'
                      , width: '100%'
                      , height: 0
                      , background: '#c4c4c4'
                    }));
                  if (!$('.smSpeakSt').length) {
                    smallMediaContainer.append(excerpt);
                  } else {
                    $('.smSpeakSt').before(excerpt);
                  }
                  if (counter == 0) {
                    $('.smallSpeakerWind').after('<div class="smSpeakSt" style="text-align:center;"><i class="fa fa-volume-up" style="font-size:45px;color:#6893c7"></i></div>');
                    counter++;
                  } else {
                    $('#smallScreenAudioCall1').css({
                        'width': '215px'
                      });
                    if ($('.smSpeakSt').length) {
                      $('.smSpeakSt').before($('<div class="for-group-users"></div>'));
                      var oldD = $('.smallSpeakerWind').detach();
                      $('.for-group-users').append(oldD);
                      $('.smSpeakSt').css({
                          'display': 'inline-block'
                          , 'width': '50%'
                        });
                    }
                  }
                });
                $call.children('div').hide();
                const audio = smallMediaContainer.find('audio');
                $.each(audio, (eix, el) => {
                  smallMediaContainer.find('audio')[eix].play();
                });
                smallMediaContainer.find('canvas').css({
                    width: '200px'
                    , height: 64
                  });
                $('#smallScreenAudioCall1').draggable({
                    containment: 'window'
                    , appendTo: "body"
                    , scroll: false
                    , cursor: "move"
                    , refreshPositions: true
                  });
                if ($(".contacts-container").hasClass('activate')) {
                  smallMediaContainer.css({
                    'right': '240px'
                  });
                } else {
                  smallMediaContainer.css({
                    'right': '0px'
                  });
                }
              }
              viewModel.audioPanelShow(true);
            } else {
              viewModel.audioPanelShow(false);
            }

            if(page == "audio-call") {
              if (window.callData) {
                var smAudio = $('#smallScreenAudioCall1 > div[class="smallSpeakerWind"]');
                if (!$('.for-group-users').length) {
                  smAudio = $('#smallScreenAudioCall1 > div[class="smallSpeakerWind"]');
                } else {
                  smAudio = $('#smallScreenAudioCall1 .for-group-users > div[class="smallSpeakerWind"]');
                }
                $.each(smAudio, (eix, el) => {
                  // const divel = $('#smallScreenAudioCall1 > div').attr({ 'data-cid': $(el).attr('id') });
                  var divel = $('#call .forShowChatPos > div').eq(eix);
                  divel = $('#call .forShowChatPos > div').eq(eix);
                  divel.find('span').text($(el).find('span').eq(0).text());
                  divel.find('div').html('').append($(el).find('.audio-viz'));
                  divel.append($(el).find('.remote-audio'));
                  // $('#call .forShowChatPos').append(divel);
                  var changeDivelTo = $('#call .forShowChatPos > div');
                  $.each(changeDivelTo, (count, elem) => {
                    changeDivelTo.append(divel);
                  })
                });
                const audio = $('#call .forShowChatPos').find('audio');
                $.each(audio, (eix, el) => {
                  $('#call .forShowChatPos').find('audio')[eix].play();
                });
                $('#smallScreenAudioCall1 > div').remove();
                $call.show();
                $call.children('div').show();
                if ($(".contacts-container").hasClass('activate')) {
                  $('#call').css({
                      'width': '86%'
                    });
                } else {
                  $('#call').css({
                      'width': '100%'
                    });
                }
              } else {
                viewModel.callData(params.contact);
                $call.show();
                $call.css({
                  'width': '100%'
                });
                $('#call .forShowChatPos').css({
                    'display': 'inline-block'
                  });
                $('#call .audio-viz').css({
                    'display': 'inline-block'
                  });
                if (!$('#call .forShowChatPos').children().length) {
                  const cantainer = $('<div id="' + params.contact.pkeyhash + '" style="clear:both; text-align:center"></div>');
                  cantainer.append('<span class="user-name-div">' + params.contact.name + '</span>');
                  cantainer.append('<img src="/lib/images/clear.png" width="14" height="14" alt="" class="rm_partee" style="cursor: pointer" />');
                  cantainer.append('<div style="text-align: center;">\
                                                  <canvas class="audio-viz" style="background-color: #666;height:220px;display:inline-block"></canvas>\
                                                </div>');
                  cantainer.append('<audio class="remote-audio" controls autoplay></audio>');
                  $('#call .forShowChatPos').append(cantainer);
                }
                if (!$('#call .calltime_parent').children().length) {
                  const callTime = $('<div data-calltime="' + params.contact.pkeyhash + '"></div>');
                  callTime.append('Call with <span>' + params.contact.name + '</span>');
                  callTime.append('&nbsp;<span></span>');
                  $('#call .calltime_parent').append(callTime);
                }
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
