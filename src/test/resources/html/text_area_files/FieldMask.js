/**
* Class Field mask
*/
var FieldMask = Class.create({
    //Predefined character definitions
    definitions: $H({
        '9': "[0-9]",
        'a': "[A-Za-z]",
        '*': "[A-Za-z0-9]"
    }),
    //Array with an element for each character in the mask
    mask: null,
    //Array with a boolean in each position of the mask telling if this position is variable or fixed
    variablePosition: null,
    //Array with the content in the input
    inputContent: null,
    //Input element
    input: null,
    //If showMaskOnError is set this will contain the DOM element for the mask
    maskElement: null,
    //Variable that tells us if we are loading, will be set to false after parsing the value for the first time
    _loading: true,

    //Parameters:
    //Character to use (if defined) to use for masking instead of original definitions
    showHolder: "_",
    //Class to be applied to the input element when we are editing
    editingClass: "fieldMask_editing",
    //Class to be applied to the input element it has a wrong value
    invalidValueClass: "fieldMask_error",
    //If set to true we will show the mask when the input is not valid
    showMaskOnError: false,
    //Class for the mask shown on error
    showMaskClass: "fieldMask_mask",
    //If set to true we'll receive and send only variable characters. For example if we have (999) 999 mask we'll only send/receive: "999999"
    useOnlyVariableCharacters: false,

    /**
    * Initialize an object of the class
    * @param {Object} input The input DOM element to apply the mask
    * @param {Object} mask The mask. If it includes "\" this character will be ignored, but will make the next fixed (even if it's a "9", an "a" or a "*")
    * @param {Object} options Options:
    *     - activate (true): if set to false the mask will have be explicitly activated with "activate" function
    *     - showMaskOnError (false): if set to true we will show the mask below to help the user
    *     - showMaskClass (fieldMask_mask): class that will be applied to the mask (if we show it)
    *     - showHolder (false): if set to a character, this character will be show instead the original definitions. For example if we use "_":
    *         [(___) ___ ___]  instead of [(###) aaa ###]    
    *     - editingClass (editingMaskedField): class to be applied to the input element when we are editing
    *     - invalidValueClass (fieldMask_error): class to be applied to the input element it has a wrong value
    *     - useOnlyVariableCharacters (false): if set to true we'll receive and send only variable characters. For example if we have (999) 999 mask we'll only send/receive: "999999"
    */
    initialize: function(input, mask, options) {
        this._loading = true;
        this.input = input;
        //Process options:
        if (options) {
            if (options.showHolder && Object.isString(options.showHolder))
                this.showHolder = options.showHolder;
            if (options.showMaskOnError && options.showMaskOnError == true)
                this.showMaskOnError = options.showMaskOnError;
            if (options.useOnlyVariableCharacters && options.useOnlyVariableCharacters == true)
                this.useOnlyVariableCharacters = options.useOnlyVariableCharacters;
            if (options.editingClass && Object.isString(options.editingClass))
                this.editingClass = options.editingClass;
            if (options.invalidValueClass && Object.isString(options.invalidValueClass))
                this.invalidValueClass = options.invalidValueClass;
            if (options.showMaskClass && Object.isString(options.showMaskClass))
                this.showMaskClass = options.showMaskClass;
        }
        //Create a div to contain the mask if needed
        if (this.showMaskOnError) {
            this.maskElement = new Element("div", {
                "class": this.showMaskClass
            });
            this.maskElement.innerHTML = mask;
            this.maskElement.hide();
            this.input.insert({
                after: this.maskElement
            });
        }
        var defaultValue = null;
        if (options && options.defaultValue) {
            defaultValue = options.defaultValue;
        }
        //Parse the mask
        this._parseMask(mask);
        //Activate the mask on loading if it's in the options
        if (options && !Object.isUndefined(options.activate) && options.activate) {
            this.activate(defaultValue);
        }
    },

    /**
    * Activates the masking for the field
    * @param {Object} defaultValue If we want to set a default value in the beginning
    */
    activate: function(defaultValue) {
        //Add the event handlers:
        if (!this.input.readAttribute("readonly")) {
            this.input.observe('focus', this._focusHandler.bindAsEventListener(this));
            this.input.observe('mouseup', this._mouseupHandler.bindAsEventListener(this));
            this.input.observe('blur', this._blurHandler.bind(this));
            this.input.observe('keydown', this._keydownHandler.bindAsEventListener(this));
            this.input.observe('keypress', this._keypressHandler.bindAsEventListener(this));
        }
        //Check if the input is already in the DOM
        if (Object.isEmpty(this.input.id)) {
            var newId = "maskedField" + Math.random();
            this.input.id = newId;
        }
        if (Object.isElement($(this.input.id))) {
            //If it's already in the DOM we call parseValue directly
            this._parseValue(defaultValue);
        } else {
            //If not loaded yet, we wait till it's loaded
            this._parseValue.bind(this, defaultValue).defer();
            //this.input.observe('load', this._loadHandler.bindAsEventListener(this));
        }

    },
    /**
    * Function called when the element is loaded
    */
    _loadHandler: function() {
        this._parseValue();
    },
    /**
    * Deactivates the masking. Must be called when destroying or not using the field to avoid having unnecessary event listeners.
    */
    deactivate: function() {
        if (!this.input.readAttribute("readonly")) {
            this.input.stopObserving('focus');
            this.input.stopObserving('mouseup');
            this.input.stopObserving('blur');
            this.input.stopObserving('keydown');
            this.input.stopObserving('keypress');
            this.input.stopObserving('load');
        }
    },

    /**
    * Function that tells if all editable positions are empty
    */
    isEmpty: function() {
        if (Object.isEmpty(this.inputContent)) {
            //If the Object is still not fully created, we assume it is still empty
            return true;
        }
        var isEmpty = true;
        for (var i = 0; i < this.mask.size(); i++) {
            if (this.variablePosition[i]) {
                if (this.inputContent[i] != this.showHolder) {
                    isEmpty = false;
                    break;
                }
            }
        }
        return isEmpty;
    },
    /**
    * Function that tells if the value is correct. If not correct the "invalidValueClass" will be used.
    */
    isValid: function(mandatory) {
        //If not mandatory, we will see if it's empty. If empty, then it is correct
        if (!mandatory) {
            if (this.isEmpty()) {
                //If it is empty, it's ok. If not, we'll see if it is correct
                return true;
            }
        }

        var valid = true;
        //For each position it will check if it's variable and matchs,
        //and if it's not variable if it has the correct fixed value
        for (var i = 0; i < this.mask.size(); i++) {
            if (this.variablePosition[i]) {
                if (!this.inputContent[i].match(this.mask[i].regExp)) {
                    valid = false;
                    break;
                }
            } else {
                if (this.inputContent[i] != this.mask[i].show) {
                    valid = false;
                    break;
                }
            }
        }
        if (valid) {
            this.input.removeClassName(this.invalidValueClass);
            if (this.showMaskOnError)
                this.maskElement.hide();
        } else {
            this.input.addClassName(this.invalidValueClass);
            if (this.showMaskOnError)
                this.maskElement.show();
        }
        return valid;
    },

    /**
    * Sets a value and parses it
    * @param {Object} newValue The new value to set
    */
    setValue: function(newValue) {
        if (this.useOnlyVariableCharacters) {
            //If we only receive variable characters:
            var valueToUse = "";
            var newValueV = newValue.toArray();
            var j = 0;
            for (var i = 0; i < this.variablePosition.size(); i++) {
                if (this.variablePosition[i]) {
                    if (j < newValueV.size()) {
                        valueToUse += newValueV[j];
                        j++;
                    } else {
                        valueToUse += this.mask[i].show;
                    }
                } else {
                    valueToUse += this.mask[i].show;
                }
            }
            newValue = valueToUse;
        }
        this.input.value = newValue;
        this._parseValue();
        this.isValid();
    },


    /**
    * Gets the value of the field. If "useOnlyVariableCharacters" we will return only the characters that are modifiable.
    */
    getValue: function() {
        if (this.useOnlyVariableCharacters) {
            var result = "";
            //If we only send variable characters:
            var actualValue = $F(this.input);
            var actualValueV = actualValue.toArray();

            for (var i = 0; i < this.variablePosition.size(); i++) {
                if (this.variablePosition[i]) {
                    if (i < actualValueV.size()) {
                        result += actualValueV[i];
                    }
                }
            }
            return result;
        } else {
            return $F(this.input);
        }
    },

    /**
    * Returns true if the field has been loaded
    */
    isLoaded: function() {
        return !this._loading;
    },
    /**
    * Parses the mask received as parameter, storing it in this.mask and this.variablePosition
    * @param {Object} mask The mask
    */
    _parseMask: function(mask) {
        var maskElements = mask.toArray();
        this.mask = $A();
        this.variablePosition = $A();
        for (var i = 0; i < maskElements.size(); i++) {
            if (maskElements[i] == "\\") {
                //If we have the "\" character, we will use the next character as fixed
                i++;
                //Take into account next character only, but taking care of being inside the array
                if (i < maskElements.size()) {
                    this.mask.push({
                        regExp: null,
                        show: maskElements[i]
                    });
                    this.variablePosition.push(false);
                }
            }
            else {
                if (this.definitions.get(maskElements[i])) {
                    //This character is variable
                    var show = maskElements[i];
                    if (this.showHolder)
                        show = this.showHolder;
                    this.mask.push({
                        regExp: this.definitions.get(maskElements[i]),
                        show: show
                    });
                    this.variablePosition.push(true);
                } else {
                    //This character is fixed
                    this.mask.push({
                        regExp: null,
                        show: maskElements[i]
                    });
                    this.variablePosition.push(false);
                }
            }
        }
    },

    /**
    * Parses the actual content of the input: subtitutes every wrong character with their holder,
    * and fills the characters that are not present
    * @param {Object} defaultValue If it has a default value
    */
    _parseValue: function(defaultValue) {
        if (Object.isString(defaultValue)) {
            //If we want a default value we will call to setValue that already calls again _parseValue
            this.setValue(defaultValue);
        } else {
            this.inputContent = $A();
            var actualValue = $F(this.input);
            var actualValueV = actualValue.toArray();
            //If there are more elements in the actual value than they should be, we remove them
            while (actualValueV.size() > this.mask.size()) {
                actualValueV.pop();
            }
            //For each present character: if its correct we leave it, if not, we set its default value in this position:
            for (var i = 0; i < actualValueV.size(); i++) {
                if (this.variablePosition[i]) {
                    //If the character is correct:
                    if (actualValueV[i].match(this.mask[i].regExp)) {
                        this.inputContent.push(actualValueV[i]);
                    } else {
                        //If not ok we use the holder character for this position:
                        this.inputContent.push(this.mask[i].show);
                    }
                } else {
                    this.inputContent.push(this.mask[i].show);
                }
            }
            //We fill the remaining characters if there are any
            for (i; i < this.mask.size(); i++) {
                this.inputContent.push(this.mask[i].show);
            }
            //Update the input with the new value
            this.input.value = this.inputContent.join('');
            //Check if it's valid or not, to mark it as incorrect if needed
            this.isValid();
        }
        if (this._loading) {
            this._loading = false;
        }
    },

    /**
    * Function called when focusing on the field
    */
    _focusHandler: function(event) {
        //Gets the actual selection
        var selection = this._selection();
        //Makes sure all the characters in the selection are editable
        //this._moveToNextEditablePosition(selection);
        this._selection(0);
        //Applies the style for editing:
        this.input.addClassName(this.editingClass);
    },

    /**
    * Function called when focusing on the field
    */
    _mouseupHandler: function(event) {
        //Gets the actual selection
        var selection = this._selection();
        //Makes sure all the characters in the selection are editable
        this._moveToNextEditablePosition(selection);
        //Parse the value: sometimes this event is triggered when the user moves text to the box
    },

    /**
    * Function called when the input has lost focus
    */
    _blurHandler: function() {
        //Remove the editing class
        this.input.removeClassName(this.editingClass);
        this._parseValue();
    },

    /**
    * Function called on keydown event
    */
    _keydownHandler: function(event) {
        //Gets the actual selection
        var selection = this._selection();
        var begin = selection.begin;
        var end = selection.end;
        var newKey = event.charCode || event.keyCode || event.which;

        if (newKey == Event.KEY_HOME) {
            //First editable position
            this._moveToNextEditablePosition({ begin: 0, end: 0 });
            Event.stop(event);
            return false;
        } else if (newKey == Event.KEY_END) {
            //Last editable position
            this._moveToPreviousEditablePosition({ begin: this.mask.size(), end: this.mask.size() });
            Event.stop(event);
            return false;
        } else if (newKey == Event.KEY_BACKSPACE) {
            //If we have some text selected we delete it
            for (var i = begin; i < end; i++) {
                this.inputContent[i] = this.mask[i].show;
            }

            //We look for the previous editable position:
            i = begin - 1;
            while (!this.variablePosition[i] && i >= 0) {
                i--;
            }
            if (this.variablePosition[i]) {
                this.inputContent[i] = this.mask[i].show;
                this.input.value = this.inputContent.join('');
            }
            this.input.value = this.inputContent.join('');

            //Position the cursor
            this._moveToPreviousEditablePosition.bind(this, selection).defer();
            Event.stop(event);
            return false;
        } else if (newKey == Event.KEY_DELETE) {
            //If we have some text selected we delete it
            for (var i = begin; i < end; i++) {
                this.inputContent[i] = this.mask[i].show;
            }
            this.input.value = this.inputContent.join('');
            this._moveToNextEditablePosition.bind(this, selection).defer();
            Event.stop(event);
            return false;
        } else if (newKey == Event.KEY_LEFT || newKey == Event.KEY_UP) {
            //Previous editable position
            this._moveToPreviousEditablePosition(selection);
            Event.stop(event);
            return true;
        } else if (newKey == Event.KEY_RIGHT || newKey == Event.KEY_DOWN) {
            //First editable position
            this._moveToNextEditablePosition({ begin: begin + 1, end: end + 1 });
            Event.stop(event);
            return true;
        }
    },

    /**
    * Function called on keypress event
    * @param {Object} event
    */
    _keypressHandler: function(event) {
        //Gets the actual selection
        var selection = this._selection();
        var begin = selection.begin;
        var end = selection.end;
        var newKey = event.charCode || event.keyCode || event.which;

        //If we have any of these special keys we just continue with the normal event
        if (newKey == Event.KEY_RIGHT || newKey == Event.KEY_DOWN || newKey == Event.KEY_LEFT || newKey == Event.KEY_UP
        || newKey == Event.KEY_END || newKey == Event.KEY_HOME || newKey == 9) {
            return;
        }
        //Take care of typeable characters:
        if ((newKey >= 32 && newKey <= 125) || newKey > 186) {
            //If the character is correct in this position, we keep it.
            var newChar = String.fromCharCode(newKey);
            var correct = false;
            if (this.variablePosition[begin]) {
                if (newChar.match(this.mask[begin].regExp)) {
                    //The character is correct
                    this.inputContent[begin] = newChar;
                    correct = true;
                } else {
                    //The character is not correct
                    this.inputContent[begin] = this.mask[begin].show;
                    correct = false;
                }
            }
            //If we had selected text, we remove the other characters
            if (begin != end) {
                for (var i = begin + 1; i < end; i++) {
                    this.inputContent[i] = this.mask[i].show;
                }
            }

            //Then we go to the next editable position
            if (correct) {
                selection.begin = begin + 1;
                selection.end = begin + 1;
            } else {
                selection.end = begin;
            }
            this.input.value = this.inputContent.join('');
            this._moveToNextEditablePosition(selection);
            this.isValid();
        }
        Event.stop(event);

    },

    /**
    * Moves the cursor to the previous editable position
    * @param {Object} selection
    */
    _moveToPreviousEditablePosition: function(selection) {
        if (!selection) {
            var selection = this._selection();
        }
        var begin = selection.begin - 1;
        for (i = begin; i >= 0; i--) {
            if (this.variablePosition[i]) {
                //Place selection in this position
                this._selection(i);
                break;
            }
        }
    },
    /**
    * If selection is simple will move the cursor to the next editable position
    * (or the same if it's editable), or to the end if there is no next editable position.
    * If selection is multiple it will stretch it so every character is editable in the selection   
    * @param {Object} selection
    */
    _moveToNextEditablePosition: function(selection) {
        if (!selection) {
            var selection = this._selection();
        }
        var begin = selection.begin;
        var end = selection.end;

        if (begin == end) {
            //Simple selection
            for (i = begin; i < this.variablePosition.size(); i++) {
                if (this.variablePosition[i]) {
                    //Place selection in this position
                    this._selection(i);
                    break;
                }
            }
            if (i == this.variablePosition.size()) {
                //If we reached the final position we go back to the last editable position
                //this._moveToPreviousEditablePosition({ begin: i, end: i });
            }
        } else {
            //Multiple selection
            //Seek the next editable position and store it in begin:
            while (begin < this.variablePosition.size() && !this.variablePosition[begin])
                begin++;

            //Now seek the position from end where all the characters are editable
            if (end <= begin) {
                var newEnd = begin;
            } else {
                var newEnd = begin;
                while (newEnd < this.variablePosition.size() && newEnd < end && this.variablePosition[newEnd])
                    newEnd++;
            }
            this._selection(begin, newEnd);
        }
    },

    /**
    * Sets or gets the selection in the input: If we don't specify parameters it will return the begin and end.
    * If we specify beggining it will set the cursor in this position
    * If we specify both we will make the selection as they indicate 
    * @param {Object} begin The beginning of the desired selection
    * @param {Object} end The end of the deired selection
    */
    _selection: function(begin, end) {
        //If we specified a beginning and end
        if (typeof begin == 'number') {
            end = (typeof end == 'number') ? end : begin;
            if (this.input.setSelectionRange) {
                this.input.focus();
                this.input.setSelectionRange(begin, end);
            } else if (this.input.createTextRange) {
                var range = this.input.createTextRange();
                range.collapse(true);
                range.moveEnd('character', end);
                range.moveStart('character', begin);
                range.select();
            }
        } else {
            if (this.input.setSelectionRange) {
                try {
                    begin = this.input.selectionStart;
                    end = this.input.selectionEnd;
                } catch (e) {
                    begin = 1;
                    end = 1;
                }

            } else if (document.selection && document.selection.createRange) {
                var range = document.selection.createRange();
                begin = 0 - range.duplicate().moveStart('character', -100000);
                end = begin + range.text.length;
            }
            //check if we are out of bounds:
            if (begin < 0 || begin > $F(this.input).length)
                begin = 0;
            if (end < 0 || end > $F(this.input).length)
                end = 0;
            return { begin: begin, end: end };
        }
    },

    /**
    * Destroys the fieldMask
    */
    destroy: function() {
        this.deactivate();
    }
});

