/**
 * @fileoverview menus.js
 * @description here are defined two new classes: menus and menuItem, that will handle
 * 		 		the left menus issues 
 */
/**
 * @constructor MenusHandler
 * @description Handles the left menus hiding and showing when needing.
 */
var MenusHandler = Class.create( {
    /**
     * @lends menus
     */
    
    /**
     * @type {Hash} 
     * @description relationships among left menu items ids and their classes names
     */
    menusClassNames : $H( {
        DETAIL : "MyDetails2",
        COMPAN : "MyCompanies",
        SELECT: "MySelectionsWithoutGroupings",
        RELATE : "Related",
        CURTI  : "scm_MyCurrentTicket",
        TIGROU : "scm_TicketGrouping",
        TIACT : "scm_TicketAction",
        PLANS : "MyBenefits",
        KMMENU : "KMMENU",
        PERIOD: "ReviewPeriods",
        BUDGET: "Budgets" ,
        APPOUS: "OrgStatus",
        RESOPT: "ResultOptions",
		METADATA: "Metadata",
        TAXSUG: "TaxonomySugestions",
        COMORG: "CompOrgUnits",
        FASTEN: "FastEntryMenu",
        PM_PGROU: "PM_processGrouping",
        CADETAIL: "MyProfileMenu",
        OM_WIWSE: "WhoIsWhoMenu",
        OM_PREQ: "pendingReqLeftMenu",
        RC_M_SEL: "requestedCandidatesMenu",
        SCC_POS: "SCC_MyKeyPositions",
        SCC_NOM: "SCC_MyNominees",        
		RELATED: 'Related'
    }),
    /**
     * @type {Integer}
     * @description max number of menus.
     */
    maxMenuNumber : null,
    /**
     * @type {Hash}
     * @description A hash containing an instance for each menu object. 
     */
    menusInstances : $H(),
    /**
     * @type {Array}
     * @description An array containing a group of containers which will contain each one
     * 				of the menus.
     */
    menusContainers : $A(),
    /**
    * @type {Hash}
    * @description A hash containing the options for the menu that are not instanciated. 
    */
    menusOptions: $H(),
    
    initialize : function() {
        //Check if we are to show myGroupings in mySelections:
        if (global && global.showGroupingsMySelections) {
            this.menusClassNames.set("SELECT", "MySelections2");
        }
        if (global && global.miniMySelection) {
            this.menusClassNames.set("SELECT", "MySelectionsAdv");
        }
        this.maxMenuNumber = this.menusClassNames.size() + 1;
        var leftPanelTitle = new Element('div', { 'class': 'rightPanel_tile tabs_title test_widget_text' }).insert(global.getLabel('myWorkSpace'));
        $("leftMenuTitle").insert(leftPanelTitle);
        this.initializeContainers();
        this.initializeMenus();
        //this will change the menus according to the application just opened.
        document.observe("EWS:openApplication_menus", this.onOpenApplication.bindAsEventListener(this));
    },
	
    /**
	 * @description Handles when an EWS:openApplication is fired. The way the MenusHandler class
	 * 				reacts to this EWS:openApplication depends on the "mode" argument passed to 
	 * 				the event firing.
	 * 				<ul>
	 * 					<li><code>mode: "popUp"</code> (Pop up mode: no menus)</li>
	 * 					<li><code>mode: "sub"</code> (Sub application mode: original application menus plus the sub application ones</li>
	 * 				</ul>
	 * 				if no mode specified the default one is shown.
	 * @param 		{Event}
	 */
    onOpenApplication : function(app) {
        if (app.tabId != "POPUP") {
            this.numberOfMenus = global.fixedLeftMenus.size();
            this.selectMenuItems(app);
        }
    },
	
    /**
	 * Creates an instance for each one of the menus.
	 */
    initializeMenus : function() {
        this.menusClassNames.each(function(menu) {
            if (global.leftMenusList.get(menu.key)) {
                var collapsed = global.leftMenusList.get(menu.key).get("collapsed") ? true : false;
                var color = global.leftMenusList.get(menu.key).get("color");
                var options = {
                    title : menu.value,
                    collapseBut : true,
                    showByDefault : false,
                    onLoadCollapse: collapsed,
                    color: color
                };
                if(window[menu.value]){
                    this.menusInstances.set(menu.key, new window[menu.value](menu.key, options));
                }
                else {
                    this.menusOptions.set(menu.key, { "options": options });
                }
            } else if (global.fixedLeftMenus.include(menu.key)) {
                var container = global.fixedLeftMenus.indexOf(menu.key);
                var containerElement = this.menusContainers[container];
                containerElement.addClassName("menus_item_container");
                var options = {
                    title : menu.value,
                    collapseBut : true,
                    showByDefault : true,
                    onLoadCollapse : false,
                    targetDiv : containerElement
                };
                if(window[menu.value]){
                    this.menusInstances.set(menu.key, new window[menu.value](menu.key, options));
                }
            }
        }.bind(this));
    },
    /**
	 * Creates the needed containers inside the left menus area
	 */
    initializeContainers : function() {
        $A($R(0, this.maxMenuNumber - 1)).each(function(index) {
            this.menusContainers.push(new Element("div", {
                id : "fwk_menu_" + index
            }));
            $("menus").insert(this.menusContainers[index]);
        }.bind(this));
    },

    /**
	 *	@param application {String} The current application
	 *	@param mode {String} the mode in which the application will work
	 *	@description shows only the proper menus for the application chosen
	 */
    selectMenuItems: function(app) {
        //Open all menus related to this application
    	var tabId = global.getTabIdByAppId(app.appId);
    	if(tabId == "SUBAPP"){
    		tabId = global.getTabIdByAppId(global.currentApplication.appId);
    	}
        var menus = global.tabid_leftmenus.get(tabId) ? global.tabid_leftmenus.get(tabId) : null;
        var role = global.getPopulationName(global.currentApplication.appId)
        document.fire("EWS:openMenu", $H( {
            menus : menus,
            app: app,
            role : role
        }));
    }
});

