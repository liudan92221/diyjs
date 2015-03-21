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