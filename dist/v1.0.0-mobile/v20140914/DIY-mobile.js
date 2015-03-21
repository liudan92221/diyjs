(function (window) {
    var config = {
        charset: "UTF-8",
        path: ""
    },
        baseScript,
        url,
        headNode,
        LD;
    baseScript = window.document.getElementById("diy");
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
define("object", [], function(requrie, exports, module){
	module.exports = {
        merge: function(destination, source) {
            var _des = destination || {};
            
            if (this.isArray(destination) && this.isArray(source)) {
                _des = _des.concat(source);
            } else if (typeof _des == "object" || typeof _des == 'function') {
                for (var key in source) {
                    var val = source[key];
                    (typeof val == "object" && typeof _des[key] == "object") ? _des[key] = arguments.callee(_des[key], val) : _des[key] = val;
                }
            }
            return _des;
        },
 
        isArray: Array.isArray || function(){
            return Object.prototype.toString.call(obj) === "[object Array]";
        },
 
        isWindow: function(win){
            return win.window ? win.window === win : false;
        },
 
        trim: function(str) {
            return str.replace(/(^\s+)|(\s+$)/g, "");
        }
    };
});
define("array", [], function(require, exports, module){

	var forEach = Array.prototype.forEach || function(callback){
        for(var i = 0,len = this.length;i < len;i++){
            callback && callback(this[i], i);
        }
    };

	module.exports = {
		__proto__: Array.prototype,

        getArray: function(arr){
            return Array.prototype.slice.call(arr);
        },
 
        each: function(callback){
            for(var i = 0, len = this.length; i < len; i++){
                callback && callback(i, this[i]);
            }
        },
 
        forEach: function(callback){
            forEach.call(this, callback);
        }
    };
});
define("event", [], function(require, exports, module){
	var _obj = require("object"),
		_array = require("array");

	var handlers = {},
        timeStamp = new Date(),
        isArray = _obj.isArray,
        specialEvents = {
            click: "MouseEvents",
            mousedown: "MouseEvents",
            mouseup: "MouseEvents",
            mousemove: "MouseEvents"
        };
 
        //生成唯一的uuid
        function uuid(element){
            if(!element.__uuid__){
                element.__uuid__ = timeStamp++;
            }
            return element.__uuid__;
        }
 
        //在handlers上创建唯一id的事件存放空间
        function getHandler(_uuid){
            if(!handlers[_uuid]){
                handlers[_uuid] = {};
            }
            return handlers[_uuid];
        }
 
        //添加事件
        function add(element, event, fn){
            var _uuid = uuid(element),
                handler = getHandler(_uuid),
                i;
 
            if(!isArray(handler[event])){
                handler[event] = [];
                handler[event].__proto__ = _array;
            }
            i = handler[event].length;
            fn.i = i;
 
            function proxy(e){
                var result = fn.call(element, e);
                if(result === false){
                    e.preventDefault();
                    e.stopPropagation();
                }
            }
 
            handler[event].push({
                fn: fn,
                proxy: proxy
            });
            element.addEventListener(event, handler[event][i].proxy, false);
        }
 
        //删除事件
        function remove(element, event, fn){
            var _uuid = uuid(element),
                handler = getHandler(_uuid);
 
            if(fn){
                if(typeof fn.i === "number" && isArray(handler[event]) && handler[event][fn.i]){
                    element.removeEventListener(event, handler[event][fn.i].proxy, false);
                    delete handler[event][fn.i];
                }
            }else{
                if(isArray(handler[event])){
                    handler[event].forEach(function(item, index){
                        if(item){
                            element.removeEventListener(event, handler[event][index].proxy, false);
                            delete handler[event][index];
                        }
                    });
                }
            }
        }
 
        //获取事件对象
        function getEvent(type, props){
            var event = document.createEvent(specialEvents[type] || 'Events'), 
                bubbles = true;
 
            if (props){
                for (var name in props){
                    name === 'bubbles' ? (bubbles = !!props[name]) : (event[name] = props[name]);
                } 
            } 
            event.initEvent(type, bubbles, true);
            return event;
        }
 
        //触发事件
        function fire(element, event, e){
            var _uuid = uuid(element),
                handler = getHandler(_uuid);

            element.dispatchEvent(getEvent(event, e));
        }
 

        function on(event, fn){
            this.forEach(function(item){
                add(item, event, fn);
            });
 
            return this;
        }
 
        function un(event, fn){
            this.forEach(function(item){
                remove(item, event, fn);
            });
 
            return this;
        }
 
        function trigger(event, e){
            this.forEach(function(item){
                fire(item, event, e);
            });
 
            return this;
        }
 
        //对外暴露方法
        return {
            on: on,
            un: un,
            trigger: trigger
        }
});
define("dom", [], function(require, exports, module){
    var _obj = require("object"),
        _array = require("array"),
        _event = require("event"),
        _dom = {
	        __type__: "App.dom",
	 
	        hasClass: function(cls) {
	            var classname = this[0].className,
	                rCls = new RegExp("(^|\\s+)" + cls + "(\\s+|$)", "g");
	            return rCls.test(classname);
	        },
	        addClass: function(cls) {
	            var reg = new RegExp("(^|\\s+)" + cls + "(\\s+|$)", "g");
	 
	            this.forEach(function(item, i){
	                var classname = item.className;
	 
	                if(!reg.test(classname)){
	                    item.className = classname + " "+cls;
	                }
	            });
	 
	            return this;
	        },
	        removeClass: function(cls) {
	            var reg = new RegExp("(\\s+)" + cls + "(\\s+)", "g");
	 
	            this.forEach(function(item, i){
	                var classname = " " + item.className + " ";
	 
	                item.className = _obj.trim(classname.replace(reg, " "));
	            });
	 
	            return this;
	        },
	 
	        find: function(sub){
	            var result = [];
	 
	            this.forEach(function(item, i){
	                result = result.concat(_array.getArray(item.querySelectorAll(sub)));
	            });
	 
	            result.__proto__ = module.exports;
	            return result;
	        },
	 
	        css: function(){
	            var attr = arguments[0],
	                len = arguments.length,
	                value;
	 
	            if(len === 2){
	                value = arguments[1];
	 
	                this.forEach(function(item, i){
	                    item.style[attr] = value;
	                });  
	 
	                return this;
	            }
	 
	            if(len < 2){
	                if(typeof attr === "string"){
	                    return this[0].style[attr];
	                }
	 
	                if(typeof attr === "object"){
	                    for(var key in attr){
	                        this.forEach(function(item, i){
	                            item.style[key] = attr[key];
	                        });
	                    }
	 
	                    return this;
	                }
	            }
	        },
	 
	        attr: function(){
	            var attr = arguments[0],
	                len = arguments.length,
	                value;
	 
	            if(len === 2){
	                value = arguments[1];
	 
	                this.forEach(function(item, i){
	                    item.setAttribute(attr, value);
	                });  
	 
	                return this;
	            }
	 
	            if(len < 2){
	                if(typeof attr === "string"){
	                    return this[0].getAttribute(attr);
	                }
	 
	                if(typeof attr === "object"){
	                    for(var key in attr){
	                        this.forEach(function(item, i){
	                            item.setAttribute(key, ttr[key]);
	                        });
	                    }
	 
	                    return this;
	                }
	            }
	        },
	 
	        eq: function(index){
	            var len = this.length - 1,
	                result;
	 
	            index = index > len ? len : index;
	            index = index < 0 ? 0 : index;
	 
	            result = [this[index]];
	            result.__proto__ = module.exports;
	            return result;
	        },
	 
	        parent: function(){
	            var result = [];
	 
	            this.forEach(function(item){
	                result.push(item.parentNode);
	            });
	 
	            result.__proto__ = module.exports;
	            return result;
	        },
	 
	        html: function(){
	            var arg = arguments;
	            if(arg.length > 0 && typeof arg[0] === "string"){
	                this.forEach(function(item){
	                    item.innerHTML = arg[0];
	                });
	            }else{
	                return this[0].innerHTML;
	            }
	    	}
	    };

    _dom = _obj.merge(_dom, _array);
    _dom = _obj.merge(_dom, _event);

    module.exports = _dom; 
});
define("query", [], function(require, exports, module){
	var _obj = require("object"),
		_array = require("array"),
		_dom = require("dom");

	module.exports = {
        /**
         * 获取元素方法，支持querySelectorAll所有获取方式
         * @method query
         * @param {String, dom} 第一个参数为获取元素的字符串方式，第二个为可选参数，为原生dom对象，缩小元素获取范围 
         * @return {App.dom}
         * @example
         *      $("#test");
         *      $("#test", $(document)[0]);
         *      $("#test", document);
         *      // ==> App.dom
         */
        query: function(element, parent){
            var par = parent || document,
                _result;
 
            //获取数组，返回扩展数组对象
            if(_obj.isArray(element)){
                element.__proto__ = _array;
                return element;
            }
 
            if((typeof element === "object" && element.nodeType) || _obj.isWindow(element)){
                _result = [element];
                _result.__proto__ = _dom;
                return _result;
            }
 
            if(typeof element === "object" && element.__type__ === "App.dom"){
                return element;
            }
            _result = _array.getArray(par.querySelectorAll(element));
            _result.__proto__ = _dom;
            return _result;
        }
    };
});
define(function(require, exports, module){
	var _obj = require("object"),
		_query = require("query"),
		diy = _query.query;

	(function(){
        var touch = {},
            touchTimeout,
            longTapTimeout,
            swipeTimeout,
            tapTimeout,
            moveTimeout,
            longTapDelay = 750,
            gesture;
 
        //判断是哪种触摸事件
        function isPointerEventType(e, type){
            return (e.type == 'pointer'+type || e.type.toLowerCase() == 'mspointer'+type);
        }
 
        //判断是否是触摸事件
        function isPrimaryTouch(event){
            return (event.pointerType == 'touch' || event.pointerType == event.MSPOINTER_TYPE_TOUCH)
                && event.isPrimary;
        }
 
        //触发长按键事件
        function longTap() {
            longTapTimeout = null;
            if (touch.last) {
                touch.el.trigger('longTap');
                touch = {};
            }
        }
 
        //清除长按键
        function cancelLongTap() {
            if (longTapTimeout){
                clearTimeout(longTapTimeout);
            } 
            longTapTimeout = null;
        }
 
        //增加swip(Left/Right/Up/Dowm)事件
        function swipeDirection(x1, x2, y1, y2) {
            return Math.abs(x1 - x2) >= Math.abs(y1 - y2) ? 
                    (x1 - x2 > 0 ? 'Left' : 'Right') : 
                    (y1 - y2 > 0 ? 'Up' : 'Down');
        }
 
        //清除所有触摸事件
        function cancelAll() {
            touchTimeout ? clearTimeout(touchTimeout) : "";
            tapTimeout ? clearTimeout(tapTimeout) : "";
            swipeTimeout ? clearTimeout(swipeTimeout) : "";
            longTapTimeout ? clearTimeout(longTapTimeout) : "";
            touchTimeout = tapTimeout = swipeTimeout = longTapTimeout = null;
            touch = {};
        }
 
        diy(document).on("DOMContentLoaded", function(){
            var firstTouch,
                _isPointer,
                now,
                delta,
                deltaX = 0,
                deltaY = 0; 
 
            if ('MSGesture' in window) {
                gesture = new MSGesture()
                gesture.target = document.body
            }
 
            diy(document).on("touchstart", function(e){
                if((_isPointer = isPointerEventType(e, 'down')) && !isPrimaryTouch(e)){
                    return;
                }
 
                firstTouch = _isPointer ? e : e.touches[0];
 
                now = Date.now();       //记录当前时间
                delta = now - (touch.last || now); //记录时间差
                touch.el = diy('tagName' in firstTouch.target ? firstTouch.target : firstTouch.target.parentNode);
                touchTimeout && clearTimeout(touchTimeout);
                touch.x1 = firstTouch.pageX;
                touch.y1 = firstTouch.pageY;
 
                if (delta > 0 && delta <= 250){
                    touch.isDoubleTap = true;
                } 
                touch.last = now;
 
                //触发长按键事件
                longTapTimeout = setTimeout(function() {
                    longTapTimeout = null;
                    if (touch.last) {
                        touch.el.trigger('longTap', e);
                        touch = {};
                    }
                }, longTapDelay);
 
                //增加IE触摸
                if (gesture && _isPointer){
                    gesture.addPointer(e.pointerId);
                } 
            })
            .on("touchmove", function(e){
                if((_isPointer = isPointerEventType(e, 'move')) && !isPrimaryTouch(e)){
                    return;
                }
				cancelLongTap(); //清楚长按键

                firstTouch = _isPointer ? e : e.touches[0];

                touch.x2 = firstTouch.pageX;
                touch.y2 = firstTouch.pageY;
 
                var X = touch.x2 - touch.x1;
                var Y = touch.y2 - touch.y1;
 
                deltaX += Math.abs(X);
                deltaY += Math.abs(Y);
 
                firstTouch.deltaX = X;
                firstTouch.deltaY = Y;

                //触发swipeMove事件
                moveTimeout = setTimeout(function(){
	                if(touch.el){
						touch.el.trigger('swipeMove', e);
					}
                }, 0);
            })
            .on("touchend", function(e){
                if((_isPointer = isPointerEventType(e, 'up')) && !isPrimaryTouch(e)){
                    return;
                }
                cancelLongTap();

                var X = touch.x2 - touch.x1;
                var Y = touch.y2 - touch.y1;
 
                firstTouch = e;
 
                //swip触发判断
                if ((touch.x2 && Math.abs(X) > 30) || (touch.y2 && Math.abs(Y) > 30)){
                    firstTouch.deltaX = X;
                    firstTouch.deltaY = Y;
                    firstTouch.pageX = touch.x2;
                    firstTouch.pageY = touch.y2;
 
                    swipeTimeout = setTimeout(function() {
                        touch.el.trigger('swipe', e);
                        touch.el.trigger('swipe' + (swipeDirection(touch.x1, touch.x2, touch.y1, touch.y2)), e);
                        touch = {};
                    }, 0);
                }
                //tap触发判断
                else if ('last' in touch){
                    firstTouch.pageX = touch.x2;
                    firstTouch.pageY = touch.y2;
 
                    touch.el.trigger("tap", e); //触发tap事件
                    if(deltaX < 30 && deltaY < 30){
 
                        tapTimeout = setTimeout(function() {
 
                            //判断双击事件
                            if (touch.isDoubleTap) {
                                if (touch.el){
                                    touch.el.trigger('doubleTap', e);
                                } 
                                touch = {};
                            }
                            //判断单击事件
                            else {
                                touchTimeout = setTimeout(function(){
                                    touchTimeout = null;
                                    if (touch.el){
                                        touch.el.trigger('singleTap', e);
                                    } 
                                    touch = {};
                                }, 250);
                            }
                        }, 0);
                    }else {
                        touch = {};
                    }
                }
 
                deltaX = deltaY = 0;
            })
            .on("touchcancel", cancelAll); //绑定清除所有触发事件
 
            diy(window).on("scroll", cancelAll);
        });
    })();

    for(var key in window.diy){
    	if(window.diy.hasOwnProperty(key)){
    		diy[key] = window.diy[key];
    	}
    }

    diy.object = _obj;

    window.diy = diy;
});