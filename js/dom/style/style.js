define("dom.style.style", [], function(require, exports, module){
	var isType = require("common.object.isType");
	var _str = require("common.string.base");
	var _browser = require("system.browser");
	var r_default = /width|height|top|left|right|bottom|margin|padding|marginTop|marginLeft|marginRight|marginBottom|paddingTop|paddingLeft|paddingRight|paddingBottom|fontSize/i;
	var _unit = "px";

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
			if(window.getComputedStyle){
				return window.getComputedStyle(node, null) ? window.getComputedStyle(node, null).getPropertyValue(_str.dasherize(name)) : null;
			}

			if (document.defaultView && document.defaultView.getComputedStyle) {
                return document.defaultView.getComputedStyle(el, null) ? document.defaultView.getComputedStyle(el, null).getPropertyValue(_str.dasherize(name)) : null;
            }

            return node.currentStyle ? node.currentStyle[name] : node.style[name];
		}
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
		}
	}
});