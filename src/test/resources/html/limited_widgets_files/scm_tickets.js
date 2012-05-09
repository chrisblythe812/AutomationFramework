/**
 * @class
 * @description Class that manage data about one Ticket
 * @author jonathanj & nicolasl
 * @version 4.3
 * <br/>Modifications for 5.4:
 * <ul>
 * <li>Escape the ticket description to prevent scripts from executing</li>
 * </ul>
 * <br/>Modifications for 5.3:
 * <ul>
 * <li>[1055826] Remove stripTags and stripScripts methods to display the description correctly</li>
 * </ul>
 * <b>Modified in version 5.2:</b>
 * <ul>
 * <li>[1060106] Return basic array if FDE Properties is empty</li>
 * </ul>
 * <b>Modified in version 5.1:</b>
 * <ul>
 * <li>Empty document structure is attached for quick reference when retrieving all documents</li>
 * </ul>
 * <b>Modified in version 5.0:</b>
 * <ul>
 * <li>Modified method to return all documents if parameter is empty</li>
 * <li>Made separate method to return structure (_getInfoFromDoc)</li>
 * </ul>
 * <br/>Modified in 4.3
 * <ul>
 * <li>Make sure there are no tags in the document name</li>
 * </ul>
 * <br/>Modified in 4.2
 * <ul>
 * <li>Gives a correct ticket id</li>
 * </ul>
 * <br/>Modified in 4.0
 * <ul>
 * <li>Replace the current date/time by its value in the SAP timezone</li>
 * <li>Update the non technical notification for the out of SLA</li>
 * </ul>
 */
