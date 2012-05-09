/**
 * @class
 * @description This document contains the specifications of the API used to add HR modifications to HRW tickets. 
 * It explains also how to use this class.
 * 
 * To use this:
 * <ol>
 * <li>	Create an instance of the object each time you have an action that 
 * 		imply a modification in HR data;</li>
 * <li>	Once the user do the action, you have several options to determine the action to do:
 *		You can use the method getStatus that indicate a status that reflect the position 
 *		of the flags to log or not, the flag to always prompt a popup or not and if there is 
 *		a selected ticket;
 *		You can build your own mechanisme to determine the actions to do via the methods 
 *		getLogStatus, getAlwaysPromptStatus, getIfSelectedTicket (or any other...);</li>
 * <li>	If the result of this is that:
 *		There is no ticket in processing => You can use the default method getNoTicketErrorMessage 
 *		or do any action you want (except to save the transaction...);
 *		There is to prompt for the ticket selection => there is a default popup that can be called 
 *		via the method getPromptPopup. If you decide to create your own interface, you can change 
 *		the selected ticket via the method setSelectedTicket and perform the saving via the method 
 *		saveSapTransaction;
 *		The ticket can be saved => You can use the method saveSapTransaction to add the new action 
 *		in the currently selected ticket;
 *		For all other result, you need to build a specific reaction.</li>
 * <li>	If you want to be sure that the SAP Transaction is really saved in the ticket, 
 * 		you can observe the event EWS: SCM_SAPTransactionResult that is send once it is sure 
 * 		that there is a result. This result (true/false) is sent with the identifier given 
 * 		during initialization to be sure that the event is for the current saver to ticket.</li>
 * </ol>
 *  * Example:
 * <code><pre>
 * var saverToTicket = new SCM_SaverToTicket('myIdent');
 *		
 * var saveButton = new megaButtonDisplayer({elements: $A([{
 * 		label 			: global.getLabel('Save'),
 * 		handler 		: function() {
 * 			switch(saverToTicket.getStatus()){
 * 				case 'NoTicketInProcessing':
 * 					saverToTicket.getNoTicketErrorMessage();
 * 					break;
 * 				case 'NoSave':
 * 					break;
 * 				case 'Prompt':
 * 					saverToTicket.getPromptPopup('Hi ' + global.name + '!', this);
 * 					break;
 * 				case 'SaveDirectly':
 * 					if(saverToTicket.setSelectedTicket(saverToTicket.getSelectedTicket(true)))
 * 						saverToTicket.saveSapTransaction('Hi ' + global.name + '!', this);
 * 					break;
 * 			}
 * 		}.bind(this),
 * 	type 			: 'button',
 * 	idButton 		: 'SaveAction',
 * 	standardButton 	: true
 * }])});
 * this.virtualHtml.insert(saveButton.getButtons());
 * 		
 * document.observe('EWS:SCM_SAPTransactionResult', function(args) {
 * 		if(getArgs(args).ident !== 'myIdent') return;
 * 		alert('The result is : ' + getArgs(args).result);
 * 		saverToTicket.reset();
 * }.bindAsEventListener(this));
 * </pre></code>
 * 
 * @author jonathanj & nicolasl
 * @version 2.1
 * <br/>Changes from version 2.1:
 * <ul>
 * <li>Use the common way to encode/decode fields for the communication to the backend</li>
 * </ul>
 */

