var upload_module_store = {};


var UploadModule = Class.create(origin,{
    __uploadModule: null,
    initialize: function($super,target, app_id, service_backend, isDocId, callback, hrw, onSuccessEvent, onFailureEvent) {
		/*if EDM is flagged with an X, it should call the upload without java(light upload), otherwise it should call the Upload with the java stack, or full upload.*/
		if (global.usettingsJson.EWS.o_99edm=='X') {
			this.__uploadModule = new UploadModuleLight(target, app_id, service_backend, isDocId, callback, hrw, onSuccessEvent, onFailureEvent);
        } else {
			this.__uploadModule = new UploadModuleFull(target, app_id, service_backend, isDocId, callback, hrw, onSuccessEvent, onFailureEvent);
        }
    },
	uploadHandler: function(){
		this.__uploadModule.uploadHandler();
	},
	addParameter: function(pName,pValue){
		this.__uploadModule.addParameter(pName,pValue);
	},
	updateParameter: function(pName,pValue){
		this.__uploadModule.updateParameter(pName,pValue);
	},
	getFileName: function(){
		this.__uploadModule.getFileName();
	},
	removeParameter: function(pName){
		this.__uploadModule.removeParameter(pName);
	},
	cleanUp: function($super){
		this.__uploadModule.cleanUp();
	},
	
	cancel: function () {
		this.__uploadModule.cancel();
    }
});

