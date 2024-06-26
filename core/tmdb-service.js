/**
 * @module ./tmdb-service
 * @requires mod/core/core
 */
var Montage = require("mod/core/core").Montage;
var RangeController = require("mod/core/range-controller").RangeController;
var Promise = require("mod/core/promise").Promise;

var CategoryController = require("./category-controller").CategoryController;
var sharedTransport = require("./jsonp-transport").shared;

var defaultLocalizer = require("mod/core/localizer").defaultLocalizer;

var API_KEY = "dbf71473cf25bbd06939baef47b626eb";
var API_URL = "https://api.themoviedb.org/3/";
var BOX_OFFICE_FEED = API_URL + "movie/now_playing"; 
var UPCOMING_FEED = API_URL + "movie/upcoming";
var TOP_RATED_FEED = API_URL + "movie/top_rated";
var POPULAR_FEED = API_URL + "movie/popular";
var POPULAR_FEED = API_URL + "movie/popular";
var MOVIE = API_URL + "movie/";
/**
 * @class TmdbService
 * @extends Montage
 */

exports.TmdbService = class TmdbService extends Montage /** @lends TmdbService# */ {

    static {
        const p = this.prototype;

        p.categories = null;
        p.latestBoxOffice = null;
        p.upcoming = null;
        p.topDvdRentals = null;
        p.inTheaters = null;
    }

    //TODO combine constructor and load
    constructor() {
        super();
        this.categories = new RangeController().initWithContent([]);
        this.categories.avoidsEmptySelection = true;
    }

    get defaultParams() {
        var language = defaultLocalizer.locale || 'en';
        return "?api_key=" + API_KEY + "&language=" + language;
    }

    load() {
        var self = this;

        self.latestBoxOffice = new CategoryController("Box Office", "box_office");
        self.upcoming = new CategoryController("Upcoming", "upcoming");
        self.topDvdRentals = new CategoryController("Top Rated", "rentals");
        self.inTheaters = new CategoryController("Popular", "in_theaters");

        self.latestBoxOffice.contentController.addRangeAtPathChangeListener("selection", this, "handleMovieSelectionChange");
        self.upcoming.contentController.addRangeAtPathChangeListener("selection", this, "handleMovieSelectionChange");
        self.topDvdRentals.contentController.addRangeAtPathChangeListener("selection", this, "handleMovieSelectionChange");
        self.inTheaters.contentController.addRangeAtPathChangeListener("selection", this, "handleMovieSelectionChange");

        var boxOfficePromise = this.loadLatestBoxOfficeMovies()
        .then(function (latestBoxOffice) {
            self.latestBoxOffice.contentController.content = latestBoxOffice;
            self.categories.content.push(self.latestBoxOffice, self.inTheaters, self.upcoming, self.topDvdRentals);
            self.categories.select(self.latestBoxOffice);
            return latestBoxOffice;
        })
        .then(function(latestBoxOffice) {
            if (latestBoxOffice && latestBoxOffice.length > 0) {
                self.preloadMovie(latestBoxOffice[0]);
            }
        });
        // we fork the promise chain to expose the resolution of the first list.
        boxOfficePromise
        .then(function () {
            // then do the rest
            return Promise.all([
                self.loadUpcomingMovies(),
                self.loadTopRated(),
                self.loadPopular()
            ]);
        })
        .then(function ([upcomingMovies, topDvdRentals, inTheaters]) {
            self.upcoming.contentController.content = upcomingMovies;
            self.topDvdRentals.contentController.content = topDvdRentals;
            self.inTheaters.contentController.content = inTheaters;
            return Promise.all([
                upcomingMovies,
                topDvdRentals,
                inTheaters
            ]);
        })
        .then(function ([upcomingMovies, topDvdRentals, inTheaters]) {
            if (upcomingMovies && upcomingMovies.length > 0) {
                self.preloadMovie(upcomingMovies[0]);
            }
            if (topDvdRentals && topDvdRentals.length > 0) {
                self.preloadMovie(topDvdRentals[0]);
            }
            if (inTheaters && inTheaters.length > 0) {
                self.preloadMovie(inTheaters[0]);
            }
        });

        return boxOfficePromise;
    }


    loadLatestBoxOfficeMovies() {

        return sharedTransport.makeRequest(BOX_OFFICE_FEED + this.defaultParams, "tmdb")
            .then(function (response) {
                return response.results;
            });
    }

    loadUpcomingMovies() {
        return sharedTransport.makeRequest(UPCOMING_FEED + this.defaultParams, "tmdb")
            .then(function (response) {
                return response.results;
            });
    }

    loadTopRated() {
        return sharedTransport.makeRequest(TOP_RATED_FEED + this.defaultParams, "tmdb")
            .then(function (response) {
                return response.results;
            });
    }

    loadPopular() {

        return sharedTransport.makeRequest(POPULAR_FEED + this.defaultParams, "tmdb")
        .then(function (response) {
            return response.results;
        });
    }

    loadMovie(movie) {
        return sharedTransport.makeRequest(MOVIE + movie.id + this.defaultParams + "&append_to_response=trailers", "tmdb")
            .then(function (response) {
                // console.log('response:', response);
                return response;
        });
    }

    loadReleases(movie) {
        return sharedTransport.makeRequest(MOVIE + movie.id + "/releases" + this.defaultParams, "tmdb")
            .then(function (response) {
                return response;
            });
    }

    preloadMovie(oldMovie) {

        if (oldMovie && !oldMovie.loaded) {
            var self = this,
                runtime;
            oldMovie.loaded = true;
            return this.loadMovie(oldMovie)
                .then(function(movie) {
                    runtime = movie.runtime;
                    return self.loadReleases(movie);
                })
                .then(function(releases) {
                    var rating = releases.countries[0].certification;

                    if (rating.length === 0) {
                        rating = "none";
                    }
                    for (var i = 0, categoriesLength = self.categories.content.length; i < categoriesLength; i++) {
                        var category = self.categories.content[i],
                            moviesLength = category.contentController.content ? category.contentController.content.length : 0;
                        for (var j = 0; j < moviesLength; j++) {
                            var storedMovie = category.contentController.content[j];
                            if (storedMovie.id === oldMovie.id) {
                                category.contentController.content[j].mpaaRating = rating;
                                category.contentController.content[j].runtime = runtime;
                                category.contentController.content[j].loaded = true;
                            }
                        }
                    }
                });
        } else {
            return Promise.resolve();
        }
    }

    handleMovieSelectionChange() {
        var self = this,
            selectedCategory = this.categories.selection.one();
        if (selectedCategory && selectedCategory.contentController && selectedCategory.contentController.selection) {
            for (var i = 0, moviesLength = selectedCategory.contentController.content.length; i < moviesLength; i++) {
                var currentMovie = selectedCategory.contentController.content[i];
                if (currentMovie === selectedCategory.contentController.selection[0]) {
                    this.preloadMovie(selectedCategory.contentController.content[i+1])
                        .then(self.preloadMovie.bind(self, selectedCategory.contentController.content[i+2]))
                        .then(self.preloadMovie.bind(self, selectedCategory.contentController.content[i+3]));
                    break;
                }
            }
        }
    }
};

exports.shared = new exports.TmdbService();
