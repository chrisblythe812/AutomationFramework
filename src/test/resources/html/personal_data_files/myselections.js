
/**
* @constructor MySelections2
* @description Class to implement the My Selections menu.
* @augments Menu
*/
var MySelectionsParent = Class.create(EmployeeMenu,
{
    //General settings and variables:
    /** Tell whether to show the ID on the left menus or not */
    showId: null,
    /** Id for the actual population */
    populationId: null,
    /** true if the results show that there aren't any employee */
    noPopulation: false,
    /** Will indicate if it is disabled or not */
    disabled: false,
    /** Service to call to get population, should be overwritten in child classes*/
    getPopulationService: "MG_GET_POPU",
    /** Selection type currently use: "multi", "single" or none */
    selectionType: null,
    /** Last search we did, so we avoid unnecessary calls*/
    lastSearch: null,

    //Pagination variables
    /** The last input in the search field */
    lastInput: '',
    /** Store the number of the current page, starts with 1 */
    currentPage: 1,
    /** Store the number of employees that we have to add to the list */
    empToAdd: '',
    /** Stores the pages that we already have */
    employeeByPages: $H(),
    /** Store the last from number for the pagination */
    from: null,
    /** Stores the pagination limit */
    paginationLimit: null,

    //DOM elements
    /** Input DOM element to search */
    searchField: null,
    /** List of employees (ul) */
    employeeList: null,
    /** Hash with the rows of the employee list (key=employeeId), only for the rows for advanced search users */
    rowsEmployeeList: null,
    /** Container for the employees added using advanced search */
    advancedSearchEmployeesDiv: null,
    /** List for the employees added using advanced search */
    advancedSearchEmployeesList: null,
    /** Pagination information div */
    paginationDiv: null,
    /** Input for the pagination part */
    paginationInput: null,
    /** Div where the number of page (if there is pagination) is shown*/
    paginationInfoLabel: null,
    /** Pagination "first" button*/
    paginationFirstButton: null,
    /** Pagination "prev" button*/
    paginationPrevButton: null,
    /** Pagination "next" button*/
    paginationNextButton: null,
    /** Pagination "last" button*/
    paginationLastButton: null,
    /** Loading message */
    loadingDiv: null,
    /** Button that clears the employee list  */
    clearAdvancedSearchButton: null,
    /** Div with the No results found */
    noPopulationDiv: null,
    /** Error div to showe when there is not population */
    errorPopulationDiv: null,
    /** button to unselect all employees */
    unselectAllButton: null,

    /**
    * Constructor
    * @param {Object} $super
    * @param {Object} id
    * @param {Object} options
    */
    initialize: function ($super, id, options) {
        $super(id, options);
        this.showId = global.showId;
        this.paginationLimit = parseInt(global.paginationLimit, 10);
        //Event fired when an employee is to be added to the menu
        document.observe("EWS:addEmployee", this.addEmployee.bind(this));
    },

    /**
    * Initializes the employee names one of the employees in the population
    */
    _initializeNameElement: function ($super, employeeId, employeeName) {
        $super(employeeId);
        if (Object.isEmpty(employeeName)) {
            employeeName = this.population.get(employeeId).name;
        }

        //initialize the element
        var employeeNameContainer = new Element("div", {
            "class": "my_selections_employeeNameDiv"
        });
        employeeNameContainer.update(new Element("span", {
            "class": "application_text_bolder application_main_soft_text test_text",
            "id": "for_" + employeeId
        }).update(new Element("span", {
            "title": this.population.get(employeeId).name
        }).update(employeeName)));
        //and fill it
        this._nameElements.set(employeeId, employeeNameContainer);
    },

    /**
    * Give the proper styles to the selection elements
    */
    _initializeSelectElement: function ($super, employeeId) {
        $super(employeeId);
        //give the myselection style
        this._selectElements.get(employeeId).radio.addClassName("my_selections_selection");
        this._selectElements.get(employeeId).checkbox.addClassName("my_selections_selection");
        //Add the proper style if the id is being shown
        if (!this.showId) {
            this._selectElements.get(employeeId).radio.addClassName("my_selections_selectionClear");
            this._selectElements.get(employeeId).checkbox.addClassName("my_selections_selectionClear");
        }
    },

    /**
    * Adds an employee to the menu
    */
    addEmployee: function (args) {
        var employeeId = getArgs(args).employeeID;

        var page = this._isEmployeeInActualPopulation(employeeId);
        if (page) {
            //Employee is already in the population: create "empty" employee element
            var employeeElement = this._getEmptyEmployeeElement(employeeId, page);
        } else {
            //Employee is not in the population
            if (this._selectElements.get(employeeId)) {
                return;
            }
            this.initializeElements($A([employeeId]));
            var employeeElement = this.getEmployeeElement(employeeId);
        }
        var removeButton = new Element("button", {
            "class": "mySelections_removeEmployeeButton application_currentSelection test_button"
        });
        var showAnimation = !Prototype.Browser.IE;
        removeButton.observe("click", this._removeEmployeeAdvancedSearch.bind(this, employeeId, showAnimation, removeButton));
        employeeElement.insert(removeButton);
        this.rowsEmployeeList.set(employeeId, employeeElement);
        this.advancedSearchEmployeesList.insert(employeeElement);
        employeeElement.hide();
        if (Prototype.Browser.IE) {
            employeeElement.show();
        }
        else {
            employeeElement.appear({ duration: 0.7 });
        }

        if (global.advancedSearchResults.size() > 0) {
            this.clearAdvancedSearchButton.show();
        }
    },

    /**
    * Clears the employee selection menu and unregisters all observers
    */
    removeEmployees: function () {
        this._colorElements.each(function (colorElement) {
            colorElement.value.single.stopObserving();
            colorElement.value.multi.stopObserving();
            colorElement.value.none.stopObserving();
        } .bind(this));
        this._selectElements.each(function (selectElement) {
            selectElement.value.radio.stopObserving();
            selectElement.value.checkbox.stopObserving();
        } .bind(this));
        this._colorElements = $H();
        this._selectElements = $H();
        this._nameElements = $H();
        this.rowsEmployeeList = $H();
        this.employeeList.innerHTML = '';
    },

    /**
    * Removes an employee for the list of advanced search users
    * @param {Object} employeeId The id of the employee
    * @param {Object} showAnimation If we want to show an animation
    * @param {Object} callerButton The button that caused the action if it is the one next to the employee element
    */
    _removeEmployeeAdvancedSearch: function (employeeId, showAnimation, callerButton) {
        //Unselect the employee and select the actual user to if we are in single selection
        if (global.employeeIsSelected(employeeId)) {
            if (this.selectionType == "single") {
                var populationKeys = this.population.keys();
                for (var i = 0; i < populationKeys.size(); i++) {
                    if (this.population.get(populationKeys[i]).actual) {
                        global.setEmployeeSelected(populationKeys[i], true);
                        break;
                    }

                }
            } else if (this.selectionType == "multi") {
                global.setEmployeeSelected(employeeId, false);
                this.unselect(employeeId);
            }
        }

        //Remove observers:
        var colorElement = this._colorElements.get(employeeId);
        colorElement.single.stopObserving();
        colorElement.multi.stopObserving();
        colorElement.none.stopObserving();
        this._colorElements.unset(employeeId);
        var selectElement = this._selectElements.get(employeeId);
        selectElement.radio.stopObserving();
        selectElement.checkbox.stopObserving();
        this._selectElements.unset(employeeId);

        //Remove from global
        global.advancedSearchResults.unset(employeeId);
        this.population.unset(employeeId);
        //Hiding "Clear button" if neccessary
        if (global.advancedSearchResults.size() == 0) {
            this.clearAdvancedSearchButton.hide();
        }

        //Stop observing the click in the remove button
        if (!Object.isEmpty(callerButton)) {
            callerButton.stopObserving("click");
        }
        var employeeElement = this.rowsEmployeeList.get(employeeId);

        if (showAnimation) {
            employeeElement.fade({ duration: 0.7, from: 1, to: 0 });
            Element.remove.bind(employeeElement, employeeElement).delay(1.0);
        } else {
            employeeElement.remove();
            if (Prototype.Browser.IE) {											// In IE we have to force a redraw (Hide and show) of all the employees
                for (var i = 0; i < this.rowsEmployeeList.values().length; i++) {		// in order to make it aware of the change
                    var el = this.rowsEmployeeList.values()[i]; 					// If not, elements will overlap until the user makes the browser aware
                    if (el !== employeeElement) {
                        el.hide();
                        el.show();
                    }
                }
            }
        }

        this.rowsEmployeeList.unset(employeeId);
    },

    /**
    * Gets the advanced search ID for this menu.
    * @return {String} the advanced search id
    */
    getAdvancedSearchId: function () {
        var advSearchId = global.tabid_leftmenus.get(this.application.tabId).get(this.menuId).advancedSearchId;
        return advSearchId ? advSearchId : global.advancedSearchId;
    },

    /**
    * Returns a DIV with the proper styling containing the color element for
    * the employee
    */
    getColorElement: function (employeeId) {
        var employeeColorContainer = this._colorElements.get(employeeId)[this.selectionType];
        employeeColorContainer.addClassName("my_selections_employeeColor test_EEBubble");
        if (!this.showId) {
            employeeColorContainer.addClassName("my_selections_employeeColor_noId");
        }
        return employeeColorContainer;
    },
    /**
    * Returns a container with all the elements for a given employee
    * (selection, color, employee name, etc...)
    * @param employeeId The Id for the employee
    */
    getEmployeeElement: function (employeeId) {
        var employeeElement = new Element("li", {
            "class": "my_selections_employeeLi",
            "id": "my_selections_employee" + employeeId
        });
        //insert the selection element
        employeeElement.insert(this.getSelectionElement(employeeId));

        //Insert the employee name
        employeeElement.insert(this._nameElements.get(employeeId));

        //create and insert insert the employee id element(if global.showId)
        var employeeIdContainer = new Element("div", {
            "class": "my_selections_employeeIdDiv"
        }).update(this.showId ? pernrToDisplay(employeeId) : "");

        employeeElement.insert(employeeIdContainer);

        //Insert the color element for the employee
        employeeElement.insert(this.getColorElement(employeeId));

        return employeeElement;

    },

    /**
    * Returns the element contining the selection element.
    */
    getSelectionElement: function (employeeId) {
        var selectionElement;
        //get the element depending on the selection type
        if (this.selectionType == "single") {
            selectionElement = this._selectElements.get(employeeId).radio;
        }
        else
            if (this.selectionType == "multi") {
                selectionElement = this._selectElements.get(employeeId).checkbox;
            }
        //and enclose it whith a container
        var selectionElementContainer = new Element("div");
        if (this.showId) {
            selectionElementContainer.setStyle({
                "float": "left"
            });
        }
        selectionElementContainer.insert(selectionElement);

        if (global.employeeIsSelected(employeeId)) {
            this.select(employeeId);
        }

        return selectionElementContainer;
    },

    /**
    * keeps the menus synchronized when working on single select mode
    */
    menuSync: function ($super, event) {
        if (!this.application || !this.population) {
            return;
        }
        var args = getArgs(event);
        var employeeId = args.employeeId;
        var selected = args.selected;

        if (this.selectionType == "multi" && global.getSelectedEmployees().size() > 0) {
            if (!Object.isEmpty(this.unselectAllButtonContainer)) {
                //Only show the animation for other browsers than IE
                if (Prototype.Browser.IE) {
                    this.unselectAllButtonContainer.show();
                } else {
                    this.unselectAllButtonContainer.appear({ duration: 0.7 });
                }
            }
        } else {
            if (!Object.isEmpty(this.unselectAllButtonContainer)) {
                if (Prototype.Browser.IE) {
                    this.unselectAllButtonContainer.hide();
                } else {
                    this.unselectAllButtonContainer.fade({ duration: 0.7, from: 1, to: 0 });
                }
            }
        }

        //exit since this is a synchro event for my details
        if (this.selectionType == "none" || this.population.get(employeeId) && this.population.get(employeeId).actual) {
            return;
        }

        if (this.selectionType == "single" && selected) {
            this.select(employeeId);
        } else if (this.selectionType == "single") {
            this.unselect(employeeId);
        } else if (this.selectionType == "multi" && selected) {
            this.select(employeeId);
        } else if (this.selectionType == "multi") {
            this.unselect(employeeId);
        }
    },

    /**
    * Overriden to disallow selecting more persons than indicated on GET_USETTINGS
    */
    onClickSelect: function ($super, event, employeeId) {
        var count = 0;
        var maxSelection = global.maxSelectedEmployees;
        this.population.each(function (employee) {
            count = global.employeeIsSelected(employee.key) ? count + 1 : count;
        });

        var multiSelection = (this.selectionType == "multi");

        if (multiSelection && (count <= maxSelection && $F(event.element()) != null || $F(event.element()) == null) ||
            !multiSelection) {

            $super(event, employeeId);
        } else {
            this._infoMethod(global.getLabel('maxSelectedElements'));
            event.element().checked = false;
        }
    },

    /**
    * Draws the menu in the screen.Child menus should complete this method
    */
    show: function ($super, element, menuArgs) {
        //Writing the title
        this.changeTitle(global.getLabel("mySelections"));
        //Fix: removing content when browser is IE
        if (Prototype.Browser.IE && this._content.parentNode) {
            this._content.remove();
        }
        this._content.addClassName("my_selections_menu_content");
        this._content.update("");


        //Gets the total number of employees
        this.populationId = global.getPopulationName(global.currentApplication);
        this.selectionType = global.getSelectionType(this.application);

        //Set the population as the current application's one
        var populationName = global.getPopulationName(this.application);
        this.population = menuArgs.rolid ? menuArgs.rolId : global.populations.get(populationName);
        var populationKeys = this.population.keys();

        //don't draw the menu if no employees in the population
        if (!this.population || populationKeys.length <= 1) {
            return;
        }
        this.renderMenu();
        $super(element);
    },

    /**
    * Creates all the pagination infor needed
    */
    _createPaginationInfo: function () {
        if (Object.isEmpty(this.pagination)) {
            this.pagination = {};
        }
        if (Object.isEmpty(this.pagination.currentPage))
            this.pagination.currentPage = 1;
    },


    /**
    * Re builds the population info. Creates pages depending the size for the populatio
    * @param {Object} totalEmployees
    */
    _rebuildPopulation: function (totalEmployees) {
        if (Object.isEmpty(this.pagination)) {
            this.pagination = {};
        }
        //Getting global pagination limit
        this.pagination.paginationLimit = parseInt(global.paginationLimit, 10);
        //If we are building the info, the page we will show is the first one
        if (Object.isEmpty(this.pagination.currentPage))
            this.pagination.currentPage = 1;
        this.pagination.totalPages = 1;
        this.pagination.pages = $H();
        this.pagination.totalEmployees = totalEmployees;

        if (totalEmployees > 0) {
            this.noPopulation = false;
            this.pagination.totalPages = (this.pagination.totalEmployees / this.pagination.paginationLimit).ceil();
            for (var i = 0; i < this.pagination.totalPages; i++) {
                this.pagination.pages.set(i + 1, {
                    complete: false,
                    employees: $A()
                });
            }
        } else {
            this.noPopulation = true;
        }

        //Enable all advanced search population (it will be disabled later if needed
        if (!Object.isEmpty(global.advancedSearchResults)) {
            var advancedSearchKeys = global.advancedSearchResults.keys();
            for (var i = 0; i < advancedSearchKeys.size(); i++) {
                this._enableAdvancedSearchEmployee(advancedSearchKeys[i]);
            }
        }
    },
    /**
    * Function called when a pagination button is pressed. It will update pagination info and then call updatePagination buttons
    * @param {Object} buttonId "first", "prev", "next" or "last"
    */
    _paginationButtonPressed: function (buttonId) {
        switch (buttonId) {
            case "first":
                this.pagination.currentPage = 1;
                break;
            case "prev":
                if ((this.pagination.currentPage - 1) > 0) {
                    this.pagination.currentPage--;
                }
                break;
            case "next":
                if ((this.pagination.currentPage + 1) <= this.pagination.totalPages) {
                    this.pagination.currentPage++;
                }
                break;
            case "last":
                this.pagination.currentPage = this.pagination.totalPages;
                break;
        }
        this._updatePaginationButtons(true);
        this._drawActualPage();
    },
    /**
    * Updates pagination buttons and pagination label
    * @param {Object} fromClick If it comes from clicking a button, so we should focus
    */
    _updatePaginationButtons: function (fromClick) {
        //If we only have one page:
        if (this.pagination.totalPages == 1) {
            Form.Element.disable(this.paginationFirstButton);
            this.paginationFirstButton.addClassName("disabled");
            Form.Element.disable(this.paginationPrevButton);
            this.paginationPrevButton.addClassName("disabled");
            Form.Element.disable(this.paginationNextButton);
            this.paginationNextButton.addClassName("disabled");
            Form.Element.disable(this.paginationLastButton);
            this.paginationLastButton.addClassName("disabled");
            this.paginationDiv.hide();
        } else {
            this.paginationDiv.show();
            //If we are in the first page:
            if (this.pagination.currentPage == 1) {
                Form.Element.disable(this.paginationFirstButton);
                this.paginationFirstButton.addClassName("disabled");
                Form.Element.disable(this.paginationPrevButton);
                this.paginationPrevButton.addClassName("disabled");
                Form.Element.enable(this.paginationNextButton);
                if (fromClick)
                    Form.Element.focus(this.paginationNextButton);
                this.paginationNextButton.removeClassName("disabled");
                Form.Element.enable(this.paginationLastButton);
                this.paginationNextButton.removeClassName("disabled");
                this.paginationLastButton.removeClassName("disabled");
            } else if (this.pagination.currentPage == this.pagination.totalPages) {
                //If we are in the last page
                Form.Element.enable(this.paginationFirstButton);
                this.paginationFirstButton.removeClassName("disabled");
                Form.Element.enable(this.paginationPrevButton);
                if (fromClick)
                    Form.Element.focus(this.paginationPrevButton);
                this.paginationPrevButton.removeClassName("disabled");
                Form.Element.disable(this.paginationNextButton);
                this.paginationNextButton.addClassName("disabled");
                Form.Element.disable(this.paginationLastButton);
                this.paginationLastButton.addClassName("disabled");
            } else {
                //If we are in a middle page:
                Form.Element.enable(this.paginationFirstButton);
                this.paginationFirstButton.removeClassName("disabled");
                Form.Element.enable(this.paginationPrevButton);
                this.paginationPrevButton.removeClassName("disabled");
                Form.Element.enable(this.paginationNextButton);
                this.paginationNextButton.removeClassName("disabled");
                Form.Element.enable(this.paginationLastButton);
                this.paginationLastButton.removeClassName("disabled");
            }
        }
        //Update the info label
        var infoLabelText = this.pagination.currentPage + "&nbsp;" + global.getLabel("of") + "&nbsp;" + this.pagination.totalPages;
        this.paginationInfoLabel.update(infoLabelText);
        if (this.paginationInput.value != this.pagination.currentPage) {
            this.paginationInput.value = this.pagination.currentPage;
        }
    },

    /**
    
    
    * Draws the list of employees, and prepares the no results div.
    */
    _drawEmployeeListPart: function () {
        this.loadingDiv = new Element('div', {
            'class': 'mySelections_loadingMessage'
        }).insert(global.getLabel('loading'));
        this.loadingDiv.hide();
        this.employeeList = new Element("ul", {
            "class": "my_selections_employeeList"
        });

        //Hash to store each row of the table
        this.rowsEmployeeList = $H();
        this._content.insert(this.loadingDiv);
        this._content.insert(this.employeeList);
        this.noPopulationDiv = new Element("div", {
            "class": "MySelections_noPopulationDiv application_main_soft_text test_text"
        }).insert(global.getLabel("noResults"));
        this.noPopulationDiv.hide();
        this._content.insert(this.noPopulationDiv);

        this.errorPopulationDiv = new Element("div", {
            "class": "MySelections_noPopulationDiv application_main_soft_text test_text"
        }).insert(global.getLabel("noPopulation"));
        this.errorPopulationDiv.hide();
        this._content.insert(this.errorPopulationDiv);
    },

    /**
    * Draws the actual page if we have it, will ask for it if we don't have it
    */
    _drawActualPage: function () {
        this.employeeList.update("");
        if (this.noPopulation) {
            this.noPopulationDiv.show();
            this.employeeList.hide();
        } else {
            this.noPopulationDiv.hide();
            this.employeeList.show();
            var populationForPage = this.pagination.pages.get(this.pagination.currentPage);
            if (Object.isEmpty(populationForPage) || !populationForPage.complete) {
                //If we don't have this page, ask for it
                this._updateEmployeeList(true);
            } else {
                for (var i = 0; i < populationForPage.employees.size(); i++) {
                    var employee = populationForPage.employees[i].data;
                    //Only draw employees that are not the actual user
                    if (!employee.actual) {
                        var employeeId = populationForPage.employees[i].key;
                        this._initializeNameElement(employeeId, populationForPage.employees[i].data.name);
                        this._initializeColorElement(employeeId);
                        this._initializeSelectElement(employeeId);
                        var employeeElement = this.getEmployeeElement(employeeId);
                        //Insert the employee element in the list
                        this.employeeList.insert(employeeElement);
                        if (global.employeeIsSelected(employee.key)) {
                            this.select(employee.key);
                        }
                    }
                }
            }
        }

    },

    /**
    * Draws pagination part
    */
    _drawPaginationPart: function () {
        //Main container:   
        this.paginationDiv = new Element("div", {
            "id": "mySelections_paginationDiv",
            'class': 'mySelections_paginationDiv'
        });
        //Create buttons: first and previous:
        this.paginationFirstButton = new Element('button', {
            'class': 'mySelections_paginationButton test_button'
        }).insert('&lt;&lt;');
        this.paginationFirstButton.observe('click', this._paginationButtonPressed.bind(this, 'first'));

        this.paginationPrevButton = new Element('button', {
            'class': 'mySelections_paginationButton test_button'
        }).insert('&lt;');
        this.paginationPrevButton.observe('click', this._paginationButtonPressed.bind(this, 'prev'));

        //Create info label (ie: 1 of 4)
        this.paginationInfoLabel = new Element('span', {
            'class': 'pagination_infoLabel test_label'
        });

        //Create buttons: next and last;
        this.paginationNextButton = new Element('button', {
            'class': 'mySelections_paginationButton test_button'
        }).insert('&gt;');
        this.paginationNextButton.observe('click', this._paginationButtonPressed.bind(this, 'next'));

        this.paginationLastButton = new Element('button', {
            'class': 'mySelections_paginationButton test_button'
        }).insert('&gt;&gt;');
        this.paginationLastButton.observe('click', this._paginationButtonPressed.bind(this, 'last'));

        //Create input
        var tooltipPagination = "";
        if (global.liteVersion) {
            tooltipPagination = global.getLabel("KM_PAGE");
        }
        this.paginationInput = new Element("input", {
            "class": "mySelections_paginationInput test_input",
            "type": "text",
            "maxlength": 3,
            "title": tooltipPagination
        });
        this.paginationInput.observe('keyup', this._paginationInputKeyUp.bindAsEventListener(this));
        this.paginationInput.observe('blur', this._paginationInputKeyUp.bindAsEventListener(this));

        this.paginationDiv.insert(this.paginationFirstButton);
        this.paginationDiv.insert(this.paginationPrevButton);
        this.paginationDiv.insert(this.paginationInfoLabel);
        this.paginationDiv.insert(this.paginationNextButton);
        this.paginationDiv.insert(this.paginationLastButton);
        this.paginationDiv.insert(this.paginationInput);
        this._updatePaginationButtons(false);
        this._content.insert(this.paginationDiv);
    },

    /**
    * Draws buttons to select/unselect 
    */
    _drawUnselectPart: function () {
        //Container div, necessary because in IE7 the text before is not shown
        this.unselectAllButtonContainer = new Element("div", {
            "class": "mySelections_unselectAllContainer"
        });

        this.unselectAllButton = new Element("button", {
            "class": "mySelections_unselectAll application_action_link test_button"
        }).insert(global.getLabel("clearSelection"));

        this.unselectAllButtonContainer.insert(this.unselectAllButton);
        this._content.insert(this.unselectAllButtonContainer);

        this.unselectAllButton.observe("click", this._unselectAllButtonPressed.bind(this));

        if (this.selectionType != "multi" || global.getSelectedEmployees().size() == 0) {
            this.unselectAllButtonContainer.hide();
        }
    },
    /**
    * Called when we have pressed unselect all button 
    */
    _unselectAllButtonPressed: function () {
        var employeesToUnselect = global.getSelectedEmployees();
        //TODO: if it is the actual user, unselect from myDetails
        for (var i = 0; i < employeesToUnselect.size(); i++) {
            global.setEmployeeSelected(employeesToUnselect[i], false);
        }
    },
    /**
    * Called when the pagination input detects a keyup event or the field loses focus
    * @param {Object} event
    */
    _paginationInputKeyUp: function (event) {
        if (event.type == "blur" || event.keyCode == Event.KEY_RETURN) {
            var value = parseInt(this.paginationInput.value, 10);
            if (isNaN(value)) {
                this.paginationInput.value = this.pagination.currentPage;
            } else {
                if (value < 1) {
                    this.paginationInput.value = 1;
                    value = 1;
                }
                else if (value > this.pagination.totalPages) {
                    this.paginationInput.value = this.pagination.totalPages;
                    value = this.pagination.totalPages;
                }
                this.pagination.currentPage = value;
                this._drawActualPage();
                this._updatePaginationButtons(false);
            }
        }
    },

    /**
    * Draws the input search
    */
    _drawSearchPart: function () {
        //Add the search field;
        var searchTooltip = "";
        if (global.liteVersion) {
            searchTooltip = global.getLabel("search");
        }
        this.searchField = new Element("input", {
            "class": "mySelections_searchField test_input",
            "type": "text",
            "id": 'mySelections_searchField',
            "value": "",
            "title": ""
        });
        this.searchField.observe('keyup', this._searchFieldKeyUp.bindAsEventListener(this));
        this.searchField.observe('keypress', this._searchFieldKeyPress.bindAsEventListener(this));
        this.searchButton = new Element("button", {
            "class": "mySelections_searchButton application_action_link test_button"
        }).update(global.getLabel("search"));
        this.searchButton.observe("click", this._updateEmployeeList.bind(this, false, undefined, true, false));

        this._content.insert(this.searchField);
        this._content.insert(this.searchButton);
        var clearFixDiv = new Element('div', {
            'class': 'emptyDiv'
        }).insert('&nbsp;');
        this._content.insert(clearFixDiv);
    },
    /**
    * Draws advanced search button, and the container to insert other employees
    */
    _drawAdvancedSearchPart: function () {
        // Advance search div construction, SRC_OV is the tag for Advanced Search
        this.advancedSearchButton = new Element("button", {
            "class": "application_handCursor mySelections_advancedSearchButton"
        }).insert(new Element("span", {
            "class": "application_catalog_image mySelections_advancedSearchIcon test_icon"
        }).insert("&nbsp")).insert(new Element("span", {
            "class": "mySelections_advancedSearchText application_action_link test_link"
        }).insert(global.getLabel('SRC_OV')));
        this.advancedSearchButton.observe("click", global.open.bind(global, $H({
            app: {
                tabId: "POPUP",
                appId: "ADVS",
                view: "AdvancedSearch"
            },
            sadv_id: this.getAdvancedSearchId(),
            comeFromMenu: true,
            button: this.advancedSearchButton
        })));
        //Add clear button
        this.clearAdvancedSearchButton = new Element("button", {
            "class": "mySelections_clearAdvancedSearch application_action_link"
        }).insert(global.getLabel("clear"));
        this.clearAdvancedSearchButton.observe("click", this._clearAdvancedSearchButtonPressed.bind(this));
        if (global.advancedSearchResults.size() > 0) {
            this.clearAdvancedSearchButton.show();
        } else {
            this.clearAdvancedSearchButton.hide();
        }
        this.advancedSearchEmployeesDiv = new Element("div", {
            "class": "mySelections_advancedSearchEmployees"
        });
        this.advancedSearchEmployeesList = new Element("ul", {
            "class": "mySelections_advancedSearchEmployeesList"
        });
        this.advancedSearchEmployeesDiv.insert(this.advancedSearchEmployeesList);
        if (!Object.isEmpty(global.advancedSearchResults)) {
            var advancedSearchKeys = global.advancedSearchResults.keys();
            //this.initializeElements(advancedSearchKeys);
            for (var i = 0; i < advancedSearchKeys.size(); i++) {
                var employeeId = advancedSearchKeys[i];
                this._initializeNameElement(employeeId);
                this._initializeSelectElement(employeeId);
                var employeeElement = this.getEmployeeElement(employeeId);
                this.rowsEmployeeList.set(employeeId, employeeElement);
                this.advancedSearchEmployeesList.insert(employeeElement);
            }
        }
        this._content.insert(this.advancedSearchButton);
        this._content.insert(this.clearAdvancedSearchButton);
        this._content.insert(this.advancedSearchEmployeesDiv);
    },

    /**
    * Handler for "clear" button
    */
    _clearAdvancedSearchButtonPressed: function () {
        var advancedSearchKeys = global.advancedSearchResults.keys();
        //this.initializeElements(advancedSearchKeys);
        for (var i = 0; i < advancedSearchKeys.size(); i++) {
            var employeeId = advancedSearchKeys[i];
            this._removeEmployeeAdvancedSearch(employeeId, false, null);
        }
    },
    /**
    * Function called on the keyUp event for the search field, if it is RETURN we will search, or if the search box is empty
    * @param {Object} event
    */
    _searchFieldKeyUp: function (event) {
        var newKey = event.charCode || event.keyCode || event.which;
        //If we hit ENTER it will search or we empty the box, it will search
        if (newKey == Event.KEY_RETURN || $F(this.searchField) == "") {
            this._updateEmployeeList(false, undefined, true);
        }
    },

    /**
    * Function called on the keyDown so we ignore the "*" character
    * @param {Object} event
    */
    _searchFieldKeyPress: function (event) {
        var newKey = event.charCode || event.keyCode || event.which;
        if (newKey == 42) { //*
            Event.stop(event);
        }
    },

    /**
    * Updates the employee list, calling backend
    * @param {Object} gettingPages If this is true we won't rebuild the pagination info, we'll just get a new page and add it
    * @param {Object} refreshBuffer If this is true we will add a paramter to the service so backend knows that it must use un-buffered results
    * @param {Object} fromSearchButton True if this call has been made from the search button
    * @param {Object} refresh True if we want to add parameter to refresh the list
    */
    _updateEmployeeList: function(gettingPages, refreshBuffer, fromSearchButton, refresh, newGroup) {
        var searchString = $F(this.searchField).escapeHTML();
        var searchChanged = false;
        //Check if it is the same search as we had, and we are coming from the search button
        if (searchString != this.lastSearch) {
            this.lastSearch = searchString;
            searchChanged = true;
        }

        if (!fromSearchButton || (fromSearchButton && searchChanged)) {
            if (newGroup)
                var pageFrom = 1;
            else
            var pageFrom = this.pagination.currentPage;

            var xmlin = this._getPopulationXML(searchString, pageFrom, false, refresh);

            this._showLoadingPopulation();
            //Make the call to the service
            this.makeAJAXrequest($H({
                xml: xmlin,
                successMethod: this._getPopulationSuccess.bind(this, gettingPages),
                errorMethod: this._getPopulationFailure.bind(this),
                failureMethod: this._getPopulationFailure.bind(this)
            }));
        }
    },

    /**
    * Gets the XML ready to be sent to get the population. Should be overwritten by child classes
    * @param {Object} searchString The string we are searching, if any
    * @param {Object} pageFrom The page we want to retrieve
    * @param {Object} getAll If we want all the population, no pagination
    * @param {Object} refresh True if we want to add parameter to refresh the list
    */
    _getPopulationXML: function (searchString, pageFrom, getAll, refresh) {

    },

    /**
    * Called when we have received GET_POPULATION service response
    * @param {Object} gettingPages If true we'll just add the result in the actual page
    * @param {Object} json
    */
    _getPopulationSuccess: function (gettingPages, json) {
        this.jsonEmployees = json;
        this._hideLoadingPopulation();
        this.errorPopulationDiv.hide();
        this.paginationDiv.show();
        if (gettingPages) {
            //Add a new page
            this._fillPopulationPage(objectToArray(json.EWS.o_population.yglui_str_population.population.yglui_str_popul_obj), this.pagination.currentPage);
            //Now we have the data and we can paint it
            this._drawActualPage();
        } else {
            //Rebuild all
            var newPopulationSize = parseInt(json.EWS.o_population.yglui_str_population['@population_rec'], 10);
            this._rebuildPopulation(newPopulationSize);
            this._fillPopulationPage(objectToArray(json.EWS.o_population.yglui_str_population.population.yglui_str_popul_obj), this.pagination.currentPage);
            this._drawActualPage();
            this._updatePaginationButtons(false);
        }
        //Will call to disable in case the menu is disabled but we receive the employees afterwards
        if (this.disabled) {
            this.disable();
        } else {
            this.enable();
        }
    },

    /**
    * Fills a page to the population pages
    * @param {Object} newElements The new elements to add
    * @param {Object} pageToFill The page we want to fill
    */
    _fillPopulationPage: function (newElements, pageToFill) {
        //var isComplete = (newElements.size()>=this.pagination.paginationLimit);
        var newPage = {
            complete: true,
            employees: $A()
        };
        for (var i = 0; i < newElements.size(); i++) {
            var employeeId = newElements[i]['@objid'];
            newPage.employees.push({
                key: employeeId,
                data: newElements[i]
            });
            if (!Object.isEmpty(global.advancedSearchResults.get(employeeId))) {
                this._disableAdvancedSearchEmployee(employeeId);
            }
            if (Object.isEmpty(this.population.get(employeeId))) {
                var objectForPopulation = {
                    type: newElements[i]['@otype'],
                    name: newElements[i]['@name'],
                    singleSelected: false,
                    singleElement: null,
                    singleColor: 0,
                    multiSelected: false,
                    multiElement: null,
                    multiColor: 0,
                    actual: false,
                    picId: newElements[i]['@pic_id']
                };
                this.population.set(employeeId, objectForPopulation);
                this.initializeElements($A([employeeId]));
            }

        }
        newPage.employees = this._sortByKey(newPage.employees);
        this.pagination.pages.set(pageToFill, newPage);
    },

    /**
    * Goes to a page in the pagination
    * @param {Object} page The page to go
    */
    _openPage: function (page) {
        this.pagination.currentPage = parseInt(page, 10);
        this._drawActualPage();
        this._updatePaginationButtons(false);
    },

    /**
    * Removes the selection checkbox or radio button of an user because it is in the normal list
    * @param {Object} employeeId
    */
    _disableAdvancedSearchEmployee: function (employeeId) {
        var employeeElement = this.rowsEmployeeList.get(employeeId);
        var page = this._isEmployeeInActualPopulation(employeeId);
        if (!Object.isEmpty(employeeElement) && page) {
            var newElement = this._getEmptyEmployeeElement(employeeId, page);
            employeeElement.replace(newElement);
            this.rowsEmployeeList.set(employeeId, newElement);
        }
    },

    /**
    * Enables the selection checkbox or radio button of an user because it is no longer in the normal list
    * @param {Object} employeeId
    */
    _enableAdvancedSearchEmployee: function (employeeId) {
        var employeeElement = this.rowsEmployeeList.get(employeeId);
        if (!Object.isEmpty(employeeElement)) {
            var newElement = this.getEmployeeElement(employeeId);
            employeeElement.replace(newElement);
            this.rowsEmployeeList.set(employeeId, newElement);
        }
    },

    /**
    * Returns the page number that an employee is into or false it is not in any page 
    * @param {Object} employeeId The id for the employee we want to search
    */
    _isEmployeeInActualPopulation: function (employeeId) {
        if (Object.isEmpty(this.pagination) || Object.isEmpty(this.pagination.pages)) {
            return false;
        } else {
            var pagesKeys = this.pagination.pages.keys();
            for (var i = 0; i < pagesKeys.size(); i++) {
                if (this.pagination.pages.get(pagesKeys[i]).complete) {
                    var pagePopulation = this.pagination.pages.get(pagesKeys[i]).employees;
                    for (var j = 0; j < pagePopulation.size(); j++) {
                        if (pagePopulation[j].key == employeeId) {
                            return pagesKeys[i];
                        }
                    }
                }
            }
            return false;
        }
    },
    /**
    * Returns alist element for the employee, without the buttons 
    * @param {Object} employeeId
    * @param {Object} page
    */
    _getEmptyEmployeeElement: function (employeeId, page) {
        var employeeElement = new Element("li", {
            "class": "my_selections_employeeLi empty",
            "id": "my_selections_employee" + employeeId
        });
        //No selection element
        var emptySelectionElement = new Element("span", {
            "class": "mySelections_emptySelectionElement"
        }).insert("&nbsp;");
        employeeElement.insert(emptySelectionElement);

        //Name:    
        var employeeName = this.population.get(employeeId).name;
        //initialize the element
        var employeeNameContainer = new Element("button", {
            "class": "my_selections_employeeNameDivEmpty"
        });
        employeeNameContainer.update(new Element("span", {
            "class": "application_text_bolder application_main_soft_text test_text"
        }).update(new Element("span", {
            "title": global.getLabel("seeEmployeeInPopulation")
        }).update(employeeName)));

        employeeNameContainer.observe("click", this._openPage.bind(this, page));

        //Insert the employee name
        employeeElement.insert(employeeNameContainer);

        //create and insert insert the employee id element(if global.showId)
        var employeeIdContainer = new Element("div", {
            "class": "my_selections_employeeIdDiv"
        }).update(this.showId ? pernrToDisplay(employeeId) : "");

        employeeElement.insert(employeeIdContainer);

        //Empty color element
        var emptyColorElement = new Element("span", {
            "class": "mySelections_emptyColorElement"
        }).insert("&nbsp;");
        employeeElement.insert(emptyColorElement);

        return employeeElement;
    },
    /**
    * Sorts an array of employees by their key
    * @param {Object} array
    */
    _sortByKey: function (array) {
        var result = $A();
        var arraySize = array.size();
        for (var i = 0; i < arraySize; i++) {
            var key = parseInt(array[i].key, 10);
            var resultSize = result.size();
            var insertAfter = resultSize;
            for (var j = 0; j < resultSize; j++) {
                var otherKey = parseInt(result[j].key, 10);
                if (otherKey >= key) {
                    insertAfter = j;
                    break;
                }
            }
            result.splice(insertAfter, 0, array[i]);
        }
        return result;
    },

    /**
    * Called when GET_POPULATION service fails
    * @param {Object} json
    */
    _getPopulationFailure: function (json) {
        //Show an error message
        this._hideLoadingPopulation();
        if (Object.isEmpty(this.treeSelectedNodes) || this.treeSelectedNodes.size() == 0) {
            //If we are trying to show the default population but there isn't any, we show a "Please select a group message"
            this.errorPopulationDiv.update(global.getLabel("pleaseSelectGroup"));
        } else {
            this.errorPopulationDiv.update(global.getLabel("noPopulation"));
        }
        this.errorPopulationDiv.show();
        this._rebuildPopulation(0);
        this._drawActualPage();
        this.paginationDiv.hide();
    },

    /**
    * Hides the loading message
    */
    _showLoadingPopulation: function () {
        this.paginationDiv.hide();
        this.employeeList.hide();
        this.loadingDiv.show();

    },
    /**
    * Shows the loading message
    */
    _hideLoadingPopulation: function () {
        this.paginationDiv.show();
        this.employeeList.show();
        this.loadingDiv.hide();
    },

    /**
    * Reloads the population of MySelections (abstract, to be overwritten by child classes)
    */
    reloadPopulation: function (population) {
    },


    /**
    * Enables the menu
    */
    enable: function () {
        this.disabled = false;
        //Enable select elements
        var inputElements = this._content.select("input,button.contextLeftButtonColorSquare");
        for (var i = 0; i < inputElements.size(); i++) {
            Form.Element.enable(inputElements[i]);
        }
        //Show pagination if needed
        this._updatePaginationButtons(false);

        //Enable search related buttons
        if (!Object.isEmpty(this.searchButton)) {
            Form.Element.enable(this.searchButton);
            this.searchButton.removeClassName("application_action_link_disabled");
            this.searchButton.addClassName("application_action_link");
        }
        if (!Object.isEmpty(this.advancedSearchButton)) {
            Form.Element.enable(this.advancedSearchButton);
            this.advancedSearchButton.removeClassName("mySelections_advancedSearchButtonDisabled");
        }
        if (!Object.isEmpty(this.clearAdvancedSearchButton)) {
            Form.Element.enable(this.clearAdvancedSearchButton);
            this.clearAdvancedSearchButton.removeClassName("application_action_link_disabled");
            this.clearAdvancedSearchButton.addClassName("application_action_link");
        }
    },

    /**
    * Disables the menu
    */
    disable: function () {
        this.disabled = true;
        //Disable select elements
        var inputElements = this._content.select("input,button.contextLeftButtonColorSquare");
        for (var i = 0; i < inputElements.size(); i++) {
            Form.Element.disable(inputElements[i]);
        }
        //Hide pagination
        if (!Object.isEmpty(this.paginationDiv)) {
            this.paginationDiv.hide();
        }
        //Disable treeGroupings part
        if (!Object.isEmpty(this.treeGroupingsObject)) {
            this.treeGroupingsObject.disable();
        }
        //Disable search related buttons
        if (!Object.isEmpty(this.searchButton)) {
            Form.Element.disable(this.searchButton);
            this.searchButton.addClassName("application_action_link_disabled");
            this.searchButton.removeClassName("application_action_link");
        }
        if (!Object.isEmpty(this.advancedSearchButton)) {
            Form.Element.disable(this.advancedSearchButton);
            this.advancedSearchButton.addClassName("mySelections_advancedSearchButtonDisabled");
        }
        if (!Object.isEmpty(this.clearAdvancedSearchButton)) {
            Form.Element.disable(this.clearAdvancedSearchButton);
            this.clearAdvancedSearchButton.addClassName("application_action_link_disabled");
            this.clearAdvancedSearchButton.removeClassName("application_action_link");
        }
    },

    /**
    * Calls backend to get all employees.
    * @param {Object} handler Function that will be called with the results when they are ready.
    */
    getAllEmployees: function (handler) {
        var xmlin = this._getPopulationXML(null, null, true);
        this.makeAJAXrequest($H({
            xml: xmlin,
            successMethod: this._getAllEmployeesSuccess.bind(this, handler),
            errorMethod: this._getAllEmployeesFailure.bind(this, handler),
            failureMethod: this._getAllEmployeesFailure.bind(this, handler)
        }));
    },

    /**
    * Function called when we succeed getting all the employees
    * @param {Object} handler Function that will be called with the results when they are ready.
    * @param {Object} json Results from the service
    */
    _getAllEmployeesSuccess: function (handler, json) {
        //Should be overwritten by child classes
    },

    /**
    * Function called when we fail getting all the employees
    * @param {Object} handler Function that will be called with the results when they are ready.
    * @param {Object} json Results from the service
    */
    _getAllEmployeesFailure: function (handler, json) {
        handler.curry(null).call();
    },

    /**
    * Checks if the menu has to be updated when changing application.
    * @param {Object} appData Object with the data we could use: appId, tabId, selectionType and populationId
    */
    hasToBeUpdated: function (appData) {
        if (this.populationId == appData.populationId && this.selectionType == appData.selectionType) {
            return false;
        } else {
            return true;
        }
    },
    /**
    * Closes the menu
    * @param {Object} $super
    */
    close: function ($super) {
        this.populationId = null;
        this.selectionType = null;
        $super();
    }
});

