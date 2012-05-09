/** 
* @fileOverview displayTree.js 
* @description File containing class displayTree. 
* Application for Display OM.
*/

/**
*@constructor
*@description Class displayTree.
*@augments Application 
*/
var displayTree = Class.create(Application,
/** 
*@lends OM_Display 
*/
    {
    /*** SERVICES ***/
    /**
    *@type String
    *@description Get OM service
    */
    getOMService: 'GET_OM',
    /**
    *@type String
    *@description Search objects service
    */
    searchObjectsService: 'SEARCH_OBJECTS',
    /**
    *@type String
    *@description Get views
    */
    getCatViews: 'GET_CAT_VIEWS',
    /**
    *@type String
    *@description Get types of objects for quick search
    */
    getObjectTypes: 'GET_OBJ_SELECT',
    /*** VARIABLES ***/
    /**
    *@type DatePicker
    *@description Form date
    */
    formDatePicker: null,
    /**
    *@type AutocompleteSearch
    *@description Org. unit search autocompleter
    */
    searchAutocompleter: null,
    /**
    *@type Hash
    *@description Current node list
    */
    currentChart: null,
    /**
    *@type Number
    *@description App will show children from this position
    */
    showFrom: -1,
    /**
    *@type drawTree
    *@description Object with the tree's grafical stuff
    */
    tree: null,
    /**
    *@type unmWidget
    *@description Current node's widget
    */
    currentWidget: null,
    /**
    *@type Array
    *@description Child nodes' widgets list
    */
    childWidgets: null,
    /**
    *@type String
    *@description Sets date format
    */
    dateFormat: 'yyyy-MM-dd',
    /**
    *@type String
    *@description Autocompleter's value
    */
    searchTextAutocompleterValue: "",
    /**
    *@type Hash
    *@description Elements received from the search
    */
    hashAC: new Hash(),
    /**
    *@type String
    *@description Logged user's org. unit (id)
    */
    loggedUserOrgUnit: "",
    /**
    *@type Boolean
    *@description Advsearch links loaded
    */
    linksLoaded: false,
    hashOfButtons: $H(),
    /**
    * @type String
    * @description Last root org. unit visited
    */
    lastOrgUnit: null,
    leftArrowExists: false,
    rightArrowExists: false,
    viewsLoaded: false,
    CLASS_OBJTYPE: $H({
        O: 'applicationOM_folder',
        S: 'applicationOM_person',
        P: 'applicationOM_staff2'
    }),
    //to save the number of the instance of the funcion settimeout
    hashNumberTimeout: new Hash(),
    //the index of the hash for setTimeout
    indexTimeout: 0,
    /*** METHODS ***/
    /**
    *Constructor of the class OM_Display
    */
    initialize: function ($super, args) {
        $super(args);
        this.makeCall = true;
        this._listenToggleBinding = this._listenToggle.bindAsEventListener(this);
        this._dateChangedBinding = this._dateChanged.bindAsEventListener(this);
        this._setSearchTextBinding = this.before_setSearchText.bindAsEventListener(this);
        this._makeSimpleSearchBinding = this._makeSimpleSearch.bindAsEventListener(this);
        //autocompleter views events
        this.viewSelectedBinding = this.viewSelected.bindAsEventListener(this);
        this.typeSelectedBinding = this.typeSelected.bindAsEventListener(this);
        this.employeeSelectedAdvSearchBinding = this.allEmployeesAdded.bindAsEventListener(this);
    },
    /**
    *@description Starts displayTree
    */
    run: function ($super, args) {
        $super(args);
        //get appId from args
        this.applicationId = args.get('app').appId;
        //check if views are already loaded
        this.viewsLoaded = args.get('viewsLoaded') ? args.get('viewsLoaded') : false;
        if (this.viewsLoaded) {
            this.hashOfViews = getArgs(args).get('hashOfViews');
            if (this.hashOfViews.size() > 0)
                this.numberOfViews = this.hashOfViews.size();
            this.idArg = getArgs(args).get('idArg');
            if (this.autoCompleterView)
                this.autoCompleterView.setDefaultValue(this.idArg);
        }
        //initial root        
        if (args.get('loggedUserOrgUnit')) {
            this.loggedUserOrgUnit = args.get('loggedUserOrgUnit');
        }
        else {
            this.loggedUserOrgUnit = ""
        }
        if (args.get('selectedNode')) {
            this.selectedNode = args.get('selectedNode');
        }
        else {
            this.selectedNode = "";
        }
        if (this.firstRun) {
            this._setInitialHTML();
        } else {
            this.virtualHtml.down('[id=' + this.applicationId + '_selectorView]').innerHTML = '';
            this.updateViewSelectorMenu();
            this.updateAutocompleterMenu();
        }
        if (this.selectedNode != "") {
            this._getChart(this.selectedNode);
        } else {
            this._getInitialChart();
        }
        document.observe('EWS:OM_Display_widgetToggle', this._listenToggleBinding);
        document.observe('EWS:' + this.applicationId + '_correctDay', this._dateChangedBinding);
        document.observe('EWS:autocompleter_getNewXML', this._setSearchTextBinding);
        document.observe('EWS:autocompleter_resultSelected', this._makeSimpleSearchBinding);
        //autocompleter views events   
        document.observe(this.applicationId + ':viewSelected', this.viewSelectedBinding);
        document.observe(this.applicationId + ':typeSelected', this.typeSelectedBinding);
        //listener for advance search
        document.observe('EWS:allEmployeesAdded', this.employeeSelectedAdvSearchBinding);
    },
    /**
    *@description Builds the initial HTML code
    */
    _setInitialHTML: function () {
        // HTML        
        this.virtualHtml.update("");
        //It create the Html stucture in differents levels
        var divLevel1 = new Element('div', { 'id': this.applicationId + "_level1", 'class': 'OMdisplay_level1' });
        var divLevel2 = new Element('div', { 'id': this.applicationId + "_level2", 'class': 'genCat_level2' });
        var divLevel3 = new Element('div', { 'id': this.applicationId + "_level3", 'class': 'genCat_level3' });
        var divLevel4 = new Element('div', { 'id': this.applicationId + "_level4", 'class': 'genCat_level4' });
        var divBackTop = new Element('div', { 'id': this.applicationId + "_backTop", 'class': 'genCat_backTop' });
        var divCheck = new Element('div', { 'id': this.applicationId + "check_div", 'class': 'fieldDispClearBoth' }).update("&nbsp");
        var divLevel5 = new Element('div', { 'id': this.applicationId + "_level5", 'class': 'OMdisplay_chart OMdisplay_content' });
        this.virtualHtml.insert(divLevel1);
        this.virtualHtml.insert(divLevel2);
        this.virtualHtml.insert(divLevel3);
        this.virtualHtml.insert(divLevel4);
        this.virtualHtml.insert(divCheck);
        this.virtualHtml.insert(divBackTop);
        this.virtualHtml.insert(divLevel5);
        //draw div for selectorView in level 1
        var selectorView = new Element('div', { 'id': this.applicationId + "_selectorView", 'class': 'fieldDispFloatRight' });
        divLevel1.insert(selectorView);
        //draw div for autocompleter Types in level 2
        var autocompleterType = new Element('div', { 'id': 'autocompleterType', 'class': 'OM_Maintain_searchDiv' });
        divLevel2.insert(autocompleterType);
        //draw div for autocompleter in level 2
        var autocompleter = new Element('div', { 'id': this.applicationId + '_autocompleter', 'class': 'genCat_comp OM_Maintain_searchDiv' });
        divLevel2.insert(autocompleter);
        //draw div for Advanced Search in level 2
        this.advancedSearchDiv = new Element('div', { id: this.applicationId + '_advancedSearch', className: 'OM_Maintain_searchDiv' });
        divLevel2.insert(this.advancedSearchDiv);
        //draw div for datePicker in level 2       
        var datePickers = new Element('div', { 'id': this.applicationId + "_datePickerBeg", 'class': 'OM_Maintain_datesDiv' });
        divLevel2.insert(datePickers);
        //draw div for autocompleter views
        var autocompleterView = new Element('div', { 'id': this.applicationId + "_autocompleterView", 'class': 'OMdisplay_menuViews' });
        divCheck.insert(autocompleterView);
        //draw Selector Menu
        this.setViewSelectorMenu();
        this.backtoTopLink();
        //autocompleter with the types of objets to search
        this.getAutocompleterType();
        this.setAutoCompleter();
        this.setAdv_search();
        this.setDatePickers();
        // Legend
        this.setLegendDiv();
        //get ViewsMenu
        if (!this.viewsLoaded) {
            this.getViewsMenu();
        }
        else {
            //draw autocompleter menu
            this.setAutocompleterMenu();
        }
    },
    /**     
    *@description It draws the View Selector menu
    */
    setViewSelectorMenu: function () {
        //create array of buttons
        var buttonsArray = [
                       { liteVersion: global.getLabel("OM_WIWCH"), name: "tree", handle_button: this.openView.bind(this, 'tree'), selected: true },
                       { liteVersion: global.getLabel("PM_TREEVIEW"), name: "list", handle_button: this.openView.bind(this, 'fullTree'), selected: false }
        ];
        //create html of menu
        var viewSelectorMenu = new viewSelector(buttonsArray);
        //insert html
        this.virtualHtml.down('[id=' + this.applicationId + '_selectorView]').insert(viewSelectorMenu.createrHTML());
    },
    /**     
    *@description It updates the View Selector menu
    */
    updateViewSelectorMenu: function () {
        //create array of buttons
        var buttonsArray = [
                       { liteVersion: global.getLabel("OM_WIWCH"), name: "tree", handle_button: this.openView.bind(this, 'tree'), selected: true },
                       { liteVersion: global.getLabel("PM_TREEVIEW"), name: "list", handle_button: this.openView.bind(this, 'fullTree'), selected: false }
        ];
        //create html of menu
        var viewSelectorMenu = new viewSelector(buttonsArray);
        //insert html
        this.virtualHtml.down('[id=' + this.applicationId + '_selectorView]').insert(viewSelectorMenu.createrHTML());
    },
    /**     
    *@description It gets the info from SAP (the autoCompleter type one)
    */
    getAutocompleterType: function () {
        var xml = "<EWS>" +
                    "<SERVICE>" + this.getObjectTypes + "</SERVICE>" +
                    "<PARAM>" +
                        "<CONTAINER_PARENT>" + this.options.tabId + "</CONTAINER_PARENT>" +
                        "<CONTAINER_CHILD>" + this.applicationId + "</CONTAINER_CHILD>" +
                    "</PARAM>" +
                    "<DEL/>" +
                    "</EWS>";
        this.makeAJAXrequest($H({ xml: xml, successMethod: 'setAutocompleterType' }));
    },
    /**     
    *@description It set the autoCompleter type  
    */
    setAutocompleterType: function (json) {
        if (json.EWS && json.EWS.o_list && json.EWS.o_list.yglui_str_obj_select) {
            this.hashOfRecords = new Hash();
            var records = objectToArray(json.EWS.o_list.yglui_str_obj_select);
            this.numberOfRecords = records.size();
            for (var i = 0; i < this.numberOfRecords; i++) {
                var dataView = new Hash();
                dataView.set('text', records[i]['#text']);
                dataView.set('type', records[i]['@otypes']);
                this.hashOfRecords.set(i, dataView);
            }
        }
        var text, id, obj = [];
        if (this.numberOfRecords > 0) {
            //read values to fill autocompleter list from hash           
            for (var i = 0; i < this.numberOfRecords; i++) {
                data = this.hashOfRecords.get(i).get('type');
                text = this.hashOfRecords.get(i).get('text');
                obj.push({ text: text, data: data });
            }
        }
        var json = {
            autocompleter: {
                object: obj,
                multilanguage: {
                    no_results: global.getLabel('noresults'),
                    search: global.getLabel('search')
                }
            }
        };
        this.autoCompleterType = new JSONAutocompleter('autocompleterType', {
            events: $H({ onResultSelected: this.applicationId + ':typeSelected' }),
            showEverythingOnButtonClick: true,
            noFilter: true,
            timeout: 0,
            templateOptionsList: '#{text}',
            templateResult: '#{text}',
            maxShown: 20,
            minChars: 1
        }, json);
        if (obj.size() > 0) {
            this.defaultType = obj[0].text;
            this.autoCompleterType.setDefaultValue(this.defaultType, true);
        }
    },
    /**     
    *@description Event thrown by the autocompleter type when a result has been selected.
    */
    typeSelected: function (args) {
        if (!getArgs(args).isEmpty) {
            var idArg = getArgs(args).idAdded ? getArgs(args).idAdded : getArgs(args).get('idAdded');
            this.defaultType = idArg;
            this.searchAutocompleter.clearInput();            
        }
    },
    /**     
    *@description It sets the second HTML level (the autoCompleter one)
    */
    setAutoCompleter: function () {
        this.autoCompleterLabel = new Element('span', { className: 'application_main_title3 test_label' });
        var json = {
            autocompleter: {
                object: [],
                multilanguage: {
                    no_results: global.getLabel('noresults'),
                    search: global.getLabel('search')
                }
            }
        };
        this.searchAutocompleter = new JSONAutocompleter(this.applicationId + "_autocompleter", {
            showEverythingOnButtonClick: true,
            timeout: 0,
            templateResult: '#{text}',
            templateOptionsList: '#{text}',
            minChars: 1,
            noFilter: true,
            events: $H({ onGetNewXml: 'EWS:autocompleter_getNewXML',
                onResultSelected: 'EWS:autocompleter_resultSelected'
            })
        }, json);
    },
    /**     
    *@description It sets the link of back to top
    */
    backtoTopLink: function () {
        var json = {
            elements: []
        };
        var aux = {
            label: global.getLabel("backtoroot"),
            handlerContext: null,
            handler: this._goToRoot.bind(this),
            idButton: this.applicationId + "_backTop",
            className: 'application_action_link',
            type: 'link'
        };
        json.elements.push(aux);
        var ButtonBackToTop = new megaButtonDisplayer(json);
        this.virtualHtml.down('div#' + this.applicationId + '_backTop').insert(ButtonBackToTop.getButtons());
        this.virtualHtml.down('div#' + this.applicationId + '_backTop').hide();
    },
    /**     
    *@description It sets the second HTML level (the DatePickers one)
    */
    setDatePickers: function () {
        this.datePickersLabel = new Element('span', { className: 'application_main_title3' });
        var aux = { events: $H({ 'correctDate': 'EWS:' + this.applicationId + '_correctDay' }),
            defaultDate: objectToSap(new Date()).gsub('-', '')
        };
        this.datePickerBeg = new DatePicker(this.applicationId + '_datePickerBeg', aux);
    },
    /*
    * @method openView
    * @desc It manages buttons of View Selector menu
    */
    openView: function (arg) {
        var appId, view;
        if (arg == 'tree') {
            appId = "";
            view = "";
        } else if (arg == 'fullTree') {
            appId = "OM_FTREE";
            view = "DisplayFullTree";
        }
        if (appId != '' && view != '') {
            global.open($H({
                app: {
                    appId: appId,
                    tabId: this.options.tabId,
                    view: view
                },
                hashOfViews: this.hashOfViews,
                view_appId: this.applicationId,
                view_name: this.appName,
                selectedNode: this.selectedNode,
                loggedUserOrgUnit: this.loggedUserOrgUnit
            }));
        }
    },
    /**
    *@description Gets the initial chart nodes from the backend
    */
    _getInitialChart: function () {
        var xml = "<EWS><SERVICE>" + this.getOMService + "</SERVICE>" +
                "<OBJECT TYPE=\"\"></OBJECT><PARAM>" +
                "<APPID>" + this.applicationId + "</APPID>" +
                "<o_date>" + this.datePickerBeg.getActualDate().toString(this.dateFormat) + "</o_date>" +
                "<o_depth>2</o_depth>" +
                "<o_mode>D</o_mode>" +
                "</PARAM></EWS>";
        this.makeAJAXrequest($H({ xml: xml, successMethod: '_saveChart' }));
    },
    /**
    *@description Gets chart nodes from the backend
    *@param {String} orgunitid Top node's org. unit
    */
    _getChart: function (orgunitid) {
        this.selectedNode = orgunitid;
        var xml = "<EWS><SERVICE>" + this.getOMService + "</SERVICE>" +
                "<OBJECT TYPE=\"O\">" + orgunitid + "</OBJECT><PARAM>" +
                "<APPID>" + this.applicationId + "</APPID>" +
                "<o_date>" + this.datePickerBeg.getActualDate().toString(this.dateFormat) + "</o_date>" +
                "<o_depth>2</o_depth>" +
                "<o_mode>D</o_mode>" +
                "</PARAM></EWS>";
        this.makeAJAXrequest($H({ xml: xml, successMethod: '_saveChart' }));
    },
    /**
    *@description Stores nodes obtained from the backend
    *@param {JSON} json Object from the backend
    */
    _saveChart: function (json) {
        //initializing buttons variables
        this.leftArrowExists = false;
        this.rightArrowExists = false;
        // Creating hash structure
        this.currentChart = new Hash();
        this.currentChart.set('currentNode', null);
        var children = new Array();
        this.currentChart.set('childNodes', children);
        var staff = new Array();
        this.currentChart.set('staffNodes', staff);
        var allnodes = new Hash();
        this.currentChart.set('nodes', allnodes);
        var hiddeninfo = new Hash();
        this.currentChart.set('hidden', hiddeninfo);
        // Saving hidden fields information
        var hidden = json.EWS.o_hiddenfields;
        if (!Object.isEmpty(hidden)) {
            hidden = objectToArray(hidden.yglui_tab_fields);
            var hiddenSize = hidden.length;
            for (var i = 0; i < hiddenSize; i++) {
                var field = hidden[i]['@field'];
                field = field.toLowerCase();
                var value = false;
                if (hidden[i]['@hide'] == 'X')
                    value = true;
                this.currentChart.get('hidden').set(field, value);
            }
        }
        // Saving org. units information
        var nodes = objectToArray(json.EWS.o_orgunits.yglui_tab_orginfo);
        var nodesSize = nodes.length;
        for (var i = 0; i < nodesSize; i++) {
            var node = new Hash();
            var orgunitid = nodes[i]['@orgunitid'];
            if (Object.isEmpty(orgunitid)) orgunitid = '';
            node.set('orgunitid', orgunitid);
            var orgunitname = nodes[i]['@orgunitname'];
            if (Object.isEmpty(orgunitname)) orgunitname = '';
            node.set('orgunitname', orgunitname);
            var orgunitrootid = nodes[i]['@orgunitrootid'];
            if (Object.isEmpty(orgunitrootid)) orgunitrootid = '';
            node.set('orgunitrootid', orgunitrootid);
            if (orgunitrootid == "00000000")
                this.selectedNode = orgunitid;
            var begda = nodes[i]['@orgbegda'];
            node.set('begda', begda);
            var endda = nodes[i]['@orgendda'];
            node.set('endda', endda);
            var costcenterid = nodes[i]['@costcenterid'];
            if (Object.isEmpty(costcenterid)) costcenterid = '';
            node.set('costcenterid', costcenterid);
            var costcentername = nodes[i]['@costcentername'];
            if (Object.isEmpty(costcentername)) costcentername = '';
            node.set('costcentername', costcentername);
            var totalpositions = nodes[i]['@totalpositions'];
            if (Object.isEmpty(totalpositions)) totalpositions = 0;
            node.set('totalpositions', parseInt(totalpositions));
            var filledpositions = nodes[i]['@filledpositions'];
            if (Object.isEmpty(filledpositions)) filledpositions = 0;
            node.set('filledpositions', parseInt(filledpositions));
            var indicatorflag = nodes[i]['@indicatorflag'];
            if (Object.isEmpty(indicatorflag)) indicatorflag = '';
            node.set('indicatorflag', indicatorflag);
            var countryname = nodes[i]['@countryname'];
            if (Object.isEmpty(countryname)) countryname = '';
            node.set('countryname', countryname);
            var staffflag = false;
            if (nodes[i]['@staffflag'] == 'X') staffflag = true;
            node.set('staffflag', staffflag);
            var haschildnodes = false;
            if (nodes[i]['@hasorgunitchild'] == 'X') haschildnodes = true;
            node.set('haschildnodes', haschildnodes);
            // Positions
            var managers = new Array();
            node.set('managers', managers);
            var positions = new Array();
            node.set('positions', positions);
            //dynamic structure of data
            var label, listData;
            var dynStructure = new Hash();
            if (nodes[i].managers && nodes[i].managers.yglui_str_manager) {
                var dynData = objectToArray(nodes[i].managers.yglui_str_manager);
                this.numberOfDynData = dynData.size();
                for (var j = 0; j < this.numberOfDynData; j++) {
                    label = dynData[j]['@tag_text'];
                    if (dynData[j].emp_list) {
                        listData = objectToArray(dynData[j].emp_list.yglui_str_mnr_pos);
                        dynStructure.set(label, listData);
                    } else {
                        dynStructure.set(label, "");
                    }
                }
                node.set('dynStructure', dynStructure);
            }
            // Associations
            // Current node (always the first one)
            if (i == 0) {
                this.currentChart.set('currentNode', orgunitid);
                if (Object.isEmpty(this.loggedUserOrgUnit))
                    this.loggedUserOrgUnit = orgunitid;
                this.lastOrgUnit = orgunitid;
            }
            // Child or staff node
            else {
                // Child node
                if (!staffflag)
                    this.currentChart.get('childNodes').push(orgunitid);
                // Staff node
                else
                    this.currentChart.get('staffNodes').push(orgunitid);
            }
            // Add node to list
            this.currentChart.get('nodes').set(orgunitid, node);
        }
        // Saving positions information
        if (json.EWS.o_positions) {
            var positions = objectToArray(json.EWS.o_positions.yglui_tab_posinfo);
            var positionsSize = positions.length;
            for (var i = 0; i < positionsSize; i++) {
                var position = new Hash();
                var employeeid = positions[i]['@employeeid'];
                if (Object.isEmpty(employeeid)) employeeid = '';
                position.set('employeeid', employeeid);
                var employeename = positions[i]['@employeename'];
                if (Object.isEmpty(employeename)) employeename = '';
                position.set('employeename', employeename);
                var begda = positions[i]['@posbegda'];
                position.set('begda', begda);
                var endda = positions[i]['@posendda'];
                position.set('endda', endda);
                var jobid = positions[i]['@jobid'];
                if (Object.isEmpty(jobid)) jobid = '';
                position.set('jobid', jobid);
                var jobname = positions[i]['@jobname'];
                if (Object.isEmpty(jobname)) jobname = '';
                position.set('jobname', jobname);
                var positionid = positions[i]['@positionid'];
                if (Object.isEmpty(positionid)) positionid = '';
                position.set('positionid', positionid);
                var positionname = positions[i]['@positionname'];
                if (Object.isEmpty(positionname)) positionname = '';
                position.set('positionname', positionname);
                var posstatus = positions[i]['@posstatus'];
                if (Object.isEmpty(posstatus)) posstatus = '';
                position.set('posstatus', posstatus);
                var staffFlag = false;
                if (positions[i]['@staffflag'] == 'X') staffFlag = true;
                position.set('staffFlag', staffFlag);
                var managerflag = false;
                if (positions[i]['@managerflag'] == 'X') managerflag = true;
                var orgunitid = positions[i]['@orgunitid'];
                if (Object.isEmpty(orgunitid)) orgunitid = '';
                if (managerflag)
                    this.currentChart.get('nodes').get(orgunitid).get('managers').push(position)
                else
                    this.currentChart.get('nodes').get(orgunitid).get('positions').push(position);
            }
        }
        // Draw the chart
        this._drawChart();
    },
    _drawChart: function () {
        if (!Object.isEmpty(this.currentChart)) {
            // Showing from the first child
            this.showFrom = 0;
            // Getting nodes
            var currentNode = this._getNode(this.currentChart.get('currentNode'));
            var staffNodes = new Array();
            var staffNodesId = this.currentChart.get('staffNodes');
            var staffNodesIdSize = staffNodesId.length;
            for (var i = 0; i < staffNodesIdSize; i++) {
                staffNodes.push(this._getNode(staffNodesId[i]));
            }
            var childNodes = new Array();
            var childNodesId = this.currentChart.get('childNodes');
            var childNodesIdSize = childNodesId.length;
            for (var i = 0; i < childNodesIdSize; i++) {
                childNodes.push(this._getNode(childNodesId[i]));
            }
            // HTML code creation
            var html = new Element('div', { 'id': 'OMdisplay_currentNode', 'class': 'OMdisplay_widget test_OMUnit' });
            this.virtualHtml.down('div#' + this.applicationId + "_level5").update(html);
            for (var i = 0; i < staffNodesIdSize; i++) {
                html = new Element('div', { 'id': 'OMdisplay_staffNode_' + i, 'class': 'OMdisplay_widget test_OMUnit' });
                this.virtualHtml.down('div#' + this.applicationId + "_level5").insert(html);
            }
            var maxChild = childNodesIdSize;
            // (Only 3 child nodes)
            if (maxChild > 3)
                maxChild = 3;
            if (maxChild > 0) {
                var html1 = new Element('div', { 'class': 'OMdisplay_widget_childs' });
                this.virtualHtml.down('div#' + this.applicationId + "_level5").insert(html1);
                for (var i = 0; i < maxChild; i++) {
                    html = new Element('div', { 'id': 'OMdisplay_childNode_' + i, 'class': 'OMdisplay_widget test_OMUnit' });
                    html1.insert(html);
                }
            }
            //Show/hide Back to top link 
            if (this.loggedUserOrgUnit != this.currentChart.get('currentNode')) {
                this.virtualHtml.down('div#' + this.applicationId + "_backTop").show();
            }
            else {
                this.virtualHtml.down('div#' + this.applicationId + "_backTop").hide();
            }
            // Widgets creation
            var options_cur = $H({
                title: this._drawNodeTitle(currentNode, 'current').innerHTML,
                tooltip: global.getLabel('organizUnit') + ' - ' + currentNode.get('orgunitname').strip() + ' (' + currentNode.get('countryname') + ')',
                events: $H({ onToggle: 'EWS:OM_Display_widgetToggle' }),
                collapseBut: true,
                contentHTML: this._drawNode(currentNode, 'current', 'OMdisplay_currentNode'),
                targetDiv: 'OMdisplay_currentNode'
            });
            var widget_cur = new unmWidget(options_cur);
            if (global.liteVersion) {
                widget_cur.titleDiv.insert(this._drawButtonsTitle(currentNode, 'current'));
            } else {
                widget_cur.widgetTitle.insert(this._drawButtonsTitle(currentNode, 'current'));
            }
            this.currentWidget = widget_cur;
            this._drawPositions(currentNode, 'OMdisplay_currentNode');
            var staffDivs = new Array();
            for (var i = 0; i < staffNodesIdSize; i++) {
                if (i % 2 == 0)
                    this.virtualHtml.down('div#OMdisplay_staffNode_' + i).addClassName('OMdisplay_widget_leftStaff');
                else
                    this.virtualHtml.down('div#OMdisplay_staffNode_' + i).addClassName('OMdisplay_widget_rightStaff');
                var options_sta = $H({
                    title: this._drawNodeTitle(staffNodes[i], 'staff').innerHTML,
                    tooltip: global.getLabel('staff') + ' - ' + staffNodes[i].get('orgunitname').strip() + ' (' + staffNodes[i].get('countryname') + ')',
                    events: $H({ onToggle: 'EWS:OM_Display_widgetToggle' }),
                    collapseBut: true,
                    contentHTML: this._drawNode(staffNodes[i], 'staff', 'OMdisplay_staffNode_' + i),
                    targetDiv: 'OMdisplay_staffNode_' + i
                });
                var widget_sta = new unmWidget(options_sta);
                if (global.liteVersion) {
                    widget_sta.titleDiv.insert(this._drawButtonsTitle(staffNodes[i], 'staff'));
                } else {
                    widget_sta.widgetTitle.insert(this._drawButtonsTitle(staffNodes[i], 'staff'));
                }
                this._drawPositions(staffNodes[i], 'OMdisplay_staffNode_' + i);
                staffDivs.push('OMdisplay_staffNode_' + i);
            }
            this.childWidgets = new Array();
            var childDivs = new Array();
            for (var i = 0; i < maxChild; i++) {
                if (childNodesIdSize == 2) {
                    if (i == 0)
                        this.virtualHtml.down('div#OMdisplay_childNode_' + i).addClassName('OMdisplay_widget_twoChildren_firstChild');
                    else
                        this.virtualHtml.down('div#OMdisplay_childNode_' + i).addClassName('OMdisplay_widget_twoChildren_secondChild');
                }
                else {
                    if (childNodesIdSize > 2) {
                        if (i == 0)
                            this.virtualHtml.down('div#OMdisplay_childNode_' + i).addClassName('OMdisplay_widget_threeChildren_firstChild');
                        else {
                            if (i == 1)
                                this.virtualHtml.down('div#OMdisplay_childNode_' + i).addClassName('OMdisplay_widget_threeChildren_secondChild');
                            else
                                this.virtualHtml.down('div#OMdisplay_childNode_' + i).addClassName('OMdisplay_widget_threeChildren_thirdChild');
                        }
                    }
                    else
                        this.virtualHtml.down('div#OMdisplay_childNode_' + i).addClassName('OMdisplay_widget_oneChild');
                }
                // 1 = left brothers, 2 = right brothers
                var brother = -1;
                if ((i == (maxChild - 1)) && (childNodesIdSize > 3))
                    brother = 2;
                var title_chi = "";
                if (brother < 0)
                    title_chi = this._drawNodeTitle(childNodes[i], 'child').innerHTML;
                else
                    title_chi = this._drawNodeTitle(childNodes[i], 'child', 'OMdisplay_childNode_' + i, brother).innerHTML;
                var options_chi = $H({
                    title: title_chi,
                    tooltip: global.getLabel('organizUnit') + ' - ' + childNodes[i].get('orgunitname').strip() + ' (' + childNodes[i].get('countryname') + ')',
                    events: $H({ onToggle: 'EWS:OM_Display_widgetToggle' }),
                    collapseBut: true,
                    contentHTML: this._drawNode(childNodes[i], 'child', 'OMdisplay_childNode_' + i),
                    targetDiv: 'OMdisplay_childNode_' + i
                });
                var widget_chi = new unmWidget(options_chi);
                if (brother < 0) {
                    if (global.liteVersion) {
                        widget_chi.titleDiv.insert(this._drawButtonsTitle(childNodes[i], 'child'));
                    } else {
                        widget_chi.widgetTitle.insert(this._drawButtonsTitle(childNodes[i], 'child'));
                    }
                } else {
                    if (global.liteVersion) {
                        widget_chi.titleDiv.insert(this._drawButtonsTitle(childNodes[i], 'child', 'OMdisplay_childNode_' + i, brother));
                    } else {
                        widget_chi.widgetTitle.insert(this._drawButtonsTitle(childNodes[i], 'child', 'OMdisplay_childNode_' + i, brother));
                    }
                }
                this._drawPositions(childNodes[i], 'OMdisplay_childNode_' + i);
                this.childWidgets.push(widget_chi);
                childDivs.push('OMdisplay_childNode_' + i);
            }
            // Drawing the tree
            var divHash = new Hash();
            divHash.set('OMdisplay_currentNode', {
                parent: 'OMdisplay_currentNode',
                staff: staffDivs,
                sons: childDivs
            });
            this.tree = new drawTree(divHash, this.applicationId + "_level5", "#DED5D0");
        }
    },
    /**
    *@description Asks the current chart for an organizational unit
    *@param {String} orgunitid Org. unit id
    *@returns {Hash} node
    */
    _getNode: function (orgunitid) {
        var node = this.currentChart.get('nodes').get(orgunitid);
        if (Object.isEmpty(node))
            node = null;
        return node;
    },
    /**
    *@description Refreshes the tree lines
    *@param {Event} event Click event
    */
    _listenToggle: function (event) {
        var targetDiv = getArgs(event).get('targetDiv');
        // Moving lateral arrows in child nodes (if needed)
        if (targetDiv.include('OMdisplay_childNode_')) {
            var pos = parseInt(targetDiv.substring(targetDiv.lastIndexOf("_") + 1, targetDiv.length));
            if (pos == 0) {
                if (this.leftArrowExists) {
                    if (this.leftButtonHtml.getElement('OMdisplay_leftArrow').hasClassName('OMdisplay_widget_title_arrowL_imageNormal')) {
                        this.leftButtonHtml.changeClass('OMdisplay_leftArrow', 'link application_verticalL_arrow OMdisplay_widget_title_arrowL_imageMin');
                    } else {
                        this.leftButtonHtml.changeClass('OMdisplay_leftArrow', 'link application_verticalL_arrow OMdisplay_widget_title_arrowL_imageNormal');
                    }
                }
            }
            if (pos == 2) {
                if (this.rightArrowExists) {
                    if (this.rightButtonHtml.getElement('OMdisplay_rightArrow').hasClassName('OMdisplay_widget_title_arrowR_imageNormal')) {
                        this.rightButtonHtml.changeClass('OMdisplay_rightArrow', 'link application_verticalR_arrow OMdisplay_widget_title_arrowR_imageMin');
                    } else {
                        this.rightButtonHtml.changeClass('OMdisplay_rightArrow', 'link application_verticalR_arrow OMdisplay_widget_title_arrowR_imageNormal');
                    }
                }
            }
        }
        // Refreshing tree
        this.tree.refresh();
    },
    /**
    *@description Returns the HTML code from a node's title for drawing it
    *@param {Hash} node Node whose title we want to draw
    *@param {String} type Node type ('current', 'staff' or 'child')
    *@param {String} targetDiv Node's target div (widget)
    *@param {Number} brothers Says if a child has left/right brothers (1 = left, 2 = right)
    *@returns {String} html
    */
    _drawNodeTitle: function (node, type, targetDiv, brothers) {
        var html = new Element('div');
        // Icon
        if (type == 'staff') {
            if (global.liteVersion) {
                html.insert(new Element('div', { 'title': global.getLabel('staff'), 'class': 'applicationOM_staff OMdisplay_widget_title_icon' }).insert('\u2666'));
            } else {
                html.insert(new Element('div', { 'title': global.getLabel('staff'), 'class': 'applicationOM_staff OMdisplay_widget_title_icon' }));
            }
        } else {
            if (global.liteVersion) {
                html.insert(new Element('div', { 'title': global.getLabel('organizUnit'), 'class': 'applicationOM_folder OMdisplay_widget_title_icon' }).insert('\u2666'));

            } else {
                html.insert(new Element('div', { 'title': global.getLabel('organizUnit'), 'class': 'applicationOM_folder OMdisplay_widget_title_icon' }));
            }
        }
        // Text
        var div1 = new Element('div', { 'class': 'OMdisplay_widget_title_positions' });
        var div2 = new Element('div', { 'class': 'OMdisplay_widget_title_positions_span', 'title': prepareTextToEdit(node.get('orgunitname').strip()) }).insert(" (" + node.get('filledpositions') + "/" + node.get('totalpositions') + ") " + node.get('orgunitname').strip().truncate(15));
        div1.insert(div2);
        html.insert(div1);
        // Flag
        if (global.liteVersion) {
            var div1 = new Element('div', { 'class': 'OM_flag_common', 'title': node.get('countryname') }).insert("\u25A0");
        } else {
            var div1 = new Element('div', { 'class': 'OM_flag_common OM_flag_' + node.get('indicatorflag'), 'title': node.get('countryname') });
        }
        var div2 = new Element('div', { 'class': 'OMdisplay_flag_topLeft' });
        var div3 = new Element('div', { 'class': 'OMdisplay_flag_topRight' });
        var div4 = new Element('div', { 'class': 'OMdisplay_flag_bottomLeft' });
        var div5 = new Element('div', { 'class': 'OMdisplay_flag_bottomRight' });
        div1.insert(div2);
        div1.insert(div3);
        div1.insert(div4);
        div1.insert(div5);
        html.insert(div1);
        return html;
    },
    _drawButtonsTitle: function (node, type, targetDiv, brothers) {
        var html = new Element('div');
        // Arrows
        // (We need them here because if we minimize widgets they don't have to dissapear)
        if (brothers) {
            if (brothers == 1) {
                if (!this.leftArrowExists) {
                    var label = "";
                    if (global.liteVersion) {
                        var label = "\u25C4";
                    }
                    var json = {
                        elements: []
                    };
                    var arrowLeft = {
                        label: label,
                        idButton: 'OMdisplay_leftArrow',
                        handlerContext: null,
                        className: 'link application_verticalL_arrow OMdisplay_widget_title_arrowL_imageNormal',
                        handler: this._redrawChildren.bind(this, 'less'),
                        standardButton: false,
                        type: 'button'
                    };
                    json.elements.push(arrowLeft);
                    this.leftButtonHtml = new megaButtonDisplayer(json);
                    html.insert(this.leftButtonHtml.getButtons());
                    this.leftArrowExists = true;
                } else {
                    this.leftButtonHtml.getElement('OMdisplay_leftArrow').show();
                }
            }
            if (brothers == 2) {
                if (!this.rightArrowExists) {
                    var label = "";
                    if (global.liteVersion) {
                        var label = "\u25BA";
                    }
                    var json = {
                        elements: []
                    };
                    var arrowRight = {
                        label: label,
                        idButton: 'OMdisplay_rightArrow',
                        handlerContext: null,
                        className: 'link application_verticalR_arrow OMdisplay_widget_title_arrowR_imageNormal',
                        handler: this._redrawChildren.bind(this, 'plus'),
                        standardButton: false,
                        type: 'button'
                    };
                    json.elements.push(arrowRight);
                    var Buttons = new megaButtonDisplayer(json);
                    this.rightButtonHtml = new megaButtonDisplayer(json);
                    html.insert(this.rightButtonHtml.getButtons());
                    this.rightArrowExists = true;
                } else {
                    this.rightButtonHtml.getElement('OMdisplay_rightArrow').show();
                }
            }
        }
        return html;
    },
    /**
    *@description Returns the HTML code from a node for drawing it
    *@param {Hash} node Node we want to draw
    *@param {String} type Node type ('current', 'staff' or 'child')
    *@param {String} targetDiv Node's target div (widget)
    *@returns {String} html
    */
    _drawNode: function (node, type, targetDiv) {
        var html = new Element('div');
        html.insert(new Element('div', { 'class': 'OMdisplay_widget_blankLine' }).insert("&nbsp;"));
        // Needed information
        var costcentername = Object.isEmpty(node.get('costcentername')) ? '' : node.get('costcentername');
        // Initial info
        var div, table, tbody, tr, td1, td2;
        table = new Element('div', { 'class': 'fieldDispTotalWidth' });
        tbody = new Element('div');
        table.insert(tbody);
        html.insert(new Element('div', { 'class': '' }).insert(table));
        //"Cost center" info
        if (!this.currentChart.get('hidden').get('costcenter')) {
            tr = new Element('div');
            td1 = new Element('div', { 'class': 'OMdisplay_widget_initialInfo_label application_main_soft_text' }).insert(global.getLabel('costcenter'));
            td2 = new Element('div', { 'class': 'OMdisplay_widget_initialInfo_value application_text_bolder' }).insert(costcentername);
            tr.insert(td1);
            tr.insert(td2);
            tbody.insert(tr);
        }
        //if cost center is empty it adds a class
        if (costcentername == '') {
            td2.addClassName('OMdisplay_noDataInCharge');
        }
        //"In charge" info
        tr = new Element('div');
        td1 = new Element('div', { 'class': 'OMdisplay_widget_initialInfo_label application_main_soft_text' }).insert(global.getLabel('incharge'));
        tr.insert(td1);
        td2 = new Element('div', { 'class': 'OMdisplay_widget_initialInfo_value' });
        tr.insert(td2);
        tbody.insert(tr);
        var managers = node.get('managers');
        var view, tartb, idObj, parentType;
        var managersSize = managers.length;
        for (var i = 0; i < managersSize; i++) {
            var managername = Object.isEmpty(managers[i].get('employeename')) ? '' : this.wordSplit(managers[i].get('employeename'));
            var managerpos = Object.isEmpty(managers[i].get('positionname')) ? '' : this.wordSplit(managers[i].get('positionname'));
            if (Prototype.Browser.IE) {
                managername = wordWrap(managername, 16);
                managerpos = wordWrap(managerpos, 16);
            }
            if (!Object.isEmpty(managername)) {
                view = 'DisplayPerson';
                tartb = 'POPUP';
                appId = 'OM_PDIS';
                idObj = managers[i].get("employeeid");
                parentType = 'P';
                var json = {
                    elements: []
                };
                var detail = {
                    label: managername,
                    idButton: 'OMdisplay_manager_' + targetDiv + '_' + i,
                    handlerContext: null,
                    className: 'OMdisplay_personButtonText',
                    handler: this.showDetails.bind(this, idObj, view, tartb, appId, parentType),
                    standardButton: true,
                    type: 'link'
                };
                json.elements.push(detail);
                var Buttons = new megaButtonDisplayer(json);
                td2.insert(Buttons.getButtons());
            } else {
                var span = new Element('span', { 'class': 'OMdisplay_noManagerPersonText test_text' }).insert(global.getLabel('nomanager'));
                td2.insert(span);
            }
            if (!Object.isEmpty(managerpos)) {
                view = 'DisplayPosition';
                tartb = 'POPUP';
                appId = 'OM_SDIS';
                idObj = managers[i].get("positionid");
                parentType = 'S';
                var json = {
                    elements: []
                };
                var detailsPos = {
                    label: managerpos,
                    idButton: 'OMdisplay_managerPos_' + targetDiv + '_' + i,
                    handlerContext: null,
                    className: 'OMdisplay_positionButtonText',
                    handler: this.showDetails.bind(this, idObj, view, tartb, appId, parentType),
                    standardButton: true,
                    type: 'link'
                };
                json.elements.push(detailsPos);
                var Buttons = new megaButtonDisplayer(json);
                td2.insert(Buttons.getButtons());
            }
        }
        if (managersSize == 0) {
            td2.addClassName('OMdisplay_noDataInCharge');
        }
        //dynamic fields
        if (node.get('dynStructure')) {
            var label, list, managername, managernameid, managerpos, managerposid;
            var dynStructureSize = node.get('dynStructure').size();
            for (var k = 0; k < dynStructureSize; k++) {
                label = node.get('dynStructure').keys()[k];
                tr = new Element('div');
                tbody.insert(tr);
                td1 = new Element('div', { 'class': 'OMdisplay_widget_initialInfo_label application_main_soft_text' }).insert(label);
                tr.insert(td1);
                td2 = new Element('div', { 'class': 'OMdisplay_widget_initialInfo_value' });
                tr.insert(td2);
                var list = node.get('dynStructure').get(label);
                if (list != '') {
                    listSize = list.size();
                    for (var i = 0; i < listSize; i++) {
                        managername = Object.isEmpty(list[i]['@manager_text']) ? '' : this.wordSplit(list[i]['@manager_text']);
                        if (Prototype.Browser.IE) {
                            managername = wordWrap(managername, 16);
                        }
                        managernameid = list[i].manager['@objid'];
                        managerpos = Object.isEmpty(list[i]['@position_text']) ? '' : this.wordSplit(list[i]['@position_text']);
                        if (Prototype.Browser.IE) {
                            managerpos = wordWrap(managerpos, 16);
                        }
                        managerposid = list[i].position['@objid'];
                        if (!Object.isEmpty(managername)) {
                            view = 'DisplayPerson';
                            tartb = 'POPUP';
                            appId = 'OM_PDIS';
                            parentType = 'P';
                            var json = {
                                elements: []
                            };
                            var detailsPerson = {
                                label: managername,
                                idButton: 'OMdisplay_manager_' + targetDiv + '_' + i,
                                handlerContext: null,
                                className: 'OMdisplay_personButtonText',
                                handler: this.showDetails.bind(this, managernameid, view, tartb, appId, parentType),
                                standardButton: true,
                                type: 'link'
                            };
                            json.elements.push(detailsPerson);
                            var Buttons = new megaButtonDisplayer(json);
                            td2.insert(Buttons.getButtons());
                        } else {
                            var span = new Element('span', { 'class': 'OMdisplay_noManagerPersonText test_text' }).insert(global.getLabel('nomanager'));
                            td2.insert(span);
                        }
                        if (!Object.isEmpty(managerpos)) {
                            view = 'DisplayPosition';
                            tartb = 'POPUP';
                            appId = 'OM_SDIS';
                            parentType = 'S';
                            var json = {
                                elements: []
                            };
                            var detailsPos = {
                                label: managerpos,
                                idButton: 'OMdisplay_managerPos_' + targetDiv + '_' + i,
                                handlerContext: null,
                                className: 'OMdisplay_positionButtonText',
                                handler: this.showDetails.bind(this, managerposid, view, tartb, appId, parentType),
                                standardButton: true,
                                type: 'link'
                            };
                            json.elements.push(detailsPos);
                            var Buttons = new megaButtonDisplayer(json);
                            td2.insert(Buttons.getButtons());
                        }
                    }
                }
            }
        }
        // Links and arrow
        tr = new Element('div');
        tbody.insert(tr);
        //"More" link
        td1 = new Element('div', { 'class': '' });
        tr.insert(td1);
        view = 'DisplayOrgUnit';
        tartb = 'POPUP';
        appId = 'OM_ODIS';
        idObj = node.get("orgunitid");
        parentType = 'O';
        var json = {
            elements: []
        };
        var moreLink = {
            label: global.getLabel('more'),
            idButton: 'OMdisplay_moreButton_' + targetDiv,
            handlerContext: null,
            className: 'link OMdisplay_widget_initialInfo_link application_action_link OMdisplay_widget_moreAlign',
            handler: this.showDetails.bind(this, idObj, view, tartb, appId, parentType),
            standardButton: false,
            type: 'link'
        };
        json.elements.push(moreLink);
        var Buttons = new megaButtonDisplayer(json);
        td1.insert(Buttons.getButtons());
        // td1 = new Element('td', { 'class': '' });
        td1 = new Element('div', { 'class': 'fieldDispFloatRight' });
        tr.insert(td1);
        //"Team" link
        if (node.get('positions').length > 0) {
            var json = {
                elements: []
            };
            var teamLink = {
                label: global.getLabel('team'),
                idButton: 'OMdisplay_team_' + targetDiv,
                handlerContext: null,
                className: 'link OMdisplay_widget_initialInfo_link application_action_link OMdisplay_widget_teamAlign',
                handler: this._toggleTeamInfo.bind(this, 'OMdisplay_hiddenInfo_' + targetDiv),
                standardButton: false,
                type: 'link'
            };
            json.elements.push(teamLink);
            var Buttons = new megaButtonDisplayer(json);
            td1.insert(Buttons.getButtons());
        }
        //Arrows              
        td1 = new Element('div', { 'class': 'OMdisplay_arrow' });
        tbody.insert(td1);
        if (type == 'current') {
            if (node.get('orgunitrootid') != '00000000') {
                var label = "";
                if (global.liteVersion) {
                    var label = "\u25B2";
                }
                var json = {
                    elements: []
                };
                var arrowUp = {
                    label: label,
                    idButton: 'OMdisplay_arrow_' + targetDiv,
                    handlerContext: null,
                    className: 'link application_up_arrow OMdisplay_widget_initialInfo_arrowU_image OMdisplay_application_arrowsPosition',
                    handler: this._getChart.bind(this, node.get('orgunitrootid')),
                    standardButton: false,
                    type: 'button'
                };
                json.elements.push(arrowUp);
                var Buttons = new megaButtonDisplayer(json);
                td1.insert(Buttons.getButtons());
            }
        } else {
            if (node.get('haschildnodes')) {
                var label = "";
                if (global.liteVersion) {
                    var label = "\u25BC";
                }
                var json = {
                    elements: []
                };
                var arrowDown = {
                    label: label,
                    idButton: 'OMdisplay_arrow_' + targetDiv,
                    handlerContext: null,
                    className: 'link application_down_arrow OMdisplay_widget_initialInfo_arrowD_image OMdisplay_application_arrowsPosition',
                    handler: this._getChart.bind(this, node.get('orgunitid')),
                    standardButton: false,
                    type: 'button'
                };
                json.elements.push(arrowDown);
                var Buttons = new megaButtonDisplayer(json);
                td1.insert(Buttons.getButtons());
            }
        }
        teamDiv = new Element('div', { 'id': 'OMdisplay_hiddenInfo_' + targetDiv, 'class': 'OMdisplay_widget_hiddenInfo' });
        html.insert(teamDiv);
        teamDiv.toggle();
        html.insert(new Element('div', { 'class': 'OMdisplay_widget_blankLine' }).insert("&nbsp;"));
        return html;
    },
    showDetails: function (id, view, tartb, appId, parentType) {
        global.open($H({
            app: {
                appId: appId,
                tabId: tartb,
                view: view
            },
            begda: this.datePickerBeg.getActualDate(),
            endda: this.datePickerBeg.getActualDate(),
            parentType: parentType,
            displayMode: 'display',
            objectId: id
        }));
    },
    /**
    *@description Draws a node's positions
    *@param {Hash} node Node whose positions we want to draw
    *@param {String} targetDiv Node's target div (widget)
    */
    _drawPositions: function (node, targetDiv) {
        var html = new Element('div');
        // Getting positions
        var positions = node.get('positions');
        var positionsSize = positions.length;
        // Drawing positions
        for (var i = 0; i < positionsSize; i++) {
            var employeename = positions[i].get('employeename');
            var employeeid = positions[i].get('employeeid');
            var status = positions[i].get('posstatus');
            if (status == 'E') {
                employeename = global.getLabel('emptypos');
            }
            if (status == 'V' && Object.isEmpty(employeename)) {
                employeename = global.getLabel('vacantpos');
            }
            if (status == 'O' && Object.isEmpty(employeename)) {
                employeename = global.getLabel('obsoletepos');
            }
            if (Prototype.Browser.IE) {
                employeename = wordWrap(employeename, 16);
            }
            //employee
            var div = new Element('div', { 'class': 'OMdisplay_widget_positionEmployee' });
            html.insert(div);
            if (status == 'E') {
                div.addClassName(' OMdisplay_widget_employeeEmpty');
            } if (status == 'O') {
                div.addClassName(' OMdisplay_widget_employeeObsolete');
            } if (status == 'V') {
                div.addClassName(' OMdisplay_widget_employeeVacancy');
            } if (status == 'N') {
                div.addClassName(' OMdisplay_widget_employeeNormal');
            }
            if ((!Object.isEmpty(employeename)) && (employeeid != '00000000') && (status != 'E') && (status != 'O')) {
                var view = 'DisplayPerson';
                var tartb = 'POPUP';
                var appId = 'OM_PDIS';
                var idObj = employeeid;
                var parentType = 'P';
                var json = {
                    elements: []
                };
                var detail = {
                    label: employeename,
                    idButton: 'OMdisplay_employee_' + targetDiv,
                    handlerContext: null,
                    className: 'OMdisplay_personButtonText',
                    handler: this.showDetails.bind(this, idObj, view, tartb, appId, parentType),
                    standardButton: true,
                    type: 'link'
                };
                json.elements.push(detail);
                var Buttons = new megaButtonDisplayer(json);
                div.insert(Buttons.getButtons());
            } else {
                var span = new Element('span', { 'id': 'OMdisplay_employee_' + targetDiv + '_' + i, 'class': 'application_text_bolder test_text' }).insert(employeename)
                div.insert(span);
            }
            //position
            var div = new Element('div', { 'class': 'OMdisplay_widget_positionName' });
            html.insert(div);
            if (status == 'E') {
                div.addClassName('OMdisplay_widget_positionEmpty');
            }
            if (status == 'O') {
                div.addClassName('OMdisplay_widget_positionObsolete');
            }
            if (status == 'V') {
                div.addClassName('OMdisplay_widget_positionVacancy');
            }
            if (status == 'N') {
                div.addClassName('OMdisplay_widget_positionNormal');
            }
            view = 'DisplayPosition';
            tartb = 'POPUP';
            appId = 'OM_SDIS';
            parentType = 'S';
            var posId = positions[i].get('positionid');
            var posName = positions[i].get('positionname');
            if (status == 'O') {
                posName = global.getLabel('obsolete').toUpperCase();
            }
            if (Prototype.Browser.IE) {
                posName = wordWrap(posName, 16);
            }
            var json = {
                elements: []
            };
            if (positions[i].get('staffFlag')) {
                var posDetail = {
                    label: posName,
                    idButton: 'OMdisplay_employee_' + targetDiv + '_' + i,
                    handlerContext: null,
                    className: 'OMdisplay_positionButtonText OMdisplay_widget_initialInfo_staffFlag',
                    handler: this.showDetails.bind(this, posId, view, tartb, appId, parentType),
                    standardButton: true,
                    type: 'link'
                };
                json.elements.push(posDetail);
                var Buttons = new megaButtonDisplayer(json);
                div.insert(Buttons.getButtons());
            } else {
                var posDetail = {
                    label: posName,
                    idButton: 'OMdisplay_employee_' + targetDiv + '_' + i,
                    handlerContext: null,
                    className: 'OMdisplay_positionButtonText OMdisplay_links',
                    handler: this.showDetails.bind(this, posId, view, tartb, appId, parentType),
                    standardButton: true,
                    type: 'link'
                };
                json.elements.push(posDetail);
                var Buttons = new megaButtonDisplayer(json);
                div.insert(Buttons.getButtons());
            }
        }
        this.virtualHtml.down('div#OMdisplay_hiddenInfo_' + targetDiv).insert(html);
    },
    /**
    *@description Shows/Hides an organizational unit's member list
    *@param {String} targetDiv Node's target div (widget)
    */
    _toggleTeamInfo: function (targetDiv) {
        this.virtualHtml.down('div#' + targetDiv).toggle();
        if (this.tree)
            this.tree.refresh();
    },
    /**
    *@description Redraws the child nodes shown
    *@param {Number} showFrom Show from this children
    */
    _redrawChildren: function (value) {
        if (value == 'less') {
            var showFrom = this.showFrom - 2;
        } else {
            var showFrom = this.showFrom + 2;
        }
        // Expanding all minimized nodes
        this.childWidgetsSize = this.childWidgets.length;
        if (global.liteVersion) {
            for (var i = 0; i < this.childWidgetsSize; i++) {
                if (this.childWidgets[i].isMinimized())
                    this.childWidgets[i].minimizeWidget();
            }
        } else {
            for (var i = 0; i < this.childWidgetsSize; i++) {
                this.childWidgets[i]._expand();
            }
        }
        // Redrawing all arrow
        if (this.leftArrowExists) {
            this.leftButtonHtml.changeClass('OMdisplay_leftArrow', 'link application_verticalL_arrow OMdisplay_widget_title_arrowL_imageNormal');
        }
        if (this.rightArrowExists) {
            this.rightButtonHtml.changeClass('OMdisplay_rightArrow', 'link application_verticalR_arrow OMdisplay_widget_title_arrowR_imageNormal');
        }
        // Obtaining child nodes
        var childNodes = new Array();
        var childNodesId = this.currentChart.get('childNodes');
        var childNodesIdSize = childNodesId.length;
        for (var i = 0; i < childNodesIdSize; i++) {
            childNodes.push(this._getNode(childNodesId[i]));
        }
        // Setting the initial child node
        if (showFrom == (childNodesId.length - 2))
            showFrom--;
        if (showFrom < 0)
            showFrom = 0;
        this.showFrom = showFrom;
        // Refreshing chart        
        for (var i = 0; i < this.childWidgetsSize; i++) {
            var j = this.showFrom + i;
            this.childWidgets[i].refreshContent(this._drawNode(childNodes[j], 'child', 'OMdisplay_childNode_' + i));
            // 1 = left brothers, 2 = right brothers
            var brother = -1;
            if ((i == 0) && (this.showFrom > 0))
                brother = 1;
            if ((i == (this.childWidgets.length - 1)) && (j < (childNodesId.length - 1)))
                brother = 2;
            var title_chi = "";
            if (brother < 0) {
                title_chi = title_chi = this._drawNodeTitle(childNodes[j], 'child').innerHTML;
            } else {
                title_chi = title_chi = this._drawNodeTitle(childNodes[j], 'child', 'OMdisplay_childNode_' + i, brother).innerHTML;
            }
            this.childWidgets[i].refreshTitle(title_chi);
            if (brother < 0) {
                //hide arrows
                if (i == 0) {
                    this.leftButtonHtml.getElement('OMdisplay_leftArrow').hide();
                } else if (i == 2) {
                    this.rightButtonHtml.getElement('OMdisplay_rightArrow').hide();
                }
            } else {
                if (global.liteVersion) {
                    this.childWidgets[i].titleDiv.insert(this._drawButtonsTitle(childNodes[j], 'child', 'OMdisplay_childNode_' + i, brother));
                } else {
                    this.childWidgets[i].widgetTitle.insert(this._drawButtonsTitle(childNodes[j], 'child', 'OMdisplay_childNode_' + i, brother));
                }
            }
            this._drawPositions(childNodes[j], 'OMdisplay_childNode_' + i);
        }
    },
    /**
    *@description Calls "search_objects" service to get the option list for the autocompleter
    */
    _callToGetOptionsSearch: function () {
        var autocompleterValue = prepareTextToSend(this.searchTextAutocompleterValue);        
        var parsedDate = this.datePickerBeg.getActualDate().toString(this.dateFormat);
        var autoCompText = this.searchAutocompleter.element.getValue();
        if (!Object.isEmpty(this.oneMoreCall) && this.makeCall)
            this.oneMoreCall = null;
        else
            this.oneMoreCall = 'oneMoreCall';
        // Call to the service
        var xml = "<EWS>" +
                          "<SERVICE>" + this.searchObjectsService + "</SERVICE>" +
                          "<PARAM>" +
                              "<ORG_UNIT>N</ORG_UNIT>" +
                              "<POSITION>N</POSITION>" +
                              "<COSTCENT>N</COSTCENT>" +
                              "<PERSON>N</PERSON>" +
                              "<OBJECT_LIST>" + this.defaultType + "</OBJECT_LIST>" +
                              "<O_BEGDA>" + parsedDate + "</O_BEGDA>" +
                              "<O_ENDDA>" + parsedDate + "</O_ENDDA>" +
                              "<TEXT>" + this.searchTextAutocompleterValue + "</TEXT>" +
                              "<MAX>20</MAX>" +
                          "</PARAM>" +
                      "</EWS>";
        this.makeAJAXrequest($H({ xml: xml, successMethod: '_buildAutocompleterJSON' }));
    },
    /**
    *@description Fills the search autocompleter
    *@param {JSON} jsonObject Object from the backend
    */
    _buildAutocompleterJSON: function (jsonObject) {
        this.hashAC = $H({});
        var json = {
            autocompleter: {
                object: [],
                multilanguage: {
                    no_results: global.getLabel('noresults'),
                    search: global.getLabel('search')
                }
            }
        }
        // If we receive a json with results..
        if (jsonObject.EWS.o_objects) {
            var array = objectToArray(jsonObject.EWS.o_objects.yglui_tab_objects);
            var arraySize = array.length;
            for (var i = 0; i < arraySize; i++) {
                var idObject = array[i]["@objid"];
                var type = array[i]["@otype"];
                var oName = array[i]["@orgtext"];
                var id = array[i]["@orgid"];
                var text = Object.isEmpty(array[i]["@stext"]) ? array[i]["@short"] : array[i]["@stext"];
                var bDate = array[i]["@begda"];
                var eDate = array[i]["@endda"];
                this.hashAC.set(idObject, { type: type, idObject: idObject, id: id, text: text, oName: oName, bDate: bDate, eDate: eDate });
            }
            this.hashAC.each(function (pair) {
                var text = Object.isEmpty(pair.value['oName']) ? "" : " - (" + pair.value['oName'] + ")";
                json.autocompleter.object.push({
                    data: pair.key,
                    text: pair.value['text'] + " [" + pair.value['idObject'] + "] " + text,
                    icon: this.CLASS_OBJTYPE.get(pair.value['type'])
                })
            } .bind(this));
        }
        this.searchAutocompleter.updateInput(json);
        this.makeCall = true;        
        if (jsonObject.EWS.webmessage_text)
            this._infoMethod(jsonObject);
    },
    /**
    *@description Gets elements for the selected object and updates the chart
    *@param {Object} args Information about the autocompleter
    */
    _makeSimpleSearch: function (args) {
        if (!Object.isEmpty(getArgs(args)) && (getArgs(args).isEmpty == false)) {
            var elementChosen = this.hashAC.get(getArgs(args).idAdded);
            this.searchTextAutocompleterValue = elementChosen.text;
            this._getChart(elementChosen.id);
        }
        else
            this.searchTextAutocompleterValue = "";
    },
    /**     
    *@param args {Event} event thrown by the autoCompleter object when a node search has to be
    *performanced.
    *@description It gets a search node results list from the back-end. 
    * Wait until user stop typing characters in autocompleter, to send the full text
    */
    before_setSearchText: function () {
        //it cancel the setTimeout that it´s stored in the hash and was launched before the actual one
        if (this.indexTimeout >= 1) {
            var p = this.hashNumberTimeout.get(this.indexTimeout - 1)
            clearTimeout(p);
        }
        var _this = this;
        //it launch the event with a delay (all will be cancelled before launch except the last one)
        var t = setTimeout(function () { _this._setSearchText() }, 1200);
        this.hashNumberTimeout.set(this.indexTimeout, t);
        this.indexTimeout++;
    },
    /**
    *@description Sets the value of the autocompleter's text as parameter for refreshing the autocompleter's list
    */
    _setSearchText: function () {
        this.searchTextAutocompleterValue = this.searchAutocompleter.element.value;
        if (this.searchTextAutocompleterValue.include("["))
            this.searchTextAutocompleterValue = this.searchTextAutocompleterValue.split("[")[0];
        // Service restriction
        if (this.searchTextAutocompleterValue.length > 12)
            this.searchTextAutocompleterValue = this.searchTextAutocompleterValue.substring(0, 12);
        if (this.makeCall) {
            this.makeCall = false;
            this._callToGetOptionsSearch();
        }
        //reset variables for setTimeout function (before_nodeSearch)
        this.indexTimeout = 0;
        delete this.hashNumberTimeout;
    },
    /**
    *@description Redraws the chart with the new date submitted
    */
    _dateChanged: function () {
        this.selectedNode = orgunitid;
        var orgunitid = this.currentChart.get('nodes').get(this.currentChart.get('currentNode')).get('orgunitid');
        var xml = "<EWS><SERVICE>" + this.getOMService + "</SERVICE>" +
                "<OBJECT TYPE=\"O\">" + orgunitid + "</OBJECT><PARAM>" +
                "<APPID>" + this.applicationId + "</APPID>" +
                "<o_date>" + this.datePickerBeg.getActualDate().toString(this.dateFormat) + "</o_date>" +
                "<o_depth>2</o_depth>" +
                "<o_mode>D</o_mode>" +
                "</PARAM></EWS>";
        this.makeAJAXrequest($H({ xml: xml, successMethod: '_saveChart' }));
    },
    /**
    *@description Shows the root node
    */
    _goToRoot: function () {
        this.searchAutocompleter.clearInput();
        this._getChart(this.loggedUserOrgUnit);
    },
    /**     
    *@description It calls sap to get views
    */
    getViewsMenu: function () {
        //call sap to get views
        var xml = "<EWS>" +
                    "<SERVICE>" + this.getCatViews + "</SERVICE>" +
                    "<PARAM>" +
                        "<PARENTID>" + this.options.tabId + "</PARENTID>" + //tab
                    "</PARAM>" +
                  "</EWS>";
        this.makeAJAXrequest($H({ xml: xml, successMethod: 'setViewsMenu' }));
    },
    /**     
    *@description It stores info from sap and draws the autocompleter menu
    */
    setViewsMenu: function (json) {
        //save info from sap
        if (json.EWS && json.EWS.o_views && json.EWS.o_views.yglui_str_cat_v) {
            this.hashOfViews = new Hash();
            var records = objectToArray(json.EWS.o_views.yglui_str_cat_v);
            this.numberOfViews = records.size();
            for (var i = 0; i < this.numberOfViews; i++) {
                var dataView = new Hash();
                dataView.set('view', records[i]['@views']);
                dataView.set('appId', records[i]['@appid']);
                dataView.set('label', records[i]['@label_tag']);
                this.hashOfViews.set(i, dataView);
            }
            this.viewsLoaded = true;
            //if there is only 1 view select first element of hash if there are more select second (employee view)
            var hashOfViewsSize = this.hashOfViews.size();
            var index = 0; //(hashOfViewsSize > 1) ? 1 : 0;
            this.idArg = this.hashOfViews.get(index).get('appId') + '/*/' + this.hashOfViews.get(index).get('view');
        }
        //draw autocompleter with the info
        this.setAutocompleterMenu();
    },
    /**     
    *@description It calls sap to get views
    */
    setAutocompleterMenu: function () {
        if (this.numberOfViews > 0) {
            //read values to fill autocompleter list from hash
            var text, id, obj = [];
            for (var i = 0; i < this.numberOfViews; i++) {
                data = this.hashOfViews.get(i).get('appId') + '/*/' + this.hashOfViews.get(i).get('view');
                text = this.hashOfViews.get(i).get('label');
                obj.push({ text: text, data: data });
            }
        }
        var json = {
            autocompleter: {
                object: obj,
                multilanguage: {
                    no_results: global.getLabel('noresults'),
                    search: global.getLabel('search')
                }
            }
        };
        this.autoCompleterView = new JSONAutocompleter(this.applicationId + '_autocompleterView', {
            events: $H({ onResultSelected: this.applicationId + ':viewSelected' }),
            showEverythingOnButtonClick: true,
            templateOptionsList: '#{text}',
            templateResult: '#{text}',
            maxShown: 20,
            minChars: 1
        }, json);
        this.autoCompleterView.setDefaultValue(this.idArg, '', false);
    },
    /**         
    *@description It updates the view selected in the autocompleter
    */
    updateAutocompleterMenu: function () {
        this.autoCompleterView.setDefaultValue(this.idArg);
    },
    /**     
    *@param args {Event} event thrown by the autoCompleter when a view has been selected
    *@description It reloads the catalog selected
    */
    viewSelected: function (args) {
        if (!getArgs(args).isEmpty) {
            if (getArgs(args).idAdded || getArgs(args).get('idAdded')) {
                var idArg = getArgs(args).idAdded ? getArgs(args).idAdded : getArgs(args).get('idAdded');
                var appid = idArg.split('/*/')[0];
                var view = idArg.split('/*/')[1];
                global.open($H({
                    app: {
                        appId: appid,
                        tabId: this.options.tabId,
                        view: view
                    },
                    hashOfViews: this.hashOfViews,
                    idArg: idArg,
                    selectedNode: this.selectedNode,
                    loggedUserOrgUnit: this.loggedUserOrgUnit,
                    viewsLoaded: this.viewsLoaded
                }));
            }
        }
    },
    /**     
    *@description It sets links of Advanced Search 
    */
    setAdv_search: function () {
        var label = "";
        if (global.liteVersion) {
            var label = "\u25D9";
        }
        var json = {
            elements: []
        };
        var advSearchIcon = {
            label: label,
            handlerContext: null,
            className: 'application_catalog_image application_catalog_image_AS application_handCursor',
            handler: this.getAdvSearchlinks.bind(this),
            type: 'button',
            standardButton: false,
            toolTip: global.getLabel('SRC_OV')
        };
        json.elements.push(advSearchIcon);
        var Buttons = new megaButtonDisplayer(json);
        var advancedSearchButton = new Element("div").insert(Buttons.getButtons());
        var advancedSearchLinks = new Element("div", { "id": "advSearchLinks", "class": "OM_Maintain_advsSearchLinks" });
        this.advancedSearchDiv.insert(advancedSearchButton);
        $(this.applicationId + "_level3").insert(advancedSearchLinks);
        this.virtualHtml.down('div#advSearchLinks').hide();
    },
    /**     
    *@description It gets links of Advanced Search from sap the first time
    */
    getAdvSearchlinks: function () {
        //check if links for Adv Search have been loaded before
        if (!this.linksLoaded) {
            //calling sap to get different object for Adv Search
            var xml = "<EWS>"
                          + "<SERVICE>GET_MSHLP</SERVICE>"
                          + "<OBJECT TYPE='" + global.objectType + "'>" + global.objectId + "</OBJECT>"
                          + "<PARAM>"
                            + "<APPID>OM_DIS</APPID>"
                          + "</PARAM>"
                        + "</EWS>";
            this.makeAJAXrequest($H({ xml: xml, successMethod: 'setAdvSearchlinks' }));
        } else {
            this.setAdvSearchlinks();
        }
    },
    /**     
    *@description It draws links and defines functinality for each button
    */
    setAdvSearchlinks: function (json) {
        if (!this.linksLoaded) {
            //update variable
            this.linksLoaded = true;
            // get info about links
            this.buttonsAnswer = objectToArray(json.EWS.o_tabs.yglui_str_madv_tab);
            var buttonsNavJson = {
                elements: []
                //mainClass: 'moduleInfoPopUp_stdButton_div_left'
            };
            this.numberOfLinks = this.buttonsAnswer.length;
            for (var i = 0; i < this.numberOfLinks; i++) {
                //save button info
                var seqnr = this.buttonsAnswer[i]['@seqnr'];
                this.hashOfButtons.set(seqnr, {
                    appId: this.buttonsAnswer[i]['@appid'],
                    label_tag: this.buttonsAnswer[i]['@label_tag'],
                    sadv_id: this.buttonsAnswer[i]['@sadv_id']
                });
                var aux = {
                    idButton: this.buttonsAnswer[i]['@sadv_id'] + '_button',
                    label: this.buttonsAnswer[i]['@label_tag'],
                    handlerContext: null,
                    className: 'getContentLinks application_action_link',
                    handler: this.openNavApp.bind(this, seqnr),
                    eventOrHandler: false,
                    type: 'link'
                };
                buttonsNavJson.elements.push(aux);
            } //end for
            var ButtonObj = new megaButtonDisplayer(buttonsNavJson);
            //insert buttons in div
            this.virtualHtml.down('div#advSearchLinks').insert(ButtonObj.getButtons());
        }
        //showing/hiding links
        if (!this.virtualHtml.down('div#advSearchLinks').visible()) {
            this.virtualHtml.down('div#advSearchLinks').show();
        } else {
            this.virtualHtml.down('div#advSearchLinks').hide();
        }
    },
    /**
    *@param args {Event} event thrown by the Adv Search when a object has been selected     
    *@description Advanced Search employee selected.
    */
    allEmployeesAdded: function (args) {
        if (!getArgs(args).isEmpty) {
            if (getArgs(args).employeesAdded || getArgs(args).get('employeesAdded')) {
                var idArg = getArgs(args).employeesAdded ? getArgs(args).employeesAdded : getArgs(args).get('employeesAdded');
                idArg.keys().each(function (employee) {
                    var result = idArg.get(employee);
                    objId = employee;
                    objType = result.type;
                });
                //hide the adv search links
                this.virtualHtml.down('div#advSearchLinks').hide();
                //draws the chart with the object selected in adv search
                this._getChart(objId);
            }
        }
    },
    /**     
    *@description It opens Advanced Search application after clicking on a link.
    */
    openNavApp: function (seqnr) {
        this.advSearch = true;
        global.open($H({
            app: {
                tabId: "POPUP",
                appId: "ADVS",
                view: "AdvancedSearch"
            },
            sadv_id: this.hashOfButtons.get(seqnr).sadv_id,
            multiple: false,
            addToMenu: false
        }));
    },
    /**     
    *@description It sets the fourth HTML level  (the Legend one)
    */
    setLegendDiv: function () {
        var legendJSON = {
            legend: [
                    { img: "OMdisplay_legend_positionNormal", text: global.getLabel('occupied') },
                    { img: "OMdisplay_legend_positionEmpty", text: global.getLabel('empty') },
                    { img: "OMdisplay_legend_positionVacancy", text: global.getLabel('vacant') },
                    { img: "OMdisplay_legend_positionObsolete", text: global.getLabel('obsolete') }
                ],
            showLabel: global.getLabel('showLgnd'),
            hideLabel: global.getLabel('closeLgnd')
        };
        var legendHTML = getLegend(legendJSON);
        this.virtualHtml.down('div#' + this.applicationId + "_level4").update(legendHTML);
    },
    /**
    *@param {word} String with the word to split.
    *@description Used to Split string with long words.
    */
    wordSplit: function (word) {
        var word_splited = word.split(" ");
        var split_size = word_splited.size();
        var new_word = "";
        var from = 0;
        for (var i = 0; i < split_size; i++) {
            if (word_splited[i].length > 15) {
                while (from < word_splited[i].length) {
                    new_word += word_splited[i].substring(from, from + 15) + " ";
                    from = from + 15;
                }
                new_word = new_word.substring(0, new_word.length - 1);
            }
            else {
                (i == (split_size - 1)) ? new_word += word_splited[i] : new_word += word_splited[i] + " ";
            }
        }
        return new_word;
    },
    /**
    *@description Stops DisplayTree
    */
    close: function ($super) {
        $super();
        document.stopObserving('EWS:OM_Display_widgetToggle', this._listenToggleBinding);
        document.stopObserving('EWS:' + this.applicationId + '_correctDay', this._dateChangedBinding);
        document.stopObserving('EWS:autocompleter_getNewXML', this._setSearchTextBinding);
        document.stopObserving('EWS:autocompleter_resultSelected', this._makeSimpleSearchBinding);
        //autocompleter views events
        document.stopObserving(this.applicationId + ':viewSelected', this.viewSelectedBinding);
        document.stopObserving(this.applicationId + ':typeSelected', this.typeSelectedBinding);
        document.stopObserving('EWS:allEmployeesAdded', this.employeeSelectedAdvSearchBinding);
    }
});
