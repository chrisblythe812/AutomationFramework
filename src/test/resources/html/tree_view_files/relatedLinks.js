/**
 * Contains all required classes, methods,attributes for the Widget
 * @fileoverview relatedLinks.js
 */

/**
 * Contains all the methods and attributes to create the class
 * @extends Menu
 */
var Related = Class.create(Menu,
{
	/**
	* contains the related links class that the main class will create
	* @type object
	*/
	__relatedLinksSuper: null,
	
	/**
	* Intialize the widget and build and render the menu
	* @param {Object} $super
	* @param {Object} id
	* @param {Object} options
	*/
	initialize: function($super, id, options) {
		$super(id,options);	
		if(global.usettingsJson.EWS.o_99ekm=='X'){
			this.__relatedLinksSuper=new Related_06(id, options);
		}else{
			this.__relatedLinksSuper=new Related_04(id, options);
		}
		
	},
	
	/**
	* Show the Menu
	* @param {Object} $super
	* @param {Object} element
	*/
	show: function($super, element) {
		$super(element);
		//IE needs to manually call child methods
		if(Prototype.Browser.IE){
			this.__relatedLinksSuper.show(element);
		}
	}
		
});


/**
* Related links for version 2.04
* @extends menu
*/
var Related_04 = Class.create(Menu,
/**
* @lends Related
*/
{
relatedLinksCheck: null,

initialize: function($super, id, options) {
    $super(id, options);
    this.onOpenApplicationHandlerBinding = this.onOpenApplicationHandler.bindAsEventListener(this);
    document.observe("EWS:changeScreen", this.onOpenApplicationHandlerBinding);
},
/**
* This method refreshes related links items when the current application change.
* @param {Object} event Event object, automatically passed when when the event is fired
*/

onOpenApplicationHandler: function(event) {

    /*var args = getArgs(event);
    this.appId = args.appId;
    this.tabId = args.tabId;*/

},
/**
* Draws the related links menu.
* @param {Element} element Where the menu will be shown
*/
show: function($super, element) {
    $super(element);
    this.getRelatedLinks();
    /*if (this.appId && this.tabId) {
    this.getRelatedLinks();
    } else {
    this.changeTitle(global.getLabel('RelatedLinks'));
    this.changeContent('');
    }
    this.appId = '';
    this.tabId = '';*/
},

/**
* Request related links list
* @param {String} appID the current application ID
*/
getRelatedLinks: function() {
    this.makeAJAXrequest($H({ xml:
            '<EWS><SERVICE>ECM_GET_RELLNK</SERVICE><OBJECT TYPE=""/><DEL/><GCC/><LCC/><PARAM><app_id>' + global.currentApplication.appId + '</app_id><tab_id>' + global.currentApplication.tabId + '</tab_id><view_Id>' + global.currentApplication.view + '</view_Id></PARAM></EWS>'
            , successMethod: 'buildRelatedLinks'
            , xmlFormat: false
    }));
},
/**
* Build the related links items
* @param {Object} json the response
*/
buildRelatedLinks: function(json) {



    this.changeTitle(global.getLabel('RelatedLinks'));
    var content = new Element("div", {
        id: "relatedlinks_menu_content"
    });
    //Object.jsonPathExists(json, 'EWS.o_rel_links.yglui_str_ecm_rel_links.items.yglui_str_ecm_rellink')
    if (json.EWS.o_rel_links.yglui_str_ecm_rel_links.items) {

        var items;
        if (json.EWS.o_rel_links.yglui_str_ecm_rel_links.items.yglui_str_ecm_rellink.length) {
            items = json.EWS.o_rel_links.yglui_str_ecm_rel_links.items.yglui_str_ecm_rellink;
        } else {
            items = Array(json.EWS.o_rel_links.yglui_str_ecm_rel_links.items.yglui_str_ecm_rellink);
        }

        items.each(function(item) {
            var rlSpan = new Element("span", { 'class': 'application_action_link' }).update(item['@link_label']);
            content.insert(
            new Element("div", { 'class': 'related_container' }).update(rlSpan)
        );
            if (item['@link_url'].indexOf('http://') >= 0 || item['@link_url'].indexOf('https://') >= 0) {

                rlSpan.update('<a href="' + item['@link_url'] + '" target="_blank" class="application_action_link">' + item['@link_label'] + '</a>');
            } else {

                rlSpan.observe("click", this.openApplication.bindAsEventListener(this, item['@link_url']));
            }
        } .bind(this));

        if (items.length == 0) {
            content.insert(new Element("div", { 'class': 'related_container' }).update('<span>' + global.getLabel('NO_RL_FOUND') + '</span>'));
        }
    } else {
        content.insert(new Element("div", { 'class': 'related_container' }).update('<span>' + global.getLabel('NO_RL_FOUND') + '</span>'));
    }
    this.changeContent(content);
},


openApplication: function(event, appClass) {
    appClass = appClass.split(',');
    global.open($H({
        app: {
            appId: appClass[1],
            tabId: appClass[0],
            view: appClass[2]
        }
    }));
}

});


/**
 * Contains all required classes, methods,attributes for the Widget
 * @fileoverview relatedLinks.js
 */

/**
 * Contains all the methods and attributes to create the class
 * @extends Menu
 */
