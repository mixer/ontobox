# ontobox [![Build Status](https://travis-ci.org/WatchBeam/ontobox.svg?branch=master)](https://travis-ci.org/WatchBeam/ontobox)

This is a very light implementation of the algorithm behind [Amazon's "mega dropdown"](http://bjk5.com/post/44698559168/breaking-down-amazons-mega-dropdown) tailored at more generic use cases--not just menus. It provides an object that simply takes an object to attach to, and lets you know when it should be closed.

It is compatible with but does not depend on jQuery, or any other external libraries, and compiles down to under 1 KB in size.

### Example

```js
var OntoBox = require('ontobox');

new OntoBox({
    target: $el,
    onclose: function () {
        $el.remove();
    },
});
```

### API

#### new OntoBox(options)

Attaches a new hover watcher. Options:

 - `target` a DOM Node or jQuery object that is the target of the hover.
 - `onclose` an event called when the element should be destroyed (or hover state lost).
 - `threshold` after hovering, the number of pixels away from the target the mouse can stray before `onclose` is called.

#### ontobox.recalculate()

Re-checks the sizing and position of the `target` element. This is called automatically when the window is resized, and if you suspect the element size might have changed otherwise this should be called.

#### ontobox.destroy()

Removes listeners associated with the ontobox instance. This is called automatically when onclose is fired (but calling it again doesn't hurt).
