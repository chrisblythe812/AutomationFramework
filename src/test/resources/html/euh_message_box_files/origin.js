/**
 *@fileOverview origin.js
 *@description in this file appear all the general functions we need to make the application work:
 * - Browser Detection Class
 * - XML functions
 * - ...
 *plus the classes:
 * - origin --> the mother class for all our objects
 * - Application --> every application we create belongs to this class
 * - Call --> make us be able to request to the back-end
 */
 
 var __sapClient = "300";
 
var __entry = 'entry';
if (getURLParam('entry'))
    __entry = getURLParam('entry');
/*
 * Initialize the default settings for the AJAX URL, the logoff page and the timeout for automatic logoff...
 */
var __logOnUrl = "/standard/logOnPage/logInPage.html?sap-client=" + __sapClient;
var __proxy = 'proxy.aspx';
if (getURLParam('proxy')) {
    __proxy = getURLParam('proxy');
    var __logOnUrl = "/standard/logOnPage/PHPlogInPage.html?sap-client=" + __sapClient;
}
// EUHREKA SYSTEMS

//Temporary pointing to ETN:
//var __hostName = "proxy.aspx?url=" + escape("http://eu2r3etn.euhreka.erp:8013/sap/bc/yglui_httpentry?sap-client=200");


/******************************/
/*   EDC / EDN 300 - STANDARD       */
/******************************/

//var __hostName = __proxy + "?url=" + escape("http://eu2r3edc.euhreka.erp:8002/sap/bc/yglui_http" + __entry + "?sap-client=300");
//var __hostName = "proxy.aspx?url=" + escape("http://eu2r3etc.euhreka.erp:8011/sap/bc/yglui_http"+__entry+"?sap-client=200");
//var __hostName = "proxy.aspx?url=" + escape("http://eu2r3edn.euhreka.erp:8003/sap/bc/yglui_http"+__entry+"?sap-client=300");
//var __hostName = "proxy.aspx?url=" + escape("http://eodr3edm.euhreka.erp:8000/sap/bc/yglui_http"+__entry+"?sap-client=814");

//var __hostName = "proxy.aspx?url=" + escape("http://eu2r3etn.euhreka.erp:8013/sap/bc/yglui_http"+__entry+"?sap-client=200");
//var __hostName = __proxy + "?url=" + escape("http://eu2r3edn.euhreka.erp:8003/sap/bc/yglui_http" + __entry + "?sap-client=300");
//var __hostName = "proxy.aspx?url=" + escape("http://eu2r3dci.euhreka.erp:8000/sap/bc/yglui_httpentry?sap-client=963");
//var __hostName = "proxy.aspx?url=" + escape("https://eap-tst.euhreka.com/sap/bc/yglui_httpentry?sap-client=863");
var __hostName = "/sap/bc/yglui_http" + __entry;
var __client = getURLParam('sap-client');//sap-client arriving in the URL
//var __client = null;

var __sesid = getURLParam('sesid');//session ID arriving in the URL
//var __sesid = null;

/******************************/
/*   EDC 310 - STANDARD       */
/******************************/

//var __hostName = "proxy.aspx?url=" + escape("http://eu2r3edc.euhreka.erp:8002/sap/bc/yglui_httpentry?sap-client=310");

/******************************/
/*          EDC 301           */
/******************************/

//var __hostName = "proxy.aspx?url=" + escape("http://eu2r3edc.euhreka.erp:8002/sap/bc/yglui_httpentry?sap-client=308");

/******************************/
/*          ETC 200           */
/******************************/

//var __hostName = "proxy.aspx?url=" + escape("http://eu2r3etc.euhreka.erp:8011/sap/bc/yglui_httpentry?sap-client=200");

// SECUREX SYSTEMS

/******************************/
/*         SED 312            */
/******************************/

//var __hostName = "http://scxecdci.securex.erp:8000/sap/bc/yglui_httpentry?sap-client=312";

/******************************/
/*         SEQ 100            */
/******************************/

//var __hostName = "http://scxeccci.securex.erp:8032/sap/bc/yglui_httpentry?sap-client=100";

/***********************************************/
/*         SER 100 (debug_ser.html)            */
/***********************************************/

//var __hostName = "proxy.aspx?url=" + escape("http://scxecrci.securex.erp:8040/sap/bc/yglui_httpentry?sap-client=100");


Ajax.Responders.register({
    /**
	 * This function will be called when making a new AJAX request
	 */
    onCreate: function() {
        htmlBars = "";
        if (this.startColor == undefined) {
            this.startColor = '492682'
            if(this.startColor.include('rgb')) {
                var colorString = "";
                this.startColor = this.startColor.gsub(/(rgb)|[(]|[)]/,'').split(",").each(function(color) {
                    color = parseInt(color,10).toString(16);
                    colorString += (color.toString().length == 1 ? "0"+color : color);
                });
                this.startColor = colorString;
            }
        }
        if (Ajax.activeRequestCount > 0)
            if(this.startColor)
                var colors = this.performGradient(this.startColor, 'ffffff', Ajax.activeRequestCount);
        for (var i = 0; i < Ajax.activeRequestCount && colors; i++) {
            htmlBars += "<div class='fwk_start_loadingBar' style='background-color: " + colors[i] + ";'></div>";
        }
        if (global && global.showLoadingMsg) {
        if($("loadingDiv")){ //HERE WE CHANGE THE VISIBILITY OF THE LOADING DIV
            $("loadingDiv").show();
            $("loadingBars").show();
            $('loadingBars').update(htmlBars);
            }
        }
        Ajax.activeRequestCount++;
    },
    /**
	 * This function will be executed when an AJAX request is done
	 */
    onComplete: function() {
        Ajax.activeRequestCount--;
        htmlBars = "";
        if(Ajax.activeRequestCount > 0)
            var colors = this.performGradient(this.startColor,'ffffff',Ajax.activeRequestCount);
        for (var i = 0; i < Ajax.activeRequestCount; i++) {
            htmlBars += "<div class='fwk_start_loadingBar' style='background-color: "+colors[i]+";'></div>";
        }
        if($('loadingBars'))$('loadingBars').update(htmlBars);
        if ($("loadingDiv") && Ajax.activeRequestCount == 0) {
            $("loadingDiv").hide();
            $("loadingBars").hide();
        }

    },
    /**
	* @description This functions makes a color gradient between two colors on the steps you indicate
	* @param startColor Start color
	* @param endColor End color
	* @param height Number of steps
	* @returns An array with the generated colors
	*/
    performGradient: function(startColor,endColor,height) {
        var startr = parseInt((startColor.charAt(0) + startColor.charAt(1)),16);
        var startg = parseInt((startColor.charAt(2) + startColor.charAt(3)),16);
        var startb = parseInt((startColor.charAt(4) + startColor.charAt(5)),16);
        var endr = parseInt((endColor.charAt(0) + endColor.charAt(1)),16);
        var endg = parseInt((endColor.charAt(2) + endColor.charAt(3)),16);
        var endb = parseInt((endColor.charAt(4) + endColor.charAt(5)),16);
        var diffr = endr - startr;
        var diffg = endg - startg;
        var diffb = endb - startb;
        var intervalr = 0;
        var intervalg = 0;
        var intervalb = 0;
        var curr = startr;
        var curg = startg;
        var curb = startb;
        var i = 0;
        intervalr = Math.round(diffr / height);
        intervalg = Math.round(diffg / height);
        intervalb = Math.round(diffb / height);
        var colorArray = [];
        while(i < height) {
            curr_str = curr.toString(16);

            if(curr < 16) {
                curr_str = "0" + curr_str;
            }
            curg_str = curg.toString(16);
            if(curg < 16) {
                curg_str = "0" + curg_str;
            }
            curb_str = curb.toString(16);
            if(curb < 16) {
                curb_str = "0" + curb_str;
            }
            cur_color = "#" + curr_str + curg_str + curb_str;
            colorArray.push(cur_color);
            curr += intervalr;
            curg += intervalg;
            curb += intervalb;
            i++;
        }
        return colorArray;
    }
});
/**
 * @param element {Element} Balloon, info screen or datePiker element to apply iFrame
 * @description We apply an iFrame to the element for to avoid errors with selects in IE6
 */
function iFrameToSelect(element){
    this.f = null;
    element = element || window.self.document.body;
    //we test if the browser is IE6
    var isIE = document.all && (navigator.userAgent.toLowerCase().indexOf("msie 6.") != -1);
    if (isIE) {
        //we get the dimensions and the offset values to set the iFrame in the correct place
        var offs = Element.cumulativeOffset(element);
        var dim  = Element.getDimensions(element);
        var left = offs.left;
        var width = dim.width + "px";
        //if the element is a balloon we set the dimensions
        if(element.identify().include('Balloon')){
            var top = offs.top+18;
            var height = dim.height-70-36 + "px";
        }
        //if is an info screen...
        else if(element.identify().include('fwk_info')){
            var top=offs.top+7;
            var height=dim.height-14 + "px";
        }
        //if is a datePicker...
        else{
            var top=offs.top;
            var height= dim.height;
        }
        //we create the filter
        var filter = 'filter:progid:DXImageTransform.Microsoft.alpha(style=0,opacity=0);';
        var id = "WCH" + Math.ceil(Math.random() * 1000) ;
        //we insert an iframe below the element in the correct place with the previous top, left, width and height, and the correct filter
        element.insert
        ({
            before: '<iframe id="' + id + '" scroll="no" frameborder="0" ' +
            'style="z-index:0;position:absolute;border:0;top:'+top+';left:'+left+';width:'+width+';height:'+height+'; visibility:hidden;' + filter +'"></iframe>'
            });
        //we get the id of the iframe
        this.f = window.self.document.getElementById(id);
        this.f.visibility = "inherit";
    }
    //we show the iframe 
    if (this.f)
        this.f.style.visibility = "";
}
/**
 * @param element {Element} Balloon, info screen or datePiker element to remove iFrame
 * @description We remove the iFrame applied to the element for avoid errors with selects in IE6
 */
function iFrameToSelectHide(element){
    //if the iframe exits we hide and destroy it 
    if (this.f){
        this.f.style.visibility = "hidden";
        iFrameToSelectDestroy(element);
    }
}
/**
 * @param element {iFrame} iFrame applied to elements to avoid errors in IE6
 * @description We remove the iFrame
 */
function iFrameToSelectDestroy(el) {
    $(this.f).remove();
};

/**
 * @description We remove the character " " of the end and the begin of the string
 */
String.prototype.trim = function() {
    return this.replace(/^\s+|\s+$/g, ""); 
};
/**
 * Makes an exact copy of an object. Do note that for DOM elements it will do shallow copy not deep copy!!!
 * @param {Object} obj the object the copy
 * @return an exact copy of the object given as an argument
 */
function deepCopy(o) {
    try {
//Stack to simulate recursion
        var stack = $A();
    stack.push({
        original: o,
        result: null,
        complete: false,
        parentElement: null,
        sons: 0,
        completedSons: 0,
        name: null
        });
        
    //Iterator for the stack
    var i=0;
    while(i<stack.size()){
        var element = stack[i].original;
            //If the element is primitive just store its value. We'll also do that for DOM elements using clone() function from prototype
            if (typeof element !== 'object' || element == null || Object.isElement(element)) {
                if(Object.isElement(element)){
                    stack[i].result = Object.clone(element);
                }else{
            stack[i].result = element;
                }
                
            stack[i].complete = true;
            var parent = stack[i].parentElement;
            if (parent != null) {
                stack[parent].completedSons++;
                //Store the value
                stack[parent].result[stack[i].name] = stack[i].result;
                //Expand the completion without recursion:
                while (stack[parent].completedSons == stack[parent].sons) {
                    //If this element is completed, go to the father
                    var sonIndex = parent;
                    parent = stack[parent].parentElement;
                    if(parent!=null){
                        stack[parent].completedSons++;
                        //Store the value
                        stack[parent].result[stack[sonIndex].name] = stack[sonIndex].result;
                    }else{
                        //If parent is null, that's the root of the object
                        break;
                    }
                }
            }           
        }
        else{
            //Its an object, either array or or hash
            stack[i].result = (element instanceof Array )? [] : {};
            for (var son in element) {
                stack[i].sons++;
                var sonElement = element[son];
                if (typeof sonElement !== 'object' || sonElement == null) {
                    //If the type is primitive, we just copy it instead of inserting it in the stack
                    stack[i].result[son] = sonElement;
                    stack[i].completedSons++;
                }
                else {
                    //Add the element to the stack
                    stack.push({
                        original: sonElement,
                        result: null,
                        complete: false,
                        parentElement: i,
                        sons: 0,
                        completedSons: 0,
                        name: son
                    });
                }
            }
            if (stack[i].sons == stack[i].completedSons) {
                //If all the sons are completed:
                var parent = stack[i].parentElement;
                if (parent != null) {
                    stack[parent].completedSons++;
                    //Store the value
                    stack[parent].result[stack[i].name] = stack[i].result;
                    //Expand the completion without recursion:
                    while (stack[parent].completedSons == stack[parent].sons) {
                        //If this element is completed, go to the father
                        var sonIndex = parent;
                        parent = stack[parent].parentElement;
                        if (parent != null) {
                            stack[parent].completedSons++;
                            //Store the value
                            stack[parent].result[stack[sonIndex].name] = stack[sonIndex].result;
                        } else {
                            //If parent is null, that's the root of the object
                            break;
                        }
                    }
                }
            }
        }
        i++;
    }
    return stack[0].result; //*/
}
    catch (e) {
		//If new method for deep Copying fails, we use the old one
        return Object.toJSON(o).evalJSON(o);
    }
}