var SCM_Ticket = Class.create( /** @lends SCM_Ticket.prototype */{
	/**
	 * @type JSON Object
	 * @description Representation of the main information about a ticket as a Json.
	 * @since 1.0
	 */
	_mainObject : null,

	/**
	 * @type Array
	 * @description Representation of the ticket information about last documents in an array.
	 * @since 1.0
	 */
	_lastDocsObject : null,
    
    /**
	 * @type Array
	 * @description Representation of the ticket information about last action in an array.
	 * @since 1.0
	 */
    _lastActionsObject: null,
	
    /**
	 * @type String
	 * @description Current status for the SLA.
	 * @since 1.0
	 */
    _currentSLAStatus: null,
    
	/**
	 * @param {Object} ticketObject Ticket with a Json format
	 * @description Initialize the ticket content.
	 * @since 1.0
	 */
	initialize : function() {
	    this._currentSLAStatus = null;
	},

	/**
	 * @param {JSON Object} mainObject Main information about the ticket.
	 * @description Set the main ticket informations.
	 * @since 1.0
	 * @see SCM_Ticket#_mainObject
	 */
	addMainInfo : function(mainObject) {
		this._mainObject = mainObject;
	},

	/**
	 * @param {Array} lastDocsObject Information about a ticket
	 * @description Set the ticket information about last documents.
	 * @since 1.0
	 * @see SCM_Ticket#_lastDocsObject
	 */
	addLastDocs : function(lastDocsObject) {
		this._lastDocsObject = lastDocsObject;
	},
	
	/**
	 * @param {Array} lastDocsObject Information about a tickett
	 * @description Set the ticket information about last actions.
	 * @since 1.0
	 * @see SCM_Ticket#_lastActionsObject
	 */
	addLastActions: function(lastActionsObject) {
	    this._lastActionsObject = lastActionsObject;
	},

	/**
	 * @param {String} columnId Identifier of the column to get value
	 * @param {Integer} itemNum Number of the last action or of the last document
	 * @description Method that allow to find the different ticket properties. This method could be extended
	 *              to order the different column to optimize
	 * @returns {String} The value of the field
	 * @since 1.0
	 */
	getValue : function(columnId, itemNum) {
		
		switch (columnId) {
		case 'STATUS':
			return this.getTagContent('Status');
		case 'ICON':
			return this._getStatusIcon();
		case 'STATUS_TXT':
			return this._getStatusText();
		case 'TICKET_ID':
			return this.getTagContent('TicketId');
	    case 'DESCR':
			return this._getDescription();
	    case 'SERV_NAME':
	        return this.getTagContent('ServiceName');
	    case 'LAST_ACTION':
	        return this._getLastAction(itemNum);
	    case 'LAST_DOC':
	        return this._getLastDoc(itemNum);
		case 'CREATE_DATE':
	    	return this._getCreationDate();
		case 'DUE_DATE':
			return this._getDueDate();
	    case 'SERV_GROUP':
	        return this.getTagContent('ServiceGroupName');    
		case 'LAST_ACT':
			return this._getLastActionDateTime();
		case 'EMPLOYEE':
			return this._getEmployeeName();
	    case 'EMPLOYEE_ID':
	        return this.getTagContent('EmployeeId');
	    case 'REQUESTOR':
	        return this._getRequestorName();
	    case 'REQUESTOR_ID':
	        return this.getTagContent('SecEmployeeId');
	    case 'COMPANY':
	        return this.getTagContent('ClientName');
	    case 'PRIORITY':
	        return this.getTagContent('PriorityName');
	    case 'ASSIGNED_TO':
	        return this.getTagContent('CurrentAgentName');
		case 'ASSIGNED_TO_ID':
	        return this.getTagContent('CurrentAgentId');	
		case 'COMPANY_ID':
			return this.getTagContent('CompanySkillId');
		//since 2.0 Addition of the service area
		case 'SERV_AREA':
			return this.getTagContent('ServiceAreaName');
		//since 5.2 [1060106] Add custom method for FDE properties
		case 'HrwFastDataEntryProperties':
			return this._getFdeProperties();
		default:
		    return this.getTagContent(columnId);
		}
	},
	
	/**
	 * @param {String} tagName Name of the tag to give
	 * @description Generic method to give a property without treatement
	 * @returns {String} The value in the given tag
	 * @since 1.0
	 */
	getTagContent: function(tagName) {
	    var tagValue = eval('this._mainObject.' + tagName);
	    if(Object.isEmpty(tagValue)) return '';
	    return tagValue;
	},
	
	/**
	 * Get the FDE properties of a ticket
	 * @returns Array of KeyValue pairs
	 * since 5.2
	 */
	_getFdeProperties: function(){
		var tagValue = this._mainObject.HrwFastDataEntryProperties;
		if(Object.isEmpty(tagValue)) {
			var emptyValue = {KeyValue: [{
				Key: '1',
				Value: null
			}]};
			this._mainObject.HrwFastDataEntryProperties = emptyValue;
			return emptyValue;		
		}
	    return tagValue;
	},

	/**
	 * @description Get the CSS class with icon for the ticket status.
	 * @returns {String} CSS class of the status icon
	 * @since 1.0
	 * <br/> Modification for version 2.0
	 * <ul>
	 * <li>Add the icons for new item icons</li>
	 * </ul>
	 * @see SCM_Ticket#statuses
	 */
	_getStatusIcon : function() {
		if(this._mainObject.Type === '0' && this._mainObject.HasBeenChanged === 'false')
		    return SCM_Ticket.statuses.get(this.getValue('STATUS')).classNameExt;
		//since 2.0 If the ticket has not been changed, the status icon is for new items
		else if(this._mainObject.Type === '0' && this._mainObject.HasBeenChanged === 'true')
			return SCM_Ticket.statuses.get(this.getValue('STATUS')).classNameExtNew;
		else if(this._mainObject.Type === '1' && this._mainObject.HasBeenChanged === 'false')
		    return SCM_Ticket.statuses.get(this.getValue('STATUS')).classNameInt;
		//since 2.0 If the ticket has not been changed, the status icon is for new items
		else if(this._mainObject.Type === '1' && this._mainObject.HasBeenChanged === 'true')
		    return SCM_Ticket.statuses.get(this.getValue('STATUS')).classNameIntNew;
	},

	/**
	 * Get the label for the status.
	 * @returns {String} Status text
	 * @since 1.0
	 */
	_getStatusText : function() {
		return global.getLabel('SCM_status_' + this.getValue('STATUS'));
	},
	
	/**
	 * Get a description of the status with:
	 * <ul>
	 * <li>If the ticket is <i>solved</i>, indicate it</li>
	 * <li>If the ticket is <i>external</i>, indicate it</li>
	 * <li>If the ticket has been <i>changed</i>, indicate it</li>
	 * <li>If the ticket is <i>out of SLA</i> or has an <i>amber alert</i>, indicate it</li>
	 * </ul>
	 * @since 3.0
	 * <br/>Modified for version 5.0
 	 * <ul>
 	 * <li>Added status description for Linked Tickets</li>
 	 * </ul>
	 * 
	 */
	getStatusTextWithLegend : function() {
		var statusText = global.getLabel('SCM_status_' + this.getValue('STATUS'));
		
		//If the ticket is solved, indicate it
		if(this._mainObject.Solved === 'true') statusText += ' - ' + global.getLabel('Solved');
		
		//If the ticket is internal, indicate it
		if(this._mainObject.Type === '1') statusText += ' - ' + global.getLabel('InternalTicket');
		
		//If the ticket has been changed, indicate it
		if(this._mainObject.HasBeenChanged === 'true') statusText += ' - ' + global.getLabel('HasChanged');
		
		//Indicate if the ticket is out of SLA or has an amber alert
		switch(this.getOutOfSLA()) {
			case 1: //Amber alert
			statusText += ' - ' + global.getLabel('AmberAlert');
			break;
			case 2: //Out of SLA
			statusText += ' - ' + global.getLabel('OutOfSLA');
			break;
		}
		
		//If there is a parent ticket
		if(this._mainObject.HasActiveParentTicketRelation === 'true') statusText += ' - ' + global.getLabel('ChildTicket');
		
		//If there is a child ticket
		if(this._mainObject.HasActiveChildTicketRelation === 'true') statusText += ' - ' + global.getLabel('ParentTicket');
		
		//since 5.0 - If there is a linked ticket
		if(this._mainObject.IsLinkedTicket === 'true') statusText += ' - ' + global.getLabel('LinkedTicket');
		
		return statusText;
	},
	
    /**
	 * @description Get the due date date of the ticket in display format.
	 * @returns {String} Ticket due date
	 * @since 1.0
	 */
	_getDueDate : function() {
	    var dueDate = this._mainObject.DueDate;
		if(Object.isEmpty(dueDate)) return '';
        else return SCM_Ticket.convertDateTime(dueDate);
	},
    
    /**
	 * @description Get the creation date of the ticket in display format.
	 * @returns {String} Ticket creation date
	 * @since 1.0
	 */
    _getCreationDate: function() {
	    var creationDate = this._mainObject.CreationDateTime;
	    if(Object.isEmpty(creationDate)) return '';
	    else return SCM_Ticket.convertDateTime(creationDate);
	},
	
	/**
	 * @description Get the last action date of the ticket in display format.
	 * @returns {String} Ticket last action date
	 * @since 1.0
	 */
	_getLastActionDateTime: function() {
		var lastActionDate = this._mainObject.LastActionDateTime;
	    if(Object.isEmpty(lastActionDate)) return '';
	    else return SCM_Ticket.convertDateTime(lastActionDate);
	},
	
	/**
	 * @description Get the ticket description.
	 * @returns {String} Description of the ticket
	 * @since 1.0
	 * <br/>Modifications for 5.3:
	 * <ul>
	 * <li>[1055826] Remove stripTags and stripScripts methods</li>
	 * </ul>
	 * <br/>Modifications for 2.1:
	 * <ul>
	 * <li>Use the standard encoding before sending to HRW</li>
	 * </ul>
	 */
	_getDescription: function() {
		//since 5.3 [1055826] Remove stripTags and stripScripts methods
		//since 2.1 Use the standard encoding
		return HrwRequest.decode(this.getTagContent('Description'));
	},
	/**
	 * @description Get the name of the tickets affected employee.
	 * @returns {String} Tickets affected employee name
	 * @since 1.0
	 */
	_getEmployeeName : function() {
	    if(!Object.isEmpty(this._mainObject.EmployeeLastName) && !Object.isEmpty(this._mainObject.EmployeeFirstName))
	        return this._mainObject.EmployeeLastName + ' ' + this._mainObject.EmployeeFirstName;
	        
	    else if(!Object.isEmpty(this._mainObject.EmployeeFirstName))
	        return this._mainObject.EmployeeFirstName;
	    
	    else if(!Object.isEmpty(this._mainObject.EmployeeLastName))
	        return this._mainObject.EmployeeLastName;
	    
	    else return '';
	},
	
	/**
	 * @description Get the name of the tickets requestor.
	 * @returns {String} Tickets requestor name
	 * @since 1.0
	 */
	_getRequestorName : function() {
	    if(!Object.isEmpty(this._mainObject.SecEmployeeLastName) && !Object.isEmpty(this._mainObject.SecEmployeeFirstName))
	        return this._mainObject.SecEmployeeLastName + ' ' + this._mainObject.SecEmployeeFirstName;
	        
	    else if(!Object.isEmpty(this._mainObject.SecEmployeeFirstName))
	        return this._mainObject.SecEmployeeFirstName;
	    
	    else if(!Object.isEmpty(this._mainObject.SecEmployeeLastName))
	        return this._mainObject.SecEmployeeLastName;
	    
	    else return '';
	},
	
	/**
	 * @description Get the last update date of the ticket.
	 * @returns {String} Last update date
	 * @since 1.0
	 */
	_getLastUpdate : function() {
		var creationDate = this._mainObject.CreationDateTime;
	    if(Object.isEmpty(creationDate)) return;
	    else return SCM_Ticket.convertDateTime(creationDate);
	},
    
    /**
     * @param {Integer} numAction Number of the action to set in the revert order (get the number total - numAction)
	 * @description Get the parameters of one of the last actions to be able to display a text.
	 * @returns {JSON Object} Parameters of the last action:
	 * <ul>
	 * 	<li><b>date</b>(<i>String</i>): Date of the action</li>
	 * 	<li><b>title</b>(<i>String</i>): Name of the last action</li>
	 * 	<li><b>icon</b>(<i>String</i>): Name of the CSS class to display the action icon</li>
	 * 	<li><b>agent</b>(<i>String</i>): Name of the agent that did the change</li>
	 * 	<li><b>descr</b>(<i>String</i>): Description of the action</li>
	 * 	<li><b>style</b>(<i></i>): CSS class to apply on the action if any</li>
	 * </ul>
	 * @since 1.0
	 * @see SCM_Ticket#actionsToDisplay
	 * <br/>Modifications for 5.4:
 	 * <ul>
 	 * <li>Escape the ticket description to prevent scripts from executing</li>
	 * </ul>
	 */
    _getLastAction: function(numAction) {
        if(this._lastActionsObject.size() === 0) return '';
		
		//The technical action were added in the list with an extra flag to indicate if the aciton is technical or not
		var actions = this._lastActionsObject.reject(function(action) {
			var actionParams = SCM_Ticket.actionsToDisplay.get(action.Type);
			if(Object.isEmpty(actionParams)) return true;
			else return actionParams.technical;
		});
        
		var index = actions.size() - 1 - numAction;
		
		//Build the texts to display in the action description and the styles to use
		if(index >= 0) {
			return {
				date	: (Object.isString(actions[index].CompletedTime))?SCM_Ticket.convertDateTime(actions[index].CompletedTime):''	, 
				title	: global.getLabel('SCM_Action_' + actions[index].Type)													,
				icon	: SCM_Ticket.actionsToDisplay.get(actions[index].Type).iconClass										, 
				agent	: (!Object.isEmpty(actions[index].ScAgentName))?actions[index].ScAgentName:''							,
				//since 5.4 Escape the description to prevent script from executing
				descr	: (!Object.isEmpty(actions[index].Description))?escapeHTML(actions[index].Description.stripTags()):''	,
				style	: SCM_Ticket.actionsToDisplay.get(actions[index].Type).textClass										};
		}

        return {date: '', title: '', icon: '', agent: '', descr: '', style: ''};
    },
    
    /**
     * @param {Integer} numDoc Number of the document to set in the revert order (get the number total - numDoc)
	 * @description Get the parameters of one of the last documents.
	 * @version 1.0
	 * <b>Modified in version 5.1:</b>
	 * <ul>
     * <li>Empty document structure is attached for quick reference when retrieving all documents</li>
     * </ul>
	 * <b>Modified in version 5.0:</b>
	 * <ul>
     * <li>Modified method to return all documents if parameter is empty</li>
     * <li>Made separate method to return structure (_getInfoFromDoc)</li>
     * </ul>
	 * <b>Modified in version 4.0:</b>
	 * <ul>
     * <li>Call the this._getParentId function in order to get the parent id value</li>
     * <li>When creating the JSON object to be returned, no need of testing the value as it's done in the _getParentId function</li>
     * <li>add the retrieval of the recipient, sender, subject and cc to the returned JSON Object</li>
     * </ul>
	 */
    _getLastDoc: function(numDoc) {
        var doc = null;

        if (!Object.isUndefined(numDoc)){
			var index   = this._lastDocsObject.size() - 1 - numDoc;
	        if(index >= 0) doc = this._lastDocsObject[index];
			return this._getInfoFromDoc(doc);
		}else{ //since 5.0 Return all documents
			var lastDocs = {list: $A(), emptyDocTemplate: $H()};
			this._lastDocsObject.each(function(doc){
				lastDocs.list.push(this._getInfoFromDoc(doc));
			}, this);
			//since 5.1 Define empty document structure
			lastDocs.emptyDocTemplate = this._getInfoFromDoc(null);
			return lastDocs; 
		}

    },
	/**
	 * Extract document information
	 * @param {Object} doc Document to extract information
	 * @since 5.0
	 * 	* Updated to get the document type in the returned structure
	 * @returns {JSON Object} Document paramters: 
	 * <ul>
	 * 	<li><b>id</b>(<i>String</i>): Id of the item</li>
	 * 	<li><b>name</b>(<i>String</i>): Name of the document</li>
	 * 	<li><b>iconType</b>(<i>String</i>): Name of the CSS class to display the type icon</li>
	 * 	<li><b>mimeType</b>(<i>String</i>): Mime type of the document</li>
	 * 	<li><b>extension</b>(<i>String</i>): Extension of the document</li>
	 * 	<li><b>date</b>(<i>String</i>): Date of the document add</li>
	 * 	<li><b>parent</b>(<i>String</i>): If there is a parent document, its id</li>
	 * </ul>
	 * <br/>Modifications for 5.4:
 	 * <ul>
 	 * <li>Escape the ticket description to prevent scripts from executing</li>
	 * </ul>
	 */
	_getInfoFromDoc: function(doc){
	        var extension  		= this._getLastDocExtension(doc);
	        var docInfo			= this._getLastDocInfo(doc, extension);
			var docType     	= this._getLastDocType(doc, extension);
			var docDate			= (doc === null)? '' : SCM_Ticket.convertDateTime(doc.CreationDateTime);
	//		var docParent		= (doc === null)? '-1' : doc.RelatedTicketItemId;
			var docParent		= (doc === null)? '-1' : this._getParentId(doc.RelatedTicketItemId);
	
			var docRecipient	= (doc)?(doc.MailTo)?doc.MailTo:"": "";
			var docSender 		= (doc)?(doc.MailFrom)?doc.MailFrom:"":"";
			var	docSubject 		= (doc)?(doc.MailSubject)?doc.MailSubject:"":"";
			var docCc			= (doc)?(doc.MailCC)?doc.MailCC:"":"";
			
			var itemId 			= '';
			
			if(doc != null && !Object.isUndefined(doc.Attachment)){
				itemId = doc.Attachment;
			}
	
	        return {
	            id          : this._getLastDocId(doc)					, 
	            name        : this._getLastDocName(doc)					, 
	            iconType    : ((docInfo === null)?'':docInfo.iconClass)	,
				iconTitle	: ((docInfo === null)?'':docInfo.label)		,
				mimeType	: ((docInfo === null)?'':docInfo.mimeType)	,
	            extension   : extension									,
				date		: ((docDate === null)?'':docDate)			,
	//			parent		: ((docParent >= 0)?docParent:'-1')			,
				parent		: docParent									,
				type		: ((docType=== null)?'':docType)			,
				itemId		: itemId									,
				// added
				recipient	: docRecipient								,
				sender		: docSender									,
				//since 5.4 Escape the description to prevent script from executing
				subject		: escapeHTML(docSubject)					,
				cc			: docCc	
	        };				
	},
	/**
	 * Get the parent id based on the related ticket id value of the child element
	 * @param {String} id - The related ticket item id from the child
	 * @since 4.0
	 * <br/>Modified in 4.2
	 * <ul>
	 * <li>Get the ID of the document via the getId method</li>
	 * </ul>
	 */
	_getParentId:function(id){
		if(id < 0)
			return '-1';
		for(var i= 0; i<this._lastDocsObject.size(); i++){
			if(this._lastDocsObject[i].TicketItemId == id){
				//since 4.2 - Get the id of the parent document
				return this._getLastDocId(this._lastDocsObject[i]);
			}
		}
		return id;
	},
    
     /**
      * @param {JSON Object} doc Document informations
	  * @description Get the id of one of the last documents.
	  * @returns {String} Id of the document
	  * <br/>Modified in 4.2
	  * <ul>
	  * <li>In case of non ticket ID, return always the id of the item</li>
	  * </ul>
	  */
    _getLastDocId: function(doc) {
        if(Object.isEmpty(doc)) return '';
		else if(!Object.isEmpty(doc.Attachment.match(/^[0-9a-fA-F]{3}-[0-9]{7}$/))) return doc.Attachment;
		else return doc.TicketItemId;
    },
    
     /**
      * @param {JSON Object} doc Document informations
	  * @description Get the name of one of the last documents.
	  * @returns {String} Name of the document
	  * @since 1.0
	  * <br/>Modified for version 5.0
	  * <ul>
	  * <li>Addition of AttachmentType '11' (Linked Tickets)</li>
	  * </ul>
	  * <br/>Modified in 4.3
	  * <ul>
	  * <li>Encode the &, < and > in the name of documents</li>
	  * </ul>
	  */
    _getLastDocName: function(doc) {
        if(Object.isEmpty(doc)) return '';
		switch(doc.AttachmentType) {
			case '0':
				//since 4.3 - Remove some special chars in document names
				return SCM_Ticket.convertDateTime(doc.CreationDateTime)  + ' - ' + (doc.MailSubject || '').stripTags().gsub(/[<>&]/, '');
			case '10':
				//since 4.3 - Remove some special chars in document names
				return SCM_Ticket.convertDateTime(doc.CreationDateTime)  + ' - ' + doc.AttachmentFilename.stripTags().gsub(/[<>&]/, '');
			case '8':
				return global.getLabel('ParentTicketName').unescapeHTML().sub(/.ticketId./, (doc.Attachment||'')).sub(/.assignedAgent./, (doc.CreatorAgentName||'')).sub(/.creatDateTime./, SCM_Ticket.convertDateTime((doc.CreationDateTime||''))).escapeHTML();
			case '9':
				return global.getLabel('ChildTicketName').unescapeHTML().sub(/.ticketId./, (doc.Attachment||'')).sub(/.assignedAgent./, (doc.CreatorAgentName||'')).sub(/.creatDateTime./, SCM_Ticket.convertDateTime((doc.CreationDateTime||''))).escapeHTML();
			//since 5.0 - 
			case '11':
				//return prepareTextToEdit(global.getLabel('LinkedTicketName')).sub(/.ticketId./, (doc.Attachment||'')).sub(/.assignedAgent./, (doc.CreatorAgentName||'')).sub(/.creatDateTime./, SCM_Ticket.convertDateTime((doc.CreationDateTime||'')));
				return ('Linked ticket: %ticketId% / %assignedAgent% @ %creatDateTime%').sub(/.ticketId./, (doc.Attachment||'')).sub(/.assignedAgent./, (doc.CreatorAgentName||'')).sub(/.creatDateTime./, SCM_Ticket.convertDateTime((doc.CreationDateTime||'')));
			default:
				//since 5.0 - Return empty string if filename is empty (for Link Tickets)
				//since 4.3 - Remove some special chars in document names
				if (doc.AttachmentFilename != null) return doc.AttachmentFilename.stripTags().gsub(/[<>&]/, '');
				else return '';
		}
    },

    /**
     * @param {JSON Object} doc Document informations
     * @param {String} extension Extension of the file
	 * @description Get the document type of one of the last documents.
	 * @returns {String} Doctype of the document
	 * @since 1.0
	 * @see SCM_Ticket#docTypes
	 */
    _getLastDocInfo: function(doc, extension) {
        var docType;
        var ticketType;
		
        //If there is no document => return nothing
        if(Object.isEmpty(doc)) return null;
        
		ticketType = doc.AttachmentType;
		if((ticketType === '8' && doc.TicketStatus === '0') || (ticketType === '9' && doc.TicketStatus === '0'))
			ticketType += '.5';
			
        docType = SCM_Ticket.docTypes.get(ticketType);
       
        //If the document type is unknow => add the default icon
        if(Object.isEmpty(docType))
            return SCM_Ticket.docTypes.get('OTHERS');
        
        if(!Object.isEmpty(docType.extensions)) {
            if(Object.isEmpty(docType.extensions.get(extension)))
                return docType.extensions.get('OTHERS');
            else 
                return docType.extensions.get(extension);
            
        } else return docType;
    },    
	
	_getLastDocType: function(doc, extension) {
        var docType;
        var ticketType;
		
        //If there is no document => return nothing
        if(Object.isEmpty(doc)) return null;
        
		ticketType = doc.AttachmentType;
		if((ticketType === '8' && doc.TicketStatus === '0') || (ticketType === '9' && doc.TicketStatus === '0'))
			ticketType += '.5';
			
        return ticketType;
    },
    
	/**
     * @param {Object} doc Document information
	 * @description Get the extension of one of the last documents.
	 * @returns {String} Document extension
	 * @since 1.0
	 */
    _getLastDocExtension: function(doc) {
        if(Object.isEmpty(doc)) return '';
		//The extension of emails is html
        if(doc.AttachmentType === '0') return 'html';
		
		//If there is no filename, return empty
		if(Object.isEmpty(doc.AttachmentFilename)) return '';
		var lastPoint = doc.AttachmentFilename.lastIndexOf('.');
            
        if(lastPoint < 0) extension = '';
        else extension = doc.AttachmentFilename.substr(lastPoint + 1).toLowerCase();
        
        return extension;
    },
	
	/**
	 * @description Get if the ticket is out of SLA
	 * @returns {Integer} The SLA status can be 
	 * <ul>
	 * <li>0 => no alert</li>
	 * <li>1 => Nearly out of SLA</li>
	 * <li>2 => Out of SLA</li>
	 * </ul>
	 * @see SCM_Ticket#_currentSLAStatus
	 * @since 1.0
	 * <br/>Modified in 4.0:
	 * <ul>
	 * <li>Use the SAP time to get the time for now</li>
	 * </ul>
	 */
	getOutOfSLA : function() {
	    if(this._currentSLAStatus !== null) return this._currentSLAStatus;
	    
		if(this._mainObject.Solved == "true"){
			this._currentSLAStatus = 3;
		    return this._currentSLAStatus;
		}else{
		    var dueDate;
		    if(Object.isString(this._mainObject.DueDate)) {  
		        dueDate = sapToObject(this._mainObject.DueDate.substr(0, 10), this._mainObject.DueDate.substr(11, 8));
		        //since 4.0 - Compute now if the local time is not the same as the SAP time
				if(dueDate.isBefore(HrwRequest.getNow())) {
		            this._currentSLAStatus = 2;
		            return this._currentSLAStatus;
		        }
		    }
		    
		    var amberDate;
		    if(Object.isString(this._mainObject.AmberDate)) {  
		        amberDate = sapToObject(this._mainObject.AmberDate.substr(0, 10), this._mainObject.AmberDate.substr(11, 8));
		        //since 4.0 - Compute now if the local time is not the same as the SAP time
				if(amberDate.isBefore(HrwRequest.getNow())) {
		            this._currentSLAStatus = 1;
		            return this._currentSLAStatus;
		        }
		    }
		    
		    this._currentSLAStatus = 0;
		    return 0;
		}
	},
	
	/**
	 * @description Get the style associate to the current SLA status
	 * @returns {JSON Object} The parameters associated to the SLA status
	 * @since 1.0
	 * @see  SCM_Ticket#SLAStatuses
	 */
	getOutOfSLAStyle: function() {	        
	    return SCM_Ticket.SLAStatuses.get(this.getOutOfSLA());
	}
});
/**
 * @class
 * @description Ticket that are more convenient in {@link scm_MyCurrentTicket}
 * @augments SCM_Ticket
 * @author jonathanj & nicolasl
 * @version 1.0
 */
