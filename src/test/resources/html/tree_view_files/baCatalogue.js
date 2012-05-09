/** 
* @fileOverview baCatalogue.js 
* @description File containing class baCatalogue. 
* Application for Maintain OM.
*/

/**
*@constructor
*@description Class baCatalogue.
*@augments GenericCatalog 
*/
var baCatalogue = Class.create(GenericCatalogV2,
/** 
*@lends baCatalogue
*/
    {
    initialService: 'GET_ROOTS_BA',
    getNodeChildrenService: 'GET_CHILD_BA',
    searchedNodeSelectedService: 'GET_PAR_BA',
    hashOfButtons: $H(),
    linksLoaded: false,
    searchedNodeSelectedService: 'GET_PAR_BA',
    /**
    *Constructor of the class baCatalogue
    */
    initialize: function ($super, args) {
        $super(args, {
            containerParent: 'OM_MGMT',
            containerChild: 'OM_BAM'
        });
        this.actionClickedBinding = this.actionClicked.bindAsEventListener(this);
        //autocompleter views events
        this.viewSelectedBinding = this.viewSelected.bindAsEventListener(this);
        //adv search event
        this.employeeSelectedAdvSearchBinding = this.reloadTree.bindAsEventListener(this);
    },

    /**
    *@description Starts baCatalogue
    */
    run: function ($super, args) {
        $super(args);
        this.comeFromMaintainView = getArgs(args).get('comeFromMaintainView');
        this.applicationId = getArgs(args).get('app').appId;
        if (this.comeFromMaintainView) {
            this.hashOfViews = getArgs(args).get('hashOfViews');
            if (this.hashOfViews.size() > 0)
                this.numberOfViews = this.hashOfViews.size();
            this.idArg = getArgs(args).get('idArg');
        }
        //catalog events
        document.observe(this.applicationId + ':action', this.actionClickedBinding);
        document.observe('EWS:allEmployeesAdded', this.employeeSelectedAdvSearchBinding);
        //autocompleter views events
        document.observe(this.applicationId + ':viewSelected', this.viewSelectedBinding);
        //adv search event
        document.observe('EWS:allEmployeesAdded', this.employeeSelectedAdvSearchBinding);
    },
    handleData: function (data) {
        var structure = $H({});
        if (!Object.isEmpty(data.EWS.o_children)) {
            if (!Object.isEmpty(data.EWS.o_children.yglui_str_parent_children_om))
                var nodes = data.EWS.o_children.yglui_str_parent_children_om;
            else {
                var nodes = data.EWS.o_children.yglui_str_parent_children;
            }
        }
        if (data.EWS.o_root || data.EWS.o_parent) {
            if (data.EWS.o_root) {
                //store the roots of the tree in a hash
                var roots = objectToArray(data.EWS.o_root.yglui_str_parent_children_om);
                this.numberOfRoots = roots.length;
                for (var i = 0; i < this.numberOfRoots; i++) {
                    this.hashOfRoots.set(i, roots[i]['@otjid']);
                }
                //this.rootId = data.EWS.o_root.yglui_str_parent_children['@objid'];
                objectToArray(data.EWS.o_root.yglui_str_parent_children_om).each(function (node) {
                    structure.set(node['@otjid'], $H({}));
                    structure.get(node['@otjid']).set(node['@otjid'], node);
                } .bind(this));
            } else {
                [data.EWS.o_parent].each(function (node) {
                    structure.set(node['@otjid'], $H({}));
                    structure.get(node['@otjid']).set(node['@otjid'], node);
                } .bind(this));
            }
            if (nodes) {
                structure.each(function (root) {
                    objectToArray(nodes).each(function (nd) {
                        var rootID = nd['@rootty'] + nd['@rootid'];
                        if (rootID == root.key) {
                            structure.get(root.key).set(nd['@otjid'], nd);
                        }
                    } .bind(this));
                } .bind(this));
            }
        } else {
            if (nodes) {
                objectToArray(nodes).each(function (nd) {
                    structure.set(nd['@otjid'], nd);
                } .bind(this));
            }
        }
        return structure;
    },
    /**     
    *@description this method creates the appropriate structure for each node 
    *@param element {Object} the node to be set properly
    */
    createNodesArray: function (element, parentNewId) {
        var addName = Object.isEmpty(element["@add_text"]) ? null : element["@add_text"];
        if (this.nodes.get(element['@otjid'])) {//This is when sometimes we have the same node in several part of the tree.
            var repeated = true;
            this.random = Math.floor(Math.random() * 100000) + "";
        }
        if (parentNewId) {
            var parentId = parentNewId;
            var parentOldId = element['@rootty'] + element['@rootid'];
        } else {
            var parentId = (element['@rootty'] && element['@rootid']) ? element['@rootty'] + element['@rootid'] : null;
            var parentOldId = null;
        }
        if (element["@is_from_request"] && this.CheckBoxClicked) {
            var extraIcons = $A();
            if (!global.liteVersion) {
                extraIcons.push(this.CLASS_OBJTYPE.get("PR"));
            } else {
                extraIcons.push({ cssClass: this.CLASS_OBJTYPE.get("PR"), icon: this.CLASS_OBJTYPE_CODE.get(element['@otype']) });
            }
        } else {
            var extraIcons = null;
        }
        Json = {
            id: !repeated ? element['@otjid'] : element['@otjid'] + "R" + this.random,
            oldId: repeated ? element['@otjid'] : null,
            title: '',
            value: element['@stext'],
            extraText: addName,
            extraTextClass: "OM_Maintain_additionalName",
            extraIcons: extraIcons,
            parent: parentId,
            parentOldId: parentOldId,
            isChecked: (Object.isEmpty(element['@checked'])) ? 0 : 2,
            isOpen: false,
            hasChildren: ((element['@parnt'] == 'X') ? true : false),
            children: $A(),
            checkRoot: element['@select_root'],
            select: element['@select'],
            nodeIcon: /*'catalogLinedTreeIconFix ' +*/this.CLASS_OBJTYPE.get(element['@icon']),
            liteVersion: global.liteVersion ? this.CLASS_OBJTYPE_CODE.get(element['@icon']) : false
        }
        return Json;
    },
    /**     
    *@param data {JSON} node context
    *@description It sets the node context on the treeHandler, after receiving it as the respond
    *to the get node parent (context) information service.
    */
    navigateTo: function (type, data, ajaxID) {
        $(this.applicationId + '_level5').update('');
        if (this.nodeDeleted) {// when we are going to delete a node
            var nodeDeletedId = this.nodeDeleted["@otype"] + this.nodeDeleted["@objid"];
            var rootArray = this.rootsNumber(this.nodes.get(nodeDeletedId).parentType + this.nodes.get(nodeDeletedId).parent);
            var number = rootArray.length - 1;
            var auxArray = this._findEachParent(rootArray, number);
            var index = getElementIndex(auxArray[number].children, 'id', nodeDeletedId);
            auxArray[number].children.splice(index, 1);
            if (auxArray[number].children.length == 0) {
                auxArray[number].hasChildren = false;
                auxArray[number].isOpen = false;
            }
            this._rebuildStructure(auxArray, rootArray, number);
            this.tree.reloadTree(this.currentJSONs);
            this.nodes.unset(nodeDeletedId);
            this.createToolTip();
        } else if (type == "autocompleter" || !Object.isEmpty(type) || this.advSearch) { // to filter the tree
            this.nodes = $H();
            this.data = this.handleData(data);
            this.setTreeDiv(ajaxID);
            if (this.advSearch) {
                this.nodeChildren(ajaxID);
                this.advSearch = false;
            }
        } else /*if(this.insertNewNode)*/{// to insert a node
            this.nodesAux = this.nodes;
            this.nodes = $H();
            this.data = this.handleData(data);
            var newCurrentJSONs = this.currentJSONs;
            this.visitedNodes = this.tree.visitedNodes;
            this.setTreeDiv();
            this._reOpenTree(newCurrentJSONs);
            this.insertNewNode = false;
        }        
    },
    /**     
    *@description It sets the HTML structure 
    */
    setHTML: function (data) {
        this.json = data;
        this.data = this.handleData(data);
        //add relative position so the datePicker doesn't move down when scroll inside infoPopUp
        this.virtualHtml.addClassName('comp_catl_positionRelative');
        this.virtualHtml.update(
   			        "<div id='" + this.applicationId + "_level1' class='whoiswho_selectorViewMenuDiv'></div>" +
					"<div id='" + this.applicationId + "_level2' class='genCat_level3'></div>" + //autocompleter
					"<div id='" + this.applicationId + "_level3' class='genCat_level3'></div>" + //datepickers
					"<div id='" + this.applicationId + "_level4' class='genCat_level4'></div>" + //legend
					"<div id='" + this.applicationId + "_backTop' class='genCat_backTop'></div>" +
					"<div style='clear:both'>&nbsp;</div>" +
					"<div id='" + this.applicationId + "_level5' class='genCat_level5 OM_generic_marginCatalog'></div>" +
					"<div id='" + this.applicationId + "_level6' class='genCat_level6'>" +
					"</div>"
		);
        //draw autocompleter menu
        this.setAutocompleterMenu();
        this.backtoTopLink();
        this.setDatePickersDiv();
        //this.setAutoCompleterDiv();
        //this.setAutoCompleterLabel(global.getLabel('Go to'));
        this.setAdvancedSearch();
        this.setLegendDiv();
        this.setTreeDiv();
    },
    /**     
    *@description It calls sap to get views
    */
    setAutocompleterMenu: function () {
        this.virtualHtml.down('div#' + this.applicationId + '_level1').insert("<div id='" + this.applicationId + "_autocompleterView'></div>");
        if (this.numberOfViews > 0) {
            //read values to fill autocompleter list from hash
            var text, id, obj = [];
            for (var i = 0; i < this.numberOfViews; i++) {
                data = this.hashOfViews.get(i).get('appId') + '/*/' + this.hashOfViews.get(i).get('view');
                text = this.hashOfViews.get(i).get('label');
                obj.push({ text: text, data: data });
            }
        }
        var json = {
            autocompleter: {
                object: obj,
                multilanguage: {
                    no_results: global.getLabel('noresults'),
                    search: global.getLabel('search')
                }
            }
        };
        this.autoCompleterView = new JSONAutocompleter(this.applicationId + '_autocompleterView', {
            events: $H({ onResultSelected: this.applicationId + ':viewSelected' }),
            showEverythingOnButtonClick: true,
            templateOptionsList: '#{text}',
            templateResult: '#{text}',
            maxShown: 20,
            minChars: 1
        }, json);
        this.autoCompleterView.setDefaultValue(this.idArg);
    },
    /**     
    *@param args {Event} event thrown by the autoCompleter when a view has been selected
    *@description It opens the catalog selected
    */
    viewSelected: function (args) {
        if (!getArgs(args).isEmpty) {
            if (getArgs(args).idAdded || getArgs(args).get('idAdded')) {
                var idArg = getArgs(args).idAdded ? getArgs(args).idAdded : getArgs(args).get('idAdded');
                var appid = idArg.split('/*/')[0];
                var view = idArg.split('/*/')[1];
                global.open($H({
                    app: {
                        appId: appid,
                        tabId: this.options.tabId,
                        view: view
                    },
                    hashOfViews: this.hashOfViews,
                    idArg: idArg,
                    comeFromMaintainView: true
                }));
            }
        }
    },
    /**     
    *@description It sets the link of back to top
    */
    backtoTopLink: function () {
        var json = {
            elements: []
        };
        var aux = {
            label: global.getLabel("backtoroot"),
            handlerContext: null,
            handler: function () {
                //clear autocompleter
                //this.autoCompleter.clearInput();
                //return to first tree
                this.backTop();
            } .bind(this),
            idButton: this.applicationId + "_backTop",
            className: 'application_action_link',
            type: 'link',
            standardButton: true
        };
        json.elements.push(aux);
        var ButtonBackToTop = new megaButtonDisplayer(json);
        this.virtualHtml.down('div#' + this.applicationId + '_backTop').insert(ButtonBackToTop.getButtons());
        this.virtualHtml.down('div#' + this.applicationId + '_backTop').hide();
    },
    /**     
    *@description It sets the third HTML level (the DatePickers one)
    */
    setDatePickersDiv: function () {
        this.datePickersLabel = new Element('span', { className: 'application_main_title3 test_label' });
        this.virtualHtml.down('div#' + this.applicationId + '_level3').insert(this.datePickersLabel.update(global.getLabel('date')).wrap('div', { className: 'OM_Maintain_label' })); //this.data.datePickersLabel));	
        this.virtualHtml.down('div#' + this.applicationId + '_level3').insert("<div class='genCat_comp' id='" + this.applicationId + "_datePickers'>" +
																				"<div id='" + this.applicationId + "_datePickerBeg'></div>" +
																		  "</div>");
        var aux = { events: $H({ 'correctDate': 'EWS:' + this.applicationId + '_correctDay' }),
            defaultDate: objectToSap(new Date()).gsub('-', '')
        };
        this.datePickerBeg = new DatePicker(this.applicationId + '_datePickerBeg', aux);
    },
    /**     
    *@description It sets the second HTML level (the autoCompleter one)
    */
    setAutoCompleterDiv: function () {
        this.autoCompleterLabel = new Element('span', { className: 'application_main_title3 test_label' });
        this.radioButtonsGroup = new Element('div', { id: this.applicationId + '_radioButtonsGroup', className: 'genCat_radioButtonsGroup' });
        this.virtualHtml.down('div#' + this.applicationId + '_level2').insert(this.autoCompleterLabel.update('Autocompleter Label').wrap('div', { className: 'OM_Maintain_label' })); //this.data.autocompleterLabel));
        this.virtualHtml.down('div#' + this.applicationId + '_level2').insert("<div class='genCat_comp' id='" + this.applicationId + "_autocompleter'></div>");
        this.virtualHtml.down('div#' + this.applicationId + '_level2').insert(this.radioButtonsGroup);
        var json = {
            autocompleter: {
                object: [],
                multilanguage: {
                    no_results: global.getLabel('noresults'),
                    search: global.getLabel('search')
                }
            }
        };
        this.autoCompleter = new JSONAutocompleter(this.applicationId + '_autocompleter', {
            events: $H({ onGetNewXml: this.applicationId + ':nodeSearch',
                onResultSelected: this.applicationId + ':nodeSelected'
            }),
            showEverythingOnButtonClick: true,
            noFilter: true,
            timeout: 0,
            templateResult: '#{text}',
            maxShown: 20,
            minChars: 1
        }, json);
        var radioButton = "<div class='OM_checkboxes fieldDispFloatLeft fieldClearBoth'><input type='radio' name='gcRadioGroup' value='9O' checked>" + global.getLabel('BA') + "</input></div>" +
                          "<div class='OM_checkboxes fieldDispFloatLeft fieldClearBoth'><input type='radio' name='gcRadioGroup' value='O' checked>" + global.getLabel('ORGEH') + "</input></div>" +
                          "<div class='OM_checkboxes fieldDispFloatLeft fieldClearBoth'><input type='radio' name='gcRadioGroup' value='S'>" + global.getLabel('PLANS') + "</input></div>" +
                          "<div class='OM_checkboxes fieldDispFloatLeft fieldClearBoth'><input type='radio' name='gcRadioGroup' value='p'>" + global.getLabel('EMPLOYEE') + "</input></div>";
        this.radioButtonsGroup.insert(radioButton);


    },
    /**     
    *@description It sets the adv search 
    */
    setAdvancedSearch: function () {
        if (!this.checkBoxes) {
            this.advancedSearchDiv = new Element('div', { id: this.applicationId + '_advancedSearch', className: 'OM_Maintain_baCatalogAdvSearchDiv' });
            //PROVISIONAL SOLUTION: links in tree
            this.virtualHtml.down('div#' + this.applicationId + '_level3').insert(this.advancedSearchDiv);
            var label = "";
            if (global.liteVersion) {
                var label = "\u25D9";
            }
            var json = {
                elements: []
            };
            var advSearchIcon = {
                label: label,
                handlerContext: null,
                className: 'application_catalog_image application_catalog_image_AS application_handCursor',
                handler: this.getAdvSearchlinks.bind(this),
                type: 'button',
                standardButton: false,
                toolTip: global.getLabel('SRC_OV')
            };
            var advSearchLink = {
                label: global.getLabel('SRC_OV'),
                handlerContext: null,
                className: 'application_handCursor',
                handler: this.getAdvSearchlinks.bind(this),
                type: 'link',
                standardButton: true,
                toolTip: global.getLabel('SRC_OV')
            };
            json.elements.push(advSearchIcon);
            json.elements.push(advSearchLink);
            var Buttons = new megaButtonDisplayer(json);
            var advancedSearchButton = new Element("div").insert(Buttons.getButtons());

            var advancedSearchLinks = new Element("div", { "id": "advSearchLinks", "class": "OM_advsSearchLinks" });
            this.advancedSearchDiv.insert(advancedSearchButton);
            this.advancedSearchDiv.insert(advancedSearchLinks);
            this.virtualHtml.down('div#advSearchLinks').hide();
        }
    },
    /**     
    *@description It gets links of Advanced Search from sap the first time
    */
    getAdvSearchlinks: function () {
        //check if links for Adv Search have been loaded before
        if (!this.linksLoaded) {
            //calling sap to get different object for Adv Search
            var xml = "<EWS>"
                          + "<SERVICE>GET_MSHLP</SERVICE>"
                          + "<OBJECT TYPE='" + global.objectType + "'>" + global.objectId + "</OBJECT>"
                          + "<PARAM>"
                            + "<APPID>" + this.containerChild + "</APPID>"
                          + "</PARAM>"
                        + "</EWS>";
            this.makeAJAXrequest($H({ xml: xml, successMethod: 'setAdvSearchlinks' }));
        } else {
            this.setAdvSearchlinks();
        }
    },
    /**     
    *@description It draws links and defines functinality for each button
    */
    setAdvSearchlinks: function (json) {
        if (!this.linksLoaded) {
            //update variable
            this.linksLoaded = true;
            // get info about links
            this.buttonsAnswer = objectToArray(json.EWS.o_tabs.yglui_str_madv_tab);
            var buttonsNavJson = {
                elements: []
                //mainClass: 'moduleInfoPopUp_stdButton_div_left'
            };
            this.numberOfLinks = this.buttonsAnswer.length;
            for (var i = 0; i < this.numberOfLinks; i++) {
                //save button info
                var seqnr = this.buttonsAnswer[i]['@seqnr'];
                this.hashOfButtons.set(seqnr, {
                    appId: this.buttonsAnswer[i]['@appid'],
                    label_tag: this.buttonsAnswer[i]['@label_tag'],
                    sadv_id: this.buttonsAnswer[i]['@sadv_id']
                });

                var aux = {
                    idButton: this.buttonsAnswer[i]['@sadv_id'] + '_button',
                    label: this.buttonsAnswer[i]['@label_tag'],
                    handlerContext: null,
                    className: 'getContentLinks application_action_link jobCat_searchLinkDiv',
                    handler: this.openNavApp.bind(this, seqnr),
                    eventOrHandler: false,
                    type: 'link'
                };
                buttonsNavJson.elements.push(aux);
            } //end for
            var ButtonObj = new megaButtonDisplayer(buttonsNavJson);
            //insert buttons in div
            this.virtualHtml.down('div#advSearchLinks').insert(ButtonObj.getButtons());
        }
        //showing/hiding links
        if (!this.virtualHtml.down('div#advSearchLinks').visible()) {
            this.virtualHtml.down('div#advSearchLinks').show();
        } else {
            this.virtualHtml.down('div#advSearchLinks').hide();
        }
    },
    /**     
    *@description It opens Advanced Search application after clicking on a link.
    */
    openNavApp: function (seqnr) {
        this.advSearch = true;
        global.open($H({
            app: {
                tabId: "POPUP",
                appId: "ADVS",
                view: "AdvancedSearch"
            },
            sadv_id: this.hashOfButtons.get(seqnr).sadv_id,
            multiple: false,
            addToMenu: false
        }));
    },
    /**
    * @description Method that reloads the tree after selecting an object in Adv Search pop up. 
    */
    reloadTree: function (parameters) {
        //hide links of Adv Search
        this.virtualHtml.down('div#advSearchLinks').hide();
        //get results from Adv. Search pop up        
        var objectHash = getArgs(parameters).get('employeesAdded');
        var args = $H({});
        if (objectHash.size() != 0) {
            var objectId, objectName, objectType;
            objectHash.each(function (pair) {
                objectId = pair[0];
                objectName = pair[1].name;
                objectType = pair[1].type;
            } .bind(this));
            //insert info about elements selected in Adv Search
            args.set('idAdded', objectId + '_' + objectType);
        } else {
            args.set('idAdded', '');
        }
        this.nodeSelected(args);
    },
    /**     
    *@description It sets the fourth HTML level  (the Legend one)
    */
    setLegendDiv: function () {
        var aux = new Object();
        var text = '';
        aux.legend = [];
        aux.showLabel = global.getLabel('showLgnd');
        aux.hideLabel = global.getLabel('closeLgnd');
        if (this.json.EWS.labels) {
            //save labels in a hash
            var labelsHash = $H();
            var labelsSize = this.json.EWS.labels.item.length;
            for (var i = 0; i < labelsSize; i++) {
                labelsHash.set(this.json.EWS.labels.item[i]['@id'], this.json.EWS.labels.item[i]['@value']);
            }
            //draw legend
            var text;
            this.json.EWS.o_legend.item.each(function (element) {
                if (labelsHash.get(element['@otype'])) {
                    text = labelsHash.get(element['@otype'])
                } else {
                    text = "";
                }
                aux.legend.push({ img: this.CLASS_OBJTYPE.get(element['@otype']), text: text, code: this.CLASS_OBJTYPE_CODE.get(element['@otype']) });
            } .bind(this));
        }
        this.virtualHtml.down('div#' + this.applicationId + '_level4').update(getLegend(aux));
        this.legend = this.virtualHtml.down('div#' + this.applicationId + '_level4');
    },
    /**     
    *@description It executes the code that belongs to the action clicked 
    */
    actionClicked: function (parameters) {
        var name = getArgs(parameters).get('name');
        //var nodeTypeId = getArgs(parameters).get('nodeId');
        var nodeType = getArgs(parameters).get('nodeType');
        var nodeId = getArgs(parameters).get('nodeId'); // nodeTypeId.split(nodeType)[1];
        var nodeName = getArgs(parameters).get('nodeName');
        var nextApp = getArgs(parameters).get('application');
        var okCode = getArgs(parameters).get('okCode');
        var mode = getArgs(parameters).get('mode');
        var view = getArgs(parameters).get('view');
        var tarty = getArgs(parameters).get('tarty');
        var date = (this.datePickerBeg).actualDate.toString('yyyy-MM-dd');
        var tab;
        if (tarty != 'P') { tab = this.options.tabId } else { tab = 'POPUP' };
        switch (name) {
            //BA ACTIONS      
            case 'BA_ASSING': // Change Assigments
                global.open($H({
                    app: {
                        appId: nextApp,
                        tabId: this.options.tabId,
                        view: view
                    },
                    objectId: nodeId,
                    objectIdRequest: nodeId,
                    parentType: nodeType,
                    oType: '9O',
                    displayMode: 'edit',
                    okCode: okCode,
                    mode: mode,
                    begda: date
                }));
                balloon.hide();
                break;
            case 'BA_CREATE': // Create Business Area
                global.open($H({
                    app: {
                        appId: nextApp,
                        tabId: tab,
                        view: view
                    },
                    objectId: nodeId,
                    parentType: nodeType,
                    oType: '9O',
                    displayMode: 'create',
                    okCode: okCode
                }));
                balloon.hide();
                break;
            case 'BA_DELETE': // Delete Business Area
                this.deleteObject(nodeType, nodeId, name, '', global.getLabel('deleteObj'), okCode, nodeName, nextApp);
                balloon.hide();
                break;
            case 'BA_DELIMIT': // Delimit Business Area
                this.delimitObject(nodeType, nodeId, name, '', global.getLabel('delimitObj'), okCode, nodeName, nextApp);
                balloon.hide();
                break;
            case 'BA_UPDATE': // Edit Business Area
                global.open($H({
                    app: {
                        appId: nextApp,
                        tabId: tab,
                        view: view
                    },
                    objectId: nodeId,
                    objectName: nodeName,
                    objectIdRequest: nodeId,
                    oType: '9O',
                    parentType: nodeType,
                    displayMode: 'edit',
                    okCode: okCode,
                    begda: date
                }));
                balloon.hide();
                break;
            case 'BA_VIEW': // View Business Area
                global.open($H({
                    app: {
                        appId: nextApp,
                        tabId: 'POPUP',
                        view: view
                    },
                    objectId: nodeId,
                    oType: '9O',
                    parentType: nodeType,
                    displayMode: 'display',
                    okCode: okCode,
                    begda: date
                }));
                balloon.hide();
                break;
            //ORG UNITS ACTIONS   
            case 'OM_CHANGE_ASS_O': // Change Assignment (org unit)
                global.open($H({
                    app: {
                        appId: nextApp,
                        tabId: this.options.tabId,
                        view: view
                    },
                    objectId: nodeId,
                    objectIdRequest: nodeId,
                    parentType: nodeType,
                    oType: 'O',
                    displayMode: 'edit',
                    okCode: okCode,
                    mode: mode,
                    begda: date
                }));
                balloon.hide();
                break;
            case 'OM_ORG_DISPLAY': // View Organizational Unit
                global.open($H({
                    app: {
                        appId: nextApp,
                        tabId: 'POPUP',
                        view: view
                    },
                    objectId: nodeId,
                    parentType: nodeType,
                    oType: 'O',
                    displayMode: 'display',
                    okCode: okCode,
                    mode: mode,
                    begda: date
                }));
                balloon.hide();
                break;
            case 'OM_ORG_EDIT': // Edit Organizational Unit
                global.open($H({
                    app: {
                        appId: nextApp,
                        tabId: this.options.tabId,
                        view: view
                    },
                    objectId: nodeId,
                    objectName: nodeName,
                    objectIdRequest: nodeId,
                    parentType: nodeType,
                    oType: 'O',
                    displayMode: 'edit',
                    okCode: okCode,
                    mode: mode,
                    begda: date
                }));
                balloon.hide();
                break;
            //POSITION ACTIONS   
            case 'OM_CHANGE_ASSIGN': // Change Assignment (position)
                global.open($H({
                    app: {
                        appId: nextApp,
                        tabId: this.options.tabId,
                        view: view
                    },
                    objectId: nodeId,
                    objectIdRequest: nodeId,
                    parentType: nodeType,
                    oType: 'S',
                    displayMode: 'edit',
                    okCode: okCode,
                    mode: mode,
                    begda: date
                }));
                balloon.hide();
                break;
            case 'OM_POS_DISPLAY': // View Position
                global.open($H({
                    app: {
                        appId: nextApp,
                        tabId: 'POPUP',
                        view: view
                    },
                    objectId: nodeId,
                    parentType: nodeType,
                    oType: 'S',
                    displayMode: 'display',
                    okCode: okCode,
                    mode: mode,
                    begda: date
                }));
                balloon.hide();
                break;
            case 'OM_POS_EDIT': // edit a position
                global.open($H({
                    app: {
                        appId: nextApp,
                        tabId: this.options.tabId,
                        view: view
                    },
                    objectId: nodeId,
                    objectName: nodeName,
                    objectIdRequest: nodeId,
                    parentType: nodeType,
                    oType: 'S',
                    displayMode: 'edit',
                    okCode: okCode,
                    mode: mode,
                    begda: date
                }));
                balloon.hide();
                break;
            //EMPLOYEE ACTIONS   
            case 'OM_PERSON_DISPLAY': // view person details
                global.open($H({
                    app: {
                        appId: nextApp,
                        tabId: 'POPUP',
                        view: view
                    },
                    objectId: nodeId,
                    parentType: nodeType,
                    oType: 'P',
                    displayMode: 'display',
                    okCode: okCode,
                    mode: mode,
                    begda: date
                }));
                balloon.hide();
                break;
            default:
                balloon.hide();
                break;
        }
    },
    /**
    * @description Method that shows a poop up with a confirmation to remove the object
    */
    deleteObject: function (oType, objectId, actionId, appName, message, code, objectName, nextApp) {
        var messageFrom;
        var genericDeleteHtml = "<div>" +
                                    "<div class='application_main_title3 OM_Maintain_PopUpTitle'><span>" + objectName + " [" + objectId + "]" + "</span></div>" +
                                    "<div><span>" + message + "</span></div>" +
                                "</div>";
        var _this = this;
        var contentHTML = new Element('div');
        contentHTML.insert(genericDeleteHtml);
        //buttons
        var buttonsJson = {
            elements: [],
            mainClass: 'moduleInfoPopUp_stdButton_div_right'
        };
        var callBack = function () {
            if (_this)
                _this.deleteRequest(oType, objectId, actionId, appName, code, nextApp);
            deleteCataloguePopUp.close();
            delete deleteCataloguePopUp;
        };
        var callBack3 = function () {
            deleteCataloguePopUp.close();
            delete deleteCataloguePopUp;
        };
        var aux2 = {
            idButton: 'Yes',
            label: global.getLabel('yes'),
            handlerContext: null,
            className: 'moduleInfoPopUp_stdButton',
            handler: callBack,
            type: 'button',
            standardButton: true
        };
        var aux3 = {
            idButton: 'No',
            label: global.getLabel('no'),
            handlerContext: null,
            className: 'moduleInfoPopUp_stdButton',
            handler: callBack3,
            type: 'button',
            standardButton: true
        };
        buttonsJson.elements.push(aux2);
        buttonsJson.elements.push(aux3);
        var ButtonObj = new megaButtonDisplayer(buttonsJson);
        var buttons = ButtonObj.getButtons();
        //insert buttons in div
        contentHTML.insert(buttons);

        var deleteCataloguePopUp = new infoPopUp({
            closeButton: $H({
                'textContent': 'Close',
                'callBack': function () {
                    deleteCataloguePopUp.close();
                    delete deleteCataloguePopUp;
                }
            }),
            htmlContent: contentHTML,
            indicatorIcon: 'information',
            width: 600
        });
        deleteCataloguePopUp.create();
    },
    /**
    * @description Builds the xml and send it to SAP for the Delete request
    */
    deleteRequest: function (oType, objectId, actionId, appName, code, nextApp) {
        if (Object.isEmpty(appName))
            appName = "";
        var xml = "<EWS>"
                    + "<SERVICE>" + this.genericDeleteService + "</SERVICE>"
                    + "<OBJECT TYPE=\"" + oType + "\">" + objectId + "</OBJECT>"
                    + "<PARAM>"
                        + "<REQ_ID></REQ_ID>"
                        + "<APPID>" + nextApp + "</APPID>"
                        + "<BUTTON ACTION=\"" + actionId + "\" OKCODE=\"" + code + "\" />"
                    + "</PARAM>"
                 + "</EWS>";

        this.makeAJAXrequest($H({ xml: xml, successMethod: 'genericDeleteAnswer' }));
    },
    /**
    * @description Method that draws message of confirmation to delimit an object
    */
    delimitObject: function (oType, objectId, actionId, appName, message, code, objectName, nextApp) {
        var messageFrom;
        if (code == 'CUT') { messageFrom = global.getLabel('delimitFrom') } else { messageFrom = global.getLabel('deleteFrom') }
        var delimitObjectHtml = "<div>"
                                   + "<div class='application_main_title3 OM_Maintain_PopUpTitle'><span>" + objectName + " [" + objectId + "]" + "</span></div>"
                                   + "<div><span>" + message + "</span></div>"
                                   + "<div class = 'catalog_deleteCourse_delimit'><span>" + messageFrom + "</span></div>"
                                   + "<div class = 'catalog_deleteCourse_datePicker' id='delete_" + objectId + "DatePicker'></div>"
                                   + "</div>";
        var aux = { manualDateInsertion: true,
            defaultDate: objectToSap(new Date()).gsub('-', '')
        };
        var _this = this;
        var contentHTML = new Element('div');
        contentHTML.insert(delimitObjectHtml);
        //buttons
        var buttonsJson = {
            elements: [],
            mainClass: 'moduleInfoPopUp_stdButton_div_right'
        };
        var callBack = function () {
            if (_this)
                _this.delimitObjectRequest(oType, objectId, actionId, appName, code, nextApp);
            deleteCataloguePopUp.close();
            delete deleteCataloguePopUp;
        };
        var callBack3 = function () {
            deleteCataloguePopUp.close();
            delete deleteCataloguePopUp;
        };
        var aux2 = {
            idButton: 'Yes',
            label: global.getLabel('yes'),
            handlerContext: null,
            className: 'moduleInfoPopUp_stdButton',
            handler: callBack,
            type: 'button',
            standardButton: true
        };
        var aux3 = {
            idButton: 'No',
            label: global.getLabel('no'),
            handlerContext: null,
            className: 'moduleInfoPopUp_stdButton',
            handler: callBack3,
            type: 'button',
            standardButton: true
        };
        buttonsJson.elements.push(aux2);
        buttonsJson.elements.push(aux3);
        var ButtonObj = new megaButtonDisplayer(buttonsJson);
        var buttons = ButtonObj.getButtons();
        //insert buttons in div
        contentHTML.insert(buttons);

        var deleteCataloguePopUp = new infoPopUp({
            closeButton: $H({
                'textContent': 'Close',
                'callBack': function () {
                    deleteCataloguePopUp.close();
                    delete deleteCataloguePopUp;
                }
            }),
            htmlContent: contentHTML,
            indicatorIcon: 'information',
            width: 600
        });
        deleteCataloguePopUp.create();
        this.delimitObjectDatePicker = new DatePicker('delete_' + objectId + 'DatePicker', aux);
    },
    /**
    * @description Builds the xml and send it to SAP for the Delete request
    */
    delimitObjectRequest: function (oType, objectId, actionId, appName, code, nextApp) {
        if (Object.isEmpty(appName))
            appName = "";
        //else
        //appName = getSapName(appName); (deprecated method)
        var begDay = this.datePickerBeg.getDateAsArray().day;
        var begMonth = this.datePickerBeg.getDateAsArray().month;
        var begYear = this.datePickerBeg.getDateAsArray().year;
        if (begDay.length == 1)
            begDay = '0' + begDay;
        if (begMonth.length == 1)
            begMonth = '0' + begMonth;
        var xml = "<EWS>"
                    + "<SERVICE>" + this.genericDeleteService + "</SERVICE>"
                    + "<OBJECT TYPE=\"" + oType + "\">" + objectId.gsub(oType, '') + "</OBJECT>"
                    + "<PARAM>"
                        + "<REQ_ID></REQ_ID>"
                        + "<APPID>" + nextApp + "</APPID>"
                        + "<KEYDATE>" + begYear + '-' + begMonth + '-' + begDay + "</KEYDATE>"
                        + "<UPD_DATE>" + objectToSap(this.delimitObjectDatePicker.getActualDate()) + "</UPD_DATE>"
                        + "<BUTTON ACTION=\"" + actionId + "\" OKCODE=\"" + code + "\" />"
                    + "</PARAM>"
                 + "</EWS>";

        this.makeAJAXrequest($H({ xml: xml, successMethod: 'genericDeleteAnswer' }));
    },
    /**     
    *@param args {Event} event thrown by the autoCompleter when a node has been selected from 
    *its search results list.
    *@description It gets a node context (parent and siblings) from SAP.
    */
    nodeSelected: function (args) {
        if (!getArgs(args).isEmpty) {
            if (getArgs(args).idAdded || getArgs(args).get('idAdded')) {
                var idArg = getArgs(args).idAdded ? getArgs(args).idAdded : getArgs(args).get('idAdded');
                if (!Object.isEmpty(idArg)) {
                    var id = idArg.split('_')[0].gsub(idArg.split('_')[1], '');
                    //take into account if the element selected in autocompleter is a root or not
                    this.rootSelected = false;
                    for (var i = 0; i < this.numberOfRoots; i++) {
                        if (id == this.hashOfRoots.get(i)) {
                            this.rootSelected = true;
                        }
                    }
                    //call to sap with different service depending of element selected
                    if (!this.rootSelected) {
                        var type = idArg.split('_')[1];
                        var xml = "<EWS>" +
						            "<SERVICE>" + this.searchedNodeSelectedService + "</SERVICE>" +
						            "<OBJECT TYPE='" + type + "'>" + id + "</OBJECT>" +
						            "<DEL></DEL>" +
						            "<PARAM>" +
							            "<CONTAINER_PARENT>" + this.containerParent + "</CONTAINER_PARENT>" +
							            "<CONTAINER_CHILD>" + this.containerChild + "</CONTAINER_CHILD>" +
							   "<DATUM>" + objectToSap(this.datePickerBeg.getActualDate()) + "</DATUM>" +
						            "</PARAM>" +
				               "</EWS>";
                        if (this.advSearch) {
                            this.makeAJAXrequest($H({
                                xml: xml,
                                successMethod: this.navigateTo.bind(this, null),
                                ajaxID: type + id
                            }));
                        } else {
                            this.makeAJAXrequest($H({
                                xml: xml,
                                successMethod: this.navigateTo.bind(this, 'autocompleter'),
                                ajaxID: type + id
                            }));
                        }
                        this.virtualHtml.down('div#' + this.applicationId + '_backTop').show();
                    } else {
                        this.backTop("autocompleter", id);
                    }
                }
            }
        }
    },
    /**     
    *@description It calls SAP to get initial info (overwritten)
    */
    backTop: function (type, id) {
        var xml = "<EWS>" +
						"<SERVICE>" + this.initialService + "</SERVICE>" +
						"<OBJECT TYPE='" + global.objectType + "'>" + global.objectId + "</OBJECT>" +
						"<PARAM>" +
							"<CONTAINER_PARENT>" + this.containerParent + "</CONTAINER_PARENT>" +
							"<CONTAINER_CHILD>" + this.containerChild + "</CONTAINER_CHILD>" +
							"<DATUM>" + objectToSap(this.datePickerBeg.getActualDate()) + "</DATUM>" +
						"</PARAM>" +
				   "</EWS>";

        this.makeAJAXrequest($H({
            xml: xml,
            successMethod: this.navigateTo.bind(this, type),
            ajaxID: id
        }));
        this.virtualHtml.down('div#' + this.applicationId + '_backTop').hide();
    },
    /**
    * @description (OVERWRITTEN to update pending request) Receives the answer from SAP about the firmly book request 
    */
    genericDeleteAnswer: function (answer) {
        if (answer.EWS) {
            if (answer.EWS.o_req_head['@actio'].include('DELIMIT')) {
                this.insertNewNode = true;
                this.backTop();
            } else {
                this.nodeDeleted = answer.EWS.o_req_head;
                this.navigateTo();
                this.nodeDeleted = null;
            }
        }
        //update Pending Request left menu.
        document.fire('EWS:refreshPendingRequest');
    },
    /**
    *@description Stops baCatalogue
    */
    close: function ($super) {
        $super();
        document.stopObserving(this.applicationId + ':action', this.actionClickedBinding);
        //autocompleter views events
        document.stopObserving(this.applicationId + ':viewSelected', this.viewSelectedBinding);
        //adv search
        document.stopObserving('EWS:allEmployeesAdded', this.employeeSelectedAdvSearchBinding);
        document.stopObserving('EWS:' + this.applicationId + '_correctDay', this.datePickerBeg);
    }
});