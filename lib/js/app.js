﻿/*                  ______________________________________
           ________|                                      |_______
           \       |           SmartAdmin WebApp          |      /
            \      |      Copyright © 2015 MyOrange       |     /
            /      |______________________________________|     \
           /__________)                                (_________\

 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 * =======================================================================
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
 * LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
 * OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
 * WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 * =======================================================================
 * original filename  : app.js
 * filesize           : 62,499~ bytes
 * author             : Sunny (@bootstraphunt)
 * email              : info@myorange.ca
 * legal notice       : This script is part of a theme sold by 
 *                      bootstraphunter.com
 *    
 * =======================================================================
 * INDEX (Note: line numbers for index items may not be up to date):
 * 
 * 1. APP CONFIGURATION..................................[ app.config.js ]
 * 2. APP DOM REFERENCES.................................[ app.config.js ]
 * 3. DETECT MOBILE DEVICES...................................[line: 149 ]
 * 4. CUSTOM MENU PLUGIN......................................[line: 688 ]
 * 5. ELEMENT EXIST OR NOT....................................[line: 778 ]
 * 6. INITIALIZE FORMS........................................[line: 788 ]
 * 		6a. BOOTSTRAP SLIDER PLUGIN...........................[line: 794 ]
 * 		6b. SELECT2 PLUGIN....................................[line: 803 ]
 * 		6c. MASKING...........................................[line: 824 ]
 * 		6d. AUTOCOMPLETE......................................[line: 843 ]
 * 		6f. JQUERY UI DATE....................................[line: 862 ]
 * 		6g. AJAX BUTTON LOADING TEXT..........................[line: 884 ]
 * 7. INITIALIZE CHARTS.......................................[line: 902 ]
 * 		7a. SPARKLINES........................................[line: 907 ]
 * 		7b. LINE CHART........................................[line: 1026]
 * 		7c. PIE CHART.........................................[line: 1077]
 * 		7d. BOX PLOT..........................................[line: 1100]
 * 		7e. BULLET............................................[line: 1145]
 * 		7f. DISCRETE..........................................[line: 1169]
 * 		7g. TRISTATE..........................................[line: 1195]
 * 		7h. COMPOSITE: BAR....................................[line: 1223]
 * 		7i. COMPOSITE: LINE...................................[line: 1259]
 * 		7j. EASY PIE CHARTS...................................[line: 1339]
 * 8. INITIALIZE JARVIS WIDGETS...............................[line: 1379]
 * 		8a. SETUP DESKTOP WIDGET..............................[line: 1466]
 * 		8b. GOOGLE MAPS.......................................[line: 1478]
 * 		8c. LOAD SCRIPTS......................................[line: 1500]
 * 		8d. APP AJAX REQUEST SETUP............................[line: 1538]
 * 9. CHECK TO SEE IF URL EXISTS..............................[line: 1614]
 * 10.LOAD AJAX PAGES.........................................[line: 1669]
 * 11.UPDATE BREADCRUMB.......................................[line: 1775]
 * 12.PAGE SETUP..............................................[line: 1798]
 * 13.POP OVER THEORY.........................................[line: 1852]
 * 14.DELETE MODEL DATA ON HIDDEN.............................[line: 1991]
 * 15.HELPFUL FUNCTIONS.......................................[line: 2027]
 * 
 * =======================================================================
 *       IMPORTANT: ALL CONFIG VARS IS NOW MOVED TO APP.CONFIG.JS
 * =======================================================================
 * 
 * 
 * GLOBAL: interval array (to be used with jarviswidget in ajax and 
 * angular mode) to clear auto fetch interval
 */


var sfh = localStorage.getItem('smart-fixed-header');
if (sfh == '1') {
    $('#smart-fixed-header').attr('checked','checked');
    fixHeader();
}
var sfn = localStorage.getItem('smart-fixed-navigation');
if(sfn == '1'){
    $('#smart-fixed-navigation').attr('checked', 'checked');
    fixNavigation();
}
var sfr = localStorage.getItem('smart-fixed-ribbon');
if(sfr == '1'){
    $('#smart-fixed-ribbon').attr('checked', 'checked');
    fixRibbon();
}
var sff = localStorage.getItem('smart-fixed-footer');
if(sff == '1'){
    $('#smart-fixed-footer').attr('checked', 'checked');
    fixFooter();
}
var srtl = localStorage.getItem('smart-rtl');
if(srtl == '1'){
    $('#smart-rtl').attr('checked', 'checked');
    smartRtl();
}
var sfc = localStorage.getItem('smart-fixed-container');
if(sfc == '1'){
    $('#smart-fixed-container').attr('checked', 'checked');
    fixContainer();
}
var stm = localStorage.getItem('sm-setmenu');
if(stm == '1'){
    $('#smart-topmenu').attr('checked', 'checked');
    smartTopMenu();
    console.log(stm);
}
var cb = localStorage.getItem('colorblind');
if(cb == '1'){
    $('#colorblind').attr('checked', 'checked');
    colorblind();
}

$.intervalArr = [];
/*
 * Calculate nav height
 */