/**
* @constructor MySelections2
* @description Class to implement the My Selections menu.
* @augments Menu
*/
var MySelections2 = Class.create(MySelectionsParent,
/**
* @lends MySelections2
*/
{
//General settings and variables:
/** TreeGroupings module object */
treeGroupingsObject: null,
/** Hash with all the tree nodes for the grouping part*/
treeAllNodes: null,
/** Hash with the last selected nodes */
treeSelectedNodes: null,
/** TreeGroupings object */
treeGroupingsObject: null,
/** Event that should be stopped after refreshing the employee list */
treeRefreshedEventListener: null,
/** Name of the groups node name in XML */
groupsNodeName: null,
/** Name of the old population drawed */
oldPopulation: null,


/**
* Constructor
* @param {Object} $super
* @param {Object} id
* @param {Object} options
*/
initialize: function ($super, id, options) {
    this.getPopulationService = "MG_GET_POPU";
    this.groupsNodeName = "YGLUI_STR_MG_IND_NODE";
    document.observe("EWS:MyGroupings_nodeClicked", this._groupingsNodeClicked.bind(this));
    $super(id, options);
},

/**
* Draws the menu in the screen
*/
show: function ($super, element, menuArgs) {
    $super(element, menuArgs);
    //We aill use the default population if no tree nodes selected
    this.usingDefaultPopulation = true;
    this.change = false;
    //We check if the population has changed in order to draw again the information
    if (Object.isEmpty(this.oldPopulation) || this.oldPopulation != this.populationId) {
        this.oldPopulation = this.populationId;
        this.change = true;
    }

    //Create pagination info
    this._createPaginationInfo();

    //Tree and groupings part:
    this._drawTreeGroupingsPart();
    //Search field and advanced search buttons
    this._drawSearchPart();
    //Draw the list where employees will be shown
    this._drawEmployeeListPart();
    //Draws unselect button
    this._drawUnselectPart();
    //Pagination part, to use if needed
    this._drawPaginationPart();
    //Advanced search button and container for advanced search selected employees
    this._drawAdvancedSearchPart();
    //Clear div for correct visualization    
    var clearFixDiv = new Element('div', {
        'class': 'emptyDiv'
    }).insert('&nbsp;');
    this._content.insert(clearFixDiv);

    //if we have the list of employees we don't call again
    if (this.change) {
        this._updateEmployeeList(false);
    }
    else {
        if (this.jsonEmployees)
            this._getPopulationSuccess(false, this.jsonEmployees)
    }
},
/**
	
* Draws the groupings and tree part of he menu
*/
_drawTreeGroupingsPart: function () {
    //if the population has changed we don't have to call again to get the tree
    if (this.change) {
        var groupJson = null;
        var treeJson = null;
    }
    else {
        var groupJson = this.treeGroupingsObject.oldGroupsJson;
        var treeJson = this.treeGroupingsObject.oldTreeJson;
    }

    //We'll add the roles for the actual population to the treeGroupings object
    var rolesArray = this.populationId.split('_');
    var appendGetTree = "<ROLIDS>";
    for (var i = 0; i < rolesArray.length; i++) {
        appendGetTree += '<yglui_str_rolid rolid="' + rolesArray[i] + '"/>';
    }
    appendGetTree += "</ROLIDS>";
    this.treeGroupingsObject = new TreeGroupings({
        getTreeService: "MG_GET_TREE",
        noAttributesLabel: global.getLabel("NoGroupSelected"),  //No group was selected
        showGroupsLabel: global.getLabel("groups"),
        getGroupingService: "MG_GET_GROUPING",
        groupItemsName: "yglui_str_mg_group_all",
        groupsSelectedButton: global.getLabel("done"),
        treeNodeClicked: "EWS:MyGroupings_nodeClicked",
        labelNoGroupsSelected: global.getLabel("NoGroupSelected"),
        appendGetTree: appendGetTree,
        groupJson: groupJson,
        treeJson: treeJson
    });
    this._content.insert(this.treeGroupingsObject.getHtml());
},
/**
* Function called when a node in the tree has been clicked
* @param {Object} args
*/
_groupingsNodeClicked: function (args) {
    //Update the global variables in order to search again for employees
    var arguments = getArgs(args);
    this.treeAllNodes = arguments.allNodes;
    this.usingDefaultPopulation = false;
    this.treeSelectedNodes = arguments.selectedNodes;
    this._updateEmployeeList(false, null, null, null, true);
},

/**
* Updates the employee list, calling backend
* @param {Object} gettingPages If this is true we won't rebuild the pagination info, we'll just get a new page and add it
* @param {Object} refreshBuffer If this is true we will add a paramter to the service so backend knows that it must use un-buffered results
* @param {Object} fromSearchButton True if this call has been made from the search button
* @param {Object} refresh True if we want to add parameter to refresh the list
*/
_updateEmployeeList: function ($super, gettingPages, refreshBuffer, fromSearchButton, refresh, newGroup) {
    if (Object.isEmpty(gettingPages)) {
        gettingPages = false;
    }
    if (Object.isEmpty(refreshBuffer)) {
        refreshBuffer = false;
    }
    if (refreshBuffer && this.treeRefreshedEventListener) {
        this.treeRefreshedEventListener.stop();
    }
    $super(gettingPages, refreshBuffer, fromSearchButton, refresh, newGroup);
},

/**
* Gets the XML ready to be sent to get the population. Should be overwritten by child classes
* @param {Object} searchString The string we are searching, if any
* @param {Object} pageFrom The page we want to retrieve
* @param {Object} getAll If we want the call to get all population, not paginated and not using search
* @param {Object} refresh True if we want to add parameter to refresh the list
*/
_getPopulationXML: function (searchString, pageFrom, getAll, refresh) {
    //If we don't want to refresh the buffer, we'll just ask for the list of employees
    var usingDefaultPopulation = "<I_DEFAULT>X</I_DEFAULT>";
    if (!this.usingDefaultPopulation) {
        usingDefaultPopulation = "<I_DEFAULT></I_DEFAULT>";
    }

    var groupInfo = "";
    if (!Object.isEmpty(this.treeSelectedNodes)) {
        var treeNodesKeys = this.treeSelectedNodes.keys();
        for (var i = 0; i < this.treeSelectedNodes.size(); i++) {
            groupInfo += "<" + this.groupsNodeName + " IND_NODE='" + this.treeSelectedNodes.get(treeNodesKeys[i])['@att_id'] + "' />";
        }
    }
    if (!getAll) {
        var xmlin = "<EWS>" +
                           "<SERVICE>" + this.getPopulationService + "</SERVICE>" +
                           "<PARAM>" +
                               "<O_FROM>" + pageFrom + "</O_FROM>" +
                               "<I_IND_NODES>" + groupInfo + "</I_IND_NODES>" +
                               "<I_PATTERN>" + searchString + "</I_PATTERN>" +
                               usingDefaultPopulation +
                           "</PARAM>" +
                           "<DEL/>" +
                       "</EWS>";
    } else {
        var xmlin = "<EWS>" +
                           "<SERVICE>" + this.getPopulationService + "</SERVICE>" +
                           "<PARAM>" +
                               "<I_IND_NODES>" + groupInfo + "</I_IND_NODES>" +
                               "<I_PATTERN></I_PATTERN>" +
							   "<I_GET_ALL>X</I_GET_ALL>" +
                           "</PARAM>" +
                           "<DEL/>" +
                       "</EWS>";
    }

    return xmlin;
},


/**
* Reloads the population of MySelections
*/
reloadPopulation: function () {
    //We´ll refresh the tree, then the emnployee list
    this.treeRefreshedEventListener = document.on("EWS:TreeGroupings_treeRefreshed", this._updateEmployeeList.bind(this, false, true));
    this.treeGroupingsObject.reloadTree();
},


/**
* Enables the menu
*/
enable: function ($super) {
    $super();
    //Enable treeGroupings part
    this.treeGroupingsObject.enable();
},

/**
* Disables the menu
*/
disable: function ($super) {
    $super();
    //Disable treeGroupings part
    if (!Object.isEmpty(this.treeGroupingsObject)) {
        this.treeGroupingsObject.disable();
    }
},

/**
* Function called when we succeed getting all the employees
* @param {Object} handler Function that will be called with the results when they are ready.
* @param {Object} json Results from the service
*/
_getAllEmployeesSuccess: function (handler, json) {
    if (json && json.EWS && json.EWS.o_population && json.EWS.o_population.yglui_str_population && json.EWS.o_population.yglui_str_population.population && json.EWS.o_population.yglui_str_population.population.yglui_str_popul_obj) {
        var population = objectToArray(json.EWS.o_population.yglui_str_population.population.yglui_str_popul_obj);
        handler.curry(population).call();
    }
},

/**
* Closes the menu
* @param {Object} $super
*/
close: function ($super) {
    $super();
}

});

