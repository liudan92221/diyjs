/**
 * Created with JetBrains WebStorm.
 * User: liudan
 * Date: 14-7-12
 * Time: 下午3:31
 * To change this template use File | Settings | File Templates.
 */
(function (window) {
    var config = {
        charset: "UTF-8",
        path: ""
    },
        baseScript,
        url,
        headNode,
        LD;
    baseScript = window.document.getElementById("ld");
    config.path = baseScript.getAttribute ? baseScript.getAttribute("basePath") : baseScript.basePath;

    if (!config.path) {
        url = window.location.href.split("/");
        url.pop();
        config.path = url.join("/");
    }
    headNode = document.getElementsByTagName("head")[0];

    LD = "ld";
    var deferred = function () {
        var _this = this;
        _this.state = "default";
        _this.value = "";
        _this.successCallbacklist = [];
        _this.errorCallbacklist = [];

        _this.resolve = function (value) {
            if (_this.state == "default") {
                _this.state = "resolved";
                _this.value = value;

                for(var i= 0;i < _this.successCallbacklist.length;i++){
                    _this.promise.success(_this.successCallbacklist[i]);
                }
            }
        };

        _this.reject = function (value) {
            if (_this.state == "default") {
                _this.state = "rejected";
                _this.value = value;

                for(var i= 0;i < _this.errorCallbacklist.length;i++){
                    _this.promise.error(_this.errorCallbacklist[i]);
                }
            }
        };

        function promise () {
            var self = this;

            var __type__ = "promiseA";
            self.then = function (succCallback, errCallback){
                return self.success(succCallback).error(errCallback);
            };
            self.success = function (callback){
                if(_this.state == "resolved"){
                    var tempValue = callback.call(self, _this.value);
                    if(tempValue){
                        if(tempValue.getType() == "promiseA"){
                            _this.promise = tempValue;
                        }else{
                            _this.value = tempValue
                        }
                    }
                }else{
                    _this.successCallbacklist.push(callback);
                }
                return _this.promise;
            };
            self.error = function(callback){
                if(_this.state == "rejected"){
                    var tempValue = callback.call(self, _this.value);
                    if(tempValue){
                        if(tempValue.getType() == "promiseA"){
                            _this.promise = tempValue;
                        }else{
                            _this.value = tempValue
                        }
                    }
                }else{
                    _this.errorCallbacklist.push(callback);
                }
                return _this.promise;
            };
            self._getState = function(){
                return _this.state;
            };
            self._getValue = function(){
                return _this.value;
            };
            self.getType = function(){
                return __type__;
            };

            self.promises = [];
            self.all = function(promises){
                self.promises = promises instanceof Array ? promises : [promises];
                var len = self.promises.length;
                for(var i=0; i < len;i++){
                    (function(i){
                        self.promises[i].then(function(){
                            var state = true,
                                args = [];
                            for(var n=0;n < len;n++){
                                if(self.promises[n]._getState() == "rejected" || self.promises[n]._getState() == "default"){
                                    state = false;
                                }else{
                                    args.push(self.promises[n]._getValue());
                                }
                            }
                            if(state){
                                _this.resolve(args);
                            }
                        }, function(){
                            var state = true,
                                args = [];
                            for(var n=0;n < len;n++){
                                if(self.promises[n]._getState() == "resolved" || self.promises[n]._getState() == "default"){
                                    state = false;
                                }else{
                                    args.push(self.promises[n]._getValue());
                                }
                            }
                            if(state){
                                _this.reject(args);
                            }
                        });
                    })(i)
                }

                return self;
            };

            self.when = function(promise, callback){
                if(promise instanceof Array || promise.__type__ == "promiseA"){
                    return self.all(promise).success(callback);
                }else{
                    _this.resolve(promise);
                    return self.success(callback);
                }
            }
        }

        _this.promise = new promise();
    };
    //时间戳
    var timeStamp = new Date().getTime();

    //AMD start
    var REQUIRE = /require\(('|")([^()<>\\\/|?*:]*)('|")\)/g;
    var COMMENT_RE = /(\/\*(.|[\r\n])*?\*\/)|((\/\/.*))/g;
    var MODULEID = new RegExp('ld\\:\\d{'+ timeStamp.toString().length +'}');

    var moduleCache = {};
    window.define = function(id, deps, func){
        if(typeof id == "function"){
            func = id;
            id = LD + ":" + timeStamp++;
        }

        if(typeof deps == "function"){
            func = deps;
            deps = [];
        }
        if(!func){
            func = function(){};
        }

        var oldDeps = deps instanceof Array ? deps : [];
        deps = deps ? (deps || []).concat(getDeps(func)) : getDeps(func);
        var module = makeModule(id, deps, func, oldDeps);
        if(MODULEID.test(id)){
            move(module, function(){
                requireMain(module);
            });
        }
    }

    function requireMain(module){
        var require = function(id){
            return requireMain(moduleCache[id]);
        };
//        require.async = function(id, callback){
//            id = id instanceof Array ? id : [id];
//            var promises = [];
//            for(var i=0;i < id.length;i++){
//                promises.push(load(id[i]));
//            }
//            var state = false;
//            new deferred().promise.when(promises, function(){
//                state = true;
//            });
//            function async(){
//                var parameters = [];
//                if(state){
//                    for(var i=0;i < id.length;i++){
//                        parameters.push(require(id[i]));
//                    }
//                    callback && callback(parameters);
//                    return parameters;
//                }else{
//                    setTimeout(arguments.callee, 1);
//                }
//            }
//            return async();
//        };
        var oldDepsLen = module.oldDeps.length;
        var parameters = [require, module.exports, module];
        //TODO  此处为AMD实现，如果define中不加入依赖，将是CMD实现，强烈建议define中写入依赖的模块不参与控制作用域意外的变量
        if(oldDepsLen){
            for(var i=0;i < oldDepsLen;i++){
                parameters.push(require(module.oldDeps[i]));
            }
        }
        var exports = module.factory.apply(module, parameters);
        if(exports){
            module.exports = exports;
        }
        return module.exports;
    }

    function getDeps(func){
        var deps = [];
        func.toString().replace(COMMENT_RE, '').replace(REQUIRE, function(match, f1, f2, f3){
            deps.push(f2);
        });
        return deps;
    };

    function makeModule(id, deps, func, oldDeps){
        if(!moduleCache[id]){
            return moduleCache[id] = {id: id, deps: deps, factory: func, oldDeps: oldDeps, exports: null, state: 0};
        }
        return moduleCache[id];
    }

    function move(module, callback){
        var unDeps = unLoad(module);
        if(!unDeps.length){
            callback && callback();
            return;
        }

        var unDefer = [];
        for(var i=0;i < unDeps.length;i++){
            unDefer.push(load(unDeps[i]));
        }
        new deferred().promise.when(unDefer, function(){
            callback && callback();
        });
    }
    function unLoad(module){
        var unDeps = [];
        var deps = module.deps = module.deps.length == 0 ? module.deps.concat(getDeps(module.factory)) : module.deps;

        for(var i=0;i < deps.length;i++){
            if(!moduleCache[deps[i]]){
                unDeps.push(deps[i]);
            }
        }
        return unDeps;
    }
    function load(id){
        var node = document.createElement("script");
        node.charset = config.charset;
        node.src = config.path + "/" + id.replace(/\./g, "/") + ".js" + (/msie/.test(navigator.userAgent.toLowerCase()) ? "?_=" + (timeStamp++) : "");
        node.async = true;

        var defer = new deferred();
        node.onload = node.onreadystatechange = function(){
            if(/^(?:loaded|complete|undefined)$/.test(node.readyState)){
                node.onerror = node.onload = node.onreadystatechange = null;
                if(moduleCache[id]){
                    move(moduleCache[id], function(){defer.resolve(id)});
                }else{
                    setTimeout(arguments.callee, 1);
                }
            }
        };

        node.onerror = function(){
            node.error = node.onload = node.onreadystatechange = null;
            throw new Error("Module '"+id+"' is not defined");
        }

        headNode.appendChild(node);
        return defer.promise;
    }
})(window, document)

/**
 * Created with JetBrains WebStorm.
 * User: liudan
 * Date: 14-7-20
 * Time: 下午6:06
 * To change this template use File | Settings | File Templates.
 */
define("module2.test2", [], function(require){
//    var a = require("module.xxx");
    return {
        test2: "test2"
    }
})

/**
 * Created with JetBrains WebStorm.
 * User: liudan
 * Date: 14-7-20
 * Time: 下午6:00
 * To change this template use File | Settings | File Templates.
 */
define("module.xxx1", [], function(require){
    return {
        xxx1: "xxx1",
        a: require("module2.test2")
    }
});

/**
 * Created with JetBrains WebStorm.
 * User: liudan
 * Date: 14-7-18
 * Time: 下午11:31
 * To change this template use File | Settings | File Templates.
 */
define("module.xxx", [], function(require, exports, module){
    var a = {
        xxx: 123
    }
    var test = require("module.xxx1");
    a.test = test;
    module.exports = a;
});
/**
 * Created with JetBrains WebStorm.
 * User: liudan
 * Date: 14-6-28
 * Time: 下午8:17
 * To change this template use File | Settings | File Templates.
 */
define("module.test", [], function(require, exports, module){
    var a = {
        a: 1
    };
    var b = require("module.xxx");
    var c = require("module.xxx1");
//    var b = require("module.test2");
    a.b = b;
    return a;
});

/**
 * Created with JetBrains WebStorm.
 * User: liudan
 * Date: 14-7-26
 * Time: 下午1:09
 * To change this template use File | Settings | File Templates.
 */
define(function(require, exports, module){
    var test = require("module.test");
    console.log(test);
    console.log({
        xxx: "xxx",
        x: {xxx: "xxxx"}
    });
});
