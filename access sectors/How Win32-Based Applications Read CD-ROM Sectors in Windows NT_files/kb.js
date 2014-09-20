if (window.addEventListener) {
    var kb_AddEvent = function (el, strEvent, funcPtr) { el.addEventListener(strEvent, funcPtr, false); }
}
else if (window.attachEvent) {
    var kb_AddEvent = function (el, strEvent, funcPtr) { el.attachEvent('on' + strEvent, funcPtr); }
}

function kbSrcEl(e) {
    if (e.srcElement) {
        return e.srcElement;
    }

    if (e.target) {
        return e.target;
    }

    return e;
}

/*KB TOC*/
var tocLinkCount = 0;
var kbHeadings = new Array();

function passesTypeFilter(type) {
    type = type.toLowerCase();
    eval("var p = (" + sectionFilter + ");");
    return p;
}

function getInnerText(n) {
    if (n.nodeType == 3) return n.nodeValue;
    else {
        var txt = "";
        for (var i = 0; i < n.childNodes.length; i++) txt += getInnerText(n.childNodes[i]);
        return txt;
    }
}

function tocScrollTo(e) {
    ExpandSection(e.scrollNode);
    e.scrollNode.scrollIntoView(true);
    return false;
}

function makeTOCNode(HNode, depth) {
    var n = document.createElement("li");

    var t = getInnerText(HNode);
    n.innerHTML = "<a href=\"#\" onclick=\"return tocScrollTo(this);\"><img src=\"" + tocArrow + "\" alt=\"\" /><span class=\"tocTxt\">" + t + "</span></a><ul class=\"tocLine\"></ul>";
    n.childNodes[0].scrollNode = HNode;

    n.depth = depth;
    HNode.tocElement = n;

    return n;
}

function findParentTOCNode() {
    var h = kbHeadings;
    var d = h[h.length - 1].tocElement.depth;
    for (var j = h.length - 2; j > -1; j--) {
        var jd = h[j].tocElement.depth;
        if (jd < d) return h[j];
    }
}

function enforceHeadingMaximums(p) {
    if (p.tocElement.depth + 1 > 2) {
        eval("var max = depth" + (p.tocElement.depth + 1) + "Limit");
        var l = p.tocElement.childNodes[1].childNodes.length;
        if (l > max) {
            p.tocElement.childNodes[1].style.display = "none";
            tocLinkCount -= l;
        }
    }
}

var kbitemarr = [];
var loadTOCNode = function (depth, type) {
    var e = getLatestElement();

    try {
        if (!sectionFilter) {
            return false;
        }
    }
    catch (ex) {
        return false;
    }

    if (passesTypeFilter(type) && depth <= depthLimit) {
        kbHeadings.push(e);
        var c = makeTOCNode(e, depth);
        var p = findParentTOCNode();

        if (p) {
            if (p.tocElement.childNodes[1].style.display != 'none') {
                p.tocElement.childNodes[1].appendChild(c);
                enforceHeadingMaximums(p);
                tocLinkCount++;
            }
        } else {
            kbitemarr.push(c);
            tocLinkCount++;
        }
    }
}

var kb_tocLoad = function () {
    var kbTOCdiv = $("#tocDiv").get(0);
    if (!kbTOCdiv) {
        return false;
    }

    var kbTOC = document.createElement('ul');
    kbTOCdiv.appendChild(kbTOC);

    for (var i = 0; i < kbitemarr.length; i++) {
        kbTOC.appendChild(kbitemarr[i]);
    }

    if (tocLinkCount > tocEntryMinimum) kbTOC.style.display = "block";
    else kbTOC.style.display = "none";
}
kb_AddEvent(window, 'load', kb_tocLoad);

function getLatestElement() {
    var e = document.body;
    while (e.lastChild) e = e.lastChild;
    while (!e.tagName) e = e.parentNode;
    return e.previousSibling;
}
/* END KB TOC */

/*KB Light Box*/
kb_AddEvent(window, 'load', kb_lightBoxLoad);
function kb_lightBoxLoad() {
    var lb = document.getElementById("lb");
    if (!lb) {
        return;
    }
    //don't pop-up light box when fr=1
    var arr = location.search.match(new RegExp("[\?\&]fr=1(\&?)", "i"));
    if (arr != null) {
        return;
    }
    window.scrollTo(0, 0);
    document.body.setAttribute("scroll", "no");
    $("html").css("overflow", "hidden");
    //get client width and height.
    var cWidth = document.body.clientWidth;
    var cHeight = document.body.clientHeight - 1;

    if ($.browser.msie) {
        var isIE6 = $.browser.msie && /MSIE 6.0/.test(navigator.userAgent);
        //IE6 need an iframe to fix the select element promblem
        if (isIE6) {
            // IE issues: 'about:blank' fails on HTTPS and javascript:false is s-l-o-w
            // (hat tip to Jorge H. N. de Vasconcelos)
            iframeSrc = /^https/i.test(window.location.href || '') ? 'javascript:false' : 'about:blank';
            var frameObj = $('<iframe id="MaskFrame" style="z-index:1899;display:block;border:none;margin:0;padding:0;position:absolute;top:0;left:0" src="' + iframeSrc + '"></iframe>');
            frameObj.css('opacity', 0.0);
            frameObj.css('width', cWidth);
            frameObj.css('height', cHeight);
            document.body.appendChild(frameObj[0]);
        }
    }

    var maskObj = document.createElement("div");
    maskObj.setAttribute('id', 'BigDiv');
    maskObj.className = "MaskDiv";
    document.body.appendChild(maskObj);

    SetLightBoxPosition();
    lb.style.display = "block";
    document.body.appendChild(lb);

    pageBlockEls = $(':input:enabled:visible', lb).add('#lb a:enabled:visible');
    BindLBEvent(true);
    setTimeout(function () { $("#lbBtn").focus(); }, 50);
    //as some browsers will return to previous page and scroll to the perticular position where the user were before when user clicks Back button
    window.onscroll = function () {
        if (lb.style.display == 'block') {
            window.scrollTo(0, 0);
        }
    }
}
var pageBlockEls;
function BindLBEvent(isBind) {
    var events = 'keydown keypress';
    if (isBind) {
        $(window).bind('resize.LB', ResizeLBMaskLayer);
        $(window).bind('resize.LB', SetLightBoxPosition);
        $(document).bind(events, LBKeyHandler);
    }
    else {
        $(window).unbind('resize.LB');
        $(document).unbind(events, LBKeyHandler);
    }
}

