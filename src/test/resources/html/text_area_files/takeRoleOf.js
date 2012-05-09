/**
 * @fileoverview takeRoleOf.js
 * @description Contains the takeRoleOf application definition
 */

/**
 * This class models the take the role of drop down. 
 * It allows the logged on user, to take the role of someone else (regarding authorisations)
 * @description
 * @augments origin
 */ 
var takeRoleOf = Class.create(origin, 
/**
 * @lends takeRoleOf
 */
{
    /**
     * current url
     * @type String
     */
    location: window.location.protocol+'//'+window.location.host+window.location.pathname,
    /** 
     * html Element that contains the whole takeRoleOf object html
     * @type {Element}
     */
    element: null,
    initialize: function($super) {
        $super();   
        //when a manager delegation is selected   
		this.roleTakenHandlerBinding = this.roleTaken.bindAsEventListener(this);
		document.observe('EWS:takeRoleOf_roleSelected',this.roleTakenHandlerBinding); 
		this.element = $("applicationTakeRoleOf_main");
		if(getURLParam('roleOf') != ''){
			this.setBackButton();
		}else{
			this.setAutocompleter();
		}
    },
	/**
	 * Initializes the "Back" button to return to the normal application 
	 */
	setBackButton: function(){
		var json = {
            elements: []
        };
        var backButtonData = {
            label: global.getLabel('back'),
            type: 'link',
            handlerContext: null,
            className: 'application_main_text topMenu_rightTopMenu_text takeRoleOfCursor',
            handler:this.clickingOnButton.bind(this),
            standardButton: true
        };
        json.elements.push(backButtonData);
        var backButton = new megaButtonDisplayer(json);
        this.element.insert(backButton.getButtons());
	},
	clickingOnButton:function(){
    var sesId = getURLParam("sesid");
    var light = getURLParam("light");
    var right = getURLParam("right");
    window.location = this.location + "?sesid=" + sesId + "&light=" + light + "&right=" + right;
	},
	/**
	 * Creates the autocompleter to select the role of somebody
	 */
	setAutocompleter: function(){
        //the delegations list
		if(!global.delegations.size()) return;
        this.delegationsAutocompleter = new JSONAutocompleter(this.element.identify(), {
            showEverythingOnButtonClick: true,
            timeout: 20000,
            templateOptionsList: '#{text}',
            templateResult: '#{text}',
			events: $H({
				onResultSelected: "EWS:takeRoleOf_roleSelected"
			})
        }, this.createDelegationsJSON());
        this.delegationsAutocompleter.setLabel(global.getLabel("takeRoleOf"));
    },
    /**
     * creates the needed JSON for the autocompleter from the info in global
     */
	createDelegationsJSON: function(){
		var delegationsArray = $A();
		global.delegations.each(function(delegation){
			delegationsArray.push({
				text: delegation.value.employeeName,
				data: delegation.value.userName
			});
		});
		var delegationsJSON = {
			autocompleter: {
				object: delegationsArray
			}
		};
		return delegationsJSON;    
    },
    /**
     * @param manager {Object} Delegation clicked information
     * @desc Logs on the SSW Framework as the delegation clicked related manager
     */
    roleTaken: function(man){   
	    var manager = getArgs(man);
    var sesId = getURLParam("sesid");
    var light = getURLParam("light");
    var right = getURLParam("right");
        //if the option "Take Role of..." is not selected
        if(!Object.isEmpty(manager.idAdded)){ 
            if((this.element) && (manager.idAutocompleter == this.element.identify())){
            window.location = this.location + "?sesid=" + sesId + "&light=" + light + "&right=" + right + "&roleOf=" + manager.idAdded;
            }
        }    
    }
    
});