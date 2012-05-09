/**
*@fileOverview miniCalendar.js
*@description small calendar for events
*/
/**
* @constructor
* @description Class representing a miniCalendar
*/

var months = {
    '0': 'janMonth',
    '1': 'febMonth',
    '2': 'marMonth',
    '3': 'aprMonth',
    '4': 'mayMonth',
    '5': 'junMonth',
    '6': 'julMonth',
    '7': 'augMonth',
    '8': 'sepMonth',
    '9': 'octMonth',
    '10': 'novMonth',
    '11': 'decMonth'
};
var days = ['sunDay', 'monDay', 'tueDay', 'wedDay', 'thuDay', 'friDay', 'satDay'];

var miniCalendar = Class.create(
/** 
*@lends mimiCalendar 
*/
    {
    /**
    *Constructor of the class miniCalendar
    */
    initialize: function(options) {
        this.options = options;
        // target div
        this.container = options.container;
        // first day in the calendar
        this.firstDay = parseInt(options.firstDay, 10);
        this.initialDate = Date.today();
        this.buildHtml();

    },
    /**
    * build the html needed for the calendar
    */

    buildHtml: function() {
        var date = new Date;
        this.currentDate = date.clone();
        var month = date.getMonth();
        var year = date.getFullYear();
        var monthText = global.getLabel(months[month]);
        //create a div to contain the whole structure
        var calendar = new Element('div', { 'class': 'MC_container' });
        //create a container for the navigation on top of the table
        var navigation = new Element('div', { 'class': 'MC_navigation' });
        calendar.insert(navigation);
        //create the navigation Elements
        var prevMonth = new Element('div', { 'class': 'MC_standardButton' });
        var nextMonth = new Element('div', { 'class': 'MC_standardButton' });
        this.monthText = new Element('div', { 'class': 'MC_standardButton MC_title' }).insert(monthText + ' ' + year);

        //inserting the elements in the container
        navigation.insert(prevMonth);
        navigation.insert(this.monthText);
        navigation.insert(nextMonth);

        //creating the buttons for the navigation

        var prevLink = new Element('button', { 'class': 'MC_links link' }).insert('\u25c4');
        var nextLink = new Element('button', { 'class': 'MC_links link' }).insert('\u25ba');
        prevLink.observe('click', this.navigate.bind(this, 'prev'));
        nextLink.observe('click', this.navigate.bind(this, 'next'));

        prevMonth.insert(prevLink);
        nextMonth.insert(nextLink);

        //Create a div to contain the calendar
        this.calendarPart = new Element('div', { 'class': 'MC_calendarPart' });
        calendar.insert(this.calendarPart);
        //Create a div to contain the events
        this.eventPart = new Element('div', { 'class': 'MC_eventPart' });
        calendar.insert(this.eventPart);
        //inserting the calendar part in the container
        this.container.insert(calendar);
        this.buildTable(date);
    },

    buildTable: function(date) {
        var month = date.getMonth();
        var year = date.getFullYear();
        var monthDays = Date.getDaysInMonth(year, month);
        var firstDayMonth = date.moveToFirstDayOfMonth().getDay();
        var firstDayToDraw = firstDayMonth - this.firstDay;
        if (firstDayToDraw < 0)
            firstDayToDraw = firstDayToDraw + 7;

        //first day in the currentMonth
        var currentMonthDay = 1;
        //first day in the next month
        var nextMonthDay = 1;

        //get the data for the previous month
        var prevMonth = date.addMonths(-1).getMonth();
        var prevMonthYear = date.getFullYear();
        var prevMonthDays = Date.getDaysInMonth(prevMonthYear, prevMonth);
        //first day in the past month
        var prevMonthDay = (prevMonthDays - firstDayToDraw) + 1;
        //store the beg day to call the events
        this.firstDayToCall = prevMonthDay;

        //flag to control the first day to draw
        var startdraw = false;

        //Create a table for the calendar
        this.table = new Element('table', { 'class': 'MC_table test_table' });
        this.calendarPart.update(this.table);
        //Create and insert the head
        var thead = new Element('thead', { 'class': 'MC_thead' });
        this.table.insert(thead);

        //create and insert the body depending on the browser
        var tbody = new Element('tbody', { 'class': 'MC_tbody' });
        this.table.insert(tbody);
        var rowsNumber = 4;
        var today = Date.today().getDate()
        for (var i = 0; i < rowsNumber; i++) {
            if (i == 0) {
                var row = new Element('tr', { 'class': 'MC_headRow' });
                thead.insert(row);
            }
            else {
                var row = new Element('tr');
                tbody.insert(row);
            }
            for (var j = 0; j < 7; j++) {
                if (i == 0) {
                    var th = new Element('th', { 'class': 'MC_days' });
                    row.insert(th);
                    var module = (j + this.firstDay) % days.length;
                    var day = days[module];
                    var dayLabel = global.getLabel(day).substring(0, 3);
                    th.insert(dayLabel);
                }
                else {
                    var td = new Element('td', { 'class': 'MC_numbers table_doubleHeaderLower' });
                    row.insert(td);
                    if (j < firstDayToDraw && !startdraw) {
                        var dayDiv = new Element('div', { 'class': 'MC_numbersDiv' }).insert(prevMonthDay);
                        var pointDiv = new Element('div', { 'class': 'MC_eventPoint' });
                        dayDiv.insert(pointDiv)
                        td.insert(dayDiv);
                        var id = 'div_' + prevMonthYear + '-' + parseInt(prevMonth + 1, 10).toPaddedString(2, 10) + '-' + prevMonthDay.toPaddedString(2, 10);
                        td.writeAttribute('id', id);
                        prevMonthDay++;
                        td.addClassName('MC_numbersDisabled');

                    }
                    else if (currentMonthDay <= monthDays) {
                        var dayDiv = new Element('div', { 'class': 'MC_numbersDiv' }).insert(currentMonthDay);
                        var pointDiv = new Element('div', { 'class': 'MC_eventPoint' });
                        dayDiv.insert(pointDiv)
                        td.insert(dayDiv);
                        var id = 'div_' + year + '-' + parseInt(month + 1, 10).toPaddedString(2, 10) + '-' + currentMonthDay.toPaddedString(2, 10);
                        td.writeAttribute('id', id);
                        if (currentMonthDay == today && month == this.initialDate.getMonth()) {
                            this.selectedElement = td.addClassName('MC_selected');
                        }
                        currentMonthDay++;
                        startdraw = true;
                        //if we need other row, we add it
                        if (i == (rowsNumber - 1) && (j == 6) && currentMonthDay <= monthDays) {
                            rowsNumber++;
                        }
                    }
                    else {
                        var nextMonth = Date.today().addMonths(1);
                        var dayDiv = new Element('div', { 'class': 'MC_numbersDiv' }).insert(nextMonthDay);
                        var pointDiv = new Element('div', { 'class': 'MC_eventPoint' });
                        dayDiv.insert(pointDiv)
                        td.insert(dayDiv);
                        var id = 'div_' + nextMonth.getFullYear() + '-' + parseInt(nextMonth.getMonth() + 1, 10).toPaddedString(2, 10) + '-' + nextMonthDay.toPaddedString(2, 10);
                        td.writeAttribute('id', id);
                        nextMonthDay++;
                        td.addClassName('MC_numbersDisabled');
                    }
                    td.observe('click', this.showEvent.bind(this, td));
                }
            }
        }
        //store the end day to call the events
        this.lastDayToCall = nextMonthDay - 1;
    },

    showEvent: function(element, event) {

        var selectedDate = Date.parse(this.selectedElement.identify().split('_')[1]);
        if (Date.equals(selectedDate, Date.today())) {
            this.selectedElement.addClassName('MC_today');
        }
        this.selectedElement.removeClassName('MC_selected');
        element.addClassName('MC_selected');
        this.selectedElement = element;
        var date = element.identify().split('_')[1];
        this.printEvent(date);
    },

    getCallDates: function() {
        return { 'begda': this.firstDayToCall, 'endda': this.lastDayToCall };
    },

    setEvents: function(events) {
        this.eventsHash = events;
        var keys = events.keys();
        for (var i = 0; i < keys.length; i++) {
            var date = keys[i];
            var TDelement = this.table.down('[id=div_' + date + ']');
            if (TDelement.down('[class=MC_eventPoint]')) {
                TDelement.down('[class=MC_eventPoint]').update('.');
            }
        }
        //show the events for today
        var today = Date.today().toString('yyyy-MM-dd');
        this.printEvent(today);

    },
    printEvent: function(date) {
        if (!Object.isEmpty(this.eventsHash)) {
        var keys = this.eventsHash.keys();
        if (keys.include(date)) {
            this.eventPart.update('');
            var events = this.eventsHash.get(date).events;
            if (events.length > 4) {
                var rows = true;
                this.rowUp = 0;
                this.rowDown = 4;
            }
            for (var i = 0; i < events.length; i++) {
                if (rows && i == 0) {
                    var upArrowDiv = new Element('div', { 'class': 'MC_noEvents' });
                    var upArrowContent = new Element('div', { 'class': 'application_up_arrow MC_arrows' });
                    upArrowDiv.insert(upArrowContent);
                    this.eventPart.insert(upArrowDiv);
                    upArrowDiv.observe('click', this.scroll.bind(this, 'up', events.length));
                }
                var eventDiv = new Element('div', { 'class': 'MC_noEvents', 'id': 'eventDiv_' + i });
                if (events[i]['fullDay'] == 'X') {
                    var timeDiv = new Element('div', { 'class': 'MC_time', 'title': global.getLabel('allDay')}).update(global.getLabel('allDay'));
                }
                    else if (events[i]['fullDay'] == 'N') {
                        var timeDiv = new Element('div', { 'class': 'MC_time' }).update('');
                    }
                else {
                    var startTime = events[i]['startTime'];
                    var timeDiv = new Element('div', { 'class': 'MC_time' }).update(startTime);
                }
                if (events[i].status == 20 || events[i].status == 30)
                    var icon = new Element('div', { 'class': 'application_rounded_question1 MC_icon' });
                if (events[i].status == 21 || events[i].status == 31)
                    var icon = new Element('div', { 'class': 'application_rounded_x1 MC_icon' });
                if (events[i].status == 10)
                    var icon = new Element('div', { 'class': 'application_rounded_draft1 MC_icon' });
                if (events[i].status == 50)
                    var icon = new Element('div', { 'class': 'application_rounded_ok1 MC_icon' });
                    if (events[i].status == 'BDY')
                        var icon = new Element('div', { 'class': 'application_birthday_icon MC_BigIcon MC_birthDayIcon' });
                    if (events[i].status == 'LRN')
                        var icon = new Element('div', { 'class': 'application_courseType MC_BigIcon' });
                    if (events[i].status == 'CUR')
                        var icon = new Element('div', { 'class': 'application_curriculumType MC_BigIcon' });
                    if (Object.isEmpty(events[i].status))
                        var icon = new Element('div', { 'class': 'MC_icon' });
                var description = new Element('div', { 'class': 'MC_description', 'title': events[i]['description'] }).update(events[i]['description']);
                eventDiv.insert(icon);
                eventDiv.insert(timeDiv);
                eventDiv.insert(description);
                this.eventPart.insert(eventDiv);
                if (rows && i > 3)
                    eventDiv.hide();
            }
            if (rows) {
                var downArrowDiv = new Element('div', { 'class': 'MC_noEvents MC_downArrow' });
                var downArrowContent = new Element('div', { 'class': 'application_down_arrow MC_arrows' });
                downArrowDiv.insert(downArrowContent);
                this.eventPart.insert(downArrowDiv);
                downArrowDiv.observe('click', this.scroll.bind(this, 'down', events.length));
            }
        }
        else {
            var noEvents = new Element('div', { 'class': 'MC_noEvents' }).update(global.getLabel('noEvents'));
            this.eventPart.update(noEvents);
        }
        }
        else {
            var noEvents = new Element('div', { 'class': 'MC_noEvents' }).update(global.getLabel('noEvents'));
            this.eventPart.update(noEvents);
        }
    },
    scroll: function(way, length) {
        if (way == 'up' && this.rowUp != 0) {
            this.rowDown--;
            this.rowUp--;
            this.eventPart.down('[id=eventDiv_' + this.rowUp + ']').show();
            this.eventPart.down('[id=eventDiv_' + this.rowDown + ']').hide();
        }
        if (way == 'down' && this.rowDown != length) {
            this.eventPart.down('[id=eventDiv_' + this.rowUp + ']').hide();
            this.eventPart.down('[id=eventDiv_' + this.rowDown + ']').show();
            this.rowDown++;
            this.rowUp++;
        }
    },

    navigate: function(button) {
        if (button == 'next') {
            this.currentDate.addMonths(1);
            var date = this.currentDate.clone();
            this.buildTable(date);
            this.updateMonthTitle();
            this.options.nextHandler.call(this, this.currentDate);
        }
        else {
            this.currentDate.addMonths(-1);
            var date = this.currentDate.clone();
            this.buildTable(date);

        this.updateMonthTitle();
            this.options.prevHandler.call(this, this.currentDate);
        }
    },

    updateMonthTitle: function() {
        var month = this.currentDate.getMonth();
        var year = this.currentDate.getFullYear();
        var monthText = global.getLabel(months[month]);
        this.monthText.update(monthText + ' ' + year);
    }
}
);