function LBKeyHandler(e) {
    if (e.keyCode && e.keyCode == 9) {
        if ($(e.target).parents('#lb').length == 0) {
            focus();
            return false;
        }
        var els = pageBlockEls;

        var fwd = !e.shiftKey && e.target == els[els.length - 1];
        var back = e.shiftKey && e.target == els[0];
        if (fwd || back) {
            setTimeout(function () { focus(back) }, 10);
            return false;
        }
    }
    return true;
}
function focus(back) {
    if (!pageBlockEls)
        return;
    var e = pageBlockEls[back === true ? pageBlockEls.length - 1 : 0];
    if (e)
        e.focus();
};

function SetLightBoxPosition() {

    var lb = document.getElementById("lb");
    if (!lb)
        return;
    var lbWidth = $(lb).width();
    var lbHeight = $(lb).height();

    lbWidth = parseInt(lbWidth);
    lbHeight = parseInt(lbHeight);

    var width = pageWidth();
    var height = pageHeight();

    var lbTopPosition, lbLeftPosition;
    lbTopPosition = (height / 2) - (lbHeight / 2);
    lbLeftPosition = (width / 2) - (lbWidth / 2);
    lb.style.left = lbLeftPosition + "px";
    lb.style.top = lbTopPosition + "px";
}

function ResizeLBMaskLayer() {

    var cWidth = document.body.clientWidth;
    var cHeight = document.body.clientHeight - 1;

    //for ie6 only
    var frameObj = document.getElementById("MaskFrame");
    if (frameObj != null) {
        frameObj.style.width = cWidth;
        frameObj.style.height = cHeight;
    }
}

function pageWidth() {
    return window.innerWidth != null ? window.innerWidth : document.documentElement && document.documentElement.clientWidth ? document.documentElement.clientWidth : document.body != null ? document.body.clientWidth : null;
}

function pageHeight() {
    return window.innerHeight != null ? window.innerHeight : document.documentElement && document.documentElement.clientHeight ? document.documentElement.clientHeight : document.body != null ? document.body.clientHeight : null;
}

function CloseLightBox(obj) {
    if (obj)
        StatsDotNet.flexValue9 = obj.id;
    StatsDotNet.AddActiveTime(new Date());
    StatsDotNet.FocusHandler();
    StatsDotNet.flexValue6 = 0;
    StatsDotNet.lightboxCloseTime = new Date();
    var lightBox = document.getElementById("lb");
    lightBox.style.display = "none";
    var maskObj = document.getElementById("BigDiv");
    maskObj.style.display = "none";

    var frameObj = document.getElementById("MaskFrame");
    if (frameObj != null) {
        frameObj.style.display = "none";
    }

    document.body.removeAttribute("scroll");
    $("html").css("overflow", "");
    

    //remove events of light box 
    BindLBEvent(false)

}

function saveSession2Cookie() {
    var gsfxcookie = fetchcookieval("GsfxSessionCookie");
    var matsrun_sessionid = gsfxcookie + "_" + StatsDotNet.eventSeqNo + "_LB";
    setcookieval("matsrun_sessionid", matsrun_sessionid, null, false);
}

function LogPopupLink(id) {
    StatsDotNet.flexValue7 |= id;
}
/*END KB Light Box*/

