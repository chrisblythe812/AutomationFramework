/**
* @fileoverview infoPopUp.js
* @description The information popUp permits the programmer to create a simple popup to interact with the user.
*
* This script depends on the script "semitransparantBuilder" script.
*/
/**
* @constructor
* @description this class represents the information popUp handler
*/
var infoPopUp = Class.create(

/**
*@lends infoPopUp
*/
{
/**
* @type Array
* @description All the possible values of the indicator icon. 
*/
ALLOWED_INDICATOR_ICONS: ["void", "question", "exclamation", "confirmation", "information"],
TEXT_LITE_VERSION: [" ", "?", "!", "v", "i"],
/**
* @type Array
* @description The class names corresponding to the indicator icons. 
*/
INDICATOR_ICONS_CORRESPONDING_CSS_CLASSES: ["moduleInfoPopUp_indicatorIconVoid", "moduleInfoPopUp_indicatorIconQuestion", "moduleInfoPopUp_indicatorIconExclamation", "moduleInfoPopUp_indicatorIconConfirmation", "fwk_info_logo"],
INDICATOR_TEXT_CORRESPONDING_CSS_CLASSES: ["moduleInfoPopUp_textMessagePart_Void", "moduleInfoPopUp_textMessagePart", "moduleInfoPopUp_textMessagePart", "moduleInfoPopUp_textMessagePart", "moduleInfoPopUp_textMessagePart"],
/** 
* @type String
* @description The default width of the infoPopUp. 
*/
DEFAULT_BUTTON_ROW_LENGTH: '440',
// Values used and set in the program itself.
/**
* @type boolean 
* @description Indicating whether the confirmation box has been drawn or not 
*/
boBoxIsDrawn: false,
/**
* @type DOM object 
* @description This is the DOM object of the whole infoPopUp.
*/
obInfoPopUpContainer: null,
/**
* @type String 
* @description Contains the id of of the DOM object. 
*/
stInfoPopUpId: null,
// Values set by the programmer on instantiation or through setters.    
/**
* @type DOM object 
* @description The HTML content of the infoPopUp. 
*/
obHtmlContent: null,
/**
* @type String 
* @description The indicator value. This can/should be one of the values found in ALLOWED_INDICATOR_ICONS 
*/
stIndicatorIcon: null,
/** @type Hash 
* @description The close button hash 
*/
obCloseButton: null,
/**
* @type Hash 
* @description The list of event names that can be fired 
*/
objEvents: null,
/**
* @type String 
* @description The width of the infoPopUp
*/
width: null,
/**
* @param {Hash} _obInitializeParameters  keeps the whole options we need to create the tab handler:
*     html content, indicator icon, close button parameters, button callback functions and gray out option
* @description initializes the attributes used throughout the script
*/
initialize: function(_obInitializeParameters) {
    this._obInitializeParameters = Object.extend({
        htmlContent: "",
        indicatorIcon: "void",
        closeButton: null,
        //buttons: null,
        events: null,
        showCloseButton: true
    }, _obInitializeParameters || {});
    // Assigning the paramater values to the correct class properties
    this.obHtmlContent = this._obInitializeParameters.htmlContent;
    this.stIndicatorIcon = this._obInitializeParameters.indicatorIcon;
    this.obCloseButton = this._obInitializeParameters.closeButton;
    this.objEvents = this._obInitializeParameters.events;
    this.width = this._obInitializeParameters.width;
    this.height = this._obInitializeParameters.height;
    this.showCloseButton = this._obInitializeParameters.showCloseButton;
	this.contentClass = this._obInitializeParameters.contentClass;
    // The array of paramater values is not longer necessary
    delete this._obInitializeParameters;
},
/**
* @param (String) _stContent
*      html content: There needs to be a String of more than 0 characters in order
*                           for the confirmation box to be created.
* @description This method permits the user to set the confirmation box content.
*/
setContent: function(_stContent) {
    this.obHtmlContent = _stContent;
},
/**
* @description This method will destroy the infoPopUp and wipe it from memory.
*/
close: function() {
    this._stopObserving();
    Framework_stb.hideSemitransparent();
    //Remove only if it's possible
    //TODO:Refactor
    var errorsDiv =  this.obInfoPopUpContainer.down('.fwk_additionalErrorPopup');
    if(errorsDiv) //Remove backend errors
        errorsDiv.remove();
    if (this.obInfoPopUpContainer && this.obInfoPopUpContainer.parentNode){
        this.obInfoPopUpContainer.remove();
    }
    var infoDiv = $("idDivInfoPopUpContainer");
    if(infoDiv){
        infoDiv.remove();    
    }
    this.boBoxIsDrawn = false;
    global.enableAllClickableElements();
    // Adding the close event
    if (!Object.isEmpty(this.objEvents) && !Object.isEmpty(this.objEvents.get('onClose'))) {
        document.fire(this.objEvents.get('onClose'));
    }
    global.currentPopUp = null;
},
hide: function() {
    Framework_stb.hideSemitransparent();
    global.enableAllClickableElements();
    this.obInfoPopUpContainer.hide();
},
show: function() {
    this.obInfoPopUpContainer.show();
    Framework_stb.showSemitransparent();
},
/**
* @description This method creates the infoPopUp. It uses the following private methods:
*      _drawInfoPopUp()
*/
create: function() {
    if(!global.currentPopUp){
    // Gray's out the background
    Framework_stb.showSemitransparent();
    this._createInfoPopUp();
    this._drawInfoPopUp();
    // Adding the open event
    if (!Object.isEmpty(this.objEvents) && !Object.isEmpty(this.objEvents.get('onOpen'))) {
        document.fire(this.objEvents.get('onOpen'));
    }
        global.currentPopUp = this.obHtmlContent;
    }
    //There is another pop up already opened, so the new content is added at the end
    else
        global.currentPopUp.insert(this.obHtmlContent);
},
/**
* @description This method adds the call back function to the close button. It makes us of the following private method:
*      _addCallbackFunction()
*/
_addCallbackToCloseButton: function() {
    // The will check if the confirmation box has been drawn, the close button is available and a call back function String was provided.
    if (!this.boBoxIsDrawn && !Object.isEmpty(this.obCloseButton.get('callBack'))) {
        $('idModuleInfoPopUp_closeButton').observe('click', this.obCloseButton.get('callBack').bindAsEventListener(this));
    }
},
/**
* @description This method will stop / remove all the event listners associated with the infoPopUp.
*/
_stopObserving: function() {
    // Remove the listner of the close button
    if (!Object.isEmpty(this.obCloseButton) && !Object.isEmpty(this.obCloseButton.get('callBack')) && this.showCloseButton) {
        var closeButton = $('idModuleInfoPopUp_closeButton');
        if (closeButton) {
            closeButton.stopObserving();
        }
    }
},
/**
* @description This method will modify the indicator icon.
*/
_modifyIndicatorIcon: function() {

    if (!this.boBoxIsDrawn) {

        // TODO: Refactor
        var indicator = $('idModuleInfoPopUp_indicatorIcon');

        // If this returns -1 the requested indicator icon couldn't be found, so we assume that this is a specific css class
        var inIndexOfClassName = (this.ALLOWED_INDICATOR_ICONS).indexOf(this.stIndicatorIcon);
        if (inIndexOfClassName > -1) {

            // TODO: Refactor
            var msgPart = $('idModuleInfoPopUp_textMessagePart');
            var iconPart = $('moduleInfoPopUp_indicatorIconPart');

            if (this.stIndicatorIcon == "void") {
                iconPart.hide();
                msgPart.removeClassName('moduleInfoPopUp_textMessagePart');
                msgPart.addClassName('moduleInfoPopUp_textMessagePart_noIcon');
            }
            else {

                indicator.addClassName(this.INDICATOR_ICONS_CORRESPONDING_CSS_CLASSES[inIndexOfClassName]);
                msgPart.removeClassName('moduleInfoPopUp_textMessagePart');

                // For small pop ups, a new style is defined so that icon, margins and text fit 

                if (this.width > 500) {
                msgPart.addClassName(this.INDICATOR_TEXT_CORRESPONDING_CSS_CLASSES[inIndexOfClassName]);
                }
                else {
                    msgPart.addClassName('moduleInfoPopUp_textMessagePart_smallPopup test_popupCaption');
                }
                if (global.liteVersion) {
                    indicator.insert(this.TEXT_LITE_VERSION[inIndexOfClassName]);
                    indicator.addClassName("moduleInfoPopUp_indicatorIconLite");
                }
            }

        } else {
            indicator.addClassName(this.stIndicatorIcon);
        }
    }
},
/**
* @description This method will insert the content message into the infoPopUp.
*/
_insertHtmlContent: function() {
    if (!this.boBoxIsDrawn) {
        var textMessagePart = $('idModuleInfoPopUp_textMessagePart');
        textMessagePart.insert(this.obHtmlContent);
        if (textMessagePart.getHeight() > document.viewport.getHeight() - 150) {
            textMessagePart.setStyle({
                //height: document.viewport.getHeight() - 150 + 'px',
                overflowY: 'auto',
                overflowX: 'hidden',
                paddingRight: '30px'
            });
        }
    }
},
/**
* @description Creates an empty infoPopUp.
*/
_createInfoPopUp: function() {
    if (!this.boBoxIsDrawn) {
        var contentWidth = this.width + 44; //borders of the infopopup            
        var bordersWidth = this.width + 50;
        if (global.liteVersion && this.showCloseButton) {
            //TODO: add popup label
            var closeButtonHtml = '<button id="idModuleInfoPopUp_closeButton" class="link moduleInfoPopUp_closeButton" title="' + global.getLabel("Close") + ' ' + 'popup' + '"><span>x</span></button>';
        } else {
            var closeButtonHtml = '<button id="idModuleInfoPopUp_closeButton" class="moduleInfoPopUp_closeButton application_icon_close test_close_icon';
            if (!this.showCloseButton)
                closeButtonHtml += ' moduleInfoPopUp_closeButton_hidden';
            closeButtonHtml += '">' + '</button>';//<div class="application_icon_close">
        }
        //TODO: Use new Element to create this
		var additionalContentClasses = "";
		if(this.contentClass){
			additionalContentClasses = " " + this.contentClass;
		}
        var htmlCode = ''
                + '<div id="idModuleInfoPopUp_container" class="moduleInfoPopUp_container">'
                + "<div class='infoPopUpBorderContainer' style='width:" + bordersWidth + "px'><div class='popUp_upperLeftCorner'></div>"
                + "<div class='popUp_upperLine' style='width:" + this.width + "px;'></div>"
                + "<div class='popUp_upperRightCorner'></div>"
				+ closeButtonHtml
                + '</div></div>'
                + "<div id='moduleInfoPopUp_content' style='padding: 2px; width:" + contentWidth + "px;' class='popUp_messageBox test_popupCaption'>"
                + '<div class="moduleInfoPopUp_indicatorIconPart" id="moduleInfoPopUp_indicatorIconPart">'
                + '<div id="idModuleInfoPopUp_indicatorIcon" class="moduleInfoPopUp_indicatorIconVoid"></div>'
                + '</div>'
                + '<div id="idModuleInfoPopUp_textMessagePart" class="moduleInfoPopUp_textMessagePart' + additionalContentClasses + '">'
                + '</div>'
                + "</div>"
                + "<div class='infoPopUpBorderContainer' style='width:" + bordersWidth + "px'><div class='popUp_lowerLeftCorner'></div>"
                + "<div class='popUp_lowerLine' style='width:" + this.width + "px;'></div>"
                + "<div class='popUp_lowerRightCorner'></div></div>"
                + '</div>';
        this.obInfoPopUpContainer = new Element('div', {
            'id': 'idDivInfoPopUpContainer'
        });
		//This hidden element will avoid changing the focus outside the infoPopùp
		this.hiddenFocusReceiverDown = new Element("button",{
			"class": "moduleInfoPopUp_hiddenFocusReceiver"
		}).insert("&nbsp;");;
		this.hiddenFocusReceiverDown.observe("focus", this.focusCloseButton.bind(this));
		this.hiddenFocusReceiverUp = new Element("button",{
            "class": "moduleInfoPopUp_hiddenFocusReceiver"
        }).insert("&nbsp;");
        this.hiddenFocusReceiverUp.observe("focus", this.focusCloseButton.bind(this));
		this.obInfoPopUpContainer.insert(this.hiddenFocusReceiverUp);
		this.obInfoPopUpContainer.insert(htmlCode);
		this.obInfoPopUpContainer.insert(this.hiddenFocusReceiverDown);
        global.disableAllClickableElements(this.obInfoPopUpContainer);
        this.obInfoPopUpContainer.setStyle({
            zIndex: 5002
        });
        this.obInfoPopUpContainer.hide();
        $(document.body).insert(this.obInfoPopUpContainer);
    }
},
/**
 * Focuse the close button
 */
focusCloseButton: function(){
	if(Object.isEmpty(this.closeButton)){
		this.closeButton = $('idModuleInfoPopUp_closeButton');
	}
	if (!Object.isEmpty(this.closeButton) && Object.isElement(this.closeButton) && this.closeButton.nodeName.toLowerCase() == "button" && !this.closeButton.hasClassName("moduleInfoPopUp_closeButton_hidden")) {
		Form.Element.focus(this.closeButton);
    }
},
/**
* @description This method will draw the extra content on the infoPopUp.
*/
_drawInfoPopUp: function() {
    // Adds all the elements on demand if they haven't been created yet
    if (!this.boBoxIsDrawn) {
        this._modifyIndicatorIcon();
        this._insertHtmlContent();
        if (this.showCloseButton)
            this._addCallbackToCloseButton();
        this._positionInfoPopUp();
        this.obInfoPopUpContainer.show();
        this.focusCloseButton();
        this.boBoxIsDrawn = true;
    }
},
/**
* @description This method will reposition the infoPopUp.
*/
_positionInfoPopUp: function() {
    // Make sure the container is centered 
    //centerContainer('idDivInfoPopUpContainer', 'idModuleInfoPopUp_container', true);
    var top = document.viewport.getScrollOffsets().top + 50;
    var left = (document.viewport.getWidth() - (this.width + 50)) / 2;
    this.obInfoPopUpContainer.setStyle({
        "top": top + "px",
        "left": left + "px"
    });

}
});


