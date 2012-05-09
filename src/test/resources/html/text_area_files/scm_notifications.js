/**
 * @class
 * Manage a list of notifications
 * @author jonathanj & nicolasl
 * @version 4.4
 * <br/>Modified on 4.4
 * <ul>
 * <li>Manage the encoding of labels</li>
 * </ul>
 */
var ScmNotifications = Class.create(/** @lends ScmNotifications.prototype */{
	/**
	 * Constant used to identify a company message 
	 * @type Integer
	 * @since 3.4
	 */
	_COMPANY_MESSAGE: 0,
	/**
	 * Constant used to identify a standard message
	 * @type Integer
	 * @since 3.4
	 */
	_STANDARD: 1,
	/**
	 * List that contains the instances of notifications and identified via the constants.<br/>
	 * By default, there is one entry by constant with value false to indicate that it is not loaded.
	 * If the class instance is needed, an instance is created. Otherwise, the value become true.
	 * @type Hash
	 * @since 3.4
	 */
	_listNotifications: null,
	/**
	 * Indicate the value of the next item to indicate
	 * @type Integer
	 * @since 3.4
	 */
	_nextItem: null,
	
	/**
	 * Initialize the list of messages
	 * @param {Boolean} hasStandardNotif Indicate if the list of notifications is to load
	 * @param {Boolean} hasCompanyMessages Indicate if there are company messages
	 * @since 3.4
	 */
	initialize: function(hasStandardNotif, hasCompanyMessages) {
		this._listNotifications 		= $H();
		ScmNotifications.notifications 	= this;
		
		//Indicate the notifications to display
		this._listNotifications.set(this._COMPANY_MESSAGE	, (hasCompanyMessages)	?($A([new ScmNotificationCompanyMessage()])): true);
		this._listNotifications.set(this._STANDARD			, (hasStandardNotif)	?($A([new ScmNotificationStandard()]))		: true);
		
		//Display the first item
		this._nextItem = this._getNext();
		this._showNext();
	},
	
	/**
	 * Add some notifications in the different objects 
	 * @param {Boolean} hasStandardNotif Indicate if the list of notifications is to load
	 * @param {Boolean} hasCompanyMessages Indicate if there are company messages
	 * @since 3.4
	 */
	addNotifications: function(hasStandardNotif, hasCompanyMessages) {
		if(hasCompanyMessages){
			if(this._listNotifications.get(this._COMPANY_MESSAGE) === true) 
				this._listNotifications.set(this._COMPANY_MESSAGE, $A([new ScmNotificationCompanyMessage()]));
			else 
				this._listNotifications.get(this._COMPANY_MESSAGE).push(new ScmNotificationCompanyMessage());
		}
		if(hasStandardNotif){
			if(this._listNotifications.get(this._STANDARD) === true) 
				this._listNotifications.set(this._STANDARD, $A([new ScmNotificationStandard()]));
			else 
				this._listNotifications.get(this._STANDARD).push(new ScmNotificationStandard());
		}
	},
	
	/**
	 * Indicate the value that should come after the current one
	 * @param {Integer} currentItem The item currently displayed
	 * @returns {Integer} The identifier of the next class or False if the item is not loaded
	 * @since 3.4
	 */
	_getNext: function() {
		var order = $A([this._COMPANY_MESSAGE, this._STANDARD]);
		var nextItem;
		
		var nextItem = order.find(function(item) {
			return (Object.isArray(this._listNotifications.get(item)));
		}.bind(this));
		
		return ((nextItem)? nextItem: null);
	}, 
	
	/**
	 * Show the next set of notifications
	 * @param {Integer} nextItem Identifier of the item to display next
	 * @since 3.4 
	 */
	_showNext: function() {
		//If there is no more items
		if(this._nextItem === null) {
			delete ScmNotifications.notifications;
			ScmNotifications.notifications = null;
			return;
		}
		
		//If there is an instance of this type, start it
		this._listNotifications.get(this._nextItem)[0].buildPopup(function(){
			//Delete the notification
			var notif = this._listNotifications.get(this._nextItem).shift();
			if(this._listNotifications.get(this._nextItem).size() === 0) 
				this._listNotifications.set(this._nextItem, true);
			//Display the next type of notifications
			this._nextItem = this._getNext();
			this._showNext();
		}.bindAsEventListener(this));
	}
	
});

