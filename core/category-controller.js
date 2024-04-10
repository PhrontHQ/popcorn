var Montage = require("montage").Montage;
var RangeController = require("montage/core/range-controller").RangeController;

exports.CategoryController = class CategoryController extends Montage {

    static {
        const p = this.prototype;

        p.title = null;
        p.key = null;
        p.contentController = null;
    }

    constructor(title, key) {
        super();
        
        this.title = title;
        this.key = key;
        var controller = new RangeController();
        controller.avoidsEmptySelection = true;
        this.contentController = controller;
    }
};
