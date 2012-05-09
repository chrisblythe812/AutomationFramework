/*
 *@fileoverview drawTree.js
 *@desc drawTree handler class implemented here, a component to draw a tree between some divs
 */

/*
 *@class drawTree
 *@desc this class represents the drawTree handler
 */
var drawTree = Class.create({
    /*
    *@method initialize
    *@param divs {Hash} keeps the divs that we want to join
    *@desc creates every lines between divs to create a tree
    */
    initialize: function (divs, frame, color) {
        this.stroke = 2;
        this.mycolor = Object.isEmpty(color) ? "#000000" : color;
        this.divs = divs;
        this.frame = frame;
        this.setDivToDraw(frame);
        this.draw(divs);
    },
    draw: function (divs) {
        if ($('drawDiv'))
            $('drawDiv').update('');
        var key = divs.keys()[0];
        var parent = divs.get(key).parent;
        var parentPosition = $(parent).positionedOffset();
        var parentHeight = $(parent).getHeight();
        var width = $(parent).getWidth();
        var staff = divs.get(key).staff;
        var sons = divs.get(key).sons;
        var margin = 15;
        if ((staff.length != 0) || (sons.length != 0)) {
            if (staff.length != 0) {
                //Draw staff divs
                var down = 0;
                for (var i = 0; i < staff.length; i++) {
                    var staffHeight = $(staff[i]).getHeight();
                    var staffPosition = $(staff[i]).positionedOffset();
                    var downStaff = staffPosition.top;
                    if (downStaff > down) {
                        down = (staffPosition[1] + staffHeight / 2) - parentHeight;
                    }
                    if (staffPosition[0] < parentPosition[0] + width / 2) //If it is to the left
                    {
                        this.drawLines((parentPosition[0] + width / 2) - 46, staffPosition[1] + staffHeight / 2, 48, this.stroke);
                    }
                    else //It is to the right
                    {
                        this.drawLines(parentPosition[0] + width / 2, staffPosition[1] + staffHeight / 2, 45, this.stroke);
                    }
                }
            }
            if (sons.length != 0) {
                var rigth = 0;
                var left = $(this.frame).getWidth();
                var up = $(sons[0]).positionedOffset().top;
                for (var i = 0; i < sons.length; i++) {
                    var positionVer = $(sons[i]).positionedOffset().top;
                    var positionHor = $(sons[i]).positionedOffset().left - margin;
                    if (positionVer < up) {
                        up = positionVer;
                    }
                    if (positionHor > rigth) {
                        rigth = positionHor + margin;
                    }
                    if (positionHor < left) {
                        left = positionHor + margin;
                    }
                }
                var new_width = $(sons[sons.length - 1]).positionedOffset().left - $(sons[0]).positionedOffset().left;                 
                var new_height = ((parentPosition.top + parentHeight) - (up - margin));
                if (staff.length == 0)
                    new_height = 16;
                if (new_height < 0)
                    new_height = new_height * (-1);
                //horizontal line
                this.drawLines(left - margin + width / 2, up - margin, new_width, this.stroke);
                //vertical line                    
                this.drawLines(parentPosition.left + width / 2, parentPosition.top + parentHeight, this.stroke, new_height);
                for (var i = 0; i < sons.length; i++) {
                    var hor = $(sons[i]).positionedOffset().left - margin + width / 2;
                    var ver = $(sons[i]).positionedOffset().top;
                    this.drawLines(hor, up - margin, this.stroke, 16);
                }
            }
            else {
                this.drawLines(parentPosition.left + width / 2, parentPosition.top + parentHeight, this.stroke, down);
            }
        }
    },
    refresh: function () {
        this.draw(this.divs);
    },
    setDivToDraw: function (frame) {
        this.drawDiv = new Element('div', { 'id': 'drawDiv' });
        $(frame).insert(this.drawDiv);
    },
    drawLines: function (left, top, width, height) {
        var div = new Element('div', { 'id': 'drawLines' });
        div.setStyle({ 'backgroundColor': this.mycolor, 'clip': 'rect(0pt,' + width + 'px,' + height + 'px, 0pt)', 'position': 'absolute', 'left': left + 'px', 'top': top + 'px', 'width': width + 'px', 'height': height + 'px' });
        this.drawDiv.insert(div);
    }
});    
