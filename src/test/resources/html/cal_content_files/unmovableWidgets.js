
/**
* @desc Unmovable widgets allows to the user to display fixed widgets
*/
/**
* @constructor unmWidget
* @desc this class represents the unmovable widget
*/
var unmWidget = Class.create(
{
    /**
    * @lends unmWidget
    */
    /**
    * @type String (HTML)
    * @description the title of the widget
    */
    title: "",
    /**
    * @type {boolean}
    * @description if the collapse/expand button will be shown
    */
    collapseBut: null,
    /**
    * @type hash
    * @description hash with the available actions fo the top right button
    */
    actions: null,
    /**
    * @type HTML
    * @description the body of the widget
    */
    contentHTML: null,
    /**
    * @type boolean
    * @description if the widget has to be loaded as collapsed os expanded
    */
    onLoadCollapse: null,
    /**
    * @type String
    * @description Id of the div where the widget will be positioned
    */
    targetDiv: null,
    /**
    * @type String
    * @description Id of the div where the widget will be positioned
    */
    targetDivElement: null,
    /**
    * @type boolean
    * @description whether to show the widget by default after creating or not
    */
    showByDefault: true,
    /**
    * @type hash
    *  @description hash with the events id
    */
    events: null,
    /**
    * Instantiates the widget
    * @param {Hash} options a Hash with options to initialize the widget 
    */
    initialize: function(options) {
        //initialize widgets from the options hash.
        this.title = options.get('title');
        this.collapseBut = options.get('collapseBut');
        this.actions = options.get('actions');
        this.contentHTML = options.get('contentHTML');
        this.onLoadCollapse = options.get('onLoadCollapse');
        if (Object.isEmpty(options.get('color')) || options.get('color') == 0) {
            this.headerClassName = 'unmWidgets_titleDiv';
        }
        else {
            this.headerClassName = 'barInColor_' + this.getHeaderClass(options.get('color'));
        }
        if (options.get("targetDiv")) {
            if (Object.isString(options.get('targetDiv'))) {
                this.targetDivElement = $(options.get('targetDiv'));
            } else if (Object.isElement(options.get('targetDiv'))) {
                this.targetDivElement = options.get('targetDiv');
            }
            this.targetDiv = this.targetDivElement.identify();
        }
        this.events = options.get('events');
        if (!Object.isEmpty(options.get('showByDefault')))
            this.showByDefault = options.get('showByDefault');
        if (this.showByDefault)
            this.show();
    },
    /**
    * @param {Element} dest Destination HTML element object (not the ID) 
    * @description This method updates the target div with the widget
    */
    show: function(dest) {
        if (!Object.isEmpty(dest)) {
            this.targetDivElement = dest;
            this.targetDiv = dest.identify();
        }
        var collapseIcon = null;
        var actionsIcon = null;
        var actionsDiv = "";
        //create the collapse button if needed
        if (this.collapseBut) {
            this.widgetCollapseButton = new Element('div', {
                id: 'unmWidgetCollapseButton_' + this.targetDiv,
                'class': 'menus_align_icon test_icon'
            });
            //add proper class to the button
            if (this.onLoadCollapse)
                this.widgetCollapseButton.addClassName('application_rounded_maximize');
            else
                this.widgetCollapseButton.addClassName('application_rounded_minimize');

            //store the binding properly
            this._listenToggleBinding = this._listenToggle.bind(this)
        }

        //create the conext menu button if needed
        if (!Object.isEmpty(this.actions)) {
            //create the menu
            if (Object.isEmpty(this.contextMenu)) this.contextMenu = new Proto.Menu({ className: 'contextMenu', menuItems: this.actions });
            //and the button itself
            this.widgetActionsButton = new Element('div', {
                id: 'unmWidgetActionsButton_' + this.targetDiv,
                'class': 'application_rounded_options menus_align_icon'
            });
            //bind the function needed to show the menu
            this.showContextMenuBinding = this.showActionsMenu.bindAsEventListener(this);
        }

        var bottomWidth = this.targetDivElement.getWidth() - 18;
        //create the widget title
        this.widgetTitle = new Element('div', {
            id: 'unmWidgetTitle_' + this.targetDiv,
            'class': this.headerClassName + " unmWidget_header"
        }).update("<div id='unmWidgetTitleHTML_" + this.targetDiv + "'><div class='unmWidgets_header_text application_text_bolder test_widget_text'>" + this.title + "</div></div>");
        //and add the collapse and menu buttons
        this.widgetTitle.insert(this.widgetCollapseButton);
        this.widgetTitle.insert(this.widgetActionsButton);

        this.widgetTitleText = this.widgetTitle.down("[id=unmWidgetTitleHTML_" + this.targetDiv + "]");

        //create the widget container and insert the content
        this.widgetContent = new Element('div', {
            id: 'unmWidgetContent_' + this.targetDiv,
            'class': 'unmWidgets_contentDiv'
        }).update(this.contentHTML);

        this.widgetActions = new Element('div', {
            id: 'unmWidgetActions_' + this.targetDiv,
            'class': 'contextMenu'
        });
        //insert the widget on its container
        this.targetDivElement.update(this.widgetTitle);
        this.targetDivElement.insert(this.widgetContent);
        this.targetDivElement.insert(this.widgetActions);

        //Default collapse it if indicated
        if (this.onLoadCollapse == true)
            this.widgetContent.hide();

        //Properly align the actions list
        var actionDivMargin = this.targetDivElement.getWidth() - this.widgetActions.getWidth() - 2;
        this.widgetActions.setStyle({ left: actionDivMargin + 'px', top: '22px' });
        this.widgetActions.hide();
        //Handle the collapse button click
        if (!Object.isEmpty(this.widgetCollapseButton)) {
            this.widgetCollapseButton.observe('click', this._listenToggleBinding);
        }
        //And the actions button click
        if (!Object.isEmpty(this.widgetActionsButton)) {
            this.widgetActionsButton.observe('click', this.showContextMenuBinding);
        }
    },
    getContentElement: function() {
        return this.widgetContent;
    },
    /**
    * @description This method destroys the widget
    */
    close: function() {
        if (this.events && this.events.get('onToggle'))
            document.stopObserving(this.events.get('onToggle'), this._listenToggleBinding);
        if (!Object.isEmpty(this.targetDiv)) {
            if (this.widgetTitle.parentNode)
                this.widgetTitle = this.widgetTitle.remove();
            if (this.widgetContent.parentNode)
                this.widgetContent = this.widgetContent.remove();
            if (this.widgetActions.parentNode)
                this.widgetActions = this.widgetActions.remove();
        }
    },
    /**
    * @description This function will be triggered every time the user clicks on the actions button
    * @param event {Event} Event data
    */
    showActionsMenu: function(event) {
        if (!Object.isEmpty(this.contextMenu))
            this.contextMenu.show(event);
    },
    /**
    * @description function executed when the event 'unmWidgetToggle' is triggered
    */
    _listenToggle: function() {
        if (this.widgetContent.visible()) {
            this._collapse();
        } else {
            this._expand();
        }
        if (this.events && this.events.get('onToggle')) {

            document.fire(this.events.get('onToggle'), $H({ targetDiv: this.targetDiv }));
        }
    },
    /**
    * @description function executed that expands the widget, if expanded before, nothing happens
    */
    _expand: function() {
        if (!(this.widgetContent.visible())) {
            this.widgetContent.show();
        }
        if (this.widgetCollapseButton.hasClassName('application_rounded_maximize')) {
            this.widgetCollapseButton.removeClassName('application_rounded_maximize');
            this.widgetCollapseButton.addClassName('application_rounded_minimize');
        }
    },
    /**
    * @description function executed that collapses the widget, if collapsed before, nothing happens
    */
    _collapse: function() {
        if (this.widgetContent.visible()) {
            this.widgetContent.hide();
        }
        if (this.widgetCollapseButton.hasClassName('application_rounded_minimize')) {
            this.widgetCollapseButton.removeClassName('application_rounded_minimize');
            this.widgetCollapseButton.addClassName('application_rounded_maximize');
        }
    },
    /**
    * @description method that refreshes the title with HTML passed as argument
    * @param title (HTML)
    */
    refreshTitle: function(title) {
        if (Object.isEmpty(this.targetDiv)) {
            this.title = title
        } else {
            var html = "<span class='unmWidgets_header_text application_text_bolder test_widget_text'>" + title + "</span>";
            this.widgetTitleText.update(html);
        }
    },
    /**
    * @description method that refreshes the content with HTML passed as argument
    * @param content (HTML)
    */
    refreshContent: function(content) {
        if (Object.isEmpty(this.targetDiv)) {
            this.contentHTML = content;
        } else {
            this.widgetContent.update(content);
        }
    },

    getContent: function() {
        return this.widgetContent;
    },

    getTitle: function() {
        return this.widgetTitle.down('[id=unmWidgetTitleHTML_' + this.targetDiv + ']');
    },

    getHeaderClass: function(color) {
        var ret = '';
        if (color.toPaddedString(1).length == 1)
            ret = 'eeColor0' + color;
        else
            ret = 'eeColor' + color;
        return ret;
    }
});
