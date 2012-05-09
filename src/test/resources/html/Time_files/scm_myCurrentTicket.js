/**
 * @class
 * @description Display the list of tickets in processing, the notifications and 
 * allows to select a default ticket in processing and to create new tickets.
 * @augments Menu
 * @author jonathanj & nicolasl
 * @version 4.0
 * <br/>Modified in 4.0
 * <ul>
 * <li>Remove the item to display the current mode of the agent</li>
 * </ul>
 * <br/>Modified in 3.4
 * <ul>
 * <li>Adapt to a refactoring of the notifications</li>
 * <li>Allow to delete a notification via an event</li>
 * <li>Delete the notifications only on display and do not call the backend to have a result that you know in advance</li>
 * <li>1024601 - In the stop transfer request popup, enable/disable the buttons when there is a description or not</li>
 * </ul>
 * <br/>Modified in 3.3
 * <ul>
 * <li>1024600 - Update the display of the stop transfer accept/reject to set all the param in a single table and update some labels</li>
 * <li>1024237 - Allow to delete a notification from the list and do it when clicking a schedule elapsed notification</li>
 * </ul>
 * <br/>Modified in 3.1
 * <ul>
 * <li>If there is no requestor, does not display its line</li>
 * </ul>
 * <br/>Modifications for 3.0
 * <ul>
 * <li>Change the signature of the {@link ScmEmployeeSearch} factory</li>
 * <li>Add the new kind of notifications related to the transfer</li>
 * <li>Add the popup to allow accept/reject a Stop transfer request</li>
 * <li>Get the list of icons for the notifications from a global static list</li>
 * </ul>
 */