/**
* Class to implement the My Selections menu without groupings
* @augments Menu
*/
var MySelectionsWithoutGroupings = Class.create(MySelectionsParent,
/**
* @lends MySelectionsWithoutGroupings
*/
{
initialize: function ($super, id, options) {
    this.getPopulationService = "GET_POPULATION";
    $super(id, options);
},

/**
* Draws the menu in the screen
*/
show: function ($super, element, menuArgs) {
    $super(element, menuArgs);

    //Create pagination info
    this._createPaginationInfo();
    //Search field and advanced search buttons
    this._drawSearchPart();
    //Draw the list where employees will be shown
    this._drawEmployeeListPart();
    //Draws unselect button
    this._drawUnselectPart();
    //Pagination part, to use if needed
    this._drawPaginationPart();
    //Advanced search button and container for advanced search selected employees
    this._drawAdvancedSearchPart();
    //Clear div for correct visualization    
    var clearFixDiv = new Element('div', {
        'class': 'emptyDiv'
    }).insert('&nbsp;');
    this._content.insert(clearFixDiv);

    this._updateEmployeeList(false);
},

/**
* Gets the XML ready to be sent to get the population. Should be overwritten by child classes
* @param {Object} searchString The string we are searching, if any
* @param {Object} pageFrom The page we want to retrieve
* @param {Object} getAll If we want the call to get all population, not paginated and not using search
* @param {Object} refresh True if we want to add parameter to refresh the list
*/
_getPopulationXML: function (searchString, pageFrom, getAll, refresh) {
    if (!Object.isEmpty(this.populationId)) {
        var rolesArray = this.populationId.split('_');
        var rolesToSend = "<ROLIDS>";
        for (var i = 0; i < rolesArray.length; i++) {
            rolesToSend += '<yglui_str_rolid rolid="' + rolesArray[i] + '"/>';
        }
        rolesToSend += "</ROLIDS>";
    } else {
        rolesToSend = "<ROLIDS></ROLIDS>"
    }
    var refreshXML = "";
    if (refresh) {
        refreshXML = "<REFRESH_MY_SELECTIONS>X</REFRESH_MY_SELECTIONS>";
    }

    if (!getAll) {
        var xmlin = "<EWS>" +
	                           "<SERVICE>" + this.getPopulationService + "</SERVICE>" +
	                           "<PARAM>" +
	                               rolesToSend +
	                               "<O_FROM>" + pageFrom + "</O_FROM>" +
	                               "<PATTERN>" + searchString + "</PATTERN>" +
								   refreshXML +
	                           "</PARAM>" +
	                           "<DEL/>" +
	                       "</EWS>";

    } else {
        var xmlin = "<EWS>" +
                               "<SERVICE>" + this.getPopulationService + "</SERVICE>" +
                               "<PARAM>" +
                                   rolesToSend +
                                   "<O_FROM></O_FROM>" +
                                   "<PATTERN></PATTERN>" +
								   "<GET_ALL>X</GET_ALL>" +
								   refreshXML +
                               "</PARAM>" +
                               "<DEL/>" +
                           "</EWS>";
    }
    return xmlin;

},

/**
* Reloads the population
*/
reloadPopulation: function () {
    this._updateEmployeeList(false, true);
},
/**
* Function called when we succeed getting all the employees
* @param {Object} handler Function that will be called with the results when they are ready.
* @param {Object} json Results from the service
*/
_getAllEmployeesSuccess: function (handler, json) {
    if (json && json.EWS && json.EWS.o_population && json.EWS.o_population.yglui_str_population && json.EWS.o_population.yglui_str_population.population_all && json.EWS.o_population.yglui_str_population.population_all.yglui_str_popul_obj) {
        var population = objectToArray(json.EWS.o_population.yglui_str_population.population_all.yglui_str_popul_obj);
        handler.curry(population).call();
    }
}
});


