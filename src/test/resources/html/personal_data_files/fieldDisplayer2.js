/**
* @fileoverview fieldDisplayer2.js
* @description Contains all the functionalities for creating fields.
*      This fields can be read only or input fields, what the modules does is to decide what to
*      create from the information the programmer provides to the module, and implements few
*      functionalities like format check (for example in the case the field type is integer number
*      won't be possible to insert text)
*/

/**
* FieldDisplayerFactory will return a FieldDisplayer object according to the options given
* as an argument.
* @constructor
*/

var FieldDisplayerFactory = Class.create(origin,
/**
* @lends FielDisplayer
*/
{
/**
* It has a visual dependence in another field. (based on depend_type)
*/
DEPENDENCY_NEXT_TO: "X",
/**
* It has a visual and logic dependence in another field. (based on depend_type)
*/
DEPENDENCY_NEXT_TO_AND_LOGIC: "B",
/**
* It has a logic dependence in another field. (based on depend_type)
*/
DEPENDENCY_LOGIC: "",
/**
* Field type possible values.
*/
FIELD_TYPES: $H({
    A: "fieldTypeAutocompleter",
    B: "fieldTypeBubble",
    C: "fieldTypeCheckBox",
    D: "fieldTypeOutput",
    O: "fieldTypeOutput",
    V: "fieldTypeOutput",
    H: "fieldTypeHour",
    W: "fieldTypeHour", //This is with seconds
    I: "fieldTypeText",
    L: "fieldTypeLink",
    E: "fieldTypeLinkToHandler",
    M: "fieldTypeImage",
    P: "fieldTypeDate",
    R: "fieldTypeRadioButton",
    //S: "fieldTypeSelectBox",
    S: "fieldTypeAutocompleter",
    T: "fieldTypeTextArea",
	F: "fieldTypeCatalog",
	K: "fieldTypeTextArea"
}),
/**
* The input doesn't have a label (based on label_type)
*/
LABEL_TYPE_NO_LABEL: "N",
/**
* Use the label on field settings fieldlabel (based on label_type)
*/
LABEL_TYPE_USE_SETTINGS: "V",
/**
* Use the label coming with the service in the standard way ((based on label_type)
*/
LABEL_TYPE_USE_LABEL_TAG: "",
/**
* Create mode.
*/
MODE_CREATE: "create",
/**
* Display mode.
*/
MODE_DISPLAY: "display",
/**
* Edit mode.
*/
MODE_EDIT: "edit",
/**
* Show text only (based on show_text)
*/
SHOW_TEXT_ONLY_TEXT_X: "X",
/**
* Show text only (based on show_text)
*/
SHOW_TEXT_ONLY_TEXT_I: "I",
/**
* Show text and value (based on show_text)
*/
SHOW_TEXT_VALUE_AND_TEXT: "B",
/**
* Show value only (based on show_text)
*/
SHOW_TEXT_ONLY_VALUE: null,

initialize: function() {
},
/**
* Returns a fieldDisplayer according to the JSON given in the options
* @param {JSON} optionsJSON The options coming from the service in JSON format.
* @param {String} screen The screen reference.
* @param {String} record The record reference.
* @param {String} mode the mode for the field displayer.
*/
getFieldDisplayer: function(optionsJSON, screen, record, key_str, appid, mode, labels, fieldDisplayerModified, cssClasses, xml_in, handler, name, getFieldValueAppend, randomId, rowSeqnr, variant, FPObject, dateRanges) {
    var options = this._parseOptions(optionsJSON, screen, record, key_str, appid, mode, labels, fieldDisplayerModified, cssClasses, xml_in, handler, name, getFieldValueAppend, randomId, rowSeqnr, variant, FPObject, dateRanges);
    var className = options.fieldType;
	//Hardcoding to show a normal select in the field language of Personnal data 
	if(options.id=="SPRSL" && appid=="PD_DATA" && mode!="display"){
	   return new window["fieldTypeSelectBox"](options);	
	}
    return new window[className](options);
},
/**
* Takes the options in JSON format and convert them into a more easy readable format.
* @param {JSON} optionsJSON optionsJSON The options coming from the service in JSON format.
* @param {String} screen The screen reference.
* @param {String} record The record reference.
* @param {String} mode The operation mode
* @param {JSON|String} xml_in The xml_in which will be sent to the service. Can be both a JSON
* 						or a String.
* @return {JSON} the options parsed into an easily readable JSON object.
*/
_parseOptions: function(optionsJSON, screen, record, key_str, appid, mode, labels, fieldDisplayerModified, cssClasses, xml_in, handler, name, getFieldValueAppend, randomId, rowSeqnr, variant, FPObject, dateRanges) {
    this.labels = labels;
    if (!Object.isEmpty(optionsJSON.settings['visualOpt']))
        var visualOpt = optionsJSON.settings['visualOpt'];
    else
        var visualOpt = false;
    var options = {
        appId: appid,
        //cssClasses specific for this application, it overwrites the standard ones
        cssClasses: cssClasses,
        customXmlIn: xml_in,
        //data about the dependency, the field id and the dependency type.
        dependency: this._getDependency(optionsJSON),
        //get the template for the display format in the field displayer
        displayFormat: this._getDisplayFormat(optionsJSON, mode),
        //if defined, the fieldDisplayers will throw this event when changed
        fieldDisplayerModified: fieldDisplayerModified,
        //get the proper fieldType
        fieldType: this._getFieldType(optionsJSON),
        //if it's a hidden field or not
        hidden: this._getIsHidden(optionsJSON),
        //the id of the field
        id: optionsJSON.values["@fieldid"],
        //field format
        fieldFormat: optionsJSON.settings["@fieldformat"],
        keyStr: key_str,
        //the label to be shown for the field
        label: this._getLabel(optionsJSON),
        //if it's mandatory or not
        mandatory: this._getIsMandatory(optionsJSON),
        //the mode (create, edit or display
        mode: mode,
        objectType: this._getObjectType(FPObject),
        objectId: this._getObjectId(FPObject),
        //service_pai
        onChangeEvent: optionsJSON.settings["@service_pai"],
        //the JSON with the options. It will be updated with the user's interaction data.
        optionsJSON: optionsJSON,
        //if the field is output only or not
        outputOnly: this._getIsOutputOnly(optionsJSON),
        //the record (if any)
        record: record,
        //the screen (if any)
        screen: screen,
        //field techName (used to build dependencies)
        techName: optionsJSON.values["@fieldtechname"],
        //get the text and the value either from default_text/default_value on field settings
        //or the #text/value on field value
        text: this._getText(optionsJSON, screen, record, mode),
        value: this._getValue(optionsJSON, screen, record, mode),
        //service_values the service to the get the values list.
        valueListService: optionsJSON.settings["@service_values"],
        //field_type the field subtype
        type: optionsJSON.settings["@type"],
        //field handler (fieldTypeLinkToHandler)
        handler: handler,
        name: name,
        getFieldValueAppend: getFieldValueAppend,
        randomId: randomId,
        rowSeqnr: rowSeqnr,
        visualOpt: visualOpt,
        variant: variant,
        FPObject: FPObject,
        dateRanges: dateRanges,
        toolTip: this._getToolTip(optionsJSON, screen, FPObject)
    };
    
    return options;
},
/**
* Gets the dependency data according to options from the service.
* @param {JSON} optionsJSON optionsJSON The options coming from the service in JSON format.
* @return {JSON} The dependency data for this field displayer (from which field it depends and the type).
*/
_getDependency: function(optionsJSON) {
    var dependencyData;
    var dependType = optionsJSON.settings["@depend_type"];
    var dependField = optionsJSON.settings["@depend_field"];
    switch (dependType) {
        //only logic dependency is handled in field displayer.                  
        case this.DEPENDENCY_NEXT_TO:
            dependencyData = {
                type: '',
                field: ''
            };
            break;
        case this.DEPENDENCY_NEXT_TO_AND_LOGIC:
        case this.DEPENDENCY_LOGIC:
            dependencyData = {
                type: dependType,
                field: dependField
            };
            break;
        //if none of the previous, give empty data.                  
        default:
            dependencyData = {
                type: dependType,
                field: dependField
            };
            break;
    }

    return dependencyData;
},
/**
* Get the correct format to show text and value for a field
* @param {JSON} optionsJSON the options coming from the service in JSON format
* @return {Template} The template with the format for the field. This template will have
* 					  two fields: #{text} and #{value} which are self explained.
*/
_getDisplayFormat: function(optionsJSON, mode) {
    var template;
    var showText = optionsJSON.settings["@show_text"];
    switch (showText) {
        case this.SHOW_TEXT_ONLY_TEXT_I:
            if (optionsJSON.settings["@fieldid"] == "BETRG")
                template = new Template("#{value}");
            else
                template = new Template("#{text}");

            break;

        case this.SHOW_TEXT_ONLY_TEXT_X:
            template = new Template("#{text}");
            break;

        case this.SHOW_TEXT_ONLY_VALUE:
            //Fix to show the id correctly, in display mode we need "value" and in edit or create we need "data"
            if (mode == "display" || optionsJSON.settings["@display_attrib"] == "OUO" || (mode != "display" && optionsJSON.settings["@fieldformat"] == "V") || (mode != "display" && optionsJSON.settings["@fieldformat"] == "D")) {
                template = new Template("#{value}");
            } else {
                template = new Template("#{data}");
            }
            break;

        case this.SHOW_TEXT_VALUE_AND_TEXT:
        default:
            //Fix to show the id correctly, in display mode we need "value" and in edit or create we need "data"
            if (mode == "display" || optionsJSON.settings["@display_attrib"] == "OUO" || (mode != "display" && optionsJSON.settings["@fieldformat"] == "V") || (mode != "display" && optionsJSON.settings["@fieldformat"] == "D")) {
                template = new Template("#{text}" + " " + global.idSeparatorLeft + "#{value}" + global.idSeparatorRight);
            } else {
                template = new Template("#{text}" + " " + global.idSeparatorLeft + "#{data}" + global.idSeparatorRight);
            }
            break;
    }

    return template;
},
/**
* Gets the field type according to the options in optionsJSON.
* @param {JSON} optionsJSON the options coming from the service in JSON format.
* @return {String} the field type name.
*/
_getFieldType: function(optionsJSON, mode) {
    var type = optionsJSON.settings["@fieldformat"];
    if (optionsJSON.settings['@fieldid'] && optionsJSON.settings['@fieldid'].toLowerCase() == 'translation')
        return "fieldTypeHidden";
    //		if(this._getIsOutputOnly(optionsJSON) || mode == this.MODE_DISPLAY){
    if (this._getIsOutputOnly(optionsJSON)) {
        return "fieldTypeOutput";
    } else if (type && !this._getIsHidden(optionsJSON)) {
        type = this.FIELD_TYPES.get(type);
        if (!type) {
            throw "fieldformat is an unexistent type for field: " + optionsJSON.settings['@fieldid'];
        } else {
            return type;
        }
    } else if (!this._getIsHidden(optionsJSON)) {
        throw "fieldformat is empty for field: " + optionsJSON.settings['@fieldid'];
    } else {
        return "fieldTypeHidden";
    }
},
/**
* Get's if this is a hidden field or not
* @return {Boolean} true when it's hidden. False otherwise.
*/
_getIsHidden: function(optionsJSON) {
    var displayAttribute = optionsJSON.settings["@display_attrib"];
    if (displayAttribute == "HID" || displayAttribute == "HOU") {
        return true;
    } else {
        return false;
    }
},
/**
* Get's whether a field is mandatory to be filled or not.
* @param {JSON} optionsJSON optionsJSON The options coming from the service in JSON format.
* @return {Boolean} Whether the field is mandatory or not
*/
_getIsMandatory: function(optionsJSON) {
    var displayAttribute = optionsJSON.settings["@display_attrib"];
    if (displayAttribute == "MAN") {
        return true;
    } else {
        return false;
    }
},
/**
* Get's whether a field is output only or not.
* @param {JSON} optionsJSON optionsJSON The options coming from the service in JSON format.
* @return {Boolean} Whether the field is output only or not
*/
_getIsOutputOnly: function(optionsJSON) {
    var displayAttribute = optionsJSON.settings["@display_attrib"];
    var fieldFormat = optionsJSON.settings["@fieldformat"];
    //Checkboxes that are outout only should be treated as checkboxes, not output only
    if (displayAttribute == "OUO" && fieldFormat != "C") {
        return true;
    } else {
        return false;
    }
},
/**
* Gets the correct label from the optionsJSON according to the needed logic.
* @param {JSON} optionsJSON the options coming from the service in JSON format.
* @return {String} the label.
*/
_getLabel: function(optionsJSON) {

    var label;
    var labelType = optionsJSON.settings["@label_type"];
    switch (labelType) {
        case this.LABEL_TYPE_NO_LABEL:
            label = "";
            break;

        case this.LABEL_TYPE_USE_SETTINGS:
            label = optionsJSON.settings["@fieldlabel"];
            break;

        case this.LABEL_TYPE_USE_LABEL_TAG:
        default:
            //if there's no labels, return the fieldid.
            if (this.labels && this.labels.get(optionsJSON.values["@fieldid"])) {
                label = this.labels.get(optionsJSON.values["@fieldid"]);
            } else {
                label = global.getLabel(optionsJSON.values["@fieldid"]);
            }
            break;
    }

    return label;
},
/**
* Gets the object type, either from global or from the JSON options.
* @return {String} the object type.
*/
_getObjectType: function(FPObject) {
    //If a different objectType is defined we use it
    if (FPObject && !Object.isEmpty(FPObject.options.objectType))
        return FPObject.options.objectType;
		
	//Take population name from FP, if it doesnt' exists get it from global (slower)
	var population = "";
    if(FPObject && !Object.isEmpty(FPObject.options.population)){
		var population = FPObject.options.population;
	}else{
		var population = global.getPopulationName(global.currentApplication);
	}
    if (population == 'NOPOP') {
        return global.objectType;
    } else {
        return global.getEmployee(global.getSelectedEmployees().first()).type;
    }
},
/**
* Gets the object ID, from global. The object id is the id of the selected employee
* If we are in multiple selection, we will use the logged user
* @return {String} The object ID, global.objectId if there is no one selected.
*/
_getObjectId: function(FPObject) {
    //If a different objectType is defined we use it
    if (FPObject && !Object.isEmpty(FPObject.options.objectId))
        return FPObject.options.objectId;
    //If we are in multiple selection
    if (!Object.isEmpty(global.currentSelectionType) && global.currentSelectionType == "multi") {
        return global.objectId;
    } else {
        var selected = global.getSelectedEmployees();
        if (Object.isEmpty(selected)) {
            return global.objectId;
        }
        if (selected.size() == 0) {
            return global.objectId;
        }
        return selected[0];
    }
},
/**
* Gets the correct text for the field according to options from the service and the mode
* @param {JSON} optionsJSON optionsJSON The options coming from the service in JSON format.
* @param {String} screen The screen reference.
* @param {String} record The record reference.
* @param {String} mode The operation mode, can be
* @return {String} the correct field text.
*/
_getText: function(optionsJSON, screen, record, mode) {
    var text;
    switch (mode) {
        case this.MODE_CREATE:
            text = optionsJSON.settings["@default_text"];
            break;

        case this.MODE_EDIT:
        case this.MODE_DISPLAY:
        default:

            text = optionsJSON.values["#text"];

            break;
    }
    return text;
},
/**
* Gets the correct value for the field according to options from the service and the mode
* @param {JSON} optionsJSON optionsJSON The options coming from the service in JSON format.
* @param {String} screen The screen reference.
* @param {String} record The record reference.
* @param {String} mode The operation mode, can be
* @return {String} the correct field value.
*/
_getValue: function(optionsJSON, screen, record, mode) {
    var value;
    switch (mode) {
        case this.MODE_CREATE:
            if (!Object.isEmpty(optionsJSON.settings["@default_value"])) {
                if ((optionsJSON.settings['@type'] == "DEC" || optionsJSON.settings['@type'] == "CURR") && displayToLong(optionsJSON.settings["@default_value"]).toString() != "NaN") {
                    if (optionsJSON.settings["@default_value"].split('.')[1]) {
                        var decimalLong = parseInt(optionsJSON.settings["@decimals"], 10);
                        dispMode = longToDisplay(parseFloat(optionsJSON.settings["@default_value"], 10), decimalLong);
                    }
                    else {
                        dispMode = longToDisplay(parseFloat(optionsJSON.settings["@default_value"], 10));
                    }
                    value = dispMode;
                }
                else {
                    value = optionsJSON.settings["@default_value"];
                }
            }
            else {
                value = optionsJSON.settings["@default_value"];
            }
            break;

        case this.MODE_EDIT:
            if (!Object.isEmpty(optionsJSON.values["@value"])) {

                if ((optionsJSON.settings['@type'] == "DEC" || optionsJSON.settings['@type'] == "CURR") && displayToLong(optionsJSON.values["@value"]).toString() != "NaN") {
                    if (optionsJSON.values["@value"].split('.')[1]) {
                        var decimalLong = parseInt(optionsJSON.settings["@decimals"], 10);
                        dispMode = longToDisplay(parseFloat(optionsJSON.values["@value"], 10), decimalLong);
                    }
                    else {
                        dispMode = longToDisplay(parseFloat(optionsJSON.values["@value"], 10));
                    }
                    value = dispMode;
                }
                else {
                    value = optionsJSON.values["@value"];
                }
            }
            else {
                value = optionsJSON.values["@value"];
            }
            break;
        case this.MODE_DISPLAY:
        default:

            value = optionsJSON.values["@value"];

            break;
    }
    return value;
},
/**
* Gets the tooltip for this fieldDisplayer
*/
_getToolTip: function(optionsJSON, screen, FPObject) {
    if (global.liteVersion) {
        //TODO: label for screen and field
        var screenName = global.getLabel(FPObject.screensNavigationLayerData.get(screen).get("config")['@label_tag']);
        return (global.getLabel("Group") + ": " + global.getLabel(FPObject.appId) + ", " + "screen" + ": " + screenName + ", " + "field: " + this._getLabel(optionsJSON)).stripTags();
    }
    else {
        return null;
    }
},
/**
* This function gets the actual value selected on the field, it should be extended by each one of the types
* to get the value
* @return {String} The actual value on the field
*/
getText: function() {

},
/**
* This function gets the actual ID of the selected value on the field, It should be extended by each one of the type
* to get the proper ID
* @return {String} The actual ID selected on the field
*/
getValue: function() {

}
});

