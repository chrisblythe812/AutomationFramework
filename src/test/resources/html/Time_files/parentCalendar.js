/** 
 * @fileOverview parentCalendar.js 
 * @description File containing a parent class for all calendars
*/
var parentCalendar = Class.create(Application,
/** 
*@lends parentCalendar
*/
{
    parentFilter : "",
    filterJson : null,
/*** METHODS ***/
/**
* @description Constructor
* @param $super Superclass 
* @param {String} appName Name of the applicacion
*/
initialize: function($super, options) {
    $super(options);
    this._appName = this.appName;
    this._filterPanelCheckBoxes = $A();
    this.filterElement = new Element('div');
    this.filterCreated = false;
    this.refresh = false;
    this.refreshCalendarsBinding = this._refreshCalendars.bindAsEventListener(this);
},
/**
* @description Starts parentCalendar
* @param $super Superclass
*/
run: function($super) {
    $super();
    if (this.firstRun)
        document.observe('EWS:refreshCalendars', this.refreshCalendarsBinding);
},
/**
* @description Stops parentCalendar
* @param $super Superclass 
*/
close: function($super) {
    $super();
},
/**
* @description Returns all events' working hash
* @returns {Hash} Event hash
*/
_getEventHash: function(getEventsJson) {
        this.timeErrorMessages = new Hash ();   // A hash used to store the messages for every time error event existing on the same day
        //var filter = getEventsJson.EWS.o_li_incapp.yglui_str_incap2;
        this._updateFilterPanel(parentCalendar.prototype.filterJson);
    var eventHash = new Hash();
    if (!Object.isEmpty(getEventsJson)) {
        if (!Object.isEmpty(getEventsJson.EWS.o_field_values)) {
            var events = objectToArray(getEventsJson.EWS.o_field_values.yglui_str_wid_record);
            for (var i = 0; i < events.length; i++) {
                var eventId = events[i].contents.yglui_str_wid_content['@key_str'];
                if (!Object.isEmpty(eventId)) {
                    var properties = objectToArray(events[i].contents.yglui_str_wid_content.fields.yglui_str_wid_field);
                    var eventProperties = new Hash();
                    for (var j = 0; j < properties.length; j++) {
                        this._fieldsFilter(properties, j);
                        var index = Object.isEmpty(properties[j]['@fieldtechname']) ? properties[j]['@fieldid'] : properties[j]['@fieldtechname'];
                        eventProperties.set(index, {
                            'text': properties[j]['#text'],
                            'label': properties[j]['@fieldlabel'],
                            'techname': properties[j]['@fieldtechname'],
                            'seqnr': properties[j]['@fieldseqnr'],
                            'value': properties[j]['@value']
                        });
                        // Timesheet events -> they have the same id, so we add to their id a counter
                        if ((index == 'APPID') && (properties[j]['@value'] == 'TSH_MGMT'))
                            eventId += "_" + i;
                        }
                        eventDate = eventProperties.get('BEGDA').value;
                        if (eventProperties.get('APPID').value == 'TIM_ERR'){
                            this._addTextToEvent(eventDate,eventProperties);
                    }
                    // For calendars, we will use statuses from o_events_status
                    if (!Object.isEmpty(eventProperties.get('STATUS')))
                        eventProperties.unset('STATUS');
                    // CALENDAR EVENTS
                    // Sent for approval (20, 30) status -> 1,
                    // Sent for deletion (21, 31) status -> 2,
                    // Approved (90) -default- status -> 3
                    // TIMESHEET EVENTS
                    // Saved (10) status -> 4
                    // Submitted -like sent for approval- (20) status -> 5
                    // Approved (90) -default- status -> 6
                    // GENERAL EVENTS
                    // Payroll running -> 7

                    //Status = 0 -> These app will always have the same status TIM_ERR->Error and HRS_RLZ->Evaluated 
                    if (eventProperties.get('APPID').value == 'TIM_ERR' || eventProperties.get('APPID').value == 'HRS_RLZ')
                        eventProperties.set('STATUS', 0);
                    else if (eventProperties.get('APPID').value != 'TSH_MGMT')
                        eventProperties.set('STATUS', 3);
                    else
                        eventProperties.set('STATUS', 6);
                    eventHash.set(eventId, eventProperties);
                }
            }
            var statuses;
            if (getEventsJson.EWS.o_events_status)
                statuses = objectToArray(getEventsJson.EWS.o_events_status.yglui_str_event_status);
            if (statuses)
                for (var i = 0; i < statuses.length; i++) {
                var eventId = statuses[i]['@key_str'];
                if (!Object.isEmpty(eventId)) {
                    var sap_status = statuses[i]['@status'];
                    // CALENDAR EVENTS
                    // Sent for approval (20, 30) status -> 1,
                    // Sent for deletion (21, 31) status -> 2,
                    // Approved (90) -default- status -> 3
                    // TIMESHEET EVENTS
                    // Saved (10) status -> 4
                    // Submitted -like sent for approval- (20) status -> 5
                    // Approved (90) -default- status -> 6
                    // GENERAL EVENTS
                    // Payroll running -> 7
                    var status_code;
                    if ((sap_status == "20") || (sap_status == "30"))
                        status_code = 1;
                    if ((sap_status == "21") || (sap_status == "31"))
                        status_code = 2;
                    if (sap_status == "10")
                        status_code = 4;
                    if (sap_status == "50")
                        status_code = 7;
                    var event = eventHash.get(eventId);
                    // Calendar event
                    if (!Object.isEmpty(event))
                        event.set('STATUS', status_code);
                    // Timesheet events
                    else {
                        // Status 20 for timesheet events
                        if (status_code == 1)
                            status_code = 5;
                        for (var j = 0; j < events.length; j++) {
                            var tshEventId = eventId + "_" + j;
                            event = eventHash.get(tshEventId);
                            if (!Object.isEmpty(event))
                                event.set('STATUS', status_code);
                        }
                    }
                }
            }
        }
    }
    return eventHash;
},
    
    /**
    * @description: it adds the fields "ETEXT" and "UTEXT" for every time error event existing on the same date
    * @param eventId: the id of the d
    */
    _addTextToEvent: function(eventDate,eventProperties){
        var eText = eventProperties.get("ETEXT").value;
        var uText = eventProperties.get("UTEXT").value;
        var previousText = this.timeErrorMessages.get(eventDate);
        var aux = "";
        if(!Object.isEmpty(previousText)){
            aux = previousText;
            aux += ",";
        }
        aux += eText;
        if(!Object.isEmpty(uText)){
            aux += ":" + uText;
        }    
        this.timeErrorMessages.set(eventDate,aux);
    },
    
_fieldsFilter: function(properties, j) {
    switch (properties[j]["@fieldtechname"]) {
        case "BEGUZ":
        case "ENDUZ":
            if (properties[j]["@value"] && properties[j]["@value"].strip().startsWith(":"))
                properties[j]["@value"] = null;
            break;
    }
},
/**
*@param {Hash} event An event Object from _getEventHash results
*@description Returns an event's status
*@returns {String} Status string
*/
_getStatusOfEvent: function(event) {
    //Whether the event is sent for approval (1), sent for deletion (2) or approved (3)
    //And for timesheet events: saved (4), submitted -sent for approval- (5) or approved (6)
    //Status = 0 -> These app will always have the same status TIM_ERR->Error and HRS_RLZ->Evaluated 
    if (event.value.get('STATUS') == 0)
        switch (event.value.get('APPID').value) {
        case 'TIM_ERR':
            return global.getLabel('error');
            break;
        case 'HRS_RLZ':
            return global.getLabel('evaluated');
            break;
    }
    if ((event.value.get('STATUS') == 1) || (event.value.get('STATUS') == 5))
        return global.getLabel('status_P');
    if (event.value.get('STATUS') == 2)
        return global.getLabel('status_D');
    if ((event.value.get('STATUS') == 3) || (event.value.get('STATUS') == 6))
        return global.getLabel('status_A');
    if (event.value.get('STATUS') == 4)
        return global.getLabel('status_S');
    if (event.value.get('STATUS') == 7)
        return global.getLabel('status_TBP');
    return "-";
},
/**
* @description Returns an event json with essential information
* @param {String} empId Employee's id
* @param {String} empName Employee's name
* @param {String} appId Event's type
* @param {String} begda Begin date
* @param {String} endda End date
* @returns {Hash} Event hash
*/
_getEmptyEvent: function(empId, empName, appId, begda, endda) {
    var eventProperties = new Hash();
    eventProperties.set('PERNR', {
        'text': empName,
        'value': empId
    });
    eventProperties.set('APPID', {
        'text': appId
    });
    eventProperties.set('BEGDA', {
        'value': begda
    });
    if (Object.isEmpty(endda))
        endda = begda;
    eventProperties.set('ENDDA', {
        'value': endda
    });
    return eventProperties;
},
/**
* @description Returns an existing event json (used by timeEntryScreen app)
* @param {JSON} json Event list
* @param {String} id Event's id
* @returns {Hash} Event hash
*/
_getEvent: function(json, id) {
    // Searching event index
    var events = objectToArray(json.EWS.o_field_values.yglui_str_wid_record);
    var eventFound = -1;
    for (var i = 0; (i < events.length) && (eventFound < 0); i++) {
        if (events[i].contents.yglui_str_wid_content['@key_str'] == id)
            eventFound = i;
    }
    // Timesheet event
    var timesheetEvent = false;
    if (eventFound == -1) {
        eventFound = parseInt(id.substring(id.lastIndexOf("_") + 1));
        timesheetEvent = true;
    }
    // Getting event key
    this.eventKey = events[eventFound]['@rec_key'];
    // Saving event into a hash
    var event = events[eventFound].contents.yglui_str_wid_content.fields.yglui_str_wid_field;
    var eventHash = new Hash();
    for (var i = 0; i < event.length; i++) {
        var index = Object.isEmpty(event[i]['@fieldtechname']) ? event[i]['@fieldid'] : event[i]['@fieldtechname'];
        eventHash.set(index, event[i]);
    }
    // Getting event type
    appId = eventHash.get('APPID')['@value'];
    // ... and its structure
    var appids = objectToArray(json.EWS.o_field_settings.yglui_str_wid_fs_record);
    var appidFound = -1;
    for (var i = 0; (i < appids.length) && (appidFound < 0); i++) {
        var atribs = objectToArray(appids[i].fs_fields.yglui_str_wid_fs_field);
        for (var j = 0; (j < atribs.length) && (appidFound < 0); j++) {
            if (atribs[j]['@fieldid'] == 'APPID') {
                if (atribs[j]['@default_value'] == appId)
                    appidFound = i;
                j = atribs.length;
            }
        }
    }
    // Changing hour format/value (if needed)
    if (eventHash.get('BEGUZ')) {
        if (Object.isEmpty(eventHash.get('BEGUZ')['@value']))
            eventHash.get('BEGUZ')['@value'] = '00:00:00';
    }
    if (eventHash.get('ENDUZ')) {
        if (Object.isEmpty(eventHash.get('ENDUZ')['@value']))
            eventHash.get('ENDUZ')['@value'] = '00:00:00';
    }
    // Writing event's status (if status appears in event structure)
    if (!Object.isEmpty(eventHash.get('STATUS'))) {
        var statuses = this._getStatuses(json);
        if (timesheetEvent)
            id = id.substring(0, id.lastIndexOf("_"));
        var eventStatus = statuses.get(id);
        // If the status is not defined, it is approved (also for timesheet events)
        if (Object.isEmpty(eventStatus))
            eventHash.get('STATUS')['#text'] = global.getLabel('status_A');
        // If not, we have to check its code
        else {
            if ((eventStatus == "20") || (eventStatus == "30"))
                eventHash.get('STATUS')['#text'] = global.getLabel('status_P');
            if ((eventStatus == "21") || (eventStatus == "31"))
                eventHash.get('STATUS')['#text'] = global.getLabel('status_D');
            if (eventStatus == "10")
                eventHash.get('STATUS')['#text'] = global.getLabel('status_S');
        }
    }
    // Building screen
    var titleObject = new Object();
    titleObject['#text'] = "";
    titleObject['@all_modifiable'] = "";
    titleObject['@appid'] = appId;
    titleObject['@list_mode'] = "";
    titleObject['@screen'] = 1;
    titleObject['@selected'] = "X";
    titleObject['@label_tag'] = appId + 'Title';
    // Adding buttons
    var recButtonsObject = !Object.isEmpty(events[eventFound].contents.yglui_str_wid_content.buttons) ? events[eventFound].contents.yglui_str_wid_content.buttons.yglui_str_wid_button : new Array();
    for (var i = 0; i < recButtonsObject.length; i++) {
        if (Object.isEmpty(recButtonsObject[i]['@screen']))
            recButtonsObject[i]['@screen'] = '*';
    }
    var appButtonsObject = new Array();
    if (json.EWS.o_scrn_buttons) {
        var appButtons = objectToArray(json.EWS.o_scrn_buttons.yglui_str_scn_button);
        for (var i = 0; i < appButtons.length; i++) {
            if (appButtons[i]['@appid'] == appId)
                appButtonsObject.push(appButtons[i]);
        }
    }
    var buttonsObject = [recButtonsObject, appButtonsObject].flatten();
    // Adding labels
    var labelsObject = json.EWS.labels;
    // Creating "GET_CONTENT" event
    var contentEvent = { o_field_settings: { yglui_str_wid_fs_record: appids[appidFound] },
        o_field_values: { yglui_str_wid_record: deepCopy(events[eventFound]) }, // We use a copy because we delete buttons later
        o_widget_screens: { yglui_str_wid_screen: { yglui_str_wid_screen: titleObject} },
        o_screen_buttons: { yglui_str_wid_button: buttonsObject },
        labels: labelsObject
    };
    contentEvent.o_field_settings.yglui_str_wid_fs_record['@screen'] = 1;
    contentEvent.o_field_values.yglui_str_wid_record['@screen'] = 1;
    contentEvent.o_field_values.yglui_str_wid_record.contents.yglui_str_wid_content['@rec_index'] = 0;
    var result = { EWS: contentEvent };
    delete result.EWS.o_field_values.yglui_str_wid_record.contents.yglui_str_wid_content.buttons; // Deleting useless buttons
    return result;
},
/**
* @description Says all events' statuses for one event list
* @param {JSON} json Event list
* @returns {Hash} Event status hash
*/
_getStatuses: function(json) {
    var statusHash = new Hash();
    if ((!Object.isEmpty(json.EWS.o_events_status)) && (!Object.isEmpty(json.EWS.o_events_status.yglui_str_event_status))) {
        var statuses = objectToArray(json.EWS.o_events_status.yglui_str_event_status);
        for (var i = 0; i < statuses.length; i++)
            statusHash.set(statuses[i]['@key_str'], statuses[i]['@status']);
    }
    return statusHash;
},
/**
* @description Creates a new filter panel and inserts it on the element indicated by the user
* @param element, The element to make the insertion
* @param appName, Application which contains the filter
* @param incapp, Filter options from get_events
*/
createFilterPanel: function(element, appName, incapp) {
    if ((Object.isEmpty(this.mandt)) && (incapp.length > 0)) {
        this.mandt = Object.isEmpty(incapp[0]['@mandt']) ? "" : incapp[0]['@mandt'];
        this.molga = Object.isEmpty(incapp[0]['@molga']) ? "" : incapp[0]['@molga'];
        this.yygcc = Object.isEmpty(incapp[0]['@yygcc']) ? "" : incapp[0]['@yygcc'];
        this.yylcc = Object.isEmpty(incapp[0]['@yylcc']) ? "" : incapp[0]['@yylcc'];
        this.yymod = Object.isEmpty(incapp[0]['@yymod']) ? "" : incapp[0]['@yymod'];
    }
    var appids = new Array();
    var statuses = new Array();
    var length = incapp.length;
    for (var i = 0; i < length; i++) {
        if (!Object.isEmpty(incapp[i]['@appid']))
            appids.push(incapp[i]['@event']);
        else
            statuses.push(incapp[i]['@event']);
    }
    var _panelStructure = [{
        eventTypes: {
            groupTitle: global.getLabel('eventType'),
            filterOptions: appids
        }
    },
        {
            eventTypes: {
                groupTitle: global.getLabel('eventStatus'),
                filterOptions: statuses
            }
}];
    var tableHeader = new Element('thead').insert('<tr></tr>');
    var tableBody = new Element('tbody').insert('<tr></tr>');
    var panelStructureCounter = 0;
    _panelStructure.each(function(itemParent) {
	var title = itemParent.eventTypes.groupTitle;
	var filterOptions = itemParent.eventTypes.filterOptions;
        var optionsRow = new Element('td');
        tableHeader.down().insert('<th>' + title + '</th>');
		
		var currentColumn = itemParent.eventTypes.groupTitle;
		var maxOption = filterOptions.size();
		var currentIteration = 0;
        filterOptions.each(function(item) {
			currentIteration++;
            var element = new Element('input', {
                type: "checkbox",
                value: item
            });
	    if(global.liteVersion){
		element.writeAttribute("title",_panelStructure[panelStructureCounter].eventTypes.groupTitle + "/" + global.getLabel(item));
	    }
            element.observe('click', this._filterElementClicked.bind(this));
            this._filterPanelCheckBoxes.push({
                id: item,
                element: element
            });
            var checkbox = new Element('div').insert(element);
            checkbox.insert(global.getLabel(item));
            optionsRow.insert(checkbox);
			
			if(currentIteration == maxOption && currentColumn==global.getLabel('eventStatus')){
				var jsonButton = {
                    elements:[],
                    mainClass: 'timeFilter_buttonDiv2'
                };
		        var aux = {
		                idButton: 'timeFilter_button_' + appName,
		                label: global.getLabel('refresh'),
		                handlerContext: null,
		                handler: this._refreshButtonClicked.bind(this, ''),
		                type: 'button',
		                standardButton: true
		        };                 
		        jsonButton.elements.push(aux);
		        var filterButton = new megaButtonDisplayer(jsonButton); 
				optionsRow.insert(filterButton.getButtons());
			}
			    		   
        } .bind(this));
        tableBody.down().insert(optionsRow);
	panelStructureCounter++;
        }.bind(this));
        $(element).insert(new Element('table', { 
            'class': 'timeFilter_table'
        }).insert(tableHeader).insert(tableBody)).hide();

    $(element).addClassName('timeFilter_div');
},
_filterElementClicked: function() {
    document.fire('EWS:calendar_filterChanged_' + this._appName);
},
_refreshButtonClicked: function() {
    document.fire('EWS:calendar_refreshButtonClicked_' + appName);
},
/**
* @description Sets the filter
* @param {JSON} filter New filter
*/
_updateFilterPanel: function(filter) {
    this.eventCodes = new Hash();
    var length = filter.length;
    for (var i = 0; i < length; i++) {
        var event = filter[i]['@event'];
        if (Object.isEmpty(this.eventCodes.get(event))) {
            var properties = new Hash();
            var appids = new Array();
            properties.set('appids', appids);
            // We assume all appids from an event will have the same filter
            var filterFlag = filter[i]['@include_app'];
            properties.set('filter', filterFlag);
            this.eventCodes.set(event, properties);
        }
        var appid = filter[i]['@appid'];
        if (!Object.isEmpty(appid))
            this.eventCodes.get(event).get('appids').push(appid);
    }
    this._filterPanelCheckBoxes.each(function(item) {
        var filterFlag = this.eventCodes.get(item.id).get('filter');
        if (!Object.isEmpty(filterFlag) && filterFlag == 'X') {
            item.element.up().show();
            item.element.checked = true;
            item.element.defaultChecked = true;
        }
        else {
            item.element.checked = false;
            item.element.defaultChecked = false;
        }
        if (event == 'N')
            item.element.up().hide();
    } .bind(this));
},
/**
* @description Returns current filter as a string and as a json object
* @returns {Hash} Current filter
*/
getFilterSelectedOptions: function() {
    var returnSelected = "";
    this._filterPanelCheckBoxes.each(function(item) {
        if (!Object.isEmpty(this.eventCodes)) {
            var appids = this.eventCodes.get(item.id).get('appids');
            var length = appids.length;
            // Event types
            if (Object.isEmpty(item.id))
                var id = "";
            else
                var id = item.id;

            if (length > 0) {
                for (var i = 0; i < length; i++) {
                    returnSelected += "<yglui_str_incap2 appid=\"" + appids[i] + "\" event=\"" + id + "\" include_app=\"";
                    if (item.element.checked == true)
                        returnSelected += "X";
                    returnSelected += "\" mandt=\"" + this.mandt + "\" molga=\"" + this.molga + "\" yygcc=\"" + this.yygcc + "\" yylcc=\"" + this.yylcc + "\" yymod=\"" + this.yymod + "\"></yglui_str_incap2>";
                }
            }
            // Event statuses
            else {
                returnSelected += "<yglui_str_incap2 appid=\"\" event=\"" + id + "\" include_app=\"";
                if (item.element.checked == true)
                    returnSelected += "X";
                returnSelected += "\" mandt=\"" + this.mandt + "\" molga=\"" + this.molga + "\" yygcc=\"" + this.yygcc + "\" yylcc=\"" + this.yylcc + "\" yymod=\"" + this.yymod + "\"></yglui_str_incap2>";
            }
        }
    } .bind(this));
        if (!Object.isEmpty(returnSelected))
            parentCalendar.prototype.parentFilter = returnSelected;
},
/**
* @description Says to the calendar it has to be refreshed
*/
_refreshCalendars: function() {
    this.refresh = true;
}
});