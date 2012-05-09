var CoversheetSD  = new Class.create(origin,
{
	initialize: function(target,docTypeLabel,docTypeId,gcc,lcc,requestorName,requestorId,
	
	affectedName,affectedId,process,ticket,parentApp,upload_transaction_index,onSuccessEvent,onFailureEvent,begda,endda){
			
			this.downloadCoversheetHandlerBinding = this.downloadCoversheetHandler.bindAsEventListener(this);
			this.confirmSendHandlerBinding = this.confirmSendHandler.bindAsEventListener(this);
			this.gotoSentDocHandlerBinding = this.gotoSentDocHandler.bindAsEventListener(this);
			this.removeFromSendListHandlerBinding = this.removeFromSendListHandler.bindAsEventListener(this);
			
			this.upload_transaction_index=upload_transaction_index;
			this.onSuccessEvent=onSuccessEvent;
			this.onFailureEvent=onFailureEvent;
			
			this.target = $(target);
			this.targetId=this.target.identify();
			
			this.docTypeLabel=docTypeLabel;
			this.docTypeId=docTypeId;
			this.gcc=gcc;
			this.lcc=lcc;
			this.requestorName=requestorName;
			this.requestorId=requestorId;
			this.affectedName=affectedName;
			this.affectedId=affectedId;
			this.process=process;
			this.ticket=ticket;
			this.parentApp=parentApp;
			this.begda = begda;
			this.endda = endda;
			this.build();
	},
	
	downloadCoversheetHandler:function(evt){
		if(!this.docTrackId)
			return;
			
		var xmlin = ''
        + '<EWS>'
            + '<SERVICE>DM_GET_COVER</SERVICE>'
            + '<OBJECT TYPE=""/>'
            + '<DEL/><GCC/><LCC/>'
            + '<PARAM>'
                + '<I_V_DOC_TYPE>' + this.docTypeId + '</I_V_DOC_TYPE>'
                + '<I_V_REQUESTOR_EE>' + this.requestorId + '</I_V_REQUESTOR_EE>'
                + '<I_V_AFFECTED_EE>' + this.affectedId + '</I_V_AFFECTED_EE>'
                + '<I_V_APPID>' + global.currentApplication.appId + '</I_V_APPID>'
                + '<I_V_TRACK_ID>' + this.docTrackId + '</I_V_TRACK_ID>'
            + '</PARAM>'
        + '</EWS>';

        var url = this.parentApp.url;
        while (('url' in url.toQueryParams())) {
            url = url.toQueryParams().url;
        }
        url = (Object.isEmpty(Object.values(((url).toQueryParams()))[0])) ? url + '?xml_in=' : url + '&xml_in=';
        evt.element().href = url + xmlin;
	},
	
	confirmSendHandler:function(evt){		
		if((this.begda && !this.endda) || (!this.begda && this.enndda)){
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
		}else{
			var xmlin = ''
				+ ' <EWS>'
				+ '     <SERVICE>DM_SEND_DOC</SERVICE>'
				+ '     <OBJECT TYPE="P">' + this.affectedId + '</OBJECT>'
				+ '     <DEL/><GCC/><LCC/>'
				+ '     <PARAM>'
				+ '         <I_V_DOC_TYPE>' + this.docTypeId + '</I_V_DOC_TYPE>'
				+ '         <I_V_APPID>' + global.currentApplication.appId + '</I_V_APPID>'
				+ '         <I_V_TRANSACTION>transaction</I_V_TRANSACTION>'
				+ '         <I_V_MANDATORY>N</I_V_MANDATORY>'
				+			((this.begda)?  '			<I_V_BEGDA>'+this.begda+'</I_V_BEGDA>': '')
				+			((this.endda)?  '			<I_V_ENDDA>'+this.endda+'</I_V_ENDDA>': '')
				+ '         <I_V_APP_FIELD/>'
				+ '     </PARAM>'
				+ ' </EWS>';
 			this.method = 'POST';
			this.url=this.parentApp.url;
			this.makeAJAXrequest($H({ xml: xmlin,
				successMethod: 'confirmSendCallback',
				xmlFormat: false
			})); 
		}

	},
	
	removeFromSendListHandler:function(evt){
		var xmlin = ''
		+ ' <EWS>'
		+ '     <SERVICE>DM_RMV_SEND_DOC</SERVICE>'
		+ '     <OBJECT TYPE=""/>'
		+ '     <DEL/><GCC/><LCC/>'
		+ '     <PARAM>'
		+ '         <I_V_TRACK_ID>' + this.docTrackId + '</I_V_TRACK_ID>'
		+ '     </PARAM>'
		+ ' </EWS>';
		this.method = 'POST';
		this.url=this.parentApp.url;
		this.makeAJAXrequest($H({ xml: xmlin,
			successMethod: 'removeFromSendListCallback',
			xmlFormat: false
		}));
        
	},
	
	removeFromSendListCallback: function(json) {
		var button=this.target.down('[id="Button_Confirm"]');
		button.previous().remove();
		button.show();
		this.confirmSendDoc_displayer.updateLabel('Button_Confirm',global.getLabel('DML_CONFIRM_SEND_DOC'));
		this.confirmSendDoc_displayer.updateHandler('Button_Confirm',this.confirmSendHandlerBinding);
		var aLink=this.target.down('a');
		aLink.removeClassName('application_action_link');
		aLink.addClassName('application_main_soft_text');
		aLink.removeAttribute('href');
		this.docTrackId=null;
		if(this.onFailureEvent){
			document.fire(this.onFailureEvent);
		}
    },
	
	confirmSendCallback: function(json){
		if (json.EWS.o_v_track_id) {
            this.docTrackId = json.EWS.o_v_track_id;
			if(this.onSuccessEvent){
				document.fire(this.onSuccessEvent);
			}
        } else {
            return;
        }
		
		var button=this.target.down('[id="Button_Confirm"]');
		
		this.confirmSendDoc_displayer.updateLabel('Button_Confirm',global.getLabel('DML_REMOVE_FROM_SEND_LIST'));
		this.confirmSendDoc_displayer.updateHandler('Button_Confirm',this.removeFromSendListHandlerBinding);
		new Insertion.Before(button, '<span style="font-weight: bold; color: red;float:left;margin:5px;">'+global.getLabel('DML_DOCUMENT_CONFIRMED_FOR_SENDING_TASK_')+'</span>');
		var aLink=this.target.down('a');
		aLink.removeClassName('application_main_soft_text');
		aLink.addClassName('application_action_link');
	},
	
	gotoSentDocHandler:function(evt){
		this.parentApp.gotoSentDocHandler();
	},
	
	
	getAddress:function(){
		
		
		var xmlin = ''
        + ' <EWS>'
        + '     <SERVICE>DM_GET_CS_PREV</SERVICE>'
        + '     <PARAM>'
		+ '<I_V_DOC_TYPE>' + this.docTypeId + '</I_V_DOC_TYPE>'
        + '     </PARAM>'
        + ' </EWS>';
		this.method = 'POST';
		this.url=this.parentApp.url;

        this.makeAJAXrequest($H({ xml: xmlin,
            successMethod: 'buildAddress',
            xmlFormat: false
        }));
	},
	
	buildAddress:function(json){
		this.target.down('span.cs_fax').update(json.EWS.o_w_mail_info['@fax']);
		var contact=
		json.EWS.o_w_mail_info['@contact_name']+'<br/>'+
		json.EWS.o_w_mail_info['@post_code']+'<br/>'+
		json.EWS.o_w_mail_info['@street_line1']+'<br/>'+
		json.EWS.o_w_mail_info['@street_line2']+'<br/>'+
		json.EWS.o_w_mail_info['@city']+', '+json.EWS.o_w_mail_info['@country'];
		this.target.down('span.cs_address').update(contact);
	},
	
	
	build: function(){
		
			 	var buildDiv = new Element ('div',{
										'id' : 'buildDiv',
										'style' : 'width:100%;'
				});
				
				var downloadcoversheet = new Element ('a',{
										'id' : 'downloadcoversheet',
										'style' : 'text-decoration:underline;',
										'class' : 'getContentLinks fieldDispFloatLeft application_main_soft_text',
										'target' : '_blank'
				});
				
				downloadcoversheet.insert(global.getLabel('DML_DOWNLOAD_COVERSHEET'));
				buildDiv.insert(downloadcoversheet);
			
				var json = ({ 
                        elements:[]
		        });
		        
		        var confirmSendDoc = ({
		                        label: global.getLabel('DML_CONFIRM_SEND_DOC'),
		                        className: (!global.liteVersion)?'application_action_link': '',
		                        type: 'button',
								handler: this.confirmSendHandlerBinding,
								idButton: 'Button_Confirm',
		                        standardButton: (!global.liteVersion)? true : false
		        });
		        json.elements.push(confirmSendDoc);
		        
		        this.confirmSendDoc_displayer = new megaButtonDisplayer(json);
      		    buildDiv.insert(this.confirmSendDoc_displayer.getButtons());


		        var adobeFileReader = new Element ('p',{
										'id' : 'adobeFileReader',
										'style' : 'text-align:left;margin-top:10px;float:left;width:99%;'
				});
				
				var adobeFileReaderLink = new Element ('a',{
										'title': global.getLabel('DML_PDF_READER_LINK'),
										'id' : 'adobeFileReaderLink',
										'class' : 'application_action_link',
										'href' : prepareTextToSend(global.getLabel('DML_PDF_READER_LINK')),
										'target' : '_blank'
				});
				 
				 adobeFileReader.insert('(');
				 adobeFileReader.insert(global.getLabel('DML_REQUIRE_PDF_READER'));
				 adobeFileReader.insert(' ');
				 adobeFileReaderLink.insert(global.getLabel('DML_PDF_READER_LINK'));
				 adobeFileReader.insert(adobeFileReaderLink);
				 adobeFileReader.insert(')');
				 buildDiv.insert(adobeFileReader);
					
				 var sentDocumentHistory = new Element ('p',{
				 						'id' : 'sentDocumentHistory',
				 						'style' : 'text-align:left;margin-top:10px;float:left;width:99%;'
				 });
				 						
				 var sentDocumentHistoryUnderlined = new Element ('span',{
										'title': global.getLabel('DML_SENT_DOCUMENT_HISTORY'),
				 						'id' : 'sentDocumentHistoryUnderlined',
				 						'class' : 'application_action_link'
				 });
				 
				 sentDocumentHistoryUnderlined.observe('click',this.gotoSentDocHandlerBinding);								 										
				 sentDocumentHistory.insert(global.getLabel('DML_NOTE_THAT'));
				 sentDocumentHistoryUnderlined.insert(global.getLabel('DML_SENT_DOCUMENT_HISTORY'));
				 sentDocumentHistory.insert(sentDocumentHistoryUnderlined);
				 sentDocumentHistory.insert('"');
				 sentDocumentHistory.insert(' ');
				 sentDocumentHistory.insert(global.getLabel('DML_YOU_CAN_VIEW_ALL'));
				 sentDocumentHistory.insert('.');
				 buildDiv.insert(sentDocumentHistory);
 
				 var PDFCoversheet = new Element ('span', {
				 				'id' : 'PDFCoversheet',
				 				'style' : 'text-align:left;margin-top:10px;float:left;width:99%;'
				 				
				 });
				 				
				 PDFCoversheet.insert(global.getLabel('DML_THE_PDF_COVERSHEET'));				
				 buildDiv.insert(PDFCoversheet);
				 
				var typeOfDocument = new Element ('span', {
								'id' : 'typeOfDocument',
				 				'style' : 'text-align:left;margin-top:5px;margin-left:10px;float:left;width:99%;'
				 });
				 				 
				 typeOfDocument.insert(' - ');				 				
				 typeOfDocument.insert(global.getLabel('DML_TYPE_OF_DOCUMENT'));
				 typeOfDocument.insert(' : <b>' + this.docTypeLabel + '</b>');
				 buildDiv.insert(typeOfDocument);

				var requestor = new Element ('span',{
										'id' : 'requestor',
										'style' : 'text-align:left;margin-top:5px;margin-left:10px;float:left;width:99%;'
													
				 });
				
				 requestor.insert(' - ');				 				
				 requestor.insert(global.getLabel('DML_REQUESTOR_INFORMATION'));
				 requestor.insert(' : ');
				 buildDiv.insert(requestor);				 
			 	
			 	var employeeId = new Element ('span',{
			 						'id' : 'employeeId',
			 						'style' : 'text-align:left;margin-top:3px;margin-left:20px;float:left;width:99%;'
			 	});
	
				employeeId.insert('&nbsp;&nbsp;');
			 	employeeId.insert(global.getLabel('DML_EMPLOYEE_ID'));
				employeeId.insert(' : <b>' + this.requestorId + '</b> ');
				/*employeeId.insert(global.getLabel('DML_GCC'));
				employeeId.insert(' : <b>' + this.gcc + '</b> ');
				employeeId.insert(global.getLabel('DML_LCC'));
				employeeId.insert(' : <b>' + this.lcc + '</b> ');*/
			 	requestor.insert(employeeId);
			 	buildDiv.insert(employeeId);
			 	
			 	var employeeName = new Element ('span', {
			 						'id' : 'employeeName',
			 						'style' : 'text-align:left;margin-top:3px;margin-left:20px;float:left;width:99%;'
					
			 	});
			 	
				employeeName.insert('&nbsp;&nbsp;');
			 	employeeName.insert(global.getLabel('DML_EMPLOYEE_NAME'));
				employeeName.insert(' : <b>' + this.requestorName + '</b> ');
			 	requestor.insert(employeeName);
			 	buildDiv.insert(employeeName);
 	
			 	var affectedPerson = new Element ('span', {
			 					'id' : 'affectedPerson',
			 					'style' : 'text-align:left;margin-top:5px;margin-left:10px;float:left;width:99%;'
			 					
			 	});
			 	
				affectedPerson.insert(' - ');
			 	affectedPerson.insert(global.getLabel('DML_AFFECTED_PERSON_DIFFERENT_FROM_REQUE'));
			 	requestor.insert(affectedPerson);
			 	buildDiv.insert(affectedPerson);
					
				if(this.requestorId==this.affectedId){
					affectedPerson.insert(' : <b>' + global.getLabel('DML_NO') + '</b> ');	
				}else{
					affectedPerson.insert(' : <b>' + global.getLabel('DML_YES') + '</b> ');		
				}
			
				if (this.requestorId != this.affectedId) {
				
					var employeeID2 = new Element('span', {
						'id': 'employeeID2',
						'style': 'text-align:left;margin-top:3px;margin-left:20px;float:left;width:99%;'
					})
					
					employeeID2.insert(global.getLabel('DML_EMPLOYEE_ID'));
					employeeID2.insert(' : <b>' + this.affectedId + '</b>   ');
					employeeID2.insert(global.getLabel('DML_GCC'));
					employeeID2.insert(' : <b>' + this.gcc + '</b>   ');
					employeeID2.insert(global.getLabel('DML_LCC'));
					employeeID2.insert(' : <b>' + this.lcc + '</b>');
					
					var employeeNAME2 = new Element('span', {
						'id': 'employeeNAME2',
						'style': 'text-align:left;margin-top:3px;margin-left:20px;float:left;width:99%;'
					})
					
					employeeNAME2.insert(global.getLabel('DML_EMPLOYEE_NAME'));
					employeeNAME2.insert(' : <b>' + this.affectedName + '</b>');
					
				}
				/*
				var processDoc = new Element ('span',{
								'id' : 'processDoc',
								'style' : 'text-align:left;margin-top:5px;margin-left:10px;float:left;width:99%;'
			
				});
	
				processDoc.insert(' - '); 
				processDoc.insert(global.getLabel('DML_PROCESS_FOR_WHICH_DOCUMENTS_ARE_SENT'));
				buildDiv.insert(processDoc);
				
				if(this.process){
					processDoc.insert(this.process);
				}else{
					processDoc.insert(' : <b>' + global.getLabel('DML_NONE') + '</b> ');
				}
				*/	
				var ticketService = new Element ('span', {
										'id' : 'ticketService',
										'style' : 'text-align:left;margin-top:5px;margin-left:10px;float:left;width:99%;'
			
				});
				
				ticketService.insert(' - ');
				ticketService.insert(global.getLabel('DML_TICKET_SERVICE_FOR_DOCUMENT_PROCESSI'));
				ticketService.insert(' : <b>' + this.ticket + '</b> ');
				buildDiv.insert(ticketService);
				
				var printCoversheet = new Element ('span', {
									'id' : 'printCoversheet',
									'style' : 'text-align:left;margin-top:10px;float:left;width:99%;'
				});
				
				printCoversheet.insert(global.getLabel('DML_PLEASE_PRINT_THE_COVERSHEET'));
				buildDiv.insert(printCoversheet);
				
				var mailRoom = new Element ('span', {
									'id' : 'mailRoom',
									'style' : 'text-align:left;margin-top:5px;margin-left:10px;float:left;width:99%;'
				});
				
				mailRoom.insert(' - ');
				mailRoom.insert(global.getLabel('DML_IF_YOU_HAVE_A_MAIL_ROOM_IN_YOUR_OFFI'));
				buildDiv.insert(mailRoom);

				var viaFaxred = new Element ('span', {
									'id' : 'viaFaxred',
									'class' : 'cs_fax',
									'style' : 'font-weight:bold;color:red;'
				});
				
				buildDiv.insert(viaFaxred);
	
				var viaFax = new Element ('span', {
									'id' : 'viaFax',
									'style' : 'text-align:left;margin-top:5px;margin-left:10px;float:left;width:99%;'
									
				});
				
				viaFax.insert(' - ');
				viaFax.insert(global.getLabel('DML_VIA'));
				viaFax.insert(' <b>'+global.getLabel('DML_FAX')+'</b> ');
				viaFax.insert(global.getLabel('DML_ON_THIS_NUMBER'));
				viaFax.insert(' : ');
				viaFax.insert(viaFaxred);
				buildDiv.insert(viaFax);
						
				var postalMail = new Element ('span', {
									'id' : 'postalMail',
									'style' : 'text-align:left;margin-top:5px;margin-left:10px;float:left;width:40%;'
				});

				var postalMailChild = new Element ('span', {
									'id' : 'postalMailChild',
									'style' : 'float:left;'
				});
				
				this.getAddress();
				postalMailChild.insert(' - ');
				postalMailChild.insert(global.getLabel('DML_VIA'));
				postalMailChild.insert(' <b>'+global.getLabel('DML_POSTAL_MAIL')+'</b> ');
				postalMailChild.insert(global.getLabel('DML_TO'));
				postalMailChild.insert(' : ');
				postalMail.insert(postalMailChild);
				buildDiv.insert(postalMail);
		
				var postalMailRed = new Element('span', {
								'id' : 'postalMailRed',
								'class' : 'cs_address',
								'style' : 'font-weight:bold;color:red;float:left;margin-left:5px;'	
				});
				
				postalMail.insert(postalMailRed);
		
				var addressee = new Element('p', {
								'id' : 'addressee',
								'style' : 'text-align:left;margin-top:10px;float:left;width:99%;'
							 
				});

				addressee.insert(global.getLabel('DML_USING_A_COVERSHEET_TO_SEND_IN_DOCUME'));
				addressee.insert('. ');
				addressee.insert(global.getLabel('DML_AS_A_RESULT_YOU_BENIFIT_A_SHORTER'));
				addressee.insert('. ');
				addressee.insert(global.getLabel('DML_THANKS_TO_THE_USE_OF_A_BARCODE'));
				addressee.insert('. ');
				addressee.insert(global.getLabel('DML_THE_DATA_IN_THE_BARCODE'));
				addressee.insert('.');
				buildDiv.insert(addressee);
	
		this.target.update(buildDiv);
		
		
		this.target.select('a').first().observe('click',this.downloadCoversheetHandlerBinding);
		
	}
});

