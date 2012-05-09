/**
 * @constructor FastEntryMenu
 * @description Implements Fast Entry menu.
 * @augments EmployeeMenu
 */

var FastEntryMenu = Class.create(EmployeeMenu,
/**
 * @lends FastEntryMenu
 */
{
    /**
     * Constructor of the class FastEntryMenu
     */
 	initialize: function($super, id, options){
		$super(id, options);
		this.getActionsService = "GET_CON_ACTIO";
		this.getResultListService = "GET_RESULT_LST";
		this.deleteResultService = "DEL_RESULT";
		this.getResultService = "GET_RESULT";
		this.getEventsService = "GET_EVENTS"; // INCAPP structure
		this.dateFormat = "dd.MM.yyyy";
	},
    /**
     * @description Shows the menu
     */
	show: function($super, element){
		this.changeTitle(global.getLabel('fastEntryRes'));
        if (!this.menuContent)
            this._setInitialHTML();
		$super(element);
	},
    /**
     * @description Builds the initial HTML code
     */
	_setInitialHTML: function() {
	    this.menuContent = new Element('table', {
	        id: 'FastEntryMenu_content'
	    });
        this.changeContent(this.menuContent);
        var html = "<tr>" +
                      "<td id='FastEntryMenu_content_legend'></td>" +
                      "<td id='FastEntryMenu_content_refresh'></td>" +
                   "</tr>" +
                   "<tr>" +
                      "<td colspan=2 id='FastEntryMenu_content_reports'></td>" +
                   "</tr>" +
                   "<tr>" +
                      "<td colspan=2 id='FastEntryMenu_content_launch'></td>" +
                   "</tr>";
        this.menuContent.update(html);
        
        var legendJSON;
        if(!global.liteVersion){
            legendJSON = { 
                legend: [
                    { img: "FastEntryMenu_legend_iconGreen", text: global.getLabel('completedOk') },
                    { img: "FastEntryMenu_legend_iconRed", text: global.getLabel('completedError') },
                    { img: "FastEntryMenu_legend_iconOrange", text: global.getLabel('inProgress') }
                ],
                showLabel: global.getLabel('showLgnd'),
                hideLabel: global.getLabel('closeLgnd')
            };
        }else{
            legendJSON = { 
                legend: [
                    { code: "\u25cf", img: "FastEntryMenu_legend_iconGreen", text: global.getLabel('completedOk') },
                    { code: "\u25a0", img: "FastEntryMenu_legend_iconRed", text: global.getLabel('completedError') },
                    { code: "\u25b2", img: "FastEntryMenu_legend_iconOrange", text: global.getLabel('inProgress') }
                ],
                showLabel: global.getLabel('showLgnd'),
                hideLabel: global.getLabel('closeLgnd')
            };
        }
        var legendHTML = getLegend(legendJSON, 1);
        this.menuContent.down('[id=FastEntryMenu_content_legend]').update(legendHTML);
        this.menuContent.down('[id=FastEntryMenu_content_refresh]').update("<span class='application_action_link'>" + global.getLabel('refresh') + "</span>");
        this.menuContent.down('[id=FastEntryMenu_content_launch]').update("<span id='FastEntryMenu_content_launch_text' class='application_action_link'>" + global.getLabel('fastEntryLaunch') + "</span>");
        this.menuContent.down('[id=FastEntryMenu_content_launch_text]').observe('click', this._getIncapp.bind(this));
        this.menuContent.down('[id=FastEntryMenu_content_refresh]').observe('click', this._refreshReports.bind(this));
        this._refreshReports();
	},
    /**
     * @description Asks the backend for incapp structure
     */
	_getIncapp: function() {
	    if (!this.fastEntryActions) {
            var xml = "<EWS>" +
                      "<SERVICE>" + this.getEventsService + "</SERVICE>" +
                      "<OBJECT TYPE='" + global.objectType + "'></OBJECT>" +
                      "<PARAM>" +
                          "<o_begda_i>" + Date.today().toString('yyyy-MM-dd') + "</o_begda_i>" +
                          "<o_endda_i>" + Date.today().toString('yyyy-MM-dd') + "</o_endda_i>" +
                          "<o_li_incapp></o_li_incapp>" +
                      "</PARAM>" +
                      "</EWS>";
            this.makeAJAXrequest($H({xml: xml, successMethod: '_setIncapp'}));
        }
        else
            this._getFastEntryList();
	},
    /**
     * @description Sets incapp structure
     * @param {JSON} json Information from GET_EVENTS service
     */
     _setIncapp: function(json) {
        this.incapp = json.EWS.o_li_incapp.yglui_str_incap2;
        this.eventCodes = new Hash();
        var length = this.incapp.length;
        for (var i = 0; i < length; i++) {
            var event = this.incapp[i]['@event'];
            if (Object.isEmpty(this.eventCodes.get(event))) {
                var properties = new Hash();
                var appids = new Array();
                properties.set('appids', appids);
                // We assume all appids from an event will have the same filter
                var filterFlag = this.incapp[i]['@include_app'];
                properties.set('filter', filterFlag);
                this.eventCodes.set(event, properties);
            }
            var appid = this.incapp[i]['@appid'];
            if (!Object.isEmpty(appid))
                this.eventCodes.get(event).get('appids').push(appid);
        }
        this._getFastEntryList();
     },
    /**
     * @description Asks the backend for fast entry actions
     */
	_getFastEntryList: function() {
	    if (!this.fastEntryActions) {
            var xml = "<EWS>" +
                      "<SERVICE>" + this.getActionsService + "</SERVICE>" +
                      "<OBJECT TYPE='" + global.objectType + "'>" + global.objectId + "</OBJECT>" +
                      "<PARAM>" +
                          "<CONTAINER>" + this.menuId + "</CONTAINER>" +
                          "<MENU_TYPE>N</MENU_TYPE>" +
                      "</PARAM>" +
                      "</EWS>";
            this.makeAJAXrequest($H({xml: xml, successMethod: '_newFastEntry'}));
        }
        else
            this._newFastEntry();
	},
    /**
     * @description Shows a balloon with all fast entry actions
     * @param {JSON} json Information from GET_CON_ACTIO service
     */
	_newFastEntry: function(json) {
	    if (!this.fastEntryActions)
	        this.fastEntryActions = json.EWS.o_actions;
	    var actions = new Element("ul", {
	        "class": "FastEntryMenu_optionList"
	    });
	    objectToArray(this.fastEntryActions.yglui_vie_tty_ac).each( function(action) {
	        var actionArray = action["@actiot"].split('((L))');
		    var actionText = actionArray[0] + "<span class='application_action_link'>" + actionArray[1] + "</span>" + actionArray[2];
		    var listElement = new Element("li").update(actionText);
		    listElement.observe("click", function() {
	            global.open( $H({
	                app: {
	                    appId: action['@tarap'],
	                    tabId: this.application.tabId,
	                    view: action['@views']
	                },
	                eventCodes: this.eventCodes
	            }));
		    }.bind(this));
		    actions.insert(listElement);
        }.bind(this));
        balloon.showOptions($H({
            domId: 'FastEntryMenu_content_launch_text',
            content: actions
        }));
	},
    /**
     * @description Asks the backend for the report list
     */
	_refreshReports: function() {
	    this.menuContent.down('[id=FastEntryMenu_content_reports]').update("<span class='application_main_soft_text'>" + global.getLabel('loading..') + "</span>");
	    var reportTypes = new Array();
	    reportTypes.push('WA_FE'); // Fast Entry Reports
	    reportTypes.push('PCR_CDAT'); // Fast PCR Reports
	    var length = reportTypes.length;
	    this.reportLists = 0;
	    this.reports = new Array();
	    for (var i = 0; i < length; i++) {
	        var xml = "<EWS>" +
	                      "<SERVICE>" + this.getResultListService + "</SERVICE>" +
	                      "<PARAM>" +
	                          "<I_REPORT_TYPE>" + reportTypes[i] + "</I_REPORT_TYPE>" +
	                      "</PARAM>" +
	                  "</EWS>";
            this.makeAJAXrequest($H({ xml: xml, successMethod: '_showReports', ajaxID: { length: length, type: reportTypes[i] } }));
        }
	},
    /**
    *@description Displays the report list
    *@param {JSON} json Information from GET_RESULT_LST service
    *@param {Hash} ID Request ID
    */
    _showReports: function(json, ID) {
        if (!this.statusLabels && Object.jsonPathExists(json, 'EWS.labels.item')) {
            var labels = objectToArray(json.EWS.labels.item);
            this.statusLabels = new Hash();
            for (var i = 0; i < labels.length; i++)
                this.statusLabels.set(labels[i]['@id'], labels[i]['@value']);
        }
        if (Object.jsonPathExists(json, 'EWS.o_result_list.yglui_str_rp_o_resultlist')) {
            var reports = objectToArray(json.EWS.o_result_list.yglui_str_rp_o_resultlist);
            var repLength = reports.length;
            var repType = ID.type;
            for (var i = 0; i < repLength; i++) {
                var text = reports[i]['@title'];
                var date = Date.parseExact(reports[i]['@datum'], "yyyy-MM-dd").toString(this.dateFormat);
                var status = reports[i]['@status'];
                var reportId = reports[i]['@result_id'];
                var tr = new Element('tr');
                var deleteTd = new Element('td');
                tr.insert(deleteTd);
                var textDiv = new Element('div', {
                    'class': 'FastEntryMenu_table_textColumn',
                    'title': text
                }).insert(text);
                tr.insert(new Element('td').insert(textDiv));
                tr.insert(new Element('td').insert(new Element('div').insert(date)));
                var statusTextDiv = new Element('div', {
                    'class': 'FastEntryMenu_table_iconText'
                }).insert(status);
                var statusIconDiv = new Element('div');
                var statusText = "";
                if (!Object.isEmpty(this.statusLabels)) {
                    statusText = Object.isEmpty(this.statusLabels.get('Reporting_status_' + status)) ? "" : this.statusLabels.get('Reporting_status_' + status);
                }
                statusIconDiv.writeAttribute('title', statusText);
                switch (status) {
                    case 'F': // Finished
                        statusIconDiv.addClassName('application_icon_green FastEntryMenu_table_statusIcon');
                        if(global.liteVersion)
                            statusIconDiv.update("\u25cf");
                        var deleteDiv = new Element('div', {
                            'class': 'application_currentSelection FastEntryMenu_table_deleteIcon'
                        }).observe('click', this._confirmationMessage.bind(this, reportId));
                        if(global.liteVersion)
                            deleteDiv.update('x');
                        deleteTd.insert(deleteDiv);
                        textDiv.addClassName('application_action_link');
                        textDiv.observe('click', this._getReportDetails.bind(this, reportId, repType));
                        break;
                    case 'R': // Running
                    case '-':
                        statusIconDiv.addClassName('application_icon_orange FastEntryMenu_table_statusIcon');
                        if(global.liteVersion)
                            statusIconDiv.update("\u25b2");
                        break;
                    case '0': // Cancelled
                    case '1': // Not found
                    case 'A': // Aborted
                    case 'E': // Error
                    case 'D': // Deleted
                        statusIconDiv.addClassName('application_icon_red FastEntryMenu_table_statusIcon');
                        if(global.liteVersion)
                            statusIconDiv.update("\u25a0");
                        var deleteDiv = new Element('div', {
                            'class': 'application_currentSelection FastEntryMenu_table_deleteIcon'
                        }).observe('click', this._confirmationMessage.bind(this, reportId));
                        deleteTd.insert(deleteDiv);
                        if(global.liteVersion)
                            deleteDiv.update('x');
                        break;
                    default:
                        break;
                }
                var statusTd = new Element('td');
                statusTd.insert(statusTextDiv);
                statusTd.insert(statusIconDiv);
                tr.insert(statusTd);
                this.reports.push(tr);
            }
        }
        var length = parseInt(ID.length);
        this.reportLists++;
        if (this.reportLists == length) {
            var contentHTML = "<table id='FastEntryMenu_table' class='sortable'>" +
                                  "<thead class='application_header_barTable'>" +
                                      "<tr>" +
                                          "<th class='table_noSort table_nosort FastEntryMenu_table'></th>" +
                                          "<th class='FastEntryMenu_table_textColumn FastEntryMenu_table'>" + global.getLabel('results') + "</th>" +
                                          "<th class='table_sortfirstdesc FastEntryMenu_table'>" + global.getLabel('date') + "</th>" +
                                          "<th class='FastEntryMenu_table'></th>" +
                                      "</tr>" +
                                  "</thead>" +
                                  "<tbody id='FastEntryMenu_table_tbody'></tbody>" +
                              "</table>";
            this.menuContent.down('[id=FastEntryMenu_content_reports]').update(contentHTML);
            repLength = this.reports.length;
            if (repLength > 0) {
                var tableBody = this.menuContent.down('[id=FastEntryMenu_table_tbody]');
                for (var i = 0; i < repLength; i++)
                    tableBody.insert(this.reports[i]);
                    
                //TableKit.Sortable.init($(document.body).down("[id=FastEntryMenu_table]"), { pages: parseInt(global.paginationLimit) });
                new tableKitWithSearch($(document.body).down("[id=FastEntryMenu_table]"), { pages: parseInt(global.paginationLimit), searchLabel: global.getLabel('search'), noResultsLabel: global.getLabel('noResults'), exportMenu: true });
                //TableKit.options.autoLoad = false;

            }
            else
                this.menuContent.down('[id=FastEntryMenu_content_reports]').update("<span class='application_text_bolder'>" + global.getLabel('noRecords') + "</span>");
        }
    },
    /**
    *@description Shows a confirmation box when we are going to delete a report
    *@param {String} reportId Report ID
    */
    _confirmationMessage: function(reportId) {
        var contentHTML = new Element('div');
        var text = global.getLabel('areYouSureReport');
        contentHTML.insert(text);
        // Buttons
        var buttonsJson = {
            elements: [],
            mainClass: 'moduleInfoPopUp_stdButton_div_left'
        };
        var callBack = function() {
            fastEntryPopUp.close();
            delete fastEntryPopUp;
            this._deleteReport(reportId);
        } .bind(this);
        var callBack2 = function() {
            fastEntryPopUp.close();
            delete fastEntryPopUp;
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
        var aux2 = {
            idButton: 'No',
            label: global.getLabel('no'),
            handlerContext: null,
            className: 'moduleInfoPopUp_stdButton',
            handler: callBack2,
            type: 'button',
            standardButton: true
        };
        buttonsJson.elements.push(aux);
        buttonsJson.elements.push(aux2);
        var ButtonObj = new megaButtonDisplayer(buttonsJson);
        var buttons = ButtonObj.getButtons();
        // Insert buttons in div
        contentHTML.insert(buttons);
        var width = 350;
        var fastEntryPopUp = new infoPopUp({
            closeButton: $H({
                'textContent': global.getLabel('close'),
                'callBack': callBack2
            }),
            htmlContent: contentHTML,
            indicatorIcon: 'information',
            width: width
        });
        fastEntryPopUp.create();
    },
    /**
    *@description Deletes a report from the list
    *@param {String} reportId Report ID
    */
    _deleteReport: function(reportId) {
        var xml = "<EWS>" +
              "<SERVICE>" + this.deleteResultService + "</SERVICE>" +
              "<PARAM><I_RESULT_IDS>" +
                  "<YGLUI_STR_RP_RESULT_ID result_id='" + reportId + "'></YGLUI_STR_RP_RESULT_ID>" +
              "</I_RESULT_IDS></PARAM>" +
          "</EWS>";
        this.makeAJAXrequest($H({ xml: xml, successMethod: '_refreshReports' }));
    },
    /**
    *@description Asks the backend for a report's details
    *@param {String} reportId Report ID
    *@param {String} reportType Report Type (Fast entry/Fast PCR)
    */
    _getReportDetails: function(reportId, reportType) {
        var xml = "<EWS>" +
              "<SERVICE>" + this.getResultService + "</SERVICE>" +
              "<PARAM>" +
                  "<I_RESULT_ID>" + reportId + "</I_RESULT_ID>" +
                  "<I_OUTPUT>FEO</I_OUTPUT>" + // Fast Entry Output
              "</PARAM>" +
          "</EWS>";
        this.makeAJAXrequest($H({ xml: xml, successMethod: '_showReportDetails', ajaxID: { type: reportType } }));
    },
    /**
    *@description Displays one report's details
    *@param {JSON} json Information from GET_RESULT service
    *@param {Hash} ID Request ID
    */
    _showReportDetails: function(json, ID) {
        if (Object.jsonPathExists(json, 'EWS.o_result.yglui_str_rp_o_stresult_tab.values.yglui_str_rp_o_stresult_values')) {
            var rows = objectToArray(json.EWS.o_result.yglui_str_rp_o_stresult_tab.values.yglui_str_rp_o_stresult_values);
            var length = rows.length;
            var type = ID.type;
            var paginationLimit = parseInt(global.paginationLimit);
            if (paginationLimit > 20)
                paginationLimit = 20;
            switch (type) {
                case 'WA_FE':
                    // Index to know the start of the error messages
                    var separationIndex = -1;
                    for (var i = 0; (i < length) && (separationIndex == -1); i++) {
                        if (Object.isEmpty(rows[i].columns))
                            separationIndex = i;
                    }
                    var creations = ((separationIndex - 1) > 0); // -1 --> Title
                    var errors = ((separationIndex + 2) < length); // +2 --> Separator + Title
                    // Message saying the number of successful events
                    var successMessage = "<br /><span>" + rows[0].columns.yglui_str_rp_o_stresult_column['@value'] + "</span>";
                    if (creations) {
                        var message = "";
                        for (var i = 1; i < separationIndex; i++) {
                            var rowText = rows[i].columns.yglui_str_rp_o_stresult_column['@value'];
                            var employee = rowText.substring(0, rowText.indexOf('[') - 1); // We delete char "["
                            var errorMessage = rowText.substring(rowText.indexOf(']') + 4); // We delete 4 chars: "] - " 
                            message += "<tr><td><span class='applicationtimeEntryScreen_errorTable_employeeColumn' title='" + employee + "'>" + employee + "</span></td>";
                            message += "<td><span class='applicationtimeEntryScreen_errorTable_textColumn' title='" + errorMessage + "'>" + errorMessage + "</span></td>";
                            var type = Object.isEmpty(errorMessage) ? "O" : "I"; // O: Ok, I: Warning
                            var icon = "";
                            switch (type) {
                                case 'O':
                                    icon += "<div class='application_icon_green applicationfastEntryScreen_errorTable_iconDiv' title='" + global.getLabel('completedOk') + "'></div>";
                                    break;
                                case 'I':
                                    icon += "<div class='application_icon_orange applicationfastEntryScreen_errorTable_iconDiv' title='" + global.getLabel('warning') + "'></div>";
                                    break;
                                default:
                                    break;
                            }
                            message += "<td><div class='applicationtimeEntryScreen_errorTable_iconText'>" + type + "</div>" + icon + "</td></tr>"
                        }
                        successMessage += "<table class='sortable' id='FastEntryMenu_creationTable'>" +
                                              "<thead>" +
                                                  "<tr>" +
                                                      "<th class='applicationfastEntryScreen_errorTable_employeeColumn table_sortfirstdesc'>" + global.getLabel('employee') + "</th>" +
                                                      "<th class='applicationfastEntryScreen_errorTable_textColumn'>" + global.getLabel('descr') + "</th>" +
                                                      "<th class='applicationtimeEntryScreen_errorTable_iconColumn'>" + global.getLabel('type') + "</th>" +
                                                  "</tr>" +
                                              "</thead>" +
                                              "<tbody id='FastEntryMenu_creationTable_tbody'>" + message + "</tbody>" +
                                          "</table>";
                    }
                    // Message saying the number of failed events
                    var failureMessage = "";
                    if (errors) {
                        var message = "";
                        for (var i = (separationIndex + 2); i < length; i++) {
                            var rowText = rows[i].columns.yglui_str_rp_o_stresult_column['@value'];
                            var employee = rowText.substring(0, rowText.indexOf('[') - 1); // We delete char "["
                            var errorMessage = rowText.substring(rowText.indexOf(']') + 4); // We delete 4 chars: "] - " 
                            message += "<tr><td><span class='applicationtimeEntryScreen_errorTable_employeeColumn' title='" + employee + "'>" + employee + "</span></td>";
                            message += "<td><span class='applicationtimeEntryScreen_errorTable_textColumn' title='" + errorMessage + "'>" + errorMessage + "</span></td>";
                            message += "<td><div class='applicationtimeEntryScreen_errorTable_iconText'>E</div><div class='application_icon_red applicationfastEntryScreen_errorTable_iconDiv' title='" + global.getLabel('error') + "'></div></td></tr>"
                        }
                        failureMessage += "<br /><br /><span>" + rows[separationIndex + 1].columns.yglui_str_rp_o_stresult_column['@value'] + "</span>" +
                                          "<table class='sortable' id='FastEntryMenu_errorTable'>" +
                                              "<thead>" +
                                                  "<tr>" +
                                                      "<th class='applicationfastEntryScreen_errorTable_employeeColumn table_sortfirstdesc'>" + global.getLabel('employee') + "</th>" +
                                                      "<th class='applicationfastEntryScreen_errorTable_textColumn'>" + global.getLabel('descr') + "</th>" +
                                                      "<th class='applicationtimeEntryScreen_errorTable_iconColumn'>" + global.getLabel('type') + "</th>" +
                                                  "</tr>" +
                                              "</thead>" +
                                              "<tbody id='FastEntryMenu_errorTable_tbody'>" + message + "</tbody>" +
                                          "</table>";
                    }
                    // Container
                    var content = new Element('div', {
                        'class': 'FastEntryMenu_popup_content'
                    });
                    content.insert(successMessage);
                    if (errors)
                        content.insert(failureMessage);
                    // Button
                    var buttonsJson = {
                        elements: [],
                        mainClass: 'moduleInfoPopUp_stdButton_div_left'
                    };
                    var callBack = function() {
                        errorPopUp.close();
                        delete errorPopUp;
                    }.bind(this);     
                    var okButton = {
                        idButton: 'Ok',
                        label: global.getLabel('ok'),
                        handlerContext: null,
                        className: 'moduleInfoPopUp_stdButton',
                        handler: callBack,
                        type: 'button',
                        standardButton: true
                    };
                    buttonsJson.elements.push(okButton);
                    var ButtonObj = new megaButtonDisplayer(buttonsJson);
                    var buttons = ButtonObj.getButtons();
                    content.insert(buttons);
                    // Infopopup
                    var errorPopUp = new infoPopUp({
                        closeButton: $H({
                            'textContent': 'Close',
                            'callBack': callBack
                        }),
                        htmlContent: content,
                        indicatorIcon: 'information',
                        width: 680
                    });
                    errorPopUp.create();
                    // Tablekit
                    if (creations)
                        new tableKitWithSearch($('FastEntryMenu_creationTable'), { pages: paginationLimit, searchLabel: global.getLabel('search'), noResultsLabel: global.getLabel('noResults'), exportMenu: true });
                    if (errors)
                        new tableKitWithSearch($("FastEntryMenu_errorTable"), { pages: paginationLimit, searchLabel: global.getLabel('search'), noResultsLabel: global.getLabel('noResults'), exportMenu: true });
                    break;
                case 'PCR_CDAT':
                    var infoMessage = "<span>" + rows[0].columns.yglui_str_rp_o_stresult_column['@value'] + "</span>";
                    var message = "";
                    for (var i = 1; i < (length - 1); i++) {
                        var rowText = rows[i].columns.yglui_str_rp_o_stresult_column['@value'].strip();
                        message += "<tr><td><span class='applicationtimeEntryScreen_errorTable_textColumn' title='" + rowText + "'>" + rowText + "</span></td></tr>";
                    }
                    if (!Object.isEmpty(message)) {
                        infoMessage += "<br /><table class='sortable' id='FastEntryMenu_infotypeTable'>" +
                                           "<thead>" +
                                               "<tr>" +
                                                   "<th class='applicationfastEntryScreen_errorTable_employeeColumn table_sortfirstdesc'>" + global.getLabel('results') + "</th>" +
                                               "</tr>" +
                                           "</thead>" +
                                           "<tbody id='FastEntryMenu_infotypeTable_tbody'>" + message + "</tbody>" +
                                       "</table>";
                    }
                    infoMessage += "<br /><span>" + rows[length - 1].columns.yglui_str_rp_o_stresult_column['@value'] + "</span><br />";
                    // Container
                    var content = new Element('div');
                    content.insert(infoMessage);
                    // Button
                    var buttonsJson = {
                        elements: [],
                        mainClass: 'moduleInfoPopUp_stdButton_div_left'
                    };
                    var callBack = function() {
                        infotypePopUp.close();
                        delete infotypePopUp;
                    }.bind(this);     
                    var okButton = {
                        idButton: 'Ok',
                        label: global.getLabel('ok'),
                        handlerContext: null,
                        className: 'moduleInfoPopUp_stdButton',
                        handler: callBack,
                        type: 'button',
                        standardButton: true
                    };
                    buttonsJson.elements.push(okButton);
                    var ButtonObj = new megaButtonDisplayer(buttonsJson);
                    var buttons = ButtonObj.getButtons();
                    content.insert(buttons);
                    // Infopopup
                    var infotypePopUp = new infoPopUp({
                        closeButton: $H({
                            'textContent': 'Close',
                            'callBack': callBack
                        }),
                        htmlContent: content,
                        indicatorIcon: 'information',
                        width: 680
                    });
                    infotypePopUp.create();
                    // Tablekit
                    if (!Object.isEmpty(message))
                        new tableKitWithSearch($(document.body).down("[id=FastEntryMenu_infotypeTable]"), { pages: paginationLimit, searchLabel: global.getLabel('search'), noResultsLabel: global.getLabel('noResults'), exportMenu: true });
                    break;
                default:
                    break;
            }
        }
        // If we don't receive results, we show label PDFB (error message)
        else {
            // Obtaining PDFB label
            var labels = objectToArray(json.EWS.labels.item);
            var messageText;
            for (var i = 0, length = labels.length; i < length; i++) {
                if (labels[i]['@id'] == 'PDFB') {
                    messageText = labels[i]['@value'];
                    break;
                }   
            }
            if (!Object.isEmpty(messageText)) {
                // Container
                var content = new Element('div', {
                    'class': 'FastEntryMenu_popup_content'
                }).insert(messageText + "<br />");
                // Button
                var buttonsJson = {
                    elements: [],
                    mainClass: 'moduleInfoPopUp_stdButton_div_left'
                };
                var callBack = function() {
                    infotypePopUp.close();
                    delete infotypePopUp;
                }.bind(this);     
                var okButton = {
                    idButton: 'Ok',
                    label: global.getLabel('ok'),
                    handlerContext: null,
                    className: 'moduleInfoPopUp_stdButton',
                    handler: callBack,
                    type: 'button',
                    standardButton: true
                };
                buttonsJson.elements.push(okButton);
                var ButtonObj = new megaButtonDisplayer(buttonsJson);
                var buttons = ButtonObj.getButtons();
                content.insert(buttons);
                // Infopopup
                var infotypePopUp = new infoPopUp({
                    closeButton: $H({
                        'textContent': 'Close',
                        'callBack': callBack
                    }),
                    htmlContent: content,
                    indicatorIcon: 'information',
                    width: 450
                });
                infotypePopUp.create();
            }
        }
    }
});