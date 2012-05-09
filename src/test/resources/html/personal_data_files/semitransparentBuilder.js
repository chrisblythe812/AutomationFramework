

/*
* @fileoverview semitransparentBuilder
* @desc This file contains the class for creating a semitranparent screen
*/

/*
* @class semitransparentBuilder
* @desc This class creates a semitransparent screen for a given DIV, the class also contains the methods for hide and show the screen
*/

var semitransparentBuilder = Class.create({
    /*
    * @name _screenDiv
    * @desc This variable will contain the div element
    * @type {Prototype.Element}
    */
    _screenDiv: null,
    /*
    * @name _hide
    * @desc This variable stores the status of the screen, true hide, false visible
    * @type {Boolean}
    */
    _hide: true,
    /*
    * @name _className
    * @desc This variable stores the className for the screen
    * @type {String}
    */
    _className: null,
    /*
    * @method initializer
    * @desc This method initialize the semitransparentBuilder functionalities, gets the div and obseve for the hide and show events
    * @param screenDiv {String} ID of the element to convert into a semitransparent screen
    */
    initialize: function(elementId) {
        this._className = 'semitransparent';
        this.IE6 = Prototype.Browser.IE && parseInt(navigator.userAgent.substring(navigator.userAgent.indexOf("MSIE") + 5)) == 6;
        if (this.IE6)
            this._className = 'semitransparent_IE6';
        this._elementId = elementId;
        document.observe("EWS:firstRequestLoaded", this.run.bind(this));
    },
    /*
    * @method run
    * @desc This method create and insert the div in the html and hide it
    */
    run: function() {
        this.semitrans = new Element('div', { 'id': this._elementId, 'class': this._className });
    },
    /*
    * @method showSemitransparent
    * @desc This functions show the semitransparent screen
    */
    showSemitransparent: function(div) {
        if (Object.isEmpty(div)) {
            $(document.body).insert(this.semitrans);
        }
        else {
            div.insert(this.semitrans);
        }
    },
    /*
    * @method hideSemitransparent
    * @desc This function hides the semitransparent screen
    */
    hideSemitransparent: function() {
        if (this.semitrans.parentNode)
            this.semitrans.remove();

    }
});
//we create an instance of the class
var Framework_stb = new semitransparentBuilder('semitransparent');





/* ******************************************************************* */
/* ******************************************************************* */
/* ******************************************************************* */
/* ******************************************************************* */
/* ******************************************************************* */
/* ******************************************************************* */
