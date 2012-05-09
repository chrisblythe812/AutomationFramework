/**
 * @fileoverview historyManager.js
 * @desc code needed to enable the browser navigation buttons
 */

/*takes care of the history,back and forward*/
window.dhtmlHistory.create({
    toJSON: function(o) {
        
        return Object.toJSON(o);
    },
    fromJSON: function(s) {
        
        return s.evalJSON();
    }
});
var historyManager = Class.create({
    /**
     * Will be true if the first openapplication has happened, false in
     * any other case. It's used because of the diff between IE and FF
     * @type boolean
     */
    firstTimeHistoryChange: false,
	initialize: function(){
	    /*
	    since there are some differences between IE and FF, 
	    we need to try first to let the dhtmlHistory open the application in it's method "addListener".
	    If that does not work, we'll try it manually.
	    */
	    dhtmlHistory.initialize();
        dhtmlHistory.addListener(this.onHistoryChange.bind(this));
        
        //get the default app from the URL
        var firstApp = getURLParam('app');
        //open the default application
        if(firstApp){   
            if (!this.firstTimeHistoryChange) { // we'll only open the first application if the history manager did not open it yet. (due to diff FF and IE)
                    global.open($H({
        		        app: {
        			        appId: firstApp
        		        }
        	        }));            
            }             
        }else{
        	global.open();
        }
	},
    /**
     * Handle the application opening by adding this applicationto the
     * application history
     * @param event {Event} a EWS:openApplication event
     */
    openApplication: function(args) {
        var app = args.app;
        var mode = args.mode;
        if(Prototype.Browser.WebKit){
           dhtmlHistory.waitTime = 600;    
        }
        var storeInHistory = global.tabid_applicationData.find(function(application) {
            return application.value.applications.first().appId == app;
        });
        if (app && !mode && !Object.isEmpty(storeInHistory)) {
            var string = "app="+app;
//            Add the app just opened to the history
            dhtmlHistory.add(string,app);  
        }
	},
    /**
     * Handles the history change when the back-next buttons are clicked in the
     * browser.
     * @param newLocation {String} the application to open in the url format
     * @param historyData {String} the application to open
     */
    onHistoryChange: function(newLocation, historyData) {
        if(historyData){
            this.firstTimeHistoryChange = true; //indicates wheter the first time the history change event has happened yes or no. 
            global.open($H({
                app: {
                    appId: historyData
                }
                }));
            }
        }
});