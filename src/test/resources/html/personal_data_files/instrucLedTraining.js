/** 
* @fileOverview myLearning.js 
* @description File containing class myLearning. This application is responsible of showing current trainings of one
* or several users. Trainings can be prebooked, or with a session booked.
*/

var myLearning = Class.create(Application,
/** 
*@lends catalogListView 
*/
    {

    /**
    *@type String
    *@description Get view buttons
    */
    getNavLinkService: 'GET_MAIN_LINK',
    /**
    * Service used to retreive booked trainings.
    * @type String	
    */
    prebookingService: "GET_PRBOOKINGS",
    /**
    * Service used to retreive booked trainings.
    * @type String	
    */
    mandatoryService: "GET_MANDATORY",
    /**
    * Service used to retrieve booked sessions
    * @type String
    */
    bookingService: "GET_BOOKINGS",
    /** 
    * Service used to create a booking.
    * @type String
    */
    createBook: "CREATE_BOOKING",
    /** 
    * Service used to maintain a prebooking.
    * @type String
    */
    edit_Prebook: "MODIFY_PREBOOK",
    /**
    * Service used to get cancellation reason
    * @type String
    */
    cancelReasonsService: "GET_CAN_PARTI",
    /**
    * Service used to cancel a previous booking
    * @type String
    */
    cancelBookingService: "CANCELBOOKING",
    /** 
    * Service used to cancel a prebooking.
    * @type String
    */
    cancelpreBookService: "CANCELPREBOOK",
    /**
    * Xml to call to the CREATE_BOOKING service
    * @type XmlDoc
    */
    xmlCreateBook: XmlDoc.create(),
    /**
    *Constructor of the class catalogListView
    */
    eventBeforeFilter: "EWS:deletePrebookingDetails",
    initialize: function ($super, args) {
        $super(args);
        this.applicationId = getArgs(args).appId;
        this.actualEmployeeName = getArgs(args).name; //'';
        this.containerParent = getArgs(args).tabId;
        //update Prebookings table when the user insert new dates in filter options
        this.changePrebDatePickersBinding = this.applyFilterPrebookings.bindAsEventListener(this);
        //update Bookings table when the user insert new dates in filter options
        this.changeBookDatePickersBinding = this.applyFilterBookings.bindAsEventListener(this);
        //Cancel a booking
        this.cancelBookingConfBoxButtonBinding = this.cancelBookingConfBoxButton.bindAsEventListener(this);
        //update Bookings table when the user select a new type value filter options
        this.typeFilterSelectedBinding = this.typeFilterSelected.bindAsEventListener(this);
        //update Bookings table when the user select a new status value filter options
        this.statusFilterSelectedBinding = this.statusFilterSelected.bindAsEventListener(this);
        //delete Session Details
        this.deleteDetailsSelectedBinding = this.fieldFocus.bindAsEventListener(this);
        //Show error message coming from another view
        this.showErrorSelectedBinding = this.showError.bind(this);
        //Rebuild observers on the table
        this.rebuiltTableBinding = this.rebuiltTable.bindAsEventListener(this);
        //if the user is a manager, Mandatory table shows another column
        this.isMng = false;
    },
    /**
    *@description Starts catalogListView
    */
    run: function ($super, args) {
        $super(args);
        var refreshApp = true;
        //hash to save appIds to view details to not refresh the screen
        this.prevAppId = new Hash();
        if (!Object.isEmpty(global.previousApplication)) {
            for (var i = 0; i < this.prevAppId.keys().length; i++) {
                if (global.previousApplication.appId == this.prevAppId.keys()[i]) {
                    refreshApp = false;
                    break;
                }
            }
        }
        if (refreshApp) {
            this.fromEditPreb = false;
            //hash to store the prebookings for the employee selected
            this.hashOfPrebookings = new Hash();
            //hash to store the bookings for the employee selected
            this.hashOfBookings = new Hash();
            //hash to store the bookings for the employee selected
            this.hashOfMandatory = new Hash();
            //initial value for type in filter options (bookings)
            this.typeFilterSelected = '';
            //initial value for status in filter options (bookings)
            this.statusFilterSelected = '';
            if (this.firstRun) {
                this.addMainContainers();
                this.setNavigationLinks();
                //hash to save observers    
                this.observeLinkPrebookings = $H();
                this.observeLinkBookings = $H();
                this.observeLinkMandatory = $H();
            }
            //set the event listeners
            document.observe("EWS:PrebookDateCorrect", this.changePrebDatePickersBinding);
            document.observe("EWS:BookDateCorrect", this.changeBookDatePickersBinding);
            document.observe("EWS:cancelBookingReasonAutocompleter_resultSelected", this.cancelBookingConfBoxButtonBinding);
            document.observe("EWS:deletePrebookingDetails", this.deleteDetailsSelectedBinding);
            document.observe("EWS:errorCancelBooking", this.showErrorSelectedBinding);
            document.observe("EWS:rebuiltBeforeTable_" + 'idTablePrebook', this.deleteDetailsSelectedBinding);
            document.observe("EWS:rebuiltTable_" + 'idTablePrebook', this.rebuiltTableBinding);
            document.observe("EWS:rebuiltTable_" + 'idTableBooking', this.rebuiltTableBinding);
            document.observe("EWS:rebuiltTable_" + 'idTableMandato', this.rebuiltTableBinding);
        }
    },
    /*
    * @method addContainers
    * @desc create first the main containers to be used.
    */
    addMainContainers: function () {
        //overridden the negative bottom margin of the class 'trainingCat_viewSelectorMenu'
        this.divViewLinks = new Element('div', { 'id': this.applicationId + '_divViewLinks', 'style': 'margin-bottom:0px;' });
        this.divAppMain = new Element('div', { 'id': this.applicationId + '_divAppMain' });
        if (this.firstRun) {
            this.desc = new Element('div', { 'id': 'idDesc', 'class': 'application_main_soft_text learning_textAlign_left test_label' });
        }
        this.virtualHtml.update('');
        this.virtualHtml.insert(this.divViewLinks);
        this.virtualHtml.insert('<div class="clearing"></div>');
        this.virtualHtml.insert(this.desc);
        this.virtualHtml.insert('<div class="clearing"></div>');
        this.virtualHtml.insert(this.divAppMain);
        this.virtualHtml.insert('<div class="clearing"></div>');
    },
    /**
    *@param args 
    *@description it refresh the screen when an employee is selected
    */
    onEmployeeSelected: function (args) {
        if (!Object.isEmpty(this.divAppMain) && !this.firstRun) {
            this.actualEmployeeName = getArgs(args).name;
            this.actualEmployeeId = getArgs(args).id;
            if (!$('idWidgetPreb')) {
                this.addFilterOptionsPreb(false);
            }
            if (!$('idWidgetBook')) {
                this.addFilterOptionsBook(false);
            }
            //Refresh tables
            this.setPrebookings(getArgs(args).id);
            this.setBookings(getArgs(args).id);
            this.setMandatory(getArgs(args).id);
        }



    },
    /*
    *@param args 
    *@description it refresh the screen when an employee is unselected
    */
    onEmployeeUnselected: function (args) {
        if (!Object.isEmpty(this.divAppMain) && !this.firstRun) {
            this.actualEmployeeName = getArgs(args).name;
            this.actualEmployeeId = getArgs(args).id;
            this.deleteListPrebooking(this.actualEmployeeId);
            this.deleteListBooking(this.actualEmployeeId);
            this.deleteListMandatory(this.actualEmployeeId, false);
            if (!$('idWidgetPreb')) {
                this.addFilterOptionsPreb(false);
            }
            if (!$('idWidgetBook')) {
                this.addFilterOptionsBook(false);
            }
            //Refresh tables
            this.createPrebookingsTable(false);
            this.createBookingsTable(false);
            this.createMandatoryTable(false);
        }

    },
    /**     
    *@description It calls SAP to get the main links
    */
    setNavigationLinks: function () {
        var xml = "<EWS>" +
                "<SERVICE>" + this.getNavLinkService + "</SERVICE>" +
                "<OBJECT TYPE='P'>" + global.objectId + "</OBJECT>" +
                "<PARAM>" +
                    "<I_APPID>" + this.options.appId + "</I_APPID>" +
                "</PARAM>" +
                "<DEL/>" +
            "</EWS>";
        this.makeAJAXrequest($H({ xml: xml, successMethod: 'drawNavLinks' }));
    },
    /**     
    *@description It draws the main links
    */
    drawNavLinks: function (json) {
        this.hashOfButtons = $H();
        var buttonsAnswer = objectToArray(json.EWS.o_buttons.yglui_str_wid_button);
        this.userManBook = '';
        if (!Object.isEmpty(json.EWS.o_man_book)) {
            this.userManBook = 'X';
        }
        var numButtons = buttonsAnswer.length;
        for (var i = 0; i < numButtons; i++) {
            var buttonsNavJson = {
                elements: [],
                mainClass: 'moduleInfoPopUp_stdButton_div_left'
            };
            //save button info                        
            this.hashOfButtons.set(buttonsAnswer[i]['@action'], {
                info: buttonsAnswer[i]
            });
            var aux = {
                idButton: buttonsAnswer[i]['@views'] + '_button',
                label: prepareTextToShow(buttonsAnswer[i]['@label_tag']),
                handlerContext: null,
                className: 'application_action_link_noUnderline',
                handler: this.openNavApp.bind(this, buttonsAnswer[i]['@action']),
                eventOrHandler: false,
                type: 'link'
            };
            buttonsNavJson.elements.push(aux);
            var ButtonObj = new megaButtonDisplayer(buttonsNavJson);
            var buttonsNav = ButtonObj.getButtons();
            //insert buttons in div
            if (buttonsAnswer[i]['@views'] == 'myLearning') {
                this.divViewLinks.insert('<div class="learning_briefcaseDisabledIcon mylearning_mainIconsAlign"></div>');
                ButtonObj.disable(buttonsAnswer[i]['@views'] + '_button');
                var linkTr = new Element('div', { 'id': 'idLinkTr_' + i, 'class': 'myLearning_filterStyle' });
                linkTr.insert(buttonsNav);
                this.divViewLinks.insert(linkTr);
            } else if (buttonsAnswer[i]['@views'] == 'webBasedTraining') {
                this.divViewLinks.insert('<div class="learning_mouseIcon mylearning_mainIconsAlign"></div>');
                var linkTr = new Element('div', { 'id': 'idLinkTr_' + i, 'class': 'myLearning_filterStyle' });
                linkTr.insert(buttonsNav);
                this.divViewLinks.insert(linkTr);
            } else if (buttonsAnswer[i]['@views'] == 'traingEvaluation') {
                this.divViewLinks.insert('<div class="learning_trainingEvaluationIcon mylearning_mainIconsAlign"></div>');
                var linkTr = new Element('div', { 'id': 'idLinkTr_' + i, 'class': 'myLearning_filterStyle' });
                linkTr.insert(buttonsNav);
                this.divViewLinks.insert(linkTr);
            }
        } //end for    
        if (global.getSelectedEmployees().length == 0) {//Drawing the table when no employee is selected
            if (!$('idWidgetPreb')) {
                this.addFilterOptionsPreb(false);
            }
            if (!$('idWidgetBook')) {
                this.addFilterOptionsBook(false);
            }
            this.createPrebookingsTable(false);
            this.createBookingsTable(false);
            this.createMandatoryTable(false);
            this.firstRun = false;
        } else {
            if (this.firstRun) {
                if (!$('idWidgetPreb')) {
                    this.addFilterOptionsPreb(false);
                }
                if (!$('idWidgetBook')) {
                    this.addFilterOptionsBook(false);
                }
                this.setPrebookings(global.getSelectedEmployees());
                this.setBookings(global.getSelectedEmployees());
                this.setMandatory(global.getSelectedEmployees());
            }

        }
    },
    openNavApp: function (action) {
        global.open($H({
            app: {
                appId: this.hashOfButtons.get(action).info['@tarap'],
                tabId: this.hashOfButtons.get(action).info['@tabId'],
                view: this.hashOfButtons.get(action).info['@views']
            }
        }));
    },
    /*++++++++++++++++++++++++++++++++++ PREBOOKINGS WIDGET +++++++++++++++++++++++++++++++++++++++++++*/
    /*
    * @method addFilterOptionsPreb
    * @desc adds the filter options for the prebookings list.
    */
    addFilterOptionsPreb: function (fromSearch) {
        ///widgets
        if (!fromSearch) {//It enters when a filter is applied.
            this.divPrebWidget = null;
            this.prebookingWidget = null;
            this.idWidgetPreb = null;
            this.divFilterOptionsPreb = null;
            // refresh filter options values selected	
            this.foPrebDateFrom = '';
            this.foPrebDateTo = '';
            this.foPrebSessions = false;
        }

        this.divPrebWidget = new Element('div', { 'id': this.applicationId + 'divPrebWidget', 'class': 'learning_marginWidget' });
        if (!fromSearch) {
            this.divAppMain.insert(this.divPrebWidget);
            this.idWidgetPreb = new Element('div', { 'id': 'idWidgetPreb' });
            var objOptions = $H({
                title: global.getLabel('prebookings'),
                collapseBut: true,
                contentHTML: this.idWidgetPreb,
                onLoadCollapse: false,
                targetDiv: this.applicationId + 'divPrebWidget'
            });
            this.prebookingWidget = new unmWidget(objOptions);
        }

        this.divFilterOptionsPreb = new Element('div', { 'id': this.options.appId + '_divFilterOptionsPreb' });
        //Create megabutton
        var jsonFilter = { elements: [] };
        var labelFilter;
        var optionsDivPreb = new Element('div', { 'id': 'idOptionsDivPreb', 'class': 'application_clear_line' });
        if (!fromSearch) {//It only enters first time the page is loaded.    
            optionsDivPreb.hide();
        }
        if (!optionsDivPreb.visible()) {
            labelFilter = global.getLabel('filterOptions');
        }
        else {
            labelFilter = global.getLabel('clearfilter');
        }
        var filterButtonPrebook = {
            label: labelFilter,
            toolTip: labelFilter,
            idButton: 'idFilterOptionPrebook',
            handler: this.toggleFilter.bindAsEventListener(this, 'idFilterOptionPrebook', optionsDivPreb, labelFilter),
            className: 'application_action_link_noUnderline myLearning_filterOptionslink',
            type: 'link',
            standardButton: false
        };
        jsonFilter.elements.push(filterButtonPrebook);
        var buttonFilterDisplayer = new megaButtonDisplayer(jsonFilter);
        var optionsTextBtn = buttonFilterDisplayer.getButtons();

        this.divFilterOptionsPreb.insert(optionsTextBtn);
        this.divFilterOptionsPreb.insert(optionsDivPreb);
        var fromLabel = new Element('div', { 'id': 'idFromLabelPreb', 'class': 'myLearning_filterStyle' }).insert(global.getLabel('from'));
        this.dateFrom = new Element('div', { 'id': 'idDateFrom', 'class': 'myLearning_filterStyle' });
        var toLabel = new Element('div', { 'id': 'idToLabelPreb', 'class': 'myLearning_filterStyle' }).insert(global.getLabel('to'));
        this.dateTo = new Element('div', { 'id': 'idDateTo', 'class': 'myLearning_filterStyle' });
        this.sessionCheckbox = new Element('input', { 'id': 'myLearning_filterSessionPreb', 'type': 'checkbox', 'class': 'test_checkBox' });
        var sessionFilter = new Element('div', { 'id': 'idToLabelPreb', 'class': 'myLearning_filterStyle' }).insert(global.getLabel('sess') + ' ');
        sessionFilter.insert(this.sessionCheckbox);
        optionsDivPreb.insert(fromLabel);
        optionsDivPreb.insert(this.dateFrom);
        optionsDivPreb.insert(toLabel);
        optionsDivPreb.insert(this.dateTo);
        optionsDivPreb.insert(sessionFilter);

        ///this.idWidgetPreb.insert(this.divFilterOptionsPreb);		
        this.idWidgetPreb.insert('<div class="clearing"></div>');

        // DatePickers definition
        if (Object.isEmpty(this.foPrebDateFrom)) {
            var begDate = '';
        } else {
            var begDate = this.foPrebDateFrom.toString('yyyyMMdd');
        }
        if (Object.isEmpty(this.foPrebDateTo)) {
            var endDate = '';
        } else {
            var endDate = this.foPrebDateTo.toString('yyyyMMdd');
        }
        this.objDateFrom = new DatePicker(this.dateFrom, { defaultDate: begDate, manualDateInsertion: true, emptyDateValid: true, events: $H({ 'correctDate': 'EWS:PrebookDateCorrect', dateSelected: 'EWS:PrebookDateCorrect' }) });
        this.objDateTo = new DatePicker(this.dateTo, { defaultDate: endDate, manualDateInsertion: true, events: $H({ 'correctDate': 'EWS:PrebookDateCorrect', dateSelected: 'EWS:PrebookDateCorrect' }) });
        this.objDateFrom.linkCalendar(this.objDateTo);

        this.sessionCheckbox.checked = this.foPrebSessions;
        this.sessionCheckbox.observe('click', this.applyFilterPrebookings.bindAsEventListener(this));

    },
    /*
    * @method toggleFilter
    * @desc it changes the Filter name from 'Filter Options' to 'Clear Filter'
    */
    toggleFilter: function (event, idButton, divFilter, labelFilter) {
        divFilter.toggle();
        if (!divFilter.visible()) {
            labelFilter = global.getLabel('filterOptions');
            if (idButton == 'idFilterOptionBook') {
                this.foBookType = '';
                this.foBookStatus = '';
                this.foBookDateFrom = '';
                this.foBookDateTo = '';
                this.typeFilterSelected = '';
                this.statusFilterSelected = '';

                if (!$('idWidgetBook')) {
                    this.addFilterOptionsBook(false);
                }
                this.createBookingsTable(false);
            } else {
                this.foPrebDateFrom = '';
                this.foPrebDateTo = '';
                this.foPrebSessions = '';
                if (!$('idWidgetPreb')) {
                    this.addFilterOptionsPreb(false);
                }
                this.createPrebookingsTable(false);
            }
        }
        else {
            labelFilter = global.getLabel('clearfilter');
        }
        $(idButton).update(labelFilter);
        $(idButton).writeAttribute('title', labelFilter);

    },
    /*
    * @method setPrebookings
    * @desc gets the prebookings for the selected user
    */
    setPrebookings: function (employeeId) {
        var idEmployeeSelected = objectToArray(employeeId);
        var xmlEmployees = "";
        for (var i = 0; i < idEmployeeSelected.length; i++) {
            xmlEmployees += " <YGLUI_TAB_PERNR PERNR = \" " + idEmployeeSelected[i] + " \" />";
        }
        //delete prebooking from hash after book a course
        this.actualEmployeeId = idEmployeeSelected[0];

        this.xmlGetTrainings = '<EWS>'
                            + "<SERVICE>" + this.prebookingService + "</SERVICE>"
                            + "<OBJECT TYPE='P'>" + idEmployeeSelected[0] + "</OBJECT>"
                            + "<PARAM>"
                                + "<CONTAINER_PARENT>" + this.containerParent + "</CONTAINER_PARENT>"
							    + "<CONTAINER_CHILD>" + this.options.appId + "</CONTAINER_CHILD>"
                                + "<I_PERNR>" + xmlEmployees + "</I_PERNR>"
							+ "</PARAM>"
                            + '</EWS>';
        this.makeAJAXrequest($H({ xml: this.xmlGetTrainings, successMethod: 'addListPrebooking', ajaxID: 'prebook' }));
    },
    /*
    * @method buildListView
    * @desc creates the list view TABLE.
    */
    addListPrebooking: function (req) {
        this.firstRun = false;
        var fromSearch = false;
        //        this.prebookLabels = objectToArray(req.EWS.labels.item);
        if (!Object.isEmpty(req.EWS.o_prbookings)) {
            var courses = objectToArray(req.EWS.o_prbookings.yglui_str_my_learn_d);
            var courseLength = courses.length;
            for (var i = 0; i < courseLength; i++) {
                //create the prebookings hash
                //Get sessions for each course type
                if (!Object.isEmpty(courses[i].sessions)) {
                    var sessionsPreb = objectToArray(courses[i].sessions.yglui_str_my_learn_e);
                } else {
                    var sessionsPreb = "";
                }
                //Get actions for each course type
                var buttonsPreb = '';
                var cancelPrebBut = '';
                var displayCTBut = '';
                var editCTBut = '';
                var moreOffBut = courses[i]['@more_offer'];
                if (!Object.isEmpty(courses[i].buttons)) {
                    buttonsPreb = objectToArray(courses[i].buttons.yglui_vie_tty_ac);
                    var numButtons = courses[i].buttons.yglui_vie_tty_ac.length;
                    for (var n = 0; n < numButtons; n++) {
                        switch (buttonsPreb[n]['@actio']) {
                            case 'LSOCANCELPREBOOKING':
                                cancelPrebBut = buttonsPreb[n];
                                break;
                            case 'LSODISPLAYCT':
                                displayCTBut = buttonsPreb[n];
                                this.prevAppId.set(buttonsPreb[n]['@tarap']);
                                break;
                            case 'LSO_CHAN_PREBO':
                                editCTBut = buttonsPreb[n];
                                break;
                            case 'LSO_MORE_OFF':
                                if (!Object.isEmpty(moreOffBut)) {
                                    moreOffBut = buttonsPreb[n];
                                } else {
                                    moreOffBut = '';
                                }
                                break;
                        }
                    }
                }
                var employeeId = Object.isEmpty(courses[i]['@obj_objid']) ? '' : courses[i]['@obj_objid'];
                var employeeName = global.getEmployee(employeeId).name;
                this.hashOfPrebookings.set(courses[i]['@objid'] + "_" + employeeId, {
                    trainingId: Object.isEmpty(courses[i]['@objid']) ? '' : courses[i]['@objid'],
                    title: Object.isEmpty(courses[i]['@title']) ? '' : prepareTextToShow(courses[i]['@title']),
                    duration: courses[i]['@days'] + global.getLabel('days') + ' ' + courses[i]['@hours'] + global.getLabel('hours'),
                    employeeId: employeeId, //this.actualEmployeeId,
                    employeeName: prepareTextToShow(employeeName), // this.actualEmployeeName,
                    period: Object.isEmpty(courses[i]['@date']) ? '' : courses[i]['@date'],
                    begda: Object.isEmpty(courses[i]['@begda']) ? '' : courses[i]['@begda'],
                    endda: Object.isEmpty(courses[i]['@endda']) ? '' : courses[i]['@endda'],
                    numSessions: parseInt(courses[i]['@sess_num'], 10),
                    description: Object.isEmpty(courses[i]['@description']) ? '' : courses[i]['@description'],
                    objType: Object.isEmpty(courses[i]['@obj_otype']) ? '' : courses[i]['@obj_otype'],
                    objId: Object.isEmpty(courses[i]['@obj_objid']) ? '' : courses[i]['@obj_objid'],
                    type: Object.isEmpty(courses[i]['@otype']) ? '' : courses[i]['@otype'],
                    actio: 'P',
                    deleteAct: '',
                    sessions: sessionsPreb,
                    buttons: buttonsPreb,
                    cancelPrebBut: cancelPrebBut,
                    displayCTBut: displayCTBut,
                    moreOffBut: moreOffBut,
                    editBut: editCTBut
                });
            }
        }
        this.createPrebookingsTable(fromSearch);
    },
    applyFilterPrebookings: function () {
        //filter options selected
        this.foPrebDateFrom = this.objDateFrom.actualDate;
        this.foPrebDateTo = this.objDateTo.actualDate;
        this.foPrebSessions = this.sessionCheckbox.checked;
        this.addFilterOptionsPreb(true);
        this.createPrebookingsTable(true);
    },
    /*
    * @method It deletes the prebookings for one employee when the employee is unselected
    * @desc creates the list view TABLE.
    */
    deleteListPrebooking: function (employeeId) {

        //unset elements for the hash 

        for (var i = 0; i < this.hashOfPrebookings.keys().length; i++) {
            if (employeeId == this.hashOfPrebookings.get(this.hashOfPrebookings.keys()[i]).employeeId) {
                this.hashOfPrebookings.unset(this.hashOfPrebookings.keys()[i]);
                i--;
            }
        }
        //this.createPrebookingsTable(false);
    },
    /*
    * @method buildListView
    * @desc add Prebooking table to Html.
    */
    createPrebookingsTable: function (fromSearch) {
        this.trainingIdOpened = '';
        this.employeeIdOpened = '';
        this.observeLinkPrebookings = $H();
        if (!this.divListPrebooking) {
            this.divListPrebooking = new Element('div', { 'id': this.applicationId + '_divListPrebooking', 'class': 'mylearning_scroll' });
            this.idWidgetPreb.insert(this.divListPrebooking);
        }
        if (!this.tablePreb) {
            this.tablePreb = new Element('table', { 'id': 'idTablePrebook', 'class': 'sortable mylearning_marginTable' });
            var theadrow = new Element('tr', {});
            var thead = new Element('thead', {}).insert(theadrow);
            this.tbodyPrebook = new Element('tbody', {});


            var thTitle = new Element('th', { 'id': 'idTitleHeader', 'class': 'myLearning_widthTitleCT' }).insert(global.getLabel('trainingTitle'));
            var thSessions = new Element('th', { 'id': 'idSessHeader', 'class': 'myLearning_widthSessionsCT' }).insert(global.getLabel('sess'));
            var thPeriod = new Element('th', { 'id': 'idPeriodHeader', 'class': 'myLearning_widthPeriodCT' }).insert(global.getLabel('period'));
            var thActions = new Element('th', { 'id': 'Actions', 'class': 'myLearning_widthActionCT' }).insert(new Element('span', { 'class': 'linedTree_hidden TPreferencesDescriptionToShow' }).insert(global.getLabel('KM_ACTIONS')));

            if (this.userManBook == 'X') {
                theadrow.insert(new Element('th', { 'id': 'EMPLOYEE', 'class': 'myLearning_widthTitleCT' }).insert(global.getLabel('EMPLOYEE')));
            }
            theadrow.insert(thTitle);
            theadrow.insert(thSessions);
            theadrow.insert(thPeriod);
            theadrow.insert(thActions);
            this.oldTheadPreb = thead.cloneNode(true);
            this.tablePreb.insert(thead);
            this.tablePreb.insert(this.tbodyPrebook);
            this.divListPrebooking.insert(this.tablePreb);
        }
        else {
            var thead = this.oldTheadPreb.cloneNode(true);
            //this.tablePreb.tHead.parentNode.replaceChild(thead, this.tablePreb.tHead);
            $('idTablePrebook').tHead.parentNode.replaceChild(thead, $('idTablePrebook').tHead);
            this.tbodyPrebook.update('');
        }
        var numPrebookings = this.hashOfPrebookings.keys().length;
        for (var i = 0; i < numPrebookings; i++) {
            var trainingId = this.hashOfPrebookings.get(this.hashOfPrebookings.keys()[i]).trainingId;
            var begdaCT = Date.parseExact(this.hashOfPrebookings.get(this.hashOfPrebookings.keys()[i]).begda, 'yyyy-MM-dd').toString(global.getDateFormat());
            var enddaCT = Date.parseExact(this.hashOfPrebookings.get(this.hashOfPrebookings.keys()[i]).endda, 'yyyy-MM-dd').toString(global.getDateFormat());
            var period = begdaCT + ' - ' + enddaCT;
            var typeObjPreb = this.hashOfPrebookings.get(this.hashOfPrebookings.keys()[i]).type;
            var buttonsPreb = this.hashOfPrebookings.get(this.hashOfPrebookings.keys()[i]).buttons;
            var employeeId = this.hashOfPrebookings.get(this.hashOfPrebookings.keys()[i]).employeeId;
            var trbodyrow = new Element('tr', { 'id': 'trPrebook_' + trainingId + '_' + employeeId, 'class': 'myLearningApp_trBgColor myLearningApp_borderTr' });
            this.tbodyPrebook.insert(trbodyrow);
            //Gets color for employee
            var color;

            color = this.getEmployee(employeeId).color;
            if (Object.isUndefined(color)) color = 0;
            if (!Object.isNumber(color)) color = 0;
            color = "eeColor" + color.toPaddedString(2);

            //insert arrow to show/hide course type's details
            var jsonArrow = {
                elements: []
            };
            if (global.liteVersion) {
                var arrowIcon = '>';
            }
            else {
                var arrowIcon = '';
            }

            var arrowButton = {
                label: arrowIcon,
                toolTip: global.getLabel('showTech'),
                idButton: 'idShowDetails_' + trainingId + '_' + this.hashOfPrebookings.get(this.hashOfPrebookings.keys()[i]).employeeId,
                handler: this.toggleShowDetailsPreb.bindAsEventListener(this, trainingId, employeeId),
                className: 'treeHandler_align_verticalArrow learning_listArrowBlue mylearning_marginTop application_action_link_noUnderline',
                type: 'link',
                standardButton: false
            };
            jsonArrow.elements.push(arrowButton);
            var buttonDisplayerArrow = new megaButtonDisplayer(jsonArrow);
            //var showDetails = new Element('td', { , 'class': 'myLearning_widtArrowCT' });
            var divShowDetails = new Element('div', { 'id': 'idShowDetailsDiv_' + trainingId + '_' + employeeId, 'class': 'treeHandler_align_verticalArrow  application_action_link_noUnderline' });
            divShowDetails.insert(buttonDisplayerArrow.getButtons());
            this.observeLinkPrebookings.set('idShowDetailsDiv_' + trainingId + '_' + employeeId, jsonArrow);
            var tdTitlePreb = new Element('td', { 'id': 'idTitlePrebCT_' + trainingId + '_' + employeeId, 'class': 'myLearning_widthTitleCT' });
            //insert employee name if the manager is logged
            if (this.userManBook == 'X') {
                var tdEmployee = new Element('td', { 'id': 'EMPLOYEE', 'class': 'myLearning_widthPeriodCT' }).insert(divShowDetails);
                tdEmployee.insert(new Element('div', { 'class': 'application_color_' + color }).insert(this.hashOfPrebookings.get(this.hashOfPrebookings.keys()[i]).employeeName));
                trbodyrow.insert(tdEmployee);
            }
            else {
                tdTitlePreb.insert(divShowDetails);
            }
            //insert title of the prebooking courses.
            var jsonTitle = {
                elements: []
            };
            var titleButton = {
                label: this.hashOfPrebookings.get(this.hashOfPrebookings.keys()[i]).title,
                toolTip: this.hashOfPrebookings.get(this.hashOfPrebookings.keys()[i]).title,
                idButton: 'idButPrebookCT_' + trainingId + '_' + employeeId,
                handler: this.showViewDetails.bindAsEventListener(this, trainingId, typeObjPreb, this.hashOfPrebookings.get(this.hashOfPrebookings.keys()[i]).displayCTBut, this.hashOfPrebookings.get(this.hashOfPrebookings.keys()[i]).begda, this.hashOfPrebookings.get(this.hashOfPrebookings.keys()[i]).endda),
                className: 'application_action_link_noUnderline',
                type: 'link',
                standardButton: false
            };
            jsonTitle.elements.push(titleButton);
            var divTitlePrebCT = new Element('div', { 'id': 'idPrebookCTDiv_' + trainingId + '_' + employeeId, 'class': 'application_action_link_noUnderline' });
            divTitlePrebCT.insert(new megaButtonDisplayer(jsonTitle).getButtons());
            this.observeLinkPrebookings.set('idPrebookCTDiv_' + trainingId + '_' + employeeId, jsonTitle);
            var titlePrebCT = new Element('div', { 'id': 'idPrebookCT_' + trainingId + '_' + employeeId, 'class': 'application_action_link_noUnderline' });
            titlePrebCT.insert(divTitlePrebCT);
            tdTitlePreb.insert(titlePrebCT);
            var tdSessionsPreb = new Element('td', { 'id': 'idSessionsPrebCT_' + trainingId + '_' + employeeId, 'class': 'myLearning_widthSessionsCT' }).insert(parseInt(this.hashOfPrebookings.get(this.hashOfPrebookings.keys()[i]).numSessions, 10));
            var tdPeriodPreb = new Element('td', { 'id': 'idPeriodPrebCT_' + trainingId + '_' + employeeId, 'class': 'myLearning_widthPeriodCT' }).insert(prepareTextToShow(period));
            var tdActionPreb = new Element('td', { 'id': 'idActionPrebCT_' + trainingId + '_' + employeeId, 'class': 'myLearning_widthActionCT' });
            //Add columns
            //trbodyrow.insert(showDetails);

            trbodyrow.insert(tdTitlePreb);
            trbodyrow.insert(tdSessionsPreb);
            trbodyrow.insert(tdPeriodPreb);
            trbodyrow.insert(tdActionPreb);
            //Add actions
            var jsonEdit = {
                elements: []
            };
            //edit button
            if (!Object.isEmpty(this.hashOfPrebookings.get(this.hashOfPrebookings.keys()[i]).editBut)) {
                if (global.liteVersion) {
                    var editIcon = 'E';
                }
                else {
                    var editIcon = '';
                }

                var editButton = {
                    label: editIcon,
                    toolTip: this.hashOfPrebookings.get(this.hashOfPrebookings.keys()[i]).editBut['@actiot'],
                    idButton: 'idEditPrebAct_' + trainingId + '_' + employeeId,
                    className: 'application_editSelection fieldsPanel_deleteButton',
                    handler: this.edit_preBooking.bindAsEventListener(this, this.hashOfPrebookings.get(this.hashOfPrebookings.keys()[i])),
                    type: 'link',
                    standardButton: false
                };
                jsonEdit.elements.push(editButton);
            }
            //Cancel Prebooking         
            if (!Object.isEmpty(this.hashOfPrebookings.get(this.hashOfPrebookings.keys()[i]).cancelPrebBut)) {
                if (global.liteVersion) {
                    var cancelIcon = 'X';
                }
                else {
                    var cancelIcon = '';
                }

                var cancelButton = {
                    label: cancelIcon,
                    toolTip: this.hashOfPrebookings.get(this.hashOfPrebookings.keys()[i]).cancelPrebBut['@actiot'],
                    idButton: 'idCancelPrebAct_' + trainingId + '_' + employeeId,
                    className: 'learning_deleteButton fieldsPanel_deleteButton',
                    handler: this.cancel_preBooking.bindAsEventListener(this, trainingId, this.hashOfPrebookings.get(this.hashOfPrebookings.keys()[i]).employeeId),
                    type: 'link',
                    standardButton: false
                };
                jsonEdit.elements.push(cancelButton);


            }
            if (!Object.isEmpty(jsonEdit.elements)) {
                tdActionPreb.insert(new megaButtonDisplayer(jsonEdit).getButtons());
                this.observeLinkPrebookings.set('idActionPrebCT_' + trainingId + '_' + employeeId, jsonEdit);
            }
            //add action to show view details of a course type when click on the title   
            if (!Object.isEmpty(this.hashOfPrebookings.get(this.hashOfPrebookings.keys()[i]).displayCTBut)) {
                //titlePrebCT.observe('click', this.showViewDetails.bindAsEventListener(this, trainingId, typeObjPreb, this.hashOfPrebookings.get(this.hashOfPrebookings.keys()[i]).displayCTBut, begda, endda));
            }
        }
        if (!this.tablePrebook) {
            var filtersStoring = $A();
            var j = 0;
            if (this.userManBook == 'X') {
                filtersStoring[j++] = { name: 'EMPLOYEE', main: true, label: global.getLabel('EMPLOYEE') };
            }
            filtersStoring[j++] = { name: 'idTitleHeader', main: true, label: global.getLabel('trainingTitle') };
            filtersStoring[j++] = { name: 'idPeriodHeader', main: true, type: 'translatedDate', label: global.getLabel('period'), future: true };
            filtersStoring[j++] = { name: 'idSessHeader', main: true, label: global.getLabel('sess') };
            filtersStoring[j++] = { name: 'Actions', main: true, label: global.getLabel('KM_ACTIONS') };
            //Create tablekit
            this.tablePrebook = new tableKitWithSearchAndPreferences($('idTablePrebook'), { clearFilterButton: true, exportMenu: true, filters: filtersStoring, multiSelectionFilter: true, filterPerPage: 4, webSearch: true, noResultsLabel: global.getLabel('noSessions'), pagination: true, countWithEmptyCell: false, pages: 5, filteringEvents: true, eventFilterRequested: this.eventBeforeFilter, paginationEvents: true, eventPaginationRequested: this.eventBeforeFilter, searchingEvents: true, eventSearchRequested: this.eventBeforeFilter, sortingEvents: true, eventSortingPerformed: this.eventBeforeFilter });
        }
        else {

            $('idTablePrebook').tBodies[0].parentNode.replaceChild(this.tbodyPrebook, $('idTablePrebook').tBodies[0]);
            this.tablePrebook.instanceTableKit.filterDiv = null;
            this.tablePrebook.instanceTableKit.divReportFilter = null;
            this.tablePrebook.reloadTable($('idTablePrebook'), true, true);
            if (this.tablePrebook.mode != "new")
                this.rebuiltTable('idTablePrebook');
        }

    },
    edit_preBooking: function (event, trainingPre) {
        if (trainingPre.editMand) {
            var title = new Element('div', { 'class': 'application_main_title getContentDisplayerTitle' }).insert(global.getLabel('maintainMandatory'));
        } else {
            var title = new Element('div', { 'class': 'application_main_title getContentDisplayerTitle' }).insert(global.getLabel('mainPrebook'));
        }
        var contentTitle = new Element('div').insert(title);
        var labelFrom = new Element('div', { 'class': 'myLearning_filterStyle' }).insert(global.getLabel('from'));
        var dateFrom = new Element('div', { 'id': 'idDateFromPre', 'class': 'myLearning_filterStyle' });
        var labelTo = new Element('div', { 'class': 'myLearning_filterStyle' }).insert(global.getLabel('to'));
        var dateTo = new Element('div', { 'id': 'idDateToPre', 'class': 'myLearning_filterStyle' });
        var contentHtml = new Element('div', { 'class': 'application_clear_line' }).insert(labelFrom);
        contentHtml.insert(dateFrom);
        contentHtml.insert(labelTo);
        contentHtml.insert(dateTo);
        var mainContentHtml = new Element('div').insert(contentTitle);
        mainContentHtml.insert(contentHtml);
        //buttons
        var _this = this;
        var buttonsJson = {
            elements: [],
            mainClass: 'moduleInfoPopUp_stdButton_div_right'
        };
        var callBack = function () {
            if (_this)
                _this.maintainPreBookingRequest(trainingPre);
            editPreBookPopUp.close();
            delete editPreBookPopUp;
        };
        var callBack3 = function () {
            editPreBookPopUp.close();
            delete editPreBookPopUp;
        };
        var aux = {
            idButton: 'save',
            label: global.getLabel('save'),
            handlerContext: null,
            className: 'moduleInfoPopUp_stdButton',
            handler: callBack,
            type: 'button',
            standardButton: true
        };
        var aux3 = {
            idButton: 'cancel',
            label: global.getLabel('cancel'),
            handlerContext: null,
            className: 'moduleInfoPopUp_stdButton',
            handler: callBack3,
            type: 'button',
            standardButton: true
        };

        buttonsJson.elements.push(aux);
        buttonsJson.elements.push(aux3);
        var ButtonObj2 = new megaButtonDisplayer(buttonsJson);
        var buttons = ButtonObj2.getButtons();
        //insert buttons in div
        mainContentHtml.insert(new Element('div', { 'class': 'application_clear_line' }));
        mainContentHtml.insert(buttons);
        var editPreBookPopUp = new infoPopUp({
            closeButton: $H({
                'textContent': 'Close',
                'callBack': function () {
                    editPreBookPopUp.close();
                    delete editPreBookPopUp;
                }
            }),
            htmlContent: mainContentHtml,
            width: 500
        });
        editPreBookPopUp.create();
        // DatePickers definition
        var begDate = Date.parseExact(trainingPre.begda, 'yyyy-MM-dd').toString('yyyyMMdd');
        var endDate = Date.parseExact(trainingPre.endda, 'yyyy-MM-dd').toString('yyyyMMdd');
        this.dateFromPre = new DatePicker('idDateFromPre', { defaultDate: begDate, manualDateInsertion: true, emptyDateValid: true });
        this.dateToPre = new DatePicker('idDateToPre', { defaultDate: endDate, manualDateInsertion: true });
        this.dateFromPre.linkCalendar(this.dateToPre);
    },
    maintainPreBookingRequest: function (ptrainingPre) {
        var deleteMand = ptrainingPre.deleteAct;
        if (Object.isEmpty(deleteMand)) {
            var newBegda = (this.dateFromPre.actualDate).toString('yyyy-MM-dd');
            var newEndda = (this.dateToPre.actualDate).toString('yyyy-MM-dd');
        } else {
            var newBegda = ptrainingPre.begda;
            var newEndda = ptrainingPre.endda;
        }
        //if there isn't any change in the prebooking, the service is not called
        if (!(ptrainingPre.begda == newBegda)
     || !(ptrainingPre.endda == newEndda)
     || !Object.isEmpty(deleteMand)) {
            var xmlEditPreb = '<EWS>' +
        '<SERVICE>' + this.edit_Prebook + '</SERVICE>' +
        '<OBJ TYPE="' + ptrainingPre.type + '">' + ptrainingPre.trainingId + '</OBJ>' +
        '<PARAM>' +
            '<OLD_BEGDA>' + ptrainingPre.begda + '</OLD_BEGDA>' +
            '<OLD_ENDDA>' + ptrainingPre.endda + '</OLD_ENDDA>' +
            '<NEW_BEGDA>' + newBegda + '</NEW_BEGDA>' +
            '<NEW_ENDDA>' + newEndda + '</NEW_ENDDA>' +
            '<ACTION>' + ptrainingPre.actio + '</ACTION>' +
            '<OTYPE>' + ptrainingPre.objType + '</OTYPE>' +
            '<OBJID>' + ptrainingPre.objId + '</OBJID>' +
            '<DELETE>' + deleteMand + '</DELETE>' +
        '</PARAM>' +
        '</EWS>';
            this.makeAJAXrequest($H({ xml: xmlEditPreb, successMethod: 'modify_preb', ajaxID: ptrainingPre }));
        }
    },
    modify_preb: function (req, ptraining) {
        if (!ptraining) {
            this.fromEditPreb = true;
            this.deleteListPrebooking(req.EWS.o_table_pernr.yglui_tab_pernr["@pernr"]);
            this.setPrebookings(req.EWS.o_table_pernr.yglui_tab_pernr["@pernr"]);
            if (!$('idWidgetBook')) {
                this.addFilterOptionsBook(false);
            }
            this.deleteListBooking(req.EWS.o_table_pernr.yglui_tab_pernr["@pernr"]);
            this.setBookings(req.EWS.o_table_pernr.yglui_tab_pernr["@pernr"]);
        } else {
            if (ptraining.actio == 'M') {
                this.deleteListMandatory(ptraining.employeeId, true);
                this.setMandatory(global.getSelectedEmployees());
            } else {
                this.fromEditPreb = true;
                if (!$('idWidgetPreb')) {
                    this.addFilterOptionsPreb(false);
                }
                this.deleteListPrebooking(ptraining.employeeId);
                this.setPrebookings(ptraining.employeeId);
            }
        }
    },
    cancel_preBooking: function (event, pTrainingId, employee) {
        //var employee = global.getSelectedEmployees();
        var training = pTrainingId;
        var cancelPreBookingHtml = "<div>" + global.getLabel('cancelPre') + "</div>";
        var _this = this;
        var contentHTML = new Element('div');
        contentHTML.insert(cancelPreBookingHtml);
        //buttons
        var buttonsJson = {
            elements: [],
            mainClass: 'moduleInfoPopUp_stdButton_div_right'
        };
        var callBack = function () {
            if (_this)
                _this.cancelPreBookingRequest(employee, training);
            cancelPrePopUp.close();
            delete cancelPrePopUp;
        };
        var callBack3 = function () {
            cancelPrePopUp.close();
            delete cancelPrePopUp;
        };
        var aux = {
            idButton: 'Yes',
            label: global.getLabel('yes'),
            handlerContext: null,
            className: 'moduleInfoPopUp_stdButton',
            handler: callBack,
            type: 'button',
            standardButton: true
        };
        var aux3 = {
            idButton: 'No',
            label: global.getLabel('no'),
            handlerContext: null,
            className: 'moduleInfoPopUp_stdButton',
            handler: callBack3,
            type: 'button',
            standardButton: true
        };

        buttonsJson.elements.push(aux);
        buttonsJson.elements.push(aux3);
        var ButtonObj2 = new megaButtonDisplayer(buttonsJson);
        var buttons = ButtonObj2.getButtons();
        //insert buttons in div
        contentHTML.insert(buttons);

        var cancelPrePopUp = new infoPopUp({

            closeButton: $H({
                'textContent': 'Close',
                'callBack': function () {
                    cancelPrePopUp.close();
                    delete cancelPrePopUp;
                }
            }),
            htmlContent: contentHTML,
            indicatorIcon: 'information',
            width: 350
        });
        cancelPrePopUp.create();
    },

    cancelPreBookingRequest: function (employee, training) {
        this.xmlCancelPre = "<EWS>"
                        + "<SERVICE>" + this.cancelpreBookService + "</SERVICE>"
                        + "<OBJECT TYPE=\"D\">" + training + "</OBJECT>"
                        + "<PARAM>"
                            + "<O_PERNR>" + employee + "</O_PERNR>"
                        + "</PARAM>"
                     + "</EWS>";
        this.makeAJAXrequest($H({ xml: this.xmlCancelPre, successMethod: 'cancelPreBookingAnswer' }));
    },
    cancelPreBookingAnswer: function (req) {
        //refresh LMS application
        global.open($H({
            app: {
                appId: this.options.appId,
                tabId: this.options.tabId,
                view: this.options.view
            }
        }));
    },

    showPrebookingsDetails: function (trainingId, employeeId) {
        if (this.trainingIdOpened && (this.trainingIdOpened == trainingId) && (this.employeeIdOpened == employeeId)) {
            this.virtualHtml.down('[id = idTrBodyDesc_' + trainingId + '_' + employeeId + ']').remove();
            this.trbodydesc = null;
            this.trainingIdOpened = '';
            this.employeeIdOpened = '';
        } else {
            if (this.trainingIdOpened) {
                this.virtualHtml.down('[id = idTrBodyDesc_' + this.trainingIdOpened + '_' + this.employeeIdOpened + ']').remove();
                this.virtualHtml.down('[id=trPrebook_' + this.trainingIdOpened + '_' + this.employeeIdOpened + ']').removeClassName('myLearningApp_trOpenedBgColor');
                this.virtualHtml.down('[id=trPrebook_' + this.trainingIdOpened + '_' + this.employeeIdOpened + ']').addClassName('myLearningApp_borderTr');
                this.virtualHtml.down('[id=idShowDetails_' + this.trainingIdOpened + '_' + this.employeeIdOpened + ']').removeClassName('learning_listArrowBlueDown');
                this.virtualHtml.down('[id=idShowDetails_' + this.trainingIdOpened + '_' + this.employeeIdOpened + ']').addClassName('learning_listArrowBlue');
                if (global.liteVersion) {
                    arrowIcon = '>';
                    this.virtualHtml.down('[id=idShowDetails_' + this.trainingIdOpened + '_' + this.employeeIdOpened + ']').update(arrowIcon);
                }
            }
            this.trainingIdOpened = trainingId;
            this.employeeIdOpened = employeeId;
            this.trbodydesc = new Element('tr', { 'id': 'idTrBodyDesc_' + trainingId + '_' + employeeId, 'class': 'myLearningApp_trOpenedBgColor' });
            var tdbodydesc = new Element('td', { 'colspan': 6 });
            var infoPrebook = new Element('div', { 'id': 'idInfoPrebook_' + trainingId + '_' + employeeId });
            tdbodydesc.insert(infoPrebook);
            this.trbodydesc.insert(tdbodydesc);
            this.virtualHtml.down('[id=trPrebook_' + trainingId + '_' + employeeId + ']').insert({ after: this.trbodydesc });
            infoPrebook.insert('<div class="applications_text_Value"><div class="myLearningApp_fontLabel inlineElement">' + global.getLabel('description2') + ' </div><div>' + this.hashOfPrebookings.get(trainingId + '_' + employeeId).description + ' &nbsp;</div></div>');
            infoPrebook.insert('<div class="applications_text_Value myLearningApp_fontLabel application_clear_line">' + global.getLabel('schedOff') + '</div>');

            if (!Object.isEmpty(this.hashOfPrebookings.get(trainingId + '_' + employeeId).sessions)) {
                //Table Sessions        
                var tableSession = new Element('table', { 'id': 'idTableSessions', 'class': 'sortable_myLearning' }); //resizable
                var theadrowSes = new Element('tr', { 'class': '' });
                var theadSes = new Element('thead', {}).insert(theadrowSes);
                this.tbodySession = new Element('tbody', {});

                var thSched = new Element('th', { 'id': 'idThSched', 'class': 'myLearning_widthTitleSessCT' }).insert(global.getLabel('sched'));
                var thLocat = new Element('th', { 'id': 'idThLocat', 'class': 'myLearning_widthPeriodCT' }).insert(global.getLabel('location'));
                var thLangu = new Element('th', { 'id': 'idThLangu', 'class': 'myLearning_widthDurationCT' }).insert(global.getLabel('language'));
                var thReser = new Element('th', { 'id': 'idThReser', 'class': 'myLearning_widthDurationCT' }).insert(global.getLabel('bookings')); ///global.getLabel('reserved'));
                var thWaiti = new Element('th', { 'id': 'idThWaiti', 'class': 'myLearning_widthDurationCT' }).insert(global.getLabel('waiting'));
                var thStatu = new Element('th', { 'id': 'idThStatu', 'class': 'myLearning_widthDurationCT' }).insert(global.getLabel('status'));
                var thActio = new Element('th', { 'id': 'idThActio', 'class': 'myLearning_widthSessionsCT' }).insert('&nbsp;');

                theadrowSes.insert(thSched);
                theadrowSes.insert(thLocat);
                theadrowSes.insert(thLangu);
                theadrowSes.insert(thReser);
                theadrowSes.insert(thWaiti);
                theadrowSes.insert(thStatu);
                theadrowSes.insert(thActio);

                tableSession.insert(theadSes);
                tableSession.insert(this.tbodySession);
                infoPrebook.insert(tableSession);
                infoPrebook.insert('<div>&nbsp;</div>');

                var numSes = this.hashOfPrebookings.get(trainingId + '_' + employeeId).sessions.size();
                for (var j = 0; j < numSes; j++) {
                    var total = parseInt(this.hashOfPrebookings.get(trainingId + '_' + employeeId).sessions[j]['@maximum'], 10);
                    var booked = parseInt(this.hashOfPrebookings.get(trainingId + '_' + employeeId).sessions[j]['@bookings'], 10);
                    var optimum = parseInt(this.hashOfPrebookings.get(trainingId + '_' + employeeId).sessions[j]['@optimum'], 10);
                    var objid = this.hashOfPrebookings.get(trainingId + '_' + employeeId).sessions[j]['@objid'];
                    var startdate = this.hashOfPrebookings.get(trainingId + '_' + employeeId).sessions[j]['@begda'];
                    var enddate = this.hashOfPrebookings.get(trainingId + '_' + employeeId).sessions[j]['@endda'];

                    var schedule = Date.parseExact(startdate, 'yyyy-MM-dd').toString(global.getDateFormat()) + '-' + Date.parseExact(enddate, 'yyyy-MM-dd').toString(global.getDateFormat());
                    var trbodyrowSes = new Element('tr', { 'class': 'learningOverview_tableSession2 application_main_soft_text' });
                    var displayCBut = '';
                    var bookCourseBut = '';
                    if (!Object.isEmpty(this.hashOfPrebookings.get(trainingId + '_' + employeeId).sessions[j].buttons)) {
                        var buttonSessions = objectToArray(this.hashOfPrebookings.get(trainingId + '_' + employeeId).sessions[j].buttons.yglui_vie_tty_ac);
                        var numButtons = buttonSessions.length ? buttonSessions.length : 0;
                        for (var n = 0; n < numButtons; n++) {
                            switch (buttonSessions[n]['@actio']) {
                                case 'LSOBOOK':
                                    bookCourseBut = buttonSessions[n];
                                    break;
                                case 'LSODISPLAYC':
                                    displayCBut = buttonSessions[n];
                                    break;
                            }
                        }
                    }

                    if (booked < optimum)
                        var color = '#55D455'; //green
                    else if (booked >= optimum && booked < total)
                        var color = '#D6AE00'; //yellow
                    else if (booked == total)
                        var color = '#FF0000'; //red
                    var barLenght = (40 / total) * booked;
                    var reserved = global.getLabel('reserved2') + ' ' + booked + '/ ' + global.getLabel('available') + ': ' + total;
                    var tdActionCSch = new Element('td', { 'id': 'idPrebookSessionSch_' + trainingId + '_' + this.hashOfPrebookings.get(trainingId + '_' + employeeId).sessions[j]['@objid'] + ']' });
                    trbodyrowSes.insert(tdActionCSch);
                    trbodyrowSes.insert('<td class="myLearning_widthPeriodCT">' + prepareTextToShow(this.hashOfPrebookings.get(trainingId + '_' + employeeId).sessions[j]['@location']) + '</td>');
                    trbodyrowSes.insert('<td class="myLearning_widthDurationCT">' + prepareTextToShow(this.hashOfPrebookings.get(trainingId + '_' + employeeId).sessions[j]['@language']) + '</td>');
                    if (!global.liteVersion) {
                        trbodyrowSes.insert('<td class="myLearning_widthDurationCT"><div title = "' + reserved + '" class="application_book_allowed"><div id="application_book_bar' + j + '" class="application_book_reserved" style="width:' + barLenght + 'px; background-color:' + color + '"></div></div></td>');
                    }
                    else {
                        trbodyrowSes.insert('<td class="myLearning_widthDurationCT"><div title = "' + reserved + '" class="application_book_allowed"><div id="application_book_bar' + j + '" class="application_book_reserved"></div>' + reserved + '</div></td>');
                    }
                    trbodyrowSes.insert('<td class="myLearning_widthSessionsCT">' + parseInt(prepareTextToShow(this.hashOfPrebookings.get(trainingId + '_' + employeeId).sessions[j]['@waiting']), 10) + '</td>');
                    trbodyrowSes.insert('<td class="myLearning_widthDurationCT">' + global.getLabel(this.hashOfPrebookings.get(trainingId + '_' + employeeId).sessions[j]['@status']) + '</td>');
                    //get actions    
                    var sessionButtonAct = new Element('div', { 'id': 'idDivPrebookSession_' + trainingId + '_' + this.hashOfPrebookings.get(trainingId + '_' + employeeId).sessions[j]['@objid'] + ']' });
                    var jsonSessionButtonAct = {
                        elements: []
                    };
                    var sessionButton = {
                        label: schedule,
                        toolTip: schedule,
                        idButton: 'idDivPrebookSession_' + trainingId + this.hashOfPrebookings.get(trainingId + '_' + employeeId).sessions[j]['@objid'] + ']',
                        className: 'application_action_link_noUnderline myLearning_widthTitleSessCT',
                        handler: this.showViewDetails.bindAsEventListener(this, this.hashOfPrebookings.get(trainingId + '_' + employeeId).sessions[j]['@objid'], 'E', displayCBut, startdate, enddate),
                        type: 'link',
                        standardButton: false
                    };
                    jsonSessionButtonAct.elements.push(sessionButton);
                    sessionButtonAct.insert(new megaButtonDisplayer(jsonSessionButtonAct).getButtons());
                    tdActionCSch.insert(sessionButtonAct);
                    this.tbodySession.insert(trbodyrowSes);
                    var tdActionC = new Element('td', { 'id': 'idPrebookSession_' + trainingId + '_' + this.hashOfPrebookings.get(trainingId + '_' + employeeId).sessions[j]['@objid'] + ']' });
                    if (!Object.isEmpty(bookCourseBut)) {
                        //buttons                       
                        var bookButtonAct = new Element('div', { 'id': 'idBookButtonAct_' + trainingId, 'class': 'fieldsPanel_deleteButton', 'title': bookCourseBut['@actiot'] });
                        var jsonBookButtonAct = {
                            elements: []
                        };
                        if (global.liteVersion) {
                            var bookIcon = global.getLabel('book');
                        } else {
                            var bookIcon = '';
                        }
                        var bookButton = {
                            label: bookIcon,
                            toolTip: global.getLabel('book'),
                            idButton: 'idBookButton_' + trainingId,
                            handler: this.makeBooking.bindAsEventListener(this, this.hashOfPrebookings.get(trainingId + '_' + employeeId).sessions[j]['@objid'], employeeId, startdate, enddate),
                            className: 'learning_bookingIcon fieldsPanel_deleteButton',
                            type: 'link',
                            standardButton: false
                        };
                        jsonBookButtonAct.elements.push(bookButton);
                        bookButtonAct.insert(new megaButtonDisplayer(jsonBookButtonAct).getButtons());
                        tdActionC.insert(bookButtonAct);
                        trbodyrowSes.insert(tdActionC);
                        this.tbodySession.insert(trbodyrowSes);
                    }
                    else {
                        trbodyrowSes.insert(tdActionC);
                        this.tbodySession.insert(trbodyrowSes);
                    }
                }
            } else {
                var noResult = new Element('div', { 'id': 'idnoResults', 'class': 'application_catalog_noFound' }).insert(global.getLabel('noResults'));
                infoPrebook.insert(noResult);
            }
            //add more Offerings
            if (this.hashOfPrebookings.get(trainingId + '_' + employeeId).moreOffBut) {
                infoPrebook.insert('<div class="application_action_link_noUnderline application_prebook_user_message">' + this.hashOfPrebookings.get(trainingId + '_' + employeeId).moreOffBut['@actiot'] + '</div>');
            }
        }
    },

    showViewDetails: function (event, objId, type, button, begda, endda) {
        var nextApp = button['@tarap'];
        var tabId = button['@tartb'];
        var view = button['@views'];
        var disma = button['@disma'];
        var okCode = button['@okcod'];
        var begda = begda;
        var endda = endda;
        global.open($H({
            app: {
                appId: nextApp,
                tabId: tabId,
                view: view
            },
            objectId: objId,
            oType: type,
            parentType: type,
            displayMode: 'display',
            disma: disma,
            begda: begda,
            endda: endda,
            okCode: okCode
        }));

    },
    /**     
    *@description It toggles the filter options div 
    */
    toggleShowDetailsPreb: function (event, trainingId, employeeId) {
        this.showPrebookingsDetails(trainingId, employeeId);
        if (this.virtualHtml.down('[id=idShowDetails_' + trainingId + '_' + employeeId + ']').hasClassName('learning_listArrowBlue')) {
            this.virtualHtml.down('[id=idShowDetails_' + trainingId + '_' + employeeId + ']').removeClassName('learning_listArrowBlue');
            this.virtualHtml.down('[id=idShowDetails_' + trainingId + '_' + employeeId + ']').addClassName('learning_listArrowBlueDown');
            this.virtualHtml.down('[id=trPrebook_' + trainingId + '_' + employeeId + ']').addClassName('myLearningApp_trOpenedBgColor');
            this.virtualHtml.down('[id=trPrebook_' + trainingId + '_' + employeeId + ']').removeClassName('myLearningApp_borderTr');
            if (this.trainingIdOpened)
                this.virtualHtml.down('[id=trPrebook_' + this.trainingIdOpened + '_' + employeeId + ']').removeClassName('myLearningApp_borderTr');
            if (global.liteVersion) {
                arrowIcon = '˅';
                this.virtualHtml.down('[id=idShowDetails_' + trainingId + '_' + employeeId + ']').update(arrowIcon);
            }

        } else {
            this.virtualHtml.down('[id=idShowDetails_' + trainingId + '_' + employeeId + ']').removeClassName('learning_listArrowBlueDown');
            this.virtualHtml.down('[id=idShowDetails_' + trainingId + '_' + employeeId + ']').addClassName('learning_listArrowBlue');
            this.virtualHtml.down('[id=trPrebook_' + trainingId + '_' + employeeId + ']').removeClassName('myLearningApp_trOpenedBgColor');
            this.virtualHtml.down('[id=trPrebook_' + trainingId + '_' + employeeId + ']').addClassName('myLearningApp_borderTr');
            if (this.trainingIdOpened)
                this.virtualHtml.down('[id=trPrebook_' + this.trainingIdOpened + '_' + this.employeeIdOpened + ']').addClassName('myLearningApp_borderTr');
            if (global.liteVersion) {
                arrowIcon = '>';
                this.virtualHtml.down('[id=idShowDetails_' + trainingId + '_' + employeeId + ']').update(arrowIcon);
            }
        }
    },

    /**
    * @method makeBooking
    * @desc make a book
    */
    makeBooking: function (event, sessionId, employeeId, begda, endda) {
        var xmlParser = new XML.ObjTree();
        xmlParser.attr_prefix = '@';
        var obj = { I_BUTTON: this.hashOfButtons.get('LSO_BOOK_E').info };
        var xmlDoc = xmlParser.writeXML(obj);
        xmlDoc = xmlDoc.gsub(xmlDoc.truncate(40, ''), '');
        this.employeeSelected = global.getSelectedEmployees();
        this.xmlCreateBook = "<EWS>"
                                + "<SERVICE>" + this.createBook + "</SERVICE>"
                                + "<OBJECT TYPE=\"E\">" + sessionId + "</OBJECT>"
                                + "<PARAM>"
                                    + "<O_TABLE_PERNR>";
        //for (var i = 0; i < this.employeeSelected.length; i++) {
        this.xmlCreateBook += "<yglui_tab_pernr pernr=\"" + employeeId/*this.employeeSelected[i]*/ + "\"/>";
        //}
        this.xmlCreateBook += "</O_TABLE_PERNR>"
                               + "<I_BEGDA>" + begda + "</I_BEGDA>"
                               + "<I_ENDDA>" + endda + "</I_ENDDA>"
                               + xmlDoc
                            + "</PARAM>"
                        + "</EWS>";

        this.makeAJAXrequest($H({ xml: this.xmlCreateBook,
            successMethod: 'book_processBook'
        }));

    },
    /**
    * @description Shows the status of the booking after calling SAP
    * @param req Result of the AJAX request
    */
    book_processBook: function (req) {
        var status = "<div id='application_book_contain_status'>"
                    + "<h2 id='application_book_status_title' class='application_book_status'>" + global.getLabel('status') + "</h2>";
        var pernrTable = objectToArray(req.EWS.o_table_pernr.yglui_tab_pernr);
        var pernrNames = objectToArray(req.EWS.o_pernr_name.yglui_str_popul_obj);
        if (Object.isEmpty(req.EWS.o_message)) {
            for (var j = 0; j < pernrTable.size(); j++) {
                var pernr = pernrTable[j]['@pernr'];
                var namepernr = pernrNames[j]['@name'];
                status += "<div class='application_book_status_line'><div class='application_icon_green align_application_book_icons'></div><div class='application_book_status_pernr'>" + namepernr + ' [' + pernr + ']' + "</div><div class='application_book_status_label'>" + global.getLabel('statusOk') + "</div></div>";
            }
        }
        else {
            var message = objectToArray(req.EWS.o_message.yglui_tab_message);
            var namepernr = '';
            for (var j = 0; j < pernrTable.size(); j++) {
                var pernr = pernrTable[j]['@pernr'];
                var warningIcon = false;
                var errorIcon = false;
                for (var i = 0; i < message.size(); i++) {
                    var employee = message[i]['@pernr'];
                    if (pernr == employee) {
                        for (var x = 0; x < pernrNames.size(); x++) {
                            if (pernrNames[x]['@objid'] == employee) {
                                namepernr = pernrNames[x]['@name'];
                            }
                        }
                        var type = message[i]['@type'];
                        if (type == 'E' || type == 'W') {
                            var cssClass = type == 'E' ? 'application_icon_red' : 'application_icon_orange';
                            var error = prepareTextToShow(message[i]['@message']);
                            var label = type == 'E' ? global.getLabel('statusError') : global.getLabel('statusOk');
                            if ((type == 'E' && !errorIcon) || (type == 'W' && !warningIcon)) {
                                status += "<div class='application_book_status_line'><div class='" + cssClass + " align_application_book_icons'></div><div class='application_book_status_pernr'>" + namepernr + ' [' + employee + ']' + "</div><div class='application_book_status_label'>" + label + "</div><div></div><div class='application_book_status_error_message'>" + error + "</div></div>";
                                warningIcon = true;
                                errorIcon = true;
                            } else if (warningIcon || errorIcon) {
                                status += "<div class='application_book_status_line'><div class='application_book_status_error_message'>" + error + "</div></div>";
                            }
                        }
                        else if (type == 'S') {
                            status += "<div class='application_book_status_line'><div class='application_icon_green align_application_book_icons'></div><div class='application_book_status_pernr'>" + namepernr + ' [' + employee + ']' + "</div><div class='application_book_status_label'>" + global.getLabel('statusOk') + "</div></div>";
                        }
                    }
                }
            }
        }
        status += "</div>";
        var _this = this;
        var contentHTML = new Element('div');
        contentHTML.insert(status);
        //buttons
        var buttonsJson = {
            elements: [],
            mainClass: 'moduleInfoPopUp_stdButton_div_right'
        };
        //where to go when cancelling     
        var callBack = function () {
            if (_this)
                _this.modify_preb(req);
            bookStatusPopUp.close();
            delete bookStatusPopUp;
        };
        var aux2 = {
            idButton: 'goTo',
            label: global.getLabel('ok'),
            handlerContext: null,
            className: 'moduleInfoPopUp_stdButton',
            handler: callBack,
            type: 'button',
            standardButton: true
        };

        buttonsJson.elements.push(aux2);
        var ButtonObj = new megaButtonDisplayer(buttonsJson);
        var buttons = ButtonObj.getButtons();
        //insert buttons in div
        contentHTML.insert(buttons);

        var bookStatusPopUp = new infoPopUp({

            closeButton: $H({
                'textContent': 'Close',
                'callBack': function () {
                    if (_this)
                        _this.modify_preb(req);
                    bookStatusPopUp.close();
                    delete bookStatusPopUp;
                }
            }),
            htmlContent: contentHTML,
            indicatorIcon: 'information',
            width: 600
        });
        bookStatusPopUp.create();
    },
    /**
    * @description Method that cancel a booking after the user confirmation
    */
    getCancelBookingReasons: function (event, trainingId, idEmployeeSelected) {
        this.actualEmployeeId = idEmployeeSelected;
        if (Object.isEmpty(this.jsonReasons)) {
            var xmlReasons = "<EWS><SERVICE>" + this.cancelReasonsService + "</SERVICE></EWS>";
            this.makeAJAXrequest($H({ xml: xmlReasons, successMethod: 'cancelBooking', ajaxID: { trainingId: trainingId, idEmployeeSelected: idEmployeeSelected} }));
        } else {
            this.cancelBooking(this.jsonReasons, { trainingId: trainingId, idEmployeeSelected: idEmployeeSelected });
        }
    },
    /**
    * @description Method that cancel a booking after the user confirmation
    */
    cancelBooking: function (json, bookingInformation) {
        var cancelBookingHtml = "<div>"
                           + "<div>" + global.getLabel('cancellationReason') + "</div>"
                           + "<div><div id='cancelBookingAutocompleter' style='margin-top:10px;margin-bottom:10px;'></div></div>"
                           + "<div class ='dynamicFieldsPanelTable'>" + global.getLabel('cancellationConf') + "</div>"
                           + "</div>";
        var _this = this;
        var contentHTML = new Element('div');
        contentHTML.insert(cancelBookingHtml);
        //buttons
        var buttonsJson = {
            elements: [],
            mainClass: 'moduleInfoPopUp_stdButton_div_right'
        };
        var callBack = function () {
            if (_this)
                _this.cancelBookingRequest(bookingInformation.trainingId, bookingInformation.idEmployeeSelected);
            cancelCoursePopUp.close();
            delete cancelCoursePopUp;
        };
        var callBack3 = function () {
            cancelCoursePopUp.close();
            delete cancelCoursePopUp;
        };
        var aux2 = {
            idButton: 'Yes',
            label: global.getLabel('yes'),
            handlerContext: null,
            className: 'moduleInfoPopUp_stdButton',
            handler: callBack,
            type: 'button',
            standardButton: true
        };
        var aux3 = {
            idButton: 'No',
            label: global.getLabel('no'),
            handlerContext: null,
            className: 'moduleInfoPopUp_stdButton',
            handler: callBack3,
            type: 'button',
            standardButton: true
        };
        buttonsJson.elements.push(aux2);
        buttonsJson.elements.push(aux3);
        this.ButtonObj = new megaButtonDisplayer(buttonsJson);
        var buttons = this.ButtonObj.getButtons();
        this.ButtonObj.disable('Yes');
        //insert buttons in div
        contentHTML.insert(buttons);

        var cancelCoursePopUp = new infoPopUp({

            closeButton: $H({
                'textContent': 'Close',
                'callBack': function () {

                    cancelCoursePopUp.close();
                    delete cancelCoursePopUp;
                }
            }),
            htmlContent: contentHTML,
            indicatorIcon: 'information',
            width: 600
        });
        cancelCoursePopUp.create();
        // Autocompleter initialization
        if (!Object.isEmpty(json.EWS)) {//first run of cancelBooking, building autocompleter structure
            this.jsonReasons = {
                autocompleter: {
                    object: [],
                    multilanguage: {
                        no_results: global.getLabel('noresults'),
                        search: global.getLabel('DM_SEARCH')
                    }
                }
            }
            for (var i = 0; i < json.EWS.o_values.item.length; i++) {
                var data = json.EWS.o_values.item[i]['@id'];
                var text = prepareTextToShow(json.EWS.o_values.item[i]['@value']);
                this.jsonReasons.autocompleter.object.push({
                    data: data,
                    text: text
                });
            }
        }
        this.reasonsAutocompleter = new JSONAutocompleter('cancelBookingAutocompleter', {
            showEverythingOnButtonClick: true,
            autoWidth: true,
            timeout: 8000,
            templateOptionsList: '#{text}',
            events: $H({ onResultSelected: 'EWS:cancelBookingReasonAutocompleter_resultSelected' })
        }, this.jsonReasons);

    },
    /**
    * @description Fired when it has been chosen a value in the reasons autocompleter, enables/disables the 'yes' button
    */
    cancelBookingConfBoxButton: function (args) {
        if (!Object.isEmpty(getArgs(args)) && (getArgs(args).isEmpty == false)) {
            this.ButtonObj.enable('Yes');
            this.reasonChosen = getArgs(args).idAdded;

        } else {
            this.ButtonObj.disable('Yes');
        }
    },
    /**
    * @description Builds the xml and send it to SAP for the cancel request
    */
    cancelBookingRequest: function (trainingId, idEmployeeSelected) {
        var xmlParser = new XML.ObjTree();
        xmlParser.attr_prefix = '@';
        var obj = { I_BUTTON: this.hashOfButtons.get('LSOCANCELBOOKINGC').info };
        var xmlDoc = xmlParser.writeXML(obj);
        xmlDoc = xmlDoc.gsub(xmlDoc.truncate(40, ''), '');
        var xml = "<EWS>"
             + "<SERVICE>" + this.cancelBookingService + "</SERVICE>"
             + "<OBJECT TYPE=\"E\">" + trainingId + "</OBJECT>"
             + "<PARAM>"
             + "<O_PERNR>" + idEmployeeSelected + "</O_PERNR>"
             + "<O_REASON>" + this.reasonChosen + "</O_REASON>"
             + xmlDoc
             + "</PARAM>"
             + "</EWS>";
        this.makeAJAXrequest($H({ xml: xml, successMethod: 'cancelBookingAnswer' }));
    },
    /**
    * @description Receives the answer from SAP about the cancel booking request.
    */
    cancelBookingAnswer: function (answer) {
        if (answer.EWS.o_message) {
            var message = new Element('div', {}).insert(answer.EWS.o_message);
            var _this = this;
            this.myPopUp = new infoPopUp({
                closeButton: $H({
                    'callBack': function () {
                        _this.myPopUp.close();
                        delete _this.myPopUp;
                    } .bind(this)
                }),
                htmlContent: message,
                indicatorIcon: 'information',
                width: 500
            });
            this.myPopUp.create();
        }
        //refresh LMS application
        global.open($H({
            app: {
                appId: this.options.appId,
                tabId: this.options.tabId,
                view: this.options.view
            }
        }));
    },
    /*++++++++++++++++++++++++++++++++++ END PREBOOKINGS WIDGET +++++++++++++++++++++++++++++++++++++++++++*/

    /*++++++++++++++++++++++++++++++++++ BOOKINGS WIDGET +++++++++++++++++++++++++++++++++++++++++++*/
    setBookings: function (employeeId) {
        var idEmployeeSelected = objectToArray(employeeId);
        var xmlEmployees = "";
        for (var i = 0; i < idEmployeeSelected.length; i++) {
            xmlEmployees += " <YGLUI_TAB_PERNR PERNR = \" " + idEmployeeSelected[i] + " \" />"
        }
        this.xmlGetTrainings = '<EWS>'
                            + "<SERVICE>" + this.bookingService + "</SERVICE>"
                            + "<OBJECT TYPE='P'>" + idEmployeeSelected[0] + "</OBJECT>"
                            + "<PARAM>"
                                + "<CONTAINER_PARENT>" + this.containerParent + "</CONTAINER_PARENT>"
							    + "<CONTAINER_CHILD>" + this.options.appId + "</CONTAINER_CHILD>"
                                + "<I_PERNR>" + xmlEmployees + "</I_PERNR>"
                            + "</PARAM>"
                            + '</EWS>';
        this.makeAJAXrequest($H({ xml: this.xmlGetTrainings, successMethod: 'addListBooking', ajaxID: 'prebook' }));
    },
    /*
    * @method buildListView
    * @desc creates the list view TABLE.
    */
    addListBooking: function (req) {
        var fromSearch = false;

        this.bookLabels = objectToArray(req.EWS.labels.item);
        var tempArray = $A();
        if (this.bookLabels) {
            objectToArray(this.bookLabels).each(function (item) {
                tempArray.push({ text: prepareTextToShow(item['@value']), data: item['@id'] });
            }, this);
        }
        tempArray.push({ text: '', data: '' });
        var json = {
            autocompleter: {
                object: tempArray,
                multilanguage: {
                    no_results: global.getLabel('noresults'),
                    search: global.getLabel('DM_SEARCH')
                }
            }
        }
        this.statusBookingAutComp.updateInput(json);
        if (!Object.isEmpty(req.EWS.o_bookings)) {
            var courses = objectToArray(req.EWS.o_bookings.yglui_str_my_learn_e);
            var courseLength = courses.length;
            for (var i = 0; i < courseLength; i++) {
                //Get actions for each course type
                if (!Object.isEmpty(courses[i].buttons)) {
                    var buttonsBook = objectToArray(courses[i].buttons.yglui_vie_tty_ac);
                    var numButtons = buttonsBook.length;
                    var displayCBut = '';
                    var cancelBookBut = '';
                    for (var n = 0; n < numButtons; n++) {
                        switch (buttonsBook[n]['@actio']) {
                            case 'LSODISPLAYCT':
                                displayCTBut = buttonsBook[n];
                                this.prevAppId.set(buttonsBook[n]['@tarap']);
                                break;
                            case 'LSODISPLAYCURT':
                                displayCTBut = buttonsBook[n];
                                this.prevAppId.set(buttonsBook[n]['@tarap']);
                                break;
                            case 'LSODISPLAYC':
                                displayCBut = buttonsBook[n];
                                this.prevAppId.set(buttonsBook[n]['@tarap']);
                                break;
                            case 'LSODISPLAYCUR':
                                displayCBut = buttonsBook[n];
                                this.prevAppId.set(buttonsBook[n]['@tarap']);
                                break;
                            case 'LSOCANCELBOOKINGCUR':
                                cancelBookBut = buttonsBook[n];
                                break;
                            case 'LSOCANCELBOOKINGC':
                                cancelBookBut = buttonsBook[n];
                                break;
                        }
                    }

                } else {
                    var buttonsBook = "";
                }
                if (courses[i].appoint)
                    var appointBook = objectToArray(courses[i].appoint.yglui_str_appointment);
                else
                    var appointBook = $A();
                //crate the hash            
                var employeeId = Object.isEmpty(courses[i]['@pernr']) ? '' : courses[i]['@pernr'];
                var employeeName = global.getEmployee(employeeId).name;
                this.hashOfBookings.set(courses[i]['@objid'] + "_" + employeeId, {
                    trainingId: Object.isEmpty(courses[i]['@objid']) ? '' : courses[i]['@objid'],
                    title: Object.isEmpty(courses[i]['@title']) ? '' : prepareTextToShow(courses[i]['@title_parent']),
                    schedule: Date.parseExact(courses[i]['@begda'], 'yyyy-MM-dd').toString('dd.MM.yyyy') + '-' + Date.parseExact(courses[i]['@endda'], 'yyyy-MM-dd').toString('dd.MM.yyyy'),
                    begda: Object.isEmpty(courses[i]['@begda']) ? '' : courses[i]['@begda'],
                    endda: Object.isEmpty(courses[i]['@endda']) ? '' : courses[i]['@endda'],
                    employeeId: employeeId, //this.actualEmployeeId,
                    employeeName: employeeName, //this.actualEmployeeName,
                    location: Object.isEmpty(courses[i]['@location']) ? '' : prepareTextToShow(courses[i]['@location']),
                    language: Object.isEmpty(courses[i]['@language']) ? '' : prepareTextToShow(courses[i]['@language']),
                    parent_id: Object.isEmpty(courses[i]['@objid_parent']) ? '' : courses[i]['@objid_parent'],
                    status: Object.isEmpty(courses[i]['@status']) ? '' : courses[i]['@status'],
                    type: Object.isEmpty(courses[i]['@otype']) ? '' : courses[i]['@otype'],
                    type_parent: Object.isEmpty(courses[i]['@otype_parent']) ? '' : courses[i]['@otype_parent'],
                    buttons: buttonsBook,
                    appoint: appointBook,
                    viewDetBook: displayCBut,
                    viewDetCTBook: displayCTBut,
                    cancelBookBut: cancelBookBut
                });
            }
        }
        this.createBookingsTable(fromSearch);
    },
    /*
    * @method It deletes the bookings for one employee when the employee is unselected
    * @desc creates the list view TABLE.
    */
    deleteListBooking: function (employeeId) {

        //unset elements for the hash 

        for (var i = 0; i < this.hashOfBookings.keys().length; i++) {
            if (employeeId == this.hashOfBookings.get(this.hashOfBookings.keys()[i]).employeeId) {
                this.hashOfBookings.unset(this.hashOfBookings.keys()[i]);
                i--;
            }
        }
        //this.createBookingsTable(false);
    },
    applyFilterBookings: function () {
        //filter options selected
        this.foBookType = this.typeFilterSelected;
        this.foBookStatus = this.statusFilterSelected;
        this.foBookDateFrom = this.objDateFromBook.actualDate;
        this.foBookDateTo = this.objDateToBook.actualDate;
        this.addFilterOptionsBook(true);
        this.createBookingsTable(true);
    },
    createBookingsTable: function (fromSearch) {
        if (!this.divListBooking) {
            this.divListBooking = new Element('div', { 'id': this.applicationId + '_divListBooking', 'class': 'mylearning_scroll' });
            this.idWidgetBook.insert(this.divListBooking);
        }
        if (!this.tableBook) {
            this.tableBook = new Element('table', { 'id': 'idTableBooking', 'class': 'sortable mylearning_marginTable' }); //resizable
            var theadrow = new Element('tr', {});
            var thead = new Element('thead', {}).insert(theadrow);
            this.tbodyBook = new Element('tbody', {});
            if (this.userManBook == 'X') {
                theadrow.insert(new Element('th', { 'id': 'EMPLOYEE', 'class': 'myLearning_widthPeriodCT' }).insert(global.getLabel('EMPLOYEE')));
            }
            theadrow.insert(new Element('th', { 'id': 'trainingTitle', 'class': 'myLearning_widthTitleCT' }).insert(global.getLabel('trainingTitle')));
            theadrow.insert(new Element('th', { 'id': 'sched', 'class': 'myLearning_widthPeriodCT' }).insert(global.getLabel('sched')));
            theadrow.insert(new Element('th', { 'id': 'location', 'class': 'myLearning_widthPeriodCT' }).insert(global.getLabel('location')));
            theadrow.insert(new Element('th', { 'id': 'language', 'class': 'myLearning_widthDurationCT' }).insert(global.getLabel('language')));
            theadrow.insert(new Element('th', { 'id': 'status', 'class': 'myLearning_widthPeriodCT' }).insert(global.getLabel('status')));
            theadrow.insert(new Element('th', { 'id': 'Actions', 'class': 'myLearning_widthActionCT' }).insert(new Element('span', { 'class': 'linedTree_hidden TPreferencesDescriptionToShow' }).insert(global.getLabel('KM_ACTIONS'))));

            this.oldTheadBook = thead.cloneNode(true);
            this.tableBook.insert(thead);
            this.tableBook.insert(this.tbodyBook);
            this.divListBooking.insert(this.tableBook);
        }
        else {
            var thead = this.oldTheadBook.cloneNode(true);
            //this.tablePreb.tHead.parentNode.replaceChild(thead, this.tablePreb.tHead);
            $('idTableBooking').tHead.parentNode.replaceChild(thead, $('idTableBooking').tHead);
            this.tbodyBook.update('');
        }
        this.observeLinkBookings = $H();
        var numBookings = this.hashOfBookings.keys().length;
        for (var i = 0; i < numBookings; i++) {
            var beginnings = Date.parseExact(this.hashOfBookings.get(this.hashOfBookings.keys()[i]).endda, 'yyyy-MM-dd').toString(global.getDateFormat());
            var ends = Date.parseExact(this.hashOfBookings.get(this.hashOfBookings.keys()[i]).endda, 'yyyy-MM-dd').toString(global.getDateFormat());
            var schedule = beginnings + ' - ' + ends;
            var typeObjBook = this.hashOfBookings.get(this.hashOfBookings.keys()[i]).type;
            var trainingId = this.hashOfBookings.get(this.hashOfBookings.keys()[i]).trainingId;
            var employeeId = this.hashOfBookings.get(this.hashOfBookings.keys()[i]).employeeId;
            var trbodyrow = new Element('tr', { 'id': 'trBook_' + trainingId });
            var color;
            color = this.getEmployee(this.hashOfBookings.get(this.hashOfBookings.keys()[i]).employeeId).color;
            if (Object.isUndefined(color)) color = 0;
            if (!Object.isNumber(color)) color = 0;
            color = "eeColor" + color.toPaddedString(2);
            var jsonTitleBook = {
                elements: []
            };
            var titleButtonBook = {
                label: this.hashOfBookings.get(this.hashOfBookings.keys()[i]).title,
                toolTip: this.hashOfBookings.get(this.hashOfBookings.keys()[i]).title,
                idButton: 'idButBookCT' + trainingId,
                handler: this.showViewDetails.bindAsEventListener(this, this.hashOfBookings.get(this.hashOfBookings.keys()[i]).parent_id, this.hashOfBookings.get(this.hashOfBookings.keys()[i]).type_parent, this.hashOfBookings.get(this.hashOfBookings.keys()[i]).viewDetCTBook, this.hashOfBookings.get(this.hashOfBookings.keys()[i]).begda, this.hashOfBookings.get(this.hashOfBookings.keys()[i]).endda),
                className: 'application_action_link_noUnderline learning_marginLeftTable',
                type: 'link',
                standardButton: false
            };
            jsonTitleBook.elements.push(titleButtonBook);
            var divTitleBookCT = new Element('div', { 'id': 'idBookCTDiv_' + trainingId + '_' + employeeId, 'class': 'application_action_link_noUnderline' });
            divTitleBookCT.insert(new megaButtonDisplayer(jsonTitleBook).getButtons());
            this.observeLinkBookings.set('idBookCTDiv_' + trainingId + '_' + employeeId, jsonTitleBook);
            var titleBookCT = new Element('div', { 'id': 'idBookCT_' + trainingId + '_' + employeeId, 'class': 'application_action_link_noUnderline' });
            titleBookCT.insert(divTitleBookCT); var tdTitleBook = new Element('td', { 'id': 'idTitleBookCT', 'class': 'myLearning_widthTitleCT myLearning_widthTitleCT' });
            tdTitleBook.insert(titleBookCT);

            if (typeObjBook == 'EC') {
                var iconCurriculum = new Element('div', { 'id': 'idTitleBookCurrT', 'class': 'gcm_dependantField application_inProgress_training_icon_curr_div', 'title': global.getLabel('EC') });
                tdTitleBook.insert(iconCurriculum);
            }
            if (this.userManBook == 'X') {
                var tdEmployee = new Element('td', { 'class': 'myLearning_widthPeriodCT' }).insert(new Element('div', { 'class': 'application_color_' + color }).insert(this.hashOfBookings.get(this.hashOfBookings.keys()[i]).employeeName));
                trbodyrow.insert(tdEmployee);
            }
            trbodyrow.insert(tdTitleBook);
            var jsonSchBook = {
                elements: []
            };
            var titleSchBook = {
                label: schedule,
                toolTip: schedule,
                idButton: 'idButBookC' + trainingId,
                handler: this.showViewDetails.bindAsEventListener(this, trainingId, typeObjBook, this.hashOfBookings.get(this.hashOfBookings.keys()[i]).viewDetBook, this.hashOfBookings.get(this.hashOfBookings.keys()[i]).begda, this.hashOfBookings.get(this.hashOfBookings.keys()[i]).endda),
                className: 'application_action_link_noUnderline learning_marginLeftTable',
                type: 'link',
                standardButton: false
            };
            jsonSchBook.elements.push(titleSchBook);
            var divSchBookCT = new Element('div', { 'id': 'idBookCDiv_' + trainingId + '_' + employeeId, 'class': 'application_action_link_noUnderline' });
            divSchBookCT.insert(new megaButtonDisplayer(jsonSchBook).getButtons());
            var schBookCT = new Element('div', { 'id': 'idBookC_' + trainingId + '_' + employeeId, 'class': 'application_action_link_noUnderline' });
            this.observeLinkBookings.set('idBookCDiv_' + trainingId + '_' + employeeId, jsonSchBook);
            schBookCT.insert(divSchBookCT); var tdSchBook = new Element('td', { 'id': 'idSchBookCT', 'class': 'myLearning_widthTitleCT myLearning_widthTitleCT' });
            tdSchBook.insert(schBookCT);
            trbodyrow.insert(tdSchBook);
            trbodyrow.insert('<td class="myLearning_widthPeriodCT">' + this.hashOfBookings.get(this.hashOfBookings.keys()[i]).location + '</td>');
            trbodyrow.insert('<td class="myLearning_widthDurationCT">' + this.hashOfBookings.get(this.hashOfBookings.keys()[i]).language + '</td>');
            trbodyrow.insert('<td class="myLearning_widthPeriodCT">' + global.getLabel(this.hashOfBookings.get(this.hashOfBookings.keys()[i]).status) + '</td>');
            var tdAction = new Element('td', { 'id': 'idActionBook', 'class': 'myLearning_widthActionCT' });
            var cancelBookAct = null;
            if (!Object.isEmpty(this.hashOfBookings.get(this.hashOfBookings.keys()[i]).cancelBookBut)) {
                cancelBookAct = new Element('div', { 'id': 'idCancelBookCT_' + trainingId + '_' + employeeId, 'title': this.hashOfBookings.get(this.hashOfBookings.keys()[i]).cancelBookBut['@actiot'] });

                if (global.liteVersion) {
                    var cancelIcon = 'X';
                }
                else {
                    var cancelIcon = '   ';
                }

                var cancelButton = {
                    label: cancelIcon,
                    idButton: 'idCancelAct_' + trainingId,
                    toolTip: global.getLabel('cancelBook'),
                    className: 'learning_deleteButton fieldsPanel_deleteButton',
                    handler: this.cancelBook.bindAsEventListener(this, trainingId, employeeId, typeObjBook, this.hashOfBookings.get(this.hashOfBookings.keys()[i]).buttons),
                    type: 'link',
                    standardButton: false
                };
                var jsonCancel = {
                    elements: []
                }
                jsonCancel.elements.push(cancelButton);
                var divCancel = new megaButtonDisplayer(jsonCancel).getButtons();
                cancelBookAct.insert(divCancel);
                this.observeLinkBookings.set('idCancelBookCT_' + trainingId + '_' + employeeId, jsonCancel);
                tdAction.insert(cancelBookAct);
            }
            trbodyrow.insert(tdAction);
            this.tbodyBook.insert(trbodyrow);
            if (!Object.isEmpty(cancelBookAct)) {
                //cancelBookAct.observe('click', this.cancelBook.bindAsEventListener(this, trainingId, employeeId, typeObjBook, this.hashOfBookings.get(this.hashOfBookings.keys()[i]).buttons));
            } else {
                cancelBookAct = new Element('div', { 'class': 'myLearning_emptyAction' });
                tdAction.insert(cancelBookAct);
            }

            //add action to show view details of a course type when click on the title  
            var begdaCT = Date.parseExact(this.hashOfBookings.get(this.hashOfBookings.keys()[i]).begda, 'yyyy-MM-dd').toString('dd.MM.yyyy');
            var enddaCT = Date.parseExact(this.hashOfBookings.get(this.hashOfBookings.keys()[i]).endda, 'yyyy-MM-dd').toString('dd.MM.yyyy');
            var buttonsBook = this.hashOfBookings.get(this.hashOfBookings.keys()[i]).buttons;
            buttonsBook.each(function (button) {
                switch (button['@actio']) {
                    case 'LSO_SET_APPOINT':

                        var setAppointmentAct = new Element('div', { 'id': 'idsetAppointmentCT_' + trainingId + '_' + employeeId, 'title': global.getLabel('setAppointment') });
                        if (global.liteVersion) {
                            var appointmentIcon = 'A';
                        }
                        else {
                            var appointmentIcon = '   ';
                        }
                        var appointmentButton = {
                            label: appointmentIcon,
                            idButton: 'idAppointmentAct_' + trainingId,
                            toolTip: global.getLabel('setAppointment'),
                            className: 'inlineElement learning_bookTrainingIcon',
                            handler: this.setAppointmentAct.bind(this, {
                                title: this.hashOfBookings.get(this.hashOfBookings.keys()[i]).title,
                                //begda:objectToSap(Date.parseExact(this.hashOfBookings.get(this.hashOfBookings.keys()[i]).begda,'yyyy-MM-dd')),
                                date: this.hashOfBookings.get(this.hashOfBookings.keys()[i]).appoint,
                                location: this.hashOfBookings.get(this.hashOfBookings.keys()[i]).location,
                                empId: this.hashOfBookings.get(this.hashOfBookings.keys()[i]).employeeId,
                                objid: this.hashOfBookings.get(this.hashOfBookings.keys()[i]).trainingId,
                                otype: this.hashOfBookings.get(this.hashOfBookings.keys()[i]).type
                            }),
                            type: 'link',
                            standardButton: false
                        };
                        var jsonAppointment = {
                            elements: []
                        }
                        jsonAppointment.elements.push(appointmentButton);
                        var divAppointment = new Element('div', { 'id': 'iddivSetAppointmentCT_' + trainingId, 'class': 'inlineElement learning_bookTrainingIcon', 'title': global.getLabel('setAppointment') });
                        divAppointment = new megaButtonDisplayer(jsonAppointment).getButtons();
                        setAppointmentAct.insert(divAppointment);
                        this.observeLinkBookings.set('idsetAppointmentCT_' + trainingId + '_' + employeeId, jsonAppointment);
                        tdAction.insert(setAppointmentAct);
                        break;
                }
            }, this);
            var begda = Date.parseExact(begdaCT, 'dd.MM.yyyy').toString('yyyy-MM-dd');
            var endda = Date.parseExact(enddaCT, 'dd.MM.yyyy').toString('yyyy-MM-dd');

        }
        if (!this.tableKBook) {
            var filtersStoring = $A();
            var j = 0;
            if (this.userManBook == 'X') {
                filtersStoring[j++] = { name: 'EMPLOYEE', main: true, label: global.getLabel('EMPLOYEE') };
            }
            filtersStoring[j++] = { name: 'trainingTitle', main: true, label: global.getLabel('trainingTitle') };
            filtersStoring[j++] = { name: 'sched', main: true, type: 'translatedDate', label: global.getLabel('sched'), future: true };
            filtersStoring[j++] = { name: 'location', main: true, label: global.getLabel('location') };
            filtersStoring[j++] = { name: 'language', main: true, label: global.getLabel('language') };
            filtersStoring[j++] = { name: 'status', main: true, label: global.getLabel('status') };
            filtersStoring[j++] = { name: 'Actions', main: true, label: global.getLabel('KM_ACTIONS') };

            this.tableKBook = new tableKitWithSearchAndPreferences($('idTableBooking'), { clearFilterButton: true, exportMenu: true, filters: filtersStoring, multiSelectionFilter: true, filterPerPage: 4, webSearch: true, noResultsLabel: global.getLabel('noSessions'), pagination: true, countWithEmptyCell: false, pages: 5 });
        }
        else {
            $('idTableBooking').tBodies[0].parentNode.replaceChild(this.tbodyBook, $('idTableBooking').tBodies[0]);
            this.tableKBook.instanceTableKit.filterDiv = null;
            this.tableKBook.instanceTableKit.divReportFilter = null;
            this.tableKBook.reloadTable($('idTableBooking'), true, true);
            if (this.tableKBook.mode != "new")
                this.rebuiltTable('idTableBooking');
        }
    },
    setAppointmentAct: function (a) {
        var xml = '<EWS>' +
				'<SERVICE>LRN_OUTLOOK</SERVICE>' +
				'<OBJECT TYPE="P">' + a.empId + '</OBJECT>' +
				'<DEL/>' +
				'<PARAM>' +
				  '<I_OTYPE>' + a.otype + '</I_OTYPE>' +
				  '<I_OBJID>' + a.objid + '</I_OBJID>' +
        //'<I_SUBJECT>' + global.getLabel('subjCourseBooking') + ' ' + global.getLabel('for') + ' ' + a.title + '</I_SUBJECT>' +
				  '<I_SUBJECT>' + a.title + '</I_SUBJECT>' +
				  '<I_LOCATION>' + a.location + '</I_LOCATION>' +
				  '<I_SCHEDULE>';
        a.date.each(function (sched) {
            xml += '<yglui_str_appoinment evdat="' + sched['@evdat'] + '" beguz="' + sched['@beguz'] + '" enduz="' + sched['@enduz'] + '"/>';
        }, this);

        xml += '</I_SCHEDULE>' +
				  '<I_MESSAGE>' + global.getLabel('youBookCourse') + ' \'' + a.title + '\'</I_MESSAGE>' +
				'</PARAM>' +
				'</EWS>';
        this.makeAJAXrequest($H({ xml: xml, successMethod: this.setAppointmentActAnswer.bind(this) }));
    },
    setAppointmentActAnswer: function (JSON) {
        var content = new Element('div');
        content.insert('<div>' + global.getLabel('appSent') + '<br>' + '<br>' + global.getLabel('checkSpan') + '</div>');
        var _this = this;

        //buttons
        var buttonsJson = {
            elements: [],
            mainClass: 'moduleInfoPopUp_stdButton_div_right'
        };
        var aux2 = {
            idButton: 'core_eval_ok_btn',
            label: global.getLabel('ok'),
            handlerContext: null,
            className: 'moduleInfoPopUp_stdButton',
            handler: function () {
                _this.myPopUp.close();
                delete _this.myPopUp;
            } .bind(this),
            type: 'button',
            standardButton: true
        };
        buttonsJson.elements.push(aux2);
        var ButtonObj = new megaButtonDisplayer(buttonsJson);
        var buttons = ButtonObj.getButtons();
        //insert buttons in div
        content.insert(buttons);

        this.myPopUp = new infoPopUp({
            closeButton: $H({
                'callBack': function () {
                    _this.myPopUp.close();
                    delete _this.myPopUp;
                    global.goToPreviousApp();
                } .bind(this)
            }),
            htmlContent: content,
            indicatorIcon: 'confirmation',
            width: 500
        });
        this.myPopUp.create();
    },
    /*
    * @method addFilterOptionsBook
    * @desc adds the filter options for the list.
    */
    addFilterOptionsBook: function (fromSearch) {
        ///widgets
        if (!fromSearch) {
            // refresh filter options values selected	            
            this.foBookType = '';
            this.foBookStatus = '';
            this.foBookDateFrom = '';
            this.foBookDateTo = '';

            this.divBookWidget = null;
            this.idWidgetBook = null;
            this.bookingWidget = null;
            this.divFilterOptionsBook = null;

            this.divBookWidget = new Element('div', { 'id': this.applicationId + 'divBookWidget', 'class': 'learning_marginWidget' });
            this.divAppMain.insert(this.divBookWidget);
            this.idWidgetBook = new Element('div', { 'id': 'idWidgetBook' });

            var objOptions = $H({
                title: global.getLabel('bookings'), // + ' ' + this.actualEmployeeName,
                collapseBut: true,
                contentHTML: this.idWidgetBook,
                onLoadCollapse: false,
                targetDiv: this.applicationId + 'divBookWidget'
            });
            this.bookingWidget = new unmWidget(objOptions);
        }
        this.divFilterOptionsBook = new Element('div', { 'id': this.options.appId + '_divFilterOptionsBook' });
        //var optionsTextBtn = new Element('span', { 'class': 'application_action_link_noUnderline myLearning_filterOptionslink' }).insert(global.getLabel('filterOptions'));
        //contain the options to filter Bookings
        var labelFilter = '';
        var jsonFilterBook = { elements: [] };
        var optionsDivBook = new Element('div', { 'id': 'idOptionsDivBook', 'class': 'application_clear_line' });
        if (!fromSearch) {//It only enters first time the page is loaded.    
            optionsDivBook.hide();
        }
        if (!optionsDivBook.visible()) {
            labelFilter = global.getLabel('filterOptions');
        }
        else {
            labelFilter = global.getLabel('clearfilter');
        }
        var filterButton = {
            label: labelFilter,
            toolTip: labelFilter,
            idButton: 'idFilterOptionBook',
            handler: this.toggleFilter.bindAsEventListener(this, 'idFilterOptionBook', optionsDivBook, labelFilter),
            className: 'application_action_link_noUnderline myLearning_filterOptionslink',
            type: 'link',
            standardButton: false
        };
        jsonFilterBook.elements.push(filterButton);
        var buttonFilterDisplayer = new megaButtonDisplayer(jsonFilterBook);
        var optionsTextBtn = buttonFilterDisplayer.getButtons();

        this.divFilterOptionsBook.insert(optionsTextBtn);
        this.divFilterOptionsBook.insert(optionsDivBook);

        var divFilterContainer = new Element('div', {});
        var filterLabelFrom = new Element('div', { 'class': 'myLearning_filterStyle' }).insert(global.getLabel('from'));
        this.filterDatePickFrom = new Element('div', { 'id': 'idDateFromBook', 'class': 'myLearning_filterStyle' });
        var filterLabelTo = new Element('div', { 'class': 'myLearning_filterStyle' }).insert(global.getLabel('to'));
        this.filterDatePickTo = new Element('div', { 'id': 'idDateToBook', 'class': 'myLearning_filterStyle' });
        var filterLabelType = new Element('div', { 'class': 'application_clear_line myLearning_filterStyle' }).insert(global.getLabel('type'));
        this.filterType = new Element('div', { 'id': 'bookTypeFilterOpt', 'class': 'myLearning_filterStyle' });
        var filterLabelStatus = new Element('div', { 'class': 'myLearning_filterStyle' }).insert(global.getLabel('status'));
        this.filterStatus = new Element('div', { 'id': 'bookStatusFilterOpt', 'class': 'myLearning_filterStyle' });

        divFilterContainer.insert(filterLabelFrom);
        divFilterContainer.insert(this.filterDatePickFrom);
        divFilterContainer.insert(filterLabelTo);
        divFilterContainer.insert(this.filterDatePickTo);
        divFilterContainer.insert('<div class="application_clear_line"></div>');
        divFilterContainer.insert(filterLabelType);
        divFilterContainer.insert(this.filterType);
        divFilterContainer.insert(filterLabelStatus);
        divFilterContainer.insert(this.filterStatus);

        optionsDivBook.insert(divFilterContainer);
        this.idWidgetBook.insert('<div class="clearing"></div>');
        // DatePickers definition
        if (Object.isEmpty(this.foBookDateFrom)) {
            var begDate = ''; //Date.today().add({ years: -1 }).toString('yyyyMMdd');
        } else {
            var begDate = this.foBookDateFrom.toString('yyyyMMdd');
        }
        if (Object.isEmpty(this.foBookDateTo)) {
            var endDate = ''; //'99991231';
        } else {
            var endDate = this.foBookDateTo.toString('yyyyMMdd');
        }
        this.objDateFromBook = new DatePicker(this.filterDatePickFrom, { defaultDate: begDate, manualDateInsertion: true, emptyDateValid: true, events: $H({ 'correctDate': 'EWS:BookDateCorrect', dateSelected: 'EWS:BookDateCorrect' }) });
        this.objDateToBook = new DatePicker(this.filterDatePickTo, { defaultDate: endDate, manualDateInsertion: true, events: $H({ 'correctDate': 'EWS:BookDateCorrect', dateSelected: 'EWS:BookDateCorrect' }) });
        this.objDateFromBook.linkCalendar(this.objDateToBook);
        /*optionsTextBtn.observe('click', function () {
        this.virtualHtml.down('[id=idOptionsDivBook]').toggle();
        } .bind(this));*/

        var typeBookingJson = {
            autocompleter: {
                object: [
                {
                    data: '',
                    text: ''
                },
	            {
	                data: 'E',
	                text: 'Course'
	            },
                {
                    data: 'EC',
                    text: 'Curriculum'
                }
            ],
                multilanguage: {
                    no_results: global.getLabel('noresults'),
                    search: global.getLabel('DM_SEARCH')
                }

            }
        };
        this.typeBookingAutComp = new JSONAutocompleter(this.filterType, {
            events: $H({ onResultSelected: 'EWS:typeFilterResultSelected' }),
            showEverythingOnButtonClick: true,
            fireEventWhenDefaultValueSet: false,
            timeout: 5000,
            templateResult: '#{text}',
            maxShown: 5,
            virtualVariables: true
        }, typeBookingJson);
        document.observe('EWS:typeFilterResultSelected', this.typeFilterSelectedBinding);
        this.statusBookingJson = {
            autocompleter: {
                object: [],
                multilanguage: {
                    no_results: global.getLabel('noresults'),
                    search: global.getLabel('DM_SEARCH')
                }

            }
        };
        this.statusBookingAutComp = new JSONAutocompleter(this.filterStatus, {
            events: $H({ onResultSelected: 'EWS:statusFilterResultSelected' }),
            showEverythingOnButtonClick: true,
            fireEventWhenDefaultValueSet: false,
            timeout: 5000,
            templateResult: '#{text}',
            maxShown: 5,
            virtualVariables: true
        }, this.statusBookingJson);
        var tempArray = $A();
        if (this.bookLabels) {
            objectToArray(this.bookLabels).each(function (item) {
                tempArray.push({ text: prepareTextToShow(item['@value']), data: item['@id'] });
            }, this);
            tempArray.push({ text: '', data: '' });
            var json = {
                autocompleter: {
                    object: tempArray,
                    multilanguage: {
                        no_results: global.getLabel('noresults'),
                        search: global.getLabel('DM_SEARCH')
                    }
                }
            }
            this.statusBookingAutComp.updateInput(json);
        }
        document.observe('EWS:statusFilterResultSelected', this.statusFilterSelectedBinding);
        if (!fromSearch) {
            optionsDivBook.hide();
        } else {
            if (!Object.isEmpty(this.foBookType)) {
                this.typeBookingAutComp.setDefaultValue(this.typeFilterSelected);
            }
            if (!Object.isEmpty(this.foBookStatus)) {
                this.statusBookingAutComp.setDefaultValue(this.statusFilterSelected);
            }
        }
    },
    typeFilterSelected: function (args) {
        if (!getArgs(args).isEmpty) {
            var idArg = getArgs(args).idAdded;
            this.typeFilterSelected = idArg;
            this.applyFilterBookings();
        }
    },
    statusFilterSelected: function (args) {
        if (!getArgs(args).isEmpty) {
            var idArg = getArgs(args).idAdded;
            this.statusFilterSelected = idArg;
            this.applyFilterBookings();
        }
    },
    /* Cancel booking */
    cancelBook: function (event, trainingId, idEmployeeSelected, objType, actionCancel) {
        if (objType == 'E') {
            this.getCancelBookingReasons(event, trainingId, idEmployeeSelected);
        } else {
            for (var i = 0; i < actionCancel.length; i++) {
                if (actionCancel[i]['@actio'] == 'LSOCANCELBOOKINGCUR') {
                    //mvv var idEmployeeSelected = global.getSelectedEmployees();
                    var nextApp = actionCancel[i]['@tarap'];
                    var tabId = actionCancel[i]['@tartb'];
                    var view = actionCancel[i]['@views'];
                    var xmlParser = new XML.ObjTree();
                    xmlParser.attr_prefix = '@';
                    var obj = { I_BUTTON: this.hashOfButtons.get(actionCancel[i]['@actio']).info };
                    var xmlDoc = xmlParser.writeXML(obj);
                    xmlDoc = xmlDoc.gsub(xmlDoc.truncate(40, ''), '');
                    global.open($H({
                        app: {
                            appId: nextApp,
                            tabId: 'POPUP',
                            view: view
                        },
                        allSessions: 'X',
                        employee: idEmployeeSelected,
                        isDelete: 'X',
                        oType: objType,
                        training: trainingId,
                        prevApp: 'myLearning',
                        button: xmlDoc
                    }));
                }
            }
        }
    },
    /***Show error message****/

    showError: function (event) {
        var req = event.memo.EWS;
        var message = new Element('div', { 'class': 'ErrorData' }).insert(req.webmessage_text);
        //create the info pop up
        var messagePopUp = new infoPopUp({
            closeButton: $H({
                'textContent': 'Close',
                'callBack': function () {
                    messagePopUp.close();
                    delete messagePopUp;
                }
            }),
            htmlContent: message,
            indicatorIcon: 'exclamation',
            width: 400
        });
        messagePopUp.create();
    },
    /**************** MANDATORY WIDGET  **************/
    setMandatory: function (employeeId) {
        var idEmployeeSelected = objectToArray(employeeId);
        var xmlEmployees = "";
        for (var i = 0; i < idEmployeeSelected.length; i++) {
            xmlEmployees += " <YGLUI_TAB_PERNR PERNR = \" " + idEmployeeSelected[i] + " \" />"
        }
        this.xmlGetTrainings = '<EWS>'
                            + "<SERVICE>" + this.mandatoryService + "</SERVICE>"
                            + "<OBJECT TYPE='P'>" + idEmployeeSelected[0] + "</OBJECT>"
                            + "<PARAM>"
                                + "<CONTAINER_PARENT>" + this.containerParent + "</CONTAINER_PARENT>"
							    + "<CONTAINER_CHILD>" + this.options.appId + "</CONTAINER_CHILD>"
                                + "<I_PERNR>" + xmlEmployees + "</I_PERNR>"
                            + "</PARAM>"
                            + '</EWS>';
        this.makeAJAXrequest($H({ xml: this.xmlGetTrainings, successMethod: 'addListMandatory'/*, ajaxID: 'prebook' */ }));
    },
    /*
    * @method buildListView
    * @desc creates the list view TABLE.
    */
    addListMandatory: function (req) {
        var fromSearch = false;
        // this.mandatoryLabels = objectToArray(req.EWS.labels.item);
        if (!Object.isEmpty(req.EWS.o_mandatory)) {
            var courses = objectToArray(req.EWS.o_mandatory.yglui_str_my_learn_d);
            var courseLength = courses.length;
            for (var i = 0; i < courseLength; i++) {
                //Get actions for each course type
                if (!Object.isEmpty(courses[i].buttons)) {
                    var buttonsMand = objectToArray(courses[i].buttons.yglui_vie_tty_ac);
                    var cancelMandBut = '';
                    var displayCTBut = '';
                    var editMand = '';
                    var trCatMandBut = '';
                    var moreOffBut = courses[i]['@more_offer'];
                    var numButtons = courses[i].buttons.yglui_vie_tty_ac.length;
                    for (var n = 0; n < numButtons; n++) {
                        switch (buttonsMand[n]['@actio']) {
                            case 'LSODISPLAYCT':
                                displayCTBut = buttonsMand[n];
                                this.prevAppId.set(buttonsMand[n]['@tarap']);
                                break;
                            case 'LSODISPLAYCURT':
                                displayCTBut = buttonsMand[n];
                                this.prevAppId.set(buttonsMand[n]['@tarap']);
                                break;
                            case 'LSO_MORE_OFF':
                                if (!Object.isEmpty(moreOffBut)) {
                                    moreOffBut = buttonsMand[n];
                                } else {
                                    moreOffBut = '';
                                }
                                break;
                            case 'LSO_DEL_MAND':
                                cancelMandBut = buttonsMand[n];
                                break;
                            case 'LSO_CHAN_MAND':
                                editMand = buttonsMand[n];
                                break;
                            case 'LSO_MAND_TRCAT':
                                trCatMandBut = buttonsMand[n];
                                break;
                        }
                    }

                } else {
                    var buttonsMand = "";
                }
                if (!Object.isEmpty(courses[i].path)) {
                    var pathMand = objectToArray(courses[i].path.yglui_str_path);
                }
                //crate the hash 
                var assignTo = '';
                if (req.EWS.o_mnr) {
                    this.isMng = true;
                    switch (courses[i]['@obj_otype']) {
                        case 'O':
                            assignTo = global.getLabel('orgUnit');
                            break;
                        case 'P':
                            assignTo = global.getLabel('employee');
                            break;
                        case 'S':
                            assignTo = global.getLabel('position');
                            break;
                    }
                }
                var employeeId = Object.isEmpty(courses[i]['@pernr']) ? '' : courses[i]['@pernr'];
                var employeeName = global.getEmployee(employeeId).name;
                this.hashOfMandatory.set(courses[i]['@objid'] + "_" + courses[i]['@obj_otype'] + employeeId, {
                    trainingId: courses[i]['@objid'],
                    title: prepareTextToShow(courses[i]['@title']),
                    schedule: courses[i]['@date'],
                    begda: courses[i]['@begda'],
                    endda: courses[i]['@endda'],
                    objType: courses[i]['@obj_otype'],
                    objId: courses[i]['@obj_objid'],
                    objTitle: courses[i]['@obj_title'],
                    actio: 'M',
                    deleteAct: '',
                    employeeId: employeeId, //courses[i]['@obj_objid'],
                    employeeName: employeeName, //courses[i]['@obj_title'],
                    type: courses[i]['@otype'],
                    numSessions: parseInt(courses[i]['@sess_num'], 10),
                    buttons: buttonsMand,
                    cancelMandBut: cancelMandBut,
                    editMand: editMand,
                    trCatMandBut: trCatMandBut,
                    displayCTBut: displayCTBut,
                    assignTo: assignTo,
                    path: pathMand
                });
            }
        }
        this.createMandatoryTable();
    },
    /*
    * @method It deletes the bookings for one employee when the employee is unselected
    * @desc creates the list view TABLE.
    */
    deleteListMandatory: function (employeeId, all) {

        //unset elements for the hash 

        for (var i = 0; i < this.hashOfMandatory.keys().length; i++) {
            if (employeeId == this.hashOfMandatory.get(this.hashOfMandatory.keys()[i]).employeeId || all) {
                this.hashOfMandatory.unset(this.hashOfMandatory.keys()[i]);
                i--;
            }
        }
        //this.createMandatoryTable(false);
    },
    createMandatoryTable: function () {
        this.observeListMantory = $H();
        ///widgets
        if (!($('idWidgetMand'))) {
            this.divMandWidget = new Element('div', { 'id': this.applicationId + 'divMandWidget', 'class': 'learning_marginWidget' });
            this.idWidgetMand = new Element('div', { 'id': 'idWidgetMand' });
            this.divAppMain.insert(this.divMandWidget);

            var objOptions = $H({
                title: global.getLabel('mandatoryTraining'),
                collapseBut: true,
                contentHTML: this.idWidgetMand,
                onLoadCollapse: false,
                targetDiv: this.applicationId + 'divMandWidget'
            });
            this.MandatoryWidget = new unmWidget(objOptions);
        }
        if (!this.divListMandatory) {
            this.divListMandatory = new Element('div', { 'id': this.applicationId + '_divListMandatory', 'class': 'mylearning_scroll' });
            this.idWidgetMand.insert(this.divListMandatory);
        }
        if (!this.tableMand) {
            this.tableMand = new Element('table', { 'id': 'idTableMandato', 'class': 'sortable mylearning_marginTable' });
            var theadrow = new Element('tr', {});
            var thead = new Element('thead', {}).insert(theadrow);
            this.tbodyMandatory = new Element('tbody', {});
            if (this.userManBook == 'X') {
                theadrow.insert(new Element('th', { 'id': 'EMPLOYEE', 'class': 'myLearning_widthPeriodCT' }).insert(global.getLabel('EMPLOYEE')));
            }
            var thTitle = new Element('th', { 'id': 'idTitleHeader', 'class': 'myLearning_widthTitleCT' }).insert(global.getLabel('trainingTitle'));
            var thSessions = new Element('th', { 'id': 'idSessHeader', 'class': 'myLearning_widthSessionsCT' }).insert(global.getLabel('sess'));
            var thPeriod = new Element('th', { 'id': 'idPeriodHeader', 'class': 'myLearning_widthPeriodCT' }).insert(global.getLabel('period'));
            var thActions = new Element('th', { 'id': 'Actions', 'class': 'myLearning_widthActionCT' }).insert(new Element('span', { 'class': 'linedTree_hidden TPreferencesDescriptionToShow' }).insert(global.getLabel('KM_ACTIONS')));
            theadrow.insert(thTitle);
            if (this.userManBook == 'X') {
                var thAssign = new Element('th', { 'id': 'idAssignHeader', 'class': 'myLearning_widthSessionsCT' }).insert(global.getLabel('assignTo'));
                theadrow.insert(thAssign);
            }
            theadrow.insert(thSessions);
            theadrow.insert(thPeriod);
            theadrow.insert(thActions);
            this.oldTheadMand = thead.cloneNode(true);
            this.tableMand.insert(thead);
            this.tableMand.insert(this.tbodyMandatory);
            this.divListMandatory.insert(this.tableMand);
        }
        else {
            var thead = this.oldTheadMand.cloneNode(true);
            //this.tablePreb.tHead.parentNode.replaceChild(thead, this.tablePreb.tHead);
            $('idTableMandato').tHead.parentNode.replaceChild(thead, $('idTableMandato').tHead);
            this.tbodyMandatory.update('');
        }
        var numMand = this.hashOfMandatory.keys().length;
        for (var i = 0; i < numMand; i++) {
            var color;
            color = this.getEmployee(this.hashOfMandatory.get(this.hashOfMandatory.keys()[i]).employeeId).color;
            if (Object.isUndefined(color)) color = 0;
            if (!Object.isNumber(color)) color = 0;
            color = "eeColor" + color.toPaddedString(2);
            var begdaCT = Date.parseExact(this.hashOfMandatory.get(this.hashOfMandatory.keys()[i]).begda, 'yyyy-MM-dd').toString('dd.MM.yyyy');
            var enddaCT = Date.parseExact(this.hashOfMandatory.get(this.hashOfMandatory.keys()[i]).endda, 'yyyy-MM-dd').toString('dd.MM.yyyy');
            var typeObjMand = this.hashOfMandatory.get(this.hashOfMandatory.keys()[i]).type;
            var buttonsMand = this.hashOfMandatory.get(this.hashOfMandatory.keys()[i]).buttons;
            var begda = Date.parseExact(begdaCT, 'dd.MM.yyyy').toString('yyyy-MM-dd');
            var endda = Date.parseExact(enddaCT, 'dd.MM.yyyy').toString('yyyy-MM-dd');

            var trbodyrow = new Element('tr', { 'id': 'trMandatory_' + this.hashOfMandatory.get(this.hashOfMandatory.keys()[i]).trainingId + '_' + this.hashOfMandatory.get(this.hashOfMandatory.keys()[i]).objType });
            this.tbodyMandatory.insert(trbodyrow);
            if (this.userManBook == 'X') {
                var tdEmployee = new Element('td', { 'class': 'myLearning_widthPeriodCT' }).insert(new Element('div', { 'class': 'application_color_' + color }).insert(this.hashOfMandatory.get(this.hashOfMandatory.keys()[i]).employeeName));
                trbodyrow.insert(tdEmployee);
            }
            var jsonTitleMand = {
                elements: []
            };
            var titleButtonMand = {
                label: this.hashOfMandatory.get(this.hashOfMandatory.keys()[i]).title,
                toolTip: this.hashOfMandatory.get(this.hashOfMandatory.keys()[i]).title,
                idButton: 'idButMandatoryCT_' + this.hashOfMandatory.get(this.hashOfMandatory.keys()[i]).trainingId,
                handler: this.showViewDetails.bindAsEventListener(this, this.hashOfMandatory.get(this.hashOfMandatory.keys()[i]).trainingId, this.hashOfMandatory.get(this.hashOfMandatory.keys()[i]).type, this.hashOfMandatory.get(this.hashOfMandatory.keys()[i]).displayCTBut, begda, endda),
                className: 'application_action_link_noUnderline learning_marginLeftTable',
                type: 'link',
                standardButton: false
            };
            jsonTitleMand.elements.push(titleButtonMand);
            var divTitleMandCT = new Element('div', { 'class': 'application_action_link_noUnderline' });
            divTitleMandCT.insert(new megaButtonDisplayer(jsonTitleMand).getButtons());
            this.observeListMantory.set('idMandCT_' + this.hashOfMandatory.get(this.hashOfMandatory.keys()[i]).trainingId + '_' + this.hashOfMandatory.get(this.hashOfMandatory.keys()[i]).objType + '_' + this.hashOfMandatory.get(this.hashOfMandatory.keys()[i]).employeeId, jsonTitleMand);
            var titleMandCT = new Element('div', { 'id': 'idMandCT_' + this.hashOfMandatory.get(this.hashOfMandatory.keys()[i]).trainingId + '_' + this.hashOfMandatory.get(this.hashOfMandatory.keys()[i]).objType + '_' + this.hashOfMandatory.get(this.hashOfMandatory.keys()[i]).employeeId, 'class': 'application_action_link_noUnderline' });
            titleMandCT.insert(divTitleMandCT);
            var tdTitleMand = new Element('td', { 'id': 'idTitleMandCT', 'class': 'myLearning_widthTitleCT' });
            tdTitleMand.insert(titleMandCT);
            if (typeObjMand == 'EC') {
                var iconCurriculum = new Element('div', { 'id': 'idTitleBookCurrT', 'class': 'gcm_dependantField application_inProgress_training_icon_curr_div', 'title': global.getLabel('EC') });
                tdTitleMand.insert(iconCurriculum);
            }
            var tdSessionsMand = new Element('td', { 'id': 'idSessionsMandCT', 'class': 'myLearning_widthSessionsCT' }).insert(parseInt(this.hashOfMandatory.get(this.hashOfMandatory.keys()[i]).numSessions, 10));
            var tdPeriodMand = new Element('td', { 'id': 'idPeriodMandCT', 'class': 'myLearning_widthPeriodCT' }).insert(prepareTextToShow(this.hashOfMandatory.get(this.hashOfMandatory.keys()[i]).schedule));
            var tdActionMand = new Element('td', { 'id': 'idActionMandCT_' + this.hashOfMandatory.get(this.hashOfMandatory.keys()[i]).trainingId + '_' + this.hashOfMandatory.get(this.hashOfMandatory.keys()[i]).objType + '_' + this.hashOfMandatory.get(this.hashOfMandatory.keys()[i]).employeeId, 'class': 'mandatory_widthActionCT' });
            //Add columns
            trbodyrow.insert(tdTitleMand);
            if (this.userManBook == 'X') {
                var tdAssignMand = new Element('td', { 'id': 'idAssignMandCT', 'class': 'myLearning_widthAssignMandCT' }).insert(prepareTextToShow(this.hashOfMandatory.get(this.hashOfMandatory.keys()[i]).assignTo));
                trbodyrow.insert(tdAssignMand);
            }
            trbodyrow.insert(tdSessionsMand);
            trbodyrow.insert(tdPeriodMand);
            trbodyrow.insert(tdActionMand);
            //Add actions  
            var jsonActionsMand = { elements: [] };
            if (global.liteVersion) {
                var editIcon = 'E';
                var cancelIcon = 'X';
                var viewIcon = '\u25AC' + 'O';
            }
            else {
                var editIcon = '';
                var cancelIcon = '';
                var viewIcon = '';
            }

            //edit button
            if (!Object.isEmpty(this.hashOfMandatory.get(this.hashOfMandatory.keys()[i]).editMand)) {
                //var editMandAct = new Element('div', { 'id': 'idEditMandAct_' + this.hashOfMandatory.get(this.hashOfMandatory.keys()[i]).trainingId, 'class': 'application_editSelection fieldsPanel_deleteButton', 'title': this.hashOfMandatory.get(this.hashOfMandatory.keys()[i]).editMand['@actiot'] });

                var editButton = {
                    label: editIcon,
                    toolTip: this.hashOfMandatory.get(this.hashOfMandatory.keys()[i]).editMand['@actiot'],
                    idButton: 'idEditMandAct_' + this.hashOfMandatory.get(this.hashOfMandatory.keys()[i]).trainingId,
                    className: 'application_editSelection',
                    handler: this.edit_preBooking.bindAsEventListener(this, this.hashOfMandatory.get(this.hashOfMandatory.keys()[i])),
                    type: 'link',
                    standardButton: false
                };
                jsonActionsMand.elements.push(editButton);

                //editMandAct.observe('click', this.edit_preBooking.bindAsEventListener(this, this.hashOfMandatory.get(this.hashOfMandatory.keys()[i])));
            }
            //Cancel Prebooking         
            if (!Object.isEmpty(this.hashOfMandatory.get(this.hashOfMandatory.keys()[i]).cancelMandBut)) {
                var cancelButton = {
                    label: cancelIcon,
                    toolTip: this.hashOfMandatory.get(this.hashOfMandatory.keys()[i]).cancelMandBut['@actiot'],
                    idButton: 'idCancelMandAct_' + this.hashOfMandatory.get(this.hashOfMandatory.keys()[i]).trainingId,
                    className: 'learning_deleteButton myLearningIconFix',
                    handler: this.cancel_mandatory.bindAsEventListener(this, this.hashOfMandatory.get(this.hashOfMandatory.keys()[i])),
                    type: 'link',
                    standardButton: false
                };
                jsonActionsMand.elements.push(cancelButton);
            }

            //Prebook / book a mandatory training (go to training catalog)
            if (!Object.isEmpty(this.hashOfMandatory.get(this.hashOfMandatory.keys()[i]).trCatMandBut)) {
                var trCatMandButton = {
                    label: viewIcon,
                    toolTip: this.hashOfMandatory.get(this.hashOfMandatory.keys()[i]).trCatMandBut['@actiot'],
                    idButton: 'idtrCatMandatoryCT_' + this.hashOfMandatory.get(this.hashOfMandatory.keys()[i]).trainingId,
                    className: 'learning_searchIcon',
                    handler: this.goToTrainingCatalog.bindAsEventListener(this, this.hashOfMandatory.get(this.hashOfMandatory.keys()[i]), begda, endda),
                    type: 'link',
                    standardButton: false
                };
                jsonActionsMand.elements.push(trCatMandButton);
                //var trCatMandAct = new Element('div', { 'id': 'idtrCatMandatoryCT_' + this.hashOfMandatory.get(this.hashOfMandatory.keys()[i]).trainingId, 'class': 'fieldsPanel_deleteButton learning_searchIcon', 'title': this.hashOfMandatory.get(this.hashOfMandatory.keys()[i]).trCatMandBut['@actiot'] });
                //tdActionMand.insert(trCatMandAct);
                //trCatMandAct.observe('click', this.goToTrainingCatalog.bindAsEventListener(this, this.hashOfMandatory.get(this.hashOfMandatory.keys()[i]), begda, endda));
            }
            this.observeListMantory.set('idActionMandCT_' + this.hashOfMandatory.get(this.hashOfMandatory.keys()[i]).trainingId + '_' + this.hashOfMandatory.get(this.hashOfMandatory.keys()[i]).objType + '_' + this.hashOfMandatory.get(this.hashOfMandatory.keys()[i]).employeeId, jsonActionsMand);
            tdActionMand.insert(new megaButtonDisplayer(jsonActionsMand).getButtons());
            //add action to show view details of a course type when click on the title   

        }
        if (!this.tableKMand) {
            var filtersStoring = $A();
            var j = 0;
            if (this.userManBook == 'X') {
                filtersStoring[j++] = { name: 'EMPLOYEE', main: true, label: global.getLabel('EMPLOYEE') };
            }
            filtersStoring[j++] = { name: 'idTitleHeader', main: true, label: global.getLabel('trainingTitle') };
            if (this.userManBook == 'X') {
                filtersStoring[j++] = { name: 'idAssignHeader', main: false, label: global.getLabel('assignTo') };
            }
            filtersStoring[j++] = { name: 'idPeriodHeader', main: true, type: 'translatedDate', label: global.getLabel('period'), future: true };
            filtersStoring[j++] = { name: 'idSessHeader', main: true, label: global.getLabel('sess') };
            filtersStoring[j++] = { name: 'Actions', main: true, label: global.getLabel('KM_ACTIONS') };
            this.tableKMand = new tableKitWithSearchAndPreferences($('idTableMandato'), { clearFilterButton: true, exportMenu: true, filters: filtersStoring, multiSelectionFilter: true, filterPerPage: 4, webSearch: true, noResultsLabel: global.getLabel('noSessions'), pagination: true, countWithEmptyCell: false, pages: 5 });
        }
        else {
            $('idTableMandato').tBodies[0].parentNode.replaceChild(this.tbodyMandatory, $('idTableMandato').tBodies[0]);
            this.tableKMand.instanceTableKit.filterDiv = null;
            this.tableKMand.instanceTableKit.divReportFilter = null;
            this.tableKMand.reloadTable($('idTableMandato'), true, true);
            if (this.tableKMand.mode != "new")
                this.rebuiltTable('idTableMandato');
        }
    },
    cancel_mandatory: function (event, pTrainingId) {
        this.actualEmployeeId = pTrainingId.employeeId;
        var employee = pTrainingId.employeeId;
        var training = pTrainingId;
        switch (pTrainingId.objType) {
            case 'P':  //employee
                var cancelMandatoryHtml = "<div>" + global.getLabel('cancelmandatory') + ' ' + pTrainingId.objTitle + '?' + "</div>";
                break;
            case 'O':
                var cancelMandatoryHtml = "<div>" + global.getLabel('cancelmandatory1') + ' ' + pTrainingId.objTitle + '?' + "</div>";
                break;
            case 'S':
                var cancelMandatoryHtml = "<div>" + global.getLabel('cancelmandatory2') + ' ' + pTrainingId.objTitle + '?' + "</div>";
                break;
        }
        var _this = this;
        var contentHTML = new Element('div');
        contentHTML.insert(cancelMandatoryHtml);
        //buttons
        var buttonsJson = {
            elements: [],
            mainClass: 'moduleInfoPopUp_stdButton_div_right'
        };
        var callBack = function () {
            if (_this)
                pTrainingId.deleteAct = 'X';
            _this.maintainPreBookingRequest(pTrainingId);
            cancelPrePopUp.close();
            delete cancelPrePopUp;
            _this.createMandatoryTable();
        };
        var callBack3 = function () {
            cancelPrePopUp.close();
            delete cancelPrePopUp;
            _this.createMandatoryTable();
        };
        var aux = {
            idButton: 'Yes',
            label: global.getLabel('yes'),
            handlerContext: null,
            className: 'moduleInfoPopUp_stdButton',
            handler: callBack,
            type: 'button',
            standardButton: true
        };
        var aux3 = {
            idButton: 'No',
            label: global.getLabel('no'),
            handlerContext: null,
            className: 'moduleInfoPopUp_stdButton',
            handler: callBack3,
            type: 'button',
            standardButton: true
        };

        buttonsJson.elements.push(aux);
        buttonsJson.elements.push(aux3);
        var ButtonObj2 = new megaButtonDisplayer(buttonsJson);
        var buttons = ButtonObj2.getButtons();
        //insert buttons in div
        contentHTML.insert(buttons);

        var cancelPrePopUp = new infoPopUp({

            closeButton: $H({
                'textContent': 'Close',
                'callBack': function () {
                    cancelPrePopUp.close();
                    delete cancelPrePopUp;
                    _this.createMandatoryTable();
                }
            }),
            htmlContent: contentHTML,
            indicatorIcon: 'information',
            width: 350
        });
        cancelPrePopUp.create();
    },
    goToTrainingCatalog: function (event, objCT, begda, endda) {
        var nextApp = objCT.trCatMandBut['@tarap'];
        var tabId = objCT.trCatMandBut['@tartb'];
        var view = objCT.trCatMandBut['@views'];
        var disma = objCT.trCatMandBut['@disma'];
        var okCode = objCT.trCatMandBut['@okcod'];
        var begda = begda;
        var endda = endda;
        global.open($H({
            app: {
                appId: nextApp,
                tabId: tabId,
                view: view
            },
            objectId: objCT.trainingId,
            oType: objCT.type,
            parentType: objCT.type,
            displayMode: 'display',
            disma: disma,
            begda: begda,
            endda: endda,
            //paths: objCT.path,
            showNode: objCT.type + '' + objCT.trainingId + '_' + objCT.type,
            okCode: okCode
        }));

    },
    /**************** END MANDATORY TABLE  **************/
    /******************************************Search Methods**************************************************/
    /**
    *@param {Event} event Event called when the user start editing a complex search 
    *@description This function is triggered when doing focus on the text field, and eliminates the help text.
    */
    fieldFocus: function (event) {
        //  var fromSearch = true;    
        event.element(event).value = '';
        if (!Object.isEmpty(this.trainingIdOpened)) {
            this.trbodydesc.remove();
            this.virtualHtml.down('[id=trPrebook_' + this.trainingIdOpened + '_' + this.employeeIdOpened + ']').removeClassName('myLearningApp_trOpenedBgColor');
            this.virtualHtml.down('[id=trPrebook_' + this.trainingIdOpened + '_' + this.employeeIdOpened + ']').addClassName('myLearningApp_borderTr');
            this.virtualHtml.down('[id=idShowDetails_' + this.trainingIdOpened + '_' + this.employeeIdOpened + ']').removeClassName('learning_listArrowBlueDown');
            this.virtualHtml.down('[id=idShowDetails_' + this.trainingIdOpened + '_' + this.employeeIdOpened + ']').addClassName('learning_listArrowBlue');
            this.trbodydesc = null;
            this.trainingIdOpened = '';
            this.employeeIdOpened = '';
        }
        return;
    },
    /**************************************** End Search Methods **********************************************/

    /***********************************************Rebuil Table **********************************************/
    rebuiltTable: function (e) {
        if (e.eventName) {
            var tableName = e.eventName.gsub('EWS:rebuiltTable_', '');
        }
        else {
            var tableName = e;
        }
        var observeList;
        switch (tableName) {
            case 'idTablePrebook':
                observeList = this.observeLinkPrebookings;
                break;
            case 'idTableBooking':
                observeList = this.observeLinkBookings;
                break;
            case 'idTableMandato':
                observeList = this.observeListMantory;
                break;
            default:
                return;
        }
        var numObservers = observeList.keys().size()
        for (var i = 0; i < numObservers; i++) {
            var jsonLink = observeList.get(observeList.keys()[i]);
            this.virtualHtml.down('[id=' + observeList.keys()[i] + ']').update(new megaButtonDisplayer(jsonLink).getButtons());
        }
    },
    /****************************************************END REBUILD TABLE**************************************/
    /*
    * @method close
    * @desc called when the application is not shown.
    */
    close: function ($super) {
        $super();
        document.stopObserving('EWS:PrebookDateCorrect', this.changePrebDatePickersBinding);
        document.stopObserving('EWS:BookDateCorrect', this.changeBookDatePickersBinding);
        document.stopObserving('EWS:cancelBookingReasonAutocompleter_resultSelected', this.cancelBookingConfBoxButtonBinding);
        document.stopObserving("EWS:errorCancelBooking", this.showErrorSelectedBinding);
        this.trbodydesc = null;
    }
});          