/**
* fieldDisplayer is a parent class for all the field displayer. It contains common code needed
* for all of them.
* @constructor
*/
var parentFieldDisplayer = Class.create(origin,
/**
* @lends fieldDisplayer
*/
{
DISPLAY_MODE: 'display',
/**
* It has a visual dependence in another field. (based on depend_type)
*/
DEPENDENCY_NEXT_TO: "X",
/**
* It has a visual and logic dependence in another field. (based on depend_type)
*/
DEPENDENCY_NEXT_TO_AND_LOGIC: "B",
/**
* It has a logic dependence in another field. (based on depend_type)
*/
DEPENDENCY_LOGIC: "",
/**
* It sets how the fieldDisplayer JSON has to be updated depending on its Class.
*/
jsonInsertion: $H({

    fieldTypeText: {
        text: '@value',
        id: null
    },
    fieldTypeAutocompleter: {
        text: '#text',
        id: '@value'
    },
    fieldTypeCheckBox: {
        id: '@value'
    },
    fieldTypeRadioButton: {
        id: '@value',
        text: null
    },
    fieldTypeSelectBox: {
        text: '#text',
        id: '@value',
        textNode: 'text'
    },
    fieldTypeHidden: {
        text: '#text',
        id: '@value'
    },
    fieldTypeOutput: {
        text: '#text',
        id: '@value'
    },
    fieldTypeTextArea: {
        text: '@value',
        id: null
    },
    fieldTypeDate: {
        text: '@value',
        id: '@value'
    },
    fieldTypeHour: {
        text: '@value',
        id: null
    },
    fieldTypeCatalog: {
        text: '@value',
        id: null
    }
}),
/**
* All the events and events being listened and it's handler functions.
* @type Hash
*/
_events: null,
/**
* The HTML Element object which contains the layout for this field displayer
* @type Element
*/
_element: null,
/**
* The Module instance used for the field displayer if any.
* @type Object
*/
_moduleInstance: null,
/**
* The html Element in which the  module will be inserted
*/
_moduleElement: null,
/**
* The html Element in which the label will be inserted
*/
_labelElement: null,
/**
* Hash in order to store the last value selected on every fieldDisplayer, since sometimes a field
* depends of another one of which onFieldChange event has been fired before because it is
* in the xml before.
* //TODO: REFACTOR: _lastValueSelected is no longer used. We should remove everywhere where it appears
*/
_lastValueSelected: $H(),
/**
* Indicates if the field has o hasn't got its value for the first time.
* This is useful to avoid calling paiEvents the first time the field is displayed.
*/
_firstTimeGettingValue: true,
/**
* Unique Id for every fieldDisplayer so that events do not get mixed
*/
_id: null,


initialize: function($super, options) {
    $super();
    this.options = options;
    this._id = Math.floor(Math.random() * 100000) + "";

    if ((options.mode != this.DISPLAY_MODE
    || options.fieldType == 'fieldTypeRadioButton'
    || options.fieldType == 'fieldTypeCheckBox'
    || options.fieldType == 'fieldTypeBubble'
    || options.fieldType == 'fieldTypeImage'
    || options.fieldType == 'fieldTypeLinkToHandler')
    && options.fieldType != 'fieldTypeOutput') {
        this._events = $H();
        this._setLayout();
        this._initializeModule();
        this._setOnChange();
        this._setHowToGetValue();
    } else {
        this._setLayoutDisplay();
    }
},
//METHODS TO DISPLAY THE OBJECT
//***********************************************************************************************************************************************
/**
* Prepare the layout for the field displayer
*/
_setLayoutDisplay: function() {
    if (this.options.hidden) {
        this._element = new Element("div").hide();
    } else {
        if (this.options.optionsJSON.settings['@depend_type'] == this.DEPENDENCY_NEXT_TO || this.options.optionsJSON.settings['@depend_type'] == this.DEPENDENCY_NEXT_TO_AND_LOGIC) {
            this._element = new Element("div", {
                "class": "gcm_dependantField gcm_displayMode"
            });
        } else {
            this._element = new Element("div", {
                "class": "gcm_field gcm_displayMode",
                "id": this.options.id + '_' + this.options.appId + '_' + this.options.screen + '_' + this.options.record
            });
        }

        var labelText = this.options.label == "" ? "&nbsp;" : prepareTextToShow(this.options.label);
        this._labelElement = new Element("div", {
            "class": "gcm_fieldLabel gcm_displayMode test_label",
            "id": "for_" + this.options.appId + '_' + this.options.screen + '_' + this.options.record + '_' + this.options.id, //This identifier is used for automation framework KL (Dummy Classes)
            "title": prepareTextToEdit(labelText)
        }).insert(labelText);

        //Making sure that HTML entities are encoded
        var text = this.options.text;
        if (this.options.fieldFormat == 'K')
            var content = prepareTextToShowCkeditor(this.options.displayFormat.evaluate({ text: text, value: this._formattedValue(this.options) }));
        else
            var content = prepareTextToShow(this.options.displayFormat.evaluate({ text: text, value: this._formattedValue(this.options) }));
        if (content)
            content = content.gsub('&lt;br/&gt;', '<br/>');
        if (Object.isEmpty(this.options.value)) {
            content = content.gsub(" " + global.idSeparatorLeft + global.idSeparatorRight, '');
        }
        if (content.startsWith(" " + global.idSeparatorLeft) && content.endsWith(global.idSeparatorRight))
            content = content.substring(2, content.length - 1);
        var toolTip = "";
        if (global.liteVersion && !Object.isEmpty(this.options.toolTip))
            toolTip = this.options.toolTip;
        this._moduleElement = new Element("div", {
            "class": "gcm_fieldValue gcm_displayMode test_text",
            "id": this.options.appId + '_' + this.options.screen + '_' + this.options.record + '_' + this.options.id,
            "title": toolTip
        }).insert(content);
        if (this._isTContent(this.options)) {
            this._moduleElement.addClassName("gcm_tcontentField");
        }
        // No label should be added if the field is a tcontent one
        //if (!this._isTContent(this.options))
        // Reverting revision 30759 if(this._labelElement){
        this._element.insert(this._labelElement);
        //}
        this._element.insert(this._moduleElement);
    }
},

/* 
* @method _isTContent
* @desc Checks if a field is a tcontent one
* @param options Field's options
* @return true if the field is a tcontent one, false otherwise
*/

_isTContent: function(options) {
    return !Object.isEmpty(options.optionsJSON.settings['@fieldsource'])
        && (options.optionsJSON.settings['@fieldsource'].toLowerCase() == 't');
},
/**
* Returns true if the field is not hidden
*/
isVisible: function() {
    return !this.options.hidden;
},

/* @method _formattedValue
* @desc Returns a formatted value according to its type
* @param Options JSON options
* @return The formatted value
*/

_formattedValue: function(options) {

    var hour;
    var min;

    if (!Object.isEmpty(options) && !Object.isEmpty(options.value)) {

        if (options.type == "TIMS") {
            if (options.value.include(':')) {
                var time = options.value.split(':');
                fValue = time[0] + ":" + time[1];
                return fValue;
            } else {
                hour = options.value.substring(0, 2);
                min = options.value.substring(2, 4);
                fValue = hour + ":" + min;
                return fValue;
            }
        }
        else {
            fValue = options.value;
        }
    }
    else
        fValue = "";

    //We encode and decode just in case we are receiving non-encoded characters such as & that would make IE not show it properly.
    return fValue.unescapeHTML().escapeHTML();

},

checkDate: function(options) {

    var dateOK = false;

    if ((options.objectType == 'D') || (options.fieldFormat == "P"))
        dateOK = true;

    return dateOK;
},
/**
* Prepare the layout for the field displayer
*/
_setLayout: function() {
    this.mandatoryIndicator = new Element('span', {
        'class': 'fieldDispMandatoryIndicator application_main_soft_text fieldDispFloatLeft test_text'
    });
    this.mandatoryIndicator.insert('*');
    if (this.options.outputOnly) {
        this._element = new Element("div", {
            "class": "fieldWrapDisplayMode fieldClearBoth fieldDispFloatLeft"
        });
        this._labelElement = new Element("div", {
            "class": "fieldCaption fieldDispHeight fieldDispLabel fieldDispFloatLeft fieldDispNoWrap application_main_soft_text test_label",
            "title": this.options.label
        });
    } else {
        if (this.options.optionsJSON.settings['@depend_type'] == this.DEPENDENCY_NEXT_TO || this.options.optionsJSON.settings['@depend_type'] == this.DEPENDENCY_NEXT_TO_AND_LOGIC) {
            this._element = new Element("div", {
                "class": "fieldWrap fieldDispFloatLeft __there"
            });
            // Reverting revision 30759 if(!Object.isEmpty(this.options.label)){ // For visual dependencies we only show the label if it's not empty
            this._labelElement = new Element("div", { // TO REFACTOR: this labelElement case is exactly the same as here above in the "this.options.outputOnly" case.
                "class": "fieldCaption fieldDispLabel fieldDispFloatLeft application_main_soft_text test_label",
                "title": this.options.label
            });
            //}
        } else {
            this._element = new Element("div", {
                "class": "fieldWrap fieldDispFloatLeft __here"/*test_text*/,
                "id": this.options.id + '_' + this.options.appId + '_' + this.options.screen + '_' + this.options.record
            });
            this._labelElement = new Element("div", {
                "class": "fieldCaption fieldDispMinHeight fieldDispLabel fieldDispFloatLeft application_main_soft_text test_label",
                "id": "for_" + this.options.appId + '_' + this.options.screen + '_' + this.options.record + '_' + this.options.id,
                "title": this.options.label
            });
        }
    }
    if ((this.options.mandatory && !this.options.visualOpt) && this.options.outputOnly) {
        this._labelElement.insert("  (*)");
    }
    if (this._labelElement) {
        var labelText = this.options.label == "" ? "&nbsp" : this.options.label;
        this._labelElement.insert(labelText);
    }
    this._moduleElement = new Element("div", {
        "class": "fieldDispFloatLeft fieldDispField"/*test_text*/,
        "id": this.options.appId + '_' + this.options.screen + '_' + this.options.record + '_' + this.options.id
    });
    if (this._labelElement)// && !this._isTContent(this.options))
        this._element.insert(this._labelElement);

    this._element.insert(this._moduleElement);
    if ((this.options.mandatory && !this.options.visualOpt) && !this.options.outputOnly) {
        this._element.insert(this.mandatoryIndicator);
    }
    else {
        this.mandatoryIndicator.update("&nbsp");
        this._element.insert(this.mandatoryIndicator);
    }
    if (this.options.optionsJSON.settings['@help_on_field'] == 'X') {
        this.mandatoryIndicator.addClassName('fieldDispMandatoryIndicatorWithQuestion');
        this.questionMark = new Element("div", {
            "class": "questionMark_icon FD_questionMark"
        });
        this._element.insert(this.questionMark);
        var content = new Element('div').insert(global.getLabel('loading..'));
        var fieldId = this.options.id;
        var balloons = $H();
        balloons.set(fieldId, { 'element': this.questionMark, 'balloon': content });
        if (!this.options.FPObject.balloonOnHoverGCM) {
            //Create the module
            this.options.FPObject.balloonOnHoverGCM = new balloonOnHover({
                'balloons': balloons
            });
        }
        else {
            //add a balloon
            var element = $H();
            element.set(fieldId, { 'element': this.questionMark, 'balloon': content });
            this.options.FPObject.balloonOnHoverGCM.addOHBalloon(element);
        }
        this.questionMark.observe('mouseover', function() {
            document.fire('EWS:helpOnField', { fieldId: this.options.id, widId: this.options.appId, screen: this.options.screen, htmlContent: content });
        } .bind(this));
    }
},
/**
* Initializes the module needed for the field displayer (if any).
* //REFACTOR: this function is no longer used (but it's used the one from the child Classes)
*/
_initializeModule: function() {

},

/**
* Gets the value to show for the field depending on its show_text attribute
*/
getValueToShow: function() {
    var showText = this.options.optionsJSON.settings['@show_text'];
    var wholeValue = this.getValue();
    if (!Object.isEmpty(wholeValue.id))
        var value = wholeValue.id.unescapeHTML();
    else
        var value = wholeValue.id;
    if (!Object.isEmpty(wholeValue.text))
        var text = wholeValue.text.unescapeHTML();
    else
        var text = wholeValue.text;
    if (!Object.isEmpty(value) && this._formattedValue)
        value = this._formattedValue(this.options);
    if (Object.isEmpty(showText))
        showText = "";
    else
        showText = showText.toLowerCase();
    switch (showText) {
        case "": return value;
        case "i": return text;
        case "x": return text;
        case "b":
            var valuePart = "";
            if (!Object.isEmpty(value))
                valuePart = " " + global.idSeparatorLeft + value + global.idSeparatorRight;
            if (Object.isEmpty(text))
                text = "";
            return (text + valuePart);
        default: return null;
    }
},
/**
* Gets the values of the field, if it has a service associated
*/
getFieldValues: function(firstTime) {
    //Just get the values if we're not in display mode, and the fieldType is one that actually can get the values
    //TODO: If there are fields that depend on a radio button or a check box?
    if (this.options.mode != "display" || this.options.fieldType == 'fieldTypeRadioButton' ||
		this.options.fieldType == 'fieldTypeCheckBox' || this.options.fieldType == 'fieldTypeBubble' ||
		this.options.fieldType == 'fieldTypeImage') {

        //If the field is going to ask for values and is not of a kind of fields that can't gent values:
        if ((this._getFieldValuesSuccess && this.options.valueListService && (this.options.fieldType != 'fieldTypeText') && (this.options.fieldType != 'fieldTypeOutput'))) {
            this._getFieldValues(this.getDependencyInfo(), null, firstTime);
        } else {
            //If the field is not going to ask for values, ask for the values of the fields that depend on it:
            this.getValuesDependantFields();
            this._firstTimeGettingValue = false; //Indicate that this is no longer its first time to get values
        }
    }
},


/**
* Function to get information about dependency: it's a hash that contains:
* - fieldid: the id of the field it depends on
* - fieldtechname: the techname of the field it depends on
* - value: the value of the field it depends on
* - nestedDep: this information, but about the field it depends on, called recursively
*
* This information is used to create the XML to look for values
*/
getDependencyInfo: function() {
    if (Object.isEmpty(this.parentField)) {
        return null;
    } else {
        var parentFieldDependency = this.parentField.getDependencyInfo();

        var dependencyInfo = $H({
            "fieldid": this.parentField.options.id,
            "fieldtechname": this.parentField.options.techName,
            "value": Object.isEmpty(this.parentField.getValue().id) ? "" : this.parentField.getValue().id.unescapeHTML().escapeHTML(),
            "nestedDep": parentFieldDependency
            //"text": this.parentField.options.text
        });
        if (!Object.isEmpty(this.parentField.options.optionsJSON.settings["@show_text"])) {
            dependencyInfo.set("text", this.parentField.getValue().text);
        }

        return dependencyInfo;
    }
},
/**
* Obtains the Element object ready to be inserted in any container.
* @return {Element} returns the Element object with the field displayer.
*/
getHtml: function() {
    return this._element;
},
/**
* Obtains the Element object ready to be inserted in any container, only the value part
* @return {Element} returns the Element object with the field displayer.
*/
getValueHtml: function() {
    return this._moduleElement;
},
/**
* Obtains the Element object ready to be inserted in any container, only the label part
* @return {Element} returns the Element object with the field displayer.
*/
getLabelHtml: function() {
    return this._labelElement;
},
//METHODS TO GET VALUES FROM SAP
//***********************************************************************************************************************************************
/**
* Makes a request to the service specified in options to get the values for the field.
* @param {Object} event
* @param {Object} xmlin If we want to use a different xmlin than the default
*/
_getFieldValues: function(depFieldInfo, xmlin, firstTime) {
    if (Object.isEmpty(xmlin)) {
        //If we didn't set an alternative xmlin
        this.makeAJAXrequest($H({
            xml: this._getXMLIn(depFieldInfo),
            successMethod: this._getFieldValuesSuccess.bind(this, firstTime)
        }));


    } else {
        //If we set an alternative xmlin
        this.makeAJAXrequest($H({
            xml: xmlin,
            successMethod: this._getFieldValuesSuccess.bind(this, firstTime)
        }));
    }
},
/**
* It handles the success response from the request made in _getFieldValues method.
* @param {JSON} response the response from the service.
*/
_getFieldValuesSuccess: function() {
    if (this.options.cssClasses && Object.isHash(this.options.cssClasses)) {
        this.options.cssClasses.each(function(cssClass) {
            var a = 0;
            this._element.descendants().each(function(element) {
                if (element.hasClassName(cssClass.key)) {
                    element.removeClassName(cssClass.key);
                    element.addClassName(cssClass.value);
                }
            } .bind(this));
        } .bind(this));
    }
},
/**
* It generates the XML needed to make a request to a service to get the value list for
* the field displayer
* @param {String} dependencyField the field on which this one depends' id
* @return {String} The String with the XML to make a request to the service.
*/
_getXMLIn: function(depFieldsInfo) {
    var depFields = "";
    var depField = "";
    if (!Object.isEmpty(depFieldsInfo)) {
        var text = !Object.isEmpty(depFieldsInfo.get('text')) ? depFieldsInfo.get('text') : null;
        if (Object.isEmpty(text)) {
            text = '"/>';
        }
        else {
            text = '">' + text.unescapeHTML().escapeHTML() + '</FIELD>';
        }
        depFields = '<FIELD FIELDID="' + depFieldsInfo.get('fieldid') + '" FIELDTECHNAME="' + depFieldsInfo.get('fieldtechname') + '" VALUE="' + prepareTextToSend(depFieldsInfo.get('value')) + text;
        while (depFieldsInfo.get('nestedDep')) {
            var text = !Object.isEmpty(depFieldsInfo.get('nestedDep').get('text')) ? depFieldsInfo.get('nestedDep').get('text') : null;
            if (Object.isEmpty(text)) {
                text = '"/>';
            }
            else {
                text = '">' + text.unescapeHTML().escapeHTML() + '</FIELD>';
            }
            depFields += '<FIELD FIELDID="' + depFieldsInfo.get('nestedDep').get('fieldid') + '" FIELDTECHNAME="' + depFieldsInfo.get('nestedDep').get('fieldtechname') + '" VALUE="' + depFieldsInfo.get('nestedDep').get('value') + text;
            depFieldsInfo = depFieldsInfo.get('nestedDep');
        }
    }
    //build the service request if there's not a customized one
    if (!this.options.customXmlIn || !this.options.customXmlIn.get(this.options.id)) {
        //Check if we have something to add to the XML
        var xmlToAppend = "";
        if (!Object.isEmpty(this.options.getFieldValueAppend)) {
            xmlToAppend = this.options.getFieldValueAppend;
        }

        var oType = !Object.isEmpty(this.options.objectType) ? this.options.objectType : "";
        var oId = !Object.isEmpty(this.options.objectId) ? this.options.objectId : "";
        var appId = !Object.isEmpty(this.options.appId) ? this.options.appId : "";
        var strKey = !Object.isEmpty(this.options.keyStr) ? this.options.keyStr.escapeHTML() : "";
        var screenId = !Object.isEmpty(this.options.screen) ? this.options.screen : "";
        var value = this.getValue();
        var valueToSend = "";
        if (value.id) {
            valueToSend = prepareTextToSend(value.id);
        }
        var textToSend = "";
        if (value.text) {
            textToSend = value.text.unescapeHTML().escapeHTML();
        }
        var fieldPart = '<FIELD FIELDID="' + this.options.id + '" FIELDTECHNAME="' + this.options.techName + '" VALUE="' + valueToSend + '">' + textToSend + '</FIELD>';
        var jsonIn = '<EWS>' +
            '<SERVICE>' + this.options.valueListService + '</SERVICE>' +
            '<OBJECT TYPE="' + oType + '">' + oId + '</OBJECT>' +
            '<PARAM>' +
            '<APPID>' + appId + '</APPID>' +
            '<WID_SCREEN>' + screenId + '</WID_SCREEN>' +
            '<STR_KEY>' + strKey + '</STR_KEY>' +
            fieldPart +
            '<DEP_FIELDS>' +
            depFields +
            '</DEP_FIELDS>' +
            '<SEARCH_PATTERN />' +
			xmlToAppend +
            '</PARAM>' +
            '</EWS>';

        return jsonIn;
    }
    //use the customized request to the service according to its format
    else if (Object.isString(this.options.customXmlIn)) {
        return this.options.customXmlIn;
    } else {
        if (Object.isString(this.options.customXmlIn.get(this.options.id)))
            return this.options.customXmlIn.get(this.options.id);
        else
            return json2xml.writeXML(this.options.customXmlIn.get(this.options.id));
    }
},
//METHODS TO MODIFY AND HANDLE JSON INTERACTION
//***********************************************************************************************************************************************
/**
* It updates the fieldDisplayer related piece of JSON.
* @param {Object (id:'string',text:'string')} The values to be inserted.
*/
updateJSON: function(val) {
    var changed = false;
    switch (this.options.optionsJSON.settings['@show_text']) {
        case 'I':
        case 'B':
            //saving both
            if (!Object.isEmpty(this.jsonInsertion.get(this.options.fieldType).id)) {
                if (this.options.optionsJSON.values[this.jsonInsertion.get(this.options.fieldType).id] != val.id) {
                    //If both are null, then it should not change the value, and should not mark as "changed"
                    if (!Object.isEmpty(this.options.optionsJSON.values[this.jsonInsertion.get(this.options.fieldType).id]) || !Object.isEmpty(val.id)) {
                        this.options.optionsJSON.values[this.jsonInsertion.get(this.options.fieldType).id] = val.id;
                        changed = true;
                    }
                }
            }
            if (!Object.isEmpty(this.jsonInsertion.get(this.options.fieldType).text)) {
                if (this.options.optionsJSON.values[this.jsonInsertion.get(this.options.fieldType).text] != val.text) {
                    //If both are null, then it should not change the text, and should not mark as "changed"
                    if (!Object.isEmpty(this.options.optionsJSON.values[this.jsonInsertion.get(this.options.fieldType).text]) || !Object.isEmpty(val.text)) {
                        this.options.optionsJSON.values[this.jsonInsertion.get(this.options.fieldType).text] = val.text;
                        changed = true;
                    }
                }
            }
            break;
        case 'X':
            //saving text
            if (this.options.optionsJSON.values['#text'] != val.text) {
                //If both are null, then it should not change the text, and should not mark as "changed"
                if (!Object.isEmpty(this.options.optionsJSON.values['#text']) || !Object.isEmpty(val.text)) {
                    this.options.optionsJSON.values['#text'] = val.text;
                    changed = true;
                }
            }
            break;
        default:
            //When it's a decimal number, or a currency number we make sure the format is correct:
            if (!Object.isEmpty(val.id)) {
                if ((this.options.type == "DEC" || this.options.type == "CURR") && displayToLong(val.id).toString() != "NaN") {
                    val.id = val.id.gsub(global.thousandsSeparator, '').gsub(global.millionsSeparator, '').gsub(global.commaSeparator, '.');
                }
            }
            //saving value
            if (this.options.optionsJSON.values['@value'] != val.id) {
                //If there is a date picker that is non-mandatory, and has 00-00-0000 as value, we should keep this value instead of using ""
                if (this.options.fieldType == "fieldTypeDate" &&
                    (Object.isEmpty(this.options.optionsJSON.settings['@display_attrib']) || this.options.optionsJSON.settings['@display_attrib'] != "MAN")
                    && (this.options.optionsJSON.settings['@default_value'] == global.nullDate) && val.id == "") {
                    this.options.optionsJSON.values['@value'] = global.nullDate;
                } else {
                    //If both are null, then it should not change the value, and should not mark as "changed"
                    if (!Object.isEmpty(this.options.optionsJSON.values['@value']) || !Object.isEmpty(val.id)) {
                        this.options.optionsJSON.values['@value'] = val.id;
                        changed = true;
                    }
                }
            }
    }
    return changed;
},
_setOnChange: function(element, event) {
    if (Object.isEmpty(event)) event = 'change';
    if (!Object.isEmpty(element)) {
        if (Object.isElement(element)) {
            this._registerEvent(event, this._onFieldChange.bind(this, true), element);
        } else if (Object.isString(element)) {
            this._registerEvent(element, this._onFieldChange.bind(this, true));
        }
    } else {
        this._registerEvent(event, this._onFieldChange.bind(this, true), this._element);
    }
},
getValue: function() {
    return {
        id: this.idGetter(),
        text: this.textGetter()
    };
},

/**
* Sets the value for a field.
* @param {Object} value
* @param {Object} text
*/
setValue: function(value, text) {
    this.updateJSON({ id: value, text: text });
},
_setHowToGetValue: function(param) {
    if (!Object.isEmpty(param)) {
        var showText = this.options.optionsJSON.settings['@show_text'];
        if (Object.isEmpty(showText) || (showText == 'B') || (showText == 'I'))
            this.idGetter = param.id;
        if ((showText == 'B') || (showText == 'I') || (showText == 'X'))
            this.textGetter = param.text;
    }
},
idGetter: function() {
    return this.options.value;
},
textGetter: function() {
    return this.options.text;
},

//METHODS TO HANDLE EVENT INTERACTION
//***********************************************************************************************************************************************
/**
* It catches the field changed event.
* @param {Object} throwPaiEvent
* @param {Object} forceChanged
*/
_onFieldChange: function(throwPaiEvent, forceChanged) {
    if (Object.isEmpty(forceChanged) || (typeof forceChanged) != "boolean") {
        forceChanged = false;
    }
    var value = this.getValue();
    var changed = this.updateJSON(value);
    //Fix to avoid calling SAP when it's not neccesary
    if (!changed && !forceChanged) {
        //If it's the first time, but the value doesn't change, we make sure it counts as first time grtting value:
        this._firstTimeGettingValue = false;
        return;
    }
    if (throwPaiEvent && !Object.isEmpty(this.options.optionsJSON.settings['@service_pai'])) {
        var obj = {
            appId: this.options.appId,
            screen: this.options.screen,
            record: this.options.record,
            mode: this.options.mode,
            servicePai: this.options.optionsJSON.settings['@service_pai'],
            currentValue: value,
            fieldId: this.options.id,
            techName: this.options.techName
        };
        if (changed && !this._firstTimeGettingValue) {
            global.focusFieldID = {
                appId: this.options.appId,
                screen: this.options.screen,
                mode: this.options.mode,
                id: this.options.id,
                record: this.options.record
            };
            //If the field is inside a tContent, a different pai will be fired.
            if (this._isTContent(this.options)) {
                obj.rowSeqnr = this.options.rowSeqnr;
                document.fire('EWS:getContentModule_tContentPaiEvent_' + this.options.appId + this.options.name + this.options.randomId, obj);
            } else {
                //We control that there aren't 2 PAI events at the same time.
                if (Object.isEmpty(this.options.FPObject.paiAlreadyFired)) {
                    document.fire('EWS:getContentModule_paiEvent_' + this.options.appId + this.options.name + this.options.randomId, obj);
                    this.options.FPObject.paiAlreadyFired = true;
                }
            }
        }
    }
    if (!this._checkValidFormat()) {
        //If a field belongs a translation screen dont show the error message, due to the field could be filled in other screen.
        if (!this.isTranslationField() && !this._firstTimeGettingValue) {
            this.setInvalid();
        }
    } else {
        this.setValid();
    }
    if (this.options.fieldDisplayerModified && changed)
        document.fire(this.options.fieldDisplayerModified, { field: this, value: value, first: this._firstTimeGettingValue, screen: this.options.screen, record: this.options.record, fieldName: this.options.id, type: this.options.fieldType });

    if (this.options.variant && !Object.isEmpty(this.options.variant.get(this.options.appId + '_' + this.options.screen))) {
        if (this._isTContent(this.options)) {
            if (this.options.variant.get(this.options.appId + '_' + this.options.screen).tvariantId == this.options.id && changed && !this._firstTimeGettingValue) {
                this.manageVariant(value, true, this.options.rowSeqnr);
            }
        } else {
            if (this.options.variant.get(this.options.appId + '_' + this.options.screen).variantId == this.options.id && changed && !this._firstTimeGettingValue && Object.isEmpty(this.options.FPObject.paiAlreadyFired)) {
                this.manageVariant(value, false);
            }
        }
    }

    this._firstTimeGettingValue = false; //Indicate that this is no longer its first time to get values

    //If the field is a DatePicker and it contains a wrong date, then we should not refresh the dependant fields
    if (Object.isEmpty(this.correctDate) || (!Object.isEmpty(this.correctDate) && this.correctDate)) {
        //If we have already fired a PAI, do not get the values for dependant fields
        if (!this.options.FPObject.paiAlreadyFired) {
            this.getValuesDependantFields();
        }
    }
    if (!Object.isEmpty(this.options.optionsJSON.settings['@refresh']))
        this.setRecharge(value);

},
/* 
* FUNCTION that return if the field belongs to an TRANSLATION screen
*/
isTranslationField: function() {
    if (!Object.isEmpty(this.options.FPObject.fieldDisplayers)) {
        var field = this.options.FPObject.fieldDisplayers.get(this.options.appId + this.options.mode + this.options.screen + this.options.record)
        if (!Object.isEmpty(field)) {
            var isTranslation = field.get("TRANSLATION");
            if (!Object.isEmpty(isTranslation)) {
                return true;
            }
            return false;
        }
        else {
            return false;
        }
    }
},

/**
* Handles the change of values in a variant field
* @param {Object} value 
* @param {boolean} isTContent true if the field inside a tContent table 
*/
manageVariant: function(value, isTContent, rowSeqnr) {
    if (isTContent) {
        var type = this.options.variant.get(this.options.appId + '_' + this.options.screen).tvariantType;
    } else {
        var type = this.options.variant.get(this.options.appId + '_' + this.options.screen).variantType;
    }
    if (type == 'S') {
        //document.fire('EWS:variantS_' + this.options.appId, { 'variant': this.options.variant, objType: this.options.objectType, objId: this.options.objectId, record: this.options.record, screen: this.options.screen, keyStr: this.options.keyStr });
        this.options.FPObject.manageVariantService({ 'variant': this.options.variant, objType: this.options.objectType, objId: this.options.objectId, record: this.options.record, screen: this.options.screen, keyStr: this.options.keyStr, mode: this.options.mode, fieldId: this.options.id, isTContent: isTContent, rowSeqnr: rowSeqnr });
    }
    else if (type == 'F') {
        var value = value.id;
        this.options.FPObject.manageVariantValue(this.options.record, this.options.screen, this.options.mode, this.options.keyStr, value, isTContent, rowSeqnr, this.options.id, null);
    }
},

setRecharge: function(value) {
    var oldValue = this.options.value;
    var oldText = this.options.text;
    var selectedEmployee = global.getSelectedEmployees().first();
    var loggedEmployee = global.objectId;
    var userLanguage = global.userLanguage;
    if (((oldText != value.text) || (oldValue != value.id)) && (selectedEmployee == loggedEmployee) && (userLanguage == '2'))
        global.reloadEWS = true;
    else
        global.reloadEWS = false;
},
/**
* Calls to getFieldValues for all the fields that depend on it.
*/
getValuesDependantFields: function() {
    //Loop through the dependant fields, calling getFieldValues for them
    if (!Object.isEmpty(this.dependantFields)) {
        var dependantFieldsKeys = this.dependantFields.keys();
        for (var i = 0; i < dependantFieldsKeys.size(); i++) {
            //is not an autocompleter or selectbox
            if (this.dependantFields.get(dependantFieldsKeys[i]).options.fieldFormat != 'A' && this.dependantFields.get(dependantFieldsKeys[i]).options.fieldFormat != 'S') {
                this.dependantFields.get(dependantFieldsKeys[i]).options.updateValue = true;
                this.dependantFields.get(dependantFieldsKeys[i]).getFieldValues();
            }
            else {
                if (!Object.isEmpty(this.dependantFields.get(dependantFieldsKeys[i])._moduleInstance) && !Object.isEmpty(this._moduleInstance) && this.dependantFields.get(dependantFieldsKeys[i])._moduleInstance.enabled) {
                    this.dependantFields.get(dependantFieldsKeys[i]).notClicked = false;
                    this.dependantFields.get(dependantFieldsKeys[i]).setParentField(this.dependantFields.get(dependantFieldsKeys[i]).parentField);
                    this.dependantFields.get(dependantFieldsKeys[i])._moduleInstance.resetAutocompleter();
                }
            }
        }
    }
},

/**
* Observes the given event on an element. If no element is given the event is observed on document.
* @param {String} eventName the name of the event to be observed.
* @param {Function} handler the handler function.
* @param {Element} (Optional) The Element object which will listen to the event. Will use document if it's not specified
*/
_registerEvent: function(eventName, handler, element) {
    //if the element isn't specified we take document
    if (Object.isUndefined(element)) {
        //observe the event
        document.observe(eventName, handler);
        //and store it
        this._events.set(eventName, {
            handler: handler,
            element: document
        });
    }
    //if specified we take the element given as argument
    else {
        element.observe(eventName, handler);
        this._events.set(eventName, {
            handler: handler,
            element: element
        });
    }
},
/**
* Stop observing all the events which're being listened by this field displayer.
*/
_stopObserve: function() {
    if (this._events)
        this._events.each(function(event) {
            var element = event.value.element;
            var handler = event.value.handler;
            var eventName = event.key;
            element.stopObserving(eventName, handler);
        });

    this._events = $H();
},
//GENERAL METHODS
//***********************************************************************************************************************************************
setInvalid: function(messageDiv) {
    //temporal invalid style
    this._element.addClassName('fieldError');
    if (!Object.isEmpty(messageDiv))
        messageDiv.show();
    else if ($('errorDiv_' + this.options.id + this.options.appId + this.options.screen + this.options.record))
        $('errorDiv_' + this.options.id + this.options.appId + this.options.screen + this.options.record).show();
},
setValid: function(messageDiv) {
    //temporal valid style
    this._element.removeClassName('fieldError');
    if (!Object.isEmpty(messageDiv))
        messageDiv.hide();
    else if ($('errorDiv_' + this.options.id + this.options.appId + this.options.screen + this.options.record))
        $('errorDiv_' + this.options.id + this.options.appId + this.options.screen + this.options.record).hide();

},
setDisabled: function() {
    this.disabled = true;
    var elementsToDisabled = this._element.select("input,textarea,button");
    for (var i = 0; i < elementsToDisabled.length; i++) {
        Form.Element.disable(elementsToDisabled[i]);
    }

},
setEnabled: function() {
    this.disabled = false;
    var elementsToEnabled = this._element.select("input,textarea,button");
    for (var i = 0; i < elementsToEnabled.length; i++) {
        Form.Element.enable(elementsToEnabled[i]);
    }
},
/**
* Puts focus on the fieldDisplayer
* Should be overriden for fieldDisplayers that need to implement it
*/
setFocus: function() {
},
/**
* Checks if this field has valid values according to the options.
* @returns Boolean true when valid format, false otherwise.
*/
_checkValidFormat: function() {
    return Prototype.emptyFunction();
},
/**
* Destroys a field displayer by stopObserving all its events and removing its container.
*/
destroy: function(html) {
    this._stopObserve();
    if (Object.isEmpty(html)) {
        if (this._element && this._element.parentNode) {
            this._element.remove();
            delete this._element;
            this._events = null;
            this._labelElement = null;
            this._lastValueSelected = null;
            this._moduleElement = null;
            this.dependantFields = null;
            this.jsonInsertion = null;
            this.labels = null;
            this.languagesFail = null;
            this.options = null;
            this.parentField = null;
        }
    }
    else {
        if (!Object.isEmpty(this._element) && !Object.isEmpty(this._element.parentNode) && Object.isElement(this._element.parentNode)) {
            this._element.insert({
                before: html
            });
            this._element.remove();
            //We recover the height of the div, now it isn't hidden. See getHtmlSubModulesLayer (Height:0px); 1054619
            if (html.parentNode && html.parentNode.getStyle("height") != "" && html.parentNode.getStyle("height") == "0px") {
                html.parentNode.setStyle("height:auto");
            }
        }
    }
},
/**
* Test the validity of a field displayer data.
* @return {Boolean} true when valid, false if it's not valid.
*/
isValid: function() {
    return this._checkValidFormat();
},

/**
* Sets the fields that depend on that field (only logical dependence)
* @param {Object} dependantField
*/
setDependantFields: function(dependantField) {
    this.dependantFields = dependantField;
},

/**
* Sets the field that this field depends on
* @param {Object} parentField
*/
setParentField: function(parentField) {
    this.parentField = parentField;
}

});

