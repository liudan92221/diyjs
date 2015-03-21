define("system.browser", [], function(require, exports, module){
	var _b = navigator.userAgent.toLowerCase();

	module.exports = {
		version : (_b.match( /.+(?:rv|chrome|ra|ie)[\/: ]([\d.]+)/ ) || [])[1],
        ie : /msie/.test(_b),
        moz : /gecko/.test(_b),
        safari : /safari/.test(_b),
        ff : /firefox/i.test(_b),
        chrome : /chrome/i.test(_b)
	}
});