/**
* Class Currency Field mask
*/
var CurrencyFieldMask = Class.create(FieldMask, {

    //Class to be applied to the input element when we are editing
    editingClass: "currencyFieldMask_editing",
    //Maximum number of decimals (-1 for no limit)
    maxDecimals: -1,
    //Maximum number of digits in the integer part (-1 for no limit)
    maxIntegers: -1,
    //Separator for thousands
    thousandsSeparator: ".",
    //Separator for decimals:
    decimalSeparator: ".",
    //Separator for millions:
    millionsSeparator: ",",
    //If set to true the decimal part will be filled with zeros to complete its size.
    alwaysShowDecimals: false,
    /**
    * Initializes the mask
    * @param {Object} $super The super constructor
    * @param {Object} input The input element
    * @param {Object} mask The mask to apply
    * @param {Object} options Other options, (see FieldMask class). Specific options:
    *      - maxDecimals: maximum number of decimals to show (-1 for no limit)
    *      - maxIntegers: maximum number of integers to show (-1 for no limit)
    *      - alwaysShowDecimals: if set to true the decimal part will be filled with zeros to complete its size.
    */
    initialize: function($super, input, mask, options) {
        //Process specific options:
        if (options) {
            if (Object.isNumber(options.maxDecimals)) {
                this.maxDecimals = options.maxDecimals;
            }
            if (Object.isNumber(options.maxIntegers)) {
                this.maxIntegers = options.maxIntegers;
            }
            if (options.alwaysShowDecimals && options.alwaysShowDecimals == true) {
                this.alwaysShowDecimals = options.alwaysShowDecimals;
            }
        }

        this._adaptFieldLength(input);

        $super(input, mask, options);
    },


    /**
    * Function that changes the length of the field if it's not enough to contain all possible characters
    * @param {Object} input The input DOM element we want to adapt
    */
    _adaptFieldLength: function(input) {
        if (this.maxIntegers > 0) {
            //If we have a fied number of decimals and Integer, at least them should fit
            var actualLength = input.maxLength;
            var neededSeparators = Math.floor((this.maxIntegers - 1) / 3);
            if (this.maxDecimals != 0) {
                //If we can have decimals we needed an space for decimal separator
                neededSeparators++;
            }
            var neededDecimals = 0;
            if (this.maxDecimals != -1) {
                neededDecimals = this.maxDecimals;
            }
            var needed = this.maxIntegers + neededSeparators + neededDecimals + 1; // +1 because of the possible - sign

            if (actualLength < needed) {
                input.maxLength = needed;
            }
        }
    },
    /**
    * Function that tells if the value is correct. If not correct the "invalidValueClass" will be used.
    */
    isValid: function(mandatory) {
        //If mandatory is true we'll check if the field is empty:
        if (mandatory == true) {
            return !Object.isEmpty($F(this.input));
        } else {
            return true;
        }
    },

    /**
    * Sets a value and parses it
    * @param {Object} newValue The new value to set
    */
    setValue: function(newValue) {
        this.input.value = newValue;
        this._parseValue();
        this.isValid();
    },

    /**
    * Returns the value for the field
    */
    getValue: function() {
        return $F(this.input);
    },

    /**
    * Parses the mask to see which is the separator for thousands and which for decimals
    * @param {Object} mask The mask: format: 1.234.567,89 (you can change the characters for thousands and decimals separator)
    */
    _parseMask: function() {
        this.millionsSeparator = global.numberFormat.charAt(1);
        this.thousandsSeparator = global.numberFormat.charAt(5);
        this.decimalSeparator = global.numberFormat.charAt(9);
    },

    /**
    * Parses the actual content of the input
    * @param {Object} positionAfter tells if the cursor should be positioned in the right position after parsing
    */
    _parseValue: function(positionAfter) {
        var valueV = this.input.value.toArray();

        //Gets the actual selection
        var selection = this._selection();
        var begin = selection.begin;
        var end = selection.end;

        //See if we are before or after the decimal separator
        var beforeDecimals = true;
        if (this.maxDecimals > 0 && begin > this.input.value.indexOf(this.decimalSeparator) && this.input.value.indexOf(this.decimalSeparator) != -1) {
            beforeDecimals = false;
        }

        //Store cursor position
        var i = 0;
        var numbersBefore = 0;
        while (i < begin && i < valueV.size()) {
            if (valueV[i].match("[0-9]"))
                numbersBefore++;
            i++;
        }
        var newValue = "";

        //Check if it's negative:
        var signPart = "";
        if (valueV[0] == "-") {
            signPart = "-";
        }

        //Remove every character that is non important:
        var decimalAdded = false;
        for (var i = 0; i < valueV.size(); i++) {
            //If it's a number
            if (valueV[i].match("[0-9]")) {
                newValue += valueV[i];
            }
            //If is decimal separator (only add the first one)
            if (!decimalAdded && valueV[i] == this.decimalSeparator) {
                newValue += valueV[i];
                decimalAdded = true;
            }
        }

        //Separate with thousands separator the left part
        var numberParts = newValue.split(this.decimalSeparator);
        var leftPart = numberParts[0];
        //Remove unnecesary 0s:
        if (leftPart.length > 1 && leftPart.startsWith("0")) {
            var leftPartV = leftPart.toArray();
            while (leftPartV.size() > 1 && leftPartV[0] == "0") {
                //Remove the first one
                leftPartV.splice(0, 1);
                numbersBefore--;
            }
            leftPart = leftPartV.join("");
        }


        var rightPart = "";
        if (numberParts.size() == 2) {
            rightPart = numberParts[1];
        }
        var period = 0;
        var firstSeparator = true;
        var newLeftPart = "";
        //Limit the decimal part if needed
        if (this.maxIntegers > 0) {
            leftPart = leftPart.truncate(this.maxIntegers, "");
        } else if (this.maxIntegers == 0) {
            leftPart = "";
        }
        leftPart = leftPart.toArray();
        for (var i = leftPart.size() - 1; i >= 0; i--) {
            if (period == 3) {
                if (firstSeparator) {
                    var separator = this.thousandsSeparator;
                    firstSeparator = false;
                } else {
                    var separator = this.millionsSeparator;
                }

                newLeftPart = separator + newLeftPart;
                period = 1;
            } else {
                period++;
            }
            newLeftPart = leftPart[i] + newLeftPart;
        }
        //Limit the decimal part if needed
        if (this.maxDecimals > 0) {
            rightPart = rightPart.truncate(this.maxDecimals, "");
            //Fill with zeros id needed
            if (this.alwaysShowDecimals) {
                while (rightPart.length < this.maxDecimals) {
                    rightPart += "0";
                }
            }
        } else if (this.maxDecimals == 0) {
            rightPart = "";
        }

        //Set the new value:
        newValue = signPart + newLeftPart;
        if (this.maxDecimals > 0 && (rightPart.toArray().size() > 0 || decimalAdded)) {
            newValue += this.decimalSeparator + rightPart;
        }
        if (this.input.value != newValue) {
            this.input.value = newValue;
            //Position the cursor:
            if (positionAfter) {
                this._positionAfterNumbers.bind(this, numbersBefore + 1, beforeDecimals).defer();
            }
        }

    },

    /**
    * Function called when focusing on the field
    */
    _focusHandler: function(event) {
        this.input.addClassName(this.editingClass);
    },

    /**
    * Positions the cursor after some number of digits
    * @param {Object} numbersBefore
    * @param {Boolean} beforeDecimals if the cursor was beforethe decimals
    */
    _positionAfterNumbers: function(numbersBefore, beforeDecimals) {
        //Now we position the cursor in the same place (counting the numbers)
        var newNumbersBefore = 0;
        var i = 0;
        var newValueV = this.input.value.toArray();
        while (i < newValueV.size()) {
            if (newValueV[i].match("[0-9]"))
                newNumbersBefore++;
            if (newNumbersBefore == numbersBefore) {
                break;
            }
            i++;
        }
		var separatorPos = this.input.value.indexOf(this.decimalSeparator);
        if (beforeDecimals && separatorPos < i && separatorPos>-1 && this.maxDecimals>0) {
            i = this.input.value.indexOf(this.decimalSeparator);
        }
        this._selection(i);
    },

    /**
    * Function called when focusing on the field
    */
    _mouseupHandler: function(event) { },

    /**
    * Function called when the input has lost focus
    */
    _blurHandler: function() {
        //Remove the editing class
        this.input.removeClassName(this.editingClass);
        this._parseValue(false);
    },

    /**
    * Function called on keydown event
    */
    _keydownHandler: function(event) {
        var newKey = event.charCode || event.keyCode || event.which;
        //If we are deleting with backspace we will have to ignore the separators for thousands and millions
        if (newKey == Event.KEY_BACKSPACE) {
            var selection = this._selection();
            var begin = selection.begin;
            if (begin > 0 && this.input.value.toArray()[begin - 1] == this.decimalSeparator) {
                //We are deleting the decimal separator, just ignore it and go to the previous position
                this._selection(begin - 1);
                Event.stop(event);
                return;
            }
            this._parseValue.bind(this, true).defer();
            return;
        }
        if (newKey == Event.KEY_DELETE && Prototype.Browser.IE) {
            //Fix for IE: the DEL key didn't work
            this._parseValue.bind(this, true).defer();
            return;
        }
    },

    /**
    * Function called on keypress event
    * @param {Object} event
    */
    _keypressHandler: function(event) {
        var newKey = event.charCode || event.keyCode || event.which;
        //If we have any of these special keys we just continue with the normal event
        if (newKey == Event.KEY_RIGHT || newKey == Event.KEY_DOWN || newKey == Event.KEY_LEFT || newKey == Event.KEY_UP || newKey == Event.KEY_END
         || newKey == Event.KEY_HOME || newKey == 9) {
            return;
        }
        //Parsing the value after deleting
        if (newKey == Event.KEY_DELETE) {
            this._parseValue.bind(this, true).defer();
            return;
        }
        //If we are deleting with backspace we will have to ignore the separators for thousands and millions
        if (newKey == Event.KEY_BACKSPACE) {
            var selection = this._selection();
            var begin = selection.begin;
            this._parseValue.bind(this, true).defer();
            return;
        }
        var newChar = String.fromCharCode(newKey);

        //If minus key is pressed (we switch from negative to positive)
        if (newChar == "-") {
            var value = $F(this.input).toArray();
            if (value.length > 0) {
                var selection = this._selection();
                var begin = selection.begin;
                if (value[0] == "-") {
                    //Make positive
                    begin--;
                    this.input.value = value.toArray().splice(1, value.length - 1).join('');
                } else {
                    //Make negative
                    begin++;
                    this.input.value = "-" + value.join('');
                }
                this._parseValue.bind(this, false);
                this._selection(begin);
            }
            Event.stop(event);
            return;
        }

        //Take care of typeable characters:
        if ((newKey >= 48 && newKey <= 57) || newChar == this.decimalSeparator) {
            if (newChar.match("[0-9]") || newChar == this.decimalSeparator) {
                this._parseValue.bind(this, true).defer();
                return;
            }
        }
        Event.stop(event);
    },
    /**
    * Function that tells if all editable positions are empty
    */
    isEmpty: function() {
        if (this.input.value && this.input.value != "") {
            return false;
        } else {
            return true;
        }
    }
});

