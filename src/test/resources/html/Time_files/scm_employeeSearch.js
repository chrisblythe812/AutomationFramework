/**
 * @class
 * Abstract class for the management of search employee forms
 * The class fire the following events:
 * <ul>
 * <li><b>EWS:scm_noEmployeeSelected</b>: It is fired when there is no more employee selected</li>
 * <li><b>EWS:scm_custCompSelected</b>: It is fired when a company or a customer is selected</li>
 * <li><b>EWS:scm_employeeSelected</b>: It is fired when an employee is selected</li> 
 * <li><b>EWS:scm_employeeSearchChanged</b>: It is fired when the user add or remove a char in any form fields</li>
 * </ul>
 * @author jonathanj & nicolasl
 * @version 4.4
 * <br/>Modified on 4.4
 * <ul>
 * <li>Manage the encoding of labels</li>
 * </ul>
 * <br/>Modified on 4.3
 * <ul>
 * <li>Do not unselect the employee when doing a CTRL+c in a field</li>
 * <li>1053868 - Corrected the display of escaped character %</li>
 * </ul>
 */
var ScmEmployeeSearch = Class.create(/** @lends ScmEmployeeSearch.prototype */{
    /**
	 * @type Application
	 * @description Application that create the form.
	 * @since 1.0
	 */
    parentApp: null,
    
    /**
	 * @type String
	 * @default ""
	 * @description Unique identifier of the form.
	 * @since 1.0
	 */
	ident: '',
    
    /**
	 * @type Integer
	 * @default 3
	 * @description The search of employees need at last this number of chars before a star.
	 * @since 1.0
	 */
    minCharsSearch: 3,
    
    /**
	 * @type String
	 * @default "*"
	 * @description String used as a wildcart for employee search.
	 * @since 1.0
	 */
    wildcartSearch: '*',
    
    /**
	 * @type Element
	 * @description Element with the HTML with the last employee selection.
	 * @since 1.0
	 */
    _lastSearchedField: null,
    
    /**
	 * @type infoPopUp
	 * @description Popup to contains the list of possible choices.
	 * @since 1.0
	 */
    _popup: null,
	
	/**
	 * @type String
	 * @description Display mode for the list of customer or the company. It could be:
	 * <ul>
	 * 	<li>'AUTOCOMPLETE' if the list of customer has to be a select box or</li>
	 * 	<li> 'INPUT' if the field is an input field.</li>
	 * </ul>
	 * @since 1.0
	 */
	displayCustComp: null,
    
	/**
	 * @type JSONAutocompleterSCM
	 * @description Auto completer for the list of customers / companies.
	 * @since 1.0
	 */
	_custCompAutoComp: null,
	
	/**
	 * @type String
	 * @description Id used for the autocompleter to be able to identify it.
	 * @since 1.0
	 */
	_custCompAutoCompId: null,
	
	/**
	 * @type Hash
	 * @description List of handlers for methods.
	 * @since 1.0
	 */
	_listeners: null,
	
	/**
	 * @type {JSON Object}
	 * @description Indicate the fields names for the company name and id.
	 * @since 1.0
	 */
	custCompCriteria: null,
	
	/**
	 * @type {String}
	 * @description Identifier of the selected company or customer.
	 * @since 1.0
	 */
	custCompId: null,
	
	/**
	 * @type Boolean
	 * @description The search is limited on existant tickets.
	 * @since 1.0
	 */
	onExistingTicket: null,
	
	/**
	 * @type Boolean
	 * @description Is the customer or the company mandatory before employee search.
	 * @since 1.0
	 */
	custCompMandatory: null,
	
	/**
	 * @type Element
	 * @description Node on the top of the form.
	 * @since 1.0
	 */
	parentNode: null,
	
	/**
	 * @type Boolean
	 * @description Is the form dedicated to be disabled.
	 * @since 1.0
	 */
	formDisabled: null,
	
	/**
	 * @type Boolean
	 * @description Is the field for the company selection to make uneditable.
	 * @since 2.2
	 */
	companySelectionDisabled: null,
	
	/**
	 * Indicate if there is a selected employee
	 * @type Boolean
	 * @default false
	 * @since 3.0
	 */
	_employeeSelected: false,
	
	/**
	 * Indicate if there is a selected company
	 * @type Boolean
	 * @default false
	 * @since 3.0
	 */
	_clientSelected: false,
	
	/**
	 * Id of the organisation used to limit the selectable companies.<br/>
	 * If it is null, it means that there is no limitation
	 * @type String
	 * @since 3.0
	 */
	_organisationId: null,
	
	/**
	 * Class constructor that calls the parent and sets the event listener for the class
	 * @param {Application} parent Caller application
	 * @param {String} ident Name used to identify the search employee form
	 * @param {Boolean} onExistingTicket Parameter to send to HRW for backend searches
	 * @param {String} organisationId Id of the organisation to use to limit searches
	 * @param {Element} parentNode HTML element that shoudl contains the form.
	 * @since 1.0
	 * <br/>Modified for 3.0:
	 * <ul>
	 * <li>Add handler when there is no more employee selected</li>
	 * <li>Addition of the parameter that allow to limit the search to 1 organisation and set its value</li>
	 * </ul>
	 * <br/>Modified for 2.2:
	 * <ul>
	 * <li>Set a default value to {@link ScmEmployeeSearch#companySelectionDisabled}</li>
	 * </ul>
	 */
    initialize: function(parent, ident, onExistingTicket, organisationId, parentNode) {
        this._listeners 		= $H({
			'custCompSelected'	: this.custCompSelected.bind(this),
			'noEmployee'		: this._noEmployeeSelected.bind(this)
		});
		
		document.observe('EWS:scm_custCompSelectedInternal'	, this._listeners.get('custCompSelected'));
		document.observe('EWS:scm_employeeSearchChanged'	, this._listeners.get('noEmployee'));
		
		this.parentApp          = parent;
		this.parentNode			= parentNode;
		this.ident              = ident;
		this._lastSearchedField = null;
		this.onExistingTicket	= onExistingTicket;	
		//since 2.2 Set that the company is not disabled by default	
		this.companySelectionDisabled = false;	
		
		//since 3.0 Initialize the organisation filter if any
		if(!Object.isEmpty(organisationId)) this._organisationId = organisationId;
    },
	
	/**
	 * @description Reset the event handlers and the form events. 
	 * @since 1.0
	 * <br/>Modified for 3.0:
	 * <ul>
	 * <li>Add handler when there is no more employee selected</li>
	 * <li>Do not reinitialize the client id, the client and the employee selected because they could be reused</li>
	 * </ul>
	 */
	reload: function() {
		//If there is an event handler, stop it 
		document.stopObserving('EWS:scm_custCompSelectedInternal'	, this._listeners.get('custCompSelected'));
		//since 3.0 Add observers for the new events
		document.stopObserving('EWS:scm_employeeSearchChanged'		, this._listeners.get('noEmployee'));
		
		//Start the event handler
		document.observe('EWS:scm_custCompSelectedInternal'	, this._listeners.get('custCompSelected'));	
		//since 3.0 Add observers for the new events
		document.observe('EWS:scm_employeeSearchChanged'	, this._listeners.get('noEmployee'));
	},
	
	/**
	 * Remove the form and the associated events
	 * @since 3.0
	 */
	remove: function() {
		//Stop the events
		document.stopObserving('EWS:scm_custCompSelectedInternal'	, this._listeners.get('custCompSelected'));
		document.stopObserving('EWS:scm_employeeSearchChanged'		, this._listeners.get('noEmployee'));
		
		//Remove the HTML code
		var node = this.parentNode.down('div#SCM_FindEmp_' + this.ident)
		if(!Object.isEmpty(node)) node.remove();
	},
	
	/**
	 * @param {Boolean} withDetails Is the text at bottom of the form?
	 * @description Get the content of the form for employee search. 
	 * @return {Element} HTML element that contains the form
	 * @since 1.0
	 * <br/>Modifed in 3.0
	 * <ul>
	 * <li>Add the identifier in the label ids</li>
	 * <li>Remove the ':' after the label, it is added later</li>
	 * </ul>
	 */
    getForm: function(withDetails) { 
		this.formDisabled = false;
		      
        //Build the form
        //since 3.0 Remove the ':' after the label
        var extension = this.getFormContent(new Template( '<div class="SCM_FindEmpLine">'
                                          +     '<div id="SCM_FindEmpl_Label_'+this.ident+'_#{criteria}" class="SCM_FindEmpLabel">#{label}</div>'
                                          +     '<input maxlength="100" class="application_autocompleter_box SCM_FindEmpText" type="text" id="SCM_FindEmpl_'+this.ident+'_#{criteria}" value="#{defValue}"/>'
                                          + '</div>'));
										  
        extension.insert('<p id="SCM_FindEmp_noResult_'+ this.ident +'" class="SCM_TicketGr_noResult">'+global.getLabel('No_founded_results')+'</p>');
        //since 3.0 Hide the no result found by default
		extension.down('p#SCM_FindEmp_noResult_'+ this.ident).hide();
		
		if (withDetails === true)
			extension.insert('<p class="SCM_TicketGr_ddTxt">' + global.getLabel('Push_enter_to_search').sub('%', this.minCharsSearch).sub('+', this.wildcartSearch) + '</p>');
		
        return extension;
    },
    
	/**
	 * @description Get the content of the form with all the fields disabled. 
	 * @return {Element} HTML element that contains the form
	 * @since 1.0
	 * <br/>Modifed in 3.0
	 * <ul>
	 * <li>Add the identifier in the label ids</li>
	 * <li>Remove the ':' after the label, it is added later</li>
	 * </ul>
	 */
	getFormDisabled: function() {    
		this.formDisabled = true;
		
		//since 3.0 Remove the ':' after the label
        return this.getFormContent(new Template( '<div id="SCM_FindEmpl_Label_'+this.ident+'_#{criteria}" class="SCM_FindEmpLine">'
                                         	 	+     '<div class="SCM_FindEmpLabel">#{label}</div>'
                                          		+     '<input class="application_autocompleter_box SCM_FindEmpText" type="text" disabled="true" id="SCM_FindEmpl_'+this.ident+'_#{criteria}" value="#{defValue}"/>'
			                             		+ '</div>'));
    },
	
	/**
	 * @param {Template} formTemplate Template to use for the form lines.
	 * @description Build the content of the form for employee search form.
	 * @return {Element} HTML element with the form content
	 * @since 1.0
	 * <br/>Modified in 3.0
	 * <ul>
	 * <li>Limit the size of the labels to avoid overflows</li>
	 * </ul>
	 */
	getFormContent: function(formTemplate) {
		var divId = 'SCM_FindEmp_' + this.ident;
        var extension   = new Element('div', {'id': divId});
		
		extension.insert(formTemplate.evaluate({label: global.getLabel('Customer')		, criteria: this.custCompCriteria.name }));
        extension.insert(formTemplate.evaluate({label: global.getLabel('Employee_id')  	, criteria: 'EMP_ID'    }));
        extension.insert(formTemplate.evaluate({label: global.getLabel('First_name')	, criteria: 'FIRST_NAME'}));
        extension.insert(formTemplate.evaluate({label: global.getLabel('Last_name') 	, criteria: 'LAST_NAME' }));
        extension.insert(formTemplate.evaluate({label: global.getLabel('Email')     	, criteria: 'EMAIL'     }));

		//since 3.0 Calculate the max size for the labels
		var sm = SCM_SizeManager.factory(divId);
		extension.select('.SCM_FindEmpLabel').each(function(item){
			sm.setParameters(item, item.innerHTML);
			item.writeAttribute('title', item.innerHTML);
			item.innerHTML = sm.truncate(90, true) + ': ';
		}, this);
		sm.remove();
		
		return extension;
	},
	
    /**
	 * @description Display the no result element. 
	 * @since 1.0
	 */
    displayNoResult: function() {
        var elem = this.parentNode.down('p#SCM_FindEmp_noResult_'+this.ident);
        if(!elem.visible()) elem.show();
    },
    
    /**
	 * @description Hide the no result element. 
	 * @since 1.0
	 */
    hideNoResult: function() {
		var elem = this.parentNode.down('p#SCM_FindEmp_noResult_'+this.ident);
        if(elem && elem.visible()) elem.hide();
    },
	
	/**
	 * Enable one or several fields of the form. 
	 * @param {Boolean} withCompCust allow to select or not the customer/company fields 
	 * @param {String} field Name of a field to enable (optional)
	 * @since 1.0
	 * <br/>Modified for 2.2 
	 * <ul>
	 * <li>Do not enable the company if it was deactivated manually</li>
	 * </ul>
	 */
	formEnable: function(withCompCust, field) {
		if(this.formDisabled === true) return;
		
		var fields = $A();
		var element;
		
		//If there is a given field => enable it
		if(field)
			fields.push(field);
		//If there is no given field => enable all fields with or without company/customer fields
		else if(withCompCust === true)
			fields = $A([this.custCompCriteria.name, 'EMP_ID', 'FIRST_NAME', 'LAST_NAME', 'EMAIL']);
		else			
			fields = $A(['EMP_ID', 'FIRST_NAME', 'LAST_NAME', 'EMAIL']);
			
		fields.each(function(fieldName) {
			//since 2.2 Do not enable the company if it is disabled manually
			if(fieldName === this.custCompCriteria.name && this.companySelectionDisabled) return;
			
			element = this.parentNode.down('input#SCM_FindEmpl_' + this.ident + '_'+fieldName);
			if(!Object.isEmpty(element)) {
				if(element.disabled === true) element.enable();
				element.stopObserving('keydown');
				if(fieldName === this.custCompCriteria.name) 
					element.observe('keydown', this.inputKeyPressed.bindAsEventListener(this, 'nonStandard'));
				else
					element.observe('keydown', this.inputKeyPressed.bindAsEventListener(this, 'standard'));
			}
		}.bind(this));
	},
	
	/**
	 * Disable one or several fields of the form.
	 * @param {Boolean} withCompCust allow to select or not the customer/company fields
	 * @param {String} field Name of a field to disable (optional)  
	 * @since 1.0
	 */
	formDisable: function(withCompCust, field) {
		if(this.formDisabled === true) return;
		
		var fields = $A();
		var element;
		
		//If there is a given field => enable it
		if(field)
			fields.push(field);
		//If there is no given field => enable all fields with or without company/customer fields
		else if(withCompCust === true)
			fields = $A([this.custCompCriteria.name, 'EMP_ID', 'FIRST_NAME', 'LAST_NAME', 'EMAIL']);
		else			
			fields = $A(['EMP_ID', 'FIRST_NAME', 'LAST_NAME', 'EMAIL']);
			
		fields.each(function(fieldName) {
			element = this.parentNode.down('input#SCM_FindEmpl_' + this.ident + '_'+fieldName);
			if(!Object.isEmpty(element)) {
				if(element.disabled === false) element.disable();
				element.stopObserving('keydown');
			}
		}.bind(this));
	},
	
	/**
	 * @param {Event} event Event geenrated when a company is selected
	 * @description Handler for the selection of a company via the autocomplete button
	 * @since 1.0
	 * <br/>Modified in 3.0
	 * <ul>
	 * <li>If the company stay the same, keep the employee data</li>
	 * </ul>
	 */
	custCompSelected: function(event) {
		var args = getArgs(event);

		if(args.idAutocompleter === undefined) args.idAutocompleter = args.idAutoCompleter; 
		if(args.idAutocompleter !== this._custCompAutoCompId) return;
		if(args.isEmpty === true) return;
		
		var values = $H();
		values.set(this.custCompCriteria.name	, args.textAdded);
		values.set(this.custCompCriteria.id		, args.idAdded);
		
		//Put the values in the form
		this.setValues(values, false);
		
		//Hide the no result field
		this.hideNoResult();
	},
	
	/**
	 * @param {Event} event Generated event
	 * @param {String} accessType Is the calling input field: 
	 * <ul>
	 * 	<li>a '<b>standard</b>' input field, </li>
	 * 	<li>a '<b>customer</b>' field,</li>
	 * 	<li>a '<b>company</b>' field or </li>
	 * 	<li>an '<b>unauthorized</b>' field.</li>
	 * </ul>
	 * @description (Abstract) Handler for the selection of a field as input text.
	 * @since 1.0
	 */ 
	inputKeyPressed: function(event, accessType)  {
		alert('This method is abstract!');
	},
	
	/**
	 * @param {String} fieldValue Value given by the user in the form field
	 * @param {String} criteria Is it the company, the employee id, the name or the email that is the criteria?
	 * @description Get from the back end the list of users that match the given informations.
	 * @since 1.0
	 * <br/>Modifications for 2.1:
	 * <ul>
	 * <li>Use the standard encoding before sending to HRW</li>
	 * </ul>
	 * @see ScmEmployeeSearch#employeeSearchResultList 
	 */
	searchEmployee: function(fieldValue, criteria) {
		var methodName;
		var onExistingTicket;
		if(this.onExistingTicket) onExistingTicket = 'True';
		else onExistingTicket = 'False';
		
        var params = $H({scAgentId: hrwEngine.scAgentId, onExistingTicket: onExistingTicket});

		//since 2.1 Use the standard encoding
		var safeFieldValue = HrwRequest.encode(fieldValue);
		
        switch(criteria) {
            case 'EMP_ID':
                methodName  = 'SearchByEmployeeId';
                params.set('employeeId', safeFieldValue);
				params.set('ClientSkillId', this.getValues(this.custCompCriteria.id));
                break;
            case 'FIRST_NAME':
                methodName = 'SearchByFirstName';
                params.set('firstName', safeFieldValue);
				params.set('ClientSkillId', this.getValues(this.custCompCriteria.id));
                break;
            case 'LAST_NAME':   
                methodName = 'SearchByLastName';
                params.set('lastName', safeFieldValue);
				params.set('ClientSkillId', this.getValues(this.custCompCriteria.id));
                break;
            case 'EMAIL':
				methodName = 'SearchByEmailAddress';
				params.set('emailAddress', safeFieldValue);
				params.set('ClientSkillId', this.getValues(this.custCompCriteria.id));
                break;
			default:
				return;
        }
        
        //Do the request
        hrwEngine.callBackend(this.parentApp, 'Backend.' + methodName, params, this.employeeSearchResultList.bind(this));
	},
	/**
	 * Create the popup to display the error message in a separate function
	 * @param {String} label
	 * @since 3.6
	 */
	_displayPopup: function(label) {
		var employeePopup = new infoPopUp({
            closeButton     : $H({'callBack': function() {
				employeePopup.close();
				delete employeePopup;
			}}),
            htmlContent     : label,
            indicatorIcon   : 'exclamation',
            width           : 500
        });
		employeePopup.create.bind(employeePopup).defer();
	},
	/**
	 * @param {String} value Value with the content to check.
	 * @description Check if a form entry is valid as a search pattern. 
	 * @return {Boolean} The check result.
	 * @since 1.0
	 * <br/>Modified in 4.4
	 * <ul>
	 * <li>Manage the encoding of labels</li>
	 * </ul>
	 * <br/>Modified in 4.3
	 * <ul>
	 * <li>1053868 - Corrected the display of escaped character %</li>
	 * </ul>
	 * <br/>Modified in 3.6
	 * <ul>
	 * <li>1040712 - Do the popup display in a separate function to delay the indication of the delete popup method</li>
	 * </ul>
	 */
	checkFormEntry: function(value) {
		// Get the values of the selected field fields
		var starIndex = value.indexOf(this.wildcartSearch);
		if (starIndex >= 0 && starIndex < this.minCharsSearch) {
			//since 3.6 - 1040712 - Display the popup in a new function
			//Since 4.3 - 1053868 - Corrected display of unescaped characters
        	//since 4.4 - Manage the encoding of labels
			this._displayPopup(SCM_getLabel('Only_after_%_chars').text.sub('%', this.minCharsSearch));
			return false;
		} 
		else if (value.length === 0) {
        	//since 3.6 - 1040712 - Display the popup in a new function
        	this._displayPopup(global.getLabel('Give_value'));		
			return false;
		}
		
		return true;
	},
	
    /**
	 * @param {JSON Object} jsonListEmployees List of founded employees
	 * @description Depending on the number of results:<ul>
	 *                  <li>If several results => display the list of result,</li>
	 *                  <li>If 1 result        => propagate the result in the form,</li>
	 *                  <li>If 0 results       => send an error. </li>
	 *                </ul>
	 * @since 1.0
	 * <br/>Modified for 3.5
	 * <ul>
	 * <li>1036629 - When clicking on the line instead of the text, select the correct line</li>
	 * </ul>
	 * <br/>Modified for 3.0
	 * <ul>
	 * <li>The result format changed</li>
	 * <li>Overwrite the customer/company with the result</li>
	 * </ul>
	 */
    employeeSearchResultList: function(jsonListEmployees) {
        var employeeTemplate = new Template('<tr>'
                                        +       '<td><input type="radio" name="empSel" value="#{id}"/></td>'
                                        +       '<td><span id="SCM_#{id}_fname">#{fname}</span></td>'
                                        +       '<td><span id="SCM_#{id}_lname">#{lname}</span></td>'
                                        +       '<td><span id="SCM_#{id}_id">#{empId}</span></td>'
                                        +       '<td><span id="SCM_#{id}_customer" custcompid="#{customerId}">#{customer}</span></td>'
                                        +       '<td><span id="SCM_#{id}_email">#{email}</span></td>'
                                        +   '</tr>');                                        
        var popup;
        var table;
        var buttons;
        var employeeList = $A();

		//since 3.0 The Result format changed
        var jsonEmpl = HrwRequest.getJsonArrayValue(jsonListEmployees, 'ArrayOfEmployee.Employee');

        jsonEmpl.each(function(employee, key) {
            employeeList.push({
				fname		: (employee.FirstName 		|| '/'), 
				lname		: (employee.LastName 		|| '/'), 
				empId		: (employee.EmployeeId 		|| '/'), 
				customer	: (employee.ClientName 		|| '/'), 
				customerId	: (employee.ClientSkillId 	|| '/'), 
				email		: (employee.Email  			|| '/'), 
				id			: key
			});
        });
        
        this.hideNoResult(); 
            
        switch(employeeList.size()) {
            case 0:			
				var values = $H({
                    EMP_ID      : '',
                    FIRST_NAME  : '',
                    LAST_NAME   : '',
                    EMAIL       : ''   
                });
				
				if(this.custCompMandatory === false) {
					values.set(this.custCompCriteria.name	, '');
					values.set(this.custCompCriteria.id	, '');
				} else {
					values.set(this.custCompCriteria.id	, this.custCompId);
				}
				
				this.setValues(values, false);
                this.displayNoResult();
                break;
                
            case 1:
                var values = $H({
                    EMP_ID      : employeeList[0].empId   	,
                    FIRST_NAME  : employeeList[0].fname   	,
                    LAST_NAME   : employeeList[0].lname   	,
                    EMAIL       : employeeList[0].email		
                });
				
				//since 3.0 Even if the company is not mandatory, it should be overwritten because it could be different
				values.set(this.custCompCriteria.name	, employeeList[0].customer	);
				values.set(this.custCompCriteria.id		, employeeList[0].customerId);
				
                this.setValues(values, false);
                break;
                
            default:
                //Create the table with the list of employees
                popup = new Element('div', {'id': 'SCM_popupEmployeeSearch'});
                
                table = new Element('table', {'id': 'SCM_popupEmployeeSearchTable', 'class': 'sortable'});
                popup.insert(table);

                table.insert(    '<tr>'
                            +       '<th/>'
                            +       '<th>' + global.getLabel('First_name')  + '</th>'
                            +       '<th>' + global.getLabel('Last_name')   + '</th>'
                            +       '<th>' + global.getLabel('EMPLOYEE_ID') + '</th>'
                            +       '<th>' + global.getLabel('Customer') 	+ '</th>'
                            +       '<th>' + global.getLabel('Email')       + '</th>'
                            +   '</tr>');
                            
                employeeList.each(function(employee, key) {                        
                    table.down(0).insert(employeeTemplate.evaluate(employee));
                }.bind(this));
                

                //Add a reaction on the line click
                table.down(0).childElements().each(function (line) {
                    //Add the onclick for non header lines
                    if(line.down(0).tagName !== 'TD') return;
                    
                    line.observe('click', function(clickedEv) {
                        var element = clickedEv.element();
                        if(element.tagName === 'TR') element = element.down('input');
                        //since 3.5 - 1036629 - Select the parent line and the radio on this line
                        else element = element.up('tr').down('input');
                        element.checked = true;
                    }.bindAsEventListener(this));
                    
                    line.observe('dblclick', function(clickedEv) {
                        this.selectLine(table.identify());
                    }.bindAsEventListener(this));
                }.bind(this));
                
                //Create the button to validate the choice or cancel
		        buttons = new megaButtonDisplayer({
			        elements : $A( [ 
			            {
				            label 			: global.getLabel('Select_employee')			,
				            className 		: 'SCM_PoolTable_footerButton'	                ,
				            type 			: 'button'						                ,
				            idButton 		: 'SCM_popupPendingDone'      	                ,
				            standardButton 	: true
			            },
			            {
				            label 			: global.getLabel('Cancel')						,
				            className 		: 'SCM_PoolTable_footerButton'					,
				            type 			: 'button'										,
				            idButton 		: 'SCM_popupPendingCancel'      				,
				            standardButton 	: true
			            }])
		        });
                popup.insert(buttons.getButtons());
                this.displayPopup(buttons, popup, table.identify());
                this.addLastSearchButton(this._lastSearchedField, popup, buttons, table.identify());
                break;
        }
    },
	
	/**
	 * Method called when the event no employee selected or selection changed are send
	 * @param {Object} event Event with the parameters
	 * @since 3.0
	 */
	_noEmployeeSelected: function(event) {
		if(getArgs(event).ident !== this.ident) return;
		if(getArgs(event).accessType === 'standard')this._employeeSelected = false;
		else this._clientSelected = false;
	},
	
	/**
	 * @param {JSON Object} jsonListCompanies List of the companies from SAP
	 * @description Display the list of companies from SAP
	 * @since 1.0
	 * <br/>Modified for 3.5
	 * <ul>
	 * <li>1036629 - When clicking on the line instead of the text, select the correct line</li>
	 * </ul>
	 * <br/>Modified in 3.0
	 * <ul>
	 * <li>If there is only one result, do all the work in the event handler</li>
	 * <li>Use an existant label for the "select customer" button</li>
	 * </ul>
	 */
	custCompSearchResultList: function(jsonListCompanies) {
		var companyTemplate = new Template('<tr>'
                                        +       '<td><input type="radio" name="empSel" value="#{id}"/></td>'
                                        +       '<td><span id="SCM_#{id}_custCompName">#{Value}</span></td>'
										+       '<td><span id="SCM_#{id}_custCompId">#{Key}</span></td>'
                                        +   '</tr>');
		var popup;
		var table;			
		var listCustComps 	= this.getListCustComps(jsonListCompanies);
		var values			= $H();
		
		this.hideNoResult(); 
		
		switch(listCustComps.size()) {
            case 0:			
				values.set(this.custCompCriteria.name	, '');
				values.set(this.custCompCriteria.id		, '');
				
                this.setValues(values, false);
				
                this.displayNoResult();
				if(this.custCompMandatory === true) this.formDisable(false);
                break;
                
            case 1:
				values.set(this.custCompCriteria.name	, listCustComps[0].Value);
				values.set(this.custCompCriteria.id		, listCustComps[0].Key);
				
				this.setValues(values, false);
                break;
                
            default:
				//Create the table with the list of employees
                popup = new Element('div', {'id': 'SCM_popupCustCompSearch'});
                
                table = new Element('table', {'id': 'SCM_popupCustCompSearchTable', 'class': 'sortable'});
                popup.insert(table);

                table.insert(    '<tr>'
                            +       '<th/>'
                            +       '<th>' + global.getLabel('Customer_Name')	+ '</th>'
                            +       '<th>' + global.getLabel('Customer_Id')   	+ '</th>'
                            +   '</tr>');
                            
                listCustComps.each(function(custComp, key) { 
					custComp.id = key;                       
                    table.down(0).insert(companyTemplate.evaluate(custComp));
                }.bind(this));
                

                //Add a reaction on the line click
                table.down(0).childElements().each(function (line) {
                    //Add the onclick for non header lines
                    if(line.down(0).tagName !== 'TD') return;
                    
                    line.observe('click', function(clickedEv) {
                        var element = clickedEv.element();
                        if(element.tagName === 'TR') element = element.down('input');
                        //since 3.5 - 1036629 - Select the parent line and the radio on this line
                        else element = element.up('tr').down('input');
                        element.checked = true;
                    }.bindAsEventListener(this));
                    
                    line.observe('dblclick', function(clickedEv) {
                        this.selectLine(table.identify());
                    }.bindAsEventListener(this));
                }.bind(this));
                
                //Create the button to validate the choice or cancel
		        buttons = new megaButtonDisplayer({
			        elements : $A( [ 
			            {
			            	//since 3.0 Use an existant label
				            label 			: global.getLabel('SelectCustomer')	,
				            className 		: 'SCM_PoolTable_footerButton'	    ,
				            type 			: 'button'						    ,
				            idButton 		: 'SCM_popupPendingDone'      	    ,
				            standardButton 	: true
			            },
			            {
				            label 			: global.getLabel('Cancel')			,
				            className 		: 'SCM_PoolTable_footerButton'		,
				            type 			: 'button'							,
				            idButton 		: 'SCM_popupPendingCancel'      	,
				            standardButton 	: true
			            }])
		        });
                popup.insert(buttons.getButtons());
                this.displayPopup(buttons, popup, table.identify());
				this.addLastSearchButton(this._lastSearchedField, popup, buttons, table.identify());
                break;
		}
	},
	
		
	/**
	 * Display the autocompleter for the company selection
	 * @param {Element} custCompField Element with the company value in the form
	 * @param {JSON Object} jsonListCustComp List of the companies from SAP
	 * @since 1.0
	 * <br/>Modification for 3.0 
	 * <ul>
	 * <li>Use the SCM autoCompleter to match default parameters in eWS</li>
	 * </ul>
	 */
	custCompBuildAutoComplete: function(custCompField, jsonListCustComp) {
		// Build the list of possible teams
        var json 			= {autocompleter: {object: $A()}};
		var divClass		= custCompField.readAttribute('class');
		var listCustComp 	= this.getListCustComps(jsonListCustComp);
		
		listCustComp.each(function(cust) {
            json.autocompleter.object.push({
                text: cust.Value,
                data: cust.Key
            });
        }.bind(this));
		
		if(json.autocompleter.object.size() === 0) {
        	var popup = new infoPopUp({
	            closeButton     : $H({'callBack': function() {
	                popup.close();
					delete popup;
	            }.bind(this)}) ,
	            htmlContent     : global.getLabel('SCM_NoCustomerConf') + '<br/>' + global.getLabel('Check_settings'),
	            indicatorIcon   : 'exclamation'  ,
	            width           : 500
	        });
			popup.create();
			
			document.fire('EWS:scm_noEmployeeSelected', this.ident);
			this.formDisable(true);
			return;
		}
		
		json.autocompleter.object[0].def = 'X';
		
		//Set the initial data
		var values = $H();
		values.set(this.custCompCriteria.name, json.autocompleter.object[0].text);
		values.set(this.custCompCriteria.id, json.autocompleter.object[0].data);
		
		this.setValues(values, false);
		
        // Build the autocompleter
		custCompField.replace('<div id="'+this._custCompAutoCompId+'"/>');
		//since 3.0 Use the SCM autocompleter with default parameters
		var autoCompDiv = this.parentNode.down('div#'+this._custCompAutoCompId);
		this._custCompAutoComp = new JSONAutocompleterSCM(autoCompDiv, {events: $H({'onResultSelected': 'EWS:scm_custCompSelectedInternal'})}, json);
		this._custCompAutoComp.getInputDiv(autoCompDiv).addClassName(divClass);
	},
	
	/**
     * @description Disable the company field
	 * @since 1.0
	 * <br/>Modification for 2.2
	 * <ul>
	 * <li>Set the global variable to indicate that the company is to disable to TRUE</li>
	 * </ul>
     */
	disableCompanySelection: function() {
		//since 2.2 Set the global variable to indicate that the company is not to update
		this.companySelectionDisabled = true;
		
		if(this._custCompAutoComp !== null) {
			if(this._custCompAutoComp.enabled === true)
				this._custCompAutoComp.disable();
		} else {
			var input = this.parentNode.down('input#' + this._custCompAutoCompId);
			if(input && !input.disabled)
				input.disabled = true;
		}
	},
	
	/**
	 * Build a standardized list of customers to use elsewhere. This list is filtered if there is a limitation on the organisation Id.
     * @param {JSON Object or Array} listCustomer List of the customers
     * @return {Array} The list of customers.
	 * @since 1.0
	 * <br/>Modification for 3.0 
	 * <ul>
	 * <li>If there is a limitation on the organisation, only display companies of the good organisation</li>
	 * </ul>
     */
	getListCustComps: function(listCustComp) {alert('This method is abstract!');},
	
	/**
     * @param {String} tableId Id of the table to search
     * @description Get the selected line from a list of result and close the popup that contains them.
	 * @since 1.0
	 * <br/>Modified in 3.4
	 * <ul>
	 * <li>1031022 - In the popup with companies selection, initialize the list of values</li>
	 * </ul>
	 * <br/>Modified in 3.2
	 * <ul>
	 * <li>Replace all the form content when a line is selected</li>
	 * </ul>
	 * <br/>Modified for 3.0
	 * <ul>
	 * <li>When an employee is selected, update the corresponding company/customer</li>
	 * <li>If there is only one result, do all the work in the event handler</li>
	 * </ul>
     */
    selectLine: function(tableId) {
		var popupHTML	= this._popup.obHtmlContent;
        var selectedId 	= '';
		
        popupHTML.select('#'+tableId+' input').each(function(input) {
            if(input.checked) selectedId = input.value;
        }.bind(this));
        if(selectedId === '') return;
		
		//since 3.4 - 1031022 - Set the list of values as an hash table
        var values = $H();
		var form;
		
		//For the selection of an employee
		if(tableId === 'SCM_popupEmployeeSearchTable') {
			//since 3.4 - Indicate that the target elements are span's
			formRow = popupHTML.down('span[id="SCM_'+selectedId+'_id"]').up(1);
			values = $H({
	            EMP_ID      : formRow.down('span[id="SCM_'+selectedId+'_id"]').innerHTML     ,
	            FIRST_NAME  : formRow.down('span[id="SCM_'+selectedId+'_fname"]').innerHTML  ,
	            LAST_NAME   : formRow.down('span[id="SCM_'+selectedId+'_lname"]').innerHTML  ,
	            EMAIL       : formRow.down('span[id="SCM_'+selectedId+'_email"]').innerHTML
	        });
			
			//since 3.0 Even if the company is not mandatory, it should be overwritten because it could be different
			values.set(this.custCompCriteria.name	, formRow.down('span[id="SCM_'+selectedId+'_customer"]').innerHTML	);
			values.set(this.custCompCriteria.id		, formRow.down('span[id="SCM_'+selectedId+'_customer"]').readAttribute('custcompid'));	
			
		//For the selection of a company				
		} else {
			formRow = popupHTML.down('[id="SCM_'+selectedId+'_custCompId"]').up(1);
			
			//Set only the company values
			values.set(this.custCompCriteria.name	, formRow.down('span[id="SCM_'+selectedId+'_custCompName"]').innerHTML);
			values.set(this.custCompCriteria.id		, formRow.down('span[id="SCM_'+selectedId+'_custCompId"]').innerHTML);
		}     
		
		//since 3.2 When the user select a line, replace all the content
		this.setValues(values, true);
		
		this.hideNoResult();
        TableKit.unloadTable(tableId);
        this._popup.close();
    },
	
    /**
	 * @param {Element} field Value given by the user in the form field
	 * @param {Element} result Popup to display when reload 
	 * @param {megaButtonDisplayer} buttons Button in the popup
	 * @param {String} tableId Id of the table to display in the popup
	 * @description Add the button to get back the last result
	 * @since 1.0
	 */
    addLastSearchButton: function(field, result, buttons, tableId) {
        if(Object.isEmpty(field) || Object.isEmpty(result)) return;
        
        this.removeLastSearchButton();
		
        var reload = new Element('div', {'id': 'SCM_FindEmp_'+this.ident+'_lastSearch', 'class': 'SCM_reload_lastEmployee'});
        field.addClassName('SCM_PoolTable_actions_before');
        field.insert({after: reload});
        
        reload.observe('click', function(event){ 
            this.displayPopup(buttons, result, tableId);
        }.bindAsEventListener(this));
    },
	
	/**
	 * @param {String} ifThisId (optional)Remove the last search button if it has this id (since 1.1)
	 * @description Remove the button to access the last search result 
	 * @since 1.0 
	 */
	removeLastSearchButton: function(ifThisId) {
		var reload = this.parentNode.down('[id="SCM_FindEmp_'+this.ident+'_lastSearch"]');
		if(!Object.isEmpty(reload)) {
			//Allow to check that the main field has a given id to remove.
			var mainDiv = reload.previous();
			if(ifThisId && mainDiv.identify() !== ifThisId) return;
            mainDiv.removeClassName('SCM_PoolTable_actions_before');
            reload.remove();
        }
	},
    
    /**
     * @param {megaButtonDisplayer} buttons Button in the popup
	 * @param {Element} htmlContent Content to display in the popup 
	 * @param {String} tableId Id of the table to display in the popup
	 * @description Display the popup with the list of possible results
	 * @since 1.0
	 */
    displayPopup: function(buttons, htmlContent, tableId) {
        //Create the popup
        this._popup = new infoPopUp({
            closeButton     : $H({'callBack': function() {
                TableKit.unloadTable(tableId); 
                this._popup.close();
            }.bind(this)}) ,
            htmlContent     : htmlContent ,
            indicatorIcon   : 'question'  ,
            width           : 730
        }); 
        
        buttons.updateHandler('SCM_popupPendingDone', this.selectLine.bind(this, tableId));
        
        buttons.updateHandler('SCM_popupPendingCancel', function() {
            TableKit.unloadTable(tableId);
            this._popup.close();
        }.bind(this));
        
        this._popup.create(); 
        TableKit.Sortable.init(tableId);  
    },
    
	/**
	 * Apply the filter on the list of companies to limit it to the companies with the given organisation id.
	 * @param {Hash} companies The list of companies with some parameters as the organisation id
	 * @param {Array} compToFilter The list of companies on which the filter is to apply
	 * @param {String} organisationId Id of the organisation with the filter to apply
	 * @returns {Array} The list of companies filtered with the organisation id if any
	 * @since 3.0
	 */
	_filterCompaniesByOrg: function(companies, compToFilter, organisationId) {
		//If there is no filter, nothing to do
		if(Object.isEmpty(organisationId)) return compToFilter;
		
		//Keep only the entries with a company that has the same organisation id
		var filteredComps = compToFilter.findAll(function(company) {
			return (companies.get(company.CompanyId).OrganizationId === organisationId);
		}, this);
		
		return filteredComps;
	},
	
	/**
     * @param {String} criteria (Optional) Field to get in COMPANY(_ID), EMP_ID, FIRST_NAME, LAST_NAME, EMAIL
     * @description Get a value from the form if there is no field => all are returned
     * @return {String/Hash} The value or the list of values.
	 * @since 1.0
	 * <br/>Modified in 3.3
	 * <ul>
	 * <li>If there is no company in an autocompleter, avoid JS error by setting the company name as space</li>
	 * </ul>
	 * <br/>Modified in 3.0
	 * <ul>
	 * <li>Give back the company id only if there is a client selected</li>
	 * <li>Give back the employee id only if there is an employee selected</li>
	 * </ul>
     */
    getValues: function(criteria) {
        var values = $H();
        var form;
		
		if (criteria === this.custCompCriteria.id) {
			if(this._clientSelected) return this.custCompId;
			else return '';
		}
		else if (criteria === this.custCompCriteria.name && this._custCompAutoComp !== null)
			return this._custCompAutoComp.getValue().textAdded;
		else if(criteria) {
			//since 3.0 Return the value only if it is not cancelled by the params clientSelected or employee selected
			if((this._clientSelected && (criteria === this.custCompCriteria.name || criteria === this.custCompCriteria.id)) ||
					(this._employeeSelected && criteria !== this.custCompCriteria.name && criteria !== this.custCompCriteria.id))
				return this.parentNode.down('input#SCM_FindEmpl_' + this.ident + '_' + criteria).value;
			else
				return '';
		} else {
			formRow = this.parentNode.down('input#SCM_FindEmpl_' + this.ident + '_EMP_ID').up(1);
			//since 3.0 Set values only if the employee is selected
			if(this._employeeSelected) {
				$A(['EMP_ID', 'FIRST_NAME', 'LAST_NAME', 'EMAIL']).each(function(criter){
					values.set(criter, formRow.down('input#SCM_FindEmpl_' + this.ident + '_' + criter).value);
				}.bind(this));
			} else {
				$A(['EMP_ID', 'FIRST_NAME', 'LAST_NAME', 'EMAIL']).each(function(criter){
					values.set(criter, '');
				}.bind(this));
			}
			
			//since 3.0 Add the values only if there is a customer selected
			if(this._clientSelected) {
				//Add the customer or company id
				if(this._custCompAutoComp !== null) 
					//since 3.3 If there is no value selected, put no company name
					values.set(this.custCompCriteria.name, (this._custCompAutoComp.getValue())?this._custCompAutoComp.getValue().textAdded:'');
				else 
					values.set(this.custCompCriteria.name, formRow.down('input#SCM_FindEmpl_' + this.ident + '_' + this.custCompCriteria.name).value);
				
				//Add the customer or company name
				values.set(this.custCompCriteria.id, this.custCompId);
			} else {
				values.set(this.custCompCriteria.id, '');
				values.set(this.custCompCriteria.name, '');
			}
			return values;
		}
    },
	
	
    /**
     * @param {Hash} values Object with values for fields in COMPANY(_ID), EMP_ID, FIRST_NAME, LAST_NAME, EMAIL
     * @param {Boolean} replaceAll This options allow to replace all the data with the given information (true by default)
     * @param {Boolean} callEvents Indicate if the events are to call or not. Is true by default.
     * @description Set a value from the form if there is no field => all the precised fields are updated.
	 * @since 1.0
	 * <br/>Modified in 3.2
	 * <ul>
	 * <li>If there is a company selected and an arriving employee of another company is selected, avoid to dump</li>
	 * <ul>
	 * <br/>Modified in 3.1
	 * <ul>
	 * <li>Add the management of the case when the employee is founded but with a different company</li>
	 * <ul>
	 * <br/>Modified for 3.0
	 * <ul>
	 * <li>Do not send to the event for an emplyee selection only the values given but all the values</li>
	 * <li>Do not send the employee selected event if there is no company</li>
	 * <li>Allow to don't fire the events</li>
	 * </ul>
     */
    setValues: function(values, replaceAll, callEvents) {
        if(Object.isEmpty(values)) return;
		if(values.get(this.custCompCriteria.id) === HrwEngine.NO_VALUE) values.unset(this.custCompCriteria.id);
		if(Object.isEmpty(replaceAll)) replaceAll = true;
		if(Object.isEmpty(callEvents)) callEvents = true;
		
		var fireNoEmployee 	= false;
		var fireClientSel	= false;
		var fireEmpSelect	= false;
		
		if(!replaceAll && this._clientSelected && this._employeeSelected && this.custCompId === values.get(this.custCompCriteria.id)) return;

		//since 3.0 Fire the events depending on the given values
		if (!this.formDisabled) {
			//If there is no company id in the coming data
			if (Object.isEmpty(values.get(this.custCompCriteria.id))) {
				//If we had a company just before => unselect it and send that the employee is no more selected
				if (this._clientSelected) {
					//Reset the company
					this._clientSelected = false;
					
					//Reset the employee
					if(!replaceAll) values = this.resetEmployeeValues(values);
					if(this._employeeSelected) fireNoEmployee = true;
					this._employeeSelected = false;
				}
				
			//If there is a company in the coming data
			} else {
				//If there is no company selected but the current one = the last one and there is already an employee
				if (!this._clientSelected && this.custCompId === values.get(this.custCompCriteria.id) && this._employeeSelected) {
					values.set('EMP_ID'		, this.getValues('EMP_ID'));
					values.set('FIRST_NAME'	, this.getValues('FIRST_NAME'));
					values.set('LAST_NAME'	, this.getValues('LAST_NAME'));
					values.set('EMAIL'		, this.getValues('EMAIL'));	
					//Select the company
					this._clientSelected 	= true;
					fireClientSel 			= true;
					fireEmpSelect 			= true;
					
				//If it was no company selected => select the company and reset the employee
				//since 3.1 If there is an employee, indicate it anyway
				} else if (!this._clientSelected || (this.custCompId !== values.get(this.custCompCriteria.id) && Object.isEmpty(values.get('EMP_ID')))) {
					//Select the company
					this._clientSelected 	= true;
					this.custCompId 		= values.get(this.custCompCriteria.id);
					fireClientSel 			= true;
					
					//Reset the employee
					if(!replaceAll) values = this.resetEmployeeValues(values);
					if(this._employeeSelected) fireNoEmployee = true;
					this._employeeSelected = false;
					
				//since 3.2 If there was a company selected update its value 
				} else if(this._clientSelected && (this.custCompId !== values.get(this.custCompCriteria.id))){
					this._clientSelected 	= true;
					this.custCompId 		= values.get(this.custCompCriteria.id);
					fireClientSel 			= true;
				}
			}
			
			//If there is no employee in the given data
			if (Object.isEmpty(values.get('EMP_ID'))) {
				//If we had an employee selected just before => unselect it
				if (this._employeeSelected) {
					//Reset the employee
					if(!replaceAll) values = this.resetEmployeeValues(values);
					if(this._employeeSelected) fireNoEmployee = true;
					this._employeeSelected = false;
				}
				
			//If there is an employee in the coming data
			} else {
				//If there was no employee before => select the employee
				if (!this._employeeSelected) {
					this._employeeSelected = true;
					fireEmpSelect = true;
				}
			}
		}
		
		//since 3.0 If there is no customer/company selected, disable the form
		if(!this._clientSelected) this.formDisable(false);
		
		//Put the values in the form
		values.each(function(val) {
			if(val.key === this.custCompCriteria.id) {
				if(!Object.isEmpty(this._custCompAutoComp)) 
					this._custCompAutoComp.setDefaultValue(val.value, false, false);
			} else {
				var field = this.parentNode.down('input#SCM_FindEmpl_' + this.ident + '_' + val.key);
				if (!Object.isEmpty(field)) 
					field.value = val.value;
			}
        }.bind(this));
		
		//since 3.0 Fire the events
		if (fireNoEmployee) {
			this.removeLastSearchButton();
			//since 3.0 Fire the event only if permitted
			if(callEvents)
				document.fire('EWS:scm_noEmployeeSelected', this.ident);
		}
		if(fireClientSel) {
			this.formEnable(true);
			//since 3.0 Fire the event only if permitted
			if(callEvents)
				document.fire('EWS:scm_custCompSelected', {
					isEmpty			: false,
					idAdded			: values.get(this.custCompCriteria.id),
					textAdded		: values.get(this.custCompCriteria.name),
					idAutocompleter	: this._custCompAutoCompId
				});
		}
		//since 3.0 Fire the event only if permitted
		if(fireEmpSelect && callEvents)
			document.fire('EWS:scm_employeeSelected', {values: this.getValues(),ident: this.ident});
    },
	
	/**
	 * Allow to reset all the employee fields in the form.
	 * @param {Hash} values List of the form content to update
	 * @returns {Hash} The form values but without the employee fields
	 */
	resetEmployeeValues: function(values) {
		//Reset the employee
		values.set('EMP_ID'		, '');
		values.set('FIRST_NAME'	, '');
		values.set('LAST_NAME'	, '');
		values.set('EMAIL'		, '');	
		
		return values;
	}
});
/**
 * @class
 * @description In this class, search forms have a customer search via input field
 * @augments ScmEmployeeSearch
 * @author jonathanj & nicolasl
 * @version 1.0
 */