var calc_navbar_height = function () {
    var height = null;

    if ($('#header').length)
        height = $('#header').height();

    if (height === null)
        height = $('<div id="header"></div>').height();

    if (height === null)
        return 49;
    // default
    return height;
},

    navbar_height = calc_navbar_height,
    /*
     * APP DOM REFERENCES
     * Description: Obj DOM reference, please try to avoid changing these
     */
    shortcut_dropdown = $('#shortcut'),

    //bread_crumb = $('#ribbon ol.breadcrumb'),
    /*
     * Top menu on/off
     */
    topmenu = false,
    /*
     * desktop or mobile
     */
    thisDevice = null,
    /*
     * DETECT MOBILE DEVICES
     * Description: Detects mobile device - if any of the listed device is 
     * detected a class is inserted to $.root_ and the variable thisDevice 
     * is decleard. (so far this is covering most hand held devices)
     */
    ismobile = (/iphone|ipad|ipod|android|blackberry|mini|windows\sce|palm/i.test(navigator.userAgent.toLowerCase())),
    /*
     * JS ARRAY SCRIPT STORAGE
     * Description: used with loadScript to store script path and file name
     * so it will not load twice
     */
    jsArray = {},
    /*
     * App Initialize
     * Description: Initializes the app with intApp();
     */
    initApp = (function (app) {

		/*
		 * ADD DEVICE TYPE
		 * Detect if mobile or desktop
		 */
        app.addDeviceType = function () {
            if (!ismobile) {
                // Desktop
                //$('body').addClass("desktop-detected");
                thisDevice = "desktop";
                return false;
            } else {
                // Mobile
                $('body').addClass("mobile-detected");
                thisDevice = "mobile";

                if (fastClick) {
                    // Removes the tap delay in idevices
                    // dependency: js/plugin/fastclick/fastclick.js 
                    $('body').addClass("needsclick");
                    FastClick.attach(document.body);
                    return false;
                }

            }

        };
        /* ~ END: ADD DEVICE TYPE */

		/*
		 * CHECK FOR MENU POSITION
		 * Scans localstroage for menu position (vertical or horizontal)
		 */
        app.menuPos = function () {

            if ($('body').hasClass("menu-on-top") || localStorage.getItem('sm-setmenu') == 'top') {
                topmenu = true;
                $('body').addClass("menu-on-top");
            }
        };
        /* ~ END: CHECK MOBILE DEVICE */

		/*
		 * SMART ACTIONS
		 */
        app.SmartActions = function () {

            var smartActions = {

                /*
                // LOGOUT MSG 
                userLogout: function ($this) {

                    // ask verification
                    $.SmartMessageBox({
                        title: "<i class='fa fa-sign-out txt-color-orangeDark'></i> Logout <span class='txt-color-orangeDark'><strong>" + $('#show-shortcut').text() + "</strong></span> ?",
                        content: $this.data('logout-msg') || "You can improve your security further after logging out by closing this opened browser",
                        buttons: '[No][Yes]'

                    }, function (ButtonPressed) {
                        if (ButtonPressed == "Yes") {
                            $('body').addClass('animated fadeOutUp');
                            setTimeout(logout, 1000);
                        }
                    });
                    function logout() {
                        window.location = $this.attr('href');
                    }

                },
                */

                /*
                // RESET WIDGETS
                resetWidgets: function ($this) {

                    $.SmartMessageBox({
                        title: "<i class='fa fa-refresh' style='color:green'></i> Clear Local Storage",
                        content: $this.data('reset-msg') || "Would you like to RESET all your saved widgets and clear LocalStorage?1",
                        buttons: '[No][Yes]'
                    }, function (ButtonPressed) {
                        if (ButtonPressed == "Yes" && localStorage) {
                            localStorage.clear();
                            location.reload();
                        }

                    });
                },
                */

                /*
                // LAUNCH FULLSCREEN 
                launchFullscreen: function (element) {

                    if (!$('body').hasClass("full-screen")) {

                        $('body').addClass("full-screen");

                        if (element.requestFullscreen) {
                            element.requestFullscreen();
                        } else if (element.mozRequestFullScreen) {
                            element.mozRequestFullScreen();
                        } else if (element.webkitRequestFullscreen) {
                            element.webkitRequestFullscreen();
                        } else if (element.msRequestFullscreen) {
                            element.msRequestFullscreen();
                        }

                    } else {

                        $('body').removeClass("full-screen");

                        if (document.exitFullscreen) {
                            document.exitFullscreen();
                        } else if (document.mozCancelFullScreen) {
                            document.mozCancelFullScreen();
                        } else if (document.webkitExitFullscreen) {
                            document.webkitExitFullscreen();
                        }

                    }

                },
                */

                // MINIFY MENU
                minifyMenu: function ($this) {
                    $('body').toggleClass("minified");
                    $('body').removeClass("hidden-menu");
                    $('html').removeClass("hidden-menu-mobile-lock");
                    if ($this) {
                        $this.effect("highlight", {}, 500);
                    }
                },

                // TOGGLE MENU 
                toggleMenu: function () {
                    $('#left-panel').toggleClass("hide-left-menu");
                    if($('#left-panel').hasClass('hide-left-menu')){
                        $('#left-panel').css({'display':'none'})
                    }else{
                        $('#left-panel').css({'display':'block'})
                    }
                    
                },
                // demo settings
                demoSettings: function () {
                    $('.demo').toggleClass('activate');
                    if($('.demo').hasClass('activate')){
                        $('.demo_settings_layout').css({'display': 'block'});
                    }else{
                        $('.demo_settings_layout').css({'display': 'none'});
                    }
                   
                    $('input[type="checkbox"]#smart-fixed-header').click(function () {
                        localStorage.setItem('smart-fixed-header', $(this).is(":checked") ? '1' : '0');
                        fixHeader();
                    });

                    $('input[type="checkbox"]#smart-fixed-navigation').click(function () {
                        localStorage.setItem('smart-fixed-navigation', $(this).is(":checked") ? '1' : '0');
                        fixNavigation();
                    });

                    $('input[type="checkbox"]#smart-fixed-ribbon').click(function () {
                        localStorage.setItem('smart-fixed-ribbon', $(this).is(":checked") ? '1' : '0');
                        fixRibbon();
                    });

                    $('input[type="checkbox"]#smart-fixed-footer').click(function () {
                        localStorage.setItem('smart-fixed-footer', $(this).is(":checked") ? '1' : '0');
                        fixFooter();
                    });

                    $('input[type="checkbox"]#smart-rtl').click(function () {
                        localStorage.setItem('smart-rtl', $(this).is(":checked") ? '1' : '0');
                        smartRtl();
                    });

                    $('input[type="checkbox"]#smart-fixed-container').click(function() {
                        localStorage.setItem('smart-fixed-container', $(this).is(":checked") ? '1' : '0');
                        fixContainer();
                    });

                    $('input[type="checkbox"]#smart-topmenu').click(function(){
                        localStorage.setItem('sm-setmenu', $(this).is(":checked") ? '1' : '0');
                        smartTopMenu();
                        // $(this).prop("checked") ? (localStorage.setItem("sm-setmenu", "top"),
                        // location.reload()) : (localStorage.setItem("sm-setmenu", "left"), location.reload())

                    })
                    // "top" == localStorage.getItem("sm-setmenu") ? $("#smart-topmenu").prop("checked", !0) : $("#smart-topmenu").prop("checked", !1)

                    $('input[type="checkbox"]#colorblind').click(function () {
                        localStorage.setItem('colorblind', $(this).is(":checked") ? '1' : '0');
                        colorblind();
                    })

                    $("#smart-styles > a").on("click", function() {
                        $("body").removeClassPrefix("smart-style").addClass($(this).attr("id")),
                        $("html").removeClassPrefix("smart-style").addClass($(this).attr("id")),
                        $("#smart-styles > a #skin-checked").remove(),
                        $(this).prepend("<i class='fa fa-check fa-fw' id='skin-checked'></i>")

                        
                        if($("body").hasClass("smart-style-5")){
                            $("body, .content-panel").css({"background" : "url('../img/glass.jpg')"})    
                        }
                    })

                },

                // TOGGLE SHORTCUT 
                toggleShortcut: function () {

                    if (shortcut_dropdown.is(":visible")) {
                        shortcut_buttons_hide();
                    } else {
                        shortcut_buttons_show();
                    }

                    // SHORT CUT (buttons that appear when clicked on user name)
                    shortcut_dropdown.find('a').click(function (e) {
                        e.preventDefault();
                        window.location = $(this).attr('href');
                        setTimeout(shortcut_buttons_hide, 300);

                    });

                    // SHORTCUT buttons goes away if mouse is clicked outside of the area
                    $(document).mouseup(function (e) {
                        if (!shortcut_dropdown.is(e.target) && shortcut_dropdown.has(e.target).length === 0) {
                            shortcut_buttons_hide();
                        }
                    });

                    // SHORTCUT ANIMATE HIDE
                    function shortcut_buttons_hide() {
                        shortcut_dropdown.animate({
                            height: "hide"
                        }, 300, "easeOutCirc");
                        $('body').removeClass('shortcut-on');

                    }

                    // SHORTCUT ANIMATE SHOW
                    function shortcut_buttons_show() {
                        shortcut_dropdown.animate({
                            height: "show"
                        }, 200, "easeOutCirc");
                        $('body').addClass('shortcut-on');
                    }

                }

            };


			/*
			 * BUTTON ACTIONS 
			 */
            $('body').on('click', '[data-action="launchFullscreen"]', function (e) {
                smartActions.launchFullscreen(document.documentElement);
                e.preventDefault();
            });

            $('body').on('click', '[data-action="toggleMenu"]', function (e) {
                smartActions.toggleMenu();
                e.preventDefault();
            });

            $('body').on('click', '[data-action="toggleShortcut"]', function (e) {
                smartActions.toggleShortcut();
                e.preventDefault();
            });
            $('body').on('click', '[data-action="demoSettings"]', function (e) {
                smartActions.demoSettings();
                e.preventDefault();
            });
        };
        /* ~ END: SMART ACTIONS */

		/*
		 * ACTIVATE NAVIGATION
		 * Description: Activation will fail if top navigation is on
		 */
        app.leftNav = function () {

            // INITIALIZE LEFT NAV
            if (!topmenu) {
                if (!null) {
                    $('nav ul').jarvismenu({
                        accordion: menu_accordion || true,
                        speed: menu_speed || true,
                        closedSign: '<em class="fa fa-plus-square-o"></em>',
                        openedSign: '<em class="fa fa-minus-square-o"></em>'
                    });
                } else {
                    alert("Error - menu anchor does not exist");
                }
            }

        };
        /* ~ END: ACTIVATE NAVIGATION */

		/*
		 * MISCELANEOUS DOM READY FUNCTIONS
		 * Description: fire with jQuery(document).ready...
		 */
        app.domReadyMisc = function () {

			/*
			 * FIRE TOOLTIPS
			 */
            if ($("[rel=tooltip]").length) {
                $("[rel=tooltip]").tooltip();
            }

            // SHOW & HIDE MOBILE SEARCH FIELD
            $('#search-mobile').click(function () {
                $('body').addClass('search-mobile');
            });

            $('#cancel-search-js').click(function () {
                $('body').removeClass('search-mobile');
            });

            // ACTIVITY
            // ajax drop
            $('#activity').click(function (e) {
                var $this = $(this);

                if ($this.find('.badge').hasClass('bg-color-red')) {
                    $this.find('.badge').removeClassPrefix('bg-color-');
                    $this.find('.badge').text("0");
                }

                if (!$this.next('.ajax-dropdown').is(':visible')) {
                    $this.next('.ajax-dropdown').fadeIn(150);
                    $this.addClass('active');
                } else {
                    $this.next('.ajax-dropdown').fadeOut(150);
                    $this.removeClass('active');
                }

                var theUrlVal = $this.next('.ajax-dropdown').find('.btn-group > .active > input').attr('id');

                //clear memory reference
                $this = null;
                theUrlVal = null;

                e.preventDefault();
            });

            $('input[name="activity"]').change(function () {
                var $this = $(this);

                url = $this.attr('id');
                container = $('.ajax-notifications');

                loadURL(url, container);

                //clear memory reference
                $this = null;
            });

            // close dropdown if mouse is not inside the area of .ajax-dropdown
            $(document).mouseup(function (e) {
                if (!$('.ajax-dropdown').is(e.target) && $('.ajax-dropdown').has(e.target).length === 0) {
                    $('.ajax-dropdown').fadeOut(150);
                    $('.ajax-dropdown').prev().removeClass("active");
                }
            });

            // loading animation (demo purpose only)
            $('button[data-btn-loading]').on('click', function () {
                var btn = $(this);
                btn.button('loading');
                setTimeout(function () {
                    btn.button('reset');
                }, 3000);
            });

            // NOTIFICATION IS PRESENT
            // Change color of lable once notification button is clicked

            $this = $('#activity > .badge');

            if (parseInt($this.text()) > 0) {
                $this.addClass("bg-color-red bounceIn animated");

                //clear memory reference
                $this = null;
            }


        };
        /* ~ END: MISCELANEOUS DOM */

		/*
		 * MISCELANEOUS DOM READY FUNCTIONS
		 * Description: fire with jQuery(document).ready...
		 */
        //app.toggleMobile = function() {
            //if ($(window).width() < 979) {
            //    //$('body').addClass('mobile-view-activated');
            //    //$('body').removeClass('minified');
            //    //$('#activity').hide();
            //    //$('.project-context').hide();
            //}
            //else {
            //    //$('#activity').show();
            //   // $('.project-context').show();
            //    //if ($('body').hasClass('mobile-view-activated')) {
            //    //    $('body').removeClass('mobile-view-activated');               
            //    //}
            //}
        //}
        /* ~ END: MISCELANEOUS DOM */

        return app;

    })({});

