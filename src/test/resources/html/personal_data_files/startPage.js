var StartPage = Class.create(Application, {
    _sp: null,
	__dmApprover: null,	
    initialize: function ($super, options) {
        $super(options);
        if (global.usettingsJson.EWS.o_99ekm == 'X') {
            this._sp = new StartPage06(options);
        } else {
            this._sp = new StartPage04(options);
        }
    },

    run: function ($super, args) {
        $super(args);
        this._sp.run(args);
    }, 
	
	close: function($super) {
        $super();
		this._sp.close();
    }
});

var StartPage04 = Class.create(Application, {

    appSubArea: null,
	__dmApprover: null,

    initialize: function($super, options) {
        $super(options);
    },

    run: function($super, args) {
        $super(args);
        if (this.firstRun) {
            this.virtualHtml.update();
            this.getContent(this.options.mnmid, this.options.sbmid);
        }

    },

    close: function($super) {
        $super();
    },

    getContent: function(appArea, appSubArea) {

        this.makeAJAXrequest($H({ xml:
        '<EWS><SERVICE>ECM_GET_STRTPGE</SERVICE><OBJECT TYPE=""/><DEL/><GCC/><LCC/><PARAM><area_id>' + appArea + '</area_id><sub_area_id>' + appSubArea + '</sub_area_id></PARAM></EWS>'
        , successMethod: 'build',
            xmlFormat: true
        }));
    },

    build: function(xml) {

        var xmlParser = new XML.ObjTree();
        xmlParser.attr_prefix = '@';
        var json = xmlParser.parseXML(xmlToString(xml));

        var html = xmlToString(xml.getElementsByTagName('o_startpage')[0]).replace(/<(\/)?o_startpage>/g, '');
        html = html.unescapeHTML();
        var body = new Element("div", {
            id: "StartPageContainer",
            style: "width:100%;text-align:left;margin-bottom:20px;"
            //TODOD : move to css/CSS2.cs
        }).update('<h2>' + '' + '</h2>' + html);

        var anchors = body.getElementsByTagName("a");
        for (i = 0; i < anchors.length; i++) {
            anchors[i].setAttribute('url_content', anchors[i].getAttribute('href'));
            anchors[i].setAttribute('onclick', 'if(content){content.getLink(event);}');
            anchors[i].removeAttribute('href');
        }
        var imgs = body.getElementsByTagName("img");
        for (i = 0; i < imgs.length; i++) {
            imgs[i].setAttribute('src', 'km?mod=load&amp;service=getImg&amp;imgPath=' + imgs[i].getAttribute('src'));
        }

        this.virtualHtml.insert(body);
    }

});












/**
*@fileoverview StartPage.js
*@description
*/

/**
*@constructor
*@description 
*@augments Application
*/


//var content = new Content('StartPageContainer');

