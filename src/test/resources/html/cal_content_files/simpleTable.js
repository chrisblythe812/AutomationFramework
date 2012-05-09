/* 
 * @fileoverview simpleTable.js
 * @description This module implements the functionalities for creating a simple table
 *              it also provides methods to modify a row, delete a row and insert a new one.
 *              The table structure is given as a JSON objects with the header information
 *              and the rows information. Each row can also have a content that will be
 *              displayed at the moment of clicking on the row.
 *
 *              Input JSON Structure
 *              {
 *                  header: [   {text: 'Column1', id: 'col1'},
 *                              {text: 'Column2', id: 'col2'},
 *                              {text: 'Column3', id: 'col3'}],
 *                  rows: [
 *                          [{ text: 'Text 1', id: 'id1', element: '<div></div>'},
 *                          { text: 'Text 2', id: 'id2', element: '<div></div>'},
 *                          { text: 'Text 3', id: 'id3', element: '<div></div>'}],
 *                          
 *                          [{ text: 'Text 1', id: 'id1', element: '<div></div>'},
 *                          { text: 'Text 2', id: 'id2', element: '<div></div>'},
 *                          { text: 'Text 3', id: 'id3', element: '<div></div>'}],] };
 */

/**
* @constructor
* @description The simple table functionalities
*/
var SimpleTable = Class.create(
/**
* @lends SimpleTable
*/{
    /**
    * @description Element that contains the table
    * @description Prototype.Element
    */
    _tableContainer: null,
    /**
    * @description Point to each row in the table
    * @type Prototype.Hash
    */
    _rowPointer: null,
    _contentPointer: null,
    _rowElement: null,
    /**
    * @description Stores ths JSON table structure
    * @type Prototype.Object
    */
    _tableStructure: null,
    /**
    * @description The module options
    * @type Prototype.Options
    */
    _options: null,
    /**
    * @description Stores the generated table
    * @type Prototype.Element
    */
    _element: null,
    /**
    * @description Stores the number of columns
    * @type Integer
    */
    _numColumns: null,
    typeLink: null,
    /**
    * @description Initializes the class
    * @param tableStructure The JSON structure that will form the table
    * @param
    */
    initialize: function(tableStructure, options) {
        this._numColumns = 0;
        //Storing the table structure
        this._tableStructure = tableStructure;
        this.typeLink = options.typeLink ? options.typeLink : false;
        //Initializing the variables
        this._rowPointer = new Hash();
        this._contentPointer = new Hash();
        this._rowElement = new Hash();
        //Storing the options
        this._options = options;
        this._generateStructure();
    },
    _generateStructure: function() {
    var className = (Object.isEmpty(this._options.className)) ? 'simpleTable_table' : this._options.className;
        this._element = new Element('table', {
        "class": "test_table " + className,
            rules: 'groups',
            border: '0'
        });
        this._element.insert(this._createHeader());
        this._element.insert(this._createRows());
    },
_createHeader: function() {
    //Creating the element that will contain the header
    var resultHeader = new Element("thead");
    var resultHeaderRow = new Element("tr");
    resultHeader.insert(resultHeaderRow);
    if (this._tableStructure.header) {
        //Getting all the header labels
        for(var i=0; i<this._tableStructure.header.size(); i++){
            var item = this._tableStructure.header[i];
            var pointer = (item.pointer) ? ' application_handCursor' : '';
			var evenOrOdd = " odd";
			if(i%2==0){
				evenOrOdd = " even";
			}
			var headerColumn = new Element("th", {
			    "id": (item.id ? ' id="' + item.id + '"' : ''),
			    "class": "simpleTable_header" + pointer + evenOrOdd
			}).insert(item.text);
			this._numColumns++;
			item.element = headerColumn;
			resultHeaderRow.insert(headerColumn);
        }
        return resultHeader;
    }
    else
        throw 'SimpleTable error: You should set a header parameter';
},
    /**
    * @description Creates new rows from the JSON
    * @param data The rows data
    * @param index Row's index
    */
    _createRows: function(data, index) {
        var className = (Object.isEmpty(this._options.rowsClassName)) ? '' : this._options.rowsClassName;
        if (!this._tableTbody)
            this._tableTbody = this._element.down('tbody') ? this._element.down('tbody') : new Element('tbody');
        if (!this._tableStructure.rows)
            return;
        else {
            var rowsDataSource;
            rowsDataSource = data ? { rows: data } : this._tableStructure;
            rowsDataSource.rows.each(function(item) {
            var row = (!index) ? new Element('tr') : this._insertRow(this._tableTbody,index - 1);
                row.addClassName(className);
                if (item.value.element) {
                    var content = (!index) ? new Element ('tr') : this._insertRow(this._tableTbody,index);
                    content.hide();
                    content.addClassName(className);
                    content.insert(new Element('td', {
                        colspan: this._numColumns,
                        'class': className
                    }).insert(new Element('div', {
                        'class': 'simpleTable_my_details_detailsDiv'
                    }).insert(item.value.element)));
                }
                item.value.data.each(function(cell, i) {
				var evenOrOdd = "odd";
				if(i%2==0){
					evenOrOdd = "even";
				}
                if (!Object.isEmpty(cell.img)) {
                    var imageClass = cell.img;
                }
                else {
                    var imageClass = '';
                }
                    var cellElement = new Element('td', {
                        id: cell.id,
                    'class': className + " " + evenOrOdd + " " + imageClass + " test_text"
                    });
                cell.element = cellElement;
                    row.insert(cellElement);
                    if (item.value.element && i == 0) {
                        var arrow = new Element('div', {
                            'class': 'treeHandler_align_verticalArrow application_verticalR_arrow'
                        });
                        if (!this.typeLink) {
                            cellElement.insert(arrow);
                            arrow.observe('click', this._toggleContentElement.bind(this, content, arrow));
                            //Storing the element that observs the click element
                            this._rowElement.set(item.key, arrow);
                        }
                        else {
                        cellElement.insert('<button class="application_action_link link simpleTable_link test_link">' + cell.text + '</button>');
                            cellElement.down().observe('click', this._toggleContentElement.bind(this, content, arrow));
                            //Storing the element that observs the click element
                            this._rowElement.set(item.key, cellElement.down());
                        }
                    }
                    else
                        cellElement.insert(cell.text);
                } .bind(this));
                if (!index)
                    this._tableTbody.insert(row);
                this._rowPointer.set(item.key, row);
                if (item.value.element) {
                    if (!index)
                        this._tableTbody.insert(content);
                    this._contentPointer.set(item.key, content);
                }
            } .bind(this));
            return this._tableTbody;
        }
    },
    /**
     * Inserts a new row in the table body and returns it
     * @param {Object} tableBody
     * @param {Object} index
     */
    _insertRow: function(tableBody,index){
	    var newRow = new Element("tr");
	    if(tableBody.childElements().size()<=index){
		    //Inserting at the end:
		    tableBody.insert(newRow);
	    }else{
	        tableBody.childElements()[index].insert({ "before": newRow });
	    }
	    return newRow;	
    },
    /**
    * @description Toggles the content TD for a given row
    */
    _toggleContentElement: function() {
        var args = $A(arguments);
    if (this._options.addContentBefore && !Object.isEmpty(args[0].down('.GCM_recordCont')) && args[0].down('.GCM_recordCont').empty()) {
        var newHtml = this._options.functionToAddContent.call(this, args);
        args[0].down('.GCM_recordCont').update(newHtml);
    }
        args[0].toggle();
        if (args[1].hasClassName('application_verticalR_arrow')) {
            args[1].removeClassName('application_verticalR_arrow');
            args[1].addClassName('application_down_arrow');
        }
        else {
            args[1].removeClassName('application_down_arrow');
            args[1].addClassName('application_verticalR_arrow');
        }
	if(this._options.toggleEvent){
		document.fire(this._options.toggleEvent)
	}
        document.fire('EWS:simpleTableLinkClicked');
    },
    /**
    * @description Return the created table
    */
    getElement: function() {
        return this._element;
    },
    /**
    * @description Removes a row from the table
    * @param rowId The id of the row to be deleted
    */
    removeRow: function(rowId) {
        var row = this._rowPointer.get(rowId);
        if (row) {
            var element = this._rowElement.get(rowId);
            if (element) {
                element.stopObserving('click');
                this._rowElement.unset(rowId);
                element.remove();
                var elementRow = this._contentPointer.get(rowId);
                this._contentPointer.unset(rowId);
                elementRow.remove();
            }
            this._rowPointer.unset(rowId);
            return row.remove();
        }
        else
            return null;
    },
    /**
    * @description Updates the table
    * @param rowId The rowId to be updated
    * @param rowData The new row information
    */
    updateRow: function(rowId, rowData) {
        var row = this._rowPointer.get(rowId);
        var index = row.rowIndex;
        if (row) {
            this.removeRow(rowId);
            this.addRow(rowData, index);
        }
    },
    /**
    * @description Adds a row to the table
    * @param rowData Information of the row to be added
    * @param index Row's index
    */
    addRow: function(rowData, index) {
        if (index) {
            var totalRows = this._rowPointer.keys().length * 2; // each row has 2 tr elements
            if (index > totalRows)
                index = null;
        }
        this._createRows(rowData, index);
    },
    /**
    * @description Hides a row
    * @param rowId Row's index
    */
    hideRow: function(rowId) {
        var row = this._rowPointer.get(rowId);
        if (row) {
            row.hide();
        }
    },
    /**
    * @description Shows a row
    * @param rowId Row's index
    */
    showRow: function(rowId) {
        var row = this._rowPointer.get(rowId);
        if (row) {
            row.show();
        }
    },
    /**
    * @description Hides a row content
    * @param rowId Row's index
    */
    hideRowContent: function(rowId) {
        var row = this._contentPointer.get(rowId);
        if (row) {
            row.hide();
        }
    },
    /**
    * @description Shows a row content
    * @param rowId Row's index
    */
    showRowContent: function(rowId) {
        var row = this._contentPointer.get(rowId);
        if (row) {
            row.show();
        }
},

/**
 * Hides a column of the table
 * @param columnNumber The number of column we want to hide (starting at 0)
 */
hideColumn:function(columnNumber){
    if(this._tableStructure.header[columnNumber] && this._tableStructure.header[columnNumber].element){
        this._tableStructure.header[columnNumber].element.hide();
    }
    if(!Object.isEmpty(this._tableStructure.rows)){
        var rowsKeys = this._tableStructure.rows.keys();
        for(var i=0; i<rowsKeys.size(); i++){
            var row = this._tableStructure.rows.get(rowsKeys[i]);
            if(row && row.data){
                if(!Object.isEmpty(row.data[columnNumber]) &&!Object.isEmpty(row.data[columnNumber].element) ){
                    row.data[columnNumber].element.hide();
                }
            }            
        }        
    }
},
/**
 * Shows a column of the table. This won't be needed unless the column has been hidden before
 * @param columnNumber The number of column we want to show (starting at 0)
 */
showColumn:function(columnNumber){
    if(this._tableStructure.header[columnNumber] && this._tableStructure.header[columnNumber].element){
        this._tableStructure.header[columnNumber].element.show();
    }
    if(!Object.isEmpty(this._tableStructure.rows)){
        var rowsKeys = this._tableStructure.rows.keys();
        for(var i=0; i<rowsKeys.size(); i++){
            var row = this._tableStructure.rows.get(rowsKeys[i]);
            if(row && row.data){
                if(!Object.isEmpty(row.data[columnNumber]) &&!Object.isEmpty(row.data[columnNumber].element) ){
                    row.data[columnNumber].element.show();
                }
            }            
        }        
    }
},
getRowCount: function(){
	if(this.tableBody){
		return this.tableBody.childElements().length;
	}
	else if(this._tableTbody){
		return this._tableTbody.childElements().length;
	}
	else{
		return 0;
	}
},
/**
 * Returns the table element for the simple table
 */
getHtml: function(){
	return this._element;	
    }
});
