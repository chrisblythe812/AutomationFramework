/**
 * @fileOverview multiSelect.js
 * @description Contains all the functionalities for creating a multiSelect area.
 * This area behaves like a textarea but in fact is a div with an autocompleter thaet
 * simulates the textarea carret. The selectios on the autocompleter are inserted
 * on the "textarea" as boxes which can be closed.
 */

/**
 * @constructor
 * @description Contains all the functionalities for creating a multiselect and
 * method to access the selected data
 * @augments JSONAutocompleter
 */
var MultiSelect = Class.create(JSONAutocompleter,
/**
* @lends MultiSelect
*/{
/**
* @description Contains the user-defined options
* @type Object
*/
options: new Object(),
/**
* @description Element where the multiselect is inserted
* @type Prototype.Element
*/
mainContainer: null,
/**
* @description Contains the JSON structure that the autocompleter uses
*/
JSON: null,
/**
* @description Stores the current selected elements
* @type Prototype.Object
*/
selectedElements: null,
/**
* @description This function is called when instantiating the class. It creates
* the structure and initialize needed variables
* @param element Element where the insertion of the MultiSelect textarea will be inserted
* @param options Object that contains initialization options
* @param data JSON with  the data that can be inserted on the textarea
* @param $super Parent class initializator
*/
initialize: function($super, element, options, data) {
    this.selectedElements = $A();
    this.selectedElements.clear();
    //Storing the main container
    this.mainContainer = $(element);
    //Storing the autocompleter element
    this.autocompleterContainer = new Element('div');
    this.JSON = data;
    this.mainContainer.insert(this.autocompleterContainer);
    //Extending the options for defining the events
    Object.extend(options.autocompleter, {
        events: $H({
            onGetNewXml: 'EWS:autocompleterGetNewXml',
            onResultSelected: 'EWS:autocompleterResultSelected_' + element
        })
     });
    this._options = options;
    //Calling to the parent initializator
    $super(element, options.autocompleter, data);
    this.dataCopy = this.options.array.clone();
    this.mainContainer.observe('click', this.doFocus.bind(this));
    //Adding the multiselect className to the main div to identify the classes
    this.mainContainer.addClassName("multiselect");
    if(this.options.arrow){
        this.mainContainer.addClassName("multiselect_arrow");
        this.mainContainer.addClassName("multiselect_styleWithArrow");
        if(this.mainContainer.down(1).className == "autocompleter_form_container"){
            this.mainContainer.down(1).setStyle({'width':this.mainContainer.offsetWidth});
        }
    }
    return;
},
/**
* @description Disables the textarea
*/
disableElement: function(){
    if (!Object.isEmpty($('text_area_' + this.divElementId)))
        $('text_area_' + this.divElementId).disabled = true ;    

},
/**
* @description Enables the textarea
*/
enableElement: function(){
    if (!Object.isEmpty($('text_area_' + this.divElementId)))
        $('text_area_' + this.divElementId).disabled = false ;    

},
/**
* @description Overwrites the parent function. It is executed every time we
* select an item on the autocompleter
* @param $super Parent function
* @param selectedElement Selected element ID
* @param throwEvent Indicates if an event should be thrown
*/
updateElement: function($super, selectedElement, throwEvent) {
    //Calling the super method
        var a = 1;
    $super(selectedElement, false);
    //Getting the current clicked ID
    if (!this.lastSelected)
        return;

    
    //We check if the number of selected elements is under the max, if not, we launch a warning message
    if( (!this._options.autocompleter.maxSelectedElements) || (this._options.autocompleter.maxSelectedElements > this.selectedElements.length)){
        //Insert the element
        var index = this.lastSelected;
        //Creating a box for the clicked one
        this.createBox(this.options.array[index]);
        var eventInfo = this.options.array[index];
        this.removeElementJSON(this.options.array[index], false);
        if (this._options.events)
            if (!Object.isEmpty(this._options.events.get('onResultSelected'))) {
                var resultEvent = this._options.events.get('onResultSelected');
                if (!Object.isEmpty(resultEvent)) {
                    document.fire(resultEvent, eventInfo);
                }
            }
     }
     else{
            //restore the text area, eliminate the spare element,
           $('text_area_' + this.divElementId).value = "" ;
           //Create the label for show
                var message = global.getLabel('maxSelectedElements');
                this.advertMessage = new Element('div', {'class': 'application_main_error_text multiSelect_maxElementWarning'}).update(message);
                //insert the message after that autocompleter
                this.mainContainer.insert({bottom:this.advertMessage})
                this.advertMessage.show();
                //After 2 second the message disapear.
                if (Prototype.Browser.IE && parseInt(navigator.userAgent.substring(navigator.userAgent.indexOf("MSIE") + 5)) == 6) {
                   Element.hide.delay(1, this.advertMessage);
                 }
                else {
                     this.advertMessage.fade({
                        duration: 2.0,
                        delay: 1.0
                        });
                }
           }
},

/**
* @description Creates a new item on the textarea
* @param data New item data
*/
createBox: function(data,fixed) {
    //Creating the box element
    var box = new Element('div', {
        'class': 'multiSelect_item test_multiselect',
        'id': 'multiSelect_item_ ' + data.get('data')
    });
    //Setting box name
	var text = unescape(data.get('text'));
	if(!Object.isEmpty(this._options.maxLength)){
		text = unescape(data.get('text')).truncate(this._options.maxLength + 3);
	}
	var text = text.gsub(' ', '&nbsp;');
	var title = escapeHTML(data.get('text'));
    box.update('<div class="application_rounded multiSelect_border ">&nbsp;</div><div class="multiSelect_text" title="' + title + '">' + text + '</div>');
    if (global.liteVersion) {
        var closeButton = new Element('button', {
            'class': 'multiSelect_closeButton application_rounded'
        });
    }
    else {
    var closeButton = new Element('div', {
        'class': 'multiSelect_closeButton application_rounded'
    });
    }
    if(!fixed){
        if (global.liteVersion)
            closeButton.update('X');
        else
        closeButton.update("<div class='application_currentSelection multiSelect_alignClose'></div>")
    }
    box.insert(closeButton);
    box.hide();
    //Inserting before the autocompleter    
    this.mainContainer.insertBefore(box, this.autocompleterContainer);
    if(!fixed){
    closeButton.observe('click', this.removeBox.bind(this, box, data));
    }
    //Show effect
    box.appear({
        duration: 0.5
    });
    this.clearInput();
    return box;
},
/**
* @description This method is executed every time we focus on the textarea
* what it does is, independenly of the place of the text area we click it focus
* the autocompleter
*/
doFocus: function() {
    if(!Object.isEmpty($('text_area_' + this.divElementId)) && $('text_area_' + this.divElementId).disabled == false){
        $('text_area_' + this.divElementId).focus();
        if( this.options.minChars == 0 && this.element.value == ""){
            this.onKeyPress ("");
        }
    }
},
/**
* @description Removes a box from the textarea
* @param box the box div  
* @param data New item data
*/
removeBox: function() {
    var args = $A(arguments);
    args[0].remove();
    this.insertElementJSON(args[1]);
    if (this._options.events)
        if (!Object.isEmpty(this._options.events.get('onRemoveBox')))
        document.fire(this._options.events.get('onRemoveBox'), args[1]);
    
    // If the advert message is on the screen, we remove it, due to the we remove an selected element.
    if (this.advertMessage){
        this.advertMessage.remove();
        this.advertMessage = undefined;
    }
},
/**
* @description Removes an element from the JSON and refresh the autocompleter
* @param data Data of the element to be removed
*/
removeElementJSON: function(data, noUpdate) {
    //Remove the element that has that id:
    for (var i = 0; i < this.JSON.autocompleter.object.size(); i++) {
        if (this.JSON.autocompleter.object[i].data == data.get('data')) {
            this.JSON.autocompleter.object.splice(i, 1);
            break;
        }
    }

    //Inserting the element on the selected list
    if (!noUpdate) {
        this.updateInput(this.JSON, true);
        this.selectedElements.push(data);
    }
},
/**
* @description Inserts an element on the JSON object
* @param data Data to be inserted
*/
insertElementJSON: function(data) {
    this.JSON.autocompleter.object.push({
        data: data.get('data'),
        text: unescape(data.get('text'))
    });
    
    //Remove the element that has that id:
    for (var i = 0; i < this.selectedElements.size(); i++) {
        if (this.selectedElements[i].get('data') == data.get('data')) {
            this.selectedElements.splice(i, 1);
            break;
        }
    }
    
    //Updating the autocompleter
    this.updateInput(this.JSON, true);
},
/**
* @description Returns the list of selected items
* @return The selected items
*/
getSelected: function() {
    return this.selectedElements;
},
/**
* @description This function overwrites the autocompleter updateInput. It filter
* the JSON before refreshing the autocompleter for avoid show on the autocompleter
* items that are already selected
*/
updateInput: function($super, JSON, noFilter) {
    if (!noFilter) {
        this.JSON = JSON;
        if (this.selectedElements)
            this.selectedElements.each(function(item) {
                this.removeElementJSON(item, true);
            } .bind(this));
    }
    $super(this.JSON);
},
/**
* @description This function add boxes to the multiselect automatically
* @param Array[], an array with the index of the boxes that you want add
*/
addBoxes: function(indexEmp) {
    var cont = 0;
    for (var i = 0; i < indexEmp.length; i++) {
        this.createBox(this.options.array[indexEmp[i] - cont]);
        this.removeElementJSON(this.options.array[indexEmp[i] - cont], false);
        cont++;
    }
},
/**
* Adds boxes by the data ID
* @param Array[] and array with the Ids to add
*/
addBoxByData: function(indexEmp,fixed) {
    var box = this.options.array.reject(function(_rej) {
        return _rej.get("data") != indexEmp;
    })[0];
    this.createBox(box,fixed);
    this.removeElementJSON(box, false);
},
/**
* Adds boxes by the data ID
* @param Array[] and array with the Ids to add
*/
removeBoxByData: function(indexEmp) {
    this.removeBox($('multiSelect_item_ ' +indexEmp.get('data')), indexEmp);
},
/**
* @description This function reset the multiselect, remove all the boxes from multiselect
* and add all the data to the json
*/
defaultBoxes: function() {
    var boxes = this.mainContainer.select('.multiSelect_item');
    if (boxes.length != 0) {
        for (var i = 0; i < boxes.length; i++) {
            boxes[i].remove();
        }
    }

    if (this.options.array.length != 0) {
        var fixedLength = this.options.array.length;
        var cont = 0;
        for (var i = 0; i < fixedLength; i++) {
            this.removeElementJSON(this.options.array[i - cont], false);
            cont++;
        }
    }
    //reseting selectedElements
    this.selectedElements.clear();
    for (var j = 0; j < this.dataCopy.length; j++) {
        this.insertElementJSON(this.dataCopy[j]);
    }

}
});


