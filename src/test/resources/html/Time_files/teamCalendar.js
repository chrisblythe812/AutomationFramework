/**
 * @fileOverview teamCalendar.js
 * @description File containing class teamCalendar Needed to see the calendar in a team view.
*/
var teamCalendar = Class.create(parentCalendar,
/**
*@lends teamCalendar
*/
{
    // PROPERTIES
    /**
     * @type Number
     * @description Logged user's personnel number
     */
    pernr: null,
    /**
     * @type Hash (id: name,color)
     * @description list of employees retrieved from getMyTeam. Employee view
     */
    myTeam: [],
    /**
     * @type array of hash (text, date)
     * @description list of days and labels for the TWO weeks view.
     */
    currentWeek: [],
    /**
     * @type Date
     * @description first day of the current week (not previous days) in the 2weeks view
     */
    begDate: '',
    /**
     * @type Date
     * @description last day of the current week (not following days) in the 2weeks view
     */
    endDate: '',
    /**
     * @type string
     * @description label od link select all. We need it to be a class attribute
     */
    selectAllLabel: '',
    /**
     * @type array
     * @description array of selected employees in manager view
     */
    selectedEmployees: [],
    /**
     * @type boolean
     * @description tells if employee is restricted to see colleague details...
     */
    employeeRestriction: null,
    /**
     * @type hash
     * @description hash of ws information
    */
    wsInformation : new Hash(),
    /**
     * @type Boolean
     * @description Says if the content for new event has been loaded
    */
    menuBalloonOpened: false,
    /**
     * @type Boolean
     * @description 
    */
    createEvents: null,
    /**
     * @type hash
     * @description hash of events balloon information
    */
    eventsBalloonInformation : new Hash(),
    /**
     * @type Boolean
     * @description If the event last more than 13 days
    */
    isVeryLongEvent: false,
    /**
     * @type Boolean
     * @description Indicates if we have to refresh the events
    */
    refresh: false,
    /**
     * @type Number
     * @description Maximum width (px) allowed for "Today" button
     */
    todayButtonMaxWidth: 70,
    /**
     * @type String
     * @description Service that must be called when a person is logged on as a manager
     */
    managerService: "GET_EVENTS",
    /**
     * @type String
     * @description Service that must be called when a person is logged on as an employee
     */
    employeeService: "GET_EVENTS_EE",
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
     *@param $super The superclass
     *@param appName Name of the applicacion: teamCalendar
     *@description instantiates the app
     */
	initialize: function($super,options) {
	    $super(options);
		this.datepicker_DateSelectedHandlerBinding = this._changeWeekHandler.bindAsEventListener(this);
		this.refreshButtonClickedBinding = this._refreshButtonClicked.bindAsEventListener(this);
		this._toggleFilterOptionsBinding = this._toggleFilterOptions.bind(this);
        this.showPicture = false; //Class variable which is able to switch between show or hide the employee pictures.
        this.lastSelectedDay = Date.today();
	},
    /**
     *@param $super The superclass
     *@description when the user clicks on the app tag, load the html structure and calendars for current week. If the user clicks on
     * the tag and it's not the first time, load new users selected in other apps, delete users unselected, and reaload colors
     * which have changed.
     */
	run: function($super, args) {
	    $super();
        // Checking if we are opening the calendar as sub-sub-application (Time task details - Inbox)
        this.openedAsSubSubApp = false;
        if (!Object.isEmpty(args) && !Object.isEmpty(args.get('keepSubOpened')))
            this.openedAsSubSubApp = args.get('keepSubOpened');
        this.createEvents = true;
        if(!Object.isEmpty(args) && !Object.isEmpty(args.get('createEvents')))
            this.createEvents = args.get('createEvents');
        var loadEvents = true;
	    // this.firstRun causes problems, so we will use our own parameter
        if (this.firstRun) {
            this.dateFormat = global.dateFormat;
            this.pernr = global.objectId;
            this.employeeRestriction = (global.getPopulationName(global.currentApplication) == 'NOPOP') ? false : true;
            if (this.employeeRestriction)
                this.selectedEmployees = this.getSelectedEmployees();
            else {
                this.myTeam = new Hash();
                var emp = this.getPopulation()[0];
                this.myTeam.set(emp.objectId, $H({
                    name: emp.name,
                    color: 0,
                    selected: false,
                    otype: emp.objectType
                }));
            }
            this.today = Date.today();
            this._calLabels(this.today);
            var loadEvents = false;
        }
        // If there were creations, modifications or deletions, we have to refresh the calendar
        if (this.refresh) {
            this.eventsBalloonInformation = new Hash ();
            if (parentCalendar.prototype.filterJson != null)
                    this._updateFilterPanel(parentCalendar.prototype.filterJson);//Update the filter options
            this._refreshButtonClicked();
            this.refresh = false;
            var loadEvents = false;
        }
        // If application is opened in Time Entry, we will use its date
        if ((!Object.isEmpty(args) && !Object.isEmpty(args.get('date'))) && !this.firstRun){
            this._changeWeek(Date.parseExact(args.get('date'), 'yyyy-MM-dd'));
            var loadEvents = false;
        }
        //If there were not changes in timeEntry
        if(loadEvents){
            this.today = Date.today();
            //Refresh the week with the last selected day in timeViews
            if(!Object.isEmpty(this.datePicker))
                this.datePicker.setDate(this.lastSelectedDay);
            this._calLabels(this.lastSelectedDay);
        }
        //Flag retro/future active
        this.retroFuture = false;
        //To store the retro/future dates per screen in each step in case this.retroFuture active
        this.retroFutureHash = new Hash();
        //set the event listeners
        document.observe('EWS:teamCalendar_CorrectDate', this.datepicker_DateSelectedHandlerBinding);
        document.observe('EWS:calendar_refreshButtonClicked_teamCalendar', this.refreshButtonClickedBinding);
	},
    /**
    * @description called when the application is not shown.
    */
    close: function($super){
        $super();
        //Update the "parentCalendar.prototype.parentFilter" if we leave this app without push the "refresh" button in the filter options.
        if(parentCalendar.prototype.parentFilter == ""){
            this.getFilterSelectedOptions();
        }
		document.stopObserving('EWS:teamCalendar_CorrectDate', this.datepicker_DateSelectedHandlerBinding);
		document.stopObserving('EWS:calendar_refreshButtonClicked_teamCalendar', this.refreshButtonClickedBinding);
    },
    /**
     *@param date Date selected in the datePicker, or today
     *@description load team Calendar for date selected
     */
	_calLabels: function(date) {
        if (this.firstRun)
            this._setInitialHTML();
        else
            this._changeWeek(date);
	},
    /**
     *@description load html structure and team Calendars for default date (today)
     */
	_setInitialHTML: function() {
        // HEADER HTML
        // Beg date - end date TodayButton DatePicker
        var week = 0;
        if (this.today.getWeek() > 52)
            week = this.today.getWeek() - 52;
        else
            week = this.today.getWeek();
        // If first day of the week is Sunday...
        if (global.calendarsStartDay < 1)
            this.begDate = this.today.clone().moveToFirstDayOfMonth().setWeek(week).moveToDayOfWeek(0, -1);
        // If not...
        else {
            // If first day of the week is not Sunday or Monday...
            if (global.calendarsStartDay > 1)
                this.begDate = this.today.clone().moveToFirstDayOfMonth().setWeek(week).moveToDayOfWeek(global.calendarsStartDay);
            // If first day of the week is Monday...
            else
                this.begDate = this.today.clone().moveToFirstDayOfMonth().setWeek(week);
        }
        this.endDate = this.begDate.clone().addDays(6);
        if (!this.today.between(this.begDate, this.endDate)) {
            this.begDate.addDays(-7);
            this.endDate.addDays(-7);
        }
        this.begDateLabel = this.begDate.toString('ddd').toLowerCase();
        this.endDateLabel = this.endDate.toString('ddd').toLowerCase();
		
		this.teamCalendarOuterDiv = new Element('div', {
			'id': 'applicationTeamCalendar_outer'
		});
		
		// ----- HEADER BUILDING
		// buttons and nav div
		if(!global.liteVersion){
		    this.teamCalendarHeaderPrevButton = new Element('div', {
			    'id': 'applicationTeamCalendar_prevButton',
			    'class': 'application_handCursor'
		    });
		}else{
		    this.teamCalendarHeaderPrevButton = new Element('button', {
			    'id': 'applicationTeamCalendar_prevButton',
			    'class': 'application_handCursor link',
			    'title': global.getLabel("previousWeek")
		    });
		}
		if (!global.liteVersion)
		    this.teamCalendarHeaderPrevButton.addClassName('application_verticalL_arrow test_icon');
        else {
            this.teamCalendarHeaderPrevButton.insert('&lt;');
            this.teamCalendarHeaderPrevButton.addClassName('calendar_boldArrow');
        }
        if(!global.liteVersion){
		    this.teamCalendarHeaderPostButton = new Element('div', {
			    'id': 'applicationTeamCalendar_postButton',
			    'class': 'application_handCursor'
		    });
		}else{
		     this.teamCalendarHeaderPostButton = new Element('button', {
			    'id': 'applicationTeamCalendar_postButton',
			    'class': 'application_handCursor link',
			    'title': global.getLabel("nextWeek")
		    });
		}
		if (!global.liteVersion)
		    this.teamCalendarHeaderPostButton.addClassName('application_verticalR_arrow test_icon');
        else {
            this.teamCalendarHeaderPostButton.insert('&gt;');
            this.teamCalendarHeaderPostButton.addClassName('calendar_boldArrow');
        }
		this.teamCalendarHeaderNavDiv = new Element('div', {
			'class': 'applicationTeamCalendar_navButtonsDiv'
		});
		this.teamCalendarHeaderNavDiv.insert(this.teamCalendarHeaderPrevButton);
		this.teamCalendarHeaderNavDiv.insert(this.teamCalendarHeaderPostButton);
		
		this.teamCalendarCurrentWeek = new Element('div', {
			'id':'applicationTeamCalendar_currentWeek'
		}).insert(global.getLabel(this.begDateLabel)+" "+ this.begDate.toString(this.dateFormat) + " - " + global.getLabel(this.endDateLabel) +" "+ this.endDate.toString(this.dateFormat));
		
		this.teamCalendarToday = new Element('div', {
			'id':'applicationTeamCalendar_todayButtonDiv'
		});
		
		this.teamCalendarDatePicker = new Element('div', {
			'id':'applicationTeamCalendar_datePickerDiv'
		});
		
		if(!global.liteVersion){
		    this.teamCalendarFilterDiv = new Element('div',{
			    'id':'applicationTeamCalendar_filterLabel',
			    'class':'application_action_link'
		    });
		}else{
		    this.teamCalendarFilterDiv = new Element('button',{
			    'id':'applicationTeamCalendar_filterLabel',
			    'class':'application_action_link link'
		    });
		}
		
		// main header container
		this.teamCalendarHeaderDiv = new Element('div', {
			'id': 'applicationTeamCalendar_header'
		});
		
		this.teamCalendarHeaderDiv.insert(this.teamCalendarHeaderNavDiv);
		this.teamCalendarHeaderDiv.insert(this.teamCalendarCurrentWeek);
		this.teamCalendarHeaderDiv.insert(this.teamCalendarToday);
		this.teamCalendarHeaderDiv.insert(this.teamCalendarDatePicker);
		this.teamCalendarHeaderDiv.insert(this.teamCalendarFilterDiv);
		
		this.virtualHtml.update();
		this.virtualHtml.insert(this.teamCalendarOuterDiv);          
        
		var json = { elements:[] };
        var aux = {
            idButton: 'todayButton',
            label: global.getLabel('today'),
            handlerContext: null,
            handler: this._clickOnToday.bind(this),
            type: 'button',
            standardButton: true
        };                 
        json.elements.push(aux);                   
        var ButtonTeamCalendar = new megaButtonDisplayer(json);                 
        //update with the created html
        this.teamCalendarOuterDiv.insert(this.teamCalendarHeaderDiv);
        this.virtualHtml.insert(this.teamCalendarOuterDiv);
		
        this.teamCalendarToday.insert(ButtonTeamCalendar.getButtons());
        // Fixing the button width problem
        // (Applying a class having the attribute max-width doesn't work in IE)
        var button = this.teamCalendarToday.down('button');
        var width = button.getDimensions().width;
        if (width > this.todayButtonMaxWidth)
            button.writeAttribute('style', 'width: ' + this.todayButtonMaxWidth + 'px; overflow: hidden;');
        //once we have retrieved the labels, create the html
        this.virtualHtml.insert(this.filterElement);
		
		// --- BODY BUILDING
		this.teamCalendarBodyTable = new Element('div', {
			'id': 'applicationTeamCalendar_tableDiv'
		});
		
		this.teamCalendarMessageDiv = new Element('div', {
			'id': 'applicationTeamCalendar_message'
		});
		
		this.teamCalendarBodyFooter = new Element('div', {
			'id': 'applicationTeamCalendar_footer'
		});
		
		this.teamCalendarBodyContent = new Element('div', {
			'id': 'applicationTeamCalendar_content'
		});
		
		this.teamCalendarBodyContent.insert(this.teamCalendarBodyTable);
		this.teamCalendarBodyContent.insert(this.teamCalendarMessageDiv);
		this.teamCalendarBodyContent.insert(this.teamCalendarBodyFooter);
			
		this.teamCalendarBodyDiv = new Element('div',{
			'id': 'applicationTeamCalendar_body'
		});
		
		this.teamCalendarBodyDiv.insert(this.teamCalendarBodyContent);
		
		this.virtualHtml.insert(this.teamCalendarBodyDiv);
		
        this.teamCalendarMessageDiv.hide();
        
        var teamCalendarNoEventsFoundDiv = new Element('div', {
			'class': 'application_main_soft_text listCalendar_clearBoth listCalendar_noEventsFound'
		}).insert(global.getLabel("selectEmployeePlease"));
        var teamCalendarClearBothDiv = new Element('div', {
			'class': 'listCalendar_clearBoth'
		}).insert("&nbsp;");
        this.teamCalendarMessageDiv.insert(teamCalendarNoEventsFoundDiv);
        this.teamCalendarMessageDiv.insert(teamCalendarClearBothDiv);
        
        //creation of the datePicker
        this.datePicker = new DatePicker('applicationTeamCalendar_datePickerDiv', {
                              manualDateInsertion: false,
                              defaultDate: this.today.toString('yyyyMMdd'),
                              draggable: true,
                              events: $H({correctDate: 'EWS:teamCalendar_CorrectDate'})
                          });
        //NAVIGATION
        //when the datePicker is used, reload the calendar by calling to changeWeekHandler --> globalEvents attached in run method
        //when "today" button is clicked, call "clickOnToday" method
        this.teamCalendarHeaderPrevButton.observe('click', function(args){
            //go to the first day of the next week
            var lastWeek = this.begDate.clone().add(-7).days();
            this.menuBalloonOpened = false;
            //reload teamCalendar (the table with top and employees rows)
            //2nd parameter: is not neccesary to recalculate the week -> false
	        this._changeWeek(lastWeek, false);
        }.bind(this));
        this.teamCalendarHeaderPostButton.observe('click', function(args){
            //go to the first day of the next week
            var nextWeek = this.begDate.clone().add(7).days();
            this.menuBalloonOpened = false;
            //reload teamCalendar (the table with top and employees rows)
            //2nd parameter: is not neccesary to recalculate the week -> false
	        this._changeWeek(nextWeek, false);
        }.bind(this));
        // END OF HEADER HTML
        //----------------------------------------------------------------------------------//
        //FOOTER HTML
        var labPresent = global.getLabel('present');
        var labPartAbs = global.getLabel('halfPresent');
        var labAbsent = global.getLabel('absent');
        var moreEvents = global.getLabel('moreEvents');
        this.selectAllLabel = global.getLabel('selectUnselectAll');
        //create the html with the labels read
        var legendJSON;
        if(!global.liteVersion){
            legendJSON = { 
                legend: [
                    { img: "applicationTeamCalendar_presentIcon", text: labPresent },
                    { img: "applicationTeamCalendar_partAbsentIcon", text: labPartAbs },
                    { img: "applicationTeamCalendar_absentIcon", text: labAbsent },
                    { img: "applicationTeamCalendar_moreEventsIcon", text: moreEvents }
                ],
                showLabel: global.getLabel('showLgnd'),
                hideLabel: global.getLabel('closeLgnd')
            };
        }else{
            legendJSON = { 
                legend: [
                    { text: "<span class='applicationTeamCalendar_PresentLite'>" + labPresent + "</span>" },
                    { text: "<span class='applicationTeamCalendar_partAbsentLite'>" + labPartAbs + "</span>" },
                    { text: "<span class='applicationTeamCalendar_AbsentLite'>" + labAbsent + "</span>" },
                    { code: "+", text: moreEvents }
                ],
                showLabel: global.getLabel('showLgnd'),
                hideLabel: global.getLabel('closeLgnd')
            };
        }
        
        
        var legendHTML = getLegend(legendJSON);
        
        this.teamCalendarDropList = new Element('div', {
			'id': 'applicationTeamCalendar_dropList'
		});
        
        this.teamCalendarBodyFooter.update(this.teamCalendarDropList);
        this.teamCalendarBodyFooter.insert(legendHTML);
        //if we have an x in restrict, we don't have to show the colleagues, only the calendar of the employee          
        if (this.employeeRestriction)
            this.teamCalendarDropList.hide();
        // END OF FOOTER
        //----------------------------------------------------------------------------------//
        //CALENDAR WITH CURRENT USER
        //get the date and text for the top table.
        this._getTopTableLabels(this.begDate);
        //draw the top tabel (date and texts): Mo 01, Tu 02...
        this._drawTopOfTable();
        //Check if it's a manager or not. Depending on that, the functionality is slightly different
        if (!this.employeeRestriction) {
            // Before drawing calendars, we need to load the drop list with "my team" members, since
            // in employee view we dont have left menu
            // create the xml for service GETMYTEAM
            var xmlGetMyTeam = "<EWS>" +
                                   "<SERVICE>GET_MY_TEAM</SERVICE>" +
                                   "<OBJECT TYPE='P'>" + this.pernr + "</OBJECT>" +
                                   "<PARAM></PARAM>" +
                               "</EWS>";
            //calling the service
            this.makeAJAXrequest($H({xml:xmlGetMyTeam, successMethod:'_asEmp_insertMyTeam'}));
        }
        this.firstRun = false;
	},
    /**
     *@param date Date seed to build the labels
     *@description Parses the xml to create an array with labels for current week
     */
    _getTopTableLabels: function(date) {
        var actualDate = date.clone().addDays(-3);
        // 13 days (one week and 3 days before/after
        for (var i = 0; i < 13 ; i++) {
            var dayHash = new Hash();
            var style = 'normalDay';
            if (i < 3 || i >= 10)
                style = 'grayedDay';
            var dayNumber = actualDate.toString('dd');
            var dayName = global.getLabel(actualDate.toString('ddd').toLowerCase());
            dayHash.set('class', style);
            dayHash.set('date',dayNumber);
            dayHash.set('text',dayName);
            //save all values in the class attribute this.currentWeek
            this.currentWeek.push(dayHash);
            actualDate = actualDate.clone().addDays(1);
        }
    },
    /**
     *@param week Array with week labels
     *@description Draw the top of the calendar table, with the 2 weeks labels
     */
    _drawTopOfTable: function() {
        //creation of the table
        var table = new Element('table', {
            id: 'applicationTeamCalendar_table',
            'cellspacing': '0',
            'cellpadding': '0'
        });
        //creation of tbody
        this.teamCalendarTBody = new Element('tbody', {
            id: 'applicationTeamCalendar_tbody'
        });
        //first row: text with the day within the week (mon, tue, wed..)
        var tr1 = new Element('tr');
        tr1.addClassName('applicationTeamCalendar_dateText');
        //td with empty space (we need that td because in the employees rows we'll place there the emp name
        var spaceCellDiv = new Element('div', {
            'class': 'applicationTeamCalendar_spaceCell'
        });
        var td_spaceCell1 = new Element('td').insert(spaceCellDiv);
        tr1.insert(td_spaceCell1);
        //move throught the week array to load the cells with the labels
        for (var j = 0; j < this.currentWeek.length; j++) {
            var topCell = new Element('div', {
                'class': 'applicationTeamCalendar_topcell'
            }).insert(this.currentWeek[j].get('text'));
            var td = new Element('td').insert(topCell);
            //if it's te grayed or normal we add the proper style
            if (this.currentWeek[j].get('class') == 'grayedDay')
                td.addClassName('application_main_soft_text');
            if (this.currentWeek[j].get('class') == 'normalDay')
                td.addClassName('applicationTeamCalendar_normalDay');
            tr1.insert(td);
        }
        this.teamCalendarTBody.insert(tr1);
        //second row: date of the date: 23, 24, 25...
        var tr2 = new Element('tr');
        tr2.addClassName('applicationTeamCalendar_dateNumber');
        var spaceCellDiv2 = new Element('div', {
            'class': 'applicationTeamCalendar_spaceCell'
        });
        var td_spaceCell2 = new Element('td').insert(spaceCellDiv2);
        tr2.insert(td_spaceCell2);
        for (var j = 0; j < this.currentWeek.length; j++) {
            var topCell = new Element('div', {
                'class': 'applicationTeamCalendar_topcell'
            }).insert(this.currentWeek[j].get('date'));
            var td = new Element('td').insert(topCell);
            //if it's te grayed or normal we add the proper style
            if (this.currentWeek[j].get('class') == 'grayedDay')
                td.addClassName('application_main_soft_text');
            if (this.currentWeek[j].get('class') == 'normalDay')
                td.addClassName('applicationTeamCalendar_normalDay');
            tr2.insert(td);
        }
        this.teamCalendarTBody.insert(tr2);
        table.insert(this.teamCalendarTBody);
        this.teamCalendarBodyTable.update(table);
    },

    /**
     *@param empPernr EmployeeId
     *@param empName Employee's name
     *@param empColor Employee's color
     *@description Draw the empty calendar row for an employee
     */
    _drawCalendarRow: function(empPernr, empName, empColor) {
        //a white cross which is a button to unselect employees, if the employee is not restricted
        var xTag = '';
        if (!this.employeeRestriction) {
            xTag = new Element('div', {
                'class': 'application_currentSelection applicationTeamCalendar_closeButton'
            });
            //getting the name and color from the hash of employees
            var employeePosition = this.myTeam.keys().indexOf(empPernr);
            //set selected=true in this.myTeam array
            this.myTeam.get(empPernr).set('selected', true);
            //get name and color of the employee
            //empName = this.myTeam.get(empPernr).get('name');
            //empColor = this.myTeam.get(empPernr).get('color');
        }
        var color = (empColor < 10) ? '0' + empColor : empColor;
        //html structure of the row
        var tr_empCalendar = new Element('tr', {
            id: empPernr + '_teamCalendar'
        });
        //column of the name: coloured square and name div *X cross in the coloured square if employee
        var employeeColorCellDiv = new Element('div', {
            id: empPernr + '_button',
            'class': 'applicationTeamCalendar_empButton eeColor' + color
        });
        var employeeColorCellXContainter = new Element('div', {
            'class': 'applicationTeamCalendar_textInMiddleButton'
        });
        if (!Object.isEmpty(xTag))
            employeeColorCellXContainter.insert(xTag);
        employeeColorCellDiv.insert(employeeColorCellXContainter);
        
        var employeeNameCellDiv = new Element('div', {
            id: empPernr + '_name',
            'class': 'applicationTeamCalendar_nameEmp application_color_eeColor' + color
        });
        var employeeNameDiv = new Element('div', {
            'class': 'applicationTeamCalendar_textInMiddleName',
            title: empName + " " + global.idSeparatorLeft + empPernr + global.idSeparatorRight
        });
        if (global.liteVersion || !this.showPicture){
            employeeNameDiv.insert(empName);
            employeeColorCellDiv.removeClassName('applicationTeamCalendar_withPicture');
            employeeNameDiv.removeClassName('applicationTeamCalendar_withPicture');
            employeeNameCellDiv.removeClassName('applicationTeamCalendar_withPicture');
            var classCell = 'applicationTeamCalendar_cell';        //CSS class to be applicated to the cell
        }else{//Pictures are shown
            employeeNameDiv.insert(global.getPicture(empPernr, 'applicationTeamCalendar_style_picture'));
            employeeColorCellDiv.addClassName('applicationTeamCalendar_withPicture');
            employeeNameDiv.addClassName('applicationTeamCalendar_withPicture');
            employeeNameCellDiv.addClassName('applicationTeamCalendar_withPicture');
            var classCell = 'applicationTeamCalendar_cell applicationTeamCalendar_withPicture';        //CSS class to be applicated to the cell
        }
        employeeNameCellDiv.insert(employeeNameDiv);
        
        var td_name = new Element('td');
        td_name.insert(employeeColorCellDiv);
        td_name.insert(employeeNameCellDiv);
        td_name.addClassName('applicationTeamCalendar_calRow');
        tr_empCalendar.insert(td_name);
        //parse the date to DATE format
        var date = this.begDate.clone();
        //go to the first day in the 2 weeks view
        var parsedDate = date.clone().add(-3).days().toString('yyyyMMdd');
        //create all the cells with empID_date as ID
        for (var j = 0; j < this.currentWeek.length; j++) {
            var cell = new Element('div', {
                id: empPernr + "_" + parsedDate,
                'class': classCell
            });
            var td = new Element('td').insert(cell);
            td.addClassName('applicationTeamCalendar_calRow');
            tr_empCalendar.insert(td);
            date = Date.parseExact(parsedDate, 'yyyyMMdd');
            parsedDate = date.clone().add(1).days().toString('yyyyMMdd');
        }
        this.teamCalendarTBody.insert(tr_empCalendar);
        //if employee AND if employee is not restricted, make the X cross a button to unselect employees
        if(!this.employeeRestriction) {
            employeeColorCellDiv.addClassName('applicationTeamCalendar_handCursor');
            employeeColorCellDiv.observe('click', function(event){
                this.onEmployeeUnselected({id: empPernr});
            }.bind(this));
        }
    },
	
    /**
     *@param serviceGetEvents: the service that must be called depending if the person logged on is a manager or a employee
     *@param empPernr Id of the employee in either global o this.myTeam arrays
     *@param oType Object type
     *@param cell_id: the id of the cell where we will open a balloon (only "special" mode for "_refreshButtonClicked()" function )
     *@param content: the content for the balloon (only "special" mode for "_refreshButtonClicked()" function )
     *@description Insert the events for an employee in a determined week
     */
     _callToGetEvents: function(empPernr, oType,cell_id, content, serviceGetEvents) {
        //we must call the service with the end and beg date in the 2 weeks period, not in current week
        var begGrayed = this.begDate.clone().add(-3).days().toString('yyyy-MM-dd');
        var endGrayed = this.endDate.clone().add(3).days().toString('yyyy-MM-dd');
        this.getFilterSelectedOptions();
        if (!oType)
            oType = 'P';
        var filter = Object.isEmpty(parentCalendar.prototype.parentFilter) ? "" : parentCalendar.prototype.parentFilter;
        var xmlGetEvents = "<EWS>" +
                               "<SERVICE>" + serviceGetEvents + "</SERVICE>" +
                               "<OBJECT TYPE='" + oType + "'>" + empPernr + "</OBJECT>" +
                               "<PARAM>" +
                               "<o_begda_i>" + begGrayed + "</o_begda_i>" +
                               "<o_endda_i>" + endGrayed + "</o_endda_i>" +
                               "<o_li_incapp>" + filter + "</o_li_incapp>" +
                               "</PARAM>" +
                           "</EWS>";
        //calling the service GET_EVENTS
        if(Object.isEmpty(cell_id)){
            this.makeAJAXrequest($H({xml:xmlGetEvents, successMethod: this._insertEvents.bind(this,false,false), errorMethod: '_insertEventsError', ajaxID: empPernr}));
        }else{
            this.makeAJAXrequest($H({xml:xmlGetEvents, successMethod: this._insertEvents.bind(this,cell_id,content), errorMethod: '_insertEventsError', ajaxID: empPernr}));
        }
    },
    /**
     *@param json JSON from GET_EVENTS / GET_EVENTS_EE service
     *@param cell_balloon_id: the id of the cell where we will open a balloon (only "special" mode for "_refreshButtonClicked()" function )
     *@param content_balloon: the content for the balloon (only "special" mode for "_refreshButtonClicked()" function )
     *@description Once the calendar is drawn, complete it with the events and workschedule
     */
    _insertEvents: function(cell_balloon_id, content_balloon, json, ID) {
        if (!this.filterCreated) {
            var incapp = json.EWS.o_li_incapp.yglui_str_incap2;
            this.createFilterPanel(this.filterElement, this.appName, incapp);
            this.teamCalendarFilterDiv.update(global.getLabel("filterOptions")).observe('click',this._toggleFilterOptionsBinding);
            this.filterCreated = true;
        }
        var pernr = ID;
        var wsXML = Object.isEmpty(json.EWS.o_workschedules) ? [] : objectToArray(json.EWS.o_workschedules.yglui_str_dailyworkschedule);
        var workschedules = [];
        //We get the public holidays
        var holidays = Object.isEmpty(json.EWS.o_freedays) ? [] : objectToArray(json.EWS.o_freedays.yglui_str_incidence);
        var publicholidays = new Hash();
        if (holidays.length > 0) {
            //create hash of holidays
            for (var a = 0; a < holidays.length; a++)
                if(holidays[a]['@type'] == 'PHOL')
                    publicholidays.set( holidays[a]['@begda'], holidays[a]['@begda']);
        }
        
        if(!this.employeeRestriction)
            this._getRetroFuture(json);
            
        if (wsXML.length > 0) {
            //create hash of workschedules
            for (var a = 0; a < wsXML.length; a++) {
                var workSchedule = new Hash();
                workSchedule.set('id', pernr + "_" + Date.parseExact(wsXML[a]['@workschedule_id'], 'yyyy-MM-dd').toString('yyyyMMdd'));
                workSchedule.set('text', wsXML[a]["@daily_wsc"]);
                workschedules.push(workSchedule);
            }
            //insert workschedules in cells
            for (var a = 0; a < this.currentWeek.length; a++) {
                var begEndDate = workschedules[a].get('id').substring(9,18);
                var begda = begEndDate.substring(0,4) + "-" + begEndDate.substring(4,6) + "-" + begEndDate.substring(6,8);
                var wsId = workschedules[a].get('id');
                var wsText = workschedules[a].get('text');
                var currentCell = $(wsId);
                if(!Object.isEmpty(publicholidays.get(begda)))
                    wsText = "PHOL";
                //insert workschedule in team calendar
                var workScheduleCell = new Element('div', {
                    id: wsId + '_ws_teamCalendar',
                    'class': 'applicationTeamCalendar_cell_ws'
                }).insert(wsText);
                if(!global.liteVersion){
                    var contentCell = new Element('div', {
                        id: wsId + '_content',
                        'class': 'applicationTeamCalendar_cell_content'
                    });
                    var moreEventsCell = new Element('div', {
                        id: wsId + '_moreEvents'
                    });
                }else{
                    var contentCell = new Element('button', {
                        id: wsId + '_content',
                        'class': 'applicationTeamCalendar_cell_content link'
                    });
                    var moreEventsCell = new Element('button', {
                        id: wsId + '_moreEvents',
                        'class':'link'
                    });
                }
                currentCell.insert(workScheduleCell);
                currentCell.insert(contentCell);
                currentCell.insert(moreEventsCell);
                //add css class
                if (wsText == 'FREE' || wsText == 'PHOL')
                    currentCell.addClassName('applicationTeamCalendar_cellAbsent');
                //managers can see details for everybody. Employees can just see their own event details
                if ((this.employeeRestriction) || (!this.employeeRestriction && (pernr == this.pernr)) ){
                    //just put the hand cursor in owned cells
                    workScheduleCell.addClassName('applicationTeamCalendar_handCursor');
                    //call GET_CAL_MENU to get the content of the balloon that will be fired if the user wants to create an event in an empty cell
                    if(this.retroFuture){
                        var xmlCalMenu = "<EWS>" +
                                            "<SERVICE>" + this.RFballoonService + "</SERVICE>" +
                                            "<OBJECT TYPE='P'>" + pernr + "</OBJECT>" +
                                            "<PARAM>" +
                                            "<CONTAINER>CAL_MGM</CONTAINER>" +
                                            "<MENU_TYPE>N</MENU_TYPE>" +
                                            "<I_DATE>" + begda + "</I_DATE>" + 
                                            "</PARAM>" +
                                        "</EWS>";
                    }else{
                        var xmlCalMenu = "<EWS>" +
                                            "<SERVICE>" + this.balloonService + "</SERVICE>" +
                                            "<OBJECT TYPE='P'>" + pernr + "</OBJECT>" +
                                            "<PARAM>" +
                                            "<CONTAINER>CAL_MGM</CONTAINER>" +
                                            "<MENU_TYPE>N</MENU_TYPE>" +
                                            "</PARAM>" +
                                        "</EWS>";       
                    }   
                    if (!this.openedAsSubSubApp && this.createEvents)
                        contentCell.observe('click', this._callToGetCalMenu.bind(this, xmlCalMenu, pernr + '_' + begEndDate + '_content'));
                    workScheduleCell.observe('click', this._callToGetDWSDetails.bind(this, pernr, begEndDate));
                }
            }
            //END WORKSCHEDULES
            //*************************************************************************************************//
            //once the ws have been inserted, we retrieve the EVENTS
            parentCalendar.prototype.filterJson = json.EWS.o_li_incapp.yglui_str_incap2;//Store the last JSON
            var eventsXML = this._getEventHash(json);
			
			var eventsKeys = eventsXML.keys();

			for(var i = 0; i < eventsKeys.size(); i++)
				eventsXML.get(eventsKeys[i]).set('drawn', false);
			
            // This will be to find other events with the same date
            var otherEvents = new Hash(eventsXML);
            if (!this.openedAsSubSubApp) {
                if (!global.liteVersion) {
                    var balloon_footer = new Element('div', {
                        id: 'applicationTeamCalendar_addNewEvent',
                        'class': 'application_action_link'
                    }).insert(global.getLabel("add_event"));
                }
                else {
                    var balloon_footer = new Element('button', {
                        id: 'applicationTeamCalendar_addNewEvent',
                        'class': 'application_action_link link stdLink'
                    }).insert(global.getLabel("add_event"));
                }
            }
            //insert events in team calendar
            
            //To store the retro/future dates
            var retroDates;
            
			for (var i = 0; i < eventsKeys.size(); i++) {
				var event = {
					key: eventsKeys[i],
					value: eventsXML.get(eventsKeys[i])
				}
                if (!event.value.get('drawn')) {
                    var eventType = this._getEventByAppId(event.value.get('APPID').value, json.EWS.o_li_incapp.yglui_str_incap2); 
                    var eventBegDate = Date.parseExact(event.value.get('BEGDA').value, 'yyyy-MM-dd');
                    var eventEndDate = Object.isEmpty(event.value.get('ENDDA')) ? eventBegDate : Date.parseExact(event.value.get('ENDDA').value, 'yyyy-MM-dd');
                    var eventEmpId = event.value.get('PERNR').value;
                    var cell_id = eventEmpId + "_" + eventBegDate.toString('yyyyMMdd');
                    var allDay = event.value.get('ALLDF') ? (event.value.get('ALLDF').value == 'X' ? true : false) : false;
                    var comment = event.value.get('COMMENT') ? prepareTextToShow(event.value.get('COMMENT').text) : null;
                    var type = this._getEventSubtype(event);
                    var hours = event.value.get('STDAZ') ? event.value.get('STDAZ').value : "-";
                    var appId = eventType != 'ERR' ? event.value.get('APPID').value : eventType;
                    var contentCell = $(cell_id + '_content');
                    if (contentCell) {
                        //stop observing the click to create a new event
                        contentCell.stopObserving();
                        //create the event to insert it in the cell
                        if(!global.liteVersion){
                            var cell_id_content = new Element('div', {
                                id: cell_id + '_event'
                            }).insert(appId);
                        }else{
                            var cell_id_content = new Element('button', {
                                id: cell_id + '_event',
                                'class': 'link' 
                            }).insert(appId);
                        }
                        if(!global.liteVersion){
                            contentCell.insert(cell_id_content);
                        }else{
                            contentCell.up().insert(cell_id_content);                            
                        }
                        var currentCell = $(cell_id);
                        if ((this.eventCodes.get('ABS').get('appids').indexOf(appId) >= 0)  && allDay && !global.liteVersion)
                            currentCell.addClassName('applicationTeamCalendar_cellAbsent');
                        else if ((this.eventCodes.get('ABS').get('appids').indexOf(appId) >= 0)  && allDay && global.liteVersion)
                            currentCell.addClassName('applicationTeamCalendar_AbsentLite');
                        else if ((this.eventCodes.get('ABS').get('appids').indexOf(appId) >= 0) && !allDay && !global.liteVersion)
                            currentCell.addClassName('applicationTeamCalendar_cellPartAbsent');
                        else if ((this.eventCodes.get('ABS').get('appids').indexOf(appId) >= 0) && !allDay && global.liteVersion)
                            currentCell.addClassName('applicationTeamCalendar_partAbsentLite');
                        //managers can see details of everybody's events. Employees can just see their own event details
                        if (( this.employeeRestriction ) || (!this.employeeRestriction && pernr == this.pernr) ) {
                            //just put the hand cursor in owned cells
                            cell_id_content.addClassName('applicationTeamCalendar_handCursor');
                            //creation of balloon content
                            var dateForBalloon = eventBegDate.toString(this.dateFormat) + ((eventType!='ERR' && eventType!='HRZ' && eventType!='INF') ? (' - ' + eventEndDate.toString(this.dateFormat)) : '');
                            var eventStatus = this._getStatusOfEvent(event);
                                
                            //create the html content of the balloon
                            var eventSent = this._getEvent(json, event.key);
                            var eventData = this._getEventData(event);
                            var balloon_content = new Element('div');
                            eventData.begDate = eventData.begDate.toString("yyyy-MM-ddTHH:mm:ssZ");
                            eventData.endDate = eventData.endDate.toString("yyyy-MM-ddTHH:mm:ssZ");
                            if(!global.liteVersion){
						        var eventLink = new Element('div', {
						            'class': 'application_action_link',
						            'title': type
						        }).insert(type.truncate(20));
						    }else{
						        var eventLink = new Element('button', {
						            'class': 'application_action_link link stdLink teamCalendar_balloon_event_links',
						            'title': type
						        }).insert(type.truncate(20));
						    }
                            if (!this.openedAsSubSubApp && this.createEvents){
                                if(this.retroFuture)
                                    retroDates = this.retroFutureHash.get(event.value.get('APPID').value) ? this.retroFutureHash.get(event.value.get('APPID').value) : null; 
						        eventLink.observe('click', this._showEventDetails.bind(this, event.value.get('APPID').value, event.value.get('VIEW').value, eventSent, eventEmpId, eventData, retroDates));
						        balloon_content.insert(eventLink);
						    }
						    var eventInfo = new Element('p');
						    
						    var eventDateSpan = new Element('span', {
						        'class': 'application_main_soft_text'
						    }).insert(global.getLabel('date') + ": ");
						    eventInfo.insert(eventDateSpan);
						    eventInfo.insert(dateForBalloon);
						    eventInfo.insert(new Element('br'));
						    
						    if ((eventType != 'ERR') && (eventType != 'HRZ') && (eventType != 'INF')) {
						        var eventHoursSpan = new Element('span', {
						            'class': 'application_main_soft_text'
						        }).insert(global.getLabel('nhours') + ": ");
						        eventInfo.insert(eventHoursSpan);
						        eventInfo.insert(hours);
						        eventInfo.insert(new Element('br'));
						    }
						    
						    var eventStatusSpan = new Element('span', {
						        'class': 'application_main_soft_text'
						    }).insert(global.getLabel('status') + ": ");
						    eventInfo.insert(eventStatusSpan);
						    eventInfo.insert(eventStatus);
						    
						    if ((eventType != 'ERR') && (eventType != 'HRZ') && (eventType != 'INF')) {
                                //event details: commment
                                eventInfo.insert(new Element('br'));
                                if (!Object.isEmpty(comment)) {
                                    var eventCommentSpan = new Element('span', {
                                        'class': 'application_main_soft_text'
                                    }).insert(global.getLabel('comment') + ": ");
                                    eventInfo.insert(eventCommentSpan);
                                    eventInfo.insert(comment);
                                }
                                else
                                    eventInfo.insert(global.getLabel('no_comments'));
						    }
						    balloon_content.insert(eventInfo);

                            //get other events with the same date
                            event.value.set('drawn', true);
                            // Delete selected event
                            otherEvents.unset(event.key);
							
							var otherEventsKeys = otherEvents.keys();
							
							for (var j = 0; j < otherEventsKeys.size(); j++) {
								var otherEvent = {
									key: otherEventsKeys[j],
									value: otherEvents.get(otherEventsKeys[j])
								}
                                if ((!eventsXML.get(otherEvent.key).get('drawn')) && (otherEvent.value.get('BEGDA').value == eventBegDate.toString('yyyy-MM-dd'))) {
                                    eventsXML.get(otherEvent.key).set('drawn', true);
                                    var otherEventEmpId = otherEvent.value.get('PERNR').value;
                                    var otherEventType = this._getEventByAppId(otherEvent.value.get('APPID').value, json.EWS.o_li_incapp.yglui_str_incap2);
                                    var otherAppId = otherEvent.value.get('APPID').value;
                                    cell_id_content.insert(new Element('div').insert(otherAppId));
                                    var moreEventsCell = $(cell_id + '_moreEvents');
                                    if ((cell_id_content.childNodes.length > 2) && !(moreEventsCell.hasClassName('applicationTeamCalendar_cell_moreEvents')) ){
                                        moreEventsCell.addClassName('applicationTeamCalendar_cell_moreEvents');
                                    }
                                    if((cell_id_content.childNodes.length > 2) && global.liteVersion){
                                        moreEventsCell.addClassName('applicationTeamCalendar_cell_moreEventslite');
                                        moreEventsCell.update('+');
                                    }
                                    var tempEndDate = !Object.isEmpty(otherEvent.value.get('ENDDA')) ? otherEvent.value.get('ENDDA').value : otherEvent.value.get('BEGDA').value; 
                                    var eventEndDateSpecific = Date.parseExact(tempEndDate, 'yyyy-MM-dd');
                                    var otherDateForBalloon = eventBegDate.toString(this.dateFormat) + ((otherEventType!='ERR' && otherEventType!='HRZ' && otherEventType!='INF') ? (' - ' + eventEndDateSpecific.toString(this.dateFormat)) : ''); 
                                    eventStatus = this._getStatusOfEvent(otherEvent);
                                    //event details: commment
                                    var otherComment =  !Object.isEmpty(otherEvent.value.get('COMMENT')) ? prepareTextToShow(otherEvent.value.get('COMMENT').text) : "";
                                    //create the html content of the balloon
                                    var otherType = this._getEventSubtype(otherEvent);
                                    var otherHours = otherEvent.value.get('STDAZ') ? otherEvent.value.get('STDAZ').value : "-";
                                    var otherEventSent = this._getEvent(json, otherEvent.key);
                                    var otherEventData = this._getEventData(otherEvent);
                                    otherEventData.begDate = otherEventData.begDate.toString("yyyy-MM-ddTHH:mm:ssZ");
                                    otherEventData.endDate = otherEventData.endDate.toString("yyyy-MM-ddTHH:mm:ssZ");
                                    if(!global.liteVersion){
						                var otherEventLink = new Element('div', {
						                    'class': 'application_action_link',
						                    'title': otherType
						                }).insert(otherType.truncate(20));
						            }else{
						                var otherEventLink = new Element('button', {
						                    'class': 'application_action_link link stdLink',
						                    'title': otherType
						                }).insert(otherType.truncate(20));
						            }
						            if (!this.openedAsSubSubApp){
						                if(this.retroFuture)
                                            retroDates = this.retroFutureHash.get(otherEvent.value.get('APPID').value) ? this.retroFutureHash.get(otherEvent.value.get('APPID').value) : null; 
						                otherEventLink.observe('click', this._showEventDetails.bind(this, otherEvent.value.get('APPID').value, otherEvent.value.get('VIEW').value, otherEventSent, otherEventEmpId, otherEventData, retroDates));
						            }
						            balloon_content.insert(otherEventLink);
        						    
						            var otherEventInfo = new Element('p');
        						    
						            var otherEventDateSpan = new Element('span', {
						                'class': 'application_main_soft_text'
						            }).insert(global.getLabel('date') + ": ");
						            otherEventInfo.insert(otherEventDateSpan);
						            otherEventInfo.insert(otherDateForBalloon);
						            otherEventInfo.insert(new Element('br'));
        						    
						            if ((otherEventType != 'ERR') && (otherEventType != 'HRZ') && (otherEventType != 'INF')) {
						                var otherEventHoursSpan = new Element('span', {
						                    'class': 'application_main_soft_text'
						                }).insert(global.getLabel('nhours') + ": ");
						                otherEventInfo.insert(otherEventHoursSpan);
						                otherEventInfo.insert(otherHours);
						                otherEventInfo.insert(new Element('br'));
						            }
        						    
						            var otherEventStatusSpan = new Element('span', {
						                'class': 'application_main_soft_text'
						            }).insert(global.getLabel('status') + ": ");
						            otherEventInfo.insert(otherEventStatusSpan);
						            otherEventInfo.insert(eventStatus);
        						    
						            if ((otherEventType != 'ERR') && (otherEventType != 'HRZ') && (otherEventType != 'INF')) {
                                        //event details: commment
                                        otherEventInfo.insert(new Element('br'));
                                        if (!Object.isEmpty(otherComment)) {
                                            var otherEventCommentSpan = new Element('span', {
                                                'class': 'application_main_soft_text'
                                            }).insert(global.getLabel('comment') + ": ");
                                            otherEventInfo.insert(otherEventCommentSpan);
                                            otherEventInfo.insert(otherComment);
                                        }
                                        else
                                            otherEventInfo.insert(global.getLabel('no_comments'));
						            }
						            balloon_content.insert(otherEventInfo);
                                }
                            }
                            //declare the balloon
                            if (!Object.isEmpty(this.openedAsSubSubApp))
                            this.eventsBalloonInformation.set(cell_id, {
                                            events: balloon_content,
                                            footer: balloon_footer
                            });
                            else
                                this.eventsBalloonInformation.set(cell_id, { events: balloon_content });
                            cell_id_content.observe('click', this._drawNewEventBalloon.bind(this, eventBegDate.toString('yyyyMMdd'), eventEmpId));
                        }//end if it's manager
                    }//end if !visited
                }
            }

            //now we'll create or complete balloons for events which last more that a day
            var begDay, endDay, eventDays;
			for (var i = 0; i < eventsKeys.size(); i++) {
				var event = {
					key: eventsKeys[i],
					value: eventsXML.get(eventsKeys[i])
				}
                var eventEmpId = event.value.get('PERNR').value;
                this.isVeryLongEvent = false;
                //when the event lasts more than a day
                //calculate of the number of days between the begin date and the end date of the event
                begDay = Date.parseExact(event.value.get('BEGDA').value, 'yyyy-MM-dd').getOrdinalNumber();
                endDay = Object.isEmpty(event.value.get('ENDDA')) ? begDay : Date.parseExact(event.value.get('ENDDA').value, 'yyyy-MM-dd').getOrdinalNumber();
                eventDays = (endDay - begDay) + 1;
                //Control for very long events, to avoid infinite loop
                var begDateOf2Weeks = this.begDate.clone().add(-3).days();
                var endDateOf2Weeks = this.begDate.clone().add(9).days();
                var weekLength = this.currentWeek.length;
                var starts = Date.compare(begDateOf2Weeks, Date.parseExact(event.value.get('BEGDA').value, 'yyyy-MM-dd'));
                var ends;
                if (!Object.isEmpty(event.value.get('ENDDA')))
                    ends = Date.compare(Date.parseExact(event.value.get('ENDDA').value, 'yyyy-MM-dd'), endDateOf2Weeks);
                else
                    ends = Date.compare(Date.parseExact(event.value.get('BEGDA').value, 'yyyy-MM-dd'), endDateOf2Weeks);
                var virtualBegDate = Date.parseExact(event.value.get('BEGDA').value, 'yyyy-MM-dd');
                //if the event starts and ends in other weeks
                if ((eventDays > weekLength) && (starts == 1) && (ends == 1)) {
                    this.isVeryLongEvent = true;
                    eventDays = weekLength + 1;
                    virtualBegDate = this.begDate.clone().add(-4).days();
                }
                //if the event starts in this week, but finishes after
                if ((eventDays > weekLength) && (starts <= 0) && (ends == 1)) {
                    eventDays = weekLength + 1;
                }
                //if the event starts in another week, but ends in this one.
                if ((eventDays > weekLength) && (starts == 1) && (ends <= 0)) {
                    this.isVeryLongEvent = true;
                    eventDays = (endDay - begDateOf2Weeks.getOrdinalNumber()) + 2;
                    virtualBegDate = this.begDate.clone().add(-4).days();
                }
                if (eventDays > 1) {
                    var counter = 1;
                    for (var z = 1; z < eventDays; z++) {
                        var eventBegDate = Date.parseExact(event.value.get('BEGDA').value, 'yyyy-MM-dd');
                        var eventEndDate = Date.parseExact(event.value.get('ENDDA').value, 'yyyy-MM-dd');
                        var beg = this.isVeryLongEvent ? virtualBegDate : eventBegDate;
                        var begPlusZ = beg.clone().add(counter).days();
                        cell_id = pernr + "_" + begPlusZ.toString('yyyyMMdd');
                        var appId = event.value.get('APPID').value;
                        var allDay = event.value.get('ALLDF') ? (event.value.get('ALLDF').value == 'X' ? true : false) : false;
                        var comment = prepareTextToShow(event.value.get('COMMENT').text);
                        var type = this._getEventSubtype(event);
                        var hours = event.value.get('STDAZ') ? event.value.get('STDAZ').value : "-";
                        var eventStatus = this._getStatusOfEvent(event);
                        var eventEmpId = event.value.get('PERNR').value;
                        var currentCell = $(cell_id);
                        if (currentCell) {
                            var currentCellEvent;
                            var currentCellContent;
                            var currentCellMoreEvents;
                            //if there is already another event
                            currentCellEvent = $(cell_id + '_event');
                            if (currentCellEvent) {
                                currentCellEvent.insert(new Element('div').insert(appId));
                                currentCellMoreEvents = $(cell_id + '_moreEvents');
                                if ((currentCellEvent.childNodes.length > 2) && !(currentCellMoreEvents.hasClassName('applicationTeamCalendar_cell_moreEvents')) )
                                    currentCellMoreEvents.addClassName('applicationTeamCalendar_cell_moreEvents');
                                if((cell_id_content.childNodes.length > 2) && global.liteVersion){
                                    moreEventsCell.addClassName('applicationTeamCalendar_cell_moreEventslite');
                                    moreEventsCell.update('+');
                                }
                            }
                            else {
                                //if there is no event yet in that cell. Also we check that the cell exists
                                currentCellContent = $(cell_id + '_content');
                                if (currentCellContent) {
                                    currentCellContent.stopObserving();
                                    if(!global.liteVersion){
                                        currentCellEvent = new Element('div', {
                                            id: cell_id + '_event'
                                        }).insert(appId);
                                    }else{
                                        currentCellEvent = new Element('button', {
                                            id: cell_id + '_event',
                                            'class':'link'
                                        }).insert(appId);
                                    }
                                    if(!global.liteVersion){
                                        currentCellContent.insert(currentCellEvent);
                                    }else{
                                        currentCellContent.up().insert(currentCellEvent);                                       
                                    }
                                }
                            }
                            //color of the cell
                            if((this.eventCodes.get('ABS').get('appids').indexOf(appId) >= 0) && allDay && !global.liteVersion)
                                currentCell.addClassName('applicationTeamCalendar_cellAbsent');
                            else if((this.eventCodes.get('ABS').get('appids').indexOf(appId) >= 0) && allDay && global.liteVersion)
                                currentCell.addClassName('applicationTeamCalendar_AbsentLite');
                            else if ((this.eventCodes.get('ABS').get('appids').indexOf(appId) >= 0) && !allDay && !global.liteVersion)
                                currentCell.addClassName('applicationTeamCalendar_cellPartAbsent');
                            else if ((this.eventCodes.get('ABS').get('appids').indexOf(appId) >= 0) && !allDay && global.liteVersion)
                                currentCell.addClassName('applicationTeamCalendar_partAbsentLite');
                            //see details in balloons. Just for manager, o owned if employee
                            if(( this.employeeRestriction ) || (!this.employeeRestriction && pernr == this.pernr) ){
                                //just put the hand cursor in owned cells
                                currentCellEvent.addClassName('applicationTeamCalendar_handCursor');
                                //creation of balloon content
                                var dateForBalloon = eventBegDate.toString(this.dateFormat) + ' - '+ eventEndDate.toString(this.dateFormat);
                                var eventStatus = this._getStatusOfEvent(event);
                                //create the html content of the balloon
                                if (!this.eventsBalloonInformation.get(cell_id)) {
                                    //there is no balloon created yet in that cell
                                    var eventSent = this._getEvent(json, event.key);
                                    var eventData = this._getEventData(event);
                                    var balloon_content = new Element('div');
                                    eventData.begDate = eventData.begDate.toString("yyyy-MM-ddTHH:mm:ssZ");
                                    eventData.endDate = eventData.endDate.toString("yyyy-MM-ddTHH:mm:ssZ");
                                    
                                    if(!global.liteVersion){
						                var eventLink = new Element('div', {
						                    'class': 'application_action_link',
						                    'title': type
						                }).insert(type.truncate(20));
						            }else{
						                var eventLink = new Element('button', {
						                    'class': 'application_action_link link stdLink teamCalendar_balloon_event_links',
						                    'title': type
						                }).insert(type.truncate(20));
						            }
                                    if (!this.openedAsSubSubApp && this.createEvents){
                                        if(this.retroFuture)
                                            retroDates = this.retroFutureHash.get(event.value.get('APPID').value) ? this.retroFutureHash.get(event.value.get('APPID').value) : null; 
						                eventLink.observe('click', this._showEventDetails.bind(this, event.value.get('APPID').value, event.value.get('VIEW').value, eventSent, eventEmpId, eventData, retroDates));
						                balloon_content.insert(eventLink);
						            }
						            
						            var eventInfo = new Element('p');
        						    
						            var eventDateSpan = new Element('span', {
						                'class': 'application_main_soft_text'
						            }).insert(global.getLabel('date') + ": ");
						            eventInfo.insert(eventDateSpan);
						            eventInfo.insert(dateForBalloon);
						            eventInfo.insert(new Element('br'));
        						    
						            if ((eventType != 'ERR') && (eventType != 'HRZ') && (eventType != 'INF')) {
						                var eventHoursSpan = new Element('span', {
						                    'class': 'application_main_soft_text'
						                }).insert(global.getLabel('nhours') + ": ");
						                eventInfo.insert(eventHoursSpan);
						                eventInfo.insert(hours);
						                eventInfo.insert(new Element('br'));
						            }
        						    
						            var eventStatusSpan = new Element('span', {
						                'class': 'application_main_soft_text'
						            }).insert(global.getLabel('status') + ": ");
						            eventInfo.insert(eventStatusSpan);
						            eventInfo.insert(eventStatus);
        						    
						            if ((eventType != 'ERR') && (eventType != 'HRZ') && (eventType != 'INF')) {
                                        //event details: commment
                                        eventInfo.insert(new Element('br'));
                                        if (!Object.isEmpty(comment)) {
                                            var eventCommentSpan = new Element('span', {
                                                'class': 'application_main_soft_text'
                                            }).insert(global.getLabel('comment') + ": ");
                                            eventInfo.insert(eventCommentSpan);
                                            eventInfo.insert(comment);
                                        }
                                        else
                                            eventInfo.insert(global.getLabel('no_comments'));
						            }
						            balloon_content.insert(eventInfo);
						            
                                    //declare the balloon
                                    this.eventsBalloonInformation.set(cell_id, {
                                                    events: balloon_content,
                                                    footer: balloon_footer
                                    });
                                    currentCellEvent.observe('click', this._drawNewEventBalloon.bind(this, begPlusZ.toString('yyyyMMdd'), eventEmpId));
                                }
                                else{
                                    //there is already a balloon with other events information. 
                                    //We'll append the current event info to the bottom
                                    var balloon_content = this.eventsBalloonInformation.get(cell_id).events;
                                    var eventSent = this._getEvent(json, event.key);
                                    var eventData = this._getEventData(event);
                                    eventData.begDate = eventData.begDate.toString("yyyy-MM-ddTHH:mm:ssZ");
                                    eventData.endDate = eventData.endDate.toString("yyyy-MM-ddTHH:mm:ssZ");
                                    
                                    if(!global.liteVersion){
						                var eventLink = new Element('div', {
						                    'class': 'application_action_link'
						                }).insert(type);
						            }else{
						                var eventLink = new Element('button', {
						                    'class': 'application_action_link link stdLink teamCalendar_balloon_event_links'
						                }).insert(type);
						            }
                                    if (!this.openedAsSubSubApp && this.createEvents){
                                        if(this.retroFuture)
                                            retroDates = this.retroFutureHash.get(event.value.get('APPID').value) ? this.retroFutureHash.get(event.value.get('APPID').value) : null; 
						                eventLink.observe('click', this._showEventDetails.bind(this, event.value.get('APPID').value, event.value.get('VIEW').value, eventSent, eventEmpId, eventData, retroDates));
						                balloon_content.insert(eventLink);
						            }
                                    
						            var eventInfo = new Element('p');
        						    
						            var eventDateSpan = new Element('span', {
						                'class': 'application_main_soft_text'
						            }).insert(global.getLabel('date') + ": ");
						            eventInfo.insert(eventDateSpan);
						            eventInfo.insert(dateForBalloon);
						            eventInfo.insert(new Element('br'));
        						    
						            if ((eventType != 'ERR') && (eventType != 'HRZ') && (eventType != 'INF')) {
						                var eventHoursSpan = new Element('span', {
						                    'class': 'application_main_soft_text'
						                }).insert(global.getLabel('nhours') + ": ");
						                eventInfo.insert(eventHoursSpan);
						                eventInfo.insert(hours);
						                eventInfo.insert(new Element('br'));
						            }
        						    
						            var eventStatusSpan = new Element('span', {
						                'class': 'application_main_soft_text'
						            }).insert(global.getLabel('status') + ": ");
						            eventInfo.insert(eventStatusSpan);
						            eventInfo.insert(eventStatus);
        						    
						            if ((eventType != 'ERR') && (eventType != 'HRZ') && (eventType != 'INF')) {
                                        //event details: commment
                                        eventInfo.insert(new Element('br'));
                                        if (!Object.isEmpty(comment)) {
                                            var eventCommentSpan = new Element('span', {
                                                'class': 'application_main_soft_text'
                                            }).insert(global.getLabel('comment') + ": ");
                                            eventInfo.insert(eventCommentSpan);
                                            eventInfo.insert(comment);
                                        }
                                        else
                                            eventInfo.insert(global.getLabel('no_comments'));
						            }
						            balloon_content.insert(eventInfo);

                                    //declare the balloon
                                    this.eventsBalloonInformation.set(cell_id, {
                                                    events: balloon_content,
                                                    footer: balloon_footer
                                    });
                                    currentCellEvent.stopObserving();
                                    currentCellEvent.observe('click', this._drawNewEventBalloon.bind(this, begPlusZ.toString('yyyyMMdd'), eventEmpId));
                                }
                            }//end if
                        }//end if
                    counter ++;
                    }//end for (var z=1; z<eventDays; z++)
                }//end if
            }
        }//enf if wsXMLLength> 0
        if(cell_balloon_id){
            this.repositionBalloon = true;
            content_balloon.insert(this.eventsBalloonInformation.get(cell_balloon_id).events);
            if(this.createEvents){
                content_balloon.insert(this.eventsBalloonInformation.get(cell_balloon_id).footer);
            }
            balloon.showOptions($H({
                domId: cell_balloon_id + "_event",
                content: content_balloon
            }));
            if(this.retroFuture){
                var xmlCalMenu = "<EWS>" +
                                    "<SERVICE>" + this.RFballoonService + "</SERVICE>" +
                                    "<OBJECT TYPE='P'>" + pernr + "</OBJECT>" +
                                    "<PARAM>" +
                                    "<CONTAINER>CAL_MGM</CONTAINER>" +
                                    "<MENU_TYPE>N</MENU_TYPE>" +
                                    "<I_DATE>" + begda + "</I_DATE>" + 
                                    "</PARAM>" +
                                "</EWS>";  
            }else{
                var xmlCalMenu = "<EWS>" +
                                     "<SERVICE>" + this.balloonService + "</SERVICE>" +
                                     "<OBJECT TYPE='P'>" + ID + "</OBJECT>" +
                                     "<PARAM>" +
                                          "<CONTAINER>CAL_MGM</CONTAINER>" +
                                          "<MENU_TYPE>N</MENU_TYPE>" +
                                     "</PARAM>" +
                                 "</EWS>";
            }
	        //Accesing the balloon to add the click event on it. Out of the application DOM scope
	        //so $() is used instead of this.virtualHtml.down()
            if (!this.openedAsSubSubApp && this.createEvents)
            $('applicationTeamCalendar_addNewEvent').observe('click', this._callToGetCalMenu.bind(this, xmlCalMenu, cell_balloon_id + '_content')); 
        }else if(!Object.isEmpty(this.repositionBalloon)){
            if(this.repositionBalloon){
                balloon._reposition();
            }
        }
             
    },
    /**
     *@param event Hash with event's information
     *@description Returns the event subtype
     */
    _getEventSubtype: function(event) {
        if (event.value.get('AWART'))
            return event.value.get('AWART').text;
        else if (event.value.get('SUBTY'))
            return event.value.get('SUBTY').text;
        else if (event.value.get('VTART'))
            return event.value.get('VTART').text;
        else if (event.value.get('ZTART')) {
            if (event.value.get("ANZHL"))
                return ("#" + event.value.get('ZTART').text + ": " + event.value.get("ANZHL").value);
            else 
                return event.value.get('ZTART').text;
        }
        else if (event.value.get('SATZA'))
            return global.getLabel("timeInfo");
        else if (event.value.get('LDATE')) {
            var begDate = event.value.get("BEGDA").value;
            return this.timeErrorMessages.get(begDate);
        }
        else     
            return "---";
    },
    /**
     *@param date Date whose week we want to set
     *@param redefineWeek Says if it is neccesary to recalculate the week
     *@description Parses the xml and redraws the calendar table: top labels and employees rows
     */
	_changeWeek: function(date, redefineWeek) {
	    if (Object.isEmpty(redefineWeek))
	        redefineWeek = true;
        this.currentWeek.clear();
        //draw the top tabel (date and texts): Mo 01, Tu 02...
        // HEADER HTML
        // Beg date - end date TodayButton DatePicker
        // If first day of the week is Sunday...
        if (redefineWeek) {
		    var week = 0;
		    if (date.getWeek() > 52)
			    week = date.getWeek() - 52;
		    else
			    week = date.getWeek();
            if (global.calendarsStartDay < 1)
		        this.begDate = date.clone().moveToFirstDayOfMonth().setWeek(week).moveToDayOfWeek(0, -1);
            // If not...
            else {
                // If first day of the week is not Sunday or Monday...
                if (global.calendarsStartDay > 1)
			        this.begDate = date.clone().moveToFirstDayOfMonth().setWeek(week).moveToDayOfWeek(global.calendarsStartDay);
                // If first day of the week is Monday...
                else
			        this.begDate = date.clone().moveToFirstDayOfMonth().setWeek(week);
            }
            this.endDate = this.begDate.clone().addDays(6);
            if(! date.between(this.begDate, this.endDate)) {
                this.begDate.addDays(-7);
                this.endDate.addDays(-7);
            }
        }
        else {
            this.begDate = date.clone();
            this.endDate = this.begDate.clone().addDays(6);
        }
        this.begDateLabel = this.begDate.toString('ddd').toLowerCase();
        this.endDateLabel = this.endDate.toString('ddd').toLowerCase();
        this._getTopTableLabels(this.begDate);
        this.teamCalendarCurrentWeek.update(global.getLabel(this.begDateLabel) + " " + this.begDate.toString(this.dateFormat) + " - " + global.getLabel(this.endDateLabel) + " " + this.endDate.toString(this.dateFormat));
        this._drawTopOfTable();
        //Check if it's a manager or not. Depending on that, the functionality is slightly different
        if (this.employeeRestriction) {
            //if manager
            var length = this.selectedEmployees.keys().length;
            if (length > 0) {
                for(var i = 0; i < length; i++) {
                    var id = this.selectedEmployees.keys()[i];
                    var employee = this.selectedEmployees.get(id);
                    var oType = employee.otype;
                    //draw the empty calendar
                    this._drawCalendarRow(id, employee.name, employee.color);
                    //insert the events and ws
                    this._callToGetEvents(id, oType, "", "", this.managerService);
                }
            }
        }
        else {
            //if employee
            var length = this.myTeam.keys().length;
            if (length > 0) {
                for(var i = 0; i < length; i++){
                    var id = this.myTeam.keys()[i];
                    if (this.myTeam.get(id).get("selected")) {
                        //draw the empty calendar
                        this._drawCalendarRow(id, this.myTeam.get(id).get("name"), this.myTeam.get(id).get("color"));
                        //insert the events and ws
                        this._callToGetEvents(id, this.myTeam.get(id).get("otype"), "", "", this.employeeService);
                    }
                }
            }
        }
	},
    /**
     *@description When the user clicks on today button, if we are not viewing "today" week, load it
     */
    _clickOnToday: function (){
        var beg, end;
        if (global.calendarsStartDay < 1)
            beg = this.today.clone().moveToFirstDayOfMonth().setWeek(this.today.getWeek()).moveToDayOfWeek(0, -1);
        // If not...
        else {
            // If first day of the week is not Sunday or Monday...
            if (global.calendarsStartDay > 1)
                beg = this.today.clone().moveToFirstDayOfMonth().setWeek(this.today.getWeek()).moveToDayOfWeek(global.calendarsStartDay);
            // If first day of the week is Monday...
            else
                beg = this.today.clone().moveToFirstDayOfMonth().setWeek(this.today.getWeek());
        }
        end = beg.clone().addDays(6);
        //if today is not within the current week
        if(! this.begDate.between(beg,end)){
            this.menuBalloonOpened = false;
            this._calLabels(this.today);
            this.datePicker.reloadDefaultDate();
        }
    },
    /**
     *@description Delete the calendar for old date and calls a method to redraw what its needed
     */
	_changeWeekHandler: function() {
        //get the new selected date
        var date = this.datePicker.actualDate;
        //reload teamCalendar (the table with top and employees rows)
        this._calLabels(date);
	},
    /**
     *@param args Selected employee's information
     *@description When an employee is selected, we draw his/her calendar
     */
    onEmployeeSelected: function(args) {
        var selectedEmployees = this.getSelectedEmployees().toArray();
        if ((selectedEmployees.length > 0) && (!this.teamCalendarBodyTable.visible())) {
            //this.teamCalendarOuterDiv.show();
            this.teamCalendarBodyTable.show();
            this.teamCalendarMessageDiv.hide();
        }
        var employeeId = args.id;
        var employeeName = args.name;
        var employeeColor = global.getColor(employeeId);        
        var oType = args.oType;
        //check that the calendar is not already drawn
        if(! $(employeeId + '_teamCalendar')) {
            if (this.employeeRestriction){
                this.selectedEmployees.set(employeeId, { 'name': employeeName, 'color': employeeColor, 'otype': oType });
            }else{
                this.myTeam.get(employeeId).set('selected', true);
                this.myTeam.get(employeeId).set('color', employeeColor);
            }
            //draw empty calendar
            this._drawCalendarRow(employeeId, employeeName, employeeColor);
            this._callToGetEvents(employeeId, oType, "", "", this.employeeRestriction ? this.managerService : this.employeeService);
        }
    },
    /**
     *@param args Unselected employee's information
     *@description When an employee is unselected, we hide his/her calendar
     */
    onEmployeeUnselected: function(args) {
	    var employeeId = args.id;
        //if the employee exists (has a calendar drawn)
        var row = $(employeeId + '_teamCalendar');
        if (row){
            var selectedEmployees;
            //remove his calendar from the team calendar
            row.remove();
            //if manager:  remove the empId from this.selectedEmployees
            if (this.employeeRestriction) {
                this.selectedEmployees.unset(employeeId);
                selectedEmployees = this.getSelectedEmployees().toArray().length;
            }
            else {
                this.myTeam.get(employeeId).set('selected', false);
                var keys = this.myTeam.keys(); 
                var length = keys.length;
                var selectedEmployees = 0;
                for (var i = 0; i < length; i++) {
                    if (this.myTeam.get(keys[i]).get('selected'))
                        selectedEmployees++;
                }
            }
            if (selectedEmployees == 0) {
                //this.teamCalendarOuterDiv.hide();
                this.teamCalendarBodyTable.hide();
                this.teamCalendarMessageDiv.show();
            }
        }
    },
    /**
     *@param workschedules Workschedule of the week
     *@param a Day within the week
     *@param pernr EmployeeId
     *@param begEndDate Date of the day clicked
     *@description Calls sap to get details or retrieve from hash (class attribute)
     */
    _callToGetDWSDetails: function(pernr, begEndDate){
        var date = Date.parseExact(begEndDate, 'yyyyMMdd').toString('yyyy-MM-dd');
        //call GET_DWS_DTAILS if the user wants to see ws details
        var xmlGetDWS = "<EWS>" +
                        "<SERVICE>GET_DWS_DTAILS</SERVICE>" +
                        "<PARAM>" +
                            "<o_begda>" + date + "</o_begda>" +
                            "<o_endda>" + date + "</o_endda>" +
                            "<o_pernr>" + pernr + "</o_pernr>" +
                        "</PARAM>" +
                        "</EWS>";
        this.makeAJAXrequest($H({xml:xmlGetDWS, successMethod:'_getDWSDetails'}));
    },
    /**
     *@param json JSON from GET_DWS_DTAILS service
     *@description Retrieves the details of the ws and call a method to create a balloon with this information
     */
    _getDWSDetails: function(json) {
        //get content
        var codeWS = json.EWS.o_tprog;
        var contentWS = json.EWS.o_dws_details['@ttext'];
        if (codeWS == "PHOL")
            contentWS = global.getLabel('publicholiday');
        var contentPlannedWH = json.EWS.o_dws_details['@sollz'];
        var contentPlannedWT_begin = json.EWS.o_dws_details['@sobeg'];
        var contentPlannedWT_end = json.EWS.o_dws_details['@soend'];
        var contentPlannedWT = contentPlannedWT_begin + " - " + contentPlannedWT_end;
        var hashOfWscTypes = new Hash();
        hashOfWscTypes.set(0, {wsFrom: json.EWS.o_dws_details['@btbeg'], wsText: json.EWS.labels.item[0]['@value'], wsTo: json.EWS.o_dws_details['@btend']});
        hashOfWscTypes.set(1, {wsFrom: json.EWS.o_dws_details['@etbeg'], wsText: json.EWS.labels.item[1]['@value'], wsTo: json.EWS.o_dws_details['@etend']});
        hashOfWscTypes.set(2, {wsFrom: json.EWS.o_dws_details['@f1beg'], wsText: json.EWS.labels.item[2]['@value'], wsTo: json.EWS.o_dws_details['@f1end']});
        hashOfWscTypes.set(3, {wsFrom: json.EWS.o_dws_details['@f2beg'], wsText: json.EWS.labels.item[3]['@value'], wsTo: json.EWS.o_dws_details['@f2end']});
        hashOfWscTypes.set(4, {wsFrom: json.EWS.o_dws_details['@k1beg'], wsText: json.EWS.labels.item[4]['@value'], wsTo: json.EWS.o_dws_details['@k1end']});
        hashOfWscTypes.set(5, {wsFrom: json.EWS.o_dws_details['@k2beg'], wsText: json.EWS.labels.item[5]['@value'], wsTo: json.EWS.o_dws_details['@k2end']});
        hashOfWscTypes.set(6, {wsFrom: json.EWS.o_dws_details['@k3beg'], wsText: json.EWS.labels.item[6]['@value'], wsTo: json.EWS.o_dws_details['@k3end']});
        hashOfWscTypes.set(7, {wsFrom: json.EWS.o_dws_details['@pabeg'], wsText: json.EWS.labels.item[7]['@value'], wsTo: json.EWS.o_dws_details['@paend']});
        hashOfWscTypes.set(8, {wsFrom: json.EWS.o_dws_details['@v1beg'], wsText: json.EWS.labels.item[8]['@value'], wsTo: json.EWS.o_dws_details['@v1end']});
        hashOfWscTypes.set(9, {wsFrom: json.EWS.o_dws_details['@v2beg'], wsText: json.EWS.labels.item[9]['@value'], wsTo: json.EWS.o_dws_details['@v2end']});
        this.wsInformation.set(codeWS, {
                            contentWS: contentWS,
                            contentPlannedWH: contentPlannedWH,
                            contentPlannedWT: contentPlannedWT,
                            hashOfWscTypes: hashOfWscTypes
                            });
        //div id: to know where the user clicked
        var employeeID = json.EWS.o_pernr;
        var date = Date.parseExact(json.EWS.o_begda, 'yyyy-MM-dd').toString('yyyyMMdd');
        this._drawDWSBalloon(employeeID, date, codeWS);
    },
    /**
     *@param employeeId Id of the employee whose calendar was clicked
     *@param date Date of the cell which was clicked
     *@param codeWS Code of the worschedule
     *@description Creates a balloon with information about the ws
     */    
    _drawDWSBalloon: function(employeeId, date, codeWS){
        var labWS = global.getLabel('work_schedule');
        var labPlannedWH = global.getLabel('planned_wh');
        var labPlannedWS = global.getLabel('planned_wt');
        var labFrom = global.getLabel("from");
        var labTo = global.getLabel("to");
        var labType = global.getLabel('type');
        var balloon_content = new Element('div');
        var balloon_header = new Element('p');
        balloon_header.insert(new Element('span', {
            'class': 'application_main_soft_text'
        })).insert(labWS + ": ");
        balloon_header.insert(this.wsInformation.get(codeWS).contentWS);
        balloon_header.insert(new Element('br'));
        balloon_header.insert(new Element('span', {
            'class': 'application_main_soft_text'
        })).insert(labPlannedWH + ": ");
        balloon_header.insert(this.wsInformation.get(codeWS).contentPlannedWH);
        balloon_header.insert(new Element('br'));
        balloon_header.insert(new Element('span', {
            'class': 'application_main_soft_text'
        })).insert(labPlannedWS + ":");
        balloon_header.insert(new Element('br'));
        balloon_header.insert(this.wsInformation.get(codeWS).contentPlannedWT);
        balloon_content.insert(balloon_header);
        
        //If the planned working hours are not 0.0
        var workSchedule = this.wsInformation.get(codeWS);
        if (workSchedule.contentPlannedWH != "0.0"){
            //TABLE
            var table = new Element('table', {
                'cellspacing': '10'
            });
            var tbody = new Element('tbody', {
                id: 'tbody'
            });
            //first row  FROM-TO-TYPE
            var tr1 = new Element('tr');
            var td_from = new Element('td').insert(new Element('span', {
                'class': 'application_main_soft_text'
            }).insert(new Element('u').insert(labFrom)));
            tr1.insert(td_from);
            var td_to = new Element('td').insert(new Element('span', {
                'class': 'application_main_soft_text'
            }).insert(new Element('u').insert(labTo)));
            tr1.insert(td_to);
            var td_type = new Element('td').insert(new Element('span', {
                'class': 'application_main_soft_text'
            }).insert(new Element('u').insert(labType)));
            tr1.insert(td_type);
            tbody.insert(tr1);
            //Remaining rows: information about wsc types
            for (var i = 0; i < workSchedule.hashOfWscTypes.keys().length; i++) {
                var value_from = workSchedule.hashOfWscTypes.get(i).wsFrom;
                var value_to = workSchedule.hashOfWscTypes.get(i).wsTo;
                if (!(value_from == "  :  :  " || value_from == "00:00:00" || value_to == "  :  :  " || value_to == "00:00:00")) {
                    var tr_loop = new Element('tr');
                    var td_from_loop = new Element('td').insert(value_from);
                    tr_loop.insert(td_from_loop);
                    var td_to_loop = new Element('td').insert(value_to);
                    tr_loop.insert(td_to_loop);
                    var td_type_loop = new Element('td').insert(this.wsInformation.get(codeWS).hashOfWscTypes.get(i).wsText);
                    tr_loop.insert(td_type_loop);
                    tbody.insert(tr_loop);
                }
            }
            table.insert(tbody);
            balloon_content.insert(table);
        }
        //create the balloon
        var div_id = employeeId + "_" + date + "_ws_teamCalendar";
        balloon.showOptions($H({domId: div_id, content: balloon_content}));
    },
    /**
     *@param json JSON from GET_MYTEAM service
     *@description Retrieves the team members (name and Id), and creates a drop down list with them
     */
    _asEmp_insertMyTeam: function(json) {
		var employees = null;
		var populations = objectToArray(json.EWS.o_population.yglui_str_population);
		// Only EMP population
		if (populations.length == 1)
            employees = objectToArray(json.EWS.o_population.yglui_str_population.population.yglui_str_popul_obj);
        // More than one population
        else {
            for (var i = 0; (i < populations.length) && Object.isEmpty(employees); i++) {
                if (populations[i]['@population_id'] == 'EMP')
                    employees = objectToArray(populations[i].population.yglui_str_popul_obj);
            }
        }
        //keeping ids and name as a hash for each employee
        var empHash = new Hash();
        //Previous selected employee (logged one)
        var idSelected = '---';
        if (this.myTeam.keys().length > 0)
            idSelected = this.myTeam.keys()[0];
        for (var i = 0; i < employees.length ; i++){
            var color;
            //random color
            var rand_no = Math.random();
            rand_no = rand_no * 16;
            color = Math.ceil(rand_no);
            // Previous selected employee
            if (employees[i]['@objid'] == idSelected)
                color = this.myTeam.get(this.myTeam.keys()[0]).get('color');
            //creation of the hash of employees: [id{name, color, selected}]; Selectes = true when his/her calendar is shown
            var selected = false;
            // Previous selected employee
            if ((idSelected != '---') && ((idSelected == employees[i]['@objid'])))
                selected = true;
            empHash.set(employees[i]['@objid'], $H({ 
                name: employees[i]['@name'],
                color: color,
                selected: selected,
                otype: employees[i]['@otype']
            }));
        }
        //keep all team members in this.myTeam
        this.myTeam = empHash;
        //insert the drop down list in the html
        var form = new Element('form', {
            name: 'formEmployees',
            method: 'post'
        });
        var select = new Element('select', {
            id: 'applicationTeamCalendar_myTeamDropList',
            name: 'year'
        }).insert(new Element('option', {
            value: 'none_selected'
        }).insert(global.getLabel("selectEmp")));
        form.insert(select);
 
	    //insert the new values in the list
	    for(var j = 0; j < (this.myTeam).keys().length; j++)
            select.insert(new Element('option', {
                value: (this.myTeam).keys()[j]
            }).insert(this.myTeam.get((this.myTeam).keys()[j]).get("name")));

        this.teamCalendarDropList.update(form);

        var selectAllLink = new Element('span', {
            id: 'applicationTeamCalendar_linkSelectAll',
            'class': 'applicationTeamCalendar_handCursor applicationTeamCalendar_alignText application_action_link'
        }).insert(this.selectAllLabel);
        this.teamCalendarDropList.insert(selectAllLink);
        this.teamCalendarDropList.insert(new Element('br'));
        this.teamCalendarDropList.insert(new Element('br'));
	    
        //when clicking linkSelectAll we'll call employeeSelectedHandler for everybody in the team. If all the employees are already selected we'll unselect all.
        selectAllLink.observe('click', function() {
            var keys = this.myTeam.keys();
            var num_selected = 0;
            for (var i = 0; i < keys.length; i++)
                num_selected += this.myTeam.get(this.myTeam.keys()[i]).get('selected') == true ? 1 : 0;
            //If not all selected, we select all
            if(num_selected < keys.length)
                for (var i = 0; i < keys.length; i++) {
                    var employee = this.myTeam.get(keys[i]);
                    this.onEmployeeSelected({ id: keys[i], name: employee.get('name'), color: employee.get('color'), oType: employee.get('otype') });
                }
            //If all selected then we unselect all but keeping the logged user
            else
                for( var i = 0; i < keys.length; i++)
                    if( keys[i] != this.pernr)
                        this.onEmployeeUnselected({id: keys[i]});
                
        }.bind(this));
        //observe if another employee is selected
        select.observe('change', function(){
            var emp = select.options[select.selectedIndex].value;
            if (emp != 'none_selected'){
                //mark "select an employee" as selected
                select[select.options[select.selectedIndex].index].selected = false;
                select[0].selected = true;
                var employee = this.myTeam.get(emp);
                this.onEmployeeSelected({ id: emp, name: employee.get('name'), color: employee.get('color'), oType: employee.get('otype') });
            }
        }.bind(this));
    },
    /**
     *@param xmlCalMenu Xml_in of GET_CAL_MENU service
     *@description Makes an AJAX request with the xml provided
     */
    _callToGetCalMenu: function(xmlCalMenu, balloonId){
        this.makeAJAXrequest($H({xml: xmlCalMenu, successMethod: '_getCalMenu', ajaxID: balloonId}));
    },
    /**
     *@param json JSON from GET_CON_ACTIO service
     *@description Retrieves the menu option for empty cells and creates a balloon with that menu
     */
    _getCalMenu: function(json, ID){
        if (!this.menuBalloonOpened)
            this.menuBalloonOpened = true;
	    var employeeID = ID.split('_')[0];
	    var date =  ID.split('_')[1];
	    var payroll_run = json.EWS.o_payroll ? true: false;
        //div id
        var div_id = employeeID + "_" + date;
        var employeeName = this.getEmployee(employeeID).name;
        var parsedDate = Date.parseExact(date, 'yyyyMMdd').toString('yyyy-MM-dd');
        //get menu items
        var menuItems = Object.isEmpty(json.EWS.o_actions) ? [] : objectToArray(json.EWS.o_actions.yglui_vie_tty_ac);
        var actionsList = new Element("ul", {
            "class": "applicationTeamCalendar_optionList"
        });
        var retroDates;
        if (!Object.isEmpty(json.EWS.o_actions)){
            for (var i = 0; i < menuItems.length; i++) {
                var id = menuItems[i]['@actio'];
                var appId;            
                if(id.include("ABSENCE"))
                    appId = "ABS";
                else if(id.include("ATTENDANCE"))
                    appId = "ATT";
                else if(id.include("AVAILABILITY"))
                    appId = "AVL";
                else if(id.include("OVERTIME"))
                    appId = "OVT";
                else if(id.include("SUBSTITUTION"))
                    appId = "SUB";
                else if(id.include("TIME_INFORMATION"))
                    appId = "TIM_INF";
                else
                    appId = "---";
                var event = this._getEmptyEvent(employeeID, employeeName, appId, parsedDate);
                //create the balloon content
                var label = menuItems[i]['@actiot'];
                var pieces = label.split("((L))");
                var view = menuItems[i]['@views'];
                
                var listElement = new Element("li");
                listElement.insert(pieces[0]);
                
                if(this.retroFuture)
                    retroDates = this.retroFutureHash.get(appId) ? this.retroFutureHash.get(appId) : null;
                if (!global.liteVersion) {
                    var link = new Element('span', {
                        'class': 'application_action_link'
                    }).insert(pieces[1]);
                    if (!this.openedAsSubSubApp)
                        link.observe('click', this._showEventDetails.bind(this, appId, view, event, "", "", retroDates));
                    listElement.insert(link);
                }
                else {
                    var button = new Element('button', {
                        'class': 'application_action_link link stdLink calendar_balloon_links'
                    }).insert(pieces[1]);
                    if (!this.openedAsSubSubApp)
                        button.observe('click', this._showEventDetails.bind(this, appId, view, event, "", "", retroDates));
                    listElement.insert(button);
                }
                listElement.insert(pieces[2]);
			    actionsList.insert(listElement);
		    }
		    if(payroll_run)
                actionsList.insert(new Element("span").insert('<BR>' + global.getLabel('actionHide') + (' ') + global.getLabel('duePayroll')));
            if(!Object.isEmpty(json.EWS.o_msg)){
                var label;
                switch(json.EWS.o_msg){
                    case '3': label = label = global.getLabel('DATE_MSG_RETRO_EARLY') + (' ') + global.getLabel('actionHide');
                        break;
                    case '4': label = global.getLabel('DATE_MSG_FUTURE_LATER') + (' ') + global.getLabel('actionHide');
                        break;
                }
                actionsList.insert(new Element("span", {'class': 'test_text'}).insert('<BR>' + label));
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
                actionsList.insert(new Element("span", {'class': 'test_text'}).insert('<BR>' + label));
        }
        else
            actionsList = new Element("span", {'class': 'test_text'}).insert(global.getLabel('NO_ACTION'));
        //instantiate the balloon
        balloon.showOptions($H({domId: div_id + '_content', content: actionsList}));
    },
    /**
    * @param begEndDate Begin/end date for GET_CAL_MENU service
    * @param pernr Employee's personal number for GET_CAL_MENU service
    * @description Creates a balloon with information for creating a new event
    */
    _drawNewEventBalloon: function(begEndDate, pernr) {
        var id = pernr + "_" + begEndDate;
        var content = new Element('div');
        var balloonInfo = this.eventsBalloonInformation.get(id);
        var begda = begEndDate.substring(0,4) + "-" + begEndDate.substring(4,6) + "-" + begEndDate.substring(6,8);
        if ((!Object.isEmpty(balloonInfo.events) && (balloonInfo.events.innerHTML == "")) || (!Object.isEmpty(balloonInfo.footer) && (balloonInfo.footer.innerHTML == "")))
            this._refreshButtonClicked("special",id,content,pernr);                                  
        else {
            content.insert(this.eventsBalloonInformation.get(id).events);
            if(this.createEvents)
                content.insert(this.eventsBalloonInformation.get(id).footer);
            balloon.showOptions($H({
                domId: id + "_event",
                content: content
            }));
            if(this.retroFuture){
                var xmlCalMenu = "<EWS>" +
                                    "<SERVICE>" + this.RFballoonService + "</SERVICE>" +
                                    "<OBJECT TYPE='P'>" + pernr + "</OBJECT>" +
                                    "<PARAM>" +
                                    "<CONTAINER>CAL_MGM</CONTAINER>" +
                                    "<MENU_TYPE>N</MENU_TYPE>" +
                                    "<I_DATE>" + begda + "</I_DATE>" + 
                                    "</PARAM>" +
                                "</EWS>";  
            }else{
                var xmlCalMenu = "<EWS>" +
                                     "<SERVICE>" + this.balloonService + "</SERVICE>" +
                                     "<OBJECT TYPE='P'>" + pernr + "</OBJECT>" +
                                     "<PARAM>" +
                                          "<CONTAINER>CAL_MGM</CONTAINER>" +
                                          "<MENU_TYPE>N</MENU_TYPE>" +
                                     "</PARAM>" +
                                 "</EWS>";
            }
		    //Accesing the balloon to add the click event on it. Out of the application DOM scope
		    //so $() is used instead of this.virtualHtml.down()
            if (!this.openedAsSubSubApp && this.createEvents)
                $('applicationTeamCalendar_addNewEvent').observe('click', this._callToGetCalMenu.bind(this, xmlCalMenu, id + '_content'));
        }
    },
      
    /**
    * @description Toggles the filter form
    */
    _toggleFilterOptions: function() {
        this.filterElement.toggle();
    },
    /**
    * @description Does a refresh
    * @param mode: if it's set to "special", we will open a balloon for a day cell   
    * @param cell_id: the cell id
    * @param content: where we put the information for the balloon
    * @param pernr: the id of the employee when mode is "special"
    */
    _refreshButtonClicked: function(mode,cell_id,content,pernr) {
        document.fire('EWS:refreshCalendars');
        var selectedEmployees = this.employeeRestriction ? this.getSelectedEmployees() : this.myTeam;
        var keys = selectedEmployees.keys();
        var length = keys.length;
        for (var i = 0; i < length; i++) {
            var employee = selectedEmployees.get(keys[i]);
            var show = true;
            if (!this.employeeRestriction) {
                var selected = !Object.isEmpty(employee.selected) ? employee.selected : employee.get('selected');
                if (!selected)
                    show = false;
            }
            if (show) {
                var id = keys[i];
                var name = !Object.isEmpty(employee.name) ? employee.name : employee.get('name');
                var color = !Object.isEmpty(employee.color) ? employee.color : employee.get('color');                
                var oType = !Object.isEmpty(employee.oType) ? employee.oType : employee.get('oType');
                if ($(id + '_teamCalendar') != null) 
                    $(id + '_teamCalendar').remove();
                this._drawCalendarRow(id, name, color);
                if( (Object.isEmpty(mode)) || (id != pernr) )
                    this._callToGetEvents(id, oType, "", "", this.employeeRestriction ? this.managerService : this.employeeService);
                else if (mode == "special")
                    this._callToGetEvents(id, oType,cell_id,content, this.employeeRestriction ? this.managerService : this.employeeService);         
            }
        }
    },
    /**
     *@description Returns the event type by its appId
     *@param {String} appId The application id
     *@param {Array} incapp Structure that contents the type event and its appId
     *@returns {String} The event type
     */
    _getEventByAppId: function(appId, incapp){
        var result;
		var found = false;
		for (var i = 0; i < incapp.size() && found == false; i++) {
			var item = incapp[i];
            if (item['@appid'] == appId) {
                result = item["@event"];
				found = true;
            }
        }
        return result;
    },
    /**
     *@param json JSON from GET_EVENTS
     *@description Once the calendar is drawn, complete it with the events and workschedule (after an error)
     */
    _insertEventsError: function(json, ID) {
        this._errorMethod(json);
        this._insertEvents(json, ID);
    },
    /**
    * @description Returns an event's essential information
    * @param {Hash} event Event from parent calendar
    * @returns {JSON} Event data
    */
    _getEventData: function(event) {
        var data = event.value;
        // Dates' calculation
        var begDate;
        if(data.get("DATUM"))
            begDate = data.get("DATUM").value;
        else if(data.get("BEGDA"))
            begDate = data.get("BEGDA").value;
        else
            begDate = data.get("LDATE").value;
        var begTime = data.get("BEGUZ") ? data.get("BEGUZ").value : "00:00:00";
        if (begTime == "24:00:00")
            begTime = "00:00:00";
        if(data.get("ENDDA")) {
            var endDate = data.get("ENDDA").value;
            var endTime = data.get("ENDUZ") ? data.get("ENDUZ").value : "00:00:00";
            if (endTime == "24:00:00")
                endTime = "00:00:00";
        }
        else {
            var endDate = begDate;
            var endTime = begTime;
        }
        var begDateObject = sapToObject(begDate, begTime);
        var endDateObject = sapToObject(endDate, endTime);
        // Event text
        var eventText;
        if (data.get("AWART"))
            eventText = data.get("AWART").text;
        else if(data.get("SUBTY"))
            eventText = data.get("SUBTY").text;
        else if(data.get("VTART"))
            eventText = data.get("VTART").text;
        else if (data.get("ZTART"))
            eventText = data.get("ZTART").text;
        else if (data.get("SATZA"))
            eventText = global.getLabel("timeInfo");
        else if (data.get("LDATE"))
            eventText = global.getLabel("timeError");
        else
            eventText = "NOTEXT";

        if (data.get("ANZHL"))
            eventText = data.get("ANZHL").value + " " + eventText;
        var eventData = {
            begDate: begDateObject,
            endDate: endDateObject,
            daysLength: data.get("ABWTG") ? data.get("ABWTG").value : 0,
            hoursLength: data.get("STDAZ") ? data.get("STDAZ").value : 0,
            // Will be false if "value" parameter doesn't exists
            allDay: data.get("ALLDF") && data.get("ALLDF").value && data.get("ALLDF").value.toLowerCase() == "x" || data.get("SATZA") != undefined || data.get("LDATE") != undefined,
            text: eventText,
            pernr: data.get("PERNR").value,
            id: event.key,
            status: data.get("STATUS"),
            appId: data.get("APPID").value,
            view: data.get("VIEW") ? data.get("VIEW").value : ""
        };
        return eventData;
    },
    /**
    * @description Opens Time Entry screen for a certain event
    * @param {String} appId Event's appId
    * @param {String} view View we want to use to see event's details
    * @param {Object} event Event's details from the service
    * @param {String} employee Event's employee
    * @param {Array of Dates} retroDates: retro and future dates
    * @param {Object} eventInformation Formatted event info
    */
    _showEventDetails: function(appId, view, event, employee, eventInformation, retroDates) {
        //Sets the lastSelectedDay in timeViews
        if(!Object.isEmpty(eventInformation)){
             this.lastSelectedDay = Date.parseExact(eventInformation.begDate, "yyyy-MM-ddTHH:mm:ssZ"); 
        }
        else if(!Object.isEmpty(event) && !Object.isEmpty(event.get('BEGDA')))
            this.lastSelectedDay = Date.parseExact(event.get('BEGDA').value, "yyyy-MM-dd");
        
        if(appId == "TIM_ERR"){
            var detailsArray = event.EWS.o_field_values.yglui_str_wid_record.contents.yglui_str_wid_content.fields.yglui_str_wid_field;
            var index = getElementIndex(detailsArray,"@fieldid","BEGDA");
            var date = detailsArray[index]["@value"];
        }
        if (employee && eventInformation){
            if(appId != "TIM_ERR"){
                global.open(
                        $H({ app: {
                                appId: appId, 
                                //tabId: this.options.tabId, 
                                view: view
                             },
                         event: event,
                         eventCodes: this.eventCodes,
                         employee: employee,
                         eventInformation: eventInformation,
                         retroDates: retroDates
                     })
                 );
            }else{
                global.open(
                    $H({ app: {
                            appId: appId,
                            //tabId: this.options.tabId, 
                            view: view
                         },
                         event: event,
                         eventCodes: this.eventCodes,
                         employee: employee,
                         eventInformation: eventInformation,
                         message: this.timeErrorMessages.get(date)
                     })
                 );
            }
        }
        else{
            if(appId != "TIM_ERR"){
                global.open(
                        $H({ app: {
                                appId: appId, 
                                //tabId: this.options.tabId, 
                                view: view
                             },
                         event: event,
                         eventCodes: this.eventCodes,
                         retroDates: retroDates
                     })
                 );
            }else{
                global.open(
                    $H({ app: {
                            appId: appId, 
                            //tabId: this.options.tabId, 
                            view: view
                         },
                         event: event,
                         eventCodes: this.eventCodes,
                         message: this.timeErrorMessages.get(date)
                     })
                );
            }
        }
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