/**
 *@fileOverview parentPFM.js
 *@description It contains a general parent class for PFM applications
 */
/**
 *@constructor
 *@description Class with general functionality for PFM applications
 *@augments Application
 */
var PFM_parent = Class.create(Application, 
    /**
    *@lends PFM_Parent
    */
{
    /** 
    * Hash with info about elements' details
    * @type Hash
    */        
    detailsHash: new Hash(),
    /** 
    * Hash with info about elements' details in fieldPanel
    * @type Hash
    */      
    fieldPanelsHash: new Hash(),
    /** 
    * Div with the message 'please save your changes' needed when the user modifies something
    * @type DOM
    */     
    saveChangesMessage: null,
    /** 
    * Pop up window opened when editing or adding elements
    * @type DOM
    */     
    editWindow: null,
    /** 
    * Array where we keep the previous records to save when editing/ adding, so if the user cancels, we can go back
    * @type Array
    */     
    originalRecordsToSave: new Array(),
    /** 
    * Array where we keep the records which have to be added to the json, so when reloading the GL, we see the element added
    * @type Array
    */      
    recordsToAddInJson: new Hash(),
    
    partAppraisersJson : "",
    
    /**
     *@param $super The superclass (PFM_Parent)
     *@param args The app
     *@description Instantiates the app
     */  
    initialize: function($super, args) {
        $super(args);
        this.noPicture = 'user.jpg';
        this.getPictureService = 'GET_PICTURE';	        
        this.stopObservingChangesInPopUpBinding = this.stopObservingChangesInPopUp.bindAsEventListener(this);
        this.viedetailsBinding = this.viewDetailsRequest.bindAsEventListener(this);
        this.deleteBinding = this.deleteRequest.bindAsEventListener(this);
        this.editElementBinding = this.editElement.bindAsEventListener(this);
        this.setReloadBinding = this.setReload.bindAsEventListener(this);
        this.paiFieldChangedBinding = this.paiFieldChanged.bindAsEventListener(this);
        //this.fireEventWhenDefaultValueSet = $H({PROFCY : false});
    },
    /**
    * @param args The app
    * @param $super The superclass run method
    *@description Executes the super class run method    
    */
    run: function($super, args) {
        $super(args);
        if (args) {
            this.empId = args.get('empId');
        }
        this.reloadFlag = false;
        this.callPai = false;      
        document.observe('EWS:PFM_rowAction_viewDetails', this.viedetailsBinding);
        document.observe('EWS:PFM_doc_popUpClosed', this.stopObservingChangesInPopUpBinding);
        document.observe('EWS:PFM_rowAction_delete', this.deleteBinding);
        document.observe('EWS:PFM_rowAction_edit', this.editElementBinding);
        document.observe('EWS:PFM_popUp_servicePai', this.paiFieldChangedBinding);
        
    },
    /**
     *@param $super The superclass: PFM_Parent
     *@description Closes the application
     */	 
    close: function($super) {
        $super();
        document.stopObserving('EWS:PFM_doc_popUpClosed', this.stopObservingChangesInPopUpBinding);
        document.stopObserving('EWS:PFM_rowAction_viewDetails', this.viedetailsBinding);
        document.stopObserving('EWS:PFM_rowAction_edit', this.editElementBinding);
        document.stopObserving('EWS:PFM_rowAction_delete', this.deleteBinding);
        document.stopObserving('EWS:PFM_popUp_servicePai', this.paiFieldChangedBinding);
    },   
    /**
    * @description we create the Dom where we're going to insert the job profiles for the user
    */
    createHtml: function() {
        //create the div for the LEGEND
        this.PFM_appLegend = new Element('div', {
            'id': 'PFM_legendDiv_' + this.appId,
            'class': 'PFM_Legend'
        });
        //insert the html structure
        this.virtualHtml.update(this.PFM_appLegend);
        this.virtualHtml.insert("<div id='PFM_getContent_" + this.appId + "' class='PFM_ContainerClass'></div>"+
                                "<div id='PFM_saveMessage'></div><div id='PFM_generalButtons'></div>");
        this.virtualHtml.down("<div#PFM_legendDiv_" + this.appId).hide();
        //creating top menu
        var topMenu = new Element('div',{'class':''});
        this.virtualHtml.down('[id=PFM_legendDiv_' + this.appId + ']').insert(topMenu);    
        //menu links
        var json = {
            elements: []
        };
        //expand all nodes
        var expandLabel = {
            label: global.getLabel('PFM_Expand_All'),
            handlerContext: null,
            handler: this.expandAll.bind(this,'PFM_WidgDiv'),
            type: 'link',
            idButton: 'topMenu_ExpandLabel',
            className: 'application_action_link getContentLinks'
        };
        json.elements.push(expandLabel);
        //collapse all nodes       
        var collapseLabel = {
            label: global.getLabel('PFM_Collapse_All'),
            handlerContext: null,
            handler: this.collapseAll.bind(this,'PFM_WidgDiv'),
            type: 'link',
            idButton: 'topMenu_CollapseLabel',
            className: 'application_action_link getContentLinks'
        };
        json.elements.push(collapseLabel);   
        // create megabuttons
        this.showDocsTopButtons = new megaButtonDisplayer(json);     
        topMenu.insert(this.showDocsTopButtons.getButtons());                       
        //view legend link                                    
        var legendJSON = {
            legend: [
                { img: "application_emptyBubble", text: global.getLabel('notDone') , code:'\u25cb'},
                { img: "application_icon_green", text: global.getLabel('completed'), code:'\u25cf'  },
                { img: "application_icon_orange", text: global.getLabel('warning'), code:'\u25b2' },
                { img: "application_rating_currentWarning", text: global.getLabel('cLlower'), code:'\u25a0' },
                { img: "application_rating_currentOk", text: global.getLabel('cLiqualsOrBetter'), code:'\u25a0' },
                { img: "application_rating_possible", text: global.getLabel('possibleLvl') , code:'\u25a1\u25a1\u25a1\u25a1\u25a1'},
                { img: "application_rating_required", text: global.getLabel('reqLevel') , code:'\u25ac'}

            ],
            showLabel: global.getLabel('showLgnd'),
            hideLabel: global.getLabel('closeLgnd')
        };
        var legendHTML = getLegend(legendJSON);
        topMenu.insert(legendHTML);   
        this.virtualHtml.down('div#'+legendHTML.id);                 
        //creating save message
        if (Object.isEmpty(this.virtualHtml.down('div#' + this.appName + 'saveMessage'))) {
            this.virtualHtml.down('[id=PFM_saveMessage]').update("<div id='" + this.appName + "saveMessage' class='application_main_soft_text PFM_ShowDocsSaveChanges'>" + global.getLabel('saveMessage') + "</div>");
        }
        //hide the message
        this.toggleSaveChangesMessage(false);
    },
    collapseAll: function(divId) {
        var pfmWidgets = this.virtualHtml.select('div.'+divId);    
        for (var i = 0; i < pfmWidgets.length; i++) {        
            var arrows = pfmWidgets[i].select('.group_module_arrowD_margin');
            for (var j = arrows.length - 1; j >= 0; j--) {
                arrows[j].fire('EWS:toggleRow');
            }
        }
    },
    expandAll:function(divId) {
        var pfmWidgets = this.virtualHtml.select('div.'+divId);    
        for (var i = 0; i < pfmWidgets.length; i++) {
            var arrows = pfmWidgets[i].select('.group_module_arrowR_margin');
            for (var j = 0; j < arrows.length; j++) {
                arrows[j].fire('EWS:toggleRow');
            }    
        }         
    },   
  
    /**
    * Toggles the save changes message on or off. When no parameters given
    * it works like the Prototype toggle function. When forceShow is true
    * it works as a Prototype's show() method, when it's false it works
    * like Prototypes hide() method.
    * @param forceShow {Boolean} whether to show, hide the message or just
    * toggle it
    */
    toggleSaveChangesMessage: function(forceShow) {
        var noForce = Object.isUndefined(forceShow);
        this.saveChangesMessage = this.virtualHtml.down("div#" + this.appName + "saveMessage");
        if (noForce) {
            this.saveChangesMessage.toggle();
        } else if (forceShow) {
            this.saveChangesMessage.show();
        } else if (!forceShow) {
            this.saveChangesMessage.hide();
        }
    },
    /**
    * @description Checks if a group of elements is empty or not
    * @param Array {Array} Array with the elements
    */    
    checkEmpty: function(array) {
        //changing "each" by "for"
//        array.each(function(element) {
//            if (Object.isEmpty(element))
//                return false;
//        });        
        for (var i = 0; i<array.length; i++){
            if (Object.isEmpty(array[i]))
                return false;                    
        }
        return true;
    },
    /**
    * @description Checks if a certain parts in a json are empty
    * @param object {json} The json object
    * @param properties {string} The properties we want to check
    */       
    checkJson: function(object, properties) {
        if (!Object.isEmpty(object)) {
            if (!Object.isEmpty(properties)) {
                //changing "each" by "for"
//                objectToArray(properties).each(function(element) {
//                    if (!(element in object)) {
//                        return { obj: null, answer: false };
//                    } else { object = object[element]; }
//                } .bind(this));                
                var propArray = objectToArray(properties);
                for(var i=0; i<propArray.length;i++){
                    if (!(propArray[i] in object)) {
                        return { obj: null, answer: false };
                    } else { object = object[propArray[i]]; }                
                }
            } else { return { obj: null, answer: false }; }
        } else { return { obj: null, answer: false }; }
        return { obj: object, answer: true };
    },
    /**
    * @description Checks if an element is a column in the table
    * @param object {json} The definition of the column
    */    
    isColumn: function(columnDef) {
        var bool = (!Object.isEmpty(columnDef) && !Object.isEmpty(columnDef['@display_attrib']) && (columnDef['@display_attrib'].toLowerCase() != 'hid')) ? true : false;
        return bool;
    },
    /**
    * @description Depending on the the field setting of a field, takes the label from one or another place
    * @param fieldId The field id
    * @param labelType Specifies if the label is in labelValue or not
    * @param labelValue Either the label, or nothing 
    */     
    chooseLabel: function(fieldId, labelType, labelValue) {            
        var ret = '';
        if (!Object.isEmpty(labelType))
            labelType = labelType.toLowerCase();
        switch (labelType) {
            //If the @label_type setting is 'N' --> No label.                                                                                                                        
            case 'n':
                ret = "";
                break;
            //If the @label_type setting is 'V' --> Label from the settings                                                                                                                        
            case 'v':
                ret = (!Object.isEmpty(labelValue)) ? prepareTextToShow(labelValue) : '';
                break;
            //If no @label_type setting --> Label from the get_content JSON labels node, and if that does not exist, then from global                                                                                                                        
            case "":
            default:
                ret = (!Object.isEmpty(this.labels.get(fieldId))) ? this.labels.get(fieldId) : global.getLabel(fieldId);
                break;
        }
        return ret;            
    },
    /**
    * @description Depending on the the field setting of a field, takes the content from one or another place
    * @param value The field value
    * @param text The field text
    * @param showText Specifies how to show the content
    */     
    chooseValue: function(value, text, showText) {
        var value = (!Object.isEmpty(value)) ? prepareTextToEdit(value) : '';
        var text = (!Object.isEmpty(text)) ? prepareTextToEdit(text) : '';
        if (!Object.isEmpty(showText) && (showText.toLowerCase() == 'x'))
            return text;
        else if (!Object.isEmpty(showText) && (showText.toLowerCase() == 'b'))
            return text + ' ' + global.idSeparators.toArray()[0] + value + global.idSeparators.toArray()[1];
        else if (!Object.isEmpty(showText) && (showText.toLowerCase() == 'i'))
            return text;
        else
            return value;
    },
    /**
    * @description Event launched when a PAI field is changed
    * @param args Data about the field which changed
    */  
    paiFieldChanged: function(args){
        this.callPai = true;
        var arguments = getArgs(args);
        this.servicePai = arguments.servicePai;
        var rowsArray = objectToArray(this.json.EWS.o_field_values.yglui_str_wid_record);
        for (var i = 0; i < rowsArray.length; i++) {
        	if (rowsArray[i].contents.yglui_str_wid_content['@rec_index'] == arguments.record) {
        		var fields = objectToArray(rowsArray[i].contents.yglui_str_wid_content.fields.yglui_str_wid_field);
        		for (var det = 0; det < fields.length; det++) {
        			if (fields[det]['@fieldid'] == 'OBJID') {
        				var compModified = fields[det]['@value'];
        			}
        		}
        	}
        }
        for (var i = 0; i < rowsArray.length; i++) {
        	if (rowsArray[i]['@screen'] == arguments.screen) {
        		fields = objectToArray(rowsArray[i].contents.yglui_str_wid_content.fields.yglui_str_wid_field);
        		for (var det = 0; det < fields.length; det++) {
        			if (fields[det]['@fieldid'] == 'OBJID' && (compModified == fields[det]['@value'])) {
        				for (var j = 0; j < fields.length; j++) {
        					if (fields[j]['@fieldid'] == arguments.fieldId)
        						fields[j]['@value'] = arguments.currentValue.id;
        				}
        			}
        		}
        	}
		}
    },
    /**
    * @description Calls sap with a PAI service, in order to refresh some fields without saving anything.
    */
    paiEventRequest: function() {
        this.callPai = false;   
        this.toggleSaveChangesMessage(true);   
        //construct the json   
        var jsonToSend = {
            EWS: {
                SERVICE: this.servicePai,
                OBJECT: {
                    TYPE: 'P',
                    TEXT: this.empId
                },
                PARAM: {
                    o_field_settings: this.json.EWS.o_field_settings,
                    o_field_values: this.json.EWS.o_field_values
                }
            }
        }; 
        //transform to xml
        var json2xml = new XML.ObjTree();
        json2xml.attr_prefix = '@';
        this.makeAJAXrequest($H({
            xml: json2xml.writeXML(jsonToSend),
            successMethod: 'processCallToGetContent',
            ajaxID: this.appName + '_refresh'
        }));
    }, 
    /**
    * @description Construct the xml needed to call to the service get_content
    * @param appId {String} appId needed. It depends on the child application
    */  
    callToGetContent: function(appId) {
        var xmlToGetDevPlan = "<EWS>" +
	                     "<SERVICE>GET_CONTENT2</SERVICE>" +
	                     "<OBJECT TYPE='P'>" + this.empId + "</OBJECT>" +
	                     "<PARAM>" +
	                         "<APPID>" + appId + "</APPID>" +
	                         "<WID_SCREEN>*</WID_SCREEN>" +
	                     "</PARAM>" +
	                 "</EWS>";
        this.makeAJAXrequest($H({ xml: xmlToGetDevPlan, successMethod: 'processCallToGetContent' }));
    },
    /**
    * @description Process the response of 'getcontent' service and builds the widget, tables & buttos in the screen
    * @param json {Json} Retrieved json from the service
    * @param refresh {String} If we receive the 'refresh' argument, then it means we come from a PAI request
    */ 
    processCallToGetContent: function(json,refresh) {
        //check if we come from get_content or PAI
        if (Object.isEmpty(refresh)) {
            //GET CONTENT
            this.json = json;
            //remove the doble node yglui_str_wid_screen
            if(this.json.EWS.o_widget_screens.yglui_str_wid_screen.yglui_str_wid_screen){
                this.json.EWS.o_widget_screens.yglui_str_wid_screen = this.json.EWS.o_widget_screens.yglui_str_wid_screen.yglui_str_wid_screen;
            }            
        }
        else {
            //PAI
            //replace this.json with the new values
            this.json.EWS.o_field_settings = json.EWS.o_field_settings;
            this.json.EWS.o_field_values = json.EWS.o_field_values;  
            this.grArrayMain = $A();    
            //replace this.recordsToSave with the new values
            var paiRows = objectToArray(json.EWS.o_field_values.yglui_str_wid_record);
            for (var t=0;t<this.recordsToSave.length;t++){
                for(var u=0;u<paiRows.length;u++){
                    if(paiRows[u].contents.yglui_str_wid_content['@key_str'] == this.recordsToSave[t].contents.yglui_str_wid_content['@key_str']){
                        this.recordsToSave[t].contents.yglui_str_wid_content.fields = deepCopy(paiRows[u].contents.yglui_str_wid_content.fields);
                    }
                }                
            }        
        }    
        //BUILD EVERYTHING    
        var buttonsFromJson = this.json.EWS.o_screen_buttons.yglui_str_wid_button;
        //separate record
        var screensStructure = splitInScreensGL(this.json);
        var appId = screensStructure.get(screensStructure.keys()[0]).appId;
        for (var a = 0; a < screensStructure.keys().length; a++) {
            //transform to groupedLayout json
            var isGroupedArray = objectToArray(screensStructure.get(screensStructure.keys()[a]).headers.fs_fields.yglui_str_wid_fs_field);
            var isGrouped = false;
            for (var b = 0; b < isGroupedArray.length && !isGrouped; b++) {
                if (isGroupedArray[b]['@fieldtype'] == 'G')
                    isGrouped = true;
            }
            var newJson;
            newJson = this.getContentToGroupedLayout(screensStructure.get(screensStructure.keys()[a]), isGrouped, a);
            var actualWidget = screensStructure.get(screensStructure.keys()[a]).headers['@screen'];

            //we create the content of the widget
            var divContainerTable = new Element('div', {
                'id': 'PFM_containerTable' + a + '_' + appId
            });
            var divEmptyJson = new Element('div', {
                'class': 'FWK_EmptyDiv'
            });
            var elementToDisplayWidget = new Element('div', {
                'id': 'PFM_widget_' + a + '_' + appId,
                'class': 'PFM_WidgDiv'
            });
            var divToDisplayButtons = new Element('div', {
                'id': 'PFM_contentButton_' + a + '_' + appId
            });
            var divToDisplayAll = new Element('div', {
                'id': 'PFM_contentAll_' + a + '_' + appId,
                'class': 'PFM_WidgetClass'
            });
            this.virtualHtml.down('div#PFM_getContent_' + appId).insert(divToDisplayAll);
            //we insert the div that is going to content the table and the empty div
            elementToDisplayWidget.update(divContainerTable);
            for (var b = 0; b < buttonsFromJson.length; b++) {
                if (buttonsFromJson[b]['@screen'] == actualWidget) {
                    if (buttonsFromJson[b]['@tarap'] == 'CQK_QK2') {
                        //create button with handler
                        var aux = {
                            idButton: buttonsFromJson[b]['@action'],
                            label: (!Object.isEmpty(this.labels.get(buttonsFromJson[b]['@label_tag']))) ? this.labels.get(buttonsFromJson[b]['@label_tag']) : global.getLabel(buttonsFromJson[b]['@label_tag']),                                           
                            className: 'application_action_link PFM_AlignLinksWidgets',                        
                            type: 'link',
                            eventOrHandler: false,
                            handlerContext: null,
                            handler: this.openCatalogHandler.bind(this,buttonsFromJson[b]['@tarap'],buttonsFromJson[b]['@tartb'],buttonsFromJson[b]['@views'],buttonsFromJson[b]['@screen'],a,screensStructure.get(screensStructure.keys()[a]))                                                                  
                        };                        
                    } else if (buttonsFromJson[b]['@tarap'] == null) {
                        var event = 'EWS:PFM_contentAddElementWithoutCat';
                        var data = $H({ cont: a, InScreen: actualWidget });
                        //create button with event
                        var aux = {
                            idButton: buttonsFromJson[b]['@action'],
                            label: (!Object.isEmpty(this.labels.get(buttonsFromJson[b]['@label_tag']))) ? this.labels.get(buttonsFromJson[b]['@label_tag']) : global.getLabel(buttonsFromJson[b]['@label_tag']),                                           
                            data: data,
                            className: 'application_action_link PFM_AlignLinksWidgets',
                            event: event,
                            type: 'link',
                            eventOrHandler: true
                        };                        
                    }
                    var buttonsJson = {
                        elements: []
                    };
                    buttonsJson.elements.push(aux);
                    var ButtonJobProfLink = new megaButtonDisplayer(buttonsJson);
                    divToDisplayButtons.insert(ButtonJobProfLink.getButtons());
                }
            }
            elementToDisplayWidget.insert(divToDisplayButtons);
            elementToDisplayWidget.insert(divEmptyJson);
            //we insert the main div in the widget
            var objOptions = $H({
                title: screensStructure.get(screensStructure.keys()[a]).label,
                events: $H({ onToggle: 'EWS:myWidgetToggle' }),
                collapseBut: true,
                contentHTML: elementToDisplayWidget,
                onLoadCollapse: false,
                targetDiv: 'PFM_contentAll_' + a + '_' + appId
            });
            //we create the widget
            var myWidget = new unmWidget(objOptions);
            //we insert the content of the table
            this.grArrayMain.push(new groupedLayout(newJson, divContainerTable, isGrouped));
            this.grArrayMain[a].buildGroupLayout();
        }
        var divGeneralButtons = new Element('div', {
            'id': 'PFM_devPlanGeneralButtons'
        });
        for (var c = 0; c < buttonsFromJson.length; c++) {
            if (buttonsFromJson[c]['@screen'] == '*') {
                var event;
                var data;
                var functionToGo;
                //go back to dashboard
                if (buttonsFromJson[c]['@tarap'] == 'PFM_IOV') {
                    var data = buttonsFromJson[c]['@tarap'];
                    var functionToGo = this.goBack;
                    //save the content of the job profile
                } else if (buttonsFromJson[c]['@action'] == 'APP_PFMSAVE') {
                    var data = buttonsFromJson[c]['@action'];
                    var functionToGo = this.callToSaveRequestGetContent;
                }
                else if (buttonsFromJson[c]['@tarap'] == 'TM_L_CTD') {
                    var data = buttonsFromJson[c]['@tarap'];                    
                    var functionToGo = this.goBack;
                }
                var mainButtonsJson = {
                    elements: []
                };
                var aux = {
                    idButton: buttonsFromJson[c]['@action'],
                    label: (!Object.isEmpty(this.labels.get(buttonsFromJson[c]['@label_tag']))) ? this.labels.get(buttonsFromJson[c]['@label_tag']) : global.getLabel(buttonsFromJson[c]['@label_tag']),
                    handlerContext: null,
                    className: 'PFM_AlignButtonsWidgets',
                    handler: functionToGo.bind(this, data),
                    type: 'button',
                    standardButton: true
                };
                mainButtonsJson.elements.push(aux);
                var ButtonPFMjobProf = new megaButtonDisplayer(mainButtonsJson);
                divGeneralButtons.insert(ButtonPFMjobProf.getButtons());
            }
        }
        this.virtualHtml.down('div#PFM_generalButtons').update(divGeneralButtons);
        //we show the legend and the widgets
        this.virtualHtml.down('<div#PFM_legendDiv_' + appId).show();
        this.virtualHtml.down('div#PFM_getContent_' + appId).show();
    },
    openCatalogHandler: function(appId,tabId,view,screen,cont,selectedJson){    
        global.disableAllButtons();
        global.open($H({
            app: {
                appId: appId,	
                tabId: tabId,
                view: view
            },
            multiple: true, 
            screen: screen, 
            reloadCatalog: true,
            cont: cont,
            selectedJson: selectedJson.rows,
            button: 'top'
        }))     
    },                             
    
    /**
    * @description Construct the xml needed to call to the service get_content, when it comes to view details of and element.
    * @param event {Event} Data referring to the element clicked. The element we want to see the details of.
    */ 
    viewDetailsRequest: function(event) {
        global.disableAllButtons();
        //read arguments
        var args = getArgs(event);
        var objId = args.get('objid');
        var otype = args.get('otype');
        var tarap = args.get('tarap');
        //build xml_in and call to the service
        var xmlToGetDetails = "<EWS>" +
	                     "<SERVICE>GET_CONTENT2</SERVICE>" +
	                     "<OBJECT TYPE='" + otype + "'>" + objId + "</OBJECT>" +
	                     "<PARAM>" +
	                         "<APPID>" + tarap + "</APPID>" +
	                         "<WID_SCREEN>*</WID_SCREEN>" +
	                     "</PARAM>" +
	                 "</EWS>";
        this.makeAJAXrequest($H({ xml: xmlToGetDetails, successMethod: 'viewDetails', failureMethod: 'actionErrorPFM', errorMethod: 'actionErrorPFM' }));
    },
    actionErrorPFM: function(json){              
        global.enableAllButtons();
        this._failureMethod(json);
    },
    /**
    * @description Retrieves the details, and displays them in a pop-up
    * @param xml {Json} Json retrieved from the service 
    */ 
    viewDetails: function(xml) {
        this.grArrayDetails = $A();
        this.detailsHash = splitBothViews(xml);
        var cont = 0;
        var labels = xml.EWS.labels.item;
        //loop through records
        for (var i = 0; i < this.detailsHash.size(); i++) {
            //if table_mode = '' --> 'normal mode'
            if (this.detailsHash.get(this.detailsHash.keys()[i]).tableMode != 'X') {
                var field = new getContentModule({ 
                    mode: 'display', 
                    json: this.detailsHash.get(this.detailsHash.keys()[i]), 
                    appId: this.detailsHash.get(this.detailsHash.keys()[i]).EWS.appId, 
                    showCancelButton:false, 
                    showButtons: $H({
                        edit : false,
                        display: false,
                        create: false
                    }),                    
                    noResultsHtml: '<span>' + global.getLabel('noResults') + '</span>' }).getHtml();
            }
            else {
                //if table_mode = 'X' --> 'grouped layout mode'
                var isGroupedArray = objectToArray(this.detailsHash.get(this.detailsHash.keys()[i]).headers.fs_fields.yglui_str_wid_fs_field);
                this.isGrouped = false;
                for (var b = 0; b < isGroupedArray.length && !this.isGrouped; b++) {
                    if (isGroupedArray[b]['@fieldtype'] == 'G')
                        this.isGrouped = true;
                }
                var field;
                field = this.getContentToGroupedLayout(this.detailsHash.get(this.detailsHash.keys()[i]), this.isGrouped, this.detailsHash.keys()[i]);
            }
            //build the rest of the screen
            var screen = this.detailsHash.keys()[i];
            var title = this.detailsHash.get(this.detailsHash.keys()[i]).EWS.label;
            for (var j = 0; j < labels.length; j++) {
                if (labels[j]['@id'] == title) {
                    var finalTitle = labels[j]['@value'];
                }
            }
            this.fieldPanelsHash.set(screen, {
                body: field,
                title: prepareTextToShow(finalTitle)
            });
        }
        //build the pop-up (info module)
        var html = "<div class='PFM_detailsCss'>";
        for (var i = 0; i < this.fieldPanelsHash.size(); i++) {
            html += "<div id='PFM_detailsTitle_" + i + "' class='PFM_detailsTitleCss'></div><div id='PFM_containerDetails_" + i + "' class='PFM_detailsBodyCss'></div>";
        }
        html += "</div>";
        var PFM_infoPopUpDetails = new infoPopUp({            
                htmlContent: html,
                width: 600,               
                closeButton :   $H( {                        
                    'callBack':     function() {
                        PFM_infoPopUpDetails.close();
                        delete PFM_infoPopUpDetails;
                    }
                })                          
        });
        PFM_infoPopUpDetails.create();
        //insert the content in the pop-up
        for (var i = 0; i < this.fieldPanelsHash.size(); i++) {
            if (Object.isEmpty(this.fieldPanelsHash.get(this.fieldPanelsHash.keys()[i]).body.headers)) {
                PFM_infoPopUpDetails.obInfoPopUpContainer.down("div#PFM_containerDetails_" + i + "").insert(this.fieldPanelsHash.get(this.fieldPanelsHash.keys()[i]).body);
            }
            else {
                var treatedJson = this.fieldPanelsHash.get(this.fieldPanelsHash.keys()[i]).body;
                this.grArrayDetails.push(new groupedLayout(treatedJson, PFM_infoPopUpDetails.obInfoPopUpContainer.down("div#PFM_containerDetails_" + i + ""),this.isGrouped));
                this.grArrayDetails[cont].buildGroupLayout();
                cont++;
            }
            PFM_infoPopUpDetails.obInfoPopUpContainer.down("div#PFM_detailsTitle_" + i + "").insert(this.fieldPanelsHash.get(this.fieldPanelsHash.keys()[i]).title);
        }
        global.enableAllButtons();
    },
    /**
    * @description Event launched when clicking to delete and element
    * @param event {Event} Data about the clicked element
    */ 
    deleteRequest: function(event) {
        var args = getArgs(event);
        var key_str = args.get('rowId');
        var rec_key = args.get('rec_key');
        var cont = args.get('sectionCounter');
        var Inscreen = args.get("sectionId");
        //delete from screen
        this.grArrayMain[cont].deleteRow(key_str);
        //find the row in the json, to create the 'save'  
        var rowsArray = objectToArray(this.json.EWS.o_field_values.yglui_str_wid_record);
        for(var i=0; i<rowsArray.length; i++){
            if (rowsArray[i].contents.yglui_str_wid_content['@key_str'] == key_str) {
                var record = deepCopy(rowsArray[i]);
                //remove all buttons except the clicked one
                var buttonsArray = objectToArray(record.contents.yglui_str_wid_content.buttons.yglui_str_wid_button);
                for(var j=0; j<buttonsArray.length;j++){
                    if (buttonsArray[j]['@type'] != 'DEL') {
                        record.contents.yglui_str_wid_content.buttons.yglui_str_wid_button = record.contents.yglui_str_wid_content.buttons.yglui_str_wid_button.without(buttonsArray[j]);
                    }                
                }
                //If the record was there (added), remove it   
                //If the record was there (edited) overwrite it
                var recordIsThere = false;
                var recordIndex = -1;
                for(var g=0; g<this.recordsToSave.length; g++){
                    if(this.recordsToSave[g].contents.yglui_str_wid_content['@key_str'] == key_str){
                        recordIsThere = true;
                        recordIndex = g;
                    }
                }
                if(recordIsThere){ 
                    //look at the button   
                    if(objectToArray(this.recordsToSave[recordIndex].contents.yglui_str_wid_content.buttons.yglui_str_wid_button)[0]['@type'] == 'INS')
                        this.recordsToSave.splice(parseInt(recordIndex,10),1);
                    else if(objectToArray(this.recordsToSave[recordIndex].contents.yglui_str_wid_content.buttons.yglui_str_wid_button)[0]['@type'] == 'MOD')
                        this.recordsToSave[recordIndex] = record;

                }else{
                //save in the array with the records to save                
                this.recordsToSave.push(record);
                }
                //delete from this.json
                if (Object.isArray(this.json.EWS.o_field_values.yglui_str_wid_record))
                    this.json.EWS.o_field_values.yglui_str_wid_record = this.json.EWS.o_field_values.yglui_str_wid_record.without(rowsArray[i]);
                else
                    this.json.EWS.o_field_values = null;
            }        
        
        }
        if(this.recordsToSave.length > 0)
            //to show the message
            this.toggleSaveChangesMessage(true);
        else
            //hide the message
            this.toggleSaveChangesMessage(false); 
    },
    /**
    * @description Event launched when clicking to edit and element
    * @param event {Event} Data about the clicked element
    */ 
    editElement: function(event) {
        global.disableAllButtons();
        this.reloadFlag = false;
        var args = getArgs(event);
        var key_str = args.get('rowId');
        var rec_key = args.get('rec_key');
        var sectionCounter = args.get('sectionCounter');
        this.cont = sectionCounter;
        var screenId = args.get("sectionId")
        //find the row in the json, to create the 'save'  
        var record;
        var rowsArray = objectToArray(this.json.EWS.o_field_values.yglui_str_wid_record);
        for(var i=0; i< rowsArray.length; i++){
            if (rowsArray[i].contents.yglui_str_wid_content['@key_str'] == key_str) {
                record = rowsArray[i];
            }        
        }
        //create a json with field_settings, record and screens. We send no buttons in screen & appId level
        var json = deepCopy(this.json);
        //remove the other field_settings
        var fieldSetting;
        var fieldsArray = objectToArray(json.EWS.o_field_settings.yglui_str_wid_fs_record);
        for(var i=0; i< fieldsArray.length; i++){
            if (fieldsArray[i]['@screen'] == screenId)
                fieldSetting = fieldsArray[i];        
        }
        json.EWS.o_field_settings.yglui_str_wid_fs_record = fieldSetting;
        //remove the other screens 
        var widgetScreens;
        var screenMode = json.EWS.o_widget_screens['@screenmode']; 
        var screensArray = objectToArray(json.EWS.o_widget_screens.yglui_str_wid_screen);
        for(var i=0;i< screensArray.length; i++){
            if (screensArray[i]['@screen'] == screenId){
                widgetScreens = screensArray[i];
                json.EWS.o_widget_screens['@screenmode'] = screenMode;
            }        
        }
        json.EWS.o_widget_screens.yglui_str_wid_screen = widgetScreens;    
        //remove buttons
        json.EWS.o_screen_buttons = null;
        //remove the other records
        json.EWS.o_field_values.yglui_str_wid_record = record;
        //extra check for Job catalogue
        var widScreens = objectToArray(json.EWS.o_widget_screens.yglui_str_wid_screen);
        for (var i = 0; i <widScreens.length; i++){
                if(widScreens[i]['@screen'] == screenId)
                    if(widScreens[i]['@secondary']== 'hiddenTM')
                        widScreens[i]['@secondary'] = null;
                
            
        }        
        var FPObject = new getContentModule({
            appId: this.appId,
            mode: 'edit',
            json: json,
            //noResultsHtml: global.getLabel('noResults'),
            fieldDisplayerModified: 'EWS:PFM_popUp_fieldModified',
            //fireEventWhenDefaultValueSet : this.fireEventWhenDefaultValueSet,
            //paiEvent : 'EWS:PFM_popUp_servicePai',
            showCancelButton:false,
            showLoadingPAI: false,
            buttonsHandlers: $H({
                paiEvent : function(args){
                    document.fire('EWS:PFM_popUp_servicePai',getArgs(args))}
            }), 
            showButtons: $H({
                edit : false,
                display: false,
                create: false
            })          
        });
        var _this = this;
        this._this = this;
        this.editWindow = new infoPopUp({                
            htmlContent: "<div class='PFM_DevPlan_editPopUp_mainDiv'></div>",
            width: 600,
            events: $H({ onClose: 'EWS:PFM_doc_popUpClosed' }),
            closeButton :   $H( {                        
                'callBack':  _this.cancelAction.bind(this)
            })                            
        });
        this.editWindow.create();                
        var auxDiv = this.editWindow.obInfoPopUpContainer.down('[class=PFM_DevPlan_editPopUp_mainDiv]');
        auxDiv.insert(FPObject.getHtml());
        //cancel button
        var cancenlButtonJson = {
            elements:[],
            mainClass: 'moduleInfoPopUp_stdButton_div_right'           
        };         
        var aux =   {
            idButton: 'saveDraftEditButton',
            label: global.getLabel('saveDraft'),
            handlerContext: null,
            handler: this.testFormAndDoAction.bind(this,"editWindow",FPObject),
            className: 'moduleInfoPopUp_stdButton',
            type: 'button',
            standardButton: true,
			eventOrHandler: false   
        }; 
        cancenlButtonJson.elements.push(aux);
        var cancelButtonObj=new megaButtonDisplayer(cancenlButtonJson);  
        auxDiv.insert(cancelButtonObj.getButtons());          
        //end cancel button                
        //keep the clicked button
        var buttonsArray = objectToArray(record.contents.yglui_str_wid_content.buttons.yglui_str_wid_button);
        for(var i=0;i<buttonsArray.length;i++){
            if (buttonsArray[i]['@type'] == 'MOD') {
                this.clickedEditAction = { key: key_str, action: buttonsArray[i] };
            }        
        }
        var checkOk = this.checkJson(json, ['EWS', 'o_field_values', 'yglui_str_wid_record']);
        if (checkOk.answer) {
            //check if the record has been already introduced in the array, due to a prev. action
            var recordIsThere = false;
            var recordIndex = -1;
            for(var g=0; g<this.recordsToSave.length; g++){
                if(this.recordsToSave[g].contents.yglui_str_wid_content['@key_str'] == key_str){
                    recordIsThere = true;
                    recordIndex = g;
                }
            }            
            //if the record is not already there, insert it
            if(! recordIsThere){
                //save in the array with the records to save                
                this.originalRecordsToSave = this.recordsToSave.clone();
                //reference just the values of the record. The rest, with deepCopy, so when we change the buttons
                //in recordsToSave, it's not changed too in the xml.
                var auxRecord = deepCopy(record);
                auxRecord.contents.yglui_str_wid_content.fields = record.contents.yglui_str_wid_content.fields;
                this.recordsToSave.push(auxRecord);  
            }else{
                //save in the array with the records to save                
                this.originalRecordsToSave = this.recordsToSave.clone();             
                //else, replace the record (values), keeping the button
                var buttonToKeep = this.recordsToSave[recordIndex].contents.yglui_str_wid_content.buttons.yglui_str_wid_button;
                //reference just the values of the record. The rest, with deepCopy, so when we change the buttons
                //in recordsToSave, it's not changed too in the xml.
                this.recordsToSave[recordIndex].contents.yglui_str_wid_content.fields = record.contents.yglui_str_wid_content.fields;
                this.recordsToSave[recordIndex].contents.yglui_str_wid_content.buttons.yglui_str_wid_button = buttonToKeep;
            }
        }
        //set the observer so we know when the user actually modifies something
        document.observe('EWS:PFM_popUp_fieldModified', this.setReloadBinding);
        global.enableAllButtons();
    },
    /**
    * @description When closing / saving info in an infoPopUp, checks if the fieldPanel is ok. If not, shows a message and does not close the infoPopUp
    * @param infoPopUp {String} The name or identificator of the infoPopUp
    * @param FPObject {fieldPanel} The fieldPanel we want to check
    */    
    testFormAndDoAction: function(infoPopUp,FPObject){
        var accessedObject;
        switch(infoPopUp){
            case "editWindow":
                accessedObject = this.editWindow;
                break;
        }  
        var validation = FPObject.validateForm();              
        if(validation.correctForm){
            accessedObject.close();
            delete accessedObject;   
        }
        //if we didn't change anything, restore recordsToSave
        if(!this.reloadFlag){
            //remove the element from recordsToSave
            this.recordsToSave = this.originalRecordsToSave.clone();     
            if(!Object.isEmpty(this.recordsToAddInJson)){
                this.recordsToAddInJson = new Hash();
            }        
        }     
    },
    /**
    * @description When after opening an element (existing or new) the user cancels, we have to go back to the previous state
    * @param event {Args} Data about the cancelling
    */   
    cancelAction: function(){   
        //remove the element from recordsToSave
        this.recordsToSave = this.originalRecordsToSave.clone();     
        if(!Object.isEmpty(this.recordsToAddInJson)){
            this.recordsToAddInJson = new Hash();
        }
        //to hide the message
        if(!this.saveChangesMessage.visible())
            this.toggleSaveChangesMessage(false);      
        this.reloadFlag = false;    
        //close infoPopUp      
        this.editWindow.close();
        delete this.editWindow;  
    },      
    /**
    * @description Event launched to reload a section, because something inside was modified
    * @param event {Args} Data about the modified section
    */     
    setReload: function(args) {
        this.reloadFlag = true;
        document.stopObserving('EWS:PFM_popUp_fieldModified', this.setReloadBinding);
    },
    /**
    * @description Event launched to stop observing changes inside a pop up
    * @param event {Args} Data about the event
    */     
    stopObservingChangesInPopUp: function(event) {
        document.stopObserving('EWS:PFM_popUp_fieldModified', this.setReloadBinding);
        //if a PAI field was modified, then we have to call SAP
        if(this.callPai && this.reloadFlag){
            this.paiEventRequest();
            this.callPai = false;
        }
        //if not, just reload
        if (this.reloadFlag)
            this.reloadSection();
    },
    /**
    * @description When closing the pop up, if needed, reload a section
    */  
    reloadSection: function() {
        //reload screen
        var inScreen;
        for (var a = 0; a < this.recordsToSave.length; a++) {
            inScreen = this.recordsToSave[a]['@screen'];
            var founded = false;
            var keepLooking = true;
            if (this.clickedEditAction == null) {
                founded = false;
                keepLooking = false;
            }
            if (keepLooking) {
                for (var b = 0; b < objectToArray(this.json.EWS.o_field_values.yglui_str_wid_record).length && keepLooking; b++) {
                    //EDITING
                    if (this.recordsToSave[a].contents.yglui_str_wid_content['@key_str'] == objectToArray(this.json.EWS.o_field_values.yglui_str_wid_record)[b].contents.yglui_str_wid_content['@key_str']
                        && this.clickedEditAction.key == this.recordsToSave[a].contents.yglui_str_wid_content['@key_str']) {
                        keepLooking = false;
                        founded = true;
                        //if the element exists, overwrite it with the new content, but maintaining original buttons
                        //this.json.EWS.o_field_values.yglui_str_wid_record[b] = deepCopy(this.recordsToSave[a]);
                        //if it has only one button, it's INS, and it's a fake id, we keep the 'INS' instead of the 'MOD'
                        if(!Object.isArray(this.recordsToSave[a].contents.yglui_str_wid_content.buttons.yglui_str_wid_button))
                            this.recordsToSave[a].contents.yglui_str_wid_content.buttons.yglui_str_wid_button = objectToArray(this.recordsToSave[a].contents.yglui_str_wid_content.buttons.yglui_str_wid_button);    
                        if( this.recordsToSave[a].contents.yglui_str_wid_content.buttons.yglui_str_wid_button.length == 1
                            && this.recordsToSave[a].contents.yglui_str_wid_content.buttons.yglui_str_wid_button[0]['@okcode'] == 'INS'
                            && this.recordsToSave[a].contents.yglui_str_wid_content['@key_str'].startsWith('_')){}
                        else
                        this.recordsToSave[a].contents.yglui_str_wid_content.buttons.yglui_str_wid_button = this.clickedEditAction.action;
                    }
                }
            }
            //ADDING (NOT FROM CATALOGUE)
            if (!founded) {
                var auxRecord = deepCopy(this.recordsToSave[a]);
                //if it is not already added
                if(this.recordsToAddInJson.keys().indexOf(a.toString()) != -1){
                    //remove it from the array, so we dont add it again
                    this.recordsToAddInJson.unset(a.toString());                
                    var key = this.falseKeys;
                    //we build up our own key_str
                    auxRecord.contents.yglui_str_wid_content['@key_str'] = "_" + key;
                    this.recordsToSave[a].contents.yglui_str_wid_content['@key_str'] = "_" + key;
                    //we dont insert elements that are already added
                    if(Object.isEmpty(this.json.EWS.o_field_values)){                        
                        var recordPath = { yglui_str_wid_record: [] }
                        this.json.EWS.o_field_values = recordPath;
                    }else{
                        this.json.EWS.o_field_values.yglui_str_wid_record = objectToArray(this.json.EWS.o_field_values.yglui_str_wid_record);
                    }                        
                    this.json.EWS.o_field_values.yglui_str_wid_record.push(auxRecord);
                    
                    //if no buttons 
                    if ('@buttons' in this.recordsToSave[a].contents.yglui_str_wid_content) {
                        var buttonPath = { yglui_str_wid_button: this.clickedAddAction }
                        this.recordsToSave[a].contents.yglui_str_wid_content.buttons = buttonPath;
                        delete this.recordsToSave[a].contents.yglui_str_wid_content['@buttons']
                    } else
                        this.recordsToSave[a].contents.yglui_str_wid_content.buttons.yglui_str_wid_button = this.clickedAddAction;
                    this.falseKeys++;
                }    
            }
        }
        //remove old html        
        delete (this.grArrayMain[this.cont]);
        this.virtualHtml.down('div#PFM_containerTable' + this.cont + '_' + this.appId).update('');
        //create new gl
        var screensStructure = splitInScreensGL(this.json);
        var isGroupedArray = objectToArray(screensStructure.get(inScreen).headers.fs_fields.yglui_str_wid_fs_field);
        var isGrouped = false;        
        for (var b = 0; b < isGroupedArray.length && !isGrouped; b++) {
            if (isGroupedArray[b]['@fieldtype'] == 'G')
                isGrouped = true;
        }
        var newJson = this.getContentToGroupedLayout(screensStructure.get(inScreen), isGrouped, this.cont);
        this.grArrayMain[this.cont] = new groupedLayout(newJson, this.virtualHtml.down('div#PFM_containerTable' + this.cont + '_' + this.appId),isGrouped);
        this.grArrayMain[this.cont].buildGroupLayout();
        //clear class var
        this.clickedEditAction = null;
        this.clickedAddAction = null;
        //to show the message
        this.toggleSaveChangesMessage(true);                    
    },
    /**
    * @description Buils the xml_in to call to SAP with service save_request
    * @param event {Args} Data about the event
    */  
    callToSaveRequestGetContent: function(args) {
//        if(this.recordsToSave.length != 0){
            //create the json (xml_in)
            var jsonToSend = {
                EWS: {
                    SERVICE: 'SAVE_REQUEST',
                    OBJECT: {
                        TYPE: 'P',
                        TEXT: this.empId
                    },
                    PARAM: {
                        APPID: this.appId,
                        RECORDS: { YGLUI_STR_WID_RECORD: $A() },
                        BUTTON: {"@action": '',
                                 "@busid": '',
                                 "@disma": '',
                                 "@label_tag": '',
                                 "@okcode": 'INS',
                                 "@screen": '',
                                 "@status": '',
                                 "@tarap": '',
                                 "@tarty": '',
                                 "@type": ''}
                    }
                }
            };
            //insert the records to save
            for(var i=0;i<this.recordsToSave.length;i++){         
                //remove fake key_strs
                var recordToSend = deepCopy(this.recordsToSave[i]);
                if(recordToSend.contents.yglui_str_wid_content['@key_str'].startsWith('_'))
                    recordToSend.contents.yglui_str_wid_content['@key_str'] = '';            
                jsonToSend.EWS.PARAM.RECORDS.YGLUI_STR_WID_RECORD.push(recordToSend);            
            }
            //transform the xml
            var json2xml = new XML.ObjTree();
            json2xml.attr_prefix = '@';
            this.makeAJAXrequest($H({
                xml: json2xml.writeXML(jsonToSend),
                successMethod: 'processCallToSaveContent',
                errorMethod: 'processErrorToSaveContent'
            }));
//        }
    },
    /**
    * @description Process the call to save_request. If no errors, open the dashboard. If there are any errors, then keep the info to save.
    * @param response {Json} The response from the save_request 
    */  
    processCallToSaveContent: function(response) {
        var valueOfError = response.EWS.webmessage_type;
        if (valueOfError != 'E'){
            this.recordsToSave = $A();
            //hide the message
            this.toggleSaveChangesMessage(false);                    
//            global.goToPreviousApp({refresh: 'X'});   
                global.open($H({
                    app: {
                        appId: this.options.appId,	
                        tabId: this.options.tabId,	                        
                        view: this.options.view
                    },
                    empId:this.empId,
                    previousApp:this.prevApp,
                    previousView: this.prevView                    
                }));          
        }
    },
    processErrorToSaveContent: function(response){
        this.recordsToSave = $A();
        var valueOfError = response.EWS.webmessage_text;
        var infoFailurePopup = new infoPopUp({

            closeButton :   $H( {
                'callBack':     function() {

                    infoFailurePopup.close();
                    delete infoFailurePopup;
                }.bind(this)
            }),
            htmlContent : new Element("div").insert(valueOfError),
            indicatorIcon : 'exclamation',                    
            width: 350
        });
        infoFailurePopup.create();        
    },
    /**
    * @description Open a given application, normally, the previous application
    * @param appToOpen {String} The previous application that we want to open again 
    */ 
    goBack: function(appToOpen) {
        if(appToOpen == "TM_L_CTD"){
            //open the catalogue
            global.open($H({
                app: {
                   appId: appToOpen,
                   tabId: 'LRN_CAT',
                   view: 'CATL'
                }
            }));            
        }else{
            //goto previous app: dashboard, teamDocs, individualDocs
            //global.goToPreviousApp(); 
            global.open($H({
                app: {
                    appId: this.prevApp,	                       
                    view: this.prevView
                },
                refresh:'X'
            }));                     
        }

    },
    /**
    * @description Creates the buttons for an element inside a table
    * @param rowPre {Json} Row in the json 
    * @param key_str {String} key_str of the record 
    * @param sectionCounter {String} Counter of the section where the record is 
    * @param sectionId {String} Id of the section where the record is 
    * @param rec_key {String} rec_key of the record 
    */ 
    getActionsButtonsRow: function(rowPre, key_str, sectionCounter, sectionId, rec_key) {
        var getDoc, getContent;
        //document
        if ("actions" in rowPre) {
            var actionsPre = objectToArray(rowPre.actions.yglui_vie_tty_ac);
            var refObject = rowPre.ehead.ref_object.yglui_str_hrobject;
            var template = rowPre.ehead.template.yglui_str_hrobject;
            getDoc = true;
            //getContent
        } else if ("contents" in rowPre) {
            var actionsPre = objectToArray(rowPre.contents.yglui_str_wid_content.buttons.yglui_str_wid_button)
            getContent = true;
        } else {
            return;
        }
        //json to keep the actions
        var actionsJSON = {
            elements: [],
            defaultEventOrHandler: true
        };
        //Loop the actions for this row
        for (var k = 0; k < actionsPre.length; k++) {
            //Get the JSON object to create the button for the action
            var aux = this.getActionData(actionsPre[k], key_str, sectionCounter, sectionId, rec_key);

            //Give the proper arguments to the action, depeding if it's getDoc or getContent
            if (getDoc && refObject["@objid"] && refObject["@otype"]) {
                aux.data.set("otype", refObject["@otype"]);
                aux.data.set("objid", refObject["@objid"]);
            } else if (getDoc && template["@otype"] && template["@objid"]) {
                aux.data.set("otype", template["@otype"]);
                aux.data.set("objid", template["@objid"]);
            } else if (getContent) {
                //pass objid & otype if needed
                var rowFields = rowPre.contents.yglui_str_wid_content.fields.yglui_str_wid_field;
                var objId = rowFields.find(function(field) {
                    return field["@fieldid"] == "OBJID";
                });
                var objType = rowFields.find(function(field) {
                    return field["@fieldid"] == "OTYPE";
                });
                if (objId && objType) {
                    aux.data.set("otype", objType["@value"]);
                    aux.data.set("objid", objId["@value"]);
                    aux.data.set("text", objId['#text']);
                } else {
                    aux.data.set("otype", null);
                    aux.data.set("objid", null);
                    aux.data.set("text", null);
                }
            } else {
                aux.data.set("otype", null);
                aux.data.set("objid", null);
            }
            actionsJSON.elements.push(aux);
        }
        //Create the buttons which will perform the action
        var ButtonJobProfile = new megaButtonDisplayer(actionsJSON);
        var elementsToDisplay = ButtonJobProfile.getButtons();
        var actionsHTML = new Element('div').insert(elementsToDisplay);
        var rowDetail = {
            id: key_str + '_ACTIONS',
            groupBy: key_str,
            value: actionsHTML
        }
        //return the row with details
        return rowDetail;
    },
    /**
    * @description Reads all fields of and actions, and creates the proper button
    * @param action {Json} Json with the action
    * @param key_str {String} key_str of the record 
    * @param sectionCounter {String} Counter of the section where the record is 
    * @param sectionId {String} Id of the section where the record is 
    * @param rec_key {String} rec_key of the record 
    */
    getActionData: function(action, key_str, sectionCounter, sectionId, rec_key) {
        var event = 'EWS:PFM_rowAction_' + this.getAction(action);
        var actionName = action["@actio"] ? action["@actio"] : action["@action"];
        var labelName = action['@actiot'] ? action["@actiot"] : action["@label_tag"];
        var idButton = actionName + "_" + sectionId + "_" + rec_key;
        var actionData = {
            action: actionName,
            label: labelName,
            idButton: idButton,
            data: $H({
                tarap: action['@tarap'],
                disma: action['@disma'],
                tarty: action['@tarty'],
                type: action["@type"],
                rowId: key_str,
                sectionCounter: sectionCounter,
                sectionId: sectionId,
                rec_key: rec_key
            }),
            event: event,
            className: 'PFM_simpleTable_labels application_action_link PFM_notToPrint',
            type: "link"
        };
        return actionData;
    },
    /**
    * @description Depending on the type of action, creates a string with the name, which will be use as part of the event name
    * @param actionObject {Json} Json with the action
    */    
    getAction: function(actionObject) {
        //read action characteristics
        var actionString = actionObject["@action"];
        var actionType = "@type" in actionObject ? actionObject["@type"] : "";
        var actionOkCode = "@okcod" in actionObject ? actionObject["@okcod"] : actionObject["@okcode"];
        var actionDisma = actionObject["@disma"];
        var actionTargetType = actionObject["@tarty"] ? actionObject["@tarty"] : "";
        //Coming from a get_doc
        if (actionType == "") {
            if (actionOkCode == "MOD") {
                return "edit";
            } else if (actionOkCode == "DIS") {
                return "viewDetails";
            } else if (actionOkCode == "DEL") {
                return "delete";
            }
        } else {
            //Coming from a get_content
            if (actionString == "REC_PFMCOMPTIP") {
                return "tips";
            } else if (actionString == "REC_PFMTIPADD") {
                return "addTips";
            } else if (actionType == "MOD") {
                return "edit";
            } else if (actionType == "DEL") {
                return "delete";
            } else if (actionTargetType.toLowerCase() == "p") {
                return "viewDetails";
            }
        }
    },
    /**
    * @description Given a status number, selects a css class representing the bubble color needed
    * @param value {Integer} Number meaning the status or rating
    */ 
    getBubbleColor: function(value) {

        var bubble = '';
        switch (value) {
            case 0:
                bubble = "application_emptyBubble";
                break;
            case 1:
                bubble = "application_icon_red";
                break;
            case 2:
                bubble = "application_icon_orange";
                break;
            case 3:
                bubble = "application_icon_green";
                break;
        }
        return bubble;

    },
    /**
    * @description LITE: Given a status number, selects an arial code representing the bubble color needed
    * @param value {Integer} Number meaning the status or rating
    */ 
    getBubbleArialCode: function(value) {

        var bubble = '';
        switch (value) {
            case 0:
                bubble = '\u25cb';
                break;
            case 1:
                bubble = '\u25a0';
                break;
            case 2:
                bubble = '\u25b2';
                break;
            case 3:
                bubble = '\u25cf';
                break;
        }
        return bubble;

    },    
    /**
    * @description From a get_content Json, creates a Json to instantiate a grouped layout.
    * @param json {json} The current screen
    * @param grouped {boolean} whether it's grouped (true or undefined) or ungrouped (false)
    * @param sectionCounter {String} The counter of the section where the grouped layout is
    */
    getContentToGroupedLayout: function(json, grouped, sectionCounter) {
        if (Object.isUndefined(grouped)) {
            grouped = true;
        }
        var headersPost = new Array();
        var headersPre = objectToArray(json.headers.fs_fields.yglui_str_wid_fs_field);
        var sortedHeaders = headersPre;
        var headersStructure = new Hash();
        var detailsStructure = new Hash();
        var groupingFieldName;
        var mainElement;
        var positionsArray = new Array();//it'll be used in Job match up
        if (!grouped) {
            var firstElement = true;
        }
        //loop in headers to sort them
        function sortfunction(a, b){
            var seqA = !Object.isEmpty(a['@seqnr']) ? parseInt(a['@seqnr'], 10) : 0;
            var seqB = !Object.isEmpty(b['@seqnr']) ? parseInt(b['@seqnr'], 10) : 0;
            return (seqA - seqB) //causes an array to be sorted numerically and ascending
        }
        headersPre.sort(sortfunction);        
        //loop in sorted headers to create the headers json
        for (var i = 0; i < sortedHeaders.length; i++) {
            var fieldId = sortedHeaders[i]['@fieldid'];
            var fieldType = sortedHeaders[i]['@fieldtype'];
            var type = sortedHeaders[i]['@type'];
            var displayAttrib = sortedHeaders[i]['@display_attrib'];
            var defaultText = sortedHeaders[i]['@default_text'];
            var defaultValue = sortedHeaders[i]['@default_value'];
            var dependField = sortedHeaders[i]['@depend_field'];
            var dependType = sortedHeaders[i]['@depend_type'];
            var displayGroup = sortedHeaders[i]['@display_group'];
            var fieldFormat = sortedHeaders[i]['@fieldformat'];
            var fieldLabel = sortedHeaders[i]['@fieldlabel'];
            var fieldSource = sortedHeaders[i]['@fieldsource'];
            var labelType = sortedHeaders[i]['@label_type'];
            var length = sortedHeaders[i]['@length'];
            var servicePai = sortedHeaders[i]['@service_pai'];
            var serviceValues = sortedHeaders[i]['@service_values'];
            var showText = sortedHeaders[i]['@show_text'];
            var seqnr = sortedHeaders[i]['@seqnr'];
            //keep in an Array the groping fields (G)
            if (grouped) {
                if (sortedHeaders[i]['@fieldtype'] == 'G' && fieldId != 'STATUS_GROUP') {
                    groupingFieldName = fieldId;
                    mainElement = sortedHeaders[i]['@depend_field'];
                }
            }
            if (displayAttrib != "HID" && fieldType == 'H') {
                headersStructure.set(fieldId,
	            {
	                order: seqnr,
	                type: type,
	                displayAttrib: displayAttrib,
	                defaultText: defaultText,
	                defaultValue: defaultValue,
	                dependField: dependField,
	                dependType: dependType,
	                displayGroup: displayGroup,
	                fieldFormat: fieldFormat,
	                fieldLabel: fieldLabel,
	                fieldSource: fieldSource,
	                labelType: labelType,
	                length: length,
	                servicePai: servicePai,
	                serviceValues: serviceValues,
	                showText: showText
	            });
                if (grouped) {
                    headersStructure.get(fieldId).grouping = fieldType;
                } else if (firstElement) {
                    mainElement = fieldId;
                    firstElement = false;
                }
                var head = {
                    column: this.chooseLabel(fieldId, labelType, fieldLabel)
                };
                headersPost.push(head);
            }
            if (displayAttrib != "HID" && Object.isEmpty(fieldType)) {
                detailsStructure.set(fieldId,
	            {
	                order: seqnr,
	                text: prepareTextToShow(sortedHeaders[i]['#text']),
	                fieldId: fieldId,
	                type: type,
	                displayAttrib: displayAttrib,
	                defaultText: defaultText,
	                defaultValue: defaultValue,
	                dependField: dependField,
	                dependType: dependType,
	                displayGroup: displayGroup,
	                fieldFormat: fieldFormat,
	                fieldLabel: fieldLabel,
	                fieldSource: fieldSource,
	                labelType: labelType,
	                length: length,
	                servicePai: servicePai,
	                serviceValues: serviceValues,
	                showText: showText
	            });
                if (grouped) {
                    detailsStructure.get(fieldId).grouping = sortedHeaders[i]['@fieldtype'];
                }
            }
        }
        //remove the main element from the headers hash
        headersStructure.unset(mainElement);
        /********************************************* end headers *********************/
        if (json.rows.length == 0) {
            var newJson = {
                headers: headersPost,
                elements: null
            };
            return newJson;
        }
        //loop in rows (contents)
        var rowsPre = objectToArray(json.rows);
        var rowsPost = new Array();
        var columnsStructure = new Hash();
        if (grouped) {
            var existingGroupers = new Array();
            if(json.appId == 'PFM_MUPS')
                var existingGroupers = new Hash();    
        }
        for (var j = 0; j < rowsPre.length; j++) {
            var element = rowsPre[j].contents.yglui_str_wid_content;
            var columnsPre = objectToArray(element.fields.yglui_str_wid_field);
            var columnsPost = new Array();
            var detailRows = new Array();
            var key_str = element['@key_str'];
            var rec_key = rowsPre[j]['@rec_key'];            
            //build actions
            if (!Object.isEmpty(rowsPre[j].contents.yglui_str_wid_content.buttons)) {
                var screenId = json.headers['@screen'];
                detailRows.push(this.getActionsButtonsRow(rowsPre[j], key_str, sectionCounter, screenId, rec_key));
            }
            //transform the columns to a hash of columns
            for (var b = 0; b < columnsPre.length; b++) {
                //we add an 'order' attribute
                var column_fieldid = columnsPre[b]['@fieldid'];
                columnsPre[b]['@order'] = Object.isEmpty(headersStructure.get(column_fieldid)) ? -1 : parseInt(headersStructure.get(column_fieldid).order, 10);
                //save info in hash
                columnsStructure.set(columnsPre[b]['@fieldid'], {
                    id: column_fieldid,
                    text: prepareTextToShow(columnsPre[b]['#text']),
                    value: !Object.isEmpty(columnsPre[b]['@value'])? columnsPre[b]['@value']:columnsPre[b]['#text'],
                    order: columnsPre[b]['@order']
                });
            }
            //GROUPING FIELD
            if (grouped) {
                //add 3rd level for Job match up
                if(json.appId == 'PFM_MUPS'){                                       
                    var fields = objectToArray(rowsPre[j].contents.yglui_str_wid_content.fields.yglui_str_wid_field);
                    var pos_index = getElementIndex(fields, '@fieldid','POS_NAME');
                    var pos_id = fields[pos_index]['@value'];
                    //if the position is not already inserted
                    if(positionsArray.indexOf(pos_id) == -1){
                        positionsArray.push(pos_id);
                        var rowPosition = {
                            id: pos_id,
                            groupBy: -1,
                            value: prepareTextToShow(fields[pos_index]['#text'])
                        } 
                        rowsPost.push(rowPosition);
                        existingGroupers.set(pos_id,{comp_group:[]});                
                    }
                    //check that this element has not been added yet
                    if (existingGroupers.get(columnsStructure.get('POS_NAME').value).comp_group.indexOf(columnsStructure.get(groupingFieldName).value) == -1) {
                        var bubble_value = (Object.isEmpty(columnsStructure.get("STATUS_GROUP")) || Object.isEmpty(columnsStructure.get("STATUS_GROUP").value)) ? -1 : parseInt(columnsStructure.get("STATUS_GROUP").value, 10);
                        var bubble_group = this.getBubbleColor(bubble_value);
                        var groupingColumn = {
                            id: columnsStructure.get('POS_NAME').value +':'+columnsStructure.get(groupingFieldName).value,
                            groupBy: columnsStructure.get('POS_NAME').value,
                            value: columnsStructure.get(groupingFieldName).text,
                            icon: bubble_group,
                            icon_lite: {code: this.getBubbleArialCode(bubble_value),title:global.getLabel('status')}
                        }
                        rowsPost.push(groupingColumn);
                        existingGroupers.get(columnsStructure.get('POS_NAME').value).comp_group.push(columnsStructure.get(groupingFieldName).value);
                    }                                                                               
                }else{
                    //check that this element has not been added yet
                    if (existingGroupers.indexOf(columnsStructure.get(groupingFieldName).value) == -1) {
                        var bubble_value = (Object.isEmpty(columnsStructure.get("STATUS_GROUP")) || Object.isEmpty(columnsStructure.get("STATUS_GROUP").value)) ? -1 : parseInt(columnsStructure.get("STATUS_GROUP").value, 10);
                        var bubble_group = this.getBubbleColor(bubble_value);
                        var groupingColumn = {
                            id: columnsStructure.get(groupingFieldName).value,
                            groupBy: -1,
                            value: columnsStructure.get(groupingFieldName).text,
                            icon: bubble_group,
                            icon_lite: {code: this.getBubbleArialCode(bubble_value),title:global.getLabel('status')}
                        }
                        rowsPost.push(groupingColumn);
                        existingGroupers.push(columnsStructure.get(groupingFieldName).value);
                    }                
                }            
            }
            //first, we sort the columns to insert them correctly
            for (var c = 1; c < columnsPre.length; c++) {
                for (var d = 0; d < columnsPre.length - 1; d++) {
                    if (columnsPre[d]['@order'] > columnsPre[d + 1]['@order']) {
                        var temp = columnsPre[d];
                        columnsPre[d] = columnsPre[d + 1];
                        columnsPre[d + 1] = temp;
                    }
                }
            }        
            //now we loop to construct the json with the other columns
            for (var a = 0; a < columnsPre.length; a++) {
                //just columns to be shown
                if (columnsPre[a]['@order'] != -1) {
                    //RATING COLUMNS
                    if (columnsPre[a]['@fieldid'] == 'RATING') {
                        for (var t = 0; t < columnsPre.length; t++) {
                            //max_rating
                            if (columnsPre[t]['@fieldid'] == 'MAX_RATING')
                                var max_rating = Object.isEmpty(columnsPre[t]['@value']) ? 0 : parseInt(columnsPre[t]['@value'].strip(), 10);
                            //see if there is a 'require' level
                            if (columnsPre[t]['@fieldid'] == 'REQUIRE')
                                var requirement = Object.isEmpty(columnsPre[t]['@value']) ? -1 : parseInt(columnsPre[t]['@value'].strip(), 10);
                        }
                        //if we don't have 'require' field, then, value = -1
                        if (Object.isEmpty(requirement))
                            requirement = -1;
                        var current = Object.isEmpty(columnsPre[a]['@value']) ? 0 : parseInt(columnsPre[a]['@value'].strip(), 10);
                        if(requirement >=0)
                            var title = this.labels.get('REQUIRE')+": "+requirement+" / "+this.labels.get('RATING')+": "+current;
                        else 
                            var title = this.labels.get('RATING')+": "+current;
                        var text = new Element('div',{'title':title}).update(getRating(max_rating, current, requirement, true));
                    } else {
                        //REST OF COLUMNS  (not RATING)
                        var text;
                        if (headersStructure.get(columnsPre[a]['@fieldid']).type == 'DATS') {
                            text = (! Object.isEmpty(columnsPre[a]['@value'])) ? sapToDisplayFormat(columnsPre[a]['@value'].strip()) : '';
                        } else {
                            var value = columnsPre[a]['@value'] ? columnsPre[a]['@value'].strip() : "";
                            text = this.chooseValue(value, columnsPre[a]['#text'], headersStructure.get(columnsPre[a]['@fieldid']).showText);
                        }
                    }          
                    var columnJson = {
                        fieldId: 'row_' + j + '_field_' + columnsPre[a]['@fieldid'],
                        value: text
                    };
                    //now, at last, we insert the json in the array
                    columnsPost.push(columnJson);
                } else
                //STATUS COLUMN --> the bubble
                    if (columnsPre[a]['@fieldid'] == 'STATUS') {
                    var bubble_value = Object.isEmpty(columnsPre[a]['@value']) ? -1 : parseInt(columnsPre[a]['@value'], 10);
                    var bubble = this.getBubbleColor(bubble_value);
                    var bubble_lite = this.getBubbleArialCode(bubble_value);
                } else
                // DETAILS
                    if (detailsStructure.keys().indexOf(columnsPre[a]['@fieldid']) != -1) {
                    var detailstext;
                    if (detailsStructure.get(columnsPre[a]['@fieldid']).type == 'DATS') {
                        detailstext = (! Object.isEmpty(columnsPre[a]['@value'])) ? sapToDisplayFormat(columnsPre[a]['@value'].strip()) : '';
                    }else if (detailsStructure.get(columnsPre[a]['@fieldid']).fieldFormat == 'C') { //checkbox
                        detailstext = (columnsPre[a]['@value'] == 'X') ? this.labels.get('ESSENTIAL_SEL') : this.labels.get('ESSENTIAL_NOTSEL');
                    }else {
                        var value = columnsPre[a]['@value'] ? columnsPre[a]['@value'].strip() : "";
                        detailstext = this.chooseValue(value, columnsPre[a]['#text'], detailsStructure.get(columnsPre[a]['@fieldid']).showText);
                    }           
                    var detailsHTML = new Element('div',{'class':'PFM_groupLayout_details_area'}).insert("<div class='PFM_simpleTable_labels application_main_soft_text'>" + this.chooseLabel(columnsPre[a]['@fieldid'], detailsStructure.get(columnsPre[a]['@fieldid']).labelType, detailsStructure.get(columnsPre[a]['@fieldid']).fieldLabel) + ": </div><div class='PFM_groupLayout_details_info'>" + detailstext + "</div>");
                    var rowDetail = {
                        id: key_str + '_' + columnsPre[a]['@fieldid'],
                        groupBy: key_str,
                        value: detailsHTML
                    }
                    detailRows.push(rowDetail);
                }

            } //end for (var a=0;a<columnsPre.length;a++)
            //once we have the columns, build the row JSON
            var rowMainElement = {
                id: key_str,
                value: columnsStructure.get(mainElement).text,
                icon: bubble,
                columns: columnsPost,
                icon_lite: {code: bubble_lite,title:global.getLabel('status')}
            }                                
            if (grouped) {
                if(json.appId == 'PFM_MUPS'){
                    rowMainElement.groupBy = columnsStructure.get('POS_NAME').value +':'+columnsStructure.get(groupingFieldName).value;
                }else{
                    rowMainElement.groupBy = columnsStructure.get(groupingFieldName).value;
                }
                
            } else {
                rowMainElement.groupBy = -1;
            }
            rowsPost.push(rowMainElement);
            //insert details
            for (var q = 0; q < detailRows.length; q++) {
                rowsPost.push(detailRows[q]);
            }
        } //end for(var j=0; j< rowsPre.length; j++)
        //Now, we put all the parts together to form the groupLayout JSON
        var newJson = {
            headers: headersPost,
            elements: rowsPost
        };
        return newJson;
    },
    /**
    *@param {String} docId 
    *@Open Performance Document 
    */
    /**
    * @description From a get_doc Json, creates a Json to instantiate a grouped layout.
    * @param json {json} The current section
    * @param grouped {boolean} whether it's grouped (true or undefined) or ungrouped (false)
    * @param sectionCounter {String} The counter of the section where the grouped layout is
    */
    getDocToGroupedLayout: function(json, grouped, sectionCounter, partAppraisersJson) {
        if (Object.isUndefined(grouped)) {
            grouped = true;
        }
        // HEADERS
        var headersPost = new Array();
        var headersPre = objectToArray(json.element_def.col_defs.yglui_str_doc_col_def);
        var sortedHeaders = headersPre;
        var headersStructure = new Hash();
        var detailsStructure = new Hash();
        var groupingFieldName = '';
        var mainElement = '';
        //first colum: we insert it manually
        var pair = {
            column: global.getLabel('title')
        };
        headersPost.push(pair);
        //loop in headers to sort them
        for (var i = 1; i < headersPre.length; i++) {
            for (var j = 0; j < headersPre.length - 1; j++) {
                if (parseInt(headersPre[j]['@seqnr'], 10) > parseInt(headersPre[j + 1]['@seqnr'], 10)) {
                    var temp = headersPre[j];
                    headersPre[j] = headersPre[j + 1];
                    headersPre[j + 1] = temp;
                }
            }
        }        
        //loop in sorted headers
        for (var i = 0; i < sortedHeaders.length; i++) {
            //Get all the other fields needed from the json            
            var fieldId = sortedHeaders[i]['@fieldid'];
            var fieldType = sortedHeaders[i]['@fieldtype'];
            var type = sortedHeaders[i]['@type'];
            var displayAttrib = sortedHeaders[i]['@display_attrib'];
            var fieldFormat = sortedHeaders[i]['@fieldformat'];
            var fieldLabel = sortedHeaders[i]['@fieldlabel'];
            var labelType = sortedHeaders[i]['@label_type'];
            var length = sortedHeaders[i]['@length'];
            var servicePai = sortedHeaders[i]['@service_pai'];
            var serviceValues = sortedHeaders[i]['@service_values'];
            var showText = sortedHeaders[i]['@show_text'];
            var seqnr = sortedHeaders[i]['@seqnr'];                
            //Gets the label for this header as it has to follow some rules according
            //to which fields are in the XML
            var fieldLabel = this.chooseLabel(fieldId, labelType, fieldLabel);
            //put as headers just the not hidden ones
            if (displayAttrib != "HID" && fieldType == 'H' && fieldId != "PAPP") {
                //keep all headers in the hash
                headersStructure.set(fieldId, {
                    fieldFormat: fieldFormat,
                    order: seqnr,
                    type: type,
                    showText: showText,                    
	                displayAttrib: displayAttrib,	               
	                fieldLabel: fieldLabel,
	                labelType: labelType,
	                length: length,
	                servicePai: servicePai,
	                serviceValues: serviceValues	                                 
                });
                var head = {
                    column: fieldLabel
                };
                headersPost.push(head);
            }
            if ((displayAttrib != "HID" && Object.isEmpty(fieldType)) || fieldId == "PAPP") {
                //keep all notes
                detailsStructure.set(fieldId,
                {
                    fieldFormat: fieldFormat,
                    order: seqnr,
                    type: type,
                    showText: showText,                    
	                displayAttrib: displayAttrib,	               
	                fieldLabel: fieldLabel,
	                labelType: labelType,
	                length: length,
	                servicePai: servicePai,
	                serviceValues: serviceValues
                });
            }
        } //end for
        /********************************************* end headers *********************/
        // ROWS
        if (!json.elements) {
            var newJson = {
                headers: headersPost,
                elements: null
            };
            return newJson;
        }
        var rowsPre = objectToArray(json.elements.yglui_str_doc_element);
        var rowsPost = new Array();
        if (grouped) {
            var existingGroupers = new Array();
        }
        //Loop each row
        for (var j = 0; j < rowsPre.length; j++) {
            //ROW
            var element = rowsPre[j];
            //take each of the columns in the row
            var columnsPre = objectToArray(element.columns.yglui_str_doc_col_val);            
            var columnsPost = new Array();
            var detailRows = new Array();
            var key_str = element.ehead['@row_id'];
            // insert the actions row
            if (!Object.isEmpty(rowsPre[j]['@actions']) || !Object.isEmpty(rowsPre[j].actions)) {
                detailRows.push(this.getActionsButtonsRow(rowsPre[j], key_str, sectionCounter, json.shead["@sect_id"], null));
            }
            //end actions
            //REST OF COLUMNS
            //transform the columns to a hash of columns
            for (var b = 0; b < columnsPre.length; b++) {
                //we add an 'order' attribute
                var column_fieldid = columnsPre[b]['@fieldid'];
                //here we'll use a different column_def for each element
                columnsPre[b]['@order'] = Object.isEmpty(headersStructure.get(column_fieldid)) ? -1 : parseInt(headersStructure.get(column_fieldid).order, 10);
            }
            //first, we sort the columns to insert them correctly
            for (var c = 1; c < columnsPre.length; c++) {
                for (var d = 0; d < columnsPre.length - 1; d++) {
                    if (columnsPre[d]['@order'] > columnsPre[d + 1]['@order']) {
                        var temp = columnsPre[d];
                        columnsPre[d] = columnsPre[d + 1];
                        columnsPre[d + 1] = temp;
                    }
                }
            }
          var pappRatingCtr = 0;
          var pappCommentCtr = 0;                
            //now we loop to construct the json with the other columns
            for (var a = 0; a < columnsPre.length; a++) { 
                //look for the correct column_def               
                var columnsDef;
                var columnDefArray = objectToArray(element.col_defs.yglui_str_doc_col_def);
                for(var t=0; t < columnDefArray.length; t++){
                    if(columnDefArray[t]['@fieldid'] == columnsPre[a]['@fieldid'])
                        columnsDef = objectToArray(element.col_defs.yglui_str_doc_col_def)[t];
                }
                //just columns to be shown
                if (columnsPre[a]['@order'] != -1) {
                    //RATING COLUMNS
                    if (columnsPre[a]['@fieldid'] == 'RATING') {
                        for (var t = 0; t < columnsPre.length; t++) {
                            //max_rating
                            if (columnsPre[t]['@fieldid'] == 'MAX_RATING')
                                var max_rating = Object.isEmpty(columnsPre[t]['@value']) ? 0 : parseInt(columnsPre[t]['@value'].strip(), 10);
                            //see if there is a 'require' level
                            if (columnsPre[t]['@fieldid'] == 'REQUIRE')
                                var requirement = Object.isEmpty(columnsPre[t]['@value']) ? -1 : parseInt(columnsPre[t]['@value'].strip(), 10);
                        }
                        //if we don't have 'require' field, then, value = -1
                        if (Object.isEmpty(requirement))
                            requirement = -1;
                        var current = Object.isEmpty(columnsPre[a]['@value']) ? 0 : parseInt(columnsPre[a]['@value'].strip(), 10);
                        var title = this.labels.get('RATING')+": "+current;
                        var text =  new Element('div',{'title':title}).update(getRating(max_rating, current, requirement, true));
                    } else {
                        //REST OF COLUMNS  (not RATING)
                        var text;
                        if (columnsDef['@type'] == 'DATS') {
                            text = (! Object.isEmpty(columnsPre[a]['@value'])) ? sapToDisplayFormat(columnsPre[a]['@value'].strip()) : '';
                        } else if(columnsDef['@type'] == 'DEC'){
                            //change '.' for global separator
                            var value = columnsPre[a]['@value'] ? columnsPre[a]['@value'].strip() : "";
                            value = value.gsub(".",global.commaSeparator);
                            text = this.chooseValue(value, columnsPre[a]['#text'], columnsDef['@show_text']);
                        }else{
                            var value = columnsPre[a]['@value'] ? columnsPre[a]['@value'].strip() : "";
                            text = this.chooseValue(value, columnsPre[a]['#text'], columnsDef['@show_text']);
                        }
                    }
                    ////////////////////////////////////////////////////////////
                    if(columnsPre[a]['@fieldid'] == 'FAPP' && headersStructure._object.FAPP.displayAttrib != 'OUO'){
                      var auxObject = { id: columnsPre[a]['@value'], text: prepareTextToShow(columnsPre[a]['#text'])};                      
                      if(auxObject.id != null){
                         auxObject.id = auxObject.id.replace(" ", "");  
                      }
                      var colDef = headersStructure._object.FAPP;
                      //special service for qualifications (slightly different structure)
                      if(colDef.serviceValues == "GET_QUALIF_VALS"){
                          var fieldtag = 'QUALIF';   
                          var qualif = "OBJECTTYPE='"+rowsPre[j].ehead.ref_object.yglui_str_hrobject['@otype']+"' OBJECTID='"+rowsPre[j].ehead.ref_object.yglui_str_hrobject['@objid']+"'";                                  
                      }else{
                          var fieldtag = 'FIELD';  
                          var qualif = "";                         
                      }
                      if(colDef.serviceValues == 'GET_SCAL_VALS2'){
                        var auxArray = objectToArray(rowsPre[j].col_defs.yglui_str_doc_col_def);
                        var fappIndex = getElementIndex(auxArray,'@fieldid','FAPP');
                        var fappValue = auxArray[fappIndex].scale['@value_type'];
                        var fappType = auxArray[fappIndex].scale['@value_class'];
                         var pXml = "<EWS>" +
                            "<SERVICE>" + colDef.serviceValues + "</SERVICE>" +
                            "<OBJECT TYPE='" + fappType + "'>" + fappValue + "</OBJECT>" +
                            "<PARAM>" +                    
                            "</PARAM>" +
                            "</EWS>";                      
                      }else{
                          var pXml = "<EWS>" +
                                "<SERVICE>" + colDef.serviceValues + "</SERVICE>" +
                                "<OBJECT TYPE='" + rowsPre[j].ehead.template.yglui_str_hrobject['@otype'] + "'>" + rowsPre[j].ehead.template.yglui_str_hrobject['@objid'] + "</OBJECT>" +
                                "<PARAM>" +
                                    "<"+fieldtag+" FIELDID='" + columnsPre[a]['@fieldid']  + "' FIELDLABEL='" + colDef.fieldLabel + "' FIELDTECHNAME='" + columnsPre[a]['@fieldtechname'] + "' VALUE='' "+qualif+" />" +
                                "</PARAM>" +
                           "</EWS>"; 
                       }
                       var predefinedXml = $H({'FAPP':pXml});
                       //to hide the label for the field
                       var modifiedColumnsDef = deepCopy(columnsDef);
                       modifiedColumnsDef['@label_type'] = 'N';
                       //hardcoded instantiation of fieldsDisplayer for FAPP                                           
                        resultField = $FD(
			                { settings: modifiedColumnsDef,
			                    values: columnsPre[a]
			                },
			                sectionCounter, //screen
			                key_str, //record
			                key_str, //key_str
			                this.options.appId, //appId
			                'edit', //dispMode
			                '', //labels
			                'EWS:PFM_fieldModified', //fieldDisplayerModified
			                '', //cssClasses
			                predefinedXml, //predefinedXmls
			                '', //linkTypeHandlers
			                '', //name
			                '', //getFieldValueAppend
			                key_str, //randomId
			                columnsPre[a]['@order'] , //rowSeqnr
			                '', //variant
			                this,
			                '' //dateRanges
		                );  
		                resultField._getFieldValues(null, pXml);
		                text = resultField.getHtml();   		                     
		                text.down().removeClassName('fieldDispLabel');                    
                    }
//                    if(columnsPre[a]['@fieldid'] == 'FWGT' && headersStructure._object.FWGT.displayAttrib != 'OUO'){
//                      var auxObject = { id: text, text: text};
//                      resultField = new FieldDisplayer(
//                      {
//                          fieldFormat: 'I',
//                          fieldId: json.shead['@sect_id'] + '_' +rowsPre[j].ehead['@row_id'] + '_' + columnsPre[a]['@fieldid'],
//                          displayAttrib: 'OPT',
//                          defaultValue: auxObject,
//                          type: 'CHAR',
//                          maxLength: 6,
//                          showText: '',
//                          events: $H({ formFieldModified: 'EWS:PFM_fieldModified' }),
//                          fieldLabel: ''               
//                      }, columnsPre[a]);
//                      resultField._object._element.size = 5;
//                      text = resultField.getElement();
//                    }
                    ////////////////////////////////////////////////////////////
                    var columnJson = {
                        fieldId: 'row_' + j + '_field_' + columnsPre[a]['@fieldid'],
                        value: text
                    };
                    //now, at last, we insert the json in the array
                    columnsPost.push(columnJson);
                } else
                // DETAILS
                    if (detailsStructure.keys().indexOf(columnsPre[a]['@fieldid']) != -1) {
                    var detailstext;
                    if (detailsStructure.get(columnsPre[a]['@fieldid']).type == 'DATS') {
                        detailstext = (! Object.isEmpty(columnsPre[a]['@value'])) ? sapToDisplayFormat(columnsPre[a]['@value'].strip()) : '';
                    } else {
                        var value = columnsPre[a]['@value'] ? columnsPre[a]['@value'].strip() : "";
                        var adjDetails = this.chooseValue(value, columnsPre[a]['#text'], detailsStructure.get(columnsPre[a]['@fieldid']).showText);
                        detailstext = prepareTextToShow(adjDetails, true);
                     }
                    /////////////////////////////////////////////
                      var detailsLabel = detailsStructure.get(columnsPre[a]['@fieldid']).fieldLabel;
                      
                      if (!partAppraisersJson) {
                        partAppraisersJson = this.partAppraisersJson;
                      } else {
                        this.partAppraisersJson = partAppraisersJson;
                      }
                      
                      var partAppraisers = $A();
                      if (columnsPre[a]['@fieldid'].include("_PAPP")) {
                        partAppraisers = objectToArray(partAppraisersJson.yglui_str_pfm_part_appraisers);
                        if (partAppraisers[pappCommentCtr]) detailsLabel = detailsLabel + " (" + partAppraisers[pappCommentCtr]['@vorna'] + " " + partAppraisers[pappCommentCtr]['@nachn'] + ")";
                        pappCommentCtr++;
                      }                      
                      else if (columnsPre[a]['@fieldid'].include("PAPP")) {
                        partAppraisers = objectToArray(partAppraisersJson.yglui_str_pfm_part_appraisers);
                        //if (partAppraisers[pappRatingCtr]) detailsLabel = detailsLabel + " (" + partAppraisers[pappRatingCtr]['@vorna'] + " " + partAppraisers[pappRatingCtr]['@nachn'] + ")";
                        if (partAppraisers[pappRatingCtr]) detailsLabel = this.labels.get('rating') + " (" + partAppraisers[pappRatingCtr]['@vorna'] + " " + partAppraisers[pappRatingCtr]['@nachn'] + ")";
                        pappRatingCtr++;
                      }       
                    /////////////////////////////////////////////                      
                    var detailsHTML = new Element('div',{'class':'PFM_groupLayout_details_area'}).insert("<div class='PFM_simpleTable_labels application_main_soft_text'>" + detailsLabel + ": </div><div class='PFM_groupLayout_details_info'>" + detailstext + "</div>");
                    var rowDetail = {
                        id: key_str + '_' + columnsPre[a]['@fieldid'],
                        groupBy: key_str,
                        value: detailsHTML
                    }
                    detailRows.push(rowDetail);
                }
            } //end for (var a=0;a<columnsPre.length;a++)
            //GROUPING ELEMENT
            if (grouped) {
                if (existingGroupers.indexOf(element.ehead['@group_by']) == -1) {
                    var bubble_value = Object.isEmpty(element.ehead['@bubble_group']) ? -1 : parseInt(element.ehead['@bubble_group'], 10);
                    var bubble_group = this.getBubbleColor(bubble_value);
                    var groupingColumn = {
                        id: element.ehead['@group_by'],
                        groupBy: -1,
                        value: element.ehead['@group_by'],
                        icon: bubble_group,
                        icon_lite: {code: this.getBubbleArialCode(bubble_value),title:global.getLabel('status')}
                    }
                    
                    
                    rowsPost.push(groupingColumn);
                    existingGroupers.push(element.ehead['@group_by']);
                }
            }
            var bubble_value = Object.isEmpty(element.ehead['@bubble']) ? -1 : parseInt(element.ehead['@bubble'], 10);
            var bubble = this.getBubbleColor(bubble_value);
            var bubble_lite = this.getBubbleArialCode(bubble_value);
            //once we have the columns, build the row JSON
            if(!Object.isEmpty(element.ehead['#text'])){
                element.ehead['@name'] = prepareTextToShow(element.ehead['#text']);    
            }
            var rowMainElement = {
                id: key_str,
                groupBy: grouped ? element.ehead['@group_by'] : -1,
                value: element.ehead['@name'],
                icon: bubble,
                columns: columnsPost,
                icon_lite: {code: bubble_lite,title:global.getLabel('status')}
            }
            rowsPost.push(rowMainElement);
            //insert details
            for (var q = 0; q < detailRows.length; q++) {
                rowsPost.push(detailRows[q]);
            }
        } //end for(var j=0; j< rowsPre.length; j++)
        //Now, we put all the parts together to form the groupLayout JSON
        var newJson = {
            headers: headersPost,
            elements: rowsPost
        };
        return newJson;
    },
    /**
    *@description Gets picture for that id
    */
    getPicture: function(id, target) {
        this.loaded = false;
        this.id = id;
        this.img = document.createElement('img');
        this.img.id = 'img' + id;
        this.virtualHtml.down('[id=' + target + ']').insert(this.img);
        if (!Object.isEmpty(id)) {
            var xmlin = ""
                + "<EWS>"
                    + "<SERVICE>" + this.getPictureService + "</SERVICE>"
                    + "<OBJECT TYPE=''/>"
                    + "<DEL/><GCC/><LCC/>"
                    + "<PARAM>"
                        + "<I_V_CONTENT_ID>" + id + "</I_V_CONTENT_ID>"
                    + "</PARAM>"
                + "</EWS>";

            var url = this.url;
            while (('url' in url.toQueryParams())) {
                url = url.toQueryParams().url;
            }
            url = (Object.isEmpty(Object.values(((url).toQueryParams()))[0])) ? url + '?xml_in=' : url + '&xml_in=';
            this.img.src = url + xmlin;
        } else {
            this.img.src = this.noPicture;
        }
        this.img.style.width = '75px';
    }    
});
// This is not part of the Parent PFM application. It is just here for use in the inbox.
   function openPerformanceDoc(docId) {
        global.open($H ( { app: { 
                           appId: 'PFM_ODOC', 
                           tabId: 'PFM_REV',
                           view: 'PFM_ShowDocs'
                           },
                           idOfDoc: docId, 
                           previousApp: 'IN_TSK',
                           previousView: 'inbox'
                         }
                       )
                   );
   };
// DO NOT PLACE ANY parentPFM code under here