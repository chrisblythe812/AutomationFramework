/** 
* @fileOverview displayDefaultView.js 
* @description File containing class displayDefaultView. 
* Application for displayDefaultView OM.
*/

/**
*@constructor
*@description Class displayDefaultView.
*@augments Application 
*/
var displayTreeDefaultPage = Class.create(Application,
{
    /**
    *@type String
    *@description Get views
    */
    getCatViews: 'GET_CAT_VIEWS',
    /**
    *@type boolean
    *@description views loaded
    */
    viewsLoaded: false,
    /*** METHODS ***/
    /**
    *Constructor of the class displayDefaultView
    */
    initialize: function ($super, args) {
        $super(args);
    },
    /**
    *@description Starts displayDefaultView
    */
    run: function ($super, args) {
        $super(args);
        this.getViewsMenu();
    },
    /**     
    *@description It calls sap to get views
    */
    getViewsMenu: function () {
        //call sap to get views
        var xml = "<EWS>" +
                    "<SERVICE>" + this.getCatViews + "</SERVICE>" +
                    "<PARAM>" +
                        "<PARENTID>" + this.options.tabId + "</PARENTID>" + //tab
                    "</PARAM>" +
                  "</EWS>";
        this.makeAJAXrequest($H({ xml: xml, successMethod: 'setViewsMenu' }));
    },
    /**     
    *@description It stores info from sap 
    */
    setViewsMenu: function (json) {
        //save info from sap
        if (json.EWS && json.EWS.o_views && json.EWS.o_views.yglui_str_cat_v) {
            this.hashOfViews = new Hash();
            var records = objectToArray(json.EWS.o_views.yglui_str_cat_v);
            this.numberOfViews = records.size();
            for (var i = 0; i < this.numberOfViews; i++) {
                var dataView = new Hash();
                dataView.set('view', records[i]['@views']);
                dataView.set('appId', records[i]['@appid']);
                dataView.set('label', records[i]['@label_tag']);
                this.hashOfViews.set(i, dataView);
            }
            this.viewsLoaded = true;                       
        }
        this.openView();
    },
    /*
    * @method openView
    * @desc It open the default view
    */
    openView: function () {
        // select first element of hash (default view configured in SAP depending of the user role)
        var index = 0;
        var appId = this.hashOfViews.get(index).get('appId');
        var view = this.hashOfViews.get(index).get('view');
        this.idArg = appId + '/*/' + view;        
        global.open($H({
            app: {
                appId: appId,
                tabId: this.options.tabId,
                view: view
            },
            hashOfViews: this.hashOfViews,
            viewsLoaded: this.viewsLoaded,
            idArg: this.idArg            
        }));
    },
    close: function ($super) {
        $super();
    }
});