/**
 * @param div {Element} the div that has to be centered in the screen
 * @description It vertically centers a div in the current user viewPort
 */
function calculateHeight(div) {
    var offset = document.viewport.getScrollOffsets();
    div.setStyle({
        top: (offset.top + parseInt(document.viewport.getHeight() / 2))+'px'
    });
}



/**
 * @param total {Integer} The number of possible levels
 * @param current {Integer} The current level
 * @param required {Integer} The required level. If required == -1, then required bar is not displayed.
 * @param viewBorders (boolean) If true. Each column will be displayed with borders.
 * @param optimum (Integer) Desired value for 'total'. It's used to draw a different color schema.
 * @description Creates a drawing of the rating
 */
function getRating(total,current,required,viewBorders,optimum){
    //check if we have required, or is a simple rating
    var simple = false;
    var ratioBar = false;
    if(viewBorders)
        var className = "ratingWithBorders";
    else{
        var className = "ratingWithoutBorders";
    }
    if(required == -1){
        required = current;
        simple = true;
    }
    var ratingHtml = new Element('table', {
        id: className,
        'cellspacing': '0',
        'cellpadding': '0'
    });
    if (ratingHtml.id == 'ratingWithBorders') {
        var width = 10 * total;
        ratingHtml.setStyle({
            width: width + 'px'
        });
    }
    //creation of tbody
    var tbody = new Element('tbody', {
        id: 'rating_tbody'
    });
    var tr1 = new Element('tr');
    //tr1.addClassName('PFM_tr_currentLevel');
    for (var j = 0; j < total; j++) {
        var td = new Element('td').insert(  "<div class='ratingCurrent_cell'></div>");
        if(!optimum){
            if(viewBorders){
                td.addClassName('PFM_currentLevel');
                if(j<current && current >= required) td.addClassName('PFM_greenLevel');
                else if(j<current && current < required) td.addClassName('PFM_yellowLevel');
            }else if(j<current){
                if((current *100)/total <= 33.)td.addClassName('PFM_greenLevel');
                if(((current *100)/total > 33) && ((current *100)/total <= 66))td.addClassName('rating_yellowLevel');
                if((current *100)/total > 66)td.addClassName('rating_redLevel');
            }
        }else{
            if(j<current){
                if((current < optimum) && (current>=1))td.addClassName('PFM_greenLevel');
                if((current >= optimum) && (current < total))td.addClassName('rating_yellowLevel');
                if(current == total)td.addClassName('rating_redLevel');        
            }
        }
        tr1.insert(td);
    }
    var tr2 = new Element('tr');
    //tr2.addClassName('PFM_tr_requiredLevel');
    for (var j = 0; j < total; j++) {
        var td = new Element('td').insert(  "<div class='ratingRequired_cell'></div>");
        if(!optimum){
            if(viewBorders){
                td.addClassName('PFM_requiredLevel');
                if(j<required && !simple) td.addClassName('PFM_grayLevel');
                if(j<required && simple) td.addClassName('PFM_greenLevel');
            }else if(j<current){
                if((current *100)/total <= 33.)td.addClassName('PFM_greenLevel');
                if(((current *100)/total > 33) && ((current *100)/total <= 66))td.addClassName('rating_yellowLevel');
                if((current *100)/total > 66)td.addClassName('rating_redLevel');
            }
        }else{
            if(j<current){
                if((current < optimum) && (current>=1))td.addClassName('PFM_greenLevel');
                if((current >= optimum) && (current < total))td.addClassName('rating_yellowLevel');
                if(current == total)td.addClassName('rating_redLevel');        
            }
        }
        tr2.insert(td);
    }
    tbody.insert(tr1);
    tbody.insert(tr2);
    ratingHtml.insert(tbody);
    return ratingHtml;
}

/**
 * @param event {Event} or {Object} An object, to look for arguments inside of it.
 * @description if the object is an Event object, it looks for arguments passed in the
 *          binding and returns it. Otherwise it returns the same object.
 * @returns {Object}
 */
function getArgs(event){
    if(event.memo){
        return event.memo;
    }else{
        return event;
    }
}

/**
 *@param sapFormatDate {String} Date in SAP format ( yyyy-MM-dd )
 *@param sapFormatTime {String} Time in SAP format ( HH:mm:ss )
 *@description returns Date Object
 *@returns Date
 */
function sapToObject(sapFormatDate, sapFormatTime){
    if(sapFormatTime){
        return Date.parseExact(sapFormatDate + " " + sapFormatTime, "yyyy-MM-dd HH:mm:ss");
    }else{
        if (Object.isEmpty(sapFormatDate))
            return "";
        else
            return Date.parseExact(sapFormatDate, "yyyy-MM-dd");
    }
}
/**
 *@param displayFormatDate {String} Date in Display format (as especified in global.dateFormat)
 *@param displayFormatTime {String} Time in display format (as especfied in global.hourFormat)
 *@description returns Date Object
 *@returns Date
 */
function displayToObject(displayFormatDate, displayFormatTime){
    if(displayFormatTime){
        return Date.parseExact(displayFormatDate + " " + displayFormatTime, global.dateFormat + " " + global.hourFormat);
    }else{
        return Date.parseExact(displayFormatDate, global.dateFormat);
    }
}
/**
 *@param date {Date} Date Object
 *@description returns string date in Display format
 *@returns String
 */
function objectToDisplay(date){
    if (Object.isEmpty(date))
        return "";
    else
        return Date.parse(date).toString(global.dateFormat);
}
/**
 *@param time {Date} Date Object with the time
 *@description returns string time in Display format ( as especified in global.hourFormat )
 *@returns String
 */
function objectToDisplayTime(time){
    return time.toString(global.hourFormat);
}
/**
 *@param date {Date} Date Object
 *@description returns string date in SAP format
 *@returns String
 */
function objectToSap(date){
    return date.toString("yyyy-MM-dd");
}
/**
 *@param time {Date} Date Object
 *@description returns string time in SAP format ( HH:mm:ss )
 *@returns String
 */
function objectToSapTime(time){
    return time.toString("HH:mm:ss");
}
/**
 *@param sapFormatDate {String} Date in SAP format
 *@description returns sapFormatDate into loggedUser Display format
 *@returns String
 */
function sapToDisplayFormat(sapFormatDate){
    if(sapFormatDate == global.nullDate)
        return '';
    else
        return objectToDisplay(sapToObject(sapFormatDate));
}
/**
 *@param sapFormatTime {String} Time in SAP format
 *@description returns sapFormatTime into loggedUser Display format (as especified in global.hourFormat)
 *@returns String
 */
function sapToDisplayFormatTime(sapFormatTime){
    return objectToDisplayTime(sapToObject(objectToSap(Date.today()), sapFormatTime));
}
/**
 *@param displayFormatDate {String} Date in SAP loggedUser Display format
 *@description returns displayFormatDate into SAP format
 *@returns String
 */
function displayToSap(displayFormatDate){
    var date = Date.parseExact(displayFormatDate, global.dateFormat);
    return date.toString("yyyy-MM-dd");
}
/**
 *@param displayFormatTime {String} Time in SAP loggedUser Display format
 *@description returns displayFormatTime into SAP format
 *@returns String
 */
function displayTimeToSap(displayFormatTime){
    var date = Date.parseExact(displayFormatTime, global.hourFormat);
    return date.toString("HH:mm:ss");
}
/**
 *@param longNumber {String} Long number
 *@description returns longNumber into LoggedUser Number Format
 *@returns String
 */
function longToDisplay(longNumber, decimals){
    if(!Object.isNumber(longNumber)){
        //        if(log)
        //            log.warning('The parameter '+longNumber+' is not a Long Number(possibly a String Object)');
        return null;
    }
    if (isNaN(longNumber)) {
        return "";
    }
    var number = new Number(longNumber.toPrecision(20)).abs().floor().toString().toArray();
    var str = '';
    var period = 0;
    var thousand = true;
    for(var iter = number.size()-1;iter>=0;iter--){
        if(period == 3){
            var sep = (thousand)?'thousandsSeparator':'millionsSeparator';
            thousand = !(thousand);
            str =  number[iter] + global[sep] + str;
            period = 1;
        }else{
            var aux = str;
            str = number[iter] + str;
            period++;
        }
    }
    if (Object.isEmpty(decimals))
        var fl = longNumber.toString();
    else
        var fl = longNumber.toFixed(decimals).toString();
    if (fl.indexOf('.') > 0) {
        var decimals = fl.sub(fl.truncate(fl.indexOf('.'), ''), '').sub('.', global.commaSeparator);
        str += decimals;
    }
    if (longNumber != longNumber.abs())
        str = '-' + str; 
    return str;
}
/**
 *@param displayFormatNumber {String} Display number format
 *@description returns displayFormatNumber into loggedUser number Display format
 *@returns Number
 */
function displayToLong(displayFormatNumber) {
	//Remove the unused separators
	var stringNumber = displayFormatNumber.gsub(global.thousandsSeparator,"").gsub(global.millionsSeparator,"");
	//Use dot as decimal separator (required by SAP and javascript):
	stringNumber = stringNumber.gsub(global.commaSeparator, ".");	
	
	var floatNumber = parseFloat(stringNumber);
	
	if(floatNumber==null || ((floatNumber+"") == "NaN")){
		return NaN;
	}
	
	stringNumber = "" + floatNumber;
	//If it doesn't have .XX at the end, we add it:
	if(!stringNumber.include(".")){
		stringNumber += ".00";
	}
	//TODO Use the real format from SAP, maybe limit the decimals
	return stringNumber;
}
/**
 * Shows an error in a popup
 * @param errorToShow Error we want to show
 */
function showError(errorToShow){
    if (Object.isEmpty(global.currentPopUp)) {
        //Create a new popup
        global._createErrorPopup.bind(global, errorToShow, null).call();
    } else {
        //Add the info to the existing popup
        global._addErrorToPopup.bind(global, errorToShow, null).call();
    }
 }
/**
 * Prepares text to be shown in a DOM element (that is not an input)
 * @param text the text to be shown
 * @param handleLineBreaks if we want to care of line breaks
 */
 function prepareTextToShow(text) {
     return text;
}
/**
 * Prepares text to be shown in an input element (or text area)
 * @param text the text to be shown
 */ 
function prepareTextToEdit(text){
    if (text && Object.isString(text)) {
        text = text.unescapeHTML();
        if (!Object.isEmpty(text)) {
            text = text.gsub("&quot;", '"');
            text = text.gsub("&#39;", "'");
        }
    }
    return text;
}
/**
 * Prepares text to be sent to backend (HTML entities should be encoded)
 * @param text the text to be sent
 */ 
function prepareTextToSend(text){
    if (text && Object.isString(text)) {
        if (!Object.isEmpty(text))
            text = text.gsub('&amp;', '&');
        text = text.escapeHTML();
	}
	return text;
}
function prepareTextToSendCKeditor(text) {
	return text;
}
 
function prepareTextToShowCkeditor(text) {
    return text.unescapeHTML();
}

function splitGetContent(xml) {
    var screens = objectToArray(xml.EWS.o_widget_screens.yglui_str_wid_screen);
    var screensStructure = new Hash();
    for (var i = 0; i < screens.length; i++) {
        screensStructure.set(screens[i]['@screen'], {
            EWS: ({
                appId: screens[i]['@appid'],
                label: screens[i]['@label_tag'],
                o_field_settings: ({
                    yglui_str_wid_fs_record: ''
                }),
                o_field_values: null,
                labels: xml.EWS.labels
            })
        });
    }
    //add headers to screensStructure hash
    var o_field_settings = objectToArray(xml.EWS.o_field_settings.yglui_str_wid_fs_record);
    for (var b = 0; b < o_field_settings.length; b++) {
        var containerScreen = parseInt(o_field_settings[b]['@screen'], 10);
        screensStructure.get(containerScreen).EWS.o_field_settings.yglui_str_wid_fs_record = o_field_settings[b];
    }
    //loop through columns to put the in its screen
    if(!Object.isEmpty(xml.EWS.o_field_values)){
        var o_field_values = objectToArray(xml.EWS.o_field_values.yglui_str_wid_record);
        for (var j = 0; j < o_field_values.length; j++) {
            var containerScreen = parseInt(o_field_values[j]['@screen'], 10);
            screensStructure.get(containerScreen).EWS.o_field_values = ({
                yglui_str_wid_record: o_field_values[j]
            });
        }
    }else{
        screensStructure.get(containerScreen).EWS.o_field_values = null;
    }
    return screensStructure;
}
/**
 *@param mhash1 {Hash} first hash to be merged
 *@param mhash2 {Hash} second hash to be merged
 *@description merges (recursively in every hash level) 
 *two given hashes returning the result
 */
function recursiveMerge(mhash1, mhash2){
    var itHasHashInside = false;
    var hashes = $H({});
    var ret = mhash1.clone();
    mhash1.each(function(field){
        if (Object.isHash(field.value) && mhash2.get(field.key)) {
            hashes.set(field.key, this.recursiveMerge(mhash1.get(field.key), mhash2.get(field.key)));
            itHasHashInside = true;
        }
    }.bind(this));
    if (itHasHashInside) {
        hashes.each(function(field){
            ret.set(field.key, field.value);
        });
        return ret;
    }
    else {
        return mhash1.merge(mhash2);
    }
}



/**
 *@param json Json to be divided in parts
 *@description Taken a get_content json, creates another json dividing the record by its screen. 
 *This method has to be used when we want to build a grouped layout
 */
