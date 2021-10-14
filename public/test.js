function mediator(event_name){
    Creative.trackCustomEventAction(mbkCtx, { name: event_name }, noop);
}


    var text = screen.find('display');
    var t = new ThresholdObserver(0);

    text.react(function(state) {
        if (state.isDirty()) {
            text.setTextAction(ctx, { text: 'y: ' + state.y }, noop);
            t.value = state.y;
        }
        state.markClean();
    });

    t.on('up', function() {
        stripeSpaces.data("plugin_venetian").next();
        mediator('ScrolledUpwards');
    });

    t.on('down', function() {
        stripeSpaces.data("plugin_venetian").next();
        mediator('ScrolledDownwards');
    });
});



function once(fn, context) {
	var result;

	return function() {
		if(fn) {
			result = fn.apply(context || this, arguments);
			fn = null;
		}

		return result;
	};
}

//Custom console debug logger
function logger() {
  if (window.location.href.indexOf("celtra") != -1) {
    var date = new Date();
    var now =
      date.getFullYear() +
      "-" +
      (date.getMonth() + 1) +
      "-" +
      date.getDate() +
      " " +
      date.getHours() +
      ":" +
      date.getMinutes() +
      ":" +
      date.getSeconds();
    console.debug(
      "%c-------LOGGER OUTPUT @ " + now + "-------------",
      "background: navy; color: #39FF14"
    );

    Array.from(arguments).map(function (m) {
      console.debug(m);
    });
  }
}

//Custom Video Metrics
function customVideoMetrics() {

    var duration = unit.mbkOpts.vid.duration();
    var time = unit.mbkOpts.vid.time()
    if (time > Math.min(0.01 * duration)) {
      mediator(unit.mbkOpts.audioEvents.PLAY);
    }
    if (time > Math.min(1, 0.25 * duration)) {
      mediator(unit.mbkOpts.audioEvents.START);
    }
    if (time > Math.round(0.25 * duration)) {
      mediator(unit.mbkOpts.audioEvents.Q1);
    }
    if (time > Math.round(0.5 * duration)) {
      mediator(unit.mbkOpts.audioEvents.Q2);
    }
    if (time > Math.round(0.75 * duration)) {
      mediator(unit.mbkOpts.audioEvents.Q3);
    }
    if (time > Math.max(0.75 * duration, duration - 2)) {
      mediator(unit.mbkOpts.audioEvents.COMPLETE);
    }

}

//Custom Event logger
function mediator(event_name) {
  if (!flags.includes(event_name)) {
    Creative.trackCustomEventAction(mbkCtx, { name: event_name }, function () {
      flags.push(event_name);
      logger("mediator", event_name);
      logger("flags", flags);
    });
  }
}


