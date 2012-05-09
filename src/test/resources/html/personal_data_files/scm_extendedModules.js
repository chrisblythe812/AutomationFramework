/**
 * @class
 * Class that allow to manage the dimensions of a text
 * To use it:
 * <pre>
 * 	var sm = SCM_SizeManager.factory('anyName');
 *	sm.setParameters(element_to_fill/class_name, 'text_to_add');
 *	element_to_fill.innerHTML = sm.truncate(element_to_fill.getWidth());
 *	sm.remove();
 * </pre>
 * If you have several items to compute, you can create a single sizeManager, but you have to open/close each time
 * <pre>
 * 	var sm = SCM_SizeManager.factory('anyName');
 *  items.each(function(element_to_fill){
 *		sm.setParameters(element_to_fill, 'text_to_add');
 *		element_to_fill.innerHTML = sm.truncate(element_to_fill.getWidth());
 *	}, this);
 *	sm.remove();
 * </pre>
 * @author jonathanj & nicolasl
 * @version 4.2
 * <br/>Modification for 4.2
 * <ul>
 * <li>Performance issue to build the grouping tree - reduce the number of width calculation</li>
 * </ul>
 * <br/>Modified in 3.1
 */
var SCM_SizeManager = Class.create(/** @lends SCM_SizeManager.prototype */{
	/**
	 * Id that allow to identify the created div
	 * @type String
	 * @since 3.0
	 */
	_ident: null,
	
	/**
	 * Element that will contain the text to compute its size
	 * @type Element
	 * @since 3.0
	 */
	_hiddenDiv: null,
	
	/**
	 * Initialize the main parameters of the class and add an invisible div in the document
	 * @param {String} id Identifier of the size manager
	 * @since 3.0
	 */
	initialize: function(ident) {
		this._ident = ident;
		this._open	= false;
	},
	
	/**
	 * Open the manager and place the div that will allow to compute sizes
	 * @param {Element/String} element Element that contains the text to compute with all the classes already set or a class name to apply
	 * @param {String} text Text to serve as base
	 * @param {Boolean} keepElem Optional parameter that allow to avoid creating a new element if it already exist
	 * @since 3.0
	 */
	setParameters: function(element, text, keepElem) {
		//If there is no element or if it is not to keep
		if(Object.isEmpty(this._hiddenDiv) || !keepElem) {
			//If the element already exist, remove it
			if(!Object.isEmpty(this._hiddenDiv)) this._hiddenDiv.remove();
			//Create the hidden div with the same content as the source
			this._hiddenDiv = new Element('div', {
				'id': 'hiddenDiv_' + this._ident,
				'style': 'position: absolute; visibility: hidden; height: auto; width: auto;'
			});
			//Add the element to compute size after the 
			document.body.insert(this._hiddenDiv);
			
			//Update the style
			if (Object.isString(element)) {
				$w(this._hiddenDiv.className).each(function(className){
					this._hiddenDiv.removeClassName(className);
				}, this);
				this._hiddenDiv.addClassName(element);
			}
			else {
				var style = element.getStyles();
				this._hiddenDiv.setStyle({
					fontSize		: style.fontSize,
					fontWeight		: style.fontWeight,
					borderLeft		: style.borderLeftWidth,
					borderRight		: style.borderRightWidth,
					borderTop		: style.borderTopWidth,
					borderBottom	: style.borderBottomWidth,
					padding			: style.paddingTop + ' ' + style.paddingRight + ' ' + style.paddingBottom + ' ' + style.paddingLeft,
					margin			: (style.marginTop || 'auto') + ' ' + (style.marginRight || 'auto') + ' ' + (style.marginBottom || 'auto') + ' ' + (style.marginLeft || 'auto'),
					outline			: (style.outlineColor || 'inherit') + ' ' + (style.outlineStyle || 'none') + ' ' + (style.outlineWidth || 'inherit'),
					lineHeight		: style.lineHeight,
					letterSpacing	: style.letterSpacing,
					textIndent		: style.textIndent,
					wordSpacing		: style.wordSpacing
				});
			}
		}
		//Update the content
		this._hiddenDiv.innerHTML = text.stripTags();	
	},
	
	/**
	 * Close the sizeManager by removing the element to compute and removing
	 * it from the static list of size managers
	 * @since 3.0
	 */
	remove: function() {
		//Remove the manager from the static list
		SCM_SizeManager.listManagers.unset(this._ident);
		//Remove the created element
		if(this._hiddenDiv && this._hiddenDiv.up()) this._hiddenDiv.remove();
	},
	
	/**
	 * Get the number of chars in the content
	 * @return {Integer} The number of chars
	 * @since 3.0
	 */
	getTextLength: function() {
		return this._hiddenDiv.innerHTML.length;
	},
	
	/**
	 * Get the width of the text as it is
	 * @return {Integer} The number of px
	 * @since 3.0
	 * <br/>Modified in 4.2
	 * <ul>
	 * <li>Don't use the clientWidth property</li>
	 * </ul>
	 */
	getTextWidth: function() {
		//since 4.2 - Avoid using the clientWidth property
		var layout = new Element.Layout(this._hiddenDiv);
		return layout.get('padding-box-width');
	},
	
	/**
	 * Get the string with the biggest number of chars followd by '...' that can go in a div with the given max size
	 * @param {Integer} maxSize Maximum size of the element to truncate
	 * @param {Boolean} onePoint Set only one point at the end to replace the '...'
	 * @return {String} The truncate string with the maximum width 
	 * @since 3.0
	 * <br/>Modified in 4.2
	 * <ul>
	 * <li>Remove one calcul of the text width</li>
	 * </ul>
	 * <br/>Modified in 3.1
	 * <ul>
	 * <li>If there are several lines, keep only the first one</li>
	 * </ul>
	 */
	truncate: function(maxSize, onePoint) {
		//By default set onePoint to false
		onePoint = (onePoint === true);
		
		if(maxSize <= 1 && onePoint) return '.';
		if(maxSize <= 3 && !onePoint) return '...';
		
		//since 3.1 If there are several lines, the process failed
		var text = this._hiddenDiv.innerHTML.replace(/\\W+/, '').strip().split(/\\n/)[0];
		var resultText;
		var numChars;
		
		//since 4.0 - Get the length of the extension to don't use the truncate
		var pointsSize 	= (onePoint)? 1: 3;
		var points		= (onePoint)? '.': '...';
		
		//The string could be displayed completely
		if(this.getTextWidth() <= maxSize) return text;
		
		//Compute the estimation of the number of chars to use
		//since 4.0 - Remove the size of the dots in the estimation
		numChars = Math.round(maxSize * this.getTextLength() / this.getTextWidth()) - pointsSize;
		if(numChars <= 0) return points;
		
		//Truncate the string to this estimated size
		this._hiddenDiv.innerHTML = text.substring(0, numChars) + points;
		
		//since 4.0 - Limit to 2 iterations (most often, only 1 is needed)
		var numIterations = 2;
		//If we have to increase the text size
		//since 4.2 - Performance issue to build the grouping tree - Compute the text width once less
		var textWidth = this.getTextWidth();
		if(textWidth <= maxSize) {
			while(textWidth <= maxSize && numIterations > 0) {
				resultText = this._hiddenDiv.innerHTML;
				numChars++;
				this._hiddenDiv.innerHTML = text.substring(0, numChars) + points;
				numIterations--;
				textWidth = this.getTextWidth();
			}
		//If we have to decrease the text size
		} else {
			while(textWidth > maxSize && numIterations > 0) {
				numChars--;
				this._hiddenDiv.innerHTML = text.substring(0, numChars) + points;
				resultText = this._hiddenDiv.innerHTML;
				numIterations--;
				textWidth = this.getTextWidth();
			}
		}
		
		this._hiddenDiv.update(text);
		return resultText;
	}
});

/**
 * Static list with all the already created managers.<br/> 
 * It is possible to remove elements from this list via the method {@link SCM_SizeManager#remove}
 * @type Hash
 * @since 3.0
 */
SCM_SizeManager.listManagers = $H();

/**
 * Factory that it is in charge to keep only one instance by given id
 * @param {String} ident Identifier of the Size manager to get
 * @since 3.0
 */
SCM_SizeManager.factory = function(ident){
	var oldManager = SCM_SizeManager.listManagers.get(ident);
	if (!oldManager) {
		oldManager = new SCM_SizeManager(ident);
		SCM_SizeManager.listManagers.set(ident, oldManager);
	}
	return oldManager;
};

/**
 * @class
 * Class that protect some parts of the screen behind a shield
 * @author jonathanj & nicolasl
 * @since 3.0
 */