SCM_SaverToTicket = Class.create(/** @lends SCM_SaverToTicket.prototype */{
	/**
	 * @type String
	 * Id of the ticket to use for the log
	 * @since 1.0
	 */
	_ticketId: null,
	
	/**
	 * @type String
	 * Is the action correctly logged
	 * @since 1.0
	 */
	_logged: null,
	
	/**
	 * @type String
	 * Identifier used to recognize the object
	 * @since 1.0
	 */
	ident: null,
	
	/**
	 * @type String
	 * Variables used to identify the action to do
	 * @since 1.0
	 */
	_ACTION_NO_SAVE	: 'NoSave',
	/**
	 * @type String
	 * Variables used to identify the action to do
	 * @since 1.0
	 */
	_ACTION_POPUP	: 'Prompt',
	/**
	 * @type String
	 * Variables used to identify the action to do
	 * @since 1.0
	 */
	_ACTION_LOG		: 'SaveDirectly',
	/**
	 * @type String
	 * Variables used to identify the action to do
	 * @since 1.0
	 */
	_ACTION_ERROR	: 'NoTicketInProcessing',
	
	/**
	 * @param {String} ident Any ID used to identify the request.
	 * Create a new saver of SAP transaction to a ticket. This object should be instancied 
	 * for each action that induce a change in HR data. 
	 * The given identifier is used to distinguish the objects instances.
	 * @since 1.0
	 */
	initialize: function(ident) {
		this.ident 		= ident;
		this._logged 	= false;
	},
	
	/**
	 * Get the status of the flag that indicates if the actions are to log in a ticket.
	 * @returns {Boolean}
	 * @since 1.0
	 */
	getLogStatus: function() {
		var logActionDiv = $(SCM_SaverToTicket.DIV_LOG_ACTION);
		if(Object.isEmpty(logActionDiv)) 
			return false;
		else
			return logActionDiv.down('input[name="SCM_MyCurrTicket_LogActions"]').checked;
	},
	
	/**
	 * Get the status of the flag that indicates if the popup for the selection of a ticket has always to be prompt.
	 * @returns {Boolean}
	 * @since 1.0
	 */
	getAlwaysPromptStatus: function() {
		var promptAlways = $(SCM_SaverToTicket.DIV_PROMPT_ALWAYS);
		if(Object.isEmpty(promptAlways)) 
			return false;
		else
			return promptAlways.down('input[name="SCM_MyCurrTicket_PromptAlways"]').checked;
	},
	
	/**
	 * Get if there is at last one ticket in processing that can contain the user action.
	 * @returns {Boolean}
	 * @since 1.0
	 */
	getIfSelectedTicket: function() {
		var hasTicketsDiv = $(SCM_SaverToTicket.DIV_HAS_TICKETS);
		if(Object.isEmpty(hasTicketsDiv)) return false;
		else return (hasTicketsDiv.value === 'true');
	},
	
	/**
	 * Use the result of the 3 previous methods to get a global status. 
	 * The result is one of the following values:
	 * 	'NoTicketInProcessing' = You should save the modification in a ticket, 
	 * 						but there is no ticket in processing ;
	 *  'NoSave' = There is nothing to do, the user doesn't want to save modifications in a ticket;
	 *  'Prompt' = The user should receive a prompt to select a ticket to contains the SAP Transaction;
	 *  'SaveDirectly' = There is a selected ticket, you can save directly inside.
	 * @returns {String} in ['NoTicketInProcessing', 'NoSave', 'Prompt', 'SaveDirectly']
	 * @since 1.0
	 */
	getStatus: function() {
		ticketId = this.getSelectedTicket(true);
		
		//If the actions are not to log => nothing to do
		if(this.getLogStatus() === false)
			return this._ACTION_NO_SAVE;
			
		// If there are no tickets in processing, it is not possible to log			
		else if(this.getIfSelectedTicket() === false)
			return this._ACTION_ERROR;
		
		//If the popup is always to prompt => prompt it
		else if(this.getAlwaysPromptStatus() === true)
			return this._ACTION_POPUP;
		
		//If there is a selected ticket => log in it
		else if(ticketId !== null)
			return this._ACTION_LOG;
		
		//This should not arrive, if there is a ticket in processing, 
		//there is always something selected	
		else return this._ACTION_ERROR;	
	},
	
	/**
	 * Get the list of tickets that could currently be used to add a SAP Transaction. 
	 * The given result is a Hash identified by ticket id and with in the values, 
	 * the service of the ticket, if it is checked in the menu and the display as it is in the menu.
	 * @returns {Hash}
	 * @since 1.0
	 */
	getOpenTicketsList: function() {
		var lineTemplate = new Template('<span>'
									+		'<span>#{ticketId}</span>'
                            		+   	'<span>&nbsp;&nbsp;</span>'
									+		'<span class="#{slaStyle}" title="#{servName}">#{servNameCont}</span>'
									+	'</span>');
		var listTickets = $H();
		var selectedTicket = this.getSelectedTicket(true);
		
		if($(SCM_SaverToTicket.DIV_TICKETS_LIST)) {
			$(SCM_SaverToTicket.DIV_TICKETS_LIST).select('li').each(function(listItem) {
				spanItem	= listItem.down('span', 2);
				curTicketId	= listItem.down('input').readAttribute('value');
				
				listTickets.set(curTicketId, {
					service		: spanItem.readAttribute('title'),
					description	: lineTemplate.evaluate({
						ticketId	: curTicketId,
			            servName    : spanItem.readAttribute('title'),
			            servNameCont: spanItem.innerHTML,
						slaStyle	: spanItem.readAttribute('class')
			        }),
					checked		: (curTicketId === selectedTicket)
				});
			}.bind(this));
		}
		return listTickets;
	},
	
	/**
	 * @param {Boolean} fromOriginalList Indicate if the ticket id to get is from the original list or the set ticket id.
	 * Get the id of the ticket in processing currently selected. It is possible to get the selected ticket 
	 * in the list from the menu item or selected in the current execution. 
	 * @returns {String} Ticket Id
	 * @since 1.0
	 */
	getSelectedTicket: function(fromOriginalList) {
		var ticketsListDiv	= null;
		var ticketId 		= null;
		
		fromOriginalList = (fromOriginalList === true)
		
		//Get the list with tickets
		if(fromOriginalList)
			ticketsListDiv  = $(SCM_SaverToTicket.DIV_TICKETS_LIST);
		else
			return this._ticketId;

		//If there is no list, nothing to return
		if(Object.isEmpty(ticketsListDiv)) return null;
		
		//Check which ticket is selected
		var listInputs = ticketsListDiv.select('input[type="radio"]');
		if(Object.isEmpty(listInputs)) return null;
		listInputs.each(function(input) {
			if(input.checked) ticketId = input.value;
		}.bind(this));

		return ticketId;
	},
	
	/**
	 * @param {String} description Description to attach to the action
	 * Display the default popup that contains the list of tickets that 
	 * could be used and the text to place in the action description. 
	 * The event EWS:SCM_SAPTransactionTicketSel is fired with the selected ticket Id and 
	 * the ident as aguments.
	 * @since 1.0
	 */
	getPromptPopup: function(description) {
        var lineTemplate = new Template('<li>'
                            +       '<input #{checked} type="radio" name="SCM_addToTransactionTicketsList" value="#{ticketId}"/>'
                            +       '<span>#{ticketId}</span>'
                            +       '<span>&nbsp;&nbsp;</span>'
                            +       '<span class="#{slaStyle}" title="#{servName}">#{servNameCont}</span>'
                            +   '</li>');
		
		var ticketLine;
		var spanItem;
		
		//Function called when the user cancel		
		var functionCancel = function() {
			selTicket.close();
			delete selTicket;
		};
		
		//Function called when the user validate
		var functionOK = function() {
			var ticketId;
			var ticketsListDiv  = popupContent.down('ul#SCM_addToTransactionPopup_ListTickets');
	
			//If there is no list, nothing to return
			if(Object.isEmpty(ticketsListDiv)) ticketId = null;
			//Check which ticket is selected
			else {
				var hasValue = false;
				var listInputs = ticketsListDiv.select('input[type="radio"]');
				listInputs.each(function(input) {
					if(input.checked) {
						hasValue = true;
						document.fire('EWS:SCM_SAPTransactionTicketSel', {
							ident	: this.ident,
							ticketId: input.value
						});
					}
				}.bind(this));
				
				if(hasValue === false)
					document.fire('EWS:SCM_SAPTransactionTicketSel', {
						ident	: this.ident,
						ticketId: null
					});
			}
			
			functionCancel();
		}.bind(this);
		
		//Build the content of the popup
		var popupContent = new Element('div', {'id': 'SCM_addToTransactionPopup'})
		
		//Insert the title question
		popupContent.insert('<div class="SCM_ticketPopup_title">' + global.getLabel('AddTransactionToTicket') + '</div>');
		
		//Insert the list of tickets
		var list = '<ul id="SCM_addToTransactionPopup_ListTickets" class="SCM_list_no_bullet">';
		$(SCM_SaverToTicket.DIV_TICKETS_LIST).select('li').each(function(listItem) {
			spanItem	= listItem.down('span', 2);
			curTicketId	= listItem.down('input').readAttribute('value');
			
			if(Object.isEmpty(ticketId)) ticketId = curTicketId;
			
			list += lineTemplate.evaluate({
	            ticketId    : curTicketId, 
	            servName    : spanItem.readAttribute('title'),
	            servNameCont: spanItem.innerHTML,
				slaStyle	: spanItem.readAttribute('class'),
				checked		: (curTicketId === ticketId)?'checked="checked"': ''
	        });
		}.bind(this));
		list += '</ul>';
		popupContent.insert(list);
		
		//Insert the message to add in the action
		popupContent.insert('<div id="SCM_addToTransactionPopup_Message">' + description + '</div>');
		
		//Add the "OK" and "Cancel" buttons
		popupContent.insert(new megaButtonDisplayer({
			elements: [{
				idButton		: 'SCM_addToTransactionPopup_ok',
	            label			: global.getLabel('AddTransaction'),
	            className		: 'moduleInfoPopUp_stdButton',
	            handler			: functionOK,
	            type			: 'button',
	            standardButton	: true
			}, {
	            idButton		: 'SCM_addToTransactionPopup_cancel',
	            label			: global.getLabel('Cancel'),
	            className		: 'moduleInfoPopUp_stdButton',
	            handler			: functionCancel,
	            type			: 'button',
	            standardButton	: true
	        }],
			mainClass: 'moduleInfoPopUp_stdButton_div_right'
        }).getButtons());
		
		//Create the popup
		var selTicket = new infoPopUp({
			closeButton 	: $H({'callBack': functionCancel}),
			htmlContent 	: popupContent,
			indicatorIcon 	: 'question',                    
			width			: 600
		});
		selTicket.create();
	},
	
	/**
	 * Display the default popup to contain an error message that indicates that there is no ticket in processing 
	 * that could be used to store the SAP Transaction.
	 * @since 1.0
	 */
	getNoTicketErrorMessage: function() {
		var errorMessage = new infoPopUp({
			closeButton 	: $H({'callBack': function() {errorMessage.close();delete errorMessage;}}),
            htmlContent 	: new Element('div').update(global.getLabel('noTicketSelected')),
            indicatorIcon 	: 'exclamation',                    
            width			: 600
		});
		errorMessage.create();
	},
	
	/**
	 * @param {String} ticketId Id of the ticket to set as current.
	 * Update the currently selected ticket by the given ticket id.
	 * @returns {Boolean} Correct ticket id
	 * @since 1.0
	 */
	setSelectedTicket: function(ticketId) {
		if(Object.isEmpty(this.getOpenTicketsList().get(ticketId))) return false;
		
		this._ticketId = ticketId;
		return true;
	},
	
	/**
	 * @param {String} description Description to note in the action
	 * @param {Application} application Current application that is able to call SAP.
	 * Add a new action in the currently selected ticket for the given ticketId with 
	 * as text the given description. If the application does not allow calling SAP, the class return false. 
	 * Otherwise, it returns true. Once there is a result, the event EWS:SCM_SapTransactionSaved is fired 
	 * with the ident and the result as arguments.
	 * @returns {Boolean}
	 * @since 1.0
	 * <br/>Modifications for 2.1:
	 * <ul>
	 * <li>Use the standard encoding before sending to HRW</li>
	 * </ul>
	 */
	saveSapTransaction: function(description, application) {
		if(this._ticketId === null) return;
		
		//Send the XML to HRW
		hrwEngine.callBackend(application, 'Ticket.AddSapTransactionTicketAction', $H({
			scAgentId			: hrwEngine.scAgentId,
			ticketId			: this._ticketId,
			//since 2.1 Use the standard encoding
			description			: HrwRequest.encode(description)
		}), this._addCustomActionHandler.bind(this), true, {
				errorMethod		: function(args) {
					this._logged = false;
					this._fireLoggedEvent();
					this._errorMethod(args)
				}.bind(this),
				infoMethod		: function(args) {
					this._logged = false;
					this._fireLoggedEvent();
					this._infoMethod(args)
				}.bind(this),
				warningMethod	: function(args) {
					this._logged = false;
					this._fireLoggedEvent();
					this._warningMethod(args)
				}.bind(this)
		});
	},
	
	/**
	 * Reset the selected ticketed to be ready for next call.
	 * @since 1.0
	 */
	reset: function() {
		this._ticketId 	= null;
		this._logged	= false;
	},
	
	/**
	 * Fire the event to indicate that the logging result is ready
	 * @since 1.0
	 */
	_fireLoggedEvent: function() {
		document.fire('EWS:SCM_SAPTransactionResult', {
			result: this._logged,
			ident: this.ident
		});
	},
	
	/**
	 * @param {JSON Object} jsonAnswer The json answer of HRW
	 * Event handler once the action is added in the ticket 
	 * @since 1.0
	 */
	_addCustomActionHandler: function(jsonAnswer) {
		this._logged = true;
		this._fireLoggedEvent();
	}
});

/**
 * @type String
 * Id of the HTML div with the log action result
 * @since 1.0 
 */
SCM_SaverToTicket.DIV_LOG_ACTION 			= 'SCM_MyCurrTicket_LogActions';
/**
 * @type String
 * Id of the HTML div with the list of tickets
 * @since 1.0 
 */
SCM_SaverToTicket.DIV_TICKETS_LIST			= 'SCM_MyCurrTicket_ListTickets';
/**
 * @type String
 * Id of the HTML div with the flag to indicate if there are selected tickets
 * @since 1.0 
 */
SCM_SaverToTicket.DIV_HAS_TICKETS			= 'SCM_MyCurrTicket_HasTickets';
/**
 * @type String
 * Id of the HTML div with the flag to indicate if the popup is always to show
 * @since 1.0 
 */
SCM_SaverToTicket.DIV_PROMPT_ALWAYS			= 'SCM_MyCurrTicket_PromptAlways';
