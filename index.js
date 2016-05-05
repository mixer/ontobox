(function (factory) {
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = factory();
    } else if (typeof define === 'function' && define.amd) {
        define('ontobox', factory)
    } else {
        window.OntoBox = factory();
    }
})(function () {

    /**
     * If jQuery is in the window and the target element is an instance of
     * a jQuery object, we return the underlying Node. Otherwise we return
     * the object if it's a Node, or undefined.
     * @param  {Node|jQuery} $el
     * @return {Node}
     */
    function unwrapJQuery($el) {
        if (typeof jQuery !== 'undefined' && $el instanceof jQuery) {
            return el.get(0);
        }
        if ($el instanceof Node) {
            return $el;
        }

        return undefined;
    }

    /**
     * Returns whether the provided point is within the triangle formed
     * by the given sets of points. Each point is an [x, y] tuple.
     * @see {@link https://koozdra.wordpress.com/2012/06/27/javascript-is-point-in-triangle/}
     * @param  {[]Number} point
     * @param  {[]Number} a
     * @param  {[]Number} b
     * @param  {[]Number} c
     * @return {Boolean}
     */
    function inTriangle(point, a, b, c) {
        var v0 = [c[0]-a[0], c[1]-a[1]];
        var v1 = [b[0]-a[0], b[1]-a[1]];
        var v2 = [point[0]-a[0], point[1]-a[1]];

        var dot00 = (v0[0] * v0[0]) + (v0[1] * v0[1]);
        var dot01 = (v0[0] * v1[0]) + (v0[1] * v1[1]);
        var dot02 = (v0[0] * v2[0]) + (v0[1] * v2[1]);
        var dot11 = (v1[0] * v1[0]) + (v1[1] * v1[1]);
        var dot12 = (v1[0] * v2[0]) + (v1[1] * v2[1]);

        var invDenom = 1 / (dot00 * dot11 - dot01 * dot01);

        var u = (dot11 * dot02 - dot01 * dot12) * invDenom;
        var v = (dot00 * dot12 - dot01 * dot02) * invDenom;

        return (u >= 0) && (v >= 0) && (u + v < 1);
    }

    /**
     * @enum {Number}
     */
    var states = Object.freeze({
        // the user opened the box but did not yet hover over it
        opened: 0,
        // the user hovered over the box
        hovered: 1,
    });


    /**
     * OntoBox tracks the mouse state and lets the user know when the box
     * should be closed.
     * @param {Object} options
     * @param {Node} options.target target popped-up node
     * @param {Number} [options.threshold=100] distance in pixels the mouse
     *                                         has to be outside the box for
     *                                         a close to trigger.
     * @param {Function} options.onclose fired when the mouse moves outside
     *                                   the box too far
     */
    function OntoBox(options) {
        this._node = unwrapJQuery(options.target);
        if (!this._node) {
            throw new Error('Invalid element passed to OntoBox');
        }

        this._start = null; // filled in with an { x: Number, y: Number } object
        this._threshold = options.threshold === undefined ? 100 : options.threshold;
        this._closeHandler = options.onclose;
        this._state = states.opened;
        this._bind();
        this.recalculate();
    }

    /**
     * Bind sets up event listeners on the DOM. This is called automatically
     * when the box is constructed.
     */
    OntoBox.prototype._bind = function () {
        var mouseMove = this._mouseMove.bind(this);
        var mouseDown = this._mouseDown.bind(this);
        var recalculate = this.recalculate.bind(this);

        window.addEventListener('mousemove', mouseMove);
        window.addEventListener('mousedown', mouseDown);
        window.addEventListener('resize', recalculate);

        // teardown function called in .destroy()
        this._destroy = function () {
            window.removeEventListener('mousemove', mouseMove);
            window.removeEventListener('mousedown', mouseDown);
            window.removeEventListener('resize', recalculate);
        };
    };

    /**
     * Returns true if the mouse event occurred outside the box.
     * @param  {Event}  ev
     * @param  {Number} [grow=0] how many pixes to "grow" the box area
     * @return {Boolean}
     */
    OntoBox.prototype._outsideBox = function (ev, grow) {
        grow = grow || 0;

        return ev.clientX < (this._box.left - grow) ||
            ev.clientX > (this._box.right + grow) ||
            ev.clientY < (this._box.top - grow) ||
            ev.clientY > (this._box.bottom + grow);
    };

    /**
     * Mouse move handler event, called whenever the mouse move anywhere on
     * the document.
     * @param  {Event} ev
     */
    OntoBox.prototype._mouseMove = function (ev) {
        var start = this._start;
        var point = [ ev.clientX, ev.clientY ];
        if (!start) {
            start = this._start = point;
        }

        switch (this._state) {
        case states.opened:
            // when the user starts hovering on the box, close
            if (!this._outsideBox(ev)) {
                this._state = states.hovered;
                return;
            }

            // otherwise, we ensure that the provided point is in at least
            // one of the triangles formed between the start point and
            // the corners of the box
            var corners = [
                [this._box.left, this._box.top],
                [this._box.left, this._box.bottom],
                [this._box.right, this._box.top],
                [this._box.right, this._box.bottom],
            ];

            var inside = false;
            for (var i = 1; i < corners.length; i++) {
                inside = inside || inTriangle(point, start, corners[i], corners[i - 1]);
            }

            if (!inside) {
                this._close();
            }

        break;
        case states.hovered:
            if (this._outsideBox(ev, this._threshold)) {
                this._close();
            }

        break;
        default:
            throw new Error('Unknown state ' + this._state);
        }
    };

    /**
     * Triggered when the user depresses their mouse anywhere on the page.
     * Closes the box if the mouse is outside of it.
     * @param  {Event} ev
     */
    OntoBox.prototype._mouseDown = function (ev) {
        if (this._outsideBox(ev)) {
            this._close();
        }
    };

    /**
     * Fires the close handler and destroys the OntoBox.
     */
    OntoBox.prototype._close = function () {
        this._closeHandler();
        this._destroy();
    };

    /**
     * Recalculates the bounding box of the provided element. Should be
     * called if you suspect its size may have changed.
     */
    OntoBox.prototype.recalculate = function () {
        this._box = this._node.getBoundingClientRect();
    };


    /**
     * Destroys resources and listeners associated with the box.
     */
    OntoBox.prototype.destroy = function () {
        this._destroy();
    };

    return OntoBox;
});
