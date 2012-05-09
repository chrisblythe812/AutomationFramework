var ContentBrowser = Class.create(Application, {

    __browserCont: null,
    __actionsCont: null,
    __treeCont: null,
    __listCont: null,
    __multiSelect: true,
    __cChecked: 0,
    __nCkLocked: 0,
    __nCkMine: 0,
    __nCkWeb: 0,
    __nCkExpired: 0,
    __cids: null,
    __hltContent: false,
    __uploadModule: null,
    __cid_old_new: [],
    __checkOutForEdit: false,
    __folderTree: null,
    __treeArray: [],
    __selectedFolders: [],
    __fjson1: false,
    __fjson2: false,
    __ncOkBtns: null,
	__uploadBtns: null,
	__uploadPopup: null,
    __forceSelect_ID: null,
    __clipboard: {
        eid: null,
        fid: null,
        isFolder: false
    },

    initialize: function($super, options) {
        $super(options);
		this.__dmApprover = (global.usettingsJson.EWS.o_99eap == 'X')? true : false;
		//this.__dmApprover = true;
        if (!Object.isUndefined(options.multiSelect)) {
            this.__multiSelect = options.multiSelect;
        }

        document.observe('EWS:ReinstateContent', function(e) {
            this.getFC(this.__slfo);
        } .bindAsEventListener(this));

        document.observe('EWS:kmTransaltionAdded', function(e) {
            this.getFC(this.__slfo);
            var args = getArgs(e);
            this.__forceSelect_ID = args.cid;
        } .bindAsEventListener(this));

        document.observe('EWS:kmFileNameChanged', function(e) {
            var args = getArgs(e);
            cid = this.__cid_old_new[args.cid];
            if (!cid) {
                cid = args.cid;
            }
			if($('km_listCont_fn_' + cid))
            $('km_listCont_fn_' + cid).update(prepareTextToShow(args.value.escapeHTML()));
        } .bindAsEventListener(this));

        document.observe('EWS:kmFileTitleChanged', function(e) {
            var args = getArgs(e);
            cid = this.__cid_old_new[args.cid];
            if (!cid) {
                cid = args.cid;
            }
			if($('km_listCont_tl_' + cid))
            $('km_listCont_tl_' + cid).update(prepareTextToShow(args.value.escapeHTML()));
        } .bindAsEventListener(this));

        document.observe('EWS:kmFileLangChanged', function(e) {
            var args = getArgs(e);
            cid = this.__cid_old_new[args.cid];
            if (!cid) {
                cid = args.cid;
            }
			if($('km_listCont_lng_' + cid))
            $('km_listCont_lng_' + cid).update(args.value);
			if($('km_listCont_lng_ttip_' + cid))
            $('km_listCont_lng_ttip_' + cid).update(args.value);

        } .bindAsEventListener(this));

        this.__configTB();
    },

    run: function($super, args) {
        if (this.__multiSelect) {
            $super(args);
        }


        this.__slfo = 0;
        if (args && args.get("cid") && args.get("fid")) {

            this.__hltContent = true;
            this.__hltCid = args.get("cid");
            this.__hltFid = args.get("fid");
            this.__slfo = this.__hltFid;
        }

        if (this.firstRun || this.__hltContent) {
            this.bulidUI();
        }

        if (!this.firstRun) {
            var cids = this.getSelectedFiles();
            document.fire('EWS:kmContentSelected', {
                cids: cids,
                isNoWeb: (this.__nCkWeb == 0),
                isExpired: (this.__nCkExpired == this.__cChecked),
                isChecked: ((this.__nCkMine > 0) && (this.__nCkLocked == this.__nCkMine))
            });
        }
        document.observe("EWS:onNodeSelection", this.onNodeSelection.bindAsEventListener(this));
        document.observe("EWS:onCheckBoxClick", this.onCheckBoxClick.bindAsEventListener(this));

    },

    close: function($super) {
        $super();
        document.stopObserving("EWS:onNodeSelection");
        document.stopObserving("EWS:onCheckBoxClick");
    },

    bulidUI: function() {
        this.__browserCont = new Element('div', {
            'id': 'km_browserCont',
            'class': 'km_browserCont'
        });

        if (this.__multiSelect) {
            this.__actionsCont = new Element('div', {
                'id': 'km_actionsCont',
                'class': 'km_actionsCont'
            }).update();
        }

        this.__treeCont = new Element('div', {
            'id': 'km_treeCont',
            'class': 'km_treeCont'
        });

        this.__listCont = new Element('div', {
            'id': 'km_listCont',
            'class': 'km_listCont',
            'style': 'overflow:auto;'
        });

        var listptreeCont = new Element('div', {
            'id': 'km_listptreeCont',
            'class': 'km_listptreeCont',
            'style': 'overflow:auto;'
        });

        this.virtualHtml.update(this.__browserCont);

        if (this.__multiSelect) {
            this.__browserCont.insert(this.__actionsCont);
        }
        this.__browserCont.insert(listptreeCont);

        listptreeCont.insert(this.__treeCont);
        listptreeCont.insert(this.__listCont);

        if (this.__multiSelect) {
            this.__buildActUI();
        }
        if (this.__multiSelect) {
            this.__actionsCont.insert('<div style="display:block;clear:both;"><input type="checkbox" id="km_actionsCont_incExp" style="margin-top:8px;vertical-align:text-bottom;" value="X" />' + global.getLabel('KM_ALSO_SHOW_EXPIRED_CONTENT') + '</div>');
            this.__actionsCont.insert('<div style="clear:both;" />');
        }

        if (this.__multiSelect) {
            $('km_actionsCont_incExp').observe('click', function() {
                this.getFC(this.__slfo);
            } .bind(this));
        }

        this.__treeCont.update(
            '<div id="km_treeCont_path" class="km_treeCont_path">&nbsp;' + global.getLabel('KM_FOLDERS') + '</div>' +
            '<div id="km_treeCont_tree" class="km_treeCont_tree"></div>'
        );


        this.getFolders();
        if (this.__hltContent) {
            this.getFC(this.__slfo); ;
        }

        listptreeCont.insert('<div id="km_collapse_expand" class="km_collapse_horiz"></div>');

        var o = $('km_collapse_expand');

        o.observe('click', function(o) {
            o.toggleClassName('km_expand_horiz');
            o.toggleClassName('km_collapse_horiz');

            this.__treeCont.toggle();

            if (this.__treeCont.visible()) {
                this.__listCont.setStyle({ 'width': '80%' });
            } else {
                this.__listCont.setStyle({ 'width': '98%' });
            }

            $('km_th_vn').toggle();
            $('km_th_lo').toggle();

            this.__cids.each(function(cid) {
                $('km_td_vn_' + cid).up('td').toggle();
                $('km_td_lo_' + cid).up('td').toggle();
            } .bind(this));

        } .bind(this, o));
    },


    __buildActUI: function() {

        var jn = { elements: [] };

        var newContentAct = {
            idButton: 'km_actionsCont_newContentAct',
            label: global.getLabel('KM_NEW_CONTENT'),
            type: 'button',
            handler: this.newC.bind(this),
            standardButton: true
        };
        jn.elements.push(newContentAct);

        var newFolderAct = {
            idButton: 'km_actionsCont_newFolderAct',
            label: global.getLabel('KM_NEW_FOLDER'),
            type: 'button',
            handler: this.newF.bind(this),
            standardButton: true
        };
        jn.elements.push(newFolderAct);

        var checkOutAct = {
            idButton: 'km_actionsCont_checkOutAct',
            label: global.getLabel('KM_CHECK_OUT'),
            type: 'button',
            handler: this.checkO.bind(this),
            standardButton: true
        };
        jn.elements.push(checkOutAct);

        var checkInAct = {
            idButton: 'km_actionsCont_checkInAct',
            label: global.getLabel('KM_CHECK_IN'),
            type: 'button',
            handler: this.checkI.bind(this),
            standardButton: true
        };
        jn.elements.push(checkInAct);

        var approveAct = {
            idButton: 'km_actionsCont_approveAct',
            label: (this.__dmApprover)? global.getLabel('KM_REQUEST_APPROVAL') : global.getLabel('KM_APPROVE'),
            type: 'button',
            handler: this.aprv.bind(this),
            standardButton: true
        };
        jn.elements.push(approveAct);

        var deleteAct = {
            idButton: 'km_actionsCont_deleteAct',
            label: global.getLabel('KM_DELETE'),
            type: 'button',
            handler: this.delC.bind(this),
            standardButton: true
        };
        jn.elements.push(deleteAct);

        var exportAct = {
            idButton: 'km_actionsCont_exportAct',
            label: global.getLabel('KM_EXPORT'),
            type: 'button',
            handler: this.exportD.bind(this),
            standardButton: true
        };
        jn.elements.push(exportAct);

        var importAct = {
            idButton: 'km_actionsCont_importAct',
            label: global.getLabel('KM_IMPORT'),
            type: 'button',
            handler: this.importD.bind(this),
            standardButton: true
        };
        jn.elements.push(importAct);

        this.__btns = new megaButtonDisplayer(jn);

        this.__btns.disable('km_actionsCont_newContentAct');
        this.__btns.disable('km_actionsCont_newFolderAct');
        this.__btns.disable('km_actionsCont_checkInAct');
        this.__btns.disable('km_actionsCont_checkOutAct');
        this.__btns.disable('km_actionsCont_approveAct');
        this.__btns.disable('km_actionsCont_deleteAct');
		
       var json = ({
               elements:[]
       });		
		
		var km_viewExportStatus = ({
                        label: global.getLabel('KM_VIEW_EXPORT_STATUS'),
                        idButton:'km_viewExportStatus',
                        className: (!global.liteVersion)?'application_action_link': '',
                        type: 'button',
						handler: this.ExportStatus.bindAsEventListener(this),
                        standardButton: (!global.liteVersion)? true : false
        });
        json.elements.push(km_viewExportStatus);
		
		var km_viewImportStatus = ({
                        label: global.getLabel('KM_VIEW_IMPORT_STATUS'),
                        idButton:'km_viewImportStatus',
                        className: (!global.liteVersion)?'application_action_link': '',
                        type: 'button',
						handler: this.ImportStatus.bindAsEventListener(this),
						standardButton: (!global.liteVersion)? true : false
        });
        json.elements.push(km_viewImportStatus);
		
		var km_downloadLastExport = ({
                        label: global.getLabel('Download Last Export'),
                        idButton:'km_downloadLastExport',
                        className: (!global.liteVersion)?'application_action_link': '',
                        type: 'button',
						handler: this.downloadLastExport.bindAsEventListener(this),
                        standardButton: (!global.liteVersion)? true : false
        });
        json.elements.push(km_downloadLastExport);
		
		var buttonDisplayer = new megaButtonDisplayer(json);
	
		var div = new Element ('div',{
				style:'float:right;margin-top:5px;width:100%;'
				}).insert(buttonDisplayer.getButtons());	
				
		this.__actionsCont.insert(this.__btns.getButtons());
		this.__actionsCont.insert(div);			
    },

	ImportStatus : function(e){
		var xmlin = '<EWS><SERVICE>ECM_IMPORT_LOG</SERVICE><OBJECT TYPE=""/><DEL/><GCC/><LCC/><PARAM><I_V_ACTION>F</I_V_ACTION></PARAM></EWS>';
		this.makeAJAXrequest($H({ xml: xmlin,
			successMethod: function(json) {
				if (json.EWS.o_i_full_log) {
					var items = (json.EWS.o_i_full_log.yglui_str_ecm_export_log) ? objectToArray(json.EWS.o_i_full_log.yglui_str_ecm_export_log) : [];
					var html = '<strong>' + global.getLabel('KM_IMPORT_STATUS') + '</strong><br/><div style="width:580px;height:300px;overflow:auto;"><ul>';
					for (var i = 0; i < items.length; i++) {
						html += '<li>' + items[i]['@status'] + '</li>';
					}
					html += '</ul></div>';
					var popUp = new infoPopUp({
						closeButton: $H({
							'callBack': function() {
								popUp.close();
								delete popUp;
							} .bind(this)
						}),
						htmlContent: html,
						indicatorIcon: 'void',
						width: 600
					});
					popUp.create();
				}
			} .bind(this)
		}));
	},	

	ExportStatus : function(e){
		var s;
		if ($('km_viewExportStatus')) {
			s = 'ECM_EXPORT_LOG';
		} else if($('km_viewImportStatus')){
			s = 'ECM_IMPORT_LOG';
		}
		var xmlin = '<EWS><SERVICE>ECM_EXPORT_LOG</SERVICE><OBJECT TYPE=""/><DEL/><GCC/><LCC/><PARAM><I_V_ACTION>F</I_V_ACTION></PARAM></EWS>';
		this.makeAJAXrequest($H({ xml: xmlin,
			successMethod: function(json) {
				if (json.EWS.o_i_full_log) {
					var items = (json.EWS.o_i_full_log.yglui_str_ecm_export_log) ? objectToArray(json.EWS.o_i_full_log.yglui_str_ecm_export_log) : [];
					var html = '<strong>' + global.getLabel('KM_EXPORT_STATUS') + '</strong><br/><div style="width:580px;height:300px;overflow:auto;"><ul>';
					for (var i = 0; i < items.length; i++) {
						html += '<li>' + items[i]['@status'] + '</li>';
					}
					html += '</ul></div>';
					var popUp = new infoPopUp({
						closeButton: $H({
							'callBack': function() {
								popUp.close();
								delete popUp;
							} .bind(this)
						}),
						htmlContent: html,
						indicatorIcon: 'void',
						width: 600
					});
					popUp.create();
				}
			} .bind(this)
		}));
	},		
	
	downloadLastExport: function(documents) {
		var xmlin = ''
		+ '<EWS>'
			+ '<SERVICE>ECM_GET_PACK</SERVICE>'
			+ '<DEL></DEL>'
		+ '</EWS>';

		var url = this.url;
		while (('url' in url.toQueryParams())) {
			url = url.toQueryParams().url;
		}
		url = (Object.isEmpty(Object.values(((url).toQueryParams()))[0])) ? url + '?xml_in=' : url + '&xml_in=';
		window.open(url + xmlin, '', 'width=300,height=300,resizable=yes,scrollbars=yes,toolbar=no,location=no');
	},		

    __noItem: function() {
        var html = '' +
        '   <table class="sortable resizable">' +
        '       <thead>' +
        '           <tr>' +
        '               <th style="text-indent:1px;" class="table_nosort">' + ((this.__multiSelect) ? '<input type="checkbox" id="km_listCont_ck_all" />' : '') + '</th>' +
        '               <th>' + global.getLabel('KM_FILE_NAME') + '</th>' +
        '               <th>' + global.getLabel('KM_TITLE') + '</th>' +
        '               <th>' + global.getLabel('KM_TYPE') + '</th>' +
        '               <th>' + global.getLabel('KM_DATE') + '</th>' +
        '               <th>' + global.getLabel('KM_LANGUAGE') + '</th>' +
        '               <th id="km_th_vn">' + global.getLabel('KM_VERSION') + '</th>' +
        '               <th id="km_th_lo">' + global.getLabel('KM_LOCK_OWNER') + '</th>' +
        ((this.__multiSelect) ? '<th>' + global.getLabel('KM_ACTIONS') + '</th>' : '') +
        '           </tr>' +
        '       </thead>' +
        '       <tbody ' + ((!Prototype.Browser.IE) ? 'style="height:100%"' : '') + '>' +
        '           <tr><td colspan="9">' + global.getLabel('KM_NO_ITEM') + '</td></tr>' +
        '       </tbody>' +
        '   </table>';
        this.__listCont.update('<div id="km_listCont_path" class="km_listCont_path">' + global.getLabel('KM_PATH') + ':' + this.getPath(this.__slfo) + '</div>');
		this.__listCont.insert(html);

        TableKit.Sortable.init(this.__listCont.down('table'), {
            marginL: 10,
            autoLoad: false,
            resizable: false
        });
        return false;
    },
    __buildListUI: function(json) {

        if (!json.EWS.o_i_folder_contents) {
            return this.__noItem();
        }

        var path = this.getPath(this.__slfo);
        var isSystem = path.startsWith(global.getLabel('KM_SYSTEM_CONTENT'));

        var items = objectToArray(json.EWS.o_i_folder_contents.yglui_str_ecm_km_cont_details);
        var html = '' +
        '   <table class="sortable resizable" style="">' +
        '       <thead>' +
        '           <tr>' +
        '               <th style="text-indent:1px;" class="table_nosort">' + ((this.__multiSelect) ? '<input type="checkbox" id="km_listCont_ck_all" />' : '') + '</th>' +
        '               <th>' + global.getLabel('KM_FILE_NAME') + '</th>' +
        '               <th>' + global.getLabel('KM_TITLE') + '</th>' +
        '               <th>' + global.getLabel('KM_TYPE') + '</th>' +
        '               <th>' + global.getLabel('KM_DATE') + '</th>' +
        '               <th>' + global.getLabel('KM_LANGUAGE') + '</th>' +
        '               <th id="km_th_vn">' + global.getLabel('KM_VERSION') + '</th>' +
        '               <th id="km_th_lo">' + global.getLabel('KM_LOCK_OWNER') + '</th>' +
        ((this.__multiSelect) ? '<th>' + global.getLabel('KM_ACTIONS') + '</th>' : '') +
        '           </tr>' +
        '       </thead>' +
        '       <tbody ' + ((!Prototype.Browser.IE) ? 'style="height:' + ((items.length > 18) ? '407px' : '100%') + '"' : '') + '>';
        this.__cids = [];
        items.each(function(i) {
			var cid = (i['@content_id']).replace(/^0{0,11}/, "");
			if (cid>0){
				this.__cids.push(cid);
				var locked = (i['@locked_by']);
				var emp = i['@pernr'];
				var isWeb = (i['@is_web'] && (i['@is_web'].toUpperCase() == 'X'));
				var isExpired = (i['@is_expired'] && (i['@is_expired'].toUpperCase() == 'X'));
				var mine = (emp == global.objectId);
				var cls = '';
				if (locked) {
					if (mine) {
						cls = 'km_listCont_edit application_editSelection2';
					} else {
						cls = 'km_listCont_lock application_lock';
					}
				}
				var allowEdit = isWeb;
				if (isSystem) {
					allowEdit = false;
				}
				html += '' +
				'<tr id="km_listCont_c_' + cid + '">' +
				'   <td style="cursor:pointer;text-indent:1px;padding-left:1px;">' + ((this.__multiSelect) ? '<input type="checkbox" id="km_listCont_ck_' + cid + '" value="' + cid + '" title="' + i['@title'] + '" />' : '<input type="radio" id="km_listCont_ck_' + cid + '" name="km_listCont_ck" value="' + cid + '" title="' + i['@title'] + '" isweb="' + ((isWeb) ? 1 : 0) + '" />') + '</td>' +
				'   <td style="word-wrap:break-word;cursor:pointer;">' +
				'       <input type="hidden" id="km_listCont_is_locked' + cid + '" value="' + ((locked) ? 1 : 0) + '"/>' +
				'       <input type="hidden" id="km_listCont_is_mine' + cid + '" value="' + ((mine) ? 1 : 0) + '"/>' +
				'       <input type="hidden" id="km_listCont_is_web' + cid + '" value="' + ((isWeb) ? 1 : 0) + '"/>' +
				'       <input type="hidden" id="km_listCont_is_expired' + cid + '" value="' + ((isExpired) ? 1 : 0) + '"/>' +
				'       <input type="hidden" id="km_listCont_new_id' + cid + '" value="' + cid + '" />' +
				'       <div style="float:left;word-wrap:break-word;" id="km_listCont_fn_' + cid + '">' + prepareTextToShow(i['@file_name']) + '</div>' +
				'       <div class="' + cls + '" id="km_listCont_lock_' + cid + '"></div>' +
				'   </td>' +										
				'   <td style="cursor:pointer;"><span id="km_listCont_tl_' + cid + '">' + prepareTextToShow(i['@title']) + '</span></td>' +
				'   <td style="cursor:pointer;">' + i['@type'] + '</td>' +
				'   <td style="cursor:pointer;">' + i['@date'] + '</td>' +
				'   <td style="cursor:pointer;"><span id="km_listCont_lng_' + cid + '">' + (i['@lang_key'] || '') + '</span><div id="km_listCont_lng_ttip_' + cid + '" style="position:absolute;border:2px solid #CCCCCC;padding:2px;background-color:#ffffff;" class="">' + (i['@lang_txt'] || '') + '</div></td>' +
				'   <td style="cursor:pointer;"><span id="km_td_vn_' + cid + '">' + i['@version'] + '</span></td>' +
				'   <td style="cursor:pointer;"><span id="km_td_lo_' + cid + '">' + (i['@locked_by'] || '-') + '</span></td>' +
				((this.__multiSelect) ? '   <td style="cursor:pointer;padding-right:17px;width:60px;">' +
				'       <span' + ((isExpired)?  '' : ' class="application_action_link"') + ' id="km_listCont_view_' + cid + '">' + global.getLabel('KM_VIEW') + '</span>&nbsp;&nbsp;&nbsp;' +
				((allowEdit) ? '       <span' + (((!locked || mine) && (!isExpired))? ' class="application_action_link"' : '') + ' id="km_listCont_edit_ac_' + cid + '">' + global.getLabel('KM_EDIT') + '</span>' : '') +
				'   </td>' : '') +
				'</tr>';
			}
        } .bind(this));

        html += '' +
        '       </tbody>' +
        '   </table>';
        this.__listCont.update('<div id="km_listCont_path" class="km_listCont_path">' + global.getLabel('KM_PATH') + ':' + this.getPath(this.__slfo) + '</div>');
		this.__listCont.insert(html);
        TableKit.Sortable.init(this.__listCont.down('table'), {
            marginL: 10,
            autoLoad: false,
            resizable: false
        });

        if (this.__multiSelect) {
            this.__btns.disable('km_actionsCont_checkInAct');
            this.__btns.disable('km_actionsCont_checkOutAct');
            this.__btns.disable('km_actionsCont_approveAct');
            this.__btns.disable('km_actionsCont_deleteAct');
        }

        (__regev = function(items) {
            if (this.__multiSelect) {
                var o = $('km_listCont_ck_all');
                o.observe('click', function(o, items) {
                    items.each(function(i) {
                        if (i) {
                            var cid = (i['@content_id']).replace(/^0{0,11}/, "");
                            $('km_listCont_ck_' + cid).checked = o.checked;
                        }
                    } .bind(this));

                    var cids = this.getSelectedFiles();
                    document.fire('EWS:kmContentSelected', {
                        cids: cids,
                        isNoWeb: (this.__nCkWeb == 0),
                        isExpired: (this.__nCkExpired == this.__cChecked),
                        isChecked: ((this.__nCkMine > 0) && (this.__nCkLocked == this.__nCkMine))
                    });

                    if (o.checked && !isSystem) {
                        this.__cChecked = items.length;
                        this.__btns.enable('km_actionsCont_checkInAct');
                        this.__btns.enable('km_actionsCont_checkOutAct');
                        this.__btns.enable('km_actionsCont_approveAct');
                        this.__btns.enable('km_actionsCont_deleteAct');
                    } else {
                        this.__cChecked = 0;
                        this.__btns.disable('km_actionsCont_checkInAct');
                        this.__btns.disable('km_actionsCont_checkOutAct');
                        this.__btns.disable('km_actionsCont_approveAct');
                        this.__btns.disable('km_actionsCont_deleteAct');
                    }
                } .bind(this, o, items));
            }

            $('km_th_vn').hide();
            $('km_th_lo').hide();

            items.each(function(i) {
                if (i) {

                    var cid = (i['@content_id']).replace(/^0{0,11}/, "");
                    var locked = i['@locked_by'];
                    var emp = i['@pernr'];
                    var isWeb = (i['@is_web'] && (i['@is_web'].toUpperCase() == 'X'));
                    var isExpired = (i['@is_expired'] && (i['@is_expired'].toUpperCase() == 'X'));
                    var allowEdit = isWeb;
                    if (isSystem) {
                        allowEdit = false;
                    }
					if($('km_td_vn_' + cid))
                    $('km_td_vn_' + cid).up('td').hide();
					if($('km_td_lo_' + cid))
                    $('km_td_lo_' + cid).up('td').hide();

                    //$('km_listCont_edit_' + cid).hide();
                    if($('km_listCont_lng_ttip_' + cid))
					$('km_listCont_lng_ttip_' + cid).hide();

					if($('km_listCont_c_' + cid))
                    $('km_listCont_c_' + cid).observe('click', function(cid) {
                        ;
                    } .bind(this, cid));

                    var langElem = $('km_listCont_lng_' + cid);
                    if (langElem) {
                        langElem.observe('mouseover', function(e, cid) {
                            var ttip = $('km_listCont_lng_ttip_' + cid);
                            var x = Event.pointerX(e);
                            var y = Event.pointerY(e);
                            ttip.setStyle({ 'top': y, 'left': x });
                            ttip.show();
                        } .bindAsEventListener(this, cid));

                        langElem.observe('mouseout', function(cid) {
                            $('km_listCont_lng_ttip_' + cid).hide();
                        } .bind(this, cid));
                    }

                    if (this.__multiSelect) {
						if($('km_listCont_ck_' + cid))
                        $('km_listCont_ck_' + cid).observe('click', function(cid) {
                            var locked = parseInt($('km_listCont_is_locked' + cid).value);
                            var mine = parseInt($('km_listCont_is_mine' + cid).value);
                            var web = parseInt($('km_listCont_is_web' + cid).value);
                            var expired = parseInt($('km_listCont_is_expired' + cid).value);
                            if ($('km_listCont_ck_' + cid).checked) {
                                this.__cChecked++;
                                this.__nCkLocked += (locked) ? 1 : 0;
                                this.__nCkMine += (mine) ? 1 : 0;
                                this.__nCkWeb += (web) ? 1 : 0;
                                this.__nCkExpired += (expired) ? 1 : 0;
                            } else {
                                this.__cChecked--;
                                this.__nCkLocked -= (locked) ? 1 : 0;
                                this.__nCkMine -= (mine) ? 1 : 0;
                                this.__nCkWeb -= (web) ? 1 : 0;
                                this.__nCkExpired -= (expired) ? 1 : 0;
                            }

                            if (!this.__checkOutForEdit) {
                                var cids = this.getSelectedFiles();
                                document.fire('EWS:kmContentSelected', {
                                    cids: cids,
                                    isNoWeb: (this.__nCkWeb == 0),
                                    isExpired: (this.__nCkExpired == this.__cChecked),
                                    isChecked: ((this.__nCkMine > 0) && (this.__nCkLocked == this.__nCkMine))
                                });
                            }
							
 							if (this.__cChecked > 1){
								//this.__btns.enable('km_actionsCont_approveAct');
							}
							
							if(this.__cChecked == 1 ){
								//this.__btns.disable('km_actionsCont_approveAct');
							}											

                            if (this.__cChecked > 0) {
                                this.__btns.enable('km_actionsCont_checkInAct');
                                this.__btns.enable('km_actionsCont_checkOutAct');
                                this.__btns.enable('km_actionsCont_approveAct');
                                if (!isExpired)
									this.__btns.enable('km_actionsCont_deleteAct');
								this.contentSelected = true;
                            } else {
                                this.__btns.disable('km_actionsCont_checkInAct');
                                this.__btns.disable('km_actionsCont_checkOutAct');
                                this.__btns.disable('km_actionsCont_approveAct');
                                this.__btns.disable('km_actionsCont_deleteAct');
								this.contentSelected = false;
                            }

                            if ((this.__nCkLocked == this.__cChecked) || (this.__nCkWeb == 0)) {
                                if ((this.__nCkMine == 0)) {
                                    this.__btns.disable('km_actionsCont_checkInAct');
                                    this.__btns.disable('km_actionsCont_checkOutAct');
                                    this.__btns.disable('km_actionsCont_approveAct');
                                } else {
                                    this.__btns.enable('km_actionsCont_checkInAct');
                                    this.__btns.disable('km_actionsCont_checkOutAct');
									this.__btns.disable('km_actionsCont_approveAct');									
                                }
                                if (this.__nCkWeb == 0) {
                                    this.__btns.disable('km_actionsCont_checkInAct');
                                    this.__btns.disable('km_actionsCont_checkOutAct');
                                    this.__btns.disable('km_actionsCont_approveAct');
                                }
                            } else if (this.__nCkLocked == 0) {
                                this.__btns.disable('km_actionsCont_checkInAct');
                                this.__btns.enable('km_actionsCont_checkOutAct');
                            }

                            if (this.__cChecked == this.__nCkExpired) {
                                this.__btns.disable('km_actionsCont_checkInAct');
                                this.__btns.disable('km_actionsCont_checkOutAct');
                                this.__btns.disable('km_actionsCont_approveAct');
                            }		

                            if (this.__cChecked < items.length) {
                                $('km_listCont_ck_all').checked = false;
                            }
                            if (this.__cChecked == items.length) {
                                $('km_listCont_ck_all').checked = true;
                            }

                            if (isSystem) {
                                this.__btns.disable('km_actionsCont_checkInAct');
                                this.__btns.disable('km_actionsCont_checkOutAct');
                                this.__btns.disable('km_actionsCont_approveAct');
                                this.__btns.disable('km_actionsCont_deleteAct');
                            }

                        } .bind(this, cid));
                    }
                    if (this.__multiSelect) {
						if($('km_listCont_view_' + cid))
                        $('km_listCont_view_' + cid).observe('click', function(cid) {
                            var newId = $('km_listCont_new_id' + cid).value;
                            if (isWeb) {
                                global.open($H({
                                    app: {
                                        tabId: global.currentApplication.tabId,
                                        appId: "TST_SPAG",
                                        view: "StartPage",
                                        sbmid: "SC_CWB",
                                        mnmid: "SC"
                                    },
                                    createContent: false,
                                    contentID: newId,
                                    folderID: this.__slfo
                                }));
                            } else {
                                var xmlin = ''
			                + '<EWS>'
				                + '<SERVICE>KM_GET_FILE2</SERVICE>'
				                + '<OBJECT TYPE=""/>'
				                + '<DEL/><GCC/><LCC/>'
				                + '<PARAM>'
					                + '<I_V_CONTENT_ID>' + cid + '</I_V_CONTENT_ID>'
				                + '</PARAM>'
			                + '</EWS>';
                                window.open(this.buildURL(xmlin), '', 'width=300,height=300,resizable=yes,scrollbars=yes,toolbar=no,location=no');
                            }
                        } .bind(this, cid));
                        if (allowEdit) {
							if($('km_listCont_edit_ac_' + cid))
                            $('km_listCont_edit_ac_' + cid).observe('click', function(cid, locked) {
                                var newId = $('km_listCont_new_id' + cid).value;
                                var mine = parseInt($('km_listCont_is_mine' + cid).value);
                                if (mine > 0) {
                                    global.open($H({
                                        app: {
                                            tabId: global.currentApplication.tabId,
                                            appId: "TST_SPAG",
                                            view: "StartPage",
                                            sbmid: "SC_CWB",
                                            mnmid: "SC"
                                        },
                                        createContent: true,
                                        contentID: newId,
                                        folderID: this.__slfo
                                    }));
                                } else {
                                    this.__checkOutForEdit = true;
                                    var ck = $('km_listCont_ck_' + newId);
                                    if (ck) {
                                        ck.checked = true;
                                        this.checkO();
                                    }
                                }
                            } .bind(this, cid, locked));
                        }
                    }
                }
            } .bind(this));
        } .bind(this))(items);

		
        if (this.__forceSelect_ID) {
            var cid = this.__forceSelect_ID;
            var o = $('km_listCont_ck_' + cid);
            if (o) {
                o.click();
            }
            this.__forceSelect_ID = null;
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

    __buildTreeUI: function(json) {
        if (json.EWS && json.EWS.o_i_cont_tree) {
            var items = objectToArray(json.EWS.o_i_cont_tree.yglui_str_ecm_content_tree);
            for (var i = 0; i < items.length; i++) {
                pfid = (items[i]['@parent_folder']).replace(/^0{0,11}/, "");
                fid = (items[i]['@folder_id']).replace(/^0{0,11}/, "");
                value = prepareTextToShow(items[i]['@display_name']);
                pfid = (pfid == 0) ? 'global' : pfid;
                if (fid == this.__slfo) {
                    this.__slfop = pfid;
                }
                this.__insertChild(this.__treeArray, { id: fid, title: value, value: value, parent: pfid, hasChildren: false, isOpen: (fid == this.__slfo), isChecked: 0, nodeIcon: "", children: [] });

            }
        }
        this.__fjson1 = true;

        if (this.__fjson1 && this.__fjson2) {
            this.__buildTree();
        }
    },

    __buildTreeUIUnf: function(json) {
        if (json.EWS && json.EWS.o_i_cont_tree) {
            var items = objectToArray(json.EWS.o_i_cont_tree.yglui_str_ecm_content_tree);
            items.each(function(item) {
                pfid = (item['@parent_folder']).replace(/^0{0,11}/, "");
                fid = (item['@folder_id']).replace(/^0{0,11}/, "");
                value = prepareTextToShow(item['@display_name']);
                pfid = (pfid == 0) ? 'unfiled' : pfid;
                if (fid == this.__slfo) {
                    this.__slfop = pfid;
                }
                this.__insertChild(this.__treeArray, { id: fid, title: value, value: value, parent: pfid, hasChildren: false, isOpen: (fid == this.__slfo), isChecked: 0, nodeIcon: "", children: [] });

            } .bind(this));
        }
        this.__fjson2 = true;

        if (this.__fjson1 && this.__fjson2) {
            this.__buildTree();
        }
    },


    __buildTree: function() {
        if (this.__slfo) {
            _openNode = function(d, p) {
                var ret = null;
                for (var i = 0; i < d.length; i++) {
                    if (d[i].id == p) {
                        d[i].isOpen = true;
                        ret = d[i].parent;
                        break;
                    }
                    if (ret = _openNode(d[i].children, p)) {
                        break;
                    }
                }
                return ret;
            }
            while (this.__slfop) {
                this.__slfop = _openNode(this.__treeArray, this.__slfop);
            }
        }
        this.__folderTree = new linedTree($('km_treeCont_tree'), this.__treeArray, {
            useCheckBox: true,
            useIcons: false,
            defaultSelection: this.__slfo,
            raiseEventOnDefaultSelection: true,
            forceEventOnSelection: true,
            objEvents: $H({ onNodeSelection: "EWS:onNodeSelection", onCheckBoxClick: "EWS:onCheckBoxClick" }),
            spreadSelection: true,
            returnAllNodesOnSelection: true
        });
        this.__folderTree._setDefaultedNodeSelected();

        this.__fjson1 = false;
        this.__fjson2 = false;
    },

    __initTreeArray: function() {

        this.__treeArray = [];

        this.__treeArray.push({ id: 'global', title: 'global', value: global.getLabel('KM_GLOBAL'), parent: null, hasChildren: false, isOpen: true, isChecked: 0, nodeIcon: "", children: [] });
        if (this.__multiSelect) {
            this.__treeArray.push({ id: 'system', title: global.getLabel('KM_SYSTEM_CONTENT'), value: global.getLabel('KM_SYSTEM_CONTENT'), parent: null, hasChildren: false, isOpen: true, isChecked: 0, nodeIcon: "", children: [] });
        }
        this.__treeArray.push({ id: 'unfiled', title: global.getLabel('UNFILED_CONTENT'), value: global.getLabel('UNFILED_CONTENT'), parent: null, hasChildren: false, isOpen: true, isChecked: 0, nodeIcon: "", children: [] });

    },

    __insertChild: function(d, child) {

        for (var i = 0; i < d.length; i++) {
            if (d[i].id == child.parent) {
                d[i].hasChildren = true;
                d[i].children.push(child);
                break;
            }
            this.__insertChild(d[i].children, child);
        }
    },

    onNodeSelection: function(e) {
        var args = getArgs(e);
        if (args && args.selection) {
            this.__slfo = args.selection;

            if (this.__multiSelect) {
                var path = this.getPath(this.__slfo);
                if (path.startsWith(global.getLabel('KM_GLOBAL'))) {
                    this.__btns.enable('km_actionsCont_newContentAct');
                    this.__btns.enable('km_actionsCont_newFolderAct');
                } else {
                    this.__btns.disable('km_actionsCont_newContentAct');
                    this.__btns.disable('km_actionsCont_newFolderAct');
                }
            }

            this.__opfo = this.__slfo;
            if (this.__opfo != 'global') {
                this.getFC(this.__opfo);
            } else {
                this.__noItem();
            }
        }
    },

    onCheckBoxClick: function(e) {
        var args = getArgs(e);
        if (args && args.selection) {
            this.__selectedFolders = args.selection;
        } else {
            this.__selectedFolders = [];
        }
        if (this.__selectedFolders.length > 0) {
            if (this.__multiSelect) {
                this.__btns.enable('km_actionsCont_deleteAct');
				this.folderSelected = true;
            }
        }else{
			this.folderSelected = false;
		}
    },

    getFolders: function() {
        $('km_treeCont_tree').update('');
        this.__initTreeArray();
        this.getFT();
        this.getFTUnf();
		//this.__slfo = 0;
		this.getFC(this.__slfo);
		//this.bulidUI();		
    },

    getFT: function() {
        this.makeAJAXrequest($H({ xml:
            '<EWS>' +
                '<SERVICE>KM_GET_CONTRE2</SERVICE>' +
                '<OBJECT TYPE=""/>' +
                '<DEL/><GCC/><LCC/>' +
                '<PARAM>' +
                '</PARAM>' +
             '</EWS>',
            successMethod: '__buildTreeUI'
        }));
    },
    getFTUnf: function() {
        this.makeAJAXrequest($H({ xml:
            '<EWS>' +
                '<SERVICE>KM_GET_unfiled</SERVICE>' +
                '<OBJECT TYPE=""/>' +
                '<DEL/><GCC/><LCC/>' +
                '<PARAM>' +
					'<I_V_IS_AUTHORING>' + ((global.kmAuthModeEnabled) ? 'X' : '') + '</I_V_IS_AUTHORING>' +
					'<i_v_simulation_on>' + ((global.kmAuthSimulationEnabled) ? 'X' : '') + '</i_v_simulation_on>' +
                '</PARAM>' +
             '</EWS>',
            successMethod: '__buildTreeUIUnf'
        }));
    },
    getFC: function(fid) {
        this.__cChecked = 0;
        this.__nCkWeb = 0;
        this.__nCkExpired = 0;
        this.__nCkMine = 0;
        this.__nCkLocked = 0;
        document.fire('EWS:kmContentSelected', {
            cids: [],
            isNoWeb: (this.__nCkWeb == 0),
            isExpired: (this.__nCkExpired == this.__cChecked),
            isChecked: ((this.__nCkMine > 0) && (this.__nCkLocked == this.__nCkMine))
        });
        var fv;
        switch (fid) {
            case 'global': fv = 0; break;
            case 'system': fv = ''; break;
            case 'unfiled': fv = ''; break;
            default: fv = fid;
        };

        var o = $('km_actionsCont_incExp');
        this.makeAJAXrequest($H({ xml:
            '<EWS>' +
                '<SERVICE>KM_GET_FLCONT2</SERVICE>' +
                '<OBJECT TYPE=""/>' +
                '<DEL/><GCC/><LCC/>' +
                '<PARAM>' +
					'<I_V_IS_AUTHORING>' + ((global.kmAuthModeEnabled) ? 'X' : '') + '</I_V_IS_AUTHORING>' +
					'<i_v_simulation_on>' + ((global.kmAuthSimulationEnabled) ? 'X' : '') + '</i_v_simulation_on>' +
                    '<I_V_FOLD_CONT_ID>' + fv + '</I_V_FOLD_CONT_ID>' +
                    ((fid == 'system') ? '<I_V_SYSTEM>X</I_V_SYSTEM>' : '') +
                    '<I_V_INCLUDE_EXPIRED>' + ((o && o.checked) ? o.value : '') + '</I_V_INCLUDE_EXPIRED>' +
                '</PARAM>' +
             '</EWS>',
            successMethod: '__buildListUI'
        }));
    },

    getPath: function(fid) {
        _getChild = function(data, id) {
            var child = null;
            for (var i = 0; i < data.length; i++) {
                if (data[i].id == id) {
                    return data[i];
                }
                if (child = _getChild(data[i].children, id)) {
                    break;
                }
            }
            return child;
        }
        var folders = [];
        var child = _getChild(this.__treeArray, fid);
        while (child) {
            folders.push(child.value);
            child = _getChild(this.__treeArray, child.parent);
        }
        return folders.reverse().join('/');
    },

    _getFoLevel: function(fid) {
        var fs = this.getPath(fid).split('/');
        return fs.length - 1;

    },

    getSelectedContent: function() {
        var id = null, title = null, isweb = true;
        var radios = this.__listCont.select('input');
        if (Object.isArray(radios)) {
            radios.each(function(r) {
                if (r.checked) {
                    id = $('km_listCont_new_id' + r.value).value;
                    title = r.getAttribute('title');
                    isweb = r.getAttribute('isweb');
                    isweb = (isweb == 1);
                }
            } .bind(this));
        }
        return { id: id, title: title, isweb: isweb };
    },

    getSelectedFiles: function() {
        var ret = [];
        var cks = this.__listCont.select('input');
        if (Object.isArray(cks)) {
            cks.each(function(ck) {
                if ((ck.id != 'km_listCont_ck_all') && ck.checked) {
                    var newId = $('km_listCont_new_id' + ck.value).value;
                    ret.push(newId);

                }
            } .bind(this));
        }
        return ret;
    },

    getSelectedFolders: function() {
        return this.__selectedFolders;
    },

    __doRequest: function(service, callback) {
        this.makeAJAXrequest($H({ xml:
            '<EWS>' +
                '<SERVICE>' + service + '</SERVICE>' +
                '<OBJECT TYPE=""/>' +
                '<DEL/><GCC/><LCC/>' +
                '<PARAM>' +
                '</PARAM>' +
             '</EWS>',
            successMethod: callback
        }));
    },

    __buildTmpl: function(json) {
        var jsonAC = {
            autocompleter: {
                object: [],
                multilanguage: {
                    no_results: global.getLabel('KM_NO_RESULTS'),
                    search: global.getLabel('KM_SEARCH')
                }
            }
        };
        var items = objectToArray(json.EWS.o_i_templates.yglui_str_ecm_km_cust_template);
        items.each(function(item) {
            jsonAC.autocompleter.object.push({ data: item['@content_id'].replace(/^0{0,11}/, ""), text: item['@name'] });
        } .bind(this));

        this.__tmplAC.updateInput(jsonAC);
    },

    __buildCo: function(json) {
        var jsonAC = {
            autocompleter: {
                object: [],
                multilanguage: {
                    no_results: global.getLabel('KM_NO_RESULTS'),
                    search: global.getLabel('KM_SEARCH')
                }
            }
        };
        var items = objectToArray(json.EWS.o_country.yglui_tab_country);
        items.each(function(item) {
            jsonAC.autocompleter.object.push({ data: item['@country_code'].replace(/^0{0,11}/, ""), text: item['@country_text'] });
        } .bind(this));

        this.__coAC.updateInput(jsonAC);
    },

    __buildCgp: function(json) {
        var jsonAC = {
            autocompleter: {
                object: [],
                multilanguage: {
                    no_results: global.getLabel('KM_NO_RESULTS'),
                    search: global.getLabel('KM_SEARCH')
                }
            }
        };
        var items = objectToArray(json.EWS.o_i_types.yglui_str_ecm_km_templates);
        items.each(function(item) {
            jsonAC.autocompleter.object.push({ data: item['@templates_type_id'].replace(/^0{0,11}/, ""), text: item['@name'] });
        } .bind(this));

        this.__cgpAC.updateInput(jsonAC);
    },
    newC: function() {

        var html = '' +
        '<div id="km_versions_cont" style="width:90%;">' +
        '<table style="width:100%;">' +
            '<tr>' +
                '<td colspan="2"  style="border-bottom:solid 1px #ccc;">' +
                    '<input name="km_nc_type" type="radio" id="km_nc_wc" checked="checked" /> ' + global.getLabel('KM_WEB_CONTENT') +
                    '<input name="km_nc_type" type="radio" id="km_nc_nwc" /> ' + global.getLabel('KM_NON_WEB_CONTENT') +
                '</td></tr>' +
            '<tr id="km_nc_tmpl"><td style="width:40%;">' + global.getLabel('KM_TEMPLATE') + ': </td><td><div type="text" id="km_new_c_template" style="width:200px;"></div></td></tr>' +
            '<tr id="km_nc_upload"><td style="width:40%;">' + global.getLabel('KM_FILE') + ': </td><td><div id="km_new_c_upload" style="width:200px;"></div></td></tr>' +
        '</table>' +
        '</div>' +
        '<div id="km_new_c_ok"  style="text-align:center;margin-top:10px;padding-left:140px;"></div>';
		
        var popUp = new infoPopUp({
            closeButton: $H({
                'callBack': function() {
                    this.getFC(this.__slfo);
                    popUp.close();
                    delete popUp;
                } .bind(this)
            }),
            htmlContent: html,
            indicatorIcon: 'void',
            width: 600
        });
        popUp.create();
			
        $('km_nc_upload').hide();
        $('km_nc_wc').observe('click', function() {
            var o1 = $('km_nc_tmpl');
            var o2 = $('km_nc_upload');
            (this.checked) ? o1.show() : o1.hide();
            (this.checked) ? o2.hide() : o2.show();
        } .bind($('km_nc_wc')));
        $('km_nc_nwc').observe('click', function(oo) {
            var o1 = $('km_nc_tmpl');
            var o2 = $('km_nc_upload');
            (oo.checked) ? o1.hide() : o1.show();
            (oo.checked) ? o2.show() : o2.hide();
                $('km_new_c_upload').update('');
                this.__uploadModule = new UploadModule('km_new_c_upload', global.currentApplication.appId, 'KM_UPLOAD', true, this.docId.bind(this), {
                    //I_V_DOC_TYPE: this.docTypeAutocompleter.getValue().idAdded,
                    //I_V_PERSNO: this.emp,
                    I_V_FOLDER_ID: this.__slfo,
                    I_V_APPID: global.currentApplication.appId
                });
        } .bind(this, $('km_nc_nwc')));

        var tmplJson = { autocompleter: { object: [], multilanguage: {}} };
        this.__tmplAC = new JSONAutocompleter('km_new_c_template', {}, tmplJson);
        this.__doRequest('KM_GET_WC_TYPE', '__buildTmpl');

/*         var coJson = { autocompleter: { object: [], multilanguage: {}} };
        this.__coAC = new JSONAutocompleter('km_new_c_country', {}, coJson);
        this.__doRequest('GET_COUNTRY', '__buildCo');

        var cgpJson = { autocompleter: { object: [], multilanguage: {}} };
        this.__cgpAC = new JSONAutocompleter('km_new_c_content_group', {}, cgpJson);
        this.__doRequest('KM_GET_TYPES', '__buildCgp'); */

        var jn = { elements: [] };
        var ok = {
            idButton: 'km_nc_btn_ok',
            label: global.getLabel('KM_OK'),
            type: 'button',
            handler: function() {
                var pf;
                switch (this.__opfo) {
                    case 'global': pf = 0; break;
                    default: pf = this.__opfo;
                };
                var v, tmpl = null, co = null, cpg = null;
               /*  var clssf = $('km_nc_classif').checked;
                if (clssf) {
                    v = this.__coAC.getValue();
                    if (v) var co = v.idAdded;
                    v = this.__cgpAC.getValue();
                    if (v) var cgp = v.idAdded;
                } */
                if ($('km_nc_wc').checked) {
                    v = this.__tmplAC.getValue();
                    if (v) var tmpl = v.idAdded;

                    this.makeAJAXrequest($H({ xml:
                         '<EWS>' +
                            '<SERVICE>KM_NEW_WCONT2</SERVICE>' +
                            '<OBJECT TYPE=""/>' +
                            '<DEL/><GCC/><LCC/>' +
                            '<PARAM>' +
                                '<I_V_CLASS_FLAG></I_V_CLASS_FLAG>' +
                                '<I_V_TEMPLATE_ID>' + tmpl + '</I_V_TEMPLATE_ID>' +
                                '<I_V_FOLDER_ID>' + pf + '</I_V_FOLDER_ID>' +
                                '<I_I_METADATA>' +
                                    '<YGLUI_STR_ECM_KM_METADATAV2 FIELD_NAME="COUNTRY">' +
                                        '<VALUES>' +
                                            '<YGLUI_STR_ECM_KM_META_VALV2 VALUE="" /> ' +
                                        '</VALUES>' +
                                    '</YGLUI_STR_ECM_KM_METADATAV2>' +
                                    '<YGLUI_STR_ECM_KM_METADATAV2 FIELD_NAME="CGROUP">' +
                                        '<VALUES>' +
                                            '<YGLUI_STR_ECM_KM_META_VALV2 VALUE="" />' +
                                        '</VALUES>' +
                                    '</YGLUI_STR_ECM_KM_METADATAV2>' +
                                '</I_I_METADATA>' +
                            '</PARAM>' +
                         '</EWS>',
                        successMethod: '__post_newC'
                    }));
                    popUp.close();
                    delete popUp;

                } else {
/*                     if (clssf) {

                        this.__uploadModule.addParameter('I_I_METADATA',
                                '<I_I_METADATA>' +
                                    '<YGLUI_STR_ECM_KM_METADATAV2 FIELD_NAME=&quot;COUNTRY&quot;>' +
                                        '<VALUES><YGLUI_STR_ECM_KM_META_VALV2 VALUE=&quot;' + co + '&quot; /></VALUES>' +
                                    '</YGLUI_STR_ECM_KM_METADATAV2>' +
                                    '<YGLUI_STR_ECM_KM_METADATAV2 FIELD_NAME=&quot;CGROUP&quot;>' +
                                        '<VALUES><YGLUI_STR_ECM_KM_META_VALV2 VALUE=&quot;' + cgp + '&quot; /></VALUES>' +
                                    '</YGLUI_STR_ECM_KM_METADATAV2>' +
                                '</I_I_METADATA>'
                            );
                    } */
                    this.__uploadModule.uploadHandler();
                }

            } .bind(this),
            standardButton: true
        };
        jn.elements.push(ok);
        btns = new megaButtonDisplayer(jn);
        $('km_new_c_ok').insert(btns.getButtons());
        this.__ncOkBtns = btns;

    },
    newF: function() {

        var html = '' +
        '<div id="km_versions_cont" style="width:90%;">' +
        '<table>' +
        //'<tr><td>' + global.getLabel('KM_DISPLAY_NAME') + '</td><td>: <input type="text" id="km_new_fo_disname" style="width:200px;"></td></tr>' +
		'<tr><td style="width:500px;">' + global.getLabel('KM_FOLDER_NAME') + ': <input type="text" id="km_new_fo_sysname" style="width:200px;"></td></tr>' +
        '</table>' +
        '</div>' +
        '<div id="km_new_fo_ok"  style="text-align:center;margin-top:10px;padding-left:140px;"></div>';
        var popUp = new infoPopUp({
            closeButton: $H({
                'callBack': function() {
                    popUp.close();
                    delete popUp;
                }
            }),
            htmlContent: html,
            indicatorIcon: 'void',
            width: 500
        });
        popUp.create();

        var jn = { elements: [] };
        var ok = {
            idButton: 'km_btn_ok',
            label: global.getLabel('KM_OK'),
            type: 'button',
            handler: function() {

                var pf;
                switch (this.__slfo) {
                    case 'global': pf = 0; break;
                    default: pf = this.__slfo;
                };
                //this.__disn = $('km_new_fo_disname').value;
                this.__sysn = this.__disn = $('km_new_fo_sysname').value;

                if ((this.__sysn != '')) {
                    var level = this._getFoLevel(this.__slfo);
                    this.makeAJAXrequest($H({ xml:
                        '<EWS>' +
                            '<SERVICE>KM_ADD_FOLD2</SERVICE>' +
                            '<OBJECT TYPE=""/>' +
                            '<DEL/><GCC/><LCC/>' +
                            '<PARAM>' +
                                '<I_V_FLD_LEVEL>' + level + '</I_V_FLD_LEVEL>' +
                                '<I_V_SYSTEM_NAME>' + (prepareTextToSend(this.__sysn)) + '</I_V_SYSTEM_NAME>' +
                                '<I_V_DISPLAY_NAME>' + (prepareTextToSend(this.__sysn)) + '</I_V_DISPLAY_NAME>' +
                                '<I_V_PARENT_ID>' + pf + '</I_V_PARENT_ID>' +
                            '</PARAM>' +
                         '</EWS>',
                        successMethod: '__post_newF'
                    }));
                }
                popUp.close();
                delete popUp;
            } .bind(this),
            standardButton: true
        };
        jn.elements.push(ok);
        btns = new megaButtonDisplayer(jn);
        $('km_new_fo_ok').insert(btns.getButtons());
    },

    checkO: function() {
        var files = this.getSelectedFiles();
        files.each(function(f) {
            var ocid = this.__cid_old_new[f];
            if (!ocid) {
                ocid = f;
            }
            var locked = parseInt($('km_listCont_is_locked' + ocid).value);
            var web = parseInt($('km_listCont_is_web' + ocid).value);
            if (web && (locked == 0)) {
                this.makeAJAXrequest($H({ xml:
                '<EWS>' +
                    '<SERVICE>KM_CHK_OU_WEB2</SERVICE>' +
                    '<OBJECT TYPE=""/>' +
                    '<DEL/><GCC/><LCC/>' +
                    '<PARAM>' +
                        '<I_V_CONT_ID>' + f + '</I_V_CONT_ID>' +
                    '</PARAM>' +
                 '</EWS>',
                    successMethod: '__post_checkO'
                }));
            }
        } .bind(this));
    },

    checkI: function() {
        var files = this.getSelectedFiles();
        files.each(function(f) {
            var ocid = this.__cid_old_new[f];
            if (!ocid) {
                ocid = f;
            }
            var locked = parseInt($('km_listCont_is_locked' + ocid).value);
            var mine = parseInt($('km_listCont_is_mine' + ocid).value);
            var web = parseInt($('km_listCont_is_web' + ocid).value);
            if (web && (locked > 0) || (mine > 0)) {
                //$('km_listCont_edit_' + f).hide();
                var fn = $('km_listCont_fn_' + ocid).innerHTML;
                var tl = $('km_listCont_tl_' + ocid).innerHTML;
                var newId = $('km_listCont_new_id' + ocid).value;
                this.makeAJAXrequest($H({ xml:
                '<EWS>' +
                    '<SERVICE>KM_CHK_IN_WEB2</SERVICE>' +
                    '<OBJECT TYPE=""/>' +
                    '<DEL/><GCC/><LCC/>' +
                    '<PARAM>' +
                        '<I_V_CONT_ID>' + newId + '</I_V_CONT_ID>' +
                        '<I_V_CONTENT>' + tl + '</I_V_CONTENT>' +
                        '<I_V_FILE_NAME>' + fn + '</I_V_FILE_NAME>' +
                    '</PARAM>' +
                 '</EWS>',
                    successMethod: '__post_checkI'
                }));
            }
        } .bind(this));
    },

    aprv: function() {
	
        var xmlin;
		var prnr = parseInt(global.objectId,10);
		var files = this.getSelectedFiles();
		var sMethod;
        files.each(function(f) {
            var ocid = this.__cid_old_new[f];
            if (!ocid) {
                ocid = f;
            }
            var web = parseInt($('km_listCont_is_web' + ocid).value);
            if (true/*web*/) {		
				if (this.__dmApprover){
					xmlin = '<EWS>' +
								'<SERVICE>SAVE_REQUEST</SERVICE>' +
								'<OBJ TYPE="P">' + prnr + '</OBJ>' +
								'<PARAM>' +
									'<APPID>KM_APRV</APPID>' +
									'<RECORDS>' +
										'<YGLUI_STR_WID_RECORD REC_KEY="' + f + '" SCREEN="1">' +
											'<CONTENTS>' +
												'<YGLUI_STR_WID_CONTENT KEY_STR="' + f + '" REC_INDEX="1" SELECTED="" TCONTENTS="">' +
													'<FIELDS>' +
														'<yglui_str_wid_field fieldid="CONTENT_ID" fieldlabel="" fieldtechname="CONTENT_ID" fieldtseqnr="000000" value="' + f + '">' +
														'</yglui_str_wid_field>' +
													'</FIELDS>' +
												'</YGLUI_STR_WID_CONTENT>' +
											'</CONTENTS>' +
										'</YGLUI_STR_WID_RECORD>' +
									'</RECORDS>' +
									'<BUTTON ACTION="KM_APRV_ACTIO" LABEL_TAG="Save" OKCODE="INS"/>' +
								'</PARAM>' +
								'<DEL/>' +
							'</EWS>';
					sMethod = 'successReqApprv';
				}else{
					xmlin = '<EWS>' +
								'<SERVICE>KM_APROVE_WEB2</SERVICE>' +
								'<OBJECT TYPE=""/>' +
								'<DEL/><GCC/><LCC/>' +
								'<PARAM>' +
									'<I_V_CONT_ID>' + f + '</I_V_CONT_ID>' +
								'</PARAM>' +
							'</EWS>';
							
					sMethod = '__post_aprv';
				}
				this.makeAJAXrequest($H({ 
					xml:xmlin,
					successMethod: sMethod
				}));				
            }
        } .bind(this));

    },
	
	successReqApprv: function(){

        var html = '' +
        '<div style="margin-left:50px;margin-right:20px;">' +
        '   <span>' + global.getLabel('KM_REQUEST_APPRV_MESSAGE') + '</span>' +
        '</div><br/>' +
        '<div id="km_add_delete_btns"  style="text-align:center;margin-top:10px;margin-left:110px;"></div>';
        var popUp = new infoPopUp({
            closeButton: $H({
                'callBack': function() {
                    popUp.close();
                    delete popUp;
                }
            }),
            htmlContent: html,
            indicatorIcon: 'void',
            width: 420
        });
        popUp.create();

        var jn = { elements: [] };
        var ok = {
            idButton: 'km_btn_ok',
            label: global.getLabel('KM_OK'),
            type: 'button',
            handler: function(n) {
                popUp.close();
                delete popUp;
            } .bind(this, name),
            standardButton: true
        };
        jn.elements.push(ok);
        btns = new megaButtonDisplayer(jn);
        $('km_add_delete_btns').insert(btns.getButtons());
		this.__btns.disable('km_actionsCont_approveAct');
	},

    save: function() {
        this.makeAJAXrequest($H({ xml:
            '<EWS>' +
                '<SERVICE>KM_SAVE_WEB</SERVICE>' +
                '<OBJECT TYPE=""/>' +
                '<DEL/><GCC/><LCC/>' +
                '<PARAM>' +
                    '<I_V_CONT_ID>20</I_V_CONT_ID>' +
                    '<I_V_CONTENT>the quick brown fox jumps over the lazy dog.</I_V_CONTENT>' +
                    '<I_W_META_DATA CONTENT_FIELD_ID="2" ORDER_ID="1" VALUE="test"/>' +
                '</PARAM>' +
             '</EWS>',
            successMethod: '__post_save'
        }));
    },

    delF: function() {
        this.makeAJAXrequest($H({ xml:
            '<EWS>' +
                '<SERVICE>KM_REMOV_FOLD2</SERVICE>' +
                '<OBJECT TYPE=""/>' +
                '<DEL/><GCC/><LCC/>' +
                '<PARAM>' +
                    '<I_V_FOLD_CONT_ID>' + this.__slfo + '</I_V_FOLD_CONT_ID>' +
                '</PARAM>' +
             '</EWS>',
            successMethod: '__post_delF'
        }));
    },

    delC: function() {
	
		var label = '';
		
		if (this.folderSelected)
			label = global.getLabel('KM_FOLDER_EXPIRY');
		if (this.contentSelected)
			label = global.getLabel('KM_CONTENT_EXPIRY');
	
        var html = '' +
        '<div style="margin-left:50px;margin-right:20px;">' +
        '   <span>' + label + '</span>' +
        '</div><br/>' +
        '<div id="km_add_delete_btns"  style="text-align:center;margin-top:10px;margin-left:110px;"></div>';
        var popUp = new infoPopUp({
            closeButton: $H({
                'callBack': function() {
                    popUp.close();
                    delete popUp;
                }
            }),
            htmlContent: html,
            indicatorIcon: 'void',
            width: 420
        });
        popUp.create();

        var jn = { elements: [] };
        var yes = {
            idButton: 'km_btn_yes',
            label: global.getLabel('KM_YES'),
            type: 'button',
            handler: function(n) {
                popUp.close();
                delete popUp;
                var files = this.getSelectedFiles();
                var folders = this.getSelectedFolders();
                files.each(function(f) {
                    this.makeAJAXrequest($H({ xml:
                    '<EWS>' +
                        '<SERVICE>KM_EXPIRE</SERVICE>' +
                        '<OBJECT TYPE=""/>' +
                        '<DEL/><GCC/><LCC/>' +
                        '<PARAM>' +
                            '<I_V_CONTENT_ID>' + f + '</I_V_CONTENT_ID>' +
                        '</PARAM>' +
                     '</EWS>',
                        successMethod: '__post_delC'
                    }));
                } .bind(this));
                folders.each(function(f) {
                    this.makeAJAXrequest($H({ xml:
                    '<EWS>' +
                        '<SERVICE>KM_EXPIRE</SERVICE>' +
                        '<OBJECT TYPE=""/>' +
                        '<DEL/><GCC/><LCC/>' +
                        '<PARAM>' +
                            '<I_V_FOLDER_ID>' + f + '</I_V_FOLDER_ID>' +
                        '</PARAM>' +
                     '</EWS>',
                        successMethod: '__post_delF'
                    }));
                } .bind(this));
            } .bind(this, name),
            standardButton: true
        };
        var no = {
            idButton: 'km_btn_no',
            label: global.getLabel('KM_NO'),
            type: 'button',
            handler: function(n) {
                popUp.close();
                delete popUp;
            } .bind(this, name),
            standardButton: true
        };
        jn.elements.push(yes);
        jn.elements.push(no);
        btns = new megaButtonDisplayer(jn);
        $('km_add_delete_btns').insert(btns.getButtons());
    },

    __dummy: function(ret) {
        this.getFolders();
        this.getFC(this.__slfo); ;
    },

    __post_newC: function(ret) {
        var cid = ret.EWS.o_v_content_id;
        if (cid) {
            cid = cid.replace(/^0{0,11}/, "");
            global.open($H({
                app: {
                    tabId: global.currentApplication.tabId,
                    appId: "TST_SPAG",
                    view: "StartPage",
                    sbmid: "SC_CWB",
                    mnmid: "SC"
                },
                createContent: true,
                contentID: cid,
                folderID: this.__slfo
            }));
        }
    },
    __post_newF: function(ret) {
        var fid = ret.EWS.o_v_folder_id;
        fid = fid.replace(/^0{0,11}/, "");
        if (fid > 0) {
            this.__insertChild(this.__treeArray, { id: fid, title: fid, value: prepareTextToShow(this.__disn.escapeHTML()), parent: this.__opfo, hasChildren: false, isOpen: true, isChecked: 0, nodeIcon: "", children: [] });
            _openNode = function(d, p) {
                var ret = null;
                for (var i = 0; i < d.length; i++) {
                    if (d[i].id == p) {
                        d[i].isOpen = true;
                        ret = d[i].parent;
                        break;
                    }
                    if (ret = _openNode(d[i].children, p)) {
                        break;
                    }
                }
                return ret;
            }
            var f = this.__opfo;
            while (f) {
                f = _openNode(this.__treeArray, f);
            }
            this.__folderTree._defaultedNodeSelected = fid;
            this.__folderTree.refreshTree(this.__treeArray);
            this.__folderTree._setDefaultedNodeSelected();
        }
    },
    __post_checkI: function(ret) {
        var cid = ret.EWS.o_v_cont_id;
        cid = cid.replace(/^0{0,11}/, "");
        if (cid > 0) {
            var ocid = this.__cid_old_new[cid];
            if (ocid) {
                cid = ocid;
            }
            $('km_listCont_lock_' + cid).hide();
            $('km_listCont_is_mine' + cid).value = 0;
            $('km_listCont_is_locked' + cid).value = 0;
            this.__nCkMine--;
            this.__nCkLocked--;

            this.__btns.enable('km_actionsCont_checkOutAct');
            this.__btns.disable('km_actionsCont_checkInAct');
			this.__btns.enable('km_actionsCont_approveAct');
        }
    },
    __post_checkO: function(ret) {
        var oldId = ret.EWS.o_v_old_cont_id;
        var newId = ret.EWS.o_v_new_cont_id;
        oldId = oldId.replace(/^0{0,11}/, "");
        newId = newId.replace(/^0{0,11}/, "");
        if (newId > 0) {
            var lock = $('km_listCont_lock_' + oldId);
            lock.addClassName('application_editSelection2');
            lock.addClassName('km_listCont_edit');
            lock.show();

            $('km_listCont_new_id' + oldId).value = newId;
            $('km_listCont_is_mine' + oldId).value = 1;
            $('km_listCont_is_locked' + oldId).value = 1;
            this.__nCkMine++;
            this.__nCkLocked++;
            this.__cid_old_new[newId] = oldId;

            this.__btns.disable('km_actionsCont_checkOutAct');
            this.__btns.enable('km_actionsCont_checkInAct');
			this.__btns.disable('km_actionsCont_approveAct');

            if (this.__checkOutForEdit) {
                this.__checkOutForEdit = false;
                global.open($H({
                    app: {
                        tabId: global.currentApplication.tabId,
                        appId: "TST_SPAG",
                        view: "StartPage",
                        sbmid: "SC_CWB",
                        mnmid: "SC"
                    },
                    createContent: true,
                    contentID: newId,
                    folderID: this.__slfo
                }));
            } else {
                var cids = this.getSelectedFiles();
                document.fire('EWS:kmContentSelected', {
                    cids: cids,
                    isNoWeb: (this.__nCkWeb == 0),
                    isExpired: (this.__nCkExpired == this.__cChecked),
                    isChecked: ((this.__nCkMine > 0) && (this.__nCkLocked == this.__nCkMine))
                });
            }
        }
    },
    __post_aprv: function(ret) {
        var cid = ret.EWS.o_v_new_cont_id;
        cid = cid.replace(/^0{0,11}/, "");
        if (cid > 0) {
            document.fire('EWS:kmContentSelected', {
                cids: [cid],
                isNoWeb: (this.__nCkWeb == 0),
                isExpired: (this.__nCkExpired == this.__cChecked),
                isChecked: ((this.__nCkMine > 0) && (this.__nCkLocked == this.__nCkMine))
            });
        }
    },
    __post_save: function(ret) {
        ;
    },
    __post_delF: function(ret) {
        this.getFolders();
    },
    __post_delC: function(ret) {
        document.fire("EWS:onNodeSelection", {
            selection: this.__slfo
        });

    },

    docId: function(json) {
        this.__ncOkBtns.disable('km_nc_btn_ok');
        $('km_new_c_upload').insert('<div id="km_restart_upload"></div>');
        var jn = { elements: [] };
        var ok = {
            idButton: 'km_restart_uploadBtn',
            label: global.getLabel('KM_RESTART_UPLOAD'),
            type: 'button',
            handler: function() {
                var pf;
                switch (this.__slfo) {
                    case 'global': pf = 0; break;
                    default: pf = this.__slfo;
                };
                $('km_new_c_upload').update();
                this.__uploadModule = new UploadModule('km_new_c_upload', global.currentApplication.appId, 'KM_UPLOAD', true, this.docId.bind(this), {
                    //I_V_DOC_TYPE: this.docTypeAutocompleter.getValue().idAdded,
                    //I_V_PERSNO: this.emp,
                    I_V_FOLDER_ID: pf,
                    I_V_APPID: global.currentApplication.appId
                });
                this.__ncOkBtns.enable('km_nc_btn_ok');
            } .bind(this),
            standardButton: true
        };
        jn.elements.push(ok);
        btns = new megaButtonDisplayer(jn);
        $('km_restart_upload').insert(btns.getButtons());

        var lb = $('km_fd_lb_' + this.__slfo);
        if (lb) this.treeLBClick.call(this, lb, this.__slfo);
    },

    __configTB: function() {

        document.observe('EWS:ADD_TO_CLIPBOARD', function(e) {
            var eid, fid, isFolder;
            var files = this.getSelectedFiles();
            if (files.length > 0) {
                eid = files.join(';');
                fid = this.__slfo;
                isFolder = false;
            } else {
                var folders = this.getSelectedFolders();
                folders.each(function(f) {
                    ;
                } .bind(this));
                eid = null;
                fid = folders.join(';');
                isFolder = true
            }
            this.addToClipboard(eid, fid, isFolder);

        } .bind(this));

        document.observe('EWS:MOVE_HERE', function(e) {
            this.moveHere(this.__slfo);
        } .bind(this));

        document.observe('EWS:COPY_HERE', function(e) {
            this.copyHere(this.__slfo);
        } .bind(this));

        document.observe('EWS:LINK_HERE', function(e) {
            this.linkHere(this.__slfo);
        } .bind(this));
    },

    addToClipboard: function(eid, fid, isFolder) {
        this.__clipboard.eid = eid;
        this.__clipboard.fid = fid;
        this.__clipboard.isFolder = isFolder;

    },

    moveHere: function(dest) {
        var err = false, msg;
        var eid = this.__clipboard.eid;
        var fid = this.__clipboard.fid;
        var isFolder = this.__clipboard.isFolder;
        /*if (fid == null) {
        err = true;
        msg = 'No folder or content selected';
        }*/
        if (dest == fid) {
            err = true;
            msg = 'The Destination folder is the same as the source folder';
        }
        if (err) {
            var popUp = new infoPopUp({
                closeButton: $H({
                    'callBack': function() {
                        popUp.close();
                        delete popUp;
                    }
                }),
                htmlContent: msg,
                indicatorIcon: 'exclamation',
                width: 400
            });
            popUp.create();
            return false;
        }
        this.makeAJAXrequest($H({ xml:
            '<EWS>' +
                '<SERVICE>KM_FLD_ACTION</SERVICE>' +
                '<OBJECT TYPE=""/>' +
                '<DEL/><GCC/><LCC/>' +
                '<PARAM>' +
                    '<I_V_ACTION>MOVE</I_V_ACTION>' +
                    ((isFolder) ?
                    '<I_V_FOLDER_ID>' + fid + '</I_V_FOLDER_ID>' :
                    '<I_V_CONTENT_ID>' + eid + '</I_V_CONTENT_ID>') +
                    '<I_V_DEST_FOLDER_ID>' + dest + '</I_V_DEST_FOLDER_ID>' +
                '</PARAM>' +
             '</EWS>',
            successMethod: '__dummy'
        }));
    },

    copyHere: function(dest) {
        var err = false, msg;
        var eid = this.__clipboard.eid;
        var fid = this.__clipboard.fid;
        var isFolder = this.__clipboard.isFolder;

        /*if (fid == null) {
        err = true;
        msg = 'No folder or content selected';
        }*/
        if (dest == fid) {
            err = true;
            msg = 'The Destinatnion folder is the same as the source folder';
        }
        if (err) {
            var popUp = new infoPopUp({
                closeButton: $H({
                    'callBack': function() {
                        popUp.close();
                        delete popUp;
                    }
                }),
                htmlContent: msg,
                indicatorIcon: 'exclamation',
                width: 400
            });
            popUp.create();
            return false;
        }
        this.makeAJAXrequest($H({ xml:
            '<EWS>' +
                '<SERVICE>KM_FLD_ACTION</SERVICE>' +
                '<OBJECT TYPE=""/>' +
                '<DEL/><GCC/><LCC/>' +
                '<PARAM>' +
                    '<I_V_ACTION>COPY</I_V_ACTION>' +
                    ((isFolder) ?
                    '<I_V_FOLDER_ID>' + fid + '</I_V_FOLDER_ID>' :
                    '<I_V_CONTENT_ID>' + eid + '</I_V_CONTENT_ID>') +
                    '<I_V_DEST_FOLDER_ID>' + dest + '</I_V_DEST_FOLDER_ID>' +
                '</PARAM>' +
             '</EWS>',
            successMethod: '__dummy'
        }));
    },

    linkHere: function(dest) {
        var err = false, msg;
        var eid = this.__clipboard.eid;
        var fid = this.__clipboard.fid;
        var isFolder = this.__clipboard.isFolder;
        /*if (fid == null) {
        err = true;
        msg = 'No folder or content selected';
        }*/
        if (dest == fid) {
            err = true;
            msg = 'The Destinatnion folder is the same as the source folder';
        }
        if (err) {
            var popUp = new infoPopUp({
                closeButton: $H({
                    'callBack': function() {
                        popUp.close();
                        delete popUp;
                    }
                }),
                htmlContent: msg,
                indicatorIcon: 'exclamation',
                width: 400
            });
            popUp.create();
            return false;
        }
        this.makeAJAXrequest($H({ xml:
            '<EWS>' +
                '<SERVICE>KM_FLD_ACTION</SERVICE>' +
                '<OBJECT TYPE=""/>' +
                '<DEL/><GCC/><LCC/>' +
                '<PARAM>' +
                    '<I_V_ACTION>LINK</I_V_ACTION>' +
                    ((isFolder) ?
                    '<I_V_FOLDER_ID>' + fid + '</I_V_FOLDER_ID>' :
                    '<I_V_CONTENT_ID>' + eid + '</I_V_CONTENT_ID>') +
                    '<I_V_DEST_FOLDER_ID>' + dest + '</I_V_DEST_FOLDER_ID>' +
                '</PARAM>' +
             '</EWS>',
            successMethod: '__dummy'
        }));
    },

    exportD: function() {
        var files = this.getSelectedFiles();
        var folders = this.getSelectedFolders();
        var xmlin = '<EWS><SERVICE>ECM_EXPORT</SERVICE><OBJ TYPE="" /><DEL></DEL><GCC /><LCC /><PARAM><I_I_CONTENT_ID>';
        for (var i = 0; i < folders.length; i++) {
            xmlin += '<YGLUI_STR_ECM_CONTENT_ID CONTENT_ID="' + folders[i] + '" />';
        }
        for (var i = 0; i < files.length; i++) {
            xmlin += '<YGLUI_STR_ECM_CONTENT_ID CONTENT_ID="' + files[i] + '" />';
        }
        xmlin += '</I_I_CONTENT_ID></PARAM></EWS>';

        this.makeAJAXrequest($H({ xml: xmlin, successMethod: function() {
            this.__btns.disable('km_actionsCont_exportAct');
            this.__btns.updateLabel('km_actionsCont_exportAct', '&nbsp;&nbsp;' + '0% ' + global.getLabel('KM_DONE') + '...');
            this.__timer = setInterval(function() {
                var xmlin = '<EWS><SERVICE>ECM_EXPORT_LOG</SERVICE><OBJ TYPE="" /><DEL></DEL><GCC /><LCC /><PARAM><I_V_ACTION>L</I_V_ACTION></PARAM></EWS>';
                this.makeAJAXrequest($H({ xml: xmlin, successMethod: function(json) {
                    if (json.EWS.o_v_perc) {
                        var v = parseFloat(json.EWS.o_v_perc);
                        if (v < 100) {
                            this.__btns.updateLabel('km_actionsCont_exportAct', '&nbsp;&nbsp;' + v + '% ' + global.getLabel('KM_DONE') + '...');
                        } else {
                            clearInterval(this.__timer);
                            this.__btns.updateLabel('km_actionsCont_exportAct', global.getLabel('KM_EXPORT'));
                            this.__btns.enable('km_actionsCont_exportAct');
                        }
                    }
                } .bind(this)
                }));
            } .bind(this), 2000);
        } .bind(this)
        }));
    },

    importD: function() {
		var destFolder;	
        switch (this.__slfo) {
            case 'global':
            case 'system': 
            case 'unfiled': 
			destFolder = '0'; break;
			default:
			destFolder = this.__slfo;
        };
		
		if(destFolder=='0'){
			var html = '' +
			'<div id="km_versions_cont" style="width:90%;"></div>'+global.getLabel('KM_CANNOT_IMPORT_TO_FOLDER')+' '+ this.__slfo;
		}else{
			var html = '' +
			'<div id="km_versions_cont" style="width:90%;">' +
			'<table style="width:100%;">' +
				'<tr>' +
					'<td colspan="2"  style="border-bottom:solid 1px #ccc;">' +
					'</td></tr>' +
				'<tr id="km_nc_upload"><td style="width:40%;">' + global.getLabel('KM_IMPORT_PACKAGE') + ': </td><td><div id="km_import_upload" style="width:200px;"></div></td></tr>' +
			'</table>' +
			'</div>' +
			'<div id="km_import_upload_ok"  style="text-align:center;margin-top:10px;padding-left:140px;"></div>';
		}

        this.__uploadPopup = new infoPopUp({
            closeButton: $H({
                'callBack': function() {
                    this.__uploadPopup.close();
                    delete this.__uploadPopup;
                } .bind(this)
            }),
            htmlContent: html,
            indicatorIcon: ((destFolder=='0')? 'exclamation': 'void'),//'void',
            width: 600
        });
        this.__uploadPopup.create();
		
		if(destFolder!='0'){		
			this.__uploadModule = new UploadModule('km_import_upload', global.currentApplication.appId, 'ECM_IMPORT_UP', true, this.onUploadComplete.bind(this), {
				I_V_FORCE_DRAFT: false,
				I_V_DEST_FOLDER: destFolder,
				I_V_DEL_SOURCE: '',
				I_V_APPID: global.currentApplication.appId
			});

        var jn = { elements: [] };
        var ok = {
            idButton: 'km_import_ok',
            label: global.getLabel('KM_OK'),
            type: 'button',
            handler: function() {
				if(destFolder!='0'){
					this.__uploadModule.uploadHandler();
					this.__uploadBtns.disable('km_import_ok')
				}else{
					this.__uploadPopup.close();
				}
            } .bind(this),
            standardButton: true
        };
        jn.elements.push(ok);
        this.__uploadBtns = new megaButtonDisplayer(jn);
        $('km_import_upload_ok').insert(this.__uploadBtns.getButtons());
		}
    },
	
    onUploadComplete: function(ret) {

        this.__btns.disable('km_actionsCont_importAct');
        this.__btns.updateLabel('km_actionsCont_importAct', '&nbsp;&nbsp;' + '0% ' + global.getLabel('KM_DONE') + '...');
        this.__timer = setInterval(function() {
            var xmlin = '<EWS><SERVICE>ECM_IMPORT_LOG</SERVICE><OBJ TYPE="" /><DEL></DEL><GCC /><LCC /><PARAM><I_V_ACTION>L</I_V_ACTION></PARAM></EWS>';
            this.makeAJAXrequest($H({ xml: xmlin, successMethod: function(json) {
                if (json.EWS.o_v_perc) {
                    var v = parseFloat(json.EWS.o_v_perc);
                    if (v < 100) {
                        this.__btns.updateLabel('km_actionsCont_importAct', '&nbsp;&nbsp;' + v + '% ' + global.getLabel('KM_DONE') + '...');
                    } else {
                        clearInterval(this.__timer);
                        this.__btns.updateLabel('km_actionsCont_importAct', global.getLabel('KM_IMPORT'));
                        this.__btns.enable('km_actionsCont_importAct');
                    }
                }
            } .bind(this)
            }));
        } .bind(this), 2000);
		this.__uploadBtns.updateHandler('km_import_ok',function(){
			this.__uploadPopup.close();
			delete this.__uploadPopup;
		}.bind(this))
		this.__uploadBtns.enable('km_import_ok');
		this.bulidUI();
		//this.getFC(this.__slfo);
    }

});