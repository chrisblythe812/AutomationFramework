var megaButtonDisplayer = Class.create({
    hash: null,
    buttons: null,
    mainClass: null,
    standardButton: false,
    defaultType: 'button',
    defaultidButton: '',
    defaultLabel: null,
    defaultDelimit: null,
    defaultData: null,
    defaultButtonClassName: null,
    defaultLinkClassName: null,
    defaultHandler: null,
    defaultHandlerContext: null,
    defaultEvent: null,
    defaultEventOrHandler: false,
    defaultDisabledClass: 'megaButtonDisplayer_disabled',
    defaultActiveClass: 'megaButtonDisplayer_active',
	defaultEnabled: true,
	defaultActive: false,
    toolTip:'',
	isIE9: false,
    initialize: function(json) {
		this.isIE9 = navigator.userAgent.indexOf("MSIE 9.0") != -1;
        if (!Object.isEmpty(json.defaultEventOrHandler)) this.defaultEventOrHandler = json.defaultEventOrHandler;
        if (!Object.isEmpty(json.defaultDisabledClass)) this.defaultDisabledClass = json.defaultDisabledClass;
        if (!Object.isEmpty(json.defaultActiveClass)) this.defaultActiveClass = json.defaultActiveClass;
        if (!Object.isEmpty(json.defaultType)) this.defaultType = json.defaultType;
        if (!Object.isEmpty(json.standardButton)) this.standardButton = json.standardButon;
        if (!Object.isEmpty(json.defaultidButton)) this.defaultidButton = json.defaultidButton;
        if (!Object.isEmpty(json.defaultLabel)) this.defaultLabel = json.defaultLabel;
        if (!Object.isEmpty(json.defaultDelimit)) this.defaultDelimit = json.defaultDelimit;
        if (!Object.isEmpty(json.defaultData)) this.defaultData = json.defaultData;
        if (!Object.isEmpty(json.defaultButtonClassName)) this.defaultButtonClassName = json.defaultButtonClassName;
        if (!Object.isEmpty(json.defaultLinkClassName)) this.defaultLinkClassName = json.defaultLinkClassName;
        if (!Object.isEmpty(json.defaultHandler)) this.defaultHandler = json.defaultHandler;
        if (!Object.isEmpty(json.defaultHandlerContext)) this.defaultHandlerContext = json.defaultHandlerContext;
        if (!Object.isEmpty(json.defaultEvent)) this.defaultEvent = json.defaultEvent;
        if (!Object.isEmpty(json.mainClass)) this.mainClass = json.mainClass;
        if (!Object.isEmpty(json.toolTip)) this.toolTip = json.toolTip;
		if (!Object.isEmpty(json.defaultEnabled)) this.defaultEnabled = json.defaultEnabled;
		if (!Object.isEmpty(json.defaultActive)) this.defaultActive = json.defaultActive;
        this.buttons = new Element('div', { 'class': this.mainClass });
        this.hash = $H({});
        this.buildButtons(json);
    },
    buildButtons: function(json) {
        var iter = 0;
        json.elements.each(function(button) {
            var aux = new Object();
            aux.disabledClass = (!Object.isEmpty(button.disabledClass)) ? button.disabledClass : this.defaultDisabledClass;
            aux.activeClass = (!Object.isEmpty(button.defaultActiveClass)) ? button.defaultActiveClass : this.defaultActiveClass;
            aux.eventOrHandler = (!Object.isEmpty(button.eventOrHandler)) ? button.eventOrHandler : this.defaultEventOrHandler;
            aux.isStandard = (!Object.isEmpty(button.standardButton)) ? button.standardButton : this.standardButton;
            aux.type = (!Object.isEmpty(button.type)) ? button.type : this.defaultType;
            aux.idButton = (!Object.isEmpty(button.idButton)) ? button.idButton : this.defaultidButton;
            aux.label = (!Object.isEmpty(button.label)) ? button.label : this.defaultLabel;
            aux.delimit = (!Object.isEmpty(button.delimit)) ? button.delimit : this.defaultDelimit;
            aux.data = (!Object.isEmpty(button.data)) ? button.data : this.defaultData;
            aux.toolTip = (!Object.isEmpty(button.toolTip)) ? button.toolTip : this.toolTip;
			aux.enabled = (!Object.isEmpty(button.enabled)) ? button.enabled : this.defaultEnabled;
			aux.active = (!Object.isEmpty(button.active)) ? button.active : this.defaultActive;
            var auxClass = (aux.type == 'button') ? this.defaultButtonClassName : this.defaultLinkClassName;
            aux.className = (!Object.isEmpty(button.className)) ? button.className : auxClass;
            //************* Function is going to react to click *************
            aux.handler = (!Object.isEmpty(button.handler)) ? button.handler : this.defaultHandler;
            aux.handlerContext = (!Object.isEmpty(button.handlerContext)) ? button.handlerContext : this.defaultHandlerContext;
            //************* An event is going to be thrown when clicking ************* 
            aux.event = (!Object.isEmpty(button.event)) ? button.event : this.defaultEvent;
            this.hash.set(aux.idButton, [aux]);
            this.createButton(aux, iter);
            iter++;
        } .bind(this));
        if (!Object.isEmpty(global.currentApplication)) {
            if (global.buttonsByAppid && Object.isEmpty(global.buttonsByAppid.get(global.currentApplication.className))) {
                global.buttonsByAppid.set(global.currentApplication.className, { 'array': [this.hash] });
            }
            else {
                if (global.buttonsByAppid)
                    global.buttonsByAppid.get(global.currentApplication.className).array.push(this.hash);
            }
        }
    },
    createButton: function(button, index) {
        var aux = null;
		var title = Object.isEmpty(button.toolTip) ? button.label : button.toolTip;
		if(Object.isEmpty(title)){
			title = "";
		}
        if (button.type == 'button') {
            if (button.isStandard == true) {

                aux = new Element('div', {
                    'class': button.className,
                    'id': button.idButton,
                    'title': title.stripTags()
                });
                var auxLeft = new Element('div', {
                    'class': 'leftRoundedCorner'
                });
                var auxButton = new Element('button', { 'class': 'centerRoundedButton test_button' });
                var auxCenter = new Element('span', { 'class': 'centerRoundedButtonSpan' });
                var auxRight = new Element('span', {
                    'class': 'rightRoundedCorner'
                });
                auxCenter.insert(button.label);
                auxButton.insert(auxCenter);
                aux.insert(auxLeft);
                aux.insert(auxButton);
                aux.insert(auxRight);

            }
            else
                aux = new Element('input', {
                    'type': button.type,
                    'class': button.className,
                    'value': button.label,
                    'title': title.stripTags()
                });
        } else {
            if (Object.isEmpty(button.delimit)) {
                aux = new Element('button', {
                    'class': button.className + ' megaButtonLink test_link',
                    'id': button.idButton,
                    'title': title.stripTags()
                });
				if(Prototype.Browser.Gecko){aux.writeAttribute("style","margin: -1px 5px 0 0");}	// In firefox we need to add a negative margin to reposition the button (Behavior is different in every browser => IE specific in CSS2_IE7.css, chrome in CSSFWK.CSS)
				else if(this.isIE9){aux.writeAttribute("style","margin-right: 5px");}			// In IE 9 we need to add a right margin, otherwise buttons will be drawn right next to each other
                aux.update(button.label);
                aux.addClassName('megaButtonDisplayer_floatLeft');
            }
            else {
				title = Object.isEmpty(button.toolTip) ? button.label.gsub(button.delimit, "") : button.toolTip;
				if(Object.isEmpty(title)){
					title = "";
				}
                var className = button.className.gsub('application_action_link ', '');
				var inlineStyle = "";
				if(Prototype.Browser.Gecko){inlineStyle = " style='margin: -1px 5px 0 0' ";} 		// In firefox we need to add a negative margin to reposition the button (Behavior is different in every browser => IE specific in CSS2_IE7.css, chrome in CSSFWK.CSS)
				else if(this.isIE9){inlineStyle = " style='margin-right: 5px' ";}	// In IE 9 we need to add a right margin, otherwise buttons will be drawn right next to each other			
//                if (!object.isempty(button.idbutton)) {
//                    var html = button.label.replace(button.delimit, "<button id=" + button.idbutton + " class='application_action_link megabuttonlink test_link'" + inlinestyle + ">").replace(button.delimit, "</button>");
//                } else {
			var html = button.label.replace(button.delimit, "<button class='application_action_link megaButtonLink test_link'" + inlineStyle + ">").replace(button.delimit, "</button>");
//                }
                auxDiv = new Element('div', {
                    'class': className,
                    'title': title.stripTags()
                });
                auxDiv.update(html);
                if (auxDiv.down()) {
                aux = auxDiv.down();
                } else {
                    aux = auxDiv;
                }
            }
        }
        var observeHandler = null;
        if (!button.eventOrHandler) {
            observeHandler =
            function() {
                try {
                    if (!Object.isEmpty(this.handlerContext))
                        this.handler.call(this.handlerContext, this.data);
                    else
                        this.handler.call();
                } catch (e) {
                    //                    if(log)
                    //                        log.info('No handler has been defined for the button '+button.idButton);
                };
            } .bind(button);
            aux.observe('click', observeHandler);
        } else if (!Object.isEmpty(button.event)) {
            observeHandler =
            function() {
                document.fire(this.event, this.data);
            } .bind(button);
            aux.observe('click', observeHandler);
        }
        if (!Object.isEmpty(button.delimit)) {
            aux = auxDiv;
        }
        this.buttons.insert(aux);
        this.hash.get(button.idButton).push(aux);
        this.hash.get(button.idButton).push(observeHandler);
		if(button.enabled == false){
			this.disable(button.idButton);
		}
		if(button.active){
			this.setActive(button.idButton);
		}
    },
    enable: function(idButton) {
		this._enable(this.hash.get(idButton));
    },
	_enable: function(button){
	    button.enabled = true;
        if (button[0].isStandard) {
            if (!Object.isEmpty(button[1].down('[class*=leftRoundedCornerDisable]'))) {
                button[1].down('[class*=leftRoundedCornerDisable]').className = 'leftRoundedCorner';
                button[1].down('[class*=centerRoundedButtonDisable]').className = 'centerRoundedButton';
                button[1].down('[class*=rightRoundedCornerDisable]').className = 'rightRoundedCorner';
            }
        } else {
            button[1].removeClassName(button[0].disabledClass);
            button[1].removeClassName(button[0].activeClass);
            button[1].addClassName('application_action_link');
        }
        button[1].observe('click', button[2]);
    },
    disable: function(idButton) {
        this._disable(this.hash.get(idButton));
    },
	_disable: function(button){
		button[0].enabled = false;
        if ((button[0].isStandard)) {
            if (!Object.isEmpty(button[1].down('[class*=leftRoundedCorner]'))) {
                button[1].down('[class*=leftRoundedCorner]').className = 'leftRoundedCornerDisable';
                button[1].down('[class*=centerRoundedButton]').className = 'centerRoundedButtonDisable';
                button[1].down('[class*=rightRoundedCorner]').className = 'rightRoundedCornerDisable';
            }
        } else {
            button[1].addClassName(button[0].disabledClass);
            button[1].removeClassName('application_action_link');
            button[1].removeClassName(button[0].activeClass);
        }
        button[1].stopObserving('click', button[2]);
    },
    setActive: function(idButton) {
       this._setActive(this.hash.get(idButton));
    },
	_setActive: function(button){
		button[0].enabled = false;
        if ((button[0].isStandard)) {
            if (!Object.isEmpty(button[1].down('[class*=leftRoundedCorner]'))) {
                button[1].down('[class*=leftRoundedCorner]').className = 'leftRoundedCornerDisable';
                button[1].down('[class*=centerRoundedButton]').className = 'centerRoundedButtonDisable';
                button[1].down('[class*=rightRoundedCorner]').className = 'rightRoundedCornerDisable';
            }
        } else {
            button[1].addClassName(button[0].activeClass);
            button[1].removeClassName('application_action_link');
            button[1].removeClassName(button[0].disabledClass);
        }
        button[1].stopObserving('click', button[2]);
    },
    /**
     * Gets the DOM element for this id
     * @param idButton the ID of the button we want to get the element for
     */ 
    getElement: function(idButton){
        return this.hash.get(idButton)[1];
    },
    /**
     * Changes the class for a button
     * @param idButton the ID of the button we want to change the class to
     * @param newClass the new class to apply
     */ 
    changeClass: function(idButton, newClass){
        //Only change class if it is a non-standard button
        if(this.hash.get(idButton)[0].type == "button" && !this.hash.get(idButton)[0].isStandard){
            var element = this.getElement(idButton);
            element.removeClassName(this.hash.get(idButton)[0].className);
            this.hash.get(idButton)[0].className = newClass;
            element.addClassName(newClass);
        }
    },
    isEnabled: function(idButton) {
        return this.hash.get(idButton)[0].enabled;
    },
    getButtons: function() {
        return this.buttons;
    },
    getButton: function(idButton) {
        return this.hash.get(idButton)[1];
    },
    getButtonsArray: function() {
        return this.hash;
    },
    updateHandler: function(idButton, handler) {
        this.hash.get(idButton)[0].handler = handler;
    },
    updateHandlerContext: function(idButton, context) {
        this.hash.get(idButton)[0].handlerContext = context;
    },
    updateEvent: function(idButton, event) {
        this.hash.get(idButton)[0].event = event;
    },
    updateData: function(idButton, data) {
        this.hash.get(idButton)[0].data = data;
    },
    updateLabel: function(idButton, label) {
        if (this.hash.get(idButton)[1].down('[class*=centerRoundedButton]'))
            this.hash.get(idButton)[1].down('[class*=centerRoundedButton]').update(label);
        else if (this.hash.get(idButton)[1].down('[class*=centerRoundedButtonDisable]'))
            this.hash.get(idButton)[1].down('[class*=centerRoundedButtonDisable]').update(label);
        else if ((!Object.isEmpty(this.hash.get(idButton)[0].className)) && (this.hash.get(idButton)[1].down('[class*=' + this.hash.get(idButton)[0].className + ']')))
            this.hash.get(idButton)[1].down('[class*=' + this.hash.get(idButton)[0].className + ']').update(label);
        else
            this.hash.get(idButton)[1].update(label);
    },
    updateWidth: function(idButton, width) {
        if (this.hash.get(idButton)[1].down('[class*=centerRoundedButton]'))
            this.hash.get(idButton)[1].down('[class*=centerRoundedButton]').setStyle({ width: width });
        else if ((!Object.isEmpty(this.hash.get(idButton)[0].className)) && (this.hash.get(idButton)[1].down('[class*=' + this.hash.get(idButton)[0].className + ']')))
            this.hash.get(idButton)[1].down('[class*=' + this.hash.get(idButton)[0].className + ']').setStyle({ width: width });
        else
            this.hash.get(idButton)[1].setStyle({ width: width });
    }
});