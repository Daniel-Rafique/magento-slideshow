BubbleSlideshow = Class.create({
    initialize: function(carousel, options) {
        this.obj = carousel.down();
        this.tray = null;
        this.effect = null;
        this.randId = Math.round(Math.random() * 100000000);
        this.clrTimerInterval = null;
        this.numItems = 0;
        this.trayLeft = 0;

        this.options = Object.extend({
            transitionSpeed: 700,
            displayTime: 4000,
            hideCenter: false,
            advance: 1,
            margin: 0,
            customClass: null,
            showControls: true,
            auto: false,
            width: 0,
            height: 0,
            visibleImages: 1,
            padding: 0,
            opacity: 1,
            iconPrevious: '',
            iconNext: '',
            navWidth: 100,
            navHeight: 100,
            blackAndWhite: false,
            position: 'left',
            onMoveLeft: function() {},
            onMoveRight: function() {},
            onMoveEnd: function() {}
        }, options || {});

        var o = this.options,
            randId = this.randId,
            numItems = this.obj.childElements().length,
            links = [],
            itemSources = [];

        if (numItems <= 1) {
            return;
        }

        if (numItems <= o.visibleImages) {
            o.showControls = false;
            o.visibleImages = numItems;
        }

        this.numItems = numItems;

        this.obj.childElements().each(function(item) {
            var a = item.down('a');
            links.push({
                href: a ? a.href : undefined,
                target: a ? a.target : undefined,
                css: a ? a.className : undefined
            });
            if (item.down('img')) {
                itemSources.push(item.down('img').src);
            } else {
                itemSources.push(undefined);
            }
        });

        // Build carousel container
        this.obj.replace('<div id="bs-' + randId + '"></div>'); // Kick the list and its content to the curb and replace with a div
        this.obj = $('bs-' + randId); // Reassign the new div as our obj
        this.obj.setStyle({
            width: ((o.width * o.visibleImages) + (o.margin * (o.visibleImages - 1))) + 'px',
            height: o.height + 'px',
            overflow: 'hidden',
            position: 'relative'
        });

        // Build tray to hold items and populate with item container divs. Move tray one item width to the left.
        var itemMargin = '';
        if (o.position == 'left') {
            this.trayLeft = (o.width + o.margin) * numItems;
            itemMargin = 'margin:0 ' + o.margin + 'px 0 0;';
            carousel.setStyle({ position: 'absolute', top: '0', left: '-' + o.padding + 'px' });
        } else if (o.position == 'center') {
            this.trayLeft = (o.width * numItems) + ((o.margin * numItems) + o.margin / 2);
            itemMargin = 'margin:0 ' + (o.margin / 2) + 'px;';
            var marginLeft = '-' + ((o.width * o.visibleImages / 2) + (o.margin * (o.visibleImages - 1) / 2) + o.padding) + 'px';
            carousel.setStyle({ position: 'absolute', top: '0', left: '50%', marginLeft: marginLeft });
        } else if (o.position == 'right') {
            this.trayLeft = (o.width * numItems) + o.margin * (numItems + 1);
            itemMargin = 'margin:0 0 0 ' + o.margin + 'px;';
            carousel.setStyle({ position: 'absolute', top: '0', right: '-' + o.padding + 'px' });
        }

        this.trayLeft *= -1;
        var trayLeft = 'left:' + this.trayLeft + 'px;';
        var trayWidth = 3 * numItems * (o.width + o.margin);
        this.obj.insert('<div id="bs-tray-' + randId + '" class="bs-tray" style="position:relative;width:' + trayWidth + 'px;' + trayLeft + '">');
        this.tray = $('bs-tray-' + randId);
        for (i = 0; i < numItems; i++) {
            this.tray.insert('<div class="bs-item" style="overflow:hidden;float:left;position:relative; ' + itemMargin + '">');
        }

        // Populate the individual tray divs with items. Add links and captions where available.
        $$('#bs-' + randId + ' .bs-item').each(function(el, index) {
            el.insert('<img src="' + itemSources[index] + '" width="' + o.width + '" height="' + o.height + '" style="' + (o.opacity ? 'opacity: ' + o.opacity : '') + '" />');
            if (o.blackAndWhite) {
                el.down('img').setStyle({
                    '-webkit-filter': 'grayscale(100%)',
                    '-moz-filter': 'grayscale(100%)',
                    'filter': 'grayscale(100%)'
                });
            }
            if (links[index] != undefined && links[index].href != undefined && el.down('img')) {
                // IE8 needs the </a>. see http://outwardfocusdesign.com/blog/web-design-professionals/jquery/possible-fix-for-jquerys-wrap-function-for-ie8/
                el.down('img').wrap('a', {
                    'class':  links[index].css + ' bs-link',
                    'target':  links[index].target,
                    'href': links[index].href
                });
            }
        }, this);

        // Triple containers
        var items = $$('#bs-' + randId + ' .bs-item');
        for (var i = 1; i <= 2; i++) {
            items.each(function(el) {
                var cloneItem = el.cloneNode(true);
                this.tray.insert(cloneItem);
            }, this);
        }

        $$('#bs-' + randId + ' .bs-item').invoke('removeAttribute', 'id');

        // Build left/right nav
        if (o.showControls) {
            this.obj.insert('<div class="bs-left-nav" style="position:absolute;left:-' + (o.navWidth / 2) + 'px;top:' + (o.height / 2 - (o.navHeight / 2)) + 'px;">');
            this.obj.insert('<div class="bs-right-nav" style="position:absolute;right:-' + (o.navWidth / 2) + 'px;top:' + (o.height / 2 - (o.navHeight / 2)) + 'px;">');
            this.obj.down('.bs-left-nav').insert('<img style="cursor:pointer;" src="' + o.iconPrevious + '" width="' + o.navWidth + '" height="' + o.navHeight + '" />');
            this.obj.down('.bs-right-nav').insert('<img style="cursor:pointer;" src="' + o.iconNext + '" width="' + o.navWidth + '" height="' + o.navHeight + '" />');
            // Add click events for the left/right nav
            this.obj.down('.bs-left-nav img').observe('click', this.prev.bindAsEventListener(this));
            this.obj.down('.bs-right-nav img').observe('click', this.next.bindAsEventListener(this));
        }

        // If nav outside carousel, wrap carousel in a div and set padding to compensate for nav. also dont animate nav if outside images
        this.obj.wrap('div', {
            'id': 'bs-' + randId + '-wrapper',
            'class': 'bs-wrapper'
        });
        $('bs-' + randId + '').setStyle({ width: this.obj.getWidth() });
        if (o.showControls) {
            $('bs-' + randId + '-wrapper').insert({ bottom: this.obj.down('.bs-left-nav').remove() });
            $('bs-' + randId + '-wrapper').insert({ bottom: this.obj.down('.bs-right-nav').remove() });
        }

        // Adjust wrapped width when using peek padding
        this.obj.addClassName('bs-peek-padding');
        this.obj.setStyle({ padding: '0 ' + o.padding + 'px' });

        if (o.auto && !this.isAnimated()) {
            this.play();
        } else {
            this.resetTimer();
        }
    },

    isAnimated: function() {
        return this.tray.hasClassName('animated');
    },

    prev: function() {
        if (!this.isAnimated()) {
            this.moveRight(this.options.advance);
            this.stop();
        }
    },

    next: function() {
        if (!this.isAnimated()) {
            this.moveLeft(this.options.advance);
            this.stop();
        }
    },

    moveLeft: function(dist) {
        this.options.onMoveLeft.call(this);
        this.move(dist, 'left');
    },

    moveRight: function(dist) {
        this.options.onMoveRight.call(this);
        this.move(dist, 'right');
    },

    move: function(dist, dir) {
        var self = this,
            x = (this.options.width + this.options.margin) * dist;
        if (dir == 'left') {
            x *= -1;
        }
        new Effect.Move(this.tray.id, {
            x: x,
            y: 0,
            mode: 'relative',
            duration: self.options.transitionSpeed / 1000, // in seconds
            transition: Effect.Transitions.sinoidal,
            beforeStart: function() {
                self.tray.addClassName('animated');
            },
            afterFinish: function() {
                if (dir == 'left') {
                    self.tray.insert({ bottom: self.obj.down('.bs-item:first').remove() });
                } else {
                    self.tray.insert({ top: self.obj.down('.bs-item:last').remove() });
                }
                self.tray.setStyle({ left: self.trayLeft + 'px' });
                self.tray.removeClassName('animated');
                self.options.onMoveEnd.call(this);
            }
        });
    },

    animate: function() {
        var self = this;
        this.clrTimerInterval = setInterval(function() {
            self.moveLeft(self.options.advance);
        }, this.options.displayTime);
    },

    resetTimer: function() {
        clearInterval(this.clrTimerInterval);
    },

    play: function() {
        this.options.auto = true;
        if (!this.isAnimated()) {
            this.animate();
        }
    },

    stop: function() {
        this.options.auto = false;
        this.resetTimer();
    }
});
