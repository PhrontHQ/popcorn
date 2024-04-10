var Component = require("montage/ui/component").Component;
var Promise = require('montage/core/promise').Promise;
var ImageElementClass = Image;
exports.Image = class Image extends Component { /** @lends Image# */
    static {
        this.images = {};
        const p = this.prototype;

        p._src = null;
        p._label = null;
    }

    set src (value) {
        if (value !== this._src) {
            this._src = value;
            this.needsDraw = true;
        }
    }

    set label (value) {
        if (value !== this._label) {
            this._label = value;
            this.needsDraw = true;
        }
    }

    _loadImage(url) {
        var images = this.constructor.images;
        if (!images.hasOwnProperty(url)) {
            var img = new ImageElementClass(),
                loadPromise = new Promise(function(resolve, reject) {
                    img.onload = function () {
                        resolve(url);
                    };
                    img.onerror = function () {
                        reject(url);
                    };        
                });
            img.src = url;
            images[url] = loadPromise;
        }
        return images[url];
    }

    draw() {

        var self = this,
            element = self._element;

        element.setAttribute('title', self._label);
        element.setAttribute('alt', self._label);

        if (self._src) {
            element.style.backgroundImage = "url(assets/image/loading-poster.gif)";
            element.style.backgroundSize = 'auto';
            self._loadImage(self._src).then(function () {
                element.style.backgroundImage = "url(" + self._src + ")";
            }).catch(function () {
                element.style.backgroundImage = "url(assets/image/no-poster.jpg)";
            }).finally(function () {
                element.style.backgroundSize = '';
            });
        } else {
            element.style.backgroundImage = "url(assets/image/no-poster.jpg)";
        }
    }

};
