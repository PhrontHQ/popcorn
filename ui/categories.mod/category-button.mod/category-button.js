/**
 * @module ui/category-button.mod
 * @requires montage/ui/component
 */
var AbstractRadioButton = require("montage/ui/base/abstract-radio-button").AbstractRadioButton;

/**
 * @class CategoryButton
 * @extends Component
 */
exports.CategoryButton = class CategoryButton extends AbstractRadioButton { /** @lends CategoryButton# */
    static {
        const p = this.prototype;

        p.label = null;
    }

    constructor() {
        super();
    }
};