var Coversheet  = new Class.create(origin,
{
    	
	initialize: function(target,isMandatory,docTypeLabel,docTypeId,gcc,lcc,requestorName,requestorId,
	
	affectedName,affectedId,process,ticket,docTrackId,parentApp){
			
			this.downloadCoversheetHandlerBinding = this.downloadCoversheetHandler.bindAsEventListener(this);
			this.confirmSendHandlerBinding = this.confirmSendHandler.bindAsEventListener(this);
			this.gotoSentDocHandlerBinding = this.gotoSentDocHandler.bindAsEventListener(this);
			this.removeFromSendListHandlerBinding = this.removeFromSendListHandler.bindAsEventListener(this);
			
			
			this.target = $(target);
			this.targetId=this.target.identify();
			this.isMandatory=isMandatory;
			this.docTypeLabel=docTypeLabel;
			this.docTypeId=docTypeId;
			this.gcc=gcc;
			this.lcc=lcc;
			this.requestorName=requestorName;
			this.requestorId=requestorId;
			this.affectedName=affectedName;
			this.affectedId=affectedId;
			this.process=process;
			this.ticket=ticket;
			this.docTrackId=docTrackId;
			this.parentApp=parentApp;
			this.build();
	},
	
	downloadCoversheetHandler:function(evt){
		if(!this.docTrackId)
			return;
			
		var xmlin = ''
        + '<EWS>'
            + '<SERVICE>DM_GET_COVER</SERVICE>'
            + '<OBJECT TYPE=""/>'
            + '<DEL/><GCC/><LCC/>'
            + '<PARAM>'
                + '<I_V_DOC_TYPE>' + this.docTypeId + '</I_V_DOC_TYPE>'
                + '<I_V_REQUESTOR_EE>' + this.requestorId + '</I_V_REQUESTOR_EE>'
                + '<I_V_AFFECTED_EE>' + this.affectedId + '</I_V_AFFECTED_EE>'
                + '<I_V_APPID>' + global.currentApplication.appId + '</I_V_APPID>'
                + '<I_V_TRACK_ID>' + this.docTrackId + '</I_V_TRACK_ID>'
            + '</PARAM>'
        + '</EWS>';

        var url = this.parentApp.url;
        while (('url' in url.toQueryParams())) {
            url = url.toQueryParams().url;
        }
        url = (Object.isEmpty(Object.values(((url).toQueryParams()))[0])) ? url + '?xml_in=' : url + '&xml_in=';
        evt.element().href = url + xmlin;
	},
	
	confirmSendHandler:function(evt){
		
		var xmlin = ''
		+ ' <EWS>'
		+ '     <SERVICE>DM_SEND_DOC</SERVICE>'
		+ '     <OBJECT TYPE="P">' + this.affectedId + '</OBJECT>'
		+ '     <DEL/><GCC/><LCC/>'
		+ '     <PARAM>'
		+ '         <I_V_DOC_TYPE>' + this.docTypeId + '</I_V_DOC_TYPE>'
		+ '         <I_V_APPID>' + global.currentApplication.appId + '</I_V_APPID>'
		+ '         <I_V_APP_FIELD/>'
		+ '     </PARAM>'
		+ ' </EWS>';
		this.method = 'POST';
		this.url=this.parentApp.url;
		this.makeAJAXrequest($H({ xml: xmlin,
            successMethod: 'confirmSendCallback',
            xmlFormat: false
        }));
        
	},
	
	removeFromSendListHandler:function(evt){
		var xmlin = ''
		+ ' <EWS>'
		+ '     <SERVICE>DM_RMV_SEND_DOC</SERVICE>'
		+ '     <OBJECT TYPE=""/>'
		+ '     <DEL/><GCC/><LCC/>'
		+ '     <PARAM>'
		+ '         <I_V_TRACK_ID>' + this.docTrackId + '</I_V_TRACK_ID>'
		+ '     </PARAM>'
		+ ' </EWS>';
		this.method = 'POST';
		this.url=this.parentApp.url;
		this.makeAJAXrequest($H({ xml: xmlin,
			successMethod: 'removeFromSendListCallback',
			xmlFormat: false
		}));
        
	},
	
	 removeFromSendListCallback: function(json) {
		 this.target.update('<span style="font-weight: bold; color: red;float:left;margin:5px;">'+global.getLabel('DML_DOCUMENT_TRACKING_HAS_BEEN_REMOVED')+'</span>');
    },
	
 	confirmSendCallback: function(json){
		if (json.EWS.o_v_track_id) {
            this.docTrackId = json.EWS.o_v_track_id;
        } else {
            return;
        }
	},
	
	gotoSentDocHandler:function(evt){
		this.parentApp.gotoSentDocHandler();
	}, 
	
	getAddress:function(){
		var xmlin = ''
        + ' <EWS>'
        + '     <SERVICE>DM_GET_CS_PREV</SERVICE>'
        + '     <PARAM>'
        + '     </PARAM>'
        + ' </EWS>';
		this.method = 'POST';
		this.url=this.parentApp.url;

        this.makeAJAXrequest($H({ xml: xmlin,
            successMethod: 'buildAddress',
            xmlFormat: false
        }));
	},
	
	buildAddress:function(json){
		this.target.down('span.cs_fax').update(json.EWS.o_w_mail_info['@fax']);
		var contact=
		json.EWS.o_w_mail_info['@contact_name']+'<br/>'+
		json.EWS.o_w_mail_info['@post_code']+'<br/>'+
		json.EWS.o_w_mail_info['@street_line1']+'<br/>'+
		json.EWS.o_w_mail_info['@street_line2']+'<br/>'+
		json.EWS.o_w_mail_info['@city']+', '+json.EWS.o_w_mail_info['@country'];
		this.target.down('span.cs_address').update(contact);
	},
	
	
	build: function(){
		
		var buildDiv = new Element ('div',{
				'id' : 'buildDiv',
				'style' : 'width:100%;'
		});
		
		var downloadCoversheet = new Element ('a',{
								'toolTip' : global.getLabel('DML_DOWNLOAD_COVERSHEET'),
								'id' : 'downloadCoversheet',
								'style' : 'text-decoration:underline;',
								'class' : 'getContentLinks fieldDispFloatLeft application_action_link',
								'target' : '_blank'
		});

		
		downloadCoversheet.insert(global.getLabel('DML_DOWNLOAD_COVERSHEET'));
		buildDiv.insert(downloadCoversheet);
	
		var docForSendingRed = new Element ('span', {
								'id' : 'docForSendingRed',
								'style' : 'font-weight: bold; color: red;float:left;margin:5px;'
		})					
	
		docForSendingRed.insert(global.getLabel('DML_DOCUMENT_CONFIRMED_FOR_SENDING_TASK_'));
		buildDiv.insert(docForSendingRed);
					
		if(!this.isMandatory){
		
			var json = ({ 
					elements:[]
			});
			
			var removeButton = ({
							label: global.getLabel('DML_REMOVE_FROM_SEND_LIST'),
							className: (!global.liteVersion)?'application_action_link': '',
							type: 'button',
							idButton: 'Button_Remove',
							handler: this.removeFromSendListHandlerBinding,
							standardButton: (!global.liteVersion)? true : false
			});
			json.elements.push(removeButton);

			var removeButton_displayer = new megaButtonDisplayer(json);
			buildDiv.insert(removeButton_displayer.getButtons());

		}

		var adobePdfrequire = new Element('p', {
						'id' : 'adobePdfrequire',
						'style' : 'text-align:left;margin-top:10px;float:left;width:99%;'
		});			
		
		var adobePdfrequireLink = new Element ('a', {
						'id' : 'adobePdfrequireLink',
						'class' : 'application_action_link',
						'href' : global.getLabel('DML_PDF_READER_LINK'),
						'target' : '_blank'
		});			

		adobePdfrequire.insert('(');
		adobePdfrequire.insert(global.getLabel('DML_REQUIRE_PDF_READER'));
		adobePdfrequire.insert('&nbsp;');
		adobePdfrequireLink.insert(global.getLabel('DML_PDF_READER_LINK'));
		adobePdfrequire.insert(adobePdfrequireLink);
		adobePdfrequire.insert(')');
		buildDiv.insert(adobePdfrequire);

		var noteSenthistory = new Element('p',{
						'id' : 'noteSenthistory',
						'style' : 'text-align:left;margin-top:10px;float:left;width:99%;'
		});			
		
		var noteSenthistoryLink = new Element ('span', {
						'id' : 'noteSenthistoryLink',
						'class' : 'application_action_link'
		});
		noteSenthistoryLink.observe('click',this.gotoSentDocHandlerBinding);		
		noteSenthistoryLink.insert(global.getLabel('DML_SENT_DOCUMENT_HISTORY'));
		noteSenthistory.insert(global.getLabel('DML_NOTE_THAT'));
		noteSenthistory.insert(noteSenthistoryLink);
		noteSenthistory.insert('" ');
		noteSenthistory.insert(global.getLabel('DML_YOU_CAN_VIEW_ALL'));
		noteSenthistory.insert('.');	
		buildDiv.insert(noteSenthistory);
				
		var pdfCoverSheet = new Element ('span', {
						'id' : 'pdfCoverSheet',
						'style' : 'text-align:left;margin-top:10px;float:left;width:99%;'
		});
		
		pdfCoverSheet.insert(global.getLabel('DML_THE_PDF_COVERSHEET'));
		buildDiv.insert(pdfCoverSheet);

		var typeDoc = new Element ('span', {
						'id' : 'typeDoc',
						'style' : 'text-align:left;margin-top:5px;margin-left:10px;float:left;width:99%;'
		});
		
		typeDoc.insert(' - ');
		typeDoc.insert(global.getLabel('DML_TYPE_OF_DOCUMENT'));
		typeDoc.insert(' : <b>'+this.docTypeLabel+'</b>');		
		buildDiv.insert(typeDoc);		

		var requestorInfo = new Element ('span',{
						'id' : 'requestorInfo',
						'style' : 'text-align:left;margin-top:5px;margin-left:10px;float:left;width:99%;'
		});
		
		requestorInfo.insert(' - ');
		requestorInfo.insert(global.getLabel('DML_REQUESTOR_INFORMATION'));
		requestorInfo.insert(' : ');
		buildDiv.insert(requestorInfo);
					
		var empID = new Element ('span', {
					'id' : 'empID',
					'style' : 'text-align:left;margin-top:3px;margin-left:20px;float:left;width:99%;'
		});
		
		empID.insert(global.getLabel('DML_EMPLOYEE_ID'));
		empID.insert(' : <b>'+this.requestorId+'</b> ');
		empID.insert(global.getLabel('DML_GCC'));
		empID.insert(' : <b>'+this.gcc+'</b>   ');
		empID.insert(global.getLabel('DML_LCC'));
		empID.insert(' : <b>'+this.lcc+'</b>');
		requestorInfo.insert(empID);
		
		var empNAME = new Element('span',{
					'id' : 'empNAME',
					'style' : 'text-align:left;margin-top:3px;margin-left:20px;float:left;width:99%;'
		});		
		
		empNAME.insert(global.getLabel('DML_EMPLOYEE_NAME'));
		empNAME.insert(' : <b>'+this.requestorName+'</b>');
		requestorInfo.insert(empNAME);
					
		var affectedfromRequestor = new Element('span',{
					'id' : 'affectedfromRequestor',
					'style' : 'text-align:left;margin-top:5px;margin-left:10px;float:left;width:99%;' 
		});
		
		affectedfromRequestor.insert(' - ');
		affectedfromRequestor.insert(global.getLabel('DML_AFFECTED_PERSON_DIFFERENT_FROM_REQUE'));
		buildDiv.insert(affectedfromRequestor);
			
		if(this.requestorId==this.affectedId){
			affectedfromRequestor.insert(' : <b>' + global.getLabel('DML_NO') + '</b>' );
		}else{
			affectedfromRequestor.insert(' : <b>' + global.getLabel('DML_YES') + '</b>' );
		}
					
		if (this.requestorId != this.affectedId) {
		
			var affectedempID = new Element('span', {
				'id': 'affectedempID',
				'style': 'text-align:left;margin-top:3px;margin-left:20px;float:left;width:99%;'
			});
			
			affectedempID.insert(global.getLabel('DML_EMPLOYEE_ID'));
			affectedempID.insert(' : <b>' + this.affectedId + '</b>   ');
			affectedempID.insert(global.getLabel('DML_GCC'));
			affectedempID.insert(' : <b>' + this.gcc + '</b>   ');
			affectedempID.insert(global.getLabel('DML_LCC'));
			affectedempID.insert(' : <b>' + this.lcc + '</b>');
			affectedfromRequestor.insert(affectedempID);
								
			var affectedempNAME = new Element('span', {
				'id': 'affectedempNAME',
				'style': 'text-align:left;margin-top:3px;margin-left:20px;float:left;width:99%;'
			});
			
			affectedempNAME.insert(global.getLabel('DML_EMPLOYEE_NAME'));
			affectedempNAME.insert(' : <b>' + this.affectedName + '</b>');
			affectedfromRequestor.insert(affectedempNAME);
			
		}
		
		/*
		var docProcess = new Element('span',{
					'id' : 'docProcess',
					'style' : 'text-align:left;margin-top:5px;margin-left:10px;float:left;width:99%;'
		})
		
		docProcess.insert(' - ');
		docProcess.insert(global.getLabel('DML_PROCESS_FOR_WHICH_DOCUMENTS_ARE_SENT'));
		docProcess.insert(' : ');
		buildDiv.insert(docProcess);
		
		if(this.process){
			docProcess.insert('<b>' + this.process + '</b>');
		}else{
			docProcess.insert('<b>' + global.getLabel('DML_NONE') + '</b>');
		}
		*/
		var ticketService = new Element('span',{
					'id' : 'ticketService',
					'style' : 'text-align:left;margin-top:5px;margin-left:10px;float:left;width:99%;'
		});
		
		ticketService.insert(' - ');
		ticketService.insert(global.getLabel('DML_TICKET_SERVICE_FOR_DOCUMENT_PROCESSI'));
		ticketService.insert(' : <b>'+this.ticket+'</b><br/>');
		buildDiv.insert(ticketService);
	
		var printCoverSheet = new Element('span', {
					'id' : 'printCoverSheet',
					'style' : 'text-align:left;margin-top:10px;float:left;width:99%;'
		});
		
		printCoverSheet.insert(global.getLabel('DML_PLEASE_PRINT_THE_COVERSHEET'));
		buildDiv.insert(printCoverSheet);
		
		var mailOffice = new Element('span', {
					'id' : 'mailOffice',
					'style' : 'text-align:left;margin-top:5px;margin-left:10px;float:left;width:99%;'
		});
		
		mailOffice.insert(' - ');
		mailOffice.insert(global.getLabel('DML_IF_YOU_HAVE_A_MAIL_ROOM_IN_YOUR_OFFI'));
		buildDiv.insert(mailOffice);
						
		var faxNumber = new Element('span',{
					'id' : 'faxNumber',
					'style' : 'text-align:left;margin-top:5px;margin-left:10px;float:left;width:99%;'
		});		
						
		var faxNumberRed = new Element('span', {
					'id' : 'faxNumberRed',
					'class' : 'cs_fax',
					'style' : 'font-weight:bold;color:red;'
					
		});	
		
		faxNumber.insert(' - ');
		faxNumber.insert(global.getLabel('DML_VIA'));
		faxNumber.insert(' <b>'+global.getLabel('DML_FAX')+'</b> ');
		faxNumber.insert(global.getLabel('DML_ON_THIS_NUMBER'));
		faxNumber.insert(' : ');
		faxNumber.insert(faxNumberRed);
		faxNumberRed.insert('+800 5432 754');
		buildDiv.insert(faxNumber);
					
		var mailPostal = new Element ('span',{
					'id' : 'mailPostal',
					'style' : 'text-align:left;margin-top:5px;margin-left:10px;float:left;width:40%;'
		});
		
		var mailPostal2 = new Element ('span',{
					'id' : 'mailPostal2',
					'style' : 'float:left;'
		});
		
		this.getAddress();
		mailPostal2.insert(' - ');
		mailPostal2.insert(global.getLabel('DML_VIA'));
		mailPostal2.insert(' <b>'+global.getLabel('DML_POSTAL_MAIL')+'</b> ');
		mailPostal2.insert(global.getLabel('DML_TO'));
		mailPostal2.insert(' : ');
		mailPostal.insert(mailPostal2);
		mailPostal.insert(mailPostal3);
		buildDiv.insert(mailPostal);
		
		var mailPostal3 = new Element('span', {
					'id' : 'mailPostal3',
					'class' : 'cs_address',
					'style' : 'font-weight:bold;color:red;float:left;margin-left:5px;'
		});
				
		mailPostal.insert(mailPostal3);
	
		var adrressesMail = new Element ('p', {
					'id' : 'adrressesMail',
					'style' : 'text-align:left;margin-top:10px;float:left;width:99%;'
		});
		
		adrressesMail.insert(global.getLabel('DML_USING_A_COVERSHEET_TO_SEND_IN_DOCUME'));
		adrressesMail.insert('. ');
		adrressesMail.insert(global.getLabel('DML_AS_A_RESULT_YOU_BENIFIT_A_SHORTER'));
		adrressesMail.insert('. ');
		adrressesMail.insert(global.getLabel('DML_THANKS_TO_THE_USE_OF_A_BARCODE'));
		adrressesMail.insert('. ');
		adrressesMail.insert(global.getLabel('DML_THE_DATA_IN_THE_BARCODE'));
		adrressesMail.insert('. ');	
		buildDiv.insert(adrressesMail);
								
		this.target.update(buildDiv);
		this.target.select('a').first().observe('click',this.downloadCoversheetHandlerBinding);
	}
});

