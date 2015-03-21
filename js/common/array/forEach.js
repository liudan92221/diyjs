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