initApp.addDeviceType();
initApp.menuPos();


/*
 * DOCUMENT LOADED EVENT
 * Description: Fire when DOM is ready
 */
jQuery(document).ready(function () {
    initApp.SmartActions();
    initApp.leftNav();
    initApp.domReadyMisc();

});
/*
 * RESIZER WITH THROTTLE
 * Source: http://benalman.com/code/projects/jquery-resize/examples/resize/
 */

//(function ($, window, undefined) {

//    var elems = $([]),
//        jq_resize = $.resize = $.extend($.resize, {}),
//        timeout_id, str_setTimeout = 'setTimeout',
//        str_resize = 'resize',
//        str_data = str_resize + '-special-event',
//        str_delay = 'delay',
//        str_throttle = 'throttleWindow';

//    jq_resize[str_delay] = throttle_delay;

//    jq_resize[str_throttle] = true;

//    $.event.special[str_resize] = {

//        setup: function () {
//            if (!jq_resize[str_throttle] && this[str_setTimeout]) {
//                return false;
//            }

//            var elem = $(this);
//            elems = elems.add(elem);
//            try {
//                $.data(this, str_data, {
//                    w: elem.width(),
//                    h: elem.height()
//                });
//            } catch (e) {
//                $.data(this, str_data, {
//                    w: elem.width, // elem.width();
//                    h: elem.height // elem.height();
//                });
//            }