/**
 *	@constructor Menu
 *	@description represents every item to be showed in the menus
 *	@augments origin
 */
var Menu = Class.create(origin,
/**
* @lends Menu
*/
{
/**
* @type {Element}
* @description the element representing the icon, will handle the minimize of the menu.
*/
icon: null,
/**
* @type {Boolean}
* @description Whether the menu is inserted in the DOM or not
*/
inserted: false,
/**
* @type {unmWidget}
* @description a widget which will handle the "menu" behaviors like max/minimize, contextual
* 				menu, etc.
*/
widget: null,
/**
* @type {Object}
* @description Default widget options 
*/
widgetOptions: {
    collapseBut: true,
    onLoadCollapse: false
},
/**
*@type Integer
*@description position for the left menu.
*/
position: null,
/**
* @type {String}
* @description In which application is the menu been executed.
*/
application: null,
/**
* Initializes the menu object
* @param {origin} $super a super class reference for the super class initialization
* @param {String} id The menu ID
* @param {Object} widgetOptions The options to initialize the widget as defined in the
* 				   unmovable widget class. Should be extended when inheriting the menu
* 				   class.
*/
initialize: function ($super, id, widgetOptions) {
    $super();
    this.widget = new unmWidget($H(widgetOptions));
    this.menuId = id;
    if (global.leftMenusList.get(id)) {
        this.position = global.leftMenusList.get(id).get("widRow");
    }
    if (widgetOptions.showByDefault) {
        this.show();
    } else {
        document.observe('EWS:openMenu', this.onOpenMenu.bindAsEventListener(this));
    }
},
/**
* Function handler for the EWS:openMenu event
* @param {Event} event
*/
onOpenMenu: function (event) {
    var args = getArgs(event);
    //get the current opened application
    var app = args.get("app");
    if (app.tabId == "SUBAPP") {
        app = global.currentApplication;
    }
    //menus to be opened
    var menus = args.get("menus");
    //get the position number for the menu (if any)
    var position = this.position - 1;

    var menuContainer = global.leftMenu.menusContainers[position];

    //if not menu container, exit to avoid fails
    if (!menuContainer) {
        return;
    }
    var hasToBeShown = this.menuHasToBeShown(args);
    //if the menu has to be shown
    if ((menus && menus.keys().include(this.menuId) || global.fixedLeftMenus.include(this.menuId)) && hasToBeShown) {
        this.application = app;
        var appData = {
            appId: app.appId,
            tabId: app.tabId,
            populationId: global.getPopulationName(app),
            selectionType: global.getSelectionType(app)
        };
        if (this.hasToBeUpdated(appData)) {
            //first close it
            this.widget.close();
            //and then open it again with it's layout prepared for the new application
            menuContainer.addClassName("menus_item_container");
            menuContainer.show();
            this.show(menuContainer, menus.get(this.menuId));
        }
    } else if (!menus || (!menus && !global.fixedLeftMenus.include(this.menuId)) || menus && !menus.get(this.menuId) && !global.fixedLeftMenus.include(this.menuId)) {
        this.application = null;
        this.inserted = false;
        menuContainer.hide();
        menuContainer.removeClassName("menus_item_container");
        this.close();
        this.widget.close();
    }
},
menuHasToBeShown: function (args) {
    if (this.menuId == "SELECT" && args.get("role") == "NOPOP")
        return false;
    return true;
},
/**
* Closes the menu, should be overwritten in child classes
*/
close: function () {
},
/**
* Changes the title to a menu
* @param {String} newTitle
*/
changeTitle: function (newTitle) {
    this.widget.refreshTitle(newTitle);
},
/**
* Changes the content to a menu. Can receive both a String or an Element
* @param {Object} content
*/
changeContent: function (content) {
    this.widget.refreshContent(content);
},
/**
* The class which wants to create a new menu has to override this
* method and draw everything down the $super(element) call in order to be
* sure that it's being shown in the screen;
* @param {Element} element Where will the menu be shown
* @param args The arguments for the menu showing
*/
show: function (element, args) {
    this.widget.show(element);
},

addEmployeeColor: function (color) {
    var colorClass = 'eeColor' + color;
    var containerDiv = new Element('span');
    var html = "<span id='Up_border' class='upBorder_css " + colorClass + "'></div>"
        + "<span id='centralDiv' class='central_css " + colorClass + "'></div>"
        + "<span id='down_border' class='upBorder_css " + colorClass + "'></div>";
    containerDiv.insert(html);
    return containerDiv;
},
/**
* Checks if the menu has to be updated when changing application, should be overwritten in child classes.
* The default is always update the menu. 
* @param {Object} appData Object with the data we could use: appId, tabId, selectionType and populationId
*/
hasToBeUpdated: function (appData) {
    return true;
},
removeEmployeeColor: function (colorDiv, color) {
    var colorClass = 'eeColor' + color;
    var up_border = colorDiv.down('[id=Up_border]');
    var central = colorDiv.down('[id=centralDiv]');
    var down_border = colorDiv.down('[id=down_border]');
    up_border.removeClassName(colorClass);
    up_border.addClassName('eeColor00');
    central.removeClassName(colorClass);
    central.addClassName('eeColor00');
    down_border.removeClassName(colorClass);
    down_border.addClassName('eeColor00');
},
/**
* returns the selection type from global, if necessary it can be overridden.
*/
getSelectionType: function () {
    return global.getSelectionType(this.application);
}
});

