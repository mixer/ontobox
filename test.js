describe('ontobox', function () {
    var el;
    var box;
    var closed;

    function runEvent(name, x, y) {
        var ev = document.createEvent("MouseEvent");
        ev.initMouseEvent(
            name,
            true /* bubble */, true /* cancelable */,
            window, null,
            x, y, x, y, /* coordinates */
            false, false, false, false, /* modifier keys */
            0 /*left*/, null
        );

        window.dispatchEvent(ev);
    }

    function down(x, y) {
        runEvent('mousedown', x, y);
    }

    function move(x, y) {
        runEvent('mousemove', x, y);
    }

    before(function () {
        el = document.createElement('div');
        el.style.width = '100px';
        el.style.height = '100px';
        el.style.margin = '100px';
        document.body.appendChild(el);
    });

    beforeEach(function () {
        closed = false;
        box = new OntoBox({
            target: el,
            threshold: 50,
            onclose: function () {
                closed = true;
            },
        });
    })

    describe('clicks', function () {
        it('closes when clicks outside', function () {
            down(1000, 1000);
            expect(closed).to.be.true;
        });

        it('remains open when clicks are inside', function () {
            down(150, 150);
            expect(closed).to.be.false;
        });
    });

    describe('movement', function () {
        var granularity = 30;
        var distance = 100;
        var center = [150, 150];

        function moveToRad(rad) {
            move(Math.cos(rad) * distance + center[0], Math.sin(rad) * distance + center[1]);
        }

        function radToDeg(rad) {
            return Math.round(rad / Math.PI * 180);
        }

        for (var i = 0; i < 360; i += granularity) {
            (function (angle) {
                var rad = Math.PI * (angle / 180);

                it('stays open when moving at ' + radToDeg(rad) + ' degrees', function () {
                    var x = Math.cos(rad) * distance + center[0];
                    var y = Math.sin(rad) * distance + center[1];
                    var steps = 10;
                    move(x, y);

                    for (var k = 0; k < steps; k++) {
                        move(x, y);
                        x += Math.cos(rad + Math.PI) * (distance / steps);
                        y += Math.sin(rad + Math.PI) * (distance / steps);
                    }

                    expect(closed).to.be.false;
                });

                var directions = 8;
                for (var i = 1; i < directions; i++) {
                    (function (target) {
                        it('closes when moving +' + radToDeg(target) + ' away from ' + radToDeg(rad), function () {
                            moveToRad(rad);
                            moveToRad(rad + target);
                            expect(closed).to.be.true;
                        });
                    })(Math.PI * 2 / directions * i);
                }
            })(i);
        }

        it('closes after hovering over the box and moving a threshold away', function () {
            move(0, 0);
            move(150, 150);
            expect(closed).to.be.false;
            move(0, 0);
            expect(closed).to.be.true;
        });
    });


    afterEach(function () {
        if (box) {
            box.destroy();
            box = undefined;
        }
    });

    after(function () {
        document.body.removeChild(el);
    });
});