//            if (elems.length === 1) {
//                loopy();
//            }
//        },
//        teardown: function () {
//            if (!jq_resize[str_throttle] && this[str_setTimeout]) {
//                return false;
//            }

//            var elem = $(this);
//            elems = elems.not(elem);
//            elem.removeData(str_data);
//            if (!elems.length) {
//                clearTimeout(timeout_id);
//            }
//        },

//        add: function (handleObj) {
//            if (!jq_resize[str_throttle] && this[str_setTimeout]) {
//                return false;
//            }
//            var old_handler;

//            function new_handler(e, w, h) {
//                var elem = $(this),
//                    data = $.data(this, str_data);
//                data.w = w !== undefined ? w : elem.width();
//                data.h = h !== undefined ? h : elem.height();

//                old_handler.apply(this, arguments);
//            }
//            if ($.isFunction(handleObj)) {
//                old_handler = handleObj;
//                return new_handler;
//            } else {
//                old_handler = handleObj.handler;
//                handleObj.handler = new_handler;
//            }
//        }
//    };

//    function loopy() {
//        timeout_id = window[str_setTimeout](function () {
//            elems.each(function () {
//                var width;
//                var height;

//                var elem = $(this),
//                    data = $.data(this, str_data); //width = elem.width(), height = elem.height();

//                // Highcharts fix
//                try {
//                    width = elem.width();
//                } catch (e) {
//                    width = elem.width;
//                }

//                try {
//                    height = elem.height();
//                } catch (e) {
//                    height = elem.height;
//                }
//                //fixed bug


//                if (width !== data.w || height !== data.h) {
//                    elem.trigger(str_resize, [data.w = width, data.h = height]);
//                }

//            });
//            loopy();

//        }, jq_resize[str_delay]);

//    }

//})(jQuery, this);




/* ~ END: NAV OR #LEFT-BAR RESIZE DETECT */

/*
 * DETECT IE VERSION
 * Description: A short snippet for detecting versions of IE in JavaScript
 * without resorting to user-agent sniffing
 * RETURNS:
 * If you're not in IE (or IE version is less than 5) then:
 * //ie === undefined
 *
 * If you're in IE (>=5) then you can determine which version:
 * // ie === 7; // IE7
 *
 * Thus, to detect IE:
 * // if (ie) {}
 *
 * And to detect the version:
 * ie === 6 // IE6
 * ie > 7 // IE8, IE9 ...
 * ie < 9 // Anything less than IE9
 */
// TODO: delete this function later on - no longer needed (?)
var ie = (function () {

    var undef, v = 3, div = document.createElement('div'), all = div.getElementsByTagName('i');

    while (div.innerHTML = '<!--[if gt IE ' + (++v) + ']><i></i><![endif]-->', all[0]);

    return v > 4 ? v : undef;

}());
/* ~ END: DETECT IE VERSION */

/*
 * CUSTOM MENU PLUGIN
 */


$.fn.extend({

    //pass the options variable to the function
    jarvismenu: function (options) {

        var defaults = {
            accordion: 'true',
            speed: 200,
            closedSign: '[+]',
            openedSign: '[-]'
        },

            // Extend our default options with those provided.
            opts = $.extend(defaults, options),
            //Assign current element to variable, in this case is UL element
            $this = $(this);

        //add a mark [+] to a multilevel menu
        $this.find("li").each(function () {
            if ($(this).find("ul").size() !== 0) {
                //add the multilevel sign next to the link
                $(this).find("a:first").append("<b class='collapse-sign'>" + opts.closedSign + "</b>");

                //avoid jumping to the top of the page when the href is an #
                if ($(this).find("a:first").attr('href') == "#") {
                    $(this).find("a:first").click(function () {
                        return false;
                    });
                }
            }
        });

        //open active level
        $this.find("li.active").each(function () {
            $(this).parents("ul").slideDown(opts.speed);
            $(this).parents("ul").parent("li").find("b:first").html(opts.openedSign);
            $(this).parents("ul").parent("li").addClass("open");
        });

        $this.find("li a").click(function () {

            if ($(this).attr("data-bind")) {
                $this.find("li.active").each(function () {
                    $(this).removeClass("active");
                });

                $(this).closest("li").addClass("active");
            }            

            if ($(this).parent().find("ul").length !== 0) {

                if (opts.accordion) {
                    //Do nothing when the list is open
                    if (!$(this).parent().find("ul").is(':visible')) {
                        parents = $(this).parent().parents("ul");
                        visible = $this.find("ul:visible");
                        visible.each(function (visibleIndex) {
                            var close = true;
                            parents.each(function (parentIndex) {
                                if (parents[parentIndex] == visible[visibleIndex]) {
                                    close = false;
                                    return false;
                                }
                            });
                            if (close) {
                                if ($(this).parent().find("ul") != visible[visibleIndex]) {
                                    $(visible[visibleIndex]).slideUp(opts.speed, function () {
                                        $(this).parent("li").find("b:first").html(opts.closedSign);
                                        $(this).parent("li").removeClass("open");
                                    });

                                }
                            }
                        });
                    }
                }// end if
                if ($(this).parent().find("ul:first").is(":visible") && !$(this).parent().find("ul:first").hasClass("active")) {
                    $(this).parent().find("ul:first").slideUp(opts.speed, function () {
                        $(this).parent("li").removeClass("open");
                        $(this).parent("li").find("b:first").delay(opts.speed).html(opts.closedSign);
                    });

                } else {
                    $(this).parent().find("ul:first").slideDown(opts.speed, function () {
                        /*$(this).effect("highlight", {color : '#616161'}, 500); - disabled due to CPU clocking on phones*/
                        $(this).parent("li").addClass("open");
                        $(this).parent("li").find("b:first").delay(opts.speed).html(opts.openedSign);
                    });
                } // end else
            } // end if
        });
    } // end function
});
/* ~ END: CUSTOM MENU PLUGIN */

/*
 * ELEMENT EXIST OR NOT
 * Description: returns true or false
 * Usage: $('#myDiv').doesExist();
 */
jQuery.fn.doesExist = function () {
    return jQuery(this).length > 0;
};
/* ~ END: ELEMENT EXIST OR NOT */

/*
 * INITIALIZE FORMS
 * Description: Select2, Masking, Datepicker, Autocomplete
 */
