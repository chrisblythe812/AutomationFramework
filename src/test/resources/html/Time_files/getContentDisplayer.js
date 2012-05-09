var getContentDisplayer = Class.create(PFM_parent, {
    getContentService: 'GET_CONTENT2',
    saveRequestService: 'SAVE_REQUEST',
    //cancelButtonCallbackFunction: function() { document.fire('EWS:openApplication', $H({ app: this.prevApp, prevApp: this.appName, refresh: false })) },
    goBackAndRefresh: function() {
        global.goToPreviousApp({ refresh: true });
    },
    showCancelButton: true,

    /*
    *@method initialize
    *@param $super
    *@desc instantiates the app
    */
    initialize: function($super, args) {
        $super(args);
        //this.paiEventBinding = this.paiEventRequest.bindAsEventListener(this);
        this.appName = args.appId;
        this.refreshMap = $H();
        //this.fireEventWhenDefaultValueSet = $H({ SCALE: false });
    },

    /*
    *@method run
    *@param $super
    */
    run: function($super, args) {
        $super();
        //document.observe('EWS:' + this.appName + '_paiEvent', this.paiEventBinding);
        this.fp = null;
        this.json = $H({});
        this.fieldPanelsHash = $H({});
        this.recordsToSave = $A();
        this.originalRecordsToSave = $A();
        this.grArrayMain = $A();
        this.virtualHtml.update('');
        this.modeChanged = false;
        if (getArgs(args).get('objectId'))
            this.objectId = getArgs(args).get('objectId');
        else
            this.objectId = '';
        if (getArgs(args).get('objectName'))
            this.objectName = getArgs(args).get('objectName');
        else
            this.objectName = '';
        if (getArgs(args).get('objectIdRequest'))
            this.objectIdRequest = getArgs(args).get('objectIdRequest');
        else
            this.objectIdRequest = '';
        if (getArgs(args).get('oType'))
            this.oType = getArgs(args).get('oType');
        else
            this.oType = '';
        if (getArgs(args).get('parentType'))
            this.parentType = getArgs(args).get('parentType');
        else
            this.parentType = '';
        if (getArgs(args).get('begda'))
            this.begda = getArgs(args).get('begda');
        else
            this.begda = objectToSap(new Date());
        if (getArgs(args).get('endda'))
            this.endda = getArgs(args).get('endda');
        else
            this.endda = '9999-12-31';
        if (getArgs(args).get('okCode'))
            this.okCode = getArgs(args).get('okCode');
        else
            this.okCode = '';
        if (Object.isEmpty(this.okCode))
            this.okCode = '';
        if (getArgs(args).get('disma'))
            this.disma = getArgs(args).get('disma');
        else
            this.disma = 'D';
        if (getArgs(args).get('tarty'))
            this.tarty = getArgs(args).get('tarty');
        else
            this.tarty = '';
        if (getArgs(args).get('displayMode'))
            this.mode = getArgs(args).get('displayMode');
        else
            this.mode = 'edit';  //3 modes: 'edit', 'display' or 'create' 
        //this.prevApp = getArgs(args).get('prevApp');
        this.tarapId = getArgs(args).get('app').appId;
        this.view = getArgs(args).get('app').view;
        this.buttonsHandlers = getArgs(args).get('buttonsHandlers');
        this.linkTypeHandlers = getArgs(args).get('linkTypeHandlers');
        if (Object.isEmpty(this.buttonsHandlers)) {
            this.buttonsHandlers = $H({
                cancel: function() {
                    this.fp.destroy();
                    global.goToPreviousApp.bind(global);
                } .bind(this),
                paiEvent: this.paiEventRequest.bind(this)
            });
        }
        this.cssClasses = $H();
        this.cssClasses = getArgs(args).get('cssClasses');
        this.setTitle();
        this.getContent();
    },
    /*
    * @method setTitle
    * @desc puts title if needed ( to be implemented in child classes)
    */
    setTitle: function() {

    },
    /*
    * @method getContent
    * @desc it does the ajax request to the getContent service
    */
    getContent: function() {
        var cache = true;
        if (this.refreshMap.get(this.tarapId)) {
            if (this.refreshMap.get(this.tarapId).refresh) {
                cache = false;
                this.refreshMap.get(this.tarapId).refresh = false;
            }
        }
        var xml = "<EWS>"
                  + "<SERVICE>" + this.getContentService + "</SERVICE>"
                  + "<OBJECT TYPE='" + this.parentType + "'>" + this.objectId + "</OBJECT>"
                  + "<PARAM>"
                    + "<APPID>" + this.tarapId + "</APPID>"
                    + "<WID_SCREEN>*</WID_SCREEN>"
                    + "<PERIOD_BEGDA>" + this.begda + "</PERIOD_BEGDA>"
                    + "<PERIOD_ENDDA>" + this.endda + "</PERIOD_ENDDA>"
                    + "<OKCODE>" + this.okCode + "</OKCODE>"
                  + "</PARAM>"
                + "</EWS>";
        this.makeAJAXrequest($H({ xml: xml, successMethod: 'setContent', ajaxID: '', cache: cache }));
    },
    /*
    * @method setContent
    * @desc it receives the answer from the getContent service, from SAP
    */
    setContent: function(answer, refresh) {
        //showing message if there are no results in view actions in a pop up.
        if (this.tarty == 'P' && !answer.EWS.o_field_values) {
            //show message 'No results found'
            var noResultsHtml = "<span class='fieldDispFloatLeft application_main_soft_text'>" + global.getLabel('noResults') + "</span>";
            this.virtualHtml.insert(noResultsHtml);
        } else {
            var groupedLayoutDiv = null;
            if (Object.isEmpty(refresh)) {
                this.answer = answer;
            } else {
                this.fp.destroy();
                this.answer.EWS.o_field_settings = answer.EWS.o_field_settings;
                this.answer.EWS.o_field_values = answer.EWS.o_field_values;
            }
            if (!Object.isEmpty(this.virtualHtml.down('[id=' + this.appName + 'saveMessage]')))
                this.virtualHtml.down('[id=' + this.appName + 'saveMessage]').remove();
            if (this.answer.EWS.o_widget_screens.yglui_str_wid_screen.yglui_str_wid_screen) {
                this.answer.EWS.o_widget_screens.yglui_str_wid_screen = this.answer.EWS.o_widget_screens.yglui_str_wid_screen.yglui_str_wid_screen;
            }
            this.splittedJson = splitBothViews(this.answer);
            this.json = this.answer;
            this.widgetsTotal = this.splittedJson.size();
            for (var i = 0; i < this.widgetsTotal; i++) {
                this.widgetsFlag = this.splittedJson.keys()[i];
                if (!Object.isEmpty(objectToArray(this.answer.EWS.o_widget_screens.yglui_str_wid_screen)[i]['@table_mode'])) {
                    // table mode                
                    if (this.mode != 'create') {
                        groupedLayoutDiv = this.drawTable();
                        this.linkButtonsTable();
                    }
                    this.answer.EWS.o_widget_screens.yglui_str_wid_screen[i]['@secondary'] = 'hiddenTM';
                }
            }
            this.fp = new getContentModule({
                mode: this.mode,
                json: this.json,
                appId: this.appName,
                jsonCreateMode: this.jsonEmptyScreens,
                showCancelButton: this.showCancelButton,
                buttonsHandlers: this.buttonsHandlers,
                linkTypeHandlers: this.linkTypeHandlers,
                cssClasses: this.cssClasses,
                showButtons: $H({
                    edit: true,
                    display: false,
                    create: true
                }),
                objectId: this.objectId,
                objectName: this.objectName,
                objectType: this.parentType,
                hideButtonsOnEdit: false,
                hideButtonsOnCreate: false,
                fieldDisplayerModified: 'EWS:' + this.appName + '_' + this.view
            });
            this.virtualHtml.insert(this.fp.getHtml());
            if (this.virtualHtml.down("[id=applicationsLayerButtons]"))
                this.virtualHtml.down("[id=applicationsLayerButtons]").insert({ before: groupedLayoutDiv });
            else
                this.virtualHtml.insert(groupedLayoutDiv);
            this.virtualHtml.insert("<div id='" + this.appName + "saveMessage' class='application_main_soft_text PFM_ShowDocsSaveChanges'>" + global.getLabel('saveMessage') + "</div>");
            this.fp.setFocus();
            //hide the message
            this.toggleSaveChangesMessage(false);
            //this.linkButtons();
        }
    },
    linkButtons: function() {
        //TO BE OVERWRITEN IN EACH GETCONTENTDISPLAYER INSTANCE
    },
    /*
    * @method toggleMode
    * @desc changes the mode into the one passed as parameter
    */
    toggleMode: function(mode) {
        if (this.fp)
            this.fp.destroy();
        this.mode = mode;
        this.getContent();
    },
    /*
    * @method drawTable
    * @desc draw the table in other widget
    */
    drawTable: function() {
        //display screen buttons
        this.link = '';
        if (!Object.isEmpty(this.json.EWS.o_screen_buttons)) {
            var buttons = objectToArray(this.json.EWS.o_screen_buttons.yglui_str_wid_button);
            for (var j = 0; j < buttons.length; j++) {
                if (buttons[j]['@screen'] == this.widgetsFlag) {
                    if ((this.mode != 'display') || (this.mode == 'display' && !Object.isEmpty(buttons[j]['@okcode']) && buttons[j]['@okcode'] != 'INS' && buttons[j]['@okcode'] != 'MOD'))// no insert buttons when display mode
                    //this.link += "<span id='" + this.appName + "_" + buttons[j]['@action'] + "' style='float:right;' class='application_action_link'>" + buttons[j]['@label_tag'] + "</span><br>";
                        var json = {
                            elements: []
                        };
                    var button = {
                        idButton: this.appName + "_" + buttons[j]['@action'],
                        label: buttons[j]['@label_tag'],
                        handlerContext: null,
                        className: 'application_action_link',
                        type: 'link',
                        standardButton: true,
                        toolTip: buttons[j]['@label_tag']
                    };
                    json.elements.push(button);
                }
            }
        }
        //make a hash for the table screen
        var screens = objectToArray(this.json.EWS.o_widget_screens.yglui_str_wid_screen);
        var screensStructure = new Hash();
        var screensStructure = splitInScreensGL(this.json);
        this.appId = screensStructure.get(screensStructure.keys()[0]).appId;
        if (this.json.EWS.o_field_values) {
            //transform to groupedLayout json
            var isGroupedArray = objectToArray(screensStructure.get(this.widgetsFlag).headers.fs_fields.yglui_str_wid_fs_field);
            var isGrouped = false;
            for (var b = 0; b < isGroupedArray.length && !isGrouped; b++) {
                if (isGroupedArray[b]['@fieldtype'] == 'G')
                    isGrouped = true;
            }
            var newJson;
            newJson = this.getContentToGroupedLayout(screensStructure.get(this.widgetsFlag), isGrouped, 0);
            //we create the content of the widget
            var divContainerTable = new Element('div', {
                'id': 'PFM_containerTable' + 0 + '_' + this.appId
            });
            var divEmptyJson = new Element('div', {
                'class': 'FWK_EmptyDiv'
            });
            var elementToDisplayWidget = new Element('div', {
                'id': this.tarapId + '_' + this.objectId + 'widget_' + this.widgetsFlag,
                'class': 'gCatalog_WidgetClass fieldDispTotalWidth fieldClearBoth'
            });
            var divToDisplayButtons = new Element('div', {
                'id': 'PFM_contentButton_' + 0 + '_' + this.appId
            });
            var divToDisplayAll = new Element('div', {
                'id': 'PFM_contentAll_' + 0 + '_' + this.appId,
                'class': 'getContentWidgetTableMode fieldDispTotalWidth fieldDispFloatLeft fieldClearBoth'
            });
            this.virtualHtml.insert(divToDisplayAll);
            //we insert the div that is going to content the table and the empty div
            elementToDisplayWidget.update(divContainerTable);
            //action link
            //divToDisplayButtons.update(this.link);
            var Buttons = new megaButtonDisplayer(json);
            divToDisplayButtons.update(Buttons.getButtons());
            divToDisplayButtons.addClassName('fieldDispFloatRight');
            elementToDisplayWidget.insert(divToDisplayButtons);
            elementToDisplayWidget.insert(divEmptyJson);
            //we insert the main div in the widget
            divToDisplayAll.insert(elementToDisplayWidget);
            var title = global.getLabel(screensStructure.get(this.widgetsFlag).label);
            var objOptions = $H({
                title: title,
                events: $H({ onToggle: 'EWS:myWidgetToggle' }),
                collapseBut: true,
                contentHTML: elementToDisplayWidget,
                onLoadCollapse: false,
                targetDiv: 'PFM_contentAll_' + 0 + '_' + this.appId
            });
            //we create the widget
            var glWidget = new unmWidget(objOptions);
            //we insert the content of the table
            this.grArrayMain.push(new groupedLayout(newJson, divContainerTable, isGrouped));
            this.grArrayMain[0].buildGroupLayout();
            return divToDisplayAll;
        }
    },
    /*
    * @method saveRequest
    * @desc called when the user clicks on create or modify button
    */
    saveRequest: function(action, labelTag, jsonParameter, recIndex, screen) {
        //relatPRemove.js is a popup to remove an assignment in resourceCat
        if (this.view != "relatPRemove") {
            var status = this.fp.validateForm(screen, recIndex);
        } else {
            var status = {};
            status.correctForm = true;
        }
        if (status.correctForm == true) {
            if (Object.isEmpty(jsonParameter))
                jsonParameter = this.json;
            var action = (!Object.isEmpty(action)) ? action : "";
            var labelTag = (!Object.isEmpty(labelTag)) ? labelTag : "";
            var fieldsRequest = '';
            if (Object.isEmpty(jsonParameter.tableMode)) {//not table mode
                if (this.mode.toLowerCase() == 'create' || this.modeChanged) {//new object
                    var values = jsonParameter.EWS.o_field_values;

                    objectToArray(values.yglui_str_wid_record).each(function(record) {
                        objectToArray(record.contents.yglui_str_wid_content.fields.yglui_str_wid_field).each(function(field) {
                            var fieldValue = field['@value'];
                            if (!Object.isEmpty(field['@value']) && Object.isString(field['@value'])){
                                field['@value'].gsub(" ", "");
                                field['@value'] = prepareTextToSend(field['@value']);                            
                            }
                            if (Object.isEmpty(fieldValue) && field['@fieldtechname'] && field['@fieldtechname'].toLowerCase() == 'endda') {
                                field['@value'] = '9999-12-31';
                            }
                            if (this.saveRequestService != "SAVE_LEARN") {
                                if (Object.isEmpty(fieldValue) && !Object.isEmpty(this.objectId) && field['@fieldtechname'] && (field['@fieldtechname'].toLowerCase() == 'sobid') && field['@fieldid'] != 'COSTCENTER' && field['@fieldid'] != 'SOBID_O_HEAD' && field['@fieldid'] != 'JOB') {
                                    field['@value'] = this.objectId;
                                }
                                if (Object.isEmpty(fieldValue) && !Object.isEmpty(this.parentType) && field['@fieldtechname'] && (field['@fieldtechname'].toLowerCase() == 'sclas')) {
                                    field['@value'] = this.parentType;
                                }
                            }
                        } .bind(this))
                    } .bind(this))

                    var objectTree = new XML.ObjTree();
                    objectTree.attr_prefix = '@';
                    fieldsInput = objectTree.writeXML(values);
                    if (fieldsInput.indexOf('?>') > -1) {
                        fieldsRequest += fieldsInput.substr(fieldsInput.indexOf('?>') + 3);
                    }
                } else {
                    if (Object.isEmpty(jsonParameter.tableMode) && (Object.isEmpty(jsonParameter.EWS.o_field_values) || !jsonParameter.EWS.o_field_values.yglui_str_wid_record))
                        jsonParameter.EWS.o_field_values = jsonParameterEmptyScreens.EWS.o_field_values;
                    if (Object.isEmpty(jsonParameter.tableMode) && !Object.isEmpty(jsonParameter.EWS.o_field_values) && jsonParameter.EWS.o_field_values.yglui_str_wid_record) {
                        for (var i = 0; i < objectToArray(jsonParameter.EWS.o_field_values.yglui_str_wid_record).length; i++) {
                            var record = objectToArray(jsonParameter.EWS.o_field_values.yglui_str_wid_record);
                            var recKey = !Object.isEmpty(record[i]['@rec_key']) ? record[i]['@rec_key'] : "";
                            var keyStr = !Object.isEmpty(record[i].contents.yglui_str_wid_content['@key_str']) ? record[i].contents.yglui_str_wid_content['@key_str'] : "";
                            //if (record[i]["@rec_key"] == recKey || Object.isEmpty(recKey)) {
                            var screen = record[i]["@screen"];
                            var tcontentsXml = "";
                            var tcontents = "";
                            for (var j = 0; j < objectToArray(objectToArray(jsonParameter.EWS.o_field_values.yglui_str_wid_record)[i].contents.yglui_str_wid_content).length; j++) {
                                if (objectToArray(objectToArray(jsonParameter.EWS.o_field_values.yglui_str_wid_record)[i].contents.yglui_str_wid_content)[j]["@key_str"] == keyStr || Object.isEmpty(keyStr)) {
                                    rec = objectToArray(objectToArray(jsonParameter.EWS.o_field_values.yglui_str_wid_record)[i].contents.yglui_str_wid_content)[j]["@rec_index"];
                                    var contentFields = objectToArray(objectToArray(jsonParameter.EWS.o_field_values.yglui_str_wid_record)[i].contents.yglui_str_wid_content)[j].fields;
                                    var tcontentFields = objectToArray(objectToArray(jsonParameter.EWS.o_field_values.yglui_str_wid_record)[i].contents.yglui_str_wid_content)[j].tcontents
                                    if (!Object.isEmpty(tcontentFields) && tcontentFields.yglui_str_wid_tcontent) {
                                        var tcontents_tcontent = objectToArray(tcontentFields)
                                        tcontents_tcontent.each(function(oneTcontent) {
                                            if (!Object.isEmpty(oneTcontent.yglui_str_wid_tcontent)) {
                                                var objTree = new XML.ObjTree();
                                                objTree.attr_prefix = '@';
                                                var oneTcontentFields = objTree.writeXML(oneTcontent);
                                                tcontentsXml += oneTcontentFields.substr(oneTcontentFields.indexOf('?>') + 3);
                                            }
                                        } .bind(this));
                                    }
                                    var objTree = new XML.ObjTree();
                                    objTree.attr_prefix = '@';
                                    var fields = objTree.writeXML(contentFields);
                                    if (!Object.isEmpty(tcontentsXml))
                                        tcontentsXml = "<TCONTENTS>" + tcontentsXml + "</TCONTENTS>";
                                    if (fields.indexOf('?>') > -1) {
                                        fieldsRequest += '<YGLUI_STR_WID_RECORD REC_KEY="' + recKey + '" SCREEN="' + screen + '">' +
                                                                '<CONTENTS>' +
                                                                    '<YGLUI_STR_WID_CONTENT KEY_STR="' + keyStr + '" REC_INDEX="' + rec + '" SELECTED="" TCONTENTS="">' +
                                                                        '<FIELDS>' +
                                                                            fields.substr(fields.indexOf('?>') + 3) +
                                                                        '</FIELDS>' +
                                                                        tcontentsXml;
                                        fieldsRequest += '</YGLUI_STR_WID_CONTENT>' +
                                                                '</CONTENTS>' +
                                                            '</YGLUI_STR_WID_RECORD>';
                                    }
                                }
                            }
                            //}
                        }
                    }
                }
            }
            if (this.recordsToSave.length > 0) {//table mode
                this.saveRequestTableMode();
            } else {
                var ans = '';
                this.saveRequestTableModeAnswer(ans);
            }
            if (Object.isEmpty(this.objectIdRequest)) {
                if (this.mode.toLowerCase() == 'create' || this.modeChanged) {//new object
                    this.objectIdRequest = '';
                } else {
                    this.objectIdRequest = this.objectId;
                }
            }
            if (fieldsRequest.length > 0) {
                this.refreshMap.set(this.tarapId, { refresh: true });

                //Here, we take the okCode of the pushed button
                var notFind = true;
                arrayButtons = objectToArray(jsonParameter.EWS.o_screen_buttons);
                for (var u = 0; u < arrayButtons.length && notFind; u++) {
                    arrayButtonsDeep = objectToArray(arrayButtons[u].yglui_str_wid_button);
                    for (var t = 0; t < arrayButtonsDeep.length && notFind; t++) {
                        if (arrayButtonsDeep[t]['@action'] == action) {
                            var okCode = arrayButtonsDeep[t]['@okcode'];
                            notFind = false;
                        }
                    }
                }
                if (Object.isEmpty(okCode))
                    var okCode = this.okCode;

                var xml = '<EWS>' +
                            '<SERVICE>' + this.saveRequestService + '</SERVICE>' +
                            '<OBJECT TYPE="' + this.oType + '">' + this.objectIdRequest + '</OBJECT>' +
                            '<PARAM>' +
                                '<APPID>' + this.tarapId + '</APPID>';
                xml += '<RECORDS>' +
                                    fieldsRequest +
                                '</RECORDS>' +
                                '<BUTTON ACTION="' + action + '" LABEL_TAG="' + labelTag + '" OKCODE="' + okCode + '" />' +
                            '</PARAM>' +
                            '<DEL></DEL>' +
                         '</EWS>';
                this.makeAJAXrequest($H({ xml: xml, successMethod: 'saveRequestAnswer', errorMethod: 'errorRequestAnswer' }));
            }
        }
    },
    /*
    * @method saveRequestAnswer
    * @desc answer from SAP when a saving request has been done
    */
    saveRequestAnswer: function(answer) {
        this.goBackAndRefresh();
        //show message from sap
        if(Object.isString(answer) || !Object.isEmpty(answer.EWS.webmessage_text))
            this._infoMethod(answer);
    },
    /*
    * @method errorRequestAnswer
    * @desc answer from SAP when a saving request has not been done
    */
    errorRequestAnswer: function(answer) {
        this._errorMethod(answer);
    },
    saveRequestTableMode: function(args) {
        //create the json (xml_in)
        var jsonToSend = {
            EWS: {
                SERVICE: 'SAVE_REQUEST',
                OBJECT: {
                    TYPE: this.oType,
                    TEXT: this.objectId
                },
                PARAM: {
                    APPID: this.appName,
                    RECORDS: { YGLUI_STR_WID_RECORD: $A() },
                    BUTTON: { "@action": '',
                        "@busid": '',
                        "@disma": '',
                        "@label_tag": '',
                        "@okcode": 'INS',
                        "@screen": '',
                        "@status": '',
                        "@tarap": '',
                        "@tarty": '',
                        "@type": ''
                    }
                }
            }
        };
        //insert the records to save
        objectToArray(this.recordsToSave).each(function(record) {
            //remove fake key_strs
            if (record.contents.yglui_str_wid_content['@key_str'].startsWith('_'))
                record.contents.yglui_str_wid_content['@key_str'] = '';
            jsonToSend.EWS.PARAM.RECORDS.YGLUI_STR_WID_RECORD.push(record);
        });
        //transform the xml
        var json2xml = new XML.ObjTree();
        json2xml.attr_prefix = '@';
        this.makeAJAXrequest($H({
            xml: json2xml.writeXML(jsonToSend),
            successMethod: 'saveRequestTableModeAnswer',
            errorMethod: 'processErrorToSaveContent'
        }));
    },
    saveRequestTableModeAnswer: function(response) {
        if (response != '') {
            var valueOfError = response.EWS.webmessage_type;
            if (valueOfError != 'E') {
                this.recordsToSave = $A();
                //hide the message
                this.toggleSaveChangesMessage(false);
                this.goBackAndRefresh();
            }
        }
    },
    paiEventRequest: function(args) {
        var arguments = getArgs(args);
        var servicePai = arguments.servicePai;
        var fieldId = arguments.fieldId;
        var appId = arguments.appId;
        this.screenPai = arguments.screen;
        var jsonToSend = {
            EWS: {
                SERVICE: servicePai,
                OBJECT: {
                    TYPE: this.parentType,
                    TEXT: this.objectId
                },
                PARAM: {
                    appid: appId,
                    i_field: fieldId,
                    o_field_settings: this.json.EWS.o_field_settings,
                    o_field_values: this.json.EWS.o_field_values
                }
            }
        };
        if (this.mode == 'create') {
            this.mode = 'edit';
            this.modeChanged = true;
        }
        var json2xml = new XML.ObjTree();
        json2xml.attr_prefix = '@';
        this.makeAJAXrequest($H({
            xml: json2xml.writeXML(jsonToSend),
            successMethod: 'setContent',
            ajaxID: this.appName + '_refresh'
        }));
    },
    /*
    * @method linkButtonsTable
    * @desc called to handle buttons in 'table mode' screen
    */
    linkButtonsTable: function() {
    },
    /*
    * @method close
    * @desc called when the application is not shown.
    */
    close: function($super) {
        $super();
        if (!Object.isEmpty(this.fp))
            this.fp.destroy();
        document.stopObserving('EWS:' + this.appName + '_paiEvent', this.paiEventBinding);
    }
});