define(function(require, exports, module){
	var _obj = require("object"),
		_query = require("query"),
		diy = _query.query;

	(function(){
        var touch = {},
            touchTimeout,
            longTapTimeout,
            swipeTimeout,
            tapTimeout,
            moveTimeout,
            longTapDelay = 750,
            gesture;
 
        //判断是哪种触摸事件
        function isPointerEventType(e, type){
            return (e.type == 'pointer'+type || e.type.toLowerCase() == 'mspointer'+type);
        }
 
        //判断是否是触摸事件
        function isPrimaryTouch(event){
            return (event.pointerType == 'touch' || event.pointerType == event.MSPOINTER_TYPE_TOUCH)
                && event.isPrimary;
        }
 
        //触发长按键事件
        function longTap() {
            longTapTimeout = null;
            if (touch.last) {
                touch.el.trigger('longTap');
                touch = {};
            }
        }
 
        //清除长按键
        function cancelLongTap() {
            if (longTapTimeout){
                clearTimeout(longTapTimeout);
            } 
            longTapTimeout = null;
        }
 
        //增加swip(Left/Right/Up/Dowm)事件
        function swipeDirection(x1, x2, y1, y2) {
            return Math.abs(x1 - x2) >= Math.abs(y1 - y2) ? 
                    (x1 - x2 > 0 ? 'Left' : 'Right') : 
                    (y1 - y2 > 0 ? 'Up' : 'Down');
        }
 
        //清除所有触摸事件
        function cancelAll() {
            touchTimeout ? clearTimeout(touchTimeout) : "";
            tapTimeout ? clearTimeout(tapTimeout) : "";
            swipeTimeout ? clearTimeout(swipeTimeout) : "";
            longTapTimeout ? clearTimeout(longTapTimeout) : "";
            touchTimeout = tapTimeout = swipeTimeout = longTapTimeout = null;
            touch = {};
        }
 
        diy(document).on("DOMContentLoaded", function(){
            var firstTouch,
                _isPointer,
                now,
                delta,
                deltaX = 0,
                deltaY = 0; 
 
            if ('MSGesture' in window) {
                gesture = new MSGesture()
                gesture.target = document.body
            }
 
            diy(document).on("touchstart", function(e){
                if((_isPointer = isPointerEventType(e, 'down')) && !isPrimaryTouch(e)){
                    return;
                }
 
                firstTouch = _isPointer ? e : e.touches[0];
 
                now = Date.now();       //记录当前时间
                delta = now - (touch.last || now); //记录时间差
                touch.el = diy('tagName' in firstTouch.target ? firstTouch.target : firstTouch.target.parentNode);
                touchTimeout && clearTimeout(touchTimeout);
                touch.x1 = firstTouch.pageX;
                touch.y1 = firstTouch.pageY;
 
                if (delta > 0 && delta <= 250){
                    touch.isDoubleTap = true;
                } 
                touch.last = now;
 
                //触发长按键事件
                longTapTimeout = setTimeout(function() {
                    longTapTimeout = null;
                    if (touch.last) {
                        touch.el.trigger('longTap', e);
                        touch = {};
                    }
                }, longTapDelay);
 
                //增加IE触摸
                if (gesture && _isPointer){
                    gesture.addPointer(e.pointerId);
                } 
            })
            .on("touchmove", function(e){
                if((_isPointer = isPointerEventType(e, 'move')) && !isPrimaryTouch(e)){
                    return;
                }
				cancelLongTap(); //清楚长按键

                firstTouch = _isPointer ? e : e.touches[0];

                touch.x2 = firstTouch.pageX;
                touch.y2 = firstTouch.pageY;
 
                var X = touch.x2 - touch.x1;
                var Y = touch.y2 - touch.y1;
 
                deltaX += Math.abs(X);
                deltaY += Math.abs(Y);
 
                firstTouch.deltaX = X;
                firstTouch.deltaY = Y;

                //触发swipeMove事件
                moveTimeout = setTimeout(function(){
	                if(touch.el){
						touch.el.trigger('swipeMove', e);
					}
                }, 0);
            })
            .on("touchend", function(e){
                if((_isPointer = isPointerEventType(e, 'up')) && !isPrimaryTouch(e)){
                    return;
                }
                cancelLongTap();

                var X = touch.x2 - touch.x1;
                var Y = touch.y2 - touch.y1;
 
                firstTouch = e;
 
                //swip触发判断
                if ((touch.x2 && Math.abs(X) > 30) || (touch.y2 && Math.abs(Y) > 30)){
                    firstTouch.deltaX = X;
                    firstTouch.deltaY = Y;
                    firstTouch.pageX = touch.x2;
                    firstTouch.pageY = touch.y2;
 
                    swipeTimeout = setTimeout(function() {
                        touch.el.trigger('swipe', e);
                        touch.el.trigger('swipe' + (swipeDirection(touch.x1, touch.x2, touch.y1, touch.y2)), e);
                        touch = {};
                    }, 0);
                }
                //tap触发判断
                else if ('last' in touch){
                    firstTouch.pageX = touch.x2;
                    firstTouch.pageY = touch.y2;
 
                    touch.el.trigger("tap", e); //触发tap事件
                    if(deltaX < 30 && deltaY < 30){
 
                        tapTimeout = setTimeout(function() {
 
                            //判断双击事件
                            if (touch.isDoubleTap) {
                                if (touch.el){
                                    touch.el.trigger('doubleTap', e);
                                } 
                                touch = {};
                            }
                            //判断单击事件
                            else {
                                touchTimeout = setTimeout(function(){
                                    touchTimeout = null;
                                    if (touch.el){
                                        touch.el.trigger('singleTap', e);
                                    } 
                                    touch = {};
                                }, 250);
                            }
                        }, 0);
                    }else {
                        touch = {};
                    }
                }
 
                deltaX = deltaY = 0;
            })
            .on("touchcancel", cancelAll); //绑定清除所有触发事件
 
            diy(window).on("scroll", cancelAll);
        });
    })();

    for(var key in window.diy){
    	if(window.diy.hasOwnProperty(key)){
    		diy[key] = window.diy[key];
    	}
    }

    diy.object = _obj;

    window.diy = diy;
});