/**
 * @class
 * @description Class that manage the fields that should have an associated action
 * @author jonathanj & nicolasl
 * @version 5.3
 * <br/>Modified in 5.3
 * <ul>
 * <li>1048365 - Don't call the get contextual actions for non numerical employee ids</li>
 * </ul>
 */
var ScmUserAction = Class.create(/** @lends ScmUserAction.prototype */{
    /**
     * @type Application
     * @description The application that store the useraction. It is used to call SAP.
     * @since 1.0
     */
    _caller: null,
	/**
	 * Template to use to get the list of contextual actions
	 * @type Template
	 * @since 5.3
	 */
    _contextualActionsTemplate: new Template(
		'<EWS>' 
	+		'<SERVICE>GET_CON_ACTIO</SERVICE>' 
	+		'<OBJECT TYPE="#{type}" TEXT="#{userId}"/>'
	+		'<PARAM>' 
	+			'<CONTAINER>#{appId}</CONTAINER>' 
	+			'<MENU_TYPE>A</MENU_TYPE>' 
	+			'<A_SCREEN>1</A_SCREEN>' 
	+		'</PARAM>' 
	+	'</EWS>'),
    /**
     * @type Element
     * @description Element that should contains the action.
     * @since 1.0
     */
    _field: null,
    
    /**
     * @type JSON Object
     * @description Parameters of the user to display composed of:
     * <ul>
     * <li><b>id</b>(<i>String</i>): Id of the employee</li>
     * <li><b>name</b>(<i>String</i>): Name of the employee</li>
     * <li><b>company</b>(<i>String</i>): Company of the employee</li>
     * </ul>
     * @since 1.0
     */
    _user: null,
	
	/**
     * @type String
     * @description Class used for the element with an action.
     * @since 1.0
     */
	_lastClassName: null,
	
	/**
     * @type Array
     * @description List of the prohibited actions. They aren't proposed even if they are retrived from SAP.
     * @since 1.0
     */
	_prohibitAct: null,
	
	/**
     * @type String
     * @description Name of the application used for the actions search.
     * @since 1.0
     */
	_usedView: null,
	
	/**
     * @type {Boolean}
     * @description Is the cache to use for actions list retrieve?
     * @since 1.0
     */
	_useCache: null,
	
    /**
     * @param {Application} caller Instance that created the object
     * @param {String/Element} id Element of its identifier that have to be an action
     * @param {Array} prohibitAct (optional) List of the actions to do not call event if it is in the custo
     * @param {Element} ancestor (optional) Indicate the HTML parent that has to contains the element with actions
     * @param {String} usedView (Optional) Name to use for the caller application
     * @description Initialize the field that could contains an action
     * @since 1.0
     */
    initialize: function(caller, id, prohibitAct, ancestor, usedView) {
        this._caller	= caller;
		if(Object.isEmpty(ancestor)) ancestor = this._caller.virtualHtml;
		if(Object.isEmpty(usedView)) this._usedView = caller.appName;
		else this._usedView = usedView;
		
        this._field     = ancestor.down('[id="' + id + '"]');
        this._user      = {id: null, name: null, company: null};
		
		if(!Object.isEmpty(prohibitAct)) this._prohibitAct = prohibitAct;
		else this._prohibitAct = $A();
    },
    
    /**
     * @param {String} userId Id of the selected employee
     * @param {String} userName Name of the selected employee
     * @param {String} userCompany Id of the company of the user 
     * @param {Integer} marginTop Number to set in the margin top
     * @param {Boolean} updateField Is the text before with action to make clickable
     * @param {Boolean} useCache (default true) Is the cache to use for this field?
     * @description Create the display for the action field
     * @returns {Element}
     * @since 1.0
     */
    addActionOnField: function(userId, userName, userCompany, marginTop, updateField, useCache) {
        var icon    = new Element('div', {'class': 'SCM_PoolTable_actions_after'}).update('<span>&gt;</span>');
        
		this._useCache		= (useCache !== false);
        this._user.id     	= userId;
        this._user.name   	= userName;
        this._user.company 	= userCompany;
		
        if(updateField === true)
            this._field.addClassName('SCM_PoolTable_actions');
        else
            this._field.addClassName('SCM_PoolTable_noActions');
            
        this._field.insert({after: icon});   
        
        icon.observe('click', function(event) {
            this.getListActions(event);
        }.bindAsEventListener(this));
        
        if(updateField)
            this._field.observe('click', function(event) {
                this.getListActions(event);
            }.bindAsEventListener(this));
    	
	    if(marginTop)
		    icon.setStyle({marginTop: marginTop.toString() + 'px'});

        return icon;
    },
    
	/**
     * @description Hide the action (the blue square and the used class if any)
     * @since 1.0
     */
	hideActionOnField: function() {
		var icon = this._field.next('div.SCM_PoolTable_actions_after');
		if(!icon || !icon.visible()) return;
		icon.hide();
		if(this._field.hasClassName('SCM_PoolTable_actions')) {
			this._lastClassName = 'SCM_PoolTable_actions';
			this._field.removeClassName('SCM_PoolTable_actions');
		} else if(this._field.hasClassName('SCM_PoolTable_noActions')) {
			this._lastClassName = 'SCM_PoolTable_noActions';
			this._field.removeClassName('SCM_PoolTable_noActions');
		}
		
	},
	
	/**
     * @description Show the action
     * @since 1.0
     */
	showActionOnField: function() {
		var icon = this._field.next('div.SCM_PoolTable_actions_after');
		if(icon.visible()) return;
		icon.show();
		this._field.addClassName(this._lastClassName);
	},
	
    /**
     * @param {String} userId Id of the selected employee
     * @param {String} userName Name of the selected employee
     * @param {String} company Company of the selected employee
     * @description Update the employee in the field
     * @since 1.0
     */
    updateAction: function(userId, userName, company) {       
        this._user.id     	= userId;
        this._user.name   	= userName;
		this._user.company	= company;
    },
    
	/**
     * @description Get the appId to use to retrieve actions
     * @returns {String} AppId of the selected current view
     * @since 1.0
     */
	getCurrentAppId: function() {
		var view;

		if(this._usedView === '*') view = global.currentApplication.view;
		else view = this._usedView;
		
		switch(view) {
			case 'scm_myPool'			: view = 'MY_PL'; 		break;
			case 'scm_generalPool'		: view = 'GNR_PL'; 		break;
			case 'scm_opmPool'			: view = 'OPM_PL'; 		break;
			case 'scm_teamPool'			: view = 'TEAM_PL'; 	break;
			case 'scm_myActivity'		: view = 'ACTIV_TI'; 	break;
			case 'scm_createTicket'		: view = 'CREA_TIK'; 	break;
			case 'scm_viewTicket'		: view = 'VIEW_TIK';	break;
			case 'scm_editTicket'		: view = 'EDIT_TIK'; 	break;
			case 'scm_employeeHistory'	: view = 'HIST_PL';	 	break;
			case 'scm_ticketApp'		: view = 'TIK_PL';	 	break;
			case 'scm_searchTicket'		: view = 'OV_SEAR';	 	break;
			case 'scm_dashboardPool'	: view = 'SM_DASHB';	break;
			//since 5.0 - 1052400 - If we are not in SCM, give the list of contextual actions of my pool
			default: view = 'MY_PL'; break;
		}
		
		return view;
	},
	
	/**
     * @description Check if the cache is to use? If there is no precised view, 
     * it is not possible to use caching. 
     * @returns {Boolean} Is the cache to use?
     * @since 1.0
     */
	_useCaching: function() {
		if(this._usedView === '*') return false;
		return this._useCache;
	},
	
    /**
     * @param {Event} event Event that asked the list of menu items 
     * @description Call the backend to get the list of actions for the current user
     * @since 1.0
     * <br/>Modified in 5.3
     * <ul>
     * <li>1048365 - Don't call the get contextual actions for non numerical employee ids</li>
     * </ul>
     */
    getListActions: function(event) {
		var cache;
		if (this._useCaching() === true) {
			cache = ScmUserAction._cache.get(this._caller.appName + '_' + this._user.company + '_' + this._user.id);
		}
 
        //If there is no cache => call the backend
        if (Object.isEmpty(cache)) {
			//since 5.3 - Depending on the id of the employee, use it or not
			var type;
			var employeeId;
			if(this._user.id.match(/^\d{8}$/)) {
				type = 'P';
				employeeId = this._user.id;
			}
			else if(this._user.id.match(/^\d+$/)) {
				type = 'M';
				employeeId = this._user.id;
			}
			else {
				type = 'N';
				employeeId = '1';
			}
			this._caller.makeAJAXrequest($H({
				xml: this._contextualActionsTemplate.evaluate({
					type: type,
					userId: employeeId,
					appId: this.getCurrentAppId()
				}),
				successMethod: this.displayListActions.bind(this, Object.clone(event))
			}));
		}
		else {
			this.displayListActions(Object.clone(event), cache);
		}
    },
    
    /**
     * @event
     * @param {Event} event Event generated by the selection of a field 
     * @param {JSON Object} listActionsJson List of the actions
     * @description Get the backend answer and display the list of actions
     * @since 1.0
     * <br/>Modified in 3.4
     * <ul>
     * <li>Allow to display the contextual actions in popups</li>
     * </ul>
     */
    displayListActions: function(event, listActionsJson) {
        var listActions = $A();
        
        //Set the cache for a next call
	    if(this._useCaching() === true) ScmUserAction._cache.set(this._caller.appName + '_' + this._user.company+'_'+this._user.id, listActionsJson);
	   	
		//Set the list of contextual actions 
	   	if(listActionsJson.EWS.o_actions && listActionsJson.EWS.o_actions.yglui_vie_tty_ac){
			objectToArray(listActionsJson.EWS.o_actions.yglui_vie_tty_ac).each(function(action) {
				//since 3.4 - Allow to have a popup as target tab.
				var tabId = '';
				if(action['@tarty'] === 'P' || action['@tarty'] === '') tabId = 'POPUP';
				else tabId = (action['@tartb']||'');
				listActions.push({appId: action['@tarap'], view: action['@views'], tabId: tabId, label: action['@actiot']});
			}.bind(this));
		}

		//Delete the prohibited actions from the list
		listActions = listActions.reject(function(action) {
			//since 3.4 For the popups, do not check if there is a tab with the application
			if(action.tabId !== 'POPUP' && global.allApps.indexOf(action.appId) < 0) return true;
			if(this._prohibitAct.indexOf(action.view) >= 0) return true;
			return false;
		}.bind(this));
		
		
		//Display the menu on the screen
		this.displayOnScreen(listActions, event);
    },
	
	/**
	 * Call the start of a new application
	 * @param {String} appId Id of the application to start
	 * @param {String} tabId Id of the tab to open
	 * @param {String} view Name of the view to start
	 * @since 1.1
	 * <br/>Modified for 3.4
	 * <ul>
	 * <li>DM integration: Addition of the parameters for the DM application</li>
	 * </ul>
	 */
	callApplication: function(appId, tabId, view) {
		if (!Object.isEmpty(this._user.id)) {
 			try {
				global.setEmployeeSelected(this._user.id, true);
			} catch (e) {}
 		}
		
 		global.open($H({
			app: {
				appId	: appId,
				tabId	: tabId,
				view	: view
			},
			//since 3.4 - Parameters for MyDocuments
			emp				: this._user.id,
			empName			: this._user.name ,
			fromOut			: true,
			//Parameters for the employee history
			employeeId		: this._user.id, 
			employeeName	: this._user.name,
			employeeCompany	: this._user.company
		}));
	},
	
	/**
	 * Display the list of actions on the screen in one of the different possible format
	 * @param {Array} listActions List of actions with the parameters:
	 * <ul>
	 * <li><b>appId</b>: Id of the application to launch</li>
	 * <li><b>view</b>: View of the element to launch</li>
	 * <li><b>tabId</b>: Id of the tab to open</li>
	 * <li><b>label</b>: Label to display on the screen</li>
	 * </ul>
	 * @param {Event} event Event that start the display of the menu
	 * @since 1.1
	 */
	displayOnScreen: function(listActions, event){alert('This function is abstract!')}
});

