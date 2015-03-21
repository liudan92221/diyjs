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