/**
 * Static instance to make sure that there is only one instance of the notifications manager
 * @type ScmNotifications
 * @since 3.4
 */
ScmNotifications.notifications = null;

/**
 * Factory that ensure that there is a unique notifications manager and add new notifications inside
 * @param {Boolean} hasStandardNotif Indicate if the list of notifications is to load
 * @param {Boolean} hasScheduleElapsed Indicate if there are some schedule elapsed tickets
 * @param {Boolean} hasCompanyMessages Indicate if there are company messages
 * @since 3.4
 */
document.observe('EWS:SCM_GetNewNotifications', function(event) {
	var hasStandardNotif 	= (getArgs(event).hasStandardNotif	|| false);
	var hasCompanyMessages 	= (getArgs(event).hasCompanyMessages|| false);
	
	if(ScmNotifications.notifications === null) 
		new ScmNotifications(hasStandardNotif, hasCompanyMessages);
	else 
		ScmNotifications.notifications.addNotifications(hasStandardNotif, hasCompanyMessages);
});

/**
 * @class
 * Manage the display of notifications from HRW
 * @author jonathanj & nicolasl
 * @version 3.4
 */
var ScmNotification = Class.create(origin,/** @lends ScmNotification.prototype */{
	/**
	 * Name of the service used to call the list of entries in the backend
	 * @type String
	 * @since 3.4
	 */
	serviceName: null,
	
	/**
	 * Indicate the time that the popup stays on the screen in milliseconds
	 * @type Integer
	 * @since 3.4
	 */
	displayTime: null,
	
	/**
	 * Indicate if the list of notifications is loaded. It is used to indicate when it is possible to display the popup
	 * @type Boolean
	 * @since 3.4
	 */
	_loaded: null,
	
	/**
	 * Initialize the object by getting the list of entries from the backend
	 * @since 3.4
	 */
	initialize: function($super) {
		$super();
		
		this._loaded 	= false;
		
		//If there is no service name, it is because we try to create an instance of an abstract class
		if(this.serviceName === null){
			alert('Class "ScmNotification" is abstract');
			return;
		}
		this.addNotifications(true);
	},
	
	/**
	 * Method that get the list of notifications from the backend and with a treatment that depends on the notification type
	 * @param {Boolean} firstCall Is it to create or to increment the list of notifications
	 * @param {Json} listNotifs The list of notifications
	 * @since 3.4 
	 */
	_getNotificationsHandler: function(firstCall, listNotifs) {alert('Method "ScmNotification->_getNotificationsHandler" is abstract');},
	
	/**
	 * Method that add the notifications of the backend to the current class
	 * @param {Boolean} firstCall Indicate if it is the initial call or a following one (false by default)
	 * @since 3.4
	 */
	addNotifications: function(firstCall){	
		this._loaded = false;
		if(firstCall !== true) firstCall = false;
		
		//Call HRW to get the list of notifications
		hrwEngine.callBackend(this, this.serviceName, $H({
			scAgentId: hrwEngine.scAgentId
		}), this._getNotificationsHandler.bind(this, firstCall));
	},
	
	/**
	 * Build the element to display the notification and manage the observer to indicate that the display is finish. 
	 * The way to display depends on the kind of notification
	 * @param {Function} returnMeth The function to call when the display of the popup is finished
	 * @since 3.4
	 */
	buildPopup: function(returnMeth) {
		document.observe('EWS:SCM_notificationTreated', function(event) {
			document.stopObserving('EWS:SCM_notificationTreated');
			this.clearInstance();
			var returnMeth = $A(arguments)[1];
			returnMeth();
		}.bindAsEventListener(this, returnMeth));
	},
	
	/**
	 * Update the content of the div foreseen to display a message
	 * @param {String} content The content to display
	 * @since 3.4
	 */
	displayPopup: function(content, title) {
		var notificationsMainDiv = document.body.down('div[id="scm_notifications"]');
		
		notificationsMainDiv.update(content);
		notificationsMainDiv.writeAttribute('title', title);
		this.afterDisplay(notificationsMainDiv.down());
		
		setTimeout(function() {
			notificationsMainDiv.update();
			notificationsMainDiv.writeAttribute('title', '');
			this.afterHide(notificationsMainDiv.down());
		}.bind(this), this.displayTime);
	},
	
	/**
	 * Method called once the notification is displayed in the screen
	 * @param {Element} content Content of the popup
	 * @since 3.4
	 */
	afterDisplay: function(content) {},
	
	/**
	 * Method called after the closing of a popup
	 * @param {Element} content Content of the popup
	 * @since 3.4
	 */
	afterHide: function(content) {},
	
	/**
	 * Clear the parameters of the class
	 * @since 3.4
	 */
	clearInstance: function() {}
});
/**
 * @class
 * Manage the display of standard notifications from HRW
 * @author jonathanj & nicolasl
 * @augments ScmNotification
 * @version 3.4
 */