/*minirouter collapse and expand*/
var MiniRouter_toggle = function (e) {
    var obj = kbSrcEl(e);
    while (obj && obj.nodeName !== 'H3') {
        obj = obj.parentNode;
    }
    if (!obj)
        return;
    obj = obj.getElementsByTagName('div')[0]
    if (obj.className.match(/( ?|^)MR_down\b/gi)) {
        obj.className = jQuery.trim(obj.className.replace(/( ?|^)MR_down\b/gi, 'MR_up'));
        obj.parentNode.nextSibling.style.display = "block";
        var objcookiename = 'Expand' + obj.parentNode.nextSibling.id.replace(/( ?|^)_MR\b/gi, '');
        setcookieval(objcookiename, "true", null, true);
    }
    else if (obj.className.match(/( ?|^)MR_up\b/gi)) {
        obj.className = jQuery.trim(obj.className.replace(/( ?|^)MR_up\b/gi, 'MR_down'));
        obj.parentNode.nextSibling.style.display = "none";
        var objcookiename = 'Expand' + obj.parentNode.nextSibling.id.replace(/( ?|^)_MR\b/gi, '');
        setcookieval(objcookiename, "false", null, true);

    }
}
var MiniRouter_load = function () {

    var mrlst = $('#MiniRouter h3');
    if (mrlst.length == 0) {
        return;
    }
    for (var i = 0; i < mrlst.length; i++) {
        kb_AddEvent(mrlst[i], 'click', MiniRouter_toggle);
    }
    var osscookieval = fetchcookieval("ExpandOSS");
    var communitycookieval = fetchcookieval("ExpandCommunity");
    var gethelpcookieval = fetchcookieval("ExpandGetHelp");
    if (osscookieval == null) {
        setcookieval("ExpandOSS", "false", null, true);
        MiniRouter_collapse('OSS_MR');
    }
    else if (osscookieval == 'false') {
        MiniRouter_collapse('OSS_MR');
    }
    if (communitycookieval == null) {
        setcookieval("ExpandCommunity", "false", null, true);
        MiniRouter_collapse('Community_MR');
    }
    else if (communitycookieval == 'false') {
        MiniRouter_collapse('Community_MR');
    }
    if (gethelpcookieval == null) {
        setcookieval("ExpandGetHelp", "false", null, true);
        MiniRouter_collapse('GetHelp_MR');
    }
    else if (gethelpcookieval == 'false') {
        MiniRouter_collapse('GetHelp_MR');
    }
    removeheadbackground();

}
function MiniRouter_collapse(id) {
    var obj = document.getElementById(id);
    obj.style.display = "none";
    obj.previousSibling.childNodes[1].className = "MR_down";
}
function removeheadbackground() {
    var lst = $('#thinColumn h3');
    try {
        for (var i = 0; i < lst.length; i++) {
            if (lst[i].innerHTML.match(/( ?|^)linkConTop\b/gi)) {
                lst[i].style.background = "none";
                lst[i].removeChild(lst[i].getElementsByTagName('span')[1]);
                lst[i].innerHTML = lst[i].innerHTML.replace('linkCon', 'MRlinkCon');
            }
        }
    }
    catch (e)
    { }
}
kb_AddEvent(window, 'load', MiniRouter_load);
/*end minirouter*/



function HideSysTip() {

    var kbwarningobj = $('#kb_warning_divider').get(0);
    if (!kbwarningobj)
        return;
    kbwarningobj.style.display = 'none';
}

var kb_tabsover = function (event) {
    var e = kbSrcEl(event);
    while (e && e.nodeName !== 'H2') {
        e = e.parentNode;
    }

    if (!e) {
        return false;
    }

    e.className += ' kb_tabs_hover';
}

var kb_tabsout = function (event) {
    var e = kbSrcEl(event);
    while (e && e.nodeName !== 'H2') {
        e = e.parentNode;
    }

    if (!e) {
        return false;
    }

    e.className = jQuery.trim(e.className.replace(/( ?|^)kb_tabs_hover\b/gi, ''));
}

var kb_tabtoggle = function (event) {
    var e = kbSrcEl(event);
    while (e && e.nodeName !== 'H2') {
        e = e.parentNode;
    }

    if (!e) {
        return false;
    }

    kb_toggleclass(e);

    var parel = e.parentNode;
    var nodefound = false;
    for (var i = 0; i < parel.childNodes.length; i++) {
        if (parel.childNodes[i] == e) {
            nodefound = true;
        }

        if (nodefound) {
            if (parel.childNodes[i].className.match(/( ?|^)sbody\b/gi)) {
                kb_toggleclass(parel.childNodes[i]);
                break;
            }
        }
    }
}

function kb_toggleclass(e) {
    if (e.className.match(/( ?|^)kb_tabs_toggle_open\b/gi)) {
        e.className = jQuery.trim(e.className.replace(/( ?|^)kb_tabs_toggle_open\b/gi, ' kb_tabs_toggle_closed'));
        if (e.id == "tocDiv") {
            e.style.display = "none";
        }

        if (e.className.match(/( ?|^)subtitle\b/gi)) {
            kb_toggleSectionPreview(e, "sectionpreview_closed", "sectionpreview_open");
            kb_fixSectionPreview(e);
        }
    }
    else if (e.className.match(/( ?|^)kb_tabs_toggle_closed\b/gi)) {
        e.className = jQuery.trim(e.className.replace(/( ?|^)kb_tabs_toggle_closed\b/gi, ' kb_tabs_toggle_open'));
        if (e.id == "tocDiv") {
            e.style.display = "block";
        }

        if (e.className.match(/( ?|^)subtitle\b/gi)) {
            kb_toggleSectionPreview(e, "sectionpreview_open", "sectionpreview_closed");
        }
    }
    else {
        e.className += ' kb_tabs_toggle_closed';
        if (e.id == "tocDiv") {
            e.style.display = "none";
        }

        if (e.className.match(/( ?|^)subtitle\b/gi)) {
            kb_toggleSectionPreview(e, "sectionpreview_closed", "sectionpreview_open");
            kb_fixSectionPreview(e);
        }
    }
}