var scm_MyCurrentTicket = Class.create(Menu, /** @lends scm_MyCurrentTicket.prototype */{
    /**
	 * @type Hash
	 * @description List of the event handlers bind to this class.
	 * @since 1.0
	 */
	_listeners: null,
	
    /**
	 * @type Element
	 * @description HTML div that contains the menu.
	 * @since 1.0
	 */
    virtualHtml: null,
    
    /**
	 * @type String
	 * @description Identifier of the currently selected ticket.
	 * @since 1.0
	 */
    currentTicket: null,
    
    /**
	 * @type EmployeeSearch
	 * @description Object used to build the employees list.
	 * @since 1.0
	 */
    employeeSearch: null,
    
    /**
	 * @type Hash
	 * @description List of tickets with there Id as key.
	 * @since 1.0
	 */
    _tickets: null,
    
    /**
	 * @type {id: String, button: megaButtonDisplayer}
	 * @description The mega button displayer of the create ticket button and its id.
	 * @since 1.0
	 */
    _createTicketButton: null,
    
	/**
	 * @type String
	 * @description Indicate if the mode is:
	 * <ul>
	 * 	<li><i>scm_MyCurrentTicket.AGENT</i> if the user is in the agent or general pool,</li> 
	 * 	<li><i>scm_MyCurrentTicket.TL</i> if the agent is in the team leader pool <b>with a team selected</b> or</li> 
	 * 	<li><i>scm_MyCurrentTicket.OPM</i> if the agent is in the OPM pool</li>
	 * 	<li><i>scm_MyCurrentTicket.OFF</i> if the HRW connexion is lost</li>
	 * </ul>
	 * If the agent is not in one of these places, the last mode is kept.
	 * @since 1.0
	 */
	_mode: null,
	
	/**
	 * @type Boolean
	 * @description Indicate if there is a selected team
	 * @since 1.0
	 */
	_teamSelected: null,
	
	/**
	 * Indicate if it is the first display of the menu
	 * @default true
	 * @type Boolean
	 * @since 1.1
	 */
	_firstDisplayOfNotifs: true,
	
	/**
	 * @type String
	 * @description Indicate if the mode currently in use (the mode display in the screen now) is:
	 * <ul>
	 * 	<li><i>scm_MyCurrentTicket.AGENT</i> if the user is in the agent or general pool,</li> 
	 * 	<li><i>scm_MyCurrentTicket.TL</i> if the agent is in the team leader pool <b>with a team selected</b> or</li> 
	 * 	<li><i>scm_MyCurrentTicket.OPM</i> if the agent is in the OPM pool</li>
	 * 	<li><i>scm_MyCurrentTicket.OFF</i> if the HRW connexion is lost</li>
	 * </ul>
	 * @since 1.1
	 */
	_currentMode: null,
	
	/**
	 * Class constructor that calls the parent and sets the event listener for the class.
	 * @param {String} id
	 * @param {JSON Object} options
	 * @since 1.0
	 * <br/>Modified in 3.4
	 * <ul>
	 * <li>Add an event to allow deleting a notification</li>
	 * </ul>
	 */
    initialize: function($super, id, options){
        $super(id, options);
        
		this._firstDisplayOfNotifs	= true;
		
		this._teamSelected 			= false;
		this._allowNotifRefresh		= true;
		
        this._listeners = $H({
            refreshPendList     : this.refreshPendList.bindAsEventListener(this)    	,
            employeeSelected    : this.employeeSelected.bindAsEventListener(this)   	,
            noEmployeeSelected  : this.noEmployeeSelected.bindAsEventListener(this)		,
			newNotification		: this.refreshNotifications.bindAsEventListener(this)	,
			poolOpened          : this.poolOpened.bindAsEventListener(this)            	,
			teamSelected		: this.teamSelected.bindAsEventListener(this)			,
			updateMode			: this.updateMode.bindAsEventListener(this)				,
			noMoreConnected		: this.noMoreConnected.bindAsEventListener(this)		,
			hrwConnected		: this.hrwConnected.bindAsEventListener(this)			,
			//since 3.4 - Allow to remove a notification
			deleteNotif			: this.deleteNotif.bindAsEventListener(this)
        });
		
		document.observe('EWS:scm_poolOpened', this._listeners.get('poolOpened'));
    },
	
	/**
	 * Once the menu is to display, build its HTML content or rebuild it and start the listening of menu
	 * events.
	 * @param {Object} element
	 * @since 1.0
	 * <br/>Modified in 3.4
	 * <ul>
	 * <li>Add an event to allow deleting a notification</li>
	 * </ul>
	 */
    show: function($super, element){
        $super(element);
		
		this.changeTitle(global.getLabel('scm_MyCurrentTicket'));
		
        //Add the main div in the screen
    	if(this.virtualHtml === null) {
    	    //Login in HRW
            hrwEngine.login(this);
            
	        this.virtualHtml = new Element('div', {'id': 'SCM_myCurrTicket'});
	        //Display the content
	        this.changeContent(this.virtualHtml);
	        //Build the main architecture of the ticket
            this.buildMainDivs(this.virtualHtml);
            
        //Display simply the content            
        } else {
	        this.changeContent(this.virtualHtml);
			if(!Object.isEmpty(this.employeeSearch)) this.employeeSearch.reload();
	    }
		
	    //List to some global event
    	document.observe('EWS:scm_refreshPendList'      , this._listeners.get('refreshPendList')    );
		document.observe('EWS:scm_employeeSearchChanged', this._listeners.get('noEmployeeSelected')	);
    	document.observe('EWS:scm_employeeSelected'     , this._listeners.get('employeeSelected')   );
    	document.observe('EWS:scm_noEmployeeSelected'   , this._listeners.get('noEmployeeSelected') );
		document.observe('EWS:scm_new_notification'		, this._listeners.get('newNotification')	);
		document.observe('EWS:scm_teamSelected' 		, this._listeners.get('teamSelected')		);
		document.observe('EWS:scm_poolItemsLoaded' 		, this._listeners.get('updateMode')			);
		document.observe('EWS:scm_noMoreConnected'		, this._listeners.get('noMoreConnected')	);
		document.observe('EWS:scm_HrwConnected'			, this._listeners.get('hrwConnected')		);
		//since 3.4 - Add an event to delete a notification
		document.observe('EWS:scm_deleteNotification'	, this._listeners.get('deleteNotif')		);
	},

	/**
	 * Disable the observing of events once the menu is closed.
	 * @since 1.0
	 * <br/>Modified in 3.4
	 * <ul>
	 * <li>Add an event to allow deleting a notification</li>
	 * </ul>
	 */
    close: function($super){
		document.stopObserving('EWS:scm_refreshPendList'    	, this._listeners.get('refreshPendList')    );
		document.stopObserving('EWS:scm_employeeSearchChanged'	, this._listeners.get('noEmployeeSelected')	);
        document.stopObserving('EWS:scm_employeeSelected'   	, this._listeners.get('employeeSelected')   );
    	document.stopObserving('EWS:scm_noEmployeeSelected' 	, this._listeners.get('noEmployeeSelected') );
		document.stopObserving('EWS:scm_new_notification'		, this._listeners.get('newNotification')	);
		document.stopObserving('EWS:scm_teamSelected' 			, this._listeners.get('teamSelected')		);
		document.stopObserving('EWS:scm_poolItemsLoaded' 		, this._listeners.get('updateMode')			);
		document.stopObserving('EWS:scm_noMoreConnected'		, this._listeners.get('noMoreConnected')	);
		document.stopObserving('EWS:scm_HrwConnected'			, this._listeners.get('hrwConnected')		);
		//since 3.4 - Add an event to delete a notification
		document.stopObserving('EWS:scm_deleteNotification'		, this._listeners.get('deleteNotif')		);
    },
    
    /**
     * @param {Element} parentNode Node that has to contains the divs
     * @description Build the main structure of the menu content with the different divs. 
     * This method fixes the default display. 
	 * @since 1.0
	 * <br/> Modification 4.0:
	 * <ul>
	 * <li>Remove the line to indicate the agent mode</li>
	 * </ul>
     */
    buildMainDivs: function(parentNode) {
        var divTemplate = new Template( '<div class="SCM_myCurrTicketDiv_categ" id="SCM_myCurrTicketDiv_#{id}">'
                                    +       '<div id="SCM_myCurrTicketArrow_#{id}" divext="SCM_myCurrTicketDivExt_#{id}" class="application_action_link application_down_arrow SCM_myCurrTicketArrow"></div>'
                                    +       '<span class="SCM_myCurrTicketTitle" id="SCM_myCurrTicketDivTitle_#{id}"></span>'
                                    +       '<div class="SCM_myCurrTicketDivMain_Tickets" id="SCM_myCurrTicketDivExt_#{id}"></div>'
                                    +       '<div class="application_clear_line"></div>'
                                    +   '</div>');
                         
		parentNode.insert(divTemplate.evaluate({'id': 'Tickets'		}));
		parentNode.insert(divTemplate.evaluate({'id': 'ActEmpl'		}));
		parentNode.insert(divTemplate.evaluate({'id': 'Requestor'	}));
		parentNode.insert(divTemplate.evaluate({'id': 'Notification'}));
        parentNode.insert(divTemplate.evaluate({'id': 'FindEmpl' 	}));
		
		//Get the default mode
		this.getDefaultMode();
		
		//Update the form to find an employee
        this.updateFindEmployee();
        
        //Call the backend to have the list of tickets in updateTickets
		//since 2.2 Load the list of processing tickets on load. It is not normal, but it happens
        this.refreshPendList();
		
		//Collapse the notifications by default
		this.collapseLine(parentNode.down('[id="SCM_myCurrTicketDiv_Notification"]'));
    },
    
	/**
	 * @param {Boolean} toCollapse (default: false)Indicate if the list of notifications is automatically to collapse.
     * @description Call the backend to get the list of notifications
	 * @since 1.0
     * @see scm_MyCurrentTicket#updateNotifs
     */
	refreshNotifications: function(toCollapse) {
		if(toCollapse !== true) toCollapse = false;
		
		if(Object.isEmpty(this._mode)) {
			new PeriodicalExecuter(function(pe) {
				if (Object.isEmpty(this._mode)) return;
			    pe.stop();
				if(this._mode !== scm_MyCurrentTicket.OPM && this._mode !== scm_MyCurrentTicket.OFF)
					hrwEngine.callBackend(this, 'TicketPool.GetNotificationHistory', $H({scAgentId: hrwEngine.scAgentId}), this.updateNotifs.bind(this, toCollapse));
			}.bind(this), 1);
		} else if(this._mode !== scm_MyCurrentTicket.OPM && this._mode !== scm_MyCurrentTicket.OFF)
			hrwEngine.callBackend(this, 'TicketPool.GetNotificationHistory', $H({scAgentId: hrwEngine.scAgentId}), this.updateNotifs.bind(this, toCollapse));
		
		//Indicate that the notification are already on the screen
		this._firstDisplayOfNotifs = false;
	},
	
    /**
     * @description Call the backend to get the list of pending tickets.
	 * @since 1.0
     * @see scm_MyCurrentTicket#updateTickets
     */
    refreshPendList: function() {
        this.currentTicket = null;
        hrwEngine.callBackend(this, 'TicketPool.GetProcessingPool', $H({scAgentId: hrwEngine.scAgentId}), this.updateTickets.bind(this));
    },
    
	/**
     * @description Handle the opening of a pool to adapt the mode.
	 * @since 1.0
     * @see scm_MyCurrentTicket#_mode
     */
	poolOpened: function(options) {
		//If we are no more logged => no connection
		if(hrwEngine.sessionLost === true) {
			this._mode = scm_MyCurrentTicket.OFF;
			return;
		}
		
		//Determine the mode from the pool type
		switch(getArgs(options).poolType) {
			case 'MyPool':
			case 'GeneralPool':
				if(this._mode === scm_MyCurrentTicket.AGENT) return;
				this._mode = scm_MyCurrentTicket.AGENT;
				break;
			case 'TeamPool':
				if(this._mode === scm_MyCurrentTicket.TL) return;
				if(this._teamSelected === true)
					this._mode = scm_MyCurrentTicket.TL;
				break;
			case 'OPMPool':
				if(this._mode === scm_MyCurrentTicket.OPM) return;
				this._mode = scm_MyCurrentTicket.OPM;
				break;
		}
	},
    /**
     * @param {String} id Identifier to define a unique div.
     * @param {Element/String} visibleLine Line that is always visible to indicate the content of the section.
     * @param {Element} extension Content to show/hide when clicking (if empty =>not possible to extend).
     * @description Update the content of a div in the menu with the given titles and content. <br/>
     * If there is no content, the part is automatically collpased and not extendable.
     * @returns {Element} The element that contains the arrow for the collapsing/Extension
	 * @since 1.0
     */
    updateDiv: function(id, visibleLine, extension) {
        var mainDiv = this.virtualHtml.down('div#SCM_myCurrTicketDiv_' + id);
		var arrow;
		
        if(mainDiv.visible() === false) mainDiv.show();
        
        div = mainDiv.down('span#SCM_myCurrTicketDivTitle_' + id);
        if(!Object.isEmpty(div)) {
            div.update();
            div.insert(visibleLine);
        }
         
        div = mainDiv.down('div#SCM_myCurrTicketDivExt_' + id);   
        if(!Object.isEmpty(div)) {
            div.update();
            div.insert(extension);
        }  
        
        //If there is a non empty extension => add to observe the on click
        if(!Object.isEmpty(extension)) {
			arrow = mainDiv.down('div#SCM_myCurrTicketArrow_' + id);
            arrow.stopObserving();
            arrow.observe('click', function(event) {
                var element = Event.element(event);
				
                //We are in the case where we have to hide the content
                if(element.hasClassName('application_down_arrow')) this.collapseLine(element)
				
                //We are in the case where we want to extend the section
                else if(element.hasClassName('application_verticalR_arrow')) this.expandLine(element);
            }.bindAsEventListener(this));
			
        //If there is no extension => the arrow is not a link and is always extended
        } else {
            arrow = mainDiv.down('div#SCM_myCurrTicketArrow_' + id);
            if(arrow.hasClassName('application_down_arrow')) {
                arrow.removeClassName('application_action_link');
                arrow.removeClassName('application_down_arrow');
                arrow.addClassName('application_verticalR_arrow');
                mainDiv.down('div#SCM_myCurrTicketDivExt_' + id).hide();
            }
        }
		
		return arrow;
    },
    
	/**
     * @param {Element} element Element to expand
     * @description Expand manually a section
     * @returns {Boolean} Is the expension really done?
	 * @since 1.0
     */
	expandLine: function(element) {
		if(!element.hasClassName('application_verticalR_arrow')) return false;
		
        element.removeClassName('application_verticalR_arrow');
        element.addClassName('application_down_arrow');
        this.virtualHtml.down('div#'+element.readAttribute('divext')).show();
		return true;
	},
	
	/**
     * @param {Element} element Element to collapse
     * @description Collapse manually a section
     * @returns {Boolean} Is the collapsing really done?
	 * @since 1.0
     */
	collapseLine: function(element) {
		if (!element.hasClassName('application_down_arrow')) return false;
		
		element.removeClassName('application_down_arrow');
		element.addClassName('application_verticalR_arrow');
		this.virtualHtml.down('div#' + element.readAttribute('divext')).hide();
		return true;
	},
	
    /**
     * @param {String} id Identifier to define a unique div
     * @description Hide one of the submenus completely
	 * @since 1.0
     */
    hideDiv: function(id) {
        var div = this.virtualHtml.down('div#SCM_myCurrTicketDiv_' + id);
        if(div.visible() === true) div.hide();
    },
    
    /**
     * @param {JSON Object} ticketsJson Json that allows to build the list of tickets
     * @description Get the content to display in the list of tickets under processing
	 * @since 1.0
     */
    updateTickets: function(ticketsJson) {		
		var defaultTicketPos 	= 0;
		var logActionChecked	= false;
		var promptAlwaysChecked	= false;

		if(global.activateHRWLog && !Object.isEmpty(this.virtualHtml.down('div#SCM_myCurrTicketDiv_LogActions'))) {
			logActionChecked 	= this.virtualHtml.down('[id="'+SCM_SaverToTicket.DIV_LOG_ACTION+'"]').down('input[name="SCM_MyCurrTicket_LogActions"]').checked;
			promptAlwaysChecked = this.virtualHtml.down('[id="'+SCM_SaverToTicket.DIV_PROMPT_ALWAYS+'"]').down('input[name="SCM_MyCurrTicket_PromptAlways"]').checked;
		}
				
        //Create the title and the list of tickets 
        var title       = global.getLabel('tickets_in_processing_assigned_to_me');
        var extension   = new Element('div');
        //Get the list of tickets                      
        var tickets		= HrwRequest.getJsonArrayValue(ticketsJson, 'TicketPoolData.HrwPoolTickets.HrwPoolTicket');
		    
		//Reset the list of tickets
		this._tickets = $H();
		
	    //Create the tickets objects for each ticket
		tickets.each( function(ticket, key) {
			poolTicket = SCM_Ticket.factory('MyCurrentTicket');
			poolTicket.addMainInfo(ticket);

            //Add the ticket parameters in the global list
            this._tickets.set(poolTicket.getValue('TICKET_ID'), poolTicket);
		}.bind(this));
		
		extension.insert(this.buildTicketList());
        
        //If there are some tickets, allow to select for notifications and add the selection event and set the default ticket
        if(this.hasTickets() === true) {
            this.updateActiveEmployee(this.currentTicket);
			title += '<input type="hidden" id="' + SCM_SaverToTicket.DIV_HAS_TICKETS + '" value="true"/>';                           
        } else {
            this.hideDiv('ActEmpl');
            this.hideDiv('Requestor');
			title += '<input type="hidden" id="' + SCM_SaverToTicket.DIV_HAS_TICKETS + '" value="false"/>';
		}
		
		//Add the log actions select box
		if(global.activateHRWLog)
			extension.insert(	'<div class="SCM_myCurrTicketDiv_categ" id="SCM_myCurrTicketDiv_LogActions">'
	                    +       	'<div id="SCM_myCurrTicketArrow_LogActions" divext="SCM_myCurrTicketDivExt_LogActions" class="application_action_link application_down_arrow SCM_myCurrTicketArrow"></div>'
	                    +       	'<span class="SCM_myCurrTicketTitle" id="SCM_myCurrTicketDivTitle_LogActions"></span>'
	                    +       	'<div class="SCM_myCurrTicketDivMain_Tickets" id="SCM_myCurrTicketDivExt_LogActions"></div>'
	                    +   	'</div>');				
		
       	this.updateDiv('Tickets', title, extension);
		
		//Update the list of log actions pane
		if (global.activateHRWLog) {
			var template = new Template('<div id="#{id}">'
									+		'<input #{checked} type="checkbox" name="#{name}"/>'
									+		'<span class="SCM_myCurrTicket_LogText">#{label}</span>'
									+	'</div>')
			
			this.updateDiv('LogActions', global.getLabel('LogProperties'), new Element('div').insert(template.evaluate({
				'id'	: SCM_SaverToTicket.DIV_LOG_ACTION,
				name	: 'SCM_MyCurrTicket_LogActions',
				label	: global.getLabel('log_actions_to_sel_ticket'),
				checked	: (logActionChecked) ? 'checked="checked"' : ''
			}) +
			template.evaluate({
				'id'	: SCM_SaverToTicket.DIV_PROMPT_ALWAYS,
				name	: 'SCM_MyCurrTicket_PromptAlways',
				label	: global.getLabel('AlwaysPromptBeforeUpdate'),
				checked	: (promptAlwaysChecked) ? 'checked="checked"' : ''
			})));
			
			//Collapse the actions when the tickets are updated
			this.collapseLine(extension.down('div#SCM_myCurrTicketArrow_LogActions'));
		}
    },
	
	/**
	 * Update the display of the list of notifications with a new list. The icons are shared between applications in the list {@link ScmNotifications#ICONS}.
	 * @param {Boolean} toCollapse Indicate if the list of notifs is to collapse automatically.
	 * @param {JSON Object} jsonNotifs List of notifications from the backend.
	 * @since 1.0
	 * <br/>Modified in 3.4
	 * <ul>
	 * <li>Adapt to a refactoring of the notifications</li>
	 * <li>Do not call teh backend to remove the notifications. Delete it in the frontend and wait for a next occasion to synchronize</li>
	 * </ul>
	 * <br/>Modified in 3.3
	 * <ul>
	 * <li>1024237 - When clicking on a shchedule elapsed notification, remove it from the list manually</li>
	 * </ul>
	 * <br/>Modified in verison 3.0
	 * <ul>
	 * <li>Manage the transfer notifications</li>
	 * <li>Get the list of icons from the list {@link ScmNotifications#ICONS}</li>
	 * </ul>
	 * <br/>Modified in verison 2.0
	 * <ul>
	 * <li>Manage the schedule elapsed notifications</li>
	 * </ul>
     */
	updateNotifs: function(toCollapse, jsonNotifs) {
		//since 3.0 Add the notification reason in the HTML code
		var notifTemp 	= new Template(	'<li notifid="#{NotificationId}" title="#{ToolTipMessage}">'
									+		'<div class="application_action_link application_currentSelection SCM_currTick_delNotif"> </div>'
									+		'<div class="SCM_ActionsIconSize">'
									+			'<div class="#{NotifReasonClass}"> </div>'
									+		'</div>'
									+		'#{DateTime} - '
									+		'<span withdelete="#{withDelete}" class="application_action_link" reason="#{NotificationReason}">#{TicketId}</span>'
									+	'</li>');
		//since 2.0 Create a template without deletion	
		//since 3.0 Add the notification reason in the HTML code						
		var notifNoDel	= new Template(	'<li notifid="#{NotificationId}" title="#{ToolTipMessage}">'
									+		'<div class="SCM_ActionsIconSize">'
									+			'<div class="#{NotifReasonClass}"> </div>'
									+		'</div>'
									+		'#{DateTime} - '
									+		'<span withdelete="#{withDelete}" class="application_action_link" reason="#{NotificationReason}">#{TicketId}</span>'
									+	'</li>');
									
		var extCont		= '';
		var notifs 		= $A();
		var extension   = null;
		var title		= null;

		var notifsExtract = HrwRequest.getJsonArrayValue(jsonNotifs, 'ArrayOfHrwNotification.HrwNotification');
		notifs = notifsExtract.sortBy(function(notif) {
			return (new Number(	notif.NotificationDateTime.substr(0, 4) 
					+ 	notif.NotificationDateTime.substr(5, 2) 
					+ 	notif.NotificationDateTime.substr(8, 2)
					+	notif.NotificationDateTime.substr(11, 2)
					+	notif.NotificationDateTime.substr(14, 2)
					+	notif.NotificationDateTime.substr(17, 2)) * (-1));
		});
		
		//Create the title 
        title = global.getLabel('Notifications_for') + ' <span id="SCM_currTicket_notif_mode">' + global.getLabel(this._mode) + '</span> (' + notifs.size() + ')';
        
		//Get the list of notifications
		if(notifs.size() > 0) {
			//since 3.3 - 1024237 - Add an identifier to the main notifications list
			extension 	= new Element('div', {'id': 'SCM_currTick_NotifsList'});	
				
			// Add the notifications
			extCont = '<ul class="SCM_list_no_bullet">';

			notifs.each(function(notif) {
				//since 2.0 Add the default template
				if(notif.NotificationReason === '5' || notif.NotificationReason === '100') notif.withDelete = "false";
				else notif.withDelete = "true";
				
				//since 3.0 Get the icon to display from a static list
				//since 3.4 Due to the change of the class notification, change the name of the static method
				notif.NotifReasonClass = ScmNotifications.getIcon(notif.NotificationReason, notif.ticketType);
				notif.DateTime = SCM_Ticket.convertDateTime(notif.NotificationDateTime).truncate(23);
				//since 2.0 Use the adapted template
				if(notif.withDelete === "true") extCont += notifTemp.evaluate(notif);
				else extCont += notifNoDel.evaluate(notif);
			}.bind(this));
			extCont += '</ul>';
			extension.insert(extCont);
			extension.insert('<div class="application_action_link SCM_currTick_notifClear">' + global.getLabel('clear_notif') + '</div>');
			
			//Suppression of the given notification
			extension.select('div.SCM_currTick_delNotif').invoke('observe', 'click', function(event) {
				var notifId = event.element().up().readAttribute('notifid');
				hrwEngine.callBackend(this, 'TicketPool.RemoveHrwNotification', $H({
					scAgentId		: hrwEngine.scAgentId,
					notificationId	: notifId
				}), this.refreshNotifications.bind(this));
			}.bindAsEventListener(this));
			
			//Suppress all the notifications before now
			extension.select('div.SCM_currTick_notifClear').invoke('observe', 'click', function() {
				hrwEngine.callBackend(this, 'TicketPool.ClearHrwNotifications', $H({
					scAgentId: hrwEngine.scAgentId
				}), this.refreshNotifications.bind(this));
			}.bindAsEventListener(this));
			
			var navigateToTicket = function(ticketId, inProcessing) {
				global.open($H({
					app: {
						appId	: 'TIK_PL',
						tabId	: 'PL_TIK',
						view	: 'scm_ticketApp'
					},
					forCreation	: false,
					forEdition	: inProcessing,
					ticketId	: ticketId
				}));
			};
			
			//Allow to click on a ticket link
			extension.select('span.application_action_link').invoke('observe', 'click', function(event) {
				var ticketId 		= event.element().innerHTML;
				var withDelete		= (event.element().readAttribute('withdelete') === "true");
				var reason			= event.element().readAttribute('reason');
				var inProcessing 	= false;
				//since 3.3 - 1024237 - Read the notification id
				var notifId			= event.element().up('li').readAttribute('notifid');
				
				if($(SCM_SaverToTicket.DIV_TICKETS_LIST)) {
					$(SCM_SaverToTicket.DIV_TICKETS_LIST).select('li').each(function(listItem){
						if (ticketId === listItem.down('input').readAttribute('value')) 
							inProcessing = true;
					}, this);
				}
				
				//since 2.0 If the element is to delete, it is a normal notification
				if(withDelete) {
					navigateToTicket(ticketId, inProcessing);
				
				//since 3.0 Check that the notification reason is a schedule elapsed	
				//since 2.0 If the notification is not to delete it means that the ticket is to take in processing and the notification deleted
				} else if (reason === '100'){
					//Take the ticket in processing
					if(inProcessing === false) {
						hrwEngine.callBackend(this, 'Ticket.StartProcessingTicket', $H({
							'scAgentId': hrwEngine.scAgentId, 
							'ticketId': ticketId}), function(){
								//since 3.3 - 1024237 - Delete the clicked notification
								this.deleteNotif(notifId);
								this.refreshPendList();
								navigateToTicket(ticketId, true);
							}.bindAsEventListener(this));	
					} else 
						navigateToTicket(ticketId, inProcessing);
						
				//since 3.0 For the stop transfer requests, add a new manager
				} else if(reason === '5') {
					document.observe('EWS:SCM_stopTransferClosed', function(event) {
						document.stopObserving('EWS:SCM_stopTransferClosed');
						//since 3.4 - Delete the notification only on the display, the engine do the rest automatically
						if(!getArgs(event).cancelled)
							this.deleteNotif(notifId);
					}.bindAsEventListener(this));
					
					//Call the backend to get the values for the accept/deny of a stop transfer
					hrwEngine.callBackend(this, 'Ticket.GetAcceptDenyStopTransferDisplay', $H({
						scAgentId	: hrwEngine.scAgentId,
						ticketId	: ticketId
					}), scm_MyCurrentTicket.showAcceptDenyStopTransfer.bind(this, this, ticketId));
				}
			}.bindAsEventListener(this));
		} else {
			//since 3.3 - 1024237 - Add the identifier in the notifications main div
			extension = new Element('div', {'id': 'SCM_currTick_NotifsList', 'class': 'application_main_soft_text SCM_solveNoDisplayProb'}).update(global.getLabel('No_notifications'));
		}
		
		if (!Object.isEmpty(this._mode)) {
			var notifDiv = this.updateDiv('Notification', title, extension);
			if (toCollapse === true) 
				this.collapseLine(notifDiv);
		} else {
			this.updateDiv('Notification', title, extension);
			this.hideDiv('Notification');
		} 	
	},
	
	/**
	 * Method used to delete a notification from the list without calling the backend
	 * @param {String/Event} notifId Identifier of the notification to delete
	 * @since 3.3
	 * <br/>Modified in 3.4
	 * <ul>
	 * <li>Allow the notifId to be an event instead of a string</li>
	 * <li>Create a clone of the list of notifications to avoid having pointers issues in IE</li>
	 * </ul>
	 */
	deleteNotif: function(notifId) {
		//since 3.4 - If the method is called by an event, get the ticket id from the event
		if(!Object.isString(notifId)) notifId = getArgs(notifId);
		
		//Get the main div with the notifications
		var notifsList = this.virtualHtml.down('div[id="SCM_currTick_NotifsList"]');
		if(Object.isEmpty(notifsList)) return;
		
		//since 3.4 Clone the  list of notifications because reusing the element cause troubles in IE
		var newNotifsList = new Element('div', {id: 'SCM_currTick_NotifsList'});
		newNotifsList.insert(notifsList.innerHTML);
		
		//Get the line with the notification item
		var notifItem = newNotifsList.down('li[notifid="' + notifId + '"]');
		if(Object.isEmpty(notifItem)) return;
		
		//Remove the line with the item and if there is no more entry, set the no entry message
		notifItem.remove();
		var notifsListLi 	= newNotifsList.select('li');
		var title 			= global.getLabel('Notifications_for') + ' <span id="SCM_currTicket_notif_mode">' + global.getLabel(this._mode) + '</span> (' + notifsListLi.size() + ')';
		
		if(notifsListLi.size() === 0) 
			newNotifsList = new Element('div', {'id': 'SCM_currTick_NotifsList', 'class': 'application_main_soft_text SCM_solveNoDisplayProb'}).update(global.getLabel('No_notifications'));
		
		//Update the display
		this.updateDiv('Notification', title, newNotifsList);
	},
	
	/**
     * @description Get the default mode for the menu from the backend if there is no defined mode.
	 * @since 1.0
     * @see scm_MyCurrentTicket#getDefaultModeHandler
     * @see scm_MyCurrentTicket#_mode
     */
	getDefaultMode: function() {
		if (Object.isEmpty(this._mode) || this._mode === scm_MyCurrentTicket.OFF) {
			hrwEngine.callBackend(this, 'TicketPool.GetTicketPoolMode', $H({
				scAgentId: hrwEngine.scAgentId
			}), this.getDefaultModeHandler.bind(this));
		}
	},
	
	/**
	 * @param {JSON Object} jsonMode Mode of the current engine state
     * @description Handler that get the getDefaultMode method.
	 * @since 1.0
     * @see scm_MyCurrentTicket#getDefaultMode
     * @see scm_MyCurrentTicket#_mode
     */
	getDefaultModeHandler: function(jsonMode) {
		if(!Object.isEmpty(this._mode) && this._mode !== scm_MyCurrentTicket.OFF) return;
		
		switch(HrwRequest.getJsonValue(jsonMode, 'TicketPoolMode.CurrentTicketPoolMode', HrwEngine.NO_VALUE, HrwRequest.STRING)) {
			case '0': 
			case '1':
				this._mode = scm_MyCurrentTicket.AGENT;
				break;
			case '3':
				this._mode = scm_MyCurrentTicket.TL;
				break;
			case '4':
				this._mode = scm_MyCurrentTicket.OPM;
				break;
			default: 
				this._mode = scm_MyCurrentTicket.OFF;
				break;
		} 
		this.updateMode();
	},
	
	/**
     * @description Update the section with the current mode.
	 * @since 1.0
     * <br/>Modified in 4.0
     * <ul>
     * <li>Remove the line to indicate the agent mode</li>
     * </ul>
     */
	updateMode: function() {
		//Do not update the mode if it is up to date
		if(this._currentMode === this._mode) return;
		
		var className;
		var mode = this._mode;
		var extension = null;
		
		switch(this._mode) {
			case scm_MyCurrentTicket.AGENT 	: 
				className = 'SCM_currTicket_mode_Agent';
				this.refreshNotifications(this._firstDisplayOfNotifs);
				break;
			case scm_MyCurrentTicket.TL		: 
				className = 'SCM_currTicket_mode_Tl';
				this.refreshNotifications(this._firstDisplayOfNotifs);
				break;
			case scm_MyCurrentTicket.OPM	: 
				className = 'SCM_currTicket_mode_Opm';
				this.hideDiv('Notification');
				break;
			case scm_MyCurrentTicket.OFF	: 
				className = 'SCM_currTicket_mode_Off';
				this.hideDiv('Notification');
				//Add a reconnection to HRW button
				extension = new Element('div');
				extension.insert('<div class="application_clear_line "> </div>');
				extension.insert(new megaButtonDisplayer({elements: $A([{
						label 			: global.getLabel('HRW_connect')				,
						handler 		: function() {hrwEngine.login(this);}.bind(this),
						type 			: 'button'										,
						idButton 		: 'SCM_Reconnect'								,
						standardButton 	: true
					}])}).getButtons());
				break;
		}

		var title 	= global.getLabel('Mode') + ': <span class="' + className + '">' + global.getLabel(this._mode) + '</span>';
		var inNotif = this.virtualHtml.down('span#SCM_currTicket_notif_mode');
		if(!Object.isEmpty(inNotif)) inNotif.innerHTML = global.getLabel(this._mode);
			
		//Update the mode currently on the screen
		this._currentMode = this._mode;	
	},
	
	/**
	 * @event
     * @description Indicate when a team is selected to update the mode.
	 * @since 1.0
     * @see scm_MyCurrentTicket#_mode
     */
	teamSelected: function() {
		this._teamSelected 	= true;
		if(this._mode !== scm_MyCurrentTicket.TL)
			this._mode	= scm_MyCurrentTicket.TL;	
	},
    
    /**
     * @description Get the ticket that match the currenly selected ticket 
     * @returns {SCM_Ticket_MyCurrent} The selected ticket
	 * @since 1.0
     */
    getSelectedTicket: function() {
        return this._tickets.get(this.currentTicket);
    },
    
    /**
     * @description Check if there are tickets in the class.
     * @returns {Boolean} Are there tickets in the class?
	 * @since 1.0
     */
    hasTickets: function() {
        return (!Object.isEmpty(this._tickets) && this._tickets.size() > 0);
    },
    
    /**
     * @description Build the HTML code to get the list of employees 
     * @returns {Element} HTML div with the list of tickets in processing
	 * @since 1.0
     * @see SCM_SaverToTicket#DIV_TICKETS_LIST
     */
    buildTicketList: function() {
        var ticketLine;
        var input;
        var lineTemplate = new Template('<li>'
                                    +       '<input #{checked} type="radio" name="SCM_ticketsList" value="#{ticketId}"/>'
                                    +       '<span class="application_action_link">#{ticketId}</span>'
                                    +       '<span>&nbsp;&nbsp;</span>'
                                    +       '<span class="#{slaStyle}" title="#{servName}">#{servNameCont}</span>'
                                    +   '</li>');
        var list = new Element('ul', {'id': SCM_SaverToTicket.DIV_TICKETS_LIST, 'class': 'SCM_list_no_bullet'});
        
        if(this.hasTickets() === false)  
            return new Element('div', {'class': 'application_main_soft_text SCM_solveNoDisplayProb'}).update(global.getLabel('no_ticket_in_processing'));
            
        //Create the tickets objects for each ticket
		this._tickets.each( function(ticket, count) {	
		    // If there is no current ticket, set the first founded
		    if(Object.isEmpty(this.currentTicket)) this.currentTicket = ticket[0];
		    
		    var servName = ticket.value.getValue('SERV_NAME');	

			//Add the HTML line
			ticketLine = list.insert(lineTemplate.evaluate({
	            ticketId    : ticket.key			, 
	            servName    : servName			  	,
	            servNameCont: servName.truncate(20)	,
				slaStyle	: ticket.value.getOutOfSLAStyle().classStyle,
				checked		: (ticket.key === this.currentTicket)?'checked="checked"':''
	        }));
            input = ticketLine.childElements()[count].down();
            
            //Add the event handlers on the tickets
            input.observe('change', function (event) {           
                this.updateActiveEmployee(event.element().value);
            }.bindAsEventListener(this));
            
            ticketLine.childElements()[count].down(1).observe('click', function(event) {
                var ticketId = event.element().innerHTML;
				global.open($H({
					app: {
						appId: 'TIK_PL',
						tabId: 'PL_TIK',
						view : 'scm_ticketApp'
					},
					forCreation	: false,
					forEdition	: true,
					ticketId	: ticketId
				}));
            }.bindAsEventListener(this));

		}.bind(this));
		
		return list;
    },
    
    /**
     * @param {String} ticketId Id of the selected ticket
     * @description Get the content to display in the active employee field
	 * @since 1.0
	 * <br/>Modified in 3.1
	 * <ul>
	 * <li>If there is no requestor, does not display the line</li>
	 * </ul>
     */
    updateActiveEmployee: function(ticketId) {
        this.currentTicket = ticketId;

        var ticket		= this._tickets.get(ticketId);
        var employeeId	= ticket.getValue('EMPLOYEE_ID');
        var employeeName= ticket.getValue('EMPLOYEE');
		var companyId	= ticket.getValue('COMPANY_ID');
        
        var title = new Element('span').update(
                        '<span class="SCM_myCurrTicket_allowDiv">'+global.getLabel('active_employee') + ':&nbsp;</span>'
                    +   '<span id="SCM_myCurrTicket_activeEmp" employeeId="'+employeeId+'">'+employeeName+'</span>');
               
        //Draw the divs for the active employee and the requestor
        this.updateDiv('ActEmpl', title, null);
        
        //Add the user action if there is an id for the employee
        if(!Object.isEmpty(employeeId)) {
            var userAction = ScmUserAction.factory(ScmUserAction.DISPLAY_AS_MENU, this, 'SCM_myCurrTicket_activeEmp', $A(), this.virtualHtml, '*');
            userAction.addActionOnField(employeeId, employeeName, companyId, 2, true, false);
        } 
        
		//Update the requestor
		//since 3.1 If the requestor is empty, hide also the field
        if(employeeId === ticket.getValue('REQUESTOR_ID') || Object.isEmpty(ticket.getValue('REQUESTOR_ID')) || ticket.getValue('REQUESTOR_ID') === '')
            this.hideDiv('Requestor');
        else
            this.updateDiv('Requestor', global.getLabel('requestor') + ':&nbsp;' + ticket.getValue('REQUESTOR'), null);
			
		//Select the log of actions
		var logActionDiv = this.virtualHtml.down('[id="' + SCM_SaverToTicket.DIV_LOG_ACTION + '"]');
		if(!Object.isEmpty(logActionDiv)) logActionDiv.down('input').checked = true;
    },
    
    /**
	 * @description Build the form to find an employee.
	 * @see ScmEmployeeSearch
	 * @since 1.0
	 * <br/>Modified in 3.0
	 * <ul>
	 * <li>Change the signature of the {@link ScmEmployeeSearch} factory</li>
	 * <li>Disable the create ticket button by default</li>
	 * </ul>
	 */
    updateFindEmployee: function() {
        var title = global.getLabel('find_employee');
        var extension;
		
        this._createTicketButton = {'id': 'SCM_myCurrentTicket_createTicket'};
        
        //Add the create ticket button
        this._createTicketButton.button = new megaButtonDisplayer({
            elements : $A( [ 
                {
	                label 			: global.getLabel('create_ticket'),
	                handlerContext 	: null							  ,
	                handler 		: function() {						
						global.open($H({
							app: {
								appId:'TIK_PL', 
								tabId:'PL_TIK', 
								view:'scm_ticketApp'
							},
							selectedPart	: HrwEngine.scm_ticketApp_PROPERTIES,
							empSearchVal	: this.employeeSearch.getValues(),
							forCreation		: true								
						}));
	                }.bind(this)	                                                ,
	                className 		: 'SCM_PoolTable_footerButton'	                ,
	                type 			: 'button'						                ,
	                idButton 		: this._createTicketButton.id             	    ,
	                standardButton 	: true
                }])
        });
        
		//If HRW is not connected, wait for its connection to know if customer or company based
		if(hrwEngine.isConnected()) {
			//Create the form
			//since 3.0 Add the new parameter to the employee search
			this.employeeSearch = ScmEmployeeSearch.factory(this, 'myCurTickets', false, null, this.virtualHTML);
			extension = this.employeeSearch.getForm(true);
			//Add the form in the menu
			extension.insert(this._createTicketButton.button.getButtons());
			//since 3.0 Do not enable the button by default
			this.disableCreateTicket();
			
    		this.updateDiv('FindEmpl', title, extension);
			//Initialize the form
			this.employeeSearch.setFormInitial(extension, false, hrwEngine.custCompMandatory);
		} else {
			new PeriodicalExecuter(function(pe) {
  				if (!hrwEngine.isConnected()) return;
    			pe.stop();
				//Create the form
				//since 3.0 Add the new parameter to the employee search
				this.employeeSearch = ScmEmployeeSearch.factory(this, 'myCurTickets', false, null, this.virtualHTML);
				extension = this.employeeSearch.getForm(true);
				//Add the form in the menu
				extension.insert(this._createTicketButton.button.getButtons());
				//since 3.0 Do not enable the button by default
				this.disableCreateTicket();
				
        		this.updateDiv('FindEmpl', title, extension);
				//Initialize the form
				this.employeeSearch.setFormInitial(extension, false, hrwEngine.custCompMandatory);
			}.bind(this), 1);
		}
		
    },
    
    /**
	 * @description Disable the create ticket button.
	 * @since 1.0
	 */
    disableCreateTicket: function() {
        this._createTicketButton.button.disable(this._createTicketButton.id);
    },
    
    /**
	 * @description Enable the create ticket button.
	 * @since 1.0
	 */    
    enableCreateTicket: function() {
        this._createTicketButton.button.enable(this._createTicketButton.id);
    },
    
    /**
     * @event
     * @param {JSON Object} eventArgs Contains the values of the selected employee and the identifier of the form.
	 * @description Handler for the selection of an employee via the form.
	 * @since 1.0
	 */
    employeeSelected: function(eventArgs) {
        if(getArgs(eventArgs).ident === this.employeeSearch.ident) 
            this.enableCreateTicket();
    },
    
    /**
     * @event
     * @param {Object} eventArgs Contains the values of the identifier of the form
	 * @description Handler for the deselection of an employee via the form.
	 * @since 1.0
	 * <br/>Modified in 3.0
	 * <ul>
	 * <li>The arguments list changed</li>
	 * </ul>
	 */
    noEmployeeSelected: function(eventArgs) {
        if(getArgs(eventArgs).ident === this.employeeSearch.ident) 
            this.disableCreateTicket();
    },
	
	/**
	 * @event
	 * @description Once the HRW connection is lost => update the mode
	 * @since 1.0
	 * @see SCM_SaverToTicket#_mode
	 */
	noMoreConnected: function() {
		this._mode = scm_MyCurrentTicket.OFF;
		this.updateMode();
	},
	
	/**
	 * @event
	 * @param {Event} firstLog It is the first connection?
	 * @description HRW is again connected.
	 * @since 1.0
	 */
	hrwConnected: function(firstLog) {
		if(getArgs(firstLog) === true) return;
		this.refreshPendList();
		this.getDefaultMode();
	}
});

