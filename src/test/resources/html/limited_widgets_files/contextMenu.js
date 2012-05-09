/*
* @fileoverview contextMenu.js
* @desc Contais all the functionalities for creating a contextual menu
*/
//Creating the proto object
if (Object.isUndefined(Proto)) { var Proto = {} }

/*
* @class Proto.Menu
* @desc Contains all the functionalities for creating a contextual menu
*/
Proto.Menu = Class.create({
    /*
    * @methjod initialize
    * @desc Initializes the context menu functionalities
    */
    initialize: function() {
        var e = Prototype.emptyFunction;
        /*
        * @name ie
        * @desc Stores information about the browser
        * @type Boolean
        */
        this.ie = Prototype.Browser.IE;
        /*
        * @name options
        * @desc Context menu options object
        */
        this.options = Object.extend({
            selector: '.contextmenu',
            className: 'contextMenu',
            pageOffset: 25,
            fade: false,
            zIndex: 5500,
            beforeShow: e,
            beforeHide: e,
            beforeSelect: e
        }, arguments[0] || {});
        /*
        * @name showMenuAction
        * @desc Controls when the menus must be shown
        * @type Boolean
        */
        this.showMenuAction = false;
        //Defining the fade effect for closing
        this.options.fade = this.options.fade && !Object.isUndefined(Effect);
        /*
        * @name container
        * @desc This element content the context menu
        * @type Prototype.Element
        */
        this.container = new Element('div', { id: 'contextMenuContainer_' + Math.random(), className: this.options.className, style: 'display:none;' });
        //List element
        var list = new Element('ul');
        this.options.menuItems.each(function(item) {
            list.insert(
				new Element('li', { className: item.separator ? 'separator' : '' }).insert(
					item.separator
						? ''
						: Object.extend(new Element('a', {
						    href: '#',
						    title: item.title ? item.title : item.name,
						    className: (item.className || '') + (item.disabled ? ' disabled' : ' enabled')
						}), { _callback: item.callback })
						.observe('click', this.onClick.bind(this))
						.update(item.name)
				)
			)
        } .bind(this));
        this._itemsList = list;
        //Inserting the menu
        $(document.body).insert(this.container.insert(list));
        //Observing the click event
        document.observe('click', this.checkOutside.bind(this));
    },
    /*
    * @method addItem
    * @desc Adds a new item on the context menu
    * @param Item new to item to be added
    */
    addItem: function(item) {
        this._itemsList.insert(
				new Element('li', { className: item.separator ? 'separator' : '' }).insert(
					item.separator
						? ''
						: Object.extend(new Element('a', {
						    href: '#',
						    title: item.name,
						    className: (item.className || '') + (item.disabled ? ' disabled' : ' enabled')
						}), { _callback: item.callback, itemId: item.itemId })
						.observe('click', this.onClick.bind(this))
						.update(item.name)
				)
			);
    },
    /*
    * @method show
    * @desc Show the context menui
    * @param e {Event}
    */
    show: function(e, isElem) {
        var marginTop = 15;
        this.showMenuAction = true;
        this.options.beforeShow(e);
        //Getting the position to be placed
        if (this.ie) {
            var marginLeft = 10;
            var x = e.srcElement.cumulativeOffset().left + e.srcElement.getWidth() - marginLeft;
            if( x < parseInt(this.container.getStyle('width')))
                x = parseInt(this.container.getStyle('width'));
			var y = e.srcElement.cumulativeOffset().top + e.srcElement.getHeight() - marginTop,
			elOff = {
			    left: x + 'px',
			    top: y + 'px'
			};
        }
        else {
            var marginLeft = 12;
			var x;
			if (isElem) {
				x = e.srcElement.cumulativeOffset().left + e.srcElement.getWidth() - marginLeft;
            if( x < parseInt(this.container.getStyle('width')))
                x = parseInt(this.container.getStyle('width'));
				var y = e.srcElement.cumulativeOffset().top + e.srcElement.getHeight() - marginTop, elOff = {
			    left: x + 'px',
			    top: y + 'px'
			};
			}
			else {
			
				x = e.findElement().cumulativeOffset().left + e.findElement().getWidth() - marginLeft;
				if (x < parseInt(this.container.getStyle('width'))) 
					x = parseInt(this.container.getStyle('width'));
				y = e.findElement().cumulativeOffset().top + e.findElement().getHeight() - marginTop, elOff = {
					left: x + 'px',
					top: y + 'px'
				};
			}
        }
        //Setting the stylee
        this.container.setStyle(elOff).setStyle({ zIndex: this.options.zIndex, position: 'absolute' });
        //Calling the show effect
        this.options.fade ? Effect.Appear(this.container, { duration: 0.25 }) : this.container.show();
        this.event = e;
    },
    /*
    * @method onClick
    * @desc This method is performed every time the user clicks on an item
    * @param e {Event}
    */
    onClick: function(e) {
        e.stop();
        if (e.target._callback && !e.target.hasClassName('disabled')) {
            this.options.beforeSelect(e);
            this.container.hide();
            e.target._callback(e.target.itemId);
        }
    },
    /*
    * @method checksOutside
    * @desc Checks if a clicks was made outside an element
    * @param event {Event}
    * @return Booleanm
    */
    checkOutside: function(event) {
        if ($(event.element().identify())) {
            if (clickedOutsideElement(this.container.identify(), event) && !this.showMenuAction){
                this.container.hide();
                this.options.beforeHide();
            }    
            this.showMenuAction = false;
        }
    }
})


