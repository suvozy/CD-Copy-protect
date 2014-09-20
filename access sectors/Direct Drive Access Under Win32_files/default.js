function srcEl(e) {
    if (e.srcElement) return e.srcElement;
    if (e.target) return e.target;
    return e;
}

function parseBoolean(string) {
    switch (string.toLowerCase()) {
        case "true": case "yes": case "1": return true;
        case "false": case "no": case "0": case null: return false;
        default: return Boolean(string);
    }
}

function OutputEncoder_EncodeUrl(strInput) {
    if (typeof (strInput) == 'undefined') { return ""; }
    strInput = strInput.toString();
    var c;
    var EncodeUrl = '';
    for (var cnt = 0; cnt < strInput.length; cnt++) {
        c = strInput.charCodeAt(cnt);
        if (((c > 96) && (c < 123)) || ((c > 64) && (c < 91)) || ((c > 47) && (c < 58)) || (c == 46) || (c == 45) || (c == 95)) { EncodeUrl = EncodeUrl + String.fromCharCode(c); }
        else if (c > 127) { EncodeUrl = EncodeUrl + '%u' + OutputEncoder_TwoByteHex(c); }
        else { EncodeUrl = EncodeUrl + '%' + OutputEncoder_SingleByteHex(c); }
    }
    return EncodeUrl;
}

function OutputEncoder_SingleByteHex(charC) {
    var SingleByteHex = charC.toString(16);
    for (var cnt = SingleByteHex.length; cnt < 2; cnt++) { SingleByteHex = "0" + SingleByteHex; }
    return SingleByteHex;
}

function OutputEncoder_TwoByteHex(charC) {
    var TwoByteHex = charC.toString(16);
    for (var cnt = TwoByteHex.length; cnt < 4; cnt++) { TwoByteHex = "0" + TwoByteHex; }
    return TwoByteHex;
}

function MS_QueryString() //NOTE: use lowercase keys to access values
{
    var qs = document.location.search.toString();
    if (qs.length > 0) { qs = qs.substring(1); }
    var pairs = qs.split('&');
    for (var i = 0; i < pairs.length; i++) {
        var pair = pairs[i].split('=');
        if (pair.length != 2) { continue; }
        if (pair[1] == '') { continue; }
        try {
            var key = decodeURIComponent(pair[0]).toLowerCase();
            var value = decodeURIComponent(pair[1]);
        }
        catch (e) {
            var key = unescape(pair[0]).toLowerCase();
            var value = unescape(pair[1]);
        }
        if (this[key]) { this[key] += ',' + value; }
        else { this[key] = value; }
    }
}
var queryString = new MS_QueryString();
function GetModifiedQueryString(key, value) {
    var qsCopy = new Object;
    for (var i in queryString) { qsCopy[i] = queryString[i]; }
    qsCopy[key] = value;
    var strQs = '';
    for (var i in qsCopy) { strQs += OutputEncoder_EncodeUrl(i) + '=' + OutputEncoder_EncodeUrl(qsCopy[i]) + '&'; }
    return '?' + strQs;
}
function UnicodeFixup(s) {
    var result = new String();
    var c = '';
    var i = -1;
    var l = s.length;
    result = '';
    for (i = 0; i < l; i++) {
        c = s.substring(i, i + 1);
        if (c == '%') {
            result += c; i++;
            c = s.substring(i, i + 1);
            if (c != 'u') {
                if (parseInt('0x' + s.substring(i, i + 2)) > 128) { result += 'u00'; }
            }
        }
        /* Product Studio Bug 37129
        This fix is needed to preserve '+' in the input when client-side escaped strings are decoded in server-side code.
        Jscript escape() does not escape a '+' to '%2B'.
        System.Web.HttpUtility.UrlDecode() replaces '+' with a space, but decodes '%2B' just fine.
        Jscript unescape() also decodes '%2B' just fine. */
        else if (c == '+') {
            c = '%2B';
        }
        result += c;
    }
    return result;
}

// Function to check for external links to be opened in the new window.
var g_reSupportedHostnames;
function ForeignLink_Hookup(branding) {
    if (typeof (branding) == 'undefined') { branding = 'true'; }

    var eCurrentAnchor = null;
    for (var i = 0; i < $('a').length; i++) {
        eCurrentAnchor = $('a').get(i);
        //consider only those having a URL protocol prefix
        if (eCurrentAnchor.protocol == 'http:' || eCurrentAnchor.protocol == 'https:') {
            //test to see if foreign
            if (!branding && ((eCurrentAnchor.href.indexOf(document.domain) > -1) || (eCurrentAnchor.href.substring(0, 1) == '/')) && (eCurrentAnchor.href.toLowerCase().indexOf('fr=1') < 0)) {
                var hashSplit = eCurrentAnchor.href.split('#');
                var hashValue = '';
                if (hashSplit.length > 1) {
                    hashValue = '#' + hashSplit[1];
                }

                if (eCurrentAnchor.href.indexOf('?') > -1) { eCurrentAnchor.href = hashSplit[0] + '&FR=1' + hashValue; }
                else { eCurrentAnchor.href = hashSplit[0] + '?FR=1' + hashValue; }

            }
            if (!g_reSupportedHostnames.exec(eCurrentAnchor.hostname) || (!branding && eCurrentAnchor.href.indexOf(document.domain) < 0)) {

                eCurrentAnchor.target = '_blank'; // open in new window when it is off microsoft.com, or if it is not support.microsfot.com and fr=1
            }
        }
    } //for each anchor
    if (!branding) {
        if (document.getElementsByName) {
            var eForms = null;
            for (var i = 0; i < $('form').length; i++) {
                eCurrentForm = $('form').get(i);
                if ((eCurrentForm.action.indexOf(document.domain) > -1) || (eCurrentForm.action.substring(0, 1) == '/')) {
                    if (!eCurrentForm.FR) {
                        $(eCurrentForm).append('<input id="FR" name="FR" value="1" type="hidden" />');
                    }
                }
            }
        }
    }
}
function MS_PageToolsData() {
    this.closeMsg = 'Close';
    this.noCookieUrl = '/gp/nocookies/';
    function getObjectId() {
        var i = 0;
        while (true) {
            if (!eval('window.SaveToFavoritesData' + i)) { return 'SaveToFavoritesData' + i; }
            i++;
        }
    }
    this.id = getObjectId();
    window[this.id] = this;
    this.PrintPage = function () {
        StatsDotNet.eventCollectionId = SetLogCollectionBit(StatsDotNet.eventCollectionId, 2);
        try { window.print(); } catch (e) { }
        return false;
    }
    this.EmailPage = function (el) {
        StatsDotNet.eventCollectionId = SetLogCollectionBit(StatsDotNet.eventCollectionId, 3);
        return true;
    }
}

