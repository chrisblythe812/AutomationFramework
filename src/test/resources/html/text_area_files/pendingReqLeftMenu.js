/**
* @constructor pendingReqLeftMenu
* @description Implements Pending Request left menu.
* @augments EmployeeMenu
*/

var pendingReqLeftMenu = Class.create(EmployeeMenu,
/**
* @lends pendingReqLeftMenu
*/
    {
    /**
    * Service used to get the pending request
    * @type String
    */
    getPendingReqService: 'PEND_REQ_OM',    
    /**
    * Constructor of the class pendingReqLeftMenu
    */
    initialize: function ($super, id, options) {
        $super(id, options);
        //refresh event
        this.refreshPendingReqBinding = this.refreshPendingReq.bindAsEventListener(this);
    },
    /*
    *@method run
    *@param $super: the superclass: getContentDisplayer
    */
    /* run: function ($super, args) {
        
    $super(args);
    document.observe('EWS:refreshPendingRequest', this.refreshPendingReqBinding);
    },*/
    /**
    * @description Shows the menu
    */
    show: function ($super, element) {
        this.changeTitle(global.getLabel("pendReq"));
        if (!this.menuContent) {
            this.setInitialHTML();
        }
        $super(element);
        //adding class widget_w  to add scroll when is needed
        var father = this.widget.contentHTML.ancestors();
        father[0].addClassName('widget_w');
        document.observe('EWS:refreshPendingRequest', this.refreshPendingReqBinding);
    },
    /**
    * @description Builds the initial HTML code
    */
    setInitialHTML: function () {
        this.menuContent = new Element('div', {
            'id': 'OM_Maintain_reqMenu_content',
            'class': 'OM_Maintain_pendingReq_leftMenu'
        });
        this.changeContent(this.menuContent);
        this.getPendingReq();
    },
    /**
    * @description Asks the backend for the pending req list
    */
    getPendingReq: function () {
        var xml = "<EWS>" +
                    "<SERVICE>" + this.getPendingReqService + "</SERVICE>" +
                    "<OBJ TYPE='" + global.objectType + "'>" + global.objectId + "</OBJ>" +
                    "<PARAM>" +
                        " <APPID></APPID>" +
                    "</PARAM>" +
                    "<DEL/>" +
                  "</EWS>";
        this.makeAJAXrequest($H({ xml: xml, successMethod: 'processPendingRequest' }));
    },
    /**
    *@description Method to process the info about the Pending Requests
    *@param {json} Json with the data from SAP
    */
    processPendingRequest: function (json) {
        if (!Object.isEmpty(json.EWS.o_records)) {
            //get the info
            this.pendReqJson = json;
            this.pendReqJsonArray = objectToArray(objectToArray(json.EWS.o_records.yglui_str_pend_req_om));
            //get the labels and save them
            this.labelsPendReq = !Object.isEmpty(json.EWS.o_busid) ? objectToArray(json.EWS.o_busid.yglui_str_inbox_busid) : [];
            this.labelsPendReqHash = $H({});
            var idLabel, descrLabel;
            for (var i = 0; i < this.labelsPendReq.length; i++) {
                idLabel = this.labelsPendReq[i]['@busid'];
                descrLabel = this.labelsPendReq[i]['@bustx'];
                this.labelsPendReqHash.set(idLabel, descrLabel);
            }
            //number of records
            this.numberOfRecords = this.pendReqJsonArray.length;
            //save the info in a Hash
            this.pendReqHash = $H({});
            var id, appId, datum, action, status,busid;
            for (var i = 0; i < this.numberOfRecords; i++) {
                //get the table info
                id = this.pendReqJsonArray[i]['@req_id'];
                appId = this.pendReqJsonArray[i]['@appid'];
                datum = this.pendReqJsonArray[i]['@datum'];
                action = this.pendReqJsonArray[i]['@actio'];
                status = this.pendReqJsonArray[i]['@status'];
                busid = this.pendReqJsonArray[i]['@busid'];
                //get the action descr in labels
                if (!Object.isEmpty(appId) && (!Object.isEmpty(this.labelsPendReqHash.get(busid)))) {
                    action = this.labelsPendReqHash.get(busid);
                } else {
                    action = global.getLabel('noActio');
                }
                //save the info in the hash                                 
                this.pendReqHash.set(id,
                    $H({
                        appId: appId,
                        date: datum,
                        action: action,
                        status: status
                    })
                    );
            }
        }
        //fill the table       
        this.setTableReq();                
    },
    /**
    * @description Create the table for the pending req list    
    */
    setTableReq: function () {        
        var table_pendReq = new Element('table', { 'class': 'sortable resizable  test_table', 'id': 'OM_Maintain_leftmenu_requestTable' });
        this.menuContent.insert(table_pendReq);
        //Creating Head of the table
        var thead_aux = new Element('thead');
        table_pendReq.insert(thead_aux);
        var tr_aux = new Element('tr');
        thead_aux.insert(tr_aux);
        var th1_aux = new Element('th');
        var th2_aux = new Element('th');
        var th3_aux = new Element('th');
        tr_aux.insert(th1_aux);
        tr_aux.insert(th2_aux);
        tr_aux.insert(th3_aux);
        //Labels for the columns
        var label = global.getLabel("DATE");
        th1_aux.update(label);
        var label = global.getLabel("type");
        th2_aux.update(label);
        var label = global.getLabel("STATUS");
        th3_aux.update(label);
        //Creating body of the table
        var tbody_aux = new Element('tbody');
        table_pendReq.insert(tbody_aux);
        //if there are records we draw in the table
        if (this.numberOfRecords > 0) {
            var id, appId, date, action, status;
            //get the info and draw the data
            this.pendReqHash.each(function (pair) {
                id = pair.key;
                appId = pair[1].get('appId');
                date = pair[1].get('date');
                action = pair[1].get('action');
                status = pair[1].get('status');
                //it creates a row
                var tr_aux = new Element('tr');
                tbody_aux.insert(tr_aux);
                var td1_aux = new Element('td');
                var td2_aux = new Element('td');
                var td3_aux = new Element('td');
                tr_aux.insert(td1_aux);
                tr_aux.insert(td2_aux);
                tr_aux.insert(td3_aux);
                //insert the date
                var link = this.setDateLink(date, id, appId);
                td1_aux.insert(link);
                //div to insert the field panel and show information
                var field_div = new Element('div', { 'id': 'req' + id + appId });
                td1_aux.insert(field_div);
                //insert the action
                td2_aux.update(action);
                //code icon for lite version               
                var code_icon = (!global.liteVersion) ? "" : '\u2666';
                //depending of the status it draws the icon                             
                if (status == '20') {
                    var icon = new Element('span', { 'class': 'application_rounded_question2 OM_Maintain_question_span' });
                    icon.insert(code_icon);
                    td3_aux.insert(icon);
                }
                else {
                    td3_aux.insert("");
                }
            } .bind(this));
        }
        //It creates tablekit
        var table_req = new tableKitWithSearch(table_pendReq, {
            pages: 5,
            marginL: 0,
            searchLabel: 'Search',
            noResultsLabel: 'No results found',
            autoLoad: false,
            webSearch: true,
            filterPerPage: 4,
            MaxNumberCategories: 4,
            DefaultSortDirection: 1,
            ShowReports: true
        });       
    },
    /*
    * @method refreshPendingReq
    * @desc called after org unit o position update.
    */
    refreshPendingReq: function () {
        this.menuContent.update("");       
        this.getPendingReq();       
    },
    /*
    * @method setDateLink
    * @desc called when the application is not shown.
    * @param {date} the link date
    * @param {id} id of the object.
    * @param {appId} Id of the application.
    */
    setDateLink: function (date, id, appId) {
        // It creates Date button link
        var dateButtonDiv = new Element('div');
        var json = {
            elements: []
        };
        var dateButton = {
            label: date,
            idButton: this.applicationId + "_date",
            handler: this.getDataLink.bind(this, id, appId),
            className: 'application_action_link',
            type: 'link',
            standardButton: false
        };
        json.elements.push(dateButton);
        var buttonDisplayerDateButton = new megaButtonDisplayer(json);
        dateButtonDiv.insert(buttonDisplayerDateButton.getButtons());
        //return the div with the link
        return (dateButtonDiv);
    },
    /*
    * @method getDataLink
    * @desc called when link is clicked to show the data.
    * @param {id} id of the object.
    * @param {appId} Id of the application.   
    */
    getDataLink: function (id, appId) {
        if (this.menuContent.down('[id=req' + id + appId + ']')) {
            if (this.menuContent.down('[id=req' + id + appId + ']').innerHTML == "") {
                this.auxJson = this.pendReqJson;
                var json = this.getJsonFieldPanel(id, appId);
                if (!Object.isEmpty(json)) {
                    var objParameters = {
                        appId: appId,
                        mode: 'display',
                        json: json
                    };
                    //It creates the field panel to show data
                    var objFieldsPanel = new getContentModule(objParameters).getHtml();
                    //to expand the table (CSS for IE)
                    this.menuContent.down('[id=req' + id + appId + ']').addClassName('OM_Maintain_leftMenu_table');
                    this.menuContent.down('[id=req' + id + appId + ']').insert(objFieldsPanel);
                }
            }
            else {
                //show/hide details
                this.menuContent.down('[id=req' + id + appId + ']').toggle();
            }
        }
    },
    /**
    *@description Method to prepare the info to show using fieldPanel
    *@param {id} id of the object.
    *@param {appId} Id of the application.
    */
    getJsonFieldPanel: function (id, appId) {
        if (!Object.isEmpty(this.auxJson.EWS.o_records.yglui_str_pend_req_om)) {
            //get all records
            var details = objectToArray(this.auxJson.EWS.o_records.yglui_str_pend_req_om);
            var rgRecord;
            for (var i = 0; i < details.size(); i++) {
                //get every record
                rgRecord = details[i];
                //if the record is the record clicked
                if (rgRecord["@req_id"] == id) {
                    //get field_values for fieldPanel
                    this.auxJson.EWS.o_field_values = rgRecord.record;
                    //get field_settings for fieldPanel
                    var aux = objectToArray(this.auxJson.EWS.o_fieldsettings.yglui_str_appid_fs_settings);
                    var objTemp = '';
                    for (var j = 0; j < aux.length; j++) {
                        if (aux[j]['@appid'] == appId) {
                            objTemp = aux[j].o_field_settings;
                        }
                    }
                    this.auxJson.EWS.o_field_settings = objTemp;
                    return this.auxJson;
                }
            }
        }
        return null;
    },
    /*
    * @method close
    * @desc called when the application is not shown.
    */
    close: function ($super) {
        $super();
        document.stopObserving('EWS:refreshPendingRequest', this.refreshPendingReqBinding);
    }
});