function stripes () {
    logger('stripes', $, window, document)
/*!
 * jQuery Venetian plugin
 * Original author: @dulaccc
 *
 * Licensed under the MIT license
 */


;(function ( $, window, document, undefined ) {

    // defaults
    var pluginName = "venetian",
        defaults = {
            // encapuslate the 3D space in which the stripe can turn
            stripeSpaceClass: "stripe-space",

            // the stripe that is rolling
            stripeClass: "stripe",

            // a stripe is compose of 3 faces
            stripeFaceClass: "stripe__face",

            // front face
            stripeFaceFrontClass: "stripe__face--front",

            // top face
            stripeFaceTopClass: "stripe__face--top",

            // bottom face
            stripeFaceBottomClass: "stripe__face--bottom",

            // sprite inner container (so that you can apply padding for instance)
            stripeInnerFaceClass: "stripe__face__inner",

            // duration of a stripe animation
            animationDuration: 1000,

            // delay between stripe animations
            animationDelay: 100,

            // interval between stripe animations
            animationInterval: 5000,

            // 3 stripes per flap
            stripes: 3
        };

    // helpers
    function applyVendorCSS( element, property, value ) {
        var vendorProperty = '';
        ['-webkit-', '-moz-', '-ms-', '-o-', ''].forEach(function(prefix) {
            vendorProperty = prefix + property
            $(element).css(vendorProperty, value);
            //var e = document.querySelector(element);
            // console.log(e)
            // e.forEach(function(el){
            //     e.style.vendorProperty = value
            // })
        });
    }

    function extend(){
        for(var i=1; i<arguments.length; i++)
            for(var key in arguments[i])
                if(arguments[i].hasOwnProperty(key))
                    arguments[0][key] = arguments[i][key];
        return arguments[0];
    }

    // constructor
    function Plugin( element, options ) {
        this.element = element;
        this.options = extend( {}, defaults, options );

        this._defaults = defaults;
        this._name = pluginName;

        this.init();
    }

    Plugin.prototype = {

        init: function() {
            this.build();
            // this.photon();
            //this.animate();
        },

        build: function() {
            for (var i=0; i<this.options.stripes; i++) {
                this.addStripe();
            }

            // cache some DOM elements
            this.stripes = $(this.element).find('.'+this.options.stripeClass);
            this.currentAngle = 0;
            this.flaps = [];
        },

        addStripe: function() {
            var that = this,
                space = $('<section></section>').addClass(this.options.stripeSpaceClass),
                strip = $('<div></div>').addClass(this.options.stripeClass),
                frontFace = $('<figure></figure>').addClass(this.options.stripeFaceFrontClass),
                topFace = $('<figure></figure>').addClass(this.options.stripeFaceTopClass),
                bottomFace = $('<figure></figure>').addClass(this.options.stripeFaceBottomClass);

            $([frontFace, topFace, bottomFace]).each(function(i, f){
                // add the inner face
                f.addClass(that.options.stripeFaceClass);
                f.append($('<span></span>').addClass(that.options.stripeInnerFaceClass));
            });
            strip.append(frontFace).append(topFace).append(bottomFace);
            space.append(strip);
            $(this.element).append(space);
        },

        /**
         * Add a flap
         * which is the container of a pack of stripes content
         */
        addFlap: function(contents) {
            // if there is too much contents raise an error
            if (contents.length > this.options.stripes)
                throw "There isn't enough stripes for the contents submitted";

            var that = this;

            this.flaps.push(contents);

            // load first stripe face content
            if (this.flaps.length == 1) {
                this.stripes.each(function(i, s){
                    var frontFace = $(s).find('.'+that.options.stripeFaceClass)[0];
                    that.loadFaceContent(frontFace, i, 0);
                })
            }
        },

        loadFaceContent: function(face, stripeIndex, relativeFlapIndex) {
            // take module the relativeFlapIndex to have the absolute face index
            var flapIndex = relativeFlapIndex % this.flaps.length,
                flapContent = this.flaps[flapIndex][stripeIndex];

            // protect missing content
            if (!flapContent) {
                return;
            }

            $(face).find('.'+this.options.stripeInnerFaceClass)
                    .html(flapContent.html);

            if (flapContent.styles && typeof flapContent.styles == "object") {
                $(face).css(flapContent.styles);
            } else {
                // otherwise reset the inline styles
                $(face).removeAttr('style');
            }
        },

        /**
         * Perform the actual CSS3D animation
         */
        animate: function() {
            var self = this;
            this.animationTimer = setTimeout(function(){
                self.next()
            }, this.options.animationInterval);
        },

        /**
         * Transition to the next stripe
         */
        next: function() {
            var that = this,
                delay = this.options.animationDelay,
                nextAngle = this.currentAngle + 120;

            // reset the timer (important if the animation was manually trigger)
            clearTimeout(this.animationTimer);

            this.stripes.each(function(stripeIndex, s) {

                // find the rotation direction for the stripe
                var clockwise = stripeIndex%2==0,
                    angle = (clockwise ? -1 : 1) * nextAngle,
                    mod = ((-angle / 120) >> 0) % 3;
                    // console.log(mod)
                // mod is the number of rotation from the front-face modulo 3
                if (mod < 0) {
                    mod += 3;
                }

                // load the next face content
                var nextFace = $(s).find('.'+that.options.stripeFaceClass+':eq('+mod+')'),
                    relativeNextFlapIndex = nextAngle/120;
                that.loadFaceContent(nextFace, stripeIndex, relativeNextFlapIndex);

                // perform the rotation
                setTimeout(function(){
                    applyVendorCSS(s, 'transform', 'rotateX( ' + angle + 'deg )');
                }, stripeIndex*delay);
            });
            this.currentAngle = nextAngle;

            //this.animate();
        }
    };

    // A really lightweight plugin wrapper around the constructor,
    // preventing against multiple instantiations
    $.fn[pluginName] = function ( options ) {
        return this.each(function () {
            if (!$.data(this, "plugin_" + pluginName)) {
                $.data(this, "plugin_" + pluginName, new Plugin( this, options ));
            }
        });
    };

})( jQuery, window, document );

}

// Call 'c' when the action is considered "completed".
c();
