/**
 *@fileoverview calendar.js
 *@description It contains the classes needed for the Calendar application to work.
 */
/**
 *@constructor
 *@description Implements the view layer for the Calendar Application
 */
var CAL = Class.create(parentCalendar,
/**
* @lends CAL
*/
{
    /**
    * @type {CAL_Calendar}
    * @description Object that contains the whole calendar logic so we can maintain it
    *       separated from "drawing" logic.
    */
    calendarData: null,
    /**
    * @type {String}
    * @description ID for the DIV that will contain the application
    */
    appDivId: null,
    /**
    * @type {Element}
    * @description Element object to access to the application container DIV
    */
    appDiv: null,
    /**
    * @type {String}
    * @description Name for the application. Used to maintain a namespace for some styles, etc.
    */
    appName: null,
    /**
    * @type {Array}
    * @description an Array containing the drawing structure for the current calendar view.
    */
    calendarMatrix: null,
    /**
    * @type Hash
    * @description A hash with the work schedule of the selected employees
    **/
    workSchedules: $H({}),
    /**
    * @type {Boolean}
    * @description Says if the content for new event has been loaded
    */
    menuBalloonOpened: false,
    /**
    * @type {Boolean}
    * @description Whether the used has done a selection or not.
    */
    selectionDone: false,
    /**
    * @type {Hash}
    * @description Which data has already been preloaded in the calendar. 
    */
    preloadedDataInfo: $H(),
    /**
    * @type {Hash}
    * @description Hash to store the arguments the AJAX requests handler will receive.
    */
    ajaxRequestArguments: $H(),
    /**
    * @type {Element}
    * @description HTML Element containing the whole calendar HTML
    */
    calendarContainer: null,
    /**
    * @type {Hash}
    * @description A Hash which stores each of the days DIV elements.
    */
    daysHash: $H(),
    /**
    * @type {Array}
    * @description an Array with all the dates headers.
    */
    datesHeaders: null,
    /**
    * @type String
    * @description Service to get the actions when you click on a cell in the monthly calendar
    */
    balloonService: "GET_CON_ACTIO",
    /**
    * @type String
    * @description Service to get the available actions when you click on a cell in the monthly calendar in case the payroll is running
    */
    RFballoonService: "GET_CON_ACTP",
    /**
    * @param $super the super class initializer
    * @description initializes data for the application
    */
    initialize: function($super, options) {
        $super(options);
        this.onBalloonClosedBinding = this.onBalloonClosed.bindAsEventListener(this);
        document.observe('EWS:calendar_refreshButtonClicked_CAL',this._refreshButtonClicked.bind(this));
        this.resizeSelectionDivOnHelpBinding = this.resizeSelectionDivOnHelp.bind(this);
    },
    /**
    * @description this method is called when the application is executed.
    */
    run: function($super) {
        $super();
        this.visible = true;
        if (this.firstRun) {
            //initialize the calendar Data
            this.cal = new CalendarData();
            //initializes a matrix which maps the drawing in memory.
            this.initCalendarMatrix();
            //initialize the employees selection binding.
            this.virtualHtml.insert(new Element('div', {
                'id': 'CAL_tableContainer'
            }));
            this.calendarContainer = this.virtualHtml.down('[id=CAL_tableContainer]');
            this.renderEmpty();
            this.renderSelectionDiv();
            this.firstRun = false;
            this.eventsReceived = new Hash();
        }
        // If there were creations, modifications or deletions, we have to refresh the calendar
        if (this.refresh) {
            this.eventsReceived = new Hash();
                if (parentCalendar.prototype.filterJson != null)
                        this._updateFilterPanel(parentCalendar.prototype.filterJson);//Update the filter options
            this._refreshButtonClicked();
            this.refresh = false;
        }
        //Flag retro/future active
        this.retroFuture = false;
        //To store the retro/future dates per screen in each step in case this.retroFuture active
        this.retroFutureHash = new Hash();
        this.employeeRestriction = null;
            
        document.observe('EWS:balloon_closed', this.onBalloonClosedBinding);
    },
    /**
    * @description called when the application is not shown.
    */
    close: function($super) {
        $super();
        this.visible = false;
        //Update the "parentCalendar.prototype.parentFilter" if we leave this app without push the "refresh" button in the filter options.
        if(parentCalendar.prototype.parentFilter == ""){
	        this.getFilterSelectedOptions();
        }
        if (!Object.isUndefined(this.selectionDiv)) {

            this.onBalloonClosed();
        }
        document.stopObserving('EWS:balloon_closed', this.onBalloonClosedBinding);
    },
    /**
    * Used to resize and reposition the selection div when the help application is opened.
    */
    resizeSelectionDivOnHelp: function(args) {
        var app = getArgs(args).get("app");
        if (app.toLowerCase() == "help") {
            this.resizeSelectionDiv.bind.defer(this);
        }
    },
    /**
    * Initializes some of the data structures needed to store the calendar
    * 		 calculations.
    */
    initCalendarMatrix: function() {
        var matrix = new Array(this.cal.numberOfWeeks);
        for (var i = 0; i < matrix.length; i++) {
            matrix[i] = new Array(4);
            for (var j = 0; j < 4; j++) {
                matrix[i][j] = new Array(8);
                for (var k = 0; k < 7; k++)
                    matrix[i][j][7] = 0;
            }
        }
        this.calendarMatrix = matrix;
    },
    /**
    * Renders an empty calendar and assign necessary properties to its elements
    * 		 as event listeners, etc.
    */
    renderEmpty: function() {
        //on first run render the controls to navigate through the calendar.
        if (this.firstRun) {

            //***********************
            //CONTROLS INITIALIZATION
            //***********************

            //this div will contain all the controls for the calendar.
            this.controls = new Element('div', {
                'id': "CAL" + '_controlsContainer'
            });
            this.calendarContainer.update(this.controls);
            //Date switching form controls
            var months = [
                'janMonth',
                'febMonth',
                'marMonth',
                'aprMonth',
                'mayMonth',
                'junMonth',
                'julMonth',
                'augMonth',
                'sepMonth',
                'octMonth',
                'novMonth',
                'decMonth'
                ];
            var monthsLength = months.length;
            //months drop down and select current month
            this.selectMonths = new Element('select', {
                    'id': 'CAL_setMonth', 'class': 'test_select'
            }).observe('change', this.onChangeDate.bind(this));
            if(global.liteVersion){
    	        this.selectMonths.writeAttribute('title',global.getLabel("currMonth"));
            }
            //month names drow down

            if (Prototype.Browser.Gecko)
                var options = "";
            for (var i = 0; i < monthsLength; i++) {
                if (Prototype.Browser.Gecko) {
                    var option = '<option value="' + i + '">' + global.getLabel(months[i]) + '</option>';
                    options += option;
                }
                else
                    this.selectMonths.options[i] = new Option(global.getLabel(months[i]), i, false);
            }
            if (Prototype.Browser.Gecko)
                this.selectMonths.insert(options);
            this.controls.insert(this.selectMonths);
            this.selectMonths.selectedIndex = parseInt(this.cal.currentDate.toString('M')) - 1;
            //previous month button
            var arrowClass = '';
            if (!global.liteVersion)
                arrowClass = 'application_verticalL_arrow ';
            var prevMonth = new Element('input', {
                'id': 'CAL_previousMonth',
                    'class': arrowClass + 'application_handCursor test_icon',
                'type': 'button',
                'title': global.getLabel("prevMonth")
            });
            if (global.liteVersion) {
                prevMonth.writeAttribute('value', '<');
                prevMonth.addClassName('inlineElement calendar_boldArrow');
            }
            this.selectMonths.insert({
                before: prevMonth
            });
            prevMonth.observe('click', this.onChangeDate.bind(this));
            //fixes an issue with IE eventing stack as it's different from the standard
            if (Prototype.Browser.IE)
                prevMonth.observe('dblclick', this.onChangeDate.bind(this));
            //next month button
            arrowClass = '';
            if (!global.liteVersion)
                arrowClass = 'application_verticalR_arrow ';
            var neMonth = new Element('input', {
                'id': 'CAL_nextMonth',
                    'class': arrowClass + 'application_handCursor test_icon',
                'type': 'button',
                'title': global.getLabel("nextMonth")
            });
            if (global.liteVersion) {
                neMonth.writeAttribute('value', '>');
                neMonth.addClassName('inlineElement calendar_boldArrow');
            }
            this.selectMonths.insert({
                after: neMonth
            });
            neMonth.observe('click', this.onChangeDate.bind(this));
            //fixes an issue with IE eventing stack as it's different from the standard
            if (Prototype.Browser.IE)
                neMonth.observe('dblclick', this.onChangeDate.bind(this));
            //years drop down
            this.selectYears = new Element('select', {
                    'id': 'CAL_setYear', 'class': 'test_select'
            }).observe('change', this.onChangeDate.bind(this));
            if(global.liteVersion){
    	        this.selectYears.writeAttribute('title',global.getLabel("PCHZTR_Y"));
            }
            this.controls.insert(this.selectYears);
            var currentYear = this.cal.currentDate.toString('yyyy');
            //select years options
            var options = '<option value="' + currentYear + '">' + currentYear + '</option>';
            for (var i = 1; i <= 4; i++) {
                var year = parseInt(currentYear) + i;
                options = options + '<option value="' + year + '">' + year + '</option>';
                year = currentYear - i;
                options = '<option value="' + year + '">' + year + '</option>' + options;
            }
            this.selectYears.update(options);
            this.selectYears.selectedIndex = 4;
            //previous year button
            arrowClass = '';
            if (!global.liteVersion)
                arrowClass = "application_verticalL_arrow ";
            var preYear = new Element('input', {
                'id': 'CAL_previousYear',
                    'class': arrowClass + 'application_handCursor test_icon',
                'type': 'button'
            });
            if (global.liteVersion) {
                preYear.writeAttribute('value', '<');
                preYear.writeAttribute('title', global.getLabel("previousYear"));
                preYear.addClassName('inlineElement calendar_boldArrow');
            }
            this.selectYears.insert({
                before: preYear
            });
            preYear.observe('click', this.onChangeDate.bind(this));
            //fixes an issue with IE eventing stack as it's different from the standard
            if (Prototype.Browser.IE)
                preYear.observe('dblclick', this.onChangeDate.bind(this));
            //next year button
            arrowClass = '';
            if (!global.liteVersion)
                arrowClass = "application_verticalR_arrow ";
            var neYear = new Element('input', {
                'id': 'CAL_nextYear',
                    'class': arrowClass + 'application_handCursor test_icon',
                'type': 'button'
            });
            if (global.liteVersion) {
                neYear.writeAttribute('value', '>');
                neYear.writeAttribute('title', global.getLabel("viewBenStatementFuture"));
                neYear.addClassName('inlineElement calendar_boldArrow');
            }
            this.selectYears.insert({
                after: neYear
            });
            neYear.observe('click', this.onChangeDate.bind(this));
            //fixes an issue with IE eventing stack as it's different from the standard
            if (Prototype.Browser.IE)
                neYear.observe('dblclick', this.onChangeDate.bind(this));
            //Today button
            var json = {
                elements: [],
                    mainClass:'CAL_todayButton'
            };
            var aux = {
                idButton: 'CAL_today',
                label: prepareTextToEdit(global.getLabel('today')),
                handlerContext: null,
                handler: this.onGoToToday.bind(this),
                type: 'button',
                standardButton: true
            };
            json.elements.push(aux);
            var ButtonJobProfile = new megaButtonDisplayer(json);
            this.controls.insert(ButtonJobProfile.getButtons());
            var filterButton;
            if (!global.liteVersion) {
                filterButton = new Element("div", {
                    "class": "application_action_link applicationCAL_filterOptions",
                    "id": "applicationCAL_filterDiv"
                });
            } else {
                filterButton = new Element("button", {
                    "class": "application_action_link applicationCAL_filterOptions link",
                    "id": "applicationCAL_filterDiv"
                });
            }
            this.controls.insert(filterButton);
            this.calendarContainer.insert(this.filterElement);

            //****************************
            //HTML ELEMENTS INITIALIZATION
            //****************************
            this.datesHeaders = $A();
            //          Calendar HTML elements
            this.table = new Element('table', {
                id: "CAL_table",
                'cellspacing': '0'
            });
            //this will handle the day selection
            this.table.observe('mousedown', this.onMouseDownSelection.bind(this));
            //this event will avoid the date selection in the table
            if (Prototype.Browser.IE) {
                this.table.observe('selectstart', function(event) {
                    event.stop();
                });
            } else {
                this.table.style.MozUserSelect = "none";
            }

            //            add the days' names header
            var weekDaysHtml = '<tr>';
            var weekDaysLabels = ['sunDay', 'monDay', 'tueDay', 'wedDay', 'thuDay', 'friDay', 'satDay'];
            for (var i = 0; i < 7; i++) {
                weekDaysHtml += '<th>';
                var index;
                //when first day of week is Sunday
                if (this.cal.firstDayOfWeek == 0) {
                    index = i;
                } else if (i == 6) { //Sunday for last day
                    index = 0;
                } else { //and each other day use the label just before
                    index = i + 1;
                }
                weekDaysHtml += global.getLabel(weekDaysLabels[index]);
                weekDaysHtml += '</th>';
            }
            weekDaysHtml += '</tr>';
            this.thead = new Element('thead').insert(weekDaysHtml);
            this.tbody = new Element('tbody', {
                id: "CAL" + '_tbody'
            });
            this.tfoot = new Element('tfoot').insert(
                    '<tr><td colspan="7"><span id="CAL_infoText" class="application_main_soft_text">' +
                    global.getLabel('inputComment') +
                    '</span></td></tr>'
                    );
        }
        else
            this.datesHeaders = $A();
        //Calendar's table filling and calendar matrix data initialize
        var date = this.cal.calendarBounds.begda.clone();
        var startOfWeek = null;
        var endOfWeek = null;
        var weekNumber = 0;
        //loop each row in the calendar
        for (var i = 0; i < this.cal.numberOfWeeks * 2; i++) {

            //after 5 rows switch to the next week.
            var tr = new Element('tr');
            if (i % 2 == 0) {
                tr.addClassName('CAL_datesHeader');
                this.datesHeaders.push(tr);
                weekNumber++;
            }
            //use start of week and end of week to loop in these days.
            startOfWeek = this.cal.calendarBounds.begda.clone().add(weekNumber - 1).weeks();
            endOfWeek = this.cal.calendarBounds.begda.clone().add(weekNumber).weeks().add(-1).days();
            date = startOfWeek.clone();
            do {

                var td = new Element('td');


                //if it's te last day, add an style to draw the calendar
                //border
                if (date.getDay() == this.cal.lastDayOfWeek) {

                    td.addClassName('CAL_endWeek');
                }
                //cells in the first row of a week. This adds a style to draw the top border.
                td.addClassName('CAL_day_' + date.toString('MM_dd_yyyy'));
                //first cell in the week row is the header
                if (i % 2 == 0) {
                    td.setAttribute('id', 'CAL_day_header_' + date.toString('MM_dd_yyyy'));
                    td.addClassName('CAL_weekHeader');
                    if (date.isToday()) {
                        td.addClassName('CAL_today');
                    } else if (date.getMonth() != this.cal.currentDate.getMonth()) {

                        td.addClassName('CAL_diffMonth');
                    }
                    td.insert(date.toString('dd'));
                } else {
                    //The second cell is the content
                    var div = new Element('div', {
                        id: 'CAL_day_content_' + date.toString('MM_dd_yyyy'),
                            className: 'CAL_dayContent test_calendarDayButton'
                    });
                    td.addClassName("CAL_normalTD");
                    td.update(div);
                    //store the div so no more DOM accesses are required
                    this.daysHash.set(date.toString('MM_dd_yyyy'), div);
                }
                tr.insert(td);
                date.add(1).days();
            } while (date.between(startOfWeek, endOfWeek));
            i == 0 ? this.tbody.update(tr) : this.tbody.insert(tr);
        }
        //Calendar's elements insertion
        if (this.firstRun) {
            this.table.update(this.thead);
            this.table.insert(this.tbody);
            this.table.insert(this.tfoot);
            this.calendarContainer.insert(this.table);
        }
    },
    /**
    * This method render a div that will be over the calendar ready to act as a selector
    * for dates ranges.
    */
    renderSelectionDiv: function() {

        //do not re-render the selection div
        if (!Object.isUndefined(this.selectionDiv)) return;
        var datesHeadersLength = this.datesHeaders.size();
        var weeksHeights = new Array();
        var tbodyHeight = this.tbody.getHeight();
        var dayWidth = this.datesHeaders[0].down().getWidth();
        //adapt width according to the browser
        if (Prototype.Browser.Gecko) {
            dayWidth -= 0.3;
        } else if (Prototype.Browser.IE) {
            // IE8 fix
            var isIE6 = parseInt(navigator.userAgent.substring(navigator.userAgent.indexOf("MSIE") + 5)) == 6;
            var isIE7 = parseInt(navigator.userAgent.substring(navigator.userAgent.indexOf("MSIE") + 5)) == 7;
            if (isIE6 || isIE7)
                dayWidth += 1;
        } else if (Prototype.Browser.WebKit)
            dayWidth += 0.95;
        //calculate weeks height
        for (var i = 0; i < datesHeadersLength; i++) {
            if (i == datesHeadersLength - 1) {
                height = tbodyHeight;
                weeksHeights.push(height);
            } else {
                var position = this.datesHeaders[i].cumulativeOffset();
                var positionNext = this.datesHeaders[i + 1].cumulativeOffset();
                var height = positionNext.top - position.top;
                weeksHeights.push(height);
                tbodyHeight -= height;
            }
        }
        this.selectionDiv = new Element('div', {
            'id': 'CAL_daySelectorDiv'
        });
        this.selectionCells = $A();
        var tbodyPosition = this.tbody.cumulativeOffset();
        $('frameWork').insert(this.selectionDiv);
        this.selectionDiv.hide();
        var k = 0;
        //assign selection divs properties
        for (var i = 0; i < datesHeadersLength; i++) {
            for (var j = 0; j < 7; j++, k++) {
                var newDaySelector = new Element('div', {
                    'id': 'CAL_selector_' + k,
                    'class': 'CAL_daySelector'
                });
                newDaySelector.setStyle({
                    'width': dayWidth + 'px',
                    'height': weeksHeights[i] + 'px',
                    'float': 'left',
                    //'border-right': '1px solid #000',
                    'margin': '0px',
                    'padding': '0px',
                    'font-size': '0px'
                });
                this.selectionDiv.insert(newDaySelector);
                //store each cell for further reference.
                this.selectionCells.push(newDaySelector);
            }
        }
        //set position for the selection div
        this.selectionDiv.setStyle({
            'border-left': '#A3A3A3 1px dashed'
        });
        this.selectionDiv.absolutize();
        //Take an empty div and position it over the calendar.
        if (Prototype.Browser.IE) {
            this.selectionDiv.setStyle({
                'top': tbodyPosition.top,
                'left': tbodyPosition.left
            });
        } else {
            this.selectionDiv.clonePosition(this.tbody);
        }
        var fullWidth = parseInt(this.tbody.getWidth(), 10) + parseInt(Prototype.Browser.IE ? 7 : 0, 10);

        var fullHeight = this.tbody.getHeight();
        this.selectionDiv.setStyle({
            width: fullWidth + 'px',
            height: fullHeight + 'px'
        });
        this.selectionDiv.observe('mouseover', this.onMouseDragToSelect.bind(this));
        document.observe('mouseup', this.onMouseUpSelection.bind(this));
        if (Prototype.Browser.IE) {
            this.selectionDiv.observe('selectstart', function(event) {
                event.stop();
            });
            this.selectionDiv.observe('resize', function(event2) {
                event2.stop();
            });
        }
        //resize and reposition selection div if there's been a resize event.
        Event.observe(window, 'resize', function() {
            if (!Object.isEmpty(this.selectionDiv)) {
                if (Prototype.Browser.IE) {
                    var tbodyPosition = this.tbody.cumulativeOffset();
                    this.selectionDiv.setStyle({
                        'top': tbodyPosition.top,
                        'left': tbodyPosition.left
                    });
                } else {
                    this.selectionDiv.clonePosition(this.tbody);
                }
                this.resizeSelectionDiv();
            }
            
        } .bind(this));
    },
    /**
    * Removes the previous selection div so it can be-recreated
    */
    _removePreviousSelectionDiv: function() {
        if (!Object.isUndefined(this.selectionDiv)) {
            this.selectionDiv.remove();
            this.selectionDiv = undefined;
        }
    },
    /**
    * @description takes care of resizing the selection div when the window is resized
    * 				or when there's new events in the calendar
    */
    resizeSelectionDiv: function() {
        var datesHeadersLength = this.datesHeaders.size();
        var weeksHeights = new Array();
        var tbodyHeight = this.tbody.getHeight();
        if (tbodyHeight == 0) return;
        for (var i = 0; i < datesHeadersLength; i++) {
            if (i == datesHeadersLength - 1) {
                height = tbodyHeight;
                weeksHeights.push(height);
            } else {
                var position = this.datesHeaders[i].cumulativeOffset();
                var positionNext = this.datesHeaders[i + 1].cumulativeOffset();
                var height = positionNext.top - position.top;
                weeksHeights.push(height);
                tbodyHeight -= height;
            }
        }

        var fullWidth = this.tbody.getWidth() + (Prototype.Browser.IE ? 4 : -1);

        this.selectionDiv.setStyle({
            'width': fullWidth + 'px',
            'height': this.tbody.getHeight() - 1 + 'px'
        });

        var selectionCellsLength = this.selectionCells.size();

        for (var i = 0; i < selectionCellsLength; i++) {
            if (Math.floor(i / 7) < datesHeadersLength)
                this.selectionCells[i].setStyle({
                    'height': weeksHeights[Math.floor(i / 7)] + 'px'
                });
            else
                this.selectionCells[i].setStyle({
                    "height": "0px"
                });
        }
    },

    /**
    * @param event {CAL_Event}
    * @description adds an event to matrix representing the calendar view.
    */
    addEventToDraw: function(event) {

        //get info about the event segments to insert them in the matrix.
        var eventSegments = this.newEventGraphicObject(event);
        var firstSegment = eventSegments.get(eventSegments.keys()[0]);
        var startingWeek = firstSegment.get('startWeek');
        if (startingWeek < 0) {
            startingWeek = 0;
        }
        var endingWeek = firstSegment.get('endWeek');

        //create an event from the event starting week to its ending week in the current calendar,
        //get each week row and take a look to see in which row the event can be drawn. Once enouch space
        //is found, set it to be drawn.
        if (endingWeek >= this.cal.numberOfWeeks)
            endingWeek = this.cal.numberOfWeeks - 1;
        for (var week = startingWeek; week <= endingWeek; week++) {

            var rowsInThisWeek = this.calendarMatrix[week];
            var numberOfRowsInThisWeek = rowsInThisWeek.length;
            //this flag is set to true when adding a new row in order to
            //assign a correct refreshing value to the row
            var numberOfRowsUpdated = false;
            for (var i = 0; i < numberOfRowsInThisWeek; i++) {

                var leftOffset, rightOffset;
                leftOffset = eventSegments.get(week).get('leftOffset');
                rightOffset = eventSegments.get(week).get('rightOffset');
                //look at the correct matrix position to see if there's gaps in the position
                //this new event segment would use.
                var fits = true;
                //loop only the positions that would be used by the event.
                for (var day = leftOffset; day < eventSegments.get(week).get('length') + leftOffset; day++) {
                    //check to avoid inserting twice
                    if (!Object.isEmpty(rowsInThisWeek[i][day]) && event.id == rowsInThisWeek[i][day].id) return;

                    //check if the event fits the needed days
                    fits = fits && Object.isEmpty(rowsInThisWeek[i][day]);
                }
                //If the segment fits, insert it. Otherwise look in the next row in the same week
                if (fits) {

                    //set the cells used by this event with its basic data to make possible
                    //get its data later.
                    for (var day = leftOffset; day <= 6 - rightOffset; day++) {
                        this.calendarMatrix[week][i][day] = event;
                    }
                    //mark this row for properly redrawing (adding a new row to table or just updating)
                    if (numberOfRowsUpdated || this.calendarMatrix[week][i][7] == 2)
                        this.calendarMatrix[week][i][7] = 2;
                    else
                        this.calendarMatrix[week][i][7] = 1;
                    numberOfRowsUpdated = false;
                    fits = false;
                    //as the segment is inserted go out of this loop to avoid unnecessary looping.
                    break;
                } else if (i == numberOfRowsInThisWeek - 1) {

                    //if it doesn't fit and it's the last row, add a new row in the week.
                    rowsInThisWeek.push(new Array(8));
                    numberOfRowsInThisWeek++;
                    numberOfRowsUpdated = true;
                }
            }
        }
    },
    /**
    * @param {CAL_Event} event is an Object containing all the info related to the event.
    * @return {String} an String with the HTML needed to insert the event in the
    *         calendar (just a td with it's corresponding colspan). If it's
    *         more than a week it splits it in as many weeks as needed.
    */
    newEventGraphicObject: function(event) {
        var begDate = event.begDate.clone();
        var endDate = event.endDate.clone();
        // Checking hour format
        var hourFormat = (global.hourDisplayFormat == "24") ? 'HH:mm' : 'h:mm tt';
        //we check the event to see if it starts and ends inside te current calendar
        //as drawing will depend on it.
        var startsInThisCalendar = begDate.clone().clearTime().between(this.cal.calendarBounds.begda, this.cal.calendarBounds.endda);
        var endsInThisCalendar = endDate.clone().clearTime().isBefore(this.cal.calendarBounds.endda);
        var startingWeek;
        var endingWeek;
        if (startsInThisCalendar) {
            var begda = this.cal.calendarBounds.begda.clone();
            var nextWeek = begda.clone();
            var weeksCounter = 0;
            while (!begDate.isBefore(nextWeek.add(7).days())) {
                weeksCounter++;
                if (weeksCounter > this.cal.weeksNumber) {
                    weeksCounter = this.cal.weeksNumber;
                    break;
                }
            }
            startingWeek = weeksCounter;
        }
        else
            startingWeek = 0;
        if (endsInThisCalendar) {
            var begda = this.cal.calendarBounds.begda.clone();
            var nextWeek = begda.clone();
            var weeksCounter = 0;
            while (!endDate.isBefore(nextWeek.add(7).days())) {
                weeksCounter++;
                if (weeksCounter > this.cal.weeksNumber) {
                    weeksCounter = this.cal.weeksNumber;
                    break;
                }
            }
            //nextWeek.add(1).days();
            endingWeek = weeksCounter;
        }
        else
            endingWeek = this.cal.numberOfWeeks;
        //how many rows does this event will be drawn into
        var numberOfWeeks = endingWeek - startingWeek + 1;
        //to store all the different segments for this event.
        var eventSegments = $H();
        var eventText = event.text;
        var drawBeginning, drawEnding;
        //If the event has to be drawn in more than a calendar view, we do not get the segments
        //belonging to the previous or the next calendar view.
        if (startsInThisCalendar)
            drawBeginning = event.begDate.clone();
        else
            drawBeginning = this.cal.calendarBounds.begda.clone();
        if (endsInThisCalendar)
            drawEnding = event.endDate.clone();
        else
            drawEnding = this.cal.calendarBounds.endda.clone();
        //we get as many segments as needed for the current event, e.g. if it's 2 weeks long we get
        //2 segments.
        for (var i = 0; i < numberOfWeeks; i++) {
            var leftOff, rightOff;
            //adapt events for weeks starting on monday or sunday
            if (drawBeginning.getDay() == this.cal.firstDayOfWeek)
                leftOff = 0;
            else {
                leftOff = drawBeginning.getOrdinalNumber() - drawBeginning.clone().moveToDayOfWeek(this.cal.firstDayOfWeek, -1).getOrdinalNumber();
                if (leftOff < 0) leftOff += (Date.isLeapYear(this.cal.calendarBounds.begda.clone().getFullYear()) ? 366 : 365);
            }
            //We get how many days is the event segment far from the end of the week and how far the
            //event is from it's ending. keep the smaller one and it will be the event segment 
            //length
            var farFromEndOfWeek;
            if (drawBeginning.getDay() == this.cal.lastDayOfWeek)
                farFromEndOfWeek = 0;
            else
                farFromEndOfWeek = drawBeginning.clone().moveToDayOfWeek(this.cal.lastDayOfWeek).getOrdinalNumber() - drawBeginning.getOrdinalNumber();
            var farFromEndOfEvent = drawEnding.getOrdinalNumber() - drawBeginning.getOrdinalNumber();
            if (farFromEndOfWeek < 0)
                farFromEndOfWeek = farFromEndOfWeek + 365;
            if (farFromEndOfEvent < 0)
                farFromEndOfEvent = farFromEndOfEvent + 365;
            var segmentLength = farFromEndOfEvent < farFromEndOfWeek ? farFromEndOfEvent : farFromEndOfWeek;
            rightOff = 7 - segmentLength - leftOff;
            //if starts and ends in the same day, the segment length is 1, not 0	 
            segmentLength = parseInt(segmentLength) + 1;
            var color;
            if (this.getEmployee(event.pernr))
                color = this.getEmployee(event.pernr).color;
            if (Object.isUndefined(color)) color = 0;
            if (!Object.isNumber(color)) color = 0;
            color = "eeColor" + color.toPaddedString(2);
            var eventSegment = new Element("div");
            if (event.appId != "TIM_ERR") {
                var retroDates = null;
                if(this.retroFuture)
                    retroDates = this.retroFutureHash.get(event.appId) ? this.retroFutureHash.get(event.appId) : null;
                eventSegment.observe("click", function() {
                    global.open($H({
                        app: {
                            appId: event.appId,
                            //tabId: this.options.tabId,
                            view: event.view
                        },
                        event: this.eventsReceived.get(event.id),
                        eventInformation: event,
                        eventCodes: this.eventCodes,
                        employee: event.pernr,
                        retroDates: retroDates
                    }));
                }.bind(this));
            }
            else {
                eventSegment.observe("click", function() {
                    global.open( $H({
                        app: {
                            appId: event.appId,
					        //tabId: this.options.tabId,
                            view: event.view
                        },
                        event: this.eventsReceived.get(event.id),
                        eventInformation: event,
                        eventCodes: this.eventCodes,
                        employee: event.pernr,
                        message: this.timeErrorMessages.get(begDate.toString("yyyy-MM-dd"))
                    }));
                }.bind(this));
            }
            var pixelsWidth = 101;
            if (segmentLength > 1) {
                pixelsWidth++;
                pixelsWidth *= segmentLength;
            }
            if (event.allDay) {
                eventSegment.addClassName("CAL_wholeDayEventContainer");
                eventSegment.setStyle({
                    "width": pixelsWidth + "px"
                });
                var eventSegmentText = '<div class="CAL_wholeDayEventBorder ' + color + '"></div>';
                eventSegmentText += '<div class="CAL_wholeDayEventBody ' + color + '">';
                eventSegmentText += '<div class="CAL_wholeDayEventText ' + color + '">';
                var approvalClass = "";
                var approvalIcon = "";
                if ((event.status == 1) || (event.status == 5)) {
                    approvalClass = 'application_rounded_question CAL_wholeDayEvent_icon';
                    approvalIcon = '&nbsp;?&nbsp;';
                }
                if (event.status == 2) {
                    approvalClass = 'application_rounded_x CAL_wholeDayEvent_icon';
                    approvalIcon = '&nbsp;X&nbsp;';
                }
                if (event.status == 4) {
                    approvalClass = 'application_rounded_draft CAL_wholeDayEvent_icon';
                    approvalIcon = '&nbsp;D&nbsp;';
                }
                if (event.status == 7) {
                    approvalClass = 'application_rounded_ok CAL_wholeDayEvent_icon';
                    approvalIcon = '&nbsp;V&nbsp;';
                }
                if (!global.liteVersion && !Object.isEmpty(approvalClass))
                    eventSegmentText += '<div class="' + approvalClass + '">&nbsp;</div>';
                if (global.liteVersion && !Object.isEmpty(approvalIcon))
                    eventSegmentText += '<div class="inlineElement">' + approvalIcon + '</div>';
                eventSegmentText += '<div class="CAL_acronymWrapper"><acronym title="';
                eventSegmentText += eventText;
                eventSegmentText += '" class="';
                if ((event.status == 4) || (event.status == 5) || (event.status == 6))
                    eventSegmentText += 'application_text_italic ';
                eventSegmentText += color + '">';
                eventSegmentText += eventText;
                eventSegmentText += '</acronym></div>';
                eventSegmentText += '</div>';
                eventSegmentText += '</div>';
                eventSegmentText += '<div class="CAL_wholeDayEventBorder ' + color + '">';
                eventSegment.update(eventSegmentText);
            }
            else {
                if (begDate.clone().clearTime().compareTo(endDate.clone().clearTime()) != 0) {
                    eventSegment.addClassName("CAL_wholeDayEventContainer");
                    eventSegment.setStyle({
                        "width": pixelsWidth + "px"
                    });
                    var eventSegmentText = '<div class="CAL_wholeDayEventBorder ' + color + '"></div>';
                    eventSegmentText += '<div class="CAL_wholeDayEventBody CAL_nonWholeDayEventBorders application_border_color_' + color + '">';
                    eventSegmentText += '<div class="CAL_wholeDayEventText">';
                    var approvalClass = "";
                    var approvalIcon = "";
                    if ((event.status == 1) || (event.status == 5)) {
                        approvalClass = 'application_rounded_question1 CAL_IE6_event';
                        approvalIcon = '&nbsp;?&nbsp;';
                    }
                    if (event.status == 2) {
                        approvalClass = 'application_rounded_x1 CAL_IE6_event';
                        approvalIcon = '&nbsp;X&nbsp;';
                    }
                    if (event.status == 4) {
                        approvalClass = 'application_rounded_draft1 CAL_IE6_event';
                        approvalIcon = '&nbsp;D&nbsp;';
                    }
                    if (event.status == 7) {
                        approvalClass = 'application_rounded_ok1 CAL_IE6_event';
                        approvalIcon = '&nbsp;V&nbsp;';
                    }
                    if (!global.liteVersion && !Object.isEmpty(approvalClass))
                        eventSegmentText += '<div class="CAL_event_icon"><div class="' + color + ' ' + approvalClass + '">&nbsp;</div></div>';
                    if (global.liteVersion && !Object.isEmpty(approvalIcon))
                        eventSegmentText += '<span class="application_color_' + color + '">' + approvalIcon + '</span>';
                    eventSegmentText += '<div class="CAL_acronymWrapper"><acronym class="application_color_' + color;
                    if ((event.status == 4) || (event.status == 5) || (event.status == 6))
                        eventSegmentText += ' application_text_italic';
                    if (!event.entireDay) {//If the event isn't entireDay we will show the event.begDate hour
                        eventSegmentText += '" title="' + event.begDate.toString(hourFormat) + " " + eventText + '">';
                        eventSegmentText += event.begDate.toString(hourFormat) + " " + eventText;
                    }
                    else {
                        eventSegmentText += '" title="' + eventText + '">';
                        eventSegmentText += eventText;
                    }
                    eventSegmentText += '</acronym></div>';
                    eventSegmentText += '</div>';
                    eventSegmentText += '</div>';
                    eventSegmentText += '<div class="CAL_wholeDayEventBorder ' + color + '">';
                    eventSegment.update(eventSegmentText);
                }
                else {
                    eventSegment.addClassName("CAL_eventContainer");
                    eventSegment.setStyle({
                        "width": "101px"
                    });
                    var eventSegmentText = '<div class="CAL_eventText application_color_' + color + '">';
                    var approvalClass = "";
                    var approvalIcon = "";
                    if ((event.status == 1) || (event.status == 5)) {
                        approvalClass = 'application_rounded_question1 CAL_IE6_event';
                        approvalIcon = '&nbsp;?&nbsp;';
                    }
                    if (event.status == 2) {
                        approvalClass = 'application_rounded_x1 CAL_IE6_event';
                        approvalIcon = '&nbsp;X&nbsp;';
                    }
                    if (event.status == 4) {
                        approvalClass = 'application_rounded_draft1 CAL_IE6_event';
                        approvalIcon = '&nbsp;D&nbsp;';
                    }
                    if (event.status == 7) {
                        approvalClass = 'application_rounded_ok1 CAL_IE6_event';
                        approvalIcon = '&nbsp;V&nbsp;';
                    }
                    if (!global.liteVersion && !Object.isEmpty(approvalClass)) {
                        eventSegmentText += '<div class="CAL_event_icon"><div class="' + color + ' ' + approvalClass + '">&nbsp;</div></div>';
                    }
                    if (global.liteVersion && !Object.isEmpty(approvalIcon))
                        eventSegmentText += '<span class="application_color_' + color + '">' + approvalIcon + '</span>';
                    if (begDate.clone().compareTo(endDate.clone()) != 0)
                        eventText = event.begDate.toString(hourFormat) + " " + eventText;
                    eventSegmentText += '<acronym ';
                    if ((event.status == 4) || (event.status == 5) || (event.status == 6))
                        eventSegmentText += 'class="application_text_italic" ';
                    if (!event.entireDay) { //If the event isn't entireDay we will show the event.begDate hour
                        if (begDate.clone().compareTo(endDate.clone()) != 0) {
                            eventSegmentText += 'title="' + eventText + '">';
                            eventSegmentText += eventText;
                        }
                        else{
                            eventSegmentText += 'title="' + event.begDate.toString(hourFormat) + " " + eventText + '">';
                            eventSegmentText += event.begDate.toString(hourFormat) + " " + eventText;
                        }
                    }
                    else {
                        eventSegmentText += 'title="' + eventText + '">';
                        eventSegmentText += eventText;
                    }
                    eventSegmentText += '</acronym>';
                    eventSegmentText += '</div>';
                    eventSegment.update(eventSegmentText);
                }
            }
            //go to the next beginning of a week so we can get the next segment
            drawBeginning.moveToDayOfWeek(this.cal.firstDayOfWeek);
            var segment = $H({
                segment: eventSegment,
                length: segmentLength,
                leftOffset: leftOff,
                rightOffset: rightOff - 1,
                startWeek: startingWeek,
                endWeek: endingWeek
            });
            //we set a Hash for the event segments. each hash position has the week in which it's 
            //drawn as a Hash
            eventSegments.set(startingWeek + i, segment);
        }
        return eventSegments;
    },
    /**
    * @param event {CAL_Event} A CAL_Event object with the info needed to look for the event
    * @description this method look for the event in the table representing the calendar HTML and removes
    *       it from it.
    */
    removeEventFromDraw: function(event) {

        var thisCalendarMatrix = this.calendarMatrix;
        //we get info about the event segments to remove them in the matrix.
        var eventSegments = this.newEventGraphicObject(event);
        var firstSegment = eventSegments.values()[0];
        var startingWeek = firstSegment.get('startWeek');
        var endingWeek = firstSegment.get('endWeek');
        if (endingWeek >= this.cal.numberOfWeeks)
            endingWeek = this.cal.numberOfWeeks - 1;
        //search for the event just in the weeks it must appear.
        for (var week = startingWeek; week <= endingWeek; week++) {

            var rowsInThisWeek = thisCalendarMatrix[week];
            var numberOfRowsInThisWeek = rowsInThisWeek.length;
            //true when the row has been marked to be removed
            var possibleGaps = false;
            for (var i = 0; i < numberOfRowsInThisWeek; i++) {
                var leftOffset;
                var currentSegment = eventSegments.get(week);
                leftOffset = currentSegment.get('leftOffset');
                //we look for the event in this week's rows. If we find it we delete it from
                //the matrix.
                var removed = false;
                if (!possibleGaps) {
                    for (var day = leftOffset; day < leftOffset + currentSegment.get('length'); day++) {
                        if (rowsInThisWeek[i][day]) {
                            var eventIsHere = rowsInThisWeek[i][day].id == event.id;
                            if (eventIsHere) {
                                if (rowsInThisWeek[i][day].graphic.get(week).get("segment").parentNode) {
                                    rowsInThisWeek[i][day].graphic.get(week).get("segment").remove();
                                }
                                rowsInThisWeek[i][day] = null;
                                //mark it for redrawing and as a candidate to be removed.
                                rowsInThisWeek[i][7] = 3;
                                removed = true;
                            }
                        }
                    }
                }
                if (removed || possibleGaps) {

                    //after removing the event we look whether we can fill the gap with info from 
                    //the next rows
                    for (var gapDay = leftOffset; gapDay < leftOffset + currentSegment.get('length'); gapDay++) {
                        for (var row = i + 1; row < numberOfRowsInThisWeek; row++) {
                            if (thisCalendarMatrix[week][row][gapDay]) {
                                //candidate event length
                                var eventLength = 1;
                                //candidate event start
                                var eventStart = null;
                                //candidate event end
                                var eventEnd = null;
                                var counter = 1;
                                //if there's an event in this row and it's a candidate to be moved,
                                //loop to see how long is it and to calculate it's binding so we can calculate
                                //if there's enough space for it.
                                do {
                                    //look at this event's left to see how long is and find it's beginning
                                    if (gapDay - counter >= 0 && thisCalendarMatrix[week][row][gapDay - counter] &&
                                            thisCalendarMatrix[week][row][gapDay - counter].id ==
                                            thisCalendarMatrix[week][row][gapDay].id) {
                                        eventLength++;
                                    } else if (Object.isEmpty(eventStart)) {
                                        eventStart = gapDay - counter + 1;
                                    }
                                    //look at this event's right to see how long is and find it's end
                                    if (gapDay + counter <= 6 && thisCalendarMatrix[week][row][gapDay + counter] &&
                                            thisCalendarMatrix[week][row][gapDay + counter].id ==
                                            thisCalendarMatrix[week][row][gapDay].id) {
                                        eventLength++;
                                    } else if (Object.isEmpty(eventEnd)) {
                                        eventEnd = gapDay + counter - 1;
                                    }
                                    counter++;
                                } while (Object.isEmpty(eventStart) || Object.isEmpty(eventEnd));
                                //now, once there's info about the event we look if it fits in the gap
                                var fits = true;
                                for (var day = eventStart; day <= eventEnd; day++) {
                                    fits = fits && Object.isEmpty(thisCalendarMatrix[week][i][day]);
                                }
                                if (fits) {
                                    var moved = false;
                                    for (var day = eventStart; day <= eventEnd; day++) {
                                        thisCalendarMatrix[week][i][day] = thisCalendarMatrix[week][row][day];
                                        if (!moved) {
                                            var offset = row - i;
                                            var top = thisCalendarMatrix[week][i][day].graphic.get(week).get("segment").getStyle("top");
                                            top = parseInt(top.gsub("px", ""));
                                            top = top - 20 * offset;
                                            thisCalendarMatrix[week][i][day].graphic.get(week).get("segment").setStyle({
                                                "top": top + "px"
                                            });
                                            moved = true;
                                        }
                                        if (thisCalendarMatrix[week][row][day].graphic.get(week).get("segment").parentNode) {
                                            thisCalendarMatrix[week][row][day].graphic.get(week).get("segment").remove();
                                        }
                                        thisCalendarMatrix[week][row][day] = null;
                                        thisCalendarMatrix[week][row][7] = 3;
                                        thisCalendarMatrix[week][i][7] = 1;
                                    }
                                    fits = false;
                                    //this event may have left more gaps, so now look for new events to refill those gaps
                                    possibleGaps = true;
                                }
                            }
                        }
                    }
                    removed = false;
                    if (!possibleGaps) {

                        break;
                    }
                }
            }
        }
        this.updateRenderedEvents();
    },
    /**
    * @description draws the currently selected events in the calendar table
    */
    updateRenderedEvents: function() {
        //		this.tbody = this.tbody.remove();
        //loop over each one of the rows starting in the weeks headers.
        for (var i = 0; i < this.cal.numberOfWeeks; i++) {

            var lastDrawn = null;
            for (var j = 0; j < this.calendarMatrix[i].length; j++) {

                //the flag is an indication of the action needed in this row.
                var flag = this.calendarMatrix[i][j][7];
                //date is being an iterator to go from the first to the last calendar's day
                var date = this.cal.calendarBounds.begda.clone().add(i).weeks();

                if (flag <= 3 && flag != 0) {
                    for (var k = 0; k < 7; k++, date.add(1).day()) {
                        //draw this cell if you've not drawn it already.
                        if (this.calendarMatrix[i][j][k] && this.calendarMatrix[i][j][k].id != lastDrawn) {

                            var event = this.calendarMatrix[i][j][k];
                            if (!event.graphic) {
                                event.graphic = this.newEventGraphicObject(event);
                            }
                            eventSegments = event.graphic;
                            var eventId = event.id;
                            lastDrawn = eventId;
                            var currentSegment = eventSegments.get(i).get('segment');
                            var dayElement = this.daysHash.get(date.toString('MM_dd_yyyy'));
                            dayElement.insert(currentSegment);
                            var isIE6 = false /*@cc_on || @_jscript_version < 5.7 @*/;
                            if (isIE6) {
                                currentSegment.setStyle({
                                    "top": +(24 * j) + "px"
                                });
                            } else {
                                currentSegment.setStyle({
                                    "top": +(21 * j) + "px"
                                });
                            }
                            if (j > 2) {
                                if (isIE6) {
                                    dayElement.setStyle({
                                        "height": 24 * (j + 1) + "px"
                                    });
                                } else {
                                    dayElement.setStyle({
                                        "height": 21 * (j + 1) + "px"
                                    });
                                }
                            }
                        }
                    }
                    this.calendarMatrix[i][j][7] = 0;
                }
            }
        }
        this.resizeSelectionDiv();
    },
    /**
    * Updates date selection controls adding new years when needed and selects the current
    *         month.
    */
    updateControls: function() {

        var currentYear = this.cal.currentDate.toString('yyyy');
        //select years options
        var year = parseInt(currentYear) - 4;
        if (Prototype.Browser.Gecko) {
            var options = '';
        }
        for (var i = 0; i <= 8; i++) {
            //DOM 0 access to Option creation since it was not working with Prototype
            if (Prototype.Browser.Gecko) {
                options = options + '<option value="' + (year + i) + '">' + (year + i) + '</option>';
            } else {
                this.selectYears.options[i] = new Option(year + i, year + i, false, (year + i) == currentYear);
            }
        }
        if (Prototype.Browser.Gecko) {
            this.selectYears.update(options);
            this.selectYears.selectedIndex = 4;
        }
        this.selectMonths.selectedIndex = parseInt(this.cal.currentDate.toString('M')) - 1;
    },
    /**
    * @param event the event info for this employee selection
    * @description it handles the employeeUnselected event hiding it's events on the
    *       calendar.
    */
    onEmployeeUnselected: function(event) {
        this.onEmployeeSelected(event, true);
    },
    /**
    * Renders all the currently selected employees in the current calendar view
    */
    renderSelectedEmployees: function() {
        var employees = this.getSelectedEmployees();
        employees.each(function(employee) {
            this.onEmployeeSelected({
                id: employee.key,
                name: employee.value.name,
                oType: employee.value.oType,
                population: employee.value.population,
                color: employee.value.color
            });
        }.bind(this));
    },
    /**
    * It handles the employeeSelected event getting needed data to show
    * this new employee's events on the calendar
    * @param event the info about this employee selection
    * @param unselect is true if we want to unselect instead of selecting
    */
    onEmployeeSelected: function(event, unselect) {

        //get the data if this function is called from a DOM event
        var employee = getArgs(event);

        //Store the selected employee

        this._selectedEmployee = employee;

        //previous and next months
        var previous = this.cal.currentDate.clone().add(-1).month();
        var previousPreloaded = false;
        var next = this.cal.currentDate.clone().add(1).month();
        var nextPreloaded = false;
        //initial and ending dates for the ajax request
        var initialDate;
        var endingDate;

        //key used to convert a date to String
        var sKey = 'MMyyyy';

        var monthPreloadingData;

        //if there's not preloaded data for this month the ajax request interval is calculated
        //taking into account which data has already been preloaded.
        if (!this.preloadedDataInfo.get(this.cal.currentDate.toString(sKey) + '_' + employee.id)) {
            //when the next month is already preloaded it's not asked again
            //otherwhise we get it's data and store it as already preloaded
            if (!this.preloadedDataInfo.get(next.toString(sKey) + '_' + employee.id)) {
                endingDate = this.cal.getCalendarBounds(next).endda;
                nextPreloaded = true;
            } else {
                endingDate = this.cal.calendarBounds.endda;
            }
            //when the previous month is already preloaded it's not asked again
            //otherwhise we get it's data and store it as already preloaded
            if (!this.preloadedDataInfo.get(previous.toString(sKey) + '_' + employee.id)) {
                initialDate = this.cal.getCalendarBounds(previous).begda;
                previousPreloaded = true;
            } else {
                initialDate = this.cal.calendarBounds.begda;
            }

            monthPreloadingData = {
                begda: initialDate,
                endda: endingDate
            };

            //set the months preloading according to the previous calculations
            this.preloadedDataInfo.set(this.cal.currentDate.toString(sKey) + '_' + employee.id, monthPreloadingData);

            if (nextPreloaded) {
                this.preloadedDataInfo.set(next.toString(sKey) + '_' + employee.id, monthPreloadingData);
            }
            if (previousPreloaded) {
                this.preloadedDataInfo.set(previous.toString(sKey) + '_' + employee.id, monthPreloadingData);
            }
        } else {
            monthPreloadingData = this.preloadedDataInfo.get(this.cal.currentDate.toString(sKey) + '_' + employee.id);
        }

        var ajaxID = employee.id + '_' + monthPreloadingData.begda.toString('ddMMyyyy') + '_' + monthPreloadingData.endda.toString('ddMMyyyy');
        this.ajaxRequestArguments.set(unselect ? "unselect" + ajaxID : ajaxID, {
            begda: monthPreloadingData.begda.clone(),
            endda: monthPreloadingData.endda.clone(),
            bounds: this.cal.calendarBounds,
            employee: employee
        });
        this.getFilterSelectedOptions();

        var filter = Object.isEmpty(parentCalendar.prototype.parentFilter) ? "" : parentCalendar.prototype.parentFilter;

        var xmlGetEvents = "<EWS>" +
					           "<SERVICE>GET_EVENTS</SERVICE>" +
					           "<OBJECT TYPE='" + employee.oType + "'>" + employee.id + "</OBJECT>" +
					           "<PARAM>" +
					           "<o_begda_i>" + monthPreloadingData.begda.toString('yyyy-MM-dd') + "</o_begda_i>" +
					           "<o_endda_i>" + monthPreloadingData.endda.toString('yyyy-MM-dd') + "</o_endda_i>" +
					           "<o_li_incapp>" + filter + "</o_li_incapp>" +
					           "</PARAM>" +
				           "</EWS>";

        var xotree = new XML.ObjTree();
        this.makeAJAXrequest($H({
	        xml:xmlGetEvents,
            successMethod: this.serviceGetEvents.bind(this, employee.id),
            errorMethod: this.getEventsError.bind(this, employee.id),
            ajaxID: unselect ? "unselect" + ajaxID : ajaxID
        }));
    },
    /**
    * Changes the view of the current calendar to another date when the select boxes
    * are used to change the date.
    * @param e {Event} Event object containing data about the element firing the event, etc.
    */
    onChangeDate: function(e) {

        var element = Event.element(e);
        var method = element.identify().sub("CAL_", '');
        this.cal[method](element.getValue());
        this.renderEmpty();
        this._removePreviousSelectionDiv();
        this.renderSelectionDiv();
        if (!Prototype.Browser.IE)
            this.resizeSelectionDiv();
        this.updateControls();
        this.initCalendarMatrix();
        this.renderSelectedEmployees();
    },
    /**
    * Changes the view of the current calendar to the current date.
    */
    onGoToToday: function() {
        if (!this.cal.currentDate.isToday()) {
            this.cal.setToday();
            this.initCalendarMatrix();
            this.renderEmpty();
            this._removePreviousSelectionDiv();
            this.renderSelectionDiv();
            this.updateControls();
            this.renderSelectedEmployees();
        }
    },
    /**
    * @description This method triggers the day selection events, so the user can select days by
    *       mouse clicking and dragging.
    */
    onMouseDownSelection: function(event) {
        //do not treat the event if an event has been clicked
        if (event.element().match("td div div") || event.element().match('acronym') || event.findElement('th') || event.findElement("tfoot")) {
            event.stop();

            return;
        } else {
            this.isAfterMouseDownSelection = true;
            this.selectionStart = null;
            this.selectionEnd = null;
            this.selectionDiv.show();
            var selectionStartClass = event.findElement("td").classNames().find(function(theClassName) {

                return theClassName.startsWith('CAL_day_');
            });
            var selectionDateStart = Date.parseExact(selectionStartClass.gsub('CAL_day_', ''), 'MM_dd_yyyy');
            var zeroSelector = this.cal.calendarBounds.begda;
            var zeroSelectorDayNumber = zeroSelector.getOrdinalNumber();
            var selectionDateStartNumber = selectionDateStart.getOrdinalNumber();
            if (selectionDateStartNumber < zeroSelectorDayNumber) selectionDateStartNumber += Date.isLeapYear(zeroSelector.getFullYear()) ? 366 : 365;
            this.selectionStart = selectionDateStartNumber - zeroSelectorDayNumber;
            var isIE6 = false /*@cc_on || @_jscript_version < 5.7 @*/;
            if (Prototype.Browser.IE && isIE6) {
                this.selectionCells[this.selectionStart].addClassName('CAL_daySelected_IE6');
            } else {
                this.selectionCells[this.selectionStart].addClassName('CAL_daySelected');
            }
        }
    },
    /**
    * @description this methods observes the mouse movement across the calendar, so it takes care of
    *       selecting the correct days.
    */
    onMouseDragToSelect: function(event) {
        var element = event.element();
        if (element.match('.CAL_daySelector') && this.selectionDiv.visible() && !this.selectionDone) {
            var isIE6 = false /*@cc_on || @_jscript_version < 5.7 @*/;

            var previousEnd = Object.isEmpty(this.selectionEnd) ? false : this.selectionEnd;
            this.selectionEnd = parseInt(element.identify().gsub('CAL_selector_', ''));
            if (this.selectionStart > this.selectionEnd) {
                increment = -1;
            } else {
                increment = +1;
            }
            var i = this.selectionStart;
            if (previousEnd !== false && previousEnd >= 0) {

                //Create a range with the cells that must be unselected.
                var range;
                if (previousEnd < this.selectionStart && $R(previousEnd, this.selectionStart).include(this.selectionEnd)) {
                    range = $R(previousEnd, this.selectionEnd);
                } else if (previousEnd > this.selectionStart && $R(this.selectionStart, previousEnd).include(this.selectionEnd)) {
                    range = $R(this.selectionEnd, previousEnd);
                } else if (previousEnd < this.selectionStart && this.selectionStart < this.selectionEnd) {
                    range = $R(previousEnd, this.selectionStart);
                } else {
                    range = $R(this.selectionStart, previousEnd);
                }
                $A(range).each(function(value) {
                    if (isIE6) {
                        this.selectionCells[value].removeClassName('CAL_daySelected_IE6');
                    } else {
                        this.selectionCells[value].removeClassName('CAL_daySelected');
                    }
                }.bind(this));
            }
            do {
                if (Prototype.Browser.IE && isIE6) {
                    this.selectionCells[i].addClassName('CAL_daySelected_IE6');
                } else {
                    this.selectionCells[i].addClassName('CAL_daySelected');
                }
                i += increment;
            } while (increment > 0 ? i <= this.selectionEnd : i >= this.selectionEnd);

        } else {
            event.stop();
            return;
        }
    },
    /**
    * @description handles the mouseup, which means the user has finished selecting
    */
    onMouseUpSelection: function(event) {
        event.stop();
        if (this.isAfterMouseDownSelection) {
            this.selectionDone = true;
            if (Object.isEmpty(this.selectionEnd)) this.selectionEnd = this.selectionStart;
            var selectionStartDate = this.cal.calendarBounds.begda.clone().add(this.selectionStart).days();
            var selectionEndDate = this.cal.calendarBounds.begda.clone().add(this.selectionEnd).days();
            if (!selectionStartDate.isBefore(selectionEndDate)) {
                var auxDate = selectionStartDate.clone();
                selectionStartDate = selectionEndDate.clone();
                selectionEndDate = auxDate.clone();
            }
            if(this.retroFuture){
                var json = {
	                EWS: {
                        SERVICE: this.RFballoonService,
                        OBJECT: {
                            "#text": global.objectId,
                            "-TYPE": global.objectType
                        },
                        PARAM: {
                            CONTAINER: "CAL_MGM",
                            MENU_TYPE: "N",
                            I_DATE: objectToSap(selectionStartDate)
                        }
                    }
                } ;
            }
            else{
                var json = {
                    EWS: {
                        SERVICE: this.balloonService,
    	                OBJECT: {
        	                "#text": global.objectId,
            	            "-TYPE": global.objectType
            	        },
            	        PARAM: {
           	    	        CONTAINER: "CAL_MGM",
            	            MENU_TYPE: "N"
                        }
                    }
    	        };
            }
            var xotree = new XML.ObjTree();
            this.makeAJAXrequest($H({
                xml: xotree.writeXML(json),
                successMethod: this.contextualBalloon.bind(this),
                ajaxID: selectionStartDate.toString("yyyy-MM-dd") + "_" + selectionEndDate.toString("yyyy-MM-dd")
            }));
            this.isAfterMouseDownSelection = false;
        }
    },
    /**
    * Shows the contextual balloon for day selection
    */
    contextualBalloon: function(json, ID) {
        var actionsList = new Element("ul", {
            "class": "CAL_optionList"
        });
        if (!Object.isEmpty(json.EWS.o_actions)) {
            var begda = ID.split("_")[0];
            var endda = ID.split("_")[1];
            var payroll_run = json.EWS.o_payroll ? true: false;
            objectToArray(json.EWS.o_actions.yglui_vie_tty_ac).each(function(action) {
                var actionArray = action["@actiot"].split('((L))');
            var actionText = actionArray[0] + "<span class='application_action_link test_link'>" + actionArray[1] + "</span>" + actionArray[2];
                var listElement = new Element("li").update(actionText);
                listElement.observe("click", function() {
                    var eventSent = this._getEmptyEvent("", "", action['@tarap'], begda, endda);
                    var retroDates = null;
                    if(this.retroFuture)
                        retroDates = this.retroFutureHash.get(action['@tarap']) ? this.retroFutureHash.get(action['@tarap']) : null;
                    global.open($H({
                        app: {
                            appId: action['@tarap'],
					        //tabId: this.options.tabId,
                            view: action['@views']
                        },
                        event: eventSent,
                        eventCodes: this.eventCodes,
                        retroDates: retroDates
                    }));
                }.bind(this));
                actionsList.insert(listElement); 
            }.bind(this));
            if(payroll_run)
                actionsList.insert(new Element("span").insert('<BR>' + global.getLabel('actionHide') + (' ') + global.getLabel('duePayroll')));
            if(!Object.isEmpty(json.EWS.o_msg)){
                var label;
                switch(json.EWS.o_msg){
                    case '3': label = global.getLabel('DATE_MSG_RETRO_EARLY') + (' ') + global.getLabel('actionHide');
                        break;
                    case '4': label = global.getLabel('DATE_MSG_FUTURE_LATER') + (' ') + global.getLabel('actionHide');
                        break;
                }
                actionsList.insert(new Element("span").insert('<BR>' + label));
            }
        }
        else if( !Object.isEmpty(json.EWS.o_msg)){
                var label;
                switch(json.EWS.o_msg){
                    case '1': label = global.getLabel('NO_ACTION') + (' ') + global.getLabel('dueTo') + (' ') + global.getLabel('DATE_MSG_BEFORE_HIRE').toLowerCase();
                        break;
                    case '2': label = global.getLabel('NO_ACTION') + (' ') + global.getLabel('dueTo') + (' ') + global.getLabel('DATE_MSG_AFTER_TERMINATION').toLowerCase();
                        break;
                }
                actionsList.insert(new Element("span").insert('<BR>' + label));
        }
        else
            actionsList = new Element("span").insert(global.getLabel('NO_ACTION'));
        balloon.showOptions($H({
            domId: 'CAL_selector_' + this.selectionEnd,
            content: actionsList,
            events: $H({
                onHide: "EWS:balloon_closed",
                onShow: "EWS:balloon_opened"
            })
        }));
    },
    /**
    * @description unselects all the selected dates when the balloon is closed.
    */
    onBalloonClosed: function() {
        this.selectionDiv.hide();
        this.selectionDiv.select('.CAL_daySelected', '.CAL_daySelected_IE6').each(function(e) {
            e.removeClassName('CAL_daySelected');
            e.removeClassName('CAL_daySelected_IE6');
        });
        this.selectionDone = false;
    },
    /**
    * @param json the json coming from the service
    * @param ajaxID the ID to identify this ajax call
    * @description it loads the work schedule and events data from the XML
    */
    serviceGetEvents: function(employeeID, json, ajaxID) {
        this.json = json;
        if (!this.filterCreated) {
            var incapp = json.EWS.o_li_incapp.yglui_str_incap2;
            this.createFilterPanel(this.filterElement, this.appName, incapp);
            this.controls.down("[id=applicationCAL_filterDiv]").update(global.getLabel("filterOptions")).observe("click", function() {
                this.filterElement.toggle();
                if (Prototype.Browser.Gecko)
                    this.selectionDiv.clonePosition(this.tbody);
            }.bind(this));
            this.filterCreated = true;
        }
        this.employeeRestriction = (global.getPopulationName(global.currentApplication) == 'NOPOP') ? false : true;
        if(!this.employeeRestriction)
            this._getRetroFuture(json);
                
        var unselect = ajaxID.startsWith("unselect");
        parentCalendar.prototype.filterJson = json.EWS.o_li_incapp.yglui_str_incap2;//Store the last JSON
        var events = this._getEventHash(json);
        if (!events) return;
        // if there's events get info about each one of them and add to the draw
        events.each(function(timeEvent) {
            var eventId = timeEvent.key;
            var data = timeEvent.value;
            // Saving received events for Time Entry
            if (Object.isEmpty(this.eventsReceived.get(eventId))) {
                var eventSent = null;
                if (data.get("APPID").value != "TSH_MGMT")
                    eventSent = this._getEvent(json, eventId);
                else {
                    var position = parseInt(eventId.substring(eventId.lastIndexOf("_") + 1));
                    eventSent = this._getEvent(json, eventId, position);
                }
                this.eventsReceived.set(eventId, eventSent);
            }
            var begDate;
            if (data.get("DATUM"))
                begDate = data.get("DATUM").value;
            else if (data.get("BEGDA"))
                begDate = data.get("BEGDA").value;
            else
                begDate = data.get("LDATE").value;
            var begTime = data.get("BEGUZ") ? data.get("BEGUZ").value : "00:00:00";
            if (begTime == "24:00:00")
                begTime = "00:00:00";
            if (data.get("ENDDA")) {
                var endDate = data.get("ENDDA").value;
                var endTime = data.get("ENDUZ") ? data.get("ENDUZ").value : "00:00:00";
                if (endTime == "24:00:00")
                    endTime = "00:00:00";
            }
            else {
                var endDate = begDate;
                var endTime = begTime;
            }
            var timeData;
            if (data.get("ANZHL"))
                timeData = data.get("ANZHL").value;
            var begDateObject = sapToObject(begDate, begTime);
            var endDateObject = sapToObject(endDate, endTime);
            var calendarBegda = this.cal.calendarBounds.begda;
            var calendarEndda = this.cal.calendarBounds.endda;
            if (begDateObject.between(calendarBegda, calendarEndda) ||
                endDateObject.between(calendarBegda, calendarEndda)||
                endDateObject.isAfter(calendarEndda) && begDateObject.isBefore(calendarBegda)){
                var eventText;
                if (data.get("AWART")) {
                    eventText = data.get("AWART").text;
                } else if (data.get("SUBTY")) {
                    eventText = data.get("SUBTY").text;
                } else if (data.get("VTART")) {
                    eventText = data.get("VTART").text;
                } else if (data.get("ZTART")) {
                    eventText = data.get("ZTART").text;
                } else if (data.get("SATZA")) {
                    eventText = global.getLabel("timeInfo");
                } else if (data.get("LDATE")) {
                        eventText = this.timeErrorMessages.get(begDate);
                } else {
                    eventText = "NOTEXT";
                }
                if (timeData)
                    eventText = timeData + " " + eventText;
                
                //Checking if the event is created from 00:00 to 24:00 or 12:00 AM to 12:00 AM to set it to Allday
                var begHour, endHour, hour_format;
                if( global.hourDisplayFormat == "24"){
                    begHour = endHour = "00:00";
                    hour_format = "HH:mm";
                }else{
                    begHour = endHour = "00:00 AM";
                    hour_format = "HH:mm tt"
                }
                //entireDay will be true if the event is created from 00:00 to 24:00 or 12:00 AM to 12:00 AM
                var entireDay = (begDateObject.toString(hour_format) == begHour) && (endDateObject.toString(hour_format) == endHour);
                
                var eventData = {
                    begDate: begDateObject,
                    endDate: endDateObject,
                    daysLength: data.get("ABWTG") ? data.get("ABWTG").value : 0,
                    hoursLength: data.get("STDAZ") ? data.get("STDAZ").value : 0,
                    // Will be false if "value" parameter doesn't exists
                    allDay: data.get("ALLDF") && data.get("ALLDF").value && data.get("ALLDF").value.toLowerCase() == "x" || data.get("SATZA") != undefined || data.get("LDATE") != undefined,
                    entireDay: entireDay,
                    text: eventText,
                    pernr: data.get("PERNR").value,
                    id: eventId,
                    status: data.get("STATUS"),
                    appId: data.get("APPID").value,
                    view: data.get("VIEW") ? data.get("VIEW").value : ""
                };
                if (unselect)
                    this.removeEventFromDraw(eventData);
                else
                    this.addEventToDraw(eventData);
            }
        }.bind(this));
        var ajaxBounds = this.ajaxRequestArguments.get(ajaxID).bounds;
        if (this.cal.currentDate.between(ajaxBounds.begda, ajaxBounds.endda)) {
            var updateRenderedEventsBinding = this.updateRenderedEvents.bind(this);
            updateRenderedEventsBinding.defer();
        }
        if (unselect) {
            this.workSchedules.unset(employeeID);
            this.workScheduleCalculation();
        }
        else
            this.getWorkSchedule(json, employeeID);
        this.renderWorkSchedule();
    },
    /**
    * @param json The data coming from the service with the workschedule
    * @description method that creates the needed structure to draw the workSchedule.
    */
    getWorkSchedule: function(json, employeeID) {
        var workSchedule = json.EWS.o_freedays;
        //initialize empty work schedule for the employee
        if (!this.workSchedules.get(employeeID)) {
            this.workSchedules.set(employeeID, $A());
        }
        //fill the work schedule structure
        if (workSchedule) {
            //get the work schedule for the user
            workSchedule = objectToArray(workSchedule.yglui_str_incidence);
            workSchedule.each(function(day) {
                this.workSchedules.get(employeeID).push({
                    begda: day["@begda"],
                    type: day["@type"],
                    subType: day["@subty"]
                });
            }.bind(this));
        }
        //do the calculations needed to draw it
        this.workScheduleCalculation();
    },

    /**
    * Make the needed calculations to decide whether the work schedule should
    * be drawn or not.
    */
    workScheduleCalculation: function() {
        var draw = true;
        var hasWorkSchedule = true;
        // no work schedules data, so end the method
        if (!this.workSchedules.size()) {
            this.drawWorkSchedule = false;
            return;
        }
        //loop work schedules
        this.workSchedules.each(function(employee) {
            //do not compare the first employee with himself
            if (employee.key == this.workSchedules.keys().first()) {
                return;
            }
            //take the data which is not from the actual employee
            else {
                if (!this.workSchedules.values().first().size()) {
                    hasWorkSchedule = false;
                }
                this.workSchedules.values().first().each(function(dayReference, index) {
                    if (!employee.value[index]) {
                        if (index == 0) {
                            hasWorkSchedule = false;
                        }
                        draw = false;
                        $break;
                    } else if (dayReference.begda != employee.value[index].begda ||
                            dayReference.type != employee.value[index].type ||
                            dayReference.subType != employee.value[index].subType) {

                        draw = false;
                        $break;
                    }
                });
            }
        }.bind(this));
        this.drawWorkSchedule = draw && hasWorkSchedule;
    },
    renderWorkSchedule: function() {
        if (this.drawWorkSchedule && this.workSchedules.size()) {
            var begdaText = this.cal.calendarBounds.begda.toString("yyyy-MM-dd");
            var begda = this.cal.calendarBounds.begda.clone();
            this.datesHeaders.each(function(headerRow) {
                headerRow.childElements().each(function(dayHeaderElement) {
                    var exists = this.workSchedules.values().first().find(function(day) {
                        return day.begda == begdaText;
                    });
                    if (exists) {
                        dayHeaderElement.addClassName("CAL_FREE");
                    }
                    begda.add(1).days();
                    begdaText = begda.toString("yyyy-MM-dd");
                }.bind(this));
            }.bind(this));
        } else {
            this.removeWorkSchedule();
        }
    },
    removeWorkSchedule: function() {
        this.virtualHtml.select(".CAL_FREE").each(function(element) {
            element.removeClassName("CAL_FREE");
        });
    },
    _refreshButtonClicked: function() {
            document.fire('EWS:refreshCalendars');
        this.renderEmpty();
        // this.updateControls();
        this.initCalendarMatrix();
        this.renderSelectedEmployees();
            
    },
    /**
    * @param employeeID Employee ID
    * @param json JSON coming from the service
    * @description it loads the work schedule and events data from the XML after an error message
    */
    getEventsError: function(employeeID, json, ajaxID) {
        this._errorMethod(json);
        this.serviceGetEvents(employeeID, json, ajaxID);
        },
    /**
     *@description Gets the Retro/Future. Sets the corresponding flags
     *@param json: GET_EVENTS JSON with the dates
     */
    _getRetroFuture: function(json){
        this.retroFutureHash = new $H();
        if(!Object.isEmpty(json.EWS.o_date_ranges)){
           var screens = objectToArray(json.EWS.o_date_ranges.yglui_str_dates);
           //Getting the dates per screen
           for(var i=0; i<screens.length; i++){
               if(!Object.isEmpty(screens[i].dates)){
                   var retro_future_dates = screens[i].dates.yglui_str_date_fields;
                   var dates_hash = new $H();
                   for(var j=0; j<retro_future_dates.length; j++){ 
                       if(!retro_future_dates[j]['@dateid'].include('ERR'))
                           dates_hash.set(retro_future_dates[j]['@dateid'], retro_future_dates[j]['@date_value']);
                   }
                   this.retroFuture = true;
                   //Setting the hashes to store the retro/future and payroll dates
                   this.retroFutureHash.set(screens[i]['@screen'], new Array(Date.parseExact(dates_hash.get('RETRO'), "yyyy-MM-dd"), Date.parseExact(dates_hash.get('FUTURE'), "yyyy-MM-dd")));
                }
            }
        }
        else
           this.retroFuture = false;
    }
});
/**
 * @constructor
 * @description it creates a structure representing the whole calendar data, it's dates and events related.
 */
