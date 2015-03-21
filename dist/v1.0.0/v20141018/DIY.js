/**
 * Created with JetBrains WebStorm.
 * User: liudan
 * Date: 14-7-12
 * Time: 下午3:31
 * To change this template use File | Settings | File Templates.
 */
(function (window) {
    var config = {
        charset: "UTF-8",
        path: ""
    },
        baseScript,
        url,
        headNode,
        LD;
    baseScript = window.document.getElementById("ld");
    config.path = baseScript.getAttribute ? baseScript.getAttribute("basePath") : baseScript.basePath;

    if (!config.path) {
        url = window.location.href.split("/");
        url.pop();
        config.path = url.join("/");
    }
    headNode = document.getElementsByTagName("head")[0];

    LD = "ld";
    var deferred = function () {
        var _this = this;
        _this.state = "default";
        _this.value = "";
        _this.successCallbacklist = [];
        _this.errorCallbacklist = [];

        _this.resolve = function (value) {
            if (_this.state == "default") {
                _this.state = "resolved";
                _this.value = value;

                for(var i= 0;i < _this.successCallbacklist.length;i++){
                    _this.promise.success(_this.successCallbacklist[i]);
                }
            }
        };

        _this.reject = function (value) {
            if (_this.state == "default") {
                _this.state = "rejected";
                _this.value = value;

                for(var i= 0;i < _this.errorCallbacklist.length;i++){
                    _this.promise.error(_this.errorCallbacklist[i]);
                }
            }
        };

        function promise () {
            var self = this;

            var __type__ = "promiseA";
            self.then = function (succCallback, errCallback){
                return self.success(succCallback).error(errCallback);
            };
            self.success = function (callback){
                if(_this.state == "resolved"){
                    var tempValue = callback.call(self, _this.value);
                    if(tempValue){
                        if(tempValue.getType() == "promiseA"){
                            _this.promise = tempValue;
                        }else{
                            _this.value = tempValue
                        }
                    }
                }else{
                    _this.successCallbacklist.push(callback);
                }
                return _this.promise;
            };
            self.error = function(callback){
                if(_this.state == "rejected"){
                    var tempValue = callback.call(self, _this.value);
                    if(tempValue){
                        if(tempValue.getType() == "promiseA"){
                            _this.promise = tempValue;
                        }else{
                            _this.value = tempValue
                        }
                    }
                }else{
                    _this.errorCallbacklist.push(callback);
                }
                return _this.promise;
            };
            self._getState = function(){
                return _this.state;
            };
            self._getValue = function(){
                return _this.value;
            };
            self.getType = function(){
                return __type__;
            };

            self.promises = [];
            self.all = function(promises){
                self.promises = promises instanceof Array ? promises : [promises];
                var len = self.promises.length;
                for(var i=0; i < len;i++){
                    (function(i){
                        self.promises[i].then(function(){
                            var state = true,
                                args = [];
                            for(var n=0;n < len;n++){
                                if(self.promises[n]._getState() == "rejected" || self.promises[n]._getState() == "default"){
                                    state = false;
                                }else{
                                    args.push(self.promises[n]._getValue());
                                }
                            }
                            if(state){
                                _this.resolve(args);
                            }
                        }, function(){
                            var state = true,
                                args = [];
                            for(var n=0;n < len;n++){
                                if(self.promises[n]._getState() == "resolved" || self.promises[n]._getState() == "default"){
                                    state = false;
                                }else{
                                    args.push(self.promises[n]._getValue());
                                }
                            }
                            if(state){
                                _this.reject(args);
                            }
                        });
                    })(i)
                }

                return self;
            };

            self.when = function(promise, callback){
                if(promise instanceof Array || promise.__type__ == "promiseA"){
                    return self.all(promise).success(callback);
                }else{
                    _this.resolve(promise);
                    return self.success(callback);
                }
            }
        }

        _this.promise = new promise();
    };
    //时间戳
    var timeStamp = new Date().getTime();

    //AMD start
    var REQUIRE = /require\(('|")([^()<>\\\/|?*:]*)('|")\)/g;
    var COMMENT_RE = /(\/\*(.|[\r\n])*?\*\/)|((\/\/.*))/g;
    var MODULEID = new RegExp('ld\\:\\d{'+ timeStamp.toString().length +'}');

    var moduleCache = {},
        idCache = {};
    window.define = function(id, deps, func){
        if(typeof id == "function"){
            func = id;
            id = LD + ":" + timeStamp++;
        }

        if(typeof deps == "function"){
            func = deps;
            deps = [];
        }
        if(!func){
            func = function(){};
        }

        var oldDeps = deps instanceof Array ? deps : [];
        deps = deps ? (deps || []).concat(getDeps(func)) : getDeps(func);
        var module = makeModule(id, deps, func, oldDeps);
        if(MODULEID.test(id)){
            move(module, function(){
                requireMain(module);
            });
        }
    }

    function requireMain(module){
        var require = function(id){
            return requireMain(moduleCache[id]);
        };
        require.async = function(id, callback){
            use(id, callback);
        };
        if(module.state < 1){
            var oldDepsLen = module.oldDeps.length;
            var parameters = [require, module.exports, module];
            //TODO  此处为AMD实现，如果define中不加入依赖，将是CMD实现，强烈建议define中写入依赖的模块不参与控制作用域以外的变量
            if(oldDepsLen){
                for(var i=0;i < oldDepsLen;i++){
                    parameters.push(require(module.oldDeps[i]));
                }
            }
            var exports = module.factory.apply(module, parameters);
            if(exports){
                module.exports = exports;
            }
            module.state = 1;
        }
        
        return module.exports;
    }

    function getDeps(func){
        var deps = [];
        func.toString().replace(COMMENT_RE, '').replace(REQUIRE, function(match, f1, f2, f3){
            deps.push(f2);
        });
        return deps;
    };

    function makeModule(id, deps, func, oldDeps){
        if(!moduleCache[id]){
            return moduleCache[id] = {id: id, deps: deps, factory: func, oldDeps: oldDeps, exports: {}, state: 0};
        }
        return moduleCache[id];
    }

    function move(module, callback){
        var unDeps = unLoad(module);
        if(!unDeps.length){
            callback && callback();
            return;
        }

        var unDefer = [];
        for(var i=0;i < unDeps.length;i++){
            unDefer.push(load(unDeps[i]));
        }
        new deferred().promise.when(unDefer, function(){
            callback && callback();
        });
    }
    function unLoad(module){
        var unDeps = [];
        var deps = module.deps = module.deps.length == 0 ? module.deps.concat(getDeps(module.factory)) : module.deps;

        for(var i=0;i < deps.length;i++){
            if(!moduleCache[deps[i]]){
                unDeps.push(deps[i]);
            }
        }
        return unDeps;
    }
    function load(id){
        var node = document.createElement("script"),
            tempNode = null;

            
        node.charset = config.charset;
        node.src = config.path + "/" + id.replace(/\./g, "/") + ".js" + (/msie/.test(navigator.userAgent.toLowerCase()) ? "?_=" + (timeStamp++) : "");
        node.async = true;

        var defer = new deferred();
        node.onload = node.onreadystatechange = function(){
            if(/^(?:loaded|complete|undefined)$/.test(node.readyState)){
                node.onerror = node.onload = node.onreadystatechange = null;
                if(moduleCache[id]){
                    move(moduleCache[id], function(){defer.resolve(id)});
                }else{
                    setTimeout(arguments.callee, 1);
                }
            }     
        };

        node.onerror = function(){
            node.error = node.onload = node.onreadystatechange = null;
            throw new Error("Module '"+id+"' is not defined");
        }

        tempNode = node;
        headNode.appendChild(node);
        tempNode = null;

        return defer.promise;    
    }
    function use(id, callback){
        id = id instanceof Array ? id : [id],
        moduleList = [];
        for(var i=0;i< id.length;i++){
            if(moduleCache[id[i]]){
                var defer = new deferred();
                move(moduleCache[id[i]], function(){
                    defer.resolve(id[i]);
                });
                moduleList.push(defer.promise);
            }else{
                moduleList.push(load(id[i]));
            }
        }
        new deferred().promise.when(moduleList, function(moduleList){
            if(callback){
                var exports = [];
                for(var i=0;i < moduleList.length;i++){
                    exports.push(requireMain(moduleCache[moduleList[i]]));
                }
                callback.apply(null, exports);
            }
        });
    }

    var diy = function(){};
    diy.define = window.define;
    diy.use = use;
    window.diy = diy;
})(window);
(function (window) {
	var __fnArr__ = [],
        isRead = false,
        diy = function(){
	        var arg = arguments[0];

            if(typeof arg === "string"){
                return diy.query(arg);
            }

	        if(typeof arg === "function"){
	            diy.ready(arg);
	            return diy;
	        }

	        if(arg instanceof Array && isArray(arg)){
	            return diy.createDiyArray(arg);
	        }
    	};

    window.hasOwnProperty = window.hasOwnProperty || Object.prototype.hasOwnProperty;

    function isArray(arr){
        if(Array.isArray){
            return Array.isArray(arr);
        }

        return Object.prototype.toString.call(arr) === "[object Array]";
    }

    diy.ready = function(callback){
        if(typeof callback == "function"){
            __fnArr__.push(callback);
        }
        if(isRead){
            diy.allReady();
        }
    };
    diy.allReady = function(){
        var _fn_ = null;
        while(_fn_ = __fnArr__.shift()){
            window.diy.define(_fn_);
        }
    }

    for(var key in window.diy){
    	if(window.diy.hasOwnProperty(key)){
    		diy[key] = window.diy[key];
    	}
    }

    window.diy = diy;

    function DOMContentLoaded(callback){
        function doReady(){
            if(!isRead){
                isRead = true;
                callback();
            }
        }

        if(window.document.readyState == "complete"){
            doReady();
        }else if(window.document.addEventListener){
            window.document.addEventListener("DOMContentLoaded", doReady, false);
        }else if(window.document.attachEvent){      //处理IE
            window.document.attachEvent("onreadystatechange", function(){
                if(document.readyState == "complete"){
                    doReady();
                }
            });

            if(document.documentElement.doScroll){
                (function(){
                    try{
                        document.documentElement.doScroll("left");
                    }catch(e){
                        setTimeout(arguments.callee, 20);
                        return;
                    }
                    doReady();
                })();
            }
        }
    }
    DOMContentLoaded(function(){
        diy.allReady();
    });
})(window)
/**
 * Created with JetBrains WebStorm.
 * User: liudan
 * Date: 14-8-11
 * Time: 下午9:52
 * To change this template use File | Settings | File Templates.
 */
define("common.object.base", [], function(require, exports, module){
    module.exports = {
        create: function(obj){
            return function(){
                this.initialize.apply(this, arguments);
            }
        },

        extend: function(subClass, superClass){
            var Fn = function(){
                var arg = subClass.apply(this, arguments);
                if(superClass.apply)
                    superClass.apply(this, arg);
            };
            Fn.prototype = superClass.prototype || superClass;
            Fn.prototype.constructor = subClass;
            Fn.superClass = superClass.prototype;

            return Fn;
        },

        copy: function(obj){
            return module.exports.merge({}, obj);
        },

        bind: function(fn, scope){
            return function(){
                fn.apply(scope, arguments);
            }
        },

        coverage: function(options, defaults){
            var _obj = options || {};
            for(var key in defaults){
                _obj[key] = _obj.hasOwnProperty(key) ? _obj[key] : defaults[key];
            }

            return _obj;
        },

        merge: function(options, defaults){
            var _obj = options || {};
            for(var key in defaults){
                if(typeof defaults[key] == "object" && typeof _obj[key] == "object"){
                    _obj[key] = arguments.callee(_obj[key], defaults[key]);
                }else{
                    _obj[key] = defaults[key];
                }
            }
            return _obj;
        },

        charge: function(options, defaults){
            var _obj = options || {};
            for(var key in defaults){
                _obj[key] = _obj[key] || defaults[key];
            }
            return _obj;
        },

        getArray: function(list){
            return Array.prototype.slice.apply(list);
        }
    }
});
/**
 * Created with JetBrains WebStorm.
 * User: liudan
 * Date: 14-8-3
 * Time: 下午4:31
 * To change this template use File | Settings | File Templates.
 */
define("common.object.isType", [], function(require, exports, module){
    function isType(type){
        return function(obj){
            return Object.prototype.toString.call(obj) === "[object "+ type +"]";
        }
    }

    function isNumber(obj){
        if(isType("Number")(obj) && !isNaN(obj)){
            return true;
        }
        return false;
    }

    function isWindow(obj){
        return obj == document && !document == obj;
    }

    function isPlainObject(obj){
        if(Object.getPrototypeOf){
            return obj && isType("Object")(obj) && Object.getPrototypeOf(obj) === Object.prototype;
        }

        if(!obj || !isType("Object")(obj) || obj.nodeType || isWindow(obj)){
            return false;
        }

        try{
            if(obj.constructor && hasOwnProperty.call(obj.costructor.prototype, "isPrototypeOf")){
                return false;
            }
        }catch(e){
            return false;
        }

        return true;
    }

    function  isEmptyObject(obj){
        for (var key in obj) {
            return false;
        }
        return true;
    }

    module.exports = {
        isObject: isType("Object"),
        isString: isType("String"),
        isArray: Array.isArray || isType("Array"),
        isFunction: isType("Function"),
        isNumber: isNumber,
        isWindow: isWindow,
        isPlainObject: isPlainObject,
        isEmptyObject: isEmptyObject
    }
});

define("common.object.primary", [], function(require, exports, module){
    module.exports = {
        keys: Object.keys || function(obj){
            var result = [];

            if(obj instanceof Object){
                for(var key in obj){
                    if(obj.hasOwnProperty(key)){
                        result.push(key);
                    }
                }
                return result;
            }else{
                throw new TypeError("Object.keys called on non-object");
            }
        }
    }
});
/**
 * Created with JetBrains WebStorm.
 * User: liudan
 * Date: 14-8-3
 * Time: 下午4:24
 * To change this template use File | Settings | File Templates.
 */
define("common.object", [], function(require, exports, module){
    var _base = require("common.object.base"),
        _isType = require("common.object.isType"),
        _primary = require("common.object.primary"),
        _obj = {};

    _obj = _base.merge(_obj, _base);
    _obj = _base.merge(_obj, _isType);
    _obj = _base.merge(_obj, _primary);

    module.exports = {
    	object: _obj
    };
});

define("common.array.base", [], function(require, exports, module){
	module.exports = {
		indexOf: function(item, index){
			var len = this.length,
				i = index || 0;

			i = i < 0 ? i + len : i;
			for(;i < len;i++){
				if(this[i] === item){
					return i;
				}
			}
			return -1;
		},

		lastIndexOf: function(item, index){
			var len = this.length,
				i = index || (len - 1);

			i = i < 0 ? Math.max(0, len+i) : i;
			for(;i >= 0;i--){
				if(this[i] === item){
					return i;
				}
			}
			return -1;
		}
	}
});
define("common.array.forEach", [], function(require, exports, module){
	var forEach = Array.prototype.forEach || function(fn){
		var len = this.length;
		for(var i = 0; i < len; i++){
			fn(this[i], i);
		}
	}

	module.exports = {
		forEach: function(fn){
			forEach.call(this, fn);
		},

		each: function(fn){
			var len = this.length;
			for(var i = 0; i < len; i++){
				fn.call(this[i],this[i], i);
			}
		},

		map: function(fn){
			var len = this.length,
				result = [];
			for(var i = 0; i < len; i++){
				result.push(fn(this[i], i));
			}
			return diy.createDiyArray(result);
		},

		filter: function(fn){
			var len = this.length,
				result = [];
			for(var i = 0; i < len; i++){
				if(fn(this[i], i)){
					result.push(this[i]);
				}
			}
			return diy.createDiyArray(result);
		}
	}
});
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
define("system.browser", [], function(require, exports, module){
	var _b = navigator.userAgent.toLowerCase();

	module.exports = {
		version : (_b.match( /.+(?:rv|chrome|ra|ie)[\/: ]([\d.]+)/ ) || [])[1],
        ie : /msie/.test(_b),
        moz : /gecko/.test(_b),
        safari : /safari/.test(_b),
        ff : /firefox/i.test(_b),
        chrome : /chrome/i.test(_b)
	}
});
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
define("dom.dom", [], function(require, exports, module){
	var _obj = require("common.object.base"),
		_class = require("dom.class.class"),
		_attr = require("dom.attr.attr"),
		_style = require("dom.style.style"),
		_dom = {};

	_dom = _obj.merge(_dom, _class);
	_dom = _obj.merge(_dom, _attr);
	_dom = _obj.merge(_dom, _style);

	module.exports = _dom;
});
define("query.base.sizzle", [], function(require, exports, module) {
	var _obj = require("common.object");
	var _arr = require("common.array");
	var _dom = require("dom.dom");

	var i,
		support,
		Expr,
		getText,
		isXML,
		tokenize,
		compile,
		select,
		outermostContext,
		sortInput,
		hasDuplicate,

		// Local document vars
		setDocument,
		document,
		docElem,
		documentIsHTML,
		rbuggyQSA,
		rbuggyMatches,
		matches,
		contains,

		// Instance-specific data
		expando = "sizzle" + -(new Date()),
		preferredDoc = window.document,
		dirruns = 0,
		done = 0,
		classCache = createCache(),
		tokenCache = createCache(),
		compilerCache = createCache(),
		sortOrder = function( a, b ) {
			if ( a === b ) {
				hasDuplicate = true;
			}
			return 0;
		},

		// General-purpose constants
		strundefined = typeof undefined,
		MAX_NEGATIVE = 1 << 31,

		// Instance methods
		hasOwn = ({}).hasOwnProperty,
		arr = [],
		pop = arr.pop,
		push_native = arr.push,
		push = arr.push,
		slice = arr.slice,
		// Use a stripped-down indexOf if we can't use a native one
		indexOf = arr.indexOf || function( elem ) {
			var i = 0,
				len = this.length;
			for ( ; i < len; i++ ) {
				if ( this[i] === elem ) {
					return i;
				}
			}
			return -1;
		},

		booleans = "checked|selected|async|autofocus|autoplay|controls|defer|disabled|hidden|ismap|loop|multiple|open|readonly|required|scoped",

		// Regular expressions

		// http://www.w3.org/TR/css3-selectors/#whitespace
		whitespace = "[\\x20\\t\\r\\n\\f]",

		// http://www.w3.org/TR/CSS21/syndata.html#value-def-identifier
		identifier = "(?:\\\\.|[\\w-]|[^\\x00-\\xa0])+",

		// Attribute selectors: http://www.w3.org/TR/selectors/#attribute-selectors
		attributes = "\\[" + whitespace + "*(" + identifier + ")(?:" + whitespace +
			// Operator (capture 2)
			"*([*^$|!~]?=)" + whitespace +
			// "Attribute values must be CSS identifiers [capture 5] or strings [capture 3 or capture 4]"
			"*(?:'((?:\\\\.|[^\\\\'])*)'|\"((?:\\\\.|[^\\\\\"])*)\"|(" + identifier + "))|)" + whitespace +
			"*\\]",

		pseudos = ":(" + identifier + ")(?:\\((" +
			// To reduce the number of selectors needing tokenize in the preFilter, prefer arguments:
			// 1. quoted (capture 3; capture 4 or capture 5)
			"('((?:\\\\.|[^\\\\'])*)'|\"((?:\\\\.|[^\\\\\"])*)\")|" +
			// 2. simple (capture 6)
			"((?:\\\\.|[^\\\\()[\\]]|" + attributes + ")*)|" +
			// 3. anything else (capture 2)
			".*" +
			")\\)|)",

		// Leading and non-escaped trailing whitespace, capturing some non-whitespace characters preceding the latter
		rtrim = new RegExp( "^" + whitespace + "+|((?:^|[^\\\\])(?:\\\\.)*)" + whitespace + "+$", "g" ),

		rcomma = new RegExp( "^" + whitespace + "*," + whitespace + "*" ),
		rcombinators = new RegExp( "^" + whitespace + "*([>+~]|" + whitespace + ")" + whitespace + "*" ),

		rattributeQuotes = new RegExp( "=" + whitespace + "*([^\\]'\"]*?)" + whitespace + "*\\]", "g" ),

		rpseudo = new RegExp( pseudos ),
		ridentifier = new RegExp( "^" + identifier + "$" ),

		matchExpr = {
			"ID": new RegExp( "^#(" + identifier + ")" ),
			"CLASS": new RegExp( "^\\.(" + identifier + ")" ),
			"TAG": new RegExp( "^(" + identifier + "|[*])" ),
			"ATTR": new RegExp( "^" + attributes ),
			"PSEUDO": new RegExp( "^" + pseudos ),
			"CHILD": new RegExp( "^:(only|first|last|nth|nth-last)-(child|of-type)(?:\\(" + whitespace +
				"*(even|odd|(([+-]|)(\\d*)n|)" + whitespace + "*(?:([+-]|)" + whitespace +
				"*(\\d+)|))" + whitespace + "*\\)|)", "i" ),
			"bool": new RegExp( "^(?:" + booleans + ")$", "i" ),
			// For use in libraries implementing .is()
			// We use this for POS matching in `select`
			"needsContext": new RegExp( "^" + whitespace + "*[>+~]|:(even|odd|eq|gt|lt|nth|first|last)(?:\\(" +
				whitespace + "*((?:-\\d)?\\d*)" + whitespace + "*\\)|)(?=[^-]|$)", "i" )
		},

		rinputs = /^(?:input|select|textarea|button)$/i,
		rheader = /^h\d$/i,

		rnative = /^[^{]+\{\s*\[native \w/,

		// Easily-parseable/retrievable ID or TAG or CLASS selectors
		rquickExpr = /^(?:#([\w-]+)|(\w+)|\.([\w-]+))$/,

		rsibling = /[+~]/,
		rescape = /'|\\/g,

		// CSS escapes http://www.w3.org/TR/CSS21/syndata.html#escaped-characters
		runescape = new RegExp( "\\\\([\\da-f]{1,6}" + whitespace + "?|(" + whitespace + ")|.)", "ig" ),
		funescape = function( _, escaped, escapedWhitespace ) {
			var high = "0x" + escaped - 0x10000;
			// NaN means non-codepoint
			// Support: Firefox<24
			// Workaround erroneous numeric interpretation of +"0x"
			return high !== high || escapedWhitespace ?
				escaped :
				high < 0 ?
					// BMP codepoint
					String.fromCharCode( high + 0x10000 ) :
					// Supplemental Plane codepoint (surrogate pair)
					String.fromCharCode( high >> 10 | 0xD800, high & 0x3FF | 0xDC00 );
		};

	// Optimize for push.apply( _, NodeList )
	try {
		push.apply(
			(arr = slice.call( preferredDoc.childNodes )),
			preferredDoc.childNodes
		);
		// Support: Android<4.0
		// Detect silently failing push.apply
		arr[ preferredDoc.childNodes.length ].nodeType;
	} catch ( e ) {
		push = { apply: arr.length ?

			// Leverage slice if possible
			function( target, els ) {
				push_native.apply( target, slice.call(els) );
			} :

			// Support: IE<9
			// Otherwise append directly
			function( target, els ) {
				var j = target.length,
					i = 0;
				// Can't trust NodeList.length
				while ( (target[j++] = els[i++]) ) {}
				target.length = j - 1;
			}
		};
	}

	function Sizzle( selector, context, results, seed ) {
		var match, elem, m, nodeType,
			// QSA vars
			i, groups, old, nid, newContext, newSelector;

		if ( ( context ? context.ownerDocument || context : preferredDoc ) !== document ) {
			setDocument( context );
		}

		context = context || document;
		results = results || [];
		results = _arr.createDiyArray(results);
		results = _obj.object.merge(results, _dom);

		if ( !selector || typeof selector !== "string" ) {
			return results;
		}

		if ( (nodeType = context.nodeType) !== 1 && nodeType !== 9 ) {
			return [];
		}

		if ( documentIsHTML && !seed ) {

			// Shortcuts
			if ( (match = rquickExpr.exec( selector )) ) {
				// Speed-up: Sizzle("#ID")
				if ( (m = match[1]) ) {
					if ( nodeType === 9 ) {
						elem = context.getElementById( m );
						// Check parentNode to catch when Blackberry 4.6 returns
						// nodes that are no longer in the document (jQuery #6963)
						if ( elem && elem.parentNode ) {
							// Handle the case where IE, Opera, and Webkit return items
							// by name instead of ID
							if ( elem.id === m ) {
								results.push( elem );
								return results;
							}
						} else {
							return results;
						}
					} else {
						// Context is not a document
						if ( context.ownerDocument && (elem = context.ownerDocument.getElementById( m )) &&
							contains( context, elem ) && elem.id === m ) {
							results.push( elem );
							return results;
						}
					}

				// Speed-up: Sizzle("TAG")
				} else if ( match[2] ) {
					push.apply( results, context.getElementsByTagName( selector ) );
					return results;

				// Speed-up: Sizzle(".CLASS")
				} else if ( (m = match[3]) && support.getElementsByClassName ) {
					push.apply( results, context.getElementsByClassName( m ) );
					return results;
				}
			}

			// QSA path
			if ( support.qsa && (!rbuggyQSA || !rbuggyQSA.test( selector )) ) {
				nid = old = expando;
				newContext = context;
				newSelector = nodeType === 9 && selector;

				// qSA works strangely on Element-rooted queries
				// We can work around this by specifying an extra ID on the root
				// and working up from there (Thanks to Andrew Dupont for the technique)
				// IE 8 doesn't work on object elements
				if ( nodeType === 1 && context.nodeName.toLowerCase() !== "object" ) {
					groups = tokenize( selector );

					if ( (old = context.getAttribute("id")) ) {
						nid = old.replace( rescape, "\\$&" );
					} else {
						context.setAttribute( "id", nid );
					}
					nid = "[id='" + nid + "'] ";

					i = groups.length;
					while ( i-- ) {
						groups[i] = nid + toSelector( groups[i] );
					}
					newContext = rsibling.test( selector ) && testContext( context.parentNode ) || context;
					newSelector = groups.join(",");
				}

				if ( newSelector ) {
					try {
						push.apply( results,
							newContext.querySelectorAll( newSelector )
						);
						return results;
					} catch(qsaError) {
					} finally {
						if ( !old ) {
							context.removeAttribute("id");
						}
					}
				}
			}
		}

		// All others
		return select( selector.replace( rtrim, "$1" ), context, results, seed );
	}

	/**
	 * Create key-value caches of limited size
	 * @returns {Function(string, Object)} Returns the Object data after storing it on itself with
	 *	property name the (space-suffixed) string and (if the cache is larger than Expr.cacheLength)
	 *	deleting the oldest entry
	 */
	function createCache() {
		var keys = [];

		function cache( key, value ) {
			// Use (key + " ") to avoid collision with native prototype properties (see Issue #157)
			if ( keys.push( key + " " ) > Expr.cacheLength ) {
				// Only keep the most recent entries
				delete cache[ keys.shift() ];
			}
			return (cache[ key + " " ] = value);
		}
		return cache;
	}

	/**
	 * Mark a function for special use by Sizzle
	 * @param {Function} fn The function to mark
	 */
	function markFunction( fn ) {
		fn[ expando ] = true;
		return fn;
	}

	/**
	 * Support testing using an element
	 * @param {Function} fn Passed the created div and expects a boolean result
	 */
	function assert( fn ) {
		var div = document.createElement("div");

		try {
			return !!fn( div );
		} catch (e) {
			return false;
		} finally {
			// Remove from its parent by default
			if ( div.parentNode ) {
				div.parentNode.removeChild( div );
			}
			// release memory in IE
			div = null;
		}
	}

	/**
	 * Adds the same handler for all of the specified attrs
	 * @param {String} attrs Pipe-separated list of attributes
	 * @param {Function} handler The method that will be applied
	 */
	function addHandle( attrs, handler ) {
		var arr = attrs.split("|"),
			i = attrs.length;

		while ( i-- ) {
			Expr.attrHandle[ arr[i] ] = handler;
		}
	}

	/**
	 * Checks document order of two siblings
	 * @param {Element} a
	 * @param {Element} b
	 * @returns {Number} Returns less than 0 if a precedes b, greater than 0 if a follows b
	 */
	function siblingCheck( a, b ) {
		var cur = b && a,
			diff = cur && a.nodeType === 1 && b.nodeType === 1 &&
				( ~b.sourceIndex || MAX_NEGATIVE ) -
				( ~a.sourceIndex || MAX_NEGATIVE );

		// Use IE sourceIndex if available on both nodes
		if ( diff ) {
			return diff;
		}

		// Check if b follows a
		if ( cur ) {
			while ( (cur = cur.nextSibling) ) {
				if ( cur === b ) {
					return -1;
				}
			}
		}

		return a ? 1 : -1;
	}

	/**
	 * Returns a function to use in pseudos for input types
	 * @param {String} type
	 */
	function createInputPseudo( type ) {
		return function( elem ) {
			var name = elem.nodeName.toLowerCase();
			return name === "input" && elem.type === type;
		};
	}

	/**
	 * Returns a function to use in pseudos for buttons
	 * @param {String} type
	 */
	function createButtonPseudo( type ) {
		return function( elem ) {
			var name = elem.nodeName.toLowerCase();
			return (name === "input" || name === "button") && elem.type === type;
		};
	}

	/**
	 * Returns a function to use in pseudos for positionals
	 * @param {Function} fn
	 */
	function createPositionalPseudo( fn ) {
		return markFunction(function( argument ) {
			argument = +argument;
			return markFunction(function( seed, matches ) {
				var j,
					matchIndexes = fn( [], seed.length, argument ),
					i = matchIndexes.length;

				// Match elements found at the specified indexes
				while ( i-- ) {
					if ( seed[ (j = matchIndexes[i]) ] ) {
						seed[j] = !(matches[j] = seed[j]);
					}
				}
			});
		});
	}

	/**
	 * Checks a node for validity as a Sizzle context
	 * @param {Element|Object=} context
	 * @returns {Element|Object|Boolean} The input node if acceptable, otherwise a falsy value
	 */
	function testContext( context ) {
		return context && typeof context.getElementsByTagName !== strundefined && context;
	}

	// Expose support vars for convenience
	support = Sizzle.support = {};

	/**
	 * Detects XML nodes
	 * @param {Element|Object} elem An element or a document
	 * @returns {Boolean} True iff elem is a non-HTML XML node
	 */
	isXML = Sizzle.isXML = function( elem ) {
		// documentElement is verified for cases where it doesn't yet exist
		// (such as loading iframes in IE - #4833)
		var documentElement = elem && (elem.ownerDocument || elem).documentElement;
		return documentElement ? documentElement.nodeName !== "HTML" : false;
	};

	/**
	 * Sets document-related variables once based on the current document
	 * @param {Element|Object} [doc] An element or document object to use to set the document
	 * @returns {Object} Returns the current document
	 */
	setDocument = Sizzle.setDocument = function( node ) {
		var hasCompare,
			doc = node ? node.ownerDocument || node : preferredDoc,
			parent = doc.defaultView;

		// If no document and documentElement is available, return
		if ( doc === document || doc.nodeType !== 9 || !doc.documentElement ) {
			return document;
		}

		// Set our document
		document = doc;
		docElem = doc.documentElement;

		// Support tests
		documentIsHTML = !isXML( doc );

		// Support: IE>8
		// If iframe document is assigned to "document" variable and if iframe has been reloaded,
		// IE will throw "permission denied" error when accessing "document" variable, see jQuery #13936
		// IE6-8 do not support the defaultView property so parent will be undefined
		if ( parent && parent !== parent.top ) {
			// IE11 does not have attachEvent, so all must suffer
			if ( parent.addEventListener ) {
				parent.addEventListener( "unload", function() {
					setDocument();
				}, false );
			} else if ( parent.attachEvent ) {
				parent.attachEvent( "onunload", function() {
					setDocument();
				});
			}
		}

		/* Attributes
		---------------------------------------------------------------------- */

		// Support: IE<8
		// Verify that getAttribute really returns attributes and not properties (excepting IE8 booleans)
		support.attributes = assert(function( div ) {
			div.className = "i";
			return !div.getAttribute("className");
		});

		/* getElement(s)By*
		---------------------------------------------------------------------- */

		// Check if getElementsByTagName("*") returns only elements
		support.getElementsByTagName = assert(function( div ) {
			div.appendChild( doc.createComment("") );
			return !div.getElementsByTagName("*").length;
		});

		// Support: IE<9
		support.getElementsByClassName = rnative.test( doc.getElementsByClassName );

		// Support: IE<10
		// Check if getElementById returns elements by name
		// The broken getElementById methods don't pick up programatically-set names,
		// so use a roundabout getElementsByName test
		support.getById = assert(function( div ) {
			docElem.appendChild( div ).id = expando;
			return !doc.getElementsByName || !doc.getElementsByName( expando ).length;
		});

		// ID find and filter
		if ( support.getById ) {
			Expr.find["ID"] = function( id, context ) {
				if ( typeof context.getElementById !== strundefined && documentIsHTML ) {
					var m = context.getElementById( id );
					// Check parentNode to catch when Blackberry 4.6 returns
					// nodes that are no longer in the document #6963
					return m && m.parentNode ? [ m ] : [];
				}
			};
			Expr.filter["ID"] = function( id ) {
				var attrId = id.replace( runescape, funescape );
				return function( elem ) {
					return elem.getAttribute("id") === attrId;
				};
			};
		} else {
			// Support: IE6/7
			// getElementById is not reliable as a find shortcut
			delete Expr.find["ID"];

			Expr.filter["ID"] =  function( id ) {
				var attrId = id.replace( runescape, funescape );
				return function( elem ) {
					var node = typeof elem.getAttributeNode !== strundefined && elem.getAttributeNode("id");
					return node && node.value === attrId;
				};
			};
		}

		// Tag
		Expr.find["TAG"] = support.getElementsByTagName ?
			function( tag, context ) {
				if ( typeof context.getElementsByTagName !== strundefined ) {
					return context.getElementsByTagName( tag );
				}
			} :
			function( tag, context ) {
				var elem,
					tmp = [],
					i = 0,
					results = context.getElementsByTagName( tag );

				// Filter out possible comments
				if ( tag === "*" ) {
					while ( (elem = results[i++]) ) {
						if ( elem.nodeType === 1 ) {
							tmp.push( elem );
						}
					}

					return tmp;
				}
				return results;
			};

		// Class
		Expr.find["CLASS"] = support.getElementsByClassName && function( className, context ) {
			if ( documentIsHTML ) {
				return context.getElementsByClassName( className );
			}
		};

		/* QSA/matchesSelector
		---------------------------------------------------------------------- */

		// QSA and matchesSelector support

		// matchesSelector(:active) reports false when true (IE9/Opera 11.5)
		rbuggyMatches = [];

		// qSa(:focus) reports false when true (Chrome 21)
		// We allow this because of a bug in IE8/9 that throws an error
		// whenever `document.activeElement` is accessed on an iframe
		// So, we allow :focus to pass through QSA all the time to avoid the IE error
		// See http://bugs.jquery.com/ticket/13378
		rbuggyQSA = [];

		if ( (support.qsa = rnative.test( doc.querySelectorAll )) ) {
			// Build QSA regex
			// Regex strategy adopted from Diego Perini
			assert(function( div ) {
				// Select is set to empty string on purpose
				// This is to test IE's treatment of not explicitly
				// setting a boolean content attribute,
				// since its presence should be enough
				// http://bugs.jquery.com/ticket/12359
				div.innerHTML = "<select msallowcapture=''><option selected=''></option></select>";

				// Support: IE8, Opera 11-12.16
				// Nothing should be selected when empty strings follow ^= or $= or *=
				// The test attribute must be unknown in Opera but "safe" for WinRT
				// http://msdn.microsoft.com/en-us/library/ie/hh465388.aspx#attribute_section
				if ( div.querySelectorAll("[msallowcapture^='']").length ) {
					rbuggyQSA.push( "[*^$]=" + whitespace + "*(?:''|\"\")" );
				}

				// Support: IE8
				// Boolean attributes and "value" are not treated correctly
				if ( !div.querySelectorAll("[selected]").length ) {
					rbuggyQSA.push( "\\[" + whitespace + "*(?:value|" + booleans + ")" );
				}

				// Webkit/Opera - :checked should return selected option elements
				// http://www.w3.org/TR/2011/REC-css3-selectors-20110929/#checked
				// IE8 throws error here and will not see later tests
				if ( !div.querySelectorAll(":checked").length ) {
					rbuggyQSA.push(":checked");
				}
			});

			assert(function( div ) {
				// Support: Windows 8 Native Apps
				// The type and name attributes are restricted during .innerHTML assignment
				var input = doc.createElement("input");
				input.setAttribute( "type", "hidden" );
				div.appendChild( input ).setAttribute( "name", "D" );

				// Support: IE8
				// Enforce case-sensitivity of name attribute
				if ( div.querySelectorAll("[name=d]").length ) {
					rbuggyQSA.push( "name" + whitespace + "*[*^$|!~]?=" );
				}

				// FF 3.5 - :enabled/:disabled and hidden elements (hidden elements are still enabled)
				// IE8 throws error here and will not see later tests
				if ( !div.querySelectorAll(":enabled").length ) {
					rbuggyQSA.push( ":enabled", ":disabled" );
				}

				// Opera 10-11 does not throw on post-comma invalid pseudos
				div.querySelectorAll("*,:x");
				rbuggyQSA.push(",.*:");
			});
		}

		if ( (support.matchesSelector = rnative.test( (matches = docElem.matches ||
			docElem.webkitMatchesSelector ||
			docElem.mozMatchesSelector ||
			docElem.oMatchesSelector ||
			docElem.msMatchesSelector) )) ) {

			assert(function( div ) {
				// Check to see if it's possible to do matchesSelector
				// on a disconnected node (IE 9)
				support.disconnectedMatch = matches.call( div, "div" );

				// This should fail with an exception
				// Gecko does not error, returns false instead
				matches.call( div, "[s!='']:x" );
				rbuggyMatches.push( "!=", pseudos );
			});
		}

		rbuggyQSA = rbuggyQSA.length && new RegExp( rbuggyQSA.join("|") );
		rbuggyMatches = rbuggyMatches.length && new RegExp( rbuggyMatches.join("|") );

		/* Contains
		---------------------------------------------------------------------- */
		hasCompare = rnative.test( docElem.compareDocumentPosition );

		// Element contains another
		// Purposefully does not implement inclusive descendent
		// As in, an element does not contain itself
		contains = hasCompare || rnative.test( docElem.contains ) ?
			function( a, b ) {
				var adown = a.nodeType === 9 ? a.documentElement : a,
					bup = b && b.parentNode;
				return a === bup || !!( bup && bup.nodeType === 1 && (
					adown.contains ?
						adown.contains( bup ) :
						a.compareDocumentPosition && a.compareDocumentPosition( bup ) & 16
				));
			} :
			function( a, b ) {
				if ( b ) {
					while ( (b = b.parentNode) ) {
						if ( b === a ) {
							return true;
						}
					}
				}
				return false;
			};

		/* Sorting
		---------------------------------------------------------------------- */

		// Document order sorting
		sortOrder = hasCompare ?
		function( a, b ) {

			// Flag for duplicate removal
			if ( a === b ) {
				hasDuplicate = true;
				return 0;
			}

			// Sort on method existence if only one input has compareDocumentPosition
			var compare = !a.compareDocumentPosition - !b.compareDocumentPosition;
			if ( compare ) {
				return compare;
			}

			// Calculate position if both inputs belong to the same document
			compare = ( a.ownerDocument || a ) === ( b.ownerDocument || b ) ?
				a.compareDocumentPosition( b ) :

				// Otherwise we know they are disconnected
				1;

			// Disconnected nodes
			if ( compare & 1 ||
				(!support.sortDetached && b.compareDocumentPosition( a ) === compare) ) {

				// Choose the first element that is related to our preferred document
				if ( a === doc || a.ownerDocument === preferredDoc && contains(preferredDoc, a) ) {
					return -1;
				}
				if ( b === doc || b.ownerDocument === preferredDoc && contains(preferredDoc, b) ) {
					return 1;
				}

				// Maintain original order
				return sortInput ?
					( indexOf.call( sortInput, a ) - indexOf.call( sortInput, b ) ) :
					0;
			}

			return compare & 4 ? -1 : 1;
		} :
		function( a, b ) {
			// Exit early if the nodes are identical
			if ( a === b ) {
				hasDuplicate = true;
				return 0;
			}

			var cur,
				i = 0,
				aup = a.parentNode,
				bup = b.parentNode,
				ap = [ a ],
				bp = [ b ];

			// Parentless nodes are either documents or disconnected
			if ( !aup || !bup ) {
				return a === doc ? -1 :
					b === doc ? 1 :
					aup ? -1 :
					bup ? 1 :
					sortInput ?
					( indexOf.call( sortInput, a ) - indexOf.call( sortInput, b ) ) :
					0;

			// If the nodes are siblings, we can do a quick check
			} else if ( aup === bup ) {
				return siblingCheck( a, b );
			}

			// Otherwise we need full lists of their ancestors for comparison
			cur = a;
			while ( (cur = cur.parentNode) ) {
				ap.unshift( cur );
			}
			cur = b;
			while ( (cur = cur.parentNode) ) {
				bp.unshift( cur );
			}

			// Walk down the tree looking for a discrepancy
			while ( ap[i] === bp[i] ) {
				i++;
			}

			return i ?
				// Do a sibling check if the nodes have a common ancestor
				siblingCheck( ap[i], bp[i] ) :

				// Otherwise nodes in our document sort first
				ap[i] === preferredDoc ? -1 :
				bp[i] === preferredDoc ? 1 :
				0;
		};

		return doc;
	};

	Sizzle.matches = function( expr, elements ) {
		return Sizzle( expr, null, null, elements );
	};

	Sizzle.matchesSelector = function( elem, expr ) {
		// Set document vars if needed
		if ( ( elem.ownerDocument || elem ) !== document ) {
			setDocument( elem );
		}

		// Make sure that attribute selectors are quoted
		expr = expr.replace( rattributeQuotes, "='$1']" );

		if ( support.matchesSelector && documentIsHTML &&
			( !rbuggyMatches || !rbuggyMatches.test( expr ) ) &&
			( !rbuggyQSA     || !rbuggyQSA.test( expr ) ) ) {

			try {
				var ret = matches.call( elem, expr );

				// IE 9's matchesSelector returns false on disconnected nodes
				if ( ret || support.disconnectedMatch ||
						// As well, disconnected nodes are said to be in a document
						// fragment in IE 9
						elem.document && elem.document.nodeType !== 11 ) {
					return ret;
				}
			} catch(e) {}
		}

		return Sizzle( expr, document, null, [ elem ] ).length > 0;
	};

	Sizzle.contains = function( context, elem ) {
		// Set document vars if needed
		if ( ( context.ownerDocument || context ) !== document ) {
			setDocument( context );
		}
		return contains( context, elem );
	};

	Sizzle.attr = function( elem, name ) {
		// Set document vars if needed
		if ( ( elem.ownerDocument || elem ) !== document ) {
			setDocument( elem );
		}

		var fn = Expr.attrHandle[ name.toLowerCase() ],
			// Don't get fooled by Object.prototype properties (jQuery #13807)
			val = fn && hasOwn.call( Expr.attrHandle, name.toLowerCase() ) ?
				fn( elem, name, !documentIsHTML ) :
				undefined;

		return val !== undefined ?
			val :
			support.attributes || !documentIsHTML ?
				elem.getAttribute( name ) :
				(val = elem.getAttributeNode(name)) && val.specified ?
					val.value :
					null;
	};

	Sizzle.error = function( msg ) {
		throw new Error( "Syntax error, unrecognized expression: " + msg );
	};

	/**
	 * Document sorting and removing duplicates
	 * @param {ArrayLike} results
	 */
	Sizzle.uniqueSort = function( results ) {
		var elem,
			duplicates = [],
			j = 0,
			i = 0;

		// Unless we *know* we can detect duplicates, assume their presence
		hasDuplicate = !support.detectDuplicates;
		sortInput = !support.sortStable && results.slice( 0 );
		results.sort( sortOrder );

		if ( hasDuplicate ) {
			while ( (elem = results[i++]) ) {
				if ( elem === results[ i ] ) {
					j = duplicates.push( i );
				}
			}
			while ( j-- ) {
				results.splice( duplicates[ j ], 1 );
			}
		}

		// Clear input after sorting to release objects
		// See https://github.com/jquery/sizzle/pull/225
		sortInput = null;

		return results;
	};

	/**
	 * Utility function for retrieving the text value of an array of DOM nodes
	 * @param {Array|Element} elem
	 */
	getText = Sizzle.getText = function( elem ) {
		var node,
			ret = "",
			i = 0,
			nodeType = elem.nodeType;

		if ( !nodeType ) {
			// If no nodeType, this is expected to be an array
			while ( (node = elem[i++]) ) {
				// Do not traverse comment nodes
				ret += getText( node );
			}
		} else if ( nodeType === 1 || nodeType === 9 || nodeType === 11 ) {
			// Use textContent for elements
			// innerText usage removed for consistency of new lines (jQuery #11153)
			if ( typeof elem.textContent === "string" ) {
				return elem.textContent;
			} else {
				// Traverse its children
				for ( elem = elem.firstChild; elem; elem = elem.nextSibling ) {
					ret += getText( elem );
				}
			}
		} else if ( nodeType === 3 || nodeType === 4 ) {
			return elem.nodeValue;
		}
		// Do not include comment or processing instruction nodes

		return ret;
	};

	Expr = Sizzle.selectors = {

		// Can be adjusted by the user
		cacheLength: 50,

		createPseudo: markFunction,

		match: matchExpr,

		attrHandle: {},

		find: {},

		relative: {
			">": { dir: "parentNode", first: true },
			" ": { dir: "parentNode" },
			"+": { dir: "previousSibling", first: true },
			"~": { dir: "previousSibling" }
		},

		preFilter: {
			"ATTR": function( match ) {
				match[1] = match[1].replace( runescape, funescape );

				// Move the given value to match[3] whether quoted or unquoted
				match[3] = ( match[3] || match[4] || match[5] || "" ).replace( runescape, funescape );

				if ( match[2] === "~=" ) {
					match[3] = " " + match[3] + " ";
				}

				return match.slice( 0, 4 );
			},

			"CHILD": function( match ) {
				/* matches from matchExpr["CHILD"]
					1 type (only|nth|...)
					2 what (child|of-type)
					3 argument (even|odd|\d*|\d*n([+-]\d+)?|...)
					4 xn-component of xn+y argument ([+-]?\d*n|)
					5 sign of xn-component
					6 x of xn-component
					7 sign of y-component
					8 y of y-component
				*/
				match[1] = match[1].toLowerCase();

				if ( match[1].slice( 0, 3 ) === "nth" ) {
					// nth-* requires argument
					if ( !match[3] ) {
						Sizzle.error( match[0] );
					}

					// numeric x and y parameters for Expr.filter.CHILD
					// remember that false/true cast respectively to 0/1
					match[4] = +( match[4] ? match[5] + (match[6] || 1) : 2 * ( match[3] === "even" || match[3] === "odd" ) );
					match[5] = +( ( match[7] + match[8] ) || match[3] === "odd" );

				// other types prohibit arguments
				} else if ( match[3] ) {
					Sizzle.error( match[0] );
				}

				return match;
			},

			"PSEUDO": function( match ) {
				var excess,
					unquoted = !match[6] && match[2];

				if ( matchExpr["CHILD"].test( match[0] ) ) {
					return null;
				}

				// Accept quoted arguments as-is
				if ( match[3] ) {
					match[2] = match[4] || match[5] || "";

				// Strip excess characters from unquoted arguments
				} else if ( unquoted && rpseudo.test( unquoted ) &&
					// Get excess from tokenize (recursively)
					(excess = tokenize( unquoted, true )) &&
					// advance to the next closing parenthesis
					(excess = unquoted.indexOf( ")", unquoted.length - excess ) - unquoted.length) ) {

					// excess is a negative index
					match[0] = match[0].slice( 0, excess );
					match[2] = unquoted.slice( 0, excess );
				}

				// Return only captures needed by the pseudo filter method (type and argument)
				return match.slice( 0, 3 );
			}
		},

		filter: {

			"TAG": function( nodeNameSelector ) {
				var nodeName = nodeNameSelector.replace( runescape, funescape ).toLowerCase();
				return nodeNameSelector === "*" ?
					function() { return true; } :
					function( elem ) {
						return elem.nodeName && elem.nodeName.toLowerCase() === nodeName;
					};
			},

			"CLASS": function( className ) {
				var pattern = classCache[ className + " " ];

				return pattern ||
					(pattern = new RegExp( "(^|" + whitespace + ")" + className + "(" + whitespace + "|$)" )) &&
					classCache( className, function( elem ) {
						return pattern.test( typeof elem.className === "string" && elem.className || typeof elem.getAttribute !== strundefined && elem.getAttribute("class") || "" );
					});
			},

			"ATTR": function( name, operator, check ) {
				return function( elem ) {
					var result = Sizzle.attr( elem, name );

					if ( result == null ) {
						return operator === "!=";
					}
					if ( !operator ) {
						return true;
					}

					result += "";

					return operator === "=" ? result === check :
						operator === "!=" ? result !== check :
						operator === "^=" ? check && result.indexOf( check ) === 0 :
						operator === "*=" ? check && result.indexOf( check ) > -1 :
						operator === "$=" ? check && result.slice( -check.length ) === check :
						operator === "~=" ? ( " " + result + " " ).indexOf( check ) > -1 :
						operator === "|=" ? result === check || result.slice( 0, check.length + 1 ) === check + "-" :
						false;
				};
			},

			"CHILD": function( type, what, argument, first, last ) {
				var simple = type.slice( 0, 3 ) !== "nth",
					forward = type.slice( -4 ) !== "last",
					ofType = what === "of-type";

				return first === 1 && last === 0 ?

					// Shortcut for :nth-*(n)
					function( elem ) {
						return !!elem.parentNode;
					} :

					function( elem, context, xml ) {
						var cache, outerCache, node, diff, nodeIndex, start,
							dir = simple !== forward ? "nextSibling" : "previousSibling",
							parent = elem.parentNode,
							name = ofType && elem.nodeName.toLowerCase(),
							useCache = !xml && !ofType;

						if ( parent ) {

							// :(first|last|only)-(child|of-type)
							if ( simple ) {
								while ( dir ) {
									node = elem;
									while ( (node = node[ dir ]) ) {
										if ( ofType ? node.nodeName.toLowerCase() === name : node.nodeType === 1 ) {
											return false;
										}
									}
									// Reverse direction for :only-* (if we haven't yet done so)
									start = dir = type === "only" && !start && "nextSibling";
								}
								return true;
							}

							start = [ forward ? parent.firstChild : parent.lastChild ];

							// non-xml :nth-child(...) stores cache data on `parent`
							if ( forward && useCache ) {
								// Seek `elem` from a previously-cached index
								outerCache = parent[ expando ] || (parent[ expando ] = {});
								cache = outerCache[ type ] || [];
								nodeIndex = cache[0] === dirruns && cache[1];
								diff = cache[0] === dirruns && cache[2];
								node = nodeIndex && parent.childNodes[ nodeIndex ];

								while ( (node = ++nodeIndex && node && node[ dir ] ||

									// Fallback to seeking `elem` from the start
									(diff = nodeIndex = 0) || start.pop()) ) {

									// When found, cache indexes on `parent` and break
									if ( node.nodeType === 1 && ++diff && node === elem ) {
										outerCache[ type ] = [ dirruns, nodeIndex, diff ];
										break;
									}
								}

							// Use previously-cached element index if available
							} else if ( useCache && (cache = (elem[ expando ] || (elem[ expando ] = {}))[ type ]) && cache[0] === dirruns ) {
								diff = cache[1];

							// xml :nth-child(...) or :nth-last-child(...) or :nth(-last)?-of-type(...)
							} else {
								// Use the same loop as above to seek `elem` from the start
								while ( (node = ++nodeIndex && node && node[ dir ] ||
									(diff = nodeIndex = 0) || start.pop()) ) {

									if ( ( ofType ? node.nodeName.toLowerCase() === name : node.nodeType === 1 ) && ++diff ) {
										// Cache the index of each encountered element
										if ( useCache ) {
											(node[ expando ] || (node[ expando ] = {}))[ type ] = [ dirruns, diff ];
										}

										if ( node === elem ) {
											break;
										}
									}
								}
							}

							// Incorporate the offset, then check against cycle size
							diff -= last;
							return diff === first || ( diff % first === 0 && diff / first >= 0 );
						}
					};
			},

			"PSEUDO": function( pseudo, argument ) {
				// pseudo-class names are case-insensitive
				// http://www.w3.org/TR/selectors/#pseudo-classes
				// Prioritize by case sensitivity in case custom pseudos are added with uppercase letters
				// Remember that setFilters inherits from pseudos
				var args,
					fn = Expr.pseudos[ pseudo ] || Expr.setFilters[ pseudo.toLowerCase() ] ||
						Sizzle.error( "unsupported pseudo: " + pseudo );

				// The user may use createPseudo to indicate that
				// arguments are needed to create the filter function
				// just as Sizzle does
				if ( fn[ expando ] ) {
					return fn( argument );
				}

				// But maintain support for old signatures
				if ( fn.length > 1 ) {
					args = [ pseudo, pseudo, "", argument ];
					return Expr.setFilters.hasOwnProperty( pseudo.toLowerCase() ) ?
						markFunction(function( seed, matches ) {
							var idx,
								matched = fn( seed, argument ),
								i = matched.length;
							while ( i-- ) {
								idx = indexOf.call( seed, matched[i] );
								seed[ idx ] = !( matches[ idx ] = matched[i] );
							}
						}) :
						function( elem ) {
							return fn( elem, 0, args );
						};
				}

				return fn;
			}
		},

		pseudos: {
			// Potentially complex pseudos
			"not": markFunction(function( selector ) {
				// Trim the selector passed to compile
				// to avoid treating leading and trailing
				// spaces as combinators
				var input = [],
					results = [],
					matcher = compile( selector.replace( rtrim, "$1" ) );

				return matcher[ expando ] ?
					markFunction(function( seed, matches, context, xml ) {
						var elem,
							unmatched = matcher( seed, null, xml, [] ),
							i = seed.length;

						// Match elements unmatched by `matcher`
						while ( i-- ) {
							if ( (elem = unmatched[i]) ) {
								seed[i] = !(matches[i] = elem);
							}
						}
					}) :
					function( elem, context, xml ) {
						input[0] = elem;
						matcher( input, null, xml, results );
						return !results.pop();
					};
			}),

			"has": markFunction(function( selector ) {
				return function( elem ) {
					return Sizzle( selector, elem ).length > 0;
				};
			}),

			"contains": markFunction(function( text ) {
				text = text.replace( runescape, funescape );
				return function( elem ) {
					return ( elem.textContent || elem.innerText || getText( elem ) ).indexOf( text ) > -1;
				};
			}),

			// "Whether an element is represented by a :lang() selector
			// is based solely on the element's language value
			// being equal to the identifier C,
			// or beginning with the identifier C immediately followed by "-".
			// The matching of C against the element's language value is performed case-insensitively.
			// The identifier C does not have to be a valid language name."
			// http://www.w3.org/TR/selectors/#lang-pseudo
			"lang": markFunction( function( lang ) {
				// lang value must be a valid identifier
				if ( !ridentifier.test(lang || "") ) {
					Sizzle.error( "unsupported lang: " + lang );
				}
				lang = lang.replace( runescape, funescape ).toLowerCase();
				return function( elem ) {
					var elemLang;
					do {
						if ( (elemLang = documentIsHTML ?
							elem.lang :
							elem.getAttribute("xml:lang") || elem.getAttribute("lang")) ) {

							elemLang = elemLang.toLowerCase();
							return elemLang === lang || elemLang.indexOf( lang + "-" ) === 0;
						}
					} while ( (elem = elem.parentNode) && elem.nodeType === 1 );
					return false;
				};
			}),

			// Miscellaneous
			"target": function( elem ) {
				var hash = window.location && window.location.hash;
				return hash && hash.slice( 1 ) === elem.id;
			},

			"root": function( elem ) {
				return elem === docElem;
			},

			"focus": function( elem ) {
				return elem === document.activeElement && (!document.hasFocus || document.hasFocus()) && !!(elem.type || elem.href || ~elem.tabIndex);
			},

			// Boolean properties
			"enabled": function( elem ) {
				return elem.disabled === false;
			},

			"disabled": function( elem ) {
				return elem.disabled === true;
			},

			"checked": function( elem ) {
				// In CSS3, :checked should return both checked and selected elements
				// http://www.w3.org/TR/2011/REC-css3-selectors-20110929/#checked
				var nodeName = elem.nodeName.toLowerCase();
				return (nodeName === "input" && !!elem.checked) || (nodeName === "option" && !!elem.selected);
			},

			"selected": function( elem ) {
				// Accessing this property makes selected-by-default
				// options in Safari work properly
				if ( elem.parentNode ) {
					elem.parentNode.selectedIndex;
				}

				return elem.selected === true;
			},

			// Contents
			"empty": function( elem ) {
				// http://www.w3.org/TR/selectors/#empty-pseudo
				// :empty is negated by element (1) or content nodes (text: 3; cdata: 4; entity ref: 5),
				//   but not by others (comment: 8; processing instruction: 7; etc.)
				// nodeType < 6 works because attributes (2) do not appear as children
				for ( elem = elem.firstChild; elem; elem = elem.nextSibling ) {
					if ( elem.nodeType < 6 ) {
						return false;
					}
				}
				return true;
			},

			"parent": function( elem ) {
				return !Expr.pseudos["empty"]( elem );
			},

			// Element/input types
			"header": function( elem ) {
				return rheader.test( elem.nodeName );
			},

			"input": function( elem ) {
				return rinputs.test( elem.nodeName );
			},

			"button": function( elem ) {
				var name = elem.nodeName.toLowerCase();
				return name === "input" && elem.type === "button" || name === "button";
			},

			"text": function( elem ) {
				var attr;
				return elem.nodeName.toLowerCase() === "input" &&
					elem.type === "text" &&

					// Support: IE<8
					// New HTML5 attribute values (e.g., "search") appear with elem.type === "text"
					( (attr = elem.getAttribute("type")) == null || attr.toLowerCase() === "text" );
			},

			// Position-in-collection
			"first": createPositionalPseudo(function() {
				return [ 0 ];
			}),

			"last": createPositionalPseudo(function( matchIndexes, length ) {
				return [ length - 1 ];
			}),

			"eq": createPositionalPseudo(function( matchIndexes, length, argument ) {
				return [ argument < 0 ? argument + length : argument ];
			}),

			"even": createPositionalPseudo(function( matchIndexes, length ) {
				var i = 0;
				for ( ; i < length; i += 2 ) {
					matchIndexes.push( i );
				}
				return matchIndexes;
			}),

			"odd": createPositionalPseudo(function( matchIndexes, length ) {
				var i = 1;
				for ( ; i < length; i += 2 ) {
					matchIndexes.push( i );
				}
				return matchIndexes;
			}),

			"lt": createPositionalPseudo(function( matchIndexes, length, argument ) {
				var i = argument < 0 ? argument + length : argument;
				for ( ; --i >= 0; ) {
					matchIndexes.push( i );
				}
				return matchIndexes;
			}),

			"gt": createPositionalPseudo(function( matchIndexes, length, argument ) {
				var i = argument < 0 ? argument + length : argument;
				for ( ; ++i < length; ) {
					matchIndexes.push( i );
				}
				return matchIndexes;
			})
		}
	};

	Expr.pseudos["nth"] = Expr.pseudos["eq"];

	// Add button/input type pseudos
	for ( i in { radio: true, checkbox: true, file: true, password: true, image: true } ) {
		Expr.pseudos[ i ] = createInputPseudo( i );
	}
	for ( i in { submit: true, reset: true } ) {
		Expr.pseudos[ i ] = createButtonPseudo( i );
	}

	// Easy API for creating new setFilters
	function setFilters() {}
	setFilters.prototype = Expr.filters = Expr.pseudos;
	Expr.setFilters = new setFilters();

	tokenize = Sizzle.tokenize = function( selector, parseOnly ) {
		var matched, match, tokens, type,
			soFar, groups, preFilters,
			cached = tokenCache[ selector + " " ];

		if ( cached ) {
			return parseOnly ? 0 : cached.slice( 0 );
		}

		soFar = selector;
		groups = [];
		preFilters = Expr.preFilter;

		while ( soFar ) {

			// Comma and first run
			if ( !matched || (match = rcomma.exec( soFar )) ) {
				if ( match ) {
					// Don't consume trailing commas as valid
					soFar = soFar.slice( match[0].length ) || soFar;
				}
				groups.push( (tokens = []) );
			}

			matched = false;

			// Combinators
			if ( (match = rcombinators.exec( soFar )) ) {
				matched = match.shift();
				tokens.push({
					value: matched,
					// Cast descendant combinators to space
					type: match[0].replace( rtrim, " " )
				});
				soFar = soFar.slice( matched.length );
			}

			// Filters
			for ( type in Expr.filter ) {
				if ( (match = matchExpr[ type ].exec( soFar )) && (!preFilters[ type ] ||
					(match = preFilters[ type ]( match ))) ) {
					matched = match.shift();
					tokens.push({
						value: matched,
						type: type,
						matches: match
					});
					soFar = soFar.slice( matched.length );
				}
			}

			if ( !matched ) {
				break;
			}
		}

		// Return the length of the invalid excess
		// if we're just parsing
		// Otherwise, throw an error or return tokens
		return parseOnly ?
			soFar.length :
			soFar ?
				Sizzle.error( selector ) :
				// Cache the tokens
				tokenCache( selector, groups ).slice( 0 );
	};

	function toSelector( tokens ) {
		var i = 0,
			len = tokens.length,
			selector = "";
		for ( ; i < len; i++ ) {
			selector += tokens[i].value;
		}
		return selector;
	}

	function addCombinator( matcher, combinator, base ) {
		var dir = combinator.dir,
			checkNonElements = base && dir === "parentNode",
			doneName = done++;

		return combinator.first ?
			// Check against closest ancestor/preceding element
			function( elem, context, xml ) {
				while ( (elem = elem[ dir ]) ) {
					if ( elem.nodeType === 1 || checkNonElements ) {
						return matcher( elem, context, xml );
					}
				}
			} :

			// Check against all ancestor/preceding elements
			function( elem, context, xml ) {
				var oldCache, outerCache,
					newCache = [ dirruns, doneName ];

				// We can't set arbitrary data on XML nodes, so they don't benefit from dir caching
				if ( xml ) {
					while ( (elem = elem[ dir ]) ) {
						if ( elem.nodeType === 1 || checkNonElements ) {
							if ( matcher( elem, context, xml ) ) {
								return true;
							}
						}
					}
				} else {
					while ( (elem = elem[ dir ]) ) {
						if ( elem.nodeType === 1 || checkNonElements ) {
							outerCache = elem[ expando ] || (elem[ expando ] = {});
							if ( (oldCache = outerCache[ dir ]) &&
								oldCache[ 0 ] === dirruns && oldCache[ 1 ] === doneName ) {

								// Assign to newCache so results back-propagate to previous elements
								return (newCache[ 2 ] = oldCache[ 2 ]);
							} else {
								// Reuse newcache so results back-propagate to previous elements
								outerCache[ dir ] = newCache;

								// A match means we're done; a fail means we have to keep checking
								if ( (newCache[ 2 ] = matcher( elem, context, xml )) ) {
									return true;
								}
							}
						}
					}
				}
			};
	}

	function elementMatcher( matchers ) {
		return matchers.length > 1 ?
			function( elem, context, xml ) {
				var i = matchers.length;
				while ( i-- ) {
					if ( !matchers[i]( elem, context, xml ) ) {
						return false;
					}
				}
				return true;
			} :
			matchers[0];
	}

	function multipleContexts( selector, contexts, results ) {
		var i = 0,
			len = contexts.length;
		for ( ; i < len; i++ ) {
			Sizzle( selector, contexts[i], results );
		}
		return results;
	}

	function condense( unmatched, map, filter, context, xml ) {
		var elem,
			newUnmatched = [],
			i = 0,
			len = unmatched.length,
			mapped = map != null;

		for ( ; i < len; i++ ) {
			if ( (elem = unmatched[i]) ) {
				if ( !filter || filter( elem, context, xml ) ) {
					newUnmatched.push( elem );
					if ( mapped ) {
						map.push( i );
					}
				}
			}
		}

		return newUnmatched;
	}

	function setMatcher( preFilter, selector, matcher, postFilter, postFinder, postSelector ) {
		if ( postFilter && !postFilter[ expando ] ) {
			postFilter = setMatcher( postFilter );
		}
		if ( postFinder && !postFinder[ expando ] ) {
			postFinder = setMatcher( postFinder, postSelector );
		}
		return markFunction(function( seed, results, context, xml ) {
			var temp, i, elem,
				preMap = [],
				postMap = [],
				preexisting = results.length,

				// Get initial elements from seed or context
				elems = seed || multipleContexts( selector || "*", context.nodeType ? [ context ] : context, [] ),

				// Prefilter to get matcher input, preserving a map for seed-results synchronization
				matcherIn = preFilter && ( seed || !selector ) ?
					condense( elems, preMap, preFilter, context, xml ) :
					elems,

				matcherOut = matcher ?
					// If we have a postFinder, or filtered seed, or non-seed postFilter or preexisting results,
					postFinder || ( seed ? preFilter : preexisting || postFilter ) ?

						// ...intermediate processing is necessary
						[] :

						// ...otherwise use results directly
						results :
					matcherIn;

			// Find primary matches
			if ( matcher ) {
				matcher( matcherIn, matcherOut, context, xml );
			}

			// Apply postFilter
			if ( postFilter ) {
				temp = condense( matcherOut, postMap );
				postFilter( temp, [], context, xml );

				// Un-match failing elements by moving them back to matcherIn
				i = temp.length;
				while ( i-- ) {
					if ( (elem = temp[i]) ) {
						matcherOut[ postMap[i] ] = !(matcherIn[ postMap[i] ] = elem);
					}
				}
			}

			if ( seed ) {
				if ( postFinder || preFilter ) {
					if ( postFinder ) {
						// Get the final matcherOut by condensing this intermediate into postFinder contexts
						temp = [];
						i = matcherOut.length;
						while ( i-- ) {
							if ( (elem = matcherOut[i]) ) {
								// Restore matcherIn since elem is not yet a final match
								temp.push( (matcherIn[i] = elem) );
							}
						}
						postFinder( null, (matcherOut = []), temp, xml );
					}

					// Move matched elements from seed to results to keep them synchronized
					i = matcherOut.length;
					while ( i-- ) {
						if ( (elem = matcherOut[i]) &&
							(temp = postFinder ? indexOf.call( seed, elem ) : preMap[i]) > -1 ) {

							seed[temp] = !(results[temp] = elem);
						}
					}
				}

			// Add elements to results, through postFinder if defined
			} else {
				matcherOut = condense(
					matcherOut === results ?
						matcherOut.splice( preexisting, matcherOut.length ) :
						matcherOut
				);
				if ( postFinder ) {
					postFinder( null, results, matcherOut, xml );
				} else {
					push.apply( results, matcherOut );
				}
			}
		});
	}

	function matcherFromTokens( tokens ) {
		var checkContext, matcher, j,
			len = tokens.length,
			leadingRelative = Expr.relative[ tokens[0].type ],
			implicitRelative = leadingRelative || Expr.relative[" "],
			i = leadingRelative ? 1 : 0,

			// The foundational matcher ensures that elements are reachable from top-level context(s)
			matchContext = addCombinator( function( elem ) {
				return elem === checkContext;
			}, implicitRelative, true ),
			matchAnyContext = addCombinator( function( elem ) {
				return indexOf.call( checkContext, elem ) > -1;
			}, implicitRelative, true ),
			matchers = [ function( elem, context, xml ) {
				return ( !leadingRelative && ( xml || context !== outermostContext ) ) || (
					(checkContext = context).nodeType ?
						matchContext( elem, context, xml ) :
						matchAnyContext( elem, context, xml ) );
			} ];

		for ( ; i < len; i++ ) {
			if ( (matcher = Expr.relative[ tokens[i].type ]) ) {
				matchers = [ addCombinator(elementMatcher( matchers ), matcher) ];
			} else {
				matcher = Expr.filter[ tokens[i].type ].apply( null, tokens[i].matches );

				// Return special upon seeing a positional matcher
				if ( matcher[ expando ] ) {
					// Find the next relative operator (if any) for proper handling
					j = ++i;
					for ( ; j < len; j++ ) {
						if ( Expr.relative[ tokens[j].type ] ) {
							break;
						}
					}
					return setMatcher(
						i > 1 && elementMatcher( matchers ),
						i > 1 && toSelector(
							// If the preceding token was a descendant combinator, insert an implicit any-element `*`
							tokens.slice( 0, i - 1 ).concat({ value: tokens[ i - 2 ].type === " " ? "*" : "" })
						).replace( rtrim, "$1" ),
						matcher,
						i < j && matcherFromTokens( tokens.slice( i, j ) ),
						j < len && matcherFromTokens( (tokens = tokens.slice( j )) ),
						j < len && toSelector( tokens )
					);
				}
				matchers.push( matcher );
			}
		}

		return elementMatcher( matchers );
	}

	function matcherFromGroupMatchers( elementMatchers, setMatchers ) {
		var bySet = setMatchers.length > 0,
			byElement = elementMatchers.length > 0,
			superMatcher = function( seed, context, xml, results, outermost ) {
				var elem, j, matcher,
					matchedCount = 0,
					i = "0",
					unmatched = seed && [],
					setMatched = [],
					contextBackup = outermostContext,
					// We must always have either seed elements or outermost context
					elems = seed || byElement && Expr.find["TAG"]( "*", outermost ),
					// Use integer dirruns iff this is the outermost matcher
					dirrunsUnique = (dirruns += contextBackup == null ? 1 : Math.random() || 0.1),
					len = elems.length;

				if ( outermost ) {
					outermostContext = context !== document && context;
				}

				// Add elements passing elementMatchers directly to results
				// Keep `i` a string if there are no elements so `matchedCount` will be "00" below
				// Support: IE<9, Safari
				// Tolerate NodeList properties (IE: "length"; Safari: <number>) matching elements by id
				for ( ; i !== len && (elem = elems[i]) != null; i++ ) {
					if ( byElement && elem ) {
						j = 0;
						while ( (matcher = elementMatchers[j++]) ) {
							if ( matcher( elem, context, xml ) ) {
								results.push( elem );
								break;
							}
						}
						if ( outermost ) {
							dirruns = dirrunsUnique;
						}
					}

					// Track unmatched elements for set filters
					if ( bySet ) {
						// They will have gone through all possible matchers
						if ( (elem = !matcher && elem) ) {
							matchedCount--;
						}

						// Lengthen the array for every element, matched or not
						if ( seed ) {
							unmatched.push( elem );
						}
					}
				}

				// Apply set filters to unmatched elements
				matchedCount += i;
				if ( bySet && i !== matchedCount ) {
					j = 0;
					while ( (matcher = setMatchers[j++]) ) {
						matcher( unmatched, setMatched, context, xml );
					}

					if ( seed ) {
						// Reintegrate element matches to eliminate the need for sorting
						if ( matchedCount > 0 ) {
							while ( i-- ) {
								if ( !(unmatched[i] || setMatched[i]) ) {
									setMatched[i] = pop.call( results );
								}
							}
						}

						// Discard index placeholder values to get only actual matches
						setMatched = condense( setMatched );
					}

					// Add matches to results
					push.apply( results, setMatched );

					// Seedless set matches succeeding multiple successful matchers stipulate sorting
					if ( outermost && !seed && setMatched.length > 0 &&
						( matchedCount + setMatchers.length ) > 1 ) {

						Sizzle.uniqueSort( results );
					}
				}

				// Override manipulation of globals by nested matchers
				if ( outermost ) {
					dirruns = dirrunsUnique;
					outermostContext = contextBackup;
				}

				return unmatched;
			};

		return bySet ?
			markFunction( superMatcher ) :
			superMatcher;
	}

	compile = Sizzle.compile = function( selector, match /* Internal Use Only */ ) {
		var i,
			setMatchers = [],
			elementMatchers = [],
			cached = compilerCache[ selector + " " ];

		if ( !cached ) {
			// Generate a function of recursive functions that can be used to check each element
			if ( !match ) {
				match = tokenize( selector );
			}
			i = match.length;
			while ( i-- ) {
				cached = matcherFromTokens( match[i] );
				if ( cached[ expando ] ) {
					setMatchers.push( cached );
				} else {
					elementMatchers.push( cached );
				}
			}

			// Cache the compiled function
			cached = compilerCache( selector, matcherFromGroupMatchers( elementMatchers, setMatchers ) );

			// Save selector and tokenization
			cached.selector = selector;
		}
		return cached;
	};

	/**
	 * A low-level selection function that works with Sizzle's compiled
	 *  selector functions
	 * @param {String|Function} selector A selector or a pre-compiled
	 *  selector function built with Sizzle.compile
	 * @param {Element} context
	 * @param {Array} [results]
	 * @param {Array} [seed] A set of elements to match against
	 */
	select = Sizzle.select = function( selector, context, results, seed ) {
		var i, tokens, token, type, find,
			compiled = typeof selector === "function" && selector,
			match = !seed && tokenize( (selector = compiled.selector || selector) );

		results = results || [];

		// Try to minimize operations if there is no seed and only one group
		if ( match.length === 1 ) {

			// Take a shortcut and set the context if the root selector is an ID
			tokens = match[0] = match[0].slice( 0 );
			if ( tokens.length > 2 && (token = tokens[0]).type === "ID" &&
					support.getById && context.nodeType === 9 && documentIsHTML &&
					Expr.relative[ tokens[1].type ] ) {

				context = ( Expr.find["ID"]( token.matches[0].replace(runescape, funescape), context ) || [] )[0];
				if ( !context ) {
					return results;

				// Precompiled matchers will still verify ancestry, so step up a level
				} else if ( compiled ) {
					context = context.parentNode;
				}

				selector = selector.slice( tokens.shift().value.length );
			}

			// Fetch a seed set for right-to-left matching
			i = matchExpr["needsContext"].test( selector ) ? 0 : tokens.length;
			while ( i-- ) {
				token = tokens[i];

				// Abort if we hit a combinator
				if ( Expr.relative[ (type = token.type) ] ) {
					break;
				}
				if ( (find = Expr.find[ type ]) ) {
					// Search, expanding context for leading sibling combinators
					if ( (seed = find(
						token.matches[0].replace( runescape, funescape ),
						rsibling.test( tokens[0].type ) && testContext( context.parentNode ) || context
					)) ) {

						// If seed is empty or no tokens remain, we can return early
						tokens.splice( i, 1 );
						selector = seed.length && toSelector( tokens );
						if ( !selector ) {
							push.apply( results, seed );
							return results;
						}

						break;
					}
				}
			}
		}

		// Compile and execute a filtering function if one is not provided
		// Provide `match` to avoid retokenization if we modified the selector above
		( compiled || compile( selector, match ) )(
			seed,
			context,
			!documentIsHTML,
			results,
			rsibling.test( selector ) && testContext( context.parentNode ) || context
		);
		return results;
	};

	// One-time assignments

	// Sort stability
	support.sortStable = expando.split("").sort( sortOrder ).join("") === expando;

	// Support: Chrome 14-35+
	// Always assume duplicates if they aren't passed to the comparison function
	support.detectDuplicates = !!hasDuplicate;

	// Initialize against the default document
	setDocument();

	// Support: Webkit<537.32 - Safari 6.0.3/Chrome 25 (fixed in Chrome 27)
	// Detached nodes confoundingly follow *each other*
	support.sortDetached = assert(function( div1 ) {
		// Should return 1, but returns 4 (following)
		return div1.compareDocumentPosition( document.createElement("div") ) & 1;
	});

	// Support: IE<8
	// Prevent attribute/property "interpolation"
	// http://msdn.microsoft.com/en-us/library/ms536429%28VS.85%29.aspx
	if ( !assert(function( div ) {
		div.innerHTML = "<a href='#'></a>";
		return div.firstChild.getAttribute("href") === "#" ;
	}) ) {
		addHandle( "type|href|height|width", function( elem, name, isXML ) {
			if ( !isXML ) {
				return elem.getAttribute( name, name.toLowerCase() === "type" ? 1 : 2 );
			}
		});
	}

	// Support: IE<9
	// Use defaultValue in place of getAttribute("value")
	if ( !support.attributes || !assert(function( div ) {
		div.innerHTML = "<input/>";
		div.firstChild.setAttribute( "value", "" );
		return div.firstChild.getAttribute( "value" ) === "";
	}) ) {
		addHandle( "value", function( elem, name, isXML ) {
			if ( !isXML && elem.nodeName.toLowerCase() === "input" ) {
				return elem.defaultValue;
			}
		});
	}

	// Support: IE<9
	// Use getAttributeNode to fetch booleans when getAttribute lies
	if ( !assert(function( div ) {
		return div.getAttribute("disabled") == null;
	}) ) {
		addHandle( booleans, function( elem, name, isXML ) {
			var val;
			if ( !isXML ) {
				return elem[ name ] === true ? name.toLowerCase() :
						(val = elem.getAttributeNode( name )) && val.specified ?
						val.value :
					null;
			}
		});
	}

	return Sizzle;
});
define("query.query", [], function(require, exports, module){
	var _sizzle = require("query.base.sizzle"),
		_query = {};

	_query = {
		query: _sizzle
	}

	module.exports = _query;
});
define("system.system", [], function(require, exports, module){
	var _obj = require("common.object.base"),
		_browser = require("system.browser"),
		_system = {};

	_system = _obj.merge(_system, _browser);
	module.exports = _system;
});
/**
 * Created with JetBrains WebStorm.
 * User: liudan
 * Date: 14-7-26
 * Time: 下午1:09
 * To change this template use File | Settings | File Templates.
 */
define(function(require, exports, module){
    var _object = require("common.object"),
    	_array = require("common.array"),
    	_string = require("common.string"),
    	_query = require("query.query");
    	_system = require("system.system");

    diy = _object.object.merge(diy, _object);
    diy = _object.object.merge(diy, _array);
    diy = _object.object.merge(diy, _string);
    diy = _object.object.merge(diy, _query);
    diy = _object.object.merge(diy, _system);
    module.exports = diy;
});