var SCM_Ticket_MyCurrent = Class.create(SCM_Ticket, /** @lends SCM_Ticket_MyCurrent.prototype */{
    /**
	 * @param {String} columnId Identifier of the column to get value
	 * @param {Integer} itemNum Number of the last action or of the last document
	 * @description Limit the number of possible values to those for MyCurrentTicket.
	 *              TICKET_ID has the last position because it is rarely called in this application.
	 *              If there is a call for a non foreseen column, the parent method is called
	 * @returns {String} The ticket parameter value
	 * @since 1.0
	 * @see SCM_Ticket#getValue
	 */
	getValue : function($super, columnId, itemNum) {
		switch (columnId) {
	    case 'SERV_NAME':
	        return this.getTagContent('ServiceName'); 
		case 'EMPLOYEE':
			return this._getEmployeeName();
	    case 'EMPLOYEE_ID':
	        return this.getTagContent('EmployeeId');
	    case 'REQUESTOR':
	        return this._getRequestorName();
	    case 'REQUESTOR_ID':
	        return this.getTagContent('SecEmployeeId');
	    case 'TICKET_ID':
			return this.getTagContent('TicketId');
		default:
		    return $super(columnId, itemNum);
		}
	}
});
/**
 * @class
 * @description Tickets that are more convenient for the display of documents
 * @author jonathanj & nicolasl
 * @augments SCM_Ticket
 * @version 5.0
 * <br/>Modified in 5.0
 * <ul>
 * <li>If there is no document type, do not try to get the types in the ticket documents</li>
 * </ul>
 */
 var SCM_Ticket_docDisplayer = Class.create(SCM_Ticket, /** @lends SCM_Ticket_docDisplayer.prototype */{
 	
	/**
	 * @type String
	 * Id of the ticket
	 * @since 1.0
	 */
    ticketId: null,
	
	/**
	 * @type JSON Object
	 * @description Ticket information about last action.
	 * @since 1.0
	 */
	_documentTypes: null,
	
	/**
	 * @type String
	 * @description Id of the company of the ticket
	 * @since 1.0
	 */
	companyId: null,
	
	/**
	 * @type String
	 * @description Id of the service of the ticket
	 * @since 1.0
	 */
	serviceId: null,
	
	/**
	 * @type Boolean
	 * @description Are there document types defined for the service?
	 * @since 1.0
	 */
	hasDocTypes: null,
	
	/**
	 * @param {String} columnId Identifier of the column to get value
	 * @param {Integer} itemNum Number of the last action or of the last document
	 * @description Limit the number of possible values to those for MyCurrentTicket.
	 *              TICKET_ID has the last position because it is rarely called in this application.
	 *              If there is a call for a non foreseen column, the parent method is called
	 * @returns {String} The ticket parameter value
	 * @since 1.0
	 * @see SCM_Ticket#getValue
	 */
	getValue : function($super, columnId, itemNum) {
		if (columnId === 'LAST_DOC')
			return this._getLastDoc(itemNum);
		else if(columnId === 'TICKET_ID')
			return this.ticketId;
	    else
		    return $super(columnId, itemNum);
	},
	
	/**
	 * @param {JSON Object} documentTypesObject List of the possible document types
	 * @description Set the ticket information about the existant document types.
	 * @since 1.0
	 * @see SCM_Ticket#hasDocTypes
	 * @see SCM_Ticket#_documentTypes
	 */
	addDocumentTypes: function(documentTypesObject) {
		this._documentTypes = $H();
		
		if(documentTypesObject) {
		 	var documents = HrwRequest.getJsonArrayValue(documentTypesObject, 'ArrayOfKeyValue.KeyValue');
		 	documents.each(function(docType) {
				this._documentTypes.set(docType.Key, docType.Value);
			}.bind(this));
		}
		
		if (this._documentTypes.size() === 0) {
			this._documentTypes.set('-1', '');
			this.hasDocTypes = false;
		} else
			this.hasDocTypes = true;
	},
	
	/**
	 * @description Remove the list of document types.
	 * @since 1.0
	 * @see SCM_Ticket#_documentTypes
	 */
	removeDocumentTypes: function() {
	    this._documentTypes =  null;
	},
	
	/**
	 * @description Check if the list of document types is already loaded.
	 * @returns {Boolean} Document types are loaded
	 * @since 1.0
	 */
	documentsTypesLoaded: function() {
		return (this.companyId !== null && this.serviceId !== null && this._documentTypes !== null);
	},
	
	/**
	 * @description Check if there are document types defined for this company and this service.
	 * @returns {Boolean} There are no document type defined
	 * @since 1.0
	 * <br/>Modified in 5.0
	 * <ul>
	 * <li>Do not get the list of document types from documents</li>
	 * </ul>
	 */
	noDocumentTypes: function() {
	    return (!this.hasDocTypes);
	},
	
	/**
	 * @param {Boolean} withDef Check to make sure there is a default value in the coming list
	 * @description Get the list of documents type with the format as for autocomplete fields.
	 * @returns {Array} List of document types with name and id.
	 * @since 1.0
	 */
	getDocumentsTypes: function(withDef) {
		var docTypes = $A();
		if(!this.documentsTypesLoaded()) return null;
		if(withDef !== true) withDef = false;
		
		this._documentTypes.each(function(docType, index) {
			if(withDef && index === 0)
				docTypes.push({
					data	: docType.key, 
					text	: docType.value,
					def		: 'X'
				});
			else
				docTypes.push({
					data	: docType.key, 
					text	: docType.value
				});
		}.bind(this));
		
		return docTypes;
	},
	
    /**
     * @param {Integer} numDoc Number of the document to set in the revert order (get the number total - numDoc)
	 * @description Get the parameters of one of the last documents with the doctype name and the doctype id.
	 * @returns {JSON Object} Document paramters
	 * @version 1.0
	 * <br/>Modified in 5.0
	 * <ul>
	 * <li>If there is no document type, do not get it</li>
	 * </ul>
	 */
    _getLastDoc: function($super,numDoc) {
		var returnValue = $super(numDoc);
        var doc = null;
		
		var index   = this._lastDocsObject.size() - 1 - numDoc;
        if(index >= 0) doc = this._lastDocsObject[index];
		
		var documentType = (doc === null)?'-1': HrwRequest.getJsonValue(doc, 'DocumentType', HrwEngine.NO_VALUE, HrwRequest.STRING, true);
		
        var extension  	= this._getLastDocExtension(doc);
		//since 5.0 - If there is no document type, don't try to get the type ID of teh document
		var docTypeId	= (this.noDocumentTypes())? '-1' : documentType;
		var docType     = this._getLastDocType(doc, extension);

		returnValue.docTypeId	= docTypeId;
		returnValue.docType		= this._getLastDocDocType(docTypeId, doc);
    	return returnValue;
	},
	
	/**
     * @param {String} docTypeId Id of the document type
     * @param {JSON Object} doc (since 1.1) Document informations
	 * @description Get the name of the document type that match the given id.<br/>
	 * @returns {String} Name of the doc type
	 * @since 1.0
	 */
	_getLastDocDocType: function(docTypeId, doc) {
		//If the document is not a file, there is no document type
		//If the document is an email, it also need a document type
		if(doc === null || (doc.AttachmentType != '1' && doc.AttachmentType != '0')) return '';
		
		var docType = this._documentTypes.get(docTypeId);
		
		if(Object.isUndefined(docType)) return global.getLabel('BadDocType');
		else return docType;
	}
});
/**
 * @type Hash
 * @description List of the columns names and class names.
 * @since 1.0
 * <br/>Modifications for 2.0:
 * <ul>
 * <li>Addition of the icons for new items</li>
 * </ul>
 */
