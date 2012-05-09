var SendDocumentHistory = new Class.create(Application,
{
    firstSync: true,
    prevEmpSelection: null,

    initialize: function($super, args) {
        $super(args);

        this.toggleFilterHandlerBinding = this.toggleFilterHandler.bindAsEventListener(this);
        this.docTypeSlctChangeHandlerBinding = this.docTypeSlctChangeHandler.bindAsEventListener(this);
        this.dateHandlerBinding = this.dateHandler.bindAsEventListener(this);
        this.searchFocusHandlerBinding = this.searchFocusHandler.bindAsEventListener(this);
        this.searchBlurHandlerBinding = this.searchBlurHandler.bindAsEventListener(this);
        this.searchKeyupHandlerBinding = this.searchKeyupHandler.bindAsEventListener(this);
        this.getDetailsHandlerBinding = this.getDetailsHandler.bindAsEventListener(this);
        this.getCoversheetHandlerBinding = this.getCoversheetHandler.bindAsEventListener(this);
        this.saveChangesHandlerBinding = this.saveChangesHandler.bindAsEventListener(this);

        this.menuSyncBinding = this.menuSync.bindAsEventListener(this);
    },
    getDetailsHandler: function(evt) {
        var doc_id = evt.element().readAttribute('doc_id');
        this.curDocumentID = doc_id;
	var emp = this.emp;
        var xmlin = ''
        + ' <EWS>'
        + '     <SERVICE>DM_GET_DETAILS</SERVICE>'
	+ '     <OBJ TYPE="'+((emp)? 'P': '')+'">'+((emp)? emp: '')+'</OBJ>'
        + '     <PARAM>'
        + '         <I_V_DOC_ID>' + doc_id + '</I_V_DOC_ID>'
        + '     </PARAM>'
        + ' </EWS>';

        this.makeAJAXrequest($H({ xml: xmlin,
            successMethod: 'buildDocumentMetaData',
            xmlFormat: false
        }));
    },

    saveChangesHandler: function(evt) {
        var documentID = $('sentDocs_DocumentID').value;
        var documentComment = $('sentDocs_Comments').value;
			
        var xmlin = ''
            + ' <EWS>'
            + '     <SERVICE>DM_UPD_COMMENTS</SERVICE>'
            + '     <PARAM>'
            + '         <I_V_CONTENT_ID>' + documentID + '</I_V_CONTENT_ID>'
	        + '         <I_V_COMMENT>' + prepareTextToSend(documentComment) + '</I_V_COMMENT>'
            + '     </PARAM>'
            + ' </EWS>';

        this.makeAJAXrequest($H({ xml: xmlin,
            successMethod: 'onSuccess',
            xmlFormat: false
        }));
    },

    onSuccess: function(json) {
        ;
    },

    buildDocumentMetaData: function(json) {

        var documentID = this.curDocumentID;
        var documentName = json.EWS.o_w_details['@doc_name'] || '';
        var documentNameOrig = json.EWS.o_w_details['@doc_name_orig'] || '';
        var documentTrackId = json.EWS.o_w_details['@doc_track_id'];
        var employeeName = "";
        var employeeID = "";
        var documentType = json.EWS.o_w_details['@doc_type'];
        var fileSize = json.EWS.o_w_details['@doc_size'];
        var status = json.EWS.o_w_details['@doc_status'] || '';
        var source = json.EWS.o_w_details['@doc_source'] || '';
        var creationDate = json.EWS.o_w_details['@doc_cdate'] + ' ' + json.EWS.o_w_details['@doc_ctime'];
        var modificationData = json.EWS.o_w_details['@doc_udate'] + ' ' + json.EWS.o_w_details['@doc_utime'];
        var lastModifiedBy = json.EWS.o_w_details['@LastModifiedBy'] || '';
        var comments = json.EWS.o_w_details['@doc_comment'] || '';
        var numberOfPages = json.EWS.o_w_details['@doc_pages'];

        var xmlin = ""
        + "<EWS>"
            + "<SERVICE>DM_GET_THUMB</SERVICE>"
            + "<OBJECT TYPE=''/>"
            + "<DEL/><GCC/><LCC/>"
            + "<PARAM>"
                + "<I_V_CONTENT_ID>" + documentID + "</I_V_CONTENT_ID>"
            + "</PARAM>"
        + "</EWS>";

        var url = this.url;
        while (('url' in url.toQueryParams())) {
            url = url.toQueryParams().url;
        }
        url = (Object.isEmpty(Object.values(((url).toQueryParams()))[0])) ? url + '?xml_in=' : url + '&xml_in=';
		var pager = (numberOfPages!= null)? ''+ global.getLabel('DML_PAGE') + ' 1 ' + global.getLabel('DML_OF') + ' ' + numberOfPages : '';
        var html = ''
        + ' <div id="myDocuments_Details" style="width:100%;height:226px;">'
        + '             <div style="padding:4px;text-align:center;vertical-align:middle;width:22%;float:left;">'
        + '                 <img id="sentDocs_Thumbnail" style="cursor:pointer;width:150px;height:200px;" src="' + url + xmlin + '&nocach=' + Math.floor(Math.random() * 100001) + '" /><br/>'
        + '                 ' + pager
        + '             </div>'
        + '             <div>'
        + '             <div style="padding:4px;text-align:left;vertical-align:middle;float:left;width:30%;">'
        + '                 <span><b>' + global.getLabel('DML_DOCUMENT_PROPERTIES') + ':</b></span><br/><br/>'
        + '                 <span>' + global.getLabel('DML_TYPE') + ' : ' + documentType + '</span><br/>'
        + '                 <span>' + global.getLabel('DML_FILE_SIZE') + ' : ' + fileSize + '</span><br/>'
        + '                 <span>' + global.getLabel('DML_STATUS') + ' : ' + status + '</span><br/>'
        + '                 <span>' + global.getLabel('DML_SOURCE') + ' : ' + source + '</span><br/>'
        + '                 <span>' + global.getLabel('DML_CREATION_DATE') + ' : ' + creationDate + '</span><br/>'
        + '                 <span>' + global.getLabel('DML_MODIFICATION_DATE') + ' : ' + modificationData + '</span><br/>'
        + '                 <span>' + global.getLabel('DML_LAST_MODIFIED_BY') + ' : ' + lastModifiedBy + '</span><br/>'
		+ '                 <span>' + global.getLabel('DML_ORIGNAL_FILE_NAME') + ' : ' + documentNameOrig + '</span><br/>'
		+ '                 <span>' + global.getLabel('DML_TRACKING_ID') + ' : ' + documentTrackId + '</span><br/>'
        + '             </div>'
        + '             <div style="padding:4px;text-align:left;vertical-align:middle;width:40%;float:right;">'
        + '                 ' + global.getLabel('DML_COMMENTS') + ':<br/>'
        + '                 <textarea id="sentDocs_Comments" style="width:98%;height:80px;font-size:11px;" class="application_autocompleter_box">' + prepareTextToEdit(comments) + '</textarea><br>'
	    + '					<input type="hidden" id="sentDocs_DocumentID" value="' + documentID + '">'
        + '                 <div style="float:right;margin-top:2px;" id="sentDocs_SaveChanges">'
        + '                     <div class="leftRoundedCorner">'
        + '                         <span class="centerRoundedButton">' + global.getLabel('DML_SAVE_COMMENTS') + '</span>'
        + '                         <span class="rightRoundedCorner"></span>'
        + '                     </div>'
        + '                 </div>'
        + '             </div>'
        + '             </div>'
        + ' </div>'
        + '';

        var popUp = new infoPopUp({
            closeButton: $H({
                'callBack': function() {
                    popUp.close();
                    delete popUp;
                }
            }),
            htmlContent: html,
            indicatorIcon: 'void',
            width: 800
        });
        popUp.create();



        $('sentDocs_SaveChanges').observe('click', this.saveChangesHandlerBinding);

        $('sentDocs_Thumbnail').observe('click', function() {
            var xmlin = ''
			+ '<EWS>'
				+ '<SERVICE>DM_GET_FILE</SERVICE>'
				+ '<OBJECT TYPE=""/>'
				+ '<DEL/><GCC/><LCC/>'
				+ '<PARAM>'
					+ '<I_V_DOC_ID>' + documentID + '</I_V_DOC_ID>'
				+ '</PARAM>'
			+ '</EWS>';

            var url = this.url;
            while (('url' in url.toQueryParams())) {
                url = url.toQueryParams().url;
            }
            url = (Object.isEmpty(Object.values(((url).toQueryParams()))[0])) ? url + '?xml_in=' : url + '&xml_in=';
            window.location.href = url + xmlin;
        } .bind(this));

    },

    gotoSentDocHandler: function(evt) {

        this.popUp.close();
        this.getTable();

    },

    getCoversheetHandler: function(evt) {
		var emp = this.emp;
        this.track_id = evt.element().readAttribute('track_id');
        var xmlin = ''
        + ' <EWS>'
        + '     <SERVICE>DM_GET_CS_DESR</SERVICE>'
		+ '     <OBJ TYPE="'+((emp)? 'P': '')+'">'+((emp)? emp: '')+'</OBJ>'
        + '     <PARAM>'
        + '         <I_V_TRACK_ID>' + this.track_id + '</I_V_TRACK_ID>'
        + '     </PARAM>'
        + ' </EWS>';

        this.makeAJAXrequest($H({ xml: xmlin,
            successMethod: 'buildCoversheet',
            xmlFormat: false
        }));
    },

    buildCoversheet: function(json) {

        var affected_name = json.EWS.o_w_doc_details['@affected_name'];
        var doc_type = json.EWS.o_w_doc_details['@doc_type'];
        var gcc = json.EWS.o_w_doc_details['@gcc'];
        var lcc = json.EWS.o_w_doc_details['@lcc'];
        var requestor_name = json.EWS.o_w_doc_details['@requestor_name'];
        var ticket_id = json.EWS.o_w_doc_details['@ticket_id'];
        var docTypeLabel = json.EWS.o_w_doc_details['@doc_type_label'];
        var requestorId = json.EWS.o_w_doc_details.requestor['@objid'];
        var affectedName = json.EWS.o_w_doc_details['@affected_name'];
        var affectedId = json.EWS.o_w_doc_details.affected['@objid'];
        var process = json.EWS.o_w_doc_details['@transaction'];
        var ticket = json.EWS.o_w_doc_details['@ticket_id'];
        var mandatory = json.EWS.o_w_doc_details['@mandatory'];
        var isMandatory = false;

        if (mandatory == 'Y') {
            isMandatory = true;
        }

        var div = new Element('div');

        new Coversheet(div, isMandatory, docTypeLabel, doc_type, gcc, lcc, requestor_name, requestorId,
		affectedName, affectedId, process, ticket, this.track_id, this);

        this.popUp = new infoPopUp({
            closeButton: $H({
                'callBack': function() {
                    this.popUp.close();
                    delete this.popUp;
                    this.getTable();
                } .bind(this)
            }),
            htmlContent: div,
            indicatorIcon: 'void',
            width: 800
        });
        this.popUp.create();

    },

    close: function($super) {
        $super();
        document.stopObserving("EWS:employeeMenuSync", this.menuSyncBinding);
    },

    run: function($super, args) {
        $super(args);

        document.observe('EWS:sendDocumentHistory', this.dateHandlerBinding);

        var selectedEmp = global.getSelectedEmployees();
        this.emp = (selectedEmp && selectedEmp[0]) || args.get("emp") || global.objectId;
		
		var populationName = global.getPopulationName(global.currentApplication);
		var population = global.populations.get(populationName);
		if(population){
			var ee = global.getEmployee(this.emp);
		}
		
        var empName;
        if (ee) {
            empName = ee.name;
        }

        this.empName = empName || args.get("empName") || global.name;

        document.observe("EWS:employeeMenuSync", this.menuSyncBinding);

        if (this.firstRun) {
            this.buildSentDocHistory();
        } else {
            this.getTable();
        }
    },

    menuSync: function(event) {

        var args = getArgs(event);
        var employeeId = args.employeeId;
        var employeeName = args.name;
        var selected = args.selected;

        if (selected) {

            this.emp = employeeId;
            this.empName = employeeName;

            this.getTable();
        }
	
        if(this.firstSync){
		this.prevEmpSelection = employeeId;
		this.firstSync=false;
	}else{
		if(this.prevEmpSelection!=employeeId){
			this.getDocTypeList();
		}
		this.prevEmpSelection = employeeId;
	}
    },

    searchFocusHandler: function() {
        $('sendDocumentHistory_search').value = '';
        this.filterValues.search = '';
        this.filterTable();
        this.toggleClearFilter();
    },

    searchBlurHandler: function() {
        if ($('sendDocumentHistory_search').value == '') {
            $('sendDocumentHistory_search').value = global.getLabel('DM_SEARCH');
        }
    },

    searchKeyupHandler: function() {
        this.filterValues.search = $('sendDocumentHistory_search').value;
        this.filterTable();
        this.toggleClearFilter();
    },

    dateHandler: function() {
        if (this.begDatePicker.actualDate && this.endDatePicker.actualDate) {
            this.filterValues.from = this.begDatePicker.actualDate;
            this.filterValues.to = this.endDatePicker.actualDate;
            this.filterTable();
        }
        this.toggleClearFilter();
    },

    toggleFilterHandler: function() {
        $('sentDocHistoryH1Div').toggle();
    },

    docTypeSlctChangeHandler: function() {
        var docType = '';
        if ($('sentDocHistoryDocTypSlct').options[$('sentDocHistoryDocTypSlct').selectedIndex].index) {
            docType = $('sentDocHistoryDocTypSlct').options[$('sentDocHistoryDocTypSlct').selectedIndex].text;
        }
        this.filterValues.docType = docType;
        this.filterTable();
        this.toggleClearFilter();
    },

    clearFilterHandler: function() {
        $('sendDocumentHistory_search').value = global.getLabel('DM_SEARCH');
        $('sentDocHistoryDocTypSlct').selectedIndex = 0;
        this.begDatePicker.clearFields();
        this.endDatePicker.clearFields();

        this.filterValues.from = '';
        this.filterValues.to = '';
        this.filterValues.search = '';
        this.filterValues.docType = '';
        this.filterTable();
        this.toggleClearFilter();
    },

    toggleClearFilter: function() {
        if ((this.filterValues.search)
        || ((this.filterValues.from) || (this.filterValues.to))
        || (this.filterValues.docType)) {
            $('sendDocumentHistory_ClearFilter').show();
        } else {
            $('sendDocumentHistory_ClearFilter').hide();
        }
    },

    filterValues: {
        search: '',
        from: '',
        to: '',
        docType: ''
    },

    originalTable: '',

    filterTable: function() {

        eval('var newJson=' + Object.toJSON(this.originalTable));

        var items = objectToArray(newJson.EWS.o_i_history_list.yglui_str_ecm_sent_doc);
        var date = '';
        for (var i = 0; i < items.length; i++) {
            if (this.filterValues.docType) {
                if (!prepareTextToEdit(items[i]['@doc_type_descr']).include(this.filterValues.docType)) {
                    delete items[i];
                }
            }

            if (this.filterValues.from && this.filterValues.to && items[i]) {
                date = Date.parseExact(items[i]['@last_update'], "yyyy-MM-dd");
                if (!date.between(this.filterValues.from, this.filterValues.to)) {
                    delete items[i];
                }
            }

            if (this.filterValues.search && items[i]) {
				
                if (!prepareTextToEdit(items[i]['@doc_type_descr']).toLowerCase().include(this.filterValues.search.toLowerCase())
				&& !items[i]['@status'].toLowerCase().include(this.filterValues.search.toLowerCase())
				&& !items[i]['@last_update'].toLowerCase().include(this.filterValues.search.toLowerCase())
				) {
                    delete items[i];
                }

            }

        }
        newJson.EWS.o_i_history_list.yglui_str_ecm_sent_doc = items;
        this.updateTable(newJson);
    },


    updateTable: function(json) {

        if (!json.EWS.o_i_history_list || !json.EWS.o_i_history_list.yglui_str_ecm_sent_doc) {
            this.listContainer.update('<span style="padding:2px;">' + global.getLabel('DML_NO_DATA_FOUND') + '.</span>');
            return;
        }

        var items = objectToArray(json.EWS.o_i_history_list.yglui_str_ecm_sent_doc);

        var j = 0;
        items.each(function(item) {
            if (item) {
                j++;
            }
        });
        var table = '<table class="sortable resizable" id="sendDocumentHistory_table">' +
            '<thead>' +
                '<tr>' +
                    '<th class="table_sortfirstdesc text" id="Th1">' + global.getLabel('DML_DOCUMENT_TYPE') + '</th>' +
                    '<th id="Th2" class="text">' + global.getLabel('DML_STATUS') + '</th>' +
                    '<th id="Th3" class="date-iso">' + global.getLabel('DML_DATE') + '</th>' +
                '</tr>' +
            '</thead>' +
            '<tbody ' + ((!Prototype.Browser.IE) ? 'style="height:' + ((j > 16) ? '350px' : '100%') + '"' : '') + '>';

        items.each(function(item) {
			var auxText = item['@last_update'];
			//var auxText = Date.parseExact(auxText, "yyyy-MM-dd").toString('dd/MM/yyyy');
			if (auxText.length > 0) 
				var auxText = Date.parseExact(auxText, "yyyy-MM-dd").toString(global.dateFormat);
			
			if (!item) return;
            table += '<tr>';
            if (parseInt(item['@doc_id'].replace(/0/g,''))) {
                table += '<td><a doc_id="' + item['@doc_id'] + '" class="application_action_link get_details">' + underlineSearch(prepareTextToEdit(item['@doc_type_descr']), this.filterValues.search, 'applicationInbox_textMatch') + '</a></td>';
            } else {
                table += '<td>' + underlineSearch(prepareTextToEdit(item['@doc_type_descr']), this.filterValues.search, 'applicationInbox_textMatch') + '</td>';
            }
            table +=

					'<td>' + underlineSearch(global.getLabel(item['@status'], this.filterValues.search, 'applicationInbox_textMatch')) + '</td>' +
                    '<td>' + underlineSearch(auxText, this.filterValues.search, 'applicationInbox_textMatch');
            if (global.dmc == 'Y' && !parseInt(item['@doc_id'].replace(/0/g,''))) {
                table += '<a track_id="' + item['@track_id'] + '" style="margin-left:20px" title = "' + global.getLabel('DML_VIEW_COVERSHEET') + '" class="application_action_link get_coversheet">' + global.getLabel('DML_VIEW_COVERSHEET') + '</a>';
            }
            table += '</td>' +
                '</tr>';

        } .bind(this));

        if (j == 0) {
            table += '<tr><td colspan="3"><span style="padding:2px;">' + global.getLabel('DML_NO_DOCUMENTS_FOUND') + '.</span></td></tr>'
        }

        table += '</tbody></table>';

        if (this.listContainer.down('table')) {
            this.listContainer.down('table').remove();

        }

        this.listContainer.insert(table);
		
		var table_new = new tableKitWithSearch($('sendDocumentHistory_table'), {
				marginL: 10,
				searchLabel: 'Search',
				noResultsLabel: 'No results found',
				autoLoad: false,
				highlightRowsOnMouseOver: false,
				webSearch: false
		});
		
        this.listContainer.select('a.get_details').each(function(item) {
            item.observe('click', this.getDetailsHandlerBinding);
        } .bind(this));

        this.listContainer.select('a.get_coversheet').each(function(item) {
            item.observe('click', this.getCoversheetHandlerBinding);
        } .bind(this));
    },

    buildSentDocHistory: function() {
        var html = '<span class="application_main_title">' + global.getLabel('DML_SENT_DOCUMENTS_HISTORY') + '</span><br/><br/>';

        html +=
		'<div id="sentDocHistoryH0Div" style="width: 100%;text-align:left">' +
			'<div id="sentDocHistoryH01Div" style="width: 49%; float: left;">' +

			'</div>' +
			'<div id="sentDocHistoryH02Div" style="float: right;margin:8px;">' +
				'<span class="application_action_link" title="' + global.getLabel('DML_FILTER_OPTIONS') + '" style="float:left;margin-right: 10px;">' + global.getLabel('DML_FILTER_OPTIONS') + '</span>' +
				'<input type="text" id="sendDocumentHistory_search" value="' + global.getLabel('DM_SEARCH') + '" class="application_autocompleter_box"/>' +
				'<span id="sendDocumentHistory_ClearFilter" title="' + global.getLabel('DML_CLEAR_FILTER') + '" class="application_action_link" style="margin-left: 10px;">' + global.getLabel('DML_CLEAR_FILTER') + '</span>' +
			'</div>' +
		'</div>';

        html +=
		'<div id="sentDocHistoryH1Div" style="width: 100%; margin-top: 4px; margin-bottom: 10px;float:left;">' +
			'<span style="float: left;">' + global.getLabel('DML_FROM') + ':</span>' +
			'<div id="sentDocHistoryFrom"></div>' +
			'<span style="float: left;">' + global.getLabel('DML_TO') + ':</span>' +
			'<div id="sentDocHistoryTo"></div>' +
			'<span id="sentDocHistoryDocTypLbl">' + global.getLabel('DML_DOCUMENT_TYPE') + ':</span>' +
			'<select id="sentDocHistoryDocTypSlct">' +
				'<option>' + global.getLabel('DML_CHOOSE_DOCUMENT_TYPE') + '...</option>' +
			'</select>' +
		'</div>';

        this.virtualHtml.insert(html);
        $('sendDocumentHistory_ClearFilter').hide();
        $('sendDocumentHistory_ClearFilter').observe('click', this.clearFilterHandler.bind(this));
        $('sentDocHistoryH02Div').down().observe('click', this.toggleFilterHandlerBinding);
        $('sentDocHistoryH1Div').hide();

        this.begDatePicker = new DatePicker('sentDocHistoryFrom', {
            draggable: true,
            events: $H({ correctDate: 'EWS:sendDocumentHistory' })
        });
        this.endDatePicker = new DatePicker('sentDocHistoryTo', {
            draggable: true,
            events: $H({ correctDate: 'EWS:sendDocumentHistory' })
        });
        this.begDatePicker.linkCalendar(this.endDatePicker);

        $('sentDocHistoryDocTypSlct').observe('change', this.docTypeSlctChangeHandlerBinding);
		
        $('sendDocumentHistory_search').observe('focus', this.searchFocusHandlerBinding);

        $('sendDocumentHistory_search').observe('blur', this.searchBlurHandlerBinding);

        $('sendDocumentHistory_search').observe('keyup', this.searchKeyupHandlerBinding);

        this.getDocTypeList();

        this.listContainer = new Element("div", {
            'id': 'myDocuments_ListContainer',
            'class': 'myDocuments_ListContainer',
            'style': 'text-align:left;float:left;width:100%;border:1px solid #DCD2CE;'
        }).update('<span style="padding:2px;">' + global.getLabel('') + '.</span>');
        this.virtualHtml.insert(this.listContainer);

        this.getTable();
    },

    getTable: function() {
        var xmlin = ''
        + ' <EWS>'
        + '     <SERVICE>DM_GET_HISTORY</SERVICE>'
        + ((this.emp == global.objectId) ? '<OBJECT TYPE="P" OBJECTID="' + this.emp + '"></OBJECT>' : '<OBJECT TYPE="P">' + this.emp + '</OBJECT>')
        + '     <DEL/><GCC/><LCC/>'
		+ '		<PARAM>'
		+ '		</PARAM>'
        + ' </EWS>';

        this.makeAJAXrequest($H({ xml: xmlin,
            successMethod: 'buildTable',
            xmlFormat: false
        }));

    },

    buildTable: function(json) {

        this.originalTable = json;
		
		
		if (this.filterValues.docType || 
			this.filterValues.to ||
			this.filterValues.from ||
			this.filterValues.search 
			) {
		this.filterTable();
		return;
		}
		
		
		
        if (!json.EWS.o_i_history_list || !json.EWS.o_i_history_list.yglui_str_ecm_sent_doc) {
            this.listContainer.update('<span style="padding:2px;">' + global.getLabel('DML_NO_DATA_FOUND') + '.</span>');
            return;
        }

        var items = objectToArray(json.EWS.o_i_history_list.yglui_str_ecm_sent_doc);

        var j = 0;
        items.each(function(item) {
            if (item) {
                j++;
            }
        });

        var table = '<table class="sortable resizable" id="sendDocumentHistory_table">' +
            '<thead>' +
                '<tr>' +
                    '<th class="table_sortfirstdesc" id="Th1">' + global.getLabel('DML_DOCUMENT_TYPE') + '</th>' +
                    '<th id="Th2">' + global.getLabel('DML_STATUS') + '</th>' +
                    '<th id="Th3">' + global.getLabel('DML_DATE') + '</th>' +
                '</tr>' +
            '</thead>' +
            '<tbody ' + ((!Prototype.Browser.IE) ? 'style="height:' + ((j > 16) ? '350px' : '100%') + '"' : '') + '>';



        items.each(function(item) {
            var auxText = item['@last_update'];
			//var auxText = Date.parseExact(auxText, "yyyy-MM-dd").toString('dd/MM/yyyy');
			if (auxText.length > 0) 
				var auxText = Date.parseExact(auxText, "yyyy-MM-dd").toString(global.dateFormat);
			
			table += '<tr>';
            if (parseInt(item['@doc_id'].replace(/0/g,''))) {
                table += '<td><a doc_id="' + item['@doc_id'] + '" class="application_action_link get_details">' + item['@doc_type_descr'] + '</a></td>';
            } else {
                table += '<td>' + item['@doc_type_descr'] + '</td>';
            }
            table +=
				'<td>' + global.getLabel(item['@status']) + '</td>' +
				'<td>' + auxText;
            if (global.dmc == 'Y' && !parseInt(item['@doc_id'].replace(/0/g,''))) {
                table += '<a track_id="' + item['@track_id'] + '" style="margin-left:20px" title = "' + global.getLabel('DML_VIEW_COVERSHEET') + '" class="application_action_link get_coversheet">' + global.getLabel('DML_VIEW_COVERSHEET') + '</a>';
            }
            table += '</td>' +
			'</tr>';
        } .bind(this));

        if (j == 0) {
            table += '<tr><td colspan="3"><span style="padding:2px;">' + global.getLabel('DML_NO_DML_DOCUMENTS_FOUND') + '.</span></td></tr>'
        }

        table += '</tbody></table>';

        this.listContainer.update(table);
		
		var table_new = new tableKitWithSearch($('sendDocumentHistory_table'), {
				marginL: 10,
				searchLabel: 'Search',
				noResultsLabel: 'No results found',
				autoLoad: false,
				highlightRowsOnMouseOver: false,
				webSearch: false
		});
		
        this.listContainer.select('a.get_details').each(function(item) {
            item.observe('click', this.getDetailsHandlerBinding);
        } .bind(this));

        this.listContainer.select('a.get_coversheet').each(function(item) {
            item.observe('click', this.getCoversheetHandlerBinding);
        } .bind(this));
    },

    getDocTypeList: function() {
        var emp = this.emp;
        var xmlin = ''
        + ' <EWS>'
        + '     <SERVICE>DM_GET_TYPE_F</SERVICE>'
	+ '     <OBJ TYPE="'+((emp)? 'P': '')+'">'+((emp)? emp: '')+'</OBJ>'        
        + ' </EWS>';

        this.makeAJAXrequest($H({ xml: xmlin,
            successMethod: 'buildDocumentsTypeList',
            xmlFormat: false
        }));
    },

    buildDocumentsTypeList: function(json) {

        var options = '<option value="null">' + global.getLabel('DML_CHOOSE_DOCUMENT_TYPE') + '</option>';
        var items = objectToArray(json.EWS.o_i_doc_type_list.yglui_str_ecm_doc_type_list);
        items.each(function(item) {
            options += '<option value="' + item['@doc_type_id'] + '">' + item['@doc_type_name'] + '</option>';
        }.bind(this));

        $('sentDocHistoryDocTypSlct').update(options);

    }
});