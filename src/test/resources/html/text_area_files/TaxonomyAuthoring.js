/**
 * Contains all required classes, methods, attributes for Application
 * @fileoverview TaxonomyAuthoring.js
 */

/**
 * Contains all required methods and attributes for the class
 * @extends Application
 */
var TaxonomyAuthoring = Class.create(Application, {

	/**
	 * Contains all Languages
	 * @type Object
	 */
	__jsonLang: $H(),
	/**
	 * Contains all priority Langauge
	 * @type Object
	 */
	__lang: $H(),
	/**
	 * Contains current Taxonomy Id
	 * @type Integer
	 */
	__taxonomyCid: null,
	/**
	 * Check if check out is on
	 * @type Boolean
	 */
	__checkOut: false,
	/**
	 * Lanauge autocompleter
	 * @type Element
	 */
	langAutocompleter: null,
	/**
	 * Associative array to hold each character of alphabet
	 * @type Array
	 */
	alphabetArrays:{
		"EN":['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z','0','1','2','3','4','5','6','7','8','9'],
		"AR":['ا','ب','ت','ث','ج','ح','خ','د','ذ','ر','ز','س','ش','ص','ض','ط','ظ','ع','غ','ف','ق','ك','ل','م','ن','ه','و','ي','1','2','3','4','5','6','7','8','9']
	},
	/**
	 *  Main container for application
	 *  @type Element
	 */
	mainContainer: null,
	/**
	 * Context Menu For each Node
	 * @type Element
	 */
	__nodeMenu: null,
	/**
	 * Context Menu for Root Node
	 * @type Element
	 */
	__nodeMenuRoot: null,
	/**
	 * Selected keyword nodes
	 * @type Object
	 */
	__selectedKeyword: $H(),
	/**
	 * Save keyword pop up menu
	 * @type Element
	 */
	saveKeyPopUp: null,
	/**
	 * check if application is in Selection Mode
	 * @type Boolean
	 */
	selectionMode: false,
	/**
	 * Searche Mode 
	 * @type Boolean
	 */
	searchMenuMode: false,
	/**
	 * Page Parameters
	 * @type Object
	 */
	params:{
		page:0,
		letter:null,
		items:$A()
	},
	/**
	 * Node Levels
	 * @type Integer
	 */
	level: 0,
	/**
	 * Selected Keywords hash
	 * @type Array
	 */
	keywordHash: $H(),
	/**
	 * Keyword Counter
	 * @type Integer
	 */
	keywordCtr: 0,
	/**
	 * Page Temporary Varible
	 * @type Integer
	 */
	pageTemp: 0,
	/**
	 * Main taxonomy Container
	 * @type Element
	 */
	__taxContainer: null,
	/**
	 * Open Children Nodes
	 * @type Array
	 */
	openChildren: $A(),
	/**
	 * Application Edit Mode
	 * @type Boolean
	 */
	__editMode: null,
	/**
	 * Letter Element
	 * @type Element
	 */
	fullTaxShowAllLetter: null,
	/**
	 * Current page of version list
	 * @type Integer
	 */
	__versionPage: 1,
	
	/**
	* Simulation Flag
	* @type Boolean
	*/
	__editSimulation: null,
	
	/**
	 * View mode flag
	 * @type 
	 */
	__viewMode: false,
	
	/**
	 * Version List
	 * @type Object
	 */
	__version: null,
	/**
	 * Old Version List 
	 * @type Object
	 */
	__oldVersion: null,
	
	/**
	 * First Run Flag 
	 * @type Boolean
	 */
	__firstRun: true,
	
	/**
	 * display all supported (priority) language
	 * @type Array
	 */
	__allLang: $H(),
	
	/**
	 * All Languages
     * @type Array
	 */
	__supportedLang: $H(),


	/**
	 * Initialize class
	 * @param {Object} $super
	 * @param {Object} options
	 */
    initialize: function($super, options) {
		$super(options);
				
		if(!$('km_auth_mode'))
		var authBar = new AuthBar();
								
		if(options.selectionMode){
			this.selectionMode = true;
		}
		
		if(options.searchMenuMode){
			this.searchMenuMode = true;
		}
		
		if(!$('km_auth_mode'))
        var authBar = new AuthBar();
		
    },

	/**
	 *  Run the application
	 * @param {Object} $super
	 * @param {Object} args
	 */
    run: function($super, args) {
		if(!this.selectionMode){
			$super(args);
		}
		
		document.observe('EWS:kmAuthModeChanged', function(e) {
			this.__editMode = global.kmAuthModeEnabled;
			if (global.currentApplication.appId == 'KM_TAXAT') 
				this.__buildTax();
        }.bindAsEventListener(this));
		
		document.observe('EWS:kmAuthSimulationChanged', function(e) {
            this.__editSimulation = global.kmAuthSimulationEnabled;
    	} .bindAsEventListener(this));	
		
		
		this.__editMode = global.kmAuthModeEnabled;
		
		this.params.page = 1;
		
		this.__buildTax();
    },
	
	
	/**
	 * Build Taxonomy Main Area
	 */
	__buildTax: function(){
		this.virtualHtml.update();
		
		if(this.__firstRun){
			this.getSupportedLanguages();
			this.getAllLanguages();
			this.__firstRun = false;
		}
		this.browseFullTaxonomy();
	},
	
	/**
	 * Make ajax call and get all languages
	 */
	getAllLanguages: function(){
		this.makeAJAXrequest($H({ xml:
			'<EWS>'+
			'<SERVICE>MAINT_LANG</SERVICE>'+
			'<PARAM>'+
			//'<o_action>V</o_action>'+
			'</PARAM>'+
			'</EWS>',
			successMethod: 'buildAllLanguageList'
		}));
	},
	
	/**
	 * build all language list from autocompleter
	 * @param {Object} json
	 */
	buildAllLanguageList: function(json){
        if (json.EWS.labels) {
            var langs = json.EWS.labels.item;
			
			langs.each(function(i){
				this.__allLang.set(i["@id"],i["@value"]);
			}.bind(this));
        }
	},
	
	/**
	 * Make ajax call and get all (priority) language
	 */
	getSupportedLanguages: function(){
	//YGLUI_CLA_S_ECM_GET_LANGU
	//MAINT_LANG
		this.makeAJAXrequest($H({ xml:
			'<EWS>'+
			'<SERVICE>ECM_GET_LANGU</SERVICE>'+
			'<PARAM>'+
			//'<o_action>V</o_action>'+
			'</PARAM>'+
			'</EWS>',
			successMethod: 'buildLanguageList'
		}));
	},
	
	/**
	 * build all (priority) language
	 * @param {Object} json
	 */
	buildLanguageList: function(json){
        this.__jsonLang = {
            autocompleter: {
                object: [],
                multilanguage: {
                    no_results: global.getLabel('DML_NO_RESULTS'),
                    search: global.getLabel('DM_SEARCH')
                }
            }
        }
        if (json.EWS.o_i_langu) {
            var langs = json.EWS.o_i_langu.yglui_str_ecm_langu;
            for (var i = 0; i < langs.length; i++) {
                if (langs[i]["@laiso"] == global.language) {
					this.__jsonLang.autocompleter.object.push({
						def: 'X',
						data: langs[i]["@langu"],
						text: langs[i]["@txt"]
					})
					this.__lang.set(langs[i]["@laiso"],langs[i]["@langu"]);
				}
				else{
					this.__jsonLang.autocompleter.object.push({
						data: langs[i]["@langu"],
						text: langs[i]["@txt"]
					})
					this.__lang.set(langs[i]["@laiso"],langs[i]["@langu"]);
				}
            }
        }

	},
	
	/**
	 * Create global taxonomy browser elements
	 * @param {Object} evt
	 */
	browseFullTaxonomy : function(evt){
		var fullTaxContainer = new Element("div", {
            id: 'fullTaxContainer',
            'class': 'fullTaxContainer'
        });
		
		var title = new Element("div", {
            id: 'fullTaxTitle',
            'class': 'fullTaxTitle application_main_title'
        }).update(global.getLabel('KM_TAX_KEY_MAINTENANCE'));		
		fullTaxContainer.insert(title);
				
		var alphabetLabel = new Element("div", {
            id: 'fullTaxAlphabetLabel',
            'class': 'fullTaxAlphabetLabel'
        }).update(global.getLabel('KM_USE_THE_A-Z_FILTER_BELLOW'));		
		fullTaxContainer.insert(alphabetLabel);
		
		var alphabet = new Element("div", {
            id: 'fullTaxAlphabet',
            'class': 'fullTaxAlphabet'
        });
		
		var alphabetArray=this.alphabetArrays[global.language];
		
		alphabetArray.each(function(i){
			var letter = new Element("a", {
				id: 'fullTaxAlphabetLetter',
				'class': 'fullTaxAlphabetLetter application_action_link'
			}).update(i);
			letter.observe('click', this.updateFullTaxonomy.bindAsEventListener(this,i));
			alphabet.insert(letter);
		}.bind(this));
		fullTaxContainer.insert(alphabet);
		
		var versionStatus = new Element("div", {
            id: 'versionStatus',
            'class': 'fullTaxAlphabetLabel'
        }).update('');
		fullTaxContainer.insert(versionStatus);
		
		var fullTax = new Element("div", {
            id: 'fullTax',
            'class': 'fullTax',
			'style': 'max-height: none;' 
        });
		fullTaxContainer.insert(fullTax);
		
		var fullTaxActions = new Element("div", {
            id: 'fullTaxActions',
            'class': 'fullTaxActions'
        });
		
		var fullTaxShowMore = new Element("div", {
            id: 'fullTaxShowMore',
            'class': 'fullTaxShowMore application_action_link',
			'style': 'width: 25%'
        }).update(global.getLabel('KM_SHOW_10_MORE_KEYWORDS')+'...');
		
		
		var fullTaxShowLess = new Element("div", {
            id: 'fullTaxShowLess',
            'class': 'fullTaxShowMore application_action_link',
			'style': 'width: 25%'
        }).update(global.getLabel('KM_SHOW_LESS')+'...');
		
		
		
		fullTaxShowMore.observe('click', this.showMoreFullTaxonomy.bindAsEventListener(this));
		fullTaxShowLess.observe('click', this.showLessTaxonomy.bindAsEventListener(this));
		
		this.fullTaxShowAllLetter = new Element("div", {
            id: 'fullTaxShowAllLetter',
            'class': 'fullTaxShowAll application_action_link',
			'style': 'width: 25%;float: left'
        }).update(global.getLabel('KM_SHOW_ALL_KEYWORDS'));

		var fullTaxShowAll = new Element("div", {
            id: 'fullTaxShowAll',
            'class': 'fullTaxShowAll application_action_link',
			'style': 'width: 25%;float: left'
        }).update(global.getLabel('KM_SHOW_ALL_KEYWORDS'));
		
		fullTaxShowAll.observe('click', this.showAllFullTaxonomy.bindAsEventListener(this));
		this.fullTaxShowAllLetter.observe('click', this.showAllFullTaxonomyLetter.bindAsEventListener(this));
		fullTaxActions.insert(fullTaxShowMore);
		fullTaxActions.insert(fullTaxShowLess);
		fullTaxActions.insert(this.fullTaxShowAllLetter);
		this.fullTaxShowAllLetter.hide();
		fullTaxActions.insert(fullTaxShowAll);
		fullTaxContainer.insert(fullTaxActions);
		
		this.__taxContainer = new Element("ul", {
			'class': 'taxonomy'
		});
		
		var li,ul,arrow,div;
			
		li = this.buildRoot();
		this.__taxContainer.insert(li);
		fullTax.update(this.__taxContainer);
				
		var div = new Element('div',{
			id: 'taxonomy_container',
			'style': "text-align:left;float:left;width:99%;"
		})
		div.insert(fullTaxContainer);
		this.virtualHtml.insert(div);
		this.getFullTaxonomy();
		this.showLessOnOff(false);
	},
	
	
		
	submitSelections: function(){
		return this.keywordHash
	},
	
	
	/**
	 * Build Root keyword
	 */
	buildRoot: function(){
		li = new Element("li", {
				id: 'root',
				'class': 'taxLi',
				'level': this.level,
				'nodeid': 0 
		});
		if(!this.selectionMode){
			if (this.__editMode) {
				this.optionsButtonRoot = new Element('button', {
					'id': 'opt_root',
					'style': 'margin-right: 5px; right: 10px; border: 0 none;padding-top:10px;border-color: transparent;',
					'class': 'application_editSelection2'
				});
				
				this.optionsButtonRoot.observe('click', function(e){
					this.__selectedKeyword = 0;
					//this.getParentElements(e);
					this.__nodeMenuRoot.show(e);
				}.bindAsEventListener(this));
				
				var mitems5 = [{
					name: '<span class=application_main_soft_text>' + global.getLabel('KM_TAX_EDIT_KEYWORD') + '...<span class=application_main_soft_text>',
					callback: ''
				}, {
					name: (this.__checkOut) ? global.getLabel('KM_TAX_ADD_NEW_KEYWORD_HERE') : '<span class=application_main_soft_text>' + global.getLabel('KM_TAX_ADD_NEW_KEYWORD_HERE') + '</span>',
					callback: (this.__checkOut) ? this.addKeyword.bindAsEventListener(this) : ''
				}, {
					name: '<span class=application_main_soft_text>' + global.getLabel('KM_TAX_DEL_KEYWORD') + '<span class=application_main_soft_text>',
					callback: ''
				},{
					name: (this.__checkOut) ? global.getLabel('KM_CHECK_IN') : '<span class=application_main_soft_text>' + global.getLabel('KM_CHECK_IN') + '</span>',
					callback: (this.__checkOut) ? this.checkIn.bindAsEventListener(this) : ''
				}, {
					name: (!this.__checkOut && !this.__viewMode) ? global.getLabel('KM_CHECK_OUT') : '<span class=application_main_soft_text>' + global.getLabel('KM_CHECK_OUT') + '</span>',
					callback: (!this.__checkOut && !this.__viewMode) ? this.checkOut.bindAsEventListener(this) : ''
				}, {
					name: (!this.__checkOut && !this.__viewMode) ? global.getLabel('KM_PROMOTE_TO_ACTIVE') : '<span class=application_main_soft_text>' + global.getLabel('KM_PROMOTE_TO_ACTIVE') + '</span>',
					callback: (!this.__checkOut && !this.__viewMode) ? this.promoteToActive.bindAsEventListener(this) : ''
				}, {
					name: (!this.__checkOut) ? global.getLabel('KM_VERSIONS') : '<span class=application_main_soft_text>' + global.getLabel('KM_VERSIONS') + '</span>',
					callback: (!this.__checkOut) ? this.versions.bindAsEventListener(this) : ''
				}];
				
				this.__nodeMenuRoot = new Proto.Menu({
					menuItems: mitems5
				});
			}
		}

		//KM_VERSIONS
		arrow = new Element("div", {
				'class': 'taxArrow application_down_arrow',
				'id': 'arrowRoot'
		});

		li.insert(arrow);
		
		div = new Element("div", {
				'class': 'taxText'
		}).update("root");
		li.insert(div);
		li.insert(this.optionsButtonRoot)
		ul = new Element("ul", {
				'id': 'taxUL_0',
				'class': 'taxUL'
		});
		
		li.insert(ul);
		return li
	},
	
	/**
	 * Build Version list popup
	 * @param {Object} e
	 */
	 versions: function(e) {
		var html = '';
        html += '' +
        '<div id="km_versions_cont" style="width:90%;"></div><div id="verNextPrev" style="width:90%;"></div><div id="km_versions_ok"  style="text-align:center;margin-top:10px;padding-left:140px;"></div>';
       		
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
	
	
	/**
	 * MAke ajax call and get all versions
	 */
	getVersion: function(){
            var isSimulation = (this.__editSimulation)? 'X': '';
			
			this.makeAJAXrequest($H({ xml:
            ' <EWS>' +
            '   <SERVICE>KM_GET_TAX_VER</SERVICE>' +
            '   <DEL/>' +
            '   <PARAM>' +
			'       <I_V_CONTENT_ID>'+this.__taxonomyCid+'</I_V_CONTENT_ID>' +
			'		<I_V_AUTHORING>X</I_V_AUTHORING>'+
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

	/**
	 * Build version list table
	 * @param {Object} json
	 */
    buildVersions: function(json) {
		var items = objectToArray(json.EWS.o_i_version_list.yglui_str_ecm_ver);
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
            //'   <td style="cursor:pointer;" id="km_version_' + v['@version'] + '"><span class="application_action_link" v="' + v['@version'] + '">' + v['@version'] + '</span></td>' +
            '   <td style="cursor:pointer;" id="km_version_' + v['@version'] + '">' + v['@version'] + '</td>' +
			'   <td style="cursor:pointer;">' + v['@author'] + '</td>' +
            '   <td style="cursor:pointer;">' + v['@creation_date'] + '</td>' +
			//'   <td style="cursor:pointer;" id="km_version_view_'+v['@version']+'><a><span class="application_action_link" v="' + v['@version'] + '">View</span></a></td>' +
            //'   <td style="cursor:pointer;"><span class="application_action_link" v="' + v['@version'] + 'id="km_version_view_'+v['@version']+'>View</span></td>' +
			//'   <td style="cursor:pointer;"><span class="application_action_link" v="' + v['@version'] + 'id="km_version_reinstate_'+v['@version']+'>Reinstate</span></td>' +
            '   <td style="cursor:pointer;" id="km_version_view_' + v['@version'] + '"><span class="application_action_link" v="' + v['@version'] + '">'+global.getLabel('KM_VIEW')+'</span></td>' +
			'   <td style="cursor:pointer;" id="km_version_reinstate_' + v['@version'] + '"><span class="application_action_link" v="' + v['@version'] + '">'+global.getLabel('KM_MEN_REINSTATE')+'</span></td>' +
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

            $('km_version_view_'+v['@version']).observe('click', function(c,v) {
				this.__version = v;
				this.loadSelectedTaxVer(c);
			} .bind(this, v['@content_id'],v['@version']));
			
			$('km_version_reinstate_' + v['@version']).observe('click', function(v) {
				this.reinstateMenu(v);
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
		
    },
	
	
	/**
	 * Reinstate a selected Menu Version
	 * @param {Object} e
	 */
	reinstateMenu: function(e){
		this.makeAJAXrequest($H({ xml:
            ' <EWS>' +
            '    <SERVICE>KM_REINST_TAXO</SERVICE>' +
			'    <PARAM>' +
			'    	<I_V_CONTENT_ID>'+e+'</I_V_CONTENT_ID>' +
			'    	<I_V_PAGE>1</I_V_PAGE>' +
			'    </PARAM>' +
            ' </EWS>',
			 successMethod: function(e){
				if(e.EWS.o_v_content_id)
				this.__taxonomyCid = e.EWS.o_v_content_id;
				this.showMoreOnOff(true);
				this.showAllOnOff(true);
				$('taxUL_0').update();
				this.__checkOut = true;
				this.__viewMode = false;
				this.buildFullTaxonomy(e);
			}.bind(this)		
        }));



	},
		
		
	/**
	 * Load the selected version(for viewing only)
	 * @param {Object} e
	 */
	loadSelectedTaxVer: function(e){
		var isSimulation = (this.__editSimulation)? 'X': '';

		this.makeAJAXrequest($H({ xml:
            ' <EWS>' +
            '    <SERVICE>KM_GET_WORD_TAX</SERVICE>' +
			'    <PARAM>' +
			'    	<I_V_CONTENT_ID>'+e+'</I_V_CONTENT_ID>' +
			'    	<I_V_PAGE>1</I_V_PAGE>' +
			'    </PARAM>' +
            ' </EWS>',
			 successMethod: function(e){
				if(this.__oldVersion ==null)
					this.__oldVersion = this.__taxonomyCid
				if(e.EWS.o_w_taxonomy['@content_id'])
					this.__taxonomyCid = e.EWS.o_w_taxonomy['@content_id']
				this.showMoreOnOff(true);
				this.showAllOnOff(true);
				$('taxUL_0').update();
				this.__viewMode = true;
				this.buildViewMode();
				this.buildFullTaxonomy(e);
			}.bind(this)		
        }));

	},
	
	/**
	 * Make ajax call and get all taxonomy nodes according to letter
	 */
	showAllFullTaxonomyLetter: function(){
	//<EWS><SERVICE>KM_GET_WORD_TAX</SERVICE><PARAM><I_V_PAGE></I_V_PAGE><I_V_LETTERS>A</I_V_LETTERS><I_V_HR_TAX>X</I_V_HR_TAX></PARAM><DEL></DEL></EWS>	
		var isSimulation = (this.__editSimulation)? 'X': '';
		this.makeAJAXrequest($H({ xml:
            ' <EWS>' +
            '    <SERVICE>KM_GET_WORD_TAX</SERVICE>' +
			'    <PARAM>' +
			'    	<I_V_PAGE></I_V_PAGE>' +
			'		<I_V_HR_TAX>X</I_V_HR_TAX>' +
					((this.__editMode) ?'<I_V_AUTHORING>' + 'X' + '</I_V_AUTHORING>' : '')+
			'		<I_V_LETTERS>'+this.params.letter+'</I_V_LETTERS>'+
			'		<I_V_SIMULATION_ON>'+ isSimulation +'</I_V_SIMULATION_ON>'+
					((this.__taxonomyCid) ?'<I_V_CONTENT_ID>' + this.__taxonomyCid + '</I_V_CONTENT_ID>' : '')+
			'    </PARAM>' +
            ' </EWS>',
			
			
			successMethod: function(j){
				this.showMoreOnOff(false);
				this.showLessOnOff(false);
				this.fullTaxShowAllLetteronOff(false);
				if($('taxUL_0')){
					$('taxUL_0').update();
				}	
				this.buildFullTaxonomy(j);
			}.bind(this)
            //successMethod: 'buildFullTaxonomy'
			
        }));

	},
	
	
	/**
	 * Make ajax call and get taxonomy according to page and addtional parameters
	 */
	getFullTaxonomy: function(){
		this.__viewMode = false;
		var isSimulation = (this.__editSimulation)? 'X': '';
				
		this.makeAJAXrequest($H({ xml:
            ' <EWS>' +
            '    <SERVICE>KM_GET_WORD_TAX</SERVICE>' +
			'    <PARAM>' +
			'    	<I_V_PAGE>1</I_V_PAGE>' +
			'		<I_V_HR_TAX>X</I_V_HR_TAX>' +
			'		<I_V_SIMULATION_ON>'+ isSimulation +'</I_V_SIMULATION_ON>'+
			((this.__editMode) ?'<I_V_AUTHORING>' + 'X' + '</I_V_AUTHORING>' : '')+
			//((taxCid) ?'<I_V_CONTENT_ID>' + taxCid + '</I_V_CONTENT_ID>' : '')+
			'    </PARAM>' +
            ' </EWS>',
            successMethod: 'buildFullTaxonomy'
        }));
	},
	
	/**
	 * make the draft latest active draft
	 * @param {Object} e
	 */
	promoteToActive: function(e) {
        this.approve();
    },
	
	/**
	 * Publish the current draft and make active version
	 */
	approve: function() {
		this.makeAJAXrequest($H({ xml:
            ' <EWS>' +
            '   <SERVICE>KM_APPROVE_TAX</SERVICE>' +
            '   <DEL/>' +
            '   <PARAM>' +
            '       <I_V_CONTENT_ID>'+this.__taxonomyCid+'</I_V_CONTENT_ID>' +
            '   </PARAM>' +
            ' </EWS>',
            successMethod: function(j){
				this.__taxonomyCid = j.EWS.o_v_content_id;
			}.bind(this)
        }));
    },
	
	
	/**
	 * Build Full taxonomy 
	 * @param {Object} json
	 */
	buildFullTaxonomy: function(json){
		if($('taxUL_0'))
		$('taxUL_0').update();
		if(this.__checkOut==false){
			this.__taxonomyCid = json.EWS.o_w_taxonomy['@content_id'];
		}

		if(json.EWS.o_w_taxonomy['@is_check_out']=='X')
		this.__checkOut = true;
		else
		this.__checkOut = false;

		this.buildRoot();
		
		var items;
		if(!Object.isUndefined(json.EWS.o_w_taxonomy.taxonomy)){
			items = objectToArray(json.EWS.o_w_taxonomy.taxonomy.yglui_str_ecm_hr_tax);
		}
		
		if(!Object.isUndefined(items)){
			container2=this.__taxContainer.down('ul');
			this.buildNodes(items,container2);		
			this.__taxContainer.insert(container2)
		}else{
			container2=this.__taxContainer.down('ul');
			this.__taxContainer.insert(container2)
			var emptyTaxSpan = new Element('span',{
				'style': 'width: 100%;'
			}).update(global.getLabel('KM_TAXONOMY_IS_EMPTY'));
			container2.update(emptyTaxSpan);
		}
	},

	/**
	 * Add keyword
	 * @param {Object} e
	 */
	addToKeywords: function(e){
		if (e.target.checked) {
			var nodeId = $(e.target.parentNode).getAttribute('nodeid');
			var nodeName = $(e.target.parentNode).getAttribute('name');
			var orderId = $(e.target.parentNode).getAttribute('orderId');
			var arrayItems = $A();
			arrayItems.push(nodeId);
			arrayItems.push(nodeName);
			arrayItems.push(orderId);
			this.keywordHash.set(this.keywordCtr, arrayItems)
			this.keywordCtr++;
		}
		else{
			this.keywordCtr--;
			this.keywordHash.unset(this.keywordCtr)
		}
	},
	
	/**
	 * Checkout the selected menu
	 * @param {Object} e
	 */
	checkOut: function(e) {
			this.makeAJAXrequest($H({ xml:
            ' <EWS>' +
            '   <SERVICE>KM_CHKOUT_TAX</SERVICE>' +
            '   <DEL/>' +
            '   <PARAM>' +
            '       <I_V_CONTENT_ID>'+this.__taxonomyCid+'</I_V_CONTENT_ID>' +
            '   </PARAM>' +
            ' </EWS>',
            successMethod: 'checkOutSuccess'
        }));
    },
	
	/**
	 * Make the menu editable after checkout
	 * @param {Object} json
	 */
	checkOutSuccess: function(json){
		this.__checkOut = true;
		this.__taxonomyCid = json.EWS.o_v_new_content_id;
		this.__buildTax();
	},
	
	/**
	 * Check in the selected menu
	 * @param {Object} e
	 */
	checkIn: function(e) {
			this.makeAJAXrequest($H({ xml:
            ' <EWS>' +
            '   <SERVICE>KM_CHECKIN_TAX</SERVICE>' +
            '   <DEL/>' +
            '   <PARAM>' +
            '       <I_V_CONTENT_ID>'+this.__taxonomyCid+'</I_V_CONTENT_ID>' +
            '   </PARAM>' +
            ' </EWS>',
            successMethod: 'checkInSuccess'
        }));
    },
	
	/**
	 * Mek the current menu uneditable
	 * @param {Object} json
	 */
	checkInSuccess: function(json){
		this.__checkOut = false;
		this.__buildTax();
	},
	
	/**
	 * Expand or collapse the selected node item
	 * @param {Object} evt
	 */
	expandCollapseFullTax : function(evt){

		var isSimulation = (this.__editSimulation)? 'X': '';
		
		var elt = evt.element();
		this.currentFullTaxNode = elt.up().id;
		if(elt.next('ul').down()){
			elt.next('ul').toggle();
				
			if(elt.hasClassName('application_verticalR_arrow')){
				elt.removeClassName('application_verticalR_arrow');
				elt.addClassName('application_down_arrow');
			}else{
				elt.removeClassName('application_down_arrow');
				elt.addClassName('application_verticalR_arrow');
			}
		}
		else{
			this.makeAJAXrequest($H({ xml:
				' <EWS>' +
				'    <SERVICE>KM_GET_WORD_TAX</SERVICE>' +
				'    <PARAM>' +
				'    	<I_V_PARENT_ID>'+elt.up().id.gsub('fullTaxNode_','0')+'</I_V_PARENT_ID>' +
				'		<I_V_HR_TAX>X</I_V_HR_TAX>' +
				((this.__editMode) ?'<I_V_AUTHORING>' + 'X' + '</I_V_AUTHORING>' : '')+
				((this.__taxonomyCid) ?'<I_V_CONTENT_ID>' + this.__taxonomyCid + '</I_V_CONTENT_ID>' : '')+
				'		<I_V_SIMULATION_ON>'+ isSimulation +'</I_V_SIMULATION_ON>'+
				'    </PARAM>' +
				' </EWS>',
				successMethod: 'buildFullTaxonomyChild'
			}));
		}
	},

	/**
	 * build each node item
	 * @param {Object} items
	 * @param {Object} container
	 */
	buildNodes: function(items,container){
		items.each(function(item) {	
			li = new Element("li", {
				id: 'fullTaxNode_'+item['@node_id'],
				'class': 'taxLi',
				'nodeId': +item['@node_id'],
				'name': item['@node_translation'],
				'pNode': item['@parent_node_id'],
				'orderId': item['@order_id']
			});
			arrow = new Element("div", {
				'class': 'application_verticalR_arrow taxArrow',
				'hasChild': 'false'
			});
			
			if(item['@has_child']){
				arrow.observe('click', this.expandCollapseFullTax.bindAsEventListener(this));
				arrow.setAttribute('hasChild',true)
			}
			else{
				arrow.setOpacity(0.3);
			}
			
			li.insert(arrow);
			
			div = new Element("div", {
				'class': 'taxText',
				id: 'taxText_'+item['@node_id']
			}).update(item['@node_translation']);
			if(this.searchMenuMode){
				div.observe('click', function(evt,node){
					document.fire("EWS:kmFireTaxonomySearch", { 'value': node });
				}.bindAsEventListener(this,item['@node_translation']));	
			}
			li.insert(div);
			
			if(item.synonyms){
				var syns=objectToArray(item.synonyms.yglui_str_ecm_synonyms);
				var tooltip='synonyms : ';
				var x = syns.size();
				syns.each(function(item) {
					//;
					x--;
					if(x<=0)
					tooltip+=item['@synonyms']+' ';
					else
					tooltip+=item['@synonyms']+', ';
				
				}.bind(this));
				var syn = new Element("div", {
					id: 'syn_'+item['@node_id'],
					'class': 'taxSyn application_rounded_tilt '+item['@node_id'],
					title:tooltip
				});
				li.insert(syn);
			}
			
			container.insert(li);
			if(!this.selectionMode){
				if(this.__checkOut && this.__editMode){
					this.optionsButton2 = new Element('button', {
						'id': 'opt_' + item['@node_id'],
						'style': 'margin-right: 5px; right: 10px; border: 0 none;padding-top:10px;border-color: transparent;',
						'class': 'application_editSelection2',
						'pNode': item['@parent_node_id'],
						'node': item['@node_id']
					});
	
					li.insert(this.optionsButton2);
					
					this.optionsButton2.observe('click', function(e) {
						this.__selectedKeyword = item
						var mitems1 =
			                [
			                	{ name: global.getLabel('KM_TAX_EDIT_KEYWORD')+'...',callback: this.getKeywordTranslations.bindAsEventListener(this)},
			                	{ name: global.getLabel('KM_TAX_ADD_NEW_KEYWORD_HERE') + '...',callback: this.addKeyword.bindAsEventListener(this) },
			                	{ name: (item['@has_child']==null)? global.getLabel('KM_TAX_DEL_KEYWORD'): '<span class=application_main_soft_text>'+global.getLabel('KM_TAX_DEL_KEYWORD')+'</span>', callback:(item['@has_child']==null)? this.deleteKeyword.bindAsEventListener(this): ''}
			  				];

						this.__nodeMenu = new Proto.Menu({
							menuItems: mitems1
						});
						this.__nodeMenu.show(e);
		            } .bindAsEventListener(this));
				}	
			}
			else{
				if(!this.searchMenuMode){
					var checkbox = new Element("input", { "type": "checkbox","id": 'chk_'+item['@node_id'] });
					checkbox.observe('click', this.addToKeywords.bindAsEventListener(this));
					li.insert(checkbox)
				}
			}

			ul = new Element("ul", {
				'id': 'taxUL_'+item['@node_id'],
				'class': 'taxUL'
			});
			li.insert(ul);
			
			
		}.bind(this));
	},
	
	
	/**
	 * Build nodes of selected parent
	 * @param {Object} json
	 */
	buildFullTaxonomyChild : function(json){
		if($(this.currentFullTaxNode)){
			var container=$(this.currentFullTaxNode).down('ul');
			var arr=$(this.currentFullTaxNode).down();
			arr.removeClassName('application_verticalR_arrow');
			arr.addClassName('application_down_arrow');
			var items = objectToArray(json.EWS.o_w_taxonomy.taxonomy.yglui_str_ecm_hr_tax);
			var li,ul,arrow,div;
			//this.__currentLevelArray.clear();
			++this.level;
			this.buildNodes(items,container)
		}
	},
	
	/**
	 * Add more node items
	 * @param {Object} json
	 */
	appendFullTaxonomy: function(json){
		if($('fullTax')){
			if (json.EWS.o_w_taxonomy != null) {
				var items = objectToArray(json.EWS.o_w_taxonomy.taxonomy.yglui_str_ecm_hr_tax);
				var li, ul, arrow, div;
				++this.level
				items.each(function(item){
					li = new Element("li", {
						id: 'fullTaxNode_' + item['@node_id'],
						'class': 'taxLi',
						'name': item['@node_translation'],
						'pNode': item['@parent_node_id']
					});
					
					arrow = new Element("div", {
						'class': 'application_verticalR_arrow taxArrow',
						'hasChild': 'false'
					});
					if (item['@has_child']) {
						
						arrow.observe('click', this.expandCollapseFullTax.bindAsEventListener(this));
						arrow.setAttribute('hasChild', true)
					}
					else {
						arrow.setOpacity(0.3);
					}
					li.insert(arrow);
					
					div = new Element("div", {
						'class': 'taxText',
						id: 'taxText_'+item['@node_id']
					}).update(item['@node_translation']);
					if(this.searchMenuMode){
						div.observe('click', function(evt,node){
							document.fire("EWS:kmFireTaxonomySearch", { 'value': node });
						}.bindAsEventListener(this,item['@node_translation']));
					}
					li.insert(div);
					
					if (item.synonyms) {
						var syns = objectToArray(item.synonyms.yglui_str_ecm_synonyms);
						var tooltip = 'synonyms : ';
					var x = syns.size();
					syns.each(function(item) {
						x--;
						if(x<=0)
						tooltip+=item['@synonyms']+' ';
						else
						tooltip+=item['@synonyms']+', ';
					
					}.bind(this));
						var syn = new Element("div", {
							id: 'syn_'+item['@node_id'],
							'class': 'taxSyn application_rounded_tilt '+item['@node_id'],
							title: tooltip
						});
						li.insert(syn);
					}
				
					ul = new Element("ul", {
						'class': 'taxUL'
					});
					li.insert(ul);
					$('fullTax').down('ul.taxUL').insert(li);
					
					if(!this.selectionMode){
						if(this.__checkOut && this.__editMode){				
							this.optionsButton3 = new Element('button', {
								'id': 'opt_' + item['@node_id'],
								'style': 'margin-right: 5px; right: 10px; border: 0 none;padding-top:10px;border-color: transparent;',
								'class': 'application_editSelection2',		
								'pNode': item['@parent_node_id'],
								'node': item['@node_id']
							});
							li.insert(this.optionsButton3);
							
							this.optionsButton3.observe('click', function(e){
								this.__selectedKeyword = item
							var mitems1 =
								[
									{ name: global.getLabel('KM_TAX_EDIT_KEYWORD')+'...',callback: this.getKeywordTranslations.bindAsEventListener(this)},
									{ name: global.getLabel('KM_TAX_ADD_NEW_KEYWORD_HERE') + '...',callback: this.addKeyword.bindAsEventListener(this) },
									{ name: (item['@has_child']==null)? global.getLabel('KM_TAX_DEL_KEYWORD'): '<span class=application_main_soft_text>'+global.getLabel('KM_TAX_DEL_KEYWORD')+'</span>', callback:(item['@has_child']==null)? this.deleteKeyword.bindAsEventListener(this): ''}
								];
							this.__nodeMenu = new Proto.Menu({
								menuItems: mitems1
							});
								this.__nodeMenu.show(e);
								//this.getParentElements(e);
							}.bindAsEventListener(this));
						}
					}
					else{
						if(!this.searchMenuMode){
							var checkbox = new Element("input", { "type": "checkbox","id": 'chk_'+item['@node_id'] });
							checkbox.observe('click', this.addToKeywords.bindAsEventListener(this));
							li.insert(checkbox)
						}
					}

					
				}.bind(this));
			}
			else{
				this.showMoreOnOff(false);
			}
		}
	},
	
	/**
	 * Make ajax call and Get selected node's keyword translations and synonyms
	 * @param {Object} evt
	 */
	getKeywordTranslations: function(evt){
		
		var y = $('fullTaxNode_'+this.__selectedKeyword['@node_id'])
		if(y)
		var x = $('fullTaxNode_'+this.__selectedKeyword['@node_id']).getAttribute('orderId');
		var isSimulation = (this.__editSimulation)? 'X': '';
		
		this.makeAJAXrequest($H({ xml:
            ' <EWS>' +
            '    <SERVICE>KM_GET_TRANS</SERVICE>' +
			'    <PARAM>' +
			'		<I_V_NODE_ID >'+this.__selectedKeyword['@node_id']+'</I_V_NODE_ID >' +
			'<I_V_TAX_ID>'+this.__taxonomyCid+'</I_V_TAX_ID>'+
			'<I_V_ORDERID>'+x+'</I_V_ORDERID>'+
			'		<I_V_SIMULATION_ON>'+ isSimulation +'</I_V_SIMULATION_ON>'+

			'    </PARAM>' +
            ' </EWS>',
            successMethod: 'editKeyword',
			failureMethod: 'editKeyword'
        }));
	},

	/***
	 * Open the pop up and make editable
	 * @param {Object} json
	 */
	editKeyword: function(json){	

		if(json.EWS.o_i_translation)
		var items = objectToArray(json.EWS.o_i_translation.yglui_str_ecm_translate);
		       
		var j = 0;
		if(json.EWS.o_i_translation)
        items.each(function(item) {
            if (item) {
                j++;
            }
        });
		
		if($('fullTaxNode_'+this.__selectedKeyword['@parent_node_id']))
		var nodeParent = $('fullTaxNode_'+this.__selectedKeyword['@parent_node_id']).getAttribute('name')
		else
		var nodeParent = 'Root'
		
		var html = new Element('span',{
			'class': 'applications_container_div',
			'id': 'app_editTaxonomyPopUp'
		});
		
		var contents = ''
			+'<div style="width: 99%; float: left; text-align: left; margin-bottom: 10px;"><b>'+global.getLabel('KM_TAX_EDIT_KEYWORD')+'</b></div>'
			+'<div class="fieldDispFloatLeft">'+global.getLabel('KM_TAX_KEYWORD_NAME')+': </div>'
			
			+'<div style="margin-left: 10px;" id="TaxonomyAuthoring_text" class="autocompleter_container">'
				+'<div class="autocompleter_form_container">'
					+'<input style="margin-left: 5px; float: left; width: 200px" type="text" class="my_selections_searchField" id="TaxonomyAuthoring_textField">'
				+'</div>'
			+'</div>'
			
			+'<div style="float: left; margin-left: 10px; margin-top: -2px" class="leftRoundedCorner" id="TaxonomyAuthoring_renameKeyword">'
				+'<span class="centerRoundedButton">Save</span>'
				+'<span class="rightRoundedCorner"></span>'
			+'</div>'
			
			+'<div style="float: left; width: 99%; margin-top: 10px">'
				+'<div style="float: left; text-align: left;">'+global.getLabel('KM_TAX_PARENT_KEYWORD')+': </div><div id="TaxonomyAuthoring_parentKeyword" style="float: left; text-align: left; margin-left: 5px">'+
					nodeParent
				+'</div>'
			+'</div>'
			
			+'<div style="float: left; width: 99%; margin-top: 10px">'
				+'<div style="float: left; text-align: left;">'+global.getLabel('KM_TAX_TRANS_AND_SYN')+'</div>'
			+'</div>'
			
			+'<div style="float: left; width: 99%; margin-top: 10px">'
				+'<input id="taxonomyAuthoring_SelectAll" type="checkbox" / > ' + global.getLabel('DML_SELECT_UNSELECT_ALL')
			+'</div>'
			
			+'<div style="float: left; width: 99%; margin-top: 10px">'
				+'<div id="translationTable"></div>'	
			+'</div>'
			
			+'<div style="float: left; width: 99%; margin-top: 10px">'
				+'<div style="float: left; margin-top: -2px" class="leftRoundedCorner" id="TaxonomyAuthoring_deleteTranslation">'
					+'<span class="centerRoundedButton">'+global.getLabel('DML_DELETE')+'</span>'
					+'<span class="rightRoundedCorner"></span>'
				+'</div>'
			+'</div>'	

			+'<div style="float: left; width: 99%; margin-top: 10px">'
				+'<div class="fieldDispFloatLeft">'+global.getLabel('KM_TAX_ADD_NEW_KEYWORD_TRANS')+'</div>'
					+'<div style="margin-left: 10px;" id="TaxonomyAuthoring_text" class="autocompleter_container">'
						+'<div class="autocompleter_form_container">'
						 	+'<div id="TaxonomyAuthoring_language" style="margin-left: 5px;"></div>'
						+'</div>'
						+'<div class="autocompleter_form_container">'
							+'<input style="float: left; width: 150px; margin-left: 5px" type="text" class="my_selections_searchField" id="TaxonomyAuthoring_translation">'
						+'</div>'
						+'<div style="float: left; margin-left: 10px; margin-top: -2px" class="leftRoundedCorner" id="TaxonomyAuthoring_saveTranslation">'
							+'<span class="centerRoundedButton">'+global.getLabel('Save')+'</span>'
							+'<span class="rightRoundedCorner"></span>'
						+'</div>'
				+'</div>'
			+'</div>'
		+'';
		
		html.update(contents);

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
		
		$('TaxonomyAuthoring_language').insert()
		
		this.langAutocompleter = new JSONAutocompleter('TaxonomyAuthoring_language', {
					events: $H({onResultSelected: 'EWS:autocompleterResultSelected'
					}),
					showEverythingOnButtonClick: true,
					templateResult: '#{text}',
					autoWidth: true
					}, this.__jsonLang);

          
          document.observe('EWS:autocompleterResultSelected', function(event){
			
          }.bindAsEventListener(this)); 
                     			
		$('TaxonomyAuthoring_textField').value = prepareTextToEdit(this.__selectedKeyword['@node_translation']);
		var htmlTable = this.buildTransTable(json,j);
	},
	
	
	/**
	 * Build the translations table
	 * @param {Object} json
	 * @param {integer} ctr
	 */
	buildTransTable: function(json,ctr){

		this.registerEvents(items);
		var items = objectToArray(json.EWS.o_i_translation.yglui_str_ecm_translate);
		var htmlTable = ''
            + ' <table class="sortable resizable">'
	        + '     <thead>'
	        + '         <tr>'
	        + '             <th class="table_sortfirstdesc text" id="Th1" field="doc_name">' + global.getLabel('DML_NAME') + '</th>'
            + '             <th id="Th2" field="cdate" class="text">' + global.getLabel('GRP_Test') + '</th>'
            + '         </tr>'
            + '     </thead>'
            + '     <tbody ' + ((!Prototype.Browser.IE) ? 'style="height:' + ((ctr > 16) ? '480px' : '100%') + '"' : '') + '>';
            items.each(function(item) {
                if (item) {
					htmlTable += ''
                    + '<tr id="taxonomyAuthoring_TrDocument' + item['@order_id'] + '" style="cursor:pointer;">'
					+ '				<td><div><input id="taxonomyAuthoring_check_' + item['@translation'].replace(/ /g,"<|w|s|>")+ '" type="checkbox" />' + prepareTextToSend(item['@translation']) + '</div></td>'
					+ '             <td><div>' + this.__allLang.get(item['@lang']) + '</div></td>'
                    + ' </tr>';
                }
				
		} .bind(this));
		
		htmlTable += ''
            + '     </tbody>'
            + ' </table>';
		$('translationTable').update(htmlTable);	
		TableKit.Sortable.init($('translationTable').down('table'), {
                marginL: 10,
                autoLoad: false,
                resizable: false
		});
		this.unRegisterEvents();
		this.registerEvents(items);
	},
	
	/**
	 * Unregister events
	 */
	unRegisterEvents: function(){
		$('taxonomyAuthoring_SelectAll').stopObserving();
		$('TaxonomyAuthoring_saveTranslation').stopObserving();
		$('TaxonomyAuthoring_renameKeyword').stopObserving();
		$('TaxonomyAuthoring_deleteTranslation').stopObserving();
	},
	
	/**
	 * register events for the translations table
	 * @param {Object} items
	 */
	registerEvents: function(items){
        $('taxonomyAuthoring_SelectAll').observe('click', function(e) {
            var checked = $('taxonomyAuthoring_SelectAll').checked;
            items.each(function(item) {
                if (item) {
                    if ($('taxonomyAuthoring_check_' + item['@order_id'].replace(/ /g,"<|w|s|>"))) {
                        $('taxonomyAuthoring_check_' + item['@order_id'].replace(/ /g,"<|w|s|>")).checked = checked;
                    }
                }
            }.bind(this));
        }.bind(this));

		$('TaxonomyAuthoring_textField').value = prepareTextToEdit(this.__selectedKeyword['@node_translation']);
		$('TaxonomyAuthoring_saveTranslation').observe('click',this.addTranslation.bindAsEventListener(this));
		$('TaxonomyAuthoring_renameKeyword').observe('click',this.renameKeyword.bindAsEventListener(this));
		$('TaxonomyAuthoring_deleteTranslation').observe('click',this.deleteTranslation.bindAsEventListener(this,items))

	},
	
	/**
	 * Add a translation to the selected node/keyword
	 */
	addTranslation: function(){
		var trans = this.langAutocompleter.getValue().idAdded;
		var word = $('TaxonomyAuthoring_translation').value;
		this.saveTranslation({'action': 'A', 'lang': trans, 'nodeId': this.__selectedKeyword['@node_id'], 'trans': word, 'taxId': this.__taxonomyCid });
	},
	
	/**
	 * Rename the selected keyword/node
	 */
	renameKeyword: function(){
		var word = $('TaxonomyAuthoring_textField').value;
		//this.__selectedKeyword['@node_translation']= $('TaxonomyAuthoring_textField').value;
		var x = this.__lang.get(global.language);
		this.saveTranslation({'action': 'E', 'lang': this.__lang.get(global.language), 'nodeId': this.__selectedKeyword['@node_id'], 'trans': word, 'taxId': this.__taxonomyCid,'orderId': this.__selectedKeyword['@order_id'] });
	},
	
	/**
	 * Delete the selected keyword or node
	 * @param {Object} evt
	 */
	deleteKeyword: function(evt){	
		var mydiv = new Element('div');
		var balloonTitle = new Element('span',{
			id: 'balloonTitle',
			'style': 'float: left;width: 80%'}).update(global.getLabel('KM_TAX_DEL_KEYWORD')+'?')
		
		var deleteNodeYes = new Element('div',{
			id: 'deleteNodeYes',
			'class': 'leftRoundedCorner',
			'style': 'float: left;margin-right: 10px'
		})
		deleteNodeYes.insert('<span class="centerRoundedButton">'+global.getLabel('DML_YES')+'</span><span class="rightRoundedCorner"></span>')
		
		var deleteNodeNo = new Element('div',{
			id: 'deleteNodeNo',
			'class': 'leftRoundedCorner',
			'style': 'float: left;'
		})
		deleteNodeNo.insert('<span class="centerRoundedButton">'+global.getLabel('DML_NO')+'</span><span class="rightRoundedCorner"></span>')
		
		deleteNodeNo.observe('click',function(){
			this._balloon.hide();
		}.bind(this))
		deleteNodeYes.observe('click',function(){
			this.save({
				'action': 'D', 
				'pNode': this.__selectedKeyword['@parent_node_id'],
				'nodeId': (isNaN(this.__selectedKeyword['@node_id'])) ?  '0': this.__selectedKeyword['@node_id'], 
				'lang': this.__lang.get(global.language),
				'nodeName': this.__selectedKeyword['@node_translation'], 
				'hrTax': this.__taxonomyCid
			})
			this._balloon.hide();
		}.bind(this))
		
		mydiv.insert(balloonTitle);
		mydiv.insert(deleteNodeYes);
		mydiv.insert(deleteNodeNo);
		this._balloon = new Balloon();
		this._balloon.setOptions($H({
                    domId: 'opt_'+this.__selectedKeyword['@node_id'],
                    content: mydiv,
                    dinamicWidth: 200
		}));

        this._balloon.show();
	},
	
	/**
	 * Make ajax call Save the translation table
	 * @param {Object} args
	 */
	saveTranslation: function(args){	
		var runMethod;
		var isSimulation = (this.__editSimulation)? 'X': '';
		switch(args.action){
		case 'A':
			runMethod = 'addTransSuccess';
			//runFMethod = 'addTransFailed';
			break;
		case 'T':
			runMethod = 'deleteTransSuccess';
			break;
		case 'E':
			runMethod = 'renameTransSuccess';
			break;
		default: '';
		}
		this.makeAJAXrequest($H({ xml:
			'<EWS>'+
			'<SERVICE>KM_SET_TRANS</SERVICE>'+
			'<DEL/>'+
			'<PARAM>'+
			((args.action) ?'<I_V_ACTION>' + (args.action || '') + '</I_V_ACTION>' : '') +
			((args.lang) ?'<I_V_LANG>' + (args.lang || '') + '</I_V_LANG>' : '')+
			((args.nodeId) ?'<I_V_NODEID>' + (args.nodeId || '') + '</I_V_NODEID>' : '')+
			((args.trans) ? '<I_V_TRANS>' + (prepareTextToSend(args.trans) || '') + '</I_V_TRANS>' : '')+
			((args.taxId) ?'<I_V_TAXID>' + (args.taxId || '') + '</I_V_TAXID>' : '')+
			((args.transTable) ?'<I_I_TRANS>' + (args.transTable || '') + '</I_I_TRANS>' : '')+
			((args.orderId) ?'<I_V_ORDERID>' + (args.orderId || '') + '</I_V_ORDERID>' : '')+
			//'		<I_V_SIMULATION_ON>'+ isSimulation +'</I_V_SIMULATION_ON>'+
			'</PARAM>'+
			'</EWS>',
			successMethod: runMethod
			//failureMethod: runFMethod
		}));
	},
	
	/**
	 * When translation adding is successful rebuild the taxonomy table
	 * @param {Object} json
	 */
	addTransSuccess: function(json){
		if($('showHideError')){
			$('showHideError').remove();
		}
		if($('popUpErrorDiv')){
			$('popUpErrorDiv').remove();
		}
		var isSimulation = (this.__editSimulation)? 'X': '';
		
		this.makeAJAXrequest($H({ xml:
            ' <EWS>' +
            '    <SERVICE>KM_GET_TRANS</SERVICE>' +
			'    <PARAM>' +
			'		<I_V_NODE_ID >'+this.__selectedKeyword['@node_id']+'</I_V_NODE_ID >' +
			'		<I_V_TAX_ID>'+this.__taxonomyCid+'</I_V_TAX_ID>'+
			'		<I_V_SIMULATION_ON>'+ isSimulation +'</I_V_SIMULATION_ON>'+
			//'		<I_V_ORDERID>'+$('fullTaxNode_'+parseInt(this.__selectedKeyword['@node_id'],10)).getAttribute('orderId')+'</I_V_ORDERID>'+
			'<I_V_ORDERID>1</I_V_ORDERID>'+
			'    </PARAM>' +
            ' </EWS>',
			successMethod: function(e){
				this.buildTransTable(e);
				$('taxUL_0').update();
				this.pageTemp=this.params.page;	
				this.params.page=1;
				this.refreshNode();
			}.bind(this)
        }));
	},
	
	/**
	 * Method to run when renaming keyword is successful
	 * @param {Object} json
	 */
	renameTransSuccess: function(json){
		$('taxUL_0').update();
		this.pageTemp=this.params.page;	
		this.params.page=1;
		this.refreshNode();
	},
	
	/**
	 * Method to run when adding a keyword is successful
	 * @param {Object} e
	 */
	saveKeyword: function(e){
		this.save({
			'action': 'A', 
			'pNode': (isNaN(this.__selectedKeyword['@node_id'])) ?  '0': this.__selectedKeyword['@node_id'],
			'lang': this.__lang.get(global.language),
			'nodeName': $('TaxonomyAuthoring_textField').value, 
			'hrTax': this.__taxonomyCid
		})	
	},
	
	/**
	 * Method to run when a translation has successfully been
	 * @param {Object} e
	 * @param {Object} items
	 */
	deleteTranslation: function(e,items){
		var delTable= '';
		if (items) {
			items.each(function(item){
				var checkbox = $('taxonomyAuthoring_check_' + item['@translation'].replace(/ /g,"<|w|s|>"));
				if (checkbox && checkbox.checked) {
					delTable += '<yglui_str_ecm_translate lang="'+item['@lang']+'" order_id="'+item['@order_id']+'" translation="'+prepareTextToSend(item['@translation'])+'"></yglui_str_ecm_translate>';
				}
			}.bind(this));	
		}
		var x = delTable;
		this.saveTranslation({'action': 'T','nodeId': this.__selectedKeyword['@node_id'],'taxId': this.__taxonomyCid,'transTable': delTable })
	},

	deleteTransSuccess: function(json){
		var isSimulation = (this.__editSimulation)? 'X': '';
		this.makeAJAXrequest($H({ xml:
            ' <EWS>' +
            '    <SERVICE>KM_GET_TRANS</SERVICE>' +
			'    <PARAM>' +
			'		<I_V_NODE_ID >'+this.__selectedKeyword['@node_id']+'</I_V_NODE_ID >' +
			'		<I_V_TAX_ID>'+this.__taxonomyCid+'</I_V_TAX_ID>'+
			'		<I_V_SIMULATION_ON>'+ isSimulation +'</I_V_SIMULATION_ON>'+
			//'		<I_V_ORDERID>'+$('fullTaxNode_'+parseInt(this.__selectedKeyword['@node_id'],10)).getAttribute('orderId')+'</I_V_ORDERID>'+
			'<I_V_ORDERID>1</I_V_ORDERID>'+
			'    </PARAM>' +
            ' </EWS>',
			successMethod: function(e){
			this.buildTransTable(e);
			$('taxUL_0').update();
			this.pageTemp=this.params.page;	
			this.params.page=1;
			this.refreshNode();
			}.bind(this)
        }));
	},
	
	addKeyword: function(e){

/* 		var html = new Element('span',{
			'id': 'app_addTaxonomyPopUp',
			'class': 'applications_container_div'
		});
 
		var popUpContent = ''
			+'<div style="width: 99%; float: left; text-align: left; margin-bottom: 10px;"><b>'+global.getLabel('KM_TAX_ADD_KEYWORD')+'</b></div>'
			+'<div class="fieldDispFloatLeft">'+global.getLabel('KM_TAX_KEYWORD_NAME')+': </div>'
			+'<div style="margin-left: 10px;" id="TaxonomyAuthoring_text" class="autocompleter_container">'
				+'<div class="autocompleter_form_container">'
					+'<input style="float: left; max-width: auto" type="text" class="my_selections_searchField" id="TaxonomyAuthoring_textField">'
				+'</div>'
			+'</div>'
			+'<div style="float: left; margin-left: 10px; margin-top: -2px" class="leftRoundedCorner" id="TaxonomyAuthoring_addKeyword">'
				+'<span class="centerRoundedButton">'+global.getLabel('Add')+'</span>'
				+'<span class="rightRoundedCorner"></span>'
			+'</div>'
			+'';
			
		html.update(popUpContent); */
 
 
		var phtml = new Element('span',{
			'id': 'app_addTaxonomyPopUp',
			'class': 'applications_container_div'
		});
			
			var divTitle = new Element('span',{
				'style': 'width: 99%; float: left; text-align: left; margin-bottom: 10px;'
			}).update(global.getLabel('KM_TAX_ADD_KEYWORD'));
		
			var divLabel = new Element('span',{
				'class': 'fieldDispFloatLeft'
			}).update(global.getLabel('KM_TAX_KEYWORD_NAME'));
			
			var TaxonomyAuthoring_text = new Element('span',{
				'id': 'TaxonomyAuthoring_text',
				'class': 'autocompleter_container'
			});
			
				var container = new Element('span',{'class': 'autocompleter_form_container'});
				
				var TaxonomyAuthoring_textField = new Element('input',{
					'style': 'float: left; max-width: auto',
					'type': 'text',
					'class': 'my_selections_searchField',
					'id' : 'TaxonomyAuthoring_textField'
				});
				container.update(TaxonomyAuthoring_textField);
				TaxonomyAuthoring_text.update(container);
			
			var TaxonomyAuthoring_addKeyword = new Element('span',{
				'style': 'float: left; margin-left: 10px; margin-top: -2px',
				'class': 'leftRoundedCorner',
				'id': 'TaxonomyAuthoring_addKeyword'
			});
				
			var buttonLabel = new Element('span',{
				'class': 'centerRoundedButton'
			}).update(global.getLabel('Add'));
			
			var rightCorner = new Element('span',{
				'class': 'rightRoundedCorner'
			});
			TaxonomyAuthoring_addKeyword.update(buttonLabel);
			TaxonomyAuthoring_addKeyword.insert(rightCorner);
			
			phtml.update(divTitle);
			phtml.insert(divLabel);
			phtml.insert(TaxonomyAuthoring_text);
			phtml.insert(TaxonomyAuthoring_addKeyword);
	
		
		
	    this.saveKeyPopUp = new infoPopUp({
	        closeButton: $H({
	            'callBack': function() {
	                this.saveKeyPopUp.close();
	                delete this.saveKeyPopUp;
	            }.bind(this)
	        }),
	        htmlContent: phtml,
	        indicatorIcon: 'void',
	        width: 750
	    });
	  	this.saveKeyPopUp.create();
				
		$('TaxonomyAuthoring_addKeyword').observe('click',this.saveKeyword.bindAsEventListener(this));
		
	},
	
	
	save: function(args){

		var runMethod = null;
		switch(args.action){
		case 'A':
			runMethod = 'addKeywordSuccess';
			break;
		case 'D':
			runMethod = 'deleteKeywordSuccess';
			break;
		default: '';
		}
		
		this.makeAJAXrequest($H({ xml:
			'<EWS>'+
			'<SERVICE>KM_SAVE_TAX</SERVICE>'+
			'<DEL/>'+
			'<PARAM>'+
			((args.hrTax) ?'<I_V_HR_TAX>' + (args.hrTax || '') + '</I_V_HR_TAX>' : '') +
			((args.pNode) ?'<I_V_PARENT_NODE_ID>' + (args.pNode || '') + '</I_V_PARENT_NODE_ID>' : '')+
			((args.nodeOrder) ?'<I_V_NODE_ORDER_ID>' + (args.nodeOrder || '') + '</I_V_NODE_ORDER_ID>' : '')+
			((args.nodeName) ? '<I_V_NODE_NAME>' + (prepareTextToSend(args.nodeName) || '') + '</I_V_NODE_NAME>' : '')+
			((args.lang) ?'<I_V_LANGU>' + (args.lang || '') + '</I_V_LANGU>' : '')+
			((args.action) ?'<I_V_ACTION>' + (args.action || '') + '</I_V_ACTION>' : '')+
			((args.nodeId) ?'<I_V_NODE_ID>' + (args.nodeId || '') + '</I_V_NODE_ID>' : '')+
			'</PARAM>'+
			'</EWS>',
			successMethod: runMethod
		}));
	},
		
	refreshNode: function(){
	var isSimulation = (this.__editSimulation)? 'X': '';
	this.makeAJAXrequest($H({ xml:
            '<EWS>'+
			'	<SERVICE>KM_GET_WORD_TAX</SERVICE>'+
			'	<DEL/>'+
			'	<PARAM>'+
			'		<I_V_PAGE>'+this.params.page+'</I_V_PAGE>'+
			'		<I_V_HR_TAX>X</I_V_HR_TAX>' +
			((this.__editMode) ?'<I_V_AUTHORING>' + 'X' + '</I_V_AUTHORING>' : '')+
			((this.__taxonomyCid) ?'<I_V_CONTENT_ID>' + this.__taxonomyCid + '</I_V_CONTENT_ID>' : '')+
			'		<I_V_SIMULATION_ON>'+ isSimulation +'</I_V_SIMULATION_ON>'+
			'	</PARAM>'+
			'</EWS>'
            , successMethod: function(j){
				if(this.params.page==1)
				this.buildFullTaxonomy(j);
				else
				this.appendFullTaxonomy(j);
				if(this.params.page<this.pageTemp){
					this.params.page++
					this.refreshNode();
				}else{
					this.params.page=this.pageTemp;
				}
				
			}.bind(this)
    }));
},
	
	addKeywordSuccess: function(){
		$('taxUL_0').update();
		this.saveKeyPopUp.close();
		this.pageTemp=this.params.page;	
		this.params.page=1;
		this.refreshNode();
	},
	
	deleteKeywordSuccess: function(json){
		//$('fullTaxNode_'+parseInt(this.__selectedKeyword['@node_id'],10)).remove();
		$('taxUL_0').update();
		//this.saveKeyPopUp.close();
		this.pageTemp=this.params.page;	
		this.params.page=1;
		this.refreshNode();	
	},
	
	enableLetter: function(letter){
		$(letter).writeAttribute("active", "true");
		$(letter).removeClassName("application_action_link");
	},
	
	disableLetter: function(letter){
		$(letter).writeAttribute("active", "false");
		$(letter).addClassName("application_action_link");
	},
		
	updateFullTaxonomy: function(evt,letter){
		var isSimulation = (this.__editSimulation)? 'X': '';
		this.params.page = 1;
		var elt=evt.element();
		if(elt.readAttribute('active')=='true'){
			return;
		}else{
			this.enableLetter(elt);
			
			if(this.letterToDisable)
				this.disableLetter(this.letterToDisable);
			this.letterToDisable=elt;
		}
		this.params.letter=letter;
		var xmlin=
			' <EWS>' +
            '    <SERVICE>KM_GET_WORD_TAX</SERVICE>' +
			'    <PARAM>' +
			'		<I_V_SIMULATION_ON>'+ isSimulation +'</I_V_SIMULATION_ON>'+
			'    	<I_V_LETTERS>'+this.params.letter+'</I_V_LETTERS>';
			if(this.params.page){
				xmlin+='<I_V_PAGE>'+this.params.page+'</I_V_PAGE>';
			}
			xmlin+=
			'		<I_V_HR_TAX>X</I_V_HR_TAX>' +
			((this.__editMode) ?'<I_V_AUTHORING>' + 'X' + '</I_V_AUTHORING>' : '')+
			((this.__taxonomyCid) ?'<I_V_CONTENT_ID>' + this.__taxonomyCid + '</I_V_CONTENT_ID>' : '')+
			'    </PARAM>' +
            ' </EWS>';
			
		this.fullTaxShowAllLetter.show();
		//var temp = this.fullTaxShowAllLetter.innerHTML +'('+ this.params.letter +')'
		this.fullTaxShowAllLetter.update(global.getLabel('KM_SHOW_ALL_KEYWORDS')+ '('+ this.params.letter +')')
		//this.fullTaxShowAllLetter.innerHTML + '('+ this.params.letter +')'
		this.makeAJAXrequest($H({ 
			xml: xmlin,
            successMethod: function(e){
			//e.EWS.o_w_taxonomy.taxonomy.yglui_str_ecm_hr_tax.size();
			this.params.page = 1
			
			if(e.EWS.o_w_taxonomy.taxonomy.yglui_str_ecm_hr_tax.size()<10)
			this.showMoreOnOff(false);
			else
			this.showMoreOnOff(true);
			
			this.showLessOnOff(false);
			
			if(e.EWS.o_w_taxonomy.taxonomy.yglui_str_ecm_hr_tax.size()<10)
			this.fullTaxShowAllLetteronOff(false);
			else
			this.fullTaxShowAllLetteronOff(true);
			
			this.showAllOnOff(true);
			if($('taxUL_0')){
				$('taxUL_0').update('')
			}
			this.buildFullTaxonomy(e);
			}.bind(this)
        }));
	},
	
	showLessTaxonomy: function(){
		var length=$$('#taxUL_0 li').length;
		var lengths=$('taxUL_0').length;
		var lastLength = this.params.items[this.params.items.length-1];
		this.params.items.pop();
		for(i=length;i>length-lastLength;i--){
			$('taxUL_0').down('li',i-1).remove();
		}
		if (length <= 10) {
			//$('fullTaxShowLess').hide();
			this.showLessOnOff(false)
		}
		else {
			this.params.page--;
			this.showAllOnOff(true);
			this.fullTaxShowAllLetteronOff(true);
		}
	},
	
	showLessFullTaxonomy: function(){
		this.__buildTax();
	},
	
	
	
	showMoreFullTaxonomy: function(evt){	
		var isSimulation = (this.__editSimulation)? 'X': '';
		this.params.page++;
		var xmlin=
			' <EWS>' +
            '    <SERVICE>KM_GET_WORD_TAX</SERVICE>' +
			'    <PARAM>' +
			'		<I_V_SIMULATION_ON>'+ isSimulation +'</I_V_SIMULATION_ON>'+
			'    	<I_V_PAGE>'+this.params.page+'</I_V_PAGE>';
			if(this.params.letter){
				xmlin+='<I_V_LETTERS>'+this.params.letter+'</I_V_LETTERS>';
			}
			xmlin+=
			'		<I_V_HR_TAX>X</I_V_HR_TAX>' +
			((this.__editMode) ?'<I_V_AUTHORING>' + 'X' + '</I_V_AUTHORING>' : '')+
			((this.__taxonomyCid) ?'<I_V_CONTENT_ID>' + this.__taxonomyCid + '</I_V_CONTENT_ID>' : '')+
			'    </PARAM>' +
            ' </EWS>';
			
			
		this.makeAJAXrequest($H({ 
			xml: xmlin,
            successMethod: function(json){
				//$('fullTaxShowLess').show();
				if (json.EWS.o_w_taxonomy.taxonomy != null) {
					var x = json.EWS.o_w_taxonomy.taxonomy.yglui_str_ecm_hr_tax.length
					if (x > 0) {
						this.params.items.push(x)
					}
					this.appendFullTaxonomy(json);
					this.showLessOnOff(true);
					
					if (x < 10) {
						this.showMoreOnOff(false);
						this.fullTaxShowAllLetteronOff(false);
					}
					else {
						this.showMoreOnOff(true);
						this.fullTaxShowAllLetteronOff(true);
					}
				}else{
					this.showMoreOnOff(false);
					this.fullTaxShowAllLetteronOff(false);
				}
								
			}.bind(this)
        }));
				
	},
		
	showAllFullTaxonomy: function(evt){		
		var isSimulation = (this.__editSimulation)? 'X': '';
		this.makeAJAXrequest($H({ xml:
            ' <EWS>' +
            '    <SERVICE>KM_GET_WORD_TAX</SERVICE>' +
			'    <PARAM>' +
			'		<I_V_HR_TAX>X</I_V_HR_TAX>' +
			'		<I_V_SIMULATION_ON>'+ isSimulation +'</I_V_SIMULATION_ON>'+
			((this.__editMode) ?'<I_V_AUTHORING>' + 'X' + '</I_V_AUTHORING>' : '')+
			((this.__taxonomyCid) ?'<I_V_CONTENT_ID>' + this.__taxonomyCid + '</I_V_CONTENT_ID>' : '')+
			'    </PARAM>' +
            ' </EWS>',
            successMethod: function(e){
				this.showLessOnOff(true,true);
				this.showMoreOnOff(false);
				this.showAllOnOff(false);
				if($('taxUL_0')){
					$('taxUL_0').update();
				}
				this.buildFullTaxonomy(e);
			}.bind(this)
        }));
	},
	
	showMoreOnOff: function(isOn){
		if($('fullTaxShowMore')){
			$('fullTaxShowMore').stopObserving('click');
			if(isOn==false){
				$('fullTaxShowMore').addClassName('application_main_soft_text');
			}
			else{
				$('fullTaxShowMore').removeClassName('application_main_soft_text');
				$('fullTaxShowMore').observe('click', this.showMoreFullTaxonomy.bindAsEventListener(this));
			}
		}

	},
	
	showAllOnOff: function(isOn){
		if($('fullTaxShowAll')){
			$('fullTaxShowAll').stopObserving('click');
			if(isOn==false){
				$('fullTaxShowAll').addClassName('application_main_soft_text');
			}
			else{
				$('fullTaxShowAll').removeClassName('application_main_soft_text');
				$('fullTaxShowAll').observe('click', this.showAllFullTaxonomy.bindAsEventListener(this));
			}
		}
	},
	
	showLessOnOff: function(isOn,isFull){
		if($('fullTaxShowLess')){
			$('fullTaxShowLess').stopObserving('click');
			if(isOn==false){
				$('fullTaxShowLess').addClassName('application_main_soft_text');
			}
			else{
				$('fullTaxShowLess').removeClassName('application_main_soft_text');
				if(!isFull){
					$('fullTaxShowLess').observe('click', this.showLessTaxonomy.bindAsEventListener(this));
				}else{
					$('fullTaxShowLess').observe('click', this.showLessFullTaxonomy.bindAsEventListener(this));
				}
			}
		}

	},
	
	fullTaxShowAllLetteronOff: function(isOn){
		if($('fullTaxShowAllLetter')){
			$('fullTaxShowAllLetter').stopObserving('click');
			if(isOn==false){
				$('fullTaxShowAllLetter').addClassName('application_main_soft_text');
			}
			else{
				$('fullTaxShowAllLetter').removeClassName('application_main_soft_text');
				$('fullTaxShowAllLetter').observe('click', this.showAllFullTaxonomyLetter.bindAsEventListener(this));
			}
		}

	},
	vewModeAction: function(){
		this.__viewMode = false;
		this.__taxonomyCid = this.__oldVersion;
		$('versionStatus').update('');
		this.getFullTaxonomy();
		
		this.makeAJAXrequest($H({ xml:
            ' <EWS>' +
            '    <SERVICE>KM_GET_WORD_TAX</SERVICE>' +
			'    <PARAM>' +
			'    	<I_V_PAGE>1</I_V_PAGE>' +
			'		<I_V_HR_TAX>X</I_V_HR_TAX>' +
			'		<I_V_SIMULATION_ON>'+ isSimulation +'</I_V_SIMULATION_ON>'+
			((this.__editMode) ?'<I_V_AUTHORING>' + 'X' + '</I_V_AUTHORING>' : '')+
			((this.__taxonomyCid) ?'<I_V_CONTENT_ID>' + this.__taxonomyCid + '</I_V_CONTENT_ID>' : '')+
			'    </PARAM>' +
            ' </EWS>',
            successMethod: 'buildFullTaxonomy'
        }));
		
	},
	
	buildViewMode: function(){
		if (this.__viewMode) {
       	$('versionStatus').update('<span style="font-style:italic;text-align:right;font-size:11px;padding:1px;padding-right:4px;float:left">'+ global.getLabel('KM_MEN_CURRENT_VIEW')+' '+ this.__version+'.</span>');
		$('versionStatus').insert('<span style="font-style:italic;color:#cccccc;text-align:right;font-size:11px;padding:1px;padding-right:4px;float:left"><a class="application_action_link" id="returnVersionLink">'+global.getLabel('KM_MEN_CLICK_EXIT')+'</a></span>');
    	$('returnVersionLink').observe("click", this.vewModeAction.bindAsEventListener(this));
		}
	},
	
    close: function($super) {
        $super();
/* 		if(!this.selectionMode || !this.searchMenuMode){
			global.abortAjaxCalls();
		} */
		
    }
	
	
});
