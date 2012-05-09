var documentsInformation = new Class.create(MyDocuments, {

    run: function($super, args) {
        this.arguments = args;
        this.docIds = args.get('docIds');
        this.comeFromInbox = args.get('comeInbox');
        $super(args);
    },

    buildUI: function($super) {
        this.emp = this.arguments.get('empId')
        this.empName = global.getEmployee(this.emp) ? global.getEmployee(this.emp).name : "";
        //We need to simulate a cFlow object with a stop method because in the close function in the parent class use a cFlow.stop
        cFlow = function() {
            var Stop = function() {}
            return {stop: Stop}
        }();
        $super();
    },

    getMyDocuments: function() {
        var docIdsString = '';
        var area = this.comeFromInbox ? 'WA' : global.currentApplication.mnmid;
        var subArea = this.comeFromInbox ? 'WA_PT' : global.currentApplication.sbmid;

        $('myDocuments_Header').up().addClassName('applicationtimeEntryScreen_SD_docDetailsContainer');
        $('myDocuments_Header').hide();
        $('myDocuments_Footer').hide();
        $('myDocuments_Download').addClassName('applicationtimeEntryScreen_SD_downloadButton');

        for (var i = 0; i < this.docIds.length; i++)
            docIdsString += "<YGLUI_STR_ECM_A_CONTENT_ID CONTENT_ID ='" + this.docIds[i] + "' />";
        var xmlin = '<EWS>' +
                        '<SERVICE>GET_DOCUMENTS</SERVICE>' +
                        '<OBJECT TYPE="P" >' + this.emp + '</OBJECT>' +
                        '<PARAM>' + 
                            '<I_V_AREA_ID>' + area + '</I_V_AREA_ID>' + 
                            '<I_V_SUB_AREA_ID>' + subArea + '</I_V_SUB_AREA_ID>' +
                            '<I_DOC_LIST>' + docIdsString + '</I_DOC_LIST>' +
                        '</PARAM>' +
                    '</EWS>';
        this.makeAJAXrequest($H({ xml: xmlin,
            successMethod: 'buildDocumentsList',
            xmlFormat: false
        }));
    }
});