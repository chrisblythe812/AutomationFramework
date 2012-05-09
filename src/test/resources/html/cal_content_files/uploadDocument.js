var uploadDocument = new Class.create(SendDocument,
{
	initialize: function($super, args) {
        $super(args);
    },

    run: function($super, args) {
        this.mandatoryTypeList = new Array();
        this.argum = args;
        this.eventAppId = args.get('appId'); // Could be ABS or ATT
        this.eventScreen = args.get('screen'); // Usually is 1, because timeEntry only have one screen
        this.eventSubtype = args.get('subtype'); // Subtype 
        $super(args);
        if (!this.firstRun){ //Restore the application
            this.virtualHtml.update('');
            this.buildScreen();
        }
    },
    /**
    * Draw the html content.
    */
    buildScreen: function() {
        this.virtualHtml.addClassName('applicationtimeEntryScreen_SD');

        // Sets the empId first
        this.emp = this.argum.get('empId');
        this.empName = global.getEmployee(this.emp) ? global.getEmployee(this.emp).name : "";

        var divDocType = new Element ('div', {'class': 'fieldDispFloatLeft'}).update(global.getLabel('DML_DOCUMENT_TYPE') + ' : ');
        var divAutocompleter = new Element('div', {'id': 'send_document_autocompleter' , 'class': 'applicationUploadDocument_autocompleter'});
        var html = '';
        if (global.dmc == 'Y') {
            html += '<div id="send_document_upload_options" class="inlineElement applicationtimeEntryScreen_SD_container">' +
                        '<div class="applicationtimeEntryScreen_SD_radioButtons">' +
                            '<span class="fieldDispFloatLeft">' + global.getLabel('DML_CHOOSE_TO') + ' : </span>' +
                            '<input id="upload_doc_radio" type="radio" name="send_doc_radio" value="upload">' + global.getLabel('DML_UPLOAD_ELECTRONICALLY') +
                            '<input id="send_doc_radio" type="radio" name="send_doc_radio" value="coversheet">' + global.getLabel('DML_SEND_WITH_COVERSHEET_FOR_SCANNING_PR') +
                        '</div>' +
                    '</div>';
        }

        html += '<br/><br/>';
        this.virtualHtml.insert(divDocType);
        this.virtualHtml.insert(divAutocompleter);
        this.virtualHtml.insert(html);
        this.virtualHtml.insert('<div id="send_doc_container" class="inlineElement applicationtimeEntryScreen_SD_container"></div>');

        // Build the autocompleter
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

        // Autocompleter will be filled in the getDocTypeList function
        this.getDocTypeList();

        // Sets the observers for the radiobuttons
        if (global.dmc == 'Y') {
            this.virtualHtml.select('input[type="radio"]').first().observe('click', this.optionHandlerBinding);
            this.virtualHtml.select('input[type="radio"]').last().observe('click', this.optionHandlerBinding);
        }
    },
    /**
    * Store the uploaded documentId and remove the upload buttons.
    * @param {Object} xml_out Response for the DM_UPLOAD_DOC service in xml format
    */
    docId: function(xml_out) {
        // Parsing the xml in:
        var xmlParser = new XML.ObjTree();
        var json = xmlParser.parseXML(xml_out); 
        // Get the docId
        var documentId = Object.isEmpty(json.EWS.o_v_doc_id) ? null : json.EWS.o_v_doc_id;
        // Current document type (id and mandatory)
        var docType = this.docTypeAutocompleter.getValue().idAdded;
        // Web message type
        var messageType = json.EWS.webmessage_type;

        // Json to be sent to timeEntry with the docId and the mandatoty doctypes
        var json = {docId: documentId , docType: docType , man: this.mandatoryTypeList, messageType: messageType};
        
        // Fire the event EWS:sendDocumentInfo to pass the docId to timeEntryScreen view
        document.fire('EWS:sendDocumentInfo', json);
        // Actions with the buttons
        this.docTypeAutocompleter.clearInput();
        if ($('upload_bottons'))
            $('upload_bottons').remove();
        $('upload_doc_radio').checked = false;
        $('send_doc_radio').checked = false;
    },
    /**
    * Do the GET_DOC_TYPES service call to get the doc types {id - name - mandatory}.
    */
    getDocTypeList: function() {
        // Sets the empId first
        this.emp = this.argum.get('empId');
        this.empName = global.getEmployee(this.emp) ? global.getEmployee(this.emp).name : "";

        var emp = this.emp;
		var xmlin = '<EWS>' +
                        '<SERVICE>GET_DOC_TYPES</SERVICE>' +
                        '<OBJ TYPE="' + (emp ? 'P' : '') + '">' + (emp ? emp : '') + '</OBJ>' +
                        '<PARAM>' +
                            '<APPID>' + this.eventAppId + '</APPID>' +
                            '<WID_SCREEN>' + this.eventScreen + '</WID_SCREEN>' +
                            '<I_SUBTY>' + this.eventSubtype + '</I_SUBTY>' +
                        '</PARAM>' +
                    '</EWS>';

        this.makeAJAXrequest($H({ xml: xmlin,
            successMethod: this.buildDocumentsTypeList.bind(this),
            xmlFormat: false
        }));
    },
    /**
    * Retrieves the doc types and build the autocompleter.
    * @param {Object} json Response for the GET_DOC_TYPES service in json format
    */
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
        if (json.EWS.o_docu_type_list) {
            var items = objectToArray(json.EWS.o_docu_type_list.yglui_str_send_docu);
            for (var i = 0; i < items.length; i++) {
                // Check if the doc_type is mandatory. In this case we put an * next to the doc_type name and stores the id in this.mandatoryTypeList.
                if (items[i]['@send_docu'] == 'X'){
                    this.mandatoryTypeList.push(items[i]['@content_group_id']);
                    items[i]['@doc_type_name'] =  items[i]['@doc_type_name'] + ' *';
                }
                this.appTypeHash.set(items[i]['@content_group_id'], { 'upType': items[i]['@up_type'], 'legalType': items[i]['@legal'] });
                jsonObject.autocompleter.object.push({
                    data: items[i]['@content_group_id'],
                    text: items[i]['@doc_type_name']
                })
            }
        }
        this.docTypeAutocompleter.updateInput(jsonObject);
        this.mandatoryTypeList = this.mandatoryTypeList.uniq();
    },

    close: function($super) {
        $super();
    },
    /**
    * Creates the upload coversheet part
    * @param {Object} json Response for the DM_GET_CS_PREV service in json format
    */
    buildCoversheet: function(json) {
        new sendCoversheet(
            $("send_doc_container"), // target
            this.docTypeAutocompleter.getValue().textAdded, // docTypeLabel
            this.docTypeAutocompleter.getValue().idAdded, // docTypeId
            json.EWS.o_v_yygcc, // gcc
            json.EWS.o_v_yylcc, // lcc
            global.name, // requestorName
            global.objectId, // requestorId
            this.empName, // affectedName
            this.emp, // affectedId
            false, // process
            'ticket', // ticket
            this, // parentApp
            null, // upload_transaction_index
            'EWS:sendCoversheetWA', // onSuccessEvent
            'EWS:removeCoversheetWA' // onFailureEvent
        );
    }
});