/**
* Class digit only Field mask
*/
var DigitOnlyFieldMask = Class.create({
    //Input element
    input: null,
    /**
    * Initializes the mask
    * @param {Object} input The input element
    */
    initialize: function(input) {
        this.input = input;
        if (!this.input.readAttribute("readonly")) {
            this.input.observe('keypress', this._keypressHandler.bindAsEventListener(this));
        }
    },
    /**
    * Called when destroying the object
    */
    destroy: function() {
        this.deactivate();
    },
    /**
    * Stops observing the events
    */
    deactivate: function() {
        if (!this.input.readAttribute("readonly")) {
            this.input.stopObserving('keypress');
        }
    },
    /**
    * Function called on keypress event
    * @param {Object} event
    */
    _keypressHandler: function(event) {
        var newKey = (event.which) ? event.which : event.keyCode;

        // Firefox raises events for special keys, so we need to check for it and let the event pass when necessary
        if (Prototype.Browser.Gecko) {
            if (event.keyCode == Event.KEY_RIGHT || event.keyCode == Event.KEY_DOWN || event.keyCode == Event.KEY_LEFT || event.keyCode == Event.KEY_UP || event.keyCode == Event.KEY_END
            || event.keyCode == Event.KEY_HOME || event.keyCode == 9 || event.keyCode == Event.KEY_BACKSPACE || event.keyCode == Event.KEY_DELETE) {
                return;
            }
        }
        // If it's not a number cancel the event
        if (newKey > 31 && (newKey < 48 || newKey > 57)) {
            Event.stop(event);
        }
    },

    /**
    * Sets the value for this field: removes all non-digit characters
    * @param {Object} value
    */
    setValue: function(value) {
        if (value) {
            var valueV = value.toArray();
            var result = "";
            for (var i = 0; i < valueV.size(); i++) {
                if (valueV[i].match("[0-9]")) {
                    result += valueV[i];
                }
            }
            this.input.value = result;
        }
    },
    /**
    * Gets the value from the field
    */
    getValue: function() {
        return this.input.value;
    },
    /**
    * Returns true if the content is valid ()
    * @param {Object} mandatory
    */
    isValid: function(mandatory) {
        if (mandatory && mandatory == true) {
            return (this.input.value.length > 0);
        } else {
            return true;
        }
    },
    /**
    * Function that tells if all editable positions are empty
    */
    isEmpty: function() {
        if (this.input.value && this.input.value != "") {
            return false;
        } else {
            return true;
        }
    }
});