function MS_StatsDotNet() {
    this.startDate = new Date();
    this.disabled = true;
    this.host = '/LTS/';
    this.scrollUsed = false;
    this.reCleanId = /[^0-9]*/i;
    this.eventCollectionId = 0;
    this.OptionCollectionId = 0;
    this.ContentProperties = '';
    this.refUrl = '';
    this.contentType = '';
    this.contentLn = '';
    this.contentId = '';
    this.ContentCulture = '';
    this.exitContainerId = '';
    this.exitLinkId = '';
    this.platform = '';
    this.activeDwellTime = 0;
    this.activeStartTime = this.startDate;
    this.lightboxCloseTime = null;
    this.suppressBlur = false;
    this.activeElement = null;
    this.timeoutID = -1;
    this.isIE = false;
    this.logExternalUrls = false;    
    var exitval = fetchcookieval('exitinfo');
    if (exitval) {
        var values = exitval.split('|');
        if (values.length == 6) {
            this.rctype = values[0];
            this.rclcid = values[1];
            this.rcid = values[2];
            this.rcculture = values[3];
            this.rexcid = values[4];
            this.rexlid = values[5];

        }
    }

    if (document.referrer && document.referrer != '') { this.refUrl = document.referrer.toString(); }
    this.eventSeqNo = 0;
    this.targetUrl = '';
    this.sessionId = '';
    this.onUnloadTimeout = null;
    this.ltsIdleTimeout = null;
    this.externalUrls = [];
    this.CleanId = function (str) {
        try { return str.replace(this.reCleanId, ''); }
        catch (e) { }
        return '';
    }

    this.AddActiveTime = function (now) {
        if ((StatsDotNet.activeStartTime == null) || (arguments.length == 1 && StatsDotNet.activeElement != document.activeElement && StatsDotNet.isIE)) {
            StatsDotNet.activeElement = document.activeElement;
            return;
        }
        if (StatsDotNet.suppressBlur) {
            return;
        }

        StatsDotNet.activeDwellTime += now.getTime() - StatsDotNet.activeStartTime.getTime();
        if (StatsDotNet.lightboxCloseTime != null) {
            StatsDotNet.flexValue6 += now.getTime() - StatsDotNet.activeStartTime.getTime();
        }

        StatsDotNet.activeStartTime = null;
    }


    this.CheckActivity = function () {
        if (StatsDotNet.activeStartTime != null) {
            StatsDotNet.AddActiveTime(new Date());
        }
    }
    this.ResetDwellTime = function () {
        if (StatsDotNet.timeoutID != -1)
            clearTimeout(StatsDotNet.timeoutID);

        StatsDotNet.timeoutID = setTimeout(StatsDotNet.CheckActivity, StatsDotNet.ltsIdleTimeout);
        if (StatsDotNet.activeStartTime == null)
            StatsDotNet.activeStartTime = new Date();
    }
    this.FocusHandler = function () {
        StatsDotNet.ResetDwellTime();
        if (StatsDotNet.activeStartTime == null && ((document.activeElement != null && StatsDotNet.activeElement == document.activeElement) || !StatsDotNet.isIE)) {
            StatsDotNet.activeStartTime = new Date();
        }
    }
    this.HookLoadEvents = function () {
        StatsDotNet.logExternalUrls = (this.ssId && this.ssId == '1');
        StatsDotNet.isIE = (navigator.appName == "Microsoft Internet Explorer");
        StatsDotNet.activeElement = document.activeElement;
        if (StatsDotNet.isIE) {
            document.onfocusin = StatsDotNet.FocusHandler;
            document.onfocusout = (function (event) { StatsDotNet.AddActiveTime(new Date()); });
        }
        else {
            $(window).focus(StatsDotNet.FocusHandler);
            $(window).blur(function (event) { StatsDotNet.AddActiveTime(new Date()); });
        }
        StatsDotNet.timeoutID = setTimeout(StatsDotNet.CheckActivity, StatsDotNet.ltsIdleTimeout);

        $(document.body).click(StatsDotNet.ResetDwellTime);
        $(document.body).keypress(StatsDotNet.ResetDwellTime);
        $(window).scroll(StatsDotNet.ResetDwellTime);

    }

    this.LogPageOnLoad = function () {
        if (this.enableCollTierParams) {
            this.HookLoadEvents();
        }

        // Check if ACW link is rendered
        if ($("#acwkblink").get(0)) {
            StatsDotNet.OptionCollectionId = SetLogCollectionBit(StatsDotNet.OptionCollectionId, 32);
        }
        if (this.eventSeqNo === 0) {
            this.eventSeqNo = this.GetCookieIncrement();
        }

        if (typeof (window.innerWidth) == 'number') {
            StatsDotNet.browserWidth = window.innerWidth;
            StatsDotNet.browserHeight = window.innerHeight;
        }
        else if (document.documentElement &&
        (document.documentElement.clientWidth || document.documentElement.clientHeight)) {
            StatsDotNet.browserWidth = document.documentElement.clientWidth;
            StatsDotNet.browserHeight = document.documentElement.clientHeight;
        }
        else if (document.body && (document.body.clientWidth || document.body.clientHeight)) {
            StatsDotNet.browserWidth = document.body.clientWidth;
            StatsDotNet.browserHeight = document.body.clientHeight;
        }

        var ltsUrl = this.host + '?';
        if (this.sessionId != '')
            ltsUrl += 'SessionID=' + OutputEncoder_EncodeUrl(this.sessionId) + '&';
        ltsUrl += 'SSID=' + OutputEncoder_EncodeUrl(this.ssId) + '&' +
                'SiteLCID=' + OutputEncoder_EncodeUrl(this.siteLcId) + '&' +
                'EventCollectionID=' + OutputEncoder_EncodeUrl(this.eventCollectionId) + '&' +
                'URL=' + OutputEncoder_EncodeUrl(this.url) + '&' +
                'ContentType=' + OutputEncoder_EncodeUrl(this.contentType) + '&' +
                'ContentLCID=' + OutputEncoder_EncodeUrl(this.contentLn) + '&' +
                'ContentID=' + OutputEncoder_EncodeUrl(this.contentId) + '&' +
                'rctype=' + OutputEncoder_EncodeUrl(this.rctype) + '&' +
                'rclcid=' + OutputEncoder_EncodeUrl(this.rclcid) + '&' +
                'rcid=' + OutputEncoder_EncodeUrl(this.rcid) + '&' +
                'rcculture=' + OutputEncoder_EncodeUrl(this.rcculture) + '&' +
                'rexcid=' + OutputEncoder_EncodeUrl(this.rexcid) + '&' +
                'rexlid=' + OutputEncoder_EncodeUrl(this.rexlid) + '&' +
                'BrowserWidth=' + this.browserWidth + '&' +
                'BrowserHeight=' + this.browserHeight + '&' +
                'BrandID=' + OutputEncoder_EncodeUrl(this.siteBrandId) + '&' +
                'RefURL=' + OutputEncoder_EncodeUrl(this.refUrl) + '&' +
                'OptionCollectionId=' + OutputEncoder_EncodeUrl(this.OptionCollectionId) + '&' +
                'EventSeqNo=' + OutputEncoder_EncodeUrl(this.eventSeqNo) + '&' +
                'SSversion=' + OutputEncoder_EncodeUrl(this.SsVersion) + '&' +
                'SiteCulture=' + OutputEncoder_EncodeUrl(this.SiteCulture) + '&' +
                'Platform=' + OutputEncoder_EncodeUrl(this.platform) + '&' +
                'ContentCulture=' + OutputEncoder_EncodeUrl(this.ContentCulture) + '&' +
                'In404Url=' + OutputEncoder_EncodeUrl(this.In404Url) + '&' +
                'ContentProperties=' + OutputEncoder_EncodeUrl(this.ContentProperties) + '&' +
                'FlexID=' + OutputEncoder_EncodeUrl(this.flexId) + '&' +
                'FlexValue1=' + OutputEncoder_EncodeUrl(this.flexValue1) + '&' +
                'FlexValue2=' + OutputEncoder_EncodeUrl(this.flexValue2) + '&' +
                'FlexValue3=' + OutputEncoder_EncodeUrl(this.flexValue3) + '&' +
                'FlexValue4=' + OutputEncoder_EncodeUrl(this.flexValue4) + '&' +
                'FlexValue5=' + OutputEncoder_EncodeUrl(this.flexValue5);

        if (this.enableCollTierParams) {
            ltsUrl += '&FlexValue6=' + OutputEncoder_EncodeUrl(this.flexValue6) + '&' +
                    'FlexValue7=' + OutputEncoder_EncodeUrl(this.flexValue7) + '&' +
                    'FlexValue8=' + OutputEncoder_EncodeUrl(this.flexValue8) + '&' +
                    'FlexValue9=' + OutputEncoder_EncodeUrl(this.flexValue9) + '&' +
                    'FlexValue10=' + OutputEncoder_EncodeUrl(this.flexValue10);
        }

        if (typeof (varWedcsEnable) == "undefined" || !varWedcsEnable) {
            generateWedcsData();
        }

        $('#StatsDotNetImg').get(0).src = ltsUrl;
    }
    this.LogPageOnUnLoad = function () {
        if (typeof (varWedcsEnable) != "undefined" && varWedcsEnable && typeof (MscomCustomEvent) != "undefined") {
            MscomCustomEvent("ms.activeDwellTime", OutputEncoder_EncodeUrl(this.activeDwellTime));
        }

        if (fetchcookieval('GsfxStatsLog') != 'true')
            return;

        this.endDate = new Date();
        this.dwellTime = this.endDate.getTime() - this.startDate.getTime();
        if (this.scrollUsed) { StatsDotNet.eventCollectionId = SetLogCollectionBit(StatsDotNet.eventCollectionId, 27); }

        if (this.eventSeqNo === 0) {
            this.eventSeqNo = this.GetCookieIncrement();
        }

        srch_setcookieval("exitinfo", this.contentType + "|" + this.contentLn + "|" + this.contentId + "|" + this.ContentCulture + "|" + this.exitContainerId + "|" + this.exitLinkId);

        if (this.enableCollTierParams && this.logExternalUrls) {
            if ((!this.flexId || this.flexId.length == 0) && this.externalUrls.length > 0) {
                this.flexId = "4";
            }
            this.flexValue10 = this.externalUrls.join('|');
        }

        var ltsUrl = this.host + '?';
        if (this.sessionId != '')
            ltsUrl += 'SessionID=' + OutputEncoder_EncodeUrl(this.sessionId) + '&';
        ltsUrl +=
        'SSID=' + OutputEncoder_EncodeUrl(this.ssId) + '&' +
        'SiteLCID=' + OutputEncoder_EncodeUrl(this.siteLcId) + '&' +
        'EventCollectionID=' + OutputEncoder_EncodeUrl(this.eventCollectionId) + '&' +
        'OptionCollectionId=' + OutputEncoder_EncodeUrl(this.OptionCollectionId) + '&' +
        'SSversion=' + OutputEncoder_EncodeUrl(this.SsVersion) + '&' +
        'ContentType=' + OutputEncoder_EncodeUrl(this.contentType) + '&' +
        'ContentLCID=' + OutputEncoder_EncodeUrl(this.contentLn) + '&' +
        'ContentID=' + OutputEncoder_EncodeUrl(this.contentId) + '&' +
        'ExitLinkID=' + this.CleanId(this.exitLinkId) + '&' +
        'ExitContainerID=' + this.CleanId(this.exitContainerId) + '&' +
        'DwellTime=' + OutputEncoder_EncodeUrl(this.dwellTime) + '&' +
        'BrandID=' + OutputEncoder_EncodeUrl(this.siteBrandId) + '&' +
        'SearchCategoryID=' + this.CleanId(this.searchCategoryId + '') + '&' +
        'SearchCategoryLinkPos=' + OutputEncoder_EncodeUrl(this.searchCategoryLinkPos) + '&' +
        'SearchPageLinkPos=' + OutputEncoder_EncodeUrl(this.searchPageLinkPos) + '&' +
        'TargetURL=' + OutputEncoder_EncodeUrl(this.targetUrl) + '&' +
        'EventSeqNo=' + OutputEncoder_EncodeUrl(this.eventSeqNo) + '&' +
        'SiteCulture=' + OutputEncoder_EncodeUrl(this.SiteCulture) + '&' +
        'ContentCulture=' + OutputEncoder_EncodeUrl(this.ContentCulture) + '&' +
        'Platform=' + OutputEncoder_EncodeUrl(this.platform) + '&' +
        'unload=true' + '&' +
        'FlexID=' + OutputEncoder_EncodeUrl(this.flexId) + '&' +
        'FlexValue1=' + OutputEncoder_EncodeUrl(this.flexValue1) + '&' +
        'FlexValue2=' + OutputEncoder_EncodeUrl(this.flexValue2) + '&' +
        'FlexValue3=' + OutputEncoder_EncodeUrl(this.flexValue3) + '&' +
        'FlexValue4=' + OutputEncoder_EncodeUrl(this.flexValue4) + '&' +
        'FlexValue5=' + OutputEncoder_EncodeUrl(this.flexValue5);

        if (this.enableCollTierParams) {
            var lightBox = document.getElementById("lb");
            if (lightBox != null && lightBox.style.display != "none") {
                this.AddActiveTime(this.endDate);
            }
            else {
                this.AddActiveTime(this.endDate, true);
            }
            this.suppressBlur = true;

            ltsUrl +=
            '&ActiveDwellTime=' + OutputEncoder_EncodeUrl(this.activeDwellTime) + '&' +
            'FlexValue6=' + OutputEncoder_EncodeUrl(this.flexValue6) + '&' +
            'FlexValue7=' + OutputEncoder_EncodeUrl(this.flexValue7) + '&' +
            'FlexValue8=' + OutputEncoder_EncodeUrl(this.flexValue8) + '&' +
            'FlexValue9=' + OutputEncoder_EncodeUrl(this.flexValue9) + '&' +
            'FlexValue10=' + OutputEncoder_EncodeUrl(this.flexValue10);
        }

        if (window.exitTabValue) ltsUrl += "&ContentProperties=" + OutputEncoder_EncodeUrl(exitTabID + "=" + exitTabValue + "|");

        $('#StatsDotNetImg').get(0).src = ltsUrl;

        var today = new Date();
        var now = today.getTime();
        while (1) {
            var today2 = new Date();
            var now2 = today2.getTime();
            if ((now2 - now) > this.onUnloadTimeout)
                return;
        }
    }
    this.SetExitLinks = function (e) {
        var El = srcEl(e);
        var elId = null;
        var parentId = null;
        if (!El) { return; }
        if (!El.tagName) { return; }

        if (El.tagName.toUpperCase() != 'A') {
            if (El.parentNode && El.parentNode.tagName && El.parentNode.tagName.toUpperCase() == 'A') {
                El = El.parentNode;
            }
            else {
                return;
            }
        }

        if (!El.href) { return; }
        if (El.href.indexOf('javascript:') > -1) { return; }
        if (El.href.indexOf('mailto:') > -1) { return; }
        if (El.id) {
            this.exitLinkId = El.id;
        }
        else {
            this.exitLinkId = '';
            if (typeof (isResetExitCID) == 'undefined' || isResetExitCID == null) {
                this.exitContainerId = '';
            }
        }
        this.targetUrl = El.href;
        if (this.enableCollTierParams && this.logExternalUrls && El.target && El.target.toUpperCase() == '_BLANK') {
            for (var i = 0; i < this.externalUrls.length; i++) {
                if (this.targetUrl.toLowerCase() == this.externalUrls[i])
                    break;
            }
            if (i >= this.externalUrls.length)
                this.externalUrls.push(this.targetUrl.toLowerCase());
        }

    }
    this.TrackSearch = function (searchCategoryId, searchCategoryLinkPos, searchPageLinkPos) {
        this.searchCategoryId = searchCategoryId;
        this.searchCategoryLinkPos = searchCategoryLinkPos;
        this.searchPageLinkPos = searchPageLinkPos;
    }
    this.GetCookieIncrement = function () {
        var cookieKey = 'sdninc';
        var inc = fetchcookieval(cookieKey);
        if (!inc) { inc = '0'; }
        inc = parseInt(inc);
        inc += 1;
        document.cookie = cookieKey + '=' + inc + '; path=/;';
        return inc;
    }
    this.SetSearchCategoryId = function (assetId) {
        if (!StatsDotNet.disabled)
            this.searchCategoryId = assetId;
    }
    this.eventSeqNo = this.GetCookieIncrement();
}
var StatsDotNet = new MS_StatsDotNet();
var SaveToFavoritesData = new MS_PageToolsData();
SaveToFavoritesData.objStatsDotNet = StatsDotNet;

