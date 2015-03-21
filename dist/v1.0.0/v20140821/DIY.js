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

    var moduleCache = {};
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
            return moduleCache[id] = {id: id, deps: deps, factory: func, oldDeps: oldDeps, exports: null, state: 0};
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
        var node = document.createElement("script");
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

        headNode.appendChild(node);
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
    function isArray(arr){
        if(Array.isArray){
            return Array.isArray(arr);
        }

        return Object.prototype.toString.call(arr) === "[object Array]";
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

	        if(typeof arg == "function"){
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
                if(superClass.apply)
                    superClass.apply(this);
            };
            Fn.prototype = superClass.prototype;
            subClass.prototype = new Fn();
            subClass.prototype.constructor = subClass;
            subClass.superClass = superClass.prototype;

            return subClass;
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
        _object = {
        	object: _base.merge(_base, _isType)
        };

    module.exports = _object;
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
	module.exports = {
		forEach: function(fn){
			var len = this.length;
			for(var i = 0; i < len; i++){
				fn(this[i], i);
			}
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

	var createDiyArray = function(arr){
		var arr = _object.object.getArray(arr);

		_arr = _object.object.merge(_arr, _forEach);
		_arr = _object.object.merge(_arr, _base);
		return _object.object.merge(arr, _arr);
	}

	module.exports = {
		createDiyArray: createDiyArray
	};
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
    	_array = require("common.array");

    diy = _object.object.merge(diy, _object);
    diy = _object.object.merge(diy, _array);
    module.exports = diy;
});