/**
* fieldTypeAutocompleter will return a FieldDisplayer object representing an autocompleter.
* @constructor
* @augments FieldDisplayer
*/
var fieldTypeAutocompleter = Class.create(parentFieldDisplayer,
/**
* @lends fieldTypeAutocompleter
*/
{
initialize: function($super, options) {
    if (Object.isEmpty(options.valueListService)) {
        //setting 'get_field_val' as default service, since all the selectboxes need one service
        options.valueListService = "GET_FIELD_VAL";
    }
    $super(options);
},
/**
* Takes the values for the autocompleter from the service.
*/
_getFieldValuesSuccess: function($super, firstTime, response) {
    //If the field displayer no longer exists:
    if(Object.isEmpty(this.options)){
        this.destroy();
        return;
    }
    var valuesList = {
        autocompleter: {
            object: $A()
        }
    };
    this._moduleInstance.clearInput();
    if (response.EWS.o_values) {
        objectToArray(response.EWS.o_values.item).each(function(item) {
            valuesList.autocompleter.object.push({
                "data": item["@id"],
                "text": item["@value"]
            });
        } .bind(this));
    }
    this._moduleInstance.updateInput(valuesList, true);
    //We check if is there some option with "null" id.
    for (var i = 0; i < valuesList.autocompleter.object.length; i++) {
        if (Object.isEmpty(valuesList.autocompleter.object[i].data)){
            var existsNullId = true;
        }
    }
    if( existsNullId ){
        this._moduleInstance.setDefaultValue(this.options.value, false, false);
        if (Object.isEmpty(this.options.onChangeEvent) || this._firstTimeGettingValue || this.options.updateValue) {//in order to avoid that an autocompleter will block the page refreshing the page without end.
            this.options.updateValue = false;
            this._onFieldChange(true, false);
        }
    }
    else { 
    if (!Object.isEmpty(this.options.value)) {
        this._moduleInstance.setDefaultValue(this.options.value, false, false);
        if (Object.isEmpty(this.options.onChangeEvent) || this._firstTimeGettingValue || this.options.updateValue) {//in order to avoid that an autocompleter will block the page refreshing the page without end.
            this.options.updateValue = false;
                this._onFieldChange(true, false);
        }
    }
    else {
        if (!Object.isEmpty(this.options.text)) {
            this._moduleInstance.setDefaultValue(this.options.text, true, false);
            if (Object.isEmpty(this.options.onChangeEvent) || this._firstTimeGettingValue || this.options.updateValue) {//in order to avoid that an autocompleter will block the page refreshing the page without end.
                this.options.updateValue = false;
                    this._onFieldChange(true, false);
            }
        }
        else {
            //if (this._firstTimeGettingValue)
                this._onFieldChange(true, false);
            }
        }
    }
    this._moduleInstance.stopLoading();
    //If the response does not include all the results, then the autocompleter has to call the service for future searches
    if(response.EWS.o_max_num_exceeded == 'X') {
        this._moduleInstance.setSearchWithService(true, parseInt(response.EWS.o_records_found,10));
        //Setting the XML for the autocompleter that is to be sent to backend for searches
        var xmlin = this._getXMLIn(this.getDependencyInfo());
        this._moduleInstance.setXmlToSend(xmlin);
    }
    else
        this._moduleInstance.setSearchWithService(false);
    //method commented, since it deletes the values of all the autompleters in the json when
    //ANY interaction with the user is done
    //this._onFieldChange(false);
    this.setValid();
    $super(response);
    if(this.needsFocus) {
        if(!Object.isEmpty(this._moduleInstance) &&
           !Object.isEmpty(this._moduleInstance.element)) {
            this._moduleInstance.element.focus();
            if (Prototype.Browser.IE) {
                this._moduleInstance.element.focus();
            }
        }
        this.needsFocus = false;
    }
    if (firstTime)
        this._moduleInstance.openList.bind(this._moduleInstance).call();
},
/**
* Initializes the autocompleter
*/
_initializeModule: function($super) {
    var json = {
        autocompleter: {
            object: [{ data: this.options.value, text: this.options.text}]
        }
    };
	var toolTip = "";
    if(!Object.isEmpty(this.options.toolTip))
       toolTip = this.options.toolTip;
    //Setting the XML for the autocompleter that is to be sent to backend for searches
    var xmlin = this._getXMLIn(this.getDependencyInfo());
    var length = parseInt(this.options.optionsJSON.settings['@length'], 10)
    if (length < 3 && this.options.optionsJSON.settings['@show_text'] == 'B')
        var callAfter = 1;
    else {
        var callAfter = 3;
    }
    this._moduleInstance = new JSONAutocompleter(this._moduleElement, {
        showEverythingOnButtonClick: true,
        fireEventWhenDefaultValueSet: true,
        xmlToSend: xmlin,
        searchWithService: true,
        url: this.url,
        method: this.method,
        minChars: callAfter,
        timeout: 500,
        templateResult: this.options.displayFormat.template,
        templateOptionsList: this.options.displayFormat.template,
        maxShown: 5,
        virtualVariables: true,
        addDinamicContent: true,
        addDinamicContentFunction: this.fillList.bind(this),
		tooltip: toolTip,
        events: $H({
            onResultSelected: 'EWS:autocompleter_resultSelected_' + this.options.id + this.options.appId + this.options.screen + this.options.record + this.options.randomId,
            onDataLoaded: 'EWS:autocompleter_dataLoaded_' + this.options.id + this.options.appId + this.options.screen + this.options.record + this.options.randomId
        })
    }, json);
    this._moduleInstance.loading();
    if (!Object.isEmpty(this.options.value) || !Object.isEmpty(prepareTextToShow(this.options.text)))
        this.setValue(this.options.value, prepareTextToShow(this.options.text));
    this._onFieldChange(true, false);
    $super();
    this._moduleInstance.stopLoading.bind(this._moduleInstance).delay(1);
},
fillList: function() {
    this.getFieldValues(true);
},
_setOnChange: function($super) {
    $super('EWS:autocompleter_resultSelected_' + this.options.id + this.options.appId + this.options.screen + this.options.record + this.options.randomId);
},
//In order to take into account the current value of the autocompleter, we add default tags to the XML
_getFieldValues: function($super, depFieldInfo, xmlin, firstTime) {
    if((!Object.isEmpty(this.options.text) || !Object.isEmpty(this.options.value))) {
        var search = '';
        if(!Object.isEmpty(this.options.value))
            search = search + "<DEFAULT_VALUE>" + this.options.value.unescapeHTML().escapeHTML() + "</DEFAULT_VALUE>";
        if(!Object.isEmpty(this.options.text))
            search = search + "<DEFAULT_TEXT>" + this.options.text.unescapeHTML().escapeHTML() + "</DEFAULT_TEXT>";
        if(Object.isEmpty(xmlin))
            xmlin = this._getXMLIn(depFieldInfo);
        var xml = xmlin.replace('<SEARCH_PATTERN />', search + '<SEARCH_PATTERN />');
        $super(depFieldInfo, xml, firstTime);
    } else {
        $super(depFieldInfo, xmlin, firstTime);
    }
},
_setHowToGetValue: function($super) {
    obj =
        {
            id: function() {
                if (!Object.isEmpty(this._moduleInstance.getValue()))
                    return this._moduleInstance.getValue().idAdded.unescapeHTML();
                else
                    return '';

            } .bind(this),
            text: function() {
                if (!Object.isEmpty(this._moduleInstance.getValue()))
                    return unescape(this._moduleInstance.getValue().textAdded);
                else
                    return '';
            } .bind(this)
        }
    $super(obj);
},
setFocus: function() {
    this.needsFocus = true;
    if(!Object.isEmpty(this._moduleInstance) &&
       !Object.isEmpty(this._moduleInstance.element) &&
       this._moduleInstance.enabled) {
        this._moduleInstance.element.focus();
        if (Prototype.Browser.IE) {
            this._moduleInstance.element.focus();
        }
    }
},
/**
* @description Checks the field format
* @param $super
*            Parent function
*/
_checkValidFormat: function($super) {
    if (this.options.mandatory && this._moduleInstance && (Object.isEmpty(this._moduleInstance.getValue()) || this._moduleInstance.getValue().isEmpty) && !this.options.visualOpt)
        return false;
    else
        return true;
},
/**
 * Sets the value for a field.
 * @param {Object} value
 * @param {Object} text
 */
setValue: function($super, value, text){
    //TODO:
	var showText = this.options.optionsJSON.settings['@show_text'];
	if(Object.isEmpty(showText) || showText=="B"){
		var valueToSet = value;
		var isText = false;
	}else{
		var valueToSet = text;
		var isText = true;
	}
    this._moduleInstance.setDefaultValue(valueToSet, isText, true, false);
},
/**
* Sets the field that this field depends on
* @param {Object} parentField
*/
setParentField: function($super,parentField) {
    $super(parentField);
    //Update XMl of module
    if(this._moduleInstance){
        var xmlin = this._getXMLIn(this.getDependencyInfo());
        this._moduleInstance.setXmlToSend(xmlin);
    }
}
});