function MS_HandleClick(el, containerId, recordHit) {
    if (!el.id) el.id = '';
    var id = el.id.replace('_i', '');
    if (recordHit && !StatsDotNet.disabled) {
        StatsDotNet.exitLinkId = id;
        StatsDotNet.exitContainerId = containerId;
    }
    switch (id) {
        case 'PrintPage': return SaveToFavoritesData.PrintPage();
        case 'bil_PrintPage': return SaveToFavoritesData.PrintPage();
        case 'EmailPage': return SaveToFavoritesData.EmailPage(el);
            //        case 'SaveToMySupportFavorites': return SaveToFavoritesData.SaveToFavorites(el);
            //        case 'bil_SaveToMySupportFavorites': return SaveToFavoritesData.SaveToFavorites(el);
            //        case 'MySupportFavoritesLink': return SaveToFavoritesData.GoToFavorites(el);
            //        case 'bil_MySupportFavoritesLink': return SaveToFavoritesData.GoToFavorites(el);
            //        case 'SendFeedback': return SaveToFavoritesData.SendFeedback(el);
            //        case 'bil_SendFeedback': return SaveToFavoritesData.SendFeedback(el);
    }
    if (el.id.indexOf('oas_') == 0) {
        el.href = MS_OASURL + GetModifiedQueryString('gprid', el.id.replace('oas_', ''));
        var pos = el.href.toLowerCase().indexOf("target=assistance");
        if (pos > 0) {
            var end = pos + 17;
            if (el.href.charAt(pos - 1) == '&')
                pos = pos - 1;
            el.href = el.href.substring(0, pos) + el.href.substring(end, el.href.length);
        }
    }
    if (el.href != null) {
        var indexOfPSMore = el.href.indexOf('GSSProdSelMore');
        if (indexOfPSMore > 0) {
            var end = el.href.indexOf('&', indexOfPSMore);
            if (end < 0) end = el.href.length;
            var c1ID = el.href.substring(indexOfPSMore + 14, end);
            el.href = '/select/default.aspx' + GetModifiedQueryString('c1', c1ID);
        }
    }
    return true;
}

