/**Write polyfill  for request animation frame*/
window.requestAnimFrame = (function(){
    'use strict';
        return  window.requestAnimationFrame       ||
            window.webkitRequestAnimationFrame ||
            window.mozRequestAnimationFrame    ||
        function( callback ){
            window.setTimeout(callback, 1000 / 60);
        };
})();

(function(window){
    // Simple way to check if some form of pointerevents is enabled or not
    window.PointerEventsSupport = false;
    if(window.PointerEvent || window.navigator.msPointerEnabled) {
      window.PointerEventsSupport = true;
    }
       

    /*Updating new position*/
    function updateTransformProp(element,newValue){
        
        var st = window.getComputedStyle(element, null);
        var tr = st.getPropertyValue("-webkit-transform") ||
        st.getPropertyValue("-moz-transform") ||
        st.getPropertyValue("-ms-transform") ||
        st.getPropertyValue("-o-transform") ||
        st.getPropertyValue("transform") ||"FAIL";
        var matrix = new WebKitCSSMatrix(tr);
        newValue = 'translateY('+matrix.m42+'px)  ' + newValue;
        return newValue;
    }


    
    


    // Simple way to check if some form of pointerevents is enabled or not
    window.PointerEventsSupport = false;
    if(window.PointerEvent || window.navigator.msPointerEnabled) {
      window.PointerEventsSupport = true;
    }
    /* // [END pointereventsupport] */
    var substriberList = [];
    function SwipeRevealItem(element) {
      'use strict';

      // Gloabl state variables
      var STATE_DEFAULT = 1;
      var STATE_LEFT_SIDE = 2;
      var STATE_RIGHT_SIDE = 3;

      var swipeFrontElement = element;
      var rafPending = false;
      var initialTouchPos = null;
      var lastTouchPos = null;
      var currentXPosition = 0;
      var currentState = STATE_DEFAULT;
      var handleSize = 10;
      
      // Perform client width here as this can be expensive and doens't
      // change until window.onresize
      var itemWidth = swipeFrontElement.clientWidth;
      var slopValue = itemWidth * (1/4);

      // On resize, change the slop value
      this.resize = function() {
        itemWidth = swipeFrontElement.clientWidth;
        slopValue = itemWidth * (1/4);
      };

      /* // [START handle-start-gesture] */
      // Handle the start of gestures
      this.handleGestureStart = function(evt) {
        evt.preventDefault();

        if(evt.touches && evt.touches.length > 1) {
          return;
        }

        // Add the move and end listeners
        if (window.PointerEvent) {
          evt.target.setPointerCapture(evt.pointerId);
        } else {
          // Add Mouse Listeners
          document.addEventListener('mousemove', this.handleGestureMove, true);
          document.addEventListener('mouseup', this.handleGestureEnd, true);
        }

        initialTouchPos = getGesturePointFromEvent(evt);

        swipeFrontElement.style.transition = 'initial';
      }.bind(this);
      /* // [END handle-start-gesture] */

      // Handle move gestures
      //
      /* // [START handle-move] */
      this.handleGestureMove = function (evt) {
        evt.preventDefault();

        if(!initialTouchPos) {
          return;
        }

        lastTouchPos = getGesturePointFromEvent(evt);

        if(rafPending) {
          return;
        }

        rafPending = true;

        window.requestAnimFrame(onAnimFrame);
      }.bind(this);
      /* // [END handle-move] */

      /* // [START handle-end-gesture] */
      // Handle end gestures
      this.handleGestureEnd = function(evt) {
        evt.preventDefault();

        if(evt.touches && evt.touches.length > 0) {
          return;
        }

        rafPending = false;

        // Remove Event Listeners
        if (window.PointerEvent) {
          evt.target.releasePointerCapture(evt.pointerId);
        } else {
          // Remove Mouse Listeners
          document.removeEventListener('mousemove', this.handleGestureMove, true);
          document.removeEventListener('mouseup', this.handleGestureEnd, true);
        }

        updateSwipeRestPosition();

        initialTouchPos = null;
      }.bind(this);
      /* // [END handle-end-gesture] */

      function updateSwipeRestPosition() {
        var differenceInX = initialTouchPos.x - lastTouchPos.x;
        currentXPosition = currentXPosition - differenceInX;

        // Go to the default state and change
        var newState = STATE_DEFAULT;

        // Check if we need to change state to left or right based on slop value
        if(Math.abs(differenceInX) > slopValue) {
          if(currentState === STATE_DEFAULT) {
            if(differenceInX > 0) {
              newState = STATE_LEFT_SIDE;
            } else {
              newState = STATE_RIGHT_SIDE;
            }
          } else {
            if(currentState === STATE_LEFT_SIDE && differenceInX > 0) {
              newState = STATE_DEFAULT;
            } else if(currentState === STATE_RIGHT_SIDE && differenceInX < 0) {
              newState = STATE_DEFAULT;
            }
          }
        } else {
          newState = currentState;
        }

        changeState(newState);

        // swipeFrontElement.style.transition = 'all 150ms ease-out';
      }

      function changeState(newState) {
        var transformStyle;
        switch(newState) {
          case STATE_DEFAULT:
            currentXPosition = 0;
            break;
          case STATE_LEFT_SIDE:
            currentXPosition = -(itemWidth - handleSize);
            break;
          case STATE_RIGHT_SIDE:
            currentXPosition = itemWidth - handleSize;
            break;
        }

        transformStyle = 'translateX('+currentXPosition+'px)';
        if(STATE_RIGHT_SIDE && currentXPosition>0){
            transformStyle = updateTransformProp(swipeFrontElement,transformStyle);
            swipeFrontElement.style.msTransform = transformStyle;
            swipeFrontElement.style.MozTransform = transformStyle;
            swipeFrontElement.style.webkitTransform = transformStyle;
            swipeFrontElement.style.transform = transformStyle;
            swipeFrontElement.style.opacity= 0.3;
            currentState = newState;
            /**
             * Event custom event and dispatch
             */
            var event = document.createEvent('Event');
            // Define that the event name is 'build'.
            event.initEvent('swipeout', true, true);
            // target can be any Element or other EventTarget.
            swipeFrontElement.dispatchEvent(event);
        }
      }

      function getGesturePointFromEvent(evt) {
        var point = {};

        if(evt.targetTouches) {
          point.x = evt.targetTouches[0].clientX;
          point.y = evt.targetTouches[0].clientY;
        } else {
          // Either Mouse event or Pointer Event
          point.x = evt.clientX;
          point.y = evt.clientY;
        }

        return point;
      }

      /* // [START on-anim-frame] */
      function onAnimFrame() {
        if(!rafPending) {
          return;
        }

        var differenceInX = initialTouchPos.x - lastTouchPos.x;

        var newXTransform = (currentXPosition - differenceInX)+'px';
        var transformStyle = 'translateX('+newXTransform+')';
        transformStyle = updateTransformProp(swipeFrontElement,transformStyle);
        swipeFrontElement.style.webkitTransform = transformStyle;
        swipeFrontElement.style.MozTransform = transformStyle;
        swipeFrontElement.style.msTransform = transformStyle;
        swipeFrontElement.style.transform = transformStyle;

        rafPending = false;
      }
      /* // [END on-anim-frame] */

      /* // [START addlisteners] */
      // Check if pointer events are supported.
      if (window.PointerEvent) {
        // Add Pointer Event Listener
        swipeFrontElement.addEventListener('pointerdown', this.handleGestureStart, true);
        swipeFrontElement.addEventListener('pointermove', this.handleGestureMove, true);
        swipeFrontElement.addEventListener('pointerup', this.handleGestureEnd, true);
        swipeFrontElement.addEventListener('pointercancel', this.handleGestureEnd, true);
      } else {
        // Add Touch Listener
        swipeFrontElement.addEventListener('touchstart', this.handleGestureStart, true);
        swipeFrontElement.addEventListener('touchmove', this.handleGestureMove, true);
        swipeFrontElement.addEventListener('touchend', this.handleGestureEnd, true);
        swipeFrontElement.addEventListener('touchcancel', this.handleGestureEnd, true);

        // Add Mouse Listener
        swipeFrontElement.addEventListener('mousedown', this.handleGestureStart, true);
      }
      /* // [END addlisteners] */
    }

    window.SwipeRevealItem = SwipeRevealItem;
})(self);