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
            down(50, 50);
            expect(closed).to.be.false;
        });
    });

    describe('movement', function () {
        it('stays open when moving horizontally', function () {
            move(180, 50);
            move(130, 50);
            move(75, 50);
            expect(closed).to.be.false;
        });

        it('stays open when moving diagonally', function () {
            move(200, 200);
            move(180, 180);
            move(120, 50);
            move(50, 120);
            move(50, 50);
            expect(closed).to.be.false;
        });

        it('closes when moving away from the box', function () {
            move(180, 50);
            move(150, 150);
            expect(closed).to.be.true;
        });

        it('closes after hovering over the box and moving a threshold away', function () {
            move(180, 50);
            move(75, 50);
            move(75, 110);
            expect(closed).to.be.false;
            move(75, 160);
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
