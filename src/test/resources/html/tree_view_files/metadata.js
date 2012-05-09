var Metadata = Class.create(Menu, {

	__contentType: null,
    __viewMode: true,
	__cids: [],
    __ed: null,
    __multi: false,
    __saveBtn: null,
    __isExpired: false,
    __systemProp: null,
    __targetProp: null,
    __contextProp: null,
    __keywordsProp: null,
    __securityProp: null,
    __versionsProp: null,
    __translationsProp: null,
    __whereusedProp: null,
    ItemType: {
        label: 0,
        dropdown: 1,
        textbox: 2,
        checkbox: 3,
        popup: 4,
        boxes: 5,
        datetime: 6
    },
    __AC_contOwner: null,
    __AC_contApprvGrp: null,
    __AC_contType: null,
    __AC_JSON: function() {
        return {
            autocompleter: {
                object: [],
                multilanguage: {
                    no_results: global.getLabel('KM_NO_RESULTS'),
                    search: global.getLabel('KM_SEARCH')
                }
            }
        };
    },
    Metatada: {
        id: 'CC_CONTENT_ID',
        name: 'CC_CONT_NAME',
        summary: 'CC_SUMMARY',
        fileName: 'CC_CONT_FILE_NAME',
        fileType: 'CC_CTYPE',
        language: 'CC_LANGUAGE',
        creationDate: 'CC_CDATE',
        modificationDate: 'CC_MDATE',
        //owner: 'CC_OWNER',
        //approverGroup: 'CC_APPROVER_GRP',
        type: 'CC_CGROUP',
        version: 'CC_VERSION',
        status: 'CC_LOCKED_BY',
        isTemplate: 'CC_IS_TEMPLATE',
        positions: 'CC_POSITION',
        organizationUnits: 'CC_ORG_UNIT',
        personelNumbers: 'CC_PERS_NUMBER',
        countrySiteLocation: 'CC_COUNT_LOC_SITE',
        businessRoles: 'CC_BUSINESS_ROLE',
        personelArea: 'CC_PERS_AREA',
        personelSubArea: 'CC_PERS_SUB_AREA',
        employeeGroup: 'CC_EMPLOYEE_GROUP',
        employeeSubGroup: 'CC_EMPLOYEE_SUB_GROUP',
        anonymousAccess: 'CC_ACCESS_BY_EXTERNAL'
    },

    __MD_Config: function() {
        var c =
        [
        { 'id': 'systemProp',
            'title': global.getLabel('KM_SYSTEM_PROPERTIES'),
            'items':
        [
        { 'name': this.Metatada.id, 'label': global.getLabel('KM_CONTENT_ID'), 'type': this.ItemType.label, 'value': '', multi: false },
        { 'name': this.Metatada.name, 'label': global.getLabel('KM_NAME'), 'type': this.ItemType.textbox, 'value': '', multi: true },
        { 'name': this.Metatada.summary, 'label': global.getLabel('KM_SUMMARY'), 'type': this.ItemType.popup, 'value': '', multi: true },
        { 'name': this.Metatada.fileName, 'label': global.getLabel('KM_FILE_NAME'), 'type': this.ItemType.textbox, 'value': '', multi: false },
        { 'name': this.Metatada.fileType, 'label': global.getLabel('KM_FILE_TYPE'), 'type': this.ItemType.label, 'value': '', multi: false },
        { 'name': this.Metatada.language, 'label': global.getLabel('KM_LANGUAGE'), 'type': this.ItemType.boxes, 'value': '', multi: true },
        { 'name': this.Metatada.creationDate, 'label': global.getLabel('KM_CREATION_DATE'), 'type': this.ItemType.datetime, 'value': '', multi: false },
        { 'name': this.Metatada.modificationDate, 'label': global.getLabel('KM_MODIFICATION_DATE'), 'type': this.ItemType.datetime, 'value': '', multi: false },
            //{ 'name': this.Metatada.owner, 'label': global.getLabel('KM_OWNER'), 'type': this.ItemType.dropdown, 'value': '', multi: true },
            //{ 'name': this.Metatada.approverGroup, 'label': global.getLabel('KM_APPROVER_GROUP'), 'type': this.ItemType.dropdown, 'value': '', multi: true },
        {'name': this.Metatada.type, 'label': global.getLabel('KM_TYPE_OF_CONTENT'), 'type': this.ItemType.boxes, 'value': '', multi: true },
        { 'name': this.Metatada.version, 'label': global.getLabel('KM_VERSION'), 'type': this.ItemType.label, 'value': '', multi: false },
        { 'name': this.Metatada.status, 'label': global.getLabel('KM_CHECKED_OUT'), 'type': this.ItemType.label, 'value': '', multi: false },
        { 'name': this.Metatada.isTemplate, 'label': global.getLabel('KM_IS_A_TEMPLATE'), 'type': this.ItemType.checkbox, 'value': 'X', multi: true }
        ]
        },
        { 'id': 'targetProp',
            'title': global.getLabel('KM_TARGETING_TAGGING_PROPERTIES'),
            'items':
        [
        { 'name': this.Metatada.positions, 'label': global.getLabel('KM_POSITIONS'), 'type': this.ItemType.boxes, 'value': '', multi: true },
        { 'name': this.Metatada.organizationUnits, 'label': global.getLabel('KM_ORG_UNITS'), 'type': this.ItemType.boxes, 'value': '', multi: true },
        { 'name': this.Metatada.personelNumbers, 'label': global.getLabel('KM_PERSONEL_NUMBERS'), 'type': this.ItemType.boxes, 'value': '', multi: true },
        { 'name': this.Metatada.countrySiteLocation, 'label': global.getLabel('KM_COUNTRY_SITE_LOCATION'), 'type': this.ItemType.boxes, 'value': '', multi: true },
        { 'name': this.Metatada.businessRoles, 'label': global.getLabel('KM_BUSINESS_ROLES'), 'type': this.ItemType.boxes, 'value': '', multi: true },
        { 'name': this.Metatada.personelArea, 'label': global.getLabel('KM_PERSONEL_AREA'), 'type': this.ItemType.boxes, 'value': '', multi: true },
        { 'name': this.Metatada.personelSubArea, 'label': global.getLabel('KM_PERSONEL_SUB_AREA'), 'type': this.ItemType.boxes, 'value': '', multi: true },
        { 'name': this.Metatada.employeeGroup, 'label': global.getLabel('KM_EMPLOYEE_GROUP'), 'type': this.ItemType.boxes, 'value': '', multi: true },
        { 'name': this.Metatada.employeeSubGroup, 'label': global.getLabel('KM_EMPLOYEE_SUB_GROUP'), 'type': this.ItemType.boxes, 'value': '', multi: true },
        { 'name': this.Metatada.anonymousAccess, 'label': global.getLabel('KM_ANONYMOUS_ACCESS'), 'type': this.ItemType.checkbox, 'value': 'X', multi: true }
        ]
        },
        { 'id': 'keywordsProp', 'title': global.getLabel('KM_KEYWORDS'), 'items': [] },
        { 'id': 'versionsProp', 'title': global.getLabel('KM_VERSIONS'), 'items': [] },
        { 'id': 'translationsProp', 'title': global.getLabel('KM_TRANSLATIONS'), 'items': [] },
        { 'id': 'whereusedProp', 'title': global.getLabel('KM_WHERE_IS_CONTENT_USED') + '?', 'items': [] }

        ];
        return c;
    },

    initialize: function($super, id, options) {
        $super(id, options);
		this.getContentTypes();
        document.observe('EWS:kmContentSelected', function(e) {
            var args = getArgs(e);
            this.__cids = args.cids;
			this.__viewMode = args.viewMode;
            var isChecked = args.isChecked;
            this.__isExpired = args.isExpired;
            var isNoWeb = args.isNoWeb;
            if (!Object.isUndefined(args.editMode)) {
                var editMode = args.editMode;
                if (editMode) {
                    this.__buildSections();
                } else {
                    this.changeContent('');
                    return;
                }
            }
            if (this.__saveBtn) {
                if ((this.__cids.length > 0) && (isChecked || isNoWeb)) {
                    this.__saveBtn.enable('km_btn_save');
                } else {
                    this.__saveBtn.disable('km_btn_save');
                }
            }
            this.__multi = (this.__cids.length > 1);
            this.__toggleMultiContent();
            if (this.__cids.length == 1) {
                this.__getMetadata(this.__cids[0]);
                this.__getVersions(this.__cids[0]);
				this.__getTranslations(this.__cids[0]);
				
            } else {
                this.clearMetadata();
            }

        } .bindAsEventListener(this));

    },

    show: function($super, element) {
        $super(element);
        this.changeTitle(global.getLabel("KM_CONTENT_PROPERTIES"));

        var allowedApps = ['KM_BRWSR', 'KM_TESTA','CW_SPAG'];
        if (allowedApps.indexOf(global.currentApplication.appId) != -1) {
            this.__buildSections();
        }

    },
	
	getContentTypes: function(){
		var xmlin = '' +
        '<EWS>' +
            '<SERVICE>KM_GET_TYPES</SERVICE>' +
            '<OBJECT TYPE=""/>' +
            '<DEL/><GCC/><LCC/>' +
            '<PARAM>'+
			'</PARAM></EWS>';
        this.makeAJAXrequest($H({ xml:
            xmlin,
            successMethod: 'buildContentTypes',
            xmlFormat: false
        }));
	},
	
	buildContentTypes: function(json){
		this.__contentType = json;
	},

    __toggleMultiContent: function() {
        for (var k in this.Metatada) {
            if (this.Metatada.hasOwnProperty(k)) {
                var ck = $('km_properties_MC_' + this.Metatada[k]);
                if (ck) {
                    if (this.__multi) {
                        ck.show();
                    } else {
                        ck.hide();
                    }
                }
            }
        }
        var ck = $('km_properties_MC_CC_C_KEYWORDS');
        if (ck) {
            if (this.__multi) {
                ck.show();
            } else {
                ck.hide();
            }
        }



        if (this.__multi) {
            this.clearMetadata();
        }
    },

    __buildSections: function() {
        
		var container = new Element("div", {
            'id': 'km_properties_wdgt',
            'class': 'km_properties_wdgt',
            'style': 'text-align:left;width:234px;'
        });
        this.changeContent(container);

        var config = this.__MD_Config();

        this.newSection(container, config[0]);
        this.newSection(container, config[1]);
        this.newSection(container, config[2]);
        this.__buildKeywords();
        this.newSection(container, config[3]);
        this.newSection(container, config[4]);
        this.newSection(container, config[5]);
        this.__buildWhereused();



        this.__toggleMultiContent();
		if(!this.__viewMode){
			this.__buildSaveButton(container);
		}
        container.insert('<div style="clear:both;"></div>');

    },

    newSection: function(cont, config) {
        var tag = ((config.items.length > 0) ? 'ul' : 'div');
        var prop = new Element("div").update(
            '<div id="' + config.id + '" style="height:0.01%;">' +
                '<span id="' + config.id + '_arrow" style="float:left;">&#9658;</span>' +
                '<span style="height:0.01%;">' + (config.title) + '</span>' +
            '</div>' +
            '<' + tag + ' id="items' + config.id + '"></' + tag + '>' +
            '<div style="clear:both;"></div>'
        );
        cont.insert(prop);

        var ic = $('items' + config.id);

        ic.hide();
        config.items.each(function(i) {
            this.buildItem(ic, i);
        } .bind(this));

        var o = $(config.id);
        $(config.id).observe('click', function(id, ic) {
            var o = $(id + '_arrow');
            var t = o.innerHTML;
            if ((t == '&#9658;') || (t == '►')) {
                o.innerHTML = '&#9660;';
            } else {
                o.innerHTML = '&#9658;';
            }
            ic.toggle();
        } .bind(this, config.id, ic));
    },

    __getProperties: function() {

    },

    buildItem: function(sec, item) {
		var name = item.name;
        var label = item.label;
        var type = item.type;
        var value = item.value;
        var multi = item.multi;
        sec.insert(
            '<li class="item" style="">' +
                '<div class="col1">' + ((multi) ? '<input type="checkbox" id="km_properties_MC_' + name + '" />' : '') + '<span class="lbl">' + label + '&nbsp;:&nbsp;</span></div>' +
                '<div id="__' + name + '__" class="col2" style="_z-index:;"></div>' +
            '</li>'
        );
        if (multi) {
            $('km_properties_MC_' + name).hide();
        }
        var elmnt = $('__' + name + '__');

        switch (type) {
            case this.ItemType.label:
                elmnt.insert(new Element('span', { id: name + '_val' }).update(value));
                break;
            case this.ItemType.datetime:
                elmnt.insert(new Element('span', { id: name + '_val_d' }).update(value));
                elmnt.insert(new Element('span', { id: name + '_val_t' }).update(value));
                break;
            case this.ItemType.popup:
                var btnEdit = new Element('span', {
                    'class': 'edit',
                    'id': 'edit_' + name
                });
                elmnt.insert(new Element('input', {
                    'id': name + '_val',
                    'type': 'hidden',
                    'value': value
                }));
                elmnt.insert(new Element('span', { id: name + '_val_2' }));
                elmnt.insert(btnEdit);
                btnEdit.observe('click', this.__openEditPopup.bind(this, name, label, value));
                break;
            case this.ItemType.dropdown:
                var loadData = this['get_' + name].bind(this);
                if (loadData && Object.isFunction(loadData)) {
                    elmnt.insert(new Element('div', { 'id': 'AC_' + name }));
                    loadData();
                } else {
                    elmnt.insert(new Element('span', {}).update(value));
                }
                break;
            case this.ItemType.boxes:
					var bxCont = new Element('div', { 'id': name + '_val_2', 'style': 'float:left;' });
					elmnt.insert(new Element('input', {
						'id': name + '_val',
						'type': 'hidden',
						'value': value
					}));
					elmnt.insert(bxCont);
					if(!this.__viewMode){
						var btnAdd = new Element('span', {
							'id': 'add_' + name,
							'class': 'add'
						});
						elmnt.insert(btnAdd);
						btnAdd.observe('click', this.__openAddPopup.bind(this, bxCont, name, label, value));
					}
					this.__newItemBox(bxCont, value, value, name);
                break;
            case this.ItemType.textbox:
                if(!this.__viewMode){
					elmnt.insert(new Element('input', {
						'id': name + '_val',
						'type': 'text',
						'value': value,
						'class': 'text'
					}));
				}else{
					elmnt.insert(new Element('input', {
						'id': name + '_val',
						'type': 'text',
						'value': value,
						'class': 'text',
						'readonly': 'readonly'
					}));
				}
                elmnt.insert(new Element('input', {
                    'id': name + '_val_2',
                    'type': 'hidden',
                    'value': value,
                    'class': 'text'
                }));
                break;
            case this.ItemType.checkbox:
				var checkBoxOn = (!this.__viewMode)? false : true;
				elmnt.insert(new Element('input', {
                    'id': name + '_val',
                    'type': 'checkbox',
                    'value': value,
					'disabled': checkBoxOn
                }));
                break;
            default: ;
        };
    },

    __newItemBox: function(el, id, val, name, isRepeating,order) {
		
		if (val) {
            var rid = Math.floor(Math.random() * 100001);
            var h = '' +
            '<div id="' + rid + '_bx" class="multiSelect_item" style="font-size:10px;height:18px;">' +
            '   <div class="application_rounded multiSelect_border " style="width:4px;height:18px;border-bottom:1px solid #999999;">&nbsp;</div>' +
            '   <div class="multiSelect_text" id="anonymous_element_21" style="height:17px;line-height:16px;">' + val + '</div>' +
            '   <div class="multiSelect_closeButton application_rounded"  style="width:19px;height:18px;border-bottom:1px solid #999999;'+((!this.__viewMode)? 'cursor:text' : '')+'">' +
            '       <div id="' + rid + '_bxClose" class="'+((!this.__viewMode)? 'application_currentSelection multiSelect_alignClose': '')+'" style=";"></div>' +
            '   </div>' +
            '</div>';
            if (isRepeating) {
                el.insert(h);
            } else {
                el.update(h);
            }
            var closeBtn = $(rid + '_bxClose');
            closeBtn.observe('click', function(rid, name, id) {
                closeBtn.stopObserving();
                $(rid + '_bx').remove();
                var e = $(name + '_val');
                if (e) {
                    e.value = e.value.replace(id, '');
                }
            } .bind(this, rid, name, id));
        }
    },

    __openAddPopup: function(bxCont, name, label, value) {
        var html = '' +
        '<div>' +
        '   <span>' + global.getLabel('KM_ADD') + ' ' + label + '</span><br/>' +
        '   <div id="fldCont_' + name + '"></div>' +
        '</div><br/>' +
        '<div id="km_add_' + name + '_done"  style="text-align:center;margin-top:10px;margin-left:60px;"></div>';
        var popUp = new infoPopUp({
            closeButton: $H({
                'callBack': function() {
                    popUp.close();
                    delete popUp;
                }
            }),
            htmlContent: html,
            indicatorIcon: 'void',
            width: 280
        });
        popUp.create();

        var jn = { elements: [] };
        var done = {
            idButton: 'km_btn_done',
            label: global.getLabel('KM_DONE'),
            type: 'button',
            handler: function(n) {
                popUp.close();
                delete popUp;
                switch (n) {
                    case this.Metatada.type:
                        var v = this.__AC_CC_CGROUP	.getValue();
                        var e1 = $(n + '_val');
                        var e2 = $(n + '_val_2');
                        if (e1 && e2 && v) {
                            if (e1.value.indexOf(v.idAdded) == -1) {
                                e1.value = v.idAdded;
                                this.__newItemBox(e2, v.idAdded, v.textAdded, n, false);
                            }
                        }
                        break;
					case this.Metatada.language:
                        var v = this.__AC_CC_LANGUAGE.getValue();
                        var e1 = $(n + '_val');
                        var e2 = $(n + '_val_2');
                        if (e1 && e2 && v) {
                            if (e1.value.indexOf(v.idAdded) == -1) {
                                e1.value = v.idAdded;
                                this.__newItemBox(e2, v.idAdded, v.textAdded, n, false);
                            }
                        }
                        break;
                    case this.Metatada.personelNumbers:
						var v1 = this['__AC_CC_PERS_NUMBER_NAME'].getValue();
						//var v2 = this['__AC_CC_PERS_NUMBER_NUMBER'].getValue();
						var e1 = $(n + '_val');
                        var e2 = $(n + '_val_2');
                        if (e1 && e2 && (v1 || v2)) {
                            var vid = ((v1) ? v1.idAdded : v2.textAdded);
                            var vtxt = ((v1) ? v1.textAdded : v2.idAdded);
                            if (e1.value.indexOf(vid) == -1) {
                                switch (n) {
                                    case this.Metatada.positions:
                                    case this.Metatada.organizationUnits:
                                    case this.Metatada.businessRoles:
                                        e1.value = e1.value + '|' + vid;
                                        this.__newItemBox(e2, vid, vtxt, n, true);
                                        break;
                                    default:
                                        e1.value = vid;
                                        this.__newItemBox(e2, vid, vtxt, n, false);
                                        break;
                                }
                            }
                        }
                        break;
					
                    case this.Metatada.positions:
						//debugger;
						var v1 = this['__AC_CC_POSITION_NAME'].getValue();
						//var v2 = this['__AC_CC_POSITION_NUMBER'].getValue();
						var e1 = $(n + '_val');
                        var e2 = $(n + '_val_2');
                        if (e1 && e2 && (v1)) {
                            var vid = ((v1) ? v1.idAdded : v2.textAdded);
                            if (e1.value.indexOf(vid) == -1) {
                                switch (n) {
                                    case this.Metatada.positions:
                                    case this.Metatada.organizationUnits:
                                    case this.Metatada.businessRoles:
                                        e1.value = e1.value + '|' + vid;
                                        this.__newItemBox(e2, vid, v1.textAdded, n, true);
                                        break;
                                    default:
                                        e1.value = vid;
                                        this.__newItemBox(e2, vid, v1.textAdded, n, false);
                                        break;
                                }
                            }
                        }
                        break;
                    case this.Metatada.businessRoles:
						var v1 = this['__AC_CC_BUSINESS_ROLE_NAME'].getValue();
						var e1 = $(n + '_val');
                        var e2 = $(n + '_val_2');
                        if (e1 && e2 && (v1 || v2)) {
                            var vid = ((v1) ? v1.idAdded : v2.textAdded);
                            var vtxt = ((v1) ? v1.textAdded : v2.idAdded);
                            if (e1.value.indexOf(vid) == -1) {
                                switch (n) {
                                    case this.Metatada.positions:
                                    case this.Metatada.organizationUnits:
                                    case this.Metatada.businessRoles:
                                        e1.value = e1.value + '|' + vid;
                                        this.__newItemBox(e2, vid, vtxt, n, true);
                                        break;
                                    default:
                                        e1.value = vid;
                                        this.__newItemBox(e2, vid, vtxt, n, false);
                                        break;
                                }
                            }
                        }
                        break;	
                    case this.Metatada.organizationUnits:
						var v1 = this['__AC_CC_ORG_UNIT_NAME'].getValue();
						var v2 = this['__AC_CC_ORG_UNIT_NUMBER'].getValue();
						var e1 = $(n + '_val');
                        var e2 = $(n + '_val_2');
                        if (e1 && e2 && (v1 || v2)) {
                            var vid = ((v1) ? v1.idAdded : v2.textAdded);
                            var vtxt = ((v1) ? v1.textAdded : v2.idAdded);
							if(vtxt==''){
								vtxt = vid;
							}
                            if (e1.value.indexOf(vid) == -1) {
                                switch (n) {
                                    case this.Metatada.positions:
                                    case this.Metatada.organizationUnits:
                                    case this.Metatada.businessRoles:
                                        e1.value = e1.value + '|' + vid;
                                        this.__newItemBox(e2, vid, vtxt, n, true);
                                        break;
                                    default:
                                        e1.value = vid;
                                        this.__newItemBox(e2, vid, vtxt, n, false);
                                        break;
                                }
                            }
                        }
                        break;
                    case this.Metatada.employeeGroup:
						var v1 = this['__AC_CC_EMPLOYEE_GROUP_NAME'].getValue();
						var v2 = this['__AC_CC_EMPLOYEE_GROUP_NUMBER'].getValue();
						var e1 = $(n + '_val');
                        var e2 = $(n + '_val_2');
                        if (e1 && e2 && (v1 || v2)) {
                            var vid = ((v1) ? v1.idAdded : v2.textAdded);
                            var vtxt = ((v1) ? v1.textAdded : v2.idAdded);
							if(vtxt==''){
								vtxt = vid;
							}
                            if (e1.value.indexOf(vid) == -1) {
                                switch (n) {
                                    case this.Metatada.positions:
                                    case this.Metatada.organizationUnits:
                                    case this.Metatada.businessRoles:
                                        e1.value = e1.value + '|' + vid;
                                        this.__newItemBox(e2, vid, vtxt, n, true);
                                        break;
                                    default:
                                        e1.value = vid;
                                        this.__newItemBox(e2, vid, vtxt, n, false);
                                        break;
                                }
                            }
                        }
                        break;
					case this.Metatada.personelArea:
                        var v1 = this['__AC_CC_PERS_AREA_NAME'].getValue();
                        var v2 = this['__AC_CC_PERS_AREA_NUMBER'].getValue();
                        var v3 = '';
                        var v4 = '';					
                        var e1 = $('CC_PERS_AREA_val');
                        var e2 = $('CC_PERS_AREA_val_2');		
                        var e3 = $('CC_PERS_SUB_AREA_val');
                        var e4 = $('CC_PERS_SUB_AREA_val_2');					
                        if (e1 && e2 && (v1 || v2)) {
                            var vid = ((v1) ? v1.idAdded : v2.textAdded);
                            var vtxt = ((v1) ? v1.textAdded : v2.idAdded);
                            if (e1.value.indexOf(vid) == -1) {
                                switch (n) {
                                    case this.Metatada.positions:
                                    case this.Metatada.organizationUnits:
                                    case this.Metatada.businessRoles:
                                        e1.value = e1.value + '|' + vid;
										if (e1!=v1){
											e3.value = '';
											e4.update('');
										}
                                        this.__newItemBox(e2, vid, vtxt, n, true);
                                        break;
                                    default:
                                        e1.value = vid;
										if (e1!=v1){
											e3.value = '';
											e4.update('');
										}
                                        this.__newItemBox(e2, vid, vtxt, n, false);
                                        break;
                                }
                            }
                        }
                    case this.Metatada.employeeSubGroup:
                        var v1 = this['__AC_' + n + '_NAME'].getValue();
                        var v2 = this['__AC_' + n + '_NUMBER'].getValue();
                        var e1 = $(n + '_val');
                        var e2 = $(n + '_val_2');
                        if (e1 && e2 && (v1 || v2)) {
                            var vid = ((v1) ? v1.idAdded : v2.textAdded);
                            var vtxt = ((v1) ? v1.textAdded : v2.idAdded);
                            if (e1.value.indexOf(vid) == -1) {
                                switch (n) {
                                    case this.Metatada.positions:
                                    case this.Metatada.organizationUnits:
                                    case this.Metatada.businessRoles:
                                        e1.value = e1.value + '|' + vid;
                                        this.__newItemBox(e2, vid, vtxt, n, true);
                                        break;
                                    default:
                                        e1.value = vid;
                                        this.__newItemBox(e2, vid, vtxt, n, false);
                                        break;
                                }
                            }
                        }
                        break;					
					case this.Metatada.personelSubArea:
                        var v1 = this['__AC_CC_PERS_AREA_NAME'].getValue();
                        var v2 = this['__AC_CC_PERS_AREA_NUMBER'].getValue();
                        var v3 = this['__AC_CC_PERS_SUB_AREA_NAME'].getValue();
                        var v4 = this['__AC_CC_PERS_SUB_AREA_NUMBER'].getValue();						
                        var e1 = $('CC_PERS_AREA_val');
                        var e2 = $('CC_PERS_AREA_val_2');		
                        var e3 = $('CC_PERS_SUB_AREA_val');
                        var e4 = $('CC_PERS_SUB_AREA_val_2');						
                        if (e1 && e2 && (v1 || v2)) {
                            var vid = ((v1) ? v1.idAdded : v2.textAdded);
                            var vtxt = ((v1) ? v1.textAdded : v2.idAdded);
                            if (e1.value.indexOf(vid) == -1) {
                                switch (n) {
                                    case this.Metatada.positions:
                                    case this.Metatada.organizationUnits:
                                    case this.Metatada.businessRoles:
                                        e1.value = e1.value + '|' + vid;
                                        this.__newItemBox(e2, vid, vtxt, n, true);
                                        break;
                                    default:
                                        e1.value = vid;
                                        this.__newItemBox(e2, vid, vtxt, n, false);
                                        break;
                                }
                            }
                        }
                        if (e3 && e4 && (v3 || v4)) {
                            var vid2 = ((v3) ? v3.idAdded : v4.textAdded);
                            var vtxt2 = ((v3) ? v3.textAdded : v4.idAdded);
                            if (e3.value.indexOf(vid2) == -1) {
                                switch (n) {
                                    case this.Metatada.positions:
                                    case this.Metatada.organizationUnits:
                                    case this.Metatada.businessRoles:
                                        e3.value = e3.value + '|' + vid2;
                                        this.__newItemBox(e4, vid2, vtxt2, 'CC_PERS_SUB_AREA', true);
                                        break;
                                    default:
                                        e3.value = vid2;
                                        this.__newItemBox(e4, vid2, vtxt2, 'CC_PERS_SUB_AREA', false);
                                        break;
                                }
                            }
                        }						
                        break;					
                    case this.Metatada.countrySiteLocation:
                        var v1 = '', v2 = '', v3 = '';
                        try { v1 = this.__AC_CC_COUNT_LOC_SITE_country.getValue(); } catch (e) { }
                        try { v2 = this.__AC_CC_COUNT_LOC_SITE_location.getValue(); } catch (e) { }
                        try { v3 = this.__AC_CC_COUNT_LOC_SITE_site.getValue(); } catch (e) { }
                        var e1 = $(n + '_val');
                        var e2 = $(n + '_val_2');
                        if (e1 && e2 && v1) {
                            var v = v1.idAdded + ((v2) ? ';' + v2.idAdded : '') + ((v3) ? ';' + v3.idAdded : '');
                            var t = v1.textAdded + ((v2) ? ',' + v2.textAdded : '') + ((v3) ? ',' + v3.textAdded : '');
                            if (e1.value.indexOf(v) == -1) {
                                e1.value = e1.value + '|' + v;
                                this.__newItemBox(e2, v, t, n, true);
                            }
                        }
                        break;
                    default: ;
                }
            } .bind(this, name),
            standardButton: true
        };
        jn.elements.push(done);
        btns = new megaButtonDisplayer(jn);
        $('km_add_' + name + '_done').insert(btns.getButtons());
        this.__doneBtns = btns;

        var buildField = function(cont, n) {
            var fs;
            switch (n) {
				case this.Metatada.type: 
                case this.Metatada.language:
                    cont.insert(new Element('div', { 'id': 'AC_' + n }));
                    fs =
                    [
                        this['get_' + n]
                    ];
                    break;
                case this.Metatada.personelNumbers:
					cont.insert(
                        '<table>' +
                        '<tr><td><span>' + global.getLabel('KM_BY_NAME') + ' : </span></td><td><div style="margin-left:10px;" id="AC_' + n + '_NAME"></div></td></tr>' +
                        '</table>'
                    );
                    fs =
                    [
                        this['get_' + n]
                    ];
					break;
                case this.Metatada.positions:
                case this.Metatada.businessRoles:
					cont.insert(
                        '<table>' +
                        '<tr><td><span>' + global.getLabel('KM_BY_NAME') + ' : </span></td><td><div style="margin-left:10px;" id="AC_' + n + '_NAME"></div></td></tr>' +
                        '</table>'
                    );
                    fs =
                    [
                        this['get_' + n]
                    ];
                    break;
                case this.Metatada.organizationUnits:
                case this.Metatada.personelArea:
                case this.Metatada.employeeGroup:
                    cont.insert(
                        '<table>' +
                        '<tr><td><span>' + global.getLabel('KM_BY_NAME') + ' : </span></td><td><div style="margin-left:10px;" id="AC_' + n + '_NAME"></div></td></tr>' +
                        '<tr><td><span>' + global.getLabel('KM_BY_NUMBER') + ' : </span></td><td><div style="margin-left:10px;" id="AC_' + n + '_NUMBER"></div></td></tr>' +
                        '</table>'
                    );
                    fs =
                    [
                        this['get_' + n]
                    ];
                    break;
                case this.Metatada.personelSubArea:
                case this.Metatada.employeeSubGroup:
                    var nn;
                    if (n == this.Metatada.personelSubArea) {
                        nn = this.Metatada.personelArea;
                    }
                    if (n == this.Metatada.employeeSubGroup) {
                        nn = this.Metatada.employeeGroup;
                    }

                    this.__doneBtns.disable('km_btn_done');
                    cont.insert(
                        '<table>' +
                        '<tr><td colspan="2"><span>&#9658; ' + global.getLabel('KM_FIRST_SELECT_THE') + ' ' + nn + '</span></td></tr>' +
                        '<tr><td><span>' + global.getLabel('KM_BY_NAME') + ' : </span></td><td><div style="margin-left:10px;" id="AC_' + nn + '_NAME"></div></td></tr>' +
                        '<tr><td><span>' + global.getLabel('KM_BY_NUMBER') + ' : </span></td><td><div style="margin-left:10px;" id="AC_' + nn + '_NUMBER"></div></td></tr>' +
                        '<tr><td colspan="2"><span>&#9658; ' + global.getLabel('KM_THEN_SELECT_THE') + ' ' + n + '</span></td></tr>' +
                        '<tr><td><span>' + global.getLabel('KM_BY_NAME') + ' : </span></td><td><div style="margin-left:10px;" id="AC_' + n + '_NAME"></div></td></tr>' +
                        '<tr><td><span>' + global.getLabel('KM_BY_NUMBER') + ' : </span></td><td><div style="margin-left:10px;" id="AC_' + n + '_NUMBER"></div></td></tr>' +
                        '</table>'
                    );
                    fs =
                    [
                        this['get_' + nn],
                        this['get_' + n]
                    ];
                    break;
                case this.Metatada.countrySiteLocation:
                    cont.insert(
                        '<table>' +
                        '<tr><td><span>' + global.getLabel('KM_COUNTRY') + ' : </span></td><td><div style="margin-left:10px;" id="AC_' + n + '_country"></div></td></tr>' +
                        '<tr><td><span>' + global.getLabel('KM_LOCATION') + ' : </span></td><td><div style="margin-left:10px;" id="AC_' + n + '_location"></div></td></tr>' +
                        '<tr><td><span>' + global.getLabel('KM_SITE') + ' : </span></td><td><div style="margin-left:10px;" id="AC_' + n + '_site"></div></td></tr>' +
                        '</table>'
                    );
                    fs =
                    [
                        this['get_' + n + '_country'],
                        this['get_' + n + '_site'],
                        this['get_' + n + '_location']
                    ];
                    break;

                default: ;
            }
            fs.each(function(f) {
                if (f) {
                    var loadData = f.bind(this);
                    if (loadData && Object.isFunction(loadData)) {
                        loadData();
                    }
                }
            } .bind(this));
        } .bind(this);

        buildField($('fldCont_' + name), name);

    },

    __openEditPopup: function(name, label, value) {
		
		var div1 = new Element ('div').update(global.getLabel('KM_EDIT') + ' ' + label + '<br/><textarea>' + value + '</textarea>');
        var div2 = new Element ('div',{'style':'text-align:center;margin-top:10px;float:right;margin-right:40px;'});
		var wrapper = new Element ('div',{'class':'inlineContainer'});
		wrapper.insert(div1);
		wrapper.insert(div2);
        var popUp = new infoPopUp({
            closeButton: $H({
                'callBack': function() {
                    popUp.close();
                    delete popUp;
                }
            }),
            htmlContent: wrapper,
            indicatorIcon: 'void',
            width: 550
        });
        popUp.create();
        this.__ed = CKEDITOR.replace(div1.down('textarea'),
		{
		    toolbar:
		    [
		    ['Bold', 'Italic', 'Underline', 'Strike', 'Format', 'Undo', 'Redo', 'RemoveFormat'],
		    ['NumberedList', 'BulletedList', 'Outdent', 'Indent'],
		    ['Link', 'addLinkBtn', 'Image', 'HorizontalRule'],
		    ['MyButton']
		    ],
		    resize_enabled: false,
		    width: '510px',
		    uiColor: '#dcd2ce'
		});

        var jn = { elements: [] };
        var done = {
            idButton: 'km_btn_done',
            label: global.getLabel('KM_DONE'),
            type: 'button',
            handler: function(n) {
                var v = this.__ed.getData().replace(/(<([^>]+)>)/gi, '');
				var e1 = $('CC_' + name + '_val');
                var e2 = $('CC_' + name + '_val_2');
					if (e1 && v) {
						e1.value = v;
					}else{
						e1.value = '';
					}

					if (e2 && v) {
						var txt = v.stripTags();
						e2.update(txt.substr(0, 15) + ((txt.length > 15) ? '...' : ''));
						var b = $('edit_CC_' + n);

						if (b) {
							var c = this.__MD_Config();
							b.stopObserving();
							b.observe('click', this.__openEditPopup.bind(this, name, c[0].items[0].label, v));
						}
					}else{
						e2.update('');
						var b = $('edit_CC_' + n);
						if (b) {
							var c = this.__MD_Config();
							b.stopObserving();
							b.observe('click', this.__openEditPopup.bind(this, name, c[0].items[0].label, ''));
						}
					}
                popUp.close();
                delete popUp;
            } .bind(this, name),
            standardButton: true
        };
        jn.elements.push(done);
        btns = new megaButtonDisplayer(jn);
        div2.insert(btns.getButtons());
    },

    __buildSaveButton: function(cont) {

        var btnCont = new Element('div', {
            'style': 'float:right;'
        });
        cont.insert(btnCont);
        var jn = { elements: [] };
        var save = {
            idButton: 'km_btn_save',
            label: global.getLabel('KM_SAVE'),
            type: 'button',
            handler: this.saveProperties.bind(this),
            standardButton: true
        };
        jn.elements.push(save);
        btns = new megaButtonDisplayer(jn);
        btnCont.update(btns.getButtons());
        this.__saveBtn = btns;
        this.__saveBtn.disable('km_btn_save');
    },

    saveProperties: function() {
        var params = [];
        var cl = this.__cids.length;
        var config = this.__MD_Config();
        config.each(function(c) {
            c.items.each(function(i) {
                if ((i.multi && ($('km_properties_MC_' + i.name).checked)) || (cl == 1)) {
                    switch (i.type) {
                        case this.ItemType.textbox:
                        case this.ItemType.popup:
                        case this.ItemType.boxes:
                            var e = $(i.name + '_val');
                            if (e) {
                                if (i.name == this.Metatada.fileName) {
                                    var e2 = $(i.name + '_val_2');
                                    var v = (e.value && e2.value) ? [e.value + '.' + e2.value] : [];
                                    params.push({ name: i.name.replace('CC_', ''), values: v });
                                } else {
                                    var v = (e.value) ? e.value.split('|') : [];
                                    params.push({ name: i.name.replace('CC_', ''), values: v });
                                }
                            }
                            break;
                        case this.ItemType.checkbox:
                            var e = $(i.name + '_val');
                            if (e) {
                                var v = (e.checked) ? e.value.split(';') : [];
                                params.push({ name: i.name.replace('CC_', ''), values: v });
                            }
                            break;
                        case this.ItemType.dropdown:
                            var e = this['__AC_' + i.name];
                            if (e && e.getValue()) {
                                var v = e.getValue();
                                params.push({ name: i.name.replace('CC_', ''), values: [v.idAdded] });
                            }
                            break;
                        default: ;
                    }
                }
            } .bind(this));
        } .bind(this));

        if ($('km_properties_MC_CC_C_KEYWORDS').checked || (cl == 1)) {
            var e = $('CC_C_KEYWORDS' + '_val');
            if (e) {
                var v = (e.value) ? e.value.split(';') : [];
                params.push({ name: 'C_KEYWORDS', values: v });
            }
        }
        [['PERS_AREA', 'PERS_SUB_AREA', 'PERS_AREA_PERS_SUB'], ['EMPLOYEE_GROUP', 'EMPLOYEE_SUB_GROUP', 'EMP_GRP_EMP_SUB']].each(function(i) {

            var e1 = $('CC_' + i[0] + '_val');
            var e2 = $('CC_' + i[1] + '_val');
            var v = [e1.value + ';' + e2.value];
			if(v!=';'){
				params.push({ name: i[2], values: v });
			}
        });

        if (params.length > 0) {
            this.__cids.each(function(c) {
                var xmlin = '' +
            '<EWS>' +
            ' <SERVICE>KM_SET_METADAT2</SERVICE>' +
            ' <OBJECT TYPE=""/>' +
            ' <DEL/><GCC/><LCC/>' +
            ' <PARAM>' +
		    '  <I_V_CONTENT_ID>' + c + '</I_V_CONTENT_ID>' +
		    '  <I_I_METADATA>';
                params.each(function(p) {
                    xmlin += '<YGLUI_STR_ECM_KM_METADATAV2 FIELD_NAME="' + p.name + '"><VALUES>';
                    var vi = 1;
                    p.values.each(function(v) {
                        if (v) {
							if(p.name=='SUMMARY'){
							xmlin += '<YGLUI_STR_ECM_KM_META_VALV2 VALUE="' + prepareTextToSendCKeditor(v) + '" ORDER_ID="' + (vi++) + '"/>';
							}else{
								if(v.endsWith(';')){
									v = v.substring(0, v.length-1);
								}
							xmlin += '<YGLUI_STR_ECM_KM_META_VALV2 VALUE="' + prepareTextToSend(v) + '" ORDER_ID="' + (vi++) + '"/>';
							}
						}
                    }.bind(this));
                    if ((p.values.length == 0)) {
						if((p.name == 'IS_TEMPLATE') || (p.name == 'ACCESS_BY_EXTERNAL')){
							xmlin += '<YGLUI_STR_ECM_KM_META_VALV2 VALUE="" ORDER_ID="1" />';
						}
                        else{
							xmlin += '<YGLUI_STR_ECM_KM_META_VALV2 VALUE="" ORDER_ID="1" />';
						}
                    }
                    xmlin += '</VALUES></YGLUI_STR_ECM_KM_METADATAV2>';
                });
                xmlin += '</I_I_METADATA></PARAM></EWS>';
                this.makeAJAXrequest($H({
                    xml: xmlin,
                    successMethod: function(ret) {
                        var cid = ret.EWS.o_v_content_id;
                        cid = cid.replace(/^0{0,11}/, "");
                        if (cid > 0) {
                            document.fire('EWS:kmMetadataChanged', {
                                cid: cid
                            });
                            document.fire('EWS:kmFileNameChanged', {
                                cid: cid,
                                value: $('CC_CONT_FILE_NAME_val').value
                            });
                            document.fire('EWS:kmFileTitleChanged', {
                                cid: cid,
                                value: $('CC_CONT_NAME_val').value
                            });
                            document.fire('EWS:kmFileLangChanged', {
                                cid: cid,
                                value: $('CC_LANGUAGE_val').value
                            });
                        }
                    } .bind(this),
                    xmlFormat: false
                }));
            } .bind(this));
        }
    },

    __doRequest: function(service, callback, params) {
        var xmlin = '' +
        '<EWS>' +
            '<SERVICE>' + service + '</SERVICE>' +
            '<OBJECT TYPE=""/>' +
            '<DEL/><GCC/><LCC/>' +
            '<PARAM>';
        params.each(function(p) {
            xmlin += '<' + p.k + '>' + p.v + '</' + p.k + '>';
        });
        xmlin += '</PARAM></EWS>';
        this.makeAJAXrequest($H({ xml:
            xmlin,
            successMethod: callback,
            xmlFormat: false
        }));
    },


    __doRequest2: function(service, callback, ws, f, v, df, dv, dvl) {
        var xmlin = '' +
        '<EWS>' +
        ' <SERVICE>' + service + '</SERVICE>' +
        ' <OBJ TYPE="P">' + global.objectId + '</OBJ>' +
        ' <PARAM>' +
        '  <APPID>' + 'SADV_POM'/*global.currentApplication.appId*/ + '</APPID>' +
        '  <WID_SCREEN>' + ((ws) ? ws : '') + '</WID_SCREEN>' +
        '  <STR_KEY></STR_KEY>' +
        '  <FIELD FIELDID="' + ((f) ? f : '') + '" FIELDTECHNAME="' + ((f) ? f : '') + '" VALUE="' + ((v) ? v : '') + '" />' +
        '  <DEP_FIELDS>' +
        ((df) ? '<FIELD FIELDID="' + df + '" FIELDTECHNAME="' + df + '" VALUE="' + dv + '">' + ((dvl) ? dvl : '') + '</FIELD>' : '') +
        '  </DEP_FIELDS>' +
        '  <DEFAULT_VALUE></DEFAULT_VALUE>' +
        '  <DEFAULT_TEXT></DEFAULT_TEXT>' +
        '  <SEARCH_PATTERN></SEARCH_PATTERN>' +
        ' </PARAM>' +
        ' <DEL/>' +
        '</EWS>';
        this.makeAJAXrequest($H({ xml:
            xmlin,
            successMethod: callback,
            xmlFormat: false
        }));
    },

    get_CC_OWNER: function() {
        var js = this.__AC_JSON();
        this.__AC_CC_OWNER = new JSONAutocompleter('AC_CC_OWNER', { events: $H({}) }, js);
        this.__doRequest('DM_GET_TYPES', '__build_CC_OWNER', []);
    },
    get_CC_APPROVER_GRP: function() {
        var js = this.__AC_JSON();
        this.__AC_CC_APPROVER_GRP = new JSONAutocompleter('AC_CC_APPROVER_GRP', { events: $H({}) }, js);
        this.__doRequest('DM_GET_TYPES', '__build_CC_APPROVER_GRP', []);
    },
    get_CC_CGROUP: function() {
         var js = this.__AC_JSON();
        this.__AC_CC_CGROUP = new JSONAutocompleter('AC_CC_CGROUP', { events: $H({}) }, js);
        this.__doRequest('KM_GET_TYPES', '__build_CC_CGROUP', []); 
		var loadData = this['__build_CC_CGROUP'].bind(this);
		if (loadData && Object.isFunction(loadData)) {
			loadData(this.__contentType);
		}
    },
    get_CC_LANGUAGE: function() {
        var js = this.__AC_JSON();
        this.__AC_CC_LANGUAGE = new JSONAutocompleter('AC_CC_LANGUAGE', { events: $H({}) }, js);
        this.__doRequest('ECM_GET_LANGU', '__build_CC_LANGUAGE', []);
    },

    get_CC_POSITION: function() {
        var js = this.__AC_JSON();
        this.__AC_CC_POSITION_NAME = new JSONAutocompleter('AC_CC_POSITION_NAME', { events: $H({}) }, js);
        //this.__AC_CC_POSITION_NUMBER = new JSONAutocompleter('AC_CC_POSITION_NUMBER', { events: $H({}) }, js);
        this.__doRequest2('GET_STELL', '__build_CC_POSITION', 1, 'STELL');
    },
    get_CC_ORG_UNIT: function() {
        var js = this.__AC_JSON();
        this.__AC_CC_ORG_UNIT_NAME = new JSONAutocompleter('AC_CC_ORG_UNIT_NAME', { events: $H({}) }, js);
        this.__AC_CC_ORG_UNIT_NUMBER = new JSONAutocompleter('AC_CC_ORG_UNIT_NUMBER', { events: $H({}) }, js);
        this.__doRequest2('O_SEARCH', '__build_CC_ORG_UNIT', 1, 'ORGEH');
    },
    get_CC_PERS_NUMBER: function() {
        var js = this.__AC_JSON();
        this.__AC_CC_PERS_NUMBER_NAME = new JSONAutocompleter('AC_CC_PERS_NUMBER_NAME', { events: $H({}) }, js);
        //this.__AC_CC_PERS_NUMBER_NUMBER = new JSONAutocompleter('AC_CC_PERS_NUMBER_NUMBER', { events: $H({}) }, js);
        this.__doRequest('P_SEARCH', '__build_CC_PERS_NUMBER', []);
    },
    get_CC_COUNT_LOC_SITE_country: function() {
        var js = this.__AC_JSON();
        this.__AC_CC_COUNT_LOC_SITE_country = new JSONAutocompleter('AC_CC_COUNT_LOC_SITE_country', { events: $H({ 'onResultSelected': 'EWS:CC_COUNTRY_Sel' }) }, js);
        this.__doRequest('GET_COUNTRY', '__build_CC_COUNTRY', [{}]);
        document.stopObserving('EWS:CC_COUNTRY_Sel');
        document.observe('EWS:CC_COUNTRY_Sel', function() {
            var ccode;
            var v = this.__AC_CC_COUNT_LOC_SITE_country.getValue();
            if (v) {
                ccode = v.idAdded;
            } else {
                return;
            }
            this.__doRequest('KM_GET_REGION', '__build_CC_LOCATION', [{ k: 'I_V_LAND1', v: ccode}]);
        } .bindAsEventListener(this));
    },

    get_CC_COUNT_LOC_SITE_location: function() {
        var js = this.__AC_JSON();
        this.__AC_CC_COUNT_LOC_SITE_location = new JSONAutocompleter('AC_CC_COUNT_LOC_SITE_location', { events: $H({ 'onResultSelected': 'EWS:CC_LOCATION_Sel' }) }, js);
        document.stopObserving('EWS:CC_LOCATION_Sel');
        document.observe('EWS:CC_LOCATION_Sel', function() {
            var ccode, lcode;
            var v1 = this.__AC_CC_COUNT_LOC_SITE_country.getValue();
            var v2 = this.__AC_CC_COUNT_LOC_SITE_location.getValue();
            if (v1 && v2) {
                ccode = v1.idAdded;
                lcode = v2.idAdded;
            } else {
                return;
            }
            this.__doRequest('KM_GET_SITES', '__build_CC_SITE', [{ k: 'I_V_LAND1', v: ccode }, { k: 'I_V_REGION', v: lcode}]);
        } .bindAsEventListener(this));
    },

    get_CC_COUNT_LOC_SITE_site: function() {
        var js = this.__AC_JSON();
        this.__AC_CC_COUNT_LOC_SITE_site = new JSONAutocompleter('AC_CC_COUNT_LOC_SITE_site', { events: $H({}) }, js);
    },

    get_CC_BUSINESS_ROLE: function() {
        var js = this.__AC_JSON();
        this.__AC_CC_BUSINESS_ROLE_NAME = new JSONAutocompleter('AC_CC_BUSINESS_ROLE_NAME', { events: $H({}) }, js);
        this.__doRequest2('KM_GET_ROLE', '__build_CC_BUSINESS_ROLE');
    },
    get_CC_PERS_AREA: function() {
        var js = this.__AC_JSON();
        this.__AC_CC_PERS_AREA_NAME = new JSONAutocompleter('AC_CC_PERS_AREA_NAME', { events: $H({ 'onResultSelected': 'EWS:CC_PERS_AREA_Sel' }) }, js);
        this.__AC_CC_PERS_AREA_NUMBER = new JSONAutocompleter('AC_CC_PERS_AREA_NUMBER', { events: $H({ 'onResultSelected': 'EWS:CC_PERS_AREA_Sel' }) }, js);
        this.__doRequest2('GET_FIELD_VAL', '__build_CC_PERS_AREA', 1, 'WERKS');
        document.stopObserving('EWS:CC_PERS_AREA_Sel');
        document.observe('EWS:CC_PERS_AREA_Sel', function() {
            var pera, peral;
            var v1 = this.__AC_CC_PERS_AREA_NAME.getValue();
            var v2 = this.__AC_CC_PERS_AREA_NUMBER.getValue();
            if (v1) {
                pera = v1.idAdded;
                peral = v1.textAdded;
            } else if (v2) {
                pera = v2.textAdded;
                peral = v2.idAdded;
            } else {
                return;
            }
            this.__doRequest2('GET_FIELD_VAL', '__build_CC_PERS_SUB_AREA', 1, 'BTRTL', '', 'WERKS', pera, peral);
        } .bindAsEventListener(this));

    },
    get_CC_PERS_SUB_AREA: function() {

        var js = this.__AC_JSON();
        this.__AC_CC_PERS_SUB_AREA_NAME = new JSONAutocompleter('AC_CC_PERS_SUB_AREA_NAME', { events: $H({ 'onResultSelected': 'EWS:CC_PERS_SUB_AREA_Sel' }) }, js);
        this.__AC_CC_PERS_SUB_AREA_NUMBER = new JSONAutocompleter('AC_CC_PERS_SUB_AREA_NUMBER', { events: $H({ 'onResultSelected': 'EWS:CC_PERS_SUB_AREA_Sel' }) }, js);

        document.stopObserving('EWS:CC_PERS_SUB_AREA_Sel');
        document.observe('EWS:CC_PERS_SUB_AREA_Sel', function() {
            this.__doneBtns.enable('km_btn_done');
        } .bindAsEventListener(this));


    },
    get_CC_EMPLOYEE_GROUP: function() {
        var js = this.__AC_JSON();
        this.__AC_CC_EMPLOYEE_GROUP_NAME = new JSONAutocompleter('AC_CC_EMPLOYEE_GROUP_NAME', { events: $H({ 'onResultSelected': 'EWS:CC_EMPLOYEE_GROUP_Sel' }) }, js);
        this.__AC_CC_EMPLOYEE_GROUP_NUMBER = new JSONAutocompleter('AC_CC_EMPLOYEE_GROUP_NUMBER', { events: $H({ 'onResultSelected': 'EWS:CC_EMPLOYEE_GROUP_Sel' }) }, js);
        this.__doRequest2('GET_FIELD_VAL', '__build_CC_EMPLOYEE_GROUP', 1, 'PERSG');
        document.stopObserving('EWS:CC_EMPLOYEE_GROUP_Sel');
        document.observe('EWS:CC_EMPLOYEE_GROUP_Sel', function() {
            var empg, empg;
            var v1 = this.__AC_CC_EMPLOYEE_GROUP_NAME.getValue();
            var v2 = this.__AC_CC_EMPLOYEE_GROUP_NUMBER.getValue();
            if (v1) {
                empg = v1.idAdded;
                empgl = v1.textAdded;
            } else if (v2) {
                empg = v2.textAdded;
                empgl = v2.idAdded;
            } else {
                return;
            }
            this.__doRequest2('GET_FIELD_VAL', '__build_CC_EMPLOYEE_SUB_GROUP', 1, 'PERSK', '', 'PERSG', empg, empgl);

        } .bindAsEventListener(this));
    },
    get_CC_EMPLOYEE_SUB_GROUP: function() {

        var js = this.__AC_JSON();
        this.__AC_CC_EMPLOYEE_SUB_GROUP_NAME = new JSONAutocompleter('AC_CC_EMPLOYEE_SUB_GROUP_NAME', { events: $H({ 'onResultSelected': 'EWS:CC_EMPLOYEE_SUB_GROUP_Sel' }) }, js);
        this.__AC_CC_EMPLOYEE_SUB_GROUP_NUMBER = new JSONAutocompleter('AC_CC_EMPLOYEE_SUB_GROUP_NUMBER', { events: $H({ 'onResultSelected': 'EWS:CC_EMPLOYEE_SUB_GROUP_Sel' }) }, js);

        document.stopObserving('EWS:CC_EMPLOYEE_SUB_GROUP_Sel');
        document.observe('EWS:CC_EMPLOYEE_SUB_GROUP_Sel', function() {
            this.__doneBtns.enable('km_btn_done');
        } .bindAsEventListener(this));
    },

    __build_CC_OWNER: function(json) {
        var js = this.__AC_JSON();
        if (json.EWS.o_i_doc_type_list) {
            var items = objectToArray(json.EWS.o_i_doc_type_list.yglui_str_ecm_doc_type_list);
            items.each(function(i) {
                js.autocompleter.object.push({ data: i['@doc_type_id'], text: i['@doc_type_name'] });
            } .bind(this));
        }
        this.__AC_CC_OWNER.updateInput(js);
    },
    __build_CC_APPROVER_GRP: function(json) {
        var js = this.__AC_JSON();
        if (json.EWS.o_i_doc_type_list) {
            var items = objectToArray(json.EWS.o_i_doc_type_list.yglui_str_ecm_doc_type_list);
            items.each(function(i) {
                js.autocompleter.object.push({ data: i['@doc_type_id'], text: i['@doc_type_name'] });
            } .bind(this));
        }
        this.__AC_CC_APPROVER_GRP.updateInput(js);
    },
    __build_CC_CGROUP: function(json) {
 		var js = this.__AC_JSON();
        if (json.EWS.o_i_types) {
            var items = objectToArray(json.EWS.o_i_types.yglui_str_ecm_km_templates);
            items.each(function(i) {
                js.autocompleter.object.push({ data: i['@templates_type_id'], text: i['@name'] });
            } .bind(this));
        }
        this.__AC_CC_CGROUP.updateInput(js); 
    },

    __build_CC_LANGUAGE: function(json) {
        var js = this.__AC_JSON();
        console.log(json);
        if (json.EWS.o_i_langu) {
            var v = $('CC_LANGUAGE_val').value.split(';');
            var items = objectToArray(json.EWS.o_i_langu.yglui_str_ecm_langu);
            items.each(function(i) {
                js.autocompleter.object.push({ data: i['@langu'], text: i['@txt'] });
            } .bind(this));
        }
        js.autocompleter.object = js.autocompleter.object.without(v);
        this.__AC_CC_LANGUAGE.updateInput(js);
    },

    __build_CC_POSITION: function(json) {
        var jsName = this.__AC_JSON();
       // var jsNumber = this.__AC_JSON();
        if (json.EWS.o_values) {
            var items = objectToArray(json.EWS.o_values.item);
            items.each(function(i) {
                jsName.autocompleter.object.push({ data: i['@id'], text: i['@value'] });
              //  jsNumber.autocompleter.object.push({ data: i['@value'], text: i['@id'] });
            } .bind(this));
        }
        this.__AC_CC_POSITION_NAME.updateInput(jsName);
        //this.__AC_CC_POSITION_NUMBER.updateInput(jsNumber);
    },
    __build_CC_ORG_UNIT: function(json) {
        var jsName = this.__AC_JSON();
        var jsNumber = this.__AC_JSON();
        if (json.EWS.o_values) {
            var items = objectToArray(json.EWS.o_values.item);
            items.each(function(i) {
                jsName.autocompleter.object.push({ data: i['@id'], text: i['@value'] });
                jsNumber.autocompleter.object.push({ data: i['@value'], text: i['@id'] });
            } .bind(this));
        }
        this.__AC_CC_ORG_UNIT_NAME.updateInput(jsName);
        this.__AC_CC_ORG_UNIT_NUMBER.updateInput(jsNumber);
    },
    __build_CC_PERS_NUMBER: function(json) {
		var jsName = this.__AC_JSON();
        var jsNumber = this.__AC_JSON();
        if (json.EWS.o_values) {
            var items = objectToArray(json.EWS.o_values.item);
            items.each(function(i) {
                jsName.autocompleter.object.push({ data: i['@id'], text: i['@value'] });
                //jsNumber.autocompleter.object.push({ data: i['@value'], text: i['@id'] });
            } .bind(this));
        }
        this.__AC_CC_PERS_NUMBER_NAME.updateInput(jsName);
        //this.__AC_CC_PERS_NUMBER_NUMBER.updateInput(jsNumber);
    },
    __build_CC_COUNTRY: function(json) {
        var js = this.__AC_JSON();
        if (json.EWS.o_country) {
            var items = objectToArray(json.EWS.o_country.yglui_tab_country);
            items.each(function(i) {
                js.autocompleter.object.push({ data: i['@country_code'], text: i['@country_text'] });
            } .bind(this));
        }
        this.__AC_CC_COUNT_LOC_SITE_country.updateInput(js);
    },
    __build_CC_LOCATION: function(json) {
        var js = this.__AC_JSON();
        if (json.EWS.o_i_regions) {
            var items = objectToArray(json.EWS.o_i_regions.yglui_str_ecm_km_region);
            items.each(function(i) {
                js.autocompleter.object.push({ data: i['@regio'], text: i['#text'] });
            } .bind(this));
        }
        this.__AC_CC_COUNT_LOC_SITE_location.updateInput(js);
    },
    __build_CC_SITE: function(json) {
        var js = this.__AC_JSON();
        if (json.EWS.o_i_build) {
            var items = objectToArray(json.EWS.o_i_build.yglui_str_ecm_km_sites_info);
            items.each(function(i) {
                js.autocompleter.object.push({ data: i['@build'], text: i['@stext'] });
            } .bind(this));
        }
        this.__AC_CC_COUNT_LOC_SITE_site.updateInput(js);
    },
    __build_CC_BUSINESS_ROLE: function(json) {
        var jsName = this.__AC_JSON();
		if (json.EWS.o_i_roles) {
            var items = objectToArray(json.EWS.o_i_roles.yglui_str_ecm_kernel_rolid);
            items.each(function(i) {
				jsName.autocompleter.object.push({ data: i['@rolid'], text: i['@roltx'] });
            } .bind(this));
        }
        this.__AC_CC_BUSINESS_ROLE_NAME.updateInput(jsName);
    },
    __build_CC_PERS_AREA: function(json) {
        var jsName = this.__AC_JSON();
        var jsNumber = this.__AC_JSON();
        if (json.EWS.o_values) {
            var items = objectToArray(json.EWS.o_values.item);
            items.each(function(i) {
                jsName.autocompleter.object.push({ data: i['@id'], text: i['@value'] });
                jsNumber.autocompleter.object.push({ data: i['@value'], text: i['@id'] });
            } .bind(this));
        }
        this.__AC_CC_PERS_AREA_NAME.updateInput(jsName);
        this.__AC_CC_PERS_AREA_NUMBER.updateInput(jsNumber);
    },
    __build_CC_PERS_SUB_AREA: function(json) {
        var jsName = this.__AC_JSON();
        var jsNumber = this.__AC_JSON();
        if (json.EWS.o_values) {
            var items = objectToArray(json.EWS.o_values.item);
            items.each(function(i) {
                jsName.autocompleter.object.push({ data: i['@id'], text: i['@value'] });
                jsNumber.autocompleter.object.push({ data: i['@value'], text: i['@id'] });
            } .bind(this));
        }
        this.__AC_CC_PERS_SUB_AREA_NAME.updateInput(jsName);
        this.__AC_CC_PERS_SUB_AREA_NUMBER.updateInput(jsNumber);
    },
    __build_CC_EMPLOYEE_GROUP: function(json) {
        var js = this.__AC_JSON();
        if (json.EWS.o_values) {
            var items = objectToArray(json.EWS.o_values.item);
            items.each(function(i) {
                js.autocompleter.object.push({ data: i['@id'], text: i['@value'] });
            } .bind(this));
        }
        this.__AC_CC_EMPLOYEE_GROUP_NAME.updateInput(js);
        this.__AC_CC_EMPLOYEE_GROUP_NUMBER.updateInput(js);
    },
    __build_CC_EMPLOYEE_SUB_GROUP: function(json) {
        var jsName = this.__AC_JSON();
        var jsNumber = this.__AC_JSON();
        if (json.EWS.o_values) {
            var items = objectToArray(json.EWS.o_values.item);
            items.each(function(i) {
                jsName.autocompleter.object.push({ data: i['@id'], text: i['@value'] });
                jsNumber.autocompleter.object.push({ data: i['@value'], text: i['@id'] });
            } .bind(this));
        }
        this.__AC_CC_EMPLOYEE_SUB_GROUP_NAME.updateInput(jsName);
        this.__AC_CC_EMPLOYEE_SUB_GROUP_NUMBER.updateInput(jsNumber);
    },


    getMTVal: function(j) {
        var values = [];
        var items = objectToArray(j.values.yglui_str_ecm_km_meta_valv2);
        items.each(function(i) {
            if (i['@value']) {
                values.push({ id: i['@value'], val: ((i['@description']) ? i['@description'] : i['@value']) });
            }
        });
        return values;
    },
    __getMetadata: function(cid) {
        if (cid) {
            this.clearMetadata();
            this.makeAJAXrequest($H({ xml:
                '<EWS>' +
                    '<SERVICE>KM_GET_METADAT2</SERVICE>' +
                    '<OBJECT TYPE=""/>' +
                    '<DEL/><GCC/><LCC/>' +
                    '<PARAM>' +
                        '<I_V_CONTENT_ID>' + cid + '</I_V_CONTENT_ID>' +
                    '</PARAM>' +
                 '</EWS>',
                successMethod: '__buildMetadata',
                xmlFormat: false
            }));
        }
    },

    __buildMetadata: function(json) {
		if(!json.EWS.o_i_metadata){
			return;
		}
		
        var items = objectToArray(json.EWS.o_i_metadata.yglui_str_ecm_km_metadatav2);
        var c = this.__MD_Config();
        var countries = [], locations = [], sites = [];
		
		var summaryAllCaps = global.getLabel('KM_SUMMARY').toUpperCase();
		if ($('edit_CC_'+ summaryAllCaps))
			$('edit_CC_'+ summaryAllCaps).stopObserving();
		if($('edit_CC_'+ summaryAllCaps)){
			$('edit_CC_'+ summaryAllCaps).observe('click', function(){
				this.__openEditPopup(summaryAllCaps, global.getLabel('KM_SUMMARY'), '');
			}.bind(this));
		}	
		
        items.each(function(i) {
            var f = i['@field_name'];
            switch (f) {
                case 'CONTENT_ID':
                case 'CTYPE':
                    var e = $('CC_' + f + '_val');
                    var v = this.getMTVal(i);
                    if (e && (v.length > 0)) {
                        e.update(v[0].val);
                    }
                    break;
                case 'CGROUP':
					var e1 = $('CC_CGROUP_val');
                    var e2 = $('CC_CGROUP_val_2');
                    if (e1 && e2) {
                        e2.update('');
                        var values = this.getMTVal(i);
                        values.each(function(v) {
                            
							var id = v.id.split(';');
                            var val = v.val.split(';');
                            e1.value = id[0];
							var listItems = this.__contentType.EWS.o_i_types;
							var groupText;
							for(var ctr =0, len = listItems.yglui_str_ecm_km_templates.length;ctr<len;ctr++){
								if(listItems.yglui_str_ecm_km_templates[ctr]['@templates_type_id']==e1.value){
									groupText = listItems.yglui_str_ecm_km_templates[ctr]['@name']
									break;
								}else{
									groupText= e1.value;
								}
							}
                            this.__newItemBox(e2, id[0], groupText, 'CC_LANGUAGE', false);
                        } .bind(this));
					}
					break;
                case 'CONT_NAME':
                    var e = $('CC_' + f + '_val');
                    var v = this.getMTVal(i);
                    if (e && (v.length > 0)) {
                        e.value = prepareTextToEdit(v[0].val);
                    }
                    break;
                case 'CONT_FILE_NAME':
                    var e = $('CC_' + f + '_val');
                    var e2 = $('CC_' + f + '_val_2');
                    var v = this.getMTVal(i);
                    if (e && (v.length > 0)) {
                        var s = v[0].val;
                        var dot = s.lastIndexOf('.');
                        var ext = s.substring(dot + 1, s.length);
                        var name = s.substring(0, dot);
                        e.value = prepareTextToEdit(name);
                        e2.value = ext;
                    }
                    break;
                case 'CDATE':
                    var e = $(this.Metatada.creationDate + '_val_d');
                    var v = this.getMTVal(i);
                    if (e && (v.length > 0)) {
						var auxText = v[0].val;
						var sapFormatDate = auxText.substr(0, 4) + "-" + auxText.substr(4, 2) + "-" + auxText.substr(6, 2);
						var auxText = Date.parseExact(sapFormatDate, "yyyy-MM-dd").toString(global.dateFormat);
						e.update(auxText);
                    }
                    break;
                case 'CTIME':
                    var e = $(this.Metatada.creationDate + '_val_t');
                    var v = this.getMTVal(i);
                    if (e && (v.length > 0)) {
						var auxText = v[0].val.substr(0, 2) + ":" + v[0].val.substr(2, 2) + ":" + v[0].val.substr(2, 2);
						e.update(' ' + auxText);
                    }
                    break;
                case 'UDATE':
                    var e = $(this.Metatada.modificationDate + '_val_d');
                    var v = this.getMTVal(i);
                    if (e && (v.length > 0)) {
						var auxText = v[0].val;
						var sapFormatDate = auxText.substr(0, 4) + "-" + auxText.substr(4, 2) + "-" + auxText.substr(6, 2);
						var auxText = Date.parseExact(sapFormatDate, "yyyy-MM-dd").toString(global.dateFormat);
						e.update(auxText);
                    }
                    break;
                case 'UTIME':
                    var e = $(this.Metatada.modificationDate + '_val_t');
                    var v = this.getMTVal(i);
                    if (e && (v.length > 0)) {
						var auxText = v[0].val.substr(0, 2) + ":" + v[0].val.substr(2, 2) + ":" + v[0].val.substr(2, 2);
						e.update(' ' + auxText);
                    }
                    break;
                case 'LOCKED_BY':
                    var e = $('CC_' + f + '_val');
                    var v = this.getMTVal(i);
                    if (e && (v.length > 0)) {
                        e.update(((v[0].val) ? global.getLabel('KM_YES') + '(' + v[0].val + ')' : global.getLabel('KM_NO')));
                    }
                    break;
                case 'VERSION':
                    var e = $('CC_' + f + '_val');
                    var v = this.getMTVal(i);
                    if (e && (v.length > 0)) {
                        e.update(v[0].val + e.innerHTML);
                    }
                    break;
                case 'STATUS':
                    var e = $('CC_' + 'VERSION' + '_val');
                    var v = this.getMTVal(i);
                    if (e && (v.length > 0)) {
                        e.update(e.innerHTML + '&nbsp;&nbsp;(' + v[0].val + ')');
                    }
                    break;
                case 'SUMMARY':
                    var e1 = $('CC_' + f + '_val');
                    var e2 = $('CC_' + f + '_val_2');
                    var v = this.getMTVal(i);
                    if (e1 && e2 && (v.length > 0)) {
                        e1.value = v[0].val;
						var txt = v[0].val.stripTags();
                        e2.update(txt.substr(0, 12) + ((v[0].val.length > 12) ? '...' : ''));
                        var b = $('edit_CC_' + f);
                        if (b) {
                            b.stopObserving();
                            b.observe('click', this.__openEditPopup.bind(this, f, global.getLabel('KM_SUMMARY'), e1.value));
                        }
                    }
                    break;
				case 'LANGUAGE':
					var e1 = $('CC_LANGUAGE_val');
                    var e2 = $('CC_LANGUAGE_val_2');
                    if (e1 && e2) {
                        e2.update('');
                        var values = this.getMTVal(i);
                        values.each(function(v) {
                            var id = v.id.split(';');
                            var val = v.val.split(';');
                            e1.value = id[0];
                            this.__newItemBox(e2, id[0], val[0], 'CC_LANGUAGE', false);
                        } .bind(this));
					}
					break;
                case 'POSITION':
					var e1 = $('CC_POSITION_val');
                    var e2 = $('CC_POSITION_val_2');
                    if (e1 && e2) {
                        e2.update('');
                        var values = this.getMTVal(i);
                        values.each(function(v) {
                            var id = v.id.split(';');
                            var val = v.val.split(';');
                            e1.value = id[0];
                            this.__newItemBox(e2, id[0], val[0], 'CC_POSITION', false);
                        } .bind(this));
                    }
					break;				
                case 'ORG_UNIT':
                case 'PERS_NUMBER':
					var e1 = $('CC_PERS_NUMBER_val');
                    var e2 = $('CC_PERS_NUMBER_val_2');
                    if (e1 && e2) {
                        e2.update('');
                        var values = this.getMTVal(i);
                        values.each(function(v) {
                            var id = v.id.split(';');
                            var val = v.val.split(';');
                            e1.value = id[0];
                            this.__newItemBox(e2, id[0], val[0], 'CC_PERS_NUMBER', false);
                        } .bind(this));
                    }
					break;
                case 'BUSINESS_ROLE':
					var e1 = $('CC_BUSINESS_ROLE_val');
                    var e2 = $('CC_BUSINESS_ROLE_val_2');
                    if (e1 && e2) {
                        e2.update('');
                        var values = this.getMTVal(i);
                        values.each(function(v) {
                            var id = v.id.split(';');
                            var val = v.val.split(';');
                            e1.value = id[0];
                            this.__newItemBox(e2, id[0], val[0], 'CC_BUSINESS_ROLE', false);
                        } .bind(this));
                    }
					break;
                case 'COUNT_LOC_SITE':
					var e1 = $('CC_COUNT_LOC_SITE_val');
                    var e2 = $('CC_COUNT_LOC_SITE_val_2');
                    if (e1 && e2) {
                        e2.update('');
                        var values = this.getMTVal(i);
                        values.each(function(v) {
                            var id = v.id.split(';');
                            var val = v.val.split(';');
                            e1.value = id[0];
                            this.__newItemBox(e2, id[0], val[0], 'CC_COUNT_LOC_SITE', false);
                        } .bind(this));
                    }
					break;
                case 'PERS_AREA_PERS_SUB':
					var e1 = $('CC_PERS_AREA_val');
                    var e2 = $('CC_PERS_AREA_val_2');
                    if (e1 && e2) {
                        e2.update('');
                        var values = this.getMTVal(i);
                        values.each(function(v) {
                            var id = v.id.split(';');
                            var val = v.val.split(';');
                            e1.value = id[0];
                            this.__newItemBox(e2, id[0], val[0], 'CC_PERS_AREA', false);
                            this.__newItemBox(ee2, id[1], val[1], 'CC_PERS_SUB_AREA', false);
                        } .bind(this));
                    }
					break;
                case 'C_KEYWORDS':
                    var e1 = $('CC_' + f + '_val');
                    var e2 = $('CC_' + f + '_val_2');
                    if (e1 && e2) {
                        e2.update('');
                        var values = this.getMTVal(i);
                        values.each(function(v) {
                            e1.value = (e1.value) ? (e1.value + ';' + v.id) : v.id;
                            this.__newItemBox(e2, v.id, v.val, 'CC_' + f, true);
                        } .bind(this));
                    }
                    break;
				case 'PERS_SUB_AREA':
                    var e1 = $('CC_PERS_SUB_AREA_val');
                    var e2 = $('CC_PERS_SUB_AREA_val_2');
                    if (e1 && e2) {
                        e2.update('');
                        var values = this.getMTVal(i);
                        values.each(function(v) {
                            var id = v.id.split(';');
                            var val = v.val.split(';');
                            e1.value = id[0];
                            this.__newItemBox(e2, id[0], val[0], 'CC_PERS_SUB_AREA', false);
                        } .bind(this));
                    }
                    break;
				case 'PERS_AREA':
                    var e1 = $('CC_PERS_AREA_val');
                    var e2 = $('CC_PERS_AREA_val_2');
                    //var ee1 = $('CC_PERS_SUB_AREA_val');
                    //var ee2 = $('CC_PERS_SUB_AREA_val_2');
                    if (e1 && e2) {
                        e2.update('');
                        //ee2.update('');
                        var values = this.getMTVal(i);
                        values.each(function(v) {
                            var id = v.id.split(';');
                            var val = v.val.split(';');
                            e1.value = id[0];
                            //ee1.value = id[1];
                            this.__newItemBox(e2, id[0], val[0], 'CC_PERS_AREA', false);
                           //this.__newItemBox(ee2, id[1], val[1], 'CC_PERS_SUB_AREA', false);
                        } .bind(this));
                    }
                    break;				
                case 'EMP_GRP_EMP_SUB':
                    var e1 = $('CC_EMPLOYEE_GROUP_val');
                    var e2 = $('CC_EMPLOYEE_GROUP_val_2');
                    var ee1 = $('CC_EMPLOYEE_SUB_GROUP_val');
                    var ee2 = $('CC_EMPLOYEE_SUB_GROUP_val_2');
                    if (e1 && e2) {
                        e2.update('');
                        ee2.update('');
                        var values = this.getMTVal(i);
                        values.each(function(v) {
                            var id = v.id.split(';');
                            var val = v.val.split(';');
                            e1.value = id[0];
                            ee1.value = id[1];
                            this.__newItemBox(e2, id[0], val[0], 'CC_EMPLOYEE_GROUP', false);
                            this.__newItemBox(ee2, id[1], val[1], 'CC_EMPLOYEE_SUB_GROUP', false);
                        } .bind(this));
                    }
                    break;
                case 'IS_TEMPLATE':
                case 'ACCESS_BY_EXTERNAL':
                    var e = $('CC_' + f + '_val');
                    var v = this.getMTVal(i);
                    if (e && (v.length > 0)) {
                        e.value = 'X';
                        e.checked = ((v[0].val) && (v[0].val.toUpperCase() == 'X'));
                    }
                    break;
                case 'C_APPLICATION_RLNK':
                case 'C_CONTENT_RLNK':
                case 'C_HELP':
                case 'C_START_PAGE':
                case 'C_MENU':
                case 'C_IN_MENU':
                case 'C_HOME_PAGE':
                case 'C_JUMP_TO_LIST':
                    var e = $('CC_' + f + '_val');
                    if (e) {
                        var values = this.getMTVal(i);
                        if (!values || (values.length == 0)) {
                            e.update(global.getLabel('KM_NO_WHERE'));
                        }

                        values.each(function(v) {
                            var vs = v.val.split(';');
                            var span = new Element('span', { 'class': 'application_action_link', 'style': 'padding-left:6px;' }).update(vs.join('/'));
                            e.update(span);
                            switch (f) {
                                case 'C_APPLICATION_RLNK':
                                case 'C_CONTENT_RLNK':
                                case 'C_HELP':
                                case 'C_START_PAGE':
                                case 'C_HOME_PAGE':
                                case 'C_JUMP_TO_LIST':
                                    span.insert('(' + global.getLabel(vs[0]) + '/' + global.getLabel(vs[1]) + ')');
                                    span.observe('click', function() {
                                        global.open($H({
                                            app: {
                                                tabId: vs[0],
                                                appId: vs[1],
                                                view: (vs[2]) ? vs[2] : 'StartPage'
                                            },
                                            createContent: false,
                                            contentID: (vs[3]) ? vs[3] : ''
                                        }));
                                    } .bind(this));
                                    break;
                                case 'C_IN_MENU':
                                    span.insert('(' + global.getLabel(vs[0]) + '/' + global.getLabel(vs[1]) + ')');
                                    span.observe('click', function() {
                                        global.open($H({
                                            app: {
                                                tabId: vs[0],
                                                appId: vs[1],
                                                view: (vs[2]) ? vs[2] : 'StartPage'
                                            },
                                            createContent: false,
                                            contentID: (vs[3]) ? vs[3] : ''
                                        }));
                                    } .bind(this));
                                    break;
                            }
                            e.insert('<br/>');
                        } .bind(this));
                    }
                    break;
                /*case 'COUNTRY':
                var values = this.getMTVal(i);
                values.each(function(v) {
                countries.push(v);
                });
                break;
                case 'LOCATION':
                var values = this.getMTVal(i);
                values.each(function(v) {
                locations.push(v);
                });
                break;
                case 'SITE':
                var values = this.getMTVal(i);
                values.each(function(v) {
                sites.push(v);
                });
                break;
                break;*/ 


                default: ;
            }
        } .bind(this));

        /*var i = 0;
        var e1 = $('CC_COUNT_LOC_SITE_val');
        var e2 = $('CC_COUNT_LOC_SITE_val_2');
        if (e1 && e2) {
        for (i = 0; i < countries.length; i++) {
        var c = countries;
        var l = locations;
        var s = sites;
        var v = c[i].id + '|' + ((l.length > i) ? l[i].id : '_') + '|' + ((s.length > i) ? s[i].id : '_');
        var t = c[i].val + ((l.length > i) ? ',' + l[i].val : '') + ((s.length > i) ? ',' + s[i].val : '');
        e1.value = e1.value + ';' + v;
        this.__newItemBox(e2, v, t, 'CC_COUNT_LOC_SITE');
        }
        }*/
		
    },

    clearMetadata: function() {
        var e1 = $('CC_C_KEYWORDS_val');
        var e2 = $('CC_C_KEYWORDS_val_2');
        if (e1 && e2) {
            e1.value = '';
            e2.update('');
            if (this.__AC__keywords) {
                this.__AC__keywords.clearInput();
            }
        }
		
		if($('itemsversionsProp')){
			$('itemsversionsProp').update('');
		}
		if($('itemstranslationsProp')){
			$('itemstranslationsProp').update('');
		}

        var links = ['C_APPLICATION_RLNK', 'C_HELP', 'C_IN_MENU', 'C_START_PAGE', 'C_JUMP_TO_LIST'];

        links.each(function(l) {
            if ($('CC_' + l + '_val')) {
                $('CC_' + l + '_val').update(global.getLabel('KM_NO_WHERE'));
            }
        } .bind(this));


        var config = this.__MD_Config();
        config.each(function(c) {

            c.items.each(function(i) {
                switch (i.type) {
                    case this.ItemType.label:
                        var o = $(i.name + '_val');
                        if (o) {
                            o.update('');
                        }
                        break;
                    case this.ItemType.textbox:
                        var o = $(i.name + '_val');
                        if (o) {
                            o.value = '';
                        }
                        break;
                    case this.ItemType.datetime:
                        var od = $(i.name + '_val_d');
                        var ot = $(i.name + '_val_t');
                        if (od && ot) {
                            od.update('');
                            ot.update('');
                        }
                        break;
                    case this.ItemType.dropdown:
                        var ac = this['__AC_' + i.name];
                        if (ac) {
                            ac.clearInput();
                        }
                        break;
                    case this.ItemType.popup:
                    case this.ItemType.boxes:
                        var e1 = $(i.name + '_val');
                        var e2 = $(i.name + '_val_2');
                        if (e1 && e2) {
                            e1.value = '';
                            e2.update('');
                        }
                        break;
                    case this.ItemType.checkbox:
                        var e = $(i.name + '_val');
                        if (e) {
                            e.checked = false;
                        }
                        break;



                    default: ;
                }
            } .bind(this));
        } .bind(this));
		//this.__buildSections();
    },
    fillMetadata: function() {
        this.__buildMetadata();
    },

    __buildKeywords: function() {
        var html = '' +
        '<div style="float:left;"><input type="checkbox" id="km_properties_MC_CC_C_KEYWORDS" /><div id="CC_C_KEYWORDS_val_2" style="float:left;"></div>'+((!this.__viewMode)?'<span id="CC_C_KEYWORDS_add" class="add"></span>': '')+'<input type="hidden" id="CC_C_KEYWORDS_val"/></div><br/>' +
       ((!this.__viewMode)? '<div style="float:left;"><div style="float:left;">' + global.getLabel('KM_QUICK_ADD') + ':</div> <div id="__AC__CC_C_KEYWORDS"></div><div id="km_cp_Add_KW" style="float:right;"></div></div>': '') +
        '';
        var e = $('itemskeywordsProp');
        if (e) {
            
			e.update(html);

            $('km_properties_MC_CC_C_KEYWORDS').hide();
			

			
			if(!this.__viewMode){
			$('CC_C_KEYWORDS_add').observe('click', function() {
                this.createTaxPopUP();
            } .bind(this));
			
            var jn = { elements: [] };
            var add = {
                idButton: 'km_btn_add_kw',
                label: global.getLabel('KM_ADD'),
                type: 'button',
                handler: this.addKeyword.bindAsEventListener(this),
                standardButton: true
            };
            jn.elements.push(add);
            btns = new megaButtonDisplayer(jn);
            $('km_cp_Add_KW').update(btns.getButtons());
			
            var js = this.__AC_JSON();
            this.__AC__CC_C_KEYWORDS = new JSONAutocompleter('__AC__CC_C_KEYWORDS', {
                showEverythingOnButtonClick: true,
                timeout: 1000,
                templateResult: '#{text}',
                templateOptionsList: '#{text}',
                minChars: 2,
                noFilter: true,
                events: $H({ 'onGetNewXml': 'EWS:ACKWGetNewXml', 'onResultSelected': 'EWS:ACKWResultSelected' })
            }, js);
            document.observe('EWS:ACKWGetNewXml', this.getSuggestions.bindAsEventListener(this));
			}
            //document.observe('EWS:ACKWResultSelected', this.addKeyword.bindAsEventListener(this));
        }
    },

    addKeyword: function(e) {
        var v = this.__AC__CC_C_KEYWORDS.getValue();
        var e1 = $('CC_C_KEYWORDS_val');
        var e2 = $('CC_C_KEYWORDS_val_2');
        if (e1 && e2 && v) {
            if (e1.value.indexOf(v.idAdded) == -1) {
                e1.value = e1.value + ';' + v.idAdded;
				order = v.idAdded.split('_');
                this.__newItemBox(e2, v.idAdded, v.textAdded, 'CC_C_KEYWORDS',true,order[1]);
            }
        }
    },

    getSuggestions: function(e) {
        var kw = this.__AC__CC_C_KEYWORDS.element.value;
        if (kw) {
            this.makeAJAXrequest($H({ xml:
            ' <EWS>' +
            '    <SERVICE>KM_GET_SUGGEST2</SERVICE><DEL></DEL>' +
            '    <PARAM>' +
            '        <I_V_INPUT_CHAR>' + prepareTextToSend(kw) + '</I_V_INPUT_CHAR>' +
            '    </PARAM>' +
            '  </EWS>',
                successMethod: '__buildSuggestions'
            }));
        }
    },

    __buildSuggestions: function(json) {

        var js = this.__AC_JSON();

        if (json.EWS.o_i_words) {
            var items = objectToArray(json.EWS.o_i_words.yglui_str_ecm_keywords2);
            items.each(function(item) {
				//var taxHash = $H({'taxId': item['@tax_node_id'], 'taxOrder': item['@order_id']});
                js.autocompleter.object.push({ data: item['@tax_node_id']+'_'+item['@order_id'], text: item['@keyword'] });
            } .bind(this));
        }
        this.__AC__CC_C_KEYWORDS.updateInput(js);
        this.__AC__CC_C_KEYWORDS.show();
    },

    __getVersions: function(cid) {
        if (cid) {
            this.makeAJAXrequest($H({ xml:
                '<EWS>' +
                ' <SERVICE>KM_GET_CONT_VER</SERVICE>' +
                ' <OBJECT TYPE=""/>' +
                ' <DEL/><GCC/><LCC/>' +
                ' <PARAM>' +
                '  <I_V_CONTENT_ID>' + cid + '</I_V_CONTENT_ID>' +
                ' </PARAM>' +
                '</EWS>',
                successMethod: '__buildVersions'
            }));
        }
    },
    __buildVersions: function(json) {
        if (!json.EWS.o_i_cont_ver) {
            return;
        }
        var items = objectToArray(json.EWS.o_i_cont_ver.yglui_str_ecm_cont_versions);

        this.__versionPages = Math.ceil(items.length / 5);
        this.__versionPage = 1;
        var html = '<table>';

        if (this.__isExpired) {
            for (var i = 0; i < items.length; i++) {
                html += '' +
            '<tr id="km_Ver' + (i) + '">' +
            ' <td style="width:70%;"><span>' + items[i]['@version'] + '</span>&nbsp;<span style="color:#22AA22">(' + items[i]['@cdate'] + ((items[i]['@last']) ? ' ' + global.getLabel('KM_EXPIRED') : '') + ')</span></td>' +
            ((items[i]['@last']) ? ' <td><span class="application_action_link" id="km_VerView' + items[i]['@content_id'] + '">' + global.getLabel('KM_VIEW') + '</span>&nbsp;&nbsp;<span class="application_action_link" id="km_VerReinstate' + items[i]['@content_id'] + '">' + global.getLabel('KM_UN_EXPIRE') + '</span></td>' : '<td></td>') +
            '</tr>';
            }
        } else {
            for (var i = 0; i < items.length; i++) {
                html += '' +
            '<tr id="km_Ver' + (i) + '">' +
            ' <td style="width:70%;"><span>' + items[i]['@version'] + '</span>&nbsp;<span style="color:#22AA22">(' + items[i]['@cdate'] + ((items[i]['@last']) ? ' ' + global.getLabel('KM_LATEST') : '') + ')</span></td>' +
			((!this.__viewMode)?' <td><span class="application_action_link" id="km_VerView' + items[i]['@content_id'] + '">' + global.getLabel('KM_VIEW') + '</span>&nbsp;&nbsp;<span class="application_action_link" id="km_VerReinstate_old' + items[i]['@content_id'] + '">' + global.getLabel('KM_REINSTATE') + '</span></td>': '')+
            
            '</tr>';
            }
        }
        html +=
        '</table>' +
        '<span class="application_action_link" id="km_VerShowMore">' + global.getLabel('KM_SHOW_MORE') + '</span><br/>' +
        '<span class="application_action_link" id="km_VerShowLess">' + global.getLabel('KM_SHOW_LESS') + '</span>';
        var e = $('itemsversionsProp');
        if (e) {
            e.update(html);

            var e1 = $('km_VerShowMore');
            var e2 = $('km_VerShowLess');
            e2.hide();
            if (items.length < 5) {
                e1.hide();
            }
            e1.observe('click', function(e1) {
                e2.show();
                if (this.__versionPage < this.__versionPages) {
                    for (ii = (5 * this.__versionPage); ii < (5 * (this.__versionPage + 1)); ii++) {
                        var e = $('km_Ver' + ii);
                        if (e) {
                            e.show();
                        }
                    }
                    this.__versionPage++;
                    if (this.__versionPage == this.__versionPages) {
                        e1.hide();
                    }
                }
            } .bind(this, e1));
            e2.observe('click', function(e2) {
                e1.show();
                if (this.__versionPage > 1) {
                    for (ii = (5 * (this.__versionPage - 1)); ii < (5 * this.__versionPage); ii++) {
                        var e = $('km_Ver' + ii);
                        if (e) {
                            e.hide();
                        }
                    }
                    this.__versionPage--;
                    if (this.__versionPage == 1) {
                        e2.hide();
                    }
                }
            } .bind(this, e2));

            for (var i = 0; i < items.length; i++) {
                if (i >= 5) {
                    var e = $('km_Ver' + i);
                    if (e) {
                        e.hide();
                    }
                }
                var cid = items[i]['@content_id'];
                if ((!this.__isExpired) || (items[i]['@last'])) {
                    $('km_VerView' + cid).observe('click', function(cid) {
                        global.open($H({
                            app: {
                                tabId: global.currentApplication.tabId,
                                appId: "TST_SPAG",
                                view: "StartPage",
                                sbmid: "SC_CWB",
                                mnmid: "SC"
                            },
                            createContent: false,
                            contentID: cid
                        }));
                    } .bind(this, cid));
                }
                if ((this.__isExpired) && (items[i]['@last'])) {
                    $('km_VerReinstate' + cid).observe('click', function(cid) {
                        this.makeAJAXrequest($H({ xml:
                        '<EWS>' +
                        ' <SERVICE>KM_REINSTATE</SERVICE>' +
                        ' <OBJECT TYPE=""/>' +
                        ' <DEL/><GCC/><LCC/>' +
                        ' <PARAM>' +
                        '  <i_v_content_id>' + cid + '</i_v_content_id>' +
                        ' </PARAM>' +
                        '</EWS>',
                            successMethod: '__post_Reinstate'
                        }));
                    } .bind(this, cid));
                }
                if (!this.__isExpired) {
                    $('km_VerReinstate_old' + cid).observe('click', function(cid) {
                        this.makeAJAXrequest($H({ xml:
                        '<EWS>' +
                        ' <SERVICE>KM_REINST_OLD</SERVICE>' +
                        ' <OBJECT TYPE=""/>' +
                        ' <DEL/><GCC/><LCC/>' +
                        ' <PARAM>' +
                        '  <I_V_OLD_CONTENT_ID>' + cid + '</I_V_OLD_CONTENT_ID>' +
                        ' </PARAM>' +
                        '</EWS>',
                            successMethod: '__post_Reinstate'
                        }));
                    } .bind(this, cid));
                }
            }
        }
    },

    __post_Reinstate: function(ret) {
        document.fire('EWS:ReinstateContent', {});
        /*var ncid = ret.EWS.o_v_new_content_id;
        if (ncid) {
        ncid = ncid.replace(/^0{0,11}/, "");
        global.open($H({
        app: {
        tabId: global.currentApplication.tabId,
        appId: "TST_SPAG",
        view: "StartPage",
        sbmid: "SC_CWB",
        mnmid: "SC"
        },
        createContent: true,
        contentID: ncid
        }));
        }*/
    },

    __getTranslations: function(cid) {
        if (cid) {
            this.makeAJAXrequest($H({ xml:
                '<EWS>' +
                ' <SERVICE>KM_GET_TRANSLAT</SERVICE>' +
                ' <OBJECT TYPE=""/>' +
                ' <DEL/><GCC/><LCC/>' +
                ' <PARAM>' +
                '  <I_V_CONTENT_ID>' + cid + '</I_V_CONTENT_ID>' +
                ' </PARAM>' +
                '</EWS>',
                successMethod: '__buildTranslations'
            }));
        }
    },
    __buildTranslations: function(json) {
        var to = [], from = [], current = [], html = '';
        var trans = json.EWS.o_w_translations;
        if (trans) {
            var current = (trans.current_languages) ? objectToArray(trans.current_languages.yglui_str_ecm_km_language_key) : [];
            var from = (trans.from && trans.from.languages) ? objectToArray(trans.from.languages.yglui_str_ecm_km_language_key) : [];
            var to = (trans.to && trans.to.yglui_str_ecm_km_translations) ? objectToArray(trans.to.yglui_str_ecm_km_translations) : [];
            var cid = this.__cids[0];
            html += '<table style="margin-left:10px;">';
            html += '<tr>';
            html += '   <td id="lang_cid_' + cid + '">' + global.getLabel('KM_LANGUAGE') + ':&nbsp;';
            html += '   <span style="font-weight:bold;color:#22AA22" id="trans' + cid + '">';
            current.each(function(i) {
                html += i['@lang_txt'] + ' (' + i['@lang_key'] + '),&nbsp;';
            } .bind(this));
            html = html.replace(/(,&nbsp;)+$/, '');
            html += '   </span></td>';
            html += '</tr>';
            html += '<tr>';
            html += '   <td>' + global.getLabel('KM_TRANSLATED_FROM') + ':<br/>';
            from.each(function(i) {
                html += '&nbsp;&nbsp;<span style="font-weight:bold;color:#22AA22">' + i['@lang_txt'] + ' (' + i['@lang_key'] + ')</span>&nbsp;&nbsp;&nbsp;&nbsp;'+((!this.__viewMode)?'<span class="application_action_link" style="float:right;" id="trans' + ((trans.from && trans.from['@content_id']) ? trans.from['@content_id'] : '') + '">' + global.getLabel('KM_VIEW') + '</span><br/>':'');
            } .bind(this));
            html += '   </span></td>';
            html += '</tr>';
            html += '<tr>';
            html += '   <td>' + global.getLabel('KM_TRANSLATED_INTO') + ':<br/>';
            to.each(function(i) {
                var o = objectToArray(i.languages.yglui_str_ecm_km_language_key);
                o.each(function(j) {
                    var tid = ((i['@content_id']) ? i['@content_id'] : '');
                    html += '&nbsp;&nbsp;<span style="font-weight:bold;color:#22AA22">' + j['@lang_txt'] + ' (' + j['@lang_key'] + ')</span>&nbsp;&nbsp;&nbsp;&nbsp;'+((!this.__viewMode)?'<span class="application_action_link" style="float:right;" id="trans' + tid + '">' + global.getLabel('KM_VIEW') + '</span><br/>': '');
                } .bind(this));
            } .bind(this));
            html += '   </td>';
            html += '</tr>';
            html += '</table>';
        }
        html += '<div id="km_add_translation"></div>';

        var e = $('itemstranslationsProp');
        if (e) {
            e.update(html);
            if(!this.__viewMode){
			var jn = { elements: [] };
            var save = {
                idButton: 'km_btn_save',
                label: global.getLabel('KM_ADD_NEW_TRANSLATION'),
                type: 'button',
                handler: this.addNewTranslation.bind(this),
                standardButton: true
            };
            jn.elements.push(save);
            btns = new megaButtonDisplayer(jn);
            $('km_add_translation').update(btns.getButtons());
			}
             if (this.__cids[0]) {
                var cid = this.__cids[0];
                if ($('trans' + cid)) {
                    $('trans' + cid).stopObserving('click');
                    $('trans' + cid).observe('click', function() {
                        global.open($H({
                            app: {
                                tabId: global.currentApplication.tabId,
                                appId: "TST_SPAG",
                                view: "StartPage",
                                sbmid: "SC_CWB",
                                mnmid: "SC"
                            },
                            createContent: false,
                            contentID: cid
                        }));
                    } .bind(this));
                }
            } 

           if (trans.from && trans.from['@content_id']) {
                var cid = trans.from['@content_id'];
                if ($('trans' + cid)) {
                    $('trans' + cid).stopObserving('click');
                    $('trans' + cid).observe('click', function() {
                        global.open($H({
                            app: {
                                tabId: global.currentApplication.tabId,
                                appId: "TST_SPAG",
                                view: "StartPage",
                                sbmid: "SC_CWB",
                                mnmid: "SC"
                            },
                            createContent: false,
                            contentID: cid
                        }));
                    } .bind(this));
                }
            } 
        }
    },

    addNewTranslation: function() {
        var html = '' +
        '<div>' +
        '   <span>' + global.getLabel('KM_ADD_TRANSLATION_INTO') + '</span><br/>' +
        '   <div id="AC_TRANS_LANGUAGE"></div>' +
        '</div><br/>' +
        '<div id="km_add_translation_done"  style="text-align:center;margin-top:10px;margin-left:60px;"></div>';
        var popUp = new infoPopUp({
            closeButton: $H({
                'callBack': function() {
                    popUp.close();
                    delete popUp;
                }
            }),
            htmlContent: html,
            indicatorIcon: 'void',
            width: 210
        });
        popUp.create();

        var js = this.__AC_JSON();
        this.__AC_TRANS_LANGUAGE = new JSONAutocompleter('AC_TRANS_LANGUAGE', { events: $H({}) }, js);
        this.__doRequest('ECM_GET_LANGU', '__build_TRANS_LANGUAGE', []);

        var jn = { elements: [] };
        var done = {
            idButton: 'km_btn_done',
            label: global.getLabel('KM_DONE'),
            type: 'button',
            handler: function(n) {
                var v = this.__AC_TRANS_LANGUAGE.getValue();
                if (v && this.__cids.length == 1) {
                    this.makeAJAXrequest($H({ xml:
                    '<EWS>' +
                    ' <SERVICE>KM_NEW_TRANSLAT</SERVICE>' +
                    ' <OBJECT TYPE=""/>' +
                    ' <DEL/><GCC/><LCC/>' +
                    ' <PARAM>' +
                    '  <I_V_CONTENT_ID>' + this.__cids[0] + '</I_V_CONTENT_ID>' +
                    '  <I_V_LANGU_KEY>' + v.idAdded + '</I_V_LANGU_KEY>' +
                    ' </PARAM>' +
                    '</EWS>',
                        successMethod: function(ret) {
                            var tid = ret.EWS.o_v_translation_id;
                            tid = tid.replace(/^0{0,11}/, "");
                            if (tid > 0) {
                                document.fire('EWS:kmContentSelected', {
                                    cids: this.__cids
                                });
                                document.fire('EWS:kmTransaltionAdded', {
                                    cid: this.__cids[0]
                                });
                            }
                        } .bind(this)
                    }));
                }
                popUp.close();
                delete popUp;
            } .bind(this, name),
            standardButton: true
        };
        jn.elements.push(done);
        btns = new megaButtonDisplayer(jn);
        $('km_add_translation_done').insert(btns.getButtons());
    },

    __build_TRANS_LANGUAGE: function(json) {
        var js = this.__AC_JSON();
        if (json.EWS.o_i_langu) {
            //var v = $('CC_LANGUAGE_val').value.split(';');
            var items = objectToArray(json.EWS.o_i_langu.yglui_str_ecm_langu);
            items.each(function(i) {
                js.autocompleter.object.push({ data: i['@langu'], text: i['@txt'] });
            } .bind(this));
        }
        //js.autocompleter.object = js.autocompleter.object.without(v);
        this.__AC_TRANS_LANGUAGE.updateInput(js);
    },


    __getWhereused: function(cid) {
        /*if (cid) {
        this.makeAJAXrequest($H({ xml:
        '<EWS>' +
        ' <SERVICE>KM_where_used</SERVICE>' +
        ' <OBJECT TYPE=""/>' +
        ' <DEL/><GCC/><LCC/>' +
        ' <PARAM>' +
        '  <I_V_CONTent_ID>' + cid + '</I_V_CONTent_ID>' +
        ' </PARAM>' +
        '</EWS>',
        successMethod: '__buildWhereused'
        }));
        }*/
    },
    __buildWhereused: function() {
        var links = [
        { label: global.getLabel('KM_USED_AS_RELATED_LINK_ON'), id: 'C_APPLICATION_RLNK' },
        { label: global.getLabel('KM_USED_AS_HELP_ON'), id: 'C_HELP' },

        //{ label: global.getLabel('KM_USED_AS_APPLICATION_ON'), id: 'C_APPLICATION_RLNK' },
        {label: global.getLabel('KM_USED_IN_MENU_ON'), id: 'C_IN_MENU' },

        { label: global.getLabel('KM_USED_AS_HOME_START_PAGE_ON'), id: 'C_START_PAGE' },
        //{ label: global.getLabel('KM_USED_AS_START_PAGE_ON'), id: 'C_START_PAGE' },
        {label: global.getLabel('KM_USED_AS_JUMP_TO_LIST_ON'), id: 'C_JUMP_TO_LIST' }
        ];

        var html = '<table>';
        links.each(function(l) {
            html += '<tr><td>' + l.label + ':</td></tr><tr><td id="CC_' + l.id + '_val" style="padding-left:6px;font-weight:bold;color:#0099CC">' + global.getLabel('KM_NO_WHERE') + '</td></tr>';
        } .bind(this));
        html += '</table>';

        var e = $('itemswhereusedProp');
        if (e) {
            e.update(html);
        }
    },

    createTaxPopUP: function() {
        var html = ''
        + '<div style="width:100%;"><table style="width:100%;">'
        + '<tr>'
        + '</tr>'
        + '<tr>'
        + ' <td colspan="3"><div id="app_TaxonomyAuthoring"></div></td>'
        + '</tr>'
        + '<tr><td></td><td id="km_ok_cancel"></td></tr>'
        + '</table></div><br/>';

        var popUp = new infoPopUp({
            closeButton: $H({
                'callBack': function() {
                    popUp.close();
                    delete popUp;
                }
            }),
            htmlContent: html,
            indicatorIcon: 'void',
            width: 750
        });
        popUp.create();

        var TA = Class.create(TaxonomyAuthoring, {
            initialize: function($super, options) {
                $super(options);
            },
            run: function($super, args) {
                $super(args);
            },
            close: function($super) {
                $super();
            }
        });

        var taxBrowser = new TA({
            className: 'TaxonomyAuthoring',
            appId: 'KM_TAXAT',
            'selectionMode': true
        });

        taxBrowser.virtualHtml = $('app_TaxonomyAuthoring');
        taxBrowser.run();

        var jn = { elements: [] };
        var submit = {
            idButton: 'km_btn_submit',
            label: global.getLabel('KM_OK'),
            type: 'button',
            handler: function() {
                var keywords = taxBrowser.submitSelections();
                keywords.each(function(k) {
                    var e1 = $('CC_C_KEYWORDS_val');
                    var e2 = $('CC_C_KEYWORDS_val_2');
                    if (e1 && e2) {
                        if (e1.value.indexOf(k[1][0]) == -1) {
                            e1.value = e1.value + ';' + k[1][0]+'_'+k[1][2];
                            this.__newItemBox(e2, k[1][0], k[1][1], 'CC_C_KEYWORDS',true,k[1][2]);
                        }
                    }
                } .bind(this));
                popUp.close();
                delete popUp;
            } .bind(this),
            standardButton: true
        };
        var cancel = {
            idButton: 'km_btn_cancel',
            label: global.getLabel('KM_CANCEL'),
            type: 'button',
            handler: function() {
                popUp.close();
                delete popUp;
            } .bind(this),
            standardButton: true
        };

        jn.elements.push(submit);
        jn.elements.push(cancel);
        btns = new megaButtonDisplayer(jn);
        $('km_ok_cancel').insert(btns.getButtons());
    }



});