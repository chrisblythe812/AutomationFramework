/**
 * @fileoverview quotaReport.js
 * @description it generates a report associated to a quota record
 */
 
/**
 * @constructor quotaReport
 * @description Creates our application
 * @arguments Application
 */
var quotaReport = Class.create(origin,{
    /**
    * @type String
    * @description the quota counter variable related to the record where we have pushed the "Deduction" button
    */
    _quotaCounter:null,
    
    /**
    * @type String
    * @description the personal number of the employee currently selected
    */
    _personalNumber:null,

    /**
    * @type String
    * @description the type of the quota related to the record where we have pushed the "Deduction" button
    */
    _quotaType:null,
    
    /**
    * @type String
    * @description the id of the report
    */
    _reportId: "RPWAPT2006",
    
    /**
    * @type String
    * @description the id of the result which will be generated
    */
    _resultId:null,

    initialize: function($super,args) {         
        $super();          
        this._personalNumber = args.get("pernr");
        this._quotaCounter = args.get("qC");
        
        //Deleting zeros to the left
        this._quotaCounter.value = Math.abs(this._quotaCounter.value);     
           
        this._quotaType = args.get("qT");  
        this._getReport();
    },              
    
    /**
    * @description it will call the service which will return the result related to the report
    */
    _getReport: function(){
        var xml_in = "<EWS>"+
                        "<SERVICE>EXEC_REPORT</SERVICE>"+
                        "<DEL/>"+
                        "<PARAM>"+
                            "<I_REPORT>" + this._reportId + "</I_REPORT>" + 
                            "<I_VARIANT/>" + 
                            "<I_SUBTITLE/>" + 
                            "<I_FORCE_BACKGROUND/>" +
                            "<I_FIELDS>" +
                                '<yglui_str_rp_o_selscreen_02 fldgroup_id="FPT06A" tag="SGRP_Specific">' +                                
                                    "<fields>" + 
                                        '<yglui_str_rp_o_screenfields_02 datatype="N" fieldname="QUONR" fieldtype="RNG" max_length="' + this._quotaCounter.length + '" tag="QUONR">' +
                                            "<value_descriptions>" + 
                                                '<YGLUI_STR_RP_VALUE_DESCRIPTION value="' + this._quotaCounter.value + '"/>' + 
                                            '</value_descriptions>' + 
                                            '<values>' + 
                                                '<yglui_str_rp_values high="" low="' + this._quotaCounter.value + '" option="EQ" sign="I"/>' +
                                            '</values>' + 
                                        '</yglui_str_rp_o_screenfields_02>' +
                                        
                                        '<yglui_str_rp_o_screenfields_02 datatype="N" fieldname="L_PERNR" fieldtype="RNG" max_length="000008" tag="L_PERNR">' +
                                            "<value_descriptions>" + 
                                                '<YGLUI_STR_RP_VALUE_DESCRIPTION value="' + this._personalNumber + '"/>' + 
                                            '</value_descriptions>' + 
                                            '<values>' + 
                                                '<yglui_str_rp_values high="" low="' + this._personalNumber + '" option="EQ" sign="I"/>' +
                                            '</values>' + 
                                        '</yglui_str_rp_o_screenfields_02>' +    
                                        
                                        '<yglui_str_rp_o_screenfields_02 datatype="N" fieldname="KTART" fieldtype="RNG" max_length="' + this._quotaType.length + '" tag="KTART">' +
                                            "<value_descriptions>" + 
                                                '<YGLUI_STR_RP_VALUE_DESCRIPTION value="' + this._quotaType.value + '"/>' + 
                                            '</value_descriptions>' + 
                                            '<values>' + 
                                                '<yglui_str_rp_values high="" low="' + this._quotaType.value + '" option="EQ" sign="I"/>' +
                                            '</values>' + 
                                        '</yglui_str_rp_o_screenfields_02>' +  
                                    '</fields>' +
                                '</yglui_str_rp_o_selscreen_02>' +
                            '</I_FIELDS>' +
                        '</PARAM>' +
                    '</EWS>';
        this.makeAJAXrequest($H({
            xml: xml_in,
            successMethod: this._checkResult.bind(this)
        }));
    },
    
    /**
    * @description it sets the result id and creates the table
    * @param json: the output json coming from the previous service
    */
    _checkResult: function(json){        
        if(Object.isEmpty(json.EWS.o_message)){
            this._resultId = json.EWS.o_resultid;
            this._createTable();        
        }else{
            this._showNoDeductionMessage();
        }
    },
    
    /**
    * @description it will show a pop-up saying that there are no deductions information available for that record
    */
    _showNoDeductionMessage: function(){
        var messageHtml = new Element('div',{
            "id" : "noFoundDiv"                  
        });
        messageHtml.insert(global.getLabel("noDeductionAvailable"));
        var buttonsJson = {
            elements: [],
            mainClass: 'quotaDeduction_popUp_buttonsMarginTop'
        };
        var callBack = function() {
            noDeductionPopUp.close();
            delete noDeductionPopUp;
        }.bind(this);
        var aux = {
            idButton: 'Ok',
            label: global.getLabel('ok'),
            handlerContext: null,
            className: 'moduleInfoPopUp_stdButton',
            handler: callBack,
            type: 'button',
            standardButton: true
        };
        buttonsJson.elements.push(aux);        
        var ButtonObj = new megaButtonDisplayer(buttonsJson);
        var buttons = ButtonObj.getButtons();       
        messageHtml.insert(buttons);
        var noDeductionPopUp = new infoPopUp({            
            htmlContent: messageHtml,
            indicatorIcon: "information",
            showCloseButton: false,
            width: 350            
        });
        noDeductionPopUp.create();
    },
    
    /**
    * @description it will launch the pop-up with the report table
    */
    _createTable: function(){
        global.open( $H({
            app: {
                appId: "reportTable",
                tabId: "POPUP",
                view: "reportTable"
            },
            report: this._reportId,
            result: this._resultId
	    }));
    },
    
    close: function($super){   
        $super();
    }
 
});