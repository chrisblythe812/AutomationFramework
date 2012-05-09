
var LOGOFF = Class.create(Application, {
    //It checks if the user is working each 60 seconds
    secs: 60,
    //Initial date of the user log on
    initialDate: new Date(),
    /**
    *@description Fires when the user do something in the application
    *@@param args The app
    */
    initialize: function($super, args) {
        $super(args);
        Ajax.Responders.register({
            onCreate: function() {
                //update the initial date because the user has done something in the application
                this.initialDate = new Date();
            } .bind(this)
        });
        this.iniTimeOut();
    },

    /**
    * @param args The app
    * @param $super The superclass run method
    * @description Executes the super class run method    
    */
    run: function($super, args) {
        $super(args);
        this.createHtml();
    },

    /**
    *@description Creates a periodicalExecuter. Checks each minute if the user is working in the application
    */
    iniTimeOut: function() {
        var timer = new PeriodicalExecuter(
                        function timeExpired(timer) {
                            var actualDate = new Date();
                            var diffDates = ((actualDate.getHours() * 3600) + (actualDate.getMinutes() * 60) + (actualDate.getSeconds())) - ((this.initialDate.getHours() * 3600) + (this.initialDate.getMinutes() * 60) + this.initialDate.getSeconds());
                            if (diffDates > global.logOffTime) {
                                timer.stop();
                                this.timeExpired();
                            }
                            else if (diffDates > (global.logOffTime - 180)) {
                                this.showPreviousMessage();
                            }
                        } .bind(this),
                        this.secs
                    );
    },

    showPreviousMessage: function() {
        if (Object.isEmpty(this.extendPopup)) {
            if ($('idDivInfoPopUpContainer')) {
                $('idDivInfoPopUpContainer').remove();
                global.currentPopUp = null;
            }
            var mesDiv = new Element('div', { 'class': 'logOff_extendSession' }).insert(global.getLabel('extendSession'));
            var contentHTML = new Element("div").insert(mesDiv);
            var buttonsJson = {
                mainClass: 'logOffButtons',
                elements: []
            };
            var buttonYes = {
                idButton: 'extend_yesButton',
                label: global.getLabel('yes'),
                className: 'buttonMarginRightCss',
                handlerContext: null,
                handler: this.extendSession.bind(this),
                type: 'button',
                standardButton: true
            }
            var buttonNo = {
                idButton: 'extend_NoButton',
                label: global.getLabel('no'),
                className: 'buttonMarginRightCss',
                handlerContext: null,
                handler: this.buttonClickedYes.bind(this),
                type: 'button',
                standardButton: true
            }
            buttonsJson.elements.push(buttonYes);
            buttonsJson.elements.push(buttonNo)
            var buttonsDisplayer = new megaButtonDisplayer(buttonsJson);
            contentHTML.insert(buttonsDisplayer.getButtons());
            this.extendPopup = new infoPopUp({
                closeButton: $H(
                { 'callBack': function() {
                    this.extendPopup.close();
                    delete this.extendPopup;
                }
                }),
                htmlContent: contentHTML,
                indicatorIcon: 'exclamation',
                width: 600,
                showCloseButton: false
            });
            this.extendPopup.create();
        }
    },

    extendSession: function() {
        var logOffXml = "<EWS><SERVICE>KEEP_ALIVE</SERVICE></EWS>";
        this.makeAJAXrequest($H({
            xml: logOffXml,
            successMethod: this.closeExtendPopUp.bind(this)
        }));
    },

    closeExtendPopUp: function() {
        this.extendPopup.close();
        delete this.extendPopup;
    },

    /**
    *@description Shows a message and 2buttons to confirm the log off
    */
    createHtml: function() {
        var div = new Element('div', { 'id': 'containerButtonsId', 'class': 'containerButtonsCss' });
        this.virtualHtml.update(div);
        var messageLogOff = new Element('div', { 'id': 'messageLogOffId', 'class': 'messageLog' });
        messageLogOff.insert(global.getLabel('confirmLogoff'));
        div.insert(messageLogOff);
        var buttonsJson = {
            mainClass: 'logOffButtons',
            elements: []
        };
        var button_Yes = {
            idButton: 'btn_Yes',
            label: global.getLabel('yes'),
            className: 'buttonMarginRightCss',
            handlerContext: null,
            handler: this.buttonClickedYes.bind(this),
            type: 'button',
            standardButton: true
        }
        buttonsJson.elements.push(button_Yes);
        var button_No = {
            idButton: 'btn_No',
            label: global.getLabel('no'),
            className: 'logOffButtons',
            handler: this.closePopUp.bind(this),
            handlerContext: null,
            type: 'button',
            standardButton: true
        }
        buttonsJson.elements.push(button_No);
        var buttonOpenWiz = new megaButtonDisplayer(buttonsJson);
        div.insert(buttonOpenWiz.getButtons());
    },

    /**
    * Function called when the timer has expired
    */
    timeExpired: function(firstCall) {
        //++ NICOLASL - When the user logoff, logoff also the HRW connection if it exist
        if (hrwEngine && hrwEngine.isConnected()) {
            if (Object.isEmpty(firstCall)) hrwEngine.logout();
            setTimeout(function() { this.timeExpired(false); } .bind(this), 1000);
            return;
        }
        //-- NICOLASL
        var logOffXml = "<EWS><SERVICE>CLEAR_SESSION</SERVICE><PARAM><SSO>CLEAR</SSO><AREA/></PARAM></EWS>";
        this.makeAJAXrequest($H({
            xml: logOffXml,
            successMethod: this.showLoggedOffScreen.bind(this)
        }));
    },
    /**
    * After being logged off, show a screen with information about that. Then 
    */
    showLoggedOffScreen: function() {
        if ($('idDivInfoPopUpContainer')) {
            $('idDivInfoPopUpContainer').remove();
            global.currentPopUp = null;
        }
        var contentHTML = new Element("div").insert(global.getLabel('loggedOff'));
        var buttonsJson = {
            mainClass: 'logOffButtons',
            elements: []
        };
        var buttonOk = {
            idButton: 'logOff_okButton',
            label: global.getLabel('ok'),
            className: 'buttonMarginRightCss',
            handlerContext: null,
            handler: this.redirectToHome.bind(this),
            type: 'button',
            standardButton: true
        }
        buttonsJson.elements.push(buttonOk);
        var buttonsDisplayer = new megaButtonDisplayer(buttonsJson);
        contentHTML.insert(buttonsDisplayer.getButtons());
        var popup = new infoPopUp({
            closeButton: $H(
                { 'callBack': function() {
                    popup.close();
                    delete popup;
                }
                }),
            htmlContent: contentHTML,
            indicatorIcon: 'exclamation',
            width: 600,
            showCloseButton: false
        });
        popup.create();
    },
    /**
    * Redirects to home page
    */
    redirectToHome: function() {
        var protocol = window.location.protocol;
        var host = window.location.host;
        var folder = window.location.pathname.gsub('/index.html', '');
        if (!__hostName.include('proxy')) {
            url = protocol + '//' + host + global.redirectURL;
        }
        else {
            url = protocol + '//' + host + folder + __logOnUrl;
        }
        window.location = url;
    },
    /**
    *@description Log off and return to the homepage.
    */
    buttonClickedYes: function(firstCall) {
        //++ NICOLASL - When the user logoff, logoff also the HRW connection if it exist
        if (hrwEngine && hrwEngine.isConnected()) {
            if (Object.isEmpty(firstCall)) hrwEngine.logout();
            setTimeout(function() { this.buttonClickedYes(false); } .bind(this), 1000);
            return;
        }
        //-- NICOLASL
        var logOffXml = "<EWS><SERVICE>CLEAR_SESSION</SERVICE><PARAM><SSO>CLEAR</SSO><AREA/></PARAM></EWS>";
        this.makeAJAXrequest($H({
            xml: logOffXml,
            successMethod: this.closePopUp.bind(this)
        }));
    },

    /**
    *@description Close the current page
    */
    closePopUp: function(json) {
        this.close();
        if (!Object.isEmpty(this.popUpApplication)) {
            this.popUpApplication.close();
            delete this.popUpApplication;
        }
        if (!Object.isEmpty(json) && json.EWS.messages) {
            var messageType = json.EWS.messages.item['@msgty'];
            if (messageType == 'S')
                this.redirectToHome();
        }
    },

    /**
    *@description Closes the application
    *@param $super The superclass: logOff
    */
    close: function($super) {
        $super();
    }
});