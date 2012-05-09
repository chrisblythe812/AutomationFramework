var Help2_04 = Class.create(origin, {
    helpDiv: null,//Div with help info
    divContainer: $('content'), //Div parent

    initialize: function($super, args) {
        $super();
        this.moreButtonHandlerBinding = this.moreButtonHandler.bindAsEventListener(this);

    },
	
    getHelp: function() {

        this.makeAJAXrequest($H({ xml:
        '<EWS><SERVICE>ECM_GET_help</SERVICE><OBJECT TYPE=""/><DEL/><GCC/><LCC/><PARAM><app_id>' + global.currentApplication.appId + '</app_id><tab_id>' + global.currentApplication.tabId + '</tab_id><view>'+global.currentApplication.view+'</view></PARAM></EWS>'
        , successMethod: 'buildHelp',
            xmlFormat: false
        }));
    },

    buildHelp: function(json) {
		this.summary = new Element("div").update('');
		var bHtml ='';
		if(json.EWS.o_summary && json.EWS.o_body){
			//alert('summary && body');
			this.title = global.getLabel('HelpInstructions');
			this.label = global.getLabel('Help_In_more');
			this.here = global.getLabel('Help_Ins_here');
		
			var sHtml = prepareTextToEdit(json.EWS.o_summary).stripScripts();
			bHtml = prepareTextToEdit(json.EWS.o_body).stripScripts();
			
			this.summary.update(sHtml);
			this.body = new Element("div").update(bHtml);

			var bdyA = this.body.getElementsByTagName("a");
			for (i = 0; i < bdyA.length; i++) {
				bdyA[i].setAttribute('url_content', bdyA[i].getAttribute('href'));
				bdyA[i].removeAttribute('href');
			}
			this.moreButton = new Element('span', { 'class': 'application_action_link', 'title': this.label + ' ' + this.here }).update(this.here);
			this.moreButton.observe('click', this.moreButtonHandlerBinding);
			this.summary.insert("... " + this.label + " ");
			this.summary.appendChild(this.moreButton);
		}else{
			if(json.EWS.o_body){
				this.title = global.getLabel('HelpInstructions');
				bHtml = json.EWS.o_body;
				this.body = new Element("div").update(bHtml);
				this.moreButtonHandler();
				return;
			}else{
				this.summary.update(global.getLabel('NO_HELP_FOUND'));
				this.title = global.getLabel('HelpInstructions');
			}
		}
        
		this.helpDiv = new Element("div", {
            id: "helpDiv",
            'class': "help_container"
        });
        Element.insert(this.divContainer,{ top:this.helpDiv});
        var options = $H({
            title: this.title,
            collapseBut: true,
            contentHTML: this.summary,
            onLoadCollapse: false,
            targetDiv: 'helpDiv'
        });		
		var helpWidget = new unmWidget(options);
    },

    moreButtonHandler: function(evt, noEvent) {

        var helpWindow = window.open('', 'helpWindow', 'menubar=no,status=no,scrollbars=no,menubar=no,height=456,width=600');
        helpWindow.document.write(""
        + "\n<html>"
        + "\n    <head>"
        + "\n        <title>" + this.title + "</title>"
        + "\n        <link href='css/CSS2.css' rel='stylesheet' type='text/css' />"
        + "\n        <script>"
        + "\n             function closeWindow(){"
        + "\n               if(window.opener.instanceHelp){"
        + "\n                   window.opener.instanceHelp.destroy()"
        + "\n               }"
        + "\n             }"
        + "\n        </script>" 
        + "\n    </head>"
        + "\n    <body>"
        + "\n          <div id='helpContent' class='help_full_container'>" + this.body.innerHTML + "</div>"
        + "\n          <div id='helpContent' class='help_full_close'><input type='button' value='" + global.getLabel('Help_Ins_close') + "' onclick='window.self.close();'></div>"
        + "\n    </body>"
        + "\n</html>");
        helpWindow.document.close();
    },
    destroy: function(){
        if(this.helpDiv)
            this.helpDiv.remove();
        this.helpDiv = null;
        document.stopObserving('EWS:kmAuthModeChanged',this.onRebuildApplicationBinding);
        instanceHelp = null;
    }
});
//help 2.04