var CalendarData = Class.create(origin, 
/**
 * @lends CalendarData
 */
{
    /**
     * @type Date
     * @description Current date.
     */
    currentDate: null,
    /**
	 * @type Integer
	 * @description Whether the week starts in Monday or Sunday
	 */
    firstDayOfWeek: null,
    /**
	 * @type Integer
	 * @description Whether the week ends in Monday or Sunday
	 */
    lastDayOfWeek: null,
	
    initialize: function($super) {
    
        $super();
        this.setToday();
        //whether the week starts on monday or sunday
        this.firstDayOfWeek = parseInt(global.calendarsStartDay);
        if (this.firstDayOfWeek == 0)
            this.firstDayOfWeek = 1;
        else {
            if (this.firstDayOfWeek == 1)
                this.firstDayOfWeek = 0;
        }
        this.lastDayOfWeek = (this.firstDayOfWeek == 0) ? 6 : 0;
        this.getCalendarBounds();
    },
    /**
     * @description This method changes the mapping for the calendar to the next month
     */
    nextMonth: function() {
    
        this.currentDate.addMonths(1);
        this.getCalendarBounds();
    },
    /**
     * @description This method changes the mapping for the calendar to the prev month
     */
    previousMonth: function() {
    
        this.currentDate.addMonths(-1);
        this.getCalendarBounds();
    },
    /**
     * @param month {Integer} it changes the month number. It takes a number between 0 and 11
     * @description this method sets the current date object to the month given as an argument and
     *         updates data in the cache if it's needed.
     */
    setMonth: function(month) {
    
        this.currentDate.setMonth(month);
        this.getCalendarBounds();
    },
    /**
     * @description This method changes the mapping for the calendar to the next year
     */
    nextYear: function() {
    
        this.currentDate.addYears(1);
        this.getCalendarBounds();
    },
    /**
     * @description This method changes the mapping for the calendar to the prev year
     */
    previousYear: function() {
    
        this.currentDate.addYears(-1);
        this.getCalendarBounds();
    },
    /**
     * @param year {Integer} it changes the year for the current calendar.
     * @description this method sets the current date object to the year given as an argument and
     *         updates data in the cache if it's needed.
     */
    setYear: function(year) {
    
        this.currentDate.setYear(year);
        this.getCalendarBounds();
    },
    /**
     * @description this method sets the current date object to today
     */
    setToday: function() {
    
        this.currentDate = Date.today();
        this.getCalendarBounds();
    },
    /**
     * @param month a Date object with the particular month, current will be
     *        selected is month is not defined.
     * @description Get the wich days must the calendar be draw between.
     */
    getCalendarBounds: function(month) {
        var calendarBounds = {
            begda: null,
            endda: null
        };
        var date;
        if (Object.isUndefined(month))
            date = this.currentDate.clone();
        else
            date = month.clone();
        //we get last day for the current calendar and take into account if the week starts in
        //sunday of monday.
        date.moveToLastDayOfMonth();
        if (date.getDay() != this.lastDayOfWeek) 
            date.moveToDayOfWeek(this.lastDayOfWeek, 1);
        calendarBounds.endda = date.clone();
        //we get first day for the current calendar
        if (Object.isUndefined(month))
            date = this.currentDate.clone();
        else
            date = month.clone();
        date.moveToFirstDayOfMonth();
        if (date.getDay() != this.firstDayOfWeek)
            date.moveToDayOfWeek(this.firstDayOfWeek, -1);
        calendarBounds.begda = date.clone();
        //return the bounds just when is asked for a particular month
        if (typeof(month) == 'undefined') {
            // Number of milliseconds in one day
            var msOneDay = 1000 * 60 * 60 * 24;
            // Convert dates to milliseconds
            var msCurrentDate = calendarBounds.begda.getTime();
            var msCurrentEndDate = calendarBounds.endda.getTime();
            // Calculate the difference in milliseconds
            var msDifference = msCurrentEndDate - msCurrentDate;
            // Convert back to days
            this.numberOfWeeks = Math.ceil((Math.round(msDifference / msOneDay) + 1) / 7);
            if (this.numberOfWeeks < 0) 
                this.numberOfWeeks += 52;
            if (this.numberOfWeeks < 5) {
                // Taking into account months with 4 weeks
                if (this.numberOfWeeks == 3)
                    calendarBounds.endda.addWeeks(1);
                this.numberOfWeeks = 5;
            }
            this.calendarBounds = {
                begda: calendarBounds.begda,
                endda: calendarBounds.endda.set({hour: 23, minute: 59, second: 59})
            };
        }
        else
            return calendarBounds;
    }
});