/**
* Abstrac class for all the events masks
*/
var eventsMasks = Class.create(FieldMask, {
    /** Position of day sub-field inside the field (0,1 or 2) */
    firstPosition: null,
    /** Position of month sub-field inside the field (0,1 or 2) */
    secondPosition: null,
    /** Position of year sub-field inside the field (0,1 or 2) */
    thirdPosition: null,
    /** Boolean that tells if the shift key is being pressed at the moment */
    shiftPressed: false,
    /** Boolean that tells if the control key is being pressed at the moment */
    controlPressed: false,
    /** Array with the position (beginning and end) for each field. It also stores if it is "day", "month" or "year" */
    subFieldsPosition: null,

    /**
    * Initializes the mask
    * @param {Object} $super The super constructor
    * @param {Object} input The input element
    * @param {Object} mask The mask to apply
    */
    initialize: function($super, input, mask, options) {
        $super(input, mask, options);
    },

    /**
    * Activates the masking for the field
    * @param {Object} defaultValue If we want to set a default value in the beginning, format: YYYYMMDD
    */
    activate: function($super, defaultValue) {
        $super(defaultValue);
    },

    /**
    * Function that tells if the value is correct. If not correct the "invalidValueClass" will be used.
    */
    isValid: function(mandatory) {
        //If mandatory is true we'll check if the field is empty:
        if (mandatory == true) {
            return !Object.isEmpty($F(this.input));
        } else {
            return true;
        }
    },

    /**
    * Function called when the input has lost focus
    */
    _blurHandler: function() {
        this._fillIncompleteSubFields(true);
        this._parseValue(false);
        //Showing mask to ease input if it is empty
        this._showMask();
    },

    /**
    * Sets a value and parses it
    * @param {Object} newValue The new value to set
    */
    setValue: function(newValue) {
        this.input.value = newValue;
        this._parseValue();
        this.isValid();
    },

    /**
    * Function called when the users stop pressing a key. We use it to know when the shift fey is being pressed 
    * @param {Object} event
    */
    _keyupHandler: function(event) {

        var newKey = event.charCode || event.keyCode || event.which;
        if (newKey == 16) {
            this.shiftPressed = false;
        } else if (newKey == 17) {
            this.controlPressed = false;
        } else {
            this._fillIncompleteSubFields(false);
        }
        //When we input a number, we change the style because we are no longer showing the mask
        if ((newKey >= 48 && newKey <= 57)||(newKey >= 96 && newKey <= 105)) {
            this.input.removeClassName("datePicker_showingMask");
        }
    },


    /**
    * Function called on keydown event
    */
    _keydownHandler: function($super, event) {
        var newKey = event.charCode || event.keyCode || event.which;
        //If pressing Shift
        if (newKey == 16) {
            this.shiftPressed = true;
        } else if (newKey == 17) {
            this.controlPressed = true;
            $super(event);
        } else {
            if (newKey == Event.KEY_TAB) {
                if (this.shiftPressed) {
                    //Pressing Shift+TAB
                    var thereIsPreviousField = this._goToPreviousSubField();
                    //If we didn't go to the previous sub field, because there was non, we keep the normal flow
                    if (thereIsPreviousField) {
                        Event.stop(event);
                    } else {
                        $super(event);
                    }
                } else {
                    //Pressing TAB
                    var thereIsNextField = this._goToNextSubField();
                    //If we didn't go to the next sub field, because there was non, we keep the normal flow
                    if (thereIsNextField) {
                        Event.stop(event);
                    } else {
                        $super(event);
                    }
                }
            }
            else {
                //If it is not TAB or Shift, keep the normal flow
                $super(event);
            }
        }
    },

    /**
    * Function called when focusing on the field
    */
    _mouseupHandler: function(event) {
        //Do nothing so we allow to select and copy the date		
    },

    /**
    * Function called when focusing on the field
    */
    _focusHandler: function(event) {
        //Gets the actual selection
        var selection = this._selection();
        //Makes sure all the characters in the selection are editable
        this._moveToNextEditablePosition(selection);
    },

    /**
    * Moves the cursor to the next subField. If we are in the last we will return false,
    * so it can continue with the normal flow for the event.
    * @return true if the cursor has been moved, false if we already were in the last subField
    */
    _goToNextSubField: function() {
        var actualSubField = this._getActualSubField();
        if (actualSubField == null || actualSubField == 2) {
            return false;
        } else {
            actualSubField++;
            //Look for the begining of this sub-field
            var positionToSet = this.subFieldsPosition[actualSubField].begin;
            this._selection(positionToSet);
            return true;
        }
    },

    /**
    * Moves the cursor to the previous subField. If we are in the first we will return false,
    * so it can continue with the normal flow for the event.
    * @return true if the cursor has been moved, false if we already were in the first subField
    */
    _goToPreviousSubField: function() {
        var actualSubField = this._getActualSubField();
        if (actualSubField == 0) {
            return false;
        } else {
            actualSubField--;
            //Look for the begining of this sub-field
            if (actualSubField < 0 || actualSubField > 2) {
                actualSubField = 0;
            }
            var positionToSet = this.subFieldsPosition[actualSubField].begin;
            this._selection(positionToSet);
            return true;
        }
    },

    /**
    * Overwriting so when control is pressed we keep the normal flow
    * @param {Object} $super
    * @param {Object} event
    */
    _keypressHandler: function($super, event) {
        var newKey = event.charCode || event.keyCode || event.which;
        if (newKey != 17) {
            if (!this.controlPressed) {
                $super(event);
            }
        }

    },

    /**
    * Gets the index of the sub field we are in (0, 1 or 2)
    */
    _getActualSubField: function() {
        var position = this._selection().begin;
        for (var i = 0; i < this.subFieldsPosition.size(); i++) {
            if (position >= this.subFieldsPosition[i].begin && position <= this.subFieldsPosition[i].end) {
                return i;
            }
        }
        return null;
    },
    /**
    * Returns true if any of the variable positions are empty
    */
    isIncomplete: function() {
        if (Object.isEmpty(this.inputContent)) {
            //If the Object is still not fully created, we assume it is still not complete
            return true;
        }
        var complete = true;
        //For each position it will check if it's variable and matchs,
        //and if it's not variable if it has the correct fixed value
        for (var i = 0; i < this.mask.size(); i++) {
            if (this.variablePosition[i]) {
                if (!this.inputContent[i].match(this.mask[i].regExp)) {
                    complete = false;
                    break;
                }
            } else {
                if (this.inputContent[i] != this.mask[i].show) {
                    complete = false;
                    break;
                }
            }
        }
        return !complete;
    }
});
/**
* Class Date Field mask
*/
var DateFieldMask = Class.create(eventsMasks, {
    /**
    * Initializes the mask
    * @param {Object} $super The super constructor
    * @param {Object} input The input element
    * @param {Object} mask The mask to apply
    */
    initialize: function($super, input, mask, options) {
        $super(input, mask, options);
        this.input.addClassName("datePicker_input");
        //Showing mask to ease input if it is empty
        this._showMask.bind(this).defer();
    },

    /**
    * Activates the masking for the field
    * @param {Object} defaultValue If we want to set a default value in the beginning, format: YYYYMMDD
    */
    activate: function($super, defaultValue) {
        //Add the event handlers:
        if (!this.input.readAttribute("readonly")) {
            this.input.observe('keyup', this._keyupHandler.bindAsEventListener(this));
        }
        //Convert the default value to the one we want:
        if (!Object.isEmpty(defaultValue)) {
            var year = defaultValue.slice(0, 4);
            var month = defaultValue.slice(4, 6);
            var day = defaultValue.slice(6, 8);

            var arrayValue = [];
            arrayValue[this.firstPosition] = day;
            arrayValue[this.secondPosition] = month;
            arrayValue[this.thirdPosition] = year;
            defaultValue = arrayValue.join(" " + this.separator + " ");
        }

        $super(defaultValue);
    },

    /**
    * Sets the value for the date Picker receiving the value in SAP format (YYYY-MM-DD) 
    * @param {Object} newValue The value to set, SAP format: YYYY-MM-DD
    */
    setSapValue: function(newValue) {
        var splittedValue = newValue.split("-");
        var arrayValue = [];
        arrayValue[this.firstPosition] = splittedValue[2];
        arrayValue[this.secondPosition] = splittedValue[1];
        arrayValue[this.thirdPosition] = splittedValue[0];
        this.input.value = arrayValue.join(" " + this.separator + " ");

        this.input.removeClassName("datePicker_showingMask");
        this._parseValue();
        this.isValid();
    },

    /**
    * Returns the date, in YYYYMMDD format
    */
    getSapValue: function() {
        if (Object.isEmpty(this.inputContent)) {
            //If the Object is still not fully created, we assume it is still not complete
            return null;
        }
        if (Object.isEmpty(this.getYear()) || Object.isEmpty(this.getMonth()) || Object.isEmpty(this.getDay())) {
            return "00000000";
        } else {
            return "" + this.getYear().toPaddedString(4, 10) + this.getMonth().toPaddedString(2, 10) + this.getDay().toPaddedString(2, 10);
        }

    },

    /**
    * Returns the date, in YYYY-MM-DD format
    */
    getValueDefaultFormat: function() {
        if (Object.isEmpty(this.inputContent)) {
            //If the Object is still not fully created, we assume it is still not complete
            return null;
        }
        if (Object.isEmpty(this.getYear()) || Object.isEmpty(this.getMonth()) || Object.isEmpty(this.getDay())) {
            return null;
        } else {
            return "" + this.getYear().toPaddedString(4, 10) + "-" + this.getMonth().toPaddedString(2, 10) + "-" + this.getDay().toPaddedString(2, 10);
        }
        return this.getYear() + "-" + this.getMonth() + "-" + this.getDay();
    },

    /**
    * Returns the date in a Date object, null if we haven't filled all the sub-fields
    */
    getDateObject: function() {
        if (Object.isEmpty(this.getYear()) || Object.isEmpty(this.getMonth()) || Object.isEmpty(this.getDay()))
            return null
        else
            return new Date(this.getYear(), this.getMonth() - 1, this.getDay());
    },

    /**
    * Parses the mask received as parameter, storing it in this.mask and this.variablePosition
    * If it is not specified, it will try with global.dateFormat, if it isn't, default is "DD-MM-YYYY"
    * @param {Object} mask The mask
    */
    _parseMask: function($super, mask) {
        //If we don't receive mask, we'll try to get it from global, or use DD-MM-YYYY as default
        if (!mask || mask == "") {
            if (global && global.dateFormat) {
                mask = global.dateFormat;
            } else {
                mask = "DD-MM-YYYY";
            }
        }
        mask = mask.toLowerCase();

        //Find out the position of each sub-field and the separator we will use		
        this.separator = mask.gsub("d", "").gsub("m", "").gsub("y", "").toArray()[0];
        var maskNoSeparator = mask.gsub(this.separator, "");

        switch (maskNoSeparator) {
            case "ddmmyyyy":
                this.firstPosition = 0;
                this.secondPosition = 1;
                this.thirdPosition = 2;
                break;
            case "mmddyyyy":
                this.firstPosition = 1;
                this.secondPosition = 0;
                this.thirdPosition = 2;
                break;
            case "yyyymmdd":
                this.firstPosition = 2;
                this.secondPosition = 1;
                this.thirdPosition = 0;
                break;
            case "yyyyddmm":
                this.firstPosition = 1;
                this.secondPosition = 2;
                this.thirdPosition = 0;
                break;
            default:    //(should never be reached)
                this.firstPosition = 0;
                this.secondPosition = 1;
                this.thirdPosition = 2;
        }
        this.subFieldsPosition = this._getSubFieldsPosition();
        //Create the mask to use:
        switch (this.thirdPosition) {
            case 0:
                this.mask = "9999 " + this.separator + " 99 " + this.separator + " 99";
                break;
            case 2:
                this.mask = "99 " + this.separator + " 99 " + this.separator + " 9999";
                break;
        }
        $super(this.mask);
    },

    /**
    * Gets the array with the positions of each sub-field
    */
    _getSubFieldsPosition: function() {
        var separatorLength = 3; //Because we are using spaces
        var result = [{}, {}, {}];

        result[this.firstPosition].is = "day";
        result[this.secondPosition].is = "month";
        result[this.thirdPosition].is = "year";

        var actualPosition = 0;
        for (var i = 0; i < result.size(); i++) {
            result[i].begin = actualPosition;
            if (result[i].is == "year") {
                actualPosition += 4;
            } else {
                actualPosition += 2;
            }
            result[i].end = actualPosition;

            actualPosition += separatorLength;
        }

        return result;
    },

    /**
    * Shows a mask to ease input if it is empty
    */
    _showMask: function() {
        if (this.isEmpty()) {
            if (!this.input.hasClassName("datePicker_showingMask")) {
                this.input.addClassName("datePicker_showingMask");
            }
            var maskToShow = [];
            maskToShow[this.firstPosition] = "DD";
            maskToShow[this.secondPosition] = "MM";
            maskToShow[this.thirdPosition] = "YYYY";
            maskToShow = maskToShow.join(" " + this.separator + " ");
            this.input.value = maskToShow;
        }
    },

    /**
    * Fills the incomplete sub fields
    * @param {Object} refreshAll If we should fill all of them, instead of only the one we are in
    */
    _fillIncompleteSubFields: function(refreshAll) {
        //See in which subField are we, then fix the other two
        var actualposition = this._selection();
        if (!refreshAll) {
            var actualSubField = this._getActualSubField();
        }
        for (var i = 0; i < this.subFieldsPosition.size(); i++) {
            if (i != actualSubField || refreshAll) {
                var actualValue = this.inputContent.slice(this.subFieldsPosition[i].begin, this.subFieldsPosition[i].end).join("");
                if (this.showHolder) {
                    actualValue = actualValue.gsub(this.showHolder, "");
                }
                //If we have numbers inside
                if (actualValue.length > 0) {
                    //See if we have enough numbers
                    var lengthToFill = 2;
                    if (this.subFieldsPosition[i].is == "year") {
                        lengthToFill = 4;
                    }
                    if (actualValue.length < lengthToFill) {
                        //If we have to fill 0s
                        actualValue = parseInt(actualValue, 10);
                        actualValue = actualValue.toPaddedString(lengthToFill, 10);
                        //Change it in the input
                        var j, k;
                        for (j = 0, k = this.subFieldsPosition[i].begin; j < lengthToFill; j++, k++) {
                            this.inputContent[k] = actualValue.toArray()[j];
                        }
                        this.setValue(this.inputContent.join(""));
                    }
                }
            }
        }
        //Keep the position we had
        if (actualposition.begin >= 0 && !refreshAll) {
            this._selection(actualposition.begin);
        }

    },

    /**
    * Gets the day in the field, an integer. It will return null if no day has been inputed
    */
    getDay: function() {
        return this._getSubFieldValue("day");
    },
    /**
    * Gets the month in the field, an integer. It will return null if no month has been inputed
    */
    getMonth: function() {
        return this._getSubFieldValue("month");
    },
    /**
    * Gets the year in the field, an integer. It will return null if no year has been inputed
    */
    getYear: function() {
        return this._getSubFieldValue("year");
    },

    /**
    * Gets the value for a subField
    * @param {Object} subField The subfield we want to get the value of: "year", "month" or "day"
    */
    _getSubFieldValue: function(subField) {
        var subFieldInfo = null;
        switch (subField) {
            case "day":
                subFieldInfo = this.subFieldsPosition[this.firstPosition];
                break;
            case "month": ;
                subFieldInfo = this.subFieldsPosition[this.secondPosition];
                break;
            case "year": ;
                subFieldInfo = this.subFieldsPosition[this.thirdPosition];
                break;
            default:
                return null;
        }
        var begin = subFieldInfo.begin;
        var end = subFieldInfo.end;
        var stringValue = this.inputContent.slice(begin, end).join("");
        stringValue = stringValue.gsub(this.showHolder, "");
        if (stringValue.length > 0) {
            return parseInt(stringValue, 10);
        } else {
            return null;
        }
    }

});

