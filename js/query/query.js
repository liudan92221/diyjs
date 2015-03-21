define("query.query", [], function(require, exports, module){
	var _sizzle = require("query.base.sizzle"),
		_query = {};

	_query = {
		query: _sizzle
	}

	module.exports = _query;
});