function splitInScreensGL(json){
    if(json.EWS.o_widget_screens.yglui_str_wid_screen.yglui_str_wid_screen){
        json.EWS.o_widget_screens.yglui_str_wid_screen = json.EWS.o_widget_screens.yglui_str_wid_screen.yglui_str_wid_screen;
    }
    //developers have to calculate the number of screens, and make a hash for each one  
    var screens = objectToArray(json.EWS.o_widget_screens.yglui_str_wid_screen);
    if(screens[0].yglui_str_wid_screen){
        //after new getContent customizing in order to work with the new fieldsPanel, sometimes there is an extra node yglui_str_wid_screen
        screens = screens[0].yglui_str_wid_screen;
    }    
    var screensStructure = new Hash();
    for (var i=0; i<screens.length;i++){
        screensStructure.set(screens[i]['@screen'],
        {
            appId: screens[i]['@appid'],
            label: screens[i]['@label_tag'],
            headers: '',
            rows: []
        });
    }
    //add headers to screensStructure hash
    var headers = objectToArray(json.EWS.o_field_settings.yglui_str_wid_fs_record);
    for(var b=0; b<headers.length;b++){
        var containerScreen = headers[b]['@screen'];
        screensStructure.get(containerScreen).headers = headers[b];        
    }
    //loop through rows to put then in its screen
    if("o_field_values" in json.EWS){
        var allRows;
        if(json.EWS.o_field_values != null){
            allRows = objectToArray(json.EWS.o_field_values.yglui_str_wid_record);        
            for (var j=0; j <allRows.length; j++){
                var containerScreen = allRows[j]['@screen'];
                screensStructure.get(containerScreen).rows.push(allRows[j]);
            }	
        }
    }
    return screensStructure;
}

function splitBothViews(json) {
    if (json.EWS.o_widget_screens.yglui_str_wid_screen.yglui_str_wid_screen)
        json.EWS.o_widget_screens.yglui_str_wid_screen = json.EWS.o_widget_screens.yglui_str_wid_screen.yglui_str_wid_screen;
    var screens = objectToArray(json.EWS.o_widget_screens.yglui_str_wid_screen);
    var screensStructure = new Hash();
    for (var c = 0; c < screens.length; c++) {
        if (screens[c]['@table_mode'] == 'X') {
            screensStructure.set(screens[c]['@screen'],
            {
                appId: screens[c]['@appid'],
                label: screens[c]['@label_tag'],
                headers: '',
                rows: [],
                tableMode: 'X'
            });
            var headers = objectToArray(json.EWS.o_field_settings.yglui_str_wid_fs_record);
            for (var b = 0; b < headers.length; b++) {
                var containerScreen = headers[b]['@screen'];
                if (containerScreen == screens[c]['@screen'])
                    screensStructure.get(containerScreen).headers = headers[b];
            }
            //loop through rows to put then in its screen
            if ("o_field_values" in json.EWS) {
                var allRows;
                if (json.EWS.o_field_values != null) {
                    allRows = objectToArray(json.EWS.o_field_values.yglui_str_wid_record);
                    for (var j = 0; j < allRows.length; j++) {
                        var containerScreen = allRows[j]['@screen'];
                        if (containerScreen == screens[c]['@screen'])
                            screensStructure.get(containerScreen).rows.push(allRows[j]);
                    }
                }
            }
        }
        else {
            screensStructure.set(screens[c]['@screen'], {
                EWS: ({
                    appId: screens[c]['@appid'],
                    label: screens[c]['@label_tag'],
                    o_field_settings: ({
                        yglui_str_wid_fs_record: ''
                    }),
                    o_field_values: ({
                        yglui_str_wid_record: $A()
                    }),
                    o_screen_buttons: ({
                        yglui_str_wid_button: $A()
                    }),
                    o_widget_screens: ({
                        yglui_str_wid_screen: $A()
                    }),                                        
                    o_date_ranges: ({
                        yglui_str_dates: $A()
                    }),                                        
                    labels: json.EWS.labels
                }),
                tableMode: null,
                listMode: null
            });
            //add headers to screensStructure hash
            if (!Object.isEmpty(screens[c]['@list_mode']))
                screensStructure.get(screens[c]['@screen']).listMode = screens[c]['@list_mode'];
            var o_field_settings = objectToArray(json.EWS.o_field_settings.yglui_str_wid_fs_record);
            for (var b = 0; b < o_field_settings.length; b++) {
                var containerScreen = o_field_settings[b]['@screen'];
                if (containerScreen == screens[c]['@screen'])
                    screensStructure.get(containerScreen).EWS.o_field_settings.yglui_str_wid_fs_record = o_field_settings[b];
            }
            //date_ranges
            if (!Object.isEmpty(json.EWS.o_date_ranges)) {
                var o_date_ranges = objectToArray(json.EWS.o_date_ranges.yglui_str_dates);
                for (var b = 0; b < o_date_ranges.length; b++) {
                    var containerScreen = o_date_ranges[b]['@screen'];
                    if (containerScreen == screens[c]['@screen'])
                        screensStructure.get(containerScreen).EWS.o_date_ranges.yglui_str_dates = o_date_ranges[b];
                }
            } else {
                screensStructure.get(screens[c]['@screen']).EWS.o_date_ranges = null;
            }            
            //buttons (if existing)
            if(!Object.isEmpty(json.EWS.o_screen_buttons)){
                var o_screen_buttons = objectToArray(json.EWS.o_screen_buttons.yglui_str_wid_button);
                for (var b = 0; b < o_screen_buttons.length; b++) {
                    var containerScreen = o_screen_buttons[b]['@screen'];
                    if (containerScreen == screens[c]['@screen'])
                        screensStructure.get(containerScreen).EWS.o_screen_buttons.o_screen_buttons = o_screen_buttons[b];
                }
            }else{
                screensStructure.get(screens[c]['@screen']).EWS.o_screen_buttons = null;
            }    
            //screens
            var o_widget_screens = objectToArray(json.EWS.o_widget_screens.yglui_str_wid_screen);
            var screenMode = json.EWS.o_widget_screens['@screenmode'];
            for (var b = 0; b < o_widget_screens.length; b++) {
                var containerScreen = o_widget_screens[b]['@screen'];
                if (containerScreen == screens[c]['@screen']){
                    screensStructure.get(containerScreen).EWS.o_widget_screens.yglui_str_wid_screen = o_widget_screens[b];
                    screensStructure.get(containerScreen).EWS.o_widget_screens['@screenmode'] = screenMode;
                }
            }                     
            //loop through columns to put the in its screen
            if (!Object.isEmpty(json.EWS.o_field_values)) {
                var o_field_values = objectToArray(json.EWS.o_field_values.yglui_str_wid_record);
                for (var j = 0; j < o_field_values.length; j++) {
                    var containerScreen = o_field_values[j]['@screen'];
                    if (containerScreen == screens[c]['@screen']) {
                        screensStructure.get(containerScreen).EWS.o_field_values.yglui_str_wid_record.push(o_field_values[j]);
                    }
                }
                if (screensStructure.get(screens[c]['@screen']).EWS.o_field_values.yglui_str_wid_record.length == 1)
                    screensStructure.get(screens[c]['@screen']).EWS.o_field_values.yglui_str_wid_record = screensStructure.get(screens[c]['@screen']).EWS.o_field_values.yglui_str_wid_record[0];
                else if (screensStructure.get(screens[c]['@screen']).EWS.o_field_values.yglui_str_wid_record.length == 0)
                    screensStructure.get(screens[c]['@screen']).EWS.o_field_values = null;
            }
            else {
                screensStructure.get(screens[c]['@screen']).EWS.o_field_values = null;
            }
        }
    }
    return screensStructure;
}

/**
*@param hash {hash} hash, with the information to convert to Html
*@description returns Html, a Html with the rigth format to use in the module infoPopUp
*@returns Html
*/
function hashToHtml(hash) {
    var title = hash.get('title');
    var html = "";
    var i = 0;
    if (!Object.isEmpty(title)) {
        html += "<div id='mainTitle' class='infoModule_main_titleCss application_main_title'>" + title + "</div>";
        i = 1;
    }
    for ( i; i < hash.keys().length; i++) {
        var rows = hash.get(hash.keys()[i]).get('rows');
        var values = hash.get(hash.keys()[i]).values();
        if (hash.get(hash.keys()[i]).values().length != 1)
            html += "<div id=" + hash.get(hash.keys()[i]).keys()[0] + "_" + i + " class='infoModule_subtitle_css application_main_title2'>" + values[0] + "</div>";
        for (var j = 0; j < rows.length; j++) {
            html += "<div id='" + hash.keys()[i] + "_label_" + j + "' class='infoModule_labels_css application_main_soft_text'>" + rows[j].get('label') + "</div>";
            html += "<div id='" + hash.keys()[i] + "_info_" + j + "' class='infoModule_info_css application_text_bolder'>" + rows[j].get('info') + "</div>";
        }
    }

    return html;
}

function getSapName(appId) {
    var toSap = global.SAP_app_WEB.keys();
    for (var i = 0; i < toSap.length; i++) {
        var webApp = global.SAP_app_WEB.get(toSap[i]);
        if (webApp == appId)
            return toSap[i];
    }
    return appId;
}

/**
*@description Function to build a legend
*@param {json} options Information about the legend
*@param {Number} cols Number of columns for the legend
*@returns {Object} contain (Legend's HTML code)
*/
function getLegend(options, cols) {
    if (!cols)
        cols = 3; 
    //here we create the array where we are going to save each button, in case we want to take several legend actived, and we see in what position in the array we must the save the next megabutton
    if(this.arrayLegends){
        var i = this.arrayLegends.length;
    }else{
        var i = 0;
        this.arrayLegends = $A();
    }
    var showed = false;
    var legend = objectToArray(options.legend);
    var showLabel = options.showLabel;
    var hideLabel = options.hideLabel;
    var randomNumberForLabel = Math.random()*1000;
    var idButton = 'legend_module_label' + randomNumberForLabel + '';
    /*
    *This is the function which show or hide the legend.
    */
    function hideShowLegend() {
        var i = 0;
        var exit = false;
        //this loop search the corresponding button, which we must update
        while((i < this.arrayLegends.length)&&(exit == false)){
            if(this.arrayLegends[i].hash.get(idButton)){
                exit = true;
            }else{
                i++;
            }
        }
        if (!showed) {
            containRows.show();
            this.arrayLegends[i].updateLabel(idButton,hideLabel);
            showed = true;
        }
        else {
            containRows.hide();
            this.arrayLegends[i].updateLabel(idButton,showLabel);
            showed = false;
        }
    }
    var contain = new Element('div', ({
        'id': 'legend_module_contain',
        'class': 'legend_module_containCss'
    }));
    var json = {
        elements: []
    };
    var legendLabel = {
        label: showLabel,
        handlerContext: null,
        handler: hideShowLegend.bind(this),
        type: 'link',
        idButton: idButton,
        className: 'application_action_link'
    };
    json.elements.push(legendLabel);    
    var rowCss = (cols == 1)? 'legend_module_containRowsCss2' : 'legend_module_containRowsCss';
    var containRows = new Element('table', ({
        'id': 'legend_module_containRows',
        'class': rowCss
    }));
    var tBody = new Element('tbody');
    containRows.insert(tBody);
    this.arrayLegends[i] = new megaButtonDisplayer(json);     
    contain.insert(this.arrayLegends[i].getButtons());  
    contain.insert(containRows);
    containRows.hide();
    for (var i = 0; i < legend.length; i++) {
        if (i % cols == 0)
            var rows = new Element('tr');
        var title = "";
        var imageArial = "";
        if(global.liteVersion){ 
            title =  'title = "'+legend[i]['text'] + '"';
            imageArial = !Object.isEmpty(legend[i]['code'])?legend[i]['code']:"";
        }
        var img = new Element('td', {
            'class':'legend_module_vertical_align'
        }).insert('<div class="' + legend[i]['img'] + ' legend_module_column_' + (i % cols) + '"'+title+'>'+imageArial+'</div>');
        var text = new Element('td', {
            'class':'legend_module_vertical_align'
        }).insert("<div class='legend_module_text'>"+legend[i]['text']+"</div>");
        rows.insert(img);
        rows.insert(text);
        tBody.insert(rows);
    }
    return contain;
}


/**
 *@param str {String} string where searching(case insensitive)
 *@param search {String} searched string/array of searched strings
 *@param emphasizeClass {String} name of the css Class used to emphasized the searched string
 *@description returns the str string with the search string/search array emphasized in it
 *@returns String
 */
function underlineSearch(str, search, emphasizeClass) {
    //If the search variable is an array, then we underline differently
    if(Object.isArray(search)) {
        var strArray = $A();
        //Offset: to keep track of the index where we need to underline,
        //after adding the underlining code
        var classOffset = emphasizeClass.length;
        var cssOffset = 22;
        var offsetPerUnderline = classOffset + cssOffset;
        //First we create an array that contains true for every character
        //that we need to underline
        for (var i = 0; i < search.length; i++) {
            var index = str.toLowerCase().indexOf(search[i].escapeHTML());
            //For every letter of the found word, we put the corresponding part of the array to true
            if(index != -1) {
                for(var j = 0; j<search[i].escapeHTML().length; j++) {
                    strArray[index+j] = true;
                }
            }
        }
        var k = 0;
        var offset = 0;
        //We go through the array that contains which characters should be underlined
        while(k < strArray.size()) {
            //If a part has to be underlined, we add the code that underlines the characters
            //and calculate the offset for the next underlining
            if (strArray[k]) {
                var startIndex = k;
                while (strArray[++k]) ;
                var correctCapEntry = str.substring(startIndex + offset, k + offset);
                var str1 = str.slice(0, startIndex + offset);
                var str2 = str.slice(k + offset, str.length);
                str = str1 +"<span class='" + emphasizeClass + "'>" + correctCapEntry + "</span>" + str2;
                offset += offsetPerUnderline;
            //We go through the characters until one needs to be underlined
            } else
                k++;
        }
        //we return the underlined string
        return str;
    } else
        //If we only need to underline one word
    return str.gsub(new RegExp(search, "i"), function(match) {
        return "<span class='" + emphasizeClass + "'>" + match + "</span>";
    });
}
/**
 * @param aSeparators {Array} An array of characters that are going to be treated as separators
 * @description Method that returns the string that calls it splitted into parts for all the specified separators
 * 		 Example:
 * 		 var str = 'Francisco.Catacroker@northgatearinso.com';
 * 		 str.multiSeparatorsSplit();
 * 		 -> ['Francisco','Catacroker','northgatearinso','com']
 * - It's important to take into account that character considered as special characters in regular expressions
 *   need to be escaped. Taking that into account will avoid regular expression of being computed. However regular
 *   expressions could also be used to select the characters that will be taken as separators. e.g. use '\\.' instead
 *   of '.'
 * @returns {Array} An array containing the calling string splitted
 */
