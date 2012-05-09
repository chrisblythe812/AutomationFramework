/**
 *@fileOverview balloon.js
 *@description Prototype/Scriptaculous based balloons (modified from HelpBalloon.js for SSW)
 */
/**
 * @constructor
 * @description Class representing help/dialog balloons
 */
var Balloon = Class.create(
/** 
*@lends Balloon 
*/
{
	/**
	 *@type String
	 *@description ID for Balloon
	 */
	id: null,
	/**
	 *@type Element
	 *@description Containing element of the balloon
	 */
	container: null,
	/**
	 *@type String
	 *@description Reference to an existing element (anchoring icon)
	 */
	domId: '',
	/**
	 *@type String
	 *@description Static content of the balloon
	 */
	content: '',
	/**
	 *@type Array
	 *@description Dimensions of the balloon ( [width, height] )
     *             (Balloon real size will be bigger : dimensions + borders)
	 */
	dimensions: [null, null],
	/**
	 *@type Boolean
	 *@description Says if the balloon has correct options
	 */
	correctOptions: false,
	/**
	 *@type Boolean
	 *@description Says if the balloon has to be repositioned
	 */
	toBeRepositioned: false,
	/**
	 *@type Object
	 *@description Stores the balloon coordinates
	 */
	balloonCoords: null,
	/**
	 *@type Number
	 *@description Borders' size of the balloon(width and height)
	 */
	border: 25,
	/**
	 *@type Number
	 *@description Distance from the balloon's center to the peak (width)
	 */
	peak_dist: 45,
	/**
	 *@type Number
	 *@description Peak's height
	 */
	peak_height: 96,
	/**
	 *@type Boolean
	 *@description The balloons visibility state
	 */
	visible: false,
	/**
	 *@type Number
	 *@description Width for dinamic balloons
	 */
	dinamicWidth: null,
	/**
	 *@type Number
	 *@description Default width for dinamic balloons
	 */
    objEvents: null,
    /**
     *@type Hash
     *@description The list of event names that can be fired 
     */
	defaultDinamicWidth: 200,
    /**
     *Constructor of the class Balloon
     */
	initialize: function(_obInitializeParameters) {
	    this.resizeEvent = this._reposition.bindAsEventListener(this);
        this._obInitializeParameters = Object.extend({
            events: null
        }, _obInitializeParameters || {});
        this.objEvents = this._obInitializeParameters.events;
	    // Balloon's container div creation
		this.container = new Element('div', {'class':'balloon_container'});
		this.id = 'Balloon_' + Element.identify(this.container);
		this.container.writeAttribute('id', this.id);
		if(global.liteVersion){
			this.peak_height = 30;
		}
	},
	/**
	 *@description Renders the Balloon
	 */
	_draw: function() {
		// Create all the elements on demand if they haven't been created yet
        var htmlCode = "<div id='upperLeftCorner_" + this.id + "' class='balloon_upperLeftCorner'></div>" +
                       "<div id='upperLine_" + this.id + "' class='balloon_upperLine'></div>" +
                       "<div id='upperRightCorner_" + this.id + "' class='balloon_upperRightCorner'></div>" +
                       "<div id='messageBox_" + this.id + "' class='balloon_messageBox test_popupCaption'>" +
                           "<div id='button_" + this.id + "' class='application_rounded_close'></div>" +
                       "</div>" +
                       "<div id='lowerLeftCorner_" + this.id + "' class='balloon_lowerLeftCorner'></div>" + 
                       "<div id='lowerLeftLine_" + this.id + "' class='balloon_lowerLine'></div>" +
                       "<div id='lowerPeak_" + this.id + "' class='balloon_lowerPeak_show'></div>" +
                       "<div id='lowerRightLine_" + this.id + "' class='balloon_lowerLine'></div>" +
                       "<div id='lowerRightCorner_" + this.id + "' class='balloon_lowerRightCorner'></div>";
        this.container.innerHTML = htmlCode;
        document.getElementsByTagName('body')[0].appendChild(this.container);
        // Click on the 'X' = balloon closed
        Event.observe($('button_' + this.id), 'click', this.hide.bindAsEventListener(this));
	},
	/**
	 *@description Sets the balloon's options
     *@param {Hash} options Ballon's options
	 */
	setOptions: function(options) {
	
        // Setting the events
        this.objEvents = options.get("events");
	
		// If there isn't an existing element...
		var element = options.get("domId");
		if (!element || !Object.isString(element)) {
		    alert(element + " domId: enter a string with an existing id");
		    this.domId = '';
		}
		else {
		    if (!Object.isElement($(element))) {
		        alert(element + " domId: enter an existing id");
		        this.domId = '';
		    }
		    else {
	            this.domId = element;
	            this.toBeRepositioned = true;
            }
		}
		// If there isn't correct content...
		var content = options.get("content");
		if (!content || (!Object.isString(content) && !Object.isNumber(content) && !Object.isElement(content))) {
		    alert(this.id + " content: enter a string or a number");
		    this.content = '';
		}
		else
		    this.content = content;
		// If there isn't correct dinamic width...
		var dinamicWidth = options.get("dinamicWidth");
		if (!dinamicWidth || !Object.isNumber(dinamicWidth)) {
		    if (dinamicWidth && !Object.isNumber(dinamicWidth))
		        alert(this.id + " dinamicWidth: enter a number (> " + this.defaultDinamicWidth + ")");
		    this.dinamicWidth = this.defaultDinamicWidth;
        }
		else {
		    if (dinamicWidth < this.defaultDinamicWidth) {
                alert(this.id + " dinamicWidth: enter a number (> " + this.defaultDinamicWidth + ")");
                this.dinamicWidth = this.defaultDinamicWidth;
            }
            else
		        this.dinamicWidth = dinamicWidth;
        }
		// If there aren't correct dimensions...
		var dimensions = options.get("dimensions");
		if (!dimensions)
		    this.dimensions = [null,null];
        else {
		    if (!Object.isArray(dimensions)) {
		        alert(this.id + " dimensions: enter an array [width,height]");
		        this.dimensions = [null,null];
		    }
		    else {
		        if (!Object.isEmpty(dimensions[0]) && !Object.isNumber(dimensions[0])) {
		            alert(this.id + " dimensions: incorrect width");
		            this.dimensions[0] = null;
		        }
		        else
                    this.dimensions[0] = dimensions[0];
		        if (!Object.isEmpty(dimensions[1]) && !Object.isNumber(dimensions[1])) {
		            alert(this.id + " dimensions: incorrect height");
		            this.dimensions[1] = null;
		        }
		        else
                    this.dimensions[1] = dimensions[1];
		    }
        }
        // If we have bad options...
		if (this.domId == '')
		    this.correctOptions = false;
        else {
            this.correctOptions = true; 
            this._draw();
            this._resize();
            if (this.toBeRepositioned)
			    this._reposition();
        }
	},
	/**
	 *@description Triggers the balloon to appear
	 */
	show: function() {
		if(!this.visible && this.correctOptions) {
		    // Click outside the balloon = balloon closed
		    if(!this.eventMouseUp)
		        this.eventMouseUp = document.on('mouseup',this._checkOutside.bind(this));
		    else
		        this.eventMouseUp.start();
			this._afterShow();
			// Reposition if the window is resized
			Event.observe(window, 'resize', this.resizeEvent);
			if(!Object.isEmpty(this.closeButton))
                Form.Element.focus(this.closeButton);
		}
		
        // Adding the show event
        if(!Object.isEmpty(this.objEvents) && !Object.isEmpty(this.objEvents.get('onShow'))) {
            document.fire(this.objEvents.get('onShow'));
        }

	},
	/**
	 *@description Sets the container's display to block
	 */
	_afterShow: function() {
        this.container.removeClassName('balloon_container_hide');
        this.container.addClassName('balloon_container_show');
		this.visible = true;
		//I call this function to avoid errors with Select elements in IE6
		iFrameToSelect(this.container);
	},
	/**
	 *@description Hides the balloon
	 */
	hide: function() {
		if(this.visible && this.correctOptions) {
			this._afterHide();
			Event.stopObserving(window, 'resize', this.resizeEvent);
		    this.eventMouseUp.stop();
		}
		
	},
	/**
	 *@description Sets the container's display to none
	 */
	_afterHide: function() {
        this.container.removeClassName('balloon_container_show');
        this.container.addClassName('balloon_container_hide');
		this.visible = false;
		
        // Adding the hide event
        if(!Object.isEmpty(this.objEvents) && !Object.isEmpty(this.objEvents.get('onHide'))) {
            document.fire(this.objEvents.get('onHide'));
        }
        //I call this function to avoid errors with Select elements in IE6
        iFrameToSelectHide();
	},
	/**
	 *@description Redraws the balloon based on the current coordinates of the DOM element
	 */
	_reposition: function() {
	    // If there isn't an existing element...
		if(!this.domId) return;
	    var element = $(this.domId);
		if(Object.isEmpty(element)) return;
		// Element's coords
	    this.balloonCoords = this._getXY(element);
	    // Balloon's coords
		this.balloonCoords.x += (element.offsetWidth / 2);
		this.balloonCoords.y += (element.offsetHeight / 2);
		var zx = 0;
		var zy = 0;
		var hidePeak = false;
		// Taking into account the scrolling
		var scroll = document.viewport.getScrollOffsets();
		// scroll[0] = horizontal scroll; scroll[1] = vertical scroll
		zx = this.balloonCoords.x - ((this.dimensions[0] + (this.border*2))/2) + this.peak_dist;
		if (zx < scroll[0]) {
		    zx = scroll[0];
		    hidePeak = true;
		}
        // Taking into account screen width
        var screenWidth = document.getElementsByTagName('body')[0].scrollWidth;
        if ((zx + this.dimensions[0] + (this.border*2)) >  (screenWidth + scroll[0])) {
            zx = screenWidth - (this.dimensions[0] + this.border + (this.peak_dist/2) + 4) + scroll[0];
            hidePeak = true;
        }
		zy = this.balloonCoords.y - (this.dimensions[1] + this.border + this.peak_height);
		if (zy < scroll[1]) {
		    zy = scroll[1];
		    hidePeak = true;
        }
		var peak_height_div;
		// If there's replacement, we won't show the peak
        if (hidePeak) {
            peak_height_div = this.border;
            $('lowerPeak_' + this.id).removeClassName('balloon_lowerPeak_show');
            $('lowerPeak_' + this.id).addClassName('balloon_lowerPeak_hide'); 
			Element.setStyle($('lowerPeak_' + this.id), {
			    // We have to subtract 1px from the border
                'height':       peak_height_div - 1 + 'px'
			});
        }
        else {
            peak_height_div = this.peak_height;
            $('lowerPeak_' + this.id).removeClassName('balloon_lowerPeak_hide');
            $('lowerPeak_' + this.id).addClassName('balloon_lowerPeak_show');
			Element.setStyle($('lowerPeak_' + this.id), {
			    // We have to subtract 1px from the border
                'height':       peak_height_div + 'px'
			});
        }
		Element.setStyle(this.container, {
			'left' 	: zx + 'px',
			'top'	: zy + 'px',
			// 50px = Borders' size (25+25)	
			'width' : (this.dimensions[0] + (this.border*2)) + 'px',
			'height' : (this.dimensions[1] + this.border + peak_height_div) + 'px'
		});
	},
	/**
	 *@description Resizes the Balloon
	 */
	_resize: function() {
        if ((Object.isEmpty(this.dimensions[0])) && (Object.isEmpty(this.dimensions[1]))) {
            // We have to fix the width, put the content, and then, calculate the height
			Element.setStyle($('messageBox_' + this.id), {
                'width':       this.dinamicWidth + 'px'
			});
            // Reset content value:
            Event.stopObserving($('button_' + this.id), 'click', this.hide.bindAsEventListener(this));
			var messageBox = $('messageBox_' + this.id);
			if(global.liteVersion){
				this.closeButton = new Element("button", {
				id: "button_" + this.id,
                    "class": "link ballon_closeButton test_close_icon",
                    "title": global.getLabel("Close") + " " + global.getLabel("balloon")
                });
				messageBox.update(this.closeButton.insert("<span class='ballon_closeButtonSpan'>x</span>"));
			}else{
				this.closeButton = new Element("button", {
	                id: "button_" + this.id,
	                "class": "application_rounded_close balloon_closeButton test_close_icon"
	            });
				messageBox.update(this.closeButton);
			}
			messageBox.insert(this.content);
		    Event.observe(this.closeButton, 'click', this.hide.bindAsEventListener(this));
		    // Container added into the document (to calculate the height)
		    document.getElementsByTagName('body')[0].appendChild($('messageBox_' + this.id));
		    this.dimensions[0] = $('messageBox_' + this.id).getWidth();
		    this.dimensions[1] = $('messageBox_' + this.id).getHeight();
		    this.container.appendChild($('messageBox_' + this.id));
		    this.container.appendChild($('lowerLeftCorner_' + this.id));
		    this.container.appendChild($('lowerLeftLine_' + this.id));
		    this.container.appendChild($('lowerPeak_' + this.id));
		    this.container.appendChild($('lowerRightLine_' + this.id));
		    this.container.appendChild($('lowerRightCorner_' + this.id));
        }
        else {
	        /* We have to be sure we have correct dimensions
	           (if we haven't them, we put default ones)
	           (if dimensions are lower than 100x100, we put default dimensions) */
		    var defaultDimensions = [100,100];
		    if (!this.dimensions[0] || Object.isEmpty(this.dimensions[0]) || this.dimensions[0] < defaultDimensions[0])
		        this.dimensions[0] = defaultDimensions[0];
		    if (!this.dimensions[1] || Object.isEmpty(this.dimensions[1]) || this.dimensions[1] < defaultDimensions[1])
		        this.dimensions[1] = defaultDimensions[1];
            // Reset content value:
            Event.stopObserving($('button_' + this.id), 'click', this.hide.bindAsEventListener(this));
        $('messageBox_' + this.id).update("<div id='button_" + this.id + "' class='application_rounded_close'></div>");
        $('messageBox_' + this.id).insert(this.content);
		    Event.observe($('button_' + this.id), 'click', this.hide.bindAsEventListener(this));
		}
		// Reapply styling to components as values might have changed
		Element.setStyle($('upperLine_' + this.id), {
            'width':        this.dimensions[0] + 'px'
		});
		Element.setStyle($('messageBox_' + this.id), {
		    // We have to subtract 2px from the borders
            'width':        (this.dimensions[0] - 2) + 'px',
            'height':       this.dimensions[1] + 'px',
            'paddingLeft':  this.border + 'px',
            'paddingRight': this.border + 'px'
		});
		Element.setStyle($('lowerLeftLine_' + this.id), {
		    // 98px = the peak's width
            'width':        ((this.dimensions[0] - 98)/2)+ 'px'
		});       
		Element.setStyle($('lowerRightLine_' + this.id), {
		    // 98px = the peak's width
            'width':        ((this.dimensions[0] - 98)/2)+ 'px'
		});
	},
	/**
	 *@description Gets the current position of the obj
	 *@param {Element} obj Element to get position of
	 *@returns {Object}
	 */
	_getXY: function(obj) {
		var pos = Position.cumulativeOffset(obj);
		var y = pos[1];
		var x = pos[0];
		var x2 = x + parseInt(obj.offsetWidth);
		var y2 = y + parseInt(obj.offsetHeight);
		return {'x':x, 'y':y, 'x2':x2, 'y2':y2};
	},
    /**
     *@description Gets the balloon's content
     *@returns {Object} content
     */
     getContent: function() {
        var content = this.content;
        return content;
     },
    /**
     *@description Gets the balloon's domId
     *@returns {String} domId
     */
     getDomId: function() {
        var domId = this.domId;
        return domId;
     },
    /**
     *@description Says if the balloon is visible
     *@returns {Boolean} visible
     */
     isVisible: function() {
        var visible = this.visible;
        return visible;
     },
	/**
	 *@description Triggers the balloon to appear adding some options (domId, content or dimensions)
     *@param {Hash} options Ballon's options
	 */
	showOptions: function(options) {
	    // We will set the options if they are different to the previous ones
        if ((this.domId != options.get("domId")) || (this.content != options.get("content")) || (this.dimensions != options.get("dimensions")) || (this.dinamicWidth != options.get("dinamicWidth")))
            this.setOptions(options);
        else {
            this._reposition();
        }
        this.show();
	},
    /**
     *@description Checks if a click is done inside a balloon element or not. If yes, it hides the balloon.
     *@param {Event} evt Event information
     */
    _checkOutside: function(evt) {
       var element = evt.element();
    if (Object.isElement(element)) {
            if((clickedOutsideElement('messageBox_'+this.id, evt)) && !(element.identify() == this.domId)){
                this.hide();
            }
    }
}
});

 /**
  *@type Balloon
  *@description Object for showing a help/dialog balloon
  */
 var balloon = new Balloon();