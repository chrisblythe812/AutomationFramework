/**
 * @fileOverview quotaChecker.js
 * @description File containing class quotaChecker Needed to see the quota overview.
 * @author: PedroVa
 * @date: April 2011
*/
var quotaChecker = Class.create(Application,
/**
*@lends quotaChecker
*/
{
    /**
     *@param $super The superclass
     *@param {Hash} args Object from the previous application
     *@description instantiates the app
     */
	initialize: function($super, args) {
	    $super(args);
		
        
	},
    /**
     *@param $super The superclass
     *@param empId  Employee ID
     *@param appId  Application ID
     *@param begda  Start date
     *@param endda  End date
     */
	run: function($super,args) {
	    $super();

        var service = "QUOTA_CHECKER";
        var xml_in = "<EWS>" +
                     "<SERVICE>" + service + "</SERVICE>" +
                     "<OBJ TYPE='P'>" + args._object.empId + "</OBJ>" +
                     "<PARAM>" +
                        "<APPID>" + args._object.appId + "</APPID>" +
                        "<ABSATTID>" + args._object.absattId + "</ABSATTID>" +
                        "<BEGDA>"+ args._object.begda + "</BEGDA>" +
                        "<ENDDA>"+ args._object.endda + "</ENDDA>" +
                     "</PARAM>" +
                   "</EWS>";

        this.makeAJAXrequest($H({
            xml: xml_in,
            successMethod: this._createTable.bind(this)
        }));

	},
    /**
    * @description called when the application is not shown.
    */
    close: function($super){
        $super();
    },
    /**
     *@param json Returned json in the backend call.
     *@description create and show the html table with the json data.
     */
	_createTable: function(json) {

        var data = null;
        var elements = 0;
        if (json.EWS.o_lt_qc != null){ 
            data = objectToArray(json.EWS.o_lt_qc.yglui_str_quocheck_out);
            elements = data.length; 
        }

        var tableContainer = new Element('div');


        //Tags to be used in the head of the table
        var tagQuotaType = global.getLabel("FLD_Ktart");
        var tagToBeUsed = global.getLabel("toBeUsed") + " (" + global.getLabel("unit") + ")";
        var tagBy = global.getLabel("by");

        //Table structure creation

        var table = new Element('table', { 'id': 'quotaTable' });
        var t_head = new Element('thead');
        var t_body = new Element('tbody');
        table.insert(t_head);
        table.insert(t_body);
        
        

        var tr_head = new Element('tr');
        var tr_body, td_element1, td_element2, td_element3;
        var head1 = new Element('th', { 'id': tagQuotaType });
        head1.update(tagQuotaType);
        var head2 = new Element('th', { 'id': tagToBeUsed });
        head2.update(tagToBeUsed);
        var head3 = new Element('th', { 'id': tagBy });
        head3.update(tagBy);
        tr_head.update(head1);
        tr_head.insert(head2);
        tr_head.insert(head3);
        t_head.update(tr_head);

        var formatDate;
        //Tbody creation using the backend retrieved data.
        for (var i=0; i < elements; i++){
             tr_body = new Element('tr');
             td_element1 = new Element('td');
             td_element1.update(data[i]['@qtext']);
             tr_body.update(td_element1);
             td_element2 = new Element('td');
             td_element2.update(data[i]['@tbused'] + " (" + data[i]['@utext'] + ")");
             tr_body.insert(td_element2);
             td_element3 = new Element('td');
             formatDate = Date.parseExact(data[i]['@deend'], "yyyy-MM-dd").toString(global.dateFormat);
             td_element3.update(formatDate);
             tr_body.insert(td_element3);
             if (i==0)
                t_body.update(tr_body);
             else
                t_body.insert(tr_body);
        }

        // If no data is available, we need to erase the body of the table
        if( elements == 0 ){
             t_body = new Element('tbody');
        }
         
        

        // It is necessary to insert the table in a div to use tableKitV2:
        tableContainer.update(table);



        //Filter options for "TableKit"
        /*var filtersStoring = $A();
        filtersStoring[0] = { name: tagQuotaType, main: true };
        filtersStoring[1] = { name: tagToBeUsed, main: true };
        filtersStoring[2] = { name: tagBy, main: true };*/

        //TablekitV2 creation
        this.tableKit = new tableKitWithSearch(table, {
            filters: null,
            pages: 5,
            marginL: 0,
            searchLabel: global.getLabel('search'),
            noResultsLabel: global.getLabel('noresults'),
            autoLoad: false,
            webSearch: true,
            filterPerPage: 4,
            MaxNumberCategories: 4,
            DefaultSortDirection: 1,
            ShowReports: true
        });
        
        //Apply CCS
        tableContainer.addClassName('applicationtimeEntryScreen_tableQuotaCheckerDiv');
        table.addClassName('sortable');
        table.addClassName('applicationtimeEntryScreen_tableQuotaChecker');

        this.virtualHtml.update(tableContainer);
	}
});