var ScmNotificationStandard = Class.create(ScmNotification,/** @lends ScmNotificationStandard.prototype */{
	
	/**
	 * Message to indicate in the popup to display
	 * @type string
	 * @since 3.4
	 */
	_message: null,
	
	/**
	 * Keep the list of ticketIds to avoid duplicate items
	 * @type array
	 * @since 3.4
	 */
	_ticketIds: null,
	
	/**
	 * Initialize the object by setting the backend service to call and getting the list of entries from the backend
	 * @since 3.4
	 */
	initialize: function($super) {
		//Initialize parent parameters
		this.serviceName 	= 'TicketPool.GetNewHrwNotifications';
		this.displayTime	= 10000;
		
		//Initialize class parameters
		this._message		= '';
		this._ticketIds		= $A();
		
		$super();
	},
	
	/**
	 * Method that get the list of notifications from the backend and build the message to display in the popup that will appear.
	 * If there is only on notification, display its content. Otherwise, display a message to indicate the number of notifications.
	 * @param {Boolean} firstCall Is it to create or to increment the list of notifications
	 * @param {Json} listNotifs The list of notifications
	 * @since 3.4 
	 */
	_getNotificationsHandler: function(firstCall, listNotifs) {	
		var notifications = HrwRequest.getJsonArrayValue(listNotifs, 'ArrayOfHrwNotification.HrwNotification').uniq();
		
		//If there are no notifications, nothing to do...
		if(notifications.size() === 0) return;
		
		//If there are some notifications, reload the list of notifications in the left menu
		document.fire('EWS:scm_new_notification');
		this._buildMessage(notifications);
		
		//Indicate that the messages are ready
		this._loaded = true;
	},
	
	/**
	 * Method used to build the text to display in the popup
	 * @param {Array} notifications List of notifications
	 * @since 3.4
	 * <br/>Modified in 4.4
	 * <ul>
	 * <li>Manage the encoding of labels</li>
	 * </ul>
	 */
	_buildMessage: function(notifications) {	
		//Merge the list of notifications with the new one
		notifications.each(function(notif){
			this._ticketIds.push(notif.TicketId);
		}, this);
		this._ticketIds = this._ticketIds.compact().uniq();
		
		var numNotifs = this._ticketIds.size();
		
		//If there is only one notification, display its text in a popup
		if(numNotifs === 1)
			this._message = 
				'<div class="'+ScmNotifications.getIcon(notifications[0].NotificationReason, notifications[0].TicketType)+' scm_notificationIcon"></div>' 
				+ notifications[0].ToolTipMessage.sub(notifications[0].TicketId, '<div id="SCM_notification_link" class="application_action_link" notifreason="'+notifications[0].NotificationReason+'" notifid="'+notifications[0].NotificationId+'">' + notifications[0].TicketId+'</div>');
		//If there are several notifications, display a group message
		else 
			//since 4.4 - Manage the encoding of labels
			this._message = SCM_getLabel('ThereAre&1NewNotifs', $A([numNotifs])).text;	
	},
	
	/**
	 * Build a window on the bottom-right corner to display the message with notifications
	 * @param {Function} returnMeth The function to call when the display of the popup is finished
	 * @since 3.4
	 */
	buildPopup: function($super, returnMeth) {
		//If the content is not loaded, wait for it
		if(!this._loaded) {
			new PeriodicalExecuter(function(pe) {
  				if(!this._loaded) return;
				pe.stop();
				this.buildPopup(returnMeth);
			}.bind(this), 1);
			return;
		}
		
		//If there is no message, nothing to do
		if(this._message === '') {
			returnMeth();
			return;
		}
		
		$super(returnMeth);
		
		var html = 		
			'<div class="scm_notificationWidth">'
		+		'<div class="unmWidgets_titleDiv">'
		+			'<div class="unmWidgets_header_text">'+global.getLabel('notification')+'</div>'
		+		'</div>'
		+		'<div id="SCM_NotificationMessageContent" class="unmWidgets_contentDiv scm_notificationContainer">' + this._message + '</div>'
		+	'</div>';
		
		this.displayPopup(html, '');
	},
	
	/**
	 * Method in charge to add the events on the popup if needed
	 * @param {Element} content Content of the popup
	 * @since 3.4
	 */
	afterDisplay: function(content) {
		//If there is no link in the message, no need to add events
		var link = content.down('div[id="SCM_notification_link"]');
		if(Object.isEmpty(link)) return;
		
		var contentElement = content.down('div[id="SCM_NotificationMessageContent"]');
		
		//If there is a link, manage the click on the all box
		contentElement.observe('click', function(event){
			//Get the link element from the DOM
			var element;
			if(event.element().identify() === 'SCM_notification_link') 
				element = event.element();
		 	else 
				element = event.element().down('div[id="SCM_notification_link"]');
				
			//Get the ticket Id and the notification reason	
			var ticketId 	= element.innerHTML;;
			var notifReason	= element.readAttribute('notifreason');
			var notifId		= element.readAttribute('notifid');
			
			//Check if the ticket is in processing from the list in the left menu
			var inProcessing = false;
			if($(SCM_SaverToTicket.DIV_TICKETS_LIST)) {
				$(SCM_SaverToTicket.DIV_TICKETS_LIST).select('li').each(function(listItem){
					if(ticketId === listItem.down('input').readAttribute('value')) inProcessing = true;
				});
			}
			
			switch(notifReason) {
				//If it is for a schedule elapsed
				case '100':
					//If the ticket is in processing, just open it
					if(inProcessing) {
						global.open($H({
							app			: {appId:'TIK_PL', tabId:'PL_TIK', view:'scm_ticketApp'},
							selectedPart: HrwEngine.scm_ticketApp_PROPERTIES,
							forCreation	: false,
							forEdition	: true,
							ticketId	: ticketId
						}));
						//Remove the notification in My Current Ticket
						document.fire('EWS:scm_deleteNotification', notifId);
						
					//If the ticket is not in processing, take it
					} else
						this._takeInProcessing(ticketId, function(success, ticketId){
							if(!success) return;
							global.open($H({
								app			: {appId:'TIK_PL', tabId:'PL_TIK', view:'scm_ticketApp'},
								selectedPart: HrwEngine.scm_ticketApp_PROPERTIES,
								forCreation	: false,
								forEdition	: true,
								ticketId	: ticketId
							}));
							
							//Remove the notification in My Current Ticket
							document.fire('EWS:scm_deleteNotification', notifId);
						});
					break;
					
				//If it is for a stop transfer request
				case '5':
					//When the stop transfer popup is closed, refresh the list of notifications
					document.observe('EWS:SCM_stopTransferClosed', function(event) {
						document.stopObserving('EWS:SCM_stopTransferClosed');
						//If the user cancelled, nothing to do
						if(getArgs(event).cancelled) return;
						
						var ticketId = $A(arguments)[1];
						var notifId	 = $A(arguments)[2];
						
						//Open the ticket
						global.open($H({
							app			: {appId:'TIK_PL', tabId:'PL_TIK', view:'scm_ticketApp'},
							selectedPart: HrwEngine.scm_ticketApp_PROPERTIES,
							forCreation	: false,
							forEdition	: true,
							ticketId	: ticketId
						}));
						
						//Remove the notification in My Current Ticket
						document.fire('EWS:scm_deleteNotification', notifId);
					}.bindAsEventListener(this, ticketId, notifId));
					
					hrwEngine.callBackend(this, 'Ticket.GetAcceptDenyStopTransferDisplay', $H({
						scAgentId	: hrwEngine.scAgentId,
						ticketId	: ticketId
					}), scm_MyCurrentTicket.showAcceptDenyStopTransfer.bind(this, this, ticketId));
					break;
					
				//For all other notifications
				default:
					//Open the ticket in view or edit mode
					global.open($H({
						app			: {appId:'TIK_PL', tabId:'PL_TIK', view:'scm_ticketApp'},
						selectedPart: HrwEngine.scm_ticketApp_PROPERTIES,
						forCreation	: false,
						forEdition	: inProcessing,
						ticketId	: ticketId
					}));
			}
		}.bindAsEventListener(this));
	},
	
	/**
	 * Method used to take a ticket in processing.
	 * @param {String} ticketId Identifier of the ticket to take in processing
	 * @param {Function} callBackMethod Method to call when the ticket is in processing (or not)
	 * @since 3.4
	 */
	_takeInProcessing: function(ticketId, callBackMethod) {
		hrwEngine.callBackend(this, 'Ticket.StartProcessingTicket' , $H({
			scAgentId: hrwEngine.scAgentId,
			ticketId : ticketId
			//Function to manage the take in processing answer
		}), function(jsonAnswer, ticketId){
			switch(HrwRequest.getJsonValue(jsonAnswer, '', HrwEngine.NO_VALUE, HrwRequest.STRING)) {
				//The ticket is not in processing
				case HrwEngine.NO_VALUE:case '1':case '4':case '5':case '6':case '7':case '8':case '9':
					new ticketActionPopupScreens().displayMessagePopup(actionResult.EWS.webmessage_text, 'exclamation');
					callBackMethod(false, ticketId);
					break;
				//There is a stop transfer request associated to the ticket	
				case '100':
					//Reload the list of tickets in processing
					document.fire("EWS:scm_refreshPendList");
					
					//When the stop transfer popup is closed, refresh the list of notifications
					document.observe('EWS:SCM_stopTransferClosed', function(event) {
						document.stopObserving('EWS:SCM_stopTransferClosed');
						var ticketId = $A(arguments)[1];
						callBackMethod(true, ticketId);
					}.bindAsEventListener(this, ticketId));
					
					hrwEngine.callBackend(this, 'Ticket.GetAcceptDenyStopTransferDisplay', $H({
						scAgentId	: hrwEngine.scAgentId,
						ticketId	: ticketId
					}), scm_MyCurrentTicket.showAcceptDenyStopTransfer.bind(this, this, ticketId));
					break;
				//The ticket is now in processing
				default:
					//Reload the list of tickets in processing
					document.fire("EWS:scm_refreshPendList");
					
					callBackMethod(true, ticketId);
					break;
			}
		}.bindAsEventListener(this, ticketId));
	},
	
	/**
	 * Method called after the closing of a popup to indicate that the treatment is finish
	 * @param {Element} content Content of the popup
	 * @since 3.4
	 */
	afterHide: function() {
		document.fire('EWS:SCM_notificationTreated');
	},
	
	/**
	 * Clear the parameters of the class
	 * @since 3.4
	 */
	clearInstance: function() {
		this._message		= '';
		this._ticketIds		= $A();
	}
});