var SCM_Shield = Class.create(/** @lends SCM_Shield.prototype */{
	/**
	 * Element to place before an element to protect it again user clicks
	 * @type Element
	 * @since 3.0
	 */
	_shield: null,
	
	/**
	 * Initialize the shield
	 * @since 3.0
	 */
	initialize: function() {
		this._shield = new Element('div', {
			'id'	: 'SCM_shield',
			'class'	: 'SCM_shield'
		});
	},
	
	/**
	 * Add the shield on a given element
	 * @param {Element} parent The element to protect
	 * @since 3.0
	 */
	add: function(parent) {
		var offset = parent.positionedOffset();
		this._shield.setStyle({
			'left'	: offset[0] + 'px',
			'top'	: offset[1] + 'px',
			'width'	: parent.getWidth() + 'px',
			'height': parent.getHeight() + 'px'
		});
		parent.insert(this._shield);
	},
	
	/**
	 * Remove the shield
	 * @since 3.0
	 */
	remove: function() {
		this._shield.setStyle({
			'left'	: 0,
			'top'	: 0,
			'width'	: 0,
			'height': 0
		});
		this._shield.remove();
	}
});

/**
 * @class
 * Clas that creates links via the megabutton displayer class
 * @author nicolasl
 * @since 3.3
 * <br/>Modified in 4.0
 * <ul>
 * <li>Add the update label and the update handler functions</li>
 * </ul>
 * <br/>Modified in 3.6
 * <ul>
 * <li>Addition of features to enable, disable and get a reference of the button</li>
 * </ul>
 */
var SCM_LinkBuilder = Class.create(/** @lends SCM_LinkBuilder.prototype */{
	/**
	 * Mega button displayer used to the display of the links
	 * @since 3.3
	 */
	buttonDisplayer: null,
	
	/**
	 * Overwrite the constructor to set by default the parameters to build a set of links.
	 * @param {Array/Object} buildParams List of parameters to build the list of buttons (if there is only one element, it can be the object and not a list).
	 * Each element of the array contains:
	 * <ul>
	 * <li><b>id</b> (<i>String</i>): The identifier of the link
	 * <li><b>label</b> (<i>String</i>): The label to map in the labels list
	 * <li><b>handler</b> (<i>Function</i>): The function to call when the link is clicked
	 * <li><b>extraClassNames</b> (<i>String</i>): (Optional) If there are class names out of the links that are to add
	 * </ul>
	 * @since 3.3
	 */
	initialize: function(buildParams){
		//If it is a single object and not an array, transform it as an array
		var listParams 	= objectToArray(buildParams);
		var listButtons = {elements: $A([])};
		
		//Add the different links in a list
		listParams.each(function(params){
			listButtons.elements.push({
				label 		: global.getLabel(params.label),
				handler 	: params.handler,
				className 	: 'application_action_link '	+ ((params.extraClassNames)?params.extraClassNames:''),
				type 		: 'link',
				idButton 	: params.id});
		}.bind(this));
		
		this.buttonDisplayer = new megaButtonDisplayer(listButtons);
	},
	
	/**
	 * Alias for the method getButton of the megaButtonDisplayer
	 * @param {String} idLink Identifier of the link to retrieve
	 * @returns {HTML Element} The content of the button for display
	 * @since 3.3
	 */
	getLink: function(idLink) {
		return this.buttonDisplayer.getButton(idLink);
	},
	
	/** 
	 * Alias for the method getButtons of the megaButtonDisplayer
	 * @returns {HTML Element} The content of the buttons for display
	 * @since 3.3
	 */
	getLinks: function() {
		return this.buttonDisplayer.getButtons();
	},
	
	/**
	 * Get the list of button ids
	 * @returns {Array} List with the ids of all the buttons
	 * @since 3.6
	 */
	getLinksIds: function() {
		return this.buttonDisplayer.getButtonsArray().keys();
	},
	/**
	 * Get the Element associated to the link with the given Id
	 * @param {String} idLink Identifier of the link
	 * @returns {Element} The element with the link
	 * @since 3.6
	 */
	getElement: function(linkId) {
		return this.buttonDisplayer.getElement(linkId);
	},
	/** 
	 * Enable the link
	 * @param {String} idLink Identifier of the link
	 * @since 3.6
	 */
	enable: function(idLink) {
		this.buttonDisplayer.enable(idLink);
	},
	
	/**
	 * Disable the link
	 * @param {String} idLink Identifier of the link
	 * @since 3.6
	 */
	disable: function(idLink) {
		this.buttonDisplayer.disable(idLink);
	},
	/**
	 * Update the label on the link
	 * @param {String} idLink Identifier of the link to update
	 * @param {String} label The new text for the link
	 * @since 4.0
	 */
	updateLabel: function(idLink, label){
		this.buttonDisplayer.updateLabel(idLink, label);
	},
	/**
	 * Update the handler associated to the link
	 * @param {String} idLink Identifier of the link
	 * @param {Function} handler The handler method
	 * @since 4.0
	 */
	updateHandler: function(idLink, handler) {
		this.buttonDisplayer.updateHandler(idLink, handler);
	}
});
/**
 * @class
 * Class that creates a link via the megabutton displayer class
 * @author nicolasl
 * @since 4.0
 */
var SCM_SingleLinkBuilder = Class.create(SCM_LinkBuilder, /** @lends SCM_SingleLinkBuilder.prototype */{
	/**
	 * Identifier of the single link
	 * @type String
	 * @since 4.0
	 */
	_linkId: null,
	
	/**
	 * Overwrite the constructor to get the id to use as link ID.
	 * @param {Array/Object} buildParams List of parameters to build the list of buttons (if there is only one element, it can be the object and not a list).
	 * Each element of the array contains:
	 * <ul>
	 * <li><b>label</b> (<i>String</i>): The label to map in the labels list
	 * <li><b>handler</b> (<i>Function</i>): The function to call when the link is clicked
	 * <li><b>extraClassNames</b> (<i>String</i>): (Optional) If there are class names out of the links that are to add
	 * </ul>
	 * @since 4.0
	 */
	initialize: function($super, buildParams){
		buildParams.id = 'SCM_SingleLink_' + SCM_SingleLinkBuilder.COUNTER;
		SCM_SingleLinkBuilder.COUNTER++;
		this._linkId = buildParams.id;
		$super(buildParams);
	},
	/**
	 * Alias for the method getButton of the megaButtonDisplayer with the only id
	 * @returns {HTML Element} The content of the button for display
	 * @since 4.0
	 */
	getLink: function($super) {
		return $super(this._linkId);
	},
	/**
	 * Get the Element associated to the link with the only id
	 * @returns {Element} The element with the link
	 * @since 4.0
	 */
	getElement: function($super) {
		return $super(this._linkId);
	},
	/** 
	 * Enable the link
	 * @since 3.6
	 */
	enable: function($super) {
		$super(this._linkId);
	},
	
	/**
	 * Disable the link
	 * @since 3.6
	 */
	disable: function($super) {
		$super(this._linkId);
	},
	/**
	 * Update the label on the link
	 * @param {String} idLink Identifier of the link to update
	 * @param {String} label The new text for the link
	 * @since 4.0
	 */
	updateLabel: function($super, label){
		$super(this._linkId, label);
	},
	/**
	 * Update the handler associated to the link
	 * @param {String} idLink Identifier of the link
	 * @param {Function} handler The handler method
	 * @since 4.0
	 */
	updateHandler: function($super, handler) {
		$super(this._linkId, handler);
	}
});

/**
 * Static variable to build unique ids for the links
 * @type Integer
 * @default 0
 * @since 4.0
 */
SCM_SingleLinkBuilder.COUNTER = 0;

/**
 * @class
 * Manage the display or the edition of several HTML content in a single ckEditor
 * @author nicolasl
 * @since 4.0
 * <br/>Modified in 5.2
 * <ul>
 * <li>Check if editor exists before enabling/disabling plugins</li>
 * </ul>
 * <br/>Modified in 5.1
 * <ul>
 * <li>1057950 - Disable all the plugins by default</li>
 * </ul>
 * <br/>Modified in 5.0
 * <ul>
 * <li>Create handler if ckEditor is not created
 * </ul>
 * <br/>Modified in 4.3
 * <ul>
 * <li>1049665 - Language issue with ckEditor</li>
 * <li>Allow to indicate a first displayer to show</li>
 * <li>Save the value in the previous editor before switching</li>
 * <li>Add a way to redisplay the ckEditor instance if needed</li>
 * </ul>
 */
