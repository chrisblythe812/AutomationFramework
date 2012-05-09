/** 
 * @fileOverview timeViews.js 
 * @description 
*/ 
var timeViews = Class.create(Application,
/** 
*@lends timeViews
*/
{
    /*** METHODS ***/
    /**
     * @description Constructor
     * @param $super Superclass 
     */
    initialize: function($super, options) {
        $super(options);
        //Div which contains the title of the tab.
        this.titleElement = new Element('div', {'id' : 'titleTimeViews', 'class' : 'application_main_title2 inlineElement'});
        //Vector which contains the subapplications info.
        this.subApps = []; 
        this.currentSubApp = '';
        this.currentView = '';       
    },

    /**
     * @description Starts timeViews
     * @param $super Superclass
     */
    run: function($super) {
        $super();
        
        if(this.firstRun){
            //At fist run, 1) we create title and viewSelector divs
            var headerElement = new Element('div', {'id' : 'headerTimeViews', 'class' : 'inlineContainer'});
            var viewSelectorElement = new Element('div', {'id' : 'divViewSelector', 'class' : 'inlineElementRight'});
            var viewSelectorTitle = new Element('div', {'id' : 'titleViewSelector', 'class' : 'inlineElementRight application_main_soft_text'}).update(global.getLabel('PM_SELVIEW'));
            headerElement.update(this.titleElement);
            headerElement.insert(viewSelectorElement);
            headerElement.insert(viewSelectorTitle);
            this.virtualHtml.insert(headerElement);
            //2) Load the subapplicatons
            this._getSubApp();
            //3) Create the view selector
            this._drawViewSelector(viewSelectorElement);
        }
        this._openView(this.currentSubApp, this.currentView);
    },

    /**
     * @description Stops parentCalendar
     * @param $super Superclass 
     */
    close: function($super) {
        $super();
    },

    /**
     * @description get all the subapplication, which will be loaded and set the first subApp as default
     * @param element div which insert view selector
     */
    _getSubApp: function() {
        //Load from global the apps from the timeView tabId
        var timeViewsapp = global.tabid_applicationData.get(this.options.tabId).applications;
        for(var i = 0 , appLength = timeViewsapp.length; i < appLength; i++){
            if(!timeViewsapp[i]['default']) //Subapplications have ".default" = false
                this.subApps.push(timeViewsapp[i]);
        }
        //Load the first subApp as default
        this.currentSubApp = this.subApps[0].appId;
        this.currentView = this.subApps[0].view;
    },

    /**
     * @description draw view selector buttons for the actual view
     * @param element div which insert view selector
     */
    _drawViewSelector: function(element) {

        //Buttons names: HARDCODE  to be remove on EFR 2.08 (FWK team will take care about the icon name).
        var names = ["calendar","list","teamroster"];

        //Create array of buttons which will be used in the viewSelector module. View Selector module creation.
        var buttonsArray = [];
        var buttonSelected = true;
        for (var i = 0 , subAppLength = this.subApps.length; i < subAppLength; i++){
            buttonsArray.push({ name: names[i], handle_button: this._openView.bind(this, this.subApps[i].appId, this.subApps[i].view), selected: buttonSelected, liteVersion: global.getLabel(this.subApps[i].appId), toolTip: global.getLabel(this.subApps[i].appId)});
            buttonSelected = false;
        }
        var viewSelectorMenu = new viewSelector(buttonsArray);

        //insert into the div element
        element.insert(viewSelectorMenu.createrHTML());

    },
 
    /*
    * @method openView
    * @desc It manages buttons of View Selector menu
    * @param appId and view for the subapplication to be loaded. "index" is the index of the subApp
    */
    _openView: function(appId,view) {

        if (appId != '' && view != '') {
            //Before change the subapplication, we store the appId and the view as the current ones.
            this.currentSubApp = appId;
            this.currentview = view;

            global.open($H({
                app: {
                    appId: appId,
                    tabId: 'SUBAPP',
                    view: view
                },
                //createEvents: true,
                appNeedToBeOpened:"VIEW_PT"
            }));

            this.titleElement.update(global.getLabel(appId));
        }
    }
});