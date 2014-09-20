(function() {
  var $storeLink = $("#mthdr04 a.mstHdr_MenuLinkAnchor"),
      linkHref = $storeLink.attr("href"),
      newLinkHref = "http://www.microsoftstore.com/store/msstore/home?WT.mc_id=SMCMSCOM_ENUS_NAV_BUYALL";
      
  if (typeof linkHref === 'string' && linkHref.length > 0) {
    $(".mstHdr a[href='" + linkHref + "']").attr("href", newLinkHref);
  }
})();