function getsearchurl(elem) {
    if (queryString['adv'] == '1') {
        elem.href = elem.href + '&adv=1';
    }
}

function getrssurl(elem) {
    var rindex = elem.href.indexOf('/common/rss.aspx');
    if (rindex > -1) elem.href = elem.href + '&msid=' + mc1;
}

var mc1 = '';
function MS_WebMetrix(sUrl) {
    if (typeof (sUrl) != 'undefined') {

        var cv;

        var p1 = 'guid=';
        var p2 = '&guid=';
        var gl = 32;
        cv = fetchcookieval('MC1');
        if (cv) cv = cv.toLowerCase();
        if (!cv) {
            cv = fetchcookieval('MC2');
            if (cv) cv = cv.toLowerCase();
        }
        if (cv) {
            if (cv.substr(0, p1.length) == p1) { mc1 = cv.substr(p1.length, gl); }
            else if (cv.indexOf(p2) > -1) { mc1 = cv.substr(cv.indexOf(p2) + p2.length, gl); }
        }
        sUrl = sUrl + '&msid=' + mc1;

        $('#webmetriximg').get(0).src = sUrl;
    }
}

function MS_DocumentOnClick(e) {
    if (!StatsDotNet.disabled) { StatsDotNet.SetExitLinks(e); }
}

