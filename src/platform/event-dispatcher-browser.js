{% include 'header.js' %}
(function(window, undefined) {
'use strict';

{% include 'event-dispatcher.js' %}

var EventDispatcherNoConflict = window.EventDispatcher;
EventDispatcher.noConflict = function()
{
    window.EventDispatcher = EventDispatcherNoConflict;
    EventDispatcherNoConflict = undefined;
    EventDispatcher.noConflict = function() { return this; };
    return this;
};

window.EventDispatcher = EventDispatcher;

})(window);
