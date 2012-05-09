/**
* @fileOverview coversheetDetails.js
* @description It shows a popup with information related to an specific coversheet
*/
/**
* @constructor
* @description Class with functionality to show a popup with information related to an specific coversheet
* @augments Coversheet
*/
var coversheetDetails = Class.create(Coversheet,
/** 
*@lends coversheetDetails
*/
{
    /**
    *Constructor of the class coversheetDetails
    */
	initialize: function($super, target, isMandatory, docTypeLabel, docTypeId, gcc, lcc, requestorName, requestorId,
                         affectedName, affectedId, process, ticket, docTrackId, parentApp, removeEvent) {
        this.removeEvent = removeEvent;
        $super(target, isMandatory, docTypeLabel, docTypeId, gcc, lcc, requestorName, requestorId,
               affectedName, affectedId, process, ticket, docTrackId, parentApp);
	},
    /**
    * Calls the backend to remove the current coversheet
    * @param {Object} evt Event fired to remove the current coversheet
    */
	removeFromSendListHandler: function(evt) {
		var xmlin = '<EWS>' +
                        '<SERVICE>RMV_DOC_COVER</SERVICE>' +
                        '<OBJECT TYPE=""/>' +
                        '<DEL/><GCC/><LCC/>' +
                        '<PARAM>' +
                            '<I_V_TRACK_ID>' + this.docTrackId + '</I_V_TRACK_ID>' +
                        '</PARAM>' +
                    '</EWS>';
		this.method = 'POST';
		this.url = this.parentApp.url;
		this.makeAJAXrequest($H({ xml: xmlin,
			successMethod: 'removeFromSendListCallback',
			xmlFormat: false
		}));
	},
    /**
    * Removes the current coversheet
    * @param {Object} json Response for the DM_RMV_SEND_DOC service in json format
    */
	 removeFromSendListCallback: function($super, json) {
        $super(json);
		if (this.removeEvent) {
            // Adding the track id as argument
			document.fire(this.removeEvent, {trackId: this.docTrackId, closeSub: true});
		}
    }
});