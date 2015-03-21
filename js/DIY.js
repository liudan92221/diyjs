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