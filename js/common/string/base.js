define("common.string.base", [], function(require, exports, module){
	var _obj = require("common.object.base");

	module.exports = {
		trim: function(str){
			var result = "";

			if(typeof str !== "string"){
				str = this;
			}
			if(!str.length){
				return _obj.charge(new String(result), module.exports);
			}

			result = str.replace(/(^(\u3000|\s|\t|\u00A0)*)|((\u3000|\s|\t|\u00A0)*$)/g, "");

			return _obj.charge(new String(result), module.exports);
		},

		startsWith: function(){
			var arg = arguments,
				_str,
				_startStr;
			if(arg.length === 1){
				_str = this;
				_startStr = arg[0];
			}

			if(arg.length === 2){
				_str = arg[0];
				_startStr = arg[1];
			}

			return _str.slice(0, _startStr.length) === _startStr;
		},

		endsWith: function(){
			var arg = arguments,
				_str,
				_endStr;
			if(arg.length === 1){
				_str = this;
				_endStr = arg[0];
			}

			if(arg.length === 2){
				_str = arg[0];
				_endStr = arg[1];
			}

			return _str.slice(_str.length - _endStr.length) === _endStr;
		},

		byteLength: function(str){
			if(typeof str !== "string"){
				str = this;
			}

			if(!str.length){
				return 0;
			}

			return str.replace(/[^\x00-\xff]/g, "--").length;
		},

		//变成驼峰
		camelize: function(str){
			var result = "";

			if(typeof str !== "string"){
				str = this;
			}
			if(!str.length){
				return _obj.charge(new String(result), module.exports);
			}

			if(str.indexOf("-") < 0 && str.indexOf("_") < 0){
				return _obj.charge(new String(str), module.exports);
			}

			result = str.replace(/[^-_]([-_][^-_])/g, function(match, m1){
				return m1.charAt(1).toUpperCase();
			});

			return _obj.charge(new String(result), module.exports);
		},

		underscored: function(str){
			var result = "";

			if(typeof str !== "string"){
				str = this;
			}
			if(!str.length){
				return _obj.charge(new String(result), module.exports);
			}

			result = str.replace(/([^_])([A-Z])/g, "$1_$2").replace(/\-+/g, "_").replace(/\_{2,}/g, "_").toLowerCase();

			return _obj.charge(new String(result), module.exports);
		},

		dasherize: function(str){
			var result = "";

			if(typeof str !== "string"){
				str = this;
			}
			if(!str.length){
				return _obj.charge(new String(result), module.exports);
			}

			result = str.replace(/([^-])([A-Z])/g, "$1-$2").replace(/\_+?/g, "-").replace(/\-{2,}/g, "-").toLowerCase();

			return _obj.charge(new String(result), module.exports);
		}
	}
});