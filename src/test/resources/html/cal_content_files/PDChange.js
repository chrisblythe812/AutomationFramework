
var PDChange = Class.create(Application,
/**
*@lends PDChange
*/{
    /**
    *@param $super The superclass (Application)
    *@description Instantiates the app
    */
    initialize: function($super, options) {
        $super(options);
        this.widgetsService = 'GET_WIDGETS';
        this.getContentService = 'GET_CONTENT2';
        this.getGlobalService = 'GET_GLB_CONTENT';        
        this.saveRequestService = 'SAVE_REQUEST';
        this.tabId = null;
        this._addButtons = null;
        this._globalButtonsContainer = null;
        this.tabId = this.options.tabId;
        this.widgetsReadyBinding = this.fillWidgets.bind(this, false);
        this._elementsStorage = new Hash();
        this._addButtons = new Hash();
        this._selectedScreens = new Hash();
        this.refreshMap = new Hash();
        this.widgetsStructure = new Hash();
        this.useOfGlobalId = new Hash();
    },
    run: function($super, args) {
        $super(args);
        if (this.firstRun)
            this.createHtml();
        document.observe('PDC:widgetsReady' + this.tabId, this.widgetsReadyBinding);
        //Flag retro/future active
        this.retroFuture = false;
        //Flag payroll is running
        this.payroll = false;
        //To store the datepickers in each step
        this.date_pickers = new Hash();
        //To store the events of the datepickers in each step
        this.dp_events = new Hash();
        //To store the retro/future dates per screen in each step in case this.retroFuture active
        this.retroFutureHash = new Hash();
        //To store the dates when the payroll is running in each step in case this.payroll active
        this.payrollHash = new Hash();
        //To store the handler observing when the fieldpanel toggles its mode
        this._fieldPanelToggleMode = null;
    },
    /**
    *@description creates the general sctructure and calls to the module which load the widgets
    */
    createHtml: function() {
        this.employeeMessage = new Element('div', {
            'id': 'employee_message',
                'class' : 'PDC_employeeMessageLeft'        
        });
        this.employeeMessageName = new Element('div', {
            'id': 'employee_message_name',
            'class': 'application_text_bolder application_main_soft_text inlineElement '
        });
        this.employeeMessageSpace = new Element('div', {
            'id': 'employee_message_space',
            'class': 'inlineElement'
        });
        this.employeeMessageId = new Element('div', {
            'id': 'employee_message_Id',
            'class': 'application_main_soft_text inlineElement'
        });
        this.globalIDcontainer = new Element('div', {
            'id': 'employee_globalID',
            'class' : 'inlineElementRight PDC_globalIDcontainer'        
        });
        this.globalIDcheckBox = new Element('input', {
            'id': 'employee_globalID_checkbox',
            'type': 'checkbox',
            'class': 'inlineElement'
        }).observe('click', this.fillWidgets.bind(this, true));
        this.globalIDlabel = new Element('span', {
            'id': 'employee_globalID_label',
            'class': 'application_text_bolder inlineElement'
        }).insert("&nbsp;" + global.getLabel('useglobal'));
        this.globalIDtext = new Element('span', {
            'id': 'employee_globalID_text',
            'class': 'application_text_bolder application_main_soft_text inlineElement'
        });
        this.globalIDcontainer.insert(this.globalIDcheckBox);
        this.globalIDcontainer.insert(this.globalIDlabel);
        this.globalIDcontainer.insert(this.globalIDtext);
        this.employeeMessage.insert(this.employeeMessageName);
        this.employeeMessage.insert(this.employeeMessageSpace);
        this.employeeMessage.insert(this.employeeMessageId);
        this.virtualHtml.insert(this.employeeMessage);
        this.virtualHtml.insert(this.globalIDcontainer);
        this.globalIDcontainer.hide();
        this.mainWidgetsContainer = new Element('div', {
            'id': 'PDC_widgets_' + this.tabId,
            'class': 'PDC_widgetsDiv'
        });
        this.virtualHtml.insert(this.mainWidgetsContainer);
        /******* Select user ********/
        this.warningmsg = new Element('div', {
            id: 'PDC_noESS_' + this.tabId,
            'class': 'PDC_infoMessage'
        }).update(global.getLabel('noESSselected'));
        this.virtualHtml.insert(this.warningmsg);
        this._globalButtonsContainer = new Element('div');
        this.virtualHtml.insert(this._globalButtonsContainer);
    },
    /**
    *@param name, the name of the employee
    *@param id, the id of the employee
    *@description it shows the employee name and id
    */
    showEmployeeName: function(name, id) {
        this.employeeMessageName.update(name);
        this.employeeMessageSpace.update("&nbsp;");
        this.employeeMessageId.update(global.idSeparatorLeft + id + global.idSeparatorRight);
        this.employeeMessage.show();
    },
    /**
    *@param args Args received when an employee is selected
    *@description Loads the selected user widgets
    */
    onEmployeeSelected: function(args) {
        if ($('PDC_widgets_' + this.tabId + '_' + this.empId))
            $('PDC_widgets_' + this.tabId + '_' + this.empId).hide();
        this.globalIDcontainer.hide();
        this.empId = args.id;
        this.globalIDcheckBox.checked = this.useOfGlobalId.get(this.empId) ? this.useOfGlobalId.get(this.empId) : false;
        if (this.empId != global.objectId) //the selected user is different from the main employee
            this.showEmployeeName(args.name, args.id);
        else
            this.employeeMessage.hide();
        this.objectType = args.oType;
        this.warningmsg.hide();
        this.loadWidgets();
    },
    /**
    * @param args Args received when an employee is unselected
    * @description This function is call every time an employee is unselected on the left menu
    */
    onEmployeeUnselected: function(args) {
        return;
    },
    /**
    * @param useGlobalID Says if we need to use the globalID for that employee
    * @description When the event is launched, meaning that we have received the widgets, we start working with them
    */
    fillWidgets: function(useGlobalID) {
        var refresh = false;
        if (useGlobalID) {
            var checked = this.globalIDcheckBox.checked;
            if (this.useOfGlobalId.get(this.empId) != checked)
                refresh = true;
            this.useOfGlobalId.set(this.empId, checked);
        }
        // Checking whether we have received a globalID
        if (!useGlobalID) {
            if (this.widgetsStructure.get(this.empId).globalId) {
                this.globalIDtext.update("&nbsp;" + global.idSeparatorLeft + this.widgetsStructure.get(this.empId).globalId + global.idSeparatorRight);
                //this.globalIDtext.update("&nbsp;" + global.idSeparatorLeft + this.empId + global.idSeparatorRight);
                this.globalIDcontainer.show();
            }
        }
        this.hashOfWidgets = this.widgetsStructure.get(this.empId).widgets;
        // get the appId of Pending Request widget
        var appIdPendReq = '';
        var data = this.widgetsStructure.get(this.empId).widgetsInfo;
        var widgets = data.keys();
        for (var i = 0, length = widgets.length; i < length; i++) {
            if (data.get(widgets[i]).type == 'PEND_REQ') {
                appIdPendReq = widgets[i];
                break;
            }
        }
        // fill each widget
        widgets = this.hashOfWidgets.keys();
        for (var i = 0, length = widgets.length; i < length; i++) {
            // Pending Request widget
            if ((widgets[i] == appIdPendReq)) {
                if (!this.useOfGlobalId.get(this.empId)) {
                    var container = $('PDC_widgets_' + this.tabId + '_' + this.empId);
                    new PendingRequestContent(container, this.hashOfWidgets, this.empId, widgets[i], this.tabId, this.firstRun);
                    document.observe('EWS:widgetInformationChanged_' + this.tabId, this._reloadPendingRequests.bind(this, widgets[i]));
                }
            }
            else
                this.fillGenericWidget(widgets[i], this.hashOfWidgets.get(widgets[i]), this.useOfGlobalId.get(this.empId), refresh);
        }
        this.firstRun = false;
    },
    _reloadPendingRequests: function() {
        data = $(arguments);
        this.hashOfWidgets.get(data[0]).getContentElement().down().remove();
        var container = $('PDC_widgets_' + this.tabId + '_' + this.empId);
        new PendingRequestContent(container, this.hashOfWidgets, this.empId, data[0], this.tabId, this.firstRun);
    },
    /**
    * This function is call every time we call on save on a form that is being edit or when deleting a recordData
    * @param data Event data
    */
    _saveForm: function(data) {
        var args = $A(arguments);
        var appId = args[0];
        var screen = args[1];
        var newReg = args[2] ? args[2] : this.newRecord;
        var listMode = args[3];
        var panelToValidate = args[4];
        var selected = args[5] ? args[5] : 0;
        var json = deepCopy(this._elementsStorage.get(this.empId).get(appId).get('json'));
        var buttons = '';
        var fieldPanel = this._elementsStorage.get(this.empId).get(appId).get('fieldPanel');
        var panel = fieldPanel ? fieldPanel : panelToValidate;
        var widScreen = screen;
        // If it's list mode we get the current selected from the list
        // Checking the form format
        var validForm = panel.validateForm(screen);
        screen = panel.currentSelected;
        // If it's a new register we empty up the buttons node
        if (newReg) {
            //this._getScreen(json,screen).contents.yglui_str_wid_content['buttons'] = null;
            buttons = objectToArray(json.EWS.o_screen_buttons.yglui_str_wid_button);
            buttons = { BUTTON: buttons[0] };
        }
        else {
            // Getting the OKCODE
            if (fieldPanel.currentRecordIndex && !selected)
                selected = parseInt(fieldPanel.currentRecordIndex, 10);
            else if (panel && panel.currentRecordIndex && !selected)
                selected = panel.currentRecordIndex;
                
            if (listMode)
                var buttonsNode = this._getRecord(json, screen, selected, true).contents.yglui_str_wid_content;
            else
                var buttonsNode = this._getScreen(json, screen).contents.yglui_str_wid_content;
            if (fieldPanel.currentRecordIndex || (panel && panel.currentRecordIndex) || args[5]) {
                if ($A(buttonsNode).length > 1)
                    buttonsNode = $A(buttonsNode).reject(function(item) {
                        return item['@rec_index'] != selected;
                    })[0];
            }
            else
                buttonsNode = objectToArray(buttonsNode)[0];
            this._getScreen(json, screen).contents['yglui_str_wid_content'] = buttonsNode;
            var changeButton;
            var action = args[4] ? args[4] : 'MOD';
            if (this.newRecord) {
                action = 'INS';
                if (json.EWS.o_screen_buttons) {
                    var buttonList = objectToArray(json.EWS.o_screen_buttons.yglui_str_wid_button);
                    for (var i = 0, length = buttonList.length; i < length; i++) {
                        if (buttonList[i]['@type'] == action) {
                            changeButton = buttonList[i];
                            break;
                        }
                    }
                    buttonsNode['buttons'] = null;
                }
            }
            else {
                if (buttonsNode.buttons) {
                    var buttonList = objectToArray(buttonsNode.buttons.yglui_str_wid_button);
                    for (var i = 0, length = buttonList.length; i < length; i++) {
                        if (buttonList[i]['@type'] == action) {
                            changeButton = buttonList[i];
                            break;
                        }
                    }
                }
                buttonsNode['buttons'] = null;
                buttons = { BUTTON: json.EWS.o_changeButton };
                var screenButtons = objectToArray(this._getScreen(json, screen).contents.yglui_str_wid_content);
                for (var i = 0, length = screenButtons.length; i < length; i++) {
                    screenButtons[i]['buttons'] = null;
                }
            }
            buttons = { BUTTON: changeButton };
        }
        // Defining the variables that are gonna need to be recovered on the XML
        json.EWS['SERVICE'] = this.saveRequestService;
        var xmlIn = new XML.ObjTree();
        xmlIn.attr_prefix = '@';
        var screenPanel = this._elementsStorage.get(this.empId).get(appId);
        var reg = listMode && screenPanel.get("fromServicePai") !== true ?
                { yglui_str_wid_record: this._getRecord(json, screen, selected)} :
                { yglui_str_wid_record: this._getScreen(json, screen, selected) };
        fieldValues = xmlIn.writeXML(reg, true);
        buttons = xmlIn.writeXML(buttons, true);
        // refresh get_content2 for the appId that's being saved
        this.refreshMap.set(appId, { refresh: true });
        // Defining the XML in
        xmlIn = '<EWS>' +
                    '<SERVICE>' + this.saveRequestService + '</SERVICE>' +
                    '<OBJECT TYPE="' + this.objectType + '">' + this.empId + '</OBJECT>' +
                    '<PARAM>' +
                    '<APPID>' + appId + '</APPID>' +
                    '<RECORDS>' + fieldValues + '</RECORDS>' +
                    buttons +
                    '</PARAM>' +
                    '</EWS>';
        // If there is no erros on the XMl we proceed to make the AJAX call
        if (validForm.correctForm == true) {
            this.makeAJAXrequest($H({
                xml: xmlIn,
                successMethod: '_saveFormSuccess',
                ajaxID: appId + ' ' + widScreen + ' ' + action
            }));
        }
    },
    /**
    * Gets a screen from a JSON based on a screen number
    * @param json The JSON to get the screen from
    * @param screen The screen to get
    */
    _getScreen: function(json, screen, selected) {
        var returnValue = null;
        var oArray = objectToArray(json.EWS.o_field_values.yglui_str_wid_record);
        if (json.EWS.o_field_values) {
            // Going throught all the recors to find the one matching with the screen number
            if (objectToArray(json.EWS.o_field_values.yglui_str_wid_record).length == 1) {
                if (json.EWS.o_field_values.yglui_str_wid_record['@screen'] == screen)
                    returnValue = json.EWS.o_field_values.yglui_str_wid_record;
            }
            else {
                var records = objectToArray(json.EWS.o_field_values.yglui_str_wid_record);
                for (var i = 0, length = records.length; i < length; i++) {
                    var item = records[i];
                    if (selected) {
                        if ((item['@screen'] == screen) && (objectToArray(item.contents.yglui_str_wid_content)[0]['@rec_index'] == selected) && (objectToArray(item.contents.yglui_str_wid_content).length == 1)) {
                            returnValue = item;
                            break;
                        }
                        else if ((item['@screen'] == screen) && (objectToArray(item.contents.yglui_str_wid_content).length > 1)) {
                            item.contents.yglui_str_wid_content = objectToArray(item.contents.yglui_str_wid_content).reject(function(subItem) {
                                return subItem['@rec_index'] != selected;
                            });
                            returnValue = item;
                            break;
                        }
                    }
                    else if (item['@screen'] == screen) {
                        returnValue = item;
                        break;
                    }
                }
            }
        }
        if (selected && (Object.jsonPathExists(returnValue, 'contents.yglui_str_wid_content'))) {
            returnValue.contents['yglui_str_wid_content'] = objectToArray(returnValue.contents.yglui_str_wid_content).reject(function(content) {
                return content['@rec_index'] != selected.toString();
            });
        }
        return returnValue;
    },
    /**
    * Gets a certain node that matchs the rec_index
    * @param json The JSON to search in
    * @param recIndex The rec_index to match
    */
    _getRecord: function(json, screen, recIndex, notMakeNull) {
        var returnValue = null;
        if (json.EWS.o_field_values) {
            // Going throught all the recors to find the one matching with the screen number
            var records = objectToArray(json.EWS.o_field_values.yglui_str_wid_record);
            for (var i = 0, length = records.length; i < length; i++) {
                var item = records[i];
                if (Object.jsonPathExists(item, 'contents.yglui_str_wid_content') && (item['@screen'] == screen) && (item.contents.yglui_str_wid_content['@rec_index'] == recIndex)) {
                    returnValue = item;
                    if (!notMakeNull)
                        item.contents.yglui_str_wid_content['buttons'] = null;
                    break;
                }
            }
        }
        return returnValue;
    },
    /**
    * This function will be called in case that the backend doesn't send back an error message
    * and the saving process succed.
    * @param json The JSON information of the reply
    * @param data AJAX id information
    */
    _saveFormSuccess: function(json, data) {
        // Update pending requests
        data = data.split(' ');
        var appId = data[0];
        var widgetScreen = data[1];
        var selectedIndex;
        var elementStored = this._elementsStorage.get(this.empId);
        var contentContainer = elementStored.get(appId).get('contentContainer');
        contentContainer.update();
        var panel = elementStored.get(appId).get('fieldPanel');
        if (!Object.isEmpty(panel)) {
            selectedIndex = panel.currentSelected;
            elementStored.get(appId).get('contentContainer').update('');
            panel.destroy();
            elementStored.get(appId).set('fieldPanel', null);
            elementStored.get(appId).set('contentContainer', null);
            elementStored.unset(appId);
        }
        this._getWidgetContent(appId, this.useOfGlobalId.get(this.empId), widgetScreen, selectedIndex);
        document.fire('EWS:widgetInformationChanged_' + this.tabId);
        if (appId == "PD_MAT")
            document.fire('EWS:refreshCalendars');
        global.reloadApplication();
        if (this.isInformationMessage(json))
            this._infoMethod(global.getLabel('pendingRequestSend'));
    },
    /**
    * @description Method which show an information message when it's needed
    * @param json The JSON information of the reply
    */
    isInformationMessage: function(json) {
        var needed = json.EWS.o_req_head['@transferred'];
        if (needed == "X") // it isn't needed
            return false;
        else // needed                
            return true;
    },
    /**
    *@description Method which call the GetWidgets module
    */
    loadWidgets: function() {
        document.stopObserving('EWS:widgetInformationChanged_' + this.tabId);
        // First time we select that employee
        if (!$('PDC_widgets_' + this.tabId + '_' + this.empId) || !this._elementsStorage.get(this.empId)) {
            var empDiv = new Element('div', {
                'id': 'PDC_widgets_' + this.tabId + '_' + this.empId
            });
            this.mainWidgetsContainer.insert(empDiv);
            var empWidgets = new GetWidgets({
                eventName: 'PDC:widgetsReady' + this.tabId,
                service: this.widgetsService,
                tabId: this.tabId,
                objectType: this.objectType,
                objectId: this.empId,
                target: 'PDC_widgets_' + this.tabId + '_' + this.empId
            });
            this.widgetsStructure.set(this.empId, empWidgets);
        }
        // The employee was selected before
        else {
            $('PDC_widgets_' + this.tabId + '_' + this.empId).show();
            if (this.widgetsStructure.get(this.empId).globalId) {
                this.globalIDtext.update("&nbsp;" + global.idSeparatorLeft + this.widgetsStructure.get(this.empId).globalId + global.idSeparatorRight);
                //this.globalIDtext.update("&nbsp;" + global.idSeparatorLeft + this.empId + global.idSeparatorRight);
                this.globalIDcontainer.show();
            }
            var appIdPendReq = '';
            this.hashOfWidgets = this.widgetsStructure.get(this.empId).widgets;
            // Checking if all the widgets were loaded before
            var loadedWidgets = this._elementsStorage.get(this.empId).keys();
            var widgets = this.widgetsStructure.get(this.empId).widgets.keys();
            if (loadedWidgets.length != widgets.length) {
                // Getting the appId of Pending Request widget
                var data = this.widgetsStructure.get(this.empId).widgetsInfo;
                for (var i = 0, length = widgets.length; i < length; i++) {
                    if (data.get(widgets[i]).type == 'PEND_REQ') {
                        appIdPendReq = widgets[i];
                        break;
                    }
                }
                // Fill each missing widget
                for (var i = 0, length = widgets.length; i < length; i++) {
                    if (!loadedWidgets.include(widgets[i])) {
                        // Pending Request widget
                        if ((widgets[i] == appIdPendReq)) {
                            if (!this.useOfGlobalId.get(this.empId)) {
                                document.stopObserving('EWS:widgetInformationChanged_' + this.tabId);
                                var container = $('PDC_widgets_' + this.tabId + '_' + this.empId);
                                new PendingRequestContent(container, this.hashOfWidgets, this.empId, widgets[i], this.tabId, this.firstRun);
                                document.observe('EWS:widgetInformationChanged_' + this.tabId, this._reloadPendingRequests.bind(this, widgets[i]));
                            }
                        }
                        else {
                            var refresh = this.useOfGlobalId.get(this.empId);
                            this.fillGenericWidget(widgets[i], this.hashOfWidgets.get(widgets[i]), this.useOfGlobalId.get(this.empId), refresh);
                        }
                    }
                }
            }
            // Checking if we need to refresh some widgets (due to a save in other app)
            var defaultScreen = '1';
            for (var i = 0, length = widgets.length; i < length; i++) {
                var reload = global.getScreenToReload(this.options.view, widgets[i], defaultScreen, this.empId, this.objectType);
                // Refresh only if the widget has been loaded before
                if (reload && loadedWidgets.include(widgets[i])) {
                    // Pending Request widget
                    if ((widgets[i] == appIdPendReq)) {
                        document.stopObserving('EWS:widgetInformationChanged_' + this.tabId);
                        var container = $('PDC_widgets_' + this.tabId + '_' + this.empId);
                        new PendingRequestContent(container, this.hashOfWidgets, this.empId, widgets[i], this.tabId, this.firstRun);
                        document.observe('EWS:widgetInformationChanged_' + this.tabId, this._reloadPendingRequests.bind(this, widgets[i]));
                    }
                    else
                        this.fillGenericWidget(widgets[i], this.hashOfWidgets.get(widgets[i]), this.useOfGlobalId.get(this.empId), true);
                }
            }
        }
    },
    /**
    * @param widgetId Widget's ID
    * @param widgetInfo Widget's information
    * @param useGlobalID Says if we need to use the globalID for that employee
    * @param refresh Boolean saying if we want to force a refresh for that widget
    *@description Method to fill the Pending Request Widget
    */
    fillGenericWidget: function(widgetId, widgetInfo, useGlobalID, refresh) {
        if (Object.isEmpty(refresh))
            refresh = false;
        var vlabLoading = global.getLabel('loading');
        widgetInfo.setContent(vlabLoading + '...');
        this._getWidgetContent(widgetId, useGlobalID, null, null, refresh);
    },
    /**
    * @description Gets the widgets content
    * @param appId The widget ID
    * @param widScreen The widscreen
    * @param selectedIndex The selected index
    * @param refresh Boolean saying if we want to force a refresh for that widget
    */
    _getWidgetContent: function(appId, useGlobalID, widScreen, selectedIndex, refresh) {
        //var idToUse = useGlobalID ? this.widgetsStructure.get(this.empId).globalId : this.empId;
        var idToUse = this.empId;
        if (Object.isEmpty(this._elementsStorage.get(idToUse)))
            this._elementsStorage.set(idToUse, new Hash());
        var elementStored = this._elementsStorage.get(idToUse);
        if (Object.isEmpty(refresh))
            refresh = false;
        if (Object.isEmpty(elementStored.get(appId)) || refresh) {
            if (!Object.isEmpty(elementStored.get(appId))) {
                elementStored.get(appId).get('contentContainer').update('');
                if (!Object.isEmpty(elementStored.get(appId).get('fieldPanel'))) {
                    elementStored.get(appId).get('fieldPanel').destroy();
                    elementStored.get(appId).set('fieldPanel', null);
                }
                elementStored.get(appId).set('contentContainer', null);
                elementStored.unset(appId);
            }
            var getScreen;
            var cache = true;
            if (!widScreen)
                widScreen = '1';
            getScreen = global.getScreenToReload(this.options.view, appId, widScreen, idToUse, this.objectType);
            if (getScreen)
                cache = false;
            else if (this.refreshMap.get(appId)) {
                if (this.refreshMap.get(appId).refresh) {
                    cache = false;
                    this.refreshMap.get(appId).refresh = false;
                }
            }
            global.unsetScreenToReload({view: this.options.view, appid: appId, screen: widScreen}, {objectId: idToUse, objectType: this.objectType});
            // Forming the XML in
            var service = useGlobalID ? this.getGlobalService : this.getContentService; 
            var xml = "<EWS>"
                    + "<SERVICE>" + service + "</SERVICE>"
                    + "<OBJECT TYPE='" + this.objectType + "'>" + idToUse + "</OBJECT>"
                    + "<PARAM>"
                    + "<APPID>" + appId + "</APPID>"
                    + "<WID_SCREEN>*</WID_SCREEN>"
                    + "</PARAM>"
                    + "</EWS>";
            // Requesting the data
            this.makeAJAXrequest($H({
                xml: xml,
                successMethod: '_parseWidgetContent',
                ajaxID: widScreen + ' ' + appId + ' ' + (selectedIndex ? selectedIndex : ''),
                cache: cache
            }));
        }
        else {
            var data = widScreen + ' ' + appId + ' ' + (selectedIndex ? selectedIndex : '');
            this._parseWidgetContent(null, data, false);
        }
    },
    /**
    * @description Parses the widget content service
    * @param xml The XML out
    * @param appId The identificator of the AJAX call
    */
    _parseWidgetContent: function(JSON, data, fromPai) {
        var dataArgument = data;
        // Defining the variables
        data = data.split(' '); // Spliting the data
        var appId = data[1]; // Stores the AppId
        var widScreen = data[0]; // Stores the widget screen
        var selectedPanel = data[2]; // Currently selected panel
        var fromServicePai = data[3] === "true" || fromPai === true ? true : false;
        this._selectedScreens = $H(); // The selected screens
        var listMode = false; // List mode indicator
        var panel = null; // Stores the panel
        var widgetScreens = null; // Widget screens
        if (!fromServicePai)
            this.newRecord = undefined;
        var loadingContainer = new Element('div', {
            'id': 'loadingContainer_' + appId
        });
        if (!Object.isEmpty(JSON)) {
            if (!Object.isEmpty(JSON.EWS.o_field_settings)) {
                if (JSON.EWS.o_widget_screens) {
                    var screens = JSON.EWS.o_widget_screens.yglui_str_wid_screen.yglui_str_wid_screen ?
                                      objectToArray(JSON.EWS.o_widget_screens.yglui_str_wid_screen.yglui_str_wid_screen) :
                                      objectToArray(JSON.EWS.o_widget_screens.yglui_str_wid_screen);
                    for (var i = 0, length = screens.length; i < length; i++) {
                        var select;
                        var item = screens[i];
                        if (this._elementsStorage.get(this.empId).get(appId))
                            select = this._elementsStorage.get(this.empId).get(appId).get('fieldPanel').currentSelected;
                        if (Object.isEmpty(select) && !Object.isEmpty(widScreen))
                            select = widScreen;
                        if (item.yglui_str_wid_screen)
                            item = item.yglui_str_wid_screen;
                        if ((item['@screen'] == widScreen) && (item['@list_mode'] == 'X'))
                            listMode = true;
                        if (select) {
                            if (item['@screen'] == select)
                                item['@selected'] = 'X';
                            else
                                item['@selected'] = '';
                        }
                    }
                }
                // Deleting the previous generated panel in case that it was created
                if (this._elementsStorage.get(this.empId).get(appId))
                    this._elementsStorage.get(this.empId).unset(appId);
                // Creating the structure to store the information of the new panel
                if (!this._elementsStorage.get(this.empId).get(appId)) {
                    this._elementsStorage.get(this.empId).set(appId, $H({
                        fieldPanel: null, //Stores the fielPanel
                        screenNavigation: null, //Stores information about the screen navigation
                        contentContainer: null, //The prototype element that contains the panel
                        json: null, //The JSON information
                        records: new Array(), //The screen records
                        fromServicePai: fromServicePai
                    }));
                }
                // Making a copy of the JSON so the modifications on it will not affect the copy on the cache
                this._elementsStorage.get(this.empId).get(appId).set('json', deepCopy(JSON));
                if (JSON.EWS.o_widget_screens) {
                    var screens = objectToArray(JSON.EWS.o_widget_screens.yglui_str_wid_screen);
                    for (var i = 0, length = screens.length; i < length; i++) {
                        var item = screens[i];
                        if (item.yglui_str_wid_screen)
                            item = item.yglui_str_wid_screen;
                        if ((item['@screen'] == widScreen) && (item['@list_mode'] == 'X'))
                            listMode = true;
                    }
                }
                document.stopObserving('EWS:pdcChange_' + this.tabId + '_' + appId);
                var panelMode = fromServicePai ? 'edit' : 'display';
                // Creating the fieldsPanel
                //document.stopObserving("EWS:pdChangeFieldChange_" + widScreen + '_' + appId + '_' + this.empId);
                panel = new getContentModule({
                    appId: appId,
                    mode: panelMode,
                    json: this._elementsStorage.get(this.empId).get(appId).get('json'),
                    //jsonCreateMode: this.createModeJson,
                    showCancelButton: false,
                    buttonsHandlers: $H({
                        DEFAULT_EVENT_THROW: 'EWS:pdcChange_' + this.tabId + '_' + appId,
                        paiEvent: function(args) {
                            document.fire('EWS:paiEvent_' + appId + '_' + widScreen, getArgs(args));
                        }
                    }),
                    cssClasses: $H({
                        tcontentSimpleTable: 'PDC_stepsWithTable',
                        fieldDispAlignBoxFields: 'fieldDispTotalWidth'
                    }),
                    showButtons: $H({
                        edit: false,
                        display: true,
                        create: false
                    }),
                    fieldDisplayerModified: "EWS:pdChangeFieldChange_" + widScreen + '_' + appId + '_' + this.empId
                });
                    
                this.retroFutureWidget = true;
                //Getting from the JSON the retro/future and payroll dates if exists
                this._getRetroFuture_Payroll(JSON, appId);
                //Set the retro/future and the payroll dates
                if(this.retroFutureWidget)
                    this._setRetroFuture_Payroll(panel, appId);
                    
                // Creating the observers for the fieldPanel
                document.observe('EWS:pdcChange_' + this.tabId + '_' + appId, this._actionButtonPressed.bind(this, appId, widScreen, listMode));
                document.stopObserving('EWS:paiEvent_' + appId + '_' + widScreen);
                this.paiEventUpdateBind = this._paiEventUpdate.bind(this, appId, widScreen, listMode, panel);
                document.observe('EWS:paiEvent_' + appId + '_' + widScreen, this.paiEventUpdateBind);
                // Creating the widget screens
                // Going througt all the record and storing them on an array
                if (JSON.EWS.o_field_values) {
                    var reg = objectToArray(JSON.EWS.o_field_values.yglui_str_wid_record);
                    for (var i = 0, lengthReg = reg.length; i < lengthReg; i++) {
                        var records = objectToArray(reg[i].contents.yglui_str_wid_content);
                        for (var j = 0, lengthRecords = records.length; j < lengthRecords; j++) {
                            this._elementsStorage.get(this.empId).get(appId).get('records').push(records[j]);
                        }
                    }
                }
                // Storing the panel for this widget
                this._elementsStorage.get(this.empId).get(appId).set('fieldPanel', panel);
                this._elementsStorage.get(this.empId).get(appId).set('arguments', dataArgument);
                this._elementsStorage.get(this.empId).get(appId).set('fromServicePai', fromServicePai);
            }
            else {
                // Deleting previous information
                if (this._elementsStorage.get(this.empId).get(appId))
                    this._elementsStorage.get(this.empId).unset(appId);
                // Creating the structure to store the new information
                if (!this._elementsStorage.get(this.empId).get(appId)) {
                    this._elementsStorage.get(this.empId).set(appId, $H({
                        fieldPanel: null, //Stores the fielPanel
                        screenNavigation: null, //Stores information about the screen navigation
                        contentContainer: null, //The prototype element that contains the panel
                        json: null, //The JSON information
                        records: new Array(), //The screen records
                        fromServicePai: fromServicePai
                    }));
                }
            }
        }
        else
            panel = this._elementsStorage.get(this.empId).get(appId).get('fieldPanel');
        this.hashOfWidgets.get(appId).setContent('');
        if (widgetScreens)
            this.hashOfWidgets.get(appId).getContentElement().insert(widgetScreens);
        this._elementsStorage.get(this.empId).get(appId).set('loadingContainer', loadingContainer);
        this.hashOfWidgets.get(appId).getContentElement().insert(loadingContainer);
        var widgetInformation;
        if (panel)
            widgetInformation = panel.getHtml();
        else {
            var widgetInformation = new Element('div', {
                'class': 'fieldDispTotalWidth fieldDispFloatLeft pdcPendReq_emptyTableDataPart application_main_soft_text test_label'
            });
            var message = this.useOfGlobalId.get(this.empId) ? global.getLabel('noGlobalView') : global.getLabel('noResults');
            widgetInformation.update(message);
        }
        this.hashOfWidgets.get(appId).getContentElement().insert(widgetInformation);
        this._elementsStorage.get(this.empId).get(appId).set('contentContainer', this.hashOfWidgets.get(appId).getContentElement());
        if (panel)
            panel.setFocus();
    },
    /**
    * This function is called every time the service PAI event is fired by getContentModule
    */
    _paiEventUpdate: function() {
        // Declarations
        var args = $A(arguments);
        var data = args[4].memo;
        var panel = this._elementsStorage.get(this.empId).get(args[0]).get('fieldPanel');
        var json = null;
        var jsonToSend = null;
        var xml = new XML.ObjTree();
        json = panel.json;
        var reg = { yglui_str_wid_record: this._getScreen(json, panel.currentSelected, panel.currentRecordIndex) };
        var settings = null;
        if (objectToArray(json.EWS.o_field_settings.yglui_str_wid_fs_record).length == 1)
            settings = { yglui_str_wid_fs_record: json.EWS.o_field_settings.yglui_str_wid_fs_record };
        else
            settings = {
                yglui_str_wid_fs_record: $A(json.EWS.o_field_settings.yglui_str_wid_fs_record).reject(function(item) {
                    return item["@screen"] != panel.currentSelected;
                })
            };
        var screenMode = json.EWS.o_widget_screens['@screenmode'];
        delete json.EWS.o_widget_screens['@screenmode'];
        jsonToSend = {
            EWS: {
                SERVICE: data.servicePai,
                OBJECT: {
                    TYPE: this.objectType,
                    TEXT: this.empId
                },
                PARAM: {
                    APPID: args[0],
                    o_date_ranges: json.EWS.o_date_ranges,
                    o_field_settings: settings,
                    o_field_values: reg,
                    o_screen_buttons: json.EWS.o_screen_buttons,
                    o_widget_screens: {
                        '@screenmode': screenMode,
                        yglui_str_wid_screen: json.EWS.o_widget_screens
                    }
                }
            }
        };
        //document.stopObserving('EWS:paiEvent_' + args[0] + '_' + args[1]);
        // Converting the JSON to XML
        xml.attr_prefix = '@';
        xml = xml.writeXML(jsonToSend, true);
        if (!this._elementsStorage.get(this.empId).get(args[0]).get('fromServicePai')) {
            var loadingElement = new Element('span', {
                'id': 'popUpErrorDiv',
                'class': 'loading_caption inlineElement'
            }).insert(global.getLabel('loading') + '...');
            this._elementsStorage.get(this.empId).get(args[0]).get('loadingContainer').insert(loadingElement);
        }
        global.disableAllButtons();
        this.makeAJAXrequest($H({
            xml: xml,
            successMethod: '_updatePaiEventSuccess',
            errorMethod: '_updatePaiEventFailure',
            ajaxID: args[0] + ' ' + args[1] + ' ' + (panel.currentSelected ? '1' : '0') + ' ' + data.record,
            enableButtons: true
        }));
    },
    /**
    * This function is called if the Pai event call was a successMethod
    * @param json The returned JSON
    * @param data The AJAX CALL id information
    * @param getPrevious Indicates if it have to take the information of the previous call
    */
    _updatePaiEventSuccess: function(json, data, getPrevious) {
        data = data.split(' ');
        if (json.EWS.o_widget_screens) {
            var screens = json.EWS.o_widget_screens.yglui_str_wid_screen.yglui_str_wid_screen ?
                              objectToArray(json.EWS.o_widget_screens.yglui_str_wid_screen.yglui_str_wid_screen) :
                              objectToArray(json.EWS.o_widget_screens.yglui_str_wid_screen);
            for (var i = 0; i < screens.size(); i++)
                screens[i]['@list_mode'] = "";
        }
        if (this._elementsStorage.get(this.empId).get(data[0]).get('loadingContainer'))
            this._elementsStorage.get(this.empId).get(data[0]).get('loadingContainer').update('');
        var fromPai = this._elementsStorage.get(this.empId).get(data[0]).get('fromServicePai') || getPrevious != undefined;
        this._elementsStorage.get(this.empId).get(data[0]).set('fromServicePai', true);
        this.hashOfWidgets.get(data[0]).setContent('');
        var args = getPrevious === true ? this._elementsStorage.get(this.empId).get(data[0]).get('arguments') : data[1] + ' ' + data[0] + ' ' + data[2] + (fromPai ? ' true' : ' false');
        this._parseWidgetContent(json, args, true);
        this._actionButtonPressed(data[0], data[1], (data[2] == '1' ? true : false), {
            type: fromPai ? 'PAI' : 'MOD',
            record: data[3],
            noToggle: true
        });
    },
    /**
    * Failure method for PAI event calls
    * @param json The JSON out
    * @param data The attached data to the event
    */
    _updatePaiEventFailure: function(json, data) {
        this.currentFieldFocus = null;
        if (!Object.isEmpty(global.focusFieldID))
            this.currentFieldFocus = global.focusFieldID;
        var param = data.split(' ');
        this.currentwidScreen = param[1];
        this._failureMethod(json);
        fromServicePai = this._elementsStorage.get(this.empId).get(param[0]).get('fieldPanel');
        // if json returned doesn't have the full info, construct the old value, else continue
        if (!json || !json.EWS.o_field_settings || !json.EWS.o_field_values)
            json = this._elementsStorage.get(this.empId).get(param[0]).get('fieldPanel').json;
        this._updatePaiEventSuccess(json, data, true);
    },
    /*******************************************************************/
    _failureMethod: function(data) {
        var errorText;
        if (data)
            errorText = data.EWS.webmessage_text;
        else
            errorText = global.getLabel('connectionError');
        // This is done to be able to show the popup when loading GET_USETTINGS fails.
        if (!global || $("idDivInfoPopUpContainer") && !global.infoFailurePopup) {
            // Fix to show a javascript error if first service fails, and ther is no way to show our own popup
            if (!global && Object.isEmpty($("idDivInfoPopUpContainer")))
                alert(errorText);
            else {
                if (Object.isEmpty($("idDivInfoPopUpContainer").down('[id=idModuleInfoPopUp_container]').down('[id=moduleInfoPopUp_content]').down('[id=idModuleInfoPopUp_textMessagePart]').down('[id=popUpErrorDiv]'))) {
                    var errorDiv = new Element('div', {
                        'id': 'popUpErrorDiv',
                        'class': 'fieldError genCat_balloon_span FWK_errorMessages'
                    });
                    this.buttonsJson = {
                        elements: [],
                        defaultButtonClassName: 'genCat_balloon_span'
                    };
                    var aux = {
                        idButton: 'showHideError',
                        label: global.getLabel('hideAllMessages'),
                        className: 'getContentLinks fieldDispClearBoth application_action_link',
                        type: 'link',
                        handlerContext: null,
                        handler: this.showHideButtons.bind(this, errorDiv)
                    };
                    this.buttonsJson.elements.push(aux);
                    this.showHidebuttons = new megaButtonDisplayer(this.buttonsJson);
                    $("idDivInfoPopUpContainer").down('[id=idModuleInfoPopUp_container]').down('[id=moduleInfoPopUp_content]').down('[id=idModuleInfoPopUp_textMessagePart]').insert(this.showHidebuttons.getButtons());
                    $("idDivInfoPopUpContainer").down('[id=idModuleInfoPopUp_container]').down('[id=moduleInfoPopUp_content]').down('[id=idModuleInfoPopUp_textMessagePart]').insert(errorDiv);
                }
                else
                    var errorDiv = $("idDivInfoPopUpContainer").down('[id=idModuleInfoPopUp_container]').down('[id=moduleInfoPopUp_content]').down('[id=idModuleInfoPopUp_textMessagePart]').down('[id=popUpErrorDiv]');
                errorDiv.insert(new Element('div').insert(errorText));
            }
        } else if (Object.isUndefined(global.infoFailurePopup) === true) {
            global.infoFailurePopup = new infoPopUp({
                closeButton: $H({
                    'callBack': function() {
                        global.infoFailurePopup.close();
                        if (!Object.isEmpty(this.currentFieldFocus)) {
                            // We need to search in both "edit" and "create", because the first time the getContent is created in "create" mode,
                            // so the focusField contains "create" mode, but after creating the new getContent, it will be in "edit" mode
                            var focusFieldGroup = this._elementsStorage.get(this.empId).get(this.currentFieldFocus.appId).get('fieldPanel').fieldDisplayers.get(this.currentFieldFocus.appId + "create" + this.currentFieldFocus.screen + this.currentFieldFocus.record);
                            if (Object.isEmpty(focusFieldGroup))
                                focusFieldGroup = this._elementsStorage.get(this.empId).get(this.currentFieldFocus.appId).get('fieldPanel').fieldDisplayers.get(this.currentFieldFocus.appId + "edit" + this.currentFieldFocus.screen + this.currentFieldFocus.record);
                            if (!Object.isEmpty(focusFieldGroup))
                                var focusField = focusFieldGroup.get(this.currentFieldFocus.id);
                            if (!Object.isEmpty(focusField))
                                focusField.setFocus();
                            this.currentFieldFocus = null;
                        }
                        delete global.infoFailurePopup;
                    } .bind(this)
                }),
                htmlContent: new Element("div").insert(errorText),
                indicatorIcon: 'exclamation',
                width: 350
            });
            global.infoFailurePopup.create();
        }
        else
            global.infoFailurePopup.obHtmlContent.insert(new Element("div").insert(errorText));
    },
    /**
    * This function is called every time we click on an action button. For example
    * clickin on add or change or delete.
    */
    _actionButtonPressed: function() {
        // Variables declarations
        var args = $A(arguments);
        var appId = args[0];
        var data = getArgs(args[3]);
        var listMode = args[2];
        var panel = this._elementsStorage.get(this.empId).get(appId).get('fieldPanel');
        var widScreen = panel.currentSelected;
        var way = Object.isEmpty(data.type) ? data.okcode : data.type;
        switch (way) {
            // Modify a record 
            case 'COP':
            case 'MOD':
                panel.cssClasses = $H({
                    tcontentSimpleTable: 'PDC_stepsWithTable',
                    fieldDispAlignBoxFields: 'fieldDispTotalWidth'
                });
                if (data.noToggle !== true)
                    panel.toggleMode('edit', panel.appId, data.screen, data.recKey);
//                //Set the retro/future and the payroll dates
//                if(this.payroll && this.payrollHash.get(appId + "_" + widScreen))
//                    this._setRetroFuture_Payroll(panel, appId);
                this._createFormControlButtons(panel, this.hashOfWidgets.get(appId).getContentElement(), appId, widScreen, false, listMode);
                break;
            // Delete a record 
            case 'DEL':
                var subPanel;
                subPanel = panel;
                var callback = this._saveForm.bind(this, appId, widScreen, false, listMode, 'DEL', data.recKey);
                this._deleteRecord(callback);
                break;
            // Insert a new record               
            case 'INS':
                this._newRecordCreation(appId, widScreen);
                break;
            case 'PAI':
                if (data.noToggle !== true)
                    var subPanel = panel.toggleMode('edit', appId, 1, data.record);
                if (subPanel)
                    this.hashOfWidgets.get(appId).getContentElement().update(subPanel.getElement().remove());
                this._createFormControlButtons(panel, this.hashOfWidgets.get(appId).getContentElement(), appId, widScreen, false, listMode);
                break;
            case 'DED':
                var quotaData = new Hash();
                quotaData = this._getQuotaData(data.recKey, data.screen);
                var quotaCounter, quotaType;
                quotaCounter = quotaData.get("quotaCounter");
                quotaType = quotaData.get("quotaType");
                this._launchReport(quotaCounter, this.empId, quotaType);
                break;
            default:
                break;
        }
        switch (data.okcode) {
            // Show Google Maps                   
            case 'MAP':
                this._readFormAddressParameters(appId);
                break;
        }
    },
    callToOpenPCR: function(pcrId) {
        // to check if we have step0 or not, we have to call GET_WIZARDS
        var xml = "<EWS>"
                + "<SERVICE>GET_WIZARDS</SERVICE>"
                + "<OBJECT TYPE='" + this.objectType + "'>" + this.empId + "</OBJECT>"
                + "<PARAM>"
                + "<MENU_TYPE>A</MENU_TYPE>"
                + "<CONTAINER>PCR_OVER</CONTAINER>"
                + "<A_SCREEN>*</A_SCREEN>"
                + "</PARAM>"
                + "</EWS>";
        this.makeAJAXrequest($H({
            xml: xml,
            successMethod: this.openPCR.bind(this, pcrId)
        }));
    },
    openPCR: function(pcrId, json) {
        // from all PCRs, we take the one needed (pcrId)
        var actions = objectToArray(json.EWS.o_wzid_step0.yglui_str_wiz_step0);
        for (var i = 0; i < actions.length; i++) {
            if (actions[i]['@wzid'] == pcrId)
                document.fire("EWS:openApplication", $H({
                    app: "PCR_Steps",
                    wizardId: pcrId,
                    empId: this.empId,
                    step0: actions[i]['@step0']
                }));
        }
    },
    /**
    * This function is called when we click on Show on Google map.
    * It gets the relevant address parameters retrieved from SAP 
    * to use in the “ShowGoogleMaps” module.
    */
    _readFormAddressParameters: function(appId) {
        var fieldTN = ["LAND1", "STATE", "ORT01", "PSTLZ", "STRAS", "HSNMR"];
        var fieldPanel = this._elementsStorage.get(this.empId).get(appId).get('fieldPanel');
        var currentScreen = fieldPanel.currentSelected;
        var screens = objectToArray(fieldPanel.json.EWS.o_field_values.yglui_str_wid_record);
        var address = "";
        var addressParameters = null;
        var addressHash = new Hash();
        var i, o_showGoogleMap, length, recordLength, addrParam;
        //Search the data from current screen and last record
        for (i = 0, length = screens.length; i < length; i++) {
            if (screens[i]["@screen"] == currentScreen) {
                recordLength = objectToArray(screens[i].contents.yglui_str_wid_content).length; //Number of record for the current screen
                addressParameters = objectToArray(screens[i].contents.yglui_str_wid_content)[recordLength - 1].fields.yglui_str_wid_field;
            }
        }
        //Store the SAP address data in a hash to a faster search.
        for (i = 0, M = addressParameters.length; i < M; i++) {
            addrParam = addressParameters[i]["@value"];
            if (addrParam == null) { addrParam = addressParameters[i]["#text"]; }
            addressHash.set(addressParameters[i]["@fieldtechname"], addrParam);
        }
        //If a address parameter returns != null, append this value to the final address.
        for (i = 0, N = fieldTN.length; i < N; i++) {
            if (addressHash.get(fieldTN[i]) != null)
                address += addressHash.get(fieldTN[i]) + " ";
        }
        showGoogleMaps(address, '_blank', '800', '600', 'yes');
    },
    /**
    * This function is called when we click on Add a new record
    * @param appId The appId
    * @param widScreen The widget screen
    */
    _newRecordCreation: function(appId, widScreen) {
        // This flag will indicate if we are creating a new record
        this.newRecord = true;
        var service = this.useOfGlobalId.get(this.empId) ? this.getGlobalService : this.getContentService; 
        var strXml = "<EWS>"
                + "<SERVICE>" + service + "</SERVICE>"
                + "<OBJECT TYPE='" + this.objectType + "'>" + this.empId + "</OBJECT>"
                + "<PARAM>"
                + "<APPID>" + appId + "</APPID>"
                + "<WID_SCREEN>" + this._elementsStorage.get(this.empId).get(appId).get('fieldPanel').currentSelected + "</WID_SCREEN>"
                + "<OKCODE>NEW</OKCODE>"
                + "</PARAM>"
                + "</EWS>";
        this.makeAJAXrequest($H({
            xml: strXml,
            successMethod: '_newRecordStartTemplate',
            ajaxID: appId + ' ' + widScreen
        }));
    },
    /**
    * If the call for creating a new record was a success we procees to create the new panel
    * @json The returned JSON
    * @data The AJAX CALL id
    */
    _newRecordStartTemplate: function(json, data) {
        data = data.split(' ');
        var appId = data[0];
        var widScreen = data[1];
        var panel = null;
        var content = null;
        var select = null;
        if (this._elementsStorage.get(this.empId).get(appId))
            select = this._elementsStorage.get(this.empId).get(appId).get('fieldPanel').currentSelected;
        if (json.EWS.o_widget_screens && select) {
            var screens = json.EWS.o_widget_screens.yglui_str_wid_screen.yglui_str_wid_screen ?
                              objectToArray(json.EWS.o_widget_screens.yglui_str_wid_screen.yglui_str_wid_screen) :
                              objectToArray(json.EWS.o_widget_screens.yglui_str_wid_screen);
            for (var i = 0, length = screens.length; i < length; i++) {
                var item = screens[i];
                if (item['@screen'] == select)
                    item['@selected'] = 'X';
                else
                    item['@selected'] = '';
            }
        }
        this._elementsStorage.get(this.empId).get(appId).unset('json');
        this._elementsStorage.get(this.empId).get(appId).set('json', deepCopy(json));
        var jsonElement = this._elementsStorage.get(this.empId).get(appId).get('json');
        if (jsonElement.EWS.o_field_values)
            if (jsonElement.EWS.o_field_values.yglui_str_wid_record) {
            objectToArray(objectToArray(jsonElement.EWS.o_field_values.yglui_str_wid_record)[0].contents.yglui_str_wid_content)[0]['@selected'] = 'X';
            objectToArray(objectToArray(jsonElement.EWS.o_field_values.yglui_str_wid_record)[0].contents.yglui_str_wid_content)[0]['buttons'] = null;
        }
        json = this._elementsStorage.get(this.empId).get(appId).get('json');
        if (Object.jsonPathExists(json, 'EWS.o_widget_screens.yglui_str_wid_screen.yglui_str_wid_screen')) {
            var screens = objectToArray(json.EWS.o_widget_screens.yglui_str_wid_screen.yglui_str_wid_screen);
            for (var i = 0, length = screens.length; i < length; i++)
                screens[i]['@list_mode'] = "";
        }
        panel = new getContentModule({
            appId: appId,
            mode: 'create',
            json: this._elementsStorage.get(this.empId).get(appId).get('json'),
            showCancelButton: false,
            buttonsHandlers: $H({
                DEFAULT_EVENT_THROW: 'EWS:pdcChange_' + this.tabId + '_' + appId,
                paiEvent: function(args) {
                    document.fire('EWS:paiEvent_' + appId + '_' + widScreen, getArgs(args));
                }
            }),
            cssClasses: $H({
                tcontentSimpleTable: 'PDC_stepsWithTable',
                fieldPanelSimpleTableDiv: 'simpleTable_table',
                fieldDispAlignBoxFields: 'fieldDispTotalWidth'
            }),
            showButtons: $H({
                edit: false,
                display: true,
                create: false
            }),
            fieldDisplayerModified: "EWS:pdChangeFieldChange_" + widScreen + '_' + appId + '_' + this.empId
        });
            
        this.retroFutureWidget = true;
        //Getting from the JSON the retro/future and payroll dates if exists
        this._getRetroFuture_Payroll(json, appId);
        //Set the retro/future and the payroll dates
        if(this.retroFutureWidget)
            this._setRetroFuture_Payroll(panel, appId);
            
        document.stopObserving('EWS:paiEvent_' + appId + '_' + widScreen);
        var listMode = (panel.screensNavigationLayerData.get(widScreen).get('config')['@list_mode'] == 'X');
        this.paiEventUpdateBind = this._paiEventUpdate.bind(this, appId, widScreen, listMode, panel);
        document.observe('EWS:paiEvent_' + appId + '_' + widScreen, this.paiEventUpdateBind);
        content = this._elementsStorage.get(this.empId).get(appId).get('contentContainer');
        if (this._elementsStorage.get(this.empId).get(appId).get('fieldPanel')) {
            this._elementsStorage.get(this.empId).get(appId).get('fieldPanel').destroy();
            this._elementsStorage.get(this.empId).get(appId).unset('fieldPanel');
        }
        this._elementsStorage.get(this.empId).get(appId).set('fieldPanel', panel);
        content.update();
        content.insert(panel.getHtml());
        this._createFormControlButtons(panel, content, appId, widScreen, true);
        panel.setFocus();
    },
    /**
    * This function is called to delete a record. It takes care of showing the popup
    * and calling the appropiated callbacks
    * @callback {function} Callback function
    */
    _deleteRecord: function(callback) {
        var contentHTML = new Element('div').insert(global.getLabel('areYouSureRecord'));
        // buttons
        var buttonsJson = {
            elements: [],
            mainClass: 'moduleInfoPopUp_stdButton_div_left'
        };
        var callBackfunct = function() {
            question.close();
            delete question;
            callback();
        };
        var callBack3 = function() {
            question.close();
            delete question;
        };
        var aux2 = {
            idButton: 'Yes',
            label: global.getLabel('yes'),
            handlerContext: null,
            className: 'moduleInfoPopUp_stdButton',
            handler: callBackfunct,
            type: 'button',
            standardButton: true
        };
        var aux3 = {
            idButton: 'No',
            label: global.getLabel('no'),
            handlerContext: null,
            className: 'moduleInfoPopUp_stdButton',
            handler: callBack3,
            type: 'button',
            standardButton: true
        };
        buttonsJson.elements.push(aux2);
        buttonsJson.elements.push(aux3);
        var ButtonObj = new megaButtonDisplayer(buttonsJson);
        var buttons = ButtonObj.getButtons();
        // insert buttons in div
        contentHTML.insert(buttons);
        var question = new infoPopUp({
            closeButton: $H({
                'textContent': 'Close',
                'callBack': function() {

                    question.close();
                    delete question;
                }
            }),
            htmlContent: contentHTML,
            indicatorIcon: 'information',
            width: 350
        });
        question.create();
    },
    /**
    * Makes the AJAX call to indicate the backend we want to delete a record
    * @param appId The application ID
    * @param widScreen The widget screen
    * @param record the record
    */
    _requestSapRecordDeletion: function(appId, widScreen, record) {
        var json = this._elementsStorage.get(this.empId).get(appId).get('json');
        var recordData = this._elementsStorage.get(this.empId).get(appId).get('records')[parseInt(record, 10) - 1];
        var fieldValues = json.EWS.o_field_values;
        var xmlIn = new XML.ObjTree();
        var buttonNode = null;
        var delButton = $A(recordData.buttons.yglui_str_wid_button).select(function(item) {
            if (item['@type'] == 'DEL')
                return true;
            else
                return false;
        });
        recordData.buttons.yglui_str_wid_button = delButton;
        xmlIn.attr_prefix = '@';
        buttonNode = xmlIn.writeXML({
            button: delButton[0]
        }, true);
        fieldValues = xmlIn.writeXML(fieldValues, true);
        // refresh get_content2 for the appId that's being saved
        this.refreshMap.set(appId, { refresh: true });
        // Defining the XML in
        var xmlIn = '<EWS>' +
                '<SERVICE>' + this.saveRequestService + '</SERVICE>' +
                '<OBJECT TYPE="' + this.objectType + '">' + this.empId + '</OBJECT>' +
                '<PARAM>' +
                '<APPID>' + appId + '</APPID>' +
                '<RECORDS>' +
                fieldValues +
                '</RECORDS>' +
                '</PARAM>' +
                '<DEL></DEL>' +
                '</EWS>';
        // Making the AJAX request
        this.makeAJAXrequest($H({
            xml: xmlIn,
            successMethod: '_saveFormSuccess',
            ajaxID: appId + '_' + widScreen
        }));
    },
    /**
    * Creates the form buttons like Save and Cancel and set the appropiated callbacks for them
    * @param panel Panel to make the insertion
    * @param container The panel container
    * @param appId The application id
    * @param screen The widget screen
    * @param newRecord Indicates whether this is a new record or not
    * @param listMode Indicates whether this is in list mode or not
    */
    _createFormControlButtons: function(panel, container, appId, screen, newRecord, listMode) {
        if (newRecord == undefined)
            newRecord = false;
        var mainButtonsJson = {
            elements: [],
            mainClass: 'PDC_buttonsContainer'
        };
        var saveHandler = null;
        if (newRecord)
            saveHandler = this._saveForm.bind(this, appId, screen, true, listMode, panel);
        else
            saveHandler = this._saveForm.bind(this, appId, screen, undefined, listMode);
        var aux = {
            idButton: 'save',
            label: global.getLabel('save'),
            handlerContext: null,
            handler: saveHandler,
            className: 'PMF_showDocsButton',
            type: 'button',
            standardButton: true
        };
        var aux2 = {
            idButton: 'cancel',
            label: global.getLabel('cancel'),
            handlerContext: null,
            handler: this._getWidgetContent.bind(this, appId, this.useOfGlobalId.get(this.empId), screen, panel ? panel.currentSelected : null, true),
            className: 'PMF_showDocsButton',
            type: 'button',
            standardButton: true
        };
        mainButtonsJson.elements.push(aux2);
        mainButtonsJson.elements.push(aux);
        var ButtonsPDC = new megaButtonDisplayer(mainButtonsJson);
        //document.stopObserving('EWS:validFormHandler_' + appId + '_' + screen);
        //document.observe('EWS:validFormHandler_' + appId + '_' + screen, function(args) {
        //if (args.memo === '0')
        //  ButtonsPDC.disable('save');
        //else if (args.memo === '1')
        //  ButtonsPDC.enable('save');
        //});
        var errorCaption = new Element('div', {
            id: 'errorTextCaption',
            'class': 'application_main_error_text '
        }).hide();
        this._elementsStorage.get(this.empId).get(appId).set('errorCaption', errorCaption);
        if (container) {
            container.insert(errorCaption);
            container.insert(new Element('div', {
                'class': 'application_clear_line'
            }));
            container.insert(ButtonsPDC.getButtons());
        }
        else if (panel)
            if (!Object.isEmpty(panel.currentSelected)) {
            var parentContainer = panel.getFieldPanels().get(panel.currentSelected).virtualHtml;
            parentContainer.insert(errorCaption);
            parentContainer.insert(new Element('div', {
                'class': 'application_clear_line'
            }));
            parentContainer.insert(ButtonsPDC.getButtons());
        }
    },
    /**
    * @description Refresh the widget screen
    */
    _refreshWidgetScreens: function() {
        var args = $A(arguments);
        var screens = args[0];
        var i = args[1];
        var appId = args[2];
        var screens = objectToArray(screens.yglui_str_wid_screen);
        for (var j = 0, length = screens.length; j < actions.length; j++) {
            if ((screens[j]['@element'] != null) && (j == i)) {
                this._selectedScreens.set(appId + screens[j]['@screen'], j);
                if (screens[j]['@element'].down() != null)
                    this._getWidgetContent(screens[j]['@appid'], this.useOfGlobalId.get(this.empId), screens[j]['@screen']);
            }
        }
    },
    /**
    *@description it searches and returns the value and length of the quota counter and the quota type related to the record existing on quota details
    *@param index: the position of the record
    *@param screen: the corresponding screen
    *@return a hash with the 2 values or null in case it can't find them
    */
    _getQuotaData: function(index, screen) {
        var pern = this.empId;
        var widgetInfo = this._elementsStorage.get(pern).get("QUOT_DAT");
        var json = widgetInfo.get("json");
        var fieldValues = objectToArray(json.EWS.o_field_values.yglui_str_wid_record);
        var fieldSettings = objectToArray(json.EWS.o_field_settings.yglui_str_wid_fs_record);
        var valuesIndex = -1, auxIndex, auxScreen;
        for (var i = 0; i < fieldValues.length; i++) {
            auxScreen = fieldValues[i]["@screen"];
            if (auxScreen == screen) {
                auxIndex = fieldValues[i].contents.yglui_str_wid_content["@rec_index"];
                if (auxIndex == index) {
                    valuesIndex = i;
                    break;
                }
                else
                    continue;
            }
            else
                continue;
        }
        if (valuesIndex > -1) {
            //getting the length
            var settingsIndex = getElementIndex(fieldSettings, "@screen", screen);
            var settings = fieldSettings[settingsIndex].fs_fields.yglui_str_wid_fs_field;
            var qCLengthIndex, qTLengthIndex, qCLength, qTLength;
            qCLengthIndex = getElementIndex(settings, "@fieldid", "QUONR");
            qCLength = settings[qCLengthIndex]["@length"];
            qTLengthIndex = getElementIndex(settings, "@fieldid", "KTART");
            qTLength = settings[qTLengthIndex]["@length"];
            //getting the value
            var fields = fieldValues[valuesIndex].contents.yglui_str_wid_content.fields.yglui_str_wid_field;
            var qCIndex, qTIndex, qCValue, qTValue;
            qCIndex = getElementIndex(fields, "@fieldtechname", "QUONR");
            qCValue = fields[qCIndex]["@value"];
            qTIndex = getElementIndex(fields, "@fieldtechname", "KTART");
            qTValue = fields[qTIndex]["@value"];
                if (Object.isEmpty(qCValue) || Object.isEmpty(qTValue))
                    return null;
                else {
                    var resultHash = new Hash();
                    resultHash.set("quotaCounter", {
                        value: qCValue,
                        length: qCLength
                    });   
                    resultHash.set("quotaType", {
                        value: qTValue,
                        length: qTLength
                    });                             
                    return resultHash;
                }
            }
            else
                return null;
        },
    /**
    * @description it will try to get the report corresponding to the quota deduction which was searched for
    * @param quotaCounter: the quota counter associated to the record
    * @param personalNumber: the personal number of the employee whose quota we are viewing
    * @param quotaType: the quota type associated to the record
    */
    _launchReport: function(quotaCounter, personalNumber, quotaType) {
        var report = new quotaReport(
                $H({
                    qC: quotaCounter,
                    pernr: personalNumber,
                    qT: quotaType
                })
            );
    },
    /**
    *@param $super The superclass: Application
    *@description Closes the application
    */
    close: function($super) {
        $super();
        document.stopObserving('PDC:widgetsReady' + this.tabId, this.widgetsReadyBinding);
            if(this.payroll && this.dp_events.keys().length > 0){
                 this._setDatePickersObservers(false);
                 this._fieldPanelToggleMode.stop();
            }
        },
        
        /**
        *@description Gets the Retro/Future and Payroll dates if exist. Sets the corresponding flags
        *@param json: GET_STEP_CONT JSON with the dates
        *@param appid: Appid of the current widget
        */
        _getRetroFuture_Payroll: function(json, appid){
            if(!Object.isEmpty(json.EWS.o_date_ranges)){
                var screens = objectToArray(json.EWS.o_date_ranges.yglui_str_dates);
                var dates_hash = $H();
                //Getting the dates per screen
                var inside = false;
                var has_payroll = false;
                this.retroFutureWidget = true;
                for(var i=0; i<screens.length; i++){
                    if(!Object.isEmpty(screens[i].dates)){
                        var retro_future_dates = screens[i].dates.yglui_str_date_fields;
                        var dates_hash = new $H();
                        for(var j=0; j<retro_future_dates.length; j++){ 
                            if(retro_future_dates[j]['@dateid'] == "START" || retro_future_dates[j]['@dateid'] == "END"){
                                this.payroll = true;
                                has_payroll = true;
                            }
                            if(!retro_future_dates[j]['@dateid'].include('ERR'))
                                dates_hash.set(retro_future_dates[j]['@dateid'], retro_future_dates[j]['@date_value']);
                        }
                        this.retroFuture = true;
                        //Setting the hashes to store the retro/future and payroll dates
                        this.retroFutureHash.set(appid + "_" + screens[i]['@screen'], new Array(Date.parseExact(dates_hash.get('RETRO'), "yyyy-MM-dd"), Date.parseExact(dates_hash.get('FUTURE'), "yyyy-MM-dd")));
                        if(has_payroll)
                            this.payrollHash.set(appid + "_" + screens[i]['@screen'], new Array(Date.parseExact(dates_hash.get('START'), "yyyy-MM-dd"), Date.parseExact(dates_hash.get('END'), "yyyy-MM-dd")));
                        inside = true;
                    }
                }
                if(!inside)
                    this.retroFutureWidget = false;
            }
            else{
                this.retroFutureWidget = false;
                this.retroFuture = false;
            }
        },  
        
        /**
        *@description Disable the datepickers with the retro/future dates and active the payroll is running if needed. 
        *@param field: getContentModule where the datepicker are.
        *@param appid: Appid of the fieldpanel
        *@param mode: if we receive the mode arguments means that we are coming from _checkToggleMode method and we want to get
            the fieldDisplayers in edit mode.
        */
        _setRetroFuture_Payroll: function(field, appid, mode){
            //Getting all the fieldDisplayers
            if(this.retroFuture){
                if( field.json.EWS.o_widget_screens && field.json.EWS.o_widget_screens.yglui_str_wid_screen)
	                screens = objectToArray(field.json.EWS.o_widget_screens.yglui_str_wid_screen); 
    	        
	            for(var sc=0; sc<screens.length; sc++){
                    //normal case. If the fieldpanel is un display mode, we set an event to control when it toggles its mode to edit and therefore, 
                    //the fieldDisplayer in edit mode are created.
                    if(!mode){
                        var fields_disp = field.getAllFieldDisplayers(screens[sc]['@screen']);
                        if(field.mode == "display" && this.payroll)
                            this._fieldPanelToggleMode = document.on('EWS:toggleMode', this._checkToggleMode.bindAsEventListener(this, field));   
                    }
                    else
                        //Case when it's coming from the _checkToggleMode function.
                        var fields_disp = field.getAllFieldDisplayers(screens[sc]['@screen'], '', mode);
                    if(!Object.isEmpty(fields_disp)){
                        var fields_keys = fields_disp.keys();
                        for( var i=0; i<fields_keys.length; i++){
                            var elem = fields_disp.get(fields_keys[i]);
                            //Check if it's a datePicker field
                            if(elem.options.fieldType == "fieldTypeDate"){
                                var elem_dp = elem._moduleInstance;
                                if(elem.options.id.include('BEGDA') || elem.options.id.include('ENDDA')){
                                    var screen = elem.options.screen;
                                    if(!Object.isEmpty(this.retroFutureHash.get(appid + "_" + screen))){
                                        /* Delimiting the datepickers
                                        Saving the datepicker id and the fieldDisplayer. */
                                        this.date_pickers.set( appid + "_" + screen + "_" + elem.options.id, elem);
                                        //Saving the datepicker id and the datepicker event correctDate id.
                                        this.dp_events.set( appid + "_" + screen + "_" + elem.options.id, elem_dp.events.get("correctDate"));
                                    }
                                }
                            }
                        }
                    }
                }
                if(this.payroll && this.dp_events.keys().length > 0)
                    this._setDatePickersObservers(true, appid);
            }
        },
        
        /**
        *@description Disables/Enables datePickers' observers to show an error message when the date selected is between the payroll
        *@param enable, Says if observers will be enabled (true) or not (false)
        *@param appid: appid
        */
        _setDatePickersObservers: function(enable, appid){
            for( var i=0; i < this.dp_events.keys().size(); i++){
                if (enable)
                    Event.observe( document, this.dp_events.get(this.dp_events.keys()[i]), this._checkPayrollPeriod.bindAsEventListener(this, this.dp_events.keys()[i], appid));
                else 
                    Event.stopObserving( document, this.dp_events.get(this.dp_events.keys()[i]));
            }        
        },
        
        /**
        *@description -check if we have to show the message if the date selected in the datepickers is between or before the payroll date.
        *@param id_datepicker: datepicker we want to check
        *@param appid: appid
        */
        _checkPayrollPeriod: function( args, id_datepicker, appid) {
            //Getting the screen of the fieldDisplayer
            var screen = this.date_pickers.get(id_datepicker).options.screen;
            var fuday = (this.payrollHash.get(appid + '_' + screen)[1]).clone();
            fuday.addDays(1);
            //Checking the dates between the payroll & setting as invalid if the date selected is between or before the payroll period
            if( this.date_pickers.get(id_datepicker) && (this.date_pickers.get(id_datepicker)._moduleInstance.actualDate).isBefore(fuday)){            
                var label = global.getLabel("dateBetween") + " " + global.getLabel("FLD_PayrollPeriod").toLowerCase();
                
                //Setting the datepickers with an error
                this.date_pickers.get(id_datepicker)._moduleInstance._setAsError('', false);    
                this.date_pickers.get(id_datepicker).setInvalid.bind(this.date_pickers.get(id_datepicker), "", label).defer();
            }
        },
        
        /**
        *@description Call the setRetroFuture when the fieldpanel is in edit mode
        *@param fieldpanel, fieldpanel to apply in the retroFuture check
        */
        _checkToggleMode: function(args, fieldpanel){
            var appid = getArgs(args).appId;
            var mode = getArgs(args).mode;
            
            //If the fieldpanel is in display mode
            if(mode == 'edit')
                this._setRetroFuture_Payroll(fieldpanel, appid, mode);
        }
});