/**
 * @class
 * Manage the display of company messages from HRW
 * @author jonathanj & nicolasl
 * @augments ScmNotification
 * @version 3.4
 */
var ScmNotificationCompanyMessage = Class.create(ScmNotification,/** @lends ScmNotificationCompanyMessage.prototype */{
	/**
	 * Message to display as company communication
	 * @type String
	 * @since 3.4
	 */
	_message: null,
	
	/**
	 * Initialize the object by setting the backend service to call and getting the list of entries from the backend
	 * @since 3.4
	 */
	initialize: function($super) {
		//Initialize parent parameters
		this.serviceName 	= 'TicketPool.GetCompanyMessages';
		this.displayTime	= 0;
		
		//Initialize class parameters
		this._message		= '';
		
		$super();
	},
	
	/**
	 * Method that get the list of notifications from the backend and concatenate the company messages to display
	 * them all together in a popup.
	 * @param {Boolean} firstCall Is it to create or to increment the list of notifications
	 * @param {Json} listNotifs The list of notifications
	 * @since 3.4 
	 */
	_getNotificationsHandler: function(firstCall, listNotifs) {
		var notifications = $A();//HrwRequest.getJsonArrayValue(listNotifs, 'ArrayOfHrwNotification.HrwNotification');
		
		if(notifications.size() === 0) return;
	
		this._buildMessage(notifications);
		
		//Indicate that the messages are ready
		this._loaded	= true;
	},
	
	/**
	 * Build the message with all the company messages in a big list
	 * @param {Object} notifications
	 */
	_buildMessage: function(notifications) {
		this._message = this._message + '<p>' + notifications.join('</p><p>') + '</p>';
	},
	
	/**
	 * Build a window on the bottom-right corner to display the message with notifications
	 * @param {Function} returnMeth The function to call when the display of the popup is finished
	 * @since 3.4
	 */
	buildPopup: function($super, returnMeth) {
		//If the content is not loaded, wait for it
		if(!this._loaded) {
			new PeriodicalExecuter(function(pe) {
  				if(!this._loaded) return;
				pe.stop();
				this.buildPopup(returnMeth);
			}.bind(this), 1);
			return;
		}
		
		$super(returnMeth);
		
		var html = 		
			'<div class="scm_notificationWidth">'
		+		'<div class="unmWidgets_titleDiv">'
		+			'<div class="unmWidgets_header_text">'+global.getLabel('notification')+'</div>'
		+		'</div>'
		+		'<div class="unmWidgets_contentDiv scm_notificationContainer">' + this._message + '</div>'
		+	'</div>';
		
		this.displayPopup(html, '');
	},
	
	/**
	 * Clear the parameters of the class
	 * @since 3.4
	 */
	clearInstance: function() {
		this._message = '';
	}
});

