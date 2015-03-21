/**
 * Created with JetBrains WebStorm.
 * User: liudan
 * Date: 14-7-26
 * Time: 下午1:09
 * To change this template use File | Settings | File Templates.
 */
define(function(require, exports, module){
    var _object = require("common.object"),
    	_array = require("common.array"),
    	_string = require("common.string"),
    	_query = require("query.query");
    	_system = require("system.system");

    diy = _object.object.merge(diy, _object);
    diy = _object.object.merge(diy, _array);
    diy = _object.object.merge(diy, _string);
    diy = _object.object.merge(diy, _query);
    diy = _object.object.merge(diy, _system);
    module.exports = diy;
});