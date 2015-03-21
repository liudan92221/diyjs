(function (window) {
    var config = {
        charset: "UTF-8",
        path: ""
    },
        baseScript,
        url,
        headNode,
        LD;
    baseScript = window.document.getElementById("diy");
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

    var moduleCache = {},
        idCache = {};
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
        require.async = function(id, callback){
            use(id, callback);
        };
        if(module.state < 1){
            var oldDepsLen = module.oldDeps.length;
            var parameters = [require, module.exports, module];
            //TODO  此处为AMD实现，如果define中不加入依赖，将是CMD实现，强烈建议define中写入依赖的模块不参与控制作用域以外的变量
            if(oldDepsLen){
                for(var i=0;i < oldDepsLen;i++){
                    parameters.push(require(module.oldDeps[i]));
                }
            }
            var exports = module.factory.apply(module, parameters);
            if(exports){
                module.exports = exports;
            }
            module.state = 1;
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
            return moduleCache[id] = {id: id, deps: deps, factory: func, oldDeps: oldDeps, exports: {}, state: 0};
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
        var node = document.createElement("script"),
            tempNode = null;

            
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

        tempNode = node;
        headNode.appendChild(node);
        tempNode = null;

        return defer.promise;    
    }
    function use(id, callback){
        id = id instanceof Array ? id : [id],
        moduleList = [];
        for(var i=0;i< id.length;i++){
            if(moduleCache[id[i]]){
                var defer = new deferred();
                move(moduleCache[id[i]], function(){
                    defer.resolve(id[i]);
                });
                moduleList.push(defer.promise);
            }else{
                moduleList.push(load(id[i]));
            }
        }
        new deferred().promise.when(moduleList, function(moduleList){
            if(callback){
                var exports = [];
                for(var i=0;i < moduleList.length;i++){
                    exports.push(requireMain(moduleCache[moduleList[i]]));
                }
                callback.apply(null, exports);
            }
        });
    }

    var diy = function(){};
    diy.define = window.define;
    diy.use = use;
    window.diy = diy;
})(window);