function runAllForms() {

    /*
     * BOOTSTRAP SLIDER PLUGIN
     * Usage:
     * Dependency: js/plugin/bootstrap-slider
     */
    if ($.fn.slider) {
        $('.slider').slider();
    }

    /*
     * SELECT2 PLUGIN
     * Usage:
     * Dependency: js/plugin/select2/
     */
    if ($.fn.select2) {
        $('select.select2').each(function () {
            var $this = $(this),
                width = $this.attr('data-select-width') || '100%';
            //, _showSearchInput = $this.attr('data-select-search') === 'true';
            $this.select2({
                //showSearchInput : _showSearchInput,
                allowClear: true,
                width: width
            });

            //clear memory reference
            $this = null;
        });
    }

    /*
     * MASKING
     * Dependency: js/plugin/masked-input/
     */
    if ($.fn.mask) {
        $('[data-mask]').each(function () {

            var $this = $(this),
                mask = $this.attr('data-mask') || 'error...', mask_placeholder = $this.attr('data-mask-placeholder') || 'X';

            $this.mask(mask, {
                placeholder: mask_placeholder
            });

            //clear memory reference
            $this = null;
        });
    }

    /*
     * AUTOCOMPLETE
     * Dependency: js/jqui
     */
    if ($.fn.autocomplete) {
        $('[data-autocomplete]').each(function () {

            var $this = $(this),
                availableTags = $this.data('autocomplete') || ["The", "Quick", "Brown", "Fox", "Jumps", "Over", "Three", "Lazy", "Dogs"];

            $this.autocomplete({
                source: availableTags
            });

            //clear memory reference
            $this = null;
        });
    }

    /*
     * JQUERY UI DATE
     * Dependency: js/libs/jquery-ui-1.10.3.min.js
     * Usage: <input class="datepicker" />
     */
    if ($.fn.datepicker) {
        $('.datepicker').each(function () {

            var $this = $(this),
                dataDateFormat = $this.attr('data-dateformat') || 'dd.mm.yy';

            $this.datepicker({
                dateFormat: dataDateFormat,
                prevText: '<i class="fa fa-chevron-left"></i>',
                nextText: '<i class="fa fa-chevron-right"></i>',
            });

            //clear memory reference
            $this = null;
        });
    }

    /*
     * AJAX BUTTON LOADING TEXT
     * Usage: <button type="button" data-loading-text="Loading..." class="btn btn-xs btn-default ajax-refresh"> .. </button>
     */
    $('button[data-loading-text]').on('click', function () {
        var btn = $(this);
        btn.button('loading');
        setTimeout(function () {
            btn.button('reset');
            //clear memory reference
            btn = null;
        }, 3000);

    });

}
/* ~ END: INITIALIZE FORMS */

/*
 * INITIALIZE CHARTS
 * Description: Sparklines, PieCharts
 */
