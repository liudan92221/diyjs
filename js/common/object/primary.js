define("common.object.primary", [], function(require, exports, module){
    module.exports = {
        keys: Object.keys || function(obj){
            var result = [];

            if(obj instanceof Object){
                for(var key in obj){
                    if(obj.hasOwnProperty(key)){
                        result.push(key);
                    }
                }
                return result;
            }else{
                throw new TypeError("Object.keys called on non-object");
            }
        }
    }
});