/**
 * @class
 * @description Class displaying a tree with vertical dotted line to link the nodes.<br>
 * The tree also provides the possibility to have checkbox having three states and the possibility to have icons for each node.<br>
 * The three states of the checkboxes are based on following principle:<ul>
 * 	<li>When an element is preceded  with an empty checkbox, means node is not selected and none of his children,</li>
 *  <li>When the element is preceded with a checked checkbox, means node is selected as well as <b>all</b> its children (if any),</li>
 *  <li>When the element is preceded with a checked checkbox with gray background, means the element is not fully selected but at least one of its children is.</li>
 * @author JonathanJ
 * @version 2.0
 */
var linedTree = Class.create(/** @lends linedTree.prototype*/{
	/**
	 * Identifier of the tree
	 */
	_id : null,
	/**
	 * Element in which the tree should be inserted.
	 * @type DOM Div
	 * @since 1.0
	 */
    _ident : null,
	/**
	 * An array of JSon objects representing the structure of the tree.<br>
* These JSon objects MUST have the following structure:
* <ul>
	 * 	<li>id: The node Id,</li>
	 *  <li>title: The title of the node,</li>
	 *  <li>value: The value to be displayed for the node,</li>
*  <li>extraText: (string) If you want to show a extra text, appart of the normal text. If not, leave this field empty or null,</li>
*  <li>extraTextClass: (string) the class for the extra text,</li>
*  <li>extraIcons: (array) Array with the classes for the extra icons, if you don´t want to insert any extra icons, leave this field empty or null,</li>
	 *  <li>parent: The parent node Id (null if node is a "top" node),</li>
	 *  <li>isOpen: Flag to know if the node should be open (always true for the last elements in the hierarchy),</li>
	 *  <li>isChecked: Integer representing the status of the checkbox, it can be:<ul>
	 *  	<li>0 - Not selected (always 0 if not the a last element of the hierarchy),</li>
	 *  	<li>1 - Gray selection (internally set, do not use in the tree definition),</li>
	 *  	<li>2 - Selected, use this value on the last descendant of the tree if it should be selected by default.</li>
	 *  </ul></li>
	 *  <li>hasChildren: flag meaning if the node has children and if they should be displayed (the "children" element is not evaluated if this flag is false),</li>
	 *  <li>children: Array of children represented by the same JSon object as this one.</li>
	 *  <li>nodeIcon: String representing the CSS class(es) to be aplied as icon<b>*</b> of the node</li>
	 * </ul>
	 * <b>*</b><u><i>Note on the icon size:</i></u>The height of the icon, including the margin or/and padding, cannot be larger than 18px. 
	 * @type JSon
	 * @since 1.0
	 */
	_treeArray : null,
	/**
	 * Hash of defined nodes.
	 * @type Hash
	 * @since 1.0
	 */
	_nodes : null,
	/**
	 * Hash of arrays. The key is the level, the value is an array of nodes.
	 * @type Hash
	 * @since 1.0
	 */
	_nodesByLevel : null,
	/**
	 * Maximum depth based on the treeArray definition
	 * @type int
	 * @since 1.0
	 */
	_maxLevel : null,
	/**
	 * Flag to know if the processed node is the first of the tree. Ths flag is needed as the first node of the tree is using a different icon than the others.
	 * @type boolean
	 * @since 1.0
	 */
	_isFirst : null,
	/**
	 * Hash of arrays. The key is a parent node and the value is an array of direct children.
	 * @type Hash
	 * @since 1.0
	 */
	_parentToChildren: null,
	/**
	 * Static attribute representing the - sign displayed when a node is open.
	 * @type String
	 * @since 1.0
	 */
	_minusClass		: 'linedTree_minus',
	/**
	 * Static attribute representing the + sign displayed when a node is closed.
	 * @type String
	 * @since 1.0
	 */
	_plusClass		: 'linedTree_plus',
	/**
	 * Static attribute representing the dotted vertical line displayed when a node is open.
	 * @type String
	 * @since 1.0
	 */
	_lineClass		: 'linedTree_line',
	/**
* Static attribute representing the spacer class.
* @type String
* @since 1.0
*/
_linedTree_spacerClass: 'linedTree_spacer',
/**
* Static attribute representing the spacer class.
* @type String
* @since 1.0
*/
_linedTree_TextClass: 'linedTreeText',
/**
* Static attribute representing the suffix to add when running the lite version.
* @type String
* @since 1.0
*/
_liteSuffix: '_lite',
/**
	 * Flag meaning if the tree should be displayed with checkboxes
	 * @type boolean
	 * @since 1.0
	 */
	_useCheckBox	: null,
	/**
* Flag meaning if the tree should be displayed with checkboxes, but only in the nodes appropriately indicated.
* @type boolean
* @since 2.0
*/
allowCheckBoxesSomeNodes : null,
/**
* Flag meaning if the tree should be displayed with radio buttons.
* @type string
* @since 2.0
*/
type : null,
/**
	 * Flag meaning if the tree should display icons in front of the node text
	 * @type boolean
	 * @since 1.0
	 */
	_useIcons		: null,
	/**
	 * The id of the last selected node, used if the checkbox are not.
	 * @type int
	 * @since 1.0
	 */
	_selectedNode 	: null,
	/**
	 * The events to be fired by the tree on selection of a node (checkbox or click on a line).
	 * @type {Hash} A hash containing the events
	 * @since 1.0
	 */
	_objEvents		: null,
	
	_defaultedNodeSelected: null,
	
	_raiseEventOnDefaultSelection: null,
	/** Used to return not only child nodes, but all selected nodes, when clicking in a checkbox */
	_returnAllNodesOnSelection: false,
	/** If it is true, only one node at a time can be selected */
	_spreadSelection: false,
	
    /**
     * Constructor for the class.<br>
     * It initialize the different class attributes and launches the tree display. 
     * @param {String} ident The id of the DOM Div element the tree should be inserted in.
     * @param {Array} treeArray An array of JSon objects representing the tree structure (see <a href=linedTree.html#_treeArray>the treeArray attribute</a>).
     * @param {JSon} params A json object with the parameters of the tree display. The recognized parameters are:
     * <ul><li>useCheckBox : boolean meaning if the checkbox are used in the tree,</li>
     * <li>useIcons: boolean meaning if icons are defined for the nodes,</li>
     * <li>defaultSelection: id of the node that should be selected by default WHEN THE CHECKBOX ARE NOT USED,</li>
     * <li>forceEventOnSelection: boolean meaning if the event "onNodeSelection" should be raised when a checkbox is changed, it forces the raise event,</li>
* <li></li>
     * <li>objEvents: Hash of events to be fired by the tree, these events can be:<ul>
     * 	<li>onNodeSelection --> event to be fired when a node is selected</li>
* 	<li>onCheckBoxClick --> event to be fired when a checkbox/radioButton changes status</li>
     *  <li>onNodeOpen		--> event to be fired when a node is opened</li>
     *  <li>onNodeClose		--> event to be fired when a node is closed</li>
     *  <li>onNodeOver		--> event to be fired when a node is closed</li>
     *  <li>onNodeOut		--> event to be fired when a node is closed</li>
     *  <li>spreadSelection        --> if true, selection won't spread to childs and parents</li>
     *  <li>returnAllNodesOnSelection      --> If set to true, we will return all selected nodes, not just the ones that are leaves</li></ul>
     * </li></ul>
     * @see linedTree#_buildTree
     * @since 1.0
     */
    initialize: function(ident, treeArray, params){
    if (global.liteVersion) {
        this._minusClass = "linedTree_minus_lite";
        this._plusClass = "linedTree_plus_lite";
        this._lineClass += this._liteSuffix;
        this._linedTree_spacerClass += this._liteSuffix;
        this._linedTree_TextClass += this._liteSuffix;
    }

		if(Object.isElement(ident)){
			this._id = ident.identify(); 
		}else{
		this._id = ident; 
		}
        this._ident = $(ident);
		this._ident.addClassName('linedTreeContainer');
		
		this._treeArray = treeArray;		
        this._isFirst = true;
	this.allowCheckBoxesSomeNodes = false;
		this._useCheckBox = false;
		this._useIcons = false;
		this._raiseEventOnDefaultSelection = false;
		
		if (!Object.isUndefined(params)) {
			if (params.useCheckBox)
				this._useCheckBox = params.useCheckBox;
		if(!this._useCheckBox){//there is not sense if this variable is true, that the other one is true, too
		     if (params.allowCheckBoxesSomeNodes){
				this.allowCheckBoxesSomeNodes = params.allowCheckBoxesSomeNodes;
				this._spreadSelection = params.allowCheckBoxesSomeNodes;
				if(params.type)this.type = params.type
		     }
		}
			if (params.useIcons)
				this._useIcons = params.useIcons;
			if (params.objEvents)
				this._objEvents = params.objEvents;
			if (params.defaultSelection)
				this._defaultedNodeSelected = params.defaultSelection;
			if (params.raiseEventOnDefaultSelection)
				this._raiseEventOnDefaultSelection = params.raiseEventOnDefaultSelection;
			if (params.returnAllNodesOnSelection)
                this._returnAllNodesOnSelection = params.returnAllNodesOnSelection;
			if (params.spreadSelection)
                this._spreadSelection = params.spreadSelection;
			if(params.forceEventOnSelection)
				this._forceEventOnSelection = params.forceEventOnSelection;
		}
		this._maxLevel = 0;
		this._nodes = $H();
		this._nodesByLevel = $H();
		this._parentToChildren = $H();
    // Disable using icons in the liteVersion
    if (global.liteVersion) {
        if(Object.isUndefined(this._treeArray[0].liteVersion)){
        this._useIcons = false;
        }
    }
		this._buildTree();
    },
	
	
	/**
	 * Function in charge of building the tree.<br>
	 * Building the tree means parsing the array of JSon representing the tree, create the relations between parents and children,
	 * generate the HTML of each line, insert the created lines in the container and set the checkbox the should be checked by default.
	 * @see linedTree#_readTreeArray
	 * @see linedTree#_buildParentToChildRelation
	 * @see linedTree#_buildNodeLines
	 * @see linedTree#_generateTreeHtml
	 * @see linedTree#_setDefaultSelectedNodes
	 * @since 1.0
	 */
	_buildTree:function(){
		this._readTreeArray(this._treeArray, false, 0);
		this._buildParentToChildRelation();
		this._buildNodeLines();
		this._generateTreeHtml();
		
	if(this._useCheckBox || this.allowCheckBoxesSomeNodes){
	    if(this.type != "radio"){
			this._setDefaultSelectedNodes();
        }
    }else{
			this._setDefaultedNodeSelected();
    }
	},
	/**
	 * Function in charge of refresing the tree displayed when the tree should be changed.<br>
	 * This function resets the intenal variables to the basic values and calls the method to build the three with the new array of JSon given in parameter.
	 * @param {Array} treeArray An array of JSon objects representing the structure of the tree (see <a href=linedTree.html#_treeArray>the treeArray attribute</a>).
	 * @see linedTree#_buildTree
	 * @since 1.0
	 */
	refreshTree:function(treeArray){
		this._ident.update();
		
		this._treeArray = treeArray;		
        this._isFirst = true;
		this._maxLevel = 0;
		this._nodes = $H();
		this._nodesByLevel = $H();
		this._parentToChildren = $H();
		
		this._buildTree();
	},
    /**
     * Function parsing the array of JSon in order to created the internal representation of the tree.<br>
     * This function will define the maxLevel of the tree, create the internal object representing the node and add this representation 
     * in the array of nodes. This function is called recursivly in order to process all the nodes.
     * @param {Array} array The array of JSon to be parsed
     * @param {boolean} isChild Flag meaning if the current Array is a child of an other array
     * @param {int} level The current level processed, incremented at each recursiv call
     * @param {boolean} parentHasDescendant Flag meaning if the parent node will have other nodes of the same level (used to create the display)
     * @param {boolean} parentIsOpen Flag meaning if the parent node is open, and so if the children should be displayed or hidden and to define the sign needed (+ or -).
     * @see linedTree#_createNodeObject
     * @see linedTree#_setNodeInHash
     * @since 1.0
     */
    _readTreeArray: function(array, isChild, level, parentHasDescendant, parentIsOpen){
		var hasFollowers;
		var currentElem = 1;
        var arrayLength = array.size();

		if(level > this._maxLevel)
			this._maxLevel = level;

		for (var i = 0; i < array.size(); i++) {
			var node = array[i];
			currentElem == arrayLength? hasFollowers = false: hasFollowers = true;
			level == 0? parentHasDescendant = hasFollowers:parentHasDescendant=parentHasDescendant;
			if (node.parent != -1) {
				var nodeJson = this._createNodeObject(node, level, hasFollowers, parentHasDescendant);
				this._setNodeInHash(node.id, nodeJson, level);
				if (node.hasChildren == true) {
					this._readTreeArray(node.children, true, ++level, hasFollowers);
					level--;
				}
			}
			currentElem++;
		}
    },
	/**
	 * Function in charge of creating the internal JSon representation of a node of the tree.<br>
	 * @param {JSon} node The JSon representing the node coming from the tree definition array of JSon
	 * @param {int} level The node level
	 * @param {boolean} hasFollowers Flag meaning if the node has other node of the same level after itself
	 * @param {boolean} parentHasDescendant Flag meaning if the parent node has descendant
	 * @returns {JSon} A JSon object representing internally the node.
	 * @since 1.0
	 */
	_createNodeObject:function(node, level, hasFollowers, parentHasDescendant){
		var nodeJson = {
			id				: node.id,
			parentId		: node.parent,
			hasChildren		: node.hasChildren,
			level			: level,
			isFirst			: this._isFirst,
			hasDescendants	: hasFollowers,
			isOpen			: node.isOpen,
			text			: node.value,
			title			: node.value,
			parentHasDescendants: parentHasDescendant,
			isHidden 		: false,
			classSuffix		: null,
			classCheckBox	: null,		
			nodeIcon		: null,
        extraIcons:null,
        extraText:null,
        liteVersionIcon:node.liteVersion,
        extraTextClass:null,
			isChecked		: null,
        html: null,
        expandCollapseId: this._id + '_linedTreeIco_' + node.id,
        checkboxId: this._id + '_linedTreeChk_' + node.id,
        textNodeId: this._id + '_linedTreeTxt_' + node.id,
        iconId: this._id + '_linedTreeIcon_' + node.id,
        descendantsId: this._id + '_linedTreeDesc_' + node.id
		}
    if (this._useCheckBox || this.allowCheckBoxesSomeNodes){
        nodeJson.isChecked = node.isChecked;
        nodeJson.checkRoot = node.checkRoot;
        nodeJson.select = node.select;
    }
		if(this._useIcons == true)
			nodeJson.nodeIcon= node.nodeIcon
    if(node.extraIcons){
        nodeJson.extraIcons = node.extraIcons;
    }
    if(node.extraText && node.extraTextClass){
        nodeJson.extraText = node.extraText;
        nodeJson.extraTextClass = node.extraTextClass;
    }
		if(!Object.isUndefined(node.title))
			nodeJson.title = node.title;
			
		this._isFirst = false;
		return nodeJson;
	},
	/**
	 * Function in charge of adding the JSon object representing the node in the class attributes.<br>
	 * This function will add the JSon object in two Hash, the _nodes and _nodesByLevel hashes.
	 * For the _nodes hash, the nodeId is used as key; for the _nodesByLevel hash, the level is used.
	 * @param {String} nodeId The node identifier
	 * @param {JSon} nodeJson The internal representation of the node
	 * @param {int} level The node level
	 * @since 1.0
	 */
	_setNodeInHash:function(nodeId, nodeJson, level){
		this._nodes.set(nodeId, nodeJson);
		if(Object.isUndefined(this._nodesByLevel.get(level)))
        this._nodesByLevel.set(level, $A());
    this._nodesByLevel.get(level).push( nodeJson);
	},
	/**
	 * This function is in charge of building the relations from a parent to all its direct children.<br>
	 * This function will process all levels and call the function _parentToChildren in order to build the list of the children of the current processed node.
	 * @see linedTree#_parentToChildren
	 * @since 1.0
	 */
	_buildParentToChildRelation:function(){
		var level = this._maxLevel - 1;
		while(level >= 0){
          for(var i = 0; i < this._nodesByLevel.get(level).size();i++){
                var children = this._identifyChildrenFromParent(this._nodesByLevel.get(level)[i].id, level);
				if(children.size()>0){
                    this._parentToChildren.set(this._nodesByLevel.get(level)[i].id, children);
				}
          }
//        this._nodesByLevel.get(level).each(function (parent) {//////
//            var stop = 1;
//            var children = this._identifyChildrenFromParent(parent.key, level);
//            if (children.size() > 0) {
//                this._parentToChildren.set(parent.key, children);
//            }
//        }, this);

			level--;
		}
	},
	/**
	 * Function in charge of generation an array containing all the direct children of the given node id.<br>
	 * @param {String} parentId The node id for which the children should be retrieved
	 * @param {int} level The level of the current node
	 * @returns {Array} An array containing the Ids of the direct descendants.
	 * @since 1.0
	 */
	_identifyChildrenFromParent:function(parentId, level){
		if (this._nodesByLevel.get(level + 1)) {
			var children = this._nodesByLevel.get(level + 1).collect(function(node){
            if (node.parentId == parentId)
                return node.id;
				else 
					return null
			}, this);
			return children.compact();
		}
		return $A();
	},
	/**
	 * Function in charge of creating the HTML code representing all the nodes of the tree.<br>
	 * It will process all the nodes of each level and calls the _generateNodeHtml on each node.
	 * @see linedTree#_generateNodeHtml
	 * @since 1.0
	 */
	_buildNodeLines:function(){
		var level = this._maxLevel;		
		while(level >= 0){			
			var hashOfNodesId = this._nodesByLevel.get(level);
			if (hashOfNodesId) {
            var keys = hashOfNodesId.size();
            for (var i = 0; i < keys; i++) {
                this._generateNodeHtml(hashOfNodesId[i]);
            }
			}
			level--;
		}	
	},
	/**
	 * Function in charge of creating the div that will represent the node and its descendants.<br>
	 * Once the div is created, it will be added as the HTML component of the internal node representation in JSon format.
	 * The function _insertIcons will the be called in order to generate the set of icons that should be displayed before the text,
	 * This set of icons contains the checkbox, vertical lines, corner lines, white spacer,...
	 * @param {JSon} node The internal JSon representation of the node
	 * @see linedTree#_insertIcons
	 * @since 1.0
	 */	
	_generateNodeHtml: function(node){
		var createdDiv = new Element('div', {'id':this._id +'_linedTreeNode_'+node.id, 'parentNodeId':node.parentId, 'nodeId':node.id});
		node.html = createdDiv;
		this._insertIcons(node);
	},
	/**
	 * Function in charge of adding the span containing the icons in the div dedicated for a node.<br>
	 * The order and type of icons are defned by the different properties of the internal representation of the node.
	 * It's also here that the event listener will be set on the +/- signs and on the checkbox.
	 * @param {JSon} node The internal JSon representation of the node
	 * @since 1.0 - Changed in 2.0 to add the cursor as a hand on the mouse over the nodes if the checkbox are not used.
	 */
	_insertIcons:function(node){
		var maxWidth = this._ident.clientWidth - 20;
		var currentLevel = node.level + 1;
		
		var maxAvailableSize = maxWidth - (currentLevel*18);
		if(this._useCheckBox == true)
			maxAvailableSize -= 18;
		if(this._useIcons == true)
			maxAvailableSize -= 18;

		
		var addListenerOnClick = false;
		var lineHeight = '18px';
		if(Prototype.Browser.IE)
			lineHeight = '16px';
			
		var html = node.html;
		
		var textOfNode = new Element('div',{'style':'height:'+lineHeight+';' /*width:'+ maxAvailableSize +'px;*/ + ' overflow:hidden;'}); /*float:left;*/
		
    // var nodeTextContent = this._getNodeTextElement(this._id + '_linedTreeTxt_' + node.id, this._linedTree_TextClass, node.text);
    var nodeTextContent = this._getNodeTextElement(node.textNodeId, this._linedTree_TextClass, node.title);
    nodeTextContent.update(node.text);
	node.textElement = nodeTextContent;

    textOfNode.insert(nodeTextContent);
    if(node.extraText && node.extraTextClass){
        var idExtraText = node.textNodeId + "_extraText";
        var nodeExtraTextContent = this._getNodeTextElement(idExtraText, node.extraTextClass, ""); 
        nodeExtraTextContent.update(node.extraText);
        textOfNode.insert(nodeExtraTextContent);
    }
    if (!Object.isEmpty(this._objEvents) && !Object.isEmpty(this._objEvents.get('onNodeOver'))) {
        nodeTextContent.observe('mouseover', function () {
            document.fire(this._objEvents.get('onNodeOver'), {
                selection: node.id
            });
        } .bind(this));
    }
    if (!Object.isEmpty(this._objEvents) && !Object.isEmpty(this._objEvents.get('onNodeOut'))) {
        nodeTextContent.observe('mouseout', function () {
            document.fire(this._objEvents.get('onNodeOut'), {
                selection: node.id
            });
        } .bind(this));
    }


    var clear = new Element("div", { "class": "linedTree_clearing" });
    var linedTreeDesc = new Element("div", { "id": node.descendantsId });
	node.child = linedTreeDesc;


    html.insert(textOfNode);
    html.insert(clear);
    html.insert(linedTreeDesc);

    if (this._useIcons == true) {
        if (global.liteVersion) {
            if(!Object.isEmpty(node.liteVersionIcon)){
                if(node.extraIcons){
                    for(var i = 0; i<node.extraIcons.length; i++){
                        html.insert({ top: new Element("span", { "class": node.extraIcons[i].cssClass /*+ " genCat_iconInTree"*/}).insert(node.extraIcons[i].icon) });
                    }         
                }
                html.insert({ top: new Element("span", { "id": node.iconId, "class": node.nodeIcon }).insert(node.liteVersionIcon)});
            }
        }else{
        if(node.extraIcons){
            for(var i = 0; i<node.extraIcons.length; i++){
                html.insert({ top: new Element("span", { "class": node.extraIcons[i] /*+ " genCat_iconInTree"*/}) });
            }         
        }
        html.insert({ top: new Element("span", { "id": node.iconId, "class": node.nodeIcon }) });
        }
    }

    if (this._useCheckBox == true) {
        var threeState = new Element("div", { "class": "linedTree_ThreestateContainer" });
        node.checkbox = ThreeStateCheckbox.getCheckbox(global.liteVersion, threeState, 0, node.checkboxId, global.getLabel("select"), global.getLabel("deselectAll"));
        html.insert({ top: threeState });
    }
    //This part is for the  checkBoxes and radiobuttons of the new genericCatalog
    if(this.allowCheckBoxesSomeNodes){
	    if(!node.hasChildren || node.checkRoot == "X"){
	        if(this.type == "radio"){
	           var group = "radioButton";
	           var threeState = new Element("div", { "class": "linedTree_ThreestateContainer" });
	           node.radioButton =  this._insertRadioButtons(threeState,group,node.id);
	           html.insert({ top: threeState });
	           if(node.select != "X"){
	                Form.Element.disable(node.radioButton);
	           }
	        }else{
	            var threeState = new Element("div", { "class": "linedTree_ThreestateContainer" });
                node.checkbox = ThreeStateCheckbox.getCheckbox(global.liteVersion, threeState, 0, node.checkboxId, global.getLabel("select"), global.getLabel("deselectAll"));
                html.insert({ top: threeState });
	            //If it's not selectable, we disable it
                if(node.select != "X"){
                    this._disableCheckBox(node.checkbox);
                }
	        }
	    }
	}
    if (node.isFirst) {
        node.hasDescendants ? node.classSuffix = '4' : node.classSuffix = '5';
    } else {
        node.hasDescendants ? node.classSuffix = '3' : node.classSuffix = '2';
    }

    if (node.hasChildren == true) {
        addListenerOnClick = true;
        if (node.isOpen) {
            node.classPrefix = this._minusClass;
        }
        else {
            node.classPrefix = this._plusClass;
            node.child.addClassName('linedTree_hidden');
        }
    } else {
        node.classPrefix = this._lineClass;
    }

    var expCollapse = this._getExpandCollapse(node.expandCollapseId, node.classPrefix, node.classSuffix); ;
    html.insert({ top: expCollapse });
	node.expCollapse = expCollapse;

    var parentId = node.parentId;
    while (parentId != null) {
        var parentNode = this._nodes.get(parentId);
        var spacerClass;
        if (parentNode.hasDescendants) {
            spacerClass = this._linedTree_spacerClass + " linedTree_collapseIcon";
        } else {
            spacerClass = "linedTree_whiteSpacer linedTree_collapseIcon";
        }
        html.insert({ top: new Element("span", { "class": spacerClass }) });
        parentId = parentNode.parentId;
    }
    if (addListenerOnClick) {
        expCollapse.observe('click', this._manageChildrenDisplay.bindAsEventListener(this, node.id));
    }

    if (this._useCheckBox == true || (this.allowCheckBoxesSomeNodes && (!node.hasChildren || node.checkRoot == "X"))) {
        document.observe("EWS:ThreeStateCheckbox_Click" + node.checkboxId, this._manageCheckBoxClickEvent.bindAsEventListener(this, node.id));
        if (this._forceEventOnSelection) {
            nodeTextContent.observe('click', this._manageNodeClickEvent.bindAsEventListener(this, node.id));
            nodeTextContent.addClassName('linedTree_mousePointer');
        }
    }
    else {
        nodeTextContent.observe('click', this._manageNodeClickEvent.bindAsEventListener(this, node.id));
        nodeTextContent.addClassName('linedTree_mousePointer');
    }
},
/*
* This function will be called when any checkbox have to be disabled.
*/
_disableCheckBox: function(checkbox){
    if(!global.liteVersion){
        if(checkbox._span.hasClassName("linedTree_check0")){
            var className = "linedTree_check0";
        }
        if(checkbox._span.hasClassName("linedTree_check1")){
            var className = "linedTree_check1";
        }
        if(checkbox._span.hasClassName("linedTree_check2")){
            var className = "linedTree_check2";
        }
        checkbox._span.removeClassName(className);
        checkbox._span.removeClassName("linedTree_cursor");
        checkbox._span.addClassName("linedTree_check3_disabled");
        checkbox._span.stopObserving("click");
    }else{
        Form.Element.disable(checkbox._checkbox);
    }
},
/*
* This function inserts the radioButtons when we are in the normal version.
* param targetDiv (div) div where we insert the radiobutton
* param group (string) name of the radioButton group
* param nodeId (string) id node
*/
_insertRadioButtons: function(targetDiv,group,nodeId){
    var node = this._nodes.get(nodeId);
    if(node.isChecked == 2){
        var radioButton = new Element("input",{
            "name":group,
            "type":"radio",
            "class":"linedTree_checkIcon"
        });
        radioButton.checked = true;
        radioButton.defaultChecked = true;
    }else{
        var radioButton = new Element("input",{
            "name":group,
            "type":"radio",
            "class":"linedTree_checkIcon"
        });
    }
    radioButton.observe("click", this._manageRadioButtonClickEvent.bindAsEventListener(this, nodeId));
    targetDiv.insert(radioButton);
    return radioButton;
},
/*
* This function is call when we click in a radioButton.
* param event
*/
_manageRadioButtonClickEvent: function(event){
    var clickedElemId = $A(arguments)[1];
    var node = this._nodes.get($A(arguments)[1]);
    if(node.isChecked == 0){
        node.isChecked = 2;
    }   
    if (!Object.isEmpty(this._objEvents) && !Object.isEmpty(this._objEvents.get('onCheckBoxClick')))
        document.fire(this._objEvents.get('onCheckBoxClick'), { selection: clickedElemId });
	},
	/**
	 * Function in charge of displaying the tree in the container.<br>
	 * This function will add all the generated div accordingly to their attributes in the parent nodes corresponding and
	 * will then display all the first level nodes in the container.
	 * @since 1.0
	 */
	_generateTreeHtml:function(){
		var level = this._maxLevel;
		while (level >= 0) {
			if (this._nodesByLevel.get(level)) {
				this._nodesByLevel.get(level).each(function(nodeObj){
                var node = nodeObj;
					if (node.parentId != null) {
						var parentNode = this._nodes.get(node.parentId);
					parentNode.child.insert(node.html);
					}
				}, this);
			}
			level--;
		}
		this._nodesByLevel.get(0).each(function(nodeObj){
        var nodeId = nodeObj.id;
			var node = this._nodes.get(nodeId);
			this._ident.insert(node.html);
		}, this);
		
	},
	/**
	 * Function in charge of responding to the event raised when a +/- sign is clicked.<br>
	 * It will change the +/- sign displayed and call the function _hideChildren to hide or display the children of the clicked node.
	 * @param {Event} event The event object
	 * @see linedTree#_hideChildren
	 * @since 1.0
	 */
	_manageChildrenDisplay:function(event){
		var clickedElemId = $A(arguments)[1];
		
		
		clickedNode = this._nodes.get(clickedElemId);
		clickedNode.isOpen = !clickedNode.isOpen;
		if(clickedNode.isOpen == true){
			if (!Object.isEmpty(this._objEvents) && !Object.isEmpty(this._objEvents.get('onNodeOpen'))) {
				document.fire(this._objEvents.get('onNodeOpen'), {
					selection: clickedElemId
				});
			}
        clickedNode.expCollapse.removeClassName(clickedNode.classPrefix + clickedNode.classSuffix);
			clickedNode.classPrefix = this._minusClass;
        clickedNode.expCollapse.addClassName(clickedNode.classPrefix + clickedNode.classSuffix);
        if (global.liteVersion) {
            var node = clickedNode.expCollapse;
            node.update("<span>-</span>");
            node.writeAttribute("title", global.getLabel("PFM_Collapse_All"));
        }
		}else{
			if (!Object.isEmpty(this._objEvents) && !Object.isEmpty(this._objEvents.get('onNodeClose'))) {
				document.fire(this._objEvents.get('onNodeClose'), {
					selection: clickedElemId
				});
			}

        clickedNode.expCollapse.removeClassName(clickedNode.classPrefix + clickedNode.classSuffix);
			clickedNode.classPrefix = this._plusClass;
        clickedNode.expCollapse.addClassName(this._plusClass + clickedNode.classSuffix);
        if (global.liteVersion) {
            var node = clickedNode.expCollapse;
            node.update("<span>+</span>");
            node.writeAttribute("title", global.getLabel("PFM_Expand_All"));
        }
		}
		this._hideChildren(clickedNode);		
	},
	/**
	 * Function in charge of displaying or hiding the children of a clicked node.<br>
	 * The display or hide of the children is done by playing with CSS classes on the descendant div of the clicked node.
	 * @param {JSon} node The internal JSon representation of the node
	 * @since 1.0
	 */
	_hideChildren:function(node){
		if(node.isOpen)
        node.child.removeClassName('linedTree_hidden');
		else
        node.child.addClassName('linedTree_hidden');
	},
	/**
	 * Function in charge of responding to the click on a checkbox within the tree.<br>
	 * This function will identify which checkbox has been clicked and will call _manageCheckBoxClick in order to perform the corresponding process.
	 * @param {Event} event The click on the checkbox event
	 * @see linedTree#_manageCheckBoxClick
	 * @since 1.0
	 */
	_manageCheckBoxClickEvent:function(event){
		var clickedElemId = $A(arguments)[1];
		this._manageCheckBoxClick(clickedElemId, true);
	},
	/**
	 * Function in charge of responding to the click on a node within the tree.<br>
	 * This function will identify which node has been clicked and will raise the event corresponding in _objEvent for a node click.
	 * @param {Event} event The click on the node event
	 * @param {Object} event
	 */
	_manageNodeClickEvent:function(event, isID){
		if (!Object.isEmpty(this._objEvents) && !Object.isEmpty(this._objEvents.get('onNodeSelection'))) {
			var clickedElemId = $A(arguments)[1];
			if (!Object.isUndefined(this._selectedNode) && !Object.isEmpty(this._selectedNode)) {
            this._nodes.get(this._selectedNode).textElement.removeClassName('linedTree_selected');
			}
        this._nodes.get(clickedElemId).textElement.addClassName('linedTree_selected');
			this._selectedNode = clickedElemId;
				document.fire(this._objEvents.get('onNodeSelection'), {
					selection: this._selectedNode
				});
		}
	},
	/**
	 * Function in charge of managing a checkbox change.<br>
	 * This function will first manage the changed checkbox by calling _manageCheckBox, then will manage the eventual children of the
	 * clicked checkbox and will then manage the eventual parents of the changed checkbox.
	 * @param {String} nodeId The changed node identifier
	 * @param {boolean} raiseEvent Flag meaning if the event should be fired.
	 * @see linedTree#_manageCheckBox
	 * @see linedTree#_manageChildrenCheckBox
	 * @see linedTree#_manageParentCheckBox
	 * @see linedTree#_raiseSelectionEvent
	 * @since 1.0
	 */
	_manageCheckBoxClick:function(nodeId, raiseEvent){
		var node = this._nodes.get(nodeId);
		
		this._manageCheckBox(node);
		if(!this._spreadSelection){
			//Normal scenario: we will select all its child nodes and update its parents
			if(node.hasChildren == true){
                this._manageChildrenCheckBox(node);
            }
            if(node.parentId != null){
                this._manageParentCheckBox(node);   
            }
		}
		if(raiseEvent)
			this._raiseSelectionEvent();
	},
	/**
	 * Function in charge of managing a single checkbox.<br>
* This function will manage the class change of the changed node and of the check box by calling the changeState function.
	 * @param {JSon} node The JSon object representing the changed node
	 * @since 1.0
	 */
_manageCheckBox: function (node) {
    switch (node.isChecked) {
        //unchecked                                                     
        case 0:
            node.checkbox.changeState(2);
            node.isChecked = 2;
            break;
        // half checked                                                     
        case 1:
            node.checkbox.changeState(0);
            node.isChecked = 0;
            break;
        // checked                                                     
        case 2:
            node.checkbox.changeState(0);
            node.isChecked = 0;
            break;
    }
	},
	/**
	 * Function in charge of managing the eventual change of class of the checkbox of the children of a clicked checkbox.<br>
	 * This function will get all the children of the clicked node and apply the appropriate class to the checkbox.
	 * @param {JSon} node The JSon object representing the changed node which in this case will be considered as parent node
	 * @since 1.0
	 */
	_manageChildrenCheckBox:function(node){
		var arrayOfChildren = this._parentToChildren.get(node.id);
    if(arrayOfChildren){
		arrayOfChildren.each(function(child){
			var childNode = this._nodes.get(child);
			if (childNode.isChecked != node.isChecked) {
				switch (node.isChecked) {
					// unchecked
					case 0:
                    childNode.checkbox.changeState(0);
						childNode.isChecked = 0;
						break;
					// half checked
					case 1:
						alert('Not possible');
						break;
					// checked
					case 2:
                    childNode.checkbox.changeState(2);
						childNode.isChecked = 2;
						break;
				}
			}
        if (childNode.hasChildren == true /*&& childNode.isOpen*/) {
				this._manageChildrenCheckBox(childNode);
			}
		}, this);
    }
	},
	/**
	 * Function in charge of managing the checkbox of the parents of the changed node.<br>
	 * This function will be called recursivly till reaching the first level of the tree ndoes.
	 * The parent node of the node given in parameter will first be retrieved. After the _childSelected function will
	 * be called in order to determine how many children have been fully checked, half checked or non checked. The result of this
	 * function will be used to determine the correct status of the parent checkbox. Depending of the previous statu and the one that 
* should be applied, the changeState method will be called to apply the new checkbox status.
	 * @param {JSon} node The JSon object representing the changed node which in this case will be considered as child node
	 * @see linedTree#_childSelected
	 * @since 1.0
	 */
_manageParentCheckBox: function (node) {
    if (node.parentId != null) {
        var parentNode = this._nodes.get(node.parentId);
        var selection = this._childSelected(parentNode);
        switch (node.isChecked) {
            // unchecked                                                     
            case 0:
                if (selection.selected != 0 || selection.halfSelected != 0) {
                    if (parentNode.isChecked != 1) {
                        parentNode.checkbox.changeState(1);
                        parentNode.isChecked = 1;
                    }
                } else {
                    if (parentNode.isChecked != 0) {
                        parentNode.checkbox.changeState(0);
                        parentNode.isChecked = 0;
                    }
                }
                break;
            // half checked                                                     
            case 1:
                if (parentNode.isChecked != 1) {
                    parentNode.checkbox.changeState(1);
                    parentNode.isChecked = 1;
                }
                break;
            // checked                                                     
            case 2:
                if (selection.total == selection.selected && selection.halfSelected == 0) {
                    if (parentNode.isChecked != 2) {
                        parentNode.checkbox.changeState(2);
                        parentNode.isChecked = 2;
                    }
                } else {
                    if (parentNode.isChecked != 1) {
                        parentNode.checkbox.changeState(1);
                        parentNode.isChecked = 1;
                    }
                }
                break;
        }
        this._manageParentCheckBox(parentNode);
    }
},
	/**
	 * Function in charge of detemining how may children have been checked, half checked or not checked under the node given in parameter.
	 * @param {JSon} node The node under which the number of checked children should be defined.
	 * @return {JSon} A JSon object containing the following elements:<ul>
	 * 	<li>selected - The number of fully selected child nodes</li>
	 * 	<li>halfSelected - The number of half selected child nodes</li>
	 * 	<li>total - The total number of children</li>
	 * </ul>
	 * @since 1.0
	 */
	_childSelected:function(node){
		var arrayOfChildren = this._parentToChildren.get(node.id);
		var selectedChildren = arrayOfChildren.collect(function(child){
			var childNode = this._nodes.get(child);
			if(childNode.isChecked == 0 || childNode.isChecked == 1){
				return null;
			}else if(childNode.isChecked == 2){
				return childNode;
			}
		}, this);
		var halfSelectedChildren = arrayOfChildren.collect(function(child){
			var childNode = this._nodes.get(child);
			if(childNode.isChecked == 0 || childNode.isChecked == 2){
				return null;
			}else if(childNode.isChecked == 1){
				return childNode;
			}
		}, this);
		selectedChildren = selectedChildren.compact();
		halfSelectedChildren = halfSelectedChildren.compact();
		return {
				selected	:selectedChildren.size(), 
				halfSelected:halfSelectedChildren.size(),
				total		:arrayOfChildren.size()
			};
	},
	/**
	 * Function in charge of raising the event when a node is changed.<br>
	 * The function will first call the _buildSelectionList function to build the list of selected nodes (only the one from the last level as theses are the only "real" id needed)
	 * and will raise the event corresponding from the _objEvent attribute with the list of selected nodes in parameter.
	 * @see linedTree#_buildSelectionList 
	 * @since 1.0
	 */
	_raiseSelectionEvent:function(){
		var selectedNodes = this._buildSelectionList();
		var unselectedNodes = this._buildUnSelectionList();
		if(!Object.isEmpty(this._objEvents) && !Object.isEmpty(this._objEvents.get('onCheckBoxClick')))
			document.fire(this._objEvents.get('onCheckBoxClick'),  {selection:selectedNodes, unselection: unselectedNodes });
	},
	/**
	 * Function in charge of building the list of selected nodes.<br>
	 * The list of selected nodes will only contain the last level node id as they are the real ids
	 * @returns {Array} An array containing the id's of the selected nodes
	 * @since 1.0
	 */
	_buildSelectionList:function(){
		if(this._returnAllNodesOnSelection){
			return this._nodes.collect(function(node){
	            if(node.value.isChecked == 2){
	                return node.value.id;
	            }
	        },this).compact();
		}else{
		return this._nodes.collect(function(node){
			if(node.value.hasChildren == false && node.value.isChecked == 2){
				return node.value.id;
			}
		},this).compact();
		}
	},
	
	_buildUnSelectionList:function(){
	    if(!this._returnAllNodesOnSelection){
	        //Normal scenario, we will only add the nodes that are leaf
		    return this._nodes.collect(function(node){
			    if(node.value.hasChildren == false && node.value.isChecked == 0){
				    return node.value.id;
			    }
		    },this).compact();
		 }else{
		    //If we are returning all nodes, we will also return non-leaf nodes as unselected
		    return this._nodes.collect(function(node){
			    if(node.value.isChecked == 0){
				    return node.value.id;
			    }
		    },this).compact();		 
		 }		
	},
	/**
	 * Function in charge of setting the default selected nodes.<br>
	 * The default selected nodes are determined by their values in the Array representing the tree given in parameter during the initialization or refresh of the tree.
	 * This function will parse the list of nodes and check if the node is a last level of the hierachy node and if it should be checked. 
	 * If the node completes the conditions, the _manageCheckBoxClick function will be called with false as second parameter (so that the event is not raised for each node)
	 * and the _raiseSelectionEvent is called at the end of the function, once all the nodes have been selected so that only one event will be raised with all the default selected nodes.
	 * @see linedTree#_manageCheckBoxClick
	 * @see linedTree#_raiseSelectionEvent
	 * @since 1.0
	 */
	_setDefaultSelectedNodes:function(){
	    if(!this._returnAllNodesOnSelection){
	        //If we don't want to select all nodes, only leaf nodes need to be selected by default
	        this._nodes.each(function(node){
			    if(node.value.hasChildren == false && node.value.isChecked == 2){
				    node.value.isChecked = 0;
				    this._manageCheckBoxClick(node.value.id, false);
			    }
		    },this);
	    }else{
	        //If we can selected non-leaf nodes, we should also set their default values
	        this._nodes.each(function(node){
			    if(node.value.isChecked != 0){
				    node.value.isChecked = 0;
				    this._manageCheckBoxClick(node.value.id, false);
			    }
		    },this);
	    }
		this._raiseSelectionEvent();
	},
	
	
	_setDefaultedNodeSelected:function(){
		if(this._defaultedNodeSelected != null){
			if (!Object.isUndefined(this._nodes.get(this._defaultedNodeSelected))) {
            this._nodes.get(this._defaultedNodeSelected).textElement.addClassName('linedTree_selected');
				this._selectedNode = this._defaultedNodeSelected;
				if (this._raiseEventOnDefaultSelection) {
					if (!Object.isEmpty(this._objEvents) && !Object.isEmpty(this._objEvents.get('onNodeSelection'))) {
						document.fire(this._objEvents.get('onNodeSelection'), {
							selection: this._selectedNode
						});
					}
				}
			}
			
		}
	},
_getExpandCollapse: function (id, classPrefix, classSuffix) {
    var element;
    if (classPrefix != this._minusClass && classPrefix != this._plusClass) {
        element = new Element("span", { "id": id, "class": classPrefix + classSuffix + ' linedTree_collapseIcon test_icon' });
    }
    else {
        if (!global.liteVersion) {
            element = new Element("span", { "id": id, "class": classPrefix + classSuffix + ' linedTree_collapseIcon linedTree_cursor test_icon' });
        }
        else {
            var text = "+";
            var labelName = "PFM_Expand_All"
            if (classPrefix == this._minusClass) {
                text = "-";
                labelName = "PFM_Collapse_All"
            }
            element = new Element("button", { "id": id, "class": classPrefix, "title": global.getLabel(labelName) });
            var span = new Element("span");
            span.update(text);
            element.insert(span);
        }
    }
    return element;
},
_getNodeTextElement: function (id, cssClass, title) {
    var elementType;
    if (global.liteVersion) { elementType = "button"; }
    else { elementType = "span"; }
    if(id){
        return new Element(elementType, { 'id': id, 'class': 'test_text ' + cssClass, 'title': title });
    }else{
        return new Element(elementType, {'class': 'test_text ' + cssClass, 'title': title });
    }
},
	/**
	 * Function used to create a fake tree for testing purpose.<br>
	 * The call to this function should be done except for testing the tree.
	 * This function also provides a template of the array that should be given to the object in order to build the tree.
	 */
    _fakeTreeBuilding: function(){
        this._treeArray = [
		
			{ id: "id1", title: "id1", value: "company1", parent: null, isOpen: true, isChecked: 0, hasChildren: true, nodeIcon:"SCM_ActionAmberAlertIcon SCM_ActionsIconSize", children: 
				[
					{id: "id2", title: "id2", value: "company2", parent: "id1", hasChildren: false, isOpen: true, isChecked: 2, nodeIcon:"SCM_ActionNewItemIcon SCM_ActionsIconSize", children: []},
					{id: "id3", title: "id3", value: "company3", parent: "id1", hasChildren: false, isOpen: true, isChecked: 0, nodeIcon:"SCM_ActionNewItemIcon SCM_ActionsIconSize",children: []}
				]
        	}, 
			{id: "id4", title: "id4", value: "company4", parent: null, hasChildren: true, isOpen: false, isChecked: 0,nodeIcon:"SCM_ActionNewItemIcon SCM_ActionsIconSize", children: 
				[
					{id: "id5", title: "id5", value: "company5", parent: "id4", hasChildren: true, isOpen: true, isChecked: 0,nodeIcon:"SCM_ActionNewItemIcon SCM_ActionsIconSize", children: 
						[
							{id: "id6", title: "id6", value: "company6", parent: "id5", hasChildren: true, isOpen: true, isChecked: 0,nodeIcon:"SCM_ActionNewItemIcon SCM_ActionsIconSize", children: 
								[
									{id: "id99", title: "id99", value: "company99", parent: "id6", hasChildren: false, isOpen: true, isChecked: 2,nodeIcon:"SCM_ActionNewItemIcon SCM_ActionsIconSize", children: []},
									{id: "id98", title: "id98", value: "company98", parent: "id6", hasChildren: false, isOpen: true, isChecked: 2,nodeIcon:"SCM_ActionNewItemIcon SCM_ActionsIconSize", children: []}
								]
                        	}
						]
					},
					{id: "id7", title: "id7", value: "company7", parent: "id4", hasChildren: true, isOpen: true, isChecked: 0, nodeIcon:"SCM_ActionNewItemIcon SCM_ActionsIconSize",children: 
						[
							{id: "id8", title: "id8", value: "company8", parent: "id7", hasChildren: false, isOpen: true, isChecked: 0,nodeIcon:"SCM_ActionNewItemIcon SCM_ActionsIconSize", children: []}
						]
                	}
				]
        	},
			{id: "id9", title: "id9", value: "company9", parent: null, isOpen: false, isChecked: 0, hasChildren: true,nodeIcon:"SCM_ActionNewItemIcon SCM_ActionsIconSize", children: 
				[
					{id: "id10", title: "id10", value: "company10", parent: "id9", hasChildren: false, isOpen: false, isChecked: 0,nodeIcon:"SCM_ActionNewItemIcon SCM_ActionsIconSize", children: []},
					{id: "id11", title: "id11", value: "company11", parent: "id9", hasChildren: false, isOpen: false, isChecked: 0,nodeIcon:"SCM_ActionNewItemIcon SCM_ActionsIconSize", children: []}
				]
        	}
		];
    }	
});


