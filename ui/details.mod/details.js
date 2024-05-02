
var Component = require("mod/ui/component").Component;
var sharedTmdbService = require("core/tmdb-service").shared;


exports.Details = class Details extends Component { /** @lends Details# */
    static {
        const p = this.prototype;

        p.isVisible = null; 
        p._data = {
            vote_average: 5.5
        };
        p._isDetailsExpanded = false;
    }

    set data(val) {

        var self = this;

        if(val && !val.trailers) {

            sharedTmdbService.loadMovie(val)
                .then(function (movie) {
                    val.trailers = movie.trailers;
                    val.runtime = movie.runtime;
                    return movie;
                }).then(function (movie) {
                    return sharedTmdbService.loadReleases(movie);
                })
                .then(function (releases) {
                    var rating = releases.countries[0].certification;

                    if (rating.length === 0) {
                        rating = "none";
                    }

                    val.mpaaRating = rating;
                }).then(function () {
                    self.dispatchBeforeOwnPropertyChange("data", self._data);
                    self._data = val;
                    self.isVisible = true;
                    self.dispatchOwnPropertyChange("data", self._data);
                });
        
        } else {
            self._data = val;
            this.isVisible = true;
        }

        this.needsDraw = true;

    }

    get data() {
        return this._data;
    }

    draw() {
        if (this.data) {
            //jshint -W106
            var popularity = this.data.popularity;
            //jshint +W106
            if (this._isDetailsExpanded) {
                this._element.classList.add("expanded");
            } else {
                this._element.classList.remove("expanded");
            }
        }
    }

    handleRentButtonAction(event) {
        window.open( this.data.links.alternate );
    }

    handleTrailerButtonAction(event) {
        this.dispatchEventNamed("openTrailer", true, true, {trailers: this.data.trailers});
    }

    handleExpandButtonAction(event) {
        this._isDetailsExpanded = !this._isDetailsExpanded;
        this.needsDraw = true;
    }
};
