/**
 * Creates a tooltip
 *
 */
var tooltip = Class.create({
    /**
    * Initializes the class
    * @param {Object} options the tooltips options
    */
    initialize: function(options) {
        this.elements = options.tooltips;
        this.alternativeCss = options.contentCss;
        this.container = $('tooltipCont');
        this.container.removeClassName('tooltipHidden');
        this.container.hide();
        if (!Object.isEmpty(this.alternativeCss)) {
            this.container.removeClassName('tooltipContainer');
            this.container.addClassName(this.alternativeCss);
        }
        this.createEvents();
    },

    /**
    * Initializes the events for the tooltips
    * @param {Hash} Hash containing the elements and the tooltips for that elements
    */
    createEvents: function(elements) {
        if (!Object.isEmpty(elements))
            var hash = elements;
        else
            var hash = this.elements;
        var keys = hash.keys();
        for (var i = 0; i < keys.length; i++) {
            var mouseOver = hash.get(keys[i]).element.on('mouseover', this.showTooltip.bindAsEventListener(this, keys[i]));
            var mouseOut = hash.get(keys[i]).element.on('mouseout', this.hideTooltip.bindAsEventListener(this));
            hash.get(keys[i]).mouseover = mouseOver;
            hash.get(keys[i]).mouseout = mouseOut;
        }
    },

    /**
    * Show the tooltips on mouseover
    * @param {Event} data from the event to take the position for the tooltip
    * @param {id} The id of the element with the tooltip
    */
    showTooltip: function(event, id) {
        var positionX = Event.pointerX(event);
        var positionY = Event.pointerY(event) + 13;
        if (!Object.isEmpty(this.container.down())) {
            var oldContent = this.container.down().remove();
        }
        var content = this.elements.get(id).tooltip;
        this.container.insert(content);
        this.container.show();
        this.container.setStyle({
            'top': positionY + 'px',
            'left': positionX + 'px'
        });
    },

    /**
    * Hide the container for the tooltip
    */
    hideTooltip: function() {
        this.container.hide();
    },

    /**
    * Add a new tooltip to an element
    * @param {Hash} Hash containing the elements and the tooltips for that elements
    */
    addTooltip: function(element) {
        this.createEvents(element);
        this.elements = this.elements.merge(element);
    },

    /**
    * Remove a tooltip from an element
    * @param {id} id of the element to remove the tooltip
    */
    removeTooltip: function(id) {
        this.container.hide();
        if (!Object.isEmpty(this.elements.get(id))) {
            this.elements.get(id).mouseover.stop();
            this.elements.get(id).mouseout.stop();
            this.elements.unset(id);
        }
    },

    /**
    * Update a tooltip from an element
    * @param {id} id of the element to update the tooltip
    * @param {newTooltip} Html element with the new tooltip 
    */
    updateTooltip: function(id, newTooltip) {
        var element = new Hash();
        element.set(id, { 'element': this.elements.get(id).element, 'tooltip': newTooltip });
        this.removeTooltip(id);
        this.addTooltip(element);
    },

    /**
    * Destroy every element used for the tooltips
    */
    destroyTooltips: function() {
        var keys = this.elements.keys();
        for (var i = 0; i < keys.length; i++) {
            delete (this.elements.get(keys[i]).element);
            delete (this.elements.get(keys[i]).tooltip);
            this.removeTooltip(keys[i]);
        }
    }
});