var Scm_HtmlDisplayer = Class.create(/** @lends Scm_HtmlDisplayer.prototype */{
	/**
	 * @type Boolean
	 * Indicate if the ckEditor instance is already created
	 * @since 4.0
	 */
	_ckEditorCreated: null,
	/**
	 * @type Boolean
	 * Indicate if the creation of a ckEditor instance was requested
	 * @since 4.0
	 */
	_ckEditorCreationRequested: null,
	/**
	 * @type String
	 * Name of hte ckEditor instance created
	 * @since 4.0
	 */
	_ckEditorName: null,
	/**
	 * @type string
	 * Name of the instance currently on the screen
	 * @since 4.0
	 */
	_current: null,
	/**
	 * @type String
	 * Name of the editor to start by default
	 * @since 4.3
	 */
	_defaultEditor: null,
	/**
	 * @type Element
	 * Div to contains the text to show only
	 * @since 4.0
	 */
	_displayerParent: null,
	/**
	 * @type Element
	 * Div Element to store the WYSIWYG editor
	 * @since 4.0
	 */
	_editorParent: null,
	/**
	 * @type Array
	 * List of events
	 * @sinec 5.0
	 */
	_events: null,
	/**
	 * @type String
	 * Unique ID used to create div names for the different objects
	 * @since 4.0
	 */
	_uniqueId: null,
	/**
	 * @type hash
	 * HTML content of the different displayer and if they are to view or edit identified by name
	 * @since 4.0
	 */
	_values: null,
	/**
	 * Prepare the HTML to allow displaying a ckEditor instance or a div
	 * @param {Element} parent Div element to replace by the current object.
	 * @param {String} defaultEditor (Optional) Name of the editor to start by default
	 * @since 4.0
	 * <br/>Modified in 5.0
	 * <ul>
	 * <li>Initialize the list of listeners</li>
	 * </ul>
	 */
	initialize: function(parent) {
		//Build the unique ID
		this._uniqueId = 'SCM_HtmlDisplayer_' + Scm_HtmlDisplayer._UNIQUE_ID;
		Scm_HtmlDisplayer._UNIQUE_ID ++;
		//Add the div to contains the viewer and editor instance 
		this._displayerParent 	= new Element('div', {'id': this._uniqueId + '_display', 'class': 'SCM_HtmlDisplayerDisplay'});
		this._displayerParent.insert('<div class="SCM_HtmlDisplayerDisplayInner"><div class="SCM_HtmlDisplayerDisplayInnerInner"></div></div>');
		this._editorParent		= new Element('div', {'id': this._uniqueId + '_editor', 'class': 'SCM_HtmlDisplayerEdit'});
		this._editorParent.hide();
		parent.insert(this._displayerParent);
		parent.insert(this._editorParent);
		//Initialize the other parameters
		this._ckEditorCreated 			= false;
		this._ckEditorCreationRequested	= false;
		this._current					= null;
		this._values					= $H();
		//since 5.0 - Initialize the list of listeners
		this._events					= $A();
	},
	/**
	 * Add a new possible instance of edit or view
	 * @param {String} editorName Name of the editor to add
	 * @param {Boolean} view Indicate if the HTML is to view or to edit
	 * @param {String} data Default data
	 * @param {Array} editorEvents List of events in on the editor with fomat (name: string, handler: function)
	 * @since 4.0
	 * <br/>Modified in 5.1
	 * <ul>
	 * <li>1057950 - Disable all the plugins by default</li>
	 * </ul>
	 * <br/>Modified in 5.0
	 * <ul>
	 * <li>Add a list of events on the editor</li>
	 * </ul>
	 * <br/>Modified in 4.3
	 * <ul>
	 * <li>If the added editor is the default one, display it directly</li>
	 * </ul>
	 */
	addEditor: function(editorName, view, data, editorEvents) {
		//since 5.0 - Add the events in the list of values
		this._values.set(editorName, {
			view		: view,
			text		: (data)?data:'',
			plugins		: $H({
				//since 5.1 - 1057950 - Disabled the actions by default
				'insertTemplate': false,
				'insertSignature': false,
				'addAttachment': false
			}),
			editorEvents: (editorEvents)? editorEvents: $A()
		});
		
		//since 4.3 - Once the default editor is added, switch to it
		if(editorName === this._defaultEditor) {
			this.switchToEditor(editorName);
			this._defaultEditor = null;
		}
	},
	/**
	 * Delete the ckEditor instance and the HTML content for the editor
	 * @since 4.0
	 */
	destroy: function() {
		//If the editor is created, we have to remove it
		if(this._ckEditorCreated && CKEDITOR && CKEDITOR.instances) {
			var editor = this._getEditor();
			if(editor) {
				//Avoid to have events generated after this closure (because the object no more exist)
				editor.fire = function(name, params) {
					return params;
				};
				editor.destroy();
			}
			//Remove the CSS classes to avoid having to much of them
			if(CKEDITOR.document.$.styleSheets && CKEDITOR.document.$.styleSheets.length > 0 && Prototype.Browser.IE) {
				var regExp = new RegExp('^#cke_' + this._uniqueId + '_editor');
				$A(CKEDITOR.document.$.styleSheets).each(function(cssSheet){
					if(cssSheet.href === "" && (!Object.isEmpty(cssSheet.cssText.match(/^\.cke_skin_kama(\s|\n)*{(\s|\n)*VISIBILITY(\s|\n)*:( |\n)*hidden(\s|\n)*}$/m)) || cssSheet.cssText.match(regExp))) {
						var styleNode = $$('style[uniqueID="' + cssSheet.owningElement.uniqueID + '"]')[0];
						styleNode.parentNode.removeChild(styleNode);
					}
				}, this);
			}
		}
		this._ckEditorCreated = false;
		this._ckEditorCreationRequested = false;
		//Remove the HTML content
		this._displayerParent.remove();
		this._editorParent.remove();
		delete this._displayerParent;
		delete this._editorParent;
	},
	/**
	 * Get the content of the editor with the given name
	 * @param {String} editorName The name of the editor with the value to retrieve
	 * @returns {String} The content of the editor
	 * @since 4.0
	 * <br/>Modified in 5.0
	 * <ul>
	 * <li>Add the events on the editor in the list of values</li>
	 * </ul>
	 */
	getData: function(editorName) {
		var value = this._values.get(editorName);
		if(!value) return null;
		
		var result = "";
		//If the data to retrieve is in the current editor, get it directly
		if(editorName === this._current && !value.view && this._ckEditorCreated) {
			result = this._getEditor().getData();
			//since 5.0 - Add the events on the editor in the list of values
			this._values.set(editorName, {
				view		: value.view,
				text		: result,
				plugins		: value.plugins,
				editorEvents: value.editorEvents
			});
		} 
		else {
			result = value.text;
		}
		return result;
	},
	/**
	 * Get the ckEditor instance
	 * @returns {CKEDITOR} The ckEditor instance
	 * @since 4.0
	 */
	_getEditor: function() {
		if(!this._ckEditorCreated) return null;
		
		var editor = CKEDITOR["instances"][this._ckEditorName];
		if(editor) return editor;
		else return null;
	},
	/**
	 * Disable a plugin for the HTML editor
	 * @param {String} editorName The name of the editor
	 * @param {String} pluginName The name of the plugin
	 */
	pluginDisable: function(editorName, pluginName) {
		var value = this._values.get(editorName);
		if (!value || value.view) { return; }
		value.plugins.set(pluginName, false);
		if (this._ckEditorCreated) {
			var command = this._getEditor().getCommand(pluginName);
			if(command) {
				command.disable();
			}
		}
	},
	/**
	 * Enable a plugin for the HTML editor
	 * @param {String} editorName The name of the editor
	 * @param {String} pluginName The name of the plugin
	 */
	pluginEnable: function(editorName, pluginName) {
		var value = this._values.get(editorName);
		if (!value || value.view) { return; }
		value.plugins.set(pluginName, true);
		if(this._ckEditorCreated) {
			var command = this._getEditor().getCommand(pluginName);
			if(command) {
				command.enable();
			}
		}
	},
	/**
	 * Update the value in an editor
	 * @param {String} editorName Name of the editor
	 * @param {String} newValue Value to put in the editor
	 * @param {Function} callBack Function to call after the modification
	 * @returns {String} The previous value of the editor
	 * @since 4.0
	 * <br/>Modifiedin 5.0
	 * <ul>
	 * <li>Add the events on the editor in the list of values</li>
	 * </ul>
	 */
	setData: function(editorName, newValue, callBack) {
		var value = this._values.get(editorName);
		if(!value) return null;
		
		//Get the text to return
		var result = value.text;
		//Update the table in the view
		//since 5.0 - Add the events on the editor in the list of values
		this._values.set(editorName, {
			view		: value.view,
			text		: newValue,
			plugins		: value.plugins,
			editorEvents: value.editorEvents
		});
		//If the data to update is for the current editor, update it
		if (editorName === this._current) {
			if(value.view) {
				this._updateView(newValue, callBack);
			}
			else {
				this._updateEditor(newValue, callBack);
			}
		}
	},
	/**
	 * Switch to another editor
	 * @param {String} editorName The new editor to display
	 * @since 4.0
	 * <br/>
	 * <br/>Modified in 5.0
	 * <ul>
	 * <li>Remove the events on the editor</li>
	 * </ul>
	 * <br/>Modified in 4.3
	 * <ul>
	 * <li>If the editor do not exist, add it is the default editor</li>
	 * <li>Save the value in the current editor before switching</li>
	 * </ul>
	 */
	switchToEditor: function(editorName) {
		if (this._current === editorName) { return; }
		var value = this._values.get(editorName);
		if (!value) { 
			//since 4.3 - If the editor do not exist, set it as the default editor
			this._defaultEditor = editorName;
			return; 
		}
		
		//Remove the plugins for the current editor if any
		if (!Object.isEmpty(this._current) && this._ckEditorCreated) {
			var plugins = this._values.get(this._current).plugins;
			plugins.each(function(plugin){
				var plugin = this._getEditor().getCommand(plugin.key);
				if(plugin) {
					plugin.disable();
				}
			}, this);
		}
		//since 5.0 - Remove the events on the editor if any
		for (var i = 0; i < this._events.size(); i++) {
			if(this._events[i].name) {
				this._getEditor().removeListener(this._events[i].name, this._events[i].handler)
			}
			else {
				this._events[i].stop();
			}
		}
		this._events = $A();
		
		//since 4.3 - Update the value of the current editor before switching
		this.getData(this._current);
		
		//Switch to the new editor
		this._current = editorName;
		if(value.view) {
			if (!this._displayerParent.visible()) {
				this._displayerParent.show();
				this._editorParent.hide();
			}
			this._updateView(value.text);
		}
		else {
			if (!this._editorParent.visible()) {
				this._editorParent.show();
				this._displayerParent.hide()
			}
			this._updateEditor(value.text);	
		}
	},
	/**
	 * Update the text in the view mode part
	 * @param {Object} newValue The text to display
	 * @param {Function} callBack Function to call after the modification
	 * @since 4.0
	 * <br/>Modified in 5.0
	 * <ul>
	 * <li>Set teh events on the new editor</li>
	 * </ul>
	 */
	_updateView: function(newValue, callBack) {
		var viewer = this._displayerParent.down(1)
		viewer.innerHTML = newValue;
		
		//since 5.0 - Add the events on the editor
		var events = this._values.get(this._current).editorEvents;
		for( var i = 0; i < events.size(); i++) {
			this._events.push(viewer.on(events[i].name, events[i].handler));
		}
		
		if (callBack) {
			callBack();
		}
	},
	/**
	 * Update the text in the editor mode part
	 * @param {Object} newValue The text to display
	 * @param {Function} callBack Function to call after the modification
	 * @since 4.0
	 * <br/>Modified in 5.2
	 * <ul>
	 * <li>Check if editor exists before enabling/disabling plugins</li>
	 * </ul>
	 * <br/>Modified in 5.0
	 * <ul>
	 * <li>Create handler if ckEditor is not created</li>
	 * <li>Set the events on the new editor</li>
	 * </ul>
	 * <br/>Modified in 4.3
	 * <ul>
	 * <li>1049665 - Add the language to use in the ckEditor instead of the user language</li>
	 * </ul>
	 */
	_updateEditor: function(newValue, callBack) {
		if(this._ckEditorCreationRequested) {
			var plugins = this._values.get(this._current).plugins;
			plugins.each(function(plugin){
				//since 5.2 Check if editor exists before enabling/disabling plugins
				var editor = this._getEditor();
				if (editor !== null){
					var command = editor.getCommand(plugin.key);
					if (command) {
						if (plugin.value) {
							command.enable();
						}
						else {
							command.disable();
						}
					}					
				}
			}, this);
			//Since 5.0 created handler if ckEditor is not created
			if (this._ckEditorCreated){
				var editor = this._getEditor();
				editor.setData(newValue, callBack);
				var events = this._values.get(this._current).editorEvents;
				for( var i = 0; i < events.size(); i++) {
					editor.on(events[i].name, events[i].handler)
					this._events.push(events[i]);
				}
			}else{
				//Create observer
				var handler = document.on('EWS:SCM_ckEditorLoaded', function(event){
					var editor = this._getEditor();
					editor.setData(newValue, callBack);
					var events = this._values.get(this._current).editorEvents;
					for( var i = 0; i < events.size(); i++) {
						editor.on(events[i].name, events[i].handler)
						this._events.push(events[i]);
					}
					handler.stop();
					delete handler;
				}.bindAsEventListener(this));
			}
		} 
		else {
			this._ckEditorCreationRequested = true;
			var language = this._getCkEditorLanguage(global.language);
			var editor = CKEDITOR.appendTo(this._editorParent, { 	
				toolbar 			: [['Bold','Italic','Underline','Strike','Format'], ['NumberedList','BulletedList','-','Undo','Redo','-','SelectAll','RemoveFormat'], ['InsertTemplate','InsertSignature', 'AddAttachment','Link','Unlink']/*,['Scayt']*/],
				resize_enabled		: false,
				removePlugins 		: 'elementspath',
				uiColor				: '#dcd2ce',
				toolbarCanCollapse	: true,
				//since 4.3 - 1049665 - Set the language of the ckEditor instance
				defaultLanguage 	: 'en',
				contentsLanguage	: language,
				language			: language/*,
				scayt_autoStartup	: true*/ 
			}, newValue);
			this._ckEditorName = editor.name;
			editor.on('instanceReady', function(){
				this._ckEditorCreated = true;
				document.fire('EWS:SCM_ckEditorLoaded');
				var plugins = this._values.get(this._current).plugins;
				plugins.each(function(plugin){
					var command = this._getEditor().getCommand(plugin.key);
					if (command) {
						if (plugin.value) {
							command.enable();
						}
						else {
							command.disable();
						}
					}
				}, this);
				
				var events = this._values.get(this._current).editorEvents;
				for( var i = 0; i < events.size(); i++) {
					editor.on(events[i].name, events[i].handler)
					this._events.push(events[i]);
				}
					
				if (callBack) {
					callback();
				}
			}.bindAsEventListener(this));
		}
	},
	
	/**
	 * Update the display of the current editor for IE
	 * @param {Function} callBack Optional call back function
	 * @since 4.3
	 */
	updateCurrentEditor: function(callBack) {
		if(!Prototype.Browser.IE && !Prototype.Browser.WebKit) return;
		
		var value = this._values.get(this._current);
		if(value) {
			if(value.view) {
				this._displayerParent.hide();
				setTimeout(this._displayElement.bind(this, this._displayerParent), 500);
			}
			else {
				this._editorParent.hide();
				setTimeout(this._displayElement.bind(this, this._editorParent), 500);
			}
		}
	},
	
	/**
	 * Private method used to delay the display of an element.
	 * @param {HTML Element} element The element to show
	 * @since 4.3
	 */
	_displayElement: function(element) {
		element.show();
	} ,
	
	/**
	 * Get the language from SAP that map the languages of ckEditor
	 * @param {String} languageInSap The laiso code form SAP
	 * @returns {String} The language to put in ckEditor
	 * @since 4.3
	 */
	_getCkEditorLanguage: function(languageInSap) {
		var exceptions = $H({'1P': 'pt', 'SH': 'sr-latn', 'ZF': 'zh', 'ZH': 'zh-cn', '3F': 'fr-ca'});
		
		var result = exceptions.get(languageInSap);
		if(Object.isEmpty(result)) {
			result = languageInSap.toLowerCase();
		}
		return result;
	}
});
Scm_HtmlDisplayer._UNIQUE_ID = 0;
/**
 * @class
 * Provide a way to use the ckeditor in all application in the same way 
 * @author nicolasl
 * @since 3.4
 */
