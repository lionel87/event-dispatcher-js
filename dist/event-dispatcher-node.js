/*!
 * EventDispatcher
 * @version 1.8.5
 * @author László BULIK
 * @license MIT License
 */


/**
 * @class
 */
function EventDispatcher()
{
    this.listeners = {};
    this.debug = false;
    this.logIndentLevel = 0;
    this.logIndentText = '    ';
}

/**
 * Adds an event listener.
 *
 * In debug mode, `listenerName` will be generated automatically by `._getListenerName()` when argument is left blank.
 *
 * @see _getListenerName
 *
 * @param {string} eventName - The name of the event to listen for.
 * @param {Object} [context=null] - `this` keyword will be set to the value of `context` when calling the listener. When `method` is `string` it will be searched in `context`.
 * @param {string|Function} method - For strings, `context[method]` must be `Function` type, but only at the time when `.dispatch()` is called.
 * @param {number} [priority=0] - Higher priority means the listener gets executed earlier. When priority equals, listeners called in the order of the definition.
 * @param {string} [listenerName="<context contructor>#<function name>"] - Used in debug mode, this name will be used to identify the listener.
 *
 * @returns {EventDispatcher} This instance.
 */
EventDispatcher.prototype.addListener = function(eventName, context, method, priority, listenerName)
{
    if (!this.listeners[eventName]) {
        this.listeners[eventName] = [];
    }

    if (typeof context === 'function') { // context is missing
        listenerName = priority;
        priority = method;
        method = context;
        context = null;
    }
    if (typeof priority !== 'number') { // priority is missing
        listenerName = priority;
        priority = 0;
    }
    if (this.debug && typeof listenerName !== 'string') { // listenerName is missing, only generated in debug mode
        listenerName = this._getListenerName(context, method);
    }

    var i,
        listeners = this.listeners[eventName],
        listener = {
            name: listenerName,
            context: context,
            method: method,
            priority: priority
        };

    this.debug && this.logger({ type: 'addListener', event: eventName, listener: listener });

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

/**
 * Removes an event listener.
 * When the same listener added multiple times this removes only one, the most recently added.
 *
 * @param {string} eventName - Name of the event which was listened.
 * @param {Object} [context=null] - The registered context of the listener.
 * @param {string|Function} method - The registered function as given in `.addListener()`.
 *
 * @returns {EventDispatcher} This instance.
 */
EventDispatcher.prototype.removeListener = function(eventName, context, method)
{
    if (typeof context === 'function' || typeof context === 'string') {
        method = context;
        context = null;
    }

    var listeners = this.listeners[eventName];
    if (listeners) {
        for (var i = listeners.length - 1; i >= 0; --i) {
            if (listeners[i].context === context && listeners[i].method === method) {

                this.debug && this.logger({ type: 'removeListener', event: eventName, listener: listeners[i] });

                listeners.splice(i, 1);
                if (listeners.length === 0) {
                    delete this.listeners[eventName];
                }
                break;
            }
        }
    }

    return this;
};

/**
 * Returns the `.listeners` member.
 * Allows to override the `.dispatch()` method notified listeners list.
 *
 * @returns {Object}
 */
EventDispatcher.prototype.getListeners = function()
{
    return this.listeners;
};

/**
 * Dispatch an event to listeners.
 *
 * @param {string} eventName - Event name to dispatch.
 * @param {mixed} [eventData] - Data given to listeners when they get called.
 *
 * @returns {EventDispatcher} This instance.
 * @throws {TypeError} Registered listener method is not found in context or is not a callable.
 */
EventDispatcher.prototype.dispatch = function(eventName, eventData)
{
    this.debug && this.logger({ type: 'dispatchBegin', event: eventName, data: eventData });

    var listeners = this.getListeners();

    listeners = listeners.hasOwnProperty(eventName) ? listeners[eventName] : null;

    if (listeners) {
        for (var i = 0; i < listeners.length; ++i) {
            if (typeof listeners[i].method === 'function') {
                this.debug && this.logger({ type: 'call', event: eventName, listener: listeners[i], data: eventData });
                listeners[i].method.call(listeners[i].context, eventData);
            } else if (typeof listeners[i].method === 'string') {
                if (typeof listeners[i].context[listeners[i].method] === 'function') {
                    this.debug && this.logger({ type: 'call', event: eventName, listener: listeners[i], data: eventData });
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

    this.debug && this.logger({ type: 'dispatchEnd', event: eventName, data: eventData });

    return this;
};

/**
 * Default logger for the `debug` mode. Logs to the console if `console.log()` is available.
 * You can attach your own logger here by setting `dispatcher.logger = function(event) { ... };`.
 *
 * @param {object} event - The message to display in the log.
 */
EventDispatcher.prototype.logger = (typeof console !== 'undefined' && console.log) ? function(event)
{
    var message;
    switch (event.type) {
        case 'addListener':     // type, event, listener
            message = 'Adding listener "' + event.listener.name + '" to listen for "' + event.event + '".';
            break;
        case 'removeListener':  // type, event, listener
            message = 'Removing listener "' + event.listener.name + '".';
            break;
        case 'dispatchBegin':   // type, event, data
            message = 'Dispatching "' + event.event + '".';
            ++this.logIndentLevel;
            break;
        case 'dispatchEnd':     // type, event, data
            message = 'Finished dispatching "' + event.event + '".';
            --this.logIndentLevel;
            break;
        case 'call':            // type, event, data, listener
            if (typeof event.listener.method === 'string') {
                message = 'Calling "' + event.listener.name + '" by string.';
            } else {
                message = 'Calling "' + event.listener.name + '" by reference.';
            }
            break;
        default:
            message = 'Unknow event.';
    }
    console.log('EventDispatcher: '
        + Array((event.type === 'dispatchBegin' ? this.logIndentLevel - 1 : this.logIndentLevel) + 1).join(this.logIndentText)
        + message);
} : function(){};

/** helper for _getListenerName() */
var functionNameFromString = /function ([^(]+)\W*\(/i;

/**
 * Tries to guess the name of the given listener in the format of `<context constructor name>#<method name>`.
 * Used when debug is enabled and the listener is not named already.
 *
 * When the `context` is:
 *  - not set, returns `<method name>`
 *  - anonymous or could not be guessed, returns `anonymous#<method name>`
 *
 * When the `method` is:
 *  - anonymous or could not be guessed, returns `<context constructor name>#anonymous(<n>)`
 *    where `n` is the number of anonymous functions already named by this method.
 *
 * When the given `method` is not found in the `context` the separator is `~` instead of the `#`.
 * This indicates that the method is implemented as a private member of the context.
 *
 * Limitations
 *  Function name may be guessed wrong if `method` is a `Function` type and is assigned to
 *  multiple properties/members of the `context` at the same time.
 *
 *  Example: function fx(){...} ctx={a:fx,b:fx}; dispatcher.addListener('evt', ctx, ctx.b);
 *  generated listener name will be `ctx#a` or `ctx#b` depending on the browser.
 *
 * @protected
 *
 * @param {Object|null} context - Context of the method.
 * @param {string|Function} method - Called function when an event matches.
 *
 * @returns {string} Hopefully usable listener name for debugging purposes.
 */
EventDispatcher.prototype._getListenerName = function(context, method)
{
    var method_name,
        method_matches,
        access_type = '',
        context_matches = context ? context.constructor.toString().match(functionNameFromString) : null,
        context_name = context_matches ? context_matches[1] : (context ? 'anonymous' : '');

    if (typeof method === 'string') {
        method_name = method;
        if (context_name) access_type = '#';
    } else if (context) {
        for (var p in context) {
            if (context[p] === method) {
                method_name = p;
                if (context_name) access_type = '#';
                break;
            }
        }
        if (!method_name) {
            if (method_matches = method.toString().match(functionNameFromString)) {
                method_name = method_matches[1];
                access_type = '~';
            } else {
                if (!this._LNAI) this._LNAI = 1;
                method_name = 'anonymous(' + (this._LNAI++) + ')';
            }
        }
    } else if (typeof method === 'function' && (method_matches = method.toString().match(functionNameFromString))) {
        method_name = method_matches[1];
    } else {
        if (!this._LNAI) this._LNAI = 1;
        method_name = 'anonymous(' + (this._LNAI++) + ')';
    }

    return context_name + access_type + method_name;
};


module.exports = EventDispatcher;
