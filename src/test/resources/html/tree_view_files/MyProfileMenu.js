/**
* @constructor FastEntryMenu
* @description Implements Fast Entry menu.
* @augments EmployeeMenu
*/

var MyProfileMenu = Class.create(EmployeeMenu,
/**
* @lends MyProfileMenu
*/
    {
    getObjectId: 'RC_GET_OBJECT',                   //  @type String, Service used to get object type and number
    getContentService: 'GET_CONTENT2',              //  @type String, Service used to get the content of a fieldset
    loadingDiv: null,                               //  @type object, loading and error container of the widget
    isExpanded: true,                              //  @type boolean, set to false to firstly expand the content
    loadedFirstTime: true,                          // @type boolean, to load only once the menu (it will be reloaded when needed)
    
    /**
    *@param $super The superclass MyProfileMenu
    *@param args The app
    *@description Instantiates the menu
    */
    initialize: function($super, id, options) {
        $super(id, options);
        //Defining the variables
        this.menuAppId = this.menuId;
        this.changeTitle(global.getLabel("My_Profile"));
    },

    /**
    * Will show the menu in the corresponding place.
    * @param {Object} $super parent class method, is passed automatically.
    * @param {Object} element where to show the menu. is passed automatically by the MenusHandlers class
    */
    show: function($super, element) {
        $super(element);

        //we make the ajax request to sap
        this.getObject();
    },

    /**
    *@description gets the object type to use it within the call to getwidgets
    */
    getObject: function() {
        // create the XML
        var xml = "<EWS>"
                    + "<SERVICE>" + this.getObjectId + "</SERVICE>"
            + "</EWS>";
        //Requesting the data
        // call the ajax request
        this.makeAJAXrequest($H({
            xml: xml,
            successMethod: this._functionObjectOK.bind(this),
            errorMethod: this._showErrorService.bind(this)
        }));
    },

    /**
    *@description executed when is 
    */
    _functionObjectOK: function(json) {
        // creating variables of class with the NA object
        this.rcObjectType = json.EWS.o_object['@otype'];
        this.rcObjectNumber = json.EWS.o_object['@objid'];
        
        // call to sap to get the content of the menu
        this._getWidgetContent();
    },

    /**
    * @description: it will reload the content of the menu
    */
    reloadContent: function(){
        this.widget.getContentElement().update();
        this._getWidgetContent();
    },

    /**
    * @description Gets the widgets content
    * @param appId The widget ID
    * @param widScreen The widscreen
    * @param selectedIndex The selected index
    */
    _getWidgetContent: function() {
        // This is for drawing the 'loading...' text while is loading the content of the menu
        if (this.loadingDiv == null) {
            this.loadingDiv = new Element('div', { 'id': 'rc_divLoadingLeftMenu', 'class': 'inlineElement' });
            this.loadingDiv.insert(global.getLabel('loading') + '...');
        }
        else
            this.loadingDiv.update(global.getLabel('loading') + '...');
        
        this.widget.getContentElement().insert(this.loadingDiv);
        this.widget.getContentElement().insert("&nbsp;");

        //Forming the XML in
        var xml = "<EWS>"
            + "<SERVICE>" + this.getContentService + "</SERVICE>"
            + "<OBJ TYPE='" + this.rcObjectType + "'>" + this.rcObjectNumber + "</OBJ>"
            + "<PARAM>"
                + "<APPID>" + this.menuAppId + "</APPID>"
            + "<WID_SCREEN>*</WID_SCREEN>"
            + "</PARAM>"
            + "</EWS>";
        //Requesting the data
        this.makeAJAXrequest($H({
            xml: xml,
            successMethod: this._parseWidgetContent.bind(this),
            errorMethod: this._showErrorService.bind(this),
            cache: false
        }));
    },
    
    /**
    * @description show an error text message if any service fails
    */
    _showErrorService: function() {
        if (!Object.isEmpty(this.loadingDiv))
            this.loadingDiv.update(global.getLabel('error_service'));
    },

    /**
    * @description Parses the widget content service
    * @param xml The XML out
    * @param appId The identificator of the AJAX call
    */
    _parseWidgetContent: function(json) {
        var arrayFields = new Array();
        var arrayValues = new Array();
        var arrayTechNames = new Array();
        var idFields = new Array();
        var hiddenFields = new Array();
        var finalTextDate = null;
        var lastUpdateDate = null;
        var scoreCompleteNess = 0;
        var lengthArray = json.EWS.o_field_settings.yglui_str_wid_fs_record.fs_fields.yglui_str_wid_fs_field.length;
        var fields = json.EWS.o_field_settings.yglui_str_wid_fs_record.fs_fields.yglui_str_wid_fs_field;
        var values = json.EWS.o_field_values.yglui_str_wid_record.contents.yglui_str_wid_content.fields.yglui_str_wid_field;
        var labels = json.EWS.labels.item;

        // we get the fieldid, fieldtechname and the values for each field according with the order in seqnr
        for (j = 0; j < lengthArray; j++) {
            for (k = 0; k < lengthArray; k++)
                if (parseInt(fields[k]['@seqnr'], 10) == (j + 1)) {
                idFields[j] = values[k]['@fieldid'];
                arrayTechNames[j] = values[k]['@fieldtechname'];
                arrayValues[j] = values[k]['#text'];
                if (fields[k]['@display_attrib'] == 'HID')
                    hiddenFields[j] = true;
                else
                    hiddenFields[j] = false;
                break;
            }
        }

        // we get the labels that we will show in the left side of the menu
        if (!Object.isEmpty(json.EWS.labels)) {
        var lengthLabels = json.EWS.labels.item.length;
        for (j = 0; j < arrayTechNames.length; j++) {
            for (k = 0; k < lengthLabels; k++) {
                if (labels[k]['@id'] == idFields[j]) {
                    arrayFields[j] = labels[k]['@value'];
                    break;
                }
                else 
                  arrayFields[j]=global.getLabel(idFields[j]);       
                }
            }
        }

        // If there is any problem it could be because I need to change arrayTechNames to idFields
        var mainDivContainer = new Element('div', { 'id': 'rc_my_profile_container', 'class':'inlineContainer'});

    // TOP container 
        var topContainer = new Element('div', { 'id': 'rc_topContainer', 'class': 'inlineContainer' });
        mainDivContainer.insert(topContainer);

            // creating auxiliar containers
        var leftTopDivContainer = new Element('div', { 'id': 'rc_basicInformation', 'class': 'application_text_bolder RC_title inlineElement' });
        var rightTopGraphicDiv = new Element('div', { 'id': 'rc_graphicDiv', 'class': 'inlineElementRight RC_graphic' });
            // inserting them
        topContainer.insert(leftTopDivContainer);
        topContainer.insert(rightTopGraphicDiv);
        
    // DOWN container
        var downContainer = new Element('div', { 'id': 'rc_downContainer', 'class':'inlineContainer'});
        mainDivContainer.insert(downContainer);
        
            // creating auxiliar containers
        this.basicInformationDiv = new Element('div', { 'id': 'rc_basicInformation', 'class': 'FWK_EmptyDiv' });
        this.restOfInformationDiv = new Element('div', { 'id': 'rc_restInformation', 'class': 'FWK_EmptyDiv' });
        this.lupdateInformationDiv = new Element('div', { 'id': 'rc_lupdateInformation', 'class': 'FWK_EmptyDiv' });
        
            // inserting them
        downContainer.insert(this.basicInformationDiv);
        downContainer.insert(this.restOfInformationDiv);
        downContainer.insert(this.lupdateInformationDiv);
    
    // BUTTONS container
        this.buttonsDiv = new Element('div', { 'id': 'rc_downButtonsContainer', 'class':'FWK_EmptyDiv RC_select_margin_top' });
        mainDivContainer.insert(this.buttonsDiv);
        
        
    // ****** Setting the container ****** //
        
        var basicDiv = true;
        // filling the content of the left menu
        for (j = 0; j < lengthArray; j++) {
            var divAux = new Element('div', { 'id': 'rc_div_' + arrayTechNames[j], 'class': 'inlineContainer' });
            if (hiddenFields[j] == true) {
                switch (arrayTechNames[j]) {
                    case 'LUPDATE':
                        finalTextDate = arrayFields[j];
                        lastUpdateDate = prepareTextToShow(arrayValues[j]);
                        break;

                    case 'COMPLETENESS':
                        scoreCompleteNess = prepareTextToShow(arrayValues[j]);
                        break;
                }
            }
            else {
                if(j<=2) { // these fields have not labels and they are going to be displayed with another format (bold, font size,...)
                    divAux.insert(prepareTextToShow(arrayValues[j]));
                    leftTopDivContainer.insert(divAux);
                }
                else {  // these fields have labels and values, they are shown under the separator line
                    // after these fields we add a line
                    if (j == 3) {   
                        var divLine = new Element('div', { 'id': 'rc_divLine', 'class': 'RC_draw_line' });
                        this.basicInformationDiv.insert(divLine);
                    }
                    // inserting in the correct container
                    if(basicDiv)
                        this.basicInformationDiv.insert(divAux);
                    else
                        this.restOfInformationDiv.insert(divAux);
                    var divLabel = new Element('div', { 'id': 'rc_div_Label_' + arrayTechNames[j], 'class': 'application_main_soft_text RC_left_menu_fields test_label' });
                    divLabel.insert(arrayFields[j]);
                    divAux.insert(divLabel);
                    var divValue = new Element('div', { 'id': 'rc_div_Value_' + arrayTechNames[j], 'class': 'RC_left_menu_values' });

                    // if the field is the email, we add the option to send the email and we add some classes
                    if (arrayTechNames[j] == 'EMAIL') {
                        var sendEmail = new Element('a', { 'id': 'rc_sendEmail', 'href': 'mailto:' + prepareTextToShow(arrayValues[j]) });
                        sendEmail.insert(prepareTextToShow(arrayValues[j]));
                        divValue.insert(sendEmail);
                        divValue.addClassName('application_action_link test_link');
                        divAux.addClassName('RC_left_menu_botton_separator');
                        // changing the container
                        basicDiv = false;
                    }
                    else if (arrayTechNames[j] == 'DESCRIPTION') {
                        var finalDescription = null;
                        if (arrayValues[j] != null) {
                            var contChar = arrayValues[j].length;
                            if (contChar > 256) {
                                finalDescription = prepareTextToShow(this.urlTextToLink(arrayValues[j].slice(0, 252)));
                                finalDescription = finalDescription + '...';
                            }
                            else
                                finalDescription = prepareTextToShow(this.urlTextToLink(arrayValues[j]));
                        }
                        divValue.insert(finalDescription);
                    }
                    else
                        divValue.insert(prepareTextToShow(this.urlTextToLink(arrayValues[j])));

                    divAux.insert(divValue);

                    // after this field we enter a blank space to differenciate the groups of information
                    if (arrayTechNames[j] == 'QUALIFICATIONS')
                        divAux.addClassName('RC_left_menu_botton_separator');
                }
            }
        }
        // displaying the CompleteNess graphic            
        var graphicImg = new Element('div', { 'id': 'rc_graphicImage', 'class': 'RC_pieChart RC_pieChart' + scoreCompleteNess + '_8 test_icon' });
        rightTopGraphicDiv.insert(graphicImg);
        var divPercentage = new Element('div', { 'id': 'rc_divPercentage' });
        var percentage = null;
        switch (scoreCompleteNess) {
            case '0':
                percentage = "0&nbsp;%";
                break;
            case '1':
                percentage = "12" + global.commaSeparator + "5&nbsp;%";
                break;
            case '2':
                percentage = "25&nbsp;%";
                break;
            case '3':
                percentage = "37" + global.commaSeparator + "5&nbsp;%";
                break;
            case '4':
                percentage = "50&nbsp;%";
                break;
            case '5':
                percentage = "62" + global.commaSeparator + "5&nbsp;%";
                break;
            case '6':
                percentage = "75&nbsp;%";
                break;
            case '7':
                percentage = "87" + global.commaSeparator + "5&nbsp;%";
                break;
            case '8':
                percentage = "100&nbsp;%";
                break;
        }
        divPercentage.insert(percentage);
        rightTopGraphicDiv.insert(divPercentage);

        var divPercentageText = new Element('div', { 'id': 'rc_divPercentageText' });
        divPercentageText.insert(global.getLabel("rc_completeness_profile"));
        rightTopGraphicDiv.insert(divPercentageText);
        topContainer.insert(rightTopGraphicDiv);

        // drawing the second line
        var divLine2 = new Element('div', { 'id': 'rc_divLine2', 'class': 'RC_draw_line inlineContainer' });
        this.lupdateInformationDiv.insert(divLine2);

        // we are going to work with the last update to display the text message
        if (!Object.isEmpty(finalTextDate)) {
            var divDate = new Element('div', { 'id': 'rc_divLastUpdateDate', 'class':'inlineContainer'});
        var todayDate = new Date();
        var difDate = todayDate.getTime() - Date.parseExact(lastUpdateDate, 'yyyy-MM-dd').getTime();
        lastUpdateDate = Date.parseExact(lastUpdateDate, 'yyyy-MM-dd').toString('dd.MM.yyyy');
        var lastDate = new Element('div', { 'id': 'rc_lastDate' });
            finalTextDate = finalTextDate.gsub("((LUPDATE))", lastUpdateDate);
            finalTextDate = finalTextDate.gsub("((DAYS))", Math.floor(difDate / (1000 * 60 * 60 * 24)));
            finalTextDate = finalTextDate.gsub("((CARRIAGERETURN))", '<br><br>');
            lastDate.insert(finalTextDate);
            lastDate.addClassName('RC_last_update_date application_main_soft_text RC_left_menu_botton_separator test_label');
            divDate.insert(lastDate);
            this.lupdateInformationDiv.insert(divDate);
        }
        
    // BUTTONS
        // We insert the link to expand/collapse the content of widget
        var leftButtonDiv = new Element ('div' , {'class':'inlineElement RC_align_left RC_quest_header_question'});
        this.expandCollapseButton = new Element('span', {'id': 'rc_expandCollapse','class':'application_action_link test_link'});
        this.expandCollapseButton.insert(global.getLabel('KM_SHOW_LESS'));
        this.expandCollapseButton.observe("click", this.showMoreLessContent.bind(this));
        this.buttonsDiv.insert(leftButtonDiv);
        leftButtonDiv.insert(this.expandCollapseButton);
        
        // We insert the link to My Profile
        var rightButtonDiv = new Element ('div', {'class':'inlineElementRight RC_align_right RC_quest_header_question'});
        var linkDetailedProfile = new Element('span', {
            'id': 'rc_linkMyProfile',
            'class': 'application_action_link test_link',
            'app_id': 'RC_MYPRO',
            'tab_id': 'RC_MYPRO',
            'view_id': global.currentApplication.view,
            'content_id': 'undefined'
        });
        linkDetailedProfile.insert(global.getLabel('RC_DPROFILE'));
        linkDetailedProfile.observe("click", this.openApplication.bindAsEventListener(this));
        this.buttonsDiv.insert(rightButtonDiv);
        rightButtonDiv.insert(linkDetailedProfile);
        
        // inserting all the content in the menu
        this.setPreviousState();
        this.widget.getContentElement().update(mainDivContainer);
    },
	
	/**
    * @description draw the content expanded/collapsed for the first time
    */
    setPreviousState: function() {
	    if(!this.isExpanded) {
            this.expandCollapseButton.update(global.getLabel('KM_SHOW_MORE'));
            this.restOfInformationDiv.hide();
            this.lupdateInformationDiv.hide();
        }
        else {
            this.expandCollapseButton.update(global.getLabel('KM_SHOW_LESS'));
            this.restOfInformationDiv.show();
            this.lupdateInformationDiv.show();
        }
	},
	
	/**
    * @description Expand or collapse the not basic information
    */
    showMoreLessContent: function() {
        // reset the variable
        if(this.isExpanded) {
            this.expandCollapseButton.update(global.getLabel('KM_SHOW_MORE'));
            this.restOfInformationDiv.hide();
            this.lupdateInformationDiv.hide();
            this.isExpanded = false;
        }
        else {
            this.expandCollapseButton.update(global.getLabel('KM_SHOW_LESS'));
            this.restOfInformationDiv.show();
            this.lupdateInformationDiv.show();
            this.isExpanded = true;
        }
    },

    /**
    * @description Redirect to My profile
    */
    openApplication: function(event) {
        var a = event.element();
        global.open($H({
            app: {
                appId: a.readAttribute('app_id'),
                tabId: a.readAttribute('tab_id')
            }
        }));
    },
    /**
    * @description Conversion method to create a link when there is an URL in the passed parameter
    * @param text, string with a text
    */
    urlTextToLink: function(text) {
        var aux = null;
        var aux2 = null;
        var aux3 = null;
        var quote = "'";
        var RegExPattern = "(^[h|f|g|t|n|m](ttps?|tp|opher|elnet|ile|otes|s-help):((//)|(\\\\))+[\w\d:#@%/;$()~_?\+-=\\\.&]*)";
        var RegExPattern2 = "(^(www)\.[\w\d:#@%/;$()~_?\+-=\\\.&]*)";
        text = prepareTextToShow(text);

        if (text) {            
            aux = text.split(" ");
            for (n = 0; n < aux.length; n++) {
                var auxJumpLine = aux[n].split('<br/>');
                var numJumps = auxJumpLine.length;
                if (numJumps>1) {
                    for(var i = 0; i<numJumps; i++) {
                        if (auxJumpLine[i].match(RegExPattern) && (auxJumpLine[i].value != '')) {
                            // replace the urls adding the tag 'a'
                            aux2 = auxJumpLine[i].toArray();
                            lengthAux2 = aux2.length - 1;
                            // with this control we are deleting the last character if it is any of the next
                            if (aux2[lengthAux2] == '.' || aux2[lengthAux2] == ',' || aux2[lengthAux2] == ':' || aux2[lengthAux2] == ';' || aux2[lengthAux2] == ')' || aux2[lengthAux2] == '"' || aux2[lengthAux2] == '!')
                                var newJumpLine = '<a class="application_action_link test_link" href=' + quote + auxJumpLine[i].substring(0, auxJumpLine[i].length - 1) + quote + ' target=' + quote + '_blank' + quote + ' >' + auxJumpLine[i].substring(0, auxJumpLine[i].length - 1) + '</a>' + aux2[lengthAux2];
                            else
                                var newJumpLine = '<a class="application_action_link test_link" href=' + quote + auxJumpLine[i] + quote + ' target=' + quote + '_blank' + quote + ' >' + auxJumpLine[i] + '</a>';
                        }
                        // begins with 'www.'
                        else if (auxJumpLine[i].match(RegExPattern2) && (auxJumpLine[i].value != '')) {
                            // replace the urls adding the tag 'a'
                            aux2 = auxJumpLine[i].toArray();
                            lengthAux2 = aux2.length - 1;
                            // with this control we are deleting the last character if it is any of the next
                            if (aux2[lengthAux2] == '.' || aux2[lengthAux2] == ',' || aux2[lengthAux2] == ':' || aux2[lengthAux2] == ';' || aux2[lengthAux2] == ')' || aux2[lengthAux2] == '"' || aux2[lengthAux2] == '!')
                                var newJumpLine = '<a class="application_action_link test_link" href=' + quote + 'http://' + auxJumpLine[i].substring(0, auxJumpLine[i].length - 1) + quote + ' target=' + quote + '_blank' + quote + ' >' + auxJumpLine[i].substring(0, auxJumpLine[i].length - 1) + '</a>' + aux2[lengthAux2];
                            else
                                var newJumpLine = '<a class="application_action_link test_link" href=' + quote + 'http://' + auxJumpLine[i] + quote + ' target=' + quote + '_blank' + quote + ' >' + auxJumpLine[i] + '</a>';                            
                        }
                        else
                            var newJumpLine = auxJumpLine[i];
                        
                        // sub the previous content
                        auxJumpLine[i] = newJumpLine;
                    }
                        // rebuild the original text
                    aux[n] = auxJumpLine.join('<br/>');
                }
                else {
                    if (aux[n].match(RegExPattern) && (aux[n].value != '')) {
                        // replace the urls adding the tag 'a'
                        aux2 = aux[n].toArray();
                        lengthAux2 = aux2.length - 1;
                        // with this control we are deleting the last character if it is any of the next
                        if (aux2[lengthAux2] == '.' || aux2[lengthAux2] == ',' || aux2[lengthAux2] == ':' || aux2[lengthAux2] == ';' || aux2[lengthAux2] == ')' || aux2[lengthAux2] == '"' || aux2[lengthAux2] == '!')
                            aux[n] = '<a class="application_action_link test_link" href=' + quote + aux[n].substring(0, aux[n].length - 1) + quote + ' target=' + quote + '_blank' + quote + ' >' + aux[n].substring(0, aux[n].length - 1) + '</a>' + aux2[lengthAux2];
                        else
                            aux[n] = '<a class="application_action_link test_link" href=' + quote + aux[n] + quote + ' target=' + quote + '_blank' + quote + ' >' + aux[n] + '</a>';
                    }
                    // begins with 'www.'
                    else if (aux[n].match(RegExPattern2) && (aux[n].value != '')) {
                        // replace the urls adding the tag 'a'
                        aux2 = aux[n].toArray();
                        lengthAux2 = aux2.length - 1;
                        // with this control we are deleting the last character if it is any of the next
                        if (aux2[lengthAux2] == '.' || aux2[lengthAux2] == ',' || aux2[lengthAux2] == ':' || aux2[lengthAux2] == ';' || aux2[lengthAux2] == ')' || aux2[lengthAux2] == '"' || aux2[lengthAux2] == '!')
                            aux[n] = '<a class="application_action_link test_link" href=' + quote + 'http://' + aux[n].substring(0, aux[n].length - 1) + quote + ' target=' + quote + '_blank' + quote + ' >' + aux[n].substring(0, aux[n].length - 1) + '</a>' + aux2[lengthAux2];
                        else
                            aux[n] = '<a class="application_action_link test_link" href=' + quote + 'http://' + aux[n] + quote + ' target=' + quote + '_blank' + quote + ' >' + aux[n] + '</a>';
                    }
                }
            }
            // we join all the array into a string with this
            aux3 = aux.join(" ");
        }
        return aux3;
    },

    /**
    * @description we won't reload the menu (only manually when the profile has been modified)
    * @param appData {Object}  information from FMK about the menu
    */
    hasToBeUpdated: function (appData) {
        if(this.loadedFirstTime){
            this.loadedFirstTime = false;
            return true;
        }else{
            return false;
        }
    },

    /**
    * Super class close method
    */
    close: function($super) {
        $super();
    }
});