/**
 * @constructor EmployeeMenu
 * @description Parent class for menus which handle employee related data and events.
 */

var EmployeeMenu = Class.create(Menu,
/**
* @lends EmployeeMenu
*/
{
/**
* Indexed list of all the color squares HTML elements for each one of the object ids
* @type Hash
*/
_colorElements: null,

/**
* Indexed list for all the names HTML elements for each one of the object ids
* @type Hash
*/
_nameElements: null,

/**
* Indexed list for all the selection elements for each one of the oject ids (both types,
* check box and radio button)
* @type Hash
*/
_selectElements: null,

/**
* The html content for the menu
* @type Element
*/
_content: null,

initialize: function($super, id, options) {
    $super(id, options);
    this._content = new Element("div");
    this._colorElements = $H();
    this._selectElements = $H();
    this._nameElements = $H();
    //keeps all the menus inheriting from here synchronized about the employees selection
    document.observe("EWS:employeeMenuSync", this.menuSync.bind(this));
},

/**
* Initializes all the HTML elements needed for a list of employee ids.
*/
initializeElements: function(employeeIdList) {
    employeeIdList.each(function(employeeId) {
        this._initializeColorElement(employeeId);
        this._initializeSelectElement(employeeId);
        this._initializeNameElement(employeeId);
    } .bind(this));
},
/**
* Initializes the color square for the given user
* @param {String} employeeId the employee to find its color
*/
_initializeColorElement: function(employeeId) {

    //don't create an element twice
    if (this._colorElements.get(employeeId)) {
        if (this._colorElements.get(employeeId).single.parentNode) {
            this._colorElements.get(employeeId).single.remove();
        }
        if (this._colorElements.get(employeeId).multi.parentNode) {
            this._colorElements.get(employeeId).multi.remove();
        }
        if (this._colorElements.get(employeeId).none.parentNode) {
            this._colorElements.get(employeeId).none.remove();
        }
    }
    //SINGLE
    //initialize the element for the color square and store it
    var colorElementSingle = new Element('button', { 'class': 'contextLeftButtonColorSquare' });
    var colorElementSingleDiv = new Element("div", {
        id: 'my_details_single_' + employeeId + '_contextMenu'
    });
    colorElementSingleDiv.insert(
				"<div class='eeColor00 upBorder_css'></div>" +
				"<div class='eeColor00 central_css test_employeeColorIcon'></div>" +
				"<div class='eeColor00 upBorder_css'></div>"
		);
    var selectionType = 'single';
    colorElementSingle.insert(colorElementSingleDiv);
    colorElementSingle.observe('click', this.contextLeftMenu.bindAsEventListener(this, employeeId, selectionType, colorElementSingle));

    //MULTI
    var colorElementMulti = new Element('button', { 'class': 'contextLeftButtonColorSquare' });
    var colorElementMultiDiv = new Element("div", {
        id: 'my_details_multi_' + employeeId + '_contextMenu'
    });
    colorElementMultiDiv.insert(
				"<div class='eeColor00 upBorder_css'></div>" +
				"<div class='eeColor00 central_css test_employeeColorIcon'></div>" +
				"<div class='eeColor00 upBorder_css'></div>"
		);
    var selectionType = 'multi';
    colorElementMulti.insert(colorElementMultiDiv);
    colorElementMulti.observe('click', this.contextLeftMenu.bindAsEventListener(this, employeeId, selectionType, colorElementMulti));

    //NONE
    var colorElementNone = new Element('button', { 'class': 'contextLeftButtonColorSquare' });
    var colorElementNoneDiv = new Element("div", {
        id: 'my_details_none_' + employeeId + '_contextMenu'
    });
    colorElementNoneDiv.insert(
				"<div class='eeColor00 upBorder_css'></div>" +
				"<div class='eeColor00 central_css test_employeeColorIcon'></div>" +
				"<div class='eeColor00 upBorder_css'></div>"
		);
    var selectionType = 'none';
    colorElementNone.insert(colorElementNoneDiv);
    colorElementNone.observe('click', this.contextLeftMenu.bindAsEventListener(this, employeeId, selectionType, colorElementNone));

    //different for single and multiselection since it makes things easier

    this._colorElements.set(employeeId, {
        single: colorElementSingle,
        multi: colorElementMulti,
        none: colorElementNone
    });
},
/**
* Method to show the ballon of the contextLeftmenu
* @param employeeId the employeeId to identify the button clicked
selectionType is the type of selection to identify de button clicked
* @return 
*/
contextLeftMenu: function(evt, employeeId, selectionType, element) {
    //we take from where the service has been invoked 
    if (element.hasClassName("my_details_color"))
        var caller = "DETAILS";
    else
        var caller = "SELECT";
    //make ajax request sending the inxml

    var xmlOverview = "<EWS>"
                        + "<SERVICE>GET_LEFT_ACTIO</SERVICE>"
                        + "<OBJECT TYPE='P'>" + employeeId + "</OBJECT>" //example of employeeId = 30000634
                        + "<PARAM>"
                            + "<I_APPID>" + caller + "</I_APPID>"
                            + "<I_CONTAINER>" + global.currentApplication.tabId + "</I_CONTAINER>"
                        + "</PARAM>"
                        + "<DEL/>"
                        + "</EWS>";
    this.makeAJAXrequest($H({
        xml: xmlOverview,
        //successMethod: this.fillBalloon.bind(this, employeeId, selectionType)
        successMethod: this.fillContextMenu.bind(this, employeeId, selectionType, evt, element)
    }));

},

/**
* @method to compone the name to show in the left menu
* @param item of the menu
* @return string
*/
getContentItem: function(item) {
    var actionArray = item["@actiot"].split('((L))');
    //if action[1] is not defined, we label the hole text as a link. some actions are not labeled.
    var actionText;
    if (!actionArray[1])
        return actionArray[0];
    else
        return actionArray[0] + actionArray[1] + actionArray[2];
},

/**
* @method to add a separator in a menu (a gross line)
* @param mArray structure to keep the information of the menu
* @param counter number of items to show in the menu
* @return int updated counter
*/
addSeparator: function(mArray, counter) {
    mArray[counter] = new Hash({ id: counter, text: '#separator#', children: null, callback: null });
    counter += 1;
    return counter;
},

/**
* @method to build the FavouriteAction part of the menu (the first one)
* @param item structure with the information of Favourite actions
* @param counter number of items to show in the menu
* @param mArray structure with the information of overall menu
* @param nextItem structure with the information of MenuQuickAction (if it exists, the separator is added)
* @return int updated counter
*/
fillContextMenuFavouriteAction: function(item, counter, mArray, nextItem, employeeId) {
    if (item && item.level1 && item.level1.yglui_str_left_level1 && (item.level1.yglui_str_left_level1[0] || item.level1.yglui_str_left_level1)) {
        if (item.level1.yglui_str_left_level1[0])
            var actions = item.level1.yglui_str_left_level1;
        else {
            var actions = $A();
            actions.push(item.level1.yglui_str_left_level1);
        }
        for (var i = 0; i < actions.length; i++) {
            var element = actions[i];
            var actionText = this.getContentItem(element);
            var mfunction = function() {
                global.open($H({
                    app: {
                        appId: element['@tarap'],
                        tabId: element['@tartb'],
                        view: element['@views'],
                        selectedEmployee: employeeId
                    }
                }));
            } .bind(this)
            var h1 = new Hash({ id: counter, text: actionText, children: null, callback: mfunction });
            if (h1) {
                mArray[counter] = h1;
                counter += 1;
            }
        }
        if (nextItem)
            counter = this.addSeparator(mArray, counter);
    }
    return counter;
},

/**
* @method to build the MenuQuickAction part of the menu (the middle one)
* @param item structure with the information of Quick actions
* @param counter number of items to show in the menu
* @param mArray structure with the information of overall menuç
* @param nextItem structure with the information of MainApplicationsAction (if it exists, the separator is added)
* @return int updated counter
*/
fillContextMenuQuickAction: function(item, counter, mArray, nextItem, employeeId) {
    if (item && item.level1 && item.level1.yglui_str_left_level1 && (item.level1.yglui_str_left_level1[0] || item.level1.yglui_str_left_level1["@actio"])) {
        if (item.level1.yglui_str_left_level1[0])
            var actions = item.level1.yglui_str_left_level1;
        else {
            var actions = $A();
            actions.push(item.level1.yglui_str_left_level1);
        }
        for (var i = 0; i < actions.length; i++) {
            var element = actions[i];
            var actionText = this.getContentItem(element);
            var mfunction = this.functionToOpenApplicationItem.bind(this, element, employeeId);
            var h1 = new Hash({ id: counter, text: actionText, children: null, callback: mfunction });
            if (h1) {
                mArray[counter] = h1;
                counter += 1;
            }
        }
        if (nextItem)
            counter = this.addSeparator(mArray, counter);
    }
    return counter;
},
functionToOpenApplicationItem: function(element, employeeId) {
    global.open($H({
        app: {
            appId: element['@tarap'],
            tabId: element['@tartb'],
            view: element['@views'],
            selectedEmployee: employeeId
        }
    }));
},

/**
* @method to build the MenuMainApplicationsAction part of the menu (the first one)
* @param item structure with the information of MainMenu actions
* @param counter number of items to show in the menu
* @param mArray structure with the information of overall menu
* @return int updated counter
*/
fillContextMenuMainApplicationsAction: function(item, counter, mArray, employeeId) {
    if (item && item.level1 && item.level1.yglui_str_left_level1) {
        if (item.level1.yglui_str_left_level1[0]) {
            //If there are more than 2 main applications
            for (var i = 0; i < item.level1.yglui_str_left_level1.length; i++) {
                counter = this.createSubMenu(item.level1.yglui_str_left_level1[i], counter, mArray);
            }
        }
        else
            counter = this.createSubMenu(item.level1.yglui_str_left_level1, counter, mArray);
    }
    return counter;
},

/**
* @method to build the an individual menu inside the main actions menu (e.g. Workforce or Talent Management)
* @param item structure with the information of the individual menu
* @param counter number of items to show in the menu
* @param mArray structure with the information of overall menu
* @return int updated counter
*/
createSubMenu: function(item, counter, mArray, employeeId) {
    var parent = item;
    if (item.level2 && item.level2.yglui_str_left_level2) {
        var childrenHash = null;
        //Create the children items
        var childrens = item.level2.yglui_str_left_level2;
        if (childrens[0]) {
            childrenHash = $A();
            for (var i = 0; i < childrens.length; i++) {
                var element = childrens[i];
                var actionText = this.getContentItem(element);
                var mfunction = function() {
                    global.open($H({
                        app: {
                            appId: element['@tarap'],
                            tabId: element['@tartb'],
                            view: element['@views'],
                            selectedEmployee: employeeId
                        }
                    }));
                } .bind(this)
                var h1 = new Hash({ id: (i + 1) + "_" + counter, text: actionText, children: null, callback: mfunction });
                if (h1) {
                    childrenHash[i] = h1;
                }
            }
        }
        //Create the parent item
        var actionText = this.getContentItem(parent);
        var mfunction = function() {
            global.open($H({
                app: {
                    appId: parent['@tarap'],
                    tabId: parent['@tartb'],
                    view: parent['@views'],
                    selectedEmployee: employeeId
                }
            }));
        } .bind(this)
        var h1 = new Hash({ id: counter, text: actionText, children: childrenHash, callback: mfunction });
        if (h1) {
            mArray[counter] = h1;
            counter += 1;
        }
        return counter;
    }
},
/**
* Method to fill the contextLeftmenu with the Json(SaP)info
* @param employeeId the employeeId to identify the person 
* json is the json object with the info to fill the ballon
*/

fillContextMenu: function(employeeId, selectionType, myevent, element, json) {
    // DEBUG
    //    var test = deepCopy(json.EWS.o_left_actions.yglui_str_left_actions[2].level1.yglui_str_left_level1[0].level2.yglui_str_left_level2[0])
    //    json.EWS.o_left_actions.yglui_str_left_actions[2].level1.yglui_str_left_level1[0].level2.yglui_str_left_level2.push(test);
    //    json.EWS.o_left_actions.yglui_str_left_actions[2].level1.yglui_str_left_level1[0].level2.yglui_str_left_level2.push(test);
    //    json.EWS.o_left_actions.yglui_str_left_actions[2].level1.yglui_str_left_level1[0].level2.yglui_str_left_level2.push(test);
    //    json.EWS.o_left_actions.yglui_str_left_actions[2].level1.yglui_str_left_level1[0].level2.yglui_str_left_level2.push(test);
    //---------------------------------------------------------------------
    var populationName = global.getPopulationName(this.application)
    var population = global.populations.get(populationName);
    var employee = {};
    employee.name = population.get(employeeId).name;
    employee.objectType = population.get(employeeId).type;
    employee.id = employeeId;

    var counter = 0;
    var mArray = [];
    //Keep the maximum number of item to show without an downward arrow.
    var hashMaximum = $H();
    hashMaximum.set("level1", "null");
    if (json.EWS && json.EWS.o_nitems)
        hashMaximum.set("level2", json.EWS.o_nitems);
    else
        hashMaximum.set("level2", null);
    //------------------------------------------------------------------

    if (json.EWS.o_left_actions) {
        var arrayLevel1 = objectToArray(json.EWS.o_left_actions.yglui_str_left_actions);
        for (var i = 0; i < arrayLevel1.length; i++) {
            switch (arrayLevel1[i]["@tleft"]) {
                case "F": //Favourites Actions
                    counter = this.fillContextMenuFavouriteAction(arrayLevel1[i], counter, mArray, arrayLevel1[i + 1], employee);
                    break;
                case "Q": //Quick Actions
                    counter = this.fillContextMenuQuickAction(arrayLevel1[i], counter, mArray, arrayLevel1[i + 1], employee);
                    break;
                case "M": //Main Applications
                    counter = this.fillContextMenuMainApplicationsAction(arrayLevel1[i], counter, mArray, employee);
                    break;
                default:
                    alert("Context Left Menu: The type of menu is unknown, please contact to euHReka Framework");
            }
        }

    }
    else {
        //Show no options available
        mArray.push(new Hash({ id: counter, text: global.getLabel("noActionsAvailable"), children: null, callback: function() { } }));
    }
    // Create the complete structure
    mContextMenu.setContent(mArray, hashMaximum);
    //show the main menu
    mContextMenu.showMainMenu(myevent);
    mContextMenu.mainMenu.options.additionalClassContainer = "contextLeftMenu";
    mContextMenu.mainMenu.container.addClassName("contextLeftMenu test_eeBubblePopUp");
},
/**
* Method to be overwritten returning the right HTML element with the employee name
* @param {String} employeeId the employeeId to get its name 
* @return the right HTML element with the employee
*/
_initializeNameElement: function(employeeId) {
},

_initializeSelectElement: function(employeeId, hide) {

    //don't create the elements twice.
    if (this._selectElements.get(employeeId)) {
        if (this._selectElements.get(employeeId).radio.parentNode) {
            this._selectElements.get(employeeId).radio.remove();
        }
        if (this._selectElements.get(employeeId).checkbox.parentNode) {
            this._selectElements.get(employeeId).checkbox.remove();
        }
    }

    //initialize the elements for the selection (both radio and check box)
    var tooltipSelection = "";
    if (global.liteVersion) {
        tooltipSelection = employeeId;
    }
    if (!Object.isEmpty(hide))
        var disabled = true;
    else
        var disabled = false;
    var checkbox = new Element("input", {
        "type": "checkbox",
        "value": employeeId,
        "title": tooltipSelection,
        "class": "test_checkBox",
        "id": employeeId, 
        "disabled":disabled
    });

    checkbox.observe("click", this.onClickSelect.bindAsEventListener(this, employeeId));

    var radio = new Element("input", {
        "type": "radio",
        "name": "ews_employeeSelection",
        "value": employeeId,
        "title": tooltipSelection,
        "class": "test_radioButton",
        "id": employeeId, 
        "disabled":disabled
    });

    radio.observe("click", this.onClickSelect.bindAsEventListener(this, employeeId));

    //store the radio button and the checkbox
    this._selectElements.set(employeeId, {
        radio: radio,
        checkbox: checkbox
    });
},

/**
* Provides the basic synchronization mechanism between the menus
*/
menuSync: function(event) {

},

/**
* Function to handle clicks on employee selection menus
*/
onClickSelect: function(event, employeeId) {

    var selectedStatus = $F(event.element()) != null;
    //If we click on a radio button to change the currently selected employee,
    //then we cancel the previous AJAX calls because they are not needed any more
    if (!Object.isEmpty(event)) {
        event = event.target || event.srcElement;
        if (!Object.isEmpty(event) && !Object.isEmpty(event.type) && event.type == 'radio')
            global.abortAjaxCalls();
    }
    if (global.employeeIsSelected(employeeId) && !selectedStatus) {
        global.setEmployeeSelected(employeeId, false);
    } else if (!global.employeeIsSelected(employeeId) && selectedStatus) {
        global.setEmployeeSelected(employeeId, true);
    }

},

/**
* Puts the menu content inside the widget
*/
renderMenu: function() {
    this.changeContent(this._content);
},

/**
* Selects an employee
* @param {String} employeeId the object id for the employee that is going to be selected
*/
select: function(event, employeeId) {
    if (!employeeId) {
        employeeId = event;
    }

    //update the menus
    this.toggleColor(employeeId);
    if (event == employeeId) {
        if (this.getSelectionType() == "multi") {
            this._selectElements.get(employeeId).checkbox.checked = true;
        } else if (this.getSelectionType() == "single") {
            this._selectElements.get(employeeId).radio.defaultChecked = true;
            this._selectElements.get(employeeId).radio.checked = true;
        }
    }
},

/**
* Shows the menu on the proper location
* @param {Element} element the HTML element where the menu has to be shown.
*/
show: function($super, element) {
    $super(element);
},

/**
* Renders a little square by the employee name with the proper color
* @param {String} employeeId The id for the employee
*/
toggleColor: function(employeeId) {
    var color = global.getColor(employeeId);
    if (Object.isEmpty(this._colorElements.get(employeeId))) {
        return;
    }
    var elements = this._colorElements.get(employeeId)[this.getSelectionType()].select("div");

    elements.each(function(e) {
        var i = 0;
        if ((e.id != "my_details_multi_" + employeeId.toString() + "_contextMenu" && e.id != "my_details_single_" + employeeId.toString() + "_contextMenu")) {
            if (global.employeeIsSelected(employeeId)) {
                e.removeClassName("eeColor00");
                e.addClassName("eeColor" + color.toPaddedString(2));
            } else {
                e.addClassName("eeColor00");
                e.removeClassName("eeColor" + color.toPaddedString(2));
            }
        }
    });
},

/**
* Unselects an employee
* @param {String} employeeId the object id for the employee that is going to be unselected
*/
unselect: function($super, event, employeeId) {

    if (!employeeId) {
        employeeId = event;
    }
    //update the menus.
    this.toggleColor(employeeId);
    if (event == employeeId) {
        if (!Object.isEmpty(this._selectElements.get(employeeId))) {
            if (this.getSelectionType() == "multi") {
                this._selectElements.get(employeeId).checkbox.checked = false;
            } else if (this.getSelectionType() == "single") {
                this._selectElements.get(employeeId).radio.defaultChecked = false;
                this._selectElements.get(employeeId).radio.checked = false;
            }
        }
    }
}
});