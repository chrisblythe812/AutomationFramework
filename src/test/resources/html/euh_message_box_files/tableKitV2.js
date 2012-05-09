/**
 *@fileOverview tableKitV2.js
 *@description This file implements the new TableKitV2. The file is spliting in two layout, Controller (First) and Painter (Painter)
 */
 
//Index of the code
//1- Initialize Methods and status Machine
//2- Methods of Pagination
//3- Methods of Searching
//4- Methods of Sorting
//5- Methods of Filtering
//6- Drawing

/**
 *@constructor
 *@description class that describes the tableKitV2
 */

var tableKitWithSearch = Class.create(
{
    _tableKitRows: $A(), //Main array of the class, it keeps all the information of the table
    _hashPages: $H(), //Hash of vector, each one has the order of the element of a page (Each key is the number of the page.
    _numberColumns: null, //number of columns of the table
    infoPages: {
        tFoot: '',
        previous: '',
        next: '',
        last: '',
        first: '',
        currentPage: '',
        totalPages: '',
        numbers: '',
        pageField: ''
    },
    _drawnPage: -1,
    _table: null, //Element Table
    _totalPages: 0, //Total of pages.
    _columnHeader: $A(), //Columns header elements 
    complexSearchDiv: null, //Element to store the filter+search options div
    backEndPaginationCurrentPage: 0, //Int register of the current page in the backend pagination
    _textToSearch: null,
    _typesRecognizer: $A(), //Array with the pattern to recognize the type of data of each button
    _typeDataSort: null, //Type of data to sort the table.
    filterDiv: null, //Div to show the filters
    indexSorted: null, //Index of the column that it sorts the table
    arrayDivFilters: $A(), //Collection of the div container of filters columns
    initSort: null, //Initial column to order the table
    wordsFilter: $H(), //Array of hash, each hash store the words of each columns with the counter of the ocurrences in the table
    filterApplied: $H(), //Array of json, each one represents a filter applied ( a checked checkbox)
    showSecondariesFilter: false, //Array of hash, each hash store the words of each columns with the counter of the ocurrences in the table
    ocurrenciesFilter: $H(), //hash of the ocurrencies of each element in each filter
    hashDatePicker: $H(), //hash to keep all the datepickers in filter div
    autocompleterArray: $A(), //array to keep all the autocompleter in filter div
    labelArrowUpLite: "\u25bc", //String simbol to show in the descending columns in lite version
    labelArrowDownLite: "\u25b2", //String simbol to show in the ascending columns in lite version
    firstFilterToShow: 0, //Index of the first filter shown in the filter div
    _status: "None", //Describes the status of the table, this value could be filtered, searchedFiltered,...
    _maxCharactersLength: $A(), //Describes the max character length of the column (It's neccessary to call export method). 
    types: $A(), //Array to keep all the possible type of data in the table (number, dates, text,...)
    searchEmpty: true,
    columnToHideById: $A(),
    _modeBigSize: false,
    //************************************* Options to configure the module *************************************
    webSearch: true,
    autoLoad: true,
    marginL: 0,
    marginSearchLeft: 0,
    quickSearch: false,
    multiSelectionFilter: false,
    pages: 10,
    exportMenu: false,
    alingExport: "LEFT",
    filters: null,
    filterPerPage: 4,
    maxNumberCategories: 4,
    showReports: true,
    stripes: true,
    sortable: true,
    clearFilterButton: false,
    highlightRowsOnMouseOver: true,
    highlightClass: "table_highlight test_table",
    rowEvenClass: "table_roweven",
    rowOddClass: "table_rowodd",
    columnClass: 'table_sortcol',
    descendingClass: 'table_sortColDesc',
    ascendingClass: 'table_sortColAsc',
    noSortClass: "table_noSort",
    noSearchableClass: "table_noSearchable",
    defaultSortDirection: 1,
    sortFirstAscendingClass: "table_sortfirstasc",
    sortFirstDecendingClass: "table_sortfirstdesc",
    footClass: "tableKitV2_pagination_bar_css",
    expandableClass: "expandable",
    pagination: false,
    expandableRows: false,
    tableInDiv: false,
    columnToHide: $A(),
    underlineSearch: true,
    typesSort: null,
    legend: null,
    dateFormat: null,
    iconLoading: true,
    selectAllCheckBox: false,
    maxSelectablesCheckBoxes: null,
    countWithEmptyCell: false,
    truncateColumns: null,
    paginationEvents: false,
    filteringEvents: false,
    searchingEvents: false,
    sortingEvents: false,
    backEndPagination: null,
    //LABELS from Global
    searchLabel: global.getLabel("KM_SEARCH"),
    noResultsLabel: global.getLabel("KM_NO_RESULTS"),
    filterOption: global.getLabel("KM_FILTER_OPTIONS"),
    moreOptions: global.getLabel("More_options"),
    lessOptions: global.getLabel("Less_options"),
    showMoreLabel: global.getLabel("KM_SHOW_MORE"),
    showLessLabel: global.getLabel("Hide"),
    reportFilterLabel: global.getLabel("Filters_applied"),
    today: global.getLabel("Today"),
    yesterday: global.getLabel("Yesterday"),
    twoDaysAgo: global.getLabel("Two_days_ago"),
    lastWeek: global.getLabel("Last_week"),
    lastMonth: global.getLabel("Last_month"),
    last6Months: global.getLabel("last6months"),
    tomorrow: global.getLabel("Tomorrow"),
    twoDaysLater: global.getLabel("Two_days_after"),
    nextWeek: global.getLabel("nextWeek"),
    nextMonth: global.getLabel("nextMonth"),
    next6Months: global.getLabel("next6months"),
    from: global.getLabel("BEGDA_H"),
    to: global.getLabel("KM_TO"),
    showLegend: global.getLabel("showLegend"),
    hideLegend: global.getLabel("hideLegend"),
    emptyCell: global.getLabel("empty"),
    exportPdf: global.getLabel("export_results_to_pdf"),
    exportExcel: global.getLabel("export_results_to_excel"),
    exportClipBoard: global.getLabel("export_results_to_clipboard"),
    clearFilter: global.getLabel("clearfilter"),
    selectAllLabel: global.getLabel("selectUnselectAll"),
    //EVENTS
    eventPaginationChanged: "EWS:TableKitPageChanged",
    eventPaginationRequested: "EWS:TableKitPageRequested",
    eventFilterApplied: "EWS:TableKitFilterApplied",
    eventFilterRequested: "EWS:TableKitFilterRequested",
    eventSearchRequested: "EWS:TableKitSearchRequested",
    eventSearchPerformed: "EWS:TableKitSearchApplied",
    eventSortingPerformed: "EWS:TableKitSortApplied",
    //WARNINGS
    warningMaxSelectablesCheckboxes: global.getLabel("maxSelectedElements"),
    //************************************************************************************************************

    initialize: function (table, options, reload) {
       if (!Object.isEmpty(table)) {
            this._table = $(table);
            if (!reload) {
                this._getOptions(options);
                if (global.liteVersion) {
                    this.rowEvenClass = this.rowEvenClass + "Lite";
                    this.rowOddClass = this.rowOddClass + "Lite";
                    this.columnClass = this.columnClass + "Lite";
                    this.descendingClass = this.descendingClass + "Lite";
                    this.ascendingClass = this.ascendingClass + "Lite";
                    this.noSortClass = this.noSortClass + "Lite";
                    this.footClass = this.footClass + "Lite";
                }
                this.filterApplied = $H();
            }
            //Call to the process of loading all the kind of data
            this._chargeTypesRecognizer();
            //Prestoring the data of the table
            var error = null;
            if (this.filters)
                error = this._storingBackupData(table, true);
            else
                error = this._storingBackupData(table, false);

            if (!error) {
                var aux = $(this._table.identify() + "optionsDiv");
                if (aux)
                    aux.remove();
                var aux2 = $(this._table.identify() + '_FilterDiv');
                if (aux2)
                    aux2.remove();
                this.drawFooter();
                this._drawHeader();
                if (this.sortable) {
                    this.indexSorted = null;
                    var drawed = this._initSort();
                }
                if (this.webSearch)
                    this.drawSearchBox();
                if (this.filters)
                    this._drawFilter();
                if (this.selectAllCheckBox)
                    this._drawAllCheckBox();
                if (!drawed) {
                    this._pagination();
                    this.draw(0);
                }
                if (this.exportMenu)
                    this.drawExportMenu();
                if (this.highlightRowsOnMouseOver)
                    this._table.addClassName(this.highlightClass);
            }
            //            else
            //                alert("TableKitV2 Module: The table doesn't have any column");
        }
        //        else
        //            alert("TableKitV2 Module: The table is empty. Please contact with EuHReka Framework");
    },

    /**
    *@description Method to handler the options parse by parameter.
    **/
    _getOptions: function (options) {
        if (options && Object.isEmpty(options["pagination"]) && options["pages"])
            options.pagination = true
        if (!Object.isEmpty(options)) {
            for (option in options) {
                if (!Object.isEmpty(options[option]))
                    this[option] = options[option];
            }
        }

    },

    /**
    *@description Method to store and calculated the basic information of the table
    *@return True if there is an error, false on the contrary
    **/
    _storingBackupData: function (table, enableFilter) {
        this.wordsFilter = $H();
        this._tableKitRows = $A();
        if (!table.rows[0]) //There isn't any columns in the table
            return true;
        //Store the row elements
        var arrayRows = $(table.tBodies[0]).childElements();
        //Mode big tables
        if (arrayRows.size() > 750)
            this._modeBigSize = true;
        //Get the header of the columns
        this._columnHeader = $(table.children[0].children[0]).childElements(); //20ms
        //Initialize maximum number of characters per column with the value of the header

        for (var j = 0; j < this._columnHeader.length; j++) {
            this._maxCharactersLength[j] = this._columnHeader[j].textContent || this._columnHeader[j].textContent == "" ? this._columnHeader[j].textContent.length : this._columnHeader[j].innerText.length;
        }

        if (enableFilter) {
            //Check if the filter variable matchs with the header of the columns, and initialize the hash to keep the ocurrences of the categories
            for (var i = 0; i < this.filters.length; i++) {
                for (var j = 0; j < this._columnHeader.length; j++) {
                    if (this._columnHeader[j].id.toLowerCase() == this.filters[i].name.toLowerCase()) {
                        this.wordsFilter.set(this.filters[i].name.toLowerCase(), $H());
                        break;
                    }
                    else if (j == this._columnHeader.length - 1) {
                        //alert(global.getLabel("filter") + ": " + this.filters[i].name + " " + prepareTextToShow(global.getLabel("noMatchAnyColumn")));
                    }
                }
            }
        }
        for (var i = 1; i <= arrayRows.length; i++) {
            var contentColumn = $H();
            //Storation the value of each column in a hash for each row
            for (var j = 0; j < this._columnHeader.length; j++) {
                var cells = arrayRows[i - 1].cells;
                if (cells && cells[j] && cells[j].innerHTML)
                    var content = cells[j].innerHTML.stripTags();
                else
                    var content = "";
                content = cells ? this.exclusionExpandableContent(cells[j], content) : content;
                contentColumn.set(j, content);
                if (this._maxCharactersLength[j] < content.length)
                    this._maxCharactersLength[j] = content.length;

                if (enableFilter)
                    this.storeInformationFilter(content, this._columnHeader[j]);

                if (!Object.isEmpty(this.truncateColumns)) {
                    var exists = false
                    exists = this.truncateColumns.vectorColumns.detect(function (v) { if (v == j + 1) { return true; } return false; });
                    if (exists) {
                        this.truncateCell(cells[j])
                    }
                }
            }
            //Structure of the main object of the tableKit
            var object = {
                originalPosition: i - 1, //Position after the init sorting (if no sorting, position in the html table
                currentPosition: i - 1,
                currentPositionBeforeSorted: i - 1, //Position before the init sorting
                hide: false, // Means if the value could be shown following the criterias selected (filtering and searching)
                element: arrayRows[i - 1], //Element html of the row
                contentColumn: contentColumn, //Hash with the content of each column in the row (the key = index of the column)
                elementToString: table.rows[i].innerHTML.stripTags().toLowerCase(),
                page: -1, //Page that contains the row
                orderInPage: -1, //Order in the page of the row
                underline: false,
                underlineIndex: $A()
            };
            arrayRows[i - 1].hide();
            this._tableKitRows[i - 1] = object;
        }
        this.hashHiddenColumn = $H();
        //Hide the columns given by parameter
        for (var i = 0; i < this.columnToHide.length; i++) {
            this.columnToHideById.push(this._columnHeader[this.columnToHide[i]].identify());
            this.hideColumn(this.columnToHide[i]);
        }

        //Return no error
        return false;
    },
    /**
    *@param {content} string text of the cell
    *@param {columnHeader} element Header of the cell
    *@description Function to store the information contained in the cell, for apply filter later.
    */
    storeInformationFilter: function (content, columnHeader, multiSelectionFilter) {
        //If no count the empty cell, and the cell is empty. Not storing
        //content = this.exclusionExpandableContent(cell,content);
        if (!(!this.countWithEmptyCell && content == "")) {
            //Keeping the occurrences of each column of the table
            if (this.wordsFilter.get(columnHeader.id.toLowerCase())) {
                if (this.wordsFilter.get(columnHeader.id.toLowerCase()).get(content)) {
                    if (!Object.isEmpty(multiSelectionFilter) && multiSelectionFilter)
                        this.wordsFilter.get(columnHeader.id.toLowerCase()).set(content, this.wordsFilter.get(columnHeader.id.toLowerCase()).get(content));
                    else
                        this.wordsFilter.get(columnHeader.id.toLowerCase()).set(content, this.wordsFilter.get(columnHeader.id.toLowerCase()).get(content) + 1);
                }
                else {
                    if (!Object.isEmpty(multiSelectionFilter) && multiSelectionFilter)
                        this.wordsFilter.get(columnHeader.id.toLowerCase()).set(content, 0);
                    else
                        this.wordsFilter.get(columnHeader.id.toLowerCase()).set(content, 1);
                }
            }
        }

    },
    /**
    *@param {cell} element Cell to delete the content of the expandable elements
    *@param {content} string String with the content of the cell with the expandable elements
    *@description Function to delete the content of the expandable elements
    */
    exclusionExpandableContent: function (cell, content) {
        if (this.expandableRows) {
            if (!Object.isEmpty(cell)) {
                var arrayExpandableElements = $(cell).select("." + this.expandableClass);
                for (var i = 0; i < arrayExpandableElements.size(); i++) {
                    var contentToDelete = arrayExpandableElements[i].innerHTML.stripTags();
                    content = content.sub(contentToDelete, "");
                }
            }
        }
        return content;
    },
    getNumberHiddenColumn: function () {
        return this.hashHiddenColumn.keys().size();
    },
    /**
    *@param {cell} element Cell to truncate
    *@description Function to truncate a cell
    */
    truncateCell: function (cell) {
        var content = cell.innerHTML.stripTags();
        if (content.length > this.truncateColumns.positionToTruncate) {
            var stringToHide = content.substring(this.truncateColumns.positionToTruncate);
            var stringToShow = content.truncate(this.truncateColumns.positionToTruncate + this.truncateColumns.closureCharacters.length, this.truncateColumns.closureCharacters);
            cell = $(cell);
            cell.update("");
            cell.insert(stringToShow);
            cell.title = content;
        }
    },
    /**
    *@description Method to handler the options parse by parameter.
    **/
    currentRowsShown: function () {
        var counter = 0;
        for (var i = 0; i < this._tableKitRows.length; i++) {
            if (!this._tableKitRows[i].hide)
                counter++;
        }
        return counter;
    },
    selectAllCheckBoxes: function (checkbox) {
        var checkboxes = this._table.tBodies[0].select("input[type=checkbox]");
        if (this.maxSelectablesCheckBoxes && this.maxSelectablesCheckBoxes < checkboxes.size() && this.checkBoxSelectAll.checked) {
            this.showWarning("above", this.warningMaxSelectablesCheckboxes);
            var total = 0;
            for (var i = 0; i < this._hashPages.size() && total < this.maxSelectablesCheckBoxes; i++) {
                if (i == 0)
                    var pageNumber = this._drawnPage;
                else {
                    if (i + this._drawnPage > this._hashPages.size() - 1) {
                        if (this._drawnPage == 0)
                            return;
                        else
                            var pageNumber = this._drawnPage - 1;
                    }
                    else
                        var pageNumber = i + this._drawnPage;
                }
                var pageX = objectToArray(this._hashPages.get(pageNumber));
                for (var j = 0; j < pageX.size() && total < this.maxSelectablesCheckBoxes; j++) {
                    var check = pageX[j].element.select("input[type=checkbox]");
                    if (this.checkBoxSelectAll.checked) {
                        if (check[0] && !check[0].checked){
                            check[0].click();
                            total = total + 1;
                        }
                    }    
                }
            }
        }
        else {
            var checkboxes = this._table.tBodies[0].select("input[type=checkbox]");
            for (var i = 0; i < checkboxes.size(); i++) {
                if (this.checkBoxSelectAll.checked) {
                    if (!checkboxes[i].checked)
                        checkboxes[i].click();
                }
                else {
                    if (checkboxes[i].checked)
                        checkboxes[i].click();
                }
            }
        }
    },
    /**
    *@param {row} element Row to add.
    *@description Function to add a new row in table kit
    *input (emphasizing this text) 
    */
    showWarning: function (collocation, message, staticMessage) {
        var warningDiv = $(this._table.identify() + '_warning_' + collocation);
        if (warningDiv)
            warningDiv.remove();
        var warningDiv = new Element("div", { "id": this._table.identify() + '_warning_' + collocation, "class": "tableKitV2_warningMessage" + collocation });
        warningDiv.insert(message);
        if (collocation == "above")
            Element.insert(this._table, { before: warningDiv });
        if (collocation == "below")
            Element.insert(this._table, { after: warningDiv });
        warningDiv.show();
        if (!staticMessage)
            Effect.Fade(warningDiv, { duration: 3.0 });
    },
    /**
    *@param {row} element Row to add.
    *@description Function to add a new row in table kit
    *input (emphasizing this text) 
    */
    addRow: function (row) {
    },

    /**
    *@param {status} string New Status
    *@description Function to update the status of the table
    */
    _updateStatus: function (status) {
        switch (status) {
            case "None":
                break;
            case "Searched":
                if (this._status.include("None"))
                    this._status = this._status.gsub("None", "");
                if (!this._status.include("Searched"))
                    this._status = this._status + status;
                break;
            case "NoSearched":
                if (this._status.include("Searched"))
                    this._status = this._status.gsub("Searched", "");
                break;
            case "Filtered":
                if (this._status.include("None"))
                    this._status = this._status.gsub("None", "");
                if (!this._status.include("Filtered"))
                    this._status = this._status + status;
                break;
            case "NoFiltered":
                if (this._status.include("Filtered"))
                    this._status = this._status.gsub("Filtered", "");
                break;
            case "Sorted":
                if (this._status.include("None"))
                    this._status = this._status.gsub("None", "");
                if (!this._status.include("Sorted"))
                    this._status = this._status + status;
                break;
            case "NoSorted":
                if (this._status.include("Sorted"))
                    this._status = this._status.gsub("Sorted", "");
                break;
            default:
                break;
        }
        return this._status;
    },

    /**
    *@description Function to calculate the order of the rows in the table. 
    *@param {index} int Index of the column that decide the sort of the table
    *@param {cell} element Cell pushed to sort the table
    *@param {reload} boolean True if the table is reloading or false if the table is building.
    */
    _orderEngine: function (index, cell, init, reload) {
        if (this._status.include("Sorted"))
            this._applySort(index, cell, init, reload);

        if (this._status.include("Filtered"))
            this._applyFilter();

        if (this._status.include("Searched"))
            this._applySearch();

        this._pagination();
        //After any operation we go back to "0" page, could be change to any page.
        this.draw(0);
    },

    /**
    *@description Function to recover the status filter
    *@param {newTable} boolean True if the table is new (has different columns) false on the contrary
    *@param {table} element Table Html
    *@param {reinitialize} boolean True if the table is reloading or false if the table is building.
    */
    recoveryFilter: function (newTable, table, reinitialize) {
        if (!newTable) {
            if (this.filters) {
                this._storingBackupData(this._table, true);
                this._removeFilter();
                //Draw the filter, with the previous selection
                this._drawFilter();
                this._recoverFilterApplied();
            }
            else
                this._storingBackupData(this._table, false);
        }
        else {
            if (this.filters) {
                this._removeFilter();
                this.initialize(table, null, true);
                this._recoverFilterApplied();
            }
            else
                this.initialize(table, null, true);
        }
    },

    /**
    *@description Function to recover the sorting status. 
    *@param {newTable} boolean True if the table is new (has different columns) false on the contrary
    *@param {table} element Table Html
    */
    recoverySort: function (newTable, table) {
        if (this.sortable)
            this._initSort(true);
    },
    /**
    *@description Function to reset all the parameter of the table. 
    *@param {table} element Table Html
    */
    resetTable: function (table) {
        this._reinitializeSearch();
        this._textToSearch = "";
        if (this.filter)
            this._removeFilter();
        for (var i = 0; i < this._columnHeader.length; i++) {
            this._columnHeader[i].stopObserving('click');
        }
        this.initialize(table, null, true);
    },
    /**
    *@description Function to check if the table currently passed has the same columns that the before one.
    *@param {oldTable} element Columns of the old table
    *@param {newTable} element Columns of the new table
    */
    _sameTable: function (oldTable, newTable) {
        if (oldTable.size() != newTable.size())
            return false;
        for (var i = 0; i < oldTable.size(); i++) {
            var oldColumn = oldTable[i];
            var newColumn = newTable[i];
            if (!oldColumn.innerHTML == newColumn.innerHTML)
                return false;
        }
        return true;
    },
    /**
    *@param {table} element 
    *@description reload the table, if the table is different, the module will be rebuilt. If it the same, just the data base will be rebuilt.
    */
    reloadTable: function (table, reset) {
        reset = (Object.isEmpty(reset) || reset == false) ? false : true
        if (table) {
            if (!reset) {
                if (this._sameTable(this._columnHeader, $(table.children[0].children[0]).childElements())) {
                    //It's the same table, and the header and the foot are the same.
                    this.recoveryFilter(false, table);
                    var ordered = this.recoverySort(false, table);
                    if (!ordered)
                        this._orderEngine();
                }
                else {
                    //It's a new table, it's neccesary the rebuilding of the table
                    this.recoveryFilter(true, table)
                }
            }
            else
                this.resetTable(table);
        }
        else {
            if (this.filters) {
                this.recoveryFilter(false, table)
                //Sorting
                var ordered = this.recoverySort(false, table);
                if (!ordered)
                    this._orderEngine();
            }
            else
                this._storingBackupData(this._table, false);
        }
    },

    /**
    *@description Method to hide a column.
    *@param {index} column to hide
    **/
    hideColumn: function (index) {
        var dis = 'none';
        var rows = this._table.select('tbody > tr');
        for (i = 0; i < rows.length; i++)
            rows[i].getElementsByTagName('td')[index].style.display = dis;
        this._columnHeader[index].style.display = dis;
        this.hashHiddenColumn.set(index, "X");
    },
    /**
    *@description Method to hide a column.
    *@param {index} column to hide
    **/
    showColumn: function (index) {
        dis = '';
        fila = this._table.select('tbody > tr');
        for (i = 0; i < fila.length; i++)
            fila[i].getElementsByTagName('td')[index].style.display = dis;
        this._columnHeader[index].style.display = dis;
        this.hashHiddenColumn.unset(index);
    },
    /**
    *@description Method to destroy the table
    **/
    destroy: function () {
        document.stopObserving("EWS:tableKit_correctInterval");
        document.stopObserving('EWS:autocompleterResultSelected');
        var search = $(this._table.identify() + '_searchBox');
        if (search)
            search.remove();
        if (this.complexSearchDiv)
            this.complexSearchDiv = null;

        var filter = $(this._table.identify() + '_FilterDiv');
        if (filter)
            filter.remove();
        if (this.filterDiv)
            this.filterDiv = null;

        if (this.table) {
            this.table.remove();
            this.table = null;
        }
    },

    /***************************************************************************************************************/
    /****************************************** Methods to Paginate ************************************************/
    /***************************************************************************************************************/
    /**
    *@description Method to calculate the page of each row in the current moment.
    **/
    _pagination: function () {
        if (this.pagination) {
            //Reset the drawn page
            this._unPainted(true);
            this._hashPages = $H();
            for (var i = 0; i < this._tableKitRows.length; i++) {
                var objectRow = this._tableKitRows[i];
                if (!objectRow.hide) {
                    //With the order of the element in the list, we extract the page because we know the elements per page
                    objectRow.orderInPage = objectRow.currentPosition % this.pages;
                    //We calculate the page of the row
                    objectRow.page = (objectRow.currentPosition / this.pages) | 0;
                    //We store the element in the right position of the hash
                    if (this._hashPages.get(objectRow.page))
                        this._hashPages.get(objectRow.page)[objectRow.orderInPage] = objectRow;
                    else {
                        var arrayElementPerPage = $A();
                        arrayElementPerPage[objectRow.orderInPage] = objectRow;
                        this._hashPages.set(objectRow.page, arrayElementPerPage);
                    }
                }
            }
        }
        else {
            var arrayElementPerPage = $A();
            for (var i = 0; i < this._tableKitRows.length; i++) {
                var objectRow = this._tableKitRows[i];
                if (!objectRow.hide)
                    arrayElementPerPage[objectRow.currentPosition] = objectRow;
            }
            if (arrayElementPerPage.length > 0)
                this._hashPages.set(0, arrayElementPerPage);
            else
                this._hashPages = $H();
        }
        //We keep the total pages at the moment
        this._totalPages = Object.isEmpty(this.backEndPagination) ? this._hashPages.keys().length : this.backEndPagination.numberPages;
    },

    /**
    *@description Method to move to an specific page (written in the text box)
    **/
    goSelectedPage: function (e, table) {
        if (e.keyCode == 13) {
            var value = parseInt(this.numberPageInput.value, 10);
            var totalPage = this.backEndPagination ? this.backEndPagination.numberPages : this._totalPages;
            if (isNaN(value) || ((value - 1 >= totalPage) || (value <= 0)))
                this.numberPageInput.addClassName('tableKit_pageField_error');
            else {
                if (Object.isEmpty(this.backEndPagination)) {
                    this.numberPageInput.removeClassName('tableKit_pageField_error');
                    this.eventLauncher("paginationRequest", value - 1, this._drawnPage);
                    this.draw(value - 1);
                    this.eventLauncher("paginationChanged", value - 1, this._drawnPage);
                }
                else {
                    this.iconPaginationBackend.show()
                    this.backEndPaginationCurrentPage = value - 1;
                    var functionAux = this.backEndPagination.goSelectedPage.curry(value);
                    functionAux();
                }
            }
        }
    },

    /**
    *@description Method to move to the following page
    **/
    goNextPage: function () {
        if (Object.isEmpty(this.backEndPagination)) {
            if (this._drawnPage + 1 < this._totalPages) {
                this.eventLauncher("paginationRequest", this._drawnPage + 1, this._drawnPage);
                this.draw(this._drawnPage + 1);
                this.eventLauncher("paginationChanged", this._drawnPage + 1, this._drawnPage);
            }
        }
        else {
            this.iconPaginationBackend.show()
            this.backEndPaginationCurrentPage++;
            this.backEndPagination.nextHandler();
        }
    },

    /**
    *@description Method to move to the previous page
    **/
    goPreviousPage: function () {
        if (Object.isEmpty(this.backEndPagination)) {
            if (this._drawnPage - 1 >= 0) {
                this.eventLauncher("paginationRequest", this._drawnPage - 1, this._drawnPage);
                this.draw(this._drawnPage - 1);
                this.eventLauncher("paginationChanged", this._drawnPage - 1, this._drawnPage);
            }
        }
        else {
            this.iconPaginationBackend.show();
            this.backEndPaginationCurrentPage--;
            this.backEndPagination.previousHandler();
        }
    },

    /**
    *@description Method to move to the last page
    **/
    goLastPage: function () {
        if (Object.isEmpty(this.backEndPagination)) {
            this.eventLauncher("paginationRequest", this._totalPages - 1, this._drawnPage);
            this.draw(this._totalPages - 1);
            this.eventLauncher("paginationChanged", this._totalPages - 1, this._drawnPage);
        }
        else {
            this.iconPaginationBackend.show();
            this.backEndPaginationCurrentPage = this.backEndPagination.numberPages - 1;
            this.backEndPagination.lastHandler();
        }
    },
    /**
    *@description Method to move to the fist page
    **/
    goFirstPage: function () {
        if (Object.isEmpty(this.backEndPagination)) {
            this.eventLauncher("paginationRequest", 0, this._drawnPage);
            this.draw(0);
            this.eventLauncher("paginationChanged", 0, this._drawnPage);
        }
        else {
            this.iconPaginationBackend.show();
            this.backEndPaginationCurrentPage = 0;
            this.backEndPagination.firstHandler();
        }
    },
    /**
    *@description Method to launch events
    **/
    eventLauncher: function (type, aux1, aux2) {
        switch (type) {
            case "paginationRequest":
                if (this.paginationEvents) {
                    document.fire(this.eventPaginationRequested, {
                        tableId: this._table.identify(),
                        pageFrom: aux2 + 1,
                        pageTo: aux1 + 1
                    });
                }
                break;
            case "paginationChanged":
                if (this.paginationEvents) {
                    document.fire(this.eventPaginationChanged, {
                        tableId: this._table.identify(),
                        pageFrom: aux2 + 1,
                        pageTo: aux1 + 1
                    });
                }
                break;
            case "filter":
                if (this.filteringEvents)
                    document.fire(this.eventFilterApplied, {
                        tableId: this._table.identify(),
                        filterApplied: aux1
                    });
                break;
            case "filterRequested":
                if (this.filteringEvents)
                    document.fire(this.eventFilterRequested, {
                        tableId: this._table.identify(),
                        filterApplied: aux1
                    });
                break;
            case "sorting":
                if (this.sortingEvents)
                    document.fire(this.eventSortingPerformed, {
                        tableId: this._table.identify(),
                        columnId: aux1
                    });
                break;
            case "searchingRequest":
                if (this.searchingEvents)
                    document.fire(this.eventSearchRequested, {
                        tableId: this._table.identify(), text: aux1
                    })
                break;
            case "searchingExecuted":
                if (this.searchingEvents)
                    document.fire(this.eventSearchPerformed, {
                        tableId: this._table.identify(), text: aux1
                    })
                break;
            default:
                break;
        }
    },
    /************************************** End MethodsPaginate ************************************************/
    /***************************************************************************************************************/
    /******************************************Search Methods**************************************************/
    /**
    *@param {Event} event The event generated when editing the complex search field
    *@description makes appear in the pending request table only the tasks that contain the typed text on the complex text search
    *input (emphasizing this text) 
    */
    searchKeyUp: function (event, input) {
        searchEmpty = false;
        if (!this.quickSearch) {
            if (event.keyCode != 9) {
                this.eventLauncher("searchingRequest", $F(input))
                if (event.keyCode == 8 || event.keyCode == 46 || (event.ctrlKey && event.keyCode == 88)) {
                    this._updateStatus("NoSearched");
                    this._reinitializeSearch();
                }
                this._textToSearch = Event.element(event).value.toLowerCase();
                if (this._textToSearch != "")
                    this._updateStatus("Searched");

                this._orderEngine();
                this.eventLauncher("searchingExecuted", $F(input))
            }
        }
        else {
            if (this.buttonSearch.hasClassName("tableKitV2_search_button_disable")) {
                this.buttonSearch.removeClassName("tableKitV2_search_button_disable");
                this.buttonSearch.addClassName("tableKitV2_search_button_enable");
                //this.buttonSearch.disabled = false;
            }
            if (event.keyCode == 13) {
                if (this.iconLoading)
                    $('divIcon').show();
                this.insertSearch.bind(this, Event.element(event).value).defer();
            }
        }
    },
    /**
    *@description Function called when the button of search is pressed (Just with QuickSearch)
    */
    searchButtonClick: function () {
        var text = $(this._table.identify() + '_searchBox').value;
        if (text != this.searchLabel && !searchEmpty) {
            if (this.iconLoading)
                $('divIcon').show();
            this.insertSearch.bind(this, $(this._table.identify() + '_searchBox').value).defer();
        }
        else {// Empty search
            if (this._status.include("Searched")) {
                if (this.iconLoading)
                    $('divIcon').show();
                this._updateStatus("NoSearched");
                this._reinitializeSearch.bind(this).defer();
            }
        }
    },
    /**
    *@description Function called to perform the search
    *@param {text} Text to search
    */
    insertSearch: function (text) {
        this.eventLauncher("searchingRequest", text);
        if (text.toLowerCase() != "") {
            this._textToSearch = text.toLowerCase();
            if (this._textToSearch != "")
                this._updateStatus("Searched");
            this._orderEngine();
        }
        else {
            this._updateStatus("NoSearched");
            this._reinitializeSearch();
            this._textToSearch = text.toLowerCase();
            if (this._textToSearch != "")
                this._updateStatus("Searched");
            this._orderEngine();
        }
        this.eventLauncher("searchingExecuted", text);
        if (this.iconLoading)
            this.divIcon.hide.bind(this.divIcon).defer();
    },
    /**
    *@param {row} element row to check
    *@param {textToSearch} string text to look for
    *@description Function to decide if a row has a column to be underlined
    *input (emphasizing this text) 
    */
    _underlineSearch: function (row, textToSearch) {
        var columns = row.element.childElements();
        row.underline = false;
        row.underlineIndex = $A();
        for (var i = 0; i < row.contentColumn.keys().length; i++) {
            var element = columns[i];
            if (this._underlineColumn(row.contentColumn.get(i.toString()).toLowerCase(), textToSearch)) {
                row.underline = true;
                row.underlineIndex.push(i);
            }
        }
    },

    /**
    *@param {column} column to check
    *@param {text} string text to look for
    *@description Function to decide if a row has a column to be underlined
    *input (emphasizing this text) 
    */
    _underlineColumn: function (column, text) {
        var words = text.trim().split(' ');
        for (var i = 0; i < words.length; i++) {
            if (column.include(words[i]))
                return true;
        }
        return false;
    },

    /**
    *@param {row} element row to restore
    *@description Function to reset the initial status of a row (no-underline)
    */
    _deleteUnderline: function (row) {
        var columns = row.element.childElements();
        for (var i = 0; i < columns.length; i++) {
            columns[i].removeClassName('tableKitV2_underline');

        }
        row.underlineIndex = $A(),
        row.underline = false;
    },
    /**
    *@description Iterate for the table, and hide the row that don't acomplish the search condition
    */
    _applySearch: function () {
        if (this._textToSearch != "") {
            var counter = 0;
            this.auxArrayOrder = $A();
            //Pre-storing, extract an array ordered by the current position in the list
            for (var i = 0; i < this._tableKitRows.length; i++) {
                if (this._status.include("Filtered")) {
                    if (!this._tableKitRows[i].hide)
                        this.auxArrayOrder[this._tableKitRows[i].currentPosition] = { element: this._tableKitRows[i], originalIndex: i };
                }
                else
                    this.auxArrayOrder[this._tableKitRows[i].originalPosition] = { element: this._tableKitRows[i], originalIndex: i };
            }
            //Searching
            for (var i = 0; i < this.auxArrayOrder.length; i++) {
                var objectRow = this._tableKitRows[i];
                if (this.search_hasToBeShown(this.auxArrayOrder[i], this._textToSearch.toLowerCase())) {
                    this.auxArrayOrder[i].element.hide = false;
                    if (this._status.include("Filtered"))
                        this.auxArrayOrder[i].element.currentPosition = this.auxArrayOrder[i].element.currentPosition - counter;
                    else
                        this.auxArrayOrder[i].element.currentPosition = this.auxArrayOrder[i].element.originalPosition - counter;
                    if (this.underlineSearch)
                        this._underlineSearch(this.auxArrayOrder[i].element, this._textToSearch.toLowerCase());
                }
                else {
                    counter++;
                    this.auxArrayOrder[i].element.hide = true;
                }
            }
        }
    },
    /**
    *@description Function to check if the row has to be included in the results
    *@param {row} element row to check
    *@param {text} string text to look for
    */
    search_hasToBeShown: function (row, text) {
        var words = text.trim().split(' ');
        for (var i = 0; i < words.length; i++) {
            var found = false;
            var keys = row.element.contentColumn.keys()
            for (var j = 0; j < keys.length; j++) {
                if (!this.hashHiddenColumn.get(keys[j]) && !this._columnHeader[keys[j]].hasClassName(this.noSearchableClass)) {
                    if (row.element.contentColumn.get(keys[j]).toLowerCase().include(words[i])) {
                        found = true;
                        break;
                    }
                }
            }
            if (!found)
                return false
        }
        return true;
    },

    /**
    *@description Recover the order of the list, to the status before searching
    */
    _reinitializeSearch: function () {
        for (var i = 0; i < this._tableKitRows.length; i++) {
            var objectRow = this._tableKitRows[i];
            objectRow.hide = false;
            objectRow.currentPosition = objectRow.originalPosition;
            if (objectRow.underline)
                this._deleteUnderline(objectRow);
        }
        //The icon is hidden when the search is reinitialize (Remember icon just work with quickSearch, so this function is called just when the search box is empty
        if (this.iconLoading && this.divIcon)
            this.divIcon.hide.bind(this.divIcon).defer();
    },

    /**
    *@param {Event} event Event called when the user start editing a complex search 
    *@description This function is triggered when doing focus on the text field, and eliminates the help text.
    */
    fieldFocus: function (event) {
        if (Event.element(event).value == this.searchLabel) {
            event.element(event).select();
            event.element(event).clear();
            return;
        }
    },
    /**************************************** End Search Methods **********************************************/
    /**********************************************************************************************************/
    /****************************************** Sort Methods **************************************************/
    /**
    *@description Check in the html table, if is there a predefined order, and set the event to make click in the header
    *@return if the function has invoked the orderEngine
    */

    _initSort: function (reload) {
        if (!reload) {
            for (var i = 0; i < this._columnHeader.length; i++) {
                if (!this._columnHeader[i].hasClassName(this.noSortClass)) {
                    //Event.observe(this._columnHeader[i], 'mousedown', this._sort.bindAsEventListener(this));
                    //$(this._columnHeader[i].identify()).stopObserving('click', this._sort.bind(this, this._columnHeader[i]));
                    this._columnHeader[i].observe('click', this._sort.bind(this, this._columnHeader[i]));
                    if (!global.liteVersion)
                        this._columnHeader[i].addClassName(this.columnClass);
                    if ((this._columnHeader[i].hasClassName(this.sortFirstAscendingClass)) || (this._columnHeader[i].hasClassName(this.sortFirstDecendingClass))) {
                        this.initSort = this._columnHeader[i];
                        this.indexToSort = i;
                    }
                }
            }
            if (this.initSort) {
                this._updateStatus("Sorted");
                this._orderEngine(this.indexToSort, this.initSort, true, false);
                return true;
            }
            else
                return false;
        }
        else {
            this.initSort = this._columnHeader[this.indexToSort];
            this._orderEngine(this.indexToSort, this.initSort, true, true);
            return true;
        }
    },

    /**
    *@description Return the type of the cell (date, text, time,...)
    *@param index of the column
    */
    _findTypeDataSort: function (index) {
        for (var i = 0; this.typesSort && i < this.typesSort.length; i++) {
            if (this.typesSort[i].indexColumn == index)
                return this.typesSort[i].typeSort;
        }
        if (this._tableKitRows[0] && this._tableKitRows[0].element) {
            var i = 0;
            var cell = this._tableKitRows[0].element.cells[index];
            var text = cell.textContent ? cell.textContent : cell.innerText;
            while (Object.isEmpty(text) && (i < this._tableKitRows.length)) {
                cell = this._tableKitRows[i].element.cells[index]; // grab same index cell from body row to try and match data type
                if (cell)
                    text = cell.textContent ? cell.textContent : cell.innerText
                i += 1
            }
            //First,Checking if the column it is a date
            if (i != this._tableKitRows.length) {
                return this.types.detect(
                 function (v) {
                     if (Object.isEmpty(v.pattern) || text.match(v.pattern)) {
                         return true;
                     }
                     return false;
                 });
            }
        }
        else
            return null; //All the cell in the column are empty    
    },
    //    _getSrcElement: function (event) {
    //        if (Prototype.Browser.IE)
    //            return event.srcElement ? event.srcElement : null;
    //        else
    //            return event.target ? event.target : null;
    //    },

    /**
    *@description called function when it is pushed the header of the column, that invoke the sort operation.
    */
    _sort: function (e, event) {
        var test = this.currentRowsShown();
        Event.stop(event);
        var element = e;
        if (element.id.include("Index:")) {
            var id = Event.element(e).id;
            var index = id.substring(id.lastIndexOf(":") + 1, id.length);
            var cell = this._columnHeader[index];
        } else
            var cell = e;

        for (var i = 0; i < this._columnHeader.length; i++) {
            var textColumn = this._columnHeader[i].textContent ? this._columnHeader[i].textContent : this._columnHeader[i].innerText
            var textPushed = cell.textContent ? cell.textContent : cell.innerText
            if (textColumn == textPushed) {
                this.indexToSort = i;
                break;
            }
        }
        this._updateStatus("Sorted");
        this._orderEngine(this.indexToSort, cell, false);
        this.eventLauncher("sorting", this._columnHeader[this.indexToSort].id)
    },

    /**
    *@description Set the event of the column header so that sort the table.
    *@param {int} Index of the column that indicate the order
    *@init {boolean} Indicates if it is the first time that the table is sorted
    *@reload {boolean} Indicates if it the sort comes from a reload function.
    */
    _applySort: function (index, cell, init, reload) {

        if (!cell || Object.isEmpty(index) || cell.hasClassName(this.noSortClass)) {
            return;
        }
        //Calculate the order
        if (index != this.indexSorted || reload) {
            //We take the order, PENDING to set the order by default
            this.order = (cell.hasClassName(this.descendingClass) || cell.hasClassName(this.sortFirstDecendingClass)) ? 1 : -1;
            //We take the type of data of the column to order
            this.typeDataSort = this._findTypeDataSort(index);
            if (!Object.isEmpty(this.typeDataSort)) {
                //We create an array ordered with the current position of the list
                this.auxArrayOrder = $A();
                for (var i = 0; i < this._tableKitRows.length; i++) {
                    this.auxArrayOrder[this._tableKitRows[i].originalPosition] = { element: this._tableKitRows[i].contentColumn.get(index), originalIndex: i };
                }
                //We call to bubbleSort (Recursive method is not used because with Firefox there is a limit of 15 iterations)
                this._bubbleSort(this.auxArrayOrder, this.order)
                //Copy the calcuted order in the real array
                for (var i = 0; i < this.auxArrayOrder.length; i++) {
                    this._tableKitRows[this.auxArrayOrder[i].originalIndex].currentPosition = i;
                    this._tableKitRows[this.auxArrayOrder[i].originalIndex].originalPosition = i;
                }
            }
            this.indexSorted = index;
        }
        else {
            //Pre-storing
            this.order = this.order * (-1);
            this.auxArrayOrder = $A();
            for (var i = 0; i < this._tableKitRows.length; i++) {
                this.auxArrayOrder[this._tableKitRows[i].originalPosition] = { element: this._tableKitRows[i], originalIndex: i };
            }
            this.auxArrayOrder.reverse();
            for (var i = 0; i < this.auxArrayOrder.length; i++) {
                this._tableKitRows[this.auxArrayOrder[i].originalIndex].currentPosition = i;
                this._tableKitRows[this.auxArrayOrder[i].originalIndex].originalPosition = i;
            }
        }
        //Set the style of the head (triangle)
        for (var i = 0; i < this._columnHeader.length; i++) {
            this._columnHeader[i].removeClassName(this.ascendingClass);
            this._columnHeader[i].removeClassName(this.descendingClass);
            if (!global.liteVersion) {
                if (index === i) {
                    if (this.order === -1) {
                        this._columnHeader[i].addClassName(this.ascendingClass);
                    } else {
                        this._columnHeader[i].addClassName(this.descendingClass);
                    }
                }
            }
            else {
                var iExplorer = this.buttonsHeaderLiteVersion[index].buttons.down().innerText ? true : false
                //If the column doesn't incicate the order, we set it with a "-"
                if (iExplorer)
                    this.buttonsHeaderLiteVersion[i].buttons.down().innerText = "-";
                else
                    this.buttonsHeaderLiteVersion[i].buttons.down().textContent = "-";
                if (index === i) {
                    if (this.order === -1) {
                        var iExplorer = this.buttonsHeaderLiteVersion[i].buttons.down().innerText ? true : false
                        if (iExplorer) {
                            this.buttonsHeaderLiteVersion[i].buttons.down().innerText = this.labelArrowDownLite;
                        }
                        else {
                            this.buttonsHeaderLiteVersion[i].buttons.down().textContent = this.labelArrowDownLite;
                        }
                    } else {
                        var iExplorer = this.buttonsHeaderLiteVersion[i].buttons.down().innerText ? true : false
                        if (iExplorer) {
                            this.buttonsHeaderLiteVersion[i].buttons.down().innerText = this.labelArrowUpLite;
                        }
                        else {
                            this.buttonsHeaderLiteVersion[i].buttons.down().textContent = this.labelArrowUpLite;
                        }

                    }
                }
            }

        }
    },
    /**
    *@description Method to order the rows, WE DON'T USE algorithm QUICKSORT cause the current level of maximum recursivity of Firefox is 20, and it too short for the module
    */
    _bubbleSort: function (array, order) {
        var temp;
        var t = array.length;
        if (order == -1) {
            for (var i = 1; i < t; i++) {
                for (var k = t - 1; k >= i; k--) {
                    if (this.typeDataSort.compare(array[k].element, array[k - 1].element) < 0) {
                        temp = array[k];
                        array[k] = array[k - 1];
                        array[k - 1] = temp;
                    } //end if
                } //end 2 for
            } //end 1 for
        }
        else {
            for (var i = 1; i < t; i++) {
                for (var k = t - 1; k >= i; k--) {
                    if (this.typeDataSort.compare(array[k].element, array[k - 1].element) > 0) {
                        temp = array[k];
                        array[k] = array[k - 1];
                        array[k - 1] = temp;
                    } //end if
                } //end 2 for
            } //end 1 for
        }
    },

    /**
    *@description Function to add the current format of date in the structure of types of data
    */
    _processDateFormat: function () {

        //If the developer didn't parse the format, it take it of global
        var formatDate;
        if (Object.isEmpty(this.dateFormat))
            formatDate = global.dateFormat;
        else
            formatDate = this.dateFormat;

        switch (formatDate.toUpperCase()) {
            case "DD.MM.YYYY":
                this.types[0] = {
                    name: 'dateResult' + formatDate,
                    pattern: /^\d{2}.\d{2}.\d{4}/i,
                    normal: function (v) {
                        if (!this.pattern.test(v)) {
                            return 0;
                        }
                        var r = v.match(/^(\d{2}).(\d{2}).(\d{4})/);
                        var yr_num = r[3];
                        var mo_num = parseInt(r[2], 10) - 1;
                        var day_num = r[1];
                        return new Date(yr_num, mo_num, day_num).valueOf();
                    },
                    compare: function (a, b) {
                        var auxA = this.normal(a);
                        var auxB = this.normal(b);
                        return auxA > auxB ? 1 : -1;
                    }
                };
                break;
            case "MM-DD-YYYY":
                this.types[0] = {
                    name: 'dateResult' + formatDate,
                    pattern: /^\d{2}-\d{2}-\d{4}/i,
                    normal: function (v) {
                        if (!this.pattern.test(v)) {
                            return 0;
                        }
                        var r = v.match(/^(\d{2})-(\d{2})-(\d{4})/);
                        var yr_num = r[3];
                        var mo_num = parseInt(r[1], 10) - 1;
                        var day_num = r[2];
                        return new Date(yr_num, mo_num, day_num).valueOf();
                    },
                    compare: function (a, b) {
                        var auxA = this.normal(a);
                        var auxB = this.normal(b);
                        return auxA > auxB ? 1 : -1;
                    }
                };
                break;
            case "MM/DD/YYYY": //To Debugg
                this.types[0] = {
                    name: 'dateResult' + formatDate,
                    pattern: /^\d{2}\/\d{2}\/\d{4}/i,
                    normal: function (v) {
                        if (!this.pattern.test(v)) {
                            return 0;
                        }
                        var r = v.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
                        var yr_num = r[3];
                        var mo_num = parseInt(r[1], 10) - 1;
                        var day_num = r[2];
                        return new Date(yr_num, mo_num, day_num).valueOf();
                    },
                    compare: function (a, b) {
                        var auxA = this.normal(a);
                        var auxB = this.normal(b);
                        return auxA > auxB ? 1 : -1;
                    }
                };
                break;
            case "YYYY.MM.DD":
                this.types[0] = {
                    name: 'dateResult' + formatDate,
                    pattern: /^\d{2}.\d{2}.\d{4}/i,
                    normal: function (v) {
                        if (!this.pattern.test(v)) {
                            return 0;
                        }
                        var r = v.match(/^(\d{4}).(\d{2}).(\d{2})/);
                        var yr_num = r[1];
                        var mo_num = parseInt(r[2], 10) - 1;
                        var day_num = r[3];
                        return new Date(yr_num, mo_num, day_num).valueOf();
                    },
                    compare: function (a, b) {
                        var auxA = this.normal(a);
                        var auxB = this.normal(b);
                        return auxA > auxB ? 1 : -1;
                    }
                };
                break;
            default:
                //alert("TableKitV2 Module: The format date had been no recognized. Please contact with EuHReka Framework");
                break;
        }
    },

    /**
    *@param {textToLook} string The string of character to find in the table
    *@description makes the finding over the table of the text introduced in search text box
    */
    _chargeTypesRecognizer: function () {
        this._processDateFormat();
        this.types[1] = {
            name: 'date-iso',
            pattern: /[\d]{4}-[\d]{2}-[\d]{2}(?:T[\d]{2}\:[\d]{2}(?:\:[\d]{2}(?:\.[\d]+)?)?(Z|([-+][\d]{2}:[\d]{2})?)?)?/, // 2005-03-26T19:51:34Z
            normal: function (v) {
                if (!this.pattern.test(v)) {
                    return 0;
                }
                var d = v.match(/([\d]{4})(-([\d]{2})(-([\d]{2})(T([\d]{2}):([\d]{2})(:([\d]{2})(\.([\d]+))?)?(Z|(([-+])([\d]{2}):([\d]{2})))?)?)?)?/);
                var offset = 0;
                var date = new Date(d[1], 0, 1);
                if (d[3]) {
                    date.setMonth(d[3] - 1);
                }
                if (d[5]) {
                    date.setDate(d[5]);
                }
                if (d[7]) {
                    date.setHours(d[7]);
                }
                if (d[8]) {
                    date.setMinutes(d[8]);
                }
                if (d[10]) {
                    date.setSeconds(d[10]);
                }
                if (d[12]) {
                    date.setMilliseconds(Number("0." + d[12]) * 1000);
                }
                if (d[14]) {
                    offset = (Number(d[16]) * 60) + Number(d[17]);
                    offset *= ((d[15] === '-') ? 1 : -1);
                }
                offset -= date.getTimezoneOffset();
                if (offset !== 0) {
                    var time = (Number(date) + (offset * 60 * 1000));
                    date.setTime(Number(time));
                }
                return date.valueOf();
            },
            compare: function (a, b) {
                var auxA = this.normal(a);
                var auxB = this.normal(b);
                return auxA > auxB ? 1 : -1;
            }
        };
        this.types[1] = {
            name: 'date',
            pattern: /^(?:sun|mon|tue|wed|thu|fri|sat)\,\s\d{1,2}\s(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s\d{4}(?:\s\d{2}\:\d{2}(?:\:\d{2})?(?:\sGMT(?:[+-]\d{4})?)?)?/i, //Mon, 18 Dec 1995 17:28:35 GMT
            normal: function (v) {
                return new Date(v)
            },
            compare: function (a, b) { // must be standard javascript date format
                var auxA = this.normal(a);
                var auxB = this.normal(b);
                return auxA < auxB ? -1 : auxA === auxB ? 0 : 1;
            }
        };
        this.types[2] = {
            name: 'date-eu',
            pattern: /^\d{2}-\d{2}-\d{4}/i,
            normal: function (v) {
                if (!this.pattern.test(v)) {
                    return 0;
                }
                var r = v.match(/^(\d{2})-(\d{2})-(\d{4})/);
                var yr_num = r[3];
                var mo_num = parseInt(r[2], 10) - 1;
                var day_num = r[1];
                return new Date(yr_num, mo_num, day_num).valueOf();
            },
            compare: function (a, b) {
                var auxA = this.normal(a);
                var auxB = this.normal(b);
                return auxA > auxB ? 1 : -1;
            }
        },
        this.types[3] = {
            name: 'date-au',
            pattern: /^\d{2}\/\d{2}\/\d{4}\s?(?:\d{1,2}\:\d{2}(?:\:\d{2})?\s?[a|p]?m?)?/i,
            normal: function (v) {
                if (!this.pattern.test(v)) {
                    return 0;
                }
                var r = v.match(/^(\d{2})\/(\d{2})\/(\d{4})\s?(?:(\d{1,2})\:(\d{2})(?:\:(\d{2}))?\s?([a|p]?m?))?/i);
                var yr_num = r[3];
                var mo_num = parseInt(r[2], 10) - 1;
                var day_num = r[1];
                var hr_num = r[4] ? r[4] : 0;
                if (r[7]) {
                    var chr = parseInt(r[4], 10);
                    if (r[7].toLowerCase().indexOf('p') !== -1) {
                        hr_num = chr < 12 ? chr + 12 : chr;
                    } else if (r[7].toLowerCase().indexOf('a') !== -1) {
                        hr_num = chr < 12 ? chr : 0;
                    }
                }
                var min_num = r[5] ? r[5] : 0;
                var sec_num = r[6] ? r[6] : 0;
                return new Date(yr_num, mo_num, day_num, hr_num, min_num, sec_num, 0).valueOf();
            },
            compare: function (a, b) {
                var auxA = this.normal(a);
                var auxB = this.normal(b);
                return auxA > auxB ? 1 : -1;
            }
        },
        this.types[4] = {
            name: 'newDate',
            pattern: /^\d{2}.\d{2}.\d{4}/i,
            normal: function (v) {
                if (!this.pattern.test(v)) {
                    return 0;
                }
                var r = v.match(/^(\d{2}).(\d{2}).(\d{4})/);
                var yr_num = r[3];
                var mo_num = parseInt(r[2], 10) - 1;
                var day_num = r[1];
                return new Date(yr_num, mo_num, day_num).valueOf();
            },
            compare: function (a, b) {
                var auxA = this.normal(a);
                var auxB = this.normal(b);
                return auxA > auxB ? 1 : -1;
            }
        },
        this.types[5] = {
            name: 'time',
            pattern: /^\d{1,2}\:\d{2}(?:\:\d{2})?(?:\s[a|p]m)?$/i,
            compare: function (a, b) {
                var meridianA = null;
                var meridianB = null;
                if (a.toLowerCase().include("m")) {
                    if (a.toLowerCase().include("pm"))
                        meridianA = 1;
                    else
                        meridianA = -1;
                }
                if (b.toLowerCase().include("m")) {
                    if (b.toLowerCase().include("pm"))
                        meridianB = 1;
                    else
                        meridianB = -1;
                }
                if (!Object.isEmpty(meridianA) && !Object.isEmpty(meridianB)) {
                    if (meridianA == meridianB) {
                        if (parseInt(a, 10) != parseInt(b, 10))
                            return parseInt(a, 10) > parseInt(b, 10) ? 1 : -1;
                        else
                            return a > b;
                    }
                    else
                        return meridianA > meridianB ? 1 : -1;
                }
                var d = new Date();
                var ds = d.getMonth() + "/" + d.getDate() + "/" + d.getFullYear() + " ";
                var auxA = new Date(ds + a);
                var auxB = new Date(ds + b);
                return auxA < auxB ? -1 : auxA === auxB ? 0 : 1;
            }
        },
        this.types[6] = {
            name: 'currency',
            pattern: /^[$]/, // dollar,pound,yen,euro,generic currency symbol
            normal: function (v) {
                return v ? parseFloat(v.replace(/[^-\d\.]/g, '')) : 0;
            },
            compare: function (a, b) {
                return this.normal(a) > this.normal(b) ? 1 : -1;
            }
        },
        this.types[7] = {
            name: 'datasize',
            pattern: /^[-+]?[\d]*\.?[\d]+(?:[eE][-+]?[\d]+)?\s?[k|m|g|t]b$/i,
            normal: function (v) {
                var r = v.match(/^([-+]?[\d]*\.?[\d]+([eE][-+]?[\d]+)?)\s?([k|m|g|t]?b)?/i);
                var b = r[1] ? Number(r[1]).valueOf() : 0;
                var m = r[3] ? r[3].substr(0, 1).toLowerCase() : '';
                var result = b;
                switch (m) {
                    case 'k':
                        result = b * 1024;
                        break;
                    case 'm':
                        result = b * 1024 * 1024;
                        break;
                    case 'g':
                        result = b * 1024 * 1024 * 1024;
                        break;
                    case 't':
                        result = b * 1024 * 1024 * 1024 * 1024;
                        break;
                }
                return result;
            },
            compare: function (a, b) {
                return this.normal(a) > this.normal(b) ? 1 : -1;
            }
        },
        this.types[8] = {
            name: "number",
            pattern: /^[-+]?[\d]*\.?[\d]+(?:[eE][-+]?[\d]+)?/,
            normal: function (v) {
                // This will grab the first thing that looks like a number from a string, so you can use it to order a column of various srings containing numbers.
                v = parseFloat(v.replace(/^.*?([-+]?[\d]*\.?[\d]+(?:[eE][-+]?[\d]+)?).*$/, "$1"));
                return isNaN(v) ? 0 : v;
            },
            compare: function (a, b) {
                a = this.normal(a);
                b = this.normal(b);
                if (a > b)
                    return 1;
                else {
                    if (a == b)
                        return 0;
                    else
                        return -1;
                }
            }
        };
        this.types[9] = {
            name: 'casesensitivetext',
            pattern: /^[A-Z]+$/,
            normal: function (v) {
                return v ? v.toLowerCase() : '';
            },
            compare: function (a, b) {
                return this.normal(a) > this.normal(b) ? 1 : -1;
            }
        },
        this.types[10] = {
            name: "text",
            normal: function (v) {
                return v ? v.toLowerCase() : '';
            },
            compare: function (a, b) {
                return this.normal(a) > this.normal(b) ? 1 : -1;
            }
        };
    },
    /**************************************** End Sort Methods ************************************************/
    /***************************************** Filter Methods ************************************************/

    /**
    * @description: function to apply the selected filters to the table
    */
    _applyFilter: function () {
        var counter = 0;
        this.auxArrayOrder = $A();
        //Pre-storing, we take the current order
        for (var i = 0; i < this._tableKitRows.length; i++) {
            this.auxArrayOrder[this._tableKitRows[i].originalPosition] = { element: this._tableKitRows[i], originalIndex: this._tableKitRows[i].originalPosition };
        }
        //Filtering
        for (var i = 0; i < this.auxArrayOrder.length; i++) {
            var objectRow = this._tableKitRows[i];
            var toShow = false;
            //Criteria for the filtering
            if (this.filterApplied.keys().length > 0) {
                var toShow = this._hasToBeShown(this.auxArrayOrder[i])
                if (toShow) {
                    this.auxArrayOrder[i].element.hide = false;
                    this.auxArrayOrder[i].element.currentPosition = this.auxArrayOrder[i].element.originalPosition - counter;
                }
                else {
                    counter++;
                    this.auxArrayOrder[i].element.hide = true;
                }
            }
            else {
                this.auxArrayOrder[i].element.currentPosition = this.auxArrayOrder[i].originalIndex
                this.auxArrayOrder[i].element.hide = false;
            }
        }
        if (this.filterApplied.keys().length == 0)
            this._updateStatus("NoFiltered");
        this._recalculateFilters();
    },

    /**
    *@description Function that recalculate the ocurrences of each filter, called when a checkBox is pushed
    */
    _recalculateFilters: function () {
        //Reinicialize the hash with the ocurrences.
        var filtersKeys = this.wordsFilter.keys();
        for (var h = 0; h < filtersKeys.length; h++) {
            this.wordsFilter.set(filtersKeys[h], $H());
        }
        for (var i = 0; i < this._tableKitRows.length; i++) {
            if (!this._tableKitRows[i].hide)
                this._recalculateFilterPerRow(this._tableKitRows[i], false);
            else
                this._recalculateFilterPerRow(this._tableKitRows[i], true);
        }
        this._drawFilter(true);
        this._recalculateFiltersShown()
    },
    /**
    *@description Function to recover the set of filter shwon (pagination filters) 
    */
    _recalculateFiltersShown: function () {
        var iteration = this.firstFilterToShow;
        for (var i = 0; i < iteration; i++) {
            this._showNextFilter();
        }
    },

    /**
    *@description Function that recalculate the ocurrences of each filter in a individual row
    *@row element Row to look for
    */
    _recalculateFilterPerRow: function (row, hidden) {
        if (!this.multiSelectionFilter) {
            //Storation the occurrences of each column of the table
            if (!hidden) {//It is visible
                for (var j = 0; j < row.contentColumn.keys().length; j++) {
                    var content = row.contentColumn.get(j);
                    this.storeInformationFilter(content, this._columnHeader[j]);
                }
            }
        }
        else { //Inverse, we seach in the hidden row and decrease the counter of the ocurrence
            //Storation the occurrences of each column of the table
            for (var j = 0; j < row.contentColumn.keys().length; j++) {
                var content = row.contentColumn.get(j);
                if (!(!this.countWithEmptyCell && content == "")) {
                    if (!hidden)//It is visible
                        this.storeInformationFilter(content, this._columnHeader[j]);
                    else //It is hidden
                        this.storeInformationFilter(content, this._columnHeader[j], true);
                }
            }
        }
    },

    /**
    *@description Function called after a reload of the table, and marks the checbox previously selected
    */
    _recoverFilterApplied: function () {
        var filters = this.filterApplied.keys();
        for (var i = 0; filters && i < filters.length; i++) {
            var categoriesPerFilter = this.filterApplied.get(filters[i]);
            for (var j = 0; j < categoriesPerFilter.length; j++) {
                //Update the element of the array
                var element = $(this._table.identify() + categoriesPerFilter[j].filter + categoriesPerFilter[j].text);
                if (element) {
                    element.checked = true; element.defaultChecked = true;
                    categoriesPerFilter[j].element = element;
                }
                else {
                    delete categoriesPerFilter[j]
                    categoriesPerFilter = categoriesPerFilter.compact();
                    if (categoriesPerFilter.length == 0) {
                        this.filterApplied.unset(filters[i]);
                    }
                }
                //Mark the checkBox
            }
            categoriesPerFilter = categoriesPerFilter.compact();
            if (categoriesPerFilter.size() > 0)//When the table is reload and the filter applied before now doesn't have any ocurrences
                this.filterApplied.set(filters[i], categoriesPerFilter);

        }
    },

    /**
    *@description Reinitialize filter div
    */
    _removeFilter: function () {
        //Delete older filter Div
        this.contentFilterDiv.update("");
        this.contentFilterDiv.remove();
        this.filterDiv.update("");
        this.filterDiv.remove();
        this.filterDiv = null;
    },

    /**
    *@description Function called when the user clicks in the left arrow
    */
    _showPreviousFilter: function () {
        this.pageRight.show();
        if (!Object.isEmpty(this.showSecondariesFilter) && this.showSecondariesFilter == true) { //Secundary and Primary
            var filterToShow = null;
            var filterToHide = null;
            for (var i = 0; i < this.filters.length; i++) {
                if (this.filters[i].shown) {
                    filterToHide = i;
                }
            }
            for (var i = 0; i < this.filters.length; i++) {
                if (!this.filters[i].shown)
                    filterToShow = i;
                else {
                    if (this.filters[i].shown)
                        break;
                }
            }
            if (filterToShow == 0) {
                this.pageLeft.hide();
            }
        }
        else {
            var filterToShow = null;
            var filterToHide = null;
            for (var i = 0; i < this.filters.length; i++) {
                if (this.filters[i].main && this.filters[i].shown)
                    filterToHide = i;
            }
            for (var i = 0; i < this.filters.length; i++) {
                if (this.filters[i].main && !this.filters[i].shown)
                    filterToShow = i;
                else {
                    if (this.filters[i].main && this.filters[i].shown)
                        break;
                }
            }
            var isFirst = true;
            for (var i = filterToShow - 1; i >= 0; i--) {
                if (this.filters[i].main) {
                    isFirst = false;
                    break;
                }
            }
            if (isFirst)
                this.pageLeft.hide();
        }
        this._showFilter(filterToHide, filterToShow);
        this._updateReports();
        this.firstFilterToShow = filterToShow
    },

    /**
    *@description Function called when the user clicks in the right arrow
    */
    _showNextFilter: function () {
        this.pageLeft.show();
        if (!Object.isEmpty(this.showSecondariesFilter) && this.showSecondariesFilter == true) { //Secundary and Primary
            var filterToShow = null;
            var filterToHide = null;
            for (var i = 0; i < this.filters.length; i++) {
                if (this.filters[i].shown) {
                    filterToHide = i;
                    break;
                }
            }
            for (var i = this.filters.length - 1; i >= 0; i--) {
                if (!this.filters[i].shown)
                    filterToShow = i;
                if (this.filters[i].shown)
                    break;
            }
            if (filterToShow == this.filters.length - 1) {
                this.pageRight.hide();
            }
        } //Only Primaries
        else {
            var filterToShow = null;
            var filterToHide = null;
            for (var i = 0; i < this.filters.length; i++) {
                if (this.filters[i].main && this.filters[i].shown) {
                    filterToHide = i;
                    break;
                }
            }
            for (var i = this.filters.length - 1; i >= 0; i--) {
                if (this.filters[i].main && !this.filters[i].shown)
                    filterToShow = i;
                if (this.filters[i].main && this.filters[i].shown)
                    break;
            }
            var isLast = true;
            for (var i = filterToShow + 1; i < this.filters.length; i++) {
                if (this.filters[i].main) {
                    isLast = false;
                    break;
                }
            }
            if (isLast)
                this.pageRight.hide();
        }
        this._showFilter(filterToHide, filterToShow);
        this._updateReports();
        this.firstFilterToShow = filterToHide + 1
    },

    /**
    *@description Function to perform the hide and the show of a pair of filter
    */
    _showFilter: function (filterToHide, filterToShow) {
        if (!Object.isEmpty(filterToHide) && !Object.isEmpty(filterToShow) && filterToHide != filterToShow) {
            this.arrayDivFilters[filterToHide].div.hide();
            this.filters[filterToHide].shown = false;
            this.arrayDivFilters[filterToShow].div.show();
            this.filters[filterToShow].shown = true;
        }
    },

    /**
    *@description Function to insert the categories of a filter, ordered by the number of ocurrences
    *@param div element div to insert the categories of the filter
    *@filter structure Information of the filter.
    *@index Index of the corresponding column of the filter
    */
    _sortNumber: function (a, b) {
        return parseInt(a, 10) - parseInt(b, 10);
    },
    _drawOccurrence: function (labelToShow, filter, div) {

        if (labelToShow == "")
            labelToShow = this.emptyCell; //If the label to show is empty, we insert the empty label
        var divAux = new Element('div');
        var element = new Element('input', { 'type': 'checkbox', 'class': 'test_checkBox', id: this._table.identify() + filter.name + labelToShow });
        element.observe('click', this.pushCheckBox.bind(this, filter, labelToShow, element));
        divAux.insert(element);
        divAux.insert(labelToShow);
        div.insert(divAux);

        if (this.showReports) {
            //Show the number of ocurrences of a category
            var number = this.wordsFilter.get(filter.name.toLowerCase()).get(labelToShow)
            var spanReport = new Element('span');
            spanReport.setStyle("margin-left:5px");
            spanReport.addClassName("tableKitV2_filterOptionButtonDiv");
            spanReport.update("(" + number + ")");
            divAux.insert(spanReport);
            if (number == 0)
                divAux.addClassName("tableKitV2_reportCategoriesDisabled");
        }
        if (this.filterApplied.get(filter.name)) {
            //Recover the applied filter (after a recalculation)
            for (var k = 0; k < this.filterApplied.get(filter.name).length; k++) {
                if (this.filterApplied.get(filter.name)[k].text.toLowerCase() == labelToShow.toLowerCase()) {
                    element.checked = true; element.defaultChecked = true;
                    this.filterApplied.get(filter.name)[k].element = element;
                    break;
                }
            }
        }
    },
    _insertCategories: function (div, filter, index) {
        if (this.wordsFilter.get(filter.name.toLowerCase())) {
            if (!filter.type) {
                var orderOcurrenciesAux = $A();
                //We order the words by number of ocurrences in the column
                var filterHash = this.wordsFilter.get(filter.name.toLowerCase());
                var filterName = filter.name.toLowerCase();
                var filterKeys = this.wordsFilter.get(filterName).keys();
                var total = 0;
                if (!this._modeBigSize) {
                    for (var i = 0; i < filterKeys.length; i++) {
                        var key = filterKeys[i];
                        var ocurrences = filterHash.get(key);
                        var orderAux = orderOcurrenciesAux[ocurrences];
                        if (orderAux)
                            orderAux.push(key); // + "_SPLIT_" + orderOcurrenciesAux[filterHash.get(key)];
                        else {
                            orderOcurrenciesAux[ocurrences] = $A();
                            orderOcurrenciesAux[ocurrences].push(key);
                        }
                    }
                    //We insert the words in the div
                    orderOcurrenciesAux = orderOcurrenciesAux.compact();
                    this.ocurrenciesFilter.set(filter.name, orderOcurrenciesAux);
                    var j = 0;
                    for (var i = orderOcurrenciesAux.length - 1; i >= 0 && total < this.maxNumberCategories; i--) {
                        var array = orderOcurrenciesAux[i];
                        for (j = 0; j < array.length && total < this.maxNumberCategories; j++) {
                            var labelToShow = array[j];
                            this._drawOccurrence(labelToShow, filter, div);
                            total++;
                        }
                        if (total == this.maxNumberCategories && (array[j] || orderOcurrenciesAux[i - 1])) {
                            var introduceShow = true;
                        }
                    }
                }
                //Mode Big Size
                else {
                    var keysWordsFilter = this.wordsFilter.get(filter.name.toLowerCase()).keys();
                    for (var i = 0; i < keysWordsFilter.size(); i++) {
                        this._drawOccurrence(keysWordsFilter[i], filter, div);
                        total++;
                        if (total == this.maxNumberCategories && (keysWordsFilter[i + 1])) {
                            var introduceShow = true;
                            break;
                        }
                    }
                }
                if (!Object.isEmpty(introduceShow) && introduceShow) {
                    this._introduceShowMoreCategory(div, filter, index);
                }
            } //End if !filter.type
            else if (filter.type == "translatedDate") {
                //If the filter is a Date
                if (this.filterApplied.get(filter.name)) {
                    //If there is already a filter applied in this column
                    var applied = $H();
                    for (var k = 0; k < this.filterApplied.get(filter.name).length; k++) {
                        applied.set(this.filterApplied.get(filter.name)[k].text, k)
                    }
                }
                //Today element
                var elementToday = new Element('input', { 'type': 'checkbox', 'class': 'test_checkBox', id: this._table.identify() + filter.name + this.today });
                elementToday.observe('click', this.pushCheckBox.bind(this, filter, this.today, elementToday));
                var divAux = new Element('div');
                divAux.insert(elementToday);
                divAux.insert(this.today)
                div.insert(divAux);
                if (applied && !Object.isEmpty(applied.get(this.today))) {
                    elementToday.checked = true;
                    this.filterApplied.get(filter.name)[applied.get(this.today)].element = elementToday;
                    applied.unset(this.today);
                }
                //2 Days ago
                var idTwo = filter.future ? this.twoDaysLater : this.twoDaysAgo;
                var element2DaysAgo = new Element('input', { 'type': 'checkbox', 'class': 'test_checkBox', id: this._table.identify() + filter.name + idTwo });
                element2DaysAgo.observe('click', this.pushCheckBox.bind(this, filter, idTwo, element2DaysAgo));
                var divAux = new Element('div');
                divAux.insert(element2DaysAgo);
                divAux.insert(idTwo)
                div.insert(divAux);
                if (applied && !Object.isEmpty(applied.get(idTwo))) {
                    element2DaysAgo.checked = true;
                    this.filterApplied.get(filter.name)[applied.get(idTwo)].element = element2DaysAgo;
                    applied.unset(idTwo);
                }
                //Last Week
                var idWeek = filter.future ? this.nextWeek : this.lastWeek;
                var elementLastWeek = new Element('input', { 'type': 'checkbox', 'class': 'test_checkBox', id: this._table.identify() + filter.name + idWeek });
                elementLastWeek.observe('click', this.pushCheckBox.bind(this, filter, idWeek, elementLastWeek));
                var divAux = new Element('div');
                divAux.insert(elementLastWeek);
                divAux.insert(idWeek);
                div.insert(divAux);
                if (applied && !Object.isEmpty(applied.get(idWeek))) {
                    elementLastWeek.checked = true;
                    this.filterApplied.get(filter.name)[applied.get(idWeek)].element = elementLastWeek;
                    applied.unset(idWeek);
                }
                //Last month
                var idMonth = filter.future ? this.nextMonth : this.lastMonth;
                var elementLastMonth = new Element('input', { 'type': 'checkbox', 'class': 'test_checkBox', id: this._table.identify() + filter.name + idMonth });
                elementLastMonth.observe('click', this.pushCheckBox.bind(this, filter, idMonth, elementLastMonth));
                var divAux = new Element('div');
                divAux.insert(elementLastMonth);
                divAux.insert(idMonth)
                div.insert(divAux);
                if (applied && !Object.isEmpty(applied.get(idMonth))) {
                    elementLastMonth.checked = true;
                    this.filterApplied.get(filter.name)[applied.get(idMonth)].element = elementLastMonth;
                    applied.unset(idMonth);
                }
                //Last 6 months
                var id6Month = filter.future ? this.next6Months : this.last6Months;
                var elementLast6Month = new Element('input', { 'type': 'checkbox', 'class': 'test_checkBox', id: this._table.identify() + filter.name + id6Month });
                elementLast6Month.observe('click', this.pushCheckBox.bind(this, filter, id6Month, elementLast6Month));
                var divAux = new Element('div');
                divAux.insert(elementLast6Month);
                divAux.insert(id6Month)
                div.insert(divAux);
                if (applied && !Object.isEmpty(applied.get(id6Month))) {
                    elementLast6Month.checked = true;
                    this.filterApplied.get(filter.name)[applied.get(id6Month)].element = elementLast6Month;
                    applied.unset(id6Month);
                }
                //If is there a interval of date applied, we recover it
                if (applied && applied.keys().length > 0) {
                    var keys = applied.keys();
                    for (var l = 0; l < keys.length; l++) {
                        var elementIntervalDate = new Element('input', { 'type': 'checkbox', 'class': 'test_checkBox', id: this._table.identify() + filter.name + keys[l] });
                        elementIntervalDate.observe('click', this.pushCheckBox.bind(this, filter, keys[l], elementIntervalDate));
                        var divAux = new Element('div');
                        divAux.insert(elementIntervalDate);
                        divAux.insert(keys[l])
                        div.insert(divAux);
                        elementIntervalDate.checked = true;
                        this.filterApplied.get(filter.name)[applied.get(keys[l])].element = elementIntervalDate;
                    }
                }
                this._introduceShowMoreCategory(div, filter, index);
            }
        }
    },

    /**
    *@description Function to insert the button "Show More" in a filter
    *@param div element div to insert the categories of the filter
    *@filter structure Information of the filter.
    *@index Index of the corresponding column of the filter
    */
    _introduceShowMoreCategory: function (div, filter, index) {
        var divAux = new Element('div', {
            'id': this._table.identify() + '_' + filter.name + "showMoreCategories_div"
        });
        var json = {
            elements: [],
            defaultButtonClassName: 'classOfMainDiv'
        };
        var showMoreCategories = {
            label: this.showMoreLabel,
            idButton: this._table.identify() + filter.name + "showMoreCategories_button",
            className: 'application_action_link',
            handlerContext: "",
            handler: this._showAutocompleter.bind(this, filter, div, this._table.identify() + filter.name + "showMoreCategories_button", index),
            type: 'link',
            toolTip: this.showMoreLabel
        };
        json.elements.push(showMoreCategories);
        var showMoreCategoriesButtons = new megaButtonDisplayer(json);
        var but = showMoreCategoriesButtons.getButtons();
        this.arrayDivFilters[index].showButton = but;
        div.insert(but);

    },

    /**
    * @description: function to draw the new categories and the autocompleter to make the search in the values
    * @param {id} Id of the filter column
    * @param {div} Div container of the filter column
    * @param {buttonId} Id of the pushed button
    */
    _showAutocompleter: function (filter, div, buttonId, index) {

        //Hide "Show more button
        $(buttonId).hide();
        var ocurrenciesFilterAux = this.ocurrenciesFilter.get(filter.name);
        var yetShown = 0;
        var total = 0;
        //Create the new div to insert the categories and the autocompleter
        var divMoreCategories = $(this._table.identify() + '_' + filter.name + "moreCategories_div")
        if (!divMoreCategories) {
            divMoreCategories = new Element('div', { 'id': this._table.identify() + '_' + filter.name + "moreCategories_div" });
            div.insert(divMoreCategories);
        }
        if (!filter.type) {
            //Create the structure of data to autocompleter
            var json = { autocompleter: { object: [], multilanguage: { no_results: this.noResultsLabel, search: this.searchLabel}} }
            if (!this._modeBigSize) {
                for (var i = ocurrenciesFilterAux.length - 1; i >= 0; i--) {
                    var array = ocurrenciesFilterAux[i];
                    for (j = 0; j < array.length; j++) {
                        if (yetShown < this.maxNumberCategories)
                            yetShown++;
                        else {
                            //Introduce the value in the autocompleter
                            if (!(yetShown < this.maxNumberCategories * 2)) {
                                var object = { "data": array[j], "text": array[j] };
                                json.autocompleter.object.push(object);
                            }
                            else
                                yetShown++;
                            if (total < this.maxNumberCategories) {
                                //Introduce the new category
                                this._drawOccurrence(array[j], filter, divMoreCategories);
                                total++;
                            }
                        }
                    }
                }
            }
            else {
                var keysWordsFilter = this.wordsFilter.get(filter.name.toLowerCase()).keys();
                for (var i = 0; i < keysWordsFilter.size(); i++) {
                    var key = keysWordsFilter[i];
                    if (yetShown < this.maxNumberCategories)
                        yetShown++;
                    else {
                        //Introduce the value in the autocompleter
                        if (!(yetShown < this.maxNumberCategories * 2)) {
                            var object = { "data": key, "text": key };
                            json.autocompleter.object.push(object);
                        }
                        else
                            yetShown++;
                        if (total < this.maxNumberCategories) {
                            //Introduce the new category
                            this._drawOccurrence(key, filter, divMoreCategories);
                            total++;
                        }
                    }
                }
            }
            if (!this.autocompleterArray[index]) { //If there are values to include in autocompleter
                if (window["JSONAutocompleter"]) {
                    var autocompleterDiv = new Element('div', { 'id': this._table.identify() + '_' + filter.name + "autocompleter_div" });
                    div.insert(autocompleterDiv);
                    this.autocompleterArray[index] = new JSONAutocompleter(autocompleterDiv, {
                        events: $H({ onGetNewXml: 'EWS:autocompleterGetNewXml',
                            onResultSelected: 'EWS:autocompleterResultSelected'
                        }),
                        showEverythingOnButtonClick: true,
                        //timeout: 5000,
                        templateResult: '#{text}',
                        maxShown: 5,
                        minChars: 1
                    }, json);
                    document.observe('EWS:autocompleterResultSelected', this._addCheck.bindAsEventListener(this, filter, div, index));
                    if (json.autocompleter.object.length == 0)
                        autocompleterDiv.hide();
                }
                //                else {
                //                    //alert("TableKitV2 Module: The file autocompleter.js is missing. Please add to lazy loading");
                //                }
            }
            else {
                var autoCompleter = $(this._table.identify() + '_' + filter.name + "autocompleter_div");
                if (autoCompleter && json.autocompleter.object.length != 0) {
                    autoCompleter.show();
                }
                else if (this.autocompleterArray[index])
                    this.autocompleterArray[index].show();
            }
        }
        else {
            if (filter.type == "translatedDate") {
                if (!$(this._table.identify() + '_' + filter.name + "datePickers_div")) {
                    if (window["DatePicker"]) {
                        var containerDatePickers = new Element('div', { 'id': this._table.identify() + '_' + filter.name + "datePickers_div", 'class': 'tableKitV2_datePickers' });
                        var fromContainer = new Element("div", {
                            style: "float:left;"
                        });
                        var span = new Element('span', { 'class': 'tableKitV2_labels_datePickers' });
                        span.update(this.from);
                        fromContainer.insert(span);
                        var toContainer = new Element("div", {
                            style: "float:left;"
                        });
                        var span = new Element('span', { 'class': 'tableKitV2_labels_datePickers' });
                        span.update(this.to);
                        toContainer.insert(span);
                        var objCalendarExampleFrom = new DatePicker(fromContainer, {
                            manualDateInsertion: true,
                            defaultTime: 20101018,
                            correctDate: "EWS:tableKit_correctInterval",
                            emptyDateValid: false
                        });
                        var eventsArray = $H();
                        eventsArray.set('correctDate', "EWS:tableKit_correctInterval");
                        var objCalendarExampleTo = new DatePicker(toContainer, {
                            manualDateInsertion: true,
                            events: eventsArray,
                            emptyDateValid: false
                        });
                        this.hashDatePicker.set(filter.name, { from: objCalendarExampleFrom, to: objCalendarExampleTo });
                        objCalendarExampleFrom.linkCalendar(objCalendarExampleTo);
                        document.observe("EWS:tableKit_correctInterval", this._addCheck.bindAsEventListener(this, filter, div, index).bind(this, filter));
                        containerDatePickers.insert(fromContainer);
                        containerDatePickers.insert(toContainer);
                        div.insert(containerDatePickers);
                    }
                    //                    else {
                    //                        alert("TableKitV2 Module: The file datePicker.js is missing. Please add to lazy loading");
                    //                    }
                }
                else
                    $(this._table.identify() + '_' + filter.name + "datePickers_div").show();
            }
        }
        this._introduceShowLessCategory(div, filter);
    },

    /**
    * @description: Insert the date interval in the structure Filter Applied
    * @param filter Structure with all the information of the filter
    */
    _filterByIntervalDates: function (filter, event) {

        var dateFrom = this.hashDatePicker.get(filter.name).from;
        var dateTo = this.hashDatePicker.get(filter.name).to;

        this._updateStatus("Filtered");
        for (var i = 0; i < this._columnHeader.length; i++) {
            if (this._columnHeader[i].id.toLowerCase() == filter.name.toLowerCase()) {
                var indexFilter = i;
                break;
            }
        }
        if (Object.isEmpty(indexFilter))
            alert("TableKit Module: Error in Filtering, the filter doesn't match with the column of the table. Contact with EuHReka Framework Team");
        else {
            var filterToStore = { filter: filter.name,
                text: dateFrom.lastDayInput.toString() + dateFrom.lastMonthInput.toString() + dateFrom.lastYearInput.toString() + "_" + dateTo.lastDayInput.toString() + dateTo.lastMonthInput.toString() + dateTo.lastYearInput.toString(),
                element: "",
                index: indexFilter,
                type: this._findTypeDataSort(indexFilter),
                dateFrom: dateFrom,
                dateTo: dateTo
            };
            if (this.filterApplied.get(filter.name)) {
                this.filterApplied.get(filter.name).push(filterToStore);
            }
            else {
                var arrayCategoriesSelect = $A();
                arrayCategoriesSelect.push(filterToStore);
                this.filterApplied.set(filter.name, arrayCategoriesSelect);
            }
            this._orderEngine();
        }

    },

    /**
    * @description: function to add the checkbox with the option to the corresponding filter div
    * @param filter Structure of the filter with all the information
    * @param Div container of the filter column
    * @param Index of the column corresponding with the filter
    */
    _addCheck: function (event, filter, div, index) {
        if (this.autocompleterArray && this.autocompleterArray[index] && this.autocompleterArray[index]._selectedData) {
            var elementParent = this.arrayDivFilters[index].showButton;
            var textToAdd = this.autocompleterArray[index]._selectedData.textAdded;
            var divAux = new Element('div');
            var element = new Element('input', { 'type': 'checkbox', 'class': 'test_checkBox', 'id': 'extraCategory' });
            element.observe('click', this.pushCheckBox.bind(this, filter, textToAdd, element));
            divAux.insert(element);
            divAux.insert(textToAdd);
            Element.insert(elementParent, { before: divAux });
            this.autocompleterArray[index]._selectedData = null;
            this._deleteElementFromAutocompleter(this.autocompleterArray[index], textToAdd)
            this.autocompleterArray[index].clearInput();
            element.checked = true; element.defaultChecked = true;
            this.pushCheckBox(filter, textToAdd, element)
        }
        else {
            //Translated Dates
            if (this.hashDatePicker.get(filter.name)) {
                var elementParent = this.arrayDivFilters[index].showButton;
                var from = this.hashDatePicker.get(filter.name).from;
                //If the field is empty, go out of the function
                if (Object.isEmpty(from.actualDate) || from.getDateAsArray().month == "null")
                    return;
                var to = this.hashDatePicker.get(filter.name).to;
                //Generate the text for the interval
                var textToAdd = from.labelMonthsNames[from.getDateAsArray().month - 1] + "/" + from.getDateAsArray().day + "/" + from.getDateAsArray().year + " " + this.to + " " + to.labelMonthsNames[to.getDateAsArray().month - 1] + "/" + to.getDateAsArray().day + "/" + to.getDateAsArray().year;
                var filterTranslated = this.filterApplied.get(filter.name)
                for (var i = 0; filterTranslated && i < filterTranslated.length; i++) {
                    if (filterTranslated[i].text == textToAdd)
                        return
                }
                var divAux = new Element('div');
                var element = new Element('input', { 'type': 'checkbox', 'class': 'test_checkBox', 'id': 'extraCategory' });
                element.observe('click', this.pushCheckBox.bind(this, filter, textToAdd, element));
                divAux.insert(element);
                divAux.insert(textToAdd);
                Element.insert(elementParent, { before: divAux });
                element.checked = true; element.defaultChecked = true;
                element.defaultChecked = true;
                from.clearFields();
                if (from.acutalDate) {
                    from.actualDate.clearTime();
                }
                to.clearFields();
                to.actualDate.clearTime();
                this.pushCheckBox(filter, textToAdd, element)
            }
        }
        if (divAux && $(element.id))
            Form.Element.focus(element);
    },

    /**
    * @description: function called when a check box is pushed. Insert the pushed filter in the structure filter applied
    * @param {id} Id of the filter column
    * @param {div} Div container of the filter column
    * @param {index} Index of the filter in the arrayFilterDiv
    */
    pushCheckBox: function (filter, text, element) {
        this.eventLauncher("filterRequested", filter.name);
        if (element.checked) {
            this._updateStatus("Filtered");
            for (var i = 0; i < this._columnHeader.length; i++) {
                if (this._columnHeader[i].id.toLowerCase() == filter.name.toLowerCase()) {
                    var indexFilter = i;
                    break;
                }
            }
            if (Object.isEmpty(indexFilter))
                alert("TableKit Module: Error in Filtering, the filter doesn't match with the column of the table. Contact with EuHReka Framework Team");
            else {
                if (!filter.type) //It's not translated dates.
                    var filterToStore = { filter: filter.name, text: text, element: element, index: indexFilter };
                else {
                    switch (text) {
                        case this.today: //Today
                            var filterToStore = { filter: filter.name,
                                text: text,
                                element: element,
                                index: indexFilter,
                                type: this._findTypeDataSort(indexFilter),
                                dateFrom: Date.today(),
                                dateTo: Date.today().addDays(0),
                                future: false
                            };
                            break;
                        case this.yestarday: //Yesterday
                            var filterToStore = { filter: filter.name,
                                text: text,
                                element: element,
                                index: indexFilter,
                                type: this._findTypeDataSort(indexFilter),
                                dateFrom: Date.today().addDays(-1),
                                dateTo: Date.today().addDays(0),
                                future: false
                            };
                            break;
                        case this.twoDaysAgo: //2 days ago
                            var filterToStore = { filter: filter.name,
                                text: text,
                                element: element,
                                index: indexFilter,
                                type: this._findTypeDataSort(indexFilter),
                                dateFrom: Date.today().addDays(-2),
                                dateTo: Date.today().addDays(0),
                                future: false
                            };
                            break;
                        case this.lastWeek: //Last Week
                            var filterToStore = { filter: filter.name,
                                text: text,
                                element: element,
                                index: indexFilter,
                                type: this._findTypeDataSort(indexFilter),
                                dateFrom: Date.today().addDays(-7),
                                dateTo: Date.today().addDays(0),
                                future: false
                            };
                            break;
                        case this.lastMonth: //Last Month
                            var filterToStore = { filter: filter.name,
                                text: text,
                                element: element,
                                index: indexFilter,
                                type: this._findTypeDataSort(indexFilter),
                                dateFrom: Date.today().addDays(-31),
                                dateTo: Date.today().addDays(0),
                                future: false
                            };
                            break;
                        case this.last6Months: //Last Month
                            var filterToStore = { filter: filter.name,
                                text: text,
                                element: element,
                                index: indexFilter,
                                type: this._findTypeDataSort(indexFilter),
                                dateFrom: Date.today().addMonths(-6),
                                dateTo: Date.today().addDays(0),
                                future: false
                            };
                            break;
                        case this.twoDaysLater: //Today
                            var filterToStore = { filter: filter.name,
                                text: text,
                                element: element,
                                index: indexFilter,
                                type: this._findTypeDataSort(indexFilter),
                                dateFrom: Date.today().addDays(+2),
                                dateTo: Date.today().addDays(0),
                                future: true
                            };
                            break;
                        case this.nextWeek: //Yesterday
                            var filterToStore = { filter: filter.name,
                                text: text,
                                element: element,
                                index: indexFilter,
                                type: this._findTypeDataSort(indexFilter),
                                dateFrom: Date.today().addDays(+7),
                                dateTo: Date.today().addDays(0),
                                future: true
                            };
                            break;
                        case this.nextMonth: //2 days ago
                            var filterToStore = { filter: filter.name,
                                text: text,
                                element: element,
                                index: indexFilter,
                                type: this._findTypeDataSort(indexFilter),
                                dateFrom: Date.today().addDays(+31),
                                dateTo: Date.today().addDays(0),
                                future: true
                            };
                            break;
                        case this.next6Months: //Last Month
                            var filterToStore = { filter: filter.name,
                                text: text,
                                element: element,
                                index: indexFilter,
                                type: this._findTypeDataSort(indexFilter),
                                dateFrom: Date.today().addMonths(6),
                                dateTo: Date.today().addDays(0),
                                future: true
                            };
                            break;
                        default: //Interval
                            var filterToStore = { filter: filter.name,
                                text: text,
                                element: element,
                                index: indexFilter,
                                type: this._findTypeDataSort(indexFilter),
                                dateFrom: new Date(this.hashDatePicker.get(filter.name).from.actualDate),
                                dateTo: new Date(this.hashDatePicker.get(filter.name).to.actualDate)
                            };
                            break;
                    }

                }
                if (this.filterApplied.get(filter.name)) {
                    this.filterApplied.get(filter.name).push(filterToStore);
                }
                else {
                    var arrayCategoriesSelect = $A();
                    arrayCategoriesSelect.push(filterToStore);
                    this.filterApplied.set(filter.name, arrayCategoriesSelect);
                }
                this._orderEngine();
            }
        }
        else {
            //Filter to remove
            var arrayCategoriesSelect = this.filterApplied.get(filter.name);
            if (Object.isEmpty(arrayCategoriesSelect))
                alert("TableKit Module: Error in Filtering, the filter doesn't match with the column of the table. Contact with EuHReka Framework Team");
            else {
                for (var i = 0; i < arrayCategoriesSelect.length; i++) {
                    if (arrayCategoriesSelect[i].element == element) {
                        delete arrayCategoriesSelect[i]
                        arrayCategoriesSelect = arrayCategoriesSelect.compact();
                        break;
                    }
                }
                if (arrayCategoriesSelect.length > 0)
                    this.filterApplied.set(filter.name, arrayCategoriesSelect);
                else
                    this.filterApplied.unset(filter.name);
                //Due to the checkbox is added from autocompleter, we have to delete it is ummark
                if (element.id == "extraCategory") {
                    element.up().remove();
                    if (!filter.type) {
                        for (var i = 0; i < this.filters.length; i++) {
                            if (this.filters[i].name == filter.name) {
                                var autocompleterIndex = i;
                                break;
                            }
                        }
                        if (!Object.isEmpty(autocompleterIndex)) {
                            var elementHash = $H();
                            elementHash.set("data", text);
                            elementHash.set("text", text);
                            this.autocompleterArray[autocompleterIndex].options.array.push(elementHash);
                        }
                        //                        else
                        //                            alert("TableKit Module: Error in Filtering, the autocompleter filter can't be updated. Contact with EuHReka Framework Team");
                    }
                }
                this._orderEngine();
            }
        }
        this.eventLauncher("filter", filter.name);
    },

    /**
    * @description: function to decide if the row has to be shown after write a text in input search
    * @param Row element 
    */
    _hasToBeShown: function (row) {
        var arrayFilter = this.filterApplied.keys();
        for (var j = 0; j < arrayFilter.length; j++) {
            var index = this.filterApplied.get(arrayFilter[j])[0].index;
            var include = false;
            var individualFilter = this.filterApplied.get(arrayFilter[j]);
            var typeOfDate = this.filterApplied.get(arrayFilter[j])[0].type;
            for (var i = 0; i < individualFilter.length; i++) {
                if (!individualFilter[i].type) {
                    //Column different from a date type
                    if (row.element.contentColumn.get(index).toLowerCase() == (individualFilter[i].text.toLowerCase())) {
                        include = true;
                    }
                }
                else {
                    //If the column is a date
                    if (typeOfDate && typeOfDate.name.toLowerCase().include("date")) {
                        var auxIterator = typeOfDate.normal(row.element.contentColumn.get(index));
                        var auxComparatorFrom = individualFilter[i].dateFrom;
                        var auxComparatorTo = individualFilter[i].dateTo;
                        if (individualFilter[i].future) {
                            if (auxIterator >= auxComparatorTo && auxIterator <= auxComparatorFrom)
                                include = true;
                        }
                        else {
                            if (auxIterator <= auxComparatorTo && auxIterator >= auxComparatorFrom)
                                include = true;
                        }
                    }
//                    else
//                        alert("TableKit Module: Error in Filtering, the date couldn't be translated. Contact with EuHReka Framework Team");
                }
            }
            if (!include)
                return false;
        }
        return true;
    },

    /**
    * @description: function called when an option of autocompleter is selected, so the options is delete of the list of autocompleter
    * @param Text of the item
    */
    _deleteElementFromAutocompleter: function (autocompleter, text) {
        var array = autocompleter.options.array;
        for (var i = 0; i < array.length; i++) {
            if (unescape(array[i]._object.text) == text) {
                array.splice(i, 1)
                break;
            }
        }
    },

    /**
    * @description: function to introduce the button "show less", after push "show more"
    * @param {div} Div container of the filter column
    * @param {filter} Name of the filter
    */
    _introduceShowLessCategory: function (div, filter) {
        var divAux = new Element('div', {
            'id': this._table.identify() + '_' + filter.name + "showLessCategories_div"
        });
        var json = {
            elements: [],
            defaultButtonClassName: 'classOfMainDiv'
        };
        var showHideCategories = {
            label: this.showLessLabel,
            idButton: this._table.identify() + filter.name + "showHideCategories_button",
            className: 'application_action_link tableKitV2_bottomFilterDiv', // tableKitV2_bottomFilterDiv',
            handlerContext: "",
            handler: this._hideAutocompleter.bind(this, div, this._table.identify() + filter.name + "showHideCategories_button", filter),
            type: 'link',
            toolTip: this.showLessLabel
        };
        json.elements.push(showHideCategories);
        var hideMoreCategoriesButtons = new megaButtonDisplayer(json);
        div.insert(hideMoreCategoriesButtons.getButtons());
    },

    /**
    * @description: function to hide one autocompleter or datepicker
    * @param {div} Div container of the filter column
    * @param {nameButton} name of the button pushed ("Hide options")
    * @param {filter} Name of the filter
    */
    _hideAutocompleter: function (div, nameButton, filter) {
        var buttonLess = $(nameButton);
        var elements = buttonLess.up().siblings();

        if (!(filter.type)) {
            elements[elements.length - 2].update("");
            var divAutocompleter = $(this._table.identify() + '_' + filter.name + "autocompleter_div");
            if (divAutocompleter) {
                divAutocompleter.hide();
            }
        }
        else //The filter is a date type
            $(this._table.identify() + '_' + filter.name + "datePickers_div").hide();
        buttonLess.up().remove();
        $(this._table.identify() + filter.name + "showMoreCategories_button").show();

    },

    /**
    * @description: function to show the secondary filters when the button "More options" is pushed
    */
    _showSecondaryFilter: function () {
        this.showSecondariesFilter = true;
        //Reinitialize filters page
        var totalShow = 0;
        for (var i = 0; i < this.filters.length; i++) {
            if (totalShow < this.filterPerPage) {
                this.arrayDivFilters[i].div.show();
                this.filters[i].shown = true;
                totalShow++;
            }
            else {
                this.pageRight.show();
                this.arrayDivFilters[i].div.hide();
                this.filters[i].shown = false;
            }
        }
        this.pageLeft.hide();
        this.buttonLessOptionsDiv.show();
        this.buttonMoreOptionsDiv.hide();
        this._updateReports();
    },

    /**
    * @description: function to show the secondary filters when the button "More options" is pushed
    */
    _hideSecondaryFilter: function () {
        var totalShow = 0;
        for (var i = 0; i < this.filters.length; i++) {
            if (totalShow < this.filterPerPage && this.filters[i].main) {
                $(this.arrayDivFilters[i].div.id).show();
                this.filters[i].shown = true;
                totalShow++;
            }
            else {
                if (totalShow >= this.filterPerPage)
                    this.pageRight.show();
                $(this.arrayDivFilters[i].div.id).hide();
                this.filters[i].shown = false;
            }
        }
        this.pageLeft.hide();
        this.showSecondariesFilter = false;
        this.buttonMoreOptionsDiv.show();
        this.buttonLessOptionsDiv.hide();
        this._updateReports();

    },

    /**
    *@param {width} int width of the divs of filters column
    *@description Create the div container of the filters column, with the calculated categories
    */
    _calculateCategoriesPerFilter: function (width) {
        //Reinitialize the filter, before draw the filter
        for (var i = 0; (i < this.arrayDivFilters.length) && this.arrayDivFilters; i++) {
            if (this.arrayDivFilters[i].div.parentNode)
                this.arrayDivFilters[i].div.remove();
            this.arrayDivFilters[i].div.update("");
        }
        this.autocompleterArray = $A();
        this.arrayDivFilters = $A();
        //------------------------------------------------
        for (var i = 0; i < this.filters.length; i++) {
            var div = new Element('div', { "id": this._table.identify() + this.filters[i].name.toLowerCase(),
                "class": "tableKitV2_filters_column"
            });        //Introduce the title of the column
            div.setStyle("width: " + width + "%")
            var divTitle = new Element('div', { "class": "tableKitV2_filter_title" });
            divTitle.update(Object.isEmpty(this.filters[i].label) ? this.filters[i].name : this.filters[i].label);
            div.insert(divTitle);
            this.arrayDivFilters.push({ 'div': div, 'showButton': null });
            this._insertCategories(div, this.filters[i], i);

        }
    },
    /**
    *@description Method to unselected of checked the filters.
    **/
    _clerFiltersSelected: function () {
        this.filterApplied = $H();
        this._orderEngine();
    },
    /************************************** End Filter Methods ************************************************/
    /**********************************************************************************************************/
    /************************************** Methods to export *************************************************/
    /**
    *@description Method to hand the failure method when export the table
    **/
    _exportationFailure: function () {
    },
    /**
    *@description Method to hand the success method when export the table
    **/
    _exportationSuccess: function (type, inf) {
        var id = inf.EWS.o_spoolid;
        var xmlOut = '<EWS>'
                   + '<SERVICE>TABLEKIT_EXPORT</SERVICE>'
                   + '<OBJ TYPE="P">' + global.objectId + '</OBJ>'
                   + '<NOCNTX>X</NOCNTX>'
                   + '<PARAM>'
                    + '<OUT_TYPE>' + type + '</OUT_TYPE>'
                    + '<SPOOLID> ' + id + '</SPOOLID>'
                   + '</PARAM>'
                   + '<DEL/>'
                   + '</EWS>'
        var url = __hostName;
        while (('url' in url.toQueryParams())) { url = url.toQueryParams().url; }
        url = (Object.isEmpty(Object.values(((url).toQueryParams()))[0])) ? url + '?xml_in=' : url + '&xml_in=';
        window.location = url + xmlOut
        //window.open(url + xmlOut,'', 'width=300,height=300,resizable=yes,scrollbars=yes,toolbar=no,location=no')
    },
    /**
    *@description Method to convert the content of the table into a xml
    **/
    _transformToXML: function (type) {
        var xml = "";
        var xmlHead = this._transformHeaderToXml();
        var xmlBody = this._transformBodyToXml();
        xml = "<EWS>"
                 + "<SERVICE>TABLEKIT_CONV</SERVICE>"
                 + "<OBJ TYPE='P'>" + global.objectId + "</OBJ>"
                 + "<NOCNTX>X</NOCNTX>"
                 + "<PARAM>"
                    + "<I_ALIGN>" + this.alingExport + "</I_ALIGN>"
                    + "<OUT_TYPE>" + type + "</OUT_TYPE>"
                    + "<RESULT>"
                        + "<HEADER>"
                            + xmlHead
                        + "</HEADER>"
                        + "<VALUES>"
                            + xmlBody
                        + "</VALUES>"
                    + "</RESULT>"
                 + "</PARAM>"
                 + "<DEL/>"
                 + "</EWS>"
        return xml;
    },
    /**
    *@description Method to convert the content of the header into a xml
    **/
    _transformHeaderToXml: function () {
        var header = ""
        for (var i = 0; i < this._columnHeader.size(); i++) {
            var text = this._columnHeader[i].textContent ? this._columnHeader[i].textContent : this._columnHeader[i].innerText;
            text = Object.isEmpty(text) ? "" : text;
            var sequence = i + 1000 + 1;
            sequence = sequence.toString().substring(1, 4);
            header = header
                      + '<YGLUI_STR_TABLEKIT_CONV_HLINE COLSEQNR="'
                      + sequence
                      + '" COLNAME="'
                      + text.escapeHTML()
                      + '" O_ALIGN ="' + "RIGHT"
                      + '" MAX_LENGTH="' + this._maxCharactersLength[i] + '" COLTYPE="CHAR"/>'
        }
        return header;
    },
    /**
    *@description Method to convert the content of the body into a xml
    **/
    _transformBodyToXml: function () {
        var body = ""
        for (var i = 0; i < this._tableKitRows.size(); i++) {
            var bodyRow = "";
            for (var j = 0; j < this._columnHeader.size(); j++) {
                var sequence = j + 1000 + 1;
                sequence = sequence.toString().substring(1, 4);
                var formatValue = this.formatValueToExport(this._tableKitRows[i].contentColumn.get(j.toString())).escapeHTML().gsub('"', '');
                if (formatValue.endsWith("...")) {
                    formatValue = this.searchTitle(formatValue, i, j);
                }
                bodyRow = bodyRow +
                        '<YGLUI_STR_TABLEKIT_CONV_CLINE COLSEQNR="'
                        + sequence
                        + '" VALUE="'
                        + this.formatValueToExport(formatValue).escapeHTML().gsub('"', '')//this.formatValueToExport(this._tableKitRows[i].contentColumn.get(j.toString())).escapeHTML().gsub('"', '')
                        + '"/>'
            }
            var body = body
                     + "<YGLUI_STR_TABLEKIT_CONV_COL>"
                        + "<COLUMNS>"
                            + bodyRow
                        + "</COLUMNS>"
                     + "</YGLUI_STR_TABLEKIT_CONV_COL>"
        }
        return body;

    },
    /**
    *@description Method called when we have a truncated value in the table and we want to export the table.
    *@param formatValue truncated value
    **/
    searchTitle: function (formatValue, row, column) {
        var stop = true;
        if (this._tableKitRows[row].element.childElements()[column]) {
            var element = this._tableKitRows[row].element.childElements()[column];
            stop = false;
        }
        while (stop != true) {
            if (Object.isEmpty(element.title)) {
                if (element.childElements().length > 0) {
                    elementArray = element.childElements();
                    for (var i = 0; i < elementArray.length; i++) {
                        if ((elementArray[i].innerText == formatValue) || (elementArray[i].textContent == formatValue)) {
                            element = elementArray[i];
                        }
                    }
                } else {
                    stop = true;
                }
            } else {
                stop = true;
                formatValue = element.title;
            }
        }
        return formatValue;
    },
    /**
    *@description Method to call the service to export the table to pdf
    **/
    _exportToFile: function (type) {
        //var xmlPreferences = this._transformToXML("PDF").gsub("&","");
        var xmlPreferences = this._transformToXML(type);
        if (global.makeAJAXrequest) {
            global.makeAJAXrequest($H({
                xml: xmlPreferences,
                failureMethod: this._exportationFailure.bind(this),
                successMethod: this._exportationSuccess.bind(this, type),
                errorMethod: this._exportationFailure.bind(this)
            }));
        }
        else {
            alert("It is required to be connected to EuHReka system.")
        }
    },
    /**
    *@description Method to call the service to export the table to the clipboard
    **/
    _exportToClipBoard: function () {
        var textToCopy = this.toString().unescapeHTML();
        textToCopy = textToCopy.gsub("&nbsp;", " ");
        if (window.clipboardData)
            window.clipboardData.setData("Text", textToCopy);
        else if (window.netscape) {
            try {
                netscape.security.PrivilegeManager.enablePrivilege('UniversalXPConnect')
                var clip = Components.classes['@mozilla.org/widget/clipboard;1'].createInstance(Components.interfaces.nsIClipboard);
                if (!clip) return;
                var trans = Components.classes['@mozilla.org/widget/transferable;1'].createInstance(Components.interfaces.nsITransferable);
                if (!trans) return;
                trans.addDataFlavor('text/unicode');
                var str = new Object();
                var len = new Object();
                var str = Components.classes["@mozilla.org/supports-string;1"].createInstance(Components.interfaces.nsISupportsString);
                var copytext = textToCopy;
                str.data = copytext;
                trans.setTransferData("text/unicode", str, copytext.length * 2);
                var clipid = Components.interfaces.nsIClipboard;
                if (!clip) return false;
                clip.setData(trans, null, clipid.kGlobalClipboard);
            }
            catch (e) {
                alert("Your browser does not allow copying to the clipboard.\nTo enable:\n\t1. Open a new tab and type in the address bar 'about: config'. \n\t2. Look for the option: signed.applets.codebase_principal_support. \n\t3. Set its value to true. \n\t4. Push button 'Copy' again and to allow the script execution.");
            }
        }
    },
    /**
    *@description Method to convert the content of the table into a string
    **/
    toString: function () {
        var aux = "";
        for (var j = 0; j < this._columnHeader.length; j++)
            aux = aux + this._columnHeader[j].innerHTML + '\t'
        aux = aux.substr(0, aux.length - 1)
        aux = aux + '\n';
        for (var i = 0; i < this._tableKitRows.length; i++) {
            var objectRow = this._tableKitRows[i];
            if (!objectRow.hide) {
                var keysContentColumn = objectRow.contentColumn.keys();
                for (var j = 0; j < keysContentColumn.length; j++) {
                    aux = aux + objectRow.contentColumn.get(keysContentColumn[j]);
                    aux = aux + '\t';
                }
                aux = aux + '\n';
            }
        }
        return aux;
    },
    /******************************************* Painter ******************************************************/
    /**********************************************************************************************************/

    /**
    *@description Method to draw the columns header.
    **/
    _drawHeader: function () {
        if (global.liteVersion) {
            this.buttonsHeaderLiteVersion = $A();
        }
        for (var i = 0; i < this._columnHeader.length; i++) {

            if (global.liteVersion) {
                //insert button for liteVersion
                var json = {
                    elements: [],
                    defaultButtonClassName: 'classOfMainDiv'
                };
                var sortColumn = {
                    label: "-",
                    idButton: this._table.identify() + '_headerButton_' + this._columnHeader[i].id + "Index:" + i.toString(),
                    className: 'tableKitV2_divButtonHeaderLiteVersion',
                    handlerContext: "",
                    handler: "",
                    type: 'button',
                    toolTips: this._columnHeader[i].id
                };
                //We make sure that the button doesn't already exists    
                if ($(this._table.identify() + '_headerButton_' + this._columnHeader[i].id + "Index:" + i.toString()))
                    $(this._table.identify() + '_headerButton_' + this._columnHeader[i].id + "Index:" + i.toString()).up().remove();
                json.elements.push(sortColumn);
                var buttonSortHeader = new megaButtonDisplayer(json);
                var finalButton = buttonSortHeader.getButtons()
                finalButton.addClassName("tableKitV2_divButtonHeaderLiteVersion");
                this._columnHeader[i].insert(finalButton);
                this.buttonsHeaderLiteVersion.push(buttonSortHeader);
                this._columnHeader[i].addClassName(this.columnClass);
            }
            else {
                this._columnHeader[i].addClassName(this.columnClass);
            }
        }
    },

    /**
    *@description Method to draw filter div
    **/
    _showFilterOptions: function () {
        this.filterDiv.toggle();
        //If we close filters options, we update the report of applied filters not shown.
        if (this.filterDiv.style.display == "none") {
            if (this.filterApplied.keys().length > 0) {
                this.reportFilterNumber.update(this.filterApplied.keys().length);
                this.divReportFilter.show();
            }
        } else
            this._updateReports();
    },

    /**
    *@description Method to draw a page in the table
    *@param page Page to draw
    **/
    draw: function (page) {

        if (this._drawnPage != -1)
            this._unPainted(false);
        if (((this._drawnPage != page) && page > -1 && page < this._totalPages && this.pagination) || !this.pagination && page > -1 && page < this._totalPages) {
            var elementsPage = this._hashPages.get(page);
            if (elementsPage) {
                for (var i = 0; i < elementsPage.length; i++) {
                    if (this.stripes) {
                        if (i % 2 == 0) {
                            elementsPage[i].element.addClassName(this.rowEvenClass);
                            elementsPage[i].element.removeClassName(this.rowOddClass);
                        }
                        else {
                            elementsPage[i].element.addClassName(this.rowOddClass);
                            elementsPage[i].element.removeClassName(this.rowEvenClass);
                        }
                    }
                    if (this.underlineSearch && this._status.include("Searched")) {
                        if (elementsPage[i].underline) {
                            var columns = elementsPage[i].element.childElements();
                            for (var j = 0; j < columns.length; j++) {
                                columns[j].removeClassName('tableKitV2_underline');
                            }
                            for (var j = 0; j < elementsPage[i].underlineIndex.length; j++) {
                                columns[elementsPage[i].underlineIndex[j]].addClassName('tableKitV2_underline');
                            }

                        }
                        else {
                            this._deleteUnderline(elementsPage[i]);
                        }
                    }
                    elementsPage[i].element.show();
                }
                for (var i = 0; i < elementsPage.length - 1; i++) {
                    var hasRadioButton = this.hasRadioButton(elementsPage[i].element);
                    if (elementsPage[elementsPage.length - 1].element.parentNode)
                        Element.insert(elementsPage[elementsPage.length - 1].element, { before: elementsPage[i].element });
                    if (hasRadioButton)
                        this.updateRadioButtonStatus(elementsPage[i].element);
                }
            }
        }
        this.updateNumberOfPage(page);
    },
    /**
    *@param {element} element Row 
    *@description Recovery the status of radiobutton after insert operation (Fails just in IE)
    */
    updateRadioButtonStatus: function (element) {
        var radio = element.down("input[type=radio]");
        radio.checked = true;
    },
    /**
    *@param {element} element row
    *@description check if it exists a radiobutton in the row and it is checked
    */
    hasRadioButton: function (element) {
        if (Prototype.Browser.IE) {
            var text = element.innerHTML;
            if (text.toUpperCase().include("INPUT") && text.toUpperCase().include("RADIO") && text.toUpperCase().include("TYPE") && text.toUpperCase().include("CHECKED")) {
                return true;
            }
        }
        return false;
    },

    /**
    *@param {page} int Number of the page painted
    *@description it updates the number of the label that indicates the current page
    */
    updateNumberOfPage: function (page) {
        if (!Object.isEmpty(this.backEndPagination))
            page = this.backEndPaginationCurrentPage;
        if (this._totalPages > 0)
            this._drawnPage = page;
        else
            this._drawnPage = -1;
        if (page == 0 && this._totalPages == 1) { //&& Object.isEmpty(this.backEndPagination)) {
            this.tFoot.hide();
        }
        else {
            if (this._totalPages > 0) {
                if (!this.previous) {
                    this.previous = $(this._table.identify() + 'tableKit_prev_but');
                    this.next = $(this._table.identify() + 'tableKit_next_but');
                    this.last = $(this._table.identify() + 'tableKit_last_but');
                    this.first = $(this._table.identify() + 'tableKit_first_but');
                }
                this.noResults.hide();
                var totalPages = Object.isEmpty(this.backEndPagination) ? this._hashPages.keys().length : this.backEndPagination.numberPages;
                this.numbers.update((page + 1) + '&nbsp; of ' + totalPages + ' ');
                if (page == 0) {
                    //Disabling left buttons
                    this.previous.addClassName('tableKit_buttons_disabled');
                    this.previous.hide();
                    this.first.addClassName('tableKit_buttons_disabled');
                    this.first.hide();
                    this.next.removeClassName('tableKit_buttons_disabled');
                    this.next.show();
                    this.last.removeClassName('tableKit_buttons_disabled');
                    this.last.show();
                } else {
                    if (page == this._hashPages.keys().length - 1 || page + 1 == totalPages) {
                        //Disabling rigth buttons
                        this.next.addClassName('tableKit_buttons_disabled');
                        this.next.hide();
                        this.last.addClassName('tableKit_buttons_disabled');
                        this.last.hide();
                        this.previous.removeClassName('tableKit_buttons_disabled');
                        this.previous.show();
                        this.first.removeClassName('tableKit_buttons_disabled');
                        this.first.show();
                    }
                    else {
                        this.previous.removeClassName('tableKit_buttons_disabled');
                        this.previous.show();
                        this.next.removeClassName('tableKit_buttons_disabled');
                        this.next.show();
                        this.last.removeClassName('tableKit_buttons_disabled');
                        this.last.show();
                        this.first.removeClassName('tableKit_buttons_disabled');
                        this.first.show();
                    }
                }
                this.contain.show();
                this.tFoot.show();
            }
            else {
                this.contain.hide();
                this.tFoot.show();
                this.noResults.show();
            }
        }
        if (this.iconPaginationBackend)
            this.iconPaginationBackend.hide();
    },
    /**
    * @description: function to draw the checkbox "Select/Unselect all" over the table
    */
    _drawAllCheckBox: function () {
        var checkBoxDivAux = $(this._table.identify() + "_selectAllCheckBoxDiv");
        if (!Object.isEmpty(checkBoxDivAux))
            checkBoxDivAux.remove();

        this.checkBoxDiv = new Element('div', { 'id': this._table.identify() + "_selectAllCheckBoxDiv", 'class': 'tableKit_selectAllCheckBox' });
        this.checkBoxSelectAll = new Element('input', { 'id': this._table.identify() + "_selectAllCheckBox", "type": "checkbox" });
        var labelSelectAll = new Element('label', { 'for': this._table.identify() + "_selectAllCheckBoxDiv" })
        labelSelectAll.insert(this.selectAllLabel);
        this.checkBoxDiv.insert(this.checkBoxSelectAll);
        this.checkBoxDiv.insert(labelSelectAll);
        this.checkBoxSelectAll.observe("click", this.selectAllCheckBoxes.bind(this));
        if (this.tableInDiv)
            Element.insert(this._table.up(), { before: this.checkBoxDiv });
        else
            Element.insert(this._table, { before: this.checkBoxDiv });
    },

    /**
    * @description: function to draw the box "search" above the table
    */
    drawSearchBox: function () {
        //create element
        var search = $(this._table.identify() + '_searchBox');
        if (search) {
            search.remove();
        }
        var divSearch = new Element('div');
        var complexSearch = new Element('input', {
            'id': this._table.identify() + '_searchBox',
            'type': 'text',
            'class': 'tableKitV2_input_search test_input',
            'value': this.searchLabel
        });
        var filterButton = $(this._table.identify() + '_searchBox_FilterButtonDiv');
        //If the buttons exists, we remove it.
        if (filterButton)
            filterButton.remove()
        var complexSearchDiv = new Element('div', {
            'id': this._table.identify() + '_searchBox_FilterButtonDiv',
            'class': 'tableKitV2_SearchBoxFilterOptionsDiv'
        });
        if (this.marginSearchLeft != 0)
            complexSearchDiv.setStyle("margin-left:" + this.marginSearchLeft + "px");
        divSearch.insert(complexSearch)
        complexSearchDiv.insert(divSearch);
        //If the search is not interactive, we add the button to invoke the search
        if (this.quickSearch) {
            this.divSearchButton = new Element('div', { 'class': 'tableKitV2_icon_searching_loading', 'id': 'searchButtonDiv' });
            this.buttonSearch = new Element('button', { 'class': 'tableKitV2_search_button_disable', 'id': 'searchButton' });
            this.buttonSearch.observe('click', this.searchButtonClick.bind(this));
            this.divSearchButton.insert(this.buttonSearch);
            divSearch.insert(this.divSearchButton);
        }
        //If the user wants, it is included the icon loading when a seach is performed
        if (this.iconLoading) {
            this.divIcon = new Element('div', { 'class': 'tableKitV2_icon_searching_loading', 'id': 'divIcon' });
            this.divIcon.insert(global.getLabel("loading.."));
            divSearch.insert(this.divIcon);
            this.divIcon.hide();
        }
        //If the table is inserted in a div, we insert complexSearchDiv before the div parent
        this.insertInOptionDiv(complexSearchDiv, "searchBox");

        this._table.addClassName('FWK_EmptyDiv');
        //events
        complexSearch.observe('keyup', this.searchKeyUp.bindAsEventListener(this, complexSearch));
        //Function to write "Search" in search box when it is empty
        complexSearch.observe('blur', function () {
            if (complexSearch.value == '') {
                complexSearch.value = this.searchLabel;
                //If there isn't any search, we disable the button
                if (this.quickSearch) {
                    this.buttonSearch.removeClassName("tableKitV2_search_button_enable");
                    this.buttonSearch.addClassName("tableKitV2_search_button_disable");
                    searchEmpty = true;
                    this.searchButtonClick();
                    //this.buttonSearch.disabled = true;
                }
            }
        } .bindAsEventListener(this));
        complexSearch.observe('focus', this.fieldFocus.bindAsEventListener(this));
        if (global && global.liteVersion)
            complexSearch.title = this.searchLabel
    },

    /**
    *@description function to update the number of ocurrences in each category of the filter
    */
    _updateReports: function () {
        if (this.filterApplied.keys().length > 0) {
            var arrayFilter = this.filterApplied.keys();
            var notShown = 0;
            for (var i = 0; i < arrayFilter.length; i++) {
                var filterApp = this.filterApplied.get(arrayFilter[i]);
                for (var j = 0; j < this.filters.length; j++) {
                    if (this.filters[j].name == filterApp[0].filter) {
                        if (!this.filters[j].shown)
                            notShown++;
                    }
                }
                var filter = this.filters[filterApp[0].index];
            }
            if (notShown > 0) {
                this.reportFilterNumber.update(notShown);
                this.divReportFilter.show();
            }
            else
                this.divReportFilter.hide();
        }
        else
            this.divReportFilter.hide();
    },

    /**
    *@description function to draw the filter div
    *@param reload False = create True = recreate
    */
    _drawFilter: function (reload) {
        //Create the div to include the filters
        var filter = $(this._table.identify() + '_FilterDiv');
        //If the filter is already created, it is removed
        if (filter)
            filter.remove();
        this.filterDiv = new Element('div', {
            'id': this._table.identify() + '_FilterDiv',
            'class': 'tableKitV2_filters_div'
        });
        if (this.tableInDiv)
            Element.insert(this._table.up(), { before: this.filterDiv });
        else
            Element.insert(this._table, { before: this.filterDiv });

        if (!reload)
            this.filterDiv.toggle();

        //Create the button "Filter Options"
        this._drawFilterOptionsButton();

        //Create the three div of the filter div parent
        //the content of the filters
        this.contentFilterDiv = new Element('div', {
            'id': this._table.identify() + '_ContentFilterDiv',
            'class': 'tableKitV2_filters_div_content'
        });

        this.mainFilters = 0;
        this.secondaryFilters = 0;
        //It calculated the number of secondary and primary filter (pagination)
        for (var i = 0; i < this.filters.length; i++) {
            this.filters[i].shown = false;
            if (this.filters[i].main)
                this.mainFilters++;
            else
                this.secondaryFilters++;
        }
        //Create the button so that go "previous filter" and "next filter"
        this._drawPaginationButtons();

        //Create the bottom div
        this.bottomFilterDiv = new Element('div', {
            'id': this._table.identify() + '_bottomFilterDiv',
            'class': 'tableKitV2_bottomFilterDiv'
        });
        this.filterDiv.insert(this.bottomFilterDiv);
        //Introduce the button more options, if is there secondaty filters
        if (this.secondaryFilters)
            this._drawMoreOptionsButton();
        //Introduce the button clear filte
        if (this.clearFilterButton)
            this._drawClearFilterButton();
        var width = (100 / this.filterPerPage) - 1;

        //Calculate the categories of each filter
        this._calculateCategoriesPerFilter(width);

        //Draw the filter (all of Main) if there are more than filterPerPage will be introduced hidden.
        var totalFilterShown = 0;
        for (var i = 0; i < this.filters.length; i++) {
            this.contentFilterDiv.insert(this.arrayDivFilters[i].div);
            if (this.filters[i].main) {
                if (totalFilterShown < this.filterPerPage) {
                    this.arrayDivFilters[i].div.show();
                    totalFilterShown++;
                    this.filters[i].shown = true;
                }
                else {
                    this.pageRight.show();
                    this.arrayDivFilters[i].div.hide();
                }
            }
            else
                this.arrayDivFilters[i].div.hide();
        }
        if (this.showSecondariesFilter) {
            this._showSecondaryFilter()
        }
    },
    /**
    *@description function to draw the clear button
    */
    _drawClearFilterButton: function () {
        //Create the div for button "Clear Filter"    
        this.buttonClearFilterDiv = new Element('div', {
            'id': this._table.identify() + '_clearFilterDiv',
            'class': 'tableKitV2_clearFilterReport'
        });
        //Create the button
        var json = {
            elements: [],
            defaultButtonClassName: 'classOfMainDiv'
        };
        var buttonClearFilter = {
            label: this.clearFilter,
            idButton: this._table.identify() + '_clearFilterButton',
            className: 'application_action_link',
            handlerContext: "",
            handler: this._clerFiltersSelected.bind(this),
            type: 'link',
            toolTip: this.clearFilter
        };
        json.elements.push(buttonClearFilter);
        var buttonClearFilterButton = new megaButtonDisplayer(json);
        this.buttonClearFilterDiv.insert(buttonClearFilterButton.getButtons());
        if (this.bottomFilterDiv)
            this.bottomFilterDiv.insert(this.buttonClearFilterDiv);
    },
    /**
    *@description Function to draw the button filter option (to show filter div)
    */
    _drawFilterOptionsButton: function () {
        if (!this.divReportFilter) {
            var filterButton = $(this._table.identify() + '_moreFilterOption');
            if (filterButton)
                filterButton.remove();
            var json = {
                elements: [],
                defaultButtonClassName: 'classOfMainDiv'
            };
            var moreFilterOptions = {
                label: this.filterOption,
                idButton: this._table.identify() + '_moreFilterOption',
                className: 'application_action_link tableKitV2_filterOptionButtonDiv',
                handlerContext: "",
                handler: this._showFilterOptions.bind(this),
                type: 'link',
                toolTips: this.filterOption
            };
            json.elements.push(moreFilterOptions);
            var buttonMoreFilterOptions = new megaButtonDisplayer(json);
            this.divReportFilter = new Element('div', { 'id': this._table.identify() + "report_filterApplied" });
            this.reportFilterNumber = new Element("span");
            this.reportFilterNumber.setStyle("margin-right:5px");
            var label = new Element("span");
            this.reportFilterNumber.update("");
            label.update(this.reportFilterLabel);
            this.divReportFilter.addClassName('tableKitV2_filterReport')
            this.divReportFilter.insert(this.reportFilterNumber);
            this.divReportFilter.insert(label);
            this.insertInOptionDiv(buttonMoreFilterOptions.getButtons(), "filterButton");
            this.insertInOptionDiv(this.divReportFilter, "filterAppliedReport");
            this.divReportFilter.hide();
        }

    },

    /**
    *@description Function to draw the pagination of filter div
    */
    _drawPaginationButtons: function () {
        var height = 4 * this.maxNumberCategories;
        //the left button for pagination
        var divPaginationLeftFilter = new Element('div', {
            'id': this._table.identify() + 'Filter_div_left_pagination',
            'class': 'tableKitV2_filter_div_left_pagination'
        });
        divPaginationLeftFilter.setStyle("margin-top: " + height.toString() + "px");
        var json = {
            elements: [],
            defaultButtonClassName: 'classOfMainDiv'
        };
        if (global && global.liteVersion) {
            var leftPaginationFilter = {
                label: "< ",
                idButton: this._table.identify() + '_leftPaginationFilter',
                className: 'tableKitV2_filter_left_paginationLite',
                handlerContext: "tableKitV2_filter_left_pagination",
                handler: this._showPreviousFilter.bind(this),
                type: 'button',
                toolTip: "Previous Filter"

            };
        }
        else {
            var leftPaginationFilter = {
                label: "",
                idButton: this._table.identify() + '_leftPaginationFilter',
                className: 'tableKitV2_filter_left_pagination application_verticalL_arrow',
                handlerContext: "tableKitV2_filter_left_pagination ",
                handler: this._showPreviousFilter.bind(this),
                type: 'button'
            };

        }
        json.elements.push(leftPaginationFilter);
        var buttonLeftPaginationFilter = new megaButtonDisplayer(json);
        this.pageLeft = buttonLeftPaginationFilter.getButtons();
        divPaginationLeftFilter.insert(this.pageLeft);
        this.filterDiv.insert(divPaginationLeftFilter);
        this.filterDiv.insert(this.contentFilterDiv);
        this.pageLeft.hide();

        //the left button for pagination

        var divPaginationRightFilter = new Element('div', {
            'id': this._table.identify() + 'Filter_div_right_pagination',
            'class': 'tableKitV2_filter_div_right_pagination'
        });

        divPaginationRightFilter.setStyle("margin-top: " + height.toString() + "px");
        //Create the button so that go "next filter"
        var json = {
            elements: [],
            defaultButtonClassName: 'classOfMainDiv'
        };
        if (global && global.liteVersion) {
            var rightPaginationFilter = {
                label: ">",
                idButton: this._table.identify() + '_rightPaginationFilter',
                className: 'tableKitV2_filter_right_paginationLite',
                handlerContext: "tableKitV2_filter_right_pagination",
                handler: this._showNextFilter.bind(this),
                type: 'button',
                toolTip: 'Next Filter'
            };
        }
        else {
            var rightPaginationFilter = {
                label: "",
                idButton: this._table.identify() + '_rightPaginationFilter',
                className: 'tableKitV2_filter_right_pagination application_verticalR_arrow',
                handlerContext: "tableKitV2_filter_right_pagination",
                handler: this._showNextFilter.bind(this),
                type: 'button'
            };
        }
        json.elements.push(rightPaginationFilter);
        var buttonRightPaginationFilter = new megaButtonDisplayer(json);
        this.pageRight = buttonRightPaginationFilter.getButtons();
        divPaginationRightFilter.insert(this.pageRight);
        this.filterDiv.insert(divPaginationRightFilter);
        this.pageRight.hide();

    },

    /**
    *@description Function to draw the button More Options Button (Show Secondary button)
    */
    _drawMoreOptionsButton: function () {


        //Create the div for button "More Options"    
        this.buttonMoreOptionsDiv = new Element('div', {
            'id': this._table.identify() + '_moreOptionsFilterDiv',
            'class': 'tableKitV2_moreOptions_button'
        });
        var reportMoreOptionsDiv = new Element('div', {
            'id': this._table.identify() + '_reportMoreOptionsFilterDiv',
            'class': 'tableKitV2_moreOptions_report'
        });
        //Create the button
        var json = {
            elements: [],
            defaultButtonClassName: 'classOfMainDiv'
        };
        var showSecondaryFilter = {
            label: this.moreOptions,
            idButton: this._table.identify() + '_moreFilterButton',
            className: 'application_action_link',
            handlerContext: "",
            handler: this._showSecondaryFilter.bind(this),
            type: 'link',
            toolTip: this.moreOptions
        };
        json.elements.push(showSecondaryFilter);
        var showSecondaryFilterButton = new megaButtonDisplayer(json);
        this.buttonMoreOptionsDiv.insert(showSecondaryFilterButton.getButtons());
        this.bottomFilterDiv.insert(reportMoreOptionsDiv);
        this.bottomFilterDiv.insert(this.buttonMoreOptionsDiv);
        this.filterDiv.insert(this.bottomFilterDiv);

        // And create less options
        //Create the div for button "Less Options"    
        this.buttonLessOptionsDiv = new Element('div', {
            'id': this._table.identify() + '_lessOptionsFilterDiv',
            'class': 'tableKitV2_moreOptions_button'
        });

        //Create the button
        var json = {
            elements: [],
            defaultButtonClassName: 'classOfMainDiv'
        };
        var hideSecondaryFilter = {
            label: this.lessOptions,
            idButton: this._table.identify() + '_lessFilterButton',
            className: 'application_action_link',
            handlerContext: "",
            handler: this._hideSecondaryFilter.bind(this),
            type: 'link',
            toolTip: this.lessOptions
        };
        json.elements.push(hideSecondaryFilter);
        var lessSecondaryFilterButton = new megaButtonDisplayer(json);
        this.buttonLessOptionsDiv.insert(lessSecondaryFilterButton.getButtons());
        this.bottomFilterDiv.insert(this.buttonLessOptionsDiv);
        this.buttonLessOptionsDiv.hide();

    },
    /**
    *@description function to  hide the current page shown
    */
    _unPainted: function (reinialize) {
        if (this._drawnPage != -1) {
            if (this.pagination) {
                var elementsPageToHide = this._hashPages.get(this._drawnPage);
                if (elementsPageToHide) {
                    for (var i = 0; i < elementsPageToHide.length; i++) {
                        elementsPageToHide[i].element.hide();
                        elementsPageToHide[i].element.removeClassName(this.rowEvenClass);
                        elementsPageToHide[i].element.removeClassName(this.rowOddClass);
                    }
                    this._drawnPage = -1;
                    if (reinialize) {
                        this._drawnPage = -1;
                        this._hashPages = $H();
                    }
                }
            }
            else {
                for (var i = 0; i < this._tableKitRows.length; i++) {
                    var objectRow = this._tableKitRows[i];
                    objectRow.element.hide();
                }

            }

        }
    },
    /**
    *@description Method to draw the footer with the page manager
    **/
    drawFooter: function () {
        var elementFoot = $(this._table.identify() + 'tFoot_' + this._table.identify())
        if (elementFoot) {
            elementFoot.remove();
        }
        this.tFoot = new Element('tFoot', {
            'id': this._table.identify() + 'tFoot_' + this._table.identify()
        });
        this.infoPages.tFoot = this.tFoot;
        var colspan = this._columnHeader.length;
        var td = new Element('td', {
            'colspan': colspan
        });
        var paginationBar = new Element('tr', {
            'id': this._table.identify() + 'tableKit_pagination_bar',
            'class': this.footClass
        });
        this.contain = new Element('div', {
            'id': this._table.identify() + 'tableKit_contain_but',
            'class': 'tableKit_contain_but_css'
        });
        this.noResults = new Element('div', {
            'id': this._table.identify() + 'tableKit_noResults',
            'class': 'tableKit_contain_but_css'
        });
        this.noResults.update(this.noResultsLabel);
        this.noResults.hide();
        this.contain.setStyle({ marginLeft: this.marginL + 'px' }); //Set the margin from the left of the footer
        this.previous = new Element('button', {
            'id': this._table.identify() + 'tableKit_prev_but',
            'class': 'tableKitV2_buttons test_button '
        }).update('&lt;');
        this.infoPages.previous = this.previous;
        this.next = new Element('button', {
            'id': this._table.identify() + 'tableKit_next_but',
            'class': 'tableKitV2_buttons test_button '
        }).update('&gt;');
        this.infoPages.next = this.next;
        this.last = new Element('button', {
            'id': this._table.identify() + 'tableKit_last_but',
            'class': 'tableKitV2_buttons test_button '
        }).update('&gt;&gt;');
        this.infoPages.last = this.last;
        this.first = new Element('button', {
            'id': this._table.identify() + 'tableKit_first_but',
            'class': 'tableKitV2_buttons test_button'
        }).update('&lt;&lt;');
        this.infoPages.first = this.first;
        this.contain.insert(this.infoPages.first);
        this.contain.insert(this.infoPages.previous);
        this.infoPages.currentPage = 0;
        this.infoPages.totalPages = this._hashPages.keys().length;
        this.iconPaginationBackend = new Element('div', {
            'id': this._table.identify() + "iconPaginationBackedn",
            'class': "application_loading_icon tableKitV2IconLoadingPagination"
        });
        this.iconPaginationBackend.hide();
        this.numbers = new Element('div', {
            'id': 'tableKit_pages_' + this._table.identify(),
            'class': 'tableKitV2_pages'
        }).update(this.infoPages.currentPage + 1 + '&nbsp; of ' + this.infoPages.totalPages + ' ');
        this.infoPages.numbers = this.numbers;
        this.contain.insert(this.infoPages.numbers);
        this.contain.insert(this.infoPages.next);
        this.contain.insert(this.infoPages.last);
        this.contain.insert(this.iconPaginationBackend);
        if (this._columnHeader.length >= 2) {
            this.numberPageInput = new Element('input', {
                'id': this._table.identify() + 'tableKit_pageField',
                'class': 'tableKit_pageField_css test_input'
            });
            this.infoPages.pageField = this.numberPageInput;
            this.numberPageInput.observe('keyup', this.goSelectedPage.bindAsEventListener(this, this._table));
            this.contain.insert(this.numberPageInput);
        }
        td.insert(this.contain);
        td.insert(this.noResults);
        paginationBar.insert(td);
        this.infoPages.tFoot.insert(paginationBar);
        this._table.insert(this.infoPages.tFoot);

        this.infoPages.next.observe('click', this.goNextPage.bind(this));
        this.infoPages.last.observe('click', this.goLastPage.bind(this));
        this.infoPages.previous.observe('click', this.goPreviousPage.bind(this));
        this.infoPages.first.observe('click', this.goFirstPage.bind(this));

        if (!Object.isEmpty(this.legend)) {
            this.contain.setStyle("float: left"); //Set the margin from the left of the footer
            var trLegend = new Element('tr', {
                'id': this._table.identify() + 'tableKit_pagination_legend',
                'class': 'tableKit_pagination_bar_css'
            });
            var tdLegend = new Element('td', {
                'colspan': colspan
            });
            var myJSONObject = { legend: this.legend,
                showLabel: this.showLegend,
                hideLabel: this.hideLegend
            };
            var html = getLegend(myJSONObject);
            var divLink = html.childElements()[0];
            var divTableLegend = html.childElements()[1];
            divLink.addClassName("tableKitV2_buttonLegend");
            divTableLegend.addClassName("tableKitV2_tableLegend");
            html.addClassName("tableKitV2_tableLegend");
            td.insert(html);
            //this.infoPages.tFoot.insert(trLegend);
        }
        if (global && global.liteVersion) {
            this.next.title = global.getLabel("next");
            this.first.title = global.getLabel("first");
            this.last.title = global.getLabel("last");
            this.previous.title = global.getLabel("previous");
            if (this.numberPageInput) {
                this.numberPageInput.title = global.getLabel("Go to");
            }
        }
    },
    /**
    *@description Method to draw the export menu on the right (PDF,Excel,Clipboard,...)
    **/
    drawExportMenu: function () {
        //create element
        var exportMenu = $(this._table.identify() + '_exportMenu');
        if (exportMenu) {
            exportMenu.remove();
        }
        var exportMenu = new Element('div', {
            "id": this._table.identify() + '_exportMenu',
            "class": "tableKitV2_exportDivMenu"
        });
        var json = { elements: [], defaultButtonClassName: 'classOfMainDiv' };
        var pdfExport = {
            label: '',
            idButton: this._table.identify() + "exportToPdf_button",
            className: 'tableKitV2_iconDiv attach_PDF clickable test_icon',
            handlerContext: "",
            handler: this._exportToFile.bind(this, "pdf"),
            type: '',
            toolTip: this.exportPdf
        };
        json.elements.push(pdfExport);
        var excelExport = {
            label: '',
            idButton: this._table.identify() + "exportToPdf_button",
            className: 'tableKitV2_iconDiv attach_XLS clickable test_icon',
            handlerContext: "",
            handler: this._exportToFile.bind(this, "xls"),
            type: '',
            toolTip: this.exportExcel
        };
        json.elements.push(excelExport);
        var clipBoardExport = {
            label: '',
            idButton: this._table.identify() + "exportToClipBoard_button",
            className: 'tableKitV2_iconDiv tableKitV2_clipboardIcon clickable test_icon',
            handlerContext: "",
            handler: this._exportToClipBoard.bind(this),
            type: '',
            toolTip: this.exportClipBoard
        };
        json.elements.push(clipBoardExport);
        if (global.liteVersion) {
            pdfExport.label = "Pdf";
            excelExport.label = "Xls";
            clipBoardExport.label = "Copy";
            pdfExport.className = "";
            excelExport.className = "";
            clipBoardExport.className = "";
        }
        var exportExcelButtons = new megaButtonDisplayer(json);
        var but = exportExcelButtons.getButtons();
        exportMenu.insert(but);
        //Insertion of the module depending on the design of the table
        this.insertInOptionDiv(exportMenu, "exportMenu");
    },
    insertInOptionDiv: function (divToInsert, option) {
        if (!this.optionDiv || !$(this._table.identify() + "optionsDiv")) {
            this.optionDiv = new Element('div', { 'id': this._table.identify() + "optionsDiv", "class": "tableKitV2_optionDiv" });
            if (!this.filterDiv) {
                if (this.tableInDiv)
                    Element.insert(this._table.up(), { before: this.optionDiv });
                else
                    Element.insert(this._table, { before: this.optionDiv });
            }
            else
                Element.insert($(this.filterDiv), { before: $(this.optionDiv) });
        }
        switch (option) {
            case "searchBox":
                this.complexSearchDiv = divToInsert;
                this.optionDiv.insert(divToInsert);
                break;
            case "filterButton":
                this.filterButtonDiv = divToInsert;
                if (this.webSearch && this.complexSearchDiv)
                    Element.insert(this.complexSearchDiv, { after: divToInsert });
                else
                    this.optionDiv.insert(divToInsert);
                break;
            case "filterAppliedReport":
                this.filterAppliedReportDiv = divToInsert;
                if (this.filterButtonDiv)
                    Element.insert(this.filterButtonDiv, { after: divToInsert });
                else
                    alert("Error in painting filter report div");
                break;
            case "exportMenu":
                this.exportMenuDiv = divToInsert;
                if (this.complexSearchDiv) {
                    if (this.filterButtonDiv) {
                        if (this.filterAppliedReportDiv)
                            Element.insert(this.filterAppliedReportDiv, { after: divToInsert });
                        else
                            Element.insert(this.filterButtonDiv, { after: divToInsert });
                    }
                    else
                        Element.insert(this.complexSearchDiv, { after: divToInsert });
                }
                else
                    this.optionDiv.insert(divToInsert);
                break;
            default: alert("Option unrecognizable in option div");
        }
    },
    formatValueToExport: function (text) {
        return text.gsub("\r", "").gsub("\n", "");
    }
})