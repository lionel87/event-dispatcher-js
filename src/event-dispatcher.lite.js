/*!
 * EventDispatcher
 * @version 1.8.4 LITE
 * @author László BULIK
 * @license MIT License
 */
(function(window, undefined) {
'use strict';

function EventDispatcher()
{
    this.listeners = {};
}

EventDispatcher.prototype.addListener = function(eventName, context, method, priority)
{
    if (!this.listeners[eventName]) {
        this.listeners[eventName] = [];
    }

    if (typeof context === 'function') {
        priority = method;
        method = context;
        context = null;
    }
    if (typeof priority !== 'number') {
        priority = 0;
    }
    
    var i,
        listeners = this.listeners[eventName],
        listener = {
            context: context,
            method: method,
            priority: priority
        };

    for (i = listeners.length; i > 0; --i) {
        if (listeners[i - 1].priority >= listener.priority) {
            break;
        }
    }
    if (i === listeners.length) {
        listeners.push(listener);
    } else {
        listeners.splice(i, 0, listener);
    }

    return this;
};

EventDispatcher.prototype.dispatch = function(eventName, eventData)
{
    var listeners = this.listeners.hasOwnProperty(eventName) ? this.listeners[eventName] : null;
    if (listeners) {
        for (var i = 0; i < listeners.length; ++i) {
            if (typeof listeners[i].method === 'function') {
                listeners[i].method.call(listeners[i].context, eventData);
            } else if (typeof listeners[i].method === 'string') {
                if (typeof listeners[i].context[listeners[i].method] === 'function') {
                    listeners[i].context[listeners[i].method].call(listeners[i].context, eventData);
                } else {
                    throw new TypeError('EventDispatcher: Method "' + listeners[i].method + '" does not exists in this context.');
                }
            } else {
                throw new TypeError('EventDispatcher: "' + eventName + '" event handler type mismatch:'
                    + ' expected string or function, got '
                    + (listeners[i].method === null ? 'null' : typeof listeners[i].method));
            }
        }
    }
    return this;
};

window.EventDispatcher = EventDispatcher;

})(window);
