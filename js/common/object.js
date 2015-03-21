/**
 * Created with JetBrains WebStorm.
 * User: liudan
 * Date: 14-8-3
 * Time: 下午4:24
 * To change this template use File | Settings | File Templates.
 */
define("common.object", [], function(require, exports, module){
    var _base = require("common.object.base"),
        _isType = require("common.object.isType"),
        _primary = require("common.object.primary"),
        _obj = {};

    _obj = _base.merge(_obj, _base);
    _obj = _base.merge(_obj, _isType);
    _obj = _base.merge(_obj, _primary);

    module.exports = {
    	object: _obj
    };
});
