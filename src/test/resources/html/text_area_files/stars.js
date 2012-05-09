
var Stars = Class.create(origin, {
    /**
    * Mouse X position
    * @param {Number} options
    */
    _x: 0,
    /**
    * Mouse X position
    * @param {Number} options
    */
    _y: 0,
    _smiley: null,
    /**
    * Constructor
    * @param {Object} options
    */
    initialize: function($super, options) {
        $super('Stars'); ;

        this._initialized = false;
		
        /**
        * Base option values
        * @param (Object)
        */
        this.options = {
            bindField: null, 		    // Form Field to bind the value to
            maxRating: 5, 			    // Maximum rating, determines number of stars
            container: 'pageRatingStars', 	// Container of stars
            callback: null, 			// Callback function, fires when the stars are clicked
            content_id: null, 		    // URL to call when clicked. The rating will be appended to the end of the URL (eg: /rate.php?id=5&rating=)
            value: 0, 				    // Initial Value
            locked: false
        };
        Object.extend(this.options, options);
        this.locked = this.options.locked ? true : false;

        this.value = -1;
        this.stars = [];
        this._clicked = false;

        this._starClass = {
            empty: "rating_emptyStar",
            full: "rating_rateStar"
        };

        this._setStarClass = {
            empty: "rating_emptyStar",
            full: "rating_fullStar"
        };

        if (this.options.container) {
            if ($(this.options.container)){
				this._container = $(this.options.container);
				this.id = this.options.container;
				this._container.update();
			}
        }
        else {
			return;
        }
        this._display();
        this.setValue(this.options.value);
        this._initialized = true;
    },
    _display: function() {
        for (var i = 0; i < this.options.maxRating; i++) {
            var star = new Element("div");
            star.className = this.locked ? this._starClass.empty : this._setStarClass.empty;
            star.style.cursor = 'pointer';
            star.title = 'Rate as ' + (i + 1);
            !this.locked && Event.observe(star, 'mouseover', this._starHover.bind(this));
            !this.locked && Event.observe(star, 'click', this._starClick.bind(this));
            !this.locked && Event.observe(star, 'mouseout', this._starClear.bind(this));
            this.stars.push(star);
			if(this._container){
				this._container.appendChild(star);
			}
        }
        this._smiley = new Element("div");
        this._smiley.className = 'smiley_0';
        this._smiley.title = '';
		if(this._container){
			this._container.appendChild(this._smiley);
		}
    },
    _starHover: function(e) {
        if (this.locked) return;
        if (!e) e = window.event;
        var star = Event.element(e);

        var greater = false, s = 0;
        for (var i = 0; i < this.stars.length; i++) {
            this.stars[i].className = greater ? this._starClass.empty : this._starClass.full;
            if (this.stars[i] == star) {
                greater = true;
                s = i + 1;
            }
        }
        this._smiley.className = 'smiley_' + s;
    },
    _starClick: function(e) {
        if (this.locked) return;
        if (!e) e = window.event;
        var star = Event.element(e);
        this._clicked = true;
        for (var i = 0; i < this.stars.length; i++) {
            if (this.stars[i] == star) {
                this.setValue(i + 1);
                this._smiley.className = 'smiley_0';
                break;
            }
        }
    },
    _starClear: function(e) {
        if (this.locked && this._initialized) return;
        var greater = false;
        for (var i = 0; i < this.stars.length; i++) {
            if (i > this.value) greater = true;
            if ((this._initialized && this._clicked) || this.value == -1)
                this.stars[i].className = greater ? (this.value + .5 == i) ? this._starClass.half : this._setStarClass.empty : this._setStarClass.full;
            else
                this.stars[i].className = greater ? (this.value + .5 == i) ? this._setStarClass.half : this._setStarClass.empty : this._setStarClass.full;
        }
        this._smiley.className = 'smiley_0';
    },
    /**
    * Sets the value of the star object, redraws the UI
    * @param {Number} value to set
    * @param {Boolean} optional, do the callback function, default true
    */
    setValue: function(val) {
        var doCallBack = arguments.length > 1 ? !!arguments[1] : true;
        if (this.locked && this._initialized) return;
        this.value = val - 1; //0-based
        if (this.options.bindField)
            $(this.options.bindField).value = val;
        if (this._initialized && doCallBack) {

            this.makeAJAXrequest($H({ xml:
			'<EWS>' +
			'	<SERVICE>KM_SET_RATING</SERVICE>' +
			'	<DEL/>' +
			'	<PARAM>' +
			'		<I_V_CONT_ID>' + this.options.content_id + '</I_V_CONT_ID>' +
			'		<I_V_RATE>' + val + '</I_V_RATE>' +
			'	</PARAM>' +
			'</EWS>'
			, successMethod: 'callback'
            }));

        }
        this._starClear();
    },

    callback: function(ret) {
    },

    updateStars: function(val, url) {
        this.options.actionURL = url;
        this.value = val - 1;
        for (var i = 0; i < this.stars.length; i++) {
            this.stars[i].className = this._setStarClass.empty;
        }
        for (var i = 0; i < val; i++) {
            this.stars[i].className = this._setStarClass.full;
        }
        this._smiley.className = 'smiley_0';
    }
});