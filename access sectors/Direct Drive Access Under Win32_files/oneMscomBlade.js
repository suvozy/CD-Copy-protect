// Ensure that the Mst namespace has been defined
if (window.Mst === undefined) {
    window.Mst = {};
}

Mst.FlyoutMenu = function (id, menuClass, itemClass, flyoutLinkClass, staticLinkClass, flyoutClass, flyoutRegionClass, onOpenClick, onCloseEvent) {
    this.Control = $('#' + id);

    // CSS classes
    this._menuClass = "." + menuClass;
    this._itemClass = "." + itemClass;
    this._flyoutLinkClass = "." + flyoutLinkClass;
    this._staticLinkClass = "." + staticLinkClass;
    this._flyoutClass = "." + flyoutClass;
    this._flyoutRegionClass = "." + flyoutRegionClass;

    // Set priRow widths
    this.SetPriRowWidth(this.Control);

    // BI Functions
    this._onOpenClick = onOpenClick;
    this._onCloseEvent = onCloseEvent; // Pass in the blade item that was closed

    // Wire up events           
    this.Control.find(this._flyoutLinkClass)
        .click($.proxy(this.ItemClick, this))
        .keydown($.proxy(this.ItemKeyDown, this));

    var flyouts = this.Control.find(this._flyoutClass).toArray();
    var i;
    for (i in flyouts) {
        $(flyouts[i]).find('a:last')
            .keydown($.proxy(this.LastLinkKeyDown, this));
    }

    $(document)
        .click($.proxy(this.DocClick, this));
};

Mst.FlyoutMenu.prototype = {

    SetPriRowWidth: function (ctrl) {
        var priR = $(".mstHdr_PriRow", ctrl);
        var s11 = $(".mstHdr_StaticSec11", priR).first();
        var s12 = $(".mstHdr_StaticSec12", priR).first();
        var s13 = $(".mstHdr_StaticSec13", priR).first();
        var s14 = $(".mstHdr_StaticSec14", priR).first();
       if ($.browser.msie) {
            if ($.browser.version.substr(0, 1) > 7) {
                s14.width("auto");
            }
        }
        else {
            s14.width("auto");
        }

        var s13w = priR.width() - s11.width() - s12.width() - s14.width() - 1;
        s13.width(s13w > 0 ? s13w : "100%");
    },

    DocClick: function (e) {
        var item = this.Control.find('.selected');
        if (item.size() > 0) {
            var contains = $.contains(item.get(0), e.target);
            if (!contains) {
                this.HideFlyouts();
                //TODO: Reset the focus
            }
        }
    },

    ItemClick: function (e) {
        if (!$(e.target).hasClass("mstLcp_DualLangLink")) {

            e.preventDefault();

            if (this.IsFlyoutVisible(e)) {
                this.HideFlyouts();
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

    ItemKeyDown: function (e) {
        if (e.which == 9) {
            if (e.shiftKey) {
                this.HideFlyouts();
                //TODO: Reset the focus
            }
        }
    },

    LastLinkKeyDown: function (e) {
        if (e.which == 9) {
            if (!e.shiftKey) {
                this.HideFlyouts();
                //TODO: Reset the focus
            }
        }
    },

    IsFlyoutVisible: function (e) {
        return $(e.target).parents(this._itemClass).find(this._flyoutClass).css('display') != 'none';
    },

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
        if (jQuery.browser.opera || (jQuery.browser.msie && document.documentMode <= 7)) {
            $(this._flyoutClass, this.Control).hide();
        } else {
            $(this._flyoutClass, this.Control).slideUp(300); // Animates in latest browsers
        }
        var This = this;
        if (this._onCloseEvent != null) {
            $(this._itemClass).filter('.selected').each(function () {
                This._onCloseEvent($(this).find(This._flyoutLinkClass));
            });
        }

        $(this._itemClass).removeClass('selected');


    },

    PositionFlyout: function (e) {

        //TODO: Clean up this code and comment
        var left = 'left';
        var itemWidth = e.parents(this._itemClass).width();

        var itemPosition = e.parents(this._itemClass).position().left;

        var flyoutWidth = e.outerWidth();
        var bladeWidth = e.parents(this._menuClass).width();
        var bladePosition = e.parents(this._menuClass).position().left;

        var headWidth = bladeWidth;
        if (e.parents(this._flyoutRegionClass).size() > 0) {
            headWidth = e.parents(this._flyoutRegionClass).innerWidth();
        }

        // Calculate offset
        var offsetLeft = itemPosition + bladePosition;
        var offsetRight = bladeWidth - itemPosition - itemWidth;

        if (document.documentElement.dir == 'rtl') {
            left = 'right'
            itemWidth -= 2;
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
                posLeft = -offsetLeft - 1;
                e.css(left, posLeft);
            }
        }
    }
};

Mst.AnimHeaderItems = function (id, itemClass, txtClass, imgClass, descClass) {
    $("#" + id + " ." + itemClass)
        .each(function () {
            new Mst.AnimHeaderItem($(this), "mstHdr_MenuLinkTxt", "mstHdr_MenuLinkImg", "mstHdr_MenuLinkDesc");
        });
};

Mst.AnimHeaderItem = function (item, txtClass, imgClass, descClass) {
    this.Item = item;

    // CSS classes
    this._txtClass = "." + txtClass;
    this._imgClass = "." + imgClass;
    this._descClass = "." + descClass;

    this._animateTime = 400;
    this._timer = null;

    // Set width of desc element
    this.Item.each(function () {
        $(this).find(".mstHdr_MenuLinkDesc").each(function () {
            var item = $(this);
            item.width(item.width() + 1);
        });
    });

    // Wire events
    this.Item.hover($.proxy(this.ItemHover, this), $.proxy(this.ItemUnhover, this));

    this.StartHideDesc(null);
};

Mst.AnimHeaderItem.prototype = {

    ItemHover: function (e) {
        e.preventDefault();
        this.ShowDesc(e);
    },

    ItemUnhover: function (e) {
        e.preventDefault();
        this.StartHideDesc(e);
    },

    StartHideDesc: function (e) {
        if (this._timer == null)
            this._timer = window.setTimeout($.proxy(this.HideDesc, this), 3000);
        else
            this.HideDesc(e);
    },

    ShowDesc: function (e) {
        this.ClearTimer();
        $(this._descClass + " span", this.Item).animate({ width: "show" }, this._animateTime);
    },

    HideDesc: function (e) {
        this.ClearTimer();
        $(this._descClass + " span", this.Item).animate({ width: "hide" }, this._animateTime);
    },

    ClearTimer: function () {
        if (this._timer) {
            window.clearTimeout(this._timer);
            this._timer = null;
        }
    }
};
