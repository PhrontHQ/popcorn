var Montage = require("mod").Montage;
var RangeController = require("mod/core/range-controller").RangeController;

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
