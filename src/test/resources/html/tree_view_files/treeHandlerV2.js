/*
 *@fileoverview treeHandlerV2.js
 *@desc  contains definition and implementation of tree handler web module
 */
/*
 *@class treeHandlerV2
 *@desc class with implementation of a tree structure.
 */
var TreeHandlerV2 = Class.create({
    /*
    *@name visitedNodes
    *@type Hash
    *@desc nodes already clicked, to not insert the same html twice
    */
    visitedNodes: null,
    objEvents: null,                    /* @type Hash @desc The list of event names that can be fired @name objEvents */
    checkBoxes: false,
    selected: null,
    type: 'checkbox',
    /*
    * @method initialize
    * @param ident {String} The name of the DIV that will contain the tree
    * @desc It creates a new treeHandlerV2 instance
    */
    initialize: function(ident, elementJSON, _objExtraParameters) {//constructor  
        this.randomId = Math.floor(Math.random() * 100000) + "";  
        this._objExtraParameters = Object.extend({
            events: null
        }, _objExtraParameters || {});
        this.objEvents = this._objExtraParameters.events;
        this.defaultSelection = elementJSON[0]['id'];
        if (this._objExtraParameters.checkBoxes == true) this.checkBoxes = true;
        if (this._objExtraParameters.type == 'radio') this.type = 'radio';
        if (this._objExtraParameters.defaultSelection) this.defaultSelection = this._objExtraParameters.defaultSelection;
        if (Object.isEmpty(this._objExtraParameters.textClicked))
            this.textClickedEvent = 'EWS:treeHandler_textClicked';
        else
            this.textClickedEvent = this._objExtraParameters.textClicked;
        if(this.checkBoxes){
            this.checkBoxSelectedHash = $H();
        }
        if (Object.isElement($(ident))) {
            //valid div to contain the tree
            this.ident = $(ident);
            this.elementJSON = elementJSON;
                this.visitedNodes = $H({});
                this.setIfVisited();
            this.createLineTree();
            this.onClickBinding = this.onClick.bindAsEventListener(this);
            document.observe('EWS:treeHandler_arrowClick' + this.randomId, this.onClickBinding);
            this.onTextClickBinding = this.onTextClick.bindAsEventListener(this);
            document.observe('EWS:treeHandler_textClick' + this.randomId, this.onTextClickBinding);
            if(this.type != "radio"){
                this.onCheckBoxClicked = this.checkBoxClicked.bindAsEventListener(this);
            }else{
                this.onCheckBoxClicked = this.radioButtonClicked.bindAsEventListener(this);
            }
            document.observe('EWS:treeHandler_checkBoxClick' + this.randomId, this.onCheckBoxClicked);
        }
        else {
            alert("The element " + ident + " doesn't exist");
        }
    },
    /*
    * @desc It check if the node, which is going to be opened has already visited prevously, and if not, it set in the visitedNodes hash table
    */
    setIfVisited: function(){
        for(var i = 0;i < this.elementJSON.length; i++){
            if((!this.visitedNodes.get(this.elementJSON[i].id))&&(this.elementJSON[i].isOpen)){
                this.visitedNodes.set(this.elementJSON[i].id,this.elementJSON[i].id);
            }
        }
    },
    /*
    * @desc This method reloads the tree
    */
    reloadTree: function(elementJSON,visitedNodes){
        if(visitedNodes){
            this.visitedNodes = visitedNodes;
        }
        this.elementJSON = elementJSON;
        this.createLineTree();
    },
    /*
    * @desc This method creates the tree
    */
    createLineTree: function(){
        if(this.checkBoxes && (this.checkBoxSelectedHash.size() > 0)){
            this.setCheckBoxes(this.elementJSON);
        }
        var linedTreeInstance = new linedTree(this.ident.id, this.elementJSON, {
            useIcons: true,
            type:this.type,
			defaultSelection:this.defaultSelection,
			allowCheckBoxesSomeNodes:this.checkBoxes,
			returnAllNodesOnSelection:true,
            objEvents: $H({
                onNodeOpen: 'EWS:treeHandler_arrowClick' + this.randomId,
				onNodeSelection: 'EWS:treeHandler_textClick' + this.randomId,
				onNodeClose: 'EWS:treeHandler_arrowClick' + this.randomId,
				onCheckBoxClick: 'EWS:treeHandler_checkBoxClick' + this.randomId
            })
        });
    },
    //TODO
    setCheckBoxes: function(arraynodes){
         for(var i = 0; i < arraynodes.length; i++){
            if(arraynodes[i].children.length > 0){
                if(this.checkBoxSelectedHash.get(arraynodes[i].id)){
                    arraynodes[i].isChecked = 2;
                }
                this.setCheckBoxes(arraynodes[i].children);
            }else{
                if(!arraynodes[i].hasChildren){
                    if(arraynodes[i].isChecked == 2){
                        if(!this.checkBoxSelectedHash.get(arraynodes[i].id)){
                            arraynodes[i].isChecked = 0;
                        }
                    }else{
                        if(this.checkBoxSelectedHash.get(arraynodes[i].id)){
                            arraynodes[i].isChecked = 2;
                        }
                    }
                }
            }
         }
    },
    /*
    * @method onClick
    * @param event {Event} the Event object containing info about the fired event
    * @desc method called when we click on the arrow of a row
    */
    onClick: function(event) {
        var arrowClicked = getArgs(event).selection;
        //WE check if the nodes has already been visited
        if (!this.visitedNodes.get(arrowClicked)){
            this.visitedNodes.set(getArgs(event).selection,getArgs(event).selection);
            document.fire('EWS:treeHandler_GiveMeXml',arrowClicked);
        }else{
            document.fire('EWS:treeHandler_updateNode',arrowClicked);
        }
    },
    /*
    * @param event {Event} the Event object containing info about the fired event
    * @desc method called when we click on the text of a row
    */
    onTextClick: function(event){
        var textClicked = getArgs(event).selection;
        document.fire(this.textClickedEvent,textClicked);
    },
    checkBoxClicked: function(event) {
        selectionArray = getArgs(event);
        for(var i = 0; i < selectionArray.selection.length;i++){
            if(!this.checkBoxSelectedHash.get(selectionArray.selection[i])){
                this.checkBoxSelectedHash.set(selectionArray.selection[i],selectionArray.selection[i]);
            }
        }
        for(var i = 0; i < selectionArray.unselection.length;i++){
            if(this.checkBoxSelectedHash.get(selectionArray.unselection[i])){
                this.checkBoxSelectedHash.unset(selectionArray.unselection[i]);
            }
        }
    },
    //Modificar
    radioButtonClicked: function(event) {
        var id = getArgs(event).selection;//event.element().identify().split('_')[2];
        this.checkBoxSelectedHash = $H();
        this.checkBoxSelectedHash.set(id, true);
    },
    getSelected: function() {
        return this.checkBoxSelectedHash;
    }
});                         //class


/* ******************************************************************* */
/* ******************************************************************* */
/* ******************************************************************* */
/* ******************************************************************* */
/* ******************************************************************* */
/* ******************************************************************* */
