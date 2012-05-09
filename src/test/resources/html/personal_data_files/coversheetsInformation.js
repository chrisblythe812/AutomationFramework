/**
* @fileOverview coversheetsInformation.js
* @description It shows information about a list of coversheets
*/
/**
* @constructor
* @description Class with functionality to show information about a list of coversheets
* @augments SendDocumentHistory
*/
var coversheetsInformation = Class.create(SendDocumentHistory,
/** 
*@lends coversheetsInformation
*/
{
    /**
    *@description Starts coversheetsInformation
    *@param {Hash} args Object from the previous application
    */
    run: function($super, args) {
        this.trackIds = args.get('trackIds');
        this.argum = args;
        $super(args);
    },
    /**
    * Builds the application structure
    */
    buildSentDocHistory: function($super) {
        // Sets the empId first
        this.emp = this.argum.get('empId');
        this.empName = global.getEmployee(this.emp) ? global.getEmployee(this.emp).name : "";

        $super();
        var title = $$('span.application_main_title').first();
        title.next().remove();
        title.next().remove();
        title.hide();
        title.up().addClassName('applicationtimeEntryScreen_SD_covDetailsContainer');
    },
    /**
    * Calls the backend to obtain the coversheets info
    */
    getTable: function() {
        // Sets the empId first
        this.emp = this.argum.get('empId');
        this.empName = global.getEmployee(this.emp) ? global.getEmployee(this.emp).name : "";

        var trackIdsString = '';
        for (var i = 0, length = this.trackIds.length; i < length; i++)
            trackIdsString += "<YGLUI_STR_ECM_TRACKING_ID TRACK_ID='" + this.trackIds[i] + "' />";
        var xmlin = '<EWS>' +
                        '<SERVICE>GET_DOC_COVER</SERVICE>' +
                        '<OBJECT TYPE="P">' + this.emp + '</OBJECT>' +
                        '<DEL/>' +
                        '<GCC/>' +
                        '<LCC/>' +
                        '<PARAM>' +
                            '<I_DOC_COVER>' + trackIdsString + '</I_DOC_COVER>' +
                        '</PARAM>' +
                    '</EWS>';
        this.makeAJAXrequest($H({ xml: xmlin,
            successMethod: 'buildTable',
            xmlFormat: false
        }));
    },
    /**
    * Creates a popup with containing the coversheet info
    * @param {Object} json Response for the DM_GET_CS_DESR service in json format
    */
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
        if (mandatory == 'Y')
            isMandatory = true;
        var div = new Element('div');
        var removeEvent = 'EWS:removeCoversheetWA';

        new coversheetDetails(div, isMandatory, docTypeLabel, doc_type, gcc, lcc, requestor_name, requestorId,
		                      affectedName, affectedId, process, ticket, this.track_id, this, removeEvent);

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
    }
});