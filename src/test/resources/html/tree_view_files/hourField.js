var HourField = Class.create(
/**
*@lends hour fieldModule
*/
    {
    /**
    * Reference to an existing element.
    * @type Object
    */
    id: 'hourField',
    /**
    * To show the seconds or not; 1=show, 0=hide
    * @type Int
    */
    viewSecs: 'yes',
    /**
    * The format of the time; 12 hours, 2= 24hours
    * @type Int
    */
    format: '12',
    /**
    * The default time to be shown 
    * @type Int
    */
    defaultTime: '000000', //default time
    /**
    * The variable with the value of the hour introduced by the user 
    * @type Int
    */
    fieldHours: '00',
    /**
    * The variable with the value of the minutes introduced by the user 
    * @type Int
    */
    fieldMinutes: '00',
    /**
    * The variable with the value of the seconds introduced by the user 
    * @type Int
    */
    fieldSeconds: '00',
    /**
    * If format = 12 hours, the user will have to chose am or pm
    * @type String
    */
    fieldAmPm: 'am',
    /**
    * @type Hash 
    * @description The list of event names that can be fired @name objEvents 
    */
    objEvents: null,
    /**
    * First part of the tooltip shoed for each input element
    */
    toolTip: "Hour field",
	/** If an event should be fired upon initialize or not */
    fireEventOnInitialize: null,

    isEndHour: 'no',

    /**
    *@param id Id of the div in which there will be created the hourField
    *@param options Parameters to specify if viewing seconds or not, the time format and the default time
    *@description initialize hourFields
    */
    initialize: function(id, options) {
        if (!$(id)) {
            throw (id + " doesn't exist!");
            return false;
        } else {
            this.id = (Object.isElement(id)) ? id.identify() : id;
            this.virtualObject = $(id);
        }
        //reading parameters from "options". In case the user didn't specify, we use a default one
        if (!Object.isEmpty(options.format)) {
            this.format = options.format;
        }
        else if (global) {
            this.format = global.hourDisplayFormat;
        }
        if (options.defaultTime != '000000' && !(isNaN(options.defaultTime)))
            this.defaultTime = options.defaultTime;
        if (options.viewSecs != 'yes') {
            this.viewSecs = options.viewSecs;
        }
        if (!Object.isEmpty(options.isEndHour) && options.isEndHour != 'no') {
            this.isEndHour = options.isEndHour;
        }
        if (!Object.isEmpty(options.toolTip)) {
            this.toolTip = options.toolTip;
        }
        if (options.mandatory) {
            this.mandatory = true;
        } else {
            this.mandatory = false;
        }
		if (!Object.isEmpty(options.fireEventOnInitialize)){
            this.fireEventOnInitialize = options.fireEventOnInitialize;
        }
        this.options = Object.extend({
            events: null
        }, options || {});
        this.objEvents = this.options.events;
        this.createFields();
    },

    createFields: function() {
        this.inputField = new Element("input", {
            "type": "text",
            "class": "test_input hourField_input",
            "title": this.toolTip
        });
        this.correctValue = this.inputField.on('blur', this.checkDate.bind(this));
        this.virtualObject.insert(this.inputField);

        if (this.format == '12') {
            this.createRadio();
            this.defaultTime = this.calculateHour(this.defaultTime, '12');
        }

        this.fieldMask = new hourFieldMask(this.inputField, global.hourFormat, {
            activate: true,
            defaultValue: this.defaultTime,
            useOnlyVariableCharacters: false,
            viewSecs: this.viewSecs,
            format: this.format,
            isEndHour: this.isEndHour
        });
		if (this.fireEventOnInitialize)
            this.checkDate.bind(this).defer();
    },

    calculateHour: function(hourToConvert, format) {
        if (format == 12) {
            var hour = hourToConvert.substring(0, 2);
            var minutes = hourToConvert.substring(2, 4);
            var seconds = hourToConvert.substring(4, 6);
            if (hour > 12 && hour < 24) {
                hour = hour - 12;
                if (hour.toPaddedString(0).length == 1)
                    hour = "0" + hour;
                this.amRadio.checked = false;
                this.amRadio.defaultChecked = false;
                this.pmRadio.checked = true;
                this.pmRadio.defaultChecked = true;
            }
            else if (hour == 12 && (minutes >= 00 || seconds >= 00)) {
                this.amRadio.checked = false;
                this.amRadio.defaultChecked = false;
                this.pmRadio.checked = true;
                this.pmRadio.defaultChecked = true;
            }
            else {
                if (hour == 00 || hour == 24) {
                    var hour = "12";
                }
                this.amRadio.checked = true;
                this.amRadio.defaultChecked = true;
                this.pmRadio.checked = false;
                this.pmRadio.defaultChecked = false;
            }
            return newTime = hour + minutes + seconds;
        }
    },

    createRadio: function() {
        this.amRadio = new Element('input', {
            'type': 'radio',
            'name': this.id + '_ampm',
            'class': 'test_radioButton',
            'id': this.id + 'AM'
        });
        var labelAm = new Element('label', {
            'for': 'radio',
            'class': 'hourField_ampm test_label'
        }).update('am');
        this.pmRadio = new Element('input', {
            'type': 'radio',
            'name': this.id + '_ampm',
            'class': 'test_radioButton',
            'id': this.id + 'PM'
        });

        var labelPm = new Element('label', {
            'for': 'radio',
            'class': 'hourField_ampm test_label'
        }).update('pm');
        this.virtualObject.insert(this.amRadio);
        this.virtualObject.insert(labelAm);
        this.virtualObject.insert(this.pmRadio);
        this.virtualObject.insert(labelPm);
        this.amRadio.on('change', this.checkDate.bind(this));
        this.pmRadio.on('change', this.checkDate.bind(this));
    },

    setValue: function(newTime) {
        var time = this.calculateHour(newTime, this.format);
        this.fieldMask.setHourValue(time);
    },

    getSapTime: function() {
        var time = this.fieldMask.getSapValue();
        if (!Object.isEmpty(time)) {
            if (this.format == '12') {
                if (this.amRadio.checked) {
                    if (time.am == '120000' && this.options.isEndHour == 'yes') {
                        return time.pm;
                    }
                    else if (time.am == '120000' && this.options.isEndHour == 'no') {
                        return '000000';
                    }
                    else if (this.fieldMask.getHour() == 12) {
                        return '00' + time.am.substring(2, 4) + time.am.substring(4, 6);
                    }
                    else {
                        return time.am;
                    }

                }
                else {
                    if (this.fieldMask.getHour() == 12) {
                        return time.am;
                    }
                    else {
                        return time.pm;
                    }
                }
            }
            else {
                if (time == '000000' && this.options.isEndHour == 'yes')
                    time = '240000';

                return time;
            }
        }
        else {
            return '000000';
        }
    },

    checkDate: function() {
        var hour = this.fieldMask.getHour();
        var minutes = this.fieldMask.getMinutes();
        var secs = this.fieldMask.getSecs();
        if (this.format == '12') {
            if (hour < 01 || hour >= 13) {
                this.showError();
                return false;
            }
            else {
                this.deleteError();
                return true;
            }
        }
        else {
            if (hour > 24) {
                this.showError();
                return false;
            }
            else if (this.isEndHour == 'no' && hour == 24) {
                this.showError();
                return false;
            }
            else if ((this.isEndHour == 'yes' && hour == 24 && (minutes > 0 || secs > 0))) {
                this.showError();
                return false;
            }
            else {
                this.deleteError();
                return true;
            }
        }
    },

    showError: function() {
        if (!Object.isEmpty(this.objEvents) && !Object.isEmpty(this.objEvents.get('onIncorrectTime'))) {
            document.fire(this.objEvents.get('onIncorrectTime'));
        }
        this.inputField.addClassName('datePicker_inputError');
    },

    deleteError: function() {
        if (!Object.isEmpty(this.objEvents) && !Object.isEmpty(this.objEvents.get('onCorrectTime'))) {
            document.fire(this.objEvents.get('onCorrectTime'));
        }
        this.inputField.removeClassName('datePicker_inputError');
    },
    getErrorMessageType: function() {
        //Check if it has errors
        var correct = this.checkDate();
        if (!correct) {
            return "WRONG_HOUR";
        }
        //If no errors, check if mandatory
        if (this.mandatory && this.fieldMask.isEmpty()) {
            return "EMPTY_HOUR";
        }
        return false;
    }
});