var ScmEmployeeSearchCustomerBased = Class.create(ScmEmployeeSearch, /** @lends ScmEmployeeSearchCustomerBased.prototype */{
	/**
	 * Class constructor that initialize that the search of company is done via input field.
	 * @param {Application} parent Caller application
	 * @param {String} ident Name used to identify the search employee form
	 * @param {Boolean} onExistingTicket Parameter to send to HRW for backend searches
	 * @param {String} organisationId Id of the organisation to use to limit searches
	 * @param {Element} parentNode HTML element that shoudl contains the form.
	 * @since 1.0
	 * <br/>Modification in 3.0
	 * <ul>
	 * <li>Addition of the parameter that allow to limit the search to 1 organisation</li>
	 * </ul>
	 */
    initialize: function($super, parent, ident, onExistingTicket, organisationId, parentNode) {
		this.custCompCriteria	= {name: 'COMPANY', id: 'COMPANY_ID'};
		this.displayCustComp 	= 'INPUT';
		//since 3.0 Addition of the organisation id
		$super(parent, ident, onExistingTicket, organisationId, parentNode);
	},
	
	/**
	 * @param {Element} form The form object once it was added in the HTML content
	 * @param {Boolean} disabled Is the form to disabled?
	 * @param {Boolean} customerMandatory (optional) Is the customer field mandatory as first field  
	 * @description Add the event to manage the search of en employee
	 * @since 1.0
	 */    
    setFormInitial: function(form, disabled, customerMandatory) {
		this.custCompMandatory = customerMandatory;
		
		//If there is no action on the field
		if (disabled === true) {
			this.formDisable(true);
			return;
		}

		this._custCompAutoCompId = 'SCM_FindEmpl_' + this.ident + '_' + this.custCompCriteria.name;
		
		//If the field customer is mandatory
		if (customerMandatory === true) {
			var params = $H({scAgentId: hrwEngine.scAgentId});
			var type;

			var customerField = form.down('[id="'+this._custCompAutoCompId+'"]');
			
			//Disable all fields except the customer
			this.formDisable(false);
			
			if(this.displayCustComp !== null) {
				//For the autocomplete, load the list of customers
				if(this.displayCustComp === 'AUTOCOMPLETE')
					hrwEngine.callBackend(this.parentApp, 'Admin.Bhou', params, this.custCompBuildAutoComplete.bind(this, customerField));
				
				//Add the event handlers on ENTER key
				else if (this.displayCustComp === 'INPUT')
					customerField.observe('keydown', this.inputKeyPressed.bindAsEventListener(this, 'customer'));
			} else {
				new PeriodicalExecuter(function(pe) {
					if(this.displayCustComp === null) return;
					pe.stop();
					//For the autocomplete, load the list of customers
					if(this.displayCustComp === 'AUTOCOMPLETE')
						hrwEngine.callBackend(this.parentApp, 'Admin.Bhou', params, this.custCompBuildAutoComplete.bind(this, customerField));
					
					//Add the event handlers on ENTER key
					else if (this.displayCustComp === 'INPUT')
						customerField.observe('keydown', this.inputKeyPressed.bindAsEventListener(this, 'customer'));
				}, 1);
			}

			return;
		}

		//Add the event handlers on ENTER key
		form.childElements().each(function(formItem){
			var input = formItem.down('input');
			if (Object.isEmpty(input)) return;

			input.observe('keydown', this.inputKeyPressed.bindAsEventListener(this, 'standard'));
		}.bind(this));
    },
	
	/**
	 * @event
	 * @param {Event} event Generated event
	 * @param {String} accessType Is the calling input field "standard" or not?
	 * @description (Abstract) Handler for the selection of a field as input text.
	 * @since 1.0
	 * <br/>Modifications for 4.3:
	 * <ul>
	 * <li>Add the CTRL+C in the list of values to ignore</li>
	 * </ul>
	 */ 
	inputKeyPressed: function(event, accessType) {				
		var values;
		//Build the list of non alphanumeric keys
		//since 4.3 - Add the CTRL+C in the list of  values to ignore
		var functionKeys = $A([1, 2, 3, 4, 9, 16, 17, 18, 19, 20, 27, 67, 144, 145]);
		
		//Add the function keys for page UP, page down, ...
		for (var i = 33; i <= 47; i++) {
			functionKeys.push(i);
		}
		//Add the F1, F2, ...
		for (var i = 112; i <= 127; i++) {
			functionKeys.push(i);
		}
		//since 3.0 The non character entries do not any action
		if(functionKeys.indexOf(event.keyCode) >= 0) return;
		
		//Do only something if the key is ENTER
		if(event.keyCode !== 13 && event.keyCode !== 14) {
			//since 3.0 If it is the customer, reset its id
			if(accessType !== "standard") {
				values = $H();
				values.set(this.custCompCriteria.id, '');
				this.setValues(values, false, false);
			}
				
			document.fire('EWS:scm_employeeSearchChanged', {
				ident		: this.ident,
				accessType	: accessType
			});
			return false;
		}
		
		if(this.checkFormEntry(event.element().value) === false) {
			if(accessType !== 'standard') {
				values = $H({
                    EMP_ID      : '',
                    FIRST_NAME  : '',
                    LAST_NAME   : '',
                    EMAIL       : ''   
                });
				values.set(this.custCompCriteria.name	, '');
				values.set(this.custCompCriteria.id		, '');
                this.setValues(values, false);
				
                this.displayNoResult();
				if(this.custCompMandatory === true) this.formDisable(false);	
			}
			return;
		}
		
		this._lastSearchedField = event.element();
		//For all common fields, use the standard way
		if (accessType === 'standard')
			this.searchEmployee(this._lastSearchedField.value, this._lastSearchedField.identify().substr(14 + this.ident.length));
			
		//For the customer field, call the method that allow to search company with a pattern
		else
			hrwEngine.callBackend(	this.parentApp							, 
									'Admin.SearchCustomersByName'			, 
									$H({
										scAgentId	: hrwEngine.scAgentId		,
										//since 2.1 Use the standard encoding
										name		: HrwRequest.encode(event.element().value)
									})										, 
									this.custCompSearchResultList.bind(this), 
									true									);
	},
	
	/**
	 * @param {String} fieldValue Value given by the user in the form field
	 * @param {String} criteria Is it the customer, the employee id, the name or the email that is the criteria 
	 * @description Get from the back end the list of users that match teh given informations. 
	 * @since 1.0
	 * @see ScmEmployeeSearch#employeeSearchResultList
	 */
    searchEmployee: function($super, fieldValue, criteria) {
     	if(criteria === this.custCompCriteria.name)
        	hrwEngine.callBackend(this.parentApp, 'Admin.Bhou', $H({scAgentId: hrwEngine.scAgentId}), this.employeeSearchResultList.bind(this));
		else
			$super(fieldValue, criteria);

    },
	/**
	 * Build a standardized list of customers to use elsewhere. This list is filtered if there is a limitation on the organisation Id.
     * @param {JSON Object or Array} listCustomer List of the customers
     * @return {Array} The list of customers.
	 * @since 1.0
	 * <br/>Modification for 3.0 
	 * <ul>
	 * <li>If there is a limitation on the organisation, only display companies of the good organisation</li>
	 * </ul>
     */
	getListCustComps: function(listCustomer) {
		var listCustomerArray = $A();
		
		if(!Object.isHash(listCustomer)) {
			listCustomerArray = HrwRequest.getJsonArrayValue(listCustomer, 'ArrayOfKeyValue.KeyValue');
			//since 3.0 Add the companyId to each field
			listCustomerArray = listCustomerArray.map(function(company){
				company.CompanyId = '';
				return company;
			});
		} else 
			listCustomer.each(function(customer) {
				listCustomerArray.push({Key: customer.key, Value: customer.value.Name, CompanyId: ''});
			}, this);
		
		//since 3.0 If there is a limitation on the company, filter it
		return this._filterCompaniesByOrg(hrwEngine.companies, listCustomerArray, null);
	}
});
/**
 * @class
 * @description In this class, search forms have a customer search via select box
 * @augments ScmEmployeeSearch
 * @author jonathanj & nicolasl
 * @version 1.0
 */
