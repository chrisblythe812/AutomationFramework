/**
 *@fileOverview tableKitWithSearchAndPreferences.js
 *@description This file implements the new TableKitV2. The file is spliting in two layout, Controller (First) and Painter (Painter)
 */

/**
 *@constructor
 *@description class that describes the tableKitV2 with preferences (It makes a previous processing and afterward call the tablekit module
 */

var tableKitWithSearchAndPreferences = Class.create(
{
    eventRebuilt: "EWS:rebuiltTable_", //event sent when the table is rebuilt
    eventBeforeRebuilt: "EWS:rebuiltBeforeTable_", //event sent when the table is rebuilt
    tableId: null, //Id of the element table.
    options: null, //options set of tableKit
    instanceTableKit: null, //instanceTableKit 
    tableElement: null, //HTML element of the table
    mode: "new", //mode of the preferences "new" means no preferences previously stored, "recovery" on the contrary
    numberColumns: null, //Number of columns of the table
    numberRowsPerPage: null, //Number of rows per page (parameter in preferences)
    arrayAutocompleter: $A(), //Hash with all autompleter and its value
    structurePreferences: $H(), //Structure of the preferences sorted by columns
    showSapMessage: false, //To indicate if the message "No preferences stores for this user" has to be shown.
    sapMessage: null, //Message to show when the user hasn't preferences stored
    originalFilterOption: null,
    scryptaculous: true,
    resetPreferences: false, //Variable to reset the preferences, the user should save them again. 
    classHideDescription: "TPreferencesDescriptionToShow",
    //labels of the module
    addPreferencesButtonLabel: global.getLabel("Table_Preferences"),
    preferencesLabel: global.getLabel("PM_SET"),
    sortingOrderLabel: global.getLabel("Order"),
    columnsToDisplayLabel: global.getLabel("rc_columns_display"),
    columnsToFilterLabel: global.getLabel("rc_columns_filter"),
    nameColumnLabel: global.getLabel("Columns_Title"),
    numberOfDisplayRowsLabel: global.getLabel("rc_number_rows"),
    saveLabel: global.getLabel("save"),
    cancelLabel: global.getLabel("Cancel"),
   
    /**
    *@param {content} string text of the cell
    *@param {columnHeader} element Header of the cell
    *@description Function to store the information contained in the cell, for apply filter later.
    */
    initialize: function(table, options){
        if( !Object.isEmpty(table)) {
            if(Prototype.Browser.IE)
                this.scryptaculous = false;
            this._getOptions(options);
            this.tableId = table.identify();
            this.tableElement = table;
            this.eventRebuilt += this.tableId;
            this.eventBeforeRebuilt += this.tableId;
            this.options = options;
            this.originalFilterOption = deepCopy(options.filters);
            this.employeeId = this._getEmployeeId();
            this.structurePreferences = $H();
            this.showSapMessage = !Object.isEmpty(options.showSapMessage) ? options.showSapMessage : false;
            this.sapMessage = !Object.isEmpty(options.sapMessage) ? options.sapMessage : null;
            this._getPreferences();
            //To hide the table while we call the service to receive the preferences.
            if (!Object.isEmpty(global.currentApplication)) this.tableElement.hide();

        }
        //        else
        //            alert("TableKitWithPreferences Module: The tableId is mandatory");
    },
    /**
    *@description Method to handler the options parse by parameter.
    **/
    _getOptions: function (options) {
        if (!Object.isEmpty(options)) {
            for (option in options) {
                if (!Object.isEmpty(options[option]))
                    this[option] = options[option];
            }
        }
    },
    
    /**
    *@description Function to process what is the user
    */
    _getEmployeeId:function(){
        if(global && global.objectId){
            return global.objectId;
        }
        return null;
    },
    
    /**
    *@description Function to set the new order in the structure's module (structurePreferences)
    */
    reorderColumnsInStructurePreferences:function(){
        for(var i=1; i < this.arrayAutocompleter.size(); i++){
            this.structurePreferences.get(this.arrayAutocompleter[i].column).initialSort = i;
        }
    },
    
    /**
    *@description Function to return the index of a column
    *@param {nameColumn} element Name of the column
    */
    getSortPositionColumn:function(nameColumn){
        for(var i=1; i < this.arrayAutocompleter.size(); i++){
            if(this.arrayAutocompleter[i].column == nameColumn){
                var sort = i + 1000;
                sort = sort.toString().substring(1,4);
                return sort;
            }
        }
    },
    
    /***************************************************************************************************************/
    /****************************************** Methods to manage Preferences with BackEnd *************************/
    /***************************************************************************************************************/
    /**
    *@description Function to call Sap service and recover the preferences of the user for the table
    */
    _getPreferences:function(){
        var showMessage = this.showSapMessage ? "X": "";
        var message = Object.isEmpty(this.sapMessage) ? "" : this.sapMessage
        var xmlPreferences = "<EWS>"
                            + "<SERVICE>GET_PREFERENCES</SERVICE>"
                            + "<OBJ TYPE='P'>" + this.employeeId + "</OBJ>" //example of employeeId = 30000634
                            + "<PARAM>"
                                + "<I_TABLEID>" + this.tableId + "</I_TABLEID>" 
                                + "<I_SHOW_MESSAGES>" + showMessage + "</I_SHOW_MESSAGES>" 
                                + "<I_MESSAGE_TEXT>" + message + "</I_MESSAGE_TEXT>"
                            + "</PARAM>"
                            + "<DEL/>"
                            + "</EWS>";
            if(Object.isEmpty(global.currentApplication)){
                this._getPreferencesSuccess(); 
            }                           
            if(!Object.isEmpty(this.employeeId) && !Object.isEmpty(this.tableId)){
            global.makeAJAXrequest($H({
                xml: xmlPreferences,
                failureMethod: this._getPreferencesFailure.bind(this),
                errorMethod: this._getPreferencesFailure.bind(this),
                successMethod: this._getPreferencesSuccess.bind(this),
                warningMethod: this._getPreferencesFailure.bind(this)
            }));    
        }
    },
    /**
    *@description Function to return the error to the user
    */
    _getPreferencesFailure: function(info){
        this.tableElement.show();
        this.mode = "new";
        this._drawTable();
        this._addPreferencesMenu();
    },
    /**
    *@description Function to manage the returned preferences
    */
    _getPreferencesSuccess:function(xml){
        //To process the sort of the header. Redraw the table.
        //To change the display columns in the options parameter.
        //To process the filter columns
        this.tableElement.show();
        if(Object.isEmpty(global.currentApplication)){
            var xml = "<?xml version='1.0' encoding='utf-8' ?>"
                + "<EWS>"  
                + "<o_preferences PERNR='30002249' TAB_NAME='exampleTableNew'>" 
                + "<attributes>"
                        + "<item colseqnr='001' display= 'x' fieldid='urgency' filter='x' sort='003' />"
                        + "<item colseqnr='002' display= '' fieldid='creation-date' filter='x' sort='002' />"
                        + "<item colseqnr='003' display= '' fieldid='time' filter='x' sort='008' />"
                        + "<item colseqnr='004' display= 'x' fieldid='title' filter='x' sort='004' />"
                        + "<item colseqnr='005' display= 'x' fieldid='status' filter='x' sort='005' />"
                        + "<item colseqnr='006' display= 'x' fieldid='author' filter='x' sort='001' />"
                        + "<item colseqnr='007' display= 'x' fieldid='cost' filter='x' sort='007' />"
                        + "<item colseqnr='008' display= '' fieldid='size' filter='x' sort='006' />"
                    + "</attributes>"
                + "</o_preferences>"
                + "<LABELS/>"
                + "<MESSAGES/>"
                + "<WEBMESSAGE_TYPE/>"
                + "<WEBMESSAGE_TEXT/>"
                + "</EWS>"   
                this.mode = "recovery";
                var xmlParser = new XML.ObjTree();
                xmlParser.attr_prefix = '@';
                var jsonIn = xmlParser.parseXML(xml);
                this._transformSettingsFromXML(jsonIn);
        }
        else{
            if (xml && xml.EWS && Object.isEmpty(xml.EWS.o_preferences["@tab_name"]) || this.resetPreferences) {
                this.mode = "new";
                this.resetPreferences = "false";
            }else{
                this.mode = "recovery";
                this._transformSettingsFromXML(xml);
            }
        }

        //Create the table
        this._drawTable();
        this._addPreferencesMenu();
    },
    
    /**
    *@description Function to send the selected preferences.
    */
    _savePreferences:function(){
         //We close the pop-up before, becuase otherwise the clickable elements of the table won't be enabled.
         this.preferencesPopUp.close();
         delete this.preferencesPopUp;
         
         var body = this._transformSettingsToXML();
         var xmlPreferences = "<EWS>"
                            + "<SERVICE>SET_PREFERENCES</SERVICE>"
                            + "<OBJ TYPE='P'>" + this.employeeId + "</OBJ>" //example of employeeId = 30000634
                            + "<PARAM>"
                                + "<I_PREFERENCES TAB_NAME='"+ this.tableId + "'>"
                                    + body
                                + "</I_PREFERENCES>"
                                + "<I_SHOW_MESSAGES>"+ "</I_SHOW_MESSAGES>" 
                                + "<I_MESSAGE_TEXT>" + "</I_MESSAGE_TEXT>"
                            + "</PARAM>"
                            + "<DEL/>"
                            + "</EWS>";
                                                        
        if(!Object.isEmpty(this.employeeId) && !Object.isEmpty(this.tableId)){
            global.makeAJAXrequest($H({
                xml: xmlPreferences,
                failureMethod: this._setPreferencesFailure.bind(this),
                successMethod: this._setPreferencesSuccess.bind(this)
            }));    
        }
        document.fire(this.eventBeforeRebuilt);
        this._applyPreferences();
        this.reDrawTable();
    },
    reDrawTable:function(){
        this.destroy();
        //Redraw table
        this._drawTable();
        
    },
    /**
    *@description Function to report an error when the save operations fails.
    */
    _setPreferencesFailure:function(xml){
    },
    
    /**
    *@description Function called when the preferences had been saved correctly
    */
    _setPreferencesSuccess:function(xml){
    },
    
    /**
    *@description Function to transform the introduced preferences to an xml for be sent to backend
    */
    _transformSettingsToXML:function(){
        var result = "";
        result = "<ATTRIBUTES>";
        for(var i=0; i< this.numberColumns; i++){
            var seq = i + 1001; //The sequence has to be a natural number
            seq = seq.toString().substring(1,4);
            var id = this.formatTitle(this.instanceTableKit._columnHeader[i].identify());
            var display = this.structurePreferences.get(this.formatTitle(this.instanceTableKit._columnHeader[i].identify())).display.checkBoxDisplayElement.checked ? "X" : "";
            var filter = this.structurePreferences.get(this.formatTitle(this.instanceTableKit._columnHeader[i].identify())).filter.checkBoxFilterElement.checked ? "X" : "";
            var sort = this.getSortPositionColumn(this.formatTitle(this.instanceTableKit._columnHeader[i].identify()));
            var item = "<ITEM" 
                       + " COLSEQNR=" + "'" + seq + "'"
                       + " DISPLAY= " + "'" + display + "'" 
                       + " FIELDID=" + "'" + id + "'" 
                       + " FILTER=" + "'"+ filter + "'"  
                       + " SORT='" + sort 
                       + "' />"
            result = result + item;
        }
        result = result + "</ATTRIBUTES>"
        return result;
    },
    
    /**
    *@description Function to traduce the xml with the preferences in the structure's module
    *@param {xml} xml Xml returned from SAP
    */
    _transformSettingsFromXML:function(xml){
       this.numberColumns = xml.EWS.o_preferences.attributes.item.size();
       for(var i = 0; i<  this.numberColumns; i++){
          var item = xml.EWS.o_preferences.attributes.item[i]; 
          var order = parseInt(item["@sort"],10)
          var object = {
            display : {checkBoxDisplayElement: null, value:item["@display"] ? true : false},
            filter:  {checkBoxFilterElement: null, value:item["@filter"] ? true : false},
            initialSort: order
          }
          this.structurePreferences.set(item["@fieldid"],object);
       }
    },
    
    _applyPreferences:function(){
        this._applyOrderSettings(this.tableElement);
        this._applyDisplaySettingsToOptions(this.options);
        this._applyFilterSettingsToOptions(this.options);
    },
    /***************************************************************************************************************/
    /****************************************** Methods to Draw the Table ******************************************/
    /***************************************************************************************************************/
    /**
    *@param {content} string text of the cell
    *@param {columnHeader} element Header of the cell
    *@description Function to store the information contained in the cell, for apply filter later.
    */
    _drawTable:function(){
        if(this.mode != "new")
            this._applyPreferences();
        
            this.instanceTableKit = new tableKitWithSearch(this.tableElement, this.options);
            document.fire(this.eventRebuilt)
        
    },
    
    /**
    *@param {element} element table to copy
    *@description Function to rebuilt the table with the new column sort.
    */
    _applyOrderSettings:function(element){
         var elementParent = element.parentNode;
        //Copy the old Table
        var newTable = element.cloneNode(true);
        //New header
        var head = new Element('thead');
            $(newTable.tHead).parentNode.replaceChild(head, $(newTable.tHead))
            var rowHeader = new Element('tr');
            head.insert(rowHeader);
            var newSorting = false;
            var columnsHeader =$(element.children[0].children[0]).childElements();
            var newColumnsHeader = $A();
            for(var i = 0; i < columnsHeader.size(); i++){
                var item = columnsHeader[i];
                var newItem = this.structurePreferences.get(this.formatTitle(item.identify()));
                newColumnsHeader[newItem.initialSort] = item;
                if(i + 1 != newItem.initialSort){
                    newSorting = true;
                }
            }
            
        //New Body
        if(newSorting){
        //To create the "TR" with all the "TD"
        for(var i=0; i < newColumnsHeader.size(); i++)
            rowHeader.insert(newColumnsHeader[i]);
        var rows = $(newTable.tBodies[0]).childElements();
            for(var i = 0; i < rows.size(); i++){
                var item = rows[i].cells;
                var newRow = $A();
                for(var j = 0; j < columnsHeader.size(); j++){
                    var itemColumn = columnsHeader[j];
                    var newItem = this.structurePreferences.get(this.formatTitle(itemColumn.identify()));
                    newRow[newItem.initialSort] = item[j] ? item[j].cloneNode(true) : null;
                } 
                for(var j = 0; j < columnsHeader.size(); j++){
                    $(rows[i].cells[0]).remove();
                    rows[i].insert(newRow[j+1]);
                }
            }
        }   
        if(newSorting){
            elementParent.replaceChild(newTable, element)
            this.tableElement = newTable;
        }
    },
    /**
    *@param {options} json Options of tableKit
    *@description Function to apply the new setting about filter to the table
    */
    _applyFilterSettingsToOptions:function(options){
        var auxArrayFilter = $A();
        var keys = this.structurePreferences.keys();
        for(var i=0; i < keys.size(); i++){
            var key = keys[i];
            var item = this.structurePreferences.get(key);
            var elementColumn = null;
            var collection = $(this.tableElement.children[0].children[0]).childElements();
            for( var j= 0; j < collection.size(); j++){
                if(this.formatTitle(collection[j].identify()) == key){
                     elementColumn = collection[j];
                     break;
                }
            }
            //We have to check type parameter
            var type = null;
            var future = false;
            if(this.options.filters){
                for (var j = 0; j < this.options.filters.size(); j++) {
                    if (this.options.filters[j].name == key && this.options.filters[j].type) {
                        type = this.options.filters[j].type;
                        future = this.options.filters[j].future ? true : false;
                    }
                }
            }
            if(item.filter.value && elementColumn){
                if (!type) {
                var object = {main:true, name:elementColumn.identify(), label:this._returnLabelForFilter(key)};
                } else {
                    var object = { main: true, name: elementColumn.identify(), type: type, label: this._returnLabelForFilter(key), future: future };
                }
                auxArrayFilter.push(object);
            }
        }
        if(auxArrayFilter.size()>0)
            options.filters = auxArrayFilter;
        else
            options.filters = undefined;
    },
    _returnLabelForFilter:function(id, options){
        for(var i=0; i< this.originalFilterOption.size(); i++){
            if(this.originalFilterOption[i].name == id){
                return Object.isEmpty(this.originalFilterOption[i].label) ? this.originalFilterOption[i].name : this.originalFilterOption[i].label;
            }
        }
        return id;
    },
    /**
    *@param {options} json Options of tableKit
    *@description Function to apply the new setting about display (or not) to the table
    */
    _applyDisplaySettingsToOptions:function(options){
        var auxArrayDisplay = $A();
        var auxArrayDisplayById = $A();
        var keys = this.structurePreferences.keys();
        for(var i=0; i < keys.size(); i++){
            var key = keys[i];
            var item = this.structurePreferences.get(key);
            if(!item.display.value){
                auxArrayDisplay.push(this.getColumnPosition(key));
                auxArrayDisplayById.push(key);
            }
        }
        //If a columns hidden has become in visible it's necessary to make showColumn
        if( this.instanceTableKit && this.instanceTableKit.columnToHideById && this.instanceTableKit.columnToHideById.size() > 0){
            for (var i=0; i< this.instanceTableKit.columnToHideById.size(); i++){
                if(auxArrayDisplayById.indexOf(this.instanceTableKit.columnToHideById[i]) == -1 )
                    this.showColumnPreferences(this.instanceTableKit.columnToHideById[i])   
            }
            
        }
        if(auxArrayDisplay.size()>0)
            options.columnToHide = auxArrayDisplay;
        else
            options.columnToHide = $A();
    },
    showColumnPreferences:function(id){
        var index = this.getColumnPosition(id);
        var dis = '';
        var fila = this.tableElement.select('tbody > tr');
        for (i = 0; i < fila.length; i++)
            fila[i].getElementsByTagName('td')[index].style.display = dis;
        if(this.tableElement.children[0] &&  this.tableElement.children[0].children[0] && this.tableElement.children[0].children[0].childElements())
            this.tableElement.children[0].children[0].childElements()[index].style.display = dis;
    },
    /**
    *@param {key} string title of the column
    *@description Function to return the current index of a column
    */
    getColumnPosition:function(key){
        var columns = this.tableElement.children[0].children[0].childElements();
        for(var i = 0; i< columns.size(); i++){
            if(this.formatTitle(columns[i].identify()) == key)
                return i;
        }
        return null;
    },
    
    /***************************************************************************************************************/
    /****************************************** Methods to Draw and Manage the Pop-up  *****************************/
    /***************************************************************************************************************/
    /**
    *@description Function to create the button "show preferences"
    */
    _addPreferencesMenu:function(){
        var auxDivButton = $('showPreferencesButtonDiv_' + this.tableId)
        if(auxDivButton)
            auxDivButton.remove();
        var divButtonAddPreferences = new Element('div',{'class' : 'tableKitV2Preferences_divButtonAddPreferences', 'id': 'showPreferencesButtonDiv_' + this.tableId});
        var json = {elements:[],defaultButtonClassName:'classOfMainDiv'};
        var addPrefences =   {
            label:this.addPreferencesButtonLabel,
            idButton: this.tableId + "addPreferences_button",
            className:'application_action_link ',
            handlerContext: "",
            handler: this._showPreferencesInfoPopUp.bind(this),
            type: 'link',
            toolTip: this.addPreferencesButtonLabel
        };  
        json.elements.push(addPrefences); 
        var addPreferencesButton = new megaButtonDisplayer(json);
        var but = addPreferencesButton.getButtons();
        divButtonAddPreferences.insert(but);
        divButtonAddPreferences.hide();
        Element.insert(this.tableElement, { after: divButtonAddPreferences });
        if(this.scryptaculous && this.mode == "new")
            Effect.Appear(divButtonAddPreferences, { duration: 3.0 });
        else
            divButtonAddPreferences.show();
    },
    
    /**
    *@description Function to open the info pop-up with the preferences;
    */
    _showPreferencesInfoPopUp: function(){
        var contentPopUpHTML = this._createContentPopUp();
        this.preferencesPopUp = new infoPopUp({
            id: "preferencesTablePopUp",
            closeButton: $H({
                'textContent': 'Close',
                'callBack': function() {
                    this.preferencesPopUp.close();
                    this.destroy();
                    delete this.preferencesPopUp;                    
            } .bind(this)
            }),
            htmlContent: contentPopUpHTML,            
            width: 700
        });
        this.preferencesPopUp.create();
    },
    
    /**
    *@description Function to cretate the html content of the preferences screen
    */
    _createContentPopUp: function(){
        var contentPopUpHTML = new Element('div', {'class':'tableKitV2Preferences_contentPopUp'});
        //Title of pop-up
        var titleDiv = new Element('div',{'class': 'tableKitV2Preferences_titlePopUp'});
            titleDiv.insert(this.preferencesLabel);
        contentPopUpHTML.insert(titleDiv);
        //Table with preferences columns
        var tablePreferences = this._createTablePreferences(this.mode);
        contentPopUpHTML.insert(tablePreferences);       
        //Individual Parameters
            //Number of row per page
//        var numberRowPerPageDiv = new Element('div',{'id':this.tableId + '_NumberRowPerPageDiv','class':'tableKitV2Preferences_numberRowPerPageDiv'});
//            var numberMessageLabel = new Element('label',{'class':'tableKitV2Preferences_labels'});
//            numberMessageLabel.insert(this.numberOfDisplayRowsLabel);
//            var numberInput = new Element('input',{'class':'tableKitV2Preferences_inputs'});
//            if(this.mode == "new")
//                numberInput.insert("10");
//            else
//                numberInput.insert(this.numberRowsPerPage);
//        numberRowPerPageDiv.insert(numberMessageLabel);
//        numberRowPerPageDiv.insert(numberInput);
        // to insert number of row to display
        //contentPopUpHTML.insert(numberRowPerPageDiv);
        //Save and Close Div
        var confirmationButtonsDiv = new Element('div',{
            'id': this.tableId + '_ConfirmationButtons', 
            'class' : 'tableKitV2Preferences_confirmationButtonsDiv'
            });
        var json = {elements:[],defaultButtonClassName:'classOfMainDiv'};
        var saveOptions = {
            label:this.saveLabel,
            idButton: this.tableId + "save_button",
            className:'tableKitV2Preferences_saveButton',
            handlerContext: "",
            handler: this._savePreferences.bind(this),
            type: 'button',
            toolTip: this.saveLabel,
            standardButton: true
        };
        json.elements.push(saveOptions); 
        var cancelOptions =   {
            label:this.cancelLabel,
            idButton: this.tableId + "cancel_button",
            className:'tableKitV2Preferences_cancelButton',
            handlerContext: "",
            handler: this._cancelPreferences.bind(this),
            type: 'button',
            toolTip:this.cancelLabel,
            standardButton: true
        };
        json.elements.push(cancelOptions); 
        var confirmationButtons = new megaButtonDisplayer(json);
        var buttons = confirmationButtons.getButtons();
        confirmationButtonsDiv.insert(buttons);
        contentPopUpHTML.insert(confirmationButtonsDiv);
        return contentPopUpHTML;
    },
    
    /**
    *@description Function to store the information about the configuration of order of the page
    */
    _createTablePreferences: function(mode){
        var divContainer = new Element('div',{'id': this.tableId + '_PreferencesTableDivContainer', 'class': 'tableKitV2Preferences_divTableContainer'});
        var tablePreferences = new Element('table',{'id': this.tableId + '_PreferencesTable', 'class': 'tableKitV2Preferences_tablePopUp test_table'}); 
        //HEAD
        divContainer.insert(tablePreferences);
        var tablePreferencesHead = new Element('thead',{'id': this.tableId + '_HeadTable'});
        tablePreferences.insert(tablePreferencesHead);
        var tablePreferencesRowHeader = new Element('tr',{'id':this.tableId + '_columnsHeader'});
        tablePreferencesHead.insert(tablePreferencesRowHeader);
        
        var tablePreferencesColumnHeader = new Element('th',{'class':'tableKitV2Preferences_columnHeader tableKitV2Preferences_nameColumn'});
        tablePreferencesColumnHeader.insert(this.nameColumnLabel);
        tablePreferencesRowHeader.insert(tablePreferencesColumnHeader);
        var tablePreferencesColumnHeader = new Element('th',{'class':'tableKitV2Preferences_columnHeader'});
        tablePreferencesColumnHeader.insert(this.columnsToDisplayLabel);
        tablePreferencesRowHeader.insert(tablePreferencesColumnHeader);
        
        var tablePreferencesColumnHeader = new Element('th',{'class':'tableKitV2Preferences_columnHeader'});
        tablePreferencesColumnHeader.insert(this.columnsToFilterLabel);
        tablePreferencesRowHeader.insert(tablePreferencesColumnHeader);
        
        var tablePreferencesColumnHeader = new Element('th',{'class':'tableKitV2Preferences_columnHeader tableKitV2Preferences_columnOrder'});
        tablePreferencesColumnHeader.insert(this.sortingOrderLabel);
        
        tablePreferencesRowHeader.insert(tablePreferencesColumnHeader);
        //BODY
        var tablePreferencesBody = new Element('tbody',{'id':this.tableId + '_BodyTable'});
        tablePreferences.insert(tablePreferencesBody);
        
        this.numberColumns = this.instanceTableKit._columnHeader.size();
        for(var i=0; i < this.numberColumns ; i++){
            var row = this._addLineColumnConfiguration(this.instanceTableKit._columnHeader[i],i+1,this.mode);
            tablePreferencesBody.insert(row);
        }
        return divContainer;
    },
    
    _updateStructureInformation:function(type,column,checkBox){
        if(type == "display")
            this.structurePreferences.get(column).display.value = checkBox.checked;
        if(type == "filter")
            this.structurePreferences.get(column).filter.value = checkBox.checked;
    },
    
    /**
    *@param {columnInformation} element Header of the colum
    *@param {orderInserted} int Order of the column
    *@description Function to create the information already stored about the configuration of the column.
    */
    _addLineColumnConfiguration:function(columnInformation, orderInserted, mode){
        
        var newRow = new Element('tr');
        //Column Name
        var columnName = new Element('td',{'class':'tableKitV2Preferences_alignLeft'});
        var textToInsert = !Object.isEmpty(this.formatTitle(columnInformation.innerHTML)) ? this.formatTitle(columnInformation) : this.formatTitle(columnInformation.identify());
        columnName.insert(textToInsert);
        newRow.insert(columnName);
        //Columns Display
        var columnToDisplay = new Element('td');
        var checkBoxDisplay = new Element('input',{'type':'checkbox', 'class':'test_checkBox'});
        checkBoxDisplay.observe("click",this._updateStructureInformation.bind(this,"display",this.formatTitle(columnInformation.identify()), checkBoxDisplay));
        columnToDisplay.insert(checkBoxDisplay);
        newRow.insert(columnToDisplay);
        //Columns Filter
        var columnToFilter = new Element('td');
        var checkBoxFilter = new Element('input', { 'type': 'checkbox', 'class': 'test_checkBox' });
        checkBoxFilter.observe("click",this._updateStructureInformation.bind(this,"filter",this.formatTitle(columnInformation.identify()),checkBoxFilter));
        columnToFilter.insert(checkBoxFilter);
        newRow.insert(columnToFilter);
        //Columns Sort
        var columnSortingOrder = new Element('td');
        var json = {autocompleter:{ object:[] } }
        for(var i=1; i<= this.numberColumns; i++){
            var object = {text: i.toString()};
            json.autocompleter.object.push(object);
        }
      
        var autocompleterDiv = new Element('div', {'id': this.tableId + "div"});
        columnSortingOrder.insert(autocompleterDiv);
        var autocompleterSort = new JSONAutocompleter(autocompleterDiv, {
                        events: $H({onGetNewXml: 'EWS:autocompleterGetNewXml',
                onResultSelected: 'EWS:autocompleterResultSelected' + columnInformation.identify()
            }),
                                showEverythingOnButtonClick: true,
                                templateResult: '#{text}',
                                maxShown:5,
                                minChars:1,
                                virtualVariables: true,
                                autoWidth:false
                            }, json);

        
        var object = {column: this.formatTitle(columnInformation.identify()) , autocompleter: autocompleterSort};
        this.arrayAutocompleter[orderInserted] = object;
        newRow.insert(columnSortingOrder);
        
        var object = {
            display : {checkBoxDisplayElement: checkBoxDisplay, value:false},
            filter:  {checkBoxFilterElement: checkBoxFilter, value:false}
        }
        
        if(mode == "new"){
            autocompleterSort.setDefaultValue(orderInserted.toString(),true,null,true);
            object.initialSort = orderInserted;
            if((this.instanceTableKit.columnToHide.size() > 0) &&this.instanceTableKit.hashHiddenColumn.get(orderInserted-1)){
                checkBoxDisplay.checked = false;
                checkBoxDisplay.defaultChecked = false;
            }
            else{
                checkBoxDisplay.checked = true;
                checkBoxDisplay.defaultChecked = true;
                object.display.value = true;
            }
            var found = false;
            if(!Object.isEmpty(this.instanceTableKit.filters)){
            for(var i=0; i < this.instanceTableKit.filters.size(); i++){
                if(this.instanceTableKit.filters[i].name.toLowerCase() == columnInformation.id.toLowerCase()){
                    found = true;
                    }
                }
            }   
            if(found){
                checkBoxFilter.checked = true;
                checkBoxFilter.defaultChecked = true;
                object.filter.value = true;
            }
            this.structurePreferences.set(this.formatTitle(columnInformation.identify()),object);
        }
        else{ //Mode Recovery
            if(this.structurePreferences.get(this.formatTitle(columnInformation.identify()))){
                autocompleterSort.setDefaultValue(parseInt(this.structurePreferences.get(this.formatTitle(columnInformation.identify())).initialSort,10).toString(),true,null,true);
                var item = this.structurePreferences.get(this.formatTitle(columnInformation.identify()));
                item.display.checkBoxDisplayElement = checkBoxDisplay;
                if(item.display.value){
                    checkBoxDisplay.checked = true;
                    checkBoxDisplay.defaultChecked = true;
                }
                item.filter.checkBoxFilterElement = checkBoxFilter;
                if(item.filter.value){
                    checkBoxFilter.checked = true;
                    checkBoxFilter.defaultChecked = true;
                }
            }
        }
        document.observe('EWS:autocompleterResultSelected'+ columnInformation.identify(), this.manageChangeInAutocompleter.bindAsEventListener(this, columnInformation.identify(),autocompleterSort));    
        return newRow;
    },
    formatTitle:function(title){

        if (!Object.isString(title)) {//receiving an element
            var element = $(title).select("." + this.classHideDescription);
             if(!Object.isEmpty(element[0])){
                  element[0].setStyle("display:''");
                  var textToShow =  element[0].innerHTML;
             }
             else{
                var textToShow = title.innerHTML.gsub("&", "");
             }
        }
        else{
            var textToShow = title.gsub("&", "");
        }
        return textToShow;
    },
    /**
    *@param {column} string text of the header
    *@param {autocompleter} class element autocompleter changed
    *@description Function to recalculate the order of the column after changing some column order
    */
    manageChangeInAutocompleter:function(event,column, autocompleter){
        //The value introduced is greater that the old one.
        var oldValue = null;
        for(var i=1; i< this.arrayAutocompleter.size(); i++){
            if(this.arrayAutocompleter[i].column == this.formatTitle(column)){
                oldValue = i;
                break;
            }
        }
        
        var autocompleterValue = parseInt(autocompleter.getValue().textAdded,10);
        if(!Object.isEmpty(oldValue) && autocompleterValue != oldValue){
            var auxOldObject = this.arrayAutocompleter[oldValue];
            var auxNewObject = this.arrayAutocompleter[autocompleterValue];
            this.arrayAutocompleter[autocompleterValue] = this.arrayAutocompleter[oldValue]
            if(autocompleterValue > oldValue){
                for(var i= oldValue; i < autocompleterValue - 1; i++){
                    this.arrayAutocompleter[i]= this.arrayAutocompleter[i+1];
                    this.arrayAutocompleter[i].autocompleter.setDefaultValue(i.toString(),true,false,true);
                }
                this.arrayAutocompleter[autocompleterValue-1] = auxNewObject;
                this.arrayAutocompleter[autocompleterValue-1].autocompleter.setDefaultValue(autocompleterValue-1,true,false,true);  
            }
            else{
                for(var i= oldValue; i > autocompleterValue + 1; i--){
                    this.arrayAutocompleter[i]= this.arrayAutocompleter[i-1];
                    this.arrayAutocompleter[i].autocompleter.setDefaultValue(i.toString(),true,false,true);
                }
                this.arrayAutocompleter[autocompleterValue+1] = auxNewObject;
                this.arrayAutocompleter[autocompleterValue+1].autocompleter.setDefaultValue(autocompleterValue+1,true,false,true);  
            }
        }
        this.reorderColumnsInStructurePreferences();
    },

    /**
    *@description Function called when push the button cancel in the pop-up
    */
    _cancelPreferences:function(){
        this.preferencesPopUp.close();
        delete this.preferencesPopUp;
        this.destroy();
    },
    
    /**
    *@description Function to destroy the class
    */
    destroy:function(){
        this.arrayAutocompleter = $A();
        for(var i=0; i < this.numberColumns ; i++)
           document.stopObserving('EWS:autocompleterResultSelected'+ this.instanceTableKit._columnHeader[i].identify())
    },
    /***************************************************************************************************************/
    /****************************************** TableKit Function **************************************************/
    /***************************************************************************************************************/
    reloadTable:function(table, reset, tableParsing){
        if (Object.isEmpty(tableParsing) || !tableParsing) {
            if (this.mode != "new")
                this._applyPreferences();
            this.instanceTableKit.reloadTable(table, reset);
        }
        else { // If we want to parse a different table
            if (this.mode != "new") {
                this._applyPreferences();
                this.instanceTableKit.reloadTable(this.tableElement, reset);
            }
            else {
                this.instanceTableKit.reloadTable(table, reset);
            }
        }
    },
    getNumberHiddenColumn:function(){
        return this.instanceTableKit.getNumberHiddenColumn();
    }
})