SCM_Ticket.statuses = $H( {
	'0'  : {
		id				: 'Closed'       							, 
		classNameExt	: 'SCM_DotBrownIcon SCM_DotIconsSize'		, 
		classNameInt	: 'SCM_DotBrownTicon SCM_DotIconsSize' 		, 
		classNameExtNew	: 'SCM_DotBrownNicon SCM_DotIconsSize' 		,
		classNameIntNew	: 'SCM_DotBrownNTicon SCM_DotIconsSize'		},
	'1'  : {
		id				: 'Open'         							, 
		classNameExt	: 'SCM_DotIconsSize'						, 
		classNameInt	: 'SCM_DotIconsSize' 						,	 
		classNameExtNew	: 'SCM_DotIconsSize' 						,
		classNameIntNew	: 'SCM_DotIconsSize'						},
	'2'  : {
		id				: 'Proc'         							, 
		classNameExt	: 'SCM_DotOrangeIcon SCM_DotIconsSize'		, 
		classNameInt	: 'SCM_DotOrangeTicon SCM_DotIconsSize' 	,	 
		classNameExtNew	: 'SCM_DotOrangeNicon SCM_DotIconsSize' 	,
		classNameIntNew	: 'SCM_DotOrangeNTicon SCM_DotIconsSize'	},
	'3'  : {
		id				: 'Sched'        							, 
		classNameExt	: 'SCM_DotBlueIcon SCM_DotIconsSize'		, 
		classNameInt	: 'SCM_DotBlueTicon SCM_DotIconsSize' 		,	 
		classNameExtNew	: 'SCM_DotBlueNicon SCM_DotIconsSize' 		,
		classNameIntNew	: 'SCM_DotBlueNTicon SCM_DotIconsSize'		},
	'4'  : {
		id				: 'Wait'         							, 
		classNameExt	: 'SCM_DotGreenIcon SCM_DotIconsSize'		, 
		classNameInt	: 'SCM_DotGreenTicon SCM_DotIconsSize' 		,	 
		classNameExtNew	: 'SCM_DotGreenNicon SCM_DotIconsSize' 		,
		classNameIntNew	: 'SCM_DotGreenNTicon SCM_DotIconsSize'		},
	'5'  : {
		id				: 'Unknown'									, 
		classNameExt	: 'SCM_DotIconsSize'						, 
		classNameInt	: 'SCM_DotIconsSize' 						,	 
		classNameExtNew	: 'SCM_DotIconsSize' 						,
		classNameIntNew	: 'SCM_DotIconsSize'						},
	'6'  : {
		id				: 'Pend'         							, 
		classNameExt	: 'SCM_DotMauveIcon SCM_DotIconsSize'		, 
		classNameInt	: 'SCM_DotMauveTicon SCM_DotIconsSize' 		,	 
		classNameExtNew	: 'SCM_DotMauveNicon SCM_DotIconsSize' 		,
		classNameIntNew	: 'SCM_DotMauveNTicon SCM_DotIconsSize'		},
	'7'  : {
		id				: 'Ext'          							, 
		classNameExt	: 'SCM_DotGrayIcon SCM_DotIconsSize'		, 
		classNameInt	: 'SCM_DotGrayTicon SCM_DotIconsSize' 		,	 
		classNameExtNew	: 'SCM_DotGrayNicon SCM_DotIconsSize' 		,
		classNameIntNew	: 'SCM_DotGrayNTicon SCM_DotIconsSize'		},
	'8'  : {
		id				: 'PendSched'    							, 
		classNameExt	: 'SCM_DotMauveBlueIcon SCM_DotIconsSize'	, 
		classNameInt	: 'SCM_DotMauveBlueTicon SCM_DotIconsSize' 	,	 
		classNameExtNew	: 'SCM_DotMauveBlueNicon SCM_DotIconsSize' 	,
		classNameIntNew	: 'SCM_DotMauveBlueNTicon SCM_DotIconsSize'	},
	'9'  : {
		id				: 'ProcOth'     						 	, 
		classNameExt	: 'SCM_DotRedIcon SCM_DotIconsSize'      	, 
		classNameInt	: 'SCM_DotRedTicon SCM_DotIconsSize' 		,	 
		classNameExtNew	: 'SCM_DotRedNicon SCM_DotIconsSize' 		,
		classNameIntNew	: 'SCM_DotRedNTicon SCM_DotIconsSize'		},
	'10' : {
		id				: 'PendNotAssign'							, 
		classNameExt	: 'SCM_DotMauveBlackIcon SCM_DotIconsSize'	, 
		classNameInt	: 'SCM_DotMauveBlackTicon SCM_DotIconsSize' ,	 
		classNameExtNew	: 'SCM_DotMauveBlackNicon SCM_DotIconsSize' ,
		classNameIntNew	: 'SCM_DotMauveBlackNTicon SCM_DotIconsSize'},
	'11' : {
		id				: 'NotAssign'    							, 
		classNameExt	: 'SCM_DotBlackIcon SCM_DotIconsSize'		, 
		classNameInt	: 'SCM_DotBlackTicon SCM_DotIconsSize' 		,	 
		classNameExtNew	: 'SCM_DotBlackNicon SCM_DotIconsSize' 		,
		classNameIntNew	: 'SCM_DotBlackNTicon SCM_DotIconsSize'		}
});
/**
 * @type Hash
 * @description Name of the documents types with there icons.
 * @since 1.0
 * <br/>Modified for version 5.0
 * <ul>
 * <li>Addition of docType '11' (Linked Tickets)</li>
 * </ul>
 */
