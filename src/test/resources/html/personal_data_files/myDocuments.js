var MyDocuments = new Class.create(Application, {

    curDocumentID: null,
    prevDocumentID: null,
    mainContainer: null,
    listContainer: null,
    view: 0,
    keyboardNavigation: true,
	firstSync: true,
	prevEmpSelection: null,	
	firstRunSync: true,
	listMode: null,
	__DMLightMode: null,

    initialize: function($super, args) {
        $super(args);
        this.keyboardBinding = this.keyboard.bindAsEventListener(this);
        this.menuSyncBinding = this.menuSync.bindAsEventListener(this);
		this.scExists = global.tabid_sbmid.find(function(menu){return menu[0]=='SC_DOCU'||menu[1]=='SC_DOCU'})? true : false;
		this.__DMLightMode = (global.usettingsJson.EWS.o_99edm=='X')? true : false;
    },

    keyboard: function(e) {
        var element = Event.element(e);
        if (element.tagName == 'TEXTAREA' || element.tagName == 'INPUT') {
            return;
        }
        if (this.curDocumentID) {
            Event.stop(e);
        }
        if (e.keyCode == 32 && this.view == this.viewValues.List && this.curDocumentID && this.keyboardNavigation) {
            this.keyboardNavigation = false;
            Event.stop(e);
            var nextTr = $('myDocuments_TrDocument' + this.curDocumentID).next(1);
            if (nextTr) {
                this.getDocumentMetaData(false, nextTr.id.sub('myDocuments_TrDocument', ''));
            } else {
                nextTr = $('myDocuments_ListContainer').down(1).next().down().id;
                this.getDocumentMetaData(false, nextTr.sub('myDocuments_TrDocument', ''));
            }

        }
    },
	
	onEmployeeSelected: function(e){
		if(this.firstRunSync){
			this.emp = e.id;
			this.getDocTypeList();
			this.firstRunSync=false;
		}
	},

    run: function($super, args) {
        $super(args);
        var selectedEmp = global.getSelectedEmployees();
        //this.emp = (selectedEmp && selectedEmp[0]) || args.get("emp") || global.objectId;
	
		if(args.get("emp")){
			this.emp = args.get("emp");
		}else if(selectedEmp && selectedEmp[0]){
			this.emp = (selectedEmp || selectedEmp[0])
		}else{
			this.emp =global.objectId;
		}
		
		if(args.get("listMode")){
			this.listMode = args.get("listMode");
		}
		
		var populationName = global.getPopulationName(global.currentApplication);
		var population = global.populations.get(populationName);
		if(population){
			var ee = global.getEmployee(this.emp);
		}
		
        var empName;
        if (ee) {
            empName = ee.name;
        }
        this.empName = empName || args.get("empName") || global.name;

        if (args.get("fromOut") && (args.get("fromOut") == true)) {
            this.emp = args.get("emp");
            this.empName = args.get("empName");
            this.stopMenuSync = true;

            global.setEmployeeSelected(this.emp, true, false);

        } else {
            this.stopMenuSync = false;
        }
		
        this.area = this.options.mnmid;
        this.subarea = this.options.sbmid;
        this.page = 1;

        switch (global.currentApplication.appId) {
            case 'DOC_C_MA': this.view = this.viewValues.Catalog; break;
            case 'DOC_L_MA': this.view = this.viewValues.List; break;
            case 'DOC_G_MA': this.view = this.viewValues.Grid; break;
            case 'DOC_F_MA': this.view = this.viewValues.CoverFlow; break;
            default:
                this.view = this.viewValues.List; break;
        }

		if(this.listMode){
			 this.stopMenuSync= true;
			 document.observe("EWS:employeeMenuSync", this.menuSyncBinding);
			 if(global.getEmployee(this.emp)){
				 global.setEmployeeSelected(this.emp,true,false);
			 }else{
				global.setEmployeeSelected(global.objectId,true,false);
			 }
			
		}else{
			document.observe("EWS:employeeMenuSync", this.menuSyncBinding);
		}
        this.buildUI();
        document.observe('keydown', this.keyboardBinding);

    },

    close: function($super) {
        $super();
        cFlow.stop();
        document.stopObserving("EWS:employeeMenuSync", this.menuSyncBinding);
        document.stopObserving('keydown', this.keyboardBinding);
		this.firstRunSync = true;
    },

    menuSync: function(event) {
	
        if (this.stopMenuSync) {
            this.stopMenuSync = false;
            return;
        }

        var args = getArgs(event);
        var employeeId = args.employeeId;
        var employeeName = args.name;
        var selected = args.selected;

        if (selected) {
            this.emp = employeeId;
            this.empName = employeeName;
            this.buildUI();
        }
		
		if(this.firstSync){
			this.prevEmpSelection = employeeId;
			this.firstSync=false;
		}else{
			if(this.prevEmpSelection!=employeeId){
				this.getDocTypeList();
			}
			this.prevEmpSelection = employeeId;
		}		

    },

    viewValues: {
        Catalog: 0,
        List: 1,
        Grid: 2,
        CoverFlow: 3
    },

    filterValues: {
        search: '',
        from: '',
        to: '',
        docType: ''

    },

    searchFocusHandler: function() {
        $('myDocuments_Search').value = '';
        this.filterValues.search = '';
        this.filterDocumentsList();
        this.toggleClearFilter();
    },

    searchBlurHandler: function() {
        if ($('myDocuments_Search').value == '') {
            $('myDocuments_Search').value = global.getLabel('DM_SEARCH');
        }
        this.toggleClearFilter();
    },

    searchKeyupHandler: function() {
        this.filterValues.search = $('myDocuments_Search').value;
        this.filterDocumentsList();
        this.toggleClearFilter();
    },

    dateHandler: function() {

        if (this.fromDatePicker.actualDate && this.toDatePicker.actualDate) {
            this.filterValues.from = this.fromDatePicker.actualDate;
            this.filterValues.to = this.toDatePicker.actualDate;
            this.filterDocumentsList();
            this.toggleClearFilter();
        }
    },

    toggleFilterHandler: function() {
        $('myDocuments_filterOptions').toggle();
    },

    clearFilterHandler: function() {
        $('myDocuments_Search').value = global.getLabel('DM_SEARCH');
        $('myDocuments_DocumentType').selectedIndex = 0;
        this.fromDatePicker.clearFields();
        this.toDatePicker.clearFields();

        this.filterValues.from = '';
        this.filterValues.to = '';
        this.filterValues.search = '';
        this.filterValues.docType = '';
        this.filterDocumentsList();
        this.toggleClearFilter();
    },

    docTypeSlctChangeHandler: function() {
        var docType = '';
        if ($('myDocuments_DocumentType').options[$('myDocuments_DocumentType').selectedIndex].index) {
            docType = $('myDocuments_DocumentType').options[$('myDocuments_DocumentType').selectedIndex].text;
        }
        this.filterValues.docType = docType;
        this.filterDocumentsList();
        this.toggleClearFilter();
    },

    toggleClearFilter: function() {
        if ((this.filterValues.search)
        || ((this.filterValues.from) || (this.filterValues.to))
        || (this.filterValues.docType)) {
            $('myDocuments_ClearFilter').show();
        } else {
            $('myDocuments_ClearFilter').hide();
        }
    },

    getDocTypeList: function() {
        var emp = this.emp;
		var xmlin = ''
        + ' <EWS>'
        + '     <SERVICE>DM_GET_TYPE_F</SERVICE>'
		+ '     <OBJ TYPE="'+((emp)? 'P': '')+'">'+((emp)? emp: '')+'</OBJ>'		
        + ' </EWS>';

        this.makeAJAXrequest($H({ xml: xmlin,
            successMethod: 'buildDocumentsTypeList',
            xmlFormat: false
        }));
    },

    buildDocumentsTypeList: function(json) {
        var options = '<option value="null">' + global.getLabel('DML_CHOOSE_DOCUMENT_TYPE') + '</option>';
        if(json.EWS.o_i_doc_type_list){
			var items = objectToArray(json.EWS.o_i_doc_type_list.yglui_str_ecm_doc_type_list);		
			items.each(function(item) {
				if (this.filterValues.docType == item['@doc_type_name']) {
					options += '<option value="' + item['@doc_type_id'] + '" selected="selected">' + item['@doc_type_name'] + '</option>';
				} else {
					options += '<option value="' + item['@doc_type_id'] + '">' + item['@doc_type_name'] + '</option>';
				}
			} .bind(this));

			$('myDocuments_DocumentType').update(options);
		}
    },

    buildFilterForm: function() {

        var html = ''
        + ' <div id="myDocuments_filterOptions" style="float:right;width:96%;margin-top:10px;margin-bottom:6px">'
        + '     <span style="float: left;">' + global.getLabel('DML_FROM') + ': &nbsp;</span>'
        + '     <div id="myDocuments_DateFrom"></div>'
        + '     <span style="float:left;">' + global.getLabel('DML_TO') + ': &nbsp;</span>'
        + '     <div id="myDocuments_DateTo"></div>'
        + '     <div style="float: right;">'
        + '         <span>' + global.getLabel('DML_DOCUMENT_TYPE') + ': &nbsp;</span>'
        + '         <select id="myDocuments_DocumentType"><option>' + global.getLabel('DML_CHOOSE_DOCUMENT_TYPE') + '...</option></select>'
        + '     </div>'
        + ' </div>';

        this.mainContainer.insert(html);

        this.fromDatePicker = new DatePicker('myDocuments_DateFrom', {
            draggable: true,
            events: $H({ correctDate: 'EWS:dateChanged' })
        });
        this.toDatePicker = new DatePicker('myDocuments_DateTo', {
            draggable: true,
            events: $H({ correctDate: 'EWS:dateChanged' })
        });
        this.fromDatePicker.linkCalendar(this.toDatePicker);
        document.observe('EWS:dateChanged', this.dateHandler.bind(this));

        $('myDocuments_ToggleFilterOptions').observe('click', this.toggleFilterHandler.bind(this));
        $('myDocuments_ClearFilter').observe('click', this.clearFilterHandler.bind(this));
        $('myDocuments_DocumentType').observe('change', this.docTypeSlctChangeHandler.bind(this));
        $('myDocuments_Search').observe('focus', this.searchFocusHandler.bind(this));
        $('myDocuments_Search').observe('blur', this.searchBlurHandler.bind(this));
        $('myDocuments_Search').observe('keyup', this.searchKeyupHandler.bind(this));

        $('myDocuments_filterOptions').hide();

        this.getDocTypeList();
    },

    sortByName: function() {
        this.filteredDocuments = this.filteredDocuments.sort(function(o1, o2) {
            var order = ($('myDocuments_SortByName').hasClassName('table_sortColDesc')) ? 1 : -1;
            var a = o1['@doc_name'].toLowerCase();
            var b = o2['@doc_name'].toLowerCase();
            return order * (a < b ? -1 : a === b ? 0 : 1);
        });
        this.buildDocumentsTable(this.filteredDocuments);
    },
    sortByDate: function() {
        this.filteredDocuments = this.filteredDocuments.sort(function(o1, o2) {
            var order = ($('myDocuments_SortByDate').hasClassName('table_sortColDesc')) ? 1 : -1;
            var a = o1['@cdate'].toLowerCase();
            var b = o2['@cdate'].toLowerCase();
            return order * (a < b ? -1 : a === b ? 0 : 1);
        });
        this.buildDocumentsTable(this.filteredDocuments);
    },
    sortByType: function() {
        this.filteredDocuments = this.filteredDocuments.sort(function(o1, o2) {
            var order = ($('myDocuments_SortByType').hasClassName('table_sortColDesc')) ? 1 : -1;
            var a = o1['@doc_type'].toLowerCase();
            var b = o2['@doc_type'].toLowerCase();
            return order * (a < b ? -1 : a === b ? 0 : 1);
        });
        this.buildDocumentsTable(this.filteredDocuments);
    },
    sortByFormat: function() {
        this.filteredDocuments = this.filteredDocuments.sort(function(o1, o2) {
            var order = ($('myDocuments_SortByFormat').hasClassName('table_sortColDesc')) ? 1 : -1;
            var a = o1['@doc_format'].toLowerCase();
            var b = o2['@doc_format'].toLowerCase();
            return order * (a < b ? -1 : a === b ? 0 : 1);
        });
        this.buildDocumentsTable(this.filteredDocuments);
    },

    buildUI: function() {

        this.mainContainer = new Element("div", { style: 'text-align:left;width:100%;' }).update('');
        this.listContainer = new Element("div", {
            id: 'myDocuments_ListContainer',
            'class': 'myDocuments_ListContainer',
            style: 'text-align:left;float:left;width:100%;border:1px solid #DCD2CE;'
        }).update('<span style="padding:2px;">' + global.getLabel('DML_NO_DOCUMENTS_AVAILABLE') + '.</span>');
        this.catalogContainer = new Element("div", {
            id: 'myDocuments_CatalogContainer',
            'class': 'myDocuments_CatalogContainer',
            style: 'float:left;width:100%'
        }).update('<span style="padding:2px;">' + global.getLabel('DML_NO_DOCUMENTS_AVAILABLE') + '.</span>');
        this.virtualHtml.update(this.mainContainer);

        this.buildHeader();
        this.buildFilterForm();
        var html = ''
        + ' <div id="myDocuments_gridViewHeader" style="float:left;width:100%;"><table class="resizable sortable" id="myDocuments_gridViewHeaderTable" style="margin-bottom: 0px;margin-left: 0px;width:100.3%">'
	    + '     <thead>'
	    + '         <tr>'
	    + '             <th class="table_sortfirstdesc text" id="myDocuments_SortByName">' + global.getLabel('DML_NAME') + '</th>'
        + '             <th id="myDocuments_SortByDate" class="date-iso">' + global.getLabel('DML_DATE') + '</th>'
        + '             <th id="myDocuments_SortByType" class="text">' + global.getLabel('DML_TYPE') + '</th>'
        + '             <th id="myDocuments_SortByFormat" class="text">' + global.getLabel('DML_FORMAT') + '</th>'
        + '         </tr>'
        + '     </thead>'
        + '     <tbody></tbody></table></div>';
        this.mainContainer.insert(html);
        this.mainContainer.insert(this.listContainer);
        this.mainContainer.insert(this.catalogContainer);

        this.listContainer.hide();
        this.catalogContainer.hide('');

        this.buildFooter();

		if(this.view != this.viewValues.CoverFlow){
			var table_new = new tableKitWithSearch($('myDocuments_gridViewHeaderTable'), {
				marginL: 10,
				searchLabel: 'Search',
				autoLoad: false,
				highlightRowsOnMouseOver: false,
				webSearch: false
			});
			$('myDocuments_gridViewHeaderTabletFoot_myDocuments_gridViewHeaderTable').hide();
			$('myDocuments_gridViewHeader').hide();
		}

        $('myDocuments_SortByName').observe('click', this.sortByName.bind(this));
        $('myDocuments_SortByDate').observe('click', this.sortByDate.bind(this));
        $('myDocuments_SortByType').observe('click', this.sortByType.bind(this));
        $('myDocuments_SortByFormat').observe('click', this.sortByFormat.bind(this));

        this.getMyDocuments();
    },

    getMyDocuments: function() {
        $('myDocuments_Footer').hide();
        var service = '';
        if (this.view == this.viewValues.Catalog) {
            service = 'DM_GET_CATALOG';
        } else {
            service = 'DM_GET_LIST';
        }
        var xmlin = ''
        + ' <EWS>'
        + '     <SERVICE>' + service + '</SERVICE>'
		+ '		<OBJECT TYPE="P" >' + this.emp + '</OBJECT>'
        + '     <PARAM>'
		+ '         <I_V_AREA_ID>' + global.currentApplication.mnmid + '</I_V_AREA_ID>'
		+ '         <I_V_SUB_AREA_ID>' + global.currentApplication.sbmid + '</I_V_SUB_AREA_ID>'
        + '     </PARAM>'
        + ' </EWS>';
        this.makeAJAXrequest($H({ xml: xmlin,
            successMethod: 'buildDocumentsList',
            xmlFormat: false
        }));
    },

    buildDocumentsList: function(json) {
        this.json = json;
        $('myDocuments_gridViewHeader').hide();
        $('myDocuments_coverFlowContainer').hide();
        $('myDocuments_Download').hide();
        $('myDocuments_ViewDetails').hide();
        $('myDocuments_filterOptions').hide();
        $('myDocuments_FooterMsg').hide();

        if (this.view == this.viewValues.Catalog) {

            $('myDocuments_Filter').hide();

            this.listContainer.update('<span style="padding:2px;">' + global.getLabel('DML_NO_DOCUMENTS_AVAILABLE') + '.</span>');
            this.listContainer.hide();
            this.catalogContainer.show('');

			this.buildTreeData(this.json.EWS.o_i_catalog);

        } else {

            $('myDocuments_Filter').show();

            //this.catalogContainer.update('');
            //this.catalogContainer.hide('<span style="padding:2px;">' + global.getLabel('DML_NO_DOCUMENTS_AVAILABLE') + '.</span>');

			this.catalogContainer.update('<span style="padding:2px;">' + global.getLabel('DML_NO_DOCUMENTS_AVAILABLE') + '.</span>');
            this.catalogContainer.hide('');

            this.listContainer.show();
            this.filterDocumentsList();
            $('myDocuments_Footer').show();
        }
    },

    filterDocumentsList: function() {
        eval('var json=' + Object.toJSON(this.json));
        if (!json.EWS.o_i_documents || !json.EWS.o_i_documents.yglui_str_ecm_doc_list) {
            this.listContainer.update('<span style="padding:2px;">' + global.getLabel('DML_NO_DOCUMENTS_AVAILABLE') + '.</span>');
            return;
        }
        var documents = json.EWS.o_i_documents.yglui_str_ecm_doc_list;

        if (!documents.length) {
            documents = new Array(documents);
        }
        this.documents = documents;
        documents = documents.sort(function(o1, o2) {
            return (o1['@doc_name'] > o2['@doc_name']);
        });
        var date = '';
        for (var i = 0; i < documents.length; i++) {

            if (this.filterValues.docType && documents[i] && documents[i]['@doc_type']) {
                if (!documents[i]['@doc_type'].toLowerCase().include(this.filterValues.docType.toLowerCase())) {
                    delete documents[i];
                }else{
					if(this.filterValues.docType.toLowerCase()!=documents[i]['@doc_type'].toLowerCase()){
						delete documents[i];
					}
				}
            }

            if (this.filterValues.from && this.filterValues.to && documents[i] && documents[i]['@cdate']) {
                date = Date.parseExact(documents[i]['@cdate'], "yyyy-MM-dd");
                if (!date.between(this.filterValues.from, this.filterValues.to)) {
                    delete documents[i];
                }
            }

            if (this.filterValues.search && documents[i]) {
                this.filterValues.search = this.filterValues.search.toLowerCase();
                if ((documents[i]['@doc_name'] && !documents[i]['@doc_name'].toLowerCase().include(this.filterValues.search))
				&& (documents[i]['@doc_type'] && !documents[i]['@doc_type'].toLowerCase().include(this.filterValues.search))
				&& (documents[i]['@cdate'] && !documents[i]['@cdate'].toLowerCase().include(this.filterValues.search))
				&& (documents[i]['@doc_format'] && !documents[i]['@doc_format'].toLowerCase().include(this.filterValues.search))
				) {
                    delete documents[i];
                }
            }
        }

        if ($('myDocuments_ListContainer').down('table')) {
            $('myDocuments_ListContainer').down('table').remove();
        }

        this.filteredDocuments = documents;

        this.toggleClearFilter();
        this.buildDocumentsTable(documents);

    },

    toogleViews: function() {

        var views =
		[
			{ id: 3, name: 'Coverflow' },
			{ id: 1, name: 'List' },
			{ id: 0, name: 'Catalog' },
			{ id: 2, name: 'Grid' }
		];

        var viewsCSS =
		[
			{ id: 3, name: 'CoverflowRight' },
			{ id: 1, name: 'ListCenter' },
			{ id: 0, name: 'TreeCenter' },
			{ id: 2, name: 'ThumbnailsLeft' }
		];

        for (var i = 0; i < views.length; i++) {
            if (this.view == views[i].id) {
                $('myDocuments_' + views[i].name + 'View').removeClassName('PM_view' + viewsCSS[i].name);
                $('myDocuments_' + views[i].name + 'View').addClassName('PM_view' + viewsCSS[i].name + 'Selected');
            } else {
                $('myDocuments_' + views[i].name + 'View').addClassName('PM_view' + viewsCSS[i].name);
                $('myDocuments_' + views[i].name + 'View').removeClassName('PM_view' + viewsCSS[i].name + 'Selected');
            }
        }

    },
    buildHeader: function() {

        var myDocuments_Header = new Element('div',{
                                 'id':'myDocuments_Header',
                                 'style':'position:relative;height:58px;'
        });

        var myDocuments_SubHeader = new Element('div',{
                         'id': 'myDocuments_SubHeader',
                         'style':'margin-top: 10px;margin-bottom:10px;float:left;width:100%;'
        });

        var myDocuments_EmpNameDiv = new Element('div',{
                         'id': 'myDocuments_EmpNameDiv',
                         'style':'float:left;'
        });

        myDocuments_EmpNameDiv.insert(global.getLabel('DML_CURRENTLY_SHOWING_DOCUMENTS_FROM'));
        myDocuments_EmpNameDiv.insert(' : ');
        myDocuments_EmpNameDiv.insert(this.empName);
        
        myDocuments_SubHeader.insert(myDocuments_EmpNameDiv);

        if(this.subarea != 'SC_DOC'){
                       var ViewCompleteFiles = new Element('div',{
                       'id': 'ViewCompleteFiles',
                       'style': (this.scExists)? 'text-align:center;float:right;margin-right:2px;margin-left:10px;' : 'text-align:center;float:right;margin-right:2px;margin-left:10px;text-decoration: underline;font-family:"Trebuchet MS","Arial";',
                       'class': (this.scExists)? 'application_action_link' : 'getContentLinks fieldDispFloatLeft application_main_soft_text'
					   });

        
                       ViewCompleteFiles.insert(global.getLabel('DML_VIEW_COMPLETE_EMPLOYEE_FILES'));
                       myDocuments_SubHeader.insert(ViewCompleteFiles);
        }
        
        var myDocuments_SelectViewContainer = new Element('div',{
                         'id': 'myDocuments_SelectViewContainer',
                         'style':'text-align:center;float:right;margin-right:-59px;width:'+((this.__DMLightMode)? '23%': '35%')
        });
		
		if(!this.listMode){
		myDocuments_SelectViewContainer.insert(new Element('span',{'style':'float:left;margin-left:9px;margin-right:5px;color: #958881;'}).insert(global.getLabel('DML_SELECT_VIEW')));
		
		var catalogSelected = (global.currentApplication.appId=='DOC_C_MA')? true: false;
		var gridSelected= (global.currentApplication.appId=='DOC_G_MA')? true: false;
		var listSelected= (global.currentApplication.appId=='DOC_L_MA')? true: false;
		var coverFlowSelected= (global.currentApplication.appId=='DOC_F_MA')? true: false;
		if(this.__DMLightMode){
			var selectView = [
					  {name: 'tree', handle_button: this.selectCatalog, selected: catalogSelected, tooltip: global.getLabel('DM_TREEVIEW'), liteVersion: global.getLabel('DM_TREEVIEW')},
					  {name: 'list', handle_button: this.selectList, selected: listSelected, tooltip: global.getLabel('DM_LISTVIEW'), liteVersion: global.getLabel('DM_LISTVIEW')}
			];
		}else{
			var selectView = [
					  {name: 'thumbnails', handle_button: this.selectGrid, selected: gridSelected, tooltip: global.getLabel('DM_CATALOG'), liteVersion: global.getLabel('DM_CATALOG')},
					  {name: 'tree', handle_button: this.selectCatalog, selected: catalogSelected, tooltip: global.getLabel('DM_TREEVIEW'), liteVersion: global.getLabel('DM_TREEVIEW')},
					  {name: 'list', handle_button: this.selectList, selected: listSelected, tooltip: global.getLabel('DM_LISTVIEW'), liteVersion: global.getLabel('DM_LISTVIEW')},
					  {name: 'coverflow', handle_button: this.selectCoverFlow, selected: coverFlowSelected, tooltip: global.getLabel('DM_COVERFLOW'), liteVersion: global.getLabel('DM_COVERFLOW')}
			];
		}

			var viewSelectorInput = new viewSelector(selectView);
			myDocuments_SelectViewContainer.insert(viewSelectorInput.createrHTML());
		}
         myDocuments_SubHeader.insert(myDocuments_SelectViewContainer);
         myDocuments_Header.insert(myDocuments_SubHeader);

         var myDocuments_coverFlowContainer = new Element('div',{
                         'id': 'myDocuments_coverFlowContainer',
                         'style':'position:relative;width:100%;height:500px;'
         });
         
         var coverFlow = new Element('div',{
                                   'id': 'coverFlow',
                                   'style':'height:98%;top:0%;position: absolute;width: 100%;left: 0%;overflow: hidden;'
         });
         
         myDocuments_coverFlowContainer.insert(coverFlow);

         var myDocuments_Filter = new Element('div',{
                         'id': 'myDocuments_Filter',
                         'style':'float:left;width:100%;'
         });
         
         var myDocuments_SelectAllContainer = new Element('div',{
                         'id': 'myDocuments_SelectAllContainer',
                         'style':'margin-bottom:6px;padding-left:1px;float:left;'
         });
         
         var myDocuments_SelectAll = new Element('input',{
                                  'id' : 'myDocuments_SelectAll',
                                  'type': 'checkbox'
         });
		 var span = new Element('span')
		 span.insert(global.getLabel('DML_SELECT_UNSELECT_ALL'))
		  
         myDocuments_SelectAllContainer.insert(myDocuments_SelectAll);
		 myDocuments_SelectAllContainer.insert(span);
		
         var myDocuments_FilterContainer = new Element('div',{
                                   'id': 'myDocuments_FilterContainer',
                                   'style':'margin-bottom:6px;float:right;margin-right:45px'
         });
         myDocuments_Filter.insert(myDocuments_SelectAllContainer);

         var myDocuments_ToggleFilterOptions = new Element('span',{
                                     'id': 'myDocuments_ToggleFilterOptions',
                                     'class': 'application_action_link',
                                     'style': 'float:left;margin-right: 10px;'

         });
         myDocuments_ToggleFilterOptions.insert(global.getLabel('DML_FILTER_OPTIONS'));
         
         myDocuments_FilterContainer.insert(myDocuments_ToggleFilterOptions);

         var myDocuments_Search = new Element('input',{
                                  'id' : 'myDocuments_Search',
                                  'type': 'text',
                                  'value': ((this.filterValues.search) ? this.filterValues.search : global.getLabel('DM_SEARCH')),
                                  'class': 'application_autocompleter_box',
                                  'label': global.getLabel('DML_SELECT_UNSELECT_ALL')
         });
         
         myDocuments_FilterContainer.insert(myDocuments_Search);

         var myDocuments_ClearFilter = new Element('span',{
                                     'id': 'myDocuments_ClearFilter',
                                     'class': 'application_action_link',
                                     'style': 'margin-left: 10px;'

         });

         myDocuments_ClearFilter.insert(global.getLabel('DML_CLEAR_FILTER'));
         myDocuments_FilterContainer.insert(myDocuments_ClearFilter);
         myDocuments_Filter.insert(myDocuments_FilterContainer);


        this.mainContainer.insert(myDocuments_Header);
        this.mainContainer.insert(myDocuments_coverFlowContainer);
        this.mainContainer.insert(myDocuments_Filter);
        $('myDocuments_coverFlowContainer').hide();
        $('myDocuments_ClearFilter').hide();
        
        emp = this.emp;
        empName = this.empName;
        
		if (this.scExists) {
			if (this.subarea != 'SC_DOC') {
				$('ViewCompleteFiles').observe('click', function(){
					global.open($H({
						app: {
							tabId: 'SC_DOCU',
							appId: "DOC_L_MA",
							view: 'MyDocuments'
						},


						emp: emp,
						empName: empName,
						fromOut: true
					}));
				}
					.bind(this));
			}

		}

    },

	selectCatalog : function(evt){
		global.open($H({
			app: {
				tabId: global.currentApplication.tabId,
				appId: "DOC_C_MA",
				view: global.currentApplication.view,
				emp: emp,
				empName: empName
			}
		}));
	},

	selectList : function(evt) {

		global.open($H({
			app: {
				tabId: global.currentApplication.tabId,
				appId: "DOC_L_MA",
				view: global.currentApplication.view,
				emp: emp,
				empName: empName
			}
		}));

	},

	selectGrid : function(evt) {
		global.open($H({
			app: {
				tabId: global.currentApplication.tabId,
				appId: "DOC_G_MA",
				view: global.currentApplication.view,
				emp: emp,
				empName: empName
			}
		}));
	},

	selectCoverFlow : function(evt) {
		global.open($H({
			app: {
				tabId: global.currentApplication.tabId,
				appId: "DOC_F_MA",
				view: global.currentApplication.view,
				emp: emp,
				empName: empName
			}
		}));
	},

    buildDocumentsTable: function(documents) {

        $('myDocuments_gridViewHeader').hide();
        $('myDocuments_coverFlowContainer').hide();
        $('myDocuments_ViewDetails').hide();

        var j = 0;
        documents.each(function(document) {
            if (document) {
                j++;
            }
        });

        if (j > 0) {
            $('myDocuments_Download').show();
            $('myDocuments_FooterMsg').show();
        } else {
            $('myDocuments_Download').hide();
            $('myDocuments_FooterMsg').hide();

        }
        if ((this.view == this.viewValues.List) || (this.view == this.viewValues.CoverFlow)) {
            var html = ''
            + ' <table class="sortable resizable">'
	        + '     <thead>'
	        + '         <tr>'
	        + '             <th class="table_sortfirstdesc text" id="Th1" field="doc_name">' + global.getLabel('DML_NAME') + '</th>'
            + '             <th id="Th2" field="cdate" class="date-iso">' + global.getLabel('DML_DATE') + '</th>'
            + '             <th id="Th3" field="doc_type" class="text">' + global.getLabel('DML_TYPE') + '</th>'
            + '             <th id="Th4" field="doc_format" class="text">' + global.getLabel('DML_FORMAT') + '</th>'
            + '         </tr>'
            + '     </thead>'
            + '     <tbody ' + ((!Prototype.Browser.IE) ? 'style="height:' + ((j > 16) ? '480px' : '100%') + '"' : '') + '>';

            documents.each(function(document) {

				var auxText = document['@cdate'];
				if(this.view != this.viewValues.CoverFlow){
					var auxText = Date.parseExact(auxText, "yyyy-MM-dd").toString('dd/MM/yyyy');
				}
				
				if (document) {
                    html += ''
                    + '<tr id="myDocuments_TrDocument' + document['@doc_id'] + '" style="cursor:pointer;">'
					+ '				<td><div><input id="myDocuments_check' + document['@doc_id'] + '" type="checkbox" />' + underlineSearch((document['@doc_name'] || ''), this.filterValues.search, 'applicationInbox_textMatch') + '</div></td>'
					+ '             <td><div>' + underlineSearch((auxText || ''), this.filterValues.search, 'applicationInbox_textMatch') + '</div></td>'
					+ '             <td><div>' + underlineSearch((document['@doc_type'] || ''), this.filterValues.search, 'applicationInbox_textMatch') + '</div></td>'
					+ '             <td><div>' + underlineSearch((document['@doc_format'] || ''), this.filterValues.search, 'applicationInbox_textMatch') + '</div></td>'
                    + ' </tr>';
                }
            } .bind(this));
            if (j == 0) {
                html += '<tr><td><span style="padding:2px;">' + global.getLabel('DML_NO_DOCUMENTS_FOUND') + '.</span></td><td></td><td></td><td></td></tr>';
            }
            html += ''
            + '     </tbody>'
            + ' </table>';
            this.listContainer.update(html);
            this.registerEvents(documents);
			/*Cover flow View will use the table kit version 1, all other views will use the tablekit with search*/
			if(this.view == this.viewValues.CoverFlow){
				TableKit.Sortable.init(this.listContainer.down('table'), {
					marginL: 10,
					autoLoad: false,
					resizable: false
				});
				$('myDocuments_ViewDetails').show();
			}else{
				var table_new = new tableKitWithSearch(this.listContainer.down('table'), {
					marginL: 10,
					searchLabel: 'Search',				
					autoLoad: false,
					highlightRowsOnMouseOver: false,
					webSearch: false
				});
			}
			if(this.view == this.viewValues.List){
				var rowSelected = $$('li.myDocuments_RowBold');
				if (rowSelected.size() > 0){
					rowSelected.each(function(row){
						row.removeClassName('myDocuments_RowBold');
					})
					//$$('li.myDocuments_RowBold').removeClassName('myDocuments_RowBold');
				}
			}
        } else if (this.view == this.viewValues.Grid) {
            $('myDocuments_gridViewHeader').show();
            $('myDocuments_ViewDetails').show();

            var html = '';
            html += ' <table class="resizable" CELLPADDING="2" CELLSPACING="6" style="width:100%;border:1px solid #DCD2CE;">'
            html += '<tbody ' + ((!Prototype.Browser.IE) ? 'style="height:' + ((j > 20) ? '480px' : '100%') + '"' : '') + '><tr>';
            var i = 0;
            documents.each(function(document) {

                if (document) {

                    var xmlin = ""
					+ "<EWS>"
						+ "<SERVICE>DM_GET_THUMB</SERVICE>"
						+ "<OBJECT TYPE=''/>"
						+ "<DEL/><GCC/><LCC/>"
						+ "<PARAM>"
							+ "<I_V_CONTENT_ID>" + document['@doc_id'] + "</I_V_CONTENT_ID>"
						+ "</PARAM>"
					+ "</EWS>";
                    html += '<td id="myDocuments_TdDocument' + document['@doc_id'] + '" style="background-color:#DCD2CE;text- align:center;vertical-align:top;width:' + ((((++i) % 4 == 0)) ? '27' : '24') + '%">'
					+ '	<div style="text-align:center;width:' + ((((i) % 4 == 0) && Prototype.Browser.IE) ? '90' : '100') + '%;">'
					+ '		<div title="' + document['@doc_format'] + '" style="float:right;" class="myDocuments_' + document['@doc_format'].toLowerCase() + 'Icon"></div>'
					+ '		<img title="' + document['@doc_name'] + '" id="myDocuments_ThumbnailGrid' + document['@doc_id'] + '" style="border:0;width:144px;height:192px;margin-top:1px;cursor:pointer;" src="' + this.buildURL(xmlin) + '&nocach=' + Math.floor(Math.random() * 100001) + '" /><br/>' + underlineSearch((document['@doc_name'] || ''), this.filterValues.search, 'applicationInbox_textMatch')
					+ '		<div style="float:left;"><input id="myDocuments_check' + document['@doc_id'] + '" type="checkbox" /></div>'
					+ '	</div></td>';

                    if ((i) % 4 == 0) {
                        html += '</tr><tr>';
                    }
                }
            } .bind(this));

            if (j == 0) {
                html += '<td colspan="4" style="background-color:#DCD2CE;"><span style="padding:2px;">' + global.getLabel('DML_NO_DOCUMENTS_FOUND') + '.</span></td>'
            }

            if (((i) % 4 != 0) && !Prototype.Browser.IE) {
                html += '<td>&nbsp;</td>';
            }
            html += '</tr>'
            + '     </tbody>'
            + ' </table>';
            this.listContainer.update(html);
            this.registerEvents(documents);
        }

		$('myDocuments_DocumentCount').update(j);
		
        if (this.view == this.viewValues.CoverFlow) {
            $('myDocuments_coverFlowContainer').show();
            cFlow.create(this, "coverFlow", documents, 0.75, 0.15, 1.8, 10, 8, 4);
        }else{
			$('myDocuments_gridViewHeaderTabletFoot_myDocuments_gridViewHeaderTable').hide();
		}

    },

    buildFooter: function() {
                                
        var myDocuments_Footer = new Element('div',{
                        'id': 'myDocuments_Footer'
        });

        var json = ({ 
                        elements:[]
        });
        
        var myDocuments_Download = ({
                        label: global.getLabel('DML_DOWNLOAD'),
                        idButton:'myDocuments_Download',
                        className: (!global.liteVersion)?'application_action_link': '',
                        type: 'button',
                        standardButton: (!global.liteVersion)? true : false
        });
        json.elements.push(myDocuments_Download);
        
        var myDocuments_ViewDetails = ({
                        label: global.getLabel('DML_VIEW_DETAILS'),
                        idButton:'myDocuments_ViewDetails',
                        className: (!global.liteVersion)?'application_action_link': '',
                        type: 'button',
                        standardButton: (!global.liteVersion)? true : false
        });
        json.elements.push(myDocuments_ViewDetails);
        
        var myDocuments_FooterMsg = new Element('div',{
                        'id': 'myDocuments_FooterMsg',
                        'style': 'float:right;'
        });
        var myDocuments_DocumentCount = new Element('span',{
                        'id': 'myDocuments_DocumentCount'
        }).update('0 ');
        var docFoundSpan = new Element('span').update('&nbsp;' +global.getLabel("DML_DOCUMENTS_FOUND"));
        
        myDocuments_FooterMsg.insert(myDocuments_DocumentCount);
        myDocuments_FooterMsg.insert(docFoundSpan);
        myDocuments_Footer.insert(myDocuments_FooterMsg);
        
        
        var buttonDisplayerExamplebutton = new megaButtonDisplayer(json);
        myDocuments_Footer.insert(buttonDisplayerExamplebutton.getButtons());

        this.mainContainer.insert(myDocuments_Footer);
        var html = myDocuments_Footer;
        $('myDocuments_ViewDetails').hide();
    },

    getDocumentMetaData: function(event, documentID) {

        if (event && (event.element().tagName != 'DIV')) return;
        if (event) {
            this.mouse = true;
        } else {
            this.mouse = false;
        }
        this.curDocumentID = documentID;
		emp = this.emp;
        var xmlin = ''
        + ' <EWS>'
        + '     <SERVICE>DM_GET_DETAILS</SERVICE>'
		+ '     <OBJ TYPE="'+((emp)? 'P': '')+'">'+((emp)? emp: '')+'</OBJ>'
        + '     <PARAM>'
        + '         <I_V_DOC_ID>' + documentID + '</I_V_DOC_ID>'
        + '     </PARAM>'
        + ' </EWS>';

        this.makeAJAXrequest($H({ xml: xmlin,
            successMethod: 'buildDocumentMetaData',
            xmlFormat: false
        }));
    },

    buildDocumentMetaData: function(json) {

        var documentID = this.curDocumentID;	
		var docData = json.EWS.o_w_details;
		
		var myDocuments_Details = new Element('div',{
                        'id': 'myDocuments_Details',
                        'style': 'width:100%;height:240px;' + (((this.view == this.viewValues.List)) ? 'margin-left:10px;border:1px solid #DCD2CE;' : '')
        });
		
		var auxElm = new Element('div',{'style':'width:25%;height:99%;float:left;padding-top:10px;padding-left:10px'});
		myDocuments_Details.insert(auxElm);
		
		if(!this.__DMLightMode){
		var xmlin = ""
        + "<EWS>"
            + "<SERVICE>DM_GET_THUMB</SERVICE>"
            + "<OBJECT TYPE=''/>"
            + "<DEL/><GCC/><LCC/>"
            + "<PARAM>"
                + "<I_V_CONTENT_ID>" + documentID + "</I_V_CONTENT_ID>"
            + "</PARAM>"
        + "</EWS>";
		
		auxElm.update(new Element('img',{
                                     'id':'myDocuments_Thumbnail',
                                     'style:': 'border:0;cursor:pointer;width:150px;height:200px;',
                                     'src':this.buildURL(xmlin) + '&nocach=' + Math.floor(Math.random() * 100001),
                                     'title' : (docData['@doc_name_orig'])? docData['@doc_name_orig']: ''}))
		auxElm.insert(new Element('span',{'style':'text-align: center'}).insert((docData['@doc_pages'] != null) ? '' + global.getLabel('DML_PAGE') + ' 1 ' + global.getLabel('DML_OF') + ' ' + docData['@doc_pages'] : ''))
		}
		auxElm = new Element('div',{'style':'width:35%;height:99%;float:left;padding-top:10px'});
		myDocuments_Details.insert(auxElm);
		auxElm.update(new Element('span',{'style':'font-weight:bold;'}).insert(global.getLabel("DML_DOCUMENT_PROPERTIES")+'<br><br>'))

		auxElm.insert(new Element('span').insert(global.getLabel("DML_TYPE")+' : '+((docData['@doc_type'])? docData['@doc_type'] : '') +'<br>'))
		auxElm.insert(new Element('span').insert(global.getLabel("DML_FILE_SIZE")+' : '+((docData['@doc_size']) ? docData['@doc_size'] : '')+'<br>'))
		auxElm.insert(new Element('span').insert(global.getLabel("DML_STATUS")+' : '+((docData['@doc_status'])? docData['@doc_status'] : '')+'<br>'))
		auxElm.insert(new Element('span').insert(global.getLabel("DML_SOURCE")+' : '+((docData['@doc_source'])? docData['@doc_source'] : '')+'<br>'))
		auxElm.insert(new Element('span').insert(global.getLabel("DML_CREATION_DATE")+' : '+((docData['@doc_cdate'])? docData['@doc_cdate'] : '')+' ' + ((docData['@doc_ctime'])? docData['@doc_ctime'] : '')+'<br>'))
		auxElm.insert(new Element('span').insert(global.getLabel("DML_MODIFICATION_DATE")+' : '+((docData['@doc_udate'])? docData['@doc_udate']: '')+ ' ' + ((docData['@doc_utime'])? docData['@doc_utime']: '')+'<br>'))
		auxElm.insert(new Element('span').insert(global.getLabel("DML_ORIGNAL_FILE_NAME")+' : '+((docData['@doc_name_orig'])? docData['@doc_name_orig'] : '')+'<br>'))
		auxElm.insert(new Element('span').insert(global.getLabel("DML_TRACKING_ID")+' : '+((docData['@doc_track_id'])? docData['@doc_track_id']: '')+'<br>'))
		
		auxElm = new Element('div',{'style':'width:33%;height:99%;float:left;padding-top:10px'});
		myDocuments_Details.insert(auxElm);
		auxElm.update(global.getLabel('DML_COMMENTS')+':');
		var mydocuments_comments = new Element('textarea',{
                                    'id':'myDocuments_Comments',
                                    'style': 'width:98%;height:80px;font-size:11px;',
                                    'class': 'application_autocompleter_box'
		})
		auxElm.insert(mydocuments_comments)
		mydocuments_comments.value = prepareTextToEdit((docData['@doc_comment'])? docData['@doc_comment']: '').gsub('\n', '\r\n')
		var myDocuments_ButtonDiv = new Element('div',{
                                    'id':'myDocuments_ButtonDiv',
                                    'style': 'float:right;margin-top:2px;'

		});
		auxElm.insert(myDocuments_ButtonDiv)
		var json = ({
               elements:[]
		});

        var myDocuments_SaveChanges = ({
                       label: global.getLabel('DML_SAVE_COMMENTS'),
                       toolTip: global.getLabel('DML_SAVE_COMMENTS'),
                       idButton:'myDocuments_SaveChanges_'+Math.random(),
                       className: (!global.liteVersion)?'application_action_link': '',
                       'type': 'button',
                       handler: this.saveChanges.bindAsEventListener(this),
                       standardButton: (!global.liteVersion)? true : false
		});
		json.elements.push(myDocuments_SaveChanges);

		var buttonDisplayerSaveChanges = new megaButtonDisplayer(json);

        if ((this.view == this.viewValues.Grid) || (this.view == this.viewValues.Catalog) || (this.view == this.viewValues.CoverFlow)) {
            var popUp = new infoPopUp({
                closeButton: $H({
                    'callBack': function() {
                        popUp.close();
                        delete popUp;
                    }
                }),
                htmlContent: myDocuments_Details,
                indicatorIcon: 'void',
                width: 800
            });
            popUp.create();



        } else if (this.view == this.viewValues.List) {

             var myDocuments_TrMetaData = new Element('tr',{
                                          'id':'myDocuments_TrMetaData' + this.curDocumentID
             });

             var myDocuments_TrMetaDataTD = new Element('td',{
                                          'id':'myDocuments_TrMetaDataTD',
                                          'colspan': '4',
                                          'style': 'padding-left:0px;width:100%;'
             });

             myDocuments_TrMetaDataTD.insert(myDocuments_Details);
             myDocuments_TrMetaData.insert(myDocuments_TrMetaDataTD);

            if (this.prevDocumentID && $('myDocuments_TrMetaData' + this.prevDocumentID)) {
                $('myDocuments_TrMetaData' + this.prevDocumentID).remove();

            }
            if (this.prevDocumentID != this.curDocumentID) {
                new Insertion.After($('myDocuments_TrDocument' + this.curDocumentID), myDocuments_TrMetaData);
            } else {
                this.curDocumentID = null;
            }
            this.prevDocumentID = this.curDocumentID;
            if (!this.mouse) {
                if (Prototype.Browser.IE) {
                    $('myDocuments_ListContainer').scrollTop = $('myDocuments_TrDocument' + this.curDocumentID).offsetTop - 20;
                } else {
                    $('myDocuments_ListContainer').down('tbody').scrollTop = $('myDocuments_TrDocument' + this.curDocumentID).offsetTop - 20;
                }
            }
            this.keyboardNavigation = true;
        }

        myDocuments_ButtonDiv.insert(buttonDisplayerSaveChanges.getButtons());
		
		if($('myDocuments_Thumbnail'))
        $('myDocuments_Thumbnail').observe('click', function() {
            var xmlin = ''
            + '<EWS>'
	            + '<SERVICE>DM_GET_FILE</SERVICE>'
	            + '<OBJECT TYPE=""/>'
	            + '<DEL/><GCC/><LCC/>'
	            + '<PARAM>'
		            + '<I_V_DOC_ID>' + documentID + '</I_V_DOC_ID>'
	            + '</PARAM>'
            + '</EWS>';
            window.open(this.buildURL(xmlin), '', 'width=300,height=300,resizable=yes,scrollbars=yes,toolbar=no,location=no');
        } .bind(this));

    },

    registerEvents: function(documents) {

        documents.each(function(document) {
            if (document) {
                if ($('myDocuments_TrDocument' + document['@doc_id'])) {
                    $('myDocuments_TrDocument' + document['@doc_id']).stopObserving('click');
                    if (this.view == this.viewValues.CoverFlow) {
						$('myDocuments_TrDocument' + document['@doc_id']).observe('click',
                        cFlow.update.bind(this, document['@doc_id']));
                    } else {
                        $('myDocuments_TrDocument' + document['@doc_id']).observe('click',
                        this.getDocumentMetaData.bindAsEventListener(this, document['@doc_id']));
                    }
                }
                if (this.view == this.viewValues.Grid && $('myDocuments_TdDocument' + document['@doc_id'])) {
                    var checkbox = $('myDocuments_check' + document['@doc_id']);
                    checkbox.observe('click', function(e, id) {
                        if (checkbox.checked) {
                            $('myDocuments_TdDocument' + id).setStyle({ 'backgroundColor': '#0099CC' });
                        } else {
                            $('myDocuments_TdDocument' + id).setStyle({ 'backgroundColor': '#DCD2CE' });
                        }
                    } .bindAsEventListener(this, document['@doc_id']));

                    $('myDocuments_ThumbnailGrid' + document['@doc_id']).observe('click', function(id) {
                        var xmlin = ''
			            + '<EWS>'
				            + '<SERVICE>DM_GET_FILE</SERVICE>'
				            + '<OBJECT TYPE=""/>'
				            + '<DEL/><GCC/><LCC/>'
				            + '<PARAM>'
					            + '<I_V_DOC_ID>' + id + '</I_V_DOC_ID>'
				            + '</PARAM>'
			            + '</EWS>';
                        window.open(this.buildURL(xmlin), '', 'width=300,height=300,resizable=yes,scrollbars=yes,toolbar=no,location=no');
                    } .bind(this, document['@doc_id']));
                }
            }
        } .bind(this));

        if ((this.view == this.viewValues.List) || (this.view == this.viewValues.CoverFlow)) {
            var onsort = function(event) {
                if (this.prevDocumentID && $('myDocuments_TrMetaData' + this.prevDocumentID)) {
                    $('myDocuments_TrMetaData' + this.prevDocumentID).remove();
                    this.prevDocumentID = null;
                }
                if (this.view == this.viewValues.CoverFlow) {
                    var cell = event.element();
                    var table = this.listContainer.down('table');
                    var index = TableKit.getCellIndex(cell);
                    var order = cell.hasClassName('table_sortColDesc') ? 1 : -1;
                    var datatype = TableKit.Sortable.getDataType(cell, index, table);
                    var tkst = TableKit.Sortable.types;
                    this.documents = this.documents.sort(function(a, b) {
                        return order * tkst[datatype].compare(a['@' + cell.getAttribute('field')], b['@' + cell.getAttribute('field')]);
                    });
                    cFlow.create(this, "coverFlow", this.documents, 0.75, 0.15, 1.8, 10, 8, 4);
                }
            }
        }

        $('myDocuments_SelectAll').observe('click', function() {
            var checked = $('myDocuments_SelectAll').checked;
            documents.each(function(document) {
                if (document) {
                    if ($('myDocuments_check' + document['@doc_id'])) {
                        $('myDocuments_check' + document['@doc_id']).checked = checked;
                        if (this.view == this.viewValues.Grid) {
                            $('myDocuments_TdDocument' + document['@doc_id']).setStyle({ 'backgroundColor': ((checked) ? '#0099CC' : '#DCD2CE') });
                        }
                    }
                }
            } .bind(this));
        } .bind(this));

        $('myDocuments_Download').stopObserving('click');
        $('myDocuments_Download').observe('click', this.downloadDocuments.bind(this, documents));

        if ((this.view == this.viewValues.Grid) || (this.view == this.viewValues.CoverFlow)) {
            var that = this;
            $('myDocuments_ViewDetails').stopObserving('click');
            $('myDocuments_ViewDetails').observe('click', function() {

                for (i = 0; i < documents.length; i++) {
                    if (documents[i]) {
                        if ($('myDocuments_check' + documents[i]['@doc_id']).checked) {
                            that.getDocumentMetaData(null, documents[i]['@doc_id']);
                            return;
                        }
                    }
                }
            } .bind(this));
        }
    },
	
    buildURL: function(xmlin) {
        var url = this.url;
        while (('url' in url.toQueryParams())) {
            url = url.toQueryParams().url;
        }
        url = (Object.isEmpty(Object.values(((url).toQueryParams()))[0])) ? url + '?xml_in=' : url + '&xml_in=';

        return url + xmlin;
    },

    saveChanges: function() {

        var documentID = this.curDocumentID;
        var documentComment = $('myDocuments_Comments').value;

        var xmlin = ''
            + ' <EWS>'
            + '     <SERVICE>DM_UPD_COMMENTS</SERVICE>'
            + '     <PARAM>'
            + '         <I_V_CONTENT_ID>' + documentID + '</I_V_CONTENT_ID>'
	        + '         <I_V_COMMENT>' + prepareTextToSend(documentComment) + '</I_V_COMMENT>'
            + '     </PARAM>'
            + ' </EWS>';

        this.makeAJAXrequest($H({ xml: xmlin,
            successMethod: 'onSuccess',
            xmlFormat: false
        }));
    },

    downloadDocuments: function(documents) {

        for (i = 0; i < documents.length; i++) {
            if (documents[i]) {
                var checkbox = $('myDocuments_check' + documents[i]['@doc_id']);
                if (checkbox && checkbox.checked) {
                    var xmlin = ''
                    + '<EWS>'
                        + '<SERVICE>DM_GET_FILE</SERVICE>'
                        + '<OBJECT TYPE=""/>'
                        + '<DEL/><GCC/><LCC/>'
                        + '<PARAM>'
                            + '<I_V_DOC_ID>' + documents[i]['@doc_id'] + '</I_V_DOC_ID>'
                        + '</PARAM>'
                    + '</EWS>';

                    var url = this.url;
                    while (('url' in url.toQueryParams())) {
                        url = url.toQueryParams().url;
                    }
                    url = (Object.isEmpty(Object.values(((url).toQueryParams()))[0])) ? url + '?xml_in=' : url + '&xml_in=';
                    window.open(url + xmlin, '', 'width=300,height=300,resizable=yes,scrollbars=yes,toolbar=no,location=no');
                }
            }
        }
    },	

    onSuccess: function(json) {

    },

    buildTreeData: function(json) {
		
		if(json.cat_tree){
			var treeRoot = $('myDocuments_CatalogContainer')
			treeRoot.update();
			var treeItems = objectToArray(json.cat_tree.yglui_str_ecm_dm_catalog_tree);
		
			if(json.cat_doc){
				var docItems = objectToArray(json.cat_doc.yglui_str_ecm_dm_catalog_doc);
			}
			var rootNodes = $A();
			var item;
			var docArray = $A();
			var parentElm;
			for(var x =0;x<=treeItems.length-1;x++){
				item = treeItems[x];
				if(item['@parent_id']==0){
					rootNodes.push(item);
				}
			}
			
			
			
			for(var x =0;x<=rootNodes.length-1;x++){
				item = rootNodes[x];
				parentElm = this.buildTreeHash(item);
				if(item['@has_child']=='X'){
					var parentChildren = this.getChildren(item['@node_id'],treeItems,docItems);
					var cNode = item['@node_id'];
					var curElm = parentElm;
					for(var y = 0; y<=parentChildren.length-1;y++){
						for(var yy =0; yy<=parentChildren.length-1;yy++){
							if(parentChildren[yy].get('parentId')==cNode){
								curElm.insert(parentChildren[yy].get('elm'));
							}
						}
						curElm = parentChildren[y].get('elm')
						cNode = parentChildren[y].get('elementId')
					}
					
				}
				if(item['@has_doc']=='X'){
					var docArray=this.getDocuments(item['@node_id'],docItems)
					for(var y=0; y<=docArray.length-1;y++){
						parentElm.insert(docArray[y]);
					}
				} 
				treeRoot.insert(parentElm);
			}

		}
    },
	
	
	getDocuments: function(nodeId,docItems){
		var docArray = $A();
		var auxData;
		var item;
		for(var x = 0; x<=docItems.length-1;x++){
			item = docItems[x];
			if(item['@node_id'] ==nodeId){
				auxData = objectToArray(item.documents.yglui_str_ecm_doc_list);
				for(var y = 0; y<=auxData.length-1;y++){
					docArray.push(this.buildDocHash(nodeId,auxData[y]));
				}
			}
		}
		return docArray;
	},
	
	buildDocHash:function(nodeId, data){
		var docClass;
		switch (data['@doc_format']) {
		case 'TEXT FILE':
			docClass = 'myDocuments_txtIcon';
			break;
		case 'ADOBE PDF':
			docClass = 'myDocuments_pdfIcon';
			break;
		case 'BITMAP':
		case 'PNG':
		case 'JPG':
			docClass = 'myDocuments_gifIcon';
			break;
		case 'MICROSOFT WORD 2007':
		case 'MICROSOFT WORD':
			docClass = 'myDocuments_docIcon';
			break;
		case 'MICROSOFT EXCEL':
			docClass = 'myDocuments_xlsIcon';
			break;
		default:
			docClass = 'myDocuments_txtIcon';
			break;
		}
		
		var elm = new Element('div',{
		'class': 'dm_catalog_folder'
		});
		
		var auxParent = new Element('div');
		elm.insert(auxParent);

		var auxIcon = new Element('div',{
		'class': docClass,
		'style': 'float: left;margin-left: 20px;margin-right:10px;'
		});
		auxParent.update(auxIcon);	
		
		var auxDiv = new Element('div',{
		'class': 'dm_catalog_labelcontainer'
		});
		auxParent.insert(auxDiv);
		
		var auxSpan = new Element('span',{
			'style': 'cursor: pointer;text-decoration: underline;'
		}).insert(data['@doc_name']);
		auxDiv.insert(auxSpan);
		
		auxSpan.observe('click',function(evt,data){
			var xmlin = ''
			+ '<EWS>'
				+ '<SERVICE>DM_GET_FILE</SERVICE>'
				+ '<OBJECT TYPE=""/>'
				+ '<DEL/><GCC/><LCC/>'
				+ '<PARAM>'
					+ '<I_V_DOC_ID>' + data['@doc_id'] + '</I_V_DOC_ID>'
				+ '</PARAM>'
			+ '</EWS>';

			var url = this.url;
			while (('url' in url.toQueryParams())) {
				url = url.toQueryParams().url;
			}
			url = (Object.isEmpty(Object.values(((url).toQueryParams()))[0])) ? url + '?xml_in=' : url + '&xml_in=';
			window.open(url + xmlin, '', 'width=300,height=300,resizable=yes,scrollbars=yes,toolbar=no,location=no');
		}.bindAsEventListener(this,data));
		
		auxSpan = new Element('span',{
			'class': 'application_action_link',
			'style': 'margin-left: 10px'
		}).insert(global.getLabel('DML_VIEW_DETAILS'));
		auxDiv.insert(auxSpan);
		
		
		auxSpan.observe('click',function(evt,data){
			this.getDocumentMetaData(null,data['@doc_id']);
		}.bindAsEventListener(this,data));
				
		return elm;
	},
	
	
	buildTreeHash: function(data){
	
		var elm = new Element('div',{
		'class': 'dm_catalog_folder'
		});
		
		var auxDiv = new Element('span',{
		'class': 'dm_catalog_folder_arrow application_down_arrow'
		});

		if(global.liteVersion){
			auxDiv.insert('?');
			auxDiv.addClassName('dm_catalog_down_lite');
		}
		
		elm.update(auxDiv);
		auxDiv.observe('click',function(evt){
			var elm = evt.element();
			var elmParentFolder = elm.parentNode;
			var childrenElm = elmParentFolder.childElements();
			
			var auxElm;
			for(var x = childrenElm.length-1; x>=0; x--){
				auxElm=childrenElm[x]
				if(auxElm.hasClassName('dm_catalog_folder')){
					if(auxElm.visible()){
						auxElm.hide();
					}else{
						auxElm.show();
					}
				}
			}
			
			
			if(elm.hasClassName('application_down_arrow')){
				elm.removeClassName('application_down_arrow');
				elm.addClassName('application_verticalR_arrow');
				if(global.liteVersion){
					elm.innerHTML = '?';
					if(elm.hasClassName('dm_catalog_down_lite')){
						elm.removeClassName('dm_catalog_down_lite');
						elm.addClassName('dm_catalog_up_lite');
					}
				}
			}else{
				elm.removeClassName('application_verticalR_arrow');
				elm.addClassName('application_down_arrow');
				if(global.liteVersion){
					elm.innerHTML = '?';
					if(elm.hasClassName('dm_catalog_up_lite')){
						elm.removeClassName('dm_catalog_up_lite');
						elm.addClassName('dm_catalog_down_lite');
					}
				}
			}
			
		}.bind(this));
		
		if(!global.liteVersion){
			auxDiv = new Element('div',{
			'class': 'application_jobFamily dm_cat_folder_icon',
			'style': 'margin-right: 10px;'
		}).insert('');
		
		elm.insert(auxDiv);
		}
		auxDiv = new Element('div',{
		'class': 'dm_catalog_labelcontainer'
		});
		elm.insert(auxDiv);
		auxDiv.update(data['@txt']);
		
		
		return elm;
	},
	
	getChildren: function(nodeId,treeItems,docItems,chArray){
		var items;
		var auxElm;
		var dataArray = $A();
		var childArray = (chArray)? chArray : $A();
		for(var x = 0; x<=treeItems.length-1;x++){
			var item = treeItems[x];
			if(item['@parent_id']==nodeId){
				var auxElm = this.buildTreeHash(item);
				
				if(item['@has_doc']=='X'){
					var dataArray = this.getDocuments(item['@node_id'],docItems);
					for(var y = 0; y<=dataArray.length-1;y++){
						auxElm.insert(dataArray[y]);
					}
				}
				childArray.push($H({'parentId':item['@parent_id'],'elm':auxElm,'elementId':item['@node_id']}));
				if(item['@has_child']=='X'){
					this.getChildren(item['@node_id'],treeItems,docItems,childArray);
				}
				
			}
			
			
		}
		return childArray;
	},
	
	
	
    toggleHandler: function(evt) {

        var span = evt.element();
        if (span.hasClassName('application_down_arrow')) {
            span.removeClassName('application_down_arrow');
            span.addClassName('application_verticalR_arrow');
        } else {
            span.removeClassName('application_verticalR_arrow');
            span.addClassName('application_down_arrow');
        }

        var divs = span.up().select('div.treeHandler_node');

        divs.each(function(div) {
            div.toggle();
        } .bind(this));

    }
});