/**
* fieldTypeBubble will return a FieldDisplayer object representing a color bubble.
* @constructor
* @augments FieldDisplayer
*/

var fieldTypeBubble = Class.create(parentFieldDisplayer,
/**
* @lends fieldTypeBubble
*/
{
/**
* Indexes the icon types according to the value given in the service
* @type Array
*/
ICON_TYPES: $A([
        "application_emptyBubble",
        "application_icon_red test_icon",
        "application_icon_orange test_icon",
        "application_icon_green test_icon"
        ]),

initialize: function($super, options) {
    $super(options);
},

/**
* Gets the class for the bubble icon from the icon types Array.
* @return {String} The class name if the value is correct. An empty String otherwise.
*/
_getBubbleClass: function() {
    var value = parseInt(this.options.value, 10);
    //Make sure the value is in the icons classes Array
    if (value >= this.ICON_TYPES.size()) {
        return "";
    }
    //return the class from the icons classes array
    else {
        return this.ICON_TYPES[value];
    }
},
/**
* Sets the bubble layout by using the original field displayer layout
* and giving it the proper class name
*/
_initializeModule: function($super) {
    this._moduleElement.addClassName(this._getBubbleClass);
    $super();
},
_checkValidFormat: function($super) {
    return true;
}
});

/**
* fieldTypecheckBox will return a FieldDisplayer object representing a checkBox.
* @constructor
* @augments FieldDisplayer
*/

