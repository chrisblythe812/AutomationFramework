
/**
* @fileoverview rightPanels.js
* @description here are the definition of the right panel itself 
*/
/**
* @constructor rightPanels
* @description Handles the right panel.
*/

var miniCal_RP = Class.create(origin, {
    /**
    * @initialize Initializing the javaScript class
    * @description Handles the right panel.
    */
    initialize: function($super, panel) {
        $super();
        this.eventsHash = $H();
        this.panel = panel;
        this.fillPanel();
    },
    /**
    * Creating an empty mini calendar for the right Panel and prepare the dates for the call
    */

    fillPanel: function() {
        var container = this.panel.getContentElement();
        //getting the calendar for the right panel
        var firstDay = parseInt(global.calendarsStartDay - 1, 10).abs();
        this.calendar = new miniCalendar({ container: container, firstDay: firstDay, prevHandler: this.getMonthEvents.bind(this), nextHandler: this.getMonthEvents.bind(this) });
        var EmptyDiv = new Element('div', { 'class': 'emptyDiv' });
        container.insert(EmptyDiv);
        //calculate the dates to call
        var firstDay = this.calendar.getCallDates().begda - 1;
        if (this.calendar.getCallDates().endda == 0)
            var lastDay = this.calendar.getCallDates().endda;
        else
            var lastDay = this.calendar.getCallDates().endda - 1;
        var startDate = Date.today().addMonths(-1).moveToFirstDayOfMonth().addDays(firstDay).toString('yyyy-MM-dd');
        var endDate = Date.today().addMonths(1).moveToFirstDayOfMonth().addDays(lastDay).toString('yyyy-MM-dd');
        this.getEvents(startDate, endDate);
    },
    /**
    * @Calculating the dates for the call and decide if we need to get the birthdays or not
    * Param {string} startDate: String containing the begda for the call
    * Param {string} endDate: String containig the endda for the call
    */
    getEvents: function(startDate, endDate) {
        var today = Date.today();
        if (!Object.isEmpty(startDate))
            var begda = startDate;
        else
            var begda = today.moveToFirstDayOfMonth().toString("yyyy-MM-dd");
        if (!Object.isEmpty(endDate))
            var endda = endDate;
        else
            var endda = today.moveToLastDayOfMonth().toString("yyyy-MM-dd");
        this.getTimeEvents(begda, endda);
        if (global.showBirthdays)
            this.getBirthdays(begda, endda);
        else
            this.birthReady = true;
    },
    /**
    * Getting the time events
    * Param {string} begda: String containing the begda for the call
    * Param {string} endda: String containig the endda for the call
    */
    getTimeEvents: function(begda, endda) {
        var objType = global.objectType;
        var objId = global.objectId;
        var xml = "<EWS>" +
                    "<SERVICE>GET_EVENTS</SERVICE>" +
                    "<OBJ TYPE='" + objType + "'>" + objId + "</OBJ>" +
                    "<PARAM>" +
                        "<o_begda_i>" + begda + "</o_begda_i>" +
                        "<o_endda_i>" + endda + "</o_endda_i>" +
                        "<o_li_incapp />" +
                    "</PARAM>" +
                    "<DEL></DEL>" +
                  "</EWS>";

        this.makeAJAXrequest($H({
            xml: xml,
            successMethod: this.getEventData.bind(this),
            infoMethod: Prototype.emptyFunction.bind(this)
        }));
    },

    /**
    * Getting the birthdays events
    * Param {string} begda: String containing the begda for the call
    * Param {string} endda: String containig the endda for the call
    */
    getBirthdays: function(begda, endda) {
        var xml = "<EWS>" +
                    "<SERVICE>GET_MYCALENDAR</SERVICE>" +
                    "<PARAM>" +
                        "<I_BEG>" + begda + "</I_BEG>" +
                        "<I_END>" + endda + "</I_END>" +
                        "<o_li_incapp />" +
                    "</PARAM>" +
                  "</EWS>";
        this.makeAJAXrequest($H({
            xml: xml,
            successMethod: this.fillBirthDay.bind(this)
        }));
    },
    /**
    * Parsing the data arriving from the backend, birtdays 
    * Param {string} begda: String containing the begda for the call
    * Param {string} endda: String containig the endda for the call
    */
    getEventData: function(json) {
        this.timeReady = true;
        if (!Object.isEmpty(json.EWS.o_field_values)) {
            var events = objectToArray(json.EWS.o_field_values.yglui_str_wid_record);
            for (var i = 0; i < events.length; i++) {
                var fields = objectToArray(events[i].contents.yglui_str_wid_content.fields.yglui_str_wid_field);
                for (var j = 0; j < fields.length; j++) {
                    if (fields[j]['@fieldid'] == 'ALLDF')
                        var fullDay = fields[j]['@value'];
                    if (fields[j]['@fieldid'] == 'BEGDA_H')
                        var begda = fields[j]['@value'];
                    if (fields[j]['@fieldid'] == 'BEGUZ') {
                        if (fields[j]['@value'].length == 8) {
                            var startTime = fields[j]['@value'].substring(0, 5);
                        }
                        else {
                            var startTime = fields[j]['@value'];
                        }
                    }
                    if (fields[j]['@fieldid'] == 'ENDDA_H')
                        var endda = fields[j]['@value'];
                    if (fields[j]['@fieldid'] == 'ENDUZ') {
                        if (fields[j]['@value'].length == 8) {
                            var endTime = fields[j]['@value'].substring(0, 5);
                        }
                        else {
                            var endTime = fields[j]['@value'];
                        }
                    }
                    if (fields[j]['@fieldid'] == 'M_AWART')
                        var description1 = fields[j]['#text'];
                    if (fields[j]['@fieldid'] == 'AWART')
                        var description2 = fields[j]['#text'];
                    if (fields[j]['@fieldid'] == 'STATUS')
                        var status = fields[j]['@value'];
                    if (fields[j]['@fieldid'] == 'EDITABLE')
                        var editable = fields[j]['@value'];
                }
                if (!Object.isEmpty(description1)) {
                    var description = description1;
                }
                if (!Object.isEmpty(description2)) {
                    var description = description2;
                }
                //Check if endda is bigger than endda
                var begdaObject = Date.parse(begda);
                var enddaObject = Date.parse(endda);
                while (Date.compare(enddaObject, begdaObject) >= 0) {
                    if (Object.isEmpty(this.eventsHash.get(begda))) {
                        this.eventsHash.set(begda, {
                            'events': $A()
                        });
                        this.eventsHash.get(begda).events.push({ 'fullDay': fullDay,
                            'startTime': startTime,
                            'endda': endda,
                            'endTime': endTime,
                            'description': description,
                            'status': status
                        });
                    }
                    else {
                        this.eventsHash.get(begda).events.push({ 'fullDay': fullDay,
                            'startTime': startTime,
                            'endda': endda,
                            'endTime': endTime,
                            'description': description,
                            'status': status
                        });
                    }
                    begdaObject.addDays(1);
                    begda = begdaObject.toString('yyyy-MM-dd');
                }
            }
        }
        this.setEvents();
    },


    fillBirthDay: function(json) {
        this.birthReady = true;
        if (!Object.isEmpty(json.EWS.o_fields)) {
            var birthDays = objectToArray(json.EWS.o_fields.yglui_str_mc_field);
            for (var i = 0; i < birthDays.length; i++) {
                var begda = birthDays[i]['@value'];
                var fullDay = 'N';
                var status = birthDays[i]['@datetype'];
                var description = birthDays[i]['@sname'];
                if (Object.isEmpty(this.eventsHash.get(begda))) {
                    this.eventsHash.set(begda, {
                        'events': $A()
                    });
                }
                this.eventsHash.get(begda).events.push({ 'fullDay': fullDay,
                    'description': description,
                    'status': status
                });
            }
        }
        this.setEvents();

    },
    setEvents: function() {
        if (this.birthReady && this.timeReady && this.eventsHash.keys().length > 0) {
            this.birthReady = false;
            this.timeReady = false;
            this.calendar.setEvents(this.eventsHash);
        }
    },
    getMonthEvents: function(date) {
        this.eventsHash = $H();
        var newbegDate = date.clone();
        var newendDate = date.clone();
        var firstDay = this.calendar.getCallDates().begda - 1;
        if (this.calendar.getCallDates().endda == 0)
            var lastDay = this.calendar.getCallDates().endda;
        else
            var lastDay = this.calendar.getCallDates().endda - 1;
        var begda = newbegDate.addMonths(-1).moveToFirstDayOfMonth().addDays(firstDay).toString('yyyy-MM-dd');
        var endda = newendDate.addMonths(1).moveToFirstDayOfMonth().addDays(lastDay).toString('yyyy-MM-dd');
        this.getEvents(begda, endda);
    }

});