String.prototype.multiSeparatorsSplit = function(aSeparators) {
    if (!aSeparators) {
        aSeparators = [',', '\\.', '@'];
    }
    var substituteString = this;
    //Change any separator on the list to be a blank space
    for (i = 0; i < aSeparators.length; i++) {
        var separator = aSeparators[i];
        substituteString = substituteString.gsub(separator, ' ');
    }

    return substituteString.split(' ');
};

/**
*@param xmlDoc the xml document
*@param xslDoc the xsl document
*@param virtualHtml the html element where the result will be updated
*@description transforms the xml document with the xsl document and
*updates the virtualHTML with the html result
*@returns Boolean
*/

function xslTransformation (xmlDoc, xslDoc, virtualHtml) {

    if (!xmlDoc || !xslDoc || !virtualHtml) {
        return false;
    }

    if (document.implementation && document.implementation.createDocument) { //Mozilla
        var xsltProcessor = new XSLTProcessor();
        xsltProcessor.importStylesheet(xslDoc);
        var resultDocument = xsltProcessor.transformToFragment(xmlDoc, document);

        virtualHtml.update();
        virtualHtml.appendChild(resultDocument);
    } else if (window.ActiveXObject) { // IE
        
        virtualHtml.update(xmlDoc.transformNode(xslDoc));
    } else {
        return false;
    }

    return true;
}



/**
 *@param xml {IXMLDOMDocument2} the xml we want to search in
 *@param sXPath {String} XPath that guides to the correct nodes
 *@description returns, just in case the current browser was Firefox, a set
 *of nodes corresponding to the sXPath passed as a parameter
 *@returns Array
 */
function selectNodesFireFox(xml,sXPath) {
    var oEvaluator = new XPathEvaluator();
    var oResult = oEvaluator.evaluate(sXPath, xml.documentElement, null,XPathResult.ORDERED_NODE_ITERATOR_TYPE, null);
    var aNodes = new Array();
    if (oResult != null) {
        var oElement = oResult.iterateNext();
        while(oElement) {
            aNodes.push(oElement);
            oElement = oResult.iterateNext();
        }
    }
    return aNodes;
}
/**
 *@param xml {IXMLDOMDocument2} the xml we want to search in
 *@param xPath {String} XPath that guides to the correct nodes
 *@description returns a set of nodes corresponding to the sXPath passed as a parameter. It is
 *crossbrowser
 *@returns Array
 */
function selectNodesCrossBrowser(xml, xPath) {
    if (Prototype.Browser.IE) {

        return xml.selectNodes(xPath);
    } else if (Prototype.Browser.Gecko || Prototype.Browser.WebKit) {

        return selectNodesFireFox(xml, xPath);
    }
}

/**
 *@description create an XML document
 *@returns IXMLDOMDocument2
 */
function XmlDoc() {}

XmlDoc.create = function() {
    if (Prototype.Browser.IE) {
        var xmlDoc = new ActiveXObject("Microsoft.XMLDOM");
        return xmlDoc;
    } else if (Prototype.Browser.Gecko) {
        var doc = document.implementation.createDocument("", "", null);
        return doc;
    }
    else {
        var doc = document.implementation.createDocument("", "", null);
        return doc;
    }
};
/**
 *@param xmlDoc {IXMLDOMDocument2} the xml we want to search in
 *@param elementPath {String} XPath that guides to the correct node
 *@description returns a nodes corresponding to the elementPath passed as a parameter. It is
 *crossbrowser
 *@returns IXMLDOMDocument2
 */
function selectSingleNodeCrossBrowser(xmlDoc, elementPath) {
    if (Prototype.Browser.IE) {
        return xmlDoc.selectSingleNode(elementPath);
    } else if (Prototype.Browser.Gecko) {
        var xpe = new XPathEvaluator();
        var nsResolver = xpe.createNSResolver(xmlDoc.ownerDocument == null ? xmlDoc.documentElement : xmlDoc.ownerDocument.documentElement);
        var results = xpe.evaluate(elementPath, xmlDoc, nsResolver, XPathResult.FIRST_ORDERED_NODE_TYPE, null);

        return results.singleNodeValue;
    }
    else {
        var xpe = new XPathEvaluator();
        var nsResolver = xpe.createNSResolver(xmlDoc.ownerDocument == null ? xmlDoc.documentElement : xmlDoc.ownerDocument.documentElement);
        var results = xpe.evaluate(elementPath, xmlDoc, nsResolver, XPathResult.FIRST_ORDERED_NODE_TYPE, null);

        return results.singleNodeValue;
    }
}
/**
 *@param xml {IXMLDOMDocument2} The xml to be read
 *@param xPath {String} The XPATH expression to locate the node within the xml
 *@description we get the node value specified by the xPath. ItÂ´s a crossbrowser function
 *@returns String
 */
function readXmlText(xml, xPath) {
    var node;
    node = selectSingleNodeCrossBrowser(xml, xPath);
    if (node) {
        if (document.implementation) {
            if (node.firstChild != null) {

                return node.firstChild.nodeValue;
            } else {

                return node.text;
            }
        }
    } else {

        return "";
    }
}
/**
* @description Gets the text from a node
* @param element Element
* @returns {String} The node text
*/
function getText(element) {
    if (Prototype.Browser.IE) {

        return element.text.strip();
    } else if (Prototype.Browser.Gecko || Prototype.Browser.WebKit) {

        return element.textContent.strip();
    }
    else {
        return element.textContent.strip();
    }
}
/**
* @description Reads a XML file for a given path
* @param path
* @returns The XMl doc
*/
function readXmlFile(path) {
    xmlDoc = XmlDoc.create();
    xmlDoc.async = false;
    xmlDoc.load(path);
    return xmlDoc;
}
/**
 *@param strParamName {String} Parameter name to retrieve
 *@description obtains get parameters by name
 *@returnsString
 */
function getURLParam(strParamName) {
    var strHref = window.location.href;
    var params = strHref.toQueryParams();
    var firstPartParams = $H(strHref.toQueryParams());
    var secondPartParams = $H(strHref.substr(strHref.indexOf("#") + 1).toQueryParams());
    var result = firstPartParams.merge(secondPartParams);
    return (result.get(strParamName)) ? result.get(strParamName) : '';
}

/**
 * @description This method checks if a click is outside or inside an element
 * @param elemId ID of the element to check if the click is outside of it
 * @param evet Event information
 * @returns a boolean value indicating if the click is inside of the element or not
 */
function clickedOutsideElement(elemId, evt) {
    var theElem = '';
    if (window.event)
        theElem = _getEventTarget(window.event);
    else theElem = _getEventTarget(evt);
    while (theElem != null) {
        if (theElem.id == elemId)
            return false;
        theElem = theElem.offsetParent;
    }
    return true;
}

/**
 * @description Auxiliar function for clickOutsideElement, gets the target of the event
 * @param evt {Event} The event to get the target
 * @returns The target
 */
function _getEventTarget(evt) {
    var targ = (evt.target) ? evt.target : evt.srcElement;
    if(targ != null) {
        if (targ.nodeType == 3) targ = targ.parentNode;
    }

    return targ;
}

/**
 *@param xmlstring {String} String to convert
 *@description Converts a string into a XML document.
 *@returns xml {IXMLDOMDocument2}
 */
function stringToXML(xmlstring) {
    var xml;
    if (Prototype.Browser.IE) {
        xml = XmlDoc.create();
        xml.loadXML(xmlstring);
    } else {
        var parser = new DOMParser();
        xml = parser.parseFromString(xmlstring, "text/xml");
    }

    return xml;
}
/**
 *@param node {XML Node} Node from where got the xml text
 *@description Gets a xml document or node xml text(structure)
 *@returns String
 */
function xmlToString(node) {
    var text = '';
    if (Prototype.Browser.IE) {
        text = node.xml;
    } else {
        var serializer = new XMLSerializer();
        text = serializer.serializeToString(node);
    }

    return text;
}
/**
 * Inserts text in text area 
 * @param text The text to insert
 * @param textArea The textArea where we want to insert the text
 */
function insertTextInTextArea(text, textArea) {
    if (text != null) {
        text = text.gsub("\\n", "");
        textArea.update("");
        var linesToInsert = text.split("<br/>");
        for (var i = 0; i < linesToInsert.size() - 1; i++) {
            if(Object.isEmpty(linesToInsert[i])){
                textArea.insert("&nbsp;")
            }
            textArea.insert(linesToInsert[i]);
            if (Prototype.Browser.IE) {
                textArea.insert("<br/>");
            } else {
                textArea.insert("\n");
            }
        }
        textArea.insert(linesToInsert.last());
    } else {
        textArea.insert("");
    }    
}
/**
 * Will put <br /> tags in the spaces in a text to make sure the words go to the next line in elements that don't support auto wrap (Buttons in IE) 
 * @param value The text to check for
 * @param maxLength The maxmimum length each line can be
 * NOTE: If a certain word in the text is longer than the maxLength it will not be split.
 */
function wordWrap(value, maxLength){
	if (value.length > maxLength){
		var lines = [];
		var extracted = [];
		var currentline = "";
		while(value.indexOf(" ") != -1){
		    extracted.push(value.substring(value.lastIndexOf(" ") + 1));
		    value = value.substring(0, value.lastIndexOf(" "));
		}
		extracted.push(value);
		extracted.reverse();
		for(var i = 0; i < extracted.length; i++){
		    if((currentline + " " + extracted[i]).length < maxLength){
		        if(i != 0){
		            currentline = currentline + " " + extracted[i];
		        }else{
		            currentline = extracted[i];
		        }
		    }else{
		        lines.push(currentline);
		        currentline = extracted[i];
		    }
		}
		lines.push(currentline);
//		    var extracted = value.substring(value.indexOf(" ") + 1);
//		    value = value.substring(0, value.indexOf(" "));
////			var extracted = value.substring(value.lastIndexOf(" ") + 1);
////			value = value.substring(0, value.lastIndexOf(" ")); 
////			if ((currentline.length + extracted.length + 1) > maxLength){
////				currentline = extracted;
////				lines.push(currentline);
////			}
////			else{
////				currentline = extracted + " " + currentline;
////			}			
			
		var returnvalue = "";
		lines.reverse();
		for (var i=0;i<lines.length;i++){
			returnvalue = lines[i] + "<br /> " +  returnvalue;
		}
		return returnvalue;	
	}
	else{
		return value;
    }    
}
/**
 * Checks if a certain path exists on the JSON. For example sometimes, we don't know if the nodes in between on a path
 * are empty. So we need to check all the nodes in order to avoid crashes.
 * @param json The JSON we are gonna make the check
 * @param route The route to check e.g. this.is.a.json.route (By default . as separator)
 * @param split The node separator in the route (By default .)
 * @return A boolean depedending of whether the path exists or not
 */
Object.jsonPathExists = function(json,route,split) {
    //Checking if there is a split defined, if not, taking the default
    if(!split)
        split = '.';
    //Getting the route parts
    var parts = route.split(split);
    //Points to the currently parsed node
    var currentRoute = json;
    if(!json)
        return false;
    //Stores if the route is valid or not
    var validRoute = true;
    //Going through all the nodes to check them
    $A(parts).each(function(item) {
        if(currentRoute) {
            if(currentRoute[item])
                currentRoute = currentRoute[item];
            else {
                validRoute = false;
                //Breaking the each execution
                throw $break;
            }
        }
        else
            //Breaking the each execution
            throw $break;
    });
    //Returning the value
    return validRoute;
};

/**
 * @param obj {Object}
 * @description Method that compares the incoming object with [null, undefined and a blank string], it will return true
 *           if the object is any of these values
 * @returns {boolean} True or false
 */
Object.isEmpty = function(obj) {
    if (Object.isUndefined(obj))

        return true;
    else if (obj == null)

        return true;
    else if (typeof obj == "string" && obj == "")

        return true;
    else
        return false;
};
/**
 * Centers an element in the screen
 * @param {Element|String} centerElement The element to be centered
 * @param {Element|String} contentElement The container of the element to be centered
 * @param {Boolean} onlyHorizontal When true the element is centered only in horizontal
 * 					and vertically it's put in the top 7/8 of the screen.
 * @return {Boolean} False if parameters are not correct
 */