var fieldTypeCheckBox = Class.create(parentFieldDisplayer,
/**
* @lends fieldTypecheckBox
*/
{
initialize: function($super, options) {
    $super(options);
},
/**
* Initializes the check box
*/
_initializeModule: function($super) {
    //Main container, The checkBoxes will be placed here
    this._checkBoxesContainer = new Element('div', {});
    //Inserting the container on the parent element container
    this._moduleElement.update(this._checkBoxesContainer);
    if (Object.isEmpty(this.options.valueListService))
        this._createSingleComponent();
    else
        this._getFieldValues();
    var value = this.getValue();
    var changed = this.updateJSON(value);
    $super();
},
    _getFieldValuesSuccess : function($super, firstTime, response) {
    //Getting the field values from the response
    if (response.EWS.o_values && response.EWS.o_values.item) {
        this._checkBoxesContainer.update('');
        //Converting the object into an array just in case we have one record
        var values = objectToArray(response.EWS.o_values.item);
        //Going throught all the results
        values.each(function(_elem) {
            var toolTip = "";
            if (global.liteVersion && !Object.isEmpty(this.options.toolTip))
                toolTip = this.options.toolTip + ": " + _elem['@id'];
            //Creating the checkBox element
            var checkBoxElement = new Element('input', {
                    'type': 'checkbox',
                    'name': _elem['@id'],
                    "class": "test_checkBox",
                    'disabled': (this.options.mode == this.DISPLAY_MODE) ? 'disabled' : '',
				    'title': toolTip
            });
            //Creating the item container
            var checkBoxSpan = new Element('span', {});
            checkBoxSpan.insert(_elem['@value']);
            //Inserting label and checkbox in an element
            var checkBoxContainer = new Element('div', {});
            checkBoxContainer.insert(checkBoxElement);
            checkBoxContainer.insert(checkBoxSpan);
            //Inserting the whole generated element in the parent container
            this._checkBoxesContainer.insert(checkBoxContainer)
            if (_elem['@default_value'] && (_elem['@default_value'] == 'X' || _elem['@default_value'] == 'Yes'))
                checkBoxElement.checked = true;
        } .bind(this));
        $super(response);
        if (this.needsFocus) {
            if (!Object.isEmpty(this._checkBoxesContainer) &&
                   !Object.isEmpty(this._checkBoxesContainer.down())) {
                this._checkBoxesContainer.down().focus();
                if (Prototype.Browser.IE) {
                    this._checkBoxesContainer.down().focus();
                }
            }
            this.needsFocus = false;
        }
    }
    else
        return;
},
_createSingleComponent: function() {
    this._singleComponent = true;
    var disabled = (this.options.mode == this.DISPLAY_MODE || this.options.optionsJSON.settings['@display_attrib'] == 'OUO') ? true : false
    var checkBoxElement = new Element('input', {
        type: 'checkbox',
            "class": "test_checkBox",
        disabled: disabled
    });
    this._checkBoxesContainer.insert(checkBoxElement);
    if (this.options.optionsJSON.settings['@show_text'] == 'X') {
        if (!Object.isEmpty(this.options.text) && (this.options.text == 'X' || this.options.text == 'Yes'))
            checkBoxElement.checked = true;
    } else {
        if (!Object.isEmpty(this.options.value) && (this.options.value == 'X' || this.options.value == 'Yes'))
            checkBoxElement.checked = true;
    }
},
setFocus: function() {
    this.needsFocus = true;
    if (!Object.isEmpty(this._checkBoxesContainer) &&
           !Object.isEmpty(this._checkBoxesContainer.down())) {
        this._checkBoxesContainer.down().focus();
        if (Prototype.Browser.IE) {
            this._checkBoxesContainer.down().focus();
        }
    }
},
/**
* @description Checks the field format
* @param $super Parent function
*/
_checkValidFormat: function($super) {
    return true;
},
_setOnChange: function($super) {
    if (this._singleComponent)
        $super(this._checkBoxesContainer.down(), 'click');
    else
        $super(this._checkBoxesContainer, 'click');
},
_setHowToGetValue: function($super) {
    obj =
        {
            id: function() {
                if (this._singleComponent) {
                    var checked = (this._checkBoxesContainer.down().checked) ? 'X' : '';
                    return checked;
                } else {
                    var value = $A();
                    $A(this._checkBoxesContainer.childNodes).each(function(item) {
                        if (item.firstChild.checked)
                            value.push(item.firstChild.getAttribute('name'));
                    });
                    return value;
                }
            } .bind(this),
            text: function() {
                if (this._singleComponent) {
                    var checked = (this._checkBoxesContainer.down().checked) ? 'X' : '';
                    return checked;
                } else {
                    var value = $A();
                    $A(this._checkBoxesContainer.childNodes).each(function(item) {
                        if (item.firstChild.checked)
                            value.push(item.firstChild.getAttribute('name'));
                    });
                    return value;
                }
            } .bind(this)
        };
    $super(obj);
},
/**
* Gets the value to show for the checkbox
*/
getValueToShow: function() {
	    var result = new Element("input", { "type": "checkbox", "class": "test_checkBox" });
    if (!Object.isEmpty(this.options.value) && this.options.value.toLowerCase() == "x") {
        result.checked = true;
        result.defaultChecked = true; ///In order to work with IE
    }
    if (this.options.mode == "display") {
        Form.Element.disable(result);
    }
    return result;

},
/**
* Sets the value for a field.
* @param {Object} value
* @param {Object} text
*/
setValue: function($super, value, text) {
    var checked = false;
    if (this.options.optionsJSON.settings['@show_text'] == 'X') {
        if (!Object.isEmpty(text) && (text == 'X' || text == 'Yes'))
            checked = true;
    } else {
        if (!Object.isEmpty(value) && (value == 'X' || value == 'Yes'))
            checked = true;
    }
    //TODO: if we have multiple checkboxes it won't don anything
    if (this._singleComponent) {
        this._checkBoxesContainer.down().checked = checked;
        this._checkBoxesContainer.down().defaultChecked = checked;
    }
        this._onFieldChange(true, false);   
}
});

/**
* fieldTypeDate will return a FieldDisplayer object representing a select box.
* @constructor
* @augments FieldDisplayer
*/

var fieldTypeDate = Class.create(parentFieldDisplayer,
/**
* @lends fieldTypeDate
*/
{
//To keep track of the validity of the Date
correctDate: false,
initialize: function($super, options) {
    $super(options);
    //This is to make sure that if we have a value, it gets to the json
    //this._updateJSONDate.bind(this).defer();
    //this.setValid();
},
/**
* Initializes the date picker
*/
_initializeModule: function($super) {
    var date = null;
    //Setting the labels
    this.overlappingDatesMessage = global.getLabel('overlappingDates');
    this.wrongDateMessage = global.getLabel('wrongDate');
    this.wrongLinkMessage = global.getLabel('wrongLinkedDates');
    //Changing the default date format for the defaultDate variable of the datepicker
    if (!Object.isEmpty(this.options.value) && this.options.value != '0000-00-00') {
        date = this.options.value.gsub("-", "");
    }
    //Setting the retro/future warning/error values and labels for the datepicker
    //If the value does not exists, we do not pass a value to the datepicker, and leave the label empty as well
    //For the label we first search in the labels of the getContent, and after in global
    //We also change the date formats to be in compliance with the datepicker
    if (!Object.isEmpty(this.options.dateRanges) && (this.options.id == "BEGDA")) {
        if (!Object.isEmpty(this.options.dateRanges.RETRO_ERR) && !Object.isEmpty(this.options.dateRanges.RETRO_ERR.date_value)) {
            if (!Object.isEmpty(this.options.dateRanges.RETRO_ERR.labid)) {
                this.retroErrorMessage = this.labels.get(this.options.dateRanges.RETRO_ERR.labid);
                if (Object.isEmpty(this.retroErrorMessage))
                    this.retroErrorMessage = global.getLabel(this.options.dateRanges.RETRO_ERR.labid);
            }
            var retroError = this.options.dateRanges.RETRO_ERR.date_value.gsub("-", "");
        }
        if (!Object.isEmpty(this.options.dateRanges.RETRO_WAR) && !Object.isEmpty(this.options.dateRanges.RETRO_WAR.date_value)) {
            if (!Object.isEmpty(this.options.dateRanges.RETRO_WAR.labid)) {
                this.retroWarningMessage = this.labels.get(this.options.dateRanges.RETRO_WAR.labid);
                if (Object.isEmpty(this.retroWarningMessage))
                    this.retroWarningMessage = global.getLabel(this.options.dateRanges.RETRO_WAR.labid);
            }
            var retroWarning = this.options.dateRanges.RETRO_WAR.date_value.gsub("-", "");
        }
        if (!Object.isEmpty(this.options.dateRanges.FUTURE_WAR) && !Object.isEmpty(this.options.dateRanges.FUTURE_WAR.date_value)) {
            if (!Object.isEmpty(this.options.dateRanges.FUTURE_WAR.labid)) {
                this.futureWarningMessage = this.labels.get(this.options.dateRanges.FUTURE_WAR.labid);
                if (Object.isEmpty(this.futureWarningMessage))
                    this.futureWarningMessage = global.getLabel(this.options.dateRanges.FUTURE_WAR.labid);
            }
            var futureWarning = this.options.dateRanges.FUTURE_WAR.date_value.gsub("-", "");
        }
        if (!Object.isEmpty(this.options.dateRanges.FUTURE_ERR) && !Object.isEmpty(this.options.dateRanges.FUTURE_ERR.date_value)) {
            if (!Object.isEmpty(this.options.dateRanges.FUTURE_ERR.labid)) {
                this.futureErrorMessage = this.labels.get(this.options.dateRanges.FUTURE_ERR.labid);
                if (Object.isEmpty(this.futureErrorMessage))
                    this.futureErrorMessage = global.getLabel(this.options.dateRanges.FUTURE_ERR.labid);
            }
            var futureError = this.options.dateRanges.FUTURE_ERR.date_value.gsub("-", "");
        }
        if (this.options.id == "BEGDA" && this.options.mode == "edit" &&
           !Object.isEmpty(this.options.dateRanges.DEF_DATE) && !Object.isEmpty(this.options.dateRanges.DEF_DATE.date_value))
            date = this.options.dateRanges.DEF_DATE.date_value.gsub("-", "");
    }
    //Observes the event that is fired when a field of the date picker is blurred, so we update the JSON
    this._registerEvent('EWS:datePickerCorrectDate_' + this.options.id + '_' + this._id + '_' + this.options.appId + this.options.screen + this.options.record + this.options.randomId, this._correctDate.bind(this));
    this._registerEvent('EWS:datePickerWrongDate_' + this.options.id + '_' + this._id + '_' + this.options.appId + this.options.screen + this.options.record + this.options.randomId, this._wrongDate.bind(this));
    var toolTip = "";
    if (!Object.isEmpty(this.options.toolTip))
        toolTip = this.options.toolTip;
    this._moduleInstance = new DatePicker(this._moduleElement, {
        emptyDateValid: !this.options.mandatory,
        correctDateOnBlur: true,
        fireEventOnInitialize: true,
        showMessages: false,
        fromDate: retroError,
        toDate: futureError,
        warningMinDate: retroWarning,
        warningMaxDate: futureWarning,
        defaultDate: date,
        events: $H({
            correctDate: 'EWS:datePickerCorrectDate_' + this.options.id + '_' + this._id + '_' + this.options.appId + this.options.screen + this.options.record + this.options.randomId,
            wrongDate: 'EWS:datePickerWrongDate_' + this.options.id + '_' + this._id + '_' + this.options.appId + this.options.screen + this.options.record + this.options.randomId
        }),
        toolTip: toolTip
    });
    $super();
},
_setValue: function($super, value) {
    var date;
    if (!Object.isEmpty(value)) {
        date = Date.parseExact(value, ['yyyy-MM-dd', 'yyyy-MM-dd']);

        this._moduleInstance.setDate(date);
    }
},
/**
* Sets the value for a field.
* @param {Object} value
* @param {Object} text
*/
setValue: function(value, text) {
    this._setValue(value);
},
/**
* Updates the correctDate variable to reflect the changes of the datePicker
*/
_correctDate: function() {
    this.correctDate = true;
    this._onFieldChange(true, true);
},
/**
* Updates the JSON and the correctDate variable to reflect the changes of the datePicker
*/
_wrongDate: function() {
    this.correctDate = false;
    this._onFieldChange(false);
},
/**
* Updates the JSON with the current value
*/
_updateJSONDate: function() {
    var value = this.getValue();
    this.updateJSON(value);
},
_checkValidFormat: function($super) {
    if (this._moduleInstance && !this.correctDate && !this.options.visualOpt)
        return false;
    else
        return true;
},
setInvalid: function(messageDiv, label) {
    //temporal invalid style
    this._element.removeClassName('fieldGreenWarning');
    this._element.addClassName('fieldError');
    var message = messageDiv;
    if (Object.isEmpty(message))
        message = $('errorDiv_' + this.options.id + this.options.appId + this.options.screen + this.options.record);
    if (message) {
        //Obtaining the type of error we have in the datepicker and setting the corresponding error message
        if (Object.isEmpty(label)) {
            var messageType = this._moduleInstance.getErrorMessageType();
            switch (messageType) {
                case 'RETRO_ERR':
                    message.innerHTML = this.options.label + ": " + this.retroErrorMessage;
                    break;
                case 'FUTURE_ERR':
                    message.innerHTML = this.options.label + ": " + this.futureErrorMessage;
                    break;
                case 'OVERLAPPING_DATES':
                    message.innerHTML = this.options.label + ": " + this.overlappingDatesMessage;
                    break;
                case 'WRONG_DATE':
                    message.innerHTML = this.options.label + ": " + this.wrongDateMessage;
                    break;
                case 'WRONG_LINK':
                    //If the endDa is failling we hide the message in endDa
                    if (this.options.id == 'ENDDA') {
                        this.options.FPObject.messages.down('[id=errorDiv_BEGDA' + this.options.appId + this.options.screen + this.options.record + ']').hide();
                    }
                    //If the begDa is failling we hide the message in begDa
                    else if (this.options.id == 'BEGDA') {
                        this.options.FPObject.messages.down('[id=errorDiv_ENDDA' + this.options.appId + this.options.screen + this.options.record + ']').hide();
                    }
                    message.innerHTML = global.getLabel('begDaAndendDa') + ": " + this.wrongLinkMessage;
                    break;
            }
        }
        else
            message.innerHTML = this.options.label + ": " + label;
        message.show();
    }
},
setValid: function(messageDiv) {
    //temporal valid style
    this._element.removeClassName('fieldError');
    this._element.removeClassName('fieldGreenWarning');
    if (this._moduleInstance) {
        var message = messageDiv;
        if (Object.isEmpty(message))
            message = $('errorDiv_' + this.options.id + this.options.appId + this.options.screen + this.options.record);
        if (message) {
            //Obtaining the type of error we have in the datepicker and setting the corresponding error message
            //If it is only a warning, we show the field and the message in green
            var messageType = this._moduleInstance.getErrorMessageType();
            switch (messageType) {
                case 'RETRO_WAR':
                    this._element.addClassName('fieldGreenWarning');
                    var warningMessage = new Element('span', {
                        'class': 'fieldGreenWarningMessage'
                    });
                    warningMessage.innerHTML = this.options.label + ": " + this.retroWarningMessage;
                    message.update(warningMessage);
                    message.show();
                    break;
                case 'FUTURE_WAR':
                    this._element.addClassName('fieldGreenWarning');
                    var warningMessage = new Element('span', {
                        'class': 'fieldGreenWarningMessage'
                    });
                    warningMessage.innerHTML = this.options.label + ": " + this.futureWarningMessage;
                    message.update(warningMessage);
                    message.show();
                    break;
                default:
                    message.hide();
            }
        }
    }
    else {
        if ($('errorDiv_' + this.options.id + this.options.appId + this.options.screen + this.options.record))
            $('errorDiv_' + this.options.id + this.options.appId + this.options.screen + this.options.record).hide();
    }
},

setFocus: function() {
    if (!Object.isEmpty(this._moduleInstance) && !Object.isEmpty(this._moduleInstance.dayField)) {
        this._moduleInstance.dayField.focus();
        if (Prototype.Browser.IE) {
            this._moduleInstance.dayField.focus();
        }
    }
},
_setOnChange: function($super) {
},

_setHowToGetValue: function($super) {
    obj =
        {
            id: function() {
                if (this._moduleInstance.actualDate) {
                    //If we are using the default value because it is empty, TODO: there should be a better way to do that
                    if (this._moduleInstance.actualDate.toString("yyyy-MM-dd") == "1899-11-30") {
                        return '';
                    } else {
                        return this._moduleInstance.actualDate.toString("yyyy-MM-dd");
                    }
                }
                if (this._moduleInstance.dateIsEmpty()) {
                    return '';
                } else {
                    return this._moduleInstance.getActualDate();
                }
            } .bind(this),
            text: function() {
                if (this._moduleInstance.dateIsEmpty()) {
                    return '';
                } else
                    return this._moduleInstance.getActualDate();
            } .bind(this)
        }
    $super(obj);
},


_formattedValue: function(options) {

    return (!Object.isEmpty(options) && !Object.isEmpty(options.value)) ? sapToDisplayFormat(options.value) : "";
}

});

