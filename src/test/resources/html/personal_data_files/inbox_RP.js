
/**
* @fileoverview inbox_RP.js
* @description here is the definition for the right panel inbox 
*/
/**
* @constructor inbox_RP
* @description Handles the right panel inbox.
*/

var inbox_RP = Class.create(origin, {
    /**
    * @initialize Initializing the javaScript class
    * @description Handles the right panel.
    */
    initialize: function($super, panel) {
        $super();
        document.observe('EWS:refreshRightInbox', this.refreshPanel.bind(this));
        this.panel = panel;
        this.getInboxList();
    },

    /**
    * @Getting the list with all the tasks that we have in Inbox 
    */
    getInboxList: function() {
        //requesting SAP for the needed data to initialize the inbox application
        var serviceXML = '<EWS>'
                            + '<SERVICE>GET_INBOX_LST</SERVICE>'
                            + '<PARAM/>'
                        + '</EWS>';

        this.makeAJAXrequest($H({
            xml: serviceXML,
            successMethod: this.buildPanel.bind(this)
        }));
    },

    /**
    * @Read the list with the tasks, if we have any tabs, we create a tableKit 
    * otherwise we show a no results message
    * Param {json} Json containing the tasks' list
    */
    buildPanel: function(json) {
        this.json = json;
        var container = this.panel.getContentElement();
        if (!Object.isEmpty(json.EWS.o_list)) {
            var divContainer = new Element("div",{"class": "div_inbox_RP_table_css" });
            var table = new Element('table',{"class": " inbox_RP_table_css test_table"});
            divContainer.insert(table);
            container.update(divContainer);
            var thead = new Element('thead');
            var headRow = new Element('tr');
            var dateTitle = new Element('th', { 'class': 'table_sortfirstdesc RI_headTitle' }).insert(global.getLabel('date'));
            var descTitle = new Element('th').insert(global.getLabel('description'));
            thead.insert(headRow);
            headRow.insert(dateTitle);
            headRow.insert(descTitle);
            table.insert(thead);
            var tbody = new Element('tbody');
            table.insert(tbody);
            var values = objectToArray(json.EWS.o_list.yglui_str_inbox_list);
            for (var i = 0; i < values.length; i++) {
                var row = new Element('tr');
                var reqid = values[i]['@req_id'];
                var date = sapToDisplayFormat(values[i]['@req_dt']);
                var dateTd = new Element('td', { 'class': 'application_action_link RI_date' }).insert(date);
                var shortDesc = new Element('div', { 'class': 'RI_shortDesc', 'title': values[i]['@req_ds'] }).insert(values[i]['@req_ds']);
                var points = new Element('div', { 'class': 'RI_points' }).insert('...');
                var descTd = new Element('td').insert(shortDesc);
                descTd.insert(points);
                tbody.insert(row);
                row.insert(dateTd);
                row.insert(descTd);
                dateTd.observe('click', this.openDetails.bind(this, reqid));
            }

            //craate the tableKit:
            var RI_table = new tableKitWithSearch(table, {
                pages: global.paginationLimit,
                searchLabel: 'Search',
                noResultsLabel: 'No results found',
                webSearch: true,
                marginSearchLeft: 2
            });
        }
        else {
            var noTasksDiv = new Element('div', { 'class': 'application_main_soft_text test_label' }).insert(this.labels.get('noInboxTasks'));
            container.insert(noTasksDiv);
        }
        var EmptyDiv = new Element('div', { 'class': 'emptyDiv' });
        container.insert(EmptyDiv);
        container.setStyle({
            'padding': '0px'
        });
    },

    /**
    * @Opening the inbox applicatio for the selected tab
    * Param {string} The id of the selected task
    */
    openDetails: function(id) {
        global.open($H({
            app: {
                appId: 'IN_TSK'
            },
            comeFrom: 'right_panel',
            id: id,
            json: this.json
        }));
    },

    /**
    * Refreshing the panel if somthing change on the inbox
    */
    refreshPanel: function() {
        this.getInboxList();
    }
});