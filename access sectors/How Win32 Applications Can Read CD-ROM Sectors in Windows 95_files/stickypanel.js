Callback_RelatedTags = function(data)
{
    modifyWebpart( document.getElementById('divRelTags'), data, '/library/images/support/cn/gss_sticky_panel_rtags.png' );
}

Callback_RelatedContent = function(data)
{
    modifyWebpart( document.getElementById('divRelContent'), data, '/library/images/support/cn/gss_sticky_panel_rc.png' );
}


function modifyWebpart( wpdiv, data, imgsrc )
{
    if (!data || data == null)
        return;
        
    if ( !wpdiv)
        return;

    addCommonContainer();
    
    var titlediv = document.createElement('div');
    var icon = document.createElement('img');
    var text = document.createElement('span');

    titlediv.className = 'gss_stickytitle_div';
    icon.className = 'gss_stickytitle_img';
    text.className = 'gss_stickytitle_span';

    wpdiv.style.display = "block";
    wpdiv.innerHTML = data;

    // get the title from the H3 tag and remove the h3 tag
    var h3 = wpdiv.getElementsByTagName('h3')[0];
    var title = '';
    if ( h3 )
    {
        title = h3.childNodes[0].innerHTML;
        var h3parent = h3.parentNode;
        h3parent.removeChild( h3 );
    }

    icon.src = imgsrc;
    text.innerHTML = '<h6>' + title + '</h6>';
    titlediv.appendChild(icon);
    titlediv.appendChild(text);

    wpdiv.insertBefore(titlediv, wpdiv.childNodes[0]);
}

// add the common container div that will contain both webparts
function addCommonContainer()
{
    if ( null == document.getElementById('gss_sticky_container_div')) // run only once
    {    
        var divRelTags = document.getElementById('divRelTags');
        var divRelCont = document.getElementById('divRelContent');
        if ( divRelTags==null && divRelCont==null)
            return;
            
        if ( divRelTags )
            divRelTags.className = 'gss_stickywebpart_div';
        if ( divRelCont )
            divRelCont.className = 'gss_stickywebpart_div';
        
        var bottomdiv = null;
        var topdiv = null;
        if ( divRelTags!=null && divRelCont==null)
            bottomdiv = topdiv = divRelTags;
        if ( divRelCont!=null && divRelTags==null)
            bottomdiv = topdiv = divRelCont;
            
        if ( bottomdiv == null )
        {
            // when both webparts are displayed determine if the Related Tags 
            // is on top of the Related Content, or vice versa
            var isTagsOnTop = true;
            var div = divRelTags.previousSibling;
            while ( div != null )
            {
                if ( div.id == divRelCont.id )
                {
                    isTagsOnTop = false;
                    break;            
                }
                div = div.previousSibling;
            }
            topdiv = isTagsOnTop ? divRelTags : divRelCont;
            bottomdiv = isTagsOnTop ? divRelCont : divRelTags;
        }
        
        var containerdiv = document.createElement('div');
        containerdiv.id = 'gss_sticky_container_div';
        
        var parentNode = document.getElementById('thinColumn');
        parentNode.insertBefore( containerdiv, bottomdiv.nextSibling );
        
        bottomdiv.className += ' gss_stickywebpart_bottom_div';
        
        // add the top curve as an image
        var img = document.createElement('img');
        img.id = 'gss_stickyheader_img';
        img.src = '/library/images/support/cn/gss_sticky_panel_top.png';
        containerdiv.appendChild(img);

        // add the inner div
        var div = document.createElement('div');
        div.id = 'gss_stickyinner_div';
        containerdiv.appendChild(div);
        
        // add the webparts to the inner div
        if ( topdiv )
            div.appendChild(topdiv);            
        if ( bottomdiv )
            div.appendChild(bottomdiv);
            
        // add the bottom curve as an image
        img = document.createElement('img');
        img.id = 'gss_stickywatermark_img';
        img.src = '/library/images/support/cn/gss_sticky_panel_watermark.png';
        div.appendChild(img);
        
        // add the top curve as an image
        img = document.createElement('img');
        img.id = 'gss_stickyfooter_img';
        img.src = '/library/images/support/cn/gss_sticky_panel_footer.png';
        containerdiv.appendChild(img);
        

        div = document.getElementById('thinColumn');
        if ( div )
        {
            var cn = div.parentNode.className;
            if ( cn.indexOf('gss_rightnav_withshadow') == -1)
                div.parentNode.className += ' gss_rightnav_withshadow';
        }            
    }
}
