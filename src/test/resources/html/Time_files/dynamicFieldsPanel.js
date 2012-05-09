/**
*@fileOverview dynamicFieldsPanel.js
*@description It contains dynamic fieldspanel methods
*/
/**
*@constructor
*@description Class with general functionality for the dynamic fieldspanel class
*@augments origin
*/

var dynamicFieldsPanel = Class.create(origin,
/**
*@lends dynamicFieldsPanel
*/
    {
    /*
    *@param $super: the superclass: origin
    *@description instantiates the app
    */
    initialize: function($super, options) {
        $super();
        /** 
        * Name of the service used to get the values of elements such as multiselects or autocompleters
        * @type String
        
        */
        this.learningValuesService = 'GET_LEARN_VAL';
        /** 
        * Name of the service used to get the parents (D) (screen 6 and 7)
        * @type String
        */
        this.getCourseType = 'GET_CURR_D';
        /** 
        * Counter to keep track of the number of calls made to a certain service
        * @type Integer
        */
        this.ajaxRequestsCount = 0;
        /** 
        * Is used to contruct the xml once the request to a certain service is done
        * @type Boolean
        */
        this.ajaxRequestsDone = false;
        /** 
        * Keeps the depending fields for each screen
        * @type Hash
        */
        this.dependentFields = $H({});
        /** 
        * Keeps the service used to get the values for each screen
        * @type Boolean
        */
        this.serviceValues = $H({});
        /** 
        * Used to be able to access each of the existing multiselects
        * @type Boolean
        */
        this.multiSelects = $H({});
        /** 
        * Used to keep the options of the multiselects
        * @type Hash
        */
        this.multiSelectsOptions = $H({});
        /** 
        * Used to keep the SCLAS values for each element which has SCLAS
        * @type Hash
        */
        this.hashOfSclasValue = $H({});
        /** 
        * Used to keep the order of the SCLAS values, since they come in the same field
        * @type Hash
        */
        this.hashOfSclasOrder = $H({});
        /** 
        * Used to know which nodes have changed
        * @type Hash
        */
        this.toChangeNodes = [];
        /** 
        * Used to keep the depend field for the second box in screens with type 3
        * @type Hash
        */
        this.thirdLevelDepField = null;
        /** 
        * Used to keep the service needed to fill in the second box in screens with type 3
        * @type Hash
        */
        this.thirdLevelDepFieldService = "";
        /** 
        * The separator used in the xml to send more than one value in a record
        * @type Hash
        */
        this.possValuesSeparator = ','; // to be changed into another stranger        	       
        this.leftSep = global.idSeparators.toArray()[0];
        this.rightSep = global.idSeparators.toArray()[1];
        this.hashOfSelectBoxes3Level = $H();
        this.hashOfSelectBoxesMain = $H();
        this.hashOfMultiselectRecords = $H();
        this.hashOfDefaultValues = $H();
        this.virtualHtml = new Element('div', { 'class': 'fieldsPanel_main' });
        this.labels = $A();
        this.addElementFromCatBinding = this.addElementFromCat.bindAsEventListener(this);
        //Now we take the options sent from the getContentModule
        if (options && options.predefinedXmls) this.predefinedXmls = options.predefinedXmls;
        if (options && options.event) this.event = options.event;
        if (options && options.mode) this.mode = options.mode;
        if (options && options.json) this.jsonIn = options.json;
        if (options && options.appId) this.appId = options.appId;
        if (options && options.objectType) this.objectType = options.objectType;
        if (options && options.objectId) this.objectId = options.objectId;
        if (options && options.noResultsHtml) this.noResultsHtml = options.noResultsHtml;
        if (options && options.screenConfig) this.screenConfig = options.screenConfig;
        if (options && options.language) this.language = options.language;
        /*
        The dynamic fieldspanel is an extension of the std getContentModule.
        Thus, when we need specific functionality, we'll use this module. We just need to know the type of screen to build
        1. Screen of descriptions. Used in Learning and OM
        2. Screen of multiselectors. Used in Learning
        
        4. Screen with objects DC unordered
        5. Screen with objects DC ordered
        6. Screen with objects EC unordered
        7. Screen with objects DC ordered
        8. Screen of Course Title, descripcion...
        For further details, please see the technical specification of this module
        */
        if (options && options.typeOfScreen) this.typeOfScreen = options.typeOfScreen;
        this.widScreen = this.screenConfig['@screen'];
        //take settings of the screen
        var settingsArray = objectToArray(this.jsonIn.EWS.o_field_settings.yglui_str_wid_fs_record);
        for (var i = 0; i < settingsArray.length; i++) {
            if (settingsArray[i]['@screen'] == this.widScreen)
                this.screenSettings = settingsArray[i];

        }
        if (this.jsonIn && this.jsonIn.EWS && this.jsonIn.EWS.o_field_values && !Object.isEmpty(this.jsonIn.EWS.o_field_values)) {
            document.body.insert(this.virtualHtml);
            if (this.typeOfScreen == 1 || this.typeOfScreen == 2 || this.typeOfScreen == 8) {
                //if type 2, display, and no records, we show a message
                if (this.typeOfScreen == 2 && this.mode == 'display') {
                    var noRecords = true;
                    var records = objectToArray(this.jsonIn.EWS.o_field_values.yglui_str_wid_record);
                    for (var i = 0; i < records.length && noRecords; i++)
                        if (records[i]['@screen'] == this.widScreen) {
                        var fields = records[i].contents.yglui_str_wid_content.fields.yglui_str_wid_field;
                        for (var j = 0; j < fields.length; j++)
                            if (fields[j]['@fieldid'].toLowerCase() == 'sobid' && !Object.isEmpty(fields[j]['@value']))
                            noRecords = false;

                    }
                    if (noRecords) {
                        this.virtualHtml.update("<div><span class = 'fieldDispTotalWidth fieldDispFloatLeft application_main_soft_text pdcPendReq_emptyTableDataPart'>" + global.getLabel('noResults') + "</span></div>");
                    } else {
                        this.handleLabelsColumn();
                        this.initValuesColumn();
                        if (!this.ajaxRequestsDone) {
                            this.handleValuesColumn();
                            document.body.removeChild(this.virtualHtml);
                        }
                    }
                } else {//rest of cases
                    this.handleLabelsColumn();
                    this.initValuesColumn();
                    if (!this.ajaxRequestsDone) {
                        this.handleValuesColumn();
                        if (this.typeOfScreen != 8) {
                        document.body.removeChild(this.virtualHtml);
                    }
                }
                }
                //Curriculumns screens
            } else if (this.typeOfScreen == 4 || this.typeOfScreen == 5 || this.typeOfScreen == 6 || this.typeOfScreen == 7) {
                if (this.typeOfScreen == 4 || this.typeOfScreen == 5) {
                    if (this.mode == 'display') {
                        var noRecords = true;
                        var records = objectToArray(this.jsonIn.EWS.o_field_values.yglui_str_wid_record);
                        for (var i = 0; i < records.length && noRecords; i++) {
                            if (records[i]['@screen'] == this.widScreen) {
                                var fields = records[i].contents.yglui_str_wid_content.fields.yglui_str_wid_field;
                                for (var j = 0; j < fields.length; j++)
                                    if (fields[j]['@fieldid'].toLowerCase() == 'sobid' && Object.isEmpty(fields[j]['@value']))
                                    noRecords = false;
                            }
                        }
                        if (!noRecords) {
                            this.virtualHtml.update("<div><span class = 'fieldDispTotalWidth fieldDispFloatLeft application_main_soft_text pdcPendReq_emptyTableDataPart'>" + global.getLabel('noResults') + "</span></div>");
                        } else {
                            //curr type
                            this.drawDisplayCheckBoxes();
                        }
                    } else {
                        this.currTypeList();
                    }
                } else {
                    //cur
                    this.sessionSelectedBinding = this.sessionSelected.bindAsEventListener(this);
                    document.observe('EWS:dynFPscreen6or7_sessionSelected' + this.widScreen, this.sessionSelectedBinding);
                    this.retrieveCourseTypes();
                }
            }

        } else {
            this.virtualHtml = this.noResultsHtml;
        }
    },
    /**    
    * @description For a given screen, creates the structure label-value
    */
    handleLabelsColumn: function() {
        this.table = '<table class="dynamicFieldsPanelTable test_table" id="' + this.appId + '_' + this.widScreen + '_dynamicFieldsPanelTable"><tbody>';
        var serviceValues = '';
        this.dependFields = $A();
        var innerHtml = '';
        //loop in settings to view all possible values 
        if (!Object.isEmpty(this.jsonIn.EWS.o_field_settings)
             && !Object.isEmpty(this.jsonIn.EWS.o_field_settings.yglui_str_wid_fs_record)) {
            objectToArray(this.jsonIn.EWS.o_field_settings.yglui_str_wid_fs_record).each(function(record) {
                if (record['@screen'] == this.widScreen
                     && !Object.isEmpty(record.fs_fields)
                     && !Object.isEmpty(record.fs_fields.yglui_str_wid_fs_field)) {
                    objectToArray(record.fs_fields.yglui_str_wid_fs_field).each(function(setting) {
                        //take dependant fields
                        if (!Object.isEmpty(setting['@depend_field']) && setting['@depend_field'].toLowerCase() == 'subty') {
                            this.dependentFields.set(this.widScreen, setting['@fieldid']);
                            serviceValues = setting['@service_values'];
                            this.serviceValues.set(this.widScreen, setting['@service_values']);
                        }
                    } .bind(this));
                    if (this.typeOfScreen != 1 && this.typeOfScreen != 8) {
                        //looping for other dependant fields if screen 2 or 3
                        objectToArray(record.fs_fields.yglui_str_wid_fs_field).each(function(setting) {
                            if (setting['@fieldid'].toLowerCase() != 'poss_values' && setting['@fieldid'].toLowerCase() != 'value' && setting['@fieldid'].toLowerCase() != 'sclas' && setting['@fieldid'].toLowerCase() != 'translation' && setting['@display_attrib'].toLowerCase() != 'hid') {
                                if (Object.isEmpty(setting['@depend_field']) || setting['@depend_field'].toLowerCase() == "") {//without depend field, label displayed
                                    this.table += "<tr id='" + this.appId + "_" + this.widScreen + "_" + setting['@fieldid'] + "'><td id='" + this.appId + "_" + this.widScreen + "_" + setting['@fieldid'] + "_labels'><span class= 'application_main_soft_text test_label'>" + setting['@fieldid'] + "</span></td><td id='" + this.appId + "_" + this.widScreen + "_" + setting['@fieldid'] + "_values'></td></tr>";
                                } else {//depend field set, no label displayed
                                    if (setting['@depend_field'] == this.dependentFields.get(this.widScreen)) {//dependent of the dependent field (3rd level)
                                        this.thirdLevelDepField = setting['@fieldid'];
                                        this.thirdLevelDepFieldService = setting['@service_values'];
                                    }
                                }
                            }
                        } .bind(this));
                    }
                    //looping for poss_values
                    objectToArray(record.fs_fields.yglui_str_wid_fs_field).each(function(setting, it) {
                        if (this.typeOfScreen == 8) {
                            this.hashOfDefaultValues.set(setting['@fieldid'], { value: setting['@default_value'], text: setting['@default_text'] });
                            switch (setting['@fieldid'].toLowerCase()) {
                                case 'abbr':
                                case 'begda':
                                case 'endda':
                                case 'parent':
                                case 'title':
                                    if (setting['@fieldlabel']) {
                                        insertArrayNoOverwrite(this.labels, parseInt(setting['@seqnr']), { id: setting['@fieldid'], value: "<span class= 'fieldCaption fieldDispMinHeight fieldDispLabel fieldDispFloatLeft application_main_soft_text test_label'>" + prepareTextToShow(setting['@fieldlabel']) + "</span>", 'length': parseInt(setting['@length']) });
                                    }
                                    else {
                                        objectToArray(this.jsonIn.EWS.labels.item).each(function (label) {
                                            if (setting['@fieldid'] == label['@id']) {
                                                insertArrayNoOverwrite(this.labels, parseInt(setting['@seqnr']), { id: setting['@fieldid'], value: "<span class= 'fieldCaption fieldDispMinHeight fieldDispLabel fieldDispFloatLeft application_main_soft_text test_label'>" + prepareTextToShow(label['@value']) + "</span>", 'length': parseInt(setting['@length']) });
                                            }
                                        } .bind(this));
                                    }
                                    break;
                            }
                        }
                        if (setting['@fieldid'].toLowerCase() == 'poss_values' && !Object.isEmpty(setting['@default_text']) && !Object.isEmpty(setting['@default_value'])) {
                            if (this.typeOfScreen != 1)
                                this.showTextRule = setting['@show_text'];
                            var possValuesText = setting['@default_text'];
                            possValuesText = possValuesText + ',';
                            var possValuesValue = setting['@default_value'];
                            possValuesValue = possValuesValue + ',';
                            var htmlDepFields = '';
                            //order for the sclas hash
                            var order = 0;
                            while (possValuesText.indexOf(this.possValuesSeparator) != -1) {
                                var label = "<span class= 'fieldCaption fieldDispMinHeight fieldDispLabel fieldDispFloatLeft application_main_soft_text application_main_soft_text test_label'>" + possValuesText.substring(0, possValuesText.indexOf(',')) + "</span>";
                                var value = possValuesValue.substring(0, possValuesValue.indexOf(this.possValuesSeparator));
                                //initialize the hash value-sclas                                
                                this.hashOfSclasValue.set(value + '_' + this.widScreen, {
                                    order: order,
                                    sclas: '',
                                    depend: 0
                                });
                                this.hashOfSclasOrder.set(order, {
                                    value: value
                                });
                                if (this.mode != 'display') {
                                    //depending on the type of screen, we display one or other thing
                                    if (this.typeOfScreen == 1) {//textarea
                                        innerHtml = "<textarea rows=4 cols=60 id='" + this.appId + "_" + this.widScreen + "_" + value + "_values_textArea_" + this.language + "' class='fieldDisplayer_input test_textArea'></textarea>";
                                    } else if (this.typeOfScreen == 2) {//multiSelect
                                        innerHtml = "<div id='" + this.appId + "_" + this.widScreen + "_" + value + "_values_multiSelect' class='dynamicFieldsPanel_multiSelect fieldDisplayer_input'></div>";
                                    }
                                } //refresh values removing the already used data
                                this.table += "<tr id='" + this.appId + "_" + this.widScreen + "_" + setting['@fieldid'] + "'><td id='" + this.appId + "_" + this.widScreen + "_" + setting['@fieldid'] + "_labels'>" + label + "</td><td id='" + this.appId + "_" + this.widScreen + "_" + value + "_values'>" + innerHtml + "</td>" + htmlDepFields + "</tr>";
                                possValuesText = possValuesText.substring(parseInt(possValuesText.indexOf(',') + 1));
                                possValuesValue = possValuesValue.substring(parseInt(possValuesValue.indexOf(',') + 1));
                                order++;
                            }
                        } //take show_text rule --> needed later
                        if ((setting['@fieldid'].toLowerCase() == 'descr' && this.typeOfScreen == 1) || this.typeOfScreen == 8)
                            this.showTextRule = setting['@show_text'];

                    } .bind(this));
                    if (this.typeOfScreen == 8) {

                        this.labels.each(function (label) {
                            if (this.mode != 'display') {
                                if (label.id.toLowerCase() == 'title' || label.id.toLowerCase() == 'abbr') {
                                    innerHtml = "<input id='" + this.appId + "_" + this.widScreen + "_" + label.id + "_title_" + this.language + "' maxlength='" + label.length + "' class='dynamicFieldsPanel_title dynamicFieldsPanel_fieldDisplayer_input fieldDisplayer_input fieldDispFloatLeft fieldDispWidth test_input'></input>" + "<span class='fieldDispMandatoryIndicator application_main_soft_text fieldDispFloatLeft test_text'>*</span>";
                                }
                                else {
                                    innerHtml = "<div id='" + this.appId + "_" + this.widScreen + "_" + label.id + "_title_" + this.language + " 'class=dynamicFieldsPanel_title '></div>";
                                }
                            }
                            else {
                                innerHtml = "<div id='" + this.appId + "_" + this.widScreen + "_" + label.id + "_title_" + this.language + " 'class=dynamicFieldsPanel_title '></div>";
                            }
                            this.table += "<tr id='" + this.appId + "_" + this.widScreen + "_" + label.id + "'><td id='" + this.appId + "_" + this.widScreen + "_" + label.id + "_label_'" + this.language + ">" + label.value + innerHtml + "</td></tr>";

                        } .bind(this));
                    }
                    //take sclas

                    objectToArray(record.fs_fields.yglui_str_wid_fs_field).each(function(setting, it) {
                        if (setting['@fieldid'].toLowerCase() == 'sclas' && !Object.isEmpty(setting['@default_value'])) {
                            var possValuesText = setting['@default_text'];
                            possValuesText = possValuesText + ',';
                            var possValuesValue = setting['@default_value'];
                            possValuesValue = possValuesValue + ',';
                            //order for the sclas hash
                            var order = 0;
                            while (possValuesValue.indexOf(this.possValuesSeparator) != -1) {
                                var sclas = possValuesValue.substring(0, possValuesValue.indexOf(this.possValuesSeparator));
                                var value = this.hashOfSclasOrder.get(order).value;
                                this.hashOfSclasValue.get(value + '_' + this.widScreen).sclas = sclas;
                                possValuesValue = possValuesValue.substring(parseInt(possValuesValue.indexOf(',') + 1));
                                if (this.typeOfScreen == 2) {//multiselect
                                    var depend = possValuesText.substring(0, possValuesText.indexOf(this.possValuesSeparator));
                                    this.hashOfSclasValue.get(value + '_' + this.widScreen).depend = depend;
                                    if (depend > 1) {
                                        this.dependFields.push(value);
                                    }
                                    possValuesText = possValuesText.substring(parseInt(possValuesText.indexOf(',') + 1));
                                }
                                order++;
                            }
                        }
                    } .bind(this));
                }
            } .bind(this));
        }
        this.table += '</tbody></table>';
        this.virtualHtml.insert(this.table);
    },
    /**    
    * @description For a given screen, adds behaviour for each type of field
    */
    saveInputText: function (element, screen, id, language, value, text) {
        objectToArray(this.jsonIn.EWS.o_field_values.yglui_str_wid_record).each(function (record) {
            if (record['@screen'] == this.widScreen) {
                var rec = objectToArray(record.contents.yglui_str_wid_content.fields.yglui_str_wid_field);
                var correctLang = false
                for (var i = 0; i < rec.size(); i++) {
                    if (rec[i]['@fieldid'] == 'TRANSLATION' && rec[i]['@value'] == language) {
                        correctLang = true;
                    }
                }
                if (correctLang) {
                    rec.each(function (field) {
                        if (id == field['@fieldid']) {
                            if (Prototype.Browser.IE) {
                                field['#text'] = prepareTextToSend(element.srcElement.getAttribute('value'));
                            }
                            else {
                                field['#text'] = prepareTextToSend(element.target.value);
                            }
                        }
                    } .bind(this));
                }
            }

        } .bind(this));
    },
    /**    
    * @description For a given screen, adds behaviour for each type of field
    */
    initValuesColumn: function() {
        //textareas
        if (this.typeOfScreen == 1) {
            this.virtualHtml.select('textarea').each(function(textarea) {//adding the onchange behaviour to the textareas       
                var value = textarea.identify().gsub(this.appId + '_' + this.widScreen + '_', '').gsub('_values_textArea_' + this.language, '');
                //defining onChange method to manage changes in a textarea
                textarea.onchange = function(value) {
                    //getting the language of the textarea modified
                    var lang = this.virtualHtml.up('[class=translationsLayer_screen]').identify().split('_')[2];
                    //check if the record has been created/modified in the current execution
                    if (!Object.isEmpty(this.toChangeNodes[this.widScreen + value])) {
                        //changing the value of a textarea (if textarea has been changed before)
                        objectToArray(this.toChangeNodes[this.widScreen + value]).each(function(field) {
                            //saving value of subty
                            if (field['@fieldid'].toLowerCase() == 'subty' || (!Object.isEmpty(field['@fieldtechname']) && field['@fieldtechname'].toLowerCase() == 'subty')) {
                                field['@value'] = this.escapeEws(value);
                            }
                            //saving value in textarea
                            if (field['@fieldid'] == this.dependentFields.get(this.widScreen)) {
                                field['#text'] = this.escapeEws(textarea);
                            }
                        } .bind(this));
                        //changing the value of a textarea (first time textarea is changed)    
                    } else {
                        var newnode;
                        var changed = false;
                        var existingNode = false;
                        //check if the record already exists in the xml (created in a previous execution)
                        objectToArray(this.jsonIn.EWS.o_field_values.yglui_str_wid_record).each(function(record) {
                            if (record['@screen'] == this.widScreen && !changed) {
                                //get langu
                                var rec = objectToArray(record.contents.yglui_str_wid_content.fields.yglui_str_wid_field);
                                var recSize = rec.size();
                                var languValue = '';
                                for (var j = 0; j < recSize; j++) {
                                    if (rec[j]['@fieldid'] == 'TRANSLATION') {
                                        languValue = rec[j]['@value']
                                    }
                                }
                                if (languValue == lang) {
                                    record.contents.yglui_str_wid_content.fields.yglui_str_wid_field.each(function(field) {
                                        if (field['@fieldid'].toLowerCase() == 'subty' || (!Object.isEmpty(field['@fieldtechname']) && field['@fieldtechname'].toLowerCase() == 'subty')) {
                                            if (!Object.isEmpty(field['@value']) && field['@value'] == value) {
                                                existingNode = true;
                                                newNode = record;
                                            }
                                        }
                                    } .bind(this));
                                }
                            }
                        } .bind(this));
                        if (!existingNode) {
                            objectToArray(this.jsonIn.EWS.o_field_values.yglui_str_wid_record).each(function(record) {
                                //looking for the record in the right screen and language selected
                                if (record['@screen'] == this.widScreen && !changed) {
                                    //get langu
                                    var rec = objectToArray(record.contents.yglui_str_wid_content.fields.yglui_str_wid_field);
                                    var recSize = rec.size();
                                    var languValue = '';
                                    for (var j = 0; j < recSize; j++) {
                                        if (rec[j]['@fieldid'] == 'TRANSLATION') {
                                            languValue = rec[j]['@value']
                                        }
                                    }
                                    if (languValue == lang) {
                                        //we take an empty record from the xml, or create a new one
                                        record.contents.yglui_str_wid_content.fields.yglui_str_wid_field.each(function(field) {
                                            if (field['@fieldid'].toLowerCase() == 'subty' || (!Object.isEmpty(field['@fieldtechname']) && field['@fieldtechname'].toLowerCase() == 'subty')) {
                                                if (Object.isEmpty(field['@value']))
                                                    this.isNewNode = true;
                                                else
                                                    this.isNewNode = false;
                                            }
                                        } .bind(this));
                                        if (!this.isNewNode)
                                            newNode = deepCopy(record);
                                        else
                                            newNode = record;
                                    }
                                }
                            } .bind(this));
                        } //if(!existingNode)
                        //once we have the xml record, we work in it
                        if (this.mode == 'edit') {
                            var insButton = { yglui_str_wid_button: {} }; //'<YGLUI_STR_WID_BUTTON  OKCODE = "DEL" />';
                            //if it's the first time
                            if ('@buttons' in newNode.contents.yglui_str_wid_content) {
                                delete newNode.contents.yglui_str_wid_content['@buttons'];
                            }
                            newNode.contents.yglui_str_wid_content.buttonsDyn = insButton;
                            newNode.contents.yglui_str_wid_content.buttonsDyn.yglui_str_wid_button['@okcode'] = 'INS';

                        }
                        newNode.contents.yglui_str_wid_content.fields.yglui_str_wid_field.each(function(field) {
                            if (field['@fieldid'] == this.dependentFields.get(this.widScreen)) {
                                field['#text'] = this.escapeEws(textarea);
                                this.toChangeNodes[this.widScreen + value] = field;
                                if (!this.isNewNode && !existingNode) {
                                    //get langu
                                    var rec = objectToArray(newNode.contents.yglui_str_wid_content.fields.yglui_str_wid_field);
                                    var recSize = rec.size();
                                    var languValue = '';
                                    for (var j = 0; j < recSize; j++) {
                                        if (rec[j]['@fieldid'] == 'TRANSLATION') {
                                            rec[j]['@value'] = lang
                                        }
                                    }
                                    //adding the language in the node that is going to be added
                                    //newNode.contents.yglui_str_wid_content.fields.yglui_str_wid_field[2]['@value'] = lang;
                                    //adding the node in the json 
                                    this.jsonIn.EWS.o_field_values.yglui_str_wid_record = objectToArray(this.jsonIn.EWS.o_field_values.yglui_str_wid_record);
                                    this.jsonIn.EWS.o_field_values.yglui_str_wid_record.push(newNode);
                                }
                                changed = true;
                            }
                            if (field['@fieldid'].toLowerCase() == 'subty' || (!Object.isEmpty(field['@fieldtechname']) && field['@fieldtechname'].toLowerCase() == 'subty')) {
                                field['@value'] = value;
                            }
                        } .bind(this));
                    }
                } .bind(this, value);
            } .bind(this));
        } else {
            if (this.typeOfScreen == 2) {
                //multiselects
                this.ajaxRequestsDone = true;
                this.virtualHtml.select('[class=dynamicFieldsPanel_multiSelect fieldDisplayer_input]').each(function(multiSelectDiv) {
                    var value = multiSelectDiv.identify().gsub(this.appId + '_' + this.widScreen + '_', '').gsub('_values_multiSelect', '');
                    this.setMultiSelectValues(multiSelectDiv.identify());


                } .bind(this));
                this.handleValuesColumn();
            } else {
                if (this.typeOfScreen == 8) {
                    this.virtualHtml.select('[class=dynamicFieldsPanel_title]').each(function (element) {
                        element.identify().gsub(this.appId + '_' + this.widScreen + '_', '').gsub('title', '');
                        var elementValues = element.identify().gsub(this.appId + '_' + this.widScreen + '_', '').gsub('_title', '').split('_');
                        var id = elementValues[0];
                        var language = elementValues[1].gsub(' ', '');
                        objectToArray(this.jsonIn.EWS.o_field_values.yglui_str_wid_record).each(function (record) {
                            if (record['@screen'] == this.widScreen) {
                                var rec = objectToArray(record.contents.yglui_str_wid_content.fields.yglui_str_wid_field);
                                var correctLang = false
                                for (var i = 0; i < rec.size(); i++) {
                                    if (rec[i]['@fieldid'] == 'TRANSLATION' && rec[i]['@value'] == language) {
                                        correctLang = true;
            }
        }
                                if (correctLang) {
                                    rec.each(function (field) {
                                        if (id == field['@fieldid']) {
                                            if (!field['@value']) {
                                                field['@value'] = this.hashOfDefaultValues.get(field['@fieldid']).value;
                                            }
                                            if (!field['#text']) {
                                                field['#text'] = this.hashOfDefaultValues.get(field['@fieldid']).text;
                                            }
                                            if (field['@fieldid'].toLowerCase() == 'begda' || field['@fieldid'].toLowerCase() == 'endda') {
                                                element.insert(prepareTextToShow(objectToDisplay(sapToObject(field['@value']))));
                                            }
                                            else {
                                                if (element.nodeName == 'INPUT') {
                                                    element.setAttribute('value', prepareTextToEdit(field['#text']));
                                                    field['#text'] = prepareTextToSend(element.getAttribute('value'));
                                                    element.observe('blur', this.saveInputText.bindAsEventListener(this, this.widScreen, field['@fieldid'], language, field['@value'], field['#text']));
                                                }
                                                else {
                                                    element.insert(prepareTextToSend(field['#text']));
                                                }
                                            }
                                        }
                                    } .bind(this));
                                }
                            }

                        } .bind(this));
                    } .bind(this));
                    if (!Prototype.Browser.IE) {
                        this.virtualHtml.select('input').each(function (element) {

                            element.identify().gsub(this.appId + '_' + this.widScreen + '_', '').gsub('title', '');
                            var elementValues = element.identify().gsub(this.appId + '_' + this.widScreen + '_', '').gsub('_title', '').split('_');
                            var id = elementValues[0];
                            var language = elementValues[1].gsub(' ', '');
                            objectToArray(this.jsonIn.EWS.o_field_values.yglui_str_wid_record).each(function (record) {
                                if (record['@screen'] == this.widScreen) {
                                    var rec = objectToArray(record.contents.yglui_str_wid_content.fields.yglui_str_wid_field);
                                    var correctLang = false
                                    for (var i = 0; i < rec.size(); i++) {
                                        if (rec[i]['@fieldid'] == 'TRANSLATION' && rec[i]['@value'] == language) {
                                            correctLang = true;
                                        }
                                    }
                                    if (correctLang) {
                                        rec.each(function (field) {
                                            if (id == field['@fieldid']) {
                                                if (!field['@value']) {
                                                    field['@value'] = this.hashOfDefaultValues.get(field['@fieldid']).value;
                                                }
                                                if (!field['#text']) {
                                                    field['#text'] = this.hashOfDefaultValues.get(field['@fieldid']).text;
                                                }

                                                element.setAttribute('value', prepareTextToEdit(field['#text']));
                                                field['#text'] = prepareTextToSend(element.getAttribute('value'));
                                                element.observe('blur', this.saveInputText.bindAsEventListener(this, this.widScreen, field['@fieldid'], language, field['@value'], field['#text']));

                                            }
                                        } .bind(this));
                                    }
                                }

                            } .bind(this));
                        } .bind(this));
                    }
                }
            }
        }

    },
    /**    
    * @param multiSelectDivId id of the div where the multiselect is
    * @description Creating empty multiselect for every type of resource
    */
    setMultiSelectValues: function (multiSelectDivId) {

        var value = multiSelectDivId.gsub(this.appId + '_' + this.widScreen + '_', '').gsub('_values_multiSelect', '');
        var json = { autocompleter: { object: $A()} };

        this.multiSelectsOptions.set(this.widScreen + value, json.autocompleter.object);
        if (this.hashOfSclasValue.get(value + '_' + this.widScreen).depend > 0) {
            this.multiSelects.set(this.widScreen + value, new MultiSelect(multiSelectDivId, {
                autocompleter: {
                    showEverythingOnButtonClick: true,
                    timeout: 5000,
                    templateResult: '#{text}',
                    maxShown: 5,
                    minChars: 1,
                    maxSelectedElements: 1
                },
                events: $H({ 'onResultSelected': 'EWS:dynamicFieldsPanel_resultSelected_' + this.widScreen + value,
                    'onRemoveBox': 'EWS:dynamicFieldsPanel_removeBox_' + this.widScreen + value
                })
            }, json));
        } else {
            this.multiSelects.set(this.widScreen + value, new MultiSelect(multiSelectDivId, {
                autocompleter: {
                    showEverythingOnButtonClick: true,
                    timeout: 5000,
                    templateResult: '#{text}',
                    maxShown: 5,
                    minChars: 1
                }, maxLength: 20,
                events: $H({ 'onResultSelected': 'EWS:dynamicFieldsPanel_resultSelected_' + this.widScreen + value,
                    'onRemoveBox': 'EWS:dynamicFieldsPanel_removeBox_' + this.widScreen + value
                })
            }, json));
        }
        $(multiSelectDivId).observe('click', this.getLearnValuesIntoMultiSelect.bindAsEventListener(this, value, $(multiSelectDivId)));
        document.stopObserving('EWS:dynamicFieldsPanel_resultSelected_' + this.widScreen + value);
        document.observe('EWS:dynamicFieldsPanel_resultSelected_' + this.widScreen + value, this.multiSelectResultSelected.bindAsEventListener(this, value));
        document.stopObserving('EWS:dynamicFieldsPanel_resultSelected_' + this.widScreen + value);
        document.observe('EWS:dynamicFieldsPanel_resultSelected_' + this.widScreen + value, this.multiSelectResultSelected.bindAsEventListener(this, value));
        document.stopObserving('EWS:dynamicFieldsPanel_removeBox_' + this.widScreen + value);
        document.observe('EWS:dynamicFieldsPanel_removeBox_' + this.widScreen + value, this.multiSelectRemoveBox.bindAsEventListener(this, value));
    },
    /**    
    * @param args data about the selected item
    * @param value subty of the multiselect
    * @param value multiSelectDiv div of the multiselect to stop the 'click' event
    * @description call the service to retrieve the values 
    */
    getLearnValuesIntoMultiSelect: function (args, value, multiSelectDiv) {
        var xml = "<EWS>"
            + "<SERVICE>" + this.learningValuesService + "</SERVICE>"
            + "<PARAM>"
            + "<I_RELAT>" + value + "</I_RELAT>"
            + "</PARAM>"
            + "<DEL/>"
            + "</EWS>";
        this.makeAJAXrequest($H({ xml: xml, successMethod: this.inputMultiSelectValues.bind(this, value) }));
        multiSelectDiv.stopObserving('click');
    },

    /**    
    * @param value subty of the multiselect
    * @param answer data about the selected item
    * @description Closes the popup and add the info as a new row
    */
    inputMultiSelectValues: function (value, answer) {
        var json = { autocompleter: { object: $A()} };
        if (answer && answer.EWS && answer.EWS.o_values && answer.EWS.o_values.item) {
            objectToArray(answer.EWS.o_values.item).each(function (item) {
                json.autocompleter.object.push({
                    data: item['@id'],
                    text: item['@value']
                })
            } .bind(this));
        }
        this.multiSelects.get(this.widScreen + value).updateInput(json);
    },
    /**    
    * @param args data about the selected item
    * @param value subty of the multiselect
    * @description Closes the popup and add the info as a new row
    */
    multiSelectResultSelected: function(args, value) {
        if (this.hashOfSclasValue.get(value + '_' + this.widScreen).depend > 1) {
            for (var i = 0; i < this.dependFields.length; i++) {
                if (this.dependFields[i] != value) {
                    this.multiSelects.get(this.widScreen + this.dependFields[i]).disableElement();
                }
            }
            //Create the label for show
            this.advertMessage = new Element('div', { 'class': 'application_main_error_text multiSelect_maxElementWarning' }).update('<BR>' + global.getLabel('onlyOneOU'));
            //insert the message after that autocompleter
            this.virtualHtml.insert({ bottom: this.advertMessage })
            this.advertMessage.show();
            //After 2 second the message disapear.
            if (Prototype.Browser.IE && parseInt(navigator.userAgent.substring(navigator.userAgent.indexOf("MSIE") + 5)) == 6) {
                Element.hide.delay(1, this.advertMessage);
            }
            else {
                this.advertMessage.fade({
                    duration: 4.0,
                    delay: 1.0
                });
            }
        }
        var args = getArgs(args);
        var text = unescape(args.get('text'));
        var data = args.get('data');
        var isInXml = false;
        var newNode; // = deepCopy(objectToArray(this.jsonIn.EWS.o_field_values.yglui_str_wid_record)[0]);
        var records = objectToArray(this.jsonIn.EWS.o_field_values.yglui_str_wid_record);
        var keepLooping = true;
        for (var i = 0; i < records.length && keepLooping; i++) {
            if (records[i]['@screen'] == this.widScreen) {
                //if it existed alrady, but was deleted, we have to take the existing record          
                objectToArray(records[i].contents.yglui_str_wid_content.fields.yglui_str_wid_field).each(function(field) {
                    if (field['@fieldid'] == this.dependentFields.get(this.widScreen)) {
                        if (field['#text'] == text) {
                            keepLooping = false;
                            newNode = records[i];
                            isInXml = true;
                        }
                    }
                } .bind(this));
            }
        }
        if (Object.isEmpty(newNode)) {
            //look for a template if it's a new record
            var keepLooping = true;
            for (var i = 0; i < records.length && keepLooping; i++) {
                if (records[i]['@screen'] == this.widScreen) {
                    keepLooping = false;
                    newNode = deepCopy(records[i]);
                    if (!('@buttons' in newNode.contents.yglui_str_wid_content)) {
                        newNode.contents.yglui_str_wid_content['@buttons'] = null;
                    }
                }
            }
        }
        this.toChangeNodes[this.widScreen + value] = this.jsonIn.EWS.o_field_values.yglui_str_wid_record;
        newNode.contents.yglui_str_wid_content.fields.yglui_str_wid_field.each(function(field) {
            if (field['@fieldid'] == this.dependentFields.get(this.widScreen)) {
                field['@value'] = data;
                field['#text'] = text;
                if (!isInXml) {
                    this.jsonIn.EWS.o_field_values.yglui_str_wid_record = objectToArray(this.jsonIn.EWS.o_field_values.yglui_str_wid_record);
                    this.jsonIn.EWS.o_field_values.yglui_str_wid_record.push(newNode);
                }
            }
            if (field['@fieldid'].toLowerCase() == 'value') {
                field['@value'] = value;
                field['#text'] = '';
            }
            //sclas
            if (field['@fieldid'].toLowerCase() == 'sclas') {
                field['@value'] = this.hashOfSclasValue.get(value + '_' + this.widScreen).sclas; //value
            }
        } .bind(this));
        if (this.mode == 'edit') {
            //add button INS / remove button DEL        
            var button = { yglui_str_wid_button: {} }; //'<YGLUI_STR_WID_BUTTON  OKCODE = "DEL" />';                                                                
            //if no buttons, it's an element not used (inserted/deleted) before
            if ('@buttons' in newNode.contents.yglui_str_wid_content) {
                delete newNode.contents.yglui_str_wid_content['@buttons'];
                //insert the INS button so SAP knows this record is to be added
                newNode.contents.yglui_str_wid_content.buttonsDyn = button;
                newNode.contents.yglui_str_wid_content.buttonsDyn.yglui_str_wid_button['@okcode'] = 'INS';
            } else if ('buttonsDyn' in newNode.contents.yglui_str_wid_content) {
                //if it has buttonsDyn, then it was used before
                if (newNode.contents.yglui_str_wid_content.buttonsDyn.yglui_str_wid_button['@okcode'] == 'DEL') {
                    delete newNode.contents.yglui_str_wid_content.buttonsDyn.yglui_str_wid_button;
                }
            }
        }
    },
    /**    
    * @param args data about the removed item
    * @param value subty of the multiselect
    * @description Closes the popup and add the info as a new row
    */
    multiSelectRemoveBox: function(args, value) {
        if (this.hashOfSclasValue.get(value + '_' + this.widScreen).depend > 1) {
            for (var i = 0; i < this.dependFields.length; i++) {
                if (this.dependFields[i] != value) {
                    this.multiSelects.get(this.widScreen + this.dependFields[i]).enableElement();
                }
            }
        }
        var args = getArgs(args);
        var text = unescape(args.get('text'));
        var data = args.get('data');
        objectToArray(this.jsonIn.EWS.o_field_values.yglui_str_wid_record).each(function(record) {
            objectToArray(record.contents.yglui_str_wid_content.fields.yglui_str_wid_field).each(function(field) {
                if (field['@fieldid'] == this.dependentFields.get(this.widScreen)) {
                    if (field['@value'] == data) {
                        if (this.mode == 'create') {
                            var auxIndex = this.jsonIn.EWS.o_field_values.yglui_str_wid_record.indexOf(record);
                            this.jsonIn.EWS.o_field_values.yglui_str_wid_record.splice(auxIndex, 1);
                        } else if (this.mode == 'edit') {
                            //delete this.jsonIn.EWS.o_field_values.yglui_str_wid_record[this.jsonIn.EWS.o_field_values.yglui_str_wid_record.indexOf(record)]
                            var button = { yglui_str_wid_button: {} }; //'<YGLUI_STR_WID_BUTTON  OKCODE = "DEL" />';                                                                
                            //if no buttons, it's an element not used (inserted/deleted) before
                            if ('@buttons' in record.contents.yglui_str_wid_content) {
                                if ('buttonsDyn' in record.contents.yglui_str_wid_content == false) {
                                    delete record.contents.yglui_str_wid_content['@buttons'];
                                    //insert the DEL button so SAP knows this record is to be deleted
                                    record.contents.yglui_str_wid_content.buttonsDyn = button;
                                    record.contents.yglui_str_wid_content.buttonsDyn.yglui_str_wid_button['@okcode'] = 'DEL';
                                }
                            }
                            if ('buttonsDyn' in record.contents.yglui_str_wid_content) {
                                //if it has buttons, then it was used before
                                //if it has to be deleted from xml  
                                if (record.contents.yglui_str_wid_content.buttonsDyn.yglui_str_wid_button) {
                                    if (record.contents.yglui_str_wid_content.buttonsDyn.yglui_str_wid_button['@okcode'] == 'INS') {
                                        var auxIndex = this.jsonIn.EWS.o_field_values.yglui_str_wid_record.indexOf(record);
                                        this.jsonIn.EWS.o_field_values.yglui_str_wid_record.splice(auxIndex, 1);
                                    }
                                } else {
                                    //if we have to put DEL
                                    record.contents.yglui_str_wid_content.buttonsDyn = button;
                                    record.contents.yglui_str_wid_content.buttonsDyn.yglui_str_wid_button['@okcode'] = 'DEL';
                                }
                            }
                        }
                    }
                }
            } .bind(this));
        } .bind(this));
    },
    /**    
    * @description Once we have the labels and the objects (text areas / multiselect), we draw the value of the object, if there's any
    */
    handleValuesColumn: function() {
        if (!Object.isEmpty(this.jsonIn)
             && !Object.isEmpty(this.jsonIn.EWS)
             && !Object.isEmpty(this.jsonIn.EWS.o_field_values)
             && !Object.isEmpty(this.jsonIn.EWS.o_field_values.yglui_str_wid_record)) {
            objectToArray(this.jsonIn.EWS.o_field_values.yglui_str_wid_record).each(function(row) {
                var dependentField = !Object.isEmpty(this.dependentFields.get(row['@screen'])) ? this.dependentFields.get(row['@screen']).toLowerCase() : '';
                var serviceValues = Object.isEmpty(this.serviceValues.get(row['@screen'])) ? '' : this.serviceValues.get(row['@screen']).toLowerCase();
                var textToShow = '';
                var thirdLevelData = '';
                var data = '';
                var correctLanguage = false;
                if (this.typeOfScreen == 1) {
                    //take the current language
                    objectToArray(row.contents.yglui_str_wid_content.fields.yglui_str_wid_field).each(function(f) {
                        if (f['@fieldid'] == 'TRANSLATION')
                            this.langScreen = f['@value'];
                    } .bind(this));
                }
                if (!Object.isEmpty(row.contents)
                    && !Object.isEmpty(row.contents.yglui_str_wid_content)
                    && !Object.isEmpty(row.contents.yglui_str_wid_content.fields)
                    && !Object.isEmpty(row.contents.yglui_str_wid_content.fields.yglui_str_wid_field)) {
                    if (this.typeOfScreen == 1) {
                        //loop looking for the language                        
                        objectToArray(row.contents.yglui_str_wid_content.fields.yglui_str_wid_field).each(function(value) {
                            //to know if we are in the correct LANGU screen                                     
                            if ((value['@fieldtechname'] == 'LANGU') && (value['@value'] == this.language) && !correctLanguage)
                                correctLanguage = true;
                        } .bind(this));
                    }
                    //loop looking for the dependent field  --> where the value is
                    objectToArray(row.contents.yglui_str_wid_content.fields.yglui_str_wid_field).each(function(value) {
                        if (!Object.isEmpty(value['@fieldid']) && value['@fieldid'].toLowerCase() == dependentField) {
                            //if screen type = 1, we also need to check the language
                            if (((this.typeOfScreen == 8 || this.typeOfScreen) == 1 && correctLanguage) || (this.typeOfScreen == 2)) {
                                /* Apply show_text rule
                                I --> ID only.
                                B --> Both, Id and Text.
                                X --> Text only.                   
                                */
                                var text = !Object.isEmpty(value['#text']) ? value['#text'].strip() : value['#text'];
                                if (Object.isEmpty(this.showTextRule)) {
                                    textToShow = value['@value'];
                                } else if (this.showTextRule == 'B') {
                                    textToShow = text + this.leftSep + value['@value'] + this.rightSep;
                                } else if (this.showTextRule == 'X' || this.showTextRule == 'I') {
                                    textToShow = prepareTextToEdit(text);
                                } else {
                                    if (!Object.isEmpty(value['#text']))
                                        textToShow = value['#text'].strip();
                                    if (!Object.isEmpty(value['@value'])) {
                                        textToShow += ' ' + this.leftSep + ' ' + value['@value'] + ' ' + this.rightSep;
                                    }
                                }
                                if (!Object.isEmpty(value['@value']))
                                    data = value['@value'];
                            }
                        }
                    } .bind(this))
                    //loop printing the value
                    objectToArray(row.contents.yglui_str_wid_content.fields.yglui_str_wid_field).each(function(value) {
                        if ((this.typeOfScreen == 1 && (!Object.isEmpty(value['@fieldid']) && value['@fieldid'].toLowerCase() == 'value'))
                            || (this.typeOfScreen == 2 && (!Object.isEmpty(value['@fieldid']) && value['@fieldid'].toLowerCase() == 'value'))) {
                            //if typeOfScreen == 2 or 3, put the 'A' before the code and the SCLAS behind
                            var valueValue = value['@value'];
                            if (this.typeOfScreen == 2) {
                                //valueValue = 'A' + valueValue;
                                var auxRow = objectToArray(row.contents.yglui_str_wid_content.fields.yglui_str_wid_field);
                                for (var q = 0; q < auxRow.length; q++) {
                                    if (auxRow[q]['@fieldid'] == 'SCLAS') {
                                        var auxSclas;
                                        if (!Object.isEmpty(valueValue)) {
                                            if (valueValue.toArray().last() == auxRow[q]['@value'])
                                                auxSclas = '';
                                            else
                                                auxSclas = auxRow[q]['@value'];
                                            valueValue = valueValue + auxSclas;
                                        }
                                    }
                                }
                            }
                            if (!Object.isEmpty(this.virtualHtml.down('[id=' + this.appId + "_" + this.widScreen + "_" + valueValue + '_values' + ']')) && (this.langScreen == this.language)) {
                                if (this.mode == 'display') {
                                    if (this.virtualHtml.down('[id=' + this.appId + "_" + this.widScreen + "_" + valueValue + '_values' + ']').innerHTML == '')
                                        this.virtualHtml.down('[id=' + this.appId + "_" + this.widScreen + "_" + valueValue + '_values' + ']').insert(textToShow);
                                    else
                                        this.virtualHtml.down('[id=' + this.appId + "_" + this.widScreen + "_" + valueValue + '_values' + ']').insert('; ' + textToShow);
                                } else {
                                    //depending on the type of screen, we display one or other thing
                                    if (this.typeOfScreen == 1) {//textarea
                                        insertTextInTextArea(textToShow, this.virtualHtml.down('[id=' + this.appId + "_" + this.widScreen + "_" + valueValue + '_values_textArea_' + this.language + ']'));
                                    } else if (this.typeOfScreen == 2) {//multiSelect
                                        /*var options = objectToArray(this.multiSelectsOptions.get(this.widScreen + valueValue));
                                        for (var i = 0; i < options.length; i++) {
                                        if (options[i].text == data || options[i].data == data) {*/
                                        if (this.multiSelects.get(this.widScreen + valueValue)) {
                                                if ('buttonsDyn' in row.contents.yglui_str_wid_content) {
                                                    //if it has buttons, then it was used before
                                                    //if it has to be deleted from xml  
                                                    if (row.contents.yglui_str_wid_content.buttonsDyn.yglui_str_wid_button) {
                                                        if (row.contents.yglui_str_wid_content.buttonsDyn.yglui_str_wid_button['@okcode'] != 'DEL') {
                                                        var json = this.multiSelects.get(this.widScreen + valueValue).JSON;
                                                        json.autocompleter.object.push({ data: data, text: textToShow });
                                                        this.multiSelects.get(this.widScreen + valueValue).updateInput(json);
                                                            this.multiSelects.get(this.widScreen + valueValue).addBoxByData(data);
                                                        }
                                                    }
                                            } else {

                                                var json = this.multiSelects.get(this.widScreen + valueValue).JSON;
                                                if (textToShow) {
                                                    json.autocompleter.object.push({ data: data, text: textToShow });
                                                }
                                                else {
                                                    json.autocompleter.object.push({ data: data, text: text });
                                                }
                                                this.multiSelects.get(this.widScreen + valueValue).updateInput(json);
                                                    this.multiSelects.get(this.widScreen + valueValue).addBoxByData(data);
                                            }
                                                this.toChangeNodes[this.widScreen + valueValue] = this.jsonIn.EWS.o_field_values.yglui_str_wid_record;
                                                if (this.hashOfSclasValue.get(valueValue + '_' + this.widScreen).depend > 1) {
                                                    for (var i = 0; i < this.dependFields.length; i++) {
                                                        if (this.dependFields[i] != valueValue) {
                                                            this.multiSelects.get(this.widScreen + this.dependFields[i]).disableElement();
                                                        }
                                                    }
                                                }
                                            }
                                        //}
                                        //}
                                        }
                                } // end else mode create
                            } // end else if the object exists
                        } //end first IF
                    } .bind(this)); // end loop printing the value
                }
            } .bind(this));
        }
    },


    /* Screens type 4 and 5*/
    /**
    @description: Create links, table and initial objects in screens 4 and 5
    @last update: Add_course_type link
    */
    currTypeList: function() {
        //Get the record's structure
        var valuesScreen = objectToArray(this.jsonIn.EWS.o_field_values.yglui_str_wid_record);
        for (var i = 0; i < valuesScreen.length; i++) {
            if (valuesScreen[i]['@screen'] == this.widScreen) {
                //check if the record is delete (buttons> okCode = DEL)
                if (!valuesScreen[i].contents.yglui_str_wid_content.buttonsDyn || !(valuesScreen[i].contents.yglui_str_wid_content.buttonsDyn.yglui_str_wid_button['@okcode'] == 'DEL')) {
                    this.screenValues = valuesScreen[i]; //record's Structure
                }
            }
        }
        //Get the curriculum's type
        var continueFor = true;
        var settingScreen = objectToArray(this.jsonIn.EWS.o_field_settings.yglui_str_wid_fs_record);
        for (var i = 0; i < settingScreen.length && continueFor; i++) {
            if (settingScreen[i]['@screen'] == this.widScreen) {
                var settingsValues = objectToArray(settingScreen[i].fs_fields.yglui_str_wid_fs_field);
                for (var j = 0; j < settingsValues.length && continueFor; j++) {
                    if (settingsValues[j]['@fieldid'] == 'SCLAS') {
                        this.currType = settingsValues[j]['@default_value'];
                        continueFor = false;
                    }
                }
            }
        }
        this.containerCourses = new Element('div', { 'id': 'containerCourseId_' + this.typeOfScreen, 'class': 'DFP_containerCourseCss' });
        this.virtualHtml.insert(this.containerCourses);
        //Show List elements
        this.rechargeList();

        //Add Course Type Link
        this.addElementFromCatBinding = this.addElementFromCat.bindAsEventListener(this);
        document.stopObserving('EWS:returnSelected' + this.widScreen);
        document.observe('EWS:returnSelected' + this.widScreen, this.addElementFromCatBinding);
    },

    /** 
    * @description: Get values from json to an array
    */
    //Get values from json to array
    updateListFromJson: function() {
        //Show check boxes courses from json
        var valuesScreen = deepCopy(objectToArray(this.jsonIn.EWS.o_field_values.yglui_str_wid_record));
        this.hashElementsList = $H({});
        var seqUnord = 1;
        var checkCourse = false;
        this.orderedCourse = 1;
        var isValid = false;
        var idCourse;
        for (var i = 0; i < valuesScreen.length; i++) {
            if (valuesScreen[i]['@screen'] == this.widScreen) {
                //check if the record is delete (buttons> okCode = DEL)  contents.yglui_str_wid_content.buttonsDyn.yglui_str_wid_button.okcode
                if (!valuesScreen[i].contents.yglui_str_wid_content.buttonsDyn || !(valuesScreen[i].contents.yglui_str_wid_content.buttonsDyn.yglui_str_wid_button['@okcode'] == 'DEL')) {
                    var fieldsCourses = objectToArray(valuesScreen[i].contents.yglui_str_wid_content.fields.yglui_str_wid_field);
                    //Check if there are courses to show
                    for (j = 0; j < fieldsCourses.length; j++) {
                        if (fieldsCourses[j]['@fieldid'] == 'SCLAS') {
                            if (fieldsCourses[j]['@value'] == this.currType) {
                                checkCourse = true;
                            } else {
                                checkCourse = false;
                            }
                            //if screen = 5 order the courses
                        } else
                        //if screen = 5 order the courses
                            if (fieldsCourses[j]['@fieldid'] == 'ADATA' && !Object.isEmpty(fieldsCourses[j]['@value'])) {
                            if (this.typeOfScreen == 5) {
                                var orderCourse = fieldsCourses[j]['@value'];
                                orderCourse = orderCourse.substring(0, 2);
                                if (orderCourse != '00') {
                                    var indexCourse = orderCourse * 1;
                                    isValid = true;
                                } else {
                                    isValid = false;
                                }
                            } else {
                                //screen 4: check if course is ordered or not
                                var orderCourse = fieldsCourses[j]['@value'];
                                orderCourse = orderCourse.substring(0, 2);
                                if (orderCourse != '00') {
                                    isValid = false;
                                } else { isValid = true; }
                            }
                        }
                        else if (fieldsCourses[j]['@fieldid'] == 'SOBID' && !Object.isEmpty(fieldsCourses[j]['@value'])) {
                            idCourse = fieldsCourses[j]['@value'];
                            nameCourse = fieldsCourses[j]['#text'];
                        }
                    }
                    if (checkCourse && isValid && !Object.isEmpty(idCourse)) {
                        //create an array for each screen
                        if (this.typeOfScreen == 5) {
                            var hashCourse = $H({ id: idCourse, name: nameCourse });
                            this.hashElementsList.set(indexCourse, hashCourse);
                            this.orderedCourse++;

                        } else {
                            var hashCourse = $H({ id: idCourse, name: nameCourse });
                            this.hashElementsList.set(seqUnord, hashCourse);
                            seqUnord++;
                        }
                    }
                }
            }
        }
    },
    /** 
    * @description: draw the list elements in html
    */
    drawElementsList: function() {
        var nameCourse;
        var classname;
        if (this.typeOfScreen == 4) {
            classname = 'DFP_sortablelistElement';
        } else {
            classname = 'DFP_sortablelistElement DFP_sortablelist_order';
        }
        this.contListCourses = new Element('ul', { 'id': 'test_list' + this.typeOfScreen, 'class': 'DFP_sortablelist' });
        this.containerCourses.update(this.contListCourses);
        if (this.hashElementsList.size() == 0) {
            this.virtualHtml.down('[id=containerCourseId_' + this.typeOfScreen + ']').update("<div id='noResultsId" + this.typeOfScreen + "'><span class = 'fieldDispTotalWidth fieldDispFloatLeft application_main_soft_text pdcPendReq_emptyTableDataPart'>" + global.getLabel('noResults') + "</span></div>");

        } else if (this.virtualHtml.down('[id=noResultsId' + this.typeOfScreen + ']')) {
            this.virtualHtml.down('[id=noResultsId' + this.typeOfScreen + ']').remove();
        }
        for (i = 1; i <= this.hashElementsList.size(); i++) {
            var linCourse = new Element('li', { 'id': 'Tags_' + this.hashElementsList.get(i).get('id'), 'class': 'DFP_sortablelist_item' });
            var divCourse = new Element('div', { 'class': classname });
            if (this.typeOfScreen == 5) {
                divCourse.insert('&nbsp;' + i + '- ' + this.hashElementsList.get(i).get('name'));
                var moveUpButton = new Element('div', {
                    'class': 'DFP_moveElementlist'
                }).update("<div class=' application_arrowUp_blue'></div>");
                var moveDownButton = new Element('div', {
                    'class': 'DFP_moveElementlist'
                }).update("<div class=' application_arrowDown_blue'></div>");
                moveUpButton.observe('click', this.moveUpElementList.bind(this, this.hashElementsList.get(i).get('id')));
                moveDownButton.observe('click', this.moveDownElementList.bind(this, this.hashElementsList.get(i).get('id')));
            } else {
                divCourse.insert('&nbsp;' + this.hashElementsList.get(i).get('name'));
            }
            var closeButton = new Element('div', {
                'class': 'DFP_closeButton '
            }).update("<div class='application_remove_blue'></div>");
            closeButton.observe('click', this.removeElementList.bind(this, this.hashElementsList.get(i).get('id')));
            linCourse.insert(divCourse);
            if (this.typeOfScreen == 5) {
                linCourse.insert(moveUpButton);
                linCourse.insert(moveDownButton);
            }
            linCourse.insert(closeButton);
            this.virtualHtml.down('[id=test_list' + this.typeOfScreen + ']').insert(linCourse);
        }
        if (this.typeOfScreen == 5 && this.hashElementsList.size() > 0) {
            Sortable.create("test_list5", {
                dropOnEmpty: true,
                constraint: false,
                containment: ["test_list5"],
                onUpdate: function() {
                    this.updateOrderList();
                    this.updateListFromJson();
                    this.updateElementsList();
                } .bind(this)
            });
        }
    },
    /*
    * @description: update the order elements in the list
    */
    updateElementsList: function() {
        var nameCourse;
        var classname = 'DFP_sortablelistElement DFP_sortablelist_order';
        var lengthList = this.hashElementsList.size();
        for (i = 1; i <= lengthList; i++) {
            this.virtualHtml.down('[id=Tags_' + this.hashElementsList.get(i).get('id') + ']').down('[class=' + classname + ']').update('&nbsp;' + i + '- ' + this.hashElementsList.get(i).get('name'));
        }
    },
    /*
    * @description: update the order list when move up a course
    */
    moveUpElementList: function(key, args) {
        var sequence = Sortable.sequence("test_list5");
        var newsequence = [];
        var reordered = false;

        //move only, if there is more than one element in the list
        if (sequence.length > 1) {
            for (var j = 0; j < sequence.length; j++) {
                //move, if not already first element, the element is not null
                if (j > 0 && sequence[j].length > 0 && sequence[j] == key) {
                    var temp = newsequence[j - 1];
                    newsequence[j - 1] = key;
                    newsequence[j] = temp;
                    reordered = true;
                }
                //if element not found, just copy array element
                else {
                    newsequence[j] = sequence[j];
                }
            }
        }
        if (reordered) Sortable.setSequence("test_list5", newsequence);

        this.updateOrderList();
        this.rechargeList();
    },
    /*
    * @description: update the order list when move down a course
    */
    moveDownElementList: function(key, args) {
        var sequence = Sortable.sequence("test_list5");
        var newsequence = [];
        var reordered = false;

        //move, if not already last element, the element is not null
        if (sequence.length > 1) {
            for (var j = 0; j < sequence.length; j++) {
                //move, if not already first element, the element is not null
                if (j < (sequence.length - 1) && sequence[j].length > 0 && sequence[j] == key) {
                    newsequence[j + 1] = key;
                    newsequence[j] = sequence[j + 1];
                    reordered = true;
                    j++;
                }
                //if element not found, just copy array element
                else {
                    newsequence[j] = sequence[j];
                }
            }
        }
        if (reordered) Sortable.setSequence("test_list5", newsequence);

        this.updateOrderList();
        this.rechargeList();
    },
    /*
    * @description: delete an element from the list of courses
    */
    removeElementList: function(idElementList, args) {
        var list = this.virtualHtml.down('[id=test_list' + this.typeOfScreen + ']');
        list.removeChild(this.virtualHtml.down('[id=Tags_' + idElementList + ']'));
        if (this.typeOfScreen == 5) {
            Sortable.create("test_list5", {
                dropOnEmpty: true,
                constraint: false,
                containment: ["test_list5"],
                onUpdate: function() {
                    this.updateOrderList();
                    this.updateListFromJson();
                    this.updateElementsList();
                } .bind(this)
            });
        }
        var valuesScreen = objectToArray(this.jsonIn.EWS.o_field_values.yglui_str_wid_record);
        for (var i = 0; i < valuesScreen.length; i++) {
            if (valuesScreen[i]['@screen'] == this.widScreen) {
                var fieldsCourses = objectToArray(valuesScreen[i].contents.yglui_str_wid_content.fields.yglui_str_wid_field);
                for (j = 0; j < fieldsCourses.length; j++) {
                    if (fieldsCourses[j]['@fieldid'] == 'SOBID') {
                        if (fieldsCourses[j]['@value'] == idElementList) {
                            delCourse = true;
                            if (valuesScreen[i].contents.yglui_str_wid_content.buttonsDyn && valuesScreen[i].contents.yglui_str_wid_content.buttonsDyn.yglui_str_wid_button['@okcode'] == 'INS') {
                                valuesScreen.splice(i, 1);
                            } else {
                                //if the course is from sap it adds a new record to delete it in the database
                                // courseInJson = false;
                                var deleteButton = { yglui_str_wid_button: {} }; //'<YGLUI_STR_WID_BUTTON  OKCODE = "DEL" />';
                                //delete this.jsonIn.EWS.o_field_values.yglui_str_wid_record[this.jsonIn.EWS.o_field_values.yglui_str_wid_record.indexOf(record)]
                                var record = valuesScreen[i];
                                //if it's the first time we delete the record 
                                if ('@buttons' in valuesScreen[i].contents.yglui_str_wid_content) {
                                    delete valuesScreen[i].contents.yglui_str_wid_content['@buttons'];
                                }
                                //insert the DEL button so SAP knows this record is to be deleted 
                                valuesScreen[i].contents.yglui_str_wid_content.buttonsDyn = deleteButton;
                                //getContentDisplayer insert the same line again
                                valuesScreen[i].contents.yglui_str_wid_content.buttonsDyn.yglui_str_wid_button['@okcode'] = 'DEL';
                            }
                        }
                    }
                }
            }
        }
        if (this.typeOfScreen == 5) {
            this.updateOrderList();
        }
        this.rechargeList();

    },

    /*
    * @description: drag and drop lists update function
    updates results textbox
    */
    updateOrderList: function() {
        /*
        get current elements order
        */
        var sequence = Sortable.sequence("test_list5");
        var list = escape(sequence);
        var sorted_ids = unescape(list).split(',');
        var breakFor = false;
        var valuesScreen = objectToArray(this.jsonIn.EWS.o_field_values.yglui_str_wid_record);
        var position = -1;
        for (var x = 0; x < sorted_ids.length; x++) {
            var numOrd = x + 1;
            for (var i = 0; i < valuesScreen.length; i++) {
                if (valuesScreen[i]['@screen'] == 5) {
                    var fieldsCourses = objectToArray(valuesScreen[i].contents.yglui_str_wid_content.fields.yglui_str_wid_field);
                    //Check if there are courses to show
                    breakFor = true;
                    for (j = 0; j < fieldsCourses.length; j++) {
                        if (fieldsCourses[j]['@fieldid'] == 'SOBID' && fieldsCourses[j]['@value'] == sorted_ids[x]) {
                            breakFor = false;
                        } else if (fieldsCourses[j]['@fieldid'] == 'ADATA') {
                            //Save position to change the course's order
                            position = j;
                        }
                    }
                    if (!breakFor) {
                        breakFor = true;
                        if (numOrd > 9) {
                            fieldsCourses[position]['@value'] = numOrd.toString() + '0000X00 00';
                        } else {
                            fieldsCourses[position]['@value'] = '0' + numOrd.toString() + '0000X00 00';
                        }
                    }
                }
            }
        }
    },


    /**  
    **@param event Event thrown when closing the catalogue
    **@description Get the selected courses from catalog to show them
    */
    addElementFromCat: function(event) {
        var inScreen = getArgs(event)._object.InScreen;
        var courseInJson = false;
        var continueFor = true;
        if (inScreen == this.widScreen) {
            var allCheckBoxes = new Array();
            //save all id course from json to check if the selected course exist already.
            var valuesScreen = objectToArray(this.jsonIn.EWS.o_field_values.yglui_str_wid_record);
            if (allCheckBoxes.length == 0) {
                for (i = 0; i < valuesScreen.length; i++) {
                    if (valuesScreen[i]['@screen'] == 4 || valuesScreen[i]['@screen'] == 5) {
                        //check if the record is delete (buttons> okCode = DEL)
                        if (!(valuesScreen[i].contents.yglui_str_wid_content.buttonsDyn)) {// || (valuesScreen[i].contents.yglui_str_wid_content.buttonsDyn.yglui_str_wid_button.okcode == 'DEL')) {
                            courseElement = objectToArray(valuesScreen[i].contents.yglui_str_wid_content.fields.yglui_str_wid_field);
                            for (j = 0; j < courseElement.length; j++) {
                                if (courseElement[j]['@fieldid'] == 'SOBID' && !Object.isEmpty(courseElement[j]['@value'])) {
                                    allCheckBoxes.push({ id: courseElement[j]['@value'], name: courseElement[j]['#text'], deleted: false });
                                }
                            }
                        } else if (valuesScreen[i].contents.yglui_str_wid_content.buttonsDyn.yglui_str_wid_button['@okcode'] == 'DEL') {
                            courseElement = objectToArray(valuesScreen[i].contents.yglui_str_wid_content.fields.yglui_str_wid_field);
                            for (j = 0; j < courseElement.length; j++) {
                                if (courseElement[j]['@fieldid'] == 'SOBID' && !Object.isEmpty(courseElement[j]['@value'])) {
                                    allCheckBoxes.push({ id: courseElement[j]['@value'], name: courseElement[j]['#text'], deleted: true });
                                }
                            }
                        } else {
                            courseElement = objectToArray(valuesScreen[i].contents.yglui_str_wid_content.fields.yglui_str_wid_field);
                            for (j = 0; j < courseElement.length; j++) {
                                if (courseElement[j]['@fieldid'] == 'SOBID' && !Object.isEmpty(courseElement[j]['@value'])) {
                                    allCheckBoxes.push({ id: courseElement[j]['@value'], name: courseElement[j]['#text'], deleted: false });
                                }
                            }
                        }
                    }
                }
            }
            if (this.widScreen == getArgs(event)._object.InScreen) {
                //Get selected courses
                this.elementsAdded = $A();
                this.elementsAdded = getArgs(event).get('hash');
                var selectValues;
                var validCourse;
                this.courseNoValid = "";
                for (var i = 0; i < this.elementsAdded.keys().size(); i++) {
                    courseInJson = false;
                    continueFor = true;
                    //Insert values to send it to SAP
                    if (this.elementsAdded.get(this.elementsAdded.keys()[i]).childType == this.currType) {
                        for (var k = 0; k < allCheckBoxes.length && continueFor; k++) {
                            if (allCheckBoxes[k].id == this.elementsAdded.keys()[i]) {
                                if (!allCheckBoxes[k].deleted) {
                                    this.courseNoValid = this.courseNoValid + '<div> -' + allCheckBoxes[k].name + '</div>';
                                    courseInJson = true;
                                    continueFor = false;
                                } else {
                                    for (var k = 0; k < valuesScreen.length && continueFor; k++) {
                                        if (valuesScreen[k]['@screen'] == 4 || valuesScreen[k]['@screen'] == 5) {
                                            courseElement = objectToArray(valuesScreen[k].contents.yglui_str_wid_content.fields.yglui_str_wid_field);
                                            for (var j = 0; j < courseElement.length && continueFor; j++) {
                                                if (courseElement[j]['@fieldid'] == 'SOBID' && (courseElement[j]['@value'] == this.elementsAdded.keys()[i])) {
                                                    //delete(this.jsonIn.EWS.o_field_values.yglui_str_wid_record[k].contents.yglui_str_wid_content.buttonsDyn);                                                                                        
                                                    if (valuesScreen[k].contents.yglui_str_wid_content.buttonsDyn.yglui_str_wid_button['@okcode'] == 'DEL') {
                                                        valuesScreen[k].contents.yglui_str_wid_content.buttonsDyn.yglui_str_wid_button['@okcode'] = 'INS';
                                                        courseInJson = true;
                                                        continueFor = false;
                                                    }
                                                }
                                            }
                                            if (courseInJson) {
                                                continueFor = true;
                                                for (var j = 0; j < courseElement.length && continueFor; j++) {
                                                    if (courseElement[j]['@fieldid'] == 'ADATA') {
                                                        if (!(this.jsonIn.EWS.o_field_values.yglui_str_wid_record[k]['@screen'] == inScreen)) {
                                                            this.jsonIn.EWS.o_field_values.yglui_str_wid_record[k]['@screen'] = inScreen;
                                                            if (inScreen == 5) {
                                                                orderCourse = courseElement[j]['@value'].substring(2);
                                                                if (this.orderedCourse > 9) {
                                                                    courseElement[j]['@value'] = this.orderedCourse.toString() + orderCourse;
                                                                }
                                                                else {
                                                                    courseElement[j]['@value'] = '0' + this.orderedCourse.toString() + orderCourse;
                                                                }
                                                                this.orderedCourse++;
                                                            } else {
                                                                orderCourse = courseElement[j]['@value'].substring(2);
                                                                courseElement[j]['@value'] = '00' + orderCourse;
                                                            }
                                                        }
                                                        continueFor = false;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                        //var courseRecord=deepCopy(selectValues);
                        var courseRecord = deepCopy(this.screenValues);
                        if (!courseInJson) {
                            //if the course is from sap it adds a new record to insert it in the database
                            var insertButton = { yglui_str_wid_button: [] }; //'<YGLUI_STR_WID_BUTTON  OKCODE = "INS" />';
                            //delete this.jsonIn.EWS.o_field_values.yglui_str_wid_record[this.jsonIn.EWS.o_field_values.yglui_str_wid_record.indexOf(record)]
                            //if it's the first time we insert the record
                            if ('@buttons' in courseRecord.contents.yglui_str_wid_content) {
                                delete courseRecord.contents.yglui_str_wid_content['@buttons'];
                            }
                            //insert the INS button so SAP knows this record is to be inserted
                            courseRecord.contents.yglui_str_wid_content.buttonsDyn = insertButton;
                            //getContentDisplayer insert the same line again
                            courseRecord.contents.yglui_str_wid_content.buttonsDyn.yglui_str_wid_button['@okcode'] = 'INS';

                            courseElement = objectToArray(courseRecord.contents.yglui_str_wid_content.fields.yglui_str_wid_field);
                            validCourse = true;
                            //check if the course is already selected
                            for (y = 0; y < allCheckBoxes.length; y++) {
                                if (allCheckBoxes[y].id == this.elementsAdded.keys()[i]) {
                                    validCourse = false;
                                }
                            }
                            if (validCourse) {
                                for (j = 0; j < courseElement.length; j++) {
                                    if (courseElement[j]['@fieldid'] == 'ADATA') {
                                        if (this.typeOfScreen == 5) {
                                            //ADATA 
                                            if (this.orderedCourse > 9) {
                                                courseElement[j]['@value'] = this.orderedCourse.toString() + '0000X00 00';
                                            } else {
                                                courseElement[j]['@value'] = '0' + this.orderedCourse.toString() + '0000X00 00';
                                            }
                                            this.orderedCourse++;
                                        } else {
                                            //ADATA
                                            courseElement[j]['@value'] = '000000X00 00';
                                        }
                                    }
                                    else if (courseElement[j]['@fieldid'] == 'SOBID') {
                                        //SOBID
                                        courseElement[j]['@value'] = this.elementsAdded.keys()[i];
                                        courseElement[j]['#text'] = this.elementsAdded.get(this.elementsAdded.keys()[i]).childName;
                                    }
                                    else if (courseElement[j]['@fieldid'] == 'SCLAS') {
                                        //SCLAS
                                        courseElement[j]['@value'] = this.currType;
                                    }
                                }
                                //adding the courseElement in the json if is a valid course
                                this.jsonIn.EWS.o_field_values.yglui_str_wid_record = objectToArray(this.jsonIn.EWS.o_field_values.yglui_str_wid_record);
                                this.jsonIn.EWS.o_field_values.yglui_str_wid_record.push(courseRecord);
                            } //end if validCourse
                        } //end if courseInJson
                    }
                }
                this.rechargeList();
                //show a message when the user select a course in the catalogue which exist already in the curriculum type
                if (this.courseNoValid && !this.courseNoValid.empty()) {
                    var buttonsJsonPopup = {
                        elements: [],
                        mainClass: 'moduleInfoPopUp_stdButton_div_right'
                    };
                    var closePopupBut = function() {
                        duplicateCourses.close();
                        delete duplicateCourses;
                    };
                    var okButton = {
                        idButton: 'okButton',
                        label: global.getLabel('ok'),
                        handlerContext: null,
                        className: 'moduleInfoPopUp_stdButton',
                        handler: closePopupBut,
                        type: 'button',
                        standardButton: true
                    };
                    buttonsJsonPopup.elements.push(okButton);
                    var ButtonObj = new megaButtonDisplayer(buttonsJsonPopup);
                    var buttons = ButtonObj.getButtons();
                    var message = '<div>' + global.getLabel('alreaCurri') + '</div>' + this.courseNoValid;
                    //insert hash with information in div                                
                    var contentHTML = new Element('div');
                    contentHTML.insert(message);
                    contentHTML.insert(buttons);
                    var duplicateCourses = new infoPopUp({
                        closeButton: $H({
                            'callBack': function() {
                                duplicateCourses.close();
                                delete duplicateCourses;
                            }
                        }),
                        htmlContent: contentHTML,
                        indicatorIcon: 'information',
                        width: 600
                    });
                    duplicateCourses.create();
                }
            }
        }
    },
    rechargeList: function() {
        this.updateListFromJson(); //update hash
        this.drawElementsList();

    },
    /*
    ** @description: view detail (display mode)
    */
    //View detail (display mode)
    drawDisplayCheckBoxes: function() {
        //Get the curriculum's type
        var continueFor = true;
        var settingScreen = objectToArray(this.jsonIn.EWS.o_field_settings.yglui_str_wid_fs_record);
        for (var i = 0; i < settingScreen.length && continueFor; i++) {
            if (settingScreen[i]['@screen'] == this.widScreen) {
                var settingsValues = objectToArray(settingScreen[i].fs_fields.yglui_str_wid_fs_field);
                for (var j = 0; j < settingsValues.length && continueFor; j++) {
                    if (settingsValues[j]['@fieldid'] == 'SCLAS') {
                        this.currType = settingsValues[j]['@default_value'];
                        continueFor = false;
                    }
                }
            }
        }
        this.updateListFromJson();
        var nameCourse;
        var classname;
        this.containerCourses = new Element('div', { 'id': 'containerCourseId_' + this.typeOfScreen, 'class': 'DFP_displayContainerCourseCss' });
        this.virtualHtml.insert(this.containerCourses);
        this.contListCourses = new Element('ul', { 'id': 'test_list' + this.typeOfScreen, 'class': 'DFP_displaySortablelist' });
        this.containerCourses.update(this.contListCourses);
        if (this.hashElementsList.size() == 0) {
            this.virtualHtml.down('[id=containerCourseId_' + this.typeOfScreen + ']').update("<div id='noResultsId" + this.typeOfScreen + "'><span class = 'fieldDispTotalWidth fieldDispFloatLeft application_main_soft_text pdcPendReq_emptyTableDataPart'>" + global.getLabel('noResults') + "</span></div>");
        } else if (this.virtualHtml.down('[id=noResultsId' + this.typeOfScreen + ']')) {
            this.virtualHtml.down('[id=noResultsId' + this.typeOfScreen + ']').remove();
        }
        for (i = 1; i <= this.hashElementsList.size(); i++) {
            var linCourse = new Element('li', { 'id': 'Tags_' + this.hashElementsList.get(i).get('id') });
            var divCourse = new Element('div');
            /* Apply show_text rule
            I --> ID only.
            B --> Both, Id and Text.
            X --> Text only.                   
            */
            var textToShow;
            if (Object.isEmpty(this.showTextRule)) {
                textToShow = this.hashElementsList.get(i).get('name');
            } else if (this.showTextRule == 'B') {
                textToShow = this.hashElementsList.get(i).get('name') + this.leftSep + this.hashElementsList.get(i).get('id') + this.rightSep;
            } else if (this.showTextRule == 'X' || this.showTextRule == 'I') {
                textToShow = this.hashElementsList.get(i).get('name');
            }
            if (this.typeOfScreen == 5) {
                divCourse.insert('&nbsp;' + i + '- ' + textToShow);
            } else {
                divCourse.insert('&nbsp;' + textToShow);
            }
            linCourse.insert(divCourse);
            this.virtualHtml.down('[id=test_list' + this.typeOfScreen + ']').insert(linCourse);
        }
    },

    /* End Screens 4 and 5*/


    /* Screens 6 and 7*/
    /**    
    * @description Calls a servive to retrieve the possible course types for the scren
    */
    retrieveCourseTypes: function() {
        //6: Unordered
        //7: Ordered
        var ordered = (this.typeOfScreen == 6) ? '' : 'X';
        //calling the service
        var xml = "<EWS>"
                          + "<SERVICE>" + this.getCourseType + "</SERVICE>"
                          + "<OBJECT TYPE = '" + this.objectType + "'>" + this.objectId + "</OBJECT>"
                          + "<PARAM>"
                            + "<I_ORDER>" + ordered + "</I_ORDER>"
                          + "</PARAM>"
                          + "<DEL/>"
                     + "</EWS>";
        this.makeAJAXrequest($H({ xml: xml, successMethod: this.setCourseTypes.bind(this) }));
    },
    /**    
    * @param json List of the possible course types with data about them (adata)
    * @description Retrieves the list of the possible course types
    */
    setCourseTypes: function(json) {
        this.manfield = false;
        //table to display the structure parent-autocompleter
        var table = new Element('table', {
            'class': 'dynamicFieldsPanelTable test_table',
            'id': this.appId + '_' + this.widScreen + '_dynFPtype6'
        });
        //var tableHead = new Element("thead");
        var tableBody = new Element("tbody");
        //table.insert(tableHead);
        table.insert(tableBody);
        if (Object.jsonPathExists(json, 'EWS.o_values.item')) {
            var courseTypeItemsXml = objectToArray(json.EWS.o_values.item);
            this.courseTypeItems = new Array();
            for (var i = 0; i < courseTypeItemsXml.length; i++) {
                //create structure of the table: tr, td
                var courseTypeid = courseTypeItemsXml[i]['@id'].split('_')[0];
                var adata = courseTypeItemsXml[i]['@id'].split('_')[1];
                var value = courseTypeItemsXml[i]['@value'];
                this.courseTypeItems.push({ id: courseTypeid, adata: adata, value: value });
                var newRow = new Element("tr", {
                    "id": this.appId + '_' + this.widScreen + '_dynFPtype6_row_' + this.courseTypeItems[i].id,
                    "class": ""
                });
                var parentColumn = new Element("td").insert('<div class = "application_main_soft_text test_label">' + this.courseTypeItems[i].value + '</div>');
                var autocomColumn = new Element("td").insert('<div id = "' + this.appId + '_' + this.widScreen + '_dynFPtype6_row_autocom_' + this.courseTypeItems[i].id + '"></div>');
                //insert columns and row
                newRow.insert(parentColumn);
                newRow.insert(autocomColumn);
                tableBody.insert(newRow);
                //start building autocompleter for this row --> call service 
            }
            this.virtualHtml.insert(table);

            //call the service to retrieve the values of each autocompleter
            var settingScreen = objectToArray(this.jsonIn.EWS.o_field_settings.yglui_str_wid_fs_record);
            var breakFor = true;
            //service used to retrive the curr. sessions
            this.serviceGetCurr = '';
            //take the service_values from the sobid
            var screenSettings;
            for (var i = 1; i < settingScreen.length && breakFor; i++) {
                if (settingScreen[i]['@screen'] == this.widScreen) {
                    breakFor = false;
                    var fields = objectToArray(settingScreen[i].fs_fields.yglui_str_wid_fs_field);
                    screenSettings = deepCopy(settingScreen[i]);
                    for (var j = 1; j < fields.length; j++) {
                        if (fields[j]['@fieldid'].toLowerCase() == 'sobid')
                            this.serviceGetCurr = fields[j]['@service_values'];
                        if (fields[j]['@display_attrib'] == 'MAN') {
                            this.manfield = true;
                        }
                    }
                }

            }
            //create a hash with information about the record: xml, autocompleter...
            this.createInfoHash(json);
            if (this.typeOfScreen == 6) {
                //call the service to retrieve all sesions for a course type
                for (var i = 0; i < this.courseTypeItems.length; i++) {
                    var xml = "<EWS>" +
                                "<SERVICE>" + this.serviceGetCurr + "</SERVICE>" +
                                "<OBJECT TYPE='D'>" + this.courseTypeItems[i].id + "</OBJECT>" +
                                "<PARAM>" +
                                "<I_ENDDA/>" +
                                "<I_ENDUZ/>" +
                                "<I_DATE_FORMAT>" + global.dateFormat.toUpperCase() + "</I_DATE_FORMAT>";
                    if (this.mode == 'display') {
                        xml += "<I_DISPLAY>X</I_DISPLAY>";
                    }
                    xml += "</PARAM>" +
                                "<DEL/>" +
                            "</EWS>";
                    this.makeAJAXrequest($H({ xml: xml, successMethod: this.setCourseTypesAutocomValues.bind(this, this.courseTypeItems[i].id) }));
                }
            } else if (this.typeOfScreen == 7) {
                if (this.mode != 'display') {
                    //in screen 7, we just call SAP for the first autocompleter. The others will be filled later
                    var xml = "<EWS>" +
                                    "<SERVICE>" + this.serviceGetCurr + "</SERVICE>" +
                                    "<OBJECT TYPE='D'>" + this.courseTypeItems[0].id + "</OBJECT>" +
                                    "<PARAM>" +
                                        "<I_ENDDA/>" +
                                        "<I_ENDUZ/>" +
                                        "<I_DATE_FORMAT>" + global.dateFormat.toUpperCase() + "</I_DATE_FORMAT>";
                    if (this.mode == 'display') {
                        xml += "<I_DISPLAY>X</I_DISPLAY>";
                    }
                    xml += "</PARAM>" +
                                    "<DEL/>" +
                                "</EWS>";
                    this.makeAJAXrequest($H({ xml: xml, successMethod: this.setCourseTypesAutocomValues.bind(this, this.courseTypeItems[0].id) }));
                } else {
                    //call the service to retrieve all sesions for a course type
                    for (var i = 0; i < this.courseTypeItems.length; i++) {
                        var xml = "<EWS>" +
                                    "<SERVICE>" + this.serviceGetCurr + "</SERVICE>" +
                                    "<OBJECT TYPE='D'>" + this.courseTypeItems[i].id + "</OBJECT>" +
                                    "<PARAM>" +
                                    "<I_ENDDA/>" +
                                    "<I_ENDUZ/>" +
                                    "<I_DATE_FORMAT>" + global.dateFormat.toUpperCase() + "</I_DATE_FORMAT>";
                        if (this.mode == 'display') {
                            xml += "<I_DISPLAY>X</I_DISPLAY>";
                        }
                        xml += "</PARAM>" +
                                    "<DEL/>" +
                                "</EWS>";
                        this.makeAJAXrequest($H({ xml: xml, successMethod: this.setCourseTypesAutocomValues.bind(this, this.courseTypeItems[i].id) }));
                    }
                }
            }
        } else {
            this.virtualHtml.update("<div><span class = 'fieldDispTotalWidth fieldDispFloatLeft application_main_soft_text pdcPendReq_emptyTableDataPart'>" + global.getLabel('noResults') + "</span></div>");
        }
    },
    /**    
    * @param json List of the possible course types with data about them (adata)
    * @description create a hash with information about each record: xml, autocompleter...
    */
    createInfoHash: function(json) {
        this.infoHash = $H();
        var valuesScreen = objectToArray(this.jsonIn.EWS.o_field_values.yglui_str_wid_record);
        var courseElement;
        if (this.mode == 'edit') {
            for (var i = 0; i < this.courseTypeItems.length; i++) {
                var existingRecord = false;
                for (var j = 0; j < valuesScreen.length; j++) {
                    if (valuesScreen[j]['@screen'] == this.widScreen) {
                        var fields = valuesScreen[j].contents.yglui_str_wid_content.fields.yglui_str_wid_field;
                        for (var q = 0; q < fields.length; q++) {
                            if (fields[q]['@fieldid'] == 'P_SOBID' && fields[q]['@value'] == this.courseTypeItems[i].id) {
                                existingRecord = true;
                                //we create the hash item, but we don't need to insert anything in the xml
                                this.infoHash.set(this.courseTypeItems[i].id, {
                                    itemData: this.courseTypeItems[i],
                                    xml: valuesScreen[j], //record's xml (no deepcopy because it's not a template. this is the xml of the actual record)
                                    autocompleter: ''
                                });
                            }
                        } //end for
                    } //end if
                } //end for record.values
                if (!existingRecord) { // if there's not an existing record, we create one.
                    var breakFor = true;
                    courseElement;
                    for (var j = 0; j < valuesScreen.length && breakFor; j++) {
                        if (valuesScreen[j]['@screen'] == this.widScreen) {
                            courseElement = valuesScreen[j]; //record's Structure
                            breakFor = false;
                        }
                    }
                    this.infoHash.set(this.courseTypeItems[i].id, {
                        itemData: this.courseTypeItems[i],
                        xml: deepCopy(courseElement),
                        autocompleter: ''
                    });
                    //insert the records in the xml (we'll insert the info later)    
                    this.jsonIn.EWS.o_field_values.yglui_str_wid_record = objectToArray(this.jsonIn.EWS.o_field_values.yglui_str_wid_record);
                    this.jsonIn.EWS.o_field_values.yglui_str_wid_record.push(this.infoHash.get(this.courseTypeItems[i].id).xml);
                }
            }
        } else if (this.mode == 'create') {
            var breakFor = true;
            //take template record            
            for (var i = 0; i < valuesScreen.length && breakFor; i++) {
                if (valuesScreen[i]['@screen'] == this.widScreen) {
                    courseElement = valuesScreen[i]; //record's Structure
                    breakFor = false;
                }
            }
            for (var i = 0; i < this.courseTypeItems.length; i++) {
                this.infoHash.set(this.courseTypeItems[i].id, {
                    itemData: this.courseTypeItems[i],
                    xml: deepCopy(courseElement),
                    autocompleter: ''
                });
                //insert the records in the xml (we'll insert the info later)    
                this.jsonIn.EWS.o_field_values.yglui_str_wid_record = objectToArray(this.jsonIn.EWS.o_field_values.yglui_str_wid_record);
                this.jsonIn.EWS.o_field_values.yglui_str_wid_record.push(this.infoHash.get(this.courseTypeItems[i].id).xml);
            }
        }

    },
    /**    
    * @param id Id of the autocompleter
    * @param answer List of the possible courses (sessions) for a given course type
    * @description Sets possible values in a course type autocompleter
    */
    setCourseTypesAutocomValues: function(id, answer) {

        var domAutocom = this.virtualHtml.down('[id=' + this.appId + '_' + this.widScreen + '_dynFPtype6_row_autocom_' + id + ']');
        if (this.mode == 'edit' || this.mode == 'create') {
            //look for the proper autocompleter                         
            var autocompleterJson = { autocompleter: { object: $A()} };
            if (answer && answer.EWS && answer.EWS.o_values && answer.EWS.o_values.item) {
                objectToArray(answer.EWS.o_values.item).each(function(item) {
                    autocompleterJson.autocompleter.object.push({
                        data: item['@id'],
                        text: item['@value']
                    })
                } .bind(this));
            }
            //if the autocompleter is not created yet
            if (Object.isEmpty(domAutocom.innerHTML)) {
                this.infoHash.get(id).autocompleter = new JSONAutocompleter(domAutocom, {
                    showEverythingOnButtonClick: true,
                    timeout: 5000,
                    templateResult: '#{text}',
                    templateOptionsList: "#{text}",
                    minChars: 2,
                    events: $H({
                        onResultSelected: "EWS:dynFPscreen6or7_sessionSelected" + this.widScreen
                    })
                }, autocompleterJson);
                if (this.manfield) {
                    this.mandatoryIndicator = new Element('span', {
                        'class': 'fieldDispMandatoryIndicator application_main_soft_text fieldDispFloatLeft'
                    });
                    this.mandatoryIndicator.insert('*');
                    domAutocom.insert(this.mandatoryIndicator);
                }

            } else {//if the autocompleter is already existing
                //update json in the autocompleter selected
                this.infoHash.get(id).autocompleter.clearInput();
                this.infoHash.get(id).autocompleter.updateInput(autocompleterJson);
            }
        }
        //if there are existing data for this record
        var valuesScreen = objectToArray(this.jsonIn.EWS.o_field_values.yglui_str_wid_record);
        for (var i = 0; i < valuesScreen.length; i++) {
            if (valuesScreen[i]['@screen'] == this.widScreen) {
                var fields = valuesScreen[i].contents.yglui_str_wid_content.fields.yglui_str_wid_field;
                for (var q = 0; q < fields.length; q++) {
                    //if parent == current id
                    if (fields[q]['@fieldid'] == 'P_SOBID' && fields[q]['@value'] == id) {
                        for (var u = 0; u < fields.length; u++)
                            if (fields[u]['@fieldid'] == 'SOBID')
                        //take SOBID so we can select it in the autocomp
                            var selectedItem = fields[u]['@value'];
                    }
                } //end for 
                //mark selectedItem as selected in the autocomp /display it
                if (answer && answer.EWS && answer.EWS.o_values && answer.EWS.o_values.item) {
                    objectToArray(answer.EWS.o_values.item).each(function(item) {
                        if (item['@id'].split('_')[0] == selectedItem) {
                            if (this.mode == 'edit' || this.mode == 'create') {
                                this.infoHash.get(id).autocompleter.setDefaultValue(item['@id'], false);
                            } else if (this.mode == 'display') {
                                domAutocom.innerHTML = item['@value'];
                            }
                        }
                    } .bind(this));
                }
            }
        }
    },

    /**    
    * @param args Data about the selected course (session)
    * @description When selecting a course, modify the record xml with the selected item information
    */
    sessionSelected: function(args) {
        //take event parameters
        var sobid = getArgs(args).idAdded.split('_')[0];
        var enduz = getArgs(args).idAdded.split('_')[1];
        var endda = getArgs(args).idAdded.split('_')[2];
        var prevAutocomId = getArgs(args).idAutocompleter.split('_').pop();
        var adata;
        for (var i = 0; i < this.courseTypeItems.length; i++) {
            if (this.courseTypeItems[i].id == prevAutocomId)
                adata = this.courseTypeItems[i].adata;
        }
        var courseElement;
        //look for the proper record to modify
        for (var j = 0; j < this.infoHash.keys().length; j++) {
            if (this.infoHash.get(this.infoHash.keys()[j]).itemData.id == prevAutocomId)
                courseElement = this.infoHash.get(this.infoHash.keys()[j]).xml;

        }
        //Insert values to send it to SAP     
        var fields = objectToArray(courseElement.contents.yglui_str_wid_content.fields.yglui_str_wid_field);
        for (j = 0; j < fields.length; j++) {
            if (fields[j]['@fieldid'] == 'ADATA') {
                //ADATA
                fields[j]['@value'] = adata;
            }
            else if (fields[j]['@fieldid'] == 'SOBID') {
                //SOBID
                fields[j]['@value'] = sobid;
            }
            else if (fields[j]['@fieldid'] == 'SCLAS') {
                //SCLAS
                fields[j]['@value'] = 'E';
            }
            else if (fields[j]['@fieldid'] == 'VALUE') {
                //SUBTY
                fields[j]['@value'] = 'A613';
            }
        }
        //now, depending on the type of screen, we do one or other thing
        /*
        if( this.typeOfScreen ==  6){//if screen == 6, we just insert the record in the xml               
     
             
        }else */
        if (this.typeOfScreen == 7) {// in screen 7, once we select something, we fill in the next autocompleter            
            //look for the next autocompleter to fill in            
            var index = 0;
            for (var i = 0; i < this.courseTypeItems.length; i++) {
                if (this.courseTypeItems[i].id == prevAutocomId)
                    index = i + 1;
            }
            if (index < this.courseTypeItems.length) {
                var xml = "<EWS>" +
                            "<SERVICE>" + this.serviceGetCurr + "</SERVICE>" +
                            "<OBJECT TYPE='D'>" + this.courseTypeItems[index].id + "</OBJECT>" +
                            "<PARAM>" +
                            "<I_ENDDA>" + endda + "</I_ENDDA>" +
                            "<I_ENDUZ>" + enduz + "</I_ENDUZ>" +
                            "<I_DATE_FORMAT>" + global.dateFormat.toUpperCase() + "</I_DATE_FORMAT>";
                if (this.mode == 'display') {
                    xml += "<I_DISPLAY>X</I_DISPLAY>";
                }
                xml += "</PARAM>" +
                            "<DEL/>" +
                        "</EWS>";
                this.makeAJAXrequest($H({ xml: xml, successMethod: this.setCourseTypesAutocomValues.bind(this, this.courseTypeItems[index].id) }));
            }

        }
    },
    getElement: function() {
        return this.virtualHtml;
    },
    /* End Screens 6 and 7*/

    destroy: function() {
        //Removing the HTML content
        if (this.virtualHtml.parentNode) {
            this.virtualHtml.remove();
        }
        document.stopObserving('EWS:returnSelected' + this.widScreen, this.addElementFromCatBinding);
        document.stopObserving('EWS:dynFPscreen6or7_sessionSelected' + this.widScreen, this.sessionSelectedBinding);
        document.stopObserving('EWS:dynamicFieldsPanel_removeBox_' + this.widScreen + value);

    },
    escapeEws: function(textArea) {
        if (Prototype.Browser.IE) {
            var text = textArea.innerHTML ? textArea.innerHTML : textArea
            text = text.gsub("\r", "").gsub("\n", "<br/>").gsub("<BR>", "<br/>");
        }
        else {
            var text = textArea.value.gsub("\n", "<br/>");
        }
        return text;
    }
});