var UploadModuleLight = new Class.create(origin,
{
    targetDiv: null,
    app_id: null,
    hrw: null,
    service_backend: null,
    doc_id: null,
    isDocId: null,
    callback: null,
    baseUrl: null,
    form: null,
    formDiv: null,
    fileInput: null,
    identifier: null,
	hasFile: null,
	sessionId: null,
	callUpload: false,
	
    initialize: function ($super,target, app_id, service_backend, isDocId, callback, hrw, onSuccessEvent, onFailureEvent) {
		$super();
		this.hasFile = false;        
        this.app_id = app_id;
        this.hrw = hrw;
        this.service_backend = service_backend;
        this.onSuccessEvent = onSuccessEvent;
        this.onFailureEvent = onFailureEvent;
        this.targetDiv = $(target);
        var targetDivId = this.targetDiv.identify();
        this.identifier = targetDivId;
        while (upload_module_store[this.identifier] != null) {
            var randomnumber = Math.floor(Math.random() * 1000 + 1)
            this.identifier = targetDivId + "_" + randomnumber;
        }
        upload_module_store[this.identifier] = this;
        this.callback = callback;
        this.uploadHandlerBinding = this.uploadHandler.bindAsEventListener(this);
		this.UploadSuccessFunctionBinding = this.UploadSuccessFunction.bindAsEventListener(this);
		this.UploadFailureFunctionBinding = this.UploadFailureFunction.bindAsEventListener(this);
        this.baseUrl = this._getBaseUrl();
        this.buildHtml();
    },
	
   _getBaseUrl: function () {
		var url = __hostName.gsub('proxy.aspx?url=','').gsub('http'+__entry,'httpdoc')
		url = unescape(url);
		
		url = window.location.protocol +'//'+ window.location.hostname+':'+ window.location.port+url+'?sap-client='+global.client
		
        if(__sesid){
			url+='&s='+ __sesid;
			this.sessionId = __sesid;
		}else{
			this.sessionId = getURLParam('sesid');
			url+='&s='+ this.sessionId;
		}
 		for (var i in this.hrw) {
			url+='&'+i+'='+this.hrw[i];
		}  
		if(this.service_backend){
			url+='&serviceName='+this.service_backend
		} 
		
		return url;
    },
    uploadHandler: function () {
		this.form.submit();
		var iconDiv = new Element('div',{'style':'height:35px;margin-top:30px'});
		iconDiv.insert(new Element('div', { 'class': 'application_loading_icon tableKitV2IconLoadingPagination' }));
		this.targetDiv.insert(iconDiv);
    },
	UploadSuccessFunction:function(json){
		this.targetDiv.update(global.getLabel('DM_UPLOAD_SUCCESSFUL'));
		var testParse = new XML.ObjTree();
		var xml = testParse.parseXML(json.responseText);		
		this.callback.call(null,xml);
	},
	UploadFailureFunction:function(json){
		this.targetDiv.update(global.getLabel('DM_ERROR_UPLOAD'));
	},
	buildHtml: function(){	
		this.form = new Element('form',{
			'class': 'um_form',
			'enctype': 'multipart/form-data',
			'method': 'POST',
			'action': this.baseUrl,
			'target': 'um_iframe_'+ this.identifier
		});
		this.targetDiv.insert(this.form)

		this.fileInput = new Element('input',{
			'type': 'file',
			'name': 'datafile',
			'size': '40'
		});
		this.form.insert(this.fileInput);
		this.iframe = new Element("iframe", { "name": "um_iframe_" + this.identifier + "", "src": "javascript:false", "style": "width:0px;height:0px;border:0px solid #fff;" });
		this.targetDiv.insert(this.iframe);
		this.fileInput.observe('change', this.fieldChange.bind(this));
		this.iframe.observe('load', this.fileUploadedSuccess.bind(this));
	},
	
	fileUploadedSuccess: function(){
		if(this.callUpload){			
			var xml = '<?xml version="1.0"?><EWS xmlns:asx="http://www.sap.com/abapxml">'
			var iframeContent = this.iframe.contentDocument.documentElement.children;
			for(var ctr = 0; ctr<=iframeContent.length-1;ctr++){
				var nodeName = iframeContent[ctr].nodeName;
				var nodeValue = iframeContent[ctr].textContent;
				if(nodeValue==""){
					xml+='<'+nodeName+'>'+nodeValue+'</'+nodeName+'>';
				}else{
					xml+='<'+nodeName+'>'+iframeContent[ctr].textContent+'</'+nodeName+'>';
				}
			}
			this.targetDiv.update('Upload Successful');
			this.callback.call(null,xml);
		}
		this.callUpload = true;
	},
	
	addParameter: function(pName,pValue){
		if (pName && pValue) {
            this.form.insert(this._getInputElement("hidden", pName, pValue));
        }
	},
	updateParameter: function(pName, pValue){
        if (pName && pValue) {
            elt = this.form.down('input[name="' + pName + '"]');
            if(elt){
				elt.value = pValue;
			}
        }
	},
	getFileName: function(){
		this.hasFile = true;
        return this.fileInput.value.replace("C:\\fakepath\\", "");
	},
	fieldChange: function(){
		document.fire('EWS:UploadModule_newFileAdded');
	},
	removeParameter: function(pName){
		var elt;
        if (pName) {
            elt = this.form.select('input[name="' + pName + '"]');
            if (elt) {
                elt.first().remove();
            }
        }
	},
	cleanUp: function($super){
		//debugger;
/* 		var x = this._test;
		//debugger;
		if (this.form && this.form.parentNode) { this.form.remove(); }
        if (this.iframe && this.iframe.parentNode) { this.iframe.remove(); }
		upload_module_store[this.identifier] = null; */
	
	},
	_getInputElement: function (type, name, value, attributes) {
        if (attributes == undefined) {
            attributes = {};
        }
        attributes.type = type;
        attributes.name = name;
        if (value) {
            attributes.value = value;
        }

        return new Element("input", attributes);
    }
	
});