/**
 * The different icon classes for the notification types.<br>
 * Hash containing JSon objects as entries. The form of each JSon entry is<ul>
 * <li>name: the type of notification,</li>
 * <li>icon: the CSS class containing the icon associated to the notification type.</li>
 * </ul>
 * @type Hash
 * @since 1.0
 * <br/>Modified in 3.0
 * <ul>
 * <li>Make this attribute static to be able to access it in the my current ticket widget</li>
 * </ul>
 */
ScmNotifications.ICONS = $H({
	0:		{name:'Assign', 						icon:'SCM_ActionNewUserIcon SCM_ActionsIconSize'},
	10:		{name:'AssignToGroup', 					icon:'SCM_DotBlackIcon SCM_DotIconsSize'},	 	 
	50:		{name:'StopTransferRequested', 			icon:'SCM_ActionTransfer SCM_ActionsIconSize'},	 	 
	60:		{name:'StopTransferAccepted', 			icon:'SCM_ActionTransfer SCM_ActionsIconSize'},
	70:		{name:'StopTransferDenied', 			icon:'SCM_ActionTransfer SCM_ActionsIconSize'},
	80:		{name:'TransferAgent', 					icon:'SCM_ActionTransfer SCM_ActionsIconSize'},
	90:		{name:'TransferPool', 					icon:'SCM_ActionTransfer SCM_ActionsIconSize'},
	100:	{name:'TransferItem', 					icon:'SCM_ActionTransfer SCM_ActionsIconSize'},
	110:	{name:'CloseParent', 					icon:'SCM_ActionTransfer SCM_ActionsIconSize'},
	120:	{name:'ActionNotification', 			icon:'SCM_ActionServicesIcon SCM_ActionsIconSize'},
	130:	{name:'ItemAdded', 						icon:'SCM_ActionNewItemIcon SCM_ActionsIconSize'},
	140:	{name:'TicketIsOutOfSLA',				icon:'SCM_ActionOutOfSLAIcon SCM_ActionsIconSize'},
	150:	{name:'Escalate',						icon:'SCM_DotBlackIcon SCM_DotIconsSize'},
	180:	{name:'TicketForApprovalApproved',	 	icon:'SCM_ActionServicesIcon SCM_ActionsIconSize'},	 	 
	190:	{name:'TicketForApprovalRejected', 		icon:'SCM_ActionServicesIcon SCM_ActionsIconSize'},	 	 
	20:		{name:'Schedule', 						icon:'SCM_DotBlueIcon SCM_DotIconsSize'},
	21:		{name:'Schedule', 						icon:'SCM_DotBlueTicon SCM_DotIconsSize'},
	240:	{name:'RequestCloseTicket', 			icon:'SCM_ActionServicesIcon SCM_ActionsIconSize'},
	30:		{name:'ScheduleTicketToAgentPending',	icon:'SCM_DotMauveIcon SCM_DotIconsSize'},
	31:		{name:'ScheduleTicketToAgentPending',	icon:'SCM_DotMauveTicon SCM_DotIconsSize'},
	40:		{name:'SendToGeneralpool', 				icon:'SCM_DotBlackIcon SCM_DotIconsSize'},
	41:		{name:'SendToGeneralpool', 				icon:'SCM_DotBlackTicon SCM_DotIconsSize'},
	150:	{name:'Escalate', 						icon:'SCM_DotBlackIcon SCM_DotIconsSize'},
	151:	{name:'Escalate', 						icon:'SCM_DotBlackTicon SCM_DotIconsSize'},
	160:	{name:'Close', 							icon:'SCM_DotBrownIcon SCM_DotIconsSize'},
	161:	{name:'Close',							icon:'SCM_DotBrownTicon SCM_DotIconsSize'},
	170:	{name:'SendToPendingGeneralPool', 		icon:'SCM_DotMauveBlackIcon SCM_DotIconsSize'},
	171:	{name:'SendToPendingGeneralPool', 		icon:'SCM_DotMauveBlackTicon SCM_DotIconsSize'},
	1000: 	{name:'ElapsedScheduledTicket',			icon:'SCM_DotBlueIcon SCM_DotIconsSize'},
	1001: 	{name:'ElapsedScheduledTicket',			icon:'SCM_DotBlueTicon SCM_DotIconsSize'} 
});

/**
 * Method that get the notification to display
 * @param {String} notifType The number associated to the notification
 * @param {String} ticketType Is the ticket internal or external
 * @since 3.0
 */
ScmNotifications.getIcon = function(notifType, ticketType) {
	if(!ticketType) ticketType = '0';
	var notifParams = ScmNotifications.ICONS.get(parseInt(notifType + ticketType));
	
	if(notifParams) return notifParams.icon;
	return '';
}