function runAllCharts() {
    /*
     * SPARKLINES
     * DEPENDENCY: js/plugins/sparkline/jquery.sparkline.min.js
     * See usage example below...
     */

    /* Usage:
     * 		<div class="sparkline-line txt-color-blue" data-fill-color="transparent" data-sparkline-height="26px">
     *			5,6,7,9,9,5,9,6,5,6,6,7,7,6,7,8,9,7
     *		</div>
     */

    if ($.fn.sparkline) {

        // variable declearations:

        var barColor,
            sparklineHeight,
            sparklineBarWidth,
            sparklineBarSpacing,
            sparklineNegBarColor,
            sparklineStackedColor,
            thisLineColor,
            thisLineWidth,
            thisFill,
            thisSpotColor,
            thisMinSpotColor,
            thisMaxSpotColor,
            thishighlightSpotColor,
            thisHighlightLineColor,
            thisSpotRadius,
            pieColors,
            pieWidthHeight,
            pieBorderColor,
            pieOffset,
            thisBoxWidth,
            thisBoxHeight,
            thisBoxRaw,
            thisBoxTarget,
            thisBoxMin,
            thisBoxMax,
            thisShowOutlier,
            thisIQR,
            thisBoxSpotRadius,
            thisBoxLineColor,
            thisBoxFillColor,
            thisBoxWhisColor,
            thisBoxOutlineColor,
            thisBoxOutlineFill,
            thisBoxMedianColor,
            thisBoxTargetColor,
            thisBulletHeight,
            thisBulletWidth,
            thisBulletColor,
            thisBulletPerformanceColor,
            thisBulletRangeColors,
            thisDiscreteHeight,
            thisDiscreteWidth,
            thisDiscreteLineColor,
            thisDiscreteLineHeight,
            thisDiscreteThrushold,
            thisDiscreteThrusholdColor,
            thisTristateHeight,
            thisTristatePosBarColor,
            thisTristateNegBarColor,
            thisTristateZeroBarColor,
            thisTristateBarWidth,
            thisTristateBarSpacing,
            thisZeroAxis,
            thisBarColor,
            sparklineWidth,
            sparklineValue,
            sparklineValueSpots1,
            sparklineValueSpots2,
            thisLineWidth1,
            thisLineWidth2,
            thisLineColor1,
            thisLineColor2,
            thisSpotRadius1,
            thisSpotRadius2,
            thisMinSpotColor1,
            thisMaxSpotColor1,
            thisMinSpotColor2,
            thisMaxSpotColor2,
            thishighlightSpotColor1,
            thisHighlightLineColor1,
            thishighlightSpotColor2,
            thisFillColor1,
            thisFillColor2;

        $('.sparkline:not(:has(>canvas))').each(function () {
            var $this = $(this),
                sparklineType = $this.data('sparkline-type') || 'bar';

            // BAR CHART
            if (sparklineType == 'bar') {

                barColor = $this.data('sparkline-bar-color') || $this.css('color') || '#0000f0';
                sparklineHeight = $this.data('sparkline-height') || '26px';
                sparklineBarWidth = $this.data('sparkline-barwidth') || 5;
                sparklineBarSpacing = $this.data('sparkline-barspacing') || 2;
                sparklineNegBarColor = $this.data('sparkline-negbar-color') || '#A90329';
                sparklineStackedColor = $this.data('sparkline-barstacked-color') || ["#A90329", "#0099c6", "#98AA56", "#da532c", "#4490B1", "#6E9461", "#990099", "#B4CAD3"];

                $this.sparkline('html', {
                    barColor: barColor,
                    type: sparklineType,
                    height: sparklineHeight,
                    barWidth: sparklineBarWidth,
                    barSpacing: sparklineBarSpacing,
                    stackedBarColor: sparklineStackedColor,
                    negBarColor: sparklineNegBarColor,
                    zeroAxis: 'false'
                });

                $this = null;

            }

            // LINE CHART
            if (sparklineType == 'line') {

                sparklineHeight = $this.data('sparkline-height') || '20px';
                sparklineWidth = $this.data('sparkline-width') || '90px';
                thisLineColor = $this.data('sparkline-line-color') || $this.css('color') || '#0000f0';
                thisLineWidth = $this.data('sparkline-line-width') || 1;
                thisFill = $this.data('fill-color') || '#c0d0f0';
                thisSpotColor = $this.data('sparkline-spot-color') || '#f08000';
                thisMinSpotColor = $this.data('sparkline-minspot-color') || '#ed1c24';
                thisMaxSpotColor = $this.data('sparkline-maxspot-color') || '#f08000';
                thishighlightSpotColor = $this.data('sparkline-highlightspot-color') || '#50f050';
                thisHighlightLineColor = $this.data('sparkline-highlightline-color') || 'f02020';
                thisSpotRadius = $this.data('sparkline-spotradius') || 1.5;
                thisChartMinYRange = $this.data('sparkline-min-y') || 'undefined';
                thisChartMaxYRange = $this.data('sparkline-max-y') || 'undefined';
                thisChartMinXRange = $this.data('sparkline-min-x') || 'undefined';
                thisChartMaxXRange = $this.data('sparkline-max-x') || 'undefined';
                thisMinNormValue = $this.data('min-val') || 'undefined';
                thisMaxNormValue = $this.data('max-val') || 'undefined';
                thisNormColor = $this.data('norm-color') || '#c0c0c0';
                thisDrawNormalOnTop = $this.data('draw-normal') || false;

                $this.sparkline('html', {
                    type: 'line',
                    width: sparklineWidth,
                    height: sparklineHeight,
                    lineWidth: thisLineWidth,
                    lineColor: thisLineColor,
                    fillColor: thisFill,
                    spotColor: thisSpotColor,
                    minSpotColor: thisMinSpotColor,
                    maxSpotColor: thisMaxSpotColor,
                    highlightSpotColor: thishighlightSpotColor,
                    highlightLineColor: thisHighlightLineColor,
                    spotRadius: thisSpotRadius,
                    chartRangeMin: thisChartMinYRange,
                    chartRangeMax: thisChartMaxYRange,
                    chartRangeMinX: thisChartMinXRange,
                    chartRangeMaxX: thisChartMaxXRange,
                    normalRangeMin: thisMinNormValue,
                    normalRangeMax: thisMaxNormValue,
                    normalRangeColor: thisNormColor,
                    drawNormalOnTop: thisDrawNormalOnTop

                });

                $this = null;

            }

            // PIE CHART
            if (sparklineType == 'pie') {

                pieColors = $this.data('sparkline-piecolor') || ["#B4CAD3", "#4490B1", "#98AA56", "#da532c", "#6E9461", "#0099c6", "#990099", "#717D8A"];
                pieWidthHeight = $this.data('sparkline-piesize') || 90;
                pieBorderColor = $this.data('border-color') || '#45494C';
                pieOffset = $this.data('sparkline-offset') || 0;

                $this.sparkline('html', {
                    type: 'pie',
                    width: pieWidthHeight,
                    height: pieWidthHeight,
                    tooltipFormat: '<span style="color: {{color}}">&#9679;</span> ({{percent.1}}%)',
                    sliceColors: pieColors,
                    borderWidth: 1,
                    offset: pieOffset,
                    borderColor: pieBorderColor
                });

                $this = null;

            }

            // BOX PLOT
            if (sparklineType == 'box') {

                thisBoxWidth = $this.data('sparkline-width') || 'auto';
                thisBoxHeight = $this.data('sparkline-height') || 'auto';
                thisBoxRaw = $this.data('sparkline-boxraw') || false;
                thisBoxTarget = $this.data('sparkline-targetval') || 'undefined';
                thisBoxMin = $this.data('sparkline-min') || 'undefined';
                thisBoxMax = $this.data('sparkline-max') || 'undefined';
                thisShowOutlier = $this.data('sparkline-showoutlier') || true;
                thisIQR = $this.data('sparkline-outlier-iqr') || 1.5;
                thisBoxSpotRadius = $this.data('sparkline-spotradius') || 1.5;
                thisBoxLineColor = $this.css('color') || '#000000';
                thisBoxFillColor = $this.data('fill-color') || '#c0d0f0';
                thisBoxWhisColor = $this.data('sparkline-whis-color') || '#000000';
                thisBoxOutlineColor = $this.data('sparkline-outline-color') || '#303030';
                thisBoxOutlineFill = $this.data('sparkline-outlinefill-color') || '#f0f0f0';
                thisBoxMedianColor = $this.data('sparkline-outlinemedian-color') || '#f00000';
                thisBoxTargetColor = $this.data('sparkline-outlinetarget-color') || '#40a020';

                $this.sparkline('html', {
                    type: 'box',
                    width: thisBoxWidth,
                    height: thisBoxHeight,
                    raw: thisBoxRaw,
                    target: thisBoxTarget,
                    minValue: thisBoxMin,
                    maxValue: thisBoxMax,
                    showOutliers: thisShowOutlier,
                    outlierIQR: thisIQR,
                    spotRadius: thisBoxSpotRadius,
                    boxLineColor: thisBoxLineColor,
                    boxFillColor: thisBoxFillColor,
                    whiskerColor: thisBoxWhisColor,
                    outlierLineColor: thisBoxOutlineColor,
                    outlierFillColor: thisBoxOutlineFill,
                    medianColor: thisBoxMedianColor,
                    targetColor: thisBoxTargetColor

                });

                $this = null;

            }

            // BULLET
            if (sparklineType == 'bullet') {

                var thisBulletHeight = $this.data('sparkline-height') || 'auto';
                thisBulletWidth = $this.data('sparkline-width') || 2;
                thisBulletColor = $this.data('sparkline-bullet-color') || '#ed1c24';
                thisBulletPerformanceColor = $this.data('sparkline-performance-color') || '#3030f0';
                thisBulletRangeColors = $this.data('sparkline-bulletrange-color') || ["#d3dafe", "#a8b6ff", "#7f94ff"];

                $this.sparkline('html', {

                    type: 'bullet',
                    height: thisBulletHeight,
                    targetWidth: thisBulletWidth,
                    targetColor: thisBulletColor,
                    performanceColor: thisBulletPerformanceColor,
                    rangeColors: thisBulletRangeColors

                });

                $this = null;

            }

            // DISCRETE
            if (sparklineType == 'discrete') {

                thisDiscreteHeight = $this.data('sparkline-height') || 26;
                thisDiscreteWidth = $this.data('sparkline-width') || 50;
                thisDiscreteLineColor = $this.css('color');
                thisDiscreteLineHeight = $this.data('sparkline-line-height') || 5;
                thisDiscreteThrushold = $this.data('sparkline-threshold') || 'undefined';
                thisDiscreteThrusholdColor = $this.data('sparkline-threshold-color') || '#ed1c24';

                $this.sparkline('html', {

                    type: 'discrete',
                    width: thisDiscreteWidth,
                    height: thisDiscreteHeight,
                    lineColor: thisDiscreteLineColor,
                    lineHeight: thisDiscreteLineHeight,
                    thresholdValue: thisDiscreteThrushold,
                    thresholdColor: thisDiscreteThrusholdColor

                });

                $this = null;

            }

            // TRISTATE
            if (sparklineType == 'tristate') {

                thisTristateHeight = $this.data('sparkline-height') || 26;
                thisTristatePosBarColor = $this.data('sparkline-posbar-color') || '#60f060';
                thisTristateNegBarColor = $this.data('sparkline-negbar-color') || '#f04040';
                thisTristateZeroBarColor = $this.data('sparkline-zerobar-color') || '#909090';
                thisTristateBarWidth = $this.data('sparkline-barwidth') || 5;
                thisTristateBarSpacing = $this.data('sparkline-barspacing') || 2;
                thisZeroAxis = $this.data('sparkline-zeroaxis') || false;

                $this.sparkline('html', {

                    type: 'tristate',
                    height: thisTristateHeight,
                    posBarColor: thisBarColor,
                    negBarColor: thisTristateNegBarColor,
                    zeroBarColor: thisTristateZeroBarColor,
                    barWidth: thisTristateBarWidth,
                    barSpacing: thisTristateBarSpacing,
                    zeroAxis: thisZeroAxis

                });

                $this = null;

            }

            //COMPOSITE: BAR
            if (sparklineType == 'compositebar') {

                sparklineHeight = $this.data('sparkline-height') || '20px';
                sparklineWidth = $this.data('sparkline-width') || '100%';
                sparklineBarWidth = $this.data('sparkline-barwidth') || 3;
                thisLineWidth = $this.data('sparkline-line-width') || 1;
                thisLineColor = $this.data('data-sparkline-linecolor') || '#ed1c24';
                thisBarColor = $this.data('data-sparkline-barcolor') || '#333333';

                $this.sparkline($this.data('sparkline-bar-val'), {

                    type: 'bar',
                    width: sparklineWidth,
                    height: sparklineHeight,
                    barColor: thisBarColor,
                    barWidth: sparklineBarWidth
                    //barSpacing: 5

                });

                $this.sparkline($this.data('sparkline-line-val'), {

                    width: sparklineWidth,
                    height: sparklineHeight,
                    lineColor: thisLineColor,
                    lineWidth: thisLineWidth,
                    composite: true,
                    fillColor: false

                });

                $this = null;

            }

            //COMPOSITE: LINE
            if (sparklineType == 'compositeline') {

                sparklineHeight = $this.data('sparkline-height') || '20px';
                sparklineWidth = $this.data('sparkline-width') || '90px';
                sparklineValue = $this.data('sparkline-bar-val');
                sparklineValueSpots1 = $this.data('sparkline-bar-val-spots-top') || null;
                sparklineValueSpots2 = $this.data('sparkline-bar-val-spots-bottom') || null;
                thisLineWidth1 = $this.data('sparkline-line-width-top') || 1;
                thisLineWidth2 = $this.data('sparkline-line-width-bottom') || 1;
                thisLineColor1 = $this.data('sparkline-color-top') || '#333333';
                thisLineColor2 = $this.data('sparkline-color-bottom') || '#ed1c24';
                thisSpotRadius1 = $this.data('sparkline-spotradius-top') || 1.5;
                thisSpotRadius2 = $this.data('sparkline-spotradius-bottom') || thisSpotRadius1;
                thisSpotColor = $this.data('sparkline-spot-color') || '#f08000';
                thisMinSpotColor1 = $this.data('sparkline-minspot-color-top') || '#ed1c24';
                thisMaxSpotColor1 = $this.data('sparkline-maxspot-color-top') || '#f08000';
                thisMinSpotColor2 = $this.data('sparkline-minspot-color-bottom') || thisMinSpotColor1;
                thisMaxSpotColor2 = $this.data('sparkline-maxspot-color-bottom') || thisMaxSpotColor1;
                thishighlightSpotColor1 = $this.data('sparkline-highlightspot-color-top') || '#50f050';
                thisHighlightLineColor1 = $this.data('sparkline-highlightline-color-top') || '#f02020';
                thishighlightSpotColor2 = $this.data('sparkline-highlightspot-color-bottom') ||
                    thishighlightSpotColor1;
                thisHighlightLineColor2 = $this.data('sparkline-highlightline-color-bottom') ||
                    thisHighlightLineColor1;
                thisFillColor1 = $this.data('sparkline-fillcolor-top') || 'transparent';
                thisFillColor2 = $this.data('sparkline-fillcolor-bottom') || 'transparent';

                $this.sparkline(sparklineValue, {

                    type: 'line',
                    spotRadius: thisSpotRadius1,

                    spotColor: thisSpotColor,
                    minSpotColor: thisMinSpotColor1,
                    maxSpotColor: thisMaxSpotColor1,
                    highlightSpotColor: thishighlightSpotColor1,
                    highlightLineColor: thisHighlightLineColor1,

                    valueSpots: sparklineValueSpots1,

                    lineWidth: thisLineWidth1,
                    width: sparklineWidth,
                    height: sparklineHeight,
                    lineColor: thisLineColor1,
                    fillColor: thisFillColor1

                });

                $this.sparkline($this.data('sparkline-line-val'), {

                    type: 'line',
                    spotRadius: thisSpotRadius2,

                    spotColor: thisSpotColor,
                    minSpotColor: thisMinSpotColor2,
                    maxSpotColor: thisMaxSpotColor2,
                    highlightSpotColor: thishighlightSpotColor2,
                    highlightLineColor: thisHighlightLineColor2,

                    valueSpots: sparklineValueSpots2,

                    lineWidth: thisLineWidth2,
                    width: sparklineWidth,
                    height: sparklineHeight,
                    lineColor: thisLineColor2,
                    composite: true,
                    fillColor: thisFillColor2

                });

                $this = null;

            }

        });

    }// end if

    /*
     * EASY PIE CHARTS
     * DEPENDENCY: js/plugins/easy-pie-chart/jquery.easy-pie-chart.min.js
     * Usage: <div class="easy-pie-chart txt-color-orangeDark" data-pie-percent="33" data-pie-size="72" data-size="72">
     *			<span class="percent percent-sign">35</span>
     * 	  	  </div>
     */

    if ($.fn.easyPieChart) {

        $('.easy-pie-chart').each(function () {
            var $this = $(this),
                barColor = $this.css('color') || $this.data('pie-color'),
                trackColor = $this.data('pie-track-color') || 'rgba(0,0,0,0.04)',
                size = parseInt($this.data('pie-size')) || 25;

            $this.easyPieChart({

                barColor: barColor,
                trackColor: trackColor,
                scaleColor: false,
                lineCap: 'butt',
                lineWidth: parseInt(size / 8.5),
                animate: 1500,
                rotate: -90,
                size: size,
                onStep: function (from, to, percent) {
                    $(this.el).find('.percent').text(Math.round(percent));
                }

            });

            $this = null;
        });

    } // end if

}
/* ~ END: INITIALIZE CHARTS */