var UploadModuleFull = new Class.create(origin,
{
    targetDiv: null,
    app_id: null,
    hrw: null,
    service_backend: null,
    doc_id: null,
    isDocId: null,
    callback: null,
    baseUrl: null,
    form: null,
    progress: null,
    formDiv: null,
    fileInput: null,
    progressCell: null,
    progressRating: null,
    progressRemaining: null,
    progressBarContent: null,
    progressPercent: null,
    identifier: null,
	hasFile: null,
	isLocal: false,
    initialize: function (target, app_id, service_backend, isDocId, callback, hrw, onSuccessEvent, onFailureEvent) {
		this.hasFile = false;        
		this.client = global.client;
        this.app_id = app_id;
        this.hrw = hrw;
        this.service_backend = service_backend;
        this.onSuccessEvent = onSuccessEvent;
        this.onFailureEvent = onFailureEvent;
        this.targetDiv = $(target);
        var targetDivId = this.targetDiv.identify();
        this.identifier = targetDivId;
        while (upload_module_store[this.identifier] != null) {
            var randomnumber = Math.floor(Math.random() * 1000 + 1)
            this.identifier = targetDivId + "_" + randomnumber;
        }
        upload_module_store[this.identifier] = this;
        this.isDocId = isDocId;
        this.callback = callback;
        this.uploadHandlerBinding = this.uploadHandler.bindAsEventListener(this);
        this.baseUrl = this._getBaseUrl();
        this.buildHtml();

    },
    _getBaseUrl: function () {
        var url = window.location.protocol + '//';
        switch (window.location.hostname) {
            case 'localhost':
                url += 'eu2r3edn.euhreka.erp:51400/java'; //dev
				this.isLocal = true;
                //url = 'eu2r3edc.euhreka.erp:50400/java'; //stable
                break;
            case "dev.ews.local":
                url += 'eu2r3edn.euhreka.erp:51400/java'; //dev
				this.isLocal = true;
                //url = 'eu2r3edc.euhreka.erp:50400/java'; //stable
                break;
            case 'local.eu2r3edn.euhreka.erp':
                url += 'eu2r3edn.euhreka.erp:51400/java'; //dev
				this.isLocal = true;
                //this.hn = 'eu2r3edc.euhreka.erp:50400/java'; //stable
                break;
            case 'eu2r3edn.euhreka.erp':
                url += 'eu2r3edn.euhreka.erp:51400/java';
                break;
            case 'eu2r3edc.euhreka.erp':
                url += 'eu2r3edc.euhreka.erp:50400/java';
                break;
            case 'eu2r3etc.euhreka.erp':
                url += 'eu2r3etc.euhreka.erp:51400/java';
                break;
            case 'eodr3edm.euhreka.erp':
                url += 'eodr3edm.euhreka.erp:50400/java';
                break;
            case 'eodr3eds.euhreka.erp':
                url += 'eodr3eds.euhreka.erp:51400/java';
                break;
            case 'eu2r3etn.euhreka.erp':
                url += 'eu2r3etn.euhreka.erp:51500/java';
                break;
            default:
                url += window.location.hostname + ':' + window.location.port + '/java';
        }
        return url;
    },
    call: function (url) {
        url = url + '&sap-client=' + this.client;

        var a = document.getElementsByTagName("body")[0];
        var d = a.getElementsByTagName("script").length;

        var b = a.getElementsByTagName("script")[d - 1];
        if (b.getAttribute("src").startsWith('http://')) {
            $(b).remove();
        }
        var c = document.createElement("script");
        c.setAttribute("type", "text/javascript");
        if (window.location.hostname == "localhost" || window.location.hostname == "dev.ews.local") {
            url = "proxy.aspx?url=" + escape(url) + "&overridesettings=true";
        }
        c.setAttribute("src", url + '&_=' + (new Date()).getTime());
        a.appendChild(c);
    },
    initializeSession: function () {
        var initUrl = this.baseUrl + '/EuHRekaWS05/km?mod=upload&service=createSession&target=' + this.identifier;
        initUrl = initUrl + '&sap-client=' + this.client;
		if (this.hrw) {
            initUrl += '&appId=' + this.hrw.I_V_APPID;
        }
        this.call(initUrl);
    },
    uploadHandler: function (evt) {
        this.progress.show();
        this.form.hide();
        this.initializeSession();
    },
    getProgress: function () {
		if(this.isLocal){
			this.call(this.baseUrl + '/EuHRekaWS05/km?mod=upload&service=getProgress&target=' + this.identifier + '&sessionId=' + this.javaSession+'&sap-client=' + this.client);
		}else{
			this.call(this.baseUrl + '/EuHRekaWS05/km?mod=upload&service=getProgress&target=' + this.identifier + '&sap-client=' + this.client);
		}
    },
    cancel: function () {
        this.cancelled = true;
    },
    buildProgress: function (percentage, bytesRead, totalLength, rate, unitTime, completed) {
        if (this.cancelled)
            return;
        this.progressBarContent.setStyle({
            width: parseInt(percentage * 4) + 'px'
        });
        this.progressPercent.update(percentage + '%');
        this.progressCell.update(bytesRead + ' ' + global.getLabel('DM_OUT_OF') + ' ' + totalLength);
        this.progressRating.update(global.getLabel('DM_TRANSFER_RATE') + ': ' + rate);
		var newTime
		if(unitTime){
			newTime = unitTime.gsub('minute(s)',global.getLabel('Minutes')+' ').gsub('seconds',global.getLabel('seconds'));
		}
        this.progressRemaining.update(global.getLabel('DM_ESTIMATED_TIME') + ': ' + newTime + ' ' + global.getLabel('DM_REMAINING'));
        if (completed == 'false') {
            this.getProgress.bind(this).delay(1);
        } else {
            this.uploadDone(completed);
            this.getDocId();
        }
    },
    getDocId: function () {
		if(this.isLocal){
			this.call(this.baseUrl + '/EuHRekaWS05/km?mod=upload&service=getDocId&target=' + this.identifier + '&sessionId=' + this.javaSession);
		}else{
			this.call(this.baseUrl + '/EuHRekaWS05/km?mod=upload&service=getDocId&target=' + this.identifier);
		}
    },
    buildDocId: function (json) {
        if (json) {
            this.doc_id = json;
            this.callback.call(null, json);
        }
    },
    buildHtml: function () {
        // Build up the html
        // targetDiv
        //      -> form
        //              -> Hidden fields (backend, docIdFlag and hrw fields)
        //              -> File input  
        //      -> progress
        //              -> progressBarBox
        //                      -> ProgressBarContent
        //              -> progressCell
        //              -> progressRate
        //              -> progressRemaining    


        // Build form (hidden fields and the fileinput)

        // The form has to be parsed, otherwise it won't work in Internet Explorer
        var formText = '<form class="um_form" enctype="multipart/form-data" target="um_iframe_' + this.identifier + '" method="post"></form>'
        this.targetDiv.insert({ bottom: formText });
        this.form = this.targetDiv.descendants()[this.targetDiv.descendants().length - 1];
        this.form.insert({ bottom: this._getInputElement("hidden", "servicebackend", this.service_backend) });  // Add hidden field for service backend
        this.form.insert({ bottom: this._getInputElement("hidden", "docIdFlag", this.isDocId) });               // Add hidden field for flag of DocId
        // Add hidden fields for hrw
        if (this.hrw) {
            for (var i in this.hrw) {
                this.form.insert({ bottom: this._getInputElement("hidden", i, this.hrw[i]) });
            }
        }
        this.fileInput = this._getInputElement("file", "datafile");
        this.form.insert({ bottom: this.fileInput });                                // Add the fileinput element

        this.iframe = new Element("iframe", { "name": "um_iframe_" + this.identifier, "src": "javascript:false", "style": "width:0;height:0;border:0px solid #fff;" });

        // Build progress elements
        this.progress = new Element("div", { "style": "display:none;", "class": "uploadModule_progressContainer" });

        var progressBarBox = new Element("div", { "class": "uploadModule_progressBarBox" });
        this.progressBarContent = new Element("div", { "id": "uploadModule_progressBarBoxContent_" + this.identifier, "class": "uploadModule_progressBarBoxContent" });
        progressBarBox.insert({ bottom: this.progressBarContent });

        var progressInfo = new Element("div", { "class": "uploadModule_progressInfo" });
        this.progressCell = new Element("div");
        this.progressRating = new Element("div");
        this.progressRemaining = new Element("div");
        this.progressPercent = new Element("div");
        progressInfo.insert(this.progressCell);
        progressInfo.insert(this.progressRating);
        progressInfo.insert(this.progressRemaining);
        progressInfo.insert(this.progressPercent);


        this.progress.insert(progressBarBox);
        this.progress.insert(progressInfo)


        // Add the elements and attach event handlers
        // this.targetDiv.insert({ bottom: this.form });
        this.targetDiv.insert({ bottom: this.iframe });
        this.targetDiv.insert({ bottom: this.progress });
        this.fileInput.observe('change', this.fieldChange.bind(this));
    },
    cleanUp: function () {
        if (this.form && this.form.parentNode) { this.form.remove(); }
        if (this.progress && this.progress.parentNode) { this.progress.remove(); }
        if (this.iframe && this.iframe.parentNode) { this.iframe.remove(); }
		upload_module_store[this.identifier] = null;
    },
    uploadDone: function (code) {
        var html = '';
        switch (code) {
            case '0':
                html = global.getLabel('DM_UPLOAD_SUCCESSFUL');
                break;
            case '1':
                html = global.getLabel('DM_MAX_SIZE_EXCEEDED');
                break;
            case '2':
                html = global.getLabel('DM_ERROR_UPLOAD');
                break;
            case '3':
                html = global.getLabel('DM_ERROR_STORE');
                break;
            case '4':
                html = global.getLabel('DM_TYPE_NOT_ALLOWED');
                break;
            case '5':
                html = global.getLabel('DM_EMPTY_FILE');
                break;
            case '6':
                html = global.getLabel('DM_ERROR_JCO_CONNECTION');
                break;
        }
        if (this.onSuccessEvent && code == '0') {
            document.fire(this.onSuccessEvent);
        }
        if (this.onFailureEvent && code != '0') {
            document.fire(this.onFailureEvent);
        }
        var notification = new Element("div", { "class": "upload_notification", "style": "width:600px;float:left;margin:5px;" });
        notification.update(html);
        this.progress.replace(notification);
    },
    buildUpload: function (javaSession) {
        var errorMsg = null;
        if (javaSession.startsWith('Error:')) {
            this.targetDiv.update(javaSession);
            return;
        }
        else {
            this.javaSession = javaSession;
            this.form.writeAttribute("action", this.baseUrl + '/EuHRekaWS05/km?mod=upload&service=uploadDocument&appId=' + this.app_id + '&sessionId=' + this.javaSession);
			if(this.isLocal){
				this.form.writeAttribute("action", this.baseUrl + '/EuHRekaWS05/km?mod=upload&service=uploadDocument&appId=' + this.app_id + '&sessionId=' + this.javaSession);
			}else{
				this.form.writeAttribute("action", this.baseUrl + '/EuHRekaWS05/km?mod=upload&service=uploadDocument&appId=' + this.app_id);
			}
			
        }
        if (this.getFileName()) {
            var notification = this.targetDiv.down('div.upload_notification');
            if (notification) {
                notification.remove();
            }
            this.form.submit();
            this.getProgress();
        }
    },
    _getInputElement: function (type, name, value, attributes) {
        /// <summary>Creates an input element</summary>
        /// <param name="type">The type of element (hidden, text, radio, button, check, file)</param>
        /// <param name="name">The name attribute of the element</param>
        /// <param name="value">The value of the element</param>
        if (attributes == undefined) {
            attributes = {};
        }
        attributes.type = type;
        attributes.name = name;
        if (value) {
            attributes.value = value;
        }

        return new Element("input", attributes);
    },
    addParameter: function (pName, pValue) {
        if (pName && pValue) {
            this.form.insert(this._getInputElement("hidden", pName, pValue));
        }
    },
    updateParameter: function (pName, pValue) {
        if (pName && pValue) {
            elt = this.form.down('input[name="' + pName + '"]');
            elt.value = pValue;
        }
    },
    getFileName: function () {
		this.hasFile = true;
        return this.fileInput.value.replace("C:\\fakepath\\", "");
    },
    fieldChange: function () {
        document.fire('EWS:UploadModule_newFileAdded');
    },
    removeParameter: function (pName) {
        var elt;
        if (pName) {
            elt = this.form.select('input[name="' + pName + '"]');
            if (elt) {
                elt.first().remove();
            }
        }
    }
});