function kb_fixSectionPreview(e) {
    var test = e.getAttribute('previewfixed');
    if (test) {
        return;
    }

    var preview, txt;
    for (var i = 0; i < e.childNodes.length; i++) {
        if (e.childNodes[i].className.match(/sectionpreview_open\b/gi)) {
            preview = e.childNodes[i];
            break;
        }
    }

    var lrwid;
    if ($(document.body).css('direction') == 'rtl') {
        lrwid = parseInt($(preview).css('right'), 10)
    }
    else {
        lrwid = parseInt($(preview).css('left'), 10)
    }

    pWid = preview.offsetWidth + lrwid;
    //we are relywing on the ellipsis already being added to the end of the preview text here
    if (pWid > e.offsetWidth) {
        if (preview.innerText) {
            txt = jQuery.trim(preview.innerText.substring(0, preview.innerText.length - 3));
        }
        else if (preview.textContent) {
            txt = jQuery.trim(preview.textContent.substring(0, preview.textContent.length - 3));
        }
        else {
            txt = preview.innerHTML.substring(0, preview.innerHTML.length - 3).trim();
        }

        while (pWid > e.offsetWidth) {
            txt = txt.substring(0, txt.length - 1);
            preview.innerHTML = txt;
            pWid = preview.offsetWidth + lrwid;
        }

        txt = txt.substring(0, txt.length - 3);
        txt += '...';
        preview.innerHTML = txt;
    }

    e.setAttribute('previewfixed', 'true');
}

function ExpandSection(e) {
    if (e.className.match(/( ?|^)subTitle\b/gi) && e.className.match(/( ?|^)kb_tabs_toggle_closed\b/gi)) {
        kb_toggleclass(e);
        kb_toggleclass(e.nextSibling.nextSibling);
        return;
    }

    if (e.id == 'tocHeadRef') {
        var t = true;
        while (t) {
            e = e.parentNode;

            if (e.className && e.className.match(/sbody\b/gi)) {
                break;
            }
           
            $(e).show();

            if (!e.parentNode) {
                return;
            }
        }
    }

    if (e.className.match(/( ?|^)kb_tabs_toggle_closed\b/gi)) {
        kb_toggleclass(e);
        kb_toggleclass(e.previousSibling.previousSibling);
    }
}

function kb_toggleSectionPreview(e, originalclass, replaceclass) {
    var patt1 = new RegExp(originalclass, "gi");
    for (i = 0; i < e.childNodes.length; i++) {
        if (e.childNodes[i].className.match(patt1)) {
            e.childNodes[i].className = jQuery.trim(e.childNodes[i].className.replace(patt1, replaceclass));
        }
    }
}

