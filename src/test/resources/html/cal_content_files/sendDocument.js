var SendDocument = new Class.create(Application,

{
	prevEmpSelection: null,
	firstRun: true,
	firstSync: true,
	firstRunSync: true,
	appTypeHash: $H(),
	datePickerFrom: null,
	datePickerTo: null,
	isCoverSheet: null,
	coverSheetSend: null,
	UploadModule: null,
	__DMLightMode: null,
	initialize: function($super, args) {
        $super(args);

        this.coversheetTicketIDClickHandlerBinding = this.coversheetTicketIDClickHandler.bindAsEventListener(this);
        this.addDoc2EmpFileClickHandlerBinding = this.addDoc2EmpFileClickHandler.bindAsEventListener(this);
        this.uploadOptionClickHandlerBinding = this.uploadOptionClickHandler.bindAsEventListener(this);
        this.coversheetOptionClickHandlerBinding = this.coversheetOptionClickHandler.bindAsEventListener(this);
        this.confirmSendDocClickHandlerBinding = this.confirmSendDocClickHandler.bindAsEventListener(this);
        this.removeFromSendListClickHandlerBinding = this.removeFromSendListClickHandler.bindAsEventListener(this);
        this.downloadCoverSheetHandlerBinding = this.downloadCoverSheetClickHandler.bindAsEventListener(this);
        this.gotoSentDocHandlerBinding = this.gotoSentDocHandler.bindAsEventListener(this);
        this.sendDocTypeSelectedHandlerBinding = this.sendDocTypeSelectedHandler.bindAsEventListener(this);
        this.optionHandlerBinding = this.optionHandler.bindAsEventListener(this);
		this.__DMLightMode = (global.usettingsJson.EWS.o_99edm=='X')? true : false;
		
        document.observe('EWS:sendDocTypeSelected', this.sendDocTypeSelectedHandlerBinding);
		document.observe('EWS:sendDocumentFromDateSelected',this.updateDateFields.bind(this));
        this.menuSyncBinding = this.menuSync.bindAsEventListener(this);

    },
	
	updateDateFields: function(){	
		//debugger;
		var fromDate
		if(this.datePickerFrom.getActualDate()){
			fromDate = Date.parseExact(this.datePickerFrom.getActualDate(), "yyyy-MM-dd").toString('yyyy-MM-dd');
		}
		var toDate;
		if(this.datePickerTo.getActualDate()){
			toDate = Date.parseExact(this.datePickerTo.getActualDate(), "yyyy-MM-dd").toString('yyyy-MM-dd');
		}
		
		if(!this.isCoverSheet){
			this.uploadModule.updateParameter('I_V_BEGDA',fromDate)
			this.uploadModule.updateParameter('I_V_ENDDA',toDate)
		}else{
			this.coverSheetSend.begda = fromDate;
			this.coverSheetSend.endda = toDate;
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

            this.virtualHtml.select('b').first().update(this.empName);
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

        this.docTypeAutocompleter.clearInput();
        if ($('upload_bottons')) {
            $('upload_bottons').remove();
        }
        $("send_doc_container").update();
		if($('upload_doc_radio')){
			$('upload_doc_radio').checked = false;
		}
		if($('send_doc_radio')){
			$('send_doc_radio').checked = false;
		}
    },

    optionHandler: function(evt) {

        if (!this.docTypeAutocompleter.getValue() || !this.emp) {
            return;
        }

        if (evt.element().value == 'upload') {
            this.uploadOptionClickHandler();
        } else {
            this.coversheetOptionClickHandler();
        }
    },

    coversheetTicketIDClickHandler: function() {
        alert('coversheetTicketIDClickHandler');
    },

    addDoc2EmpFileClickHandler: function(evt) {
        alert('checked : ' + evt.element().checked);
    },

    uploadOptionClickHandler: function() {
        if ($('upload_bottons')) {
            $('upload_bottons').remove();
        }
		
		var fromDate = null;
		if(this.datePickerFrom && this.datePickerFrom.getActualDate()){
			fromDate = Date.parseExact(this.datePickerFrom.getActualDate(), "yyyy-MM-dd").toString('yyyy-MM-dd');
		}
		var toDate = null;
		if(this.datePickerTo && this.datePickerTo.getActualDate()){
			toDate = Date.parseExact(this.datePickerTo.getActualDate(), "yyyy-MM-dd").toString('yyyy-MM-dd');
		}

        $("send_doc_container").update('<div style="float:left;" id="upload_container"></div>');
        		
		if(fromDate && toDate){
			this.uploadModule = new UploadModule('upload_container', global.currentApplication.appId, 'DM_UPLOAD_DOC', true, this.docId.bind(this),
				{
					I_V_DOC_TYPE: this.docTypeAutocompleter.getValue().idAdded,
					I_V_PERSNO: this.emp,
					I_V_APPID: global.currentApplication.appId,
					I_V_BEGDA: fromDate,
					I_V_ENDDA: toDate
				});
		}else{
			this.uploadModule = new UploadModule('upload_container', global.currentApplication.appId, 'DM_UPLOAD_DOC', true, this.docId.bind(this),
				{
					I_V_DOC_TYPE: this.docTypeAutocompleter.getValue().idAdded,
					I_V_PERSNO: this.emp,
					I_V_APPID: global.currentApplication.appId
				});
		}
		
		if(!this.virtualHtml.down('div#upload_bottons')){

			var upload_bottons = new Element('div',{
							'id': 'upload_bottons',
							'style': 'float:left;width:100%;'
			});

			var json = ({
							elements:[]
			});

			var upload_method = ({
										label: global.getLabel('DML_UPLOAD'),
										idButton:'upload_method',
										className: (!global.liteVersion)?'application_action_link': '',
										handler: this.uploadMethod.bindAsEventListener(this),
										type: 'button',
										standardButton: (!global.liteVersion)? true : false
			});
			json.elements.push(upload_method);

			var cancel_method = ({
										label: global.getLabel('DML_CANCEL'),
										idButton:'cancel_method',
										className: (!global.liteVersion)?'application_action_link': '',
										type: 'button',
										handler: this.cancelMethod.bindAsEventListener(this),
										standardButton: (!global.liteVersion)? true : false
			});
			json.elements.push(cancel_method);

			var buttonDisplayerExamplebutton = new megaButtonDisplayer(json);
			upload_bottons.insert(buttonDisplayerExamplebutton.getButtons());

			this.virtualHtml.insert(upload_bottons);

			this.uploadMethodBinding = this.uploadMethod.bindAsEventListener(this);
			this.cancelMethodBinding = this.cancelMethod.bindAsEventListener(this);

		}
        
    },

    docId: function(json) {
        this.docTypeAutocompleter.clearInput();
        if ($('upload_bottons')) {
            $('upload_bottons').remove();
        }
		if($('upload_doc_radio')){
			$('upload_doc_radio').checked = false;
		}
		if($('send_doc_radio')){
			$('send_doc_radio').checked = false;
		}
    },

    uploadMethod: function(evt) {
		if(this.datePickerFrom && this.datePickerTo){
			if(!this.datePickerFrom.dateIsEmpty() && !this.datePickerTo.dateIsEmpty()){
				this.uploadModule.uploadHandler();
			}else{
				var html = '<div>'+global.getLabel('DM_INCOMPLETE_DATES')+'</div>';
				var popUp = new infoPopUp({
					closeButton: $H({
						'callBack': function() {
							popUp.close();
							delete popUp;
						}
					}),
					htmlContent: html,
					indicatorIcon: 'exclamation',
					width: 500
				});
				popUp.create();
			}
		}else{
			this.uploadModule.uploadHandler();
		}
    },

    cancelMethod: function(evt) {
		
		this.uploadModule.cancel();
        this.docTypeAutocompleter.clearInput();
        if ($('upload_bottons')) {
            $('upload_bottons').remove();
        }
        $("send_doc_container").update();

        $('upload_doc_radio').checked = false;
        $('send_doc_radio').checked = false;
		
		if($('send_document_datePicker')){
			$('send_document_datePicker').update();
		}

    },

    gotoSentDocHandler: function() {

        global.open($H({
            app: {
                appId: 'ST_DOCH',
                tabId: 'SC_DOCU',
                view: 'SendDocumentHistory'
            }
        }));
    },

    coversheetOptionClickHandler: function() {

        if ($('upload_bottons')) {
            $('upload_bottons').remove();
        }

        var xmlin = ''
        + ' <EWS>'
        + '     <SERVICE>DM_GET_CS_PREV</SERVICE>'
        + '     <PARAM>'
        + '     </PARAM>'
        + ' </EWS>';

        this.makeAJAXrequest($H({ xml: xmlin,
            successMethod: 'buildCoversheet',
            xmlFormat: false
        }));
    },

    buildCoversheet: function(json) {
		var fromDate = null,toDate=null; 
		if(this.datePickerFrom && this.datePickerTo){
			if(this.datePickerFrom.getActualDate()){
				fromDate = Date.parseExact(this.datePickerFrom.getActualDate(), "yyyy-MM-dd").toString('yyyy-MM-dd');
			}
			if(this.datePickerTo.getActualDate()){
				toDate = Date.parseExact(this.datePickerTo.getActualDate(), "yyyy-MM-dd").toString('yyyy-MM-dd');
			}
		}
				
        this.coverSheetSend = new CoversheetSD(
		$("send_doc_container"),
		this.docTypeAutocompleter.getValue().textAdded,
		this.docTypeAutocompleter.getValue().idAdded,
		json.EWS.o_v_yygcc,
		json.EWS.o_v_yylcc,
		global.name,
		global.objectId,
		this.empName,
		this.emp,
		false,
		global.getLabel('DM_UPLOAD_TICKET'),
		this,
		null,
		null,
		null,
		fromDate,
		toDate
		);
    },

    downloadCoverSheetClickHandler: function() {
        var xmlin = ''
        + '<EWS>'
            + '<SERVICE>DM_GET_COVER</SERVICE>'
            + '<OBJECT TYPE=""/>'
            + '<DEL/><GCC/><LCC/>'
            + '<PARAM>'
                + '<I_V_DOC_TYPE>' + this.docTypeAutocompleter.getValue().idAdded + '</I_V_DOC_TYPE>'
                + '<I_V_REQUESTOR_EE>' + global.objectId + '</I_V_REQUESTOR_EE>'
                + '<I_V_AFFECTED_EE>' + this.emp + '</I_V_AFFECTED_EE>'
                + '<I_V_APPID>' + global.currentApplication.appId + '</I_V_APPID>'
                + '<I_V_TRACK_ID>' + this.docTrackId + '</I_V_TRACK_ID>'
            + '</PARAM>'
        + '</EWS>';

        var url = this.url;
        while (('url' in url.toQueryParams())) {
            url = url.toQueryParams().url;
        }
        url = (Object.isEmpty(Object.values(((url).toQueryParams()))[0])) ? url + '?xml_in=' : url + '&xml_in=';
        $('download_coversheet').href = url + xmlin;
    },

    confirmSendDocClickHandler: function(evt) {

        if (this.docTypeAutocompleter.getValue()) {
            var xmlin = ''
            + ' <EWS>'
            + '     <SERVICE>DM_SEND_DOC</SERVICE>'
            + '     <OBJECT TYPE="P">' + this.emp + '</OBJECT>'
            + '     <DEL/><GCC/><LCC/>'
            + '     <PARAM>'
            + '         <I_V_DOC_TYPE>' + this.docTypeAutocompleter.getValue().idAdded + '</I_V_DOC_TYPE>'
            + '         <I_V_APPID>' + global.currentApplication.appId + '</I_V_APPID>'
            + '         <I_V_APP_FIELD/>'
            + '     </PARAM>'
            + ' </EWS>';

            this.makeAJAXrequest($H({ xml: xmlin,
                successMethod: 'confirmSendDocCallback',
                xmlFormat: false
            }));
        }

    },

    confirmSendDocCallback: function(json) {

        if (json.EWS.o_v_track_id) {
            this.docTrackId = json.EWS.o_v_track_id;
        } else {
            return;
        }
        if ($('confirm_send_doc').previous('span')) {
            $('confirm_send_doc').down().update(global.getLabel('DML_CONFIRM_SEND_DOC'));
            $('confirm_send_doc').previous().remove();
        } else {
            $('confirm_send_doc').down().update(global.getLabel('DML_REMOVE_FROM_SEND_LIST'));
            new Insertion.Before('confirm_send_doc', '<span style="font-weight: bold; color: red;float:left;margin:5px;">' + global.getLabel('DML_DOCUMENT_CONFIRMED_FOR_SENDING_TASK_') + '</span>');
            $('confirm_send_doc').stopObserving('click', this.confirmSendDocClickHandlerBinding);
            $('confirm_send_doc').observe('click', this.removeFromSendListClickHandlerBinding);
        }
    },

    removeFromSendListClickHandler: function(evt) {

        if (this.docTypeAutocompleter.getValue()) {
            var xmlin = ''
            + ' <EWS>'
            + '     <SERVICE>DM_RMV_SEND_DOC</SERVICE>'
            + '     <OBJECT TYPE=""/>'
            + '     <DEL/><GCC/><LCC/>'
            + '     <PARAM>'
            + '         <I_V_TRACK_ID>' + this.docTrackId + '</I_V_TRACK_ID>'
            + '     </PARAM>'
            + ' </EWS>';

            this.makeAJAXrequest($H({ xml: xmlin,
                successMethod: 'removeFromSendListCallback',
                xmlFormat: false
            }));
        }

    },

    removeFromSendListCallback: function(json) {
        if ($('confirm_send_doc').previous('span')) {
            $('confirm_send_doc').down().update(global.getLabel('DML_CONFIRM_SEND_DOC'));
            $('confirm_send_doc').previous().remove();
            $('confirm_send_doc').stopObserving('click', this.removeFromSendListClickHandlerBinding);
            $('confirm_send_doc').observe('click', this.confirmSendDocClickHandlerBinding);
        } else {
            $('confirm_send_doc').down().update(global.getLabel('DML_REMOVE_FROM_SEND_LIST'));
            new Insertion.Before('confirm_send_doc', '<span style="font-weight: bold; color: red;float:left;margin:5px;">' + global.getLabel('DML_DOCUMENT_CONFIRMED_FOR_SENDING_TASK_') + '</span>');
        }
    },

    sendDocTypeSelectedHandler: function(evt) {
		this.isCoverSheet= null;
		if($('send_document_upload_options')){
				$('send_document_upload_options').update();
		}
		
		if($('send_document_datePicker')){
			$('send_document_datePicker').update();
		}
		
		if($('send_doc_container')){
			$('send_doc_container').update();
		}

		if($('upload_bottons')){
			$('upload_bottons').update();
		}
		this.datePickerFrom= null;
		this.datePickerTo= null;
		
		var appType = this.appTypeHash.get(this.docTypeAutocompleter.getValue().idAdded);

		if(appType.legalType=='X'){
			if(this.__DMLightMode && appType.upType=='SCA'){
				if($('send_document_datePicker')){
					$('send_document_datePicker').update(global.getLabel('DM_COVERSHEET_NOT_POSSIBLE'));
				}
			}
			else{
				$('send_document_datePicker').insert('<div id="sendDocumentFromDate" style="width:30%;text-align: left;"></div><div id="sendDocumentToDate" style="width:30%;text-align: left;"></div>');
				var startDate = Date.today();
				startDate = startDate.toString('yyyyMMdd');
				$('sendDocumentFromDate').insert(new Element('label').insert('From: '));
				this.datePickerFrom = new DatePicker($('sendDocumentFromDate'),{
					manualDateInsertion: true,
					defaultDate:startDate,
					events: $H({correctDate: "EWS:sendDocumentFromDateSelected"	})
				});
				$('sendDocumentToDate').insert(new Element('label').insert('To: '));
					this.datePickerTo = new DatePicker($('sendDocumentToDate'),{ 
					manualDateInsertion: false
				});  
				this.datePickerFrom.linkCalendar(this.datePickerTo);
			}
		}
		
		if(appType.upType=='ELC'){
			this.uploadOptionClickHandler();
		}
		else if(appType.upType=='SCA'){
			if(this.__DMLightMode){
				if($('send_document_datePicker')){
					$('send_document_datePicker').update(global.getLabel('DM_COVERSHEET_NOT_POSSIBLE'));
				}
			}else{
				var xmlin = ''
					+ ' <EWS>'
					+ '     <SERVICE>DM_GET_CS_PREV</SERVICE>'
					+ '     <PARAM>'
					+ '         <I_V_DOC_TYPE>' + this.docTypeAutocompleter.getValue().idAdded + '</I_V_DOC_TYPE>'
					+ '     </PARAM>'
					+ ' </EWS>';

				this.makeAJAXrequest($H({ xml: xmlin,
					successMethod: 'buildCoversheet',
					xmlFormat: false
				}));
				
				this.isCoverSheet = true;
			}
		}else{
			 if (global.dmc == 'Y') {
				var html =
				'<div style="width:99%;float:left;text-align:left;margin-bottom:10px;margin-top:10px">' +
					'<span class="fieldDispFloatLeft">' + global.getLabel('DML_CHOOSE_TO') + ' : </span>' +
					'<input id="upload_doc_radio" type="radio" name="send_doc_radio" value="upload">' + global.getLabel('DML_UPLOAD_ELECTRONICALLY');
					
					if(!this.__DMLightMode){
						html +='<input id="send_doc_radio" type="radio" name="send_doc_radio" value="coversheet">' + global.getLabel('DML_SEND_WITH_COVERSHEET_FOR_SCANNING_PR');
					}
					
				html +='</div>';
				$('send_document_upload_options').update(html);
				
				this.virtualHtml.select('input[type="radio"]').first().observe('click', this.optionHandlerBinding);
				this.virtualHtml.select('input[type="radio"]').last().observe('click', this.optionHandlerBinding);
			} 
		}
		
    },

    getDocTypeList: function() {
      var emp = this.emp;
		var xmlin = ''
        + ' <EWS>'
        + '     <SERVICE>DM_GET_TYPES</SERVICE>'
		+ '     <OBJ TYPE="'+((emp)? 'P': '')+'">'+((emp)? emp: '')+'</OBJ>'
        + ' </EWS>';
        this.makeAJAXrequest($H({ xml: xmlin,
            successMethod: 'buildDocumentsTypeList',
            xmlFormat: false
        }));
    },

    buildDocumentsTypeList: function(json) {
        var jsonObject = {
            autocompleter: {
                object: [],
                multilanguage: {
                    no_results: global.getLabel('DML_NO_RESULTS'),
                    search: global.getLabel('DML_SEARCH')
                }
            }
        }
        if (json.EWS.o_i_doc_type_list) {
            var items = objectToArray(json.EWS.o_i_doc_type_list.yglui_str_ecm_doc_typelist);
            for (var i = 0; i < items.length; i++) {
                this.appTypeHash.set(items[i]['@content_group_id'],{upType:items[i]['@up_type'],'legalType':items[i]['@legal']});
				jsonObject.autocompleter.object.push({
                    data: items[i]['@content_group_id'],
                    text: items[i]['@doc_type_name']
                })
            }
        }
        this.docTypeAutocompleter.updateInput(jsonObject);
    },


    buildScreen: function() {
        var html =
		'<div style="width:99%;float:left;text-align:left;margin-bottom:10px">' +
			'<label>'+global.getLabel('DML_CURRENTLY_SELECTED_EMPLOYEE') + '</label> : <b>' + this.empName + '</b>' +
		'</div>' +

		'<label class="fieldDispFloatLeft">' +
			global.getLabel('DML_DOCUMENT_TYPE') + ' : ' +
		'</label>' +
		'<div id="send_document_autocompleter"></div>'+
		'<div id="send_document_datePicker" style="width:99%;float:left;margin-top:10px;"></div>'+
		'<div id="send_document_upload_options"></div>';
		
        html +=
		'<br/>' +
		'<br/>';
        this.virtualHtml.insert(html);
        this.virtualHtml.insert('<div style="text-align:left;float:left;width:99%;" id="send_doc_container"></div>');

        var json = {
            autocompleter: {
                object: [],
                multilanguage: {
                    no_results: global.getLabel('DML_NO_RESULTS'),
                    search: global.getLabel('DML_SEARCH')
                }
            }
        }
        this.docTypeAutocompleter = new JSONAutocompleter('send_document_autocompleter', {
            showEverythingOnButtonClick: true,
            timeout: 5000,
            templateResult: '#{text}',
            templateOptionsList: '#{text}',
            minChars: 1,

            events: $H({ onResultSelected: 'EWS:sendDocTypeSelected' })
        }, json);

        this.getDocTypeList();


    },

	onEmployeeSelected: function(e){
		if(this.firstRunSync){
			this.emp = e.id;
			this.getDocTypeList();
			this.firstRunSync=false;
		}
	},

    run: function($super, args) {
        $super(args);

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
            this.buildScreen();

			this.prevEmpSelection = this.emp;
        }else{
			if(this.emp!=this.prevEmpSelection){
				this.getDocTypeList();
			}
			this.prevEmpSelection = this.emp;
		}

    },

    getCurrentTicket: function() {
        return '1001756';
    },

    close: function($super) {
        $super();
        document.stopObserving("EWS:employeeMenuSync", this.menuSyncBinding);
		this.firstRunSync=true;
    }

});