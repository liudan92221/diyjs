define("dom.dom", [], function(require, exports, module){
	var _obj = require("common.object.base"),
		_arr = require("common.array"),
		_class = require("dom.class.class"),
		_attr = require("dom.attr.attr"),
		_style = require("dom.style.style"),
		// _traversal = require("dom.traversal"),
		_dom = {};

	_dom = _obj.merge(_dom, _arr.array);
	_dom = _obj.merge(_dom, _class);
	_dom = _obj.merge(_dom, _attr);
	_dom = _obj.merge(_dom, _style);
	// _dom = _obj.merge(_dom, _traversal);

	module.exports = _dom;
});