var ThreeStateCheckbox = Class.create({
    _id: null,
    _selectLabel: null,
    _deselectLabel: null,
    initialize: function (targetDiv, status, id, selectLabel, deselectLabel) {
        /// <summary>base class for a three state checkbox</summary>
        /// <param name="targetDiv">The div where the checkbox should be inserted</param>
        /// <param name="status">The inital status of the checkbox: 0 = unselected, 1 = partially selected, 2 = selected</<param>
        /// <param name="id">An id that will be used when throwing the click event: "EWS:ThreeStateCheckbox_Click" + id</param>
        /// <param name="selectLabel">Text to use in the title attribute for selecting items</param>
        /// <param name="deselectLabel">Text to use in the title attribute for deselecting items</param>
        this._id = id;
        this._selectLabel = selectLabel;
        this._deselectLabel = deselectLabel;
    },
    changeState: function (newstatus) {
        /// <summary>Method to be overridden in the subClass</summar>
        /// <param name="status">The new status to apply</param>
     },
    onClick: function () {
        /// <summary>Protected method to be called by base classes to raise the event</summary> 
        document.fire("EWS:ThreeStateCheckbox_Click" + this._id);
    }
});
ThreeStateCheckbox.getCheckbox = function (isLiteVersion, targetDiv, status, id, selectLabel, deselectLabel) {
    /// <summary>Method to get a checkbox instance, depending on liteVersion or not</summary>
    /// <param name="isLiteVersion">Determines wether to get a node for the lite version or the normal version</param>
    /// <param name="targetDiv">The div where the checkbox should be inserted</param>
    /// <param name="status">The inital status of the checkbox: 0 = unselected, 1 = partially selected, 2 = selected</<param>
    /// <param name="id">An id that will be used when throwing the click event: "EWS:ThreeStateCheckbox_Click" + id</param>
    /// <param name="selectLabel">Text to use in the title attribute for selecting items</param>
    /// <param name="deselectLabel">Text to use in the title attribute for deselecting items</param>
    if (isLiteVersion) { return new ThreeStateCheckboxLite(targetDiv, status, id, selectLabel, deselectLabel); }
    else { return new ThreeStateCheckboxNormal(targetDiv, status, id, selectLabel, deselectLabel); }
}
var ThreeStateCheckboxLite = Class.create(ThreeStateCheckbox, {
    _button: null,
    _checkbox: null,
    initialize: function ($super, targetDiv, status, id, selectLabel, deselectLabel) {
        /// <summary>Constructor for a lite checkbox</summary>
        /// <param name="targetDiv">The div where the checkbox should be inserted</param>
        /// <param name="status">The inital status of the checkbox: 0 = unselected, 1 = partially selected, 2 = selected</<param>
        /// <param name="id">An id that will be used when throwing the click event: "EWS:ThreeStateCheckbox_Click" + id</param>
        /// <param name="selectLabel">Text to use in the title attribute for selecting items</param>
        /// <param name="deselectLabel">Text to use in the title attribute for deselecting items</param>
        $super(targetDiv, status, id, selectLabel, deselectLabel);
        this._button = new Element("button", { "class": "linedTree_ThreestateButton", "title": this._deselectLabel });
        this._checkbox = new Element("input", { "type": "checkbox", "class": "test_checkBox" });

        // Catch events from the button and checkbox and disable them, throw our own event and await for the client to call changestate
        this._button.observe("click", function () {
            this.onClick();
            return false;
        } .bind(this));
                this._checkbox.observe("click", function () {
            this.onClick();
            return false;
        } .bind(this));

        targetDiv.insert(this._button);
        targetDiv.insert(this._checkbox);
        this.changeState(status);
    },
    changeState: function ($super, newstatus) {
        /// <summary>Method to change the state of the checkbox, will also update the appropiate title of the element. In this class the checkbox will be hidden and a button shown if the newstatus is 1 (partially selected).</summary>
        /// <param name="newstatus">The newstatus to be applied</param>
        switch (newstatus) {
            case 0:
                this._checkbox.show();
                this._button.hide();
                this._checkbox.checked = false;
                this._checkbox.writeAttribute("title", this._selectLabel);
                break;
            case 1:
                this._checkbox.hide();
                this._button.show();
                break;
            case 2:
                this._checkbox.show();
                this._button.hide();
                this._checkbox.checked = true;
                this._checkbox.writeAttribute("title", this._deselectLabel);
                break;
        }
    }
});
var ThreeStateCheckboxNormal = Class.create(ThreeStateCheckbox, {
    _span: null,
    _oldstatus: 0,
    initialize: function ($super, targetDiv, status, id, selectLabel, deselectLabel) {
        /// <summary>Constructor for a normal checkbox</summary>
        /// <param name="targetDiv">The div where the checkbox should be inserted</param>
        /// <param name="status">The inital status of the checkbox: 0 = unselected, 1 = partially selected, 2 = selected</<param>
        /// <param name="id">An id that will be used when throwing the click event: "EWS:ThreeStateCheckbox_Click" + id</param>
        /// <param name="selectLabel">Text to use in the title attribute for selecting items</param>
        /// <param name="deselectLabel">Text to use in the title attribute for deselecting items</param>
        $super(targetDiv, status, id, selectLabel, deselectLabel);
        this._span = new Element("span", { "class": "linedTree_check0 linedTree_checkIcon linedTree_cursor test_checkBox" });
        this._span.observe("click", function () {
            this.onClick();
            return false;
        } .bind(this));
        targetDiv.insert(this._span);
        this.changeState(status);
    },
    changeState: function ($super, newstatus) {
        /// <summary>Method to change the state of the checkbox, will also update the appropiate title of the element. In this class the css class of the span will be changed.</summary>
        /// <param name="newstatus">The newstatus to be applied</param>
        this._span.removeClassName('linedTree_check' + this._oldstatus);
        this._span.addClassName('linedTree_check' + newstatus);
        this._oldstatus = newstatus;
        var newTitle;
        switch (newstatus) {
            case 0:
                newTitle = this._selectLabel;
                break;
            case 1:
                newTitle = this._deselectLabel;
                break;
            case 2:
                newTitle = this._deselectLabel;
                break;
        }
        this._span.writeAttribute("title", newTitle);
    }
});