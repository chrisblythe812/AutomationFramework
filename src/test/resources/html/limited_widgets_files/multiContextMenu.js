
if (Object.isUndefined(multiContextMenu)) { var multiContextMenu = {} }

multiContextMenu = Class.create({
    myHashesHash: $H({}),
    maximumNumberItemPerLevel : $H(),
    actualLevel: null,
    openInstances: [],
    mainMenu: null,

    /*
    * @method initialize
    * @desc called whe make a instance of a multicontext menu
    */
    initialize: function() {
        
    },

    /*
    * @method setContent 
    * desc allows to stablish the content of the hole context menu
    * @param input is an array of hashes including [ID,TEXT,CHILDREN,CALLBACK]
    */
    setContent : function(input, hashMaximumItemPerLevel){
        if (!input) {
            return 0;
        }
        if(hashMaximumItemPerLevel){
            this.maximumNumberItemPerLevel = hashMaximumItemPerLevel;
        }
        level = 0;
        counter = 0;

        mContextMenu.destroy();
        this.openInstances.clear();
        
        this.myHashesHash = $H({});
        for (var index = 0, len = input.length; index < len; ++index) {
            var aHash = input[index];
            this.hashCreation(aHash.get('id'), aHash.get('text'), aHash.get('children'), '0', level, aHash.get('callback'), this.myHashesHash);
        }
    },
    
    /*
    * @method hashCreation
    * @desc Create the hash structure to support all the elements tree of the multicontextmenu
    * @param key is the Id of the hash
    * @param text is the text of the item in the menu
    * @param childHash the arrray of hashes with each child
    * @param level is the level which holds the actual element
    * @param hashesHash is the Hash which holds all the hash elements 
    */
    hashCreation: function(key, text, childrenArray, parentId, level, callback, hashesHash) {
        //create a new hash element
        var h;
        if (!childrenArray) {
            h = new Hash({ id: key, text: text, children: childrenArray, parentId: parentId, level: level, callback: callback });
            if (level == 0) hashesHash.set(key, h);
        }
        else {
            var hashAux = $H({});
            //for each child create a hash and insert into the hashesHash
            for (var index = 0, len = childrenArray.length; index < len; ++index) {
                var aHash = childrenArray[index];
                var id = aHash.get('id');
                var tmp = this.hashCreation(id, aHash.get('text'), aHash.get('children'), id.substring(2), level + 1, aHash.get('callback'), this.myHashesHash);
                hashAux.set(id, tmp);
            }
            h = new Hash({ id: key, text: text, children: hashAux, parentId: parentId, level: level, callback: callback });
            if (level == 0) hashesHash.set(key, h);
        }
        return h;
    },

    /*
    * @method showMainMenu
    * @desc Create and show the main menu  
    * @param evt the event with some important fields as mouse coordinates
    */

    showMainMenu: function(evt) {

        //for each element in myHashesHash create a Item 
        var myMenuItems = []
        this.myHashesHash.each(function(pair) {
            var h = pair.value; //one hash element
            if (h.get('text') == '#separator#') {
                var oneElement = { separator: true, name: h.get('text'), className: '', id: h.get('id'), callback: null };
            }
            else {
                if (!h.get('children')) {
                    oneElement = { name: h.get('text'), className: '', id: h.get('id'), callback: h.get('callback') }; //
                }
                else {
                    oneElement = { name: h.get('text'), className: 'submenu', submenu: true, id: h.get('id'), callback: this.showaMenu.bind(this) }; //
                }
            }
            myMenuItems.push(oneElement);
        } .bind(this));

        this.mainMenu = new blockContext.Menu({
            selector: null, // context menu will be shown when element is clicked
            className: 'contextMenu', // this is a class which will be attached to menu container (used for css styling)
            menuItems: myMenuItems, // array of menu items
            multiContextMenu: this //the multiContextMenu instance to allow the comunication with the children
        }, this)
        this.mainMenu.options = Object.extend({ level: 0 }, this.mainMenu.options);
        this.actualLevel = 0;
        this.openInstances.push(this.mainMenu);
        this.mainMenu.show(evt);

    },


    /*
    * @method showaMenu
    * @desc Create and show the selected parentId menu 
    * @param parentId is the Id of the parent wich content the sub menu
    */
    showaMenu: function(parentId, evt) {
        //take the parentId from myHashesHash
        var aElement = this.findaItem(parentId);
        //take the level
        var myLevel = aElement.get('level') + 1;

        if (aElement.get('children')) {
            aElement = aElement.get('children');
        }
        else {
            return 0;
        }
        //Management of maximum number
        var maximum = this.maximumNumberItemPerLevel.get("level" + (myLevel+1)) ? this.maximumNumberItemPerLevel.get("level" + (myLevel+1)) : null;
        //for each element in myHashesHash create a Item 
        var myMenuItems = []
        aElement.each(function(pair) {
            var h = pair.value; //one hash element
            if (h.get('text') == '#separator#') {
                var oneElement = { separator: true, name: h.get('text'), className: '', id: h.get('id'), callback: null };
            }
            else {
                if (!h.get('children')) {
                    oneElement = { name: h.get('text'), className: '', id: h.get('id'), callback: h.get('callback') };
                }
                else {
                    oneElement = { name: h.get('text'), className: 'submenu', submenu: true, id: h.get('id'), callback: this.showaMenu.bind(this) };
                }
            }
            myMenuItems.push(oneElement);
        } .bind(this));

        menu = new blockContext.Menu({
            selector: null, // context menu will be shown when element is clicked
            className: 'contextMenu', // this is a class which will be attached to menu container (used for css styling)
            menuItems: myMenuItems, // array of menu items
            multiContextMenu: this, //the multiContextMenu instance to allow the comunication with the children
            maximumNumberItemPerLevel: maximum
        }, this)
        menu.options = Object.extend({ level: myLevel }, menu.options);
        this.actualLevel = myLevel;
        this.openInstances.push(menu);
        menu.showSubMenu(evt);
    },
    /*
    * @method findaItem
    * @desc returns a context menu block with an id, if exist in the hash of hashes   
    * @param id is the Id of the element wich content the sub menu
    */
    findaItem: function(id) {
        //split the id into an array
        var path = id.split('_');
        var auxPath = path[path.length - 1];
        var aElement = this.myHashesHash.get(auxPath);
        for (var index = (path.length - 1); index > 0; --index) {
            aElement = aElement.get('children');
            auxPath = path[index - 1] + "_" + auxPath;
            aElement = aElement.get(auxPath)
        }
        return aElement;
    },
    /*
    * @method pruneFromLevel
    * @desc this method prune all the branches higher than an specific level   
    * @param lvl is the desired level branch
    */
    pruneFromLevel: function(lvl) {
        //for each element in openInstances with a higher level, we hide and destroy it
        this.openInstances.each(function(s, index) {
            if (s.options.level > lvl) {
                //hide and destroy
                s.destroy();
                //remove element from openInstances
                this.openInstances = this.openInstances.without(s);
            }
        } .bind(this));
    },
    /*
    * @method itemLevel
    * @desc returns the level of an specific item   
    * @param id is the Id dessired item 
    */
    itemLevel: function(id) {
        return this.findaItem(id)._object.level;
    },
    /*
    * @method destroy
    * @desc destroy the multiContextMenu 
    */
    destroy: function() {
        this.pruneFromLevel(-1);
    }

})


