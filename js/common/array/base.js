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