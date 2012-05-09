/**
*@fileoverview firstRequest.js
*@desc GET_USER_OPTIONS asked in advanced, and when DOM ready and the SAP respond too, we create
*all the applications objects, plus topMenu, leftMenus, and takeRoleOf
*/
var Start = Class.create(origin, {
    /**
    * Tells if the FWK buttons have been added
    * @param {Object} $super
    */
    buttonsAdded: false,
    /**
    * @lends Start
    */
    initialize: function($super) {
        $super();
        //Load the customer URL before loading GET_USETTINGS if there's a customer
        document.observe("dom:loaded", this.domLoaded.bindAsEventListener(this));
        //if we have to wait to read the population from a different service
        document.observe("EWS:populationReady", this.load.bindAsEventListener(this));
        //Call getUsettings
        this.getUSettings();

    },
    /**
    * Calls getUSettings service, if it success it goes to getUSettingsLoaded
    */
    getUSettings: function() {
        var usettingsJSON = {
            EWS: {
                SERVICE: "GET_USETTINGS",
                LABELS: {
                    item: ['FWK', 'SC', 'TM', 'PFM', 'WA', 'SCM', 'REPT', 'REP', 'RC', 'SCC']
                }
            }
        };
        var xotree = new XML.ObjTree();
        var xml = xotree.writeXML(usettingsJSON);
        this.makeAJAXrequest($H({
            xml: xml,
            successMethod: this.getUSettingsLoaded.bind(this)
        }));
        //Stop observing the window load so we don't ask get_usettings more than once
        this.getUSettingsBinding = Prototype.emptyFunction();
    },
    /**
    * Called when data from getUSettings service is received
    * @param {Object} data Data received from the service
    */
    getUSettingsLoaded: function(data) {
        global = new Global(data);
        this.json = data;
        //Load customer CSS
        //var customer = getURLParam("customer");

        if (!Object.isEmpty(global.customer) && !Object.isEmpty(global.readCustomerFolder)) {
            var hrefCssCustomer = "customer/" + global.customer + "/customer.css";
            loadCSS(hrefCssCustomer);
        }
        //this.getUSettingsReady = true;
        this.updateFrameworkButtons();
        this.load();
    },
    /**
    * Called when dom has been loaded. Now we can load the essential files
    */
    domLoaded: function() {
        this.domReady = true;
        //Adding a class to the body to control the right panel
        if (rightPanel && (rightPanel == true || rightPanel == "true"))
            $(document.body).addClassName('rightPanel');
        //Adding framework buttons that are necessary before loading applications
        this.addFrameworkButtons();
        //Download files
        if (liteVersion)
            var fileList = LITE_VERSION_FILES;
        else
            var fileList = NORMAL_VERSION_FILES;
        this.downloadInitialFiles(fileList);
    },
    /**
    * Called when the essential files have been loaded
    */
    filesLoaded: function() {
        this.filesReady = true;
        this.load();
    },
    /**
    * Waits for the domloaded event, the loading of essential files and the response from getUsettings service
    */
    load: function() {
        if (this.filesReady && global && global.usettingsLoaded && this.domReady) {
            document.fire("EWS:firstRequestLoaded");
            this.loadEWS();
        }
    },

    /**
    * Download all the files needed at the beggining
    * When ready, call to loadEWS to load all the EWS components
    * @param fileList {array} with all the files needed at the beggining.
    */
    downloadInitialFiles: function(fileList) {
        if (fileList.size() != 1) {
            $LAB
				.toBODY()
				.script(fileList.first())
				.block(this.downloadInitialFiles.bind(this, fileList.without(fileList.first())));
        } else {
            $LAB
				.toBODY()
				.script(fileList.first())
				.block(this.filesLoaded.bind(this));
        }
    },
    /**
    * Waits till all the files are download
    * able to create all the EWS needed objects
    */
    loadEWS: function() {
        //Showing the principal container
        $('AppContainer').removeClassName('hidden');
        //removing the withe background in the html
        $('htmlMasterElement').id = 'htmlMasterElementWithBG';
        //Adding the copyRight Text
        var firstPartOfCopyright = global.getLabel('copyRight');
        var secondPartOfCopyright = global.getLabel('rightsReserved');
        var northGateLink = new Element("a", {
            "href": "http://www.northgatearinso.com/",
            "target": "_blank",
            "class": "application_action_link"
        });
        northGateLink.insert("NorthgateArinso");
        firstPartOfCopyright += " ";
        secondPartOfCopyright = ". " + secondPartOfCopyright;
        var fwk_copyRight = $('fwk_copyRight');
        fwk_copyRight.insert(firstPartOfCopyright);
        fwk_copyRight.insert(northGateLink);
        fwk_copyRight.insert(secondPartOfCopyright);

        //if DOM is ready and the user options set, we can continue creating the applications objects
        if (global.usettingsLoaded && this.domReady && Object.isEmpty(global.readCustomerFolder)) {
            this.createObjects();
        } else if (global.usettingsLoaded && this.domReady) {
            var customer = global.customer;
            var filesToLoad = [];
            filesToLoad.push("customer/" + customer + "/url.js");
            filesToLoad.push("customer/" + customer + "/customer.js");
            this.loadCustomerJS(filesToLoad);
        }
        this.loadMessages();
    },
    loadMessages: function() {
        var usettingsJSON = {
            EWS: {
                SERVICE: "GET_INFO_MES"
            }
        };
        var xotree = new XML.ObjTree();
        var xml = xotree.writeXML(usettingsJSON);
        this.makeAJAXrequest($H({
            xml: xml,
            successMethod: this.loadMessagesSuccess.bind(this)
        }));
    },
    loadMessagesSuccess: function(json) {
        var a = 0;
    },

    loadCustomerJS: function(fileList) {
        if (fileList.size() != 1) {
            $LAB
				.toBODY()
				.script(fileList.first())
				.block(this.loadCustomerJS.bind(this, fileList.without(fileList.first())));
        } else {
            $LAB
				.toBODY()
				.script(fileList.first())
				.block(global.mergeFiles.bind(this));
        }
    },

    /**
    * Adds buttons to print and help and the logo
    */
    addFrameworkButtons: function() {
        if (!this.buttonsAdded) {
            var helpPrintContainer = $('fwk_printHelpContainer');
            this.printButton = new Element("button", {
                "id": "fwk_print",
                "class": "test_topMenu application_main_toolbox"
            });
            this.helpButton = new Element("button", {
                "id": "help_button",
                "class": "test_topMenu application_main_help"
            });
            var logoButton = new Element("button", {
                "id": "logoButton",
                "class": "application_Banner application_handCursor"
            }).hide();
            if (liteVersion) {
                this.printButton.innerHTML = "Print";
                this.printButton.addClassName("link");
                this.helpButton.innerHTML = "Help";
                this.helpButton.addClassName("link");
                var textLogo = new Element("div", {
                    "id": "fwk_textLogo"
                }); //.insert(global.getLabel("liteLogo")/*"eu<span class='HRLetters'>HR</span>eka"*/);
                logoButton.insert(textLogo);
            }
            helpPrintContainer.insert(this.printButton);
            helpPrintContainer.insert(this.helpButton);
            $('fwk_4').update(logoButton);

            var URL = document.location.protocol + "//";
            URL += document.location.host;
            URL += document.location.pathname;
            URL += document.location.search;

            logoButton.observe("click", function() {
                document.location.href = URL;
            });
            //logoButton.focus();
            this.buttonsAdded = true;
        }
    },
    /**
    * Function called to update the labels of the framework buttons when we have global object:
    */
    updateFrameworkButtons: function() {
        if (!this.buttonsAdded) {
            this.addFrameworkButtons();
        }
        if (liteVersion) {
            var logoliteVersion = this.colorHRLiteLogo(global.getLabel("liteLogo"));
            $("fwk_textLogo").insert(logoliteVersion);
        }
        var updatedLogoButton = $("logoButton");
        updatedLogoButton.show();
        //updatedLogoButton.focus();

        if (global.liteVersion) {
            this.printButton.innerHTML = global.getLabel("print");
            this.printButton.writeAttribute("title", global.getLabel("print"));
            this.helpButton.innerHTML = global.getLabel("help");
            this.helpButton.writeAttribute("title", global.getLabel("help"));
        }
        this.printButton.observe("click", global.showToolBox.bindAsEventListener(global));
    },
    /**
    * Function called to color HR characters in logo in lite version
    */
    colorHRLiteLogo: function(litelogo) {
        if (litelogo == "euHReka") {
            litelogo = litelogo.replace("HR", "<span class='HRLetters'>HR</span>");
            return litelogo;
        } else {
            return litelogo;
        }
    },
    /**
    * Creates all EWS needed objects
    */
    createObjects: function() {
        $('loadingDiv').update('&nbsp;&nbsp;' + global.getLabel('loading') + '&nbsp;&nbsp;');
        global.topMenu = new appNavigation(); //Navigation Menu handler Object
        global.leftMenu = new MenusHandler(); //Left Menus Handler Object
        if (rightPanel && (rightPanel == true || rightPanel == "true"))
            global.rightPanel = new rightPanels(); //right Panel Handler Object
        global.takeRoleApplication = new takeRoleOf(); //takeRoleOf Application                              
        global.historyManager = new historyManager(); // the history manager will take care of the app in the URL -> this solves a bug

        //Launch the init apps, they are stored in global.INIT_APPS,
        //and its .js files must have been loaded in index.html
        var initAppKeys = global.INIT_APPS.keys();
        for (var i = 0; i < initAppKeys.size(); i++) {
            global.initializeApplicationByAppId(initAppKeys[i]);
        }
        this.createObjectsBinding = Prototype.emptyFunction();
    }
});
/**
 * Function to load CSS Files
 * @param {Object} href
 */
