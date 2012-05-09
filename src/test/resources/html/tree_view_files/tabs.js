/*
 *@fileoverview tabs.js
 *@desc tab handler class implemented here, a component to manage a number of different
 *contents using tabs.
 */

/*
 *@class Tabs
 *@desc this class represents the tab handler
 */
var Tabs = Class.create({
    /*
    *@method initialize
    *@param options {Hash} keeps the whole options we need to create the tab handler:
    *ids,callback function, target, labels, active tab, mode and total width.
    *@desc creates every div part of the tab handler, with the proper attributes
    */
    initialize: function(options){            
        //GETTING THE OPTIONS TO BUILD THE TAB HANDLER
        //Max width for the tabs in normal mode
        this.MAX_WIDTH_NORMAL_MODE = 735,
        /*
         *@name ids
         *@type String 
         *@desc the id of the tab (not the label) 
         */ 
         this.ids = options.get('ids');
         /*
         *@name active
         *@type Long 
         *@desc the first active tab
         */
        this.active = options.get('active');
        if(!this.active ||!Object.isNumber(this.active))this.active = 0;
        /*
         *@name callback
         *@type function 
         *@desc if defined, it is the function that is executed when the tab is clicked
         */ 
        //Here it is defined a default callback function
        this.callback = function() {}
        if(options.get('callback')){
            var callbackDefined = true;
            this.callback = options.get('callback'); 
        }       
        /*
         *@name target
         *@type String 
         *@desc the html element id where we have to set the tab handler 
         */     
        this.target = options.get('target');
        /*
         *@name labels
         *@type Array 
         *@desc labels array used to identify every tab, every field of this array is set as the 
         *related tab title
         */
        this.labels = options.get('labels'); 
        /*
        *@name events
        *@type hash 
        *@desc hash with the events id
        */
        this.events = options.get('events');        
        /*
        *@name callbacks
        *@type hash 
        *@desc hash with the events id
        */
        this.callbacks = options.get('callbacks');
        /*
         *@name mode
         *@type String
         *@desc the way we have to create the tab handler(setting the default 
         *width in the framework, or being able to choose the width)
         */
        this.mode = options.get('mode');
        if(!this.mode||(this.mode!='normal'&&this.mode!='max'))this.mode = 'normal';
        /*
         *@name firstRun
         *@type String
         *@desc with this parameter is defined if the callback function is executed for the default active tab 
         */
        var firstRun = false;
        this.firstRun = options.get('firstRun');
        if(this.firstRun == 'y' || this.firstRun == 'Y' || this.firstRun == 'yes' || this.firstRun == 'YES') {
            firstRun = true;
        }
        /*
         *@name total_width
         *@type Long 
         *@desc in 'max' mode represents the width to be set, in 'normal' mode it is not used
         */
        this.total_width = options.get('width');
        //default width
        if(!this.total_width||!Object.isNumber(this.total_width))this.total_width = screen.width/2;                  
        //CREATING ADDITIONAL PARAMETERS  
        /*
         *@name number
         *@type Long 
         *@desc it calculates the number of tabs to create
         */  
        if(this.labels){      
            this.number = this.labels.length;
        }else{
            // default configuration for labels, only if there are not labels defined.
            this.labels = ['1','2','3','4'];
            this.number = 4;
        }
        /*
         *@name tabs_array
         *@type Array 
         *@desc to keep here all the tab elements we´re going to create
         */     
        this.tabs_array = [];
      
        //CHECKING OPTIONS
        if(($(this.target)) && this.number > 0 && this.active >= 0 && this.active <= this.number){
            //WE HAVE TWO MODES, THE NORMAL MODE: THE MAIN DIV ALWAYS HAVE THE SAME WIDTH,
            //IN FACT THE SAME WIDTH AS THE APPLICATIONS CONTAINER, ONLY CAN SET THE NUMBER
            //OF TABS.
            //THE MAX MODE: YOU CAN SET THE WIDTH AND THE NUMBER OF TABS
            if(this.mode == 'normal'){
              var fontSize = 0;
              //GETTING THE PROPER width FOR THE DIVS IN NORMAL MODE
              var maxLength = 0;
              var labelLength;
              for (var i = 0; i < this.labels.length ; i++){
                 if(Object.isString(this.labels[i])){   // defined letter
                    labelLength = this.labels[i].stripTags().replace('.','').replace(' ','').length;    //for calculating the width, '.' and ' '
                 }else{                                                                 //make the tab too long
                    labelLength = 9; // undefined (9 letters)
                 }   
                 if(labelLength > maxLength)maxLength = labelLength;
             }
             //this condition affects only to chars out of unicode range (ie. Asian Languages)
             if (this.labels[0].charCodeAt(0) < 33 || this.labels[0].charCodeAt(0) > 126) {
                 fontSize += 5;
             }           
              var cssRuleTabs;
              var cssRule;
              fontSize += 12;    //default value, in case of .tabs_title_active property not defined in CSS2.css
                /*
                //Part of the code removed because it was really slow, it is better to hardcode the font size
              if (document.all){    //IE
                var cssRule = document.styleSheets[0].rules;
              }else{    //FIREFOX
                var cssRule = document.styleSheets[0].cssRules;
              }  
              for (i=0; cssRuleTabs=cssRule[i]; i++){
                if (cssRuleTabs.selectorText.toLowerCase() == '.tabs_title_active') {
                    fontSize = cssRuleTabs.style.fontSize.substr(0,cssRuleTabs.style.fontSize.length - 2);
                break;
                }
                }*/
                this.container_width = parseInt((fontSize - 5) * maxLength);
                if (global.liteVersion) {
                    this.total_width = this.container_width * this.number;
                    this.center_width = this.container_width;
                } else {
                    this.container_width += 10;   //beginning and ending of the tab
              this.total_width = this.container_width * this.number;
                    this.center_width = this.container_width;
                }
              this.out = 0;       
            }else if(this.mode == 'max'){
              //GETTING THE PROPER width FOR THE DIVS IN MAX MODE
              this.container_width = parseInt(this.total_width/this.number);
                this.center_width = this.container_width;
              this.out =(this.total_width)-(this.container_width*this.number); 
            }
        }
        else{ alert('Tabs Options invalid'); return;}             
        
        //it is defined the event for changing the tabs interface
        this.obj = {
              fx: function(event) {
                  this.throwEventClicked(event.element().identify());
              }.bind(this)       
        };
        this.obj.bfx = this.obj.fx.bindAsEventListener(this.obj);
        //INITIALIZING OF EVENTS 
		
        document.observe('EWS:selectTab', function(event) {
            var args = getArgs(event);
            var tar = args.target;
            var num = args.number;
            if (this.target == tar) {
                this.currentSelected = num;
                this.openTab('num_' + num);
            }
        }.bindAsEventListener(this));          
        
        //*************************************************************************
        //TOTAL DIV INIT
        //*************************************************************************
        var aux_size; 
        /*
         *@name total
         *@type DispHTMLDivElement
         *@desc the main div, that contains the whole tabs handler
         */        
        this.total = new Element('div',{className: ''});
        if(this.mode == 'max'){
            aux_size = this.total_width + 'px';
            this.total.setStyle({width:aux_size});
        }    
        //*************************************************************************
        //TABS DIVS INIT
        //*************************************************************************
        var tabs_id = this.target + 'all_tabs';   
        /*
         *@name tabs
         *@type DispHTMLDivElement 
         *@desc the div that keeps all the tab div elements
         */        
        this.tabs = new Element('div',{id:tabs_id, className:'tabs_tabs'});
        if(this.mode == 'max'){
            aux_size = this.total_width + 'px';
            this.tabs.setStyle({width:aux_size});
        }                  
        this.menuTabsItems = [];
        this.lastTabShown = -1;
        for(var iter = 1; iter <= this.number; iter++){
            var id_aux = this.target + 'num_' + iter;
            var tab = new Element('div', { id: id_aux, className: 'tabs_tabs_container test_tabs' });
            this.tabs_array.push(tab);
            var itIsActive = (iter == this.active)?'_active':'';
            var itIsHash = this.chooseInterface(iter, this.number, this.active);
            var itIsActiveLeft = itIsHash.get('left');
            var itIsActiveRight = itIsHash.get('right');
            var title = "";
            if (global.liteVersion) {
                //TODO add label for Tabs
                title = "Tabs (" + iter + "/" + (this.number) + "): " + options.get('mainAppName') + " - " + options.get('subAppName') + " - " + this.labels[iter - 1];
            }
            var middleButton = new Element("button", {
                "id": "el2_" + iter,
                "title": title,
                "class": "link tabs_tabs_content_center" + itIsActive + " tabs_title" + itIsActive
            });
            middleButton.innerHTML = this.labels[iter - 1];
            this.tabs_array[iter - 1].insert(middleButton);
            var out_var = (iter == this.number)?this.out:0;
            aux_size = this.getContainerWidth(out_var);
            this.tabs_array[iter - 1].setStyle({ width: aux_size + 'px' });
            if (aux_size * iter < this.MAX_WIDTH_NORMAL_MODE) {
                this.lastTabShown = iter;
            }else{
                var tabId = this.tabs_array[iter-1].id; 
                this.tabs_array[iter-1].hide();//hiding tabs after the third
                this.menuTabsItems.push({ name: this.labels[iter - 1], callback: this.swapTabs.bind(this, iter), title: title });
                var showContextMenu = true;
            }    
            this.tabs_array[iter - 1].down().setStyle({ width: aux_size + 'px' });
            this.tabs_array[iter - 1].down().observe('click', this.obj.bfx);
            this.tabs.insert(this.tabs_array[iter-1]);
        }   
               
        //*************************************************************************
        //INSERT THE REST OF THE DIVS INTO THE MAIN ONE  
        this.total.insert(this.tabs);
        //AND THIS INTO THE STATIC DIV IN THE DOCUMENT
        $(this.target).update(this.total);
        //*************************************************************************
        if(showContextMenu){
			var moreButtonTitle = "";
            if (global.liteVersion) {
                //TODO use label for "show more tabs"
                moreButtonTitle = "Show more tabs (" + (this.number - this.lastTabShown) + ")";
            }
			this.moreIcon = new Element("button", {
				"id": this.target + "_moreIcon",
                "class": "link application_MoreTabs test_tabs",
				"title": moreButtonTitle
			});
			this.moreIcon.insert(new Element("div", { "class": "tabs_moreText" }).insert(global.getLabel("more") + "..."));
			this.moreIcon.insert(new Element("span", { "class": "tabs_moreIcon" }).insert("\u25bc"));
			this.total.insert(this.moreIcon);
            this.menuTabs = new Proto.Menu({
                menuItems: this.menuTabsItems,
				className: "contextMenu tabs_contextMenu"
            }) 
            this.moreIcon.observe('click', function(evt) { this.menuTabs.show(evt); } .bind(this));
        }    
        //if it is defined by the programmer, it is executed the code related to the active tab on initialization
        if(firstRun){
            if (this.callbacks && this.callbacks.get('onTabClicked')){
                this.callbacks.get('onTabClicked').curry(this.ids[this.active - 1]).call();
			}
		}	    
    },
    getContainerWidth: function(out_var) {
        //Check the length of all the tabs
        var totalLength = (this.center_width + out_var) * this.number;
        //check if we have space for all the tabs or we need the more button
        if (totalLength > this.MAX_WIDTH_NORMAL_MODE) {
            //Get the space counting the button more...
            var totalSpace = this.MAX_WIDTH_NORMAL_MODE - 80;
            //Get the number of tabs that we'll have
            var totalTabs = (totalSpace / this.center_width).floor();
            //divide the space between the tabs
            var newWidth = totalSpace / totalTabs;
            return (newWidth - 1);
        }
        else {
            //We check the space at the end without the button more...
            var spaceEnd = this.MAX_WIDTH_NORMAL_MODE - totalLength;
            if (spaceEnd > 80) { //we have a big space so we leave the normal width
                return (this.container_width + out_var);
            }
            else { //we have a small space so we put a bit more for each tab
                //split the pixeles bettwen the tabs
                var extraPixels = spaceEnd / this.number;
                return (this.container_width + out_var + extraPixels);
            }
        }
    },
    swapTabs: function(clickedIndex){
        if (!Object.isEmpty(global.currentApplication) && global.popUpBeforeClose.include(global.currentApplication.view)) {
            var callBack1 = function () {
                global.cancelPCRPopUp.close();
                delete global.cancelPCRPopUp;
                $(this.tabs_array[this.lastTabShown - 1].id).hide();
                this.menuTabsItems.push({ name: this.labels[this.lastTabShown - 1], callback: this.swapTabs.bind(this, this.lastTabShown) });
                this.lastTabShown = clickedIndex;
                $(this.tabs_array[clickedIndex - 1].id).show();
                for (var i = 0; i < this.menuTabsItems.length; i++) {
                    var item = this.menuTabsItems[i];
                    if (item.name == this.labels[this.lastTabShown - 1]) {
                        this.menuTabsItems[this.menuTabsItems.indexOf(item)] = this.menuTabsItems[this.menuTabsItems.length - 1];
                        delete this.menuTabsItems[this.menuTabsItems.length - 1];
                        this.menuTabsItems.length--;
                    }
                }
                this.callbacks.get('onTabClicked').curry(this.ids[clickedIndex - 1]).call();
                this.menuTabs = new Proto.Menu({
                    menuItems: this.menuTabsItems,
                    className: "contextMenu tabs_contextMenu"
                })
                this.moreIcon.stopObserving('click');
                this.moreIcon.observe('click', function (evt) { this.menuTabs.show(evt); } .bind(this));
            } .bind(this);
            global.createPopUpBeforeClose(callBack1);
        }
        else {
            var tabToHide = this.tabs_array[this.lastTabShown - 1];
            var tabToShow = this.tabs_array[clickedIndex - 1];
            var titleHiddenTab = "";
            if (global.liteVersion) {
                titleHiddenTab = tabToHide.down("button").title;
                var titleShownTab = tabToShow.down("button").title;
                //Search for (X/Y)
                var numberGuideHidden = titleHiddenTab.match(/\(\d+\/\d+\)/)[0];
                var numberGuideShown = titleShownTab.match(/\(\d+\/\d+\)/)[0];
                titleHiddenTab = titleHiddenTab.gsub(numberGuideHidden, numberGuideShown);
                titleShownTab = titleShownTab.gsub(numberGuideShown, numberGuideHidden);
                tabToShow.down("button").writeAttribute("title", titleShownTab);
                tabToHide.down("button").writeAttribute("title", titleHiddenTab);
            }
            tabToHide.hide();
            this.menuTabsItems.push({ name: this.labels[this.lastTabShown - 1], callback: this.swapTabs.bind(this, this.lastTabShown), title: titleHiddenTab });
            this.lastTabShown = clickedIndex;

            tabToShow.show();
            for (var i = 0; i < this.menuTabsItems.length; i++) {
                var item = this.menuTabsItems[i];
                if (item.name == this.labels[this.lastTabShown - 1]) {
                    this.menuTabsItems[this.menuTabsItems.indexOf(item)] = this.menuTabsItems[this.menuTabsItems.length - 1];
                    delete this.menuTabsItems[this.menuTabsItems.length - 1];
                    this.menuTabsItems.length--;
                }
            }
            this.callbacks.get('onTabClicked').curry(this.ids[clickedIndex - 1]).call();
            this.menuTabs = new Proto.Menu({
                menuItems: this.menuTabsItems,
                className: "contextMenu tabs_contextMenu"
            })
            this.moreIcon.stopObserving('click');
            this.moreIcon.observe('click', function(evt) { this.menuTabs.show(evt); } .bind(this));
        }

    },
    goTo: function(tabName){
        var index;
        var label = "";
        var inContextMenu = false;
        //Changes 28/01/11 Aanguita Opened different views in the same tab. (Before just the default)
        // We have to find the tab name:
        //      Before: the array was unidimensional (just one application for each tab). 
        //      Now: the array is bidimensional (several application can be opened for each tab)
        for(var i=0;i<this.ids.length;i++){
            for( var j=0; j < this.ids[i].length; j++){
                if( typeof this.ids[i] != "string")
                    var auxId = this.ids[i][j];
                else
                    var auxId = this.ids[i];
                if (auxId == tabName) {
                label = this.labels[i];
                index= i+1;
            }    
        }
        }
        //-----------
        this.menuTabsItems.each(function(tab){
            if(!Object.isEmpty(index) && tab.name && tab.name == label){
                this.swapTabs(index);
                inContextMenu = true;
            }
        }.bind(this));
        //if(!inContextMenu)
        //    document.fire(this.events.get('onTabClicked'),tabName);
    },
	destroy: function() {
		this.tabs_array.each(function(tab) {
			tab.stopObserving('click',this.obj.bfx);
			if(!Object.isEmpty(tab.parentNode))
				tab.remove();
		}.bind(this));
	},
    chooseInterface: function(iter, number, active){//the active tab has different css properties than others
    
        var itIsActiveLeft = '';
        var itIsActiveRight = '';
            if(number == 1){
               itIsActiveLeft = '_initial_s';
               itIsActiveRight = '_final_s';
            }else if(iter == active){//if it is the ACTIVE
                    if(iter == number){
                        itIsActiveLeft = '_d_s';
                        itIsActiveRight = '_final_s';
                    }else if(iter == 1){
                        itIsActiveLeft = '_initial_s';
                        itIsActiveRight = '_s_d';
                    }else{
                        itIsActiveLeft = '_d_s';
                        itIsActiveRight = '_s_d';
                    }
            }else{//if it is INACTIVE
                if(iter == 1){
                    itIsActiveLeft = '_initial_d';
                    if(active == (iter + 1)){
                        itIsActiveRight = '_d_s';
                    }else{
                        itIsActiveRight = '_d_d';
                    }
                }else if( iter == number){
                    itIsActiveRight = '_final_d';
                    if(active == (iter - 1)){
                        itIsActiveLeft = '_s_d';
                    }else{
                        itIsActiveLeft = '_d_d';
                    }
                }else{
                    if(active == (iter - 1)){
                        itIsActiveLeft = '_s_d';
                        itIsActiveRight = '_d_d';
                    }else if(active == (iter + 1)){
                        itIsActiveLeft = '_d_d';
                        itIsActiveRight = '_d_s';
                    }else{
                        itIsActiveLeft = '_d_d';
                        itIsActiveRight = '_d_d';
                    }
                }
            }
        return $H({left:itIsActiveLeft,right:itIsActiveRight});
    },
    openTab: function(tab){
         var throwEvent = false;  
         this.manageTabs(tab,throwEvent);
    },

    /*
     *@method manageTabs
     *@param args {String} the tab we have clicked, throwEvent (boolean) and callbackDefined (if we execute the callback or not)
     *@desc handle the tab_cliked event, changing the tabs css properties to set the active and the inactive ones
     */
    manageTabs: function(args,throwEvent, callbackDefined){
       if(typeof args == "string")
       var index = args.gsub(args.truncate(args.indexOf('_')+1,''),'');
	   if(index == "undefined")
			return;
       var tar = this.target;
       var v = $(tar+'all_tabs').childElements();
         //Changes 28/01/11 Aanguita Opened different views in the same tab. (Before just the default)
       for ( var iter = 0; iter<v.length; iter++){
            if(typeof this.ids[iter] != "string"){
                for( var i = 0; i< this.ids[iter].length; i++){
                    if (this.ids[iter][i] == args) index = iter + 1;
                }
            }
            else{
        if (this.ids[iter] == args) index = iter+1;
       }
        }
        //----------------
       this.currentSelected = index-1;
        for (var iter = 0; iter < v.length; iter++) {
            var itIsActive = ((iter +1) == index)?'_active':'';
            var itIsHash = this.chooseInterface(iter +1, this.number, index);
            var itIsActiveLeft = itIsHash.get('left');
            var itIsActiveRight = itIsHash.get('right');
            var aux_array = $A(v[iter].childElements());
            aux_array[0].className = ((global.liteVersion) ? 'link ' : 'link ') + 'tabs_title' + itIsActive + ' tabs_tabs_content_center' + itIsActive; ;
            if((iter+1) == index){
                aux_array[0].stopObserving('click', this.obj.bfx);
                aux_array[0].setStyle({ cursor: 'default' });
                this.goTo(args);
            }else{
                aux_array[0].observe('click', this.obj.bfx);
                aux_array[0].setStyle({ cursor: 'pointer' });
            }       
       }
        this.callback(args,this);
       //Throwing the event openApplication if callback is not defined
       if(throwEvent && !callbackDefined){
            document.fire('EWS:openApplication',$H({app:args}));
       }
                 
    },

    /*
     *@method throwEventClicked
     *@param id {String} the element id inside the tab has been clicked
     *@desc throws the event indicating one tab has been clicked
     */
    throwEventClicked: function (id) {
        if (!Object.isEmpty(global.currentApplication) && global.popUpBeforeClose.include(global.currentApplication.view)) {
            //global.popUpBeforeClose.include(global.currentApplication.view)  
            //create buttons
            var callBack1 = function () {
                global.cancelPCRPopUp.close();
                delete global.cancelPCRPopUp;
                var aux = id.gsub(id.truncate(id.indexOf('_') + 1, ''), '');
                var tar = this.target;
                if (this.callbacks && this.callbacks.get('onTabClicked'))
                    this.callbacks.get('onTabClicked').curry(this.ids[aux - 1]).call();
            } .bind(this);
            global.createPopUpBeforeClose(callBack1);
        }
        else {
            var aux = id.gsub(id.truncate(id.indexOf('_') + 1, ''), '');
            var tar = this.target;
            if (this.callbacks && this.callbacks.get('onTabClicked'))
                this.callbacks.get('onTabClicked').curry(this.ids[aux - 1]).call();
        }
    }
});




