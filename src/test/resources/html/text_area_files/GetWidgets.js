/** 
* @fileOverview GetWidgets.js 
* @description It contains the GetWidgets module class.
*/
/**
*@constructor
*@description Class GetWidgets --> Given an application Id, requests its content (widgets in this case). 
*/
var GetWidgets = Class.create(origin,
/** 
*@lends GetWidgets class
*/
 {
    /**     
    *@param options {JSON Object} options hash
    *@description service, application Id and HTML element target Id needed for the GetWidget module
    *to run.
    *	- options.service --> the service name to be called to get the widgets structure: number of widgets
    *                        and their ids, plus their position etc.
    *  - options.tabId   --> appId from where we want to ask SAP for the widgets info related to it.
    *  - options.target  --> HTML element (div) where we want to set the widgets.                      
    */
    initialize: function($super, options) {
        $super();
        /**
        *@ PortalHalf and PortalFull are global variables to share the portals 
        */
        this.portalHalf = null; 
        this.portalFull = null;
        this.eventName = null;
        /**
        *@type String
        *@description Object type.
        */
        this.objectType = null;
        /**
        *@type String
        *@description Object id.
        */
        this.objectId = null;
        /**
        *@type Hash
        *@description It will keep all the widgets objects created.
        */
        this.widgets = null;
        /**
        *@type String
        *@description Service to be called so as to get the widgets info from the back-end.
        */
        this.service = 'GET_WIDGETS';
        /**
        *@type String
        *@description Application Id for which its widgets content is going to be got.
        */
        this.tabId = null;
        /**
        *@type HTML Element/Html Element Id (String)
        *@description The HTML Element where should be inserted the widgets.
        */
        this.target = null;
        /**
        *@type String
        *@description Widget width in pixels.
        */
        this.widgetWidth = null;
        /**
        *@type Hash
        *@description Widgets labels.
        */
        this.widgetsInfo = null;
        this.labels = null;
        this.virtualHtml = null;
        this.widgets = $H({});
        this.widgetsInfo = $H({});
        this.labels = $H({});
        this.widgetsStructure = $H();
        if (options && options.eventName) this.eventName = options.eventName;
        // if objectType has been set (mandatory)		
        if (options && options.objectType) this.objectType = options.objectType;
        // if objectId has been set (mandatory)
        if (options && options.objectId) this.objectId = options.objectId;
        //if servive has been set (mandatory)
        if (options && options.service) this.service = options.service;
        // if tabId has been set (mandatory)
        if (options && options.tabId) this.tabId = options.tabId;
        // if target has been set (mandatory)
        if (options && options.target) {
            // if target is the HTML Element id 	 
            if (Object.isString(options.target) && $(options.target))
                this.target = $(options.target);
            // if target is the HTML Element itself
            else
                this.target = options.target;
        }
        // Calling SAP for the widgets info
        this.callSAP();
    },
    /**     
    *@description It calls the back-end to get the widgets info.
    */
    callSAP: function() {
        var xml = "<EWS>" +
                      "<SERVICE>" + this.service + "</SERVICE>" +
                      "<OBJECT TYPE='" + this.objectType + "'>" + this.objectId + "</OBJECT>" +
                      "<PARAM>" +
                          "<CONTAINER>" + this.tabId + "</CONTAINER>" +
                      "</PARAM>" +
                  "</EWS>";
        this.makeAJAXrequest($H({
            xml: xml,
            successMethod: 'handleData'
        }));
    },
    /**     
    *@param json {JSON Object} Widgets info got from SAP
    *@description It turns the info got from the back-end into some more useful data structures to let
    *the rest of methods work easily with it.
    */
    handleData: function(json) {
        // exit the method if there's no widgets related data.
        if (!json.EWS.o_widgets)
            return;
     this.globalId = json.EWS.o_global_id;
        // Getting the labels for the widgets
        if (json.EWS.labels)
            objectToArray(json.EWS.labels.item).each(function(label) {
                this.labels.set(label['@id'], label['@value']);
            }.bind(this));
        // Building thedata structure to work with
        if (!Object.isEmpty(json.EWS.o_widgets)) {
            var widgets = objectToArray(json.EWS.o_widgets.yglui_str_wid_attributes);
            this.widgetsStructure.set('structure', { fullSize: $A(), halfSize: $A() });
            for (var i = 0; i < widgets.length; i++) {
                this.widgetsInfo.set(widgets[i]['@appid'], { type: widgets[i]['@type'] });
                var row = parseInt(widgets[i]['@widrow'], 10);
                if (Object.isEmpty(widgets[i]['@widcolumn']))
                    this.widgetsStructure.get('structure').fullSize[row] = widgets[i];
                else if (widgets[i]['@widcolumn'] == 1) {
                    if (Object.isEmpty(this.widgetsStructure.get('structure').halfSize[row]))
                        this.widgetsStructure.get('structure').halfSize[row] = { 'column1': widgets[i], 'column2': '' };
                    else
                        this.widgetsStructure.get('structure').halfSize[row]['column1'] = widgets[i];
                }
                else {
                    if (Object.isEmpty(this.widgetsStructure.get('structure').halfSize[row]))
                        this.widgetsStructure.get('structure').halfSize[row] = { 'column1': '', 'column2': widgets[i] };
                    else
                        this.widgetsStructure.get('structure').halfSize[row]['column2'] = widgets[i];
                }
            }
        }
        // Widget width
        //this.widgetWidth = ((this.target.getStyle('width').gsub('px', '') - 10) / this.numberColumns).round() + 'px';
        // Creating the module HTML
        this.createHtml();
        // Creating the portal and widgets objects
        this.createWidgets();
    },
    /**     
    *@description It creates the module needed HTML.
    */
    createHtml: function() {
        // creating the html structure for the halfSize widgets
        if (this.widgetsStructure.get('structure')['halfSize'].length > 0) {
            //The main div
            this.virtualHtml = new Element('div', {
                'id': this.tabId + '_' + this.objectId + '_portal',
                'class': 'getWidgets_portal'
            });
            // creating 
            for (var i = 0; i < 2; i++) {
                var column = new Element('div', { 'id': 'getWidgets_widget_' + i, 'class': 'getWidgets_column' });
                this.virtualHtml.insert(column);
            }
            // Setting the widgets width
            this.virtualHtml.select('.getWidgets_column').invoke('setStyle', {
                'width': ((this.target.getStyle('width').gsub('px', '') - 10) / 2).round() + 'px'
            });
            this.target.insert(this.virtualHtml);
        }
        // creating the portal for full size if needed.
        if (this.widgetsStructure.get('structure')['fullSize'].length > 0) {
            // The main div for the portal
            this.virtualHtmlFullSize = new Element('div', {
                'id': this.tabId + '_' + this.objectId + '_portal_full',
                'class': 'getWidgets_portal'
            });
            // now, creating the div for the widgets
            var fullSizePortal = new Element('div', { 'id': 'getWidgets_widget_full', 'class': 'getWidgets_column' });
            this.virtualHtmlFullSize.insert(fullSizePortal);
            fullSizePortal.setStyle({
                'width': (this.target.getStyle('width').gsub('px', '') - 10).round() + 'px'
            });
            this.target.insert(this.virtualHtmlFullSize);
        }
    },
    getColor: function(color) {
        var ret = '';
        if (color.toArray().size() == 1)
            ret = 'eeColor0' + color;
        else
            ret = 'eeColor' + color;
        return ret;
    },
    /**          
    *@description It creates the widgets objects depending on the info got from the back-end.
    */
    createWidgets: function() {
        // Creating the half size widgets.
        if (this.widgetsStructure.get('structure')['halfSize'].length > 0) {
            var widgetsHalfSize = this.widgetsStructure.get('structure')['halfSize'].compact();
            this.portalHalf = new Widgets.Portal('#' + this.virtualHtml.identify() + ' div', 'getWidgetsHalf_' + this.tabId + '_' + this.objectId + '_portal', {});
            for (var i = 0; i < widgetsHalfSize.length; i++) {
                // add the widgets to the first column
                if (!Object.isEmpty(widgetsHalfSize[i]['column1'])) {
                    var label = this.labels.get(widgetsHalfSize[i]['column1']['@appid']);
                 var isCollapsed = !widgetsHalfSize[i]['column1']['@collapsed'] ? false : true;
                 var hasHelp = !widgetsHalfSize[i]['column1']['@widget_help'] ? false : true;
                 var auxWidget = new Widgets.Widget('widget_' + widgetsHalfSize[i]['column1']['@appid'], { openMinimized: isCollapsed, optionsButton: hasHelp, closeButton: false }).setTitle(label);
                 if (hasHelp) {
                     auxWidget.insertContextMenuItem(global.getLabel('help'), 'help', this.helpClicked.bind(this, widgetsHalfSize[i]['column1']['@appid']), {
                         width: '200px',
                         height: 'auto'
                     });
                 }
                    var colorClass = (!Object.isEmpty(widgetsHalfSize[i]['column1']['@color']) && (widgetsHalfSize[i]['column1']['@color'] != '0')) ? this.getColor(widgetsHalfSize[i]['column1']['@color']) : null;
                    auxWidget.setColor(colorClass);
                    this.widgets.set(widgetsHalfSize[i]['column1']['@appid'], auxWidget);
                    this.portalHalf.add(auxWidget, 0);
                }
                // add the widgets to the second column
                if (!Object.isEmpty(widgetsHalfSize[i]['column2'])) {
                    var label = this.labels.get(widgetsHalfSize[i]['column2']['@appid']);
                 var isCollapsed = !widgetsHalfSize[i]['column2']['@collapsed'] ? false : true;
                 var hasHelp = !widgetsHalfSize[i]['column2']['@widget_help'] ? false : true;
                 var auxWidget = new Widgets.Widget('widget_' + widgetsHalfSize[i]['column2']['@appid'], { openMinimized: isCollapsed, optionsButton: hasHelp, closeButton: false }).setTitle(label);
                 if (hasHelp) {
                     auxWidget.insertContextMenuItem(global.getLabel('help'), 'help', this.helpClicked.bind(this, widgetsHalfSize[i]['column2']['@appid']), {
                         width: '200px',
                         height: 'auto'
                     });
                 }
                    var colorClass = (!Object.isEmpty(widgetsHalfSize[i]['column2']['@color']) && (widgetsHalfSize[i]['column2']['@color'] != '0')) ? this.getColor(widgetsHalfSize[i]['column2']['@color']) : null;
                    auxWidget.setColor(colorClass);
                    this.widgets.set(widgetsHalfSize[i]['column2']['@appid'], auxWidget);
                    this.portalHalf.add(auxWidget, 1);
                }
            }
        }
        // Adding the full size widgets
        if (this.widgetsStructure.get('structure')['fullSize'].length > 0) {
            var widgetsFullSize = this.widgetsStructure.get('structure')['fullSize'].compact();
            this.portalFull = new Widgets.Portal('#' + this.virtualHtmlFullSize.identify() + ' div', 'getWidgetsFull_' + this.tabId + '_' + this.objectId + '_portal', {});
            for (var i = 0; i < widgetsFullSize.length; i++) {
                var label = this.labels.get(widgetsFullSize[i]['@appid']);
             var isCollapsed = !widgetsFullSize[i]['@collapsed'] ? false : true;
             var hasHelp = !widgetsFullSize[i]['@widget_help'] ? false : true;
             var auxWidgetFull = new Widgets.Widget('widget_' + widgetsFullSize[i]['@appid'], { openMinimized: isCollapsed, optionsButton: hasHelp, closeButton: false }).setTitle(label);
             if (hasHelp) {
                 auxWidgetFull.insertContextMenuItem(global.getLabel('help'), 'help', this.helpClicked.bind(this, widgetsFullSize[i]['@appid']), {
                     width: '200px',
                     height: 'auto'
                 });
             }
                var colorClass = (!Object.isEmpty(widgetsFullSize[i]['@color']) && (widgetsFullSize[i]['@color'] != '0')) ? this.getColor(widgetsFullSize[i]['@color']) : null;
                auxWidgetFull.setColor(colorClass);
                this.widgets.set(widgetsFullSize[i]['@appid'], auxWidgetFull);
                this.portalFull.add(auxWidgetFull, 0);
            }
        }
        document.fire.bind(document).defer(this.eventName, this.target.identify());
    },
    reloadWidgets: function(options) {
        if (this.virtualHtml && this.virtualHtml.parentNode)
            this.virtualHtml.remove();
        delete this.virtualHtml;
        if (this.virtualHtmlFullSize && this.virtualHtmlFullSize.parentNode)
            this.virtualHtmlFullSize.remove();
        delete this.virtualHtmlFullSize;
        this.widgets.each(function(widget) {
            delete widget;
        }.bind(this));
        delete this.widgets;
        this.widgetsStructure = $H();
        this.widgets = $H({});
        this.widgetsInfo = $H({});
        this.labels = $H({});
        // if objectType has been set (mandatory)
        if (options && options.objectType) this.objectType = options.objectType;
        // if objectId has been set (mandatory)
        if (options && options.objectId) this.objectId = options.objectId;
        // if servive has been set (mandatory)
        if (options && options.service) this.service = options.service;
        // if tabId has been set (mandatory)
        if (options && options.tabId) this.tabId = options.tabId;
        // if target has been set (mandatory)
        if (options && options.target) {
            // if target is the HTML Element id 	 
            if (Object.isString(options.target) && $(options.target))
                this.target = $(options.target);
            // if target is the HTML Element itself
            else
                this.target = options.target;
        }
        this.callSAP();
    },
    getWidgetType: function(widgetAppId) {
        return this.widgetsInfo.get(widgetAppId).type;
 },

 helpClicked: function(appId, widget) {
     document.fire("EWS:widgetHelpClicked" + appId, appId);
 }
});