function MS_WindowOnUnload() {
    if (!StatsDotNet.disabled) { StatsDotNet.LogPageOnUnLoad(); }
}

function MS_WindowOnScroll() {
    StatsDotNet.scrollUsed = true;
    $(document).unbind('scroll', MS_WindowOnScroll);
}

$(window).unload(MS_WindowOnUnload);
$(document).click(MS_DocumentOnClick);
$(document).scroll(MS_WindowOnScroll);

/* search */
function OptionCookie() {
    var opt = fetchcookieval("adopt");
    if (opt && opt.length > 0) {
        var pairs = opt.split('|');
        for (var i = 0; i < pairs.length; i++) {
            var pair = pairs[i].split('=');
            if (pair.length != 2) { continue; }
            if (pair[1] == '') { continue; }

            var key = pair[0];
            var value = pair[1];

            if (this[key]) { this[key] += ', ' + value; }
            else {
                this[key] = value;

            }
        }
    }
}

function InitRadio(elem, name) {
    tval = fetchcookieval("ad" + name);
    if (tval) {
        for (i = 0; i < elem.length; i++) {
            if (elem[i].value == unescape(tval)) {
                elem[i].checked = true;
                elem[i].click();
                break;
            }
        }
    }
}

var links = new Array();
$(document).ready(addPopupHelpEvents);
function addPopupHelpEvents() {
    var j = 0;
    var glinks = $('#contentArea a');
    if (glinks) {
        for (var i = glinks.length - 1; i >= 0; i--) {
            if (glinks[i].className == "custip") {
                links.push(glinks[i]);
                glinks[i].onmouseover = showPopupHelp;
                glinks[i].onmouseout = hidePopupHelp;
                glinks[i].onfocus = showPopupHelp;
                glinks[i].onblur = hidePopupHelp;
            }
        }
    }
}

function showPopupHelp() {
    var obj = $(this).children("span")[0];

    if (obj == null) {
        return;
    }

    var tlr = AbsPos(this);
    var w = obj.offsetWidth;
    var h = obj.offsetHeight + parseInt($(obj).css("paddingTop"), 10) + parseInt($(obj).css("paddingBottom"), 10);
    var str = '';

    var x = $(obj).css("direction");
    if (x === 'rtl') {
        if (tlr.left < w) {
            str += ' showLeft';
            obj.style.right = 'auto';
        }
        else {
            obj.style.right = '20px';
        }
    }
    else {
        if ((w + tlr.left) > $(window).width()) str += ' showRight';
    }

    if ((h + tlr.top) > $(window).height()) str += ' showBottom';
    this.className = "custip show" + str;
}

function hidePopupHelp() {
    var obj = null;
    this.className = "custip";
    if (this.getElementsByTagName("span"))
        obj = this.getElementsByTagName("span")[0];
    else
        return;
    if (obj == null)
        return;
    var x = $(obj).css("direction");
    if (x === 'rtl') obj.style.right = 'auto';
}

//Need this, jquery functions dont work in 
//a non-doctype eviornment for this
function AbsPos(obj) {
    var x = y = 0;
    if (obj.offsetParent) {
        x = obj.offsetLeft;
        y = obj.offsetTop;
        while (obj = obj.offsetParent) {
            x += obj.offsetLeft;
            y += obj.offsetTop;
        }
    }
    return { left: x, top: y };
}

function setKeyBit(e) {
    e = srcEl(e);
    e.keyBit = true;
}

function logSearchUISwitch() {
    StatsDotNet.eventCollectionId = SetLogCollectionBit(StatsDotNet.eventCollectionId, 28);
}

function logRange() {
    StatsDotNet.eventCollectionId = SetLogCollectionBit(StatsDotNet.eventCollectionId, 8);
}

function logOptionId(id) {
    StatsDotNet.OptionCollectionId = SetLogCollectionBit(StatsDotNet.OptionCollectionId, id);
}