var SCM_ckEditorsManager = Class.create(/** @lends SCM_ckEditor.prototype */{});

/**
 * Shortcut for the creation of a ckeditor instance
 * @param {String} editorName Name of the editor to create
 * @param {Boolean} view Indicate if the editor is for a view (if not, it is for edition)
 * @param {String} data Data to insert in the ckeditor instance
 * @returns {CKEDITOR} The ckEditor instance
 * @since 3.4
 * <br/>Modified in 3.6
 * <ul>
 * <li>Avoid to use eval method for optimization</li>
 * <li>Adapt to the new version of ckEditor</li>
 * </ul>
 */
SCM_ckEditorsManager.addEditor = function(editorName, view, data) {
	//If the editor is already there, remove it
	SCM_ckEditorsManager.removeEditors(editorName);
	
	//Create the editor
	CKEDITOR.replace(editorName,{ 	
		toolbar 			: (view)?[]:[['Bold','Italic','Underline','Strike','Format'], ['NumberedList','BulletedList','-','Undo','Redo','-','SelectAll','RemoveFormat'], ['InsertTemplate','InsertSignature', 'AddAttachment','Link','Unlink']/*,['Scayt']*/],
		resize_enabled		: false,
		removePlugins 		: 'elementspath',
		uiColor				: '#dcd2ce',
		toolbarCanCollapse	: !view/*,
		scayt_autoStartup	: true*/ 
	});
	//Get the instance
	//since 3.6 Don't use the eval method
	var editor = CKEDITOR["instances"][editorName];
	
	//Set the default text
	if(!Object.isEmpty(data)) editor.setData(data);
	
	//Set the editor as read-only
	if(view)
		editor.on('instanceReady', function(event) {
			//since 3.6 - Adapt to the new version of ckEditor
			var editor = CKEDITOR["instances"][editorName];
			if(!this._isClosedForEditors && !Object.isEmpty(event.editor)) 
				event.editor.container.setStyle('readonly', true);
		}, this);
		
	return editor;
};

