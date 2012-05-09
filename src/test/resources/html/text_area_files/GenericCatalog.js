/**
 *@fileOverview GenericCatalog.js
 *@description This file contains the Generic EWS Catalog class.
 */

/**
 *@constructor
 *@description The Generic Catalogue class has been implemented to be the rest of the EWS catalogue<br/>
 *oriented classes parent class. So it provides any class that inherits from it with a common structure<br/>
 *and behaviour catalogue oriented, easily adaptable by extending or overwriting its attributes/methods.<br/><br/>
 *
 *To inherit from GenericCatalog you should build your class as a normal application, but instead of<br/>
 *the Application class setting the GenericCatalog class as the one to inherit from, and add the<br/>
 *configuration hash to the $super constructor with the information that is needed.<br/><br/>
 *
 *Attributes to take into account when a developer wants to make his class inherit from GenericCatalog:<br/><br/>
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
 *               | showAdditionalInfo() --> to show additional node info under its name (can be called as a <br/>
 *                 respond to any specified event not yet set. So it depends on the developer which application<br/>
 *                 is inheriting from GenericCatalog)<br/>
 *               | hideAdditionalInfo() --> to hide additional node info (the same as showAdditionalInfo())<br/>
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
 *               | formatName()<br/>
 *               | buildTreeXml()<br/><br/>
 *		
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
var GenericCatalog = Class.create(Application,
/**
* @lends GenericCatalog
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
    E: '',
    EC: '',
    F: '',
    G: '',
    U: '',
    H: '',
    BL: '\u2666',
    B: '\u2666',
    FN: '\u2666',
    '9O':'\u2666',
    CP: '\u2666',
    TB: '\u2666'
}),
//********************************************************************************************
//CATALOG AUX STRUCTURES
//********************************************************************************************
checkBoxes: false,
json: null,
data: null,
root: {},
/**
*@type Hash
*@description It contains all the already read (from the back-end) nodes information.
*/
nodes: null,
/**
*@type XML Document
*@description XML corresponding to the exact tree that is being shown currently on the screen. So
*it will be updated everytime the tree shown branch changes.
*/
currentXMLs: null,
/**
*@type Template
*@description treeHandler nodes Template. Are set 
* - children ('X' or '')  
* - name
* - id
* - type
* - plvar
* by default.
*/
templateNodes: new Template('<node childs="#{children}"><name>#{name}</name><id>#{id}</id><type>#{type}</type><plvar>#{plvar}</plvar><select>#{select}</select><checkRoot>#{checkRoot}</checkRoot><checked>#{checked}</checked></node>'),
/**
*@type Template
*@description treeHandler root node Template. Are set 
* - children ('X' or '')  
* - name
* - id
* - type
* - plvar
* by default.
*/
templateRoot: new Template('<node childs="#{children}"><name>#{name}</name><id>#{id}</id><type>#{type}</type><plvar>#{plvar}</plvar><select>#{select}</select><checkRoot>#{checkRoot}</checkRoot>'),
//********************************************************************************************
//CATALOG INFO
//********************************************************************************************
/**
*@type String
*@description Name of the catalogue class is inheriting from GenericCatalog.
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
*@type Object
*@description It keeps the treeHandler module object.
*/
trees: null,
/**
*@type boolean
*@description Tells if the catalog is in popup mode: in that case it won't show the actions 
*/
popupMode: false,
/**
*@type string
*@description Tells the recent nodes clicked in the tree.
*/
lastPushedNode: $H(),
//********************************************************************************************
/**     
*@param info {Hash} configuration hash
*@description class constructor, which goal is to initialize the class attributes depending on
*the catalogue type and services.
*/
initialize: function($super, options, info) {
    $super(options);
    //This variable is kept false while we are refreshing the autocompleter so that the next call is
    //only made when the last one has already finished loading
    this.makeCall = true;
    this.nodes = $H({});
    this.trees = $H({});
    this.currentXMLs = $H({});
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
        if (info.applicationId) this.applicationId = options.appId;
    }
    if (options) {
        if (options.popupMode) this.popupMode = options.popupMode;
    }
    this.getChildrenBinding = this.nodeChildren.bindAsEventListener(this);
    this.nodeClickedBinding = this.nodeClicked.bindAsEventListener(this);
    this.nodeSearchBinding = this.nodeSearch.bindAsEventListener(this);
    this.nodeSelectedBinding = this.nodeSelected.bindAsEventListener(this);
},
/**     
*@description run() method, it observes the proper application events and runs the run() parent
*method. In addition to this, it begins the class showing process.
*/
run: function($super, args) {
    this.args = args;
    $super(args);
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
    document.observe('EWS:treeHandler_textClicked', this.nodeClickedBinding);
    document.observe(this.applicationId + ':nodeSearch', this.nodeSearchBinding);
    document.observe(this.applicationId + ':nodeSelected', this.nodeSelectedBinding);
    document.observe('EWS:' + this.applicationId + '_correctDay', this.backTop.bindAsEventListener(this));
},
/**     
*@description close() method, it stops observing the currently observed application events and runs the close() parent
*method.
*/
close: function($super) {
    //    if (this.args && this.args.get("reloadCatalog") == true) {
    //        this.getInitialData();
    //    }
    $super();
    document.stopObserving("EWS:treeHandler_GiveMeXml", this.getChildrenBinding);
    document.stopObserving('EWS:treeHandler_textClicked', this.nodeClickedBinding);
    document.stopObserving(this.applicationId + ':nodeSearch', this.nodeSearchBinding);
    document.stopObserving(this.applicationId + ':nodeSelected', this.nodeSelectedBinding);
    document.stopObserving('EWS:' + this.applicationId + '_correctDay', this.backTop.bindAsEventListener(this));

},

