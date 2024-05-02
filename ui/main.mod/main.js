
var Component = require("mod/ui/component").Component,
    sharedMoviesService = require("core/tmdb-service").shared,
    defaultLocalizer = require("mod/core/localizer").defaultLocalizer,
    CacheManager = require('core/cache-manager.js').CacheManager;

//TODO use details in toggle buttons
//TODO do not use matte toggle buttons
exports.Main = class Main extends Component {

    static {
        const p = this.prototype;

        p.moviesService = sharedMoviesService; 
        p._initialDataLoad = null;    

        /**
            For iOS 7.0.x iPhone/iPod Touch workaround
        */
        p._windowScrollTimeout = null;

    }

    constructor() {
        super();

        /*
        // Test localize
        defaultLocalizer.locale = 'fr';
        defaultLocalizer.localize("hello").then(function (localized) {
            console.log(localized);
        });
        */

        var localeParam = this.getParameterByName('lang');
        if (localeParam) {
            defaultLocalizer.locale = localeParam;
        }

        this.application.addEventListener( "openTrailer", this, false);

        this.canDrawGate.setField("moviesLoaded", false);
        this._initialDataLoad = this.moviesService.load();

        // Add events
        CacheManager.events.error = function (error) {
            console.error('MainUpdate', 'error', error);
        };
        CacheManager.events.cached = function () {
            console.log('MainUpdate', 'up-to-date (cached)');
        };
        CacheManager.events.noUpdate = function () {
            console.log('MainUpdate', 'up-to-date (noUpdate)');
        };
        CacheManager.events.checking = function () {
            console.log('MainUpdate', 'checking');
        };
        CacheManager.events.updateReady = function () {
            console.log('MainUpdate', 'updateReady');
        };
        CacheManager.events.noupdate = function () {
            console.log('MainUpdate', 'noupdate');
        };
        CacheManager.confirmOnUpdateReady = true;
        CacheManager.listenToUpdate();
        CacheManager.checkForUpdate();
    }

    getParameterByName(name, url) {
            if (!url) {
                url = window.location.href;
            }

            name = name.replace(/[\[\]]/g, "\\$&");
            var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
                results = regex.exec(url);
            if (!results) {
                return null;
            } else if (!results[2]) {
                return '';
            } else {
                return decodeURIComponent(results[2].replace(/\+/g, " "));   
            }
        }

    templateDidLoad() {
        var self = this;
        self._initialDataLoad.then(function () {
            self.canDrawGate.setField("moviesLoaded", true);
        });
    }

    handleOpenTrailer(event) {
        var trailers = event.detail.trailers;
        //todo: filter video list with youtube trailer available.?

        if (trailers && trailers.youtube && trailers.youtube.length) {
            var videos = trailers.youtube,
                video;

            for (var i = 0, length = videos.length; i < length; i++) {
                video = videos[i];

                if (video.name && video.name.toLowerCase().indexOf('official') > -1) {
                    break;
                }
            }

            this.templateObjects.player.openTrailer(video.source);
        }
    }

    /**
        iOS 7.0.x iPhone/iPod Touch workaround. After switching from portrait to landscape
        mode, Safari shows the content full screen. If the top or bottom of the content is
        clicked, navigation bars appear hiding content. This workaround reduces the height
        of the content.
    */
    _windowScroll(self) {
        if ((window.innerHeight === window.outerHeight) || (window.innerHeight !== this._element.offsetHeight)) {
            window.scrollTo(0, 0);
            self.templateObjects.moviestrip.movieFlow.handleResize();
            window.clearTimeout(self._windowScrollTimeout);
            self._windowScrollTimeout = window.setTimeout(function () {
                self._windowScroll(self);
            }, 700);
        }
    }

    handleOrientationchange(event) {
        var self = this;

        window.scrollTo(0, 0);
        // iOS 7.0.x iPhone/iPod Touch workaround
        if (navigator.userAgent.match(/(iPhone|iPod touch);.*CPU.*OS 7_0_\d/i)) {
            window.clearTimeout(this._windowScrollTimeout);
            if (Math.abs(window.orientation) === 90) {
                self._windowScrollTimeout = window.setTimeout(function () {
                    self._windowScroll(self);
                }, 1000);
            }
        }
    }

    enterDocument(firstTime) {
        if (firstTime) {
            window.addEventListener("orientationchange", this, false);
        }
    }

};
