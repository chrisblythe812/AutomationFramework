/** 
* @fileOverview createBusinessArea.js
* @description File containing class createBusinessArea. 
* Application for Maintain in OM.
*/

/**
*@constructor
*@description Class createBusinessArea.
*@augments getContentDisplayer 
*/
var createBusinessArea = Class.create(getContentDisplayer, {
    /*
    *@method initialize
    *@param $super: the superclass: getContentDisplayer
    *@desc instantiates the app
    */
    initialize: function($super, args) {
        $super(args);
    },
    /*
    *@method run
    *@param $super: the superclass: getContentDisplayer
    */
    run: function($super, args) {
        //buttons 
        var buttonsHandlers = $H({
            cancel: function() {
                global.goToPreviousApp();
            } .bind(this),
            APP_OM_SAVE: function() { this.saveScreen('APP_OM_SAVE'); } .bind(this),
            SCR_OM_DESC: function() { this.showDetails('SCR_OM_DESC'); } .bind(this)
        });
        args.set('buttonsHandlers', buttonsHandlers);
        $super(args);
    },
    /*
    * @method showDetails
    * @desc called to show details after clicking the button
    */
    showDetails: function(action) {
        var screen, secScreen;
        //get the screen asociated to the action
        var screenButtons = objectToArray(this.fp.json.EWS.o_screen_buttons.yglui_str_wid_button);
        var screenButtonsSize = screenButtons.size();
        for (var i = 0; i < screenButtonsSize; i++) {
            if (screenButtons[i]['@action'] == action) {
                screen = screenButtons[i]['@screen'];
            }
        }
        //get the secondary screen to show
        var screenWidgets = objectToArray(this.fp.json.EWS.o_widget_screens.yglui_str_wid_screen);
        var screenWidgetsSize = screenWidgets.size();
        for (var i = 0; i < screenWidgetsSize; i++) {
            if (screenWidgets[i]['@secondary'] == screen) {
                secScreen = screenWidgets[i]['@screen'];
            }
        }
        //display the secondary screen
        this.fp.displaySecondaryScreens(secScreen);
    },
    /*
    * @method saveScreen
    * @desc called to save the information of the screen after clicking button
    */
    saveScreen: function(action) {
        var labelTag;
        //get the label tag asociated 
        var screenButtons = this.fp.json.EWS.o_screen_buttons.yglui_str_wid_button;
        for (var i = 0; i < screenButtons.size(); i++) {
            if (screenButtons[i]['@action'] == action) {
                labelTag = screenButtons[i]['@label_tag'];
            }
        }
        //save information
        this.saveRequest(action, labelTag);
    },
    /*
    * @method saveRequestAnswer
    * @desc answer from SAP when a saving request has been done
    */
    saveRequestAnswer: function(answer) {
        this.goBackAndRefresh();
        //show message from sap
        if (answer.EWS.messages.item['#text'])
            this._infoMethod(answer.EWS.messages.item['#text']);
        //update Pending Request left menu.
        document.fire('EWS:refreshPendingRequest');
    },
    /*
    * @method close
    * @desc called when the application is not shown.
    */
    close: function($super) {
        $super();

    }
});