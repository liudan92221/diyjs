define("dom.attr.attr", [], function(require, exports, module){
	var _obj = require("common.object.isType");

	function _set(node, key, value){
		switch (key){
			case "class": 
				node.className = value;
				break;
			case "style":
				node.style.cssText = value;
				break;
			default:
				node.setAttribute ? node.setAttribute(key, value) : node[key] = value;
		}
	}

	function _get(node, key){
		switch (key){
			case "class":
				return node.className;
			case "style":
				return node.style.cssText;
			default:
				return node.getAttribute ? node.getAttribute(key) : node[key];
		}
	}

	function _remove(node, key){
		node[key] = null;

		try{
			delete node[key];
		}catch(e){}
		try{
			node.removeAttribute(key);
		}catch(e){}
	}

	module.exports = {
		attr: function(key, value){
			if(_obj.isString(key) && typeof value !== "undefined"){
				this.forEach(function(node){
					_set(node, key, value);
				});

				return this;
			}

			if(_obj.isObject(key)){
				this.forEach(function(node){
					for(var n in key){
						_set(node, n, key[n]);
					}
				});

				return this;
			}

			if(_obj.isString(key)){
				return this.length ? _get(this[0], key) : undefined;
			}

			return this;
		},

		removeAttr: function(key){
			if(_obj.isString(key)){
				this.forEach(function(node){
					_remove(node, key);
				});
			}

			return this;
		}
	}
});