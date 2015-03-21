define("system.system", [], function(require, exports, module){
	var _obj = require("common.object.base"),
		_browser = require("system.browser"),
		_system = {};

	_system = _obj.merge(_system, _browser);
	module.exports = _system;
});