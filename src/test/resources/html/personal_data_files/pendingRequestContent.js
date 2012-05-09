/* 
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */


var PendingRequestContent = Class.create(origin, {
    /**
    * Service used to get the pending request
    * @type String
    */
    pendReqService: 'PEND_REQ',
    /**
    * Id of the tab.
    * @type String
    */
    tabId: null,
    /**
    * Store the widget info
    * @type Object
    */
    _widget: null,
    /**
    * Name of the link selected
    * @type String
    */
    actualLink: null,
    /**
    * Name of the last link selected
    * @type String
    */
    oldLink: null,
    /**
    * Variable to control if the table has been loaded
    * @type Boolean
    */
    tableLoaded: null,
    /**
    * Store the virtualHtml
    * @type Object
    */
    virtualHtml: null,
    /**
    * Store the info of each widget
    * @type Object
    */
    hashOfWidgets: null,
    /**
    * Text in the Search part
    * @type String
    */
    textSearch: null,
    /**
    * Store the info of each row in the table
    * @type Object
    */
    data: null,
    /**
    * Variable to control if the table has been filled depending of Search text  
    * @type Boolean
    */
    makeSearch: null,
    /**
    * Variable to control if different parts has been drawn (links,legend,search) 
    * @type Boolean
    */
    dataLoaded: null,
    /**
    * Number of records for Previous Month
    * @type String
    */
    numberPrevMonth: null,
    /**
    * Number of records for Current Month
    * @type String
    */
    numberCurrMonth: null,
    /**
    * Number of records for Next Month
    * @type String
    */
    numberNextMonth: null,
    /**
    * Variable to control if the time to begin the Search has finished
    * @type String
    */
    timeoutExpired: null,
    /**
    * Variable to control if the time to begin to Reload the table has finished
    * @type String
    */
    timeoutReloadExpired: null,
    /**
    *Constructor of the class
    */
    initialize: function($super, virtualHtml, hashOfWidgets, empId, appId, tabId, firstRun) {
        $super();
        this.firstFillPD = true;            //it tells us if we are filling the Pending Requests widget for the first time or not
        this.virtualHtml = virtualHtml;
        this.hashOfWidgets = hashOfWidgets;
        this.empId = empId;
        this.tabId = tabId;
        this.appId = appId;
        this._widget = this.hashOfWidgets.get(appId);
        this.firstRun = firstRun;
        this.data = new Hash();
        this.makeSearch = false;
        this.actualLink = 'Current';
        this.oldLink = 'Current';
        this.textSearch = '';
        this.dateFormat = global.dateFormat;
        this.timeoutExpired = true;
        this.timeoutReloadExpired = true;
        this.tableLoaded = false;
        this.fillPendingRequestWidget(appId);
        //event to reload the table
    },
    /**
    *@description Method to build the initial HTML code
    */
    fillPendingRequestWidget: function(appId) {
        //create html structure
        var html = "<div id='contentPart'>" +
                        "<div id='navigationPart' class='pdcPendReq_navigationPart'></div>" +
                        "<div id='tableDataPart'>" +
                        "<div id='legend' class='pdcPendReq_legendPart'></div>" +
                        "<div id='tableContent' class='pdcPendReq_tableContent'></div>" +
                        "<div id='tableContentEmpty' class='pdcPendReq_emptyTableSearchData application_main_soft_text'>" + global.getLabel('noResults') + "</div>" +
                    "</div>" +
                    "<div id='emptyTableDataPart' class='pdcPendReq_emptyTableDataPart application_main_soft_text'>" + global.getLabel('noPendReq') + "</div>" +
                    "</div>" +
                    "<div id='contentPartEmpty' class='fieldDispTotalWidth fieldDispFloatLeft pdcPendReq_emptyTableDataPart application_main_soft_text'>" + global.getLabel('noPendReq') + "</div>";
        this._widget.setContent(html);
        //hide the empty results(search field)
        this.virtualHtml.down('[id=tableContentEmpty]').hide();
        this.virtualHtml.down('[id=emptyTableDataPart]').hide();
        this.virtualHtml.down('[id=contentPartEmpty]').hide();
        this.callToGetPendingRequest(appId);
    },
    /**
    *@description Method to get the list of Pending Requests
    */
    callToGetPendingRequest: function(appId) {
        var widgetsAppId = '';
        this.hashOfWidgets.each(function(pair) {
            if (pair[0] != appId) {
                widgetsAppId += "<YGLUI_STR_WID_SCREEN APPID='" + pair[0] + "' SCREEN=''></YGLUI_STR_WID_SCREEN>";
            }
        } .bind(this));
        var xml = "<EWS>" +
                    "<SERVICE>" + this.pendReqService + "</SERVICE>" +
                    "<OBJECT TYPE='" + global.objectType + "'>" + this.empId + "</OBJECT>" +
                    "<PARAM>" +
                        "<APPID>" + widgetsAppId + "</APPID>" +
                    "</PARAM>" +
                  "</EWS>";
        this.makeAJAXrequest($H({ xml: xml, successMethod: 'processPendingRequest' }));
    },
    /**
    *@description Method to process the info about the Pending Requests
    */
    processPendingRequest: function(json) {
        if (!Object.isEmpty(json.EWS.o_records)) {
            //get the info
            this.pendReqJson = json;
            this.pendReqJsonArray = objectToArray(objectToArray(json.EWS.o_records.yglui_str_pend_req));
            //get the labels and save them
            this.labelsPendReq = !Object.isEmpty(json.EWS.labels) ? objectToArray(json.EWS.labels.item) : [];
            this.labelsPendReqHash = $H({});
            var idLabel, descrLabel;
            for (var i = 0; i < this.labelsPendReq.length; i++) {
                idLabel = this.labelsPendReq[i]['@id'];
                descrLabel = this.labelsPendReq[i]['@value'];
                this.labelsPendReqHash.set(idLabel, descrLabel);
            }
            //number of records
            this.numberOfRecords = this.pendReqJsonArray.length;
            //save the current, next and previous month
            this.currentMonth = Date.today().toString('MM');
            this.nextMonth = Date.today().addMonths(1).toString('MM');
            this.previousMonth = Date.today().addMonths(-1).toString('MM');
            //save the info in different Hash, depending of the date
            this.pendReqCurrentMonthHash = $H({});
            this.pendReqNextMonthHash = $H({});
            this.pendReqPreviuosMonthHash = $H({});
            var id, appId, objId, datum, action, status, datumMonth;
            for (var i = 0; i < this.numberOfRecords; i++) {
                //get the table info
                id = this.pendReqJsonArray[i]['@req_id'];
                appId = this.pendReqJsonArray[i]['@appid'];
                objId = this.pendReqJsonArray[i]['@objid'];
                datum = this.pendReqJsonArray[i]['@datum'];
                action = this.pendReqJsonArray[i]['@actio'];
                status = this.pendReqJsonArray[i]['@status'];
                //get the action descr in labels
                if (!Object.isEmpty(action) && (!Object.isEmpty(this.labelsPendReqHash.get(action)))) {
                    action = this.labelsPendReqHash.get(action)
                } else {
                    action = global.getLabel('noActio')
                }
                //get the month
                datumMonth = Date.parseExact(datum, "yyyy-MM-dd").toString('MM');
                //save the info in the hash of its month
                if (datumMonth == this.currentMonth) {
                    //hash with the info of the CURRENT MONTH
                    this.pendReqCurrentMonthHash.set(id,
                        $H({
                            appId: appId,
                            objId: objId,
                            date: datum,
                            action: action,
                            status: status
                        })
                    );
                } else if (datumMonth == this.nextMonth) {
                    //hash with the info of the NEXTS MONTH
                    this.pendReqNextMonthHash.set(id,
                        $H({
                            appId: appId,
                            objId: objId,
                            date: datum,
                            action: action,
                            status: status
                        })
                    );
                } else if (datumMonth == this.previousMonth) {
                    //hash with the info of the PREVIOUS MONTH
                    this.pendReqPreviuosMonthHash.set(id,
                        $H({
                            appId: appId,
                            objId: objId,
                            date: datum,
                            action: action,
                            status: status
                        })
                    );
                }
            }
            //save the number of records for each month
            this.numberCurrMonth = this.pendReqCurrentMonthHash.size();
            this.numberPrevMonth = this.pendReqPreviuosMonthHash.size();
            this.numberNextMonth = this.pendReqNextMonthHash.size();
            //check if there is any data for the current month (default link)
            if (this.numberCurrMonth != 0) {
                //draw navigation link
                this.drawNavigationLink();
                if (!this.dataLoaded) {
                    //draw legend
                    this.drawLegendPart();
                    //draw empty table
                    this.drawEmptyTable();
                    //update variable
                    this.dataLoaded = true;
                }
                //fill the table
                this.fillTable();
            } else {
                //draw navigation link
                this.drawNavigationLink();
                //hide the div
                this.virtualHtml.down('[id=tableDataPart]').hide();
                //show "No pending requests" message
                this.virtualHtml.down('[id=emptyTableDataPart]').show();
            }
        } else {
            //hide the div
            this.virtualHtml.down('[id=contentPart]').hide();
            //show "No pending requests" message
            this.virtualHtml.down('[id=contentPartEmpty]').show();
        }
    },
    /**
    *@description Method to draw the Navigation Link Part
    */
    drawNavigationLink: function() {
        if (!this.dataLoaded) {
            //html structure
            if(!global.liteVersion){
            var html = "<span id='link_Previous' class='application_action_link pdcPendReq_link'>" + global.getLabel('prevMonth') + "(" + this.numberPrevMonth + ")</span>" +
                       "<span id='link_Current' class='application_action_link pdcPendReq_link'>" + global.getLabel('currMonth') + "(" + this.numberCurrMonth + ")</span>" +
                       "<span id='link_Next' class='application_action_link pdcPendReq_link'>" + global.getLabel('nextMonth') + "(" + this.numberNextMonth + ")</span>";
            }else{
                var html = "<button id='link_Previous' title='" + global.getLabel("prevMonth") + "' class='application_action_link pdcPendReq_link link'>" + global.getLabel('prevMonth') + "(" + this.numberPrevMonth + ")</button>" +
                           "<button id='link_Current' title='" + global.getLabel("currMonth") + "' class='application_action_link pdcPendReq_link link'>" + global.getLabel('currMonth') + "(" + this.numberCurrMonth + ")</button>" +
                           "<button id='link_Next' title='" + global.getLabel("nextMonth") + "' class='application_action_link pdcPendReq_link link'>" + global.getLabel('nextMonth') + "(" + this.numberNextMonth + ")</button>";
            }
            //insert the links
            this.virtualHtml.down('[id=navigationPart]').insert(html);
        }
        //events for each link
        this.virtualHtml.down('[id=link_Previous]').observe('click', this.updateInfo.bind(this, 'Previous'));
        this.virtualHtml.down('[id=link_Current]').observe('click', this.updateInfo.bind(this, 'Current'));
        this.virtualHtml.down('[id=link_Next]').observe('click', this.updateInfo.bind(this, 'Next'));
        //apply styles in the selected link
        this.virtualHtml.down('[id=link_' + this.actualLink + "]").removeClassName('application_action_link');
        this.virtualHtml.down('[id=link_' + this.actualLink + "]").addClassName('application_text_bolder');
        //stop the event for the selected link
        this.virtualHtml.down('[id=link_' + this.actualLink + "]").stopObserving('click');
    },
    /**
    *@description Method to update the table depending of the link selected
    */
    updateInfo: function(link) {
        //update the link clicked
        this.actualLink = link;
        //update styles of links
        this.virtualHtml.down('[id=link_' + this.oldLink + "]").removeClassName('application_text_bolder');
        this.virtualHtml.down('[id=link_' + this.oldLink + "]").addClassName('application_action_link');
        this.virtualHtml.down('[id=link_' + this.actualLink + "]").removeClassName('application_action_link');
        this.virtualHtml.down('[id=link_' + this.actualLink + "]").addClassName('application_text_bolder');
        //update events of links
        this.virtualHtml.down('[id=link_' + this.oldLink + "]").observe('click', this.updateInfo.bind(this, this.oldLink));
        this.virtualHtml.down('[id=link_' + this.actualLink + "]").stopObserving('click');
        //update the prevoius clicked link
        this.oldLink = this.actualLink;
        //get the info to show
        if (this.actualLink == 'Current') {
            this.DataToShowHash = this.pendReqCurrentMonthHash.clone();
        } else if (this.actualLink == 'Previous') {
            this.DataToShowHash = this.pendReqPreviuosMonthHash.clone();
        } else if (this.actualLink == 'Next') {
            this.DataToShowHash = this.pendReqNextMonthHash.clone();
        }
        if (this.DataToShowHash.keys().length != 0) {
            //remove the Search field
            if (this.virtualHtml.down('[id=PendReq_searchBox]'))
                this.virtualHtml.down('[id=PendReq_searchBox]').value = global.labels.get('search');
            //show the div and hide the empty message
            this.virtualHtml.down('[id=tableContent]').show();
            this.virtualHtml.down('[id=legend]').show();
            this.virtualHtml.down('[id=tableContentEmpty]').hide();
            //update variable
            this.makeSearch = false;
            //hide the empty message div
            this.virtualHtml.down('[id=emptyTableDataPart]').hide();
            //show the div
            this.virtualHtml.down('[id=tableDataPart]').show();
            if (!this.dataLoaded) {
                //draw legend
                this.drawLegendPart();
                //draw empty table
                this.drawEmptyTable();
                //update variable
                this.dataLoaded = true;
            }
            //fill the table
            this.fillTable();
        } else {
            //hide the div
            this.virtualHtml.down('[id=tableDataPart]').hide();
            //show "No pending requests" message
            this.virtualHtml.down('[id=emptyTableDataPart]').show();
        }
    },
    /**
    *@description Method to draw the Legend Part
    */
    drawLegendPart: function() {
        if(!global.liteVersion){
		var legendJSON = {
			legend: [
			{
				img: "application_icon_red",
				text: global.getLabel('SENT_DELETION')
			},
			{
				img: "application_icon_orange",
		                text: global.getLabel('SENT_APPROVAL')
			}
			],
			showLabel: global.getLabel('showLgnd'),
			hideLabel: global.getLabel('closeLgnd')
		};
        }else{
            var legendJSON = {
                legend: [
                {
                    img: "application_icon_red",
                    code: "\u25a0",
                    text: global.getLabel('SENT_DELETION')
                },
                {
                    img: "application_icon_orange",
                    code: "\u25b2",
                    text: global.getLabel('SENT_APPROVAL')
                }
                ],
                showLabel: global.getLabel('showLgnd'),
                hideLabel: global.getLabel('closeLgnd')
            };
        }
        var legendHTML = getLegend(legendJSON);
        this.virtualHtml.down('[id=legend]').update(legendHTML);
    },
    /**
    *@description Method to draw the empty table(only header)
    */
    drawEmptyTable: function(_objLabels) {
        //draw the TABLE HEADER
        var table = "<table id='pdcPendReq_table_" + this.tabId + "' class='sortable pdcPendReq_table'>" +
            "<thead class='applicationmyData_headerContainer'>" +
            "<tr>" +
            "<th class='table_sortfirstdesc application_main_text' >" + global.labels.get('reqDate') + "</th>" +
            "<th class='application_main_text' >" + global.labels.get('type') + "</th>" +
            "<th class='application_main_text' >" + global.labels.get('status') + "</th>" +
            "</tr>" +
            "</thead>" +
            "<tbody id='pdcPendReqTable_body'></tbody>" +
            "</table>";
        this.virtualHtml.down('[id=tableContent]').insert(table);
    },
    /**
    *@description Method to fill the table
    */
    fillTable: function() {
        //get the hash to fill the table
        if (this.makeSearch) {
            this.DataToShowHash = this.DataFilteredHash.clone();
            this.makeSearch = false;
        } else {
            if (this.actualLink == 'Current') {
                this.DataToShowHash = this.pendReqCurrentMonthHash.clone();
            } else if (this.actualLink == 'Previous') {
                this.DataToShowHash = this.pendReqPreviuosMonthHash.clone();
            } else if (this.actualLink == 'Next') {
                this.DataToShowHash = this.pendReqNextMonthHash.clone();
            }
            this.AllCurrentData = this.DataToShowHash.clone();
        }
        var id, appId, date, datum, action, status;
        var body = '';
        this.DataToShowHash.each(function(pair) {
            //get the info
            id = pair.key;
            appId = pair[1].get('appId');
            objId = pair[1].get('objId');
            date = pair[1].get('date');
            datum = Date.parseExact(date, 'yyyy-MM-dd').toString(this.dateFormat);
            action = pair[1].get('action');
            status = pair[1].get('status');
            //create html structure
            body += "<tr id='row_" + id + '_' + appId + "'>" +  "<td>";
            if(!global.liteVersion){
                body += "<span id='link__" + id + '__' + appId + '__' + objId + "' class='application_action_link selectorDummyClass'>" + datum + "</span>";
            }else{
                body += "<button id='link__" + id + '__' + appId + '__' + objId + "' class='application_action_link selectorDummyClass link stdLinkTableKit'>" + datum + "</button>";
            }
            body +=    "<div id='req_" + id + "_" + appId + "_" + objId + "' class='pdcPendReq_details' style='display:none'></div></td>" +
                        "<td class='application_main_text pdcPendReq_alignTop'>" + action + "</td>";
            if (status == '10' || status == '20' || status == '30') {
                if(global.liteVersion){
			body += "<td class='pdcPendReq_alignTop'><span class='application_icon_orange pdcPendReq_statusColumn'>\u25b2</span><span class='hidden'>" + global.getLabel('SENT_APPROVAL') + "</span></td>";
                }else{
			body += "<td class='pdcPendReq_alignTop'><span class='application_icon_orange pdcPendReq_statusColumn'></span><span class='hidden'>" + global.getLabel('SENT_APPROVAL') + "</span></td>";
                }
            } else if (status == '21' || status == '31') {
                if(global.liteVersion){
			body += "<td class='pdcPendReq_alignTop'><span class='application_icon_red pdcPendReq_statusColumn'>\u25a0</span><span class='hidden'>" + global.getLabel('SENT_DELETION') + "</span></td>";
                }else{
			body += "<td class='pdcPendReq_alignTop'><span class='application_icon_red pdcPendReq_statusColumn'></span><span class='hidden'>" + global.getLabel('SENT_DELETION') + "</span></td>";
                }
            } else {
                body += "<td></td>";
            }
            body += "</tr>";
            //For SEARCH FIELD
            var row = $H({
                index: id + '_' + appId,
                description: action,
                date: sapToDisplayFormat(date)
            });
            var searchText = row.get('description') + ' ' + row.get('date');
            //and set it on the data attribute(for not asking SAP anymore about this task)
            this.data.set(row.get('index'), [searchText.toLowerCase(), row]);
            this.data.set(id + '_' + appId, [searchText.toLowerCase(), row]);
            //End - For SEARCH FIELD
        } .bind(this));
        //insert the body in the table
        this.virtualHtml.down('[id=pdcPendReqTable_body]').update(body);
        //make the sortable table with pagination
        if (!this.tableLoaded) {
            this.PRtableKit = new tableKitWithSearch(this.virtualHtml.down('table#pdcPendReq_table_' + this.tabId), {
                pages: global.paginationLimit,
                marginL: 100,
                searchLabel: global.getLabel('search'),
                noResultsLabel: global.getLabel('noResults'),
                exportMenu: true
            });
            this.tableLoaded = true;
        } 
        else
            this.PRtableKit.reloadTable(this.virtualHtml.down('table#pdcPendReq_table_' + this.tabId), true);
        if(this.firstFillPD == true){
            //create event in the table
            this.virtualHtml.down("[id=pdcPendReq_table_" + this.tabId + "]").observe("click", this.getDetailsInformation.bindAsEventListener(this));
            this.firstFillPD = false;
        }

    },
    /**
    *@description Method to get the details
    */
    getDetailsInformation: function(event) {
        //get the element clciked
        var element = event.element();
            var link = element.getAttribute('id');
        if(!Object.isEmpty(link)){//Check first if the element has a id
            var id = link.split('__')[1];
            var appId = link.split('__')[2];
            var objId = link.split('__')[3];
            // check if the element clicked is a link
            if (element.id.split('__')[0] == 'link') {
                //get the info
                var cont = $('req_' + id + '_' + appId + '_' + objId);
                if(cont && cont.innerHTML==""){
                    var xml = "<EWS>" +
                              "<SERVICE>GET_REQUEST</SERVICE>" +
                              "<OBJ TYPE='" + global.objectType + "'>" + objId + "</OBJ>" +
                              "<PARAM>" +
                                  "<req_id>" + id + "</req_id>" +
                                  "<APPID>" + appId + "</APPID>" +
                              "</PARAM>" +
                          "</EWS>";
                     this.makeAJAXrequest($H({
                         xml: xml,
                         successMethod: this.showHideDetails.bind(this, id, appId, objId, cont)
                     }));
                 }else{
                        this.showHideDetails(id, appId, objId, cont);
                 }
            }
        }
    },
    /**
    *@description Method to fill the table
    */
    showHideDetails: function(id, appId, objId, cont, json) {
        if (cont) {
                if (cont.innerHTML == "") {
                    this.auxJson = this.pendReqJson;
                    //Clear the listmode flag
                    if(!Object.isEmpty(json.EWS.o_widget_screens) && !Object.isEmpty(json.EWS.o_widget_screens.yglui_str_wid_screen))
                        json.EWS.o_widget_screens.yglui_str_wid_screen.yglui_str_wid_screen['@list_mode'] = null;
                    //var json = this.getJsonFieldPanel(id, appId);
                    if (!Object.isEmpty(json)) {
                        var objParameters = {
                                appId: 'ED_PD',
                                mode: 'display',
                                json: json
                        };
                        var objFieldsPanel = new getContentModule(objParameters).getHtml();
                        $('req_' + id + '_' + appId + '_' + objId).insert(objFieldsPanel);
                    }
                }
                //show/hide details
                $('req_' + id + '_' + appId + '_' + objId).toggle();
                //show/hide button to view all the table
        }
    },
    /**
    *@description Method to prepare the info to show using fieldPanel
    */
    getJsonFieldPanel: function(id, appId) {
        if (!Object.isEmpty(this.auxJson.EWS.o_records.yglui_str_pend_req)) {
            //get all records
            var details = objectToArray(this.auxJson.EWS.o_records.yglui_str_pend_req);
            var rgRecord;
            for (var i = 0; i < details.size(); i++) {
                //get every record
                rgRecord = details[i];
                //if the record is the record clicked
                if (rgRecord["@req_id"] == id) {
                    //get field_settings for fieldPanel
                    var aux = objectToArray(this.auxJson.EWS.o_fieldsettings.yglui_str_appid_fs_settings);
                    var screen_values = rgRecord["@screen"];
                    //get field_values for fieldPanel
                    this.auxJson.EWS.o_field_values = rgRecord.record;
                    
                    var objTemp = '';
                    var found = false;
                    for (var j = 0; j < aux.length && !found; j++) {
                        if ((aux[j]['@appid'] == appId) && (aux[j].o_field_settings.yglui_str_wid_fs_record['@screen'] == screen_values)) {
                            objTemp = aux[j].o_field_settings;
                            found = true;
                        }
                    }
                    this.auxJson.EWS.o_field_settings = objTemp;
                    //remove buttons (NEXT RELEASE BUTTONS ARE REMOVED IN THE XML OUT)
                    //if (this.auxJson.EWS.o_field_values.yglui_str_wid_record.contents.yglui_str_wid_content.buttons) {
                    if (this.auxJson.EWS.o_field_values.yglui_str_wid_record.contents) {
                        delete this.auxJson.EWS.o_field_values.yglui_str_wid_record.contents.yglui_str_wid_content.buttons;
                    }
                    
                    //Now we set the o_widget_screens attribute
                    if(!Object.isEmpty(this.auxJson.EWS.o_wid_scr)){
                        var o_wids = objectToArray(this.auxJson.EWS.o_wid_scr.yglui_str_wid_screen.yglui_str_wid_screen);
                        found = false;
                        objTemp = '';
                        for (var j = 0; j < o_wids.length && !found; j++) {
                            if ((o_wids[j]['@appid'] == appId) && (o_wids[j]['@screen'] == screen_values)) {
                                //Selecting the record
                                o_wids[j]['@selected'] = "X";
                                //Deselecting the listmode
                                o_wids[j]['@list_mode'] = null;
                                objTemp = o_wids[j];
                                found = true;
                            }
                        }
                        var elem = { yglui_str_wid_screen : objTemp};
                        this.auxJson.EWS.o_widget_screens = { yglui_str_wid_screen : elem };
                    }
                    return this.auxJson;
                }
            }
        }
        return null;
    },
    /**
    *@description Method to reload the pending requests info after 1 sec
    */
    startReloadTimeout: function(instance, appId) {
        instance.dataLoaded  = false;
        instance.timeoutReloadExpired = true;
        var aux;
        if(instance.virtualHtml.down("[id=contentPart]"))
            aux = instance.virtualHtml.down("[id=contentPart]").remove();
        instance.fillPendingRequestWidget(appId);

        //instance.callToGetPendingRequest(appId);
    },
    /**
    *@description Method to reload the pending requests info after changes
    */
    reloadPendingRequests: function(appId) {
        if (this.timeoutReloadExpired) {
            this.startReloadTimeout.delay(1, this, appId);
            this.timeoutReloadExpired = false;
        }
    },
    /**
    *@description Closes the application
    */
    close: function($super) {
        $super();
        document.stopObserving('EWS:widgetInformationChanged_' + this.tabId, this.reloadPendingRequests);
    }
});

