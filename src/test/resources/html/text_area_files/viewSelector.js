/*
 * @class viewSelector
 * @desc This class takes view, and creates a panel with its button.
 */
var viewSelector = Class.create({
    /*
    * @name icons
    * @type Array
    * @desc List of icons;
    */
    icons: $H(),
    /*
    * @name iconsPushed
    * @type Array
    * @desc List of icons used for pushed buttons;
    */
    icons_pushed: $H(),
    /*
    * @name buttonsHTML
    * @type Hash
    */
    buttonsHTML: $H(),
   /*
    * @name items
    * @type int
    * @param container {String} The div which contain the accordion divs
    * @param options {JSON} The accordion options
    */
    numberItems: 0,
    /*
    * @method loadIcons
    * @desc Load the predefined icons
    */
    loadIcons: function(){
    //Non-pushed button
        //CoverFlow
        this.icons.set("coverflow_center", "PM_viewCoverflowCenter");
        this.icons.set("coverflow_left", "PM_viewCoverflowLeft");
        this.icons.set("coverflow_right", "PM_viewCoverflowRight");
        //9 Box
        this.icons.set("9box_center", "PM_view9BoxCenter");
        this.icons.set("9box_left", "PM_view9BoxLeft");
        this.icons.set("9box_right", "PM_view9BoxRight");
        //Profiler
        this.icons.set("profiler_center", "PM_viewProfilerCenter");
        this.icons.set("profiler_left", "PM_viewProfilerLeft");
        this.icons.set("profiler_right", "PM_viewProfilerRight");
        //Calibration
        this.icons.set("calibration_center", "PM_viewCalibrationCenter");
        this.icons.set("calibration_left", "PM_viewCalibrationLeft");
        this.icons.set("calibration_right", "PM_viewCalibrationRight");
        //Calendar
        this.icons.set("calendar_center", "PM_viewCalendarCenter");
        this.icons.set("calendar_left", "PM_viewCalendarLeft");
        this.icons.set("calendar_right", "PM_viewCalendarRight");
        //Gantt
        this.icons.set("gantt_center", "PM_viewGanttCenter");
        this.icons.set("gantt_left", "PM_viewGanttLeft");
        this.icons.set("gantt_right", "PM_viewGanttRight");
        //Tree
        this.icons.set("tree_center", "PM_viewTreeCenter");
        this.icons.set("tree_left", "PM_viewTreeLeft");
        this.icons.set("tree_right", "PM_viewTreeRight");
        //TeamRoster
        this.icons.set("teamroster_center", "PM_viewTeamRosterCenter");
        this.icons.set("teamroster_left", "PM_viewTeamRosterLeft");
        this.icons.set("teamroster_right", "PM_viewTeamRosterRight");
        //Thumbnails
        this.icons.set("thumbnails_center", "PM_viewThumbnailsCenter");
        this.icons.set("thumbnails_left", "PM_viewThumbnailsLeft");
        this.icons.set("thumbnails_right", "PM_viewThumbnailsRight");
        //list
        this.icons.set("list_center", "PM_viewListCenter");
        this.icons.set("list_left", "PM_viewListLeft");
        this.icons.set("list_right", "PM_viewListRight");
		//TreeList
        this.icons.set("treelist_center", "PM_viewTreeListCenter");
        this.icons.set("treelist_left", "PM_viewTreeListLeft");
        this.icons.set("treelist_right", "PM_viewTreeListRight");
        //FlowChart
        this.icons.set("flowchart_center", "PM_viewFlowChartCenter");
        this.icons.set("flowchart_left", "PM_viewFlowChartLeft");
        this.icons.set("flowchart_right", "PM_viewFlowChartRight");
        //Search
        this.icons.set("search_center", "PM_searchCenter");
        this.icons.set("search_left", "PM_searchLeft");
        this.icons.set("search_right", "PM_searchRight");
   
   //Pushed button
        //CoverFlow
        this.icons_pushed.set("coverflow_center", "PM_viewCoverflowCenterSelected");
        this.icons_pushed.set("coverflow_left", "PM_viewCoverflowLeftSelected");
        this.icons_pushed.set("coverflow_right", "PM_viewCoverflowRightSelected");
        //9 Box
        this.icons_pushed.set("9box_center", "PM_view9BoxCenterSelected");
        this.icons_pushed.set("9box_left", "PM_view9BoxLeftSelected");
        this.icons_pushed.set("9box_right", "PM_view9BoxRightSelected");
        //Profiler
        this.icons_pushed.set("profiler_center", "PM_viewProfilerCenterSelected");
        this.icons_pushed.set("profiler_left", "PM_viewProfilerLeftSelected");
        this.icons_pushed.set("profiler_right", "PM_viewProfilerRightSelected");
        //Calibration
        this.icons_pushed.set("calibration_center", "PM_viewCalibrationCenterSelected");
        this.icons_pushed.set("calibration_left", "PM_viewCalibrationLeftSelected");
        this.icons_pushed.set("calibration_right", "PM_viewCalibrationRightSelected");
        //Calendar
        this.icons_pushed.set("calendar_center", "PM_viewCalendarCenterSelected");
        this.icons_pushed.set("calendar_left", "PM_viewCalendarLeftSelected");
        this.icons_pushed.set("calendar_right", "PM_viewCalendarRightSelected");
        //Gantt
        this.icons_pushed.set("gantt_center", "PM_viewGanttCenterSelected");
        this.icons_pushed.set("gantt_left", "PM_viewGanttLeftSelected");
        this.icons_pushed.set("gantt_right", "PM_viewGanttRightSelected");
        //Tree
        this.icons_pushed.set("tree_center", "PM_viewTreeCenterSelected");
        this.icons_pushed.set("tree_left", "PM_viewTreeLeftSelected");
        this.icons_pushed.set("tree_right", "PM_viewTreeRightSelected");
        //TeamRoster
        this.icons_pushed.set("teamroster_center", "PM_viewTeamRosterCenterSelected");
        this.icons_pushed.set("teamroster_left", "PM_viewTeamRosterLeftSelected");
        this.icons_pushed.set("teamroster_right", "PM_viewTeamRosterRightSelected");
        //Thumbnails
        this.icons_pushed.set("thumbnails_center", "PM_viewThumbnailsCenterSelected");
        this.icons_pushed.set("thumbnails_left", "PM_viewThumbnailsLeftSelected");
        this.icons_pushed.set("thumbnails_right", "PM_viewThumbnailsRightSelected");
        //list
        this.icons_pushed.set("list_center", "PM_viewListCenterSelected");
        this.icons_pushed.set("list_left", "PM_viewListLeftSelected");
        this.icons_pushed.set("list_right", "PM_viewListRightSelected");
		//TreeList
        this.icons_pushed.set("treelist_center", "PM_viewTreeListCenterSelected");
        this.icons_pushed.set("treelist_left", "PM_viewTreeListLeftSelected");
        this.icons_pushed.set("treelist_right", "PM_viewTreeListRightSelected");
        //FlowChart
        this.icons_pushed.set("flowchart_center", "PM_viewFlowChartCenterSelected");
        this.icons_pushed.set("flowchart_left", "PM_viewFlowChartLeftSelected");
        this.icons_pushed.set("flowchart_right", "PM_viewFlowChartRightSelected");
        //Search
        this.icons_pushed.set("search_center", "PM_searchCenterSelected");
        this.icons_pushed.set("search_left", "PM_searchLeftSelected");
        this.icons_pushed.set("search_right", "PM_searchRightSelected");
    }, 
    /*
    * @method initialize
    * @desc Creates the viewSelector, and adds the events for the buttons.
    * @param container {String} The div which contain the accordion divs
    * @param options {JSON} The accordion options
    */
    initialize: function(options, iconsList, iconsListPushed) {
        if (Object.isEmpty(iconsList) || Object.isEmpty(iconsListPushed))
            this.loadIcons();
        else{
            this.icons = iconsList;
            this.icons_pushed = iconsListPushed;
            }
        this.numberItems = options.length;
        this.mainDiv = new Element ('div');
        this.mainDiv.addClassName('viewSelector_mainDiv');
        this.mainDiv.addClassName ('inlineContainer');
        this.createrButtons(options);
    },
    /*
    * @method createrButtons
    * @desc Creates the buttons indicated in the parameter.
    */
    createrButtons: function(options){
    
    //Creating the data
    this.json = {
        elements:[],
        defaultButtonClassName:'viewSelector_mainDiv'
    };
    for ( var i= 0; i < this.numberItems; i++){
        //
        if( i == 0){
            //First button
            var button = {
                idButton : options[i].name + "_left",
                handler: options[i].handle_button,
                className: 'inlineElement viewSelector_leftElement',
                selected: options[i].selected,
                position : i,
                    toolTip: options[i].toolTip,
                    labelLiteVersion: options[i].liteVersion
                }
        }
        else{
            //Medium buttons
            if( i == this.numberItems -1 ){
                var button = {
                idButton : options[i].name + "_right",
                handler: options[i].handle_button,
                className: 'inlineElement viewSelector_rightElement',
                selected: options[i].selected,
                position : i,
                        toolTip: options[i].toolTip,
                        labelLiteVersion: options[i].liteVersion
                }
            }
            //Last button
            else{
                var button = {
                idButton : options[i].name + "_center",
                handler: options[i].handle_button,
                className: 'inlineElement viewSelector_centerElement ',
                selected: options[i].selected,
                position : i,
                        toolTip: options[i].toolTip,
                        labelLiteVersion: options[i].liteVersion
                }
            }
        }
        this.json.elements.push(button);
        };
    //We keep the initial state of each button (without any selection)
        //this.jsonInit = deepCopy(this.json);
    //We assign the appropiate icon to each button.
    this.setIcons();
        this.buttonsHTML = $H();
    //Creating the div
    for ( var i= 0; i < this.numberItems; i++){
            //Creating mega button
            var jsonHtml = { elements: [] };
            var buttonSelector = {
                label: global.liteVersion ? '|' + this.json.elements[i].labelLiteVersion + '|' : '',
                idButton: this.json.elements[i].idButton ? this.json.elements[i].idButton : '',
                handler: this.handleButton.bind(this, this.json.elements[i]),
                className: this.json.elements[i].className,
                type: global.liteVersion ? 'link' : 'button',
                standardButton: false,
                toolTip: this.json.elements[i].toolTip ? this.json.elements[i].toolTip : ''
            };
            jsonHtml.elements.push(buttonSelector);
            var buttonDisplayerHtml = new megaButtonDisplayer(jsonHtml);
            var buttonHtml = buttonDisplayerHtml.getButtons()
            this.mainDiv.insert(buttonHtml);
        //We keep the buttons inserted, so that change its class after.
            this.buttonsHTML.set(this.json.elements[i].position, global.liteVersion ? buttonHtml.down("button") : buttonHtml.down("input"));
        };
    },
    /*
    * @method setIcons
    * @desc Set the icons appropiate to each button
    */
    setIcons: function(){
        if (!global.liteVersion) {
        var selected = 0;
            for (var i = 0; i < this.numberItems; i++) {
            var classNameIcon = this.icons.get(this.json.elements[i].idButton);
            if(!Object.isEmpty(classNameIcon)){
                if( this.json.elements[i].selected ){
                    if (selected < 1){
                        this.json.elements[i].className = this.json.elements[i].className + " " + this.icons_pushed.get(this.json.elements[i].idButton);
                        selected++;
                    }
                    else{
                        this.json.elements[i].selected = false; 
                        this.json.elements[i].className = this.json.elements[i].className + " " + this.icons.get(this.json.elements[i].idButton);
                    }
                }    
                else
                    this.json.elements[i].className = this.json.elements[i].className + " " + this.icons.get(this.json.elements[i].idButton);
            }
            //If we want to configure a default value, we can apply here.
            }
        }
        else {
            var selected = 0;
            for (var i = 0; i < this.numberItems; i++) {
                var classNameIcon = this.icons.get(this.json.elements[i].idButton);
                if (!Object.isEmpty(classNameIcon)) {
                    if (this.json.elements[i].selected) {
                        if (selected < 1) {
                            this.json.elements[i].className = 'viewSelector_pushedLink';
                            selected++;
                        }
                        else {
                            this.json.elements[i].selected = false;
                            this.json.elements[i].className = 'viewSelector_link';
                        }
                    }
                    else {
                        this.json.elements[i].className = 'viewSelector_link';
                    }
                } 
            }
        }
    },
    /*
    * @method createrHTML
    * @desc Creates the viewSelector, and adds the events for the buttons.
    * @param container {String} The div which contain the accordion divs
    * @param options {JSON} The accordion options
    */
    createrHTML: function(){
        return this.mainDiv ;
    },
    /*
    * @method handleButton
    * @desc The function handles the selected button, and invokes the real function of the button
    */
    handleButton: function(button){
        
        //1.UnSelects the previous selected button
        //2. Changes the icon of the previous selected button
        var find = false
        for( var i=0; i < this.numberItems && !find ; i++){
            if( this.json.elements[i].selected && this.json.elements[i].position == i ){
                this.unSelectButton(this.json.elements[i])
                find = true;
            }
        }
        //3. Selects the pressed button
        //4. Changes the image of the pressed button
        this.selectButton(button);
        //5. Invokes the function
        button.handler.call(); 
        
    },
    /*
    * @method unSelectButton
    * @desc The function handles the unselected button, change the field selected,remove the old icon, and set the new one
    */
    unSelectButton: function (button){
        button.selected = false;
        var buttonUnselected = this.buttonsHTML.get(button.position);
        if (global.liteVersion) {
            buttonUnselected.removeClassName('viewSelector_pushedLink');
            buttonUnselected.addClassName('viewSelector_link');
        }
        else {
        buttonUnselected.removeClassName(this.icons_pushed.get(button.idButton));
        buttonUnselected.addClassName(this.icons.get(button.idButton));
        }
    },
    /*
    * @method selectButton
    * @desc The function handles the selected button, change the field selected,remove the old icon, and set the new one
    */
    selectButton: function (button){
        button.selected = true;
        var buttonSelected = this.buttonsHTML.get(button.position);
        if (global.liteVersion) {
            buttonSelected.removeClassName('viewSelector_link');
            buttonSelected.addClassName('viewSelector_pushedLink');
        }
        else {
        buttonSelected.removeClassName(this.icons.get(button.idButton));
        buttonSelected.addClassName(this.icons_pushed.get(button.idButton));
    }
    }

}
)