var hourFieldMask = Class.create(eventsMasks, {

    definitions: $H({
        'h': "[0-2]",
        'l': "[0-5]",
        'm': "[0-9]",
        'o': "[0-1]"
    }),

    /**
    * Initializes the mask
    * @param {Object} $super The super constructor
    * @param {Object} input The input element
    * @param {Object} mask The mask to apply
    */
    initialize: function($super, input, mask, options) {
        this.options = options;
        $super(input, mask, options);
        //Showing mask to ease input if it is empty
        this._showMask.bind(this).defer();
    },

    _parseMask: function($super, mask) {
        //Find out the position of each sub-field and the separator we will use
        this.separator = ":";
        this.subFieldsPosition = this._getSubFieldsPosition();
        //Create the mask to use:
        if (this.options.format == '12')
            var hourMask = "om ";
        else if (this.options.isEndHour == 'yes')
            var hourMask = "hm ";
        else if (this.options.isEndHour == 'no')
            var hourMask = "hm ";
        if (this.options.viewSecs == 'yes')
            this.mask = hourMask + this.separator + " lm " + this.separator + " lm";
        else
            this.mask = hourMask + this.separator + " lm";
        $super(this.mask);
    },

    _goToNextSubField: function() {
        if (this.options.viewSecs == 'yes')
            var length = 2;
        else
            var length = 1;

        var actualSubField = this._getActualSubField();
        if (actualSubField == null || actualSubField == length) {
            return false;
        } else {
            actualSubField++;
            //Look for the begining of this sub-field
            var positionToSet = this.subFieldsPosition[actualSubField].begin;
            this._selection(positionToSet);
            return true;
        }
    },

    _getSubFieldsPosition: function() {
        if (this.options.viewSecs) {
            var result = [
                {
                    'is': 'hour',
                    'begin': 0,
                    'end': 2
                },
                {
                    'is': 'minutes',
                    'begin': 5,
                    'end': 7
                },
                {
                    'is': 'seconds',
                    'begin': 10,
                    'end': 12
                }
            ];
        }
        else {
            var result = [
                {
                    'is': 'hour',
                    'begin': 0,
                    'end': 2
                },
                {
                    'is': 'minutes',
                    'begin': 5,
                    'end': 7
                }
            ];
        }
        return result;
    },

    /**
    * Shows a mask to ease input if it is empty
    */
    _showMask: function() {
        if (this.isEmpty()) {
            if (!this.input.hasClassName("datePicker_showingMask")) {
                this.input.addClassName("datePicker_showingMask");
            }

            var maskToShow = [];
            maskToShow[1] = "HH";
            maskToShow[2] = "MM";
            if (this.options.viewSecs)
                maskToShow[3] = "SS";
            maskToShow = maskToShow.join(" " + this.separator + " ");
            this.input.value = maskToShow;
        }
    },
    setHourValue: function(value) {
        var newValue = this.convertToHour(value);
        this.input.value = newValue;
        this._parseValue();
        this.isValid();
    },
    /**
    * Activates the masking for the field
    * @param {Object} defaultValue If we want to set a default value in the beginning, format: YYYYMMDD
    */
    activate: function($super, defaultValue) {
        //Add the event handlers:
        if (!this.input.readAttribute("readonly")) {
            this.input.observe('keyup', this._keyupHandler.bindAsEventListener(this));
        }
        //Convert the default value to the one we want:
        var value = this.convertToHour(defaultValue);
        $super(value);
    },

    convertToHour: function(value) {
        if (!Object.isEmpty(value)) {
            var defaultValue;
            var hour = value.slice(0, 2);
            var minutes = value.slice(2, 4);
            var secs = value.slice(4, 6);

            var arrayValue = [];
            arrayValue[0] = hour;
            arrayValue[1] = minutes;
            if (this.options.viewSecs)
                arrayValue[2] = secs;
            defaultValue = arrayValue.join(" " + this.separator + " ");
            return defaultValue;
        }
    },

    /**
    * Fills the incomplete sub fields
    * @param {Object} refreshAll If we should fill all of them, instead of only the one we are in
    */
    _fillIncompleteSubFields: function(refreshAll) {
        //See in which subField are we, then fix the other two
        var actualposition = this._selection();
        if (!refreshAll) {
            var actualSubField = this._getActualSubField();
        }
        for (var i = 0; i < this.subFieldsPosition.size(); i++) {
            if (i != actualSubField || refreshAll) {
                var actualValue = this.inputContent.slice(this.subFieldsPosition[i].begin, this.subFieldsPosition[i].end).join("");
                if (this.showHolder) {
                    actualValue = actualValue.gsub(this.showHolder, "");
                }
                //If we have numbers inside
                if (actualValue.length > 0) {
                    //See if we have enough numbers
                    var lengthToFill = 2;
                    if (actualValue.length < lengthToFill) {
                        //If we have to fill 0s
                        actualValue = parseInt(actualValue, 10);
                        actualValue = actualValue.toPaddedString(lengthToFill, 10);
                        //Change it in the input
                        var j, k;
                        for (j = 0, k = this.subFieldsPosition[i].begin; j < lengthToFill; j++, k++) {
                            this.inputContent[k] = actualValue.toArray()[j];
                        }
                        this.setValue(this.inputContent.join(""));
                    }
                }
            }
        }
        //Keep the position we had
        if (actualposition.begin >= 0 && !refreshAll) {
            this._selection(actualposition.begin);
        }

    },

    /**
    * Returns the hour, in hhmmss format
    */
    getSapValue: function() {
        if (Object.isEmpty(this.inputContent)) {
            //If the Object is still not fully created, we assume it is still not complete
            return null;
        }
        if (this.options.format == '12') {
            return this.get12Hours();
        }
        else {
            return this.get24Hours();
        }
    },

    get24Hours: function() {
        if (Object.isEmpty(this.getHour()) || Object.isEmpty(this.getMinutes()) || Object.isEmpty(this.getSecs())) {
            return "000000";
        } else {
            return "" + this.getHour().toPaddedString(2, 10) + this.getMinutes().toPaddedString(2, 10) + this.getSecs().toPaddedString(2, 10);
        }
    },

    get12Hours: function() {
        if (Object.isEmpty(this.getHour()) || Object.isEmpty(this.getMinutes()) || Object.isEmpty(this.getSecs())) {
            return "000000";
        } else {
            var hours = { 'am': '', 'pm': '' };
            var am = "" + this.getHour().toPaddedString(2, 10) + this.getMinutes().toPaddedString(2, 10) + this.getSecs().toPaddedString(2, 10);
            hours.am = am;
            var pmHour = this.getHour() + 12;
            var pm = "" + pmHour.toPaddedString(2, 10) + this.getMinutes().toPaddedString(2, 10) + this.getSecs().toPaddedString(2, 10);
            hours.pm = pm;
            return hours;
        }
    },

    /**
    * Gets the day in the field, an integer. It will return null if no day has been inputed
    */
    getHour: function() {
        return this._getSubFieldValue("hour");
    },
    /**
    * Gets the month in the field, an integer. It will return null if no month has been inputed
    */
    getMinutes: function() {
        return this._getSubFieldValue("minutes");
    },
    /**
    * Gets the year in the field, an integer. It will return null if no year has been inputed
    */
    getSecs: function() {
        if (this._getSubFieldValue("seconds"))
            return this._getSubFieldValue("seconds");
        else
            return 00;
    },

    /**
    * Gets the value for a subField
    * @param {Object} subField The subfield we want to get the value of: "year", "month" or "day"
    */
    _getSubFieldValue: function(subField) {
        var subFieldInfo = null;
        switch (subField) {
            case "hour":
                subFieldInfo = this.subFieldsPosition[0];
                break;
            case "minutes": ;
                subFieldInfo = this.subFieldsPosition[1];
                break;
            case "seconds": ;
                subFieldInfo = this.subFieldsPosition[2];
                break;
            default:
                return null;
        }
		if(!subFieldInfo){
			return null;
		}
        var begin = subFieldInfo.begin;
        var end = subFieldInfo.end;
        var stringValue = this.inputContent.slice(begin, end).join("");
        stringValue = stringValue.gsub(this.showHolder, "");
        if (stringValue.length > 0) {
            return parseInt(stringValue, 10);
        } else {
            return null;
        }
    }
});