/**
 * Remove all the ckeditor instances in the screen
 */
SCM_ckEditorsManager.removeAllEditors = function(){
	var possibleKeys = $A(['scm_ticketCreateScreenEditor', 'scm_ticketViewScreenEditor', 'scm_ticketDescrScreenEditor', 'scm_ticketSolScreenEditor', , 'scm_ticketEditScreenEditor']);
	var keys = (CKEDITOR && CKEDITOR.instances)?Object.keys(CKEDITOR.instances):$A();
	keys = keys.findAll(function(key){
		return !Object.isEmpty(possibleKeys.find(function(possibleKey){ return (possibleKey === key)}.bind(this)));
	}.bind(this));
	SCM_ckEditorsManager.removeEditors(keys);
	
	if(!CKEDITOR.document.$.styleSheets || CKEDITOR.document.$.styleSheets.length === 0) return;
	
	if(!Prototype.Browser.IE || keys.size() === 0) return;
	var regExp = new RegExp('^#cke_(' + keys.join('|')+ ')');
	$A(CKEDITOR.document.$.styleSheets).each(function(cssSheet){
		if(cssSheet.href === ""
			&& (	!Object.isEmpty(cssSheet.cssText.match(/^\.cke_skin_kama(\s|\n)*{(\s|\n)*VISIBILITY(\s|\n)*:( |\n)*hidden(\s|\n)*}$/m))
				||	cssSheet.cssText.match(regExp))) {
			var styleNode = $$('style[uniqueID="' + cssSheet.owningElement.uniqueID + '"]')[0];
			styleNode.parentNode.removeChild(styleNode);
		}
	}, this);
};

/**
 * Remove all the instances of ckeditor
 * @param {Array/String} editorNames Remove the editor from the screen and delete it
 * @since 3.4
 */
SCM_ckEditorsManager.removeEditors = function(editorNames) {
	//Make an array if the parameter is a string
	if(Object.isString(editorNames)) editorNames = $A([editorNames]);
	
	if(CKEDITOR && CKEDITOR.instances) {
		editorNames.each(function(editorName) {
			var editor = CKEDITOR["instances"][editorName];
			if(!Object.isEmpty(editor)) {
				editor.fire = function(name, params) {return params};
				CKEDITOR.remove(editor);
			}
		}, this);
	}
};

/**
 * Get an instance of ckeditor
 * @param {String} editorName The name of the editor to get
 * @returns {CKEDITOR} The CKEditor instance
 * @since 3.4
 */
SCM_ckEditorsManager.getEditorInstance = function(editorName) {
	var editor = null;
	
	if(CKEDITOR && CKEDITOR.instances) 
		editor = CKEDITOR["instances"][editorName];
	
	return (editor)?editor:null;
};

/**
 * Get the content of an editor if it exist and '' otherwise
 * @param {String} editorName The name of the editor to get
 * @returns {String} The content of the CKEditor
 * @since 3.4
 */
SCM_ckEditorsManager.getEditorData = function(editorName) {
	var editorContent = '';
	
	if(CKEDITOR && CKEDITOR.instances) {
		var editor = CKEDITOR["instances"][editorName];
		if(editor) editorContent = editor.getData();
	}
	return editorContent;
};

/**
 * Set the content of an editor if it exist
 * @param {Object} editorName The name of the editor to get
 * @param {String} data The content to insert in the CKEditor
 * @param {Function} callBack Call back function
 * @since 3.4
 */
SCM_ckEditorsManager.setEditorData = function(editorName, data, callBack) {
	if(CKEDITOR && CKEDITOR.instances) {
		var editor = CKEDITOR["instances"][editorName];
		if(editor) {
			if(callBack) editorContent = editor.setData(data, callBack);
			else editorContent = editor.setData(data);
		}
	}
};


/**
 * @class
 * Display the skills depending on its type
 * @author nicolasl
 * @since 3.6
 * <br/>Modified in 5.1
 * <ul>
 * <li>Allow to display a large version of the fields</li>
 * </ul>
 */
SCM_SkillDisplayer = Class.create(/** @lends SCM_SkillDisplayer.prototype */{
	/**
	 * Identifier of the field
	 * @type String
	 * @since 3.6
	 */
	_identifier: '',
	/**
	 * Indicate if the instance is readOnly
	 * @type Boolean
	 * @since 3.6
	 */
	_isReadOnly: false,
	/**
	 * Initialize the global parameters
	 * @param {String} identifier Unique identifier for the field
	 * @since 3.6
	 */
	initialize: function(identifier){
		this._identifier = identifier;
	},
	/**
	 * Build the field to display the selection of the value and add it in the DOM
	 * @param {Element} parentDiv The div that should contains the field displayer
	 * @param {Object} value The default value or the list of values
	 * @param {Boolean} width Indicates if the entry should be wide by default
	 * @since 3.6
	 * <br/>Modified in 5.1
	 * <ul>
	 * <li>Addition of a flag to indicate if the field should be large</li>
	 * </ul> 
	 */
	buildField: function(parentDiv, value, width){alert('Abstract method')},
	/**
	 * Get the value in the field
	 * @returns {String} The value in the field as a string
	 * @since 3.6
	 */
	getValue: function(){alert('Abstract method')},
	/**
	 * Method to check if the field is read only
	 * @returns {Boolean} Is the instance in read only mode
	 * @since 3.6
	 */
	isReadOnly: function() {
		return this._isReadOnly;
	},
	/**
	 * Delete the content of the field 
	 * @since 3.6
	 */
	destroy: function(){
		delete this._identifier;
		delete this._readOnly;
	}
});
/**
 * @class
 * Display the skills when there is a list of values
 * @author nicolasl
 * @augments SCM_SkillDisplayer
 * @since 3.6
 * <br/>Modified in 4.3
 * <ul>
 * <li>Labels are automaitcally encoded</li>
 * </ul>
 * <br/>Modified in 4.0
 * <ul>
 * <li>Add in the list an empty value that is selected by default if there is no default value</li>
 * </ul>
 */
SCM_SkillDisplayerForArray = Class.create(SCM_SkillDisplayer, /** @lends SCM_SkillDisplayerForArray.prototype */{	
	/**
	 * Autocompleter displayed in the div
	 * @type JSONAutocompleterSCM
	 * @since 3.6
	 * <br/>Modified in 4.0
	 * <ul>
	 * <li>Add always an entry for no value and if there is no default value, put this one</li>
	 * </ul>
	 */
	_autocompleter: null,
	
	/**
	 * Modified in 4.3
	 * <ul>
	 * <li>Labels are automaitcally encoded</li>
	 * </ul>
	 */
	buildField: function(parentDiv, values, width){
		var sortedValues = values.sortBy(function(value) {return value.text;});
		
		//since 4.0 - Add the entry for no value and put it as default if there is no other ones
		var defValue = values.find(function(value) {return (value.def === 'X');});
		sortedValues.unshift({
			def: (Object.isEmpty(defValue))? 'X': '',
			data: HrwEngine.NO_VALUE,
			//since 4.3 - Labels are automatically encoded
			text: global.getLabel('SCM_no_subject').unescapeHTML().sub('<', '-').sub('>', '-')
		})
		this._autocompleter = new JSONAutocompleterSCM(parentDiv, {}, {autocompleter: {object: sortedValues}});
		//since 5.1 - If the input field shoudl be larger, do it by default
		if (this._autocompleter) {
			var className = (width)? 'SCM_ticketScreen_attributeAutoCompWidth': 'SCM_ticketScreen_attributeAutoComp';
			this._autocompleter.getInputDiv().addClassName(className);
		}
	},
	getValue: function(){
		var value;
		if(this._autocompleter) {
			value = this._autocompleter.getValue();
		}
		if(value && value.idAdded)
			return value.idAdded;
		else 
			return null;
	},
	destroy: function($super){
		if(this._autocompleter)
			this._autocompleter.stop();
		delete this._autocompleter;
		$super();
	}
});
/**
 * @class
 * Display the skills that should contains any kind of string
 * @author nicolasl
 * @augments SCM_SkillDisplayer
 * @version 4.4
 * <br/>Modified in 4.4
 * <ul>
 * <li>Decode the text to display in the input field</li>
 * </ul>
 */