function loadCSS(href) {
    var CSS = new Element("link", {
        "rel": "stylesheet",
        "type": "text/css",
        "href": href
    });

    $$("head")[0].insert(CSS);
}
//Get if we are in lite version from the URL
var liteVersion = getURLParam('light');
var rightPanel = getURLParam('right');
//Load the CSS files we want
loadCSS("css/CSSFWK.css");
loadCSS("css/CSS2.css");
loadCSS("css/CSS2b.css");
if (Prototype.Browser.IE && parseInt(navigator.userAgent.substring(navigator.userAgent.indexOf("MSIE") + 5)) == 6) {
    loadCSS("css/CSS2_IE6.css");
}else if (Prototype.Browser.IE && parseInt(navigator.userAgent.substring(navigator.userAgent.indexOf("MSIE") + 5)) == 7) {
    loadCSS("css/CSS2_IE7.css");
}else if (Prototype.Browser.IE && parseInt(navigator.userAgent.substring(navigator.userAgent.indexOf("MSIE") + 5)) == 8) {
    loadCSS("css/CSS2_IE7.css");
}
if (liteVersion === "true") {
    liteVersion = true;
	//If we are in liteVersion
	loadCSS("Lite/css/CSSLite.css");
}else{
	liteVersion = false;
}

// Initialize the encoding library
Base.esapi.properties.application.Name = "eWS 2.0";
// Initialize the api
org.owasp.esapi.ESAPI.initialize();
var starter = new Start();

document.observe("EWS:customerFilesLoaded", function() {
    starter.createObjects();
});

