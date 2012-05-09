/**
 * @fileoverview reportTable.js
 * @description it launches a pop-up with a table showing a report result
 */
 
/**
 * @constructor reportTable
 * @description Creates our application
 * @arguments Application
 */
var reportTable = Class.create(Application,{
    
    /**
    * @type String
    * @description the report id 
    */
    _reportId:null,
    
    /**
    * @type String
    * @description the result id 
    */
    _resultId:null,          
   
    initialize: function($super,options) {         
        $super(options);                           
    },              
    
    run: function($super,args){
        $super(args);
        this._reportId = args.get("report");
        this._resultId = args.get("result");
        this._getTable(); 
    },
    
    /**
    * @description it will call the corresponding service to get the table which represents the report
    */
    _getTable: function(){
        var xml_in = "<EWS>" + 
                        "<SERVICE>GET_RESULT</SERVICE>" + 
                        "<DEL/>" + 
                        "<PARAM>" + 
                            "<I_RESULT_ID>" + this._resultId + "</I_RESULT_ID>" + 
                            "<I_REPORT_ID>" + this._reportId + "</I_REPORT_ID>" + 
                        "</PARAM>" + 
                    "</EWS>";
        this.makeAJAXrequest($H({
            xml: xml_in,
            successMethod: this._buildTable.bind(this)
        }));
    },
    
    /**
    * @description it will create the html table associated with the output of the previous service
    * @param json: the json which returns the report result table
    */
    _buildTable: function(json){
        var table = json.EWS.table;
        if(!Object.isEmpty(table)){
            //We need to check first if we receive the data stadistic (in this case we receive 2 tables)
            if (table.length > 1) 
                table = table [table.length - 1];               
            var headerElements = table.header.columns.column;
            
            this._htmlTable = new Element('table',{
                "id":"quotaDeductionsTable",
                "class" : "sortable test_table"
            });
            
            var header = new Element('thead',{
                "id":"quotaDeductionsTable_header"
            });
            this._htmlTable.insert(header);
            
            var headerRow = new Element('tr',{
                "id":"header_row"
            });
            header.insert(headerRow);
            
            var headerCell;
            for(var i=0;i < headerElements.length;i++){
                headerCell = new Element('th',{
                    "id" : "headerCell_" + i
                });
                headerCell.update( global.getLabel(headerElements[i]["#text"]) );
                headerRow.insert(headerCell);
            }
            
            var body = new Element('tbody',{
                "id":"quotaDeductionsTable_body"
            });
            this._htmlTable.insert(body);
            
            var rows = objectToArray(table.data.entry);
            var currentRow,htmlRow,htmlCell;
            for(var j=0;j < rows.length;j++){
                htmlRow = new Element('tr',{
                    "id":"quotaDeductions_row" + j
                });
                body.insert(htmlRow);
                
                currentRow = rows[j].column;            
                for(var k=0;k < currentRow.length;k++){
                    if(currentRow[k]["#text"] == 'A'){
                        htmlCell = new Element('td',{
                            "id":"quotaDeductionsRow_" + j + "_Cell_" + k,
                            "title":global.getLabel('APR')
                        });
                    }
                    else if(currentRow[k]["#text"] == '?'){
                        htmlCell = new Element('td',{
                            "id":"quotaDeductionsRow_" + j + "_Cell_" + k,
                            "title":global.getLabel('STA')
                        });
                    }
                    else if(currentRow[k]["#text"] == 'X'){
                        htmlCell = new Element('td',{
                            "id":"quotaDeductionsRow_" + j + "_Cell_" + k,
                            "title":global.getLabel('STD')
                        });
                    }
                    else{
                        htmlCell = new Element('td',{
                            "id":"quotaDeductionsRow_" + j + "_Cell_" + k
                        });
                    }
                    var value = currentRow[k]["#text"];
                    if(headerElements[k]["#text"] != "DATUM"){
                        htmlCell.update(value);
                    }else{                        
                        var userFormatDate = sapToDisplayFormat(value);
                        htmlCell.update(userFormatDate);
                    }
                    htmlRow.insert(htmlCell);
                }
            }
            this.virtualHtml.update(this._htmlTable);     
            this._createTableKit();   
        }
    },        
    
    /**
    * @description: it sets the tableKit module appearance and functionality for the table   
    */
    _createTableKit: function(){
        this.tableKitComponent =  new tableKitWithSearch(this._htmlTable, { 
            pages: global.paginationLimit, 
            marginL: 100, 
            searchLabel: global.getLabel('search'), 
            noResultsLabel: global.getLabel('noResults'),
            webSearch: true,
            stripe: true,
            exportMenu: true
        });
    },
    
    close: function($super){   
        $super();                
    }
 
});