//Check if the n'th bit is set in the binary equivalent of the number
function IsLogBitSet(number, flagbit) {

    if (number == 0 || flagbit == 0) return false;

    var binary = number.toString(2);

    if (binary.length > flagbit) {
        if (binary.charAt(binary.length - flagbit - 1) == "1") return true;
    }
    return false;
}

function SetLogCollectionBit(collection, bit) {
    if (!IsLogBitSet(collection, bit)) {
        collection += Math.pow(2, bit);
    }
    return collection;
}

function SolIdForStatsNet(sid) {
    if (!StatsDotNet.disabled) {
        StatsDotNet.flexId = '4';
        StatsDotNet.flexValue1 = sid;
        StatsDotNet.eventCollectionId = SetLogCollectionBit(StatsDotNet.eventCollectionId, 18);

    }
}

function AssetIdClick(aid) {
    if (!StatsDotNet.disabled) {
        StatsDotNet.SetSearchCategoryId(aid);
        StatsDotNet.flexValue2 = aid;
        StatsDotNet.flexId = '4';
    }
}

function RegionSave(pfx) {
    var cookiekey = pfx + 'LANG'
    var prevLN = fetchcookieval(cookiekey);
    var newLN = $('#LN').get(0).value;
    if (prevLN) {
        if (prevLN != newLN) {
            StatsDotNet.eventCollectionId = SetLogCollectionBit(StatsDotNet.eventCollectionId, 17);

        }
    }
    setcookieval(cookiekey, newLN);
    $('#regionform').get(0).submit;
}

function CheckEulaCookie(url) {
    var tval = fetchcookieval("acweula");
    if (tval != "1") {
        return true;
    }
    else {
        StatsDotNet.eventCollectionId = SetLogCollectionBit(StatsDotNet.eventCollectionId, 26);
        location.href = url;
        return false;
    }
}

function LaunchAcw(arg, url) {
    if (arg == "accept") {
        StatsDotNet.eventCollectionId = SetLogCollectionBit(StatsDotNet.eventCollectionId, 26);
        setcookieval("acweula", "1");
        var acwwin = window.open(url, null, "height=1,width=1,left=0,top=0,status=no,toolbar=no,menubar=no,location=no");
        if (!acwwin) {
            location.href = url;
        }
        else {
            $('[name=frmacw]').submit();
            //if(acwwin.location.pathname.indexOf('default.aspx') > -1){ acwwin.close();} 
        }
        return false;

    }
    else {
        $('[name=frmacw]').submit();
    }
}

function getLatestElement() {
    var e = $('body').get(0);
    while (e.lastChild) e = e.lastChild;
    while (!e.tagName) e = e.parentNode;
    return e.previousSibling;
}

function fixBulletPosition(e, all) {
    return;
}

var acStartNum;
function setACStartChars(charNum) {
    if (charNum) {
        acStartNum = charNum.split(':');
    }
}

function changeLcidForSelect(elem, targetid, itemnum, acstartchar) {
    var lcid = itemnum || elem.options[elem.selectedIndex].value;
    if (lcid) {
        lcid = lcid.split('=');
        if (lcid.length === 2) {
            changeAcLcid(lcid[1], targetid);
        }
    }
    if (acStartNum) {
        try {
            chars = (acstartchar) ? acStartNum[parseInt(acstartchar, 10)] : acStartNum[elem.selectedIndex];
            MS.Support.AC.ACChangeCharStart(targetid, chars);
        }
        catch (e) { }
    }
}

var changeAcLcid = function (lcid, targetid, acstrt) {
    try {
        MS.Support.AC.ACSetLcid(targetid, lcid);
        if (acStartNum && acstrt) {
            try {
                MS.Support.AC.ACChangeCharStart(targetid, acStartNum[acstrt]);
            }
            catch (e) { }
        }
    }
    catch (e) { }
};

function InitAC(targetid) {
    var changelcid = function () {
        //check to see if we are in a multicatalog region, this can be done by checking for
        //a combo box with the id of ddCatalog
        var cat = $('#ddCatalog').get(0);
        if (cat) {
            //get the lcid value stored in the cookie adcatalog
            //if the cookie value exists we want to check and see if its in the multicatalog drop down
            var lcid = unescape(fetchcookieval("adcatalog"));
            if (lcid) {
                //validate against the value in the multicatalog dropdown
                //if the value exists we are going to use it, otherwise we wont make any changes
                var catex = false;
                for (var i = 0; i < cat.options.length; i++) {
                    if (cat.options[i].value == lcid) {
                        catex = true;
                        break;
                    }
                }

                if (catex) {
                    lcid = lcid.split('=');
                    if (lcid.length === 2) {
                        try {
                            MS.Support.AC.ACSetLcid(targetid, lcid[1]);
                        }
                        catch (e) { }
                    }
                }
            }
        }
    };

    $(window).ready(changelcid);
}

//Pass through function for a non persistant cookie value
function srch_setcookieval(key, val) {
    setcookieval(key, val, null, true);
}

//Sets a cookie value, may make use of a group cookie if the subkey is passed
//key : name of the cookie
//val : value of the cookie
//subkey : sub key name of a key:value pair in a group cookie
//nopersist : tells the cookie to make it a non persistant value
function setcookieval(key, val, subkey, nopersist) {
    if (!key) return;

    var cv, cs = '';

    if (!nopersist) {
        var d = new Date();
        cs += '; expires=' + d.toGMTString(d.setFullYear(d.getFullYear() + 1));
    }

    var ld = document.domain;
    if ((typeof (gCookieDomain) != 'undefined') && (gCookieDomain != null) && (gCookieDomain != '')) { ld = gCookieDomain; }
    if (ld.indexOf(".com") > -1) cs += '; Domain=' + ld;

    cv = fetchcookieval(key);

    if (cv && subkey) {
        var cn, subkeyfound = false;
        if (cv.indexOf('=') > -1) {
            var ca = cv.split('&');
            for (var i = 0; i < ca.length; i++) {
                cn = ca[i].substring(0, ca[i].indexOf('='));
                if (cn.charAt(0) == ' ') cn = cn.substring(1, cn.length);
                if (subkey === cn) {
                    ca[i] = subkey + '=' + val;
                    cv = ca.join('&');
                    subkeyfound = true;
                    break;
                }
            }

            if (!subkeyfound) {
                if (ca.length > 0) cv += '&';
                cv += subkey + '=' + val;
            }
        } else cv = subkey + '=' + val;
    }
    else if (!cv && subkey) cv = subkey + '=' + val;
    else if (!subkey) cv = val;
    else return;

    document.cookie = key + '=' + cv + cs + '; path=/';
}

