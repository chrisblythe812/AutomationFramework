/*
 *@fileoverview treeHandler.js
 *@desc  contains definition and implementation of tree handler web module
 */
/*
 *@class treeHandler
 *@desc class with implementation of a tree structure.
 */
var TreeHandler = Class.create({
    /*
    *@name visitedNodes
    *@type Hash
    *@desc nodes already clicked, to not insert the same html twice
    */
    visitedNodes: null,
    objEvents: null,                    /* @type Hash @desc The list of event names that can be fired @name objEvents */
    checkBoxes: false,
    nodes: null,
    selected: null,
    type: 'checkbox',
    /*
    * @method initialize
    * @param ident {String} The name of the DIV that will contain the tree
    * @desc It creates a new treeHandler instance
    */
    initialize: function(ident, xmlDoc, _objExtraParameters) {//constructor    
        this.nodesIds = $H();
        this.visitedNodes = $H({});
        this.nodes = $H({});
        this.selected = $H({});
        this._objExtraParameters = Object.extend({
            events: null
        }, _objExtraParameters || {});
        this.objEvents = this._objExtraParameters.events;
        if (this._objExtraParameters.checkBoxes == true) this.checkBoxes = true;
        if (this._objExtraParameters.type == 'radio') this.type = 'radio';
        if (Object.isEmpty(this._objExtraParameters.textClicked))
            this.textClickedEvent = 'EWS:treeHandler_textClicked';
        else
            this.textClickedEvent = this._objExtraParameters.textClicked;
        if (Object.isEmpty(this._objExtraParameters.giveMeXml))
            this.giveMeXmlEvent = 'EWS:treeHandler_GiveMeXml';
        else
            this.giveMeXmlEvent = this._objExtraParameters.giveMeXml;            
        if (Object.isElement($(ident))) {
            //valid div to contain the tree
            this.ident = $(ident);
            this.xmlDoc = xmlDoc;
            this.fillNodes(this.xmlDoc);
            this.onClickBinding = this.onClick.bindAsEventListener(this);
            this.ident.observe('click', this.onClickBinding);
            this.getNewXmlBinding = this.getNewXml.bindAsEventListener(this);
            document.observe('EWS:treeHandler_GiveMeXml_done', this.getNewXmlBinding);
        }
        else {
            alert("The element " + ident + " doesn't exist");
        }
    },
    /*
    * @method stopObserving
    * @desc It stops observing all tree events
    */
    stopObserving: function() {
        this.ident.stopObserving('click', this.onClickBinding);
        document.stopObserving('EWS:treeHandler_GiveMeXml_done', this.getNewXmlBinding);
    },
    expandNodeById: function(nodeId) {
        if (!Object.isEmpty(this.nodesIds.get(nodeId)) && !Object.isEmpty($(this.nodesIds.get(nodeId).identify()))) {
            this.expandCollapseNodes(this.nodesIds.get(nodeId));
        }
    },
    /*
    * @method expandCollapseNodes
    * @param clicked {Element} The element that fired the onClick
    * @desc 
    */
    expandCollapseNodes: function(clicked) {
        var clickedParent = clicked.up().identify();
        var clickedId = clicked.identify();
        // we get all child nodes of the clicked one (just childs not other descendants)
        var selectedElements = $$('#' + clickedParent + ' > ' + '.treeHandler_' + clickedParent);
        //if its a closed node and has child nodes we open it
        if (clicked.match('.application_verticalR_arrow') && selectedElements.size()) {
            selectedElements.invoke('show');
            clicked.removeClassName('application_verticalR_arrow');
            clicked.addClassName('application_down_arrow');
            if (global.liteVersion)
                clicked.update('-');

            // Adding the expand event
            if (!Object.isEmpty(this.objEvents) && !Object.isEmpty(this.objEvents.get('onExpand'))) {
                document.fire(this.objEvents.get('onExpand'), { id: clickedParent });
            }

        } //otherwise we close it
        else if (clicked.match('.application_down_arrow') && selectedElements.size()) {
            selectedElements.invoke('hide');
            clicked.removeClassName('application_down_arrow');
            clicked.addClassName('application_verticalR_arrow');
            if (global.liteVersion)
                clicked.update('+');

            // Adding the collapse event
            if (!Object.isEmpty(this.objEvents) && !Object.isEmpty(this.objEvents.get('onCollapse'))) {
                document.fire(this.objEvents.get('onCollapse'), { id: clickedParent });
            }
        }
    },

    /*
    * @method onClick
    * @param event {Event} the Event object containing info about the fired event
    * @desc
    */
    onClick: function(event) {
        //We get the element that has fired the event
        this.elementClicked = event.element();
        this.clickedParent = this.elementClicked.up().identify();
        var clickedId = this.elementClicked.identify();
        //If we click over the text's node, we fire an event to say us in which node we are

        var parentElementClicked;

        if (this.elementClicked.match('.treeHandler_text_node_content')) {
            parentElementClicked = this.elementClicked.up('span[id^="treeHandler_text"]');
            this.elementClicked = parentElementClicked;
        }
        if (this.elementClicked.identify().include('treeHandler_text') || (!Object.isEmpty(parentElementClicked) &&
		      parentElementClicked.identify().include('treeHandler_text'))) {
            //we substract the id of the node clicked
            var string = this.elementClicked.identify().sub('treeHandler_text_', '');
            if (string.split('_').length <= 6)
                var type = string.split('_')[4];
            else
                var type = null;
            string = string.sub('_' + this.ident.identify(), '');
            document.fire(this.textClickedEvent, $H({
                treeName: this.ident.identify(),
                nodeName: string,
                typeNode: type
            }));

            // Adding the onClick event
            if (!Object.isEmpty(this.objEvents) && !Object.isEmpty(this.objEvents.get('onClick'))) {
                document.fire(this.objEvents.get('onClick'), { tree: this.ident.identify(), node: string });
            }

        } //if it is a clicked node without child nodes and has no child nodes we try to get new ones
        else if (this.elementClicked.match('.application_verticalR_arrow') && $$('#' + this.clickedParent + ' > ' + '.treeHandler_' + this.clickedParent).size() == 0) {
            if (!this.visitedNodes.get(this.elementClicked.identify())) {
                //we get the id of the html node
                var cad = this.clickedParent.sub('_' + this.ident.identify(), '').split('_')[1];
                //we find in xmlDoc the node that has this Id
                var children = selectSingleNodeCrossBrowser(this.xmlDoc, "/nodes//node[id='" + cad + "']");
                //we test if this node has 'childs', in this case we need to ask for an xml, to fill the node
                if (children && children.getAttribute('childs')) {
                    //if we have readed the xml
                    document.fire(this.giveMeXmlEvent, this.clickedParent);
                }
                this.visitedNodes.set(this.elementClicked.identify(), this.elementClicked.identify());
            }
        } //in other case
        else if (this.elementClicked.match('.treeHandler_align_verticalArrow')) {
            this.expandCollapseNodes(this.elementClicked);
        }
    },

    /*
    * @method getNewXml
    */
    getNewXml: function(event) {
        var args = getArgs(event);
        if (!args.clicked || !args.xml)
            return;
        if (args.clicked == this.clickedParent) {
            this.fillNodes(args.xml, this.clickedParent);
            this.expandCollapseNodes(this.elementClicked);
        }
    },
    setClickedParent: function(clicked) {
        this.clickedParent = clicked;
    },
    /*
    * @method unbindGetNewXml
    */
    unbindGetNewXml: function() {
        document.stopObserving("EWS:treeHandler_GiveMeXml_done", this.getNewXmlBinding);
    },
    /*
    * @method fillNodes
    * @param xml {IXMLDOMDocument2} The XML document containint the tree structure
    * @param parentNodeId {String} The id of the node that will be the container of the new ones
    * @desc Method that parses the XML and makes the insertions in the HTML
    */
    fillNodes: function(xml, parentNodeId) {
        //If parentNodeId doesn't exists, we asign tree id
        parentNodeId = parentNodeId ? parentNodeId : this.ident.identify();
        //We get all the nodes in the xml file
        var selectedNodes = selectNodesCrossBrowser(xml, '/nodes//node');
        //create variable to contain the id of a parent node
        var parentId;
        for (var i = 0; i < selectedNodes.length; i++) {
            //initialize the variable
            parentId = '';
            //each xml node is inserted in the xml below a div with his parent's node ID
            if (selectedNodes[i].parentNode.tagName == 'node') {
                var j = 0;
                do {
                    //we take the id of the parent node
                    if (selectedNodes[i].parentNode.childNodes[j].tagName == 'id') {
                        parentId = getText(selectedNodes[i].parentNode.childNodes[j]).strip();
                    };
                    //we do the loop while we have no parentId and selectedNodes[i] has children
                } while (++j < selectedNodes[i].childNodes.length && parentId == '');
            }
            else {
                parentId = parentNodeId != this.ident.identify() ? parentNodeId : this.ident.identify();
            }
            //test if the node has children 
            if (selectedNodes[i].getAttribute('childs') == "X") {
                hasChild = true;
            } else {
                hasChild = false;
            }
            //Once the node has been parse we insert it
            this.insertTreeNode(selectedNodes[i], parentId, hasChild);
        } //for
    }, //fillNode   
    selectNode: function(id) {
        this.selected.set(id, true);
        $('treeHandler_input_' + id + '_' + this.ident.identify()).checked = true;
        this.nodes.get(id).children.each(function(node) {
            this.selected.set(node.key, true);
            $('treeHandler_input_' + node.key + '_' + this.ident.identify()).checked = true;
        } .bind(this));
    },
    unselectNode: function(id) {
        this.selected.unset(id);
        $('treeHandler_input_' + id + '_' + this.ident.identify()).checked = false;
        this.nodes.get(id).children.each(function(node) {
            this.selected.unset(node.key);
            $('treeHandler_input_' + node.key + '_' + this.ident.identify()).checked = false;
        } .bind(this));
    },
    checkBoxClicked: function(event) {
        var id = event.element().identify().split('_')[2];
        if (this.selected.get(id)) {
            this.unselectNode(id);
        } else {
            this.selectNode(id);
        }
    },

    radioButtonClicked: function(event) {
        var id = event.element().identify().split('_')[2];
        this.selected = $H();
        this.selected.set(id, true);
    },
    getSelected: function() {
        var aux = $H({});
        this.selected.each(function(node) {
            aux.set(node.key, this.nodes.get(node.key).parent);
        } .bind(this));
        return aux;
    },
    /*
    * @method recallOpenedNode
    * @desc Recursive method that opens the recent nodes pushed when a tree is reloaded
    */
    recallOpenedNode: function(listOpenedNodes) {
        document.stopObserving("EWS:treeHandler_GiveMeXml_done_recursiveNodes");
        if (listOpenedNodes.length > 0 && !Object.isEmpty(listOpenedNodes[0])) {
			var val = Object.isElement(listOpenedNodes[0]) ? listOpenedNodes[0].id : listOpenedNodes[0];
            var arrow = $(val);
            if (!Object.isEmpty(arrow)) {
                //We receive the father 'div' of the open arrows.
                this.clickedParent = val;
                //We keep the arrow pushed
                this.elementClicked = $(val).down(".application_verticalR_arrow");
                //we get the id of the html node
                var cad = this.clickedParent.sub('_' + this.ident.identify(), '').split('_')[1];
                //we find in xmlDoc the node that has this Id
                var children = selectSingleNodeCrossBrowser(this.xmlDoc, "/nodes//node[id='" + cad + "']");
                //we test if this node has 'childs', in this case we need to ask for an xml, to fill the node
                if (children && children.getAttribute('childs')) {
                    //if we have readed the xml
                    document.fire(this.giveMeXmlEvent, this.clickedParent);
                    //We delete the recent expanded node.
                    listOpenedNodes[0] = null;
                    if (listOpenedNodes.length > 1) {
                        listOpenedNodes = listOpenedNodes.compact();
                        //We re-call the same function, in order to follow opening the nodes
                        document.observe('EWS:treeHandler_GiveMeXml_done_recursiveNodes', this.recallOpenedNode.bind(this, listOpenedNodes));
                    }
                }
            } //else, we are deleting the element "to open"
            else {
                listOpenedNodes[0] = null;
                listOpenedNodes = listOpenedNodes.compact();
                this.recallOpenedNode(listOpenedNodes);
            }
        }
        //this.visitedNodes.set(this.elementClicked.identify(), this.elementClicked.identify());
    },
    /*
    * @method insertTreeNode
    * @param xmlNode {IXMLDOMDocument2} an XML node with the <node> tag that will be inserted in the tree
    * @param parentId {String} the ID attribute of the parent div that will contain this new tree node
    * @desc Method that makes the insertions in the HTML
    */
    insertTreeNode: function(xmlNode, parentId, hasChild) {
        //get the name and id of the node
        var checked = null;
        var name = getText(xmlNode.getElementsByTagName('name')[0]);
        //Get if the node is selectable
        if (!Object.isEmpty(xmlNode.getElementsByTagName('checkRoot')[0]))
            var checkRoot = getText(xmlNode.getElementsByTagName('checkRoot')[0]);
        else
            var checkRoot = '';
        var select = "";
        if (!Object.isEmpty(xmlNode.getElementsByTagName('select')) && !Object.isEmpty(xmlNode.getElementsByTagName('select')[0])) {
            select = getText(xmlNode.getElementsByTagName('select')[0]);
            var elementsToLookFor = xmlNode.getElementsByTagName('checked')
            if (elementsToLookFor[0])
                checked = getText(elementsToLookFor[0]);
        }

        var nodeId = getText(xmlNode.getElementsByTagName('id')[0]);
        if (xmlNode.getElementsByTagName('type').length != 0)
            var type = getText(xmlNode.getElementsByTagName('type')[0]);
        //create the parent's node ID but not adding this tree's name space twice
        var parentIdHtml = parentId == this.ident.identify() || parentId.include(this.ident.identify()) ? parentId : 'div_' + parentId + '_' + this.ident.identify();
        //we create div and spans that are going to be the branchs of the tree, dinamically 
        var newNodeElem = new Element('div', {
            className: 'treeHandler_node ' + 'treeHandler_' + parentIdHtml
        });
        //if is a node with children inside, we show a hand over the node, to show that we can click to see what there is inside
        if (hasChild == true) {
            if (global.liteVersion) {
                var array = '+';
                var typeHTML = 'button';
            }
            else {
                var array = '&nbsp;'
                var typeHTML = 'span';
            }
            newNodeElem.update(new Element(typeHTML, {
                'class': 'application_verticalR_arrow treeHandler_align_verticalArrow test_icon'
            }).insert(array));
            newNodeElem.setAttribute('id', 'div_' + nodeId + '_' + this.ident.identify());
        }
        //if the node has no children, we show an empty arrow, and the default cursor, to show that the node has no children
        else {
            newNodeElem.update(new Element('span', {
                'class': 'treeHandler_align_emptyArrow'
            }).insert('&nbsp;'));
            newNodeElem.setAttribute('id', 'div_' + nodeId + '_' + this.ident.identify());
        }
        if (this.checkBoxes) {
            if (!hasChild || checkRoot == 'X') {
                var group = 'radiobutton';
                if (this.type == 'radio') {
                    var className = 'treeHandler_input treeHandler_radio treeHandler_input_' + parentId;
                    var funct = this.radioButtonClicked.bind(this);
                }
                else {
                    var className = 'treeHandler_input treeHandler_input_' + parentId;
                    var funct = this.checkBoxClicked.bind(this);
                }
                if (global.liteVersion)
                    var title = 'Select ' + nodeId;
                else
                    var title = '';
                var aux = new Element('input',
                {
                    'type': this.type,
                    className: className,
                    'id': 'treeHandler_input_' + nodeId + '_' + this.ident.identify(),
                    name: group,
                    title: title
                }).observe('click', funct);
                //If it's not selectable, we disable it
                if (select.toLowerCase() != "x") {
                    Form.Element.disable(aux);
                }
                newNodeElem.insert(aux);
                var par = (parentId.split('_')[0] != nodeId) ? parentId.split('_')[0] : '';
                var sel = (this.nodes.get(par) && this.selected.get(par)) ? true : false;
                if (sel) this.selected.set(nodeId, true);
                this.nodes.set(nodeId, { parent: par, children: $H({}) });
                if (this.nodes.get(par)) {
                    this.nodes.get(par).children.set(nodeId, null);
                }
            }
        }
        if (type) {
            //the text's span
            newNodeElem.insert(new Element('span', {
                className: ' treeHandler_pointer treeHandler_text_' + parentId,
                'id': 'treeHandler_text_' + nodeId + '_' + this.ident.identify() + '_' + type
            }).update(name));
        }
        else {
            //the text's span
            newNodeElem.insert(new Element('span', {
                className: ' treeHandler_pointer treeHandler_text_' + parentId,
                'id': 'treeHandler_text_' + nodeId + '_' + this.ident.identify()
            }).update(name));
        }
        //setting nodesIds structure
        if (!Object.isEmpty(nodeId) && !Object.isEmpty(newNodeElem) && !Object.isEmpty(newNodeElem.identify()))
            this.nodesIds.set(nodeId, newNodeElem.down());
        //if it's not the parent node of the tree we hide it
        if (parentId != this.ident.identify()) {
            var parentElement = this.ident.down('[id=' + parentIdHtml + ']');
            if (!parentElement.down('[id=' + newNodeElem.identify() + ']'))
                parentElement.insert(newNodeElem);
            newNodeElem.hide();
            //If it's the parent node of the tree, we show it
        } else {
            var parentElement = $(parentIdHtml);
            if (!parentElement.down('[id=' + newNodeElem.identify() + ']'))
                parentElement.insert(newNodeElem);
        }
        //checking the node checkbox if its parent node has been already selected
        if (!Object.isEmpty(aux)) {
            aux.checked = sel;
            if (!Object.isEmpty(checked)) {
                if (checked == "X")
                    aux.checked = true;
            }
        }

    }
});                         //class


/* ******************************************************************* */
/* ******************************************************************* */
/* ******************************************************************* */
/* ******************************************************************* */
/* ******************************************************************* */
/* ******************************************************************* */