SCM_SkillDisplayerForChars = Class.create(SCM_SkillDisplayer, /** @lends SCM_SkillDisplayerForChars.prototype */{	
	/**
	 * Input field to indicate the value to fill in
	 * @type Element
	 * @since 3.6
	 */
	_inputField: null,
	/**
	 * Mask to apply on the div if defined
	 * @type FieldMask
	 * @since 3.6
	 */
	_mask: null,
	/**
	 * <br/>Modified in 4.4
	 * <ul>
	 * <li>Decode the text to display in the input field</li>
	 * </ul> 
	 */
	buildField: function(parentDiv, value, width){
		this._inputField = new Element('input', {
			'id'	: this._identifier,
			'type' 	: 'text',
			//since 4.4 - Decode the text to display in the input field
			'value'	: value.unescapeHTML(),
			'class'	: 'SCM_ticketScreen_attributeAutoComp application_autocompleter_box',
			'maxlength': '125'
		});
		parentDiv.insert(this._inputField);
	},
	getValue: function(){
		//If there is a mask and a valid value
		if(this._mask && this._mask.isValid()) 
			return this._mask.getValue();
		//If there is no mask, get the value in the input field
		else if(!this._mask && this._inputField)
			return this._inputField.value;
		else 
			return null;
	},
	destroy: function($super){
		if(this._mask)
			this._mask.destroy();

		delete this._mask;	
		delete this._inputField;
		$super();
	}
});
/**
 * @class
 * Display the skills to display skills
 * @author nicolasl
 * @augments SCM_SkillDisplayerForChars
 * @since 3.6
 */
SCM_SkillDisplayerForString = Class.create(SCM_SkillDisplayerForChars, /** @lends SCM_SkillDisplayerForString.prototype */{});
/**
 * @class
 * Display the skills to display integers
 * @author nicolasl
 * @augments SCM_SkillDisplayerForChars
 * @since 3.6
 */
SCM_SkillDisplayerForIntegers = Class.create(SCM_SkillDisplayerForChars, /** @lends SCM_SkillDisplayerForIntegers.prototype */{		
	buildField: function($super, parentDiv, value, width){
		$super(parentDiv, value, width);
		this._buildMask(parentDiv, value);
	},
	
	_buildMask: function(parentDiv, value){
		var options = {
			activate: true
		};
		if(!Object.isEmpty(value) && value !== '') options.defaultValue = value;
		this._mask = new DigitOnlyFieldMask(this._inputField, options);
		this._inputField.maxLength = 9;
	},
	
	getValue: function($super){
		var value = $super();
		if(value === null) return null;
		// put the decimal separator
		value = value.gsub(global.thousandsSeparator, '').sub(global.commaSeparator, ',');
		// replace the decimal separator for HRW and convert to string
		return (this._stripZeros(value));
	},
	
	/**
	 * Remove leading and trailing zeros
	 * @param {String} value The number to format
	 * @returns {String} The number without the leading 0s	 
	 * @since 4.0
	 */
	_stripZeros:function(value){
		var values 		= value.split(',');
		var sign 		= '';
		var wholeNbr 	= values[0].split('');
		
		//Get the sign
		if(wholeNbr[0] === '-'){
			sign = '-';
			wholeNbr.shift();
		}
		
		//Remove the leading 0s
        while (wholeNbr[0] === '0' && wholeNbr.size() !== 1) {
            wholeNbr.shift();
        }
		
		//Remove the 0s after the comma
        var decimals = $A();
		if (values.size() > 1) {
			decimals = values[1].split('')
			while (decimals[decimals.length - 1] === '0') {
				decimals.pop();
			}
		}
		
		//Return the result with or without decimals
		if(decimals.length > 0)	{
			return sign + wholeNbr.join('') + ',' + decimals.join('');
		}
		else {
			return sign + wholeNbr.join('');
		}
		
	}
});
/**
 * @class
 * Display the skills to display decimals
 * @author JeromeS
 * @augments SCM_SkillDisplayerForChars
 * @since 4.0
 */
SCM_SkillDisplayerForDecimal = Class.create(SCM_SkillDisplayerForIntegers, /** @lends SCM_SkillDisplayerForDecimal.prototype */{		
	_buildMask: function(parentDiv, value){
		var options = {
			activate: true,
			maxDecimals: 300, 
			maxIntegers: -1, 
			alwaysShowDecimals: false
		};
		if(!Object.isEmpty(value) && value !== '') options.defaultValue = value;
		this._mask = new CurrencyFieldMask(this._inputField, global.numberFormat, options);
	}
});
/**
 * @class
 * Display the skills to display signed Integers
 * @author JeromeS
 * @augments SCM_SkillDisplayerForChars
 * @since 4.0
 */
SCM_SkillDisplayerForSignedInteger = Class.create(SCM_SkillDisplayerForIntegers, /** @lends SCM_SkillDisplayerForDecimal.prototype */{		
	_buildMask: function(parentDiv, value){
		var options = {
			activate: true,
			maxDecimals: 0, 
			maxIntegers: 9, 
			alwaysShowDecimals: false
		};
		if(!Object.isEmpty(value) && value !== '') options.defaultValue = value;
		this._mask = new CurrencyFieldMask(this._inputField, global.numberFormat, options);
	}
});
/**
 * @class
 * Display the skills to display dates
 * @author nicolasl
 * @augments SCM_SkillDisplayer
 * @since 3.6
 */
SCM_SkillDisplayerForDates = Class.create(SCM_SkillDisplayer, /** @lends SCM_SkillDisplayerForDates.prototype */{	
	/**
	 * The date picker to fill in
	 * @type DatePicker
	 * @since 3.6
	 */
	_datePicker: null,
	buildField: function(parentDiv, value, width){	
		var options = {
			emptyDateValid: true
		};	 
		parentDiv.insert('<div id="'+this._identifier+'"></div>');
		this._datePicker = new DatePicker(this._identifier, options);
		
		//Set the default date (don't do it via options otherwise, it is no more possible to set the value to empty)
		var defaultDate;
		if(value && Object.isString(value) && value !== '')
			 defaultDate = Date.parseExact(value, 'yyyy-MM-dd');
		if(defaultDate)
			this._datePicker.setDate(defaultDate);
	},
	getValue: function(){
		if(this._datePicker && this._datePicker.checkDateFormat()){
			return this._datePicker.getActualDate();
		} else
			return null;
	},
	destroy: function($super){
		if (this._datePicker) {
			this._datePicker.destroy();
		}
		delete this._datePicker;
		$super();
	}
});

/**
 * @class
 * Display the skills to display in read-only mode
 * @author nicolasl
 * @augments SCM_SkillDisplayer
 * @since 3.6
 */
SCM_SkillDisplayerForReadOnly = Class.create(SCM_SkillDisplayer, /** @lends SCM_SkillDisplayerForReadOnly.prototype */{	
	/**
	 * Element with the content that display the value
	 * @type Element
	 * @since 3.6
	 */
	_element: null,
	initialize: function($super, identifier){
		$super(identifier);
		this._isReadOnly = true;
	},
	buildField: function(parentDiv, value, width){
		this._element = parentDiv.insert('<span id="'+this._identifier+'">'+(value && value.length > 0)? value: '/'+'</span>');
	},
	getValue: function(){
		if(this._element)
			return this._element.innerHTML;	
		else
			return null;
	},
	destroy: function($super){
		delete this._element;
		$super  ();
	}
});

SCM_SkillDisplayerForReadOnlyNumber = Class.create(SCM_SkillDisplayerForReadOnly, /** @lends SCM_SkillDisplayerForReadOnlyNumber.prototype */{
	buildField: function($super, parentDiv, value, width){
		var formattedValue 	= '';
		var tempValue 		= value+'';
		
		//Check for the sign
		var sign = '';
		if(tempValue.charAt(0) === '-') {
			sign = '-';
			tempValue = tempValue.substring(1);
		}
		
		var parts = tempValue.split(',');
		
		//Treat the non decimals part
		tempValue = parts[0]; 
		while(tempValue.charAt(0) === '0') {
			tempValue = tempValue.substring(1);
		}
		var partLength = tempValue.length;
		var position = partLength - 3;
		while(position > 0) {
			formattedValue	= global.thousandsSeparator + tempValue.substring(position, partLength) + formattedValue;
			partLength 		= position;
			position 		= partLength - 3;
		}
		formattedValue = tempValue.substring(0, partLength) + formattedValue;
		
		//Treat the decimal part if any
		if(parts.size() > 1) {
			tempValue = parts[1]; 
			partLength = tempValue.length;
			
			while(partLength > 0 && tempValue.charAt(partLength - 1) === '0') {
				tempValue 	= tempValue.substring(0, partLength - 1);
				partLength 	= tempValue.length;
			}
			
			if(partLength > 0) {
				formattedValue += global.commaSeparator + tempValue;
			}
		}
		
		formattedValue = sign + formattedValue;
		$super(parentDiv, formattedValue, width);
	},
	
	getValue: function($super){
		var value = $super();
		if (value === null)
			return null;
		value = value.gsub(global.thousandsSeparator,'').sub(global.commaSeparator,',');
		return value;
	}
});
/**
 * @class
 * Display the skills to display dates in read-only mode
 * @author nicolasl
 * @augments SCM_SkillDisplayerForReadOnly
 * @since 3.6
 */