/*
 * INITIALIZE JARVIS WIDGETS
 * Setup Desktop Widgets
 */
function setup_widgets_desktop() {

    if ($.fn.jarvisWidgets && enableJarvisWidgets) {

        $('#widget-grid').jarvisWidgets({

            grid: 'article',
            widgets: '.jarviswidget',
            localStorage: localStorageJarvisWidgets,
            deleteSettingsKey: '#deletesettingskey-options',
            settingsKeyLabel: 'Reset settings?',
            deletePositionKey: '#deletepositionkey-options',
            positionKeyLabel: 'Reset position?',
            sortable: sortableJarvisWidgets,
            buttonsHidden: false,
            // toggle button
            toggleButton: true,
            toggleClass: 'fa fa-minus | fa fa-plus',
            toggleSpeed: 200,
            onToggle: function () {
            },
            // delete btn
            deleteButton: true,
            deleteMsg: 'Warning: This action cannot be undone!',
            deleteClass: 'fa fa-times',
            deleteSpeed: 200,
            onDelete: function () {
            },
            // edit btn
            editButton: true,
            editPlaceholder: '.jarviswidget-editbox',
            editClass: 'fa fa-cog | fa fa-save',
            editSpeed: 200,
            onEdit: function () {
            },
            // color button
            colorButton: true,
            // full screen
            fullscreenButton: true,
            fullscreenClass: 'fa fa-expand | fa fa-compress',
            fullscreenDiff: 3,
            onFullscreen: function () {
            },
            // custom btn
            customButton: false,
            customClass: 'folder-10 | next-10',
            customStart: function () {
                alert('Hello you, this is a custom button...');
            },
            customEnd: function () {
                alert('bye, till next time...');
            },
            // order
            buttonOrder: '%refresh% %custom% %edit% %toggle% %fullscreen% %delete%',
            opacity: 1.0,
            dragHandle: '> header',
            placeholderClass: 'jarviswidget-placeholder',
            indicator: true,
            indicatorTime: 600,
            ajax: true,
            timestampPlaceholder: '.jarviswidget-timestamp',
            timestampFormat: 'Last update: %m%/%d%/%y% %h%:%i%:%s%',
            refreshButton: true,
            refreshButtonClass: 'fa fa-refresh',
            labelError: 'Sorry but there was a error:',
            labelUpdated: 'Last Update:',
            labelRefresh: 'Refresh',
            labelDelete: 'Delete widget:',
            afterLoad: function () {
            },
            rtl: false, // best not to toggle this!
            onChange: function () {

            },
            onSave: function () {

            },
            ajaxnav: $.navAsAjax // declears how the localstorage should be saved (HTML or AJAX Version)

        });

    }

}
/*
 * SETUP DESKTOP WIDGET
 */