function centerContainer(centerElement, contentElement, onlyHorizontal ) {
    contentElement = $(contentElement);
    centerElement = $(centerElement);
    //gracefully fails if elements arn't in DOM
    if(!contentElement || !centerElement){
        return false;
    }
    //Assign the proper margins
    var marginTop = 0;
    if(onlyHorizontal){
        marginTop = document.viewport.getHeight() * 0.375;
    }else{
        marginTop = contentElement.getHeight() / 2;
    }
    var marginLeft = contentElement.getWidth() / 2;
    centerElement.setStyle({
        marginTop: '-' + marginTop + 'px',
        marginLeft: '-' + marginLeft + 'px'
    });
    // IE6 Correction.
    if((self.navigator.userAgent).indexOf("MSIE 6.0") > -1) {
        contentElement.setStyle({
            marginTop: document.documentElement.scrollTop + 'px',
            position: 'absolute'
        });
    }
}
/**
 * Checks if a certain path exists on the JSON. For example sometimes, we don't know if the nodes in between on a path
 * are empty. So we need to check all the nodes in order to avoid crashes.
 * @param json The JSON we are gonna make the check
 * @param route The route to check e.g. this.is.a.json.route (By default . as separator)
 * @param split The node separator in the route (By default .)
 * @return A boolean depedending of whether the path exists or not
 */
Object.jsonPathExists = function(json,route,split) {
    //Checking if there is a split defined, if not, taking the default
    if(!split)
        split = '.';
    //Getting the route parts
    var parts = route.split(split);
    //Points to the currently parsed node
    var currentRoute = json;
    //Stores if the route is valid or not
    var validRoute = true;
    //Going through all the nodes to check them
    $A(parts).each(function(item) {
        if(currentRoute) {
            if(currentRoute[item])
                currentRoute = currentRoute[item];
            else {
                validRoute = false;
                //Breaking the each execution
                throw $break;
            }
        }
        else
            //Breaking the each execution
            throw $break;
    });
    //Returning the value
    return validRoute;
};

/**
 * @method objectToArray
 * @param obj {Object} : Object we want to convert
 * @description This function will convert an object into an array
 *       (if the object is an array, it will return the same object)
 * @return {Array} Array with the object or the object itself
 */
function objectToArray(obj) {
    if (!Object.isArray(obj) && !Object.isHash(obj)) {
        var objArray = [obj];
        return objArray;
    }
    return obj;
}
/**
 * @method toVerticalString
 * @param string {string} : string we want to display as a vertical div
 * @description This function will convert a string in an html element, each character separated with <br>
 * @return {html} Html code, the characters separated by <br> 
 */
function toVerticalString(string){
    var html = '<br/>';
    for(var i=0; i < string.length; i++){
        html += string.substr(i,1)+'<br/>';
    }
    return html;
}
/**
 * Retrieves the index for elements that have a specific attribute with a specific value
 * @param {Object} array The array where we want to search
 * @param {Object} attribute The attribute's name
 * @param {Object} value The value for the attribute
 * @param {Object} multiple (false) (optional) If set to true returns all the indexes for every element that matches
 * @return If multiple: will return an Array with the indexes (it may be empty).
 *         If not multiple: returns the index for the first element that mathces, or -1 it there is no match
 */
function getElementIndex(array, attribute, value, multiple){
	if(multiple){
        var result = $A();	
	}else{
        var result = -1;
	}
	var size = array.size();
	for(var i=0; i<size; i++){
		if(array[i][attribute]==value){
			if(multiple)
				result.push(i);
			else
				return i;
		}
	}
	return result;
}

/**
* Show an address in Google Maps 
* 
* @param {String}
*            Is the address parameters (country, state/region, city, postal code, street and house numbrer) in this order, concatenated and separated by space. If any of these parameters is not available, insert a empty character "".
* @param {String}
*            Specifies where to open the linked document ( for example “_blank” open the linked document in a new window or tab ).
* @param {String}
*            Width of the Google Maps screen in pixels.
* @param {String}
*            Height of the Google Maps screen in pixels.
* @param {String}
*            It be able to resizing the screen. Posible values:"yes" or "no".*/

function showGoogleMaps(address, target, width, height, resize) {

    // Build the final url. NOTE: gsub function replace "spaces" by "+"
    var url = 'http://maps.google.com/?q=' + address.gsub(' ', '+') + '&output=embed&';

    // Call to open the Google Maps aplication to the target browser screen 
    window.open(url, target, 'width=' + width + ', height=' + height + ',  resizable =' + resize);
}

/**
 * Inserts an element in an array in a position without overwriting and returns the position where it has been inserted
 * @param {Object} array
 * @param {Object} position
 * @param {Object} element
 */
function insertArrayNoOverwrite(array, position, element){
    if ( position==null || isNaN(position) || position=="") {
        position = 0;
		return;
    }
    while(!Object.isUndefined(array[position])){
        position++;
    }
    array[position] = element;
	return position;
}

/**
 * Escapes the string as HTML, also scaping " and '
 * @param {Object} string
 */
function escapeHTML(string){
    return string.escapeHTML().gsub("'", "&#39;").gsub('"', "&quot;");
}
/**
 * Unescapes the string as HTML, also unescaping " and '
 * @param {Object} string
 */
function unescapeHTML(string){
    return string.unescapeHTML().gsub("&#39;", "'").gsub("&quot;", '"');
}
/**
* shows/hides all child nodes of the element passed
* @param {element} DOM Object
* @param {show} boolean. If this is true the nodes are shown, if not they are hidden.
*/
function toggleChildsOfElement(element,show){
    if(element.childElements().length > 0){
        var childElements = element.childElements();
        for(var i = 0; i < childElements.length; i++){
            if(show){
                childElements[i].show();
            }else{
                childElements[i].hide();
            }
        }
    }
}
/**
 * @constructor
 * @description Stores the services and contains function to get the services
 */
