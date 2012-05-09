/*
* @fileoverview Widgets.js
* @desc This files contains the class for creating a portal with widgets (like iGoogle)
*/

//Defining Widgets namespace
if (typeof Widgets == 'undefined')
    Widgets = {}
Builder.dump();
/*
* @class Widgets.widget
* @desc This class creates the widgets to be inserted on the portal
*/
Widgets.Widget = Class.create();
Widgets.Widget.lastId = 0;
Object.extend(Widgets.Widget.prototype, {
    /*
    * @name portal
    * @desc This variable will point to the portal object that contains the widget
    * @type Widgets.Portal
    */
    portal: null,
    /*
    * @name onCloseWidgetAction
    * @desc This variable will point to a custom action for closing the widget
    * @type Function
    */
    onCloseWidgetAction: null,
    /*
    * @name onHideWidgetAction
    * @desc This variable will point to a custom action for minimizing the widget
    * @type Function
    */
    onHideWidgetAction: null,
    /*
    * @name onCallWidgetOptions
    * @desc This variable will point to a custom action for clicking on the widget options
    * @type Functionm
    */
    onCallWidgetOptions: null,
    /*
    * @name _menuItems
    * @desc  Stores the information about the items of the context menu to be created
    * @type Object Array
    */
    _menuItems: null,
    /*
    * @name _panelNum
    * @desc Stores the index of the last options panel added
    * @type Integer
    */
    _panelNum: 0,
    /*
    * @method initialize
    * @desc This method creates the widget structure and the functionality
    * @param widgetId {string} Unique ID for the widget
    * @param options {Object} Widget options
    */
    defaultSettingsCallback: null,
    initialize: function(widgetId, options) {

        //rewriting Draggable.initDrag, the reason is to add the acronym tag
        Draggable.prototype.initDrag = function(event) {
            if (!Object.isUndefined(Draggable._dragging[this.element]) &&
                Draggable._dragging[this.element]) return;
            if (Event.isLeftClick(event)) {
                // abort on form elements, fixes a Firefox issue
                var src = Event.element(event);
                if ((tag_name = src.tagName.toUpperCase()) && (
                    tag_name == 'INPUT' ||
                    tag_name == 'SELECT' ||
                    tag_name == 'OPTION' ||
                    tag_name == 'ACRONYM' || //necessary for avoid the drag&drop when clicking on widgets buttons
                    tag_name == 'BUTTON' ||
                    tag_name == 'TEXTAREA')) return;

                var pointer = [Event.pointerX(event), Event.pointerY(event)];
                var pos = Position.cumulativeOffset(this.element);
                this.offset = [0, 1].map(function(i) {
                    return (pointer[i] - pos[i])
                });

                Draggables.activate(this);
                Event.stop(event);
            }
        }

        this.options = Object.extend({
            height: null,
            closeButton: true,
            minimizeButton: true,
            optionsButton: true,
            events: $H({}),
            semitrans: true,
            openMinimized: false
        }, options)
        /*
        * @name id
        * @desc Unique ID for the widget
        * @type string
        */
        this._id = ("widget_" + Widgets.Widget.lastId++);
        /*
        * @name minimized
        * @desc This variable control the minimized, maximized behaviour storing the current state
        * @type boolean
        */
        this.iaz_preserved_elements = [];
        this.iaz_preserved_zindexes = [];
        this.minimized = false;
        /*
        * @name widgetId
        * @desc Id for the widget inserted for the user (This will be the identifyer when throwing an event)
        * @type string
        */
        this.widgetId = widgetId;
        /*
        * @name expanded
        * @desc This variable controls if the widget is expanded or not
        * @tyupe boolean
        */
        this.expanded = false;
        /*
        * @name className
        * @desc This variable stores the preffix for the classNames
        * @type String
        */
        this.className = "widget";
        /*
        * @name menuOptionsPanels
        * @desc Stores the options panels element and some information about them like (Is currently being shown)
        * @type Object Array
        */
        this.menuOptionsPanels = new Array();
        //Creating the widget elements
        this._titleDiv = new Element('div', {
            'class': this.className + '_title',
            id: this._getId("header")
        });
        this._contentDiv = new Element('div', {
            'class': this.className + '_content',
            id: this._getId("content")
        });
        this._footerDiv = new Element('div', {
            'class': this.className + '_statusbar',
            id: this._getId("footer")
        });
        var buttonContainer = new Element('div', {
            'class': this.className + '_buttonContainer'
        });
        var divHeader = new Element('div', { 'class': this.className + '_nw' });
        divHeader.insert(this._titleDiv);
        divHeader.insert(buttonContainer);
        this.divContent = new Element('div', {
            'class': this.className + '_w'
        }).insert(this._contentDiv);
        this.divFooter = new Element('div', {
            'class': this.className + '_sw'
        }).insert(this._footerDiv);
        this._div = new Element('div', {
            'class': this.className + (this.className != "widget" ? " widget" : ""),
            id: this._getId()
        });
        this.optionsPanelsContainer = new Element('div', {
            'class': this.className + '_optionsContainer'
        });
        //Making the insertions
        this._div.insert(divHeader);
        this._div.insert(this.optionsPanelsContainer);
        this._div.insert(this.divContent);
        this._div.insert(this.divFooter);
        this._div.widget = this;
        if (!Object.isEmpty(this.options.events.get('onOpen')))
            document.fire(this.options.events.get('onOpen'), widgetId);
        this.divHeader = divHeader;
        //Buttons actions
        if (this.options.closeButton) {
            this.closeButton = new Element('acronym', {
                'class': 'application_rounded_close menus_widget_align_icon test_icon',
                'title': 'Close'
            });
            //Inserting the close button
            buttonContainer.insert(this.closeButton);
            //When clicking on the close button
            this.closeButton.observe('click', this.closeButtonAction.bind(this));
        }
        if (this.options.minimizeButton) {
            this.minimizeButton = new Element('acronym', {
                'class': 'application_rounded_minimize menus_widget_align_icon test_icon',
                'title': 'Minimize'
            });
            //Inserting the minimize button
            buttonContainer.insert(this.minimizeButton);
            //When clicking on the minimize button
            this.minimizeButton.observe('click', this.minimizeButtonAction.bind(this));
        }
        if (this.options.optionsButton) {
            this.contextMenu = new Proto.Menu({
                selector: '#desc',
                className: 'contextMenu',
                menuItems: []
            });
            /*this.insertContextMenuItem('Settings', 'settings', this._defaultSettingsCallback, true, {
                width: '250px',
                height: 'auto'
            });*/
            this.optionsButton = new Element('acronym', {
                'class': 'application_rounded_options menus_widget_align_icon test_icon',
                id: 'widgets_optionsButton',
                'title': 'Options'
            });
            //Inserting the options button
            buttonContainer.insert(this.optionsButton);
            //When clicking on the options button
            this.optionsButton.observe('click', this.optionsButtonAction.bind(this));
        }

        if (!Object.isEmpty(this.options.height)) {
            //Creating the structure for the DivScroll module
            this.divContent.setStyle({
                height: (this.options.height) + 'px'
            });
        }
        if (this.options.openMinimized) {
            this.minimizeButton.removeClassName('application_rounded_minimize');
            this.minimizeButton.addClassName('application_rounded_maximize');
            this.minimizeButton.title = 'Maximize';
            this.optionsPanelsContainer.hide();
            this.divContent.hide();
            this.divFooter.hide();
            this.minimized = true;
            this.updateHeight();
        }
        //Listening to collapseWidget event
        document.observe('EWS:widgets_collapseWidget', function(args) {
            if (args == widgetId) {
                this.collapseWidgetAction();
            }
        } .bind(this));

        document.observe('EWS:widgets_widgetPositioned', function(event) {
            var args = getArgs(event);
            if (args.id == this._id) {
                document.fire('EWS:widgets_widgetNewPosition', {
                    id: widgetId,
                    position: args.position
                });
            }
            if (args.id == this._getId() && this.expanded) {
                Framework_stb.hideSemitransparent();
                this.collapseWidgetAction();
            }
        } .bind(this));
        document.observe('EWS:Widgets_contextMenuClick', function(event) {
            var args = getArgs(event);
            if (args != this._id && this.contextMenu) this.contextMenu.container.hide();
        } .bind(this));
        document.observe('EWS:widgets_hideContextMenu', function(event) {
            var args = getArgs(event);
            if (args == this._id)
                this.contextMenu.container.hide();
        } .bind(this));
        this.setColor();		
        return this;
    },
    /*
    * @method _defaultSettingsCallback
    * @desc That method is executed when clicking on the context menu default settings
    * @param widget {Widgets.Widget} Widget object where the callback was made from
    * @param element {Prototype.Element} Prototype element for the optios panel
    */
    _defaultSettingsCallback: function(widget, element) {
        if (typeof (widget.defaultSettingsCallback) == 'function') {
            widget.defaultSettingsCallback(widget, element);
        }
        else {
            element.update('<span>Default options</span>');
            element.insert(new Element('input', {
                'type': 'button',
                'value': 'Close'
            }).observe('click', function() {
                widget.closeCurrentOptionsPanel();
            }));
        }
    },

    /*
    * @method collapseWidgetAction
    * @desc This method collapsed the expanded widget positionating it on the column
    */
    collapseWidgetAction: function() {
        if (this.options.semitrans == true) {
            if (this._expandedWidget) {
                $A(this._expandedWidget.childNodes).each(function(item) {
                    this._div.insert(item);
                } .bind(this));
                this._expandedWidget.remove();
            }
        }
        //Empty the style tag (To make it work on IE)
        this._div.writeAttribute('style', '');
        this._div.setStyle({
            zIndex: 1
        });
        if (this.options.height)
            this.divContent.setStyle({
                height: this.options.height + 'px'
            });
        this.expanded = false;
        this.portal.updateColumnsHeight();
    },
    /*
    * @method minimizeButtonAction
    * @desc This action is triggeren when clicking on the minimize button, it by default hide and show the content of the
    *       widget just showing the title bar
    * @param evt {Event} Event data
    */
    minimizeButtonAction: function(evt, noEvent) {
        //Check for action defined by de user
        if (typeof (this.onHideWidgetAction) == 'function')
            this.onHideWidgetAction();
        else {
            //Default action
            if (this.minimized) {
                //Showing the content
                this.minimizeButton.removeClassName(this.className + '_minimizeButtonShow');
                this.minimizeButton.addClassName('application_rounded_minimize menus_widget_align_icon');
                this.minimizeButton.title = 'Minimize';
                this.divContent.show();
                //this.divFooter.show();
                this.optionsPanelsContainer.show();
                this.minimized = false;
                this.updateHeight();
                if (noEvent != true && !Object.isEmpty(this.options.events.get('onMaximize')))
                    document.fire(this.options.events.get('onMaximize'), this.widgetId);
            }
            else {
                //Hidding the content
                this.minimizeButton.removeClassName('application_rounded_minimize');
                this.minimizeButton.addClassName('application_rounded_maximize');
                this.minimizeButton.title = 'Maximize';
                this.optionsPanelsContainer.hide();
                this.divContent.hide();
                this.divFooter.hide();
                this.minimized = true;
                this.updateHeight();
                if (noEvent != true && !Object.isEmpty(this.options.events.get('onMinimize')))
                    document.fire(this.options.events.get('onMinimize'), this.widgetId);
            }
            this.portal.updateColumnsHeight();
        }
    },
    /*
    * @method setPortal
    * @desc This function is called by the portal class when adding a widget to it, it make a pointer to the portal object
    *       to allow the widget class to access to the portal methods
    * @desc portal {Widgets.Portal} Portal object
    */
    setPortal: function(portal) {
        this.portal = portal;
        this._div.addClassName(this.portal.getPortalDivName());
    },
    /*
    * @method closeButtonAction
    * @desc This function will be triggered every time the user clicks on the close button
    * @param evt {Event} Event data
    */
    closeButtonAction: function(evt) {
        if (typeof (this.onCloseWidgetAction) == 'function')
            this.onCloseWidgetAction();
        else {
            //Calling to the default action
            this._defaultCloseButtonAction();
        }
    },
    /*
    * @method _defaultCloseButtonAction
    * @desc Default action when clicking on close buttonm
    */
    _defaultCloseButtonAction: function() {
        //fireEvent portal removed
        this.portal.remove(this);
        if (!Object.isEmpty(this.options.events.get('onClose')))
            document.fire(this.options.events.get('onClose'), this.widgetId);
    },
    /*
    * @method optionsButtonAction
    * @desc This function will be triggered every time the user clicks on the options button
    * @param evt {Event} Event data
    */
    optionsButtonAction: function(evt) {
        if (typeof (this.onCallWidgetOptions) == 'function')
            this.onCallWidgetOptions();
        else {
            //Calling to the default action
            this._defaultOptionsButtonAction(evt);
            if (!Object.isEmpty(this.options.events.get('onContextMenuClick')))
                document.fire(this.options.events.get('onContextMenuClick'), this.widgetId);
        }
    },
    /*
    * @method createPopupPanel
    * @desc Creates the structure of a popup options panel
    * @return The panel container element
    */
    createPopupPanel: function() {
        var outer = new Element('div', {
            'class': this.className + '_outerOptions'
        });
        return outer;
    },
    /*
    * @method insertContextMenuItem
    * @desc This method insert one item on the context menu
    * @param name {String} Name of the item
    * @className {String} Class name for the item
    * @callbackFunction {Function} This function will be performed when the user clicks on the menu item
    * @return The widget object (this)
    */
    insertContextMenuItem: function(name, className, callbackFunction, dimensions) {
        this.menuOptionsPanels[this._panelNum] = new Object();
        if (!dimensions) {
            dimensions = new Object();
            dimensions.height = 'auto';
            dimensions.width = 'auto';
        }
        var panelNum = this._panelNum;
        this.contextMenu.addItem({
            name: name,
            className: this.className,
            callback: function(id) {
                callbackFunction(this, this.menuOptionsPanels[id].content);
            } .bind(this)
            ,
            itemId: panelNum
        });
        this._panelNum++;
        return this;
    },

    /*
    * @method closeCurrentPanel
    * @desc Closes the current panel is being shown
    */
    closeCurrentOptionsPanel: function() {
        this.currentOptionsPanel.element.hide();
        this.currentOptionsPanel.hide = true;
        if (this.currentOptionsPanel.popup) {
            Framework_stb.hideSemitransparent();
        }
        this.currentOptionsPanel = null;
        this.portal.updateColumnsHeight();
    },
    /*
    * @method insertContextMenuSeparator
    * @desc This function inserts a separator on the context menu
    * @return The widget object (this)
    */
    insertContextMenuSeparator: function() {
        this.contextMenu.addItem({
            separator: true
        });
        return this;
    },
    /*
    * @method _defaultOptionsButtonAction
    * @desc Default action for the options buttonm
    */
    _defaultOptionsButtonAction: function(evt) {
        //fireEvent launch button options
        this.contextMenu.show(evt);
        var offset = this.optionsButton.cumulativeOffset();
        document.fire('EWS:Widgets_contextMenuClick', this._id);
        var zIndex = 5000;
        if (this.expanded) zIndex = 5002;
        this.contextMenu.container.setStyle({
            position: 'absolute',
            top: offset.top + 'px',
            left: offset.left + 'px',
            zIndex: zIndex
        });
    },
    /*
    * @method getElement
    * @desc This function gets the widget prototype element
    * @return Prototype element
    */
    getElement: function() {
        return $(this._getId()) || $(this._div);
    },
    /*
    * @method setTitle
    * @desc Sets the widget title
    * @param title {string} The title to be setted
    */
    setTitle: function(title) {
        $(this._titleDiv).update('<abbr title="' + title + '"><span class="widgets_header_text application_text_bolder test_widget_text">' + title + '</span></abbr>');
        this.title = title;
        return this;
    },
    /*
    * @method getTitle
    * @desc Gets the title element
    * @return The _titleDiv element
    */
    getTitle: function() {
        return this._titleDiv;
    },
    /*
    * @method setClassName
    * @desc Adds a className to the widget div
    * @param className {String} The className
    */
    setClassName: function(className) {
        this._div.addClassName(className);
    },
    /**
     * Sets a new color for the widget
    * @param className The new class with the color. If empty, we will use the default
     */
    setColor: function(className) {
        this.removeHeaderColors();
        if (!Object.isEmpty(className)) {
            //We receive a new class
            var newClassName = 'barInColor_' + className;
            this.divHeader.addClassName(newClassName);
                
        } else {
            //We use default color
            this.divHeader.addClassName('application_header_bar');
       
        }
                this._footerDiv.up().addClassName('application_border_widget_default application_border_widget_bottom_default');
                this.divContent.addClassName('application_border_widget_default');

    },
    /**
    * Remove the color classes for the header
    */
    removeHeaderColors: function() {
        //Remove the default class color
        this.divHeader.removeClassName('application_header_bar');
        //Remove the other colors
        var allClasses = $w(this.divHeader.className);
        for (var i = 0; i < allClasses.length; i++) {
            if (allClasses[i].include('barInColor_')) {
                this.divHeader.removeClassName(allClasses[i]);
            }
        }
    },
    /*
    * @method setContent
    * @desc Sets the content of the div
    * @param title {String} Content of the widget
    */
    setContent: function(title) {
        $(this._contentDiv).update(title);
        this.updateHeight();
        if (!Object.isEmpty(this.portal))
            this.portal.updateColumnsHeight();
        return this;
    },
    getContentElement: function() {
        return this._contentDiv;
    },
    /*
    * @method getContent
    * @desc Gets the content of the widget
    * @return The content
    */
    getContent: function() {
        return $(this._contentDiv)
    },
    /*
    * @method updateHeight
    * @desc Updates the height of the widget
    */
    updateHeight: function() {
    /*
        this._contentDiv.setStyle({height: null})
        var h = null;
        if(!this.minimized)
        h = this._contentDiv.scrollHeight;
        else
        h = this._contentDiv.getHeight();
        if(this.options.height == null)
        this._contentDiv.setStyle({height: h + "px"});
        */
    },
    /*
    * @method _getId
    * @desc Gets the ID for a given prefix
    */
    _getId: function(prefix) {
        return (prefix ? prefix + "_" : "") + this._id;
    }
});
/* @class Widgets.Portal
* @desc This Class implements the functionality of the widgets portal (The drag & droppable columns)
*       it provides a method to add widgets to the pannel in a specific position and also a method to
remove the widgets from the portal. It also throw events every time a widget position change
with the new position
*/
Widgets.Portal = Class.create()
Object.extend(Widgets.Portal.prototype, {
    lastEvent: null,
    widgets: null,
    columns: null,

    /*
    * @method initialize
    * @desc Creates the portal structure and functionalities
    * @param colums {String} Id of the columns to insert the widgets
    * @param uniqueId {String} Unique Id for the portal
    * @param options {Object} Options for creating the portal
    */
    initialize: function(columns, uniqueId, options) {
        this.options = Object.extend({
            removeEffect: Element.remove,
            startDragDrop: true
        }, options)
        /*
        * @name uniqueId
        * @desc This variable stores the unique Id for the portal
        * @type String
        */
        this.uniqueId = uniqueId;
        /*
        * @name _columns
        * @desc Stores the columns to positionate the widgets into an array
        * @type Array => Prototype.Element
        */
        this._columns = (typeof columns == "string") ? $$(columns) : columns;

        // If no elements corresponding to columns names were found, for example when called for
        // widgets inside a popup, take data from parent element if one is passed via options.
        if (this._columns.length == 0) {
            if (this.options.aparent != null) {
                this._columns = this.options.aparent.descendants();
            }
        }
        /*
        * @name _widgets
        * @desc Stores the added widgets
        * @type Array Widgets.Widget
        */
        this._widgets = new Array();
        //Making each column droppable

        // Draggable calls makePositioned for IE fix (??), I had to remove it for all browsers fix :) to handle properly zIndex
        this._columns.invoke("undoPositioned");
        if (this.options.startDragDrop)
            this.startDragDrop();
    },
    startDragDrop: function() {
        var a = 0;
        var b = 0;
        this._columns.each(function(element) {
            Droppables.add(element, {
                onHover: this.onHover.bind(this),
                overlap: "vertical",
                accept: this.uniqueId
            })
        } .bind(this));
        Draggables.addObserver({
            onEnd: this.endDrag.bind(this),
            onStart: this.startDrag.bind(this)
        });
    },
    stopDragDrop: function() {
        Draggables.observers = [];
        this._columns.each(function(element) { 
            Droppables.remove(element)
        } .bind(this));
    },
    /*
    * @method add
    * @desc Adds a widget to the portal and make the widget draggable
    * @param {Widget.Widget} Widget to be added
    * @param columnIndex {Integer} Column to be added
    * @draggable {Boolean} If true make it draggable
    */
    add: function(widget, columnIndex, draggable) {
        widget.setPortal(this);
        widget.setClassName(this.uniqueId);
        draggable = typeof draggable == "undefined" ? true : draggable
        // Add to widgets list
        this._widgets.push(widget);
        if (this.options.accept)
            widget.getElement().addClassName(this.options.accept)
        // Add element to column
        if (!Object.isEmpty(this._columns[columnIndex]))
            this._columns[columnIndex].appendChild(widget.getElement());
        else
            this._columns[0].appendChild(widget.getElement());
        // Make header draggable   
        if (draggable) {
            widget.draggable = new Draggable(widget.getElement(), {
                handle: widget.divHeader,
                revert: false
            });
            widget.divHeader.addClassName("widget_draggable");
            widget.draggable = new Draggable(widget.getElement(), {
                handle: widget.divHeader,
                revert: false
            });
        }
        this.updateColumnsHeight();
        widget.collapseWidgetAction();
    },
    /*
    * @method remove
    * @desc Removes a widget from the portal
    * @param widget {Widget} The widget to be removed
    */
    remove: function(widget) {
        // Remove from the list
        this._widgets.reject(function(w) { 
            return w == widget
        });
        // Remove draggable
        if (widget.draggable)
            widget.draggable.destroy();
        // Remove from the dom
        this.options.removeEffect(widget.getElement());
        // Update columns heights
        this.updateColumnsHeight();
    },
    destroy: function() {
        this.stopDragDrop();
    },
    /*
    * @method serialize
    * @desc Serializes the columns
    * @return The parameters
    */
    serialize: function() {
        parameters = ""
        this._columns.each(function(column) {
            var p = column.immediateDescendants().collect(function(element) {
                return column.id + "[]=" + element.id
            }).join("&")
            parameters += p + "&"
        });
        return parameters;
    },
    /*
    * @method getPortalDivName
    * @desc Gets the portal div name
    * @return The columns name
    */
    getPortalDivName: function() {
        return this.columnsName;
    },
    /*
    * @method startDrag
    * @desc This methos is triggered when start dragging a widget, it shows the ghost widget
    * @param eventName {Event} Event data
    * @param draggable The draggable element
    */
    startDrag: function(eventName, draggable) {
        var widget = draggable.element;
        for (var i=0; i < this._widgets.length; i++){
            if (this._widgets[1] && this._widgets[1]._id == widget.id && !Object.isEmpty(this._widgets[i].options.events.get('onStartReposition')))
                document.fire(this._widgets[i].options.events.get('onStartReposition'), widget.id);
        }
        var className = widget.hasClassName(this.columnsName);
        if (!className) return;
        if (!this._widgets.find(function(w) { 
            return w == widget.widget
        }))
            return;
        var column = widget.parentNode;
        // Create and insert ghost widget
        var ghost = DIV({ 
            className: 'widget_ghost'
        }, "");
        $(ghost).setStyle({ 
            height: widget.getHeight() + 'px'
        })
        column.insertBefore(ghost, widget);
        // IE Does not absolutize properly the widget, needs to set width before
        widget.setStyle({ 
            width: widget.getWidth() + "px"
        });
        // Absolutize and move widget on body
        Position.absolutize(widget);
        document.body.appendChild(widget);
        // Store ghost to drag widget for later use
        draggable.element.ghost = ghost;
        // Store current position
        this._savePosition = this.serialize();
        this.widgetOriginalColumn = column;
    },
    /*
    * @method endDrag
    * @desc This method is called when stop dragging a widget
    * @param eventName {Event} Event data
    * @param draggable The draggable element
    */
    endDrag: function(eventName, draggable) {
        var widget = draggable.element;
        for (var i=0; i < this._widgets.length; i++){
            if (this._widgets[1] && this._widgets[1]._id == widget.id && !Object.isEmpty(this._widgets[i].options.events.get('onStartReposition')))
                document.fire(this._widgets[i].options.events.get('onStartReposition'), widget.id, widget.ghost.parentNode.id);
        }
        if (!this._widgets.find(function(w) { 
            return w == widget.widget
        }))
            return;
        var column = widget.ghost.parentNode;
        column.insertBefore(draggable.element, widget.ghost);
        widget.ghost.remove();
        var position = new Object();
        var divs = column.childElements();
        var portal = column.parentNode.childElements();
        var i = 0;
        while (widget.identify() != divs[i].identify()) i++;
        position.row = i;
        var i = 0;
        while (column.identify() != portal[i].identify()) i++;
        position.column = i;
        for (var row = i; row <= divs.length - 1; row++) {
            document.fire('EWS:widgets_widgetPositioned', { 
                id: divs[row].identify(),
                position: {
                    row: row,
                    column: position.column
                }
            });
        }
        var originalDivs = this.widgetOriginalColumn.childElements();
        //Recalculating the position of the widgets on the column where the widget comes from
        var i = 0;
        if (this.widgetOriginalColumn.identify() != column.identify()) {
            while (this.widgetOriginalColumn.identify() != portal[i].identify()) i++;
            var columnPosition = i;
            for (var row = 0; row <= originalDivs.length - 1; row++) {
                document.fire('EWS:widgets_widgetPositioned', { 
                    id: originalDivs[row].identify(),
                    position: {
                        row: row,
                        column: columnPosition
                    }
                });
            }
        }
        //alert('Position: '+position.row+' '+position.column);
        if (Prototype.Browser.Opera)
            widget.setStyle({ 
                top: 0,
                left: 0,
                width: "100%",
                height: widget._originalHeight,
                zIndex: 1,
                opacity: null,
                position: "relative"
            })
        else
            widget.setStyle({ 
                top: null,
                left: null,
                width: null,
                height: null,
                zIndex: 1,
                opacity: null,
                position: "relative"
            })
        widget.ghost = null;
        //widget.widget.updateHeight();
        //this.updateColumnsHeight();
        document.fire('EWS:widgets_widgetPositioned', {
            id: widget.identify(),
            position: position
        });
        if (this.options.semitrans == true) {
            if (!Object.isEmpty($('semitransparent'))) {
                $('semitransparent').remove();
            }
        }
    },
    /*
    * @method onHover
    * @desc This method takes care of showing and moving the ghost widget on the different columns when moving the widget
    * @param dragWidget Widget being drop
    * @param dropon Place where is being drop
    */
    onHover: function(dragWidget, dropon, overlap) {
        var offset = Position.cumulativeOffset(dropon);
        var x = offset[0] + 10;
        var y = offset[1] + (1 - overlap) * dropon.getHeight();
        // Check over ghost widget
        if (Position.within(dragWidget.ghost, x, y))
            return;
        // Find if it's overlapping a widget
        var found = false;
        var moved = false;
        for (var index = 0, len = this._widgets.length; index < len; ++index) {
            var w = this._widgets[index].getElement();
            if (w == dragWidget || w.parentNode != dropon)
                continue;
            if (Position.within(w, x, y)) {
                var overlap = Position.overlap('vertical', w);
                // Bottom of the widget
                if (overlap < 0.5) {
                    // Check if the ghost widget is not already below this widget
                    if (!Object.isEmpty(w.next()) && w.next() != dragWidget.ghost) {
                        w.parentNode.insertBefore(dragWidget.ghost, w.next());
                        moved = true;
                    }
                }
                // Top of the widget
                else {
                    // Check if the ghost widget is not already above this widget
                    if (w.previous() != dragWidget.ghost) {
                        w.parentNode.insertBefore(dragWidget.ghost, w);
                        moved = true;
                    }
                }
                found = true;
                break;
            }
        }
        // Not found a widget
        if (!found) {
            // Check if dropon has ghost widget
            if (dragWidget.ghost.parentNode != dropon) {
                // Get last widget bottom value
                var last = dropon.immediateDescendants().last();
                var yLast = last ? Position.cumulativeOffset(last)[1] + last.getHeight() : 0;
                if (y > yLast && last != dragWidget.ghost) {
                    dropon.appendChild(dragWidget.ghost);
                    moved = true;
                }
            }
        }
        if (moved && this.options.onChange)
            this.options.onChange(this)
        this.updateColumnsHeight();
    },
    /*
    * @method updateColumnsHeight
    * @desc Updates the columns height
    */
    updateColumnsHeight: function() {
        var h = 0;
        this._columns.each(function(col) {
            h = Math.max(h, col.immediateDescendants().inject(0, function(sum, element) {
                return sum + element.getHeight();
            }));
        })
        this._columns.each(function(item) {
            if(item.childNodes.length == 0)
                item.setStyle({
                    height: h+'px'
                });
            else
                item.setStyle({
                    height: 'auto'
                });
        });
        this._columns[0].parentNode.setStyle({ 
            height: 'auto'
        });
    }
});
