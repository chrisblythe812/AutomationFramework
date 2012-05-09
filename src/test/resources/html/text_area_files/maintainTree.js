/** 
* @fileOverview maintainTree.js 
* @description File containing class maintainTree. 
* Application for Maintain OM.
*/

/**
*@constructor
*@description Class maintainTree_standard.
*@augments GenericCatalog 
*/
var MaintainTree = Class.create(GenericCatalogV2,
/** 
*@lends maintainTree_standard
*/
    {
    initialService: 'GET_ROOTS_OM',
    getNodeChildrenService: 'GET_CHILD_OM',
    searchedNodeSelectedService: 'GET_PAR_OM',
    nodeClickedService: 'GET_ACTIO_OM',
    searchService: 'GET_SEAR_OM',
    massDelimitService: 'SAVE_MASS_CUT',
    hashOfButtons: $H(),
    hashOfViews: $H(),
    linksLoaded: false,
    viewsLoaded: false,
    comeFromMaintainView: false,
    CheckBoxClicked: true,
    ShowPendingReq: "X",
    typeCheckbox: null,
    idCheckbox: null,
    skipCheck: "",
    periodSelectd: "",
    endda: "",
    //to save the number of the instance of the funcion settimeout
    hashNumberTimeout: new Hash(),
    //the index of the hash for setTimeout
    indexTimeout: 0,
    /**
    *Constructor of the class maintainTree_standard
    */
    initialize: function ($super, args) {
        $super(args, {
            containerParent: 'OM_MGMT',
            containerChild: 'MGMT_OS',
            applicationId: args.className
        });
        this.actionClickedBinding = this.actionClicked.bindAsEventListener(this);
        this.employeeSelectedAdvSearchBinding = this.reloadTree.bindAsEventListener(this);
        //autocompleter views events
        this.viewSelectedBinding = this.viewSelected.bindAsEventListener(this);
        this.typeSelectedBinding = this.typeSelected.bindAsEventListener(this);
        this.periodSelectedBinding = this.periodSelected.bindAsEventListener(this);
        this.employeeSelectedAdvSearchBinding = this.allEmployeesAdded.bindAsEventListener(this);
        this.backTopBinding = this.backTop.bindAsEventListener(this);
        //autocompleter observe OVERWRITTEN from generic Catalog
        this.nodeSearchBinding = this.before_nodeSearch.bindAsEventListener(this);
    },
    /**
    *@description Starts maintainTree_standard
    */
    run: function ($super, args) {
        $super(args);
        if (!this.firstRun) {
            this.comeFromMaintainView = getArgs(args).get('comeFromMaintainView');
            if (this.comeFromMaintainView) {
                this.hashOfViews = getArgs(args).get('hashOfViews');
                if (this.hashOfViews.size() > 0)
                    this.numberOfViews = this.hashOfViews.size();
                this.idArg = getArgs(args).get('idArg');
                if (this.idArg != '') {
                    this.autoCompleterView.setDefaultValue(this.idArg, '', false);
                }
            } else {
                this.idArg = this.hashOfViews.get(0).get('appId') + '/*/' + this.hashOfViews.get(0).get('view');
                this.autoCompleterView.setDefaultValue(this.idArg, '', false);
            }
            //global parameter to refresh the catalog                
            var widScreen = '1';
            var getScreen = this.getScreenToReload_OM(this.options.view, this.applicationId, widScreen);
            if (getScreen) {
                this.backTop();
            }
        }        
        document.observe(this.applicationId + ':action', this.actionClickedBinding);
        document.observe('EWS:allEmployeesAdded', this.employeeSelectedAdvSearchBinding);
        //autocompleter views events   
        document.observe(this.applicationId + ':viewSelected', this.viewSelectedBinding);
        document.observe(this.applicationId + ':typeSelected', this.typeSelectedBinding);
        document.observe(this.applicationId + ':periodSelected', this.periodSelectedBinding);
        //refresh the catalog after position mass reassingment
        document.observe('EWS:refreshCatalog', this.backTopBinding);
    },
    /**     
    *@description This method processes the JSON received from back-end and it builds the structure 
    *@param data {JSON} JSON received from back-end
    */
    handleData: function (data) {
        var structure = $H({});
        if (!Object.isEmpty(data.EWS.o_children))
            var nodes = data.EWS.o_children.yglui_str_parent_children_om;
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
    *@param data {JSON} node context
    *@description It sets the node context on the treeHandler, after receiving it as the respond
    *to the get node parent (context) information service.
    */
    navigateTo: function (type, data, ajaxID) {
        $(this.applicationId + '_level5').update('');
        if (type == "autocompleter" || !Object.isEmpty(type) || this.advSearch) { // to filter the tree            
            this.data = this.handleData(data);
            this.setTreeDiv(ajaxID);
            if (this.advSearch) {
                this.advSearch = false;
            }
        } else {// to insert a node
            this.nodesAux = this.nodes;
            this.data = this.handleData(data);
            var newCurrentJSONs = this.currentJSONs;
            this.NodesAlreadyVisited = this.tree.visitedNodes;
            for (var i = 0; i < this.nodeIsClosed.keys().length; i++) {
                this.NodesAlreadyVisited.unset(this.nodeIsClosed.keys()[i]);
            }
            this.nodeIsClosed = $H({});
            this.setTreeDiv();
            this._reOpenTree(newCurrentJSONs);
            //open the clicked node after creating a new object(OU or position)
            if (this.objectClicked && !this.nodesAux.get(this.objectClicked).isOpen && this.objetClicked_okCode == 'NEW')
                this.nodeChildren(this.objectClicked);
            this.insertNewNode = false;
        }
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
        var extraIcons = $A();
        if (element["@icon_del"]) {
            if (!global.liteVersion) {
                extraIcons.push(this.CLASS_OBJTYPE.get("ID"));
            }
            else {
                extraIcons.push({ cssClass: this.CLASS_OBJTYPE.get("ID"), icon: this.CLASS_OBJTYPE_CODE.get(element['@icon']) });
            }
        }
        if (element["@icon_cre"]) {
            if (!global.liteVersion) {
                extraIcons.push(this.CLASS_OBJTYPE.get("IC"));
            }
            else {
                extraIcons.push({ cssClass: this.CLASS_OBJTYPE.get("IC"), icon: this.CLASS_OBJTYPE_CODE.get(element['@icon']) });
            }
        }
        if (element["@is_from_request"] && this.CheckBoxClicked) {
            if (!global.liteVersion) {
                extraIcons.push(this.CLASS_OBJTYPE.get("PR"));
            } else {
                extraIcons.push({ cssClass: this.CLASS_OBJTYPE.get("PR"), icon: this.CLASS_OBJTYPE_CODE.get(element['@icon']) });
            }
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
    *@description this method creates the toolTip for each row (overwritten)
    */
    createToolTip: function () {
        var nodesArray = this.nodes.toArray();
        var toolTipHash = $H();
        var toolTipHash_extra = $H();
        var extra_text = false;
        for (var i = 0; i < nodesArray.length; i++) {
            var toolTip = new Element("div", {
                'class': 'application_main_soft_text'
            });
            var text = new Element("span");
            var divChildId = this.applicationId + '_level5_linedTreeTxt_' + nodesArray[i].value.id;
            text.insert(global.getLabel("description") + ": " + (nodesArray[i].value.textName));
            toolTip.insert(text);
            toolTipHash.set(nodesArray[i].value.id, { 'element': $(divChildId), 'tooltip': toolTip });
            if (nodesArray[i].value.toolTip) {
                var toolTip_extra = new Element("div", {
                    'class': 'application_main_soft_text'
                });
                var extraText = new Element("span");
                var divChildId_extra = this.applicationId + '_level5_linedTreeTxt_' + nodesArray[i].value.id + "_extraText";
                extraText.insert(nodesArray[i].value.toolTip);
                toolTip_extra.insert(extraText);
                toolTipHash_extra.set(nodesArray[i].value.id, { 'element': $(divChildId_extra), 'tooltip': toolTip_extra });
                extra_text = true;
            }
        }
        this.tooltipsModule = new tooltip({
            'tooltips': toolTipHash
        });
        if (extra_text) {
            this.tooltipsModule = new tooltip({
                'tooltips': toolTipHash_extra
            });
        }
    },
    /**   
    *@param node {object} node to be stored 
    *@description (OVERWRITTEN)This method stores each node in a hash table where it saved all the nodes received
    */
    buildNodesStructure: function (node, parentNewId) {
        var extraText = Object.isEmpty(node["@add_text"]) ? null : node["@add_text"];
        var toolTip = Object.isEmpty(node["@tooltip"]) ? null : node["@tooltip"];
        if (this.nodes.get(node['@otjid'])) {//This is when sometimes we have the same node in several part of the tree.
            var repeated = true;
        }
        if (parentNewId) {
            var parentType = node['@rootty'];
            var parentId = parentNewId.gsub(parentType, '');
            var parentOldId = node['@rootid'];
        } else {
            var parentType = node['@rootty'];
            var parentId = node['@rootid'];
            var parentOldId = null;
        }
        aux = {
            name: node['@stext'],
            id: !repeated ? node['@otjid'] : node['@otjid'] + "R" + +this.random,
            oldId: repeated ? node['@otjid'] : null,
            type: node['@otype'],
            plvar: node['@plvar'],
            children: (node['@parnt'] && (node['@parnt'].toLowerCase() == 'x')) ? 'X' : '',
            parentOldId: parentOldId,
            parent: parentId, //node['@rootid'],
            parentType: parentType, //node['@rootty'],
            select: (Object.isEmpty(node['@select'])) ? "" : node['@select'],
            textName: node['@stext'],
            extraText: extraText,
            toolTip: toolTip,
            checkRoot: node['@select_root'],
            checked: (Object.isEmpty(node['@checked'])) ? null : 'X',
            isOpen: false,
            begda_assi: node['@begda_assi'],
            endda_assi: node['@endda_assi']
        };
        this.nodes.set(aux.id, aux);
    },
    /**     
    *@param args {event} event thrown by the treeHandler when a node name has been clicked.
    *@description (OVERWRITTEN)It gets a node contextual actions from SAP.
    */
    nodeClicked: function (args) {
        if (this.arguments) {
            if (!this.checkBoxes) {
                var params = getArgs(args);
                this.returnJob(params);
            }
        }
        else {
            //If we are in popup mode we won't show the actions ballon (it won't be visible anyway) so we won't call this service
            if (!this.popupMode) {
                var aux = this.nodes.get(getArgs(args)); //.get('nodeName') + '_' + getArgs(args).get('treeName').split('_')[1];
                if (aux.oldId) {
                    var nodeId = aux.oldId;
                } else {
                    var nodeId = aux.id;
                }
                var dateSAP = aux.begda_assi;
                var xml = "<EWS>" +
	                        "<SERVICE>" + this.nodeClickedService + "</SERVICE>" +
	                        "<OBJECT TYPE='" + aux.type + "'>" + nodeId.gsub(aux.type, '') + "</OBJECT>" +
	                        "<DEL></DEL>" +
	                        "<PARAM>" +
	                            "<CONTAINER_PARENT>" + this.containerParent + "</CONTAINER_PARENT>" +
	                            "<CONTAINER_CHILD>" + this.containerChild + "</CONTAINER_CHILD>" +
	                            "<DATE>" + dateSAP + "</DATE>" +
	                        "</PARAM>" +
	                   "</EWS>";
                this.makeAJAXrequest($H({ xml: xml, successMethod: 'showActions', ajaxID: aux }));
            }
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
        this.virtualHtml.update("");
        //It create the Html stucture in differents levels
        var divLevel1 = new Element('div', { 'id': this.applicationId + "_level1", 'class': 'whoiswho_selectorViewMenuDiv' });
        var divLevel2 = new Element('div', { 'id': this.applicationId + "_level2", 'class': 'genCat_level2' });
        var divLevel3 = new Element('div', { 'id': this.applicationId + "_level3", 'class': 'genCat_level3' });
        var divLevel4 = new Element('div', { 'id': this.applicationId + "_level4", 'class': 'genCat_level4' });
        var divBackTop = new Element('div', { 'id': this.applicationId + "_backTop", 'class': 'genCat_backTop' });
        var divCheck = new Element('div', { 'id': this.applicationId + "check_div", 'class': 'fieldDispClearBoth' }).update("&nbsp");
        var divLevel5 = new Element('div', { 'id': this.applicationId + "_level5", 'class': 'genCat_level5 OM_generic_marginCatalog' });
        this.virtualHtml.insert(divLevel1);
        this.virtualHtml.insert(divLevel2);
        this.virtualHtml.insert(divLevel3);
        this.virtualHtml.insert(divLevel4);
        this.virtualHtml.insert(divBackTop);
        this.virtualHtml.insert(divCheck);
        this.virtualHtml.insert(divLevel5);
        //draw div for autocompleter menu in level 1
        var autocompleterView = new Element('div', { 'id': this.applicationId + "_autocompleterView" });
        divLevel1.insert(autocompleterView);
        //draw div for autocompleter Types in level 2
        var autocompleterType = new Element('div', { 'id': 'autocompleterType', 'class': 'OM_Maintain_searchDiv' });
        divLevel2.insert(autocompleterType);
        //draw div for autocompleter in level 2
        var autocompleter = new Element('div', { 'id': this.applicationId + '_autocompleter', 'class': 'genCat_comp OM_Maintain_searchDiv' });
        divLevel2.insert(autocompleter);
        //draw div for Advanced Search in level 2
        this.advancedSearchDiv = new Element('div', { id: this.applicationId + '_advancedSearch', className: 'OM_Maintain_searchDiv' });
        divLevel2.insert(this.advancedSearchDiv);
        //draw div for datePicker in level 2       
        var datePickers = new Element('div', { 'id': this.applicationId + "_datePickerBeg", 'class': 'OM_Maintain_datesDiv' });
        divLevel2.insert(datePickers);
        //draw div for Period selected link
        var periodLinkDiv = new Element('div', { 'id': this.applicationId + "_periodLink", 'class': 'OM_MaintainTree_periodLink' });
        divLevel2.insert(periodLinkDiv);
        //load the views for autocompleter menu
        if (!this.viewsLoaded)
            this.getViewsMenu();
        this.backtoTopLink();
        this.getAutocompleterType();
        this.setAutoCompleter();
        this.setDatePickers();
        if (this.json.EWS.o_cat_buttons && !this.checkBoxes) {
            this.setPeriodLink();
        }
        this.setLegendDiv();
        this.setTreeDiv();
        //draw Checkbox                   
        this.drawCheckbox();
    },
    /**     
    *@description It sets the fifth HTML level (the treeHandler one) (overwritten)
    *@param {selectedByDefault} id of the node
    */
    setTreeDiv: function (selectedByDefault) {
        this.nodes = $H({});
        this.currentJSONs = $A();
        if (this.data.keys().length != 0) {
            this.data.each(function (element) {
                this.currentJSONs.push(this._createNodesStructure(element.value));
                this.buildTreeXml(element.value);
            } .bind(this));
            this.tree = new TreeHandlerV2(this.applicationId + '_level5', this.currentJSONs, { checkBoxes: this.checkBoxes, type: this.type, defaultSelection: selectedByDefault });
            this.createToolTip();
            if ($('checkbox')) {
                $('checkbox').show();
                $('checkboxText').show();
            }
        } else {
            $(this.applicationId + '_level5').insert(global.getLabel("NONODES"));
            $('checkbox').hide();
            $('checkboxText').hide();
        }
    },
    /**     
    *@description It draws the checkbox pending for approval
    */
    drawCheckbox: function () {
        //new checkbox clicked by default
        var check_box = new Element('input', { 'id': 'checkbox', 'class': 'fieldDispFloatRight test_checkBox', 'type': 'checkbox'});
        var label = global.getLabel('SHOW_PND_REQ');
        var span_text = new Element('span', { 'id': 'checkboxText', 'class': 'application_main_text fieldDispFloatRight test_label' }).update(label);
        this.virtualHtml.down('div#' + this.applicationId + 'check_div').insert(span_text);
        this.virtualHtml.down('div#' + this.applicationId + 'check_div').insert(check_box);
        //Observe if check_box is clicked 
        check_box.observe("click", this.checkboxClicked.bindAsEventListener(this));
    },
    /**     
    *@description It calls to SAP when checkbox is clicked
    *@param {Event} event thrown when checkbox is clicked
    */
    checkboxClicked: function (event) {
        //Check if the checkbox is clicked or unclicked        
        var element = event.element();
        if (element.checked) {
            this.CheckBoxClicked = true;
            this.ShowPendingReq = "X";
        }
        //If the user unclick the checkbox 
        else {
            this.CheckBoxClicked = false;
            this.ShowPendingReq = "";
        }
        //it updates the tree with the pending request
        this.updateTreeReqPeriod();
    },
    /**     
    *@description It calls sap to get views
    */
    getViewsMenu: function () {
        //call sap to get views
        var xml = "<EWS>" +
                    "<SERVICE>GET_CAT_VIEWS</SERVICE>" +
                    "<PARAM>" +
                        "<PARENTID>" + this.options.tabId + "</PARENTID>" + //tab
                    "</PARAM>" +
                  "</EWS>";
        this.makeAJAXrequest($H({ xml: xml, successMethod: 'setViewsMenu' }));
    },
    /**     
    *@description It stores info from sap and draws the autocompleter menu
    */
    setViewsMenu: function (json) {
        //save info from sap
        if (json.EWS && json.EWS.o_views && json.EWS.o_views.yglui_str_cat_v) {
            this.hashOfViews = new Hash();
            var records = objectToArray(json.EWS.o_views.yglui_str_cat_v);
            this.numberOfViews = records.size();
            for (var i = 0; i < this.numberOfViews; i++) {
                var dataView = new Hash();
                dataView.set('view', records[i]['@views']);
                dataView.set('appId', records[i]['@appid']);
                dataView.set('label', records[i]['@label_tag']);
                this.hashOfViews.set(i, dataView);
            }
            this.viewsLoaded = true;
            this.idArg = this.hashOfViews.get(0).get('appId') + '/*/' + this.hashOfViews.get(0).get('view');
        }
        //draw autocompleter with the info
        this.setAutocompleterMenu();
    },
    /**     
    *@description It calls sap to get views
    */
    setAutocompleterMenu: function () {
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
        this.autoCompleterView.setDefaultValue(this.idArg, '', false);
    },
    /**     
    *@param args {Event} event thrown by the autoCompleter when a view has been selected
    *@description It reloads the catalog selected
    */
    viewSelected: function (args) {
        this.comeFromMaintainView = true;
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
                    comeFromMaintainView: this.comeFromMaintainView
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
                this.autoCompleter.clearInput();
                //return to first tree
                this.backTop("backtoroot");
            } .bind(this),
            idButton: this.applicationId + "_backTop",
            className: 'application_action_link',
            type: 'link'
        };
        json.elements.push(aux);
        var ButtonBackToTop = new megaButtonDisplayer(json);
        this.virtualHtml.down('div#' + this.applicationId + '_backTop').insert(ButtonBackToTop.getButtons());
        this.virtualHtml.down('div#' + this.applicationId + '_backTop').hide();
    },
    /**     
    *@description It sets the second HTML level (the DatePickers one)
    */
    setDatePickers: function () {
        this.datePickersLabel = new Element('span', { className: 'application_main_title3' });
        var aux = { events: $H({ 'correctDate': 'EWS:' + this.applicationId + '_correctDay' }),
            defaultDate: objectToSap(new Date()).gsub('-', '')
        };
        this.datePickerBeg = new DatePicker(this.applicationId + '_datePickerBeg', aux);
    },
    /**     
    *@description It sets the second HTML level (the Period link one)
    */
    setPeriodLink: function () {
        var json = {
            elements: []
        };
        var aux = {
            label: global.getLabel("PM_DATEPREF"),
            handlerContext: null,
            handler: this.setPeriodPopUp.bind(this),
            idButton: this.applicationId + "_periodButton",
            className: 'application_action_link',
            type: 'link'
        };
        json.elements.push(aux);
        this.ButtonPeriodLink = new megaButtonDisplayer(json);
        this.virtualHtml.down('div#' + this.applicationId + '_periodLink').insert(this.ButtonPeriodLink.getButtons());
    },
    /**     
    *@description It sets the popUp when Period link is clicked
    */
    setPeriodPopUp: function () {
        var popUpDiv = new Element('div', { 'id': 'periodPopUp' });
        this.radioButtonGroup = new Element('div', { 'id': 'radioButtons', 'class': 'genCat_radioButtonsGroup' });
        //It creates structure for radio buttons (and megabutton)in four levels
        var radioButtonDiv1 = new Element('div', { 'class': 'genCat_radioButtonsGroup OM_MaintainTree_popUpButton1Div' });
        var radioButtonDiv2 = new Element('div', { 'id': 'radioButtonDiv2', 'class': 'genCat_radioButtonsGroup OM_MaintainTree_popUpButton1Div' });
        var radioButtonDiv3 = new Element('div', { 'class': 'genCat_radioButtonsGroup OM_MaintainTree_popUpButton1Div' });
        var radioButtonDiv4 = new Element('div', { 'class': 'genCat_radioButtonsGroup OM_MaintainTree_selectButtonPopUpDiv' });
        this.radioButtonGroup.insert(radioButtonDiv1);
        this.radioButtonGroup.insert(radioButtonDiv2);
        this.radioButtonGroup.insert(radioButtonDiv3);
        this.radioButtonGroup.insert(radioButtonDiv4);
        //It creates 3 radio buttons and button divs in 4 levels
        var radioButton1 = new Element('input', { 'class': 'genCat_radioButtonsGroup test_radioButton', 'name': 'gcRadioGroup', 'type': 'radio', 'value': 'single' });
        var radioButton2 = new Element('input', { 'class': 'genCat_radioButtonsGroup test_radioButton', 'name': 'gcRadioGroup', 'type': 'radio', 'value': 'period', 'checked': 'true', 'defaultChecked': 'true' });
        var radioButton3 = new Element('input', { 'class': 'genCat_radioButtonsGroup test_radioButton', 'name': 'gcRadioGroup', 'type': 'radio', 'value': 'until' });
        //It creates the spans containers
        var button1Span = new Element('span', { 'class': 'application_main_text fieldDispFloatLeft OM_MaintainTree_spanPopUp test_text' }).update(global.getLabel('SINGLE_DATE'));
        var button2Span = new Element('span', { 'class': 'application_main_text fieldDispFloatLeft OM_MaintainTree_spanPopUp test_text' }).update(global.getLabel('Period'));
        var button3Span = new Element('span', { 'class': 'application_main_text fieldDispFloatLeft OM_MaintainTree_spanPopUp test_text' }).update(global.getLabel('UNTIL'));
        //It creates input for values
        this.button2Input = new Element('input', { 'class': 'OM_MaintainTree_inputPopUp test_text', 'maxlength': '3', 'value': '1' });
        //It creates div for autocompleter
        var autocompleterDiv = new Element('div', { 'id': 'autocompleterDiv' });
        //It creates div for datePicker
        var datePickerDiv = new Element('div', { 'id': 'datePickerDiv', 'class': 'OM_MaintainTree_datePickerPopUp' });
        //It creates div for megaButton
        var selectButtonDiv = new Element('div', { 'id': 'selectButtonDiv', 'class': 'fieldDispFloatRight' });
        //Insert radio buttons in structure
        radioButtonDiv1.insert(radioButton1);
        radioButtonDiv2.insert(radioButton2);
        radioButtonDiv3.insert(radioButton3);
        //Insert span in the lines
        radioButtonDiv1.insert(button1Span);
        radioButtonDiv2.insert(button2Span);
        radioButtonDiv3.insert(button3Span);
        //Insert input in second line
        radioButtonDiv2.insert(this.button2Input);
        //Insert autocompleter div in second line
        radioButtonDiv2.insert(autocompleterDiv);
        //Insert datePicker div in third line
        radioButtonDiv3.insert(datePickerDiv);
        //insert selectButton in fourth level
        radioButtonDiv4.insert(selectButtonDiv);
        //insert span From Date:
        this.startDatediv = new Element('div', { 'id': 'startdatePickerDiv', 'class': 'OM_MaintainTree_popUpButton1Div' });
        var fromDateSpan = new Element('span', { 'class': 'application_main_text fieldDispFloatLeft OM_MaintainTree_spanPopUp test_text' }).update(global.getLabel('from') + ":");
        //updates Span with actual date
        var dateSpan = new Element('span', { 'class': 'application_main_text fieldDispFloatLeft OM_MaintainTree_spanPopUp test_text' }).update(this.datePickerBeg.actualDate.toString('dd.MM.yyyy'));
        var toDateSpan = new Element('span', { 'class': 'application_main_text fieldDispFloatLeft fieldDispClearBoth OM_MaintainTree_spanPopUp test_text' }).update(global.getLabel('to') + ":");
        this.startDatediv.insert(fromDateSpan);
        this.startDatediv.insert(dateSpan);
        this.startDatediv.insert(toDateSpan);
        popUpDiv.insert(this.startDatediv);
        //insert buttons in div       
        popUpDiv.insert(this.radioButtonGroup);
        //It creates the PopUp
        this.periodPopUp = new infoPopUp({
            closeButton: $H({
                'textContent': 'Close',
                'callBack': function () {
                    this.periodPopUp.close();
                    delete this.periodPopUp;
                } .bind(this)
            }),
            htmlContent: popUpDiv,
            indicatorIcon: '',
            width: 600
        });
        this.periodPopUp.create();
        //It creates a Mask for input that allows only numbers      
        var inputMask = new DigitOnlyFieldMask(this.button2Input);
        //It creates autocompleter
        var obj = [];
        obj.push({ text: global.getLabel('Days'), data: 'D' });
        obj.push({ text: global.getLabel('Weeks'), data: 'W' });
        obj.push({ text: global.getLabel('Months'), data: 'M' });
        obj.push({ text: global.getLabel('Years'), data: 'Y' });

        var json = {
            autocompleter: {
                object: obj,
                multilanguage: {
                    no_results: global.getLabel('noresults'),
                    search: global.getLabel('search')
                }
            }
        };
        this.autoCompleterDate = new JSONAutocompleter('autocompleterDiv', {
            events: $H({ onResultSelected: this.applicationId + ':periodSelected' }),
            showEverythingOnButtonClick: true,
            noFilter: true,
            timeout: 0,
            templateOptionsList: '#{text}',
            templateResult: '#{text}',
            maxShown: 20,
            minChars: 1
        }, json);
        this.defaultType = obj[2].text;
        this.autoCompleterDate.setDefaultValue(this.defaultType, true);
        //It creates the datePicker        
        var aux = { events: $H({}),
            defaultDate: objectToSap(this.datePickerBeg.getActualDate().gsub('-', '')),
            fromDate: objectToSap(this.datePickerBeg.getActualDate().gsub('-', ''))
        };
        this.datePickerPopUp = new DatePicker('datePickerDiv', aux);
        //It creates the Select Button
        var json = {
            elements: []
        };
        var aux = {
            label: global.getLabel("Select"),
            handlerContext: null,
            handler: this.setSelectButtonClicked.bind(this),
            idButton: this.applicationId + "_selectButton",
            type: 'button'
        };
        json.elements.push(aux);
        var ButtonSelect = new megaButtonDisplayer(json);
        selectButtonDiv.insert(ButtonSelect.getButtons());
    },
    /**     
    *@description Event thrown by the autocompleter type when a period has been selected.
    */
    periodSelected: function (args) {
        if (!getArgs(args).isEmpty) {
            var idArg = getArgs(args).idAdded ? getArgs(args).idAdded : getArgs(args).get('idAdded');
            this.periodSelectd = idArg;
        }
    },
    /**     
    *@description Called when select button has been clicked in the PopUp, it checks radioButtos value
    */
    setSelectButtonClicked: function () {
        //It checks witch radio Button is clicked
        this.radioButtonGroup.childElements().each(function (radioButton) {
            if (radioButton.down().checked)
                objectTypeSearch = radioButton.down().value;
        } .bind(this));
        var singleDateChecked = "";
        var periodChecked = "";
        var untilChecked = "";
        var dateBeg = "";
        var dateEnd = "";
        dateBeg = dateEnd = this.datePickerBeg.getActualDate();
        //It sets endda depending of the period selected
        if (objectTypeSearch == 'single') {
            dateBeg = dateEnd = this.datePickerBeg.getActualDate();
            this.endda = "";
            this.ButtonPeriodLink.updateLabel(this.applicationId + "_periodButton", global.getLabel("PM_DATEPREF"));
        } else if (objectTypeSearch == 'period') {
            if (this.periodSelectd && this.button2Input.value) {
                dateBeg = this.datePickerBeg.getActualDate();
                this.endda = dateEnd = this.setCalculateDate(this.button2Input.value, this.periodSelectd);
                //It updates the link Period Selected
                var label = "";
                switch (this.periodSelectd) {
                    case 'D': label = global.getLabel('Days');
                        break;
                    case 'W': label = global.getLabel('Weeks');
                        break;
                    case 'M': label = global.getLabel('Months');
                        break;
                    case 'Y': label = global.getLabel('Years');
                        break;
                }
                this.ButtonPeriodLink.updateLabel(this.applicationId + "_periodButton", "+ " + this.button2Input.value + " " + label);
            }
        } else {
            dateBeg = this.datePickerBeg.getActualDate();
            this.endda = dateEnd = this.datePickerPopUp.getActualDate();
            var dateEndLabel = this.datePickerPopUp.actualDate.toString('dd.MM.yyyy')
            //It updates the link Period Selected
            if (dateBeg < dateEnd) {
                this.ButtonPeriodLink.updateLabel(this.applicationId + "_periodButton", global.getLabel('Until') + " " + dateEndLabel);
            }
            else if (dateBeg == dateEnd) {
                this.ButtonPeriodLink.updateLabel(this.applicationId + "_periodButton", global.getLabel("PM_DATEPREF"));
            }
        }
        if (dateBeg <= dateEnd) {
            this.periodPopUp.close();
            delete this.periodPopUp;
            this.updateTreeReqPeriod();
        }
    },
    /**     
    *@description It updates the tree with the period selected / pending request
    */
    updateTreeReqPeriod: function () {
        //id of node on top        
        var typeIdTop = this.currentJSONs[0].id;
        //take into account if the element selected is a root or not            
        this.rootSelected = false;
        for (var i = 0; i < this.numberOfRoots; i++) {
            if (typeIdTop == this.hashOfRoots.get(i)) {
                this.rootSelected = true;
            }
        }
        //call to sap with different service depending of element selected              
        if (!this.rootSelected) {
            //we take these values from autocompleter or adv search
            var id = this.idCheckbox;
            var type = this.typeCheckbox;
            if (this.periodSelectd) {
                this.endda = (this.endda != "") ? this.endda : objectToSap(new Date());
            }
            else
                this.endda = objectToSap(this.datePickerBeg.getActualDate());
            var begda = objectToSap(this.datePickerBeg.getActualDate());
            if (this.endda < begda) {
                this.endda = begda;
                if (this.ButtonPeriodLink)
                    this.ButtonPeriodLink.updateLabel(this.applicationId + "_periodButton", global.getLabel("PM_DATEPREF"));
            }
            var xml = "<EWS>" +
						            "<SERVICE>" + this.searchedNodeSelectedService + "</SERVICE>" +
						            "<OBJECT TYPE='" + type + "'>" + id + "</OBJECT>" +
						            "<DEL></DEL>" +
						            "<PARAM>" +
							            "<CONTAINER_PARENT>" + this.containerParent + "</CONTAINER_PARENT>" +
							            "<CONTAINER_CHILD>" + this.containerChild + "</CONTAINER_CHILD>" +
							            "<DATUM>" + objectToSap(this.datePickerBeg.getActualDate()) + "</DATUM>" +
                                         "<ENDDA>" + this.endda + "</ENDDA>" +
                                        "<SHOW_PENDING_REQ>" + this.ShowPendingReq + "</SHOW_PENDING_REQ>" +
						            "</PARAM>" +
				               "</EWS>";
            this.makeAJAXrequest($H({
                xml: xml,
                successMethod: this.navigateTo.bind(this, null),
                ajaxID: id
            }));
        } else {
            this.backTop();
        }
    },
    /**     
    *@description It calculates the Date with the period to add
    */
    setCalculateDate: function (input, period) {
        var date = new Date(this.datePickerBeg.actualDate);
        switch (period) {
            case 'D': date.addDays(parseInt(input));
                break;
            case 'W': date.addWeeks(parseInt(input));
                break;
            case 'M': date.addMonths(parseInt(input));
                break;
            case 'Y': date.addYears(parseInt(input));
                break;
        }
        return date.toString('yyyy-MM-dd');
    },
    /**     
    *@description It gets the info from SAP (the autoCompleter type one)
    */
    getAutocompleterType: function () {
        var xml = "<EWS>" +
                    "<SERVICE>GET_OBJ_SELECT</SERVICE>" +
                    "<PARAM>" +
                        "<CONTAINER_PARENT>OM_MGMT</CONTAINER_PARENT>" +
                        "<CONTAINER_CHILD>MGMT_OS</CONTAINER_CHILD>" +
                    "</PARAM>" +
                    "<DEL/>" +
                    "</EWS>";
        this.makeAJAXrequest($H({ xml: xml, successMethod: 'setAutocompleterType' }));
    },
    /**     
    *@description It set the autoCompleter type  
    */
    setAutocompleterType: function (json) {
        if (json.EWS && json.EWS.o_list && json.EWS.o_list.yglui_str_obj_select) {
            this.hashOfRecords = new Hash();
            var records = objectToArray(json.EWS.o_list.yglui_str_obj_select);
            this.numberOfRecords = records.size();
            for (var i = 0; i < this.numberOfRecords; i++) {
                var dataView = new Hash();
                dataView.set('text', records[i]['#text']);
                dataView.set('type', records[i]['@otypes']);
                this.hashOfRecords.set(i, dataView);
            }
        }
        if (this.numberOfRecords > 0) {
            //read values to fill autocompleter list from hash
            var text, id, obj = [];
            for (var i = 0; i < this.numberOfRecords; i++) {
                data = this.hashOfRecords.get(i).get('type');
                text = this.hashOfRecords.get(i).get('text');
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
        this.autoCompleterType = new JSONAutocompleter('autocompleterType', {
            events: $H({ onResultSelected: this.applicationId + ':typeSelected' }),
            showEverythingOnButtonClick: true,
            noFilter: true,
            timeout: 0,
            templateOptionsList: '#{text}',
            templateResult: '#{text}',
            maxShown: 20,
            minChars: 1
        }, json);
        this.defaultType = obj[0].text;
        this.autoCompleterType.setDefaultValue(this.defaultType, true);
    },
    /**     
    *@description Event thrown by the autocompleter type when a result has been selected.
    */
    typeSelected: function (args) {
        if (!getArgs(args).isEmpty) {
            var idArg = getArgs(args).idAdded ? getArgs(args).idAdded : getArgs(args).get('idAdded');
            this.defaultType = idArg;
        }
    },
    /**     
    *@description It sets the second HTML level (the autoCompleter one)
    */
    setAutoCompleter: function () {
        this.autoCompleterLabel = new Element('span', { className: 'application_main_title3 test_label' });
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
        //Advanced Search        
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
        json.elements.push(advSearchIcon);
        var Buttons = new megaButtonDisplayer(json);
        var advancedSearchButton = new Element("div").insert(Buttons.getButtons());
        var advancedSearchLinks = new Element("div", { "id": "advSearchLinks", "class": "OM_Maintain_advsSearchLinks" });
        this.advancedSearchDiv.insert(advancedSearchButton);
        $(this.applicationId + "_level3").insert(advancedSearchLinks);
        this.virtualHtml.down('div#advSearchLinks').hide();
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
                    className: 'getContentLinks application_action_link',
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
    *@param args {Event} event thrown by the Adv Search when a object has been selected     
    *@description Advanced Search employee selected.
    */
    allEmployeesAdded: function (args) {
        if (!getArgs(args).isEmpty) {
            if (getArgs(args).employeesAdded || getArgs(args).get('employeesAdded')) {
                var idArg = getArgs(args).employeesAdded ? getArgs(args).employeesAdded : getArgs(args).get('employeesAdded');
                idArg.keys().each(function (employee) {
                    var result = idArg.get(employee);
                    objId = employee;
                    objType = result.type;
                });
                //hide the adv search links
                this.virtualHtml.down('div#advSearchLinks').hide();
                //draws the chart with the object selected in adv search
                this.nodeSelected({ idAdded: objType + '' + objId + '_' + objType });
            }
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
    *@description It sets the fourth HTML level  (the Legend one)
    */
    setLegendDiv: function () {
        if (this.json.EWS.labels) {
            var aux = new Object();
            var text = '';
            aux.legend = [];
            aux.showLabel = global.getLabel('showLgnd');
            aux.hideLabel = global.getLabel('closeLgnd');
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
            this.virtualHtml.down('div#' + this.applicationId + '_level4').update(getLegend(aux));
            this.legend = this.virtualHtml.down('div#' + this.applicationId + '_level4');
        }
    },
    /**     
    *@description It executes the code that belongs to the action clicked 
    */
    actionClicked: function (parameters) {
        var name = getArgs(parameters).get('name');
        var nodeType = getArgs(parameters).get('nodeType');
        var nodeId = getArgs(parameters).get('nodeId');
        var nodeName = getArgs(parameters).get('nodeName');
        var nextApp = getArgs(parameters).get('application');
        var okCode = getArgs(parameters).get('okCode');
        var mode = getArgs(parameters).get('mode');
        var view = getArgs(parameters).get('view');
        var date = (this.datePickerBeg).getActualDate().toString('yyyy-MM-dd');
        this.objectClicked = nodeType + nodeId;
        this.objetClicked_okCode = (okCode) ? okCode : '';
        switch (name) {
            case 'OM_MASS_TRANSL': // mass translation
                global.open($H({
                    app: {
                        appId: nextApp,
                        tabId: this.options.tabId,
                        view: view
                    },
                    objectId: nodeId,
                    mode: mode
                }));
                balloon.hide();
                break;
            case 'OM_ORG_CREATE': // create an org unit
                global.open($H({
                    app: {
                        appId: nextApp,
                        tabId: this.options.tabId,
                        view: view
                    },
                    objectId: nodeId,
                    parentType: nodeType,
                    oType: 'O',
                    displayMode: 'create',
                    okCode: okCode,
                    mode: mode
                }));
                balloon.hide();
                break;
            case 'OM_ORG_DEL': // delete an org unit
                this.deleteObject(nodeType, nodeId, name, '', global.getLabel('deleteObj'), okCode, nodeName, nextApp);
                balloon.hide();
                break;
            case 'OM_ORG_DELIMIT': // delimit an org unit
                this.delimitObject(nodeType, nodeId, name, '', global.getLabel('delimitObj'), okCode, nodeName, nextApp);
                balloon.hide();
                break;
            case 'OM_ORG_DISPLAY': // view org unit details
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
            case 'OM_ORG_EDIT': // edit an org unit
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
                    begda: date,
                    name: nodeName
                }));
                balloon.hide();
                break;
            case 'OM_CHANGE_ASS_O': // change assign
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
            case 'OM_ASSIGN_HOLDER': // assign holder
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
                    displayMode: 'create',
                    okCode: okCode,
                    mode: mode
                }));
                balloon.hide();
                break;
            case 'OM_ASSIGN_SUCC': // assign succesor
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
                    mode: mode
                }));
                balloon.hide();
                break;
            case 'OM_CHANGE_ASSIGN': // change assign
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
            case 'OM_POS_CREATE': // create position
                global.open($H({
                    app: {
                        appId: nextApp,
                        tabId: this.options.tabId,
                        view: view
                    },
                    objectId: nodeId,
                    parentType: nodeType,
                    oType: 'S',
                    displayMode: 'create',
                    okCode: okCode,
                    mode: mode
                }));
                balloon.hide();
                break;
            case 'OM_POS_DEL': // delete a position
                this.deleteObject(nodeType, nodeId, name, '', global.getLabel('deleteObj'), okCode, nodeName, nextApp);
                balloon.hide();
                break;
            case 'OM_POS_DELIMIT': // delimit a position
                this.delimitObject(nodeType, nodeId, name, '', global.getLabel('delimitObj'), okCode, nodeName, nextApp);
                balloon.hide();
                break;
            case 'OM_POS_DISPLAY': // view position details
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
                    begda: date,
                    name: nodeName
                }));
                balloon.hide();
                break;
            case 'OM_MGMT_ASSIGN': // manage holder assign
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
            case 'OM_COSTC_ASS_O': // Cost center assignment
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
                    begda: date,
                    catalogAppId: this.applicationId,
                    catalogView: this.appName
                }));
                balloon.hide();
                break;
            case 'OM_MASS_S_REASSIGN': // Position mass reassignment
                global.open($H({
                    app: {
                        appId: nextApp,
                        tabId: 'POPUP',
                        view: view
                    },
                    multiple: true,
                    reloadCatalog: true,
                    objectId: nodeId,
                    oType: nodeType
                }));
                balloon.hide();
                break;
            default:
                global.open($H({
                    app: {
                        appId: nextApp,
                        tabId: this.options.tabId,
                        view: view
                    },
                    objectId: nodeId,
                    oType: nodeType
                }));
                balloon.hide();
                break;
        }
    },
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
                _this.massDelimitObjectRequest(oType, objectId, actionId, appName, code, nextApp);
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
    * @description Builds the xml and send it to SAP to delimit an object
    */
    massDelimitObjectRequest: function (oType, objectId, actionId, appName, code, nextApp) {
        var begDay = this.datePickerBeg.getDateAsArray().day;
        var begMonth = this.datePickerBeg.getDateAsArray().month;
        var begYear = this.datePickerBeg.getDateAsArray().year;
        if (begDay.length == 1)
            begDay = '0' + begDay;
        if (begMonth.length == 1)
            begMonth = '0' + begMonth;
        var xml = "<EWS>"
                    + "<SERVICE>" + this.massDelimitService + "</SERVICE>"
                    + "<OBJECT TYPE=\"" + oType + "\">" + objectId.gsub(oType, '') + "</OBJECT>"
                    + "<PARAM>"
                        + "<REQ_ID></REQ_ID>"
                        + "<APPID>" + nextApp + "</APPID>"
                        + "<KEYDATE>" + begYear + '-' + begMonth + '-' + begDay + "</KEYDATE>"
                        + "<UPD_DATE>" + objectToSap(this.delimitObjectDatePicker.getActualDate()) + "</UPD_DATE>"
                        + "<BUTTON ACTION=\"" + actionId + "\" OKCODE=\"" + code + "\" />"
                        + "<SKIP_CHECK>" + this.skipCheck + "</SKIP_CHECK>"
                    + "</PARAM>"
                 + "</EWS>";
        this.makeAJAXrequest($H({ xml: xml, successMethod: this.massDelimitAnswer.bind(this, oType, objectId, actionId, appName, code, nextApp) }));
        this.skipCheck = '';
    },
    /**
    * @description Receives the answer from SAP
    */
    massDelimitAnswer: function (oType, objectId, actionId, appName, code, nextApp, answer) {
        if (answer.EWS) {
            if (answer.EWS.o_confirmation == 'X') {
                //showing second pop up to ask confirmation
                this.skipCheck = 'X';
                this.delimitObjectConfirmation(oType, objectId, actionId, appName, code, nextApp);
            } else {
                if (answer.EWS.o_req_head['@actio'].include('DELIMIT')) {
                    this.insertNewNode = true;
                }
                this.backTop();
                //update Pending Request left menu.
                document.fire('EWS:refreshPendingRequest');
            }
        }
    },
    /**
    * @description Method that shows a poop up with a confirmation to remove the object
    */
    delimitObjectConfirmation: function (oType, objectId, actionId, appName, code, nextApp) {
        var messageFrom;
        var genericDeleteHtml = "<div>" +
                                    "<div><span>" + global.getLabel('del_mass_cut') + "</span></div>" +
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
            if (_this) {
                _this.massDelimitObjectRequest(oType, objectId, actionId, appName, code, nextApp);
            }
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
    *@param args {Event} event thrown by the autoCompleter when a node has been selected from 
    *its search results list.
    *@description It gets a node context (parent and siblings) from SAP.
    */
    nodeSelected: function (args) {
        if (!getArgs(args).isEmpty) {
            if (getArgs(args).idAdded || getArgs(args).get('idAdded')) {
                var idArg = getArgs(args).idAdded ? getArgs(args).idAdded : getArgs(args).get('idAdded');
                if (!Object.isEmpty(idArg)) {
                    var id = idArg.split('_')[0]
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
                        id = id.gsub(type, "");
                        //we add this variables for using when checkbox clicked to have the node selected
                        this.idCheckbox = id;
                        this.typeCheckbox = type;
                        this.endda = (this.endda) ? this.endda : objectToSap(this.datePickerBeg.getActualDate());
                        var xml = "<EWS>" +
						            "<SERVICE>" + this.searchedNodeSelectedService + "</SERVICE>" +
						            "<OBJECT TYPE='" + type + "'>" + id + "</OBJECT>" +
						            "<DEL></DEL>" +
						            "<PARAM>" +
							            "<CONTAINER_PARENT>" + this.containerParent + "</CONTAINER_PARENT>" +
							            "<CONTAINER_CHILD>" + this.containerChild + "</CONTAINER_CHILD>" +
							            "<DATUM>" + objectToSap(this.datePickerBeg.getActualDate()) + "</DATUM>" +
                                         "<ENDDA>" + this.endda + "</ENDDA>" +
                                        "<SHOW_PENDING_REQ>" + this.ShowPendingReq + "</SHOW_PENDING_REQ>" +
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
                                successMethod: this.navigateTo.bind(this, "autocompleter"),
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
    *@param args {Event} event thrown by the treeHandler when a node arrow has been clicked
    *@description It gets a node the list of children. (overwritten)
    */
    nodeChildren: function (args) {
        var aux = this.nodes.get(getArgs(args));
        if (aux.oldId) {
            var id = aux.oldId.gsub(aux.type, '');
        } else {
            var id = aux.id.gsub(aux.type, '');
        }
        this.endda = (this.endda) ? this.endda : objectToSap(this.datePickerBeg.getActualDate());
        var xml = "<EWS>" +
						"<SERVICE>" + this.getNodeChildrenService + "</SERVICE>" +
						"<OBJECT TYPE='" + aux.type + "'>" + id + "</OBJECT>" +
						"<DEL></DEL>" +
						"<PARAM>" +
							"<CONTAINER_PARENT>" + this.containerParent + "</CONTAINER_PARENT>" +
							"<CONTAINER_CHILD>" + this.containerChild + "</CONTAINER_CHILD>" +
							"<DATUM>" + objectToSap(this.datePickerBeg.getActualDate()) + "</DATUM>" +
						     "<ENDDA>" + this.endda + "</ENDDA>" +
                            "<SHOW_PENDING_REQ>" + this.ShowPendingReq + "</SHOW_PENDING_REQ>" +
                        "</PARAM>" +
				   "</EWS>";
        this.makeAJAXrequest($H({ xml: xml, successMethod: 'expandNode', ajaxID: aux.id }));

    },
    /**     
    *@param id (string) node id, which has to be opened
    *@param children (array)nodes array. These nodes are children of the node  which has to be opened
    *@description It gets a node the list of children.
    */
    _reCallNodeChildren: function (id, children) {
        var aux = this.nodesAux.get(id);
        var id = aux.id.gsub(aux.type, '');
        this.endda = (this.endda) ? this.endda : objectToSap(this.datePickerBeg.getActualDate());
        var xml = "<EWS>" +
						"<SERVICE>" + this.getNodeChildrenService + "</SERVICE>" +
						"<OBJECT TYPE='" + aux.type + "'>" + id + "</OBJECT>" +
						"<DEL></DEL>" +
						"<PARAM>" +
							"<CONTAINER_PARENT>" + this.containerParent + "</CONTAINER_PARENT>" +
							"<CONTAINER_CHILD>" + this.containerChild + "</CONTAINER_CHILD>" +
							"<DATUM>" + objectToSap(this.datePickerBeg.getActualDate()) + "</DATUM>" +
                             "<ENDDA>" + this.endda + "</ENDDA>" +
                            "<SHOW_PENDING_REQ>" + this.ShowPendingReq + "</SHOW_PENDING_REQ>" +
						"</PARAM>" +
				   "</EWS>";
        this.makeAJAXrequest($H({ xml: xml, successMethod: this._reCalledNodes.bind(this, aux.id, children) }));
    },
    /**     
    *@description Initial service which gets the labels and root node context to be shown
    *on the treeHandler. (overwritten)
    */
    getInitialData: function () {
        this.endda = (this.endda != "") ? this.endda : objectToSap(new Date());
        var begda = objectToSap(new Date());
        if (this.endda < begda) {
            this.endda = begda;
            if (this.ButtonPeriodLink)
                this.ButtonPeriodLink.updateLabel(this.applicationId + "_periodButton", global.getLabel("PM_DATEPREF"));
        }
        var xml = "<EWS>" +
						"<SERVICE>" + this.initialService + "</SERVICE>" +
						"<OBJECT TYPE='" + global.objectType + "'>" + global.objectId + "</OBJECT>" +
						"<PARAM>" +
							"<CONTAINER_PARENT>" + this.containerParent + "</CONTAINER_PARENT>" +
							"<CONTAINER_CHILD>" + this.containerChild + "</CONTAINER_CHILD>" +
							"<DATUM>" + begda + "</DATUM>" +
                             "<ENDDA>" + this.endda + "</ENDDA>" +
                            "<SHOW_PENDING_REQ>" + this.ShowPendingReq + "</SHOW_PENDING_REQ>" +
						"</PARAM>" +
				   "</EWS>";
        this.makeAJAXrequest($H({ xml: xml, successMethod: this.setHTML.bind(this) }));
    },
    /**     
    *@description It calls SAP to get initial info (overwritten)
    */
    backTop: function (type, id) {
        if (this.periodSelectd) {
            this.endda = (this.endda != "") ? this.endda : objectToSap(new Date());
        }
        else
            this.endda = objectToSap(this.datePickerBeg.getActualDate());
        var begda = objectToSap(this.datePickerBeg.getActualDate());
        if (this.endda < begda) {
            this.endda = begda;
            if (this.ButtonPeriodLink)
                this.ButtonPeriodLink.updateLabel(this.applicationId + "_periodButton", global.getLabel("PM_DATEPREF"));
        }
        var xml = "<EWS>" +
						"<SERVICE>" + this.initialService + "</SERVICE>" +
						"<OBJECT TYPE='" + global.objectType + "'>" + global.objectId + "</OBJECT>" +
						"<PARAM>" +
							"<CONTAINER_PARENT>" + this.containerParent + "</CONTAINER_PARENT>" +
							"<CONTAINER_CHILD>" + this.containerChild + "</CONTAINER_CHILD>" +
							"<DATUM>" + begda + "</DATUM>" +
						    "<ENDDA>" + this.endda + "</ENDDA>" +
                            "<SHOW_PENDING_REQ>" + this.ShowPendingReq + "</SHOW_PENDING_REQ>" +
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
            }
            this.backTop();
        }
        //update Pending Request left menu.
        document.fire('EWS:refreshPendingRequest');
    },
    /**     
    *@param results {JSON} search service results list
    *@description (OVERWRITTEN to show "id" in tooltip, not "id_type")It fills the autocompleter with the search service results list.
    */
    showList: function (results) {
        //this.autoCompleter.stopLoading();
        var json = {
            autocompleter: {
                object: [],
                multilanguage: {
                    no_results: global.getLabel('noresults'),
                    search: global.getLabel('search')
                }
            }
        };
        if (results && results.EWS && results.EWS.o_objects && results.EWS.o_objects.yglui_str_parent_children) {
            objectToArray(results.EWS.o_objects.yglui_str_parent_children).each(function (node) {
                json.autocompleter.object.push({ text: node['@stext'], data: node['@otjid'] + '_' + node['@otype'], title: node['@stext'] + ' [' + node['@objid'] + ']', icon: this.CLASS_OBJTYPE.get(node['@otype']) });
            } .bind(this));
        }
        this.autoCompleter.updateInput(json);
        //reset variables for setTimeout function (before_nodeSearch)
        this.indexTimeout = 0;
        delete this.hashNumberTimeout;
        //A new search can be made, as the last one has already finished
        this.makeCall = true;        
    },
    /**     
    *@param args {Event} event thrown by the autoCompleter object when a node search has to be
    *performanced.
    *@description It gets a search node results list from the back-end. 
    * Wait until user stop typing characters in autocompleter, to send the full text
    */
    before_nodeSearch: function (args) {
        //it cancel the setTimeout that it´s stored in the hash and was launched before the actual one
        if (this.indexTimeout >= 1) {
            var p = this.hashNumberTimeout.get(this.indexTimeout - 1)
            clearTimeout(p);
        }
        var _this = this;
        //it launch the event with a delay (all will be cancelled before launch except the last one)
        var t = setTimeout(function () { _this.nodeSearch(args) }, 1200);
        this.hashNumberTimeout.set(this.indexTimeout, t);
        this.indexTimeout++;
    },
    /**     
    *@param args {Event} event thrown by the autoCompleter object when a node search has to be
    *performanced.
    *@description It gets a search node results list from the back-end (OVERWRITTEN).
    */
    nodeSearch: function (args) {
        //if we need to make one more call after the currently running call, then we save
        //the arguments in a variable for the future call
        if (!Object.isEmpty(this.oneMoreCall) && this.makeCall)
            this.oneMoreCall = null;
        else
            this.oneMoreCall = args;
        if (this.makeCall) {
            this.makeCall = false;
            if (getArgs(args).idAutocompleter == this.applicationId + '_autocompleter') {
                var objectTypeSearch = '';
                //this.autoCompleter.loading();
                var autoCompText = this.autoCompleter.element.getValue();
                autoCompText = ((autoCompText.split(global.idSeparatorLeft))[0].split('['))[0].strip();
                autoCompTextToSend = prepareTextToSend(autoCompText);
                this.endda = (this.endda) ? this.endda : objectToSap(this.datePickerBeg.getActualDate());
                var xml = "<EWS>" +
						        "<SERVICE>" + this.searchService + "</SERVICE>" +
						        "<DEL></DEL>" +
						        "<PARAM>" +
							        "<CONTAINER_PARENT>" + this.containerParent + "</CONTAINER_PARENT>" +
							        "<CONTAINER_CHILD>" + this.containerChild + "</CONTAINER_CHILD>" +
							        "<PATTERN>" + autoCompTextToSend + "</PATTERN>" +
                                    "<OBJECT_LIST>" + this.defaultType + "</OBJECT_LIST>" +
							        "<OBJECTTYPE>" + objectTypeSearch + "</OBJECTTYPE>" +
							        "<DATUM>" + objectToSap(this.datePickerBeg.getActualDate()) + "</DATUM>" +
                                    "<ENDDA>" + this.endda + "</ENDDA>" +
						        "</PARAM>" +
				          "</EWS>";
                this.makeAJAXrequest($H({ xml: xml, successMethod: 'showList' }));
            }
        }
    },
    /**
    * Checks if the Catalog has to be reloaded for the selected object
    * @param {Object} view
    * @param {Object} appid
    * @param {Object} screen    
    */
    getScreenToReload_OM: function (view, appid, screen) {
        var refreshObjectsKeys = global.refreshObjects.keys();
        var refreshObjects_size = refreshObjectsKeys.size();
        //screen key
        var screenKey = view + "_" + appid + "_" + screen;
        var object, found = false;
        for (var i = 0; i < refreshObjects_size; i++) {
            object = global.refreshObjects.get(refreshObjectsKeys[i]);
            //if the object has the screen key
            if (!Object.isEmpty(object.get(screenKey))) {
                found = true;
                global.refreshObjects.get(refreshObjectsKeys[i]).unset(screenKey);
            }
        }
        return found;
    },
    /**
    *@description Stops maintainTree_standard
    */
    close: function ($super) {
        $super();
        document.stopObserving(this.applicationId + ':action', this.actionClickedBinding);
        document.stopObserving('EWS:allEmployeesAdded', this.employeeSelectedAdvSearchBinding);
        //autocompleter views events
        document.stopObserving(this.applicationId + ':viewSelected', this.viewSelectedBinding);
        document.stopObserving('EWS:' + this.applicationId + '_correctDay', this.datePickerBeg);
        document.stopObserving(this.applicationId + ':typeSelected', this.typeSelectedBinding);
        document.stopObserving(this.applicationId + ':periodSelected', this.periodSelectedBinding);
        document.stopObserving('EWS:refreshCatalog', this.backTopBinding);
    }
});