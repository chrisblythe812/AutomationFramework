/**
* @fileOverview sendCoversheet.js
* @description It creates and sends a new coversheet
*/
/**
* @constructor
* @description Class with functionality to create and send a coversheet
* @augments CoversheetSD
*/
var sendCoversheet = Class.create(CoversheetSD,
/** 
*@lends sendCoversheet
*/
{
    /**
    * Retrieves the coversheet's track id after its creation
    * @param {Object} json Response for the DM_SEND_DOC service in json format
    */
    confirmSendCallback: function(json) {
        // Getting track id
		if (json.EWS.o_v_track_id) {
            this.docTrackId = json.EWS.o_v_track_id;
			if (this.onSuccessEvent)
                // Adding the json as argument
				document.fire(this.onSuccessEvent, json);
        }
        else
            return;
		// Changing handler + label
		var button = $('Button_Confirm');
		this.confirmSendDoc_displayer.updateLabel('Button_Confirm', global.getLabel('DML_REMOVE_FROM_SEND_LIST'));
		this.confirmSendDoc_displayer.updateHandler('Button_Confirm', this.removeFromSendListHandlerBinding);
		new Insertion.Before(button, '<span style="font-weight: bold; color: red;float:left;margin:5px;">'+global.getLabel('DML_DOCUMENT_CONFIRMED_FOR_SENDING_TASK_')+'</span>');
		var aLink = this.target.down('a');
		aLink.removeClassName('application_main_soft_text');
		aLink.addClassName('application_action_link');
    },
    /**
    * Removes the current coversheet
    * @param {Object} json Response for the DM_RMV_SEND_DOC service in json format
    */
	removeFromSendListCallback: function(json) {
        // Changing handler + label
		var button = $('Button_Confirm');
		button.previous().remove();
		button.show();
		this.confirmSendDoc_displayer.updateLabel('Button_Confirm', global.getLabel('DML_CONFIRM_SEND_DOC'));
		this.confirmSendDoc_displayer.updateHandler('Button_Confirm', this.confirmSendHandlerBinding);
		var aLink=this.target.down('a');
		aLink.removeClassName('application_action_link');
		aLink.addClassName('application_main_soft_text');
		aLink.removeAttribute('href');
        // Getting the track id before resetting it
        var trackId = this.docTrackId;
		this.docTrackId = null;
		if (this.onFailureEvent) {
            // Adding the track id as argument
			document.fire(this.onFailureEvent, {trackId: trackId});
		}
    }
});