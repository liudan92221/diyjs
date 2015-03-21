define("dom.traversal", [], function(require, exports, module){
	var _query = require("query.base.sizzle"),
		_obj = require("common.object.base");
		// _dom = require("dom.dom");

	module.exports = {
		find: function(param){
			if(!this.length) return this;

			var nodes = [];
			this.forEach(function(node){
				nodes = nodes.concat(_query(param, node));
			});

			return _obj.extend(nodes, _dom);
		}
	}
});