var SendDocument_Transaction = new Class.create(Application,

{

	required:false,
	uploadModules:{},
	docTypesHash: null,
	curObjectType: null,
	curObjectId: null,
	initialize: function($super, args) {
			$super(args);
			this.docs={'Medical Certificate':true,'Insurrance Claim':false};
			
			this.info={
				'docs':
					[
						{
						'docId':'1',
						'docName':'Medical Certificate',
						'mandatory':true,
						'onSuccessEvent': 'EWS:documentSuccess_1',
						'onFailureEvent': 'EWS:documentFailure_1'
						},
						{
						'docId':'2',
						'docName':'Insurrance Claim',
						'mandatory':false,
						'onSuccessEvent': 'EWS:documentSuccess_2',
						'onFailureEvent': 'EWS:documentFailure_2'
						}
					]
			};
			
			this.arrowClickHandlerBinding = this.arrowClickHandler.bindAsEventListener(this);
			this.uploadClickHandlerBinding = this.uploadClickHandler.bindAsEventListener(this);
			this.coversheetClickHandlerBinding = this.coversheetClickHandler.bindAsEventListener(this);
			this.uploadButtonClickHandlerBinding = this.uploadButtonClickHandler.bindAsEventListener(this);
			this.gotoSentDocHandlerBinding = this.gotoSentDocHandler.bindAsEventListener(this);
			
			this.confirmSendDocClickHandlerBinding = this.confirmSendDocClickHandler.bindAsEventListener(this);
			
			document.observe('EWS:dm_tr_up', this.dm_tr_up.bindAsEventListener(this));
			
			document.observe('EWS:dm_tr_validate', this.dm_tr_validate.bindAsEventListener(this));
			this.docTypesHash = $H();
			

	
	},
	
	
	dm_tr_validate: function(evt){
		var validated = $A();
		for (var i=0;i<this.info.docs.length;i++){
			if(this.info.docs[i].mandatory && !this.info.docs[i].uploaded){
				validated.push('MAN_FALSE');
			}
			else if(this.info.docs[i].mandatory && this.info.docs[i].uploaded){
				validated.push('MAN_TRUE');
			}
			else if(!this.info.docs[i].mandatory && !this.info.docs[i].uploaded){
				validated.push('OPT_FALSE');
			}
			else{
				validated.push('OPT_TRUE');
			}
		}

		return validated;
	},
	
	dm_tr_up: function(evt,i,b){	
		this.info.docs[i].uploaded=b;
	},
	
	confirmSendDocClickHandler: function(evt) {

            var xmlin = ''
            + ' <EWS>'
            + '     <SERVICE>DM_SEND_DOC</SERVICE>'
            + '     <OBJECT TYPE="P">' + global.objectId + '</OBJECT>'
            + '     <DEL/><GCC/><LCC/>'
            + '     <PARAM>'
			+ '         <I_V_DOC_TYPE>001</I_V_DOC_TYPE>'
            + '         <I_V_APPID>' + global.currentApplication.appId + '</I_V_APPID>'
            + '         <I_V_APP_FIELD/>'
            + '     </PARAM>'
            + ' </EWS>';

            this.makeAJAXrequest($H({ xml: xmlin,
                successMethod: 'confirmSendDocCallback',
                xmlFormat: false
            }));
    },
	
	confirmSendDocCallback: function(json) {

        if (json.EWS.o_v_track_id) {
            this.docTrackId = json.EWS.o_v_track_id;
			alert(this.docTrackId);
        } else {
            return;
        }

    },
	
	gotoSentDocHandler: function(evt){
		
		this.close();
		global.open($H({
            app: {
                appId: 'ST_DOCH',
                tabId: 'SC_DOCU',
                view: 'SendDocumentHistory'
            }
        }));
	},
	
	run: function($super, args) {
        $super(args);
		this.virtualHtml.update();
		this.info.failureEvent=args.get("failureEvent");
		this.info.successEvent=args.get("successEvent");
		var array=new Array();
		this.curObjectType=args.get("objectType");
		this.curObjectId=args.get("objectId");
		args.get("documents").each(function(s, index) {
			var obj={};
			obj.docId=s[1]["@default_value"];
			obj.docName=s[1]["@fieldid"];
			if(s[1]["@display_attrib"]=="MAN"){
				obj.mandatory=true;
			}else{
				obj.mandatory=false;
			}
			obj.onSuccessEvent='EWS:documentSuccess_'+index;
			obj.onFailureEvent='EWS:documentFailure_'+index;
			array.push(obj);
		});
		this.info.docs=array;
		this.getType();
		


		
		
	},
	
	setDocObservers: function(){
		var l=this.info.docs.length;
		
		for (var i=0;i<l;i++){
				document.observe(this.info.docs[i].onSuccessEvent, this.dm_tr_up.bindAsEventListener(this,i,true));
				document.observe(this.info.docs[i].onFailureEvent, this.dm_tr_up.bindAsEventListener(this,i,false));
		}
	},
	
	getType : function(){

		var emp,otype;
		if(this.curObjectType && this.curObjectId){
			emp = this.curObjectId;
			otype=this.curObjectType;
		}else{
			emp = global.objectId;
			otype = 'P';
		}
		
		var xmlin = ''
        + ' <EWS>'
        + '<SERVICE>DM_GET_TYPES</SERVICE>'
		+ '<OBJ TYPE="'+((otype)? otype: '')+'">'+((emp)? emp: '')+'</OBJ>'	
        + '<PARAM>'
        + '</PARAM>'
        + ' </EWS>';

        this.makeAJAXrequest($H({ xml: xmlin,
            successMethod: 'buildTypeHash',
            xmlFormat: false
        }));
	},
	
	buildTypeHash: function(JSON){
		if(!JSON) return;
		
		if(JSON.EWS.o_i_doc_type_list){
			 var textArray = objectToArray(JSON.EWS.o_i_doc_type_list.yglui_str_ecm_doc_typelist);
			 textArray.each(function(item){
				//this.docTypesHash.set(item['@doc_type_id'],item['@doc_type_name']);
				this.docTypesHash.set(item['@content_group_id'],{docTypeId: item['@content_group_id'],docTypeName:item['@doc_type_name'],docAppType: item['@up_type']})
			 },this);			 		 
		}
		this.getGccLcc();
	},	
	
	getGccLcc: function(){
		
		var emp,otype;
		if(this.curObjectType && this.curObjectId){
			emp = this.curObjectId;
			otype=this.curObjectType;
		}else{
			emp = global.objectId;
			otype = 'P';
		}
		
		var xmlin = ''
        + ' <EWS>'
        + '     <SERVICE>DM_GET_CS_PREV</SERVICE>'
		+ '     <OBJ TYPE="'+((otype)? otype: '')+'">'+((emp)? emp: '')+'</OBJ>'	
        + '     <PARAM>'
        + '     </PARAM>'
        + ' </EWS>';
        this.makeAJAXrequest($H({ xml: xmlin,
			successMethod: function(json) {
				this.buildPopup.bind(this,json).delay(1);
			} .bind(this),
            xmlFormat: false
        }));
	},
	
	
	uploadButtonClickHandler:function(docId){
		this.uploadButtonToHide = docId;
		this.uploadModules[docId].uploadHandler();
	},
	
	
	docId: function(json) {
		if($(global.currentApplication.AppId+'_upload_btn_dm+'+this.uploadButtonToHide)){
			$(global.currentApplication.AppId+'_upload_btn_dm+'+this.uploadButtonToHide).hide();
		}
		//debugger;
		//this.uploadButtonToHide.hide();
    },
	
	
	uploadClickHandler:function(evt){
		
		var emp;
		if(this.curObjectId){
			emp = this.curObjectId;
		}else{
			emp = global.objectId;
		}
		
		var elt=evt.element();
		var div=elt.up().next();
		var onSuccessEvent=elt.readAttribute("onsuccessevent");
		var onFailureEvent=elt.readAttribute("onfailureevent");
		div.update();
		
		this.uploadModules[div.readAttribute('docId')] = 
		
		new UploadModule(div, global.currentApplication.appId, 'DM_UPLOAD_DOC', true, this.docId.bind(this),
			{
			    I_V_DOC_TYPE: div.readAttribute('docId'),
			    /*I_V_PERSNO: this.info.employee_id,*/
				I_V_PERSNO: emp,
			    I_V_APPID: global.currentApplication.appId
			},onSuccessEvent,onFailureEvent);
		div.next().show();
		//this.uploadButtonToHide=div.next();
	},
	
	coversheetClickHandler:function(evt){
		var elt=evt.element();
		var i=elt.readAttribute("doctype_index");
		var onSuccessEvent=elt.readAttribute("onsuccessevent");
		var onFailureEvent=elt.readAttribute("onfailureevent");
		this.buildCoversheet(elt.up().next(),i,onSuccessEvent,onFailureEvent);
	},
	
	buildCoversheet:function(container,i,onSuccessEvent,onFailureEvent){
	
		container.next().hide();
		
		
		var selectedEmp = global.getSelectedEmployees();
        this.emp = selectedEmp[0];

        var ee = global.getEmployee(this.emp);
        var empName;
        if (ee) {
            empName = ee.name;
        }
        this.empName = empName;
		
		
		new CoversheetSD(
		container,
		this.info.docs[i].docName,
		this.info.docs[i].docId,
		this.gcc,
		this.lcc,
		global.name,
		global.objectId,
		this.empName,
		this.emp,
		false,
		'ticket',
		this,
		i,
		onSuccessEvent,
		onFailureEvent
		);
		
	},	
	
	arrowClickHandler:function(evt){
		var span= evt.element();
		span.up().next().toggle();
		if(span.hasClassName('application_verticalR_arrow')){
			span.removeClassName('application_verticalR_arrow');
			span.addClassName('application_down_arrow');
		}else{
			span.removeClassName('application_down_arrow');
			span.addClassName('application_verticalR_arrow');
		}
	},
	
	close: function($super) {
		var documentValid=this.dm_tr_validate();
		var msgType;
		documentValid.each(function(doc) {
			if(doc=='MAN_FALSE'){
				msgType='F';
				throw $break;
			}
			else if(doc=='MAN_TRUE'){
				msgType='S';
				throw $break;
			}else if(doc=='OPT_TRUE'){
				msgType='E';
			} else{
				msgType='E'
			}
		}.bind(this));
		if(msgType=='F'){
			document.fire(this.info.failureEvent);
		}else if(msgType=='S'){
			document.fire(this.info.successEvent);
		}

		$super();
		this.popUpApplication.close();
	},
	
		
	buildDocUpload: function(doc_id,doc_type_label,required,onSuccessEvent,onFailureEvent,i){
		//debugger;
		var div=new Element('div',{style: 'width:100%;float:left;' });
		
		var div1 = new Element('div',{style: 'width:100%;float:left;margin-top:10px;' });
		var arrow= new Element('span',{'class': 'dm_treeHandler_align_verticalArrow application_verticalR_arrow'}).update('&nbsp;');
		arrow.observe('click', this.arrowClickHandlerBinding);
		var doc_option_label=new Element('span');
		if(required){
			doc_option_label.update(global.getLabel('DML_REQUIRED_DOC ') + ' : ');
		}else{
			doc_option_label.update(global.getLabel('DML_OPTIONAL_DOC') + ' : ');
		}
		
		var doc_type=new Element('span').update(doc_type_label.docTypeName);
		div1.insert(arrow);
		div1.insert(doc_option_label);
		div1.insert(doc_type);
		div.insert(div1);
		if(doc_type_label.docAppType=='ELT'){
			var div2 = new Element('div',{style: 'width: 100%; float: left; text-align: left;margin-top:5px;padding-left:2%' });
			div.insert(div2); 
			var emp;
			if(this.curObjectId){
				emp = this.curObjectId;
			}else{
				emp = global.objectId;
			}
		
			div2.update();
			this.uploadModules[doc_id] = 
			
			new UploadModule(div2, global.currentApplication.appId, 'DM_UPLOAD_DOC', true, this.docId.bind(this),
				{
					I_V_DOC_TYPE: doc_type_label.docTypeId,
					I_V_PERSNO: emp,
					I_V_APPID: global.currentApplication.appId
				},onSuccessEvent,onFailureEvent);
			div2.hide();
			
			
			var btnCont = new Element('div', {
				'style': 'float:left;',
				'id': global.currentApplication.AppId+'_upload_btn_dm+'+doc_id
			});
			div2.insert(btnCont);
			
			var jn = { elements: [] };
			var save = {
				idButton: 'sendDocument_upload',
				label: global.getLabel('DM_UPLOAD_DOC'),
				type: 'button',
				handler: this.uploadButtonClickHandler.bind(this,doc_id),
				standardButton: true
			};
			jn.elements.push(save);
			btns = new megaButtonDisplayer(jn);
			btnCont.update(btns.getButtons());
		}
		else if(doc_type_label.docAppType=='SCA'){
			var div2 = new Element('div',{style: 'width: 100%; float: left; text-align: left;margin-top:5px;padding-left:2%' });
			div.insert(div2); 
			var selectedEmp = global.getSelectedEmployees();
			this.emp = selectedEmp[0];
			var ee = global.getEmployee(this.emp);
			var empName;
			if (ee) {
			empName = ee.name;
			}
			this.empName = empName;
			new CoversheetSD(div2,this.info.docs[i].docName,this.info.docs[i].docId,this.gcc,this.lcc,global.name,global.objectId,this.empName,this.emp,false,'ticket',this,i,onSuccessEvent,onFailureEvent);
			div2.hide();
		}
		else{
			var div2 = new Element('div',{style: 'width: 100%; float: left; text-align: left;' });
			var choose_to=new Element('span',{'class': 'fieldDispFloatLeft'}).update(global.getLabel('DML_CHOOSE_TO'));
			var upload=new Element('input',{'onSuccessEvent':onSuccessEvent,'onFailureEvent':onFailureEvent,type: 'radio',value: 'upload',name: doc_type_label+'_send_doc_radio',is_required:required+''});
			upload.observe('click', this.uploadClickHandlerBinding);
			var coversheet=new Element('input',{'doctype_index':i,'onSuccessEvent':onSuccessEvent,'onFailureEvent':onFailureEvent,type: 'radio',value: 'coversheet',name: doc_type_label+'_send_doc_radio',is_required:required+''});
			coversheet.observe('click', this.coversheetClickHandlerBinding);
			div2.insert(choose_to);
			div2.insert(upload);
			div2.insert(global.getLabel('DML_UPLOAD_ELECTRONICALLY')+'  ');
			div2.insert(coversheet);
			div2.insert(global.getLabel('DML_SEND_WITH_COVERSHEET_FOR_SCANNING_PR'));
			
			var div3 = new Element('div',{'class':'upload_transaction_container', id:'upload_transaction_container'+doc_id, docId:doc_id, docType:doc_type_label, style: 'width: 100%; float: left; text-align: left; margin-top: 10px;' });
			
			var div4 = new Element('div',{style: 'width: 100%; float: left; text-align: left; margin-top: 10px;' });
			div4.insert(div2);
			div4.insert(div3);
				
			
			var div5 = new Element('div',{style: 'width: 100%; float: left; text-align: left;' });
	
			div4.insert(div5);
			div4.hide();
			div.insert(div4); 
			
			
			var btnCont = new Element('div', {
				'style': 'float:left;',
				'id': global.currentApplication.AppId+'_upload_btn_dm+'+doc_id
			});
			div4.insert(btnCont);
			
			var jn = { elements: [] };
			var save = {
				idButton: 'sendDocument_upload',
				label: global.getLabel('DM_UPLOAD_DOC'),
				type: 'button',
				handler: this.uploadButtonClickHandler.bind(this,doc_id),
				standardButton: true
			};
			jn.elements.push(save);
			btns = new megaButtonDisplayer(jn);
			btnCont.update(btns.getButtons());
		}
		
		return div;
	},
	
	
	buildPopup: function(json){
		this.gcc=json.EWS.o_v_yygcc;
		this.lcc=json.EWS.o_v_yylcc;
		var contentHTML = new Element('div');

		var title = new Element('span',{'class': 'application_main_title', style: 'width:100%' }).update(global.getLabel('DM_SENDDOC_TRANS') + ' : ');
		
		this.virtualHtml.insert(title);
		
		var docs=this.info.docs;
		
		for (var i = 0; i < docs.length; i++) {
				this.virtualHtml.insert(
				this.buildDocUpload(docs[i].docId,this.docTypesHash.get(docs[i].docId),docs[i].mandatory,
				docs[i].onSuccessEvent,
				docs[i].onFailureEvent,i)
				);
				if(docs[i].mandatory)
					this.required=true;
				}
		this.setDocObservers();
	}
});