function setup_widgets_mobile() {

    if (enableMobileWidgets && enableJarvisWidgets) {
        setup_widgets_desktop();
    }

}
/* ~ END: INITIALIZE JARVIS WIDGETS */


/*
 * LOAD SCRIPTS
 * Usage:
 * Define function = myPrettyCode ()...
 * loadScript("js/my_lovely_script.js", myPrettyCode);
 */

function loadScript(scriptName, callback) {

    if (!jsArray[scriptName]) {
        var promise = jQuery.Deferred();

        // adding the script tag to the head as suggested before
        var body = document.getElementsByTagName('body')[0],
            script = document.createElement('script');
        script.type = 'text/javascript';
        script.src = scriptName;

        // then bind the event to the callback function
        // there are several events for cross browser compatibility
        script.onload = function () {
            promise.resolve();
        };

        // fire the loading
        body.appendChild(script);

        // clear DOM reference
        //body = null;
        //script = null;

        jsArray[scriptName] = promise.promise();

    } else if (debugState)
        root.root.console.log("This script was already loaded %c: " + scriptName, debugStyle_warning);

    jsArray[scriptName].then(function () {
        if (typeof callback === 'function')
            callback();
    });
}

/* ~ END: LOAD SCRIPTS */


/*
 * PAGE SETUP
 * Description: fire certain scripts that run through the page
 * to check for form elements, tooltip activation, popovers, etc...
 */
function pageSetUp() {
    //debugger;
    if (thisDevice === "desktop") {
        // is desktop

        // activate tooltips
        $("[rel=tooltip], [data-rel=tooltip]").tooltip();

        // activate popovers
        $("[rel=popover], [data-rel=popover]").popover();

        // activate popovers with hover states
        $("[rel=popover-hover], [data-rel=popover-hover]").popover({
            trigger: "hover"
        });

        // setup widgets
        setup_widgets_desktop();

        // activate inline charts
        runAllCharts();

        // run form elements
        runAllForms();

    } else {

        // is mobile

        // activate popovers
        $("[rel=popover], [data-rel=popover]").popover();

        // activate popovers with hover states
        $("[rel=popover-hover], [data-rel=popover-hover]").popover({
            trigger: "hover"
        });

        // activate inline charts
        runAllCharts();

        // setup widgets
        setup_widgets_mobile();

        // run form elements
        runAllForms();

    }

}
/* ~ END: PAGE SETUP */

/*
 * ONE POP OVER THEORY
 * Keep only 1 active popover per trigger - also check and hide active popover if user clicks on document
 */
$('body').on('click', function (e) {
    $('[rel="popover"], [data-rel="popover"]').each(function () {
        //the 'is' for buttons that trigger popups
        //the 'has' for icons within a button that triggers a popup
        if (!$(this).is(e.target) && $(this).has(e.target).length === 0 && $('.popover').has(e.target).length === 0) {
            $(this).popover('hide');
        }
    });
});
/* ~ END: ONE POP OVER THEORY */

/*
 * DELETE MODEL DATA ON HIDDEN
 * Clears the model data once it is hidden, this way you do not create duplicated data on multiple modals
 */
$('body').on('hidden.bs.modal', '.modal', function () {
    $(this).removeData('bs.modal');
});
/* ~ END: DELETE MODEL DATA ON HIDDEN */

/*
 * HELPFUL FUNCTIONS
 * We have included some functions below that can be resued on various occasions
 * 
 * Get param value
 * example: alert( getParam( 'param' ) );
 */
function getParam(name) {
    name = name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
    var regexS = "[\\?&]" + name + "=([^&#]*)";
    var regex = new RegExp(regexS);
    var results = regex.exec(window.location.href);
    if (results == null)
        return "";
    else
        return results[1];
}
/* ~ END: HELPFUL FUNCTIONS */