/**
 * @type Hash
 * @description Cache used to avoid calling SAP several times for the same employee.
 * @since 1.0
 */
ScmUserAction._cache = $H();

/**
 * Identifier to indicate that the actions should be displayed like in the left menu
 * @type String
 * @since 1.1
 */
ScmUserAction.DISPLAY_AS_MENU 	= 'M';

/**
 * Identifier to indicate that the actions should be displayed like in the main application
 * @type String
 * @since 1.1
 */
ScmUserAction.DISPLAY_AS_APPLI 	= 'A';

/**
 * Factory used to create a user action with the wanted format
 * @param {Object} displayType Indicate wich class is to use. The possible values are:
 * <ul>
 * <li>{@link ScmUserAction#DISPLAY_AS_MENU} to display as in the left menu</li>
 * <li>{@link ScmUserAction#DISPLAY_AS_APPLI} to display as in the application</li>
 * </ul>
 * @param {Application} caller Instance that created the object
 * @param {String/Element} id Element of its identifier that have to be an action
 * @param {Array} prohibitAct (optional) List of the actions to do not call event if it is in the custo
 * @param {Element} ancestor (optional) Indicate the HTML parent that has to contains the element with actions
 * @param {String} usedView (Optional) Name to use for the caller application
 * @since 1.1
 */