function fetchcookieval(key, subkey) {
    if (!key) return '';

    var cn, cv, ca = document.cookie.split(';');
    for (var i = 0; i < ca.length; i++) {
        cn = ca[i].substring(0, ca[i].indexOf('='));
        if (cn.charAt(0) == ' ') cn = cn.substring(1, cn.length);
        if (key === cn) {
            cv = ca[i].substring(ca[i].indexOf('=') + 1, ca[i].length);
            break;
        }
    }

    if (!cv) return null;
    if (!subkey) return cv;

    ca = cv.split('&');
    for (var i = 0; i < ca.length; i++) {
        cn = ca[i].substring(0, ca[i].indexOf('='));
        if (cn.charAt(0) == ' ') cn = cn.substring(1, cn.length);
        if (subkey === cn) return ca[i].substring(ca[i].indexOf('=') + 1, ca[i].length);
    }
}

function onHotfixEulaAction(arg, url) {
    setcookieval("hotfixEulaCookie", (arg == "accept") ? '1' : '0', '', false);
    if (arg == "accept")
        document.forms['frmHotfixEula'].submit();
    else
        document.location.href = url;
}

function makeAjaxCall(functionName, data) {
    AjaxGet('/AjaxDispatcher.ashx?func=' + functionName + '&data=' + data, functionName);
}

function AjaxCallbackFunc(func, data) {
    if (func == 'LoadRelatedTags') {
        Callback_RelatedTags(data);
    }
    else if (func == 'LoadRelatedContent') {
        Callback_RelatedContent(data);
    }
}

AjaxGet = function (url, functionName) {
    try {
        var objXmlHttpReq = null;

        if (window.XMLHttpRequest) {
            objXmlHttpReq = new XMLHttpRequest();
        }
        else if (window.ActiveXObject) {
            objXmlHttpReq = new ActiveXObject("Msxml2.XMLHTTP");
        }
        var response;

        if (objXmlHttpReq && objXmlHttpReq != null) {
            objXmlHttpReq.open("GET", url, true);
            objXmlHttpReq.setRequestHeader("Connection", "close");
            objXmlHttpReq.setRequestHeader("Content-Type", "text/plain");
            objXmlHttpReq.onreadystatechange = function () {

                if (objXmlHttpReq.readyState == 4 && objXmlHttpReq.status == 200) {
                    AjaxCallbackFunc(functionName, objXmlHttpReq.responseText);
                }
            }
            objXmlHttpReq.send(null);
        }
        else {
            return null;
        }
    }
    catch (e) {
        return null;
    }
}

function Callback_RelatedTags(data) {
    if (data && data != null) {
        var innerdiv = $('#divRelTags').get(0);
        if (innerdiv) {
            innerdiv.style.display = "block";
            innerdiv.innerHTML = data;
        }
    }
}

function Callback_RelatedContent(data) {
    if (data && data != null) {
        var innerdiv = $('#divRelContent').get(0);
        if (innerdiv) {
            innerdiv.style.display = "block";
            innerdiv.innerHTML = data;
        }
    }
}


function AddtoSocialMedia(SocialBrand, SocialMediaId, url, title) {
    var PageURL = window.location.href;
    var PageTitle = window.document.title;
    LogSocialMedia(SocialBrand, PageURL, SocialMediaId);
    window.open(url + encodeURIComponent(PageURL) + title + (jQuery.trim(title).length == 0 ? "" : encodeURIComponent(PageTitle)), "win");
}

function RenderSpecSocialMedia(targeturl, parameters, height, width) {
    document.write("<iframe src=\"" + jQuery.trim(targeturl) + encodeURIComponent(window.location.href) + jQuery.trim(parameters) + "\" height=\"" + height + "\" width=\"" + width + "\" scrolling=\"no\" frameborder=\"0\"></iframe>");
}

function AppendScriptToBody(scriptSrc) {
        $('<script>').attr({
            src: scriptSrc,
            type: 'text/javascript',
            async: true
        }).appendTo($('body'));
}

function LoadTweetJs() {
    AppendScriptToBody('http://platform.twitter.com/widgets.js');
}

function Renderfacebook(lang) {
    $('body').append("<div id=\"fb-root\"></div>");
    window.fbAsyncInit = function () {
        FB.init({ appId: '119145894811383', status: true, cookie: true, xfbml: true
        });
    };
    (function () {
        var e = document.createElement('script');
        e.src = document.location.protocol + '//connect.facebook.net/' + lang + '/all.js';
        e.async = true;
        document.getElementById('fb-root').appendChild(e);
    } ());
}
function LogSocialMedia(BrandName, PageURL, SocialMediaId) {
    var ReportingStr = "";
    var RequestDate = new Date();
    var HourIDS = RequestDate.getHours();
    var MinuteIDS = RequestDate.getMinutes();
    var RequestDateS = RequestDate.toDateString();
    ReportingStr = "SSID=25&RequestDate=" + RequestDateS +
    "&HourID=" + HourIDS +
    "&MinuteID=" + MinuteIDS +
    "&FlexValue1=" + BrandName +
    "&PageUrl=" + PageURL +
    "&Flexid=1&Flexvalue2=" + SocialMediaId +
    "&Flexvalue3=" + StatsDotNet.contentId +
    "&SiteCulture=" + StatsDotNet.SiteCulture +
    "&ContentCulture=" + StatsDotNet.ContentCulture;
    $.ajax({ url: "/lts/default.aspx", data: ReportingStr });
}

function SMCollapseExpand(obj) {
    var smobj = $(obj).next();
    if ($(smobj).css("display").toLowerCase() == "none") {
        $(smobj).css("display", "inline-block");
        $(obj).attr("class", "SM_Expand");
        $(document).bind('click.SocialMedia', function (event) { SocialMediaClickHandle(event); });
    } else {
        $(smobj).css("display", "none");
        $(obj).attr("class", "SM_Collapse");
    }
}

