/**
 *@fileOverview GenericCatalogV2.js
 *@description This file contains the Generic EWS Catalog class.
 */

/**
 *@constructor
 *@description The Generic Catalogue class has been implemented to be the rest of the EWS catalogue<br/>
 *oriented classes parent class. So it provides any class that inherits from it with a common structure<br/>
 *and behaviour catalogue oriented, easily adaptable by extending or overwriting its attributes/methods.<br/><br/>
 *
 *To inherit from GenericCatalogV2 you should build your class as a normal application, but instead of<br/>
 *the Application class setting the GenericCatalogV2 class as the one to inherit from, and add the<br/>
 *configuration hash to the $super constructor with the information that is needed.<br/><br/>
 *
 *Attributes to take into account when a developer wants to make his class inherit from GenericCatalogV2:<br/><br/>
 *
 *		- containerParent --> parent Catalogue container Id<br/>
 *      - containerChild  --> child Catalogue container Id<br/><br/>
 *      
 *      These two fields above are the way to specify from which concrete catalogue type you are<br/>
 *      requesting SAP (i mean, these fields will be sent in any catalogue AJAX request).<br/><br/>
 *      
 *		- initialService              --> labels and root node service name<br/>
 *	    - getNodeChildrenService      --> get node children service name<br/>
 *	    - searchService               --> search node service name<br/>
 *	    - searchedNodeSelectedService --> get parent and siblings nodes (get node context) service name<br/>
 *	    - nodeClickedService          --> get node actions service name<br/><br/>
 *		
 *		All the class attributes listed above has to be passed as a $super() parameter using a JSON object format like this:<br/><br/>
 *      
 *      {<br/>
 *   			containerParent:'LRN_CAT',<br/>
 *			    containerChild:'TM_L_CTD',<br/>
 *			    initialService:'GET_CAT_ROOTS',<br/>
 *			    getNodeChildrenService:'GET_CAT_CHILD',<br/>
 *			    searchService:'GET_CAT_SEAR',<br/>
 *			    searchedNodeSelectedService:'GET_CAT_PAR',<br/>
 *			    nodeClickedService:'GET_CAT_ACTIO',<br/>
 *			    applicationId:'CATL'<br/>
                popupMode:false<br/>
 *		}<br/><br/>
 *		
 *      Finally, this class has 5 kinds of methods:<br/><br/>
 *      
 *      - initialize(), run() and close() like every normal application.<br/>
 *      - BUILDING HTML SECTION --> methods to build the initial HTML screen after the <br/>
 *        first service has been called. Each of them you should modify if is needed, to<br/>
 *        show a different application screen appearance:<br/><br/>
 *        
 *               | setHTML()<br/>
 *               | setTitleDiv()<br/>
 *				 | setAutoCompleterDiv()<br/>
 *				 | setDatePickersDiv()<br/>
 *				 | setLegendDiv()<br/>
 *				 | setTreeDiv()<br/><br/>
 *        		
 *      - UPDATING HTML --> methods to update the main application labels text:<br/><br/>
 *      
 *               | setTitle()<br/>
 *               | setAutoCompleterLabel()<br/>
 *				 | setDatePickersLabel()<br/>
 *				 | setLegend()<br/><br/>
 *      
 *      
 *      - UPDATING MODULES HTML --> methods to update modules when an action <br/>
 *        is performanced due to the respond from SAP to a requested service (so these<br/>
 *        methods are normally successMethods for the makeAJAXrequest method):<br/><br/>
 *      
 *               
 *				 | showList()           --> to fill the Autocompleter results list after a node search<br/>
 *				 | navigateTo()         --> to set a node context on the tree after selecting it on the autoCompleter results list<br/>
 *				 | expandNode()         --> to show a node children after click on its related treeHandler arrow<br/>
 *				 | showActions()        --> to show Balloon filled with a node related contextual actions after<br/>
 *                 its name has been clicked on the treeHandler.<br/><br/>
 *
 *		  So modifying these methods you can modify your catalogue behaviour related<br/>
 *        to how it handles date got from the back-end. <br/><br/>
 *      
 *      
 *      - LOGIC TOOLS --> methods to handle application logic, like turn information got<br/>
 *        from the back-end into more comfortable javascript structures:<br/><br/>
 *        
 *               | buildTreeXml()<br/><br/>
 *               | buildNodesStructure()    ---> This method stores each node in a hash table where it saved all the nodes received. It can be modified, if you want to store some aditional info.
 *               | createNodesArray()       ---> This function is interesting to modify, specially if you want to show an aditional text ( like it happens in OM), or you use other kind of value(not only text)
 *		         | createToolTip()          ---> This function is used to create the "toolTip" for each node. In this file is just an example, every application must modify it, depending what they want to show.
 *               | _createNodesStructure()  ---> This method creates the appropriate structure for treeHandler. There is no sense to change it, because the structure, for the tree, has to be like this.      
 *        
 *      - SAP REQUESTS<br/><br/>
 *      
 *               | getInitialData() --> Gets labels and root node information<br/>
 *               | nodeSearch()     --> Gets results for a node search on the autoCompleter<br/>
 *				 | nodeChildren()   --> Gets a node children when clicking on its treeHandler related arrow<br/>
 *				 | nodeSelected()   --> Gets a node context when it has been selected on the treeHandler search results list<br/>
 *				 | nodeClicked()    --> Gets a node contextual actions when clicking on its treeHandler name<br/>
 * 
 *     - 23/06/2010: A new open parameter was included, "reloadCatalog", if that is True, each time you open the same Generic Catalog
 *                   the data will be initialized, if it is false, the behaviour will be the same.   
 *     - 06/08/2010: lastPushedNode keeps the chain of pushed nodes and it's updated each time we pushed a node.Later when we back of a service,
 *                   in navigateTo, we invoke the function recallOpenedNodes of treeHandler. 
 */
