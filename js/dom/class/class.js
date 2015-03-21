define("dom.class.class", [], function(require, exports, module){
	var _str = require("common.string.base"),
		_arr = require("common.array.forEach"),
		forEach = _arr.forEach;

	module.exports = {
		addClass: function(className){
			this.forEach(function(node){
				var oldClass = node.className,
					reg = new RegExp(" " + className + " ", "g");

				if(!reg.test(" " + node.className + " ")){
					node.className = _str.trim(oldClass + " " + className);
				}
			});

			return this;
		},

		removeClass: function(className){
			this.forEach(function(node){
				var oldClass = " " + node.className + " ",
					reg = new RegExp(" " + className + " ", "g");

				oldClass = oldClass.replace(reg, " ");
				node.className = _str.trim(oldClass);
			});

			return this;
		},

		hasClass: function(className){
			var node = this[0],
				oldClass = " " + node.className + " ",
				reg = new RegExp(" " + className + " ", "g");

			return reg.test(oldClass);
		},

		toggleClass: function(className){
			var hasClass = module.exports.hasClass;
			var addClass = module.exports.addClass;
			var removeClass = module.exports.removeClass;

			this.forEach(function(node){
				var node = [node];
				node.forEach = forEach;
				if(hasClass.call(node, className)){
					removeClass.call(node, className);
				}else{
					addClass.call(node, className);
				}
			});

			return this;
		}
	}
});