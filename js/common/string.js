define("common.string", [], function(require, exports, module){
	var _obj = require("common.object.base"),
		_base = require("common.string.base"),
		_str = {};

	_str.__type__ = "diy.string";
	_str = _obj.merge(_str, _base);

	_str.createString = function(value){
		if(typeof value !== "string" && value.__type__ !== "diy.string"){
			value = "";
		}

		return _obj.charge(new String(value+""), _str);
	};

	module.exports = _str;
});