var ScmEmployeeSearchCompanyBased = Class.create(ScmEmployeeSearch, /** @lends ScmEmployeeSearchCompanyBased.prototype */{
	/**
	 * Class constructor that initialize that the search of company is done via input field.
	 * @param {Application} parent Caller application
	 * @param {String} ident Name used to identify the search employee form
	 * @param {Boolean} onExistingTicket Parameter to send to HRW for backend searches
	 * @param {String} organisationId Id of the organisation to use to limit searches
	 * @param {Element} parentNode HTML element that shoudl contains the form.
	 * @since 1.0
	 * <br/>Modification in 3.0
	 * <ul>
	 * <li>Addition of the parameter that allow to limit the search to 1 organisation</li>
	 * </ul>
	 */	
    initialize: function($super, parent, ident, onExistingTicket, organisationId, parentNode) {
		this.custCompCriteria	= {name: 'COMPANY', id: 'COMPANY_ID'};	
		this.displayCustComp 	= 'AUTOCOMPLETE';
		//since 3.0 Addition of the organisation id
		$super(parent, ident, onExistingTicket, organisationId, parentNode);
	},
	
	/**
	 * @param {Element} form The form object once it was added in the HTML content
	 * @param {Boolean} disabled Is the form to disabled?
	 * @param {Boolean} customerMandatory (optional) Is the customer field mandatory as first field  
	 * @description Add the event to manage the search of en employee
	 * @since 1.0
	 */   
    setFormInitial: function(form, disabled, companyMandatory) {
		this.custCompMandatory = companyMandatory;
		
		//If there is no action on the field
		if (disabled === true) {
			this.formDisable(true);
			return;
		}
		
		this._custCompAutoCompId = 'SCM_FindEmpl_' + this.ident + '_' + this.custCompCriteria.name;
		
		//If the field company is mandatory
		if (companyMandatory === true) {
			var params = $H({scAgentId: hrwEngine.scAgentId});
			var type;
			var companyField = form.down('[id="'+this._custCompAutoCompId+'"]');

			//Disable all fields except the company
			this.formDisable(false);

			if(this.displayCustComp !== null) {
				//For the autocomplete, load the list of companies
				if(this.displayCustComp === 'AUTOCOMPLETE')
					hrwEngine.callBackend(this.parentApp, 'Admin.CollectCompanies', params, this.custCompBuildAutoComplete.bind(this, companyField));
				
				//Add the event handlers on ENTER key	
				else if (this.displayCustComp === 'INPUT')
					companyField.observe('keydown', this.inputKeyPressed.bindAsEventListener(this, 'company'));
			} else {
				new PeriodicalExecuter(function(pe) {
					if(this.displayCustComp === null) return;
					pe.stop();
					//For the autocomplete, load the list of companies
					if(this.displayCustComp === 'AUTOCOMPLETE')
						hrwEngine.callBackend(this.parentApp, 'Admin.CollectCompanies', params, this.custCompBuildAutoComplete.bind(this, companyField));
					
					//Add the event handlers on ENTER key	
					else if (this.displayCustComp === 'INPUT')
						companyField.observe('keydown', this.inputKeyPressed.bindAsEventListener(this, 'company'));
				}.bind(this), 1);
			}
			return;
		}

		//Add the event handlers on ENTER key
		form.childElements().each(function(formItem){
			var input = formItem.down('input');
			if (Object.isEmpty(input)) return;

			input.observe('keydown', this.inputKeyPressed.bindAsEventListener(this, 'standard'));
		}.bind(this));
    },
	
	/**
	 * @event
	 * @param {Event} event Generated event
	 * @param {String} accessType Is the calling input field "standard" or not?
	 * @description (Abstract) Handler for the selection of a field as input text.
	 * @since 1.0
	 * <br/>Modifications for 4.3:
	 * <ul>
	 * <li>Add the CTRL+C in the list of values to ignore</li>
	 * </ul>
	 */ 
	inputKeyPressed: function(event, accessType) {			
		var values;
		//Build the list of non alphanumeric keys
		//since 4.3 - Add the CTRL+C in the list of values to ignore
		var functionKeys = $A([1, 2, 3, 4, 9, 16, 17, 18, 19, 20, 27, 67, 144, 145]);
		
		//Add the function keys for page UP, page down, ...
		for (var i = 33; i <= 47; i++) {
			functionKeys.push(i);
		}
		//Add the F1, F2, ...
		for (var i = 112; i <= 127; i++) {
			functionKeys.push(i);
		}
		//since 3.0 The non character entries do not any action
		if(functionKeys.indexOf(event.keyCode) >= 0) return;
		
		//Do only something if the key is ENTER
		if(event.keyCode !== 13 && event.keyCode !== 14) {
			//since 3.0 If it is the customer, reset its id
			if(accessType !== "standard") {
				values = $H();
				values.set(this.custCompCriteria.id, '');
				this.setValues(values, false, false);
			}
				
			document.fire('EWS:scm_employeeSearchChanged', {
				ident		: this.ident,
				accessType	: accessType
			});
			return false;
		}
		
		if(this.checkFormEntry(event.element().value) === false) {
			if(accessType !== 'standard') {
				values = $H({
                    EMP_ID      : '',
                    FIRST_NAME  : '',
                    LAST_NAME   : '',
                    EMAIL       : ''   
                });
				values.set(this.custCompCriteria.name	, '');
				values.set(this.custCompCriteria.id		, '');
                this.setValues(values, false);
				
                this.displayNoResult();
				if(this.custCompMandatory === true) this.formDisable(false);
			}
			return;
		}
		
		this._lastSearchedField = event.element();
		
		//For all common fields, use the standard way
		if(accessType === 'standard') 
			this.searchEmployee(this._lastSearchedField.value, this._lastSearchedField.identify().substr(14 + this.ident.length));
			
		//For the customer field, call the method that allow to search company with a pattern
		else 
			hrwEngine.callBackend(	this.parentApp							, 
									'Admin.CollectCompanies'				, 
									$H({scAgentId: hrwEngine.scAgentId})	, 
									this.custCompSearchResultList.bind(this), 
									true									);	
	},
	
	/**
	 * @param {String} fieldValue Value given by the user in the form field
	 * @param {String} criteria Is it the customer, the employee id, the name or the email that is the criteria 
	 * @description Get from the back end the list of users that match teh given informations. 
	 * @since 1.0
	 * @see ScmEmployeeSearch#employeeSearchResultList
	 */
    searchEmployee: function($super, fieldValue, criteria) {
        if(criteria === this.custCompCriteria.name)
        	hrwEngine.callBackend(this.parentApp, 'Admin.Bhou', $H({scAgentId: hrwEngine.scAgentId}), this.employeeSearchResultList.bind(this));
		else
			$super(fieldValue, criteria);
	},
	
	/**
	 * Build a standardized list of customers to use elsewhere. This list is filtered if there is a limitation on the organisation Id.
     * @param {JSON Object or Array} listCustomer List of the customers
     * @return {Array} The list of customers.
	 * @since 1.0
	 * <br/>Modification for 3.0 
	 * <ul>
	 * <li>If there is a limitation on the organisation, only display companies of the good organisation</li>
	 * </ul>
     */
	getListCustComps: function(listCompanies) {
		var listCompaniesArray = $A();
		
		if(!Object.isHash(listCompanies)) {
			listCompaniesArray = HrwRequest.getJsonArrayValue(listCompanies, 'ArrayOfKeyValue.KeyValue');
			//since 3.0 Add the companyId to each field
			listCompaniesArray = listCompaniesArray.map(function(company){
				company.CompanyId = company.Key;
				return company;
			});
		} else
			listCompanies.each(function(company) {
				listCompaniesArray.push({Key: company.key, Value: company.value.Name, CompanyId: company.key});
			}, this);
		
		//since 3.0 If there is a limitation on the company, filter it
		return this._filterCompaniesByOrg(hrwEngine.companies, listCompaniesArray, this._organisationId);
	}

});

