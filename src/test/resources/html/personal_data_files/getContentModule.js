var getContentModule = Class.create(Application,
/**
* @lends getContentModule
*/
    {
    /**
    * 8 layers can be found, and each of them have:
    *
    *    nameLayer: function() method         --> this method will be called by the layer above.
    *    getDataNameLayer: function() method  --> this method will split the related json into the needed pieces.
    *    getHtmlNameLayer: function() medthod --> this method will build the layer HTML joining the layers below results.
    *       
    */

    /*
    *   PARAMETERS AVAILABLE:
    *              (*)=mandatory
    *
    *   (*)appId: appId of the application, used naming elements
    *   (*)json: json object, answer of a get_content request
    *   jsonCreateMode: in some cases, if we are in edit mode and a record is empty, it is necessary to show
    *                   a record in create mode. For this purpose, we pass the same json in create mode (normally an answer of calling to
    *                   get_content with okcode='NEW'
    *   mode: create, edit or display(default)
    *   showCancelButton: false by default, if true, a cancel button is added, even if it's not included on the xml.
    *   showLoadingPAI: true by default, if true, a loading message will appear at the top of the page when a PAI event is triggered.
    *   buttonsHandlers: a hash where we define the function executed when a button is clicked.
    *                   We have two special names:
    *                      DEFAULT_EVENT_THROW: If defined, it will be fired when a buttons is not defined with its exact button action.
    *                      paiEvent: If defined, this callback function will be executed when the user changes a field with a service_pai defined.
    *                   Example:
    *                   buttonsHandlers: $H({
    *                       REC_ADCHANGEPERMADDR : function(){alert('example of button handler')},
    *                       DEFAULT_EVENT_THROW  : 'EWS:buttonClickedIn'+this.appId,
    *                       paiEvent: function(){alert('PAI event fired')}
    *                   })
    *   cssClasses: Used in order to get css flexibility for each stream. Here we can change a standard css class used on the fieldsPanel.
    *               So, if a css class appears here, all elements with this css class in the fieldsPanel will have the customized class instead of the standard one.
    *               Example where we change all elements with float left into float right:
    *                  cssClasses: $H({
    *                       fieldDispFloatLeft : 'fieldDispFloatRight'
    *                  })
    *  fieldDisplayerModified: Event launched when a fieldDisplayer has changed.
    *  predefinedXmls: Hash with custom xmls. If defined, the fieldDisplayer with this fieldid, will use this xml in order to retrieve the possible values
    *                  predefinedXmls: $H({
    *                       fieldDisplayerId : '<EWS>...</EWS>'
    *                  })
    *  linkTypeHandlers: Hash with handlers executed when a fieldDisplayer is linkToHandler (field_format = 'E')
    *                      This handler will be fired when the user clicks on this link.
    *                  linkTypeHandlers: $H({
    *                       fieldDisplayerId : function(){alert('you clicked the link with fieldid '+ fieldDisplayerId)}
    *                  })
    * getFieldValueAppend: 	Hash that contains pieces of XML that should be appended to the XMLS sent to get_field_values
    * 						The key for each element will be be the field id, or "*" if we want to apply it for every field.
    * 						In case the * is  defined, and a xml for a field is also defined, the second one will be used.
    * hideButtonsOnEdit:	Boolean that indicates if we should disable the screen navigation buttons in edit mode. 
    * hideButtonsOnCreate:	Boolean that indicates if we should disable the screen navigation buttons in create mode. 
    * objectId:             Defined if we want to use a different objectId when calling or values. If not set we'll use the one in global 
    * objectType:           Defined if we want to use a different objectType when calling or values. If not set we'll use the one in global
    * tContent:             Hash with options for the tContent part. Each screen should have its options (key = screen number):
    *       - customFunctions: //They will be called when clicking the save button.
    *           - edit/add/delete:
    *               - f: The function to execute. When executing we will pass some parameters to it as first parameter (seqnr, jsonElement, HTMLElement)
    *               - order: Order of execution: (default: "customThenDefault")
    *                   · "customThenDefault": executes first the custom function, then the default one.
    *                   · "defaultThenCustom": executes first the default function, then the custom one.
    *                   · "onlyCustom": only executes custom function.
    *       - showAddButton: If we want to show or not the add button.
    *       - maxRows: Maximum number of rows to allow.
    *       - minRows: Minimum number of rows (if there are less the valide function will alert.
    */
    initialize: function($super, options) {
        $super(options);
        /**
        * The module dynamic layers Hash.
        */
        this.labels = $H();
        /**
        * Hash to keep the buttons handlers of all the layers.
        */
        this.buttonsHandlers = $H();
        /**
        * Boolean variable, if true (default), a cancel button will be shown.
        *In the future, it will be desirable to delete this attribute, since all buttons, including cancel,
        *should come in the xml.
        */
        this.showCancelButton = false;
        /**
        * Boolean variable, if true (default), when a PAI event is triggered, the page will be updated with a loading message.
        */
        this.showLoadingPAI = true;
        /**        
        * Boolean variable, if false (default), there are no optional screens configured.
        */
        this.on_nodefault = false;
        /**
        * Hahs to keep the booleans that says if the buttons are shown or not.
        */
        this.defaultShowButtons = $H({
            edit: true,
            display: false,
            create: true
        });
        /**
        * Default buttons handlers Hash.
        */
        this.defaultButtonsHandlers = $H({
            paiEvent: function(args) {
                alert('Please set a custom paiEvent handler');
            }
        });
        /**
        * Sencondary screens Hash.
        */
        this.secondaryScreens = $H();

        /**
        * Hash that contains pieces of XML that should be appended to the XMLS sent to get_field_values
        * The key for each element will be be the field id, or "*" if we want to apply it for every field.
        * In case the * is  defined, and a xml for a field is also defined, the second one will be used.
        */
        this.getFieldValueAppend = $H();

        /**
        * Boolean that indicates if we should hide the screen navigation buttons in edit mode.
        */
        this.hideButtonsOnEdit = true;
        /**
        * Boolean that indicates if we should hide the screen navigation buttons in create mode.
        */
        this.hideButtonsOnCreate = true;

        this.dummyClassDependenceFields = "dependFieldClass";
        this.dummyClassFatherDependenceFields = "fatherDependFieldClass";
        this.variant = $H();
        this.dateRanges = $H();
        /**
        * The sepOptions method will initialize and get the module main options. For example:
        * this.json will keep the JSON object argument got from SAP(by a get_content service call).
        */
        this.setOptions(options);
        this.optionalsScreens = $H();
        this.setOptionalScreens();
        this.getVariant();
        this.setDateRanges();
        /**
        * Random id to avoid equal event names in getContentModules in the same application, screen and record.
        */
        this.randomId = Math.floor(Math.random() * 100000) + "";
        /**
        * this hashes below will keep the layers related data(all the info should be kept so as the rest
        * of the layers can access it)
        */
        /**
        * this.tables keeps all the tcontents simpleTable objects related. Accessed by screenId,regId and appId.
        */
        this.tables = $H();

        /** Structures for screen mode layer **/
        // currentScreen -> screen being built at the moment

        this.currentScreen = null;

        /** Structures for list mode layer **/
        // listModeTable -> last list mode layer added
        // listModeTableHash -> all list mode layers, to be accessed by screen id

        this.listModeTableHash = new Hash();
        this.listModeTableElementHash = new Hash();
        this.listModeTableNoResultsDivHash = new Hash();

        /**
        * this.tcontent_empty stores the tcontent node per screen which are used when we add a new row
        */
        this.tcontent_empty = $H();
        /**
        * Layers Hashes. 
        */
        this.applicationLayerData = $A();
        this.screensNavigationLayerData = $H();
        this.translationsLayerData = $H();
        this.listModeLayerData = $H();
        this.registersNavigationLayerData = $H();
        this.uiModeLayerData = $H();
        this.subModulesLayerData = $H();
        this.groupingLayerData = $H();
        this.fieldDisplayerData = $H();
        this.subModulesInstances = $H();
        this.currentMode = $H();
        //Keeps track of the fields that have other fields depending on them
        this.visualDependencyCat = $H();
        this.visualDependencies = $H();
        this.groupVisualDependencies = $H();
        this.groupNoDependents = $H();
        this.screensInformation = $H();
        //Keeps track of the shown register for every screen
        this.shownRegister = $H();
        /**
        * All the fieldDisplayer objects that have been created. Used in destroy() method.
        */
        this.fieldDisplayers = $H();
        /**
        * All the fieldDisplayer objects that have been created. Used in destroy() method.
        */
        this.buttons = $H();
        /**
        * Hash that stores info about every tContent in the getContent
        * Keys will be <screen>_<record>
        * Each object insidee will have:
        *    - jsonRowContainer: the json element that has the row elements 
        *    - jsonRows: a hash containing each row in the json. key will be rowId
        *    - simpleTableObject: the simpleTable object used to display the table
        *    - simpleTableData: the simpleData to create it the first time
        *    - originalValues: stores the values we had before editing a row, in case we hit cancel 
        *    - settings: the settings for the fields inside
        *    - rowPAI: pai to call when changing a full row(if it exists)
        */
        this.tContent = $H();
        /**
        * Hash that contains the info related to "Send document"
        * Attributes:
        *    buttonInfo: Info associated to the Send Document button (info coming from backend)
        *    element: The DOM element where we'll insert status messages 
        *    uploadStatus: Status of the upload: "notStarted", "correct", "error"
        *    listeningTo: Hash with the names of the events that are being listened to because of this "Send document"
        *    documents: Hash with all the documents to send. Each document is a piece of XML or JSON coming form backend
        *               that has fieldsource='D'
        */
        this.sendDocumentInfo = $H();
        /**
        * Class attribute used to keep the screenMode got from the screen config under <o_widget_screens>
        */
        this.screenMode = null;
        /**
        * Getting the resulting HTML from the layer on top.
        */
        this.applicationLayer();

        /**
        * Here a default handler is assigned to manage the different fieldDisplayers paiEvents. 
        */
        this.paiHandler = function(args) {
            if (this.showLoadingPAI && this.mode != 'display') {
                this.loadingMessage.update(global.getLabel('loading') + '...');
                this.loadingMessage.show();
            }
            this.getButtonHandler('paiEvent').bind(this, args).call();
        } .bind(this)
        this.helpClickedHandler = function(args) {
            document.fire("EWS:helpOnWidget", { widId: this.appId, selected: this.currentSelected, mode: this.mode });
        } .bind(this);
        /**
        * Observing the paiEvent.
        */
        this._startObserving('EWS:getContentModule_paiEvent_' + this.appId + this.name + this.randomId, this.paiHandler);
        this._startObserving('EWS:getContentModule_tContentPaiEvent_' + this.appId + this.name + this.randomId, this.paiHandlerTContent.bindAsEventListener(this));
        this._startObserving("EWS:widgetHelpClicked" + this.appId, this.helpClickedHandler);
        if (!Object.isEmpty(this.fieldDisplayerModified)) {
            this.screenChangesbinding = this.screenChanges.bindAsEventListener(this);
            this._startObserving(this.fieldDisplayerModified, this.screenChangesbinding);
        }
    },
    //****************************************************************
    //TOOLS
    //****************************************************************

    /**It returns the button
    * @param type {String} type type of section to look for
    * @param action {String} button action
    * @param object {Hash} hash of buttons of the same section
    * @param record {int} number of record
    * @param screen {int} number of screen
    */
    lookForButton: function(type, action, object, record, screen) {
        var auxButton = null;
        switch (type) {
            case "viewMore":
                break;
            case "uiButtons":
                if (record) {
                    var aux = object.get(record);
                    if (aux.get("getContent_" + action)) {
                        auxButton = aux.get("getContent_" + action)
                    }
                }
                break;
            case "ScreenNavigation":
                if (object.get("screensNavigationLayer_link_" + action)) {
                    if (Object.isElement(object.get("screensNavigationLayer_link_" + action))) {
                        auxButton = object.get("screensNavigationLayer_link_" + action);
                    }
                    else {
                        auxButton = object.get("screensNavigationLayer_link_" + action)[1];
                    }
                }
                break;
            case "Translation":
                if (screen) {
                    if (object.get("screensNavigation_button_" + screen + "_" + action)) {
                        auxButton = object.get("screensNavigation_button_" + screen + "_" + action)[1];
                    }
                }
                break;
            case "JsonButtons":
                if (object.get("applicationsLayer_button_" + action)) {
                    auxButton = object.get("applicationsLayer_button_" + action)[1];
                }
                break;
            default:
                break;
        }
        return auxButton;
    },
    /**It returns the html of a given button id
    * @param type {String} type type of section to look for
    * @param action {String} button action
    * @param record {int} number of record
    * @param screen {int} number of screen
    */
    getButton: function(action, record, screen, type) {
        var objectReturned = null;
        if (Object.isEmpty(type)) {
            var keys = this.buttons.keys();
            for (var i = 0; i < keys.size(); i++) {
                var object = this.buttons.get(keys[i]);
                var objectAux = this.lookForButton(keys[i], action, object, record, screen);
                if (!Object.isEmpty(objectAux)) {
                    objectReturned = objectAux;
                    break;
                }
            }
        }
        else {
            var object = this.buttons.get(type);
            objectReturned = this.lookForButton(type, action, object, record, screen);
        }
        return objectReturned;
    },
    /**It returns the button handler function, looking for it in the hash that the developer will provide.
    * @param buttonAction {String} button action generally provided by SAP
    */
    getButtonHandler: function(buttonAction, okcode, screen, recKey, label_tag, tarap, tarty, type) {
        var handler = null;
        if (this.buttonsHandlers.get(buttonAction)) {
            //button handler defined in the hash by the developer
            handler = this.buttonsHandlers.get(buttonAction);
        } else {
            if (this.defaultButtonsHandlers.get(buttonAction)) {
                //button handler defined in the default handlers hash
                handler = this.defaultButtonsHandlers.get(buttonAction);
            } else {
                //no handler defined for this button, empty function applied
                if (this.buttonsHandlers.get('DEFAULT_EVENT_THROW')) {
                    handler = function() {
                        document.fire(this.buttonsHandlers.get('DEFAULT_EVENT_THROW'), { action: buttonAction, okcode: okcode, screen: screen, recKey: recKey, label_tag: label_tag, tarap: tarap, tarty: tarty, type: type });
                    } .bind(this);
                } else {
                    //while migrating, we show an alert
                    handler = function() {
                        alert('Please, set a buttonHandler for ' + buttonAction);
                    } .bind(this);
                }
            }
        }
        return handler;
    },

    /**
    * Tells if the getContent is in "screens mode"
    */
    isScreenMode: function() {
        if (!Object.isEmpty(this.json.EWS.o_widget_screens['@screenmode'])) {
            return true;
        } else {
            return false;
        }
    },
    /**
    * Gets the selected screen. Will return null if we are in screens mode.
    */
    getSelectedScreen: function() {
        if (this.isScreenMode()) {
            return null;
        } else {
            return this.currentSelected;
        }
    },
    /**
    * Gets the selected record for a screen. If no screen is defined, we would use the actual one.
    * Will return null if we are in screens mode, or the actual screen is in listMode.
    * @param {Object} screen The screen we want to get the actual record for (optional).
    */
    getSelectedRecord: function(screen) {
        if (this.isScreenMode()) {
            return null;
        }
        if (Object.isEmpty(screen)) {
            var screen = this.getSelectedScreen();
        }
        //Check this.recordsSelectedScreen hash
        if (Object.isEmpty(this.shownRegister) || Object.isEmpty(this.shownRegister.get(screen))) {
            return null;
        } else {
            return this.shownRegister.get(screen);
        }
    },
    /**
    * Changes the focus of the html document to the field which fired a PAI event and has put
    * its data in global in order to restore focus after a PAI event reloads the field panel
    */
    setFocus: function() {
        if (!Object.isEmpty(global.focusFieldID)) {
            //We need to search in both "edit" and "create", because the first time the getContent is created in "create" mode,
            //so the focusField contains "create" mode, but after creating the new getContent, it will be in "edit" mode
            var focusFieldGroup = this.fieldDisplayers.get(global.focusFieldID.appId + "create" + global.focusFieldID.screen + global.focusFieldID.record);
            if (Object.isEmpty(focusFieldGroup))
                focusFieldGroup = this.fieldDisplayers.get(global.focusFieldID.appId + "edit" + global.focusFieldID.screen + global.focusFieldID.record);
            if (!Object.isEmpty(focusFieldGroup))
                var focusField = focusFieldGroup.get(global.focusFieldID.id);
            if (!Object.isEmpty(focusField)) {
                focusField.setFocus();
                global.focusFieldID = null;
            }
        }
    },
    /**It returns the proper field label text, depending on the field settings.
    * @param fieldId {String} field id.
    * @param labelType {String} field label type.
    * @param labelValue {String} field label text.
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
                ret = (!Object.isEmpty(labelValue)) ? labelValue : '';
                break;
            //If no @label_type setting --> Label from the get_content JSON labels node, and if that does not exist, then from global                                                           
            case "":
            default:
                ret = (!Object.isEmpty(this.labels.get(fieldId))) ? this.labels.get(fieldId) : global.getLabel(fieldId);
                break;
        }
        return ret;
    },
    /**It creates a class attribute with the same name, type and value as the argument passed to the initialize() method.
    * @param options {Object} getContentModule initialize() parameters.
    */
    setOptions: function(options) {
        this.mode = 'display';
        if (!Object.isEmpty(options)) {
            for (option in options) {
                if (!Object.isEmpty(options[option]))
                    this[option] = options[option];
            }
        }
        //Creating the div for errors: it has to be created early on, because we will be inserting the
        //error messages in the lower layers
        this.errorsDiv = new Element('div', {
            'id': 'fieldErrorMessage_' + this.appId,
            'class': 'fieldClearBoth application_main_error_text fieldDispTotalWidth fieldPanel'
        });
        //setting labels
        if (this.json && this.json.EWS.labels && this.json.EWS.labels.item) {
            objectToArray(this.json.EWS.labels.item).each(function(label) {
                this.labels.set(label['@id'], label['@value']);
            } .bind(this));
        }
        //hash that represents if the buttons are shown or not
        if (this.showButtons) {
            if (Object.isEmpty(this.showButtons.get('edit')))
                this.showButtons.set('edit', this.defaultShowButtons.get('edit'));
            if (Object.isEmpty(this.showButtons.get('create')))
                this.showButtons.set('create', this.defaultShowButtons.get('create'));
            if (Object.isEmpty(this.showButtons.get('display')))
                this.showButtons.set('display', this.defaultShowButtons.get('display'));
        } else {
            this.showButtons = this.defaultShowButtons;
        }
        if (global) {
            this.options.population = global.getPopulationName(global.currentApplication);
        }
        if (Object.isEmpty(options.objectType) && this.options.population != "NOPOP") {
            this.options.objectType = global.getEmployee(global.getSelectedEmployees().first()).type;
        }
        if (Object.isEmpty(options.objectId) && this.options.population != "NOPOP") {
            this.options.objectId = global.getSelectedEmployees().first();
        }
    },
    /**It returns the module HTML element (result of properly join all the layers HTML generated).
    * @return HTML element
    */
    getHtml: function() {
        this.fixCss();
        return this.element;
    },
    /**
    * It applies the defined css contained in the hash cssClasses (parameter)
    * @param {Object} from If defined we will only change styles from this Element
    */
    fixCss: function(from) {
        //hash with css classes that we want to overwrite
        if (this.cssClasses) {
            this.cssClasses.each(function(cssClass) {
                if (Object.isEmpty(from)) {
                    this.element.descendants().each(function(element) {
                        if (element.hasClassName(cssClass.key)) {
                            element.removeClassName(cssClass.key);
                            element.addClassName(cssClass.value);
                        }
                    } .bind(this));
                } else {
                    if (from.hasClassName(cssClass.key)) {
                        from.removeClassName(cssClass.key);
                        from.addClassName(cssClass.value);
                    }
                    from.descendants().each(function(element) {
                        if (element.hasClassName(cssClass.key)) {
                            element.removeClassName(cssClass.key);
                            element.addClassName(cssClass.value);
                        }
                    } .bind(this));
                }

            } .bind(this));
        }
    },

    /**
    * Updates the data of a field. It can receive a xml text to use it as service call, instead of the default get_values service
    * @param {Object} fieldId The id of the field
    * @param {Object} screen The screen of the field ("1" by default)
    * @param {Object} record The record of the field ("0" by default)
    * @param {Object} xmlin If set, uses this XML to call the service to get the values of the fields.
    */
    refreshField: function(fieldId, screen, record, xmlin) {
        if (Object.isEmpty(fieldId)) {
            return;
        }
        var mode = this.mode;
        var appId = this.appId;
        if (Object.isEmpty(screen)) {
            screen = "1";
        }
        if (Object.isEmpty(record)) {
            record = "0";
        }

        if (!Object.isEmpty(this.fieldDisplayers.get(appId + mode + screen + record))) {
            //If we have the fields for this scenario stored
            var fieldDisplayer = this.fieldDisplayers.get(appId + mode + screen + record).get(fieldId);
            if (!Object.isEmpty(fieldDisplayer)) {
                fieldDisplayer._getFieldValues(null, xmlin);
            }
        }
    },
    /**
    * Sets an alternative objectId to use when asking for values for the fields
    * @param {Object} objectId
    */
    setObjectId: function(objectId) {
        this.options.objectId = objectId;
        var fdsKeys = this.fieldDisplayers.keys();
        for (var i = 0; i < fdsKeys.size(); i++) {
            var fdsScreen = this.fieldDisplayers.get(fdsKeys[i]);
            var fdsScreenKeys = fdsScreen.keys();
            for (var j = 0; j < fdsScreenKeys.size(); j++) {
                var fd = fdsScreen.get(fdsScreenKeys[j]);
                fd.options.objectId = objectId;
                //If it's an autocompleter
                if (fd.options.fieldType == "fieldTypeAutocompleter") {
                    fd._moduleInstance.setXmlToSend(fd._getXMLIn(fd.getDependencyInfo()));
                    fd._moduleInstance.callService(false);
                }
            }
        }
    },
    /**
    * Sets an alternative objectType to use when asking for values for the fields
    * @param {Object} objectType
    */
    setObjectType: function(objectType) {
        this.options.objectType = objectType;
        var fdsKeys = this.fieldDisplayers.keys();
        for (var i = 0; i < fdsKeys.size(); i++) {
            var fdsScreen = this.fieldDisplayers.get(fdsKeys[i]);
            var fdsScreenKeys = fdsScreen.keys();
            for (var j = 0; j < fdsScreenKeys.size(); j++) {
                var fd = fdsScreen.get(fdsScreenKeys[j]);
                fd.options.objectType = objectType;
                //If it's an autocompleter
                if (fd.options.fieldType == "fieldTypeAutocompleter") {
                    fd._moduleInstance.setXmlToSend(fd._getXMLIn(fd.getDependencyInfo()));
                    fd._moduleInstance.callService(false);
                }
            }
        }
    },
    /**
    * Gets the alternative objectId to use when asking for values for the fields
    */
    getObjectId: function() {
        return this.options.objectId;
    },
    /**
    * Gets the alternative objectType to use when asking for values for the fields
    */
    getObjectType: function() {
        return this.options.objectType;
    },
    /**
    * Inserts a custom field in the getContentModule
    * NOTE: it doesn't insert these field when getContent is in table mode
    * @param {Object} label The label for the field (can be text, HTML code or an HTML element). 
    * If null or undefined we just add the html without label part
    * @param {Object} html The value for the field (can be text, HTML code or an HTML element)
    * @param {Object} screen The screen where we want to insert
    * @param {Object} seqnr The position where we want to insert it. It starts at 0.
    * @return {Element} The field that has just been created (HTML Element)
    */
    insertCustomField: function(label, html, screen, seqnr) {
        var screenContainer = "";
        try {
            screenContainer = this.element.down("#screensNavigationLayer_screen_" + screen + " > #uiLayer > div");
        } catch (e) {
            //Try-catch because IE sometimes breaks with down
            screenContainer = undefined;
        }
        if (Object.isEmpty(screenContainer)) {
            try {
                screenContainer = this.element.down("#screensNavigationLayer_screen_" + screen).down();
            }
            catch (e) {
                screenContainer = undefined;
            }
        }
        if (Object.isEmpty(screenContainer)) {
            try {
                screenContainer = this.element.down("#screensNavigationLayer").down(1);
            }
            catch (e) {
                screenContainer = undefined;
            }
        }
        if (!Object.isEmpty(screenContainer)) {
            var fieldToInsert = new Element("div", {
                "class": "fieldClearBoth fieldDispTotalWidth getContentModule_rounderDiv"
            });
            //If we have a label defined, we use a standard way to show it, if not, we just insert the HTML:
            if (Object.isEmpty(label)) {
                fieldToInsert.insert(html);
            } else {
                var innerContainer = new Element("div", {
                    "class": "gcm_field gcm_displayMode"
                });
                fieldToInsert.insert(innerContainer);
                var label = new Element("div", {
                    "class": "gcm_fieldLabel gcm_displayMode test_label",
                    "title": label
                }).insert(label);
                var value = new Element("div", {
                    "class": "gcm_fieldValue gcm_displayMode test_text"
                }).insert(html);
                innerContainer.insert(label);
                innerContainer.insert(value);
            }
            //Insert the new field:
            var nextField = screenContainer.childElements()[seqnr];
            if (Object.isEmpty(nextField))
                screenContainer.insert(fieldToInsert);
            else
                nextField.insert({ before: fieldToInsert });
            return fieldToInsert;
        } else {
            return null;
        }
    },
    /**
    * Gets the fieldDisplayer object for a field
    * @param {Object} appId The appId for the getContent
    * @param {Object} mode The mode for the field displayer we want (edit, create, display)
    * @param {Object} screen The screen where the fd is. If it is empty we will use the current one
    * @param {Object} record The record where the fd is. If it is empty we will use the current one
    * @param {Object} fieldId fieldId for the field we want
    * @param {Object} isTContent true if we want a field inside a tContent
    * @param {Object} rowId if it's tContent field, the row where it should be
    * @return {FieldDisplayer} The field displayer that has these parameters.
    */
    getFieldDisplayer: function(appId, mode, screen, record, fieldId, isTContent, rowId) {
        if (Object.isEmpty(this.fieldDisplayers))
            return null;
        if (Object.isEmpty(appId)) {
            appId = this.appId;
        }
        if (Object.isEmpty(mode)) {
            mode = this.mode;
        }
        if (Object.isEmpty(screen)) {
            screen = this.currentScreen;
        }
        if (Object.isEmpty(record)) {
            record = this.currentRecordIndex;
        }
        var recordFields = this.fieldDisplayers.get(appId + mode + screen + record);
        if (Object.isEmpty(recordFields))
            return null;
        if (isTContent) {
            return recordFields.get(fieldId + "_trow_" + rowId);
        } else {
            return recordFields.get(fieldId);
        }
    },
    /**
    * Gets all the fieldDisplayers for a screen, record and mode
    * @param {Object} screen The screen where the fd is. If it is empty we will use the current one
    * @param {Object} record The record where the fd is. If it is empty we will use the current one
    * @param {Object} mode The mode for the field displayer we want (edit, create, display)
    */
    getAllFieldDisplayers: function(screen, record, mode) {
        if (Object.isEmpty(mode)) {
            mode = this.mode;
        }
        if (Object.isEmpty(screen)) {
            screen = this.currentScreen;
        }
        if (Object.isEmpty(record)) {
            record = this.currentRecordIndex;
        }
        if (!Object.isEmpty(this.fieldDisplayers))
            return this.fieldDisplayers.get(this.appId + mode + screen + record);
    },
    /**
    * Returns the XML to append for the field when it calls to its GET_FIELD_VALUES 
    * @param {Object} fieldId
    */
    getXMLToAppendForField: function(fieldId) {
        if (Object.isEmpty(this.getFieldValueAppend) || Object.isEmpty(fieldId)) {
            return null;
        }
        //First we try to use a defined XML for this field
        var result = this.getFieldValueAppend.get(fieldId);
        if (Object.isEmpty(result)) {
            //If there's no XML defined for the field, we try with a XML defined for all fields
            result = this.getFieldValueAppend.get("*");
        }
        return result;
    },
    /**
    * Changes the XML to append associated to a field
    * @param the fieldId for the field we want to change
    * @param newXML the new XML to set
    */
    setXMLToAppendForField: function(fieldId, newXML) {
        if (Object.isEmpty(this.getFieldValueAppend)) {
            this.getFieldValueAppend = $H();
        }
        this.getFieldValueAppend.set(fieldId, newXML);
        var field = this.getFieldDisplayer(null, null, null, null, fieldId, false, null);
        field.options.getFieldValueAppend = newXML;
    },
    /**
    * Get the data related with the variant
    */
    getVariant: function() {
        var settingsScreens = objectToArray(this.options.json.EWS.o_field_settings.yglui_str_wid_fs_record);
        this.possibleVariants = $H();
        for (var j = 0; j < settingsScreens.length; j++) {
            var variantId = settingsScreens[j]['@variant_fieldid'];
            var tvariantId = settingsScreens[j]['@tvariant_fieldid'];
            this.variant.set(this.options.appId + '_' + settingsScreens[j]['@screen'], {
                'variantId': '',
                'tvariantId': '',
                'variantType': '',
                'tvariantType': '',
                'defaultVariant': '',
                'defaultTvariant': '',
                'records': [],
                'tRecords': $H(),
                'screen': settingsScreens[j]['@screen']
            });
            if (!Object.isEmpty(variantId)) {
                this.variant.get(this.options.appId + '_' + settingsScreens[j]['@screen']).variantId = variantId;
                this.variant.get(this.options.appId + '_' + settingsScreens[j]['@screen']).variantType = settingsScreens[j]['@variant_type'];
                this.variant.get(this.options.appId + '_' + settingsScreens[j]['@screen']).defaultVariant = settingsScreens[j]['@default_variant'];
                if (this.options.mode != 'create') {
                    if (!Object.isEmpty(this.options.json.EWS.o_field_values)) {
                        var records = objectToArray(this.options.json.EWS.o_field_values.yglui_str_wid_record);
                        for (var i = 0; i < records.length; i++) {
                            if (records[i]['@screen'] == settingsScreens[j]['@screen']) {
                                var contents = objectToArray(records[i].contents.yglui_str_wid_content);
                                for (var h = 0; h < contents.length; h++) {
                                    var recordVariant = contents[h]['@rec_variant'];
                                    var recIndex = parseInt(contents[h]['@rec_index'], 10);
                                    this.variant.get(this.options.appId + '_' + settingsScreens[j]['@screen']).records[recIndex] = recordVariant;
                                }
                            }
                        }
                    }
                }
                else {
                    var screens = objectToArray(this.options.json.EWS.o_field_values.yglui_str_wid_record);
                    var defaultVariant = settingsScreens[j]['@default_variant'];
                    for (var i = 0; i < screens.length; i++) {
                        var record = screens[i].contents.yglui_str_wid_content;
                        record['@rec_variant'] = defaultVariant;
                    }
                }
            }
            if (!Object.isEmpty(tvariantId)) {
                this.variant.get(this.options.appId + '_' + settingsScreens[j]['@screen']).tvariantId = tvariantId;
                this.variant.get(this.options.appId + '_' + settingsScreens[j]['@screen']).tvariantType = settingsScreens[j]['@tvariant_type'];
                this.variant.get(this.options.appId + '_' + settingsScreens[j]['@screen']).defaultTvariant = settingsScreens[j]['@default_tvariant'];
                if (this.options.mode != 'create') {
                    if (!Object.isEmpty(this.options.json.EWS.o_field_values)) {
                        var records = objectToArray(this.options.json.EWS.o_field_values.yglui_str_wid_record);
                        for (var i = 0; i < records.length; i++) {
                            if (records[i]['@screen'] == settingsScreens[j]['@screen']) {
                                var contents = objectToArray(records[i].contents.yglui_str_wid_content);
                                for (var h = 0; h < contents.length; h++) {
                                    if (!Object.isEmpty(contents[h].tcontents)) {
                                        var tcontents = objectToArray(contents[h].tcontents.yglui_str_wid_tcontent);
                                        for (var cont = 0; cont < tcontents.length; cont++) {
                                            var recIndex = parseInt(contents[h]['@rec_index'], 10);
                                            var secNumber = tcontents[cont]['@seqnr'];
                                            var tvariantValue = tcontents[cont]['@rec_variant'];
                                            if (Object.isEmpty(this.variant.get(this.options.appId + '_' + settingsScreens[j]['@screen']).tRecords.get(recIndex))) {
                                                this.variant.get(this.options.appId + '_' + settingsScreens[j]['@screen']).tRecords.set(recIndex, { 'secNumber': $H() });
                                                this.variant.get(this.options.appId + '_' + settingsScreens[j]['@screen']).tRecords.get(recIndex).secNumber.set(secNumber, tvariantValue);
                                            }
                                            else {
                                                this.variant.get(this.options.appId + '_' + settingsScreens[j]['@screen']).tRecords.get(recIndex).secNumber.set(secNumber, tvariantValue);
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
            if (!Object.isEmpty(settingsScreens[j].fs_fields) && !Object.isEmpty(settingsScreens[j].fs_fields.yglui_str_wid_fs_field)) {
                var fields = objectToArray(settingsScreens[j].fs_fields.yglui_str_wid_fs_field);
            } else {
                var fields = $A();
            }
            this.possibleVariants.set(settingsScreens[j]['@screen'], { 'values': [] })
            for (var a = 0; a < fields.length; a++) {
                if (!Object.isEmpty(fields[a]['@fs_variant'])) {
                    if (!this.possibleVariants.get(settingsScreens[j]['@screen']).values.include(fields[a]['@fs_variant']))
                        this.possibleVariants.get(settingsScreens[j]['@screen']).values.push(fields[a]['@fs_variant']);
                }
            }
        }
    },

    /**
    * Sets the date ranges in the dateRanges hash
    */
    setDateRanges: function() {
        if (!Object.isEmpty(this.json.EWS) &&
           !Object.isEmpty(this.json.EWS.o_date_ranges) &&
           !Object.isEmpty(this.json.EWS.o_date_ranges.yglui_str_dates)) {
            var dateRanges = this.json.EWS.o_date_ranges.yglui_str_dates;
            dateRanges = objectToArray(dateRanges);
            dateRanges.each(function(screenDates) {
                if (!Object.isEmpty(screenDates.dates) && !Object.isEmpty(screenDates.dates.yglui_str_date_fields)) {
                    var datesJSON = {};
                    screenDates.dates.yglui_str_date_fields.each(function(date) {
                        datesJSON[date['@dateid']] = { 'date_value': date['@date_value'], 'labid': date['@labid'] };
                    } .bind(this));
                    this.dateRanges.set(screenDates['@screen'], datesJSON);
                }
            } .bind(this));
        }
    },

    resetScreenValues: function(screen, record) {
        //check if the screen exist and get the information
        if (!Object.isEmpty(this.screensInformation.get(screen))) {
            var screenInfo = this.screensInformation.get(screen);
            //check if the record exist and is included in our screen
            if (!Object.isEmpty(record) && !Object.isEmpty(screenInfo.record.get(record))) {
                this.changeToMandatory(screen, record, this, options.mode, false);
            }
            //if the record is not existing we do it for every records
            else {
                var recordskeys = screenInfo.record.keys();
                for (var i = 0; i < recordskeys.length; i++) {
                    this.changeToMandatory(screen, recordskeys[i], this.options.mode, false);
                }
            }
            //reset all the values
            this.screensInformation = $H();
        }

    },

    screenChanges: function(event) {
        var fieldName = getArgs(event).fieldName;
        var firstTime = getArgs(event).first;
        var record = getArgs(event).record;
        var screen = getArgs(event).screen;
        var value = getArgs(event).value;
        var field = getArgs(event).field;
        var type = getArgs(event).type;
        //If the event is generated by a radio group, we don't need to handle it
        if (type == "RADIO_GROUP") {
            return;
        }
        if (Object.isEmpty(this.screensInformation.get(screen))) {
            this.screensInformation.set(screen, { record: $H() });
            this.screensInformation.get(screen).record.set(record, { fields: $H() });
            this.screensInformation.get(screen).record.get(record).fields.set(fieldName, { oldValue: {}, newValue: {} });
        }
        else if (Object.isEmpty(this.screensInformation.get(screen).record.get(record))) {
            this.screensInformation.get(screen).record.set(record, { fields: $H() });
            this.screensInformation.get(screen).record.get(record).fields.set(fieldName, { oldValue: {}, newValue: {} });
        }
        else if (Object.isEmpty(this.screensInformation.get(screen).record.get(record).fields.get(fieldName))) {
            this.screensInformation.get(screen).record.get(record).fields.set(fieldName, { oldValue: {}, newValue: {} });
        }
        if (!firstTime) {
            if (Object.isEmpty(field.options.stored)) {
                if (!Object.isEmpty(field.options.value))
                    this.screensInformation.get(screen).record.get(record).fields.get(fieldName).oldValue.value = field.options.value;
                else
                    this.screensInformation.get(screen).record.get(record).fields.get(fieldName).oldValue.value = "";
                if (!Object.isEmpty(field.options.text))
                    this.screensInformation.get(screen).record.get(record).fields.get(fieldName).oldValue.text = field.options.text;
                else
                    this.screensInformation.get(screen).record.get(record).fields.get(fieldName).oldValue.text = "";
                if (!Object.isEmpty(value.id))
                    this.screensInformation.get(screen).record.get(record).fields.get(fieldName).newValue.value = value.id;
                else
                    this.screensInformation.get(screen).record.get(record).fields.get(fieldName).newValue.value = "";
                if (!Object.isEmpty(value.text))
                    this.screensInformation.get(screen).record.get(record).fields.get(fieldName).newValue.text = value.text;
                else
                    this.screensInformation.get(screen).record.get(record).fields.get(fieldName).newValue.text = "";
                field.options.stored = true;
                this.changeToMandatory(screen, record, field.options.mode);
            }
            else {
                if (!Object.isEmpty(value.id))
                    this.screensInformation.get(screen).record.get(record).fields.get(fieldName).newValue.value = value.id;
                else
                    this.screensInformation.get(screen).record.get(record).fields.get(fieldName).newValue.value = "";
                if (!Object.isEmpty(value.text))
                    this.screensInformation.get(screen).record.get(record).fields.get(fieldName).newValue.text = value.text;
                else
                    this.screensInformation.get(screen).record.get(record).fields.get(fieldName).newValue.text = "";
                this.changeToMandatory(screen, record, field.options.mode);
            }
        }
    },
    getScreenChange: function(screen, record) {
        if (!Object.isEmpty(this.screensInformation.get(screen))) {
            var fields = this.screensInformation.get(screen).record.get(record).fields;
            for (var i = 0; i < fields.keys().length; i++) {
                var field = fields.get(fields.keys()[i]);
                if ((field.oldValue.text != field.newValue.text) || (field.oldValue.value != field.newValue.value)) {
                    return true;
                }
            }
            return false;
        }
        else {
            return false;
        }
    },
    setOptionalScreens: function() {
        if (!Object.isEmpty(this.json.EWS.o_widget_screens)) {
            var screens = objectToArray(this.json.EWS.o_widget_screens.yglui_str_wid_screen);
            for (var i = 0; i < screens.length; i++) {
                if (!Object.isEmpty(screens[0].yglui_str_wid_screen)) {
                    var records = objectToArray(screens[i].yglui_str_wid_screen);
                    if (records.first()['@onsave_nodefault'] == 'X') {
                        this.on_nodefault = true;
                        this.optionalsScreens.set(records.first()['@screen'], { fields: $A(), mandatory: false });
                        var settings = objectToArray(this.json.EWS.o_field_settings.yglui_str_wid_fs_record);
                        var fields = objectToArray(settings[i].fs_fields.yglui_str_wid_fs_field);
                        for (var k = 0; k < fields.length; k++) {
                            if (fields[k]['@display_attrib'] == 'MAN') {
                                fields[k].visualOpt = true;
                                this.optionalsScreens.get(records.first()['@screen']).fields.push(fields[k]['@fieldid']);
                            }
                        }
                    }
                }
                else {
                    if (screens[i]['@onsave_nodefault'] == 'X') {
                        this.on_nodefault = true;
                        this.optionalsScreens.set(screens[i]['@screen'], { fields: $A(), mandatory: false });
                        var settings = objectToArray(this.json.EWS.o_field_settings.yglui_str_wid_fs_record);
                        var fields = objectToArray(settings[i].fs_fields.yglui_str_wid_fs_field);
                        for (var k = 0; k < fields.length; k++) {
                            if (fields[k]['@display_attrib'] == 'MAN') {
                                fields[k].visualOpt = true;
                                this.optionalsScreens.get(screens[i]['@screen']).fields.push(fields[k]['@fieldid']);
                            }
                        }
                    }
                }
            }
        }
    },

    /**
    * Get the actual values for the optional screens
    */
    getScreenInformation: function() {
        return deepCopy(this.screensInformation);
    },

    /**
    * Get the actual values for the optional screens
    */
    setScreenInformation: function(screenInformation) {
        this.screensInformation = deepCopy(screenInformation);
    },


    changeToMandatory: function(screen, record, mode, changeMode) {
        if (this.on_nodefault) {
            if (!Object.isEmpty(changeMode))
                var change = changeMode;
            else
                var change = this.getScreenChange(screen, record);
            var fieldContainerId = this.appId + mode + screen + record;
            var screenFields = this.fieldDisplayers.get(fieldContainerId);
            for (var i = 0; i < screenFields.keys().length; i++) {
                if (this.optionalsScreens.get(screen) && this.optionalsScreens.get(screen).fields.include(screenFields.keys()[i])) {
                    var field = screenFields.get(screenFields.keys()[i]);
                    if (change && !field.options.hidden) {
                        field.options.visualOpt = false;
                        if (field.options.outputOnly) {
                            field._labelElement.update("  (*)");
                        }
                        else {
                            if (!Object.isEmpty(field.mandatoryIndicator)) {
                                field.mandatoryIndicator.update('*');
                                field._element.insert(field.mandatoryIndicator);
                            }
                            else {
                                field.mandatoryIndicator = new Element('span', {
                                    'class': 'fieldDispMandatoryIndicator application_main_soft_text fieldDispFloatLeft'
                                })
                                field.mandatoryIndicator.update('*');
                                field._element.insert(field.mandatoryIndicator);
                            }
                        }
                    }
                    else {
                        field.options.visualOpt = true;
                        if (field.options.outputOnly) {
                            field._labelElement.update("");
                        }
                        else {
                            if (!Object.isEmpty(field.mandatoryIndicator)) {
                                field.mandatoryIndicator.update('');
                                field._element.insert(field.mandatoryIndicator);
                            }
                        }
                        field.setValid();
                    }
                }
            }
        }
    },
    manageVariantService: function(args) {
        var parameters = getArgs(args);
        var records = objectToArray(this.json.EWS.o_field_values.yglui_str_wid_record);
        var tfields = "";
        for (var i = 0; i < records.length; i++) {
            if (records[i]['@screen'] == parameters.screen) {
                var recIndex = records[i].contents.yglui_str_wid_content['@rec_index'];
                if (recIndex == parameters.record) {
                    var fields = records[i].contents.yglui_str_wid_content.fields;
                    if (parameters.isTContent) {
                        var rows = objectToArray(records[i].contents.yglui_str_wid_content.tcontents.yglui_str_wid_tcontent);
                        for (var j = 0; j < rows.size(); j++) {
                            if (rows[j]['@seqnr'] == parameters.rowSeqnr) {
                                tfields = rows[j].fields;
                            }
                        }
                    }
                }
            }
        }
        var reqId = this.getXMLToAppendForField(args.fieldId);
        if (!Object.isEmpty(reqId)) {
            var xml = new XML.ObjTree();
            xml.attr_prefix = '@';
            //Parsing the XML
            var data = xml.parseXML(reqId);
            var number = data.REQID;
        }
        else {
            var number = '';
        }


        var jsonin = {
            EWS: {
                SERVICE: "GET_FSVAR_VAL",
                OBJ: {
                    "#text": parameters.objId,
                    "@TYPE": parameters.objType
                },
                PARAM: {
                    APPID: this.appId,
                    WID_SCREEN: parameters.screen,
                    REQID: number,
                    STR_KEY: parameters.keyStr,
                    fields: fields,
                    tfields: tfields
                }
            }
        };
        //convert it to XML and send
        var conversor = new XML.ObjTree();
        conversor.attr_prefix = '@';
        var xmlin = conversor.writeXML(jsonin);
        this.makeAJAXrequest($H({
            xml: xmlin,
            successMethod: this.manageVariantValue.bind(this, parameters.record, parameters.screen, parameters.mode, parameters.keyStr, null, parameters.isTContent, parameters.rowSeqnr, parameters.fieldId)
        }));
    },

    /**
    * Called when a variant field has changed. It will change the field displayers, using the ones that should be used for each one.
    * @param {Object} record
    * @param {Object} screen
    * @param {Object} mode
    * @param {Object} keyStr
    * @param {Object} json
    * @param {Object} value
    * @param {Object} isTContent
    */
    manageVariantValue: function(record, screen, mode, keyStr, value, isTContent, rowSeqnr, fieldVariantId, json) {
        if (!Object.isEmpty(json))
            var variant = json.EWS.o_rec_variant;
        if (!Object.isEmpty(value))
            var variant = value;
        if (!this.possibleVariants.get(screen).values.include(variant))
            variant = null;

        //Updating rec_variant attr. in values part of the JSON, so we know which variant value we are using
        this.updateRecordVariant(variant, screen, record, isTContent, rowSeqnr);

        var fieldsCreated = $A();
        var fieldsToCreate = $H();
        var fieldsToCall = $A();
        var displayerString = this.appId + mode + screen + record;
        var displayer = this.fieldDisplayers.get(displayerString);
        var settingsScreens = objectToArray(this.json.EWS.o_field_settings.yglui_str_wid_fs_record);
        for (var i = 0; i < settingsScreens.length; i++) {
            if (settingsScreens[i]['@screen'] == screen) {
                var fields = objectToArray(settingsScreens[i].fs_fields.yglui_str_wid_fs_field);
                for (var j = 0; j < fields.length; j++) {
                    if (fields[j]['@fs_variant'] == variant || (fields[j]['@fs_variant'] == '$$' && !fieldsCreated.include(fields[j]['@fieldid'])) && fields[j]['@fieldid'] != fieldVariantId) {
                        if (fields[j]['@fs_variant'] == variant)
                            fieldsCreated.push(fields[j]['@fieldid']);
                        fieldsToCreate.set(fields[j]['@fieldid'], fields[j]);
                    }
                }
                for (var e = 0; e < fieldsToCreate.keys().length; e++) {
                    //Depending if it's tContent field, it will have a different key in the hash
                    var field = fieldsToCreate.get(fieldsToCreate.keys()[e]);
                    if (isTContent) {
                        var fieldId = field['@fieldid'] + "_trow_" + rowSeqnr;
                    } else {
                        var fieldId = field['@fieldid'];
                    }
                    var displayerObject = displayer.get(fieldId);
                    //Check if the variant has changed.
                    if (!Object.isEmpty(displayerObject) && displayerObject.options.optionsJSON.settings['@fs_variant'] != field['@fs_variant']) {
                        displayer.unset(fieldId);
                        var getFieldValueAppend = this.getXMLToAppendForField(fieldId);
                        if (field.visualOpt)
                            field.visualOpt = false;
                        var displayerHTML = this.fieldDisplayer({
                            settings: field,
                            values: displayerObject.options.optionsJSON.values,
                            screen: screen,
                            record: record,
                            key_str: keyStr,
                            getFieldValueAppend: getFieldValueAppend,
                            randomId: displayerObject.options.randomId
                        }, true, rowSeqnr, mode);
                        if (!displayerHTML.options.hidden)
                            fieldsToCall.push(displayerHTML);
                        displayerObject.destroy(displayerHTML.getHtml());
                        //Updating the last variant used:
                        displayerHTML.options.optionsJSON.settings['@fs_variant'] = variant;
                        displayer.get(fieldId).options.optionsJSON.settings['@fs_variant'] = variant;
                        if (!Object.isEmpty(displayerHTML.getHtml().parentNode))
                            this.fixCss(displayerHTML.getHtml().parentNode);
                        else
                            this.fixCss();

                    }

                }
                var newFieldDisplayer = this.fieldDisplayers.get(displayerString);

                this.setDateLinks(newFieldDisplayer);
                this.setFieldDependencies(newFieldDisplayer, true);
                for (var a = 0; a < fieldsToCall.length; a++) {
                    fieldsToCall[a].getFieldValues.bind(fieldsToCall[a]).defer();
                }
                this.validateForm(screen, record, false);
            }
        }
        this._checkGroupVisibility(screen, record);
    },
    /**
    * Updates the rec_variant attribute in the values part of the JSON
    * @param {Object} variant The new variant value
    * @param {Object} screen The screen 
    * @param {Object} record The record index
    * @param {Object} isTContent true if it's for the tContent variant, false for normal variant
    * @param {Object} rowSeqnr the row seq number if it's tContent variant
    */
    updateRecordVariant: function(variant, screen, record, isTContent, rowSeqnr) {
        //Updating rec_variant attr. in values part of the JSON, so we know which variant value we are using
        var recordValues = objectToArray(this.json.EWS.o_field_values.yglui_str_wid_record);
        for (var i = 0; i < recordValues.length; i++) {
            if (recordValues[i]['@screen'] == screen) {
                var contents = objectToArray(recordValues[i].contents.yglui_str_wid_content);
                for (var j = 0; j < contents.length; j++) {
                    var recindex = contents[j]['@rec_index'];
                    if (recindex == record) {
                        //We are in the correct record. If it is tContentField we we'll change the rec_variant attributte in different places
                        if (isTContent) {
                            var rows = objectToArray(contents[j].tcontents.yglui_str_wid_tcontent);
                            for (var k = 0; k < rows.size(); k++) {
                                if (rows[k]['@seqnr'] == rowSeqnr) {
                                    rows[k]['@rec_variant'] = variant;
                                    break;
                                }
                            }
                        } else {
                            contents[j]['@rec_variant'] = variant;
                        }
                    }
                }
            }
        }
    },
    /**
    * Will hide groups that have no visible fields and show groups that do have them.
    * @param screen
    * @param record
    */
    _checkGroupVisibility: function(screen, record) {
        var groups = this._getGroups(screen, record);
        var groupsKeys = groups.keys();
        for (var i = 0; i < groupsKeys.size(); i++) {
            groups.get(groupsKeys[i]).updateVisibility();
        }
    },
    /**
    * Gets the groups of a screen/record
    * @param screen
    * @param record
    */
    _getGroups: function(screen, record) {
        //TODO: we should store this info for each record and each screen
        var result = $H();
        if (!Object.isEmpty(this.objectPrimaryFields) && !Object.isEmpty(this.objectPrimaryFields.groupsVisualHash)) {
            result = result.merge(this.objectPrimaryFields.groupsVisualHash);
        }
        if (!Object.isEmpty(this.objectViewMore) && !Object.isEmpty(this.objectViewMore.groupsVisualHash)) {
            result = result.merge(this.objectViewMore.groupsVisualHash);
        }
        return result;
    },
    //***************************************************************
    //APPLICATION LAYER
    //***************************************************************
    /**Main Application layer method, where the info got from the get_content xml is splitted
    * depending on whether we get fieldSets related to different applications or not (like if we got
    * several old get_content service xmls all in one).   	
    */
    applicationLayer: function() {
        var html = [];
        /**
        * Looping over the different applications content.
        */
        this.getDataApplicationLayer().each(function(element) {
            /**
            * Getting the HTML from the layer below.
            */
            html.push(this.screensNavigationLayer(element));
        } .bind(this));
        /**
        * Here we get the whole module HTML.
        */
        this.element = this.getHtmlApplicationLayer(html);



    },
    /**
    * It returns the get_content xml different applications content.
    * @return Array
    */
    getDataApplicationLayer: function() {
        /**
        * Now we just return the whole get_content xml content.
        */
        this.applicationLayerData = [this.json.EWS];
        return this.applicationLayerData;
    },
    /**It builds the Application layer HTML (takes care of the application level buttons).
    * @param html {Array} HTML Elements returned by the screensNavigation layer.
    */
    getHtmlApplicationLayer: function(html) {
        //used in toggleMode
        this.oldApplicationDiv = null;
        this.applicationDiv = new Element('div', {
            'id': 'applicationLayer',
            'class': 'fieldPanel'
        });
        html.each(function(screen) {
            this.applicationDiv.insert(screen);
        } .bind(this));
        //inserting the application buttons
        this.applicationLayerData.each(function(data) {
            if (data.o_widget_screens && data.o_widget_screens.yglui_str_wid_screen.yglui_str_wid_screen)
                data.o_widget_screens.yglui_str_wid_screen = data.o_widget_screens.yglui_str_wid_screen.yglui_str_wid_screen;
            this.buttonsJson = {
                elements: [],
                defaultButtonClassName: ''
            };
            if (this.showCancelButton) {
                var aux = {
                    idButton: 'applicationsLayer_button_cancel',
                    label: global.getLabel('cancel'),
                    className: 'fieldDispFloatRight',
                    type: 'button',
                    handlerContext: null,
                    standardButton: true,
                    handler: function() {
                        this.destroy();
                        this.getButtonHandler('cancel').call();
                    } .bind(this)
                };
                this.buttonsJson.elements.push(aux);
            }
            if (data && data.o_screen_buttons && data.o_screen_buttons.yglui_str_wid_button) {
                objectToArray(data.o_screen_buttons.yglui_str_wid_button).each(function(button) {
                    //See if we have to show or not this button for this mode. This will override the showButtons parameter (if present)
                    var showInDisplay = false;
                    if (!Object.isEmpty(button['@showindisplay']) && (button['@showindisplay']).toLowerCase() == "x") {
                        showInDisplay = true;
                    }
                    var showInCreate = false;
                    if (!Object.isEmpty(button['@showincreate']) && (button['@showincreate']).toLowerCase() == "x") {
                        showInCreate = true;
                    }
                    var showInEdit = false;
                    if (!Object.isEmpty(button['@showinedit']) && (button['@showinedit']).toLowerCase() == "x") {
                        showInEdit = true;
                    }
                    var forceShow = (this.mode == "display" && showInDisplay) || (this.mode == "create" && showInCreate) || (this.mode == "edit" && showInEdit);
                    if (this.showButtons.get(this.mode) == true || forceShow) {
                        if (button && (button['@screen'] == '*' || Object.isEmpty(button['@screen']))) {
                            var aux = {
                                idButton: 'applicationsLayer_button_' + button['@action'],
                                label: this.chooseLabel(button['@label_tag']),
                                className: 'fieldDispFloatRight',
                                type: 'button',
                                handlerContext: null,
                                standardButton: true,
                                handler: this.getButtonHandler(button['@action'], button['@okcode'], button['@screen'], null, button['@label_tag'], button['@tarap'], button['@tarty'], button['@type'])
                            };
                            this.buttonsJson.elements.push(aux);
                        }
                    }
                } .bind(this));
            }
            var megaButtons = new megaButtonDisplayer(this.buttonsJson);
            var buttonsDiv = megaButtons.getButtons();
            if (this.buttonsJson.elements.size() > 0)
                this.buttons.set("JsonButtons", megaButtons.hash);
            var buttonsDivContainer = new Element('div', { 'id': 'applicationsLayerButtons', 'class': 'fieldDispTotalWidth fieldDispFloatRight' });
            buttonsDivContainer.insert(buttonsDiv);
            this.applicationDiv.insert(buttonsDivContainer);
            if (this.buttonsJson.elements.length == 0)
                buttonsDivContainer.hide();
            this.applicationDiv.insert(this.errorsDiv);
        } .bind(this));
        return this.applicationDiv;
    },
    //***************************************************************
    //SCREENS NAVIGATION LAYER
    //***************************************************************
    /**It handles and returns the proper HTML related to the several screens we could get from get_content xml.
    * @param severalScreens {JSON Object} get_content xml content where there could be several screens.
    */
    screensNavigationLayer: function(severalScreens) {
        var html = $H();
        /**
        * Here we keep and split the get_content xml content, setting a key for each screen in the 
        * this.screensNavigationLayerData Hash.
        */
        this.getDataScreensNavigationLayer(severalScreens);
        /**
        * Looping over each screen.
        */
        this.screensNavigationLayerData.each(function(element) {

            this.currentScreen = element.key;

            /**
            * Retrieving the layer below HTML.
            */
            if (element.value.get('settings')) {
                if (element.value.get('config') && element.value.get('config')['@secondary'] && !Object.isEmpty(element.value.get('config')['@secondary'])) {
                    //secondary
                    this.secondaryScreens.set(element.key, this.translationsLayer(element.value));
                } else {
                    // not secondary
                    html.set(element.key, this.translationsLayer(element.value));
                }
            } else {
                html.set(element.key, new Element('div'));
            }
        } .bind(this));
        /**
        * Mixing the HTML retrieved from the layer below and adding navigation and needed buttons.
        */
        return this.getHtmlScreensNavigationLayer(html);
    },
    /**It keeps the get_content xml content in a Hash (1 Hash key per screen).
    * @param severalScreens {JSON Object} get_content xml content where there could be several screens.
    */
    getDataScreensNavigationLayer: function(severalScreens) {
        /**
        * We set this attribute to decide how to build the screenNavigation layer HTML (in the getHtmlScreensNavigationLayer() method):
        *       - returning several widgets (one widget per screen).
        *       - or setting the navigation bar (one navigation link per screen)
        */
        this.screenMode = null;
        if (severalScreens.o_widget_screens && severalScreens.o_widget_screens['@screenmode'])
            this.screenMode = severalScreens.o_widget_screens['@screenmode']
        if (severalScreens.o_widget_screens && severalScreens.o_widget_screens.yglui_str_wid_screen) {
            /**
            * Looping over the different screens to set the structure is going to keep its related data.
            */
            if (severalScreens.o_widget_screens.yglui_str_wid_screen.yglui_str_wid_screen) {
                objectToArray(severalScreens.o_widget_screens.yglui_str_wid_screen.yglui_str_wid_screen)
                    .each(function(screen) {
                        this.screensNavigationLayerData.set(screen['@screen'], $H({
                            config: null,
                            buttons: [],
                            settings: null,
                            values: []
                        }));
                        this.screensNavigationLayerData.get(screen['@screen']).set(
                            'config', screen
                            );
                    } .bind(this));
            } else {
                objectToArray(severalScreens.o_widget_screens.yglui_str_wid_screen)
                    .each(function(screen) {
                        this.screensNavigationLayerData.set(screen['@screen'], $H({
                            config: null,
                            buttons: [],
                            settings: null,
                            values: []
                        }));
                        this.screensNavigationLayerData.get(screen['@screen']).set(
                            'config', screen
                            );
                    } .bind(this));
            }
        } else {
            if (severalScreens.o_field_settings.yglui_str_wid_fs_record) {
                //if no screens in o_widget_screens
                var i = 1;
                var selected = 'X';
                objectToArray(severalScreens.o_field_settings.yglui_str_wid_fs_record).each(function(setting) {
                    if (Object.isEmpty(setting['@screen']))
                        setting['@screen'] = i.toString();
                    if (Object.isEmpty(setting['@selected']))
                        setting['@selected'] = selected;
                    this.screensNavigationLayerData.set(i, $H({
                        config: { '@screen': setting['@screen'],
                            '@selected': setting['@selected']
                        },
                        buttons: [],
                        settings: null,
                        values: []
                    }));
                    selected = '';
                    i++;
                } .bind(this));
                selected = '';
            }
        }
        /**
        * Getting the screen related fields settings.
        */
        if (severalScreens.o_screen_buttons && severalScreens.o_screen_buttons.yglui_str_wid_button) {
            objectToArray(severalScreens.o_screen_buttons.yglui_str_wid_button)
                .each(function(button) {
                    if (button && button['@screen'] != '*' && this.screensNavigationLayerData.get(button['@screen'])) {
                        if (this.screensNavigationLayerData.get(button['@screen']).get('config'))
                            this.screensNavigationLayerData.get(button['@screen']).get('buttons').push(button);
                    }
                } .bind(this));
        }
        objectToArray(severalScreens.o_field_settings.yglui_str_wid_fs_record)
            .each(function(setting) {
                if (this.screensNavigationLayerData.get(setting['@screen'])) {
                    if (setting && setting.fs_fields) {
                        var fields = (setting.fs_fields.yglui_str_wid_fs_field) ? setting.fs_fields.yglui_str_wid_fs_field : null;
                    }
                    else {
                        var fields = null;
                    }
                    this.screensNavigationLayerData.get(setting['@screen']).set('settings', fields);
                }
                if (setting.tcontent_empty) {
                    this.tcontent_empty.set(setting['@screen'], setting.tcontent_empty);
                }
            } .bind(this));
        /**
        * Getting the screen related fields values (We could have several record nodes per screen in case
        * there are translations for instance).
        */
        if (severalScreens.o_field_values && severalScreens.o_field_values.yglui_str_wid_record) {
            var i = 1;
            objectToArray(severalScreens.o_field_values.yglui_str_wid_record)
                .each(function(values) {
                    if (Object.isEmpty(values['@screen']))
                        values['@screen'] = i.toString();
                    if (this.screensNavigationLayerData.get(values['@screen']))
                        this.screensNavigationLayerData.get(values['@screen']).get('values').push(values.contents);
                    i++;
                } .bind(this));
        }

    },
    /** It builds the screenNavigation layer HTML depending on the @screenmode value
    * @param html {Array} the different screens HTML elements.
    */
    getHtmlScreensNavigationLayer: function(html) {
        if (!Object.isEmpty(this.screenMode)) {
            //screenMode set, several widgets
            this.screensNavigationDiv = new Element('div', {
                'id': 'screensNavigationLayer',
                'class': 'getContentWidget fieldDispTotalWidth fieldClearBoth'
            });
            if (this.mode != 'display') {
                this.loadingMessage = new Element('div', { 'class': 'fieldDispHeight fieldDispClearBoth fieldDispTotalWidth' });
                this.loadingMessage.update(" ");
                this.loadingMessage.hide();
                this.screensNavigationDiv.insert(this.loadingMessage);
            }
            var column = new Element('div', {
                'id': 'screensNavigationLayer_widgetsColumn',
                'class': 'portal_column'
            });
            this.screensNavigationDiv.insert(column);
            var screensNavigationPortal;
            if (!global.liteVersion) {
                screensNavigationPortal = new Widgets.Portal([column], this.screensNavigationDiv.identify(), {});
            }
            var data = this.screensNavigationLayerData;
            html.each(function(translation) {
                var title = this.chooseLabel(data.get(translation.key).get('config')['@label_tag']);
                var content = (translation.value[0]) ? translation.value[0] : translation.value;
                content.addClassName("fieldClearBoth");
                //showing screen-specific buttons
                this.screenNavigationButtonsJson = {
                    elements: [],
                    defaultButtonClassName: ''
                };
                objectToArray(data.get(translation.key).get('buttons')).each(function(button) {

                    //See if we have to show or not this button for this mode. This will override the showButtons parameter (if present)
                    var showInDisplay = false;
                    if (!Object.isEmpty(button['@showindisplay']) && (button['@showindisplay']).toLowerCase() == "x") {
                        showInDisplay = true;
                    }
                    var showInCreate = false;
                    if (!Object.isEmpty(button['@showincreate']) && (button['@showincreate']).toLowerCase() == "x") {
                        showInCreate = true;
                    }
                    var showInEdit = false;
                    if (!Object.isEmpty(button['@showinedit']) && (button['@showinedit']).toLowerCase() == "x") {
                        showInEdit = true;
                    }
                    var forceShow = (this.mode == "display" && showInDisplay) || (this.mode == "create" && showInCreate) || (this.mode == "edit" && showInEdit);
                    if ((this.showButtons.get(this.mode) == true) || forceShow) {
                        //WE avoid adding the Send document button as screen button, it will be only shown in "create" mode
                        if (button['@action'] != "REC_SEND_DOCUMENT") {
                            var aux = {
                                idButton: 'screensNavigation_button_' + translation.key + '_' + button['@action'],
                                label: this.chooseLabel(button['@label_tag']),
                                className: 'getContentLinks fieldDispClearBoth application_action_link',
                                type: 'link',
                                handlerContext: null,
                                handler: this.getButtonHandler(button['@action'], button['@okcode'], button['@screen'], null, button['@label_tag'], button['@tarap'], button['@tarty'], button['@type'])
                            };
                            this.screenNavigationButtonsJson.elements.push(aux);
                        }
                    }
                } .bind(this));
                this.screenNavigationButtons = new megaButtonDisplayer(this.screenNavigationButtonsJson);
                this.buttons.set("Translation", this.screenNavigationButtons.hash);
                content.insert(this.screenNavigationButtons.getButtons());

                if (global.liteVersion) {
                    var wg = new widgets({
                        contentHTML: content,
                        label: title,
                        optionsButton: false,
                        closeButton: false,
                        container: column
                    });
                    wg.setContent(content);
                }
                else {
                    screensNavigationPortal.add(new Widgets.Widget('screensNavigationLayer_widget_' + translation.key, {
                        optionsButton: false,
                        closeButton: false
                    }).setContent(content).setTitle(title), 0);
                }
            } .bind(this));
            //Disable the edit buttons so we don't change the screen while editing or creating
            if ((this.mode == "edit" && this.hideButtonsOnEdit) || (this.mode == "create" && this.hideButtonsOnCreate)) {
                this.hideScreensButtons();
            } else {
                this.showScreensButtons();
            }
            return this.screensNavigationDiv;
        } else {
            //screenMode is empty, several links, when clicking on it, the related screen is shown
            this.screensNavigationDiv = new Element('div', {
                'id': 'screensNavigationLayer',
                'class': 'fieldClearBoth'
            });
            if (this.screensNavigationLayerData.keys().length > 1) {//if just one screen, no links are needed

                //we check if we want to see links or tabs in the screens navigations
                if (Object.isEmpty(global.screenNavigationLayout)) {
                    //link using megabutton
                    this.screenNavigationButtonsJson = {
                        elements: [],
                        mainClass: 'fieldPanel fieldDispFloatLeft',
                        defaultButtonClassName: ''
                    };
                    var links = null;
                    this.screensNavigationLayerData.each(function(screen) {
                        var a = 0;
                        if (Object.isEmpty(screen.value.get('config')['@secondary'])) {//not secondary
                            var aux = {
                                idButton: 'screensNavigationLayer_link_' + screen.key,
                                label: !Object.isEmpty(this.chooseLabel(screen.value.get('config')['@label_tag'])) ? this.chooseLabel(screen.value.get('config')['@label_tag']) : 'null',
                                className: 'getContentLinks fieldDispFloatLeft application_action_link',
                                type: 'link',
                                eventOrHandler: false,
                                handler: function(screensNavigationDiv, screen) {
                                    this.currentSelected = screen.key;
                                    screensNavigationDiv.select('[class=screensNavigationLayer_screen fieldDispTotalWidth fieldDispFloatLeft]').each(function(screenDiv) {
                                        screenDiv.hide();
                                    } .bind(this));
                                    screensNavigationDiv.down('[id=screensNavigationLayer_screen_' + screen.key + ']').show();
                                    this.screenNavigationButtons.hash.each(function(button) {
                                        this.screenNavigationButtons.enable(button.key);
                                    } .bind(this));
                                    this.screenNavigationButtons.setActive('screensNavigationLayer_link_' + screen.key);
                                    document.fire('EWS:screensNavigationLinksClicked');
                                } .bind(this, this.screensNavigationDiv, screen)
                            };
                            this.screenNavigationButtonsJson.elements.push(aux);
                        }
                    } .bind(this));
                    this.screenNavigationButtons = new megaButtonDisplayer(this.screenNavigationButtonsJson);
                    this.buttons.set("ScreenNavigation", this.screenNavigationButtons.hash);
                    this.screensNavigationDiv.insert(this.screenNavigationButtons.getButtons());
                    //end of link using megabutton
                }
                else {
                    var buttonsContainer = new Element('div', { 'class': 'getContent_tabs' });
                    this.screensNavigationDiv.insert(buttonsContainer);
                    var links = null;
                    var buttonsHash = $H();
                    this.ScreenNavEventsHash = $H();
                    this.screensNavigationLayerData.each(function(screen) {
                        var a = 0;
                        if (Object.isEmpty(screen.value.get('config')['@secondary'])) {//not secondary
                            var selected = screen.value.get('config')['@selected'];
                            if (!Object.isEmpty(this.chooseLabel(screen.value.get('config')['@label_tag'])))
                                var text = this.chooseLabel(screen.value.get('config')['@label_tag']);
                            else
                                var text = null;
                            if (selected) {
                                var button = new Element('div', { 'id': 'screensNavigationLayer_link_' + screen.key + '', 'class': 'getContentTabs fieldDispFloatLeft getContent_activeTab test_tab' }).insert(text);
                                this.selectedTab = button;
                                this.currentSelected = screen.value.get('config')['@screen'];
                            }
                            else {
                                var button = new Element('div', { 'id': 'screensNavigationLayer_link_' + screen.key + '', 'class': 'getContentTabs fieldDispFloatLeft getContent_inActiveTab test_tab' }).insert(text);
                            }

                            this.ScreenNavEventsHash.set('screensNavigationLayer_link_' + screen.key, button.on('click', this.goToScreen.bind(this, screen)));
                            buttonsHash.set('screensNavigationLayer_link_' + screen.key, button);
                            buttonsContainer.insert(button);

                        }
                    } .bind(this));
                    this.buttons.set("ScreenNavigation", buttonsHash);
                }
            }
            this.loadingMessage = new Element('div', { id: 'loadingMessage_' + this.name, 'class': 'fieldDispHeight fieldDispClearBoth fieldDispTotalWidth' });
            this.loadingMessage.update(" ");
            this.loadingMessage.hide();
            this.screensNavigationDiv.insert(this.loadingMessage);
            var data = this.screensNavigationLayerData;
            html.each(function(translation) {
                var selected = data.get(translation.key).get('config')['@selected'];
                var screenDiv = new Element('div', {
                    'id': 'screensNavigationLayer_screen_' + translation.key,
                    'class': 'screensNavigationLayer_screen fieldDispTotalWidth fieldDispFloatLeft'
                });
                var content = (translation.value[0]) ? translation.value[0] : translation.value;
                var buttons;
                if (this.showButtons.get(this.mode) == true) {
                    //showing screen-specific buttons
                    this.buttonsJson = {
                        elements: [],
                        defaultButtonClassName: ''
                    };
                    objectToArray(data.get(translation.key).get('buttons')).each(function(button) {
                        //WE avoid adding the Send document button as screen button, it will be only shown in "create" mode
                        if (button['@action'] != "REC_SEND_DOCUMENT") {
                            var aux = {
                                idButton: 'screensNavigation_button_' + translation.key + '_' + button['@action'],
                                label: this.chooseLabel(button['@label_tag']),
                                className: 'getContentLinks fieldDispClearBoth application_action_link',
                                type: 'link',
                                handlerContext: null,
                                handler: this.getButtonHandler(button['@action'], button['@okcode'], translation.key, null, button['@label_tag'], button['@tarap'], button['@tarty'], button['@type'])
                            };
                            this.buttonsJson.elements.push(aux);
                        }
                    } .bind(this));
                    buttons = new megaButtonDisplayer(this.buttonsJson);

                }
                screenDiv.insert(content);
                if (buttons) {
                    if (this.buttons.get("Translation"))
                        this.buttons.set("Translation", this.buttons.get("Translation").merge(buttons.hash));
                    else
                        this.buttons.set("Translation", buttons.hash);
                    var buttonContainer = buttons.getButtons();
                    buttonContainer.addClassName('getContent_screenNavigationButtonsContainer');
                    screenDiv.insert(buttonContainer);
                }
                this.screensNavigationDiv.insert(screenDiv);
                if (data.keys().length > 1) {
                    if (Object.isEmpty(selected)) {//not selected, screen hidden
                        screenDiv.hide();
                    } else {
                        this.currentSelected = translation.key;
                        if (this.screenNavigationButtons)
                            this.screenNavigationButtons.setActive('screensNavigationLayer_link_' + translation.key);
                    }
                } else {
                    this.currentSelected = translation.key;
                }
            } .bind(this));
            //Disable the edit buttons so we don't change the screen while editing
            if ((this.mode == "edit" && this.hideButtonsOnEdit) || (this.mode == "create" && this.hideButtonsOnCreate)) {
                this.hideScreensButtons();
            }
            else {
                this.showScreensButtons();
            }
            return this.screensNavigationDiv;
        }
    },
    goToScreen: function(screen) {
        this.currentSelected = screen.key;
        this.screensNavigationDiv.select('[class=screensNavigationLayer_screen fieldDispTotalWidth fieldDispFloatLeft]').each(function(screenDiv) {
            screenDiv.hide();
        } .bind(this));
        this.screensNavigationDiv.down('[id=screensNavigationLayer_screen_' + screen.key + ']').show();
        this.selectedTab.removeClassName('getContent_activeTab');
        this.selectedTab.addClassName('getContent_inActiveTab');
        var nextTab = this.screensNavigationDiv.down('[id=screensNavigationLayer_link_' + screen.key + ']');
        nextTab.removeClassName('getContent_inActiveTab');
        nextTab.addClassName('getContent_activeTab');
        document.fire('EWS:screensNavigationLinksClicked');
        this.selectedTab = nextTab;
    },
    /*
    * @method displaySecondaryScreens
    * @desc it displays a popup window with the secondary screens associated with the screenId
    */
    displaySecondaryScreens: function(screenId, title) {
        var contentElement = this.secondaryScreens.get(screenId);
        var contentHTML = new Element('div', {
            'id': 'getContentDisplayerSecondaryScreen',
            'style': 'overflow:hidden'
        });
        if (!Object.isEmpty(title)) {
            contentHTML.insert(new Element("div", {
                "class": "application_main_title3"
            }).insert(title));
        }
        contentHTML.insert(contentElement);
        var secondaryScreenPopUp = new infoPopUp({
            closeButton: $H({
                'textContent': 'Close',
                'callBack': function() {

                    secondaryScreenPopUp.close();
                    delete secondaryScreenPopUp;
                }
            }),
            htmlContent: contentHTML,
            indicatorIcon: 'information',
            width: 800
        });
        secondaryScreenPopUp.create();
    },

    /**
    * Shows the buttons that select the screen 
    */
    showScreensButtons: function() {
        //if we have links
        if (Object.isEmpty(global.screenNavigationLayout)) {
            if (!Object.isEmpty(this.screenNavigationButtons)) {
                for (var i = 0; i < this.screenNavigationButtonsJson.elements.size(); i++) {
                    if (this.screenNavigationButtonsJson.elements[i].idButton == ("screensNavigationLayer_link_" + this.currentSelected)) {
                        //If it's the active link;
                        this.screenNavigationButtons.setActive(this.screenNavigationButtonsJson.elements[i].idButton);
                    } else {
                        //If it's not the active link;
                        this.screenNavigationButtons.enable(this.screenNavigationButtonsJson.elements[i].idButton);
                    }
                }
            }
        }
        //if we have tabs
        else {
            if (!Object.isEmpty(this.buttons.get('ScreenNavigation'))) {
                //Removing the Css class to disable the button
                var screensButtons = this.buttons.get('ScreenNavigation').keys();
                for (var i = 0; i < screensButtons.length; i++) {
                    if (screensButtons[i] != "screensNavigationLayer_link_" + this.currentSelected) {
                        this.buttons.get('ScreenNavigation').get(screensButtons[i]).removeClassName('getContent_tabDisabled');
                    }
                }
                //Startings the observers for the buttons
                if (!Object.isEmpty(this.ScreenNavEventsHash)) {
                    var screenEvents = this.ScreenNavEventsHash.keys();
                    for (var j = 0; j < screenEvents.length; j++) {
                        this.ScreenNavEventsHash.get(screenEvents[j]).start();
                    }
                }
            }
        }
    },
    /**
    * Hides the buttons that select the screen
    */
    hideScreensButtons: function() {
        //if we have links
        if (Object.isEmpty(global.screenNavigationLayout)) {
            if (!Object.isEmpty(this.screenNavigationButtons)) {
                for (var i = 0; i < this.screenNavigationButtonsJson.elements.size(); i++) {
                    if (this.screenNavigationButtonsJson.elements[i].idButton == ("screensNavigationLayer_link_" + this.currentSelected)) {
                        //If it's the active link;
                        this.screenNavigationButtons.setActive(this.screenNavigationButtonsJson.elements[i].idButton);
                    } else {
                        //If it's not the active link;
                        this.screenNavigationButtons.disable(this.screenNavigationButtonsJson.elements[i].idButton);
                    }
                }
            }
        }
        //if we have tabs
        else {
            if (!Object.isEmpty(this.buttons.get('ScreenNavigation'))) {
                //adding a Css class to disable the button
                var screensButtons = this.buttons.get('ScreenNavigation').keys();
                for (var i = 0; i < screensButtons.length; i++) {
                    if (screensButtons[i] != "screensNavigationLayer_link_" + this.currentSelected) {
                        this.buttons.get('ScreenNavigation').get(screensButtons[i]).addClassName('getContent_tabDisabled');
                    }
                }
                //Stoping the observers for the buttons
                if (!Object.isEmpty(this.ScreenNavEventsHash)) {
                    var screenEvents = this.ScreenNavEventsHash.keys();
                    for (var j = 0; j < screenEvents.length; j++) {
                        this.ScreenNavEventsHash.get(screenEvents[j]).stop();
                    }
                }
            }
        }
    },

    //***************************************************************
    //TRANSLATIONS LAYER
    //***************************************************************
    /**It handles the translations layer logic, returning each translation HTML.
    * @param severalTranslations {Hash} screen Hash info and contents.
    */
    translationsLayer: function(severalTranslations) {
        /**
        * We'll know if there are tranlations for the current screen depending on this attribute.
        */
        var translations = null;
        if (severalTranslations.get('config'))
            translations = (!Object.isEmpty(severalTranslations.get('config')['@translation']) && (severalTranslations.get('config')['@translation'].toLowerCase() == 'x'));
        if (translations) {
            this.translationsLayerData = $H();
            var html = $H();
            this.getDataTranslationsLayer(severalTranslations).each(function(element) {
                severalTranslations.set('values', [element.value]);
                html.set(element.key, this.listModeLayer(severalTranslations));
            } .bind(this));
            return this.getHtmlTranslationsLayer(html);
        } else {
            return this.listModeLayer(severalTranslations);
        }
    },
    /** This method organizes the info in the needed way for the translations layer to work.
    * @param severalTranslations {Hash} screen related data.
    */
    getDataTranslationsLayer: function(severalTranslations) {
        var data = objectToArray(severalTranslations.get('values'));
        data.each(function(translation) {
            if (translation.yglui_str_wid_content && translation.yglui_str_wid_content.fields && translation.yglui_str_wid_content.fields.yglui_str_wid_field) {
                //we need to look for the translation info in a lower layer level
                objectToArray(translation.yglui_str_wid_content.fields.yglui_str_wid_field).each(function(field) {
                    if (field['@fieldid'].toLowerCase() == 'translation') {
                        var translationId = field['@value'];
                        this.translationsLayerData.set(translationId, translation);
                    }
                } .bind(this));
            }
        } .bind(this));
        return this.translationsLayerData;
    },
    /**
    * @param options {Object} getContentModule initialize() parameters.
    */
    getHtmlTranslationsLayer: function(html) {
        var translationsDiv = new Element('div', {
            'id': 'translationsLayer',
            'class': 'fieldClearBoth'
        });
        //link using megabutton
        this.buttonsJson = {
            elements: [],
            defaultButtonClassName: '',
            defaultDisabledClass: 'application_text_bolder'
        };
        var links = null;
        this.translationsLayerData.each(function(translation) {
            var title = '';
            if (translation.value.yglui_str_wid_content && translation.value.yglui_str_wid_content.fields && translation.value.yglui_str_wid_content.fields.yglui_str_wid_field) {
                //we need to look for the translation info in a lower layer level
                objectToArray(translation.value.yglui_str_wid_content.fields.yglui_str_wid_field).each(function(field) {
                    if (field['@fieldid'].toLowerCase() == 'translation') {
                        title = !Object.isEmpty(field['#text']) ? field['#text'] : global.getLabel(translation.key);
                        var key = translation.key;
                        var aux = {
                            idButton: 'translationsLayer_link_' + field['@value'],
                            label: title,
                            className: 'getContentLinks fieldDispFloatLeft application_action_link',
                            type: 'link',
                            eventOrHandler: false,
                            handler: function(translationsDiv, key) {
                                this.currentRecordIndex = translation.value.yglui_str_wid_content['@rec_index'];
                                translationsDiv.select('[class=translationsLayer_screen]').each(function(translationDiv) {
                                    translationDiv.hide();
                                } .bind(this));
                                translationsDiv.down("[id=translationsLayer_screen_" + key + "]").show();
                                links.hash.each(function(button) {
                                    links.enable(button.key);
                                } .bind(this));
                                links.disable('translationsLayer_link_' + key);
                            } .bind(this, translationsDiv, key)
                        };
                        this.buttonsJson.elements.push(aux);
                    }
                } .bind(this));
            }
        } .bind(this));
        links = new megaButtonDisplayer(this.buttonsJson);
        this.buttons.set("Links", links.hash);
        translationsDiv.insert(links.getButtons());
        //end of link using megabutton
        var data = this.translationsLayerData;
        this.translationSelected = null;
        html.each(function(translation) {
            var selected = data.get(translation.key).yglui_str_wid_content['@selected'];
            var translationDiv = new Element('div', {
                'id': 'translationsLayer_screen_' + translation.key,
                'class': 'translationsLayer_screen'
            });
            var translationHtml = (!Object.isEmpty(translation.value[0]) ? translation.value[0] : translation.value);
            translationDiv.insert(translationHtml);
            translationsDiv.insert(translationDiv);
            if (Object.isEmpty(selected)) {//not selected, screen hidden
                translationDiv.hide();
            } else {
                if (Object.isEmpty(this.translationSelected)) {//translation selected empty
                    this.translationSelected = data.get(translation.key).yglui_str_wid_content['@rec_index'];
                    links.disable('translationsLayer_link_' + translation.key);
                } else {
                    translationDiv.hide();
                }
            }
        } .bind(this));
        if ((this.translationSelected == null) && (html.keys().size() != 0)) {
            translationsDiv.down('[id=translationsLayer_screen_' + html.keys()[0] + ']').show();
            this.translationSelected = data.get(html.keys()[0]).yglui_str_wid_content['@rec_index'];
            links.disable('translationsLayer_link_' + html.keys()[0]);
        }
        return translationsDiv;
    },
    //***************************************************************
    //LIST MODE LAYER
    //***************************************************************
    /**It handles the listMode layer logic, returning several screen <contents> nodes HTML formatted as a list.
    * @param severalRows {Hash} screen specific translation Hash info and contents.
    */
    listModeLayer: function(severalRows) {
        var listMode = null;
        if (severalRows.get('config'))
            listMode = (!Object.isEmpty(severalRows.get('config')['@list_mode']) && (severalRows.get('config')['@list_mode'].toLowerCase() == 'x'));
        if (listMode) {
            this.listMode = true;
            var html = $H();
            this.getDataListModeLayer(severalRows).each(function(element) {
                //html.set(element.key, this.registersNavigationLayer([element.value, severalRows.get('settings')], severalRows.get('config')));
            } .bind(this));
            return this.getHtmlListModeLayer(html, objectToArray(severalRows.get('settings')), severalRows.get('config'));
        } else {
            if (!Object.isEmpty(severalRows.get('values')[0]) && !Object.isEmpty(severalRows.get('values')[0].yglui_str_wid_content)) {
                this.currentRecordIndex = severalRows.get('values')[0].yglui_str_wid_content['@rec_index'];
            }
            return this.registersNavigationLayer([severalRows.get('values')[0], severalRows.get('settings')], severalRows.get('config'));
        }
    },
    /**It returns the screen specific translation info splitted in the different rows the list
    * mode layer must display.  	
    * @param severalRows {Hash} screen specific translation Hash info and contents.
    */
    getDataListModeLayer: function(severalRows) {
        this.rowHeader = '';
        this.minSeqnr = null;
        objectToArray(severalRows.get('settings')).each(function(fieldSettings) {
            var a = 0;
            if (fieldSettings['@fieldtype'] && fieldSettings['@fieldtype'].toLowerCase() == 'h') {
                if (!Object.isEmpty(this.minSeqnr)) {
                    if (parseInt(fieldSettings['@seqnr'], 10) < this.minSeqnr) {
                        //this field is the row header
                        this.rowHeader = fieldSettings['@fieldid'].toLowerCase();
                        this.minSeqnr = parseInt(fieldSettings['@seqnr'], 10);
                    }
                } else {
                    //this field is the row header
                    this.rowHeader = fieldSettings['@fieldid'].toLowerCase();
                    this.minSeqnr = parseInt(fieldSettings['@seqnr'], 10);
                }
            }
        } .bind(this));
        this.listModeLayerData = $H();
        objectToArray(severalRows.get('values')).each(function(fieldValues) {
            objectToArray(objectToArray(fieldValues.yglui_str_wid_content)[0].fields.yglui_str_wid_field).each(function(field, index) {
                var settings = objectToArray(severalRows.get('settings'));
                for (var i = 0; i < settings.length; i++) {
                    if (settings[i]['@fieldid'] == field['@fieldid']) {
                        var showText = settings[i]['@show_text'];
                        if (Object.isEmpty(showText)) {
                            showText = '';
                        }
                    }
                }
                if (field['@fieldid'] && field['@fieldid'].toLowerCase() == this.rowHeader) {
                    var valueToShow = !Object.isEmpty(field['#text']) ? field['#text'] : field['@value'];
                    if (Object.isEmpty(valueToShow))
                        valueToShow = global.labels.get('viewDetails');

                    var valueToHash = !Object.isEmpty(sapToObject(valueToShow)) ? sapToDisplayFormat(valueToShow) : valueToShow;
                    if (this.listModeLayerData.get(valueToHash)) {
                        var i = 2;
                        while (this.listModeLayerData.get(valueToHash + ' (' + i + ')')) {
                            i++;
                        }
                        this.listModeLayerData.set(valueToHash + ' (' + i + ')', fieldValues);
                    } else {
                        this.listModeLayerData.set(valueToHash, fieldValues);
                    }
                    //this.listModeLayerData.get(valueToShow).yglui_str_wid_content.showText=showText;
                }
            } .bind(this));
        } .bind(this));
        return this.listModeLayerData;
    },
    /**
    * Here it is built the list mode HTML, each row will show the returned HTML by the layer below.
    * @param html {Array} registersNavigation layer HTML elements.
    * @param settings (Array) fields settings
    * @param screenConfig (Array) screen settings
    */
    getHtmlListModeLayer: function(html, settings, screenConfig) {
        var tableHeaders = [];
        var elementToReturn = new Element('div', {});
        var listModeTableNoResultsDiv = new Element('div', { 'class': 'fieldDispTotalWidth fieldDispFloatLeft pdcPendReq_emptyTableDataPart application_main_soft_text test_label' }).update(global.getLabel('noResults'));
        this.listModeTableNoResultsDivHash.set(this.currentScreen, listModeTableNoResultsDiv);

        elementToReturn.insert(listModeTableNoResultsDiv);
        var listModeTable = {
            header: $A(),
            rows: $H()
        };

        //Process settings to see which fields are to be in the header
        if (Object.isEmpty(settings)) settings = $A();
        //In this hash we'll store the settings for header fields so we can know how to print them
        var headerSettings = $H();
        for (var i = 0; i < settings.size(); i++) {
            if (settings[i]['@fieldtype'] && settings[i]['@fieldtype'].toLowerCase() == 'h') {
                //This field is a column header
                var fieldId = settings[i]['@fieldid'];
                //If we have already added it, do not add it again
                if (Object.isEmpty(headerSettings.get(fieldId))) {
                    var seqnr = parseInt(settings[i]['@seqnr'], 10);
                    headerSettings.set(fieldId, settings[i]);
                    var label = settings[i]['@fieldlabel'];
                    if (Object.isEmpty(label))
                        label = this.chooseLabel(fieldId);
                    //Insert it in the headers to create the simple table object
                    insertArrayNoOverwrite(tableHeaders, parseInt(seqnr, 10), {
                        text: label,
                        id: 'listModeTableHeader_' + fieldId
                    });
                    /*tableHeaders[parseInt(seqnr)] = {
                    text: label,
                    id: 'listModeTableHeader_' + fieldId
                    };*/
                }
            }
        }
        //Elements are ordered, we have to remove the empty elements
        listModeTable.header = $A(tableHeaders.compact());

        //Now we have the labels for the table rows, we need the values for each row:
        var valuesKeys = this.listModeLayerData.keys();
        for (var i = 0; i < valuesKeys.size(); i++) {
            //Initialize the row content for this row (each record has a row)
            listModeTable.rows.set(valuesKeys[i], { data: [], element: '' });

            var rowsData = $A();

            var value = this.listModeLayerData.get(valuesKeys[i]);
            var fields = objectToArray(objectToArray(value.yglui_str_wid_content)[0].fields.yglui_str_wid_field);

            //In "fields" we have all the values for each fields
            for (var j = 0; j < fields.size(); j++) {
                var fieldId = fields[j]['@fieldid'];
                //If the field is the headerSettings, it's a header field
                if (!Object.isEmpty(headerSettings.get(fieldId))) {
                    //is not an image
                    if (headerSettings.get(fieldId)['@fieldformat'] != 'M') {
                        var textToShow = prepareTextToShow(this._getTextToShow(fields[j], headerSettings.get(fieldId), screenConfig, value));
                        var img = null;
                    }
                    else {
                        var textToShow = null;
                        var img = prepareTextToShow(this._getTextToShow(fields[j], headerSettings.get(fieldId), screenConfig, value));
                    }
                    //Check if it is the 
                    var seqnr = parseInt(headerSettings.get(fieldId)['@seqnr'], 10);
                    var recordNumber = this.listModeLayerData.get(valuesKeys[i]).yglui_str_wid_content['@rec_index'];
                    if (listModeTable.header[0].id == ('listModeTableHeader_' + fieldId)) {
                        if (textToShow == null) {
                            textToShow = global.labels.get('viewDetails');
                        }
                        //It is the first column
                        insertArrayNoOverwrite(rowsData, seqnr, {
                            text: textToShow,
                            id: 'listModeTableField_row_' + seqnr + '_record_' + recordNumber + '_' + 'link'
                        });
                        /*rowsData[seqnr] = {
                        text: textToShow,
                        id: 'listModeTableField_row_' + seqnr + '_' + 'link'
                        };*/
                    } else {
                        insertArrayNoOverwrite(rowsData, seqnr, {
                            text: textToShow,
                            id: 'listModeTableField_row_' + seqnr + '_record_' + recordNumber + '_' + fieldId, 
                            img: img
                        });
                        /*rowsData[seqnr] = {
                        text: textToShow,
                        id: 'listModeTableField_row_' + seqnr + '_' + fieldId
                        };*/
                    }
                }
            }
            rowsData = rowsData.compact();
            var element = new Element('div', { 'class': 'GCM_recordCont' });
            this.html = html;
            /*if (!Object.isEmpty(html.get(valuesKeys[i])[0]))
                element = html.get(valuesKeys[i])[0];
            else
                element = html.get(valuesKeys[i]);
            */
            listModeTable.rows.get(valuesKeys[i]).element = element;
            for (var j = 0; j < rowsData.size(); j++) {
                listModeTable.rows.get(valuesKeys[i]).data.push(rowsData[j]);
            }
        }
        //Now we have all the data, we create the simple table object
        var simpleTableObject = new SimpleTable(listModeTable, { typeLink: true, toggleEvent: this.options.recordToggled, addContentBefore: true, functionToAddContent: this.addFieldPanelToRecord.bind(this, settings, screenConfig) });
        this.listModeTableHash.set(this.currentScreen, simpleTableObject);

        var simpleTableElement = simpleTableObject.getElement();
        this.listModeTableElementHash.set(this.currentScreen, simpleTableElement);

        elementToReturn.insert(simpleTableElement);



        if (this.listModeLayerData.keys().length == 0)
            simpleTableElement.hide();
        else
            listModeTableNoResultsDiv.hide();
        return elementToReturn;
    },
    addFieldPanelToRecord: function(settings, screenConfig, args) {
        var record = args[2].element().up();
        var recordId = record.identify().split('_')[4];
        var recordValues = objectToArray(this.json.EWS.o_field_values.yglui_str_wid_record);
        for (var i = 0; i < recordValues.length; i++) {
            var screenId = recordValues[i]['@screen'];
            var recordIndex = recordValues[i].contents.yglui_str_wid_content['@rec_index'];
            if (recordId == recordIndex && screenId == screenConfig['@screen']) {
                return this.registersNavigationLayer([recordValues[i].contents, settings], screenConfig);
            }
        }
    },
    /**
    * Gets the value to show for a field
    * @param {Object} value The "value" piece of JSON
    * @param {Object} settings The "settings" piece of JSON
    * @param {Object} screenConfig screen settings
    * @param {Object} recordConfig fields settings
    */
    _getTextToShow: function(value, settings, screenConfig, recordConfig) {
        var displayer = this.fieldDisplayer({
            settings: settings,
            values: value,
            screen: screenConfig["@screen"],
            record: recordConfig["@rec_index"],
            key_str: recordConfig["@key_str"],
            getFieldValueAppend: "",
            randomId: this.randomId
        }, true, undefined, "display", true);
        return displayer.getValueToShow();
    },

    /**
    * @method getListModeTable
    * @desc Gets the list mode given by screen
    * @param screenId screen Id
    * @returns the list mode in the given screen
    */

    getListModeTable: function(screenId) {
        return this.listModeTableHash.get(screenId);
    },

    /**
    * @method getListModeTableElement
    * @desc Gets the list mode table element by screen
    * @param screenId screen Id
    * @returns the table element in the given screen
    */

    getListModeTableElement: function(screenId) {
        return this.listModeTableElementHash.get(screenId);
    },

    /**
    * @method getListModeTableNoResultsDiv
    * @desc Gets the list mode no results div by screen
    * @param screenId screen Id
    * @returns the no-results div in the given screen
    */

    getListModeTableNoResultsDiv: function(screenId) {
        return this.listModeTableNoResultsDivHash.get(screenId);
    },

    //***************************************************************
    //REGISTERS NAVIGATION LAYER
    //***************************************************************
    /**   	
    * @param severalRegisters {Object} getContentModule initialize() parameters.
    * @param screenConfig {Object} getContentModule initialize() parameters.
    */
    registersNavigationLayer: function(severalRegisters, screenConfig) {
        if (Object.isEmpty(severalRegisters[0])) {
            //no values to show
            if (this.mode == 'display' || Object.isEmpty(this.jsonCreateMode)) {
                var noValuesElement = new Element('div');
                noValuesElement.insert('<span class="fieldDispTotalWidth fieldDispFloatLeft application_main_soft_text pdcPendReq_emptyTableDataPart">' + global.getLabel('noResults') + '</span>')
                return noValuesElement;
            } else {
                objectToArray(this.jsonCreateMode.EWS.o_field_values.yglui_str_wid_record).each(function(record) {
                    if (record['@screen'] == screenConfig['@screen']) {
                        severalRegisters[0] = record.contents;
                    }
                } .bind(this));
            }
        } else {
            //there are values to show
            if (objectToArray(severalRegisters[0].yglui_str_wid_content).length > 1) {
                //several registers
                var html = $H();
                this.getDataRegistersNavigationLayer(severalRegisters[0], screenConfig).each(function(element) {
                    html.set(element.key, this.uiModeLayer([element.value, severalRegisters[1]], screenConfig));
                } .bind(this));
                return this.getHtmlRegistersNavigationLayer(html, screenConfig);
            } else {
                //just one register
                return this.uiModeLayer([severalRegisters[0].yglui_str_wid_content, severalRegisters[1]], screenConfig);
            }
        }
    },
    /**
    * @param options {Object} getContentModule initialize() parameters.
    */
    getDataRegistersNavigationLayer: function(severalRegisters, screenConfig) {
        this.registersNavigationLayerData.set(screenConfig['@screen'], $H({}));
        objectToArray(severalRegisters.yglui_str_wid_content).each(function(content) {
            this.registersNavigationLayerData.get(screenConfig['@screen']).set(content['@rec_index'], content);
        } .bind(this));
        return this.registersNavigationLayerData.get(screenConfig['@screen']);

    },
    /**
    * @param options {Object} getContentModule initialize() parameters.
    */
    getHtmlRegistersNavigationLayer: function(html, screenConfig) {
        var screenRegisters = this.registersNavigationLayerData.get(screenConfig['@screen']);
        var registersNavigationDiv = new Element('div', {
            'id': 'registersNavigationLayer'
        });
        screenRegisters.each(function(register) {
            var registerDiv = new Element('div', {
                'id': 'registersNavigationLayer_' + register.key
            });
            registerDiv.insert(html.get(register.key));
            if (Object.isEmpty(register.value['@selected'])) {
                registerDiv.hide();
            } else {
                this.shownRegister.set(screenConfig['@screen'], register.key);
            }
            registersNavigationDiv.insert(registerDiv);
        } .bind(this));
        //inserting arrows in order to handle the registers
        var registersNavigationLeftButton = new Element('button', {
            'id': 'registersNavigationLayer_leftButton',
            'class': 'application_verticalL_arrow fieldsPanel_button_previous test_icon'
        });
        var registersNavigationButtonsSeparator = new Element('div', {
            'class': 'fieldsPanel_buttons_separator'
        });
        var registersNavigationRightButton = new Element('button', {
            'id': 'registersNavigationLayer_rightButton',
            'class': 'application_verticalR_arrow fieldsPanel_button_previous test_icon'
        });
        var registersNavigationButtonsDiv = new Element('div', {
            'id': 'registersNavigationLayer_buttonsDiv',
            'class': 'getContentRegistersNavDiv'
        });
        if (global.liteVersion) {
            var leftArrow = new Element("div");
            leftArrow.insert("\u25c4");
            var rightArrow = new Element("div");
            rightArrow.insert("\u25ba");
            registersNavigationLeftButton.writeAttribute("title", global.getLabel("previousRecord").stripTags());
            registersNavigationLeftButton.insert(leftArrow);
            registersNavigationRightButton.writeAttribute("title", global.getLabel("nextRecord").stripTags());
            registersNavigationRightButton.insert(rightArrow);
        }
        registersNavigationButtonsDiv.insert(registersNavigationLeftButton);
        registersNavigationButtonsDiv.insert(registersNavigationButtonsSeparator);
        registersNavigationButtonsDiv.insert(registersNavigationRightButton);
        registersNavigationDiv.insert(registersNavigationButtonsDiv);
        if (screenRegisters.keys().first() == this.shownRegister.get(screenConfig['@screen'])) {//disable left arrow
            registersNavigationLeftButton.hide();
        }
        if (screenRegisters.keys().last() == this.shownRegister.get(screenConfig['@screen'])) {//disable right arrow
            registersNavigationRightButton.hide();
        } else {
            //emptyDiv, it is shown in order to avoid that the right arrow 'jumps' when the left arrow is hidden
            registersNavigationButtonsSeparator.hide();
        }
        //defining left arrow behaviour
        registersNavigationLeftButton.onclick = function(registerNavigationDiv, registersNavigationRightButton) {
            //hiding current register
            registerNavigationDiv.down('[id=registersNavigationLayer_' + this.shownRegister.get(screenConfig['@screen']) + ']').hide();
            //unset "selected" attribute for the previous record
            screenRegisters.get(this.shownRegister.get(screenConfig['@screen']))['@selected'] = null;
            //decreasing shownRegister
            this.shownRegister.set(screenConfig['@screen'],
                screenRegisters.keys()[screenRegisters.keys().indexOf(this.shownRegister.get(screenConfig['@screen'])) - 1]);
            //set "selected" attribute for the new record
            screenRegisters.get(this.shownRegister.get(screenConfig['@screen']))['@selected'] = "X";
            //showing new current register
            registerNavigationDiv.down('[id=registersNavigationLayer_' + this.shownRegister.get(screenConfig['@screen']) + ']').show();
            registersNavigationButtonsSeparator.hide();
            registersNavigationRightButton.show();
            if (screenRegisters.keys().first() == this.shownRegister.get(screenConfig['@screen'])) {
                //the new shown register is the first one, hiding left arrow
                registersNavigationLeftButton.hide();
            }
        } .bind(this, registersNavigationDiv, registersNavigationRightButton);
        //right arrow behaviour
        registersNavigationRightButton.onclick = function(registerNavigationDiv, registersNavigationLeftButton) {
            //hiding current register
            registerNavigationDiv.down('[id=registersNavigationLayer_' + this.shownRegister.get(screenConfig['@screen']) + ']').hide();
            //unset "selected" attribute for the previous record
            screenRegisters.get(this.shownRegister.get(screenConfig['@screen']))['@selected'] = null;
            //increasing shownRegister
            this.shownRegister.set(screenConfig['@screen'], screenRegisters.keys()[screenRegisters.keys().indexOf(this.shownRegister.get(screenConfig['@screen'])) + 1]);
            //set "selected" attribute for the new record
            screenRegisters.get(this.shownRegister.get(screenConfig['@screen']))['@selected'] = "X";
            //showing new current register
            registerNavigationDiv.down('[id=registersNavigationLayer_' + this.shownRegister.get(screenConfig['@screen']) + ']').show();
            registersNavigationLeftButton.show();
            if (screenRegisters.keys().last() == this.shownRegister.get(screenConfig['@screen'])) {
                //the new shown register is the last one, hiding right arrow
                registersNavigationRightButton.hide();
                registersNavigationButtonsSeparator.show();
            }
        } .bind(this, registersNavigationDiv, registersNavigationLeftButton);
        return registersNavigationDiv;
    },
    //***************************************************************
    //UI MODE LAYER
    //***************************************************************
    /**
    * @param options {Object} getContentModule initialize() parameters.
    */
    uiModeLayer: function(register, screenConfig) {
        var html = null;
        if (register[0] && register[0].buttons && register[0].buttons.yglui_str_wid_button)
            var buttons = register[0].buttons.yglui_str_wid_button;
        else
            var buttons = null;
        html = this.subModulesLayer(register, screenConfig);
        this.validateForm(screenConfig['@screen'], register[0]['@rec_index'], true);
        return this.getHtmlUiModeLayer(html, buttons, screenConfig, register[0]);
    },
    /**
    * @param options {Object} getContentModule initialize() parameters.
    */
    getHtmlUiModeLayer: function(html, buttonsData, screenConfig, register) {
        if (this.mode == "create") {
            //Look for the "Send document" button in the screen buttons if we are in create mode
            var sendDocumentButton = this._getSendDocumentButton(screenConfig["@screen"]);
            if (sendDocumentButton) {
                if (!buttonsData) {
                    buttonsData = $A();
                }
                sendDocumentButton['@showincreate'] = "x";
                buttonsData.push(sendDocumentButton);
            }
        }
        if (!Object.isEmpty(buttonsData)) {
            var uiDiv = new Element('div', {
                'id': 'uiLayer'
            });
            var buttonsJson = {
                elements: [],
                defaultButtonClassName: ''
            };
            objectToArray(buttonsData).each(function(button) {
                //See if we have to show or not this button for this mode. This will override the showButtons parameter (if present)
                var showInDisplay = false;
                if (!Object.isEmpty(button['@showindisplay']) && (button['@showindisplay']).toLowerCase() == "x") {
                    showInDisplay = true;
                }
                var showInCreate = false;
                if (!Object.isEmpty(button['@showincreate']) && (button['@showincreate']).toLowerCase() == "x") {
                    showInCreate = true;
                }
                var showInEdit = false;
                if (!Object.isEmpty(button['@showinedit']) && (button['@showinedit']).toLowerCase() == "x") {
                    showInEdit = true;
                }
                var forceShow = (this.mode == "display" && showInDisplay) || (this.mode == "create" && showInCreate) || (this.mode == "edit" && showInEdit);
                var sendDocumentDiv = null; //We will use it if we have a "Send document" button
                if ((this.showButtons.get(this.mode) || forceShow) == true && button['@action'] && button['@action'].toLowerCase() != 'previous' && button['@action'].toLowerCase() != 'next') {
                    if (button['@action'] == "REC_SEND_DOCUMENT") {
                        //We manage the "Send document" button in a different way:
                        sendDocumentDiv = new Element("div", {
                            "class": "gcm_sendDocumentInfo application_main_error_text"
                        });
                        var handler = this._createSendDocumentInfo(button, screenConfig['@screen'], register['@rec_index'], sendDocumentDiv);
                    } else {
                        var handler = this.getButtonHandler(button['@action'], button['@okcode'], screenConfig['@screen'], register['@rec_index'], button['@label_tag'], button['@tarap'], button['@tarty'], button['@type']);
                    }
                    var aux = {
                        idButton: 'getContent_' + button['@action'],
                        label: this.chooseLabel(button['@label_tag']),
                        handlerContext: this,
                        handler: handler,
                        className: 'getContentLinks fieldDispFloatLeft application_action_link',
                        type: 'link'
                    };
                    buttonsJson.elements.push(aux);
                }
            } .bind(this));
            var buttons = new megaButtonDisplayer(buttonsJson);
            if (this.buttons.get("uiButtons"))
                this.buttons.get("uiButtons").set(register["@rec_index"], buttons.hash);
            else {
                var aux = $H();
                aux.set(register["@rec_index"], buttons.hash);
                this.buttons.set("uiButtons", aux)
            }
            uiDiv.insert(html);
            var buttonsElement = buttons.getButtons();
            buttonsElement.addClassName('fieldClearBoth');
            //If we have a button to send document, we store it
            if (!Object.isEmpty(buttons.hash.get('getContent_' + "REC_SEND_DOCUMENT")) && !Object.isEmpty(buttons.hash.get('getContent_' + "REC_SEND_DOCUMENT")[1])) {
                this._manageSendDocumentButton(screenConfig['@screen'], register['@rec_index'], this.mode, buttons.hash.get('getContent_' + "REC_SEND_DOCUMENT")[1]);
            }
            uiDiv.insert(buttonsElement);
            return uiDiv;
        } else {
            return html;
        }
    },

    /**
    * Looks into the screens buttons to see if we have a Send document button for this screen
    * @param {Object} screen The screen
    * @return The info for the button, null if there is no button
    */
    _getSendDocumentButton: function(screen) {
        if (this.screensNavigationLayerData && this.screensNavigationLayerData.get(screen)) {
            var buttons = this.screensNavigationLayerData.get(screen).get("buttons");
            if (buttons) {
                for (var i = 0; i < buttons.size(); i++) {
                    if (buttons[i]["@action"] == "REC_SEND_DOCUMENT") {
                        return buttons[i];
                    }
                }
            }
        }
        return null;
    },
    //***************************************************************
    //SUBMODULES LAYER
    //***************************************************************
    /**
    * @param options {Object} getContentModule initialize() parameters.
    */
    subModulesLayer: function(register, screenConfig) {
        var html = null;
        if (!Object.isEmpty(screenConfig['@dyn_panel']) && (screenConfig['@dyn_panel'] != 'H') && (screenConfig['@dyn_panel'] != 'O') && (screenConfig['@dyn_panel'] != '3')) {
            //take the language for each translation screen
            var language = '';
            for (var i = 0; i < register[0].fields.yglui_str_wid_field.length; i++) {
                if (register[0].fields.yglui_str_wid_field[i]['@fieldtechname'] == 'LANGU')
                    language = register[0].fields.yglui_str_wid_field[i]['@value'];
            }
            //dynamicFieldsPanel, all the html from this layer below is generated by the dynamicFieldsPanel module
            html = new dynamicFieldsPanel({
                mode: this.mode,
                json: this.json,
                appId: this.appId,
                screenConfig: screenConfig,
                language: language,
                typeOfScreen: screenConfig['@dyn_panel'],
                //noResultsHtml: ,
                objectType: this.objectType,
                objectId: this.objectId
                //fireEventWhenDefaultValueSet : ,
                //paiEvent : 
            }).getElement();
        } else {
            if (!Object.isEmpty(this.subModule) && !Object.isEmpty(this[this.subModule])) {
                html = this[this.subModule](register, screenConfig);
            } else {//default submodule
                html = this.fieldsPanel(register, screenConfig);
                this.subModulesInstances.set(this.appId + screenConfig['@screen'] + register[0]['@rec_index'], [register, screenConfig, $H()]);
                this.subModulesInstances.get(this.appId + screenConfig['@screen'] + register[0]['@rec_index'])[2].set(this.mode, html);
            }
        }
        //****************************************************
        return html;
    },
    /**
    * Changes the mode of a panel speficiying the part of the panel you want to switch
    * @mode The mode you want to change to
    * @appId the Application ID
    * @screen The screen to switch to
    */
    toggleMode: function(mode, appId, screen, recIndex) {
        this.currentRecordIndex = recIndex;
        this.currentScreenIndex = screen;
        this.currentAppId = appId;
        var html;
        var previousMode;
        var key = appId + screen + recIndex;
        if (this.subModulesInstances.get(key) == undefined && this.subModulesInstances.keys().size() == 1)
            key = $A(this.subModulesInstances.keys()).first();
        if (this.currentMode.get(key)) {
            previousMode = this.currentMode.get(key)
            this.currentMode.set(key, mode);
        } else {
            previousMode = this.mode;
            this.currentMode.set(key, mode);
        }
        this.mode = mode;
        if (this.subModulesInstances.get(key)[2].get(mode)) {
            var aux = this.subModulesInstances.get(key)[2].get(previousMode);
            this.subModulesInstances.get(key)[2].get(previousMode).replace(this.subModulesInstances.get(key)[2].get(mode));
            if (Object.isEmpty(this.oldApplicationDiv)) {
                this.oldApplicationDiv = this.applicationDiv;
                this.applicationDiv.update(this.subModulesInstances.get(key)[2].get(mode));
                this.applicationDiv.insert(this.errorsDiv);
            } else {
                this.applicationDiv = this.oldApplicationDiv;
                this.oldApplicationDiv = null;
            }
        } else {
            if (!Object.isEmpty(this.subModule) && !Object.isEmpty(this[this.subModule])) {
                //html = this[this.subModule](this.subModulesInstances.get(key)[0], this.subModulesInstances.get(key)[1]);
            } else {//default submodule
                html = this.fieldsPanel(this.subModulesInstances.get(key)[0], this.subModulesInstances.get(key)[1]);
                var sendDocumentDiv = new Element("div", {
                    "class": "gcm_sendDocumentInfo application_main_error_text"
                });
                var buttonSendDocument = this._manageSendDocumentButton(screen, recIndex, this.mode, null, sendDocumentDiv);
                if (!Object.isEmpty(buttonSendDocument)) {
                    html.insert(buttonSendDocument);
                    html.insert(sendDocumentDiv);
                }
            }
            this.subModulesInstances.get(key)[2].set(mode, html);
            var childs = new Array();
            $A(this.subModulesInstances.get(key)[2].get(previousMode).childNodes).each(function(item) {
                var a = 0;
                childs.push(item.remove());
            });
            this.subModulesInstances.get(key)[2].get(previousMode).insert(html);
            if (Object.isEmpty(this.oldApplicationDiv)) {
                var tmpChilds = new Array();
                $A(this.applicationDiv.childNodes).each(function(item) {
                    var a = 0;
                    var i = 0;
                    while (i < item.childNodes.length) {
                        if (item.childNodes[i] != item.firstChild)
                            item.removeChild(item.childNodes[i]);
                        else
                            i++;
                    }
                    tmpChilds.push(item);
                });
                this.oldApplicationDiv = this.applicationDiv;
                tmpChilds = tmpChilds[0].insert(html);
                this.applicationDiv.insert(tmpChilds);
                this.applicationDiv.insert(this.errorsDiv);
            } else {
                this.applicationDiv = this.oldApplicationDiv;
                this.oldApplicationDiv = null;
            }
        }
        //Disable the edit buttons so we don't change the screen while editing
        if ((this.mode == "edit" && this.hideButtonsOnEdit) || (this.mode == "create" && this.hideButtonsOnCreate)) {
            this.hideScreensButtons();
        } else {
            this.showScreensButtons();
        }
        this.fixCss();
        this.mode = previousMode;
        this.validateForm(screen, recIndex, true);
        document.fire("EWS:toggleMode", { appId: this.appId, mode: mode });
    },
    /**
    * @param options {Object} getContentModule initialize() parameters.
    */
    fieldsPanel: function(info, screenConfig) {
        objectToArray(info[1]).each(function(field) {
            if (field['@depend_type'] == 'X' || field['@depend_type'] == 'B') {
                this.visualDependencyCat.set(field['@depend_field'], true);
            }
        } .bind(this));
        this.subModulesLayerData.set('fields', []);
        this.subModulesLayerData.set('groups', this.groupingLayer(info, screenConfig));
        this.begDate = null;
        this.endDate = null;
        this.getDataSubModulesLayer(info, screenConfig).each(function(field) {
            if (this.mode == 'display' && field.values['@fieldid'] == 'BEGDA')
                this.begDate = field.values['@value'];
            else {
                if (this.mode == 'display' && field.values['@fieldid'] == 'ENDDA')
                    this.endDate = field.values['@value'];
                else {
                    var getFieldValueAppend = this.getXMLToAppendForField(field.settings['@fieldid']);
                    var displayer = this.fieldDisplayer({
                        settings: field.settings,
                        values: field.values,
                        screen: screenConfig['@screen'],
                        record: info[0]['@rec_index'],
                        key_str: info[0]['@key_str'],
                        getFieldValueAppend: getFieldValueAppend,
                        randomId: this.randomId
                    }, true);
                    //if (!displayer.options.hidden) {
                    this.subModulesLayerData.get('fields').push([field.settings, displayer.getHtml(), field.values]);
                    //}
                }
            }
        } .bind(this));

        //Once we have all the fields, we initialize their values:
        var fields = this.fieldDisplayers.get(this.appId + this.mode + screenConfig['@screen'] + info[0]['@rec_index']);
        this.setDateLinks(fields);
        this.setFieldDependencies(fields);

        return this.getHtmlSubModulesLayer();
    },

    /**
    * Sets the link between dates
    * @param {Object} fields
    */
    setDateLinks: function(fields) {
        if (!Object.isEmpty(fields)) {
            var begDate = fields.get("BEGDA");
            var endDate = fields.get("ENDDA");
            if (!Object.isEmpty(begDate) && !Object.isEmpty(endDate) &&
                !Object.isEmpty(begDate._moduleInstance) && !Object.isEmpty(endDate._moduleInstance))
                begDate._moduleInstance.linkCalendar(endDate._moduleInstance);
        }
    },
    /**
    * Sets the dependencies between fields
    * @param {Object} fields Hash with the fields we want to set the dependencies to
    * @param {Object} dontCall If we don't want to get their values yet
    * @param {Object} otherPossibleParents If there are possible parents (ie: outside the tContent)
    */
    setFieldDependencies: function(fields, dontCall, otherPossibleParents) {
        if (!Object.isEmpty(fields)) {
            var fieldsKeys = fields.keys();
            for (var i = 0; i < fieldsKeys.size(); i++) {
                var field = fields.get(fieldsKeys[i]);
                //Set the dependant fields for each one of them:
                var dependantFields = $H();
                for (var j = 0; j < fieldsKeys.size(); j++) {
                    //Check against all other field to see if they're dependent
                    if (j != i) {
                        var otherField = fields.get(fieldsKeys[j]);
                        if (!Object.isEmpty(otherField.options.dependency.field) //If it has a dependency
							&& !(otherField.options.dependency.field == "")
							&& (otherField.options.dependency.field == field.options.id) //And it's a dependency to this field 
							&& (Object.isEmpty(otherField.options.dependency.type) //And the type of dependency is logical
								|| otherField.options.dependency.type == ""
								|| otherField.options.dependency.type == "B")) {
                            dependantFields.set(fieldsKeys[j], otherField);
                        }
                    }
                }
                field.setDependantFields(dependantFields);
                //If this field depends on other (we'll call it parent)
                if (!Object.isEmpty(field.options.dependency.field) //If it has a dependency
							&& !(field.options.dependency.field == "")
							&& (Object.isEmpty(field.options.dependency.type) //And the type of dependency is logical
								|| field.options.dependency.type == ""
								|| field.options.dependency.type == "B")) {
                    var parentField = null;
                    var fieldName = field.options.dependency.field + '_trow_' + field.options.rowSeqnr;
                    if (!Object.isEmpty(fields.get(fieldName))) {
                        var parentField = fields.get(fieldName);
                    }
                    if (!Object.isEmpty(fields.get(field.options.dependency.field))) {
                        var parentField = fields.get(field.options.dependency.field);
                    }
                    if (Object.isEmpty(parentField)) {
                        if (!Object.isEmpty(otherPossibleParents) && !Object.isEmpty(otherPossibleParents.get(field.options.dependency.field))) {
                            parentField = otherPossibleParents.get(field.options.dependency.field);
                            field.forceToGetValues = true; //Since the parent is outside, we'll have to get the values for this field now, not waiting for the father to get them
                        }
                    }
                    field.setParentField(parentField);
                } else {
                    field.setParentField(null);
                }
            }
            if (!dontCall) {
                //Now that we've created every field, and the structures to control their dependencies: 
                for (var i = 0; i < fieldsKeys.size(); i++) {
                    //Only call it for the fields that don't depend logically on others, or the ones that depend on other that is outside (forceToGetValues)
                    //These fields will call the getValues methods for the fields that depend on them
                    var field = fields.get(fieldsKeys[i]);
                    if ((field.options.fieldFormat != 'A' && field.options.fieldFormat != 'S') || (field.options.id == 'SPRSL' && this.appId == 'PD_DATA')) {
                    if (Object.isEmpty(field.parentField) || !Object.isEmpty(field.forceToGetValues)) {
                        field.getFieldValues.bind(field).defer();
                    } else {
                        if (field.parentField.options.fieldType == "fieldTypeHidden") {
                            field.getFieldValues.bind(field).defer();
                            }
                        }
                    }
                }
            }
        }
    },
    displayDatesWithImage: function(begDate, endDate) {
        var beg = (!Object.isEmpty(begDate)) ? sapToDisplayFormat(begDate) : '';
        var end = (!Object.isEmpty(endDate)) ? sapToDisplayFormat(endDate) : '';
        if (!Object.isEmpty(beg) && !Object.isEmpty(end))
            end = ['&nbsp;-&nbsp;', end].join('');
        if (!Object.isEmpty(begDate) || !Object.isEmpty(endDate)) {
            var myMainElement = new Element('div', { 'class': 'fieldsPanel_DisplayRowDates' });
            var mySecElement = new Element('div', { 'class': 'fieldsPanel_dateImage' });
            myMainElement.insert(mySecElement);
            var mySpanElem = new Element('span', { 'class': 'application_main_text fieldsPanel_noWrap test_label' }).update(beg + end);
            myMainElement.insert(mySpanElem);
            return myMainElement;
        }
        else {
            return '';
        }
    },
    /**
    * @param options {Object} getContentModule initialize() parameters.
    */
    getDataSubModulesLayer: function(info, screenConfig) {
        var normalFields = [];
        var auxSettings = $H();
        var recIndex = info[0]['@rec_index'];
        var screen = screenConfig['@screen'];
        var variantAssigned = $H();
        objectToArray(info[1]).each(function(field) {
            if (!Object.isEmpty(field['@fieldid']) && !field['@fieldid'].startsWith('OPT_') && Object.isEmpty(field['@display_group']) && (field['@fieldsource'] != 'T') && (field['@fieldtype'] != 'S')) {
                if (!Object.isEmpty(this.variant.get(this.options.appId + '_' + screen))) {
                    if (this.mode != 'create')
                        var recordVariant = this.variant.get(this.options.appId + '_' + screen).records[recIndex];
                    else
                        var recordVariant = this.variant.get(this.options.appId + '_' + screen).defaultVariant;

                    if (field['@fs_variant'] == recordVariant) {
                        auxSettings.set(field['@fieldid'], field);
                        variantAssigned.set(field['@fieldid'], { assigned: true });
                    }
                    if ((Object.isEmpty(field['@fs_variant']) || field['@fs_variant'] == '$$') && Object.isEmpty(variantAssigned.get(field['@fieldid']))) {
                        auxSettings.set(field['@fieldid'], field);
                    }
                }
                else {
                    auxSettings.set(field['@fieldid'], field);
                }
            }
        } .bind(this));
        objectToArray(info[0]).each(function(reg) {
            objectToArray(reg.fields.yglui_str_wid_field).each(function(field) {
                if (!Object.isEmpty(auxSettings.get(field['@fieldid']))) {
                    normalFields.push({
                        settings: auxSettings.get(field['@fieldid']),
                        values: field
                    });
                }
            } .bind(this));
        } .bind(this));
        return normalFields;
    },
    /**
    * @param options {Object} getContentModule initialize() parameters.
    */
    getHtmlSubModulesLayer: function() {
        var div = new Element('div');
        var arrayBySeqNr = [];
        this.subModulesLayerData.get('fields').each(function(field) {
            if (!Object.isEmpty(field[0]['@depend_type']) && (field[0]['@depend_type'] == 'X' || field[0]['@depend_type'] == 'B')) {
                this.visualDependencies.set(field[0]['@depend_field'], [field[0]['@fieldid'], field[1]]);
                if (!Object.isEmpty(field[1])) {
                    field[1].removeClassName('fieldDispTotalWidth');
                    field[1].removeClassName('fieldClearBoth');
                    //field[1].addClassName('fieldDispAlignBoxFields');
                }
                if (!Object.isEmpty(field[1]) && field[1].down()) {
                    field[1].down().removeClassName('fieldDispHalfSize');
                    //field[1].down().addClassName('fieldDispAlignFieldRight');
                }
                //Adding dummy class to dependency set fields
                field[1].addClassName(this.dummyClassDependenceFields);
                if (this.getFieldDisplayer(null, null, null, null, field[0]["@depend_field"]) && this.getFieldDisplayer(null, null, null, null, field[0]["@depend_field"])._element)
                    this.getFieldDisplayer(null, null, null, null, field[0]["@depend_field"])._element.addClassName(this.dummyClassFatherDependenceFields)
            }
        } .bind(this));
        //looking for third level dependencies
        this.visualDependencies.each(function(dep1) {
            this.visualDependencies.each(function(dep2) {
                if (dep1.key == dep2.value[0]) {
                    if (dep2.value[1].identify() != dep1.value[1].identify())
                        dep2.value[1].insert(dep1.value[1]);
                }
            } .bind(this));
        } .bind(this));
        //switching fieldtechname into fieldid for dependent fields
        this.visualDependencies.each(function(dep) {
            this.subModulesLayerData.get('fields').each(function(field) {
                if (field[2]['@fieldtechname'] == dep.key) {
                    this.visualDependencies.unset(dep.key);
                    this.visualDependencies.set(field[2]['@fieldid'], dep.value);
                }
            } .bind(this));
        } .bind(this));
        this.subModulesLayerData.get('fields').each(function(field) {
            if (field[0]['@fieldid'] != 'TRANSLATION') {
                if (field[0]['@depend_type'] != 'X' && field[0]['@depend_type'] != 'B') {
                    if (this.visualDependencies.get(field[0]['@fieldid'])) {
                        var extraDiv = new Element('div', { 'id': 'rounderDiv_' + field[2]['@fieldid'], 'class': 'fieldClearBoth fieldDispTotalWidth getContentModule_rounderDiv fieldPanelVisualDep' }).insert(field[1])
                    } else {
                        var extraDiv = new Element('div', { 'id': 'rounderDiv_' + field[2]['@fieldid'], 'class': 'fieldClearBoth fieldDispTotalWidth getContentModule_rounderDiv' }).insert(field[1])
                    }
                    var insertedIn = insertArrayNoOverwrite(arrayBySeqNr, parseInt(field[0]['@seqnr'], 10), extraDiv);
                    if (this.visualDependencies.get(field[0]['@fieldid'])) {
                        extraDiv.insert(this.visualDependencies.get(field[0]['@fieldid'])[1]);

                        // If all the childElements are empty, set the height to 0
                        var hide = true;
                        var children = extraDiv.childElements();
                        for (var i = 0; i < children.length; i++) {
                            if (!children[i].empty()) {
                                hide = false;
                                break;
                            }
                        }
                        if (hide) {
                            extraDiv.setStyle({ "height": "0" });
                        }
                    }
                }
            }
        } .bind(this));
        insertArrayNoOverwrite(arrayBySeqNr, this.subModulesLayerData.get('groups').get('tcontent')[0], this.subModulesLayerData.get('groups').get('tcontent')[1]);
        //arrayBySeqNr[this.subModulesLayerData.get('groups').get('tcontent')[0]] = this.subModulesLayerData.get('groups').get('tcontent')[1];
        if (this.subModulesLayerData.get('groups') && this.subModulesLayerData.get('groups').get('group')) {
            objectToArray(this.subModulesLayerData.get('groups').get('group')).each(function(group) {
                insertArrayNoOverwrite(arrayBySeqNr, group.value[0], group.value[1]);
                //arrayBySeqNr[group.value[0]] = group.value[1];
            } .bind(this));
        }
        if (this.subModulesLayerData.get('groups') && this.subModulesLayerData.get('groups').get('radioGroup')) {
            var groupKeys = this.subModulesLayerData.get('groups').get('radioGroup').keys();
            for (var i = 0; i < groupKeys.size(); i++) {
                var group = this.subModulesLayerData.get('groups').get('radioGroup').get(groupKeys[i]);
                insertArrayNoOverwrite(arrayBySeqNr, group[0], group[1]);
            }
        }
        arrayBySeqNr = arrayBySeqNr.compact();
        arrayBySeqNr.each(function(section) {
            div.insert(section);
        } .bind(this));
        if (this.subModulesLayerData.get('groups').get('viewMore'))
            div.insert(this.subModulesLayerData.get('groups').get('viewMore'));
        if ((!Object.isEmpty(this.begDate) || !Object.isEmpty(this.endDate)) && this.mode == 'display') {
            div.insert(this.displayDatesWithImage(this.begDate, this.endDate))
        }
        return div;
    },
    //***************************************************************
    //GROUPING LAYER
    //***************************************************************
    /**
    * @param options {Object} getContentModule initialize() parameters.
    */
    groupingLayer: function(info, screenConfig) {
        var html = $H({
            group: null,
            tcontent: null,
            radioGroup: null,
            viewMore: null
        });

        //To process the TContent
        html.set('tcontent', this.getTcontentHtml(this.getDataTContent(info), screenConfig, info[0]));

        //To process the viewMore
        this.objectViewMore = new viewMoreClass(this.appId, screenConfig, info);

        //To process the primary fields
        this.objectPrimaryFields = new primaryFieldsClass(this.appId, screenConfig, info);
        //To process all of kind of groups
        this.getDataGroupingLayer(this.objectViewMore, this.objectPrimaryFields, info, screenConfig);
        //Create html
        this.objectPrimaryFields.getHtml(this, html);
        this.objectViewMore.getHtml(this, html);
        return this.getHtmlGroupingLayer(html);
    },

    /**
    * @param info {Array} function to get the data related with tContent.
    */
    getDataTContent: function(info) {
        var contentValuesSettings = {
            settings: [],
            values: info[0].tcontents
        };
        for (var i = 0; i < info[1].length; i++) {
            var field = info[1][i];

            var isTContentField = !Object.isEmpty(field['@fieldsource']) && (field['@fieldsource'].toLowerCase() == 't');
            if (isTContentField)
                contentValuesSettings.settings.push(field);
        }
        return contentValuesSettings;
    },
    getCorrespondingValue: function(info, field, variantAssigned, screen) {
        var fieldValue;
        var cont = true;
        var allFieldsValues = objectToArray(info[0].fields.yglui_str_wid_field);
        for (var i = 0; i < allFieldsValues.length && cont; i++) {
            if (allFieldsValues[i]['@fieldid'] == field['@fieldid']) {
                fieldValue = allFieldsValues[i];
                cont = false;
            }
        }
        var recIndex = info[0]['@rec_index'];
        if (!Object.isEmpty(this.variant.get(this.options.appId + '_' + screen))) {
            if (this.mode != 'create')
                var recordVariant = this.variant.get(this.options.appId + '_' + screen).records[recIndex];
            else
                var recordVariant = this.variant.get(this.options.appId + '_' + screen).defaultVariant;
            if (field['@fs_variant'] === recordVariant) {
                variantAssigned.set(field['@fieldid'], { assigned: true });
                return fieldValue;
            }
            if ((Object.isEmpty(field['@fs_variant']) || field['@fs_variant'] == '$$') && Object.isEmpty(variantAssigned.get(field['@fieldid']))) {
                return fieldValue;
            }
        }
        else {
            return field;
        }
        return null;
    },
    setFieldForVariant: function(info, field, fields, screen) {
        var recIndex = info[0]['@rec_index'];
        if (!Object.isEmpty(this.variant.get(this.options.appId + '_' + screen))) {
            if (this.mode != 'create')
                var recordVariant = this.variant.get(this.options.appId + '_' + screen).records[recIndex];
            else
                var recordVariant = this.variant.get(this.options.appId + '_' + screen).defaultVariant;
            if (field['@fs_variant'] === recordVariant) {
                fields.set(field["@fieldid"], field);
            }
            if ((Object.isEmpty(field['@fs_variant']) || field['@fs_variant'] == '$$') && Object.isEmpty(fields.get(field['@fieldid']))) {
                fields.set(field["@fieldid"], field);
            }
        }
        else {
            fields.set(field["@fieldid"], field);
        }
    },
    /**
    * @param options {Object} getContentModule initialize() parameters.
    */
    getDataGroupingLayer: function(viewMoreObject, objectRegularField, info, screenConfig) {
        var regularGroupsBox = $H();
        var regularGroupsRadioButtons = $H();
        var viewMoreGroupsBox = $H();
        var viewMoreGroupsRadioButtons = $H();
        var variantAssigned = $H();
        var fields = $H();
        for (var i = 0; i < info[1].length; i++) {
            this.setFieldForVariant(info, info[1][i], fields, screenConfig["@screen"]);
        }
        //1. Looking for groups
        for (var i = 0; i < fields.values().length; i++) { //Iterate over settings fields
            var field = fields.values()[i];
            var nameGroup = field['@display_group'] ? field['@display_group'] : field['@fieldid'];
            var isRadioField = field['@display_group'] && field['@display_group'].startsWith('RADIO_') || (!Object.isEmpty(field['@fieldid']) && field['@fieldid'].startsWith('OPT_'));
            var isGroupField = !Object.isEmpty(field['@display_group']) && (!field['@display_group'].startsWith('RADIO_')) && !field['@fieldid'].startsWith('OPT_');
            var isViewMoreField = !Object.isEmpty(field['@fieldtype']) && (field['@fieldtype'].toLowerCase() == 's');
            var valueCorresponding = this.getCorrespondingValue(info, field, variantAssigned, screenConfig['@screen']); // (info[0].fields.yglui_str_wid_field.detect(function(v){if(v["@fieldid"] == field['@fieldid'])return true; else return false;});
            if (!isViewMoreField) {
                if (isRadioField) {
                    if (nameGroup.include("RADIO"))
                        nameGroup = nameGroup.substr(0, nameGroup.lastIndexOf('_'));
                    else {
                        if (nameGroup == field['@display_group'])
                            nameGroup = field['@fieldid'].substr(0, field['@fieldid'].lastIndexOf('_')).gsub("OPT", "RADIO"); //A radio button inside a group display
                        else
                            nameGroup = nameGroup.substr(0, nameGroup.lastIndexOf('_')).gsub("OPT", "RADIO");
                    }
                    if (!objectRegularField.groupsRadioButtonsHash.get(nameGroup)) {
                        var options = { name: nameGroup, secondary: isViewMoreField }
                        var auxRadio = new GroupRadioButtons(options);
                        if (!Object.isEmpty(valueCorresponding))
                            auxRadio.addSettingField(this.mode, field, valueCorresponding);
                        objectRegularField.groupsRadioButtonsHash.set(nameGroup, auxRadio);
                    }
                    else {
                        var auxRadio = objectRegularField.groupsRadioButtonsHash.get(nameGroup);
                        if (!Object.isEmpty(valueCorresponding))
                            auxRadio.addSettingField(this.mode, field, valueCorresponding);
                    }
                }
                if (isGroupField) {
                    if (!objectRegularField.groupsVisualHash.get(nameGroup)) {
                        var options = { 'name': nameGroup, secondary: isViewMoreField, getContent: this };
                        var auxBox = new GroupBox(options);
                        if (!Object.isEmpty(valueCorresponding))
                            auxBox.addSettingField(this.mode, field, valueCorresponding);
                        objectRegularField.groupsVisualHash.set(nameGroup, auxBox);
                    }
                    else {
                        var auxBox = objectRegularField.groupsVisualHash.get(nameGroup);
                        if (!Object.isEmpty(valueCorresponding))
                            auxBox.addSettingField(this.mode, field, valueCorresponding);
                    }
                }
                if (!isGroupField && !isRadioField) {//So the field is just a field in view more
                    objectRegularField.addSettingField(this.mode, field, valueCorresponding);
                }
            }
            else { //Process the group in view Details
                if (isRadioField) {
                    if (nameGroup.include("RADIO"))
                        nameGroup = nameGroup.substr(0, nameGroup.lastIndexOf('_'));
                    else {
                        if (nameGroup == field['@display_group'])
                            nameGroup = field['@fieldid'].substr(0, field['@fieldid'].lastIndexOf('_')).gsub("OPT", "RADIO"); //A radio button inside a group display
                        else
                            nameGroup = nameGroup.substr(0, nameGroup.lastIndexOf('_')).gsub("OPT", "RADIO");
                    }
                    if (!viewMoreObject.groupsRadioButtonsHash.get(nameGroup)) {
                        var options = { 'name': nameGroup }
                        var auxRadio = new GroupRadioButtons(options);
                        if (!Object.isEmpty(valueCorresponding))
                            auxRadio.addSettingField(this.mode, field, valueCorresponding);
                        viewMoreObject.groupsRadioButtonsHash.set(nameGroup, auxRadio);
                    }
                    else {
                        var auxRadio = viewMoreObject.groupsRadioButtonsHash.get(nameGroup);
                        if (!Object.isEmpty(valueCorresponding))
                            auxRadio.addSettingField(this.mode, field, valueCorresponding);
                    }
                }
                if (isGroupField) {
                    if (!viewMoreObject.groupsVisualHash.get(nameGroup)) {
                        var options = { 'name': nameGroup, getContent: this }
                        var auxBox = new GroupBox(options);
                        if (!Object.isEmpty(valueCorresponding))
                            auxBox.addSettingField(this.mode, field, valueCorresponding);
                        viewMoreObject.groupsVisualHash.set(nameGroup, auxBox);
                    }
                    else {
                        var auxBox = viewMoreObject.groupsVisualHash.get(nameGroup);
                        if (!Object.isEmpty(valueCorresponding))
                            auxBox.addSettingField(this.mode, field, valueCorresponding);
                    }
                }
                if (!isGroupField && !isRadioField) {//So the field is just a field in view more
                    viewMoreObject.addSettingField(this.mode, field, valueCorresponding);
                }
            }
        }
        //2. Check if some radio button groups is also group box. In primary fields
        var keysGroupsRadio = objectRegularField.groupsRadioButtonsHash.keys();
        for (var i = 0; i < keysGroupsRadio.length; i++) {
            var groupKey = keysGroupsRadio[i];
            var group = objectRegularField.groupsRadioButtonsHash.get(groupKey);
            var labelGroup = group.hasGroupBox()
            if (!objectRegularField.groupsVisualHash.get(labelGroup)) {
                if (labelGroup) {
                    var options = {
                        name: labelGroup,
                        radioButtonGroup: group,
                        getContent: this
                    }
                    var auxGroupRadioAndBox = new GroupBox(options);
                    //Delete the group of the previous list and add to the box group
                    objectRegularField.groupsRadioButtonsHash.unset(groupKey);
                    objectRegularField.groupsVisualHash.set(labelGroup, auxGroupRadioAndBox);
                }
            }
            else {
                var aux = objectRegularField.groupsVisualHash.get(labelGroup);
                objectRegularField.groupsRadioButtonsHash.unset(groupKey);
                aux.radioButtonGroup = group;
            }
        }
        //3. Check if some radio button groups is also group box.In view More fields
        var keysGroupsRadio = viewMoreObject.groupsRadioButtonsHash.keys();
        for (var i = 0; i < keysGroupsRadio.length; i++) {
            var groupKey = keysGroupsRadio[i];
            var group = viewMoreObject.groupsRadioButtonsHash.get(groupKey);
            var labelGroup = group.hasGroupBox()
            if (!viewMoreObject.groupsVisualHash.get(labelGroup)) {
                if (labelGroup) {
                    var options = {
                        name: labelGroup,
                        radioButtonGroup: group,
                        getContent: this
                    }
                    var auxGroupRadioAndBox = new GroupBox(options);
                    //Delete the group of the previous list and add to the box group
                    viewMoreObject.groupsRadioButtonsHash.unset(groupKey);
                    viewMoreObject.groupsVisualHash.set(labelGroup, auxGroupRadioAndBox);
                }
            }
            else {
                var aux = viewMoreObject.groupsVisualHash.get(labelGroup);
                viewMoreObject.groupsRadioButtonsHash.unset(groupKey);
                aux.radioButtonGroup = group;
            }
        }
    },
    /**
    * @param 
    */
    getHtmlGroupingLayer: function(html) {
        return html;










    },

    /**
    * Shows the details part for this getContent
    * @param {Object} key
    */
    showDetails: function(key, idButtons) {
        this.viewMoreLink.get(key).hash.get(idButtons[1])[1].hide();
        this.viewMoreLink.get(key).hash.get(idButtons[0])[1].show();
        Form.Element.focus(this.viewMoreLink.get(key).hash.get(idButtons[0])[1]);
        this.viewMoreFields.get(key).hide();
        if (!Object.isEmpty(global.GCdetailsOpened.get(key))) {
            global.GCdetailsOpened.get(key).showed = false;
        }
        else {
            global.GCdetailsOpened.set(key, { showed: false });
        }
    },
    /**
    * Hides the details part for this getContent
    * @param {Object} key
    */
    hideDetails: function(key, idButtons) {
        this.viewMoreLink.get(key).hash.get(idButtons[0])[1].hide();
        this.viewMoreLink.get(key).hash.get(idButtons[1])[1].show();
        Form.Element.focus(this.viewMoreLink.get(key).hash.get(idButtons[1])[1]);
        this.viewMoreFields.get(key).show();
        if (!Object.isEmpty(global.GCdetailsOpened.get(key))) {
            global.GCdetailsOpened.get(key).showed = true;
        }
        else {
            global.GCdetailsOpened.set(key, { showed: true });
        }
    },


    /**
    * Function called when a radio button from a group of radio buttons is clicked
    * @param {Object} event
    * @param {Object} options
    * @param {Object} option
    * @param {Object} byOption
    * @param {Object} groupElement
    * @param {Object} screenConfig
    */
    radioButtonClicked: function(event, classGroup, option, radioGroup, byOption, screenConfig) {
        var radioElements = classGroup.getRadioElements();
        var keysRadioElements = radioElements.keys();
        var radioPartner = classGroup.getPartnerElements();
        var keysParnetElements = radioPartner.keys();
        //Iterate over all the radio element, in order to set the selected radio in the fields of get content
        for (var i = 0; i < keysRadioElements.length; i++) {
            var opt = radioElements.get(keysRadioElements[i]);
            if (option.setting["@fieldid"] == opt.setting["@fieldid"]) {
                if (Object.isEmpty(opt.value["@value"])) {
                    opt.value['@value'] = 'X';
                    for (var j = 0; j < keysParnetElements.length; j++) {
                        var optionField = keysParnetElements[j];
                        if (radioGroup == optionField) {
                            var optionFieldCompact = radioPartner.get(optionField).compact();
                            for (var h = 0; h < optionFieldCompact.length; h++) {
                                var field = optionFieldCompact[h];
                                if (field.setting['@fieldformat'] == 'O') {
                                    field.value['@value'] = 'X';
                                }
                            }
                        }
                        else {
                            var optionField = radioPartner.get(optionField).compact();
                            for (var h = 0; h < optionField.length; h++) {
                                var field = optionField[h];
                                if (field.setting['@fieldformat'] == 'O') {
                                    field.value['@value'] = '';
                                    field.value['#text'] = '';
                                }
                            }
                        }
                    }
                    //If there's a paiEvent associated:
                    if (!Object.isEmpty(opt.service_pai)) {
                        var obj = {
                            appId: this.appId,
                            screen: screenConfig['@screen'],
                            record: "",
                            servicePai: opt.service_pai,
                            currentValue: "X",
                            fieldId: opt.value['@fieldid']
                        };
                        document.fire.bind(document, 'EWS:getContentModule_paiEvent_' + this.appId + this.name + this.randomId, obj).defer();   //Deferring that in order to update everything before calling the PAI
                    }
                }
            }
            else {
                opt.value['@value'] = '';
            }
        }
        classGroup.selectRadioButton(option.setting["@fieldid"].split("_")[2]);
        //Fire the fieldDisplayerModified if we have to:
        if (!Object.isEmpty(this.fieldDisplayerModified)) {
            document.fire(this.fieldDisplayerModified, { field: option.value, value: option.value, first: false, screen: this.getSelectedScreen(), record: this.getSelectedRecord(), fieldName: option.setting['@fieldid'], type: "RADIO_GROUP" });
        }
    },

    /**
    * @param group {Object} The fields that the group has
    * @param screenConfig {Object} 
    * @param info {Object}
    * @param radioGroups {Object} Radio groups to be displayed. Only used for viewMore
    * @param groupedGroups {Object} Groups to be displayed. Only used for viewMore
    *        as it calls recursively getGroupHtml
    */




    /**
    * Gets the settings for a specific variant
    * @param {Object} settingsArray Array with all possible settings
    * @param {Object} variant The variant we want to use
    * @param {Object} tContent true if we should consider only tContent fields, false if we should consider non tContent fields
    */
    getSettingsForVariant: function(settingsArray, variant, tContent) {
        var auxSettings = $H();
        var variantAssigned = $H();
        for (var j = 0; j < settingsArray.size(); j++) {
            var field = settingsArray[j];
            //Will be true if: we want tContent and it's tContent or we don't want tContent and it's not tContent
            var validTContent = (tContent && field['@fieldsource'] == 'T') || (!tContent && field['@fieldsource'] != 'T');
            if (!Object.isEmpty(field['@fieldid']) && !field['@fieldid'].startsWith('OPT_') && Object.isEmpty(field['@display_group']) && validTContent && (field['@fieldtype'] != 'S')) {
                if (field['@fs_variant'] == variant) {
                    auxSettings.set(field['@fieldid'], field);
                    variantAssigned.set(field['@fieldid'], {
                        assigned: true
                    });
                }
                if ((Object.isEmpty(field['@fs_variant']) || field['@fs_variant'] == '$$') && Object.isEmpty(variantAssigned.get(field['@fieldid']))) {
                    auxSettings.set(field['@fieldid'], field);
                }
            }
            else {
                auxSettings.set(field['@fieldid'], field);
            }
        }
        return auxSettings;
    },
    /**
    * @param options {Object} getContentModule initialize() parameters.
    */
    getTcontentHtml: function(tcontent, screenConfig, recordConfig) {
        //Create a hash for the settings of the fields in a tContent
        var settingsArray = tcontent.settings;
        var settingsForRows = $H();
        var settings = $H();
        var values = $A();
        if (!Object.isEmpty(tcontent.values)) {
            values = objectToArray(tcontent.values.yglui_str_wid_tcontent);
        }
        //Depending on the variants we will have different settings in each row
        for (var i = 0; i < values.size(); i++) {
            var variant = values[i]['@rec_variant'];
            var seqnr = values[i]['@seqnr'];
            var auxSettings = this.getSettingsForVariant(settingsArray, variant, true);
            //Now we have in auxSettings all the settings for each row
            settingsForRows.set(seqnr, auxSettings);
        }
        //Storing the default 
        var defaultVariant = this.variant.get(this.appId + "_" + screenConfig['@screen']).defaultTvariant;
        var defaultSettings = this.getSettingsForVariant(settingsArray, defaultVariant, true);
        //Storing general settings
        for (var i = 0; i < settingsArray.size(); i++) {
            settings.set(settingsArray[i]['@fieldid'], settingsArray[i]);
        }
        //Get config to show tContent edit and delete buttons or not
        var showAddButton = true;
        var showEditButton = true;
        var showDeleteButton = true;
        var tModifField = settings.get("TMODIF");
        if (!Object.isEmpty(tModifField)) {
            var tModifConfig = "";
            if (!Object.isEmpty(tModifField['@default_text']))
                tModifConfig = tModifField['@default_text'].toLowerCase();
            if (tModifConfig.include("x"))
                showDeleteButton = false;
            if (tModifConfig.include("y"))
                showEditButton = false;
        }
        var customFunctions = null;
        var maxRows = 999;
        var minRows = 0;
        //Get max and min number of elements from backend (will be overwritten if they are defined in the initialization of the module) 
        var settingsForScreens = objectToArray(this.json.EWS.o_field_settings.yglui_str_wid_fs_record);
        for (var i = 0; i < settingsForScreens.size(); i++) {
            if (settingsForScreens[i]['@screen'] == screenConfig['@screen']) {
                //These are the settings for our screen
                if (!Object.isEmpty(settingsForScreens[i].tcontent_pai) && !Object.isEmpty(settingsForScreens[i].tcontent_pai['@tcontent_min']))
                    minRows = parseInt(settingsForScreens[i].tcontent_pai['@tcontent_min'], 10);
                if (!Object.isEmpty(settingsForScreens[i].tcontent_pai) && !Object.isEmpty(settingsForScreens[i].tcontent_pai['@tcontent_max']))
                    maxRows = parseInt(settingsForScreens[i].tcontent_pai['@tcontent_max'], 10);
            }
        }
        //Get other options that come as parameters when creating the object
        if (this.options && !Object.isEmpty(this.options.tContent) && !Object.isEmpty(this.options.tContent) && !Object.isEmpty(this.options.tContent.get(screenConfig['@screen']))) {
            var tContentOptions = this.options.tContent.get(screenConfig['@screen']);
            if (!Object.isEmpty(tContentOptions.maxRows))
                maxRows = tContentOptions.maxRows;
            if (!Object.isEmpty(tContentOptions.customFunctions))
                customFunctions = tContentOptions.customFunctions;
            if (!Object.isEmpty(tContentOptions.minRows))
                minRows = tContentOptions.minRows;
            if (!Object.isEmpty(tContentOptions.showAddButton) || tContentOptions.showAddButton === false)
                showAddButton = tContentOptions.showAddButton;
        }

        var values = (!Object.isEmpty(tcontent.values)) ? tcontent.values.yglui_str_wid_tcontent : null;
        if (Object.isEmpty(values) && (!this.tcontent_empty.get(screenConfig['@screen']) || this.mode == 'display'))
            return "";
        //Creating the tContent hash element
        if (Object.isEmpty(this.tContent)) {
            this.tContent = $H();
        }
        var rowPAI = this.getRowPai(screenConfig['@screen']);
        var isEditable = this.isTContentEditable(screenConfig['@screen']);
        this.tContent.set(screenConfig['@screen'] + "_" + recordConfig['@rec_index'], {
            jsonRowContainer: this.getJSONRowContainer(screenConfig, recordConfig['@rec_index']), //tcontent.value.values.yglui_str_wid_tcontent,
            jsonRows: $H(),
            simpleTableObject: null,
            simpleTableData: null,
            settings: settings,
            settingsForRows: settingsForRows,
            defaultVariant: defaultVariant,
            defaultSettings: defaultSettings,
            allSettings: settingsArray,
            rowPAI: rowPAI,
            showAddButton: showAddButton,
            showEditButton: showEditButton,
            showDeleteButton: showDeleteButton
        });
        var tContentElement = this.tContent.get(screenConfig['@screen'] + "_" + recordConfig['@rec_index']);
        //Changing the mode to display, so the fieldDisplayers are created in display mode
        var mode = this.mode;
        this.mode = 'display';
        //Creating table headers
        var firstSeq = 0;
        tContentElement.simpleTableData = {
            header: [],
            rows: $H()
        };
        var count = 0;
        var auxSettings = $H();

        var settingsKeys = settings.keys();
        for (var i = 0; i < settingsKeys.size(); i++) {
            var field = settings.get(settingsKeys[i]);
            if (count == 0)
                firstSeq = parseInt(field['@seqnr'], 10);
            var label = this.chooseLabel(field['@fieldid'], field['@label_type'], field['@fieldlabel']);
            label = this.addAsterisk(label, field['@display_attrib']);
            //Only add it to the table if it's not hidden
            if (Object.isEmpty(field['@display_attrib']) || (field['@display_attrib'] != "HID" && field['@display_attrib'] != "HOU")) {
                tContentElement.simpleTableData.header[parseInt(field['@seqnr'], 10)] = {
                    text: label,
                    id: 'tcontentHeader_' + count
                };
            }
            auxSettings.set(field['@fieldid'], field);
            count++;
        }
        //Adding rows
        if (!Object.isEmpty(values)) {
            objectToArray(values).each(function(row) {
                var rowId = row['@seqnr'];
                var showRow = true;
                if ((!Object.isEmpty(row['@noshow']) && row['@noshow'].toLowerCase() == "x") || Object.isEmpty(row.fields)) {
                    showRow = false;
                }
                //Adding the json row to tContent hash:
                this.tContent.get(screenConfig['@screen'] + "_" + recordConfig['@rec_index']).jsonRows.set(rowId, row);
                //Adding row to table:
                if (showRow) {
                    this.addRowToTContentTable(rowId, row, auxSettings, screenConfig, recordConfig, mode, true);
                }
            } .bind(this));
        }

        //If we are not in display mode and table is editable, we add a header for the column containing edit and delete buttons
        //TODO: Refactor: we should create elements with new Element, not text
        if (mode != 'display' && isEditable && showAddButton) {// not taken into account this.showButtons for tcontent, after latest requirements
            tContentElement.simpleTableData.header.unshift({
                text: "<button id='addButton_" + this.appId + screenConfig['@screen'] + recordConfig['@rec_index'] + "' class='link application_action_link getContentAddButton'>" + global.getLabel('add') + "</button>",
                id: ['fieldsPanel_tcontentHeader_', this.appId, screenConfig['@screen'], recordConfig['@rec_index']].join(''),
                pointer: true
            });
        } else {
            //We add a column so the table is consistent
            tContentElement.simpleTableData.header.unshift({
                text: "",
                id: ['fieldsPanel_tcontentHeader_', this.appId, screenConfig['@screen'], recordConfig['@rec_index']].join(''),
                pointer: true
            });
        }
        //Create simpleTable object
        tContentElement.simpleTableData.header = tContentElement.simpleTableData.header.compact();
        tContentElement.simpleTableObject = new SimpleTable(tContentElement.simpleTableData, { rowsClassName: "tdPaddingSpace" });
        //Adding the table to the hash with all the tables in the getContent 
        this.tables.set(screenConfig['@screen'] + '_' + recordConfig['@rec_index'] + '_' + this.appId, tContentElement.simpleTableObject);
        //Updating the CSS classes we are going to use
        var ele = tContentElement.simpleTableObject.getElement();
        ele.removeClassName('simpleTable_table');
        ele.addClassName('tcontentSimpleTable fieldPanel_whiteSpaceTable');
        var elementDivTable = new Element('div', {
            'class': 'fieldDispFloatLeft fieldPanelSimpleTableDiv fieldClearBoth fieldDispTotalWidth test_text'
        });
        elementDivTable.insert(ele);
        if (mode != 'display' && isEditable && showAddButton) {
            tContentElement.addButton = ele.down("[id=addButton_" + this.appId + screenConfig['@screen'] + recordConfig['@rec_index'] + "]");
            tContentElement.addButton.observe('click', this.openPopupTContent.bind(this, "create", screenConfig, recordConfig, null, defaultSettings, false, mode));
        }
        //Restoring the orginal mode
        this.mode = mode;
        return [firstSeq, elementDivTable];
    },
    /**
    * Returns the service pai for the tContent rows of the screen
    * @param {Object} screen the screen id
    * @return the name of the service pai for the tContent rows of the screen, or null if isn't defined
    */
    getRowPai: function(screen) {
        var settingsForScreens = objectToArray(this.json.EWS.o_field_settings.yglui_str_wid_fs_record);
        for (var i = 0; i < settingsForScreens.size(); i++) {
            if (settingsForScreens[i]['@screen'] == screen) {
                //These are the settings for our screen
                if (!Object.isEmpty(settingsForScreens[i].tcontent_pai) && !Object.isEmpty(settingsForScreens[i].tcontent_pai['@tcontent_pai'])) {
                    return settingsForScreens[i].tcontent_pai['@tcontent_pai'];
                } else {
                    return null;
                }
            }
        }
        return null;
    },
    /**
    * Tells if the tContent for this screen is editable. if the "tcontent_edit" attribute 
    * in tcontent_pai tag is set to "x" or is not set it will be editable. If it's set to "" or any 
    * other value it won't be editable 
    * @param {Object} screen
    */
    isTContentEditable: function(screen) {
        var settingsForScreens = objectToArray(this.json.EWS.o_field_settings.yglui_str_wid_fs_record);
        for (var i = 0; i < settingsForScreens.size(); i++) {
            if (settingsForScreens[i]['@screen'] == screen) {
                //These are the settings for our screen
                if (!Object.isEmpty(settingsForScreens[i].tcontent_pai) && !Object.isEmpty(settingsForScreens[i].tcontent_pai['@tcontent_edit'])) {
                    if (settingsForScreens[i].tcontent_pai['@tcontent_edit'].toLowerCase() == "x") {
                        return true;
                    }
                    else {
                        return false;
                    }
                } else {
                    return false;
                }
            }
        }
        return false;
    },
    /**
    * Gets the Json node that has the tContent information for a record
    * @param {Object} screenConfig the screen id
    * @param {Object} record the record index
    */
    getJSONRowContainer: function(screenConfig, record) {
        var screen = screenConfig['@screen'];
        if (!Object.isEmpty(this.json.EWS.o_field_values.yglui_str_wid_record)) {

            //We store in ourScreen the json part of our screen, taking into acount that if there's only one, the structure is different
            if (Object.isArray(this.json.EWS.o_field_values.yglui_str_wid_record)) {
                var screens = objectToArray(this.json.EWS.o_field_values.yglui_str_wid_record);
                for (var i = 0; i < screens.size(); i++) {
                    if (screens[i]['@screen'] == screen) {
                        ourScreenNumber = i;
                        var ourScreen = this.json.EWS.o_field_values.yglui_str_wid_record[ourScreenNumber];
                        //See if there is a record inside our screen that has the rec_index:
                        var records = objectToArray(ourScreen.contents.yglui_str_wid_content);
                        var found = false;
                        for (var j = 0; j < records.size(); j++) {
                            if (records[j]['@rec_index'] == record) {
                                found = true;
                                break;
                            }
                        }
                        //If it has the record, this is our screen
                        if (found)
                            break;
                    }
                }
                var ourScreen = this.json.EWS.o_field_values.yglui_str_wid_record[ourScreenNumber];
            } else {
                var ourScreen = this.json.EWS.o_field_values.yglui_str_wid_record;
            }
            //We store in ourRecord the json part of our record, taking into acount that if there's only one, the structure is different
            if (Object.isArray(ourScreen.contents.yglui_str_wid_content)) {
                var records = objectToArray(ourScreen.contents.yglui_str_wid_content);
                for (var i = 0; i < records.size(); i++) {
                    if (records[i]['@rec_index'] == record) {
                        ourRecordNumber = i;
                        break;
                    }
                }
                var ourRecord = ourScreen.contents.yglui_str_wid_content[ourRecordNumber];
            } else {
                var ourRecord = ourScreen.contents.yglui_str_wid_content;
            }
            if (Object.isEmpty(ourRecord.tcontents)) {
                //If it doesn't have tContent yet, add it
                ourRecord.tcontents = { yglui_str_wid_tcontent: $A() };
                //And remove the tag that indicates it's null:
                if (!Object.isEmpty(ourRecord['@tcontents'])) {
                    ourRecord['@tcontents'] = undefined;
                }
            }

            return ourRecord.tcontents.yglui_str_wid_tcontent;
        }
        return null;
    },
    /**
    * Sets the Json node that has the tContent information for a record 
    * @param {Object} screen
    * @param {Object} record
    * @param {Object} content
    * @param {Object} rowId If defined, we will only update this row
    * @param {Object} mode If we are going to update a row we will need this mode
    */
    setJSONRowContainer: function(screenConfig, record, content, rowId, mode) {
        var screen = screenConfig['@screen'];
        if (!Object.isEmpty(this.json.EWS.o_field_values.yglui_str_wid_record)) {
            //We're not in list mode
            //We store in ourScreen the json part of our screen, taking into acount that if there's only one, the structure is different
            if (Object.isArray(this.json.EWS.o_field_values.yglui_str_wid_record)) {
                var screens = objectToArray(this.json.EWS.o_field_values.yglui_str_wid_record);
                for (var i = 0; i < screens.size(); i++) {
                    if (screens[i]['@screen'] == screen) {
                        ourScreenNumber = i;
                        var ourScreen = this.json.EWS.o_field_values.yglui_str_wid_record[ourScreenNumber];
                        //See if there is a record inside our screen that has the rec_index:
                        var records = objectToArray(ourScreen.contents.yglui_str_wid_content);
                        var found = false;
                        for (var j = 0; j < records.size(); j++) {
                            if (records[j]['@rec_index'] == record) {
                                found = true;
                                break;
                            }
                        }
                        //If it has the record, this is our screen
                        if (found)
                            break;
                    }
                }
                var ourScreen = this.json.EWS.o_field_values.yglui_str_wid_record[ourScreenNumber];
            } else {
                var ourScreen = this.json.EWS.o_field_values.yglui_str_wid_record;
            }

            //We store in ourRecord the json part of our record, taking into acount that if there's only one, the structure is different 
            if (Object.isArray(ourScreen.contents.yglui_str_wid_content)) {
                var records = objectToArray(ourScreen.contents.yglui_str_wid_content);
                for (var i = 0; i < records.size(); i++) {
                    if (records[i]['@rec_index'] == record) {
                        ourRecordNumber = i;
                        break;
                    }
                }
                var ourRecord = ourScreen.contents.yglui_str_wid_content[ourRecordNumber];
            } else {
                var ourRecord = ourScreen.contents.yglui_str_wid_content;
            }
            if (Object.isEmpty(ourRecord.tcontents)) {
                //If it doesn't have tContent yet, add it
                ourRecord.tcontents = { yglui_str_wid_tcontent: $A() };
                //And remove the tag that indicates it's null:
                if (!Object.isEmpty(ourRecord['@tcontents'])) {
                    ourRecord['@tcontents'] = undefined;
                }
            }
            if (Object.isEmpty(rowId)) {
                ourRecord.tcontents.yglui_str_wid_tcontent = content;
                this.tContent.get(screenConfig['@screen'] + "_" + record).jsonRowContainer = content;
            } else {
                //If we received a rowId, we will just update this row
                //Get the row to insert:
                content = objectToArray(content);
                var newRow = null;
                for (var i = 0; i < content.size(); i++) {
                    if (content[i]['@seqnr'] == rowId) {
                        newRow = content[i];
                    }
                }
                if (newRow) {
                    //Insert in our metadata
                    var originalRows = this.tContent.get(screenConfig['@screen'] + "_" + record).jsonRowContainer;
                    //Find the row we want to set
                    if (Object.isArray(originalRows)) {
                        for (var i = 0; i < originalRows.size(); i++) {
                            if (originalRows[i]['@seqnr'] == rowId) {
                                originalRows[i] = newRow;
                                this.tContent.get(screenConfig['@screen'] + "_" + record).jsonRowContainer = originalRows;
                                break;
                            }
                        }
                    } else {
                        this.tContent.get(screenConfig['@screen'] + "_" + record).jsonRowContainer = newRow;
                    }
                }
            }
        }
    },
    /**
    * Opens a popup to add, edit or confirm the deletion of a row of a tContent.
    * @param {Object} mode “create”, “edit” or “delete”.
    * @param {Object} screenConfig the config for the screen.
    * @param {Object} recordConfig the config for the record.
    * @param {Object} rowId the rowId if we are in edit or delete mode, so we can identify the row.
    * @param {Object} settings the settings for the fields in tContent.
    * @param {Object} updating true if we are just updating the popup after a paiEvent. This way we won't overwrite the originalValues that we have stored in case we need them.
    * @param {Object} modeRestGetContent Mode of the getContent
    */
    openPopupTContent: function(mode, screenConfig, recordConfig, rowId, settings, updating, modeRestGetContent) {
        this.originalMode = mode;
        if (Object.isEmpty(updating) || updating != true) {
            updating = false;
        }
        //If we are in edit mode take the lates settings for this possible variants changes:
        if (mode == "edit") {
            if (!Object.isEmpty(this.tContent.get(screenConfig['@screen'] + "_" + recordConfig['@rec_index']).settingsForRows)) {
                if (!Object.isEmpty(this.tContent.get(screenConfig['@screen'] + "_" + recordConfig['@rec_index']).settingsForRows.get(rowId))) {
                    settings = this.tContent.get(screenConfig['@screen'] + "_" + recordConfig['@rec_index']).settingsForRows.get(rowId);
                }
            }
        }
        //If we are in create mode we’ll add a new row to the JSON, using addRowToJson function that will return the rowId for the new row.
        if (mode == "create" && !updating) {
            rowId = this.addRowToJson(screenConfig, recordConfig);
        }
        //We change the mode to create the fieldDisplayers (will restore it later)
        var modeBackup = this.mode;
        switch (mode) {
            case "delete":
                this.mode = "display"; break;
            case "create":
                if (updating) {
                    //We will create the fields as edit mode, because we have to get the values,
                    //not the default values for them, since it's after a PAI
                    this.mode = "edit";
                } else {
                    this.mode = "create";
                }
                break;
            case "edit":
                this.mode = "edit"; break;
            default: break;
        }
        var contentHTML = new Element('div');
        this.loadingMessageTContent = new Element("div", { "class": "getContent_tContentLoading" }).insert(global.getLabel("loading") + "...");
        this.loadingMessageTContent.hide();
        contentHTML.insert(this.loadingMessageTContent);
        var buttonsJson = {
            elements: [],
            mainClass: 'getContent_tContentButtonsContainer'
        };
        this.tContentSaveButtonId = 'getContent_saveButtonPopUp';
        this.tContentCancelButtonId = 'getContent_cancelButtonPopUp';

        //Cancel button
        var optionsCancelButton = {
            idButton: this.tContentCancelButtonId,
            label: global.getLabel('cancel'),
            handlerContext: null,
            className: 'getContent_tContentButton',
            handler: this.discardChangesTContentRow.bind(this, this.originalMode, rowId, screenConfig, recordConfig, settings),
            type: 'button',
            standardButton: true
        };
        buttonsJson.elements.push(optionsCancelButton);
        //Save button
        var labelForSaveButton = global.getLabel('save');
        if (mode == "delete") {
            labelForSaveButton = global.getLabel('delete');
        }

        var optionsSaveButton = {
            idButton: this.tContentSaveButtonId,
            label: labelForSaveButton,
            handlerContext: null,
            className: 'getContent_tContentButton',
            handler: this.saveTContentRow.bind(this, this.originalMode, rowId, screenConfig, recordConfig, settings),
            type: 'button',
            standardButton: true
        };
        buttonsJson.elements.push(optionsSaveButton);
        this.tContentButtonDisplayer = new megaButtonDisplayer(buttonsJson);
        this.buttons.set("Tcontent", this.tContentButtonDisplayer.hash);
        var buttons = this.tContentButtonDisplayer.getButtons();
        var values = this.tContent.get(screenConfig['@screen'] + "_" + recordConfig['@rec_index']).jsonRows.get(rowId).fields.yglui_str_wid_field;
        //If we are in edit mode, store the original values, to restore them if we hit cancel
        if (mode == "edit" && !updating) {
            this.tContent.get(screenConfig['@screen'] + "_" + recordConfig['@rec_index']).originalValues = deepCopy(this.tContent.get(screenConfig['@screen'] + "_" + recordConfig['@rec_index']).jsonRows.get(rowId));
        }
        values = objectToArray(values);
        var createdDisplayers = $H();
        var arrayBySeqNr = [];
        for (var i = 0; i < values.length; i++) {
            var getFieldValueAppend = this.getXMLToAppendForField(values[i]['@fieldid']);
            var displayer = this.fieldDisplayer({
                settings: settings.get(values[i]['@fieldid']),
                values: values[i],
                screen: screenConfig['@screen'],
                record: recordConfig['@rec_index'],
                key_str: recordConfig['@key_str'],
                getFieldValueAppend: getFieldValueAppend,
                randomId: this.randomId
            }, true, rowId);
            createdDisplayers.set(values[i]['@fieldid'], displayer);
            //if (!displayer.options.hidden) {
            //Only show it if it's not hidden
            var seqnr = parseInt(settings.get(values[i]['@fieldid'])['@seqnr'], 10);
            insertArrayNoOverwrite(arrayBySeqNr, seqnr, displayer.getHtml());
            //arrayBySeqNr[seqnr] = displayer.getHtml();
            //}
        }
        this.setFieldDependencies(createdDisplayers, false, this.fieldDisplayers.get(this.appId + modeRestGetContent + screenConfig['@screen'] + recordConfig['@rec_index']));
        //Insert fields in order
        arrayBySeqNr = arrayBySeqNr.compact();
        /*arrayBySeqNr.each(function(section) {
        var aroundDiv = new Element('div', { 'class': 'getContent_aroundFD' });
        aroundDiv.insert(section);
        contentHTML.insert(section);
        } .bind(this));*/
        for (var i = 0; i < arrayBySeqNr.size(); i++) {
            var aroundDiv = new Element('div', { 'class': 'getContent_aroundFD' });
            aroundDiv.insert(arrayBySeqNr[i]);
            contentHTML.insert(aroundDiv);
        }

        //insert buttons in div
        contentHTML.insert(buttons);

        //Insert div for error:
        this.errorInTContentPopup = new Element("div", { "class": "application_main_error_text" });
        this.errorInTContentPopup.hide();
        contentHTML.insert(this.errorInTContentPopup);
        this.tContentPopUp = new infoPopUp({
            closeButton: $H({
                'textContent': 'Close',
                'callBack': this.discardChangesTContentRow.bind(this, mode, rowId, screenConfig, recordConfig)
            }),
            htmlContent: contentHTML,
            width: 500,
            height: 800
        });
        this.tContentPopUp.create();

        this.mode = modeBackup;
    },

    /**
    * Adds a row to the json and returns the rowId for it.
    * @param {Object} screenConfig the config for the screen.
    * @param {Object} recordConfig the config for the record.
    * @return The rowId for the added row.
    */
    addRowToJson: function(screenConfig, recordConfig) {
        //This is the place where all the other rtows are in the JSON:
        var jsonRowContainer = this.tContent.get(screenConfig['@screen'] + "_" + recordConfig['@rec_index']).jsonRowContainer;
        //Create a new row:
        var rowId = null;
        var emptyObject = null;
        var auxEmpty = null;
        if (this.tcontent_empty.get(screenConfig['@screen'])) {
            emptyObject = {
                fields: deepCopy(this.tcontent_empty.get(screenConfig['@screen'])),
                '@seqnr': 0
            };
            var max = 0;
            if (!Object.isEmpty(jsonRowContainer)) {
                var rows = objectToArray(jsonRowContainer);
                for (var i = 0; i < rows.size(); i++) {
                    if (parseInt(rows[i]['@seqnr'], 10) > max) {
                        max = parseInt(rows[i]['@seqnr'], 10);
                    }
                }
            }
            var next = parseInt(max, 10) + 1;

            var emptyRow = objectToArray(emptyObject.fields.yglui_str_wid_field);
            for (var i = 0; i < emptyRow.size(); i++) {
                emptyRow[i]['@fieldtseqnr'] = next;
            }
            rowId = next.toPaddedString(6, 10);  //Add 0s to fill the seqnr
            emptyObject['@seqnr'] = rowId;

            //Add it to the JSON:			
            //Depending on how many rows there are: 
            if (!Object.isEmpty(jsonRowContainer) && Object.isArray(jsonRowContainer)) {
                //If there are more than one, just add it
                jsonRowContainer.push(emptyObject);
            } else if (!Object.isEmpty(jsonRowContainer)) {
                //If there is only one, convert it to array and add it
                jsonRowContainer = objectToArray(jsonRowContainer);
                jsonRowContainer.push(emptyObject);
            } else {
                //If there aren't any, just add it
                jsonRowContainer = emptyObject;
            }
            this.tContent.get(screenConfig['@screen'] + "_" + recordConfig['@rec_index']).jsonRowContainer = jsonRowContainer;
            this.setJSONRowContainer(screenConfig, recordConfig['@rec_index'], jsonRowContainer);

            //Add to tContent hash:
            this.tContent.get(screenConfig['@screen'] + "_" + recordConfig['@rec_index']).jsonRows.set(rowId, emptyObject);
            var auxSettings = this.getSettingsForVariant(this.tContent.get(screenConfig['@screen'] + "_" + recordConfig['@rec_index']).allSettings, this.variant.get(this.appId + "_" + screenConfig['@screen']).defaultTvariant, true);
            //Now we have in auxSettings all the settings for each row
            this.tContent.get(screenConfig['@screen'] + "_" + recordConfig['@rec_index']).settingsForRows.set(rowId, auxSettings);
        }
        return rowId;
    },
    /**
    * Adds a row to the HTML tContent table.
    * @param {Object} rowId the id for the row
    * @param {Object} values the values for the row we want to insert in the table.
    * @param {Object} settings the settings for the fields
    * @param {Object} screen the id or name of the screen.
    * @param {Object} record the id for the record.
    * @param {Object} mode mode used for creating
    * @param {Object} creatingTable true if this is the first creating table.
    */
    addRowToTContentTable: function(rowId, values, settings, screenConfig, recordConfig, mode, creatingTable) {
        if (Object.isEmpty(creatingTable)) {
            creatingTable = false;
        }
        var newColumns = this.getColumnsForTContentRow(values, settings, screenConfig, recordConfig, mode, rowId);

        //If we are adding just one row, add it now to the table      
        if (!creatingTable) {
            var newRow = $H();
            newRow.set("row" + rowId, {
                data: newColumns.compact()
            });
            this.tContent.get(screenConfig['@screen'] + "_" + recordConfig['@rec_index']).simpleTableObject.addRow(newRow);
        } else {
            //If this is the first time creating the whole table, add it tContent.simpleTableData
            var tContent = this.tContent.get(screenConfig['@screen'] + "_" + recordConfig['@rec_index']);
            tContent.simpleTableData.rows.set(['row', values['@seqnr']].join(''), {
                data: []
            });
            tContent.simpleTableData.rows.get(['row', values['@seqnr']].join('')).data = newColumns.compact();
        }
    },


    /**
    * It takes the XML that has the error message and shows it underneath the actual popup.
    * @param {Object} htmlMessage The HTML that will be shown in the error message
    * @param {Object} containerDiv The div where we want to place the error message
    * @return The element for the div that contains the error message, so it can be hided afterwards if we want.
    */
    showErrorInPopup: function(htmlMessage, containerDiv) {
        if (!Object.isEmpty(containerDiv)) {
            containerDiv.insert(htmlMessage);
        } else {
            if (!Object.isEmpty(this.errorInTContentPopup)) {
                this.errorInTContentPopup.update(htmlMessage);
                this.errorInTContentPopup.show();
                //this.errorInTContentPopup.blindUp({ duration: 1.0, delay: 3.0 });
            }
        }
    },

    /**
    * Deletes a row from the json
    * @param {Object} rowId the id for the row
    * @param {Object} screen the id or name of the screen.
    * @param {Object} record the id for the record.
    */
    deleteRowFromJson: function(rowId, screenConfig, recordConfig) {
        //This is the place where all the other rows are in the JSON:
        var jsonRowContainer = this.tContent.get(screenConfig['@screen'] + "_" + recordConfig['@rec_index']).jsonRowContainer;

        var jsonRowContainer = objectToArray(jsonRowContainer);
        for (var i = 0; i < jsonRowContainer.length; i++) {
            if (jsonRowContainer[i]['@seqnr'] == rowId) {
                //jsonRowContainer = jsonRowContainer.without(jsonRowContainer[i]);
                delete jsonRowContainer[i].fields;
                this.tContent.get(screenConfig['@screen'] + "_" + recordConfig['@rec_index']).jsonRows.unset(rowId);
                break;
            }
        }
        //If there is just one left we set it as an object instead of an array
        if (jsonRowContainer.size() == 1) {
            jsonRowContainer = jsonRowContainer[0];
        }
        this.tContent.get(screenConfig['@screen'] + "_" + recordConfig['@rec_index']).jsonRowContainer = jsonRowContainer;
        this.setJSONRowContainer(screenConfig, recordConfig['@rec_index'], jsonRowContainer);
    },
    /**
    * Gets the columns for a tContent row
    * @param {Object} values
    * @param {Object} settings
    * @param {Object} screenConfig
    * @param {Object} recordConfig
    * @param {Object} mode
    * @param {Object} rowId
    */
    getColumnsForTContentRow: function(values, settings, screenConfig, recordConfig, mode, rowId) {
        if (!Object.isEmpty(values.fields)) {
            var modeBackup = this.mode;
            var isEditable = this.isTContentEditable(screenConfig['@screen']);
            this.mode = "display";
            var newColumns = [];
            //Getting default values to show or not edit and delete buttons
            var showEditButton = this.tContent.get(screenConfig['@screen'] + "_" + recordConfig['@rec_index']).showEditButton;
            var showDeleteButton = this.tContent.get(screenConfig['@screen'] + "_" + recordConfig['@rec_index']).showDeleteButton;
            //Create fieldDisplayers for each field
            objectToArray(values.fields.yglui_str_wid_field).each(function(field) {
                if (field['@fieldid'] == "TMODIF") {
                    //If it has custom field TMODIF to show or not edit and delete buttons
                    var tModifConfig = field['@value'];
                    if (!Object.isEmpty(tModifConfig)) {
                        tModifConfig = tModifConfig.toLowerCase();
                        if (tModifConfig.include("x"))
                            showDeleteButton = false;
                        if (tModifConfig.include("y"))
                            showEditButton = false;
                    }
                }
                var value = this._getTextToShow(field, settings.get(field['@fieldid']), screenConfig, recordConfig);
                //Only add it to the table if it's not hidden
                if (Object.isEmpty(settings.get(field['@fieldid'])['@display_attrib']) || (settings.get(field['@fieldid'])['@display_attrib'] != "HID" && settings.get(field['@fieldid'])['@display_attrib'] != "HOU")) {
                    //If we are just adding a row:
                    newColumns[parseInt(settings.get(field['@fieldid'])['@seqnr'], 10)] = {
                        text: value,
                        id: 'tcontentField_row_' + values['@seqnr'] + '_' + field['@fieldid']
                    };
                }
            } .bind(this));

            //Create the buttons for each row
            if (mode != 'display' && isEditable) {// not taken into account this.showButtons for tcontent, after latest requirements
                var mainButtonsJson = {
                    elements: []
                };
                //Check if we want to show edit and delete buttons
                if (showEditButton || showDeleteButton) {
                    var settingsToUse = this.tContent.get(screenConfig['@screen'] + "_" + recordConfig['@rec_index']).settingsForRows.get(rowId);
                    if (showDeleteButton) {
                        if (global.liteVersion) {
                            var label = "X";
                            var classes = "fieldsPanel_deleteButton";
                        }
                        else {
                            var label = "";
                            var classes = "application_currentSelection fieldsPanel_deleteButton";
                        }
                        var editButton = {
                            idButton: 'tContent_deleteButton_' + values['@seqnr'],
                            label: label,
                            handlerContext: null,
                            handler: this.openPopupTContent.bind(this, "delete", screenConfig, recordConfig, rowId, settingsToUse, false, mode),
                            className: classes,
                            type: 'button'
                        };
                        mainButtonsJson.elements.push(editButton);
                    }
                    if (showEditButton) {
                        if (global.liteVersion) {
                            var label = global.getLabel("KM_EDIT");
                            var classes = "application_action_link link";
                            var type = "link";
                        } else {
                            var label = "";
                            var classes = "application_editSelection fieldsPanel_deleteButton";
                            var type = "button";
                        }
                        var deleteButton = {
                            idButton: 'tContent_editButton_' + values['@seqnr'],
                            label: label,
                            handlerContext: null,
                            handler: this.openPopupTContent.bind(this, "edit", screenConfig, recordConfig, rowId, settingsToUse, false, mode),
                            className: classes,
                            type: type
                        };
                        mainButtonsJson.elements.push(deleteButton);
                    }
                    var button = new megaButtonDisplayer(mainButtonsJson);
                    newColumns.unshift({
                        text: button.getButtons(),
                        id: [recordConfig['@rec_index'], '_', screenConfig['@screen'], '_', values['@seqnr'], '_fieldsPanel_tcontentHeader_deleteButton_', this.appId].join('')
                    });
                } else {
                    //We don't have to show any button
                    newColumns.unshift({
                        text: ""
                    });
                }
            }
            else {
                //We don't have to show any button
                newColumns.unshift({
                    text: ""
                });
            }
            this.mode = modeBackup;
            return newColumns;
        } else {
            return null;
        }
    },


    /**
    * Updates the values in a row of the JSON.
    * @param {Object} rowId the id for the row
    * @param {Object} values the new values for the screen
    * @param {Object} screen the id or name of the screen.
    * @param {Object} record the id for the record.
    */
    updateRowInJson: function(rowId, values, screenConfig, recordConfig) {
        //This is the place where all the other rows are in the JSON:
        var jsonRowContainer = this.tContent.get(screenConfig['@screen'] + "_" + recordConfig['@rec_index']).jsonRowContainer;
        var jsonRowContainer = objectToArray(jsonRowContainer);
        for (var i = 0; i < jsonRowContainer.length; i++) {
            if (jsonRowContainer[i]['@seqnr'] == rowId) {
                jsonRowContainer[i] = values;
                this.tContent.get(screenConfig['@screen'] + "_" + recordConfig['@rec_index']).jsonRows.set(rowId, values);
                break;
            }
        }
        this.tContent.get(screenConfig['@screen'] + "_" + recordConfig['@rec_index']).jsonRowContainer = jsonRowContainer;
        this.setJSONRowContainer(screenConfig, recordConfig['@rec_index'], jsonRowContainer);
    },

    /**
    * Updates a row from the tContent table
    * @param {Object} rowId the id for the row
    * @param {Object} values the new values for the screen
    * @param {Object} screen the id or name of the screen.
    * @param {Object} record the id for the record.
    * @param {Object} settings the settings for the fields
    * @param {Object} mode create, edit or display
    */
    updateRowInTContentTable: function(rowId, values, screenConfig, recordConfig, settings, mode) {
        newColumns = this.getColumnsForTContentRow(values, settings, screenConfig, recordConfig, mode, rowId);
        var newRow = $H();
        newRow.set("row" + rowId, {
            data: newColumns.compact()
        });
        this.tContent.get(screenConfig['@screen'] + "_" + recordConfig['@rec_index']).simpleTableObject.updateRow("row" + rowId, newRow);

    },

    /**
    * Deletes a row from the tContent table
    * @param {Object} rowId  the id for the row.
    * @param {Object} screen the id or name of the screen.
    * @param {Object} record the id for the record.
    */
    deleteRowFromTContentTable: function(rowId, screenConfig, recordConfig) {
        this.tContent.get(screenConfig['@screen'] + "_" + recordConfig['@rec_index']).simpleTableObject.removeRow("row" + rowId);
    },

    /**
    * Fires a PAI event related to a whole row
    * @param {Object} paiName the name of the service we should call.
    * @param {Object} rowId the id for the row.
    * @param {Object} screen the id or name of the screen.
    * @param {Object} record the id for the record.
    */
    firePaiTContent: function(paiName, rowId, screenConfig, recordConfig) {
        var obj = {
            appId: this.appId,
            screen: screenConfig['@screen'],
            record: recordConfig['@rec_index'],
            servicePai: paiName,
            currentValue: "",
            fieldId: ""
        };
        document.fire('EWS:getContentModule_paiEvent_' + this.appId + this.name + this.randomId, obj);
    },

    /**
    * This function will add, update or delete a chosen row calling other functions.
    * It will also call functions to update de HTML table. It’s called when the user clicks on Save or Delete buttons.
    * @param {Object} mode create, edit or display
    * @param {Object} rowId the id for the row.
    * @param {Object} screen the id or name of the screen.
    * @param {Object} record the id for the record.
    * @param {Object} settings the settings for the fields
    */
    saveTContentRow: function(mode, rowId, screenConfig, recordConfig, settings) {
        //Check mandatory fields
        if (!this.checkMandatoryFieldsTContent(screenConfig, recordConfig, rowId, mode)) {
            //Put error messages?
            return;
        }
        //Execute custom functions if any
        var executeDefaultCode = true;
        var customFunction = this._getCustomFunctionTContent(screenConfig['@screen'], mode, rowId);
        var order = "customThenDefault";
        if (customFunction && customFunction.order)
            order = customFunction.order;
        //If we receive order = onlyCustom we don't execute our default code
        if (order == "onlyCustom")
            executeDefaultCode = false;
        if (customFunction && customFunction.f && (order == "onlyCustom" || order == "customThenDefault"))
            customFunction.f.call();
        if (executeDefaultCode) {
            //Depending on the mode it will call functions to update, add or delete the row both in html and json.
            if (mode == "create") {
                //The row is already in the JSON, we just have to add it to the table
                var values = this.tContent.get(screenConfig['@screen'] + "_" + recordConfig['@rec_index']).jsonRows.get(rowId);
                this.addRowToTContentTable(rowId, values, settings, screenConfig, recordConfig, mode, false);
            }
            else if (mode == "edit") {
                //JSON is already updated, we just have to update the tContent table
                var values = this.tContent.get(screenConfig['@screen'] + "_" + recordConfig['@rec_index']).jsonRows.get(rowId);
                this.tContent.get(screenConfig['@screen'] + "_" + recordConfig['@rec_index']).jsonRowContainer['@modified'] = "X";
                this.updateRowInTContentTable(rowId, values, screenConfig, recordConfig, settings, mode);
            }
            else if (mode == "delete") {
                var values = this.tContent.get(screenConfig['@screen'] + "_" + recordConfig['@rec_index']).jsonRows.get(rowId);
                //If we are deleting: delete it from JSON and table
                this.deleteRowFromJson(rowId, screenConfig, recordConfig);
                this.deleteRowFromTContentTable(rowId, screenConfig, recordConfig);
            }
            //Show/hide the add button:
            var actualRows = this.tContent.get(screenConfig['@screen'] + "_" + recordConfig['@rec_index']).simpleTableObject._rowPointer.size();
            if (this.options.tContent && this.options.tContent.get(screenConfig['@screen']) &&
			actualRows >= this.options.tContent.get(screenConfig['@screen']).maxRows) {
                if (this.tContent.get(screenConfig['@screen'] + "_" + recordConfig['@rec_index']).addButton)
                    this.tContent.get(screenConfig['@screen'] + "_" + recordConfig['@rec_index']).addButton.hide();
            }
            else {
                if (this.tContent.get(screenConfig['@screen'] + "_" + recordConfig['@rec_index']).addButton)
                    this.tContent.get(screenConfig['@screen'] + "_" + recordConfig['@rec_index']).addButton.show();
            }
            //Close the popup and delete the created fieldDisplayers
            this.closeTContentPopUp(mode, rowId, screenConfig['@screen'], recordConfig['@rec_index']);
            //Update variant related services
            var variantInfo = this.variant.get(this.appId + "_" + screenConfig['@screen']);
            if (!Object.isEmpty(variantInfo) && !Object.isEmpty(values.fields)) {
                //Get value for variant,
                var variant = null;
                var fieldValues = objectToArray(values.fields.yglui_str_wid_field);
                for (var i = 0; i < fieldValues.size(); i++) {
                    if (fieldValues[i]['@fieldid'] == variantInfo.tvariantId) {
                        variant = fieldValues[i]['@value'];
                        break;
                    }
                }
                this.updateRecordVariant(variant, screenConfig['@screen'], recordConfig['@rec_index'], true, rowId);
                var allSettings = this.tContent.get(screenConfig['@screen'] + "_" + recordConfig['@rec_index']).allSettings;
                var newSettings = this.getSettingsForVariant(allSettings, variant, true);
                this.tContent.get(screenConfig['@screen'] + "_" + recordConfig['@rec_index']).settingsForRows.set(rowId, newSettings);
            }
        } else {
            //If we don't want to execute the default code, we revert the changes like if we had hit Cancel
            this.discardChangesTContentRow(mode, rowId, screenConfig, recordConfig, settings);
        }
        //Execute the custom function if order=="defaultThenCustom"
        if (customFunction && customFunction.f && order == "defaultThenCustom")
            customFunction.f.call();
        //Validate form
        this.validateForm(screenConfig['@screen'], recordConfig['@rec_index'], false);
        //Fire paiEvent associated with the row
        var rowPAI = this.tContent.get(screenConfig['@screen'] + "_" + recordConfig['@rec_index']).rowPAI;
        if (!Object.isEmpty(rowPAI)) {
            this.firePaiTContent(rowPAI, rowId, screenConfig, recordConfig);
        }
    },
    /**
    * This function is called when the cancel button is pressed.
    * It will get the getContent back to the state it was in before opening the popup.
    * @param {Object} mode create, edit or display
    * @param {Object} rowId the id for the row.
    * @param {Object} screen the id or name of the screen.
    * @param {Object} record the id for the record.
    * @param {Object} settings the settings for the fields
    */
    discardChangesTContentRow: function(mode, rowId, screenConfig, recordConfig, settings) {
        //If it’s in “create” mode, it will delete the row from json.
        if (mode == "create") {
            this.deleteRowFromJson(rowId, screenConfig, recordConfig);
        } else if (mode == "edit") {
            //If it’s “edit” mode it will restore the original copy of the json.
            var originalValues = this.tContent.get(screenConfig['@screen'] + "_" + recordConfig['@rec_index']).originalValues;
            this.updateRowInJson(rowId, originalValues, screenConfig, recordConfig);
            //Get value for variant,
            var variantInfo = this.variant.get(this.appId + "_" + screenConfig['@screen']);
            if (!Object.isEmpty(variantInfo)) {
                var variant = null;
                var fieldValues = objectToArray(originalValues.fields.yglui_str_wid_field);
                for (var i = 0; i < fieldValues.size(); i++) {
                    if (fieldValues[i]['@fieldid'] == variantInfo.tvariantId) {
                        variant = fieldValues[i]['@value'];
                        break;
                    }
                }
            }
            this.updateRecordVariant(variant, screenConfig['@screen'], recordConfig['@rec_index'], true, rowId);
        } else if (mode == "delete") {
            //If it’s “delete” mode it will do nothing but closing the popup.
        }
        //Close the popup and delete the created fieldDisplayers
        this.closeTContentPopUp(mode, rowId, screenConfig, recordConfig);
    },
    /**
    * Function called when a paiEvent has been fired from a field within tContent
    * @param {Object} args
    */
    paiHandlerTContent: function(args) {
        //Create the PAI xmlIn 
        if (!this.callingPAITContent) {
            this.callingPAITContent = true;   //Avoid two or more calls in the same tContent
            var arguments = getArgs(args);
            var servicePai = arguments.servicePai;
            var requestIdToSend = "";
            if (!Object.isEmpty(this.requestId)) {
                requestIdToSend = this.requestId;
            }
            var objectId = this.objectId;
            if (Object.isEmpty(objectId)) {
                var selectedEmployees = global.getSelectedEmployees();
                if (!Object.isEmpty(selectedEmployees) && !Object.isEmpty(selectedEmployees[0])) {
                    objectId = selectedEmployees[0];
                } else {
                    objectId = "";
                }
            }
            var settings = this.json.EWS.o_field_settings;
            var values = this.json.EWS.o_field_values;
            var jsonToSend = {
                EWS: {
                    SERVICE: servicePai,
                    OBJECT: {
                        TYPE: 'P',
                        TEXT: objectId
                    },
                    PARAM: {
                        APPID: this.appId,
                        o_field_settings: settings,
                        o_field_values: values,
                        req_id: requestIdToSend,
                        o_t_field_changed: {
                            FIELDID: arguments.fieldId,
                            FIELDTECHNAME: arguments.techName,
                            SCREEN: arguments.screen,
                            REC_INDEX: arguments.record,
                            SEQNR: arguments.rowSeqnr
                        }
                    }
                }
            };
            var json2xml = new XML.ObjTree();
            var screens = objectToArray(jsonToSend.EWS.PARAM.o_field_values.yglui_str_wid_record);
            for (var i = 0; i < screens.length; i++) {
                if (screens[i].contents.yglui_str_wid_content.fields) {
                    var fields = objectToArray(screens[i].contents.yglui_str_wid_content.fields.yglui_str_wid_field);
                    for (var a = 0; a < fields.length; a++) {
                        if (!Object.isEmpty(fields[a]['#text']))
                            fields[a]['#text'] = unescape(fields[a]['#text']);
                    }
                } else {
                    var records = objectToArray(screens[i].contents.yglui_str_wid_content);
                    for (var b = 0; b < records.length; b++) {
                        var fields = objectToArray(records[b].fields.yglui_str_wid_field);
                        for (var a = 0; a < fields.length; a++) {
                            if (!Object.isEmpty(fields[a]['#text']))
                                fields[a]['#text'] = unescape(fields[a]['#text']);
                        }
                    }
                }
            }
            json2xml.attr_prefix = '@';
            this.showLoadingMessageTContent();
            this.makeAJAXrequest($H({
                xml: json2xml.writeXML(jsonToSend),
                successMethod: this.paiSuccessTContent.bind(this, this.originalMode, arguments.screen, arguments.record, arguments.rowSeqnr, arguments.fieldId),
                failureMethod: this._failureMethod.bind(this)
            }));
        }
    },
    /**
    * Method called when the PAI service
    * @param {Object} $super
    */
    _failureMethod: function($super) {
        $super();
        this.hideLoadingMessageTContent();
        this.callingPAITContent = false;  // Let other PAIs be called
        //Disable save button:
        this.tContentButtonDisplayer.disable(this.tContentSaveButtonId);

    },
    /**
    * Gets all the info about one screen
    * @param {Object} screen The screen number
    */
    getScreenInfo: function(screen) {
        if (!Object.isEmpty(this.json.EWS.o_widget_screens.yglui_str_wid_screen)) {
            var screensInfo = objectToArray(this.json.EWS.o_widget_screens.yglui_str_wid_screen);
            for (var i = 0; i < screensInfo.size(); i++) {
                if (screensInfo[i]['@screen'] == screen) {
                    return screensInfo[i];
                }
            }
            return null;
        } else {
            return null;
        }
    },
    /**
    * Function called when a paiEvent associated with a field inside tContent is successful
    * @param {Object} mode the mode
    * @param {Object} screen the screen number
    * @param {Object} record the record index
    * @param {Object} rowId the id for the row
    * @param {Object} paiCallerFieldId fieldid for the field that called the PAI 
    * @param {Object} json json received after the pai call
    */
    paiSuccessTContent: function(mode, screen, record, rowId, paiCallerFieldId, json) {
        this.callingPAITContent = false;  // Let other PAIs be called
        //Locate the values for this tContent row
        var updated = false;
        screenConfig = this.getScreenInfo(screen);
        var recordConfig = {};
        recordConfig['@rec_index'] = record;


        if (Object.isArray(json.EWS.o_field_values.yglui_str_wid_record)) {
            var screens = objectToArray(json.EWS.o_field_values.yglui_str_wid_record);
            for (var i = 0; i < screens.size(); i++) {
                if (screens[i]['@screen'] == screen) {
                    ourScreenNumber = i;
                    var receivedScreen = json.EWS.o_field_values.yglui_str_wid_record[ourScreenNumber];
                    //See if there is a record inside our screen that has the rec_index:
                    var records = objectToArray(receivedScreen.contents.yglui_str_wid_content);
                    var found = false;
                    for (var j = 0; j < records.size(); j++) {
                        if (records[j]['@rec_index'] == record) {
                            found = true;
                            break;
                        }
                    }
                    //If it has the record, this is our screen
                    if (found)
                        break;
                }
            }
            var receivedScreen = json.EWS.o_field_values.yglui_str_wid_record[ourScreenNumber];
        } else {
            var receivedScreen = json.EWS.o_field_values.yglui_str_wid_record;
        }
        //Look for the received row that has the same rowId, store it in receivedRow

        //We store in ourRecord the json part of our record, taking into acount that if there's only one, the structure is different
        if (Object.isArray(receivedScreen.contents.yglui_str_wid_content)) {
            var records = objectToArray(receivedScreen.contents.yglui_str_wid_content);
            for (var i = 0; i < records.size(); i++) {
                if (records[i]['@rec_index'] == record) {
                    ourRecordNumber = i;
                    break;
                }
            }
            var receivedRecord = receivedScreen.contents.yglui_str_wid_content[ourRecordNumber];
        } else {
            var receivedRecord = receivedScreen.contents.yglui_str_wid_content;
        }
        //Search for the row in received record
        var rows = objectToArray(receivedRecord.tcontents.yglui_str_wid_tcontent);
        for (var i = 0; i < rows.size(); i++) {
            if (rows[i]['@seqnr'] == rowId) {
                var receivedRow = rows[i];
                break;
            }
        }
        //Update our row using it:
        this.tContent.get(screenConfig['@screen'] + "_" + recordConfig['@rec_index']).jsonRows.set(rowId, receivedRow);
        //Update the values for every field inside this row (except the one that called the PAI service)
        for (var i = 0; i < receivedRow.fields.yglui_str_wid_field.size(); i++) {
            var fieldId = receivedRow.fields.yglui_str_wid_field[i]['@fieldid'];
            var fd = this.getFieldDisplayer(this.appId, mode, screen, record, fieldId, true, rowId);
            //Change values in all fields but the one that called the PAI
            var newValue = receivedRow.fields.yglui_str_wid_field[i]['@value'];
            var newText = receivedRow.fields.yglui_str_wid_field[i]['#text'];
            if (fd.options.id != paiCallerFieldId) {
                fd.setValue.bind(fd, newValue, newText).defer();
            } else {
                //When the PAI caller depends on other field, its value will be tried to 
                //be retrieved, probably calling PAI two times
                if (fd.parentField) {
                    fd._firstTimeGettingValue = true;
                }
                //Update options.json && options.value
                fd.options.value = fd.options.optionsJSON.values["@value"];
                fd.options.text = fd.options.optionsJSON.values["#text"];
            }
        }
        this.hideLoadingMessageTContent();
        //If we receive a warning, we show it.
        if (json.EWS && json.EWS.messages && json.EWS.messages.item && json.EWS.messages.item['@msgty'] == 'W') {
            var errorText = json.EWS.messages.item['#text'];
            this.warningMethodTContent(errorText);
        }
    },
    warningMethodTContent: function(errorText) {
        if (Object.isEmpty($("idDivInfoPopUpContainer").down('[id=idModuleInfoPopUp_container]').down('[id=moduleInfoPopUp_content]').down('[id=idModuleInfoPopUp_textMessagePart]').down('[id=popUpErrorDiv]'))) {
            var errorDiv = new Element('div', { 'id': 'popUpErrorDiv', 'class': 'fieldError genCat_balloon_span FWK_errorMessages' });
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
        else {
            var errorDiv = $("idDivInfoPopUpContainer").down('[id=idModuleInfoPopUp_container]').down('[id=moduleInfoPopUp_content]').down('[id=idModuleInfoPopUp_textMessagePart]').down('[id=popUpErrorDiv]');
        }
        errorDiv.insert("<div class ='fieldWarning'>" + errorText + "</div>");
    },
    /**
    * Function called when a paiEvent associated with a field inside tContent is not successful
    * @param {Object} mode the mode
    * @param {Object} screen the screen number
    * @param {Object} record the record index
    * @param {Object} rowId the id for the row
    * @param {Object} json th json received after the pai call
    * @param {Object} motive the motive for the error: "error" or "failure"
    */
    paiErrorTContent: function(mode, screen, record, rowId, json) {
        this.hideLoadingMessageTContent();
        //Disable save button:
        this.tContentButtonDisplayer.disable(this.tContentSaveButtonId);
        //Calling the origin methods to handle that
        if (!Object.isEmpty(motive)) {
            if (motive == "error") {
                this._errorMethod(json);
            } else if (motive == "failure") {
                this._failureMethod(json);
            }
        } else {
            var text = json.EWS.webmessage_text;
            this.showErrorInPopup(text);
        }
    },
    /**
    * Closes the popup and deletes the created fieldDisplayers for it
    * @param {Object} mode
    * @param {Object} rowId
    * @param {Object} screenConfig
    * @param {Object} recordConfig
    */
    closeTContentPopUp: function(mode, rowId, screenConfig, recordConfig) {
        //Delete created fieldDisplayers. When deleting a field displayer remember to update their dependency info
        if (mode != "display" && mode != "delete") {
            var keyForRecord = this.appId + mode + screenConfig['@screen'] + recordConfig['@rec_index'];
            var fieldsForRecord = this.fieldDisplayers.get(keyForRecord);
            if (!Object.isEmpty(fieldsForRecord)) {
                var settings = this.tContent.get(screenConfig['@screen'] + "_" + recordConfig['@rec_index']).settings;
                var settingsKeys = settings.keys();
                for (var i = 0; i < settingsKeys.size(); i++) {
                    var fieldKey = settings.get(settingsKeys[i])['@fieldid'] + "_trow_" + rowId;
                    var fieldToDelete = fieldsForRecord.get(fieldKey);
                    if (!Object.isEmpty(fieldToDelete)) {
                        fieldToDelete.destroy(fieldToDelete);
                        fieldsForRecord.unset(fieldKey);
                    }
                }
            }
        }
        //Close the popup:
        this.tContentPopUp.close();
        delete this.tContentPopUp;
    },
    /**
    * Checks the fields that are mandatory in a tContent poup
    * @param {Object} screenConfig
    * @param {Object} recordConfig
    * @param {Object} rowId
    * @param {Object} mode
    */
    checkMandatoryFieldsTContent: function(screenConfig, recordConfig, rowId, mode) {
        if (mode == "delete" || mode == "display") {
            return true;
        }
        var keyForRecord = this.appId + mode + screenConfig['@screen'] + recordConfig['@rec_index'];
        var fieldsForRecord = this.fieldDisplayers.get(keyForRecord);
        if (Object.isEmpty(fieldsForRecord)) {
            return true;
        }
        var settings = this.tContent.get(screenConfig['@screen'] + "_" + recordConfig['@rec_index']).settings;
        var settingsKeys = settings.keys();
        var allCorrect = true;
        var message = new Element('div', { 'class': 'test_errorStatusMsg', 'id': 'errorDiv_' + this.appId + screenConfig['@screen'] + recordConfig['@rec_index'] + "row" + rowId });
        for (var i = 0; i < settingsKeys.size(); i++) {
            var fieldKey = settings.get(settingsKeys[i])['@fieldid'] + "_trow_" + rowId;
            var fieldtoCheck = fieldsForRecord.get(fieldKey);
            if (!Object.isEmpty(fieldtoCheck) && fieldtoCheck.isValid) {//the method exists
                if (fieldtoCheck && fieldtoCheck.options) {
                    //Adding try catch because the method setInvalid sometimes fails
                    try {
                        if (!fieldtoCheck.isValid()) {// if invalid
                            var label = !Object.isEmpty(fieldtoCheck.options.label) ? fieldtoCheck.options.label : fieldtoCheck.key;
                            if (fieldtoCheck.options.mandatory === false && !Object.isEmpty(fieldtoCheck.fieldMask)) {
                                //If it's a non-mandatory field, but has a mask and is incorrect
                                message.insert(label + ': ' + global.getLabel('fieldMaskError'));
                            } else {
                                message.insert(new Element("p").insert(label + ': ' + global.getLabel('fieldError')));
                            }
                            fieldtoCheck.setInvalid();
                            allCorrect = false;
                        }
                    } catch (e) { }
                }
            }
        }
        if (!allCorrect) {
            this.showErrorInPopup(message);
        }
        return allCorrect;
    },
    showLoadingMessageTContent: function() {
        if (!Object.isEmpty(this.loadingMessageTContent)) {
            this.loadingMessageTContent.show();
        }
    },
    hideLoadingMessageTContent: function() {
        if (!Object.isEmpty(this.loadingMessageTContent)) {
            this.loadingMessageTContent.hide();
        }
    },
    //***************************************************************
    //FIELDDISPLAYER LAYER
    //***************************************************************
    /**
    * Creates a fieldDisplayer, stores it in fieldDisplayers hash, and returns its HTML
    * @param {Object} fieldInfo Settings of the field to create:
    * 						- settings: the settings coming from JSON
    * 						- values: the values coming from JSON
    * 						- screen: the screen that contains the field
    * 						- record: the record that contains the field
    * 						- key_str
    * 						- getFieldValueAppend: XML to append when creating the XML to get field values
    * @param returnObject: boolean (optional), if set to true, the fieldDisplayer Object is returned instead of the HTML 
    * @param mode: if we want to create it in other mode than the default
    * @param dontStoreIt: if true, we won't store it in the fieldDisplayers hash 
    */
    fieldDisplayer: function(fieldInfo, returnObject, rowSeqnr, mode, dontStoreIt) {
        if (mode)
            var dispMode = mode;
        else
            var dispMode = this.mode;
        if (Object.isEmpty(rowSeqnr)) {
            rowSeqnr = null;
        }
        var f = $FD(
			{ settings: fieldInfo.settings,
			    values: fieldInfo.values
			},
			fieldInfo.screen,
			fieldInfo.record,
			fieldInfo.key_str,
			this.appId,
			dispMode,
			this.labels,
			this.fieldDisplayerModified,
			this.cssClasses,
			this.predefinedXmls,
			this.linkTypeHandlers,
			this.name,
			fieldInfo.getFieldValueAppend,
			fieldInfo.randomId,
			rowSeqnr,
			this.variant,
			this,
			this.dateRanges.get(fieldInfo.screen)
		);
        if (Object.isEmpty(dontStoreIt)) {
            var fieldContainerId = this.appId + dispMode + fieldInfo.screen + fieldInfo.record;
            var fieldId = fieldInfo.settings['@fieldid']
            if (f._isTContent(f.options)) {
                fieldId += "_trow_" + f.options.rowSeqnr;
            }
            if (Object.isEmpty(this.fieldDisplayers.get(fieldContainerId))) {
                this.fieldDisplayers.set(fieldContainerId, $H());
                this.fieldDisplayers.get(fieldContainerId).screen = fieldInfo.screen;
                this.fieldDisplayers.get(fieldContainerId).record = fieldInfo.record;
                this.fieldDisplayers.get(fieldContainerId).mode = dispMode;
            }
            //Add the field to the fieldDisplayers hash
            if (Object.isEmpty(this.fieldDisplayers.get(fieldContainerId).get(fieldId))) {
                this.fieldDisplayers.get(fieldContainerId).set(fieldId, f);
            }
        }
        if (Object.isEmpty(returnObject) || !returnObject) {
            //We want the HTML
            return f.getHtml();
        } else {
            //We want the object
            return f;
        }
    },
    destroy: function() {
        if (!Object.isEmpty(this.fieldDisplayers)) {
            for (var i = 0; i < this.fieldDisplayers.keys().length; i++) {
                var displayer = this.fieldDisplayers.get(this.fieldDisplayers.keys()[i]);
                for (var j = 0; j < displayer.keys().length; j++) {
                    displayer.get(displayer.keys()[j]).destroy();
                }
                delete displayer;
                this.fieldDisplayers.unset(this.fieldDisplayers.keys()[i]);
            }
            //Stop observing events:
            delete this.fieldDisplayers;
        }
        this._stopObservingEvents();
        this._stopSendDocumentListeners();
        if (this.element && this.element.parentNode) {
            this.element.remove();
            delete this.element;
        }
        if (!Object.isEmpty(this.editRowPopup)) {
            this.editRowPopup.close();
            delete this.editRowPopup;
        }
    },
    /**
    * Stops observing all the events that have been observed using _startObserving
    */
    _stopObservingEvents: function() {
        if (!Object.isEmpty(this.listenedEvents)) {
            var eventKeys = this.listenedEvents.keys();
            for (var i = 0; i < eventKeys.size(); i++) {
                document.stopObserving(eventKeys[i]);
            }
        }
    },
    /**
    * Start observing an event that will be stop oberving at the destroy 
    * @param {Object} eventName
    * @param {Object} functionObject
    */
    _startObserving: function(eventName, functionObject) {
        if (Object.isEmpty(this.listenedEvents)) {
            this.listenedEvents = $H();
        }
        this.listenedEvents.set(eventName, eventName);
        document.observe(eventName, functionObject);
    },
    /**
    * Validates the form: shows warning/error messages
    * @param {Int} screen: the number of the current screen
    * @param {Int} record: the index of the current record
    * @param {Boolean} creation: whether we are in the creation of the getContentModule or not
    * @returns true if all the fields of the form are valid and false if they are not
    */
    validateForm: function(screen, record, creation) {
        var state = true;
        this.messages = new Element('div');
        var fieldsToCheck = $H();
        var changed = false;
        var firstTranslationRecordKey;
        var firstTranslationRecord;
        var firstFilledTranslationRecordKey;
        var firstFilledTranslationRecord;
        var noTranslations = true;
        for (var i = 0; i < this.fieldDisplayers.keys().length; i++) {
            var records = this.fieldDisplayers.get(this.fieldDisplayers.keys()[i]);
            var conti = true;
            if (records.keys().include('TRANSLATION')) {
                noTranslations = false;
                if (Object.isEmpty(firstTranslationRecordKey)) {
                    firstTranslationRecordKey = this.fieldDisplayers.keys()[i];
                    firstTranslationRecord = records;
                }
                for (var j = 0; j < records.keys().length && conti; j++) {
                    var haveText = false;
                    var field = records.get(records.keys()[j]);
                    field.setValid();
                    var actualValue = field.getValue();
                    if (Object.isEmpty(actualValue.id))
                        actualValue.id = null;
                    if (Object.isEmpty(actualValue.text)) {
                        actualValue.text = null;
                    }
                    else {
                        //We keep the first recordKey of the translation with value
                        if (field.options.id != "TRANSLATION" && field.options.mandatory) {
                            haveText = true;
                            firstFilledTranslationRecordKey = this.fieldDisplayers.keys()[i];
                            firstFilledTranslationRecord = records;
                        }

                    }
                    if ((field.options.text != prepareTextToEdit(actualValue.text) && !Object.isEmpty(actualValue.text)) || (field.options.value != actualValue.id) || haveText) {
                        fieldsToCheck.set(this.fieldDisplayers.keys()[i], records);
                        changed = true;
                        conti = false;
                    }
                }
            }
            else {
                //check if we are validating the screen and record we want to validate
                if ((Object.isEmpty(screen) || records.screen == screen) && (Object.isEmpty(record) || records.record == record))
                    fieldsToCheck.set(this.fieldDisplayers.keys()[i], records);
            }
        }
        if (!changed && !noTranslations) {
            if (Object.isEmpty(firstFilledTranslationRecordKey)) {
                //If there isn't any record of the translation filled, we check the first one.
                fieldsToCheck.set(firstTranslationRecordKey, firstTranslationRecord);
            }
            else {
                //If there is some record of the translation filled, we check it.
                fieldsToCheck.set(firstFilledTranslationRecordKey, firstFilledTranslationRecord);
            }
        }
        //looping over all fieldDisplayer objects
        /*if (!screen || !record) {
        if (this.currentSelected)
        screen = this.currentSelected.toString();
        record = this.currentRecordIndex ? this.currentRecordIndex.toString() : "0";
        }*/
        fieldsToCheck.each(function(reg) {
            if (reg.key.endsWith(screen + record) || Object.isEmpty(screen) || Object.isEmpty(record)) {
                reg.value.each(function(field) {
                    //To avoid crashing because of any fieldDisplayer type without checkFormat() method
                    try {
                        //calling each fieldDisplayer checkFormat() method
                        if (field.value.isValid) {//the method exists
                            if (field.value && field.value.options && field.value.options.mode != 'display') {
                                var label = !Object.isEmpty(field.value.options.label) ? field.value.options.label : field.key;
                                var message = new Element('div', { 'class': 'test_errorStatusMsg', 'id': 'errorDiv_' + field.value.options.id + field.value.options.appId + field.value.options.screen + field.value.options.record });
                                if (field.value.options.mandatory === false && !Object.isEmpty(field.value.fieldMask)) {
                                    //If it's a non-mandatory field, but has a mask and is incorrect
                                    message.insert(label + ': ' + global.getLabel('fieldMaskError'));
                                } else {
                                    //If it's a mandatory field that is not filled
                                    message.insert(label + ': ' + global.getLabel('fieldError'));
                                }
                                this.messages.insert(message); //we insert it even if correct, because we need further dynamic checks
                                message.hide();
                                //We only want to show messages if we are not creating the getContent now
                                if (!creation && !field.value.isValid()) {// if invalid, but only if it is not creation
                                    field.value.setInvalid(message);
                                    state = false;
                                    //If the field has a valid value, we might still want to show a warning message is the
                                    //field is a date
                                } else if (!creation && !Object.isEmpty(field.value.correctDate)) {
                                    field.value.setValid(message);
                                }
                            }
                        }
                    } catch (e) { }
                } .bind(this));
            }
        } .bind(this));
        //Check "send documents" info
        if (!creation && !this._checkDocuments(screen, record)) {
            state = false;
            this.messages.insert(global.getLabel("missingDocuments"));
        }
        //Check tContent maximum and minimum rows
        if (!creation && !Object.isEmpty(this.tContent.get(screen + "_" + record))) {
            var actualRows = this.tContent.get(screen + "_" + record).simpleTableObject._rowPointer.size();
            if (this.options.tContent && this.options.tContent.get(screen) &&
            actualRows > this.options.tContent.get(screen).maxRows) {
                state = false;
                this.messages.insert(global.getLabel("maximumRows" + ": " + this.options.tContent.get(screen).maxRows));
            }
            if (this.options.tContent && this.options.tContent.get(screen) &&
            actualRows < this.options.tContent.get(screen).minRows) {
                state = false;
                this.messages.insert(global.getLabel("minimumRows" + ": " + this.options.tContent.get(screen).minRows));
            }
        }
        this.errorsDiv.update(this.messages);
        return {
            correctForm: state,
            errorMessage: ''
        };
    },
    /**
    * addErrorMessage: add a new error message from the application
    * @param {HTML} : an html element containing the error message
    */
    addErrorMessage: function(errorDiv) {
        this.errorsDiv.insert(errorDiv);
    },
    /*
    * @method addAsterisk
    * @desc Adds an asterisk to label if mandatory field
    * @param origLabel Original label to be modified
    * @param display Display mode for the attribute
    * @return if the field is mandatory, the original label plus an asterisk, otherwise, the original label
    */

    addAsterisk: function(origLabel, display) {
        var retLabel = origLabel;
        // Mandatory field -> a * should appear in header
        if (!Object.isEmpty(display)) {
            if ((this.mode != 'display') && (display.toLowerCase() == 'man'))
                retLabel += " *";
        }
        return retLabel;
    },
    /**
    * Creates the information need for the "Send document" info
    * @param {Object} buttonInfo The info for the button
    * @param {Object} screen
    * @param {Object} record
    * @param {Object} element The DOM element where we will insrt info about the status of the upload
    */
    _createSendDocumentInfo: function(buttonInfo, screen, record, element) {
        //Create a hash (sendDocumentInfo). It will contain the info for documents in each record.
        var infoForRecord = this.sendDocumentInfo.get(screen + "_" + record);
        if (Object.isEmpty(infoForRecord)) {
            infoForRecord = {};
            this.sendDocumentInfo.set(screen + "_" + record, infoForRecord);
        }
        infoForRecord.buttonInfo = buttonInfo;
        infoForRecord.element = element;
        infoForRecord.uploadStatus = "notStarted";
        //Get type D fields
        var fields = this.screensNavigationLayerData.get(screen).get("settings");
        infoForRecord.documents = $H();
        for (var i = 0; i < fields.size(); i++) {
            if (!Object.isEmpty(fields[i]['@fieldsource']) && fields[i]['@fieldsource'].toLowerCase() == "d")
                infoForRecord.documents.set(fields[i]['@fieldid'], fields[i]);
        }
        //Create the function to call when pressing "Send document button"
        var functionToCall = this._sendDocumentButtonPressed.bind(this, screen, record);
        return functionToCall;
    },
    /**
    * Manages the send document buttons. They should be shown only in edit or create mode. 
    * @param {Object} screen The screen number
    * @param {Object} record Record id
    * @param {Object} mode Mode (edit, display or create)
    * @param {Object} html If passed as parameter, we will store the HTML
    * @param {Object} newInformationHTML If we want to use a new nformation HTML
    */
    _manageSendDocumentButton: function(screen, record, mode, html, newInformationHTML) {
        //If we receive an DOM html Object, we store it:
        if (!Object.isEmpty(html)) {
            if (Object.isEmpty(this.sendDocumentInfo)) {
                this.sendDocumentInfo = $H();
            }
            var infoForRecord = this.sendDocumentInfo.get(screen + "_" + record);
            if (Object.isEmpty(infoForRecord)) {
                infoForRecord = {};
                this.sendDocumentInfo.set(screen + "_" + record, infoForRecord);
                infoForRecord = this.sendDocumentInfo.get(screen + "_" + record);
            }
            infoForRecord.htmlButton = html;
        } else {
            var infoForRecord = this.sendDocumentInfo.get(screen + "_" + record);
            if (Object.isEmpty(infoForRecord)) {
                return null;
            } else {
                var html = infoForRecord.htmlButton;
            }
        }
        //If we receive a new place to insert messages:
        if (!Object.isEmpty(newInformationHTML)) {
            infoForRecord.element = newInformationHTML;
        }
        if (!Object.isEmpty(html)) {
            if (mode == "create" || mode == "edit") {
                html.show();
            } else {
                html.hide();
            }
        }
        return html;
    },
    /**
    * Checks for a record if its documents have been correctly uploaded. If there are no documents to upload it will be correct.
    * @param {Object} screen
    * @param {Object} record
    * @return (boolean) true if there aren't documents or they have been uploaded correctly, false otherwise.
    */
    _checkDocuments: function(screen, record) {
        //If we receive the reocrd number, only look for this record
        if (!Object.isEmpty(record)) {
            //If the hash exists, look if all mandatory documents have been sent
            var infoForRecord = this.sendDocumentInfo.get(screen + "_" + record);
            if (Object.isEmpty(infoForRecord)) {
                //If there is no hash for that record, there are no documents to send, so there is no error
                return true;
            } else if (infoForRecord.documents.get(infoForRecord.documents.keys()[0])["@display_attrib"] === "OPT" && infoForRecord.uploadStatus !== "correct") {
                return true;
            }
            else {
                return infoForRecord.uploadStatus === "correct";
            }
        } else {
            var sendDocumentInfoKeys = this.sendDocumentInfo.keys();
            for (var i = 0; i < sendDocumentInfoKeys.size(); i++) {
                var infoForRecord = this.sendDocumentInfo.get(sendDocumentInfoKeys[i]);
                var documents = infoForRecord.documents.keys();
                for (var j = 0; j < documents.length; j++) {
                    if (infoForRecord.documents.get(documents[j])["@display_attrib"] !== "OPT") {
                        if (infoForRecord.uploadStatus !== "correct") {
                            return false;
                        }
                    }
                }
            }
            return true;
        }
    },
    /**
    * Function called when the send document is pressed. We open the upload application and 
    * start listening for possible events fired from there
    * @param {Object} screen
    * @param {Object} record
    */
    _sendDocumentButtonPressed: function(screen, record) {
        var infoForRecord = this.sendDocumentInfo.get(screen + "_" + record);
        var element = infoForRecord.element;
        //Create listeners
        var successEventToListen = "EWS:documentsUploadSuccess" + this.appId + "_" + screen + "_" + record;
        var failureEventToListen = "EWS:documentsUploadFailure" + this.appId + "_" + screen + "_" + record;
        infoForRecord.listeningTo = $H();
        infoForRecord.listeningTo.set(successEventToListen, true);
        infoForRecord.listeningTo.set(failureEventToListen, true);
        document.observe(successEventToListen, this._sendDocumentSuccess.bind(this, screen, record, element));
        document.observe(failureEventToListen, this._sendDocumentFailure.bind(this, screen, record, element));
        //Open application:
        global.open($H({
            app: {
                appId: 'TRN_DOC',
                tabId: 'POPUP',
                view: 'SendDocument_Transaction'
            },
            documents: infoForRecord.documents,
            successEvent: successEventToListen,
            failureEvent: failureEventToListen,
            appId: this.appId,
            screen: screen,
            record: record,
            objectId: this.options.objectId,
            objectType: this.options.objectType
        }));
    },
    /**
    * Stops listening to all still active listeners from "send document" buttons
    */
    _stopSendDocumentListeners: function() {
        var sdInfoKeys = this.sendDocumentInfo.keys();
        for (var i = 0; i < sdInfoKeys.size(); i++) {
            var listeningTo = this.sendDocumentInfo.get(sdInfoKeys[i]).listeningTo;
            if (!Object.isEmpty(listeningTo)) {
                var listeningToKeys = listeningTo.keys();
                for (var j = 0; j < listeningToKeys.size(); j++) {
                    document.stopObserving(listeningTo.get(listeningToKeys[j]));
                    listeningTo.unset(listeningTo.get(listeningToKeys[j]));
                }
            }
        }
    },
    /**
    * Called when the upload was succesful
    * @param {Object} screen
    * @param {Object} record
    * @param {Object} element Element in which we will insert information about the upload
    */
    _sendDocumentSuccess: function(screen, record, element) {
        //Update metadata
        var infoForRecord = this.sendDocumentInfo.get(screen + "_" + record);
        infoForRecord.uploadStatus = "correct";
        //Stop observing events
        var listeningTo = infoForRecord.listeningTo;
        if (!Object.isEmpty(listeningTo)) {
            var listeningToKeys = listeningTo.keys();
            for (var j = 0; j < listeningToKeys.size(); j++) {
                document.stopObserving(listeningTo.get(listeningToKeys[j]));
                listeningTo.unset(listeningTo.get(listeningToKeys[j]));
            }
        }
        //Show message
        element.update(global.getLabel('documentUploadCorrect'));
        element.removeClassName("application_main_error_text");
        element.addClassName("application_main_soft_text");
        this.validateForm(screen, record);
    },
    /**
    * Called when the upload was unsuccesful
    * @param {Object} screen
    * @param {Object} record
    * @param {Object} element Element in which we will insert information about the upload
    */
    _sendDocumentFailure: function(screen, record, element) {
        //Update metadata
        var infoForRecord = this.sendDocumentInfo.get(screen + "_" + record);
        infoForRecord.uploadStatus = "error";
        //Stop observing events
        var listeningTo = infoForRecord.listeningTo;
        if (!Object.isEmpty(listeningTo)) {
            var listeningToKeys = listeningTo.keys();
            for (var j = 0; j < listeningToKeys.size(); j++) {
                document.stopObserving(listeningTo.get(listeningToKeys[j]));
                listeningTo.unset(listeningTo.get(listeningToKeys[j]));
            }
        }
        //Show message
        element.update(global.getLabel('documentUploadError'));
        element.removeClassName("application_main_soft_text");
        element.addClassName("application_main_error_text");
    },
    /**
    * Gets the custom function and options for it. This function will execute when we click in a tContent Save button with the desired mode
    * @param {Object} screen
    * @param {Object} mode
    * @param {Object} seqnr The seqnr of the row, it will be binded to the function
    */
    _getCustomFunctionTContent: function(screen, mode, seqnr) {
        if (this.options.tContent && this.options.tContent.get(screen) &&
		this.options.tContent.get(screen).customFunctions) {
            var customFunction = this.options.tContent.get(screen).customFunctions.get(mode);
            if (customFunction && customFunction.f) {
                var returnFunction = (deepCopy(customFunction.f)).bind(this, seqnr);
                var order = "customThenDefault";
                if (customFunction.order)
                    order = customFunction.order;
                return {
                    f: returnFunction,
                    order: order
                };
            } else {
                return null;
            }
        }
    },
    /**
    * Returns the SimpleTable object for the tContent in the specified record and screen
    * @param screen (optional) if null we'll use the actual screen
    * @param record (optional) if null we'll use the actual record
    * @return A SimpleTable object if it exists, null otherwise
    */
    getTContentTable: function(screen, record) {
        if (Object.isEmpty(this.tables)) {
            return null;
        }
        if (Object.isEmpty(screen)) {
            screen = this.currentScreen;
        }
        if (Object.isEmpty(record)) {
            record = this.currentRecordIndex;
        }
        if (Object.isEmpty(record)) {
            record = "1";
        }
        var appId = this.appId;
        return this.tables.get(screen + "_" + record + "_" + appId);
    }
});
//***************************************************************
//GROUP'S CLASS "PARENT" 
//***************************************************************
/**
 * @constructor
 * @description create the object group of getContent
 */
var Group = Class.create(
{
    /**
    * creates a new group
    * @param {Hash} Values and the setting contained in the group
    * @param {Hash} Options for the group
    */
    initialize: function(options, listValues) {
        this.fields= $A(); //Field of the group
        this.name="No name"; 
        this.secondary = false; //If the group belongs to an viewmore 
        if(listValues)
            this.fields = listValues;
        this._getOptions(options);
    },
    /**
    *@description Method to handler the options parse by parameter.
    **/
    _getOptions: function (options){
        if (!Object.isEmpty(options)) {
            for (option in options) {
               if (!Object.isEmpty(options[option]))
                   this[option] = options[option];
            }
        }
    },
    /**
    *@description Method to get the fields of the group
    **/  
    getValues:function(){
        return this.fields;
    },
    /**
    *@description Check if there is at least one field visible in the group, if not the group is not shown
    **/
    groupShouldBeShown: function(elementGroup){
        for( var i=0; i < this.fields.length; i++){
            if( this.fields[i].setting["@display_attrib"] != "HID" && this.fields[i].setting["@display_attrib"] != "HOU")
                return true;
        }
        if(!Object.isEmpty(this.radioButtonGroup)){
           if(this.radioButtonGroup.fields.length > 0)
                return true;
        }
        elementGroup.hide(); 
        return false;
    },
    /**
    * @description return the min sequence number of the group
    **/
    getMinSequenceNumber:function(){
       var minSeqnr = Number.MAX_VALUE;
       for(var i=0; i< this.fields.length;i++){
           var field = this.fields[i];
           if (field.setting['@display_attrib'] != 'HID' && field.setting['@display_attrib'] != 'HOU') {  
            if (parseInt(field.setting['@seqnr'], 10) < minSeqnr)
                minSeqnr = parseInt(field.setting['@seqnr'], 10);
           }
       }
       return minSeqnr;
    }
});
//***************************************************************
//GROUP BOX CLASS Visual group with a title
//***************************************************************
/**
 * @constructor
 * @description create the object group box of getContent (Just Visual organization)
 */
var GroupBox = Class.create(Group,
{
    /**
    * creates a new group box (Visual Group to organize the fields)
    * @param {Hash} Values and the setting contained in the group
    * @param {Hash} Options for the group
    */
    initialize: function($super, options, listValues) {
        this.labelTitle = "no label";
        this.radioButtonGroup = null;
        this.screenConfig = null;
        this.getContent = options.getContent;
        this.info = null;
        this.html = null;
        if (listValues)
            $super(options, listValues);
        else
            $super(options);
    },
    /**
    * To add a field in the group
    * @param {String} mode The mode of getContent (Create, display, ...)
    * @param {object} setting Structure with the setting of the fields come from JSON 
    */
    addSettingField: function(mode, setting, value) {
        this.fields.push({ "value": value, "setting": setting });
    },
    /**
    * To create the structure with the minSequenceNumber and the div to show
    * @param {object} objectSource GetContent 
    * @param {object} html Structure to keep all the information about group in getContent
    */
    getHtml: function (objectSource, html, screenConfig, dataValues, isViewMore) {
        //If it's already created
        if(this.html){
            return this.html;
		}
        if (!(this.secondary)) {
            //If it is in the primary fields
            if (Object.isEmpty(html.get("group")))
                html.set('group', $H());
            var hashBase = html.get('group');
            var hashGroup = this._getGroupHtml(objectSource, screenConfig, dataValues)
            hashBase = hashBase.merge(hashGroup);
            //Reconstructing the hash of groups to put it in the correct order based on the seq numbers of their fields
            var groupKeys = hashBase.keys().sortBy(function(s) { return parseInt(s); });
            var auxRetSorted = $H();
            for (var i = 0; i < groupKeys.length; i++) {
                auxRetSorted.set(groupKeys[i], hashBase.get(groupKeys[i]));
            }
            if (!isViewMore) {
            html.set('group', auxRetSorted);
            }
            return hashGroup;
        }
        else {
            //If it belongs to view details group
            return this._getGroupHtml(objectSource, screenConfig, dataValues)
        }
    },
    _getGroupHtml: function(objectSource, screenConfig, info) {
        var ret = $H();
        var aux = [];
        var auxRet = $H();
        var screen = screenConfig['@screen'];
        var recIndex = info['@rec_index'];
        var variantAssigned = $H();
        var radioGroups = null;
        var groupedGroups = null;
        var divDependencies = $H();
        var label = !Object.isEmpty(objectSource.labels.get(this.name)) ? objectSource.labels.get(this.name) : '';
        var spanAux = new Element('span', { 'class': 'fieldPanelAlignTitleGroupDiv fieldDispFloatLeft application_text_bolder test_text' });
        spanAux.insert(label);
        var groupDiv = new Element('div', {
            'class': 'fieldDispFloatLeft fieldDispTotalWidth fieldDispTotalHeight fieldPanel_displayGroupDiv test_text'
        }).insert(spanAux);
        aux.clear();
        //variable to store the lowest sequence number of the fields of the group
        //it is used for the ordering of the groups
        var groupIndex = Number.MAX_VALUE;
        for (var i = 0; i < this.fields.length; i++) {
            var field = this.fields[i];
            //We do not create the fieldDisplayer if it is a radio button inside a group, as those are created later
            if (!field.setting['@fieldid'].startsWith('OPT_') || Object.isEmpty(field.setting['@display_group'])) {
                if (!ret.get(this.name) || (parseInt(field.setting['@seqnr'], 10) < ret.get(this.name)))
                    ret.set(this.name, parseInt(field.setting['@seqnr'], 10));
                var getFieldValueAppend = objectSource.getXMLToAppendForField(field.setting['@fieldid']);
                var displayer = objectSource.fieldDisplayer({
                    settings: field.setting,
                    values: field.value,
                    screen: screenConfig['@screen'],
                    record: info[0]['@rec_index'],
                    key_str: info[0]['@key_str'],
                    getFieldValueAppend: getFieldValueAppend,
                    randomId: objectSource.randomId
                }, true);
                displayer = displayer.getHtml();
                if (field.setting['@depend_type'] == 'X' || field.setting['@depend_type'] == 'B') {
                    objectSource.groupVisualDependencies.set(field.setting['@depend_field'], displayer);
                    var index = parseInt(field.setting['@seqnr'], 10);
                    if (index < groupIndex)
                        groupIndex = index;
                    aux[index] = displayer;
                } else {
                    var index = parseInt(field.setting['@seqnr'], 10);
					var roundDivId = "roundDiv_" + field.setting['@fieldid'] + "_" + screenConfig['@appid'] + "_" + screenConfig['@screen'] + "_" + info[0]['@rec_index'];
                    if (objectSource.visualDependencyCat.get(field.setting['@fieldid'])) {
                        var roundDiv = new Element("div", { "id": roundDivId, "class": "fieldDispTotalWidth fieldDispClearBoth fieldDispFloatLeft fieldPanelVisualDep test_text" }).insert(displayer);
                        divDependencies.set(field.setting['@fieldid'], roundDiv);
                    } else {
                        var roundDiv = new Element("div", { "id": roundDivId, "class": "fieldDispTotalWidth fieldDispClearBoth fieldDispFloatLeft test_text" }).insert(displayer);
                        divDependencies.set(field.setting['@fieldid'], roundDiv);
                    }
                    if (index < groupIndex)
                        groupIndex = index;
                    aux[index] = roundDiv;
                    objectSource.groupNoDependents.set(field.setting['@fieldid'], index);
                }
            }
        }
        //switching fieldtechname into fieldid for dependent fields
        var dependenciesKeys = objectSource.groupVisualDependencies.keys();
        for (var h = 0; h < dependenciesKeys.length; h++) {
            var dep = objectSource.groupVisualDependencies.get(dependenciesKeys[h]);
            var depKey = dependenciesKeys[h];
            for (var j = 0; j < this.fields.length; j++) {
                var field2 = this.fields[j]
                if (field2.value['@fieldtechname'] == depKey) {
                    objectSource.groupVisualDependencies.unset(depKey);
                    objectSource.groupVisualDependencies.set(field2.value['@fieldid'], dep);
                }
            }
        }
        if (!Object.isEmpty(this.radioButtonGroup)) {
            var rBDiv = this.radioButtonGroup._getRadioGroupHtml(objectSource, screenConfig, info);
            groupDiv.insert(rBDiv.get(this.radioButtonGroup.name.split('_')[1])[1]);
            if (rBDiv.get(this.radioButtonGroup.name.split('_')[1])[0] < groupIndex)
                groupIndex = rBDiv.get(this.radioButtonGroup.name.split('_')[1])[0];
        }
        //Insert all the radio buttons
        aux = aux.compact();
        for (var i = 0; i < aux.size(); i++) {
            if (aux[i]) {
                groupDiv.insert(aux[i]);
            }
        }
        var dependenciesKeys = objectSource.groupVisualDependencies.keys();
        for (var h = 0; h < dependenciesKeys.length; h++) {
            var depField = objectSource.groupVisualDependencies.get(dependenciesKeys[h]);
            var depKey = dependenciesKeys[h];
            if (!Object.isEmpty(divDependencies.get(depKey))) {
                divDependencies.get(depKey).insert(depField);
            }
        }
        //Decide if the group should be shown
        var shown = this.groupShouldBeShown(groupDiv);
        var minSequenceGroups = !ret.get(this.name) ? groupIndex : ret.get(this.name)
        auxRet.set(groupIndex, [minSequenceGroups, groupDiv, { "shouldBeShown": shown}]);
        this.html = groupDiv;
        return auxRet;
    },
    /**
     * Checks the visibility of the fields inside, if any is visible, it shows the group.
     */
    updateVisibility: function(){
        if(!Object.isEmpty(this.fields)){
            var isVisible = false;
            for(var i=0; i< this.fields.size(); i++){
                //TODO: we should store the fields inside of the group so we can access them easily
                var fieldDisplayer = this.getContent.getFieldDisplayer(null, null, null, null, this.fields[i].setting["@fieldid"]);
                if(fieldDisplayer && fieldDisplayer.isVisible()){
                    isVisible = true;
                    break;
                }
            }
            if(isVisible){
                this.getHtml().show();
            }else{
                this.getHtml().hide();
            }
        }
    }
});
//***************************************************************
/**
 * @constructor
 * @description create the object group radio buttons. It will contain the radio button element and the fields that belong to it.
 */
var GroupRadioButtons = Class.create(Group,
{
    /**
    * creates a new group radioButton (Each radiobutton with fields in getContent)
    * @param {Hash} Values and the setting contained in the group
    * @param {Hash} Options for the group
    */
    initialize: function($super,options,listValues) {
        this.radioElementsHtml = $H();
        if(listValues)
            $super(options,listValues);
        else
            $super(options);
    },
    /**
    *@description Method to add a field to the group .
    * @param {string} mode Mode of getcontent Create, display,...
    * @param {object} setting of the field to add to the group
    * @param {object} value of the field to add to the group
    **/
    addSettingField: function(mode, setting,value){
        if( setting['@service_pai']) //If the field has an associated pai event it is added to the structure of the field
            this.fields.push({"value":value, "setting": setting, "service_pai": setting['@service_pai']});
        else
            this.fields.push({"value":value, "setting": setting });
    },
    /**
    * @description Method to get the radio button selected.
    * @param {string} mode Mode of getcontent Create, display,...
    **/
    getSelected:function(mode){ 
        var radioElements = this.getRadioElements();
        var keysRadio = radioElements.keys();
        for( var i = 0; i < keysRadio.length; i++){
            var element = radioElements.get(keysRadio[i]);
            if (mode == "create") {
                if(element.setting['@default_value'] == 'X')
                    return element
            }
            else{
                if(element.value['@value'] == 'X')
                    return element;
            }
        }
        return null;
    },
    /**
    * @description Method to get minnimum number of sequence of the group (not included the radio element)
    **/
    getMinSequenceNumber:function(){
       var minSeqnr = Number.MAX_VALUE;
       for(var i=0; i< this.fields.length;i++){
           var field = this.fields[i];
           if (field.setting['@display_attrib'] != 'HID' && field.setting['@display_attrib'] != 'HOU' && !Object.isEmpty(field.setting['@display_group'])) {  
                if (parseInt(field.setting['@seqnr'], 10) < minSeqnr)
                    minSeqnr = parseInt(field.setting['@seqnr'], 10);
           }
       }
       return minSeqnr;
    },
    /**
    * @description Method to disabled the radiobuttonsgroups not selected, and enabled the select one.
    * @param {int} numberRadio Radio button selected
    **/
    selectRadioButton:function(numberRadio){
        var radiokeys = this.radioElementsHtml.keys();
        for( var i=0; i < radiokeys.length; i++){
            if( radiokeys[i] == numberRadio){
                var arrayPartner = this.radioElementsHtml.get(radiokeys[i]).partnerElements;   
                for( var j= 0; j < arrayPartner.length; j++)
                    arrayPartner[j].displayer.setEnabled();
                //var radioElement = this.radioElementsHtml.get(radiokeys[i]).radioElement;
                //Form.Element.enable(radioElement);
            }
            else{
                var arrayPartner = this.radioElementsHtml.get(radiokeys[i]).partnerElements;   
                for( var j= 0; j < arrayPartner.length; j++)
                   arrayPartner[j].displayer.setDisabled();
                //var radioElement = this.radioElementsHtml.get(radiokeys[i]).radioElement;
                //Form.Element.disable(radioElement);
            }
         }
         this.getRadioElement(numberRadio).value['@value'] = 'X';
         if(!this.radioElementsHtml.get(numberRadio).radioElement.checked)
            this.radioElementsHtml.get(numberRadio).radioElement.checked = true;
    
    },
    /**
    * @description Method to returns all the radio button fields (OPT_G01_...)
    **/
    getRadioElements:function(){
        var aux = $H();
        for( var i = 0; i < this.fields.length; i++){
            if( this.fields[i].value["@fieldid"].startsWith("OPT"))
                aux.set(this.fields[i].value["@fieldid"], this.fields[i])
        }
        return aux;
    },
    /**
    * @description Method to returns the first radio button fields (OPT_G01_...) 
    *              (it used to select the first one, if there isn't any field selected by default
    **/
    getFirstRadioElement:function(){
        var radioElements = this.getRadioElements();
        var keys = radioElements.keys();
        for( var i=0; i < keys.length; i++){
            if(keys[i].split('_')[2]== "1")
                return radioElements.get(keys[i]);
        }
        return radioElements.get(keys[0]);
    },
    /**
    * @description Method to get an specific radio button.
    * @param {int} number number of radio button
    **/
    getRadioElement:function(number){
        var radioElements = this.getRadioElements();
        var keys = radioElements.keys();
        for( var i=0; i < keys.length; i++){
            if(keys[i].split('_')[2]== number)
                return radioElements.get(keys[i]);
        }
        return null
    },
    /**
    * @description Method to returns all the fields enclosed to the radio button element (RADIO_G01_...)
    **/
    getPartnerElements:function(){
        var aux = $H();
        for( var i = 0; i < this.fields.length; i++){
            if (this.fields[i].setting["@display_group"] && this.fields[i].setting["@display_group"].startsWith("RADIO")){
                if(!aux.get(this.fields[i].setting["@display_group"])){
                    var array = aux.set(this.fields[i].setting["@display_group"], $A());
                    
                }
                else{
                    var array = aux.get(this.fields[i].setting["@display_group"]);
                }
                var seqnr = parseInt(this.fields[i].setting['@seqnr'],10);
                array[seqnr] = this.fields[i];
                }
        }
        return aux;
    },
    /**
    * @description return if the radio group belons to a display group, (return the name of the display_group)
    **/
    hasGroupBox:function(){
        var elements = this.getRadioElements();
        var keys = elements.keys();
        for(var i=0; i < keys.length; i++){
            var element = elements.get(keys[i]);
            if(!Object.isEmpty(element.setting["@display_group"]))
                return element.setting["@display_group"];
        }
        return null;
    },
    /**
    * @description Method to create the stucture to keep the information of the group in Html field (parameter
    * @param {object} objectSource Get content object
    * @param {object} screenConfig 
    * @param {object} dataValues setting of the getcontent
    **/
    getHtml:function(objectSource,html,screenConfig, dataValues){
        if( !this.secondary ){
            if( Object.isEmpty(html.get("radioGroup")))
                 html.set('radioGroup', $H());
             var hashBase = html.get('radioGroup');
             var hashNew = this._getRadioGroupHtml(objectSource, screenConfig, dataValues)
             html.set('radioGroup', hashBase.merge(hashNew));
            return hashBase.merge(hashNew);
         }
         else{
            return this._getRadioGroupHtml(objectSource, screenConfig, dataValues)
         }
    },
    /**
    * @description Method to create the html corresponding to the group
    * @param {object} objectSource Get content object
    * @param {object} screenConfig 
    * @param {object} dataValues setting of the getcontent
    **/
    _getRadioGroupHtml: function(objectSource, screenConfig, info) {
        var byOption = $H();
        var ret = $H();
        var groupsArray = $A();
        var name = this.name.split('_')[1];
        //Create the base div for the group of radiobutton
        var groupDiv = new Element('div', {
                'id': objectSource.appId + "_" + name,
                'class': 'fieldDispFloatLeft fieldDispClearBoth fieldDispTotalWidth fieldDispTotalHeight fieldDispGroupDiv test_text'
            });
        var minSeqnr = this.getMinSequenceNumber();
        //Extracting the minSeqnr
        var partnerElements = this.getPartnerElements();
        var keysPartner = partnerElements.keys();
        //keeping the partner element and its sequence number
        for(var i=0; i < keysPartner.length; i++){
            var field = partnerElements.get(keysPartner[i]);
            var key = keysPartner[i];
            //Option keeps the partner element of the radio element
            var option = partnerElements.get(keysPartner[i]);
            var radioRow = new Element('div', {
                'class': 'fieldDispFloatLeft fieldClearBoth fieldDispTotalWidth test_text fieldPanelVisualDep'
            });
            var seqnr = parseInt(option.compact().first().setting['@seqnr'], 10);
            var checked = '';
            var disabled = '';
            var disabled = objectSource.mode == 'display' ? "disabled" : '';
            //We set the selected radio by default
            var selectedField = this.getSelected(objectSource.mode); 
            var selectedPosition =  selectedField ? selectedField.value["@fieldid"].split('_')[2] : null;
            if ((!selectedField) && (i == 0)) {
                    checked = 'checked';
                    this.getFirstRadioElement().value["@value"] = "X";
            } else {
                checked = (selectedPosition == key.split('_')[2]) ? 'checked' : '';
                if (checked)
                    this.getRadioElement(key.split('_')[2]).value['@value'] = 'X';
            }
            //------------------------------------
            //Create the input to show in the field panel, and add the listener to the radio button
            var input = new Element('input',{"class": "test_radioButton", "type":"radio","name": objectSource.appId + "_" + screenConfig['@screen'] + "_" + info[0]['@rec_index'] + "_" + name});
            input.addClassName ("fieldDispAlignInput fieldDispFloatLeft");
            if( checked != ''){
                input.checked = true;
                input.defaultChecked = true;
                numberSelected = key.split('_')[2];
            }
            if( disabled != '')
                input.disabled = true
            radioRow.insert(input);
            input.observe('click', objectSource.radioButtonClicked.bindAsEventListener(objectSource, this, this.getRadioElement(key.split('_')[2]),key, keysPartner, screenConfig));           
            var structureHtml = {
                radioElement: input,
                partnerElements: $A()
            }
            this.radioElementsHtml.set([key.split('_')[2]], structureHtml);
            //-----------------------------------
            var auxArray = option.compact();
            //Draw the partner element to each radiobutton element
            for (var j = 0; j < auxArray.size(); j++) {
                    var changed = false;
                    //since it's a radioGroup, the X in the OUO fieldDisplayer will draw an X as value, next to the text, and thjs js not desjred
                    if (auxArray[j].value['@value'] == 'X'){ 
                        auxArray[j].value['@value'] = "";
                        changed = true;
                    }
                    var getFieldValueAppend = objectSource.getXMLToAppendForField(auxArray[j].setting['@fieldid']);
                    var displayer = objectSource.fieldDisplayer({
                        settings: auxArray[j].setting,
                        values: auxArray[j].value,
                        screen: screenConfig['@screen'],
                        record: info[0]['@rec_index'],
                        key_str: info[0]['@key_str'],
                        getFieldValueAppend: getFieldValueAppend,
                        randomId: objectSource.randomId
                    }, true);
                    //Html of the field
                    structureHtml.partnerElements.push({fields:auxArray[j],displayer:displayer});
                    displayer = displayer.getHtml();
                    if (changed)
                        auxArray[j].value['@value'] = "X";
                    displayer.removeClassName('fieldDispTotalWidth');
                    displayer.removeClassName('fieldClearBoth');
                    if (displayer.down())
                        displayer.down().removeClassName('fieldDispHalfSize');
                    radioRow.insert(displayer);
                    insertArrayNoOverwrite(groupsArray, seqnr, radioRow);
           }
           //Insert the radio element and partner in the base div
           groupDiv.insert(radioRow);
        }
        this.selectRadioButton(numberSelected);
        groupsArrayCom = groupsArray.compact();
        for (var i = 0; i < groupsArrayCom.length; i++) {
            groupDiv.insert(groupsArrayCom[i]);
        }
        //Return the appropiate hash, to introduce in the structur html of grouping get content
        ret.set(name, [minSeqnr, groupDiv]);
        return ret;
    }
});
//***************************************************************
//SECUNDARY FIELDS CLASS View details class
//***************************************************************
var viewMoreClass = Class.create(
{
    initialize: function(appId, screenConfig, info, listValues) {
        this.appId = appId;
        this.screenConfig = screenConfig;
        this.elementHtml = new Element('div', { 'id': 'viewMore_' + this.appId + '_' + screenConfig['@screen'] + '_' + info[0]['@rec_index'] }) //Initialize the div where the view more should be setted
        this.fields = $A(); //Field of the group
        this.info = info;
        this.groupsRadioButtonsHash = $H();
        this.groupsVisualHash = $H();
        if(listValues)
            this.fields = listValues;
    },
    addSettingField: function(mode,setting,value){
        this.fields.push({"value":value, "setting": setting });
    },
    /**
    *@description Method to handler the options parse by parameter.
    **/
    _getOptions: function (options){
        if (!Object.isEmpty(options)) {
            for (option in options) {
               if (!Object.isEmpty(options[option]))
                   this[option] = options[option];
            }
        }
    },
    /**
    *@description Method to get the html estructure of the group.
    **/
    getHtml:function(objectSource, html){
        //There is a radio button group
        var radioKeys = this.groupsRadioButtonsHash.keys();
        var elementDivBase = new Element('div');
        if(radioKeys.length > 0){
            for(var i=0; i < radioKeys.length; i++){
                var group = this.groupsRadioButtonsHash.get(radioKeys[i]);
                var hash = group.getHtml(objectSource, html, this.screenConfig, this.info, true); // Adding parameter to make sure it's not added to the group key
                elementDivBase.insert(hash.get(group.name.split("_")[1])[1]);
            } 
        }
        //There is a visual group
        var visualKeys = this.groupsVisualHash.keys();
        var arrayOrder = $A();
        if(visualKeys.length > 0){
            for(var i=0; i < visualKeys.length; i++){
                var group = this.groupsVisualHash.get(visualKeys[i]);
                var hash = group.getHtml(objectSource, html, this.screenConfig, this.info, true); // Adding parameter to make sure it's not added to the group key
                arrayOrder[hash.get(hash.keys().first())[0]] = hash;
                //elementDivBase.insert(hash.get(hash.keys().first())[1]);
            }
            arrayOrder = arrayOrder.compact();
            for (var i = 0; i < arrayOrder.size(); i++) {
                var hash = arrayOrder[i];
                elementDivBase.insert(hash.get(hash.keys().first())[1]);
            } 
        }
        if(this.fields.length > 0 || visualKeys.length > 0 || radioKeys.length > 0){
            this.getViewMoreGroupHtml(objectSource,this.screenConfig,this.info[0],elementDivBase);
        }
        html.set("viewMore",this.elementHtml);
    },
    /**
    * Gets the HTML for the fields inside the "View More" group.
    * @param {Object} group
    * @param {Object} radioGroups
    * @param {Object} groupedGroups
    * @param {Object} screenConfig
    * @param {Object} info
    */
    getViewMoreGroupHtml: function(objectSource,screenConfig, info, groupsDiv) {
        //This will be the key that identifies objectSource link and div in the hash of links and divs for viewMore
        objectSource.viewMoreHashKey = screenConfig['@appid'] + "_" + screenConfig['@screen'] + "_" + info['@rec_index'];
        if (Object.isEmpty(objectSource.buttonsJsonViewMore)) {
            objectSource.buttonsJsonViewMore = $H();
        }
        objectSource.buttonsJsonViewMore.set(objectSource.viewMoreHashKey, {
            elements: [],
            defaultButtonClassName: ''
        });
        var idButtons = ['viewMore_link_' + objectSource.appId + '_' + screenConfig['@screen'] + '_' + info['@rec_index'],
                             'hideMore_link_' + objectSource.appId + '_' + screenConfig['@screen'] + '_' + info['@rec_index']];
        var aux = {
            idButton: idButtons[0],
            label: global.getLabel('viewDetails'),
            className: 'getContentLinks fieldDispClearBoth application_action_link',
            type: 'link',
            handlerContext: null,
            handler: objectSource.hideDetails.bind(objectSource, objectSource.viewMoreHashKey, idButtons)
        };
        objectSource.buttonsJsonViewMore.get(objectSource.viewMoreHashKey).elements.push(aux);
        var aux = {
            idButton: idButtons[1],
            label: global.getLabel('hideDetails'),
            className: 'getContentLinks fieldDispClearBoth application_action_link',
            type: 'link',
            handlerContext: null,
            handler: objectSource.showDetails.bind(objectSource, objectSource.viewMoreHashKey, idButtons)
        };
        objectSource.buttonsJsonViewMore.get(objectSource.viewMoreHashKey).elements.push(aux);
        //The links will be stored in a hash with key APP + SCREEN + RECORD
        if (Object.isEmpty(objectSource.viewMoreLink)) {
            objectSource.viewMoreLink = $H();
        }
        objectSource.viewMoreLink.set(objectSource.viewMoreHashKey, new megaButtonDisplayer(objectSource.buttonsJsonViewMore.get(objectSource.viewMoreHashKey)));
        objectSource.viewMoreLink.get(objectSource.viewMoreHashKey).hash.get(idButtons[1])[1].hide();
        this.elementHtml.insert(objectSource.viewMoreLink.get(objectSource.viewMoreHashKey).getButtons());
        objectSource.buttons.set("viewMore", objectSource.viewMoreLink.get(objectSource.viewMoreHashKey).hash);
        //The fields will be stored in a hash with key APP + SCREEN + RECORD
        if (Object.isEmpty(objectSource.viewMoreFields)) {
            objectSource.viewMoreFields = $H();
        }
        var spanAux = new Element('span',{'class':'fieldPanelAlignTitleGroupDiv fieldDispFloatLeft application_text_bolder test_text'});
        objectSource.viewMoreFields.set(objectSource.viewMoreHashKey, new Element('div', {
            'class': 'fieldDispFloatLeft fieldDispTotalWidth fieldDispTotalHeight fieldPanel_displayGroupDiv test_text'
        }).insert(spanAux));
        //Add the HTML for the normal secondary fields
        //we use the getGroupHtml to create the whole HTML, including normal fields,
        //radio groups, and groups
        //objectSource is needed because otherwise we do not have complete control over the order of the
        //fields, radio buttons, groups
        var options = { name: "viewMore", getContent: this  }
        //Create the html of the field + groups within viewmore
        var simulatedGroupViewMore = new GroupBox(options, this.fields);
        var displayers = simulatedGroupViewMore._getGroupHtml(objectSource, screenConfig, this.info);
        var divToInsert = displayers.get(displayers.keys()[0])[1];
        if(!Object.isEmpty(groupsDiv)){
            divToInsert.insert(groupsDiv);
        }
        objectSource.viewMoreFields.set(objectSource.viewMoreHashKey, divToInsert);  //TODO:REFACTOR: They would be at the beggining, no matter the seqnr, that may be corrected
        if (Object.isEmpty(objectSource.viewMoreFields.get(objectSource.viewMoreHashKey).innerText))
            objectSource.viewMoreLink.get(objectSource.viewMoreHashKey).hash.get(idButtons[1])[1].hide();//Hide the "Hide" Button
        if (!Object.isEmpty(global.GCdetailsOpened.get(objectSource.viewMoreHashKey))) {
            if (!global.GCdetailsOpened.get(objectSource.viewMoreHashKey).showed) {
                objectSource.viewMoreFields.get(objectSource.viewMoreHashKey).hide();
            }
            else {
                objectSource.viewMoreLink.get(objectSource.viewMoreHashKey).hash.get(idButtons[0])[1].hide();
                objectSource.viewMoreLink.get(objectSource.viewMoreHashKey).hash.get(idButtons[1])[1].show();
            }
            objectSource.viewMoreFields.get(objectSource.viewMoreHashKey).show();
        }
        else {
            objectSource.viewMoreFields.get(objectSource.viewMoreHashKey).hide();
        }
        this.elementHtml.insert(objectSource.viewMoreFields.get(objectSource.viewMoreHashKey));
        return this.elementHtml;
}
});
//***************************************************************
//PRIMARY FIELDS CLASS
//***************************************************************
/**
 * @constructor
 * @description create the object group of getContent
 */
var primaryFieldsClass = Class.create(
{
    /**
    * creates a new group
    * @param {Hash} Values and the setting contained in the group
    * @param {Hash} Options for the group
    */
    initialize: function(appId, screenConfig, info, listValues) {
        this.appId = appId;
        this.screenConfig = screenConfig;
        this.groupsRadioButtonsHash = $H();
        this.groupsVisualHash = $H();
        this.info = info;
        this.fields = $A(); //Field of the group
        if(listValues)
            this.fields = listValues;
    },
    addSettingField: function(mode,setting,value){
        this.fields.push({"value":value, "setting": setting });
    },
    /**
    *@description Method to handler the options parse by parameter.
    **/
    _getOptions: function (options){
        if (!Object.isEmpty(options)) {
            for (option in options) {
               if (!Object.isEmpty(options[option]))
                   this[option] = options[option];
            }
        }
    },
    getHtml: function(objectSource,html){
        //There is a radio button group
        var radioKeys = this.groupsRadioButtonsHash.keys();
        if(radioKeys.length > 0){
            for(var i=0; i < radioKeys.length; i++){
                var group = this.groupsRadioButtonsHash.get(radioKeys[i]);
                group.getHtml(objectSource,html, this.screenConfig, this.info);
            } 
        }
        //There is a radio button group
        var visualKeys = this.groupsVisualHash.keys()
        if(visualKeys.length > 0){
            for(var i=0; i < visualKeys.length; i++){
                var group = this.groupsVisualHash.get(visualKeys[i]);
                group.getHtml(objectSource,html, this.screenConfig, this.info);
            } 
        }
    }
});