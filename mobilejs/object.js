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