ScmUserAction.factory = function(displayType, caller, id, prohibitAct, ancestor, usedView) {
	switch(displayType) {
		case ScmUserAction.DISPLAY_AS_MENU:
			return new ScmUserActionMenu(caller, id, prohibitAct, ancestor, usedView);
		case ScmUserAction.DISPLAY_AS_APPLI:
			return new ScmUserActionBalloon(caller, id, prohibitAct, ancestor, usedView);
	}
};
/**
 * @class
 * @description Class that display the list of actions in a contextual menu
 * @author jonathanj & nicolasl
 * @version 1.1
 */
var ScmUserActionMenu = Class.create(ScmUserAction, /** @lends ScmUserAction.prototype */{
	/**
	 * Display the list of actions on the screen in one of the different possible format
	 * @param {Array} listActions List of actions with the parameters:
	 * <ul>
	 * <li>appId: Id of the application to launch</li>
	 * <li>view: View of the element to launch</li>
	 * <li>tabId: Id of the tab to open</li>
	 * <li>label: Label to display on the screen</li>
	 * </ul>
	 * @param {Event} event Event that start the display of the menu
	 * @since 1.1
	 */
	displayOnScreen: function(listActions, event) {
		var menuItems = $A();
		
		//If there is nothing to set in the menu
		if (listActions.size() === 0) {
			menuItems.push({
				name	: global.getLabel('No_actions'),
				callback: function(event){}
			});
		
		//If there is something in the menu
		} else {
			listActions.each(function(action){
				menuItems.push({
				 	name	: global.getLabel(action.label),
				 	callback: function(event){
				 		this.callApplication(action.appId, action.tabId, action.view);
				 	}.bindAsEventListener(this)
			 	});
		 	}.bind(this));
		}
		new Proto.Menu({menuItems: menuItems}).show(event);
	}
});