var Related_06 = Class.create(Menu,
{
	
	/**
	* Edit mode 
	* @type Boolean
	*/
	__editMode: false,
	/**
	* Root menu for widget
	* @type Element
	*/
	__rootMenu: null,
	/**
	* Edit context menu
	* @type Element
	*/
	__editMenu: null,
	/**
	* Personaliztion status
	* @type boolean
	*/
	__personalized: true,
	/**
	* Simulation Mode
	* @type Boolean
	*/
	__editSimulation: null,
	/**
	* Check if this instance is first Run
	* @type Boolean
	*/
	__firstRun: null,
	/**
	* List of accepted protocol types
	* @type Array
	*/
	/**
	* Option element of whole widget
	* @type Element
	*/
	optionsButton: null,
	protocolList: $A(['http://','https','ftp://','sftp://','mailto://','file://','dav://','news://','nntp://','rtsp://','xmpp://','callto://','skype://','aim://','gtalk://','irc://','ircs://','itms://','notes://','ymsgr://','tel://']),
	/*Related Links Properties*/
	/**
	* related link page length
	* @type Array
	*/
	__pageLength: $A(),
	/**
	* current Related link page
	* @type integer
	*/
	__rlPage: 0,
	/**
	* temporary storage for previous related link
	* @type object
	*/
	__rlPageTemp: null,
	/**
	* Selected node (used for drag and drop)
	* @type Element
	*/
	__selectedcurrent: null,
	/**
	* Node before selected node( used for drag and drop)
	* @type Element
	*/
	__selectedprev: null,
	/**
	* Node after selected node(used for drag and drop)
	* @type Element
	*/
	__selectednext: null,
	/**
	* Current Start Page title
	* @type String
	*/
	startPageTitle: null,
	/**
	* Current Start Page Id
	* @type Integer
	*/
	startPageId: null,
	/**
	* Start Page Content Id
	* @type Integer
	*/
	startPageContentId: null,
	/**
	* Holds all previously opened related links
	* @type Array
	*/
	relatedLinksCache: $H(),
	/*Jump To List Properties */
	/**
	* Jump to list autoCompleter
	* @type Element
	*/
	jumpToListAutocompleter: null,
	/**
	* Holds jump to list 
	* @type Array
	*/
	__jumplist: null,
	/**
	* Option button element for jump to list
	* @type Element
	*/
	optionsButtonJump: null,
	/**
	* Jump to list Content Id
	* @type Ingteger
	*/
	jumpContentId: null,
	/**
	* Selected Menu
	* @type string
	*/
	selectedMenu: null,
	/**
	* Stores all previously opened jump to list
	* @type Array
	*/
	jumptToListCache: $H(),
	/*Recently Viewed Pages Properties*/
	/**
	* recently visited pages length
	* @type Array
	*/
	__pageLengthRV: $A(),
	/**
	* recently visited pages JSON
	* @type Object
	*/
	__recPages: null,
	/**
	* recently visited current Page
	* @type Ingteger
	*/
	rvPage: 1,
	/**
	* If Recently Visited pages is open
	* @type Boolean
	*/
	recentlyViewedOpen: false,
	/**
	* Contains the previous opened sub menu (before being undefined)
	* @type Object
	*/
	prevSbmid: null,
	/**
	* Contains the flag to check whether jump to list should be included
	* @type Object
	*/
	__jumpToListOn: null,
		/**
	* Contains the flag to check whether recently visisted should be included
	* @type Object
	*/
	__recentlyViewedOn: null,
	
	startPageIdTab: null,
	//relatedLinksCheck: null,
	__pagesOpen: $A(),

	
	/**
	* Intialize the widget and build and render the menu
	* @param {Object} $super
	* @param {Object} id
	* @param {Object} options
	*/
	initialize: function($super, id, options) {
		$super(id, options);
		this.__firstRun=true;
		this.changeTitle(global.getLabel('RelatedLinks'));
		this.mainContainer = this.build();
		this.changeContent(this.mainContainer);
		if(!$('km_auth_mode'))
		var authBar = new AuthBar();
	},
	
	/**
	* Show the Menu
	* @param {Object} $super
	* @param {Object} element
	*/
	show: function($super, element) {
		$super(element);

		//if (Prototype.Browser.IE){
			this.setObservers();
			this.checkSubMenu();
			this.__editMode =global.kmAuthModeEnabled;
			this.__pageLengthRV.clear();
			this.__pageLength.clear();
			this.checkWidgetFeatures();
			//this.relatedLinksCheck = false;
		/* }else{
			if(this.relatedLinksCheck==true){
				this.setObservers();
				this.checkSubMenu();
				this.__editMode =global.kmAuthModeEnabled;
				this.__pageLengthRV.clear();
				this.__pageLength.clear();
				this.checkWidgetFeatures();
				this.relatedLinksCheck = false;
			}
		} */
	},
	
	checkSubMenu: function(){
		if(!Object.isUndefined(global.currentApplication.sbmid)){
			this.prevSbmid = global.currentApplication.sbmid;
		}
	},
	
	/**
	* Check the status of the Jump to list
	* @param {Boolean} editMenu
	*/
	checkJumptoList: function(editMenu) {
		var cSbmid;
		if(!Object.isUndefined(global.currentApplication.sbmid)){
			cSbmid = global.currentApplication.sbmid;
		}else{
			cSbmid = this.prevSbmid;
		}
		
		if(editMenu){
			this.getJumpToList();
		}else{
			var isChached = this.jumptToListCache.get(global.currentApplication.mnmid+'_'+cSbmid);
			if(Object.isUndefined(isChached) || isChached == null){
				this.getJumpToList();
			}else{
				this.buildJumpToList(isChached);
			}
		}
		this.selectedMenu = global.currentApplication.sbmid;
		
	},
	
	/**
	* Set Widget Observers
	*/
	setObservers: function() {
		document.observe('EWS:kmAuthModeChanged', function(e) {
			this.relatedLinksCache= $H();
			this.jumptToListCache= $H();
			this.__editMode = global.kmAuthModeEnabled;
			this.__personalized = !(global.kmAuthModeEnabled)
			this.setWidgetAuthMode();
			this.initWidgetContent(null,global.kmAuthModeEnabled);
		} .bindAsEventListener(this));
		
		document.observe('EWS:kmAuthSimulationChanged', function(e) {
			this.__editSimulation = global.kmAuthSimulationEnabled;
		} .bindAsEventListener(this));
		
		document.observe('EWS:kmAuthStatusChanged', function(e) {
			this.__editStatus = global.kmAuthStatus;
		} .bindAsEventListener(this));
	
	},
	
	/*
	*Check what features should be included in the widget
	* 
	*/
	checkWidgetFeatures: function(){
		if (this.__firstRun) {
			this.mainContainer = this.build();
			this.changeContent(this.mainContainer);
		
			this.makeAJAXrequest($H({ xml:
				'<EWS>' +
				'	<SERVICE>KM_GET_PARAM</SERVICE>' +
				'	<PARAM>' +
				'	</PARAM>' +
				'</EWS>'
				, successMethod: 'initWidgetContent'
			}));
		}else{
			this.initWidgetContent();
		}
	},
	
	/**
	
	/**
	* Initialize Widget Content
	* @param {Object} editMode
	*/
	initWidgetContent: function(json,editMode) {
	
		this.__rlPage = 1;
		this.__pagesOpen =$A();
	
		if(json){
			this.__jumpToListOn = (json.EWS.o_99jtl == 'X')? true: false;
			this.__recentlyViewedOn = (json.EWS.o_99rvp =='X')? true: false;
		}
		
		if (this.__firstRun) {
			if (Prototype.Browser.IE){
				this.mainContainer = this.build();
				this._content = this.mainContainer;
			}			
			this.buildWidgetAuthButton();
			this.selectedMenu = global.currentApplication.sbmid;
			this.getRelatedLinks();
			if(this.__recentlyViewedOn){
				this.buildRecentlyVisitedPages();
			}
			if(this.__jumpToListOn){
				this.buildJumpToListAutoComplter();
				this.setJumpToListObserver();
				this.checkJumptoList(editMode);
			}
			this.getContentTitle();
		}else {
			if (Prototype.Browser.IE){
				this.mainContainer = this.build();
				this.changeContent(this.mainContainer);
				this.buildWidgetAuthButton();
			}
			this.buildWidgetAuthButton();
			this.checkRelatedLink();
			if(this.__recentlyViewedOn){
				this.buildRecentlyVisitedPages();
			}
			if(this.__jumpToListOn){
				$('jumpToListAutocompleter').update();
				this.buildJumpToListAutoComplter();	
				this.checkJumptoList(editMode);
			}
		}
		this.__firstRun = false;
		
	},
	
	/**
	* Check,Set and build build Widget Authoring button
	*/
	buildWidgetAuthButton: function(){
	//var o = $('rl_menu_widgets_optionsButton');
		if (!$('rl_menu_widgets_optionsButton')) {
			this.optionsButton = new Element('div', {
				'class': 'km_widget_option_button menus_align_icon',
				'id': 'rl_menu_widgets_optionsButton',
				'title': 'Options'
			});
			this.widget.widgetTitle.insert(this.optionsButton);
			this.optionsButton.observe('click', function(e) {
				this.__rootMenu.show(e);
			} .bindAsEventListener(this));
		} else {
			this.optionsButton.show();
		}
		var mitems1 =
			[
				{ name: global.getLabel('KM_ADD_LINK') + '...', callback: this.addLink.bindAsEventListener(this) },
				{ name: (!this.__personalized) ? global.getLabel('KM_W_PERSONALIZATION') : '<span class=application_main_soft_text>' + global.getLabel('KM_W_PERSONALIZATION') + '</span>', callback: (!this.__personalized) ? this.setPersonalizationOn.bindAsEventListener(this) : '' },
				{ name: (this.__personalized) ? global.getLabel('KM_WO_PERSONALIZATION') : '<span class=application_main_soft_text>' + global.getLabel('KM_WO_PERSONALIZATION')  + '</span>', callback: (this.__personalized) ? this.setPersonalizationOff.bindAsEventListener(this) : '' }
	
			];
		this.__rootMenu = new Proto.Menu({
			menuItems: mitems1
		});
		this.setWidgetAuthMode();
	},
	
	/**
	* build jump to list AutoComplter
	*/
	buildJumpToListAutoComplter: function(){

	var json = {
		autocompleter: {
			object: [],
			multilanguage: {
				no_results: global.getLabel('DML_NO_RESULTS'),
				search: global.getLabel('DML_SEARCH')
			}
		}
	}
	
	this.jumpToListAutocompleter = new JSONAutocompleter('jumpToListAutocompleter', {
				showEverythingOnButtonClick: true,
				timeout: 5000,
				templateResult: '#{text}',
				templateOptionsList: '#{text}',
				minChars: 1,
				label: global.getLabel('KM_WHAT_TO_DO_WHEN_I') + '...',
				events: $H({ onResultSelected: 'EWS:jumpTolistSelected' })
	}, json);
	

	
	},
	
	setJumpToListObserver: function(){
	 	document.observe('EWS:jumpTolistSelected', function(e) {
			this.openJumpTolistLink(e)
			this.jumpToListAutocompleter.changeLabel(global.getLabel('KM_WHAT_TO_DO_WHEN_I'));
		} .bindAsEventListener(this));  
	},
	
	/**
	* Check if related links exist in cache 
	*/
	checkRelatedLink: function(){
	if(!this.__editMode){
		var isChached = this.relatedLinksCache.get(global.currentApplication.appId+'_'+global.currentApplication.tabId+'_'+global.currentApplication.view);
		if(Object.isUndefined(isChached) || isChached == null){
			//var loc = this.__pagesOpen.indexOf(this.__rlPage);
			//debugger;
			//if(loc==-1){
				this.getRelatedLinks();
				//this.__pagesOpen.push(this.__rlPage);
			//}
		}
		else{
			this.buildRelatedLinks(isChached);
		}
	}else{
		this.getRelatedLinks();
	}
	},
	
	
	/**
	* Get the start page of the current Menu and sub menu
	*/
	getStartPage: function() {
	this.makeAJAXrequest($H({ xml:
		'<EWS>' +
		'	<SERVICE>KM_GET_STRT_PAG</SERVICE>' +
		'	<PARAM>' +
		'		<I_V_SUB_AREA_ID>' + global.currentApplication.sbmid + '</I_V_SUB_AREA_ID>' +
		'	</PARAM>' +
		'</EWS>'
		, successMethod: function(json) {
		    if (json.EWS.o_v_start_page == null){
		        this.startPageId = 'TST_SPAG'
				this.startPageIdTab = global.currentApplication.tabId;			
			}
		    else{
		        //this.startPageId = json.EWS.o_v_start_page;
				if(json.EWS.o_v_start_page.endsWith('_SPAG')){
					var x =global.getAppIdByTabId(json.EWS.o_v_start_page);
					if(x){
						this.startPageIdTab = json.EWS.o_v_start_page;
						this.startPageId = json.EWS.o_v_start_page;
					}else{
						this.startPageId = 'TST_SPAG';
						this.startPageIdTab = global.currentApplication.tabId;
					}
				}else{
					this.startPageId = 'TST_SPAG';
					this.startPageIdTab = global.currentApplication.tabId;
				}
				
			}
		} .bind(this)
	}));
	},
	
	/**
	* Get the users recently visited pages
	*/
	getRecentlyVisitedPages: function() {
	//debugger;
	this.makeAJAXrequest($H({ xml:
		'<EWS>' +
		'	<SERVICE>KM_GET_REC_PAGE</SERVICE>' +
		'	<OBJECT TYPE=""/>' +
		'	<DEL/>' +
		'	<GCC/>' +
		'	<LCC/>' +
		'	<PARAM>' +
		'		<I_V_PAGE_NO>' + this.rvPage + '</I_V_PAGE_NO>' +
		'	</PARAM>' +
		'</EWS>'
		, successMethod: function(json) {
		    this.__recPages = json;
			if(this.rvPage==1){
				if($('rvItems')){
					$('rvItems').update();
				}
				if($('rvShowMoreLess')){
					$('rvShowMoreLess').update();
				}
			}
			this.insertRecentlyVisitedPages(json);
		    //this.buildRecentlyVisitedPages();
		} .bind(this)
		, xmlFormat: false
	}));
	},
	
	/**
	* Get the content title of the Start Page
	*/
	getContentTitle: function() {
	document.fire("EWS:kmGetContentTitle");
	document.observe('EWS:kmSendContentTitle', function(e) {
	    this.startPageTitle = e.memo.value;
	    this.startPageContentId = e.memo.id;
	} .bindAsEventListener(this));
	},
	
	
	/**
	* Build the recently visisted pages area
	*/
	buildRecentlyVisitedPages: function() {	
	if (this.__recPages){
		var json = this.__recPages;
	}
	
	this.__recPages = json;
	
	var items;
	
	//if (!this.showMoreRv) {
	if($('rvContainer')){
	    $('rvContainer').update();
	}
	//}
	   
	
	if (!$('recentlyVisitedLink')) {
	    var recentlyVisitedLink = new Element("div", {
	        id: "recentlyVisitedLink",
	        'class': "recentlyVisitedLink"
	    });
	
	    var arrow = new Element("div", {
	        'class': 'rlArrow application_verticalR_arrow'
	    });

	    arrow.observe("click", this.expandCollapseRecentlyVisitedPages.bindAsEventListener(this));
	
	    var recentlyVisitedLabel = new Element("div").update(global.getLabel('KM_SHOW_RECENTLY_VISITED_PAGES'));
	    recentlyVisitedLink.insert(arrow);
	    recentlyVisitedLink.insert(recentlyVisitedLabel);
	    $('rvContainer').insert(recentlyVisitedLink);
	}
	
	if (!$('rvItems')) {
	    var rvItems = new Element("div", {
	        id: "rvItems",
	        'class': "rlItems"
	    });
	    $('rvContainer').insert(rvItems);
		$('rvItems').toggle();
	}
	
	if(this.recentlyViewedOpen){
		if(this.rvPage>1){
			this.rvPage=1;
		}
		this.expandCollapseRecentlyVisitedPages();
	}
	
	},
	
	/**
	* Insert and render the recently visited pages into the recently visited pages area
	* @param {Object} json
	*/
	insertRecentlyVisitedPages: function(json){
	var items;
	if (this.__recPages){
		var json = this.__recPages;
	}
	this.__recPages = json;
	
	if (!json.EWS.o_i_rec_visited_page) {
	    if ($$('#rvItems div.rlItem').length == 0) {
	
	        $('rvItems').update('<div>'+global.getLabel('KM_RL_HISTORY_EMPTY')+'</div>');
	
	        //this.expandCollapseRecentlyVisitedPages();
	    }
	    if (this.rvPage != 0)
	        this.rvPage--;
	} else {
	
	    if (json.EWS.o_i_rec_visited_page.yglui_str_ecm_recent_pages.length) {
	        items = json.EWS.o_i_rec_visited_page.yglui_str_ecm_recent_pages;
	
	    } else {
	        items = Array(json.EWS.o_i_rec_visited_page.yglui_str_ecm_recent_pages);
	    }
	    this.__pageLengthRV.push(items.length);
	    items.each(function(item) {
	        var rvItem = new Element("div", {
	            'class': "rlItem"
	        });
	
	        var rvLink = new Element("a", {
	            'class': "application_action_link",
	            'content_id': item['@content_id'],
	            'is_web_content': item['@is_web_cont']
	        });
	        if (!this.__editMode) {
	            rvLink.observe("click", this.openLink.bindAsEventListener(this));
	        }
			if(item['@cont_name']){
				rvLink.update(item['@cont_name']);
			}else{
				rvLink.update(item['@content_id']);
			}
	        
	        rvItem.insert(rvLink);
	        $('rvItems').insert(rvItem);
	
	    } .bind(this));
	
	}
	
	var showMoreLess = new Element("div", {
	    id: "rvShowMoreLess",
	    'class': "rvShowMoreLess application_action_link"
	});
	var showMore = new Element("div", {
	    id: "rvShowMore",
	    'class': "rvShowMore application_action_link"
	});
	
	showMore.update(global.getLabel('KM_SHOW_MORE') + '...');
	showMore.observe("click", this.rvShowMore.bindAsEventListener(this));
	
	showMoreLess.insert(showMore);
	if (!items || json.EWS.o_i_rec_visited_page == null){
		showMore.hide();
	}else{
		if(items.length<=4){
			showMore.hide();
		}
	}
	
	if (this.rvPage==2){
		showMore.hide();
	}
	
	if ($$('#rvItems div.rlItem').length > 5) {
	    var showLess = new Element("div", {
	        id: "rvShowLess",
	        'class': "rvShowLess application_action_link"
	    });
	    showLess.update('Show less...');
	    showLess.observe("click", this.rvShowLess.bindAsEventListener(this));
	    showMoreLess.insert(showLess);
	}
	$('rvContainer').insert(showMoreLess);
	
	},
	
	/**
	* Open the selected link
	* @param {Object} event
	*/
	openLink: function(event) {
	var a = event.element();
	var isWeb = (a.getAttribute('is_web_content') == "X") ? true : false;
	this.openApplication(a.getAttribute('content_id'), isWeb);
	},
	
	/**
	*Shows more recently visisted pages
	*/
	rvShowMore: function() {
	this.rvPage++;
	this.showMoreRv = true;
	$('rvShowMoreLess').remove();
	this.getRecentlyVisitedPages();
	},
	
	/**
	* Show less recently visited pages
	*/
	rvShowLess: function() {
	var length = $$('#rvItems div.rlItem').length;
	var lastLength = this.__pageLengthRV[this.__pageLengthRV.length - 1];
	this.__pageLengthRV.pop();
	for (i = length; i > length - lastLength; i--) {
	    $('rvItems').down('div.rlItem', i - 1).remove();
	}
	if (length <= 10) {
	    $('rvShowLess').remove();
	    $('rvShowMore').show();
	}
	if (this.rvPage != 0)
	    this.rvPage--;
	},
	
	/**
	* Get the jump to list of the current menu sub menu
	*/
	getJumpToList: function() {

		var cSbmid;
		if(!Object.isUndefined(global.currentApplication.sbmid)){
			cSbmid = global.currentApplication.sbmid;
		}else{
			cSbmid = this.prevSbmid;
		}
		
		var isAuthor = (this.__editMode) ? 'X' : '';
		var isSimulation = (this.__editSimulation) ? 'X' : '';
		this.makeAJAXrequest($H({ xml:
				'<EWS>' +
				'	<SERVICE>KM_GET_JUMP_TO</SERVICE>' +
				'	<PARAM>' +
				'		<I_V_AREA_ID>' + global.currentApplication.mnmid + '</I_V_AREA_ID>' +
				'		<I_V_SUBAREA_ID>' + cSbmid+ '</I_V_SUBAREA_ID>' +
				'		<I_V_AUTHOR>' + isAuthor + '</I_V_AUTHOR>' +
				'		<I_V_SIMULATION_ON>' + isSimulation + '</I_V_SIMULATION_ON>' +
				'	</PARAM>' +
				'</EWS>'
				, successMethod: function(json) {
					this.__jumplist = json;
					this.cacheJumpToList(json);
					this.buildJumpToList();
				} .bind(this)
				, xmlFormat: false
		}));
	
	},
	
	/**
	* Check if jump to list is not in cache, then cache.
	* @param {Object} json
	*/
	cacheJumpToList: function(json){
	if(!this.__editMode){
		var isChached = this.jumptToListCache.get(global.currentApplication.mnmid+'_'+global.currentApplication.sbmid);
		if(Object.isUndefined(isChached) || isChached == null){
			this.jumptToListCache.set(global.currentApplication.mnmid+'_'+global.currentApplication.sbmid, json);
		}
	}
	},
	
	
	/**
	* build jump to list autocompleter options
	* @param {Object} json
	*/
	
	buildJumpToList: function(json) {
	
	if(!json){
		if (this.__jumplist)
			var json = this.__jumplist;
	}
	
	if (json) {
		if (json.EWS.o_v_content_id) 
			this.jumpContentId = json.EWS.o_v_content_id;
	}
	var jsonObject = {
	    autocompleter: {
	        object: [],
	        multilanguage: {
	            no_results: global.getLabel('DML_NO_RESULTS'),
	            search: global.getLabel('KM_WHAT_TO_DO_WHEN_I') + '...'
	        }
	    }
	}
	var testParse = new XML.ObjTree();
	if (json) {
		if (json.EWS.o_v_content) {
			var jsonIn = testParse.parseXML(json.EWS.o_v_content);
			var items = jsonIn.CONTENT.LINKS.LINK;
			if (items.length) {
				for (var i = 0; i < items.length; i++) {
					jsonObject.autocompleter.object.push({
						data: items[i]['URL'],
						text: items[i]['DESCRIPTION']
					})
				}
			}
			else {
				jsonObject.autocompleter.object.push({
					data: items.URL,
					text: items.DESCRIPTION
				})
			}
		}
	}
	this.jumpToListAutocompleter.updateInput(jsonObject);
	
	},
	
	/**
	* Open selected jump to list link
	* @param {Object} evt
	*/
	openJumpTolistLink: function(evt) {
	
	var launch = false;
	URL = evt.memo.idAdded;
	if(URL){
		if (isNaN(URL)) {
		
			this.protocolList.each(function(protocol) {
				if (URL.toUpperCase().startsWith(protocol.toUpperCase())) {
					window.open(URL)
					launch = true;
					throw $break;
				}
			} .bind(this));
		
			if (!launch) {
				var appTabView = URL.split('/')
				if (appTabView != URL) {
					this.launchApplication({
						'app': appTabView[1],
						'tab': appTabView[0],
						'view': appTabView[2]
					});
				}
				else {
					var webId = URL.split(':');
					if (webId[1] == 'true') {
						this.openApplication(webId[0], true)
					}
					else {
						this.openApplication(webId[0], false)
					}
				}
		
			}
		}
		else {
			this.openApplication(URL, true)
		}
	}
	},
	
	
	/**
	* Set Jump to list and related link authoring mode on/off
	*/
	setWidgetAuthMode: function(){
		var isJumpOn = this.__jumpToListOn;
		if(this.__editMode){
			if (this.optionsButton) {
				this.optionsButton.show();
				if(isJumpOn){
					this.optionsButtonJump.show();
				}
			}
		}else{
			if (this.optionsButton) {
				this.optionsButton.hide();
				if(isJumpOn){
					this.optionsButtonJump.hide();
				}
			}
		}
		if(isJumpOn){
			this.optionsButtonJump.observe('click', function(e) {
				var mitemsJump = [{
					name: global.getLabel('KM_EDIT_JUMP_TO_LIST'),
					callback: this.editJumpToList.bindAsEventListener(this)
			}];
			
			this.__editMenu = new Proto.Menu({
				menuItems: mitemsJump
			});
			
			this.__editMenu.show(e);
			} .bindAsEventListener(this));
		}
	},
	
	/**
	* build Widget Main Area
	*/
	build: function() {
	
	var rlContent = new Element("div", {
		id: "rlContent",
		'class': "rlContent"
	});
	
	var jumpToList = new Element("div", {
		id: "jumpToListAutocompleter",
		'class': "jumpToList"
	});
	
	this.optionsButtonJump = new Element('button', {
		'id': 'opt_jump',
		'class': 'application_editSelection3',
		'style': 'border: 0 none;'
	})
	
	rlContent.insert(jumpToList);
	
	//jumpToList.insert(this.optionsButtonJump)
	rlContent.insert({'top':this.optionsButtonJump});
	this.optionsButtonJump.hide();
	
	var rlContainer = new Element("div", {
		id: "rlContainer",
		'class': "rlContainer"
	});
	rlContent.insert(rlContainer);
	
	var rvContainer = new Element("div", {
		id: "rvContainer",
		'class': "rvContainer"
	});
	rlContent.insert(rvContainer);
	
	return rlContent;
	},
	
	/**
	* Open the current jump to list for editing
	*/
	editJumpToList: function() {
	
		var cSbmid;
		if(!Object.isUndefined(global.currentApplication.sbmid)){
			cSbmid = global.currentApplication.sbmid;
		}else{
			cSbmid = this.prevSbmid;
		}
	
		this.makeAJAXrequest($H({ xml:
		'<EWS>' +
			'<SERVICE>KM_CHK_OU_WEB2</SERVICE>' +
				'<OBJECT TYPE=""/>' +
			   '<DEL/><GCC/><LCC/>' +
			   '<PARAM>' +
			  '<I_V_CONT_ID>' + this.jumpContentId + '</I_V_CONT_ID>' +
			  '</PARAM>' +
		'</EWS>',
			successMethod: function(json) {
				global.open($H({
					app: {
						tabId: global.currentApplication.tabId,
						appId: 'TST_SPAG',
						view: 'StartPage',
						sbmid: cSbmid,
						mnmid: global.currentApplication.mnmid
					},
					createContent: true,
					contentID: json.EWS.o_v_new_cont_id
				}));
			} .bind(this)
		}));
	},
	
	/**
	* Set personalization mode on
	*/
	setPersonalizationOn: function() {
	this.__personalized = true;
	this.initWidgetContent();
	},
	
	/**
	* Set personalization mode off
	*/
	setPersonalizationOff: function() {
	this.__personalized = false;
	this.initWidgetContent();
	},
	
	/**
	* Expand and collapse the recently visited pages
	* @param {Object} evt
	*/
	expandCollapseRecentlyVisitedPages: function(evt) {
	var x = $('rvItems').childElements().size() ;
	if($('rvItems').childElements().size()>0){
	
		var span = $('recentlyVisitedLink').down();
		if (span.hasClassName('application_verticalR_arrow')) {
			span.removeClassName('application_verticalR_arrow');
			span.addClassName('application_down_arrow');
			this.recentlyViewedOpen = true;
		} else {
			span.removeClassName('application_down_arrow');
			span.addClassName('application_verticalR_arrow');
			this.recentlyViewedOpen = false;
		}
		
		$('rvItems').toggle();
		if ($('rvShowMoreLess')){
			$('rvShowMoreLess').toggle();
		}
		
	}else{
		this.getRecentlyVisitedPages();
		var span = $('recentlyVisitedLink').down();
		if (span.hasClassName('application_verticalR_arrow')) {
			span.removeClassName('application_verticalR_arrow');
			span.addClassName('application_down_arrow');
			this.recentlyViewedOpen = true;
		}else {
			span.removeClassName('application_down_arrow');
			span.addClassName('application_verticalR_arrow');
			this.recentlyViewedOpen = false;
		}	
		$('rvItems').toggle();
	}
	
	
	},
	/**
	* Build dyanmic link parameters and get related links
	* 
	*/
	getRelatedLinks: function() {
	
	var personal = (this.__personalized) ? 'X' : '';
	var isAuthor = (this.__editMode) ? 'X' : '';
	var isSimulation = (this.__editSimulation) ? 'X' : '';
	
	var dynamicLinkParameters;
	if (this.startPageContentId || this.startPageTitle) {
	
	    dynamicLinkParameters = '<I_V_DYNAMIC>'
	    if (this.startPageTitle)
	        dynamicLinkParameters += this.startPageTitle
	    dynamicLinkParameters += ' ';
		
	    if (this.startPageContentId)
	        dynamicLinkParameters += this.startPageContentId.toString();
	    dynamicLinkParameters += ' ';
	
		if(global.getLabel(global.currentApplication.appId).startsWith('<span class')==false){
			dynamicLinkParameters += global.getLabel(global.currentApplication.appId);
			dynamicLinkParameters += ' ';
		}
	    
	    if(global.getLabel(global.currentApplication.tabId).startsWith('<span class')==false){
			dynamicLinkParameters += global.getLabel(global.currentApplication.tabId);
			dynamicLinkParameters += ' ';
		}
	
	    if(global.getLabel(global.currentApplication.view).startsWith('<span class')==false){
			dynamicLinkParameters += global.getLabel(global.currentApplication.view);
			dynamicLinkParameters += ' ';
		}
	    
	    dynamicLinkParameters += '</I_V_DYNAMIC>'
	}
	else {
				
	    dynamicLinkParameters = '<I_V_DYNAMIC>'
		
		if(global.getLabel(global.currentApplication.appId).startsWith('<span class')==false){
			dynamicLinkParameters += global.getLabel(global.currentApplication.appId);
			dynamicLinkParameters += ' ';
		}
	    
	    if(global.getLabel(global.currentApplication.tabId).startsWith('<span class')==false){
			dynamicLinkParameters += global.getLabel(global.currentApplication.tabId);
			dynamicLinkParameters += ' ';
		}
	
	    if(global.getLabel(global.currentApplication.view).startsWith('<span class')==false){
			dynamicLinkParameters += global.getLabel(global.currentApplication.view);
			dynamicLinkParameters += ' ';
		}
	   
	    dynamicLinkParameters += '</I_V_DYNAMIC>';
	}
	
	//debugger;
	var loc = this.__pagesOpen.indexOf(this.__rlPage);
		if(loc==-1){
			this.__pagesOpen.push(this.__rlPage);
			this.makeAJAXrequest($H({ xml:
			'<EWS>' +
				'<SERVICE>KM_GET_REL_LINK</SERVICE>' +
				'<DEL/>' +
				'<PARAM>' +
					'<I_V_APPID>' + global.currentApplication.appId + '</I_V_APPID>' +
					'<I_V_TABID>' + global.currentApplication.tabId + '</I_V_TABID>' +
					'<I_V_VIEWID>' + global.currentApplication.view + '</I_V_VIEWID>' +
					'<I_V_IS_PERSONALIZATION>' + personal + '</I_V_IS_PERSONALIZATION>' +
					'<I_V_IS_AUTHOR>' + isAuthor + '</I_V_IS_AUTHOR>' +
					'<I_V_PAGE>' + this.__rlPage + '</I_V_PAGE>' +
					'<I_V_SIMULATION_ON>' + isSimulation + '</I_V_SIMULATION_ON>' +
					dynamicLinkParameters +
				'</PARAM>' +
				'</EWS>'
				, successMethod: function(json){
					this.cacheRelatedLink(json);
					this.buildRelatedLinks(json);
				}.bind(this)
				, xmlFormat: false
			}));
		}
	},
	
	/**
	* Cache the related link result
	* @param {Object} json
	*/
	cacheRelatedLink: function(json){
	if(!this.__editMode){
		var isChached = this.relatedLinksCache.get(global.currentApplication.appId+'_'+global.currentApplication.tabId+'_'+global.currentApplication.view);
		if(Object.isUndefined(isChached) || isChached == null){
			this.relatedLinksCache.set(global.currentApplication.appId+'_'+global.currentApplication.tabId+'_'+global.currentApplication.view, json);
		}
	}
	},
	
	/**
	* build related links
	* @param {Object} json
	*/
	buildRelatedLinks: function(json) {
	var items = new Array();
	if (json.EWS.o_i_rl_static) {
	    if (json.EWS.o_i_rl_static.yglui_str_ecm_km_rl_static.length) {
	        items = json.EWS.o_i_rl_static.yglui_str_ecm_km_rl_static;
	    } else {
	        items = Array(json.EWS.o_i_rl_static.yglui_str_ecm_km_rl_static);
	    }
	}
	if (items.length == 0 && this.__rlPage == 1) {
	    this.emptyRL();
	}
	else {
	    if (items.length > 0) {
	        this.__pageLength.push(items.length);
	    }
	    else {
	        this.__rlPage--;
	    }
	    this.buildRelatedLinksPage(items);
	}
	
	},
	
	/**
	* Insert a notification that no related links exist
	*/
	emptyRL: function() {
		if($("rlContainer")){
			$("rlContainer").update(global.getLabel('NO_RL_FOUND'));
		}
	},
	
	/**
	* Expand and collapse RL when selected
	* @param {Object} evt
	*/
	expandCollapseRL: function(evt) {
	
	var span = evt.element();
	if (span.hasClassName('application_verticalR_arrow')) {
	    span.removeClassName('application_verticalR_arrow');
	    span.addClassName('application_down_arrow');
	} else {
	    span.removeClassName('application_down_arrow');
	    span.addClassName('application_verticalR_arrow');
	}
	$('rlItems').toggle();
	$('showMoreLess').toggle();
	},
	
	/**
	* build and render related links. If authoring mode is on, create sortable class
	* @param {Object} items
	*/
	buildRelatedLinksPage: function(items) {
	
	if (!this.showMoreRl) {
	    $('rlContainer').update();
	} else {
	    this.showMoreRl = false;
	}
	if (!$('lookingFor')) {
	    var lookingFor = new Element("div", {
	        id: "lookingFor",
	        'class': "lookingFor"
	    });
	
	    var arrow = new Element("div", {
	        'class': 'application_down_arrow rlArrow'
	    });
	    arrow.observe("click", this.expandCollapseRL.bindAsEventListener(this));
	    var lookingForLabel = new Element("div").update(global.getLabel('KM_LOOKING_FOR') + '...');
	    lookingFor.insert(arrow);
	    lookingFor.insert(lookingForLabel);
	    $('rlContainer').insert(lookingFor);
	}
	if (!$('rlItems')) {
	    var rlItems = new Element("div", {
	        id: "rlItems",
	        'class': "rlItems"
	    });
	    $('rlContainer').insert(rlItems);
	}
	
	items.each(function(item) {
	    if (parseInt(item['@order_id']) >= 0) {
	        var rlItem = new Element("div", {
	            'class': "rlItem",
	            'id': 'items_' + parseInt(item['@order_id'], 10),
	            'order': parseInt(item['@order_id'], 10),
	            'content_id': parseInt(item['@rel_content_id'], 10),
	            'is_web_content': item['@is_web_content'],
	            'name': item['@cont_name']
	        });
	    }
	    else {
	        var rlItem = new Element("div", {
	            'class': "dynamic"
	        });
	    }
	    var rlLink = new Element("a", {
	        'class': "application_action_link",
	        'app_id': item['@app_id'],
	        'tab_id': item['@tab_id'],
	        'view_id': item['@view_id'],
	        'content_id': item['@rel_content_id'],
	        'is_web_content': item['@is_web_content']
	    });
	
	    if (!this.__editMode) {
	        rlLink.observe("click", this.openLink.bindAsEventListener(this));
	    }
	
	    if (this.__editMode) {
	        if (item['@cont_name'])
	            rlLink.update(item['@cont_name'].truncate(27));
	        else
	            rlLink.update(item['@rel_content_id'].truncate(27));
	    }
	    else {
	        if (item['@cont_name'])
	            rlLink.update(item['@cont_name'].truncate(28));
	        else
	            rlLink.update(item['@rel_content_id'].truncate(28));
	    }
	
	
	    rlItem.insert(rlLink);
	
	
	    if (this.__editMode) {
	
	
	        if (!rlItem.hasClassName('dynamic')) {
	            this.optionsButton2 = new Element('button', {
	                'id': 'opt_' + parseInt(item['@order_id']),
	                'class': 'application_editSelection2',
	                'style': 'margin-right: 5px; right: 10px; border: 0 none;padding-top:9px;border-color: transparent;'
	            })
	
	
	            rlItem.insert(this.optionsButton2);
	
	            this.optionsButton2.observe('click', function(e) {
	                var mitems1 = [{
	                    name: global.getLabel('KM_DELETE'),
	                    callback: this.deleteRelatedLink.bindAsEventListener(this)
	}];
	
	                    this.__selectedcurrent = e.target.parentNode.id;
	                    if (e.target.parentNode.previous('div')) {
	                        __selectedprev = e.target.parentNode.previous('div')//.previousElementSibling.id
	                        mitems1.push({
	                            name: global.getLabel('KM_MOVE_UP'),
	                            callback: this.moveUp.bindAsEventListener(this)
	                        });
	                    }
	                    else {
	                        __selectedprev = null;
	                        mitems1.push({
	                            name: '<span class=application_main_soft_text>' + global.getLabel('KM_MOVE_UP') + '</span>',
	                            callback: ''
	                        });
	                    }
	                    if (e.target.parentNode.next('div') && !e.target.parentNode.next('div').hasClassName('dynamic')) {
	                        __selectednext = e.target.parentNode.next('div')//rangeParent.nextElementSibling.id
	                        mitems1.push({
	                            name: global.getLabel('KM_MOVE_DOWN'),
	                            callback: this.moveDown.bindAsEventListener(this)
	                        });
	                    }
	                    else {
	                        __selectednext = null;
	                        mitems1.push({
	                            name: '<span class=application_main_soft_text>' + global.getLabel('KM_MOVE_DOWN') + '</span>',
	                            callback: ''
	                        });
	                    }
	                    this.__editMenu = new Proto.Menu({
	                        menuItems: mitems1
	                    });
	                    this.__editMenu.show(e);
	                } .bindAsEventListener(this));
	
	            }
	
	        } else {
	            if (this.optionsButton2) {
	                this.optionsButton2.hide();
	            }
	        }
	
	        $('rlItems').insert(rlItem);
	
	    } .bind(this));
	
	
	    if (this.__editMode) {
	
	        Sortable.create('rlItems', {
	            tag: 'div',
	            only: 'rlItem',
	            onUpdate: function(item) {
	                var y = item.childElements()
	                var childCount = y.length
	                var drag;
	                var drop;
	
	                for (var ctr = 0; ctr < childCount; ctr++) {
	                    temp = ctr + 1;
	                    if (parseInt(y[ctr].getAttribute('order'), 10) > parseInt(y[temp].getAttribute('order'), 10)) {
	
	                        num1 = y[ctr];
	                        num2 = y[temp];
	                        break;
	                    }
	                }
	
	                if (!num2.next('div')) {
	                    //moved to last //move down part 1
	                    drop = num1;
	                    drag = num2;
	                }
	                else if (parseInt(num1.readAttribute('order'), 10) < parseInt(num2.next('div').readAttribute('order'), 10)) {
	                    //movedown
	                    drop = num1;
	                    drag = num2;
	                }
	                else if (parseInt(num1.readAttribute('order'), 10) > parseInt(num2.next('div').readAttribute('order'), 10)) {
	                    //moveup
	                    drag = num1;
	                    drop = num2;
	                }
	                this.save({ 'action': 'R', 'order': drag.readAttribute('order'), 'orderDest': drop.readAttribute('order') })
	                for (var i = 0; i < childCount; i++) {
	                    temp = i + 1;
	                    y[i].setAttribute('order', temp);
	                    y[i].setAttribute('id', 'items_' + temp)
	                }
	
	            } .bind(this)
	        });
	
	    }
	
	    var showMoreLess = new Element("div", {
	        id: "showMoreLess",
	        'class': "showMoreLess application_action_link"
	    });
	
	    var showMore = new Element("div", {
	        id: "showMore",
	        'class': "showMore application_action_link"
	    });
	
	    showMore.update(global.getLabel('KM_SHOW_MORE') + '...');
	    showMore.observe("click", this.showMore.bindAsEventListener(this));
	
	    showMoreLess.insert(showMore);
	
	    if ($('rlItems').descendants('div').length >= 10 && this.__rlPage != 1) {
	        var showLess = new Element("div", {
	            id: "showLess",
	            'class': "showLess application_action_link"
	        });
	        showLess.update('Show less...');
	        showLess.observe("click", this.showLess.bindAsEventListener(this));
	        showMoreLess.insert(showLess);
	    }
	
	    $('rlContainer').insert(showMoreLess);
	
	    if (items.length < 5)
	        showMore.hide();
	    else
	        showMore.show();
	},
	
	/**
	* Delete selected related link
	* @param {Object} e
	*/
	deleteRelatedLink: function(e) {
		var cur = $(this.__selectedcurrent);
		var order = cur.getAttribute('order')
		var contentId = cur.getAttribute('content_id')
		this.save({ 'action': 'D', 'app': global.currentApplication.appId, 'tab': global.currentApplication.tabId, 'view': global.currentApplication.view, 'order': order, 'relconId': contentId, 'sMethod': 'deleteLinkSuccess' })
	},
	
	/**
	* Reinitialize element orders after drag and drop
	* @param {Object} item
	* @param {Object} location
	*/
	DragAndDrop: function(item, location) {
		if (item)
			var drag = item.readAttribute('order');
		if (location)
			var drop = location.readAttribute('order');
		
		var x = item;
		if (drag > drop) {
			for (var i = drop; i <= drag; i++) {
				x.setAttribute('order', i);
				x.setAttribute('id', 'items_' + i)
				x = x.next('div');
			}
		}
		else {
			var drop = item.previous('div').readAttribute('order');
			for (var i = drop; i >= drag; i--) {
				x.setAttribute('order', i);
				x.setAttribute('id', 'items_' + i)
				x = x.previous('div');
			}
		}
	},
	
	/**
	* Open Content browesr in a pop up and add a link
	* @param {Object} e
	*/
	addLink: function(e) {
		
		var html = new Element('div',{
			'id': 'link_'+this.__cid,
			'style': 'width:100%;'
		});

		var appDiv = new Element('div',{
			'id': 'app_ContentBrowser2'
		});
		html.update(appDiv);
		
		var kmm_ok_cancel = new Element('div',{
			'id': 'kmm_ok_cancel'
		});
		html.insert(kmm_ok_cancel);
		
		
		var popUp = new infoPopUp({
			closeButton: $H({
				'callBack': function() {
					popUp.close();
					delete popUp;
				}
			}),
			htmlContent: html,
			indicatorIcon: 'void',
			width: 800
		});
		popUp.create();
				
		var browser = new ContentBrowser({
			className: 'ContentBrowser2',
			appId: 'KM_BRWSR',
			multiSelect: false
		});
		
		
		browser.virtualHtml = $('app_ContentBrowser2');
		browser.run();
		
		browser.virtualHtml.down('.km_listCont').setStyle({
		  width: '75%',
		  float: 'left'
		});
		
		
		var json, appAC, tabAC, viewAC;
		var jn = { elements: [] };
		var cancel = {
			idButton: 'km_btn_cancel',
			label: global.getLabel('KM_CANCEL'),
			type: 'button',
			handler: function() {
				popUp.close();
				delete popUp;
			} .bind(this),
			standardButton: true
		};
		
		var submit = {
			idButton: 'km_btn_submit',
			label: global.getLabel('KM_OK'),
			type: 'button',
			handler: function() {
				var c = browser.getSelectedContent();
		
				if (c) {
					this.addRelatedLink({
						'action': 'link',
						'nodeId': this.__cid,
						'content': c || ''
					});
				}
				popUp.close();
				delete popUp;
			} .bind(this),
			standardButton: true
		};
		jn.elements.push(submit);
		jn.elements.push(cancel);
		btns = new megaButtonDisplayer(jn);
		$('kmm_ok_cancel').insert(btns.getButtons()); 
	
	},
	
	showSuccessMessage: function(json) {
	
	},
	
	
	/**
	* Save related link according to action done
	* @param {Object} args
	*/
	save: function(args) {
	args.app = global.currentApplication.appId;
	args.tab = global.currentApplication.tabId;
	args.view = global.currentApplication.view;
	var xmlin =
	'<EWS>' +
	'<SERVICE>KM_SET_REL_LINK</SERVICE>' +
	'<PARAM>' +
	  ((args.action) ? '<I_V_ACTION>' + (args.action || '') + '</I_V_ACTION>' : '') +
	  ((args.app) ? '<I_V_APPID>' + (args.app || '') + '</I_V_APPID>' : '') +
	  ((args.tab) ? '<I_V_TABID>' + (args.tab || '') + '</I_V_TABID>' : '') +
	  ((args.view) ? '<I_V_VIEWID>' + (args.view || '') + '</I_V_VIEWID>' : '') +
	  ((args.order) ? '<I_V_ORDERID>' + (args.order || '') + '</I_V_ORDERID>' : '') +
	  ((args.orderDest) ? '<I_V_ORDERID_DEST>' + (args.orderDest || '') + '</I_V_ORDERID_DEST>' : '') +
	  ((args.title) ? '<I_V_TITLE>' + (args.title || '') + '</I_V_TITLE> ' : '') +
	  ((args.relconId) ? '<I_V_RELCON_LINK>' + (args.relconId || '') + '</I_V_RELCON_LINK>' : '') +
	'</PARAM>' +
	'</EWS>';
	this.makeAJAXrequest($H({ xml: xmlin,
	    successMethod: ((args.sMethod) ? args.sMethod : 'showSuccessMessage')
	}));
	
	},
	
	/**
	* On Delete node succes refresh links
	* @param {Object} json
	*/
	deleteLinkSuccess: function(json) {
	this.showMoreRl = false;
	var temp = this.__rlPage;
	this.__rlPageTemp = this.__rlPage;
	this.__rlPage = 1;
	this.refreshLinks();
	},
	
	/**
	* Rebuild and refresh links (recursive function)
	*/
	refreshLinks: function() {
	var personal = (this.__personalized) ? 'X' : '';
	var isAuthor = (this.__editMode) ? 'X' : '';
	var isSimulation = (this.__editSimulation) ? 'X' : '';
	
	var dynamicLinkParameters;
	if (this.startPageContentId || this.startPageTitle) {
	    dynamicLinkParameters = '<I_V_DYNAMIC>'
	    if (this.startPageTitle)
	        dynamicLinkParameters += this.startPageTitle
	    dynamicLinkParameters += ' ';
	    if (this.startPageContentId)
	        dynamicLinkParameters += this.startPageContentId
	    dynamicLinkParameters += ' ';
	
		if(global.getLabel(global.currentApplication.appId).startsWith('<span class')==false){
			dynamicLinkParameters += global.getLabel(global.currentApplication.appId);
			dynamicLinkParameters += ' ';
		}
	    
	    if(global.getLabel(global.currentApplication.tabId).startsWith('<span class')==false){
			dynamicLinkParameters += global.getLabel(global.currentApplication.tabId);
			dynamicLinkParameters += ' ';
		}
	    
	    if(global.getLabel(global.currentApplication.view).startsWith('<span class')==false){
			dynamicLinkParameters += global.getLabel(global.currentApplication.view);
			dynamicLinkParameters += ' ';
		}
	    
	    dynamicLinkParameters += '</I_V_DYNAMIC>'
	}
	else {
	    dynamicLinkParameters = '<I_V_DYNAMIC>'
		
		if(global.getLabel(global.currentApplication.appId).startsWith('<span class')==false){
			dynamicLinkParameters += global.getLabel(global.currentApplication.appId);
			dynamicLinkParameters += ' ';
		}   
	
	    if(global.getLabel(global.currentApplication.tabId).startsWith('<span class')==false){
			dynamicLinkParameters += global.getLabel(global.currentApplication.tabId);
			dynamicLinkParameters += ' ';
		}
	    
	    if(global.getLabel(global.currentApplication.view).startsWith('<span class')==false){
			dynamicLinkParameters += global.getLabel(global.currentApplication.view);
			dynamicLinkParameters += ' ';
		}
	    
	    dynamicLinkParameters += '</I_V_DYNAMIC>'
	}
	
	
	this.makeAJAXrequest($H({ xml:
	'<EWS>' +
	'	<SERVICE>KM_GET_REL_LINK</SERVICE>' +
	'	<DEL/>' +
	'	<PARAM>' +
	'		<I_V_APPID>' + global.currentApplication.appId + '</I_V_APPID>' +
	'		<I_V_TABID>' + global.currentApplication.tabId + '</I_V_TABID>' +
	'		<I_V_VIEWID>' + global.currentApplication.view + '</I_V_VIEWID>' +
	'		<I_V_IS_PERSONALIZATION>' + personal + '</I_V_IS_PERSONALIZATION>' +
	'		<I_V_IS_AUTHOR>' + isAuthor + '</I_V_IS_AUTHOR>' +
	'		<I_V_PAGE>' + this.__rlPage + '</I_V_PAGE>' +
	'		<I_V_SIMULATION_ON>' + isSimulation + '</I_V_SIMULATION_ON>' +
	'	</PARAM>' +
	'</EWS>'
	, successMethod: function(json) {
	    $('showMoreLess').remove();
	    this.buildRelatedLinks(json);
	    if (this.__rlPage < this.__rlPageTemp) {
	       	this.showMoreRl = true;
			this.__rlPage++
	        this.refreshLinks();
	    }
	} .bind(this)
	}));
	},
	
	/**
	* Add related link
	* @param {Object} linkInfo
	*/
	addRelatedLink: function(linkInfo) {
	this.save({ 'action': 'A', 'app': global.currentApplication.appId, 'tab': global.currentApplication.tabId, 'view': global.currentApplication.view, 'order': 1, 'title': '', 'relconId': linkInfo.content.id, 'sMethod': 'initWidgetContent' })
	},
	
	/**
	* Move node up when selected in context menu
	* @param {Object} e
	*/
	moveUp: function(e) {
	var cur = $(this.__selectedcurrent);
	var orderid = cur.readAttribute('order');
	var prev = $(__selectedprev);
	var dest = prev.readAttribute('order');
	prev.insert({ before: cur });
	var swapid1 = cur.id
	var swapid2 = prev.id
	cur.setAttribute('id', swapid2);
	prev.setAttribute('id', swapid1)
	cur.setAttribute('order', dest);
	prev.setAttribute('order', orderid)
	
	this.save({ 'action': 'M', 'order': orderid, 'orderDest': dest })
	},
	
	/**
	* Move node down when selected in context menu
	* @param {Object} e
	*/
	moveDown: function(e) {
	var cur = $(this.__selectedcurrent);
	var next = $(__selectednext);
	var orderid = cur.readAttribute('order');
	var dest = next.readAttribute('order');
	var swapid1 = cur.id
	var swapid2 = next.id
	cur.setAttribute('id', swapid2);
	next.setAttribute('id', swapid1)
	cur.setAttribute('order', dest);
	next.setAttribute('order', orderid)
	next.insert({ after: cur });
	this.save({ 'action': 'M', 'order': orderid, 'orderDest': dest })
	},
	
	/**
	* Show More related links
	*/
	showMore: function() {
	this.showMoreRl = true;
	$('showMoreLess').remove();
	this.__rlPage++
	this.getRelatedLinks();
	},
	
	/**
	* Show Less Related Link
	*/
	showLess: function() {
	var length = $$('#rlItems div.rlItem').length;
	var lastLength = this.__pageLength[this.__pageLength.length - 1];
	this.__pageLength.pop();
	for (i = length; i > length - lastLength; i--) {
	    $('rlItems').down('div.rlItem', i - 1).remove();
	}
	if (length <= 10) {
	    $('showLess').remove();
	    $('showMore').show();
	}
	this.__rlPage--;
	},
	
	/**
	* Open Application with correct action
	* @param {Integer} contentId
	* @param {Boolean} isWeb
	*/
	openApplication: function(contentId, isWeb) {
	this.getStartPage();
	
	var isSimulation = (this.__editSimulation) ? 'X' : '';
	if (isWeb) {
	    this.makeAJAXrequest($H({ xml:
	' <EWS>' +
	'    <SERVICE>KM_GET_CONT_WB3</SERVICE>' +
	'    <PARAM>' +
	'		<I_V_CONTENT_ID>' + contentId + '</I_V_CONTENT_ID >' +
	'		<I_V_SIMULATION_ON>' + isSimulation + '</I_V_SIMULATION_ON>' +
	'    </PARAM>' +
	' </EWS>',
	        successMethod: function(json) {
				var content = json.EWS.o_v_content;
				content = content.gsub('&lt;','<').gsub('&gt;','>');
	            var testParse = new XML.ObjTree();
	            var jsonIn = testParse.parseXML(content);
	            var launch = false;
	            if (jsonIn.parsererror) {
	                var x = content.search("</TEMPLATE>")
	                content = content.slice(0, x + "</TEMPLATE>".length);
	                content += '</CONTENT>';
	                jsonIn = testParse.parseXML(content);
	            }
	
	            if (jsonIn.CONTENT.TEMPLATE == 'REDIRECT' && isNaN(jsonIn.CONTENT.URL)) {
	                this.protocolList.each(function(protocol) {
	                    if (jsonIn.CONTENT.URL.toUpperCase().startsWith(protocol.toUpperCase())) {
	                        this.launchApplication({ 'contentId': contentId });
	                        launch = true;
	                        throw $break;
	                    }
	                } .bind(this));
	
	                if (!launch) {
	                    var appTabView = jsonIn.CONTENT.URL.split('/')
	                    if (appTabView != jsonIn.CONTENT.URL) {
	                        this.launchApplication({ 'app': appTabView[1], 'tab': appTabView[0], 'view': appTabView[2] });
	                    }
	                    else {
	                        var webId = jsonIn.CONTENT.URL.split(':');
	                        if (webId[1] == 'true') {
	                            this.launchApplication({ 'contentId': webId[0], 'view': 'StartPage' });
	                        }
	                        else {
	                            this.openFile(webId[0])
	                        }
	                    }
	
	                }
	            }
	            else {
	                this.launchApplication({ 'contentId': contentId, 'view': 'StartPage' });
	            }
	
	        } .bind(this)
	    }));
	
	}
	else {
	    this.openFile(contentId)
	}
	
	},
	
	/**
	* Download and open file in iframe
	* @param {Object} contentId
	*/
	openFile: function(contentId) {
		var xmlin = ''
			+ '<EWS>'
			+ '<SERVICE>KM_GET_FILE2</SERVICE>'
			+ '<OBJECT TYPE=""/>'
			+ '<DEL/><GCC/><LCC/>'
			+ '<PARAM>'
			+ '<I_V_CONTENT_ID>' + contentId + '</I_V_CONTENT_ID>'
			+ '</PARAM>'
			+ '</EWS>';
		window.open(this.buildURL(xmlin), '', 'width=300,height=300,resizable=yes,scrollbars=yes,toolbar=no,location=no');
	},
	
	/**
	*function that turns xml into query params
	*@param (string) xmlin
	*/
	buildURL: function(xmlin) {
        var url = this.url;
        while (('url' in url.toQueryParams())) {
            url = url.toQueryParams().url;
        }
        url = (Object.isEmpty(Object.values(((url).toQueryParams()))[0])) ? url + '?xml_in=' : url + '&xml_in=';

        return url + xmlin;
    },
	
	/**
	* Open Application
	* @param {Object} args
	*/
	launchApplication: function(args) {
	//replace("Microsoft", "W3Schools"
	if(args.view){
		var temp = args.view.replace(':','');
	}
 		global.open($H({
			app: {
				tabId: (args.tab) ? args.tab : this.startPageIdTab,
				appId: (args.app) ? args.app : this.startPageId,
				view: (args.view) ?  temp: 'StartPage'
			},
			createContent: false,
			contentID: (args.contentId) ? args.contentId : ''
		})); 
	},
	
	/**
	* Close the menu Widget
	* @param {Object} $super
	*/
	close: function($super) {
	$super();
	//this.jumpToListAutocompleter.clearInput();
}

});