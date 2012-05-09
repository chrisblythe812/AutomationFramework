/**
 *@fileOverview progressBar.js
 *@description Progress bar module
 */
/**
 * @constructor
 * @description Class representing a progress bar
 */
var ProgressBar = Class.create(
/** 
*@lends ProgressBar 
*/
{
    /**
     *Constructor of the class ProgressBar
     */
	initialize: function(options) {
	    // target div
	    this.target = options.target;
	    // div's object
	    this.container = $(this.target);
	    // Number of cells
	    this.cellsNumber = options.cellsNumber;
	    // Current cell
        this.currentCell = 0;
	    this._buildBar();
	},
	/**
	 *@description Builds the bar and inserts it into the DOM
	 */
	_buildBar: function() {
	    var html = "<div class='progressBar_container'><table cellspacing='0' border='2' cellpadding='0' class='progressBar_table test_table' bordercolor='#808080'><tr>";
	    for (var i = 0; i < this.cellsNumber; i++)
	        html += "<td id='" + this.target + "_" + i + "'>&nbsp;</td>";
	    html += "</tr></table></div>";
	    html += "<div id='" + this.target + "_counter' class='progressBar_counter'>" + this.currentCell + "/" + this.cellsNumber + "</div>";
	    this.container.update(html);
	},
	/**
	 *@description Highlights the next empty cell as succedded
	 */
	drawSuccess: function() {
	    if (this.currentCell < this.cellsNumber) {
	        this.container.down("[id='" + this.target + "_" + this.currentCell +"']").addClassName("progressBar_cell_highlightSuccess");
	        this.currentCell++;
	        this._updateCounter();
        }
	},
	/**
	 *@description Highlights the next empty cell as failed
	 */
	drawFailure: function() {
	    if (this.currentCell < this.cellsNumber) {
	        this.container.down("[id='" + this.target + "_" + this.currentCell +"']").addClassName("progressBar_cell_highlightFailure");
	        this.currentCell++;
	        this._updateCounter();
        }
	},
	/**
	 *@description Resets the bar
	 */
	reset: function() {
	    for (var i = 0; i < this.currentCell; i++) {
	        if (this.container.down("[id='" + this.target + "_" + i +"']").hasClassName("progressBar_cell_highlightSuccess"))
	            this.container.down("[id='" + this.target + "_" + i +"']").removeClassName("progressBar_cell_highlightSuccess");
	        if (this.container.down("[id='" + this.target + "_" + i +"']").hasClassName("progressBar_cell_highlightFailure"))
	            this.container.down("[id='" + this.target + "_" + i +"']").removeClassName("progressBar_cell_highlightFailure");
	    }
        this.currentCell = 0;
        this._updateCounter();
	},
	/**
	 *@description Updates the counter
	 */
	_updateCounter: function() {
	    this.container.down("[id='" + this.target + "_counter']").update(this.currentCell + "/" + this.cellsNumber);
	},
	/**
	 *@description Returns progressBar's number of cells
     *@returns {Number}
	 */
	getCellsNumber: function() {
	    return this.cellsNumber;
	},
	/**
	 *@description Returns progressBar's current cell
     *@returns {Number}
	 */
	getCurrentCell: function() {
	    return this.currentCell;
	}
});