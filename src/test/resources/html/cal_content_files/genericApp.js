var genericApp = Class.create(Application, {
    initialize: function($super, options) {
        $super(options);
		//this.widgetsReadyBinding = this.widgetsReady.bind(this); 
    },
    run: function($super, args){
        $super(args);    
        var xmlParser = new XML.ObjTree();
	    xmlParser.attr_prefix = '@';
	    var xmlDoc = readXmlFile('standard/fieldsPanel/getcontentDynamic.xml');
	    //var xmlDocCreateMode = readXmlFile('standard/fieldsPanel/getcontentScrNavCreateMode.xml');
	    this.auxJson = xmlParser.parseXML(xmlToString(xmlDoc));
	    //this.createModeJson = xmlParser.parseXML(xmlToString(xmlDocCreateMode));   
        var aux = new getContentModule({
            appId: 'PD_ADDR',
            mode:'edit',
            json:this.auxJson,
            //jsonCreateMode: this.createModeJson,
            showCancelButton:false,
            buttonsHandlers: $H({
                REC_ADCHANGEPERMADDR : function(){alert('example of button handler')}
            })/*,
            cssClasses: $H({
                fieldDispFloatLeft : 'fieldDispFloatRight'
            })*/
        });
	    this.virtualHtml.insert(aux.getHtml());
		 
    },
    widgetsReady: function(){     
	    /*this.gw = new GetWidgets({
			    eventName: 'EWS:eventExample',
				objectType: 'P',
				objectId: '30000429',
				service: 'GET_WIDGETS',
				tabId: 'ED_PD',
				target: this.virtualHtml.identify()			
		});			
		document.observe('EWS:eventExample',this.widgetsReadyBinding);
		*/  
	    var xmlParser = new XML.ObjTree();
	    xmlParser.attr_prefix = '@';
	    var xmlDoc = readXmlFile('standard/fieldsPanel/out9.xml');
	    this.auxJson = xmlParser.parseXML(xmlToString(xmlDoc));   
        var aux = new fieldsPanel({appId: 'PD_DATA',mode:'edit',json:this.auxJson});       
        this.gw.widgets.get('PD_DATA').setContent(aux.getElement());        
       
	},   
    close: function($super){
    	$super();
    	//document.stopObserving('EWS:eventExample',this.widgetsReadyBinding);
    }

});