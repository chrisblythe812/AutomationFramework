/**
* @fileOverview timeSheet.js
* @description It contains a class with functionality for showing an employee's timesheet for a given date.
*/
/**
* @constructor
* @description Class with functionality for showing an employee's timesheet for a given date.
* @augments Application
*/
var timeSheet = Class.create(Application,
/** 
*@lends timeSheet
*/
{
/**
* Constructor of the class timeSheet
*/
initialize: function($super, args) {
    $super(args);
    this.comeFrom = '';
    this.getReqDataService = 'GET_PT_REQDATA';
    this.getTimesheetService = 'GET_TIMESHEET';
    this.getSubtypesService = 'TSH_SUBTYPES';
    this.saveTimesheetService = 'SAVE_TIMESHEET';
    this.getCostCentersService = 'GET_CC';
    this.dateFormat = 'yyyy-MM-dd';
    this.refresh = false;
    this.headedInserted = false;
    this.headedInserted_read = false;
    this.refreshTimesheetBinding = this._refreshTimesheet.bindAsEventListener(this);
    // Labels
    this.copyLabel = global.getLabel('copy');
    this.pasteLabel = global.getLabel('paste');
    this.addLabel = global.getLabel('add');
    this.removeLabel = global.getLabel('remove');
    this.approvalLabel = global.getLabel('status_P');
    this.deletionLabel = global.getLabel('status_D');
    this.tbpLabel = global.getLabel('status_TBP');
    this.draftLabel = global.getLabel('draft');
    this.access = 0;
    this.fristTimeComeFrom = '';
    //To know if there are modifications and we have to save the new timesheet
    this.changesToSave = false;
},
/**
* @description Starts timeSheet
*/
run: function($super, args) {
    $super(args);
    if (args) {
        this.comeFrom = args.get('comingFrom');
        if (this.comeFrom == 'inbox') {
            this.requesterId = args.get('req_bp');
            this.requestTaskId = args.get('req_id');
            this.inboxModeUPD = true;
        }
    }
    if (this.access == 0) {
        this.access++;
        this.firstTimeComeFrom = this.comeFrom;
    }
    else if (this.access == 1) {
        if (this.firstTimeComeFrom != this.comeFrom) {
            this.firstRun = true;
            this.access++;
        }
    }
    if (this.comeFrom == 'inbox') {
        var headerDivTSH = $('applicationtimeSheet_header');
        if (headerDivTSH)
            headerDivTSH.hide();
        var bodyDivTSH = this.bodyDiv; //$('applicationtimeSheet_body');
        if (bodyDivTSH)
            bodyDivTSH.hide();
        var headerDivTSH_read = this.header_read; //$('applicationtimeSheet_read_header');
        if (headerDivTSH_read)
            headerDivTSH_read.show();
        var bodyDivTSH_read = this.read_bodyDiv; //$('applicationtimeSheet_read_body');
        if (bodyDivTSH_read)
            bodyDivTSH_read.show();
        if (this.firstRun) {
            // Initial date: today
            this.currentDate = new Date();
            // Collision date
            this.collisionDate = null;
            // Time types for each employee
            this.timeTypes = new Hash();
            // Cost centers
            this.costCenters = null;
            // Clipboard
            this.clipboard = new Hash();
            // Buttons
            this.buttons = null;
            // Says if we have to show cost centers or not
            this.showCC = false;
            // Current timesheet
            this.currentTimesheet = null;
            this._setInitialHTML_read();
        }
        if (Object.isEmpty(this.timeTypes.get(this.requesterId)))
            this._getTimeTypes();
        this._getReqData(this.requestTaskId);
        this._resetClipboard();
    } //comeFrom inbox

    else {
        var headerDivTSH_read = this.header_read; //$('applicationtimeSheet_read_header');
        if (headerDivTSH_read)
            headerDivTSH_read.hide();
        var bodyDivTSH_read = this.read_bodyDiv; //$('applicationtimeSheet_read_body');
        if (bodyDivTSH_read)
            bodyDivTSH_read.hide();

        var headerDivTSH = $('applicationtimeSheet_header');
        if (headerDivTSH)
            headerDivTSH.show();
        var bodyDivTSH = this.bodyDiv; //$('applicationtimeSheet_body');
        if (bodyDivTSH)
            bodyDivTSH.show();
        if (this.firstRun) {
            // Initial date: today
            this.currentDate = new Date();
            // Collision date
            this.collisionDate = null;
            // Initial user: none (this will be set inside "onEmployeeSelected" method)
            this.currentUser = null;
            // Time types for each employee
            this.timeTypes = new Hash();
            // Cost centers
            this.costCenters = null;
            // Clipboard
            this.clipboard = new Hash();
            // Buttons
            this.buttons = null;
            // Says if we have to show cost centers or not
            this.showCC = false;
            // Current timesheet
            this.currentTimesheet = null;
            this._setInitialHTML();
            // Listening for changes in calendars
            document.observe('EWS:refreshTimesheet', this.refreshTimesheetBinding);
        }
        if (this.refresh) {
            this._getTimesheet(this.currentUser.id, this.currentDate);
            this.refresh = false;
        }
        this._resetClipboard();
    }
},
/**
* @description Stops timeSheet
*/
close: function($super) {
    $super();
    //Stopping the observers on the fields
    document.stopObserving('change');
    document.stopObserving('EWS:autocompleterResultSelected');
},
/**
* @description Builds the initial HTML code. Read only mode timesheet
*/
_setInitialHTML_read: function() {
    this.header_read = new Element('div',{
        id:"applicationtimeSheet_read_header"
    });
    
    this.currentDateDiv = new Element('div',{
        id:"applicationtimeSheet_read_currentDate"
    });
    
    this.header_read.insert(this.currentDateDiv);
    this.virtualHtml.insert(this.header_read);
    
    //Div for buttons
    if (this.inboxModeUPD){
        this.read_buttonsDiv = new Element('div',{
            id:"applicationtimeEntryScreen_read_buttonsDiv"
        });
        this.header_read.insert(this.read_buttonsDiv);
    }
    this.errorMessageDiv = new Element('div',{
        id: "applicationtimeSheet_read_errorMessage",
        "class": "applicationtimeSheet_errorMessageDiv"
    });
    
    this.virtualHtml.insert(this.errorMessageDiv);
    
    this.read_bodyDiv = new Element('div',{
        id:"applicationtimeSheet_read_body"
    });
    
    this.virtualHtml.insert(this.read_bodyDiv);
    
    this.read_tableHeader = new Element('div',{
        id:"applicationtimeSheet_read_tableHeader"
    });
    this.read_bodyDiv.insert(this.read_tableHeader);
    
    var read_table = new Element('table',{
        id: "applicationtimeSheet_read_table",
        "cellspacing":'0' ,
        "border":'0' ,
        "cellpadding":'0'
    });
    this.read_bodyDiv.insert(read_table);
        
    this.table_read = new Element('tbody',{
        id: "applicationtimeSheet_read_tableBody"
    });
    
    read_table.insert(this.table_read);
    
    this.errorMessageDiv.hide();    
    if (this.inboxModeUPD)
        this.table_read.observe('click', this._checkElement.bind(this));
},
/**
* @description Builds the initial HTML code
*/
_setInitialHTML: function() {
    this.header = new Element ('div',{
        id: "applicationtimeSheet_header"
    });
    var navButtonsDiv = new Element ('div',{
        id: "applicationTeamCalendar_navButtonsDiv"
    });
    this.header.insert(navButtonsDiv);
    if(!global.liteVersion){
        this.prevButton = new Element ('div',{
            id: "applicationtimeSheet_prevButton",
            'class': "application_verticalL_arrow",
            'title': global.getLabel('prevPeriod')
        });
        this.postButton = new Element('div',{
            id: "applicationtimeSheet_postButton",
            'class': "application_verticalR_arrow",
            'title': global.getLabel('nextPeriod')
        });
    }else{
        this.prevButton = new Element ('button',{
            id: "applicationtimeSheet_prevButton",
            'class': "inlineElement calendar_boldArrow link",
            'title': global.getLabel('prevPeriod')
        });
        this.prevButton.update("&lt");
        this.postButton = new Element('button',{
            id: "applicationtimeSheet_postButton",
            'class': "inlineElement calendar_boldArrow link",
            'title': global.getLabel('nextPeriod')
        });
        this.postButton.update("&gt");
    }
    navButtonsDiv.insert(this.prevButton);
    navButtonsDiv.insert(this.postButton);
    this.currentDateDiv = new Element('div',{
        id: "applicationtimeSheet_currentDate"
    });
    this.header.insert(this.currentDateDiv);
    var todayButtonDiv = new Element('div',{
        id: "applicationtimeSheet_todayButtonDiv"
    });
    this.header.insert(todayButtonDiv);
    this.buttonsDiv = new Element('div',{
        id: "applicationtimeSheet_buttonsDiv"
    });
    this.header.insert(this.buttonsDiv);
    this.virtualHtml.insert(this.header);     
    this.errorMessageDiv = new Element('div',{
        id: "applicationtimeSheet_errorMessage",
        'class': "applicationtimeSheet_errorMessageDiv"
    });  
    this.virtualHtml.insert(this.errorMessageDiv);
    this.bodyDiv = new Element('div',{
        id: "applicationtimeSheet_body"
    });
    this.virtualHtml.insert(this.bodyDiv);
    this.tableHeader = new Element('div',{
        id: "applicationtimeSheet_tableHeader"
    });
    this.bodyDiv.insert(this.tableHeader);
    var tableDiv = new Element('table',{
	    "cellspacing": '0',
	    "border": '0',
	    "cellpadding": '0',
	    id: "applicationtimeSheet_table"
    });
    this.table = new Element('tbody',{
        id: "applicationtimeSheet_tableBody"
    });
    tableDiv.insert(this.table);
    this.bodyDiv.insert(tableDiv);
    this.errorMessageDiv.hide();   
    this.table.observe('click', this._checkElement.bind(this));
    var jsonButton = { elements: [] };
    var aux = {
        idButton: 'applicationtimeSheet_todayButton',
        label: global.getLabel('today'),
        handlerContext: null,
        handler: this._clickOnToday.bind(this),
        type: 'button',
        standardButton: true
    };
    jsonButton.elements.push(aux);
    this.buttonTimesheet = new megaButtonDisplayer(jsonButton);
    todayButtonDiv.insert(this.buttonTimesheet.getButtons());
},
/**
* @description When an employee is selected, we draw his/her timesheet
* @param {JSON} args Selected employee's information
*/
onEmployeeSelected: function(args) {
    if (this.comeFrom != "inbox") {
        if(!Object.isEmpty(this.header)){
            this._setEmployeeMessage();
        }
        if (Object.isEmpty(this.currentUser) || (this.currentUser.id != args.id)) {
                this.errorMessageDiv.hide();
            this.currentUser = args;
            this.currentDate = new Date();
            if (Object.isEmpty(this.timeTypes.get(this.currentUser.id)))
                this._getTimeTypes();
            else
                this._getTimesheet(this.currentUser.id, this.currentDate);
        }
    }
},
/**
* @description Employee unselected
*/
onEmployeeUnselected: function() {
    Prototype.emptyFunction();
},
/**
* @param {String} requestId Id for the requested task
* @description Asks for an specific date for a timesheet
*/
_getReqData: function(requestId) {
    this._disableUpperForm_read();
    var xml = "<EWS>" +
                      "<SERVICE>" + this.getReqDataService + "</SERVICE>" +
                      "<PARAM>" +
                          "<REQ_ID>" + requestId + "</REQ_ID>" +
                      "</PARAM>" +
                  "</EWS>";
    this.makeAJAXrequest($H({ xml: xml, successMethod: '_callTimesheet' }));
},
/** 
* @description Says the date to use when calling for a timesheet
* @param {JSON} json Information from GET_PT_REQDATA service
*/
_callTimesheet: function(json) {
    var calcDate = Object.jsonPathExists(json, 'EWS.o_date') ? json.EWS.o_date : "";
    if (Object.isEmpty(calcDate)) {
        var contentHTML = new Element('div');
        var cancel_popUp = new Element( 'div', {
            'class': 'moduleInfoPopUp_std_leftMargin' 
        }).insert(global.getLabel('noTimeSheetFound'));
        contentHTML.insert(cancel_popUp);
        
        var errorInfoPopUp = new infoPopUp({
            closeButton: $H({
                'callBack': function() {
                    errorInfoPopUp.close();
                    delete errorInfoPopUp;
                }
            }),
            htmlContent: contentHTML,
            indicatorIcon: 'exclamation',
            width: 600
        });
        errorInfoPopUp.create();
    }
    else {
        var calcDateObjet = sapToObject(calcDate);
        this._getTimesheet(this.requesterId, calcDateObjet);
    }
},
/**
* @param {String} employeeId Employee whose timesheet we want to show
* @param {Date} date Timesheet's date
* @description Asks the backend for an specific timesheet
*/
_getTimesheet: function(employeeId, date) {
    if (this.comeFrom == 'inbox') {
        this._disableUpperForm_read();
        this.table_read.update('');
    }
    else {
        this._disableUpperForm();
        this.table.update('');
    }
    // Timesheet's request id (this will be set once we receive all timesheet events)
    this.requestId = null;
    var xml = "<EWS>" +
                      "<SERVICE>" + this.getTimesheetService + "</SERVICE>" +
                      "<OBJECT TYPE='P'>" + employeeId + "</OBJECT>" +
                      "<PARAM>" +
                          "<o_calculation_date>" + date.toString(this.dateFormat) + "</o_calculation_date>" +
                      "</PARAM>" +
                  "</EWS>";
    this.makeAJAXrequest($H({ xml: xml, successMethod: '_showTimesheet', errorMethod: '_showTimesheetError' }));
},
/**
* @description Says if we have to show cost centers and shows a timesheet
* @param {JSON} json Information from GET_TIMESHEET service
*/
_showTimesheet: function(json) {
    this.currentTimesheet = json;
    //Get the hour mask
    var fieldSet = objectToArray(json.EWS.o_field_settings.yglui_str_wid_fs_record.fs_fields.yglui_str_wid_fs_field);
    for(var i=0; i<fieldSet.length; i++){
        if(fieldSet[i]['@fieldid'] == 'STDAZ'){
            this.hourMask = fieldSet[i]['@mask'];
            break;
        }
    }
    var showCC = Object.jsonPathExists(json, 'EWS.o_costcenters') ? json.EWS.o_costcenters : "";
    if (!Object.isEmpty(showCC)) {
        this.showCC = true;
        if (Object.isEmpty(this.costCenters))
            this._getCostCenters();
        else
            this._buildTimesheet();
    }
    else
        this._buildTimesheet();
},
/**
* @description Shows a timesheet
*/
_buildTimesheet: function() {
    if (this.comeFrom == "inbox") {
        this._buildTimesheet_read();
    }
    else {
        var json = this.currentTimesheet;
        this._getDWS(json);
        this._getTimesheetEvents(json);
        if (this.firstRun && Object.isEmpty(this.buttons)) {
            if( !Object.isEmpty(json.EWS.o_screen_buttons)){
                var buttons = objectToArray(json.EWS.o_screen_buttons.yglui_str_wid_button);
                this.buttonsFromService = new Hash();
                for (var i = 0; i < buttons.length; i++)
                    this.buttonsFromService.set(buttons[i]['@action'].split('_')[2], buttons[i]);
            }
        }
        //If retroDate or futureDate come set to zero, we reset it to the dates 1800-01-01 and 9999-12-31 respectively
        if (json.EWS.o_retro_date.gsub('-','') == '00000000')
            this.retroDate = Date.parseExact("1800-01-01", 'yyyy-MM-dd');
        else
            this.retroDate = Date.parseExact(json.EWS.o_retro_date, 'yyyy-MM-dd');
        if (json.EWS.o_future_date.gsub('-','') == '00000000')
            this.futureDate = Date.parseExact("9999-12-31", 'yyyy-MM-dd');
        else
            this.futureDate = Date.parseExact(json.EWS.o_future_date, 'yyyy-MM-dd');
        this.currentDate = Date.parseExact(json.EWS.o_begda_i, 'yyyy-MM-dd');
        this.currentEndDate = Date.parseExact(json.EWS.o_endda_i, 'yyyy-MM-dd');
        this.monthly = false;
        if (this.currentDate.equals(this.currentDate.clone().moveToFirstDayOfMonth()) && this.currentEndDate.equals(this.currentEndDate.clone().moveToLastDayOfMonth()))
            this.monthly = true;
        this._buildInitialTimesheet();
        this._fillEvents();
        this._enableUpperForm();
        // Disabling buttons in case we are out of the retro/future dates
        if ((this.currentEndDate.isBefore(this.retroDate) || this.currentDate.isAfter(this.futureDate)) && (!Object.isEmpty(this.buttons))) {
            this.buttons.disable('applicationtimeSheet_saveButton');
            this.buttons.disable('applicationtimeSheet_submitButton');
        }
    }
},
/**
* @description Shows a timesheet. Read only mode timesheet
*/
_buildTimesheet_read: function() {
    var json = this.currentTimesheet;
    this._getDWS(json);
    this._getTimesheetEvents(json);
    //Get buttons from service
    if (this.inboxModeUPD) {
        if (this.firstRun && Object.isEmpty(this.buttons)) {
            if( !Object.isEmpty(json.EWS.o_screen_buttons)){
                var buttons = objectToArray(json.EWS.o_screen_buttons.yglui_str_wid_button);
                this.buttonsFromService = new Hash();
                for (var i = 0; i < buttons.length; i++)
                    this.buttonsFromService.set(buttons[i]['@action'].split('_')[2], buttons[i]);
            }
        }
    }
    
    //If retroDate or futureDate come set to zero, we reset it to the dates 1800-01-01 and 9999-12-31 respectively
    if (json.EWS.o_retro_date.gsub('-','') == '00000000')
        this.retroDate = Date.parseExact("1800-01-01", 'yyyy-MM-dd');
    else
        this.retroDate = Date.parseExact(json.EWS.o_retro_date, 'yyyy-MM-dd');
    if (json.EWS.o_future_date.gsub('-','') == '00000000')
        this.futureDate = Date.parseExact("9999-12-31", 'yyyy-MM-dd');
    else
        this.futureDate = Date.parseExact(json.EWS.o_future_date, 'yyyy-MM-dd');
    this.currentDate = Date.parseExact(json.EWS.o_begda_i, 'yyyy-MM-dd');
    this.currentEndDate = Date.parseExact(json.EWS.o_endda_i, 'yyyy-MM-dd');
    this.monthly = false;
    if (this.currentDate.equals(this.currentDate.clone().moveToFirstDayOfMonth()) && this.currentEndDate.equals(this.currentEndDate.clone().moveToLastDayOfMonth()))
        this.monthly = true;
    this._buildInitialTimesheet_read();
    this._fillEvents();
    this._enableUpperForm_read();
},
/**
* @description Obtains the workschedule information from GET_TIMESHEET's response
* @param {JSON} json Information from GET_TIMESHEET service
*/
_getDWS: function(json) {
    this.workschedule = new Hash();
    if (!Object.isEmpty(json)) {
        if (!Object.isEmpty(json.EWS.o_workschedules)) {
            var workschedule = objectToArray(json.EWS.o_workschedules.yglui_str_dailyworkschedule);
            var length = workschedule.length;
            for (var i = 0; i < length; i++) {
                var info = new Hash();
                info.set('dws', workschedule[i]['@daily_wsc']);
                info.set('hours', workschedule[i]['@stdaz']);
                this.workschedule.set(workschedule[i]['@workschedule_id'], info);
            }
        }
    }
},
/**
* @description Obtains the timesheet's events from GET_TIMESHEET's response
* @param {JSON} json Information from GET_TIMESHEET service
*/
_getTimesheetEvents: function(json) {
    this.currentTimesheet = new Hash();
    if (!Object.isEmpty(json)) {
        if (!Object.isEmpty(json.EWS.o_field_values)) {
            var events = objectToArray(json.EWS.o_field_values.yglui_str_wid_record);
            var length = events.length;
            for (var i = 0; i < length; i++) {
                var index = "";
                var properties = objectToArray(events[i].contents.yglui_str_wid_content.fields.yglui_str_wid_field);
                var eventProperties = new Hash();
                var length2 = properties.length;
                for (var j = 0; j < length2; j++) {
                    var subindex = Object.isEmpty(properties[j]['@fieldtechname']) ? properties[j]['@fieldid'] : properties[j]['@fieldtechname'];
                    if (subindex == 'BEGDA')
                        index = properties[j]['@value'];
                    eventProperties.set(subindex, {
                        'text': properties[j]['#text'],
                        'label': properties[j]['@fieldlabel'],
                        'techname': properties[j]['@fieldtechname'],
                        'seqnr': properties[j]['@fieldseqnr'],
                        'value': properties[j]['@value']
                    });
                }
                var eventId = events[i].contents.yglui_str_wid_content['@key_str'];
                eventProperties.set('ID', eventId);
                if (Object.isEmpty(this.currentTimesheet.get(index))) {
                    var eventArray = new Array();
                    this.currentTimesheet.set(index, eventArray);
                }
                this.currentTimesheet.get(index).push(eventProperties);
            }
        }
    }
},
/**
* @description Changes the timesheet's date and reloads it if needed
* @param {Date} newDate New timesheet's date
*/
_dateChange: function(newDate) {
    this.errorMessageDiv.update("");
    this.errorMessageDiv.hide();
    var change = true;
    if (newDate.between(this.currentDate, this.currentEndDate))
        change = false;
    if (change)
        this._getTimesheet(this.currentUser.id, newDate);
},
/**
* @description When the user clicks on today button, if we are not viewing "today" timesheet, load it
*/
_clickOnToday: function() {
    if( this.changesToSave)
        this._showChangePeriodPopUp("today");
    else{
        var newDate = new Date();
        this._dateChange(newDate);
    }
},
/**
* @description Asks the backend for the timesheet's time types
*/
_getTimeTypes: function() {
    var userIdentifier = '';
    if (this.comeFrom == 'inbox')
        userIdentifier = this.requesterId;
    else
        userIdentifier = this.currentUser.id;
    var xml = "<EWS>" +
                  "<SERVICE>" + this.getSubtypesService + "</SERVICE>" +
                  "<OBJECT TYPE='P'>" + userIdentifier + "</OBJECT>" +
                  "<PARAM>" +
                      "<APPID>TSH_MGMT</APPID>" +
                  "</PARAM>" +
              "</EWS>";
    this.makeAJAXrequest($H({ xml: xml, successMethod: '_saveTimeTypes' }));
},
/**
* @description Obtains the timesheet's timetypes from GET_SUBTYPES2's response
* @param {JSON} json Information from GET_SUBTYPES2 service
*/
_saveTimeTypes: function(json) {
    var userIdentifier = '';
    if (this.comeFrom == 'inbox')
        userIdentifier = this.requesterId;
    else
        userIdentifier = this.currentUser.id;
    if (!Object.isEmpty(json)) {
        if (!Object.isEmpty(json.EWS.o_values)) {
            var timeTypes = json.EWS.o_values.item;
            var length = timeTypes.length;
            // Initial autocompleter structure
            var jsonAutocompleter = { autocompleter: {
                object: [],
                multilanguage: {
                    no_results: global.getLabel('noresults'),
                    search: global.getLabel('search')
                }
            }
            };
            for (var i = 0; i < length; i++) {
                jsonAutocompleter.autocompleter.object.push({
                    data: timeTypes[i]['@id'],
                    text: timeTypes[i]['@value']
                });
            }
            this.timeTypes.set(userIdentifier, jsonAutocompleter);
            if (this.comeFrom != "inbox")
                this._getTimesheet(userIdentifier, this.currentDate);
        }
    }
},
/**  
* @description Builds the initial screen using the workschedule. Read only mode timesheet
*/
_buildInitialTimesheet_read: function() {
    // Setting up table header
    if (!this.headedInserted_read) {
    
        var common_css_class = 'applicationtimeSheet_element_titleDiv application_main_soft_text';
        var html_element, html_element2;
        var html_class, html;
        
        html = new Element( 'div');
    
        html_element = new Element('div', {
            'class': common_css_class // applicationtimeSheet_read_element_targetDiv";
        });
        if (this.inboxModeUPD)
            html_class = "applicationtimeSheet_element_targetDiv";
        else
            html_class = "applicationtimeSheet_read_element_targetDiv";
        if (!this.showCC)
            html_element.addClassName(html_class + "_noCC");
        else
            html_element.addClassName(html_class);
        html.insert(html_element);
        
        html_element = new Element( 'div', {
            'class': common_css_class // applicationtimeSheet_read_element_dateDiv";
        });       
        if (this.inboxModeUPD)
            html_class = "applicationtimeSheet_element_dateDiv";
        else
            html_class = "applicationtimeSheet_read_element_dateDiv";
        if (!this.showCC)
            html_element.addClassName(html_class + "_noCC");
        else
            html_element.addClassName(html_class);
        html_element.insert(global.getLabel('date'));
        html.insert(html_element);
        
        html_element2 = new Element ( 'div', {
            'class': common_css_class // applicationtimeSheet_read_element_dateDiv";
        }).insert(global.getLabel('status'));         
        if (this.inboxModeUPD)
            html_class = "applicationtimeSheet_element_statusDiv";
        else
            html_class = "applicationtimeSheet_read_element_statusDiv";
        if (!this.showCC)
            html_element2.addClassName(html_class + "_noCC");
        else
            html_element2.addClassName(html_class);
        html.insert(html_element2);
        
        html_element = new Element('div', {
            'class': common_css_class // applicationtimeSheet_read_element_typeDiv";
        }).insert(global.getLabel('timeType'));
        if (this.inboxModeUPD)
            html_class = "applicationtimeSheet_element_typeDiv";
        else
            html_class = "applicationtimeSheet_read_element_typeDiv";
        if (!this.showCC)
            html_element.addClassName(html_class + "_noCC");
        else
            html_element.addClassName(html_class);
        
        html.insert(html_element);
        if (this.showCC){
            html_element2 = new Element( 'div', {
                'class': common_css_class + 'applicationtimeSheet_read_element_costDiv'
            }).insert(global.getLabel('costcenter'));
            html.insert(html_element2);
        }
        
        html_element = new Element ('div', {
            'class': common_css_class  // applicationtimeSheet_read_element_hoursDiv";
        }).insert( "#" + global.getLabel('hours')); 
        if (this.inboxModeUPD)
            html_class = "applicationtimeSheet_element_hoursDiv";
        else
            html_class = "applicationtimeSheet_read_element_hoursDiv";
        if (!this.showCC)
            html_element.addClassName(html_class + "_noCC");
        else
            html_element.addClassName(html_class);
        
        html_element2 = new Element ( 'div', {
            'class': common_css_class
        }).insert(global.getLabel('comment'));
        
        html.insert(html_element);
        html.insert(html_element2);
        
        this.read_tableHeader.insert(html);
        this.headedInserted_read = true;
    }
    // Inserting Submit button
    if (this.inboxModeUPD) {
        if (this.firstRun && Object.isEmpty(this.buttons)) {
            var jsonButtons = { elements: [] };
            var submitButton = this.buttonsFromService.get('SUBMIT');
            var button = {
                idButton: 'applicationtimeSheet_read_' + submitButton['@action'].split('_')[2].toLowerCase() + 'Button',
                label: submitButton['@label_tag'],
                type: 'button',
                standardButton: true,
                className: 'applicationtimeSheet_buttonDiv',
                handlerContext: null,
                handler: this._timesheetAction_read.bind(this, submitButton)
            };
            jsonButtons.elements.push(button);
            this.buttons = new megaButtonDisplayer(jsonButtons);
            this.read_buttonsDiv.insert(this.buttons.getButtons());
        }
    }
    // Number of days
    if (this.monthly)
        this.days = Date.getDaysInMonth(parseInt(this.currentDate.toString('yyyy')), parseInt(this.currentDate.toString('M')) - 1);
    else {
        // Number of milliseconds in one day
        var msOneDay = 1000 * 60 * 60 * 24;
        // Convert dates to milliseconds
        var msCurrentDate = this.currentDate.getTime();
        var msCurrentEndDate = this.currentEndDate.getTime();
        // Calculate the difference in milliseconds
        var msDifference = msCurrentEndDate - msCurrentDate;
        // Convert back to days
        this.days = Math.round(msDifference / msOneDay) + 1;
    }
    var date = this.currentDate.clone();
    // This is for storing 
    //    * the next index (i) for events having the same date (pernr_date_i)
    //    * an array with event's indexes for the same date
    this.dateCounter = new Hash();
    // Storing autocompleters
    this.timeTypeAutocompleters = new Hash();
    if (this.showCC)
        this.costCenterAutocompleters = new Hash();
    for (var i = 0; i < this.days; i++) {
        var stringDate = date.toString(this.dateFormat);
        var workschedule = '---', hours = '-';
        if (!Object.isEmpty(this.workschedule.get(stringDate)) && date.between(this.retroDate, this.futureDate)) {
            workschedule = this.workschedule.get(stringDate).get('dws');
            hours = this.workschedule.get(stringDate).get('hours');
        }
        this._addInitialRow_read(date, workschedule, hours);
        var properties = new Hash();
        properties.set('nextIndex', 1);
        var indexes = new Array();
        indexes.push(0);
        properties.set('indexes', indexes);
        this.dateCounter.set(stringDate, properties);
        date.addDays(1);
    }
},
/**
* @description Builds the initial screen using the workschedule
*/
_buildInitialTimesheet: function() {
    // Setting up table header
    if (!this.headedInserted) {
        var common_css_class = 'applicationtimeSheet_element_titleDiv application_main_soft_text';
        var html_element, html_element2;
        var html_class, html;
        
        html = new Element( 'div');
        
        html_element = new Element ( 'div', {
            'class': common_css_class
        });
        html_class = 'applicationtimeSheet_element_targetDiv';
        if (!this.showCC)
            html_class += "_noCC";
        html_element.addClassName(html_class);
        html.insert( html_element);
        
        html_element = new Element( 'div',{
            'class': common_css_class
        }).insert(global.getLabel('date'));
        html_class = 'applicationtimeSheet_element_dateDiv';          
        if (!this.showCC)
            html_class += "_noCC";
        html_element.addClassName(html_class);
        html.insert(html_element);
        
        html_element2 = new Element( 'div', {
            'class': common_css_class
        }).insert(global.getLabel('status'));
        html_class = 'applicationtimeSheet_element_statusDiv';          
        if (!this.showCC)
            html_class += "_noCC";
        html_element2.addClassName(html_class);
        html.insert(html_element2);
        
        html_element = new Element( 'div', {
            'class': common_css_class
        }).insert(global.getLabel('timeType'));;
        html_class = 'applicationtimeSheet_element_typeDiv';          
        if (!this.showCC)
            html_class += "_noCC";
        html_element.addClassName(html_class);
        html.insert(html_element);
        
        if (this.showCC){
            html_element2 = new Element( 'div', {
                'class': common_css_class + 'applicationtimeSheet_element_costDiv'
            }).insert(global.getLabel('costcenter'));
            html.insert(html_element2);
        }
        
        html_element = new Element( 'div', {
            'class': common_css_class
        }).insert( "#" + global.getLabel('hours'));
        html_class = 'applicationtimeSheet_element_hoursDiv';          
        if (!this.showCC)
            html_class += "_noCC";
        html_element.addClassName(html_class);
        html.insert(html_element);
            
        html_element2 = new Element ( 'div', {
            'class': common_css_class
        }).insert(global.getLabel('comment'));
        html.insert(html_element2);
        
        this.tableHeader.insert(html);
        this.headedInserted = true;
    }
    // Inserting buttons
    if (this.firstRun && Object.isEmpty(this.buttons)) {
        var jsonButtons = { elements: [] };
        var submitButton = this.buttonsFromService.get('SUBMIT');
        var button1 = {
            idButton: 'applicationtimeSheet_' + submitButton['@action'].split('_')[2].toLowerCase() + 'Button',
            label: submitButton['@label_tag'],
            type: 'button',
            standardButton: true,
            className: 'applicationtimeSheet_buttonDiv',
            handlerContext: null,
            handler: this._timesheetAction.bind(this, submitButton)
        };
        var saveButton = this.buttonsFromService.get('SAVE');
        var button2 = {
            idButton: 'applicationtimeSheet_' + saveButton['@action'].split('_')[2].toLowerCase() + 'Button',
            label: saveButton['@label_tag'],
            type: 'button',
            standardButton: true,
            className: 'applicationtimeSheet_buttonDiv',
            handlerContext: null,
            handler: this._timesheetAction.bind(this, saveButton)
        };
        if (!global.liteVersion) {
            jsonButtons.elements.push(button1);
            jsonButtons.elements.push(button2);
        }
        else {
            jsonButtons.elements.push(button2);
            jsonButtons.elements.push(button1);
        }
        this.buttons = new megaButtonDisplayer(jsonButtons);
        this.buttonsDiv.insert(this.buttons.getButtons());
    }
    // Number of days
    if (this.monthly)
        this.days = Date.getDaysInMonth(parseInt(this.currentDate.toString('yyyy')), parseInt(this.currentDate.toString('M')) - 1);
    else {
        // Number of milliseconds in one day
        var msOneDay = 1000 * 60 * 60 * 24;
        // Convert dates to milliseconds
        var msCurrentDate = this.currentDate.getTime();
        var msCurrentEndDate = this.currentEndDate.getTime();
        // Calculate the difference in milliseconds
        var msDifference = msCurrentEndDate - msCurrentDate;
        // Convert back to days
        this.days = Math.round(msDifference / msOneDay) + 1;
    }
    var date = this.currentDate.clone();
    // This is for storing 
    //    * the next index (i) for events having the same date (pernr_date_i)
    //    * an array with event's indexes for the same date
    this.dateCounter = new Hash();
    // Storing autocompleters
    this.timeTypeAutocompleters = new Hash();
    if (this.showCC)
        this.costCenterAutocompleters = new Hash();
    for (var i = 0; i < this.days; i++) {
        var stringDate = date.toString(this.dateFormat);
        var workschedule = '---', hours = '-';
        if (!Object.isEmpty(this.workschedule.get(stringDate)) && date.between(this.retroDate, this.futureDate)) {
            workschedule = this.workschedule.get(stringDate).get('dws');
            hours = this.workschedule.get(stringDate).get('hours');
        }
        this._addInitialRow(date, workschedule, hours);
        var properties = new Hash();
        properties.set('nextIndex', 1);
        var indexes = new Array();
        indexes.push(0);
        properties.set('indexes', indexes);
        this.dateCounter.set(stringDate, properties);
        date.addDays(1);
    }
},
/** 
* @description Adds a row (with initial information) in the timesheet. Read only mode
* @param {Date} date Event's date
* @param {String} dws Event's workschedule
* @param {String} hours Event's target hours
*/
_addInitialRow_read: function(date, dws, hours) {
    var stringDate = date.toString(this.dateFormat);
    var rowId = this.requesterId + "_" + stringDate + "_0";
    
    var html_element, html_class, td_element;
    
    html_element = new Element( 'tr', {
        id: rowId
    });
    html_class = 'applicationtimeSheet_tableRow';
    if (dws == 'FREE')
        html_class += " applicationtimeSheet_festivity";
    html_element.addClassName(html_class);
    
    td_element = new Element ( 'td', {
        id: 'applicationtimeSheet_target_' + rowId,
        'class': 'applicationtimeSheet_element_target application_main_soft_text',
        'title': global.getLabel('target')
    }).insert(hours);
    html_element.insert(td_element);
    
    td_element = new Element ( 'td', {
        id: 'applicationtimeSheet_read_date_' + rowId
    }).insert(date.toString(global.dateFormat));
    html_class = 'applicationtimeSheet_element_date';  
    if (!this.showCC)
        html_class += "_noCC";
    td_element.addClassName(html_class);
    html_element.insert(td_element);
    
    td_element = new Element ( 'td', {
        id: 'applicationtimeSheet_read_status_' + rowId,
        'class': 'applicationtimeSheet_element_status'
    });
    html_element.insert(td_element);
    
    td_element = new Element ( 'td', {
        id: 'applicationtimeSheet_read_timeType_' + rowId,
        'class': 'applicationtimeSheet_element_type'
    }).insert( new Element ( 'div', {
            id: 'applicationtimeSheet_read_timeTypeDiv_' + rowId
       })
    );
    html_element.insert(td_element);            

    if (this.showCC) {
        td_element = new Element ( 'td', {
            id: 'applicationtimeSheet_read_costCenter_' + rowId,
            'class': 'applicationtimeSheet_element_cost'
        }).insert( new Element ( 'div', {
                id: 'applicationtimeSheet_read_costCenterDiv_' + rowId
            })
        );
        html_element.insert(td_element);
    }
    
    td_element = new Element ( 'td', {
        id: 'applicationtimeSheet_read_hours_' + rowId,
        'class': 'applicationtimeSheet_element_hours'
    });
    if (this.inboxModeUPD){
        var inputHour = new Element( 'input', {
            id: 'applicationtimeSheet_read_hoursInput_' + rowId,
            'type': 'text',
            'class': 'applicationtimeSheet_element_hoursInput fieldDisplayer_input'
        });
        td_element.insert(inputHour);
    }
    html_element.insert(td_element);
    
    html_class = 'applicationtimeSheet_element_comment';
    if (!this.showCC)
        html_class += "_noCC";
    td_element = new Element ( 'td', {
        id: 'applicationtimeSheet_read_comment_' + rowId,
        'class': html_class
    });           
    if (this.inboxModeUPD) {
        html_class = 'fieldDisplayer_input applicationtimeSheet_element_commentsInput';
        if (!this.showCC)
            html_class += "_noCC";
        td_element.insert( new Element ( 'input', {
            id: 'applicationtimeSheet_read_commentInput_' + rowId,
            'type': 'text',
            'class': html_class
        }));
    }
    html_element.insert(td_element);
    
    if (this.inboxModeUPD) {
        html_class = 'applicationtimeSheet_element_copy';
        if (!this.showCC)
            html_class += "_noCC";
        td_element = new Element ( 'td', {
            id: 'applicationtimeSheet_read_copy_' + rowId,
            'class': html_class
        });
        
        if(!global.liteVersion)
            td_element.insert( new Element( 'div', {
                id: 'applicationtimeSheet_read_copyDiv_' + rowId,
                'title': this.copyLabel,
                'class': 'application_inProgress_training_icon_curr_div applicationtimeSheet_element_centeredCopy'
            }));
        else
            td_element.insert( new Element( 'button', {
                id: 'applicationtimeSheet_read_copyDiv_' + rowId,
                'title': this.copyLabel,
                'class': 'application_inProgress_training_icon_curr_div applicationtimeSheet_element_centeredCopy'
            }).insert('C'));
        html_element.insert(td_element);
        
        html_class = 'applicationtimeSheet_element_paste';
        if (!this.showCC)
            html_class += "_noCC";
        td_element = new Element( 'td', {
            id: 'applicationtimeSheet_read_paste_' + rowId,
            'class': html_class
        });
        
        if(!global.liteVersion)
            td_element.insert( new Element ( 'div', {
                id: 'applicationtimeSheet_read_pasteDiv_' + rowId,
                'title': this.pasteLabel,
                'class': 'application_pasteIcon applicationtimeSheet_element_centeredPaste'
            }));
        else
            td_element.insert( new Element ( 'button', {
                id: 'applicationtimeSheet_read_pasteDiv_' + rowId,
                'title': this.pasteLabel,
                'class': 'application_pasteIcon applicationtimeSheet_element_centeredPaste'
            }).insert('P'));
        html_element.insert(td_element);
                    
        html_class = 'applicationtimeSheet_element_add';
        if (!this.showCC)
            html_class += "_noCC";
        td_element = new Element( 'td', {
            id: 'applicationtimeSheet_read_add_' + rowId,
            'class': html_class
        }).insert( new Element ( 'span', {
                id: 'applicationtimeSheet_read_addSpan_' + rowId,
                'title': this.addLabel,
                'class': 'applicationtimeSheet_element_centeredAddRemove application_main_title3 application_handCursor'
            }).insert(" + ")
        );            
        html_element.insert(td_element);
        
        html_class = 'applicationtimeSheet_element_remove';
        if (!this.showCC)
            html_class += "_noCC";
        td_element = new Element ( 'td', {
            id: 'applicationtimeSheet_read_remove_' + rowId,
            'class': html_class
        }).insert( new Element ( 'span', {
                id: 'applicationtimeSheet_read_removeSpan_' + rowId,
                'title': this.removeLabel,
                'class': 'applicationtimeSheet_element_centeredAddRemove application_main_title3 application_handCursor'
            })
        );            
        html_element.insert(td_element);
    }
       
    this.table_read.insert(html_element);
    
    //Set autocompleter for Time Type
    if (this.inboxModeUPD) {
        var timeTypeAutocompleter = new JSONAutocompleter('applicationtimeSheet_read_timeTypeDiv_' + rowId, {
            showEverythingOnButtonClick: true,
            timeout: 1000,
            templateResult: '#{text}',
            templateOptionsList: '#{text}',
            minChars: 1
        }, this.timeTypes.get(this.requesterId));
        html_class = 'applicationtimeSheet_autocompleter';
        if (this.showCC)
            html_class += "_noCC"
        $('text_area_applicationtimeSheet_read_timeTypeDiv_' + rowId).addClassName(html_class);
        this.timeTypeAutocompleters.set(rowId, timeTypeAutocompleter);

        //Set autocompleter for Cost Center
        if (this.showCC) {
            var costCenterAutocompleter = new JSONAutocompleter('applicationtimeSheet_read_costCenterDiv_' + rowId, {
                showEverythingOnButtonClick: true,
                timeout: 1000,
                templateResult: '#{text}',
                templateOptionsList: '#{text}',
                minChars: 1
            }, this.costCenters);
            $('text_area_applicationtimeSheet_read_costCenterDiv_' + rowId).addClassName('applicationtimeSheet_autocompleter');
            this.costCenterAutocompleters.set(rowId, costCenterAutocompleter);
        }
    }
},
/**
* @description Adds a row (with initial information) in the timesheet
* @param {Date} date Event's date
* @param {String} dws Event's workschedule
* @param {String} hours Event's target hours
*/
_addInitialRow: function(date, dws, hours) {
    var inDateRange = date.between(this.retroDate, this.futureDate);
    var stringDate = date.toString(this.dateFormat);
    var rowId = this.currentUser.id + "_" + stringDate + "_0";
    
    var html_element, html_class, td_element;
    
    html_class = 'applicationtimeSheet_tableRow';
    if (dws == 'FREE')
        html_class += " applicationtimeSheet_festivity";
    html_element = new Element( 'tr', {
        id: rowId,
        'class': html_class
    });
    
    td_element = new Element ( 'td', {
        id: 'applicationtimeSheet_target_' + rowId,
        'class': 'applicationtimeSheet_element_target application_main_soft_text',
        'title': global.getLabel('target')
    }).insert( hours);
    html_element.insert(td_element);
    
    html_class = 'applicationtimeSheet_element_date';
    if (!this.showCC)
        html_class += "_noCC";
    if (!inDateRange)
        html_class += " application_main_soft_text";
    td_element = new Element ( 'td', {
        id: 'applicationtimeSheet_date_' + rowId,
        'class': html_class
    }).insert( date.toString(global.dateFormat));
    html_element.insert(td_element);           
    
    td_element = new Element ( 'td', {
        id: 'applicationtimeSheet_status_' + rowId,
        'class': 'applicationtimeSheet_element_status'
    });
    html_element.insert(td_element);
    
    td_element = new Element ( 'td', {
        id: 'applicationtimeSheet_timeType_' + rowId,
        'class': 'applicationtimeSheet_element_type'
    });                         
    if (inDateRange)
        td_element.insert( new Element ( 'div', {
            id: 'applicationtimeSheet_timeTypeDiv_' + rowId
        }));
    else{
        td_element.addClassName('applicationtimeSheet_softText');
        td_element.insert("------------------------------");
    }
    html_element.insert(td_element);
    
    if (this.showCC) {
        td_element = new Element ( 'td', {
            id: 'applicationtimeSheet_costCenter_' + rowId,
            'class': 'applicationtimeSheet_element_cost'
        });
        if (inDateRange)
            td_element.insert(new Element ( 'div', {
                id: 'applicationtimeSheet_costCenterDiv_' + rowId
            }));
        else{
            td_element.addClassName('applicationtimeSheet_softText');
            td_element.insert("------------------------------");
        }
        html_element.insert(td_element);
    }
    
    td_element = new Element ( 'td', {
        id: 'applicationtimeSheet_hours_' + rowId,
        'class': 'applicationtimeSheet_element_hours'
    });
    if (!inDateRange){
        td_element.addClassName( 'applicationtimeSheet_softText');
        td_element.insert("---------"); 
    }else{
        var inputHour = new Element ( 'input', {
            id: 'applicationtimeSheet_hoursInput_' + rowId,
            'type': 'title',
            'class': 'applicationtimeSheet_element_hoursInput fieldDisplayer_input'
        });
        td_element.insert(inputHour);  
    }
    html_element.insert(td_element);    
    
    html_class = 'applicationtimeSheet_element_comment';
    if (!this.showCC)
        html_class += "_noCC";
    td_element = new Element( 'td', {
        id: 'applicationtimeSheet_comment_' + rowId,
        'class': html_class
    });
    if (inDateRange) {
        html_class = 'fieldDisplayer_input applicationtimeSheet_element_commentsInput';
        if (!this.showCC)
            html_class += "_noCC";
        td_element.insert( new Element( 'input', {
            id: 'applicationtimeSheet_commentInput_' + rowId,
            'type': 'text',
            'class': html_class
        }));
    }
    else{
        td_element.addClassName('applicationtimeSheet_softText');
        td_element.insert("--------------------------------");
    }
    html_element.insert(td_element);
    
    html_class = 'applicationtimeSheet_element_copy';
    if (!this.showCC)
        html_class += "_noCC";
    td_element = new Element ( 'td', {
        id: 'applicationtimeSheet_copy_' + rowId,
        'class': html_class
    });
    if (inDateRange){
        if(!global.liteVersion)
            td_element.insert( new Element( 'div', {
                id: 'applicationtimeSheet_copyDiv_' + rowId,
                'title': this.copyLabel,
                'class': 'application_inProgress_training_icon_curr_div applicationtimeSheet_element_centeredCopy'
            }));
        else
            td_element.insert( new Element( 'button', {
                id: 'applicationtimeSheet_copyDiv_' + rowId,
                'title': this.copyLabel,
                'class': 'application_inProgress_training_icon_curr_div applicationtimeSheet_element_centeredCopy'
            })).insert('C');
    }
    html_element.insert(td_element);        
    
    html_class = 'applicationtimeSheet_element_paste';
    if (!this.showCC)
        html_class += "_noCC";
    td_element = new Element ( 'td', {
        id: 'applicationtimeSheet_paste_' + rowId,
        'class': html_class
    });        
    if (inDateRange){
        if(!global.liteVersion)
            td_element.insert( new Element( 'div', {
                id: 'applicationtimeSheet_pasteDiv_' + rowId,
                'title': this.pasteLabel,
                'class': 'application_pasteIcon applicationtimeSheet_element_centeredPaste'
            }));
        else
            td_element.insert( new Element( 'button', {
                id: 'applicationtimeSheet_pasteDiv_' + rowId,
                'title': this.pasteLabel,
                'class': 'application_pasteIcon applicationtimeSheet_element_centeredPaste'
            }).insert('P'));
    }
    html_element.insert(td_element);
    
    html_class = 'applicationtimeSheet_element_add';
    if (!this.showCC)
        html_class += "_noCC";
    td_element = new Element ( 'td', {
        id: 'applicationtimeSheet_add_' + rowId,
        'class': html_class
    });
    if (inDateRange){
        if(!global.liteVersion)
            td_element.insert( new Element ( 'span', {
                id: 'applicationtimeSheet_addSpan_' + rowId,
                'title': this.addLabel,
                'class': 'applicationtimeSheet_element_centeredAddRemove application_main_title3 application_handCursor'
            }).insert(" + "));
        else
            td_element.insert( new Element ( 'button', {
                id: 'applicationtimeSheet_addSpan_' + rowId,
                'title': this.addLabel,
                'class': 'applicationtimeSheet_element_centeredAddRemove application_main_title3 link'
            }).insert(" + "));
    }
    html_element.insert(td_element);
    
    html_class = 'applicationtimeSheet_element_remove';
    if (!this.showCC)
        html_class += "_noCC";
    td_element = new Element ( 'td', {
        id: 'applicationtimeSheet_remove_' + rowId,
        'class': html_class
    });
    if (inDateRange){
        if(!global.liteVersion)
            td_element.insert( new Element ( 'span', {
                id: 'applicationtimeSheet_removeSpan_' + rowId,
                'title': this.removeLabel,
                'class': 'applicationtimeSheet_element_centeredAddRemove application_main_title3 application_handCursor'
            }));
        else
            td_element.insert( new Element ( 'button', {
                id: 'applicationtimeSheet_removeSpan_' + rowId,
                'title': this.removeLabel,
                'class': 'applicationtimeSheet_element_centeredAddRemove application_main_title3 link'
            }));
    }
    html_element.insert(td_element);
      
    this.table.insert(html_element);
    
    if (inDateRange) {        
        var timeTypeAutocompleter = new JSONAutocompleter('applicationtimeSheet_timeTypeDiv_' + rowId, {
            showEverythingOnButtonClick: true,
            timeout: 1000,
            templateResult: '#{text}',
            templateOptionsList: '#{text}',
            minChars: 1,
            events: $H({ onResultSelected: 'EWS:autocompleterResultSelected'})
        }, this.timeTypes.get(this.currentUser.id));
        html_class = 'applicationtimeSheet_autocompleter';
        if (!this.showCC)
            html_class = 'applicationtimeSheet_autocompleter_noCC';
        $('text_area_applicationtimeSheet_timeTypeDiv_' + rowId).addClassName( html_class);
        this.timeTypeAutocompleters.set(rowId, timeTypeAutocompleter);
        
        if (this.showCC) {
            var costCenterAutocompleter = new JSONAutocompleter('applicationtimeSheet_costCenterDiv_' + rowId, {
                showEverythingOnButtonClick: true,
                timeout: 1000,
                templateResult: '#{text}',
                templateOptionsList: '#{text}',
                minChars: 1,
                events: $H({ onResultSelected: 'EWS:autocompleterResultSelected'})
            }, this.costCenters);
            $('text_area_applicationtimeSheet_costCenterDiv_' + rowId).addClassName('applicationtimeSheet_autocompleter');
            this.costCenterAutocompleters.set(rowId, costCenterAutocompleter);
        }
        //Setting the observers onChange for the input fields
        $('applicationtimeSheet_hoursInput_' + rowId).observe('change', this._checkElementToPopUp.bind(this));
        $('applicationtimeSheet_commentInput_' + rowId).observe('change', this._checkElementToPopUp.bind(this));
        //Setting the observers onChange for the autocompleter
        document.observe('EWS:autocompleterResultSelected', this._checkElementToPopUp.bind(this));
    }
},

/**
* @description: Check if there are changes on the timesheet and in that case enables the popUp.
  This function is called everytime that we change any field on the timesheet.
*/
_checkElementToPopUp: function(){
    if(!this.changesToSave){
        //Enabling the popUp "Are you sure to leave the application?"
        this._enableExitPopUp();        
        this.changesToSave = true;
    }
},

/**
* @description: it enables the "are you sure to leave the application" PopUp
*/
_enableExitPopUp: function(){
    var index = global.popUpBeforeClose.indexOf("timeSheet");
    if(index == -1){    //the popup is not enabled yet
        global.popUpBeforeClose.push("timeSheet");
    }    
},

/**
* @description: it disables the "are you sure to leave the application" PopUp
*/
_disableExitPopUp: function(){
    var index = global.popUpBeforeClose.indexOf("timeSheet");
    if(index != -1){    //the popup was enabled
        global.popUpBeforeClose.splice(index,1);    //deleting the entry for timeSheet
    }    
},

/**
* @description Adds an empty row in the timesheet
* @param {String} rowId Previous row's id
*/
_addRow: function(rowId) {
    var row = $(rowId);
    var stringDate = rowId.split('_')[1];
    var dateCounter = this.dateCounter.get(stringDate).get('nextIndex');
    var newRowId = this.currentUser.id + "_" + stringDate + "_" + dateCounter;
    this.dateCounter.get(stringDate).set('nextIndex', dateCounter + 1);
    var position = row.rowIndex + 1;
    var newRow = this.table.insertRow(position);
    newRow.id = newRowId;
    newRow.className = 'applicationtimeSheet_tableRow';
    if (row.hasClassName('applicationtimeSheet_festivity'))
        newRow.className = 'applicationtimeSheet_festivity applicationtimeSheet_tableRow';
    if (row.hasClassName('applicationtimeSheet_collision'))
        newRow.className = 'applicationtimeSheet_collision applicationtimeSheet_tableRow';
    
    var td_element, html_element, html_class, o_element;
    
    $(newRowId).insert( new Element( 'td', {
        id: 'applicationtimeSheet_target_' + newRowId,
        'class': 'applicationtimeSheet_element_target application_main_soft_text',
        'title': global.getLabel('target')
    }));
    
    html_class = 'applicationtimeSheet_element_date';
    if (!this.showCC)
        html_class += "_noCC";
    $(newRowId).insert( new Element( 'td', {
        id: 'applicationtimeSheet_date_' + newRowId,
        'class': html_class
    }));
    
    $(newRowId).insert( new Element( 'td', {
        id: 'applicationtimeSheet_status_' + newRowId,
        'class': 'applicationtimeSheet_element_status'
    }));
    $(newRowId).insert( new Element ( 'td', {
        id: 'applicationtimeSheet_timeType_' + newRowId,
        'class': 'applicationtimeSheet_element_type'
    }).insert( new Element( 'div', {
            id: 'applicationtimeSheet_timeTypeDiv_' + newRowId
        })
    ));
    
    if (this.showCC){
        $(newRowId).insert( new Element ( 'td', {
            id: 'applicationtimeSheet_costCenter_' + newRowId,
            'class': 'applicationtimeSheet_element_cost'
        }).insert( new Element ( 'div', {
                id: 'applicationtimeSheet_costCenterDiv_' + newRowId
            })
        ));
    }

    var inputHours = new Element ( 'input', { id: 'applicationtimeSheet_hoursInput_' + newRowId,'type': 'text','class': 'applicationtimeSheet_element_hoursInput fieldDisplayer_input'});
    $(newRowId).insert( new Element ( 'td', {
        id: 'applicationtimeSheet_hours_' + newRowId,
        'class': 'applicationtimeSheet_element_hours'
    }).insert(inputHours));

    html_class = 'applicationtimeSheet_element_comment';
    if (!this.showCC)
        html_class += "_noCC";
    td_element = new Element( 'td', {
        id: 'applicationtimeSheet_comment_' + newRowId,
        'class': html_class
    });
    
    html_class = 'fieldDisplayer_input applicationtimeSheet_element_commentsInput';
    if (!this.showCC)
        html_class += "_noCC";
    o_element = new Element ( 'input', {
            id: 'applicationtimeSheet_commentInput_' + newRowId,
            'type': 'text',
            'class': html_class
    });
    $(newRowId).insert(td_element.insert( o_element));

    html_class = 'applicationtimeSheet_element_copy';
    if (!this.showCC)
        html_class += "_noCC";
    td_element = new Element( 'td', {
        id: 'applicationtimeSheet_copy_' + newRowId,
        'class': html_class
    });
    if(!global.liteVersion){
        td_element.insert( new Element ( 'div', {
            id: 'applicationtimeSheet_copyDiv_' + newRowId,
            'title': this.copyLabel,
            'class': 'application_inProgress_training_icon_curr_div applicationtimeSheet_element_centeredCopy'
        }));
    }
    else{
        td_element.insert( new Element( 'button', {
            id: 'applicationtimeSheet_copyDiv_' + newRowId,
            'title': this.copyLabel,
            'class': 'application_inProgress_training_icon_curr_div applicationtimeSheet_element_centeredCopy'
        }).insert('C'));
    }
    $(newRowId).insert(td_element);
    
    html_class = 'applicationtimeSheet_element_paste';
    if (!this.showCC)
        html_class += "_noCC";
    td_element = new Element ( 'td', {
        id: 'applicationtimeSheet_paste_' + newRowId,
        'class': html_class
    });
    if(!global.liteVersion){
        td_element.insert( new Element( 'div', {
            id: 'applicationtimeSheet_pasteDiv_' + newRowId,
            'title': this.pasteLabel,
            'class': 'application_pasteIcon applicationtimeSheet_element_centeredPaste'
        }));
    }
    else{
        td_element.insert( new Element ( 'button', {
            id: 'applicationtimeSheet_pasteDiv_' + newRowId,
            'title': this.pasteLabel,
            'class': 'application_pasteIcon applicationtimeSheet_element_centeredPaste'
        }).insert('P'));
    }
    $(newRowId).insert(td_element);
    
    html_class = 'applicationtimeSheet_element_add';
    if (!this.showCC)
        html_class += "_noCC";
    td_element = new Element( 'td', {
        id: 'applicationtimeSheet_add_' + newRowId,
        'class': html_class
    });
    if(!global.liteVersion)
        td_element.insert( new Element( 'span', {
            id: 'applicationtimeSheet_addSpan_' + newRowId,
            'title': this.addLabel,
            'class': 'applicationtimeSheet_element_centeredAddRemove application_main_title3 application_handCursor'
        }).insert(' + '));  
    else
        td_element.insert( new Element( 'button', {
            id: 'applicationtimeSheet_addSpan_' + newRowId,
            'title': this.addLabel,
            'class': 'applicationtimeSheet_element_centeredAddRemove application_main_title3 link'
        }).insert( ' + '));
    $(newRowId).insert(td_element);
    
    html_class = 'applicationtimeSheet_element_remove';
    if (!this.showCC)
        html_class += "_noCC";
    td_element = new Element( 'td', {
        id: 'applicationtimeSheet_remove_' + newRowId,
        'class': html_class
    });    
    if(!global.liteVersion)
        td_element.insert( new Element( 'span', {
            id: 'applicationtimeSheet_removeSpan_' + newRowId,
            'title': this.removeLabel,
            'class': 'applicationtimeSheet_element_centeredAddRemove application_main_title3 application_handCursor'
        }).insert( ' - '));
    else
        td_element.insert( new Element( 'button', {
            id: 'applicationtimeSheet_removeSpan_' + newRowId,
            'title': this.removeLabel,
            'class': 'applicationtimeSheet_element_centeredAddRemove application_main_title3 link'
        }).insert( ' - '));
    $(newRowId).insert(td_element);
    
    var timeTypeAutocompleter = new JSONAutocompleter('applicationtimeSheet_timeTypeDiv_' + newRowId, {
        showEverythingOnButtonClick: true,
        timeout: 1000,
        templateResult: '#{text}',
        templateOptionsList: '#{text}',
        minChars: 1,
        events: $H({ onResultSelected: 'EWS:autocompleterResultSelected'})
    }, this.timeTypes.get(this.currentUser.id));
    html_class = 'applicationtimeSheet_autocompleter';
    if (!this.showCC)
        html_class = 'applicationtimeSheet_autocompleter_noCC';
    $('text_area_applicationtimeSheet_timeTypeDiv_' + newRowId).addClassName(html_class);

    this.timeTypeAutocompleters.set(newRowId, timeTypeAutocompleter);
    if (this.showCC) {
        var costCenterAutocompleter = new JSONAutocompleter('applicationtimeSheet_costCenterDiv_' + newRowId, {
            showEverythingOnButtonClick: true,
            timeout: 1000,
            templateResult: '#{text}',
            templateOptionsList: '#{text}',
            minChars: 1,
            events: $H({ onResultSelected: 'EWS:autocompleterResultSelected'})
        }, this.costCenters);
        $('text_area_applicationtimeSheet_costCenterDiv_' + newRowId).addClassName('applicationtimeSheet_autocompleter');
        this.costCenterAutocompleters.set(newRowId, costCenterAutocompleter);
    }
    var indexes = this.dateCounter.get(stringDate).get('indexes');
    var prevIndex = parseInt(rowId.split('_')[2]);
    indexes.splice(indexes.indexOf(prevIndex) + 1, 0, dateCounter);
    if ($('applicationtimeSheet_hoursInput_' + rowId) && ($('applicationtimeSheet_removeSpan_' + rowId).innerHTML == ""))
        $('applicationtimeSheet_removeSpan_' + rowId).update(" - ");
    
    //Setting the observers onChange for the input fields
    $('applicationtimeSheet_hoursInput_' + newRowId).observe('change', this._checkElementToPopUp.bind(this));
    $('applicationtimeSheet_commentInput_' + newRowId).observe('change', this._checkElementToPopUp.bind(this));
    //Setting the observers onChange for the autocompleter
    document.observe('EWS:autocompleterResultSelected', this._checkElementToPopUp.bind(this));
},
/**
* @description Removes a row from the timesheet
* @param {String} rowId Row's id
*/
_removeRow: function(rowId) {
    var row = $(rowId);
    var rowInfo = rowId.split('_');
    var stringDate = rowInfo[1];
    var rowIndex = parseInt(rowInfo[2]);
    var indexes = this.dateCounter.get(stringDate).get('indexes');
    var index = indexes.indexOf(rowIndex);
    this.timeTypeAutocompleters.unset(rowId);
    if (this.showCC)
        this.costCenterAutocompleters.unset(rowId);
    var position = row.rowIndex;
    // First row (contains the date)
    if (index == 0) {
        var nextRowId = rowInfo[0] + "_" + stringDate + "_" + indexes[1];
        $('applicationtimeSheet_target_' + nextRowId).update($('applicationtimeSheet_target_' + rowId).innerHTML);
        $('applicationtimeSheet_date_' + nextRowId).update($('applicationtimeSheet_date_' + rowId).innerHTML);
        this.table.deleteRow(position);
        indexes = indexes.without(rowIndex);
        this.dateCounter.get(stringDate).set('indexes', indexes);
        if (indexes.length == 1)
            $('applicationtimeSheet_removeSpan_' + nextRowId).update("");
    }
    // Other row
    else {
        this.table.deleteRow(position);
        indexes = indexes.without(rowIndex);
        this.dateCounter.get(stringDate).set('indexes', indexes);
        if (indexes.length == 1) {
            var firstRowId = rowInfo[0] + "_" + stringDate + "_" + indexes[0];
            $('applicationtimeSheet_removeSpan_' + firstRowId).update("");
        }
    }
},
/**
* @description Resets the application clipboard hash
*/
_resetClipboard: function() {
    this.clipboard.set('timeType', '');
    if (this.showCC)
        this.clipboard.set('costCenter', '');
    this.clipboard.set('hours', '');
    this.clipboard.set('comment', '');
},
/**
* @description Copies a row's information
* @param {String} rowId Row's id
*/
_copyRow: function(rowId) {
    // Editable event
    if ($('applicationtimeSheet_hoursInput_' + rowId)) {
        var autocompleterInfo = this.timeTypeAutocompleters.get(rowId).getValue();
        if (!Object.isEmpty(autocompleterInfo))
            this.clipboard.set('timeType', unescape(this.timeTypeAutocompleters.get(rowId).getValue().textAdded));
        else
            this.clipboard.set('timeType', "");
        if (this.showCC) {
            autocompleterInfo = this.costCenterAutocompleters.get(rowId).getValue();
            if (!Object.isEmpty(autocompleterInfo))
                this.clipboard.set('costCenter', unescape(this.costCenterAutocompleters.get(rowId).getValue().textAdded));
            else
                this.clipboard.set('costCenter', "");
        }
        this.clipboard.set('hours', $('applicationtimeSheet_hoursInput_' + rowId).value);
        this.clipboard.set('comment', $('applicationtimeSheet_commentInput_' + rowId).value);
    }
    // Not editable event
    else {
        this.clipboard.set('timeType', $('applicationtimeSheet_timeType_' + rowId).innerHTML);
        if (this.showCC)
            this.clipboard.set('costCenter', $('applicationtimeSheet_costCenter_' + rowId).innerHTML);
        this.clipboard.set('hours', $('applicationtimeSheet_hours_' + rowId).innerHTML.gsub('&nbsp;', ''));
        this.clipboard.set('comment', $('applicationtimeSheet_comment_' + rowId).innerHTML);
    }
},
/**
* @description Pastes into a row the timesheet clipboard's content
* @param {String} rowId Row's id
*/
_pasteRow: function(rowId) {
    if (this.clipboard.get('timeType') != "") {
    
        this.timeTypeAutocompleters.get(rowId).setDefaultValue(this.clipboard.get('timeType'), true, false);
        if (this.showCC)
            this.costCenterAutocompleters.get(rowId).setDefaultValue(this.clipboard.get('costCenter'), true, false);
        $('applicationtimeSheet_hoursInput_' + rowId).value = this.clipboard.get('hours');
        $('applicationtimeSheet_commentInput_' + rowId).value = this.clipboard.get('comment');
        
        //Forcing the application to enable the popUp to leave because there were some changes
        this._checkElementToPopUp();
    }
    
},
/**
* @description Adds an empty row in the timesheet. Timesheet on task detail
* @param {String} rowId Previous row's id
*/
_addRow_read: function(rowId) {
    var row = $(rowId);
    var stringDate = rowId.split('_')[1];
    var dateCounter = this.dateCounter.get(stringDate).get('nextIndex');
    var newRowId = this.requesterId + "_" + stringDate + "_" + dateCounter;
    this.dateCounter.get(stringDate).set('nextIndex', dateCounter + 1);
    var position = row.rowIndex + 1;
    var newRow = this.table_read.insertRow(position);
    newRow.id = newRowId;
    newRow.className = 'applicationtimeSheet_tableRow';
    if (row.hasClassName('applicationtimeSheet_festivity'))
        newRow.className = 'applicationtimeSheet_festivity applicationtimeSheet_tableRow';
    if (row.hasClassName('applicationtimeSheet_collision'))
        newRow.className = 'applicationtimeSheet_collision applicationtimeSheet_tableRow';
    
    var html_element, td_element, html_class;
    
    $(newRowId).insert( new Element( 'td', {
        id: 'applicationtimeSheet_read_target_' + newRowId,
        'class': 'applicationtimeSheet_element_target application_main_soft_text',
        'title': global.getLabel('target')
    }));

    html_class = 'applicationtimeSheet_element_date';
    if (!this.showCC)
        html_class += "_noCC";
    $(newRowId).insert( new Element ( 'td', {
        id: 'applicationtimeSheet_read_date_' + newRowId,
        'class': html_class
    }));
    $(newRowId).insert( new Element( 'td', {
        id: 'applicationtimeSheet_read_status_' + newRowId,
        'class': 'applicationtimeSheet_element_status'
    }));
    $(newRowId).insert( new Element( 'td', {
        id: 'applicationtimeSheet_read_timeType_' + newRowId,
        'class': 'applicationtimeSheet_element_type'
    }).insert( new Element ( 'div' , {
            id: 'applicationtimeSheet_read_timeTypeDiv_' + newRowId
        })
    ));

    if (this.showCC){
        $(newRowId).insert( new Element( 'td', {
            id: 'applicationtimeSheet_read_costCenter_' + newRowId,
            'class': 'applicationtimeSheet_element_cost'
        }).insert( new Element ( 'div' , {
                id: 'applicationtimeSheet_read_costCenterDiv_' + newRowId
            })
        ));
    }
    
    var inputHour = new Element( 'input', {
            id: 'applicationtimeSheet_read_hoursInput_' + newRowId,
            'title': 'text',
            'class': 'applicationtimeSheet_element_hoursInput fieldDisplayer_input'
        });
    $(newRowId).insert( new Element ( 'td', {
        id: 'applicationtimeSheet_read_hours_' + newRowId,
        'class': 'applicationtimeSheet_element_hours'
    }).insert(inputHour));
    
    html_class = 'applicationtimeSheet_element_comment';
    var html_class2 = 'fieldDisplayer_input applicationtimeSheet_element_commentsInput';
    if (!this.showCC){
        html_class += "_noCC";
        html_class2 += "_noCC";
    }
    $(newRowId).insert( new Element( 'td', {
        id: 'applicationtimeSheet_read_comment_' + newRowId,
        'class': html_class
    }).insert( new Element( 'input', {
            id: 'applicationtimeSheet_read_commentInput_' + newRowId,
            'title': 'text',
            'class': html_class2
        })
    ));

    html_class = 'applicationtimeSheet_element_copy';
    if (!this.showCC)
        html_class += "_noCC";
    td_element = new Element( 'td', {
        id: 'applicationtimeSheet_read_copy_' + newRowId,
        'class': html_class
    });
    if(!global.liteVersion){
        td_element.insert( new Element( 'div', {
            id: 'applicationtimeSheet_read_copyDiv_' + newRowId,
            'title': this.copyLabel,
            'class': 'application_inProgress_training_icon_curr_div applicationtimeSheet_element_centeredCopy'
        }));
    }
    else{
        td_element.insert( new Element( 'button', {
            id: 'applicationtimeSheet_read_copyDiv_' + newRowId,
            'title': this.copyLabel,
            'class': 'application_inProgress_training_icon_curr_div applicationtimeSheet_element_centeredCopy'
        }).insert( 'C'));
    }
    $(newRowId).insert( td_element);
    
    html_class = 'applicationtimeSheet_element_paste';
    if (!this.showCC)
        html_class += "_noCC";
    td_element = new Element( 'td', {
        id: 'applicationtimeSheet_read_paste_' + newRowId,
        'class': html_class
    });

    if(!global.liteVersion){
        td_element.insert( new Element( 'div', {
            id: 'applicationtimeSheet_read_pasteDiv_' + newRowId,
            'title': this.pasteLabel,
            'class': 'application_pasteIcon applicationtimeSheet_element_centeredPaste'
        }));
    }
    else{
        td_element.insert( new Element( 'button', {
            id: 'applicationtimeSheet_read_pasteDiv_' + newRowId,
            'title': this.pasteLabel,
            'class': 'application_pasteIcon applicationtimeSheet_element_centeredPaste'
        }).insert( 'P'));
    }
    $(newRowId).insert( td_element);
    
    html_class = 'applicationtimeSheet_element_add';
    if (!this.showCC)
        html_class += "_noCC";
    td_element = new Element( 'td', {
        id: 'applicationtimeSheet_read_add_' + newRowId,
        'class': html_class
    }).insert( new Element( 'span', {
            id: 'applicationtimeSheet_read_addSpan_' + newRowId,
            'title': this.addLabel,
            'class': 'applicationtimeSheet_element_centeredAddRemove application_main_title3 application_handCursor'
    }).insert(' + '));
    $(newRowId).insert( td_element);

    html_class = 'applicationtimeSheet_element_remove';
    if (!this.showCC)
        html_class += "_noCC";
    td_element = new Element( 'td', {
        id: 'applicationtimeSheet_read_remove_' + newRowId,
        'class': html_class
    }).insert( new Element( 'span', {
        id: 'applicationtimeSheet_read_removeSpan_' + newRowId,
        'title': this.removeLabel,
        'class': 'applicationtimeSheet_element_centeredAddRemove application_main_title3 application_handCursor'
    }).insert(' - '));
    $(newRowId).insert( td_element);
    
    var timeTypeAutocompleter = new JSONAutocompleter('applicationtimeSheet_read_timeTypeDiv_' + newRowId, {
        showEverythingOnButtonClick: true,
        timeout: 1000,
        templateResult: '#{text}',
        templateOptionsList: '#{text}',
        minChars: 1
    }, this.timeTypes.get(this.requesterId));
    html_class = 'applicationtimeSheet_autocompleter';
    if (!this.showCC)
        html_class = 'applicationtimeSheet_autocompleter_noCC';
    $('text_area_applicationtimeSheet_read_timeTypeDiv_' + newRowId).addClassName(html_class);
    
    this.timeTypeAutocompleters.set(newRowId, timeTypeAutocompleter);
    if (this.showCC) {
        var costCenterAutocompleter = new JSONAutocompleter('applicationtimeSheet_read_costCenterDiv_' + newRowId, {
            showEverythingOnButtonClick: true,
            timeout: 1000,
            templateResult: '#{text}',
            templateOptionsList: '#{text}',
            minChars: 1
        }, this.costCenters);
        $('text_area_applicationtimeSheet_read_costCenterDiv_' + newRowId).addClassName('applicationtimeSheet_autocompleter');
        this.costCenterAutocompleters.set(newRowId, costCenterAutocompleter);
    }
    var indexes = this.dateCounter.get(stringDate).get('indexes');
    var prevIndex = parseInt(rowId.split('_')[2]);
    indexes.splice(indexes.indexOf(prevIndex) + 1, 0, dateCounter);
    if ($('applicationtimeSheet_read_hoursInput_' + rowId) && ($('applicationtimeSheet_read_removeSpan_' + rowId).innerHTML == ""))
        $('applicationtimeSheet_read_removeSpan_' + rowId).insert(" – ");
},
/**
* @description Removes a row from the timesheet. Timesheet on task detail
* @param {String} rowId Row's id
*/
_removeRow_read: function(rowId) {
    var row = $(rowId);
    var rowInfo = rowId.split('_');
    var stringDate = rowInfo[1];
    var rowIndex = parseInt(rowInfo[2]);
    var indexes = this.dateCounter.get(stringDate).get('indexes');
    var index = indexes.indexOf(rowIndex);
    this.timeTypeAutocompleters.unset(rowId);
    if (this.showCC)
        this.costCenterAutocompleters.unset(rowId);
    var position = row.rowIndex;
    // First row (contains the date)
    if (index == 0) {
        var nextRowId = rowInfo[0] + "_" + stringDate + "_" + indexes[1];
        $('applicationtimeSheet_read_target_' + nextRowId).update($('applicationtimeSheet_read_target_' + rowId).innerHTML);
        $('applicationtimeSheet_read_date_' + nextRowId).update($('applicationtimeSheet_read_date_' + rowId).innerHTML);
        this.table_read.deleteRow(position);
        indexes = indexes.without(rowIndex);
        this.dateCounter.get(stringDate).set('indexes', indexes);
        if (indexes.length == 1)
            $('applicationtimeSheet_read_removeSpan_' + nextRowId).update("");
    }
    // Other row
    else {
        this.table_read.deleteRow(position);
        indexes = indexes.without(rowIndex);
        this.dateCounter.get(stringDate).set('indexes', indexes);
        if (indexes.length == 1) {
            var firstRowId = rowInfo[0] + "_" + stringDate + "_" + indexes[0];
            $('applicationtimeSheet_read_removeSpan_' + firstRowId).update("");
        }
    }
},
/**
* @description Copies a row's information. Timesheet on task detail
* @param {String} rowId Row's id
*/
_copyRow_read: function(rowId) {
    // Editable event
    if ($('applicationtimeSheet_read_hoursInput_' + rowId)) {
        var autocompleterInfo = this.timeTypeAutocompleters.get(rowId).getValue();
        if (!Object.isEmpty(autocompleterInfo))
            this.clipboard.set('timeType', unescape(this.timeTypeAutocompleters.get(rowId).getValue().textAdded));
        else
            this.clipboard.set('timeType', "");
        if (this.showCC) {
            autocompleterInfo = this.costCenterAutocompleters.get(rowId).getValue();
            if (!Object.isEmpty(autocompleterInfo))
                this.clipboard.set('costCenter', unescape(this.costCenterAutocompleters.get(rowId).getValue().textAdded));
            else
                this.clipboard.set('costCenter', "");
        }
        this.clipboard.set('hours', $('applicationtimeSheet_read_hoursInput_' + rowId).value);
        this.clipboard.set('comment', $('applicationtimeSheet_read_commentInput_' + rowId).value);
    }
    // Not editable event
    else {
        this.clipboard.set('timeType', $('applicationtimeSheet_read_timeType_' + rowId).innerHTML);
        if (this.showCC)
            this.clipboard.set('costCenter', $('applicationtimeSheet_read_costCenter_' + rowId).innerHTML);
        this.clipboard.set('hours', $('applicationtimeSheet_read_hours_' + rowId).innerHTML.gsub('&nbsp;', ''));
        this.clipboard.set('comment', $('applicationtimeSheet_read_comment_' + rowId).innerHTML);
    }
},
/**
* @description Pastes into a row the timesheet clipboard's content. Timesheet on task detail
* @param {String} rowId Row's id
*/
_pasteRow_read: function(rowId) {
    if (this.clipboard.get('timeType') != "") {
        this.timeTypeAutocompleters.get(rowId).setDefaultValue(this.clipboard.get('timeType'), true, false);
        if (this.showCC)
            this.costCenterAutocompleters.get(rowId).setDefaultValue(this.clipboard.get('costCenter'), true, false);
        $('applicationtimeSheet_read_hoursInput_' + rowId).value = this.clipboard.get('hours');
        $('applicationtimeSheet_read_commentInput_' + rowId).value = this.clipboard.get('comment');
    }
},
/**
* @description Changes the timesheet to the previous/next one
* @param {Number} next Timesheet we want to show: -1 -> previous; 1 -> next; 3 -> 3rd next
*/
_changeTimesheet: function(next) {
    if(this.changesToSave)
        this._showChangePeriodPopUp("changePeriod", next);
    else{
        //Disabling the observers
        document.stopObserving('change');
        document.stopObserving('EWS:autocompleterResultSelected');
        
        var newDate = this.currentDate.clone();
        if (this.monthly)
            newDate.addMonths(1 * next);
        else
            newDate.addDays(this.days * next);
        this._dateChange(newDate);
    }
},
/**
* @description Enables upper form events and sets its date. Read only mode timesheet
*/
_enableUpperForm_read: function() {
    var dateTitle;
    if (this.monthly)
        dateTitle = global.getLabel(this.currentDate.toString('MMM').toLowerCase() + 'Month') + " " + this.currentDate.toString('yyyy');
    else {
        dateTitle = this.currentDate.toString(global.dateFormat) + " - " + this.currentEndDate.toString(global.dateFormat);
    }
    $('applicationtimeSheet_read_currentDate').update(dateTitle);
    //Enable Submit button
    if (this.inboxModeUPD) {
        if (!Object.isEmpty(this.buttons)) {
            this.buttons.enable('applicationtimeSheet_read_submitButton');
        }
    }
},
/** 
* @description Disables upper form events and resets its date. Read only mode timesheet
*/
_disableUpperForm_read: function() {
    //this.table_read.update('');
    $('applicationtimeSheet_read_currentDate').update('');
    //Disable Submit button
    if (this.inboxModeUPD) {
        if (!Object.isEmpty(this.buttons)) {
            this.buttons.disable('applicationtimeSheet_read_submitButton');
        }
    }

},
/**
* @description Enables upper form events and sets its date
*/
_enableUpperForm: function() {
    $('applicationtimeSheet_prevButton').observe('click', this._changeTimesheet.bind(this, -1));
    $('applicationtimeSheet_prevButton').addClassName('application_handCursor');
    $('applicationtimeSheet_postButton').observe('click', this._changeTimesheet.bind(this, 1));
    $('applicationtimeSheet_postButton').addClassName('application_handCursor');
    this.buttonTimesheet.enable('applicationtimeSheet_todayButton');
    this.buttons.enable('applicationtimeSheet_saveButton');
    this.buttons.enable('applicationtimeSheet_submitButton');
    var dateTitle;
    if (this.monthly)
        dateTitle = global.getLabel(this.currentDate.toString('MMM').toLowerCase() + 'Month') + " " + this.currentDate.toString('yyyy');
    else
        dateTitle = this.currentDate.toString(global.dateFormat) + " - " + this.currentEndDate.toString(global.dateFormat);
    $('applicationtimeSheet_currentDate').update(dateTitle);
},
/**
* @description Disables upper form events and resets its date
*/
_disableUpperForm: function() {
    $('applicationtimeSheet_prevButton').stopObserving();
    $('applicationtimeSheet_prevButton').removeClassName('application_handCursor');
    $('applicationtimeSheet_postButton').stopObserving();
    $('applicationtimeSheet_postButton').removeClassName('application_handCursor');
    this.buttonTimesheet.disable('applicationtimeSheet_todayButton');
    if (!Object.isEmpty(this.buttons)) {
        this.buttons.disable('applicationtimeSheet_saveButton');
        this.buttons.disable('applicationtimeSheet_submitButton');
    }
    $('applicationtimeSheet_currentDate').update('');
},
/**
* @description Checks which element was clicked and does the proper action
*/
_checkElement: function(event) {
    var elementId = (event.target) ? event.target.id : event.srcElement.id;
    if (!Object.isEmpty(elementId)) {
        if (this.comeFrom == "inbox") {
            var action = elementId.split('_')[2];
            var row = elementId.substring(elementId.indexOf(action) + action.length + 1);
            switch (action) {
                case "addSpan":
                    this._addRow_read(row);
                    break;
                case "removeSpan":
                    this._removeRow_read(row);
                    break;
                case "copyDiv":
                    this._copyRow_read(row);
                    break;
                case "pasteDiv":
                    this._pasteRow_read(row);
            }
        }
        else {
            var action = elementId.split('_')[1];
            var row = elementId.substring(elementId.indexOf(action) + action.length + 1);
            switch (action) {
                case "addSpan":
                    this._addRow(row);
                    break;
                case "removeSpan":
                    this._removeRow(row);
                    break;
                case "copyDiv":
                    this._copyRow(row);
                    break;
                case "pasteDiv":
                    this._pasteRow(row);
            }
        }
    }
},
/**
* @description Inserts into the timesheet all events received
*/
_fillEvents: function() {
    var dateKeys = this.currentTimesheet.keys();
    var length = dateKeys.length;
    for (var i = 0; i < length; i++) {
        var events = this.currentTimesheet.get(dateKeys[i]);
        var length2 = events.length;
        for (var j = 0; j < length2; j++) {
            if (this.comeFrom == "inbox")
                this._addFilledRow_read(events[j]);
            else
                this._addFilledRow(events[j]);
        }
    }
},
/**
* @description Adds a filled (with an event's information) row in the timesheet. Read only mode
* @param {Hash} event Event to show
*/
_addFilledRow_read: function(event) {
    //if (Object.isEmpty(this.requestId) && (event.get('APPID').value == 'TSH_MGMT'))
    //    this.requestId = event.get('ID').gsub('_', '');
    if (Object.isEmpty(this.requestId))
        this.requestId = this.requestTaskId;
    var initialDate = Date.parseExact(event.get('BEGDA').value, this.dateFormat);
    var finalDate = Date.parseExact(event.get('ENDDA').value, this.dateFormat);
    var oneDayEvent = (Date.compare(initialDate, finalDate) != 0) ? false : true;
    if (this.inboxModeUPD)
        var editable = true;
    else
        var editable = false;
    var html;
    var status = parseInt(event.get('STATUS').value);
    var statusHtml;
    // Event info
    var hourToShow = Object.isEmpty(event.get('STDAZ').value) ? '' : event.get('STDAZ').value;
    var hours = prepareTextToEdit(prepareTextToShow(hourToShow));
    if (hours == null)
        hours = "";
    var commentToShow = Object.isEmpty(event.get('COMMENT').text) ? '' : event.get('COMMENT').text;
    var comment = prepareTextToEdit(prepareTextToShow(commentToShow));
    if (comment == null)
        comment = "";
    // Truncate time type, cost center and comment if their length is bigger than these variables
    var commentLength = 18;
    var typeAndCostLength = 20;
    // We need only days inside the timesheet's date range
    if (initialDate.isBefore(this.currentDate))
        initialDate = this.currentDate.clone();
    if (finalDate.isAfter(this.currentEndDate))
        finalDate = this.currentEndDate.clone();
    // Approved events will not be shown
    var iconClass = "";
    var iconTitle = "";
    if ((status == 20) || (status == 21) || (status == 30) || (status == 31) || (status == 10) || (status == 50)) {
        // Sent for approval
        if ((status == 20) || (status == 30)) {
            iconClass = "application_rounded_question1";
            iconTitle = this.approvalLabel;
        }
        // Sent for deletion
        if ((status == 21) || (status == 31)) {
            iconClass = "application_rounded_x1";
            iconTitle = this.deletionLabel;
        }
        // Draft
        if (status == 10) {
            iconClass = "application_rounded_draft1";
            iconTitle = this.draftLabel;
        }
        // To be discussed
        if (status == 50) {
            iconClass = 'application_rounded_ok1';
            iconTitle = this.tbpLabel;
        }
    }
    if (iconClass == "" && this.inboxModeUPD)
        editable = false;
    do {
        var stringDate = initialDate.clone().toString(this.dateFormat);
        var inDateRange = initialDate.between(this.retroDate, this.futureDate);
        var tableInfo = this.dateCounter.get(stringDate);
        var indexes = tableInfo.get('indexes');
        var dateCounter = indexes.last();
        var rowId = this.requesterId + "_" + stringDate + "_" + dateCounter;
        // Checking if the event lasts more than one day to distribute the number of hours
        var wscHours = Object.isEmpty(this.workschedule.get(stringDate)) ? '0' : this.workschedule.get(stringDate).get('hours');
        // If there are more event's hours than workSchedule hours --> event lasting more than one day
        // In that case we will show workSchedule hours as number of hours
        var dayHours = !oneDayEvent && (parseFloat(hours) > parseFloat(wscHours)) ? wscHours : hours;
        // Add a new row or replace an existing one (by default add it)
        var add = true;
        var row = $(rowId);
        // Only one row for this date -> it could be empty or not
        if (indexes.length == 1) {
            // Empty row -> Replace it for the filled one
            if (this.inboxModeUPD) {
                //Comprobar la condición
                if(!Object.isEmpty($('applicationtimeSheet_read_hoursInput_' + rowId)))
                    if ($('applicationtimeSheet_read_hoursInput_' + rowId).value == '')  //&& (Object.isEmpty(this.timeTypeAutocompleters.get(rowId).getValue()))))
                    	add = false;
            }
            else {
                if ($('applicationtimeSheet_read_hours_' + rowId).innerHTML == '')
                    add = false;
            }
        }
        var html_class = "";
        if (inDateRange && !Object.isEmpty(iconClass))
            html_class += "applicationtimeSheet_eeColor ";
        if (!inDateRange && !Object.isEmpty(iconClass))
            html_class += "applicationtimeSheet_eeColor2 ";
        html_class += "CAL_IE6_event applicationtimeSheet_element_centeredStatus";
        if (!this.showCC)
            html_class += "_noCC";
        html_class += " " + iconClass;
        
        var statusHtml = new Element( 'div', {
            'class': html_class,
            'title': iconTitle
        });
        if(!global.liteVersion)
            statusHtml.update('&nbsp;');
        else{
            switch(iconClass)
            {
                case "application_rounded_question1":
                    statusHtml.update('&nbsp;?&nbsp;');
                    break;
                case "application_rounded_draft1":
                    statusHtml.update('&nbsp;D&nbsp;');
                    break;
                case "application_rounded_x1":
                    statusHtml.update('&nbsp;X&nbsp;');
                    break;
                case "application_rounded_ok1":
                    statusHtml.update('&nbsp;&#8730;&nbsp;');
                    break;
            }
        }
        // Filled row or more than one row for this date -> add a new row
        if (add)
        {
            dateCounter = tableInfo.get('nextIndex');
            indexes.push(dateCounter);
            tableInfo.set('nextIndex', dateCounter + 1);
            var position = row.rowIndex + 1;
            var oldRowId = rowId;
            rowId = this.requesterId + "_" + stringDate + "_" + dateCounter;
            var newRow = this.table_read.insertRow(position);
            newRow.id = rowId;
            newRow.className = 'applicationtimeSheet_tableRow';
            if (row.hasClassName('applicationtimeSheet_festivity'))
                newRow.className = 'applicationtimeSheet_festivity applicationtimeSheet_tableRow';
            
            $(rowId).insert( new Element( 'td', {
                id: 'applicationtimeSheet_read_target_' + rowId,
                'class': 'applicationtimeSheet_element_target application_main_soft_text',
                'title': global.getLabel('target')
            }));
            
            html_class = 'applicationtimeSheet_element_date';
            if (!this.showCC)
                html_class += "_noCC";
            $(rowId).insert( new Element( 'td', {
                id: 'applicationtimeSheet_read_date_' + rowId,
                'class': html_class
            }));
            
            $(rowId).insert( new Element( 'td', {
                id: 'applicationtimeSheet_read_status_' + rowId,
                'class': 'applicationtimeSheet_element_status'
            }).insert( statusHtml));
            
            var td_element =  new Element( 'td', {
                id: 'applicationtimeSheet_read_timeType_' + rowId,
                'class': 'applicationtimeSheet_element_type'
            });           
            if (editable)
                td_element.insert( new Element( 'div', {
                    id: 'applicationtimeSheet_read_timeTypeDiv_' + rowId
                }));
            $(rowId).insert(td_element);
            
            if (this.showCC) {
                td_element = new Element( 'td', {
                    id: 'applicationtimeSheet_read_costCenter_' + rowId,
                    'class': 'applicationtimeSheet_element_cost'
                });
                if (editable)
                    td_element.insert( new Element( 'div', {
                        id: 'applicationtimeSheet_read_costCenterDiv_' + rowId
                    }));
            }
            $(rowId).insert(td_element);
            
            td_element = new Element( 'td', {
                id: 'applicationtimeSheet_read_hours_' + rowId,
                'class': 'applicationtimeSheet_element_hours applicationtimeSheet_softText'
            });
            if (editable && inDateRange){
                var inputHour = new Element( 'input', {
                    id: 'applicationtimeSheet_read_hoursInput_' + rowId,
                    'type': 'text',
                    'class': 'applicationtimeSheet_element_hoursInput fieldDisplayer_input'
                });
                td_element.insert(inputHour);
            }
            $(rowId).insert(td_element);
            
            html_class = 'applicationtimeSheet_softText applicationtimeSheet_element_comment';
            if (!this.showCC)
                html_class += "_noCC";
            td_element = new Element( 'td', {
                id: 'applicationtimeSheet_read_comment_' + rowId,
                'class': html_class
            });
            if (editable && inDateRange) {
                    html_class = 'fieldDisplayer_input applicationtimeSheet_element_commentsInput';
                    if (!this.showCC)
                        html_class += "_noCC";
                    td_element.insert( new Element( 'input', {
                        id: 'applicationtimeSheet_read_commentInput_' + rowId,
                        'type': 'text',
                        'class': html_class
                    }));
            }
            $(rowId).insert(td_element);
            
            if (this.inboxModeUPD) {
                html_class = 'applicationtimeSheet_element_copy';
                if (!this.showCC)
                    html_class += "_noCC";
                td_element = new Element( 'td', {
                    id: 'applicationtimeSheet_copy_' + rowId,
                    'class': html_class
                });
                if(!global.liteVersion)
                    td_element.insert( new Element( 'div', {
                        id: 'applicationtimeSheet_copyDiv_' + rowId,
                        'title': this.copyLabel,
                        'class': 'application_inProgress_training_icon_curr_div applicationtimeSheet_element_centeredCopy'
                    }));
                else
                    td_element.insert( new Element( 'button', {
                        id: 'applicationtimeSheet_copyDiv_' + rowId,
                        'title': this.copyLabel,
                        'class': 'application_inProgress_training_icon_curr_div applicationtimeSheet_element_centeredCopy'
                    }).insert('C'));
                $(rowId).insert(td_element);
                
                html_class = 'applicationtimeSheet_element_paste';
                if (!this.showCC)
                    html_class += "_noCC";
                td_element = new Element( 'td', {
                    id: 'applicationtimeSheet_paste_' + rowId,
                    'class': html_class
                });
                if (editable){
                    if(!global.liteVersion)
                        td_element.insert( new Element( 'div', {
                            id: 'applicationtimeSheet_pasteDiv_' + rowId,
                            'title': this.pasteLabel,
                            'class': 'application_pasteIcon applicationtimeSheet_element_centeredPaste'
                        }));
                    else
                        td_element.insert( new Element( 'div', {
                            id: 'applicationtimeSheet_pasteDiv_' + rowId,
                            'title': this.pasteLabel,
                            'class': 'application_pasteIcon applicationtimeSheet_element_centeredPaste'
                        }).insert( 'P'));
                }
                $(rowId).insert(td_element);
                
                html_class = 'applicationtimeSheet_element_add';
                if (!this.showCC)
                    html_class += "_noCC";
                td_element = new Element( 'td', {
                    id: 'applicationtimeSheet_add_' + rowId,
                    'class': html_class
                });
                if(!global.liteVersion)
                    td_element.insert( new Element( 'span', {
                        id: 'applicationtimeSheet_addSpan_' + rowId,
                        'title': this.addLabel,
                        'class': 'applicationtimeSheet_element_centeredAddRemove application_main_title3 application_handCursor'
                    }).insert( ' + '));
                else
                    td_element.insert( new Element( 'button', {
                        id: 'applicationtimeSheet_addSpan_' + rowId,
                        'title': this.addLabel,
                        'class': 'applicationtimeSheet_element_centeredAddRemove application_main_title3 link'
                    }).insert( ' + '));
                $(rowId).insert(td_element);
                
                var o_element;
                html_class = 'applicationtimeSheet_element_remove';
                if (!this.showCC)
                    html_class += "_noCC";
                td_element = new Element( 'td', {
                    id: 'applicationtimeSheet_remove_' + rowId,
                    'class': html_class
                });    
                if(!global.liteVersion)
                    o_element = new Element( 'span', {
                        id: 'applicationtimeSheet_removeSpan_' + rowId,
                        'title': this.removeLabel,
                        'class': 'applicationtimeSheet_element_centeredAddRemove application_main_title3 application_handCursor'
                    });
                else
                    o_element = new Element( 'button', {
                        id: 'applicationtimeSheet_removeSpan_' + rowId,
                        'title': this.removeLabel,
                        'class': 'applicationtimeSheet_element_centeredAddRemove application_main_title3 link'
                    });
                if (editable)
                    o_element.insert( ' - ');
                $(rowId).insert(td_element.insert( o_element));
            }
            row = newRow;
        }
        // Replacing empty row
        else {
            $('applicationtimeSheet_read_status_' + rowId).update(statusHtml);
            var timeTypeHtml = (editable) ? new Element( 'div', { id: 'applicationtimeSheet_read_timeTypeDiv_' + rowId}) : "";
            $('applicationtimeSheet_read_timeType_' + rowId).update(timeTypeHtml);
            if (this.showCC) {
                var costCenterHtml = (editable) ? new Element( 'div', { id: 'applicationtimeSheet_read_costCenterDiv_' + rowId}) : "";
                $('applicationtimeSheet_read_costCenter_' + rowId).update(costCenterHtml);
            }
            var hoursHtml = (editable) ? new Element( 'input', { id: 'applicationtimeSheet_read_hoursInput_' + rowId, 'type': 'text', 'class': 'applicationtimeSheet_element_hoursInput fieldDisplayer_input'}) : "";
            $('applicationtimeSheet_read_hours_' + rowId).update(hoursHtml);
            var commentHtml = "";
            if (editable) {
                html_class = 'fieldDisplayer_input applicationtimeSheet_element_commentsInput';
                if (!this.showCC)
                    html_class += "_noCC";
                commentHtml = new Element( 'input', { 
                    id: 'applicationtimeSheet_read_commentInput_' + rowId, 
                    'type': 'text', 
                    'class': html_class 
                });
            }
            $('applicationtimeSheet_read_comment_' + rowId).update(commentHtml);
        }

        // Filling editable fields...
        if (editable) {
            //Fill autocompleter for Time Type
            var timeTypeAutocompleter = new JSONAutocompleter('applicationtimeSheet_read_timeTypeDiv_' + rowId, {
                showEverythingOnButtonClick: true,
                timeout: 1000,
                templateResult: '#{text}',
                templateOptionsList: '#{text}',
                minChars: 1
            }, this.timeTypes.get(this.requesterId));
            html_class = 'applicationtimeSheet_autocompleter_noCC';
            if (this.showCC)
                html_class = 'applicationtimeSheet_autocompleter';
            $('text_area_applicationtimeSheet_read_timeTypeDiv_' + rowId).addClassName( html_class);

            this.timeTypeAutocompleters.set(rowId, timeTypeAutocompleter);
            timeTypeAutocompleter.setDefaultValue(event.get('AWART').value, false, false);
            
            //Fill autocompleter for Cost Center
            if (this.showCC) {
                var costCenterAutocompleter = new JSONAutocompleter('applicationtimeSheet_read_costCenterDiv_' + rowId, {
                    showEverythingOnButtonClick: true,
                    timeout: 1000,
                    templateResult: '#{text}',
                    templateOptionsList: '#{text}',
                    minChars: 1
                }, this.costCenters);
                $('text_area_applicationtimeSheet_read_costCenterDiv_' + rowId).addClassName('applicationtimeSheet_autocompleter');
                this.costCenterAutocompleters.set(rowId, costCenterAutocompleter);
                costCenterAutocompleter.setDefaultValue(event.get('KOSTL').value, false, false);
            }
            $('applicationtimeSheet_read_hoursInput_' + rowId).value = hours;
            $('applicationtimeSheet_read_commentInput_' + rowId).value = comment;
            // Adding a "-" to the previous row it is editable
//            if ((add) && ($('applicationtimeSheet_read_hoursInput_' + oldRowId))) {
//                //$('applicationtimeSheet_read_removeSpan_' + oldRowId).update(" - ");
//            }
        }
        // ... and not editable ones
        else {
            this.timeTypeAutocompleters.unset(rowId);
            $('applicationtimeSheet_read_timeType_' + rowId).update(event.get('AWART').text.truncate(typeAndCostLength));
            $('applicationtimeSheet_read_timeType_' + rowId).writeAttribute('title', event.get('AWART').text);
            if (this.showCC) {
                if (!Object.isEmpty(event.get('KOSTL')) && !Object.isEmpty(event.get('KOSTL').text)) {
                    $('applicationtimeSheet_read_costCenter_' + rowId).update(event.get('KOSTL').text.truncate(typeAndCostLength));
                    $('applicationtimeSheet_read_costCenter_' + rowId).writeAttribute('title', event.get('KOSTL').text);
                }
            }
            $('applicationtimeSheet_read_hours_' + rowId).update("&nbsp;" + dayHours);
            $('applicationtimeSheet_read_comment_' + rowId).update(comment.capitalize().truncate(commentLength));
            if (comment.length > commentLength)
                $('applicationtimeSheet_read_comment_' + rowId).writeAttribute('title', comment);
            if ($('applicationtimeSheet_read_removeSpan_' + rowId))
                $('applicationtimeSheet_read_removeSpan_' + rowId).update("");
            if ($('applicationtimeSheet_read_paste_' + rowId))
                $('applicationtimeSheet_read_paste_' + rowId).update("");
            if ($('applicationtimeSheet_read_copy_' + rowId)) {
                if ($('applicationtimeSheet_read_copy_' + rowId).innerHTML == "") {
                    var htmlCopy;
                    if(!global.liteVersion)
                        htmlCopy = new Element( 'div', {
                            id: 'applicationtimeSheet_read_copyDiv_' + rowId,
                            'title': this.copyLabel,
                            'class': 'application_inProgress_training_icon_curr_div applicationtimeSheet_element_centeredCopy'
                        });
                    else
                        htmlCopy = new Element( 'button', {
                            id: 'applicationtimeSheet_read_copyDiv_' + rowId,
                            'title': this.copyLabel,
                            'class': 'application_inProgress_training_icon_curr_div applicationtimeSheet_element_centeredCopy'
                        }).insert( 'C');
                    S('applicationtimeSheet_read_copy_' + rowId).update(htmlCopy);
                }
            }
        }
        initialDate.addDays(1);
    } while (Date.compare(initialDate, finalDate) < 1);
},
/**
* @description Adds a filled (with an event's information) row in the timesheet
* @param {Hash} event Event to show
*/
_addFilledRow: function(event) {
    if (Object.isEmpty(this.requestId) && (event.get('APPID').value == 'TSH_MGMT'))
        this.requestId = event.get('ID').gsub('_', '');
    var initialDate = Date.parseExact(event.get('BEGDA').value, this.dateFormat);
    var finalDate = Date.parseExact(event.get('ENDDA').value, this.dateFormat);
    var oneDayEvent = (Date.compare(initialDate, finalDate) != 0) ? false : true;
    /*EDITABLE: 
    Related to where the events were created (calendars or timesheet)    
      DISPLAY:
    Related to logged users and permissions
    */
    if(!Object.isEmpty(event.get('DISPLAY')) ){
        var editable = (event.get('EDITABLE').value == 'X') && (event.get('DISPLAY').value == null) ? true : false;
    }else{
        var editable = (event.get('EDITABLE').value == 'X') ? true : false;
    }
    var html;
    var status = parseInt(event.get('STATUS').value);
    var statusHtml;
    // Event info
    var hourToShow = Object.isEmpty(event.get('STDAZ').value) ? '' : event.get('STDAZ').value;
    var hours = prepareTextToEdit(prepareTextToShow(hourToShow));
    if (hours == null)
        hours = "";
    var commentToShow = Object.isEmpty(event.get('COMMENT').text) ? '' : event.get('COMMENT').text;
    var comment = prepareTextToEdit(prepareTextToShow(commentToShow));
    if (comment == null)
        comment = "";
    // Truncate time type, cost center and comment if their length is bigger than these variables
    var commentLength = 18;
    var typeAndCostLength = 20;
    // We need only days inside the timesheet's date range
    if (initialDate.isBefore(this.currentDate))
        initialDate = this.currentDate.clone();
    if (finalDate.isAfter(this.currentEndDate))
        finalDate = this.currentEndDate.clone();
    // Approved events will not be shown
    var iconClass = "";
    var iconTitle = "";
    if ((status == 20) || (status == 21) || (status == 30) || (status == 31) || (status == 10) || (status == 50)) {
        // Sent for approval
        if ((status == 20) || (status == 30)) {
            iconClass = "application_rounded_question1";
            iconTitle = this.approvalLabel;
        }
        // Sent for deletion
        if ((status == 21) || (status == 31)) {
            iconClass = "application_rounded_x1";
            iconTitle = this.deletionLabel;
        }
        // Draft
        if (status == 10) {
            iconClass = "application_rounded_draft1";
            iconTitle = this.draftLabel;
        }
        // To be discussed
        if (status == 50) {
            iconClass = 'application_rounded_ok1';
            iconTitle = this.tbpLabel;
        }
    }
    do {
        var stringDate = initialDate.clone().toString(this.dateFormat);
        var inDateRange = initialDate.between(this.retroDate, this.futureDate);
        var tableInfo = this.dateCounter.get(stringDate);
        var indexes = tableInfo.get('indexes');
        var dateCounter = indexes.last();
        var rowId = this.currentUser.id + "_" + stringDate + "_" + dateCounter;
        // Checking if the event lasts more than one day to distribute the number of hours
        var wscHours = Object.isEmpty(this.workschedule.get(stringDate)) ? '0' : this.workschedule.get(stringDate).get('hours');
        // If there are more event's hours than workSchedule hours --> event lasting more than one day
        // In that case we will show workSchedule hours as number of hours
        var dayHours = !oneDayEvent && (parseFloat(hours) > parseFloat(wscHours)) ? wscHours : hours;
        //Set the dayHours with the correct decimal separator
        if(dayHours.include(global.millionsSeparator))
            dayHours = dayHours.gsub(global.millionsSeparator, global.commaSeparator);
        // Add a new row or replace an existing one (by default add it)
        var add = true;
        var row = $(rowId);
        // Only one row for this date -> it could be empty or not
        if (indexes.length == 1) {
            // Empty row -> Replace it for the filled one
            if (($('applicationtimeSheet_hours_' + rowId).innerHTML.include("---")) || (($('applicationtimeSheet_hoursInput_' + rowId)) && (Object.isEmpty(this.timeTypeAutocompleters.get(rowId).getValue()))))
                add = false;
        }
        
        var html_class = "";
        if (inDateRange && !Object.isEmpty(iconClass))
            html_class += "applicationtimeSheet_eeColor ";
        if (!inDateRange && !Object.isEmpty(iconClass))
            html_class += "applicationtimeSheet_eeColor2 ";
        html_class += "CAL_IE6_event applicationtimeSheet_element_centeredStatus";
        if (!this.showCC)
            html_class += "_noCC ";
        html_class += iconClass;
        var statusHtml = new Element( 'div', {
            'class': html_class,
            'title': iconTitle
        });
        if(!global.liteVersion)
            statusHtml.insert( '&nbsp;');
        else{
            switch(iconClass)
            {
                case "application_rounded_question1":
                    statusHtml.update( '&nbsp;?&nbsp;');
                    break;
                case "application_rounded_draft1":
                    statusHtml.update( '&nbsp;D&nbsp;');
                    break;
                case "application_rounded_x1":
                    statusHtml.update( '&nbsp;X&nbsp;');
                    break;
                case "application_rounded_ok1":
                    statusHtml.update( '&nbsp;&#8730;&nbsp;');
                    break;
            }
        }
        // Filled row or more than one row for this date -> add a new row
        if (add) 
        {
            dateCounter = tableInfo.get('nextIndex');
            indexes.push(dateCounter);
            tableInfo.set('nextIndex', dateCounter + 1);
            var position = row.rowIndex + 1;
            var oldRowId = rowId;
            rowId = this.currentUser.id + "_" + stringDate + "_" + dateCounter;
            var newRow = this.table.insertRow(position);
            newRow.id = rowId;
            newRow.className = 'applicationtimeSheet_tableRow';
            if (row.hasClassName('applicationtimeSheet_festivity'))
                newRow.className = 'applicationtimeSheet_festivity applicationtimeSheet_tableRow';
            
            $(rowId).insert( new Element( 'td', {
                id: 'applicationtimeSheet_target_' + rowId,
                'class': 'applicationtimeSheet_element_target application_main_soft_text',
                'title': global.getLabel('target')
            }));   
            
            html_class = 'applicationtimeSheet_element_date';
            if (!this.showCC)
                html_class += "_noCC";
            $(rowId).insert( new Element( 'td', {
                id: 'applicationtimeSheet_date_' + rowId,
                'class': html_class
            }));

            $(rowId).insert( new Element( 'td', {
                id: 'applicationtimeSheet_status_' + rowId,
                'class': 'applicationtimeSheet_element_status'
            }).insert( statusHtml));
            
            html_class = 'applicationtimeSheet_element_type';
            if (!inDateRange)
                html_class += " applicationtimeSheet_softText";
            var td_element = new Element ( 'td', {
                id: 'applicationtimeSheet_timeType_' + rowId,
                'class': html_class
            });
            if (editable && inDateRange)
                td_element.insert( new Element( 'div', {
                    id: 'applicationtimeSheet_timeTypeDiv_' + rowId
                }));
            if (this.showCC) {
                html_class = 'applicationtimeSheet_element_cost';
                if (!inDateRange)
                    html_class += " applicationtimeSheet_softText";
                var o_element = new Element( 'td', {
                    id: 'applicationtimeSheet_costCenter_' + rowId,
                    'class': html_class
                });
                if (editable && inDateRange)
                    o_element.insert( new Element( 'div', {
                        id: 'applicationtimeSheet_costCenterDiv_' + rowId
                    }));
                td_element.insert( o_element);
            }
            $(rowId).insert( td_element);
            
            html_class = 'applicationtimeSheet_element_hours';
            if (!inDateRange)
                html_class += " applicationtimeSheet_softText";
            td_element = new Element( 'td', {
                id: 'applicationtimeSheet_hours_' + rowId,
                'class': html_class
            });    
            if (editable && inDateRange)
                td_element.insert( new Element( 'input', {
                    id: 'applicationtimeSheet_hoursInput_' + rowId,
                    'type': 'text',
                    'class': 'applicationtimeSheet_element_hoursInput fieldDisplayer_input'
                }));
            $(rowId).insert( td_element);
            
            html_class = 'applicationtimeSheet_element_comment';
            if (!this.showCC)
                html_class += "_noCC";
            if (!inDateRange)
                html_class += " applicationtimeSheet_softText";
            td_element = new Element( 'td', {
                id: 'applicationtimeSheet_comment_' + rowId,
                'class': html_class
            });           
            if (editable && inDateRange) {
                html_class = 'fieldDisplayer_input applicationtimeSheet_element_commentsInput';
                if (!this.showCC)
                    html_class += "_noCC";
                td_element.insert( new Element( 'input', {
                    id: 'applicationtimeSheet_commentInput_' + rowId,
                    'type': 'text',
                    'class': html_class
                }));
            }
            $(rowId).insert( td_element);
            
            html_class = 'applicationtimeSheet_element_copy';
            if (!this.showCC)
                html_class += "_noCC";
            td_element = new Element( 'td', {
                id: 'applicationtimeSheet_copy_' + rowId,
                'class': html_class
            });            
            if(!global.liteVersion)
                td_element.insert( new Element('div', {
                    id: 'applicationtimeSheet_copyDiv_' + rowId,
                    'title': this.copyLabel,
                    'class': 'application_inProgress_training_icon_curr_div applicationtimeSheet_element_centeredCopy'
                }));
            else
                td_element.insert( new Element('button', {
                    id: 'applicationtimeSheet_copyDiv_' + rowId,
                    'title': this.copyLabel,
                    'class': 'application_inProgress_training_icon_curr_div applicationtimeSheet_element_centeredCopy'
                }).insert( 'C'));   
            $(rowId).insert( td_element);
            
            html_class = 'applicationtimeSheet_element_paste';
            if (!this.showCC)
                html_class += "_noCC";
            td_element = new Element( 'td', {
                id: 'applicationtimeSheet_paste_' + rowId,
                'class': html_class
            });
            if (editable && inDateRange){
                if(!global.liteVersion)
                    td_element.insert( new Element( 'div', {
                        id: 'applicationtimeSheet_pasteDiv_' + rowId,
                        'title': this.pasteLabel,
                        'class': 'application_pasteIcon applicationtimeSheet_element_centeredPaste'
                    }));
                else
                    td_element.insert( new Element( 'button', {
                        id: 'applicationtimeSheet_pasteDiv_' + rowId,
                        'title': this.pasteLabel,
                        'class': 'application_pasteIcon applicationtimeSheet_element_centeredPaste'
                    }).insert( 'P'));
            }
            $(rowId).insert( td_element);
            
            html_class = 'applicationtimeSheet_element_add';
            if (!this.showCC)
                html_class += "_noCC";
            td_element = new Element( 'td', {
                id: 'applicationtimeSheet_add_' + rowId,
                'class': html_class
            });
            if (inDateRange){
                if(!global.liteVersion)
                    td_element.insert( new Element( 'span', {
                        id: 'applicationtimeSheet_addSpan_' + rowId,
                        'title': this.addLabel,
                        'class': 'applicationtimeSheet_element_centeredAddRemove application_main_title3 application_handCursor'
                    }).insert(' + '));
                else
                    td_element.insert( new Element( 'button', {
                        id: 'applicationtimeSheet_addSpan_' + rowId,
                        'title': this.addLabel,
                        'class': 'applicationtimeSheet_element_centeredAddRemove application_main_title3 link'
                    }).insert(' + '));
            }
            $(rowId).insert( td_element);
            
            html_class = 'applicationtimeSheet_element_remove';
            if (!this.showCC)
                html_class += "_noCC";
            td_element = new Element( 'td', {
                id: 'applicationtimeSheet_remove_' + rowId,
                'class': html_class
            });
            if(!global.liteVersion)
                o_element = new Element( 'span', {
                    id: 'applicationtimeSheet_removeSpan_' + rowId,
                    'title': this.removeLabel,
                    'class': 'applicationtimeSheet_element_centeredAddRemove application_main_title3 application_handCursor'
                });
            else
                o_element = new Element( 'button', {
                    id: 'applicationtimeSheet_removeSpan_' + rowId,
                    'title': this.removeLabel,
                    'class': 'applicationtimeSheet_element_centeredAddRemove application_main_title3 link'
                });
            if (editable && inDateRange)
                o_element.insert(" – ");
            $(rowId).insert( td_element.insert(o_element ));
            
            row = newRow;
        }
        // Replacing empty row
        else {
            $('applicationtimeSheet_status_' + rowId).update(statusHtml);
            var timeTypeHtml = (editable && inDateRange) ? new Element('div', { id: 'applicationtimeSheet_timeTypeDiv_' + rowId}) : "";
            $('applicationtimeSheet_timeType_' + rowId).update(timeTypeHtml);
            if (this.showCC) {
                var costCenterHtml = (editable && inDateRange) ? new Element( 'div', { id: 'applicationtimeSheet_costCenterDiv_' + rowId}) : "";
                $('applicationtimeSheet_costCenter_' + rowId).update(costCenterHtml);
            }
            var hoursHtml = (editable && inDateRange) ? new Element( 'input', { id: 'applicationtimeSheet_hoursInput_' + rowId, 'type': 'text', 'class': 'applicationtimeSheet_element_hoursInput fieldDisplayer_input'}) : "";
            $('applicationtimeSheet_hours_' + rowId).update(hoursHtml);
            var commentHtml;
            if (editable && inDateRange) {
                html_class = 'fieldDisplayer_input applicationtimeSheet_element_commentsInput';
                if (!this.showCC)
                    html_class += "_noCC";
                commentHtml = new Element( 'input', {
                    id: 'applicationtimeSheet_commentInput_' + rowId,
                    'type': 'text',
                    'class': html_class
                });
            }
            $('applicationtimeSheet_comment_' + rowId).update(commentHtml);
        }
        if (editable && inDateRange){
            //Setting the observers onChange for the input fields
            $('applicationtimeSheet_hoursInput_' + rowId).observe('change', this._checkElementToPopUp.bind(this));
            $('applicationtimeSheet_commentInput_' + rowId).observe('change', this._checkElementToPopUp.bind(this));
        }
        
        // Filling editable fields...
        if (editable && inDateRange) {
            var timeTypeAutocompleter = new JSONAutocompleter('applicationtimeSheet_timeTypeDiv_' + rowId, {
                showEverythingOnButtonClick: true,
                timeout: 1000,
                templateResult: '#{text}',
                templateOptionsList: '#{text}',
                minChars: 1,
                events: $H({ onResultSelected: 'EWS:autocompleterResultSelected'})
            }, this.timeTypes.get(this.currentUser.id));
            if (this.showCC)
                $('text_area_applicationtimeSheet_timeTypeDiv_' + rowId).addClassName('applicationtimeSheet_autocompleter');
            else
                $('text_area_applicationtimeSheet_timeTypeDiv_' + rowId).addClassName('applicationtimeSheet_autocompleter_noCC');
            this.timeTypeAutocompleters.set(rowId, timeTypeAutocompleter);
            timeTypeAutocompleter.setDefaultValue(event.get('AWART').value, false, false);
            if (this.showCC) {
                var costCenterAutocompleter = new JSONAutocompleter('applicationtimeSheet_costCenterDiv_' + rowId, {
                    showEverythingOnButtonClick: true,
                    timeout: 1000,
                    templateResult: '#{text}',
                    templateOptionsList: '#{text}',
                    minChars: 1,
                    events: $H({ onResultSelected: 'EWS:autocompleterResultSelected'})
                }, this.costCenters);
                $('text_area_applicationtimeSheet_costCenterDiv_' + rowId).addClassName('applicationtimeSheet_autocompleter');
                this.costCenterAutocompleters.set(rowId, costCenterAutocompleter);
                costCenterAutocompleter.setDefaultValue(event.get('KOSTL').value, false, false);
            }
            $('applicationtimeSheet_hoursInput_' + rowId).value = dayHours;
            $('applicationtimeSheet_commentInput_' + rowId).value = comment;
            // Adding a "-" to the previous row it is editable
            if ((add) && ($('applicationtimeSheet_hoursInput_' + oldRowId))) {
                $('applicationtimeSheet_removeSpan_' + oldRowId).update(" - ");
            }
        }
        // ... and not editable ones (or out of retro/future range)
        else {
            this.timeTypeAutocompleters.unset(rowId);
            $('applicationtimeSheet_timeType_' + rowId).update(event.get('AWART').text.truncate(typeAndCostLength));
            $('applicationtimeSheet_timeType_' + rowId).writeAttribute('title', event.get('AWART').text);
            if (this.showCC) {
                if (!Object.isEmpty(event.get('KOSTL')) && !Object.isEmpty(event.get('KOSTL').text)) {
                    $('applicationtimeSheet_costCenter_' + rowId).update(event.get('KOSTL').text.truncate(typeAndCostLength));
                    $('applicationtimeSheet_costCenter_' + rowId).writeAttribute('title', event.get('KOSTL').text);
                }
            }
            $('applicationtimeSheet_hours_' + rowId).update("&nbsp;" + dayHours);
            $('applicationtimeSheet_comment_' + rowId).update(comment.capitalize().truncate(commentLength));
            if (comment.length > commentLength)
                $('applicationtimeSheet_comment_' + rowId).writeAttribute('title', comment);
            if ($('applicationtimeSheet_removeSpan_' + rowId))
                $('applicationtimeSheet_removeSpan_' + rowId).update("");
            $('applicationtimeSheet_paste_' + rowId).update("");
            if ($('applicationtimeSheet_copy_' + rowId).innerHTML == "") {
                var htmlCopy;
                if(!global.liteVersion)
                    htmlCopy =  new Element( 'div', {
                        id: 'applicationtimeSheet_copyDiv_' + rowId,
                        'title': this.copyLabel,
                        'class': 'application_inProgress_training_icon_curr_div applicationtimeSheet_element_centeredCopy'
                    });
                else
                    htmlCopy =  new Element( 'button', {
                        id: 'applicationtimeSheet_copyDiv_' + rowId,
                        'title': this.copyLabel,
                        'class': 'application_inProgress_training_icon_curr_div applicationtimeSheet_element_centeredCopy'
                    }).insert('C');
                $('applicationtimeSheet_copy_' + rowId).update(htmlCopy);
            }
            // Editable but out of retro/future range
            if (editable) {
                $('applicationtimeSheet_timeType_' + rowId).addClassName('application_text_italic');
                $('applicationtimeSheet_hours_' + rowId).addClassName('application_text_italic');
                $('applicationtimeSheet_comment_' + rowId).addClassName('application_text_italic');
            }
        }
        initialDate.addDays(1);
    } while (Date.compare(initialDate, finalDate) < 1);
},
/**
* @description Says to the timesheet it has to be refreshed
*/
_refreshTimesheet: function() {
    this.refresh = true;
},
/**
* @description Saves or submits a timesheet
* @param {Hash} actionInfo Requested action and its information
*/
_timesheetAction: function(actionInfo) {
    this._disableUpperForm();
    this.errorMessageDiv.update("");
    this.errorMessageDiv.hide();
    if (!Object.isEmpty(this.collisionDate)) {
        var collisionDate = this.collisionDate.toString(this.dateFormat);
        var rows = this.dateCounter.get(collisionDate).get('indexes');
        var length = rows.length;
        for (var i = 0; i < length; i++) {
            var rowId = this.currentUser.id + "_" + collisionDate + "_" + rows[i];
            $(rowId).removeClassName('applicationtimeSheet_collision');
        }
        this.collisionDate = null;
    }
    var timesheetEvents = "";
    for( var cont = 0; cont < this.dateCounter.keys().size(); cont++){
        var dateString = this.dateCounter.keys()[cont];
        var rows = this.dateCounter.get(dateString).get('indexes');
        var length = rows.length;
        for (var i = 0; i < length; i++) {
            var rowId = this.currentUser.id + '_' + dateString + '_' + rows[i];
            var timeTypeAutocompleter = this.timeTypeAutocompleters.get(rowId);
            var timeType = null;
            if (!Object.isEmpty(timeTypeAutocompleter)) {
                var timeTypeAutocompleterText = $('text_area_applicationtimeSheet_timeTypeDiv_' + rowId).value;
                if (!Object.isEmpty(timeTypeAutocompleterText))
                    timeType = timeTypeAutocompleter.getValue();
            }
            if (!Object.isEmpty(timeType)) {
                if (this.showCC) {
                    var costCenterAutocompleter = this.costCenterAutocompleters.get(rowId);
                    var costCenter = "";
                    if (!Object.isEmpty(costCenterAutocompleter)) {
                        var costCenterAutocompleterText = $('text_area_applicationtimeSheet_costCenterDiv_' + rowId).value;
                        if (!Object.isEmpty(costCenterAutocompleterText))
                            costCenter = costCenterAutocompleter.getValue().idAdded;
                    }
                }
                var hours = prepareTextToSend( $('applicationtimeSheet_hoursInput_' + rowId).value);
                var comment = prepareTextToSend( $('applicationtimeSheet_commentInput_' + rowId).value);
                timesheetEvents += "<yglui_str_wid_record rec_key='' screen='1'>" +
                                           "<contents>" +
                                               "<yglui_str_wid_content buttons='' key_str='' rec_index='1' selected='X' tcontents=''>" +
                                                   "<fields>" +
                // We suppose 1 day timesheet events
                                                       "<yglui_str_wid_field fieldid='ABWTG' fieldlabel='Days' fieldtechname='ABWTG' fieldtseqnr='000000' value='1.00'></yglui_str_wid_field>" +
                                                       "<yglui_str_wid_field fieldid='APPID' fieldlabel='' fieldtechname='' fieldtseqnr='000000' value=''>TSH_MGMT</yglui_str_wid_field>" +
                                                       "<yglui_str_wid_field fieldid='AWART' fieldlabel='Att./Absence type' fieldtechname='AWART' fieldtseqnr='000000' value='" + timeType.idAdded + "'>" + unescape(timeType.textAdded) + "</yglui_str_wid_field>" +
                                                       "<yglui_str_wid_field fieldid='BEGDA_H' fieldlabel='Start Date' fieldtechname='BEGDA' fieldtseqnr='000000' value='" + dateString + "'></yglui_str_wid_field>" +
                                                       "<yglui_str_wid_field fieldid='COMMENT' fieldlabel='' fieldtechname='COMMENT' fieldtseqnr='000000' value='" + comment + "'></yglui_str_wid_field>" +
                                                       "<yglui_str_wid_field fieldid='EDITABLE' fieldlabel='' fieldtechname='EDITABLE' fieldtseqnr='000000' value=''></yglui_str_wid_field>" +
                                                       "<yglui_str_wid_field fieldid='ENDDA_H' fieldlabel='End Date' fieldtechname='ENDDA' fieldtseqnr='000000' value='" + dateString + "'></yglui_str_wid_field>" +
                                                       "<yglui_str_wid_field fieldid='PERNR' fieldlabel='Personnel Number' fieldtechname='PERNR' fieldtseqnr='000000' value='" + this.currentUser.id + "'>" + this.currentUser.name + "</yglui_str_wid_field>" +
                                                       "<yglui_str_wid_field fieldid='STATUS' fieldlabel='' fieldtechname='STATUS' fieldtseqnr='000000' value=''></yglui_str_wid_field>" +
                                                       "<yglui_str_wid_field fieldid='STDAZ' fieldlabel='Absence hours' fieldtechname='STDAZ' fieldtseqnr='000000' value='" + hours + "'></yglui_str_wid_field>";
                if (this.showCC && !Object.isEmpty(costCenter))
                    timesheetEvents += "<yglui_str_wid_field fieldid='KOSTL' fieldlabel='' fieldtechname='KOSTL' fieldtseqnr='000000' value='" + costCenter + "'></yglui_str_wid_field>";
                timesheetEvents += "</fields></yglui_str_wid_content></contents></yglui_str_wid_record>";
            }
        }
    }
    if (!Object.isEmpty(timesheetEvents) || !Object.isEmpty(this.requestId)) {
        var xml = "<EWS>" +
                          "<SERVICE>" + this.saveTimesheetService + "</SERVICE>" +
                          "<OBJECT TYPE='P'>" + this.currentUser.id + "</OBJECT>" +
                          "<PARAM>" +
                              "<o_begda_i>" + this.currentDate.toString(this.dateFormat) + "</o_begda_i>" +
                              "<o_endda_i>" + this.currentEndDate.toString(this.dateFormat) + "</o_endda_i>" +
                              "<o_event_list>" + timesheetEvents + "</o_event_list>" +
                              "<o_request_id>";
        if (!Object.isEmpty(this.requestId))
            xml += this.requestId;
        xml += "</o_request_id>" +
                   "<BUTTON ACTION='" + actionInfo['@action'] + "' DISMA='' LABEL_TAG='" + actionInfo['@label_tag'] + "' OKCODE='" + actionInfo['@okcode'] + "' SCREEN='' TARAP='' TARTY='' TYPE='" + actionInfo['@type'];
        if (actionInfo['@action'].toLowerCase().include('save'))
            xml += "' STATUS='10";
        xml += "'></BUTTON></PARAM></EWS>";
        this.makeAJAXrequest($H({ xml: xml, successMethod: '_actionResult', failureMethod: '_actionError', errorMethod: '_actionError' }));
    }
    else {
        this.table.update('');
        this._buildInitialTimesheet();
        this._fillEvents();
        this._enableUpperForm();
    }
},
/*********************************************************************/
/**
* @description Submits a timesheet. From task detail
* @param {Hash} actionInfo Requested action and its information
*/
_timesheetAction_read: function(actionInfo) {
    this._disableUpperForm_read();
    this.errorMessageDiv.update("");
    this.errorMessageDiv.hide();
    if (!Object.isEmpty(this.collisionDate)) {
        var collisionDate = this.collisionDate.toString(this.dateFormat);
        var rows = this.dateCounter.get(collisionDate).get('indexes');
        var length = rows.length;
        for (var i = 0; i < length; i++) {
            var rowId = this.requesterId + "_" + collisionDate + "_" + rows[i];
            $(rowId).removeClassName('applicationtimeSheet_collision');
        }
        this.collisionDate = null;
    }
    var timesheetEvents = "";
    for( var cont = 0; cont < this.dateCounter.keys().size(); cont++){
        var dateString = this.dateCounter.keys()[cont];
        var rows = this.dateCounter.get(dateString).get('indexes');
        var length = rows.length;
        for (var i = 0; i < length; i++) {
            var rowId = this.requesterId + '_' + dateString + '_' + rows[i];
            var timeTypeAutocompleter = this.timeTypeAutocompleters.get(rowId);
            var timeType = null;
            if (!Object.isEmpty(timeTypeAutocompleter)) {
                var timeTypeAutocompleterText = $('text_area_applicationtimeSheet_read_timeTypeDiv_' + rowId).value;
                if (!Object.isEmpty(timeTypeAutocompleterText))
                    timeType = timeTypeAutocompleter.getValue();
            }
            if (!Object.isEmpty(timeType)) {
                if (this.showCC) {
                    var costCenterAutocompleter = this.costCenterAutocompleters.get(rowId);
                    var costCenter = "";
                    if (!Object.isEmpty(costCenterAutocompleter)) {
                        var costCenterAutocompleterText = $('text_area_applicationtimeSheet_read_costCenterDiv_' + rowId).value;
                        if (!Object.isEmpty(costCenterAutocompleterText))
                            costCenter = costCenterAutocompleter.getValue().idAdded;
                    }
                }
                var hours = prepareTextToSend( $('applicationtimeSheet_read_hoursInput_' + rowId).value);
                var comment = prepareTextToSend( $('applicationtimeSheet_read_commentInput_' + rowId).value);
                timesheetEvents += "<yglui_str_wid_record rec_key='' screen='1'>" +
                                           "<contents>" +
                                               "<yglui_str_wid_content buttons='' key_str='' rec_index='1' selected='X' tcontents=''>" +
                                                   "<fields>" +
                // We suppose 1 day timesheet events
                                                       "<yglui_str_wid_field fieldid='ABWTG' fieldlabel='Days' fieldtechname='ABWTG' fieldtseqnr='000000' value='1.00'></yglui_str_wid_field>" +
                                                       "<yglui_str_wid_field fieldid='APPID' fieldlabel='' fieldtechname='' fieldtseqnr='000000' value=''>TSH_MGMT</yglui_str_wid_field>" +
                                                       "<yglui_str_wid_field fieldid='AWART' fieldlabel='Att./Absence type' fieldtechname='AWART' fieldtseqnr='000000' value='" + timeType.idAdded + "'>" + unescape(timeType.textAdded) + "</yglui_str_wid_field>" +
                                                       "<yglui_str_wid_field fieldid='BEGDA_H' fieldlabel='Start Date' fieldtechname='BEGDA' fieldtseqnr='000000' value='" + dateString + "'></yglui_str_wid_field>" +
                                                       "<yglui_str_wid_field fieldid='COMMENT' fieldlabel='' fieldtechname='COMMENT' fieldtseqnr='000000' value='" + comment + "'></yglui_str_wid_field>" +
                                                       "<yglui_str_wid_field fieldid='EDITABLE' fieldlabel='' fieldtechname='EDITABLE' fieldtseqnr='000000' value=''></yglui_str_wid_field>" +
                                                       "<yglui_str_wid_field fieldid='ENDDA_H' fieldlabel='End Date' fieldtechname='ENDDA' fieldtseqnr='000000' value='" + dateString + "'></yglui_str_wid_field>" +
                                                       "<yglui_str_wid_field fieldid='PERNR' fieldlabel='Personnel Number' fieldtechname='PERNR' fieldtseqnr='000000' value='" + this.requesterId + "'>" + "this.currentUser.name" + "</yglui_str_wid_field>" +
                                                       "<yglui_str_wid_field fieldid='STATUS' fieldlabel='' fieldtechname='STATUS' fieldtseqnr='000000' value=''></yglui_str_wid_field>" +
                                                       "<yglui_str_wid_field fieldid='STDAZ' fieldlabel='Absence hours' fieldtechname='STDAZ' fieldtseqnr='000000' value='" + hours + "'></yglui_str_wid_field>";
                if (this.showCC && !Object.isEmpty(costCenter))
                    timesheetEvents += "<yglui_str_wid_field fieldid='KOSTL' fieldlabel='' fieldtechname='KOSTL' fieldtseqnr='000000' value='" + costCenter + "'></yglui_str_wid_field>";
                timesheetEvents += "</fields></yglui_str_wid_content></contents></yglui_str_wid_record>";
            }
        }
    }
    if (!Object.isEmpty(timesheetEvents) || !Object.isEmpty(this.requestId)) {
        var xml = "<EWS>" +
                          "<SERVICE>" + this.saveTimesheetService + "</SERVICE>" +
                          "<OBJECT TYPE='P'>" + this.requesterId + "</OBJECT>" +
                          "<PARAM>" +
                              "<o_begda_i>" + this.currentDate.toString(this.dateFormat) + "</o_begda_i>" +
                              "<o_endda_i>" + this.currentEndDate.toString(this.dateFormat) + "</o_endda_i>" +
                              "<o_event_list>" + timesheetEvents + "</o_event_list>" +
                              "<o_request_id>";
        if (!Object.isEmpty(this.requestId))
            xml += this.requestId;
        xml += "</o_request_id>" +
                   "<BUTTON ACTION='" + actionInfo['@action'] + "' DISMA='' LABEL_TAG='" + actionInfo['@label_tag'] + "' OKCODE='" + actionInfo['@okcode'] + "' SCREEN='' TARAP='' TARTY='' TYPE='" + actionInfo['@type'];
        if (actionInfo['@action'].toLowerCase().include('save'))
            xml += "' STATUS='10";
        xml += "'></BUTTON></PARAM></EWS>";
        this.makeAJAXrequest($H({ xml: xml, successMethod: '_actionResult_read', failureMethod: '_actionError_read', errorMethod: '_actionError_read' }));
    }
    else {
        this.table_read.update('');
        this._buildInitialTimesheet_read();
        this._fillEvents();
        this._enableUpperForm_read();
    }
},
/**
* @description Manages last saved/submited timesheet. TimeSheet on task detail
* @param {JSON} json Information from SAVE_TIMESHEET service
*/
_actionResult_read: function(json) {
    //Disabling the changes
    this.changesToSave = false;
    //Disabling the popUp
    this._disableExitPopUp();
    
    this._enableUpperForm_read();
    // Refreshing timesheet (new event statuses)
    this._getTimesheet(this.requesterId, this.currentDate);
    // Refreshing calendars
    document.fire('EWS:refreshCalendars'); 
},
/**
* @description Manages last timesheet error. . TimeSheet on task detail
* @param {JSON} json Information from SAVE_TIMESHEET service
*/
_actionError_read: function(json) {
    var message = json.EWS.webmessage_text;
    if (message.include('((D))')) {
        var collisionDate = message.split('((D))')[1];
        this.collisionDate = Date.parseExact(collisionDate.substring(collisionDate.indexOf('(') + 1, collisionDate.indexOf(')')), 'yyyyMMdd');
        json.EWS.webmessage_text = message.split('((D))')[2].sub(collisionDate, this.collisionDate.toString(global.dateFormat));
        collisionDate = this.collisionDate.toString(this.dateFormat);
        var rows = this.dateCounter.get(collisionDate).get('indexes');
        var length = rows.length;
        for (var i = 0; i < length; i++) {
            var rowId = this.requesterId + "_" + collisionDate + "_" + rows[i];
            $(rowId).addClassName('applicationtimeSheet_collision');
        }
    }
    this._failureMethod(json);
    this.errorMessageDiv.insert(json.EWS.webmessage_text);
    this.errorMessageDiv.show();
    this._enableUpperForm_read();
},
/***************************************************************/
/**
* @description Manages last saved/submited timesheet
* @param {JSON} json Information from SAVE_TIMESHEET service
*/
_actionResult: function(json) {
    //Disabling the changes
    this.changesToSave = false;
    //Disabling the popUp
    this._disableExitPopUp();
    
    this._enableUpperForm();
    // Refreshing timesheet (new event statuses)
    this._getTimesheet(this.currentUser.id, this.currentDate);
    // Refreshing calendars
    document.fire('EWS:refreshCalendars');
},
/**
* @description Manages last timesheet error
* @param {JSON} json Information from SAVE_TIMESHEET service
*/
_actionError: function(json) {
    var message = json.EWS.webmessage_text;
    if (message.include('((D))')) {
        var collisionDate = message.split('((D))')[1];
        this.collisionDate = Date.parseExact(collisionDate.substring(collisionDate.indexOf('(') + 1, collisionDate.indexOf(')')), 'yyyyMMdd');
        json.EWS.webmessage_text = message.split('((D))')[2].sub(collisionDate, this.collisionDate.toString(global.dateFormat));
        collisionDate = this.collisionDate.toString(this.dateFormat);
        var rows = this.dateCounter.get(collisionDate).get('indexes');
        var length = rows.length;
        for (var i = 0; i < length; i++) {
            var rowId = this.currentUser.id + "_" + collisionDate + "_" + rows[i];
            $(rowId).addClassName('applicationtimeSheet_collision');
        }
    }
    this._failureMethod(json);
    this.errorMessageDiv.insert(json.EWS.webmessage_text);
    this.errorMessageDiv.show();
    this._enableUpperForm();
},
/**
* @description Asks the backend for the cost centers list
*/
_getCostCenters: function() {
    var xml = "<EWS><SERVICE>" + this.getCostCentersService + "</SERVICE></EWS>";
    this.makeAJAXrequest($H({ xml: xml, successMethod: '_saveCostCenters' }));
},
/**
* @description Obtains the cost centers list and stores it
* @param {JSON} json Information from GET_CC service
*/
_saveCostCenters: function(json) {
    if (!Object.isEmpty(json)) {
        if (!Object.isEmpty(json.EWS.o_values)) {
            var costCenters = json.EWS.o_values.item;
            var length = costCenters.length;
            // Initial autocompleter structure
            var jsonAutocompleter = { autocompleter: {
                object: [],
                multilanguage: {
                    no_results: global.getLabel('noresults'),
                    search: global.getLabel('search')
                }
            }
            };
            for (var i = 0; i < length; i++) {
                jsonAutocompleter.autocompleter.object.push({
                    data: costCenters[i]['@id'],
                    text: costCenters[i]['@value']
                });
            }
            this.costCenters = jsonAutocompleter;
            if (this.comeFrom == "inbox")
                this._buildTimesheet_read();
            else
                this._buildTimesheet();
        }
    }
    },
/**
* @description Says if we have to show cost centers and shows a timesheet after an error
* @param {JSON} json Information from GET_TIMESHEET service
*/
_showTimesheetError: function(json) {
    this._errorMethod(json);
    this._showTimesheet(json);
},

/**
* @description: it sets an element in the header with the name plus the personal number of the selected employee
*/
_setEmployeeMessage: function(){
    var employeeID = global.getSelectedEmployees()[0];
    var employeeDetails = global.getEmployee(employeeID);
    var employeeName = employeeDetails.name;
    if(Object.isEmpty(this.employeeMessage)){
        this.employeeMessage = new Element('div', {
            'id': 'timeSheet_employee_message',
            'class' : 'inlineContainer'        
        });
        this.employeeMessageName = new Element ('div',{
            'id': 'timeSheet_employee_message_name',
            'class' : 'application_text_bolder application_main_soft_text inlineElement '
        });
        this.employeeMessageSpace = new Element ('div',{
            'id': 'timeSheet_employee_message_space',
            'class' : 'inlineElement'
        });
        this.employeeMessageId = new Element ('div',{
            'id': 'timeSheet_employee_message_Id',
            'class' : 'application_main_soft_text inlineElement'
        });
        this.employeeMessage.insert(this.employeeMessageName);  
        this.employeeMessage.insert(this.employeeMessageSpace);  
        this.employeeMessage.insert(this.employeeMessageId);
        this.header.insert({"top" : this.employeeMessage});
    }
    if(!Object.isEmpty(employeeName)){
        this.employeeMessageName.update(employeeName);
    }else{
        this.employeeMessageName.update(global.getLabel("noUserNameFound"));
    }
    this.employeeMessageSpace.update("&nbsp;");
    if(!Object.isEmpty(employeeID)){
        this.employeeMessageId.update(global.idSeparatorLeft + employeeID + global.idSeparatorRight);       
    }else{
        this.employeeMessageId.update();
    }    
},

/**
* @description: it prompts a confirmation popup to change to another period or stay in the current one
* @param coming: it would be "today" if we have clicked on "today" button or "changePeriod" if we have 
  change the month via the navigation arrows or the month list
* @param next: optional to indicate the next period
*/
_showChangePeriodPopUp: function(coming, next){
    var contentHTML = new Element ('div');
    var warningMessage = new Element ('div',{
        'class': 'moduleInfoPopUp_std_leftMargin test_text'
        }
    );
    warningMessage.update(global.getLabel('AreYouSurePeriod'));
    contentHTML.insert(warningMessage);
    //buttons
    var buttonsJson = {
        elements: [],
        mainClass: 'moduleInfoPopUp_stdButton_div_left'
    };
    var callBack = function() {
        changePeriodPopUp.close();
        delete changePeriodPopUp;
    };
    var callBack2 = function(){
        switch(coming){
            case "today":
                this.changesToSave = false;               
                this._clickOnToday();
                break;
            case "changePeriod":
                this.changesToSave = false;               
                this._changeTimesheet(next);
                break;
            default:
                break;
        }
        changePeriodPopUp.close();
        delete changePeriodPopUp;
    }.bind(this);
    
    var aux2 = {
        idButton: 'Yes',
        label: global.getLabel('yes'),
        handlerContext: null,
        className: 'moduleInfoPopUp_stdButton',
        handler: callBack2,
        type: 'button',
        standardButton: true
    };
    
    var aux3 = {
        idButton: 'No',
        label: global.getLabel('no'),
        handlerContext: null,
        className: 'moduleInfoPopUp_stdButton',
        handler: callBack,
        type: 'button',
        standardButton: true
    };
    
    buttonsJson.elements.push(aux2);
    buttonsJson.elements.push(aux3);
    var ButtonObj = new megaButtonDisplayer(buttonsJson);
    var buttons = ButtonObj.getButtons();
    //insert buttons in div
    contentHTML.insert(buttons);
    
    var changePeriodPopUp = new infoPopUp({
        closeButton: $H({
            'textContent': 'Close',
            'callBack': function() {
                changePeriodPopUp.close();
                delete changePeriodPopUp;
            }
        }),
        htmlContent: contentHTML,
        indicatorIcon: 'information',
        width: 350
    });
    changePeriodPopUp.create();  
}

});
