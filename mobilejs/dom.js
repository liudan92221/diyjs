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