/**
*@fileoverview help.js
*@description Help content class
*/

/**
*@constructor
*@description this class implements all help content features.
*@augments Application
*/


var Help = Class.create(origin, {
    
    helpDiv: null,//Div with help info
    divContainer: $('content'), //Div parent
	helpType: null,
	helpTypeLookUp: null,
	helpFieldElm: null,
    widgetHelpPopUp: null,
	
    initialize: function($super, args) {
        $super();
        //this.onOpenApplicationHandlerBinding = this.onOpenApplicationHandler.bindAsEventListener(this);
        this.moreButtonHandlerBinding = this.moreButtonHandler.bindAsEventListener(this);
		this.editContentHandlerBinding = this.editContentHandler.bindAsEventListener(this);
		document.observe("EWS:changeScreen", this.changeApplication.bind(this));
		this.helpType = args.helpType;
		var curApp = global.currentApplication;
	
		this.helpTypeLookUp = { 	
			'app' : {'sMethod': 'buildHelpApplication','key': curApp.tabId+';'+curApp.appId+';'+curApp.view+';'},
			'widget' : {'sMethod':'buildHelpWidget','key': '$#W;'+args.widId+';'+args.selected+';'+args.mode+';'},
			'field': {'sMethod':'buildHelpField','key': '$#F;'+args.fieldId+';'+args.widId+';'+args.screen+';'}
		}
		if(args.helpType=='field'){
			this.helpFieldElm = args.htmlContent;
		}
		if(args.helpType=='app'){
			this.onRebuildApplicationBinding = this.reBuildApplication.bindAsEventListener(this);
		}
		
    },
	editContentHandler: function(evt) {
	
		if(this.helpType=='widget'){
			this.widgetHelpPopUp.close();
			delete this.widgetHelpPopUp;
		}
	
		if(!this.checkedOut){
			this.makeAJAXrequest($H({ xml:
						'<EWS>' +
							'<SERVICE>KM_CHK_OU_WEB2</SERVICE>' +
							'<OBJECT TYPE=""/>' +
							'<DEL/><GCC/><LCC/>' +
							'<PARAM>' +
								'<I_V_CONT_ID>' + this.content_id + '</I_V_CONT_ID>' +
							'</PARAM>' +
						 '</EWS>',
				successMethod: 'editContentHandlerCO'
			}));
		}
		else{
			global.open($H({
                app: {
                    tabId: "CW_SPAG",
                    appId: "CW_SPAG",
                    view: "StartPage",
                    sbmid: "SC_CWB",
                    mnmid: "SC"
                },
                createContent: true,
                contentID: this.content_id
            }));
		}		
	},
	changeApplication: function(){
	    if( this.helpWindow )
	        this.helpWindow.close();
	    if( instanceHelp )
	        instanceHelp.destroy();
	},
	reBuildApplication: function(){
		this.resetHelpDiv();
		this.getHelp();
	},
	
	editContentHandlerCO: function(json) {
        this.resetHelpDiv();
        this.content_id = json.EWS.o_v_new_cont_id;
        global.open($H({
			app: {
				tabId: "CW_SPAG",
				appId: "CW_SPAG",
				view: "StartPage",
				sbmid: "SC_CWB",
				mnmid: "SC"
			},
			createContent: true,
			contentID: this.content_id
		}));
    },

    getHelp: function() {
	    if(this.helpType=='app' && global.kmAuthModeEnabled){
			document.observe('EWS:kmAuthModeChanged', this.onRebuildApplicationBinding);
		}
		
		var isAuthoringOn= global.kmAuthModeEnabled ? 'X' : '';
		var isSimulationOn= global.kmAuthSimulationEnabled ? 'X' : '';
				
		var xmlSt =
			'<EWS>' +
			'	<SERVICE>KM_GET_CONT_WB3</SERVICE>' +
			'	<OBJ TYPE="" />' +
			'	<PARAM>'+
			'<i_v_is_authoring>'+((global.kmAuthModeEnabled)? 'X': '')+'</i_v_is_authoring>'
			'<i_v_simulation_on>'+((global.kmAuthSimulationEnabled)? 'X': '')+'</i_v_simulation_on>';
		
			if (this.content_id) {
				xmlSt +=
					'<I_V_CONTENT_ID>' + this.content_id + '</I_V_CONTENT_ID>';
			}

				xmlSt +=   
					'<I_V_HELP_KEY >' + prepareTextToSend(this.helpTypeLookUp[this.helpType].key) + '</I_V_HELP_KEY >'+
				'</PARAM>'+
			'</EWS>';
		
		//var textXMl = '<EWS><SERVICE>KM_GET_CONT_WB3</SERVICE><OBJ TYPE="" /><PARAM><I_V_IS_AUTHORING></I_V_IS_AUTHORING><I_V_CONTENT_ID>35349</I_V_CONTENT_ID></PARAM><DEL></DEL></EWS>';
		
		this.makeAJAXrequest($H({ xml: xmlSt, successMethod: this.helpTypeLookUp[this.helpType].sMethod,
			xmlFormat: false
		})); 
		
	},

	buildHelpWidget: function(json){
			
			this.checkHelpLock(json.EWS.o_v_lock_by);
			this.getHelpCurrentContent(json.EWS);
			var html = new Element('div').insert(new Element('span',{'style':'font-weight:bold'}).insert(global.getLabel('HelpInstructions')));
			if(global.kmAuthModeEnabled){
				var pencil = new Element('div',{'class':'application_editSelection2 helpPencil'});
				html.insert(pencil);
			}

			if(json.EWS.o_v_content){
				var s = prepareTextToEdit(json.EWS.o_v_content);
				var a = s.split('<BODY>');
				var b = a[1].split('</BODY>');
				html.insert(new Element('div').insert(b[0]));
			}else{
				html.insert(new Element('div').insert(global.getLabel('NO_HELP_FOUND')));
			}
			
			this.widgetHelpPopUp = new infoPopUp({
                closeButton: $H({
                    'callBack': function() {
                        this.widgetHelpPopUp.close();
                        delete this.widgetHelpPopUp;
						instanceHelp = null;
						document.stopObserving('EWS:kmAuthModeChanged',this.onRebuildApplicationBinding);
                    }.bind(this)
                }),
                htmlContent: html,
                indicatorIcon: 'question',
                width: 800
		});
		this.widgetHelpPopUp.create();
		if(pencil){
			pencil.stopObserving();
			pencil.observe('click', this.editContentHandlerBinding);
		}
	},
	
	buildHelpField: function(json){
		this.checkHelpLock(json.EWS.o_v_lock_by);
		this.getHelpCurrentContent(json.EWS);
		var html = new Element('div').insert(new Element('span',{'style':'font-weight:bold'}).insert(global.getLabel('HelpInstructions')));
		if(global.kmAuthModeEnabled){
			var pencil = new Element('div',{'class':'application_editSelection2 helpPencil'});
			html.insert(pencil);
		}

		if(json.EWS.o_v_content){
			var s = prepareTextToEdit(json.EWS.o_v_content);
			var a = s.split('<BODY>');
			var b = a[1].split('</BODY>');
			html.insert(new Element('div').insert(b[0]));
		}else{
			html.insert(new Element('div').insert(global.getLabel('NO_HELP_FOUND')));
		}
		
		if(pencil){
			pencil.stopObserving();
			pencil.observe('click', this.editContentHandlerBinding);
		}
		
		//this.helpFieldElm.update(json.EWS.o_v_content);
		this.helpFieldElm.update(html);
	},
	
	checkHelpLock: function(lockById){
		if(lockById==global.objectId){
			this.locked=false;
			this.checkedOut=true;
		}else{
			this.locked=true;
		}
		
		if(parseInt(lockById)==0){
			this.locked=false;
		}
	},
	
	getHelpCurrentContent: function(json){
		if(json.o_i_cont_list && json.o_i_cont_list.yglui_str_ecm_km_multi_content){
			var conArray = objectToArray(json.o_i_cont_list.yglui_str_ecm_km_multi_content);
			for(var len = conArray.length-1, x = len; x>=0;x--){			
			    if(conArray[x]['@current']=='X'){
				    this.content_id = conArray[x]['@content_id'];
				}
			}
		}	
	},

    buildHelpApplication: function(json) {
		this.getHelpCurrentContent(json.EWS);
		this.checkHelpLock(json.EWS.o_v_lock_by);
		
		if(global.kmAuthModeEnabled){
			//show click here to view help			
			var label=new Element('div').update(global.getLabel('Help_In_more')+' ');
			var more= new Element('span', { 'class': 'application_action_link'}).update(global.getLabel('Help_Ins_here'));
			more.observe('click', function(){
				var s = prepareTextToEdit(json.EWS.o_v_content);
				var a = s.split('<BODY>');
				var b = a[1].split('</BODY>');
				var helpWindow = window.open('', 'helpWindow', 'menubar=no,status=no,scrollbars=no,menubar=no,height=456,width=600');
				helpWindow.document.write(""
				+ "\n<html>"
				+ "\n    <head>"
				+ "\n        <title>" + global.getLabel('HelpInstructions') + "</title>"
				+ "\n        <link href='css/CSSFWK.css' rel='stylesheet' type='text/css' />"
				+ "\n        <link href='css/CSS2.css' rel='stylesheet' type='text/css' />"
				+ "\n    </head>"
				+ "\n    <body>"
				+ "\n          <div id='helpContent' class='help_full_container'>" + b[0] + "</div>"
				+ "\n          <div id='helpContent' class='help_full_close'><input type='button' value='" + global.getLabel('Help_Ins_close') + "' onclick='window.self.close();'></div>"
				+ "\n    </body>"
				+ "\n</html>");
				helpWindow.document.close();				
			}.bind(this));
			this.helpDiv = new Element("div", {
				id: "helpDiv",
				'class': "help_container"
			});
			Element.insert(this.divContainer,{ top:this.helpDiv});
			label.appendChild(more);
			var options = $H({
				title: global.getLabel('HelpInstructions')+'<div class="application_editSelection2 helpPencil"></div>',
				collapseBut: true,
				contentHTML: label,
				onLoadCollapse: false,
				targetDiv: 'helpDiv'
			});
			var helpWidget = new unmWidget(options);
			var pencil = this.divContainer.down('div.application_editSelection2');
			if(pencil){
				pencil.stopObserving();
				pencil.observe('click', this.editContentHandlerBinding);
			}
		}else{
			//auth mode off
			if(json.EWS.o_v_content){
				//open real popup with content
				var s = prepareTextToEdit(json.EWS.o_v_content);
				var a = s.split('<BODY>');
				var b = a[1].split('</BODY>');
				this.helpWindow = window.open('', 'helpWindow', 'menubar=no,status=no,scrollbars=no,menubar=no,height=456,width=600');
				this.helpWindow.document.write(""
				+ "\n<html>"
				+ "\n    <head>"
				+ "\n        <title>" + global.getLabel('HelpInstructions') + "</title>"
                + "\n        <link href='css/CSSFWK.css' rel='stylesheet' type='text/css' />"
				+ "\n        <link href='css/CSS2.css' rel='stylesheet' type='text/css' />"
				+ "\n        <script>"
                + "\n             function closeWindow(){"
                + "\n               if(window.opener.instanceHelp){"
                + "\n                   window.opener.instanceHelp.destroy()"
                + "\n               }"
                + "\n             }"
                + "\n        </script>" 
				+ "\n    </head>"
				+ "\n    <body onunload='closeWindow()'>"
				+ "\n          <div id='helpContent' class='help_full_container'>" + b[0] + "</div>"
				+ "\n          <div id='helpContent' class='help_full_close'><input type='button' value='" + global.getLabel('Help_Ins_close') + "' onclick='window.self.close();'></div>"
				+ "\n    </body>"
				+ "\n</html>");
				this.helpWindow.document.close();
			
			}else{
				//show no help found
				this.helpDiv = new Element("div", {
					id: "helpDiv",
					'class': "help_container"
				});
				Element.insert(this.divContainer,{ top:this.helpDiv});
				var options = $H({
					title: global.getLabel('HelpInstructions')+'<div class="application_editSelection2 helpPencil"></div>',
					collapseBut: true,
					contentHTML: global.getLabel('NO_HELP_FOUND'),
					onLoadCollapse: false,
					targetDiv: 'helpDiv'
				});
				var helpWidget = new unmWidget(options);
				var pencil = this.divContainer.down('div.application_editSelection2');
				pencil.hide();
				pencil.stopObserving();
				pencil.observe('click', this.editContentHandlerBinding);
			}
		}
    },
	resetHelpDiv: function(){
        if(this.helpDiv){
	        this.helpDiv.remove();
	        this.helpDiv = null;
	    }
	},	
    /*
     * Function to show help in a new page
     */
    moreButtonHandler: function(evt, noEvent) {
        var helpWindow = window.open('', 'helpWindow', 'menubar=no,status=no,scrollbars=no,menubar=no,height=456,width=600');
        helpWindow.document.write(""
        + "\n<html>"
        + "\n    <head>"
        + "\n        <title>" + this.title + "</title>"
        + "\n        <link href='css/CSSFWK.css' rel='stylesheet' type='text/css' />"
		+ "\n        <link href='css/CSS2.css' rel='stylesheet' type='text/css' />"
        + "\n    </head>"
        + "\n    <body>"
        + "\n          <div id='helpContent' class='help_full_container'>" + this.body.innerHTML + "</div>"
        + "\n          <div id='helpContent' class='help_full_close'><input type='button' value='" + global.getLabel('Help_Ins_close') + "' onclick='window.self.close();'></div>"
        + "\n    </body>"
        + "\n</html>");
        helpWindow.document.close();
    },
 
    /*
     * Function to destroy the class and reinitializa its variables
     */
    destroy: function(){
		document.stopObserving('EWS:kmAuthModeChanged',this.onRebuildApplicationBinding);
		if(this.helpDiv){
            this.helpDiv.remove();
		}
        this.helpDiv = null;
        instanceHelp = null;
    }

});
    //Assign event to help button
    instanceHelp = null
    $('help_button').observe('click', function() {
		args = {helpType: 'app'}
        if (!instanceHelp){
            instanceHelp = global.usettingsJson.EWS.o_99ekm =='X' ? new Help(args) : new Help2_04();
            instanceHelp.getHelp();
        }
        else{
            instanceHelp.destroy();
        }
    } .bind(this));
	
	document.observe("EWS:helpOnWidget",function(evt){
		var args = getArgs(evt);
		args.helpType = 'widget';
		if($('helpDiv')){
			$('helpDiv').remove();
			instanceHelp = null;
		}
		if (!instanceHelp){
            instanceHelp = new Help(args);
			instanceHelp.getHelp();
			instanceHelp = null;
        }else{
			instanceHelp = null;
		}
	}.bind(this));
	
	document.observe("EWS:helpOnField",function(evt){
		var args = getArgs(evt);
		args.helpType = 'field';
		if($('helpDiv')){
			$('helpDiv').remove();
			instanceHelp = null;
		}
        if (!instanceHelp){
			instanceHelp = new Help(args);
            instanceHelp.getHelp();
			instanceHelp = null;
        }else{
			instanceHelp = null;
		}
	}.bind(this));
	