function SocialMediaClickHandle(event) {
    if (!event || !event.target) {
        return;
    }

    var targetEl = event.target;
    var gss_socialmedia = ElementsByName('td', 'gss_socialmedia');
    for (var s = 0; s < gss_socialmedia.length; s++) {
        if (IsChildren(targetEl, gss_socialmedia[s], 10)) {
            return;
        }
    }
    var gss_SocialMedia_detail = ElementsByName('div', 'gss_SocialMedia_detail');
    $(document).unbind('click.SocialMedia');
    for (var i = 0; i < gss_SocialMedia_detail.length; i++) {
        gss_SocialMedia_detail[i].style.display = 'none';
        $(".SM_Expand").attr("class", "SM_Collapse");

    }
}


function IsChildren(targetEl, parentEl, nestingLimit) {
    if (!targetEl) {
        return false;
    }
    var isChildElement = false;
    if (!nestingLimit)
        nestingLimit = 6;

    var parent = targetEl.parentNode;
    var level = 0;
    var isSearchElement = false;
    while (parent && nestingLimit > level) {
        if (parent == parentEl) {
            isChildElement = true;
            break;
        }
        parent = $(parent).parent().get(0);
        level++;
    }
    return isChildElement;
}

function ElementsByName(tag, name) {
    var returns = document.getElementsByName(name);
    if (returns.length > 0) return returns;
    returns = new Array();
    var e = document.getElementsByTagName(tag);
    for (var i = 0; i < e.length; i++) {
        if (e[i].getAttribute("name") == name) {
            returns[returns.length] = e[i];
        }
    }
    return returns;
}

$(window).load(function () {
    if ($("#ATList").get(0)) {
        $("#ATList").css("display", "none");
        $("#ATList").css("position", "absolute");
    }
})

function DisplayATList() {
    if ($("#ATList").css("display").toLowerCase() == "none") {
        if ($("#thinColumn").get(0))
            $("#thinColumn").css("overflow", "visible");
        $("#ATList").css("display", "block");
        $(document).bind('click.ArticleTranslation', function (event) { ArticleTranslationClickHandle(event); });
    } else {
        $("#ATList").css("display", "none");
        $(document).unbind('click.ArticleTranslation');
    }

}

function ArticleTranslationClickHandle(event) {
    if (!event || !event.target) {
        return;
    }
    var targetEl = event.target;
    var Container = $('#ArticleTranslations').get(0);
    if (Container == targetEl || IsChildren(targetEl, Container)) {
        return;
    }
    $("#ATList").css("display", "none");
    $(document).unbind('click.ArticleTranslation');
}

function SocialMediaInit() {
    $(".SocialMedia_out").css("display", "inline-block");
}

function ATClick(ContainerId, obj) {
    obj.id = "KBLangListRedirect";
    if (!StatsDotNet.disabled) { StatsDotNet.exitContainerId = ContainerId; }
}


function getSubMenuHandleName(obj) {
    return (obj.id ? obj.id : 'dropdownmenu');
}

function bindMenuEvent(obj) {
    if (!obj.menuEventBound) {
        obj.menuEventBound = true;
        $(obj).hover(
        null, // We will handle mouseover directly.
        function () { hideSubMenu(obj); });

        $(obj).bind('keydown',
        function (event) {
            // esc
            if (event.keyCode === 27) {
                $(obj).find('a#menubody').focus();
                hideSubMenu(obj);
            }
        });
    }
    if (!obj.menuGlobalTrackEventBound) {
        obj.menuGlobalTrackEventBound = true;
        $(document).bind('click.' + getSubMenuHandleName(obj), function (event) { hideSubMenuHandle(event, obj); });
        $(document).bind('focusin.' + getSubMenuHandleName(obj), function (event) { hideSubMenuHandle(event, obj); });
    }
}

function displaySubMenu(obj) {
    $(obj).find('#dropdownmenu').show();
    bindMenuEvent(obj); // do event binding in event handler, so we can get the event object without any kind of id query.
}

function hideSubMenu(obj) {
    $(obj).find('#dropdownmenu').hide();
    $(document).unbind('click.' + getSubMenuHandleName(obj));
    $(document).unbind('focusin.' + getSubMenuHandleName(obj));
    obj.menuGlobalTrackEventBound = false;
}

function toggleSubMenu(obj) {
    if ($(obj).find('#dropdownmenu').is(':visible')) {
        hideSubMenu(obj);
    }
    else {
        displaySubMenu(obj);
    }
}

function trackOutsideEvent(event, target, triggerFn) {
    if (!event || !event.target) {
        return;
    }

    var eventTargetEl = event.target;
    if (!(jQuery.contains(target, eventTargetEl) || eventTargetEl == target)) {
        triggerFn(target);
    }
}

function hideSubMenuHandle(event, menu) {
    trackOutsideEvent(event, menu, function (obj) { hideSubMenu(obj); });
}

function recordLinkClick(flexValueId, id) {
    if (id) {
        var value = eval('StatsDotNet.flexValue' + flexValueId);
        value = $.trim(value);
        if (!value) {
            value = id;
        } else {
            var _value = '|' + value + '|';
            if (_value.indexOf('|' + id + '|') < 0) {
                value = value + '|' + id;
            }
        }
        eval('StatsDotNet.flexValue' + flexValueId + ' = value');
    }
}

function handleFixitFooterClick(event, flexValueId) {
    if (!event || !event.target) {
        return;
    }
    var _target = event.target;
    if ($(_target).is('a')) {
        var id = $(_target).attr('href');
        recordLinkClick(flexValueId, id);
    }
}

function generateWedcsData() {
    var cookieKey = "wedcsinc";
    var cookieKeyCur = 'MS0';
    var inc = fetchcookieval(cookieKey);
    var cur = fetchcookieval(cookieKeyCur);
    if (cur == null || !inc) {
        inc = 0;
    }
    inc = parseInt(inc);
    inc += 1;
    setcookieval(cookieKey, inc, null, false);

    var sver = '<meta name="ms.ssversion" content="' + StatsDotNet.SsVersion + '" />';
    $(sver).appendTo($('head'));
    var meta = '<meta name="ms.eventseqno" content="' + inc + '" />';
    $(meta).appendTo($('head'));	
}