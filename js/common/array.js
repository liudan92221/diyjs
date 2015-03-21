define("common.array", [], function(require, exports, module){
	var _object = require("common.object"),
		_base = require("common.array.base"),
		_forEach = require("common.array.forEach"),
		_arr = {};

	_arr.__type__ = "diy.array";
	_arr = _object.object.merge(_arr, _forEach);
	_arr = _object.object.merge(_arr, _base);
	var createDiyArray = function(arr){
		var arr = _object.object.getArray(arr);
		
		return _object.object.charge(arr, _arr);
	}

	module.exports = {
		createDiyArray: createDiyArray
	};
});