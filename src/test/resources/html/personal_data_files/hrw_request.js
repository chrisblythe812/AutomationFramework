/**
 * @class 
 * @description This class is used to generate XML request for HRW Engine (used by eWS SCM applications)<br><br>
 * 
 * <code><pre>
 * Example of code:<br/>
 * var method_name = "Test.SayHello";<br/>
 * var method_params = new Hash();<br/>
 * method_params.set("YourName", "Oli");<br/>
 * <br/>
 * var hrw_request = new HrwRequest({<br/>
 *    methodName: method_name,<br/>
 *    methodParams: method_params<br/>
 * });<br/>
 *<br/>
 * hrw_request.toString()   --> returns a string object.<br/></pre></code>
 *
 *
 * @author jonathanj & nicolasl
 * @version 2.2
 * <br/>Modified in 4.3
 * <ul>
 * <li>Update the encoding to manage the < and > </li>
 * </ul>
 */
var HrwRequest = Class.create(/** @lends HrwRequest.prototype */{
    /**
     * @type String
     * @default "hrw_engine"
     * @description Name of the SAP Caller service.
     * @since 1.0
     */
    _service: "hrw_engine",

    /**
     * @type Template
     * @description XML template of EWS requests.
     * @since 1.0
     */
    _ewsXml: null,

    /**
     * @type Template
     * @description XML template of HRW requests.
     * @since 1.0
     */
    _hrwXml: null, 

    /**
     * @type Template
     * @description XML template of HRW request parameters.
     * @since 1.0
     */
    _hrwParamsXml: null,

    /**
     * @type String
     * @description Name of the HRW Engine method.
     * @since 1.0
     */
    methodName: null,

    /**
     * @type Hash
     * @description List of HRW Engine parameters (the name of the parameter is the Key).
     * @since 1.0
     */
    methodParams: null,

    /**
     * @description Constructor.
     * @param {Object} options Initialization options.
     * @since 1.0
     */
    initialize: function(options) {
    	//In case of bypassing SAP, the XML parameter do not have to be sent like a string
		if(options.bypassSAP)
        	this._ewsXml = new Template("#{input}");
        else 
        //Do not create the context in SAP for the calls that use SAP just as a pass through
			this._ewsXml = new Template("<EWS><SERVICE>#{service}</SERVICE><DEL/><NOCNTX>X</NOCNTX><PARAM><I_FORMAT>#{format}</I_FORMAT><I_INPUT><![CDATA[#{input}]]></I_INPUT></PARAM></EWS>");  
		this._hrwXml 		= new Template("<HrwRequest><Method>#{method}</Method><Parameters>#{parameters}</Parameters></HrwRequest>");
        this._hrwParamsXml	= new Template("<Parameter><Name>#{name}</Name><Value>#{value}</Value></Parameter>");

        if (options) {
            this.methodName = options.methodName || "";
            this.methodParams = options.methodParams || new Hash();
        }
    },

    /**
     * @description Returns a HrwRequest as a JSON object.
     * @returns {JSON Object} Get the method to call and the parameters to send.
     * @since 1.0
     */
    hrwRequestAsJson: function() {
        var method_name = this.methodName;
        var method_parameters = this.buildParametersList(this.methodParams);

        return Object.toJSON({
            Method: method_name,
            Parameters: method_parameters
        });
    },

    /**
     * @description Returns an array of Parameter object
     * @param {Hash} params List of params
     * @returns {Array} Format the list of parameters
     * @since 1.0
     */
    buildParametersList: function(params) {
        var parameters = [];

        params.each(function(param) {
            var p = {
                Name	: param.key,
                Value	: param.value
            }
            parameters.push(p);
        });

        return parameters;
    },

    /**
     * @description Returns a HrwRequest as XML.
     * @returns {String} XML that is to send to the backend.
     * @since 1.0
     */
    hrwRequestAsXml: function() {
        var params_as_xml = "";
        this.methodParams.each(function(methodParam) {
            params_as_xml += this._hrwParamsXml.evaluate({ name: methodParam.key, value: methodParam.value });
        }, this);

        return this._hrwXml.evaluate({ method: this.methodName, parameters: params_as_xml });
    },

    /**
     * @description Returns a HrwRequest as encoded XML.
     * @returns {String} Encoded XML to send to the backend
     * @since 1.0
     */
    hrwRequestAsEncoded: function() {
        return encodeURI(this.hrwRequestAsXml());
    },

    /**
     * @description Returns the full request as a String.
     * @returns {String} Convert the current call to a string.
     * @since 1.0
     */
    toString: function() {
        if (this.methodName.blank()) {
            alert("HrwRequest exception: 'methodName' could not be empty");
            return "";
        }
        if (this.methodName.split('.').length < 2) {
            alert("HrwRequest exception: 'methodName' is invalid");
            return "";
        }

        var hrw_request = "";
        switch (HrwRequest.format) {
            case "json":
                hrw_request = this.hrwRequestAsJson();
                break;
            case "encoded":
                hrw_request = this.hrwRequestAsEncoded();
                break;
            case "xml":
                hrw_request = this.hrwRequestAsXml();
                break;
        }
        return this._ewsXml.evaluate({ service: this._service, input: hrw_request, format: HrwRequest.format.toUpperCase() });
    }
});
/**
 * Format of teh request when sending to SAP. Could be "json", "xml" or "encoded"
 * @type String
 * @since 3.4
 */
HrwRequest.format = 'xml';//'xml'; //'json'; //'encoded';

/**
 * @param {Array} integers List of integers to convert.
 * @description Build a XML string from an array of integers.
 * @returns {String} Array of integers with XML format
 * @since 1.0
 */
HrwRequest.createXmlIntArray = function(integers, withRoot) {
	if(Object.isEmpty(withRoot)) withRoot = true;
	
	if(Object.isEmpty(integers) && withRoot) return '<ArrayOfInt/>';
	else if(Object.isEmpty(integers)) return '';
	
	var xmlString = '';
	integers.each(function(integ) {
		xmlString += '<int>' + integ.toString() + '</int>';
	}.bind(this));

	if(withRoot) return '<ArrayOfInt>' + xmlString + '</ArrayOfInt>';
	else return xmlString;
};

/**
 * Method used to encode strings before sending them to the engine
 * @param {String} toEncode String to encode
 * @param {Boolean} asHTML Indicate if the text should be considered as HTML
 * @return {String} Encoded string
 * @since 2.1
 * <br/>Modified in 4.3
 * <ul>
 * <li>If the content to encode has HTML format, keep the difference between &lt; and < </li>
 * </ul>
 */
HrwRequest.encode = function(toEncode, asHTML) {
	//Return '' for empty strings
	if(Object.isEmpty(toEncode)) return '';
	var encoded; 
	
	//Remove the HTML encoding
	var ta = document.createElement("textarea");
	//since 4.3 - If the content is HTML, keep the &lt; and &gt;
	if (asHTML) {
		ta.value = toEncode.gsub('&lt;', '&&@lt;').gsub('&gt;', '&&@gt;');
		encoded = ta.value.gsub('&&@lt;', '&lt;').gsub('&&@gt;', '&gt;');
	}
	else {
		ta.value = toEncode;
		encoded = ta.value;
	}
	
	//Replace all the special chars by there URI conversion
	return encodeURIComponent(encoded);
};

/**
 * Method used to decode strings received from the engine
 * @param {String} toDecode String to decode
 * @return {String} Decoded string
 * @since 2.1
 * <br/>Modified in 4.3
 * <ul>
 * <li>If the content to decode has HTML format, format the < and > to the HTML entities </li>
 * </ul>
 */
HrwRequest.decode = function(toDecode, asHTML) {
	//Return '' for empty strings
	if(Object.isEmpty(toDecode)) return '';
	var decoded;
	
	try {
		decoded = decodeURIComponent(toDecode);
	} catch(e) {
		decoded = toDecode;
	}
	if(asHTML !== true) {
		decoded = decoded.gsub('<', '&lt;').gsub('>', '&gt;');
	}
	//Remove the scripts
	decoded = decoded.stripScripts();
	
	return decoded;
};