var ServicesCache = Class.create(
/**
 * @lends ServicesCache
 */
{
    /**
	 * @description The services map hash, this HASH KEY information about the services storage
	 * @type Hash
	 */
    servicesMap: $H({
        //Inbox services
        get_task_detail: {
            store: true
        },
        get_task_labels: {
            store: true
        },
        get_gl_time: {
            store: true
        },
        get_inbox_lst: {
            refresh: $H({
                get_events: function(jsonIn, jsonOut){
                    return true;
                },
                get_timesheet: function(jsonIn, jsonOut){
                    return true;
                },
                get_gl_time: function(jsonIn, jsonOut){
                    return true;
                }
            })
        },
        //My Delegations services
        get_delegations_list: {
            store: true
        },
        delegation_handler: {
            refresh: $H({
                get_current_delegations: function(jsonIn, jsonOut){
                },
                get_delegated_employees: function(jsonIn, jsonOut){
                }
            })
        },
        delegation_form: {
            store: true
        },
        //Time Entry
        save_event: {
            refresh: $H({
                get_events: function(jsonIn, jsonOut){
                    return true;
                },
                get_timesheet: function(jsonIn, jsonOut){
                    return true;
                },
                get_gl_time: function(jsonIn, jsonOut){
                    return true;
                }
            })
        },
        save_recur: {
            refresh: $H({
                get_events: function(jsonIn, jsonOut){
                    return true;
                },
                get_timesheet: function(jsonIn, jsonOut){
                    return true;
                },
                get_gl_time: function(jsonIn, jsonOut){
                    return true;
                }
            })
        },
        rmv_doc_cover: {
            refresh: $H({
                get_events: function(jsonIn, jsonOut){
                    return true;
                }
            })
        },
        //Monthly Calendar
        get_con_actio: {
            store: true
        },
        //List Calendar
        get_history_labels: {
            store: true
        },
        get_event_types: {
            store: true
        },
        get_event_statuses: {
            store: true
        },
        //Quotas
        get_quotas: {
            store: true
        },
        get_quotas_labels: {
            store: true
        },
        get_result: {
            store: true
        },
        exec_report: {
            store: true
        },
        //Payslip
        getpayslipform: {
            store: true
        },
        getpayslipyears: {
            store: true
        },
        getpayslipperiod: {
            store: true
        },
        //Team Calendar
        get_cal_label: {
            store: true
        },
        getmyteam: {
            store: true
        },
        get_events: {
            store: true
        },
        get_cal_menu: {
            store: true
        },
        get_dws_details: {
            store: true
        },
		//PFM: GET_WAERS_ALL
		get_waers_all: {
            store: true
        },        
        //In progress
        get_inprogress_labels: {
            store: true
        },
        get_booked_trainings: {
            store: true
        },
        get_booked_sessions: {
            store: true
        },
        //History
        get_training_history: {
            store: true
        },
        get_content: {
            store: true,
            refresh: $H({
                get_content: function(jsonIn, jsonOut){
                    return (jsonIn.EWS.PARAM.APPID == "PFM_DEV" ||
                        jsonIn.EWS.PARAM.APPID == "PFM_MUP") ;
                }
            })
        },
        get_content2: {
            store: true,
            refresh: $H({
                get_content2: function(jsonIn, jsonOut) {
                    return (jsonIn.EWS.PARAM.APPID == "OM_OMOD" ||
                        jsonIn.EWS.PARAM.APPID == "OM_SMOD" ||
                        jsonIn.EWS.PARAM.APPID == "OM_SNEW" ||                        
                        jsonIn.EWS.PARAM.APPID == "OM_ACHA" ||
                        jsonIn.EWS.PARAM.APPID == "OM_ACHAO" ||
                        jsonIn.EWS.PARAM.APPID == "OM_CH_SU" ||
                        jsonIn.EWS.PARAM.APPID == "OM_BA_AS" ||
                        jsonIn.EWS.PARAM.APPID == "OM_BA_N" ||
                        jsonIn.EWS.PARAM.APPID == "OM_BA_UP" ||
                        jsonIn.EWS.PARAM.APPID == "OM_KCHAO" ||
                        jsonIn.EWS.PARAM.APPID == "OM_SDIS" ||
                        jsonIn.EWS.PARAM.APPID == "OM_ODIS" ||
                        jsonIn.EWS.PARAM.APPID == "JOB_DF" ||
                        jsonIn.EWS.PARAM.APPID == "JOB_F_DF" ||
                        jsonIn.EWS.PARAM.APPID == "JOB_F_UP" ||
                        jsonIn.EWS.PARAM.APPID == "JOB_FN_F" ||
                        jsonIn.EWS.PARAM.APPID == "JOB_ADD" ||
                        jsonIn.EWS.PARAM.APPID == "OM_MAS" ||
                        jsonIn.EWS.PARAM.APPID == "JOB_CHC" ||
                        jsonIn.EWS.PARAM.APPID == "JOB_CH9C" ||
                        jsonIn.EWS.PARAM.APPID == "JOB_CHJF" ||
                        jsonIn.EWS.PARAM.APPID == "JOB_FN_D" ||                
                        jsonIn.EWS.PARAM.APPID == "PFM_MUP" ||
                        jsonIn.EWS.PARAM.APPID == "TM_D_SEA" ||
                        jsonIn.EWS.PARAM.APPID == "TM_D_EVA" ||
                        jsonIn.EWS.PARAM.APPID == "TM_D_PRE" ||
                        jsonIn.EWS.PARAM.APPID == "TM_D_MAN" ||
                        jsonIn.EWS.PARAM.APPID == "TM_D_BOO" ||
                        jsonIn.EWS.PARAM.APPID == "PFM_DEV" ||
                        jsonIn.EWS.PARAM.APPID == "RC_REFER" ||
                        jsonIn.EWS.PARAM.APPID == "RC_COMM" ||
                        jsonIn.EWS.PARAM.APPID == "RC_PASS" ||
                        jsonIn.EWS.PARAM.APPID == "RC_DELP" ||
                        jsonIn.EWS.PARAM.APPID == "RC_PRIV");
                }
            })
        },
        save_tim_inf: {
            refresh: $H({
                get_events: function(jsonIn, jsonOut) {
                    return  (jsonIn.EWS.PARAM.APPID == "TIM_INF");
                },
                get_content2: function(jsonIn, jsonOut) {
                    return  (jsonIn.EWS.PARAM.APPID == "TIM_INF");
                },
                get_gl_time: function(jsonIn, jsonOut){
                    return true;
                }
            })
        },
        save_request: {
            refresh: $H({
                get_content: function(jsonIn, jsonOut){
                    return true;
                },
                get_content2: function(jsonIn, jsonOut) {
                   return   (jsonIn.EWS.PARAM.APPID == "TIM_CLK");                
                },
                get_om: function(jsonIn, jsonOut) {
                    return true;
                },
                GET_WIDGETS: function(jsonIn, jsonOut) {
                    return (jsonIn.EWS.PARAM.CONTAINER == "PFM_IOV" ||
	                        jsonIn.EWS.PARAM.CONTAINER == "RC_APPLI");
                },
                GET_EVENTS: function(jsonIn,jsonOut) {
                    return (jsonIn.EWS.PARAM.APPID == "PD_MAT") ||
                           (jsonIn.EWS.PARAM.APPID == "TIM_CLK");
                }
            })
        },
        days_pai: {
            refresh: $H({
                get_content: function(jsonIn, jsonOut){
                    return true;
                }
            })
        },
        //OM
        save_os: {
            refresh: $H({
                get_om: function(jsonIn, jsonOut) {
                    return true
                }
            })
        },
        save_multi_pos: {
            refresh: $H({
                get_om: function(jsonIn, jsonOut) {
                    return true
                }
            })
        },
        save_orequest: {
            refresh: $H({
                get_om: function(jsonIn, jsonOut) {
                    return true
                }
            })
        },
        save_transf: {
            refresh: $H({
                get_om: function(jsonIn, jsonOut) {
                    return true
                }
            })
        },
        save_pos: {
            refresh: $H({
                get_om: function(jsonIn, jsonOut) {
                    return true
                }
            })
        },
        save_assignm: {
            refresh: $H({
                get_om: function(jsonIn, jsonOut) {
                    return true
                }
            })
        },
        //Book
        cancel_prebooking: {
            refresh: $H({
                get_booked_trainnings: function(jsonIn, jsonOut){
                },
                get_booked_sessions: function(jsonIn, jsonOut){
                },
                get_prebook: function(jsonIn, jsonOut){
                }
            })
        },
        cancel_booking: {
            refresh: $H({
                get_booked_trainnings: function(jsonIn, jsonOut){
                },
                get_booked_sessions: function(jsonIn, jsonOut){
                },
                get_curriculms: function(jsonIn, jsonOut){
                }
            })
        },
        create_booking: {
            refresh: $H({
                get_booked_trainnings: function(jsonIn, jsonOut){
                },
                get_booked_sessions: function(jsonIn, jsonOut){
                }
            })
        },
        //Book Curriculum
        create_curr_booking: {
            refresh: $H({
                get_booked_trainnings: function(jsonIn, jsonOut){
                },
                get_booked_sessions: function(jsonIn, jsonOut){
                },
                get_curriculms: function(jsonIn, jsonOut){
                }
            })
        },
        get_curriculms: {
            store: true
        },
        //Prebook Application
        get_prebook: {
            store: true
        },
        create_prebooking: {
            refresh: $H({
                get_booked_trainnings: function(jsonIn, jsonOut){
                },
                get_booked_sessions: function(jsonIn, jsonOut){
                },
                get_curriculms: function(jsonIn, jsonOut){
                }
            })
        },
        //My Data
        get_my_data_groups: {
            store: true
        },
        get_widgets: {
            store: true,
            refresh: $H({
                get_widgets: function(jsonIn, jsonOut){
                    return (jsonIn.EWS.PARAM.CONTAINER == "PAY_WOB");
                }                         
            })
        },
        get_widget: {
            store: true
        },
        //OM
        get_om: {
            store: true
        },
        get_pers: {
            store: true
        },
        search_objects: {
            store: true
        },
        get_actions: {
            store: true
        },
        maint_object: {
            store: true,
            refresh: $H({
                get_om: function(jsonIn, jsonOut){
                    return (jsonIn.EWS.PARAM.O_ACTION == "C" || 
                        jsonIn.EWS.PARAM.O_ACTION == "M" ||
                        jsonIn.EWS.PARAM.O_ACTION == "D" ||
                        jsonIn.EWS.PARAM.O_ACTION == "L");
                },
                maint_trans: function(jsonIn, jsonOut){
                    return (jsonIn.EWS.PARAM.O_ACTION == "C" || 
                        jsonIn.EWS.PARAM.O_ACTION == "M" ||
                        jsonIn.EWS.PARAM.O_ACTION == "D" ||
                        jsonIn.EWS.PARAM.O_ACTION == "L");
                },
                maint_object: function(jsonIn, jsonOut){
                    return (jsonIn.EWS.PARAM.O_ACTION == "C" || 
                        jsonIn.EWS.PARAM.O_ACTION == "M" ||
                        jsonIn.EWS.PARAM.O_ACTION == "D" ||
                        jsonIn.EWS.PARAM.O_ACTION == "L");
                }
            })
        },
        maint_lang: {
            store: true
        },
        maint_assign: {
            refresh: $H({
                get_om: function(jsonIn, jsonOut){
                    return (jsonIn.EWS.PARAM.O_ACTION == "U" ||
                        jsonIn.EWS.PARAM.O_ACTION == "C" ||
                        jsonIn.EWS.PARAM.O_ACTION == "L" ||
                        jsonIn.EWS.PARAM.O_ACTION == "D");
                },
                maint_trans: function(jsonIn, jsonOut){
                    return (jsonIn.EWS.PARAM.O_ACTION == "U" ||
                        jsonIn.EWS.PARAM.O_ACTION == "C" ||
                        jsonIn.EWS.PARAM.O_ACTION == "L" ||
                        jsonIn.EWS.PARAM.O_ACTION == "D");
                }
            })
        },
        maint_trans: {
            refresh: $H({
                get_om: function(jsonIn, jsonOut){
                    return true;
                }
                ,
                maint_trans: function(jsonIn, jsonOut) {
                    return (jsonIn.EWS.PARAM.O_ACTION == "M");
                }
            })
        },
        my_details: {
            store: true
        },
		
        get_reports: {
            store: true
        },
        get_field_val: {
            store: true
        },
        get_scal_vals2: {
            store: true
        },        
        get_qualif_vals: {
            store: true
        },
        get_scal_vals: {
            store: true
        },        
        // Timesheet
        get_timesheet: {
            store: true
        },
        save_timesheet: {
            refresh: $H({
                get_timesheet: function(jsonIn, jsonOut){
                    return true;
                },
                get_events: function(jsonIn, jsonOut){
                    return true;
                }
            })
        },
        get_time_sched: {
            store: true
        },
        get_deliv: {
            store: true
        },
        get_location: {
            store: true
        },
                
        //Onboarding         
        save_car: {
            refresh: $H({
                get_content2: function(jsonIn, jsonOut){
                    return true;
                }
            })
        },
        eob_idtext_2: {
            store: true                      
        },     
        get_areas: {
            store: true                      
        },      
        get_eegrps: {
            store: true                      
        },
        get_dayws: {
            store: true                      
        },
        get_field_valg: {
            store: true                      
        },
        get_glb_content: {
            store: true
        },
        
        // Recruitment 
        rc_get_object: {
            store: true
        },
        rc_gbl_labels: {
            store: true
        },

        //Framework
        get_mycalendar: {
            store: true                      
        }
        
    }),
    /**
	 * @description stores all the called services
	 * @type Prototype.Hash
	 */
    cache: $H(),
    initialize: function() {

    },
    /**
	 * @description Stores a service on the cache
	 * @param {String} xmlIn the XML in that will form the key on the cache
	 * @param {JSON} xmlOut the content of the request
	 * @param {String} service The service name
	 */
    setService: function(xmlIn,xmlOut,service) {
        service = service.toLowerCase();
        if (this.store(service)) {
            //If the service doesn't exists on the cache we create it
            if (Object.isUndefined(this.cache.get(service)))
                this.cache.set(service, $H());
            //Storing the JSON object with the key generated from the xmlIn
            this.cache.get(service).set(this._generateKey(xmlIn), xmlOut);
        }
        var xmlParser = new XML.ObjTree();
        var jsonIn = xmlParser.parseXML(xmlIn);
        var jsonOut = xmlParser.parseXML(xmlOut);
        if (this.get(service) && this.get(service).refresh) {
            this.get(service).refresh.each(function(pair){
                var key = pair.key;
                var functionObject = pair.value;

                if (functionObject(jsonIn, jsonOut)) {
                    this.removeService(key);
                }
            }.bind(this));
        }
    },
    /**
	 * @description  Gets the service from the cache and return it
	 * @param {String} service The service name
	 * @param {String} xmlIn The XML in (key)
	 * @returns JSON object
	 */
    getService: function(service,xmlIn) {
        service = service.toLowerCase();
        return this.cache.get(service).get(this._generateKey(xmlIn));
    },
    /**
	 * @description Gets the service metadata.
	 * @paran {String} service the name of the service
	 * @return JSON the service metadata stored in a JSON object.
	 */
    get: function(service){
        service = service.toLowerCase();
        return this.servicesMap.get(service);
    },
    /**
	 * @description Gets whether the service has to be stored or not.
	 * @param {String} service the name of the service
	 * @return {Boolean} a boolean value. True only when the service data has to be stored. False otherwise
	 */
    store: function(service){
        service = service.toLowerCase();
        if (!Object.isUndefined(global.servicesCache.get(service))) {
            if (global.servicesCache.get(service).store != null) {
                return global.servicesCache.get(service).store;
            }else{
                return false;
            }
        }
    },
    /**
	 * @description Removes the service from the cache
	 * @param {String} service The service name
	 * @param {String} xmlIn the XML in (key)
	 */
    removeService: function(service) {
        service = service.toLowerCase();
        this.cache.unset(service);
    },
    /**
	 * @description Checks if the service is registed on the cache
	 * @param {String} service The service name
	 * @param {String} xmlIn The XML in (key)
	 */
    serviceExists: function(service,xmlIn) {
        if(this.cache.get(service) != undefined)
            if(this.cache.get(service).get(this._generateKey(xmlIn)) != undefined)
                return true;
        return false;
    },
    /**
	 * @description Generates an unique key from the XML in
	 * @param {String} xmlIn
	 * @returns The formed key
	 */
    _generateKey: function(xmlIn) {
        var key = 0;
        var div = 1;
        var lastCode = xmlIn.charCodeAt(0);
        for(var i = 0; i < xmlIn.length; i++) {
            lastCode += xmlIn.charCodeAt(i)*div;
            key += lastCode;
            key += xmlIn.charCodeAt(i);
            if(i > 0)
                div = lastCode%xmlIn.charCodeAt(i-1);
        }
        return key;
    }
});

/**
 * Redirects the browser to a page after some seconds
 * @param url The url we want to redirect to
 * @param seconds How many seconds we need to wait until we redirect
 * @param infoSpan A span that
 */
function redirectAfterSeconds(url, seconds, infoSpan){
    if(seconds<=0){
        //Redirect
        window.location = url;
    }else{
        //Update span (if there is span) and wait another second
        if(!Object.isEmpty(infoSpan)){
            infoSpan.update(seconds + "s...");
        }
        redirectAfterSeconds.delay(seconds-1, url, seconds-1, infoSpan);
    }
}

/**
 * @constructor
 * @description the parent class of any other from our application give us the ability to make an AJAX request with the proper parameters
 */