/**
 * @class
 * @description Class that display the list of actions in a balloon
 * @author jonathanj & nicolasl
 * @version 1.1
 */
var ScmUserActionBalloon = Class.create(ScmUserAction, /** @lends ScmUserAction.prototype */{
	/**
	 * Display the list of actions on the screen in one of the different possible format
	 * @param {Array} listActions List of actions with the parameters:
	 * <ul>
	 * <li>appId: Id of the application to launch</li>
	 * <li>view: View of the element to launch</li>
	 * <li>tabId: Id of the tab to open</li>
	 * <li>label: Label to display on the screen</li>
	 * </ul>
	 * @param {Event} event Event that start the display of the menu
	 * @since 1.1
	 */
	displayOnScreen: function(listActions, event) {
		var balloonContent 	= new Element('div', {'id': 'SCM_ContextualMenu'});
		var menuString 		= '';

		//If there is nothing to set in the menu
		if (listActions.size() === 0) {
			balloonContent.insert(global.getLabel('No_actions'));
		
		//If there is something in the menu
		} else {
			balloonContent.insert('<div>' + global.getLabel('ListAvailableActions') + '</div>');
			
			menuString = '<ul>';
			listActions.each(function(action){
				menuString += '<li class="SCM_ContextualMenuAction application_action_link" appid="' + action.appId + '" tabid="' + action.tabId + '" view="' + action.view + '">' + global.getLabel(action.label) + '</li>';
		 	}, this);
			menuString += '</ul>';
			
			balloonContent.insert(menuString);
		}

		//Add the content of the balloon
		balloon.setOptions($H({
            domId		: event.element().up(2).down('div.SCM_PoolTable_actions_after').identify(),
            content		: balloonContent
        }));
		
		//Add the actions on click
		balloonContent.select('li.SCM_ContextualMenuAction').each(function(liItem) {
			liItem.observe('click', function(event) {
				var element = event.element();
				this.callApplication(element.readAttribute('appid'), element.readAttribute('tabid'), element.readAttribute('view'));
				balloon.hide();
			}.bindAsEventListener(this));
		}, this);
		
        balloon.show();

	}
});