SCM_Ticket.docTypes = $H({
    '0'     : {label: 'Email'           	, iconClass: 'SCM_ItemMail SCM_itemSize'		, mimeType: 'text/html' },
    '1'     : {label:  'File'            , extensions: $H({
        'mdb'   : {label: 'MS Access'      	, iconClass: 'SCM_ItemAccess SCM_itemSize'    	, mimeType: 'application/ms-access'				},
        'mdbx'  : {label: 'MS Access'      	, iconClass: 'SCM_ItemAccess SCM_itemSize'    	, mimeType: 'application/vnd.ms-access'			},
        'doc'   : {label: 'MS Word'        	, iconClass: 'SCM_ItemWord SCM_itemSize'      	, mimeType: 'application/msword'					},
        'docx'  : {label: 'MS Word'        	, iconClass: 'SCM_ItemWord SCM_itemSize'      	, mimeType: 'application/vnd.ms-word.document.12'	},
        'ppt'   : {label: 'MS PowerPoint'  	, iconClass: 'SCM_ItemPowerPoint SCM_itemSize'	, mimeType: 'application/ms-powerpoint'			},
        'pptx'  : {label: 'MS PowerPoint'  	, iconClass: 'SCM_ItemPowerPoint SCM_itemSize'	, mimeType: 'application/vnd.ms-powerpoint'		},   
        'xls'   : {label: 'MS Excel'       	, iconClass: 'SCM_ItemExcel SCM_itemSize'     	, mimeType: 'application/ms-excel'				},
        'xlsx'  : {label: 'MS Excel'       	, iconClass: 'SCM_ItemExcel SCM_itemSize'     	, mimeType: 'application/vnd.ms-excel'			},
        'html'  : {label: 'HTML'        	, iconClass: 'SCM_ItemHTML SCM_itemSize'      	, mimeType: 'text/html'							},
        'htm'   : {label: 'HTML'        	, iconClass: 'SCM_ItemHTML SCM_itemSize'      	, mimeType: 'text/html'							},
        'txt'   : {label: 'Txt'        		, iconClass: 'SCM_ItemText SCM_itemSize'      	, mimeType: 'text/plain'							},
        'pdf'   : {label: 'PDF'         	, iconClass: 'SCM_ItemPDF SCM_itemSize'       	, mimeType: 'application/pdf'						},
        'bmp'   : {label: 'Bitmap'     		, iconClass: 'SCM_ItemImage SCM_itemSize'     	, mimeType: 'image/x-ms-bmp'						},
		'png'	: {label: 'Portable Network Graphics'	, iconClass: 'SCM_ItemImage SCM_itemSize'	, mimeType: 'image/png'							},	
        'jpg'   : {label: 'Jpeg'     		, iconClass: 'SCM_ItemImage SCM_itemSize'     	, mimeType: 'image/jpeg'							},
        'gif'   : {label: 'Graphics Interchange Format'	, iconClass: 'SCM_ItemImage SCM_itemSize'	, mimeType: 'image/gif'							},
        'OTHERS': {label: 'File'        	, iconClass: 'SCM_ItemBinary SCM_itemSize'    	, mimeType: 'binary/octet-stream'					}})},
    '2'     : {label: 'note'            	, iconClass: 'SCM_ItemNote SCM_itemSize'		, mimeType: ''     },
    '4'     : {label: 'SAPShortcut'   		, iconClass: 'SCM_ItemSap SCM_itemSize'     	, mimeType: ''     },
    '5'     : {label: 'Executable'      	, iconClass: 'SCM_itemSize'                 	, mimeType: ''     },
	//since 2.0 Indicate that the mime-type for HTTP links is hyperlink
    '6'     : {label: 'Hyperlink'       	, iconClass: 'SCM_ItemHTML SCM_itemSize'    	, mimeType: 'hyperlink'},
    '7'     : {label: 'HyperlinkSIR'    	, iconClass: 'SCM_ItemHTML SCM_itemSize'    	, mimeType: ''     },
    '8'     : {label: 'ParentTicket'   		, iconClass: 'SCM_TicketItem SCM_itemSize'  	, mimeType: ''     },
	'8.5'   : {label: 'ParentTicketClosed'	, iconClass: 'SCM_TicketItemClose SCM_itemSize'	, mimeType: ''     },
    '9'     : {label: 'ChildTicket'    		, iconClass: 'SCM_TicketItem SCM_itemSize'  	, mimeType: ''     },
	'9.5'   : {label: 'ChildTicketClosed'	, iconClass: 'SCM_TicketItemClose SCM_itemSize'	, mimeType: ''     },
    '10'    : {label: 'Shortcut'        , extensions: $H({
        'mdb'   : {label: 'MS Access'      	, iconClass: 'SCM_ItemAccess SCM_itemSize'    	, mimeType: 'application/ms-access'				},
        'mdbx'  : {label: 'MS Access'      	, iconClass: 'SCM_ItemAccess SCM_itemSize'    	, mimeType: 'application/vnd.ms-access'			},
        'doc'   : {label: 'MS Word'        	, iconClass: 'SCM_ItemWord SCM_itemSize'      	, mimeType: 'application/msword'					},
        'docx'  : {label: 'MS Word'        	, iconClass: 'SCM_ItemWord SCM_itemSize'      	, mimeType: 'application/vnd.ms-word.document.12'	},
        'ppt'   : {label: 'MS PowerPoint'  	, iconClass: 'SCM_ItemPowerPoint SCM_itemSize'	, mimeType: 'application/ms-powerpoint'			},
        'pptx'  : {label: 'MS PowerPoint'  	, iconClass: 'SCM_ItemPowerPoint SCM_itemSize'	, mimeType: 'application/vnd.ms-powerpoint'		},   
        'xls'   : {label: 'MS Excel'       	, iconClass: 'SCM_ItemExcel SCM_itemSize'     	, mimeType: 'application/ms-excel'				},
        'xlsx'  : {label: 'MS Excel'       	, iconClass: 'SCM_ItemExcel SCM_itemSize'     	, mimeType: 'application/vnd.ms-excel'			},
        'html'  : {label: 'HTML'        	, iconClass: 'SCM_ItemHTML SCM_itemSize'      	, mimeType: 'text/html'							},
        'htm'   : {label: 'HTML'        	, iconClass: 'SCM_ItemHTML SCM_itemSize'      	, mimeType: 'text/html'							},
        'txt'   : {label: 'Txt'        		, iconClass: 'SCM_ItemText SCM_itemSize'      	, mimeType: 'text/plain'							},
        'pdf'   : {label: 'PDF'         	, iconClass: 'SCM_ItemPDF SCM_itemSize'       	, mimeType: 'application/pdf'						},
        'bmp'   : {label: 'Bitmap'     		, iconClass: 'SCM_ItemImage SCM_itemSize'     	, mimeType: 'image/x-ms-bmp'						},
		'png'	: {label: 'Portable Network Graphics'	, iconClass: 'SCM_ItemImage SCM_itemSize'	, mimeType: 'image/png'							},	
        'jpg'   : {label: 'Jpeg'     		, iconClass: 'SCM_ItemImage SCM_itemSize'     	, mimeType: 'image/jpeg'							},
        'gif'   : {label: 'Graphics Interchange Format'	, iconClass: 'SCM_ItemImage SCM_itemSize'	, mimeType: 'image/gif'							},
        'OTHERS': {label: 'File'        	, iconClass: 'SCM_ItemBinary SCM_itemSize'    	, mimeType: 'binary/octet-stream'					}})},
	//since 5.0 -  Added link ticket doc type
	'11'	: {label: 'LinkedTicket'       	 , iconClass: 'SCM_TicketItem SCM_itemSize'  	, mimeType: ''     },
    'OTHERS': {label: 'UnknownFormat'        , iconClass: 'SCM_ItemBinary SCM_itemSize'  	, mimeType: ''     }
});
/**
 * @type Hash
 * @description Name of the SLA statuses with there styles.
 * @since 1.0<br>
 * Changed in version 2.0:<ul><li>Add of an entry for solved tickets</li></ul>
 */	
