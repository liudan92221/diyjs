(function(window){
    var App,
        DOM,
        ARRAY;
 
    App = function(){
        return App.query.query.apply(null, arguments);
    };
 

    /**
    * 数组扩展方法
    */
    var forEach = Array.prototype.forEach || function(callback){
        for(var i = 0,len = this.length;i < len;i++){
            callback && callback(this[i], i);
        }
    };
 
    App.array = {
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
 
    
    /**
    * object扩展方法
    */
    App.object = {
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
        },
 
        // clone: function(obj) {
        //     var util = App.Utils,
        //         out = null;
        //     if (util.isArray(obj)) {
        //         out = [];
        //         util.each(obj, function(i, e) {
        //             out.push(e);
        //         });
        //     } else {
        //         out = {};
        //         util.each(obj, function(i, e) {
        //             out[i] = e;
        //         });
        //     }
        //     return out;
        // }
    };
 
    /**
    * 事件扩展方法
    */
    App.event = function(){
        var handlers = {},
            timeStamp = new Date(),
            isArray = App.object.isArray,
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
                handler[event].__proto__ = ARRAY;
            }
            i = handler[event].length;
            fn.i = i;
 
            function proxy(e){
                // if (e.isImmediatePropagationStopped()){
                //     return;
                // } 
 
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
 
            // if(isArray(handler[event])){
            //     handler[event].forEach(function(item){
            //         if(item){
            //             item.call(element);
            //         }
            //     });
            // }
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
    };
 

    /**
    * dom扩展方法
    */
    App.dom = {
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
 
                item.className = App.object.trim(classname.replace(reg, " "));
            });
 
            return this;
        },
 
        find: function(sub){
            var result = [];
 
            this.forEach(function(item, i){
                result = result.concat(App.array.getArray(item.querySelectorAll(sub)));
            });
 
            result.__proto__ = DOM;
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
 
            index > len ? len : index;
            index < 0 ? 0 : index;
 
            result = [this[index]];
            result.__proto__ = DOM;
            return result;
        },
 
        parent: function(){
            var result = [];
 
            this.forEach(function(item){
                result.push(item.parentNode);
            });
 
            result.__proto__ = DOM;
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
 
    // css3动画操作
    App.css3 = {
        toggleInfinite: function(){
            if(this.hasInfinite()){
                this.removeInfinite();
            }else{
                this.addInfinite();
            }
        },
 
        addInfinite: function(){
            var _this = this;
 
            _this.removeClass("animation");
            setTimeout(function(){
                _this.addClass("animation infinite");
            }, 0);
        },
 
        removeInfinite: function(){
            this.removeClass("animation");
            this.removeClass("infinite");
        },
 
        hasInfinite: function(){
            return this.hasClass("animation") && this.hasClass("infinite");
        }
    };
 
    App.query = {
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
            if(App.object.isArray(element)){
                element.__proto__ = ARRAY;
                return element;
            }
 
            if((typeof element === "object" && element.nodeType) || App.object.isWindow(element)){
                _result = [element];
                _result.__proto__ = DOM;
                return _result;
            }
 
            if(typeof element === "object" && element.__type__ === "App.dom"){
                return element;
            }
            _result = App.array.getArray(par.querySelectorAll(element));
            _result.__proto__ = DOM;
            return _result;
        }
    };
 
    function DOMEmpty(){
        var evnet = App.event();
 
        //dom操作
        this.__type__ = App.dom.__type__;
        this.find = App.dom.find;
        this.css = App.dom.css;
        this.attr = App.dom.attr;
        this.eq = App.dom.eq;
        this.parent = App.dom.parent;
        this.addClass = App.dom.addClass;
        this.removeClass = App.dom.removeClass;
        this.hasClass = App.dom.hasClass;
        this.html = App.dom.html;
 
        //事件
        this.on = evnet.on;
        this.un = evnet.un;
        this.trigger = evnet.trigger;
 
        //数组
        this.each = App.array.each;
        this.getArray = App.array.getArray;
        this.forEach = App.array.forEach;
 
        this.__proto__ = Array.prototype;
 
        //css3动画
        this.hasInfinite = App.css3.hasInfinite;
        this.addInfinite = App.css3.addInfinite;
        this.removeInfinite = App.css3.removeInfinite;
        this.toggleInfinite = App.css3.toggleInfinite;
    }
 
    function ARRAYEmpty(){
        this.each = App.array.each;
        this.getArray = App.array.getArray;
        this.forEach = App.array.forEach;
 
        this.__proto__ = Array.prototype;
    }
 
    //生成单例提供对应的扩展方法
    DOM = new DOMEmpty();
    ARRAY = new ARRAYEmpty();
 
    //移动端事件处理
    (function(){
        var $ = App.query.query,
            touch = {},
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
 
        //扩展event对象
        // function extendEvent(obj, e){
        //     for(var key in obj){
        //         if(obj.hasOwnProperty(key)){
        //             e[key] = obj[key];
        //         }
        //     }
        // }
 
        $(document).on("DOMContentLoaded", function(){
            var firstTouch,
                _isPointer,
                now,
                deltaX = 0,
                deltaY = 0; 
 
            if ('MSGesture' in window) {
                gesture = new MSGesture()
                gesture.target = document.body
            }
 
            $(document).on("touchstart", function(e){
                if((_isPointer = isPointerEventType(e, 'down')) && !isPrimaryTouch(e)){
                    return;
                }
 
                firstTouch = _isPointer ? e : e.touches[0];
 
                now = Date.now();       //记录当前时间
                delta = now - (touch.last || now); //记录时间差
                touch.el = $('tagName' in firstTouch.target ? firstTouch.target : firstTouch.target.parentNode);
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
                touch.x2 = firstTouch.pageX;
                touch.y2 = firstTouch.pageY;
 
                var X = touch.x2 - touch.x1;
                var Y = touch.y2 - touch.y1;
 
                firstTouch = _isPointer ? e : e.touches[0];
                cancelLongTap(); //清楚长按键
 
                deltaX += Math.abs(X);
                deltaY += Math.abs(Y);
 
                firstTouch.deltaX = X;
                firstTouch.deltaY = Y;
 
                //触发swipeMove事件
                moveTimeout = setTimeout(function(){
                    touch.el.trigger('swipeMove', e);
                }, 0);
            })
            .on("touchend", function(e){
                if((_isPointer = isPointerEventType(e, 'up')) && !isPrimaryTouch(e)){
                    return;
                }
                var X = touch.x2 - touch.x1;
                var Y = touch.y2 - touch.y1;
 
                firstTouch = e;
 
                cancelLongTap();
 
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
 
            $(window).on("scroll", cancelAll);
        });
    })();
 
    window.App = window.App || App;
    window.$ = window.App || App;
})(window)
 