function kb_getSectionPreviewText(e) {
    var txt = "";
    var tmpnode;
    var parel = e.parentNode.parentNode;
    var nodefound = false;
    var isInnerText = !(document.body.textContent);

    //*NOTE* the syntax makes the coloring funky in VS, but it is valid and correct.                
    var regex = /(<script|<div class=('|")?(topofpage|kb_graphictop|kb_tabletop)).*?(\/div>|\/script>)/igm;

    for (var i = 0; i < parel.childNodes.length; i++) {
        if (parel.childNodes[i] == e.parentNode) {
            nodefound = true;
        }

        if (nodefound) {
            if (parel.childNodes[i].className.match(/( ?|^)sbody\b/gi)) {
                if (parel.childNodes[i].id == "tocDiv") {
                    return;
                }

                tmpnode = parel.childNodes[i].cloneNode(true);

                //regular expression to replace \t \n and extra space within the text
                tmpnode.innerHTML = tmpnode.innerHTML.replace(/\s+/g, ' ');

                //replace top of page link, and graphic and table items
                tmpnode.innerHTML = tmpnode.innerHTML.replace(regex, ' ');

                //remove all html tags
                tmpnode.innerHTML = tmpnode.innerHTML.replace(/<[^>]*>/g, '');

                if (tmpnode.innerText) {
                    txt = jQuery.trim(tmpnode.innerText.substring(0, 80));
                }
                else if (tmpnode.textContent) {
                    txt = jQuery.trim(tmpnode.textContent.substring(0, 80));
                }
                else {
                    txt = jQuery.trim(tmpnode.innerHTML.substring(0, 80));
                }

                if (txt != "") {
                    if (txt.length > 60) {
                        txt = txt + "...";
                    }
                }

                break;
            }
        }
    }

    if (isInnerText) {
        e.innerText = txt;
    }
    else {
        e.textContent = txt;
    }
}

var kb_ExpandCollapseall = function (event) {
    var e = kbSrcEl(event);

    if (!e) {
        return false;
    }

    var section = $('#kb_section').get(0);

    if (!section) {
        return false;
    }

    for (var i = 0; i < section.childNodes.length; i++) {
        var bool1, bool2, bool3;
        bool1 = section.childNodes[i].className.match(/( ?|^)subTitle\b/gi);
        bool2 = section.childNodes[i].className.match(/( ?|^)sbody\b/gi);
        bool3 = section.childNodes[i].className.match(/( ?|^)norollup\b/gi);

        if ((bool1 || bool2) && !bool3 && section.childNodes[i].id != "tocTitle" && section.childNodes[i].id != "tocDiv") {
            if (e.className.match(/( ?|^)expandalltext\b/gi)) {
                kb_Expandall(section.childNodes[i]);
                if (bool1) {
                    kb_toggleSectionPreview(section.childNodes[i], "sectionpreview_open", "sectionpreview_closed");
                }
            }
            else if (e.className.match(/( ?|^)collapsealltext\b/gi)) {
                kb_Collapseall(section.childNodes[i]);
                if (bool1) {
                    kb_toggleSectionPreview(section.childNodes[i], "sectionpreview_closed", "sectionpreview_open");
                    kb_fixSectionPreview(section.childNodes[i]);
                }
            }
        }
    }
}

function kb_Collapseall(e) {
    if ((e.id == "tocTitle") || e.id == "tocDiv") {
        return;
    }

    if (e.className.match(/( ?|^)kb_tabs_toggle_open\b/gi)) {
        e.className = jQuery.trim(e.className.replace(/( ?|^)kb_tabs_toggle_open\b/gi, ' kb_tabs_toggle_closed'));
    }
    else {
        e.className += ' kb_tabs_toggle_closed';
    }
}

function kb_Expandall(e) {
    if ((e.id == "tocTitle") || e.id == "tocDiv") {
        return;
    }

    if (e.className.match(/( ?|^)kb_tabs_toggle_closed\b/gi)) {
        e.className = jQuery.trim(e.className.replace(/( ?|^)kb_tabs_toggle_closed\b/gi, ' kb_tabs_toggle_open'));
    }
    else {
        e.className += ' kb_tabs_toggle_open';
    }
}

var kb_page_object = new kb_object();
var kb_onload = function () {
    var kbsection = $('#kb').get(0);
    if (!kbsection) {
        return false;
    }

    var h2s = $('#kb h2');

    var kbtoggle = document.createElement('div');
    kbtoggle.className = 'kb_tabs_toggle kb_tabs_toggle_open';

    var showexpandcollapseall = false;
    var h2link;
    for (var i = 0; i < h2s.length; i++) {
        if (h2s[i].className.match(/( ?|^)subTitle\b/gi)) {
            kb_AddEvent(h2s[i], 'mouseover', kb_tabsover);
            kb_AddEvent(h2s[i], 'mouseout', kb_tabsout);

            h2link = h2s[i].getElementsByTagName('a');
            for (var j = 0; j < h2link.length; j++) {
                kb_AddEvent(h2link[j], 'focus', kb_tabsover);
                kb_AddEvent(h2link[j], 'blur', kb_tabsout);
            }

            kb_AddEvent(h2s[i], 'click', kb_tabtoggle);

            h2s[i].insertBefore(kbtoggle.cloneNode(true), h2s[i].childNodes[0]);

            if (h2s[i].id != 'tocTitle') {
                showexpandcollapseall = true;
            }
        }
    }

    var expand = $('#kb_expandcollapseall').get(0);
    if (expand && showexpandcollapseall) {
        expand.className = jQuery.trim(expand.className.replace(/( ?|^)expandcollapseall\b/gi, 'expandcollapseall_open'));
        kb_AddEvent(expand.childNodes[0], 'click', kb_ExpandCollapseall);
        kb_AddEvent(expand.childNodes[2], 'click', kb_ExpandCollapseall);
    }

    kb_page_object.start(kbsection);

    ShowAppliesToToggle();
};
kb_AddEvent(window, 'load', kb_onload);

function ShowAppliesToToggle() {
    var toggle = document.createElement('a');
    toggle.href = "javascript:void(0);";
    toggle.className = 'kb_appliesTo_toggle kb_appliesTo_toggle_closed';
    var appliesTo = $("div.appliesTo > h5");
    appliesTo.prepend(toggle);
    appliesTo.css("cursor", "pointer");
    CollapseAppliesToList();
    $("div.appliesTo > h5").bind("click.AppliesTo", ToggleAppliesTo);
}
function ToggleAppliesTo() {
    var toggle = $("div.appliesTo > h5 > a");
    if (toggle.attr("class") == 'kb_appliesTo_toggle kb_appliesTo_toggle_opened') {
        CollapseAppliesToList();
        toggle.attr("class", "kb_appliesTo_toggle kb_appliesTo_toggle_closed");
    }
    else {
        ExpandAppliesToList();
        toggle.attr("class", "kb_appliesTo_toggle kb_appliesTo_toggle_opened");
    }
    MS_HandleClick(toggle.get(0), '20101015', true);
}
function ExpandAppliesToList() {
    $("div.appliesTo > ul").css("display", "block");
}
function CollapseAppliesToList() {
    $("div.appliesTo > ul").css("display", "none");
}

function kb_object() {
    this.kbitems = new Array();
    this.tablesandimgs = new Array();
    this.kbholder = null;
    this.whitespacesize = 195;
    this.mincontentsize = 431;
    this.lastwssize = this.whitespacesize;
    this.lndir = null;
    this.margin = null;
    this.whitebox = null;
    this.showexpandcollapseall = false;
    this.kb_imageExpandHoverText = null;
    this.kb_use_whitespace_channel = true; // change this to remove the whitespace channel.

    var tobj = this;
    this.nodeclick = function (event) { tobj.GraphicTabletoggle(event); };
    this.mover = function (event) { tobj.whiteboxover(event); };
    this.mout = function (event) { tobj.whiteboxout(event); };
    this.makewhitebox = function () {
        if (!this.kb_imageExpandHoverText) {
            this.kb_imageExpandHoverText = 'Click to expand this image.';
        }

        this.whitebox = document.createElement('div');
        this.whitebox.className = 'kb_whitebox';

        var img = document.createElement('span');
        img.className = 'kb_whitebox_img';

        var span = document.createElement('span');
        span.className = 'kb_whitebox_text';
        //text comes from a variable written by the xslt
        span.innerHTML = this.kb_imageExpandHoverText;

        this.whitebox.appendChild(img);
        this.whitebox.appendChild(span);
    };

    this.whiteboxover = function (ev) {
        var e = kbSrcEl(ev);
        if (!e) {
            return false;
        }

        while (!e.className.match(/kb_outergraphicwrapper\b/gi)) {
            e = e.parentNode;
        }

        if (!e) {
            return false;
        }

        if (e.childNodes[2]) {
            e.childNodes[2].style.display = 'block';
        }
    };

    this.whiteboxout = function (ev) {
        var e = kbSrcEl(ev);
        if (!e) {
            return false;
        }

        while (!e.className.match(/kb_outergraphicwrapper\b/gi)) {
            e = e.parentNode;
        }

        if (!e) {
            return false;
        }

        if (e.childNodes[2]) {
            e.childNodes[2].style.display = 'none';
        }
    };

    this.addwhitebox = function (el) {
        if (!el.style.position) {
            el.style.position = 'relative';
        }

        var newnode = this.whitebox.cloneNode(true);
        newnode.style.top = el.childNodes[0].offsetHeight;
        el.appendChild(newnode);
        kb_AddEvent(el.childNodes[2], 'click', this.nodeclick);
    };

    this.removewhitebox = function (el) {
        el.parentNode.removeChild(el);
    };

    this.resize = function () {
        if (!this.kbitems || this.kbitems.length < 1) {
            return false;
        }

        var x = this.kbholder.offsetWidth;
        if (this.tablesandimgs && this.tablesandimgs.length > 0) {
            var allowResize = null;
            for (var j = 0; j < this.tablesandimgs.length; j++) {
                allowResize = this.tablesandimgs[j].getAttribute('allowResize');
                if (allowResize == false || allowResize == 'false') {
                    return false;
                }
            }

            var tt = parseInt(this.tablesandimgs[0].offsetWidth);
            if (tt > (x - this.lastwssize - 5) || tt < (x - this.lastwssize - 15)) {
                var e = null;
                var pad, mar, tmp;
                for (var i = 0; i < this.tablesandimgs.length; i++) {
                    var newwid = (x - this.lastwssize - 10);
                    e = this.tablesandimgs[i].parentNode;
                    while (!e.className.match(/sbody\b/gi)) {
                        tmp = parseInt($(e).css('paddingLeft'));
                        pad = (isNaN(tmp)) ? 0 : tmp;
                        tmp = parseInt($(e).css('paddingRight'));
                        pad += (isNaN(tmp)) ? 0 : tmp;

                        tmp = parseInt($(e).css('marginLeft'));
                        mar = (isNaN(tmp)) ? 0 : tmp;
                        tmp = parseInt($(e).css('marginRight'));
                        mar += (isNaN(tmp)) ? 0 : tmp;

                        newwid -= (pad + mar);
                        e = e.parentNode;
                    }

                    if (newwid >= 0) {
                        this.tablesandimgs[i].style.width = newwid + 'px';
                        this.tablesandimgs[i].setAttribute('nWidth', newwid);

                        if (this.tablesandimgs[i].className.match(/kb_outergraphicwrapper\b/gi)) {
                            this.tablesandimgs[i].childNodes[1].childNodes[0].width = newwid - 8;
                        }
                    }
                }
            }
        }

        var xd = this.whitespacesize;
        if (x - this.mincontentsize < this.whitespacesize) {
            xd = x - this.mincontentsize;
            xd = (xd < 0) ? 0 : xd;
        }

        //all the items will have the same margin, so we only need to check the first one
        var t = parseInt(this.kbitems[0].style.marginLeft);

        //we want to minimize the amount of times this has to fire off, so we are checking
        //to make sure that we actually need to change anything
        if ((xd < this.whitespacesize || (t < this.whitespacesize && xd == this.whitespacesize)) && this.lastwssize != xd) {
            this.lastwssize = xd;
            var newpos = (xd > 15) ? xd - 15 : 0; //need this because if we try to move it in any smaller increment, all browsers die a death of a bajillion mice nibbles.            
            for (var i = 0; i < this.kbitems.length; i++) {
                this.kbitems[i].style[this.margin] = newpos + 'px';
            }
        }
    };

    this.graphictabletoggleclass = function (e, child, openclassname, closeclassname, childclassname) {
        var lndir = $(document.body).css('direction');
        var margin = (lndir == 'ltr') ? 'marginLeft' : 'marginRight';

        if (e.className.match(new RegExp(openclassname, "gi"))) {
            e.className = jQuery.trim(e.className.replace(openclassname, closeclassname));
            e.setAttribute('allowResize', true);

            e.childNodes[1].childNodes[0].width = parseInt(e.getAttribute('nWidth') - 8);
            e.childNodes[0].style.width = e.childNodes[1].style.width = (parseInt(e.getAttribute('nWidth')) - 6) + 'px';
            e.childNodes[0].style.position = e.childNodes[1].style.position = 'relative';
            e.style.height = e.childNodes[1].style.top = 'auto';
            e.style.borderWidth = '0px 3px 3px';
            e.childNodes[0].style.margin = e.childNodes[1].style.margin = '0px';
            e.style.overflowX = 'auto';
            e.style[margin] = '0px';

            child.childNodes[0].className = jQuery.trim(child.childNodes[0].className.replace(/( ?|^)kb_collapsetext_open\b/gi, 'kb_collapsetext_close'));
            child.childNodes[1].className = jQuery.trim(child.childNodes[1].className.replace(/( ?|^)kb_expandtext_close\b/gi, 'kb_expandtext_open'));
        }
        else {
            e.className = jQuery.trim(e.className.replace(closeclassname, openclassname));
            e.setAttribute('allowResize', false);

            var marginLeft = parseInt($(e.childNodes[1].childNodes[0]).css('marginLeft'), 10);
            var marginRight = parseInt($(e.childNodes[1].childNodes[0]).css('marginRight'), 10);

            marginLeft = (!marginLeft) ? 0 : marginLeft;
            marginRight = (!marginRight) ? 0 : marginRight;

            e.childNodes[1].childNodes[0].width = e.getAttribute('oWidth');
            e.childNodes[0].style.width = e.childNodes[1].style.width = (2 + marginLeft + marginRight + (parseInt(e.getAttribute('oWidth')))) + 'px';
            e.childNodes[0].style.position = e.childNodes[1].style.position = 'absolute';
            e.style.overflowX = 'visible';
            e.style.borderWidth = '0px';
            e.childNodes[0].style.margin = '0px 3px';
            e.childNodes[1].style.margin = '0px 3px';
            e.childNodes[1].style.top = e.childNodes[0].offsetHeight + 'px';
            e.style.height = (e.childNodes[0].offsetHeight + e.childNodes[1].offsetHeight) + 'px';

            var marginPar = e;
            var xtramargin = 0;
            var tval;
            while (!marginPar.className.match(/sbody/ig)) {
                tval = parseInt($(marginPar).css("marginLeft"), 10);
                xtramargin += (isNaN(tval)) ? 0 : tval;
                tval = parseInt($(marginPar).css("marginRight"), 10);
                xtramargin += (isNaN(tval)) ? 0 : tval;
                tval = parseInt($(marginPar).css("paddingLeft"), 10);
                xtramargin += (isNaN(tval)) ? 0 : tval;
                tval = parseInt($(marginPar).css("paddingRight"), 10);
                xtramargin += (isNaN(tval)) ? 0 : tval;

                if (xtramargin > 0) {
                    // trust me, 10 is the magic number per iteration to ensure that things move around (or rather done move around) properly
                    xtramargin += 10;
                }

                if (!marginPar.parentNode) {
                    return false;
                }

                marginPar = marginPar.parentNode;
            }

            var marginmove = parseInt($(marginPar).css(margin));
            var space = $('#kb').get(0).offsetWidth - marginmove - xtramargin;
            var diff = space - parseInt(e.getAttribute('oWidth'));
            if (Math.abs(diff) > marginmove) {
                diff = 0 - marginmove;
            }

            e.style[margin] = diff + 'px';

            child.childNodes[0].className = jQuery.trim(child.childNodes[0].className.replace(/( ?|^)kb_collapsetext_close\b/gi, 'kb_collapsetext_open'));
            child.childNodes[1].className = jQuery.trim(child.childNodes[1].className.replace(/( ?|^)kb_expandtext_open\b/gi, 'kb_expandtext_close'));
        }
    };

    this.GraphicTabletoggle = function (event) {
        var e = kbSrcEl(event);
        if (!e) {
            return false;
        }

        if (e.className.match(/kb_whitebox\b/gi)) {
            e = e.parentNode.childNodes[0];
        }
        else if (e.className.match(/(kb_whitebox_text|kb_whitebox_img)\b/gi)) {
            e = e.parentNode.parentNode.childNodes[0];
        }
        else if (e.nodeName === 'SPAN' || e.nodeName === 'DIV') {
            if (e.className.match(/(kb_collapsetext_background|kb_expandtext_background)\b/gi)) {
                e = e.parentNode;
            }

            e = e.parentNode;
        }
        else if (e.nodeName === 'IMG') {
            e = e.parentNode.parentNode;
        }

        var x = e.parentNode.offsetWidth;
        var owid = e.parentNode.getAttribute('oWidth');
        if (owid < x) {
            return;
        }

        if (e.className.match(/(kb_graphictop_open|kb_graphicwrapper)\b/gi)) {
            this.graphictabletoggleclass(e.parentNode, e, "kb_outergraphicwrapper_open", "kb_outergraphicwrapper_closed", "kb_graphicwrapper");

            //Here we are going to look for the whitebox and remove it if found and kick out
            //if it isnt found, we are going to add it
            var wb = e.parentNode;
            if (wb.childNodes[2] && wb.childNodes[2].className.match(/kb_whitebox\b/gi)) {
                this.removewhitebox(wb.childNodes[2]);
                return true;
            }
            this.addwhitebox(wb);
        }
        else if (e.className.match(/kb_tabletop_open\b/gi)) {
            this.graphictabletoggleclass(e.parentNode, e, "kb_outertablewrapper_open", "kb_outertablewrapper_closed", "kb_tablewrapper");
        }
    };

    this.toggleGraphicTable = function () {
        var divs = $('#kb div');
        var bool1, bool2;
        var t = this;
        var x = this.kbholder.offsetWidth;

        for (var i = 0; i < divs.length; i++) {
            bool1 = divs[i].className.match(/( ?|^)(kb_graphicwrapper|kb_tablewrapper)\b/gi);
            bool2 = divs[i].className.match(/( ?|^)sectionpreview_closed\b/gi);

            if (bool1) {
                var wid = (bool1 == 'kb_tablewrapper') ? divs[i].childNodes[0].offsetWidth : divs[i].childNodes[0].width;
                if ((wid + this.whitespacesize) < x) {
                    divs[i].className = divs[i - 1].className = divs[i].parentNode.className = "kb_nowrapper";
                    divs[i].parentNode.appendChild(divs[i].childNodes[0]);
                }
                else {
                    if (divs[i].clientHeight < divs[i].scrollHeight || divs[i].clientWidth < divs[i].scrollWidth) {
                        divs[i - 1].className += "_open";

                        for (var j = 0; j < divs[i - 1].childNodes.length; j++) {
                            if (divs[i - 1].childNodes[j].className.match(/( ?|^)kb_expandtext\b/gi)) {
                                divs[i - 1].childNodes[j].className = jQuery.trim(divs[i - 1].childNodes[j].className.replace(/( ?|^)kb_expandtext\b/gi, 'kb_expandtext_open'));
                            }

                            kb_AddEvent(divs[i - 1].childNodes[j], 'click', function (event) { t.GraphicTabletoggle(event); });
                        }
                    }
                    else {
                        divs[i].className = divs[i - 1].className = divs[i].parentNode.className = "kb_nowrapper";
                    }
                }
            }

            if (bool2) {
                kb_getSectionPreviewText(divs[i]);
            }
        }
    };

    this.makewhitespace = function () {
        var kb = $('#kb').get(0);
        if (!kb) {
            return;
        }

        this.lndir = $(kb).css('direction');

        if (!this.lndir) {
            this.lndir = 'ltr';
        }

        var section = $('#kb_section').get(0);

        if (!this.kbholder || !this.kb_use_whitespace_channel || !this.lndir || !section) {
            return false;
        }

        this.margin = (this.lndir == 'ltr') ? 'marginLeft' : 'marginRight';
        this.makewhitebox();

        var kbdivs = this.kbholder.getElementsByTagName('div');
        var regres = null;
        for (var i = 0; i < kbdivs.length; i++) {
            if (kbdivs[i].className.match(/(sbody|appliesto|keywords|disclaimer|topofpage)\b/gi)) {
                if (kbdivs[i].parentNode == this.kbholder.childNodes[0] || kbdivs[i].parentNode == section) {
                    this.kbitems.push(kbdivs[i]);
                    kbdivs[i].style[this.margin] = this.whitespacesize + 'px';
                }
            }

            regres = kbdivs[i].className.match(/(kb_outertablewrapper|kb_outergraphicwrapper)\b/gi);
            if (regres) {
                this.tablesandimgs.push(kbdivs[i]);
                if (regres[0] == 'kb_outergraphicwrapper') {
                    kbdivs[i].setAttribute('oWidth', kbdivs[i].childNodes[1].childNodes[0].width);
                }
                else {
                    kbdivs[i].setAttribute('oWidth', kbdivs[i].childNodes[1].childNodes[0].offsetWidth);
                }
            }
        }

        var t = this;
        if (navigator.userAgent.match(/firefox/i)) {
            //FF will not fire the resize event til the resize is done, so we have to use a timer
            setInterval(function (event) { t.resize(); }, 50);
        }
        else {
            this.resize();
            kb_AddEvent(window, 'resize', function (event) { t.resize(); });
        }

        var oWid = 0, nWid = 0;
        for (var i = 0; i < kbdivs.length; i++) {
            nWid = parseInt(kbdivs[i].getAttribute('nWidth'));
            oWid = parseInt(kbdivs[i].getAttribute('oWidth'));

            regres = kbdivs[i].className.match(/kb_outergraphicwrapper|kb_outertablewrapper\b/gi);
            if (regres) {
                if (!nWid) nWid = 1;
                if (nWid && oWid) {
                    // we have to check the widths, because in some circumstances the code is tricked into thinking that it needs to
                    // wrap the images we need to check and make sure that the image has indeed been resized, if not, by checking
                    // to see if the new width (the shrunk val) is not greater than the original width, if so, clean it up, we dont
                    // need the wrapper
                    if (nWid > oWid) {
                        kbdivs[i].removeChild(kbdivs[i].childNodes[0]);
                        kbdivs[i].className = kbdivs[i].childNodes[0].className = 'kb_nowrapper';
                    }
                    else {
                        if (regres[0] == 'kb_outergraphicwrapper') {
                            this.addwhitebox(kbdivs[i]);
                            kb_AddEvent(kbdivs[i], 'mouseover', this.mover);
                            kb_AddEvent(kbdivs[i], 'mouseout', this.mout);
                        }
                    }
                }
            }
        }

        return this;
    };

    this.start = function (kbsection) {
        if (!kbsection) {
            return null;
        }

        this.kbholder = kbsection;

        this.toggleGraphicTable();
        if (this.kb_use_whitespace_channel) {
            this.makewhitespace();
        }

        var el = $('#tocTitle').get(0);
        if (el) {
            kb_tabtoggle(el);
        }
    }
}