var GenericCatalogV2 = Class.create(Application,
/**
* @lends GenericCatalogV2
*/
{

/**
*@type Hash
*@description It keeps the mapping between object types and CSS classes to apply them. Also, with codes for lite version
*This attribute must be updated and filled with every object type and related CSS class
*that has been created.
*/
CLASS_OBJTYPE: $H({
    D: 'application_courseType',
    DC: 'application_curriculumType',
    L: 'application_courseGroup',
    'JF': 'application_jobFamily',
    'C': 'application_job',
    QK: 'application_courseType',
    Q: 'application_courseGroup',
    O: 'applicationOM_folder',
    S: 'applicationOM_person',
    P: 'applicationOM_staff2',
    MN: 'applicationOM_manager',
    SP: 'applicationOM_staffPosition',
    SO: 'applicationOM_staff',
    PR: 'application_rounded_question2',
    IC: 'application_om_objectadded',
    ID: 'application_om_objectremove',
    E: 'application_course',
    EC: 'application_curriculum',
    F: 'learning_locationIcon',
    G: 'learning_roomIcon',
    U: 'learning_companyIcon',
    H: 'learning_externalTeacherIcon',
    BL: 'application_courseType',
    B: 'application_courseGroup',
    FN: 'applicationOM_functionalArea',
    '9O': 'applicationOM_businessArea1',
    CP: 'applicationOM_staff2',
    TB: 'application_courseType'
}),
CLASS_OBJTYPE_CODE: $H({
    D: '',
    DC: '',
    L: '',
    'JF': '\u2666',
    'C': '\u2666',
    FN: '\u2666',
    QK: '\u2666',
    Q: '\u2666',
    O: '\u2666',
    S: '\u2666',
    P: '\u2666',
    MN: '\u2666',
    SP: '\u2666',
    SO: '\u2666',
    PR: '\u2666',
    IC: '\u2666',
    ID: '\u2666',
    E: '',
    EC: '',
    F: '\u2666',
    R: '',
    '9R': '',
    G: '\u2666',
    U: '\u2666',
    '9U': '',
    H: '\u2666',
    '9H': '',
    BL: '\u2666',
    B: '\u2666',
    FN: '\u2666',
    '9O': '\u2666',
    CP: '\u2666',
    TB: '\u2666'
}),
//********************************************************************************************
//CATALOG AUX STRUCTURES
//********************************************************************************************
checkBoxes: false,
json: null,
data: null,
//root: {},
/**
*@type Hash
*@description It contains all the already read (from the back-end) nodes information.
*/
nodes: null,
///**
//*@type XML Document
//*@description XML corresponding to the exact tree that is being shown currently on the screen. So
//*it will be updated everytime the tree shown branch changes.
//*/
//currentXMLs: null,
///**
//*@type Template
//*@description treeHandler nodes Template. Are set 
//* - children ('X' or '')  
//* - name
//* - id
//* - type
//* - plvar
//* by default.
//*/
//templateNodes: new Template('<node childs="#{children}"><name>#{name}</name><id>#{id}</id><type>#{type}</type><plvar>#{plvar}</plvar><select>#{select}</select><checkRoot>#{checkRoot}</checkRoot><checked>#{checked}</checked></node>'),
///**
//*@type Template
//*@description treeHandler root node Template. Are set 
//* - children ('X' or '')  
//* - name
//* - id
//* - type
//* - plvar
//* by default.
//*/
//templateRoot: new Template('<node childs="#{children}"><name>#{name}</name><id>#{id}</id><type>#{type}</type><plvar>#{plvar}</plvar><select>#{select}</select><checkRoot>#{checkRoot}</checkRoot>'),
//********************************************************************************************
//CATALOG INFO
//********************************************************************************************
/**
*@type String
*@description Name of the catalogue class is inheriting from GenericCatalogV2.
*This value is passed as a field in the configuration hash.
*/
applicationId: '',
/**
*@type String
*@description Parent Catalogue container Id.
*This value is passed as a field in the configuration hash.
*/
containerParent: 'LRN_CAT',
/**
*@type String 
*@description Child Catalogue container Id.
*This value is passed as a field in the configuration hash.
*/
containerChild: 'TM_L_CTD',
//********************************************************************************************
//SERVICES NAMES
//********************************************************************************************
/**
*@type String 
*@description First service name, called to get the labels and general information needed
*to build the initial HTML screen.
*This value is passed as a field in the configuration hash.
*/
initialService: 'GET_CAT_ROOTS',
/**
*@type String 
*@description Sercive name called to get a node children when clicking on its tree arrow.
*This value is passed as a field in the configuration hash.
*/
getNodeChildrenService: 'GET_CAT_CHILD',
/**
*@type String 
*@description Service name called to search for a node when the Autocompleter module throws
*its onGetNewXml event.
*This value is passed as a field in the configuration hash.
*/
searchService: 'GET_CAT_SEAR',
/**
*@type String 
*@description Service name called to get a node context (parent and siblings) when
*a node is selected in the Autocompleter search results list.
*This value is passed as a field in the configuration hash.
*/
searchedNodeSelectedService: 'GET_CAT_PAR',
/**
*@type String 
*@description Service name called to get a node contextual actions when clicking on
*its name (on the treeHandler).
*This value is passed as a field in the configuration hash.
*/
nodeClickedService: 'GET_CAT_ACTIO',
/**
*@type String 
*@description Service name called to delete an object of the catalog
*/
genericDeleteService: 'SAVE_OREQUEST',
//********************************************************************************************
//HTML Elements
//********************************************************************************************
/**
*@type HTML Element
*@description It keeps the title HTML element, so as to be easily modifiable.
*/
title: null,
/**
*@type HTML Element
*@description It keeps the autoCompleter level label HTML element, so as to be easily modifiable.
*/
autoCompleterLabel: null,
/**
*@type Object
*@description It keeps the autoCompleter module object.
*/
autoCompleter: null,
/**
*@type HTML Element
*@description It keeps the datePickers level label HTML element, so as to be easily modifiable.
*/
datePickersLabel: null,
/**
*@type Object
*@description It keeps the begin datePicker module object.
*/
datePickerBeg: null,
/**
*@type Object
*@description It keeps the end datePicker module object.
*/
datePickerEnd: null,
/**
*@type HTML Element
*@description It keeps the legend div HTML element, so as to be easily modifiable.
*/
legend: null,
/**
*@type boolean
*@description Tells if the catalog is in popup mode: in that case it won't show the actions 
*/
popupMode: false,
//********************************************************************************************
/**     
*@param info {Hash} configuration hash
*@description class constructor, which goal is to initialize the class attributes depending on
*the catalogue type and services.
*/
initialize: function ($super, options, info) {
    $super(options);
    //This variable is kept false while we are refreshing the autocompleter so that the next call is
    //only made when the last one has already finished loading
    this.makeCall = true;
    this.randomId = Math.floor(Math.random() * 100000) + ""; 
    this.nodes = $H({});
    this.nodeIsClosed =  $H({});
    this.hashOfRoots = $H({});
    if (info) {
        if (info.checkBoxes) this.checkBoxes = info.checkBoxes;
        if (info.radiobuttons) this.radiobuttons = info.radiobuttons;
        if (info.containerParent) this.containerParent = info.containerParent;
        if (info.containerChild) this.containerChild = info.containerChild;
        if (info.initialService) this.initialService = info.initialService;
        if (info.getNodeChildrenService) this.getNodeChildrenService = info.getNodeChildrenService;
        if (info.searchService) this.searchService = info.searchService;
        if (info.searchedNodeSelectedService) this.searchedNodeSelectedService = info.searchedNodeSelectedService;
        if (info.nodeClickedService) this.nodeClickedService = info.nodeClickedService;
        //if (info.applicationId) this.applicationId = options.appId;
    }
    if (options) {
        if (options.popupMode) this.popupMode = options.popupMode;
    }
    this.getChildrenBinding = this.nodeChildren.bindAsEventListener(this);
    this.expandNodeBinding = this.updateNode.bindAsEventListener(this);
    this.nodeClickedBinding = this.nodeClicked.bindAsEventListener(this);
    this.nodeSearchBinding = this.nodeSearch.bindAsEventListener(this);
    this.nodeSelectedBinding = this.nodeSelected.bindAsEventListener(this);
},
/**     
*@description run() method, it observes the proper application events and runs the run() parent
*method. In addition to this, it begins the class showing process.
*/
run: function ($super, args) {
    this.args = args;
    $super(args);
    this.applicationId = getArgs(args).get('app').appId;
    if (!Object.isEmpty(args)) {
        var arguments = getArgs(args);
        this.checkBoxes = args.get('multiple');
        this.type = args.get('type');
    }
    if (this.firstRun || args.get("reloadCatalog") == true) {
        this.getInitialData();
    } else {
        if (this.containerParent == "LRN_CAT" || this.containerParent == "LRN_RES" || arguments.get('refresh')) {
            this.backTop();
        }
    }
    document.observe("EWS:treeHandler_GiveMeXml", this.getChildrenBinding);
    document.observe("EWS:treeHandler_updateNode", this.expandNodeBinding);
    document.observe('EWS:treeHandler_textClicked', this.nodeClickedBinding);
    document.observe(this.applicationId + ':nodeSearch', this.nodeSearchBinding);
    document.observe(this.applicationId + ':nodeSelected', this.nodeSelectedBinding);
    document.observe('EWS:' + this.applicationId + '_correctDay', this.backTop.bindAsEventListener(this));
},
/**     
*@description close() method, it stops observing the currently observed application events and runs the close() parent
*method.
*/
close: function ($super) {
    //    if (this.args && this.args.get("reloadCatalog") == true) {
    //        this.getInitialData();
    //    }
    $super();
    if(this.tooltipsModule)
        this.tooltipsModule.hideTooltip();
    document.stopObserving("EWS:treeHandler_GiveMeXml", this.getChildrenBinding);
    document.stopObserving("EWS:treeHandler_updateNode", this.expandNodeBinding);
    document.stopObserving('EWS:treeHandler_textClicked', this.nodeClickedBinding);
    document.stopObserving(this.applicationId + ':nodeSearch', this.nodeSearchBinding);
    document.stopObserving(this.applicationId + ':nodeSelected', this.nodeSelectedBinding);
    document.stopObserving('EWS:' + this.applicationId + '_correctDay', this.backTop.bindAsEventListener(this));

},
/**     
*@description This method processes the JSON received from back-end and it builds the structure 
*@param data {JSON} JSON received from back-end
*/
handleData: function (data) {
    var structure = $H({});
    if (!Object.isEmpty(data.EWS.o_children))
        var nodes = data.EWS.o_children.yglui_str_parent_children;
    if (data.EWS.o_root || data.EWS.o_parent) {
        if (data.EWS.o_root) {
            //store the roots of the tree in a hash
            var roots = objectToArray(data.EWS.o_root.yglui_str_parent_children);
            this.numberOfRoots = roots.length;
            for (var i = 0; i < this.numberOfRoots; i++) {
                this.hashOfRoots.set(i, roots[i]['@otjid']);
            }
            //this.rootId = data.EWS.o_root.yglui_str_parent_children['@objid'];
            objectToArray(data.EWS.o_root.yglui_str_parent_children).each(function (node) {
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
//********************************************************************************************
//BUILDING HTML
//********************************************************************************************
/**     
*@param data {JSON} labels and root node information
*@description It sets the initial application screen using the information sent by SAP,
*for the first service requested. This method divides the application screen into 5 levels:
*   - The Title div         (level1)
*   - The AutoCompleter div (level2)
*   - The DatePickers div   (level3)
*   - The Legend div        (level4)
*   - The TreeHandler div   (level5)
*   
*   and calls the five methods are going to handle the HTML code structure of each of the levels:
*   
*   - this.setTitleDiv();
*	 - this.setAutoCompleterDiv();
*	 - this.setDatePickersDiv();
*	 - this.setLegendDiv();
*	 - this.setTreeDiv();
* 
*   what it makes easy you to overwrite its behaviour (of each method) to get the needed screen.
*/
setHTML: function (data) {
    this.json = data;
    this.data = this.handleData(data);

    this.virtualHtml.insert(
			        "<div id='" + this.applicationId + "_level1' class='genCat_level1'></div>" +
					"<div id='" + this.applicationId + "_level2' class='genCat_level2'></div>" +
					"<div id='" + this.applicationId + "_level3' class='genCat_level3'></div>" +
					"<div id='" + this.applicationId + "_level4' class='genCat_level4'></div>" +
					"<div class='genCat_backTop'>" +
					    "<span id='" + this.applicationId + "_backTop' class='application_action_link test_link'>" + global.getLabel('Back to Top') + "</span>" +
					"</div>" +
					"<div style='clear:both'>&nbsp;</div>" +
					"<div id='" + this.applicationId + "_level5' class='genCat_level5'></div>" +
					"<div id='" + this.applicationId + "_level6' class='genCat_level6'>"



		);

    var json = {
        elements: []
    };
    var aux = {
        label: global.getLabel('add'),
        handlerContext: null,
        handler: this.returnSeveralJobs.bind(this),
        type: 'button',
        idButton: this.applicationId + '_buttonAdd',
        className: 'genCat_button',
        standardButton: true
    };
    json.elements.push(aux);
    var ButtonJobCatalog = new megaButtonDisplayer(json);
    if (!Object.isEmpty(this.virtualHtml.down('span#' + this.applicationId + '_backTop'))) {
        this.virtualHtml.down('span#' + this.applicationId + '_backTop').hide();
    }
    else if (!Object.isEmpty($(this.applicationId + '_backTop'))) {

        $(this.applicationId + '_backTop').hide();
    }
    //this.virtualHtml.down('span#' + this.applicationId + '_backTop').hide();
    this.virtualHtml.down('[id=' + this.applicationId + '_level6]').insert(ButtonJobCatalog.getButtons());
    if (!this.checkBoxes)
        this.virtualHtml.down('[id=' + this.applicationId + '_level6]').hide();
    if (!Object.isEmpty(this.virtualHtml.down('span#' + this.applicationId + '_backTop'))) {
        this.virtualHtml.down('span#' + this.applicationId + '_backTop').observe('click', function () {
            this.backTop("backRoot");
        } .bind(this));
    }
    this.setTitleDiv();
    this.setAutoCompleterDiv();
    this.setDatePickersDiv();
    this.setLegendDiv();
    this.setTreeDiv();
},
/**     
*@description It sets the first HTML level 
*/
setTitleDiv: function () {
    this.title = new Element('span', { className: 'application_main_title' });
    this.virtualHtml.down('div#' + this.applicationId + '_level1').insert(this.title.update('Generic Catalog Title')); //this.data.title));		
},
/**     
*@description It sets the second HTML level (the autoCompleter one)
*/
setAutoCompleterDiv: function () {
    this.autoCompleterLabel = new Element('span', { className: 'application_main_title3 test_label' });
    this.virtualHtml.down('div#' + this.applicationId + '_level2').insert(this.autoCompleterLabel.update('Autocompleter Label').wrap('div', { className: 'genCat_label' })); //this.data.autocompleterLabel));
    this.virtualHtml.down('div#' + this.applicationId + '_level2').insert("<div class='genCat_comp' id='" + this.applicationId + "_autocompleter'></div>");
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
    var cont = 0;
    objectToArray(this.json.EWS.o_legend.item).each(function (element) {
        cont++;
        var text;
        if (cont == this.json.EWS.o_legend.item.length)
            var checked = "checked";
        else
            var checked = "";
        var radioButton = "<input type='radio' name='gcRadioGroup' value='" + element['@otype'] + "' class='test_radioButton genCat_radioButton' " + checked + "/>";
        var radioButtonDiv = new Element('div');
        for (i = 0; i < this.json.EWS.labels.item.length; i++) {
            if (this.json.EWS.labels.item[i]['@id'] == element['@otype'])
                text = '<span style="float:left;">' + this.json.EWS.labels.item[i]['@value'] + '</span>';
        }
        radioButtonDiv.insert(radioButton);
        radioButtonDiv.insert(text);
    } .bind(this));
},
/**     
*@description It sets the third HTML level (the DatePickers one)
*/
setDatePickersDiv: function () {
    this.datePickersLabel = new Element('span', { className: 'application_main_title3 test_label' });
    this.virtualHtml.down('div#' + this.applicationId + '_level3').insert(this.datePickersLabel.update('Dates Label').wrap('div', { className: 'genCat_label' })); //this.data.datePickersLabel));	
    this.virtualHtml.down('div#' + this.applicationId + '_level3').insert("<div class='genCat_comp' id='" + this.applicationId + "_datePickers'>" +
																				"<span class='application_main_text genCat_from'>" + global.getLabel('from') + "</span>" +
																				"<div id='" + this.applicationId + "_datePickerBeg'></div>" +
																		        "<span class='application_main_text genCat_to'>" + global.getLabel('to') + "</span>" +
																				"<div id='" + this.applicationId + "_datePickerEnd'></div>" +
																		  "</div>");
    var aux = { events: $H({ 'correctDate': 'EWS:' + this.applicationId + '_correctDay' }), defaultDate: objectToSap(new Date()).gsub('-', ''), manualDateInsertion: true };
    this.datePickerEnd = new DatePicker(this.applicationId + '_datePickerEnd', aux);
    this.datePickerBeg = new DatePicker(this.applicationId + '_datePickerBeg', aux);
    this.datePickerBeg.linkCalendar(this.datePickerEnd);
},
/**     
*@description It sets the fourth HTML level  (the Legend one)
*/
setLegendDiv: function () {
    var aux = new Object();
    aux.legend = [];
    aux.showLabel = global.getLabel('showLgnd');
    aux.hideLabel = global.getLabel('closeLgnd');
    this.json.EWS.o_legend.item.each(function (element) {
        aux.legend.push({ img: this.CLASS_OBJTYPE.get(element['@otype']), text: element['@wegnr'], code: this.CLASS_OBJTYPE_CODE.get(element['@otype']) });
    } .bind(this));
    this.virtualHtml.down('div#' + this.applicationId + '_level4').update(getLegend(aux));
    this.legend = this.virtualHtml.down('div#' + this.applicationId + '_level4');
},
/**     
*@description It sets the fifth HTML level (the treeHandler one)
*/
setTreeDiv: function (selectedByDefault) {
    this.nodes = $H({}); 
    this.openedByDefault = null;
    this.currentJSONs = $A();
    if(this.data.keys().length != 0){
    this.data.each(function (element) {     
        this.currentJSONs.push(this._createNodesStructure(element.value));
        this.buildTreeXml(element.value);
    }.bind(this));
    //this.currentJSONs[0].isOpen = true;
        this.tree = new TreeHandlerV2(this.applicationId + '_level5', this.currentJSONs, { checkBoxes: this.checkBoxes, type: this.type, defaultSelection: selectedByDefault});
    this.createToolTip();
    }else{
        $(this.applicationId + '_level5').insert(global.getLabel("NONODES"));
    }
},
//********************************************************************************************
//UPDATING HTML
//********************************************************************************************
/**     
*@param text {String} label text to be set
*@description It updates the title label text.
*/
setTitle: function (text) {
    this.title.update(text);
},
/**     
*@param text {String} label text to be set
*@description It updates the autoCompleter level label text.
*/
setAutoCompleterLabel: function (text) {
    this.autoCompleterLabel.update(text);
},
/**     
*@param text {String} label text to be set
*@description It updates the DatePickers level label text.
*/
setDatePickersLabel: function (text) {
    this.datePickersLabel.update(text);
},
/**     
*@param text {String} label text to be set
*@description It updates the Legend level label text.
*/
setLegend: function (json) {
    this.legend.update(getLegend(json));
},
//********************************************************************************************
//UPDATING MODULES HTML
//********************************************************************************************	
/**     
*@param results {JSON} search service results list
*@description It fills the autocompleter with the search service results list.
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
        json.autocompleter.object.push({ text: node['@stext'], data: node['@otjid'] + '_' + node['@otype'], icon: this.CLASS_OBJTYPE.get(node['@otype']) });
        } .bind(this));
    }
    this.autoCompleter.updateInput(json);
    //A new search can be made, as the last one has already finished
    this.makeCall = true;
    //If we finished loading, but there were more search tries during the load of the last request,
    //then we should do one more call with the latest search arguments
    if (!Object.isEmpty(this.oneMoreCall)) {
        this.nodeSearch(this.oneMoreCall);
    }
},
/**     
*@param rootArray {array} array of every parent node of the corresponding node 
*@param number(int) number of parent that the corresponding node has got
*@description this method creates an objects´ array. Each object is a node, with the right structure 
*/
_findEachParent: function(rootArray,number){          
         for(var i = 0; i < number + 1; i++){
              if(!auxArray){
                   var index = getElementIndex(this.currentJSONs,'id',rootArray[number - i]);
                   var auxArray = $A();
                   auxArray.push(this.currentJSONs[index]); 
               }else{
                   var index = getElementIndex(auxArray[i - 1].children,'id',rootArray[number - i]);
                   auxArray.push(auxArray[i - 1].children[index]);
               }        
         }
     return auxArray;
},
/**     
*@param rootArray {array} array of every parent node of the corresponding node 
*@param number(int) number of parent that the corresponding node has got
*@param auxArray(array) nodes array
*@description this method re-builds the structure for treeHandler, with the new nodes or whatever
*/
_rebuildStructure: function(auxArray,rootArray, number){
    for(var i = 0; i < number; i++){
         var index = getElementIndex(auxArray[number - i - 1].children,'id',rootArray[i]);
         auxArray[number - i - 1].children[index] = auxArray[number - i];
    }
    var index = getElementIndex(this.currentJSONs,'id',rootArray[number]);
    this.currentJSONs[index] = auxArray[0];
},
/**     
*@param auxJSONs(array) nodes array
*@description this method opens each node which has to be opened when we reload the tree
*/
_reOpenTree: function(arrayJSONs){
    for(var i = 0; i < arrayJSONs.length; i++){
//          if(arrayJSONs[i].id == this.currentJSONs[0].id){
//                this._reOpenTree(arrayJSONs[i].children);
//          }else{
                if(arrayJSONs[i].isOpen && (arrayJSONs[i].id != this.openedByDefault)){
                    this._reCallNodeChildren(arrayJSONs[i].id,arrayJSONs[i].children);
                }else if (arrayJSONs[i].id == this.openedByDefault){
                    this._reOpenTree(arrayJSONs[i].children);
                }
//          }
    }
},
/**     
*@param data {JSON} node context
*@description It sets the node context on the treeHandler, after receiving it as the respond
*to the get node parent (context) information service.
*/
navigateTo: function (type, data, id) {
        $(this.applicationId + '_level5').update('');    
        if(this.nodeDeleted){// when we are going to delete a node
                var nodeDeletedId = this.nodeDeleted["@otype"] + this.nodeDeleted["@objid"];   
                if(this.nodes.get(nodeDeletedId).parentType && this.nodes.get(nodeDeletedId).parent){        
                    var rootArray = this.rootsNumber(this.nodes.get(nodeDeletedId).parentType + this.nodes.get(nodeDeletedId).parent);
                    var number = rootArray.length - 1;
                    var auxArray = this._findEachParent(rootArray,number);
                    var index = getElementIndex(auxArray[number].children,'id',nodeDeletedId);
                    auxArray[number].children.splice(index,1);
                    if(auxArray[number].children.length == 0){
                        auxArray[number].hasChildren = false;
                        auxArray[number].isOpen = false;
                this.nodes.get(auxArray[number].id).isOpen = false;
                    }
                    this._rebuildStructure(auxArray,rootArray,number);
                }else{
                    var index = getElementIndex(this.currentJSONs,'id',nodeDeletedId);
                    this.currentJSONs.splice(index,1);
                }
                this.tree.reloadTree(this.currentJSONs);
                this.nodes.unset(nodeDeletedId);
                this.createToolTip();
        }else if(type == "autocompleter" || !Object.isEmpty(type)){ // to filter the tree
            //this.nodes = $H();
            this.data = this.handleData(data);
            this.setTreeDiv(id);
        }else /*if(this.insertNewNode)*/{// to insert a node
            this.nodesAux = this.nodes;
            //this.nodes = $H();
            this.data = this.handleData(data);
            var newCurrentJSONs = this.currentJSONs;
            this.NodesAlreadyVisited = this.tree.visitedNodes;
            for(var i = 0; i < this.nodeIsClosed.keys().length; i++){
                this.NodesAlreadyVisited.unset(this.nodeIsClosed.keys()[i]);
            }
            this.nodeIsClosed = $H({});
            this.setTreeDiv();  
            this._reOpenTree(newCurrentJSONs);
            this.insertNewNode = false;
        }
},
/**     
*@param id (string) node id, which has to be opened
*@param children (array)nodes array. These nodes are children of the node  which has to be opened
*@description It gets a node the list of children.
*/
_reCallNodeChildren: function(id,children) {
    var aux = this.nodesAux.get(id);
    var id = aux.id.gsub(aux.type, '');
    var xml = "<EWS>" +
						"<SERVICE>" + this.getNodeChildrenService + "</SERVICE>" +
						"<OBJECT TYPE='" + aux.type + "'>" + id + "</OBJECT>" +
						"<DEL></DEL>" +
						"<PARAM>" +
							"<CONTAINER_PARENT>" + this.containerParent + "</CONTAINER_PARENT>" +
							"<CONTAINER_CHILD>" + this.containerChild + "</CONTAINER_CHILD>" +
							"<DATUM>" + objectToSap(this.datePickerBeg.getActualDate()) + "</DATUM>" +
						"</PARAM>" +
				   "</EWS>";
    this.makeAJAXrequest($H({ xml: xml, successMethod: this._reCalledNodes.bind(this, aux.id, children)}));
},
/**     
*@description It gets the nodes that are selected and fires an event returning a hashtable.
*/
returnSeveralJobs: function () {
        var aux = this.tree.getSelected();
        var selected = $A(); 
        for(var i = 0; i < aux.toArray().length;i++){
            selected.push(this.nodes.get(aux.toArray()[i].key));
        }
        if (Object.isEmpty(this.returnHash)) {
            this.returnHash = $H();
        }
        for (var j = 0; j < selected.length; j++) {
            var child = this.nodes.get(selected[j].id);
            var parentIdObj = child['parent'];
            var parentType = child['parentType'];
            var parentId = parentType + parentIdObj;
            if (Object.isEmpty(parentIdObj)) {
                parentId = '';
                var parentName = '';
                var parentType = '';
            }
            else {
                var parent = this.nodes.get(parentId);
                var parentName = parent['textName'];
                var parentType = parent['type'];

            }
            var childId = child['id'];
            var childName = child['textName'];
            var childType = child['type'];
            this.returnHash.set(childId, {
                childName: childName,
                childType: childType,
                parentId: parentId,
                parentName: parentName,
                parentType: parentType

            });
        }
    if (this.returnHash.size() != 0) {
        document.fire('EWS:returnSelected', $H({ hash: this.returnHash, cont: this.cont, InScreen: this.widgetsFlag, sec: this.sec }));
    }
    this.popUpApplication.close();
    delete this.popUpApplication;
    this.close();

},
//TODO
returnJob: function(params) {//////////////////////////////////////////////
    var childId = params.get('nodeName').split('_')[0];
    var child = this.nodes.get(childId);
    var parentId = child['parent'];
    if (Object.isEmpty(parentId)) {
        parentId = '';
        var parentName = '';
        var parentType = '';
    }
    else {
        var parent = this.nodes.get(parentId);
        var parentName = parent['textName'];
        var parentType = child['type'];
    }
    var childName = child['textName'];
    var childType = child['type'];
    this.returnHash.set(childId, {
        childName: childName,
        childType: childType,
        parentId: parentId,
        parentName: parentName,
        parentType: parentType
    });
    document.fire('EWS:returnSelected', $H({ hash: this.returnHash, cont: this.cont, InScreen: this.screen, sec: this.sec }));
    this.popUpApplication.close();
    delete this.popUpApplication;
    this.close();
},
/**     
*@param json {JSON} node children data got from SAP
*@param ajaxId {String} node id
*@param ajaxChildren {Array} children nodes array
*@description It calls to expandNode function to expand the node and It checks out if any of their children should be opened.
*/
_reCalledNodes: function(ajaxId, ajaxChildren,json){
    var visitedNodes = this.NodesAlreadyVisited;
    this.expandNode(json, ajaxId,visitedNodes);
    if(ajaxChildren.length > 0){
        this._reOpenTree(ajaxChildren);
    }
},
/**     
*@param json {JSON} node children data got from SAP
*@param ajaxId {String} node id
*@description It expands a node in the treeHandler, showing its children.
*/
expandNode: function (json, ajaxId,visitedNodes) {
        this.scroll = {
			scrollX: document.viewport.getScrollOffsets()[0],
			scrollY: document.viewport.getScrollOffsets()[1]
	    }
	    if(this.nodes.get(ajaxId).oldId){
	        var parentId = this.nodes.get(ajaxId).id;
	    }
        var rootArray = this.rootsNumber(ajaxId);
        var number = rootArray.length - 1;
        this.data = this.handleData(json);
        $(this.applicationId + '_level5').update('');
        var auxArray = this._findEachParent(rootArray,number);
        var dataArray = this.data.values(); 
        for(var i = 0; i < dataArray.length; i++){
            auxArray[number].children.push(this.createNodesArray(dataArray[i],parentId));
            this.buildNodesStructure(dataArray[i],parentId);  
        }
        auxArray[number].isOpen = true;
    this.nodes.get(ajaxId).isOpen = true;
        this._rebuildStructure(auxArray,rootArray,number);
        this.tree.reloadTree(this.currentJSONs,visitedNodes);
        window.scrollTo(this.scroll.scrollX, this.scroll.scrollY);
        this.createToolTip();
},
/**    
*@description This method is called when we want to close or open an arrow, and its data have already been requested to SAP, then we only have to update the atributte "isOpen" 
*/ 
updateNode: function(args){
    var rootArray = this.rootsNumber(getArgs(args));
    var number = rootArray.length - 1;
    var auxArray = this._findEachParent(rootArray,number);
    auxArray[number].isOpen = !auxArray[number].isOpen;
    this.nodes.get(getArgs(args)).isOpen = auxArray[number].isOpen;
    if(!auxArray[number].isOpen){
        this.nodeIsClosed.set(auxArray[number].id,auxArray[number].id);
    }else{
        this.nodeIsClosed.unset(auxArray[number].id);
    }
    this._rebuildStructure(auxArray,rootArray,number);
},
/**   
*@param root {string} id of the root immediately upper of the node clicked  
*@description This method return an array where we store each root, which is had by the node who has been clicked.
*/
rootsNumber: function(root){
    var newRoot = root;
    var rootArray = $A();
    do{
       if(this.nodes.get(newRoot).parentType && this.nodes.get(newRoot).parent){
            rootArray.push(this.nodes.get(newRoot).id);
            newRoot = this.nodes.get(newRoot).parentType + this.nodes.get(newRoot).parent;
       }  
    }while(this.nodes.get(newRoot).parent && this.nodes.get(newRoot).parentType);
    rootArray.push(this.nodes.get(newRoot).id);
    return rootArray;
},
/**   
*@param node {object} node to be stored 
*@description This method stores each node in a hash table where it saved all the nodes received
*/
buildNodesStructure: function(node,parentNewId) {
        var extraText = Object.isEmpty(node["@add_text"]) ? null : node["@add_text"];
        var toolTip =  Object.isEmpty(node["@tooltip"]) ? null : node["@tooltip"];
        if(this.nodes.get(node['@otjid'])){//This is when sometimes we have the same node in several part of the tree.
           var repeated = true;
        }
        if(parentNewId){
            var parentType = node['@rootty'];
            var parentId = parentNewId.gsub(parentType, '');
            var parentOldId = node['@rootid'];
        }else{
            var parentType = node['@rootty'];
            var parentId = node['@rootid'];
            var parentOldId = null;
        }
        aux = {
            name: node['@stext'],
            id: !repeated ? node['@otjid'] : node['@otjid'] + "R" + + this.random,
            oldId:repeated ? node['@otjid']: null,
            type: node['@otype'],
            plvar: node['@plvar'],
            children: (node['@parnt'] && (node['@parnt'].toLowerCase() == 'x')) ? 'X' : '',
            parentOldId: parentOldId,
            parent: parentId,//node['@rootid'],
            parentType: parentType,//node['@rootty'],
            select: (Object.isEmpty(node['@select'])) ? "" : node['@select'],
            textName: node['@stext'],
            extraText: extraText,
            toolTip: toolTip,
            checkRoot: node['@select_root'],
        checked: (Object.isEmpty(node['@checked'])) ? null : 'X',
        isOpen: false
        };
        this.nodes.set(aux.id, aux);
},
/**     
*@param args {JSON} node contextual actions
*@param ajaxId {String} node id and type
*@description It fills the Balloon object with a node contextual actions links:
*when clicking on each link (action) it will be fire the event this.applicationId+":action" 
*containing the related action information (default: the action name) as 
*the event sent parameters.
*/
showActions: function (args, ajaxId) {
    var elementId = ajaxId.id;//'treeHandler_text_' + ajaxId.split('_')[0] + '_div_' + ajaxId.split('_')[2] + '_' + this.applicationId + '_level5_' + ajaxId.split('_')[1];
//    var element = this.virtualHtml.down('span#' + elementId);
//    var divChild = element.down('td.treeHandler_textSize').down();
    var divChildId = this.applicationId + '_level5_linedTreeTxt_' + elementId;//this.applicationId + '_level5_linedTreeTxt_' + elementId;divChild.identify();
    var html = new Element('div');
    var jsonLinks = {
        elements:[]
    }
    if (args && args.EWS && args.EWS.o_actions && args.EWS.o_actions.yglui_vie_tty_ac) {
        var actions = objectToArray(args.EWS.o_actions.yglui_vie_tty_ac);
        for(var i = 0; i < actions.length; i++){
            var action = actions[i];
            if(!action['@actiot'].include("((L))")){
                var label = "((L))" + action['@actiot'] + "((L))";
            }else{
                var label = action['@actiot']; 
            }
            if(ajaxId.oldId){
                var nodeId = ajaxId.oldId.gsub(ajaxId.type,'');
            }else{
            var nodeId = ajaxId.id.gsub(ajaxId.type,'');
            }   
            var nodeName = ajaxId.textName;
            var hashAtributes = $H({
                name: action['@actio'],
                nodeId: nodeId,
                nodeName: nodeName,
                application: action['@tarap'],
                nodeType: ajaxId.type,
                okCode: action['@okcod'],
                view: action['@views'],
                tarty: action['@tarty'],
                tartb: action['@tartb'],
                disma: action['@disma']
            });
            var link = {
                label:label,
                delimit:"((L))",
                handler: document.fire.bind(document, this.applicationId + ":action",hashAtributes),
                type:'link',
                className:'application_action_link'                
            };
            jsonLinks.elements.push(link);      
        }
        var linksPopUp = new megaButtonDisplayer(jsonLinks);
        html.insert(linksPopUp.getButtons());
//        objectToArray(args.EWS.o_actions.yglui_vie_tty_ac).each(function (action) {
//            var name = action['@actio'];
//            var text = action['@actiot'];
//            var app = action['@tarap'];
//            var okCode = action['@okcod'];
//            if(ajaxId.oldId){
//                var nodeId = ajaxId.oldId.gsub(ajaxId.type,'');
//            }else{
//                var nodeId = ajaxId.id.gsub(ajaxId.type,'');
//            }   
//            var nodeName = ajaxId.textName;
//            var nodeType = ajaxId.type;
//            var view = action['@views'];
//            var tarty = action['@tarty'];
//            var tartb = action['@tartb'];
//            var disma = action['@disma'];
//            var span = new Element('div', { 'class': 'application_action_link genCat_balloon_span test_link' }).insert(text);
//            html.insert(span);
//            span.observe('click', document.fire.bind(document, this.applicationId + ":action", $H({
//                name: name,
//                nodeId: nodeId,
//                nodeName: nodeName,
//                application: app,
//                nodeType: nodeType,
//                okCode: okCode,
//                view: view,
//                tarty: tarty,
//                tartb: tartb,
//                disma: disma
//            })));
//        } .bind(this));
    } else {
        var span = new Element('div', { 'class': 'genCat_balloon_span' }).insert(global.getLabel('noActionsAvailable'));
        html.insert(span);
    }
    balloon.showOptions($H({
        domId: divChildId,
        content: html
    }));
},
//********************************************************************************************
//LOGIC TOOLS
//********************************************************************************************
/**     
*@param id {String} node id
*@description It finds the root of the nodeId given, if it has not a root, this modules returns the id given.
*/
getRoot: function (id) {
    if (this.nodes.get(id).parent) {
        return this.getRoot(this.nodes.get(id).parentType + this.nodes.get(id).parent);
    } else {
        return id;
    }
},
/**     
*@param json {JSON} nodes list
*@description it stores each node in a hash table where it saved all the nodes received
*/
buildTreeXml: function (json) {
    json.each(function (node) {
        this.buildNodesStructure(node.value);
    } .bind(this));
    if(this.openedByDefault){
        this.nodes.get(this.openedByDefault).isOpen = true;
    }
},
/**     
*@description this method creates the appropriate structure for each node 
*@param element {Object} the node to be set properly
*/
createNodesArray: function(element,parentNewId){
		var addName = Object.isEmpty(element["@add_text"]) ? null : element["@add_text"];
        if(this.nodes.get(element['@otjid'])){//This is when sometimes we have the same node in several part of the tree.
             var repeated = true;
             this.random = Math.floor(Math.random() * 100000) + "";
        }
        if(parentNewId){
            var parentId = parentNewId;
            var parentOldId = element['@rootty'] + element['@rootid'];
        }else{
            var parentId = (element['@rootty'] && element['@rootid'])?element['@rootty'] + element['@rootid']:null;
            var parentOldId = null;
        }
		if(element["@is_from_request"] && this.CheckBoxClicked){
             var extraIcons = $A();
             if(!global.liteVersion){
             extraIcons.push(this.CLASS_OBJTYPE.get("PR"));
             }else{
                extraIcons.push({cssClass: this.CLASS_OBJTYPE.get("PR"), icon : this.CLASS_OBJTYPE_CODE.get(element['@otype'])});
             }
        }else{
             var extraIcons = null;
        }
        Json = {
            id : !repeated ? element['@otjid'] : element['@otjid'] + "R" + this.random,
            oldId:repeated ? element['@otjid']: null,
            title: '',
            value: element['@stext'] ? element['@stext'] : "",
			extraText:addName,
            extraTextClass:"OM_Maintain_additionalName",
            extraIcons: extraIcons,
            parent:parentId,
            parentOldId: parentOldId,
            isChecked: (Object.isEmpty(element['@checked'])) ? 0 : 2,
            isOpen:false,
            hasChildren:((element['@parnt'] == 'X')?true:false),
            children:$A(),
            checkRoot:element['@select_root'],
            select:element['@select'],
            nodeIcon:/*'catalogLinedTreeIconFix ' +*/ this.CLASS_OBJTYPE.get(element['@otype']),
            liteVersion: global.liteVersion ? this.CLASS_OBJTYPE_CODE.get(element['@otype']) : false
        }
        return Json;
},
/**     
*@description this method creates the toolTip for each row
*/
//WARNING: This method is just an example, it should be overwritten by each application
createToolTip: function(){
     var nodesArray = this.nodes.toArray();
     var toolTipHash = $H();
     for(var i = 0; i < nodesArray.length; i++){
        var toolTip = new Element("div",{
            'class':'application_main_soft_text'
        });
        var text = new Element("span");
        var extraText = new Element("span");
        var divChildId = this.applicationId + '_level5_linedTreeTxt_' + nodesArray[i].value.id;
        text.insert(global.getLabel("description") + ": " + nodesArray[i].value.textName);
        //extraText.insert("<br/>this is just an example");
        toolTip.insert(text);
        toolTip.insert(extraText);
        toolTipHash.set(nodesArray[i].value.id,{'element':$(divChildId), 'tooltip':toolTip});
     }
     this.tooltipsModule = new tooltip({
        'tooltips':toolTipHash
     });
},
/**     
*@description this method creates the appropriate structure for treeHandler
*@param element {Hash} the nodes to be set properly
*/
_createNodesStructure: function(element){
        var arrayJSON = element.toArray();
        var JSONArray;
        for(var i = 0; i < arrayJSON.length;i++){
            if(!arrayJSON[i].value['@rootid']){//this means this is the parent node
                JSONArray = this.createNodesArray(arrayJSON[i].value);
            }else{
                if((arrayJSON[i].value['@rootty'] + arrayJSON[i].value['@rootid']) == JSONArray.id){
                    JSONArray.children.push(this.createNodesArray(arrayJSON[i].value));
                    JSONArray.isOpen = true;
                    this.openedByDefault = JSONArray.id;
                }
            }
        }
        return JSONArray;
},
//********************************************************************************************
//SAP REQUESTS
//********************************************************************************************
//TODO
backTop: function (type,id) {
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
    if (!Object.isEmpty(this.virtualHtml.down('span#' + this.applicationId + '_backTop'))) {
        this.virtualHtml.down('span#' + this.applicationId + '_backTop').hide();
    }
    else if (!Object.isEmpty($(this.applicationId + '_backTop'))) {
        $(this.applicationId + '_backTop').hide();
    }
},
/**     
*@description Initial service which gets the labels and root node context to be shown
*on the treeHandler.
*/
getInitialData: function () {
    var xml = "<EWS>" +
						"<SERVICE>" + this.initialService + "</SERVICE>" +
						"<OBJECT TYPE='" + global.objectType + "'>" + global.objectId + "</OBJECT>" +
						"<PARAM>" +
							"<CONTAINER_PARENT>" + this.containerParent + "</CONTAINER_PARENT>" +
							"<CONTAINER_CHILD>" + this.containerChild + "</CONTAINER_CHILD>" +
							"<DATUM>" + objectToSap(new Date()) + "</DATUM>" +
						"</PARAM>" +
				   "</EWS>";
    this.makeAJAXrequest($H({ xml: xml, successMethod: 'setHTML' }));
},
/**     
*@param args {Event} event thrown by the autoCompleter object when a node search has to be
*performanced.
*@description It gets a search node results list from the back-end.
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
            autoCompTextToSend = autoCompTextToSend.escapeHTML();
            var xml = "<EWS>" +
						        "<SERVICE>" + this.searchService + "</SERVICE>" +
						        "<DEL></DEL>" +
						        "<PARAM>" +
							        "<CONTAINER_PARENT>" + this.containerParent + "</CONTAINER_PARENT>" +
							        "<CONTAINER_CHILD>" + this.containerChild + "</CONTAINER_CHILD>" +
                                    //"<PATTERN>" + escapeHTML(autoCompText) + "</PATTERN>" +
							        "<PATTERN>" + autoCompTextToSend + "</PATTERN>" +
							        "<OBJECTTYPE>" + objectTypeSearch + "</OBJECTTYPE>" +
							        "<DATUM>" + objectToSap(this.datePickerBeg.getActualDate()) + "</DATUM>" +
						        "</PARAM>" +
				          "</EWS>";
            this.makeAJAXrequest($H({ xml: xml, successMethod: 'showList' }));
        }
    }
},
/**     
*@param args {Event} event thrown by the treeHandler when a node arrow has been clicked
*@description It gets a node the list of children.
*/
nodeChildren: function (args) {
    var aux = this.nodes.get(getArgs(args));
    if(aux.oldId){
          var id = aux.oldId.gsub(aux.type, '');
    }else{
    var id = aux.id.gsub(aux.type, '');
    } 
    var xml = "<EWS>" +
						"<SERVICE>" + this.getNodeChildrenService + "</SERVICE>" +
						"<OBJECT TYPE='" + aux.type + "'>" + id + "</OBJECT>" +
						"<DEL></DEL>" +
						"<PARAM>" +
							"<CONTAINER_PARENT>" + this.containerParent + "</CONTAINER_PARENT>" +
							"<CONTAINER_CHILD>" + this.containerChild + "</CONTAINER_CHILD>" +
							"<DATUM>" + objectToSap(this.datePickerBeg.getActualDate()) + "</DATUM>" +
						"</PARAM>" +
				   "</EWS>";
    this.makeAJAXrequest($H({ xml: xml, successMethod: 'expandNode', ajaxID: aux.id }));

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
                    id = id.gsub(type,"");
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
                    this.makeAJAXrequest($H({
                        xml: xml,
                        successMethod: this.navigateTo.bind(this, "autocompleter"),
                        ajaxID: type + id
                    }));
                    if (!Object.isEmpty(this.virtualHtml.down('span#' + this.applicationId + '_backTop'))) {
                        this.virtualHtml.down('span#' + this.applicationId + '_backTop').show();
                    }
                    else if (!Object.isEmpty($(this.applicationId + '_backTop'))) {

                        $(this.applicationId + '_backTop').show();
                    }
                } else {
                    this.backTop("autocompleter",id);
                }
            }
        }
    }
},
/**     
*@param args {event} event thrown by the treeHandler when a node name has been clicked.
*@description It gets a node contextual actions from SAP.
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
            var aux = this.nodes.get(getArgs(args));//.get('nodeName') + '_' + getArgs(args).get('treeName').split('_')[1];
            if(aux.oldId){
                var nodeId = aux.oldId;
            }else{
                var nodeId = aux.id;
            }
            var dateSAP = this.datePickerBeg.getActualDate();
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
* @description Builds the xml and send it to SAP for the Delete request
*/
genericDeleteRequest: function (oType, objectId, actionId, appName, code) {
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
                        + "<APPID>" + appName + "</APPID>"
                        + "<KEYDATE>" + begYear + '-' + begMonth + '-' + begDay + "</KEYDATE>"
                        + "<UPD_DATE>" + objectToSap(this.genericDeleteDatePicker.getActualDate()) + "</UPD_DATE>"
                        + "<BUTTON ACTION=\"" + actionId + "\" OKCODE=\"" + code + "\" />"
                    + "</PARAM>"
                 + "</EWS>";

    this.makeAJAXrequest($H({ xml: xml, successMethod: 'genericDeleteAnswer' }));
},

//********************************************************************************************
//OBJECTS TOOLS
//********************************************************************************************
/**
* @description Receives the answer from SAP about the firmly book request.
*/
genericDeleteAnswer: function (answer) {
    if (answer.EWS) {
        if(answer.EWS.o_req_head['@actio'].include('DELIMIT')){
            this.insertNewNode = true;
            this.backTop();
        }else{       
            this.nodeDeleted = answer.EWS.o_req_head;
            this.navigateTo();
            this.nodeDeleted = null;
        }
    }
},
/**
* @description Method that deletes a course type/group or curriculum type after the user confirmation
*/
genericDelete: function (oType, objectId, actionId, appName, message, code) {
    var messageFrom;
    if (code == 'CUT') { messageFrom = global.getLabel('delimitFrom') } else { messageFrom = global.getLabel('deleteFrom') }
    var genericDeleteHtml = "<div>"
                               + "<div><span>" + message + "</span></div>"
                               + "<div class = 'catalog_deleteCourse_delimit'><span>" + messageFrom + "</span></div>"
                               + "<div class = 'catalog_deleteCourse_datePicker' id='delete_" + objectId + "DatePicker'></div>"
                               + "</div>";
    var aux = { manualDateInsertion: true,
        defaultDate: objectToSap(new Date()).gsub('-', '')
    };
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
            _this.genericDeleteRequest(oType, objectId, actionId, appName, code);
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
    this.genericDeleteDatePicker = new DatePicker('delete_' + objectId + 'DatePicker', aux);
}

});