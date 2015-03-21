/**
 * Created with JetBrains WebStorm.
 * User: liudan
 * Date: 14-8-3
 * Time: 下午4:31
 * To change this template use File | Settings | File Templates.
 */
define("common.object.isType", [], function(require, exports, module){
    function isType(type){
        return function(obj){
            return Object.prototype.toString.call(obj) === "[object "+ type +"]";
        }
    }

    function isNumber(obj){
        if(isType("Number")(obj) && !isNaN(obj)){
            return true;
        }
        return false;
    }

    function isWindow(obj){
        return obj == document && !document == obj;
    }

    function isPlainObject(obj){
        if(Object.getPrototypeOf){
            return obj && isType("Object")(obj) && Object.getPrototypeOf(obj) === Object.prototype;
        }

        if(!obj || !isType("Object")(obj) || obj.nodeType || isWindow(obj)){
            return false;
        }

        try{
            if(obj.constructor && hasOwnProperty.call(obj.costructor.prototype, "isPrototypeOf")){
                return false;
            }
        }catch(e){
            return false;
        }

        return true;
    }

    function  isEmptyObject(obj){
        for (var key in obj) {
            return false;
        }
        return true;
    }

    module.exports = {
        isObject: isType("Object"),
        isString: isType("String"),
        isArray: Array.isArray || isType("Array"),
        isFunction: isType("Function"),
        isNumber: isNumber,
        isWindow: isWindow,
        isPlainObject: isPlainObject,
        isEmptyObject: isEmptyObject
    }
});