SCM_Ticket.SLAStatuses = $H({
    0: {label: 'In time'       , classStyle: ''                            },
    1: {label: 'Near due date' , classStyle: 'SCM_PoolTable_SLAAmberAlert' },
    2: {label: 'After due date', classStyle: 'SCM_PoolTable_OutOfSLA'      },
	3: {label: 'Solved'		   , classStyle: 'SCM_PoolTable_Solved'		   }
});
/**
 * @type Hash
 * @description List of the actions that could be displayed by action type.
 * @since 1.0
 * <br/>Modified for version 5.5
 * <ul>
 * <li>[1069481] Added icon to action type = '12' (custom actions) </li>
 * <li>Added SCM_ActionNoAction (blank) to types whose icons are not yet defined  </li>
 * </ul>
 * <br/>Modified for version 5.0
 * <ul>
 * <li>Modified 'Linked Tickets' ('93') type to technical = false </li>
 * </ul>
 */
SCM_Ticket.actionsToDisplay = $H({
	'0'	: {technical: false, iconClass: 'SCM_ActionsIconSize SCM_ActionServicesIcon', textClass: '' },		//Create ticket
	'1'	: {technical: false, iconClass: 'SCM_ActionsIconSize SCM_DotBrownIcon'	, textClass: ''},	//Closed Ticket
	'2' : {technical: true, iconClass: 'SCM_ActionsIconSize SCM_DotBlueIcon'	, textClass: ''},	//Schedule ticket
	'3' : {technical: true, iconClass: 'SCM_ActionsIconSize SCM_DotBlueIcon'	, textClass: ''},	//Schedule ticket to an agent
	'4'	: {technical: false, iconClass: 'SCM_ActionNewUserIcon SCM_ActionsIconSize', textClass: ''},//Assign Ticket
	'5': {technical: true, iconClass: 'SCM_ActionsIconSize SCM_DotBlackIcon'	, textClass: ''},	//"Send to General Pool"
	'6': {technical: true, iconClass: 'SCM_ActionsIconSize SCM_ActionNewUserIcon'	, textClass: ''},	//"Escalate ticket"
	'7': {technical: true, iconClass: 'SCM_ActionsIconSize SCM_ticketingPauseIcon'	, textClass: ''},	//"Send to my Pool"
	'8': {technical: true, iconClass: 'SCM_ActionsIconSize SCM_DotOrangeIcon'	, textClass: ''},	//"Start processing"
	'9'	: {technical: false, iconClass: 'SCM_ActionNewItemIcon SCM_ActionsIconSize', textClass: ''},	//Add attachement
	'10': {technical: false, iconClass: 'SCM_ItemMail SCM_ActionsIconSize', textClass: ''},			//Add Mail
	'11': {technical: true, iconClass: 'SCM_ActionsIconSize SCM_ActionNewItemIcon'	, textClass: ''},	//"Add note"
	//since 5.3 Added an icon for the custom action
	'12': {technical: false, iconClass: 'SCM_ItemNote SCM_itemSize'	, textClass: ''},	//Custom Action
	'13': {technical: true, iconClass: 'SCM_ActionsIconSize SCM_ActionNoIcon'	, textClass: ''},	//"Predefined action"
	'14': {technical: true, iconClass: 'SCM_ActionsIconSize SCM_ActionNoIcon'	, textClass: ''},	//"Change predefined action state"
	'15': {technical: true, iconClass: 'SCM_ActionsIconSize SCM_ActionNoIcon'	, textClass: ''},	//"Add ticket skill"
	'16': {technical: true, iconClass: 'SCM_ActionsIconSize SCM_ActionNoIcon'	, textClass: ''},	//"Remove ticket skill"
	'17': {technical: true, iconClass: 'SCM_ActionsIconSize SCM_ActionNoIcon'	, textClass: ''},	//"Update ticket information"
	'18': {technical: true, iconClass: 'SCM_ActionsIconSize SCM_ActionNoIcon'	, textClass: ''},	//"Change company"
	'19': {technical: true, iconClass: 'SCM_ActionsIconSize SCM_ActionNoIcon'	, textClass: ''},	//"Change service"
	'20': {technical: true, iconClass: 'SCM_ActionsIconSize SCM_ActionNoIcon'	, textClass: ''},	//"Delete ticket item"
	'21': {technical: true, iconClass: 'SCM_ActionsIconSize SCM_ActionNoIcon'	, textClass: ''},	//"Duplicate Ticket"
	'22': {technical: false, iconClass: 'SCM_ActionsIconSize SCM_ActionServicesIcon', textClass: ''},	//ReOpen Ticket
	'23': {technical: true, iconClass: 'SCM_ActionsIconSize SCM_ActionNoIcon'	, textClass: ''},	//"Send to AMO"
	'24': {technical: true, iconClass: 'SCM_ActionsIconSize SCM_ItemMail'	, textClass: ''},	//"Send mail after creation"
	'25': {technical: true, iconClass: 'SCM_ActionsIconSize SCM_ItemMail'	, textClass: ''},	//"Send mail after closed"
	'26': {technical: true, iconClass: 'SCM_ActionsIconSize SCM_DotMauveIcon'	, textClass: ''},	//"Switch to Pending"
	'27': {technical: true, iconClass: 'SCM_ActionsIconSize SCM_ticketingPlayIcon'	, textClass: ''},	//"Stop pending mode"
	'28': {technical: true, iconClass: 'SCM_ActionsIconSize SCM_ActionNoIcon'	, textClass: ''},	//"S.I.R. Action"
	'29': {technical: true, iconClass: 'SCM_ActionsIconSize SCM_ticketingPlayIcon'	, textClass: ''},	//"Stop waiting mode"
	'30': {technical: true, iconClass: 'SCM_ActionsIconSize SCM_ticketingPauseIcon'	, textClass: ''},	//"Stop processing mode"
	'31': {technical: true, iconClass: 'SCM_ActionsIconSize SCM_ticketingPlayIcon'	, textClass: ''},	//"Stop External Mode"
	'32': {technical: true, iconClass: 'SCM_ActionsIconSize SCM_ticketingPlayIcon'	, textClass: ''},	//"Stop scheduling mode"
	'33': {technical: true, iconClass: 'SCM_ActionsIconSize SCM_DotBlackIcon'	, textClass: ''},	//"Stop waiting mode (General Pool)"
	'34': {technical: true, iconClass: 'SCM_ActionsIconSize SCM_ActionNoIcon'	, textClass: ''},	//"Add ticket to group"
	'35': {technical: true, iconClass: 'SCM_ActionsIconSize SCM_ActionNoIcon'	, textClass: ''},	//"Remove ticket from group"
	'36': {technical: true, iconClass: 'SCM_ActionsIconSize SCM_ActionNoIcon'	, textClass: ''},	//"Change external status"
	'37': {technical: true, iconClass: 'SCM_ActionsIconSize SCM_ActionNoIcon'	, textClass: ''},	//"Merge Ticket"
	//since 4.0 - This notification type is not used
	'38': {technical: true, iconClass: 'SCM_ActionsIconSize SCM_ActionOutOfSLAIcon'	, textClass: 'SCM_PoolTable_OutOfSLA'		},	//Due date elapsed
	'39': {technical: false, iconClass: 'SCM_ActionsIconSize SCM_ActionOutOfSLAIcon'	, textClass: 'SCM_PoolTable_SLAAmberAlert'	},	//AmberDate elapsed
	'40': {technical: true, iconClass: 'SCM_ActionsIconSize SCM_DotMauveBlackNicon'	, textClass: ''},	//"Send to General Pool as General Pending"
	'41': {technical: true, iconClass: 'SCM_ActionsIconSize SCM_ticketingPlayIcon'	, textClass: ''},	//"Stop Pending in General Pool"
	'42': {technical: true, iconClass: 'SCM_ActionsIconSize SCM_DotMauveBlueNicon'	, textClass: ''},	//"Schedule pending ticket"
	'43': {technical: true, iconClass: 'SCM_ActionsIconSize SCM_DotMauveBlueNicon'	, textClass: ''},	//"Schedule pending ticket to agent"
	'44': {technical: true, iconClass: 'SCM_ActionsIconSize SCM_ticketingPlayIcon'	, textClass: ''},	//"Stop scheduling (pending) mode"
	'45': {technical: false, iconClass: 'SCM_ActionsIconSize SCM_ActionTransfer'	, textClass: ''},	//Parent ticket added
	'46': {technical: false, iconClass: 'SCM_ActionsIconSize SCM_ActionTransfer'	, textClass: ''},	//Child ticket added
	'47': {technical: false, iconClass: 'SCM_ActionsIconSize SCM_ActionNoIcon'	, textClass: ''},	//Action added to parent
	'48': {technical: false, iconClass: 'SCM_ActionsIconSize SCM_ActionNoIcon'	, textClass: ''},	//Action added to child
	'49': {technical: false, iconClass: 'SCM_ActionsIconSize SCM_ActionNewItemIcon'	, textClass: ''},	//Item added to parent
	'50': {technical: false, iconClass: 'SCM_ActionsIconSize SCM_ActionNewItemIcon'	, textClass: ''},	//Item added to child
	'51': {technical: true, iconClass: 'SCM_ActionsIconSize SCM_ActionTransfer'	, textClass: ''},	//"Parent closed"
	'52': {technical: true, iconClass: 'SCM_ActionsIconSize SCM_ActionTransfer'	, textClass: ''},	//"Child closed"
	'53': {technical: true, iconClass: 'SCM_ActionsIconSize SCM_ActionTransfer'	, textClass: ''},	//"Start Transfer"
	'54': {technical: true, iconClass: 'SCM_ActionsIconSize SCM_ActionTransfer'	, textClass: ''},	//"Stop Transfer"
	'55': {technical: false, iconClass: 'SCM_ActionsIconSize SCM_ActionTransfer'	, textClass: ''},	//Stop Transfer Requested
	'56': {technical: false, iconClass: 'SCM_ActionsIconSize SCM_ActionTransfer'	, textClass: ''},	//Stop Transfer Accepted
	'57': {technical: false, iconClass: 'SCM_ActionsIconSize SCM_ActionTransfer'	, textClass: ''},	//Stop Transfer Denied
	//since 4.0 - This is the notification to indicate the out of SLA
	'58': {technical: false, iconClass: 'SCM_ActionsIconSize SCM_ActionOutOfSLAIcon'	, textClass: 'SCM_PoolTable_OutOfSLA'},	//"Ticket is checked out of SLA by the Alerter"
	'59': {technical: false, iconClass: 'SCM_ActionsIconSize SCM_ActionTransfer'	, textClass: ''},	//Stop Transfer has been requested
	'60': {technical: false, iconClass: 'SCM_ActionsIconSize SCM_ActionTransfer'	, textClass: ''},	//Stop Transfer has been accepted
	'61': {technical: false, iconClass: 'SCM_ActionsIconSize SCM_ActionTransfer'	, textClass: ''},	//Stop Transfer has been denied
	'62': {technical: true, iconClass: 'SCM_ActionsIconSize SCM_ActionNoIcon'	, textClass: ''},	//"No Email Address found in Employee Information"
	'63': {technical: true, iconClass: 'SCM_ActionsIconSize SCM_ActionNoIcon'	, textClass: ''},	//"Due date dyn defined"
	'64': {technical: true, iconClass: 'SCM_ActionsIconSize SCM_ActionNoIcon'	, textClass: ''},	//"Due date default"
	'65': {technical: true, iconClass: 'SCM_ActionsIconSize SCM_DotBlueNicon'	, textClass: ''},	//"Scheduled to Group"
	'66': {technical: true, iconClass: 'SCM_ActionsIconSize SCM_DotMauveBlueNicon'	, textClass: ''},	//"Scheduled to group in Pending Status"
	'67': {technical: true, iconClass: 'SCM_ActionsIconSize SCM_ActionNoIcon'	, textClass: ''},	//"Survey sent"
	'68': {technical: true, iconClass: 'SCM_ActionsIconSize SCM_ActionNoIcon'	, textClass: ''},	//"Sent to web service"
	'69': {technical: true, iconClass: 'SCM_ActionsIconSize SCM_ActionNoIcon'	, textClass: ''},	//"Out of office routed to backup"
	'70': {technical: true, iconClass: 'SCM_ActionsIconSize SCM_ActionNoIcon'	, textClass: ''},	//"Important parent data updated"
	'71': {technical: true, iconClass: 'SCM_ActionsIconSize SCM_ActionNoIcon'	, textClass: ''},	//"Child ticket updated with new parent data"
	'72': {technical: true, iconClass: 'SCM_ActionsIconSize SCM_ActionNoIcon'	, textClass: ''},	//"Out of office"
	'73': {technical: true, iconClass: 'SCM_ActionsIconSize SCM_ActionTransfer'	, textClass: ''},	//"Start transfer comment"
	'74': {technical: true, iconClass: 'SCM_ActionsIconSize SCM_ActionNoIcon'	, textClass: ''},	//"Send close mail on accept stop transfer"
	'75': {technical: true, iconClass: 'SCM_ActionsIconSize SCM_ItemMail'	, textClass: ''},	//"Send ticket for approval"
	'76': {technical: true, iconClass: 'SCM_ActionsIconSize SCM_ActionNoIcon'	, textClass: ''},	//"Send ticket for approval cancelled"
	'77': {technical: false, iconClass: 'SCM_ActionsIconSize SCM_ActionNoIcon'	, textClass: ''},	//Ticket for approval approved
	'78': {technical: false, iconClass: 'SCM_ActionsIconSize SCM_ActionNoIcon'	, textClass: ''},	//Ticket for approval rejected
	'79': {technical: false, iconClass: 'SCM_ActionsIconSize SCM_ActionTransfer'	, textClass: ''},	//Re use parent ticket
	'80': {technical: false, iconClass: 'SCM_ActionsIconSize SCM_ActionTransfer'	, textClass: ''},	//Re use child ticket
	'81': {technical: true, iconClass: 'SCM_ActionsIconSize SCM_ActionNoIcon'	, textClass: ''},	//"Add ticket task"
	'82': {technical: true, iconClass: 'SCM_ActionsIconSize SCM_ActionNoIcon'	, textClass: ''},	//"Remove ticket task"
	'83': {technical: true, iconClass: 'SCM_ActionsIconSize SCM_ActionNoIcon'	, textClass: ''},	//"Update ticket task"
	'84': {technical: true, iconClass: 'SCM_ActionsIconSize SCM_ActionNoIcon'	, textClass: ''},	//"Re open parent ticket"
	'85': {technical: true, iconClass: 'SCM_ActionsIconSize SCM_ActionNoIcon'	, textClass: ''},	//"Re open child ticket"
	'86': {technical: true, iconClass: 'SCM_ActionsIconSize SCM_ActionNewUserIcon'	, textClass: ''},	//"Delegate ticket"
	'87': {technical: true, iconClass: 'SCM_ActionsIconSize SCM_ActionNoIcon'	, textClass: ''},	//"Change action privacy"
	'88': {technical: true, iconClass: 'SCM_ActionsIconSize SCM_ActionNoIcon'	, textClass: ''},	//"Change item privacy"
	'89': {technical: true, iconClass: 'SCM_ActionsIconSize SCM_ActionNoIcon'	, textClass: ''},	//"Change item documenttype"
	'90': {technical: true, iconClass: 'SCM_ActionsIconSize SCM_ActionNoIcon'	, textClass: ''},	//"Bad email delivery"
	'91': {technical: true, iconClass: 'SCM_ActionsIconSize SCM_ActionNoIcon'	, textClass: ''},	//"Ticket flagged"
	'92': {technical: true, iconClass: 'SCM_ActionsIconSize SCM_ActionNoIcon'	, textClass: ''},	//"Ticket unflagged"
	//since 5.0 Show 'Ticket Link' action in list of documents
	'93': {technical: false, iconClass: 'SCM_ActionsIconSize application_wa_replace'	, textClass: ''},	//"Ticket linked"
	'94': {technical: false, iconClass: 'SCM_ActionsIconSize SCM_ActionNoIcon'	, textClass: ''},	//"Ticket unlinked"
	'95': {technical: true, iconClass: 'SCM_ActionsIconSize SCM_ActionNoIcon'	, textClass: 'SCM_PoolTable_Solved'},	//"Start solved"
	'96': {technical: true, iconClass: 'SCM_ActionsIconSize SCM_ActionNoIcon'	, textClass: ''},	//"Stop solved"
	'97': {technical: true, iconClass: 'SCM_ActionsIconSize SCM_ActionNoIcon'	, textClass: ''},	//"Sap transaction"
	'98': {technical: false, iconClass: 'SCM_ActionsIconSize SCM_ActionNoIcon'	, textClass: ''},	//Request for close ticket
	'else': {technical: false, iconClass: 'SCM_ActionsIconSize SCM_ActionNoIcon'	, textClass: ''}
});
/**
 * @param {String} poolType Indicate which type of ticket to create
 * @description Static method that create a ticket of the fine type.
 * @returns {SCM_Ticket} The ticket instance
 * @since 1.0
 */
