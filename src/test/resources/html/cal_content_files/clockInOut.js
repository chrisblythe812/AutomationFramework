/**
 * @fileoverview clockInOut.js
 * @description this is the pop-up where we will be able to perform clock-in's/out's for our users
 */
 
/**
 * @constructor timeClocking
 * @description Creates our application
 * @arguments Application
 */
var timeClocking = Class.create(Application,
{
    /**
    * @type {String}
    * @description application id
    */
    appId:null,
    
    /**
    * @type {String}
    * @description employee id
    */
    empId:null,
    
    /**
    * @type {String}
    * @description object type of the employee
    */
    objType:null,
    
    /**
    * @type {String}
    * @description variable used to store the name of the service which retrieves the structure of the clockings
    */
    getClockingsService:'GET_CLOCKINGS',
    
    /**
    * @type {String}
    * @description variable used to store the name of the service which retrieves the values for the reason
    */
    getReasonsService:'GET_ABWGR_VAL',
    
    /**
    * @type {String}
    * @description variable used to store the name of the service which save the clockings
    */
    saveClockingsService:'SAVE_REQUEST',
    
    /**
    * @type {Hash}
    * @description Hash containing the codes for every clocking button
    */
    buttonsCodes:$H(),

    initialize: function($super, args) {
        $super(args);
    },
    
    run: function($super, args) {
        $super(args);
        var arguments = args.get("app");
        this.appId = arguments.appId;
        this.empId = arguments.selectedEmployee.id;
        this.objType = arguments.selectedEmployee.objectType;        
        this.getInitialStructure();        
    },
    
    getInitialStructure: function(){
        this.getClockings("start");
    },
    
    /**
    * @description: it gets the initial structure of our application calling the right service   
    * @param mode: "start" if we are creating the application from the beginning or "reload" if we are refreshing it        
    */
    getClockings: function(mode){
        var xml = 
            "<EWS>"+
                "<SERVICE>" + this.getClockingsService + "</SERVICE>"+
                "<OBJ TYPE='" + this.objType + "'>" + this.empId + "</OBJ>"+
                "<PARAM>"+
                    "<APPID>" + this.appId + "</APPID>"+
                    "<WID_SCREEN>*</WID_SCREEN>"+
                "</PARAM>"+
            "</EWS>";     
        if(mode == "start"){
            this.makeAJAXrequest($H({
                xml: xml,
                successMethod: this.buildInitialStructure.bind(this)
            })); 
        }else if(mode == "reload"){
            this.makeAJAXrequest($H({
                xml: xml,
                successMethod: this.refreshClockings.bind(this)
            })); 
        }                   
    },
    
    /**
    * @description: it builds our initial structure
    * @param json: the json which contains the information we need
    */
    buildInitialStructure: function(json){  
        this.storeButtonsCodes(json);   
        this.getReasonService(json);  
        this.buildDateandHour(json);
        this.virtualHtml.insert("<br>");    //new line
        this.buildButtons(json);
        this.virtualHtml.insert("<br>");    //new line
        this.buildReasonSelection();
        this.buildClockingsRecord(json);
    },
    
    /**
    * @description: get the service name to get the reason list
    * @param json: the json which contains the information we need
    */
    getReasonService: function(json){   
        if (Object.jsonPathExists(json, 'EWS.o_field_settings.yglui_str_wid_fs_record.fs_fields.yglui_str_wid_fs_field')) {   
            var fields = objectToArray(json.EWS.o_field_settings.yglui_str_wid_fs_record.fs_fields.yglui_str_wid_fs_field);
            for (var i = 0; i < fields.length; i++) {
                if (fields[i]['@fieldid'] == 'ABWGR'){
                    this.getReasonsService = fields[i]['@service_values']
                    break;
                }
            }
        }
    },

    /**
    * @description: it builds the hash with the codes for every button
    * @param json: the json which contains the information we need
    */
    storeButtonsCodes: function(json){      
        this.buttonsCodes.set("o_app_clk_bin",json.EWS.o_app_clk_bin);
        this.buttonsCodes.set("o_app_clk_bout",json.EWS.o_app_clk_bout);
        this.buttonsCodes.set("o_app_clk_in",json.EWS.o_app_clk_in);
        this.buttonsCodes.set("o_app_clk_out",json.EWS.o_app_clk_out);
    },
    
    /**
    * @description: it builds the date + hour title
    * @param json: the json which contains the information we need
    */
    buildDateandHour: function(json){
        this.date = new Element ( 'div',
            {
            'id':'clockings_title_date',
            'class':'application_main_title3' 
            }
        ); 
        this.virtualHtml.update(this.date);        
        this.initialTime = json.EWS.o_loc_time + " " + json.EWS.o_loc_date;        
        this._getTime();        
    },
    
    /**
    * @description: it builds the buttons 
    * @param json: the json which contains the information we need
    */
    buildButtons: function(json){                
        var buttonsContainer = new Element('div',{
            'id':'clocking_main_buttons_div'                        
        });
        if(global.liteVersion){
            buttonsContainer.addClassName("inlineContainer");
        }
        var buttons = json.EWS.o_clk_buttons.yglui_str_wid_button;
        var thereAreBreakButtons = (buttons.size() > 2) ? true: false;
        var clockingButtonsDiv = new Element('div', {
                'id':'clocking_buttons_div'               
        }); 
        if(global.liteVersion){
            clockingButtonsDiv.addClassName("inlineElement");
        }
        buttonsContainer.insert(clockingButtonsDiv);
        this.virtualHtml.insert(buttonsContainer);
        if(thereAreBreakButtons){            
            var breakButtonsDiv = new Element('div', {
                'id':'break_buttons_div'                         
            });
            if(global.liteVersion){
                breakButtonsDiv.addClassName("inlineElement");
            }
            buttonsContainer.insert(breakButtonsDiv);            
            var BBJsonContainer = (//container of break buttons
                {
                    elements:[],
                    defaultButtonClassName:'application_text_bolder'
                }
            );
        }        
        var buttonJson;
        var CBJsonContainer = ( //container for clocking buttons
            {
                elements:[],
                defaultButtonClassName:'application_text_bolder'
            }
        );
        for(var i=0;i < buttons.size();i++){              
            buttonJson = (
                {
                    label: buttons[i]["@label_tag"],
                    idButton: buttons[i]["@action"] + "_BUTTON",
                    handler: this.saveClockings.bind(this,json,buttons[i]["@action"]),                     
                    type: 'button',
                    standardButton : true
                }
            );    
            if(buttons[i]["@action"].include("CLK_B")){ // it's a break button
                BBJsonContainer.elements.push(buttonJson); 
            }else{  //it's a clocking button
                CBJsonContainer.elements.push(buttonJson); 
            }
        }
        var buttonsContainer;
        if(thereAreBreakButtons){
            this.BButtonsContainer = new megaButtonDisplayer(BBJsonContainer);
            breakButtonsDiv.update(this.BButtonsContainer.getButtons());
        }
        this.CButtonsContainer = new megaButtonDisplayer(CBJsonContainer);
        clockingButtonsDiv.update(this.CButtonsContainer.getButtons());
        
        this.enableDisableButtons(buttons);        
    },
    
    /**
    * @description: it enables/disables the buttons
    * @param buttons: an array with the buttons json  
    */
    enableDisableButtons: function(buttons){
        for(var i=0;i < buttons.size();i++){
            if(buttons[i]["@showindisplay"] == "X"){
                if(buttons[i]["@action"].include("CLK_B")){ // it's a break button
                    this.BButtonsContainer.disable(buttons[i]["@action"] + '_BUTTON');
                }else{
                    this.CButtonsContainer.disable(buttons[i]["@action"] + '_BUTTON');
                }
            }else{
                if(buttons[i]["@action"].include("CLK_B")){ // it's a break button
                    this.BButtonsContainer.enable(buttons[i]["@action"] + '_BUTTON');
                }else{
                    this.CButtonsContainer.enable(buttons[i]["@action"] + '_BUTTON');
                }
            }
                
        }
    },
    
    /**
    * @description: it builds the reason selection part     
    */
    buildReasonSelection: function(){
        var label = global.getLabel("rc_reason");
        var reasonDiv = new Element('div',{
                'id':'reason_div',
                'class':'inlineContainer application_clockings_reason_div'
            }
        );
        var labelReasonDiv = new Element('div',{
            'id':'label_reason_div',
            'class':'inlineElement application_clockings_label_div'
            }
        );
        labelReasonDiv.update(label);
        if(global.liteVersion){
            labelReasonDiv.writeAttribute("title",global.getLabel("rc_reason"));
        }
        this.autoCompleterReasonDiv = new Element('div',{
            'id':'autoCompleter_reason_div',
            'class':'inlineElement application_clockings_autocompleter'
            }
        );
        reasonDiv.insert(labelReasonDiv);
        reasonDiv.insert(this.autoCompleterReasonDiv);
        this.virtualHtml.insert(reasonDiv);
        this.createReasonAutoCompleter();
    },
        
    
    /**
    * @description: it will retrieve the list of reasons through the right service
    * and after that it will create the autocompleter already filled    
    */
    createReasonAutoCompleter: function(){
        var xml =   "<EWS>"+
                    "<SERVICE>" + this.getReasonsService + "</SERVICE>" +
                    "<OBJ TYPE='" + this.objType + "'>" + this.empId + "</OBJ>"+
                    "<PARAM>"+
                        "<APPID>" + this.appId + "</APPID>"+
                        "<WID_SCREEN>1</WID_SCREEN>"+
                        "<STR_KEY/>"+
                        "<FIELD FIELDID='ABWGR' FIELDTECHNAME='ABWGR' VALUE=''/>"+
                        "<DEP_FIELDS/>"+
                        "<SEARCH_PATTERN/>"+
                    "</PARAM>"+
                    "<DEL/>"+
                    "</EWS>";        
        this.makeAJAXrequest($H({
                    xml: xml,
                    successMethod: this.fillAutocompleter.bind(this)                    
        }));          
        
    },
    
    /**
    * @description: it creates the autocompleter with the reasons
    * @param json: the json where the list of reasons is    
    */
    fillAutocompleter: function(json){                  
        var reasonsArray = new Array();
        if(!Object.isEmpty(json.EWS.o_values)){
            var reasonsList = objectToArray(json.EWS.o_values.item);
            for (var i=0;i < reasonsList.size();i++){
                var pair = {
                    data:"",
                    text:""
                };
                pair.data = reasonsList[i]["@id"];
                pair.text = reasonsList[i]["@value"];
                reasonsArray.push(pair);
            }
        }
        var jsonAutoCompleter = {
            autocompleter:{
                object: reasonsArray
                ,
                multilanguage:{
                    no_results:global.getLabel("noResults"),
                    search:global.getLabel("DM_SEARCH")
                }
            }
        };
        this.autocompleter = new JSONAutocompleter('autoCompleter_reason_div', {                              
                    showEverythingOnButtonClick: true,
                    timeout: 1000,
                    templateResult: '#{text}',
                    templateOptionsList: '#{text}',
                    minChars: 1
        },jsonAutoCompleter);
        this.autoCompleterReasonDiv.show();                                               
    },
    
    /**
    * @description: it builds and show the clockings register
    * @param json: it contains the information about the clockings
    */
    buildClockingsRecord: function(json){
        this.registerContainer = new Element('div',{
                'id':'clockingsRegisterContainer',
                'class':'application_clockings_records_div'
            }
        );
        this.virtualHtml.insert(this.registerContainer);
        this.showRecords(json);
    },
    
    /**
    * @description: it saves the clocking related to the button we have pressed
    * @param json: the json with information about the clockings
    * @param clockingType: the id of the button which we have pressed
    */
    saveClockings: function(json,clockingType){       
        var clockingData;
        var actionCodeType = "o_" + clockingType.toLowerCase();
        var actionCode = this.buttonsCodes.get(actionCodeType);
        var button; 
        if(!Object.isEmpty(this.autocompleter.getValue() ) ){
            var reason = this.autocompleter.getValue().idAdded; 
        }else{
            var reason = "";
        }
        clockingData = this.getRecord(json,actionCode,reason);
        button = this.getClockingButton(json,clockingType);  
        var xmlToSave = {
            EWS: {
                SERVICE: this.saveClockingsService,
                OBJ: { '@TYPE': this.objType, '#text': this.empId },
                PARAM: {                    
                    APPID: this.appId,
                    RECORDS: clockingData,
                    BUTTON: button                   
                },
                DEL:{
                }
            }
        }                
        var json2xml = new XML.ObjTree();
        json2xml.attr_prefix = '@';
        this.disableAllButtons(json);
        this.makeAJAXrequest($H({
                    xml: json2xml.writeXML(xmlToSave),
                    successMethod: this.getClockings.bind(this,"reload")                    
        }));                            
    },        
    
    /**
    * @description: it disables all the buttons
    * @param json: the json where we have the information related to the buttons
    */
    disableAllButtons: function(json){
        var buttons = json.EWS.o_clk_buttons.yglui_str_wid_button;       
        for(var i=0;i < buttons.size();i++){
            if(buttons[i]["@action"].include("CLK_B")){ // it's a break button
                this.BButtonsContainer.disable(buttons[i]["@action"] + '_BUTTON');
            }else{
                this.CButtonsContainer.disable(buttons[i]["@action"] + '_BUTTON');
            }                   
        }
    },
    
    /**
    * @description: it reload the register of clockings and enables/disables the corresponding buttons
    * @param json: the json with the clockings and the information about clockings 
    */
    refreshClockings: function(json){              
        this.showRecords(json);
        this.enableDisableButtons(json.EWS.o_clk_buttons.yglui_str_wid_button);
    },
    
    /**
    * @description: it shows the clockings register
    * @param json: the json which contains the clockings register
    */
    showRecords: function(json){     
        this.registerContainer.update();
        if(!Object.isEmpty(json.EWS.o_field_values) ){
        var clockingsArray = objectToArray(json.EWS.o_field_values.yglui_str_wid_record);
        var clockingFields;  
        var hashOfLines = new Hash();   //here we store the records lines identified by the pair("A1","B1","A2",etc.)      
        for(var i=0;i < clockingsArray.size();i++){
            clockingFields = clockingsArray[i].contents.yglui_str_wid_content.fields.yglui_str_wid_field;
            var reason,ending,time,pair,type,iconStyle;
            for(var j=0;j < clockingFields.size();j++){
                switch (clockingFields[j]["@fieldtechname"]){
                    case "ABWGR":
                        reason = clockingFields[j]["@value"];
                        break;
                    case "COUT":
                        ending = Object.isEmpty(clockingFields[j]["@value"]) ? false : true;
                        break;
                    case "LTIME":
                        time = clockingFields[j]["@value"];
                        break;
                    case "PAIR":
                        pair = clockingFields[j]["@value"];
                        break;
                    default:
                        break;
                }
            }
            type = this.getClockingType(ending,pair);   
            switch (type){
                case "clock-in":
                    //iconStyle = "application_clockings_ClockInIcon";
                    iconStyle = "application_icon_green";
                    break;
                case "clock-out":
                    //iconStyle = "application_clockings_ClockOutIcon";
                    iconStyle = "application_icon_red";
                    break;      
                case "break-in":
                    //iconStyle = "application_clockings_BreakInIcon";
                    iconStyle = "application_icon_green";
                    break; 
                case "break-out":
                    //iconStyle = "application_clockings_BreakOutIcon";
                    iconStyle = "application_icon_red";
                    break; 
                default:
                    break;
            }
            if(!ending){
                var clockingLineContainer = new Element('div',{
                    'id': pair+"Line",
                    'class':'inlineContainer'
                });
                hashOfLines.set(pair,clockingLineContainer);
                var clockingLineIn = new Element('div',{
                    'id': pair+"LineIn",
                    'class': 'inlineContainer inlineElement'
                });
                var clockingIcon = new Element('div',{
                    'id':pair+"InIcon",
                    'class':iconStyle+' inlineElement'
                });
                var clockingHour = new Element('div',{
                    'id':pair+"InHour",
                    'class':'inlineElement application_clockings_records_hour application_text_bolder'
                });
                var clockingReason = new Element('div',{
                    'id':pair+"InReason",
                    'class':'inlineElement application_clockings_reason_text application_main_soft_text'
                });                
                clockingHour.update(time);
                    if(global.liteVersion){
                        clockingHour.writeAttribute("title",time);
                    }           
                if(!Object.isEmpty(reason)){
                    clockingReason.update(reason);
                        if(global.liteVersion){
                            clockingReason.writeAttribute("title",reason);
                        } 
                }else{
                    clockingReason.update(global.getLabel("noReason"));
                        if(global.liteVersion){
                            clockingReason.writeAttribute("title",global.getLabel("noReason"));
                        } 
                }
                clockingLineIn.insert(clockingIcon);
                clockingLineIn.insert(clockingHour);
                clockingLineIn.insert(clockingReason);
                clockingLineContainer.insert(clockingLineIn);
                this.registerContainer.insert(clockingLineContainer);
            }else{
                var clockingLineOut = new Element('div',{
                    'id': pair+"LineOut",
                    'class': 'inlineContainer inlineElement application_clockings_line_out'
                });
                var clockingIcon = new Element('div',{
                    'id':pair+"OutIcon",
                    'class':iconStyle+' inlineElement'
                });
                var clockingHour = new Element('div',{
                    'id':pair+"OutHour",
                    'class':'inlineElement application_clockings_records_hour application_text_bolder'
                });
                var clockingReason = new Element('div',{
                    'id':pair+"OutReason",
                    'class':'inlineElement application_clockings_reason_text application_main_soft_text'
                });
                clockingHour.update(time);
                    if(global.liteVersion){
                        clockingHour.writeAttribute("title",time);
                    } 
                if(!Object.isEmpty(reason)){
                    clockingReason.update(reason);
                        if(global.liteVersion){
                            clockingReason.writeAttribute("title",reason);
                        } 
                }else{
                    clockingReason.update(global.getLabel("noReason"));
                        if(global.liteVersion){
                            clockingReason.writeAttribute("title",global.getLabel("noReason"));
                        } 
                }
                clockingLineOut.insert(clockingIcon);
                clockingLineOut.insert(clockingHour);
                clockingLineOut.insert(clockingReason);
                hashOfLines.get(pair).insert(clockingLineOut);
            }
        }
        }
    },
    
    /**
    * @description: it shows the date every second    
    */
    _getTime: function(){
        if(Object.isEmpty(this.timeModifying)){
            this.timeModifying = this.initialTime;           
            var time = new Date.parseExact(this.timeModifying, "HH:mm:ss yyyy-MM-dd");         
        }else{
            var time = new Date.parseExact(this.timeModifying, "dddd dd.MM.yyyy HH:mm:ss");       
            time.addSeconds(1);  
        }                
        var datePlusHour = time.toString("dd.MM.yyyy HH:mm:ss");
        var dayOfTheWeek = time.toString("dddd");
        switch(dayOfTheWeek){
            case "Monday":
                dayOfTheWeek = global.getLabel("monDay");
                break;
            case "Tuesday":
                dayOfTheWeek = global.getLabel("tueDay");
                break;
            case "Wednesday":
                dayOfTheWeek = global.getLabel("wedDay");
                break;
            case "Thursday":
                dayOfTheWeek = global.getLabel("thuDay");
                break;
            case "Friday":
                dayOfTheWeek = global.getLabel("friDay");
                break;
            case "Saturday":
                dayOfTheWeek = global.getLabel("satDay");
                break;
            case "Sunday":
                dayOfTheWeek = global.getLabel("sunDay");
                break;
            default:
                break;
        }
        this.timeModifying = dayOfTheWeek + " " + datePlusHour;
        this.date.update(this.timeModifying);
        if(global.liteVersion){
            this.date.writeAttribute("title",this.date.innerHTML);                                
        }
        this.timeOut = setTimeout(this._getTime.bind(this),1000);        
    },
    
    /**
    * @description: it gets the type of the clocking
    * @param ending: its value will be true if it's a ending clocking, otherwise it will be false
    * @param pair: it indicates if the clocking it's a clock-in/-out or a break-in/-out and its sequence number
    * @return the type of the clocking
    */
    getClockingType: function(ending,pair){
        var firstLetter = pair.toArray()[0];
        switch (firstLetter){
            case "A":
                if(ending){
                    return "clock-out";
                }else{
                    return "clock-in";
                }
                break;
            case "B":
                if(ending){
                    return "break-out";
                }else{
                    return "break-in";
                }
                break;
            default:
                return null;
                break;
        }
    },
    
    /**
    * @description: it builds the json structure for the button which we have just pressed
    * @param json: the json where we have the information of the button we look for
    * @param buttonId: the id for the button which we have pressed
    * @return: it returns the parsed json for the button we have pressed
    */
    getClockingButton: function(json,buttonId){        
        var index = getElementIndex(json.EWS.o_clk_buttons.yglui_str_wid_button,"@action",buttonId);        
        return json.EWS.o_clk_buttons.yglui_str_wid_button[index];
    },
    
    /**
    * @description: it builds the json structure for the record which we have just performed a clocking for
    * @param json: the json with information about the clockings
    * @param actionCode: the code for the button which we have pressed
    * @param reason: the reason for the clocking
    * @return: it returns the parsed json for the clocking we have performed
    */
    getRecord: function(json,actionCode,reason){       
        var jsonRecord = {
            yglui_str_wid_record:{
                rec_key:"",
                screen:"1",
                hrobject:{
                    plvar:"",
                    otype:this.objType,
                    objid:this.empId                    
                },
                contents:{
                    yglui_str_wid_content:{
                        key_str:"" ,
                        rec_index:"",
                        selected:"X",
                        rec_variant:"",
                        tcontents:"",
                        fields:{
                            yglui_str_wid_field:[
                            ]
                        },
                        buttons:{
                        }
                    }
                }    
            }
        }; 
        var settings_array = json.EWS.o_field_settings.yglui_str_wid_fs_record.fs_fields.yglui_str_wid_fs_field;
        for(var i=0;i < settings_array.size();i++){
            var jsonFields = {
                fieldid:"",
                value:"",
                fieldlabel:"",
                fieldtechname:"",
                fieldtseqnr:""
            };
            jsonFields.fieldid = jsonFields.fieldtechname = settings_array[i]["@fieldid"];
            switch (settings_array[i]["@fieldid"]){
                case "ABWGR":
                    jsonFields.value = reason;
                    break;               
                case "SATZA":
                    jsonFields.value = actionCode;
                    break;
                default:
                    break;
            }
            jsonRecord.yglui_str_wid_record.contents.yglui_str_wid_content.fields.yglui_str_wid_field.push(jsonFields);            
        }       
        return jsonRecord;
    },
    
    close: function($super) {
        $super();
        clearTimeout(this.timeOut);
    }
    
});