/**
 * Method used to add encode chars that can not be present in attributes
 * @param {String} toEncode Text to be displayed as an attribute
 * @return {String} Teh result text
 * @since 2.1
 * <br/>Modified in 4.3
 * <ul>
 * <li>Don't remove the tags for this method</li>
 * </ul>
 */
HrwRequest.displayAsAttribute = function(toEncode) {
	return toEncode.stripScripts().gsub(/"/, "&quot;");
}

/**
 * Method used to remove all the script and tags from a string (also if there are like <.../>)
 * @param {String} toEncode Text with some tags that has to be cleaned
 * @return {String} The cleaned text
 * @since 2.1
 * <br/>Modified in 4.3
 * <ul>
 * <li>Do not remove the entities, but replace them with the textual format</li>
 * </ul>
 */
HrwRequest.removeTags = function(toEncode) {
	return toEncode.stripScripts().gsub('<', '&lt;').gsub('>', '&gt;');
}

/**
 * Get the value from a Json 
 * @param {Json} json The json to read
 * @param {String} path The path to the value without the 'EWS.HrwResponse.HrwResult' 
 * @param {Object} defaultValue A default value if there is nothing found (null by default)
 * @param {Type} Indicate the type of the return value
 * @param {Boolean} fromRoot Allow to force to read the path from the begining (if there is no EWS.HrwResponse.HrwResult)
 * @since 3.4
 */
HrwRequest.getJsonValue = function(json, path, defaultValue, type, fromRoot){
	var value 		= defaultValue;
	var valid 		= true;
	var jsonContent = json;
	
	//If the given Json is empty, return the default value
	if(Object.isEmpty(json)) return value;
	
	//If the standard beginig for SCM calls is not applicable, do not remove it
	if(fromRoot !== true) {
		//Delete the begining of the path that is always correct
		if (path.substr(0, 'EWS.HrwResponse.HrwResult'.length) === 'EWS.HrwResponse.HrwResult') 
			path = path.substr('EWS.HrwResponse.HrwResult'.length + 1);
	
		//Initialize the variable
		jsonContent = json.EWS.HrwResponse.HrwResult;
		
		//If there is no result, there is nothing inside...
		if (Object.isEmpty(jsonContent)) return value;
	//In Json format, the root node will be removed... so add a root that can be deleted
	} else if(HrwRequest.format === 'json') {
		path = 'fakeRoot.' + path;
	}
	
	//Navigate in the Json until the specified path
	if(path !== '') {
		var parts = path.split('.');
	
		//In case of a JSON source, the first node is not there 
		if(HrwRequest.format === 'json') {
			parts = parts.slice(1, parts.length);
			if(type === HrwRequest.ARRAY) {
				parts = parts.slice(0, parts.length - 1);
			}
		} 
		
		parts.each(function(part, index) {
			if(!valid) return;
			jsonContent = jsonContent[part];
			if(Object.isEmpty(jsonContent)) valid = false;
		}, this);
	}
	
	if(valid && !Object.isEmpty(jsonContent)) {
		switch(type) {
			case HrwRequest.STRING:
				value = jsonContent.toString();
				break;
			case HrwRequest.ARRAY:
				value = objectToArray(jsonContent);
				break;
			case HrwRequest.BOOLEAN:
				value = (jsonContent.toLowerCase() === "true" || jsonContent === true);
				break;
			case HrwRequest.INTEGER:
				value = parseInt(jsonContent);
				break;
			case HrwRequest.DATE:
				if(Object.isString(jsonContent))
					value = SCM_Ticket.convertDateTime(jsonContent);
				break;
			case HrwRequest.NUMBER:
				value = ((Object.isNumber(jsonContent))? jsonContent : new Number(jsonContent));
				break;
			default:
				value = jsonContent;
				break;
		}
	} 
	
	return value;
};

/**
 * Get the value from a Json 
 * @param {Json} json The json to read
 * @param {String} path The path to the value without the 'EWS.HrwResponse.HrwResult'
 * @param {Boolean} fromRoot Allow to force to read the path from the begining (if there is no EWS.HrwResponse.HrwResult)
 * @since 3.4
 */
HrwRequest.getJsonArrayValue = function(json, path, fromRoot) {
	return HrwRequest.getJsonValue(json, path, $A(), HrwRequest.ARRAY, fromRoot);
};
/**
 * Static value to indicate that a value is a String
 * @type Integer
 * @since 3.5
 */
HrwRequest.STRING 	= 2;
/**
 * Static value to indicate that a value is an Array
 * @type Integer
 * @since 3.5
 */
HrwRequest.ARRAY 	= 6;
/**
 * Static value to indicate that a value is a Boolean
 * @type Integer
 * @since 3.5
 */
HrwRequest.BOOLEAN 	= 7;
/**
 * Static value to indicate that a value is a Number
 * @type Integer
 * @since 3.5
 */
HrwRequest.NUMBER 	= 5;
/**
 * Static value to indicate that a value is a Date
 * @type Integer
 * @since 3.5
 */
HrwRequest.DATE		= 3;
/**
 * Static value to indicate that a value is an Integer
 * @type Integer
 * @since 3.5
 */
HrwRequest.INTEGER	= 1;
/**
 * Static value to indicate that a value is a Signed Integer
 * @type Integer
 * @since 4.0
 */
HrwRequest.S_INTEGER	= 4;
/**
 * Check if a given path from engine exists in the Json
 * @param {Json} json Json to check
 * @param {String} path Path with or without the 'EWS.HrwResponse.HrwResult' on the begining
 * @param {Boolean} withLast Check also the last part (true by default)
 * @since 3.4
 */
HrwRequest.checkJsonPath = function(json, path, withLast) {
	var jsonContent;
	var valid = true;
	
	if(withLast !== false) withLast = true;
	
	//Delete the begining of the path that is always correct
	if(path.substr(0, 'EWS.HrwResponse.HrwResult'.length) === 'EWS.HrwResponse.HrwResult') 
		path = path.substr('EWS.HrwResponse.HrwResult'.length + 1);
	
	jsonContent = json.EWS.HrwResponse.HrwResult;
		
	var parts = path.split('.');
	
	parts.each(function(part, index) {
		if(!valid) return;
		if(!withLast && index == (parts.size() - 1)) return;
		jsonContent = eval('jsonContent.' + part);
		if(Object.isEmpty(jsonContent)) valid = false;
	}, this);
	
	return valid;
};

/**
 * Get a date that correspond to now in the SAP timezone
 * @returns {Date} Now
 * @since 4.0 
 */
HrwRequest.getNow = function() {
	var userTimeZone	= -1 * (new Date().getTimezoneOffset() / 60);
	var sapTimeZone 	= hrwEngine.timezoneOffset;
	
	//Get the difference between the local timezone and the SAP timezone in hour, minutes and seconds
	var toAdd = sapTimeZone - userTimeZone;
	var toAddHours = Math.floor(toAdd);
	toAdd = (toAdd - toAddHours) * 60;
	var toAddMinutes = Math.floor(toAdd);
	toAdd = (toAdd - toAddMinutes) * 60;
	var toAddSeconds = Math.floor(toAdd);
	
	var today = new Date();
	today.addHours(toAddHours);
	today.addMinutes(toAddMinutes);
	today.addSeconds(toAddSeconds);
	
	return today;
};
/**
 * @class
 * @description Manage the calls to the HRW backend.
 * @author jonathanj & nicolasl
 * @version 4.0
 * <br/>Modified for 5.3
 * <ul>
 * <li>Add a flag to check if at last one company has the link configured</li>
 * </ul>
 * <br/>Modified for 5.2
 * <ul>
 * <li>Assign the maximum number of tickets in a bulk action</li>
 * </ul>
 * <br/>Modified for 5.0
 * <ul>
 * <li>Add a cache for the backend call TicketPool.CollectAvailableFastDataEntryTypes</li>
 * </ul>
 * <br/>Modified in 4.4
 * <ul>
 * <li>1054175 - Use a particular service to logout of HRW</li>
 * <li>1054175 - Do not display the message to indicate that the session is lost</li>
 * <li>Addition of a version number on login</li>
 * </ul>
 * <br/>Modified in 4.0
 * <ul>
 * <li>Set the timezone offset accessible from outside</li>
 * </ul>
 */
var HrwEngine = Class.create(/** @lends HrwEngine.prototype */{
	/**
     * Parameter to indicate if the proxy to bypass SAP to access the HRW Engine should be used
     * @type Boolean
     * @since 3.4
     */
	_bypassSAP: null,
		
	/**
	 * List of the existent scenarios and there execution id
	 * @type Hash
	 * @since 3.4
	 */
	scenarios: null,
	
	/**
	 * Indicate if the tracing is to activate and use
	 * @type Boolean
	 * @since 3.4
	 */
	_computeTime: false,
	
	/**
	 * List of the saved time record entries
	 * @type Hash
	 * @since 3.4
	 */
	_timeSaved: null,
	
	/**
 	 * Variable to identify an entry in the records table
	 * @type Integer
	 * @since 3.4
	 */
	_timerIndex: 0,
	
	/**
	 * Number of items before sending to SAP
	 * @type Integer
	 * @since 3.4
	 */
	_timerNumItems: 50,
	
	/**
	 * @type String
	 * @default ''
	 * @description Identifier of the current agent.
     * @since 1.0
	 */
    scAgentId   : '',
    
    /**
	 * @type PeriodicalExecuter 
	 * @description Used to send heartBeat to the HRW engine.
     * @since 1.0
	 */
    _heartBeat  : null,
    
    /**
	 * @type Integer 
	 * @default 300
	 * @description Time between 2 heartbeats in seconds.
     * @since 1.0
	 */
    _heartbeatDelay: 300,
    
    /**
	 * @type Element 
	 * @description Application used for the login.
     * @since 1.0
	 */
    _loginParent: null,
	
	/**
	 * @type Array 
	 * @description List of the companies for the agent.
     * @since 1.0
	 */
	companies: null,
	
	/**
	 * @type Boolean 
	 * @default true
	 * @description Indicate if it is mandatory to have a selecte company or customer to select an employee.
     * @since 1.0
	 */
	custCompMandatory: true,
	
	/**
	 * @type Boolean 
	 * @description Indicate if the search is customer based (or company).
     * @since 1.0
	 */
	customerBased: null,
	
	/**
	 * @type Boolean 
	 * @default false
	 * @description Is the session Lost.
     * @since 1.0
	 */
	sessionLost: false,
	
	/**
	 * @type Boolean 
	 * @default false
	 * @description Is the login call started.
     * @since 1.0
	 */
	_underLogin: false,
	
	/**
	 * @type Hash 
	 * @description List of possible transitions from a status.
     * @since 1.0
	 */
	statusTranslations: null,
	
	/**
	 * Stack with calls to do when there is time. Each entry has the parameters:
	 * <ul>
	 * <li><b>id</b>(<i>String</i>): Identifier of the asked entry generated automatically</li>
	 * <li><b>started</b>(<i>Boolean</i>): Indicate if the call is already started</li>
	 * <li><b>parent</b>(<i>Application</i>): Application that called the service</li>
	 * <li><b>methName</b>(<i>String</i>): Name of the HRW method to call</li>
	 * <li><b>params</b>(<i>Function/JSON Object</i>): List of the method parameters or a method that allow to evaluate them</li>
	 * <li><b>methods</b>(<i>JSON Objects</i>): Success, information, warning and error methods</li>
	 * <li><b>priority</b>(<i>Integer</i>): Indicate if it is better to do the call soon or not (9 = soon, 0 = not urgent)</li>
	 * </ul>
	 * @type Array
	 * @since 2.0
	 */
	callStack: $A(),
	
	/**
	 * Identifier used to create a unique Id to a request
	 * @type Integer
	 * @default 0
	 * @since 2.0
	 */
	stackId: 0,
	
	/**
	 * Indicate if it is permit to start something via the callstack in this moment
	 * @type Boolean
	 * @default true
	 * @since 2.0
	 */
	useCallStack: true,
	
	/**
	 * Table with the pending reasons for the different companies
	 * @type Hash
	 * @since 2.0
	 */
	lastPendReasons: null,
	
	/**
	 * Table with the agents for the different companies
	 * @type Hash
	 * @since 3.0
	 */
	lastAgents: null,
	
	/**
	 * Parameters to the call that get the last dynamic web forms and the corresponding result.
	 * It is interesting to add a cache because in a same ticket, the same parameters occurs often.
	 * For example when taking a ticket in processing, the employees are the same... or if it the same user for requestor/employee.
	 * This table has maximum 2 entries (because there is maximum 2 users by ticket) with each one composed of:
	 * <ul>
	 * <li><b>clientSkillId</b> (<i>String</i>): The company of the customer id</li>
	 * <li><b>employeeId</b> (<i>String</i>): Id of the employee</li>
	 * <li><b>onExistingTicket</b> (<i>Boolean</i>): Indicate if the search is for an existing ticket</li>
	 * <li><b>cacheContent</b> (<i>Json</i>): Content of the corresponding answer</li>
	 * <li><b>lastUsed</b> (<i>Boolean</i>): Indicate if this field was the last used</li>
	 * </ul>
	 * Because the calls could be very close, the parameters are set before the call and the next call wait for the answer.
	 * @type Array
	 * @since 3.0
	 */
	lastDynCompanyInfo: null,

	/**
	 * Hash containing the user email notification preferences
	 * @type Hash
	 * @since 2.0
	 */
	emailNotificationPreferences:$H(),
	
	/**
	 * Indicate the current HRW sessionId
	 * @type string
	 * @since 3.1
	 */
	sessionId: null,
	
	/**
	 * URL of the proxy to use for the service hrw_engine
	 * @type String
	 * @since 3.4
	 */
	_proxyURL: null,
	
	/**
	 * The time difference with UTC
	 * @type Integer
	 * @since 4.0
	 */
	timezoneOffset: 0,
	
	/**
	 * Array with FDE types
	 * @type Array
	 * @since 5.0
	 */
	_fdeType: null,
	
	/**
 	* Max number of tickets allowed to be selected on the pool
 	* @type String
 	* @since 5.1
 	*/
	maxNumberTicketsAssign: null,
	/**
	 * Indicate if they are companies with link in the agent companies
	 * @type boolean
	 * @since 5.3
	 */
	_hasCompaniesWithTicketLinking: null,
	/**
     * @param {Object} parent Application that call the login
     * @description Log in HRW and set the parameters from HRW engine
     * @see HrwEngine#loggedIn
     * @since 1.0
     * <br/>Modified in 4.4
     * <ul>
     * <li>Allow to have a version number</li>
     * </ul>
     */
    login: function(parent) {
        if(hrwEngine.isConnected() || this._underLogin === true) return;
		this.scenarios 			= $H();
		this._underLogin 		= true;
        this._loginParent 		= parent;
        this.timezoneOffset 	= this._convertTimeInt(global.timeDiffUTC.time, global.timeDiffUTC.sign).toString();
		this.lastPendReasons 	= $H();
		this.lastDynCompanyInfo = $A();
		this.lastAgents			= $H();
		this.lastDynCompanyInfo[0]	= {clientSkillId: null, employeeId: null, onExistingTicket: null, cacheContent: null, lastUsed: false};
		this.lastDynCompanyInfo[1]	= {clientSkillId: null, employeeId: null, onExistingTicket: null, cacheContent: null, lastUsed: false};
		
		//Use a different service to login 
		this._loginParent.makeAJAXrequest($H({
		    xml: 
				'<EWS>'
			+		'<SERVICE>HRW_LOGIN</SERVICE>'
            +		'<PARAM>' 
			+			'<I_FORMAT>' + HrwRequest.format.toUpperCase() + '</I_FORMAT>'
			+			'<I_TIMEZONE_OFFSET>' + this.timezoneOffset + '</I_TIMEZONE_OFFSET>'
			+ 			'<I_DATE_FORMAT>' + global.dateFormat + ' ' + global.hourFormat + '</I_DATE_FORMAT>'
			+ 			'<I_APPLICATIONID>EWSSCM</I_APPLICATIONID>'
			//since 4.4 - Allow to edit the version number
			+			'<I_APPLICATIONVERSIONID>' + HrwEngine.VERSION + '</I_APPLICATIONVERSIONID>'
			+			'<I_SESSION_ID>' + __sesid + '</I_SESSION_ID>'
            +		'</PARAM>'
			+	'</EWS>',
	        successMethod: this.loggedIn.bind(this)
        }));
    },
    
	/**
	 * Logout of HRW
	 * @since 3.3
	 * <br/>Modified in 4.4
	 * <ul>
	 * <li>1054175 - Use a separate service to logout</li>
	 * </ul>
	 */
	logout: function(){
		//Remove the call queue if there is one
		this.callStack = $A();
		//Close the heartbeat
		this._heartBeat.stop();
		//Avoid allowing to login again for this session
		this.login 				= function() {};
		this.manageHeartbeat 	= function() {};
		//Call the logout method
		//since 4.4 - 1054175 - Use a different service to logout
		this._loginParent.makeAJAXrequest($H({
		    xml: 
				'<EWS>'
			+		'<SERVICE>HRW_LOGOUT</SERVICE>'
            +		'<PARAM>' 
			+			'<I_AGENT_ID>' + this.scAgentId + '</I_AGENT_ID>'
			+			'<I_SESSION_ID>' + this.sessionId + '</I_SESSION_ID>'
            +		'</PARAM>'
			+	'</EWS>',
	        successMethod: function(event){
				this.scAgentId = null;
				this.sessionId = null;
			}.bind(this)
        }));
	},
	
    /**
     * @param {Object} jsonParams Parameters of the login answer
	 * @description Handler when the user is logged
	 * @see HrwEngine#login
	 * @since 1.0
	 * <br/>Modified in 5.3
	 * <ul>
	 * <li>Indicate for the different companies if they have the link option or not</li>
	 * </ul>
	 * <br/>Modified in 5.2
	 * <ul>
	 * <li>Assign the maximum number of sessions</li>
	 * </ul>
	 */
    loggedIn: function(jsonParams){
		var firstConnection = true;
		
		this._underLogin = false;
		var loginStatus = HrwRequest.getJsonValue(jsonParams, 'AgentLogin.LoginStatus', 'LOGIN_ERROR');
		if (loginStatus != 'SUCCESS') {
			this.sessionLost = true;
			document.fire('EWS:scm_noMoreConnected');
			
			var loginFailurePopup = new infoPopUp({
				closeButton: $H({
					'callBack': function(){
						loginFailurePopup.close();
						delete loginFailurePopup;
					}
				}),
				htmlContent: new Element("div").insert(global.getLabel('HRW_login_error') + ': <br/>' + loginStatus),
				indicatorIcon: 'exclamation',
				width: 600
			});
			
			loginFailurePopup.create();
		}
		else {
			//For IE6, keep a bigger marge with the delay
			if (Prototype.Browser.IE && parseInt(navigator.userAgent.substring(navigator.userAgent.indexOf("MSIE") + 5)) == 6) 
				this._heartbeatDelay = HrwRequest.getJsonValue(jsonParams, 'AgentLogin.HeartBeatDelay', 60, HrwRequest.NUMBER) - 15;
			else this._heartbeatDelay = HrwRequest.getJsonValue(jsonParams, 'AgentLogin.HeartBeatDelay', 60, HrwRequest.NUMBER) - 5;
			this.scAgentId = HrwRequest.getJsonValue(jsonParams, 'AgentLogin.ScAgentId');
			this.sessionId = HrwRequest.getJsonValue(jsonParams, 'AgentLogin.SessionId');
			
			this.resetHeartbeat();
			
			//Indicate if the usage of the proxy is required
			this._bypassSAP = (jsonParams.EWS.useProxy === 'X');
			
			this.statusTranslations = $H();
			
			//If the session was lost, it is a reconnection
			if (this.sessionLost === true) 
				firstConnection = false;
			this.sessionLost = false;
			
			//Set the list of companies for the agent if there are present
			this.companies = $H();
			
			//since 5.2 Get the maximum number of sessions
			this.maxNumberTicketsAssign = HrwRequest.getJsonValue(jsonParams, 'AgentLogin.MaxTicketActionsInBulk', false, HrwRequest.INTEGER);
			//Use the new shortcut method to read a path
			HrwRequest.getJsonArrayValue(jsonParams, 'AgentLogin.Companies.Company').each(function(company){
				this.companies.set(company.CompanySkillId, {
					Name: company.Name,
					EnableTakeOver: (company.EnableTakeOverTicket === 'true'),
					EnableReOpen: (company.EnableReOpenTicket === 'true'),
					OrganizationId: company.OrganizationId,
					hasServiceArea: (company.EnableServiceAreaLevel === "true")
				});
			}, this);
			
			this.customerBased = HrwRequest.getJsonValue(jsonParams, 'AgentLogin.UseCustomerEmployeeSearch', false, HrwRequest.BOOLEAN);
			//since 5.3 - Check if at last one company has the link option
			this._hasCompaniesWithTicketLinking = HrwRequest.getJsonValue(jsonParams, 'AgentLogin.HasCompaniesWithTicketLinking', false, HrwRequest.BOOLEAN);
			//Add the status labels in the list
			HrwRequest.getJsonArrayValue(jsonParams, 'AgentLogin.TicketStatuses.KeyValue').each(function(status){
				global.labels.set('SCM_status_' + status.Key, status.Value);
			}.bind(this));
			
			//Add the action labels in the list
			HrwRequest.getJsonArrayValue(jsonParams, 'AgentLogin.TicketActionTypes.KeyValue').each(function(actionType){
				global.labels.set('SCM_Action_' + actionType.Key, actionType.Value);
			}.bind(this));
			
			//Add the state transitions in the pool tables logic
			HrwRequest.getJsonArrayValue(jsonParams, 'AgentLogin.TicketStatusTransitions.TicketStatusTransition').each(function(transistionFrom){
				var transToTable = $A();
				
				objectToArray(transistionFrom.Transitions["int"]).each(function(transistionTo){
					transToTable.push(transistionTo);
				}.bind(this));
				
				this.statusTranslations.set(transistionFrom.CurrentTicketStatus, transToTable);
			}.bind(this));
			
			//Email notification preferences
			HrwRequest.getJsonArrayValue(jsonParams, 'AgentLogin.EmailNotificationPreferences.EmailNotificationPreference').each(function(emailNotifPreference){
				//Check if a text is retrieved to avoid undefined values
				if (!Object.isUndefined(emailNotifPreference.Name)) {
					if (emailNotifPreference.Value == "true") 
						this.emailNotificationPreferences.set(emailNotifPreference.Id, {
							id: emailNotifPreference.Id,
							name: emailNotifPreference.Name,
							value: true
						});
					else this.emailNotificationPreferences.set(emailNotifPreference.Id, {
						id: emailNotifPreference.Id,
						name: emailNotifPreference.Name,
						value: false
					});
				}
			}.bind(this))
			
			document.fire('EWS:scm_HrwConnected', firstConnection);
		}
	},
	/**
	 * Check if the link ticket operation should be available
	 * @returns {Boolean} Is the link ticket to use?
	 * @since 5.3
	 */
	enableLink: function() {
		return this._hasCompaniesWithTicketLinking;
	},
	/**
	 * Function that indicate if the actions are to display by default in the ticket
	 * @returns {Boolean} Are the actions to display by default
	 * @since 5.1
	 */
    areTicketActionToDisplayByDefault: function() {
		return true;
	},
	/**
     * @description Check if we are connected to HRW.
     * @returns {Boolean} Is the agent connected?
	 * @since 1.0
	 */
	isConnected: function() {
		return (!Object.isEmpty(this.scAgentId) && !Object.isEmpty(this.sessionId));
	},
	
    /**
     * @param {String} time Time with the SAP format HH:mm:ss
     * @param {String} sign + or - depending if the time is to add or subtract
	 * @description Convert a date and a sign into a double
	 * @returns {Integer} Convert the given time to a number of minutes 
	 * @since 1.0
	 */
    _convertTimeInt: function(time, sign) {
        timeInt = new Number(time.substr(0,2)) + (new Number(time.substr(3,2)) / 60) + (new Number(time.substr(6,2)) / 3600);
        if(sign === '-') timeInt = -1 * timeInt;
        
        return timeInt;
    },
    
	/**
	 * Add a new entry in the queue of calls to do once there is time
	 * @param {Application} parent Application that called the call
	 * @param {String} methName Name of the HRW method to call
	 * @param {Function/JSON Object} params List of parameters for the request or a function that load them
	 * @param {Function/String} Function to call in case of success of the AJAX request
	 * @param {JSON Object} methods The methods to call in case of success, information, warning or error
	 * @param {Integer} priority Priority to give to the call. The higher (9) is placed first. By default, it is 0
	 * @returns {String} Id of the generated stack entry.
	 * @since 2.0
	 * @see HrwEngine#callStack
	 */
	addInCallQueue: function(parent, methName, params, successMethod, methods, priority) {
		//Set the default value to the priority
		if(Object.isEmpty(priority)) priority = 0;

		//Generate the list of methods
		if(methods) methods.successMethod = successMethod;
		else methods = {successMethod: successMethod};
		
		//Generate the new id
		var newId = 'CallStackItem_' + this.stackId;
		this.stackId ++;
		
		//Add the call stack entry
		this.callStack.push({
			id		: newId,
			started	: false,
			parent	: parent,
			methName: methName,
			params	: params,
			methods	: methods,
			priority: priority
		});
		
		//Sort the entries by priority
		this.callStack = this.callStack.sortBy(function(entry) {
			return (-1) * entry.priority;
		});

		return newId;
	},
	
	/**
	 * Remove the entry corresponding to an id if it is still in the queue.<br/>
	 * If the element is not started and still in the list, the method return true 
	 * to indicate that the element is really removed. Otherwize, it returns false.
	 * @param {Object} id Id of the call stack item to remove
	 * @since 2.0
	 */
	removeFromCallQueue: function(id) {
		var inQueue 	= false;
		var queueIndex 	= null;

		//It is not permitted to use the call stack if we are removing an entry
		this.useCallStack = false;
		
		//Check if the entry with the given id is in the queue and not started
		this.callStack.each(function(callStackItem, index){
			if(callStackItem.id === id) inQueue = !callStackItem.started;
		}, this);
		
		//If the element is ready to be removed, do it
		if(inQueue)
			this.callStack = this.callStack.reject(function(callStackItem){return (callStackItem.id === id);}, this);
		
		//It is again possible to use the call stack items
		this.useCallStack = true;
		
		return inQueue;
	},
	/**
	 * Get if the element in the queue is :
	 * <ul>
	 * <li>{@link HrwEngine#inQueue} => Waiting in the queue</li>
	 * <li>{@link HrwEngine#inQueueStarted} => In the queue, but started</li>
	 * <li>{@link HrwEngine#notInQueue} => Not in the queue</li>
	 * </ul>
	 * @param {Object} id Identifier of the element to return
	 * @returns {Integer} The status
	 * @since 2.0
	 */
	getQueueItemStatus: function(id) {
		var index			= 0;
		var callStackItem 	= this.callStack[index];
		
		//Look for the first non started queue element
		while(!Object.isEmpty(callStackItem) && callStackItem.id !== id) {
			index ++;
			callStackItem = this.callStack[index];
		}
		if(Object.isEmpty(callStackItem)) return HrwEngine.notInQueue;
		if(callStackItem.started) return HrwEngine.inQueueStarted;
		return HrwEngine.inQueue;
	},
	
	/**
	 * Indicate if there are elements in the queue
	 * @returns {Boolean} Indicate if there is non started in the queue
	 * @since 2.0
	 */
	_hasQueue: function() {
		var hasQueue = false;
		
		//It is not permitted to use the call stack during the check
		this.useCallStack = false;
		
		this.callStack.each(function(callStackItem, index){
			if(callStackItem.started === false) 
				hasQueue = true;
		}, this);
		
		//It is again possible to use the call stack items
		this.useCallStack = true;
		
		return hasQueue;
	},
	
	/**
	 * Call the next element in the queue.
	 * @since 2.0
	 */
	_callQueue: function() {
		var index 			= 0;
		var callStackItem 	= this.callStack[index];
		var methods			= {};
		var params			= $H();
		
		//Look for the first non started queue element
		while(!Object.isEmpty(callStackItem) && callStackItem.started === true) {
			index ++;
			callStackItem = this.callStack[index];
		}
		//If there is nothing found, nothing to do
		if(Object.isEmpty(callStackItem)) return;
		
		//Start the call
		this.callStack[index].started = true;
		
		//Get the list of methods and transform strings-> methods 
		if(callStackItem.methods.errorMethod) {
			if(Object.isString(callStackItem.methods.errorMethod))
				callStackItem.methods.errorMethod = eval('callStackItem.parent.' + callStackItem.methods.errorMethod + '.bind(callStackItem.parent)');
			methods.errorMethod = this._manageCallQueueBack.bind(this, callStackItem.id, callStackItem.methods.errorMethod);
		}
		if(callStackItem.methods.infoMethod) {
			if(Object.isString(callStackItem.methods.infoMethod))
				callStackItem.methods.infoMethod = eval('callStackItem.parent.' + callStackItem.methods.infoMethod + '.bind(callStackItem.parent)');
			methods.infoMethod = this._manageCallQueueBack.bind(this, callStackItem.id, callStackItem.methods.infoMethod);
		} 	
		if (callStackItem.methods.warningMethod) {
			if(Object.isString(callStackItem.methods.warningMethod))
				callStackItem.methods.warningMethod = eval('callStackItem.parent.' + callStackItem.methods.warningMethod + '.bind(callStackItem.parent)');
			methods.warningMethod = this._manageCallQueueBack.bind(this, callStackItem.id, callStackItem.methods.warningMethod);
		}
		if(Object.isString(callStackItem.methods.successMethod))
			callStackItem.methods.successMethod = eval('callStackItem.parent.' + callStackItem.methods.successMethod + '.bind(callStackItem.parent)');
		
		//If the parameters are to retrieve via a function
		if(Object.isFunction(callStackItem.params)) 
			params = callStackItem.params();
		else
			params = callStackItem.params;
		
		//Call the backend	
		this.callBackend(callStackItem.parent, callStackItem.methName, params, this._manageCallQueueBack.bind(this, callStackItem.id, callStackItem.methods.successMethod), true, methods, false);
	},
	
	/**
	 * Method that receive the result of the calls from the queue.
	 * @param {String} id Identifier of the queue item
	 * @param {Function} handlerMethod Handler for the result
	 * @param {JSON Object} resultJson Result of the service
	 * @since 1.1
	 */
	_manageCallQueueBack: function(id, handlerMethod, resultJson) {
		var queueIndex 	= null;

		//Get the index of the element to remove
		this.callStack.each(function(callStackItem, index){
			if(callStackItem.id === id) 
				queueIndex 	= index + 1;
		}, this);
		
		//Remove the element
		if(queueIndex !== null)
			this.callStack = this.callStack.splice(queueIndex, 1);
		
		//Call the result function
		handlerMethod(resultJson);
	},
	
    /**
	 * @description Reset the heartBeat timer
	 * @since 1.0
	 * @see HrwEngine#_heartbeatDelay
	 */
    resetHeartbeat: function() {
        var parameters = $H({
			'scAgentId': this.scAgentId,
			'SessionId': this.sessionId
		});
        
        if(this._heartBeat !== null) this._heartBeat.stop();
        this._heartBeat = new PeriodicalExecuter(function() {
			//If there is something in the queue and it can be used, call something
            if(this._hasQueue() && this.useCallStack) {
				this._callQueue();
				
			//If the queue is not to use, send the heartbeat
			} else {
				//Build the request
	    		var hrw_request = new HrwRequest( {
	                methodName      : 'Session.Heartbeat',
	                methodParams    : parameters,
					bypassSAP		: this.useProxy()
	            });

				var options = $H({
				    xml             : hrw_request.toString(),
			        successMethod   : this.manageHeartbeat.bind(this),
					loading			: false
		        });
		        //Do the request
				if(this.useProxy()) this._callHrwViaProxy(this._loginParent, options);
				else this._loginParent.makeAJAXrequest(options);
			}
        }.bind(this), this._heartbeatDelay);
    },
    
	/**
	 * Indicate if the proxy is to use or not
	 * @returns {Boolean} Indicate if the proxy is to use or not
	 * @since 3.4
	 */
	useProxy: function() {
		//If it si not configured, just return false
		if(this._bypassSAP !== true) return false;
		//Get the proxy URL
		if(this._proxyURL === null) this._proxyURL = this.getProxyUrlForHRW();
		return (this._proxyURL !== false);
	},
	
	/**
	 * Replace the URL to call by the proxy and then put the URL back
	 * @param {Application} The application that try to join the backend
	 * @param {Hash} List of options of the call
	 * @since 3.4
	 */
	_callHrwViaProxy: function(parent, options) {			
		var serviceName = 'hrw_engine';
		var data		= options.get('xml');
		
		//Make the ajax call
		var AJAXREQ = new Ajax.Request(this._proxyURL, {
            method		: 'POST',
			contentType	: 'text/xml',
            asynchronous: true,
            postBody	: data,
            onSuccess: function(req) {
                //Read the answer
				var data;
				if (!Object.isEmpty(req.getHeader("content-Type")) && req.getHeader("content-Type").match(/application\/json/)) {
                    data = req.responseText.evalJSON(true);
                } else {
                    //configure the XML2JSON converter
                    var xml = new XML.ObjTree();
                    xml.attr_prefix = '@';
                    //Parsing the XML
					if(req.responseXML.documentElement)
						data = xml.parseDOM(req.responseXML.documentElement);
					else	
						data = xml.parseXML(req.responseText);
                }
				
				//Monitor the answer
                var error 			= HrwRequest.getJsonValue(data, 'EWS.webmessage_type', '', HrwRequest.STRING, true);
				var errorMessage 	= HrwRequest.getJsonValue(data, 'EWS.webmessage_text', '', HrwRequest.STRING, true);

                // if possible, log the received data
				if (!data || data.parsererror) {
                    object._failureMethod(null, serviceName);
                } else {
					try {
						console.log("SERVICE: ", serviceName);
				        console.log("XML_IN: ", options.get('xml'));
				        if (Prototype.Browser.Gecko || Prototype.Browser.WebKit) {
				            console.dir(data);
				        } else {
				            console.log(displayJSON(data));
				        }
					} catch(e) {}
					
                   	switch(error) {
						case 'E': 
							var errorMethod = options.get('errorMethod');
							if(errorMethod)
								errorMethod(data);
							else
								parent._errorMethod(data);
							break;
						case 'W':  
							var warningMethod = options.get('warningMethod');
							if(warningMethod)
								warningMethod(data);
							else
								parent._warningMethod(data);
							break;
						case 'I':  
							var infoMethod = options.get('infoMethod');
							if(infoMethod)
								infoMethod(data);
							else
								parent._infoMethod(data);
							break;
						default	: 
							options.get('successMethod')(data);	
							break;						
					}
				}
            }.bind(this),
            onFailure: function(req) {
                parent._failureMethod(data, serviceName, req.status);
            }
        });
	},
	
	/**
	 * Method that give the URL to access the proxy and to add it the needed parameters
	 * @param {String} addPath Indicate the addition to the path if needed
	 * @returns {String} The path to use to join the proxy
	 * @since 3.4
	 */
	getProxyUrlForHRW: function(addPath) {
		var urlProtocol = deepCopy(window.location.protocol);
		var urlHost 	= deepCopy(window.location.host);
		var correctUrl 	= '';
		//If the protocol is not https, it means that there is no proxy
		if(urlProtocol.toLowerCase().substr(0, 5) !== 'https') return false; 
		correctUrl = urlProtocol + '//' + urlHost + '/Engine';
		//If there is no additional path, set it ourself with the default value
		if(Object.isEmpty(addPath)) correctUrl += '/Invoke';
		else correctUrl += addPath;
		
		return correctUrl;
	},
	
    /**
     * @param {JSON Object} answerJson HRW engine answer for the heartbeat. This method has to be called in each receiver methods.
	 * @description Manage the result of the heartBeat
	 * @since 1.0
	 * <br/>Modified in 4.4
	 * <ul>
	 * <li>1054175 - Do not display the popup to indicate that the session is lost</li>
	 * </ul>
	 */
    manageHeartbeat: function(answerJson) {
		//Get the heartbeat value
		var heartbeat = HrwRequest.getJsonValue(answerJson, 'EWS.HrwResponse.Heartbeat', null, HrwRequest.NUMBER, true);
		//If there is no hearbeat in the XML, do nothing
		if(heartbeat === null) return;
		var binary = this._convertToBinary(heartbeat);
		
		//If there is no more heart beat
        if(binary.substr(10,1) === '0') {
			if(this.sessionLost === false) {
				//since 4.4 - 1054175 - Do not display the popup to indicate that the session is lost
				/*var noSessionPopup = new infoPopUp({
                    closeButton     : $H( {'callBack': function() {noSessionPopup.close(); delete noSessionPopup;}}),
                    htmlContent     : new Element("div").insert(global.getLabel('HRW_session_lost') + '<br/>' + global.getLabel('HRW_session_problem')),
                    indicatorIcon   : 'exclamation',                    
                    width           : 600
                });   
                
                noSessionPopup.create();*/
				
                this.scAgentId = '';  
				this._heartBeat.stop();
				this.sessionLost = true;
				document.fire('EWS:scm_noMoreConnected');

				this.login(this._loginParent);
			}
		
		//If the heart beat is correct
		} else {
			this.resetHeartbeat();
			//Check if there is a notification
			if (binary.substr(0, 9).indexOf('1') >= 0) {
				document.fire('EWS:SCM_GetNewNotifications', {
					hasStandardNotif	: (binary.substr(1,1) == '1'),
					hasCompanyMessages	: (binary.substr(8,1) == '1')
				});
			}
		}
    },
	
	/**
     * @param {Integer} number The number to convert
     * @param {Integer} maxExp Maximum size of the binary result (If non indicated => 10)
	 * @description Convert a positive number to its binary value
	 * @returns {String} The binary value
	 * @since 1.0
	 */
	_convertToBinary: function(number, maxExp) {
		if(Object.isEmpty(maxExp)) maxExp = 10;
		var binary 	= '';
		var dec		= 0;
		var rest	= number;
		
		for(var exp = maxExp; exp >= 0; exp--) {
			dec = Math.pow(2, exp);
			if(rest >= dec) {
				binary 	+= '1';
				rest	-= dec;
			} else
				binary 	+= '0';
		}
		
		return binary;
	},
	
    /**
     * @param {Application} parent Application that call the HRW engine
	 * @param {String} methodName Name of the backend method
	 * @param {Hash} parameters List of the parameters 
	 * @param {String} successMethod Name of a method in the parent caller to call if success
	 * @param {Boolean} forceNoCache Force to get the values from backend
	 * @param {Object} methods Information and error methods if any (errorMethod, infoMethod, warningMethod)
	 * @description Generic method to call the backend<br/>
	 * @since 1.0
	 */
	callBackend : function(parent, methodName, parameters, successMethod, forceNoCache, methods) {
		var options = $H();

		//Get the list of methods and transform strings-> methods 
		if (methods) {
			if(methods.errorMethod) {
				if(Object.isString(methods.errorMethod))
					methods.errorMethod = eval('parent.' + methods.errorMethod + '.bind(parent)');
				options.set('errorMethod', hrwEngine._manageCallBack.bind(hrwEngine, methodName, parameters, methods.errorMethod, null));
			}
			if(methods.infoMethod) {
				if(Object.isString(methods.infoMethod))
					methods.infoMethod = eval('parent.' + methods.infoMethod + '.bind(parent)');
				options.set('infoMethod', hrwEngine._manageCallBack.bind(hrwEngine, methodName, parameters, methods.infoMethod, null));
			} 	
			if (methods.warningMethod) {
				if(Object.isString(methods.warningMethod))
					methods.warningMethod = eval('callStackItem.parent.' + callStackItem.methods.warningMethod + '.bind(callStackItem.parent)');
				options.set('warningMethod', hrwEngine._manageCallBack.bind(hrwEngine, methodName, parameters, methods.warningMethod, null));
			}
		}
		
		//Bind the success method
		if(Object.isString(successMethod))
			successMethod = eval('parent.' + successMethod + '.bind(parent)');

		//For the login method or if the HRW session is already created
	    if(hrwEngine.isConnected() || methodName === 'Session.Login') {
			//If the parameters was created before the login, the agent Id could be wrong
	        if (methodName != 'Session.Login') {
				parameters.set('scAgentId', hrwEngine.scAgentId);
				parameters.set('SessionId', this.sessionId);
			}
			if(forceNoCache !== true && hrwEngine._useCache(parent, methodName, parameters, successMethod) === true) return;

	        //Build the request
    		var hrw_request = new HrwRequest( {
                methodName      : methodName,
                methodParams    : parameters,
				bypassSAP		: this.useProxy()
            });
			
	        //Do the request
	        var timerId = null;
			if(this._computeTime) timerId = this._startTimer(methodName, hrw_request.toString());
			options.set('xml', hrw_request.toString());
			options.set('successMethod', hrwEngine._manageCallBack.bind(hrwEngine, methodName, parameters, successMethod, timerId));
			if(this.useProxy()) this._callHrwViaProxy(parent, options);
			else parent.makeAJAXrequest(options);
	        return;
	    }
	    //If there is a request that is called before the login => wait to have it
		new PeriodicalExecuter(function(pe) {
			if(hrwEngine.isConnected()) {
				pe.stop();
		        parameters.set('scAgentId', hrwEngine.scAgentId);
				parameters.set('SessionId', this.sessionId);
				
				if(forceNoCache !== true && hrwEngine._useCache(parent, methodName, parameters, successMethod) === true) return;
		        
				//Build the request
        		var hrw_request = new HrwRequest( {
	                methodName      : methodName,
	                methodParams    : parameters,
					bypassSAP		: this.useProxy()
                });

		        //Do the request
		        var timerId = null;
				if(this._computeTime) timerId = this._startTimer(methodName, hrw_request.toString());
		        options.set('xml', hrw_request.toString());
				options.set('successMethod', hrwEngine._manageCallBack.bind(hrwEngine, methodName, parameters, successMethod, timerId));
				if(this.useProxy()) this._callHrwViaProxy(parent, options);
				else parent.makeAJAXrequest(options);
		        return;
		    }
		}.bind(this), 1);
	},
	
	/**
	 * Method that manage the come back of a call to HRW
	 * @param {String} methodName Name of the backend method
	 * @param {Hash} parameters List of the parameters
	 * @param {JSON Object} resultJson Result from HRW
	 * @param {String} timerId Identifier of the monitoring entry in the global table
	 * @param {Function} handlerMethod Method to call to execute to manage the result
	 * @since 1.1
	 */
	_manageCallBack: function(methodName, parameters, handlerMethod, timerId, resultJson) {
		//Stop the timer if needed
		var elapsedTime = HrwRequest.getJsonValue(resultJson, 'EWS.HrwResponse.ElapsedTime', null, HrwRequest.INTEGER, true);
		if(elapsedTime !== null) this._computeTime = (elapsedTime >= 0);
		if(timerId) this._stopTimer(timerId, resultJson);
		
		//Manage the heartBeat
		hrwEngine.manageHeartbeat(resultJson);
		
		//Save the result in the cache if needed
		this._saveInCache(methodName, parameters, resultJson);
		
		//Call the result function
		handlerMethod(resultJson);
	},
	
	/**
     * @param {Object} parent Application that call the HRW engine
	 * @param {String} methodName Name of the backend method
	 * @param {Hash} parameters List of the parameters 
	 * @param {String} successMethod Name of a method in the parent caller to call if success
	 * @description Get some informations from the cache
	 * @returns {Boolean} Is there a result to use from the cache
	 * @since 1.0
	 * <br/>Modified for 5.0
	 * <ul>
	 * <li>Add a cache for the backend call TicketPool.CollectAvailableFastDataEntryTypes</li>
	 * </ul>
	 */
	_useCache: function(parent, methodName, parameters, successMethod) {
		var successMethodBinded = successMethod;
		if(Object.isString(successMethodBinded)) 
			successMethodBinded = eval('parent.' + successMethod + '.bind(parent)');

		switch (methodName) {
			case 'Admin.CollectCompanies':
				if(this.companies !== null) {
					successMethodBinded(this.companies);
					return true;
				}
				break;
			//Collect the pending reasons for the different companies
			case 'Admin.CollectPendingReasons':
				var reasons = this.lastPendReasons.get(parameters.get('CompanySkillId'));
				if(!Object.isEmpty(reasons)) {
					successMethodBinded(reasons);
					return true;
				}	
				break;
				
			//Collect the agents for the different companies
			case 'Admin.CollectScheduleTicketAgents':
				var lastAgent = this.lastAgents.get(parameters.get('CompanySkillId'));
				if(!Object.isEmpty(lastAgent)) {
					successMethodBinded(lastAgent);
					return true;
				}	
				break;	
				
			//Add a cache on the last getDynamic web forms
			case 'Backend.GetDynamicCompanyInfo':
				var lastDynCompanyInfo = null;
				
				//Check if there is already a result from the cache
				if(parameters.get('clientSkillId') 				=== this.lastDynCompanyInfo[0].clientSkillId
						&& parameters.get('employeeId')			=== this.lastDynCompanyInfo[0].employeeId
						&& parameters.get('onExistingTicket') 	=== this.lastDynCompanyInfo[0].onExistingTicket) 
					lastDynCompanyInfo = this.lastDynCompanyInfo[0];
					
				else if(parameters.get('clientSkillId') 		=== this.lastDynCompanyInfo[1].clientSkillId
						&& parameters.get('employeeId') 		=== this.lastDynCompanyInfo[1].employeeId
						&& parameters.get('onExistingTicket') 	=== this.lastDynCompanyInfo[1].onExistingTicket)
					lastDynCompanyInfo = this.lastDynCompanyInfo[1];
				
				//If there is something matching in the cache
				if(lastDynCompanyInfo !== null) {
					if(lastDynCompanyInfo.cacheContent !== null)
						successMethodBinded(lastDynCompanyInfo.cacheContent);
					else
						new PeriodicalExecuter(function(pe) {
							if(parameters.get('clientSkillId') 				=== successMethodBinded.clientSkillId
									&& parameters.get('employeeId') 		=== successMethodBinded.employeeId
									&& parameters.get('onExistingTicket')	=== successMethodBinded.onExistingTicket
									&& successMethodBinded.cacheContent 	!== null) {
								pe.stop();
								successMethodBinded(successMethodBinded.cacheContent);
							}
						}.bind(this), 1);
					
					return true;
				}
				
				//Replace the older entry
				if (!this.lastDynCompanyInfo[0].lastUsed) {
					lastDynCompanyInfo = this.lastDynCompanyInfo[0];
					this.lastDynCompanyInfo[1].lastUsed = false;
				} else if (!this.lastDynCompanyInfo[1].lastUsed) {
					lastDynCompanyInfo = this.lastDynCompanyInfo[1];
					this.lastDynCompanyInfo[0].lastUsed = false;
				}
					
				
				//Update its content
				lastDynCompanyInfo.lastUsed = true;
				lastDynCompanyInfo.clientSkillId 	= parameters.get('clientSkillId');
				lastDynCompanyInfo.employeeId		= parameters.get('employeeId');
				lastDynCompanyInfo.onExistingTicket= parameters.get('onExistingTicket');
				lastDynCompanyInfo.cacheContent	= null;
				break;
			//since 5.0 Get FDE Types if existing
			case 'TicketPool.CollectAvailableFastDataEntryTypes':
				if (this._fdeTypes) {
					successMethodBinded(this._fdeTypes);
					return true;
				}
				break;

		}
		return false;
	},
	
	/**
	 * Save a result in the cache if needed
	 * @param {String} methodName Name of the backend method
	 * @param {Hash} parameters List of the parameters 
	 * @param {JSON Object} jsonResults Results of the call from HRW
	 * @returns {Boolean} Is there something saved in the cache
	 * @since 1.1
	 * <br/>Modified for 5.0
	 * <ul>
	 * <li>Add a cache for the backend call TicketPool.CollectAvailableFastDataEntryTypes</li>
	 * </ul>
	 */
	_saveInCache: function(methodName, parameters, jsonResults) {
		switch (methodName) {
			//Save the pending reasons for the different companies
			case 'Admin.CollectPendingReasons':
				this.lastPendReasons.set(parameters.get('CompanySkillId'), jsonResults);
				return true;		
			
			//Save the list of agents for the different companies
			case 'Admin.CollectScheduleTicketAgents':
				this.lastAgents.set(parameters.get('CompanySkillId'), jsonResults);
				return true;
			
			//Save the result of the dynamic web forms
			case 'Backend.GetDynamicCompanyInfo':
				if(parameters.get('clientSkillId') === this.lastDynCompanyInfo[0].clientSkillId
					&& parameters.get('employeeId') === this.lastDynCompanyInfo[0].employeeId
					&& parameters.get('onExistingTicket') === this.lastDynCompanyInfo[0].onExistingTicket) {
						this.lastDynCompanyInfo[0].cacheContent = jsonResults;
						return true;
					}
				else if(parameters.get('clientSkillId') === this.lastDynCompanyInfo[1].clientSkillId
					&& parameters.get('employeeId') === this.lastDynCompanyInfo[1].employeeId
					&& parameters.get('onExistingTicket') === this.lastDynCompanyInfo[1].onExistingTicket) {
						this.lastDynCompanyInfo[1].cacheContent = jsonResults;
						return true;
					}
				break;
			//since 5.0 Save FDE types
			case 'TicketPool.CollectAvailableFastDataEntryTypes':
				this._fdeTypes = jsonResults;
				return true;
		}
		return false;
	},
	
	/**
	 * Returns the email notification preferences
	 * @returns Hash The email notification preferences
	 * @since 2.0
	 */
	getEmailNotificationPreferences:function(){
		return this.emailNotificationPreferences;
	},
	
	/**
	 * Add a new entry in the list of save time recordings
	 * @param {String} methodName Name of the called method
	 * @param {String} xmlIn The XML in
	 * @since 3.4
	 */
	_startTimer: function(methodName, xmlIn) {
		this._timerIndex ++;
		
		if(Object.isEmpty(this._timeSaved)) this._timeSaved = $H();
		this._timeSaved.set('Record_' + this._timerIndex ,{
			serviceName		: methodName,
			frontBegin		: (new Date()).getTime(),
			frontDuration	: 0,
			sapDuration		: 0,
			xmlInSize		: (xmlIn)?xmlIn.length:0,
			jsonOutSize		: 0,
			engineDuration	: 0
		});
		
		return 'Record_' + this._timerIndex;
	},
	
	/**
	 * Set the output parameters of the time tracing
	 * @param {String} id Identifier of the entry
	 * @param {Json} jsonOut XML out
	 * @since 3.4
	 */
	_stopTimer: function(id, jsonOut) {
		var timeEntry 	= this._timeSaved.get(id);
		if(Object.isEmpty(timeEntry)) return;
		
		timeEntry.frontDuration		= (new Date()).getTime() - timeEntry.frontBegin;
		if(jsonOut) {
			if(jsonOut.EWS.o_runtime) timeEntry.sapDuration = jsonOut.EWS.o_runtime;
			timeEntry.jsonOutSize = Object.toJSON(jsonOut).length;
			if(jsonOut.EWS.HrwResponse.ElapsedTime)	timeEntry.engineDuration = jsonOut.EWS.HrwResponse.ElapsedTime;
		}
		//If there is no engine duration, do not add the entry
		if(parseInt(timeEntry.engineDuration) < 0) this._timeSaved.unset(id);
		
		if(this._timeSaved.size() >= this._timerNumItems) this._sendTimerToSap();
	},
	
	/**
	 * Send the stored informations on the time tracing to SAP
	 * @since 3.4
	 */
	_sendTimerToSap: function() {
		//Get the browser version
		var browserID = null;
		var versionID;
		var verOffset;
		
		$H({
			'MSIE'		: 'IE', 
			'Opera'		: 'OP', 
			'Chrome'	: 'CH', 
			'Safari'	: 'SF', 
			'Firefox'	: 'FF'
		}).each(function(browser) {
			verOffset = navigator.userAgent.indexOf(browser.key);
			if(verOffset >= 0) {
				var versionTmp;
				browserID 	= browser.value;
				versionTmp 	= navigator.userAgent.substring(verOffset + browser.key.length + 1);
				versionID	= versionTmp.split(/[.; ]/)[0];
			}
		});
		if(browserID === null) {
			browserID = 'OT';
			versionID = '/';	
		}
		
		//Create the template for SAP
		var recordingTempl = new Template(
								'<YGLUI_STR_SCM_MONITOR_REC>'
							+		'<PERNR>' + global.objectId + '</PERNR>'
							+		'<SERVICE>#{serviceName}</SERVICE>'
							+		'<FRONT_DURATION>#{frontDuration}</FRONT_DURATION>'
							+		'<SAP_DURATION>#{sapDuration}</SAP_DURATION>'
							+ 		'<ENGINE_DURATION>#{engineDuration}</ENGINE_DURATION>'
							+		'<IN_SIZE>#{xmlInSize}</IN_SIZE>'
							+		'<OUT_SIZE>#{jsonOutSize}</OUT_SIZE>'
							+		'<BROWSER>' + browserID + '</BROWSER>'
							+		'<BROWSER_VERSION>' + versionID + '</BROWSER_VERSION>'
							+	'</YGLUI_STR_SCM_MONITOR_REC>');
		
		//Build the table content to send
		var toDelete = $A();					
		var timeSaved = '';
		this._timeSaved.each(function(timeData) {
			if(timeData.value.frontDuration <= 0) return;
			timeSaved += recordingTempl.evaluate(timeData.value);
			toDelete.push(timeData.key);
		}, this);
		
		//Delete the stored entries
		toDelete.each(function(toDel) {this._timeSaved.unset(toDel)}, this);
		
		if(timeSaved === '') return;
		
		this._loginParent.makeAJAXrequest($H({
		    xml: 
				'<EWS>'
			+		'<SERVICE>HRW_MONITORING</SERVICE>'
            +		'<PARAM>'
			+			'<I_RECORDS>' + timeSaved + '</I_RECORDS>'
			+		'</PARAM>'
			+	'</EWS>',
	        successMethod: this.loggedIn.bind(this)
        }));	
	}
});
/**
 * Version of the SCM frontend
 * @type String(max 20 chars)
 * @since 4.4
 */
HrwEngine.VERSION = '2.8.10.1';
/**
 * One of the possible status for an element in the queue.
 * Indicate that the element is waiting in the queue
 * @type Integer
 * @since 2.0
 */
HrwEngine.inQueue = 0;

/**
 * One of the possible status for an element in the queue.
 * Indicate that the element is in the queue but the execution started
 * @type Integer
 * @since 2.0
 */
HrwEngine.inQueueStarted = 1;

/**
 * One of the possible status for an element in the queue.
 * Indicate that the element is not in teh queue
 * @type Integer
 * @since 2.0
 */
HrwEngine.notInQueue = 2;

/**
 * Default value to the HRW engine that there is nothing in a field
 * @type string
 * @since 2.0
 */
HrwEngine.NO_VALUE = '-2147483648';

/**
 * Identifier of the "Properties" tab in the ticket details screen
 * @type String
 * @since 1.0
 */
HrwEngine.scm_ticketApp_PROPERTIES = 'Properties';
/**
 * Identifier of the "Documents" tab in the ticket details screen
 * @type String
 * @since 1.0
 */
HrwEngine.scm_ticketApp_DOCUMENTS  = 'Documents';
/**
 * Identifier of the "Tasks" tab in the ticket details screen
 * @type String
 * @since 1.0
 */
HrwEngine.scm_ticketApp_TASKS 	 = 'Tasks';

if(!hrwEngine)
	var hrwEngine = new HrwEngine();
	
	
/**
 * Methods not deleted for compatibility reasons
 */
HrwRequest.getSingleValue = function(json, path, defaultValue){
	return HrwRequest.getJsonValue(json, path, defaultValue);
};
HrwRequest.getArrayValue = function(json, path){
	return HrwRequest.getJsonArrayValue(json, path);
};