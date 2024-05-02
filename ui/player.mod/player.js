
var Component = require("mod/ui/component").Component;

var TRAILER_URL = "https://www.youtube.com/embed/%s?autoplay=1&enablejsapi=1",
    PLACE_HOLDER = "%s";

exports.Player = class Player extends Component {
    static {
        const p = this.prototype;

        p.player = null;
        p._trailerId = null;
    }

    constructor() {
        super();
    }

    handleCloseButtonAction(event) {
        this.player.src = "";
        this.templateObjects.overlay.hide();
    }

    openTrailer(id) {
        this._trailerId = id;
        this.templateObjects.overlay.show();
    }

    didShowOverlay(overlay) {
        if (this._trailerId) {
            var trailerUrl = TRAILER_URL.replace(PLACE_HOLDER, encodeURIComponent(this._trailerId));
            if (this.player.src !== trailerUrl) {
                this.player.src = trailerUrl;
            }
        }
        overlay.classList.add('is-shown');
    }

    didHideOverlay(overlay) {
        this._trailerId = null;
        overlay.classList.remove('is-shown');
    }

};
