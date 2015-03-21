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