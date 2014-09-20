// Ensure that the Mst namespace has been defined
if (window.Mst === undefined) {
    window.Mst = {};
}
Mst.FlyoutNavigationMenu = function (id, menuClass, itemClass, flyoutLinkClass, staticLinkClass, flyoutClass, flyoutRegionClass, menuSectionClass, onOpenClick, onCloseEvent, Issubmenu, subflyoutClass, subitemClass) {

    this._menu = $('#' + id);
    // CSS classes
    this._menuClass = "." + menuClass;
    this._itemClass = "." + itemClass;
    this._flyoutLinkClass = "." + flyoutLinkClass;
    this._staticLinkClass = "." + staticLinkClass;
    this._flyoutClass = "." + flyoutClass;
    this._flyoutRegionClass = "." + flyoutRegionClass;
    this._menuSectionClass = "." + menuSectionClass;

    this._hideTimerId = null;
    this._showTimerId = null;
    this._preventClickTimerId = null;
    this._preventDwellTimerId = null;
    this._preventClick = false;
    this._preventDwell = false;

    this._Issubmenu = Issubmenu;
    this._subflyoutClass = "." + subflyoutClass;
    this._subitemClass = "." + subitemClass;

    // BI Functions
    this._onOpenClick = onOpenClick;
    this._onCloseEvent = onCloseEvent;

    // Wire up events
    $(document)
        .click($.proxy(this.DocClick, this));

    $(this._itemClass + ' ' + this._flyoutLinkClass, this._menu)
        .click($.proxy(this.ItemClick, this))
        .mouseover($.proxy(this.ItemMouseover, this));

    // Hide open flyouts on mouseover of an item without a flyout
    $(this._itemClass + ' ' + this._staticLinkClass, this._menu)
        .mouseover($.proxy(this.HideFlyouts, this));

    // Keep the flyout open if the user is mouseover the flyout
    $(this._flyoutClass, this._menu)
        .mouseover($.proxy(this.KeepFlyoutVisible, this));
};