var origin = Class.create(
/**
* @lends origin
*/
{
initialize: function (target) {
    /**
    * @type String
    * @description id widget div
    */
    this.target = target;
    /**
    * @type String
    * @description url of back-end system
    */
    this.url = __hostName;

    this.created = false;
    /**
    * @type String
    * @description method for ajax request, by default POST
    */
    this.method = "POST";
    /**
    * @type Hash
    * @description hash containing labels from last call
    */
    this.labels = $H({});
    /**
    * @type Hash
    * @description hash containing all the possible translations for the failure method in get_usettings
    */
    this.languagesFail = $H({
        'EN': "Application is currently experiencing problems. Please try again later.",
        'ES': "La Aplicaci\u00f3n est\u00e1 experimentando problemas en este momento. Por favor, int\u00e9ntelo m\u00e1s tarde.",
        'FR': "L'application conna\u00eet actuellement des probl\u00e8mes. Veuillez r\u00e9essayer plus tard.",
        'NL': "Er is momenteel een probleem met van de toepassing. Gelieve later opnieuw te proberen.",
        'IT': "\u00c8 accaduto un problema dell'applicazione. Vi preghiamo di riprovare pi\u00f9 tardi."
    });
},
/**
* @description requests the proper service to the back-end
*/
requestData: function (options) {
    var call = new Call(this, options);
},
/**
* @description Performs an AJAX request
* @param options
*            The AJAX request options
*/
makeAJAXrequest: function (options) {
    if (global) {
        if (!Object.isEmpty(options.get('loading'))) {
            global.showLoadingMsg = options.get('loading');
        }
        else {
            global.showLoadingMsg = true;
        }
    }
    if (this.appName) {
        var area = global.tabid_mnmid.get(this.appName);
        if (global.labelsCache.get(area) == undefined) {
            this.requestLabels = true;
            this.labelsArea = area;
        }
    }
    this.requestData(options);
},
/**
* This method show the default error, warning, and info text messages
* @param {Object} data The data that comes from the service
* @param {Object} serviceName
* @param {Object} status
*/
_failureMethod: function (data, serviceName, status) {
    //First we get the text message depending on the type of error:
    var errorToShow = "";
    if (data) {
        //If there is data, we just have to show the message
        errorToShow = data.EWS.webmessage_text;
    } else {
        //If there is no data it means that the service has not been called correctly,
        //or there is a connection problem
        if (global) {
            //If we have global, eWS is already running
            if (status == '499') {
                var logOffXml = "<EWS><SERVICE>CLEAR_SESSION</SERVICE><PARAM><SSO>CLEAR</SSO><AREA/></PARAM></EWS>";
                this.makeAJAXrequest($H({
                    xml: logOffXml,
                    successMethod: this._redirectToLoginPage.bind(this, data, global.getLabel("loggedOff"))
                }));
                return
            } else {
                //No information about the error: we assume it is a connection problem
                errorToShow = global.getLabel('connectionError');
            }
        } else {
            //If we don't have global, it is GET_USETTINGS service that has failed,
            //we get the predefined message for the language
            if (!navigator.userLanguage) {
                var language = navigator.language.toUpperCase(); //Navigator FF, Chrome
            }
            else {
                var language = navigator.userLanguage.toUpperCase(); // Navigator IE
            }
            
            if (Object.isEmpty(this.languagesFail.get(language)))
                errorToShow = this.languagesFail.get('EN');
            else
                errorToShow = this.languagesFail.get(language);
        }
    }
    //Now we should have an error message to show in errorToShow
    if (!global) {
        //No global, we must show a message and redirect to loginPage
        var logOffXml = "<EWS><SERVICE>CLEAR_SESSION</SERVICE><PARAM><SSO>CLEAR</SSO><AREA/></PARAM></EWS>";
        this.makeAJAXrequest($H({
            xml: logOffXml,
            successMethod: this._redirectToLoginPage.bind(this, data, errorToShow)
        }));
    } else {
        //If eWS is active, create a popUp or add the message to the one existing:
        if (Object.isEmpty(global.currentPopUp)) {
            //Create a new popup
            this._createErrorPopup(errorToShow, serviceName);
        } else {
            //Add the info to the existing popup
            this._addErrorToPopup(errorToShow, serviceName);
        }
    }
},
/**
* Adds an error information to the already existing popup
* @param {Object} errorToShow
* @param {Object} serviceName
*/
_addErrorToPopup: function (errorToShow, serviceName) {
    var elementToInsert = new Element("div", {
        "class": "fwk_additionalErrorPopup"
    });
    var detailsDiv = new Element("div", {
        "class": "fwk_additionalErrorDetails application_main_soft_text"
    })


    detailsDiv.hide();
    var showHideButton = new Element("button", {
        "class": "fwk_additionalErrorShowDetails",
        "title": global.getLabel('showTech')
    });
    if (global.liteVersion) {
        showHideButton.update("+");
    }
    showHideButton.observe("click", this._showHideElement.bind(this, detailsDiv, showHideButton));
    var timeInfo = new Date().setTimeToNow().toString("HH:mm");
    var timeInfoSpan = new Element("span", {
        "class": "fwk_timeInfo"
    }).insert(timeInfo);
    var classesForButton = "fwk_additionalErrorRemoveButton";
    if (!global.liteVersion) {
        classesForButton += " application_currentSelection";
    }
    var removeButton = new Element("button", {
        "class": classesForButton,
        "title": global.getLabel("remove")
    });
    if (global.liteVersion) {
        removeButton.update(global.getLabel("remove"));
    }
    //If the service in undefined we don't show any description requested by AMP
    if (!Object.isEmpty(serviceName)) {
        detailsDiv.insert('(' + global.getLabel('techRef') + ' : &lt;Service ID&gt; ' + serviceName + ')');
    }
    else {
        showHideButton.setStyle("visibility:hidden");
    }
    removeButton.observe("click", this._removeErrorElement.bind(this, elementToInsert));
    elementToInsert.update(showHideButton);
    elementToInsert.insert(timeInfoSpan);
    elementToInsert.insert("&nbsp;" + errorToShow);
    elementToInsert.insert(removeButton);
    elementToInsert.insert(detailsDiv);
    global.currentPopUp.insert(elementToInsert);

},
/**
* Removes the error element
* @param {Object} element
*/
_removeErrorElement: function (element) {
    //Remove the error
    element.remove();
    //If there are no more errors, close the popup (if it is an error popup)
    if (!Object.isEmpty(global.infoFailurePopup)) {
        if (Object.isEmpty(global.infoFailurePopup.obHtmlContent.innerHTML)) {
            this._closeErrorPopup();
        }
    }
},
/**
* Creates an error popup
* @param {Object} errorToShow The text error to show
* @param {Object} serviceName Name of the service that failed
*/
_createErrorPopup: function (errorToShow, serviceName) {
    //Create the popup 
    global.infoFailurePopup = new infoPopUp({
        closeButton: $H({
            'callBack': this._closeErrorPopup.bind(this)
        }),
        htmlContent: new Element("div"),
        indicatorIcon: 'exclamation',
        width: 500,
        contentClass: "fwk_errorPopupContent"
    });
    global.infoFailurePopup.create();
    this._addErrorToPopup(errorToShow, serviceName)
},
/**
* Closes the error popup
* @param {Object} popup
*/
_closeErrorPopup: function () {
    global.infoFailurePopup.close();
    delete global.infoFailurePopup;
},
/**
* Toggles the visualization of an element, also changing the label of a button from hide to show or the other way
* @param {Object} element The element to show/hide
* @param {Object} button The button that must change labels
*/
_showHideElement: function (element, button) {
    if (element.visible()) {
        button.writeAttribute("title", global.getLabel('showTech'));
        button.addClassName("fwk_additionalErrorShowDetails");
        button.removeClassName("fwk_additionalErrorHideDetails");
        if (global.liteVersion) {
            button.update("+");
        }
    }
    else {
        button.writeAttribute("title", global.getLabel('hideTech'));
        button.addClassName("fwk_additionalErrorHideDetails");
        button.removeClassName("fwk_additionalErrorShowDetails");
        if (global.liteVersion) {
            button.update("-");
        }
    }
    element.toggle();
},
/**
* Shows a message and redirects to the login page
*/
_redirectToLoginPage: function (data, errorToShow) {
    var redirectingMessage = "Redirecting to login page in ";
    //Look if we have the label for this message
    if (data && data.EWS && data.EWS.labels && data.EWS.labels.item) {
        var array = objectToArray(data.EWS.labels.item);
        for (var i = 0; i < array.size(); i++) {
            if (array[i]['@id'] && array[i]['@id'] == "redirectingLogin") {
                redirectingMessage = array[i]['@value'];
                break;
            }
        }
    }

    //Show an error and redirect to login page
    if (Object.isEmpty($("redirectPopUp"))) {
        var top = document.viewport.getScrollOffsets().top + 50;
        var left = (document.viewport.getWidth() - 550) / 2;

        var popupContainer = new Element("div", {
            "id": "redirectPopUp",
            "class": "moduleInfoPopUp_container fwk_firstLoadError_container",
            "style": "top:" + top + "px;left:" + left + "px"
        });
        var popupTopBorderContainer = new Element("div", { "class": "infoPopUpBorderContainer fwk_firstLoadError_BorderContainer" });
        var popUp_upperLeftCorner = new Element("div", { "class": "popUp_upperLeftCorner" });
        var popUp_upperLine = new Element("div", { "class": "popUp_upperLine fwk_firstLoadError_upperLine" });
        var popUp_upperRightCorner = new Element("div", { "class": "popUp_upperRightCorner" });
        popupTopBorderContainer.insert(popUp_upperLeftCorner);
        popupTopBorderContainer.insert(popUp_upperLine);
        popupTopBorderContainer.insert(popUp_upperRightCorner);
        popupContainer.insert(popupTopBorderContainer);

        var popup_MessageBox = new Element("div", { "class": "popUp_messageBox fwk_firstLoadError_messageBox" });

        var popup_indicatorIconPart = new Element("div", { "class": "moduleInfoPopUp_indicatorIconPart" });
        var popup_indicatorIconExclamation = new Element("div", { "class": "moduleInfoPopUp_indicatorIconVoid moduleInfoPopUp_indicatorIconExclamation" });
        popup_indicatorIconPart.insert(popup_indicatorIconExclamation);

        var popup_textMessagePart = new Element("div", { "id": "redirectoPopUp_textMessagePart", "class": "moduleInfoPopUp_textMessagePart" });
        var errorDiv = new Element("div");
        var errorTextContainer = new Element("p").insert(errorToShow);
        errorDiv.insert(errorTextContainer);

        var redirectingSpan = new Element("span").insert(redirectingMessage + " ");
        var redirectingTimeSpan = new Element("span");
        var popupContent = new Element("p", {
            "class": "fwk_firstLoadErrorRedirecting"
        });

        popupContent.insert(redirectingSpan);
        popupContent.insert(redirectingTimeSpan);
        errorDiv.insert(popupContent);
        popup_textMessagePart.insert(errorDiv);

        popup_MessageBox.insert(popup_indicatorIconPart);
        popup_MessageBox.insert(popup_textMessagePart);

        popupContainer.insert(popup_MessageBox);

        var popupBottomBorderContainer = new Element("div", { "class": "infoPopUpBorderContainer fwk_firstLoadError_BorderContainer" });
        var popUp_lowerLeftCorner = new Element("div", { "class": "popUp_lowerLeftCorner" });
        var popUp_lowerLine = new Element("div", { "class": "popUp_lowerLine fwk_firstLoadError_lowerLine" });
        var popUp_lowerRightCorner = new Element("div", { "class": "popUp_lowerRightCorner" });
        popupBottomBorderContainer.insert(popUp_lowerLeftCorner);
        popupBottomBorderContainer.insert(popUp_lowerLine);
        popupBottomBorderContainer.insert(popUp_lowerRightCorner);
        popupContainer.insert(popupBottomBorderContainer);

        var backgroundDiv = new Element("div", { "id": "fwk_firstLoadErrorBack" });
        $(document.body).insert(backgroundDiv);
        $(document.body).insert(popupContainer);
    }

    //Depending if we are in localhost or not, we'll redirect to one url or another
    var sapClient = "";
    if (__client) {
        sapClient = "?sap-client=" + __client;
    }
    if (data && data.EWS && data.EWS.o_redirect_url) {
        var urlToUse = data.EWS.o_redirect_url;
    } else if (global && global.redirectURL) {
        var urlToUse = global.redirectURL;
    } else {
        var urlToUse = "/sap/public/bc/ur/eWS/standard/logInPage.html" + sapClient;
    }
    if (window.location.href.include("http://localhost")) {
        urlToUse = "standard/logOnPage/logInPage.html" + sapClient;
    }

    redirectAfterSeconds(urlToUse, 3, redirectingTimeSpan);
},

/**
* @param args
* {String} text message to be shown on the framework screen
*/
_warningMethodPopUp: function (data) {
    var errorText;
    if (!Object.isEmpty(data.EWS.webmessage_text)) {
        errorText = data.EWS.webmessage_text;
    } else {
        if (!Object.isEmpty(data.EWS.messages.item)) {
            errorText = data.EWS.messages.item['#text']
        }
        else {
            errorText = "Warning: Application is currently experiencing connection problems. Please try again later.";
        }
    }
    //This is done to be able to show the popup when loading GET_USETTINGS fails.
    if (!global || $("idDivInfoPopUpContainer") && !global.infoFailurePopup) {
        //alert(errorText);
        if (Object.isEmpty($("idDivInfoPopUpContainer").down('[id=idModuleInfoPopUp_container]').down('[id=moduleInfoPopUp_content]').down('[id=idModuleInfoPopUp_textMessagePart]').down('[id=popUpErrorDiv]'))) {
            var errorDiv = new Element('div', { 'id': 'popUpErrorDiv', 'class': 'fieldError genCat_balloon_span FWK_errorMessages' });
            this.buttonsJson = {
                elements: [],
                defaultButtonClassName: 'genCat_balloon_span'
            };
            var aux = {
                idButton: 'showHideError',
                label: global.getLabel('hideAllMessages'),
                className: 'getContentLinks fieldDispClearBoth application_action_link',
                type: 'link',
                handlerContext: null,
                handler: this.showHideButtons.bind(this, errorDiv)
            };
            this.buttonsJson.elements.push(aux);
            this.showHidebuttons = new megaButtonDisplayer(this.buttonsJson);
            $("idDivInfoPopUpContainer").down('[id=idModuleInfoPopUp_container]').down('[id=moduleInfoPopUp_content]').down('[id=idModuleInfoPopUp_textMessagePart]').insert(this.showHidebuttons.getButtons());
            $("idDivInfoPopUpContainer").down('[id=idModuleInfoPopUp_container]').down('[id=moduleInfoPopUp_content]').down('[id=idModuleInfoPopUp_textMessagePart]').insert(errorDiv);
        }
        else {
            var errorDiv = $("idDivInfoPopUpContainer").down('[id=idModuleInfoPopUp_container]').down('[id=moduleInfoPopUp_content]').down('[id=idModuleInfoPopUp_textMessagePart]').down('[id=popUpErrorDiv]');
        }
        errorDiv.insert("<div>" + errorText + "</div>");
    } else if (Object.isUndefined(global.infoFailurePopup) === true) {
        global.infoFailurePopup = new infoPopUp({
            closeButton: $H({
                'callBack': function () {
                    global.infoFailurePopup.close();
                    delete global.infoFailurePopup;
                } .bind(this)
            }),
            htmlContent: new Element("div").insert(errorText),
            indicatorIcon: 'information',
            width: 350
        });
        global.infoFailurePopup.create();
    } else {
        global.infoFailurePopup.obHtmlContent.insert(new Element("div").insert(errorText));
    }
},
showHideButtons: function (div) {
    if (div.visible())
        this.showHidebuttons.updateLabel('showHideError', global.getLabel('showAllMessages'))
    else
        this.showHidebuttons.updateLabel('showHideError', global.getLabel('hideAllMessages'))

    div.toggle();
},
/**
* @param args
*            {String} text message to be shown on the framework screen
* @description this method show the default error, warning, and info text messages
*/
_infoMethod: function (data) {
    if (!Object.isEmpty(global.delayTime))
        var delayTime = global.delayTime
    else
        var delayTime = 10;
    var cName = 'fwk_successful';
    var successful = new Element('div', {
        className: cName
    });

    var message;

    if (Object.isString(data)) {
        message = data;
    } else {
        message = data.EWS.webmessage_text;
    }
    var gap = new Element('div', {
        className: "gapCss"
    }).insert("&nbsp;");
    successful.update(
            "<div class='" + cName + "_left'></div>"
            + "<div class='" + cName + "_center test_notification'>" + message + "&nbsp;&nbsp;&nbsp;</div>"
            + "<div class='" + cName + "_right'>"
            + "<div class='application_currentSelection'></div>"
            + "</div>"
            );
    /****************************************************/
    var infoMessageDiv = new Element('div');
    infoMessageDiv.insert(successful);
    infoMessageDiv.insert(gap);
    $('infoMessage').insert(infoMessageDiv);
    successful.down('div.application_currentSelection').observe('click', infoMessageDiv.remove.bind(infoMessageDiv));
    new PeriodicalExecuter(function (pe) {
        if (infoMessageDiv.parentNode)
            infoMessageDiv.remove();
        pe.stop();
    }, delayTime);
},
/**
* @param args
*            {String} text message to be shown on the framework screen
* @description this method show the default error, warning, and info text messages
*/
_warningMethod: function (data) {

    if (!Object.isEmpty(global.delayTime))
        var delayTime = global.delayTime
    else
        var delayTime = 10;
    var cName = 'fwk_unSuccessful';
    var successful = new Element('div', {
        className: cName
    });
    var gap = new Element('div', {
        className: "gapCss"
    }).insert("&nbsp;");
    successful.update(
            "<div class='" + cName + "_left'></div>"
            + "<div class='" + cName + "_center test_notification'>" + data.EWS.webmessage_text + "&nbsp;&nbsp;&nbsp;</div>"
            + "<div class='" + cName + "_right'>"
            + "<div class='application_currentSelection'></div>"
            + "</div>"
            );
    /****************************************************/
    var infoMessageDiv = new Element('div');
    infoMessageDiv.insert(successful);
    infoMessageDiv.insert(gap);
    $('infoMessage').insert(infoMessageDiv);
    successful.down('div.application_currentSelection').observe('click', infoMessageDiv.remove.bind(infoMessageDiv));

    new PeriodicalExecuter(function (pe) {
        if (infoMessageDiv.parentNode)
            infoMessageDiv.remove();
        pe.stop();
    }, delayTime);
},
/**
* @param args
*            {String} text message to be shown on the framework screen
* @description this method show the default error, warning, and info text messages
*/
_errorMethod: function (text, serviceName) {
    this._failureMethod(text, serviceName);
}
});
function displayJSON(object,tab){   
    var text = '\n'; 
    var this_tab = 0;
    var tabText = '';
    if(!Object.isEmpty(tab))
        this_tab = tab + 3;       
    for(var iter = 0;iter<this_tab;iter++)
    {
        tabText += ' ';
    }          
    for (element in object){    
        if(!Object.isEmpty(object[element])){    
            if(Object.isArray(object[element])){
                text += tabText + element+': [';
                object[element].each(function(a){
                    text += tabText +displayJSON(a,this_tab+1)+tabText +'\n';
                });
                text += tabText +'];\n';                
            }else if(Object.isString(object[element])){
                text += tabText +element +': '+object[element].strip()+';';
                text += '\n';
            }else{
                text += tabText +element +': { '+displayJSON(object[element],this_tab+1)+tabText +' };\n';
            }
        }else{
            text += tabText +element +': undefined;';
            text += '\n';
        }    
    }
    return text;
}