SCM_SkillDisplayerForReadOnlyDate = Class.create(SCM_SkillDisplayerForReadOnly, /** @lends SCM_SkillDisplayerForReadOnlyDate.prototype */{
	/**
	 * Date with the HRW format
	 * @type string
	 * @since 3.6
	 */
	_dateHrw: null,
	
	buildField: function($super, parentDiv, value, width){
		this._dateHrw = value;
		var formattedValue;
		if(value && Object.isString(value) && value !== '') 
			formattedValue = sapToDisplayFormat(value);
		else 
			formattedValue = null;
		$super(parentDiv, formattedValue, width);
	},
	getValue: function($super){
		if(this._dateHrw)
			return this._dateHrw;	
		else
			return null;
	},
	destroy: function($super){
		delete this._dateHrw;
		$super();
	}
});
/**
 * @class
 * Display the skills to display arrays in read-only mode (display only the selected value)
 * @author nicolasl
 * @augments SCM_SkillDisplayerForReadOnly
 * @since 3.6
 */
SCM_SkillDisplayerForReadOnlyArray = Class.create(SCM_SkillDisplayerForReadOnly, /** @lends SCM_SkillDisplayerForReadOnlyArray.prototype */{
	/**
	 * Id of the skill currently on the screen
	 * @type Integer
	 * @since 3.6
	 */
	_skillId: HrwEngine.NO_VALUE,
	buildField: function($super, parentDiv, value, width){
		this._skillId = value.data;
		$super(parentDiv, value.text, width);
	},
	getValue: function(){
		if(this._skillId !== HrwEngine.NO_VALUE)
			return this._skillId;	
		else
			return null;
	},
	destroy: function($super){
		delete this._skillId;
		$super();
	}
});

/**
 * Number used to build unique Ids for the different fields
 */
SCM_SkillDisplayer.uniqueId = 0;

/**
 * Static method that create an instance of one of the classes
 * @param {Integer} type Indicate the type of field to create
 * <br/>Modified in 4.0
 * <ul>
 * <li>Added 2 new data types (Decimal and Signed Integer</li>
 * </ul>
 */
SCM_SkillDisplayer.factory = function(type, readOnly) {
	SCM_SkillDisplayer.uniqueId ++;
	var newId = 'SCM_SkillField_' + SCM_SkillDisplayer.uniqueId;
	
	switch(type) {
		case HrwRequest.STRING:		
			if(readOnly)
				return new SCM_SkillDisplayerForReadOnly(newId);
			else
				return new SCM_SkillDisplayerForString(newId);
		case HrwRequest.ARRAY:		
			if(readOnly)
				return new SCM_SkillDisplayerForReadOnlyArray(newId);
			else
				return new SCM_SkillDisplayerForArray(newId);
		case HrwRequest.INTEGER:	
			if(readOnly)
				return new SCM_SkillDisplayerForReadOnlyNumber(newId);
			else
				return new SCM_SkillDisplayerForIntegers(newId);
		case HrwRequest.DATE:		
			if(readOnly)
				return new SCM_SkillDisplayerForReadOnlyDate(newId);
			else
				return new SCM_SkillDisplayerForDates(newId);
		//since 4.0 New data types
		// Decimal
		case HrwRequest.NUMBER:		
			if(readOnly)
				return new SCM_SkillDisplayerForReadOnlyNumber(newId);
			else
				return new SCM_SkillDisplayerForDecimal(newId);
		// Signed Integer
		case HrwRequest.S_INTEGER:		
			if(readOnly)
				return new SCM_SkillDisplayerForReadOnlyNumber(newId);
			else
				return new SCM_SkillDisplayerForSignedInteger(newId);
	}
	return null;
};

/**
 * @class
 * Convert a number from a base to another
 * @author nicolasl
 * @since 4.0
 */
SCM_BaseConverter = Class.create(/** @lends SCM_BaseConverter.prototype */{
	/**
	 * Base of the incoming value
	 * @type String
	 * @since 4.0
	 */
	_baseFrom: null,
	/**
	 * Base of the outgoing value
	 * @type String
	 * @since 4.0
	 */
	_baseTo: null,
	
	/**
	 * Base of the incoming value
	 * @param {Integer} baseFrom Base of the incoming value
	 * @param {Integer} baseTo Base of the outgoing value
	 * @since 4.0
	 */
	initialize: function(baseFrom, baseTo) {
		this._baseFrom 	= parseInt(baseFrom);
		this._baseTo	= parseInt(baseTo);
	},
	
	/**
	 * Convert the given value. from the given base to the target one
	 * @param {Integer/String} toConvert The number to convert
	 * @returns {String} The converted value
	 * @since 4.0
	 */
	convert: function(toConvert) {
		var baseValues 	= $A(['0','1','2','3','4','5','6','7','8','9','A','B','C','D','E','F']);
		var expTable;
		var expCurrent;
		var result;
		var rest;
		var mult;
		
		var initNumber = parseInt(toConvert);
		var initString = toConvert + '';
		
		//If the source and target base are the same, the value stay the same
		if(this._baseFrom === this._baseTo) return initString;
		
		//Convert from the target base to base 10
		if(this._baseFrom !== 10) {
			result 		= 0;
			expCurrent 	= 1;
			
			for(var i = 0; i < initString.length; i++) {
				result +=  this._baseFrom.indexOf(toConvert.charAt(initString.length - i -1)) * expCurrent;
				expCurrent = expCurrent * this._baseFrom;
			}
			initNumber = result;
			initString = result + '';
			result += '';
		}
		//Convert from the base 10 to the target base
		if (this._baseTo !== 10) {
			expTable = $A();
			expCurrent = 1;
			result = '';
			
			while (expCurrent <= initNumber) {
				expTable.push(expCurrent);
				expCurrent = expCurrent * this._baseTo;
			}
			
			rest = initNumber;
			for (var i = 0; i < expTable.length; i++) {
				expCurrent 	= expTable[(expTable.length - i - 1)];
				mult 		= Math.floor(rest / expCurrent);
				rest 		= rest - (mult * expCurrent);
				result 		+= baseValues[mult];
			}
		}
		return result;
	}
});

/**
 * @class
 * Manage the content of an email
 * @author nicolasl
 * @since 4.3
 */