if (Object.isUndefined(blockContext)) { var blockContext = { } }

blockContext.Menu = Class.create({
    myMultiContextMenu: null, //the mother class which manage this block
    itemsList:$A(),
    firstItemToShow: null,
    /*
    * @methjod initialize
    * @desc Initializes the context menu functionalities
    */
    initialize: function(options, aMultiContextMenu) {
        this.myMultiContextMenu = aMultiContextMenu;
        var e = Prototype.emptyFunction;
        this.ie = Prototype.Browser.IE;
        this.ie9 = navigator.userAgent.indexOf("MSIE 9.0") != -1;
        this.options = Object.extend({
            selector: 'contextmenu',
            className: 'contextMenu',
            pageOffset: 25,
            fade: false,
            zIndex: 5500,
            beforeShow: e,
            beforeHide: e,
            beforeSelect: e,
            additionalClassContainer:null,
            maximumNumberItemPerLevel: options.maximumNumberItemPerLevel
        }, options || {});

        this.shim = new Element('iframe', {
            style: 'position:absolute;filter:progid:DXImageTransform.Microsoft.Alpha(opacity=0);display:none',
            src: 'javascript:false;',
            frameborder: 0
        });

        this.options.fade = this.options.fade && !Object.isUndefined(Effect);
        this.container = new Element('div', { id: 'contextMenuContainer_' + Math.random(), className: this.options.className, style: 'display:none' });
        var list = new Element('ul');
        var counter = 0;
        var showArrowDownward = false; 
        this.itemsList = $A();
        if(this.options.maximumNumberItemPerLevel && this.options.menuItems.length > this.options.maximumNumberItemPerLevel)
            this.insertArrowOnSubmenu(list,"up");//Arrow up
        this.options.menuItems.each(function(item) {
            counter++;
            var aux = new Element('li', { className: item.separator ? 'separator' : '' });
            //just in submenu case create a little tabl
            var myTable = new Element('table', {});
            aux.insert(myTable);
            var body = new Element('tbody', { 'id': '' });
            myTable.insert(body);
            var tR = new Element('tr', { 'id': '', 'class': 'MyTr' });
            body.insert(tR);
            var tD1 = new Element('td', { 'id': '', 'class': 'MyTd', 'style': 'width: 120px' });
            var tD2 = new Element('td', { 'id': '', 'class': 'MyTd' });
            tR.insert(tD1);
            tR.insert(tD2);
            tD1.insert(
					item.separator
						? ''
						: Object.extend(new Element('a', {
						    href: '#',
						    title: item.name, //.truncate(15, ' [...]'),
						    id: item.id,						    
						    className: (item.className || '') + (item.submenu ? ' submenu ' : '') + (item.disabled ? ' disabled' : ' enabled')
						}), { _callback: item.callback })
						.observe('click', this.onClick.bind(this))
						.observe('contextmenu', Event.stop)
						.update(item.name)
			    )
            tD2.insert(item.submenu ? new Element('div', { className: ' application_verticalR_arrow ' }) : '')

            if (item.submenu) {
                aux.observe('mouseover', this.onClick.bind(this))
            }
            else {
                aux.observe('mouseover', this.onMouseOver.bind(this))
            }
            list.insert(aux);
            this.itemsList.push(aux);
            //To control if the item has to be showed
            if(this.options.maximumNumberItemPerLevel){
                if(counter > this.options.maximumNumberItemPerLevel){
                    aux.hide();
                    showArrowDownward = true
                }
            }
        } .bind(this));
        //To draw the arrow to navigate over the menu
        if(showArrowDownward){
            this.insertArrowOnSubmenu(list,"down");//Arrow down
            this.firstItemToShow = 0;
        }
        $(document.body).insert(this.container.insert(list).observe('contextmenu', Event.stop));
        if (this.ie) { $(document.body).insert(this.shim) }

        document.observe('click', this.clickDestroy.bind(this));
        
    },
    clickDestroy: function(e){
        var element = e.srcElement ? e.srcElement : e.target;
        if (this.container.visible() && !e.isRightClick() && !element.className.include("contextMenuArrow")) {
                this.myMultiContextMenu.destroy();              
            }
    },
    
    /*
    * @method show
    * @desc Show the context menui
    * @param e {Event}
    */
    show: function(e) {
        e.stop();
        this.options.beforeShow(e);
        var x = Event.pointer(e).x,
			y = Event.pointer(e).y,
			vpDim = document.viewport.getDimensions(),
			vpOff = document.viewport.getScrollOffsets(),
			elDim = this.container.getDimensions(),
			elOff = {
			    left: ((x + elDim.width + this.options.pageOffset) > vpDim.width
					? (vpDim.width - elDim.width - this.options.pageOffset) : x) + parseInt(this.container.getStyle('width')) + 'px',
			    top: ((y - vpOff.top + elDim.height) > vpDim.height && (y - vpOff.top) > elDim.height
					? (y - elDim.height) : y) - 15 + 'px'
			};
        this.container.setStyle(elOff).setStyle({ zIndex: this.options.zIndex });
        if (this.ie) {
            this.shim.setStyle(Object.extend(Object.extend(elDim, elOff), { zIndex: this.options.zIndex - 1 })).show();
        }
        this.options.fade ? Effect.Appear(this.container, { duration: 0.25 }) : this.container.show();
        this.event = e;
    },
    /*
    * @method showSubMenu
    * @desc Show the context Submenui
    * @param e {Event}
    */
    showSubMenu: function(e) {
        var marginTop = 31;
        this.showMenuAction = true;
        this.options.beforeShow(e);
        //Getting the position to be placed
        if (this.ie && !this.ie9) {
            var marginLeft = 1;
            var x = e.srcElement.cumulativeOffset().left + e.srcElement.up(1).clientWidth - marginLeft;
            x += parseInt(this.container.getStyle('width')) - 10; //lets add the width of the contextmenu less 2px to overlap
            if (x < parseInt(this.container.getStyle('width')))
                x = parseInt(this.container.getStyle('width'));
            //var y = e.srcElement.cumulativeOffset().top + e.offsetY - marginTop,
            var y = e.srcElement.cumulativeOffset().top + e.srcElement.getHeight() - marginTop,
			elOff = {
			    left: x + 'px',
			    top: y + 'px'
			};
        }
        else {
            marginLeft = -20;
            x = e.findElement().cumulativeOffset().left + e.findElement().getWidth() - marginLeft;
            x += parseInt(this.container.getStyle('width')) - 10; //lets add the width of the contextmenu less 2px to overlap
            if (x < parseInt(this.container.getStyle('width')))
                x = parseInt(this.container.getStyle('width'));
            y = e.findElement().cumulativeOffset().top + e.findElement().getHeight() - marginTop,
			elOff = {
			    left: x + 'px',
			    top: y + 'px'
			};
        }
        //Setting the stylee
        this.container.setStyle(elOff).setStyle({ zIndex: this.options.zIndex, position: 'absolute' });
        if(this.myMultiContextMenu.mainMenu.options.additionalClassContainer)
             this.container.addClassName(this.myMultiContextMenu.mainMenu.options.additionalClassContainer);
        //Calling the show effect
        this.options.fade ? Effect.Appear(this.container, { duration: 0.25 }) : this.container.show();
        this.event = e;
        //Observing the click event
        //this._registerEvent(document, 'click', this.checkOutside.bind(this));
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
            if (!e.target.hasClassName('submenu')) {
                if (this.ie) this.shim.hide();
                this.myMultiContextMenu.destroy(); //better to destroy the global father instance
                e.target._callback(this.event);
            }
            else {
                this.myMultiContextMenu.pruneFromLevel(this.myMultiContextMenu.itemLevel(e.target.id));
                e.target._callback(e.target.id, e);
            }
        }
    },
    /*
    * @method onMouseOver
    * @desc This method is performed every time the user move the mouse over an item
    * @param e {Event}
    */
    onMouseOver: function(e) {
        if (!(e.target.id == '')) {
            this.myMultiContextMenu.pruneFromLevel(this.myMultiContextMenu.itemLevel(e.target.id));
        }
    },
    /*
    * @method insertArrowOnSubmenu
    * @desc This method insert the navigation arrows in submenus
    * @param list {list} list of item of submenu
    * @param direction {string} to indicate the direction of the arrow to draw
    */
    insertArrowOnSubmenu: function(list, direction){
        if( direction == "up"){
            //Create the row
            this.arrowUp = new Element('li');
            list.insert(this.arrowUp); 
            //Create the button           
            var json = {
                elements:[],
                defaultButtonClassName:'classOfMainDiv'};
            var upArrow =   {
                label: "",
                idButton: "arrowUpContextLeftMenu",
                className:'application_up_arrow contextMenuArrow',
                handlerContext: "",
                handler: this.navigateUpward.bind(this),
                type: 'button',
                toolTip: ""
            };                 
            json.elements.push(upArrow); 
            var upButton = new megaButtonDisplayer(json);
            var divbut = upButton.getButtons();
            this.arrowUp.insert(divbut);
            //To set the events
            this.arrowUp.observe('mouseover', this.onMouseActionArrowUpward.bind(this));
            this.arrowUp.observe('mouseout', this.onMouseOutArrow.bind(this,"up"));
            //When it is inserted has to be hiden because in the init always is shown the firt item.
            this.arrowUp.hide();
        }
        if( direction == "down"){
            //Create the row
            this.arrowDown = new Element('li');
            list.insert(this.arrowDown); 
            //Create the button           
            var json = {
                elements:[],
                defaultButtonClassName:'classOfMainDiv'};
            var downArrow =   {
                label: "",
                idButton: "arrowDownContextLeftMenu",
                className:'application_down_arrow contextMenuArrow',
                handlerContext: "",
                handler: this.navigateDownward.bind(this),
                type: 'button',
                toolTip: ""
            };                 
            json.elements.push(downArrow); 
            var downButton = new megaButtonDisplayer(json);
            var divbut = downButton.getButtons();
            this.arrowDown.insert(divbut);
            //To set the events
            this.arrowDown.observe('mouseover', this.onMouseActionArrowDownward.bind(this));
            this.arrowDown.observe('mouseout', this.onMouseOutArrow.bind(this,"down"));
        }
    },
    /*
    * @method onMouseOverArrowDownward
    * @desc This method is performed every time the user move the mouse over an arrow downward, and start a periodical action to move by the menu
    * @param e {Event}
    */
    onMouseActionArrowDownward:function(e){
        this.arrowDown.addClassName("contextMenuGray");
        this.periodicalDown = new PeriodicalExecuter(this.navigateDownward.bind(this), 0.5);
    },
    /*
    * @method onMouseActionArrowUpward
    * @desc This method is performed every time the user move the mouse over an arrow downward, and start a periodical action to move by the menu
    * @param e {Event}
    */
    onMouseActionArrowUpward:function(e){
        this.arrowUp.addClassName("contextMenuGray");
        this.periodicalUp = new PeriodicalExecuter(this.navigateUpward.bind(this), 0.5);
    },
    /*
    * @method navigateDownward
    * @desc Method to move downward the menu one position
    */
    navigateDownward:function(){
        var itemToShow = parseInt(this.firstItemToShow,10) + parseInt(this.options.maximumNumberItemPerLevel,10);
        if(itemToShow < this.options.menuItems.length){
            this.itemsList[this.firstItemToShow].hide();
            this.itemsList[itemToShow].show();
            this.firstItemToShow++;
            this.arrowUp.show();
            if(itemToShow == this.options.menuItems.length - 1)
                this.arrowDown.hide();
        }
        else{
            this.arrowDown.hide();
        }
    },
    /*
    * @method navigateUpward
    * @desc Method to move upward the menu one position
    */
    navigateUpward:function(e){
        if(this.firstItemToShow > 0){
            this.itemsList[parseInt(this.firstItemToShow,10) + parseInt(this.options.maximumNumberItemPerLevel,10)- 1 ].hide();
            this.firstItemToShow--;
            this.itemsList[this.firstItemToShow].show();
            this.arrowDown.show();
        }
        if( this.firstItemToShow == 0){
            this.arrowUp.hide();
        }
    },
    /*
    * @method onMouseOutArrow
    * @desc Method to stop the periodical action of the moving of arrows
    */
    onMouseOutArrow:function(direction){
        if(direction == "down"){
            this.periodicalDown.stop();
            this.arrowDown.removeClassName("contextMenuGray");
        }
        if(direction == "up"){
            this.periodicalUp.stop();
            this.arrowUp.removeClassName("contextMenuGray");
        }
    },
    /*
    * @method destroy
    * @desc This method is performed every time the user want to destroy an item block
    */
    destroy: function() {
        if (this.ie) this.shim.hide();
        this.container.hide();
        this.container.remove();
    }
});
/**
*@type multiContextMenu
*@description Object for showing a multi context menu
*/
var mContextMenu = new multiContextMenu();