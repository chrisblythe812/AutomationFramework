/**
 *@fileOverview timeEntryScreen.js
 *@description It contains a class with functionality for creating or removing time events or editing its properties.
 */
/**
 *@constructor
 *@description Class with functionality for creating or removing time events or editing its properties.
 *@augments Application
 */
var timeEntryScreen = Class.create(Application,
/** 
*@lends timeEntryScreen
*/
{
    /**
    *Constructor of the class timeEntryScreen
    */
    initialize: function($super, args) {
        $super(args);
        this.getContentService = "GET_CONTENT2";
        this.getRequestService = "GET_REQUEST";
        this.saveEventsService = "SAVE_EVENT";
        this.saveRecEventsService = "SAVE_RECUR";
        this.getCostCentersService = "GET_CC";
        this.getStoredSearchesService = "GET_SHLP_LST";
        this.fastEntryService = "SAVE_REQUEST_F";
        this.submitStatus = new Hash();
        this.maxEmpSelected = global.maxOnline;
        this.timeEntryEmployeeSelectionBinding = this._employeeSelection.bindAsEventListener(this);
        this.timeEntryEmployeeSelectedBinding = this._employeeSelected.bindAsEventListener(this);
        this.timeEntryEmployeeUnselectedBinding = this._employeeUnselected.bindAsEventListener(this);
        this.timeEntryLeftMenuAdvSearchBinding = this._refreshMultiselect.bindAsEventListener(this);
        this.timeEntryCorrectDateBinding = this._correctDateSelected.bindAsEventListener(this);
    },
    /**
    *@description Starts timeEntryScreen
    *@param {Hash} args Object from the previous application
    */
    run: function($super, args) {
        $super();
        // Class variables to be initialized
        this.subApp = "NONE";
        // Vector which contains the docIds for the all updated documents for the current event
        this.sendDocumentInfo = new Array();
        // Label to be inserted in the "X uploaded documents" button
        this.labelUplDocuments = "";
        // Indicates if the event has capability to send documents
        this.sendDocCapability = false;
        // Array with the mandatory document types id.
        this.mandatoryDocTypeIds = new Array();
        // Uploaded document types ids (mandatory and/or optional)
        this.uploadedDocTypesIds = new Array();
        // Indicates if all the mandatory doc types are uploaded
        this.areAllMandatoryUploaded = true;
        // Number of uploaded documents
        this.numUploadedDocs = 0;
        // Indicates if the documents ids has been refreshed (with the backend entries)
        this.docIdrefreshed = false;
        // Label to be inserted in the "X uploaded documents with coversheet" button
        this.labelCoversheets = "";
        // Array with the coversheets
        this.coversheetIds = new Array();
        // Number of coversheets
        this.numCoversheets = 0;

        if (this.firstRun) {
            this.appContainer = new Element("div", {id: "applicationtimeEntryScreen_body" });
            this.virtualHtml.insert(this.appContainer);
        }
        else
            this.appContainer.update("");
        if (balloon.isVisible())
            balloon.hide();
        // Checking if we come from the inbox
        this.comeFromInbox = !Object.isEmpty(args.get('comingFrom')) ? (args.get('comingFrom') == 'inbox') : false;
        // Checking if we come from the time workbench
        this.comeFromWorkbench = !Object.isEmpty(args.get('comingFrom')) ? (args.get('comingFrom') == 'twb') : false;
        if (this.comeFromWorkbench)
            this.twbEmployees = !Object.isEmpty(args.get('twbEmployees')) ? args.get('twbEmployees') : new Array();
        this.retroFutureDates = !Object.isEmpty(args.get('retroDates')) ? args.get('retroDates') : false;
        // Fields depending on employee selections (multiselect)
        this.fieldsDependingOnMulti = new Array();
        //Indicates if the employee selection in the left menu is single (false) / multiple (true).
        this.employeeRestriction = (global.getPopulationName(global.currentApplication) == 'NOPOP') ? false : true;
        // We will show the multiselect if we come from the workbench (but it will be disabled)
        if (!this.employeeRestriction && this.comeFromWorkbench)
            this.employeeRestriction = true;
        // Normal behaviour (coming from a calendar)
        if (!this.comeFromInbox) {
            this._eventStatus = this._getEventStatus(args);
            // Arguments to go back to the time error screen if we come from there
            this.eventCodes = !Object.isEmpty(args.get('eventCodes')) ? args.get('eventCodes'): null;
            // teamCalendar sends a JSON instead a Hash
            if (!Object.isHash(this.eventCodes)) {
                this.eventCodes = new Hash(this.eventCodes);
                this.eventCodes.each(function(eventCode) {
                    this.eventCodes.set(eventCode.key, new Hash(eventCode.value));
                }.bind(this));
            }
            this.TEemployee = !Object.isEmpty(args.get('TEemployee')) ? args.get('TEemployee'): null;
            this.TEeventInformation = !Object.isEmpty(args.get('TEeventInformation')) ? args.get('TEeventInformation'): null;
            this.TEappInformation = !Object.isEmpty(args.get('TEappInformation')) ? args.get('TEappInformation') : null;
            this.TEcontentEvent = !Object.isEmpty(args.get('TEcontentEvent')) ? args.get('TEcontentEvent') : null;
        
            if (!Object.isEmpty(args.get('event')))
                this.getContentEvent = args.get('event');
            else {
                var appId = this.options.appId;
                var date = Date.today().toString('yyyy-MM-dd');
                this.getContentEvent = this._getEmptyEvent(appId, date);
            }
            this.eventId = Object.isEmpty(this.getContentEvent.EWS) ? "" : this.getContentEvent.EWS.o_field_values.yglui_str_wid_record.contents.yglui_str_wid_content['@key_str']; // key_str
            this.eventKey = ""; // rec_key
            this.successfulEvents = false;
            this.recurrenceInfo = null;
            this.advSearch = false;
            this.advSearchId = "";
            // Information about stored searches
            this.storedSearches = new Hash();
            this.selectedSearches = new Array();
            // Current eventCode (like the appId, but not customizable)
            this.eventCode = null;
            //To control is the radio buttons have been changed in the correctDateSelected method
            this.radio_changed = false;

            this._getEvent();
            document.observe('EWS:autocompleterResultSelected_applicationtimeEntryScreen_employeeSelection', this.timeEntryEmployeeSelectionBinding);
            document.observe('EWS:autocompleterResultSelected_applicationtimeEntryScreen_employeeSelected', this.timeEntryEmployeeSelectedBinding);
            document.observe('EWS:autocompleterResultSelected_applicationtimeEntryScreen_employeeUnselected', this.timeEntryEmployeeUnselectedBinding);
            this.eventUploadDoc = document.on('EWS:sendDocumentInfo', this._manageSendDocInfo.bind(this));
            this.eventUploadCov = document.on('EWS:sendCoversheetWA', this._manageSendCovInfo.bind(this));
            this.eventRemoveCov = document.on('EWS:removeCoversheetWA', this._manageRemoveCovInfo.bind(this));
            this.recfpjson = null; //we delete previous information of recurrences in created events        
        }
        // Special behaviour (coming from the inbox)
        else
            this._getRequest(args);
    },
    /**
    *@description Stops timeEntryScreen
    */
    close: function($super) {
        $super();
        this.subApp = 'NONE';
        document.stopObserving('EWS:autocompleterResultSelected_applicationtimeEntryScreen_employeeSelection', this.timeEntryEmployeeSelectionBinding);
        document.stopObserving('EWS:autocompleterResultSelected_applicationtimeEntryScreen_employeeSelected', this.timeEntryEmployeeSelectedBinding);
        document.stopObserving('EWS:autocompleterResultSelected_applicationtimeEntryScreen_employeeUnselected', this.timeEntryEmployeeUnselectedBinding);
        if (!Object.isEmpty(this.eventUploadDoc))
            this.eventUploadDoc.stop();
        if (!Object.isEmpty(this.eventUploadCov))
            this.eventUploadCov.stop();
        if (!Object.isEmpty(this.eventRemoveCov))
            this.eventRemoveCov.stop();
        if (this.advSearch)
            document.stopObserving('EWS:allEmployeesAdded', this.timeEntryLeftMenuAdvSearchBinding);
        if ((this.eventCode == 'ABS') || (this.eventCode == 'ATT'))
            this._setDatePickersObservers(false);
        if (this.fieldPanel)
            this.fieldPanel.destroy();
        if (!this.comeFromInbox)
            global.abortAjaxCalls();
    },
    /**
    *@description Gets information from the previous application and requests additional data if needed
    */
    _getEvent: function() {
        // New event
        this.isNew = Object.isEmpty(this.eventId);
        if (this.isNew) {
            this.employeeId = !Object.isEmpty(this.getContentEvent.PERNR) ? this.getContentEvent.PERNR.value : global.objectId;
            var object = this.employeeRestriction ? "<OBJECT TYPE=''></OBJECT>" : "<OBJECT TYPE='P'>" + this.employeeId + "</OBJECT>";
            this.appId = !Object.isEmpty(this.getContentEvent.APPID) ? this.getContentEvent.APPID.text : this.getContentEvent.get('APPID').text;
            this.eventCode = null;
            var length = this.eventCodes.keys().length;
            for (var i = 0; (i < length) && (Object.isEmpty(this.eventCode)); i++) {
                var codes = this.eventCodes.values()[i].get('appids');
                for (var j = 0; (j < codes.length) && (Object.isEmpty(this.eventCode)); j++) {
                    if (codes[j] == this.appId)
                        this.eventCode = this.eventCodes.keys()[i];
                }
            }
            var xml = "<EWS>" +
                              "<SERVICE>" + this.getContentService + "</SERVICE>" +
                              object +
                              "<PARAM>" +
                                  "<APPID>" + this.appId + "</APPID>" +
                                  "<WID_SCREEN>*</WID_SCREEN>" +
                                  "<OKCODE>NEW</OKCODE>" +
                              "</PARAM>" +
                          "</EWS>";
            this.makeAJAXrequest($H({ xml: xml, successMethod: '_displayNewEvent' }));
        }
        // Existing event
        else
            this._displayEvent();
    },
    /**
    *@description Displays all neccesary fields to create a new event
    *@param {JSON} json Information from GET_CONTENT2 service
    */
    _displayNewEvent: function(json) {
        var structure = json;
        delete(json.EWS.o_field_values.yglui_str_wid_record.contents.yglui_str_wid_content.buttons);
        // Solving problem with screens path
        if (!Object.jsonPathExists(json, 'EWS.o_widget_screens.yglui_str_wid_screen.yglui_str_wid_screen'))
            json.EWS.o_widget_screens.yglui_str_wid_screen = { yglui_str_wid_screen: json.EWS.o_widget_screens.yglui_str_wid_screen };
        // If there are more than one screen, we will use the selected one
        if (Object.isArray(structure.EWS.o_widget_screens.yglui_str_wid_screen.yglui_str_wid_screen)) {
            var screens = objectToArray(structure.EWS.o_widget_screens.yglui_str_wid_screen.yglui_str_wid_screen);
            var selected = -1;
            for (var i = 0; (i < screens.length) && (selected < 0); i++) {
                if (screens[i]['@selected'] == 'X')
                    selected = i;
            }
            structure.EWS.o_field_settings.yglui_str_wid_fs_record = structure.EWS.o_field_settings.yglui_str_wid_fs_record[selected];
            structure.EWS.o_field_values.yglui_str_wid_record = structure.EWS.o_field_values.yglui_str_wid_record[selected];
            structure.EWS.o_widget_screens.yglui_str_wid_screen.yglui_str_wid_screen = structure.EWS.o_widget_screens.yglui_str_wid_screen.yglui_str_wid_screen[selected];
        }
        else {
            if (Object.isEmpty(structure.EWS.o_field_values.yglui_str_wid_record.contents.yglui_str_wid_content['@selected']))
                structure.EWS.o_field_values.yglui_str_wid_record.contents.yglui_str_wid_content['@selected'] = 'X';
        }
        // Setting dates from previous app and writing default hours (if needed)
        var values = objectToArray(structure.EWS.o_field_values.yglui_str_wid_record.contents.yglui_str_wid_content.fields.yglui_str_wid_field);
        // We need to store fieldtechnames from values because they don't come with settings
        this.fieldtechnames = new Hash();
        var begda = !Object.isEmpty(this.getContentEvent.BEGDA) ? this.getContentEvent.BEGDA.value : this.getContentEvent.get('BEGDA').value;
        var endda = !Object.isEmpty(this.getContentEvent.ENDDA) ? this.getContentEvent.ENDDA.value : this.getContentEvent.get('ENDDA').value;
        for (var i = 0; i < values.length; i++) {
            this.fieldtechnames.set(values[i]['@fieldid'], values[i]['@fieldtechname']);
            if (values[i]['@fieldid'].startsWith('M_'))
                this.fieldsDependingOnMulti.push(values[i]['@fieldid']);
            if (values[i]['@fieldtechname'] == 'BEGDA')
                values[i]['@value'] = begda;
            if (values[i]['@fieldtechname'] == 'ENDDA')
                values[i]['@value'] = endda;
        }
        var fields = objectToArray(structure.EWS.o_field_settings.yglui_str_wid_fs_record.fs_fields.yglui_str_wid_fs_field);
        // Fields in the radio group
        this.radioGroup = new Hash();
        this.radioGroupName = "";
        // Radio group for all day (it has no field, so it won't be changed)
        this.alldfGroup = null;
        for (var i = 0; i < fields.length; i++) {
            var fieldtechname = this.fieldtechnames.get(fields[i]['@fieldid']);
            fieldtechname = Object.isEmpty(fieldtechname) ? fields[i]['@fieldid'] : fieldtechname;
            if (fieldtechname == 'BEGDA')
                fields[i]['@default_value'] = begda;
            if (fieldtechname == 'ENDDA')
                fields[i]['@default_value'] = endda;
            if ((fieldtechname == 'BEGUZ') || (fieldtechname == 'ENDUZ'))
                fields[i]['@default_value'] = "00:00:00";
            if (!Object.isEmpty(fields[i]['@display_group']) && !Object.isEmpty(fieldtechname) && fields[i]['@display_group'].include('RADIO')) {
                if (Object.isEmpty(this.radioGroupName))
                    this.radioGroupName = fields[i]['@display_group'].split('_')[1];
                if (Object.isEmpty(this.radioGroup.get(fields[i]['@display_group'])))
                    this.radioGroup.set(fields[i]['@display_group'], new Array());
                this.radioGroup.get(fields[i]['@display_group']).push(fieldtechname);
                if (fieldtechname == 'ALLDF')
                    this.alldfGroup = 'OPT' + fields[i]['@display_group'].substring(fields[i]['@display_group'].indexOf('_'));
            }
            if (fields[i]['@fieldid'] == 'PERNR_ADV')
                this.advSearchId = fields[i]['@sadv_id'];
            //To set the field STDAZ to allow to store 24 hours
            if (fields[i]['@service_values'] == '24')
                fields[i]['@mask'] = 'X';
        }
        // Saving event into a hash
        this.getContentEvent = structure;
        // Inserting fieldPanel
        this.fpjson = deepCopy(this.getContentEvent);
        //Buttons
        var buttonsScreen = objectToArray(this.fpjson.EWS.o_screen_buttons.yglui_str_wid_button);
        this.hashToSaveButtons = $H({});
        var newButtons = new Array();
        var length = buttonsScreen.length;
        for (var i = 0; i < length; i++) {
            if (buttonsScreen[i]['@okcode'] != 'DEL')
                newButtons.push(buttonsScreen[i]);
        }
        this.fpjson.EWS.o_screen_buttons.yglui_str_wid_button = newButtons;
        buttonsScreen = this.fpjson.EWS.o_screen_buttons.yglui_str_wid_button;
        for (var i = 0; i < buttonsScreen.size(); i++) {
            if (buttonsScreen[i]['@okcode'] == 'INS') {
                var functionToExecute = this._showDocumentInformation.bind(this, buttonsScreen[i])
                this.hashToSaveButtons.set(buttonsScreen[i]['@action'], functionToExecute);
            }
            if (buttonsScreen[i]['@action'].include('TEAM')) {
                var functionToExecute = this._toggleTeamCalendar.bind(this, buttonsScreen[i]);
                this.hashToSaveButtons.set(buttonsScreen[i]['@action'], functionToExecute);
            }
            if (buttonsScreen[i]['@action'].include('QUOTA')) {
                var functionToExecute = this._toggleQuotaChecker.bind(this, buttonsScreen[i]);
                this.hashToSaveButtons.set(buttonsScreen[i]['@action'], functionToExecute);
            }
            if (buttonsScreen[i]['@action'].include('SEND')) {
                var functionToExecute = this._showSendDocument.bind(this, buttonsScreen[i]);
                this.hashToSaveButtons.set(buttonsScreen[i]['@action'], functionToExecute);
            }
            if (buttonsScreen[i]['@action'].include('UPL_DOC') || buttonsScreen[i]['@action'].include('UPL_COV')) {
                var functionToExecute = this._showDocumentInformation.bind(this, buttonsScreen[i]);
                this.hashToSaveButtons.set(buttonsScreen[i]['@action'], functionToExecute);
                if (buttonsScreen[i]['@action'].include('UPL_DOC'))
                    this.labelUplDocuments = buttonsScreen[i]['@label_tag'];
                else
                    this.labelCoversheets = buttonsScreen[i]['@label_tag'];
            }
        }
        this.hashToSaveButtons.set('cancel', this._exit.bind(this, null, ""));
        this.hashToSaveButtons.set('paiEvent', this._paiEvent.bind(this));
        var event = this.fpjson.EWS.o_field_values.yglui_str_wid_record.contents.yglui_str_wid_content.fields.yglui_str_wid_field;
        this.eventHash = new Hash();
        for (var i = 0; i < event.length; i++) {
            if (!Object.isEmpty(event[i]['@fieldtechname']) && Object.isEmpty(this.eventHash.get(event[i]['@fieldtechname'])))
                this.eventHash.set(event[i]['@fieldtechname'], event[i]);
            else {
                if (!Object.isEmpty(this.eventHash.get(event[i]['@fieldtechname'])) && (event[i]['@fieldtechname'] == "PERNR")) {
                    this.advSearch = true;
                    document.observe('EWS:allEmployeesAdded', this.timeEntryLeftMenuAdvSearchBinding);
                }
                this.eventHash.set(event[i]['@fieldid'], event[i]);
            }
        }
        // Redefined services
        var selectedEmployee = (this.getSelectedEmployees().keys().length == 1) ? this.getSelectedEmployees().keys()[0] : this.employeeId;
        var redefinedServices = this._getRedefinedServices(selectedEmployee, begda);
        // Fields out of fieldPanel (title and employee selection)
        var title = "<span class='application_main_title2'>" + this._getTitle(structure) + "</span><br /><br />";
        this.appContainer.update(title);
        var employees;
        // Left menu employees
        if (this.employeeRestriction)
            employees = this._buildEmployeeSelectionForm();
        // No left menu employees
        else {
            var color = parseInt(this.getEmployee(global.objectId).color);
            employees = "<div class='application_main_soft_text fieldDisp105Left applicationtimeEntryScreen_employees'>" + global.getLabel('for') + " *" + "</div>" +
                            "<div class='application_color_eeColor" + color + "'>" + this.getEmployee(global.objectId).name + "</div>";
        }
        this.appContainer.insert(employees);
        if (this.advSearch && this.employeeRestriction){
            this.virtualHtml.down('div#applicationtimeEntryScreen_employeeSelection').toggle();
            $('applicationtimeEntryScreen_employeeCount').insert(this.employeeSelectionErrorMessage);
        }
        if (this.comeFromWorkbench && this.advSearch) {
            this.virtualHtml.down('div#applicationtimeEntryScreen_advSearch').hide();
            this.virtualHtml.down('div#applicationtimeEntryScreen_advSearch_icon').hide();
        }
        if (this.employeeRestriction) {
            this.virtualHtml.down('div#applicationtimeEntryScreen_addSelection').observe('click', this._addMySelection.bind(this, true));
            if (this.advSearch)
                this.virtualHtml.down('div#applicationtimeEntryScreen_advSearch').observe('click', this._advSearch.bind(this));
            this._buildMultiselect();
            if (!this.advSearch) {
                var selectedEmployees;
                if (this.comeFromWorkbench) {
                    selectedEmployees = new Array();
                    for (var i = 0, length = this.twbEmployees.length; i < length; i++)
                        selectedEmployees.push(this.twbEmployees[i].objectId);
                }
                else
                    selectedEmployees = this.getSelectedEmployees().keys();
                var length = selectedEmployees.length;
                var data = null;
                for (var i = 0; i < length; i++) {
                    data = new Hash();
                    data.set('data', selectedEmployees[i]);
                    data.set('text', this.getEmployee(selectedEmployees[i]).name);
                    this.multiSelect.createBox(data);
                    this.multiSelect.removeElementJSON(data, false);
                }
            }
            else
                this.virtualHtml.down('span#applicationtimeEntryScreen_employeeCount_text').update("(0)");
        }
        this.fieldPanelDiv = new Element("div", {id: "applicationtimeEntryScreen_fieldPanel" });
        this.appContainer.insert(this.fieldPanelDiv);
        var mode = 'create';
        //We create the new fieldPanel
        this.fieldPanel = new getContentModule({
            mode: mode,
            json: this.fpjson,
            appId: this.appId,
            predefinedXmls: redefinedServices.get('services'),
            getFieldValueAppend: redefinedServices.get('appends'),
            objectId: this.employeeId,
            showCancelButton: true,
            buttonsHandlers: this.hashToSaveButtons,
            cssClasses: $H({fieldDispHalfSize: 'fieldDispQuarterSize', fieldDispGroupDiv: 'applicationtimeEntryScreen_alignGroupDiv', fieldDispClearBoth: 'fieldPanelMarginPrevElmnt', fieldDispLabel: 'fieldDisp105Left', gcm_fieldLabel: 'fieldDisp105LeftDisplay' }),
            linkTypeHandlers: $H({REC_LINK: this._displayRecurrenceWindow.bind(this)}),
            fieldDisplayerModified: 'EWS:datePickerCorrectDate_' + this.appId + '10'
        });
        this.fieldPanelDiv.insert(this.fieldPanel.getHtml());
        
        //Set the retro/future and the payroll dates
        if(this.retroFutureDates)
            this._setRetroFuture(this.fieldPanel);
        
        //Hide the related send document buttons
        var buttonSendDoc = this.fieldPanel.getButton("SCR_SEND_DOCUMENT", null, 1);
        var buttonDocInfo = this.fieldPanel.getButton("SCR_X_UPL_DOC", null, 1);
        var buttonCovInfo = this.fieldPanel.getButton("SCR_X_UPL_COV", null, 1);
        if (!Object.isEmpty(buttonDocInfo) && !Object.isEmpty(buttonSendDoc) && !Object.isEmpty(buttonCovInfo)) {
            buttonDocInfo.hide();
            buttonSendDoc.hide();
            buttonCovInfo.hide();
        }
        // Changing team calendar and quota checker buttons text
        var buttonTeamCal = this.fieldPanel.getButton("SCR_TEAM_CAL", null, 1);
        if(!Object.isEmpty(buttonTeamCal))
            buttonTeamCal.update(global.getLabel("showTeamCal"));
        var buttonQuotaCheck = this.fieldPanel.getButton("SCR_QUOTA_CHECK", null, 1);
        if(!Object.isEmpty(buttonQuotaCheck))
            buttonQuotaCheck.update(global.getLabel("showQuotaCheck"));
        
        // Refreshing fields depending on employee selections
        this._refreshMultiDependentFields();
        this._checkSelectedEmployees(true); //Disable or not the quotaChecker button

        // If recurrence link exists, we put it as an inline element
        if (this.virtualHtml.down('div#linkToHandler') && !global.liteVersion)
            this.virtualHtml.down('div#linkToHandler').up().addClassName('inlineElement');
        else if(this.virtualHtml.down('button#linkToHandler') && global.liteVersion)
            this.virtualHtml.down('button#linkToHandler').up().addClassName('inlineElement fieldDispFloatLeft');
        // Adding handler to dates (ABS/ATT)
        if ((this.eventCode == 'ABS') || (this.eventCode == 'ATT')) {
            this._setDatePickersObservers(true);
            this._correctDateSelected();
        }
    },
    /**
    *@description Displays an existing event
    */
    _displayEvent: function() {
        this.fpjson = deepCopy(this.getContentEvent);
        // Saving event into a hash
        var event = this.fpjson.EWS.o_field_values.yglui_str_wid_record.contents.yglui_str_wid_content.fields.yglui_str_wid_field;
        this.eventHash = new Hash();
        // We need to store fieldtechnames from values because they don't come with settings
        this.fieldtechnames = new Hash();
        for (var i = 0; i < event.length; i++) {
            this.fieldtechnames.set(event[i]['@fieldid'], event[i]['@fieldtechname']);
            if (event[i]['@fieldid'].startsWith('M_'))
                this.fieldsDependingOnMulti.push(event[i]['@fieldid']);
            if (!Object.isEmpty(event[i]['@fieldtechname']))
                this.eventHash.set(event[i]['@fieldtechname'], event[i]);
            else
                this.eventHash.set(event[i]['@fieldid'], event[i]);
        }
        this.appId = this.eventHash.get('APPID')['@value'];
        this.eventCode = null;
        if (!this.comeFromInbox) {
            var length = this.eventCodes.keys().length;
            for (var i = 0; (i < length) && (Object.isEmpty(this.eventCode)); i++) {
                var codes = this.eventCodes.values()[i].get('appids');
                for (var j = 0; (j < codes.length) && (Object.isEmpty(this.eventCode)); j++) {
                    if (codes[j] == this.appId)
                        this.eventCode = this.eventCodes.keys()[i];
                }
            }
        }
        var begda = this.eventHash.get('BEGDA')['@value'];
        // Is the event editable? (calendar event)
        var letter = this.eventHash.get('EDITABLE')['@value'];
        var editable = (letter == 'X') ? true : false;
        var hide_delete = (letter == 'Y') ? true : false;
        var hide_submit = (letter == 'Z') ? true : false;
        var hide_SubAndDel = ((letter == 'W') || (letter == 'R') || (letter == 'F') || (letter == 'D')) ? true : false;
        if (this.eventHash.get('DISPLAY'))
            editable = editable && (this.eventHash.get('DISPLAY')['@value'] != 'X');
        // Getting rec key
        this.eventKey = this.fpjson.EWS.o_field_values.yglui_str_wid_record['@rec_key'];
        // Obtaining employee's id
        this.employeeId = this.eventHash.get('PERNR')['@value'];
        // Fields out of fieldPanel (title and employee)
        var title = "<span class='application_main_title2'>" + this._getTitle(this.fpjson) + "</span><br /><br />";
        this.appContainer.update(title);
        var color;
        if (!this.comeFromInbox) {
            color = parseInt(this.getEmployee(this.employeeId).color);
        color = (color < 10) ? '0' + color : color;
        }
        var employee = "<div class='application_main_soft_text fieldDisp105LeftDisplay";
        if (!editable)
            employee += " applicationtimeEntryScreen_timesheetFor";
        employee += "'>" + global.getLabel('for');
        if (editable && !this.comeFromInbox)
            employee += " *";
        employee += "</div><div";
        if (!this.comeFromInbox)
            employee += " class='application_color_eeColor" + color;
        if (!editable)
            employee += " applicationtimeEntryScreen_timesheetFor";
        var employeeName = this.comeFromInbox ? this.employeeName : this.getEmployee(this.employeeId).name;
        employee += "'>" + employeeName + "</div>";
        this.appContainer.insert(employee);
        this.fieldPanelDiv = new Element("div", {id: "applicationtimeEntryScreen_fieldPanel" });
        this.appContainer.insert(this.fieldPanelDiv);
        // Redefined services
        var selectedEmployee = this.eventHash.get('PERNR')['@value'];
        var redefinedServices = this._getRedefinedServices(selectedEmployee, begda);
        var mode = 'edit';
        if (!editable || this.comeFromInbox)
            mode = 'display';
        // Getting radio group
        this.radioGroup = new Hash();
        this.radioGroupName = "";
        // Radio group for all day (it has no field, so it won't be changed)
        this.alldfGroup = null;
        var fields = objectToArray(this.fpjson.EWS.o_field_settings.yglui_str_wid_fs_record.fs_fields.yglui_str_wid_fs_field);
        for (var i = 0; i < fields.length; i++) {
            var fieldtechname = this.fieldtechnames.get(fields[i]['@fieldid']);
            fieldtechname = Object.isEmpty(fieldtechname) ? fields[i]['@fieldid'] : fieldtechname;
            if (!Object.isEmpty(fields[i]['@display_group']) && !Object.isEmpty(fieldtechname) && fields[i]['@display_group'].include('RADIO')) {
                if (Object.isEmpty(this.radioGroupName))
                    this.radioGroupName = fields[i]['@display_group'].split('_')[1];
                if (Object.isEmpty(this.radioGroup.get(fields[i]['@display_group'])))
                    this.radioGroup.set(fields[i]['@display_group'], new Array());
                this.radioGroup.get(fields[i]['@display_group']).push(fieldtechname);
                if (fieldtechname == 'ALLDF')
                    this.alldfGroup = 'OPT' + fields[i]['@display_group'].substring(fields[i]['@display_group'].indexOf('_'));
            }
            if (fieldtechname == 'REC_LINK')
                fields[i]['@display_attrib'] = 'HID';
            //To set the field STDAZ to allow to store 24 hours
            if (fields[i]['@service_values'] == '24')
                fields[i]['@mask'] = 'X'; 
        }
        // Buttons
        this.hashToSaveButtons = $H({});
        if (this.fpjson.EWS.o_screen_buttons) {
            var buttonsScreen = this.fpjson.EWS.o_screen_buttons.yglui_str_wid_button;
            objectToArray(buttonsScreen).each( function(pair) {
                var functionToExecute;
                if ((pair['@okcode'] == 'INS') || (pair['@okcode'] == 'MOD'))
                    functionToExecute = this._eventAction.bind(this, pair['@action'], pair['@okcode'], pair['@type'], pair['@label_tag']);
                if (pair['@okcode'] == 'DEL')
                    functionToExecute = this._confirmationMessage.bind(this, pair['@action'], pair['@okcode'], pair['@type'], pair['@label_tag']);
                if (pair['@action'].include('TEAM'))
                    functionToExecute = this._toggleTeamCalendar.bind(this, pair);
                if (pair['@action'].include('QUOTA'))
                    functionToExecute = this._toggleQuotaChecker.bind(this, pair);
                if (pair['@action'].include('SEND'))
                    functionToExecute = this._showSendDocument.bind(this, pair);
                if (pair['@action'].include('UPL_DOC') || pair['@action'].include('UPL_COV')) {
                    functionToExecute = this._showDocumentInformation.bind(this, pair);
                    if (pair['@action'].include('UPL_DOC'))
                        this.labelUplDocuments = pair['@label_tag'];
                    else
                        this.labelCoversheets = pair['@label_tag'];
                }
                this.hashToSaveButtons.set(pair['@action'], functionToExecute);
            }.bind(this));
            this.hashToSaveButtons.set('paiEvent', this._paiEvent.bind(this));
        }
        var showCancel;
        if (!this.comeFromInbox) {
            showCancel = true;
            this.hashToSaveButtons.set('cancel',this._exit.bind(this, null, ""));
        }
        else
            showCancel = false;
        
        //Regular expression to check if the status is between 30 and 3Z
        var pattern = /3[0-9A-Z]/;
        //Deleting the submit button
        if ((Object.isEmpty(this._eventStatus) || pattern.match(this._eventStatus)) && !this.comeFromInbox)
            this._removeButton(this.fpjson, 'MOD');
        // Deleting the delete button
        if (hide_delete || hide_SubAndDel)
            this._removeButton(this.fpjson, 'DEL');
        //Setting in the changeButton method the showIndisplay attribute in the button to true.
        //Because if we change the showButtons{ display = false} the submit and delete button are hidden
        if( hide_submit || hide_SubAndDel)
            this._changeButton(this.fpjson, 'DEL');    
        // We create the new fieldPanel
        if (mode == 'display'){
            this.fieldPanel = new getContentModule({ 
                mode: mode, 
                json: this.fpjson, 
                appId: this.appId, 
                predefinedXmls: redefinedServices.get('services'),
                getFieldValueAppend: redefinedServices.get('appends'),
                objectId: this.employeeId,
                showCancelButton: showCancel,
                showButtons: $H({
                    edit: false,
                    display: !hide_SubAndDel ? !hide_submit : false,
                    create: false
                }),
                buttonsHandlers: this.hashToSaveButtons,
                cssClasses: $H({fieldDispHalfSize: 'fieldDispQuarterSize', fieldDispGroupDiv: 'applicationtimeEntryScreen_alignGroupDiv', fieldDispClearBoth: 'fieldPanelMarginPrevElmnt', fieldDispLabel: 'fieldDisp105Left', gcm_fieldLabel: 'fieldDisp105LeftDisplay' }),
                fieldDisplayerModified: 'EWS:datePickerCorrectDate_' + this.appId + '10'
            });
        }
        else {
            this.fieldPanel = new getContentModule({ 
                mode: mode, 
                json: this.fpjson, 
                appId: this.appId, 
                predefinedXmls: redefinedServices.get('services'),
                getFieldValueAppend: redefinedServices.get('appends'),
                objectId: this.employeeId,
                showCancelButton: true,
                buttonsHandlers: this.hashToSaveButtons,
                cssClasses: $H({fieldDispHalfSize: 'fieldDispQuarterSize', fieldDispGroupDiv: 'applicationtimeEntryScreen_alignGroupDiv', fieldDispClearBoth: 'fieldPanelMarginPrevElmnt', fieldDispLabel: 'fieldDisp105Left', gcm_fieldLabel: 'fieldDisp105LeftDisplay' }),
                fieldDisplayerModified: 'EWS:datePickerCorrectDate_' + this.appId + '10'
            });
        }
        this.fieldPanelDiv.insert(this.fieldPanel.getHtml());
        
        //Set the retro/future and the payroll dates
        if(this.retroFutureDates && (editable || hide_delete))
            this._setRetroFuture(this.fieldPanel);
        
        //Hide the related send document buttons
        var buttonSendDoc = this.fieldPanel.getButton("SCR_SEND_DOCUMENT", null, 1);
        var buttonDocInfo = this.fieldPanel.getButton("SCR_X_UPL_DOC", null, 1);
        var buttonCovInfo = this.fieldPanel.getButton("SCR_X_UPL_COV", null, 1);
        //If come from Inbox always we show the "X document uploaded"
        if (this.comeFromInbox)
            this.sendDocCapability = true;
        //Manage the related send document buttons
        if (this.sendDocCapability && (this.eventCodes.get('ABS').get('appids').include(this.fieldPanel.appId) || this.eventCodes.get('ATT').get('appids').include(this.fieldPanel.appId)))
            this._manageDocButtons(this.fieldPanel.json);
        if (!Object.isEmpty(buttonDocInfo) && !Object.isEmpty(buttonSendDoc) && !Object.isEmpty(buttonCovInfo)) {
            buttonDocInfo.hide();
            buttonSendDoc.hide();
            buttonCovInfo.hide();
        }
        // Changing team calendar and quota checker buttons' text
        var buttonTeamCal = this.fieldPanel.getButton("SCR_TEAM_CAL", null, 1);
        if(!Object.isEmpty(buttonTeamCal))
            buttonTeamCal.update(global.getLabel("showTeamCal"));
        var buttonQuotaCheck = this.fieldPanel.getButton("SCR_QUOTA_CHECK", null, 1);
        if(!Object.isEmpty(buttonQuotaCheck))
            buttonQuotaCheck.update(global.getLabel("showQuotaCheck"));
        if (mode == 'display')
            this.fieldPanelDiv.down().addClassName('applicationtimeEntryScreen_fieldPanelNoMargin');
        // Adding handler to dates (ABS/ATT)
        if ((this.fieldPanel.appId == 'ABS') || (this.fieldPanel.appId == 'ATT')) {
            this._setDatePickersObservers(true);
            this._correctDateSelected();
            //If come from inbox or aproved event
            if (this.comeFromInbox || Object.isEmpty(this._eventStatus) || this._eventStatus == '21')
                this._manageDocButtons(this.fieldPanel.json);
            else //if not come from Inbox  or the event isn't aproved we will force the PAI call to check if the "Type" has send document capability
                this._paiEvent.bind(this,{servicePai : 'SEND_DOCU_PAI'}).defer();
        }
        //Including the message when the payroll is running or the date event selected is before/after the retro/future dates
        if (hide_SubAndDel) {
            var RFlabel = "";
            switch(letter){
                case 'W':
                    RFlabel = global.getLabel('AnyActions') + (' ') + global.getLabel('duePayroll');
                    break;
                case 'R':
                    RFlabel = global.getLabel('DATE_MSG_RETRO_EARLY') + (' ') + global.getLabel('NO_ACTION');
                    break;
                case 'F':
                    RFlabel = global.getLabel('DATE_MSG_FUTURE_LATER') + (' ') + global.getLabel('NO_ACTION');
                    break;
                case 'D':
                    RFlabel = global.getLabel('AnyActions') + (' ') + global.getLabel('dueDelegations');
                    break;
            }
            $('fieldErrorMessage_' + this.appId).update(RFlabel);
        }
    },
    /**
    *@description Gets the title from the event (new or existing one)
    *@param {JSON} json Information from GET_CONTENT2 service
    *@returns {String} title
    */
    _getTitle: function(json) {
        var titleCode = json.EWS.o_widget_screens.yglui_str_wid_screen.yglui_str_wid_screen['@label_tag'];
        var title = titleCode;
        var labels;
        if (Object.jsonPathExists(json, 'EWS.labels.item')) {
            labels = json.EWS.labels.item;
            for (var i = 0; (i < labels.length) && (title == titleCode); i++) {
                if (labels[i]['@id'].toLowerCase() == titleCode.toLowerCase())
                    title = labels[i]['@value'];
            }
        }
        return title;
    },
    /**
    *@description Adds selected employees from left menu to create a new event
    *@param {Boolean} fireEvent Tells whether it is necessary to fire the employee selection event (fired by default)
    */
    _addMySelection: function(fireEvent) {
        if (Object.isEmpty(fireEvent))
            fireEvent = true;
        var previousSelected = this.multiSelect.selectedElements;
        for (var i = 0; i < previousSelected.length; i++)
            this.multiSelect.insertElementJSON(previousSelected[i]);
        var boxes = document.body.select('.multiSelect_item');
        if (boxes.length != 0) {
            for (var i = 0; i < boxes.length; i++)
                boxes[i].remove();
        }
        this.multiSelect.selectedElements.clear();
        var selected;
        if (this.comeFromWorkbench) {
            selected = new Hash();
            for (var i = 0, length = this.twbEmployees.length; i < length; i++) {
                var info = { name: this.twbEmployees[i].name, oType: 'P' }
                selected.set(this.twbEmployees[i].objectId, info);
            }
        }
        else
            selected = this.getSelectedEmployees();
        var authorized = 0;     //counter for employees which creating events is authorized for       
        var errorMessageShown = false;       
        selected.each( function(employee) {
            if (employee.value.oType == "P") {
                authorized++;
                var data = new Hash();
                data.set('data', employee.key);
                data.set('text', employee.value.name);
                this.multiSelect.createBox(data);
                this.multiSelect.removeElementJSON(data, false);
            }
            else if (!errorMessageShown) {
                this.employeeSelectionErrorMessage.show();
                errorMessageShown = true;
            }
        }.bind(this));
        if (!errorMessageShown && !Object.isEmpty(this.employeeSelectionErrorMessage))
            this.employeeSelectionErrorMessage.hide();
        if (this.advSearch)
            this.virtualHtml.down('span#applicationtimeEntryScreen_employeeCount_text').update("(" + authorized + ")");
        if (this.comeFromWorkbench)
            this.multiSelect.disable();
        if (fireEvent)
            document.fire('EWS:autocompleterResultSelected_applicationtimeEntryScreen_employeeSelection');
    },
    /**
    *@description Shows the Team Calendar
    *@param {Hash} button Action button
    */
    _toggleTeamCalendar: function(button) {
        // Screen buttons info
        var buttonTeamCal = this.fieldPanel.getButton("SCR_TEAM_CAL", null, 1);
        var buttonQuotaCheck = this.fieldPanel.getButton("SCR_QUOTA_CHECK", null, 1);
        var buttonSendDoc = this.fieldPanel.getButton("SCR_SEND_DOCUMENT", null, 1);
        var textTeamCal, textQuotaCheck, textSendDoc;
        // Checking subapplication
        if (this.subApp != "TEAM" ) {
            var begda = this.eventHash.get('BEGDA')['@value'];
            var keepSubOpened = false;
            if (this.comeFromInbox) {
                keepSubOpened = true;
                if (!Object.isEmpty(global.currentSubSubApplication))
                    global.closeSubSubApplication();
            }
            if (!this.comeFromInbox && !Object.isEmpty(global.currentSubApplication))
                global.closeSubApplication();
            global.open( $H({
                app: {
                    appId: button['@tarap'],
                    tabId: "SUBAPP",
                    view: button['@views']
                },
                createEvents: false,
                date: begda,
                keepSubOpened: keepSubOpened
            }));
            this.subApp = "TEAM";
            textTeamCal = global.getLabel("hideTeamCal");
            textQuotaCheck = global.getLabel("showQuotaCheck");
            textSendDoc = global.getLabel("ST_DOC");
        }
        else {
            if (!this.comeFromInbox)
                global.closeSubApplication();
            else
                global.closeSubSubApplication();
            this.subApp = "NONE";
            textTeamCal = global.getLabel("showTeamCal");
            textQuotaCheck = global.getLabel("showQuotaCheck");
            textSendDoc = global.getLabel("ST_DOC");
        }
        if (buttonQuotaCheck)
            buttonQuotaCheck.update(textQuotaCheck);
        if (buttonTeamCal)    
            buttonTeamCal.update(textTeamCal);
        if (buttonSendDoc)
            buttonSendDoc.update(textSendDoc);
        // Set the button show/hide team Calendar and show/hide Quota Checker to the fieldPanel
        var buttons = objectToArray(this.fpjson.EWS.o_screen_buttons.yglui_str_wid_button);
        for (var i = 0, length = buttons.length; i < length; i++) {
            if (buttons[i]['@action'] == 'SCR_TEAM_CAL')
                buttons[i]['@label_tag'] = textTeamCal;
            else if (buttons[i]['@action'] == 'SCR_QUOTA_CHECK')
                buttons[i]['@label_tag'] = textQuotaCheck;
        }
    },
    /**
    *@description Exits the application and open the previous one
    *@param {JSON} json Information from SAVE_EVENTS service
    *@param {Hash} ID Request ID
    */
    _exit: function(json, ID) {
        //automated refresh the view-appId-screen
        if (json) {
            if (!Object.isEmpty(json.EWS.o_affected_views)) {     
                var affectedV = objectToArray(json.EWS.o_affected_views.yglui_tab_cfresh);
                var refreshArray = new Array();
                var employees = this._getEmployeeSelection();
                for (var j = 0; j<employees.length; j++){
                        var empId = employees[j].get('data');
                    for (var i = 0; i<affectedV.length; i++)
                        refreshArray.push({view: affectedV[i]['@refreshv'], appid: affectedV[i]['@refresha'], screen: affectedV[i]['@refreshs']});
                    global.setScreenToReload(refreshArray, { objectId: empId, objectType:"P" });
                }
            }
        }
        // Submit button
        if (!Object.isEmpty(ID)) {
            this.loadingBar.drawSuccess();
            this.submitStatus.set(json.EWS.o_req_head['@objid'], "");
            var length = parseInt(ID.length);
            var currentLength = this.submitStatus.keys().length;
            // Final request
            if (currentLength >= length)
                this._showCreationStatus.bind(this).delay(1);
        }
        // Exit button
        else {
            if (this.successfulEvents) {
                document.fire('EWS:refreshTimesheet');
                document.fire('EWS:refreshCalendars');
            }
            global.open( $H({
                app: {
                    tabId: global.previousApplication.tabId,
                    appId: global.previousApplication.appId,
                    view: global.previousApplication.view
                }
            }));
        }
    },
    /**
    *@description Exits the application and open the previous one, showing an error message
    *@param {JSON} json Information from SAVE_EVENTS service
    *@param {Hash} ID Request ID
    */
    _exitError: function(json, ID) {
        if (!Object.isEmpty(ID)) {
            this.loadingBar.drawFailure();
            var messages = this._getErrorMessages(json);
            this.submitStatus.set(json.EWS.o_req_head['@objid'], messages);
            var length = parseInt(ID.length);
            var currentLength = this.submitStatus.keys().length;
            // Final request
            if (currentLength >= length)
                this._showCreationStatus.bind(this).delay(1);
        }
    },
    /**
    *@description Exits the application and open the previous one, showing an information message
    *@param {JSON} json Information from SAVE_EVENTS service
    *@param {Hash} ID Request ID
    */
    _exitInfo: function(json, ID) {
        this._infoMethod(json);
        this._exit(json, ID);
    },
    /**
    *@description Creates, modifies or removes an event or a fast entry
    *@param {String} action Requested action
    *@param {String} okcode Ok Code
    *@param {String} type Type
    *@param {String} label Label
    */
    _eventAction: function(action, okcode, type, label) {
        // fieldPanel validation
        var fpvalidation = this.fieldPanel.validateForm();
        var correctfp = fpvalidation.correctForm;
        // Employees validation
        var employees = this._getEmployeeSelection();
        var correctemp = (employees.length == 0) ? false : true;
        if (!correctemp && !this.virtualHtml.down('div#applicationtimeEntryScreen_employeeSelectionContainer').hasClassName('applicationtimeEntryScreen_fieldError'))
            this.virtualHtml.down('div#applicationtimeEntryScreen_employeeSelectionContainer').addClassName('applicationtimeEntryScreen_fieldError');
        if (correctfp && correctemp) {
            // Looking for a radio group
            // 0 = no radio group, other = selected row in radio group
            var fields = this.eventHash.keys();
            var radiogroup = null;
            for (var i = (fields.length - 1); (i >= 0) && (Object.isEmpty(radiogroup)) ; i--) {
                if (fields[i].include("OPT_")) {
                    var radiofield = this.eventHash.get(fields[i]);
                    if (radiofield['@value'] == 'X')
                        radiogroup = fields[i];
                }
            }
            // Changing selected element in the radio group if BEGDA != ENDDA
            var begda = this.eventHash.get('BEGDA')['@value'];
            var endda = this.eventHash.get('ENDDA') ? this.eventHash.get('ENDDA')['@value'] : begda;
            if ((begda != endda) && (radiogroup != this.alldfGroup) && (this.recurrenceInfo == null)) {
                this.eventHash.get(radiogroup)['@value'] = '';
                this.eventHash.get(this.alldfGroup)['@value'] = 'X';
                radiogroup = this.alldfGroup;
            }
            // Setting endda = begda for OVT
            if ((this.eventCode == 'OVT') && (begda != endda))
                this.eventHash.get('ENDDA')['@value'] = begda;
            // If there is a selected radio button, we don't have to send other radio buttons' info
            // (so we store those radio buttons)
            var fieldsradiogroup = new Array();
            if (!Object.isEmpty(radiogroup)) {
                radiogroup = 'RADIO' + radiogroup.substring(radiogroup.indexOf('_'));
                this.radioGroup.each( function(radio) {
                    if (radio.key != radiogroup) {
                        for (var i = 0; i < radio.value.length; i++)
                            fieldsradiogroup.push(radio.value[i]);
                    }
                }.bind(this));
            }
            var parameters = "";
            this.eventHash.each( function(field) {
                var fieldid = field.value['@fieldid'];
                var fieldtech = Object.isEmpty(field.value['@fieldtechname']) ? "" : field.value['@fieldtechname'];
                var fieldname = Object.isEmpty(fieldtech) ? fieldid : fieldtech;
                if ((fieldname == "REC_TEXT") && !Object.isEmpty(field.value['@value']))
                    field.value['@value'] = this._toHtmlCode(field.value['@value']);
                // ALLDF will be filled with OPT_G01_1 info
                // PERNR will be filled later (for each employee selected)
                if ((fieldname != 'ALLDF') && (fieldname != 'PERNR')) {
                    if (!fieldname.include('OPT_')) {
                        // Needed field's info
                        if (fieldsradiogroup.indexOf(fieldname) < 0) {
                            // We need to fill APPID field manually
                            var fieldvalue = (fieldname == 'APPID') ? this.appId : Object.isEmpty(field.value['@value']) ? "" : field.value['@value'];
                            if ((fieldname != 'KOSTL') || ((fieldname == 'KOSTL') && (!Object.isEmpty(fieldvalue)))) {
                                var fieldtext = Object.isEmpty(field.value['#text']) ? "" : field.value['#text'];
                                parameters += "<yglui_str_wid_field fieldid='" + fieldid + "' fieldlabel='' fieldtechname='" + fieldtech + "' fieldtseqnr='000000' value='" + fieldvalue + "'>" + fieldtext.escapeHTML() + "</yglui_str_wid_field>";
                            }
                        }
                        // Not needed field's info (unselected radio buttons' fields)
                        else
                            parameters += "<yglui_str_wid_field fieldid='" + fieldid + "' fieldlabel='' fieldtechname='" + fieldtech + "' fieldtseqnr='000000' value=''></yglui_str_wid_field>";
                    }
                    else {
                        if (fieldname == this.alldfGroup) {
                            var fieldvalue = Object.isEmpty(field.value['@value']) ? "" : field.value['@value'];
                            parameters += "<yglui_str_wid_field fieldid='ALLDF' fieldlabel='' fieldtechname='ALLDF' fieldtseqnr='000000' value='" + fieldvalue + "'></yglui_str_wid_field>";
                        }                            
                    }
                }
            }.bind(this));
            var service = Object.isEmpty(this.recurrenceInfo) ? this.saveEventsService : this.saveRecEventsService;
            // REQUESTS
            var length = employees.length;
            var recurrence = "";
            if (!Object.isEmpty(this.recurrenceInfo)) {
                recurrence += "<o_recurrence endda='" + this.recurrenceInfo.get('endda') + "' nrday='" + this.recurrenceInfo.get('nrday') + "' " +
                              "nrocc='" + this.recurrenceInfo.get('nrocc') + "' nrweek_month='" + this.recurrenceInfo.get('nrweek_month') + "' " +
                              "range_start='" + this.recurrenceInfo.get('range_start') + "' dtype='" + this.recurrenceInfo.get('dtype') + "'>";
                var days = this.recurrenceInfo.get('selected_days');
                var mon = days.include('mon') ? 'X' : '';
                var tue = days.include('tue') ? 'X' : '';
                var wed = days.include('wed') ? 'X' : '';
                var thu = days.include('thu') ? 'X' : '';
                var fri = days.include('fri') ? 'X' : '';
                var sat = days.include('sat') ? 'X' : '';
                var sun = days.include('sun') ? 'X' : '';
                recurrence += "<selected_days mon='" + mon + "' tue='" + tue + "' wed='" + wed + "' thu='" + thu + "' " +
                              "fri='" + fri + "' sat='" + sat + "' sun='" + sun + "' />";
                recurrence += "</o_recurrence>";
            }
            // Normal entries
            if (!this.advSearch || (this.advSearch && (this.selectedSearches.length == 0) && (length <= this.maxEmpSelected))) {
                // Progress bar
                var message = global.getLabel('progress') +
                              "<div id='applicationtimeEntryScreen_loadingBar'></div>";
                var contentHTML = new Element('div');
                contentHTML.insert(message);
                var buttonsJson = {
                    elements: [],
                    mainClass: 'moduleInfoPopUp_stdButton_div_right'
                };
                this.loadingPopUp = new infoPopUp ({
                    htmlContent : contentHTML,
                    indicatorIcon : 'void',                    
                    width: 430,
                    showCloseButton: false
                });
                this.loadingPopUp.create();
                this.loadingBar = new ProgressBar ({
                                      target: "applicationtimeEntryScreen_loadingBar",
                                      cellsNumber: employees.length
                                  });
                for (var i = 0; i < length; i++) {
                    var employeeId = employees[i].get('data');
                    var employeeName = unescape(employees[i].get('text'));
                    var employeeParameters = "<yglui_str_wid_field fieldid='PERNR' fieldlabel='' fieldtechname='PERNR' fieldtseqnr='000000' value='" + employeeId + "'>" + employeeName + "</yglui_str_wid_field>";
                    //If we are in the send document scenario, we need to send the docIds to backend
                    if (this.sendDocCapability && (this.eventCodes.get('ABS').get('appids').include(this.fieldPanel.appId) || this.eventCodes.get('ATT').get('appids').include(this.fieldPanel.appId))) {
                        var docIdString = "";
                        for (var j = 0; j < this.sendDocumentInfo.length; j++)
                            docIdString += "<YGLUI_STR_ECM_CONTENT_ID CONTENT_ID= '" + this.sendDocumentInfo[j] + "' />";
                        var trackIdString = "";
                        for (var j = 0; j < this.coversheetIds.length; j++)
                            trackIdString += "<YGLUI_STR_ECM_TRACKING_ID TRACK_ID= '" + this.coversheetIds[j] + "' />";
                        var xml = "<EWS>" +
                                      "<SERVICE>" + service + "</SERVICE>" +
                                      "<OBJECT TYPE='P'>" + employeeId + "</OBJECT>" +
                                      "<PARAM>" +
                                          "<REQ_ID></REQ_ID>" +
                                          "<APPID>" + this.appId + "</APPID>" +
                                          "<RECORDS>" +
                                              "<yglui_str_wid_record rec_key='" + this.eventKey + "' screen='1'>" +
                                                  "<contents>" +
                                                      "<yglui_str_wid_content key_str='" + this.eventId + "' rec_index='1' selected='X' tcontents=''>" +
                                                          "<fields>" + employeeParameters + parameters + "</fields>" +
                                                      "</yglui_str_wid_content>" +
                                                  "</contents>" +
                                              "</yglui_str_wid_record>" +
                                          "</RECORDS>" +
                                          "<BUTTON ACTION='" + action + "' DISMA='' LABEL_TAG='" + label + "' OKCODE='" + okcode + "' SCREEN='' TARAP='' TARTY='' TYPE='" + type + "' />" +
                                          recurrence + 
                                          "<REQ_ID_OBSOLETE>" + this.eventId + "</REQ_ID_OBSOLETE>" +
                                          "<I_DOC_LIST>" + docIdString + "</I_DOC_LIST>" +
                                          "<I_DOC_COVER>" + trackIdString + "</I_DOC_COVER>" +
                                      "</PARAM>" +
                                  "</EWS>";
                    }
                    else{
                        var xml = "<EWS>" +
                                      "<SERVICE>" + service + "</SERVICE>" +
                                      "<OBJECT TYPE='P'>" + employeeId + "</OBJECT>" +
                                      "<PARAM>" +
                                          "<REQ_ID></REQ_ID>" +
                                          "<APPID>" + this.appId + "</APPID>" +
                                          "<RECORDS>" +
                                              "<yglui_str_wid_record rec_key='" + this.eventKey + "' screen='1'>" +
                                                  "<contents>" +
                                                      "<yglui_str_wid_content key_str='" + this.eventId + "' rec_index='1' selected='X' tcontents=''>" +
                                                          "<fields>" + employeeParameters + parameters + "</fields>" +
                                                      "</yglui_str_wid_content>" +
                                                  "</contents>" +
                                              "</yglui_str_wid_record>" +
                                          "</RECORDS>" +
                                          "<BUTTON ACTION='" + action + "' DISMA='' LABEL_TAG='" + label + "' OKCODE='" + okcode + "' SCREEN='' TARAP='' TARTY='' TYPE='" + type + "' />" +
                                          recurrence + 
                                      "</PARAM>" +
                                  "</EWS>";
                    }
                    this.makeAJAXrequest($H({ xml: xml, successMethod: '_exit', failureMethod: '_exitError', errorMethod: '_exitError', informationMethod: '_exitInfo', ajaxID: { length: length, action: action } }));
                }
            }
            // Fast entries (only new events)
            else {
                var employeeSelection = "";
                for (var i = 0; i < length; i++) {
                    if (this.selectedSearches.indexOf(employees[i].get('data')) < 0)
                        employeeSelection += "<YGLUI_STR_HROBJECT OTYPE='P' OBJID='" + employees[i].get('data') + "' />";
                }
                var searchSelection = "";
                var length2 = this.selectedSearches.length;
                for (var i = 0; i < length2; i++) {
                    var search = this.storedSearches.get(this.selectedSearches[i]);
                    searchSelection += "<item cdate='" + search['@cdate'] + "' ctime='" + search['@ctime'] + "' sadv_id='" + search['@sadv_id'] + "' " +
                                       "screen='" + search['@screen'] + "' seqnr='" + search['@seqnr'] + "'>" + search['#text'] + "</item>";
                }
                var xml = "<EWS>" +
                              "<SERVICE>" + this.fastEntryService + "</SERVICE>" +
                              "<OBJECT TYPE='P'>" + global.objectId + "</OBJECT>" +
                              "<PARAM>" +
                                  "<APPID>" + this.appId + "</APPID>" +
                                  "<RECORDS>" +
                                      "<yglui_str_wid_record rec_key='' screen='1'>" +
                                          "<contents>" +
                                              "<yglui_str_wid_content key_str='' rec_index='1' selected='X' tcontents=''>" +
                                                  "<fields>" + parameters + "</fields>" +
                                              "</yglui_str_wid_content>" +
                                          "</contents>" +
                                      "</yglui_str_wid_record>" +
                                  "</RECORDS>" +
                                  "<BUTTON ACTION='" + action + "' DISMA='' LABEL_TAG='" + label + "' OKCODE='" + okcode + "' SCREEN='' TARAP='' TARTY='' TYPE='" + type + "' />" +
                                  recurrence +
                                  "<I_BACKGR>X</I_BACKGR>" +
                                  "<I_FILTER_LST>" + searchSelection + "</I_FILTER_LST>" +
                                  "<I_OBJECT_LST>" + employeeSelection + "</I_OBJECT_LST>" +
                                  "<I_SERVICE>" + service + "</I_SERVICE>" +
                              "</PARAM>" +
                          "</EWS>";
                this.makeAJAXrequest($H({ xml: xml, successMethod: '_exit' }));
            }
        }
        else {
            if (!correctemp)
                this.virtualHtml.down('div#fieldErrorMessage_' + this.appId).update(global.getLabel("selectEmp"));
        }
    },
    /**
    *@description: it parses a string and converts it to html code
    *@param string: the string we are going to parse
    *@return it returns the parsed string
    */
    _toHtmlCode: function(string){       
        var array = string.toArray();
        string = "";
        for(var i=0;i < array.size();i++){
            if(array[i] == "'"){
                array[i] = "&apos;";
            }
            string += array[i];
        }        
        return string;
    },
    /**
    *@description Shows event creation log
    */
    _showCreationStatus: function() {
        this.loadingPopUp.close();
        delete this.loadingPopUp;
        delete this.loadingbar;
        var message = "";
        var completedHtml = "";         //html code to create the table for completed requests without any kind of errors or warnings
        var errorMessages = 0;
        var requests = this.submitStatus.keys().length;
        var createdEvents = false;
        this.submitStatus.each(function(event) {
            if (!Object.isEmpty(event.value)) {
                var length = event.value.length;
                for (var i = 0; i < length; i++) {
                    var text = event.value[i].substring(0,(event.value[i].length - 1));
                    var type = event.value[i].substring(event.value[i].length - 1);
                    var employeeName = this.getEmployee(event.key).name;      
                    var employeeNameTitle = Object.isEmpty(employeeName) ? '' : employeeName.gsub("'","&#39");                                  
                    message += "<tr><td><span class='applicationtimeEntryScreen_errorTable_employeeColumn' title='" + employeeNameTitle + "'>" + employeeName + "</span></td>";
                    message += "<td><span class='applicationtimeEntryScreen_errorTable_textColumn' title='" + text.gsub("'","&#39") + "'>" + text + "</span></td>";
                    message += "<td><div class='applicationtimeEntryScreen_errorTable_iconText'>" + type + "</div>";
                    switch (type) {
                        // Sometimes there are created events, although there was an error (recurrent events)
                        case 'S':
                            message += "<div class='application_icon_green applicationtimeEntryScreen_errorTable_iconDiv' title='" + global.getLabel('completed') + "'></div>";
                            createdEvents = true;
                            break;
                        case 'E':
                            message += "<div class='application_icon_red applicationtimeEntryScreen_errorTable_iconDiv' title='" + global.getLabel('error') + "'></div>";
                            errorMessages++;
                            break;
                        case 'I':
                            message += "<div class='application_icon_orange applicationtimeEntryScreen_errorTable_iconDiv' title='" + global.getLabel('warning') + "'></div>";
                            errorMessages++;
                            break;
                        default:
                            errorMessages++;
                            break;
                    }
                    message += "</td></tr>";
                }
            }
            else {
                var employeeName;
                if (this.comeFromWorkbench) {
                    for (var i = 0, length = this.twbEmployees.length; (i < length) && Object.isEmpty(employeeName); i++) {
                        if (this.twbEmployees[i].objectId == event.key)
                            employeeName = this.twbEmployees[i].name;
                    }
                }   
                else
                    employeeName = this.getEmployee(event.key).name;
                completedHtml += "<tr>";
                    completedHtml += "<td><span class='applicationtimeEntryScreen_errorTable_employeeColumn' title='" + employeeName.gsub("'","&#39") + "'>" + employeeName + "</span></td>";                       
                    completedHtml += "<td><span class='applicationtimeEntryScreen_errorTable_textColumn' title='" + global.getLabel("submitDone") + "'>" + global.getLabel("submitDone") + "</span></td>";
                    completedHtml += "<td><div class='applicationtimeEntryScreen_errorTable_iconText'>S</div>";
                        completedHtml += "<div class='application_icon_green applicationtimeEntryScreen_errorTable_iconDiv' title='" + global.getLabel('completed') + "'></div></td>";
                completedHtml += "</tr>";
                    
            }
        }.bind(this));
        // Status message
        if (errorMessages > 0) {
            // There was successful requests
            if ((requests - errorMessages) > 0) {
                this.successfulEvents = true;
                this.virtualHtml.down('div#applicationtimeEntryScreen_employeeSelection').update("");
                this.multiSelect = new MultiSelect('applicationtimeEntryScreen_employeeSelection', {
                    autocompleter: {
                        showEverythingOnButtonClick: false,
                        timeout: 5000,
                        templateResult: '#{text}',
                        minChars: 1
                    },
                    events: $H({onResultSelected: 'EWS:autocompleterResultSelected_applicationtimeEntryScreen_employeeSelected',
                                onRemoveBox: 'EWS:autocompleterResultSelected_applicationtimeEntryScreen_employeeUnselected'})
                }, this.jsonMultiselect);
                this.submitStatus.each(function(event) {
                    if (!Object.isEmpty(event.value)) {
                        var data = new Hash();
                        data.set('data', event.key);
                        data.set('text', this.getEmployee(event.key).name);
                        this.multiSelect.createBox(data);
                        this.multiSelect.removeElementJSON(data, false);
                    }
                }.bind(this));
            }
            this.submitStatus = new Hash();
            var content = new Element('div');            
            var contentHTML = "";
            if (Object.isEmpty(this.recurrenceInfo))
                contentHTML += "<span>" + (requests - errorMessages) + " " + global.getLabel('succesfulEvents') + "</span><br /><br />";
                if( (requests - errorMessages) > 0 ){   //if there is some completed request
                    contentHTML +=  "<table class='sortable' id='applicationtimeEntryScreen_completedTable'>" +
                                       "<thead>" +
                                           "<tr>" +
                                               "<th class='applicationtimeEntryScreen_errorTable_employeeColumn table_sortfirstdesc'>" + global.getLabel('employee') + "</th>" +
                                               "<th class='applicationtimeEntryScreen_errorTable_textColumn'>" + global.getLabel('descr') + "</th>" +
                                               "<th class='applicationtimeEntryScreen_errorTable_iconColumn'>" + global.getLabel('status') + "</th>" +
                                           "</tr>" +
                                       "</thead>" +
                                       "<tbody id='applicationtimeEntryScreen_errorTable_tbody'>" + completedHtml + "</tbody>" +
                                    "</table>";
                    contentHTML += "<br>";
                }
            contentHTML += "<span>" + global.getLabel('problemFound') + "</span>" +
                           "<table class='sortable' id='applicationtimeEntryScreen_errorTable'>" +
                               "<thead>" +
                                   "<tr>" +
                                       "<th class='applicationtimeEntryScreen_errorTable_employeeColumn table_sortfirstdesc'>" + global.getLabel('employee') + "</th>" +
                                       "<th class='applicationtimeEntryScreen_errorTable_textColumn'>" + global.getLabel('descr') + "</th>" +
                                       "<th class='applicationtimeEntryScreen_errorTable_iconColumn'>" + global.getLabel('status') + "</th>" +
                                   "</tr>" +
                               "</thead>" +
                               "<tbody id='applicationtimeEntryScreen_errorTable_tbody'>" + message + "</tbody>" +
                           "</table>";
            content.insert(contentHTML);
            // Button
            var buttonsJson = {
                elements: [],
                mainClass: 'moduleInfoPopUp_stdButton_div_left'
            };
            var callBack = function() {
                errorPopUp.close();
                delete errorPopUp;
            }.bind(this);
            var callBack2 = function() {
                errorPopUp.close();
                delete errorPopUp;
                this.submitStatus = new Hash();
                // Forcing deletion of stored calls to GET_EVENTS and GET_TIMESHEET (because it is not entering on the success method)
                global.servicesCache.removeService("GET_EVENTS");
                global.servicesCache.removeService("GET_TIMESHEET");
                document.fire('EWS:refreshTimesheet');
                document.fire('EWS:refreshCalendars');
                if (this.TEappInformation == null)  //if we don't come from the time error
                    global.goToPreviousApp();
                else {
                    global.open( $H({
	                    app: this.TEappInformation,
	                    event: this.TEcontentEvent,
	                    eventCodes: this.eventCodes,
	                    eventInformation: this.TEeventInformation,
	                    employee: this.TEemployee
	                }));
                }
            }.bind(this);
            var okButton = {
                idButton: 'Ok',
                label: global.getLabel('ok'),
                handlerContext: null,
                className: 'moduleInfoPopUp_stdButton',
                handler: createdEvents ? callBack2 : callBack,
                type: 'button',
                standardButton: true
            };
            buttonsJson.elements.push(okButton);
            var ButtonObj = new megaButtonDisplayer(buttonsJson);
            var buttons = ButtonObj.getButtons();
            content.insert(buttons);
            // PopUp
            var errorPopUp = new infoPopUp({
                closeButton: $H({
                    'textContent': 'Close',
                    'callBack': createdEvents ? callBack2 : callBack
                }),
                htmlContent: content,
                indicatorIcon: 'exclamation',
                width: 680
            });
            errorPopUp.create();
            TableKit.reloadTable($(document.body).down("[id=applicationtimeEntryScreen_errorTable]"));
            if( (requests - errorMessages) > 0 ){
                TableKit.reloadTable($(document.body).down("[id=applicationtimeEntryScreen_completedTable]"));
            }
        }
        else {
            this.submitStatus = new Hash();
            document.fire('EWS:refreshTimesheet');
            document.fire('EWS:refreshCalendars');
            if (this.TEappInformation == null)  //if we don't come from the time error
                global.goToPreviousApp();
            else {
                global.open( $H({
	                app: this.TEappInformation,
	                event: this.TEcontentEvent,
	                eventCodes: this.eventCodes,
	                eventInformation: this.TEeventInformation,
	                employee: this.TEemployee
	            }));
            }
        }
    },
    /**
    *@description Shows a confirmation box when we are going to delete an event or to create a fast entry
    *@param {String} action Requested action
    *@param {String} okcode Ok Code
    *@param {String} type Type
    *@param {String} label Label
    */
    _confirmationMessage: function(action, okcode, type, label) {
        var contentHTML = new Element('div');
        var text = global.getLabel("areYouSureEvent") + "<br />";
        if (this.advSearch)
            text = global.getLabel("areYouSureMass") + "<br /><br />" + global.getLabel("pressYes") + "<br />" + global.getLabel("pressNo") + "<br />";
        contentHTML.insert(text);
        // Buttons
        var buttonsJson = {
            elements: [],
            mainClass: 'moduleInfoPopUp_stdButton_div_left'
        };
        var callBack = function() {
            timeEntryPopUp.close();
            delete timeEntryPopUp;
            this._eventAction(action, okcode, type, label);
        } .bind(this);
        var callBack2 = function() {
            timeEntryPopUp.close();
            delete timeEntryPopUp;
        };          
        var aux = {
            idButton: 'Yes',
            label: global.getLabel('yes'),
            handlerContext: null,
            className: 'moduleInfoPopUp_stdButton',
            handler: callBack,
            type: 'button',
            standardButton: true
        };
        var aux2 = {
            idButton: 'No',
            label: global.getLabel('no'),
            handlerContext: null,
            className: 'moduleInfoPopUp_stdButton',
            handler: callBack2,
            type: 'button',
            standardButton: true
        };
        buttonsJson.elements.push(aux);
        buttonsJson.elements.push(aux2);
        var ButtonObj = new megaButtonDisplayer(buttonsJson);
        var buttons = ButtonObj.getButtons();
        // Insert buttons in div
        contentHTML.insert(buttons);
        var width = 350;
        if (this.advSearch)
            width = 550;
        var timeEntryPopUp = new infoPopUp({
            closeButton: $H({
                'textContent': global.getLabel('close'),
                'callBack': function() {
                    timeEntryPopUp.close();
                    delete timeEntryPopUp;
                }
            }),
            htmlContent: contentHTML,
            indicatorIcon: 'information',
            width: width
        });
        timeEntryPopUp.create();
    },
    /**
    *@description Removes the error style in the employee selection form if needed
    */
    _employeeSelection: function() {
        if (this.virtualHtml.down('div#applicationtimeEntryScreen_employeeSelectionContainer').hasClassName('applicationtimeEntryScreen_fieldError'))
            this.virtualHtml.down('div#applicationtimeEntryScreen_employeeSelectionContainer').removeClassName('applicationtimeEntryScreen_fieldError');
        this._refreshMultiDependentFields();
        this._checkSelectedEmployees(false);
    },
    /**
     *@description Employee selected
     */
    onEmployeeSelected: function() {
        Prototype.emptyFunction();
    },
    /**
     *@description Employee unselected
     */
    onEmployeeUnselected: function() {
        Prototype.emptyFunction();
    },
    /**
    *@description Calls SAP with a PAI service to refresh the screen
    *@param {Object} args Information about the field that calls the service
    */
    _paiEvent: function(args) {
        if ((this.eventCode == 'ABS') || (this.eventCode == 'ATT'))
            this._setDatePickersObservers(false);
        var arguments = getArgs(args);
        var servicePai = arguments.servicePai;
        var jsonToSend = {
            EWS: {
                SERVICE: servicePai,
                OBJECT: {
                    TYPE: 'P',
                    TEXT: this.employeeId
                },
                PARAM: {
                    APPID: this.fieldPanel.appId,
                    WID_SCREEN: this.fieldPanel.currentScreen,
                    o_date_ranges: this.fpjson.EWS.o_date_ranges,
                    o_field_settings: this.fpjson.EWS.o_field_settings,
                    o_field_values: this.fpjson.EWS.o_field_values
                }
            }
        };
        var json2xml = new XML.ObjTree();
        json2xml.attr_prefix = '@';
        this.makeAJAXrequest($H({
            xml: json2xml.writeXML(jsonToSend),
            // Temporal success method
            successMethod: '_refreshEvent'
        }));
    },
    /**
    *@description Refreshes the screen after a PAI service
    *@param {JSON} json Information from the PAI service
    */
    _refreshEvent: function(json) {
         //Check if the PAI comes with send document capability
        this.sendDocCapability = false;
        if (!Object.isEmpty(json.EWS.o_send_docu) && json.EWS.o_send_docu == 'X')
            this.sendDocCapability = true;
        //Check if the PAI comes with some mandatory send document 
        if (!Object.isEmpty(json.EWS.o_mandatory) && json.EWS.o_mandatory == 'X')
            this.areAllMandatoryUploaded = false;
        else
            this.areAllMandatoryUploaded = true;
        //If the event status is send for approval or come from inbox all the mandatory documents were uploaded
        if (this._eventStatus == '20') 
            this.areAllMandatoryUploaded = true;     
        //Close the subapplication (upload document or documentsInformation) if it's opened
        if (this.eventCodes.get('ABS').get('appids').include(this.fieldPanel.appId) || this.eventCodes.get('ATT').get('appids').include(this.fieldPanel.appId)) {
            if (!Object.isEmpty(global.currentSubApplication) && this.subApp != "TEAM" && this.subApp != "QUOTA"){
                this.subApp = "NONE";
                global.closeSubApplication();
            }
        }
        // Manage the delete and submit buttons after the PAI
        var letter = this.eventHash.get('EDITABLE')['@value'];
        var editable = (letter == 'X') ? true : false;
        var hide_delete = (letter == 'Y') ? true : false;
        var hide_submit = (letter == 'Z') ? true : false;
        var hide_SubAndDel = ((letter == 'W') || (letter == 'R') || (letter == 'F') || (letter == 'D')) ? true : false;
        if (this.eventHash.get('DISPLAY'))
            editable = editable && (this.eventHash.get('DISPLAY')['@value'] != 'X');
        // Refreshing values and fieldtechnames hashes
        this.fieldPanelDiv.update("");
        this.fieldPanel.destroy();
        var event = json.EWS.o_field_values.yglui_str_wid_record.contents.yglui_str_wid_content.fields.yglui_str_wid_field;
        this.eventHash = new Hash();
        this.fieldtechnames = new Hash();
        for (var i = 0; i < event.length; i++) {
            if (!Object.isEmpty(event[i]['@fieldtechname']))
                this.eventHash.set(event[i]['@fieldtechname'], event[i]);
            else
                this.eventHash.set(event[i]['@fieldid'], event[i]);
            this.fieldtechnames.set(event[i]['@fieldid'], event[i]['@fieldtechname']);
        }
        var fields = objectToArray(json.EWS.o_field_settings.yglui_str_wid_fs_record.fs_fields.yglui_str_wid_fs_field);
        // Radio group for all day (it has no field, so it won't be changed)
        // It is necessary to do this again because it will be possible to have new fields (radio buttons)
        this.radioGroup = new Hash();
        this.alldfGroup = null;
        for (var i = 0; i < fields.length; i++) {
            var fieldtechname = this.fieldtechnames.get(fields[i]['@fieldid']);
            fieldtechname = Object.isEmpty(fieldtechname) ? fields[i]['@fieldid'] : fieldtechname;
            if (!Object.isEmpty(fields[i]['@display_group']) && !Object.isEmpty(fieldtechname) && fields[i]['@display_group'].include('RADIO')) {
                if (Object.isEmpty(this.radioGroup.get(fields[i]['@display_group'])))
                    this.radioGroup.set(fields[i]['@display_group'], new Array());
                this.radioGroup.get(fields[i]['@display_group']).push(fieldtechname);
                if (fieldtechname == 'ALLDF')
                    this.alldfGroup = 'OPT' + fields[i]['@display_group'].substring(fields[i]['@display_group'].indexOf('_'));
            }
        }
        // Settings and values from PAI service
        this.fpjson.EWS.o_field_settings = json.EWS.o_field_settings;
        this.fpjson.EWS.o_field_values = json.EWS.o_field_values;
        // Redefined services
        if(this.recurrenceInfo == null){
            var selectedEmployee = this.employeeId;
            var begda = this.eventHash.get('BEGDA')['@value'];
            var redefinedServices = this._getRedefinedServices(selectedEmployee, begda);
            // Mode will be depend of the scenario (edit by default)
            var mode = 'edit';
            if (!editable || this.comeFromInbox)
                mode = 'display';
            if (this.isNew)
                mode = 'edit';
            // Buttons
            this.hashToSaveButtons = $H({});
            var buttonsScreen = this.fpjson.EWS.o_screen_buttons.yglui_str_wid_button;
            buttonsScreen.each( function(pair) {
                if ((pair['@okcode'] == 'INS') || (pair['@okcode'] == 'MOD'))
                    var functionToExecute = this._showDocumentInformation.bind(this, pair);
                if (pair['@okcode'] == 'DEL')
                    var functionToExecute = this._confirmationMessage.bind(this, pair['@action'], pair['@okcode'], pair['@type'], pair['@label_tag']);
                if (pair['@action'].include('TEAM'))
                    var functionToExecute = this._toggleTeamCalendar.bind(this, pair);
                if (pair['@action'].include('QUOTA'))
                   var functionToExecute = this._toggleQuotaChecker.bind(this, pair);
                if (pair['@action'].include('SEND'))
                   var functionToExecute = this._showSendDocument.bind(this, pair);
                if (pair['@action'].include('UPL_DOC') || pair['@action'].include('UPL_COV')) {
                   var functionToExecute = this._showDocumentInformation.bind(this, pair);
                    if (pair['@action'].include('UPL_DOC'))
                        this.labelUplDocuments = pair['@label_tag'];
                    else
                        this.labelCoversheets = pair['@label_tag'];
                }
                this.hashToSaveButtons.set(pair['@action'], functionToExecute);
            }.bind(this));
            this.hashToSaveButtons.set('paiEvent', this._paiEvent.bind(this));
            this.hashToSaveButtons.set('cancel', this._exit.bind(this, null, ""));

            var showCancel;
            if (!this.comeFromInbox)
                showCancel = true;
            else
                showCancel = false;
            
            //Regular expression to check if the status is between 30 and 3Z
            var pattern = /3[0-9A-Z]/;
            // Deleting the submit button
            if ((Object.isEmpty(this._eventStatus) || pattern.match(this._eventStatus)) && !this.comeFromInbox)
                this._removeButton(this.fpjson, 'MOD');
            //Deleting the delete button
            if (hide_delete || hide_SubAndDel)
                this._removeButton(this.fpjson, 'DEL');
            //Setting in the changeButton method the showIndisplay attribute in the button to true.
            //Because if we change the showButtons {display = false} the submit and delete button are hidden
            if( hide_submit || hide_SubAndDel)
                this._changeButton(this.fpjson, 'DEL'); 
            //We create the new fieldPanel
            if (mode == 'display') {
                this.fieldPanel = new getContentModule({ 
                    mode: mode, 
                    json: this.fpjson, 
                    appId: this.appId, 
                    predefinedXmls: redefinedServices.get('services'),
                    getFieldValueAppend: redefinedServices.get('appends'),
                    objectId: this.employeeId,
                    showCancelButton: showCancel,
                    showButtons: $H({
                        edit: false,
                        display: !hide_SubAndDel ? !hide_submit : false,
                        create: false
                    }),
                    buttonsHandlers: this.hashToSaveButtons,
                    cssClasses: $H({fieldDispHalfSize: 'fieldDispQuarterSize', fieldDispGroupDiv: 'applicationtimeEntryScreen_alignGroupDiv', fieldDispClearBoth: 'fieldPanelMarginPrevElmnt', fieldDispLabel: 'fieldDisp105Left', gcm_fieldLabel: 'fieldDisp105LeftDisplay' }),
                    linkTypeHandlers: $H({REC_LINK: this._displayRecurrenceWindow.bind(this)}),
                    fieldDisplayerModified: 'EWS:datePickerCorrectDate_' + this.appId + '10'
                });
            }
            else {
                this.fieldPanel = new getContentModule({ 
                    mode: mode, 
                    json: this.fpjson, 
                    appId: this.appId, 
                    predefinedXmls: redefinedServices.get('services'),
                    getFieldValueAppend: redefinedServices.get('appends'),
                    objectId: this.employeeId,
                    showCancelButton: true,
                    buttonsHandlers: this.hashToSaveButtons,
                    cssClasses: $H({fieldDispHalfSize: 'fieldDispQuarterSize', fieldDispGroupDiv: 'applicationtimeEntryScreen_alignGroupDiv', fieldDispClearBoth: 'fieldPanelMarginPrevElmnt', fieldDispLabel: 'fieldDisp105Left', gcm_fieldLabel: 'fieldDisp105LeftDisplay' }),
                    linkTypeHandlers: $H({REC_LINK: this._displayRecurrenceWindow.bind(this)}),
                    fieldDisplayerModified: 'EWS:datePickerCorrectDate_' + this.appId + '10'
                });
            }
            this.fieldPanelDiv.insert(this.fieldPanel.getHtml());
            
            //Set the retro/future and the payroll dates
            if(this.retroFutureDates && (editable || hide_delete))
                this._setRetroFuture(this.fieldPanel);
            
            //Hide the related send document buttons
            var buttonSendDoc = this.fieldPanel.getButton("SCR_SEND_DOCUMENT", null, 1);
            var buttonDocInfo = this.fieldPanel.getButton("SCR_X_UPL_DOC", null, 1);
            var buttonCovInfo = this.fieldPanel.getButton("SCR_X_UPL_COV", null, 1);
            if (!Object.isEmpty(buttonDocInfo) && !Object.isEmpty(buttonSendDoc) && !Object.isEmpty(buttonCovInfo)) {
                buttonDocInfo.hide();
                buttonSendDoc.hide();
                buttonCovInfo.hide();
            }
            // Changing team calendar button text
            if (this.subApp != "TEAM") {
                var buttonTeamCal = this.fieldPanel.getButton("SCR_TEAM_CAL", null, 1);
                if(!Object.isEmpty(buttonTeamCal))
                    buttonTeamCal.update(global.getLabel("showTeamCal"));
            }
            //Manage the related send document buttons
            if (this.sendDocCapability && (this.eventCodes.get('ABS').get('appids').include(this.fieldPanel.appId) || this.eventCodes.get('ATT').get('appids').include(this.fieldPanel.appId)))
                this._manageDocButtons(json);
            this._checkSelectedEmployees(false); //Disable or not the quotaChecker button
            // If recurrence link exists, we put it as an inline element
            if (this.virtualHtml.down('div#linkToHandler') && !global.liteVersion)
                this.virtualHtml.down('div#linkToHandler').up().addClassName('inlineElement');
            else if(this.virtualHtml.down('button#linkToHandler') && global.liteVersion)
                this.virtualHtml.down('button#linkToHandler').up().addClassName('inlineElement fieldDispFloatLeft');
            //this._refreshMultiDependentFields();
        }
        else  //if(this.recurrenceInfo != null)
                this._displayRecurrentEvent();
        if ((this.eventCode == 'ABS') || (this.eventCode == 'ATT')) {
            this._setDatePickersObservers(true);
            this.radio_changed = false; //Force to check the radiobutton to be disabled or not
            this._correctDateSelected();
        }
        //Including the message when the payroll is running or the date event selected is before/after the retro/future dates
        if (hide_SubAndDel) {
            var RFlabel = "";
            switch(letter){
                case 'W':
                    RFlabel = global.getLabel('AnyActions') + (' ') + global.getLabel('duePayroll');
                    break;
                case 'R':
                    RFlabel = global.getLabel('DATE_MSG_RETRO_EARLY') + (' ') + global.getLabel('NO_ACTION');
                    break;
                case 'F':
                    RFlabel = global.getLabel('DATE_MSG_FUTURE_LATER') + (' ') + global.getLabel('NO_ACTION');
                    break;
                case 'D':
                    RFlabel = global.getLabel('AnyActions') + (' ') + global.getLabel('dueDelegations');
                    break;
            }
            $('fieldErrorMessage_' + this.appId).update(RFlabel);
        }
    },
    /**
    * Creates the information needed for the "Show documents" info calling to GET_DOC_IDS
    * @param {Object} buttonInfo The info for the button
    */
    _showDocumentInformation: function(buttonInfo) { 
        // Checking subapplication
        if (!buttonInfo['@action'].include(this.subApp)) {
            if (this.comeFromInbox && (this.subApp != "NONE"))
                global.closeSubSubApplication();
            if(buttonInfo['@okcode'] != "INS"){
                if (this.subApp == "TEAM") {
                    var buttonTeamCal = this.fieldPanel.getButton("SCR_TEAM_CAL", null, 1);
                    buttonTeamCal.update(global.getLabel("showTeamCal"));
                }
                else if (this.subApp == "QUOTA") {
                    var buttonQuotaCheck = this.fieldPanel.getButton("SCR_QUOTA_CHECK", null, 1);
                    buttonQuotaCheck.update(global.getLabel("showQuotaCheck"));
                }
                else if (this.subApp == "SEND") {
                    var buttonSendDoc = this.fieldPanel.getButton("SCR_SEND_DOCUMENT", null, 1);
                    buttonSendDoc.update(global.getLabel("ST_DOC"));
                }
                // Getting subapplication from the button
                this.subApp = buttonInfo['@action'].gsub('SCR_X_', '');
            }
            // Getting request id
            var reqId = this.eventKey;
            var webKey = '';
            // Approved events (they start with P_)
            if (reqId.startsWith('P_')) {
                reqId = '';
                webKey = this.eventId;
            }
            // Non approved events
            else
                reqId = reqId.gsub('_', '');
            var xmlin = '<EWS>'+
               '<SERVICE>GET_DOC_IDS</SERVICE>'+
               '<PARAM>'+
                   '<I_REQ_ID>' + reqId + '</I_REQ_ID>'+
                   '<WEB_KEY>' + webKey + '</WEB_KEY>' +
               '</PARAM>'+
           '</EWS>';
            //Select the target success method depend on the button info and if the event is new:
            if (buttonInfo['@action'].include('UPL_DOC') || buttonInfo['@action'].include('UPL_COV')) {
                if (!this.isNew) //In case that we aren't in a new event, do the call
                    this.makeAJAXrequest($H({
                        xml: xmlin,
                        successMethod: this._loadDocInformationView.bind(this, buttonInfo)
                    }));
                else //If the event is new we haven't docIds in backend
                    this._loadDocInformationView(buttonInfo);
            }
            else if (!this.docIdrefreshed) {//If the docIds haven't been refreshed and click on submit button
                if (!this.isNew) //In case that we aren't in a new event, do the call
                    this.makeAJAXrequest($H({
                        xml: xmlin,
                        successMethod: this._docIdsRefresh.bind(this, buttonInfo)
                    }));
                 else//If the event is new we haven't docIds in backend
                    this._docIdsRefresh(buttonInfo);
                 this.docIdrefreshed = true;
            }
            else //If the docIds have been refreshed and click on submit button
                this._submitActions(buttonInfo);
        }
        else {
            this.subApp = "NONE";
            if (!this.comeFromInbox)
                global.closeSubApplication();
            else
                global.closeSubSubApplication();
        }
    },
    /**
    * Open as subAplication the documents information view
    * @param {Object} buttonInfo The info for the button
    */
    _loadDocInformationView: function(buttonInfo, json) {
        var empIdSelected;
        // Normal documents
        if (buttonInfo['@action'].include('UPL_DOC')) {
            // Setting employee
            if(!this.employeeRestriction)
                empIdSelected = this.employeeId;
            else
                empIdSelected = this.isNew ? this.multiSelect.selectedElements[0].get('data') : this.employeeId;
            // Storing docIds retrieved from backend
            var docIdJson =  new Array();
            if (!Object.isEmpty(json) && !Object.isEmpty(json.EWS.o_doc_list))
                docIdJson = objectToArray(json.EWS.o_doc_list.yglui_str_ecm_content_id);
            for (var i = 0; i < docIdJson.length; i++)
                this.sendDocumentInfo.push(docIdJson[i]['@content_id']);
            this.sendDocumentInfo = this.sendDocumentInfo.uniq(); //Remove the repeated docIds
            var keepSubOpened = false;
            if (this.comeFromInbox)
                keepSubOpened = true;
            // Opening application
            global.open($H({
                app: {
                    appId: buttonInfo['@tarap'],
                    tabId: buttonInfo['@tartb'],
                    view: buttonInfo['@views']
                },
                empId : empIdSelected,
                docIds : this.sendDocumentInfo,
                comeInbox : this.comeFromInbox,
                keepSubOpened: keepSubOpened 
            }));
        }
        // Coversheets
        else {
            // Setting logged employee
            empIdSelected = global.objectId;
            //Storing docIds retrieved from backend
            var trackIdJson =  new Array();
            if (!Object.isEmpty(json) && !Object.isEmpty(json.EWS.o_doc_cover))
                trackIdJson = objectToArray(json.EWS.o_doc_cover.yglui_str_ecm_tracking_id);
            for (var i = 0; i < trackIdJson.length; i++)
                this.coversheetIds.push(trackIdJson[i]['@track_id']);
            this.coversheetIds = this.coversheetIds.uniq(); //Remove the repeated docIds
            var keepSubOpened = false;
            if (this.comeFromInbox)
                keepSubOpened = true;
            // Opening application:
            global.open($H({
                app: {
                    appId: buttonInfo['@tarap'],
                    tabId: buttonInfo['@tartb'],
                    view: buttonInfo['@views']
                },
                empId: empIdSelected,
                trackIds: this.coversheetIds,
                keepSubOpened: keepSubOpened 
            }));
        }
        // Documents have been refreshed
        this.docIdrefreshed = true;
    },
    /**
    * Creates the information need for the "Send document" info
    * @param {Object} buttonInfo The info for the button
    */ 
    _showSendDocument: function(buttonInfo) {
        var buttonSendDoc = this.fieldPanel.getButton("SCR_SEND_DOCUMENT", null, 1);
        // Checking subapplication
        if (this.subApp != "SEND") {
            if (this.subApp == "TEAM") {
                var buttonTeamCal = this.fieldPanel.getButton("SCR_TEAM_CAL", null, 1);
                buttonTeamCal.update(global.getLabel("showTeamCal"));
            }
            else if (this.subApp == "QUOTA") {
                var buttonQuotaCheck = this.fieldPanel.getButton("SCR_QUOTA_CHECK", null, 1);
                buttonQuotaCheck.update(global.getLabel("showQuotaCheck"));
            }
            buttonSendDoc.update(global.getLabel("HIDE_DOC"));
            this.subApp = "SEND";
            //Sets the selected employee Id
            var empIdSelected ;
            if(!this.employeeRestriction)
                empIdSelected = this.employeeId;
            else
                empIdSelected = this.isNew ? this.multiSelect.selectedElements[0].get('data') : this.employeeId;
            //Open application:
            global.open($H({
                app: {
                    appId: buttonInfo['@tarap'],
                    tabId: buttonInfo['@tartb'],
                    view: buttonInfo['@views']
                },
                appId : this.appId,
                screen : this.fieldPanel.currentScreen,
			    empId : empIdSelected,
                subtype : this.fieldPanel.getFieldDisplayer (this.appId, null, this.fieldPanel.currentScreen, null, 'M_AWART', false, null).options.optionsJSON.values['@value']
            }));
        }
        else {
            buttonSendDoc.update(global.getLabel("ST_DOC"));
            this.subApp = "NONE";
            if (!Object.isEmpty(global.currentSubApplication))
                global.closeSubApplication();
        }
    },
    /**
    * Manages the uploaded documents through the retieved docId in the args. Finally check if all mandatory document types were uploaded.
    * @param {Object} args ID for the recent uploaded document
    */
    _manageSendDocInfo: function (args) {
        var json = getArgs(args);
        // Checking if there were errors
        var error = (json.messageType == 'E') ? true : false;
        if (!error) {
            //Mandatory doc types ids
            this.mandatoryDocTypeIds = json.man;
            //Store the docIds
            if(!Object.isEmpty(json.docId)){
                this.sendDocumentInfo.push(json.docId);
                this.uploadedDocTypesIds.push(json.docType);
                this.uploadedDocTypesIds = this.uploadedDocTypesIds.uniq(); //Delete the repeated ones
                this.numUploadedDocs ++;
            }
            //Check if all mandatory document types were uploaded.
            this.areAllMandatoryUploaded = false;
            for (var i = 0, cont = 0; i < this.uploadedDocTypesIds.length && this.mandatoryDocTypeIds.length > 0 ; i++) {
                if(this.mandatoryDocTypeIds.include(this.uploadedDocTypesIds[i]))
                    cont ++;
            }
            if(cont == this.mandatoryDocTypeIds.length)
                this.areAllMandatoryUploaded = true;
            //If the event status is send for approval all the mandatory documents was uploaded
            if (this._eventStatus == '20') 
                this.areAllMandatoryUploaded = true; 
            //Update the "X uploaded document" button
            var buttonDocInfo = this.fieldPanel.getButton("SCR_X_UPL_DOC", null, 1);
            buttonDocInfo.innerHTML = this.numUploadedDocs + " " + this.labelUplDocuments;
            buttonDocInfo.enable();
            buttonDocInfo.removeClassName('applicationtimeEntryScreen_removeStyleButton');
            buttonDocInfo.addClassName('application_action_link');
            // Showing the button (it could be hidden by _manageSendCovInfo before)
            if (!buttonDocInfo.visible())
                buttonDocInfo.show();
        }
    },
    /**
    * Manages created coversheets through the track id received in args
    * @param {Object} args Backend response containing the coversheet's ID
    */
    _manageSendCovInfo: function(args) {
        var json = getArgs(args);
        // Storing track id
        if (!Object.isEmpty(json.EWS.o_v_track_id)) {
            this.coversheetIds.push(json.EWS.o_v_track_id);
            this.numCoversheets++;
        }
        //Update the "X uploaded document with coversheet" button
        var buttonCovInfo = this.fieldPanel.getButton("SCR_X_UPL_COV", null, 1);
        buttonCovInfo.innerHTML = this.numCoversheets + " " + this.labelCoversheets;
        buttonCovInfo.enable();
        buttonCovInfo.removeClassName('applicationtimeEntryScreen_removeStyleButton');
        buttonCovInfo.addClassName('application_action_link');
        if (!buttonCovInfo.visible())
            buttonCovInfo.show();
        // Hiding "X uploaded document" button if necessary
        if (this.numUploadedDocs == 0) {
            var buttonDocInfo = this.fieldPanel.getButton("SCR_X_UPL_DOC", null, 1);
            if (buttonDocInfo.visible())
                buttonDocInfo.hide();
        }
    },
    /**
    * Manages removed coversheets through the track id received in args
    * @param {Object} args Coversheet's ID
    */
    _manageRemoveCovInfo: function(args) {
        var arguments = getArgs(args);
        var trackId = arguments.trackId;
        var closeSub = arguments.closeSub;
        if (Object.isEmpty(closeSub))
            closeSub = false;
        // Removing track id
        if (!Object.isEmpty(trackId)) {
            this.coversheetIds = this.coversheetIds.without(trackId);
            this.numCoversheets--;
            // We need to refresh GET_EVENTS if we delete an existing event's coversheet
            if (!this.isNew) {
                document.fire('EWS:refreshTimesheet');
                document.fire('EWS:refreshCalendars');
            }
        }
        //Update the "X uploaded document with coversheet" button
        var buttonCovInfo = this.fieldPanel.getButton("SCR_X_UPL_COV", null, 1);
        if (this.numCoversheets == 0) {
            if (buttonCovInfo.visible())
                buttonCovInfo.hide();
            // Showing "X uploaded document" button if necessary
            if (this.numUploadedDocs == 0) {
                var buttonDocInfo = this.fieldPanel.getButton("SCR_X_UPL_DOC", null, 1);
                if (!buttonDocInfo.visible())
                    buttonDocInfo.show();
            }
            // If requested, closing subapplication
            if (closeSub) {
                if (this.comeFromInbox)
                    global.closeSubSubApplication();
                else
                    global.closeSubApplication();
            }
        }
        else
            buttonCovInfo.innerHTML = this.numCoversheets + " " + this.labelCoversheets;
    },
    /**
    *@description Shows/Hides and modifies the related send documents buttons
    */
    _manageDocButtons: function(json) {
        // Related send document buttons
        var buttonSendDoc = this.fieldPanel.getButton("SCR_SEND_DOCUMENT", null, 1);
        var buttonDocInfo = this.fieldPanel.getButton("SCR_X_UPL_DOC", null, 1);
        var buttonCovInfo = this.fieldPanel.getButton("SCR_X_UPL_COV", null, 1);
        //Indicates if there's one employee selected
        var isOneSelected = this._checkSelectedEmployees(false);

        //We only manage the buttons if only one employee is selected
        if(isOneSelected){
            if(!Object.isEmpty(buttonDocInfo))
                buttonDocInfo.show();
            //Scenarios to show send document button
            if (!this.comeFromInbox && ((this._eventStatus == '?') || (this._eventStatus == '20')))
                if(!Object.isEmpty(buttonSendDoc))
                    buttonSendDoc.show();
            else
                if(!Object.isEmpty(buttonSendDoc))
                    buttonSendDoc.hide();
        }
             
        //Look for the number of the uploaded documents in the fieldvalues
        var values = json.EWS.o_field_values.yglui_str_wid_record.contents.yglui_str_wid_content.fields.yglui_str_wid_field;
        var length = values.length;
        var counter = 0;
        for (var i = 0; i < length ; i++) {
            if (values[i]['@fieldid'] == 'NUMDOC') {
                this.numUploadedDocs = parseInt(values[i]['@value'], 10);
                counter++;
            }
            if (values[i]['@fieldid'] == 'NUMCOV') {
                this.numCoversheets = parseInt(values[i]['@value'], 10);
                counter++;
            }
            // If we have found both fields, we finish the search
            if (counter == 2)
                break;
            }
        // Checking if numCoversheets is a valid number
        this.numCoversheets = isNaN(this.numCoversheets) ? 0 : this.numCoversheets;
        if (this.numCoversheets > 0 && !Object.isEmpty(buttonCovInfo)) {
            buttonCovInfo.innerHTML = this.numCoversheets + " " + this.labelCoversheets;
            buttonCovInfo.show();
        }
        // Checking if numUploadedDocs is a valid number
        this.numUploadedDocs = isNaN(this.numUploadedDocs) ? 0 : this.numUploadedDocs;
        if (this.numUploadedDocs == 0 && !Object.isEmpty(buttonDocInfo)) {
            buttonDocInfo.innerHTML = global.getLabel('NO_DOC_UPL');
            buttonDocInfo.disable();
            buttonDocInfo.removeClassName('application_action_link');
            buttonDocInfo.addClassName('applicationtimeEntryScreen_removeStyleButton');
            if (this.numCoversheets > 0)
                buttonDocInfo.hide();
        } 
        else {
            if(!Object.isEmpty(buttonDocInfo)){
                buttonDocInfo.innerHTML = this.numUploadedDocs + " " + this.labelUplDocuments;
                buttonDocInfo.enable();
                buttonDocInfo.removeClassName('applicationtimeEntryScreen_removeStyleButton');
                buttonDocInfo.addClassName('application_action_link');
            }
        }
    },
    /**
    *@description Open recurrent event's popup and shows its information if it was defined
    */
    _displayRecurrenceWindow: function() {
        if ((this.eventCode == 'ABS') || (this.eventCode == 'ATT'))
            this._setDatePickersObservers(false);
        this.recurrenceHTML = new Element('div');
        var html = "<span class='application_main_title2'>" + global.getLabel('recPattern') + "</span><br /><br />" +
                   "<form name='recurrenceInfo'><table>" +
                       "<tr>" +
                           "<td class='applicationtimeEntryScreen_rec_partternCell'><input id='applicationtimeEntryScreen_rec_frequencyD' type='radio' name='rec_frequency' value='D' checked> " + global.getLabel('daily') + "</td>" +
                           "<td class='applicationtimeEntryScreen_rec_partternCell'><input id='applicationtimeEntryScreen_rec_frequencyW' type='radio' name='rec_frequency' value='W'> " + global.getLabel('weekly') + "</td>" +
                           "<td class='applicationtimeEntryScreen_rec_partternCell'><input id='applicationtimeEntryScreen_rec_frequencyM' type='radio' name='rec_frequency' value='M'> " + global.getLabel('monthly') + "</td>" +
                           "<td class='applicationtimeEntryScreen_rec_partternCell'></td>" +
                       "</tr>" +
                       "<tr>" +
                           "<td colspan=4>" +
                               "<br /><span>" + global.getLabel('every') + "</span>&nbsp;&nbsp;&nbsp;" +
                               "<input type='text' id='applicationtimeEntryScreen_rec_patternInput' class='fieldDisplayer_input applicationtimeEntryScreen_recInput' value='1'>&nbsp;&nbsp;&nbsp;" +
                               "<span id='applicationtimeEntryScreen_rec_patternLabel'>" + global.getLabel('days') + "</span>" +
                           "</td>" +
                       "</tr>" +
                       "<tr id='applicationtimeEntryScreen_rec_partternRow1'>" +
                           "<td colspan=4>" +
                               "<input id='applicationtimeEntryScreen_rec_monthlyD' type='radio' name='rec_monthly' value='D' checked> " +
                               "<span>" + global.getLabel('day') + "</span>&nbsp;&nbsp;&nbsp;" +
                               "<input type='text' id='applicationtimeEntryScreen_rec_dayInput' class='fieldDisplayer_input applicationtimeEntryScreen_recInput' value='1'>&nbsp;&nbsp;&nbsp;" +
                           "</td>" +
                       "</tr>" +
                       "<tr id='applicationtimeEntryScreen_rec_partternRow2'>" +
                           "<td colspan=4>" +
                               "<input id='applicationtimeEntryScreen_rec_monthlyC' type='radio' name='rec_monthly' value='C'> " +
                               "<select name='rec_monthlyList'>" +
                                   "<option value='1'>" + global.getLabel('first') + "</option>" +
                                   "<option value='2'>" + global.getLabel('second') + "</option>" +
                                   "<option value='3'>" + global.getLabel('third') + "</option>" +
                                   "<option value='4'>" + global.getLabel('fourth') + "</option>" +
                                   "<option value='5'>" + global.getLabel('last') + "</option>" +
                               "</select>  " +
                               "<select name='rec_monthlyDays'>" +
                                   "<option value='mon'>" + global.getLabel('monDay') + "</option>" +
                                   "<option value='tue'>" + global.getLabel('tueDay') + "</option>" +
                                   "<option value='wed'>" + global.getLabel('wedDay') + "</option>" +
                                   "<option value='thu'>" + global.getLabel('thuDay') + "</option>" +
                                   "<option value='fri'>" + global.getLabel('friDay') + "</option>" +
                                   "<option value='sat'>" + global.getLabel('satDay') + "</option>" +
                                   "<option value='sun'>" + global.getLabel('sunDay') + "</option>" +
                               "</select> " +
                           "</td>" +
                       "</tr>" +
                       "<tr id='applicationtimeEntryScreen_rec_partternRow3'>" +
                           "<td class='applicationtimeEntryScreen_rec_partternCell'><input type='checkbox' name='rec_pattern' value='mon'> " + global.getLabel('monDay') + "</td>" +
                           "<td class='applicationtimeEntryScreen_rec_partternCell'><input type='checkbox' name='rec_pattern' value='tue'> " + global.getLabel('tueDay') + "</td>" +
                           "<td class='applicationtimeEntryScreen_rec_partternCell'><input type='checkbox' name='rec_pattern' value='wed'> " + global.getLabel('wedDay') + "</td>" +
                           "<td class='applicationtimeEntryScreen_rec_partternCell'><input type='checkbox' name='rec_pattern' value='thu'> " + global.getLabel('thuDay') + "</td>" +
                       "</tr>" +
                       "<tr id='applicationtimeEntryScreen_rec_partternRow4'>" +
                           "<td class='applicationtimeEntryScreen_rec_partternCell'><input type='checkbox' name='rec_pattern' value='fri'> " + global.getLabel('friDay') + "</td>" +
                           "<td class='applicationtimeEntryScreen_rec_partternCell'><input type='checkbox' name='rec_pattern' value='sat'> " + global.getLabel('satDay') + "</td>" +
                           "<td class='applicationtimeEntryScreen_rec_partternCell'><input type='checkbox' name='rec_pattern' value='sun'> " + global.getLabel('sunDay') + "</td>" +
                           "<td class='applicationtimeEntryScreen_rec_partternCell'></td>" +
                       "</tr>" +
                   "</table><br />" +
                   "<span class='application_main_title2'>" + global.getLabel('recRange') + "</span><br /><br />" +
                   "<table>" +
                       "<tr>" +
                           "<td class='applicationtimeEntryScreen_rec_rangeLabels test_label'>" + global.getLabel('start') + "</td>" +
                           "<td class='applicationtimeEntryScreen_rec_rangeRadio'></td>" +
                           "<td class='applicationtimeEntryScreen_rec_rangeValues'><div id='applicationtimeEntryScreen_rec_startDate'></div></td>" +
                       "</tr>" +
                       "<tr>" +
                           "<td colspan=3><br /></td>" +
                       "</tr>" +
                       "<tr>" +
                           "<td class='applicationtimeEntryScreen_rec_rangeLabels test_label'>" + global.getLabel('end') + "</td>" +
                           "<td class='applicationtimeEntryScreen_rec_rangeRadio'><input type='radio' name='rec_range' value='A' checked></td>" +
                           "<td class='applicationtimeEntryScreen_rec_rangeValues'>" +
                               "<span>" + global.getLabel('after') + "</span>&nbsp;&nbsp;&nbsp;" +
                               "<input type='text' id='applicationtimeEntryScreen_rec_rangeInput' class='fieldDisplayer_input applicationtimeEntryScreen_recInput' value='1'>&nbsp;&nbsp;&nbsp;" +
                               "<span>" + global.getLabel('occurences') + "</span>" +
                           "</td>" +
                       "</tr>" +
                       "<tr>" +
                           "<td class='applicationtimeEntryScreen_rec_rangeLabels test_label'></td>" +
                           "<td class='applicationtimeEntryScreen_rec_rangeRadio'><input type='radio' name='rec_range' value='D'></td>" +
                           "<td class='applicationtimeEntryScreen_rec_rangeValues'><div id='applicationtimeEntryScreen_rec_endDate'></div></td>" +
                       "</tr>" +
                   "</table></form>";
        this.recurrenceHTML.insert(html);
        // Daily is selected by default --> Hidding days of the week
        this.recurrenceHTML.down('[id=applicationtimeEntryScreen_rec_partternRow1]').hide();
        this.recurrenceHTML.down('[id=applicationtimeEntryScreen_rec_partternRow2]').hide();
        this.recurrenceHTML.down('[id=applicationtimeEntryScreen_rec_partternRow3]').hide();
        this.recurrenceHTML.down('[id=applicationtimeEntryScreen_rec_partternRow4]').hide();
        // Error message div (number of occurrences)
        var messageDiv = "<div id='applicationtimeEntryScreen_occErrorMessages'></div>";
        this.recurrenceHTML.insert(messageDiv);
        this.recurrenceHTML.down('div#applicationtimeEntryScreen_occErrorMessages').hide();
        // Error message div (recurrence pattern amount)
        messageDiv = "<div id='applicationtimeEntryScreen_recPatErrorMessage'></div>";
        this.recurrenceHTML.insert(messageDiv);
        this.recurrenceHTML.down('div#applicationtimeEntryScreen_recPatErrorMessage').hide();
        // Error message div (dates overlapping)
        messageDiv = "<div id='applicationtimeEntryScreen_recDatesOverlapping' class='application_main_error_text'></div>";
        this.recurrenceHTML.insert(messageDiv);
        this.recurrenceHTML.down('div#applicationtimeEntryScreen_recDatesOverlapping').hide();
        // Error message div (recurrence range number)
        messageDiv = "<div id='applicationtimeEntryScreen_recRangeWrongNumber' class='application_main_error_text'></div>";
        this.recurrenceHTML.insert(messageDiv);
        this.recurrenceHTML.down('div#applicationtimeEntryScreen_recRangeWrongNumber').hide();
        // Listening clicks for frequency radio buttons
        this.recurrenceHTML.down('[id=applicationtimeEntryScreen_rec_frequencyD]').observe('click', this._showPattern.bind(this, 'D'));
        this.recurrenceHTML.down('[id=applicationtimeEntryScreen_rec_frequencyW]').observe('click', this._showPattern.bind(this, 'W'));
        this.recurrenceHTML.down('[id=applicationtimeEntryScreen_rec_frequencyM]').observe('click', this._showPattern.bind(this, 'M'));
        // Buttons
        var buttonsJson = {
            elements: [],
            mainClass: 'moduleInfoPopUp_stdButton_div_left'
        };
        var callBack = function() {
            var save = this._saveRecurrence();
            if ( save.get('check1') && save.get('check2') ) { //The data has been properly set
                recurrentEventPopUp.close();
                delete recurrentEventPopUp;
                this._displayRecurrentEvent();
            }
            else {
                if(!save.get('check1')){                      //Number of occurrences incorrectly set
                    var limit = Object.isEmpty(this.recurrenceDateLimit) ? global.maximumRecurrences : this.recurrenceDateLimit;
                    this.recurrenceHTML.down('div#applicationtimeEntryScreen_occErrorMessages').show();
                    this.recurrenceHTML.down('div#applicationtimeEntryScreen_occErrorMessages').update(global.getLabel('occurExceeded') + ' (' + limit + ')');
                    if ((this.eventCode == 'ABS') || (this.eventCode == 'ATT'))
                        this._setDatePickersObservers(true);
                }else{
                    this.recurrenceHTML.down('div#applicationtimeEntryScreen_occErrorMessages').hide();
                }
                if(!save.get('check2')){                      
                    if(this.recPatNumberWrong){  //Recurrence pattern number incorrectly set
                        this.recurrenceHTML.down('div#applicationtimeEntryScreen_recPatErrorMessage').show();
                        this.recurrenceHTML.down('div#applicationtimeEntryScreen_recPatErrorMessage').update( global.getLabel('recPatError') );
                    }else{
                        this.recurrenceHTML.down('div#applicationtimeEntryScreen_recPatErrorMessage').hide();
                    }
                    
                    if(this.recRangeNumberWrong){   //Recurrence range number incorrectly set
                        this.recurrenceHTML.down('div#applicationtimeEntryScreen_recRangeWrongNumber').show();
                        this.recurrenceHTML.down('div#applicationtimeEntryScreen_recRangeWrongNumber').update( global.getLabel('recRangeNumberWrong') );
                    }else{
                        this.recurrenceHTML.down('div#applicationtimeEntryScreen_recRangeWrongNumber').hide();
                    }
                    
                    if(this.recDatesOverlapping){                  //End date wrongly entered
                        this.recurrenceHTML.down('div#applicationtimeEntryScreen_recDatesOverlapping').update( global.getLabel('overlappingDates') );                        
                        this.recurrenceHTML.down('div#applicationtimeEntryScreen_recDatesOverlapping').show();
                    }else{
                        this.recurrenceHTML.down('div#applicationtimeEntryScreen_recDatesOverlapping').hide();
                    }
                }else{
                    this.recurrenceHTML.down('div#applicationtimeEntryScreen_recPatErrorMessage').hide();
                    this.recurrenceHTML.down('div#applicationtimeEntryScreen_recRangeWrongNumber').hide();
                    this.recurrenceHTML.down('div#applicationtimeEntryScreen_recDatesOverlapping').hide();
                }
            }
        }.bind(this);
        var saveButton = {
            idButton: 'REC_SAVE',
            label: global.getLabel('save'),
            handlerContext: null,
            className: 'moduleInfoPopUp_stdButton',
            handler: callBack,
            type: 'button',
            standardButton: true
        };
        buttonsJson.elements.push(saveButton);
        if (!Object.isEmpty(this.recurrenceInfo)) {
            var callBack2 = function() {
                this._deleteRecurrence();
                recurrentEventPopUp.close();
                delete recurrentEventPopUp;
                this._undisplayRecurrentEvent();
            }.bind(this);
            var deleteButton = {
                idButton: 'REC_DELETE',
                label: global.getLabel('delete'),
                handlerContext: null,
                className: 'moduleInfoPopUp_stdButton',
                handler: callBack2,
                type: 'button',
                standardButton: true
            };
            buttonsJson.elements.push(deleteButton);
        }
        var callBack3 = function() {
            this.recurrenceHTML.down('[id=applicationtimeEntryScreen_rec_frequencyD]').stopObserving();
            this.recurrenceHTML.down('[id=applicationtimeEntryScreen_rec_frequencyW]').stopObserving();
            this.recurrenceHTML.down('[id=applicationtimeEntryScreen_rec_frequencyM]').stopObserving();
            recurrentEventPopUp.close();
            delete recurrentEventPopUp;
            if ((this.eventCode == 'ABS') || (this.eventCode == 'ATT'))
                this._setDatePickersObservers(true);
        }.bind(this);
        var cancelButton = {
            idButton: 'REC_CANCEL',
            label: global.getLabel('cancel'),
            handlerContext: null,
            className: 'moduleInfoPopUp_stdButton',
            handler: callBack3,
            type: 'button',
            standardButton: true
        };
        buttonsJson.elements.push(cancelButton);
        var ButtonObj = new megaButtonDisplayer(buttonsJson);
        var buttons = ButtonObj.getButtons();
        this.recurrenceHTML.insert(buttons);
        // infoPopUp creation
        var recurrentEventPopUp = new infoPopUp({
            closeButton: $H({
                'textContent': global.getLabel('cancel'),
                'callBack': callBack3
            }),
            htmlContent: this.recurrenceHTML,
            indicatorIcon: 'void',
            width: 530
        });
        recurrentEventPopUp.create();
        $$(".moduleInfoPopUp_stdButton_div_left")[0].addClassName("application_clear_line");
        // datepickers creation (we can't do this before)
        var startDate = Object.isEmpty(this.recurrenceInfo) ? this.eventHash.get('BEGDA')['@value'].gsub('-','') : this.recurrenceInfo.get('range_start').gsub('-','');
        this.startDatePicker = new DatePicker('applicationtimeEntryScreen_rec_startDate', {
            defaultDate: startDate,
            draggable: true,
            manualDateInsertion: true
        });
        var endDate = (Object.isEmpty(this.recurrenceInfo) || Object.isEmpty(this.recurrenceInfo.get('endda'))) ? this.eventHash.get('ENDDA')['@value'].gsub('-','') : this.recurrenceInfo.get('endda').gsub('-','');
        this.endDatePicker = new DatePicker('applicationtimeEntryScreen_rec_endDate', {
            defaultDate: endDate,
            draggable: true,
            manualDateInsertion: true
        });
        // Showing previous saved recurrence
        if (!Object.isEmpty(this.recurrenceInfo)) {
            // Daily, weekly or monthly radio buttons
            var pattern = this.recurrenceInfo.get('dtype');
            this._showPattern(pattern);
            if (pattern != 'D') { // Daily is selected by default
                document.recurrenceInfo.rec_frequency[0].checked = false;
                if (pattern == 'W') // Weekly
                    document.recurrenceInfo.rec_frequency[1].checked = true;
                else // Monthly
                    document.recurrenceInfo.rec_frequency[2].checked = true;
            }
            // Field with recurrence pattern (Every...)
            var patternInput = '';
            if (pattern != 'D')
                patternInput = this.recurrenceInfo.get('nrweek_month');
            else
                patternInput = this.recurrenceInfo.get('nrday');
            this.recurrenceHTML.down('[id=applicationtimeEntryScreen_rec_patternInput]').value = patternInput;
            // Days of the week ...
            var weekDays = this.recurrenceInfo.get('selected_days');
            // ... for a weekly recurrence
            if (pattern == 'W') {
                var recPattForm = document.recurrenceInfo.rec_pattern;
                var length = recPattForm.length;
                for (var i = 0; i < length; i++)  {
                    if (weekDays.indexOf(recPattForm[i].value) < 0)
                        recPattForm[i].checked = false;
                    else
                        recPattForm[i].checked = true;
                }
            }
            // ... for a monthly recurrence
            if (pattern == 'M') {
                var options = document.recurrenceInfo.rec_monthlyDays.options;
                var length = options.length;
                var found = false;
                for (var i = 0; (i < length) && !found; i++)  {
                    if (options[i].value == weekDays[0]) {
                        options[i].selected = true;
                        found = true;
                    }
                }
            }
            // Other fields (monthly recurrences)
            if (pattern == 'M') {
                var dayValue = this.recurrenceInfo.get('nrday');
                if (weekDays.length == 0)
                    this.recurrenceHTML.down('[id=applicationtimeEntryScreen_rec_dayInput]').value = dayValue;
                else {
                    var options = document.recurrenceInfo.rec_monthlyList.options;
                    var length = options.length;
                    var found = false;
                    for (var i = 0; (i < length) && !found; i++)  {
                        if (options[i].value == dayValue) {
                            options[i].selected = true;
                            found = true;
                        }
                    }
                }
                var recMonthlyForm = document.recurrenceInfo.rec_monthly;
                if (weekDays.length > 0) {
                    recMonthlyForm[0].checked = false; // Day
                    recMonthlyForm[1].checked = true; // Custom
                }
            }
            var occurences = this.recurrenceInfo.get('nrocc');
            if (!Object.isEmpty(occurences))
                this.recurrenceHTML.down('[id=applicationtimeEntryScreen_rec_rangeInput]').value = occurences;
            else {
                document.recurrenceInfo.rec_range[0].checked = false; // Occurences
                document.recurrenceInfo.rec_range[1].checked = true; // End date
            }
        }
    },
    /**
    *@description Toggles the recurrence pattern
    *@param {string} pattern Daily ('D'), Weekly ('W') or Monthly ('M')
    */
    _showPattern: function(pattern) {
        switch (pattern) {
            case 'D': // Daily
                this.recurrenceHTML.down('[id=applicationtimeEntryScreen_rec_partternRow1]').hide();
                this.recurrenceHTML.down('[id=applicationtimeEntryScreen_rec_partternRow2]').hide();
                this.recurrenceHTML.down('[id=applicationtimeEntryScreen_rec_partternRow3]').hide();
                this.recurrenceHTML.down('[id=applicationtimeEntryScreen_rec_partternRow4]').hide();
                this.recurrenceHTML.down('[id=applicationtimeEntryScreen_rec_patternLabel]').update(global.getLabel('days'));
                break;
            case 'W': // Weekly
                this.recurrenceHTML.down('[id=applicationtimeEntryScreen_rec_partternRow1]').hide();
                this.recurrenceHTML.down('[id=applicationtimeEntryScreen_rec_partternRow2]').hide();
                this.recurrenceHTML.down('[id=applicationtimeEntryScreen_rec_partternRow3]').show();
                this.recurrenceHTML.down('[id=applicationtimeEntryScreen_rec_partternRow4]').show();
                this.recurrenceHTML.down('[id=applicationtimeEntryScreen_rec_patternLabel]').update(global.getLabel('weeks'));
                break;
            case 'M': // Monthly
                this.recurrenceHTML.down('[id=applicationtimeEntryScreen_rec_partternRow1]').show();
                this.recurrenceHTML.down('[id=applicationtimeEntryScreen_rec_partternRow2]').show();
                this.recurrenceHTML.down('[id=applicationtimeEntryScreen_rec_partternRow3]').hide();
                this.recurrenceHTML.down('[id=applicationtimeEntryScreen_rec_partternRow4]').hide();
                this.recurrenceHTML.down('[id=applicationtimeEntryScreen_rec_patternLabel]').update(global.getLabel('months'));
                break;
        }
    },
    /**
    *@description Checks if the max number of occurences was reached
    *@param {Hash} recurrence Recurrence options
    *@returns {Booelan} allow Says if recurrence can be saved
    */
    _checkOccurences: function(recurrence) {
        this.recurrenceDateLimit = "";
        var allow = true;
        var maxOcc = parseInt(global.maximumRecurrences);
        // Number of occurrences filled
        if (Object.isEmpty(recurrence.get('endda'))) {
            var occ = parseInt(recurrence.get('nrocc'));
            if (occ > maxOcc)
                allow = false;
        }
        // End date filled
        else {
            var dtype = recurrence.get('dtype');
            var days = (dtype == 'D') ? 1 : ((dtype == 'W') ? 7 : 31);
            if(dtype == 'D'){
                if( (recurrence.get('nrday')).match(/\D+/) ){  //it's not an integer
                    return true;
                }
            }else{
                if( (recurrence.get('nrweek_month')).match(/\D+/) ){  //it's not an integer
                    return true;
                }       
            }
            var every = (dtype == 'D') ? parseInt(recurrence.get('nrday')) : parseInt(recurrence.get('nrweek_month'));
            if(every == 0){
                return true;
            }       
            var daysFromBegda = maxOcc * days * every;
            var limitDate = Date.parseExact(recurrence.get('range_start'), 'yyyy-MM-dd').addDays(daysFromBegda);
            var endDate = Date.parseExact(recurrence.get('endda'), 'yyyy-MM-dd');
            if (endDate.isAfter(limitDate)) {
                allow = false;
                this.recurrenceDateLimit = limitDate.toString('dd.MM.yyyy');
            }
        }
        return allow;
    },
    
    /**
    *@description it tells us if the number of days/weeks/months and the dates in the recurrence pattern is properly set
    *@param info the information stored in the pop-up   
    *@returns {Boolean} result 
    */
    _checkPatternNumber: function(info) {
        if( info.get('dtype')!="D" ){     // we have set the number of weeks or months
            if( !(info.get('nrweek_month') ).match(/\D+/) ){          //it's an integer
                var number = parseInt( (info.get('nrweek_month') ),10);  //we get the number from the string
                if(number >= 1){
                    info.set('nrweek_month',number);    // in case we have zeros to the left
                    this.recPatNumberWrong = false;
                }else{
                    this.recPatNumberWrong = true;
                }
            }else{                        //it's something different from a positive integer
                this.recPatNumberWrong = true;
            }
        }else {    // we have set the number of days
            if( !(info.get('nrday') ).match(/\D+/) ){          //it's an integer
                var number = parseInt( (info.get('nrday') ),10);  //we get the number from the string
                if(number >= 1){
                    info.set('nrday',number);    // in case we have zeros to the left
                    this.recPatNumberWrong = false;
                }else{
                    this.recPatNumberWrong = true;
                }
            }else{                          //it's something different from a positive integer
                this.recPatNumberWrong = true;
            }
        }
        if( info.get('nrocc')!= "" ){     // we have set the ocurrences   
            this.recDatesOverlapping = false;   
            if( !(info.get('nrocc')).match(/\D+/) ){          //it's an integer     
                var number = parseInt( (info.get('nrocc') ),10);  //we get the number from the string
                if(number >= 1){
                    info.set('nrocc',number);    // in case we have zeros to the left
                    this.recRangeNumberWrong = false;
                }else{
                    this.recRangeNumberWrong = true;
                }
            }else{
                this.recRangeNumberWrong = true;
            }
        }else{                         //we have set the endda           
            this.recRangeNumberWrong = false;
            var beginDate = Date.parseExact(info.get("range_start"),"yyyy-MM-dd");
            var endDate = Date.parseExact(info.get("endda"),"yyyy-MM-dd");
            if( Date.compare(beginDate,endDate) <= 0 ){
                this.recDatesOverlapping = false;
            }else{
                this.recDatesOverlapping = true;
            }
        }
        if(this.recDatesOverlapping || this.recPatNumberWrong || this.recRangeNumberWrong){
            return false;
        }else{
            return true;
        }
    },
    
    /**
    *@description Stores a recurrent event
    *@returns {Hash} check Says if some error has happened setting some values
    */
    _saveRecurrence: function() {
        // Getting frequency properties
        var found = false;
        var dtype = '';
        var recFreqForm = document.recurrenceInfo.rec_frequency;
        var length = recFreqForm.length;
        for (var i = 0; (i < length) && !found; i++)  {
            if (recFreqForm[i].checked) {
                dtype = recFreqForm[i].value;
                found = true;
            }
        }
        var nrday = '';
        var nrweek_month = '0';
        if (dtype == 'D') {
            nrday = this.recurrenceHTML.down('[id=applicationtimeEntryScreen_rec_patternInput]').value;
            if (Object.isEmpty(nrday))
                nrday = '1';
        }
        else {
            nrweek_month = this.recurrenceHTML.down('[id=applicationtimeEntryScreen_rec_patternInput]').value;
            if (Object.isEmpty(nrweek_month))
                nrweek_month = '1';
            if (dtype == 'M') {
                var recMonthlyForm = document.recurrenceInfo.rec_monthly;
                if (recMonthlyForm[0].checked) { // Day selected
                    nrday = this.recurrenceHTML.down('[id=applicationtimeEntryScreen_rec_dayInput]').value;
                    if (Object.isEmpty(nrday))
                        nrday = '1';
                }
                else // Custom selected
                    nrday = document.recurrenceInfo.rec_monthlyList.value;
            }
        }
        var selected_days = new Array();
        if (dtype == 'W') {
            var recPattForm = document.recurrenceInfo.rec_pattern;
            length = recPattForm.length;
            for (var i = 0; i < length; i++)  {
                if (recPattForm[i].checked) {
                    selected_days.push(recPattForm[i].value);
                }
            }
            if (selected_days.length == 0)
                selected_days.push('mon');
        }
        if (dtype == 'M') {
            var recMonthlyForm = document.recurrenceInfo.rec_monthly;
            if (recMonthlyForm[1].checked) // Custom selected
                selected_days.push(document.recurrenceInfo.rec_monthlyDays.value);
        }
        // Getting range properties
        var range_start = this.startDatePicker.actualDate.toString('yyyy-MM-dd');
        found = false;
        var range;
        var nrocc = '';
        var endda = '';
        var recRangForm = document.recurrenceInfo.rec_range;
        length = recRangForm.length;
        for (var i = 0; (i < length) && !found; i++)  {
            if (recRangForm[i].checked) {
                range = recRangForm[i].value;
                found = true;
            }
        }
        if (range == 'A') {
            nrocc = this.recurrenceHTML.down('[id=applicationtimeEntryScreen_rec_rangeInput]').value;
            if (Object.isEmpty(nrocc))
                nrocc = '1';
        }
        else
            endda = this.endDatePicker.actualDate.toString('yyyy-MM-dd');
        // Saving all recurrence properties
        var recurrenceInfo = new Hash();
        recurrenceInfo.set('dtype', dtype);
        recurrenceInfo.set('nrday', nrday);
        recurrenceInfo.set('nrweek_month', nrweek_month);
        recurrenceInfo.set('selected_days', selected_days);
        recurrenceInfo.set('range_start', range_start);
        recurrenceInfo.set('nrocc', nrocc);
        recurrenceInfo.set('endda', endda);
        var check1 = this._checkOccurences(recurrenceInfo);
        var check2 = this._checkPatternNumber(recurrenceInfo);
        if (check1 && check2)
            this.recurrenceInfo = recurrenceInfo;
        var check = new Hash();
        check.set('check1',check1);
        check.set('check2',check2);
        return check;
    },
    /**
    *@description Erases a recurrent event
    */
    _deleteRecurrence: function() {
        this.recurrenceInfo = null;
    },
    /**
    *@description Displays all neccesary fields to create a new recurrent event
    */
    _displayRecurrentEvent: function() {
        //If there's an opened subapplication. We close it.
        if (!Object.isEmpty(global.currentSubApplication)) {
            global.closeSubApplication();
            this.subApp = "NONE";
        }         
        if (this.fieldPanel != null) {
            this.fieldPanelDiv.update("");
            this.fieldPanel.destroy();
            this.fieldPanel = null;
        }
        if (Object.isEmpty(this.recfpjson)) {
            this.recfpjson = deepCopy(this.fpjson);
            // Building new settings for recurrence info
            var settings = this.recfpjson.EWS.o_field_settings.yglui_str_wid_fs_record.fs_fields.yglui_str_wid_fs_field;
            var length = settings.length;
            var changed = 0; // We have to change 4 fields, after that the loop will end
            for (var i = 0; (i < length) && (changed < 4); i++) {
                var fieldtechname = this.fieldtechnames.get(settings[i]['@fieldid']);
                if (fieldtechname == 'BEGDA') {
                    settings[i]['@display_attrib'] = 'HID';
                    settings[i]['@depend_field'] = '';
                    settings[i]['@depend_type'] = '';
                    changed++;
                }
                if (fieldtechname == 'ENDDA') {
                    settings[i]['@display_attrib'] = 'HID';
                    settings[i]['@depend_field'] = '';
                    settings[i]['@depend_type'] = '';
                    changed++;
                }
                // We have to check the fieldid for these fields
                if (settings[i]['@fieldid'] == 'REC_LINK') {
                    settings[i]['@depend_field'] = 'REC_TEXT';
                    changed++;
                }
                if (settings[i]['@fieldid'] == 'REC_TEXT') {
                    settings[i]['@display_attrib'] = 'OPT';
                    changed++;
                }
            }
        }
        // Building new values for recurrence info
        var values = this.recfpjson.EWS.o_field_values.yglui_str_wid_record.contents.yglui_str_wid_content.fields.yglui_str_wid_field;
        length = values.length;
        changed = 0; // We have to change 1 fields, after that the loop will end
        for (var i = 0; (i < length) && (changed < 1); i++) {
            if (values[i]['@fieldid'] == 'REC_TEXT') {
                var text = '';
                var dtype = this.recurrenceInfo.get('dtype');
                var endda = this.recurrenceInfo.get('endda');
                switch (dtype) {
                    case 'D': // Daily
                        var nrday = parseInt(this.recurrenceInfo.get('nrday'));
                        if (Object.isEmpty(endda)) { // Occurences
                            if (nrday > 1)
                                text = global.getLabel('recInfoDaily2');
                            else
                                text = global.getLabel('recInfoDaily1');
                        }
                        else { // End date
                            if (nrday > 1)
                                text = global.getLabel('recInfoDaily4');
                            else
                                text = global.getLabel('recInfoDaily3');
                        }
                        break;
                    case 'W': // Weekly
                        var nrweek_month = parseInt(this.recurrenceInfo.get('nrweek_month'));
                        if (Object.isEmpty(endda)) { // Occurences
                            if (nrweek_month > 1)
                                text = global.getLabel('recInfoWeekly2');
                            else
                                text = global.getLabel('recInfoWeekly1');
                        }
                        else { // End date
                            if (nrweek_month > 1)
                                text = global.getLabel('recInfoWeekly4');
                            else
                                text = global.getLabel('recInfoWeekly3');
                        }
                        break;
                    case 'M': // Monthly
                        var nrweek_month = parseInt(this.recurrenceInfo.get('nrweek_month'));
                        var nrday = parseInt(this.recurrenceInfo.get('nrday'));
                        var selected_days = this.recurrenceInfo.get('selected_days');
                        if (Object.isEmpty(endda)) { // Occurences
                            if (nrweek_month > 1) {
                                if (selected_days.length == 0) // Day (number)
                                    text = global.getLabel('recInfoMonthly3');
                                else { // Day of the week
                                    text = global.getLabel('recInfoMonthly4');
                                }
                            }
                            else {
                                if (selected_days.length == 0) // Day (number)
                                    text = global.getLabel('recInfoMonthly1');
                                else { // Day of the week
                                    text = global.getLabel('recInfoMonthly2');
                                }
                            }
                        }
                        else { // End date
                            if (nrweek_month > 1) {
                                if (selected_days.length == 0) // Day (number)
                                    text = global.getLabel('recInfoMonthly7');
                                else { // Day of the week
                                    text = global.getLabel('recInfoMonthly8');
                                }
                            }
                            else {
                                if (selected_days.length == 0) // Day (number)
                                    text = global.getLabel('recInfoMonthly5');
                                else { // Day of the week
                                    text = global.getLabel('recInfoMonthly6');
                                }
                            }
                        }
                        break;
                    default:
                        text = 'Recurrence info text';
                        break;
                }
                // Text marks
                if (text.include('((range_start))'))
                    text = text.gsub('((range_start))', Date.parseExact(this.recurrenceInfo.get('range_start'), 'yyyy-MM-dd').toString('dd.MM.yyyy'));
                if (text.include('((nrocc))'))
                    text = text.gsub('((nrocc))', this.recurrenceInfo.get('nrocc'));
                if (text.include('((nrday))')) {
                    var number = this.recurrenceInfo.get('nrday');
                    if ((dtype != 'M') || (!text.include('((selected_days))')))
                        text = text.gsub('((nrday))', number);
                    else {
                        if (text.include('((selected_days))')) {
                            var numberText = '';
                            switch (parseInt(number)) {
                                case 1:
                                    text = text.gsub('((nrday))', global.getLabel('first'));
                                    break;
                                case 2:
                                    text = text.gsub('((nrday))', global.getLabel('second'));
                                    break;
                                case 3:
                                    text = text.gsub('((nrday))', global.getLabel('third'));
                                    break;
                                case 4:
                                    text = text.gsub('((nrday))', global.getLabel('forth'));
                                    break;
                                default:
                                    text = text.gsub('((nrday))', global.getLabel('last'));
                                    break;
                            }
                        }
                    }
                }
                if (text.include('((endda))'))
                    text = text.gsub('((endda))', Date.parseExact(this.recurrenceInfo.get('endda'), 'yyyy-MM-dd').toString('dd.MM.yyyy'));
                if (text.include('((selected_days))')) {
                    var days = this.recurrenceInfo.get('selected_days');
                    var lengthD = days.length;
                    var daysText = '';
                    for (var j = 0; j < lengthD; j++) {
                        daysText += global.getLabel(days[j] + 'Day');
                        if (j+1 < lengthD)
                            daysText += ', ';
                    }
                    text = text.gsub('((selected_days))', daysText);
                }
                if (text.include('((nrweek_month))'))
                    text = text.gsub('((nrweek_month))', this.recurrenceInfo.get('nrweek_month'));
                // Setting text
                values[i]['@value'] = text;
                changed++;
            }
        }
        this.eventHash = new Hash();
        for (var i = 0; i < length; i++) {
            if (!Object.isEmpty(values[i]['@fieldtechname']))
                this.eventHash.set(values[i]['@fieldtechname'], values[i]);
            else
                this.eventHash.set(values[i]['@fieldid'], values[i]);
        }
        // Redefined services
        var selectedEmployee = this.employeeId;
        var begda = this.recurrenceInfo.get('range_start');
        var redefinedServices = this._getRedefinedServices(selectedEmployee, begda);
        // Mode will be always edit
        var mode = 'edit';
        //We create the new fieldPanel
        this.fieldPanel = new getContentModule({ 
            mode: mode, 
            json: this.recfpjson, 
            appId: this.appId, 
            predefinedXmls: redefinedServices.get('services'),
            getFieldValueAppend: redefinedServices.get('appends'),
            objectId: this.employeeId,
            showCancelButton: true, 
            buttonsHandlers: this.hashToSaveButtons,
            cssClasses: $H({fieldDispHalfSize: 'fieldDispQuarterSize', fieldDispGroupDiv: 'applicationtimeEntryScreen_alignGroupDiv', fieldDispClearBoth: 'fieldPanelMarginPrevElmnt', fieldDispLabel: 'fieldDisp105Left', gcm_fieldLabel: 'fieldDisp105LeftDisplay' }),
            linkTypeHandlers: $H({REC_LINK: this._displayRecurrenceWindow.bind(this)}),
            fieldDisplayerModified: 'EWS:datePickerCorrectDate_' + this.appId + '10'
        });
        this.fieldPanelDiv.insert(this.fieldPanel.getHtml());
        //Hide the related send document buttons
        var buttonSendDoc = this.fieldPanel.getButton("SCR_SEND_DOCUMENT", null, 1);
        var buttonDocInfo = this.fieldPanel.getButton("SCR_X_UPL_DOC", null, 1);
        var buttonCovInfo = this.fieldPanel.getButton("SCR_X_UPL_COV", null, 1);
        if (!Object.isEmpty(buttonDocInfo) && !Object.isEmpty(buttonSendDoc) && !Object.isEmpty(buttonCovInfo)) {
            buttonDocInfo.hide();
            buttonSendDoc.hide();
            buttonCovInfo.hide();
        }
        //And refresh the related send document buttons
        if (this.sendDocCapability && (this.eventCodes.get('ABS').get('appids').include(this.fieldPanel.appId) || this.eventCodes.get('ATT').get('appids').include(this.fieldPanel.appId)))
            this._manageDocButtons(this.fieldPanel.json);       
        this._checkSelectedEmployees(false);//Disable or not the quotaChecker button
        this.virtualHtml.down('div#' + this.appId + '_1_0_REC_TEXT').addClassName('fieldPanelVisualDepRecurrence');
        this.virtualHtml.down('div#REC_TEXT_' + this.appId + '_1_0').addClassName('fieldPanelVisualDepRecurrenceContainer');
        if ((this.eventCode == 'ABS') || (this.eventCode == 'ATT'))
            this._setDatePickersObservers(true);
    },
    /**
    *@description Removes a recurrence from the screen and returns to a normal event view
    */
    _undisplayRecurrentEvent: function() {
        // Setting eventHash with the previous values
        var previousHash = this.eventHash.clone();
        var values = this.fpjson.EWS.o_field_values.yglui_str_wid_record.contents.yglui_str_wid_content.fields.yglui_str_wid_field;
        this.eventHash = new Hash();
        for (var i = 0; i < values.length; i++) {
            if (!Object.isEmpty(values[i]['@fieldtechname']))
                this.eventHash.set(values[i]['@fieldtechname'], values[i]);
            else
                this.eventHash.set(values[i]['@fieldid'], values[i]);
        }
        var parameters = this.eventHash.keys();
        previousHash.each( function(parameter) {
            if (parameters.indexOf(parameter.key) >= 0) {
                var value = this.eventHash.get(parameter.key);
                value['@value'] = parameter.value['@value'];
                value['#text'] = parameter.value['#text'];
                this.eventHash.set(parameter.key, value);
            }
        }.bind(this));
        // Erasing recurrence text and putting datepickers
        this.recfpjson = null;
        this.fieldPanelDiv.update("");
        this.fieldPanel.destroy();
        this.fieldPanel = null;
        // Redefined services
        var selectedEmployee = this.employeeId;
        var begda = this.eventHash.get('BEGDA')['@value'];
        var redefinedServices = this._getRedefinedServices(selectedEmployee, begda);
        // Mode will be always edit
        var mode = 'edit';
        //We create the new fieldPanel
        this.fieldPanel = new getContentModule({ 
            mode: mode, 
            json: this.fpjson, 
            appId: this.appId, 
            predefinedXmls: redefinedServices.get('services'),
            getFieldValueAppend: redefinedServices.get('appends'),
            objectId: this.employeeId,
            showCancelButton: true, 
            buttonsHandlers: this.hashToSaveButtons,
            cssClasses: $H({fieldDispHalfSize: 'fieldDispQuarterSize', fieldDispGroupDiv: 'applicationtimeEntryScreen_alignGroupDiv', fieldDispClearBoth: 'fieldPanelMarginPrevElmnt', fieldDispLabel: 'fieldDisp105Left', gcm_fieldLabel: 'fieldDisp105LeftDisplay' }),
            linkTypeHandlers: $H({REC_LINK: this._displayRecurrenceWindow.bind(this)}),
            fieldDisplayerModified: 'EWS:datePickerCorrectDate_' + this.appId + '10'
        });
        this.fieldPanelDiv.insert(this.fieldPanel.getHtml());
        //Hide the related send document buttons
        var buttonSendDoc = this.fieldPanel.getButton("SCR_SEND_DOCUMENT", null, 1);
        var buttonDocInfo = this.fieldPanel.getButton("SCR_X_UPL_DOC", null, 1);
        var buttonCovInfo = this.fieldPanel.getButton("SCR_X_UPL_COV", null, 1);
        if (!Object.isEmpty(buttonDocInfo) && !Object.isEmpty(buttonSendDoc) && !Object.isEmpty(buttonCovInfo)) {
            buttonDocInfo.hide();
            buttonSendDoc.hide();
            buttonCovInfo.hide();
        }
        //And refresh the related send document buttons
        if (this.sendDocCapability && (this.eventCodes.get('ABS').get('appids').include(this.fieldPanel.appId) || this.eventCodes.get('ATT').get('appids').include(this.fieldPanel.appId)))
            this._manageDocButtons(this.fieldPanel.json); 
        this._checkSelectedEmployees(false);//Disable or not the quotaChecker button
        // If recurrence link exists, we put it as an inline element
        if (this.virtualHtml.down('div#linkToHandler') && !global.liteVersion)
            this.virtualHtml.down('div#linkToHandler').up().addClassName('inlineElement');
        else if(this.virtualHtml.down('button#linkToHandler') && global.liteVersion)
            this.virtualHtml.down('button#linkToHandler').up().addClassName('inlineElement fieldDispFloatLeft');
        if ((this.eventCode == 'ABS') || (this.eventCode == 'ATT')) {
            this._setDatePickersObservers(true);
            this._correctDateSelected();
        }
    },
    /**
    *@description Returns an error message list from a service
    *@param {JSON} json Information from a service
    *@returns {Array} errorMessages
    */
    _getErrorMessages: function(json) {
        var messages = objectToArray(json.EWS.messages.item);
        var length = messages.length;
        var errorMessages = new Array();
        for (var i = 0; i < length; i++)
            // Text + Type (Error or Warning)
            errorMessages.push(messages[i]['#text'] + messages[i]['@msgty']);
        return errorMessages;
    },
    /**
    *@description Toggles the employee selection (multiselect)
    */
    _toggleSelection: function() {
        this.virtualHtml.down('div#applicationtimeEntryScreen_employeeSelection').toggle();
        this.virtualHtml.down('div#applicationtimeEntryScreen_addSelection').toggle();
        if (!this.comeFromWorkbench) {
            this.virtualHtml.down('div#applicationtimeEntryScreen_advSearch').toggle();
            this.virtualHtml.down('div#applicationtimeEntryScreen_advSearch_icon').toggle();
        }
    },
    /**
    *@description Actions for new employees selection
    */
    _employeeSelected: function() {
        // Refreshing employee counter for fast entries after selections
        var lastSelected = this.multiSelect.selectedElements.last().get('data');
        var searches = this.storedSearches.keys();
        // Stored search
        if (searches.indexOf(lastSelected) >= 0)
            this.selectedSearches.push(lastSelected);
        var empCounter = this.multiSelect.selectedElements.length - this.selectedSearches.length;
        var searchMark = (this.selectedSearches.length > 0) ? "+" : "";
        if (this.advSearch)
            this.virtualHtml.down('span#applicationtimeEntryScreen_employeeCount_text').update("(" + empCounter + searchMark + ")");
        if (this.virtualHtml.down('div#applicationtimeEntryScreen_employeeSelectionContainer').hasClassName('applicationtimeEntryScreen_fieldError'))
            this.virtualHtml.down('div#applicationtimeEntryScreen_employeeSelectionContainer').removeClassName('applicationtimeEntryScreen_fieldError');
        // Refreshing fields depending on employee selections
        this._refreshMultiDependentFields(true);
        this._checkSelectedEmployees(false);
    },
    /**
    *@description Refreshes the employee counter for fast entries after unselections
    */
    _employeeUnselected: function() {
        var selectedElements = this.multiSelect.selectedElements;
        var length = this.selectedSearches.length;
        var searchMark = "";
        if (length > 0) {
            var finish = false;
            for (var i = 0; i < length && !finish; i++) {
                var element = this.selectedSearches[i];
                var length2 = selectedElements.length;
                var found = false;
                for (var j = 0; (j < length2) && !found; j++) {
                    if (selectedElements[j].get('data') == element)
                        found = true;
                }
                if (!found) {
                    this.selectedSearches = this.selectedSearches.without(element);
                    finish = true;
                }
            }
        }
        if (this.advSearch) {
            var empCounter = this.multiSelect.selectedElements.length - this.selectedSearches.length;
            if (this.selectedSearches.length > 0)
                searchMark = "+";
            this.virtualHtml.down('span#applicationtimeEntryScreen_employeeCount_text').update("(" + empCounter + searchMark + ")");
        }
        // Refreshing fields depending on employee selections
        this._refreshMultiDependentFields(true);
        this._checkSelectedEmployees(false);
    },
    /**
    *@description Returns redefined services needed for the fieldPanel
    *@param {String} employee Current employee
    *@param {String} date Current date (format: yyyy-MM-dd)
    *@returns {Hash} newDefinitions
    */
    _getRedefinedServices: function(employee, date) {
        var newDefinitions = new Hash();
        newDefinitions.set('appends', new Hash());
        newDefinitions.set('services', new Hash());
        // Getting selected employees
        var o_employees = "";
        var employees = null;
        if(!this.multiSelect){
            if (!this.isNew || (this.isNew && this.advSearch))
                o_employees = "<YGLUI_STR_HROBJECT PLVAR='' OTYPE='P' OBJID='" + employee + "' />";
            else if (!this.advSearch) {
                employees = this.getSelectedEmployees().keys();
                for (var i = 0; i < employees.length; i++)
                    o_employees += "<YGLUI_STR_HROBJECT PLVAR='' OTYPE='P' OBJID='" + employees[i] + "' />";
            }
        }else{
            employees = this._getEmployeeSelection();
            for (var i = 0; i < employees.length; i++)
                o_employees += "<YGLUI_STR_HROBJECT PLVAR='' OTYPE='P' OBJID='" + employees[i].get('data') + "' />";
        }         
        
        // Using employees coming from the time workbench (if needed)
        if (this.comeFromWorkbench) {
            o_employees = "";
            for (var i = 0; i < this.twbEmployees.length; i++)
                o_employees += "<YGLUI_STR_HROBJECT PLVAR='' OTYPE='P' OBJID='" + this.twbEmployees[i].objectId + "' />";
        }
        // Subtypes
        for (var i = 0; i < this.fieldsDependingOnMulti.length; i++) {
            var fieldId = this.fieldsDependingOnMulti[i];
            newDefinitions.get('appends').set(fieldId, "<O_EMPLOYEES>" + o_employees + "</O_EMPLOYEES>");
        }
        // Cost centers
        var xml2 = "<EWS>" +
                       "<SERVICE>" + this.getCostCentersService + "</SERVICE>" +
                       "<OBJECT TYPE='K'></OBJECT>" +
                       "<PARAM>" +
                           "<DATUM>" + date + "</DATUM>" +
                       "</PARAM>" +
                   "</EWS>";
        newDefinitions.get('services').set('KOSTL', xml2);
        return newDefinitions;
    },
    /**
    *@description Returns the employee selection form code
    *@returns {String} form
    */
    _buildEmployeeSelectionForm: function() {
        var form = "<div id='applicationtimeEntryScreen_employeeSelectionContainer' class='fieldDispTotalWidth'>" +
                       "<div class='application_main_soft_text fieldDisp105Left applicationtimeEntryScreen_employees applicationtimeEntryScreen_newEmployees'>" + global.getLabel('for') + " *" + "</div>";
        if (this.advSearch) {
            form += "<div id='applicationtimeEntryScreen_employeeSelectionInfo'>" +
                        "<div id='applicationtimeEntryScreen_employeeIcon' class='applicationtimeEntryScreen_employeesIcon'></div>" +
                        "<div id='applicationtimeEntryScreen_employeeCount' class='inlineContainer'><span id='applicationtimeEntryScreen_employeeCount_text' class='inlineElement'></span></div>" +
                    "</div>";
            this.employeeSelectionErrorMessage = new Element (
                'span',{
                    'id':'applicationtimeEntryScreen_externalPersonsErrorMessage',
                    'class':'application_main_error_text inlineElement'                    
                }
            );
            this.employeeSelectionErrorMessage.hide();
            this.employeeSelectionErrorMessage.update(global.getLabel("extSelErrorMsg"));
        }
        form += "<div id='applicationtimeEntryScreen_employeeSelection'";
        if (this.advSearch)
            form += " class='applicationtimeEntryScreen_employeeSelectionFast'";
        form += "></div>" +
                "<div class='fieldDispTotalWidth applicationtimeEntryScreen_employeeSelectionBorder'></div>";
        var selectionButtonText = this.comeFromWorkbench ? global.getLabel('initialSelection') : global.getLabel('addmysel');
        if (!this.advSearch)
            form += "<div id='applicationtimeEntryScreen_addSelection' class='application_action_link'>" + selectionButtonText + "</div>";
        form += "</div>";
        if (this.advSearch)
            form += "<div id='applicationtimeEntryScreen_addSelection' class='application_action_link'>" + selectionButtonText + "</div>" +
                    "<div class='application_catalog_image' id='applicationtimeEntryScreen_advSearch_icon'></div>" +
                    "<div id='applicationtimeEntryScreen_advSearch' class='application_action_link'>" + global.getLabel('advSearch') + "</div>";
        return form;              
    },
    /**
    *@description Builds the multiselect for employee selection
    */
    _buildMultiselect: function() {
        // Creating the data set with the format autocompleter.object
        this.jsonMultiselect = { autocompleter: { object: $A() } };
        var employeeList;
        if (this.comeFromWorkbench) {
            employeeList = new Array();
            for (var i = 0, length = this.twbEmployees.length; i < length; i++) {
                employeeList.push({
                    objectId: this.twbEmployees[i].objectId,
                    objectType: 'P',
                    name: this.twbEmployees[i].name
                });
            }
        }
        else
            employeeList = this.getPopulation();
        if (this.advSearch && !Object.isEmpty(this.advSearchId))
            this._getStoredSearches(employeeList);
        else {
            // Inserting employees
            for (var i = 0; i < employeeList.length; i++) {
                if (employeeList[i].objectType == 'P') {
                    this.jsonMultiselect.autocompleter.object.push({
                        data: employeeList[i].objectId,
                        text: employeeList[i].name
                    })
                }
            }
            // Multiselect creation
            this.multiSelect = new MultiSelect('applicationtimeEntryScreen_employeeSelection', {
                autocompleter: {
                    showEverythingOnButtonClick: false,
                    timeout: 5000,
                    templateResult: '#{text}',
                    minChars: 1
                },
                events: $H({onResultSelected: 'EWS:autocompleterResultSelected_applicationtimeEntryScreen_employeeSelected',
                            onRemoveBox: 'EWS:autocompleterResultSelected_applicationtimeEntryScreen_employeeUnselected'})
            }, this.jsonMultiselect);
        }
    },
    /**
    *@description Gets stored searches from the backend
    *@param {Array} employeeList Employee list
    */
    _getStoredSearches: function(employeeList) {
        var xml = "<EWS>" +
                      "<SERVICE>" + this.getStoredSearchesService + "</SERVICE>" +
                      "<PARAM><sadv_id>" + this.advSearchId + "</sadv_id></PARAM>" +
                  "</EWS>";
        this.makeAJAXrequest($H({ xml: xml, successMethod: '_setStoredSearches', ajaxID: { employeeList: employeeList } }));
    },
    /**
    *@description Insert stored searches into employee selection form
    *@param {JSON} json Information from GET_SHLP_LST service
    *@param {Hash} ID Request ID (with employee list)
    */
    _setStoredSearches: function(json, ID) {
        var employeeList = ID.employeeList;
        // Inserting employees
        for (var i = 0; i < employeeList.length; i++) {
            if (employeeList[i].objectType == 'P') {
                this.jsonMultiselect.autocompleter.object.push({
                    data: employeeList[i].objectId,
                    text: employeeList[i].name
                })
            }
        }
        // Inserting stored searches
        if (Object.jsonPathExists(json, 'EWS.o_sadv_h.item')) {
            var searchList = objectToArray(json.EWS.o_sadv_h.item);
            for (var i = 0; i < searchList.length; i++) {
                var searchId = searchList[i]['@sadv_id'] + "_" + searchList[i]['@seqnr'];
                this.jsonMultiselect.autocompleter.object.push({
                    data: searchId,
                    text: searchList[i]['#text']
                });
                this.storedSearches.set(searchId, searchList[i]);
            }
        }
        // Multiselect creation
        this.multiSelect = new MultiSelect('applicationtimeEntryScreen_employeeSelection', {
            autocompleter: {
                showEverythingOnButtonClick: false,
                timeout: 5000,
                templateResult: '#{text}',
                minChars: 1
            },
            events: $H({onResultSelected: 'EWS:autocompleterResultSelected_applicationtimeEntryScreen_employeeSelected',
                        onRemoveBox: 'EWS:autocompleterResultSelected_applicationtimeEntryScreen_employeeUnselected'})
        }, this.jsonMultiselect);
        this.virtualHtml.down('span#applicationtimeEntryScreen_employeeCount_text').observe('click', this._toggleSelection.bind(this));
        this.virtualHtml.down('span#applicationtimeEntryScreen_employeeCount_text').addClassName('application_action_link');
        this._addMySelection(false);     // it adds the preselected employees to the event selection
    },
    /**
    *@description Creates a PopUp asking if you are sure to create a full day absence/attendance
    *@param buttonInfo: json Button's information
    */
    _confirmationFullDayEventPopUp: function(buttonInfo) {
        var contentHTML = new Element('div');
        var labelSubmitSure = (this.eventCode == "ABS") ? global.getLabel("FullDayAbsenceSure") : global.getLabel("FullDayAttendanceSure");
        labelSubmitSure += "<br/>";
        contentHTML.insert(labelSubmitSure);
        // Now, we create the popUp and the buttons
        var buttonsJson = {
            elements: [],
            mainClass: 'moduleInfoPopUp_stdButton_div_left'
        };
        var callBack = function() {
            timeEntryPopUp.close();
            delete timeEntryPopUp;
            this._submitActionsFinally(buttonInfo);
        } .bind(this);
        var callBack2 = function() {
            timeEntryPopUp.close();
            delete timeEntryPopUp;
        };          
        var aux = {
            idButton: 'Yes',
            label: global.getLabel('yes'),
            handlerContext: null,
            className: 'moduleInfoPopUp_stdButton',
            handler: callBack,
            type: 'button',
            standardButton: true
        };
        var aux2 = {
            idButton: 'No',
            label: global.getLabel('no'),
            handlerContext: null,
            className: 'moduleInfoPopUp_stdButton',
            handler: callBack2,
            type: 'button',
            standardButton: true
        };
        buttonsJson.elements.push(aux);
        buttonsJson.elements.push(aux2);
        var ButtonObj = new megaButtonDisplayer(buttonsJson);
        var buttons = ButtonObj.getButtons();
        // Insert buttons in div
        contentHTML.insert(buttons);
        var width = 350;
        if (this.advSearch)
            var width = 550;
        var timeEntryPopUp = new infoPopUp({
            closeButton: $H({
                'textContent': global.getLabel('close'),
                'callBack': function() {
                    timeEntryPopUp.close();
                    delete timeEntryPopUp;
                }
            }),
            htmlContent: contentHTML,
            indicatorIcon: 'information',
            width: width
        });
        timeEntryPopUp.create();
    },
    /**
    *@description Refresh the docIds before do the submit actions
    *@param {buttonInfo} json Button's information
    */
    _docIdsRefresh: function(buttonInfo, json) {
        var docIdJson =  new Array();
        if (!Object.isEmpty(json) && !Object.isEmpty(json.EWS.o_doc_list))
            docIdJson = objectToArray(json.EWS.o_doc_list.yglui_str_ecm_content_id);
        for (var i = 0; i < docIdJson.length; i++)
            this.sendDocumentInfo.push(docIdJson[i]['@content_id']);
        this.sendDocumentInfo = this.sendDocumentInfo.uniq();
        this._submitActions(buttonInfo);        
    },
    /**
    *@description Handler for submit button and check if it has to show a popUp. Firstly we need to check if all mandatorty documents were uploaded in ABS/ATT
    *@param {buttonInfo} json Button's information
    */
    _submitActions: function(buttonInfo) {
        var begda = this.eventHash.get('BEGDA')['@value'];
        var endda = this.eventHash.get('ENDDA')['@value'];
        if ((this.eventCode == "ABS" || this.eventCode == "ATT") && !this.areAllMandatoryUploaded){
            //Create the popup to indicate that not all mandatory documents were uploaded
            var popUpInfo = new Element('div').update(global.getLabel('NO_ALL_DOC'));
            var popUp = new infoPopUp({closeButton: $H({
                  'callBack': function() {
                      popUp.close();
                      delete popUp; 
                  }
                }),
                htmlContent : popUpInfo,
                indicatorIcon : 'exclamation',
                width : 600
            });
            popUp.create();
        }
        else if ((this.eventCode == "ABS" || this.eventCode == "ATT") && (begda != endda))
            this._confirmationFullDayEventPopUp(buttonInfo);
        else
            this._submitActionsFinally(buttonInfo);
    },
    /**
    *@description Handler for submit button
    *@param {buttonInfo} json Button's information
    */
    _submitActionsFinally: function(buttonInfo) {
        var length = this._getEmployeeSelection().length;
        if (!this.advSearch || (this.advSearch && (this.selectedSearches.length == 0) && (length <= this.maxEmpSelected)))
            this._eventAction(buttonInfo['@action'], buttonInfo['@okcode'], buttonInfo['@type'], buttonInfo['@label_tag']);
        else
            this._confirmationMessage(buttonInfo['@action'], buttonInfo['@okcode'], buttonInfo['@type'], buttonInfo['@label_tag']);
    },
    /**
    *@description Returns all selected employees in the multiselect (only employees)
    *@returns {Array} employees
    */
    _getEmployeeSelection: function() {
        var employees;
        if (this.eventKey == "") { // New event -multiselect-
            if (this.employeeRestriction) // Special user (like manager)
                employees = this.multiSelect.getSelected();
            else {
                var employee = new Hash();
                employee.set('data', global.objectId);
                employee.set('text', this.getEmployee(global.objectId).name);
                employees = new Array();
                employees.push(employee);
            }
        }
        else { // Existing event -fixed employee-
            var employee = new Hash();
            var employeeInfo = this.eventHash.get('PERNR')['@value'];
            if (employeeInfo.include('[')) {
                employee.set('data', employeeInfo.substring(employeeInfo.indexOf('[') + 1, employeeInfo.indexOf(']')));
                employee.set('text', employeeInfo.substring(0, employeeInfo.indexOf('[') - 1));
            }
            else {
                employee.set('data', employeeInfo);
                employee.set('text', '');
            }
            employees = new Array();
            employees.push(employee);
        }
        return employees;
    },
    /**
    *@description Refreshes the multiselect after an adv. search
    *@param {Object} args Says if the adv. search was launched from the left menu (true) or from other app (false)
    */
    _refreshMultiselect: function(args) {
        var arguments = getArgs(args);
        var markAsSelected = !arguments.get('comeFromMenu');
        if (!markAsSelected) {
            this.jsonMultiselect = { autocompleter: { object: $A() } };
            var employeeList = this.getPopulation();
            // Inserting employees
            var length = employeeList.length;
            for (var i = 0; i < length; i++) {
                this.jsonMultiselect.autocompleter.object.push({
                    data: employeeList[i].objectId,
                    text: employeeList[i].name
                })
            }
            this.storedSearches.each(function(search) {
                var searchId = search.value['@sadv_id'] + "_" + search.value['@seqnr'];
                this.jsonMultiselect.autocompleter.object.push({
                    data: searchId,
                    text: search.value['#text']
                })
            }.bind(this));
            this.multiSelect.updateInput(this.jsonMultiselect);
        }
        else {
            var employeesAdded = arguments.get('employeesAdded');
            var currentEmployees = deepCopy(this.jsonMultiselect.autocompleter.object);
            length = currentEmployees.length;
            var newEmployees = new Array();
            employeesAdded.each( function(employee) {
                var found = false;
                for (var i = 0; (i < length) && !found; i++) {
                    if (employee.key == currentEmployees[i].data)
                        found = true;
                }
                if (!found) {
                    this.jsonMultiselect.autocompleter.object.push({
                        data: employee.key,
                        text: employee.value.name
                    });
                }
                newEmployees.push(employee);
            }.bind(this));
            this.multiSelect.updateInput(this.jsonMultiselect);
            length = newEmployees.length;
            for (var i = 0; i < length; i++) {
                var data = new Hash();
                data.set('data', newEmployees[i].key);
                data.set('text', newEmployees[i].value.name);
                this.multiSelect.createBox(data);
                this.multiSelect.removeElementJSON(data, false);
            }
            this.virtualHtml.down('span#applicationtimeEntryScreen_employeeCount_text').update("(" + this.multiSelect.selectedElements.length + ")");
        }
        this._refreshMultiDependentFields(true);
    },
    /**
    *@description Opens the advanced search
    */
    _advSearch: function() {
        global.open( $H({
            app: {
                tabId: "POPUP",
                appId: "ADVS",
                view: "AdvancedSearch"
            },
            sadv_id: this.advSearchId,
            addToMenu: false
        }));
    },
    /**
     * @description Returns an event json with essential information
     * @param {String} appId Event's type
     * @param {String} date Event's date
     * @returns {Hash} Event hash
     */
    _getEmptyEvent: function(appId, date) {
        var eventProperties = new Hash();
        eventProperties.set('APPID', {
            'text': appId
        });
        eventProperties.set('BEGDA', {
            'value': date
        });
        eventProperties.set('ENDDA', {
            'value': date
        });
        return eventProperties;
    },
    /**
     * @description Shows/Hides the radio button group if BEGDA and ENDDA are different (for ABS & ATT)
     */
    _correctDateSelected: function( args) {
        var changed = false;
        if (!Object.isEmpty(args)) {
            var elements = getArgs(args);
            var field_changed = elements.fieldName;
            if (field_changed.include('BEGDA') || field_changed.include('ENDDA'))
                var changed = true;
        }
        if (changed || !this.radio_changed || (!this.isNew && !this.radio_changed)) {
            var begda = this.eventHash.get('BEGDA')['@value'];
            var endda = this.eventHash.get('ENDDA')['@value'];
            
            var radioButton = this.fieldPanel.objectPrimaryFields.groupsRadioButtonsHash.get('RADIO_G01').radioElementsHtml;
            var radio_keys = radioButton.keys();
            
            var editable = (this.eventHash.get('EDITABLE')['@value'] == 'X') ? true : false;
            if (this.eventHash.get('DISPLAY'))
                editable = editable && (this.eventHash.get('DISPLAY')['@value'] != 'X');
                
            if ((begda == endda) && ((this.isNew) || editable)) {
                for (var i = 0; i < radio_keys.size(); i++)
                    radioButton.get(radio_keys[i]).radioElement.writeAttribute('disabled', false);
            }
            if ((begda != endda)) {
                for (var i = 0; i < radio_keys.size(); i++) {
                    radioButton.get(radio_keys[i]).radioElement.writeAttribute('disabled', true);
                    if (radioButton.get(radio_keys[i]).radioElement.siblings()[0] != null){
                        if(radioButton.get(radio_keys[i]).radioElement.siblings()[0].id.include('ALLDF')){
                            radioButton.get(radio_keys[i]).radioElement.defaultChecked = true;
                            radioButton.get(radio_keys[i]).radioElement.checked = true;
                        }else{
                            radioButton.get(radio_keys[i]).radioElement.defaultChecked = false;
                            radioButton.get(radio_keys[i]).radioElement.checked = false;
                        }
                    }
                    else{    
                        radioButton.get(radio_keys[i]).radioElement.checked = false;
                        radioButton.get(radio_keys[i]).radioElement.defaultChecked = false;
                    }
                }
                this.fieldPanel.objectPrimaryFields.groupsRadioButtonsHash.get('RADIO_G01').selectRadioButton(1);
                // Getting group options
                var radioButtons = this.radioGroup.keys();
                var r_length = radioButtons.size();
                for (var i = 0; i < r_length; i++) {
                    var fieldOptionName = radioButtons[i].gsub('RADIO', 'OPT');
                    // Setting All Day as checked option
                    if (fieldOptionName == this.alldfGroup)
                        this.eventHash.get(fieldOptionName)['@value'] = 'X';
                    // Unsetting other options
                    else
                        this.eventHash.get(fieldOptionName)['@value'] = '';
                }
            }
            this.radio_changed = true;
        }
    },
    /**
    *@description Refreshes all fields depending on employee selection (multiselect)
    */
    _refreshMultiDependentFields: function(multiselect) {
        // Selected employees
        var o_employees = "";
        if (!this.isNew) {
            var employee = (this.getSelectedEmployees().keys().length == 1) ? this.getSelectedEmployees().keys()[0] : this.employeeId;
            o_employees = "<YGLUI_STR_HROBJECT PLVAR='' OTYPE='P' OBJID='" + employee + "' />";
        }
        else {
            if (this.comeFromWorkbench) {
                for (var i = 0, length = this.twbEmployees.length; i < length; i++)
                    o_employees += "<YGLUI_STR_HROBJECT PLVAR='' OTYPE='P' OBJID='" + this.twbEmployees[i].objectId + "' />";
            }
            else {
                //we check out if we have to take the employees from multiselect
                if(!multiselect){
                    var employees = this.getSelectedEmployees().keys();
                }else{
                    var employeesSelected = this.multiSelect.getSelected();
                    var employees = $A();
                    for(var i = 0; i < employeesSelected.length; i++){      
                        employees.push(employeesSelected[i].get("data"));
                    }
                }
                for (var i = 0; i < employees.length; i++) {
                    var element = employees[i]; //this.getSelectedEmployees().get(this.getSelectedEmployees().keys()[i]).id;
                    // We don't want stored searches
                    if (this.selectedSearches.indexOf(element) < 0)
                        o_employees += "<YGLUI_STR_HROBJECT PLVAR='' OTYPE='P' OBJID='" + element + "' />";
                }
                // If there aren't employees selected (only searches), we use the logged one
                if (Object.isEmpty(o_employees) && (length > 0))
                    o_employees = "<YGLUI_STR_HROBJECT PLVAR='' OTYPE='P' OBJID='" + this.employeeId + "' />";
            }
        }
        // Subtypes
        for (var i = 0; i < this.fieldsDependingOnMulti.length; i++) {
            var fieldId = this.fieldsDependingOnMulti[i];
            this.fieldPanel.setXMLToAppendForField(fieldId, "<O_EMPLOYEES>" + o_employees + "</O_EMPLOYEES>");
            // Field refresh
            this.fieldPanel.refreshField(fieldId);
        }
    },
    /**
    *@description Disables/Enables datePickers' observers
    *@param enable, Says if observers will be enabled (true) or not (false)
    */
    _setDatePickersObservers: function(enable) {
        if (enable) // Always screen = 1 & record = 0 --> "10"
            Event.observe( document, 'EWS:datePickerCorrectDate_' + this.appId + '10', this.timeEntryCorrectDateBinding);
        else // Always screen = 1 & record = 0 --> "10"
            Event.stopObserving( document, 'EWS:datePickerCorrectDate_' + this.appId + '10', this.timeEntryCorrectDateBinding);
    },
    /**
    *@description: it returns the status code of the event or null if is empty
    *@param args: args which we open the application with    
    */
    _getEventStatus: function(args){        
        var isNew = Object.isEmpty(args.get('eventInformation'));
        if(!isNew){
            var eventInformation = args.get('event');
            var eventFields = eventInformation.EWS.o_field_values.yglui_str_wid_record.contents.yglui_str_wid_content.fields.yglui_str_wid_field;
            var element = this._getArrayElement(eventFields,"@fieldtechname","STATUS");
            var status = element["@value"];        
            return status;
        }
        return "?";
    },
    /**
    *@description: it returns the element of an array which has got a specific parameter with a specific value
    *@param array: our array of elements   
    *@param parameter: the specific parameter
    *@param value: the specific value     
    */
    _getArrayElement: function(array,parameter,value){              
        for(i=0;i<array.length;i++){
            if(array[i][parameter] == value){
                return array[i];
            }
        }
        return null;
    },
    /**
    *@description: Check the number of employees selected and show/hide the quota checker and send document buttons.
    *@firsTime: Indicates if it's first time to be called the timeEntryScreen. If true the fieldPanel isn't built yet.
    *@return: True if the number if selected employees is one, false in other case.    
    */
    _checkSelectedEmployees: function(firstTime){
        var numSelEmpl; //Number of selected employees
        if (!this.employeeRestriction)//Only one employee exist in multiselect
            numSelEmpl = 1;
        else if(this.isNew && firstTime)
            numSelEmpl = this.getSelectedEmployees().keys().length;
        else if (this.isNew && !firstTime)
            numSelEmpl = this.multiSelect.selectedElements.length;
        else              
            numSelEmpl = 1;
        //Buttons to be showed or hidden
        var quotaCheckButton = this.fieldPanel.getButton("SCR_QUOTA_CHECK", null, 1);
        var buttonSendDoc = this.fieldPanel.getButton("SCR_SEND_DOCUMENT", null, 1);
        var buttonDocInfo = this.fieldPanel.getButton("SCR_X_UPL_DOC", null, 1);
        // Check for quotaChecker button
        if(!Object.isEmpty(quotaCheckButton)){
            if (numSelEmpl == 1){
                quotaCheckButton.show();
                quotaCheckButton.update(global.getLabel("showQuotaCheck"));
            }else{
                quotaCheckButton.hide();  
            }
        }
        //Check for related send documents buttons
        if(this.sendDocCapability && !Object.isEmpty(buttonDocInfo) && !Object.isEmpty(buttonSendDoc)){
            if (numSelEmpl == 1) {
                buttonSendDoc.show();
                if (this.numUploadedDocs > 0)
                    buttonDocInfo.show();
            }
            else {
                buttonDocInfo.hide(); 
                buttonSendDoc.hide();   
            }
        }
        //Close the quotaChecker subapplication if it's opened
        if(this.subApp == "QUOTA"){
            global.closeSubApplication();
            this.subApp = "NONE";
        }
        if (numSelEmpl == 1) 
            return true;
        else
            return false;
    },
    /**
    *@description: show the quota checker
    */
    _toggleQuotaChecker: function(button){
        //Get parameters for the QUOTA_CHECKER FUNCTION
        var structure = this.fpjson.EWS.o_field_values.yglui_str_wid_record.contents.yglui_str_wid_content.fields.yglui_str_wid_field;
        var idAbsAtt = "", startDate = "", endDate = "";
        var buttonQuotaCheck = this.fieldPanel.getButton("SCR_QUOTA_CHECK", null, 1);
        var buttonTeamCal = this.fieldPanel.getButton("SCR_TEAM_CAL", null, 1);
        var buttonSendDoc = this.fieldPanel.getButton("SCR_SEND_DOCUMENT", null, 1);
        var textTeamCal = Object.isEmpty(buttonTeamCal) ? '' : buttonTeamCal.innerHTML;
        var textQuotaCheck = buttonQuotaCheck.innerHTML;
        var textSendDoc = Object.isEmpty(buttonSendDoc) ? '' : buttonSendDoc.innerHTML;
        var cont = 0;

       //Sets the selected employee Id
        var emploId ;
        if(!this.employeeRestriction)
            emploId = this.employeeId;
        else
            emploId = this.isNew ? this.multiSelect.selectedElements[0].get('data') : this.employeeId;
        
        for (var i=0, length=structure.length; i < length && cont < 3; i++){
            if(structure[i]["@fieldtechname"] == "AWART"){
                idAbsAtt = structure[i]["@value"];
                cont ++;
            }
            if(structure[i]["@fieldtechname"] == "BEGDA"){
                startDate = structure[i]["@value"];
                cont ++;
            }
            if(structure[i]["@fieldtechname"] == "ENDDA"){
                endDate = structure[i]["@value"];
                cont ++;
            }
        }

        //Switch the QUOTA_CHECK subapplication and check if the mandatory field are filled.
        if (this.subApp != "QUOTA" && this.fieldPanel.validateForm(1, null).correctForm) {
            var keepSubOpened = false;
            if (this.comeFromInbox) {
                keepSubOpened = true;
                if (!Object.isEmpty(global.currentSubSubApplication))
                    global.closeSubSubApplication();
            }
            if (!this.comeFromInbox && !Object.isEmpty(global.currentSubApplication))
                global.closeSubApplication();
            global.open( $H({
	            app: {
	                appId: button['@tarap'],
	                tabId: "SUBAPP",
	                view: button['@views']
	            },
                empId: emploId,
                appId: this.appId,
                absattId: idAbsAtt,
                begda: startDate,
                endda: endDate,
                keepSubOpened: keepSubOpened
	        }));
            this.subApp = "QUOTA";
            textQuotaCheck = global.getLabel("hideQuotaCheck");
            textTeamCal = global.getLabel("showTeamCal");
            textSendDoc = global.getLabel("ST_DOC");
        }
        else if (this.subApp == "QUOTA") {
            if (!this.comeFromInbox)
                global.closeSubApplication();
            else
                global.closeSubSubApplication();
            this.subApp = "NONE";
            //Change the button text to "show"
            textQuotaCheck = global.getLabel("showQuotaCheck");
            textTeamCal = global.getLabel("showTeamCal");
            textSendDoc = global.getLabel("ST_DOC");
        }
        if(!Object.isEmpty(buttonQuotaCheck))
            buttonQuotaCheck.update(textQuotaCheck);
        if(!Object.isEmpty(buttonTeamCal))
            buttonTeamCal.update(textTeamCal);
        if(!Object.isEmpty(buttonSendDoc))
            buttonSendDoc.update(textSendDoc);
                
        //Set the button show/hide team Calendar and show/hide Quota Checker to the fieldPanel
        var buttons = objectToArray(this.fpjson.EWS.o_screen_buttons.yglui_str_wid_button);
        for (var i=0, length = buttons.length; i < length; i++) {
            if (buttons[i]['@action'] == 'SCR_TEAM_CAL')
                buttons[i]['@label_tag'] = textTeamCal;
            else if (buttons[i]['@action'] == 'SCR_QUOTA_CHECK')
                buttons[i]['@label_tag'] = textQuotaCheck;
        }
    },
    /**
    *@description: it removes the button specified in the okcode param
    *@param fpjson: the fieldPanel json
    *@param okcode: okcode of the button
    */
    _removeButton: function(fpjson, okcode){
        var buttonsArray = fpjson.EWS.o_screen_buttons.yglui_str_wid_button;
        var buttonIndex = this._getElementIndex(buttonsArray, "@okcode", okcode);
        if (buttonIndex != -1) //button found
            buttonsArray.splice(buttonIndex,1);
    },
    /**
    *@description: it sets the showinDisplay attribute of the button specified with okCode to true
    *@param fpjson: the fieldPanel json
    *@param okcode: okcode of the button
    */
    _changeButton: function(fpjson, okcode){
        var buttonsArray = fpjson.EWS.o_screen_buttons.yglui_str_wid_button;
        var buttonIndex = this._getElementIndex(buttonsArray, "@okcode", okcode);
        if (buttonIndex != -1) //button found
            buttonsArray[buttonIndex]['@showindisplay'] = "X";
    },    
    /**
    *@description: it gets the index of the searched element
    *@param buttonsArray: the array of elements
    *@param parameter: the name of the parameter
    *@param value: the value of the parameter
    */
    _getElementIndex: function(buttonsArray,parameter,value){                          
        for (i = 0; i < buttonsArray.length; i++) {
            if (buttonsArray[i][parameter] == value)
                return i;
        }
        return -1;
    },
    /**
    * @description Gets a request's information
    * @param {Hash} args Object from the previous application
    */
    _getRequest: function(args) {
        this.employeeId = args.get('req_bp');
        this.employeeName = args.get('req_bn');
        this.appId = args.get('app').appId;
        var requestId = args.get('req_id');
        var objectType = args.get('req_bt');
        var xml = "<EWS>" + 
                      "<SERVICE>" + this.getRequestService + "</SERVICE>" +
                      "<OBJECT TYPE='" + objectType + "'>" + this.employeeId + "</OBJECT>" +
                      "<PARAM>" +
                          "<req_id>" + requestId + "</req_id>" +
                      "</PARAM>" +
                  "</EWS>";
        this.makeAJAXrequest($H({ xml: xml, successMethod: '_displayRequest' }));
    },
    /**
    * @description Displays a request
    * @param {JSON} json Information from GET_CONTENT2 service
    */
    _displayRequest: function(json) {
        this.getContentEvent = json;
        // Getting event codes (filter)
        this.eventCodes = new Hash();
            var filter = objectToArray(json.EWS.o_li_incapp.yglui_str_incap2);
            for (var i = 0, length = filter.length; i < length; i++) {
                var event = filter[i]['@event'];
                var appId = filter[i]['@appid'];
                if (!this.eventCodes.keys().include(event)) {
                    var appIds = new Array();
                    appIds.push(appId);
                    var properties = new Hash();
                    properties.set('appids', appIds);
                    this.eventCodes.set(event, properties);
                }
                else
                    this.eventCodes.get(event).get('appids').push(appId);
            }
        // Deleting buttons
        delete json.EWS.o_field_values.yglui_str_wid_record.contents.yglui_str_wid_content.buttons;
        this._displayEvent();
    },
    /**
    *@description Disable the datepickers with the retro/future dates. 
    *@param field: getContentModule where the datepickers are.
    */
    _setRetroFuture: function(field){
        //Getting all the fieldDisplayers
        if(this.retroFutureDates){
            var fields_disp = field.getAllFieldDisplayers();
            if(!Object.isEmpty(fields_disp) && fields_disp.size() > 0){
                var fields_keys = fields_disp.keys(); 
                for( var i=0; i<fields_keys.length; i++){
                    var elem = fields_disp.get(fields_keys[i]);
                    var elem_dp = elem._moduleInstance;
                    //Check if it's a datePicker field
                    if(elem.options.fieldType == "fieldTypeDate" && elem_dp && elem_dp.containerDiv.id.include('BEGDA'))
                        //Delimiting the rank only for the BEGDA datepicker
                        elem_dp.updateRange(this.retroFutureDates[1].toString("yyyyMMdd"), this.retroFutureDates[0].toString("yyyyMMdd"));
                }
            }
        }
    }
});