SCM_EmailManager = Class.create(/** @lends SCM_EmailManager.prototype */{
	/**
	 * Body of the email
	 * @type HTML Element
	 * @since 4.3
	 */
	_body: null,
	/**
	 * Signature of the email
	 * @type HTML Element
	 * @since 4.3
	 */
	_signature: null,
	/**
	 * History of the email
	 * @type HTML Element
	 * @since 4.3
	 */
	_old: null,
	
	/**
	 * Header parameter of the email
	 * @type Object
	 * @since 4.3
	 */
	_header: null,
	
	/**
	 * Build the main objects of the email
	 * @param {String} emailText (optional) The content of an email
	 * @since 4.3
	 */
	initialize: function(emailText) {
		if (!Object.isEmpty(emailText)) {
			this.parseEmail(emailText);
		}
	},
	/**
	 * Check if the content of the email is empty
	 * @returns {Boolean} Is the content of the email empty
	 * @since 4.3
	 */
	checkIsEmpty: function() {
		var emailText 	= this.getEmailText();
		return Object.isEmpty(emailText.stripTags().gsub(/&[^;]*;/, '').match(/\S/m));
	},
	
	/**
	 * Set the content of the email from an email text
	 * @param {String} emailText The content of an email
	 * @since 4.3
	 * <br/>Modified in 5.1
	 * <ul>
	 * <li>Get the body via the method to avoid dump if the element is not created</li>
	 * </ul>
	 */
	parseEmail: function(emailText) {
		var email = new Element('div');
		email.innerHTML = emailText;
		var elements = email.childElements();
		
		var bodyBefore 	= '';
		var bodyAfter 	= '';
		var before		= true;
		
		for (var i = 0; i < elements.length; i++) {
			var element = elements[i];
			if(element.identify() === "HRWEMAILBODY") {
				this.setBody(element.innerHTML);
				before		= false
			} else if(element.identify() === "HRWEMAILSIGNATURE") {
				this.setSignature(element.innerHTML);
			} else if(element.identify() === "HRWEMAILOLD") {
				this.setOld(element.innerHTML);
			} else {
				if(before) {
					bodyBefore += '<' + element.tagName + '>' + element.innerHTML + '</' + element.tagName + '>';
				}
				else {
					bodyAfter += '<' + element.tagName + '>' + element.innerHTML + '</' + element.tagName + '>';
				}
			}
		}
		
		//If there are some elements out of all tags, put them in the body
		if (bodyBefore !== '' || bodyAfter !== '') {
			//since 5.1 - Get the body via the method to avoid dump if the element is not created
			var bodyContent = bodyBefore + this.getBody() + bodyAfter;
			this.setBody(bodyContent);
		}
	},
	
	/**
	 * Get the complete text of an email
	 * @returns {String} The content of the email
	 * @since 4.3
	 */
	getEmailText: function() {
		return 	'<div id="HRWEMAILBODY">' + this.getBody() + '</div>'
			+	'<div id="HRWEMAILSIGNATURE">' + this.getSignature() + '</div>'
			+	'<div id="HRWEMAILOLD">' + this.getOld() + '</div>';
	},
	
	/**
	 * Get a textual description of the email without the email tags
	 * @returns {String} The email description in HTML
	 * @since 4.3
	 */
	getEmailDescription: function() {
		var lineTemplate = new Template(
				'<div>'
			+		'<span style="font-weight: bold">#{label}: </span>'
			+		'<span>#{value}</span>'
			+	'</div>');
			
		return 	'<div style="width;95%; border-top: 1px dotted gray;"/>'
			+	lineTemplate.evaluate({
					label: global.getLabel('From'),
					value: this._header.from.join('; ')
				})
			+	lineTemplate.evaluate({
					label: global.getLabel('To'),
					value: this._header.to.join('; ')
				})
			+	((this._header.cc.size() > 0)? lineTemplate.evaluate({
					label: global.getLabel('Cc'),
					value: this._header.cc.join('; ')
				}): '')
			+	lineTemplate.evaluate({
					label: global.getLabel('Subject'),
					value: this._header.subject
				})
			+	((this._header.attachments.size() > 0)? lineTemplate.evaluate({
					label: global.getLabel('Attachments'),
					value: this._header.attachments.join('; ')
				}): '')
			+	'<div style="width;95%; border-top: 1px dotted gray;"/>'
			+	this.getBody()
			+	this.getSignature()
			+ 	this.getOld()
			+	'<hr/>';
			
	},
	/**
	 * Get the body of the email
	 * @returns {String} The content of the email
	 * @since 4.3
	 */
	getBody: function() {
		if(this._body === null) {
			this._body = new Element('div');
		}
		return this._body.innerHTML;
	},
	/**
	 * Get the signature of the email
	 * @returns {String} The content of the email
	 * @since 4.3
	 */
	getSignature: function() {
		if(this._signature === null) {
			this._signature = new Element('div');
		}
		return this._signature.innerHTML;
	},
	/**
	 * Get the history of the email
	 * @returns {String} The content of the email
	 * @since 4.3
	 */
	getOld: function() {
		if(this._old === null) {
			this._old = new Element('div');
		}
		return this._old.innerHTML;
	},
	/**
	 * Get the "from" addresses of the email 
	 * @returns {Array} The email from
	 * @since 4.3
	 */
	getFrom: function() {
		return this._header.from;
	},
	/**
	 * Get the "to" addresses of the email 
	 * @returns {Array} The email to
	 * @since 4.3
	 */
	getTo: function() {
		return this._header.to;
	},
	/**
	 * Get the "cc" addresses of the email 
	 * @returns {Array} The email cc
	 * @since 4.3
	 */
	getCc: function() {
		return this._header.cc;
	},
	/**
	 * Get the "subject" of the email 
	 * @returns {String} The email subject
	 * @since 4.3
	 */
	getSubject: function() {
		return this._header.subject;
	},
	/**
	 * Get the attachments of the email 
	 * @returns {Array} The email attachments
	 * @since 4.3
	 */
	getAttachments: function() {
		return this._header.attachments;
	},
	/**
	 * Change the value of the email body
	 * @param {String} body The email body
	 * @since 4.3
	 */
	setBody: function(body) {
		if(this._body === null) {
			this._body = new Element('div');
		}
		this._body.innerHTML = this._formatInnerFormat(body);
	},
	/**
	 * Change the value of the email signature
	 * @param {String} signature The email signature
	 * @since 4.3
	 */
	setSignature: function(signature) {
		if(this._signature === null) {
			this._signature = new Element('div');
		}
		this._signature.innerHTML = this._formatInnerFormat(signature);
	},
	/**
	 * Change the value of the email history
	 * @param {String} old The email history
	 * @since 4.3
	 */
	setOld: function(old) {
		if(this._old === null) {
			this._old = new Element('div');
		}
		this._old.innerHTML = this._formatInnerFormat(old);
	},
	
	/**
	 * Format the text before inserting it in the document
	 * @param {String} htmlIn The initial html to format
	 * @returns {String} The formatted HTML
	 * @since 4.3 
	 */
	_formatInnerFormat: function(htmlIn) {
		var htmlOut = htmlIn;
		
		//If it is an HTML, take the body only
		var content = htmlOut.match(/<body[\w\W]*<\/body>/m);
		if(content) {
			htmlOut = content[0].replace(/^<body[^>]*>([\w\W]*)<\/body>$/m, "$1");
		}
		//If there are the email tags, remove them
		if(SCM_EmailManager.checkIsEmail(htmlOut)) {
			htmlOut = htmlOut.replace(/<div id\="HRWEMAILOLD">([\w\W]*)<\/div>/m, "<div>$1</div>");
			htmlOut = htmlOut.replace(/<div id\="HRWEMAILSIGNATURE">([\w\W]*)<\/div>/m, "<div>$1</div>");
			htmlOut = htmlOut.replace(/<div id\="HRWEMAILBODY">([\w\W]*)<\/div>/m, "<div>$1</div>");
		}
		return htmlOut;
	},
	/**
	 * Set the header of the email (from, to, ...)
	 * @param {Array} from Email "from" adresses
	 * @param {Array} to Email "to" adresses
	 * @param {Array} cc Email "cc" adresses
	 * @param {String} subject Email subject
	 * @param {Array} attachments List of attachment names
	 * @since 4.3
	 */
	setHeader: function(from, to, cc, subject, attachments) {
		this._header	= {
			from		: (from)? from: $A(),
		  	to			: (to)? to: $A(),
		  	cc			: (cc)? cc: $A(),
		  	subject		: (subject)? subject: '',
		  	attachments	: (attachments)? attachments: $A()
		};
	},
	
	/**
	 * Add an element in the body
	 * @param {String} body The element to add in the body
	 * @since 4.3
	 */
	addToBody: function(body) {
		this._body.insert(body);
	}
});
/**
 * Check if a given string is like an email
 * @param {String} emailText The text to check.
 * @returns {Boolean} Is the given text an email?
 * @since 4.3
 */
SCM_EmailManager.checkIsEmail = function(emailText) {
	return !Object.isEmpty(emailText.match(/<div id="HRWEMAILBODY">[\n\w\W]*<div id="HRWEMAILSIGNATURE">[\n\w\W]*<div id="HRWEMAILOLD">/m));
};

/**
 * Function that display a label and add anchors in it.
 * @param {String} label The label to use
 * @param {Array} anchors The anchors to add in the label
 * @returns {Object} Indicate the text and the title to display
 * @since 4.4
 */
SCM_getLabel = function(label, anchors, sizeManager, parameter, maxWidth, useOnePoint) {
	//Transform the text from "abc&1def&2" -> "abc&amp;1def&amp;2" to find the label
	//and then the result of the label from "abc &amp;1 def &amp;2" to "abc &1 def &2"
	var text 	= global.getLabel(label.escapeHTML()).unescapeHTML();
	var title	= text;
	//Add the anchors in the label
	if (Object.isArray(anchors)) {
		var numAnchors = anchors.size();
		for (var i = numAnchors; i > 0; i--) {
			text = text.gsub('&' + i, anchors[i - 1]);
		}
	}
	//If the label should be truncated, do it
	if(!Object.isEmpty(sizeManager) && this._maxWidth > 0) {
		sizeManager.setParameters(parameter, text);
		title = sizeManager.truncate(maxWidth, useOnePoint);
	}
	
	//To be sure there is no HTML in the tag content
	text = text.escapeHTML();
	
	return {
		text: text,
		title: title
	};
};
/**
 * Function that build the HTML element to insert a picture
 * @param {String} cssClass Name of the class
 * @param {String} title Title to associate to the picture
 * @param {String} leftRight Indicate if the icon should be on the right, on the left or without indication
 * @returns {Object} Return the element or the text to display the picture
 * @since 5.0
 */
SCM_getPicture = function(cssClass, title, leftRight) {
	var computedCssClass = cssClass + ' SCM_inputLink';
	if(leftRight === 'left') {
		computedCssClass += ' SCM_leftInputLink';
	} 
	else if(leftRight === 'right') {
		computedCssClass += ' SCM_rightInputLink';
	}
	return {
		element: new Element('input', {
			'class': computedCssClass,
			'title': title,
			'type': 'button'
		}),
		text: '<input class="' + computedCssClass +'" type="button" title="' + title + '"/>'
	};
}