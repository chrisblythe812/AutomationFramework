
/**
* @fileoverview rightPanels.js
* @description here are the definition of the right panel itself 
*/
/**
* @constructor rightPanels
* @description Handles the right panel.
*/
var rightPanels = Class.create({

    //Defining the class names for the right panels
    panelsClassNames: $H({
        RP_CALEN: { 'jsClass': 'miniCal_RP', 'jsFile': ['standard/FWK/rightPanel/miniCal_RP.js', 'modules/miniCalendar/miniCalendar.js'] },
        RP_INBOX: { 'jsClass': 'inbox_RP', 'jsFile': ['standard/FWK/rightPanel/inbox_RP.js', 'modules/tableKitV2/tableKitV2.js'] }
    }),


    /**
    * @initialize Initializing the javaScript class
    * @description Handles the right panel.
    */
    initialize: function() {
        this.panelsId = objectToArray(global.rightPanels.yglui_str_wid_attributes);
        this.container = $('fwk_8');
        var rightPanelTitle = new Element('div', { 'class': 'rightPanel_tile tabs_title test_widget_text' }).insert(global.getLabel('myColaboration'));
        $('rightMenuTitle').insert(rightPanelTitle);
        this.widgets = $H();
        this.panelsInstances = $H();
        this.getPanels();
    },

    /**
    * @getPanels get the files name
    * @description Getting the needed files names to download.
    */
    getPanels: function() {
        var fileList = $A();
        for (var i = 0; i < this.panelsId.length; i++) {
            var appId = this.panelsId[i]['@appid'];
            if (!Object.isEmpty(this.panelsClassNames.get(appId))) {
                var fileNames = objectToArray(this.panelsClassNames.get(appId).jsFile);
                for (var j = 0; j < fileNames.length; j++) {
                    if (!fileList.include(fileNames[j])) {
                        fileList.push(fileNames[j]);
                    }
                }
            }
        }
        this.downloadPanelsFiles(fileList);
    },

    /**
    * @downloadPanelsFiles Download the files for the right panel
    * @description Downloading only the needed files to build each right panel
    * @param fileList Array with the files names.
    */
    downloadPanelsFiles: function(fileList) {
        if (fileList.size() != 1) {
            $LAB
				.toBODY()
				.script(fileList.first())
				.block(this.downloadPanelsFiles.bind(this, fileList.without(fileList.first())));
        } else {
            $LAB
				.toBODY()
				.script(fileList.first())
				.block(this.buildPanelsContainers.bind(this));
        }
    },

    /**
    * @downloadPanelsFiles Build the panels containers 
    * @description Build the html needed to contain each panel
    */
    buildPanelsContainers: function() {
        for (var i = 0; i < this.panelsId.length; i++) {
            var widContainer = new Element('div');
            this.container.insert(widContainer);
            var appId = this.panelsId[i]['@appid'];
            var color = this.panelsId[i]['@color'];
            var collapsed = this.panelsId[i]['@collapsed'];
            if (Object.isEmpty(collapsed))
                var coll = false;
            else
                var coll = true;

            var title = global.getLabel(appId);
            var objOptions = $H({
                title: title,
                collapseBut: true,
                contentHTML: '',
                onLoadCollapse: coll,
                targetDiv: widContainer,
                color: color
            });
            var myWidget = new unmWidget(objOptions);
            this.widgets.set(appId, myWidget);
        }

        this.initializePanels();
    },

    /**
    * @initializePanels Initialize each panel class
    * @description Create each new JavaScript class for each panel
    */
    initializePanels: function() {
        for (var i = 0; i < this.panelsId.length; i++) {
            var appId = this.panelsId[i]['@appid'];
            if (!Object.isEmpty(this.panelsClassNames.get(appId))) {
                var classInstance = this.panelsClassNames.get(appId).jsClass;
                this.panel = this.widgets.get(appId);
                this.panelsInstances.set(appId, new window[classInstance](this.panel));
            }
        }
    }
});