/**
 * @constructor
 * @description makes an AJAX call for an object
 */
var Call = Class.create(
/**
* @lends Call
*/
{
/**
* creates a new AJAX request
* 
* @param {origin}
*            object the object which is going to make the call
* @param {Hash}
*            The hash with the options for the request
*/
initialize: function(object, options) {
    //throw an exeption if no xml_in is given
    if (!options.get("xml")) {
        throw ("You need to provide and xml_in in order to make the call");
    }
    //process the options
    if (Object.isEmpty(options.get('cache')))
        var cache = true;
    else
        var cache = options.get('cache');
    var processedOptions = this.processOptions(object, options);
    this.processXmlIn(processedOptions);
    var serviceName = processedOptions.xmlInJSON.EWS.SERVICE.toLowerCase();
    //If this call is in the cache make the callback with the stored data.
    if (
            global &&
            global.servicesCache &&
            global.servicesCache.serviceExists(serviceName, processedOptions.xmlIn) &&
            cache
            ) {
        //Getting the JSON object
        var data = global.servicesCache.getService(serviceName, processedOptions.xmlIn);
        var error;
        if (data.EWS && data.EWS.webmessage_text && data.EWS.webmessage_type) {
            error = data.EWS.webmessage_type;
        }
        //Giving to the function a copy of the JSON
        data = deepCopy(data);
        //Enable the buttons
        if (options.get('enableButtons') && global) {
            global.enableAllButtons();
        }
        //Make the proper callback
        this.makeCallback(processedOptions, data, error);
    }
    //if it's not in the cache make an AJAX request to get the data
    else {
        var url = object.url;
        //If we have a defined language:
        if (!Object.isEmpty(global) && !Object.isEmpty(global.language)) {
            //We add the lenguage as a parameter in the url
            if (url.include("%3F")) {
                //If the url already has parameters (has the ? character)
                url += "%26sap-language%3D" + global.language;
            } else {
                url += "%3Fsap-language%3D" + global.language;
            }
        }
        if (!Object.isEmpty(__client)) {
            if (url.include("%3F")) {
                //If the url already has parameters (has the ? character)
                url += "%26sap-client%3D" + __client;
            } else {
                url += "%3Fsap-client%3D" + __client;
            }
        }
        else if (!Object.isEmpty(global) && !Object.isEmpty(global.client) && !url.include('sap-client')) {
            //We add the lenguage as a parameter in the url
            if (url.include("%3F")) {
                //If the url already has parameters (has the ? character)
                url += "%26sap-client%3D" + global.client;
            } else {
                url += "%3Fsap-client%3D" + global.client;
            }
        }
        if (!Object.isEmpty(__sesid)) {
            if (url.include("%3F")) {
                //If the url already has parameters (has the ? character)
                url += "%26s%3D" + __sesid;
            } else {
                url += "%3Fs%3D" + __sesid;
            }
        }
        if (!url.include('proxy'))
            url = unescape(url);
        var postbody = processedOptions.xmlIn;
        if (__proxy == 'proxy.php')
            postbody = 'xml_in=' + processedOptions.xmlIn;
        //ID that we will use as the key for this call in the pending calls hash
        this.randomID = Math.floor(Math.random() * 100000) + "";
        var AJAXREQ = new Ajax.Request(url, {
            method: 'POST',
            asynchronous: true,
            postBody: postbody,
            onSuccess: function(req) {
                if (!Object.isEmpty(req.getHeader("content-Type")) && req.getHeader("content-Type").match(/application\/json/)) {
                    var data = req.responseText.evalJSON(true);
                }
                else {
                    //configure the XML2JSON converter
                    var xml = new XML.ObjTree();
                    xml.attr_prefix = '@';
                    //Parsing the XML
                    if (serviceName == 'hrw_engine')
                        var convert = false;
                    else
                        var convert = true;
                    var data = xml.parseDOM(req.responseXML.documentElement, convert);
                }
                var error;
                if (options.get('enableButtons') && global) {
                    global.enableAllButtons();
                }

                if (data && data.EWS && data.EWS.webmessage_text && data.EWS.webmessage_type) {
                    error = data.EWS.webmessage_type;
                }
                //Use the errorMethod in case the service is returning an error.
                if (error == 'E') {
                    // if possible, log the received data
                    this.logRequest(serviceName, processedOptions, data);
                    processedOptions.errorMethod(data, processedOptions.ajaxID);
                }
                //call to the failure method if the response has parsererror, since it means that
                //there's been a problem in the service response
                else if (!data || data.parsererror) {
                    object._failureMethod(null, serviceName);
                }
                //in other case go to the normal response handling
                else {
                    var test = false
                    if (!Object.isEmpty(data.EWS.messages) && (data.EWS.messages.item['@msgty'] == 'W')) {
                        object._warningMethodPopUp(data);
                    }
                    this.logRequest(serviceName, processedOptions, data);
                    //Handle the service storing.
                    this.storeAjaxResponseData(serviceName, processedOptions, data, object);
                    //put the response as XML if needed
                    if (this.xmlFormat) {
                        data = req.responseXML;
                    }
                    //go to the proper callback function.
                    this.makeCallback(processedOptions, data, error);
                }
                //We delete this call from the pending calls hash as it has completed
                if (!Object.isEmpty(global) && !Object.isEmpty(global.pendingCalls)) {
                    global.pendingCalls.unset(this.randomID);
                }

            } .bind(this),
            onFailure: function(req) {
                //If we are receiving an HTML message like that it is because we have been logged off 
                if (req.responseText.startsWith("<html><head><title>Logon Error Message</title>")) {
                    object._failureMethod(data, serviceName, "499");
                } else {
                    object._failureMethod(data, serviceName, req.status);
                }
                //We delete this call from the pending calls hash as it has completed
                global.pendingCalls.unset(this.randomID);
            }
        });
        //we put this call in the pending calls hash
        if (!Object.isEmpty(global) && !Object.isEmpty(global.pendingCalls))
            global.pendingCalls.set(this.randomID, AJAXREQ);
    }
},
/**
* Makes the proper callback from the data in the service
* 
* @param {JSON}
*            processedOptions the options given to the request
* @param {JSON}
*            data the JSON data coming from the call
* @param {String}
*            error The error or information or warning code (if existing)
* 
*/
makeCallback: function(processedOptions, data, error) {
    if (error == 'I') {
        processedOptions.infoMethod(data, processedOptions.ajaxID);
    } else if (error == 'W') {
        processedOptions.warningMethod(data, processedOptions.ajaxID);
    }
    processedOptions.successMethod(data, processedOptions.ajaxID);
},

/**
* Gets data from the call options and process them.
* 
* @param {Hash}
*            options the options for the
*/
processOptions: function(object, options) {
    this.xmlFormat = options.get("xmlFormat");

    var processedOptions = {
        successMethod: this.processCallbackMethod(object, options, "successMethod"),
        errorMethod: this.processCallbackMethod(object, options, "errorMethod"),
        infoMethod: this.processCallbackMethod(object, options, "infoMethod"),
        warningMethod: this.processCallbackMethod(object, options, "warningMethod"),
        ajaxID: options.get("ajaxID"),
        xmlIn: options.get("xml")
    };

    return processedOptions;
},
/**
* It returns the proper callback method for the ajax requests
* 
* @param {origin}
*            object the origin object which makes the AJAX request
* @param {Hash}
*            options the options given for the AJAX request
* @param {String}
*            methodName the name of the method (successMethod, informationMethod, etc.)
* @returns the method itself.
*/
processCallbackMethod: function(object, options, methodName) {
    if (options.get(methodName)) {
        //process the method if it has been given as an string
        //DEPRECATED but keeped to keep previous functionality working
        if (Object.isString(options.get(methodName))) {
            return object[options.get(methodName)].bind(object);
        }
        //process the method if it has been given as a function object
        else if (Object.isFunction(options.get(methodName))) {
            return options.get(methodName);
        }
    } else {
        //process the method when using the default one.
        return object["_" + methodName].bind(object);
    }
},
/**
* Make some common stuff in the XML in needed depending on the FWK options.
* 
* @param {Hash}
*            options the options given to the AJAX request
*/
processXmlIn: function(options) {
    //Creating the JSON converter and parsing the XML into JSON
    var xmlParser = new XML.ObjTree();
    var xmlJson = xmlParser.parseXML(options.xmlIn, false);
    var serviceName = xmlJson.EWS ? xmlJson.EWS.SERVICE.toLowerCase() : '';
    //Checking if the services is in the old or in the new format
    xmlJson.EWS.DEL = getURLParam('roleOf');
    //Inserting GCC and LCC if any.
    var gcc = getURLParam("gcc");
    var lcc = getURLParam("lcc");
    if (!Object.isEmpty(gcc) && !Object.isEmpty(lcc)) {
        xmlJson.EWS.GCC = gcc;
        xmlJson.EWS.LCC = lcc;
    } else if (global) {

        if (global.companies) {
            gcc = global.usettingsJson.EWS.o_def_comp['@yygcc'];
            lcc = global.usettingsJson.EWS.o_def_comp['@yylcc'];
            xmlJson.EWS.GCC = gcc;
            xmlJson.EWS.LCC = lcc;
        }
    }
    //Converting JSON object to XML
    options.xmlIn = xmlParser.writeXML(xmlJson, true);
    options.xmlIn = options.xmlIn.gsub('<OBJECT>', '<OBJ>');
    options.xmlIn = options.xmlIn.gsub('<OBJECT ', '<OBJ ');
    options.xmlIn = options.xmlIn.gsub('</OBJECT>', '</OBJ>');
    options.xmlIn = options.xmlIn.gsub('%', '&amp;#37;');
    options.xmlInJSON = xmlJson;
},
/**
* Logs a request in the browser console (if exists)
* 
* @param {String}
*            serviceName the service name that has been called
* @param {JSON}
*            processedOptions the options given to the request
* @param {JSON}
*            data the JSON data coming from the call
*/
logRequest: function(serviceName, processedOptions, data) {
    try {
        console.log("SERVICE: ", serviceName);
        console.log("XML_IN: ", processedOptions.xmlIn);
        if (Prototype.Browser.Gecko || Prototype.Browser.WebKit) {
            console.dir(data);
        } else {
            console.log(displayJSON(data));
        }
    } catch (e) {

    }
},
/**
* Handles the storage of the request data when needed (labels, cache, etc.)
* 
* @param {String}
*            serviceName the service name that has been called
* @param {JSON}
*            processedOptions the options given to the request
* @param {JSON}
*            data the JSON data coming from the calls
* @param {origin}
*            object the origin object that has made the request
*/
storeAjaxResponseData: function(serviceName, processedOptions, data, object) {
    if (global && !Object.isUndefined(global) && !Object.isUndefined(global.servicesCache) && !Object.isUndefined(processedOptions.xmlIn)) {

        global.servicesCache.setService(processedOptions.xmlIn, data, serviceName);

        if (!Object.isEmpty(data) && !Object.isEmpty(data.EWS) && !Object.isEmpty(data.EWS.labels) && !Object.isEmpty(data.EWS.labels.item)) {

            if (Object.isEmpty(object.labels) || !Object.isHash(object.labels)) {
                object.labels = $H({});
            }
            objectToArray(data.EWS.labels.item).each(function(label) {
                if (!Object.isEmpty(label['@id']))
                    object.labels.set(label['@id'], label['@value']);
            } .bind(this));
        }
    }
}
});

