define("dom.style.style", [], function(require, exports, module){
	var isType = require("common.object.isType");
	var _str = require("common.string.base");
	var _browser = require("system.browser");
	var r_default = /width|height|top|left|right|bottom|margin|padding|marginTop|marginLeft|marginRight|marginBottom|paddingTop|paddingLeft|paddingRight|paddingBottom|fontSize/i;
	var _unit = "px";

	var _get;
	(function (){
		if(window.getComputedStyle){
			_get =  function(node, name){
				return window.getComputedStyle(node, null) ? window.getComputedStyle(node, null).getPropertyValue(_str.dasherize(name)) : null;
			}

			return;
		}

		if (document.defaultView && document.defaultView.getComputedStyle) {
			_get = function(node, name){
				return document.defaultView.getComputedStyle(el, null) ? document.defaultView.getComputedStyle(el, null).getPropertyValue(_str.dasherize(name)) : null;
			}
			return;
        }

        _get = function(node, name){
        	return node.currentStyle ? node.currentStyle[name] : node.style[name];
        }
	})();

	function _correctStyle(obj){
		var style = {},
			value = "";

		for(var key in obj){
			value = obj[key];
			key = _str.camelize(key);

			if(isType.isNumber(value) && r_default.test(key)){
				value += _unit;
			}

			if (key.toLowerCase() == "float") {
                if(_browser.ie) {
                    key = "styleFloat";
                }else {
                    key = "cssFloat";
                }
            }

			style[key] = value;
		}

		return style;
	}

	function _getStyle(node, name){
		if(name === "opacity"){
			if(_browser.ie) {
                var _filter = node.style.filter,
                	_f = "";

                if(_filter){
                	_f = _filter.toLowerCase();
                }

                return _f.indexOf("opacity=") >= 0 ? parseFloat(_f.match(/opacity=([^)]*)/)[1]) / 100 : 1;
            }else {
                return node.style.opacity ? parseFloat(node.style.opacity) : 1;
            }
		}else {
			return _get(node, name);
		}
	}

	function _getNum(node, name){
		return _get(node, name) ? parseInt(_get(node, name), 10) : 0;
	}

	function _setStyle(node, obj){
		var value;

		for(var key in obj){
			value = obj[key];

			if (key.toLowerCase() == "opacity") {
                if(_browser.ie) {
                    node.style.filter = "Alpha(opacity="+value*100+")";
                }else {
                    node.style.opacity = value;
                }
            }else {
            	node.style[key] = value;
            }
		}
	}

	module.exports = {
		css: function(name, value){
			var _style = {};

			if(!this.length) return this;

			if(isType.isString(name)){
				if(typeof value !== "undefined"){
					var _obj = {};
					_obj[name] = value;

					_style = _correctStyle(_obj);
				}else {
					return _getStyle(this[0], name);
				}
			}else if(isType.isObject(name)){
				_style = _correctStyle(name);
			}

			this.forEach(function(node){
				_setStyle(node, _style);
			});

			return this;
		},

		width: function(value){
			if(!this.length) return this;

			if(typeof value === "undefined"){
				return _get(this[0], "width");
			}else {
				var _obj = {};

				if(isType.isNumber(value)){
					vaule += _unit;
				}

				_obj.width = value;
				this.forEach(function(node){
					_setStyle(node, _obj);
				});

				return this;
			}
		},

		height: function(value){
			if(!this.length) return this;

			if(typeof value === "undefined"){
				return _get(this[0], "height");
			}else {
				var _obj = {};

				if(isType.isNumber(value)){
					vaule += _unit;
				}

				_obj.height = value;
				this.forEach(function(node){
					_setStyle(node, _obj);
				});

				return this;
			}
		},

		innerWidth: function(){
			if(!this.length) return this;

			var node = this[0];

			return _getNum(node, "width") + _getNum(node, "paddingLeft") + _getNum(node, "paddingRight") + _getNum(node, "borderLeftWidth") + _getNum(node, "borderRightWidth");
		},

		innerHeight: function(){
			if(!this.length) return this;

			var node = this[0];

			return _getNum(node, "height") + _getNum(node, "paddingTop") + _getNum(node, "paddingBottom") + _getNum(node, "borderTopWidth") + _getNum(node, "borderBottomWidth");
		},

		outerWidth: function(){
			if(!this.length) return this;

			return this.innerWidth() + _getNum(this[0], "marginLeft") + _getNum(this[0], "marginRight");
		},

		outerHeight: function(){
			if(!this.length) return this;

			return this.innerHeight() + _getNum(this[0], "marginTop") + _getNum(this[0], "marginBottom");
		}
	}
});