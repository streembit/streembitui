function fixHeader(){
    $('#smart-fixed-header').is(":checked") ? $("body").addClass("fixed-header") : ($('input[type="checkbox"]#smart-fixed-ribbon').prop("checked", !1),
    $('input[type="checkbox"]#smart-fixed-navigation').prop("checked", !1),
    $("body").removeClass("fixed-header"),
    $("body").removeClass("fixed-navigation"),
    $("body").removeClass("fixed-ribbon"))
}
function fixNavigation(){
	$('#smart-fixed-navigation').is(":checked") ? ($('input[type="checkbox"]#smart-fixed-header').prop("checked", !0),
    $("body").addClass("fixed-header fixed-navigation"),
    $('input[type="checkbox"]#smart-fixed-container').prop("checked", !1),
    $("body").removeClass("container")) : ($('input[type="checkbox"]#smart-fixed-ribbon').prop("checked", !1),
    $("body").removeClass("fixed-navigation"),
    $("body").removeClass("fixed-ribbon"))
}
function fixRibbon(){
	$('#smart-fixed-ribbon').is(":checked") ? ($('input[type="checkbox"]#smart-fixed-header').prop("checked", !0),
    $('input[type="checkbox"]#smart-fixed-navigation').prop("checked", !0),
    $('input[type="checkbox"]#smart-fixed-ribbon').prop("checked", !0),
    $("body").addClass("fixed-header"),
    $("body").addClass("fixed-navigation"),
    $("body").addClass("fixed-ribbon"),
    $('input[type="checkbox"]#smart-fixed-container').prop("checked", !1),
    $("body").removeClass("container")) : $("body").removeClass("fixed-ribbon")
}
function fixFooter(){
	$('#smart-fixed-footer').is(":checked") ? $("body").addClass("fixed-page-footer") : $("body").removeClass("fixed-page-footer")
}
function smartRtl(){
	$('#smart-rtl').is(":checked") ? $("body").addClass("smart-rtl") : $("body").removeClass("smart-rtl")
}
function fixContainer(){
	$('#smart-fixed-container').is(":checked") ? ($("body").addClass("container"),
    $('input[type="checkbox"]#smart-fixed-ribbon').prop("checked", !1),
    $("body").removeClass("fixed-ribbon"),
    $('input[type="checkbox"]#smart-fixed-navigation').prop("checked", !1),
    $("body").removeClass("fixed-navigation")) : $("body").removeClass("container")
}
function smartTopMenu(){
	$('#smart-topmenu').is(":checked") ? $("body").addClass("menu-on-top") : $("body").removeClass("menu-on-top");
	
}
function colorblind(){
	$('#colorblind').is(":checked") ? $("body").addClass("colorblind-friendly") : $("body").removeClass("colorblind-friendly")
}
function smartStyles(){
    $("body").removeClassPrefix("smart-style");
    $("html").removeClassPrefix("smart-style");
    $("#smart-styles > a #skin-checked").remove();
    var aObj = $('#smart-styles > a.active');
    if(aObj){
    	$('body').addClass(aObj.attr("id"));
    	$('html').addClass(aObj.attr("id"));
    	aObj.prepend("<i class='fa fa-check fa-fw' id='skin-checked'></i>");
    }
}