/**
* fieldTypeHidden will return a FieldDisplayer hidden (no graphical representation)
* @constructor
* @augments fieldTypeHidden
*/
var fieldTypeHidden = Class.create(parentFieldDisplayer,
/**
* @lends fieldTypeHidden
*/
{
_setLayout: function() {
    this._element = new Element("div");
},
_initializeModule: function() {
    var depValue = !Object.isEmpty(this.options.value) ? this.options.value : this.options.optionsJSON.settings['@default_value'];
    document.fire("EWS:fieldChanged_" + this.options.techName + this.options.appId + this.options.screen + this.options.record + this.options.randomId, $H({
        fieldid: this.options.id,
        fieldtechname: this.options.techName,
        value: depValue
    }));
    this._lastValueSelected.set(this.options.techName + this.options.appId + this.options.screen + this.options.record, $H({
        fieldid: this.options.id,
        fieldtechname: this.options.techName,
        value: depValue
    }));
    if (this.options.techName != this.options.id) {
        //in PFM, it is taken into account the fieldId for dependencies, instead of the fieldTechName
        document.fire("EWS:fieldChanged_" + this.options.id + this.options.appId + this.options.screen + this.options.record + this.options.randomId, $H({
            fieldid: this.options.id,
            fieldtechname: this.options.techName,
            value: depValue
        }));
        this._lastValueSelected.set(this.options.id + this.options.appId + this.options.screen + this.options.record, $H({
            fieldid: this.options.id,
            fieldtechname: this.options.techName,
            value: depValue
        }));
    }
    if (this.options.mode != 'edit') {
        if (Object.isEmpty(this.options.optionsJSON.values['@value']) && Object.isEmpty(this.options.optionsJSON.values['#text'])) {
            text = !Object.isEmpty(this.options.optionsJSON.settings['@default_text']) ? this.options.optionsJSON.settings['@default_text'] : '';
            id = !Object.isEmpty(this.options.optionsJSON.settings['@default_value']) ? this.options.optionsJSON.settings['@default_value'] : '';
            var changed = this.updateJSON({
                id: id,
                text: text
            })
        }
    }
    else {
        if (Object.isEmpty(this.options.optionsJSON.values['@value'])) {
            id = '';
        }
        else {
            id = this.options.optionsJSON.values['@value'];
        }

        if (Object.isEmpty(this.options.optionsJSON.values['#text'])) {
            text = '';
        }
        else {
            text = this.options.optionsJSON.values['#text'];
        }
    }
},
_checkValidFormat: function($super) {
    return true;
},
_getFieldValues: function() {
    this._onFieldChange(false, true);
    return Prototype.emptyFunction();
},
/**
 * Sets the value for a field.
 * @param {Object} value
 * @param {Object} text
 */
setValue: function($super,value, text){
    $super(value, text);
    this.options.value = value;
    this.options.text = text;
}
});

/**
* fieldTypeHour will return a FieldDisplayer a time entry field
* @constructor
* @augments FieldDisplayer
*/

var fieldTypeHour = Class.create(parentFieldDisplayer,
/**
* @lends fieldTypeHour
*/
{
initialize: function($super, options) {
    this.correctHour = false;
    $super(options);
    //This is to make sure that if we have a value, it gets to the json
    var value = this.getValue();
    this.updateJSON(value);
    this.setValid();
},

/**
* Initializes the hour field properly.
*/
_initializeModule: function($super) {
    var viewSecs = "no";
    //If it is type W, it also shows the seconds
    if (this.options.optionsJSON.settings["@fieldformat"] == "W") {
        var viewSecs = "yes";
    }
    var toolTip = "";
    if (!Object.isEmpty(this.options.toolTip))
        toolTip = this.options.toolTip;
    var isEndHour = 'no';
    if (this.options.id == 'ENDUZ' || this.options.optionsJSON.settings['@mask'] == '24:00')
        isEndHour = 'yes';
    this._moduleInstance = new HourField(this._moduleElement, {
        viewSecs: viewSecs,
        defaultTime: (!Object.isEmpty(this.options.value)) ? this.options.value.gsub(':', '') : '000000',
        isEndHour: isEndHour,
		fireEventOnInitialize: true,
        events: $H({
            //onCorrectTime: 'EWS:hourfield_correct_' + this.options.id + this.options.appId + this.options.screen + this.options.record + this.options.randomId,
            onCorrectTime: 'EWS:hourfield_correct_' + this.options.id + '_' + this._id + '_' + this.options.appId + this.options.screen + this.options.record + this.options.randomId,
            onIncorrectTime: 'EWS:hourfield_incorrect_' + this.options.id + '_' + this._id + '_' + this.options.appId + this.options.screen + this.options.record + this.options.randomId
        }),
        toolTip: toolTip

    });
    this._registerEvent('EWS:hourfield_correct_' + this.options.id + '_' + this._id + '_' + this.options.appId + this.options.screen + this.options.record + this.options.randomId, this._correctHour.bind(this));
    this._registerEvent('EWS:hourfield_incorrect_'   + this.options.id + '_' + this._id + '_' + this.options.appId + this.options.screen + this.options.record + this.options.randomId, this._wrongHour.bind(this));
    var value = this.getValue();
    var changed = this.updateJSON(value);
    $super();
},
setFocus: function() {
    if (!Object.isEmpty(this._moduleInstance) && !Object.isEmpty(this._moduleInstance.contentHour)) {
        this._moduleInstance.contentHour.focus();
        if (Prototype.Browser.IE) {
            this._moduleInstance.contentHour.focus();
        }
    }
},
/**
* @description Checks the field format
* @param $super
*            Parent function
*/
_checkValidFormat: function($super) {
    if (this._moduleInstance && !this.correctHour && !this.options.visualOpt)
        return false;
    else
        return true;
},
/**
* Updates the correctDate variable to reflect the changes of the HourField
*/
_correctHour: function() {
    this.correctHour = true;
    this._onFieldChange(true, true);
},
/**
* Updates the JSON and the correctDate variable to reflect the changes of the HourField
*/
_wrongHour: function() {
    this.correctHour = false;
    this._onFieldChange(false);
},
setInvalid: function($super, messageDiv) {
    //temporal invalid style
    var message = messageDiv;
    if(Object.isEmpty(message))
        message = $('errorDiv_' + this.options.id + this.options.appId + this.options.screen + this.options.record);
    if (message) {
        //Obtaining the type of error we have in the datepicker and setting the corresponding error message
        var messageType = this._moduleInstance.getErrorMessageType();
        switch (messageType) {
            case 'WRONG_HOUR' :
                this._element.addClassName('fieldError');
                message.innerHTML = this.options.label + ": " + global.getLabel("wrongHour");
                break;
            case 'EMPTY_HOUR' :
                $super(messageDiv);
                break;
            default:
                return;
        }
        message.show();
    }
},
/**
 * No need to call this function, we have events for the correct and error hours
 */
_setOnChange: function($super) {
},
_setHowToGetValue: function($super) {
    obj =
        {
            id: function() {
                return this._moduleInstance.getSapTime();
            } .bind(this),
            text: function() {
                return this._moduleInstance.getSapTime();
            } .bind(this)
        }
    $super(obj);
},
/**
* Gets the value for the field in a formatted way
*/
_formattedValue: function() {
    var viewSecs = false;
    //If it is type W, it also shows the seconds
    if (this.options.optionsJSON.settings["@fieldformat"] == "W")
        var viewSecs = true;
    //If the value is empty return an empty string
    if (Object.isEmpty(this.options.value)) {
        return "";
    }
    //Remove already existing ":"
    var value = this.options.value.gsub(":", "");
    //Add 0s if the string is too short
    while (value.length < 6)
        value += "0";
    var hour = value.substring(0, 2);
    var minute = value.substring(2, 4);
    var second = value.substring(4, 6);
    var amPm = null;
    if(global.hourDisplayFormat == "12"){
        amPm = "am";
        var hourInt = parseInt(hour, 10);
        if(hourInt>12 && hourInt<24){
            hour = (hourInt-12) + "";
            amPm = "pm";
        }
        if(hourInt==12){
            amPm = "pm";
        }
        //00:00 and 24:00 are 12.00am
        if(hourInt==0 || hourInt==24){
            hour = 12;
            amPm = "am";
        }
    var result = hour + ":" + minute;
    }else{
        var result = hour + ":" + minute;
    }
    if (viewSecs)
        result += ":" + second;
    if(amPm){
        result += " " + amPm;
    }
    return result;
},
/**
* Sets the value for a field.
* @param {Object} value
* @param {Object} text
*/
setValue: function($super, value, text) {
    var showText = this.options.optionsJSON.settings['@show_text'];
    if (Object.isEmpty(showText) || showText == "B") {
        var valueToSet = value;
    } else {
        var valueToSet = text;
    }
    this._moduleInstance.setValue(valueToSet);
}
});

/**
* fieldTypeImage will return a FieldDisplayer object representing an image
* @constructor
* @augments FieldDisplayer
*/

var fieldTypeImage = Class.create(parentFieldDisplayer,
/**
* @lends fieldTypeImage
*/
{
initialize: function($super, options) {
    $super(options);
},

_initializeModule: function() {
    //value will specify the URL to load the image
    if (this.options.value) {
        this._moduleElement.update(new Element('div', {
            'class': this.options.value,
            'title': this.options.text
        }));
    }
    //If the URL isn't specified give it a standard style.
    else {
        this._moduleElement.addClassName("application_noPicture");
    }
},
/**
* Creates the HTML element needed for the image.
*/
_setLayout: function($super) {
    $super();
},
_checkValidFormat: function($super) {
    return true;
}
}
);



/**
* fieldTypeLinkToHandler will return a FieldDisplayer object representing an application link.
* @constructor
* @augments FieldDisplayer
*/

var fieldTypeLinkToHandler = Class.create(parentFieldDisplayer,
/**
* @lends fieldTypeLink
*/
{
initialize: function($super, options) {
    $super(options);
},
/**
* Creates the element and gives it the proper class name
*/
_setLayout: function($super) {
    $super();
	var buttonsJson = {
        elements: [],
        defaultButtonClassName: ''
    };
	if (this.options.handler && this.options.handler.get(this.options.id))
        var handler = this.options.handler.get(this.options.id);
    else
        var handler = this.defaultHandler;
	var toolTip = "";
    if(!Object.isEmpty(this.options.toolTip))
       toolTip = this.options.toolTip;
	var link = {
        idButton: 'linkToHandler',
        label: this.options.label,
        className: 'application_action_link',
        type: 'link',
        handlerContext: null,
        handler: handler,
		toolTip: toolTip
    };
	buttonsJson.elements.push(link);
	this._element = new megaButtonDisplayer(buttonsJson).getButtons();
    /*this._element = new Element("span", {
        "class": "application_action_link"
    }).update(this.options.label);
    if (this.options.handler && this.options.handler.get(this.options.id))
        this._element.observe('click', this.options.handler.get(this.options.id));
    else
        this._element.observe('click', this.defaultHandler);*/
},
/*
* @description Checks the field format
* @param $super
*            Parent function
*/
_checkValidFormat: function($super) {
    return true;
},
defaultHandler: function() {
    alert('This is the fieldTypeLinkToHandler default handler. You should pass the buttonsHandler option to the fieldsPanel constructor, using this field id as the hash key.');
}
});


/**
* fieldTypeLink will return a FieldDisplayer object representing an application link.
* @constructor
* @augments FieldDisplayer
*/

var fieldTypeLink = Class.create(parentFieldDisplayer,
/**
* @lends fieldTypeLink
*/
{
initialize: function($super, options) {
    $super(options);
},
/**
* Creates the element and gives it the proper class name
*/
    _setLayout: function($super){
        $super();
	    var toolTip = "";
        if(!Object.isEmpty(this.options.toolTip)){
            toolTip = this.options.toolTip;
        }
        if(Object.isEmpty(this.options.value)){
            this.options.value = "";
        }
        if(Object.isEmpty(this.options.text)){
            this.options.text = "";
        }
        var content = new Element("a", {
            "class": "application_action_link test_link",
            "href": this.options.value,
		    "title": toolTip
        }).update(this.options.text);
        
        this._moduleElement.update(content);
    },
    _setLayoutDisplay: function(){
        this._setLayout();
    },
/*
* @description Checks the field format
* @param $super
*            Parent function
*/
_checkValidFormat: function($super) {
    return true;
}
});

