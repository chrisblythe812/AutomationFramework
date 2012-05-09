
/**
 *@constructor
 *@description this class will keep the whole information about an application instance
 *@augments origin
 */
var Application = Class.create(origin, {
    title: null, //application title div Element
    populationName: null, //population to be used by this application.
    observedEvents: $A(), //Array with all the events that are being observed, used to stop them 
    currentRunningMode: null, //Whether it's running on popup, sub application mode or normal mode. Its values can be "tabbed", "sub" or "popup"
    onEmployeeSelected: null, //Method to be overwritten in order to do something when an employee is selected
    onEmployeeUnselected: null, //Method to be overwritten in order to do something when an employee is unselected


    /**
    *@param $super $super class initializer
    *@param appName {String} the name of the application we want to create an instance of files about the application
    *@description creates a new application with the proper attributes values
    */
    initialize: function ($super, options) {
        this.options = options;
        this.appName = options.className;
        this.firstRun = true;
        $super();
        this.populationName = global.getPopulationName(this.options)
        this.running = false;
        this.createTitle();

    },
    /**
    *@description shows the target div of an application
    */
    run: function (args) {
        var position = this.options.position;
        var mode = this.options.mode;
        if (!mode) {
            $('content').insert(this.virtualHtml);
            this.mode = "tabbed";
        } else if (mode == "sub") {
            this.mode = "sub";
            if (!this.running) {
                if (!position) {
                    position = "bottom";
                }
                var insertion = {};
                insertion[position] = this.virtualHtml;
                $("content").insert(insertion);
            } else {
                this.close();
            }
        } else if (mode == "popUp" && !this.running) {
            this.popUpApplication = new infoPopUp({
                closeButton: $H({
                    'callBack': function () {
                        this.close();
                        this.popUpApplication.close();
                        delete this.popUpApplication;
                    } .bind(this)
                }),
                htmlContent: this.virtualHtml.addClassName("applications_popUp_container_div"),
                width: 853,
                height: 700
            });
            //show the popUp
            this.mode = "popup";
            this.popUpApplication.create();
        }
        this.running = true;
    },
    /*
    * Function that handles the employee selections when switch from a Multiple Selection application to an Single selection one.
    * previousMode: Older mode (SingleMode or MultiMode)
    * oldPopulation: Name of the last population selected in the system.
    */
    switchMultiToSingle: function (oldPopulation, previousMode) {
        var populationName = global.getPopulationName(this.options)
        var population = global.populations.get(populationName);
        var selected = false;
        if (populationName == oldPopulation) {
            var notFoundSelected = true;
            var populationKeys = population.keys();
            for (var i = 0; i < populationKeys.length; i++) {
                var employeeValue = population.get(populationKeys[i]);
                var employeeKey = populationKeys[i];
                //We check if the current employee of the list is not the user.
                if (!employeeValue["actual"]) {
                    //It a person of a population.
                    if (employeeValue["multiSelected"] && notFoundSelected) {
                        //It's the first selected in MultiSelect and will be the selected in single mode
                        this.selectEmployeer(employeeKey, "singleSelected", populationName);
                        notFoundSelected = false;
                    }
                    else if (employeeValue["singleSelected"]) {
                        //It's a older selection in single mode, and we have to unmark it.
                        this.unSelectEmployeer(employeeKey, "singleSelected", populationName);
                    }
                } //End If "Actual"
                else { //We unmark the user
                    if (!employeeValue["multiSelected"]) {
                        this.unSelectEmployeer(employeeKey, "singleSelected", populationName);
                        employeeValue["noneSelected"] = false;
                    }
                    else {
                        if (!selected) {
                            this.selectEmployeer(employeeKey, "singleSelected", populationName);
                            employeeValue["noneSelected"] = true;
                            selected = true;
                            if (employeeValue["type"] != 'H') {
                                notFoundSelected = false;
                            }
                        }
                        else {
                            this.unSelectEmployeer(employeeKey, "singleSelected", populationName);
                            employeeValue["noneSelected"] = false;
                        }
                    }
                    //employeeValue["noneSelected"] = false;
                    //this.unSelectEmployeer(employeeKey, "singleSelected", populationName);
                } //End else "Actual"
            } //End list employeers For
            if (this.getSelectedEmployees().size() == 0) {
                employeeValue["noneSelected"] = true;
                this.selectEmployeer(populationKeys[0], "singleSelected", populationName);
            }
        }
        else {
            var populationOld = global.populations.get(oldPopulation);
            var populationName = global.getPopulationName(this.options);
            var populationNew = global.populations.get(populationName);
            var selected = $A();
            var populationOldKeys = populationOld.keys();
            for (var i = 0; i < populationOldKeys.length; i++) {
                var employeeValue = populationOld.get(populationOldKeys[i]);
                var employeeKey = populationOldKeys[i];
                if (employeeValue[previousMode + "Selected"]) {
                    selected.push(employeeKey);
                }
            }
            //Looking for the previous selected item
            var populationNewKeys = populationNew.keys();
            //        if(Prototype.Browser.WebKit){
            //           populationNewKeys.reverse();
            //            }
            if (Prototype.Browser.WebKit) {//chrome compatibility
                populationNew.get(populationOldKeys[0])["noneSelected"] = false;
            } else {
                populationNew.get(populationNewKeys[0])["noneSelected"] = false;
            }
            //populationNew.get(populationNewKeys[0])["singleSelected"] = false;
            var found = false;
            for (var j = 0; j < populationNewKeys.length; j++) {
                var employeeValue = populationNew.get(populationNewKeys[j]);
                var employeeKey = populationNewKeys[j];
                if (employeeValue["singleSelected"] == true) {
                    this.unSelectEmployeer(employeeKey, "singleSelected", populationName);
                }
                for (var f = 0; f < selected.length && !found; f++) {
                    if (selected[f] == employeeKey /*&& !employeeValue["actual"]*/) {
                        this.selectEmployeer(employeeKey, "singleSelected", populationName);
                        found = true;
                        break;
                    }
                } //End For
            } //End for
            //If there isn't any selected employeer, we keep the first one
            if (!(found)) {
                this.selectEmployeer(populationNewKeys[0], "singleSelected", populationName);
            } //End if
        } //End Else
    },
    /*
    * Function that handles the employee selections when switch from a Single Selection application to an multiple selection one.
    * previousMode: Older mode (SingleMode or MultiMode)
    * oldPopulation: Name of the last population selected in the system.
    */
    switchSingleToMulti: function (oldPopulation, previousMode) {
        var populationName = global.getPopulationName(this.options);
        var population = global.populations.get(populationName);
        var numberSelectedMyDetails = 0;
        if (populationName == oldPopulation) {
            var populationKeys = population.keys();
            for (var i = 0; i < populationKeys.length; i++) {
                var employeeValue = population.get(populationKeys[i]);
                var employeeKey = populationKeys[i];
                //We check if the current employee of the list is not the user.
                if (!employeeValue["actual"]) {
                    if (employeeValue["singleSelected"]) {
                        this.selectEmployeer(employeeKey, "multiSelected", populationName);
                    }
                    else if (employeeValue["multiSelected"]) {
                        this.unSelectEmployeer(employeeKey, "multiSelected", populationName);
                    }
                }
                else {
                    if (!employeeValue["singleSelected"]) {
                        this.unSelectEmployeer(employeeKey, "multiSelected", populationName);
                        employeeValue["noneSelected"] = false;
                    }
                    else {
                        this.selectEmployeer(employeeKey, "multiSelected", populationName);
                        employeeValue["noneSelected"] = true;
                    }

                }
            }
        }
        //Different Populations
        else {
            var populationOld = global.populations.get(oldPopulation);
            var populationName = global.getPopulationName(this.options);
            var populationNew = global.populations.get(populationName);
            var selected = $A();
            var populationOldKeys = populationOld.keys();
            for (var i = 0; i < populationOldKeys.length; i++) {
                var employeeValue = populationOld.get(populationOldKeys[i]);
                var employeeKey = populationOldKeys[i];
                if (employeeValue[previousMode + "Selected"]) {
                    selected.push(employeeKey);
                    break;
                }
            }
            var populationNewKeys = populationNew.keys();
            for (var j = 0; j < populationNewKeys.length; j++) {
                var employeeValue = populationNew.get(populationNewKeys[j]);
                var employeeKey = populationNewKeys[j];
                if (employeeKey == selected[0]) { //Is it the same employeer?
                    this.selectEmployeer(employeeKey, "multiSelected", populationName);
                    employeeValue["noneSelected"] = true;
                    var found = true;
                }
                else {
                    //It's a older selection in multi mode, and we have to unmark it.
                    this.unSelectEmployeer(employeeKey, "multiSelected", populationName);
                    employeeValue["noneSelected"] = false;
                }
            }
            //If there isn't any selection, we keep the actual one
            if (Object.isEmpty(found)) {
                this.selectEmployeer(populationNewKeys[0], "multiSelected", populationName);
            }
        }
    },
    /*
    * Function that handles the employee selections when switch from a Multiple Selection application to an multiple selection one with different population.
    * previousMode: Older mode (SingleMode or MultiMode)
    * oldPopulation: Name of the last population selected in the system.
    */
    switchMultiToMulti: function (oldPopulation, previousMode) {
        var populationOld = global.populations.get(oldPopulation);
        var populationName = global.getPopulationName(this.options);
        var populationNew = global.populations.get(populationName);
        var selected = $A();
        var populationOldKeys = populationOld.keys();
        for (var i = 0; i < populationOldKeys.length; i++) {
            var employeeValue = populationOld.get(populationOldKeys[i]);
            var employeeKey = populationOldKeys[i];
            if (employeeValue[previousMode + "Selected"]) {
                selected.push(employeeKey);
            }
        }
        //Looking for the previous selected item
        var populationNewKeys = populationNew.keys();
        var found = false;
        var foundGlobal = null;
        for (var j = 0; j < populationNewKeys.length; j++) {
            var employeeValue = populationNew.get(populationNewKeys[j]);
            var employeeKey = populationNewKeys[j];
            found = false;
            for (var f = 0; f < selected.length && !found; f++) {
                if (selected[f] == employeeKey) {
                    this.selectEmployeer(employeeKey, "multiSelected", populationName);

                    found = true;
                    if (!employeeValue["actual"]) {
                        foundGlobal = true;
                    }
                    else {
                        employeeValue["noneSelected"] = true;
                    }
                }
            } //End For
            //If there isn't any selected item, we keep the first one.
            if (!found) {
                //It's a older selection in multi mode, and we have to unmark it.
                this.unSelectEmployeer(employeeKey, "multiSelected", populationName);
                if (employeeValue["actual"]) {
                    employeeValue["noneSelected"] = false;
                }
            } //End !Found
        } //End For
        if (!Object.isEmpty(foundGlobal) && !foundGlobal) {
            this.selectEmployeer(populationNewKeys[1], "multiSelected", populationName);
        }
    },

    /*
    * Function that handles the employee selections when switch from a Single Selection application to an single selection application with different population.
    * previousMode: Older mode (SingleMode or MultiMode)
    * oldPopulation: Name of the last population selected in the system.
    */
    switchSingleToSingle: function (oldPopulation, previousMode) {
        //Looking for old selection.
        var populationOld = global.populations.get(oldPopulation);
        var populationName = global.getPopulationName(this.options.appId);
        var populationNew = global.populations.get(populationName);
        var selected = $A();
        var populationOldKeys = populationOld.keys();
        for (var i = 0; i < populationOldKeys.length; i++) {
            var employeeValue = populationOld.get(populationOldKeys[i]);
            var employeeKey = populationOldKeys[i];
            if (employeeValue[previousMode + "Selected"]) {
                selected.push(employeeKey);
                break;
            }
        }
        //Searching the old selection in new selection
        var populationNewKeys = populationNew.keys();

        for (var j = 0; j < populationNewKeys.length; j++) {
            var employeeValue = populationNew.get(populationNewKeys[j]);
            var employeeKey = populationNewKeys[j];
            if (employeeKey == selected[0]) { //Is it the same employeer?
                if (!employeeValue["actual"]) {
                    this.selectEmployeer(employeeKey, "singleSelected", populationName);
                    var found = true;
                }
                else {
                    this.selectEmployeer(employeeKey, "singleSelected", populationName);
                    var found = true;
                    employeeValue["noneSelected"] = true;
                }
            }
            else {
                if (!employeeValue["actual"]) {
                    //It's a older selection in multi mode, and we have to unmark it.
                    this.unSelectEmployeer(employeeKey, "singleSelected", populationName);
                }
                else {
                    this.unSelectEmployeer(employeeKey, "singleSelected", populationName);
                    employeeValue["noneSelected"] = false
                }
            }
        }
        //If there isn't any selected employeer, we keep the first one.        
        if (Object.isEmpty(found)) {// &&  !this.firstRun){
            this.selectEmployeer(populationNewKeys[0], "singleSelected", populationName);
        }
    },
    selectUser: function (previousMode, oldPopulation) {
        var found = false;
        var populationName = global.getPopulationName(this.options);
        var populationNew = global.populations.get(populationName);
        var populationNewKeys = populationNew.keys();
        //11/01/2010 Settings bug
        if (populationName != "NOPOP") {
            for (var j = 0; j < populationNewKeys.length; j++) {
                var employeeValue = populationNew.get(populationNewKeys[j]);
                if (!employeeValue["actual"]) {
                    this.unSelectEmployeer(populationNewKeys[j], "singleSelected", populationName);
                    this.unSelectEmployeer(populationNewKeys[j], "multiSelected", populationName);
                }
                else {
                    if (!found) {
                        //                        this.selectEmployeer(populationNewKeys[j], "singleSelected", populationName);
                        //                        this.selectEmployeer(populationNewKeys[j], "multiSelected", populationName);
                        this.selectEmployeer(populationNewKeys[j], global.currentSelectionType + "Selected", populationName);
                        found = true;
                    }
                }
            }
        } else {
            if (populationNewKeys.length > 1) {
                var populationOld = global.populations.get(oldPopulation);
                var selected = $A();
                var populationOldKeys = populationOld.keys();
                for (var i = 0; i < populationOldKeys.length; i++) {
                    var employeeValue = populationOld.get(populationOldKeys[i]);
                    var employeeKey = populationOldKeys[i];
                    if (employeeValue[previousMode + "Selected"]) {
                        selected.push(employeeKey);
                    }
                }
                var found = false;
                for (var j = 0; j < populationNewKeys.length; j++) {
                    var employeeValue = populationNew.get(populationNewKeys[j]);
                    var employeeKey = populationNewKeys[j];
                    if (employeeValue["singleSelected"] == true) {
                        this.unSelectEmployeer(employeeKey, "singleSelected", populationName);
                        employeeValue["noneSelected"] = false;
                        employeeValue["multiSelected"] = false;
                    }
                    for (var f = 0; f < selected.length && !found; f++) {
                        if (selected[f] == employeeKey /*&& !employeeValue["actual"]*/) {
                            this.selectEmployeer(employeeKey, "singleSelected", populationName);
                            found = true;
                            employeeValue["noneSelected"] = true;
                            break;
                        }
                    } //End For
                } //End for
                //If there isn't any selected employeer, we keep the first one
                if (!(found)) {
                    this.selectEmployeer(populationNewKeys[0], "singleSelected", populationName);
                } //End if
            }
        }
    },
    /*
    * Function that handles the employee selections when switch the applications.
    * previousMode: Older mode (SingleMode or MultiMode)
    */
    switchSelection: function (previousMode, oldPopulation) {
        var currentMode = global.currentSelectionType;
        var currentPopulation = global.getPopulationName(this.options);
        if (currentPopulation == "NOPOP") {
            this.selectUser(previousMode, oldPopulation);
        }
        else {
            if (currentMode != "none") {
                //Change Mode
                if (currentMode != previousMode) {
                    if (currentMode == "multi") {
                        this.switchSingleToMulti(oldPopulation, previousMode);
                    }
                    else if (currentMode == "single") {
                        this.switchMultiToSingle(oldPopulation, previousMode);
                    }
                }
                //Same Mode
                else {
                    //If the populations change, we should do a mesh between them.
                    if (oldPopulation != currentPopulation) {
                        if (currentMode == "multi") {
                            this.switchMultiToMulti(oldPopulation, previousMode);
                        }
                        else {
                            this.switchSingleToSingle(oldPopulation, previousMode);
                        }
                    }
                }
            }
            else {
                //There is no left menu. We select the user
                this.selectUser(previousMode, oldPopulation);
            }
        }
    },
    /**
    * Function that handles the employee selections and unselections that had
    * happened while this application wasn't shown
    */
    afterRun: function (changeApp, previousMode, oldPopulation) {
        global.hideCopyright = true;
        this.hashSelectedEmployee = $H();
        this.hashUnselectedEmployee = $H();
        //Here, it's controlled the change of applications mode, from MultiSelect to Single Selection and Single to Multiselect
        if (!Object.isEmpty(changeApp) && previousMode) {
            this.switchSelection(previousMode, oldPopulation)
        }
        var populationName = global.getPopulationName(this.options)
        var population = global.populations.get(populationName);
        population.each(function (employee) {
            if (!this.options.population.get(employee.key)) {
                var object = {};
                object[global.currentSelectionType + "Selected"] = false;
                this.options.population.set(employee.key, object);
            }
            var locallySelected = this.options.population.get(employee.key)[global.currentSelectionType + "Selected"];
            var globalSelected = employee.value[global.currentSelectionType + "Selected"];
            if (globalSelected && !locallySelected && this.onEmployeeSelected) {
                if (!this.hashSelectedEmployee.get(employee.key)) {
                    this.onEmployeeSelected({
                        id: employee.key,
                        name: employee.value.name,
                        oType: employee.value.type,
                        population: populationName
                    });
                }
            } else if (locallySelected && !globalSelected && this.onEmployeeUnselected) {
                if (!this.hashUnselectedEmployee.get(employee.key)) {
                    this.onEmployeeUnselected({
                        id: employee.key,
                        name: employee.value.name,
                        oType: employee.value.type,
                        population: populationName
                    });
                }
            } else if (globalSelected && locallySelected && this.onEmployeeSelected) {
                if (!this.hashSelectedEmployee.get(employee.key) && !Object.isEmpty(changeApp)) {
                    this.onEmployeeSelected({
                        id: employee.key,
                        name: employee.value.name,
                        oType: employee.value.type,
                        population: populationName
                    });
                }
            }

            if (locallySelected != globalSelected && global.currentSelectionType != "none") {
                var object = this.options.population.get(employee.key);
                object[global.currentSelectionType + "Selected"] = globalSelected;
            }
        } .bind(this));
    },
    /**
    *@description hides an application div --> close the application
    */
    close: function () {
        if (this.virtualHtml.parentNode) {
            this.virtualHtml.remove();
        }
        this.firstRun = false;
        this.running = false;
    },
    /**
    * Creates the application's title.
    */
    createTitle: function () {
        this.targetDiv = 'app_' + this.appName;
        //        Here we create the parent <div> of the application
        this.virtualHtml = new Element('div', {
            id: this.targetDiv,
            className: 'applications_container_div dummyHelpApp'
        });
        this.virtualHtml.insert(this.title);
    },
    /**
    * Updates the application's title in case it exists, if not creates it
    */
    updateTitle: function (text, css) {
        if (this.title && this.title.down('span')) {
            this.title.down('span').update(text);
            this.virtualHtml.insert({ top: this.title });
        } else {
            var className;
            if (css == '') {
                className = 'application_main_title'
            } else {
                className = css
            }
            this.title = new Element('div', {
                className: 'application_main_title_div'
            });
            var span = new Element('span', {
                className: css
            });
            span.update(text);
            this.title.insert(span);
            this.virtualHtml.insert({ top: this.title });
        }

        this.title.show();
    },


    /**
    * Returns a list with all the selected employees for the current population
    * @return Hash keys are the selected employees ids, it will contain also
    * 				a JSON object with the object type, id, color and population.
    */
    getSelectedEmployees: function () {
        var populationName = global.getPopulationName(this.options);
        var population = global.populations.get(populationName);
        var populationSelected = $H({});

        population.each(function (employee) {
            if (employee.value[global.currentSelectionType + "Selected"]) {
                populationSelected.set(employee.key, {
                    id: employee.key,
                    name: employee.value.name,
                    oType: employee.value.type,
                    population: populationName,
                    color: global.getColor(employee.key)
                });
            }
        });

        return populationSelected;
    },
    /**
    * Returns an employee from the population (selected or not)
    * @param employee {String} the employee id
    * @return the employee data. In other case, <strong>null</strong> is returned
    */
    getEmployee: function (employeeID) {
        var employeeData = null;
        var populationName = global.getPopulationName(this.options);
        var employee = global.populations.get(populationName).get(employeeID);
        if (!employee)
            return null;
        var employeeData = {
            color: global.getColor(employeeID),
            name: employee.name,
            id: employee.id
        };

        return employeeData;
    },
    /**
    * Function that select an employeer in a current population
    * employeeId: Number of the employeer to selected
    * mode: Mode in which the employeer is going to be selected
    * population: Name of the population
    */
    selectEmployeer: function (employeeID, mode, population) {
        if (!Object.isEmpty(global.populations.get(population).get(employeeID))) {
            var populationCol = global.populations.get(population);
            var employee = populationCol.get(employeeID);
            if (!this.options.population.get(employee.key)) {
                var object = {};
                object[global.currentSelectionType + "Selected"] = false;
                this.options.population.set(employeeID, object);
            }
            this.options.population.get(employeeID)[mode] = true;
            employee[mode] = true;
            if (this.onEmployeeSelected) {
                this.onEmployeeSelected({
                    id: employeeID,
                    name: employee.name,
                    oType: employee.type,
                    population: population
                });
                this.hashSelectedEmployee.set(employeeID, employeeID);
            }
        }
    },
    /**
    * Function that unselect an employeer in a current population
    * employeeId: Number of the employeer to unselected
    * mode: Mode in which the employeer is going to be unselected
    * population: Name of the population
    */
    unSelectEmployeer: function (employeeID, mode, population) {
        if (!Object.isEmpty(global.populations.get(population).get(employeeID))) {
            var populationCol = global.populations.get(population);
            var employeer = populationCol.get(employeeID);
            if (!this.options.population.get(employeeID)) {
                var object = {};
                object[global.currentSelectionType + "Selected"] = false;
                this.options.population.set(employeeID, object);
            }
            this.options.population.get(employeeID)[mode] = false;
            employeer[mode] = false;
            if (this.onEmployeeUnselected) { //If method is overwritten
                this.onEmployeeUnselected({
                    id: employeeID,
                    name: employeer.name,
                    oType: employeer.type,
                    population: population
                });
                this.hashUnselectedEmployee.set(employeeID);
            }
        }
    },
    /**
    * Gives all the population members for the logged user. The first one is him/herself. If no
    * population it only gets him/herself.
    * @returns An array of JSON objects with the data for each employee.
    */
    getPopulation: function () {
        var populationName = global.getPopulationName(this.options);
        var population = global.populations.get(populationName);
        var populationAdapted = $A();

        //Adapt the population data to the one expected by the developer.
        population.each(function (employee) {
            populationAdapted.push({
                objectType: employee.value.type,
                objectId: employee.key,
                name: employee.value.name,
                color: global.getColor(employee.key)
            });
        });

        return populationAdapted;
    },
    /**
    * Gets a String telling which is the selection type used by this application
    * @return <ul><li>none if there's no selection</li><li>single if it's single selection</li>
    * 			<li>multi if it's multiple selection</li></ul>
    */
    getSelectionMode: function () {
        var selectionMode = 0;
        //gets the selection mode code from the menus data in global.
        //this data comes with the my selections menu data.
        if (global.tabid_leftmenus.get(this.appName) &&
			global.tabid_leftmenus.get(this.appName).get("SELECT")) {

            selectionMode = global.tabid_leftmenus.get(this.appName).get("SELECT").menuType;
        }
        var selectionType = "none";
        //get the selection type. If no selection mode found for this app put
        //none as the selection type (e.g. Inbox)
        selectionMode = parseInt(selectionMode, 10);
        switch (selectionMode) {
            case 2:
                selectionType = "multi";
                break;
            case 1:
                selectionType = "single";
                break;
            default:
                selectionType = "none";
                break;
        }

        return selectionType;
    },

    /**
    * Copy the selected people in the left menu to an multiselect.
    * @param multiselect {Object} the multiselect Object to add the selection form left menu
    */
    leftMenuToMultiSelect: function (multiSelect) {
        multiSelect.defaultBoxes();
        var allEmployees = objectToArray(multiSelect.JSON.autocompleter.object);
        var selected = this.getSelectedEmployees().keys();
        var employeesToAdd = $A();
        var conti = true;
        for (var i = 0; i < allEmployees.length; i++) {
            conti = true;
            for (var j = 0; j < selected.length && conti; j++) {
                if (selected[j] == allEmployees[i].data) {
                    employeesToAdd.push(i);
                    conti = false;
                }
            }
        }
        multiSelect.addBoxes(employeesToAdd);
    },

    changeScreen: function (app) {
        if (global.WEB_SCREENS) {
            var data = global.WEB_SCREENS.get(app);
            if (data) {
                document.fire("EWS:changeScreen", data);
            }
        }
    }
});