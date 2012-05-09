/**
* Creates a tooltip
*
*/
var balloonOnHover = Class.create({
    /**
    * Initializes the class
    * @param {Object} options the tooltips options
    */
    initialize: function(options) {
        this.elements = options.balloons;
        this.container = $('onHoverBall');
        this.container.update('');
        this.overElement = false;
        this.overBalloon = false;
        this.createHtml();
        this.createEvents();
    },

    createHtml: function() {
        this.contentInt = new Element('div', { 'class': 'BOH_border' });
        this.container.addClassName('tooltipHidden');
        this.contMouseOver = this.container.on('mouseover', this.showOnBalloon.bind(this));
        this.contMouseOut = this.container.on('mouseout', this.hideOnBalloon.bind(this));
        var arrow = new Element('div', { 'class': 'BOH_arrow_image BOH_arrow' });
        this.container.insert(arrow);
        this.container.insert(this.contentInt);

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
            var mouseOver = hash.get(keys[i]).element.on('mouseover', this.showOnElement.bindAsEventListener(this, keys[i]));
            var mouseOut = hash.get(keys[i]).element.on('mouseout', this.hideOnElement.bindAsEventListener(this));
            hash.get(keys[i]).mouseover = mouseOver;
            hash.get(keys[i]).mouseout = mouseOut;
        }
    },

    showOnElement: function(event, id) {
        this.overElement = true;
        if (!Object.isEmpty(this.hideFromBallon))
            window.clearTimeout(this.hideFromBallon);
        this.showCallId = this.showOHBalloon.bind(this, event, id).delay(0.5);
    },

    hideOnElement: function() {
        this.overElement = false;
        if (!Object.isEmpty(this.showCallId))
            window.clearTimeout(this.showCallId);
        this.hideCallId = this.hideOHBalloon.bind(this, this.actualElementId).delay(0.5);
    },

    showOnBalloon: function() {
        this.overBalloon = true;
        if (!Object.isEmpty(this.hideCallId))
            window.clearTimeout(this.hideCallId);
    },

    hideOnBalloon: function(event) {
        var inside = this.checkInsideElement(event);
        if (!inside) {
            this.overBalloon = false;
            this.hideFromBallon = this.hideOHBalloon.bind(this, this.actualElementId).delay(0.5);
        }
    },

    showOHBalloon: function(event, id) {
        var positionX = Event.pointerX(event);
		/* The last part of the following line was commented by Pablo Schrut on September 21th to fix a position issue */
        var positionY = this.elements.get(id).element.cumulativeOffset().top; // - this.elements.get(id).element.getHeight();
        if (!Object.isEmpty(this.contentInt.down())) {
            var oldContent = this.contentInt.down().remove();
        }
        var content = this.elements.get(id).balloon;
        this.contentInt.insert(content);
        this.container.setStyle({
            'top': positionY + 'px',
            'left': positionX + 'px'
        });
        this.container.removeClassName('tooltipHidden');
        this.container.show();
    },

    hideOHBalloon: function(id) {
        if (!this.overElement || !this.overBalloon) {
            this.container.hide();
        }
    },

    checkInsideElement: function(event) {
        var boxPosition = this.container.cumulativeOffset();
        var boxDimensions = this.container.getDimensions();
        var endBoxLeft = boxPosition.left + boxDimensions.width;
        var endBoxTop = boxPosition.top + boxDimensions.height;
        var mouseX = Event.pointerX(event);
        var mouseY = Event.pointerY(event);

        if (mouseX > boxPosition.left && mouseX < endBoxLeft && mouseY > boxPosition.top && mouseY < endBoxTop)
            return true;
        else
            return false;

    },

    /**
    * Add a new tooltip to an element
    * @param {Hash} Hash containing the elements and the tooltips for that elements
    */
    addOHBalloon: function(element) {
        this.createEvents(element);
        this.elements = this.elements.merge(element);
    },

    /**
    * Remove a tooltip from an element
    * @param {id} id of the element to remove the tooltip
    */
    removeOHBalloon: function(id) {
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
    updateOHBalloon: function(id, newOHBalloon) {
        var element = new Hash();
        element.set(id, { 'element': this.elements.get(id).element, 'balloon': newOHBalloon });
        this.removeOHBalloon(id);
        this.addOHBalloon(element);
    },

    /**
    * return the content element
    */
    getContentElement: function() {
        return this.container;
    },
    /**
    * Destroy every element used for the tooltips
    */
    destroyOHBalloon: function() {
        var keys = this.elements.keys();
        for (var i = 0; i < keys.length; i++) {
            delete (this.elements.get(keys[i]).element);
            delete (this.elements.get(keys[i]).balloon);
            this.removeOHBalloon(keys[i]);
        }
    }
});