handleData: function(data) {
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
            objectToArray(data.EWS.o_root.yglui_str_parent_children).each(function(node) {
                structure.set(node['@otjid'], $H({}));
                structure.get(node['@otjid']).set(node['@otjid'], node);
            } .bind(this));
        } else {
            [data.EWS.o_parent].each(function(node) {
                structure.set(node['@otjid'], $H({}));
                structure.get(node['@otjid']).set(node['@otjid'], node);
            } .bind(this));
        }
        if (nodes) {
            structure.each(function(root) {
                objectToArray(nodes).each(function(nd) {
                    var rootID = nd['@rootty'] + nd['@rootid'];
                    if (rootID == root.key) {
                        structure.get(root.key).set(nd['@otjid'], nd);
                    }
                } .bind(this));
            } .bind(this));
        }
    } else {
        if (nodes) {
            objectToArray(nodes).each(function(nd) {
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
setHTML: function(data) {
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

    this.virtualHtml.down('span#' + this.applicationId + '_backTop').hide();
    this.virtualHtml.down('[id=' + this.applicationId + '_level6]').insert(ButtonJobCatalog.getButtons());
    if (!this.checkBoxes)
        this.virtualHtml.down('[id=' + this.applicationId + '_level6]').hide();
    this.virtualHtml.down('span#' + this.applicationId + '_backTop').observe('click', function() {
        this.backTop();
    } .bind(this));
    this.setTitleDiv();
    this.setAutoCompleterDiv();
    this.setDatePickersDiv();
    this.setLegendDiv();
    this.setTreeDiv();
    this.trees.each(function(tree) {
        tree.value.expandNodeById(tree.key);
    } .bind(this));
},
/**     
*@description It sets the first HTML level 
*/
setTitleDiv: function() {
    this.title = new Element('span', { className: 'application_main_title' });
    this.virtualHtml.down('div#' + this.applicationId + '_level1').insert(this.title.update('Generic Catalog Title')); //this.data.title));		
},
/**     
*@description It sets the second HTML level (the autoCompleter one)
*/
setAutoCompleterDiv: function() {
    this.autoCompleterLabel = new Element('span', { className: 'application_main_title3 test_label' });
    this.radioButtonsGroup = new Element('div', { id: this.applicationId + '_radioButtonsGroup', className: 'genCat_radioButtonsGroup' });
    this.virtualHtml.down('div#' + this.applicationId + '_level2').insert(this.autoCompleterLabel.update('Autocompleter Label').wrap('div', { className: 'genCat_label' })); //this.data.autocompleterLabel));
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
    var cont = 0;
    objectToArray(this.json.EWS.o_legend.item).each(function(element) {
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
        this.radioButtonsGroup.insert(radioButtonDiv);
    } .bind(this));
},
/**     
*@description It sets the third HTML level (the DatePickers one)
*/
setDatePickersDiv: function() {
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
setLegendDiv: function() {
    var aux = new Object();
    aux.legend = [];
    aux.showLabel = global.getLabel('showLgnd');
    aux.hideLabel = global.getLabel('closeLgnd');
    this.json.EWS.o_legend.item.each(function(element) {
        aux.legend.push({ img: this.CLASS_OBJTYPE.get(element['@otype']), text: element['@wegnr'], code: this.CLASS_OBJTYPE_CODE.get(element['@otype']) });
    } .bind(this));
    this.virtualHtml.down('div#' + this.applicationId + '_level4').update(getLegend(aux));
    this.legend = this.virtualHtml.down('div#' + this.applicationId + '_level4');
},
/**     
*@description It sets the fifth HTML level (the treeHandler one)
*/
setTreeDiv: function() {
    this.currentXMLs = $H();
    this.data.each(function(element) {
        this.currentXMLs.set(element.key, stringToXML(this.buildTreeXml(element.value)));
        var auxDiv = new Element('div', { 'id': 'div_' + element.key + '_' + this.applicationId + '_level5' });
        this.virtualHtml.down('div#' + this.applicationId + '_level5').insert(auxDiv);
        this.trees.set(element.key, new TreeHandler('div_' + element.key + '_' + this.applicationId + '_level5', this.currentXMLs.get(element.key), { checkBoxes: this.checkBoxes, type: this.type }));
    } .bind(this));
},
//********************************************************************************************
//UPDATING HTML
//********************************************************************************************
/**     
*@param text {String} label text to be set
*@description It updates the title label text.
*/
setTitle: function(text) {
    this.title.update(text);
},
/**     
*@param text {String} label text to be set
*@description It updates the autoCompleter level label text.
*/
setAutoCompleterLabel: function(text) {
    this.autoCompleterLabel.update(text);
},
/**     
*@param text {String} label text to be set
*@description It updates the DatePickers level label text.
*/
setDatePickersLabel: function(text) {
    this.datePickersLabel.update(text);
},
/**     
*@param text {String} label text to be set
*@description It updates the Legend level label text.
*/
setLegend: function(json) {
    this.legend.update(getLegend(json));
},
//********************************************************************************************
//UPDATING MODULES HTML
//********************************************************************************************	
/**     
*@param id {String} node id
*@param info {String/HTML} node additional information
*@description It shows a node additional information under its position in the treeHandler.
*/
showAdditionalInfo: function(id, info) {
    var aux = new Element('div', { className: 'treeHandler_text_node_content' });
    aux.update(info);
    this.virtualHtml.down('div#div_' + id + '_div_' + this.getRoot(id) + '_' + this.applicationId + '_level5').down('.genCat_additionalInfo').update(aux);
},
/**     
*@param id {String} node id
*@description It hides a node additional information.
*/
hideAdditionalInfo: function(id) {
    this.virtualHtml.down('div#div_' + id + '_div_' + this.getRoot(id) + '_' + this.applicationId + '_level5').down('.genCat_additionalInfo').update('');
},
/**     
*@param id {String} node id
*@description It toggles a node additional information.
*/
toggleAdditionalInfo: function(id, info) {
    if (!Object.isEmpty(this.virtualHtml.down('div#div_' + id + '_div_' + this.getRoot(id) + '_' + this.applicationId + '_level5'))
       && !Object.isEmpty(this.virtualHtml.down('div#div_' + id + '_div_' + this.getRoot(id) + '_' + this.applicationId + '_level5').down('.genCat_additionalInfo'))
       && !Object.isEmpty(this.virtualHtml.down('div#div_' + id + '_div_' + this.getRoot(id) + '_' + this.applicationId + '_level5').down('.genCat_additionalInfo').innerHTML)) {
        this.hideAdditionalInfo(id);
    } else {
        this.showAdditionalInfo(id, info);
    }
},
/**     
*@param results {JSON} search service results list
*@description It fills the autocompleter with the search service results list.
*/
showList: function(results) {
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
        objectToArray(results.EWS.o_objects.yglui_str_parent_children).each(function(node) {
            json.autocompleter.object.push({ text: node['@stext'], data: node['@otjid'] + '_' + node['@otype'] });
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
*@param data {JSON} node context
*@description It sets the node context on the treeHandler, after receiving it as the respond
*to the get node parent (context) information service.
*/
navigateTo: function(type, data) {
    this.trees.each(function(tree) {
        tree.value.stopObserving();
    } .bind(this));
    this.virtualHtml.down('div#' + this.applicationId + '_level5').update('');
    delete this.trees;
    this.trees = $H({});
    this.data = this.handleData(data);
    this.setTreeDiv();
    if (!Object.isEmpty(data) && !Object.isEmpty(data.EWS) && !Object.isEmpty(data.EWS.o_parent) && !Object.isEmpty(data.EWS.o_parent['@otjid'])) {
        this.trees.each(function(tree) {
            tree.value.expandNodeById(data.EWS.o_parent['@otjid']);
        } .bind(this));
    } else if (!Object.isEmpty(data) && !Object.isEmpty(data.EWS) && !Object.isEmpty(data.EWS.o_root)) {
        if (Object.isEmpty(type) || !Object.isString(type)) {
            this.trees.each(function(tree) {
                objectToArray(data.EWS.o_root.yglui_str_parent_children).each(function(root) {
                    tree.value.expandNodeById(root['@otjid']);
                } .bind(this));
            } .bind(this));
        }
        else {
            this.trees.get(type).expandNodeById(type);
        }
    }
    //We invoke the function to recovery the previous structure of tree 
    if (this.lastPushedNode && this.lastPushedNode.keys().length > 0) {
        var copylastPushedNode = deepCopy(this.lastPushedNode);
        for (var i = 0; i < this.lastPushedNode.keys().length; i++) {
            var key = this.lastPushedNode.keys()[i];
            var treeAux = this.trees.get(key);
            if (treeAux) {
                treeAux.recallOpenedNode(copylastPushedNode.get(key));
            }
        }
    }
},

returnSeveralJobs: function() {
    for (var i = 0; i < this.trees.keys().length; i++) {
        var selected = this.trees.get(this.trees.keys()[i]).getSelected().keys();
        if (Object.isEmpty(this.returnHash)) {
            this.returnHash = $H();
        }
        for (var j = 0; j < selected.length; j++) {
            var child = this.nodes.get(selected[j]);
            var parentId = child['parent'];
            if (Object.isEmpty(parentId)) {
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
    }
    if (this.returnHash.size() != 0) {
        document.fire('EWS:returnSelected', $H({ hash: this.returnHash, cont: this.cont, InScreen: this.widgetsFlag, sec: this.sec }));
    }
    this.popUpApplication.close();
    delete this.popUpApplication;
    this.close();

},

returnJob: function(params) {
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
*@description It expands a node in the treeHandler, showing its children.
*/
expandNode: function(json, ajaxId) {
    var auxXml = (this.currentXMLs.get(ajaxId)) ? this.currentXMLs.get(ajaxId) : this.currentXMLs.get(this.getRoot(ajaxId));
    var parentNode = selectSingleNodeCrossBrowser(auxXml, "/nodes//node[id='" + ajaxId + "']");
    var xml = stringToXML(this.buildTreeXml(this.handleData(json)));
    var children = selectNodesCrossBrowser(xml, "/nodes//node");
    for (var i = 0; i < children.length; i++) {
        var aux = children[i].cloneNode(true);
        parentNode.appendChild(aux);
    }
    var root = (this.nodes.get(this.getRoot(ajaxId)).id) ? this.nodes.get(this.getRoot(ajaxId)).id : ajaxId;
    var clickOn = 'div_' + ajaxId + '_div_' + root + '_' + this.applicationId + '_level5';
    document.fire('EWS:treeHandler_GiveMeXml_done', {
        xml: xml,
        clicked: clickOn
    });
    //Event used in the recovery "structure", it is listening in treeHandler.
    document.fire('EWS:treeHandler_GiveMeXml_done_recursiveNodes');
},
/**     
*@param args {JSON} node contextual actions
*@param ajaxId {String} node id and type
*@description It fills the Balloon object with a node contextual actions links:
*when clicking on each link (action) it will be fire the event this.applicationId+":action" 
*containing the related action information (default: the action name) as 
*the event sent parameters.
*/
showActions: function(args, ajaxId) {
    var elementId = 'treeHandler_text_' + ajaxId.split('_')[0] + '_div_' + ajaxId.split('_')[2] + '_' + this.applicationId + '_level5_' + ajaxId.split('_')[1];
    var element = this.virtualHtml.down('span#' + elementId);
    var divChild = element.down('td.treeHandler_textSize').down();
    var divChildId = divChild.identify();
    var html = new Element('div');
    if (args && args.EWS && args.EWS.o_actions && args.EWS.o_actions.yglui_vie_tty_ac) {
        objectToArray(args.EWS.o_actions.yglui_vie_tty_ac).each(function(action) {
            var name = action['@actio'];
            var text = action['@actiot'];
            var app = action['@tarap'];
            var okCode = action['@okcod'];
            var nodeId = ajaxId.split("_")[0];
            var nodeName = this.nodes.get(nodeId).textName;
            var nodeType = ajaxId.split('_')[1];
            var view = action['@views'];
            var tarty = action['@tarty'];
            var tartb = action['@tartb'];
            var disma = action['@disma'];
            var span = new Element('div', { 'class': 'application_action_link genCat_balloon_span test_link' }).insert(text);
            html.insert(span);
            span.observe('click', document.fire.bind(document, this.applicationId + ":action", $H({
                name: name,
                nodeId: nodeId,
                nodeName: nodeName,
                application: app,
                nodeType: nodeType,
                okCode: okCode,
                view: view,
                tarty: tarty,
                tartb: tartb,
                disma: disma
            })));
        } .bind(this));
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
getRoot: function(id) {
    if (this.nodes.get(id).parent) {
        return this.getRoot(this.nodes.get(id).parentType + this.nodes.get(id).parent);
    } else {
        return id;
    }
},
/**     
*@param name {String} node name
*@param otype {String} node type
*@description It formats a node name so as to be properly shown on the treeHandler 
*(assigning it the correct className --> to show the proper tree icon)
*/
formatName: function(name, otype) {
    //if lite version, we use a code instead of an icon
    var iconCode = "";
    var title = "";
    if (global.liteVersion) {
        iconCode = this.CLASS_OBJTYPE_CODE.get(otype);
        title = this.labels.get(otype);
    }
    return "<![CDATA[<table class='genCat_alignSpanInTree'>]]>" +
	            "<![CDATA[<tr><td class='treeHandler_iconSize'><span class='treeHandler_text_node_content test_treeElement " + this.CLASS_OBJTYPE.get(otype) + " genCat_iconInTree' title = '" + title + "'>" + iconCode + "</span></td>]]>" +
                "<![CDATA[<td class='treeHandler_textSize'><span class='treeHandler_text_node_content test_treeElement'>" + name + "</span></tr><tr><td class='genCat_additionalInfo' colspan='2'></td><td></td></tr></table>]]>";
},
/**     
*@param json {JSON} nodes list
*@param save {Boolean} true/false: to keep the result or not as the currentXML
*(depending on if we are changing the node context or not, i mean completely refreshing
*the treeHandler)
*@description It turns a SAP node list into the proper format to be shown on the treeHandler
*/
buildTreeXml: function(json) {
    var text = '<nodes>';
    var numberNoRoot = 0;
    json.each(function(node) {
        aux = {
            name: node.value['@stext'],
            id: node.value['@otjid'],
            type: node.value['@otype'],
            plvar: node.value['@plvar'],
            children: (node.value['@parnt'] && (node.value['@parnt'].toLowerCase() == 'x')) ? 'X' : '',
            parent: node.value['@rootid'],
            parentType: node.value['@rootty'],
            select: (Object.isEmpty(node.value['@select'])) ? "" : node.value['@select'],
            textName: node.value['@stext'],
            checkRoot: node.value['@select_root'],
            checked: (Object.isEmpty(node.value['@checked'])) ? null : 'X'
        };
        this.nodes.set(aux.id, aux);
        var stext = node.value['@stext'].gsub('<', '&lt;');
        stext = stext.gsub('>', '&gt;');
        aux.name = this.formatName(stext, node.value['@otype']);
        text += (node.value['@rootid']) ? this.templateNodes.evaluate(aux) : this.templateRoot.evaluate(aux);
        if (node.value['@rootid']) numberNoRoot++;
    } .bind(this));
    text += (json.size() == numberNoRoot) ? '</nodes>' : '</node></nodes>';
    return text;
},
//********************************************************************************************
//SAP REQUESTS
//********************************************************************************************
backTop: function(type) {
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
        successMethod: this.navigateTo.bind(this, type)
    }));
    this.virtualHtml.down('span#' + this.applicationId + '_backTop').hide();
},
/**     
*@description Initial service which gets the labels and root node context to be shown
*on the treeHandler.
*/
getInitialData: function() {
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
nodeSearch: function(args) {
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
            ///In learning catalogue there is no radiobuttons
            if (this.radioButtonsGroup) {
                this.radioButtonsGroup.childElements().each(function(radioButton) {
                    if (radioButton.down().checked == true)
                        objectTypeSearch = radioButton.down().value;
                } .bind(this));
            }
            //this.autoCompleter.loading();
            var autoCompText = this.autoCompleter.element.getValue();
            autoCompText = ((autoCompText.split(global.idSeparatorLeft))[0].split('['))[0].strip();
            var xml = "<EWS>" +
						        "<SERVICE>" + this.searchService + "</SERVICE>" +
						        "<DEL></DEL>" +
						        "<PARAM>" +
							        "<CONTAINER_PARENT>" + this.containerParent + "</CONTAINER_PARENT>" +
							        "<CONTAINER_CHILD>" + this.containerChild + "</CONTAINER_CHILD>" +
							        "<PATTERN>" + escapeHTML(autoCompText) + "</PATTERN>" +
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
nodeChildren: function(args) {
    var aux = this.nodes.get(getArgs(args).split('_')[1]);
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
    this.makeAJAXrequest($H({ xml: xml, successMethod: 'expandNode', ajaxID: aux.id }));

},
/**     
*@param args {Event} event thrown by the autoCompleter when a node has been selected from 
*its search results list.
*@description It gets a node context (parent and siblings) from SAP.
*/
nodeSelected: function(args) {
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
                    this.makeAJAXrequest($H({
                        xml: xml,
                        successMethod: this.navigateTo.bind(this, null),
                        ajaxID: id
                    }));
                    this.virtualHtml.down('span#' + this.applicationId + '_backTop').show();
                } else {
                    this.backTop();
                }
            }
        }
    }
},
/**     
*@param node node of the tree.
*@description Return the name of the tree of the node
*/
getTree: function(node) {
    for (var i = 0; i < this.trees.keys().length; i++) {
        if (node.id.include(this.trees.keys()[i])) {
            return this.trees.keys()[i];
        }
    }
    return null;
},
/**     
*@param args {event} event thrown by the treeHandler when a node name has been clicked.
*@description It gets a node contextual actions from SAP.
*/
nodeClicked: function(args) {

    //We keep the chain of pushed nodes, for recovery the structure of tree after the end of the services.
    this.lastPushedNode = $H();
    var opened = $(getArgs(args).get('treeName')).select(".application_down_arrow")
    for (var i = 0; i < opened.length; i++) {
        var parent = opened[i].up();
        var treeId = this.getTree(parent);
        if (this.lastPushedNode.get(treeId))
            this.lastPushedNode.get(treeId).push(parent.id);
        else {
            var array = $A();
            array.push(parent.id);
            this.lastPushedNode.set(treeId, array);
            var i = 0;
        }
    }
    if (this.arguments) {
        if (!this.checkBoxes) {
            var params = getArgs(args);
            this.returnJob(params);
        }
    }
    else {
        //If we are in popup mode we won't show the actions ballon (it won't be visible anyway) so we won't call this service
        if (!this.popupMode) {
            var aux = getArgs(args).get('nodeName') + '_' + getArgs(args).get('treeName').split('_')[1];
            var dateSAP = this.datePickerBeg.getActualDate();
            var xml = "<EWS>" +
	                        "<SERVICE>" + this.nodeClickedService + "</SERVICE>" +
	                        "<OBJECT TYPE='" + aux.split('_')[1] + "'>" + aux.split('_')[0].gsub(aux.split('_')[1], '') + "</OBJECT>" +
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
genericDeleteRequest: function(oType, objectId, actionId, appName, code) {
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
genericDeleteAnswer: function(answer) {
    if (answer.EWS) {
        this.backTop();
    }
},
/**
* @description Method that deletes a course type/group or curriculum type after the user confirmation
*/
genericDelete: function(oType, objectId, actionId, appName, message, code) {
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
    var callBack = function() {
        if (_this)
            _this.genericDeleteRequest(oType, objectId, actionId, appName, code);
        deleteCataloguePopUp.close();
        delete deleteCataloguePopUp;
    };
    var callBack3 = function() {
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
            'callBack': function() {
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