/*
* This file has been commented to support Visual Studio Intellisense.
*/

if (typeof window.MSCOM == "undefined") {
    window.MSCOM = {};
}
//window.MSCOM.BI
window.MSCOM.BI = {
    logenabled: false,
    skipBiAttr: ['bi:track', 'bi:titleflag', 'bi:parenttitle', 'bi:title', 'bi:index', 'bi:gridindex', 'bi:gridtype', 'bi:type'],
    isInitialized: false,
    logCache: [],
    biInitTime: null,
    additionalParams: {}, // Base parameters for all beacons
    linkClickParams: { interactiontype: 2, cot: 1 }, // Base parameters for automatic link click beacons 
    log: function (message) {
        ///	<summary>
        ///		Logs a message to the console.
        ///	</summary>
        ///	<param name="message" type="String">
        ///		Message.
        ///	</param>

        if (this.logenabled) {
            try { console.log(message); } catch (e) { }
        }
    },

    isIE: function () {
        ///	<summary>
        ///		Indicates if browser is IE.
        ///	</summary>
        ///	<returns type="Boolean" />

        return (navigator.appVersion.indexOf("MSIE") != -1);
    },

    init: function (mapping) {
        ///	<summary>
        ///		Initializes BI for the page.
        ///	</summary>
        ///	<param name="mapping" type="BiMapping">
        ///		Optional parameter that takes in JSON object to map the providers to their bi parameters/values.
        ///	</param>

        if (this.isInitialized) return; // Prevents it from being initialized more than once
        this.isInitialized = true;

        mapping = mapping || window.BiMapping; // TODO: what should we do if there is no mapping object?
        if (mapping) {
            this.Map = mapping;
            this.log(mapping);
        }

        var eventName = (window.attachEvent ? 'click' : 'mousedown'); // IE: click, Other Browsers: mousedown
        $('a, area').live(eventName, $.proxy(function (event) {
            var biEnabled = true; // Tracking enabled by default
            var $el = $(event.currentTarget);

            // Find closeset bi:track attribute
            if ($el.attr('bi:track')) {
                // Check element with attribute
                biEnabled = ($el.attr('bi:track') == 'true');
            } else {
                var parents = $el.parents(':not(table)').filter(function () {
                    // Get all ancestors with attribute
                    return $(this).attr('bi:track') ? true : false;
                });
                if (parents.length) {
                    // Get closest ancestors with attribute
                    biEnabled = ($(parents[0]).attr('bi:track') == 'true');
                }
            }
            if (biEnabled) {
                this.linkClick(event.currentTarget, event.target);
            }
        }, this));

        // Enable webtrends provider
        if (typeof window.WebTrends != "undefined") {
            this.WebTrends = new WebTrends();
        }

        this.biInitTime = new Date(); // For logging

        $($.proxy(this.recordLoad, this)); // TODO: allow this to be configurable

        if (window.location.hash.indexOf('bilog') > 0) { // For logging
            this.logenabled = true;
        }
    },

    record: function (parameters) {
        ///	<summary>
        ///		Sends a beacon containing the parameters that are mapped to each provider .
        ///	</summary>
        ///	<param name="parameters" type="JSON">
        ///		Key-value pair JSON object of parameter names/values .
        ///	</param>

        parameters = parameters || {};

        // For logging
        var start = new Date().getTime();
        this.logCache = [parameters];

        // Do the interaction parameter type mapping
        parameters = this.mapInteractionType(parameters); // TODO: make this optional or configurable for each provider

        // TODO: make these use delagates for each provider
        if (this.WebTrends && this.isProviderValid(parameters, this.Map.Webtrends)) {
            try { this.WebTrends.dcsJSONTrack({}, this.convertToWebtrends(parameters)); } catch (e) { }
        }
        if (window.MscomCustomEvent && this.isProviderValid(parameters, this.Map.Wedcs)) {
            // Send to wedcs
            try { MscomCustomEvent.apply(this, this.convertToWedcs(parameters)); } catch (e) { }
        }

        // For logging
        var end = new Date();
        this.log([end.getTime() - this.biInitTime.getTime(), (end.getTime() - start), this.logCache]);
    },

    // TODO: add optional parameters parameter
    recordLoad: function () {
        ///	<summary>
        ///		Sends a beacon for page load containing parameters that are mapped to each provider.
        ///	</summary>
        if (typeof QosRecord != "undefined") QosRecord('domready');

        var parameters = { interactiontype: 0, title: document.title, initial: 0 }; // TODO: move this

        // Do the interaction parameter type mapping
        parameters = this.mapInteractionType(parameters);  // TODO: make this optional or configurable for each provider

        // For logging
        var start = new Date().getTime();

        var $items;
        if (this.isIE()) {
            // Get visible areas
            $items = $('area:visible').filter(function () {
                return $(this).parent('map').siblings('img').is(':visible'); // TODO: check for an image with usemap attribute that matches the map name
            });
            // Merge visible areas with visible anchors
            $items = $.merge($items, $('a:visible'));
        } else {
            // Get visible achors and areas
            $items = $('a:visible, area:visible');
        }
        parameters = $.extend({}, this.additionalParams, parameters, this.getMergedBiData($items));

        // For logging
        var end = new Date();
        this.log([end.getTime() - this.biInitTime.getTime(), (end.getTime() - start), 'load beacon processing', parameters]);

        // TODO: make these use delagates for each provider
        if (this.WebTrends && this.isProviderValid(parameters, this.Map.Webtrends)) {
            // Send to webtrends
            try {
                this.WebTrends.dcsCollect();
                this.WebTrends.dcsJSONTrack(
                    {
                        'DCS.dcssip': window.location.hostname,
                        'DCS.dcsuri': window.location.pathname,
                        'DCS.dcsqry': window.location.search
                    }, this.convertToWebtrends(parameters));
            } catch (e) { }
        }
        if (window.MscomCustomEvent && this.isProviderValid(parameters, this.Map.Wedcs)) {
            parameters = $.extend(parameters, { 'cot': null }); // Could also be set to 0
            // Send to wedcs
            try { MscomCustomEvent.apply(this, this.convertToWedcs(parameters)); } catch (e) { }
        }
    },

    /* Animation Safe Bi Queue */
    _queueDelay: 350,
    _queueTimerId: null,
    _queueStack: [],
    _recording: false,
    addRecordQueue: function (params) {
        // Start Bi Timer
        this._queueStack.push(params);
        //this.log(['addRecordQueue', this._queueStack]);
        if (this._queueTimerId == null)
            this.startQueueTimer();
    },
    queue: function () {
        this.clearQueueTimer();

        if ($(':animated').length == 0) {// Check if anything is animating
            //this.log(['processQueue', new Date().getTime(), this._queueStack]);
            this.record(this._queueStack.shift());
        }

        if (this._queueStack.length > 0) {
            this.startQueueTimer();
        }
    },
    clearQueueTimer: function () {
        window.clearTimeout(this._queueTimerId);
        this._queueTimerId = null;
    },
    startQueueTimer: function () {
        this.clearQueueTimer();
        this._queueTimerId = window.setTimeout($.proxy(this.queue, this), this._queueDelay);
    },

    /*combined version */
    getNestedIndexGridTypeStructure: function (element) {
        var combined = {},
            grids = [],
            items = [],
            types = [];
        $(element).parents(':not(table)').each(function () {
            // Grid Logic
            if ($(this).attr('bi:gridindex')) {
                var prefix = ($(this).attr('bi:gridtype')) ? $(this).attr('bi:gridtype') : '';
                grids.push(prefix + " " + $(this).attr('bi:gridindex'));
            }
            // Item 
            if ($(this).attr('bi:index')) {
                items.push($(this).attr('bi:index'));
            }
            // Type
            if ($(this).attr('bi:type')) {
                types.push($.trim($(this).attr('bi:type')));
            }
        });

        combined['parenttypestructure'] = types.reverse().join(';');
        combined['gridstructure'] = grids.reverse().join(';');
        combined['parentindexstructure'] = items.reverse().join(';');

        return combined;
    },

    getNestedGridStructure: function (element) {
        // Traverse the DOM upwards and return a semicolon delimited string of bi:griditem elements the prefix will be determined by the class
        var types = [];
        $(element).parents(':not(table)').filter(function () {
            if ($(this).attr('bi:gridindex')) {
                var prefix = ($(this).attr('bi:gridtype')) ? $(this).attr('bi:gridtype') : '';
                types.push(prefix + " " + $(this).attr('bi:gridindex'));
                return true;
            }
            return false;
        });
        // Reverse
        return types.reverse().join(';');
    },

    getNestedIndexStructure: function (element) {
        // Traverse the DOM upwards and return a semicolon delimited string of bi:index elements
        var types = [];
        var cspname = false;
        $(element).parents(':not(table)').filter(function () {
            if ($(this).attr('bi:index')) {
                types.push($(this).attr('bi:index'));
                return true;
            }
            return false;
        });

        return types.reverse().join(';');
    },

    getNestedTypeStructure: function (element) {
        // Traverse the DOM upwards and return a semicolon delimited string of CSP types (can be master, page, and/or component).
        var types = [];
        $(element).parents(':not(table)').filter(function () {
            if ($(this).attr('bi:type')) {
                types.push($.trim($(this).attr('bi:type')));
                return true;
            }
            return false;
        });

        return types.reverse().join(';');
    },

    getNestedTitleStructure: function (element, recurse, parentOnly) {
        var names = [],
            biParent = [],
            $biFlag,
            $biItem,
            biName = "";
        //1. Get the text on the link add to the array
        if (!parentOnly) // True if you just want the parent
            names.push($.trim($(element).text()));
        /*2. Search for the first bi:parenttitles="name1" upon finding one (stop the current loop). search for the sibling/parent for bi:titleflag="name1"*/
        // Add first Item if the element exists
        if ($(element).attr('bi:parenttitle')) {
            biParent.push($(element));
        }
        $(element).parents(':not(table)').each(function () {
            if ($(this).attr('bi:parenttitle')) {
                biParent.push($(this));
            }
        });
        //this.log(['start titlestructure ', biParent, element]);

        /* Update: made this more robust. Checking bi:parenttitle on the other parernttitle until it finds one that works*/
        for (var cnt = 0; cnt < biParent.length; cnt++) {
            //this.log(['processing ', biParent[cnt]]);

            var $thisParent = biParent[cnt];
            biName = $thisParent.attr('bi:parenttitle');

            // Search Sibling
            $biFlag = $thisParent.siblings(':not(table)').filter(function () {
                return ($(this).attr('bi:titleflag') == biName);
            }).first();
            if ($biFlag.length == 0) {
                $biFlag = $thisParent.parents(':not(table)').filter(function () {
                    return ($(this).attr('bi:titleflag') == biName);
                }).first();
            }
            if ($biFlag.length != 0) {
                /* 3. Search for the bi:title="name1" on the current item or children
                upon finding it, get the text add to the array
                - continue to 1, look for bi:parenttitle
                */
                if ($biFlag.attr('bi:title') == biName) { // current element
                    $biItem = $biFlag;
                } else { // search children
                    $biItem = $biFlag.find('[bi\\:title="' + biName + '"]').first();
                    // Bug in jquery 1.4.4 for find in IE7 using this as a fallback
                    if ($biItem.length == 0) {
                        $biItem = $biFlag.find('*').filter(function () {
                            return ($(this).attr('bi:title') == biName);
                        }).first();
                        if ($biItem.length != 0) this.log('using fallback on find find([bi\\:title="item") not working');
                    }
                }

                if ($biItem) {
                    //this.log(['title structure succeeded on attempt', $thisParent, $biItem, element]);
                    // Recurse function if parent exists
                    var results = this.getNestedTitleStructure($biItem, true);
                    names = names.concat(results);
                    break; // stop the current loop if the title is already found
                }
            }
        }

        return (recurse) ? names : names.reverse().join(';');
    },

    getMergedBiData: function ($elements) {
        ///	<summary>
        ///		Gets the bi data for multiple elements.
        ///	</summary>
        ///	<param name="$elements" type="jQuery">
        ///		Message.
        ///	</param>
        ///	<returns type="JSON: name-value[] pair" />

        var data = {};
        var attr;
        for (var h = 0, len1 = $elements.length; h < len1; h++) {
            var attributes = $elements.get(h).attributes;
            for (var i = 0, len2 = attributes.length; i < len2; i++) {
                attr = attributes.item(i);
                // Only get attributes that starts with 'bi:' and ignore ones in this.skipBiAttr array
                if ((attr.name.indexOf('bi:') === 0) && ($.inArray(attr.name, this.skipBiAttr) < 0)) {
                    index = attr.name.substring(3, attr.name.length);
                    if (data[index] == undefined) {
                        data[index] = [];
                    }
                    if ($.inArray(attr.value, data[index]) < 0) {
                        data[index].push(attr.value);
                    }
                }
            }
        }
        for (var i in data) {
            data[i] = data[i].join(';');
        }
        return data;
    },

    // TODO: have optional parameter to return ignore attributes
    getBiData: function (element) {
        ///	<summary>
        ///		Gets the bi data for an element.
        ///	</summary>
        ///	<param name="element" type="Element">
        ///		Message.
        ///	</param>
        ///	<returns type="JSON: name-value pair" />

        var data = {};
        var attr;
        var attributes = element.attributes;
        for (var i = 0, len = attributes.length; i < len; i++) {
            attr = attributes.item(i);
            // Only get attributes that starts with 'bi:' and ignore ones in this.skipBiAttr array
            if ((attr.name.indexOf('bi:') === 0) && ($.inArray(attr.name, this.skipBiAttr) < 0)) {
                data[attr.name.toLowerCase().substring(3, attr.name.length)] = attr.value;
            }
        }
        return data;
    },

    linkClick: function (element, target) {
        ///	<summary>
        ///		1: $(element) - Sends beacon with bi information for an element.
        ///		2: $(element, target) - Sends beacon with bi information for an element and its target (for use with images and map areas).
        ///	</summary>
        ///	<param name="element" type="Element">
        ///		1: element - A DOM Element.
        ///		2: element - A DOM Element.
        ///	</param>
        ///	<param name="target" type="Element">
        ///		2: target - A DOM Element.
        ///	</param>

        // Get params for element and target
        var parameters = this.getLinkBiParams(element, target);

        // Call record function
        this.record(parameters);
    },

    getLinkBiParams: function (element, target) {
        ///	<summary>
        ///		1: $(element) - Gets a link's bi information.
        ///		2: $(element, target) - Gets a link's bi information (for use with images and map areas).
        ///	</summary>
        ///	<param name="element" type="Element">
        ///		1: element - A DOM Element.
        ///		2: element - A DOM Element.
        ///	</param>
        ///	<param name="target" type="Element">
        ///		2: target - A DOM Element.
        ///	</param>

        var params = {};

        // Merge Params from the additionalParams/Merge Static LinkClick /Bi data attributes
        $.extend(params, this.additionalParams, this.linkClickParams, this.getBiData(element));

        var hrefStr = $(element).attr('href');
        // Add standard link params like title href
        params['urifull'] = hrefStr;
        params['uridomain'] = $(element)[0].hostname;
        params['uripath'] = $(element)[0].pathname;
        params['urihash'] = (hrefStr && hrefStr.indexOf('#') >= 0) ? (hrefStr.substring(hrefStr.indexOf('#'))) : "";
        hrefStr = (params['urihash']) ? (hrefStr.substring(0, hrefStr.indexOf('#'))) : hrefStr;
        params['uriquery'] = (hrefStr && hrefStr.indexOf('?') >= 0) ? (hrefStr.substring(hrefStr.indexOf('?'))) : "";

        // Current Type if available
        params['type'] = ($(element).attr('bi:type')) ? $.trim($(element).attr('bi:type')) : "";
        // Current Index if available bi:index on the A
        params['index'] = ($(element).attr('bi:index')) ? $.trim($(element).attr('bi:index')) : "";

        //TODO:ADD Classes to Remove Text from Elements
        params['linktitle'] = this.getTitle(element);
        params['title'] = params['linktitle'];
        var nodeName = $(element).get(0).nodeName.toLowerCase();
        if (nodeName == 'area') {
            params['linktitle'] = params['title'] = $(element).attr('alt');
        } else if (params['title'] == '' && target && $(target).get(0).nodeName == 'IMG') {
            params['title'] = $(target).attr('alt');
        }
        try {
            params['parenttitlestructure'] = this.getNestedTitleStructure(element, null, true);
            $.extend(params, this.getNestedIndexGridTypeStructure(element));
        } catch (e) { this.log(e); }

        return params;
    },

    getLocation: function (href) {
        var l = document.createElement("a");
        l.href = href;
        return l;
    },

    ignoreLinkClass: ['.hpFeat_Arrow', '.biLinkIgnore'],
    getTitle: function (element) {
        ///	<summary>
        ///		Removes elements from title that should not be included  like the >> 
        ///	</summary>
        ///	<param name="element" type="Element">
        ///		1. Element
        ///	</param>
        ///	<returns type="Text: string text" />
        var $elem = $(element).clone();
        $elem.find(this.ignoreLinkClass.join(',')).remove();
        return $.trim($elem.text());
    },


    // TODO: make this optional or configurable for each provider
    mapInteractionType: function (parametersByRef) {
        ///	<summary>
        ///		Maps the interaction type parameter to a new value.
        ///	</summary>
        ///	<param name="parametersByRef" type="JSON: name-value pair">
        ///		Message.
        ///	</param>
        ///	<returns type="JSON: name-value pair" />

        var parameters = $.extend({}, parametersByRef); // Break the object reference

        // Interaction type mapping
        var it = { 0: 0, 1: 4, 2: 1, 3: 2, 4: 9, 5: 10, 6: 11, 7: 12, 8: 13, 9: 14, 10: 15, 11: 16, 12: 17, 13: 18, 14: 19, 15: 20, 16: 21, 17: 22, 18: 23, 19: 24, 20: 25 };



        // Map the interaction type
        if (parameters['interactiontype'] != undefined && it[parameters['interactiontype']] != undefined) {
            parameters['interactiontype'] = it[parameters['interactiontype']];
        }

        // Map the trigger interaction type
        if (parameters['triggertype'] != undefined && it[parameters['triggertype']] != undefined) {
            parameters['triggertype'] = it[parameters['triggertype']];
        }

        return parameters;
    },
    isProviderValid: function (params, biprovider) {
        ///	<summary>
        ///		Checks if parameter is valid based on the provider settings (ie InteractionType whitelist)
        ///		Checks also if provider itself is enabled(ie InteractionType whitelist)
        ///	</summary>
        ///	<param name="params" type="JSON: name-value pair">
        ///		Message.
        ///	</param>        
        ///	<param name="biprovider" type="Element">
        ///		the biprovider object containing the settings as well as the enabled status
        ///	</param>
        ///	<returns type="Boolean:true if valid" />

        var valid = false;
        if (!biprovider.enabled) { // bi provider is disabled
            valid = false;
        } else if (params.interactiontype == undefined) { // there is no interaction type in the parameter
            valid = true;
        } else if (!biprovider.settings && !biprovider.settings.interactiontype) { // if there is no interaction type whitelist
            valid = true;
        } else { // check white list
            valid = (biprovider.settings.interactiontype[params.interactiontype] != undefined) ? biprovider.settings.interactiontype[params.interactiontype] : false;
        }
        //this.log(['isProviderValid',valid, params.interactiontype, biprovider.enabled, biprovider.settings.interactiontype]);
        return valid;
    },

    convertToWebtrends: function (params) {
        return this.convertToMapping(params, this.Map.Webtrends.mapping);
    },

    convertToWedcs: function (paramByRef) {
        var params = $.extend({}, paramByRef); // Clones the object and prevents pass by val
        if (params['uridomain'] == undefined) {
            params['uridomain'] = window.location.hostname;
            params['uripath'] = window.location.pathname;
            params['uriquery'] = window.location.search;
        }
        return this.toArray(this.convertToMapping(params, this.Map.Wedcs.mapping));
    },

    convertToMapping: function (params, map) {
        var result = {};
        if (map === undefined) return false;

        for (var i in map) {
            result[i] = "";
            for (var j = 0, l = map[i].length; j < l; j++) {
                if (map[i][j].str !== undefined) {
                    result[i] += map[i][j].str;
                    // this.log('map.Add String [' + i + '][' + j + ']' + map[i][j].str);
                } else if (map[i][j].bi && params[map[i][j].bi] !== undefined) {
                    // Reset the domain, path, and query
                    switch (map[i][j].bi) {
                        case 'uripath':
                            if (params[map[i][j].bi] == '') {
                                params[map[i][j].bi] = '/';
                            } else if (params[map[i][j].bi].substring(0, 1) != '/') {
                                params[map[i][j].bi] = '/' + params[map[i][j].bi];
                            }
                            break;
                        case 'uriquery':
                            if (params[map[i][j].bi] == '') {
                                params[map[i][j].bi] = '?';
                            }
                            break;
                    }
                    result[i] += params[map[i][j].bi];
                    // this.log('map.Add Params[' + i + '][' + j + ']' + map[i][j].bi);
                } else if (map[i][j].bi) {
                    // this.log('map.No Params[' + i + '][' + j + ']' + map[i][j].bi);
                } else {
                    // this.log('map.skip [' + i + '][' + j + ']');
                }
            }
            // Clear out empty variables 
            switch (i) {
                default:
                    if (result[i] == '') {
                        delete result[i];
                    }
            }
        }
        this.logCache.push(result);
        return result;
    },

    toArray: function (json) {
        // Converts a JSON object into an array of key-value pairs
        json = json || {};
        var array = [];
        for (var key in json) {
            if (json.hasOwnProperty(key)) {
                array.push(key);
                array.push(json[key]);
            }
        }
        return array;
    },

    toJson: function (array) {
        // Converts an array of key-value pairs into a JSON object
        array = array || [];
        var json = {};
        var len = array.length;
        for (var i = 0; i < len; i += 2) {
            json[array[i]] = array[i + 1];
        }
        return json;
    }
};

