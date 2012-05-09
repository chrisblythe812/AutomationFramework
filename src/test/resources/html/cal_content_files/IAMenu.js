var KMMENU = Class.create(Menu, {

    curItem: null,
    prvItem: null,
	__checkOut: false,
    __editMenu: null,
    __rootMenu: null,
    __editMode: false,
    __editSimulation: false,
    __setupEdit: null,
    __cid: null,
    __trns: null,
    __json: null,
    __lastId: null,
    __lngAC: null,
    __l: 0,
    __levels: [],
    __i: [],
	__contentid: null,
	__isAuthor: null,
	__version: null,
	__newContentId: null,
	__editSubMenu: null,
	__keywords: null,
	__menuExist: false,
	__versionPage: 1,
	__isRoot: false,
	__editSimulation: null,
	IAItems: null,
	firstRun: true,
	selectedMenu: null,
	__viewMode: null,
	oldItems: null,
	oldCid: null,

	

    initialize: function($super, id, options) {
        $super(id, options);
		
    },

    show: function($super, element) {
        $super(element);
		
		document.observe('EWS:kmAuthModeChanged', function(e) {
            this.__editMode = global.kmAuthModeEnabled;
            this.getIA();
        } .bindAsEventListener(this));
        document.observe('EWS:kmAuthSimulationChanged', function(e) {
            this.__editSimulation = global.kmAuthSimulationEnabled;
        } .bindAsEventListener(this));

		if(!$('km_auth_mode'))
			var authBar = new AuthBar();
		
		this.__editMode = global.kmAuthModeEnabled;
		this.changeTitle(global.getLabel(global.currentApplication.mnmid).truncate(33, '...'));
	   	
		if(this.firstRun)
			this.selectedMenu = global.currentApplication.mnmid;
		
		if(this.firstRun){
			this.getIA();
			this.firstRun=false;
		}else{
			if(this.checkMenu()==false){
				this.buildIA();
			}
		}
		
		
		
    },

	
	checkMenu: function(){
		if(global.currentApplication.mnmid != this.selectedMenu){
			var x = this.getIA();
			this.selectedMenu = global.currentApplication.mnmid;
			return true;
		}else{
			return false;
		}
		
	},

    getIA: function(v) {
        if(v){
			this.__version = v;
		}
		
		if (this.__editMode == true){
			this.__isAuthor ='X';
		}
		else{
			this.__isAuthor = '';
		}
		
		var isSimulation = (this.__editSimulation)? 'X': '';

		this.makeAJAXrequest($H({ xml:
            '<EWS>' +
             '<SERVICE>KM_GET_MENU2</SERVICE>' +
             '<DEL/>' +
             '<PARAM>' +
			 '		<I_V_AUTHORING>'+this.__isAuthor+'</I_V_AUTHORING>'+
             '		<I_V_AREA_ID>' + global.currentApplication.mnmid + '</I_V_AREA_ID>' +
             '		<I_V_SUB_AREA_ID></I_V_SUB_AREA_ID>' +
			 '		<I_V_SIMULATION_ON>'+ isSimulation +'</I_V_SIMULATION_ON>'+
             //'<I_V_VERSION>' + this.__version + '</I_V_VERSION>' +
             '</PARAM>' +
            '</EWS>',
            //successMethod: 'buildIA'
			successMethod: function(json){
				this.IAItems = json;
				this.__viewMode = false;
				this.buildIA(json)
			}.bind(this)
        }));

    },
	
	
	reinstateSelectedVer: function(v){
		
		var isSimulation = (this.__editSimulation)? 'X': '';
		
		this.makeAJAXrequest($H({ xml:
            '<EWS>' +
             '<SERVICE>KM_REINST_MENU</SERVICE>' +
             '<DEL/>' +
             '<PARAM>' +
			 '<I_V_CONTENT_ID>'+v+'</I_V_CONTENT_ID>'+
             '<I_V_AREA_ID>' + global.currentApplication.mnmid + '</I_V_AREA_ID>' +
             '<I_V_SUB_AREA_ID></I_V_SUB_AREA_ID>' +
			 '<I_V_SIMULATION_ON>'+ isSimulation +'</I_V_SIMULATION_ON>'+
             '</PARAM>' +
            '</EWS>',
			successMethod: function(json){
				this.IAItems = json;
				this.__checkOut = true;
				this.__viewMode = false;
				this.buildIA(json)
			}.bind(this)
        }));
				
	},
	
	
	
	getSelectedVersion: function(v){
		if(v){
			this.__version = v;
		}
		var isSimulation = (this.__editSimulation)? 'X': '';
		
		this.makeAJAXrequest($H({ xml:
            '<EWS>' +
             '<SERVICE>KM_GET_MNU_VER2</SERVICE>' +
             '<DEL/>' +
             '<PARAM>' +
			 '<I_V_AUTHORING>'+this.__isAuthor+'</I_V_AUTHORING>'+
             '<I_V_AREA_ID>' + global.currentApplication.mnmid + '</I_V_AREA_ID>' +
             '<I_V_SUB_AREA_ID></I_V_SUB_AREA_ID>' +
             '<I_V_VERSION>' + this.__version + '</I_V_VERSION>' +
			 '		<I_V_SIMULATION_ON>'+ isSimulation +'</I_V_SIMULATION_ON>'+
             '</PARAM>' +
            '</EWS>',
			successMethod: function(json){
				if(this.oldItems== null){
					this.oldItems = this.IAItems;
				}
				if(this.oldCid== null){
					this.oldCid = this.__contentid;
				}
				this.__viewMode = true;
				this.buildIA(json)
				this.buildViewMode();
			}.bind(this)
        }));
	},

    buildIA: function(json) {
		
		if(!this.__newContentId){
			if(json){
				this.IAItems = json;
			}else{
				if(this.IAItems){
					json = this.IAItems;
				}
			}
		}else{
			this.__contentid =this.__newContentId;
			this.__newContentId = null;
		}

		
        if(json)
		this.__checkOut = (json.EWS.o_v_is_checkout=='X')? true : false;
		
		if(json)
		this.__contentid = json.EWS.o_v_content_id;
		
		if (this.__editMode) {
            var o = $('km_menu_widgets_optionsButton');
            if (!o) {
                this.optionsButton = new Element('div', {
                    'class': 'km_widget_option_button menus_align_icon',
                    id: 'km_menu_widgets_optionsButton',
                    'title': 'Options'
                });
                this.widget.widgetTitle.insert(this.optionsButton);
                this.optionsButton.observe('click', function(e) {
                    this.__rootMenu.show(e);
                } .bindAsEventListener(this));
            } else {
                this.optionsButton.show();
            }

			if (json && json.EWS.o_w_menu['@content_id']==0){
				var mitems1 = 
				[
					{name: global.getLabel('KM_CREATE_MENU'),callback: this.addNewMenu.bindAsEventListener(this)}
				]
			}
			else{
				        
				var mitems1 =
                [
					{ name: (!this.__checkOut && !this.__viewMode)? global.getLabel('KM_CHECKOUT_MENU'): '<span class=application_main_soft_text>'+global.getLabel('KM_CHECKOUT_MENU')+'</span>', callback: (!this.__checkOut && !this.__viewMode)?this.checkOut.bindAsEventListener(this): this.checkOut.bindAsEventListener(this) },
	                { name: (this.__checkOut)? global.getLabel('KM_CHECKIN_MENU'): '<span class=application_main_soft_text>'+global.getLabel('KM_CHECKIN_MENU')+'</span>', callback: (this.__checkOut)?this.checkIn.bindAsEventListener(this):this.checkIn.bindAsEventListener(this) },
	                { separator: true },
	                { name: (!this.__checkOut)?global.getLabel('KM_VERSIONS') + '...':'<span class=application_main_soft_text>'+global.getLabel('KM_VERSIONS')+'</span>', callback: (!this.__checkOut)?this.versions.bindAsEventListener(this):'' },
	                { name: (!this.__checkOut && !this.__viewMode)?global.getLabel('KM_PROMOTE_TO_ACTIVE'):'<span class=application_main_soft_text>'+global.getLabel('KM_PROMOTE_TO_ACTIVE')+'</span>', callback: (!this.__checkOut && !this.__viewMode)?this.promoteToActive.bindAsEventListener(this):'' },
	                { separator: true },
	                { name: (this.__checkOut)?global.getLabel('KM_NEW_MENU_NODE'):'<span class=application_main_soft_text>'+global.getLabel('KM_NEW_MENU_NODE')+'</span>', callback: (this.__checkOut)?this.addSubMenuNode.bindAsEventListener(this, true):'' }
	            ];
			}
			
            var mitems2 =
                [
                { name: global.getLabel('KM_RENAME') + '...', callback: this.renameNode.bindAsEventListener(this) },
                { name: global.getLabel('KM_LINK') + '...', callback: this.linkNode.bindAsEventListener(this) },
                { name: global.getLabel('KM_DELETE'), callback: this.deleteNode.bindAsEventListener(this) },
                { separator: true },
                { name: global.getLabel('KM_ADD_SUB_MENU'), callback: this.addSubMenuNode.bindAsEventListener(this, false) },
                { separator: true },
                { name: global.getLabel('KM_MOVE_UP'), callback: this.moveUpNode.bindAsEventListener(this) },
                { name: global.getLabel('KM_MOVE_DOWN'), callback: this.moveDownNode.bindAsEventListener(this) }
                ];
				
		 	var mitems3 =
                [
                { name: global.getLabel('KM_RENAME') + '...', callback: this.renameNode.bindAsEventListener(this) },
                { name: global.getLabel('KM_LINK') + '...', callback: this.linkNode.bindAsEventListener(this) },
                { name: global.getLabel('KM_DELETE'), callback: this.deleteNode.bindAsEventListener(this) },
                { separator: true },
                { name: '<span class=application_main_soft_text>'+global.getLabel('KM_ADD_SUB_MENU')+'</span>', callback: '' },
                { separator: true },
                { name: global.getLabel('KM_MOVE_UP'), callback: this.moveUpNode.bindAsEventListener(this) },
                { name: global.getLabel('KM_MOVE_DOWN'), callback: this.moveDownNode.bindAsEventListener(this) }
                ];

            this.__rootMenu = new Proto.Menu({
                menuItems: mitems1
            });
            this.__editMenu = new Proto.Menu({
                menuItems: mitems2,
				beforeHide: function(){
					this.__menuExist = false;
				}.bind(this)
            });
			this.__editSubMenu = new Proto.Menu({
                menuItems: mitems3
            });
			
        } else {
            if (this.optionsButton) {
                this.optionsButton.hide();
            }
        }

        var container = new Element("div", { 'id': 'IAMenu' });
        container.setAttribute('node', 0);
        this.changeContent(container);
		if (json) {
			this.parseLevel(json.EWS.o_w_menu, container);
		}
		else{
			root = subDiv = new Element("ul", {
            'id': 'node_0',
            'node': 0,
            'parent_node': '0'
        	});
        	container.insert(subDiv);
		}
		container.insert({ 'after': '<div style="clear:both;"></div>' });
		
		if(!this.__editMode){
			this.openSubMenu();
		}
    },
	
		
	openSubMenu: function(){		
		if($('node_0')){
			var allParentNodes = $$('li.node[parent_node=0]')
			var match = false;
			var currentMenuNode = null;
			
			allParentNodes.each(function(parentNode) {
				if(parentNode.getAttribute('text')==global.getLabel(global.currentApplication.sbmid)){
					match = true;
					currentMenuNode =parentNode;
				}
			}.bind(this));
			
			if(match){
				this.curItem = currentMenuNode;
				this.collapseExpandParentTarget(currentMenuNode);
			}
		}
	},
	
	collapseExpandParentTarget: function(span){
		this.curItem.addClassName('selected');
		var arr = span.getElementsByClassName('sub_node');		
		var element = span.down().next('ul');
		for (var x = 0; x < arr.length; x++) {
			if (element && (element.tagName == 'UL')) {
				if (element.visible() && !this.__menuExist) {
					this.collapseItem(element, span);
				}
				else {
					this.expandItem(element, span);
				}
			}
			element = element.next('ul');
		}
	
	},
	
	addNewMenu: function(){
		var isSimulation = (this.__editSimulation)? 'X': '';
		this.makeAJAXrequest($H({ xml:
            ' <EWS>' +
            '   <SERVICE>KM_MNU_CREATENW</SERVICE>' +
            '   <DEL/>' +
            '   <PARAM>' +
           // '       <I_V_CONTENT_ID>'+this.__contentid+'</I_V_CONTENT_ID>' +
            '		<I_V_AREA_ID>' + global.currentApplication.mnmid + '</I_V_AREA_ID>' +
            '		<I_V_SUB_AREA_ID></I_V_SUB_AREA_ID>' +
			//'		<I_V_SIMULATION_ON>'+ isSimulation +'</I_V_SIMULATION_ON>'+
            '   </PARAM>' +
            ' </EWS>',
            successMethod: function(json){
				this.__contentid = json.EWS.o_v_menu_id
				this.__newContentId = json.EWS.o_v_menu_id;
				this.__viewMode = false;
				this.__checkOut = true;
				this.buildIA();
			}.bind(this)
        }));


	},

    parseLevel: function(menu, div) {
		this.__levels.clear();
		if (this.__contentid == 0) {
			this.__contentid =this.__newContentId
		}
		else {
			this.__contentid = parseInt(menu['@content_id'], 10);
		}
		var node = 0, subDiv, root, order,isWeb;

        root = subDiv = new Element("ul", {
            'id': 'node_' + node,
            'node': node,
            'parent_node': '0'
        });
        div.insert(subDiv);
		this.__levels.push(node);
		if(menu.menu){
			
			var allMenuItems =objectToArray(menu.menu.yglui_str_ecm_ia);
			
			allMenuItems.each(function(item){
			order = parseInt(item['@order_id'],10);
            
			node = parseInt(item['@parent_node_id'],10);
			isWeb = (item['@is_web_content']=='X')? 'X' : '';

			
            this.__lastId = parseInt(item['@tax_node_id'],10)
            var rgb = 250 - 6 * node;
            
			var span = new Element("li", {
                'id': 'item_' + this.__lastId,
                'class': 'node'/*,
                style: 'padding-left:' + (8 * node) + 'px;'*/
            }).update('');
			
			span.setAttribute('order', order);
			span.setAttribute('is_web', isWeb);
            span.setAttribute('node', this.__lastId);
            span.setAttribute('parent_node', node);
            span.setAttribute('app', item['@appid']);
            span.setAttribute('tab', item['@tbmid']);
            span.setAttribute('view', (item['@view_id'] || 'StartPage'));
            span.setAttribute('content', item['@content_id']);
			span.setAttribute('text',prepareTextToShow(item['@system_name']))
            span.insert('<a id="anch_' + this.__lastId + '" class="aNode">' + prepareTextToShow(item['@system_name']) + '</a>');
			span.setAttribute('hasChild',item['@has_child'])
			subDiv = $('node_' + node);
			subDiv = $('node_' + node);
			if(!subDiv)
			root.insert(span);
            else
			subDiv.insert(span)
			
			if (this.__editMode && this.__checkOut) {
			   this.__setupEdit(span, this.__lastId, prepareTextToEdit(item['@system_name']));
            }
			
			
			subDiv = new Element("ul", {
                    'id': 'node_' + this.__lastId,
                    'node': this.__lastId,
                    'class': 'sub_node'
            });
			
			if(item['@has_child']=='X'){
				this.__levels.push(this.__lastId);
				span.insert(subDiv);
				subDiv.hide();
			}

			if(this.__levels){
				this.__levels = this.__levels.uniq()
					if(this.__levels.indexOf(node)>0){
						var sp = $('item_' + node);

						if(sp.getElementsByClassName('arrow_right').length <= 0){
							sp.update('<span id="arw_' + sp.getAttribute('node') + '" class="arrow_right"></span>' + sp.innerHTML);
						}	
					}
			}


            span.observe("mouseover", this.onItemMouseOver.bindAsEventListener(this));
            span.observe("mouseout", this.onItemMouseOut.bindAsEventListener(this));
            span.observe("click", this.onItemClick.bindAsEventListener(this));

            this.__i[this.__lastId] = order;
			
			
			}.bind(this));

		}
        if (this.__editMode && this.__checkOut) {
           div.insert('<span class="iamenu_help">'+global.getLabel('KM_DRAG_and_DROP_MENU')+'</span>');
           this.createSortable();
        }
    },
	
	createTaxPopUP: function(){
/* 	var html = ''
        + '<div style="width:100%;" id="link_' + this.__cid + '"><table style="width:100%;">'
        + '<tr>'
        + '</tr>'
        + '<tr>'
        + ' <td colspan="3"><div id="app_TaxonomyAuthoring"></div></td>'
        + '</tr>'
        + '<tr><td></td><td id="kmm_ok_cancel"></td></tr>'
        + '</table></div><br/>'; */
		
		var html = new Element('div',{
			'id': 'link_'+this.__cid,
			'style': 'width:100%'
		});
		
		var table = new Element('table',{
			'style': 'width:100%;'
		});
		
		var tr = new Element('tr');
		table.insert(tr);
		
		tr = new Element('tr');
			var td  = new Element('td',{
				'colspan': '3'
			});
				var app_TaxonomyAuthoring = new Element('div',{
					'id': 'app_TaxonomyAuthoring'
				});
			td.insert(app_TaxonomyAuthoring);
		tr.insert(td);
		
		tr = new Element('tr');
		td = new Element('td');
		tr.insert(td);
		td = new Element('td',{
			'id': 'kmm_ok_cancel'
		});
		tr.insert(td);
		table.insert(tr);
		html.update(table);
		
/* 		var htmlContent = ''
		+'<table style="width:100%;">'
        + '<tr>'
        + '</tr>'
        + '<tr>'
        + ' <td colspan="3"><div id="app_TaxonomyAuthoring"></div></td>'
        + '</tr>'
        + '<tr><td></td><td id="kmm_ok_cancel"></td></tr>'
        + '</table>';
		html.update(htmlContent); */
		 
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
                this.__keywords = taxBrowser.submitSelections();
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
        $('kmm_ok_cancel').insert(btns.getButtons());
	},
	
	__setupEdit: function(span, iid, trns){

		if (span.id == 'litemp') {
			iid = this.__cid;//"style": "margin-right: 5px; right: 10px; border: 0 none;padding-top: -5px"
			var opt= new Element('button', {
				'id': 'edit_temp',
				'style': 'margin-right: 5px; right: 10px; border: 0 none;padding-top:10px;border-color: transparent;',
				'class': 'application_editSelection2'
			});
			
			
			span.insert(optt)
		}
		else {
			var opt= new Element('button', {
				'id': 'edit_' + iid,
				'style': 'margin-right: 5px; right: 10px; border: 0 none;padding-top:10px;border-color: transparent;',
				'class': 'application_editSelection2',
				'node': iid,
				'text': trns
			});
			span.insert(opt)
		}                
	},

    createSortable: function(newNode) {
		this.__levels = this.__levels.sort(function(a, b) {
            return b - a;
        } .bind(this));

		this.__levels = this.__levels.uniq();
      
		var levels = [];
        this.__levels.each(function(l) {
            levels.push('node_' + l);
        } .bind(this));
        this.__levels.each(function(l) {
				Sortable.create('node_' + l, {
                tag: 'li',
                dropOnEmpty: true,
                containment: levels,
                onUpdate: function(element) {
                    this.updateOrder(element);
                } .bind(this)
            });
        } .bind(this));
    },

    updateOrder: function(node) {	
		var o, p, e, ri, rf;
        var nodeTable=''
		o = Sortable.sequence(node.id);
        o.each(function(i) {
			e = $('item_' + i);
            ri = parseInt(e.getAttribute('order'));
            p = parseInt(node.getAttribute('node'));
            rf = o.indexOf(i) + 1;
		
		nodeTable += '<yglui_str_ecm_translate '+
		'appid'+'="'+$('item_'+i).getAttribute('app')+'" '+
		'content_id'+'="'+$('item_'+i).getAttribute('content')+'" '+
		'has_child'+'="'+$('item_'+i).getAttribute('hasChild')+'" '+
		'parent_node_id'+'="'+$('item_'+i).getAttribute('parent_node')+'" '+
		'system_name'+'="'+$('item_'+i).getAttribute('text')+'" '+
		'tax_node_id'+'="'+$('item_'+i).getAttribute('node')+'" '+
		'tbmid'+'="'+$('item_'+i).getAttribute('tab')+'" '+
		'view_id'+'="'+$('item_'+i).getAttribute('view')+'"'+
		'></yglui_str_ecm_translate>';
        
		
		} .bind(this));
		this.makeAJAXrequest($H({ xml:
            ' <EWS>' +
            '    <SERVICE>KM_MENU_DRAG</SERVICE>' +
			'    <PARAM>' +
			'    	<I_V_MENU_ID>'+this.__contentid+'</I_V_MENU_ID>' +
			'    	<I_V_PARENT_NODE_ID>'+node.getAttribute('node')+'</I_V_PARENT_NODE_ID>' +
			'    	<I_I_TAX>'+nodeTable+'</I_I_TAX>' +
			'    </PARAM>' +
            ' </EWS>',
            successMethod: 'findChildren'
        }));
	
	},
		
	findChildren: function(){

		var ctr = 0;
		this.__levels.uniq();
		this.__levels.each(function(level) {
			if(level!=0){
				var x = $('node_'+level)
				if(!x){
					$('item_'+level).setAttribute('haschild','');
					$('arw_'+level).remove();
					this.__levels.splice(ctr,1)
				}
			}
			ctr++
        } .bind(this));
	},


    onItemClick: function(event) {
		if (Prototype.Browser.IE == false) {
			if (event.target.getAttribute('class') == 'application_editSelection2') {
				this.__cid = event.target.getAttribute('node');
				this.__trns = event.target.getAttribute('text');
				if($('item_'+this.__cid).getAttribute('parent_node')==0)
				this.__editMenu.show(event);
				else
				this.__editSubMenu.show(event);
				this.__menuExist = true;
			}
		}
		else{
			if(!event){
				event = window.event;
			}
			target = event.srcElement;
			if(target.getAttribute('className')=='application_editSelection2'){
				this.__cid = target.getAttribute('node');
				this.__trns = target.getAttribute('text');
				//this.__editMenu.show(event);
				//this.__menuExist = true;
				if($('item_'+this.__cid).getAttribute('parent_node')==0)
				this.__editMenu.show(event);
				else
				this.__editSubMenu.show(event);
				this.__menuExist = true;
			}
		}
			
			
			if(Prototype.Browser.IE == false){
				target = event.target
			}
			else{
				if(!event){
					event == window.event;
				}
				target = event.srcElement;
			}
			
			
			var span = this._getSpan(event);
			if (!span) 
				return;	 
			
			if(target.hasClassName('arrow_down')||target.hasClassName('arrow_right')||target.hasClassName('application_editSelection2')){
				
				if(target.hasClassName('application_editSelection2'))
				span = span;
				else
				span = span.parentNode;
				
				this.prvItem = this.curItem;
				this.curItem = span;
				
				this.curItem.addClassName('selected');
				
				var prvLevel = (this.prvItem) ? parseInt(this.prvItem.getAttribute('parent_node')) : 1;
				var curLevel = (this.curItem) ? parseInt(this.curItem.getAttribute('parent_node')) : 1;
				
				
				if (this.prvItem && (this.prvItem != this.curItem)) {
					this.prvItem.removeClassName('selected');
				}
				
				var arr = span.getElementsByClassName('sub_node');		
				var element = span.down().next('ul');
				for (var x = 0; x < arr.length; x++) {
					if (element && (element.tagName == 'UL')) {
						if (element.visible() && !this.__menuExist) {
							this.collapseItem(element, span);
						}
						else {
							this.expandItem(element, span);
						}
					}
					element = element.next('ul');
				}
				
			}
			else if (target.hasClassName('node') || target.hasClassName('aNode')){

				
				this.prvItem = this.curItem;
				this.curItem = span;
				
				this.curItem.addClassName('selected');
				
				var prvLevel = (this.prvItem) ? parseInt(this.prvItem.getAttribute('parent_node')) : 1;
				var curLevel = (this.curItem) ? parseInt(this.curItem.getAttribute('parent_node')) : 1;
				
				
				if (this.prvItem && (this.prvItem != this.curItem)) {
					this.prvItem.removeClassName('selected');
				}
				
				if (!this.__editMode) {
					var app = span.getAttribute('app');
					var tab = span.getAttribute('tab');
					var view = span.getAttribute('view');
					var content = span.getAttribute('content');
					var isWeb = span.getAttribute('is_web');
					this.launchApp(app, tab, view, content,isWeb);
				}
				
			}
    },

    onItemMouseOver: function(event) {
        var span = this._getSpan(event);
        span.addClassName('hover');
    },

    onItemMouseOut: function(event) {
        var span = this._getSpan(event);
        span.removeClassName('hover');
    },

    _getSpan: function(event) {
        var element = Event.element(event);

        var tag = element.tagName;
        var span = element;
        if ((tag == 'A') || (tag == 'BUTTON')) {
            span = element.up();
        }
        return span;
    },

    launchApp: function(app, tab, view, content,isWeb) {
	
		if(parseInt(content,10)<=0){
		
			var html = new Element('div',{
				'id': 'inpt_' + this.__cid,
				'style': 'width:100%;'
			});
			
			var htmlContent =''
			+'<table style="width:100%;">'
			+ '<tr>'
			+ '  <td>'+global.getLabel('KM_NODE_NOT_LINKED')+'</td>'
			+ '</tr>'
			+ '<tr><td></td><td id="kmm_no_node_ok"></td></tr>'
			+ '</table>';
			html.update(htmlContent);
				
			popUpNoNode = new infoPopUp({
				closeButton: $H({
					'callBack': function() {
						popUpNoNode.close();
						delete popUpNoNode;
					}
				}),
				htmlContent: html,
				indicatorIcon: 'exclamation',
				width: 400
			});
			popUpNoNode.create();

			var jn = { elements: [] };
			var ok = {
				idButton: 'km_btn_ok',
				label: global.getLabel('KM_OK'),
				type: 'button',
				handler: function() {
					popUpNoNode.close();
					delete popUpNoNode;
				} .bind(this),
				standardButton: true
			};
					
			jn.elements.push(ok);
			btns = new megaButtonDisplayer(jn);
			$('kmm_no_node_ok').insert(btns.getButtons());
			
			
		}else{
			if(isWeb){
				global.open($H({
					app: {
						tabId: global.currentApplication.tabId,
						appId: 'TST_SPAG',
						view:  'StartPage'
					},
					createContent: false,
					contentID: (content)? content : ''
				}));		
			}else{
				this.openFile(content)
			}

		}
		
    },
	
	openFile: function(contentId) {
		var xmlin = ''
			+ '<EWS>'
			+ '<SERVICE>KM_GET_FILE2</SERVICE>'
			+ '<OBJECT TYPE=""/>'
			+ '<DEL/><GCC/><LCC/>'
			+ '<PARAM>'
			+ '<I_V_CONTENT_ID>' + contentId + '</I_V_CONTENT_ID>'
			+ '</PARAM>'
			+ '</EWS>';
		window.open(this.buildURL(xmlin), '', 'width=300,height=300,resizable=yes,scrollbars=yes,toolbar=no,location=no');
	},
	
	/**
	*function that turns xml into query params
	*@param (string) xmlin
	*/
	buildURL: function(xmlin) {
        var url = this.url;
        while (('url' in url.toQueryParams())) {
            url = url.toQueryParams().url;
        }
        url = (Object.isEmpty(Object.values(((url).toQueryParams()))[0])) ? url + '?xml_in=' : url + '&xml_in=';

        return url + xmlin;
    },
	

    expandItem: function(element, span) {
		var x = span.getAttribute('node');
		var arrow = $('arw_' + span.getAttribute('node'));
        element.show();
        if (arrow) {
            arrow.addClassName('arrow_down');
            arrow.removeClassName('arrow_right');
        }
    },

    collapseItem: function(element, span) {
		var arrow = $('arw_' + span.getAttribute('node'));
        element.hide();
        if (arrow) {
            arrow.addClassName('arrow_right');
            arrow.removeClassName('arrow_down');
        }
    },

    checkOut: function(e) {
			
			this.makeAJAXrequest($H({ xml:
            ' <EWS>' +
            '   <SERVICE>KM_MENU_CHKOUT</SERVICE>' +
            '   <DEL/>' +
            '   <PARAM>' +
            '       <I_V_CONTENT_ID>'+this.__contentid+'</I_V_CONTENT_ID>' +
			'		<I_V_AUTHORING>'+this.__isAuthor+'</I_V_AUTHORING>'+
			'		<I_V_PAGE_NO>'+this.__versionPage+'</I_V_PAGE_NO>'+
            '   </PARAM>' +
            ' </EWS>',
            successMethod: 'getNewContent'
        }));
    },
	
	getNewContent: function(json){
		this.__checkOut = true;
		this.__contentid = json.EWS.o_v_new_content_id;
		this.getIA();
	},
	
    checkIn: function(e) {
			this.makeAJAXrequest($H({ xml:
            ' <EWS>' +
            '   <SERVICE>KM_MENU_CHECKIN</SERVICE>' +
            '   <DEL/>' +
            '   <PARAM>' +
            '       <I_V_CONTENT_ID>'+this.__contentid+'</I_V_CONTENT_ID>' +
			'		<I_V_AUTHORING>'+this.__isAuthor+'</I_V_AUTHORING>'+
			'		<I_V_PAGE_NO>'+this.__versionPage+'</I_V_PAGE_NO>'+
            '   </PARAM>' +
            ' </EWS>',
            successMethod: 'checkInSuccess'
        }));
    },
	
	checkInSuccess: function(json){
		this.__checkOut = false;
		this.getIA();
	},
	
    versions: function(e) {
		var html = '';
        html += '' +
        '<div id="km_versions_cont" style="width:90%;"></div><div id="verNextPrev" style="width:90%;"></div><div id="km_versions_ok"  style="text-align:center;margin-top:10px;padding-left:140px;"></div>';
        popUp = new infoPopUp({
            closeButton: $H({
                'callBack': function() {
                    popUp.close();
                    delete popUp;
                }
            }),
            htmlContent: html,
            indicatorIcon: 'void',
            width: 400
        });
        popUp.create();

        this.__popUp = popUp;

        var jn = { elements: [] };
        var ok = {
            idButton: 'km_btn_ok',
            label: global.getLabel('KM_OK'),
            type: 'button',
            handler: function() {
                popUp.close();
                delete popUp;
            } .bind(this),
            standardButton: true
        };
				
        jn.elements.push(ok);
        btns = new megaButtonDisplayer(jn);
        $('km_versions_ok').insert(btns.getButtons());
		this.getVersion();
    },
	
	getVersion: function(){
            var isSimulation = (this.__editSimulation)? 'X': '';
			this.makeAJAXrequest($H({ xml:
            ' <EWS>' +
            '   <SERVICE>KM_GET_MENU_VER</SERVICE>' +
            '   <DEL/>' +
            '   <PARAM>' +
			'       <I_V_CONTENT_ID>'+this.__contentid+'</I_V_CONTENT_ID>' +
			'		<I_V_AUTHORING>'+this.__isAuthor+'</I_V_AUTHORING>'+
			'		<I_V_PAGE_NO>'+this.__versionPage+'</I_V_PAGE_NO>'+
			'		<I_V_SIMULATION_ON>'+ isSimulation +'</I_V_SIMULATION_ON>'+
            '   </PARAM>' +
            ' </EWS>',
			successMethod: function(j){
					if(j.EWS.o_i_version_list !=null){
						if($('km_versions_cont'))
							$('km_versions_cont').update('')
						this.buildVersions(j)
					}
					else{
						$('nextVerList').addClassName('application_main_soft_text');
						$('nextVerList').stopObserving();
						this.__versionPage--;
					}

			}.bind(this)
			//successMethod: 'buildVersions'
            })); 
	},

    buildVersions: function(json) {
		if(json.EWS.o_i_version_list.yglui_str_ecm_ver)
		var items = objectToArray(json.EWS.o_i_version_list.yglui_str_ecm_ver);
		
		if(items){
				var html = '' +
	        '   ' + global.getLabel('KM_VERSIONS') + ':<br/>' +
	        '   <table class="sortable resizable">' +
	        '       <thead>' +
	        '           <tr>' +
	        '               <th>' + global.getLabel('KM_VERSION') + '</th>' +
	        '               <th>' + global.getLabel('KM_AUTHOR') + '</th>' +
	        '               <th>' + global.getLabel('KM_DATE') + '</th>' +
			'               <th></th>' +
			'               <th></th>' +
	        '           </tr>' +
	        '       </thead>' +
	        '       <tbody>';
	
	        items.each(function(v) {
	            html += '' +
	            '<tr>' +
	            '   <td style="cursor:pointer;" id="km_version_' + v['@version'] + '"><span class="application_action_link" v="' + v['@content_id'] + '">' + v['@version'] + '</span></td>' +
	            '   <td style="cursor:pointer;">' + v['@author'] + '</td>' +
	            '   <td style="cursor:pointer;">' + v['@creation_date'] + '</td>' +
				'   <td style="cursor:pointer;" id="km_Menu_Version_view_' + v['@version'] + '"><span class="application_action_link" v="' + v['@content_id'] + '">'+global.getLabel('KM_VIEW')+'</span></td>' +
				'   <td style="cursor:pointer;" id="km_Menu_Version_reinstate_' + v['@version'] + '"><span class="application_action_link" v="' + v['@content_id'] + '">'+global.getLabel('KM_MEN_REINSTATE')+'</span></td>' +
	            '</tr>';
	
	        } .bind(this));
	
	        html += '' +
	        '       </tbody>' +
	        '   </table>';
	
	        $('km_versions_cont').insert(html);
	        TableKit.Sortable.init($('km_versions_cont').down('table'), {
	            marginL: 10,
	            autoLoad: false,
	            resizable: false
	        });
	
	        items.each(function(v) {
	            $('km_Menu_Version_view_' + v['@version']).observe('click', function(v) {
					this.getSelectedVersion(v);
	            } .bind(this, v['@version']));
	        } .bind(this));
			
			items.each(function(v) {
	            $('km_Menu_Version_reinstate_' + v['@version']).observe('click', function(v) {
					this.reinstateSelectedVer(v);
	            } .bind(this, v['@content_id']));
	        } .bind(this));
			
	
			var spanNext = new Element("span", {
		    	'id': 'nextVerList',
				'class': 'application_action_link'
			}).update(global.getLabel('KM_NEXT'));
			
			var spanPrevious = new Element("span", {
		    	'id': 'prevVerList',
				'class': 'application_action_link'
			}).update(global.getLabel('KM_PREVIOUS'));
			
			$('verNextPrev').update(spanPrevious);
			$('verNextPrev').insert(spanNext);
			
			spanNext.observe('click', function(v) {
				this.__versionPage++;	
				this.getVersion();
			}.bindAsEventListener(this));
			
			if(this.__versionPage==1){
				spanPrevious.addClassName('application_main_soft_text');
			}
			else{
				spanPrevious.removeClassName('application_main_soft_text');
				spanPrevious.observe('click', function(v) {
					this.__versionPage--;
					this.getVersion();
				} .bindAsEventListener(this));
			}
		}else{
			
		}
        
    },
	
	
    promoteToActive: function(e) {
        this.approve();
    },
    addMenuNode: function(e) {
        this.save({ 'action': 'move_up' });
    },



    renameNode: function(e) {

		this.__lngAC = [];
        this.__l = 0;

/*         var html = ''
        + '<div style="width:100%;" id="inpt_' + this.__cid + '"><table style="width:100%;">'
        + '<tr>'
        + '  <td style="width:44%;"><span style="">Default translation (' + global.language + '): </span></td>'
        + '  <td><input style="" id="name_' + this.__cid + '" type="text" value ="' + this.__trns + '" /></td>'
        + '</tr>'
        + '<tr><td></td><td id="kmm_ok_cancel"></td></tr>'
        + '</table></div>'; */
		
		
		
		var html = new Element('div',{
			'id': 'inpt_' + this.__cid,
			'style': 'width:100%;'
		});
		
		var htmlContent =''
		+'<table style="width:100%;">'
        + '<tr>'
        + '  <td style="width:44%;"><span style="">Default translation (' + global.language + '): </span></td>'
        + '  <td><input style="" id="name_' + this.__cid + '" type="text" value ="' + this.__trns + '" /></td>'
        + '</tr>'
        + '<tr><td></td><td id="kmm_ok_cancel"></td></tr>'
        + '</table>';
		html.update(htmlContent);
		
        var popUp = new infoPopUp({
            closeButton: $H({
                'callBack': function() {
                    popUp.close();
                    delete popUp;
                }
            }),
            htmlContent: html,
            indicatorIcon: 'void',
            width: 400
        });
        popUp.create();

        var jn = { elements: [] };
        var cancel = {
            idButton: 'km_btn_cancel',
            label: 'Cancel',
            type: 'button',
            handler: function() {
                popUp.close();
                delete popUp;
            } .bind(this),
            standardButton: true
        };
        var submit = {
            idButton: 'km_btn_submit',
            label: 'Ok',
            type: 'button',
            handler: function() {
				var def = $('name_' + this.__cid);
				$('anch_' + this.__cid).update(prepareTextToShow(def.value.escapeHTML()))
				$('item_'+this.__cid).setAttribute('text',def.value)
				this.save({
                    'action': 'R',
                    'nodeId': this.__cid,
                    'nodeName': def.value,
					'menuId': this.__contentid,
                    'lang': global.language
                });
                for (var i = 0; i < this.__l; i++) {
                    var inpt = $('name_trans_' + i);
                    var v = this.__lngAC[i].getValue();
                    if (inpt && v) {
                        this.save({
                            'action': 'R',
                            'nodeId': this.__cid,
                            'nodeName': inpt.value,
							'menuId': this.__contentid,
                            'lang': v.idAdded
                        });
                    }
                }
                popUp.close();
                delete popUp;
            } .bind(this),
            standardButton: true
        };
        jn.elements.push(submit);
        jn.elements.push(cancel);
        btns = new megaButtonDisplayer(jn);
        $('kmm_ok_cancel').insert(btns.getButtons());

    },

    linkNode: function(e) {
		
		var html = new Element('div',{
			'id': 'link_'+this.__cid,
			'style': 'width:100%;'
		});

		var appDiv = new Element('div',{
			'id': 'app_ContentBrowser2'
		});
		html.update(appDiv);
		
		var kmm_ok_cancel = new Element('div',{
			'id': 'kmm_ok_cancel'
		});
		html.insert(kmm_ok_cancel);
		
		
		var popUp = new infoPopUp({
			closeButton: $H({
				'callBack': function() {
					popUp.close();
					delete popUp;
				}
			}),
			htmlContent: html,
			indicatorIcon: 'void',
			width: 800
		});
		popUp.create();
				
		var browser = new ContentBrowser({
			className: 'ContentBrowser2',
			appId: 'KM_BRWSR',
			multiSelect: false
		});
		
		
		browser.virtualHtml = $('app_ContentBrowser2');
		browser.run();
		
		browser.virtualHtml.down('.km_listCont').setStyle({
		  width: '75%',
		  float: 'left'
		});
		
		
        var jn = { elements: [] };
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
        var submit = {
            idButton: 'km_btn_submit',
            label: global.getLabel('KM_OK'),
            type: 'button',
            handler: function() {
                var c = browser.getSelectedContent();
                if (/*v2 && v3 &&*/ (/*v1 || */c)) {
                    this.saveLinkNode({
						'menuId': this.__contentid,
                        'nodeId': this.__cid,
						'linkContentId': c.id
                    });
                }
                popUp.close();
                delete popUp;
            } .bind(this),
            standardButton: true
        };
        jn.elements.push(submit);
        jn.elements.push(cancel);
        btns = new megaButtonDisplayer(jn);
        $('kmm_ok_cancel').insert(btns.getButtons());
    },
	
	saveLinkNode: function(args){
		this.makeAJAXrequest($H({ xml:
            ' <EWS>' +
            '   <SERVICE>KM_LINK_NODE</SERVICE>' +
            '   <DEL/>' +
            '   <PARAM>' +
            '       <I_V_MENU_ID>'+args.menuId+'</I_V_MENU_ID>' +
			'       <I_V_NODE_ID>'+args.nodeId+'</I_V_NODE_ID>' +
			'       <I_V_CONTENT_ID>'+args.linkContentId+'</I_V_CONTENT_ID>' +
			'		<I_V_AREA_ID>' + global.currentApplication.mnmid + '</I_V_AREA_ID>' +
            '		<I_V_SUB_AREA_ID></I_V_SUB_AREA_ID>' +
            '       </PARAM>' +
            ' </EWS>',
			successMethod: function(j){
					$('item_'+args.nodeId).setAttribute('content',args.linkContentId)
			}.bind(this)
        }));
	},
	

    deleteNode: function(e) {
        $('item_' + this.__cid).remove();
		this.save({ 'action': 'D', 'menuId': this.__contentid,'nodeId': this.__cid });
    },

    addSubMenuNode: function(e, root) {
        var id = ++this.__lastId;
		this.__isRoot = root;

        if (root) {
			this.__cid=0;
            this.save({ 'action': 'A', 'menuId': this.__contentid,'nodeName': global.getLabel('KM_NEW_NODE'), 'parentId': 0 });
        } else {
            this.save({ 'action': 'A','menuId': this.__contentid, 'parentId': this.__cid, 'nodeName': global.getLabel('KM_NEW_NODE') });
        }

    },

    moveUpNode: function(e) {
		var cur = $('item_' + this.__cid);
        var prev = cur.previous('li');
        if (prev) {
            new Insertion.Before(prev, cur);
			this.save({ 'action': 'P', 'direction': 'UP','menuId': this.__contentid, 'nodeId': cur.getAttribute('node'),'nodeOrder': cur.getAttribute('order'),'cNode': cur, 'pNode': prev });
        }
    },

    moveDownNode: function(e) {
		var cur = $('item_' + this.__cid);
        var next = cur.next('li');
        if (next) {
            new Insertion.After(next, cur);
           // this.save({ 'action': 'A', 'menuId': this.__contentid,'nodeName': global.getLabel('KM_NEW_NODE'),'nodeId': id, 'parentNodeId': 0 });
			this.save({ 'action': 'W','menuId': this.__contentid, 'nodeId': cur.getAttribute('node'),'nodeOrder': cur.getAttribute('order'),'cNode': cur,'nNode': next });
        }
    },

    approve: function() {
		this.makeAJAXrequest($H({ xml:
            ' <EWS>' +
            '   <SERVICE>KM_MENU_APPROVE</SERVICE>' +
            '   <DEL/>' +
            '   <PARAM>' +
            '       <I_V_CONTENT_ID>'+this.__contentid+'</I_V_CONTENT_ID>' +
			'		<I_V_AREA_ID>' + global.currentApplication.mnmid + '</I_V_AREA_ID>' +
            '		<I_V_SUB_AREA_ID></I_V_SUB_AREA_ID>' +
            '   </PARAM>' +
            ' </EWS>',
            successMethod: function(j){
					this.__contentid = j.EWS.o_v_content_id;
			}.bind(this)
        }));
    },

	save: function(args) {

		this.makeAJAXrequest($H({ xml:
		'<EWS>'+
		'<SERVICE>KM_SAVE_MEN</SERVICE>'+
		'<DEL/>'+
		'<PARAM>'+
		((args.menuId) ?'<I_V_MENU_ID>' + (args.menuId || '') + '</I_V_MENU_ID>' : '') +
		((args.parentId) ?'<I_V_PARENT_NODE_ID>' + (args.parentId || '') + '</I_V_PARENT_NODE_ID>' : '')+
		((args.nodeOrder) ?'<I_V_NODE_ORDER_ID>' + (args.nodeOrder || '') + '</I_V_NODE_ORDER_ID>' : '')+
		((args.nodeName) ? '<I_V_NODE_NAME>' + (prepareTextToSend(args.nodeName) || '') + '</I_V_NODE_NAME>' : '')+
		((args.nodeId) ?'<I_V_NODE_ID>' + (args.nodeId || '') + '</I_V_NODE_ID>' : '')+
		((args.direction) ?'<I_V_DIRECTION>' + (args.direction || '') + '</I_V_DIRECTION>' : '')+
		((args.lang) ?'<I_V_LANGU>' + (args.lang || '') + '</I_V_LANGU>' : '')+
		((args.action) ?'<I_V_ACTION>' + (args.action || '') + '</I_V_ACTION>' : '')+
		'<I_V_AREA_ID>' + global.currentApplication.mnmid + '</I_V_AREA_ID>' +
		'<I_V_SUB_AREA_ID></I_V_SUB_AREA_ID>' +
		'</PARAM>'+
		'</EWS>',
		successMethod: function(json){
			switch(args.action){
				case 'A':
					this.addNodeSuccess(json)
					break;
				case 'D':
					this.deleteNodeSuccess();
					break;
				case 'P':
					this.moveUpSuccess(args.nodeId,args.cNode,args.pNode)
					break;
				case 'W':
					this.moveDownSuccess(args.nodeId,args.cNode,args.nNode);
					break;
				case 'R':
					this.renameSuccess();
					break;
			}
		}.bind(this)
		}));
	},

	AddNodeFail: function(){
		$('litemp').remove();
	},
	
	addNodeSuccess: function(json){
		if(this.__cid)
		var selectedNode = this.__cid;
		else
		var selectedNode = 0;
		
		this.__cid = parseInt(json.EWS.o_v_node_id,10);
		
		var sp = $('node_'+ selectedNode)
		
		var span = new Element("li", {
	    	'id': 'item_' + this.__cid,
	    	'class': 'node'
		}).update('');
				
		span.setAttribute('order', parseInt(json.EWS.o_v_node_order_id,10));
	    span.setAttribute('node', this.__cid);
	    span.setAttribute('parent_node', selectedNode);
	    span.setAttribute('app', '');
	    span.setAttribute('tab', '');
	    span.setAttribute('view','StartPage');
	    span.setAttribute('content','');
		span.setAttribute('text',global.getLabel('KM_NEW_NODE'))
	    span.insert('<a id="anch_' + this.__cid + '">' + global.getLabel('KM_NEW_NODE') + '</a>');
		span.observe("mouseover", this.onItemMouseOver.bindAsEventListener(this));
	    span.observe("mouseout", this.onItemMouseOut.bindAsEventListener(this));
	    span.observe("click", this.onItemClick.bindAsEventListener(this));
		
	
		if(selectedNode==0){
			sp.insert(span)
			span.setAttribute('hasChild','');
		}
		else{
			if(this.__levels.indexOf(parseInt(selectedNode))<0){
				span.setAttribute('hasChild','');
				this.__levels.push(selectedNode);
				subDiv = new Element("ul", {
					'id': 'node_' + selectedNode,
	                'node': selectedNode,
	                'class': 'sub_node'
	            });
				if(!$('arw_'+selectedNode)){
					$('item_'+selectedNode).setAttribute('hasChild','X');
					$('item_'+selectedNode).update('<span id="arw_' + selectedNode + '" class="arrow_right"></span>' + $('item_'+selectedNode).innerHTML)
				}
				if(!$('node_'+selectedNode)){
					$('item_'+selectedNode).insert(subDiv);
				}else{
					subDiv =$('node_'+selectedNode);
				}
				subDiv.insert(span);
				//subDiv.hide();
			}
			else{
				sp.insert(span);
				span.setAttribute('hasChild','');
			}
		}
		this.__setupEdit(span, this.__cid, global.getLabel('KM_NEW_NODE'));
		this.createSortable()
	
		
	},
	
	deleteNodeSuccess: function(){
		this.findChildren();
	},
	
	moveUpSuccess: function(nodeId,cNode,pNode){
		var n1 = parseInt(cNode.getAttribute('order'));
		n1--;
		var n2 = parseInt(pNode.getAttribute('order'));
		n2++;
		
		cNode.setAttribute('order',n1)
		pNode.setAttribute('order',n2);
	},
	
	moveDownSuccess: function(nodeId,cNode,nNode){
		var n1 = parseInt(cNode.getAttribute('order'));
		n1++;
		var n2 = parseInt(nNode.getAttribute('order'));
		n2--;
		
		cNode.setAttribute('order',n1)
		nNode.setAttribute('order',n2);
	},
	
	renameSuccess: function(json){
		//alert("renamesuccess")
	},
	
	loadActiveVersion: function(){
		this.__viewMode = false;
		this.buildIA(this.oldItems)
	},
	
	buildViewMode: function(){
		if (this.__viewMode) {
           	$('IAMenu').insert('<span style="font-style:italic;text-align:center;font-size:11px;padding:1px;padding-right:4px;float:left;width:100%">'+global.getLabel('KM_MEN_CURRENT_VIEW')+' '+ this.__version +'.</span>');
			$('IAMenu').insert('<span style="font-style:italic;color:#cccccc;text-align:center;font-size:11px;padding:1px;padding-right:4px;float:left;width:100%"><a class="application_action_link" id="returnVersionLink">'+global.getLabel('KM_MEN_CLICK_EXIT')+'</a></span>');
			//<a class="application_action_link" id="returnVersionLink">Currently Viewing version '+ this.__version +'.</a>
        	$('returnVersionLink').observe("click", this.loadActiveVersion.bindAsEventListener(this));
		}		
	}
});