/**
 * @param {Application} parent Caller application
 * @param {String} ident Name used to identify the search employee form
 * @param {Boolean} onExistingTicket Parameter to send to HRW for backend searches
 * @param {String} companySkillIdForOrg Limit the list of possible values to the organisation of the given company
 * @param {Element} parentNode HTML element that should contains the form.
 * @description Choose the kind of employee search to create depending on the HRW login information.
 * @return {ScmEmployeeSearch} The employee search with the correct subtype.
 * @since 1.0
 * <br/>Modified in 3.0
 * <ul>
 * <li>Addition of the parameter that allow to limit the search to a given organisation</li>
 * </ul>
 * <br/>Modified in 3.1
 * <ul>
 * <li>If the company is not in the engine companies, avoid an error by putting a null organisation</li>
 * </ul>
 */
ScmEmployeeSearch.factory = function(parent, ident, onExistingTicket, companySkillIdForOrg, parentNode) {
	var employeeSearch;
	var organisationId;
	
	//Define the default parent node
	if(Object.isEmpty(parentNode)) parentNode = parent.virtualHtml;
	
	//since 3.1 It is possible that the company is not in the engine list
	//Get the organisation of the given company
	if(!Object.isEmpty(companySkillIdForOrg)) 
		organisationId = hrwEngine.companies.get(companySkillIdForOrg);
	
	//since 3.1 If the comapny is founded, get teh corresponding organisation id.
	if (!Object.isEmpty(organisationId))
		organisationId = organisationId.OrganizationId;
	else 
		organisationId = null;
		
	if(hrwEngine.customerBased === true)
		//since 3.0 Add the organisation ID
		employeeSearch = new ScmEmployeeSearchCustomerBased(parent, ident, onExistingTicket, organisationId, parentNode);
	else
		//since 3.0 Add the organisation ID
		employeeSearch = new ScmEmployeeSearchCompanyBased(parent, ident, onExistingTicket, organisationId, parentNode);
	
	return employeeSearch;
};