/**
 * Display the popup to accept reject the stop of a transfer. 
 * The building of this popup is in this class to avoid loading another file on start.
 * @param {origin} caller Instance of origine that allow to do ajax calls
 * @param {String} ticketId Id of the ticket under treatement
 * @param {Json} jsonHrwParams Parameters from HRW
 * @since 3.0
 * <br/>Modified in 3.4
 * <ul>
 * <li>1024601 - On leaving the text areas with deny/accept description, enable/disable the action buttons</li>
 * </ul>
 * <br/>Modified in 3.3
 * <ul>
 * <li>1024600 - Update the display to set all the param in a single table and update some labels</li>
 * </ul>
 */
scm_MyCurrentTicket.showAcceptDenyStopTransfer = function(caller, ticketId, jsonHrwParams) {
		var infoPopup;
		var popupContent 	= new Element('div', {'id': 'SCM_StopTransferpopup'});
		
		//since 3.4 - 1024601 - Define the default texes
		var defaultAccept 	= '<' + global.getLabel('AcceptStopTransferReason') + '>';
		var defaultDeny		= '<' + global.getLabel('denyTransfReason') + '>';
		
		//since 3.3 - 1024600 - Update the display to integrate the labels directly in the template and set all the parameters in a list
		var template = new Template(
			'<div id="stopTransferMainDiv">'+
				'<div class="application_main_title2 SCM_popupShowAcceptDenyStopTransferTitle">'+global.getLabel('StopTransferRequested')+'</div>'+
				'<div class="SCM_popupShowAcceptDenyStopTransferSpacerTop">'+
					'<div class="SCM_popupAcceptDenyLabel">' + global.getLabel('ChildTicket') + '</div>'+
					'<div class="SCM_popupAcceptDenyValue">#{ticketIDValue}</div>'+
					'<div class="SCM_popupAcceptDenyLabel">' + global.getLabel('ParentTicket') + '</div>'+
					'<div class="SCM_popupAcceptDenyValue">#{parentTicketID}</div>'+
					'<div class="SCM_popupAcceptDenyLabel">' + global.getLabel('company') + '</div>'+
					'<div class="SCM_popupAcceptDenyValue">#{companyValue}</div>'+
					'<div class="application_clear_line"></div>'+
				'</div>'+
				'<div class="SCM_popupShowAcceptDenyStopTransferSpacerTop">'+
					'<div>' + global.getLabel('StopTransferReason') + '</div>'+
					'<div>'+
						'<textarea id="parentReasonClose" cols=56 rows=5 disabled="disabled">#{closedDescription}</textarea>'+
					'</div>'+
					'<div id="copyValueLink" class="application_action_link SCM_popupShowAcceptDenyStopTransferCopyLink">' + global.getLabel('copyTheStopTransferReason') + '</div>'+
				'</div>'+
				'<div class="SCM_popupShowAcceptDenyStopTransferSpacerTop">'+
					'<div>' + global.getLabel('AcceptStopTransferReason') + '</div>'+
					'<div>'+
						//since 3.4 - 1024601 - Set a default text when not filled
						'<textarea id="childReasonClose" cols=56 rows=5>' + defaultAccept + '</textarea>'+
					'</div>'+
				'</div>'+
				'<div class="SCM_popupShowAcceptDenyStopTransferSpacerTop">'+
					'<div>' + global.getLabel('denyTransfReason') + '</div>'+
					'<div>'+
						//since 3.4 - 1024601 - Set a default text when not filled
						'<textarea id="childDenyReason" cols=56 rows=5>' + defaultDeny + '</textarea>'+
					'</div>'+
				'</div>'+
				'<div id="containerButton" class="SCM_popupShowAcceptDenyStopTransferSpacerTop"></div>'+
			'</div>'
		);

		var childSol = HrwRequest.getJsonValue(jsonHrwParams, 'AcceptDenyStopTransferDisplay.ChildTicketSolution', '', HrwRequest.STRING);
		popupContent.insert(template.evaluate({
			ticketIDValue		: HrwRequest.getJsonValue(jsonHrwParams, 'AcceptDenyStopTransferDisplay.ChildTicketId', null, HrwRequest.STRING),
			parentTicketID		: HrwRequest.getJsonValue(jsonHrwParams, 'AcceptDenyStopTransferDisplay.ParentTicketId', null, HrwRequest.STRING),
			companyValue		: HrwRequest.getJsonValue(jsonHrwParams, 'AcceptDenyStopTransferDisplay.ChildCompanyName', null, HrwRequest.STRING),
			closedDescription	: childSol.gsub('>\n<', '><').stripScripts().stripTags()
		}));
		
		/* Method used to close the popup */
		var closePopup = function() {
			infoPopup.close();
			delete infoPopup;
		};
		/* Method that send a request to accept the stop transfer */
		var acceptStop = function() {
			hrwEngine.callBackend(caller, 'Ticket.AcceptStopTransfer', $H({
				scAgentId	: hrwEngine.scAgentId,
				ticketId	: ticketId,
				solution	: HrwRequest.encode(popupContent.down('textarea[id="childReasonClose"]').value)
	    	}), function(){
				document.fire('EWS:SCM_stopTransferClosed', {accepted: true, ticketId: ticketId, closed: false});
				closePopup();
			});
		};
		/* Method that deny the stop transfer */
		var denyStop = function() {
			hrwEngine.callBackend(caller, 'Ticket.DenyStopTransfer', $H({
				scAgentId	: hrwEngine.scAgentId,
				ticketId	: ticketId,
				comment		: HrwRequest.encode(popupContent.down('textarea[id="childDenyReason"]').value)
	    	}), function(){
				document.fire('EWS:SCM_stopTransferClosed', {accepted: false, ticketId: ticketId, closed: false});
				closePopup();
			});
		};
		/* Method that accept the stop transfer and close the ticket */
		var acceptStopAndClose = function() {
			hrwEngine.callBackend(caller, 'Ticket.AcceptStopTransferAndCloseTicket', $H({
				scAgentId	: hrwEngine.scAgentId,
				ticketId	: ticketId,
				solution	: HrwRequest.encode(popupContent.down('textarea[id="childReasonClose"]').value)
	    	}), function(){
				document.fire('EWS:SCM_stopTransferClosed', {accepted: true, ticketId: ticketId, closed: true});
				closePopup();
			});
		};
		/* Action to associate to the cancel button */
		var cancelAction = function() {
			document.fire('EWS:SCM_stopTransferClosed', {cancelled: true, ticketId: ticketId});
			closePopup();
		};
		var popupButtons = new megaButtonDisplayer({
			elements: $A([{
				idButton		: 'SCM_StopTransferAccept',
	            label			: global.getLabel('Accept'),
	            className		: 'moduleInfoPopUp_stdButton_right',
	            handler			: acceptStop,
	            type			: 'button',
	            standardButton	: true
			},{
				idButton		: 'SCM_StopTransferAcceptAndClose',
	            label			: global.getLabel('AcceptAndClose'),
	            className		: 'moduleInfoPopUp_stdButton_right',
	            handler			: acceptStopAndClose,
	            type			: 'button',
	            standardButton	: true
			},{
				idButton		: 'SCM_StopTransferDeny',
	            label			: global.getLabel('Deny'),
	            className		: 'moduleInfoPopUp_stdButton_right',
	            handler			: denyStop,
	            type			: 'button',
	            standardButton	: true
			},{
				idButton		: 'SCM_StopTransferCancel',
	            label			: global.getLabel('Cancel'),
	            className		: 'moduleInfoPopUp_stdButton_right',
	            handler			: cancelAction,
	            type			: 'button',
	            standardButton	: true
			}]),
			mainClass: 'SCM_ticketPopup_attachItem_buttonContainer'
		});
		
		popupContent.down('div[id="containerButton"]').insert(popupButtons.getButtons());
		
		//Add the events on the Accept Stop Transfer Text
		var textarea = popupContent.down('textarea[id="childReasonClose"]');
		//since 3.4 - 1024601 - On focus, remove the default text
		textarea.observe('focus', function(event) {
			if (event.element().value === defaultAccept) {
				event.element().innerHTML 	= '';
				event.element().value 		= '';
			}
		}.bind(this));
		
		//since 3.4 - 1024601 - On blur, if there is a text, activate the corresponding buttons
		textarea.observe('blur', function(event){
			//If there is no description, set the default text and disable the buttons
			if(event.element().value.blank()){
				event.element().innerHTML 	= defaultAccept;
				event.element().value 		= defaultAccept;
				popupButtons.disable('SCM_StopTransferAcceptAndClose');
				popupButtons.disable('SCM_StopTransferAccept');
			//If there is a description, allow the buttons
			} else {
				popupButtons.enable('SCM_StopTransferAcceptAndClose');
				popupButtons.enable('SCM_StopTransferAccept');
			}
		}.bind(this));
		
		//Add the events on the Deny Stop Transfer Text
		textarea = popupContent.down('textarea[id="childDenyReason"]');
		//since 3.4 - 1024601 - On focus, remove the default text
		textarea.observe('focus', function(event) {
			if(event.element().value === defaultDeny) {
				event.element().innerHTML 	= '';
				event.element().value 		= '';
			}
		}.bind(this));
		//since 3.4 - 1024601 - On blur, if there is a text, activate the corresponding buttons
		textarea.observe('blur', function(event){
			//If there is no description, set the default text and disable the buttons
			if(event.element().value.blank()){
				event.element().innerHTML 	= defaultDeny;
				event.element().value 		= defaultDeny;
				popupButtons.disable('SCM_StopTransferDeny');
			//If there is a description, allow the buttons
			}else{
				popupButtons.enable('SCM_StopTransferDeny');
			}
		}.bind(this));
		
		//Event for the copy solution
		popupContent.down('[id="copyValueLink"]').observe('click',function(event){
			var textValue = popupContent.down('[id="parentReasonClose"]').value.stripScripts().stripTags();
			popupContent.down('textarea[id="childReasonClose"]').value = textValue;
			if(textValue == 0){
				popupButtons.disable('SCM_StopTransferAcceptAndClose');
				popupButtons.disable('SCM_StopTransferAccept');
			}else{
				popupButtons.enable('SCM_StopTransferAcceptAndClose');
				popupButtons.enable('SCM_StopTransferAccept');
			}
		});
		
		popupButtons.disable('SCM_StopTransferAcceptAndClose');
		popupButtons.disable('SCM_StopTransferDeny');
		popupButtons.disable('SCM_StopTransferAccept');
		
		infoPopup = new infoPopUp({
			closeButton 	: $H({'callBack': cancelAction}),
			htmlContent 	: popupContent,
			indicatorIcon 	: 'question',                    
			width			: 550
		});
		infoPopup.create();
	}
/**
 * Constant used to identify that the mode is <b>Agent</b>
 * @type String
 * @since 1.0
 */
scm_MyCurrentTicket.AGENT 	= 'Agent';

/**
 * Constant used to identify that the mode is <b>Team Leader</b>
 * @type String
 * @since 1.0
 */
scm_MyCurrentTicket.TL 		= 'Team_leader';

/**
 * Constant used to identify that the mode is <b>OPM</b>
 * @type String
 * @since 1.0
 */
scm_MyCurrentTicket.OPM		= 'OPM';

/**
 * Constant used to identify that the HRW connection is lost.
 * @type String
 * @since 1.0
 */
scm_MyCurrentTicket.OFF 	= 'HRW_conn_lost';