/**
* fieldTypeRadioButton will return a FieldDisplayer object representing a radio button.
* @constructor
* @augments FieldDisplayer
*/

var fieldTypeRadioButton = Class.create(parentFieldDisplayer,
/**
* @lends fieldTypeRadioButton
*/
{
/**
* @description Contains que parent DIV of the type where the radio buttons will be placed
* @type Prototype.Element
*/
_radioButtonContainer: null,
/**
* @description Initializes the field type
* @param $super The parent funciton
* @param options The field settings
*/
initialize: function($super, options) {
    $super(options);
},
/**
* @description Parses the JSON values and converts it into field values
* @param $super The parent class
* @param response The JSON response
*/
    _getFieldValuesSuccess: function($super, firstTime, response) {
        //If the field displayer no longer exists:
        if(Object.isEmpty(this.options)){
            this.destroy();
            return;
        }
    //Getting the field values from the response
    if (!Object.isEmpty(response.EWS.o_values) && !Object.isEmpty(response.EWS.o_values.item)) {
        //Converting the object into an array just in case we have one record
        var values = objectToArray(response.EWS.o_values.item);
        //Going throught all the results
        values.each(function(_elem, index) {
            //Creating the radio element
			var toolTip = "";
		    if(!Object.isEmpty(this.options.toolTip))
		       toolTip = ("title='" + this.options.toolTip + ": " + _elem['@id'] + "'");
            var radioElement;
            var disabled = (this.options.mode == this.DISPLAY_MODE) ? 'disabled' : '';
            if ((Object.isEmpty(this.options.value) && (index == 0)) || (this.options.value == _elem['@id'])) {
                radioElement = "<input " + toolTip + " checked " + disabled + " type='radio' value='" + _elem['@id'] + "' name='" + this.options.id + this.options.appId + this.options.screen + this.options.record + "' class='test_radioButton' />";
            } else {
                radioElement = "<input " + toolTip + " type='radio' " + disabled + " value='" + _elem['@id'] + "' name='" + this.options.id + this.options.appId + this.options.screen + this.options.record + "' class='test_radioButton' />";
            }
            //Creating the item container
            var radioButtonSpan = new Element('span', {
                    'class': 'fieldDisplayer_radioLabel test_label'
            });
            //Inserting the radio button in the item container
            radioButtonSpan.insert(_elem['@value']);
            //Inserting the whole generated element in the parent container
            var container = new Element('div', {
                    'class': 'fieldDispClearBoth fieldDispFloatLeft'
            });
            container.insert(radioElement);
            container.insert(radioButtonSpan);
            this._radioButtonContainer.insert(container);
        } .bind(this));
        if (this._firstTimeGettingValue) {
            var value = this.getValue();
            var changed = this.updateJSON(value);
        }
        this._firstTimeGettingValue = false;
        $super(response);
            if(this.needsFocus) {
                if(!Object.isEmpty(this._radioButtonContainer) &&
                   !Object.isEmpty(this._radioButtonContainer.firstChild) && 
                   !Object.isEmpty(this._radioButtonContainer.firstChild.firstChild)) {
                    this._radioButtonContainer.firstChild.firstChild.focus();
                    if (Prototype.Browser.IE) {
                        this._radioButtonContainer.firstChild.firstChild.focus();
                    }
                }
                this.needsFocus = false;
            }
        }
        if(this.disabled){
            this.setDisabled()
    }
},
_initializeModule: function($super) {
    //Main container, The radio buttons will be placed here
    this._radioButtonContainer = new Element('div', {});
    //Inserting the container on the parent element container
    this._moduleElement.update(this._radioButtonContainer);
    $super();
    },
    setFocus: function() {
        this.needsFocus = true;
        if(!Object.isEmpty(this._radioButtonContainer) &&
           !Object.isEmpty(this._radioButtonContainer.firstChild) && 
           !Object.isEmpty(this._radioButtonContainer.firstChild.firstChild)) {
            this._radioButtonContainer.firstChild.firstChild.focus();
            if (Prototype.Browser.IE) {
                this._radioButtonContainer.firstChild.firstChild.focus();
            }
        }
},
/*
* @description Checks the field format
* @param $super
*            Parent function
*/
_checkValidFormat: function($super) {
    return true;
},
_setOnChange: function($super) {
    $super(this._radioButtonContainer, 'click');
},
_setHowToGetValue: function($super) {
    obj =
        {
            id: function() {
                var checkedValue = '';
                var radios = objectToArray(this._radioButtonContainer.select('[name=' + this.options.id + this.options.appId + this.options.screen + this.options.record + ']'));
                if (!Object.isEmpty(radios) && (radios.size() > 0)) {
                    radios.each(function(r) {
                        if (r.checked) {
                            checkedValue = r.getValue();
                            return;
                        }
                    } .bind(this));
                    return checkedValue;
                } else {
                    return '';
                }
            } .bind(this),
            text: function() {
                var checkedValue = '';
                var radios = objectToArray(this._radioButtonContainer.select('[name=' + this.options.id + this.options.appId + this.options.screen + this.options.record + ']'));
                if (!Object.isEmpty(radios) && (radios.size() > 0)) {
                    radios.each(function(r) {
                        if (r.checked) {
                            checkedValue = r.getValue();
                            return;
                        }
                    } .bind(this));
                    return checkedValue;
                } else {
                    return '';
                }
            } .bind(this)
        }
    $super(obj);
},
/**
 * Sets the value for a field.
 * @param {Object} value
 * @param {Object} text
 */
setValue: function($super,value, text){
	$super();
    //TODO: the JSON will be updated, but not the HTML components
}
});

/**
* fieldTypeSelectBox will return a FieldDisplayer object representing a select box.
* @constructor
* @augments FieldDisplayer
*/

var fieldTypeSelectBox = Class.create(parentFieldDisplayer,
/**
* @lends fieldTypeSelectBox
*/
{
/**
* The select box html element
* @type {Element}
*/
select: null,
initialize: function($super, options) {
    if (Object.isEmpty(options.valueListService)) {
        //setting 'get_field_val' as default service, since all the selectboxes need one service
        options.valueListService = "GET_FIELD_VAL";
    }
    $super(options);
},
/**
* Handles the response from the GET_FIELD_VALUES service to fill the select box.
* @param {JSON} response The response from the service.
*/
_getFieldValuesSuccess: function($super, firsTime, response) {
    if (response.EWS.o_values) {
        if (!this.options.mandatory) {
            this.select.insert(new Element("option", {
                "value": "",
                "selected": true
            }));
        }
        objectToArray(response.EWS.o_values.item).each(function(item) {
            var selected = (item['@id'] == this.options.value) ? true : false;
            this.select.insert(new Element("option", {
                "value": item["@id"],
                "selected": selected
            }).insert(item["@value"]));
        } .bind(this));
        this._onFieldChange(false);
        this.setValid();
        $super(response);
    }

},
/**
* Initializes the select box with the proper options
*/
_initializeModule: function($super) {
    this.select = new Element("select", {
            "name" : this._moduleElement.identify()+"_select",
            "class": "test_select"
    });
    this._moduleElement.insert(this.select);
    $super();
},
_setOnChange: function($super) {
    $super(this.select, 'change');
},
_setHowToGetValue: function($super) {
    obj =
        {
            id: function() {
                if (this.select.selectedIndex != -1)
                    return (this.select.options[this.select.selectedIndex]).value;
                else
                    return null;
            } .bind(this),
            text: function() {
                if (this.select.selectedIndex != -1)
                    return (this.select.options[this.select.selectedIndex]).text;
                else
                    return null;
            } .bind(this)
        }
    $super(obj);
},
    setFocus: function() {
        if(!Object.isEmpty(this.select)) {
            this.select.focus();
            if (Prototype.Browser.IE) {
                this.select.focus();
            }
        }
    },
/**
* @description Checks the field format
* @param $super
*            Parent function
*/
_checkValidFormat: function($super) {
    return true;
}
});

/**
* fieldTypeText will return a FieldDisplayer object representing a text field.
* @constructor
* @augments FieldDisplayer
*/

var fieldTypeText = Class.create(parentFieldDisplayer,
/**
* @lends fieldTypeText
*/
{
/**
* @description Stores the regular expresion to check certain text format
*/
TEXT_FORMATS_REGEXP: {
    CHAR: true, // Checks if the text is a string
    NUMC: /^\s*\d+\s*$/, // Checks if the text is an int
    DEC: /^(?:\d+)(?:\.\d+)?$/ // Checks if the text is a decimal number
},
/**
* @description Initializes the class
* @param $super Parent class initialize method
* @param Field type settings
*/
initialize: function($super, options) {
    $super(options);
    //this._onFieldChange(false);
    this.setValid();
    if (!Object.isEmpty(this.options.optionsJSON.settings['@mask']) && this.options.mode == this.DISPLAY_MODE && !Object.isEmpty(this.options.value)) {
        this._replaceTextWithMask();
    }
},
_replaceTextWithMask: function() {
    var value = this._getInputValue();
    var toolTip = this._getInputToolTip();
    var maxLength = this._getInputMaxLength();
    this.textFieldElement = new Element("input", {
        "type": "text",
        "class": "fieldDispWidth test_input",
        "value": value,
        "title": toolTip,
        "readonly": "readonly",
        "style": "border:none; cursor:text"
    });
    if (!Object.isEmpty(maxLength)) {
        this.textFieldElement.writeAttribute("maxlength", maxLength);
    }
    this._moduleElement.update(this.textFieldElement);
    this.fieldMask = this._getInputFieldMask(value);
},
_getInputValue: function() {
    var value = (!Object.isEmpty(this.options.value)) ? this.options.value : this.options.text;
    if (Object.isEmpty(value)) {
        value = "";
    } else {
        value = value.gsub('&#37;', '%').gsub('&#39;', "'").gsub('&#34;', '"');
    }
    if (this.options.type == "CURR" || this.options.type == "DEC") {
        value = value.gsub(global.thousandsSeparator, "").gsub(global.millionsSeparator, "").gsub(global.commaSeparator, ".");
        var decimalLong = 0;
        if (!Object.isEmpty(value.split(".")[1])) {
            decimalLong = value.split(".")[1].length;
        }
        value = longToDisplay(parseFloat(value, 10), decimalLong);
    }
    return value;
},
_getInputToolTip: function() {
    var toolTip = "";
    if (!Object.isEmpty(this.options.toolTip))
        toolTip = this.options.toolTip;
    return toolTip;
},
_getInputMaxLength: function() {
    var maxLength = null;
    if (!Object.isEmpty(this.options.optionsJSON.settings['@length'])) {
        maxLength = parseInt(this.options.optionsJSON.settings['@length'], 10);
        if (maxLength == 0) {
            maxLength = null;
        }
    }
    return maxLength;
},
_getInputFieldMask: function(value) {
    if (!Object.isEmpty(this.options.optionsJSON.settings['@mask'])) {
        var useOnlyVariableCharacters = true;
        if (!Object.isEmpty(this.options.optionsJSON.settings['@keep_mask']) && this.options.optionsJSON.settings['@keep_mask'].toLowerCase() == "x") {
            useOnlyVariableCharacters = false;
        }
        return new FieldMask(this.textFieldElement, prepareTextToShow(this.options.optionsJSON.settings['@mask']), { activate: true, defaultValue: value, useOnlyVariableCharacters: useOnlyVariableCharacters });
    } else { return null; }
},
/**
* Initializes the text input properly.
*/
_initializeModule: function($super) {
    //If we have defined a maximum length
    var maxLength = this._getInputMaxLength();
    var value = this._getInputValue();
    if (value) {
        value = prepareTextToEdit(value);
    }
    var toolTip = this._getInputToolTip();
    this.textFieldElement = new Element("input", {
        "type": "text",
        "class": "fieldDispWidth test_input",
        "value": value,
        "title": toolTip
    });
    if (!Object.isEmpty(maxLength)) {
        this.textFieldElement.writeAttribute("maxlength", maxLength);
    }
    this._moduleElement.update(this.textFieldElement);

    if (this.options.type == "CURR" || this.options.type == "DEC") {
        var maxDecimals = parseInt(this.options.optionsJSON.settings['@decimals'], 10);
        //If we have no decimals we won't have to subtract the decimal separator
        if (maxDecimals > 0)
            var maxIntegers = parseInt(this.options.optionsJSON.settings['@length'], 10) - maxDecimals - 1;
        else
            var maxIntegers = parseInt(this.options.optionsJSON.settings['@length'], 10) - maxDecimals;
        if (maxIntegers == 0) {
            maxIntegers = -1;
        }
        var alwaysShowDecimals = false;
        if (this.options.type == "CURR") {
            //For currency fields the decimals will always be shown
            alwaysShowDecimals = true;
        }
        this.fieldMask = new CurrencyFieldMask(this.textFieldElement, global.numberFormat, { activate: true, maxDecimals: maxDecimals, maxIntegers: maxIntegers, alwaysShowDecimals: alwaysShowDecimals });
    } else if (this.options.type == "NUMC") {
        this.fieldMask = new DigitOnlyFieldMask(this.textFieldElement);
    }
    else {
        this.fieldMask = this._getInputFieldMask(value);
    }
    var valueForJSON = this.getValue();
    this.updateJSON(valueForJSON);
    //Calling the parent function
    $super();
},
setFocus: function() {
    if (!Object.isEmpty(this.textFieldElement)) {
        this.textFieldElement.focus();
        if (Prototype.Browser.IE) {
            this.textFieldElement.focus();
        }
    }
},
/**
* @description Checks the field format
* @param $super
*            Parent function
*/
_checkValidFormat: function($super) {
    var regExp = this.TEXT_FORMATS_REGEXP[this.options.type];
    if (this.options.mode == this.DISPLAY_MODE)
        return true;
    //If we have a mask associated we check the value using it
    if (!Object.isEmpty(this.fieldMask)) {
        return this.fieldMask.isValid(this.options.mandatory);
    }
    if (!this.options.mandatory)
        return true;
    else if ((Object.isEmpty(this.textGetter())) && (Object.isEmpty(this.idGetter())) && !this.options.visualOpt)
        return false;
    else
        return true
    // in case regExp is undefined it was return false. Therefor condition !regExp added [EefjeC]
    if (!Object.isEmpty(this.textGetter())) {
        if ((!Object.isEmpty(regExp) && this.textGetter().strip().match(regExp)) || (regExp == true || !regExp)) {
            return true;
        } else {
            return false;
        }
    }
    if (!Object.isEmpty(this.idGetter())) {
        if ((!Object.isEmpty(regExp) && this.idGetter().strip().match(regExp)) || (regExp == true || !regExp)) {
            return true;
        } else {
            return false;
        }
    }
},
_setOnChange: function($super) {
    $super(this._moduleElement.down(), 'blur');
},
_setHowToGetValue: function($super) {
    obj =
        {
            id: function() {
                if (!Object.isEmpty(this.fieldMask)) {
                    //If the field has a mask
                    if (!this.options.mandatory && this.fieldMask.isEmpty()) {
                        //If it is not mandatory and is empty return an empty value
                        return "";
                    } else {
                        return this.fieldMask.getValue();
                    }
                } else {
                    if (Prototype.Browser.IE) 
                        var text = this._moduleElement.down().getValue().gsub("\r", "");
                    
                    else 
                        var text = this._moduleElement.down().getValue();
                    
                    if (text)
                        text = text.gsub("\n", "<br/>")
                    return prepareTextToSend(text);
                }
            } .bind(this),
            text: function() {
                if (!Object.isEmpty(this.fieldMask)) {
                    //If the field has a mask
                    if (!this.options.mandatory && this.fieldMask.isEmpty()) {
                        //If it is not mandatory and is empty return an empty value
                        return "";
                    } else {
                        return prepareTextToSend(this.fieldMask.getValue());
                    }
                } else {
                    if (Prototype.Browser.IE)
                        var text = this._moduleElement.down().getValue().gsub("\r", "");
                    else
                        var text = this._moduleElement.down().getValue();
                    if (text)
                        text = text.gsub("\n", "<br/>")
                    return prepareTextToSend(text);
                }
            } .bind(this)
        }
    $super(obj);
},

_formattedValue: function(options) {
    var returnValue;
    var valueTrim;

    if (!Object.isEmpty(options) && !Object.isEmpty(options.value)) {

        valueTrim = options.value.strip();

        if (options.type && ((options.type == "CURR") || (options.type == "DEC"))) {
            var decimalLong = 0;
            if (options.value.split('.')[1]) {
                decimalLong = options.value.split('.')[1].length;
            }
            if (!Object.isEmpty(options.optionsJSON.settings['@decimals'])) {
                decimalLong = parseInt(options.optionsJSON.settings['@decimals'], 10);
            }
            returnValue = longToDisplay(parseFloat(valueTrim, 10), decimalLong);
        }
        else {
            returnValue = options.value;
        }
    }
    else
        returnValue = "";

    //We encode and decode just in case we are receiving non-encoded characters such as & that would make IE not show it properly.
    return returnValue;
},
destroy: function($super, html) {
    if (!Object.isEmpty(this.fieldMask)) {
        //If the field has a mask
        this.fieldMask.deactivate();
    }
    $super(html);
},
/**
* Sets the value for a field.
* @param {Object} value
* @param {Object} text
*/
setValue: function($super, value, text) {
    var showText = this.options.optionsJSON.settings['@show_text'];
    if (Object.isEmpty(showText) || showText == "B") {
        if (this.options.type == "CURR" || this.options.type == "DEC") {
            if (!Object.isEmpty(value.split(".")[1])) {
                decimalLong = value.split(".")[1].length;
            }
            value = longToDisplay(parseFloat(value, 10), decimalLong);
        }
        var valueToSet = value;
    } else {
        var valueToSet = text;
    }
    if (this.options.mode == "display") {
        this._moduleElement.update(valueToSet);
    } else {
        if (!Object.isEmpty(this.fieldMask)) {
            //If the field has a mask
            this.fieldMask.setValue(valueToSet);
        } else {
            this.textFieldElement.value = valueToSet;
        }
        $super(value, text);
    }

}

});

