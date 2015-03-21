/**
 * Created with JetBrains WebStorm.
 * User: liudan
 * Date: 14-8-11
 * Time: 下午9:52
 * To change this template use File | Settings | File Templates.
 */
define("common.object.base", [], function(require, exports, module){
    module.exports = {
        create: function(obj){
            return function(){
                this.initialize.apply(this, arguments);
            }
        },

        extend: function(subClass, superClass){
            var Fn = function(){
                var arg = subClass.apply(this, arguments);
                if(superClass.apply)
                    superClass.apply(this, arg);
            };
            Fn.prototype = superClass.prototype || superClass;
            Fn.prototype.constructor = subClass;
            Fn.superClass = superClass.prototype;

            return Fn;
        },

        copy: function(obj){
            return module.exports.merge({}, obj);
        },

        bind: function(fn, scope){
            return function(){
                fn.apply(scope, arguments);
            }
        },

        coverage: function(options, defaults){
            var _obj = options || {};
            for(var key in defaults){
                _obj[key] = _obj.hasOwnProperty(key) ? _obj[key] : defaults[key];
            }

            return _obj;
        },

        merge: function(options, defaults){
            var _obj = options || {};
            for(var key in defaults){
                if(typeof defaults[key] == "object" && typeof _obj[key] == "object"){
                    _obj[key] = arguments.callee(_obj[key], defaults[key]);
                }else{
                    _obj[key] = defaults[key];
                }
            }
            return _obj;
        },

        charge: function(options, defaults){
            var _obj = options || {};
            for(var key in defaults){
                _obj[key] = _obj[key] || defaults[key];
            }
            return _obj;
        },

        getArray: function(list){
            return Array.prototype.slice.apply(list);
        }
    }
});