var MultipleRecordsFieldsPanel = Class.create(SimpleTable, {
    // Private variables
    _json: null,
    _appId: null,
    _event: null,
    _element: null,
    _parentClass: null,
    _fieldsPanels: null,
    _selectedPanel: null,
    // Public variables
    currentlySelected: 0,
    initialize: function($super, options, parentClass, selectedPanel, widScreen) {
        this._selectedPanel = selectedPanel;
        this._json = options.json;
        this._appId = options.appId;
        this._fieldsPanels = new Hash();
        this._widScreen = widScreen;
        //$super();
        this._parentClass = parentClass;
        if (this._json.EWS.o_field_values)
            $super(this.createContent(), {
                typeLink: true
            });
        else
            this._element = '<div style="clear:both;"></div><span>' + options.noResultsHtml + '</span>';
    },

    createContent: function() {
        var tableData = {
            header: [],
            rows: $H()
        };
        var tmpHeader = [];
        var headerIds = new Hash();
        //Getting the header
        this.setLabels();
        $A(this._json.EWS.o_field_settings.yglui_str_wid_fs_record.fs_fields.yglui_str_wid_fs_field).each(function(item) {
            if (item['@fieldtype'] == 'H') {
                tmpHeader.push({
                    text: item['@fieldlabel'] == null ? this.labels.get(item['@fieldid']) : item['@fieldlabel'],
                    id: item['@fieldid'],
                    seqnr: item['@seqnr']
                });
                headerIds.set(item['@fieldid'], item['@seqnr']);
            }
        }.bind(this));
        // Sorting the header by seqnr
        this._sortArray(tmpHeader);
        tableData.header = tmpHeader;
        $A(objectToArray(this._json.EWS.o_field_values.yglui_str_wid_record)).each(function(record, i) {
            var tmpData = [];
            if (this._selectedPanel === i)
                record.contents.yglui_str_wid_content['@selected'] = 'X';
            else
                record.contents.yglui_str_wid_content['@selected'] = '';
            var tmpJson = deepCopy(this._json);
            tmpJson.EWS.o_field_values.yglui_str_wid_record = objectToArray(tmpJson.EWS.o_field_values.yglui_str_wid_record)[i];
            this._sortArray(tmpData);
            var panel = new getContentModule({
                appId: this._appId,
                mode: 'display',
                json: tmpJson,
                //jsonCreateMode: this.createModeJson,
                buttonsHandlers: $H({
                    DEFAULT_EVENT_THROW: 'EWS:pdcChange_' + this.tabId + '_' + appId
                })
            });
            objectToArray(record.contents.yglui_str_wid_content).last().fields.yglui_str_wid_field.each(function(content, j) {
                if (headerIds.get(content['@fieldid']) != undefined) {
                    var auxText = (!Object.isEmpty(content['#text'])) ? content['#text'] : content['@value'];
                    if (!Object.isEmpty(panel.getFieldInfo(content['@fieldid'])) && (panel.getFieldInfo(content['@fieldid'])['@type'] == 'DATS')) {
                        auxText = (!Object.isEmpty(auxText)) ? sapToDisplayFormat(auxText) : '';
                    }
                    tmpData.push({
                        text: auxText != null ? auxText : '',
                        id: '',
                        seqnr: headerIds.get(content['@fieldid'])
                    });
                }
            }.bind(this));
            this._sortArray(tmpData);
            if (!Object.isEmpty(tmpData[0]) && (tmpData[0].text == ''))
                tmpData[0].text = global.getLabel('viewDetails');
            tableData.rows.set('row' + i, {
                data: tmpData,
                element: panel.getElement()
            });
            var index = objectToArray(record.contents.yglui_str_wid_content).last()['@rec_index'];
            this._fieldsPanels.set(index, panel);
            if (!this.currentSelected)
                this.currentSelected = index;
        }.bind(this));
        return tableData;
    },
    setLabels: function() {
        this.labels = new Hash();
        if (!Object.isEmpty(this._json) && !Object.isEmpty(this._json.EWS.labels) && !Object.isEmpty(this._json.EWS.labels.item)) {
            objectToArray(this._json.EWS.labels.item).each(function(label) {
                if (!Object.isEmpty(label['@id']))
                    this.labels.set(label['@id'], label['@value']);
            }.bind(this));
        }
    },
    changeToEditMode: function(panel) {
        this._fieldsPanels.get(panel).changeToEditMode();
        this.currentSelected = panel;
        return this._fieldsPanels.get(panel);
    },
    getCurrentPanel: function(panel) {
        this.currentSelected = panel;
        return this._fieldsPanels.get(panel);
    },
    getFieldPanels: function() {
        return this._fieldsPanels;
    },
    _sortArray: function(array) {
        var k;
        for (var i = 0; i < array.length; i++) {
            k = i;
            for (var j = i + 1; j < array.length; j++) {
                if (parseInt(array[j].seqnr, 10) < parseInt(array[k].seqnr, 10)) {
                    var tmp = array[k];
                    array[k] = array[j];
                    array[j] = tmp;
                    k = j - 1;
                }

            }
        }
        return array;
    },
    getHtml: function() {
        return this.getElement();
    },
    _toggleContentElement: function() {
        var args = $A(arguments);
        args[0].toggle();
        if (args[1].hasClassName('application_verticalR_arrow')) {
            args[1].removeClassName('application_verticalR_arrow');
            args[1].addClassName('application_down_arrow');
        }
        else {
            args[1].removeClassName('application_down_arrow');
            args[1].addClassName('application_verticalR_arrow');
        }
    },
    destroy: function() {
    }
});