Mst.FlyoutNavigationMenu.prototype = {

    DocClick: function (e) {
        var item = this._menu.find('.selected');
        if (item.size() > 0) {
            var contains = $.contains(item.get(0), e.target);
            if (!contains) { 
                this.HideFlyouts();
                //TODO: Reset the focus
            }
        }
    },

    // Document Events
//    DocKeypress: function (e) {
//        if (e.keyCode == 27) {
//            // Close flyouts when ESC key is pressed
//            var flyouts = $(this._flyoutClass + ':visible', this._menu);
//            this.HideFlyouts();
//            // Reset the focus
//            flyouts.prev('a').each(function () { this.focus(); });
//        }
//    },
//    DocMouseover: function (e) {
//        this.ClearShowTimer();
//        if (this._hideTimerId == null) {
//            this.StartHideTimer();
//        }
//    },

    // Item Events
    ItemClick: function (e) {
        e.preventDefault();

        this.ClearHideTimer();
        this.ClearShowTimer();
        this.ClearPreventDwellTimer();

        this._preventDwell = true;
        if (this._preventClick == false) {
            this.StartPreventDwellTimer();

            if (this.IsFlyoutVisible(e)) {
                var This = this;
                if (this._onCloseEvent != null) {
                    $(this._itemClass).filter('.selected').each(function () {
                        This._onCloseEvent($(this).find(This._flyoutLinkClass));
                    });
                }
                this.HideFlyouts();
                this.HideSubMenuFlyouts(e);
            } else {
                this.HideFlyouts();
                this.ShowFlyout(e);

                if (this._onOpenClick != null) {
                    // Click BI Impression
                    this._onOpenClick(e);
                }
            }
        }
    },
//    ItemMouseover: function (e) {
//        e.stopPropagation();

//        this.ClearHideTimer();
//        this.ClearShowTimer();

//        if (this.IsFlyoutVisible(e)) {
//            this.ClearPreventClickTimer();
//        } else {
//            this.StartShowTimer(e);
//        }
//    },
    ItemDwell: function (e) {
        this.ClearPreventClickTimer();

        this._preventClick = true;
        if (this._preventDwell == false) {
            this.StartPreventClickTimer();

            if (this.IsFlyoutVisible(e)) {
                this.HideFlyouts();
            } else {
                this.HideFlyouts();
                this.ShowFlyout(e);

                if (this._onOpenDwell != null) {
                    // Dwell BI Impression
                    this._onOpenDwell(e);
                }
            }
        }
    },
    IsFlyoutVisible: function (e) {
        return $(e.target).parents(this._itemClass).find(this._flyoutClass).css('display') != 'none';
    },

    // Flyout functions
    ShowFlyout: function (e) {
        var flyout = $(e.target).parents(this._itemClass).addClass('selected').find(this._flyoutClass);

        this.PositionFlyout(flyout);

        if (jQuery.browser.opera || (jQuery.browser.msie && document.documentMode <= 7)) {
            flyout.show();
        } else {
            flyout.slideDown(300); // Animates in latest browsers
        }
    },
    HideFlyouts: function (e) {
        //TODO: this should only act on visible menus
        this.HideSubMenuFlyouts(e);
        if (jQuery.browser.opera || (jQuery.browser.msie && document.documentMode <= 7)) {
            $(this._flyoutClass, this._menu).hide();
        } else {
            $(this._flyoutClass, this._menu).slideUp(300); // Animates in latest browsers
        }
        $(this._itemClass).removeClass('selected');
    },
    HideSubMenuFlyouts: function (e) {
        //This code is done to hide submenu because in that case hiding  submenu is not working properly. 
        if (this._Issubmenu == false) {
            if (jQuery.browser.opera || (jQuery.browser.msie && document.documentMode <= 7)) {
                $(this._subflyoutClass).hide();
            } else {
                $(this._subflyoutClass).slideUp(300); // Animates in latest browsers
            }
            $(this._subitemClass).removeClass('selected');
        }
    },
    KeepFlyoutVisible: function (e) {
        e.stopPropagation();
        this.ClearHideTimer();
        this.ClearShowTimer();
    },
    PositionFlyout: function (e) {

        //TODO: Clean up this code and comment
        var left = 'left';
        var itemWidth = e.parents(this._itemClass).width();

        var itemPosition = e.parents(this._itemClass).position().left;

        var flyoutWidth = e.outerWidth();
        var NavWidth = e.parents(this._menuClass).width();
        var NavPosition = e.parents(this._menuClass).position().left;

        var headWidth = NavWidth;
        if (e.parents(this._flyoutRegionClass).size() > 0) {
            headWidth = e.parents(this._flyoutRegionClass).innerWidth();
        }

        // Calculate offset
        var offsetLeft = itemPosition + NavPosition;
        var offsetRight = NavWidth - itemPosition - itemWidth - 5;

        if (document.documentElement.dir == 'rtl') {
            left = 'right'
            itemWidth += 7;
            offsetRight = headWidth - itemPosition - itemWidth;

            var temp = offsetLeft;
            offsetLeft = offsetRight;
            offsetRight = temp;
        }
        if (offsetRight < 0) {
            offsetRight = 0;
        }
        if (offsetLeft < 0) {
            offsetLeft = 0;
        }

        // Position flyout
        var posLeft = 0;
        if (flyoutWidth <= (itemWidth + offsetRight)) {
            // Dock to Left hand side
            e.css(left, posLeft);
            e.addClass('dock-left');
        } else if (flyoutWidth < itemWidth + offsetLeft) {
            // Dock to Right hand side
            if (document.documentElement.dir == 'rtl') {
                posLeft = -flyoutWidth + itemWidth + 2;
            } else {
                posLeft = -flyoutWidth + itemWidth;
            }
            e.css(left, posLeft);
            e.addClass('dock-right');
        } else {

            if (flyoutWidth < (offsetLeft + offsetRight + itemWidth)) {
                // Dock to the far right side
                posLeft = -flyoutWidth + (offsetRight + itemWidth);
                e.css(left, posLeft);
            } else {
                // Dock to the far left side
                if (document.documentElement.dir == 'rtl') {
                    posLeft = -offsetLeft - 1;
                }
                else {
                    posLeft = -offsetLeft - 6;
                }
                e.css(left, posLeft);
            }
        }
    },

    // Start Timers
    StartShowTimer: function (e) {
        this._showTimerId = window.setTimeout($.proxy(function () { this.ItemDwell(e); }, this), 100);
    },
    StartHideTimer: function () {
        this._hideTimerId = window.setTimeout($.proxy(this.HideFlyouts, this), 1000);
    },
    StartPreventClickTimer: function () {
        this._preventClickTimerId = window.setTimeout($.proxy(function () { this._preventClick = false; }, this), 350);
    },
    StartPreventDwellTimer: function () {
        this._preventDwellTimerId = window.setTimeout($.proxy(function () { this._preventDwell = false; }, this), 350);
    },

    // Clear Timers
    ClearShowTimer: function () {
        window.clearTimeout(this._showTimerId);
        this._showTimerId = null;
    },
    ClearHideTimer: function () {
        window.clearTimeout(this._hideTimerId);
        this._hideTimerId = null;
    },
    ClearPreventClickTimer: function () {
        window.clearTimeout(this._preventClickTimerId);
        this._preventClickTimerId = null;
    },
    ClearPreventDwellTimer: function () {
        window.clearTimeout(this._preventDwellTimerId);
        this._preventDwellTimerId = null;
    }
};