var fieldTypeTextArea = Class.create(fieldTypeText,
/**
* @lends fieldTypeTextArea
*/
{
initialize: function($super, options) {
    $super(options);
    //this._onFieldChange(false);
    this.setValid();
},

/**
* Initializes the text input properly.
*/
_initializeModule: function($super) {
    $super();
    var toolTip = "";
    if (!Object.isEmpty(this.options.toolTip))
        toolTip = this.options.toolTip;
    this.textAreaElement = new Element("textarea", {
        'class': 'fieldDisplayer_textArea test_textArea',
        'title': toolTip,
        'id': this.options.id + '_' + this.options.appId + '_' + this.options.screen + '_' + this.options.record + '_textarea'
    });
    this._moduleElement.update(this.textAreaElement);
    //If we have defined a maximum length
    if (!Object.isEmpty(this.options.optionsJSON.settings['@length'])) {
        var maxLength = parseInt(this.options.optionsJSON.settings['@length'], 10);
        if (!Object.isEmpty(maxLength) && maxLength > 0) {
            //Create a text area to inform of the maximum length:
            this.textAreaError = new Element("div", { "class": "application_main_soft_text test_label" }).insert(global.getLabel('maxLength') + maxLength + global.getLabel("characters"));
            this.textAreaError.hide();
            this._moduleElement.insert(this.textAreaError);
            //Create a event listener to check the max length
            this.textAreaElement.observe('keyup', this._checkTextAreaLength.bind(this, maxLength));
        }
    }

    //Calling the parent function
    var value = (!Object.isEmpty(this.options.value)) ? this.options.value : this.options.text;
    if (!Object.isEmpty(value)) {
        value = prepareTextToEdit(value);
        this._moduleElement.down().setValue(value.gsub('<br/>', '\n'));
    }
    var valueForJSON = this.getValue();
    this.updateJSON(valueForJSON);
},
/**
* Inserts text in the text area 
* @param {Object} text
*/
_insertTextInTextArea: function(text) {
    var textArea = this._moduleElement.down();
    insertTextInTextArea(text, textArea);
},

_checkTextAreaLength: function(maxLength) {
    if (this.textAreaElement.value.length > maxLength - 1) {
        this.textAreaElement.value = this.textAreaElement.value.truncate(maxLength, "");
        this.textAreaError.show();
    }
    else {
        this.textAreaError.hide();
    }
},
setFocus: function() {
    if (!Object.isEmpty(this.textAreaElement)) {
        this.textAreaElement.focus();
        if (Prototype.Browser.IE) {
            this.textAreaElement.focus();
        }
    }
},
_checkValidFormat: function($super) {
    if (this.options.mandatory && this.textAreaElement.value == '' && !this.options.visualOpt)
        return false;
    else
        return true;
},
/**
* Sets the value for a field.
* @param {Object} value
* @param {Object} text
*/
setValue: function($super, value, text) {
    var showText = this.options.optionsJSON.settings['@show_text'];
    if (Object.isEmpty(showText) || showText == "B") {
        var valueToSet = value;
    } else {
        var valueToSet = text;
    }
    if (this.options.mode == "display") {
        this._moduleElement.update(valueToSet);
    } else {
        this.textAreaElement.update(valueToSet);
    }
}
});

/**
* FielTypeOuput
*/
var fieldTypeOutput = Class.create(parentFieldDisplayer,
/**
* @lends fieldTypeOutput
*/
{
initialize: function($super, options) {
    $super(options);
},

/**
* _setLayoutDisplay
*/
_setLayoutDisplay: function($super) {
    $super();
    //After setting the layout we initialize the values:
    var text = '';
    var id = '';
    var showText = this.options.optionsJSON.settings["@show_text"];

    switch (this.options.mode) {
        case "create":
            text = this.options.optionsJSON.settings['@default_text'];
            id = this.options.optionsJSON.settings['@default_value'];
            break;
        default:
            text = this.options.optionsJSON.values['#text'];
            id = this.options.optionsJSON.values['@value'];
            break;
    }


    if ((this.options.type == "DEC" || this.options.type == "CURR") && !Object.isEmpty(id) && displayToLong(id).toString() != "NaN") {
        this.options.value = id;
        this.options.optionsJSON.values['@value'] = id;
        id = this._formattedValue(this.options);
    }

    var changed = this.updateJSON({
        id: id,
        text: text
    })
},
_checkValidFormat: function($super) {
    return true;
},

_formattedValue: function(options) {
    var value;

    if (!Object.isEmpty(options) && !Object.isEmpty(options.value)) {
        if ((!Object.isEmpty(options.type) || options.optionsJSON.settings['@fieldformat'] == "D")) {
            if (options.type == "DATS" || options.optionsJSON.settings['@fieldformat'] == "D") {
                value = sapToDisplayFormat(options.value);
                return value;
            }
            else {
                if ((options.type == "DEC") || (options.type == "CURR")) {
                    var decimalLong = 0;
                    if (options.mode != 'create') {
                        var valueToUse = options.optionsJSON.values['@value'];
                    } else {
                        var valueToUse = options.value;
                    }

                    if (Object.isEmpty(valueToUse)) {
                        valueToUse = "";
                    }
                    if (valueToUse.split('.')[1]) {
                        decimalLong = valueToUse.split('.')[1].length;
                    }
                    if (!Object.isEmpty(options.optionsJSON.settings['@decimals'])) {
                        decimalLong = parseInt(options.optionsJSON.settings['@decimals'], 10);
                    }
                    if(valueToUse.include(",")){ //We need to sustitute the comma so that parseFloat works properly
                        var valueWithoutpoint = valueToUse.gsub(".","");  
                        var valueWithoutComma = valueWithoutpoint.gsub(",",".");
                        value = longToDisplay(parseFloat(valueWithoutComma, 10), decimalLong);
                    }
                    else{    
                    value = longToDisplay(parseFloat(valueToUse, 10), decimalLong);
                    }
                    return value;
                }
                else {
                    value = options.value.gsub("&#39;","'");
                }
            }
        } else {
            value = options.value;
        }
    }
    else
        value = "";

    //We encode and decode just in case we are receiving non-encoded characters such as & that would make IE not show it properly.
    return value.unescapeHTML().escapeHTML();
},
/**
* Sets the value for a field.
* @param {Object} value
* @param {Object} text
*/
setValue: function($super, value, text) {
    $super(value, text);
    this.options.text = text;
    this.options.value = value;
    var content = this.options.displayFormat.evaluate({ text: text, value: this._formattedValue(this.options) });

    if (Object.isEmpty(this.options.value)) {
        content = content.gsub(" " + global.idSeparatorLeft + global.idSeparatorRight, '');
    }
    if (content.startsWith(" " + global.idSeparatorLeft) && content.endsWith(global.idSeparatorRight))
        content = content.substring(2, content.length - 1);
    this._moduleElement.update(content);
}
});

/**
 * FielTypeCatalog
 */
var fieldTypeCatalog = Class.create(parentFieldDisplayer,
/**
* @lends fieldTypeCatalog
*/
{
/** Function that will be called when clicking the catalog button */
functionToCall: null,
/**
* Constructor
* @param {Object} $super
* @param {Object} options
*/
initialize: function($super, options) {
    this.functionToCall = options.functionToCall;
    document.observe('EWS:returnSelected', this.elementAdded.bind(this));
    $super(options);
},
/**
* _setLayoutDisplay
*/
_setLayoutDisplay: function($super) {
    $super();
    //After setting the layout we initialize the values:
    var content = this.options.displayFormat.evaluate(this.options);
    var text = '';
    var id = '';
    if (Object.isEmpty(this.options.value))
        content = content.gsub(" " + global.idSeparatorLeft + global.idSeparatorRight, '');
    if (content.startsWith(" " + global.idSeparatorLeft) && content.endsWith(global.idSeparatorRight))
        content = content.substring(2, content.length - 1);
    if (Object.isEmpty(this.options.optionsJSON.values['@value']) && Object.isEmpty(this.options.optionsJSON.values['#text'] && !content.blank())) {
        text = !Object.isEmpty(this.options.optionsJSON.settings['@default_text']) ? this.options.optionsJSON.settings['@default_text'] : '';
        id = !Object.isEmpty(this.options.optionsJSON.settings['@default_value']) ? this.options.optionsJSON.settings['@default_value'] : '';
        var changed = this.updateJSON({
            id: id,
            text: text
        })
    }
},
_checkValidFormat: function($super) {
    if (!this.options.mandatory)
        return true;
    else if ((Object.isEmpty(this.textGetter())) && (Object.isEmpty(this.idGetter())) && !this.options.visualOpt)
        return false;
    return true;
},
_formattedValue: function(options) {
    //We encode and decode just in case we are receiving non-encoded characters such as & that would make IE not show it properly.
    return value.unescapeHTML().escapeHTML();
},
/**
* Initializes the text input properly.
*/
_initializeModule: function($super) {
    //If we have defined a maximum length
    var maxLength = null;
    if (!Object.isEmpty(this.options.optionsJSON.settings['@length'])) {
        maxLength = parseInt(this.options.optionsJSON.settings['@length'], 10);
        if (maxLength == 0) {
            maxLength = null;
        }
    }

    var toolTip = "";
    if (!Object.isEmpty(this.options.toolTip))
        toolTip = this.options.toolTip;
    this.textFieldElement = new Element("input", {
        "type": "text",
        "class": "fieldDispWidth gcm_catalogInput test_input",
        "value": value,
        "title": value,
        "disabled": "disabled"
    });
    if (!Object.isEmpty(maxLength)) {
        this.textFieldElement.writeAttribute("maxlength", maxLength);
    }
    this._moduleElement.update(this.textFieldElement);
    //Button
    this.catalogButtonElement = new Element("button", {
        "class": "application_catalog_image gcm_catalogButton test_button",
        "title": toolTip
    });
    if (global.liteVersion) {
        //If we are in liteVersion we'll use text instead of image:
        this.catalogButtonElement.insert(global.getLabel("Select"));
    }
    this.catalogButtonElement.observe("click", this._catalogButtonClicked.bind(this));
    this._moduleElement.insert(this.catalogButtonElement);
    
    var value = this.setValue(this.options.value, this.options.text);
    //Calling the parent function
    $super();
},

/**
* Function called when element(s) have been selected and added from the catalog
*/
elementAdded: function(args) {
    var arguments = getArgs(args);
    var items = arguments.get("hash");
    var itemsKeys = items.keys();
    if (itemsKeys.size() > 0) {
        this.setValue(itemsKeys[0], items.get(itemsKeys[0]).childName);
    }
},
/**
* Returns the string we should print for a value and text depending on showtext
* @param {Object} value
* @param {Object} text
*/
_getFormattedValue: function(newValue, newText) {
    var showText = this.options.optionsJSON.settings['@show_text'];
    if (showText == 'B') {
        var text = newText ? newText : "";
        var id = newValue ? newValue : "";
        if (id == "") {
            var value = "";
        } else {
            var value = text + ' ' + global.idSeparatorLeft + id + global.idSeparatorRight;
        }
    }
    else if (Object.isEmpty(showText)) {
        var value = newValue ? newValue : ""; ;
    }
    else {
        var value = newText ? newText : ""; ;
    }
    if (Object.isEmpty(value)) {
        value = "";
    } else {
        value = value.gsub('&#37;', '%').gsub('&#39;', "'").gsub('&#34;', '"');
    }
    if (showText == "x") {
        value = value.unescapeHTML();
    }
    return value;
},
/**
* Sets the value for this field
* @param {Object} newValue
* @param {Object} newText
*/
setValue: function(newValue, newText) {
    this.textFieldElement.value = this._getFormattedValue(newValue, newText);
    this.actualValue = newValue;
    this.actualText = newText;
    this._onFieldChange(true, false);
},
setFocus: function() {
    if (!Object.isEmpty(this.catalogButtonElement) && !this.catalogButtonElement.disabled) {
        Form.Element.focus(this.catalogButtonElement);
    }
},
_setOnChange: function($super) {
},
_setHowToGetValue: function($super) {
    obj =
            {
                id: function() {
                    return this.actualValue;
                } .bind(this),
                text: function() {
                    return this.actualText;
                } .bind(this)
            }
    $super(obj);
},
/**
* Function called when the catalog button is clicked
*/
_catalogButtonClicked: function() {
    var settings = this.options.optionsJSON.settings;
    var appId = settings['@tarap'];
    var view = settings['@views'];
    global.open($H({
        app: {
            appId: appId,
            tabId: 'popup',
            view: view
        },
        multiple: true,
        type: 'radio'
    }));
},
destroy: function($super, html) {
    this.catalogButtonElement.stopObserving("click");
    $super(html);
}
});

fdFactory = new FieldDisplayerFactory();

/**
* Alias for FieldDisplayerFactory#getFieldDisplayer() method
*
* @param {JSON}
*            optionsJSON The options coming from the service in JSON format.
* @param {String}
*            screen The screen reference.
* @param {String}
*            record The record reference.
* @param {String}
*            mode the mode for the field displayer.
* @return FieldDisplayer a new FieldDisplayer object configured according to the options given.
*/
function $FD(optionsJSON, screen, record, key_str, appid, mode, labels, fieldDisplayerModified, cssClasses, xml_in, handler, name, getFieldValueAppend, ramdomId, rowSeqnr, variant, FPObject, dateRanges) {
    return fdFactory.getFieldDisplayer(optionsJSON, screen, record, key_str, appid, mode, labels, fieldDisplayerModified, cssClasses, xml_in, handler, name, getFieldValueAppend, ramdomId, rowSeqnr, variant, FPObject, dateRanges);
}