SCM_Ticket.factory = function(poolType) {
	switch (poolType) {
	case 'DashboardPool'	:
	case 'MyPool'           :
	case 'GeneralPool'      :
	case 'TeamPool'         :
	case 'OPMPool'          :
	case 'MyActivity'       :
	case 'EmpHistory'       :
	case 'SearchTicket'		:
	case 'addAttachmentPopup':
	    return new SCM_Ticket();
	case 'MyCurrentTicket'  :
	    return new SCM_Ticket_MyCurrent();
	case 'DisplayDocs'		:
		return new SCM_Ticket_docDisplayer();
	}
};

/**
 * Method that convert the date in a HRW format to a JS Date.
 * @param {String} dateTime Date time with the HRW format
 * @returns {Date} The corresponding date object.
 * @since 1.0
 */
SCM_Ticket.convertDateTimeToObjects = function(dateTime) {
	if(!Object.isString(dateTime)) return null;
	return sapToObject(dateTime.substr(0, 10), dateTime.substr(11, 8));
};

/**
 * Method that convert the date in a HRW format to a display format.
 * @param {String} dateTime Date time with the HRW format
 * @returns {String} The corresponding date to display.
 * @since 1.0
 */
SCM_Ticket.convertDateTime = function(dateTime) {
    //Date and time in GMT
    if(!Object.isString(dateTime)) return null;
    var date = SCM_Ticket.convertDateTimeToObjects(dateTime);
    return objectToDisplay(date) + ' ' + objectToDisplayTime(date);
};

/**
 * Get the parameters of a file from its name.
 * @param {String} filename Name of the file
 * @returns {JSON Object} Determine, the extension, the icon for the type, the label for the type and the mimetype of the file.
 * @since 1.0
 */
SCM_Ticket.getFilenameParams = function(filename) {
	var extension 	= '';
	var type;
    var lastPoint 	= filename.lastIndexOf('.');
    var filesData	= SCM_Ticket.docTypes.get('1');  
	      
    if(lastPoint >= 0)  extension = filename.substr(lastPoint + 1).toLowerCase();
	
	type = filesData.extensions.get(extension);
	if(Object.isEmpty(type)) type = filesData.extensions.get('OTHERS');

	return {
		extension	: extension		,
		docIcon		: type.iconClass,
		docLabel	: type.label	,
		mimeType	: type.mimeType
	};
};