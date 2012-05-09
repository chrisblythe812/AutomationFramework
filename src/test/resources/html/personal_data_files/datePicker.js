/**
 * @fileoverview DatePicker.js
 * Contains definition and implementation of DatePicker. This class generates a date field with a calendar icon,
 * This icon create a calendar where the user can select a date and this automaticaly will be inserted on the fields.
 */

/**
 * @class DatePicker
 * @desc DatePicker module class. This class generates a date field with a calendar.
 */
var DatePicker = Class.create({
    //Class variables
    /** Actual date in the moment of creation */
    currentSystemDate: null,
    /** Calendar linked to this, null if none*/
    linkedCalendar: null,
    /** Boolean, will be true if we have a linked calendar and this is the main calendar between the two of them */
    mainLinker: null,
    /** true if the calendar page has been already loaded */
    calendarPageLoaded: null,
    /** Current month in the selection */
    currentMonth: null,
    /** Current year in the selection */
    currentYear: null,
    /** Array with all the events that we are observing */
    observedEvents: $A(),

    //Options:
    /** Events to be fired */
    events: null,
    /** Default date of the DatePicker */
    optionsDefaultDate: null,
    /** From date: useful for linked calendars */
    optionsMinDate: null,
    /** To date: useful for linked calendars */
    optionsMaxDate: null,
    /** Warning date for minimum date */
    warningMinDate: null,
    /** Warning date for maximum date */
    optionsWarningMaxDate: null,
    /** If the correctDate event should only be fired on blur or date selection
    from calendar and not every character change    */
    correctDateOnBlur: null,
    /** Whether warning/error messages should be shown in a pulsating div */
    showMessages: null,
    /** If an event should be fired upon initialize or not */
    fireEventOnInitialize: null,
    /** Whether the user should be able to enter the date manually, or only through the small calendar */
    optionsManualDateInsertion: null,
    /** Labels, if passed in options */
    labels: null,
    /** Whether the small calendar should be draggable or no */
    optionsIsDraggable: null,
    /** If the empty date is valid or no - for mandatory fields it should be set to false */
    optionsEmptyDateValid: null,
    /** If true, then if there is no default date set, then upon load the date will be set
    to the current system date */
    optionsSystemDateWhenEmpty: null,
    /** Tooltip to show (used in Lite Version) */
    toolTip: null,
    /** Day that starts the week*/
    weekStartDay: null,
    /** Date format to be used in the module */
    dateFormat: null,

    //DOM elements:
    /** Element where the date picker will be inserted */
    containerDiv: null,
    /** Input element, the one that will have a mask */
    inputField: null,
    /** Stores the <a> element for each day */
    daysActions: null,
    /** Element with the name of the month on the mini-calendar */
    monthHeaderName: null,
    /** Element with the name of the year on the mini-calendar */
    yearHeaderName: null,
    /** It stores whether the currently entered date is syntactically valid or no
    without taking into account the min/max/warning/linked dates */
    malformedDate: false,

    /**
    * Constructor of the class. On this function the container div to insert the calendar will be asigned to a class variable.
    * On this function the system also load the text label from the XML Object and defines de default labels.
    * @param options {array} Calendar options
    * @param containerDiv {string} div where the calendar will be posicionated
    */
    initialize: function(containerDiv, options) {
        //Getting the element where the calendar will be inserted
        this.containerDiv = $(containerDiv); //DIV to insert the calendar
        this.containerDiv.addClassName('datePicker_mainContainer test_popupCalendar');
        this._setOptions(options);
        //Loading the calendar
        this._load();
    },

    /**
    * Sets the options for the date picker
    * @param {Object} options
    */
    _setOptions: function(options) {
        this.currentSystemDate = new Date(); //The actual system date

        /* Getting the options */
        if (Object.isEmpty(options)) {
            this.events = null;
        } else if (Object.isEmpty(options.events)) {
            this.events = null;
        } else {
            this.events = options.events;
        }

        //Sets the main options of the DatePicker
        if (!Object.isEmpty(options)) {
            if (!Object.isEmpty(options.defaultDate)) {
                this.optionsDefaultDate = this._strToDate(options.defaultDate + "");
            }
            if (!Object.isEmpty(options.fromDate)) {
                this.optionsMinDate = this._strToDate(options.fromDate);
            }
            else {
                this.optionsMinDate = '01-01-1800';
            }
            if (!Object.isEmpty(options.toDate)) {
                this.optionsMaxDate = this._strToDate(options.toDate);
            }
            else {
                this.optionsMaxDate = '31-12-9999';
            }
            if (!Object.isEmpty(options.warningMinDate)) {
                this.optionsWarningMinDate = this._strToDate(options.warningMinDate);
            }
            if (!Object.isEmpty(options.warningMaxDate)) {
                this.optionsWarningMaxDate = this._strToDate(options.warningMaxDate);
            }
            if (!Object.isEmpty(options.correctDateOnBlur)) {
                this.correctDateOnBlur = options.correctDateOnBlur;
            }
            else {
                this.correctDateOnBlur = false;
            }
            if (!Object.isEmpty(options.showMessages)) {
                this.showMessages = options.showMessages;
            }
            else {
                this.showMessages = true;
            }
            if (!Object.isEmpty(options.fireEventOnInitialize)) {
                this.fireEventOnInitialize = options.fireEventOnInitialize;
            }
            else {
                this.fireEventOnInitialize = false;
            }
            if (!Object.isEmpty(options.manualDateInsertion)) {
                this.optionsManualDateInsertion = options.manualDateInsertion;
            }
            else {
                this.optionsManualDateInsertion = true;
            }
            if (!Object.isEmpty(options.labels)) {
                this.labels = options.labels;
            }
            else {
                this.labels = null;
            }
            if (!Object.isEmpty(options.draggable)) {
                this.optionsIsDraggable = options.draggable;
            }
            else {
                this.optionsIsDraggable = false;
            }
            if (!Object.isEmpty(options.emptyDateValid)) {
                this.optionsEmptyDateValid = options.emptyDateValid;
            }
            else {
                this.optionsEmptyDateValid = true;
            }
            if (!Object.isEmpty(options.systemDateWhenEmpty)) {
                this.optionsSystemDateWhenEmpty = options.systemDateWhenEmpty;
            }
            else {
                this.optionsSystemDateWhenEmpty = false;
            }
            if (!Object.isEmpty(options.toolTip)) {
                this.toolTip = options.toolTip;
            }
            else {
                this.toolTip = "";
            }
        } else {
            //If there are no options, then we set the default parameters
            this.correctDateOnBlur = false;
            this.fireEventOnInitialize = false;
            this.optionsManualDateInsertion = true;
            this.labels = null;
            this.optionsIsDraggable = false;
            this.optionsEmptyDateValid = true;
            this.optionsSystemDateWhenEmpty = false;
            this.showMessages = true;
        }
        //Getting the labels from global or options and putting them in the corresponding variables
        this._setMonthAndDayLabels();

        //Setting the week start day
        if (Object.isEmpty(global.calendarsStartDay)) {
            this.weekStartDay = 0;
        }
        else {
            this.weekStartDay = parseInt(global.calendarsStartDay, 10);
            if (this.weekStartDay == 1)
                this.weekStartDay = 0;
            else if (this.weekStartDay == 0)
                this.weekStartDay = 1;
        }

        //Getting date format
        if (!Object.isEmpty(global))
            this.dateFormat = global.dateFormat;
        else
            this.dateFormat = 'dd.MM.yyyy';

    },
    /**
    * This function loads the calendar and initializes the main components
    */
    _load: function() {
        if (!Object.isEmpty(this.optionsDefaultDate)) {
            this.currentMonth = this.optionsDefaultDate.getMonth();
            this.currentYear = this.optionsDefaultDate.getFullYear();
        }
        else {
            var loadDate = this.currentSystemDate;
            this.currentMonth = loadDate.getMonth();
            this.currentYear = loadDate.getFullYear();
        }
        //Creating the text field
        this._initInput();
        //Creating the mini-calendar overlay
        this._initOverlay();
        //If we want to fire events from start
        if (this.fireEventOnInitialize)
            this.checkDateFormat.bind(this, false, true).defer();
        //We do not want to show the DatePicker in error if it is empty and has just been created
        this._removeErrorFirstTime.bind(this).defer();

    },

    /**
    * Removes the error the first time it is executed if it is empty
    */
    _removeErrorFirstTime: function() {
        if (this.dateIsEmpty()) {
            if (this.inputField.hasClassName("datePicker_inputError")) {
                this.inputField.removeClassName("datePicker_inputError");
                this.inputField.removeClassName("test_ErrorMsg");
                this.inputField.addClassName("test_input");
            }
        }
    },

    /**
    * Initializes the input element
    */
    _initInput: function() {
        var tooltip = "";
        if (!Object.isEmpty(this.tooltip)) {
            tooltip = this.tooltip;
        }

        this.inputField = new Element("input", {
            "type": "text",
            "class": "test_input",
            "title": tooltip
        });

        //Obtain actual date Default date
        var auxDate = null;
        if (!Object.isEmpty(this.optionsDefaultDate))
            auxDate = this.optionsDefaultDate;
        else if (this.optionsSystemDateWhenEmpty)
            auxDate = new Date();
        if (!Object.isEmpty(auxDate)) {
            this.actualDate = new Date();
            this.actualDate.setFullYear(auxDate.getFullYear(), auxDate.getMonth(), auxDate.getDate());
            this.actualDate.clearTime();
        }

        //Create mask for input
        var defaultValue = "";
        if (!Object.isEmpty(this.optionsDefaultDate)) {
            defaultValue = objectToSap(this.optionsDefaultDate).gsub("-", "")
        }

        //Setting the field as readonly if it is in the options
        if (this.optionsManualDateInsertion == false || Object.isEmpty(this.optionsManualDateInsertion)) {
            this.inputField.writeAttribute('readonly');
        }
        this.fieldMask = new DateFieldMask(this.inputField, global.dateFormat, {
            activate: true,
            defaultValue: defaultValue,
            useOnlyVariableCharacters: false
        });

        this.containerDiv.insert(this.inputField);



        //Actions to check the date format
        this.observedEvents.push(this.inputField.on("blur", this._inputFieldBlur.bind(this)));
    },

    /**
    * Called on blur of the input field, we check if the date is correct
    * @param {Object} event
    */
    _inputFieldBlur: function(event) {
        //Store them so the mini calendar shows the correct date
        var newCurrentMonth = this.fieldMask.getMonth();
        var newCurrentYear = this.fieldMask.getYear();
        if (newCurrentMonth != null) {
            this.currentMonth = newCurrentMonth - 1; //-1 Because we count months from 0 to 11
        }
        if (newCurrentYear != null) {
            this.currentYear = newCurrentYear;
        }
        this.actualDate = this.fieldMask.getDateObject();
        this.checkDateFormat();
    },
    /**
    * This function creates the overlay for the modal window that will contain the calendar. It also creates the button to open it.
    */
    _initOverlay: function() {
        this.calendarIcon = new Element('button', {
            'class': 'datePicker_icon test_button'
        }); //Creating the icon
        this.calendarIcon.observe('click', this._showCalendar.bind(this)); //Adding an action to the icon --> Show the calendar

        this.calendarOverlay = new Element('div', {
            id: 'datePicker_overlay',
            'class': 'datePicker_overlay'
        }).hide(); //Calendar container
        this.containerDiv.insert(this.calendarIcon);
        $(document.body).insert(this.calendarOverlay);
        $(document).observe('mousedown', this._checkOutside.bind(this));
    },
    /**
    * Links a calendar to other (Implements the From To behaviour, It is, if you click on the first calendar on a date
    * it will be set as minimum date on the second, and if you click on a date on the second calendar it will be set as
    * maximum date on the first.
    * @param calendar {datePicker} DatePicker object
    */
    linkCalendar: function(calendar) {
        //Linking the first calendar
        this.linkedCalendar = calendar;
        this.mainLinker = true;
        //Linking the second calendar
        calendar.linkedCalendar = this;
        calendar.mainLinker = false;
    },

    /**
    * Updates the range we are using
    * @param {Object} toDate
    * @param {Object} fromDate
    */
    updateRange: function(toDate, fromDate) {
        this.optionsMinDate = Date.parseExact(fromDate, "yyyyMMdd");
        this.optionsMaxDate = Date.parseExact(toDate, "yyyyMMdd");
    },

    /**
    * Calculates the day of the week for a given date
    * @param day {int} Day of the month
    * @param month {int} Month of the year
    * @param year {int} Year
    * @return the number of the day of the week
    */
    _getDayOfWeek: function(day, month, year) {
        var tmpDate = new Date(year, month, day);
        var tmpDay = tmpDate.getDay();
        var res;
        if (tmpDay < this.weekStartDay) {
            var dif = this.weekStartDay - tmpDay;
            res = 7 - dif;
        }
        else {
            res = tmpDay - this.weekStartDay;
        }
        return res;
    },

    /**
    * @method _strToDate
    * @desc Converts a date string (YYYYMMDD) to a date object
    * @param dateString {string} string to be converted
    * @return A date object
    */
    _strToDate: function(dateString) {
        if (parseInt(dateString) != 0)
            return Date.parseExact(dateString, 'yyyyMMdd');
        else
            return Date.parseExact("00000000", 'yyyyMMdd');
    },

    /**
    * @method _getWeekHeader
    * @desc Gets the names of the days of the week and calculates their positions
    * return An array containing the names of the days
    */
    _getWeekHeader: function() {
        var fixedWeekDays = new Array(); //Stores the days of the week with the fixed positions
        var i = 0;
        for (var a = this.weekStartDay; a <= this.weekStartDay + 6; a++) {
            if (a <= 6) {
                fixedWeekDays[i] = this.labelDaysNames[a];
            }
            else {
                fixedWeekDays[i] = this.labelDaysNames[a % 7];
            }
            i++;
        }
        return fixedWeekDays;
    },

    /** @method _loadCalendarPage
    * @desc This function fills in the calendar cells the days of a given month
    */
    _loadCalendarPage: function() {
        this.calendarPageLoaded = true;
        this.daysActions = new Array(31); //Stores the days links and the actions for each day
        //Getting the position of the first day of week 
        var startPosition = this._getDayOfWeek(1, this.currentMonth, this.currentYear);
        var month = this.currentMonth;
        var year = this.currentYear;
        var column = 1;
        var row = 1;
        this.monthHeaderName.update(this.labelMonthsNames[this.currentMonth]);
        this.yearHeaderName.update(year);
        //Loading the previous days
        for (var a = 1; a <= startPosition; a++) {
            this._setDay(row, column, ""); //Setting empty cells
            column++;
        }
        var lastRow = 0;
        var weekNumbers = new Array(6);
        // Loading the month days
        for (var a = 1; a <= Date.getDaysInMonth(year, month); a++) {
            //Calculating the week number for each row
            if (lastRow != row) {
                var date = new Date();
                date.setFullYear(year, month, a);
                weekNumbers[row - 1] = date.getWeek();
                lastRow = row;
            }
            a == this.currentSystemDate.getDate() &&
            month == this.currentSystemDate.getMonth() &&
            year == this.currentSystemDate.getFullYear() ?
            this._setDay(row, column, a, true) : this._setDay(row, column, a, false);
            if (column == 7) {
                column = 0;
                row++;
            }
            column++;
        }
        //Empty cells
        while (row < 7) {
            this._setDay(row, column, ""); //Setting empty cells
            if (column == 7) {
                column = 0;
                row++;
            }
            column++;
        }
        //TODO: use good way to create Elements
        //Creating the number of the weeks table (To work on IE)
        var htmlTable = '<TABLE class="datePicker_wtable test_table">';
        for (var i = 0; i <= 5; i++) {
            htmlTable += '<TR class="datePicker_wtr"><TD class="datePicker_wn">' + (weekNumbers[0] + i) + '</TD></TR>';
        }
        htmlTable += "</table>";
        this.weeksTd.update(htmlTable); //Updating the table
    },

    /**
    * This function loads the Year selection list
    */
    _loadYearSelectionDialog: function() {
        if (this.yearSelectionElements.size() > 1) {
            this.yearCounter = this.currentYear; //Actual calendar year
            var yearIndex = 0; //Counter
            //Filling the year selection with a range of years between currentYear-6 and currentYear+6
            for (var year = this.currentYear - 6; year <= this.currentYear + 6; year++) {
                this.yearSelectionElements[yearIndex].update(year);
                this.yearSelectionElements[yearIndex].stopObserving();
                this.yearSelectionElements[yearIndex].observe('click', this._changeYearByList.bindAsEventListener(this, year));
                yearIndex++;
            }
        }
    },
    /**
    * This function increases the year on the Year selection dialog
    */
    _increaseYearSelectionDialog: function() {
        if (this.yearCounter < 9993) {
            var yearIndex = 0;
            var currentYear = this.yearCounter + 1;
            for (var year = currentYear - 6; year <= currentYear + 6; year++) {
                this.yearSelectionElements[yearIndex].update(year);
                this.yearSelectionElements[yearIndex].stopObserving('click');
                this.yearSelectionElements[yearIndex].observe('click', this._changeYearByList.bindAsEventListener(this, year));
                yearIndex++;
            }
            this.yearCounter++;
        }
    },
    /**
    * This function decreases the year on the year selection dialog
    */
    _decreaseYearSelectionDialog: function() {
        //This is the absolute minimun year 1900+6
        if (this.yearCounter > 1906) {
            var yearIndex = 0;
            var currentYear = this.yearCounter - 1;
            for (var year = currentYear - 6; year <= currentYear + 6; year++) {
                this.yearSelectionElements[yearIndex].update(year);
                this.yearSelectionElements[yearIndex].stopObserving('click');
                this.yearSelectionElements[yearIndex].observe('click', this._changeYearByList.bindAsEventListener(this, year));
                yearIndex++;
            }
            this.yearCounter--;
        }
    },
    /**
    * Loads next month on the calendar view
    */
    _nextMonth: function() {
        if (this.currentMonth == 11) {
            this.currentMonth = 0;
            this.currentYear++; //Increasing the year
        }
        else
            this.currentMonth++; //Increasing the month
        this._loadCalendarPage(); //Reloading the calendar content
    },
    /**
    * Loads previous month on the calendar view
    */
    _previousMonth: function() {
        if (this.currentMonth == 0) {
            this.currentMonth = 11;
            this.currentYear--; //Decreasing the year
        }
        else
            this.currentMonth--; //Decreasing the month
        this._loadCalendarPage();
    },
    /**
    * Day clicking event (This function is triggered when the user clicks on a calendar day)
    * @param event {Event} Event information
    * @param day {int} Selected date
    */
    _selectDay: function(event, day) {
        this._showCalendar();
        var seguir = true;
        for (var i = 0; i < this.days.length && seguir; i++) {
            for (var j = 0; j < this.days[i].length && seguir; j++) {
                if (this.days[i][j].hasClassName('datePicker_actualSelected')) {
                    this.days[i][j].removeClassName('datePicker_actualSelected');
                    seguir = false;
                }
            }
        }
        if (Object.isEmpty(this.lastCurrentDay)) {
            this.lastCurrentDay = event.findElement();
        }
        this.lastCurrentDay.removeClassName('datePicker_actualSelected');
        this.lastCurrentDay = event.findElement();
        event.findElement().addClassName('datePicker_actualSelected');
        var args = $A(arguments); //Getting the arguments

        this.setDate(new Date(args[3], args[2] - 1, args[1]), true);
    },
    /**
    * This function shows or hides the list of the years
    */
    _showYearSelection: function(e) {
        this._loadYearSelectionDialog();
        this.yearSelection.getStyle('display') != 'none' ? this.yearSelection.hide() : this.yearSelection.show();
    },
    /**
    * This function shows and hides the calendar
    * @param e {Event} Event information
    */
    _showCalendar: function(e) {
        if (this.calendarOverlay.getStyle('display') != 'none') {
            if (this.setVisible != null) {
                //hidding the calendar
                this.yearSelection.hide();
                this.monthSelection.hide();
                this.calendarOverlay.hide();
                this.setVisible = null;
                this.notHideCalendar = null;
                /*this.calendarOverlay.setStyle({
                position: 'relative'
                });*/
                //TODO: check if needed
            }
        }
        else {
            //Calculating the position to posicionate the calendar
            //Showing the calendar
            this.calendarOverlay.clonePosition(this.inputField);
            this.calendarOverlay.setStyle({
                position: 'absolute'
            });

            //When we have many scroll, the position is miscalculated because it doesn't coun't other scrolls than main
            //so we have to see the diference between the main scroll and the others:
            var offset = this.inputField.cumulativeOffset().top;
            var offsetOtherScrolls = this.inputField.cumulativeScrollOffset().top - this.calendarOverlay.cumulativeScrollOffset().top;
            this.calendarOverlay.setStyle({
                top: (offset - offsetOtherScrolls) + 'px'
            });
            this.calendarOverlay.show();
            if (Object.isEmpty(this.setVisible))
                this.setVisible = false;
            this.notHideCalendar = true;
            if (!this.calendarPageLoaded)
                this._initCalendarDiv();
            this._loadCalendarPage();
        }
    },

    /**
    * This functios hides or shows the month selection panel depending on the current state it is in
    */
    _showMonthSelection: function() {
        if (this.monthSelection.getStyle('display') != 'none')
            this.monthSelection.hide();
        else
            this.monthSelection.show();
    },

    /**
    * This function is called when the user clicks on the name of a month. The function change the calendar to the
    * Pressed month
    * @param event {Event} Event Object
    * @param month {int} Month number
    */
    _changeMonthByList: function(event, month) {
        /* Getting the attributes */
        var monthNumber = $A(arguments);
        this.currentMonth = month;
        this._loadCalendarPage();
        this.monthSelection.hide();
        /* Hidding the month selection pannel */
        this.notHideCalendar = true;
    },

    /**
    * This function is triggered when clicking on one of the year of the year selection list
    * @param event {Event} Event information
    * @param year {int} Selected year
    */
    _changeYearByList: function(event, year) {
        /* Getting the attributes */
        var monthNumber = $A(arguments);
        this.currentYear = year;
        this._loadCalendarPage();
        /* Hidding the month selection pannel */
        this.yearSelection.hide();
        this.notHideCalendar = true;
        this._loadYearSelectionDialog();
    },

    /** 
    * Checks that the input date has the proper format, and fire wrongDate or correctDate event
    * @param parameter1: not used anymore,
    * @param notShowError: if we
    */
    checkDateFormat: function(parameter1, notShowError) {
        this.malformedDate = false;
        /* If empty dates are valid and the DatePicker is empty (and has no linked calendar),
        * then it is a correct date, no further inspection necessary. If empty dates are valid
        * and the DatePicker has a linked calendar but both DatePickers are empty, then both
        * have correct dates and no further inspection is necessary */
        var emptyAndValid = this.optionsEmptyDateValid && this.dateIsEmpty();
        var linkedCalendarEmptyAndValid = (Object.isEmpty(this.linkedCalendar) ||
            (!Object.isEmpty(this.linkedCalendar)
			&& this.linkedCalendar.optionsEmptyDateValid
			&& this.linkedCalendar.dateIsEmpty())
		);
        if (emptyAndValid && linkedCalendarEmptyAndValid) {
            this._setAsValid();
            if (!Object.isEmpty(this.linkedCalendar)) {
                this.linkedCalendar._setAsValid();
            }
            return true;
        }

        //Check if the date is incomplete
        if (this.fieldMask.isIncomplete()) {
            this._setAsError("incomplete", notShowError);
            this.malformedDate = true;
            return false;
        }

        //Create a date object to check if it is correct
        var sapDate = this.fieldMask.getSapValue();
        var year = parseInt(sapDate.slice(0, 4), 10);
        var month = parseInt(sapDate.slice(4, 6), 10);
        var day = parseInt(sapDate.slice(6, 8), 10);
        var date = new Date().clearTime();
        date.setFullYear(year, month - 1, day);

        //Check if the date is correct: number of days consistent with month and year:
        if (!this._isDateConsistent(day, month, year)) {
            this.malformedDate = true;
            this._setAsError("inconsistent", notShowError);
            return false;
        }

        //Check if it is out of Range
        if (this._isDateOutOfRange(date)) {
            this._setAsError("outOfRange", notShowError);
            return false;
        }

        //Check if it is not out of range, but in warning range
        if (this._isDateInWarningRange(date)) {
            this._setAsWarning("warningRange");
            return true;
        }

        //If we get to this point, the date is correct:
        this._setAsValid();
        return true;
    },

    /**
    * Checks if a date is consistent: if the year and month are correct: if the number of days is correct for this month and year
    * @param {Object} day the day of the date to check
    * @param {Object} month the month of the date to check
    * @param {Object} year the year of the date to check
    * @return true if it is consistent, false otherwise
    */
    _isDateConsistent: function(day, month, year) {
        //Check if the year is correct
        if (year < 1900 || year > 9999) {
            return false
        }

        //Check if the month is correct
        if (month < 1 || month > 12) {
            return false
        }

        //Check if the number of days is correct:
        if (day < 1 || day > Date.getDaysInMonth(year, month - 1)) {
            return false;
        }

        //If we get here, date is consistent:
        return true;
    },

    /**
    * Checks if a date is out of range
    * //The date is out of range if:
    * - The date is earlier than the minimum date
    * - The date is after the maximum date
    * - We have a calendar linked to this one, and
    * - This is the From date and is after the To date or
    * - This is the To date and is earlier than the To date
    * @param {Object} date Date object to check
    * @return true if it is out of range, false otherwise
    */
    _isDateOutOfRange: function(date) {
        //If the date is before the min date:
        if (!Object.isEmpty(this.optionsMinDate) && this.optionsMinDate > date) {
            return true;
        }
        //If the date is after the max date:
        if (!Object.isEmpty(this.optionsMaxDate) && this.optionsMaxDate < date) {
            return true;
        }

        //Check if this date is consistent with the one from the linked calendar
        if (!Object.isEmpty(this.linkedCalendar)) {
            //Check if the other date is empty, and shouldn't be
            if (Object.isEmpty(this.linkedCalendar.actualDate) && !this.linkedCalendar.optionsEmptyDateValid) {
                this.linkWrong = true;
                return true;
            }
            //If it is the main date
            if (this.mainLinker) {
                if ((!Object.isEmpty(this.linkedCalendar.actualDate) && date > this.linkedCalendar.actualDate)) {
                    this.linkWrong = true;
                    return true;
                }
            } else {//If it is not the main date
                if (!Object.isEmpty(this.linkedCalendar.actualDate) && date < this.linkedCalendar.actualDate) {
                    this.linkWrong = true;
                    return true;
                }
            }

            if (!Object.isEmpty(this.linkedCalendar.actualDate) && !(this.linkedCalendar.actualDate < this.linkedCalendar.optionsMinDate) && !(this.linkedCalendar.actualDate > this.linkedCalendar.optionsMaxDate)) {
                this.linkedCalendar._setAsValid();
            }
        }
        //If we get here, the date is not out of range:
        return false;
    },

    /**
    * Checks if the date is in warning range
    * @param {Object} date Date object, the date to check
    * @return true if the date is in warning range, false otherwise
    */
    _isDateInWarningRange: function(date) {
        if ((!Object.isEmpty(this.optionsWarningMinDate) && this.optionsWarningMinDate > date) ||
            (!Object.isEmpty(this.optionsWarningMaxDate) && this.optionsWarningMaxDate < date))
            return true;
        else
            return false;
    },

    /**
    * Sets the field as error, firing the necessary event
    * @param cause cause of the error
    * @param notShowError if we don't want to show the error
    */
    _setAsError: function(cause, notShowError) {
        this._fireEvent("wrongDate");
        if (!this.inputField.hasClassName("datePicker_inputError")) {
            if (!notShowError) {
                this.inputField.addClassName("datePicker_inputError");
                this.inputField.addClassName("test_ErrorMsg");
                this.inputField.removeClassName("test_input");
            }
        }
    },
    /**
    * Sets the field as valid, firing the necessary event
    */
    _setAsValid: function() {
        this._fireEvent("correctDate");
        if (this.inputField.hasClassName("datePicker_inputError")) {
            this.inputField.removeClassName("datePicker_inputError");
            this.inputField.removeClassName("test_ErrorMsg");
            this.inputField.addClassName("test_input");
        }
    },

    /**
    * Shows a warning message, firing the necessary event
    */
    _setAsWarning: function() {
        this._fireEvent("correctDate");
    },

    /**
    * Fires an event, if it has been declared in the parameters
    * @param {Object} eventName The name of the event to fire
    */
    _fireEvent: function(eventName) {
        //Check if we have a event to call
        if (this.events && this.events.get(eventName)) {
            var sapDate = this.fieldMask.getSapValue();
            if (sapDate == null) {
                var year = null;
                var month = null;
                var day = null;
            } else {
                var year = parseInt(sapDate.slice(0, 4), 10);
                var month = parseInt(sapDate.slice(4, 6), 10);
                var day = parseInt(sapDate.slice(6, 8), 10);
            }
            day = day || this.day;
            month = month || this.month;
            year = year || this.year;
            document.fire(this.events.get(eventName), {
                id: this.containerDiv.id,
                day: day,
                month: month,
                year: year
            });
        }
    },

    /**
    * Gets the selected date as an array
    * @return An object with the date. array.day, array.month, array.year
    */
    getDateAsArray: function() {
        if (Object.isEmpty(this.fieldMask) || Object.isEmpty(this.fieldMask.inputContent)) {
            var sapDate = objectToSap(this.actualDate).gsub("-", "");
            return {
                day: sapDate.slice(6, 8),
                month: sapDate.slice(4, 6),
                year: sapDate.slice(0, 4)
            };
        } else {
            return {
                day: this.fieldMask.getDay() + "",
                month: this.fieldMask.getMonth() + "",
                year: this.fieldMask.getYear() + ""
            };
        }
    },

    /**
    * Gets the selected date as a complete string
    * @return A date with the date in datePicker YYYY-MM-DD
    */
    getActualDate: function() {
        var value = this.fieldMask.getValueDefaultFormat();
        if (value == null && !Object.isEmpty(this.optionsDefaultDate)) {
            if (this.fieldMask.isLoaded()) {
                //If the date picker is already loaded, and its value is empty, return ""
                value = "";
            } else {
                value = objectToSap(this.optionsDefaultDate);
            }
        }
        return value;
    },

    /**
    * This function creates the elements needed to show the DatePicker
    */
    _initCalendarDiv: function() {
        //TODO: function too big: make sub functions
        //Creating the calendar header (Title + Close button)
        var header = new Element('div', {
            id: 'calendarHeader',
            'class': 'application_header_bar_calendar datePicker_header_modal'
        }).update('<div class="application_header_text application_text_bolder datePicker_label_title test_label">' + this.labelTitle + '</div>'); //TODO: use new Element
        if (Object.isEmpty(this.optionsIsDraggable)) { //TODO: do not use down, and do not use inline styles, just apply different classes
            header.down(0).setStyle({
                cursor: 'default'
            });
        }
        this.close = new Element('div', {
            id: 'close',
            'class': 'application_rounded_close datePicker_align_close test_icon'
        });
        this.close.observe('click', this._showCalendar.bind(this));
        var calendarContent = new Element('div', {
            id: 'close',
            'class': 'datePicker_content'
        }); //Calendar content
        this.monthSelection = new Element('div', {
            'class': 'datePicker_month_selection'
        }).hide(); //Month selection pannel
        this.yearSelection = new Element('div', {
            'class': 'datePicker_year_selection'
        }).hide(); //Year selection pannel

        this.calendarContent = calendarContent;
        //Creating the Month selection pannel
        this.monthSelectionElements = new Array(11);
        //Creating the month selection pannel
        for (var month = 0; month <= 11; month++) {
            this.monthSelectionElements[month] = new Element('a', {
                'class': 'datePicker_month_link'
            }).update(this.labelMonthsNames[month]);
            this.monthSelection.insert(this.monthSelectionElements[month]);
            /* Creating the action when clicking on the month */
            this.monthSelectionElements[month].observe('click', this._changeMonthByList.bindAsEventListener(this, month));
            this.monthSelectionElements[month].observe('mouseover', function(event) {
                this._changeClassName(event.findElement(), 'datePicker_month_link', 'datePicker_month_link_over');
            } .bind(this));
            this.monthSelectionElements[month].observe('mouseout', function(event) {
                this._changeClassName(event.findElement(), 'datePicker_month_link_over', 'datePicker_month_link');
            } .bind(this));
            this.monthSelection.insert(new Element('br'));
        }
        //Creating the Year selection pannel
        this.yearSelectionElements = new Array();
        var yearIndex = 0;
        //Year range between year-6 and year+6
        this.upArrow = new Element('a', {
            'class': 'application_up_arrow datePicker_up_arrow'
        });
        this.yearSelection.insert(this.upArrow);
        for (var year = this.currentYear - 6; year <= this.currentYear + 6; year++) {
            this.yearSelectionElements[yearIndex] = new Element('a', {
                'class': 'datePicker_year_link'
            }).update(year);
            this.yearSelection.insert(this.yearSelectionElements[yearIndex]);
            this.yearSelection.insert(new Element('br')); //TODO: remove this and apply display: block
            this.yearSelectionElements[yearIndex].observe('click', this._changeYearByList.bindAsEventListener(this, year));
            this.yearSelectionElements[yearIndex].observe('mouseover', function(event) {
                this._changeClassName(event.findElement(), 'datePicker_year_link', 'datePicker_year_link_over');
            } .bind(this));
            this.yearSelectionElements[yearIndex].observe('mouseout', function(event) {
                this._changeClassName(event.findElement(), 'datePicker_year_link_over', 'datePicker_year_link');
            } .bind(this));
            yearIndex++;
        }
        this.downArrow = new Element('a', {
            'class': 'application_down_arrow datePicker_down_arrow'
        });
        this.yearSelection.insert(this.downArrow);
        this.upArrow.observe('click', this._decreaseYearSelectionDialog.bind(this));
        this.downArrow.observe('click', this._increaseYearSelectionDialog.bind(this));
        this.yearCounter = this.currentYear;
        /* This event observe the click event on the document and check if the click was inside the datePicker_overlay element or not */
        calendarContent.insert(this.yearSelection);
        calendarContent.insert(this.monthSelection);
        header.insert(this.close);
        this.calendarOverlay.insert(header);
        this.calendarOverlay.insert(calendarContent);
        var table = new Element('table', {
            'class': 'datePicker test_table'
        });
        var table_header = new Element('thead', {
            'class': 'datePicker_header'
        });
        var table_body = new Element('tbody', {
            'class': 'datePicker_body'
        });
        var table_footer = new Element('tfoot', {
            'class': 'datePicker_footer'
        });
        //Header elements
        var header_contents = new Element('tr');
        var header_month = new Element('td', {
            'class': 'datePicker_month_td',
            colspan: '4'
        }); //Month label
        var header_month_text = new Element('span', {
            'class': 'datePicker_month'
        });
        var header_year_text = new Element('span', {
            'class': 'datePicker_year'
        });

        this.monthHeaderName = header_month_text;
        header_month.insert(header_month_text);
        var header_year = new Element('td', {
            'class': 'datePicker_year_td',
            colspan: '4'
        }); //Year label
        header_year.insert(header_year_text);
        this.monthHeaderName.observe('click', this._showMonthSelection.bind(this));
        this.yearHeaderName = header_year_text;
        this.yearHeaderName.observe('click', this._showYearSelection.bind(this));
        header_contents.insert(header_month);
        header_contents.insert(header_year);
        header_week = new Element('tr', {
            'class': 'datePicker_w0'
        });
        var week_days_header = this._getWeekHeader();
        for (var day = 0; day < week_days_header.length; day++) {
            if (day == 0)
                header_week.insert(new Element('td'));
            header_week.insert(new Element('td', {
                'class': 'datePicker_wd'
            }).update(week_days_header[day]));
        }
        table_header.insert(header_contents);
        table_header.insert(header_week);
        //Body elements
        var body_weeks = new Array(6);
        var body_days = new Array(6);
        for (var i = 0; i < body_days.length; i++)
            body_days[i] = new Array(7);
        var week = 1;
        for (var i = 0; i < body_weeks.length; i++) {
            body_weeks[i] = new Element('tr', {
                'class': 'datePicker_w' + (i + 1)
            });
            if (i == 0) {
                this.weeksTd = new Element('td', {
                    'class': 'datePicker_wtd',
                    rowspan: '6'
                });
                body_weeks[i].insert(this.weeksTd);
            }
            for (var j = 0; j < body_days[week].length; j++) {
                if (this.weekStartDay == 0 && j == 0)
                    body_days[i][j] = new Element('td', {
                        'class': 'datePicker_d' + (7)
                    }).update('');
                if (this.weekStartDay == 0 && j != 0)
                    body_days[i][j] = new Element('td', {
                        'class': 'datePicker_d' + (j)
                    }).update('');
                if (this.weekStartDay != 0)
                    body_days[i][j] = new Element('td', {
                        'class': 'datePicker_d' + (j + this.weekStartDay)
                    }).update('');
                body_weeks[i].insert(body_days[i][j]);
            }
            table_body.insert(body_weeks[i]);
        }
        this.days = body_days;
        //Footer elements
        var footer_contents = new Element('tr');
        /* Creating the previous link and attaching an event to it */
        var previous_link = new Element('a', {
            'class': 'datePicker_month_nav',
            'href': 'javascript:;'
        });
        previous_link.update('&lt;' + this.labelPrevious);
        previous_link.observe('click', this._previousMonth.bind(this));
        var next_link = new Element('a', {
            'class': 'datePicker_month_nav',
            'href': 'javascript:;'
        });
        next_link.update(this.labelNext + '&gt;');
        next_link.observe('click', this._nextMonth.bind(this));
        var previous_button = new Element('td', {
            'class': 'datePicker_previous',
            colspan: '4'
        }).insert(previous_link);
        /* Creating the next link and attaching an event to it */
        var next_button = new Element('td', {
            'class': 'datePicker_next',
            colspan: '4'
        }).insert(next_link);
        //Assembly of elements
        footer_contents.insert(previous_button);
        footer_contents.insert(next_button);
        table_footer.insert(footer_contents);
        //Inserting the elements on the DIV
        table.insert(table_header);
        table.insert(table_body);
        table.insert(table_footer);
        calendarContent.insert(table);
        if (this.optionsIsDraggable == true) {
            new Draggable(this.calendarOverlay);
            header.setStyle({
                cursor: 'move'
            });
        }
    },

    /**
    * This functions sets day number for a given week and day.
    * @param {Integer} week select the row (1-6)
    * @param {Integer} day select the column (1-7)
    * @param {Integer} value the given value for the day
    */
    _setDay: function(week, day, value, selected) {
        var tmpDate;
        if (value != '') {
            tmpDate = new Date(this.currentYear, this.currentMonth, value);
            //Empty cell
            var inactive = false;
            //We check to see if the day should be enabled or no based on the following comparisons:
            //The day is shown inactive if:
            //    - The date is earlier than the minimum date
            //    - The date is after the maximum date
            //    - We have a calendar linked to this one, and
            //        - This is the From date and is after the To date or
            //        - This is the To date and is earlier than the To date
            if ((!Object.isEmpty(this.optionsMinDate) && this.optionsMinDate > tmpDate) ||
                (!Object.isEmpty(this.optionsMaxDate) && this.optionsMaxDate < tmpDate) ||
                (!Object.isEmpty(this.linkedCalendar) &&
                ((this.mainLinker && !this.linkedCalendar.dateIsEmpty() && !Object.isEmpty(this.linkedCalendar.actualDate) && tmpDate > this.linkedCalendar.actualDate) ||
                (!this.mainLinker && !this.linkedCalendar.dateIsEmpty() && !Object.isEmpty(this.linkedCalendar.actualDate) && tmpDate < this.linkedCalendar.actualDate)))) {
                if (Object.isEmpty(this.daysActions[value]))
                    this.daysActions[value] = new Element('a', {
                        'class': 'datePicker_day_inactive'
                    }).update(value);
                else {
                    this.daysActions[value].addClassName('datePicker_day_inactive');
                    this.daysActions[value].update(value);
                }
                inactive = true;
            }
            if (Object.isEmpty(this.daysActions[value]))
                this.daysActions[value] = new Element('a', {
                    'class': 'datePicker_day_link'
                }).update(value);
            else
                this.daysActions[value].update(value);
            this.daysActions[value].stopObserving('click', this._selectDay);
            if (!inactive)
                this.daysActions[value].observe('click', this._selectDay.bindAsEventListener(this, value, this.currentMonth + 1, this.currentYear));
        }
        if (week > 6 || week < 1 || day < 1 || day > 7) return;
        else
            if (selected) {
            this.days[week - 1][day - 1].update(this.daysActions[value]);
            this.days[week - 1][day - 1].addClassName('datePicker_selected');
        }
        else {
            if (value == '')
                this.days[week - 1][day - 1].update('<a class="datePicker_empty_day">&nbsp;</a>');
            else
                this.days[week - 1][day - 1].update(this.daysActions[value]);
            if (this.days[week - 1][day - 1].hasClassName('datePicker_selected'))
                this.days[week - 1][day - 1].removeClassName('datePicker_selected');
            this.days[week - 1][day - 1].addClassName('datePicker_d' + (day));
        }
        if (this.days[week - 1][day - 1].hasClassName('datePicker_actualSelected'))
            this.days[week - 1][day - 1].removeClassName('datePicker_actualSelected');
        this.days[week - 1][day - 1].addClassName('datePicker_d' + (day));
        if (!Object.isEmpty(tmpDate) && !Object.isEmpty(this.actualDate))
            if (Date.compare(tmpDate, this.actualDate.clearTime()) == 0) {
            this._changeClassName(this.days[week - 1][day - 1], 'datePicker_d' + (day), 'datePicker_actualSelected');
        }
    },
    /**
    * Sets the actual date to the default date, and inserts the default date on the text fields
    */
    reloadDefaultDate: function() {
        var auxDate = this.optionsDefaultDate;
        var day = auxDate.getDate().toPaddedString(2, 10);
        var month = (auxDate.getMonth() + 1).toPaddedString(2, 10);
        var year = auxDate.getFullYear().toPaddedString(4, 10);
        this.fieldMask.setSapValue(year + "-" + month + "-" + day);
        this.actualDate = new Date(auxDate.getFullYear(), auxDate.getMonth(), auxDate.getDate());
        this.actualDate.clearTime();
    },

    /**
    * This function checks if a click is done inside 'datePicker_overlay' element or not. If the click is outside the element the function hide
    * the calendar.
    * @param evt {Event} Event information
    */
    _checkOutside: function(evt) {
        if (clickedOutsideElement('datePicker_overlay', evt))
            if (this.calendarOverlay.getStyle('display') == 'block') {
            //Hidding the calendar
            if (this.monthSelection)
                this.monthSelection.hide();
            if (this.yearSelection)
                this.yearSelection.hide();
            this.calendarOverlay.hide();
            //iFrameToSelectHide(this.calendarOverlay);
            this.setVisible = null;
            this.calendarOverlay.setStyle({
                position: 'relative'
            });
        }
        else {
            this.setVisible = false;
            this.notHideCalendar = null;
        }
    },

    /**
    * Sets the date as empty
    */
    clearFields: function() {
        this.fieldMask.setValue("");
    },

    /**
    * Checks if the current date in date picker is earlier than the one in the argument
    * @param dP Date picker to compare with
    * @returns true if the current date is earlier than the argument, false otherwise
    */
    earlierThan: function(dP) {
        var date = dP.getDateAsArray();
        var day = parseInt(date.day, 10);
        var month = parseInt(date.month, 10);
        var year = parseInt(date.year, 10);

        var ourDate = this.getDateAsArray();
        var ourDay = parseInt(ourDate.day, 10);
        var ourMonth = parseInt(ourDate.month, 10);
        var ourYear = parseInt(ourDate.year, 10); ;

        if (year < ourYear) return false;
        else {
            if (year > ourYear) return true;
            else {
                if (month < ourMonth) return false;
                else {
                    if (month > ourMonth) return true;
                    else {
                        if (day < ourDay) return false;
                        else {
                            if (day > ourDay) return true;
                            else return false;
                        }
                    }
                }
            }
        }
    },

    /**
    * Interchanges two classes for the given element
    * @param element Element to be modified
    * @param oldClass Class to be removed
    * @param newClass Class to be added
    */
    _changeClassName: function(element, oldClass, newClass) {
        element.removeClassName(oldClass);
        element.addClassName(newClass);
    },

    /**
    * Checks if all fields are empty
    * @return true if the date has all fields empty, false otherwise
    */
    dateIsEmpty: function() {
        return this.fieldMask.isEmpty();
    },

    /**
    * Sets the current date according to the param's value
    * @param date {Date} Date to be set
    */
    setDate: function(date) {
        this.actualDate = date;
        this.currentMonth = date.getMonth();
        this.currentYear = date.getFullYear();

        this.fieldMask.setSapValue(objectToSap(date));
        this.checkDateFormat(false);
    },

    /**
    * @method getErrorMessageType
    * @Checks which kind of error/warning is present with the current date of the datepicker
    * @returns a string indicating the type of error: it is used in the fieldDisplayer to identify
    *  which message needs to be shown
    */
    getErrorMessageType: function() {
        if (this.malformedDate)
            return 'WRONG_DATE';
        else if (this.linkWrong) {
            return 'WRONG_LINK';
        }
        else if ((this.linkedCalendar && !this.linkedCalendar.malformedDate) && !Object.isEmpty(this.linkedCalendar) &&
            ((this.mainLinker && !Object.isEmpty(this.linkedCalendar.actualDate) && this.actualDate > this.linkedCalendar.actualDate) ||
            (!this.mainLinker && !Object.isEmpty(this.linkedCalendar.actualDate) && this.actualDate < this.linkedCalendar.actualDate)))
            return 'OVERLAPPING_DATES';
        else if (!Object.isEmpty(this.optionsMinDate) && this.optionsMinDate > this.actualDate)
            return 'RETRO_ERR';
        else if (!Object.isEmpty(this.optionsWarningMinDate) && this.optionsWarningMinDate > this.actualDate)
            return 'RETRO_WAR';
        else if (!Object.isEmpty(this.optionsMaxDate) && this.optionsMaxDate < this.actualDate)
            return 'FUTURE_ERR';
        else if (!Object.isEmpty(this.optionsWarningMaxDate) && this.optionsWarningMaxDate < this.actualDate)
            return 'FUTURE_WAR';
        else
            return 'WRONG_DATE';
    },


    //TODO: this method seems to be no longer used
    /*
    * @method showMessage 
    * @Shows a message under the DatePicker
    * @param cssClass {string} specifies the css class that corresponds to the message
    * @param message {string} specifies the message to be shown
    */
    /*showMessage: function(cssClass, message) {
    if (Object.isEmpty(this.pulsateDiv) || this.pulsateDiv.getStyle('display') == 'none' || this.pulsateDiv.id != cssClass) {
    this.pulsateDiv = new Element('div', { 'id': cssClass, 'class': cssClass + '_css' });
    this.pulsateDiv.update(message);
    this.containerDiv.insert(this.pulsateDiv);
    this.pulsateDiv.show();
    //Fade the message
    this.pulsateDiv.fade({
    duration: 2.0,
    delay: 1.0
    });
    }
    },*/

    /**
    * Sets the month and day labels: it first tries in global, then in the labels of the DatePicker
    */
    _setMonthAndDayLabels: function() {
        this.labelMonthsNames = new Array();
        this.labelDaysNames = new Array();
        if (!Object.isEmpty(global) && !Object.isEmpty(global.labels) && !Object.isEmpty(global.labels.get('janMonth'))) {
            var jan = global.getLabel('janMonth');
            var feb = global.getLabel('febMonth');
            var mar = global.getLabel('marMonth');
            var apr = global.getLabel('aprMonth');
            var may = global.getLabel('mayMonth');
            var jun = global.getLabel('junMonth');
            var jul = global.getLabel('julMonth');
            var aug = global.getLabel('augMonth');
            var sep = global.getLabel('sepMonth');
            var oct = global.getLabel('octMonth');
            var nov = global.getLabel('novMonth');
            var dec = global.getLabel('decMonth');
            //            var sun = global.getLabel('sunDay').substring(0, 3);
            //            var mon = global.getLabel('monDay').substring(0, 3);
            //            var tue = global.getLabel('tueDay').substring(0, 3);
            //            var wed = global.getLabel('wedDay').substring(0, 3);
            //            var thu = global.getLabel('thuDay').substring(0, 3);
            //            var fri = global.getLabel('friDay').substring(0, 3);
            //            var sat = global.getLabel('satDay').substring(0, 3);
            //            var sun = global.getLabel('sunDay').substring(0, 3);
            var mon = global.getLabel('mon');
            var tue = global.getLabel('tue');
            var wed = global.getLabel('wed');
            var thu = global.getLabel('thu');
            var fri = global.getLabel('fri');
            var sat = global.getLabel('sat');
            var sun = global.getLabel('sun');
            this.labelTitle = global.getLabel('datePickerTitle');
            this.labelNext = global.getLabel('next');
            this.labelPrevious = global.getLabel('previous');
            this.labelOutOfRange = global.getLabel('outOfRange');
            this.labelOverlappingDates = global.getLabel('overlappingDates');
            this.labelWarningRange = global.getLabel('warningRange');
            this.labelMonthsNames.push(jan, feb, mar, apr, may, jun, jul, aug, sep, oct, nov, dec);
            this.labelDaysNames.push(sun, mon, tue, wed, thu, fri, sat);
        } else {
            var jan = this._getLabel('jan');
            var feb = this._getLabel('feb');
            var mar = this._getLabel('mar');
            var apr = this._getLabel('apr');
            var may = this._getLabel('may');
            var jun = this._getLabel('jun');
            var jul = this._getLabel('jul');
            var aug = this._getLabel('aug');
            var sep = this._getLabel('sep');
            var oct = this._getLabel('oct');
            var nov = this._getLabel('nov');
            var dec = this._getLabel('dec');
            var sun = this._getLabel('sun').substring(0, 2);
            var mon = this._getLabel('mon').substring(0, 2);
            var tue = this._getLabel('tue').substring(0, 2);
            var wed = this._getLabel('wed').substring(0, 2);
            var thu = this._getLabel('thu').substring(0, 2);
            var fri = this._getLabel('fri').substring(0, 2);
            var sat = this._getLabel('sat').substring(0, 2);
            this.labelTitle = this._getLabel('title');
            this.labelNext = this._getLabel('next');
            this.labelPrevious = this._getLabel('previous');
            this.labelOutOfRange = this._getLabel('outOfRange');
            this.labelOverlappingDates = global.getLabel('overlappingDates');
            this.labelWarningRange = global.getLabel('warningRange');
            this.labelMonthsNames.push(jan, feb, mar, apr, may, jun, jul, aug, sep, oct, nov, dec);
            this.labelDaysNames.push(sun, mon, tue, wed, thu, fri, sat);
        }
    },

    /**
    * Gets the label from the options or returns the id if it does not exist
    * @param labelId {string} label id to be returned
    */
    _getLabel: function(labelId) {
        return (!Object.isEmpty(this.labels) && this.labels.get(labelId)) ? this.labels.get(labelId) : labelId;
    },

    /**
    * Checks if the date is out of range
    */
    isOutOfRange: function() {
        //Create a date object to check if it is correct
        var sapDate = this.fieldMask.getSapValue();
        var year = parseInt(sapDate.slice(0, 4), 10);
        var month = parseInt(sapDate.slice(4, 6), 10);
        var day = parseInt(sapDate.slice(6, 8), 10);
        var date = new Date().clearTime();
        date.setFullYear(year, month - 1, day);

        //Check if it is out of Range
        return this._isDateOutOfRange(date);
    },

    /**
    * Disables the date picker
    */
    disable: function() {
        Form.Element.disable(this.inputField);
        Form.Element.disable(this.calendarIcon);
    },

    /**
    * Enables the date picker
    */
    enable: function() {
        Form.Element.enable(this.inputField);
        Form.Element.enable(this.calendarIcon);
    },

    /**
    * Destroys the object, stopping all events
    */
    destroy: function() {
        while (this.observedEvents.size() > 0) {
            this.observedEvents.pop().stop();
        }
        if (!Object.isEmpty(this.fieldMask)) {
            this.fieldMask.destroy();
        }
    }
});