var StartPage06 = Class.create(Application, {

    appSubArea: null,
	contentID: null,
	reqId: null,
	__approveMode: false,
	__dmApprover: null,
	editorTools: [
					['Source'],
					['Preview'],
					['Cut', 'Copy', 'Paste', 'PasteText', 'PasteFromWord'],
					['Print', 'SpellChecker', 'Scayt'],
					['Undo', 'Redo'],
					['Find', 'Replace'],
					['SelectAll', 'RemoveFormat'],
					['Bold', 'Italic', 'Underline', 'Strike', '-', 'Subscript', 'Superscript'],
					['NumberedList', 'BulletedList', '-', 'Outdent', 'Indent', 'Blockquote'],
					['JustifyLeft', 'JustifyCenter', 'JustifyRight', 'JustifyBlock'],
					['Table', 'HorizontalRule', 'Smiley', 'SpecialChar', 'PageBreak'],
					['Format', 'Font', 'FontSize'],
					'/',
					['TextColor', 'BGColor'],
					['Maximize', 'ShowBlocks'],
					['imgUpload', 'docUpload', 'addLink']
						
				],

    initialize: function($super, options) {
        $super(options);
        this.editContentHandlerBinding = this.editContentHandler1.bindAsEventListener(this);
        this.editIndexUrlHandlerBinding = this.editIndexUrlHandler.bindAsEventListener(this);
        this.indexUrlHandlerBinding = this.indexUrlHandler.bindAsEventListener(this);

        this.nextPageHandlerBinding = this.nextPageHandler.bindAsEventListener(this);
        this.previousPageHandlerBinding = this.previousPageHandler.bindAsEventListener(this);
		
		//toolbox events
		this.downloadPDFHandlerBinding = this.downloadPDF.bindAsEventListener(this);
		this.printPageHandlerBinding = this.printPage.bindAsEventListener(this);
		this.goToFavsHandlerBinding = this.goToFavs.bindAsEventListener(this);
		this.goToSearchHandlerBinding = this.goToSearch.bindAsEventListener(this);
		this.goToSavedSearchesHandlerBinding = this.goToSavedSearches.bindAsEventListener(this);
		this.addToFavsHandlerBinding = this.addToFavs.bindAsEventListener(this);
		this.searchSimHandlerBinding = this.searchSim.bindAsEventListener(this);
		this.sendEmailHandlerBinding = this.sendEmail.bindAsEventListener(this);
		this.detailsMenuHandlerBinding = this.detailsMenu.bindAsEventListener(this);
		this.contentVariationHandlerBinding = this.contentVariation.bindAsEventListener(this);
		
		//events for authoring
		this.kmAuthModeChangedHandlerBinding = this.kmAuthModeChanged.bindAsEventListener(this);
		this.kmAuthSimulationChangedHandlerBinding = this.kmAuthSimulationChanged.bindAsEventListener(this);
		
		//RL integration
		document.observe('EWS:kmGetContentTitle', function(e) {
			var t='';
			if(this.json){
				if(this.json.EWS.o_v_content){
					t = this.ext('<TITLE>', '</TITLE>', prepareTextToEdit(this.json.EWS.o_v_content));
				}
			}
			document.fire("EWS:kmSendContentTitle", 
				{ 
					'value': t ,
					'id': this.contentID
				}
			);
        } .bindAsEventListener(this));
		
		
        document.observe('EWS:sp_it_tab_selected', function(e) {
            this.getApps(this.__tabAC.getValue().idAdded);
        } .bindAsEventListener(this));

        document.observe('EWS:sp_it_app_selected', function(e) {
            this.getViews(this.__tabAC.getValue().idAdded, this.__appAC.getValue().idAdded);
        } .bindAsEventListener(this));

        document.observe('EWS:SPImgUploaderLanguageSelected', this.languageSelected.bindAsEventListener(this));
        this.getLanguages();

        document.observe('EWS:SPImgUploaderLocationSelected', this.locationSelected.bindAsEventListener(this));
        this.getLocations();

        document.observe('EWS:SPDocUploaderCGSelected', this.CGSelected.bindAsEventListener(this));
        this.getCGs();

        
        
    },
	
	buildContentApprover: function(reqId,contentId){
		//debugger;
		global.open($H({
            app: {
                tabId: "SUBAPP",
                appId: "HELP_APP",
                view: "contentApprover"
            },
            position: "top",
			reqId: reqId,
			contentId: contentId
        }));

	},
	
	kmAuthModeChanged:function(){
		this.__editMode = global.kmAuthModeEnabled;
		this.kmAuthSwitch = true;
		this.getContent(this.options.mnmid, this.options.sbmid, this.contentID);
	},
	
	kmAuthSimulationChanged:function(){
		this.__simMode = global.kmAuthSimulationEnabled;
	},
	
	printPage:function(){window.print();},
	goToFavs:function(){global.open($H({
                app: {
                    tabId: "SEA_FAV",
                    appId: "SEA_FAV",
                    view: "Favourites"
                }
            }));},
	goToSearch:function(){global.open($H({
                app: {
                    tabId: "SEA_SEA",
                    appId: "SEA_SEA",
                    view: "Search"
                }
            }));},
	goToSavedSearches:function(){global.open($H({
                app: {
                    tabId: "SEA_SAV",
                    appId: "SEA_SAV",
                    view: "SavedSearches"
                }
            }));},
	addToFavs:function(){		
		if(!this.contentID){
			var myPopUP = new infoPopUp({closeButton: $H({
				  'callBack': function() {
					  myPopUP.close();
					  delete myPopUP; 
				  }
				}),
				htmlContent : global.getLabel('KM_NO_CONTENT_AVAILABLE'),
				indicatorIcon : 'exclamation',
				width:600
			});
			myPopUP.create();
		}else{
			this.makeAJAXrequest($H({ xml:
				' <EWS>' +
				'   <SERVICE>KM_ADD_FAVORITE</SERVICE>' +
				'   <DEL/>' +
				'   <PARAM>' +
				'       <I_V_CONTENT_ID>' + this.contentID + '</I_V_CONTENT_ID>' +
				'       </PARAM>' +
				' </EWS>',
					successMethod: 'approveOK'
			}));
		}
		
	},
	searchSim:function(){global.open($H({
                app: {
                    tabId: "SEA_SEA",
                    appId: "SEA_SEA",
                    view: "Search"
                },
                kw: this.ext('<TITLE>', '</TITLE>', prepareTextToEdit(this.json.EWS.o_v_content))
            }));},
	sendEmail:function(){var recipient = '';
            var subject = window.location + "&cid=" + this.contentID;
            subject = encodeURIComponent(subject);
            var s = 'mailto:' + recipient + '?subject=' + subject;
            window.open(s);},
	detailsMenu:function(){
		if(!this.contentID){
			var myPopUP = new infoPopUp({closeButton: $H({
				  'callBack': function() {
					  myPopUP.close();
					  delete myPopUP; 
				  }
				}),
				htmlContent : global.getLabel('KM_NO_CONTENT_AVAILABLE'),
				indicatorIcon : 'exclamation',
				width:600
			});
			myPopUP.create();
		}else{
			this.getDetails();
		}
	},
	
	contentVariation:function(){		
		if(!this.contentID){
			var myPopUP = new infoPopUp({closeButton: $H({
				  'callBack': function() {
					  myPopUP.close();
					  delete myPopUP; 
				  }
				}),
				htmlContent : global.getLabel('KM_NO_CONTENT_AVAILABLE'),
				indicatorIcon : 'exclamation',
				width:600
			});
			myPopUP.create();
		}else{
			var xmlin =
			'<EWS>' +
				'<SERVICE>KM_CPY_CONT_ID</SERVICE>' +
				//'<DEL/>' +
				'<PARAM>' +
					'<I_V_CONTENT_ID>' + this.contentID + '</I_V_CONTENT_ID>' +
				'</PARAM>' +
			'</EWS>';
			this.makeAJAXrequest($H({ 
				xml:xmlin,
				successMethod: 'checkOutCV'
			}));
		}
	},
	
	checkOutCV:function(json){
		this.makeAJAXrequest($H({ xml:
		'<EWS>' +
			'<SERVICE>KM_CHK_OU_WEB2</SERVICE>' +
			'<OBJECT TYPE=""/>' +
			'<DEL/><GCC/><LCC/>' +
			'<PARAM>' +
				'<I_V_CONT_ID>' + json.EWS.o_v_content_id + '</I_V_CONT_ID>' +
			'</PARAM>' +
		 '</EWS>',
        successMethod: 'createContentVariation'
    }));
	},
	
	createContentVariation:function(json){
		//alert('createContentVariation : '+json.EWS.o_v_new_cont_id);
				
		global.open($H({
			app: {
				tabId: global.currentApplication.tabId,
				appId: global.currentApplication.appId,
				view: global.currentApplication.view
			},
			createContent: true,
			contentID: json.EWS.o_v_new_cont_id
		}));
	},
	
	downloadPDF: function(){
		if(!this.contentID){
			var myPopUP = new infoPopUp({closeButton: $H({
				  'callBack': function() {
					  myPopUP.close();
					  delete myPopUP; 
				  }
				}),
				htmlContent : global.getLabel('KM_NO_CONTENT_AVAILABLE'),
				indicatorIcon : 'exclamation',
				width:600
			});
			myPopUP.create();
		}else{
            var xmlin =
			'<EWS>' +
				'<SERVICE>KM_GET_PDF</SERVICE>' +
				'<DEL/>' +
				'<PARAM>' +
					'<I_V_CONT_ID>' + this.contentID + '</I_V_CONT_ID>' +
				'</PARAM>' +
			'</EWS>';
			window.open(this.buildURL(xmlin), '', 'width=300,height=300,resizable=yes,scrollbars=yes,toolbar=no,location=no');
		}
	},

    getDetails: function() {
        var xmlSt =
		'<EWS>' +
		'	<SERVICE>KM_GET_METADAT2</SERVICE>' +
		'	<PARAM>' +
        '		<I_V_CONTENT_ID>'+this.contentID+'</I_V_CONTENT_ID>'+
		'	</PARAM>' +
		'</EWS>';

        this.makeAJAXrequest($H({
            xml: xmlSt,
            successMethod: 'showDetails'
        }));
    },

    showDetails: function(json) {
        var container = new Element('div', { 'class': 'km_metadata_container' });
        var items = objectToArray(json.EWS.o_i_metadata.yglui_str_ecm_km_metadatav2);
        
		var metadat = ['CONTENT_ID',
		'CONT_DEF_ID',
		'GCC','LCC','MOLGA','CONT_NAME',
		'CONT_SUMMARY','CONT_FILE_NAME','CDATE','CTIME',
		'UDATE','UTIME','OWNER','APPROVER_GRP',
		'CTYPE','CGROUP','STATUS','VERSION','IS_TEMPLATE','LOCKED_BY',
		'LANGUAGE','ACCESS_BY_EXTERNAL','IS_WEB_CONTENT','SUMMARY',
		'C_START_PAGE'
		];
        var metadatLabel = [global.getLabel('KM_CONTENT_ID'),
		global.getLabel('CONT_DEF_ID'),
		global.getLabel('GCC'),
		global.getLabel('LCC'),
		global.getLabel('MOLGA'),
		global.getLabel('KM_NAME'),
		global.getLabel('KM_SUMMARY'),
		global.getLabel('KM_FILE_NAME'),
		global.getLabel('KM_CREATION_DATE'),
		global.getLabel('CTIME'),
		global.getLabel('KM_MODIFICATION_DATE'),
		global.getLabel('UTIME'),
		global.getLabel('KM_OWNER'),
		global.getLabel('APPROVER_GRP'),
		global.getLabel('KM_FILE_TYPE'),
		global.getLabel('CGROUP'),
		global.getLabel('STATUS'),
		global.getLabel('KM_VERSION'),
		global.getLabel('KM_IS_A_TEMPLATE'),
		global.getLabel('LOCKED_BY'),
		global.getLabel('KM_LANGUAGE'),
		global.getLabel('ACCESS_BY_EXTERNAL'),
		global.getLabel('IS_WEB_CONTENT'),
		global.getLabel('SUMMARY'),
		global.getLabel('C_START_PAGE')
		];
		
		var s = '<table>';
        items.each(function(item) {
			var field = item['@field_name'];
			var idx = metadat.indexOf(field);
            s += '<tr><td><div class="gcm_fieldLabel gcm_displayMode">' + metadatLabel[idx] + '</div></td><td>' + item.values.yglui_str_ecm_km_meta_valv2['@value'] + '</td></tr>';
        } .bind(this));
        s += '</table>';
        container.insert(s);
        var popUp = new infoPopUp({
            closeButton: $H({
                'callBack': function() {
                    popUp.close();
                    delete popUp;
                }
            }),
            htmlContent: container,
            indicatorIcon: 'information',
            width: 500
        });
        popUp.create();
    },

    languageSelected: function(evt) {
        this.editor.selectedLanguage = evt.memo.idAdded || '';
    },

    locationSelected: function(evt) {
        global.kmSPSelectedLocation = evt.memo.idAdded || '';
    },

    CGSelected: function(evt) {
        global.kmSPSelectedCG = evt.memo.idAdded || '';
    },

    getLanguages: function() {
        this.makeAJAXrequest($H({ xml:
            ' <EWS>' +
            '    <SERVICE>MAINT_LANG</SERVICE>' +
			'    <PARAM>' +
			'    	<o_action>V</o_action>' +
			'    </PARAM>' +
            ' </EWS>',
            successMethod: 'buildLanguages'
        }));
    },

    getLocations: function() {
        this.makeAJAXrequest($H({ xml:
            ' <EWS>' +
            '    <SERVICE>GET_COUNTRY</SERVICE>' +
            ' </EWS>',
            successMethod: 'buildLocations'
        }));
    },

    getCGs: function() {
        this.makeAJAXrequest($H({ xml:
            ' <EWS>' +
            '    <SERVICE>KM_GET_TYPES</SERVICE>' +
            ' </EWS>',
            successMethod: 'buildCGs'
        }));
    },

    buildLanguages: function(json) {
        var jsonAC = {
            autocompleter: {
                object: [],
                multilanguage: {
                    no_results: global.getLabel('DML_NO_RESULTS'),
                    search: global.getLabel('DM_SEARCH')
                }
            }
        };

        var items = objectToArray(json.EWS.labels.item);
        items.each(function(item) {

            jsonAC.autocompleter.object.push({ data: item['@id'], text: item['@value'] });

        } .bind(this));

        this.languages = jsonAC;
    },

    buildLocations: function(json) {
        var jsonAC = {
            autocompleter: {
                object: [],
                multilanguage: {
                    no_results: global.getLabel('DML_NO_RESULTS'),
                    search: global.getLabel('DM_SEARCH')
                }
            }
        };

        var items = objectToArray(json.EWS.o_country.yglui_tab_country);
        items.each(function(item) {

            jsonAC.autocompleter.object.push({ data: item['@country_code'], text: item['@country_text'] });

        } .bind(this));

        this.locations = jsonAC;
    },

    buildCGs: function(json) {
        var jsonAC = {
            autocompleter: {
                object: [],
                multilanguage: {
                    no_results: global.getLabel('DML_NO_RESULTS'),
                    search: global.getLabel('DM_SEARCH')
                }
            }
        };

        var items = objectToArray(json.EWS.o_i_types.yglui_str_ecm_km_templates);
        items.each(function(item) {
            jsonAC.autocompleter.object.push({ data: item['@templates_type_id'].replace(/^0{0,11}/, ""), text: item['@name'] });
        } .bind(this));

        this.cgs = jsonAC;
    },


    run: function($super, args) {
        $super(args);
		this.__dmApprover = (global.usettingsJson.EWS.o_99eap == 'X')? true : false;

		if(args){
			if(args.get('comingFrom')=='inbox'){
				this.__approveMode=true;
				this.reqId=args.get('req_id');
			}
		}
		
		document.observe('EWS:kmAuthSimulationChanged', this.kmAuthSimulationChangedHandlerBinding);
        document.observe('EWS:kmAuthModeChanged', this.kmAuthModeChangedHandlerBinding);
        document.observe('EWS:PRINT_PAGE', this.printPageHandlerBinding);
        document.observe('EWS:GO_TO_FAVORITES', this.goToFavsHandlerBinding);
        document.observe('EWS:SCR_RC_SEARCH', this.goToSearchHandlerBinding);
        document.observe('EWS:GO_TO_SAVE_SEARCH', this.goToSavedSearchesHandlerBinding);
        document.observe('EWS:ADD_TO_FAVORITES', this.addToFavsHandlerBinding);
        document.observe('EWS:SEARCH_SIMILAR_PAGES', this.searchSimHandlerBinding);
        document.observe('EWS:SEND_VIA_EMAIL', this.sendEmailHandlerBinding);
        document.observe('EWS:DETAILS', this.detailsMenuHandlerBinding);
		document.observe('EWS:DOWNLOAD_PDF', this.downloadPDFHandlerBinding);
		document.observe('EWS:ADD_CONT_VAR', this.contentVariationHandlerBinding);
		//debugger;
		if (args) {
            this.createContent = args.get("createContent");
            if(!this.__approveMode){
				this.contentID = args.get("contentID");
			}
			this.isHelp=false;
        }
		
		if(this.isHelp){
			this.getHelp();
			return;
		}
		
		if (args) {
		this.searchQuery=args.get("keyword");
		}
		
        if (this.createContent && this.contentID) {
            this.__newContent = true;
            this.createContent = true;
            document.fire('EWS:kmGetMetadata', $H({ contentID: this.contentID }));
            this.fid = args.get("folderID");
			this.__editMode = true;
            this.virtualHtml.update();
            this.getContent(this.options.mnmid, this.options.sbmid, this.contentID);
        } else {
            this.__newContent = false;
            var authBar = new AuthBar();
            this.__editMode = global.kmAuthModeEnabled;
            this.virtualHtml.update();

            var hash = window.location.hash;
            hash = hash.sub('#', '');
            hash = hash.toQueryParams();
            if (hash.cid) {
                this.contentID = hash.cid;
                alert('open content : ' + this.contentID);
            }
            this.getContent(this.options.mnmid, this.options.sbmid, this.contentID);
        }
				
    },
	
	
	
    getHelp: function() {
		var isAuthoringOn='';
		if(global.kmAuthModeEnabled){
			isAuthoringOn='X';
			this.__editMode = global.kmAuthModeEnabled;
		}
		var isSimulationOn='';
		if(global.kmAuthSimulationEnabled){
			isSimulationOn='X';
		}
		this.makeAJAXrequest($H({ xml:
        '<EWS>'+
		'<SERVICE>KM_GET_CONT_WB3</SERVICE>'+
		'<PARAM>'+
		'<i_v_is_authoring>'+isAuthoringOn+'</i_v_is_authoring>'+
		'<i_v_simulation_on>'+isSimulationOn+'</i_v_simulation_on>'+
		'<i_v_tabid>' + global.currentApplication.tabId + '</i_v_tabid>'+
		'<i_v_appid>' + global.currentApplication.appId + '</i_v_appid>'+
		'<i_v_viewid>'+global.currentApplication.view+'</i_v_viewid>'+
		'<i_v_step></i_v_step>'+
		'</PARAM>'+
		'</EWS>'
        , successMethod: 'build',
            xmlFormat: false
        }));
    },

	
	
	
    close: function($super) {
        $super();
		
		if (!Object.isEmpty(global.currentSubApplication)){
			global.closeSubApplication();
			this.contentID = null;
			this.__approveMode = false;
		}
		//events for authoring
		document.stopObserving('EWS:kmAuthSimulationChanged');
        document.stopObserving('EWS:kmAuthModeChanged');

		
		// events for toolbox
        document.stopObserving('EWS:PRINT_PAGE');
        document.stopObserving('EWS:GO_TO_FAVORITES');
        document.stopObserving('EWS:SCR_RC_SEARCH');
        document.stopObserving('EWS:GO_TO_SAVE_SEARCH');
        document.stopObserving('EWS:ADD_TO_FAVORITES');
        document.stopObserving('EWS:SEARCH_SIMILAR_PAGES');
        document.stopObserving('EWS:SEND_VIA_EMAIL');
        document.stopObserving('EWS:DETAILS');
		document.stopObserving('EWS:DOWNLOAD_PDF');
		document.stopObserving('EWS:ADD_CONT_VAR');
    },



    createContentDispatcher: function() {

        if (this.template == 'Standard Web Content Template') {
            //this.createStandardTemplate();
            alert('create standard template');
        }
    },


    createStandardTemplate: function() {
        this.virtualHtml.update('');
        var body = new Element("div", {
            'class': "startPageContainer"
        });
        body.insert(this.buildButtons());
        body.insert('<br/><br/><br/>');
        var titleLabel = new Element("div").update(global.getLabel('KM_TITLE'));
        var titleInput = new Element("input", { 'type': 'text', 'size': '50' });
        var contentLabel = new Element("div").update(global.getLabel('KM_BODY_TEXT') + ' : ');
        var contentTextarea = new Element("textarea", {
            id: "StartPageEditor",
            name: "StartPageEditor"
        });
        body.insert(titleLabel);
        body.insert('<br/>');
        body.insert(titleInput);
        body.insert('<br/><br/>');
        body.insert(contentLabel);
        body.insert('<br/>');
        body.insert(contentTextarea);
        this.virtualHtml.insert(body);
		this.ShowSavePopUp = true;
		var ed = CKEDITOR.replace(contentTextarea,
		{
			toolbar: this.editorTools,
			resize_enabled: false,
			uiColor: '#dcd2ce'
		});
		ed.languages = this.languages;
		ed.locations = this.locations;
		ed.cgs = this.cgs;
		ed.buildURL=this.buildURL.bind(this);

    },

    editContentHandler: function(evt) {
        if (this.template == 'STANDARD') {
            this.editNormalContent();
        }
        if (this.template == 'FAQ') {
            body = this.editFaqContent();
        }
        if (this.template == 'INDEX') {
            body = this.editIndexContent();
        }
        if (this.template == 'REDIRECT') {
            body = this.editRedirectContent();
        }
		
		document.fire('EWS:kmContentSelected', {
		   cids: [this.contentID],
		   isChecked: true,
		   editMode:true
		});
		
    },


    //edit content from SP
    editContentHandler1: function(evt) {
        //check out first, if ok open editor, take the id of output of checkout service
        //wud u like to save changes? in all cases
		
		if(this.isHelp){
			this.close();
			this.popUpApplication.close();
            delete this.popUpApplication;
			global.open($H({
				app: {
					tabId: "CW_SPAG",
					appId: "CW_SPAG",
					view: "StartPage"
				},
				createContent:true,
				contentID: this.contentID
			}));
			return;
		}
		
		
		var doCO=parseInt(this.json.EWS.o_v_lock_by);
		if(!doCO){
			this.makeAJAXrequest($H({ xml:
				'<EWS>' +
					'<SERVICE>KM_CHK_OU_WEB2</SERVICE>' +
					'<OBJECT TYPE=""/>' +
					'<DEL/><GCC/><LCC/>' +
					'<PARAM>' +
						'<I_V_CONT_ID>' + this.contentID + '</I_V_CONT_ID>' +
					'</PARAM>' +
				 '</EWS>',
				successMethod: 'editContentHandlerCO'
			}));
		}else{
			this.editContentHandler();
		}

    },

    editContentHandlerCO: function(json) {
        //alert('editContentHandlerCO : '+json.EWS.o_v_new_cont_id);
        this.contentID = json.EWS.o_v_new_cont_id;
        this.editContentHandler();
    },

    //normal content
    editNormalContent: function() {
        var t = this.ext('<TITLE>', '</TITLE>', prepareTextToEdit(this.json.EWS.o_v_content));
        var b = this.ext('<BODY>', '</BODY>', prepareTextToEdit(this.json.EWS.o_v_content));

        var body = this.virtualHtml.down('div.startPageContainer');
        body.update();
        body.insert(this.buildButtons());

        body.insert('<br/><br/><br/>');
        var titleLabel = new Element("div").update(global.getLabel('KM_TITLE') + ' : ');
        var titleInput = new Element("input", { 'type': 'text', 'size': '50' });
        titleInput.setAttribute('value', t);


        var contentLabel = new Element("div").update(global.getLabel('KM_BODY_TEXT') + ' : ');
        var contentTextarea = new Element("textarea"/*, {
            id: "StartPageEditor",
			name: "StartPageEditor"
		}*/);

        //html = b.unescapeHTML();
        


        body.insert(titleLabel);
        body.insert('<br/>');
        body.insert(titleInput);
        body.insert('<br/><br/>');
        body.insert(contentLabel);
        body.insert('<br/>');
        body.insert(contentTextarea);
		contentTextarea.value = b.stripScripts();
		this.ShowSavePopUp = true;
		this.normalContentEditor= CKEDITOR.replace(contentTextarea,
		{
			toolbar: this.editorTools,
			resize_enabled: false,
			uiColor: '#dcd2ce'
		});
		this.normalContentEditor.languages = this.languages;
		this.normalContentEditor.locations = this.locations;
		this.normalContentEditor.cgs = this.cgs;
		this.normalContentEditor.buildURL=this.buildURL.bind(this);

    },

    normalContentTemplateRead: function() {
        var t = this.ext('<TITLE>', '</TITLE>', prepareTextToEdit(this.json.EWS.o_v_content));
        var b = this.ext('<BODY>', '</BODY>', prepareTextToEdit(this.json.EWS.o_v_content));
        var body = new Element("div", {
            'class': 'startPageContainer'
        });
        var title = new Element("div", {
            'class': 'application_main_title'
        }).update('<div style="float:left;">' + prepareTextToShow(t.escapeHTML()) + '</div>');
        var pencil = new Element("div", {
            'class': 'application_editSelection2 startPagePencil'
        });
        pencil.observe('click', this.editContentHandlerBinding);
        title.insert(pencil);

		var lock = new Element("div", {
            'class': 'application_lock startPageLock',
			'title': global.getLabel('KM_CONTENT_LOCKED_USER')+': ' + this.lockedbyUser		
        });
        title.insert(lock);
		
        if (!this.__editMode || this.locked) {
			pencil.hide();
        }
		
		if(!this.locked){
			lock.hide();
		}
		
        html = b.stripScripts();
        var content = new Element("div", {
            'class': 'startPageContent'
        }).update(html);
        body.insert(title);
        body.insert(content);
        return body;
    },



    //faq content
    faqArray: function(str) {
        var arr = str.split('</QA>');
        var result = {};
        var q;
        var a;
        for (var i = 0; i < arr.length; i++) {
            if (arr[i]) {
                q = this.ext('<QUESTION>', '</QUESTION>', arr[i]);
                a = this.ext('<ANSWER>', '</ANSWER>', arr[i]);
                result[q] = a;
            }
        }
        return result;
    },

    faqContentTemplateRead: function() {
        var t = this.ext('<TITLE>', '</TITLE>', prepareTextToEdit(this.json.EWS.o_v_content));
        var b = this.ext('<BODY>', '</BODY>', prepareTextToEdit(this.json.EWS.o_v_content));
        this.faqArr = this.faqArray(b);

        var body = new Element("div", {
            'class': 'startPageContainer'
        });
        var title = new Element("div", {
            'class': 'application_main_title'
        }).update('<div style="float:left;">' + prepareTextToShow(t.escapeHTML()) + '</div>');
        var pencil = new Element("div", {
            'class': 'application_editSelection2 startPagePencil'
        });
        pencil.observe('click', this.editContentHandlerBinding);
        title.insert(pencil);
		
        if (!this.__editMode || this.locked) {
            pencil.hide();
        }
		var lock = new Element("div", {
            'class': 'application_lock startPageLock',
			'title': global.getLabel('KM_CONTENT_LOCKED_USER')+': ' + this.lockedbyUser
        });
        title.insert(lock);
		if(!this.locked){
			lock.hide();
		}
        var content = new Element("div", {
            'class': 'startPageContent'
        });

        var qArea = new Element("div", {
            'class': 'startPageQArea'
        });

        var aArea = new Element("div", {
            'class': 'startPageAArea'
        });

        var qq, q, a;
        var j = 0;

        for (var i in this.faqArr) {
            qq = new Element("div", {
                id: j,
                'class': 'application_action_link startPageQUp'
            }).update(prepareTextToShow(i.escapeHTML()));

            qq.observe('click', function(evt) {
                var elt = evt.element();
                var id = 'startPageQ' + elt.id;
                new Effect.ScrollTo($(id));
            } .bindAsEventListener(this));
            q = new Element("div", {
                id: 'startPageQ' + j,
                'class': 'startPageQDown'
            }).update(prepareTextToShow(i.escapeHTML()));
            a = new Element("div", {
                'class': 'startPageAnswer'
            }).update(this.faqArr[i].stripScripts());
            qArea.insert(qq);
            aArea.insert(q);
            aArea.insert(a);
            j++;
        }

        content.insert(qArea);
        content.insert(aArea);
        body.insert(title);
        body.insert(content);
        return body;

    },


    editFaqContent: function() {
        var t = this.ext('<TITLE>', '</TITLE>', prepareTextToEdit(this.json.EWS.o_v_content));
        var b = this.ext('<BODY>', '</BODY>', prepareTextToEdit(this.json.EWS.o_v_content));
		
        var body = this.virtualHtml.down('div.startPageContainer');
        body.update();
        body.insert(this.buildButtons());

        body.insert('<br/><br/><br/>');
        var titleLabel = new Element("div").update(global.getLabel('KM_TITLE') + ' : ');
        var titleInput = new Element("input", { 'type': 'text', 'size': '50' });
        titleInput.setAttribute('value', t);


        var faqEditArea = new Element("div", {
            id: 'faqEditArea',
            'class': 'faqEditArea'
        });

        var j = 0;
        for (var i in this.faqArr) {
            var faqEdit = new Element("div", {
                'class': 'faqEdit',
                'faq_index': j
            });
            var faqRemoveLink = new Element("div", {
                'class': 'faqRemoveLink application_action_link'
            }).update(global.getLabel('KM_REMOVE'));
            faqRemoveLink.observe('click', function(evt) {
                var elt = evt.element();
                elt.up().remove();
                var index = parseInt(elt.up().readAttribute('faq_index'));
                this.faqEditors.splice(index, 1);
            } .bindAsEventListener(this));
            var faqQuestion = new Element("input", {
                'type': 'text',
                'size': '50',
                'class': 'faqQuestion'
            });
            faqQuestion.setAttribute('value', i);

            var faqAnswer = new Element("textarea", {
                'class': 'faqAnswer'
            });

            faqEdit.insert(faqRemoveLink);
            faqEdit.insert(faqQuestion);
            faqEdit.insert(faqAnswer);
			faqAnswer.value = this.faqArr[i].stripScripts();/*.unescapeHTML()*/
            faqEditArea.insert(faqEdit);
            j++;
        }


        var moreFaqLink = new Element("div", {
            id: 'moreFaqLink',
            'class': 'moreFaqLink application_action_link'
        }).update(global.getLabel('KM_ADD_MORE'));

        moreFaqLink.observe('click', function(evt) {

            var faqEdit = new Element("div", {
                'class': 'faqEdit'
            });
            var faqRemoveLink = new Element("div", {
                'class': 'faqRemoveLink application_action_link'
            }).update(global.getLabel('KM_REMOVE'));
            faqRemoveLink.observe('click', function(evt) {
                var elt = evt.element();
                elt.up().remove();
                var index = parseInt(elt.up().readAttribute('faq_index'));
                this.faqEditors.splice(index, 1);
            } .bindAsEventListener(this));
            var faqQuestion = new Element("input", {
                'type': 'text',
                'size': '50',
                'class': 'faqQuestion'
            });
            var faqAnswer = new Element("textarea", {
                'class': 'faqAnswer'
            });
            faqEdit.insert(faqRemoveLink);
            faqEdit.insert(faqQuestion);
            faqEdit.insert(faqAnswer);
            $('faqEditArea').insert(faqEdit);
            
			this.ShowSavePopUp = true;
			var ed = CKEDITOR.replace(faqAnswer,
			{
			    toolbar: this.editorTools,
			    resize_enabled: false,
			    uiColor: '#dcd2ce'
			});
			ed.languages = this.languages;
			ed.locations = this.locations;
			ed.cgs = this.cgs;
			ed.buildURL=this.buildURL.bind(this);
			this.faqEditors.push(ed);
        } .bindAsEventListener(this));

        body.insert(titleLabel);
        body.insert('<br/>');
        body.insert(titleInput);
        body.insert('<br/><br/>');
        body.insert(faqEditArea);
        body.insert(moreFaqLink);

        this.faqEditors = new Array();

        $$('textarea.faqAnswer').each(function(txt) {
			var ed = CKEDITOR.replace(txt,
			{
			    toolbar: this.editorTools,
			    resize_enabled: false,
			    uiColor: '#dcd2ce'
			});
			ed.languages = this.languages;
			ed.locations = this.locations;
			ed.cgs = this.cgs;
			ed.buildURL=this.buildURL.bind(this);
			this.faqEditors.push(ed);
        } .bind(this));

    },


    //index content

    indexArray: function(str) {
        var arr = str.split('</LINK>');
        var result = {};
        var url;
        var desc;
        for (var i = 0; i < arr.length; i++) {
            if (arr[i]) {
                url = this.ext('<URL>', '</URL>', arr[i]);
                desc = this.ext('<DESCRIPTION>', '</DESCRIPTION>', arr[i]);
                result[url] = desc;
            }
        }
        return result;
    },

    editIndexUrlHandler: function(evt) {
        var elt = evt.element();
        var toUpdate = elt.previous();
        var browser;
        var type;
        var h = function(evt) {
            var elt = evt.element();
            type = elt.readAttribute('i');
            $$('div.sp_url_content').each(function(item) {
                item.hide();
            });
            elt.up().down('div.sp_url_content').show();
        } .bindAsEventListener(this);



        var cbf = function() {
            var CB = Class.create(ContentBrowser, {
                initialize: function($super, options) {
                    $super(options);
                },
                run: function($super, args) {
                    $super(args);
                },
                close: function($super) {
                    $super();
                }
            });

            browser = new CB({
                className: 'ContentBrowser2',
                appId: 'KM_BRWSR',
                multiSelect: false
            });

            browser.virtualHtml = $('sp_cb_container');
            browser.run();

        };


        var container = new Element("div", {
            'class': 'startPageIndexUrlEditContainer'
        });

        var appLink = new Element("div", {
            'class': 'sp_url'
        });
        var appLinkRadio = new Element("input", {
            'type': 'radio',
            'name': 'sp_url_type',
            'class': 'sp_url_radio',
            'i': '1'
        });
        appLinkRadio.observe('click', h);
        var appLinkRadioLabel = new Element("div", {
            'class': 'sp_url_radio_l'
        }).update(global.getLabel('KM_APPLICATION_LINK'));
        var appLinkContent = new Element("div", {
            'class': 'sp_url_content'
        });


        var appInput =
		'<table cellpadding="0">' +
			'<tr>' +
				'<td>Tab ID : </td>' +
				'<td><div id="sp_tabids"></div></td>' +
				'<td>App ID : </td>' +
				'<td><div id="sp_appids"></div></td>' +
				'<td>ViewType : </td>' +
				'<td><div id="sp_viewids"></div></td>' +
				'<td>Step : </td>' +
				'<td><input id="sp_step" size="16" type="text"/></td>' +
			'</tr>' +
		'</table>';

        appLinkContent.insert(appInput);
        appLink.insert(appLinkRadio);
        appLink.insert(appLinkRadioLabel);
        appLink.insert(appLinkContent.hide());

        var externalLink = new Element("div", {
            'class': 'sp_url'
        });
        var externalLinkRadio = new Element("input", {
            'type': 'radio',
            'name': 'sp_url_type',
            'class': 'sp_url_radio',
            'i': '2'
        });
        externalLinkRadio.observe('click', h);
        var externalLinkRadioLabel = new Element("div", {
            'class': 'sp_url_radio_l'
        }).update(global.getLabel('KM_EXTERNAL_LINK'));
        var externalLinkContent = new Element("div", {
            'class': 'sp_url_content'
        });
        var externalInput = new Element("input", {
            'type': 'text',
            'style': 'width:78%',
            id: 'sp_ext_input'
        });

		externalLinkContent.insert('<select type="text" style="width:19%" id="sp_ext_select"><option value="http://">http://</option><option value="https://">https://</option><option value="ftp://">ftp://</option><option value="sftp://">sftp://</option><option value="mailto://">mailto://</option><option value="file://">file://</option><option value="dav://">dav://</option><option value="news://">news://</option><option value="nntp://">nntp://</option><option value="rtsp://">rtsp://</option><option value="xmpp://">xmpp://</option><option value="callto://">callto://</option><option value="skype://">skype://</option><option value="aim://">aim://</option><option value="gtalk://">gtalk://</option><option value="irc://">irc://</option><option value="ircs://">ircs://</option><option value="itms://">itms://</option><option value="notes://">notes://</option><option value="ymsgr://">ymsgr://</option><option value="tel://">tel://</option></select>');
        externalLinkContent.insert(externalInput);
        externalLink.insert(externalLinkRadio);
        externalLink.insert(externalLinkRadioLabel);
        externalLink.insert(externalLinkContent.hide());

        var internalLink = new Element("div", {
            'class': 'sp_url'
        });
        var internalLinkRadio = new Element("input", {
            'type': 'radio',
            'name': 'sp_url_type',
            'class': 'sp_url_radio',
            'i': '3'
        });
        internalLinkRadio.observe('click', h);
        var internalLinkRadioLabel = new Element("div", {
            'class': 'sp_url_radio_l'
        }).update(global.getLabel('KM_INTERNAL_LINK'));
        var internalLinkContent = new Element("div", {
            'class': 'sp_url_content'
        });
        internalLinkContent.insert('<div>' + global.getLabel('KM_SELECTED_CONTENT') + ':</div><div id="sp_cb_selected"></div>');
        internalLinkContent.insert('<div id="sp_cb_container"></div>');
        internalLink.insert(internalLinkRadio);
        internalLink.insert(internalLinkRadioLabel);
        internalLink.insert(internalLinkContent.hide());



        //build ok button

        var okButtonHandler = function() {
            var v = '';
            if (type == '1') {
                v = this.__tabAC.element.value;
                v += '/';
                v += this.__appAC.element.value;
                v += '/';
                v += this.__viewAC.element.value;
                v += ':';
                v += $('sp_step').value;
            }
            if (type == '2') {
                var sel = $('sp_ext_select');
                v = sel.options[sel.selectedIndex].value + $('sp_ext_input').value;
            }
            if (type == '3') {
                var content = browser.getSelectedContent();
                v = content.id+':'+content.isweb;
            }
            toUpdate.update(v);
            popUp.close();
            delete popUp;
        };

        var json = {
            elements: [],
            defaultButtonClassName: 'classOfMainDiv'

        };
        var okButton = {
            label: 'OK',
            idButton: 'sp_index_url_ok',
            handler: okButtonHandler.bind(this),
            type: 'button',
            standardButton: true
        };
        json.elements.push(okButton);



		var butDiv=new Element("div", {
            'style': 'width:100%;clear:both'
        });
		butDiv.update((new megaButtonDisplayer(json)).getButtons());

        container.insert(appLink);
        container.insert(externalLink);
        container.insert(internalLink);
        container.insert(butDiv);


        var popUp = new infoPopUp({
            closeButton: $H({
                'callBack': function() {
                    popUp.close();
                    delete popUp;
                }
            }),
            htmlContent: container,
            indicatorIcon: 'void',
            width: 800
        });
        popUp.create();
        cbf();
        //register events for app links

        var json, appAC, tabAC, viewAC;
        json = { autocompleter: { object: [], multilanguage: {}} };
        this.__appAC = new JSONAutocompleter('sp_appids', { events: $H({ onResultSelected: 'EWS:sp_it_app_selected' }) }, json);

        json = { autocompleter: { object: [], multilanguage: {}} };
        this.__tabAC = new JSONAutocompleter('sp_tabids', { events: $H({ onResultSelected: 'EWS:sp_it_tab_selected' }) }, json);

        json = { autocompleter: { object: [], multilanguage: {}} };
        this.__viewAC = new JSONAutocompleter('sp_viewids', {}, json);

        this.makeAJAXrequest($H({ xml:
            ' <EWS>' +
            '   <SERVICE>KM_GET_TABS</SERVICE>' +
            '   <DEL/>' +
            '   <PARAM></PARAM>' +
            ' </EWS>',
            successMethod: 'bldTabs'
        }));


    },

    getApps: function(tab) {
        this.makeAJAXrequest($H({ xml:
            ' <EWS>' +
            '   <SERVICE>KM_GET_APPS</SERVICE>' +
            '   <DEL/>' +
            '   <PARAM><I_V_TAB_ID>' + tab + '</I_V_TAB_ID></PARAM>' +
            ' </EWS>',
            successMethod: 'bldApps'
        }));
    },

    getViews: function(tab, app) {
        this.makeAJAXrequest($H({ xml:
            ' <EWS>' +
            '   <SERVICE>KM_GET_VIEWS</SERVICE>' +
            '   <DEL/>' +
            '   <PARAM>' +
			'		<I_V_TAB_ID>' + tab + '</I_V_TAB_ID>' +
			'		<I_V_APP_ID>' + app + '</I_V_APP_ID>' +
			'	</PARAM>' +
            ' </EWS>',
            successMethod: 'bldViews'
        }));
    },

    bldTabs: function(json) {
        var jsonAC = {
            autocompleter: {
                object: [],
                multilanguage: {
                    no_results: global.getLabel('DML_NO_RESULTS'),
                    search: global.getLabel('DM_SEARCH')
                }
            }
        };
        var items = objectToArray(json.EWS.o_i_tabids.yglui_str_tbmid);
        items.each(function(item) {
            jsonAC.autocompleter.object.push({ data: item['@tbmid'], text: item['@tbmid'] });
        } .bind(this));
        this.__tabAC.updateInput(jsonAC);
    },
    bldApps: function(json) {
        var jsonAC = {
            autocompleter: {
                object: [],
                multilanguage: {
                    no_results: global.getLabel('DML_NO_RESULTS'),
                    search: global.getLabel('DM_SEARCH')
                }
            }
        };
        var items = objectToArray(json.EWS.o_i_apps.yglui_str_ecm_appid);
        items.each(function(item) {
            jsonAC.autocompleter.object.push({ data: item['@appid'], text: item['@appid'] });
        } .bind(this));
        this.__appAC.updateInput(jsonAC);
    },
    bldViews: function(json) {
        var jsonAC = {
            autocompleter: {
                object: [],
                multilanguage: {
                    no_results: global.getLabel('DML_NO_RESULTS'),
                    search: global.getLabel('DM_SEARCH')
                }
            }
        };
        var items = objectToArray(json.EWS.o_i_views.yglui_str_ecm_views);
        items.each(function(item) {
            jsonAC.autocompleter.object.push({ data: item['@views'], text: item['@views'] });
        } .bind(this));
        this.__viewAC.updateInput(jsonAC);
    },

	
	
	buildURL: function(xmlin) {
        var url = this.url;
        while (('url' in url.toQueryParams())) {
            url = url.toQueryParams().url;
        }
        url = (Object.isEmpty(Object.values(((url).toQueryParams()))[0])) ? url + '?xml_in=' : url + '&xml_in=';

        return url + xmlin;
    },
	
	
	
	
	
    indexUrlHandler: function(evt) {
        var elt = evt.element();
        var url = elt.readAttribute('url');
        //alert('url : '+url);

        if (parseInt(url)) {
            
			var a = url.split(':');
			var ct_id = a[0];
			var is_web = a[1];
			if(is_web=="true"){
				//alert('web content : '+ct_id);
				this.contentID = ct_id;
				this.virtualHtml.update();
				this.getContent();
			}else{
				//alert('doc content : '+ct_id);
				var xmlin = ''
					+ '<EWS>'
						+ '<SERVICE>KM_GET_FILE2</SERVICE>'
						+ '<OBJECT TYPE=""/>'
						+ '<DEL/><GCC/><LCC/>'
						+ '<PARAM>'
							+ '<I_V_CONTENT_ID>' + ct_id + '</I_V_CONTENT_ID>'
						+ '</PARAM>'
					+ '</EWS>';
				window.open(this.buildURL(xmlin), '', 'width=300,height=300,resizable=yes,scrollbars=yes,toolbar=no,location=no');
                            
			}
            //this.contentID = url;
            //this.virtualHtml.update();
            //this.getContent();
        } else {
            if (url.include('://')) {
                //alert('external link');
                window.open(url);
            } else {
                //alert('app link');
                var a = url.split('/');
                var tab = a[0];
                var app = a[1];
                var b = a[2].split(':');
                var view = b[0];
                var step = b[1];
                //alert('tab : '+tab+'\napp : '+app+'\nview : '+view+'\nstep : '+step);
                global.open($H({
                    app: {
                        tabId: tab,
                        appId: app,
                        view: view
                    }
                }));
            }
        }

    },

    indexContentTemplateRead: function() {
        var t = this.ext('<TITLE>', '</TITLE>', prepareTextToEdit(this.json.EWS.o_v_content));
        var s = this.ext('<SUMMARY>', '</SUMMARY>', prepareTextToEdit(this.json.EWS.o_v_content));
        var b = this.ext('<LINKS>', '</LINKS>', prepareTextToEdit(this.json.EWS.o_v_content));
        this.indexArr = this.indexArray(b);

        var body = new Element("div", {
            'class': 'startPageContainer'
        });
        var title = new Element("div", {
            'class': 'application_main_title'
        }).update('<div style="float:left;">' + prepareTextToShow(t.escapeHTML()) + '</div>');
        var pencil = new Element("div", {
            'class': 'application_editSelection2 startPagePencil'
        });
        pencil.observe('click', this.editContentHandlerBinding);
        title.insert(pencil);
        if (!this.__editMode || this.locked) {
            pencil.hide();
        }
		var lock = new Element("div", {
            'class': 'application_lock startPageLock',
			'title': global.getLabel('KM_CONTENT_LOCKED_USER')+': ' + this.lockedbyUser
        });
        title.insert(lock);
		if(!this.locked){
			lock.hide();
		}
        var content = new Element("div", {
            'class': 'startPageContent'
        });

        //alert('s : '+s+'\ns.unescapeHTML() : '+s.unescapeHTML());

        var summary = new Element("div", {
            'class': 'startPageIndexSummary'
        }).update(s.stripScripts());
        content.insert(summary);




        var links = new Element("div", {
            'class': 'startPageLinks'
        });

        var link, url, urlLink, urlLabel, desc;
        var j = 0;

        for (var i in this.indexArr) {

            link = new Element("div", {
                'class': 'startPageLink'
            });
            url = new Element("div", {
                'class': 'startPageURL'
            });
            urlLink = new Element("div", {
                'class': 'application_action_link'
            }).update(global.getLabel('KM_EDIT_URL'));
            urlLink.observe('click', this.editIndexUrlHandlerBinding);
            urlLink.hide();
            urlLabel = new Element("div", {
        }).update(i);
        url.insert(urlLabel);
        url.insert(urlLink);

        desc = new Element("div", {
            'class': 'startPageDesc application_action_link',
            'url': i
        }).update(this.indexArr[i].stripScripts());
        desc.observe('click', this.indexUrlHandlerBinding);

        //link.insert(url);
        link.insert(desc);
        links.insert(link);
        j++;
    }

    content.insert(links);



    body.insert(title);
    body.insert(content);
    return body;

},


editIndexContent: function() {
    //alert('editIndexContent');
    var t = this.ext('<TITLE>', '</TITLE>', prepareTextToEdit(this.json.EWS.o_v_content));
    var s = this.ext('<SUMMARY>', '</SUMMARY>', prepareTextToEdit(this.json.EWS.o_v_content));
    var b = this.ext('<LINKS>', '</LINKS>', prepareTextToEdit(this.json.EWS.o_v_content));

    var body = this.virtualHtml.down('div.startPageContainer');
    body.update();
    body.insert(this.buildButtons());

    body.insert('<br/><br/><br/>');
    var titleLabel = new Element("div").update(global.getLabel('KM_TITLE') + ' : ');
    var titleInput = new Element("input", { 'type': 'text', 'size': '50' });
    titleInput.setAttribute('value', t);

    var summaryLabel = new Element("div").update(global.getLabel('KM_SUMMARY') + ' : ');
    var summaryText = new Element("textarea", { 'style': 'width:100%' });

    var indexEditArea = new Element("div", {
        id: 'indexEditArea',
        'class': 'indexEditArea'
    });

    var j = 0;
    for (var i in this.indexArr) {
        var indexEdit = new Element("div", {
            'class': 'indexEdit',
            'index_index': j
        });
        var indexRemoveLink = new Element("div", {
            'class': 'indexRemoveLink application_action_link'
        }).update(global.getLabel('KM_REMOVE'));
        indexRemoveLink.observe('click', function(evt) {
            var elt = evt.element();
            elt.up().remove();
        } .bindAsEventListener(this));

        var url = new Element("div", {
            'class': 'startPageURL'
        });
        var urlLink = new Element("div", {
            'class': 'application_action_link'
        }).update(global.getLabel('KM_EDIT_URL'));
        urlLink.observe('click', this.editIndexUrlHandlerBinding);
        var urlLabel = new Element("div", {
    }).update(i);
    url.insert(urlLabel);
    url.insert(urlLink);

    var indexDesc = new Element("textarea", {
        'class': 'indexDesc'
    }).update(this.indexArr[i].unescapeHTML());

    indexEdit.insert(indexRemoveLink);
    indexEdit.insert(url);
    indexEdit.insert(indexDesc);

    indexEditArea.insert(indexEdit);
    j++;
}


var moreIndexLink = new Element("div", {
    id: 'moreIndexLink',
    'class': 'moreIndexLink application_action_link'
}).update(global.getLabel('KM_ADD_MORE'));

moreIndexLink.observe('click', function(evt) {

    var indexEdit = new Element("div", {
        'class': 'indexEdit',
        'index_index': j
    });
    var indexRemoveLink = new Element("div", {
        'class': 'indexRemoveLink application_action_link'
    }).update(global.getLabel('KM_REMOVE'));
    indexRemoveLink.observe('click', function(evt) {
        var elt = evt.element();
        elt.up().remove();
    } .bindAsEventListener(this));

    var url = new Element("div", {
        'class': 'startPageURL'
    });
    var urlLink = new Element("div", {
        'class': 'application_action_link'
    }).update(global.getLabel('KM_EDIT_URL'));
    urlLink.observe('click', this.editIndexUrlHandlerBinding);
    var urlLabel = new Element("div", {
}).update(global.getLabel('KM_SAMPLE_URL'));
url.insert(urlLabel);
url.insert(urlLink);

var indexDesc = new Element("textarea", {
    'class': 'indexDesc'
});

indexEdit.insert(indexRemoveLink);
indexEdit.insert(url);
indexEdit.insert(indexDesc);



$('indexEditArea').insert(indexEdit);

} .bindAsEventListener(this));



body.insert(titleLabel);
body.insert('<br/>');
body.insert(titleInput);
body.insert('<br/><br/>');


body.insert(summaryLabel);
body.insert('<br/>');
body.insert(summaryText);
body.insert('<br/><br/>');

body.insert(indexEditArea);
body.insert(moreIndexLink);
summaryText.value = s.stripScripts();
this.ShowSavePopUp = true;
this.summaryIndexTemplate= CKEDITOR.replace(summaryText,
{
	toolbar: this.editorTools,
	resize_enabled: false,
	uiColor: '#dcd2ce'
});
this.summaryIndexTemplate.languages = this.languages;
this.summaryIndexTemplate.locations = this.locations;
this.summaryIndexTemplate.cgs = this.cgs;
this.summaryIndexTemplate.buildURL=this.buildURL.bind(this);


},


//redirect content
redirectContentTemplateRead: function() {

    var t = this.ext('<TITLE>', '</TITLE>', prepareTextToEdit(this.json.EWS.o_v_content));
    var url = this.ext('<URL>', '</URL>', prepareTextToEdit(this.json.EWS.o_v_content));

    var body = new Element("div", {
        'class': 'startPageContainer'
    });
    var title = new Element("div", {
        'class': 'application_main_title'
    }).update('<div style="float:left;">' + prepareTextToShow(t.escapeHTML()) + '</div>');
    var pencil = new Element("div", {
        'class': 'application_editSelection2 startPagePencil'
    });
    pencil.observe('click', this.editContentHandlerBinding);
    title.insert(pencil);
    if (!this.__editMode || this.locked) {
        pencil.hide();
    }
	var lock = new Element("div", {
		'class': 'application_lock startPageLock',
		'title': global.getLabel('KM_CONTENT_LOCKED_USER')+': ' + this.lockedbyUser
	});
	title.insert(lock);
	if(!this.locked){
		lock.hide();
	}
    var content = new Element("div", {
        'class': 'startPageContent'
    });

    var body = new Element("div", {
        'class': 'startPageContainer'
    });


    var redirect = new Element("div", {
        'class': 'startPageRedirect'
    }).update(global.getLabel('KM_YOU_VE_BEEN_REDIRECTED_TO') + " : " + prepareTextToShow(url.escapeHTML()));


    content.insert(redirect);

    //alert(url);

    body.insert(title);
    body.insert(content);

    //alert('this.createContent : '+this.createContent);
    if (!this.createContent) {

        if (parseInt(url)) {
            var a = url.split(':');
			var ct_id = a[0];
			var is_web = a[1];
			if(is_web=="true"){
				//alert('web content : '+ct_id);
				this.contentID = ct_id;
				this.virtualHtml.update();
				this.getContent();
			}else{
				//alert('doc content : '+ct_id);
				var xmlin = ''
					+ '<EWS>'
						+ '<SERVICE>KM_GET_FILE2</SERVICE>'
						+ '<OBJECT TYPE=""/>'
						+ '<DEL/><GCC/><LCC/>'
						+ '<PARAM>'
							+ '<I_V_CONTENT_ID>' + ct_id + '</I_V_CONTENT_ID>'
						+ '</PARAM>'
					+ '</EWS>';
				window.open(this.buildURL(xmlin), '', 'width=300,height=300,resizable=yes,scrollbars=yes,toolbar=no,location=no');
                            
			}
            //this.contentID = url;
            //this.virtualHtml.update();
            //this.getContent();
        } else {
            if (url.include('://')) {
                //alert('external link');
                window.open(url);
            } else {
                //alert('app link');
                var a = url.split('/');
                var tab = a[0];
                var app = a[1];
                var b = a[2].split(':');
                var view = b[0];
                var step = b[1];
                //alert('reading redirect template\ntab : '+tab+'\napp : '+app+'\nview : '+view+'\nstep : '+step);
                global.open($H({
                    app: {
                        tabId: tab,
                        appId: app,
                        view: view
                    }
                }));
            }
        }

    }
    return body;
},


editRedirectContent: function() {
	this.ShowSavePopUp = true;
    var t = this.ext('<TITLE>', '</TITLE>', prepareTextToEdit(this.json.EWS.o_v_content));
    var u = this.ext('<URL>', '</URL>', prepareTextToEdit(this.json.EWS.o_v_content));

    var body = this.virtualHtml.down('div	.startPageContainer');
    body.update();
    body.insert(this.buildButtons());

    body.insert('<br/><br/><br/>');
    var titleLabel = new Element("div").update(global.getLabel('KM_TITLE') + ' : ');
    var titleInput = new Element("input", { 'type': 'text', 'size': '50' });
    titleInput.setAttribute('value',t);

    /*
    var urlLabel = new Element("div").update(global.getLabel('KM_URL') + ' : ');
    var urlList = new Element("select", {
    'type': 'text',
    'style': 'width:19%',
    id: 'sp_ext_select'
    }).update('<option value="http://">http://</option><option value="https://">https://</option><option value="ftp://">ftp://</option>');

    var urlText = new Element("input", { 'type': 'text', 'style': 'width:80%' });

    var a = u.split('://');

    urlText.setAttribute('value', a[1]);
    */

    body.insert(titleLabel);
    body.insert('<br/>');
    body.insert(titleInput);
    body.insert('<br/><br/>');

    /*
    body.insert(urlLabel);
    body.insert('<br/>');
    body.insert(urlList);
    body.insert(urlText);
    body.insert('<br/><br/>');
    */

    var browser;


    var h = function(evt) {
        var elt = evt.element();
        this.redirectType = elt.readAttribute('i');
        $$('div.sp_url_content').each(function(item) {
            item.hide();
        });
        elt.up().down('div.sp_url_content').show();
    } .bindAsEventListener(this);

    var cbf = function(that) {
        var CB = Class.create(ContentBrowser, {
            initialize: function($super, options) {
                $super(options);
            },
            run: function($super, args) {
                $super(args);
            },
            close: function($super) {
                $super();
            }
        });

        that.redirectBrowser = new CB({
            className: 'ContentBrowser2',
            appId: 'KM_BRWSR',
            multiSelect: false
        });

        that.redirectBrowser.virtualHtml = $('sp_cb_container');
        that.redirectBrowser.run();

    };

    var container = new Element("div", {
        'class': 'startPageIndexUrlEditContainer'
    });

    var appLink = new Element("div", {
        'class': 'sp_url'
    });
    var appLinkRadio = new Element("input", {
        'type': 'radio',
        'name': 'sp_url_type',
        'class': 'sp_url_radio',
        'i': '1'
    });
    appLinkRadio.observe('click', h);
    var appLinkRadioLabel = new Element("div", {
        'class': 'sp_url_radio_l'
    }).update(global.getLabel('KM_APPLICATION_LINK'));
    var appLinkContent = new Element("div", {
        'class': 'sp_url_content'
    });

    var appInput =
		'<table cellpadding="0" width="720">' +
			'<tr>' +
				'<td>'+global.getLabel('KM_TAB_ID')+' : </td>' +
				'<td><div id="sp_tabids"></div></td>' +
				'<td>'+global.getLabel('KM_APP_ID')+' : </td>' +
				'<td><div id="sp_appids"></div></td>' +
				'<td>'+global.getLabel('KM_VIEWTYPE')+' : </td>' +
				'<td><div id="sp_viewids"></div></td>' +
				'<td>Step : </td>' +
				'<td><input id="sp_step" size="3" type="text"/></td>' +
			'</tr>' +
		'</table>';

    appLinkContent.insert(appInput);
    appLink.insert(appLinkRadio);
    appLink.insert(appLinkRadioLabel);
    appLink.insert(appLinkContent.hide());

    var externalLink = new Element("div", {
        'class': 'sp_url'
    });
    var externalLinkRadio = new Element("input", {
        'type': 'radio',
        'name': 'sp_url_type',
        'class': 'sp_url_radio',
        'i': '2'
    });
    externalLinkRadio.observe('click', h);
    var externalLinkRadioLabel = new Element("div", {
        'class': 'sp_url_radio_l'
    }).update(global.getLabel('KM_EXTERNAL_LINK'));
    var externalLinkContent = new Element("div", {
        'class': 'sp_url_content'
    });
    var externalInput = new Element("input", {
        'type': 'text',
        'style': 'width:78%',
        id: 'sp_ext_input'
    });
	/*
    var externalProtocols = new Element("select", {
        'type': 'text',
        'style': 'width:19%',
        id: 'sp_ext_select'
    }).update('<option value="http://">http://</option><option value="https://">https://</option><option value="ftp://">ftp://</option><option value="sftp://">sftp://</option><option value="mailto://">mailto://</option><option value="file://">file://</option><option value="dav://">dav://</option><option value="news://">news://</option><option value="nntp://">nntp://</option><option value="rtsp://">rtsp://</option><option value="xmpp://">xmpp://</option><option value="callto://">callto://</option><option value="skype://">skype://</option><option value="aim://">aim://</option><option value="gtalk://">gtalk://</option><option value="irc://">irc://</option><option value="ircs://">ircs://</option><option value="itms://">itms://</option><option value="notes://">notes://</option><option value="ymsgr://">ymsgr://</option><option value="tel://">tel://</option>');
    */
	externalLinkContent.insert('<select type="text" style="width:19%" id="sp_ext_select"><option value="http://">http://</option><option value="https://">https://</option><option value="ftp://">ftp://</option><option value="sftp://">sftp://</option><option value="mailto://">mailto://</option><option value="file://">file://</option><option value="dav://">dav://</option><option value="news://">news://</option><option value="nntp://">nntp://</option><option value="rtsp://">rtsp://</option><option value="xmpp://">xmpp://</option><option value="callto://">callto://</option><option value="skype://">skype://</option><option value="aim://">aim://</option><option value="gtalk://">gtalk://</option><option value="irc://">irc://</option><option value="ircs://">ircs://</option><option value="itms://">itms://</option><option value="notes://">notes://</option><option value="ymsgr://">ymsgr://</option><option value="tel://">tel://</option></select>');
	
	//externalLinkContent.insert(externalProtocols);
    externalLinkContent.insert(externalInput);
    externalLink.insert(externalLinkRadio);
    externalLink.insert(externalLinkRadioLabel);
    externalLink.insert(externalLinkContent.hide());

    var internalLink = new Element("div", {
        'class': 'sp_url'
    });
    var internalLinkRadio = new Element("input", {
        'type': 'radio',
        'name': 'sp_url_type',
        'class': 'sp_url_radio',
        'i': '3'
    });
    internalLinkRadio.observe('click', h);
    var internalLinkRadioLabel = new Element("div", {
        'class': 'sp_url_radio_l'
    }).update(global.getLabel('KM_INTERNAL_LINK'));
    var internalLinkContent = new Element("div", {
        'class': 'sp_url_content'
    });
    internalLinkContent.insert('<div>' + global.getLabel('KM_SELECTED_CONTENT') + ':</div><div id="sp_cb_selected"></div>');
    internalLinkContent.insert('<div id="sp_cb_container"></div>');
    internalLink.insert(internalLinkRadio);
    internalLink.insert(internalLinkRadioLabel);
    internalLink.insert(internalLinkContent.hide());

    container.insert(appLink);
    container.insert(externalLink);
    container.insert(internalLink);

    body.insert(container);

    cbf(this);
    //register events for app links

    var json, appAC, tabAC, viewAC;
    json = { autocompleter: { object: [], multilanguage: {}} };
    this.__appAC = new JSONAutocompleter('sp_appids', { events: $H({ onResultSelected: 'EWS:sp_it_app_selected' }) }, json);

    json = { autocompleter: { object: [], multilanguage: {}} };
    this.__tabAC = new JSONAutocompleter('sp_tabids', { events: $H({ onResultSelected: 'EWS:sp_it_tab_selected' }) }, json);

    json = { autocompleter: { object: [], multilanguage: {}} };
    this.__viewAC = new JSONAutocompleter('sp_viewids', {}, json);

    this.makeAJAXrequest($H({ xml:
            ' <EWS>' +
            '   <SERVICE>KM_GET_TABS</SERVICE>' +
            '   <DEL/>' +
            '   <PARAM></PARAM>' +
            ' </EWS>',
        successMethod: 'bldTabs'
    }));

    if (parseInt(u)) {
        //alert('content id');
        this.redirectType = '3';
        this.virtualHtml.down('div.sp_url_content', 2).show();
        this.virtualHtml.down('input.sp_url_radio', 2).checked = true;
    } else {
        if (u.include('://')) {
            //alert('external link');
            this.redirectType = '2';
            this.virtualHtml.down('div.sp_url_content', 1).show();
            this.virtualHtml.down('input.sp_url_radio', 1).checked = true;
            var a = u.split('://');
            $('sp_ext_input').value = a[1];
            for (var i = 0; i < $('sp_ext_select').length; i++) {
                if ($('sp_ext_select')[i].value == prepareTextToEdit(a[0]) + '://') {
                    $('sp_ext_select')[i].selected = true;
                    break;
                }
            }
        } else {
            this.redirectType = '1';
            this.virtualHtml.down('div.sp_url_content', 0).show();
            this.virtualHtml.down('input.sp_url_radio', 0).checked = true;
            var a = u.split('/');
            var tab = prepareTextToEdit(a[0]);
            var app = prepareTextToEdit(a[1]);
            var b = a[2].split(':');
            var view = prepareTextToEdit(b[0]);
            var step = prepareTextToEdit(b[1]);
            //alert('app link : \n'+tab+'\n'+app+'\n'+view+'\n'+step);
            $('sp_step').value = step;
            //this.__tabAC.setDefaultValue(tab);
            $('text_area_sp_tabids').value = tab;
            //this.__appAC.setDefaultValue(app);
            $('text_area_sp_appids').value = app;
            //this.__viewAC.setDefaultValue(view);
            $('text_area_sp_viewids').value = view;
        }
    }
},

// editing buttons
buildButtons: function() {

    var json = {
        elements: [],
        defaultButtonClassName: 'classOfMainDiv'

    };
    var save = {
        label: global.getLabel('KM_SAVE'),
        idButton: 'sp_b_save',
        handler: this.saveButton.bind(this),
        type: 'button',
        standardButton: true
    };
    json.elements.push(save);
    var check_out = {
        label: global.getLabel('KM_CHECK_OUT'),
        idButton: 'sp_b_check_out',
        handler: this.checkOutButton.bind(this),
        type: 'button',
        standardButton: true
    };
    json.elements.push(check_out);
    var check_in = {
        label: global.getLabel('KM_CHECK_IN'),
        idButton: 'sp_b_check_in',
        handler: this.checkInButton.bind(this),
        type: 'button',
        standardButton: true
    };
    json.elements.push(check_in);
    var approve = {
        label: (this.__dmApprover)? global.getLabel('KM_REQUEST_APPROVAL') : global.getLabel('KM_APPROVE'),
        idButton: 'sp_b_approve',
        handler: this.approveButton.bind(this),
        type: 'button',
        standardButton: true
    };
    json.elements.push(approve);

    var view = {
        label: global.getLabel('KM_VIEW'),
        idButton: 'sp_b_view',
        handler: this.viewButton.bind(this),
        type: 'button',
        standardButton: true
    };
    json.elements.push(view);

    //if (this.createContent) {
        var exit = {
            label: global.getLabel('KM_EXIT'),
            idButton: 'sp_b_exit',
            handler: this.exitButton.bind(this),
            type: 'button',
            standardButton: true
        };
        json.elements.push(exit);
    //}

    this.ButtonDisplayerExample = new megaButtonDisplayer(json);
	this.ButtonDisplayerExample.disable('sp_b_approve');
    this.ButtonDisplayerExample.disable('sp_b_check_out');
    return this.ButtonDisplayerExample.getButtons();


},

saveButton: function() {

    if (this.template == 'STANDARD') {
        var t = this.virtualHtml.down('div.startPageContainer').down('input').value;
        var b = this.normalContentEditor.getData();
        var content =
			'&lt;CONTENT&gt;' +
			'&lt;TEMPLATE&gt;' + this.template + '&lt;/TEMPLATE&gt;' +
			'&lt;TITLE&gt;' + prepareTextToSend(t) + '&lt;/TITLE&gt;' +
			'&lt;BODY&gt;' + prepareTextToSendCKeditor(b) + '&lt;/BODY&gt;' +
			'&lt;/CONTENT&gt;';
    }

    if (this.template == 'FAQ') {
        var t = this.virtualHtml.down('div.startPageContainer').down('input').value;
        var questions = new Array();
        $$('input.faqQuestion').each(function(input) {
            //this.faqEditors.push(this.createEditor(txt));
            //alert(input.value);
            questions.push(input.value);
        } .bind(this));

        var answers = new Array();

        this.faqEditors.each(function(ed) {
            //this.faqEditors.push(this.createEditor(txt));
            //alert(ed.getData().escapeHTML());
            answers.push(ed.getData());
        } .bind(this));

        var content =
			'&lt;CONTENT&gt;' +
			'&lt;TEMPLATE&gt;' + this.template + '&lt;/TEMPLATE&gt;' +
			'&lt;TITLE&gt;' + prepareTextToSend(t) + '&lt;/TITLE&gt;' +
			'&lt;BODY&gt;';

        for (var i = 0; i < answers.length; i++) {
            //alert('q : '+questions[i]+'\n a : '+answers[i]);
            content +=
				'&lt;QA&gt;' +
				'&lt;QUESTION&gt;' + prepareTextToSend(questions[i]) + '&lt;/QUESTION&gt;' +
				'&lt;ANSWER&gt;' + prepareTextToSendCKeditor(answers[i]) + '&lt;/ANSWER&gt;' +
				'&lt;/QA&gt;';
        }

        content +=
			'&lt;/BODY&gt;' +
			'&lt;/CONTENT&gt;';
        //alert(content);
    }

    if (this.template == 'INDEX') {

        var t = this.virtualHtml.down('div.startPageContainer').down('input').value;
        var s = this.summaryIndexTemplate.getData();

        var content =
			'&lt;CONTENT&gt;' +
			'&lt;TEMPLATE&gt;' + this.template + '&lt;/TEMPLATE&gt;' +
			'&lt;TITLE&gt;' + prepareTextToSend(t) + '&lt;/TITLE&gt;' +
			'&lt;SUMMARY&gt;' + prepareTextToSendCKeditor(s) + '&lt;/SUMMARY&gt;' +
			'&lt;LINKS&gt;';



        $$('div.indexEdit').each(function(div) {

            var url = div.down('div.startPageURL').down().innerHTML;
            var desc = div.down('textarea').value;
            content +=
				'&lt;LINK&gt;' +
				'	&lt;URL&gt;' + prepareTextToSend(url) + '&lt;/URL&gt;' +
				'	&lt;DESCRIPTION&gt;' + prepareTextToSend(desc) + '&lt;/DESCRIPTION&gt;' +
				'&lt;/LINK&gt;';

        } .bind(this));

        content +=
			'&lt;/LINKS&gt;' +
			'&lt;/CONTENT&gt;';
        //alert(content);
    }


    if (this.template == 'REDIRECT') {
        var t = this.virtualHtml.down('div.startPageContainer').down('input').value;



        var v = '';
        if (this.redirectType == '1') {
			//alert('save redirect app\n'+this.__tabAC.element.value);
			//alert('save redirect app\n'+this.__tabAC._selectedData.idAdded);
            
			if(this.__tabAC._selectedData){
				v += this.__tabAC._selectedData.idAdded;
			}else{
				v += this.__tabAC.element.value;
			}
			v += '/';
			if(this.__appAC._selectedData){
				v += this.__appAC._selectedData.idAdded;
			}else{
				v += this.__appAC.element.value;
			}
			v += '/';
			if(this.__viewAC._selectedData){
				v += this.__viewAC._selectedData.idAdded;
			}else{
				v += this.__viewAC.element.value;
			}
			/*
			v += this.__tabAC.element.value;
            v += '/';
            v += this.__appAC.element.value;
            v += '/';
            v += this.__viewAC.element.value;
			*/
            v += ':';
            v += $('sp_step').value;
        }
        if (this.redirectType == '2') {
            var sel = $('sp_ext_select');
            v = sel.options[sel.selectedIndex].value + $('sp_ext_input').value;
        }
        if (this.redirectType == '3') {
            var content = this.redirectBrowser.getSelectedContent();
            v = content.id+':'+content.isweb;
        }

        var content =
			'&lt;CONTENT&gt;' +
			'&lt;TEMPLATE&gt;' + this.template + '&lt;/TEMPLATE&gt;' +
			'&lt;TITLE&gt;' + prepareTextToSend(t) + '&lt;/TITLE&gt;' +
			'&lt;URL&gt;' + prepareTextToSend(v) + '&lt;/URL&gt;' +
			'&lt;/CONTENT&gt;';
    }



    this.makeAJAXrequest($H({ xml:
        '<EWS>' +
		'	<SERVICE>KM_SAVE_WEB2</SERVICE>' +
		'	<OBJ TYPE="" />' +
		'	<PARAM>' +
		'		<I_V_CONT_ID>' + this.contentID + '</I_V_CONT_ID>' +
		'		<I_V_CONTENT>' + content + '</I_V_CONTENT>' +
		'	</PARAM>' +
		'</EWS>'
        , successMethod: 'onSave',
        xmlFormat: false
    }));

},

onSave: function() {
    //alert('onSuccess');

    if (this.createContent) {
        this.createContent = false;
    }
    if (this.view) {
        this.view = false;
        //this.checkInButton();
        this.getContent();
    }
},


exitButton: function() {
    if (!this.ShowSavePopUp){
		this.closeSavePopUp();
	}
	else{
		var json = { elements: [] };
		var save = {
			label: 'Yes',
			idButton: 'idSave',
        handler: function() {
            this.saveButton();
            myPopUP.close();
            delete myPopUP;
            global.open($H({
                app: {
                    tabId: "KM_BRWSR",
                    appId: "KM_BRWSR",
                    view: "ContentBrowser"
                },
                cid: this.contentID,
                fid: this.fid
            }));
            this.createContent = false;
        } .bind(this),
			type: 'button',
			standardButton: true
		};
		var cancel = {
			label: 'No',
			idButton: 'idCancel',
			handler: function() {
				myPopUP.close();
				delete myPopUP;
				global.open($H({
					app: {
						tabId: "KM_BRWSR",
						appId: "KM_BRWSR",
						view: "ContentBrowser"
					},
					cid: this.contentID,
					fid: this.fid
				}));
				this.createContent = false;
			} .bind(this),
			type: 'button',
			standardButton: true
		};
		json.elements.push(save);
		json.elements.push(cancel);
		var buttonDisplayerExamplebutton = new megaButtonDisplayer(json);


		var container = new Element('div');
		var text = new Element('div').update(global.getLabel('KM_WOULD_LIKE_TO_SAVE_CONTENT')+'?');
		container.insert(text);
		container.insert(buttonDisplayerExamplebutton.getButtons());

		var myPopUP = new infoPopUp({ closeButton: $H({
			'callBack': function() {
				myPopUP.close();
				delete myPopUP;
			} .bind(this)
		}),
			htmlContent: container,

			indicatorIcon: 'void',
			width: 600
		});
		myPopUP.create();
	}
},

closeSavePopUp : function() {
            global.open($H({
                app: {
                    tabId: "KM_BRWSR",
                    appId: "KM_BRWSR",
                    view: "ContentBrowser"
                },
                cid: this.contentID,
                fid: this.fid
            }));
            this.createContent = false;
        },

checkOutButton: function() {
    this.makeAJAXrequest($H({ xml:
                '<EWS>' +
                    '<SERVICE>KM_CHK_OU_WEB2</SERVICE>' +
                    '<OBJECT TYPE=""/>' +
                    '<DEL/><GCC/><LCC/>' +
                    '<PARAM>' +
                        '<I_V_CONT_ID>' + this.contentID + '</I_V_CONT_ID>' +
                    '</PARAM>' +
                 '</EWS>',
        successMethod: 'checkoutOK'
    }));
},

checkInButton: function() {
    this.makeAJAXrequest($H({ xml:
                '<EWS>' +
                    '<SERVICE>KM_CHK_IN_WEB2</SERVICE>' +
                    '<OBJECT TYPE=""/>' +
                    '<DEL/><GCC/><LCC/>' +
                    '<PARAM>' +
                        '<I_V_CONT_ID>' + this.contentID + '</I_V_CONT_ID>' +
						'<I_V_CONTENT>null</I_V_CONTENT>' +
        /*'<I_V_FILE_NAME>' + fn + '</I_V_FILE_NAME>' + */
                    '</PARAM>' +
                 '</EWS>',
        successMethod: 'checkinOK'
    }));
},

approveButton: function() {

	var xmlin;
	var prnr = parseInt(global.objectId,10);
	if (this.__dmApprover){
	
		xmlin = '<EWS>' +
					'<SERVICE>SAVE_REQUEST</SERVICE>' +
					'<OBJ TYPE="P">' + prnr + '</OBJ>' +
					'<PARAM>' +
						'<APPID>KM_APRV</APPID>' +
						'<RECORDS>' +
							'<YGLUI_STR_WID_RECORD REC_KEY="' + this.contentID + '" SCREEN="1">' +
								'<CONTENTS>' +
									'<YGLUI_STR_WID_CONTENT KEY_STR="' + this.contentID + '" REC_INDEX="1" SELECTED="" TCONTENTS="">' +
										'<FIELDS>' +
											'<yglui_str_wid_field fieldid="CONTENT_ID" fieldlabel="" fieldtechname="CONTENT_ID" fieldtseqnr="000000" value="' + this.contentID + '">' +
											'</yglui_str_wid_field>' +
										'</FIELDS>' +
									'</YGLUI_STR_WID_CONTENT>' +
								'</CONTENTS>' +
							'</YGLUI_STR_WID_RECORD>' +
						'</RECORDS>' +
						'<BUTTON ACTION="KM_APRV_ACTIO" LABEL_TAG="Save" OKCODE="INS"/>' +
					'</PARAM>' +
					'<DEL/>' +
				'</EWS>';
			sMethod = 'successReqApprv';
	}else{
		xmlin = '<EWS>' +
					'<SERVICE>KM_APROVE_WEB2</SERVICE>' +
					'<OBJECT TYPE=""/>' +
					'<DEL/><GCC/><LCC/>' +
						'<PARAM>' +
							'<I_V_CONT_ID>' + this.contentID + '</I_V_CONT_ID>' +
						'</PARAM>' +
				'</EWS>';
			sMethod = 'approveOK';
	}

	this.makeAJAXrequest($H({ 
		xml:xmlin,
		successMethod: sMethod
	}));

},

	successReqApprv: function(){

        var html = '' +
        '<div style="margin-left:50px;margin-right:20px;">' +
        '   <span>' + global.getLabel('KM_REQUEST_APPRV_MESSAGE') + '</span>' +
        '</div><br/>' +
        '<div id="km_add_delete_btns"  style="text-align:center;margin-top:10px;margin-left:110px;"></div>';
        var popUp = new infoPopUp({
            closeButton: $H({
                'callBack': function() {
                    popUp.close();
                    delete popUp;
                }
            }),
            htmlContent: html,
            indicatorIcon: 'void',
            width: 420
        });
        popUp.create();

        var jn = { elements: [] };
        var ok = {
            idButton: 'km_btn_ok',
            label: global.getLabel('KM_OK'),
            type: 'button',
            handler: function(n) {
                popUp.close();
                delete popUp;
            } .bind(this, name),
            standardButton: true
        };
        jn.elements.push(ok);
        btns = new megaButtonDisplayer(jn);
        $('km_add_delete_btns').insert(btns.getButtons());
		
		this.ButtonDisplayerExample.disable('sp_b_approve');
	},

approveOK: function() {
    //alert('approveOK');
	this.ShowSavePopUp = false;
},

checkinOK: function() {
    //alert('checkinOK');
    this.ButtonDisplayerExample.disable('sp_b_check_in');
    this.ButtonDisplayerExample.disable('sp_b_save');
    this.ButtonDisplayerExample.enable('sp_b_check_out');
	this.ButtonDisplayerExample.enable('sp_b_approve');
    this.disableEditing();
	this.ShowSavePopUp = false;	
},

disableEditing: function() {
    var div = new Element('div', {
        style: 'background:url(zz);top:46px;width:100%;height:90%;position:absolute;z-index:99;'
    });
    div.update('&nbsp;');
    $$('div.startPageContainer')[0].insert({
        'top': div
    });
},

checkoutOK: function(json) {
    //alert('checkoutOK');
    this.contentID = json.EWS.o_v_new_cont_id;
    this.createContent = true;
    this.getContent();
	this.ShowSavePopUp = true;
	this.ButtonDisplayerExample.enable('sp_b_approve');
},

viewButton: function() {
    /*
    if (this.template == 'STANDARD') {        
    this.virtualHtml.down('div.startPageContainer').update(this.normalContentTemplateRead());
    }	
    if (this.template == 'FAQ') {
    this.virtualHtml.down('div.startPageContainer').update(this.faqContentTemplateRead());
    }
    if (this.template == 'INDEX') {
    this.virtualHtml.down('div.startPageContainer').update(this.indexContentTemplateRead());
    }
    if (this.template == 'REDIRECT') {
    this.virtualHtml.down('div.startPageContainer').update(this.redirectContentTemplateRead());
    }
    */
    this.view = true;

    var json = { elements: [] };
    var save = {
        label: 'Yes',
        idButton: 'idSave',
        handler: function() {
            this.saveButton();
            myPopUP.close();
            delete myPopUP;
        } .bind(this),
        type: 'button',
        standardButton: true
    };
    var cancel = {
        label: 'No',
        idButton: 'idCancel',
        handler: function() {
            this.view = false;
            this.createContent = false;
            this.getContent();
            myPopUP.close();
            delete myPopUP;
        } .bind(this),
        type: 'button',
        standardButton: true
    };
    json.elements.push(save);
    json.elements.push(cancel);
    var buttonDisplayerExamplebutton = new megaButtonDisplayer(json);


    var container = new Element('div');
    var text = new Element('div').update('Would you like to save content?');
    container.insert(text);
    container.insert(buttonDisplayerExamplebutton.getButtons());

    var myPopUP = new infoPopUp({ closeButton: $H({
        'callBack': function() {
            this.view = false;
            myPopUP.close();
            delete myPopUP;
        } .bind(this)
    }),
        htmlContent: container,

        indicatorIcon: 'void',
        width: 600
    });
    myPopUP.create();





    //this.saveButton();
},


ext: function(l, r, s) {
    //s = prepareTextToEdit(s);
	var a = s.split(l);
    var b = a[1].split(r);
    return b[0];
},

// get content and build
getContent: function(appArea, appSubArea, contentID) {
    //debugger;
	if (!this.contentID) {
        //this.contentID='4213'; // NORMAL CONTENT
        //this.contentID = '4156'; // FAQ
        //this.contentID='4193';   // Index
        //this.contentID='2840'; // REDIRECT
    }
    var xmlSt =
		'<EWS>' +
		'	<SERVICE>KM_GET_CONT_WB3</SERVICE>' +
		'	<OBJ TYPE="" />' +
		'	<PARAM>';
    if (this.__editMode || this.__newContent || this.__approveMode) {
        xmlSt += '<I_V_IS_AUTHORING>X</I_V_IS_AUTHORING>';
    }

	if (this.__simMode) {
		xmlSt += '<i_v_simulation_on>X</i_v_simulation_on>';
	}
	
	
/* 	if (this.kmAuthSwitch) {
		xmlSt += '  <I_V_SWITCH>X</I_V_SWITCH>';
	}	 */
	
	//debugger;
	if (this.kmAuthSwitch){

		if (this.contentID || this.__approveMode) {
			if(this.__approveMode==true){
				xmlSt +='<I_V_REQ_ID>' + this.reqId + '</I_V_REQ_ID>';
			}else{
				xmlSt +='<I_V_CONTENT_ID>' + this.contentID + '</I_V_CONTENT_ID>';
			}
		}
		xmlSt +=
			'		<I_V_AREA_ID>' + appArea + '</I_V_AREA_ID>' +
			'		<I_V_SUB_AREA_ID>' + appSubArea + '</I_V_SUB_AREA_ID>';
	}else{

		if (this.contentID || this.__approveMode) {
			if(this.__approveMode==true){
				xmlSt +='<I_V_REQ_ID>' + this.reqId + '</I_V_REQ_ID>';
			}else{
				xmlSt +='<I_V_CONTENT_ID>' + this.contentID + '</I_V_CONTENT_ID>';
			}
		}else {
			xmlSt +=
				'		<I_V_AREA_ID>' + appArea + '</I_V_AREA_ID>' +
				'		<I_V_SUB_AREA_ID>' + appSubArea + '</I_V_SUB_AREA_ID>';
		}
	}
    xmlSt +=
		'	</PARAM>' +
		'</EWS>';

	//debugger;
    this.makeAJAXrequest($H({ xml: xmlSt, successMethod: 'build',
        xmlFormat: false
    }));
},


previousPageHandler: function(evt) {
    var element = evt.element();
    if (this.paging) {
        if (this.page > 0) {
            this.page--;
            this.contentID = this.contentList[this.page]['@content_id'];
            this.getContent();
        }
    }
},

nextPageHandler: function(evt) {
    var element = evt.element();
    if (this.paging) {
        if (this.page < this.contentList.length - 1) {
            this.page++;
            this.contentID = this.contentList[this.page]['@content_id'];
            this.getContent();
        }
    }
},


registerLinksEvents: function(){
	var links=this.virtualHtml.select('span.sp_link');
	for(var i=0;i<links.length;i++){
		
		$(links[i]).observe('click', function(event){
			
			this.contentID=Event.element(event).readAttribute("cid");
			this.getContent();
		}.bind(this));
	}
},



build: function(json) {
	//debugger;
	this.kmAuthSwitch = false;
    if (json) {
        this.json = json;
    }

		
	if(!this.json.EWS.o_v_content){
		this.virtualHtml.update(global.getLabel('KM_NO_CONTENT_AVAILABLE'));
		return;
	}
    
    var lockedby = this.json.EWS.o_v_lock_by;
	this.lockedbyUser;
	if(this.json.EWS.o_lock_uname){
		this.lockedbyUser = this.json.EWS.o_lock_uname;
	}else{
		this.lockedbyUser = this.json.EWS.o_v_lock_by;
	}
	var lockedby = parseInt(this.json.EWS.o_v_lock_by, 10);
    if (!lockedby || (lockedby == parseInt(global.objectId,10))) {
        this.locked = false;
    } else {
        this.locked = true;
    }

    if (!this.contentID) {
        if(!this.__approveMode){
			this.contentID = json.EWS.o_i_cont_list.yglui_str_ecm_km_multi_content['@content_id'];
		}
    }


    //alert('locked : '+this.locked);
	
	if(this.json.EWS.o_i_cont_list){
		if(this.json.EWS.o_i_cont_list.yglui_str_ecm_km_multi_content){
			if(this.json.EWS.o_i_cont_list.yglui_str_ecm_km_multi_content.length){
				//alert('paging');
				this.paging = true;
				var items = objectToArray(this.json.EWS.o_i_cont_list.yglui_str_ecm_km_multi_content);
				this.contentList = items;
				this.page = 0;
				this.contentID = this.contentList[0]['@content_id'];
			}
		}
	}
	
	if(this.__approveMode){
		this.contentID = json.EWS.o_v_content_r_id;
	}
	
    this.template = this.ext('<TEMPLATE>', '</TEMPLATE>', prepareTextToEdit(this.json.EWS.o_v_content));

	//replace broken img param
	this.json.EWS.o_v_content=this.json.EWS.o_v_content.replace("&lt;/cke:PARAM&gt;", "");
	
    var body;
    if (this.template == 'STANDARD') {
        body = this.normalContentTemplateRead();
    }
    if (this.template == 'FAQ') {
        body = this.faqContentTemplateRead();
    }
    if (this.template == 'INDEX') {
        body = this.indexContentTemplateRead();
    }
    if (this.template == 'REDIRECT') {
        body = this.redirectContentTemplateRead();
    }
	
	if(this.__approveMode){
		document.fire('EWS:kmContentSelected', {
		   cids: [this.contentID],
		   isChecked: true,
		   editMode:false,
		   viewMode: true
		});
	}else{
		document.fire('EWS:kmContentSelected', {
		   cids: [this.contentID],
		   isChecked: true,
		   editMode:false
		});
	}
	
	if(this.reqId){
		this.buildContentApprover(this.reqId,this.contentID);
	}
	
    if (this.paging) {
        var paging = new Element("div", {
            id: "StartPagePaging",
            'class': "StartPagePaging"
        });
        var pagingPrevious = new Element("div", {
            id: "StartPagePagingPrevious",
            'class': "StartPagePagingPrevious application_verticalL_arrow"
        });
        var pagingNext = new Element("div", {
            id: "StartPagePagingNext",
            'class': "StartPagePagingNext application_verticalR_arrow"
        });
        pagingPrevious.observe('click', this.previousPageHandler.bindAsEventListener(this));
        pagingNext.observe('click', this.nextPageHandler.bindAsEventListener(this));
        if (this.page == 0) {
            pagingPrevious.setOpacity(0.3);
        }
        if (this.page == this.contentList.length - 1) {
            pagingNext.setOpacity(0.3);
        }
        paging.insert(pagingPrevious);
        paging.insert(pagingNext);
    }


    var footer = new Element("div", {
        id: "StartPageFooter",
        'class': "StartPageFooter"
    });

    var pageOwner = new Element("div", {
        id: "pageOwner",
        'class': "pageOwner application_main_soft_text",
		'style': 'height:18px;overflow:hidden;width:36%;'
    });
    var pageOwnerLabel = new Element("div", {
        id: "pageOwnerLabel",
        'class': "pageOwnerLabel"
    }).update(global.getLabel('KM_PAGE_OWNER') + ' : ');
    var pageOwnerName = new Element("div", {
        id: "pageOwnerName",
        'class': "pageOwnerName",
		title: this.json.EWS.o_v_last_changed_by
    }).update(this.json.EWS.o_v_last_changed_by);
    pageOwner.insert(pageOwnerLabel);
    pageOwner.insert(pageOwnerName);
    footer.insert(pageOwner);

    var lastUpdated = new Element("div", {
        id: "lastUpdated",
        'class': "lastUpdated application_main_soft_text",
		'style': 'height:18px;'
    });
    var lastUpdatedLabel = new Element("div", {
        id: "lastUpdatedLabel",
        'class': "lastUpdatedLabel"
    }).update(global.getLabel('KM_LAST_UPDATED') + ' : ');
    var lastUpdatedValue = new Element("div", {
        id: "lastUpdatedValue",
        'class': "lastUpdatedValue"
    });
	
	var auxText = this.json.EWS.o_v_last_changed_date;
	if (auxText.length > 0) 
	auxText = Date.parseExact(auxText, "yyyy-MM-dd").toString(global.dateFormat);
	
	lastUpdatedValue.update(auxText);
    lastUpdated.insert(lastUpdatedLabel);
    lastUpdated.insert(lastUpdatedValue);
    footer.insert(lastUpdated);

    var pageRating = new Element("div", {
        id: "pageRating",
        'class': "pageRating application_main_soft_text"
    });
    var pageRatingLabel = new Element("div", {
        id: "pageRatingLabel",
        'class': "pageRatingLabel"
    }).update(global.getLabel('KM_RATE_THIS_PAGE') + ' : ');
    var pageRatingStars = new Element("div", {
        id: "pageRatingStars",
        'class': "pageRatingStars"
    });
    pageRating.insert(pageRatingLabel);
    pageRating.insert(pageRatingStars);
    footer.insert(pageRating);

    var legalDisclaimer = new Element("div", {
        id: "legalDisclaimer",
        'class': "legalDisclaimer application_action_link"
    }).update(global.getLabel('KM_LEGAL_DISCLAIMER'));
    //footer.insert(legalDisclaimer);

    this.virtualHtml.update();
	
	if(global.currentApplication.tabId=="KM_BRWSR"){
		var spBackLink =new Element('div', {
			'class': 'spBackLink application_action_link',
			id: 'spBackLink'
		});
		spBackLink.update(global.getLabel('KM_BACK'));
		spBackLink.observe('click',function(){
			global.open($H({
                app: {
                    tabId: "KM_BRWSR",
                    appId: "KM_BRWSR",
                    view: "ContentBrowser"
                },
                cid: this.contentID,
                fid: this.fid
            }));
            this.createContent = false;
		}.bind(this));
		this.virtualHtml.insert(spBackLink);
	}
	
	if(global.currentApplication.tabId=="KM_TESTA"){
            var spBackLink =new Element('div', {
                  'class': 'spBackLink application_action_link',
                  id: 'spBackLink'
            });
            spBackLink.update(global.getLabel('KM_BACK'));
            spBackLink.observe('click',function(){
                  global.open($H({
                app: {
                    tabId: "KM_TESTA",
                    appId: "KM_TESTA",
                    view: "TestingArea"
                }
            }));
            this.createContent = false;
            }.bind(this));
            this.virtualHtml.insert(spBackLink);
    }
	  
	if(global.currentApplication.tabId=="SEA_SEA"){
		var spBackLink =new Element('div', {
			'class': 'spBackLink application_action_link',
			id: 'spBackLink'
		});
		spBackLink.update(global.getLabel('KM_BACK'));
		spBackLink.observe('click',function(){
			global.open($H({
                app: {
                    tabId: "SEA_SEA",
                    appId: "SEA_SEA",
                    view: "Search"
                },
                keyword: this.searchQuery/*,
                fid: this.fid*/
            }));
            //this.createContent = false;
		}.bind(this));
		this.virtualHtml.insert(spBackLink);
	}
	
	
	
	
    this.virtualHtml.insert(body);
    if (this.paging) {
        this.virtualHtml.insert(paging);
    }
    this.virtualHtml.insert(footer);

    var s = new Stars({
        maxRating: 5,
        actionURL: '',
        //callback: ajaxRating,
        imagePath: 'images/',
        content_id: this.contentID,
        value: parseInt(this.json.EWS.o_v_rating)
    });

    if (this.createContent) {
        this.editContentHandler();
    }else{
		this.registerLinksEvents();
	}

}

});
