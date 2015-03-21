define("dom.dom", [], function(require, exports, module){
	var _obj = require("common.object.base"),
		_class = require("dom.class.class"),
		_attr = require("dom.attr.attr"),
		_style = require("dom.style.style"),
		_dom = {};

	_dom = _obj.merge(_dom, _class);
	_dom = _obj.merge(_dom, _attr);
	_dom = _obj.merge(_dom, _style);

	module.exports = _dom;
});