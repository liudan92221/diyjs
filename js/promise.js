/**
 * Created with JetBrains WebStorm.
 * User: liudan
 * Date: 14-7-9
 * Time: 下午9:56
 * To change this template use File | Settings | File Templates.
 */

(function(){
    var promiseA = {};

    promiseA.deferred = function(){
        var _this = this;
        _this.state = "default";
        _this.value = "";
        _this.successCallbacklist = [];
        _this.errorCallbacklist = [];

        _this.resolve = function (value){
            if(_this.state == "default"){
                _this.state = "resolved";
                _this.value = value;

                for(var i= 0;i < _this.successCallbacklist.length;i++){
                    _this.promise.success(_this.successCallbacklist[i]);
                }
            }
        };

        _this.reject = function (value){
            if(_this.state == "default"){
                _this.state = "rejected";
                _this.value = value;

                for(var i= 0;i < _this.errorCallbacklist.length;i++){
                    _this.promise.error(_this.errorCallbacklist[i]);
                }
            }
        };

        function promise(){
            var self = this;

            self.__type__ = "promiseA";
            self.then = function (succCallback, errCallback){
                return self.success(succCallback).error(errCallback);
            };
            self.success = function (callback){
                if(_this.state == "resolved"){
                    var tempValue = callback.call(self, _this.value);
                    if(tempValue){
                        if(tempValue.__type__ == "promiseA"){
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
                        if(tempValue.__type__ == "promiseA"){
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
            }

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


})();