/**
* Creates a span to show a perNumber
* @param {Object} id
*/
function pernrToDisplay(id) {
    return new Element("span", {
        "class": "application_main_soft_text test_text"
    }).insert(global.idSeparatorLeft + id + global.idSeparatorRight);
}

/**
* Class that shows a combined selection menu with groups of trees. After selecting one or more groups, each related
*  tree will be shown. These trees have checbox in each node so we can make hierarchival selections
*/
var TreeGroupings = Class.create(origin, {

    /** Options */
    options: {},
    /** Mode in which we are displaying the module: "tree" or "groups" */
    mode: "tree",
    /** List of groups (null if we haven't already asked backend for it */
    groups: null,
    /** Hash containing all the elements from the group list */
    groupLIElements: null,
    /** Number of selected groups */
    selectedGroups: 0,
    /** Hash containing all selected nodes  */
    selectedNodes: $H(),
    /** Hash with the last received nodes */
    latestNodes: null,
    /** Will be true until we click on the done button. This way we'll ask for the default tree until we select groups */
    firstTimeGettingTree: true,
    /** Part that is being shown at the moment: tree or groups*/
    partShown: "tree",
    /** Buttons displayer object for done button in groups */
    doneButtonDisplayer: null,
    /** Buttons displayer object for groups button */
    groupsButtonDisplayer: null,

    /** DOM elements: */
    /** Container for the whole module */
    element: null,
    /** Container of the tree part */
    treePartElement: null,
    /** Container for the names of the groups shown */
    groupsNamesElement: null,
    /** Container of the tree inside the tree part */
    treeElement: null,
    /** Container of the groups part */
    groupsPartElement: null,
    /** Container for the groups inside the group part */
    groupsElement: null,
    /** Loading message */
    loadingElement: null,
    /** <ul> list of groups */
    groupListElement: null,
    /** End of DOM elements: */
    //storing the old groups json if the population has not changed
    oldGroupsJson: {},
    //storing the old tree json if the population has not changed
    oldTreeJson: {},
    /**
    * Constructor of the class
    * @param {Object} $super
    * @param {Object} options TODO: comment options
    */
    initialize: function ($super, options) {
        $super();
        this._parseOptions(options);
        document.observe("EWS:TreeGroupings_nodeClicked", this._nodeClicked.bindAsEventListener(this));
        this._createHTMLStructure();
        switch (this.mode) {
            case "tree":
                this._showTreePart();
                this._getGroupsFromBackend(false, true);
                break;
            case "groups":
                this._getGroupsFromBackend(true, true);
                break;
        }
    },
    /**
    * Gets the DOM element generated by this module
    */
    getHtml: function () {
        return this.element;
    },

    /**
    * Parses the options received as parameter and stores them in this.options
    * @param {Object} options
    */
    _parseOptions: function (options) {
        this.options = {};
        //Some default options
        this.options.groupingNodeName = "YGLUI_STR_MG_BFGROUPING";
        this.options.treeNodesName = "yglui_str_mg_bfattribute";
        this.options.nodeNameXML = "yglui_str_mg_ind_node";
        if (!Object.isEmpty(options)) {
            for (option in options) {
                if (!Object.isEmpty(options[option]))
                    this.options[option] = options[option];
            }
        }
    },

    /**
    * Creates the HTML structure for the module
    */
    _createHTMLStructure: function () {
        //Main container
        this.element = new Element("div", {
            "class": "TreeGroupings_main"
        });

        //Tree part:
        this.treePartElement = new Element("div", {
            "class": "TreeGroupings_treePart"
        }).hide();
        this.groupsNamesElement = new Element("div", {
            "class": "TreeGroupings_groupsNames application_main_soft_text test_label"
        });
        //Creating change mode button with megaButtonDisplayer module
        var buttonData = {
            elements: []
        };
        var showGroupsButton = {
            label: this.options.showGroupsLabel,
            idButton: 'showGroupsButton',
            handler: this._getGroupsFromBackend.bind(this, true, false),
            className: "application_action_link",
            type: "link"
        };
        buttonData.elements.push(showGroupsButton);
        this.groupsButtonDisplayer = new megaButtonDisplayer(buttonData);
        this.treeElement = new Element("div", {
            "class": "TreeGroupings_tree"
        });
        this.treePartElement.insert(this.groupsNamesElement);
        var buttonsContainer = this.groupsButtonDisplayer.getButtons();
        buttonsContainer.addClassName("TreeGroupings_showGroupsButton");
        this.treePartElement.insert(buttonsContainer);
        this.treePartElement.insert(this.treeElement);

        //Groups part
        this.groupsPartElement = new Element("div", {
            "class": "TreeGroupings_groupsPart"
        }).hide();
        this.groupsElement = new Element("div", {
            "class": "TreeGroupings_groups"
        });
        //Creating done button with megaButtonDisplayer module
        var buttonDataGroups = {
            elements: []
        };
        var groupsSelectedButton = {
            label: this.options.groupsSelectedButton,
            idButton: 'showGroupsButton',
            handler: this._groupsSelectedButtonPressed.bind(this),
            className: "",
            type: "button",
            standardButton: true
        };
        buttonDataGroups.elements.push(groupsSelectedButton);
        this.doneButtonDisplayer = new megaButtonDisplayer(buttonDataGroups);
        this.groupsPartElement.insert(this.groupsElement);
        var doneButtonHTML = this.doneButtonDisplayer.getButtons();
        doneButtonHTML.addClassName("TreeGroupings_doneButton");
        this.groupsPartElement.insert(doneButtonHTML);
        //Insert div for clear fix
        this.groupsPartElement.insert(new Element("div", {
            "class": "emptyDiv"
        }));

        //Loading message
        this.loadingElement = new Element("div", {
            "class": "TreeGroupings_loading"
        });
        this.loadingElement.insert(global.getLabel("loading"));

        //Insert all in the main container:
        this.element.insert(this.loadingElement);
        this.element.insert(this.treePartElement);
        this.element.insert(this.groupsPartElement);
    },

    /**
    * Function called when the "Done" button for the groups is clicked. It will call backend to get the tree for the groups 
    * @param event the click event if we come from a click, null otherwise
    */
    _groupsSelectedButtonPressed: function (event) {
        //Update order
        //For each li element we set the order:
        this.firstTimeGettingTree = false;
        var listElements = this.groupListElement.childElements();
        var selectedGroupsArray = $A();
        for (var i = 0; i < listElements.size(); i++) {
            //Removing the prefix we have the group id
            var id = listElements[i].itemId;
            this.groupLIElements.get(id).order = i;
            if (this.groupLIElements.get(id).checkbox.checked) {
                selectedGroupsArray.push(this.groupLIElements.get(id));
            }
        }
        //Call backend TODO: we could check if groups have changed to avoid unnecessary calls
        this._getTreeFromBackend(selectedGroupsArray);
    },

    /**
    * Shows the groups part of the module
    * @param {boolean} recreate If true we'll create the groups part again
    *                  (only true when we have new results from backend)
    */
    _showGroupsPart: function () {
        this._buildGroupsPart();
        this.loadingElement.hide();
        this.groupsPartElement.show();
        this.treePartElement.hide();
        this.partShown = "groups";
    },
    /**
    * Builds a XML to ask backend for the possible groups
    * @param showGroupsPart if we want to show the groups part once we have the data.
    * @param firstTime If the first time, we will ask for the default values
    */
    _getGroupsFromBackend: function (showGroupsPart, firstTime) {
        //if we have to refresh the tree
        if (Object.isEmpty(this.options.groupJson)) {
            var defaultXML = "";
            if (firstTime) {
                defaultXML = "<I_DEFAULT>X</I_DEFAULT>"
            }
            var xml = '<EWS>' +
                        '<SERVICE>' + this.options.getGroupingService + '</SERVICE>' +
                        '<PARAM>' +
                            defaultXML +
                        '</PARAM>' +
                    '</EWS>';
            //TODO: add onFailures!!
            this.loadingElement.show();
            this.groupsPartElement.hide();
            this.treePartElement.hide();
            this.partShown = "groups";
            this.makeAJAXrequest($H({
                xml: xml,
                successMethod: this._successGettingGroups.bind(this, showGroupsPart)
            }));
        }
        //if we already have the json with the tree
        else {
            this._successGettingGroups(showGroupsPart, this.options.treeJson);
        }
    },

    /**
    * Function called when we receive the list of groups from backend
    * @param {Object} json The JSON wit the groups received
    */
    _successGettingGroups: function (showGroupsPart, json) {
        this.oldGroupsJson = json;
        this.loadingElement.hide();
        if (showGroupsPart) {
            this.groupsPartElement.show();
        }
        if (json.EWS.o_grouping[this.options.groupItemsName]) {
            this.groups = objectToArray(json.EWS.o_grouping[this.options.groupItemsName]);
            this.maxNumberGroups = parseInt(json.EWS.o_maxgrouping, 10);
            //Show the groups part, rebuilding it
            if (showGroupsPart) {
                this._showGroupsPart();
            } else {
                //Just rebuild the name
                this._updateSelectedGroupsNames();
            }

        } else {
            this.groups = null;
            var errorMessage = new Element("p", {
                "class": "TreeGroupings_errorMessage application_main_error_text"
            }).insert(global.getLabel('error_occured'));
            this.groupsElement.update(errorMessage);
        }
    },
    /**
    * Builds the HTML for the groups part (it will be stored in this.groupsElement
    */
    _buildGroupsPart: function () {
        //Remove the list from before, stopping the observers, if there is no list yet, create it
        if (Object.isEmpty(this.groupLIElements)) {
            this.groupLIElements = $H();
        } else {
            var listKeys = this.groupLIElements.keys();
            for (var i = 0; i < listKeys.size(); i++) {
                this.groupLIElements.get(listKeys[i]).checkbox.stopObserving("change");
                this.groupLIElements.get(listKeys[i]).checkbox = null;
                this.groupLIElements.get(listKeys[i]).element = null;
                this.groupLIElements.unset(listKeys[i]);
            }
        }

        if (this.groups.size() > 0) {
            this.groupListElement = new Element("ul", {
                "class": "TreeGroupings_groupList",
                "id": "TreeGroupings_groupList"
            });
            this.selectedGroups = 0;
            for (var i = 0; i < this.groups.size(); i++) {
                //Get info from the json
                var checked = false;
                if (this.groups[i]['@selected'] === 'X') {
                    checked = true;
                    this.selectedGroups++;
                }
                var labelName = this.groups[i]['@att_tag'];
                var label = labelName; //global.getLabel(labelName);
                var itemId = this.groups[i]['@att_param'];

                //Create HTML structure
                var listItem = new Element("li", {
                    "id": "TreeGroupingslistElement_" + "000" + i
                });
                listItem.itemId = itemId;
                var checkbox = new Element("input", {
                    "type": "checkbox",
                    "id": "TreeGroupings_listElement_" + itemId,
                    "name": "TreeGroupings_listElement_" + itemId,
                    "class": "test_checkBox"
                });
                if (checked) {
                    checkbox.checked = true;
                    checkbox.defaultChecked = true; //IE
                }
                var labelElement = new Element("span", {
                    "class": "test_label",
                    "for": "TreeGroupings_listElement_" + itemId
                }).insert(label);
                /*listItem.insert(checkbox);
                listItem.insert(labelElement);
                
                this.groupListElement.insert(listItem);*/
                var containerBlock = new Element("div");
                listItem.insert(containerBlock);
                containerBlock.insert(checkbox);
                containerBlock.insert(labelElement);
                this.groupListElement.insert(listItem);

                //Store it in this.groupLIElements, key: att_tag
                this.groupLIElements.set(itemId, {
                    json: this.groups[i],
                    element: listItem,
                    checkbox: checkbox,
                    order: i
                });
                checkbox.observe("change", this._groupCheckboxChanged.bind(this, itemId));
            }
            //Drag n drop message
            var dragAndDropMessage = new Element("p", {
                "class": "TreeGroupings_dragAndDropMessage"
            }).insert(global.getLabel('DragDrop_bars_to_change_order'));

            this.groupsElement.update(this.groupListElement);
            //Make the list drag and drop:
            Sortable.create(this.groupListElement, {
                constraint: 'vertical'
            });
            this.groupsElement.insert(dragAndDropMessage);

        } else {
            //If there are no groups:
            this.groupsElement.update(noResults);
        }
    },
    /**
    * Function called when a checkbox has been changed. Depending on how many of them
    * are selected it will disable/enable buttons (or other checkboxes)
    * @param {Object} itemId
    */
    _groupCheckboxChanged: function (itemId) {
        var item = this.groupLIElements.get(itemId);
        if (!Object.isEmpty(item)) {
            var checked = item.checkbox.checked;
            //Update the json
            if (checked) {
                item.json["@selected"] = "X";
                this.selectedGroups++;
            } else {
                item.json["@selected"] = "";
                this.selectedGroups--;
            }
            //TODO: to improve: disable/enable Done button depending on the number of selected groups
            //TODO: to improve: Disable/enable other chekboxes depending on the number of selected groups
        }
    },

    /**
    * Shows the tree part of the module
    */
    _showTreePart: function () {
        this._getTreeFromBackend(this.groups);
    },

    /**
    * Reloads the tree part, adding parameters so it recreates the buffer in backend
    */
    reloadTree: function () {
        this._getTreeFromBackend(this.groups, true);
    },

    /**
    * Gets the tree associated to some groups from backend 
    * @param {Object} groups Array with the groups selected (it can be empty or undefined, then we will get the default tree).
    * @param {Boolean } refreshTree If we should add parameter REFRESH_MY_SELECTIONS = X so it refreshes the buffer in backend
    */
    _getTreeFromBackend: function (groups, refreshTree) {
        if (Object.isEmpty(this.options.treeJson) || refreshTree) {
            var groupsXML = "<I_GROUPING/>";
            if (!Object.isEmpty(groups)) {
                groupsXML = "<I_GROUPING>";
                for (var i = 0; i < groups.size(); i++) {
                    if (Object.isEmpty(groups[i].json)) {
                        var attParam = groups[i]['@att_param'];
                    } else {
                        var attParam = groups[i].json['@att_param'];
                    }
                    groupsXML += '<' + this.options.groupingNodeName + ' ATT_LEVEL="' + i + '" ATT_PARAM="' + attParam + '"/>';
                }
                groupsXML += "</I_GROUPING>";
            }
            var defaultXML = "";
            if (this.firstTimeGettingTree) {
                defaultXML = "<I_DEFAULT>X</I_DEFAULT>"
            }
            var refreshTag = ""
            if (refreshTree === true) {
                refreshTag = "<REFRESH_MY_SELECTIONS>X</REFRESH_MY_SELECTIONS>";
            }

            var xml = '<EWS>' +
                        '<SERVICE>' + this.options.getTreeService + '</SERVICE>' +
                        '<PARAM>' +
                            groupsXML +
                            defaultXML +
                            refreshTag +
                            this.options.appendGetTree +
                        '</PARAM>' +
                    '</EWS>';

            this.loadingElement.show();
            this.groupsPartElement.hide();
            this.treePartElement.hide();
            this.makeAJAXrequest($H({
                xml: xml,
                successMethod: this._successGettingTree.bind(this, refreshTree)
            }));
        }
        else {
            this._successGettingTree(refreshTree, this.options.treeJson);
        }
    },

    /**
    * Called when the tree is succesfully retrieved
    * @param {Object} refreshTree If we are refreshing the buffer
    * @param {Object} json
    */
    _successGettingTree: function (refreshTree, json) {
        this.oldTreeJson = json;
        this.partShown = "tree";
        this.loadingElement.hide();
        this.treePartElement.show();
        this._updateSelectedGroupsNames();
        this.latestNodes = $H();
        //Check if the o_no_att_config attribute is set, if so give an error
        if (json.EWS.o_no_att_config == 'X') {
            var errorLabel = this.options.noAttributesLabel;
            this.treeElement.update("");
            this.treeElement.hide();
            this.groupsNamesElement.update(errorLabel);
            this.groupsNamesElement.writeAttribute("title", "");
        } else {
            //Check if there is any tree nodes found:
            if (Object.isEmpty(json.EWS.o_tree)) {
                var errorLabel = this.options.noResultsLabel;
                this.treeElement.update("");
                this.treeElement.hide();
                this.groupsNamesElement.update(errorLabel);
                this.groupsNamesElement.writeAttribute("title", "");
            } else {
                //There are tree nodes found
                if (!Object.isEmpty(this.options.treeReceivedEvent))
                    document.fire(this.options.treeReceivedEvent, { tree: json });
                //Insert the HTML generated ny linedTree module
                this.treeElement.update("");
                this.treeElement.hide();
                var treeStructure = this._getTreeStructure(objectToArray(json.EWS.o_tree[this.options.treeNodesName]), json.EWS.o_def_nodes);
                var objEvents = $H();
                objEvents.set('onCheckBoxClick', 'EWS:TreeGroupings_nodeClicked');
                //Stop observing when we create it so the first time it isn't called
                var linedTreeObject = new linedTree(this.treeElement, treeStructure, {
                    useCheckBox: true,
                    objEvents: objEvents,
                    returnAllNodesOnSelection: true,
                    spreadSelection: true
                });
                this.treeElement.show();
            }
        }
        //Build tree
        //Show Tree container
        this.loadingElement.hide();
        this.groupsPartElement.hide();
        this.treePartElement.show();
        if (refreshTree === true) {
            document.fire('EWS:TreeGroupings_treeRefreshed');
        } else {
            //Since we may have changed selection inform te application so it can handle it
            if (!this.firstTimeGettingTree) {
                document.fire(this.options.treeNodeClicked, {
                    selectedNodes: this.selectedNodes,
                    allNodes: this.latestNodes
                });
            }

        }
    },

    /**
    * Obtains the tree structure needed to create a LinedTree
    * @param {Object} nodes Array with all the nodes
    */
    _getTreeStructure: function (nodes, selectedNodes) {
        var hashSelectedNodes = $H();
        if (!Object.isEmpty(selectedNodes)) {
            var nodesToSelect = objectToArray(selectedNodes[this.options.nodeNameXML]);
            for (var i = 0; i < nodesToSelect.size(); i++) {
                hashSelectedNodes.set(nodesToSelect[i]["@ind_node"]/*nodesToSelect[i]*/, true);
            }
        }
        var result = $A();
        var nodesHash = $H();
        //We create all the info for the nodes and store them in a hash, this way it will be easier to build the hierarchy between them
        //First level is for each tree level, then the node ids are used as keys
        for (var i = 0; i < nodes.size(); i++) {
            this.latestNodes.set(parseInt(nodes[i]['@att_id'], 10), nodes[i]);
            var levelInt = parseInt(nodes[i]['@att_level'], 10);
            if (Object.isEmpty(nodesHash.get(levelInt))) {
                nodesHash.set(levelInt, $H());
            }
            var nodeId = nodes[i]['@att_id'];
            var checked = 0;
            if (!Object.isEmpty(hashSelectedNodes.get(nodeId))) {
                checked = 2;
            }

            var nodeInfo = {
                id: parseInt(nodeId, 10),
                title: (this._createTreeNodeContent(nodes[i]['@att_val_descr'], parseInt(nodes[i]['@att_instance_cnt'], 10))).stripTags(),
                value: this._createTreeNodeContent(nodes[i]['@att_val_descr'], parseInt(nodes[i]['@att_instance_cnt'], 10)),
                parent: null,
                isOpen: false,
                isChecked: checked,
                hasChildren: false,
                children: $A(),
                att_value: nodes[i]['@att_value']
            };
            nodesHash.get(levelInt).set(nodes[i]['@att_id'], nodeInfo);
        }
        var leafLevel = nodesHash.keys().size();
        //Loop again updating parent and children info
        for (var i = 0; i < nodes.size(); i++) {
            var levelInt = parseInt(nodes[i]['@att_level'], 10);
            var childId = nodes[i]['@att_id'];
            var childNode = nodesHash.get(levelInt).get(childId);
            if (levelInt > 0) {
                var parentId = nodes[i]['@att_parent_id'];
                var parentNode = nodesHash.get(levelInt - 1).get(parentId);
                parentNode.hasChildren = true;
                parentNode.children.push(childNode);
                childNode.parent = parentNode.id;
            }
            //Update the isChecked attribute:
            var selectedIndex = 0;
            if (!Object.isEmpty(this.selectedNodes.get(childId))) {
                //Node is selected
                if (levelInt < leafLevel) {
                    selectedIndex = 1;
                } else {
                    selectedIndex = 0;
                }
                childNode.isChecked = selectedIndex;
            }
        }
        //Push all level 0 nodes in the result:
        var level0Keys = nodesHash.get(0).keys();
        for (var i = 0; i < level0Keys.size(); i++) {
            result.push(nodesHash.get(0).get(level0Keys[i]));
        }

        return result;
    },

    /**
    * Creates the content for a node: text (count)
    * @param {Object} text Text to show
    * @param {Object} count Number of ocurrences for this node
    */
    _createTreeNodeContent: function (text, count) {
        var value = text
        var nodeContent = ''
        nodeContent = text + ' (' + count + ')';
        return nodeContent;
    },

    /**
    * Function called when a tree node has been clicked
    * @param {Object} args
    */
    _nodeClicked: function (args) {
        var selectionArray = args.memo.selection;
        var unselectionArray = args.memo.unselection;

        //See if something has changed in the selection
        var selectionChanged = false;
        for (var i = 0; i < selectionArray.size(); i++) {
            if (Object.isEmpty(this.selectedNodes.get(selectionArray[i]))) {
                selectionChanged = true;
                break;
            }
        }
        if (!selectionChanged) {
            for (var i = 0; i < unselectionArray.size(); i++) {
                if (!Object.isEmpty(this.selectedNodes.get(unselectionArray[i]))) {
                    selectionChanged = true;
                    break;
                }
            }
        }

        //If there is change, update the selectedNodesHash
        if (selectionChanged) {
            var selectionHashKeys = this.selectedNodes.keys();
            for (var i = 0; i < selectionHashKeys.size(); i++) {
                this.selectedNodes.unset(selectionHashKeys[i]);
            }
            for (var i = 0; i < selectionArray.size(); i++) {
                this.selectedNodes.set(selectionArray[i], this.latestNodes.get(selectionArray[i]));
            }
            //Since we have changed selection inform te application so it can handle it
            document.fire(this.options.treeNodeClicked, {
                selectedNodes: this.selectedNodes,
                allNodes: this.latestNodes
            });
        }
    },
    /**
    * Returns the list of selected groups, separated by "-" or options.groupsSeparator
    */
    _updateSelectedGroupsNames: function () {
        var separator = "-";
        if (!Object.isEmpty(this.options.groupsSeparator)) {
            separator = this.options.groupsSeparator;
        }
        var result = "";
        if (!Object.isEmpty(this.groups)) {
            //If there are groups, we add the selected groups names
            var selectedGroups = $A();
            for (var i = 0; i < this.groups.size(); i++) {
                if (this.groups[i]['@selected']) {
                    selectedGroups.push(this.groups[i]);
                }
            }
            if (selectedGroups.size() > 0) {
                for (var i = 0; i < (selectedGroups.size() - 1); i++) {
                    result += selectedGroups[i]['@att_tag'] + " " + separator + " ";
                }
                result += selectedGroups.last()['@att_tag'];
            } else {
                result = this.options.labelNoGroupsSelected;
            }

        }
        this.groupsNamesElement.writeAttribute("title", result);
        //Cutting result if it's too long
        this.groupsNamesElement.update(result.truncate(30));
    },
    /**
    * Enables groupings functionality
    */
    enable: function () {
        if (this.partShown == "tree") {
            this.treeElement.show();
        } else {
            this.groupsPartElement.show();
        }
        this.doneButtonDisplayer.enable("showGroupsButton");
        this.groupsButtonDisplayer.enable("showGroupsButton");
    },
    /**
    * Disables groupings functionality
    */
    disable: function () {
        if (this.partShown == "tree") {
            this.treeElement.hide();
        } else {
            this.groupsPartElement.hide();
        }
        this.doneButtonDisplayer.disable("showGroupsButton");
        this.groupsButtonDisplayer.disable("showGroupsButton");
    },


    //TODO: comment
    _destroy: function () {
        //TODO
        document.stopObserving("EWS:TreeGroupings_nodeClicked");
    }
});
