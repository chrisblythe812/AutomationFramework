/*  Prototype JavaScript framework, version 1.7
*  (c) 2005-2010 Sam Stephenson
*
*  Prototype is freely distributable under the terms of an MIT-style license.
*  For details, see the Prototype web site: http://www.prototypejs.org/
*
*--------------------------------------------------------------------------*/

var Prototype = {

    Version: '1.7',

    Browser: (function() {
        var ua = navigator.userAgent;
        var isOpera = Object.prototype.toString.call(window.opera) == '[object Opera]';
        return {
            IE: !!window.attachEvent && !isOpera,
            Opera: isOpera,
            WebKit: ua.indexOf('AppleWebKit/') > -1,
            Gecko: ua.indexOf('Gecko') > -1 && ua.indexOf('KHTML') === -1,
            MobileSafari: /Apple.*Mobile/.test(ua)
        }
    })(),

    BrowserFeatures: {
        XPath: !!document.evaluate,

        SelectorsAPI: !!document.querySelector,

        ElementExtensions: (function() {
            var constructor = window.Element || window.HTMLElement;
            return !!(constructor && constructor.prototype);
        })(),
        SpecificElementExtensions: (function() {
            if (typeof window.HTMLDivElement !== 'undefined')
                return true;

            var div = document.createElement('div'),
          form = document.createElement('form'),
          isSupported = false;

            if (div['__proto__'] && (div['__proto__'] !== form['__proto__'])) {
                isSupported = true;
            }

            div = form = null;

            return isSupported;
        })()
    },

    ScriptFragment: '<script[^>]*>([\\S\\s]*?)<\/script>',
    JSONFilter: /^\/\*-secure-([\s\S]*)\*\/\s*$/,

    emptyFunction: function() { },

    K: function(x) { return x }
};

if (Prototype.Browser.MobileSafari)
    Prototype.BrowserFeatures.SpecificElementExtensions = false;


var Abstract = {};


var Try = {
    these: function() {
        var returnValue;

        for (var i = 0, length = arguments.length; i < length; i++) {
            var lambda = arguments[i];
            try {
                returnValue = lambda();
                break;
            } catch (e) { }
        }

        return returnValue;
    }
};

/* Based on Alex Arnell's inheritance implementation. */

var Class = (function() {

    var IS_DONTENUM_BUGGY = (function() {
        for (var p in { toString: 1 }) {
            if (p === 'toString') return false;
        }
        return true;
    })();

    function subclass() { };
    function create() {
        var parent = null, properties = $A(arguments);
        if (Object.isFunction(properties[0]))
            parent = properties.shift();

        function klass() {
            this.initialize.apply(this, arguments);
        }

        Object.extend(klass, Class.Methods);
        klass.superclass = parent;
        klass.subclasses = [];

        if (parent) {
            subclass.prototype = parent.prototype;
            klass.prototype = new subclass;
            parent.subclasses.push(klass);
        }

        for (var i = 0, length = properties.length; i < length; i++)
            klass.addMethods(properties[i]);

        if (!klass.prototype.initialize)
            klass.prototype.initialize = Prototype.emptyFunction;

        klass.prototype.constructor = klass;
        return klass;
    }

    function addMethods(source) {
        var ancestor = this.superclass && this.superclass.prototype,
        properties = Object.keys(source);

        if (IS_DONTENUM_BUGGY) {
            if (source.toString != Object.prototype.toString)
                properties.push("toString");
            if (source.valueOf != Object.prototype.valueOf)
                properties.push("valueOf");
        }

        for (var i = 0, length = properties.length; i < length; i++) {
            var property = properties[i], value = source[property];
            if (ancestor && Object.isFunction(value) &&
          value.argumentNames()[0] == "$super") {
                var method = value;
                value = (function(m) {
                    return function() { return ancestor[m].apply(this, arguments); };
                })(property).wrap(method);

                value.valueOf = method.valueOf.bind(method);
                value.toString = method.toString.bind(method);
            }
            this.prototype[property] = value;
        }

        return this;
    }

    return {
        create: create,
        Methods: {
            addMethods: addMethods
        }
    };
})();
(function() {

    var _toString = Object.prototype.toString,
      NULL_TYPE = 'Null',
      UNDEFINED_TYPE = 'Undefined',
      BOOLEAN_TYPE = 'Boolean',
      NUMBER_TYPE = 'Number',
      STRING_TYPE = 'String',
      OBJECT_TYPE = 'Object',
      FUNCTION_CLASS = '[object Function]',
      BOOLEAN_CLASS = '[object Boolean]',
      NUMBER_CLASS = '[object Number]',
      STRING_CLASS = '[object String]',
      ARRAY_CLASS = '[object Array]',
      DATE_CLASS = '[object Date]',
      NATIVE_JSON_STRINGIFY_SUPPORT = window.JSON &&
        typeof JSON.stringify === 'function' &&
        JSON.stringify(0) === '0' &&
        typeof JSON.stringify(Prototype.K) === 'undefined';

    function Type(o) {
        switch (o) {
            case null: return NULL_TYPE;
            case (void 0): return UNDEFINED_TYPE;
        }
        var type = typeof o;
        switch (type) {
            case 'boolean': return BOOLEAN_TYPE;
            case 'number': return NUMBER_TYPE;
            case 'string': return STRING_TYPE;
        }
        return OBJECT_TYPE;
    }

    function extend(destination, source) {
        for (var property in source)
            destination[property] = source[property];
        return destination;
    }

    function inspect(object) {
        try {
            if (isUndefined(object)) return 'undefined';
            if (object === null) return 'null';
            return object.inspect ? object.inspect() : String(object);
        } catch (e) {
            if (e instanceof RangeError) return '...';
            throw e;
        }
    }

    function toJSON(value) {
        return Str('', { '': value }, []);
    }

    function Str(key, holder, stack) {
        var value = holder[key],
        type = typeof value;

        if (Type(value) === OBJECT_TYPE && typeof value.toJSON === 'function') {
            value = value.toJSON(key);
        }

        var _class = _toString.call(value);

        switch (_class) {
            case NUMBER_CLASS:
            case BOOLEAN_CLASS:
            case STRING_CLASS:
                value = value.valueOf();
        }

        switch (value) {
            case null: return 'null';
            case true: return 'true';
            case false: return 'false';
        }

        type = typeof value;
        switch (type) {
            case 'string':
                return value.inspect(true);
            case 'number':
                return isFinite(value) ? String(value) : 'null';
            case 'object':

                for (var i = 0, length = stack.length; i < length; i++) {
                    if (stack[i] === value) { throw new TypeError(); }
                }
                stack.push(value);

                var partial = [];
                if (_class === ARRAY_CLASS) {
                    for (var i = 0, length = value.length; i < length; i++) {
                        var str = Str(i, value, stack);
                        partial.push(typeof str === 'undefined' ? 'null' : str);
                    }
                    partial = '[' + partial.join(',') + ']';
                } else {
                    var keys = Object.keys(value);
                    for (var i = 0, length = keys.length; i < length; i++) {
                        var key = keys[i], str = Str(key, value, stack);
                        if (typeof str !== "undefined") {
                            partial.push(key.inspect(true) + ':' + str);
                        }
                    }
                    partial = '{' + partial.join(',') + '}';
                }
                stack.pop();
                return partial;
        }
    }

    function stringify(object) {
        return JSON.stringify(object);
    }

    function toQueryString(object) {
        return $H(object).toQueryString();
    }

    function toHTML(object) {
        return object && object.toHTML ? object.toHTML() : String.interpret(object);
    }

    function keys(object) {
        if (Type(object) !== OBJECT_TYPE) { throw new TypeError(); }
        var results = [];
        for (var property in object) {
            if (object.hasOwnProperty(property)) {
                results.push(property);
            }
        }
        return results;
    }

    function values(object) {
        var results = [];
        for (var property in object)
            results.push(object[property]);
        return results;
    }

    function clone(object) {
        return extend({}, object);
    }

    function isElement(object) {
        return !!(object && object.nodeType == 1);
    }

    function isArray(object) {
        return _toString.call(object) === ARRAY_CLASS;
    }

    var hasNativeIsArray = (typeof Array.isArray == 'function')
    && Array.isArray([]) && !Array.isArray({});

    if (hasNativeIsArray) {
        isArray = Array.isArray;
    }

    function isHash(object) {
        return object instanceof Hash;
    }

    function isFunction(object) {
        return _toString.call(object) === FUNCTION_CLASS;
    }

    function isString(object) {
        return _toString.call(object) === STRING_CLASS;
    }

    function isNumber(object) {
        return _toString.call(object) === NUMBER_CLASS;
    }

    function isDate(object) {
        return _toString.call(object) === DATE_CLASS;
    }

    function isUndefined(object) {
        return typeof object === "undefined";
    }

    extend(Object, {
        extend: extend,
        inspect: inspect,
        toJSON: NATIVE_JSON_STRINGIFY_SUPPORT ? stringify : toJSON,
        toQueryString: toQueryString,
        toHTML: toHTML,
        keys: Object.keys || keys,
        values: values,
        clone: clone,
        isElement: isElement,
        isArray: isArray,
        isHash: isHash,
        isFunction: isFunction,
        isString: isString,
        isNumber: isNumber,
        isDate: isDate,
        isUndefined: isUndefined
    });
})();
Object.extend(Function.prototype, (function() {
    var slice = Array.prototype.slice;

    function update(array, args) {
        var arrayLength = array.length, length = args.length;
        while (length--) array[arrayLength + length] = args[length];
        return array;
    }

    function merge(array, args) {
        array = slice.call(array, 0);
        return update(array, args);
    }

    function argumentNames() {
        var names = this.toString().match(/^[\s\(]*function[^(]*\(([^)]*)\)/)[1]
      .replace(/\/\/.*?[\r\n]|\/\*(?:.|[\r\n])*?\*\//g, '')
      .replace(/\s+/g, '').split(',');
        return names.length == 1 && !names[0] ? [] : names;
    }

    function bind(context) {
        if (arguments.length < 2 && Object.isUndefined(arguments[0])) return this;
        var __method = this, args = slice.call(arguments, 1);
        return function() {
            var a = merge(args, arguments);
            return __method.apply(context, a);
        }
    }

    function bindAsEventListener(context) {
        var __method = this, args = slice.call(arguments, 1);
        return function(event) {
            var a = update([event || window.event], args);
            return __method.apply(context, a);
        }
    }

    function curry() {
        if (!arguments.length) return this;
        var __method = this, args = slice.call(arguments, 0);
        return function() {
            var a = merge(args, arguments);
            return __method.apply(this, a);
        }
    }

    function delay(timeout) {
        var __method = this, args = slice.call(arguments, 1);
        timeout = timeout * 1000;
        return window.setTimeout(function() {
            return __method.apply(__method, args);
        }, timeout);
    }

    function defer() {
        var args = update([0.01], arguments);
        return this.delay.apply(this, args);
    }

    function wrap(wrapper) {
        var __method = this;
        return function() {
            var a = update([__method.bind(this)], arguments);
            return wrapper.apply(this, a);
        }
    }

    function methodize() {
        if (this._methodized) return this._methodized;
        var __method = this;
        return this._methodized = function() {
            var a = update([this], arguments);
            return __method.apply(null, a);
        };
    }

    return {
        argumentNames: argumentNames,
        bind: bind,
        bindAsEventListener: bindAsEventListener,
        curry: curry,
        delay: delay,
        defer: defer,
        wrap: wrap,
        methodize: methodize
    }
})());



(function(proto) {


    function toISOString() {
        return this.getUTCFullYear() + '-' +
      (this.getUTCMonth() + 1).toPaddedString(2) + '-' +
      this.getUTCDate().toPaddedString(2) + 'T' +
      this.getUTCHours().toPaddedString(2) + ':' +
      this.getUTCMinutes().toPaddedString(2) + ':' +
      this.getUTCSeconds().toPaddedString(2) + 'Z';
    }


    function toJSON() {
        return this.toISOString();
    }

    if (!proto.toISOString) proto.toISOString = toISOString;
    if (!proto.toJSON) proto.toJSON = toJSON;

})(Date.prototype);


RegExp.prototype.match = RegExp.prototype.test;

RegExp.escape = function(str) {
    return String(str).replace(/([.*+?^=!:${}()|[\]\/\\])/g, '\\$1');
};
var PeriodicalExecuter = Class.create({
    initialize: function(callback, frequency) {
        this.callback = callback;
        this.frequency = frequency;
        this.currentlyExecuting = false;

        this.registerCallback();
    },

    registerCallback: function() {
        this.timer = setInterval(this.onTimerEvent.bind(this), this.frequency * 1000);
    },

    execute: function() {
        this.callback(this);
    },

    stop: function() {
        if (!this.timer) return;
        clearInterval(this.timer);
        this.timer = null;
    },

    onTimerEvent: function() {
        if (!this.currentlyExecuting) {
            try {
                this.currentlyExecuting = true;
                this.execute();
                this.currentlyExecuting = false;
            } catch (e) {
                this.currentlyExecuting = false;
                throw e;
            }
        }
    }
});
Object.extend(String, {
    interpret: function(value) {
        return value == null ? '' : String(value);
    },
    specialChar: {
        '\b': '\\b',
        '\t': '\\t',
        '\n': '\\n',
        '\f': '\\f',
        '\r': '\\r',
        '\\': '\\\\'
    }
});

Object.extend(String.prototype, (function() {
    var NATIVE_JSON_PARSE_SUPPORT = window.JSON &&
    typeof JSON.parse === 'function' &&
    JSON.parse('{"test": true}').test;

    function prepareReplacement(replacement) {
        if (Object.isFunction(replacement)) return replacement;
        var template = new Template(replacement);
        return function(match) { return template.evaluate(match) };
    }

    function gsub(pattern, replacement) {
        var result = '', source = this, match;
        replacement = prepareReplacement(replacement);

        if (Object.isString(pattern))
            pattern = RegExp.escape(pattern);

        if (!(pattern.length || pattern.source)) {
            replacement = replacement('');
            return replacement + source.split('').join(replacement) + replacement;
        }

        while (source.length > 0) {
            if (match = source.match(pattern)) {
                result += source.slice(0, match.index);
                result += String.interpret(replacement(match));
                source = source.slice(match.index + match[0].length);
            } else {
                result += source, source = '';
            }
        }
        return result;
    }

    function sub(pattern, replacement, count) {
        replacement = prepareReplacement(replacement);
        count = Object.isUndefined(count) ? 1 : count;

        return this.gsub(pattern, function(match) {
            if (--count < 0) return match[0];
            return replacement(match);
        });
    }

    function scan(pattern, iterator) {
        this.gsub(pattern, iterator);
        return String(this);
    }

    function truncate(length, truncation) {
        length = length || 30;
        truncation = Object.isUndefined(truncation) ? '...' : truncation;
        return this.length > length ?
      this.slice(0, length - truncation.length) + truncation : String(this);
    }

    function strip() {
        return this.replace(/^\s+/, '').replace(/\s+$/, '');
    }

    function stripTags() {
        return this.replace(/<\w+(\s+("[^"]*"|'[^']*'|[^>])+)?>|<\/\w+>/gi, '');
    }

    function stripScripts() {
        return this.replace(new RegExp(Prototype.ScriptFragment, 'img'), '');
    }

    function extractScripts() {
        var matchAll = new RegExp(Prototype.ScriptFragment, 'img'),
        matchOne = new RegExp(Prototype.ScriptFragment, 'im');
        return (this.match(matchAll) || []).map(function(scriptTag) {
            return (scriptTag.match(matchOne) || ['', ''])[1];
        });
    }

    function evalScripts() {
        return this.extractScripts().map(function(script) { return eval(script) });
    }

    function escapeHTML() {
        return this.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    function unescapeHTML() {
        return this.stripTags().replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
    }


    function toQueryParams(separator) {
        var match = this.strip().match(/([^?#]*)(#.*)?$/);
        if (!match) return {};

        return match[1].split(separator || '&').inject({}, function(hash, pair) {
            if ((pair = pair.split('='))[0]) {
                var key = decodeURIComponent(pair.shift()),
            value = pair.length > 1 ? pair.join('=') : pair[0];

                if (value != undefined) value = decodeURIComponent(value);

                if (key in hash) {
                    if (!Object.isArray(hash[key])) hash[key] = [hash[key]];
                    hash[key].push(value);
                }
                else hash[key] = value;
            }
            return hash;
        });
    }

    function toArray() {
        return this.split('');
    }

    function succ() {
        return this.slice(0, this.length - 1) +
      String.fromCharCode(this.charCodeAt(this.length - 1) + 1);
    }

    function times(count) {
        return count < 1 ? '' : new Array(count + 1).join(this);
    }

    function camelize() {
        return this.replace(/-+(.)?/g, function(match, chr) {
            return chr ? chr.toUpperCase() : '';
        });
    }

    function capitalize() {
        return this.charAt(0).toUpperCase() + this.substring(1).toLowerCase();
    }

    function underscore() {
        return this.replace(/::/g, '/')
               .replace(/([A-Z]+)([A-Z][a-z])/g, '$1_$2')
               .replace(/([a-z\d])([A-Z])/g, '$1_$2')
               .replace(/-/g, '_')
               .toLowerCase();
    }

    function dasherize() {
        return this.replace(/_/g, '-');
    }

    function inspect(useDoubleQuotes) {
        var escapedString = this.replace(/[\x00-\x1f\\]/g, function(character) {
            if (character in String.specialChar) {
                return String.specialChar[character];
            }
            return '\\u00' + character.charCodeAt().toPaddedString(2, 16);
        });
        if (useDoubleQuotes) return '"' + escapedString.replace(/"/g, '\\"') + '"';
        return "'" + escapedString.replace(/'/g, '\\\'') + "'";
    }

    function unfilterJSON(filter) {
        return this.replace(filter || Prototype.JSONFilter, '$1');
    }

    function isJSON() {
        var str = this;
        if (str.blank()) return false;
        str = str.replace(/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g, '@');
        str = str.replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, ']');
        str = str.replace(/(?:^|:|,)(?:\s*\[)+/g, '');
        return (/^[\],:{}\s]*$/).test(str);
    }

    function evalJSON(sanitize) {
        var json = this.unfilterJSON(),
        cx = /[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g;
        if (cx.test(json)) {
            json = json.replace(cx, function(a) {
                return '\\u' + ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
            });
        }
        try {
            if (!sanitize || json.isJSON()) return eval('(' + json + ')');
        } catch (e) { }
        throw new SyntaxError('Badly formed JSON string: ' + this.inspect());
    }

    function parseJSON() {
        var json = this.unfilterJSON();
        return JSON.parse(json);
    }

    function include(pattern) {
        return this.indexOf(pattern) > -1;
    }

    function startsWith(pattern) {
        return this.lastIndexOf(pattern, 0) === 0;
    }

    function endsWith(pattern) {
        var d = this.length - pattern.length;
        return d >= 0 && this.indexOf(pattern, d) === d;
    }

    function empty() {
        return this == '';
    }

    function blank() {
        return /^\s*$/.test(this);
    }

    function interpolate(object, pattern) {
        return new Template(this, pattern).evaluate(object);
    }

    return {
        gsub: gsub,
        sub: sub,
        scan: scan,
        truncate: truncate,
        strip: String.prototype.trim || strip,
        stripTags: stripTags,
        stripScripts: stripScripts,
        extractScripts: extractScripts,
        evalScripts: evalScripts,
        escapeHTML: escapeHTML,
        unescapeHTML: unescapeHTML,
        toQueryParams: toQueryParams,
        parseQuery: toQueryParams,
        toArray: toArray,
        succ: succ,
        times: times,
        camelize: camelize,
        capitalize: capitalize,
        underscore: underscore,
        dasherize: dasherize,
        inspect: inspect,
        unfilterJSON: unfilterJSON,
        isJSON: isJSON,
        evalJSON: NATIVE_JSON_PARSE_SUPPORT ? parseJSON : evalJSON,
        include: include,
        startsWith: startsWith,
        endsWith: endsWith,
        empty: empty,
        blank: blank,
        interpolate: interpolate
    };
})());

var Template = Class.create({
    initialize: function(template, pattern) {
        this.template = template.toString();
        this.pattern = pattern || Template.Pattern;
    },

    evaluate: function(object) {
        if (object && Object.isFunction(object.toTemplateReplacements))
            object = object.toTemplateReplacements();

        return this.template.gsub(this.pattern, function(match) {
            if (object == null) return (match[1] + '');

            var before = match[1] || '';
            if (before == '\\') return match[2];

            var ctx = object, expr = match[3],
          pattern = /^([^.[]+|\[((?:.*?[^\\])?)\])(\.|\[|$)/;

            match = pattern.exec(expr);
            if (match == null) return before;

            while (match != null) {
                var comp = match[1].startsWith('[') ? match[2].replace(/\\\\]/g, ']') : match[1];
                ctx = ctx[comp];
                if (null == ctx || '' == match[3]) break;
                expr = expr.substring('[' == match[3] ? match[1].length : match[0].length);
                match = pattern.exec(expr);
            }

            return before + String.interpret(ctx);
        });
    }
});
Template.Pattern = /(^|.|\r|\n)(#\{(.*?)\})/;

var $break = {};

var Enumerable = (function() {
    function each(iterator, context) {
        var index = 0;
        try {
            this._each(function(value) {
                iterator.call(context, value, index++);
            });
        } catch (e) {
            if (e != $break) throw e;
        }
        return this;
    }

    function eachSlice(number, iterator, context) {
        var index = -number, slices = [], array = this.toArray();
        if (number < 1) return array;
        while ((index += number) < array.length)
            slices.push(array.slice(index, index + number));
        return slices.collect(iterator, context);
    }

    function all(iterator, context) {
        iterator = iterator || Prototype.K;
        var result = true;
        this.each(function(value, index) {
            result = result && !!iterator.call(context, value, index);
            if (!result) throw $break;
        });
        return result;
    }

    function any(iterator, context) {
        iterator = iterator || Prototype.K;
        var result = false;
        this.each(function(value, index) {
            if (result = !!iterator.call(context, value, index))
                throw $break;
        });
        return result;
    }

    function collect(iterator, context) {
        iterator = iterator || Prototype.K;
        var results = [];
        this.each(function(value, index) {
            results.push(iterator.call(context, value, index));
        });
        return results;
    }

    function detect(iterator, context) {
        var result;
        this.each(function(value, index) {
            if (iterator.call(context, value, index)) {
                result = value;
                throw $break;
            }
        });
        return result;
    }

    function findAll(iterator, context) {
        var results = [];
        this.each(function(value, index) {
            if (iterator.call(context, value, index))
                results.push(value);
        });
        return results;
    }

    function grep(filter, iterator, context) {
        iterator = iterator || Prototype.K;
        var results = [];

        if (Object.isString(filter))
            filter = new RegExp(RegExp.escape(filter));

        this.each(function(value, index) {
            if (filter.match(value))
                results.push(iterator.call(context, value, index));
        });
        return results;
    }

    function include(object) {
        if (Object.isFunction(this.indexOf))
            if (this.indexOf(object) != -1) return true;

        var found = false;
        this.each(function(value) {
            if (value == object) {
                found = true;
                throw $break;
            }
        });
        return found;
    }

    function inGroupsOf(number, fillWith) {
        fillWith = Object.isUndefined(fillWith) ? null : fillWith;
        return this.eachSlice(number, function(slice) {
            while (slice.length < number) slice.push(fillWith);
            return slice;
        });
    }

    function inject(memo, iterator, context) {
        this.each(function(value, index) {
            memo = iterator.call(context, memo, value, index);
        });
        return memo;
    }

    function invoke(method) {
        var args = $A(arguments).slice(1);
        return this.map(function(value) {
            return value[method].apply(value, args);
        });
    }

    function max(iterator, context) {
        iterator = iterator || Prototype.K;
        var result;
        this.each(function(value, index) {
            value = iterator.call(context, value, index);
            if (result == null || value >= result)
                result = value;
        });
        return result;
    }

    function min(iterator, context) {
        iterator = iterator || Prototype.K;
        var result;
        this.each(function(value, index) {
            value = iterator.call(context, value, index);
            if (result == null || value < result)
                result = value;
        });
        return result;
    }

    function partition(iterator, context) {
        iterator = iterator || Prototype.K;
        var trues = [], falses = [];
        this.each(function(value, index) {
            (iterator.call(context, value, index) ?
        trues : falses).push(value);
        });
        return [trues, falses];
    }

    function pluck(property) {
        var results = [];
        this.each(function(value) {
            results.push(value[property]);
        });
        return results;
    }

    function reject(iterator, context) {
        var results = [];
        this.each(function(value, index) {
            if (!iterator.call(context, value, index))
                results.push(value);
        });
        return results;
    }

    function sortBy(iterator, context) {
        return this.map(function(value, index) {
            return {
                value: value,
                criteria: iterator.call(context, value, index)
            };
        }).sort(function(left, right) {
            var a = left.criteria, b = right.criteria;
            return a < b ? -1 : a > b ? 1 : 0;
        }).pluck('value');
    }

    function toArray() {
        return this.map();
    }

    function zip() {
        var iterator = Prototype.K, args = $A(arguments);
        if (Object.isFunction(args.last()))
            iterator = args.pop();

        var collections = [this].concat(args).map($A);
        return this.map(function(value, index) {
            return iterator(collections.pluck(index));
        });
    }

    function size() {
        return this.toArray().length;
    }

    function inspect() {
        return '#<Enumerable:' + this.toArray().inspect() + '>';
    }









    return {
        each: each,
        eachSlice: eachSlice,
        all: all,
        every: all,
        any: any,
        some: any,
        collect: collect,
        map: collect,
        detect: detect,
        findAll: findAll,
        select: findAll,
        filter: findAll,
        grep: grep,
        include: include,
        member: include,
        inGroupsOf: inGroupsOf,
        inject: inject,
        invoke: invoke,
        max: max,
        min: min,
        partition: partition,
        pluck: pluck,
        reject: reject,
        sortBy: sortBy,
        toArray: toArray,
        entries: toArray,
        zip: zip,
        size: size,
        inspect: inspect,
        find: detect
    };
})();

function $A(iterable) {
    if (!iterable) return [];
    if ('toArray' in Object(iterable)) return iterable.toArray();
    var length = iterable.length || 0, results = new Array(length);
    while (length--) results[length] = iterable[length];
    return results;
}


function $w(string) {
    if (!Object.isString(string)) return [];
    string = string.strip();
    return string ? string.split(/\s+/) : [];
}

Array.from = $A;


(function() {
    var arrayProto = Array.prototype,
      slice = arrayProto.slice,
      _each = arrayProto.forEach; // use native browser JS 1.6 implementation if available

    function each(iterator, context) {
        for (var i = 0, length = this.length >>> 0; i < length; i++) {
            if (i in this) iterator.call(context, this[i], i, this);
        }
    }
    if (!_each) _each = each;

    function clear() {
        this.length = 0;
        return this;
    }

    function first() {
        return this[0];
    }

    function last() {
        return this[this.length - 1];
    }

    function compact() {
        return this.select(function(value) {
            return value != null;
        });
    }

    function flatten() {
        return this.inject([], function(array, value) {
            if (Object.isArray(value))
                return array.concat(value.flatten());
            array.push(value);
            return array;
        });
    }

    function without() {
        var values = slice.call(arguments, 0);
        return this.select(function(value) {
            return !values.include(value);
        });
    }

    function reverse(inline) {
        return (inline === false ? this.toArray() : this)._reverse();
    }

    function uniq(sorted) {
        return this.inject([], function(array, value, index) {
            if (0 == index || (sorted ? array.last() != value : !array.include(value)))
                array.push(value);
            return array;
        });
    }

    function intersect(array) {
        return this.uniq().findAll(function(item) {
            return array.detect(function(value) { return item === value });
        });
    }


    function clone() {
        return slice.call(this, 0);
    }

    function size() {
        return this.length;
    }

    function inspect() {
        return '[' + this.map(Object.inspect).join(', ') + ']';
    }

    function indexOf(item, i) {
        i || (i = 0);
        var length = this.length;
        if (i < 0) i = length + i;
        for (; i < length; i++)
            if (this[i] === item) return i;
        return -1;
    }

    function lastIndexOf(item, i) {
        i = isNaN(i) ? this.length : (i < 0 ? this.length + i : i) + 1;
        var n = this.slice(0, i).reverse().indexOf(item);
        return (n < 0) ? n : i - n - 1;
    }

    function concat() {
        var array = slice.call(this, 0), item;
        for (var i = 0, length = arguments.length; i < length; i++) {
            item = arguments[i];
            if (Object.isArray(item) && !('callee' in item)) {
                for (var j = 0, arrayLength = item.length; j < arrayLength; j++)
                    array.push(item[j]);
            } else {
                array.push(item);
            }
        }
        return array;
    }

    Object.extend(arrayProto, Enumerable);

    if (!arrayProto._reverse)
        arrayProto._reverse = arrayProto.reverse;

    Object.extend(arrayProto, {
        _each: _each,
        clear: clear,
        first: first,
        last: last,
        compact: compact,
        flatten: flatten,
        without: without,
        reverse: reverse,
        uniq: uniq,
        intersect: intersect,
        clone: clone,
        toArray: clone,
        size: size,
        inspect: inspect
    });

    var CONCAT_ARGUMENTS_BUGGY = (function() {
        return [].concat(arguments)[0][0] !== 1;
    })(1, 2)

    if (CONCAT_ARGUMENTS_BUGGY) arrayProto.concat = concat;

    if (!arrayProto.indexOf) arrayProto.indexOf = indexOf;
    if (!arrayProto.lastIndexOf) arrayProto.lastIndexOf = lastIndexOf;
})();
function $H(object) {
    return new Hash(object);
};

var Hash = Class.create(Enumerable, (function() {
    function initialize(object) {
        this._object = Object.isHash(object) ? object.toObject() : Object.clone(object);
    }


    function _each(iterator) {
        for (var key in this._object) {
            var value = this._object[key], pair = [key, value];
            pair.key = key;
            pair.value = value;
            iterator(pair);
        }
    }

    function set(key, value) {
        return this._object[key] = value;
    }

    function get(key) {
        if (this._object[key] !== Object.prototype[key])
            return this._object[key];
    }

    function unset(key) {
        var value = this._object[key];
        delete this._object[key];
        return value;
    }

    function toObject() {
        return Object.clone(this._object);
    }



    function keys() {
        return this.pluck('key');
    }

    function values() {
        return this.pluck('value');
    }

    function index(value) {
        var match = this.detect(function(pair) {
            return pair.value === value;
        });
        return match && match.key;
    }

    function merge(object) {
        return this.clone().update(object);
    }

    function update(object) {
        return new Hash(object).inject(this, function(result, pair) {
            result.set(pair.key, pair.value);
            return result;
        });
    }

    function toQueryPair(key, value) {
        if (Object.isUndefined(value)) return key;
        return key + '=' + encodeURIComponent(String.interpret(value));
    }

    function toQueryString() {
        return this.inject([], function(results, pair) {
            var key = encodeURIComponent(pair.key), values = pair.value;

            if (values && typeof values == 'object') {
                if (Object.isArray(values)) {
                    var queryValues = [];
                    for (var i = 0, len = values.length, value; i < len; i++) {
                        value = values[i];
                        queryValues.push(toQueryPair(key, value));
                    }
                    return results.concat(queryValues);
                }
            } else results.push(toQueryPair(key, values));
            return results;
        }).join('&');
    }

    function inspect() {
        return '#<Hash:{' + this.map(function(pair) {
            return pair.map(Object.inspect).join(': ');
        }).join(', ') + '}>';
    }

    function clone() {
        return new Hash(this);
    }

    return {
        initialize: initialize,
        _each: _each,
        set: set,
        get: get,
        unset: unset,
        toObject: toObject,
        toTemplateReplacements: toObject,
        keys: keys,
        values: values,
        index: index,
        merge: merge,
        update: update,
        toQueryString: toQueryString,
        inspect: inspect,
        toJSON: toObject,
        clone: clone
    };
})());

Hash.from = $H;
Object.extend(Number.prototype, (function() {
    function toColorPart() {
        return this.toPaddedString(2, 16);
    }

    function succ() {
        return this + 1;
    }

    function times(iterator, context) {
        $R(0, this, true).each(iterator, context);
        return this;
    }

    function toPaddedString(length, radix) {
        var string = this.toString(radix || 10);
        return '0'.times(length - string.length) + string;
    }

    function abs() {
        return Math.abs(this);
    }

    function round() {
        return Math.round(this);
    }

    function ceil() {
        return Math.ceil(this);
    }

    function floor() {
        return Math.floor(this);
    }

    return {
        toColorPart: toColorPart,
        succ: succ,
        times: times,
        toPaddedString: toPaddedString,
        abs: abs,
        round: round,
        ceil: ceil,
        floor: floor
    };
})());

function $R(start, end, exclusive) {
    return new ObjectRange(start, end, exclusive);
}

var ObjectRange = Class.create(Enumerable, (function() {
    function initialize(start, end, exclusive) {
        this.start = start;
        this.end = end;
        this.exclusive = exclusive;
    }

    function _each(iterator) {
        var value = this.start;
        while (this.include(value)) {
            iterator(value);
            value = value.succ();
        }
    }

    function include(value) {
        if (value < this.start)
            return false;
        if (this.exclusive)
            return value < this.end;
        return value <= this.end;
    }

    return {
        initialize: initialize,
        _each: _each,
        include: include
    };
})());



var Ajax = {
    getTransport: function() {
        return Try.these(
      function() { return new XMLHttpRequest() },
      function() { return new ActiveXObject('Msxml2.XMLHTTP') },
      function() { return new ActiveXObject('Microsoft.XMLHTTP') }
    ) || false;
    },

    activeRequestCount: 0
};

Ajax.Responders = {
    responders: [],

    _each: function(iterator) {
        this.responders._each(iterator);
    },

    register: function(responder) {
        if (!this.include(responder))
            this.responders.push(responder);
    },

    unregister: function(responder) {
        this.responders = this.responders.without(responder);
    },

    dispatch: function(callback, request, transport, json) {
        this.each(function(responder) {
            if (Object.isFunction(responder[callback])) {
                try {
                    responder[callback].apply(responder, [request, transport, json]);
                } catch (e) { }
            }
        });
    }
};

Object.extend(Ajax.Responders, Enumerable);

Ajax.Responders.register({
    onCreate: function() { Ajax.activeRequestCount++ },
    onComplete: function() { Ajax.activeRequestCount-- }
});
Ajax.Base = Class.create({
    initialize: function(options) {
        this.options = {
            method: 'post',
            asynchronous: true,
            contentType: 'application/x-www-form-urlencoded',
            encoding: 'UTF-8',
            parameters: '',
            evalJSON: true,
            evalJS: true
        };
        Object.extend(this.options, options || {});

        this.options.method = this.options.method.toLowerCase();

        if (Object.isHash(this.options.parameters))
            this.options.parameters = this.options.parameters.toObject();
    }
});
Ajax.Request = Class.create(Ajax.Base, {
    _complete: false,

    initialize: function($super, url, options) {
        $super(options);
        this.transport = Ajax.getTransport();
        this.request(url);
    },

    request: function(url) {
        this.url = url;
        this.method = this.options.method;
        var params = Object.isString(this.options.parameters) ?
          this.options.parameters :
          Object.toQueryString(this.options.parameters);

        if (!['get', 'post'].include(this.method)) {
            params += (params ? '&' : '') + "_method=" + this.method;
            this.method = 'post';
        }

        if (params && this.method === 'get') {
            this.url += (this.url.include('?') ? '&' : '?') + params;
        }

        this.parameters = params.toQueryParams();

        try {
            var response = new Ajax.Response(this);
            if (this.options.onCreate) this.options.onCreate(response);
            Ajax.Responders.dispatch('onCreate', this, response);

            this.transport.open(this.method.toUpperCase(), this.url,
        this.options.asynchronous);

            if (this.options.asynchronous) this.respondToReadyState.bind(this).defer(1);

            this.transport.onreadystatechange = this.onStateChange.bind(this);
            this.setRequestHeaders();

            this.body = this.method == 'post' ? (this.options.postBody || params) : null;
            this.transport.send(this.body);

            /* Force Firefox to handle ready state 4 for synchronous requests */
            if (!this.options.asynchronous && this.transport.overrideMimeType)
                this.onStateChange();

        }
        catch (e) {
            this.dispatchException(e);
        }
    },

    onStateChange: function() {
        var readyState = this.transport.readyState;
        if (readyState > 1 && !((readyState == 4) && this._complete))
            this.respondToReadyState(this.transport.readyState);
    },

    setRequestHeaders: function() {
        var headers = {
            'X-Requested-With': 'XMLHttpRequest',
            'X-Prototype-Version': Prototype.Version,
            'Accept': 'text/javascript, text/html, application/xml, text/xml, */*'
        };

        if (this.method == 'post') {
            headers['Content-type'] = this.options.contentType +
        (this.options.encoding ? '; charset=' + this.options.encoding : '');

            /* Force "Connection: close" for older Mozilla browsers to work
            * around a bug where XMLHttpRequest sends an incorrect
            * Content-length header. See Mozilla Bugzilla #246651.
            */
            if (this.transport.overrideMimeType &&
          (navigator.userAgent.match(/Gecko\/(\d{4})/) || [0, 2005])[1] < 2005)
                headers['Connection'] = 'close';
        }

        if (typeof this.options.requestHeaders == 'object') {
            var extras = this.options.requestHeaders;

            if (Object.isFunction(extras.push))
                for (var i = 0, length = extras.length; i < length; i += 2)
                headers[extras[i]] = extras[i + 1];
            else
                $H(extras).each(function(pair) { headers[pair.key] = pair.value });
        }

        for (var name in headers)
            this.transport.setRequestHeader(name, headers[name]);
    },

    success: function() {
        var status = this.getStatus();
        return !status || (status >= 200 && status < 300) || status == 304;
    },

    getStatus: function() {
        try {
            if (this.transport.status === 1223) return 204;
            return this.transport.status || 0;
        } catch (e) { return 0 }
    },

    respondToReadyState: function(readyState) {
        var state = Ajax.Request.Events[readyState], response = new Ajax.Response(this);

        if (state == 'Complete') {
            try {
                this._complete = true;
                (this.options['on' + response.status]
         || this.options['on' + (this.success() ? 'Success' : 'Failure')]
         || Prototype.emptyFunction)(response, response.headerJSON);
            } catch (e) {
                this.dispatchException(e);
            }

            var contentType = response.getHeader('Content-type');
            if (this.options.evalJS == 'force'
          || (this.options.evalJS && this.isSameOrigin() && contentType
          && contentType.match(/^\s*(text|application)\/(x-)?(java|ecma)script(;.*)?\s*$/i)))
                this.evalResponse();
        }

        try {
            (this.options['on' + state] || Prototype.emptyFunction)(response, response.headerJSON);
            Ajax.Responders.dispatch('on' + state, this, response, response.headerJSON);
        } catch (e) {
            this.dispatchException(e);
        }

        if (state == 'Complete') {
            this.transport.onreadystatechange = Prototype.emptyFunction;
        }
    },

    isSameOrigin: function() {
        var m = this.url.match(/^\s*https?:\/\/[^\/]*/);
        return !m || (m[0] == '#{protocol}//#{domain}#{port}'.interpolate({
            protocol: location.protocol,
            domain: document.domain,
            port: location.port ? ':' + location.port : ''
        }));
    },

    getHeader: function(name) {
        try {
            return this.transport.getResponseHeader(name) || null;
        } catch (e) { return null; }
    },

    evalResponse: function() {
        try {
            return eval((this.transport.responseText || '').unfilterJSON());
        } catch (e) {
            this.dispatchException(e);
        }
    },

    dispatchException: function(exception) {
        (this.options.onException || Prototype.emptyFunction)(this, exception);
        Ajax.Responders.dispatch('onException', this, exception);
    }
});

Ajax.Request.Events =
  ['Uninitialized', 'Loading', 'Loaded', 'Interactive', 'Complete'];








Ajax.Response = Class.create({
    initialize: function(request) {
        this.request = request;
        var transport = this.transport = request.transport,
        readyState = this.readyState = transport.readyState;

        if ((readyState > 2 && !Prototype.Browser.IE) || readyState == 4) {
            this.status = this.getStatus();
            this.statusText = this.getStatusText();
            this.responseText = String.interpret(transport.responseText);
            this.headerJSON = this._getHeaderJSON();
        }

        if (readyState == 4) {
            var xml = transport.responseXML;
            this.responseXML = Object.isUndefined(xml) ? null : xml;
            this.responseJSON = this._getResponseJSON();
        }
    },

    status: 0,

    statusText: '',

    getStatus: Ajax.Request.prototype.getStatus,

    getStatusText: function() {
        try {
            return this.transport.statusText || '';
        } catch (e) { return '' }
    },

    getHeader: Ajax.Request.prototype.getHeader,

    getAllHeaders: function() {
        try {
            return this.getAllResponseHeaders();
        } catch (e) { return null }
    },

    getResponseHeader: function(name) {
        return this.transport.getResponseHeader(name);
    },

    getAllResponseHeaders: function() {
        return this.transport.getAllResponseHeaders();
    },

    _getHeaderJSON: function() {
        var json = this.getHeader('X-JSON');
        if (!json) return null;
        json = decodeURIComponent(escape(json));
        try {
            return json.evalJSON(this.request.options.sanitizeJSON ||
        !this.request.isSameOrigin());
        } catch (e) {
            this.request.dispatchException(e);
        }
    },

    _getResponseJSON: function() {
        var options = this.request.options;
        if (!options.evalJSON || (options.evalJSON != 'force' &&
      !(this.getHeader('Content-type') || '').include('application/json')) ||
        this.responseText.blank())
            return null;
        try {
            return this.responseText.evalJSON(options.sanitizeJSON ||
        !this.request.isSameOrigin());
        } catch (e) {
            this.request.dispatchException(e);
        }
    }
});

Ajax.Updater = Class.create(Ajax.Request, {
    initialize: function($super, container, url, options) {
        this.container = {
            success: (container.success || container),
            failure: (container.failure || (container.success ? null : container))
        };

        options = Object.clone(options);
        var onComplete = options.onComplete;
        options.onComplete = (function(response, json) {
            this.updateContent(response.responseText);
            if (Object.isFunction(onComplete)) onComplete(response, json);
        }).bind(this);

        $super(url, options);
    },

    updateContent: function(responseText) {
        var receiver = this.container[this.success() ? 'success' : 'failure'],
        options = this.options;

        if (!options.evalScripts) responseText = responseText.stripScripts();

        if (receiver = $(receiver)) {
            if (options.insertion) {
                if (Object.isString(options.insertion)) {
                    var insertion = {}; insertion[options.insertion] = responseText;
                    receiver.insert(insertion);
                }
                else options.insertion(receiver, responseText);
            }
            else receiver.update(responseText);
        }
    }
});

Ajax.PeriodicalUpdater = Class.create(Ajax.Base, {
    initialize: function($super, container, url, options) {
        $super(options);
        this.onComplete = this.options.onComplete;

        this.frequency = (this.options.frequency || 2);
        this.decay = (this.options.decay || 1);

        this.updater = {};
        this.container = container;
        this.url = url;

        this.start();
    },

    start: function() {
        this.options.onComplete = this.updateComplete.bind(this);
        this.onTimerEvent();
    },

    stop: function() {
        this.updater.options.onComplete = undefined;
        clearTimeout(this.timer);
        (this.onComplete || Prototype.emptyFunction).apply(this, arguments);
    },

    updateComplete: function(response) {
        if (this.options.decay) {
            this.decay = (response.responseText == this.lastText ?
        this.decay * this.options.decay : 1);

            this.lastText = response.responseText;
        }
        this.timer = this.onTimerEvent.bind(this).delay(this.decay * this.frequency);
    },

    onTimerEvent: function() {
        this.updater = new Ajax.Updater(this.container, this.url, this.options);
    }
});


function $(element) {
    if (arguments.length > 1) {
        for (var i = 0, elements = [], length = arguments.length; i < length; i++)
            elements.push($(arguments[i]));
        return elements;
    }
    if (Object.isString(element))
        element = document.getElementById(element);
    return Element.extend(element);
}

if (Prototype.BrowserFeatures.XPath) {
    document._getElementsByXPath = function(expression, parentElement) {
        var results = [];
        var query = document.evaluate(expression, $(parentElement) || document,
      null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
        for (var i = 0, length = query.snapshotLength; i < length; i++)
            results.push(Element.extend(query.snapshotItem(i)));
        return results;
    };
}

/*--------------------------------------------------------------------------*/

if (!Node) var Node = {};

if (!Node.ELEMENT_NODE) {
    Object.extend(Node, {
        ELEMENT_NODE: 1,
        ATTRIBUTE_NODE: 2,
        TEXT_NODE: 3,
        CDATA_SECTION_NODE: 4,
        ENTITY_REFERENCE_NODE: 5,
        ENTITY_NODE: 6,
        PROCESSING_INSTRUCTION_NODE: 7,
        COMMENT_NODE: 8,
        DOCUMENT_NODE: 9,
        DOCUMENT_TYPE_NODE: 10,
        DOCUMENT_FRAGMENT_NODE: 11,
        NOTATION_NODE: 12
    });
}



(function(global) {
    function shouldUseCache(tagName, attributes) {
        if (tagName === 'select') return false;
        if ('type' in attributes) return false;
        return true;
    }

    var HAS_EXTENDED_CREATE_ELEMENT_SYNTAX = (function() {
        try {
            var el = document.createElement('<input name="x">');
            return el.tagName.toLowerCase() === 'input' && el.name === 'x';
        }
        catch (err) {
            return false;
        }
    })();

    var element = global.Element;

    global.Element = function(tagName, attributes) {
        attributes = attributes || {};
        tagName = tagName.toLowerCase();
        var cache = Element.cache;

        if (HAS_EXTENDED_CREATE_ELEMENT_SYNTAX && attributes.name) {
            tagName = '<' + tagName + ' name="' + attributes.name + '">';
            delete attributes.name;
            return Element.writeAttribute(document.createElement(tagName), attributes);
        }

        if (!cache[tagName]) cache[tagName] = Element.extend(document.createElement(tagName));

        var node = shouldUseCache(tagName, attributes) ?
     cache[tagName].cloneNode(false) : document.createElement(tagName);

        return Element.writeAttribute(node, attributes);
    };

    Object.extend(global.Element, element || {});
    if (element) global.Element.prototype = element.prototype;

})(this);

Element.idCounter = 1;
Element.cache = {};

Element._purgeElement = function(element) {
    var uid = element._prototypeUID;
    if (uid) {
        Element.stopObserving(element);
        element._prototypeUID = void 0;
        delete Element.Storage[uid];
    }
}

Element.Methods = {
    visible: function(element) {
        return $(element).style.display != 'none';
    },

    toggle: function(element) {
        element = $(element);
        Element[Element.visible(element) ? 'hide' : 'show'](element);
        return element;
    },

    hide: function(element) {
        element = $(element);
        element.style.display = 'none';
        return element;
    },

    show: function(element) {
        element = $(element);
        element.style.display = '';
        return element;
    },

    remove: function(element) {
        element = $(element);
        element.parentNode.removeChild(element);
        return element;
    },

    update: (function() {

        var SELECT_ELEMENT_INNERHTML_BUGGY = (function() {
            var el = document.createElement("select"),
          isBuggy = true;
            el.innerHTML = "<option value=\"test\">test</option>";
            if (el.options && el.options[0]) {
                isBuggy = el.options[0].nodeName.toUpperCase() !== "OPTION";
            }
            el = null;
            return isBuggy;
        })();

        var TABLE_ELEMENT_INNERHTML_BUGGY = (function() {
            try {
                var el = document.createElement("table");
                if (el && el.tBodies) {
                    el.innerHTML = "<tbody><tr><td>test</td></tr></tbody>";
                    var isBuggy = typeof el.tBodies[0] == "undefined";
                    el = null;
                    return isBuggy;
                }
            } catch (e) {
                return true;
            }
        })();

        var LINK_ELEMENT_INNERHTML_BUGGY = (function() {
            try {
                var el = document.createElement('div');
                el.innerHTML = "<link>";
                var isBuggy = (el.childNodes.length === 0);
                el = null;
                return isBuggy;
            } catch (e) {
                return true;
            }
        })();

        var ANY_INNERHTML_BUGGY = SELECT_ELEMENT_INNERHTML_BUGGY ||
     TABLE_ELEMENT_INNERHTML_BUGGY || LINK_ELEMENT_INNERHTML_BUGGY;

        var SCRIPT_ELEMENT_REJECTS_TEXTNODE_APPENDING = (function() {
            var s = document.createElement("script"),
          isBuggy = false;
            try {
                s.appendChild(document.createTextNode(""));
                isBuggy = !s.firstChild ||
          s.firstChild && s.firstChild.nodeType !== 3;
            } catch (e) {
                isBuggy = true;
            }
            s = null;
            return isBuggy;
        })();


        function update(element, content) {
            element = $(element);
            var purgeElement = Element._purgeElement;

            var descendants = element.getElementsByTagName('*'),
       i = descendants.length;
            while (i--) purgeElement(descendants[i]);

            if (content && content.toElement)
                content = content.toElement();

            if (Object.isElement(content))
                return element.update().insert(content);

            content = Object.toHTML(content);

            var tagName = element.tagName.toUpperCase();

            if (tagName === 'SCRIPT' && SCRIPT_ELEMENT_REJECTS_TEXTNODE_APPENDING) {
                element.text = content;
                return element;
            }

            if (ANY_INNERHTML_BUGGY) {
                if (tagName in Element._insertionTranslations.tags) {
                    while (element.firstChild) {
                        element.removeChild(element.firstChild);
                    }
                    Element._getContentFromAnonymousElement(tagName, content.stripScripts())
            .each(function(node) {
                element.appendChild(node)
            });
                } else if (LINK_ELEMENT_INNERHTML_BUGGY && Object.isString(content) && content.indexOf('<link') > -1) {
                    while (element.firstChild) {
                        element.removeChild(element.firstChild);
                    }
                    var nodes = Element._getContentFromAnonymousElement(tagName, content.stripScripts(), true);
                    nodes.each(function(node) { element.appendChild(node) });
                }
                else {
                    element.innerHTML = content.stripScripts();
                }
            }
            else {
                element.innerHTML = content.stripScripts();
            }

            content.evalScripts.bind(content).defer();
            return element;
        }

        return update;
    })(),

    replace: function(element, content) {
        element = $(element);
        if (content && content.toElement) content = content.toElement();
        else if (!Object.isElement(content)) {
            content = Object.toHTML(content);
            var range = element.ownerDocument.createRange();
            range.selectNode(element);
            content.evalScripts.bind(content).defer();
            content = range.createContextualFragment(content.stripScripts());
        }
        element.parentNode.replaceChild(content, element);
        return element;
    },

    insert: function(element, insertions) {
        element = $(element);

        if (Object.isString(insertions) || Object.isNumber(insertions) ||
        Object.isElement(insertions) || (insertions && (insertions.toElement || insertions.toHTML)))
            insertions = { bottom: insertions };

        var content, insert, tagName, childNodes;

        for (var position in insertions) {
            content = insertions[position];
            position = position.toLowerCase();
            insert = Element._insertionTranslations[position];

            if (content && content.toElement) content = content.toElement();
            if (Object.isElement(content)) {
                insert(element, content);
                continue;
            }

            content = Object.toHTML(content);

            tagName = ((position == 'before' || position == 'after')
        ? element.parentNode : element).tagName.toUpperCase();

            childNodes = Element._getContentFromAnonymousElement(tagName, content.stripScripts());

            if (position == 'top' || position == 'after') childNodes.reverse();
            childNodes.each(insert.curry(element));

            content.evalScripts.bind(content).defer();
        }

        return element;
    },

    wrap: function(element, wrapper, attributes) {
        element = $(element);
        if (Object.isElement(wrapper))
            $(wrapper).writeAttribute(attributes || {});
        else if (Object.isString(wrapper)) wrapper = new Element(wrapper, attributes);
        else wrapper = new Element('div', wrapper);
        if (element.parentNode)
            element.parentNode.replaceChild(wrapper, element);
        wrapper.appendChild(element);
        return wrapper;
    },

    inspect: function(element) {
        element = $(element);
        var result = '<' + element.tagName.toLowerCase();
        $H({ 'id': 'id', 'className': 'class' }).each(function(pair) {
            var property = pair.first(),
          attribute = pair.last(),
          value = (element[property] || '').toString();
            if (value) result += ' ' + attribute + '=' + value.inspect(true);
        });
        return result + '>';
    },

    recursivelyCollect: function(element, property, maximumLength) {
        element = $(element);
        maximumLength = maximumLength || -1;
        var elements = [];

        while (element = element[property]) {
            if (element.nodeType == 1)
                elements.push(Element.extend(element));
            if (elements.length == maximumLength)
                break;
        }

        return elements;
    },

    ancestors: function(element) {
        return Element.recursivelyCollect(element, 'parentNode');
    },

    descendants: function(element) {
        return Element.select(element, "*");
    },

    firstDescendant: function(element) {
        element = $(element).firstChild;
        while (element && element.nodeType != 1) element = element.nextSibling;
        return $(element);
    },

    immediateDescendants: function(element) {
        var results = [], child = $(element).firstChild;
        while (child) {
            if (child.nodeType === 1) {
                results.push(Element.extend(child));
            }
            child = child.nextSibling;
        }
        return results;
    },

    previousSiblings: function(element, maximumLength) {
        return Element.recursivelyCollect(element, 'previousSibling');
    },

    nextSiblings: function(element) {
        return Element.recursivelyCollect(element, 'nextSibling');
    },

    siblings: function(element) {
        element = $(element);
        return Element.previousSiblings(element).reverse()
      .concat(Element.nextSiblings(element));
    },

    match: function(element, selector) {
        element = $(element);
        if (Object.isString(selector))
            return Prototype.Selector.match(element, selector);
        return selector.match(element);
    },

    up: function(element, expression, index) {
        element = $(element);
        if (arguments.length == 1) return $(element.parentNode);
        var ancestors = Element.ancestors(element);
        return Object.isNumber(expression) ? ancestors[expression] :
      Prototype.Selector.find(ancestors, expression, index);
    },

    down: function(element, expression, index) {
        element = $(element);
        if (arguments.length == 1) return Element.firstDescendant(element);
        return Object.isNumber(expression) ? Element.descendants(element)[expression] :
      Element.select(element, expression)[index || 0];
    },

    previous: function(element, expression, index) {
        element = $(element);
        if (Object.isNumber(expression)) index = expression, expression = false;
        if (!Object.isNumber(index)) index = 0;

        if (expression) {
            return Prototype.Selector.find(element.previousSiblings(), expression, index);
        } else {
            return element.recursivelyCollect("previousSibling", index + 1)[index];
        }
    },

    next: function(element, expression, index) {
        element = $(element);
        if (Object.isNumber(expression)) index = expression, expression = false;
        if (!Object.isNumber(index)) index = 0;

        if (expression) {
            return Prototype.Selector.find(element.nextSiblings(), expression, index);
        } else {
            var maximumLength = Object.isNumber(index) ? index + 1 : 1;
            return element.recursivelyCollect("nextSibling", index + 1)[index];
        }
    },


    select: function(element) {
        element = $(element);
        var expressions = Array.prototype.slice.call(arguments, 1).join(', ');
        return Prototype.Selector.select(expressions, element);
    },

    adjacent: function(element) {
        element = $(element);
        var expressions = Array.prototype.slice.call(arguments, 1).join(', ');
        return Prototype.Selector.select(expressions, element.parentNode).without(element);
    },

    identify: function(element) {
        element = $(element);
        var id = Element.readAttribute(element, 'id');
        if (id) return id;
        do { id = 'anonymous_element_' + Element.idCounter++ } while ($(id));
        Element.writeAttribute(element, 'id', id);
        return id;
    },

    readAttribute: function(element, name) {
        element = $(element);
        if (Prototype.Browser.IE) {
            var t = Element._attributeTranslations.read;
            if (t.values[name]) return t.values[name](element, name);
            if (t.names[name]) name = t.names[name];
            if (name.include(':')) {
                return (!element.attributes || !element.attributes[name]) ? null :
         element.attributes[name].value;
            }
        }
        return element.getAttribute(name);
    },

    writeAttribute: function(element, name, value) {
        element = $(element);
        var attributes = {}, t = Element._attributeTranslations.write;

        if (typeof name == 'object') attributes = name;
        else attributes[name] = Object.isUndefined(value) ? true : value;

        for (var attr in attributes) {
            name = t.names[attr] || attr;
            value = attributes[attr];
            if (t.values[attr]) name = t.values[attr](element, value);
            if (value === false || value === null)
                element.removeAttribute(name);
            else if (value === true)
                element.setAttribute(name, name);
            else element.setAttribute(name, value);
        }
        return element;
    },

    getHeight: function(element) {
        return Element.getDimensions(element).height;
    },

    getWidth: function(element) {
        return Element.getDimensions(element).width;
    },

    classNames: function(element) {
        return new Element.ClassNames(element);
    },

    hasClassName: function(element, className) {
        if (!(element = $(element))) return;
        var elementClassName = element.className;
        return (elementClassName.length > 0 && (elementClassName == className ||
      new RegExp("(^|\\s)" + className + "(\\s|$)").test(elementClassName)));
    },

    addClassName: function(element, className) {
        if (!(element = $(element))) return;
        if (!Element.hasClassName(element, className))
            element.className += (element.className ? ' ' : '') + className;
        return element;
    },

    removeClassName: function(element, className) {
        if (!(element = $(element))) return;
        element.className = element.className.replace(
      new RegExp("(^|\\s+)" + className + "(\\s+|$)"), ' ').strip();
        return element;
    },

    toggleClassName: function(element, className) {
        if (!(element = $(element))) return;
        return Element[Element.hasClassName(element, className) ?
      'removeClassName' : 'addClassName'](element, className);
    },

    cleanWhitespace: function(element) {
        element = $(element);
        var node = element.firstChild;
        while (node) {
            var nextNode = node.nextSibling;
            if (node.nodeType == 3 && !/\S/.test(node.nodeValue))
                element.removeChild(node);
            node = nextNode;
        }
        return element;
    },

    empty: function(element) {
        return $(element).innerHTML.blank();
    },

    descendantOf: function(element, ancestor) {
        element = $(element), ancestor = $(ancestor);

        if (element.compareDocumentPosition)
            return (element.compareDocumentPosition(ancestor) & 8) === 8;

        if (ancestor.contains)
            return ancestor.contains(element) && ancestor !== element;

        while (element = element.parentNode)
            if (element == ancestor) return true;

        return false;
    },

    scrollTo: function(element) {
        element = $(element);
        var pos = Element.cumulativeOffset(element);
        window.scrollTo(pos[0], pos[1]);
        return element;
    },

    getStyle: function(element, style) {
        element = $(element);
        style = style == 'float' ? 'cssFloat' : style.camelize();
        var value = element.style[style];
        if (!value || value == 'auto') {
            var css = document.defaultView.getComputedStyle(element, null);
            value = css ? css[style] : null;
        }
        if (style == 'opacity') return value ? parseFloat(value) : 1.0;
        return value == 'auto' ? null : value;
    },

    getOpacity: function(element) {
        return $(element).getStyle('opacity');
    },

    setStyle: function(element, styles) {
        element = $(element);
        var elementStyle = element.style, match;
        if (Object.isString(styles)) {
            element.style.cssText += ';' + styles;
            return styles.include('opacity') ?
        element.setOpacity(styles.match(/opacity:\s*(\d?\.?\d*)/)[1]) : element;
        }
        for (var property in styles)
            if (property == 'opacity') element.setOpacity(styles[property]);
        else
            elementStyle[(property == 'float' || property == 'cssFloat') ?
          (Object.isUndefined(elementStyle.styleFloat) ? 'cssFloat' : 'styleFloat') :
            property] = styles[property];

        return element;
    },

    setOpacity: function(element, value) {
        element = $(element);
        element.style.opacity = (value == 1 || value === '') ? '' :
      (value < 0.00001) ? 0 : value;
        return element;
    },

    makePositioned: function(element) {
        element = $(element);
        var pos = Element.getStyle(element, 'position');
        if (pos == 'static' || !pos) {
            element._madePositioned = true;
            element.style.position = 'relative';
            if (Prototype.Browser.Opera) {
                element.style.top = 0;
                element.style.left = 0;
            }
        }
        return element;
    },

    undoPositioned: function(element) {
        element = $(element);
        if (element._madePositioned) {
            element._madePositioned = undefined;
            element.style.position =
        element.style.top =
        element.style.left =
        element.style.bottom =
        element.style.right = '';
        }
        return element;
    },

    makeClipping: function(element) {
        element = $(element);
        if (element._overflow) return element;
        element._overflow = Element.getStyle(element, 'overflow') || 'auto';
        if (element._overflow !== 'hidden')
            element.style.overflow = 'hidden';
        return element;
    },

    undoClipping: function(element) {
        element = $(element);
        if (!element._overflow) return element;
        element.style.overflow = element._overflow == 'auto' ? '' : element._overflow;
        element._overflow = null;
        return element;
    },

    clonePosition: function(element, source) {
        var options = Object.extend({
            setLeft: true,
            setTop: true,
            setWidth: true,
            setHeight: true,
            offsetTop: 0,
            offsetLeft: 0
        }, arguments[2] || {});

        source = $(source);
        var p = Element.viewportOffset(source), delta = [0, 0], parent = null;

        element = $(element);

        if (Element.getStyle(element, 'position') == 'absolute') {
            parent = Element.getOffsetParent(element);
            delta = Element.viewportOffset(parent);
        }

        if (parent == document.body) {
            delta[0] -= document.body.offsetLeft;
            delta[1] -= document.body.offsetTop;
        }

        if (options.setLeft) element.style.left = (p[0] - delta[0] + options.offsetLeft) + 'px';
        if (options.setTop) element.style.top = (p[1] - delta[1] + options.offsetTop) + 'px';
        if (options.setWidth) element.style.width = source.offsetWidth + 'px';
        if (options.setHeight) element.style.height = source.offsetHeight + 'px';
        return element;
    }
};

Object.extend(Element.Methods, {
    getElementsBySelector: Element.Methods.select,

    childElements: Element.Methods.immediateDescendants
});

Element._attributeTranslations = {
    write: {
        names: {
            className: 'class',
            htmlFor: 'for'
        },
        values: {}
    }
};

if (Prototype.Browser.Opera) {
    Element.Methods.getStyle = Element.Methods.getStyle.wrap(
    function(proceed, element, style) {
        switch (style) {
            case 'height': case 'width':
                if (!Element.visible(element)) return null;

                var dim = parseInt(proceed(element, style), 10);

                if (dim !== element['offset' + style.capitalize()])
                    return dim + 'px';

                var properties;
                if (style === 'height') {
                    properties = ['border-top-width', 'padding-top',
             'padding-bottom', 'border-bottom-width'];
                }
                else {
                    properties = ['border-left-width', 'padding-left',
             'padding-right', 'border-right-width'];
                }
                return properties.inject(dim, function(memo, property) {
                    var val = proceed(element, property);
                    return val === null ? memo : memo - parseInt(val, 10);
                }) + 'px';
            default: return proceed(element, style);
        }
    }
  );

    Element.Methods.readAttribute = Element.Methods.readAttribute.wrap(
    function(proceed, element, attribute) {
        if (attribute === 'title') return element.title;
        return proceed(element, attribute);
    }
  );
}

else if (Prototype.Browser.IE) {
    Element.Methods.getStyle = function(element, style) {
        element = $(element);
        style = (style == 'float' || style == 'cssFloat') ? 'styleFloat' : style.camelize();
        var value = element.style[style];
        if (!value && element.currentStyle) value = element.currentStyle[style];

        if (style == 'opacity') {
            if (value = (element.getStyle('filter') || '').match(/alpha\(opacity=(.*)\)/))
                if (value[1]) return parseFloat(value[1]) / 100;
            return 1.0;
        }

        if (value == 'auto') {
            if ((style == 'width' || style == 'height') && (element.getStyle('display') != 'none'))
                return element['offset' + style.capitalize()] + 'px';
            return null;
        }
        return value;
    };

    Element.Methods.setOpacity = function(element, value) {
        function stripAlpha(filter) {
            return filter.replace(/alpha\([^\)]*\)/gi, '');
        }
        element = $(element);
        var currentStyle = element.currentStyle;
        if ((currentStyle && !currentStyle.hasLayout) ||
      (!currentStyle && element.style.zoom == 'normal'))
            element.style.zoom = 1;

        var filter = element.getStyle('filter'), style = element.style;
        if (value == 1 || value === '') {
            (filter = stripAlpha(filter)) ?
        style.filter = filter : style.removeAttribute('filter');
            return element;
        } else if (value < 0.00001) value = 0;
        style.filter = stripAlpha(filter) +
      'alpha(opacity=' + (value * 100) + ')';
        return element;
    };

    Element._attributeTranslations = (function() {

        var classProp = 'className',
        forProp = 'for',
        el = document.createElement('div');

        el.setAttribute(classProp, 'x');

        if (el.className !== 'x') {
            el.setAttribute('class', 'x');
            if (el.className === 'x') {
                classProp = 'class';
            }
        }
        el = null;

        el = document.createElement('label');
        el.setAttribute(forProp, 'x');
        if (el.htmlFor !== 'x') {
            el.setAttribute('htmlFor', 'x');
            if (el.htmlFor === 'x') {
                forProp = 'htmlFor';
            }
        }
        el = null;

        return {
            read: {
                names: {
                    'class': classProp,
                    'className': classProp,
                    'for': forProp,
                    'htmlFor': forProp
                },
                values: {
                    _getAttr: function(element, attribute) {
                        return element.getAttribute(attribute);
                    },
                    _getAttr2: function(element, attribute) {
                        return element.getAttribute(attribute, 2);
                    },
                    _getAttrNode: function(element, attribute) {
                        var node = element.getAttributeNode(attribute);
                        return node ? node.value : "";
                    },
                    _getEv: (function() {

                        var el = document.createElement('div'), f;
                        el.onclick = Prototype.emptyFunction;
                        var value = el.getAttribute('onclick');

                        if (String(value).indexOf('{') > -1) {
                            f = function(element, attribute) {
                                attribute = element.getAttribute(attribute);
                                if (!attribute) return null;
                                attribute = attribute.toString();
                                attribute = attribute.split('{')[1];
                                attribute = attribute.split('}')[0];
                                return attribute.strip();
                            };
                        }
                        else if (value === '') {
                            f = function(element, attribute) {
                                attribute = element.getAttribute(attribute);
                                if (!attribute) return null;
                                return attribute.strip();
                            };
                        }
                        el = null;
                        return f;
                    })(),
                    _flag: function(element, attribute) {
                        return $(element).hasAttribute(attribute) ? attribute : null;
                    },
                    style: function(element) {
                        return element.style.cssText.toLowerCase();
                    },
                    title: function(element) {
                        return element.title;
                    }
                }
            }
        }
    })();

    Element._attributeTranslations.write = {
        names: Object.extend({
            cellpadding: 'cellPadding',
            cellspacing: 'cellSpacing'
        }, Element._attributeTranslations.read.names),
        values: {
            checked: function(element, value) {
                element.checked = !!value;
            },

            style: function(element, value) {
                element.style.cssText = value ? value : '';
            }
        }
    };

    Element._attributeTranslations.has = {};

    $w('colSpan rowSpan vAlign dateTime accessKey tabIndex ' +
      'encType maxLength readOnly longDesc frameBorder').each(function(attr) {
          Element._attributeTranslations.write.names[attr.toLowerCase()] = attr;
          Element._attributeTranslations.has[attr.toLowerCase()] = attr;
      });

    (function(v) {
        Object.extend(v, {
            href: v._getAttr2,
            src: v._getAttr2,
            type: v._getAttr,
            action: v._getAttrNode,
            disabled: v._flag,
            checked: v._flag,
            readonly: v._flag,
            multiple: v._flag,
            onload: v._getEv,
            onunload: v._getEv,
            onclick: v._getEv,
            ondblclick: v._getEv,
            onmousedown: v._getEv,
            onmouseup: v._getEv,
            onmouseover: v._getEv,
            onmousemove: v._getEv,
            onmouseout: v._getEv,
            onfocus: v._getEv,
            onblur: v._getEv,
            onkeypress: v._getEv,
            onkeydown: v._getEv,
            onkeyup: v._getEv,
            onsubmit: v._getEv,
            onreset: v._getEv,
            onselect: v._getEv,
            onchange: v._getEv
        });
    })(Element._attributeTranslations.read.values);

    if (Prototype.BrowserFeatures.ElementExtensions) {
        (function() {
            function _descendants(element) {
                var nodes = element.getElementsByTagName('*'), results = [];
                for (var i = 0, node; node = nodes[i]; i++)
                    if (node.tagName !== "!") // Filter out comment nodes.
                    results.push(node);
                return results;
            }

            Element.Methods.down = function(element, expression, index) {
                element = $(element);
                if (arguments.length == 1) return element.firstDescendant();
                return Object.isNumber(expression) ? _descendants(element)[expression] :
          Element.select(element, expression)[index || 0];
            }
        })();
    }

}

else if (Prototype.Browser.Gecko && /rv:1\.8\.0/.test(navigator.userAgent)) {
    Element.Methods.setOpacity = function(element, value) {
        element = $(element);
        element.style.opacity = (value == 1) ? 0.999999 :
      (value === '') ? '' : (value < 0.00001) ? 0 : value;
        return element;
    };
}

else if (Prototype.Browser.WebKit) {
    Element.Methods.setOpacity = function(element, value) {
        element = $(element);
        element.style.opacity = (value == 1 || value === '') ? '' :
      (value < 0.00001) ? 0 : value;

        if (value == 1)
            if (element.tagName.toUpperCase() == 'IMG' && element.width) {
            element.width++; element.width--;
        } else try {
            var n = document.createTextNode(' ');
            element.appendChild(n);
            element.removeChild(n);
        } catch (e) { }

        return element;
    };
}

if ('outerHTML' in document.documentElement) {
    Element.Methods.replace = function(element, content) {
        element = $(element);

        if (content && content.toElement) content = content.toElement();
        if (Object.isElement(content)) {
            element.parentNode.replaceChild(content, element);
            return element;
        }

        content = Object.toHTML(content);
        var parent = element.parentNode, tagName = parent.tagName.toUpperCase();

        if (Element._insertionTranslations.tags[tagName]) {
            var nextSibling = element.next(),
          fragments = Element._getContentFromAnonymousElement(tagName, content.stripScripts());
            parent.removeChild(element);
            if (nextSibling)
                fragments.each(function(node) { parent.insertBefore(node, nextSibling) });
            else
                fragments.each(function(node) { parent.appendChild(node) });
        }
        else element.outerHTML = content.stripScripts();

        content.evalScripts.bind(content).defer();
        return element;
    };
}

Element._returnOffset = function(l, t) {
    var result = [l, t];
    result.left = l;
    result.top = t;
    return result;
};

Element._getContentFromAnonymousElement = function(tagName, html, force) {
    var div = new Element('div'),
      t = Element._insertionTranslations.tags[tagName];

    var workaround = false;
    if (t) workaround = true;
    else if (force) {
        workaround = true;
        t = ['', '', 0];
    }

    if (workaround) {
        div.innerHTML = '&nbsp;' + t[0] + html + t[1];
        div.removeChild(div.firstChild);
        for (var i = t[2]; i--; ) {
            div = div.firstChild;
        }
    }
    else {
        div.innerHTML = html;
    }
    return $A(div.childNodes);
};

Element._insertionTranslations = {
    before: function(element, node) {
        element.parentNode.insertBefore(node, element);
    },
    top: function(element, node) {
        element.insertBefore(node, element.firstChild);
    },
    bottom: function(element, node) {
        element.appendChild(node);
    },
    after: function(element, node) {
        element.parentNode.insertBefore(node, element.nextSibling);
    },
    tags: {
        TABLE: ['<table>', '</table>', 1],
        TBODY: ['<table><tbody>', '</tbody></table>', 2],
        TR: ['<table><tbody><tr>', '</tr></tbody></table>', 3],
        TD: ['<table><tbody><tr><td>', '</td></tr></tbody></table>', 4],
        SELECT: ['<select>', '</select>', 1]
    }
};

(function() {
    var tags = Element._insertionTranslations.tags;
    Object.extend(tags, {
        THEAD: tags.TBODY,
        TFOOT: tags.TBODY,
        TH: tags.TD
    });
})();

Element.Methods.Simulated = {
    hasAttribute: function(element, attribute) {
        attribute = Element._attributeTranslations.has[attribute] || attribute;
        var node = $(element).getAttributeNode(attribute);
        return !!(node && node.specified);
    }
};

Element.Methods.ByTag = {};

Object.extend(Element, Element.Methods);

(function(div) {

    if (!Prototype.BrowserFeatures.ElementExtensions && div['__proto__']) {
        window.HTMLElement = {};
        window.HTMLElement.prototype = div['__proto__'];
        Prototype.BrowserFeatures.ElementExtensions = true;
    }

    div = null;

})(document.createElement('div'));

Element.extend = (function() {

    function checkDeficiency(tagName) {
        if (typeof window.Element != 'undefined') {
            var proto = window.Element.prototype;
            if (proto) {
                var id = '_' + (Math.random() + '').slice(2),
            el = document.createElement(tagName);
                proto[id] = 'x';
                var isBuggy = (el[id] !== 'x');
                delete proto[id];
                el = null;
                return isBuggy;
            }
        }
        return false;
    }

    function extendElementWith(element, methods) {
        for (var property in methods) {
            var value = methods[property];
            if (Object.isFunction(value) && !(property in element))
                element[property] = value.methodize();
        }
    }

    var HTMLOBJECTELEMENT_PROTOTYPE_BUGGY = checkDeficiency('object');

    if (Prototype.BrowserFeatures.SpecificElementExtensions) {
        if (HTMLOBJECTELEMENT_PROTOTYPE_BUGGY) {
            return function(element) {
                if (element && typeof element._extendedByPrototype == 'undefined') {
                    var t = element.tagName;
                    if (t && (/^(?:object|applet|embed)$/i.test(t))) {
                        extendElementWith(element, Element.Methods);
                        extendElementWith(element, Element.Methods.Simulated);
                        extendElementWith(element, Element.Methods.ByTag[t.toUpperCase()]);
                    }
                }
                return element;
            }
        }
        return Prototype.K;
    }

    var Methods = {}, ByTag = Element.Methods.ByTag;

    var extend = Object.extend(function(element) {
        if (!element || typeof element._extendedByPrototype != 'undefined' ||
        element.nodeType != 1 || element == window) return element;

        var methods = Object.clone(Methods),
        tagName = element.tagName.toUpperCase();

        if (ByTag[tagName]) Object.extend(methods, ByTag[tagName]);

        extendElementWith(element, methods);

        element._extendedByPrototype = Prototype.emptyFunction;
        return element;

    }, {
        refresh: function() {
            if (!Prototype.BrowserFeatures.ElementExtensions) {
                Object.extend(Methods, Element.Methods);
                Object.extend(Methods, Element.Methods.Simulated);
            }
        }
    });

    extend.refresh();
    return extend;
})();

if (document.documentElement.hasAttribute) {
    Element.hasAttribute = function(element, attribute) {
        return element.hasAttribute(attribute);
    };
}
else {
    Element.hasAttribute = Element.Methods.Simulated.hasAttribute;
}

Element.addMethods = function(methods) {
    var F = Prototype.BrowserFeatures, T = Element.Methods.ByTag;

    if (!methods) {
        Object.extend(Form, Form.Methods);
        Object.extend(Form.Element, Form.Element.Methods);
        Object.extend(Element.Methods.ByTag, {
            "FORM": Object.clone(Form.Methods),
            "INPUT": Object.clone(Form.Element.Methods),
            "SELECT": Object.clone(Form.Element.Methods),
            "TEXTAREA": Object.clone(Form.Element.Methods),
            "BUTTON": Object.clone(Form.Element.Methods)
        });
    }

    if (arguments.length == 2) {
        var tagName = methods;
        methods = arguments[1];
    }

    if (!tagName) Object.extend(Element.Methods, methods || {});
    else {
        if (Object.isArray(tagName)) tagName.each(extend);
        else extend(tagName);
    }

    function extend(tagName) {
        tagName = tagName.toUpperCase();
        if (!Element.Methods.ByTag[tagName])
            Element.Methods.ByTag[tagName] = {};
        Object.extend(Element.Methods.ByTag[tagName], methods);
    }

    function copy(methods, destination, onlyIfAbsent) {
        onlyIfAbsent = onlyIfAbsent || false;
        for (var property in methods) {
            var value = methods[property];
            if (!Object.isFunction(value)) continue;
            if (!onlyIfAbsent || !(property in destination))
                destination[property] = value.methodize();
        }
    }

    function findDOMClass(tagName) {
        var klass;
        var trans = {
            "OPTGROUP": "OptGroup", "TEXTAREA": "TextArea", "P": "Paragraph",
            "FIELDSET": "FieldSet", "UL": "UList", "OL": "OList", "DL": "DList",
            "DIR": "Directory", "H1": "Heading", "H2": "Heading", "H3": "Heading",
            "H4": "Heading", "H5": "Heading", "H6": "Heading", "Q": "Quote",
            "INS": "Mod", "DEL": "Mod", "A": "Anchor", "IMG": "Image", "CAPTION":
      "TableCaption", "COL": "TableCol", "COLGROUP": "TableCol", "THEAD":
      "TableSection", "TFOOT": "TableSection", "TBODY": "TableSection", "TR":
      "TableRow", "TH": "TableCell", "TD": "TableCell", "FRAMESET":
      "FrameSet", "IFRAME": "IFrame"
        };
        if (trans[tagName]) klass = 'HTML' + trans[tagName] + 'Element';
        if (window[klass]) return window[klass];
        klass = 'HTML' + tagName + 'Element';
        if (window[klass]) return window[klass];
        klass = 'HTML' + tagName.capitalize() + 'Element';
        if (window[klass]) return window[klass];

        var element = document.createElement(tagName),
        proto = element['__proto__'] || element.constructor.prototype;

        element = null;
        return proto;
    }

    var elementPrototype = window.HTMLElement ? HTMLElement.prototype :
   Element.prototype;

    if (F.ElementExtensions) {
        copy(Element.Methods, elementPrototype);
        copy(Element.Methods.Simulated, elementPrototype, true);
    }

    if (F.SpecificElementExtensions) {
        for (var tag in Element.Methods.ByTag) {
            var klass = findDOMClass(tag);
            if (Object.isUndefined(klass)) continue;
            copy(T[tag], klass.prototype);
        }
    }

    Object.extend(Element, Element.Methods);
    delete Element.ByTag;

    if (Element.extend.refresh) Element.extend.refresh();
    Element.cache = {};
};


document.viewport = {

    getDimensions: function() {
        return { width: this.getWidth(), height: this.getHeight() };
    },

    getScrollOffsets: function() {
        return Element._returnOffset(
      window.pageXOffset || document.documentElement.scrollLeft || document.body.scrollLeft,
      window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop);
    }
};

(function(viewport) {
    var B = Prototype.Browser, doc = document, element, property = {};

    function getRootElement() {
        if (B.WebKit && !doc.evaluate)
            return document;

        if (B.Opera && window.parseFloat(window.opera.version()) < 9.5)
            return document.body;

        return document.documentElement;
    }

    function define(D) {
        if (!element) element = getRootElement();

        property[D] = 'client' + D;

        viewport['get' + D] = function() { return element[property[D]] };
        return viewport['get' + D]();
    }

    viewport.getWidth = define.curry('Width');

    viewport.getHeight = define.curry('Height');
})(document.viewport);


Element.Storage = {
    UID: 1
};

Element.addMethods({
    getStorage: function(element) {
        if (!(element = $(element))) return;

        var uid;
        if (element === window) {
            uid = 0;
        } else {
            if (typeof element._prototypeUID === "undefined")
                element._prototypeUID = Element.Storage.UID++;
            uid = element._prototypeUID;
        }

        if (!Element.Storage[uid])
            Element.Storage[uid] = $H();

        return Element.Storage[uid];
    },

    store: function(element, key, value) {
        if (!(element = $(element))) return;

        if (arguments.length === 2) {
            Element.getStorage(element).update(key);
        } else {
            Element.getStorage(element).set(key, value);
        }

        return element;
    },

    retrieve: function(element, key, defaultValue) {
        if (!(element = $(element))) return;
        var hash = Element.getStorage(element), value = hash.get(key);

        if (Object.isUndefined(value)) {
            hash.set(key, defaultValue);
            value = defaultValue;
        }

        return value;
    },

    clone: function(element, deep) {
        if (!(element = $(element))) return;
        var clone = element.cloneNode(deep);
        clone._prototypeUID = void 0;
        if (deep) {
            var descendants = Element.select(clone, '*'),
          i = descendants.length;
            while (i--) {
                descendants[i]._prototypeUID = void 0;
            }
        }
        return Element.extend(clone);
    },

    purge: function(element) {
        if (!(element = $(element))) return;
        var purgeElement = Element._purgeElement;

        purgeElement(element);

        var descendants = element.getElementsByTagName('*'),
     i = descendants.length;

        while (i--) purgeElement(descendants[i]);

        return null;
    }
});

(function() {

    function toDecimal(pctString) {
        var match = pctString.match(/^(\d+)%?$/i);
        if (!match) return null;
        return (Number(match[1]) / 100);
    }

    function getPixelValue(value, property, context) {
        var element = null;
        if (Object.isElement(value)) {
            element = value;
            value = element.getStyle(property);
        }

        if (value === null) {
            return null;
        }

        if ((/^(?:-)?\d+(\.\d+)?(px)?$/i).test(value)) {
            return window.parseFloat(value);
        }

        var isPercentage = value.include('%'), isViewport = (context === document.viewport);

        if (/\d/.test(value) && element && element.runtimeStyle && !(isPercentage && isViewport)) {
            var style = element.style.left, rStyle = element.runtimeStyle.left;
            element.runtimeStyle.left = element.currentStyle.left;
            element.style.left = value || 0;
            value = element.style.pixelLeft;
            element.style.left = style;
            element.runtimeStyle.left = rStyle;

            return value;
        }

        if (element && isPercentage) {
            context = context || element.parentNode;
            var decimal = toDecimal(value);
            var whole = null;
            var position = element.getStyle('position');

            var isHorizontal = property.include('left') || property.include('right') ||
       property.include('width');

            var isVertical = property.include('top') || property.include('bottom') ||
        property.include('height');

            if (context === document.viewport) {
                if (isHorizontal) {
                    whole = document.viewport.getWidth();
                } else if (isVertical) {
                    whole = document.viewport.getHeight();
                }
            } else {
                if (isHorizontal) {
                    whole = $(context).measure('width');
                } else if (isVertical) {
                    whole = $(context).measure('height');
                }
            }

            return (whole === null) ? 0 : whole * decimal;
        }

        return 0;
    }

    function toCSSPixels(number) {
        if (Object.isString(number) && number.endsWith('px')) {
            return number;
        }
        return number + 'px';
    }

    function isDisplayed(element) {
        var originalElement = element;
        while (element && element.parentNode) {
            var display = element.getStyle('display');
            if (display === 'none') {
                return false;
            }
            element = $(element.parentNode);
        }
        return true;
    }

    var hasLayout = Prototype.K;
    if ('currentStyle' in document.documentElement) {
        hasLayout = function(element) {
            if (!element.currentStyle.hasLayout) {
                element.style.zoom = 1;
            }
            return element;
        };
    }

    function cssNameFor(key) {
        if (key.include('border')) key = key + '-width';
        return key.camelize();
    }

    Element.Layout = Class.create(Hash, {
        initialize: function($super, element, preCompute) {
            $super();
            this.element = $(element);

            Element.Layout.PROPERTIES.each(function(property) {
                this._set(property, null);
            }, this);

            if (preCompute) {
                this._preComputing = true;
                this._begin();
                Element.Layout.PROPERTIES.each(this._compute, this);
                this._end();
                this._preComputing = false;
            }
        },

        _set: function(property, value) {
            return Hash.prototype.set.call(this, property, value);
        },

        set: function(property, value) {
            throw "Properties of Element.Layout are read-only.";
        },

        get: function($super, property) {
            var value = $super(property);
            return value === null ? this._compute(property) : value;
        },

        _begin: function() {
            if (this._prepared) return;

            var element = this.element;
            if (isDisplayed(element)) {
                this._prepared = true;
                return;
            }

            var originalStyles = {
                position: element.style.position || '',
                width: element.style.width || '',
                visibility: element.style.visibility || '',
                display: element.style.display || ''
            };

            element.store('prototype_original_styles', originalStyles);

            var position = element.getStyle('position'),
       width = element.getStyle('width');

            if (width === "0px" || width === null) {
                element.style.display = 'block';
                width = element.getStyle('width');
            }

            var context = (position === 'fixed') ? document.viewport :
       element.parentNode;

            element.setStyle({
                position: 'absolute',
                visibility: 'hidden',
                display: 'block'
            });

            var positionedWidth = element.getStyle('width');

            var newWidth;
            if (width && (positionedWidth === width)) {
                newWidth = getPixelValue(element, 'width', context);
            } else if (position === 'absolute' || position === 'fixed') {
                newWidth = getPixelValue(element, 'width', context);
            } else {
                var parent = element.parentNode, pLayout = $(parent).getLayout();

                newWidth = pLayout.get('width') -
         this.get('margin-left') -
         this.get('border-left') -
         this.get('padding-left') -
         this.get('padding-right') -
         this.get('border-right') -
         this.get('margin-right');
            }

            element.setStyle({ width: newWidth + 'px' });

            this._prepared = true;
        },

        _end: function() {
            var element = this.element;
            var originalStyles = element.retrieve('prototype_original_styles');
            element.store('prototype_original_styles', null);
            element.setStyle(originalStyles);
            this._prepared = false;
        },

        _compute: function(property) {
            var COMPUTATIONS = Element.Layout.COMPUTATIONS;
            if (!(property in COMPUTATIONS)) {
                throw "Property not found.";
            }

            return this._set(property, COMPUTATIONS[property].call(this, this.element));
        },

        toObject: function() {
            var args = $A(arguments);
            var keys = (args.length === 0) ? Element.Layout.PROPERTIES :
       args.join(' ').split(' ');
            var obj = {};
            keys.each(function(key) {
                if (!Element.Layout.PROPERTIES.include(key)) return;
                var value = this.get(key);
                if (value != null) obj[key] = value;
            }, this);
            return obj;
        },

        toHash: function() {
            var obj = this.toObject.apply(this, arguments);
            return new Hash(obj);
        },

        toCSS: function() {
            var args = $A(arguments);
            var keys = (args.length === 0) ? Element.Layout.PROPERTIES :
       args.join(' ').split(' ');
            var css = {};

            keys.each(function(key) {
                if (!Element.Layout.PROPERTIES.include(key)) return;
                if (Element.Layout.COMPOSITE_PROPERTIES.include(key)) return;

                var value = this.get(key);
                if (value != null) css[cssNameFor(key)] = value + 'px';
            }, this);
            return css;
        },

        inspect: function() {
            return "#<Element.Layout>";
        }
    });

    Object.extend(Element.Layout, {
        PROPERTIES: $w('height width top left right bottom border-left border-right border-top border-bottom padding-left padding-right padding-top padding-bottom margin-top margin-bottom margin-left margin-right padding-box-width padding-box-height border-box-width border-box-height margin-box-width margin-box-height'),

        COMPOSITE_PROPERTIES: $w('padding-box-width padding-box-height margin-box-width margin-box-height border-box-width border-box-height'),

        COMPUTATIONS: {
            'height': function(element) {
                if (!this._preComputing) this._begin();

                var bHeight = this.get('border-box-height');
                if (bHeight <= 0) {
                    if (!this._preComputing) this._end();
                    return 0;
                }

                var bTop = this.get('border-top'),
         bBottom = this.get('border-bottom');

                var pTop = this.get('padding-top'),
         pBottom = this.get('padding-bottom');

                if (!this._preComputing) this._end();

                return bHeight - bTop - bBottom - pTop - pBottom;
            },

            'width': function(element) {
                if (!this._preComputing) this._begin();

                var bWidth = this.get('border-box-width');
                if (bWidth <= 0) {
                    if (!this._preComputing) this._end();
                    return 0;
                }

                var bLeft = this.get('border-left'),
         bRight = this.get('border-right');

                var pLeft = this.get('padding-left'),
         pRight = this.get('padding-right');

                if (!this._preComputing) this._end();

                return bWidth - bLeft - bRight - pLeft - pRight;
            },

            'padding-box-height': function(element) {
                var height = this.get('height'),
         pTop = this.get('padding-top'),
         pBottom = this.get('padding-bottom');

                return height + pTop + pBottom;
            },

            'padding-box-width': function(element) {
                var width = this.get('width'),
         pLeft = this.get('padding-left'),
         pRight = this.get('padding-right');

                return width + pLeft + pRight;
            },

            'border-box-height': function(element) {
                if (!this._preComputing) this._begin();
                var height = element.offsetHeight;
                if (!this._preComputing) this._end();
                return height;
            },

            'border-box-width': function(element) {
                if (!this._preComputing) this._begin();
                var width = element.offsetWidth;
                if (!this._preComputing) this._end();
                return width;
            },

            'margin-box-height': function(element) {
                var bHeight = this.get('border-box-height'),
         mTop = this.get('margin-top'),
         mBottom = this.get('margin-bottom');

                if (bHeight <= 0) return 0;

                return bHeight + mTop + mBottom;
            },

            'margin-box-width': function(element) {
                var bWidth = this.get('border-box-width'),
         mLeft = this.get('margin-left'),
         mRight = this.get('margin-right');

                if (bWidth <= 0) return 0;

                return bWidth + mLeft + mRight;
            },

            'top': function(element) {
                var offset = element.positionedOffset();
                return offset.top;
            },

            'bottom': function(element) {
                var offset = element.positionedOffset(),
         parent = element.getOffsetParent(),
         pHeight = parent.measure('height');

                var mHeight = this.get('border-box-height');

                return pHeight - mHeight - offset.top;
            },

            'left': function(element) {
                var offset = element.positionedOffset();
                return offset.left;
            },

            'right': function(element) {
                var offset = element.positionedOffset(),
         parent = element.getOffsetParent(),
         pWidth = parent.measure('width');

                var mWidth = this.get('border-box-width');

                return pWidth - mWidth - offset.left;
            },

            'padding-top': function(element) {
                return getPixelValue(element, 'paddingTop');
            },

            'padding-bottom': function(element) {
                return getPixelValue(element, 'paddingBottom');
            },

            'padding-left': function(element) {
                return getPixelValue(element, 'paddingLeft');
            },

            'padding-right': function(element) {
                return getPixelValue(element, 'paddingRight');
            },

            'border-top': function(element) {
                return getPixelValue(element, 'borderTopWidth');
            },

            'border-bottom': function(element) {
                return getPixelValue(element, 'borderBottomWidth');
            },

            'border-left': function(element) {
                return getPixelValue(element, 'borderLeftWidth');
            },

            'border-right': function(element) {
                return getPixelValue(element, 'borderRightWidth');
            },

            'margin-top': function(element) {
                return getPixelValue(element, 'marginTop');
            },

            'margin-bottom': function(element) {
                return getPixelValue(element, 'marginBottom');
            },

            'margin-left': function(element) {
                return getPixelValue(element, 'marginLeft');
            },

            'margin-right': function(element) {
                return getPixelValue(element, 'marginRight');
            }
        }
    });

    if ('getBoundingClientRect' in document.documentElement) {
        Object.extend(Element.Layout.COMPUTATIONS, {
            'right': function(element) {
                var parent = hasLayout(element.getOffsetParent());
                var rect = element.getBoundingClientRect(),
         pRect = parent.getBoundingClientRect();

                return (pRect.right - rect.right).round();
            },

            'bottom': function(element) {
                var parent = hasLayout(element.getOffsetParent());
                var rect = element.getBoundingClientRect(),
         pRect = parent.getBoundingClientRect();

                return (pRect.bottom - rect.bottom).round();
            }
        });
    }

    Element.Offset = Class.create({
        initialize: function(left, top) {
            this.left = left.round();
            this.top = top.round();

            this[0] = this.left;
            this[1] = this.top;
        },

        relativeTo: function(offset) {
            return new Element.Offset(
        this.left - offset.left,
        this.top - offset.top
      );
        },

        inspect: function() {
            return "#<Element.Offset left: #{left} top: #{top}>".interpolate(this);
        },

        toString: function() {
            return "[#{left}, #{top}]".interpolate(this);
        },

        toArray: function() {
            return [this.left, this.top];
        }
    });

    function getLayout(element, preCompute) {
        return new Element.Layout(element, preCompute);
    }

    function measure(element, property) {
        return $(element).getLayout().get(property);
    }

    function getDimensions(element) {
        element = $(element);
        var display = Element.getStyle(element, 'display');

        if (display && display !== 'none') {
            return { width: element.offsetWidth, height: element.offsetHeight };
        }

        var style = element.style;
        var originalStyles = {
            visibility: style.visibility,
            position: style.position,
            display: style.display
        };

        var newStyles = {
            visibility: 'hidden',
            display: 'block'
        };

        if (originalStyles.position !== 'fixed')
            newStyles.position = 'absolute';

        Element.setStyle(element, newStyles);

        var dimensions = {
            width: element.offsetWidth,
            height: element.offsetHeight
        };

        Element.setStyle(element, originalStyles);

        return dimensions;
    }

    function getOffsetParent(element) {
        element = $(element);

        if (isDocument(element) || isDetached(element) || isBody(element) || isHtml(element))
            return $(document.body);

        var isInline = (Element.getStyle(element, 'display') === 'inline');
        if (!isInline && element.offsetParent) return $(element.offsetParent);

        while ((element = element.parentNode) && element !== document.body) {
            if (Element.getStyle(element, 'position') !== 'static') {
                return isHtml(element) ? $(document.body) : $(element);
            }
        }

        return $(document.body);
    }


    function cumulativeOffset(element) {
        element = $(element);
        var valueT = 0, valueL = 0;
        if (element.parentNode) {
            do {
                valueT += element.offsetTop || 0;
                valueL += element.offsetLeft || 0;
                element = element.offsetParent;
            } while (element);
        }
        return new Element.Offset(valueL, valueT);
    }

    function positionedOffset(element) {
        element = $(element);

        var layout = element.getLayout();

        var valueT = 0, valueL = 0;
        do {
            valueT += element.offsetTop || 0;
            valueL += element.offsetLeft || 0;
            element = element.offsetParent;
            if (element) {
                if (isBody(element)) break;
                var p = Element.getStyle(element, 'position');
                if (p !== 'static') break;
            }
        } while (element);

        valueL -= layout.get('margin-top');
        valueT -= layout.get('margin-left');

        return new Element.Offset(valueL, valueT);
    }

    function cumulativeScrollOffset(element) {
        var valueT = 0, valueL = 0;
        do {
            valueT += element.scrollTop || 0;
            valueL += element.scrollLeft || 0;
            element = element.parentNode;
        } while (element);
        return new Element.Offset(valueL, valueT);
    }

    function viewportOffset(forElement) {
        element = $(element);
        var valueT = 0, valueL = 0, docBody = document.body;

        var element = forElement;
        do {
            valueT += element.offsetTop || 0;
            valueL += element.offsetLeft || 0;
            if (element.offsetParent == docBody &&
        Element.getStyle(element, 'position') == 'absolute') break;
        } while (element = element.offsetParent);

        element = forElement;
        do {
            if (element != docBody) {
                valueT -= element.scrollTop || 0;
                valueL -= element.scrollLeft || 0;
            }
        } while (element = element.parentNode);
        return new Element.Offset(valueL, valueT);
    }

    function absolutize(element) {
        element = $(element);

        if (Element.getStyle(element, 'position') === 'absolute') {
            return element;
        }

        var offsetParent = getOffsetParent(element);
        var eOffset = element.viewportOffset(),
     pOffset = offsetParent.viewportOffset();

        var offset = eOffset.relativeTo(pOffset);
        var layout = element.getLayout();

        element.store('prototype_absolutize_original_styles', {
            left: element.getStyle('left'),
            top: element.getStyle('top'),
            width: element.getStyle('width'),
            height: element.getStyle('height')
        });

        element.setStyle({
            position: 'absolute',
            top: offset.top + 'px',
            left: offset.left + 'px',
            width: layout.get('width') + 'px',
            height: layout.get('height') + 'px'
        });

        return element;
    }

    function relativize(element) {
        element = $(element);
        if (Element.getStyle(element, 'position') === 'relative') {
            return element;
        }

        var originalStyles =
     element.retrieve('prototype_absolutize_original_styles');

        if (originalStyles) element.setStyle(originalStyles);
        return element;
    }

    if (Prototype.Browser.IE) {
        getOffsetParent = getOffsetParent.wrap(
      function(proceed, element) {
          element = $(element);

          if (isDocument(element) || isDetached(element) || isBody(element) || isHtml(element))
              return $(document.body);

          var position = element.getStyle('position');
          if (position !== 'static') return proceed(element);

          element.setStyle({ position: 'relative' });
          var value = proceed(element);
          element.setStyle({ position: position });
          return value;
      }
    );

        positionedOffset = positionedOffset.wrap(function(proceed, element) {
            element = $(element);
            if (!element.parentNode) return new Element.Offset(0, 0);
            var position = element.getStyle('position');
            if (position !== 'static') return proceed(element);

            var offsetParent = element.getOffsetParent();
            if (offsetParent && offsetParent.getStyle('position') === 'fixed')
                hasLayout(offsetParent);

            element.setStyle({ position: 'relative' });
            var value = proceed(element);
            element.setStyle({ position: position });
            return value;
        });
    } else if (Prototype.Browser.Webkit) {
        cumulativeOffset = function(element) {
            element = $(element);
            var valueT = 0, valueL = 0;
            do {
                valueT += element.offsetTop || 0;
                valueL += element.offsetLeft || 0;
                if (element.offsetParent == document.body)
                    if (Element.getStyle(element, 'position') == 'absolute') break;

                element = element.offsetParent;
            } while (element);

            return new Element.Offset(valueL, valueT);
        };
    }


    Element.addMethods({
        getLayout: getLayout,
        measure: measure,
        getDimensions: getDimensions,
        getOffsetParent: getOffsetParent,
        cumulativeOffset: cumulativeOffset,
        positionedOffset: positionedOffset,
        cumulativeScrollOffset: cumulativeScrollOffset,
        viewportOffset: viewportOffset,
        absolutize: absolutize,
        relativize: relativize
    });

    function isBody(element) {
        return element.nodeName.toUpperCase() === 'BODY';
    }

    function isHtml(element) {
        return element.nodeName.toUpperCase() === 'HTML';
    }

    function isDocument(element) {
        return element.nodeType === Node.DOCUMENT_NODE;
    }

    function isDetached(element) {
        return element !== document.body &&
     !Element.descendantOf(element, document.body);
    }

    if ('getBoundingClientRect' in document.documentElement) {
        Element.addMethods({
            viewportOffset: function(element) {
                element = $(element);
                if (isDetached(element)) return new Element.Offset(0, 0);

                var rect = element.getBoundingClientRect(),
         docEl = document.documentElement;
                return new Element.Offset(rect.left - docEl.clientLeft,
         rect.top - docEl.clientTop);
            }
        });
    }
})();
window.$$ = function() {
    var expression = $A(arguments).join(', ');
    return Prototype.Selector.select(expression, document);
};

Prototype.Selector = (function() {

    function select() {
        throw new Error('Method "Prototype.Selector.select" must be defined.');
    }

    function match() {
        throw new Error('Method "Prototype.Selector.match" must be defined.');
    }

    function find(elements, expression, index) {
        index = index || 0;
        var match = Prototype.Selector.match, length = elements.length, matchIndex = 0, i;

        for (i = 0; i < length; i++) {
            if (match(elements[i], expression) && index == matchIndex++) {
                return Element.extend(elements[i]);
            }
        }
    }

    function extendElements(elements) {
        for (var i = 0, length = elements.length; i < length; i++) {
            Element.extend(elements[i]);
        }
        return elements;
    }


    var K = Prototype.K;

    return {
        select: select,
        match: match,
        find: find,
        extendElements: (Element.extend === K) ? K : extendElements,
        extendElement: Element.extend
    };
})();
Prototype._original_property = window.Sizzle;
/*!
* Sizzle CSS Selector Engine - v1.0
*  Copyright 2009, The Dojo Foundation
*  Released under the MIT, BSD, and GPL Licenses.
*  More information: http://sizzlejs.com/
*/
(function() {

    var chunker = /((?:\((?:\([^()]+\)|[^()]+)+\)|\[(?:\[[^[\]]*\]|['"][^'"]*['"]|[^[\]'"]+)+\]|\\.|[^ >+~,(\[\\]+)+|[>+~])(\s*,\s*)?((?:.|\r|\n)*)/g,
	done = 0,
	toString = Object.prototype.toString,
	hasDuplicate = false,
	baseHasDuplicate = true;

    [0, 0].sort(function() {
        baseHasDuplicate = false;
        return 0;
    });

    var Sizzle = function(selector, context, results, seed) {
        results = results || [];
        var origContext = context = context || document;

        if (context.nodeType !== 1 && context.nodeType !== 9) {
            return [];
        }

        if (!selector || typeof selector !== "string") {
            return results;
        }

        var parts = [], m, set, checkSet, check, mode, extra, prune = true, contextXML = isXML(context),
		soFar = selector;

        while ((chunker.exec(""), m = chunker.exec(soFar)) !== null) {
            soFar = m[3];

            parts.push(m[1]);

            if (m[2]) {
                extra = m[3];
                break;
            }
        }

        if (parts.length > 1 && origPOS.exec(selector)) {
            if (parts.length === 2 && Expr.relative[parts[0]]) {
                set = posProcess(parts[0] + parts[1], context);
            } else {
                set = Expr.relative[parts[0]] ?
				[context] :
				Sizzle(parts.shift(), context);

                while (parts.length) {
                    selector = parts.shift();

                    if (Expr.relative[selector])
                        selector += parts.shift();

                    set = posProcess(selector, set);
                }
            }
        } else {
            if (!seed && parts.length > 1 && context.nodeType === 9 && !contextXML &&
				Expr.match.ID.test(parts[0]) && !Expr.match.ID.test(parts[parts.length - 1])) {
                var ret = Sizzle.find(parts.shift(), context, contextXML);
                context = ret.expr ? Sizzle.filter(ret.expr, ret.set)[0] : ret.set[0];
            }

            if (context) {
                var ret = seed ?
				{ expr: parts.pop(), set: makeArray(seed)} :
				Sizzle.find(parts.pop(), parts.length === 1 && (parts[0] === "~" || parts[0] === "+") && context.parentNode ? context.parentNode : context, contextXML);
                set = ret.expr ? Sizzle.filter(ret.expr, ret.set) : ret.set;

                if (parts.length > 0) {
                    checkSet = makeArray(set);
                } else {
                    prune = false;
                }

                while (parts.length) {
                    var cur = parts.pop(), pop = cur;

                    if (!Expr.relative[cur]) {
                        cur = "";
                    } else {
                        pop = parts.pop();
                    }

                    if (pop == null) {
                        pop = context;
                    }

                    Expr.relative[cur](checkSet, pop, contextXML);
                }
            } else {
                checkSet = parts = [];
            }
        }

        if (!checkSet) {
            checkSet = set;
        }

        if (!checkSet) {
            throw "Syntax error, unrecognized expression: " + (cur || selector);
        }

        if (toString.call(checkSet) === "[object Array]") {
            if (!prune) {
                results.push.apply(results, checkSet);
            } else if (context && context.nodeType === 1) {
                for (var i = 0; checkSet[i] != null; i++) {
                    if (checkSet[i] && (checkSet[i] === true || checkSet[i].nodeType === 1 && contains(context, checkSet[i]))) {
                        results.push(set[i]);
                    }
                }
            } else {
                for (var i = 0; checkSet[i] != null; i++) {
                    if (checkSet[i] && checkSet[i].nodeType === 1) {
                        results.push(set[i]);
                    }
                }
            }
        } else {
            makeArray(checkSet, results);
        }

        if (extra) {
            Sizzle(extra, origContext, results, seed);
            Sizzle.uniqueSort(results);
        }

        return results;
    };

    Sizzle.uniqueSort = function(results) {
        if (sortOrder) {
            hasDuplicate = baseHasDuplicate;
            results.sort(sortOrder);

            if (hasDuplicate) {
                for (var i = 1; i < results.length; i++) {
                    if (results[i] === results[i - 1]) {
                        results.splice(i--, 1);
                    }
                }
            }
        }

        return results;
    };

    Sizzle.matches = function(expr, set) {
        return Sizzle(expr, null, null, set);
    };

    Sizzle.find = function(expr, context, isXML) {
        var set, match;

        if (!expr) {
            return [];
        }

        for (var i = 0, l = Expr.order.length; i < l; i++) {
            var type = Expr.order[i], match;

            if ((match = Expr.leftMatch[type].exec(expr))) {
                var left = match[1];
                match.splice(1, 1);

                if (left.substr(left.length - 1) !== "\\") {
                    match[1] = (match[1] || "").replace(/\\/g, "");
                    set = Expr.find[type](match, context, isXML);
                    if (set != null) {
                        expr = expr.replace(Expr.match[type], "");
                        break;
                    }
                }
            }
        }

        if (!set) {
            set = context.getElementsByTagName("*");
        }

        return { set: set, expr: expr };
    };

    Sizzle.filter = function(expr, set, inplace, not) {
        var old = expr, result = [], curLoop = set, match, anyFound,
		isXMLFilter = set && set[0] && isXML(set[0]);

        while (expr && set.length) {
            for (var type in Expr.filter) {
                if ((match = Expr.match[type].exec(expr)) != null) {
                    var filter = Expr.filter[type], found, item;
                    anyFound = false;

                    if (curLoop == result) {
                        result = [];
                    }

                    if (Expr.preFilter[type]) {
                        match = Expr.preFilter[type](match, curLoop, inplace, result, not, isXMLFilter);

                        if (!match) {
                            anyFound = found = true;
                        } else if (match === true) {
                            continue;
                        }
                    }

                    if (match) {
                        for (var i = 0; (item = curLoop[i]) != null; i++) {
                            if (item) {
                                found = filter(item, match, i, curLoop);
                                var pass = not ^ !!found;

                                if (inplace && found != null) {
                                    if (pass) {
                                        anyFound = true;
                                    } else {
                                        curLoop[i] = false;
                                    }
                                } else if (pass) {
                                    result.push(item);
                                    anyFound = true;
                                }
                            }
                        }
                    }

                    if (found !== undefined) {
                        if (!inplace) {
                            curLoop = result;
                        }

                        expr = expr.replace(Expr.match[type], "");

                        if (!anyFound) {
                            return [];
                        }

                        break;
                    }
                }
            }

            if (expr == old) {
                if (anyFound == null) {
                    throw "Syntax error, unrecognized expression: " + expr;
                } else {
                    break;
                }
            }

            old = expr;
        }

        return curLoop;
    };

    var Expr = Sizzle.selectors = {
        order: ["ID", "NAME", "TAG"],
        match: {
            ID: /#((?:[\w\u00c0-\uFFFF-]|\\.)+)/,
            CLASS: /\.((?:[\w\u00c0-\uFFFF-]|\\.)+)/,
            NAME: /\[name=['"]*((?:[\w\u00c0-\uFFFF-]|\\.)+)['"]*\]/,
            ATTR: /\[\s*((?:[\w\u00c0-\uFFFF-]|\\.)+)\s*(?:(\S?=)\s*(['"]*)(.*?)\3|)\s*\]/,
            TAG: /^((?:[\w\u00c0-\uFFFF\*-]|\\.)+)/,
            CHILD: /:(only|nth|last|first)-child(?:\((even|odd|[\dn+-]*)\))?/,
            POS: /:(nth|eq|gt|lt|first|last|even|odd)(?:\((\d*)\))?(?=[^-]|$)/,
            PSEUDO: /:((?:[\w\u00c0-\uFFFF-]|\\.)+)(?:\((['"]*)((?:\([^\)]+\)|[^\2\(\)]*)+)\2\))?/
        },
        leftMatch: {},
        attrMap: {
            "class": "className",
            "for": "htmlFor"
        },
        attrHandle: {
            href: function(elem) {
                return elem.getAttribute("href");
            }
        },
        relative: {
            "+": function(checkSet, part, isXML) {
                var isPartStr = typeof part === "string",
				isTag = isPartStr && !/\W/.test(part),
				isPartStrNotTag = isPartStr && !isTag;

                if (isTag && !isXML) {
                    part = part.toUpperCase();
                }

                for (var i = 0, l = checkSet.length, elem; i < l; i++) {
                    if ((elem = checkSet[i])) {
                        while ((elem = elem.previousSibling) && elem.nodeType !== 1) { }

                        checkSet[i] = isPartStrNotTag || elem && elem.nodeName === part ?
						elem || false :
						elem === part;
                    }
                }

                if (isPartStrNotTag) {
                    Sizzle.filter(part, checkSet, true);
                }
            },
            ">": function(checkSet, part, isXML) {
                var isPartStr = typeof part === "string";

                if (isPartStr && !/\W/.test(part)) {
                    part = isXML ? part : part.toUpperCase();

                    for (var i = 0, l = checkSet.length; i < l; i++) {
                        var elem = checkSet[i];
                        if (elem) {
                            var parent = elem.parentNode;
                            checkSet[i] = parent.nodeName === part ? parent : false;
                        }
                    }
                } else {
                    for (var i = 0, l = checkSet.length; i < l; i++) {
                        var elem = checkSet[i];
                        if (elem) {
                            checkSet[i] = isPartStr ?
							elem.parentNode :
							elem.parentNode === part;
                        }
                    }

                    if (isPartStr) {
                        Sizzle.filter(part, checkSet, true);
                    }
                }
            },
            "": function(checkSet, part, isXML) {
                var doneName = done++, checkFn = dirCheck;

                if (!/\W/.test(part)) {
                    var nodeCheck = part = isXML ? part : part.toUpperCase();
                    checkFn = dirNodeCheck;
                }

                checkFn("parentNode", part, doneName, checkSet, nodeCheck, isXML);
            },
            "~": function(checkSet, part, isXML) {
                var doneName = done++, checkFn = dirCheck;

                if (typeof part === "string" && !/\W/.test(part)) {
                    var nodeCheck = part = isXML ? part : part.toUpperCase();
                    checkFn = dirNodeCheck;
                }

                checkFn("previousSibling", part, doneName, checkSet, nodeCheck, isXML);
            }
        },
        find: {
            ID: function(match, context, isXML) {
                if (typeof context.getElementById !== "undefined" && !isXML) {
                    var m = context.getElementById(match[1]);
                    return m ? [m] : [];
                }
            },
            NAME: function(match, context, isXML) {
                if (typeof context.getElementsByName !== "undefined") {
                    var ret = [], results = context.getElementsByName(match[1]);

                    for (var i = 0, l = results.length; i < l; i++) {
                        if (results[i].getAttribute("name") === match[1]) {
                            ret.push(results[i]);
                        }
                    }

                    return ret.length === 0 ? null : ret;
                }
            },
            TAG: function(match, context) {
                return context.getElementsByTagName(match[1]);
            }
        },
        preFilter: {
            CLASS: function(match, curLoop, inplace, result, not, isXML) {
                match = " " + match[1].replace(/\\/g, "") + " ";

                if (isXML) {
                    return match;
                }

                for (var i = 0, elem; (elem = curLoop[i]) != null; i++) {
                    if (elem) {
                        if (not ^ (elem.className && (" " + elem.className + " ").indexOf(match) >= 0)) {
                            if (!inplace)
                                result.push(elem);
                        } else if (inplace) {
                            curLoop[i] = false;
                        }
                    }
                }

                return false;
            },
            ID: function(match) {
                return match[1].replace(/\\/g, "");
            },
            TAG: function(match, curLoop) {
                for (var i = 0; curLoop[i] === false; i++) { }
                return curLoop[i] && isXML(curLoop[i]) ? match[1] : match[1].toUpperCase();
            },
            CHILD: function(match) {
                if (match[1] == "nth") {
                    var test = /(-?)(\d*)n((?:\+|-)?\d*)/.exec(
					match[2] == "even" && "2n" || match[2] == "odd" && "2n+1" ||
					!/\D/.test(match[2]) && "0n+" + match[2] || match[2]);

                    match[2] = (test[1] + (test[2] || 1)) - 0;
                    match[3] = test[3] - 0;
                }

                match[0] = done++;

                return match;
            },
            ATTR: function(match, curLoop, inplace, result, not, isXML) {
                var name = match[1].replace(/\\/g, "");

                if (!isXML && Expr.attrMap[name]) {
                    match[1] = Expr.attrMap[name];
                }

                if (match[2] === "~=") {
                    match[4] = " " + match[4] + " ";
                }

                return match;
            },
            PSEUDO: function(match, curLoop, inplace, result, not) {
                if (match[1] === "not") {
                    if ((chunker.exec(match[3]) || "").length > 1 || /^\w/.test(match[3])) {
                        match[3] = Sizzle(match[3], null, null, curLoop);
                    } else {
                        var ret = Sizzle.filter(match[3], curLoop, inplace, true ^ not);
                        if (!inplace) {
                            result.push.apply(result, ret);
                        }
                        return false;
                    }
                } else if (Expr.match.POS.test(match[0]) || Expr.match.CHILD.test(match[0])) {
                    return true;
                }

                return match;
            },
            POS: function(match) {
                match.unshift(true);
                return match;
            }
        },
        filters: {
            enabled: function(elem) {
                return elem.disabled === false && elem.type !== "hidden";
            },
            disabled: function(elem) {
                return elem.disabled === true;
            },
            checked: function(elem) {
                return elem.checked === true;
            },
            selected: function(elem) {
                elem.parentNode.selectedIndex;
                return elem.selected === true;
            },
            parent: function(elem) {
                return !!elem.firstChild;
            },
            empty: function(elem) {
                return !elem.firstChild;
            },
            has: function(elem, i, match) {
                return !!Sizzle(match[3], elem).length;
            },
            header: function(elem) {
                return /h\d/i.test(elem.nodeName);
            },
            text: function(elem) {
                return "text" === elem.type;
            },
            radio: function(elem) {
                return "radio" === elem.type;
            },
            checkbox: function(elem) {
                return "checkbox" === elem.type;
            },
            file: function(elem) {
                return "file" === elem.type;
            },
            password: function(elem) {
                return "password" === elem.type;
            },
            submit: function(elem) {
                return "submit" === elem.type;
            },
            image: function(elem) {
                return "image" === elem.type;
            },
            reset: function(elem) {
                return "reset" === elem.type;
            },
            button: function(elem) {
                return "button" === elem.type || elem.nodeName.toUpperCase() === "BUTTON";
            },
            input: function(elem) {
                return /input|select|textarea|button/i.test(elem.nodeName);
            }
        },
        setFilters: {
            first: function(elem, i) {
                return i === 0;
            },
            last: function(elem, i, match, array) {
                return i === array.length - 1;
            },
            even: function(elem, i) {
                return i % 2 === 0;
            },
            odd: function(elem, i) {
                return i % 2 === 1;
            },
            lt: function(elem, i, match) {
                return i < match[3] - 0;
            },
            gt: function(elem, i, match) {
                return i > match[3] - 0;
            },
            nth: function(elem, i, match) {
                return match[3] - 0 == i;
            },
            eq: function(elem, i, match) {
                return match[3] - 0 == i;
            }
        },
        filter: {
            PSEUDO: function(elem, match, i, array) {
                var name = match[1], filter = Expr.filters[name];

                if (filter) {
                    return filter(elem, i, match, array);
                } else if (name === "contains") {
                    return (elem.textContent || elem.innerText || "").indexOf(match[3]) >= 0;
                } else if (name === "not") {
                    var not = match[3];

                    for (var i = 0, l = not.length; i < l; i++) {
                        if (not[i] === elem) {
                            return false;
                        }
                    }

                    return true;
                }
            },
            CHILD: function(elem, match) {
                var type = match[1], node = elem;
                switch (type) {
                    case 'only':
                    case 'first':
                        while ((node = node.previousSibling)) {
                            if (node.nodeType === 1) return false;
                        }
                        if (type == 'first') return true;
                        node = elem;
                    case 'last':
                        while ((node = node.nextSibling)) {
                            if (node.nodeType === 1) return false;
                        }
                        return true;
                    case 'nth':
                        var first = match[2], last = match[3];

                        if (first == 1 && last == 0) {
                            return true;
                        }

                        var doneName = match[0],
						parent = elem.parentNode;

                        if (parent && (parent.sizcache !== doneName || !elem.nodeIndex)) {
                            var count = 0;
                            for (node = parent.firstChild; node; node = node.nextSibling) {
                                if (node.nodeType === 1) {
                                    node.nodeIndex = ++count;
                                }
                            }
                            parent.sizcache = doneName;
                        }

                        var diff = elem.nodeIndex - last;
                        if (first == 0) {
                            return diff == 0;
                        } else {
                            return (diff % first == 0 && diff / first >= 0);
                        }
                }
            },
            ID: function(elem, match) {
                return elem.nodeType === 1 && elem.getAttribute("id") === match;
            },
            TAG: function(elem, match) {
                return (match === "*" && elem.nodeType === 1) || elem.nodeName === match;
            },
            CLASS: function(elem, match) {
                return (" " + (elem.className || elem.getAttribute("class")) + " ")
				.indexOf(match) > -1;
            },
            ATTR: function(elem, match) {
                var name = match[1],
				result = Expr.attrHandle[name] ?
					Expr.attrHandle[name](elem) :
					elem[name] != null ?
						elem[name] :
						elem.getAttribute(name),
				value = result + "",
				type = match[2],
				check = match[4];

                return result == null ?
				type === "!=" :
				type === "=" ?
				value === check :
				type === "*=" ?
				value.indexOf(check) >= 0 :
				type === "~=" ?
				(" " + value + " ").indexOf(check) >= 0 :
				!check ?
				value && result !== false :
				type === "!=" ?
				value != check :
				type === "^=" ?
				value.indexOf(check) === 0 :
				type === "$=" ?
				value.substr(value.length - check.length) === check :
				type === "|=" ?
				value === check || value.substr(0, check.length + 1) === check + "-" :
				false;
            },
            POS: function(elem, match, i, array) {
                var name = match[2], filter = Expr.setFilters[name];

                if (filter) {
                    return filter(elem, i, match, array);
                }
            }
        }
    };

    var origPOS = Expr.match.POS;

    for (var type in Expr.match) {
        Expr.match[type] = new RegExp(Expr.match[type].source + /(?![^\[]*\])(?![^\(]*\))/.source);
        Expr.leftMatch[type] = new RegExp(/(^(?:.|\r|\n)*?)/.source + Expr.match[type].source);
    }

    var makeArray = function(array, results) {
        array = Array.prototype.slice.call(array, 0);

        if (results) {
            results.push.apply(results, array);
            return results;
        }

        return array;
    };

    try {
        Array.prototype.slice.call(document.documentElement.childNodes, 0);

    } catch (e) {
        makeArray = function(array, results) {
            var ret = results || [];

            if (toString.call(array) === "[object Array]") {
                Array.prototype.push.apply(ret, array);
            } else {
                if (typeof array.length === "number") {
                    for (var i = 0, l = array.length; i < l; i++) {
                        ret.push(array[i]);
                    }
                } else {
                    for (var i = 0; array[i]; i++) {
                        ret.push(array[i]);
                    }
                }
            }

            return ret;
        };
    }

    var sortOrder;

    if (document.documentElement.compareDocumentPosition) {
        sortOrder = function(a, b) {
            if (!a.compareDocumentPosition || !b.compareDocumentPosition) {
                if (a == b) {
                    hasDuplicate = true;
                }
                return 0;
            }

            var ret = a.compareDocumentPosition(b) & 4 ? -1 : a === b ? 0 : 1;
            if (ret === 0) {
                hasDuplicate = true;
            }
            return ret;
        };
    } else if ("sourceIndex" in document.documentElement) {
        sortOrder = function(a, b) {
            if (!a.sourceIndex || !b.sourceIndex) {
                if (a == b) {
                    hasDuplicate = true;
                }
                return 0;
            }

            var ret = a.sourceIndex - b.sourceIndex;
            if (ret === 0) {
                hasDuplicate = true;
            }
            return ret;
        };
    } else if (document.createRange) {
        sortOrder = function(a, b) {
            if (!a.ownerDocument || !b.ownerDocument) {
                if (a == b) {
                    hasDuplicate = true;
                }
                return 0;
            }

            var aRange = a.ownerDocument.createRange(), bRange = b.ownerDocument.createRange();
            aRange.setStart(a, 0);
            aRange.setEnd(a, 0);
            bRange.setStart(b, 0);
            bRange.setEnd(b, 0);
            var ret = aRange.compareBoundaryPoints(Range.START_TO_END, bRange);
            if (ret === 0) {
                hasDuplicate = true;
            }
            return ret;
        };
    }

    (function() {
        var form = document.createElement("div"),
		id = "script" + (new Date).getTime();
        form.innerHTML = "<a name='" + id + "'/>";

        var root = document.documentElement;
        root.insertBefore(form, root.firstChild);

        if (!!document.getElementById(id)) {
            Expr.find.ID = function(match, context, isXML) {
                if (typeof context.getElementById !== "undefined" && !isXML) {
                    var m = context.getElementById(match[1]);
                    return m ? m.id === match[1] || typeof m.getAttributeNode !== "undefined" && m.getAttributeNode("id").nodeValue === match[1] ? [m] : undefined : [];
                }
            };

            Expr.filter.ID = function(elem, match) {
                var node = typeof elem.getAttributeNode !== "undefined" && elem.getAttributeNode("id");
                return elem.nodeType === 1 && node && node.nodeValue === match;
            };
        }

        root.removeChild(form);
        root = form = null; // release memory in IE
    })();

    (function() {

        var div = document.createElement("div");
        div.appendChild(document.createComment(""));

        if (div.getElementsByTagName("*").length > 0) {
            Expr.find.TAG = function(match, context) {
                var results = context.getElementsByTagName(match[1]);

                if (match[1] === "*") {
                    var tmp = [];

                    for (var i = 0; results[i]; i++) {
                        if (results[i].nodeType === 1) {
                            tmp.push(results[i]);
                        }
                    }

                    results = tmp;
                }

                return results;
            };
        }

        div.innerHTML = "<a href='#'></a>";
        if (div.firstChild && typeof div.firstChild.getAttribute !== "undefined" &&
			div.firstChild.getAttribute("href") !== "#") {
            Expr.attrHandle.href = function(elem) {
                return elem.getAttribute("href", 2);
            };
        }

        div = null; // release memory in IE
    })();

    if (document.querySelectorAll) (function() {
        var oldSizzle = Sizzle, div = document.createElement("div");
        div.innerHTML = "<p class='TEST'></p>";

        if (div.querySelectorAll && div.querySelectorAll(".TEST").length === 0) {
            return;
        }

        Sizzle = function(query, context, extra, seed) {
            context = context || document;

            if (!seed && context.nodeType === 9 && !isXML(context)) {
                try {
                    return makeArray(context.querySelectorAll(query), extra);
                } catch (e) { }
            }

            return oldSizzle(query, context, extra, seed);
        };

        for (var prop in oldSizzle) {
            Sizzle[prop] = oldSizzle[prop];
        }

        div = null; // release memory in IE
    })();

    if (document.getElementsByClassName && document.documentElement.getElementsByClassName) (function() {
        var div = document.createElement("div");
        div.innerHTML = "<div class='test e'></div><div class='test'></div>";

        if (div.getElementsByClassName("e").length === 0)
            return;

        div.lastChild.className = "e";

        if (div.getElementsByClassName("e").length === 1)
            return;

        Expr.order.splice(1, 0, "CLASS");
        Expr.find.CLASS = function(match, context, isXML) {
            if (typeof context.getElementsByClassName !== "undefined" && !isXML) {
                return context.getElementsByClassName(match[1]);
            }
        };

        div = null; // release memory in IE
    })();

    function dirNodeCheck(dir, cur, doneName, checkSet, nodeCheck, isXML) {
        var sibDir = dir == "previousSibling" && !isXML;
        for (var i = 0, l = checkSet.length; i < l; i++) {
            var elem = checkSet[i];
            if (elem) {
                if (sibDir && elem.nodeType === 1) {
                    elem.sizcache = doneName;
                    elem.sizset = i;
                }
                elem = elem[dir];
                var match = false;

                while (elem) {
                    if (elem.sizcache === doneName) {
                        match = checkSet[elem.sizset];
                        break;
                    }

                    if (elem.nodeType === 1 && !isXML) {
                        elem.sizcache = doneName;
                        elem.sizset = i;
                    }

                    if (elem.nodeName === cur) {
                        match = elem;
                        break;
                    }

                    elem = elem[dir];
                }

                checkSet[i] = match;
            }
        }
    }

    function dirCheck(dir, cur, doneName, checkSet, nodeCheck, isXML) {
        var sibDir = dir == "previousSibling" && !isXML;
        for (var i = 0, l = checkSet.length; i < l; i++) {
            var elem = checkSet[i];
            if (elem) {
                if (sibDir && elem.nodeType === 1) {
                    elem.sizcache = doneName;
                    elem.sizset = i;
                }
                elem = elem[dir];
                var match = false;

                while (elem) {
                    if (elem.sizcache === doneName) {
                        match = checkSet[elem.sizset];
                        break;
                    }

                    if (elem.nodeType === 1) {
                        if (!isXML) {
                            elem.sizcache = doneName;
                            elem.sizset = i;
                        }
                        if (typeof cur !== "string") {
                            if (elem === cur) {
                                match = true;
                                break;
                            }

                        } else if (Sizzle.filter(cur, [elem]).length > 0) {
                            match = elem;
                            break;
                        }
                    }

                    elem = elem[dir];
                }

                checkSet[i] = match;
            }
        }
    }

    var contains = document.compareDocumentPosition ? function(a, b) {
        return a.compareDocumentPosition(b) & 16;
    } : function(a, b) {
        return a !== b && (a.contains ? a.contains(b) : true);
    };

    var isXML = function(elem) {
        return elem.nodeType === 9 && elem.documentElement.nodeName !== "HTML" ||
		!!elem.ownerDocument && elem.ownerDocument.documentElement.nodeName !== "HTML";
    };

    var posProcess = function(selector, context) {
        var tmpSet = [], later = "", match,
		root = context.nodeType ? [context] : context;

        while ((match = Expr.match.PSEUDO.exec(selector))) {
            later += match[0];
            selector = selector.replace(Expr.match.PSEUDO, "");
        }

        selector = Expr.relative[selector] ? selector + "*" : selector;

        for (var i = 0, l = root.length; i < l; i++) {
            Sizzle(selector, root[i], tmpSet);
        }

        return Sizzle.filter(later, tmpSet);
    };


    window.Sizzle = Sizzle;

})();

; (function(engine) {
    var extendElements = Prototype.Selector.extendElements;

    function select(selector, scope) {
        return extendElements(engine(selector, scope || document));
    }

    function match(element, selector) {
        return engine.matches(selector, [element]).length == 1;
    }

    Prototype.Selector.engine = engine;
    Prototype.Selector.select = select;
    Prototype.Selector.match = match;
})(Sizzle);

window.Sizzle = Prototype._original_property;
delete Prototype._original_property;

var Form = {
    reset: function(form) {
        form = $(form);
        form.reset();
        return form;
    },

    serializeElements: function(elements, options) {
        if (typeof options != 'object') options = { hash: !!options };
        else if (Object.isUndefined(options.hash)) options.hash = true;
        var key, value, submitted = false, submit = options.submit, accumulator, initial;

        if (options.hash) {
            initial = {};
            accumulator = function(result, key, value) {
                if (key in result) {
                    if (!Object.isArray(result[key])) result[key] = [result[key]];
                    result[key].push(value);
                } else result[key] = value;
                return result;
            };
        } else {
            initial = '';
            accumulator = function(result, key, value) {
                return result + (result ? '&' : '') + encodeURIComponent(key) + '=' + encodeURIComponent(value);
            }
        }

        return elements.inject(initial, function(result, element) {
            if (!element.disabled && element.name) {
                key = element.name; value = $(element).getValue();
                if (value != null && element.type != 'file' && (element.type != 'submit' || (!submitted &&
            submit !== false && (!submit || key == submit) && (submitted = true)))) {
                    result = accumulator(result, key, value);
                }
            }
            return result;
        });
    }
};

Form.Methods = {
    serialize: function(form, options) {
        return Form.serializeElements(Form.getElements(form), options);
    },

    getElements: function(form) {
        var elements = $(form).getElementsByTagName('*'),
        element,
        arr = [],
        serializers = Form.Element.Serializers;
        for (var i = 0; element = elements[i]; i++) {
            arr.push(element);
        }
        return arr.inject([], function(elements, child) {
            if (serializers[child.tagName.toLowerCase()])
                elements.push(Element.extend(child));
            return elements;
        })
    },

    getInputs: function(form, typeName, name) {
        form = $(form);
        var inputs = form.getElementsByTagName('input');

        if (!typeName && !name) return $A(inputs).map(Element.extend);

        for (var i = 0, matchingInputs = [], length = inputs.length; i < length; i++) {
            var input = inputs[i];
            if ((typeName && input.type != typeName) || (name && input.name != name))
                continue;
            matchingInputs.push(Element.extend(input));
        }

        return matchingInputs;
    },

    disable: function(form) {
        form = $(form);
        Form.getElements(form).invoke('disable');
        return form;
    },

    enable: function(form) {
        form = $(form);
        Form.getElements(form).invoke('enable');
        return form;
    },

    findFirstElement: function(form) {
        var elements = $(form).getElements().findAll(function(element) {
            return 'hidden' != element.type && !element.disabled;
        });
        var firstByIndex = elements.findAll(function(element) {
            return element.hasAttribute('tabIndex') && element.tabIndex >= 0;
        }).sortBy(function(element) { return element.tabIndex }).first();

        return firstByIndex ? firstByIndex : elements.find(function(element) {
            return /^(?:input|select|textarea)$/i.test(element.tagName);
        });
    },

    focusFirstElement: function(form) {
        form = $(form);
        var element = form.findFirstElement();
        if (element) element.activate();
        return form;
    },

    request: function(form, options) {
        form = $(form), options = Object.clone(options || {});

        var params = options.parameters, action = form.readAttribute('action') || '';
        if (action.blank()) action = window.location.href;
        options.parameters = form.serialize(true);

        if (params) {
            if (Object.isString(params)) params = params.toQueryParams();
            Object.extend(options.parameters, params);
        }

        if (form.hasAttribute('method') && !options.method)
            options.method = form.method;

        return new Ajax.Request(action, options);
    }
};

/*--------------------------------------------------------------------------*/


Form.Element = {
    focus: function(element) {
        $(element).focus();
        return element;
    },

    select: function(element) {
        $(element).select();
        return element;
    }
};

Form.Element.Methods = {

    serialize: function(element) {
        element = $(element);
        if (!element.disabled && element.name) {
            var value = element.getValue();
            if (value != undefined) {
                var pair = {};
                pair[element.name] = value;
                return Object.toQueryString(pair);
            }
        }
        return '';
    },

    getValue: function(element) {
        element = $(element);
        var method = element.tagName.toLowerCase();
        return Form.Element.Serializers[method](element);
    },

    setValue: function(element, value) {
        element = $(element);
        var method = element.tagName.toLowerCase();
        Form.Element.Serializers[method](element, value);
        return element;
    },

    clear: function(element) {
        $(element).value = '';
        return element;
    },

    present: function(element) {
        return $(element).value != '';
    },

    activate: function(element) {
        element = $(element);
        try {
            element.focus();
            if (element.select && (element.tagName.toLowerCase() != 'input' ||
          !(/^(?:button|reset|submit)$/i.test(element.type))))
                element.select();
        } catch (e) { }
        return element;
    },

    disable: function(element) {
        element = $(element);
        element.disabled = true;
        return element;
    },

    enable: function(element) {
        element = $(element);
        element.disabled = false;
        return element;
    }
};

/*--------------------------------------------------------------------------*/

var Field = Form.Element;

var $F = Form.Element.Methods.getValue;

/*--------------------------------------------------------------------------*/

Form.Element.Serializers = (function() {
    function input(element, value) {
        switch (element.type.toLowerCase()) {
            case 'checkbox':
            case 'radio':
                return inputSelector(element, value);
            default:
                return valueSelector(element, value);
        }
    }

    function inputSelector(element, value) {
        if (Object.isUndefined(value))
            return element.checked ? element.value : null;
        else element.checked = !!value;
    }

    function valueSelector(element, value) {
        if (Object.isUndefined(value)) return element.value;
        else element.value = value;
    }

    function select(element, value) {
        if (Object.isUndefined(value))
            return (element.type === 'select-one' ? selectOne : selectMany)(element);

        var opt, currentValue, single = !Object.isArray(value);
        for (var i = 0, length = element.length; i < length; i++) {
            opt = element.options[i];
            currentValue = this.optionValue(opt);
            if (single) {
                if (currentValue == value) {
                    opt.selected = true;
                    return;
                }
            }
            else opt.selected = value.include(currentValue);
        }
    }

    function selectOne(element) {
        var index = element.selectedIndex;
        return index >= 0 ? optionValue(element.options[index]) : null;
    }

    function selectMany(element) {
        var values, length = element.length;
        if (!length) return null;

        for (var i = 0, values = []; i < length; i++) {
            var opt = element.options[i];
            if (opt.selected) values.push(optionValue(opt));
        }
        return values;
    }

    function optionValue(opt) {
        return Element.hasAttribute(opt, 'value') ? opt.value : opt.text;
    }

    return {
        input: input,
        inputSelector: inputSelector,
        textarea: valueSelector,
        select: select,
        selectOne: selectOne,
        selectMany: selectMany,
        optionValue: optionValue,
        button: valueSelector
    };
})();

/*--------------------------------------------------------------------------*/


Abstract.TimedObserver = Class.create(PeriodicalExecuter, {
    initialize: function($super, element, frequency, callback) {
        $super(callback, frequency);
        this.element = $(element);
        this.lastValue = this.getValue();
    },

    execute: function() {
        var value = this.getValue();
        if (Object.isString(this.lastValue) && Object.isString(value) ?
        this.lastValue != value : String(this.lastValue) != String(value)) {
            this.callback(this.element, value);
            this.lastValue = value;
        }
    }
});

Form.Element.Observer = Class.create(Abstract.TimedObserver, {
    getValue: function() {
        return Form.Element.getValue(this.element);
    }
});

Form.Observer = Class.create(Abstract.TimedObserver, {
    getValue: function() {
        return Form.serialize(this.element);
    }
});

/*--------------------------------------------------------------------------*/

Abstract.EventObserver = Class.create({
    initialize: function(element, callback) {
        this.element = $(element);
        this.callback = callback;

        this.lastValue = this.getValue();
        if (this.element.tagName.toLowerCase() == 'form')
            this.registerFormCallbacks();
        else
            this.registerCallback(this.element);
    },

    onElementEvent: function() {
        var value = this.getValue();
        if (this.lastValue != value) {
            this.callback(this.element, value);
            this.lastValue = value;
        }
    },

    registerFormCallbacks: function() {
        Form.getElements(this.element).each(this.registerCallback, this);
    },

    registerCallback: function(element) {
        if (element.type) {
            switch (element.type.toLowerCase()) {
                case 'checkbox':
                case 'radio':
                    Event.observe(element, 'click', this.onElementEvent.bind(this));
                    break;
                default:
                    Event.observe(element, 'change', this.onElementEvent.bind(this));
                    break;
            }
        }
    }
});

Form.Element.EventObserver = Class.create(Abstract.EventObserver, {
    getValue: function() {
        return Form.Element.getValue(this.element);
    }
});

Form.EventObserver = Class.create(Abstract.EventObserver, {
    getValue: function() {
        return Form.serialize(this.element);
    }
});
(function() {

    var Event = {
        KEY_BACKSPACE: 8,
        KEY_TAB: 9,
        KEY_RETURN: 13,
        KEY_ESC: 27,
        KEY_LEFT: 37,
        KEY_UP: 38,
        KEY_RIGHT: 39,
        KEY_DOWN: 40,
        KEY_DELETE: 46,
        KEY_HOME: 36,
        KEY_END: 35,
        KEY_PAGEUP: 33,
        KEY_PAGEDOWN: 34,
        KEY_INSERT: 45,

        cache: {}
    };

    var docEl = document.documentElement;
    var MOUSEENTER_MOUSELEAVE_EVENTS_SUPPORTED = 'onmouseenter' in docEl
    && 'onmouseleave' in docEl;



    var isIELegacyEvent = function(event) { return false; };

    if (window.attachEvent) {
        if (window.addEventListener) {
            isIELegacyEvent = function(event) {
                return !(event instanceof window.Event);
            };
        } else {
            isIELegacyEvent = function(event) { return true; };
        }
    }

    var _isButton;

    function _isButtonForDOMEvents(event, code) {
        return event.which ? (event.which === code + 1) : (event.button === code);
    }

    var legacyButtonMap = { 0: 1, 1: 4, 2: 2 };
    function _isButtonForLegacyEvents(event, code) {
        return event.button === legacyButtonMap[code];
    }

    function _isButtonForWebKit(event, code) {
        switch (code) {
            case 0: return event.which == 1 && !event.metaKey;
            case 1: return event.which == 2 || (event.which == 1 && event.metaKey);
            case 2: return event.which == 3;
            default: return false;
        }
    }

    if (window.attachEvent) {
        if (!window.addEventListener) {
            _isButton = _isButtonForLegacyEvents;
        } else {
            _isButton = function(event, code) {
                return isIELegacyEvent(event) ? _isButtonForLegacyEvents(event, code) :
         _isButtonForDOMEvents(event, code);
            }
        }
    } else if (Prototype.Browser.WebKit) {
        _isButton = _isButtonForWebKit;
    } else {
        _isButton = _isButtonForDOMEvents;
    }

    function isLeftClick(event) { return _isButton(event, 0) }

    function isMiddleClick(event) { return _isButton(event, 1) }

    function isRightClick(event) { return _isButton(event, 2) }

    function element(event) {
        event = Event.extend(event);

        var node = event.target, type = event.type,
     currentTarget = event.currentTarget;

        if (currentTarget && currentTarget.tagName) {
            if (type === 'load' || type === 'error' ||
        (type === 'click' && currentTarget.tagName.toLowerCase() === 'input'
          && currentTarget.type === 'radio'))
                node = currentTarget;
        }

        if (node.nodeType == Node.TEXT_NODE)
            node = node.parentNode;

        return Element.extend(node);
    }

    function findElement(event, expression) {
        var element = Event.element(event);

        if (!expression) return element;
        while (element) {
            if (Object.isElement(element) && Prototype.Selector.match(element, expression)) {
                return Element.extend(element);
            }
            element = element.parentNode;
        }
    }

    function pointer(event) {
        return { x: pointerX(event), y: pointerY(event) };
    }

    function pointerX(event) {
        var docElement = document.documentElement,
     body = document.body || { scrollLeft: 0 };

        return event.pageX || (event.clientX +
      (docElement.scrollLeft || body.scrollLeft) -
      (docElement.clientLeft || 0));
    }

    function pointerY(event) {
        var docElement = document.documentElement,
     body = document.body || { scrollTop: 0 };

        return event.pageY || (event.clientY +
       (docElement.scrollTop || body.scrollTop) -
       (docElement.clientTop || 0));
    }


    function stop(event) {
        Event.extend(event);
        event.preventDefault();
        event.stopPropagation();

        event.stopped = true;
    }


    Event.Methods = {
        isLeftClick: isLeftClick,
        isMiddleClick: isMiddleClick,
        isRightClick: isRightClick,

        element: element,
        findElement: findElement,

        pointer: pointer,
        pointerX: pointerX,
        pointerY: pointerY,

        stop: stop
    };

    var methods = Object.keys(Event.Methods).inject({}, function(m, name) {
        m[name] = Event.Methods[name].methodize();
        return m;
    });

    if (window.attachEvent) {
        function _relatedTarget(event) {
            var element;
            switch (event.type) {
                case 'mouseover':
                case 'mouseenter':
                    element = event.fromElement;
                    break;
                case 'mouseout':
                case 'mouseleave':
                    element = event.toElement;
                    break;
                default:
                    return null;
            }
            return Element.extend(element);
        }

        var additionalMethods = {
            stopPropagation: function() { this.cancelBubble = true },
            preventDefault: function() { this.returnValue = false },
            inspect: function() { return '[object Event]' }
        };

        Event.extend = function(event, element) {
            if (!event) return false;

            if (!isIELegacyEvent(event)) return event;

            if (event._extendedByPrototype) return event;
            event._extendedByPrototype = Prototype.emptyFunction;

            var pointer = Event.pointer(event);

            Object.extend(event, {
                target: event.srcElement || element,
                relatedTarget: _relatedTarget(event),
                pageX: pointer.x,
                pageY: pointer.y
            });

            Object.extend(event, methods);
            Object.extend(event, additionalMethods);

            return event;
        };
    } else {
        Event.extend = Prototype.K;
    }

    if (window.addEventListener) {
        Event.prototype = window.Event.prototype || document.createEvent('HTMLEvents').__proto__;
        Object.extend(Event.prototype, methods);
    }

    function _createResponder(element, eventName, handler) {
        var registry = Element.retrieve(element, 'prototype_event_registry');

        if (Object.isUndefined(registry)) {
            CACHE.push(element);
            registry = Element.retrieve(element, 'prototype_event_registry', $H());
        }

        var respondersForEvent = registry.get(eventName);
        if (Object.isUndefined(respondersForEvent)) {
            respondersForEvent = [];
            registry.set(eventName, respondersForEvent);
        }

        if (respondersForEvent.pluck('handler').include(handler)) return false;

        var responder;
        if (eventName.include(":")) {
            responder = function(event) {
                if (Object.isUndefined(event.eventName))
                    return false;

                if (event.eventName !== eventName)
                    return false;

                Event.extend(event, element);
                handler.call(element, event);
            };
        } else {
            if (!MOUSEENTER_MOUSELEAVE_EVENTS_SUPPORTED &&
       (eventName === "mouseenter" || eventName === "mouseleave")) {
                if (eventName === "mouseenter" || eventName === "mouseleave") {
                    responder = function(event) {
                        Event.extend(event, element);

                        var parent = event.relatedTarget;
                        while (parent && parent !== element) {
                            try { parent = parent.parentNode; }
                            catch (e) { parent = element; }
                        }

                        if (parent === element) return;

                        handler.call(element, event);
                    };
                }
            } else {
                responder = function(event) {
                    Event.extend(event, element);
                    handler.call(element, event);
                };
            }
        }

        responder.handler = handler;
        respondersForEvent.push(responder);
        return responder;
    }

    function _destroyCache() {
        for (var i = 0, length = CACHE.length; i < length; i++) {
            Event.stopObserving(CACHE[i]);
            CACHE[i] = null;
        }
    }

    var CACHE = [];

    if (Prototype.Browser.IE)
        window.attachEvent('onunload', _destroyCache);

    if (Prototype.Browser.WebKit)
        window.addEventListener('unload', Prototype.emptyFunction, false);


    var _getDOMEventName = Prototype.K,
      translations = { mouseenter: "mouseover", mouseleave: "mouseout" };

    if (!MOUSEENTER_MOUSELEAVE_EVENTS_SUPPORTED) {
        _getDOMEventName = function(eventName) {
            return (translations[eventName] || eventName);
        };
    }

    function observe(element, eventName, handler) {
        element = $(element);

        var responder = _createResponder(element, eventName, handler);

        if (!responder) return element;

        if (eventName.include(':')) {
            if (element.addEventListener)
                element.addEventListener("dataavailable", responder, false);
            else {
                element.attachEvent("ondataavailable", responder);
                element.attachEvent("onlosecapture", responder);
            }
        } else {
            var actualEventName = _getDOMEventName(eventName);

            if (element.addEventListener)
                element.addEventListener(actualEventName, responder, false);
            else
                element.attachEvent("on" + actualEventName, responder);
        }

        return element;
    }

    function stopObserving(element, eventName, handler) {
        element = $(element);

        var registry = Element.retrieve(element, 'prototype_event_registry');
        if (!registry) return element;

        if (!eventName) {
            registry.each(function(pair) {
                var eventName = pair.key;
                stopObserving(element, eventName);
            });
            return element;
        }

        var responders = registry.get(eventName);
        if (!responders) return element;

        if (!handler) {
            responders.each(function(r) {
                stopObserving(element, eventName, r.handler);
            });
            return element;
        }

        var i = responders.length, responder;
        while (i--) {
            if (responders[i].handler === handler) {
                responder = responders[i];
                break;
            }
        }
        if (!responder) return element;

        if (eventName.include(':')) {
            if (element.removeEventListener)
                element.removeEventListener("dataavailable", responder, false);
            else {
                element.detachEvent("ondataavailable", responder);
                element.detachEvent("onlosecapture", responder);
            }
        } else {
            var actualEventName = _getDOMEventName(eventName);
            if (element.removeEventListener)
                element.removeEventListener(actualEventName, responder, false);
            else
                element.detachEvent('on' + actualEventName, responder);
        }

        registry.set(eventName, responders.without(responder));

        return element;
    }

    function fire(element, eventName, memo, bubble) {
        element = $(element);

        if (Object.isUndefined(bubble))
            bubble = true;

        if (element == document && document.createEvent && !element.dispatchEvent)
            element = document.documentElement;

        var event;
        if (document.createEvent) {
            event = document.createEvent('HTMLEvents');
            event.initEvent('dataavailable', bubble, true);
        } else {
            event = document.createEventObject();
            event.eventType = bubble ? 'ondataavailable' : 'onlosecapture';
        }

        event.eventName = eventName;
        event.memo = memo || {};

        if (document.createEvent)
            element.dispatchEvent(event);
        else
            element.fireEvent(event.eventType, event);

        return Event.extend(event);
    }

    Event.Handler = Class.create({
        initialize: function(element, eventName, selector, callback) {
            this.element = $(element);
            this.eventName = eventName;
            this.selector = selector;
            this.callback = callback;
            this.handler = this.handleEvent.bind(this);
        },

        start: function() {
            Event.observe(this.element, this.eventName, this.handler);
            return this;
        },

        stop: function() {
            Event.stopObserving(this.element, this.eventName, this.handler);
            return this;
        },

        handleEvent: function(event) {
            var element = Event.findElement(event, this.selector);
            if (element) this.callback.call(this.element, event, element);
        }
    });

    function on(element, eventName, selector, callback) {
        element = $(element);
        if (Object.isFunction(selector) && Object.isUndefined(callback)) {
            callback = selector, selector = null;
        }

        return new Event.Handler(element, eventName, selector, callback).start();
    }

    Object.extend(Event, Event.Methods);

    Object.extend(Event, {
        fire: fire,
        observe: observe,
        stopObserving: stopObserving,
        on: on
    });

    Element.addMethods({
        fire: fire,

        observe: observe,

        stopObserving: stopObserving,

        on: on
    });

    Object.extend(document, {
        fire: fire.methodize(),

        observe: observe.methodize(),

        stopObserving: stopObserving.methodize(),

        on: on.methodize(),

        loaded: false
    });

    if (window.Event) Object.extend(window.Event, Event);
    else window.Event = Event;
})();

(function() {
    /* Support for the DOMContentLoaded event is based on work by Dan Webb,
    Matthias Miller, Dean Edwards, John Resig, and Diego Perini. */

    var timer;

    function fireContentLoadedEvent() {
        if (document.loaded) return;
        if (timer) window.clearTimeout(timer);
        document.loaded = true;
        document.fire('dom:loaded');
    }

    function checkReadyState() {
        if (document.readyState === 'complete') {
            document.stopObserving('readystatechange', checkReadyState);
            fireContentLoadedEvent();
        }
    }

    function pollDoScroll() {
        try { document.documentElement.doScroll('left'); }
        catch (e) {
            timer = pollDoScroll.defer();
            return;
        }
        fireContentLoadedEvent();
    }

    if (document.addEventListener) {
        document.addEventListener('DOMContentLoaded', fireContentLoadedEvent, false);
    } else {
        document.observe('readystatechange', checkReadyState);
        if (window == top)
            timer = pollDoScroll.defer();
    }

    Event.observe(window, 'load', fireContentLoadedEvent);
})();

Element.addMethods();

/*------------------------------- DEPRECATED -------------------------------*/

Hash.toQueryString = Object.toQueryString;

var Toggle = { display: Element.toggle };

Element.Methods.childOf = Element.Methods.descendantOf;

var Insertion = {
    Before: function(element, content) {
        return Element.insert(element, { before: content });
    },

    Top: function(element, content) {
        return Element.insert(element, { top: content });
    },

    Bottom: function(element, content) {
        return Element.insert(element, { bottom: content });
    },

    After: function(element, content) {
        return Element.insert(element, { after: content });
    }
};

var $continue = new Error('"throw $continue" is deprecated, use "return" instead');

var Position = {
    includeScrollOffsets: false,

    prepare: function() {
        this.deltaX = window.pageXOffset
                || document.documentElement.scrollLeft
                || document.body.scrollLeft
                || 0;
        this.deltaY = window.pageYOffset
                || document.documentElement.scrollTop
                || document.body.scrollTop
                || 0;
    },

    within: function(element, x, y) {
        if (this.includeScrollOffsets)
            return this.withinIncludingScrolloffsets(element, x, y);
        this.xcomp = x;
        this.ycomp = y;
        this.offset = Element.cumulativeOffset(element);

        return (y >= this.offset[1] &&
            y < this.offset[1] + element.offsetHeight &&
            x >= this.offset[0] &&
            x < this.offset[0] + element.offsetWidth);
    },

    withinIncludingScrolloffsets: function(element, x, y) {
        var offsetcache = Element.cumulativeScrollOffset(element);

        this.xcomp = x + offsetcache[0] - this.deltaX;
        this.ycomp = y + offsetcache[1] - this.deltaY;
        this.offset = Element.cumulativeOffset(element);

        return (this.ycomp >= this.offset[1] &&
            this.ycomp < this.offset[1] + element.offsetHeight &&
            this.xcomp >= this.offset[0] &&
            this.xcomp < this.offset[0] + element.offsetWidth);
    },

    overlap: function(mode, element) {
        if (!mode) return 0;
        if (mode == 'vertical')
            return ((this.offset[1] + element.offsetHeight) - this.ycomp) /
        element.offsetHeight;
        if (mode == 'horizontal')
            return ((this.offset[0] + element.offsetWidth) - this.xcomp) /
        element.offsetWidth;
    },


    cumulativeOffset: Element.Methods.cumulativeOffset,

    positionedOffset: Element.Methods.positionedOffset,

    absolutize: function(element) {
        Position.prepare();
        return Element.absolutize(element);
    },

    relativize: function(element) {
        Position.prepare();
        return Element.relativize(element);
    },

    realOffset: Element.Methods.cumulativeScrollOffset,

    offsetParent: Element.Methods.getOffsetParent,

    page: Element.Methods.viewportOffset,

    clone: function(source, target, options) {
        options = options || {};
        return Element.clonePosition(target, source, options);
    }
};

/*--------------------------------------------------------------------------*/

if (!document.getElementsByClassName) document.getElementsByClassName = function(instanceMethods) {
    function iter(name) {
        return name.blank() ? null : "[contains(concat(' ', @class, ' '), ' " + name + " ')]";
    }

    instanceMethods.getElementsByClassName = Prototype.BrowserFeatures.XPath ?
  function(element, className) {
      className = className.toString().strip();
      var cond = /\s/.test(className) ? $w(className).map(iter).join('') : iter(className);
      return cond ? document._getElementsByXPath('.//*' + cond, element) : [];
  } : function(element, className) {
      className = className.toString().strip();
      var elements = [], classNames = (/\s/.test(className) ? $w(className) : null);
      if (!classNames && !className) return elements;

      var nodes = $(element).getElementsByTagName('*');
      className = ' ' + className + ' ';

      for (var i = 0, child, cn; child = nodes[i]; i++) {
          if (child.className && (cn = ' ' + child.className + ' ') && (cn.include(className) ||
          (classNames && classNames.all(function(name) {
              return !name.toString().blank() && cn.include(' ' + name + ' ');
          }))))
              elements.push(Element.extend(child));
      }
      return elements;
  };

    return function(className, parentElement) {
        return $(parentElement || document.body).getElementsByClassName(className);
    };
} (Element.Methods);

/*--------------------------------------------------------------------------*/

Element.ClassNames = Class.create();
Element.ClassNames.prototype = {
    initialize: function(element) {
        this.element = $(element);
    },

    _each: function(iterator) {
        this.element.className.split(/\s+/).select(function(name) {
            return name.length > 0;
        })._each(iterator);
    },

    set: function(className) {
        this.element.className = className;
    },

    add: function(classNameToAdd) {
        if (this.include(classNameToAdd)) return;
        this.set($A(this).concat(classNameToAdd).join(' '));
    },

    remove: function(classNameToRemove) {
        if (!this.include(classNameToRemove)) return;
        this.set($A(this).without(classNameToRemove).join(' '));
    },

    toString: function() {
        return $A(this).join(' ');
    }
};

Object.extend(Element.ClassNames.prototype, Enumerable);

/*--------------------------------------------------------------------------*/

(function() {
    window.Selector = Class.create({
        initialize: function(expression) {
            this.expression = expression.strip();
        },

        findElements: function(rootElement) {
            return Prototype.Selector.select(this.expression, rootElement);
        },

        match: function(element) {
            return Prototype.Selector.match(element, this.expression);
        },

        toString: function() {
            return this.expression;
        },

        inspect: function() {
            return "#<Selector: " + this.expression + ">";
        }
    });

    Object.extend(Selector, {
        matchElements: function(elements, expression) {
            var match = Prototype.Selector.match,
          results = [];

            for (var i = 0, length = elements.length; i < length; i++) {
                var element = elements[i];
                if (match(element, expression)) {
                    results.push(Element.extend(element));
                }
            }
            return results;
        },

        findElement: function(elements, expression, index) {
            index = index || 0;
            var matchIndex = 0, element;
            for (var i = 0, length = elements.length; i < length; i++) {
                element = elements[i];
                if (Prototype.Selector.match(element, expression) && index === matchIndex++) {
                    return Element.extend(element);
                }
            }
        },

        findChildElements: function(element, expressions) {
            var selector = expressions.toArray().join(', ');
            return Prototype.Selector.select(selector, element || document);
        }
    });
})();

/*--------------------------------------------------------------------------*/
// script.aculo.us effects.js v1.8.1, Thu Jan 03 22:07:12 -0500 2008

// Copyright (c) 2005-2007 Thomas Fuchs (http://script.aculo.us, http://mir.aculo.us)
// Contributors:
//  Justin Palmer (http://encytemedia.com/)
//  Mark Pilgrim (http://diveintomark.org/)
//  Martin Bialasinki
// 
// script.aculo.us is freely distributable under the terms of an MIT-style license.
// For details, see the script.aculo.us web site: http://script.aculo.us/ 

// converts rgb() and #xxx to #xxxxxx format,  
// returns self (or first argument) if not convertable  
String.prototype.parseColor = function() {
    var color = '#';
    if (this.slice(0, 4) == 'rgb(') {
        var cols = this.slice(4, this.length - 1).split(',');
        var i = 0; do { color += parseInt(cols[i]).toColorPart() } while (++i < 3);
    } else {
        if (this.slice(0, 1) == '#') {
            if (this.length == 4) for (var i = 1; i < 4; i++) color += (this.charAt(i) + this.charAt(i)).toLowerCase();
            if (this.length == 7) color = this.toLowerCase();
        }
    }
    return (color.length == 7 ? color : (arguments[0] || this));
};

/*--------------------------------------------------------------------------*/

Element.collectTextNodes = function(element) {
    return $A($(element).childNodes).collect(function(node) {
        return (node.nodeType == 3 ? node.nodeValue :
      (node.hasChildNodes() ? Element.collectTextNodes(node) : ''));
    }).flatten().join('');
};

Element.collectTextNodesIgnoreClass = function(element, className) {
    return $A($(element).childNodes).collect(function(node) {
        return (node.nodeType == 3 ? node.nodeValue :
      ((node.hasChildNodes() && !Element.hasClassName(node, className)) ?
        Element.collectTextNodesIgnoreClass(node, className) : ''));
    }).flatten().join('');
};

Element.setContentZoom = function(element, percent) {
    element = $(element);
    element.setStyle({ fontSize: (percent / 100) + 'em' });
    if (Prototype.Browser.WebKit) window.scrollBy(0, 0);
    return element;
};

Element.getInlineOpacity = function(element) {
    return $(element).style.opacity || '';
};

Element.forceRerendering = function(element) {
    try {
        element = $(element);
        var n = document.createTextNode(' ');
        element.appendChild(n);
        element.removeChild(n);
    } catch (e) { }
};

/*--------------------------------------------------------------------------*/

var Effect = {
    _elementDoesNotExistError: {
        name: 'ElementDoesNotExistError',
        message: 'The specified DOM element does not exist, but is required for this effect to operate'
    },
    Transitions: {
        linear: Prototype.K,
        sinoidal: function(pos) {
            return (-Math.cos(pos * Math.PI) / 2) + 0.5;
        },
        reverse: function(pos) {
            return 1 - pos;
        },
        flicker: function(pos) {
            var pos = ((-Math.cos(pos * Math.PI) / 4) + 0.75) + Math.random() / 4;
            return pos > 1 ? 1 : pos;
        },
        wobble: function(pos) {
            return (-Math.cos(pos * Math.PI * (9 * pos)) / 2) + 0.5;
        },
        pulse: function(pos, pulses) {
            pulses = pulses || 5;
            return (
        ((pos % (1 / pulses)) * pulses).round() == 0 ?
              ((pos * pulses * 2) - (pos * pulses * 2).floor()) :
          1 - ((pos * pulses * 2) - (pos * pulses * 2).floor())
        );
        },
        spring: function(pos) {
            return 1 - (Math.cos(pos * 4.5 * Math.PI) * Math.exp(-pos * 6));
        },
        none: function(pos) {
            return 0;
        },
        full: function(pos) {
            return 1;
        }
    },
    DefaultOptions: {
        duration: 1.0,   // seconds
        fps: 100,   // 100= assume 66fps max.
        sync: false, // true for combining
        from: 0.0,
        to: 1.0,
        delay: 0.0,
        queue: 'parallel'
    },
    tagifyText: function(element) {
        var tagifyStyle = 'position:relative';
        if (Prototype.Browser.IE) tagifyStyle += ';zoom:1';

        element = $(element);
        $A(element.childNodes).each(function(child) {
            if (child.nodeType == 3) {
                child.nodeValue.toArray().each(function(character) {
                    element.insertBefore(
            new Element('span', { style: tagifyStyle }).update(
              character == ' ' ? String.fromCharCode(160) : character),
              child);
                });
                Element.remove(child);
            }
        });
    },
    multiple: function(element, effect) {
        var elements;
        if (((typeof element == 'object') ||
        Object.isFunction(element)) &&
       (element.length))
            elements = element;
        else
            elements = $(element).childNodes;

        var options = Object.extend({
            speed: 0.1,
            delay: 0.0
        }, arguments[2] || {});
        var masterDelay = options.delay;

        $A(elements).each(function(element, index) {
            new effect(element, Object.extend(options, { delay: index * options.speed + masterDelay }));
        });
    },
    PAIRS: {
        'slide': ['SlideDown', 'SlideUp'],
        'blind': ['BlindDown', 'BlindUp'],
        'appear': ['Appear', 'Fade']
    },
    toggle: function(element, effect) {
        element = $(element);
        effect = (effect || 'appear').toLowerCase();
        var options = Object.extend({
            queue: { position: 'end', scope: (element.id || 'global'), limit: 1 }
        }, arguments[2] || {});
        Effect[element.visible() ?
      Effect.PAIRS[effect][1] : Effect.PAIRS[effect][0]](element, options);
    }
};

Effect.DefaultOptions.transition = Effect.Transitions.sinoidal;

/* ------------- core effects ------------- */

Effect.ScopedQueue = Class.create(Enumerable, {
    initialize: function() {
        this.effects = [];
        this.interval = null;
    },
    _each: function(iterator) {
        this.effects._each(iterator);
    },
    add: function(effect) {
        var timestamp = new Date().getTime();

        var position = Object.isString(effect.options.queue) ?
      effect.options.queue : effect.options.queue.position;

        switch (position) {
            case 'front':
                // move unstarted effects after this effect  
                this.effects.findAll(function(e) { return e.state == 'idle' }).each(function(e) {
                    e.startOn += effect.finishOn;
                    e.finishOn += effect.finishOn;
                });
                break;
            case 'with-last':
                timestamp = this.effects.pluck('startOn').max() || timestamp;
                break;
            case 'end':
                // start effect after last queued effect has finished
                timestamp = this.effects.pluck('finishOn').max() || timestamp;
                break;
        }

        effect.startOn += timestamp;
        effect.finishOn += timestamp;

        if (!effect.options.queue.limit || (this.effects.length < effect.options.queue.limit))
            this.effects.push(effect);

        if (!this.interval)
            this.interval = setInterval(this.loop.bind(this), 15);
    },
    remove: function(effect) {
        this.effects = this.effects.reject(function(e) { return e == effect });
        if (this.effects.length == 0) {
            clearInterval(this.interval);
            this.interval = null;
        }
    },
    loop: function() {
        var timePos = new Date().getTime();
        for (var i = 0, len = this.effects.length; i < len; i++)
            this.effects[i] && this.effects[i].loop(timePos);
    }
});

Effect.Queues = {
    instances: $H(),
    get: function(queueName) {
        if (!Object.isString(queueName)) return queueName;

        return this.instances.get(queueName) ||
      this.instances.set(queueName, new Effect.ScopedQueue());
    }
};
Effect.Queue = Effect.Queues.get('global');

Effect.Base = Class.create({
    position: null,
    start: function(options) {
        function codeForEvent(options, eventName) {
            return (
        (options[eventName + 'Internal'] ? 'this.options.' + eventName + 'Internal(this);' : '') +
        (options[eventName] ? 'this.options.' + eventName + '(this);' : '')
      );
        }
        if (options && options.transition === false) options.transition = Effect.Transitions.linear;
        this.options = Object.extend(Object.extend({}, Effect.DefaultOptions), options || {});
        this.currentFrame = 0;
        this.state = 'idle';
        this.startOn = this.options.delay * 1000;
        this.finishOn = this.startOn + (this.options.duration * 1000);
        this.fromToDelta = this.options.to - this.options.from;
        this.totalTime = this.finishOn - this.startOn;
        this.totalFrames = this.options.fps * this.options.duration;

        eval('this.render = function(pos){ ' +
      'if (this.state=="idle"){this.state="running";' +
      codeForEvent(this.options, 'beforeSetup') +
      (this.setup ? 'this.setup();' : '') +
      codeForEvent(this.options, 'afterSetup') +
      '};if (this.state=="running"){' +
      'pos=this.options.transition(pos)*' + this.fromToDelta + '+' + this.options.from + ';' +
      'this.position=pos;' +
      codeForEvent(this.options, 'beforeUpdate') +
      (this.update ? 'this.update(pos);' : '') +
      codeForEvent(this.options, 'afterUpdate') +
      '}}');

        this.event('beforeStart');
        if (!this.options.sync)
            Effect.Queues.get(Object.isString(this.options.queue) ?
        'global' : this.options.queue.scope).add(this);
    },
    loop: function(timePos) {
        if (timePos >= this.startOn) {
            if (timePos >= this.finishOn) {
                this.render(1.0);
                this.cancel();
                this.event('beforeFinish');
                if (this.finish) this.finish();
                this.event('afterFinish');
                return;
            }
            var pos = (timePos - this.startOn) / this.totalTime,
          frame = (pos * this.totalFrames).round();
            if (frame > this.currentFrame) {
                this.render(pos);
                this.currentFrame = frame;
            }
        }
    },
    cancel: function() {
        if (!this.options.sync)
            Effect.Queues.get(Object.isString(this.options.queue) ?
        'global' : this.options.queue.scope).remove(this);
        this.state = 'finished';
    },
    event: function(eventName) {
        if (this.options[eventName + 'Internal']) this.options[eventName + 'Internal'](this);
        if (this.options[eventName]) this.options[eventName](this);
    },
    inspect: function() {
        var data = $H();
        for (property in this)
            if (!Object.isFunction(this[property])) data.set(property, this[property]);
        return '#<Effect:' + data.inspect() + ',options:' + $H(this.options).inspect() + '>';
    }
});

Effect.Parallel = Class.create(Effect.Base, {
    initialize: function(effects) {
        this.effects = effects || [];
        this.start(arguments[1]);
    },
    update: function(position) {
        this.effects.invoke('render', position);
    },
    finish: function(position) {
        this.effects.each(function(effect) {
            effect.render(1.0);
            effect.cancel();
            effect.event('beforeFinish');
            if (effect.finish) effect.finish(position);
            effect.event('afterFinish');
        });
    }
});

Effect.Tween = Class.create(Effect.Base, {
    initialize: function(object, from, to) {
        object = Object.isString(object) ? $(object) : object;
        var args = $A(arguments), method = args.last(),
      options = args.length == 5 ? args[3] : null;
        this.method = Object.isFunction(method) ? method.bind(object) :
      Object.isFunction(object[method]) ? object[method].bind(object) :
      function(value) { object[method] = value };
        this.start(Object.extend({ from: from, to: to }, options || {}));
    },
    update: function(position) {
        this.method(position);
    }
});

Effect.Event = Class.create(Effect.Base, {
    initialize: function() {
        this.start(Object.extend({ duration: 0 }, arguments[0] || {}));
    },
    update: Prototype.emptyFunction
});

Effect.Opacity = Class.create(Effect.Base, {
    initialize: function(element) {
        this.element = $(element);
        if (!this.element) throw (Effect._elementDoesNotExistError);
        // make this work on IE on elements without 'layout'
        if (Prototype.Browser.IE && (!this.element.currentStyle.hasLayout))
            this.element.setStyle({ zoom: 1 });
        var options = Object.extend({
            from: this.element.getOpacity() || 0.0,
            to: 1.0
        }, arguments[1] || {});
        this.start(options);
    },
    update: function(position) {
        this.element.setOpacity(position);
    }
});

Effect.Move = Class.create(Effect.Base, {
    initialize: function(element) {
        this.element = $(element);
        if (!this.element) throw (Effect._elementDoesNotExistError);
        var options = Object.extend({
            x: 0,
            y: 0,
            mode: 'relative'
        }, arguments[1] || {});
        this.start(options);
    },
    setup: function() {
        this.element.makePositioned();
        this.originalLeft = parseFloat(this.element.getStyle('left') || '0');
        this.originalTop = parseFloat(this.element.getStyle('top') || '0');
        if (this.options.mode == 'absolute') {
            this.options.x = this.options.x - this.originalLeft;
            this.options.y = this.options.y - this.originalTop;
        }
    },
    update: function(position) {
        this.element.setStyle({
            left: (this.options.x * position + this.originalLeft).round() + 'px',
            top: (this.options.y * position + this.originalTop).round() + 'px'
        });
    }
});

// for backwards compatibility
Effect.MoveBy = function(element, toTop, toLeft) {
    return new Effect.Move(element,
    Object.extend({ x: toLeft, y: toTop }, arguments[3] || {}));
};

Effect.Scale = Class.create(Effect.Base, {
    initialize: function(element, percent) {
        this.element = $(element);
        if (!this.element) throw (Effect._elementDoesNotExistError);
        var options = Object.extend({
            scaleX: true,
            scaleY: true,
            scaleContent: true,
            scaleFromCenter: false,
            scaleMode: 'box',        // 'box' or 'contents' or { } with provided values
            scaleFrom: 100.0,
            scaleTo: percent
        }, arguments[2] || {});
        this.start(options);
    },
    setup: function() {
        this.restoreAfterFinish = this.options.restoreAfterFinish || false;
        this.elementPositioning = this.element.getStyle('position');

        this.originalStyle = {};
        ['top', 'left', 'width', 'height', 'fontSize'].each(function(k) {
            this.originalStyle[k] = this.element.style[k];
        } .bind(this));

        this.originalTop = this.element.offsetTop;
        this.originalLeft = this.element.offsetLeft;

        var fontSize = this.element.getStyle('font-size') || '100%';
        ['em', 'px', '%', 'pt'].each(function(fontSizeType) {
            if (fontSize.indexOf(fontSizeType) > 0) {
                this.fontSize = parseFloat(fontSize);
                this.fontSizeType = fontSizeType;
            }
        } .bind(this));

        this.factor = (this.options.scaleTo - this.options.scaleFrom) / 100;

        this.dims = null;
        if (this.options.scaleMode == 'box')
            this.dims = [this.element.offsetHeight, this.element.offsetWidth];
        if (/^content/.test(this.options.scaleMode))
            this.dims = [this.element.scrollHeight, this.element.scrollWidth];
        if (!this.dims)
            this.dims = [this.options.scaleMode.originalHeight,
                   this.options.scaleMode.originalWidth];
    },
    update: function(position) {
        var currentScale = (this.options.scaleFrom / 100.0) + (this.factor * position);
        if (this.options.scaleContent && this.fontSize)
            this.element.setStyle({ fontSize: this.fontSize * currentScale + this.fontSizeType });
        this.setDimensions(this.dims[0] * currentScale, this.dims[1] * currentScale);
    },
    finish: function(position) {
        if (this.restoreAfterFinish) this.element.setStyle(this.originalStyle);
    },
    setDimensions: function(height, width) {
        var d = {};
        if (this.options.scaleX) d.width = width.round() + 'px';
        if (this.options.scaleY) d.height = height.round() + 'px';
        if (this.options.scaleFromCenter) {
            var topd = (height - this.dims[0]) / 2;
            var leftd = (width - this.dims[1]) / 2;
            if (this.elementPositioning == 'absolute') {
                if (this.options.scaleY) d.top = this.originalTop - topd + 'px';
                if (this.options.scaleX) d.left = this.originalLeft - leftd + 'px';
            } else {
                if (this.options.scaleY) d.top = -topd + 'px';
                if (this.options.scaleX) d.left = -leftd + 'px';
            }
        }
        this.element.setStyle(d);
    }
});

Effect.Highlight = Class.create(Effect.Base, {
    initialize: function(element) {
        this.element = $(element);
        if (!this.element) throw (Effect._elementDoesNotExistError);
        var options = Object.extend({ startcolor: '#ffff99' }, arguments[1] || {});
        this.start(options);
    },
    setup: function() {
        // Prevent executing on elements not in the layout flow
        if (this.element.getStyle('display') == 'none') { this.cancel(); return; }
        // Disable background image during the effect
        this.oldStyle = {};
        if (!this.options.keepBackgroundImage) {
            this.oldStyle.backgroundImage = this.element.getStyle('background-image');
            this.element.setStyle({ backgroundImage: 'none' });
        }
        if (!this.options.endcolor)
            this.options.endcolor = this.element.getStyle('background-color').parseColor('#ffffff');
        if (!this.options.restorecolor)
            this.options.restorecolor = this.element.getStyle('background-color');
        // init color calculations
        this._base = $R(0, 2).map(function(i) { return parseInt(this.options.startcolor.slice(i * 2 + 1, i * 2 + 3), 16) } .bind(this));
        this._delta = $R(0, 2).map(function(i) { return parseInt(this.options.endcolor.slice(i * 2 + 1, i * 2 + 3), 16) - this._base[i] } .bind(this));
    },
    update: function(position) {
        this.element.setStyle({ backgroundColor: $R(0, 2).inject('#', function(m, v, i) {
            return m + ((this._base[i] + (this._delta[i] * position)).round().toColorPart());
        } .bind(this))
        });
    },
    finish: function() {
        this.element.setStyle(Object.extend(this.oldStyle, {
            backgroundColor: this.options.restorecolor
        }));
    }
});

Effect.ScrollTo = function(element) {
    var options = arguments[1] || {},
    scrollOffsets = document.viewport.getScrollOffsets(),
    elementOffsets = $(element).cumulativeOffset(),
    max = (window.height || document.body.scrollHeight) - document.viewport.getHeight();

    if (options.offset) elementOffsets[1] += options.offset;

    return new Effect.Tween(null,
    scrollOffsets.top,
    elementOffsets[1] > max ? max : elementOffsets[1],
    options,
    function(p) { scrollTo(scrollOffsets.left, p.round()) }
  );
};

/* ------------- combination effects ------------- */

Effect.Fade = function(element) {
    element = $(element);
    var oldOpacity = element.getInlineOpacity();
    var options = Object.extend({
        from: element.getOpacity() || 1.0,
        to: 0.0,
        afterFinishInternal: function(effect) {
            if (effect.options.to != 0) return;
            effect.element.hide().setStyle({ opacity: oldOpacity });
        }
    }, arguments[1] || {});
    return new Effect.Opacity(element, options);
};

Effect.Appear = function(element) {
    element = $(element);
    var options = Object.extend({
        from: (element.getStyle('display') == 'none' ? 0.0 : element.getOpacity() || 0.0),
        to: 1.0,
        // force Safari to render floated elements properly
        afterFinishInternal: function(effect) {
            effect.element.forceRerendering();
        },
        beforeSetup: function(effect) {
            effect.element.setOpacity(effect.options.from).show();
        } 
    }, arguments[1] || {});
    return new Effect.Opacity(element, options);
};

Effect.Puff = function(element) {
    element = $(element);
    var oldStyle = {
        opacity: element.getInlineOpacity(),
        position: element.getStyle('position'),
        top: element.style.top,
        left: element.style.left,
        width: element.style.width,
        height: element.style.height
    };
    return new Effect.Parallel(
   [new Effect.Scale(element, 200,
      { sync: true, scaleFromCenter: true, scaleContent: true, restoreAfterFinish: true }),
     new Effect.Opacity(element, { sync: true, to: 0.0 })],
     Object.extend({ duration: 1.0,
         beforeSetupInternal: function(effect) {
             Position.absolutize(effect.effects[0].element)
         },
         afterFinishInternal: function(effect) {
             effect.effects[0].element.hide().setStyle(oldStyle);
         }
     }, arguments[1] || {})
   );
};

Effect.BlindUp = function(element) {
    element = $(element);
    element.makeClipping();
    return new Effect.Scale(element, 0,
    Object.extend({ scaleContent: false,
        scaleX: false,
        restoreAfterFinish: true,
        afterFinishInternal: function(effect) {
            effect.element.hide().undoClipping();
        }
    }, arguments[1] || {})
  );
};

Effect.BlindDown = function(element) {
    element = $(element);
    var elementDimensions = element.getDimensions();
    return new Effect.Scale(element, 100, Object.extend({
        scaleContent: false,
        scaleX: false,
        scaleFrom: 0,
        scaleMode: { originalHeight: elementDimensions.height, originalWidth: elementDimensions.width },
        restoreAfterFinish: true,
        afterSetup: function(effect) {
            effect.element.makeClipping().setStyle({ height: '0px' }).show();
        },
        afterFinishInternal: function(effect) {
            effect.element.undoClipping();
        }
    }, arguments[1] || {}));
};

Effect.SwitchOff = function(element) {
    element = $(element);
    var oldOpacity = element.getInlineOpacity();
    return new Effect.Appear(element, Object.extend({
        duration: 0.4,
        from: 0,
        transition: Effect.Transitions.flicker,
        afterFinishInternal: function(effect) {
            new Effect.Scale(effect.element, 1, {
                duration: 0.3, scaleFromCenter: true,
                scaleX: false, scaleContent: false, restoreAfterFinish: true,
                beforeSetup: function(effect) {
                    effect.element.makePositioned().makeClipping();
                },
                afterFinishInternal: function(effect) {
                    effect.element.hide().undoClipping().undoPositioned().setStyle({ opacity: oldOpacity });
                }
            })
        }
    }, arguments[1] || {}));
};

Effect.DropOut = function(element) {
    element = $(element);
    var oldStyle = {
        top: element.getStyle('top'),
        left: element.getStyle('left'),
        opacity: element.getInlineOpacity()
    };
    return new Effect.Parallel(
    [new Effect.Move(element, { x: 0, y: 100, sync: true }),
      new Effect.Opacity(element, { sync: true, to: 0.0 })],
    Object.extend(
      { duration: 0.5,
          beforeSetup: function(effect) {
              effect.effects[0].element.makePositioned();
          },
          afterFinishInternal: function(effect) {
              effect.effects[0].element.hide().undoPositioned().setStyle(oldStyle);
          }
      }, arguments[1] || {}));
};

Effect.Shake = function(element) {
    element = $(element);
    var options = Object.extend({
        distance: 20,
        duration: 0.5
    }, arguments[1] || {});
    var distance = parseFloat(options.distance);
    var split = parseFloat(options.duration) / 10.0;
    var oldStyle = {
        top: element.getStyle('top'),
        left: element.getStyle('left')
    };
    return new Effect.Move(element,
      { x: distance, y: 0, duration: split, afterFinishInternal: function(effect) {
          new Effect.Move(effect.element,
      { x: -distance * 2, y: 0, duration: split * 2, afterFinishInternal: function(effect) {
          new Effect.Move(effect.element,
      { x: distance * 2, y: 0, duration: split * 2, afterFinishInternal: function(effect) {
          new Effect.Move(effect.element,
      { x: -distance * 2, y: 0, duration: split * 2, afterFinishInternal: function(effect) {
          new Effect.Move(effect.element,
      { x: distance * 2, y: 0, duration: split * 2, afterFinishInternal: function(effect) {
          new Effect.Move(effect.element,
      { x: -distance, y: 0, duration: split, afterFinishInternal: function(effect) {
          effect.element.undoPositioned().setStyle(oldStyle);
      } 
      })
      } 
      })
      } 
      })
      } 
      })
      } 
      })
      } 
      });
};

Effect.SlideDown = function(element) {
    element = $(element).cleanWhitespace();
    // SlideDown need to have the content of the element wrapped in a container element with fixed height!
    var oldInnerBottom = element.down().getStyle('bottom');
    var elementDimensions = element.getDimensions();
    return new Effect.Scale(element, 100, Object.extend({
        scaleContent: false,
        scaleX: false,
        scaleFrom: window.opera ? 0 : 1,
        scaleMode: { originalHeight: elementDimensions.height, originalWidth: elementDimensions.width },
        restoreAfterFinish: true,
        afterSetup: function(effect) {
            effect.element.makePositioned();
            effect.element.down().makePositioned();
            if (window.opera) effect.element.setStyle({ top: '' });
            effect.element.makeClipping().setStyle({ height: '0px' }).show();
        },
        afterUpdateInternal: function(effect) {
            effect.element.down().setStyle({ bottom:
        (effect.dims[0] - effect.element.clientHeight) + 'px'
            });
        },
        afterFinishInternal: function(effect) {
            effect.element.undoClipping().undoPositioned();
            effect.element.down().undoPositioned().setStyle({ bottom: oldInnerBottom });
        }
    }, arguments[1] || {})
  );
};

Effect.SlideUp = function(element) {
    element = $(element).cleanWhitespace();
    var oldInnerBottom = element.down().getStyle('bottom');
    var elementDimensions = element.getDimensions();
    return new Effect.Scale(element, window.opera ? 0 : 1,
   Object.extend({ scaleContent: false,
       scaleX: false,
       scaleMode: 'box',
       scaleFrom: 100,
       scaleMode: { originalHeight: elementDimensions.height, originalWidth: elementDimensions.width },
       restoreAfterFinish: true,
       afterSetup: function(effect) {
           effect.element.makePositioned();
           effect.element.down().makePositioned();
           if (window.opera) effect.element.setStyle({ top: '' });
           effect.element.makeClipping().show();
       },
       afterUpdateInternal: function(effect) {
           effect.element.down().setStyle({ bottom:
        (effect.dims[0] - effect.element.clientHeight) + 'px'
           });
       },
       afterFinishInternal: function(effect) {
           effect.element.hide().undoClipping().undoPositioned();
           effect.element.down().undoPositioned().setStyle({ bottom: oldInnerBottom });
       }
   }, arguments[1] || {})
  );
};

// Bug in opera makes the TD containing this element expand for a instance after finish 
Effect.Squish = function(element) {
    return new Effect.Scale(element, window.opera ? 1 : 0, {
        restoreAfterFinish: true,
        beforeSetup: function(effect) {
            effect.element.makeClipping();
        },
        afterFinishInternal: function(effect) {
            effect.element.hide().undoClipping();
        }
    });
};

Effect.Grow = function(element) {
    element = $(element);
    var options = Object.extend({
        direction: 'center',
        moveTransition: Effect.Transitions.sinoidal,
        scaleTransition: Effect.Transitions.sinoidal,
        opacityTransition: Effect.Transitions.full
    }, arguments[1] || {});
    var oldStyle = {
        top: element.style.top,
        left: element.style.left,
        height: element.style.height,
        width: element.style.width,
        opacity: element.getInlineOpacity()
    };

    var dims = element.getDimensions();
    var initialMoveX, initialMoveY;
    var moveX, moveY;

    switch (options.direction) {
        case 'top-left':
            initialMoveX = initialMoveY = moveX = moveY = 0;
            break;
        case 'top-right':
            initialMoveX = dims.width;
            initialMoveY = moveY = 0;
            moveX = -dims.width;
            break;
        case 'bottom-left':
            initialMoveX = moveX = 0;
            initialMoveY = dims.height;
            moveY = -dims.height;
            break;
        case 'bottom-right':
            initialMoveX = dims.width;
            initialMoveY = dims.height;
            moveX = -dims.width;
            moveY = -dims.height;
            break;
        case 'center':
            initialMoveX = dims.width / 2;
            initialMoveY = dims.height / 2;
            moveX = -dims.width / 2;
            moveY = -dims.height / 2;
            break;
    }

    return new Effect.Move(element, {
        x: initialMoveX,
        y: initialMoveY,
        duration: 0.01,
        beforeSetup: function(effect) {
            effect.element.hide().makeClipping().makePositioned();
        },
        afterFinishInternal: function(effect) {
            new Effect.Parallel(
        [new Effect.Opacity(effect.element, { sync: true, to: 1.0, from: 0.0, transition: options.opacityTransition }),
          new Effect.Move(effect.element, { x: moveX, y: moveY, sync: true, transition: options.moveTransition }),
          new Effect.Scale(effect.element, 100, {
              scaleMode: { originalHeight: dims.height, originalWidth: dims.width },
              sync: true, scaleFrom: window.opera ? 1 : 0, transition: options.scaleTransition, restoreAfterFinish: true
          })
        ], Object.extend({
            beforeSetup: function(effect) {
                effect.effects[0].element.setStyle({ height: '0px' }).show();
            },
            afterFinishInternal: function(effect) {
                effect.effects[0].element.undoClipping().undoPositioned().setStyle(oldStyle);
            }
        }, options)
      )
        }
    });
};

Effect.Shrink = function(element) {
    element = $(element);
    var options = Object.extend({
        direction: 'center',
        moveTransition: Effect.Transitions.sinoidal,
        scaleTransition: Effect.Transitions.sinoidal,
        opacityTransition: Effect.Transitions.none
    }, arguments[1] || {});
    var oldStyle = {
        top: element.style.top,
        left: element.style.left,
        height: element.style.height,
        width: element.style.width,
        opacity: element.getInlineOpacity()
    };

    var dims = element.getDimensions();
    var moveX, moveY;

    switch (options.direction) {
        case 'top-left':
            moveX = moveY = 0;
            break;
        case 'top-right':
            moveX = dims.width;
            moveY = 0;
            break;
        case 'bottom-left':
            moveX = 0;
            moveY = dims.height;
            break;
        case 'bottom-right':
            moveX = dims.width;
            moveY = dims.height;
            break;
        case 'center':
            moveX = dims.width / 2;
            moveY = dims.height / 2;
            break;
    }

    return new Effect.Parallel(
    [new Effect.Opacity(element, { sync: true, to: 0.0, from: 1.0, transition: options.opacityTransition }),
      new Effect.Scale(element, window.opera ? 1 : 0, { sync: true, transition: options.scaleTransition, restoreAfterFinish: true }),
      new Effect.Move(element, { x: moveX, y: moveY, sync: true, transition: options.moveTransition })
    ], Object.extend({
        beforeStartInternal: function(effect) {
            effect.effects[0].element.makePositioned().makeClipping();
        },
        afterFinishInternal: function(effect) {
            effect.effects[0].element.hide().undoClipping().undoPositioned().setStyle(oldStyle);
        }
    }, options)
  );
};

Effect.Pulsate = function(element) {
    element = $(element);
    var options = arguments[1] || {};
    var oldOpacity = element.getInlineOpacity();
    var transition = options.transition || Effect.Transitions.sinoidal;
    var reverser = function(pos) { return transition(1 - Effect.Transitions.pulse(pos, options.pulses)) };
    reverser.bind(transition);
    return new Effect.Opacity(element,
    Object.extend(Object.extend({ duration: 2.0, from: 0,
        afterFinishInternal: function(effect) { effect.element.setStyle({ opacity: oldOpacity }); }
    }, options), { transition: reverser }));
};

Effect.Fold = function(element) {
    element = $(element);
    var oldStyle = {
        top: element.style.top,
        left: element.style.left,
        width: element.style.width,
        height: element.style.height
    };
    element.makeClipping();
    return new Effect.Scale(element, 5, Object.extend({
        scaleContent: false,
        scaleX: false,
        afterFinishInternal: function(effect) {
            new Effect.Scale(element, 1, {
                scaleContent: false,
                scaleY: false,
                afterFinishInternal: function(effect) {
                    effect.element.hide().undoClipping().setStyle(oldStyle);
                } 
            });
        } 
    }, arguments[1] || {}));
};

Effect.Morph = Class.create(Effect.Base, {
    initialize: function(element) {
        this.element = $(element);
        if (!this.element) throw (Effect._elementDoesNotExistError);
        var options = Object.extend({
            style: {}
        }, arguments[1] || {});

        if (!Object.isString(options.style)) this.style = $H(options.style);
        else {
            if (options.style.include(':'))
                this.style = options.style.parseStyle();
            else {
                this.element.addClassName(options.style);
                this.style = $H(this.element.getStyles());
                this.element.removeClassName(options.style);
                var css = this.element.getStyles();
                this.style = this.style.reject(function(style) {
                    return style.value == css[style.key];
                });
                options.afterFinishInternal = function(effect) {
                    effect.element.addClassName(effect.options.style);
                    effect.transforms.each(function(transform) {
                        effect.element.style[transform.style] = '';
                    });
                }
            }
        }
        this.start(options);
    },

    setup: function() {
        function parseColor(color) {
            if (!color || ['rgba(0, 0, 0, 0)', 'transparent'].include(color)) color = '#ffffff';
            color = color.parseColor();
            return $R(0, 2).map(function(i) {
                return parseInt(color.slice(i * 2 + 1, i * 2 + 3), 16)
            });
        }
        this.transforms = this.style.map(function(pair) {
            var property = pair[0], value = pair[1], unit = null;

            if (value.parseColor('#zzzzzz') != '#zzzzzz') {
                value = value.parseColor();
                unit = 'color';
            } else if (property == 'opacity') {
                value = parseFloat(value);
                if (Prototype.Browser.IE && (!this.element.currentStyle.hasLayout))
                    this.element.setStyle({ zoom: 1 });
            } else if (Element.CSS_LENGTH.test(value)) {
                var components = value.match(/^([\+\-]?[0-9\.]+)(.*)$/);
                value = parseFloat(components[1]);
                unit = (components.length == 3) ? components[2] : null;
            }

            var originalValue = this.element.getStyle(property);
            return {
                style: property.camelize(),
                originalValue: unit == 'color' ? parseColor(originalValue) : parseFloat(originalValue || 0),
                targetValue: unit == 'color' ? parseColor(value) : value,
                unit: unit
            };
        } .bind(this)).reject(function(transform) {
            return (
        (transform.originalValue == transform.targetValue) ||
        (
          transform.unit != 'color' &&
          (isNaN(transform.originalValue) || isNaN(transform.targetValue))
        )
      )
        });
    },
    update: function(position) {
        var style = {}, transform, i = this.transforms.length;
        while (i--)
            style[(transform = this.transforms[i]).style] =
        transform.unit == 'color' ? '#' +
          (Math.round(transform.originalValue[0] +
            (transform.targetValue[0] - transform.originalValue[0]) * position)).toColorPart() +
          (Math.round(transform.originalValue[1] +
            (transform.targetValue[1] - transform.originalValue[1]) * position)).toColorPart() +
          (Math.round(transform.originalValue[2] +
            (transform.targetValue[2] - transform.originalValue[2]) * position)).toColorPart() :
        (transform.originalValue +
          (transform.targetValue - transform.originalValue) * position).toFixed(3) +
            (transform.unit === null ? '' : transform.unit);
        this.element.setStyle(style, true);
    }
});

Effect.Transform = Class.create({
    initialize: function(tracks) {
        this.tracks = [];
        this.options = arguments[1] || {};
        this.addTracks(tracks);
    },
    addTracks: function(tracks) {
        tracks.each(function(track) {
            track = $H(track);
            var data = track.values().first();
            this.tracks.push($H({
                ids: track.keys().first(),
                effect: Effect.Morph,
                options: { style: data }
            }));
        } .bind(this));
        return this;
    },
    play: function() {
        return new Effect.Parallel(
      this.tracks.map(function(track) {
          var ids = track.get('ids'), effect = track.get('effect'), options = track.get('options');
          var elements = [$(ids) || $$(ids)].flatten();
          return elements.map(function(e) { return new effect(e, Object.extend({ sync: true }, options)) });
      }).flatten(),
      this.options
    );
    }
});

Element.CSS_PROPERTIES = $w(
  'backgroundColor backgroundPosition borderBottomColor borderBottomStyle ' +
  'borderBottomWidth borderLeftColor borderLeftStyle borderLeftWidth ' +
  'borderRightColor borderRightStyle borderRightWidth borderSpacing ' +
  'borderTopColor borderTopStyle borderTopWidth bottom clip color ' +
  'fontSize fontWeight height left letterSpacing lineHeight ' +
  'marginBottom marginLeft marginRight marginTop markerOffset maxHeight ' +
  'maxWidth minHeight minWidth opacity outlineColor outlineOffset ' +
  'outlineWidth paddingBottom paddingLeft paddingRight paddingTop ' +
  'right textIndent top width wordSpacing zIndex');

Element.CSS_LENGTH = /^(([\+\-]?[0-9\.]+)(em|ex|px|in|cm|mm|pt|pc|\%))|0$/;

String.__parseStyleElement = document.createElement('div');
String.prototype.parseStyle = function() {
    var style, styleRules = $H();
    if (Prototype.Browser.WebKit)
        style = new Element('div', { style: this }).style;
    else {
        String.__parseStyleElement.innerHTML = '<div style="' + this + '"></div>';
        style = String.__parseStyleElement.childNodes[0].style;
    }

    Element.CSS_PROPERTIES.each(function(property) {
        if (style[property]) styleRules.set(property, style[property]);
    });

    if (Prototype.Browser.IE && this.include('opacity'))
        styleRules.set('opacity', this.match(/opacity:\s*((?:0|1)?(?:\.\d*)?)/)[1]);

    return styleRules;
};

if (document.defaultView && document.defaultView.getComputedStyle) {
    Element.getStyles = function(element) {
        var css = document.defaultView.getComputedStyle($(element), null);
        return Element.CSS_PROPERTIES.inject({}, function(styles, property) {
            styles[property] = css[property];
            return styles;
        });
    };
} else {
    Element.getStyles = function(element) {
        element = $(element);
        var css = element.currentStyle, styles;
        styles = Element.CSS_PROPERTIES.inject({}, function(results, property) {
            results[property] = css[property];
            return results;
        });
        if (!styles.opacity) styles.opacity = element.getOpacity();
        return styles;
    };
};

Effect.Methods = {
    morph: function(element, style) {
        element = $(element);
        new Effect.Morph(element, Object.extend({ style: style }, arguments[2] || {}));
        return element;
    },
    visualEffect: function(element, effect, options) {
        element = $(element)
        var s = effect.dasherize().camelize(), klass = s.charAt(0).toUpperCase() + s.substring(1);
        new Effect[klass](element, options);
        return element;
    },
    highlight: function(element, options) {
        element = $(element);
        new Effect.Highlight(element, options);
        return element;
    }
};

$w('fade appear grow shrink fold blindUp blindDown slideUp slideDown ' +
  'pulsate shake puff squish switchOff dropOut').each(
  function(effect) {
      Effect.Methods[effect] = function(element, options) {
          element = $(element);
          Effect[effect.charAt(0).toUpperCase() + effect.substring(1)](element, options);
          return element;
      }
  }
);

$w('getInlineOpacity forceRerendering setContentZoom collectTextNodes collectTextNodesIgnoreClass getStyles').each(
  function(f) { Effect.Methods[f] = Element[f]; }
);

Element.addMethods(Effect.Methods);
// script.aculo.us builder.js v1.8.1, Thu Jan 03 22:07:12 -0500 2008

// Copyright (c) 2005-2007 Thomas Fuchs (http://script.aculo.us, http://mir.aculo.us)
//
// script.aculo.us is freely distributable under the terms of an MIT-style license.
// For details, see the script.aculo.us web site: http://script.aculo.us/

var Builder = {
    NODEMAP: {
        AREA: 'map',
        CAPTION: 'table',
        COL: 'table',
        COLGROUP: 'table',
        LEGEND: 'fieldset',
        OPTGROUP: 'select',
        OPTION: 'select',
        PARAM: 'object',
        TBODY: 'table',
        TD: 'table',
        TFOOT: 'table',
        TH: 'table',
        THEAD: 'table',
        TR: 'table'
    },
    // note: For Firefox < 1.5, OPTION and OPTGROUP tags are currently broken,
    //       due to a Firefox bug
    node: function(elementName) {
        elementName = elementName.toUpperCase();

        // try innerHTML approach
        var parentTag = this.NODEMAP[elementName] || 'div';
        var parentElement = document.createElement(parentTag);
        try { // prevent IE "feature": http://dev.rubyonrails.org/ticket/2707
            parentElement.innerHTML = "<" + elementName + "></" + elementName + ">";
        } catch (e) { }
        var element = parentElement.firstChild || null;

        // see if browser added wrapping tags
        if (element && (element.tagName.toUpperCase() != elementName))
            element = element.getElementsByTagName(elementName)[0];

        // fallback to createElement approach
        if (!element) element = document.createElement(elementName);

        // abort if nothing could be created
        if (!element) return;

        // attributes (or text)
        if (arguments[1])
            if (this._isStringOrNumber(arguments[1]) ||
        (arguments[1] instanceof Array) ||
        arguments[1].tagName) {
            this._children(element, arguments[1]);
        } else {
            var attrs = this._attributes(arguments[1]);
            if (attrs.length) {
                try { // prevent IE "feature": http://dev.rubyonrails.org/ticket/2707
                    parentElement.innerHTML = "<" + elementName + " " +
                attrs + "></" + elementName + ">";
                } catch (e) { }
                element = parentElement.firstChild || null;
                // workaround firefox 1.0.X bug
                if (!element) {
                    element = document.createElement(elementName);
                    for (attr in arguments[1])
                        element[attr == 'class' ? 'className' : attr] = arguments[1][attr];
                }
                if (element.tagName.toUpperCase() != elementName)
                    element = parentElement.getElementsByTagName(elementName)[0];
            }
        }

        // text, or array of children
        if (arguments[2])
            this._children(element, arguments[2]);

        return element;
    },
    _text: function(text) {
        return document.createTextNode(text);
    },

    ATTR_MAP: {
        'className': 'class',
        'htmlFor': 'for'
    },

    _attributes: function(attributes) {
        var attrs = [];
        for (attribute in attributes)
            attrs.push((attribute in this.ATTR_MAP ? this.ATTR_MAP[attribute] : attribute) +
          '="' + attributes[attribute].toString().escapeHTML().gsub(/"/, '&quot;') + '"');
        return attrs.join(" ");
    },
    _children: function(element, children) {
        if (children.tagName) {
            element.appendChild(children);
            return;
        }
        if (typeof children == 'object') { // array can hold nodes and text
            children.flatten().each(function(e) {
                if (typeof e == 'object')
                    element.appendChild(e)
                else
                    if (Builder._isStringOrNumber(e))
                    element.appendChild(Builder._text(e));
            });
        } else
            if (Builder._isStringOrNumber(children))
            element.appendChild(Builder._text(children));
    },
    _isStringOrNumber: function(param) {
        return (typeof param == 'string' || typeof param == 'number');
    },
    build: function(html) {
        var element = this.node('div');
        $(element).update(html.strip());
        return element.down();
    },
    dump: function(scope) {
        if (typeof scope != 'object' && typeof scope != 'function') scope = window; //global scope 

        var tags = ("A ABBR ACRONYM ADDRESS APPLET AREA B BASE BASEFONT BDO BIG BLOCKQUOTE BODY " +
      "BR BUTTON CAPTION CENTER CITE CODE COL COLGROUP DD DEL DFN DIR DIV DL DT EM FIELDSET " +
      "FONT FORM FRAME FRAMESET H1 H2 H3 H4 H5 H6 HEAD HR HTML I IFRAME IMG INPUT INS ISINDEX " +
      "KBD LABEL LEGEND LI LINK MAP MENU META NOFRAMES NOSCRIPT OBJECT OL OPTGROUP OPTION P " +
      "PARAM PRE Q S SAMP SCRIPT SELECT SMALL SPAN STRIKE STRONG STYLE SUB SUP TABLE TBODY TD " +
      "TEXTAREA TFOOT TH THEAD TITLE TR TT U UL VAR").split(/\s+/);

        tags.each(function(tag) {
            scope[tag] = function() {
                return Builder.node.apply(Builder, [tag].concat($A(arguments)));
            }
        });
    }
}
// script.aculo.us dragdrop.js v1.8.1, Thu Jan 03 22:07:12 -0500 2008

// Copyright (c) 2005-2007 Thomas Fuchs (http://script.aculo.us, http://mir.aculo.us)
//           (c) 2005-2007 Sammi Williams (http://www.oriontransfer.co.nz, sammi@oriontransfer.co.nz)
// 
// script.aculo.us is freely distributable under the terms of an MIT-style license.
// For details, see the script.aculo.us web site: http://script.aculo.us/

if (Object.isUndefined(Effect))
    throw ("dragdrop.js requires including script.aculo.us' effects.js library");

var Droppables = {
    drops: [],

    remove: function(element) {
        this.drops = this.drops.reject(function(d) { return d.element == $(element) });
    },

    add: function(element) {
        element = $(element);
        var options = Object.extend({
            greedy: true,
            hoverclass: null,
            tree: false
        }, arguments[1] || {});

        // cache containers
        if (options.containment) {
            options._containers = [];
            var containment = options.containment;
            if (Object.isArray(containment)) {
                containment.each(function(c) { options._containers.push($(c)) });
            } else {
                options._containers.push($(containment));
            }
        }

        if (options.accept) options.accept = [options.accept].flatten();

        Element.makePositioned(element); // fix IE
        options.element = element;

        this.drops.push(options);
    },

    findDeepestChild: function(drops) {
        deepest = drops[0];

        for (i = 1; i < drops.length; ++i)
            if (Element.isParent(drops[i].element, deepest.element))
            deepest = drops[i];

        return deepest;
    },

    isContained: function(element, drop) {
        var containmentNode;
        if (drop.tree) {
            containmentNode = element.treeNode;
        } else {
            containmentNode = element.parentNode;
        }
        return drop._containers.detect(function(c) { return containmentNode == c });
    },

    isAffected: function(point, element, drop) {
        return (
      (drop.element != element) &&
      ((!drop._containers) ||
        this.isContained(element, drop)) &&
      ((!drop.accept) ||
        (Element.classNames(element).detect(
          function(v) { return drop.accept.include(v) }))) &&
      Position.within(drop.element, point[0], point[1]));
    },

    deactivate: function(drop) {
        if (drop.hoverclass)
            Element.removeClassName(drop.element, drop.hoverclass);
        this.last_active = null;
    },

    activate: function(drop) {
        if (drop.hoverclass)
            Element.addClassName(drop.element, drop.hoverclass);
        this.last_active = drop;
    },

    show: function(point, element) {
        if (!this.drops.length) return;
        var drop, affected = [];

        this.drops.each(function(drop) {
            if (Droppables.isAffected(point, element, drop))
                affected.push(drop);
        });

        if (affected.length > 0)
            drop = Droppables.findDeepestChild(affected);

        if (this.last_active && this.last_active != drop) this.deactivate(this.last_active);
        if (drop) {
            Position.within(drop.element, point[0], point[1]);
            if (drop.onHover)
                drop.onHover(element, drop.element, Position.overlap(drop.overlap, drop.element));

            if (drop != this.last_active) Droppables.activate(drop);
        }
    },

    fire: function(event, element) {
        if (!this.last_active) return;
        Position.prepare();

        if (this.isAffected([Event.pointerX(event), Event.pointerY(event)], element, this.last_active))
            if (this.last_active.onDrop) {
            this.last_active.onDrop(element, this.last_active.element, event);
            return true;
        }
    },

    reset: function() {
        if (this.last_active)
            this.deactivate(this.last_active);
    }
}

var Draggables = {
    drags: [],
    observers: [],

    register: function(draggable) {
        if (this.drags.length == 0) {
            this.eventMouseUp = this.endDrag.bindAsEventListener(this);
            this.eventMouseMove = this.updateDrag.bindAsEventListener(this);
            this.eventKeypress = this.keyPress.bindAsEventListener(this);

            Event.observe(document, "mouseup", this.eventMouseUp);
            Event.observe(document, "mousemove", this.eventMouseMove);
            Event.observe(document, "keypress", this.eventKeypress);
        }
        this.drags.push(draggable);
    },

    unregister: function(draggable) {
        this.drags = this.drags.reject(function(d) { return d == draggable });
        if (this.drags.length == 0) {
            Event.stopObserving(document, "mouseup", this.eventMouseUp);
            Event.stopObserving(document, "mousemove", this.eventMouseMove);
            Event.stopObserving(document, "keypress", this.eventKeypress);
        }
    },

    activate: function(draggable) {
        if (draggable.options.delay) {
            this._timeout = setTimeout(function() {
                Draggables._timeout = null;
                window.focus();
                Draggables.activeDraggable = draggable;
            } .bind(this), draggable.options.delay);
        } else {
            window.focus(); // allows keypress events if window isn't currently focused, fails for Safari
            this.activeDraggable = draggable;
        }
    },

    deactivate: function() {
        this.activeDraggable = null;
    },

    updateDrag: function(event) {
        if (!this.activeDraggable) return;
        var pointer = [Event.pointerX(event), Event.pointerY(event)];
        // Mozilla-based browsers fire successive mousemove events with
        // the same coordinates, prevent needless redrawing (moz bug?)
        if (this._lastPointer && (this._lastPointer.inspect() == pointer.inspect())) return;
        this._lastPointer = pointer;

        this.activeDraggable.updateDrag(event, pointer);
    },

    endDrag: function(event) {
        if (this._timeout) {
            clearTimeout(this._timeout);
            this._timeout = null;
        }
        if (!this.activeDraggable) return;
        this._lastPointer = null;
        this.activeDraggable.endDrag(event);
        this.activeDraggable = null;
    },

    keyPress: function(event) {
        if (this.activeDraggable)
            this.activeDraggable.keyPress(event);
    },

    addObserver: function(observer) {
        this.observers.push(observer);
        this._cacheObserverCallbacks();
    },

    removeObserver: function(element) {  // element instead of observer fixes mem leaks
        this.observers = this.observers.reject(function(o) { return o.element == element });
        this._cacheObserverCallbacks();
    },

    notify: function(eventName, draggable, event) {  // 'onStart', 'onEnd', 'onDrag'
        if (this[eventName + 'Count'] > 0)
            this.observers.each(function(o) {
                if (o[eventName]) o[eventName](eventName, draggable, event);
            });
        if (draggable.options[eventName]) draggable.options[eventName](draggable, event);
    },

    _cacheObserverCallbacks: function() {
        ['onStart', 'onEnd', 'onDrag'].each(function(eventName) {
            Draggables[eventName + 'Count'] = Draggables.observers.select(
        function(o) { return o[eventName]; }
      ).length;
        });
    }
}

/*--------------------------------------------------------------------------*/

var Draggable = Class.create({
    initialize: function(element) {
        var defaults = {
            handle: false,
            reverteffect: function(element, top_offset, left_offset) {
                var dur = Math.sqrt(Math.abs(top_offset ^ 2) + Math.abs(left_offset ^ 2)) * 0.02;
                new Effect.Move(element, { x: -left_offset, y: -top_offset, duration: dur,
                    queue: { scope: '_draggable', position: 'end' }
                });
            },
            endeffect: function(element) {
                var toOpacity = Object.isNumber(element._opacity) ? element._opacity : 1.0;
                new Effect.Opacity(element, { duration: 0.2, from: 0.7, to: toOpacity,
                    queue: { scope: '_draggable', position: 'end' },
                    afterFinish: function() {
                        Draggable._dragging[element] = false
                    }
                });
            },
            zindex: 1000,
            revert: false,
            quiet: false,
            scroll: false,
            scrollSensitivity: 20,
            scrollSpeed: 15,
            snap: false,  // false, or xy or [x,y] or function(x,y){ return [x,y] }
            delay: 0
        };

        if (!arguments[1] || Object.isUndefined(arguments[1].endeffect))
            Object.extend(defaults, {
                starteffect: function(element) {
                    element._opacity = Element.getOpacity(element);
                    Draggable._dragging[element] = true;
                    new Effect.Opacity(element, { duration: 0.2, from: element._opacity, to: 0.7 });
                }
            });

        var options = Object.extend(defaults, arguments[1] || {});

        this.element = $(element);

        if (options.handle && Object.isString(options.handle))
            this.handle = this.element.down('.' + options.handle, 0);

        if (!this.handle) this.handle = $(options.handle);
        if (!this.handle) this.handle = this.element;

        if (options.scroll && !options.scroll.scrollTo && !options.scroll.outerHTML) {
            options.scroll = $(options.scroll);
            this._isScrollChild = Element.childOf(this.element, options.scroll);
        }

        Element.makePositioned(this.element); // fix IE    

        this.options = options;
        this.dragging = false;

        this.eventMouseDown = this.initDrag.bindAsEventListener(this);
        Event.observe(this.handle, "mousedown", this.eventMouseDown);

        Draggables.register(this);
    },

    destroy: function() {
        Event.stopObserving(this.handle, "mousedown", this.eventMouseDown);
        Draggables.unregister(this);
    },

    currentDelta: function() {
        return ([
      parseInt(Element.getStyle(this.element, 'left') || '0'),
      parseInt(Element.getStyle(this.element, 'top') || '0')]);
    },

    initDrag: function(event) {
        if (!Object.isUndefined(Draggable._dragging[this.element]) &&
      Draggable._dragging[this.element]) return;
        if (Event.isLeftClick(event)) {
            // abort on form elements, fixes a Firefox issue
            var src = Event.element(event);
            if ((tag_name = src.tagName.toUpperCase()) && (
        tag_name == 'INPUT' ||
        tag_name == 'SELECT' ||
        tag_name == 'OPTION' ||
        tag_name == 'BUTTON' ||
        tag_name == 'TEXTAREA')) return;

            var pointer = [Event.pointerX(event), Event.pointerY(event)];
            var pos = Position.cumulativeOffset(this.element);
            this.offset = [0, 1].map(function(i) { return (pointer[i] - pos[i]) });

            Draggables.activate(this);
            Event.stop(event);
        }
    },

    startDrag: function(event) {
        this.dragging = true;
        if (!this.delta)
            this.delta = this.currentDelta();

        if (this.options.zindex) {
            this.originalZ = parseInt(Element.getStyle(this.element, 'z-index') || 0);
            this.element.style.zIndex = this.options.zindex;
        }

        if (this.options.ghosting) {
            this._clone = this.element.cloneNode(true);
            this.element._originallyAbsolute = (this.element.getStyle('position') == 'absolute');
            if (!this.element._originallyAbsolute)
                Position.absolutize(this.element);
            this.element.parentNode.insertBefore(this._clone, this.element);
        }

        if (this.options.scroll) {
            if (this.options.scroll == window) {
                var where = this._getWindowScroll(this.options.scroll);
                this.originalScrollLeft = where.left;
                this.originalScrollTop = where.top;
            } else {
                this.originalScrollLeft = this.options.scroll.scrollLeft;
                this.originalScrollTop = this.options.scroll.scrollTop;
            }
        }

        Draggables.notify('onStart', this, event);

        if (this.options.starteffect) this.options.starteffect(this.element);
    },

    updateDrag: function(event, pointer) {
        if (!this.dragging) this.startDrag(event);

        if (!this.options.quiet) {
            Position.prepare();
            Droppables.show(pointer, this.element);
        }

        Draggables.notify('onDrag', this, event);

        this.draw(pointer);
        if (this.options.change) this.options.change(this);

        if (this.options.scroll) {
            this.stopScrolling();

            var p;
            if (this.options.scroll == window) {
                with (this._getWindowScroll(this.options.scroll)) { p = [left, top, left + width, top + height]; }
            } else {
				//Fix a bug from 1.7 Postion.page do not get an array
                p = Position.page(this.options.scroll).toArray();
                p[0] += this.options.scroll.scrollLeft + Position.deltaX;
                p[1] += this.options.scroll.scrollTop + Position.deltaY;
                p.push(p[0] + this.options.scroll.offsetWidth);
                p.push(p[1] + this.options.scroll.offsetHeight);
            }
            var speed = [0, 0];
            if (pointer[0] < (p[0] + this.options.scrollSensitivity)) speed[0] = pointer[0] - (p[0] + this.options.scrollSensitivity);
            if (pointer[1] < (p[1] + this.options.scrollSensitivity)) speed[1] = pointer[1] - (p[1] + this.options.scrollSensitivity);
            if (pointer[0] > (p[2] - this.options.scrollSensitivity)) speed[0] = pointer[0] - (p[2] - this.options.scrollSensitivity);
            if (pointer[1] > (p[3] - this.options.scrollSensitivity)) speed[1] = pointer[1] - (p[3] - this.options.scrollSensitivity);
            this.startScrolling(speed);
        }

        // fix AppleWebKit rendering
        if (Prototype.Browser.WebKit) window.scrollBy(0, 0);

        Event.stop(event);
    },

    finishDrag: function(event, success) {
        this.dragging = false;

        if (this.options.quiet) {
            Position.prepare();
            var pointer = [Event.pointerX(event), Event.pointerY(event)];
            Droppables.show(pointer, this.element);
        }

        if (this.options.ghosting) {
            if (!this.element._originallyAbsolute)
                Position.relativize(this.element);
            delete this.element._originallyAbsolute;
            Element.remove(this._clone);
            this._clone = null;
        }

        var dropped = false;
        if (success) {
            dropped = Droppables.fire(event, this.element);
            if (!dropped) dropped = false;
        }
        if (dropped && this.options.onDropped) this.options.onDropped(this.element);
        Draggables.notify('onEnd', this, event);

        var revert = this.options.revert;
        if (revert && Object.isFunction(revert)) revert = revert(this.element);

        var d = this.currentDelta();
        if (revert && this.options.reverteffect) {
            if (dropped == 0 || revert != 'failure')
                this.options.reverteffect(this.element,
          d[1] - this.delta[1], d[0] - this.delta[0]);
        } else {
            this.delta = d;
        }

        if (this.options.zindex)
            this.element.style.zIndex = this.originalZ;

        if (this.options.endeffect)
            this.options.endeffect(this.element);

        Draggables.deactivate(this);
        Droppables.reset();
    },

    keyPress: function(event) {
        if (event.keyCode != Event.KEY_ESC) return;
        this.finishDrag(event, false);
        Event.stop(event);
    },

    endDrag: function(event) {
        if (!this.dragging) return;
        this.stopScrolling();
        this.finishDrag(event, true);
        Event.stop(event);
    },

    draw: function(point) {
        var pos = Position.cumulativeOffset(this.element);
        if (this.options.ghosting) {
            var r = Position.realOffset(this.element);
            pos[0] += r[0] - Position.deltaX; pos[1] += r[1] - Position.deltaY;
        }

        var d = this.currentDelta();
        pos[0] -= d[0]; pos[1] -= d[1];

        if (this.options.scroll && (this.options.scroll != window && this._isScrollChild)) {
            pos[0] -= this.options.scroll.scrollLeft - this.originalScrollLeft;
            pos[1] -= this.options.scroll.scrollTop - this.originalScrollTop;
        }

        var p = [0, 1].map(function(i) {
            return (point[i] - pos[i] - this.offset[i])
        } .bind(this));

        if (this.options.snap) {
            if (Object.isFunction(this.options.snap)) {
                p = this.options.snap(p[0], p[1], this);
            } else {
                if (Object.isArray(this.options.snap)) {
                    p = p.map(function(v, i) {
                        return (v / this.options.snap[i]).round() * this.options.snap[i]
                    } .bind(this))
                } else {
                    p = p.map(function(v) {
                        return (v / this.options.snap).round() * this.options.snap
                    } .bind(this))
                }
            } 
        }

        var style = this.element.style;
        if ((!this.options.constraint) || (this.options.constraint == 'horizontal'))
            style.left = p[0] + "px";
        if ((!this.options.constraint) || (this.options.constraint == 'vertical'))
            style.top = p[1] + "px";

        if (style.visibility == "hidden") style.visibility = ""; // fix gecko rendering
    },

    stopScrolling: function() {
        if (this.scrollInterval) {
            clearInterval(this.scrollInterval);
            this.scrollInterval = null;
            Draggables._lastScrollPointer = null;
        }
    },

    startScrolling: function(speed) {
        if (!(speed[0] || speed[1])) return;
        this.scrollSpeed = [speed[0] * this.options.scrollSpeed, speed[1] * this.options.scrollSpeed];
        this.lastScrolled = new Date();
        this.scrollInterval = setInterval(this.scroll.bind(this), 10);
    },

    scroll: function() {
        var current = new Date();
        var delta = current - this.lastScrolled;
        this.lastScrolled = current;
        if (this.options.scroll == window) {
            with (this._getWindowScroll(this.options.scroll)) {
                if (this.scrollSpeed[0] || this.scrollSpeed[1]) {
                    var d = delta / 1000;
                    this.options.scroll.scrollTo(left + d * this.scrollSpeed[0], top + d * this.scrollSpeed[1]);
                }
            }
        } else {
            this.options.scroll.scrollLeft += this.scrollSpeed[0] * delta / 1000;
            this.options.scroll.scrollTop += this.scrollSpeed[1] * delta / 1000;
        }

        Position.prepare();
        Droppables.show(Draggables._lastPointer, this.element);
        Draggables.notify('onDrag', this);
        if (this._isScrollChild) {
            Draggables._lastScrollPointer = Draggables._lastScrollPointer || $A(Draggables._lastPointer);
            Draggables._lastScrollPointer[0] += this.scrollSpeed[0] * delta / 1000;
            Draggables._lastScrollPointer[1] += this.scrollSpeed[1] * delta / 1000;
            if (Draggables._lastScrollPointer[0] < 0)
                Draggables._lastScrollPointer[0] = 0;
            if (Draggables._lastScrollPointer[1] < 0)
                Draggables._lastScrollPointer[1] = 0;
            this.draw(Draggables._lastScrollPointer);
        }

        if (this.options.change) this.options.change(this);
    },

    _getWindowScroll: function(w) {
        var T, L, W, H;
        with (w.document) {
            if (w.document.documentElement && documentElement.scrollTop) {
                T = documentElement.scrollTop;
                L = documentElement.scrollLeft;
            } else if (w.document.body) {
                T = body.scrollTop;
                L = body.scrollLeft;
            }
            if (w.innerWidth) {
                W = w.innerWidth;
                H = w.innerHeight;
            } else if (w.document.documentElement && documentElement.clientWidth) {
                W = documentElement.clientWidth;
                H = documentElement.clientHeight;
            } else {
                W = body.offsetWidth;
                H = body.offsetHeight
            }
        }
        return { top: T, left: L, width: W, height: H };
    }
});

Draggable._dragging = {};

/*--------------------------------------------------------------------------*/

var SortableObserver = Class.create({
    initialize: function(element, observer) {
        this.element = $(element);
        this.observer = observer;
        this.lastValue = Sortable.serialize(this.element);
    },

    onStart: function() {
        this.lastValue = Sortable.serialize(this.element);
    },

    onEnd: function() {
        Sortable.unmark();
        if (this.lastValue != Sortable.serialize(this.element))
            this.observer(this.element)
    }
});

var Sortable = {
    SERIALIZE_RULE: /^[^_\-](?:[A-Za-z0-9\-\_]*)[_](.*)$/,

    sortables: {},

    _findRootElement: function(element) {
        while (element.tagName.toUpperCase() != "BODY") {
            if (element.id && Sortable.sortables[element.id]) return element;
            element = element.parentNode;
        }
    },

    options: function(element) {
        element = Sortable._findRootElement($(element));
        if (!element) return;
        return Sortable.sortables[element.id];
    },

    destroy: function(element) {
        var s = Sortable.options(element);

        if (s) {
            Draggables.removeObserver(s.element);
            s.droppables.each(function(d) { Droppables.remove(d) });
            s.draggables.invoke('destroy');

            delete Sortable.sortables[s.element.id];
        }
    },

    create: function(element) {
        element = $(element);
        var options = Object.extend({
            element: element,
            tag: 'li',       // assumes li children, override with tag: 'tagname'
            dropOnEmpty: false,
            tree: false,
            treeTag: 'ul',
            overlap: 'vertical', // one of 'vertical', 'horizontal'
            constraint: 'vertical', // one of 'vertical', 'horizontal', false
            containment: element,    // also takes array of elements (or id's); or false
            handle: false,      // or a CSS class
            only: false,
            delay: 0,
            hoverclass: null,
            ghosting: false,
            quiet: false,
            scroll: false,
            scrollSensitivity: 20,
            scrollSpeed: 15,
            format: this.SERIALIZE_RULE,

            // these take arrays of elements or ids and can be 
            // used for better initialization performance
            elements: false,
            handles: false,

            onChange: Prototype.emptyFunction,
            onUpdate: Prototype.emptyFunction
        }, arguments[1] || {});

        // clear any old sortable with same element
        this.destroy(element);

        // build options for the draggables
        var options_for_draggable = {
            revert: true,
            quiet: options.quiet,
            scroll: options.scroll,
            scrollSpeed: options.scrollSpeed,
            scrollSensitivity: options.scrollSensitivity,
            delay: options.delay,
            ghosting: options.ghosting,
            constraint: options.constraint,
            handle: options.handle
        };

        if (options.starteffect)
            options_for_draggable.starteffect = options.starteffect;

        if (options.reverteffect)
            options_for_draggable.reverteffect = options.reverteffect;
        else
            if (options.ghosting) options_for_draggable.reverteffect = function(element) {
                element.style.top = 0;
                element.style.left = 0;
            };

        if (options.endeffect)
            options_for_draggable.endeffect = options.endeffect;

        if (options.zindex)
            options_for_draggable.zindex = options.zindex;

        // build options for the droppables  
        var options_for_droppable = {
            overlap: options.overlap,
            containment: options.containment,
            tree: options.tree,
            hoverclass: options.hoverclass,
            onHover: Sortable.onHover
        }

        var options_for_tree = {
            onHover: Sortable.onEmptyHover,
            overlap: options.overlap,
            containment: options.containment,
            hoverclass: options.hoverclass
        }

        // fix for gecko engine
        Element.cleanWhitespace(element);

        options.draggables = [];
        options.droppables = [];

        // drop on empty handling
        if (options.dropOnEmpty || options.tree) {
            Droppables.add(element, options_for_tree);
            options.droppables.push(element);
        }

        (options.elements || this.findElements(element, options) || []).each(function(e, i) {
            var handle = options.handles ? $(options.handles[i]) :
        (options.handle ? $(e).select('.' + options.handle)[0] : e);
            options.draggables.push(
        new Draggable(e, Object.extend(options_for_draggable, { handle: handle })));
            Droppables.add(e, options_for_droppable);
            if (options.tree) e.treeNode = element;
            options.droppables.push(e);
        });

        if (options.tree) {
            (Sortable.findTreeElements(element, options) || []).each(function(e) {
                Droppables.add(e, options_for_tree);
                e.treeNode = element;
                options.droppables.push(e);
            });
        }

        // keep reference
        this.sortables[element.id] = options;

        // for onupdate
        Draggables.addObserver(new SortableObserver(element, options.onUpdate));

    },

    // return all suitable-for-sortable elements in a guaranteed order
    findElements: function(element, options) {
        return Element.findChildren(
      element, options.only, options.tree ? true : false, options.tag);
    },

    findTreeElements: function(element, options) {
        return Element.findChildren(
      element, options.only, options.tree ? true : false, options.treeTag);
    },

    onHover: function(element, dropon, overlap) {
        if (Element.isParent(dropon, element)) return;

        if (overlap > .33 && overlap < .66 && Sortable.options(dropon).tree) {
            return;
        } else if (overlap > 0.5) {
            Sortable.mark(dropon, 'before');
            if (dropon.previousSibling != element) {
                var oldParentNode = element.parentNode;
                element.style.visibility = "hidden"; // fix gecko rendering
                dropon.parentNode.insertBefore(element, dropon);
                if (dropon.parentNode != oldParentNode)
                    Sortable.options(oldParentNode).onChange(element);
                Sortable.options(dropon.parentNode).onChange(element);
            }
        } else {
            Sortable.mark(dropon, 'after');
            var nextElement = dropon.nextSibling || null;
            if (nextElement != element) {
                var oldParentNode = element.parentNode;
                element.style.visibility = "hidden"; // fix gecko rendering
                dropon.parentNode.insertBefore(element, nextElement);
                if (dropon.parentNode != oldParentNode)
                    Sortable.options(oldParentNode).onChange(element);
                Sortable.options(dropon.parentNode).onChange(element);
            }
        }
    },

    onEmptyHover: function(element, dropon, overlap) {
        var oldParentNode = element.parentNode;
        var droponOptions = Sortable.options(dropon);

        if (!Element.isParent(dropon, element)) {
            var index;

            var children = Sortable.findElements(dropon, { tag: droponOptions.tag, only: droponOptions.only });
            var child = null;

            if (children) {
                var offset = Element.offsetSize(dropon, droponOptions.overlap) * (1.0 - overlap);

                for (index = 0; index < children.length; index += 1) {
                    if (offset - Element.offsetSize(children[index], droponOptions.overlap) >= 0) {
                        offset -= Element.offsetSize(children[index], droponOptions.overlap);
                    } else if (offset - (Element.offsetSize(children[index], droponOptions.overlap) / 2) >= 0) {
                        child = index + 1 < children.length ? children[index + 1] : null;
                        break;
                    } else {
                        child = children[index];
                        break;
                    }
                }
            }

            dropon.insertBefore(element, child);

            Sortable.options(oldParentNode).onChange(element);
            droponOptions.onChange(element);
        }
    },

    unmark: function() {
        if (Sortable._marker) Sortable._marker.hide();
    },

    mark: function(dropon, position) {
        // mark on ghosting only
        var sortable = Sortable.options(dropon.parentNode);
        if (sortable && !sortable.ghosting) return;

        if (!Sortable._marker) {
            Sortable._marker =
        ($('dropmarker') || Element.extend(document.createElement('DIV'))).
          hide().addClassName('dropmarker').setStyle({ position: 'absolute' });
            document.getElementsByTagName("body").item(0).appendChild(Sortable._marker);
        }
        var offsets = Position.cumulativeOffset(dropon);
        Sortable._marker.setStyle({ left: offsets[0] + 'px', top: offsets[1] + 'px' });

        if (position == 'after')
            if (sortable.overlap == 'horizontal')
            Sortable._marker.setStyle({ left: (offsets[0] + dropon.clientWidth) + 'px' });
        else
            Sortable._marker.setStyle({ top: (offsets[1] + dropon.clientHeight) + 'px' });

        Sortable._marker.show();
    },

    _tree: function(element, options, parent) {
        var children = Sortable.findElements(element, options) || [];

        for (var i = 0; i < children.length; ++i) {
            var match = children[i].id.match(options.format);

            if (!match) continue;

            var child = {
                id: encodeURIComponent(match ? match[1] : null),
                element: element,
                parent: parent,
                children: [],
                position: parent.children.length,
                container: $(children[i]).down(options.treeTag)
            }

            /* Get the element containing the children and recurse over it */
            if (child.container)
                this._tree(child.container, options, child)

            parent.children.push(child);
        }

        return parent;
    },

    tree: function(element) {
        element = $(element);
        var sortableOptions = this.options(element);
        var options = Object.extend({
            tag: sortableOptions.tag,
            treeTag: sortableOptions.treeTag,
            only: sortableOptions.only,
            name: element.id,
            format: sortableOptions.format
        }, arguments[1] || {});

        var root = {
            id: null,
            parent: null,
            children: [],
            container: element,
            position: 0
        }

        return Sortable._tree(element, options, root);
    },

    /* Construct a [i] index for a particular node */
    _constructIndex: function(node) {
        var index = '';
        do {
            if (node.id) index = '[' + node.position + ']' + index;
        } while ((node = node.parent) != null);
        return index;
    },

    sequence: function(element) {
        element = $(element);
        var options = Object.extend(this.options(element), arguments[1] || {});

        return $(this.findElements(element, options) || []).map(function(item) {
            return item.id.match(options.format) ? item.id.match(options.format)[1] : '';
        });
    },

    setSequence: function(element, new_sequence) {
        element = $(element);
        var options = Object.extend(this.options(element), arguments[2] || {});

        var nodeMap = {};
        this.findElements(element, options).each(function(n) {
            if (n.id.match(options.format))
                nodeMap[n.id.match(options.format)[1]] = [n, n.parentNode];
            n.parentNode.removeChild(n);
        });

        new_sequence.each(function(ident) {
            var n = nodeMap[ident];
            if (n) {
                n[1].appendChild(n[0]);
                delete nodeMap[ident];
            }
        });
    },

    serialize: function(element) {
        element = $(element);
        var options = Object.extend(Sortable.options(element), arguments[1] || {});
        var name = encodeURIComponent(
      (arguments[1] && arguments[1].name) ? arguments[1].name : element.id);

        if (options.tree) {
            return Sortable.tree(element, arguments[1]).children.map(function(item) {
                return [name + Sortable._constructIndex(item) + "[id]=" +
                encodeURIComponent(item.id)].concat(item.children.map(arguments.callee));
            }).flatten().join('&');
        } else {
            return Sortable.sequence(element, arguments[1]).map(function(item) {
                return name + "[]=" + encodeURIComponent(item);
            }).join('&');
        }
    }
}

// Returns true if child is contained within element
Element.isParent = function(child, element) {
    if (!child.parentNode || child == element) return false;
    if (child.parentNode == element) return true;
    return Element.isParent(child.parentNode, element);
}

Element.findChildren = function(element, only, recursive, tagName) {
    if (!element.hasChildNodes()) return null;
    tagName = tagName.toUpperCase();
    if (only) only = [only].flatten();
    var elements = [];
    $A(element.childNodes).each(function(e) {
        if (e.tagName && e.tagName.toUpperCase() == tagName &&
      (!only || (Element.classNames(e).detect(function(v) { return only.include(v) }))))
            elements.push(e);
        if (recursive) {
            var grandchildren = Element.findChildren(e, only, recursive, tagName);
            if (grandchildren) elements.push(grandchildren);
        }
    });

    return (elements.length > 0 ? elements.flatten() : []);
}

Element.offsetSize = function(element, type) {
    return element['offset' + ((type == 'vertical' || type == 'height') ? 'Height' : 'Width')];
}
// script.aculo.us controls.js v1.8.1, Thu Jan 03 22:07:12 -0500 2008

// Copyright (c) 2005-2007 Thomas Fuchs (http://script.aculo.us, http://mir.aculo.us)
//           (c) 2005-2007 Ivan Krstic (http://blogs.law.harvard.edu/ivan)
//           (c) 2005-2007 Jon Tirsen (http://www.tirsen.com)
// Contributors:
//  Richard Livsey
//  Rahul Bhargava
//  Rob Wills
// 
// script.aculo.us is freely distributable under the terms of an MIT-style license.
// For details, see the script.aculo.us web site: http://script.aculo.us/

// Autocompleter.Base handles all the autocompletion functionality 
// that's independent of the data source for autocompletion. This
// includes drawing the autocompletion menu, observing keyboard
// and mouse events, and similar.
//
// Specific autocompleters need to provide, at the very least, 
// a getUpdatedChoices function that will be invoked every time
// the text inside the monitored textbox changes. This method 
// should get the text for which to provide autocompletion by
// invoking this.getToken(), NOT by directly accessing
// this.element.value. This is to allow incremental tokenized
// autocompletion. Specific auto-completion logic (AJAX, etc)
// belongs in getUpdatedChoices.
//
// Tokenized incremental autocompletion is enabled automatically
// when an autocompleter is instantiated with the 'tokens' option
// in the options parameter, e.g.:
// new Ajax.Autocompleter('id','upd', '/url/', { tokens: ',' });
// will incrementally autocomplete with a comma as the token.
// Additionally, ',' in the above example can be replaced with
// a token array, e.g. { tokens: [',', '\n'] } which
// enables autocompletion on multiple tokens. This is most 
// useful when one of the tokens is \n (a newline), as it 
// allows smart autocompletion after linebreaks.

if (typeof Effect == 'undefined')
    throw ("controls.js requires including script.aculo.us' effects.js library");

var Autocompleter = {}
Autocompleter.Base = Class.create({
    baseInitialize: function(element, update, options) {
        element = $(element)
        this.element = element;
        this.update = $(update);
        this.hasFocus = false;
        this.changed = false;
        this.active = false;
        this.index = 0;
        this.entryCount = 0;
        this.oldElementValue = this.element.value;

        if (this.setOptions)
            this.setOptions(options);
        else
            this.options = options || {};

        this.options.paramName = this.options.paramName || this.element.name;
        this.options.tokens = this.options.tokens || [];
        this.options.frequency = this.options.frequency || 0.4;
        this.options.minChars = this.options.minChars || 1;
        this.options.onShow = this.options.onShow ||
      function(element, update) {
          if (!update.style.position || update.style.position == 'absolute') {
              update.style.position = 'absolute';
              Position.clone(element, update, {
                  setHeight: false,
                  offsetTop: element.offsetHeight
              });
          }
          Effect.Appear(update, { duration: 0.15 });
      };
        this.options.onHide = this.options.onHide ||
      function(element, update) { new Effect.Fade(update, { duration: 0.15 }) };

        if (typeof (this.options.tokens) == 'string')
            this.options.tokens = new Array(this.options.tokens);
        // Force carriage returns as token delimiters anyway
        if (!this.options.tokens.include('\n'))
            this.options.tokens.push('\n');

        this.observer = null;

        this.element.setAttribute('autocomplete', 'off');

        Element.hide(this.update);

        Event.observe(this.element, 'blur', this.onBlur.bindAsEventListener(this));
        Event.observe(this.element, 'keydown', this.onKeyPress.bindAsEventListener(this));
    },

    show: function() {
        if (Element.getStyle(this.update, 'display') == 'none') this.options.onShow(this.element, this.update);
        if (!this.iefix &&
      (Prototype.Browser.IE) &&
      (Element.getStyle(this.update, 'position') == 'absolute')) {
            new Insertion.After(this.update,
       '<iframe id="' + this.update.id + '_iefix" ' +
       'style="display:none;position:absolute;filter:progid:DXImageTransform.Microsoft.Alpha(opacity=0);" ' +
       'src="javascript:false;" frameborder="0" scrolling="no"></iframe>');
            this.iefix = $(this.update.id + '_iefix');
        }
        if (this.iefix) setTimeout(this.fixIEOverlapping.bind(this), 50);
    },

    fixIEOverlapping: function() {
        Position.clone(this.update, this.iefix, { setTop: (!this.update.style.height) });
        this.iefix.style.zIndex = 1;
        this.update.style.zIndex = 2;
        Element.show(this.iefix);
    },

    hide: function() {
        this.stopIndicator();
        if (Element.getStyle(this.update, 'display') != 'none') this.options.onHide(this.element, this.update);
        if (this.iefix) Element.hide(this.iefix);
    },

    startIndicator: function() {
        if (this.options.indicator) Element.show(this.options.indicator);
    },

    stopIndicator: function() {
        if (this.options.indicator) Element.hide(this.options.indicator);
    },

    onKeyPress: function(event) {
        if (this.active)
            switch (event.keyCode) {
            case Event.KEY_TAB:
            case Event.KEY_RETURN:
                this.selectEntry();
                Event.stop(event);
            case Event.KEY_ESC:
                this.hide();
                this.active = false;
                Event.stop(event);
                return;
            case Event.KEY_LEFT:
            case Event.KEY_RIGHT:
                return;
            case Event.KEY_UP:
                this.markPrevious();
                this.render();
                Event.stop(event);
                return;
            case Event.KEY_DOWN:
                this.markNext();
                this.render();
                Event.stop(event);
                return;
        }
        else
            if (event.keyCode == Event.KEY_TAB || event.keyCode == Event.KEY_RETURN ||
         (Prototype.Browser.WebKit > 0 && event.keyCode == 0)) return;

        this.changed = true;
        this.hasFocus = true;

        if (this.observer) clearTimeout(this.observer);
        this.observer =
        setTimeout(this.onObserverEvent.bind(this), this.options.frequency * 1000);
    },

    activate: function() {
        this.changed = false;
        this.hasFocus = true;
        this.getUpdatedChoices();
    },

    onHover: function(event) {
        var element = Event.findElement(event, 'LI');
        if (this.index != element.autocompleteIndex) {
            this.index = element.autocompleteIndex;
            this.render();
        }
        Event.stop(event);
    },

    onClick: function(event) {
        var element = Event.findElement(event, 'LI');
        this.index = element.autocompleteIndex;
        this.selectEntry();
        this.hide();
    },

    onBlur: function(event) {
        // needed to make click events working
        setTimeout(this.hide.bind(this), 250);
        this.hasFocus = false;
        this.active = false;
    },

    render: function() {
        if (this.entryCount > 0) {
            for (var i = 0; i < this.entryCount; i++)
                this.index == i ?
          Element.addClassName(this.getEntry(i), "selected") :
          Element.removeClassName(this.getEntry(i), "selected");
            if (this.hasFocus) {
                this.show();
                this.active = true;
            }
        } else {
            this.active = false;
            this.hide();
        }
    },

    markPrevious: function() {
        if (this.index > 0) this.index--
        else this.index = this.entryCount - 1;
        this.getEntry(this.index).scrollIntoView(true);
    },

    markNext: function() {
        if (this.index < this.entryCount - 1) this.index++
        else this.index = 0;
        this.getEntry(this.index).scrollIntoView(false);
    },

    getEntry: function(index) {
        return this.update.firstChild.childNodes[index];
    },

    getCurrentEntry: function() {
        return this.getEntry(this.index);
    },

    selectEntry: function() {
        this.active = false;
        this.updateElement(this.getCurrentEntry());
    },

    updateElement: function(selectedElement) {
        if (this.options.updateElement) {
            this.options.updateElement(selectedElement);
            return;
        }
        var value = '';
        if (this.options.select) {
            var nodes = $(selectedElement).select('.' + this.options.select) || [];
            if (nodes.length > 0) value = Element.collectTextNodes(nodes[0], this.options.select);
        } else
            value = Element.collectTextNodesIgnoreClass(selectedElement, 'informal');

        var bounds = this.getTokenBounds();
        if (bounds[0] != -1) {
            var newValue = this.element.value.substr(0, bounds[0]);
            var whitespace = this.element.value.substr(bounds[0]).match(/^\s+/);
            if (whitespace)
                newValue += whitespace[0];
            this.element.value = newValue + value + this.element.value.substr(bounds[1]);
        } else {
            this.element.value = value;
        }
        this.oldElementValue = this.element.value;
        this.element.focus();

        if (this.options.afterUpdateElement)
            this.options.afterUpdateElement(this.element, selectedElement);
    },

    updateChoices: function(choices) {
        if (!this.changed && this.hasFocus) {
            this.update.innerHTML = choices;
            Element.cleanWhitespace(this.update);
            Element.cleanWhitespace(this.update.down());

            if (this.update.firstChild && this.update.down().childNodes) {
                this.entryCount =
          this.update.down().childNodes.length;
                for (var i = 0; i < this.entryCount; i++) {
                    var entry = this.getEntry(i);
                    entry.autocompleteIndex = i;
                    this.addObservers(entry);
                }
            } else {
                this.entryCount = 0;
            }

            this.stopIndicator();
            this.index = 0;

            if (this.entryCount == 1 && this.options.autoSelect) {
                this.selectEntry();
                this.hide();
            } else {
                this.render();
            }
        }
    },

    addObservers: function(element) {
        Event.observe(element, "mouseover", this.onHover.bindAsEventListener(this));
        Event.observe(element, "click", this.onClick.bindAsEventListener(this));
    },

    onObserverEvent: function() {
        this.changed = false;
        this.tokenBounds = null;
        if (this.getToken().length >= this.options.minChars) {
            this.getUpdatedChoices();
        } else {
            this.active = false;
            this.hide();
        }
        this.oldElementValue = this.element.value;
    },

    getToken: function() {
        var bounds = this.getTokenBounds();
        return this.element.value.substring(bounds[0], bounds[1]).strip();
    },

    getTokenBounds: function() {
        if (null != this.tokenBounds) return this.tokenBounds;
        var value = this.element.value;
        if (value.strip().empty()) return [-1, 0];
        var diff = arguments.callee.getFirstDifferencePos(value, this.oldElementValue);
        var offset = (diff == this.oldElementValue.length ? 1 : 0);
        var prevTokenPos = -1, nextTokenPos = value.length;
        var tp;
        for (var index = 0, l = this.options.tokens.length; index < l; ++index) {
            tp = value.lastIndexOf(this.options.tokens[index], diff + offset - 1);
            if (tp > prevTokenPos) prevTokenPos = tp;
            tp = value.indexOf(this.options.tokens[index], diff + offset);
            if (-1 != tp && tp < nextTokenPos) nextTokenPos = tp;
        }
        return (this.tokenBounds = [prevTokenPos + 1, nextTokenPos]);
    }
});

Autocompleter.Base.prototype.getTokenBounds.getFirstDifferencePos = function(newS, oldS) {
    var boundary = Math.min(newS.length, oldS.length);
    for (var index = 0; index < boundary; ++index)
        if (newS[index] != oldS[index])
        return index;
    return boundary;
};

Ajax.Autocompleter = Class.create(Autocompleter.Base, {
    initialize: function(element, update, url, options) {
        this.baseInitialize(element, update, options);
        this.options.asynchronous = true;
        this.options.onComplete = this.onComplete.bind(this);
        this.options.defaultParams = this.options.parameters || null;
        this.url = url;
    },

    getUpdatedChoices: function() {
        this.startIndicator();

        var entry = encodeURIComponent(this.options.paramName) + '=' +
      encodeURIComponent(this.getToken());

        this.options.parameters = this.options.callback ?
      this.options.callback(this.element, entry) : entry;

        if (this.options.defaultParams)
            this.options.parameters += '&' + this.options.defaultParams;

        new Ajax.Request(this.url, this.options);
    },

    onComplete: function(request) {
        this.updateChoices(request.responseText);
    }
});

// The local array autocompleter. Used when you'd prefer to
// inject an array of autocompletion options into the page, rather
// than sending out Ajax queries, which can be quite slow sometimes.
//
// The constructor takes four parameters. The first two are, as usual,
// the id of the monitored textbox, and id of the autocompletion menu.
// The third is the array you want to autocomplete from, and the fourth
// is the options block.
//
// Extra local autocompletion options:
// - choices - How many autocompletion choices to offer
//
// - partialSearch - If false, the autocompleter will match entered
//                    text only at the beginning of strings in the 
//                    autocomplete array. Defaults to true, which will
//                    match text at the beginning of any *word* in the
//                    strings in the autocomplete array. If you want to
//                    search anywhere in the string, additionally set
//                    the option fullSearch to true (default: off).
//
// - fullSsearch - Search anywhere in autocomplete array strings.
//
// - partialChars - How many characters to enter before triggering
//                   a partial match (unlike minChars, which defines
//                   how many characters are required to do any match
//                   at all). Defaults to 2.
//
// - ignoreCase - Whether to ignore case when autocompleting.
//                 Defaults to true.
//
// It's possible to pass in a custom function as the 'selector' 
// option, if you prefer to write your own autocompletion logic.
// In that case, the other options above will not apply unless
// you support them.

Autocompleter.Local = Class.create(Autocompleter.Base, {
    initialize: function(element, update, array, options) {
        this.baseInitialize(element, update, options);
        this.options.array = array;
    },

    getUpdatedChoices: function() {
        this.updateChoices(this.options.selector(this));
    },

    setOptions: function(options) {
        this.options = Object.extend({
            choices: 10,
            partialSearch: true,
            partialChars: 2,
            ignoreCase: true,
            fullSearch: false,
            selector: function(instance) {
                var ret = []; // Beginning matches
                var partial = []; // Inside matches
                var entry = instance.getToken();
                var count = 0;

                for (var i = 0; i < instance.options.array.length &&
          ret.length < instance.options.choices; i++) {

                    var elem = instance.options.array[i];
                    var foundPos = instance.options.ignoreCase ?
            elem.toLowerCase().indexOf(entry.toLowerCase()) :
            elem.indexOf(entry);

                    while (foundPos != -1) {
                        if (foundPos == 0 && elem.length != entry.length) {
                            ret.push("<li><strong>" + elem.substr(0, entry.length) + "</strong>" +
                elem.substr(entry.length) + "</li>");
                            break;
                        } else if (entry.length >= instance.options.partialChars &&
              instance.options.partialSearch && foundPos != -1) {
                            if (instance.options.fullSearch || /\s/.test(elem.substr(foundPos - 1, 1))) {
                                partial.push("<li>" + elem.substr(0, foundPos) + "<strong>" +
                  elem.substr(foundPos, entry.length) + "</strong>" + elem.substr(
                  foundPos + entry.length) + "</li>");
                                break;
                            }
                        }

                        foundPos = instance.options.ignoreCase ?
              elem.toLowerCase().indexOf(entry.toLowerCase(), foundPos + 1) :
              elem.indexOf(entry, foundPos + 1);

                    }
                }
                if (partial.length)
                    ret = ret.concat(partial.slice(0, instance.options.choices - ret.length))
                return "<ul>" + ret.join('') + "</ul>";
            }
        }, options || {});
    }
});

// AJAX in-place editor and collection editor
// Full rewrite by Christophe Porteneuve <tdd@tddsworld.com> (April 2007).

// Use this if you notice weird scrolling problems on some browsers,
// the DOM might be a bit confused when this gets called so do this
// waits 1 ms (with setTimeout) until it does the activation
Field.scrollFreeActivate = function(field) {
    setTimeout(function() {
        Field.activate(field);
    }, 1);
}

Ajax.InPlaceEditor = Class.create({
    initialize: function(element, url, options) {
        this.url = url;
        this.element = element = $(element);
        this.prepareOptions();
        this._controls = {};
        arguments.callee.dealWithDeprecatedOptions(options); // DEPRECATION LAYER!!!
        Object.extend(this.options, options || {});
        if (!this.options.formId && this.element.id) {
            this.options.formId = this.element.id + '-inplaceeditor';
            if ($(this.options.formId))
                this.options.formId = '';
        }
        if (this.options.externalControl)
            this.options.externalControl = $(this.options.externalControl);
        if (!this.options.externalControl)
            this.options.externalControlOnly = false;
        this._originalBackground = this.element.getStyle('background-color') || 'transparent';
        this.element.title = this.options.clickToEditText;
        this._boundCancelHandler = this.handleFormCancellation.bind(this);
        this._boundComplete = (this.options.onComplete || Prototype.emptyFunction).bind(this);
        this._boundFailureHandler = this.handleAJAXFailure.bind(this);
        this._boundSubmitHandler = this.handleFormSubmission.bind(this);
        this._boundWrapperHandler = this.wrapUp.bind(this);
        this.registerListeners();
    },
    checkForEscapeOrReturn: function(e) {
        if (!this._editing || e.ctrlKey || e.altKey || e.shiftKey) return;
        if (Event.KEY_ESC == e.keyCode)
            this.handleFormCancellation(e);
        else if (Event.KEY_RETURN == e.keyCode)
            this.handleFormSubmission(e);
    },
    createControl: function(mode, handler, extraClasses) {
        var control = this.options[mode + 'Control'];
        var text = this.options[mode + 'Text'];
        if ('button' == control) {
            var btn = document.createElement('input');
            btn.type = 'submit';
            btn.value = text;
            btn.className = 'editor_' + mode + '_button';
            if ('cancel' == mode)
                btn.onclick = this._boundCancelHandler;
            this._form.appendChild(btn);
            this._controls[mode] = btn;
        } else if ('link' == control) {
            var link = document.createElement('a');
            link.href = '#';
            link.appendChild(document.createTextNode(text));
            link.onclick = 'cancel' == mode ? this._boundCancelHandler : this._boundSubmitHandler;
            link.className = 'editor_' + mode + '_link';
            if (extraClasses)
                link.className += ' ' + extraClasses;
            this._form.appendChild(link);
            this._controls[mode] = link;
        }
    },
    createEditField: function() {
        var text = (this.options.loadTextURL ? this.options.loadingText : this.getText());
        var fld;
        if (1 >= this.options.rows && !/\r|\n/.test(this.getText())) {
            fld = document.createElement('input');
            fld.type = 'text';
            var size = this.options.size || this.options.cols || 0;
            if (0 < size) fld.size = size;
        } else {
            fld = document.createElement('textarea');
            fld.rows = (1 >= this.options.rows ? this.options.autoRows : this.options.rows);
            fld.cols = this.options.cols || 40;
        }
        fld.name = this.options.paramName;
        fld.value = text; // No HTML breaks conversion anymore
        fld.className = 'editor_field';
        if (this.options.submitOnBlur)
            fld.onblur = this._boundSubmitHandler;
        this._controls.editor = fld;
        if (this.options.loadTextURL)
            this.loadExternalText();
        this._form.appendChild(this._controls.editor);
    },
    createForm: function() {
        var ipe = this;
        function addText(mode, condition) {
            var text = ipe.options['text' + mode + 'Controls'];
            if (!text || condition === false) return;
            ipe._form.appendChild(document.createTextNode(text));
        };
        this._form = $(document.createElement('form'));
        this._form.id = this.options.formId;
        this._form.addClassName(this.options.formClassName);
        this._form.onsubmit = this._boundSubmitHandler;
        this.createEditField();
        if ('textarea' == this._controls.editor.tagName.toLowerCase())
            this._form.appendChild(document.createElement('br'));
        if (this.options.onFormCustomization)
            this.options.onFormCustomization(this, this._form);
        addText('Before', this.options.okControl || this.options.cancelControl);
        this.createControl('ok', this._boundSubmitHandler);
        addText('Between', this.options.okControl && this.options.cancelControl);
        this.createControl('cancel', this._boundCancelHandler, 'editor_cancel');
        addText('After', this.options.okControl || this.options.cancelControl);
    },
    destroy: function() {
        if (this._oldInnerHTML)
            this.element.innerHTML = this._oldInnerHTML;
        this.leaveEditMode();
        this.unregisterListeners();
    },
    enterEditMode: function(e) {
        if (this._saving || this._editing) return;
        this._editing = true;
        this.triggerCallback('onEnterEditMode');
        if (this.options.externalControl)
            this.options.externalControl.hide();
        this.element.hide();
        this.createForm();
        this.element.parentNode.insertBefore(this._form, this.element);
        if (!this.options.loadTextURL)
            this.postProcessEditField();
        if (e) Event.stop(e);
    },
    enterHover: function(e) {
        if (this.options.hoverClassName)
            this.element.addClassName(this.options.hoverClassName);
        if (this._saving) return;
        this.triggerCallback('onEnterHover');
    },
    getText: function() {
        return this.element.innerHTML;
    },
    handleAJAXFailure: function(transport) {
        this.triggerCallback('onFailure', transport);
        if (this._oldInnerHTML) {
            this.element.innerHTML = this._oldInnerHTML;
            this._oldInnerHTML = null;
        }
    },
    handleFormCancellation: function(e) {
        this.wrapUp();
        if (e) Event.stop(e);
    },
    handleFormSubmission: function(e) {
        var form = this._form;
        var value = $F(this._controls.editor);
        this.prepareSubmission();
        var params = this.options.callback(form, value) || '';
        if (Object.isString(params))
            params = params.toQueryParams();
        params.editorId = this.element.id;
        if (this.options.htmlResponse) {
            var options = Object.extend({ evalScripts: true }, this.options.ajaxOptions);
            Object.extend(options, {
                parameters: params,
                onComplete: this._boundWrapperHandler,
                onFailure: this._boundFailureHandler
            });
            new Ajax.Updater({ success: this.element }, this.url, options);
        } else {
            var options = Object.extend({ method: 'get' }, this.options.ajaxOptions);
            Object.extend(options, {
                parameters: params,
                onComplete: this._boundWrapperHandler,
                onFailure: this._boundFailureHandler
            });
            new Ajax.Request(this.url, options);
        }
        if (e) Event.stop(e);
    },
    leaveEditMode: function() {
        this.element.removeClassName(this.options.savingClassName);
        this.removeForm();
        this.leaveHover();
        this.element.style.backgroundColor = this._originalBackground;
        this.element.show();
        if (this.options.externalControl)
            this.options.externalControl.show();
        this._saving = false;
        this._editing = false;
        this._oldInnerHTML = null;
        this.triggerCallback('onLeaveEditMode');
    },
    leaveHover: function(e) {
        if (this.options.hoverClassName)
            this.element.removeClassName(this.options.hoverClassName);
        if (this._saving) return;
        this.triggerCallback('onLeaveHover');
    },
    loadExternalText: function() {
        this._form.addClassName(this.options.loadingClassName);
        this._controls.editor.disabled = true;
        var options = Object.extend({ method: 'get' }, this.options.ajaxOptions);
        Object.extend(options, {
            parameters: 'editorId=' + encodeURIComponent(this.element.id),
            onComplete: Prototype.emptyFunction,
            onSuccess: function(transport) {
                this._form.removeClassName(this.options.loadingClassName);
                var text = transport.responseText;
                if (this.options.stripLoadedTextTags)
                    text = text.stripTags();
                this._controls.editor.value = text;
                this._controls.editor.disabled = false;
                this.postProcessEditField();
            } .bind(this),
            onFailure: this._boundFailureHandler
        });
        new Ajax.Request(this.options.loadTextURL, options);
    },
    postProcessEditField: function() {
        var fpc = this.options.fieldPostCreation;
        if (fpc)
            $(this._controls.editor)['focus' == fpc ? 'focus' : 'activate']();
    },
    prepareOptions: function() {
        this.options = Object.clone(Ajax.InPlaceEditor.DefaultOptions);
        Object.extend(this.options, Ajax.InPlaceEditor.DefaultCallbacks);
        [this._extraDefaultOptions].flatten().compact().each(function(defs) {
            Object.extend(this.options, defs);
        } .bind(this));
    },
    prepareSubmission: function() {
        this._saving = true;
        this.removeForm();
        this.leaveHover();
        this.showSaving();
    },
    registerListeners: function() {
        this._listeners = {};
        var listener;
        $H(Ajax.InPlaceEditor.Listeners).each(function(pair) {
            listener = this[pair.value].bind(this);
            this._listeners[pair.key] = listener;
            if (!this.options.externalControlOnly)
                this.element.observe(pair.key, listener);
            if (this.options.externalControl)
                this.options.externalControl.observe(pair.key, listener);
        } .bind(this));
    },
    removeForm: function() {
        if (!this._form) return;
        this._form.remove();
        this._form = null;
        this._controls = {};
    },
    showSaving: function() {
        this._oldInnerHTML = this.element.innerHTML;
        this.element.innerHTML = this.options.savingText;
        this.element.addClassName(this.options.savingClassName);
        this.element.style.backgroundColor = this._originalBackground;
        this.element.show();
    },
    triggerCallback: function(cbName, arg) {
        if ('function' == typeof this.options[cbName]) {
            this.options[cbName](this, arg);
        }
    },
    unregisterListeners: function() {
        $H(this._listeners).each(function(pair) {
            if (!this.options.externalControlOnly)
                this.element.stopObserving(pair.key, pair.value);
            if (this.options.externalControl)
                this.options.externalControl.stopObserving(pair.key, pair.value);
        } .bind(this));
    },
    wrapUp: function(transport) {
        this.leaveEditMode();
        // Can't use triggerCallback due to backward compatibility: requires
        // binding + direct element
        this._boundComplete(transport, this.element);
    }
});

Object.extend(Ajax.InPlaceEditor.prototype, {
    dispose: Ajax.InPlaceEditor.prototype.destroy
});

Ajax.InPlaceCollectionEditor = Class.create(Ajax.InPlaceEditor, {
    initialize: function($super, element, url, options) {
        this._extraDefaultOptions = Ajax.InPlaceCollectionEditor.DefaultOptions;
        $super(element, url, options);
    },

    createEditField: function() {
        var list = document.createElement('select');
        list.name = this.options.paramName;
        list.size = 1;
        this._controls.editor = list;
        this._collection = this.options.collection || [];
        if (this.options.loadCollectionURL)
            this.loadCollection();
        else
            this.checkForExternalText();
        this._form.appendChild(this._controls.editor);
    },

    loadCollection: function() {
        this._form.addClassName(this.options.loadingClassName);
        this.showLoadingText(this.options.loadingCollectionText);
        var options = Object.extend({ method: 'get' }, this.options.ajaxOptions);
        Object.extend(options, {
            parameters: 'editorId=' + encodeURIComponent(this.element.id),
            onComplete: Prototype.emptyFunction,
            onSuccess: function(transport) {
                var js = transport.responseText.strip();
                if (!/^\[.*\]$/.test(js)) // TODO: improve sanity check
                    throw 'Server returned an invalid collection representation.';
                this._collection = eval(js);
                this.checkForExternalText();
            } .bind(this),
            onFailure: this.onFailure
        });
        new Ajax.Request(this.options.loadCollectionURL, options);
    },

    showLoadingText: function(text) {
        this._controls.editor.disabled = true;
        var tempOption = this._controls.editor.firstChild;
        if (!tempOption) {
            tempOption = document.createElement('option');
            tempOption.value = '';
            this._controls.editor.appendChild(tempOption);
            tempOption.selected = true;
        }
        tempOption.update((text || '').stripScripts().stripTags());
    },

    checkForExternalText: function() {
        this._text = this.getText();
        if (this.options.loadTextURL)
            this.loadExternalText();
        else
            this.buildOptionList();
    },

    loadExternalText: function() {
        this.showLoadingText(this.options.loadingText);
        var options = Object.extend({ method: 'get' }, this.options.ajaxOptions);
        Object.extend(options, {
            parameters: 'editorId=' + encodeURIComponent(this.element.id),
            onComplete: Prototype.emptyFunction,
            onSuccess: function(transport) {
                this._text = transport.responseText.strip();
                this.buildOptionList();
            } .bind(this),
            onFailure: this.onFailure
        });
        new Ajax.Request(this.options.loadTextURL, options);
    },

    buildOptionList: function() {
        this._form.removeClassName(this.options.loadingClassName);
        this._collection = this._collection.map(function(entry) {
            return 2 === entry.length ? entry : [entry, entry].flatten();
        });
        var marker = ('value' in this.options) ? this.options.value : this._text;
        var textFound = this._collection.any(function(entry) {
            return entry[0] == marker;
        } .bind(this));
        this._controls.editor.update('');
        var option;
        this._collection.each(function(entry, index) {
            option = document.createElement('option');
            option.value = entry[0];
            option.selected = textFound ? entry[0] == marker : 0 == index;
            option.appendChild(document.createTextNode(entry[1]));
            this._controls.editor.appendChild(option);
        } .bind(this));
        this._controls.editor.disabled = false;
        Field.scrollFreeActivate(this._controls.editor);
    }
});

//**** DEPRECATION LAYER FOR InPlace[Collection]Editor! ****
//**** This only  exists for a while,  in order to  let ****
//**** users adapt to  the new API.  Read up on the new ****
//**** API and convert your code to it ASAP!            ****

Ajax.InPlaceEditor.prototype.initialize.dealWithDeprecatedOptions = function(options) {
    if (!options) return;
    function fallback(name, expr) {
        if (name in options || expr === undefined) return;
        options[name] = expr;
    };
    fallback('cancelControl', (options.cancelLink ? 'link' : (options.cancelButton ? 'button' :
    options.cancelLink == options.cancelButton == false ? false : undefined)));
    fallback('okControl', (options.okLink ? 'link' : (options.okButton ? 'button' :
    options.okLink == options.okButton == false ? false : undefined)));
    fallback('highlightColor', options.highlightcolor);
    fallback('highlightEndColor', options.highlightendcolor);
};

Object.extend(Ajax.InPlaceEditor, {
    DefaultOptions: {
        ajaxOptions: {},
        autoRows: 3,                                // Use when multi-line w/ rows == 1
        cancelControl: 'link',                      // 'link'|'button'|false
        cancelText: 'cancel',
        clickToEditText: 'Click to edit',
        externalControl: null,                      // id|elt
        externalControlOnly: false,
        fieldPostCreation: 'activate',              // 'activate'|'focus'|false
        formClassName: 'inplaceeditor-form',
        formId: null,                               // id|elt
        highlightColor: '#ffff99',
        highlightEndColor: '#ffffff',
        hoverClassName: '',
        htmlResponse: true,
        loadingClassName: 'inplaceeditor-loading',
        loadingText: 'Loading...',
        okControl: 'button',                        // 'link'|'button'|false
        okText: 'ok',
        paramName: 'value',
        rows: 1,                                    // If 1 and multi-line, uses autoRows
        savingClassName: 'inplaceeditor-saving',
        savingText: 'Saving...',
        size: 0,
        stripLoadedTextTags: false,
        submitOnBlur: false,
        textAfterControls: '',
        textBeforeControls: '',
        textBetweenControls: ''
    },
    DefaultCallbacks: {
        callback: function(form) {
            return Form.serialize(form);
        },
        onComplete: function(transport, element) {
            // For backward compatibility, this one is bound to the IPE, and passes
            // the element directly.  It was too often customized, so we don't break it.
            new Effect.Highlight(element, {
                startcolor: this.options.highlightColor, keepBackgroundImage: true
            });
        },
        onEnterEditMode: null,
        onEnterHover: function(ipe) {
            ipe.element.style.backgroundColor = ipe.options.highlightColor;
            if (ipe._effect)
                ipe._effect.cancel();
        },
        onFailure: function(transport, ipe) {
            alert('Error communication with the server: ' + transport.responseText.stripTags());
        },
        onFormCustomization: null, // Takes the IPE and its generated form, after editor, before controls.
        onLeaveEditMode: null,
        onLeaveHover: function(ipe) {
            ipe._effect = new Effect.Highlight(ipe.element, {
                startcolor: ipe.options.highlightColor, endcolor: ipe.options.highlightEndColor,
                restorecolor: ipe._originalBackground, keepBackgroundImage: true
            });
        }
    },
    Listeners: {
        click: 'enterEditMode',
        keydown: 'checkForEscapeOrReturn',
        mouseover: 'enterHover',
        mouseout: 'leaveHover'
    }
});

Ajax.InPlaceCollectionEditor.DefaultOptions = {
    loadingCollectionText: 'Loading options...'
};

// Delayed observer, like Form.Element.Observer, 
// but waits for delay after last key input
// Ideal for live-search fields

Form.Element.DelayedObserver = Class.create({
    initialize: function(element, delay, callback) {
        this.delay = delay || 0.5;
        this.element = $(element);
        this.callback = callback;
        this.timer = null;
        this.lastValue = $F(this.element);
        Event.observe(this.element, 'keyup', this.delayedListener.bindAsEventListener(this));
    },
    delayedListener: function(event) {
        if (this.lastValue == $F(this.element)) return;
        if (this.timer) clearTimeout(this.timer);
        this.timer = setTimeout(this.onTimerEvent.bind(this), this.delay * 1000);
        this.lastValue = $F(this.element);
    },
    onTimerEvent: function() {
        this.timer = null;
        this.callback(this.element, $F(this.element));
    }
});
// ========================================================================
//  XML.ObjTree -- XML source code from/to JavaScript object like E4X
// ========================================================================

if (typeof (XML) == 'undefined') XML = function() { };

//  constructor

XML.ObjTree = function() {
    return this;
};

//  class variables

XML.ObjTree.VERSION = "0.24";

//  object prototype

XML.ObjTree.prototype.xmlDecl = '<?xml version="1.0" encoding="UTF-8" ?>\n';
XML.ObjTree.prototype.attr_prefix = '-';
XML.ObjTree.prototype.overrideMimeType = 'text/xml';

//  method: parseXML( xmlsource )

XML.ObjTree.prototype.parseXML = function(xml, encode) {
    var root;
    if (window.DOMParser) {
        var xmldom = new DOMParser();
        //      xmldom.async = false;           // DOMParser is always sync-mode
        var dom = xmldom.parseFromString(xml, "application/xml");
        if (!dom) return;
        root = dom.documentElement;
    } else if (window.ActiveXObject) {
        xmldom = new ActiveXObject('Microsoft.XMLDOM');
        xmldom.async = false;
        xmldom.loadXML(xml);
        root = xmldom.documentElement;
    }
    if (!root) return;
    return this.parseDOM(root, encode);
};

//  method: parseHTTP( url, options, callback )

XML.ObjTree.prototype.parseHTTP = function(url, options, callback) {
    var myopt = {};
    for (var key in options) {
        myopt[key] = options[key];                  // copy object
    }
    if (!myopt.method) {
        if (typeof (myopt.postBody) == "undefined" &&
             typeof (myopt.postbody) == "undefined" &&
             typeof (myopt.parameters) == "undefined") {
            myopt.method = "get";
        } else {
            myopt.method = "post";
        }
    }
    if (callback) {
        myopt.asynchronous = true;                  // async-mode
        var __this = this;
        var __func = callback;
        var __save = myopt.onComplete;
        myopt.onComplete = function(trans) {
            var tree;
            if (trans && trans.responseXML && trans.responseXML.documentElement) {
                tree = __this.parseDOM(trans.responseXML.documentElement);
            } else if (trans && trans.responseText) {
                tree = __this.parseXML(trans.responseText);
            }
            __func(tree, trans);
            if (__save) __save(trans);
        };
    } else {
        myopt.asynchronous = false;                 // sync-mode
    }
    var trans;
    if (typeof (HTTP) != "undefined" && HTTP.Request) {
        myopt.uri = url;
        var req = new HTTP.Request(myopt);        // JSAN
        if (req) trans = req.transport;
    } else if (typeof (Ajax) != "undefined" && Ajax.Request) {
        var req = new Ajax.Request(url, myopt);   // ptorotype.js
        if (req) trans = req.transport;
    }
    //  if ( trans && typeof(trans.overrideMimeType) != "undefined" ) {
    //      trans.overrideMimeType( this.overrideMimeType );
    //  }
    if (callback) return trans;
    if (trans && trans.responseXML && trans.responseXML.documentElement) {
        return this.parseDOM(trans.responseXML.documentElement);
    } else if (trans && trans.responseText) {
        return this.parseXML(trans.responseText);
    }
}

//  method: parseDOM( documentroot )

XML.ObjTree.prototype.parseDOM = function(root, encode) {
    if (!root) return;

    this.__force_array = {};
    if (this.force_array) {
        for (var i = 0; i < this.force_array.length; i++) {
            this.__force_array[this.force_array[i]] = 1;
        }
    }

    var json = this.parseElement(root, encode);   // parse root node
    if (this.__force_array[root.nodeName]) {
        json = [json];
    }
    if (root.nodeType != 11) {            // DOCUMENT_FRAGMENT_NODE
        var tmp = {};
        tmp[root.nodeName] = json;          // root nodeName
        json = tmp;
    }
    return json;
};

//  method: parseElement( element )

XML.ObjTree.prototype.parseElement = function(elem, encode) {
    //  COMMENT_NODE
    if (elem.nodeType == 7) {
        return;
    }

    //  TEXT_NODE CDATA_SECTION_NODE
    if (elem.nodeType == 3 || elem.nodeType == 4) {
        var bool = elem.nodeValue.match(/[^\x00-\x20]/);
        if (bool == null) return;     // ignore white spaces
        if (encode)
            return elem.nodeValue.escapeHTML();
        else
        return elem.nodeValue;
    }

    var retval;
    var cnt = {};

    //  parse attributes
    if (elem.attributes && elem.attributes.length) {
        retval = {};
        for (var i = 0; i < elem.attributes.length; i++) {
            var key = elem.attributes[i].nodeName;
            if (typeof (key) != "string") continue;
            if (encode)
                var val = elem.attributes[i].nodeValue.escapeHTML();
            else
            var val = elem.attributes[i].nodeValue;
            if (!val) val = null;
            key = this.attr_prefix + key;
            if (typeof (cnt[key]) == "undefined") cnt[key] = 0;
            cnt[key]++;
            this.addNode(retval, key, cnt[key], val);
        }
    }

    if (elem.childNodes &&
        elem.childNodes.length == 0 &&
        elem.nodeType == 1 && retval) {

        var key = "#text"
        var val = null
        if (typeof (cnt[key]) == "undefined") cnt[key] = 0;
        cnt[key]++;
        this.addNode(retval, key, cnt[key], val);

    }

    //  parse child nodes (recursive)
    if (elem.childNodes && elem.childNodes.length) {
        var textonly = true;
        if (retval) textonly = false;        // some attributes exists
        for (var i = 0; i < elem.childNodes.length && textonly; i++) {
            var ntype = elem.childNodes[i].nodeType;
            if (ntype == 3 || ntype == 4) continue;
            textonly = false;
        }
        if (textonly) {
            if (!retval) retval = "";
            for (var i = 0; i < elem.childNodes.length; i++) {
                if (encode)
                    retval += elem.childNodes[i].nodeValue.escapeHTML();
                else
                retval += elem.childNodes[i].nodeValue;
            }
        } else {
            if (!retval) retval = {};
            for (var i = 0; i < elem.childNodes.length; i++) {
                var key = elem.childNodes[i].nodeName;
                if (typeof (key) != "string") continue;
                var val = this.parseElement(elem.childNodes[i], encode);
                if (!val) val = null;
                if (typeof (cnt[key]) == "undefined") cnt[key] = 0;
                cnt[key]++;
                this.addNode(retval, key, cnt[key], val);
            }
        }
    }
    return retval;
};

//  method: addNode( hash, key, count, value )

XML.ObjTree.prototype.addNode = function(hash, key, cnts, val) {
    if (this.__force_array[key]) {
        if (cnts == 1) hash[key] = [];
        hash[key][hash[key].length] = val;      // push
    } else if (cnts == 1) {                   // 1st sibling
        hash[key] = val;
    } else if (cnts == 2) {                   // 2nd sibling
        hash[key] = [hash[key], val];
    } else {                                    // 3rd sibling and more
        hash[key][hash[key].length] = val;
    }
};

//  method: writeXML( tree )

XML.ObjTree.prototype.writeXML = function(tree, noHeader) {
    var xml = this.hash_to_xml(null, tree);
    if (noHeader)
        return xml;
    else
        return this.xmlDecl + xml;
};

//  method: hash_to_xml( tagName, tree )

XML.ObjTree.prototype.hash_to_xml = function(name, tree) {
    var elem = [];
    var attr = [];
    for (var key in tree) {
        if (!tree.hasOwnProperty(key)) continue;
        var val = tree[key];
        if (key.charAt(0) != this.attr_prefix) {
            if (typeof (val) == "undefined" || val == null) {
                if (key != '#text')
                    elem[elem.length] = "<" + key + " />";
                else
                    if (tree['#text'] != null)
                    elem[elem.length] = tree['#text'];
            } else if (typeof (val) == "object" && val.constructor == Array) {
                elem[elem.length] = this.array_to_xml(key, val);
            } else if (typeof (val) == "object") {
                elem[elem.length] = this.hash_to_xml(key, val);
            } else {
                elem[elem.length] = this.scalar_to_xml(key, val);
            }
        } else {
            attr[attr.length] = " " + (key.substring(1)) + '="' + (val == null ? '' : this.xml_escape(val)) + '"';
        }
    }
    var jattr = attr.join("");
    var jelem = elem.join("");
    if (typeof (name) == "undefined" || name == null) {
        // no tag
    } else if (elem.length > 0) {
        if (jelem.match(/\n/)) {
            jelem = "<" + name + jattr + ">" + jelem + "</" + name + ">";
        } else {
            jelem = "<" + name + jattr + ">" + jelem + "</" + name + ">";
        }
    } else {
        jelem = "<" + name + jattr + " />";
    }
    return jelem;
};

//  method: array_to_xml( tagName, array )

XML.ObjTree.prototype.array_to_xml = function(name, array) {
    var out = [];
    for (var i = 0; i < array.length; i++) {
        var val = array[i];
        if (typeof (val) == "undefined" || val == null) {
            if (name != '#text')
                out[out.length] = "<" + name + " />";
        } else if (typeof (val) == "object" && val.constructor == Array) {
            out[out.length] = this.array_to_xml(name, val);
        } else if (typeof (val) == "object") {
            out[out.length] = this.hash_to_xml(name, val);
        } else {
            out[out.length] = this.scalar_to_xml(name, val);
        }
    }
    return out.join("");
};

//  method: scalar_to_xml( tagName, text )

XML.ObjTree.prototype.scalar_to_xml = function(name, text) {
    if (name == "#text") {
        return this.xml_escape(text);
    } else {
        return "<" + name + ">" + this.xml_escape(text) + "</" + name + ">";
    }
};

//  method: xml_escape( text )

XML.ObjTree.prototype.xml_escape = function(text) {
    return String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
};

/* This notice must be untouched at all times.

wz_jsgraphics.js    v. 3.05
The latest version is available at
http://www.walterzorn.com
or http://www.devira.com
or http://www.walterzorn.de

Copyright (c) 2002-2009 Walter Zorn. All rights reserved.
Created 3. 11. 2002 by Walter Zorn (Web: http://www.walterzorn.com )
Last modified: 2. 2. 2009

Performance optimizations for Internet Explorer
by Thomas Frank and John Holdsworth.
fillPolygon method implemented by Matthieu Haller.

High Performance JavaScript Graphics Library.
Provides methods
- to draw lines, rectangles, ellipses, polygons
with specifiable line thickness,
- to fill rectangles, polygons, ellipses and arcs
- to draw text.
NOTE: Operations, functions and branching have rather been optimized
to efficiency and speed than to shortness of source code.

LICENSE: LGPL

This library is free software; you can redistribute it and/or
modify it under the terms of the GNU Lesser General Public
License (LGPL) as published by the Free Software Foundation; either
version 2.1 of the License, or (at your option) any later version.

This library is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
Lesser General Public License for more details.

You should have received a copy of the GNU Lesser General Public
License along with this library; if not, write to the Free Software
Foundation, Inc., 59 Temple Place, Suite 330, Boston, MA  02111-1307  USA,
or see http://www.gnu.org/copyleft/lesser.html
*/


var jg_ok, jg_ie, jg_fast, jg_dom, jg_moz;


function _chkDHTM(wnd, x, i)
// Under XUL, owner of 'document' must be specified explicitly
{
    x = wnd.document.body || null;
    jg_ie = x && typeof x.insertAdjacentHTML != "undefined" && wnd.document.createElement;
    jg_dom = (x && !jg_ie &&
        typeof x.appendChild != "undefined" &&
        typeof wnd.document.createRange != "undefined" &&
        typeof (i = wnd.document.createRange()).setStartBefore != "undefined" &&
        typeof i.createContextualFragment != "undefined");
    jg_fast = jg_ie && wnd.document.all && !wnd.opera;
    jg_moz = jg_dom && typeof x.style.MozOpacity != "undefined";
    jg_ok = !!(jg_ie || jg_dom);
}

function _pntCnvDom() {
    var x = this.wnd.document.createRange();
    x.setStartBefore(this.cnv);
    x = x.createContextualFragment(jg_fast ? this._htmRpc() : this.htm);
    if (this.cnv) this.cnv.appendChild(x);
    this.htm = "";
}

function _pntCnvIe() {
    if (this.cnv) this.cnv.insertAdjacentHTML("BeforeEnd", jg_fast ? this._htmRpc() : this.htm);
    this.htm = "";
}

function _pntDoc() {
    this.wnd.document.write(jg_fast ? this._htmRpc() : this.htm);
    this.htm = '';
}

function _pntN() {
    ;
}

function _mkDiv(x, y, w, h) {
    this.htm += '<div style="position:absolute;' +
        'left:' + x + 'px;' +
        'top:' + y + 'px;' +
        'width:' + w + 'px;' +
        'height:' + h + 'px;' +
        'clip:rect(0,' + w + 'px,' + h + 'px,0);' +
        'background-color:' + this.color +
        (!jg_moz ? ';overflow:hidden' : '') +
        ';"><\/div>';
}

function _mkDivIe(x, y, w, h) {
    this.htm += '%%' + this.color + ';' + x + ';' + y + ';' + w + ';' + h + ';';
}

function _mkDivPrt(x, y, w, h) {
    this.htm += '<div style="position:absolute;' +
        'border-left:' + w + 'px solid ' + this.color + ';' +
        'left:' + x + 'px;' +
        'top:' + y + 'px;' +
        'width:0px;' +
        'height:' + h + 'px;' +
        'clip:rect(0,' + w + 'px,' + h + 'px,0);' +
        'background-color:' + this.color +
        (!jg_moz ? ';overflow:hidden' : '') +
        ';"><\/div>';
}

var _regex = /%%([^;]+);([^;]+);([^;]+);([^;]+);([^;]+);/g;
function _htmRpc() {
    return this.htm.replace(
        _regex,
        '<div style="overflow:hidden;position:absolute;background-color:' +
        '$1;left:$2px;top:$3px;width:$4px;height:$5px"></div>\n');
}

function _htmPrtRpc() {
    return this.htm.replace(
        _regex,
        '<div style="overflow:hidden;position:absolute;background-color:' +
        '$1;left:$2px;top:$3px;width:$4px;height:$5px;border-left:$4px solid $1"></div>\n');
}

function _mkLin(x1, y1, x2, y2) {
    if (x1 > x2) {
        var _x2 = x2;
        var _y2 = y2;
        x2 = x1;
        y2 = y1;
        x1 = _x2;
        y1 = _y2;
    }
    var dx = x2 - x1, dy = Math.abs(y2 - y1),
    x = x1, y = y1,
    yIncr = (y1 > y2) ? -1 : 1;

    if (dx >= dy) {
        var pr = dy << 1,
        pru = pr - (dx << 1),
        p = pr - dx,
        ox = x;
        while (dx > 0) {
            --dx;
            ++x;
            if (p > 0) {
                this._mkDiv(ox, y, x - ox, 1);
                y += yIncr;
                p += pru;
                ox = x;
            }
            else p += pr;
        }
        this._mkDiv(ox, y, x2 - ox + 1, 1);
    }

    else {
        var pr = dx << 1,
        pru = pr - (dy << 1),
        p = pr - dy,
        oy = y;
        if (y2 <= y1) {
            while (dy > 0) {
                --dy;
                if (p > 0) {
                    this._mkDiv(x++, y, 1, oy - y + 1);
                    y += yIncr;
                    p += pru;
                    oy = y;
                }
                else {
                    y += yIncr;
                    p += pr;
                }
            }
            this._mkDiv(x2, y2, 1, oy - y2 + 1);
        }
        else {
            while (dy > 0) {
                --dy;
                y += yIncr;
                if (p > 0) {
                    this._mkDiv(x++, oy, 1, y - oy);
                    p += pru;
                    oy = y;
                }
                else p += pr;
            }
            this._mkDiv(x2, oy, 1, y2 - oy + 1);
        }
    }
}

function _mkLin2D(x1, y1, x2, y2) {
    if (x1 > x2) {
        var _x2 = x2;
        var _y2 = y2;
        x2 = x1;
        y2 = y1;
        x1 = _x2;
        y1 = _y2;
    }
    var dx = x2 - x1, dy = Math.abs(y2 - y1),
    x = x1, y = y1,
    yIncr = (y1 > y2) ? -1 : 1;

    var s = this.stroke;
    if (dx >= dy) {
        if (dx > 0 && s - 3 > 0) {
            var _s = (s * dx * Math.sqrt(1 + dy * dy / (dx * dx)) - dx - (s >> 1) * dy) / dx;
            _s = (!(s - 4) ? Math.ceil(_s) : Math.round(_s)) + 1;
        }
        else var _s = s;
        var ad = Math.ceil(s / 2);

        var pr = dy << 1,
        pru = pr - (dx << 1),
        p = pr - dx,
        ox = x;
        while (dx > 0) {
            --dx;
            ++x;
            if (p > 0) {
                this._mkDiv(ox, y, x - ox + ad, _s);
                y += yIncr;
                p += pru;
                ox = x;
            }
            else p += pr;
        }
        this._mkDiv(ox, y, x2 - ox + ad + 1, _s);
    }

    else {
        if (s - 3 > 0) {
            var _s = (s * dy * Math.sqrt(1 + dx * dx / (dy * dy)) - (s >> 1) * dx - dy) / dy;
            _s = (!(s - 4) ? Math.ceil(_s) : Math.round(_s)) + 1;
        }
        else var _s = s;
        var ad = Math.round(s / 2);

        var pr = dx << 1,
        pru = pr - (dy << 1),
        p = pr - dy,
        oy = y;
        if (y2 <= y1) {
            ++ad;
            while (dy > 0) {
                --dy;
                if (p > 0) {
                    this._mkDiv(x++, y, _s, oy - y + ad);
                    y += yIncr;
                    p += pru;
                    oy = y;
                }
                else {
                    y += yIncr;
                    p += pr;
                }
            }
            this._mkDiv(x2, y2, _s, oy - y2 + ad);
        }
        else {
            while (dy > 0) {
                --dy;
                y += yIncr;
                if (p > 0) {
                    this._mkDiv(x++, oy, _s, y - oy + ad);
                    p += pru;
                    oy = y;
                }
                else p += pr;
            }
            this._mkDiv(x2, oy, _s, y2 - oy + ad + 1);
        }
    }
}

function _mkLinDott(x1, y1, x2, y2) {
    if (x1 > x2) {
        var _x2 = x2;
        var _y2 = y2;
        x2 = x1;
        y2 = y1;
        x1 = _x2;
        y1 = _y2;
    }
    var dx = x2 - x1, dy = Math.abs(y2 - y1),
    x = x1, y = y1,
    yIncr = (y1 > y2) ? -1 : 1,
    drw = true;
    if (dx >= dy) {
        var pr = dy << 1,
        pru = pr - (dx << 1),
        p = pr - dx;
        while (dx > 0) {
            --dx;
            if (drw) this._mkDiv(x, y, 1, 1);
            drw = !drw;
            if (p > 0) {
                y += yIncr;
                p += pru;
            }
            else p += pr;
            ++x;
        }
    }
    else {
        var pr = dx << 1,
        pru = pr - (dy << 1),
        p = pr - dy;
        while (dy > 0) {
            --dy;
            if (drw) this._mkDiv(x, y, 1, 1);
            drw = !drw;
            y += yIncr;
            if (p > 0) {
                ++x;
                p += pru;
            }
            else p += pr;
        }
    }
    if (drw) this._mkDiv(x, y, 1, 1);
}

function _mkOv(left, top, width, height) {
    var a = (++width) >> 1, b = (++height) >> 1,
    wod = width & 1, hod = height & 1,
    cx = left + a, cy = top + b,
    x = 0, y = b,
    ox = 0, oy = b,
    aa2 = (a * a) << 1, aa4 = aa2 << 1, bb2 = (b * b) << 1, bb4 = bb2 << 1,
    st = (aa2 >> 1) * (1 - (b << 1)) + bb2,
    tt = (bb2 >> 1) - aa2 * ((b << 1) - 1),
    w, h;
    while (y > 0) {
        if (st < 0) {
            st += bb2 * ((x << 1) + 3);
            tt += bb4 * (++x);
        }
        else if (tt < 0) {
            st += bb2 * ((x << 1) + 3) - aa4 * (y - 1);
            tt += bb4 * (++x) - aa2 * (((y--) << 1) - 3);
            w = x - ox;
            h = oy - y;
            if ((w & 2) && (h & 2)) {
                this._mkOvQds(cx, cy, x - 2, y + 2, 1, 1, wod, hod);
                this._mkOvQds(cx, cy, x - 1, y + 1, 1, 1, wod, hod);
            }
            else this._mkOvQds(cx, cy, x - 1, oy, w, h, wod, hod);
            ox = x;
            oy = y;
        }
        else {
            tt -= aa2 * ((y << 1) - 3);
            st -= aa4 * (--y);
        }
    }
    w = a - ox + 1;
    h = (oy << 1) + hod;
    y = cy - oy;
    this._mkDiv(cx - a, y, w, h);
    this._mkDiv(cx + ox + wod - 1, y, w, h);
}

function _mkOv2D(left, top, width, height) {
    var s = this.stroke;
    width += s + 1;
    height += s + 1;
    var a = width >> 1, b = height >> 1,
    wod = width & 1, hod = height & 1,
    cx = left + a, cy = top + b,
    x = 0, y = b,
    aa2 = (a * a) << 1, aa4 = aa2 << 1, bb2 = (b * b) << 1, bb4 = bb2 << 1,
    st = (aa2 >> 1) * (1 - (b << 1)) + bb2,
    tt = (bb2 >> 1) - aa2 * ((b << 1) - 1);

    if (s - 4 < 0 && (!(s - 2) || width - 51 > 0 && height - 51 > 0)) {
        var ox = 0, oy = b,
        w, h,
        pxw;
        while (y > 0) {
            if (st < 0) {
                st += bb2 * ((x << 1) + 3);
                tt += bb4 * (++x);
            }
            else if (tt < 0) {
                st += bb2 * ((x << 1) + 3) - aa4 * (y - 1);
                tt += bb4 * (++x) - aa2 * (((y--) << 1) - 3);
                w = x - ox;
                h = oy - y;

                if (w - 1) {
                    pxw = w + 1 + (s & 1);
                    h = s;
                }
                else if (h - 1) {
                    pxw = s;
                    h += 1 + (s & 1);
                }
                else pxw = h = s;
                this._mkOvQds(cx, cy, x - 1, oy, pxw, h, wod, hod);
                ox = x;
                oy = y;
            }
            else {
                tt -= aa2 * ((y << 1) - 3);
                st -= aa4 * (--y);
            }
        }
        this._mkDiv(cx - a, cy - oy, s, (oy << 1) + hod);
        this._mkDiv(cx + a + wod - s, cy - oy, s, (oy << 1) + hod);
    }

    else {
        var _a = (width - (s << 1)) >> 1,
        _b = (height - (s << 1)) >> 1,
        _x = 0, _y = _b,
        _aa2 = (_a * _a) << 1, _aa4 = _aa2 << 1, _bb2 = (_b * _b) << 1, _bb4 = _bb2 << 1,
        _st = (_aa2 >> 1) * (1 - (_b << 1)) + _bb2,
        _tt = (_bb2 >> 1) - _aa2 * ((_b << 1) - 1),

        pxl = new Array(),
        pxt = new Array(),
        _pxb = new Array();
        pxl[0] = 0;
        pxt[0] = b;
        _pxb[0] = _b - 1;
        while (y > 0) {
            if (st < 0) {
                pxl[pxl.length] = x;
                pxt[pxt.length] = y;
                st += bb2 * ((x << 1) + 3);
                tt += bb4 * (++x);
            }
            else if (tt < 0) {
                pxl[pxl.length] = x;
                st += bb2 * ((x << 1) + 3) - aa4 * (y - 1);
                tt += bb4 * (++x) - aa2 * (((y--) << 1) - 3);
                pxt[pxt.length] = y;
            }
            else {
                tt -= aa2 * ((y << 1) - 3);
                st -= aa4 * (--y);
            }

            if (_y > 0) {
                if (_st < 0) {
                    _st += _bb2 * ((_x << 1) + 3);
                    _tt += _bb4 * (++_x);
                    _pxb[_pxb.length] = _y - 1;
                }
                else if (_tt < 0) {
                    _st += _bb2 * ((_x << 1) + 3) - _aa4 * (_y - 1);
                    _tt += _bb4 * (++_x) - _aa2 * (((_y--) << 1) - 3);
                    _pxb[_pxb.length] = _y - 1;
                }
                else {
                    _tt -= _aa2 * ((_y << 1) - 3);
                    _st -= _aa4 * (--_y);
                    _pxb[_pxb.length - 1]--;
                }
            }
        }

        var ox = -wod, oy = b,
        _oy = _pxb[0],
        l = pxl.length,
        w, h;
        for (var i = 0; i < l; i++) {
            if (typeof _pxb[i] != "undefined") {
                if (_pxb[i] < _oy || pxt[i] < oy) {
                    x = pxl[i];
                    this._mkOvQds(cx, cy, x, oy, x - ox, oy - _oy, wod, hod);
                    ox = x;
                    oy = pxt[i];
                    _oy = _pxb[i];
                }
            }
            else {
                x = pxl[i];
                this._mkDiv(cx - x, cy - oy, 1, (oy << 1) + hod);
                this._mkDiv(cx + ox + wod, cy - oy, 1, (oy << 1) + hod);
                ox = x;
                oy = pxt[i];
            }
        }
        this._mkDiv(cx - a, cy - oy, 1, (oy << 1) + hod);
        this._mkDiv(cx + ox + wod, cy - oy, 1, (oy << 1) + hod);
    }
}

function _mkOvDott(left, top, width, height) {
    var a = (++width) >> 1, b = (++height) >> 1,
    wod = width & 1, hod = height & 1, hodu = hod ^ 1,
    cx = left + a, cy = top + b,
    x = 0, y = b,
    aa2 = (a * a) << 1, aa4 = aa2 << 1, bb2 = (b * b) << 1, bb4 = bb2 << 1,
    st = (aa2 >> 1) * (1 - (b << 1)) + bb2,
    tt = (bb2 >> 1) - aa2 * ((b << 1) - 1),
    drw = true;
    while (y > 0) {
        if (st < 0) {
            st += bb2 * ((x << 1) + 3);
            tt += bb4 * (++x);
        }
        else if (tt < 0) {
            st += bb2 * ((x << 1) + 3) - aa4 * (y - 1);
            tt += bb4 * (++x) - aa2 * (((y--) << 1) - 3);
        }
        else {
            tt -= aa2 * ((y << 1) - 3);
            st -= aa4 * (--y);
        }
        if (drw && y >= hodu) this._mkOvQds(cx, cy, x, y, 1, 1, wod, hod);
        drw = !drw;
    }
}

function _mkRect(x, y, w, h) {
    var s = this.stroke;
    this._mkDiv(x, y, w, s);
    this._mkDiv(x + w, y, s, h);
    this._mkDiv(x, y + h, w + s, s);
    this._mkDiv(x, y + s, s, h - s);
}

function _mkRectDott(x, y, w, h) {
    this.drawLine(x, y, x + w, y);
    this.drawLine(x + w, y, x + w, y + h);
    this.drawLine(x, y + h, x + w, y + h);
    this.drawLine(x, y, x, y + h);
}

function jsgFont() {
    this.PLAIN = 'font-weight:normal;';
    this.BOLD = 'font-weight:bold;';
    this.ITALIC = 'font-style:italic;';
    this.ITALIC_BOLD = this.ITALIC + this.BOLD;
    this.BOLD_ITALIC = this.ITALIC_BOLD;
}
var Font = new jsgFont();

function jsgStroke() {
    this.DOTTED = -1;
}
var Stroke = new jsgStroke();

function jsGraphics(cnv, wnd) {
    this.setColor = function(x) {
        this.color = x.toLowerCase();
    };

    this.setStroke = function(x) {
        this.stroke = x;
        if (!(x + 1)) {
            this.drawLine = _mkLinDott;
            this._mkOv = _mkOvDott;
            this.drawRect = _mkRectDott;
        }
        else if (x - 1 > 0) {
            this.drawLine = _mkLin2D;
            this._mkOv = _mkOv2D;
            this.drawRect = _mkRect;
        }
        else {
            this.drawLine = _mkLin;
            this._mkOv = _mkOv;
            this.drawRect = _mkRect;
        }
    };

    this.setPrintable = function(arg) {
        this.printable = arg;
        if (jg_fast) {
            this._mkDiv = _mkDivIe;
            this._htmRpc = arg ? _htmPrtRpc : _htmRpc;
        }
        else this._mkDiv = arg ? _mkDivPrt : _mkDiv;
    };

    this.setFont = function(fam, sz, sty) {
        this.ftFam = fam;
        this.ftSz = sz;
        this.ftSty = sty || Font.PLAIN;
    };

    this.drawPolyline = this.drawPolyLine = function(x, y) {
        for (var i = x.length - 1; i; ) {
            --i;
            this.drawLine(x[i], y[i], x[i + 1], y[i + 1]);
        }
    };

    this.fillRect = function(x, y, w, h) {
        this._mkDiv(x, y, w, h);
    };

    this.drawPolygon = function(x, y) {
        this.drawPolyline(x, y);
        this.drawLine(x[x.length - 1], y[x.length - 1], x[0], y[0]);
    };

    this.drawEllipse = this.drawOval = function(x, y, w, h) {
        this._mkOv(x, y, w, h);
    };

    this.fillEllipse = this.fillOval = function(left, top, w, h) {
        var a = w >> 1, b = h >> 1,
        wod = w & 1, hod = h & 1,
        cx = left + a, cy = top + b,
        x = 0, y = b, oy = b,
        aa2 = (a * a) << 1, aa4 = aa2 << 1, bb2 = (b * b) << 1, bb4 = bb2 << 1,
        st = (aa2 >> 1) * (1 - (b << 1)) + bb2,
        tt = (bb2 >> 1) - aa2 * ((b << 1) - 1),
        xl, dw, dh;
        if (w) while (y > 0) {
            if (st < 0) {
                st += bb2 * ((x << 1) + 3);
                tt += bb4 * (++x);
            }
            else if (tt < 0) {
                st += bb2 * ((x << 1) + 3) - aa4 * (y - 1);
                xl = cx - x;
                dw = (x << 1) + wod;
                tt += bb4 * (++x) - aa2 * (((y--) << 1) - 3);
                dh = oy - y;
                this._mkDiv(xl, cy - oy, dw, dh);
                this._mkDiv(xl, cy + y + hod, dw, dh);
                oy = y;
            }
            else {
                tt -= aa2 * ((y << 1) - 3);
                st -= aa4 * (--y);
            }
        }
        this._mkDiv(cx - a, cy - oy, w, (oy << 1) + hod);
    };

    this.fillArc = function(iL, iT, iW, iH, fAngA, fAngZ) {
        var a = iW >> 1, b = iH >> 1,
        iOdds = (iW & 1) | ((iH & 1) << 16),
        cx = iL + a, cy = iT + b,
        x = 0, y = b, ox = x, oy = y,
        aa2 = (a * a) << 1, aa4 = aa2 << 1, bb2 = (b * b) << 1, bb4 = bb2 << 1,
        st = (aa2 >> 1) * (1 - (b << 1)) + bb2,
        tt = (bb2 >> 1) - aa2 * ((b << 1) - 1),
        // Vars for radial boundary lines
        xEndA, yEndA, xEndZ, yEndZ,
        iSects = (1 << (Math.floor((fAngA %= 360.0) / 180.0) << 3))
                | (2 << (Math.floor((fAngZ %= 360.0) / 180.0) << 3))
                | ((fAngA >= fAngZ) << 16),
        aBndA = new Array(b + 1), aBndZ = new Array(b + 1);

        // Set up radial boundary lines
        fAngA *= Math.PI / 180.0;
        fAngZ *= Math.PI / 180.0;
        xEndA = cx + Math.round(a * Math.cos(fAngA));
        yEndA = cy + Math.round(-b * Math.sin(fAngA));
        _mkLinVirt(aBndA, cx, cy, xEndA, yEndA);
        xEndZ = cx + Math.round(a * Math.cos(fAngZ));
        yEndZ = cy + Math.round(-b * Math.sin(fAngZ));
        _mkLinVirt(aBndZ, cx, cy, xEndZ, yEndZ);

        while (y > 0) {
            if (st < 0) // Advance x
            {
                st += bb2 * ((x << 1) + 3);
                tt += bb4 * (++x);
            }
            else if (tt < 0) // Advance x and y
            {
                st += bb2 * ((x << 1) + 3) - aa4 * (y - 1);
                ox = x;
                tt += bb4 * (++x) - aa2 * (((y--) << 1) - 3);
                this._mkArcDiv(ox, y, oy, cx, cy, iOdds, aBndA, aBndZ, iSects);
                oy = y;
            }
            else // Advance y
            {
                tt -= aa2 * ((y << 1) - 3);
                st -= aa4 * (--y);
                if (y && (aBndA[y] != aBndA[y - 1] || aBndZ[y] != aBndZ[y - 1])) {
                    this._mkArcDiv(x, y, oy, cx, cy, iOdds, aBndA, aBndZ, iSects);
                    ox = x;
                    oy = y;
                }
            }
        }
        this._mkArcDiv(x, 0, oy, cx, cy, iOdds, aBndA, aBndZ, iSects);
        if (iOdds >> 16) // Odd height
        {
            if (iSects >> 16) // Start-angle > end-angle
            {
                var xl = (yEndA <= cy || yEndZ > cy) ? (cx - x) : cx;
                this._mkDiv(xl, cy, x + cx - xl + (iOdds & 0xffff), 1);
            }
            else if ((iSects & 0x01) && yEndZ > cy)
                this._mkDiv(cx - x, cy, x, 1);
        }
    };

    /* fillPolygon method, implemented by Matthieu Haller.
    This javascript function is an adaptation of the gdImageFilledPolygon for Walter Zorn lib.
    C source of GD 1.8.4 found at http://www.boutell.com/gd/

THANKS to Kirsten Schulz for the polygon fixes!

The intersection finding technique of this code could be improved
    by remembering the previous intertersection, and by using the slope.
    That could help to adjust intersections to produce a nice
    interior_extrema. */
    this.fillPolygon = function(array_x, array_y) {
        var i;
        var y;
        var miny, maxy;
        var x1, y1;
        var x2, y2;
        var ind1, ind2;
        var ints;

        var n = array_x.length;
        if (!n) return;

        miny = array_y[0];
        maxy = array_y[0];
        for (i = 1; i < n; i++) {
            if (array_y[i] < miny)
                miny = array_y[i];

            if (array_y[i] > maxy)
                maxy = array_y[i];
        }
        for (y = miny; y <= maxy; y++) {
            var polyInts = new Array();
            ints = 0;
            for (i = 0; i < n; i++) {
                if (!i) {
                    ind1 = n - 1;
                    ind2 = 0;
                }
                else {
                    ind1 = i - 1;
                    ind2 = i;
                }
                y1 = array_y[ind1];
                y2 = array_y[ind2];
                if (y1 < y2) {
                    x1 = array_x[ind1];
                    x2 = array_x[ind2];
                }
                else if (y1 > y2) {
                    y2 = array_y[ind1];
                    y1 = array_y[ind2];
                    x2 = array_x[ind1];
                    x1 = array_x[ind2];
                }
                else continue;

                //  Modified 11. 2. 2004 Walter Zorn
                if ((y >= y1) && (y < y2))
                    polyInts[ints++] = Math.round((y - y1) * (x2 - x1) / (y2 - y1) + x1);

                else if ((y == maxy) && (y > y1) && (y <= y2))
                    polyInts[ints++] = Math.round((y - y1) * (x2 - x1) / (y2 - y1) + x1);
            }
            polyInts.sort(_CompInt);
            for (i = 0; i < ints; i += 2)
                this._mkDiv(polyInts[i], y, polyInts[i + 1] - polyInts[i] + 1, 1);
        }
    };

    this.drawString = function(txt, x, y) {
        this.htm += '<div style="position:absolute;white-space:nowrap;' +
            'left:' + x + 'px;' +
            'top:' + y + 'px;' +
            'font-family:' + this.ftFam + ';' +
            'font-size:' + this.ftSz + ';' +
            'color:' + this.color + ';' + this.ftSty + '">' +
            txt +
            '<\/div>';
    };

    /* drawStringRect() added by Rick Blommers.
    Allows to specify the size of the text rectangle and to align the
    text both horizontally (e.g. right) and vertically within that rectangle */
    this.drawStringRect = function(txt, x, y, width, halign) {
        this.htm += '<div style="position:absolute;overflow:hidden;' +
            'left:' + x + 'px;' +
            'top:' + y + 'px;' +
            'width:' + width + 'px;' +
            'text-align:' + halign + ';' +
            'font-family:' + this.ftFam + ';' +
            'font-size:' + this.ftSz + ';' +
            'color:' + this.color + ';' + this.ftSty + '">' +
            txt +
            '<\/div>';
    };

    this.drawImage = function(imgSrc, x, y, w, h, a) {
        this.htm += '<div style="position:absolute;' +
            'left:' + x + 'px;' +
            'top:' + y + 'px;' +
        // w (width) and h (height) arguments are now optional.
        // Added by Mahmut Keygubatli, 14.1.2008
            (w ? ('width:' + w + 'px;') : '') +
            (h ? ('height:' + h + 'px;') : '') + '">' +
            '<img src="' + imgSrc + '"' + (w ? (' width="' + w + '"') : '') + (h ? (' height="' + h + '"') : '') + (a ? (' ' + a) : '') + '>' +
            '<\/div>';
    };

    this.clear = function() {
        this.htm = "";
        if (this.cnv) this.cnv.innerHTML = "";
    };

    this._mkOvQds = function(cx, cy, x, y, w, h, wod, hod) {
        var xl = cx - x, xr = cx + x + wod - w, yt = cy - y, yb = cy + y + hod - h;
        if (xr > xl + w) {
            this._mkDiv(xr, yt, w, h);
            this._mkDiv(xr, yb, w, h);
        }
        else
            w = xr - xl + w;
        this._mkDiv(xl, yt, w, h);
        this._mkDiv(xl, yb, w, h);
    };

    this._mkArcDiv = function(x, y, oy, cx, cy, iOdds, aBndA, aBndZ, iSects) {
        var xrDef = cx + x + (iOdds & 0xffff), y2, h = oy - y, xl, xr, w;

        if (!h) h = 1;
        x = cx - x;

        if (iSects & 0xff0000) // Start-angle > end-angle
        {
            y2 = cy - y - h;
            if (iSects & 0x00ff) {
                if (iSects & 0x02) {
                    xl = Math.max(x, aBndZ[y]);
                    w = xrDef - xl;
                    if (w > 0) this._mkDiv(xl, y2, w, h);
                }
                if (iSects & 0x01) {
                    xr = Math.min(xrDef, aBndA[y]);
                    w = xr - x;
                    if (w > 0) this._mkDiv(x, y2, w, h);
                }
            }
            else
                this._mkDiv(x, y2, xrDef - x, h);
            y2 = cy + y + (iOdds >> 16);
            if (iSects & 0xff00) {
                if (iSects & 0x0100) {
                    xl = Math.max(x, aBndA[y]);
                    w = xrDef - xl;
                    if (w > 0) this._mkDiv(xl, y2, w, h);
                }
                if (iSects & 0x0200) {
                    xr = Math.min(xrDef, aBndZ[y]);
                    w = xr - x;
                    if (w > 0) this._mkDiv(x, y2, w, h);
                }
            }
            else
                this._mkDiv(x, y2, xrDef - x, h);
        }
        else {
            if (iSects & 0x00ff) {
                if (iSects & 0x02)
                    xl = Math.max(x, aBndZ[y]);
                else
                    xl = x;
                if (iSects & 0x01)
                    xr = Math.min(xrDef, aBndA[y]);
                else
                    xr = xrDef;
                y2 = cy - y - h;
                w = xr - xl;
                if (w > 0) this._mkDiv(xl, y2, w, h);
            }
            if (iSects & 0xff00) {
                if (iSects & 0x0100)
                    xl = Math.max(x, aBndA[y]);
                else
                    xl = x;
                if (iSects & 0x0200)
                    xr = Math.min(xrDef, aBndZ[y]);
                else
                    xr = xrDef;
                y2 = cy + y + (iOdds >> 16);
                w = xr - xl;
                if (w > 0) this._mkDiv(xl, y2, w, h);
            }
        }
    };

    this.setStroke(1);
    this.setFont("verdana,geneva,helvetica,sans-serif", "12px", Font.PLAIN);
    this.color = "#000000";
    this.htm = "";
    this.wnd = wnd || window;

    if (!jg_ok) _chkDHTM(this.wnd);
    if (jg_ok) {
        if (cnv) {
            if (typeof (cnv) == "string")
                this.cont = document.all ? (this.wnd.document.all[cnv] || null)
                    : document.getElementById ? (this.wnd.document.getElementById(cnv) || null)
                    : null;
            else if (cnv == window.document)
                this.cont = document.getElementsByTagName("body")[0];
            // If cnv is a direct reference to a canvas DOM node
            // (option suggested by Andreas Luleich)
            else this.cont = cnv;
            // Create new canvas inside container DIV. Thus the drawing and clearing
            // methods won't interfere with the container's inner html.
            // Solution suggested by Vladimir.
            this.cnv = this.wnd.document.createElement("div");
            this.cnv.style.fontSize = 0;
            this.cont.appendChild(this.cnv);
            this.paint = jg_dom ? _pntCnvDom : _pntCnvIe;
        }
        else
            this.paint = _pntDoc;
    }
    else
        this.paint = _pntN;

    this.setPrintable(false);
}

function _mkLinVirt(aLin, x1, y1, x2, y2) {
    var dx = Math.abs(x2 - x1), dy = Math.abs(y2 - y1),
    x = x1, y = y1,
    xIncr = (x1 > x2) ? -1 : 1,
    yIncr = (y1 > y2) ? -1 : 1,
    p,
    i = 0;
    if (dx >= dy) {
        var pr = dy << 1,
        pru = pr - (dx << 1);
        p = pr - dx;
        while (dx > 0) {
            --dx;
            if (p > 0)    //  Increment y
            {
                aLin[i++] = x;
                y += yIncr;
                p += pru;
            }
            else p += pr;
            x += xIncr;
        }
    }
    else {
        var pr = dx << 1,
        pru = pr - (dy << 1);
        p = pr - dy;
        while (dy > 0) {
            --dy;
            y += yIncr;
            aLin[i++] = x;
            if (p > 0)    //  Increment x
            {
                x += xIncr;
                p += pru;
            }
            else p += pr;
        }
    }
    for (var len = aLin.length, i = len - i; i; )
        aLin[len - (i--)] = x;
};

function _CompInt(x, y) {
    return (x - y);
}

window.dhtmlHistory = {
    isIE: false,
    isOpera: false,
    isSafari: false,
    isKonquerer: false,
    isGecko: false,
    isSupported: false,
    create: function(_1) {
        var _2 = this;
        var UA = navigator.userAgent.toLowerCase();
        var _4 = navigator.platform.toLowerCase();
        var _5 = navigator.vendor || "";
        if (_5 === "KDE") {
            this.isKonqueror = true;
            this.isSupported = false;
        }
        else {
            if (typeof window.opera !== "undefined") {
                this.isOpera = true;
                this.isSupported = true;
            }
            else {
                if (typeof document.all !== "undefined") {
                    this.isIE = true;
                    this.isSupported = true;
                }
                else {
                    if (_5.indexOf("Apple Computer, Inc.") > -1 && parseFloat(navigator.appVersion) < 3.0) {
                        this.isSafari = true;
                        this.isSupported = (_4.indexOf("mac") > -1);
                    } else {
                        if (UA.indexOf("gecko") != -1) {
                            this.isGecko = true;
                            this.isSupported = true;
                        }
                    }
                }
            }
        }
        window.historyStorage.setup(_1);
        if (this.isSafari) {
            this.createSafari();
        }
        else {
            if (this.isOpera) {
                this.createOpera();
            }
        }
        var _6 = this.getCurrentLocation();
        this.currentLocation = _6;
        if (this.isIE) {
            this.createIE(_6);
        }
        var _7 = function() {
            _2.firstLoad = null;
        };
        this.addEventListener(window, "unload", _7);
        if (this.isIE) {
            this.ignoreLocationChange = true;
        }
        else {
            if (!historyStorage.hasKey(this.PAGELOADEDSTRING)) {
                this.ignoreLocationChange = true;
                this.firstLoad = true;
                historyStorage.put(this.PAGELOADEDSTRING, true);
            }
            else {
                this.ignoreLocationChange = false;
                this.fireOnNewListener = true;
            }
        }
        var _8 = function() {
            _2.checkLocation();
        };
        setInterval(_8, 100);
    },
    initialize: function() {
        if (this.isIE) {
            if (!historyStorage.hasKey(this.PAGELOADEDSTRING)) {
                this.fireOnNewListener = false;
                this.firstLoad = true;
                historyStorage.put(this.PAGELOADEDSTRING, true);
            }
            else {
                this.fireOnNewListener = true;
                this.firstLoad = false;
            }
        }
    },
    addListener: function(_9) {
        this.listener = _9;
        if (this.fireOnNewListener) {
            this.fireHistoryEvent(this.currentLocation);
            this.fireOnNewListener = false;
        }
    },
    addEventListener: function(o, e, l) {
        if (o.addEventListener) {
            o.addEventListener(e, l, false);
        }
        else {
            if (o.attachEvent) {
                o.attachEvent("on" + e, function() {
                    l(window.event);
                });
            }
        }
    },
    add: function(_d, _e) {
        if (this.isSafari) {
            _d = this.removeHash(_d);
            historyStorage.put(_d, _e);
            this.currentLocation = _d;
            window.location.hash = _d;
            this.putSafariState(_d);
        }
        else {
            var _f = this;
            var _10 = function() {
                if (_f.currentWaitTime > 0) {
                    _f.currentWaitTime = _f.currentWaitTime - _f.waitTime;
                }
                _d = _f.removeHash(_d);
                if (document.getElementById(_d) && _f.debugMode) {
                    var e = "Exception: History locations can not have the same value as _any_ IDs that might be in the document," + " due to a bug in IE; please ask the developer to choose a history location that does not match any HTML" + " IDs in this document. The following ID is already taken and cannot be a location: " + _d;
                    throw new Error(e);
                }
                historyStorage.put(_d, _e);
                _f.ignoreLocationChange = true;
                _f.ieAtomicLocationChange = true;
                _f.currentLocation = _d;
                window.location.hash = _d;
                if (_f.isIE) {
                    _f.iframe.src = "blank.html?" + _d;
                }
                _f.ieAtomicLocationChange = false;
            };
            window.setTimeout(_10, this.currentWaitTime);
            this.currentWaitTime = this.currentWaitTime + this.waitTime;
        }
    },
    isFirstLoad: function() {
        return this.firstLoad;
    },
    getVersion: function() {
        return "0.6";
    },
    getCurrentLocation: function() {
        var r = (this.isSafari ? this.getSafariState() : this.getCurrentHash());
        return r;
    },
    getCurrentHash: function() {
        var r = window.location.href;
        var i = r.indexOf("#");
        return (i >= 0 ? r.substr(i + 1) : "");
    },
    PAGELOADEDSTRING: "DhtmlHistory_pageLoaded",
    listener: null,
    waitTime: 200,
    currentWaitTime: 0,
    currentLocation: null,
    iframe: null,
    safariHistoryStartPoint: null,
    safariStack: null,
    safariLength: null,
    ignoreLocationChange: null,
    fireOnNewListener: null,
    firstLoad: null,
    ieAtomicLocationChange: null,
    createIE: function(_15) {
        this.waitTime = 400;
        var _16 = (historyStorage.debugMode ? "width: 800px;height:80px;border:1px solid black;" : historyStorage.hideStyles);
        var _17 = "rshHistoryFrame";
        var _18 = "<iframe frameborder=\"0\" id=\"" + _17 + "\" style=\"" + _16 + "\" src=\"blank.html?" + _15 + "\"></iframe>";
        document.write(_18);
        this.iframe = document.getElementById(_17);
    },
    createOpera: function() {
        this.waitTime = 400;
        var _19 = "<img src=\"javascript:location.href='javascript:dhtmlHistory.checkLocation();';\" style=\"" + historyStorage.hideStyles + "\" />";
        document.write(_19);
    },
    createSafari: function() {
        var _1a = "rshSafariForm";
        var _1b = "rshSafariStack";
        var _1c = "rshSafariLength";
        var _1d = historyStorage.debugMode ? historyStorage.showStyles : historyStorage.hideStyles;
        var _1e = (historyStorage.debugMode ? "width:800px;height:20px;border:1px solid black;margin:0;padding:0;" : historyStorage.hideStyles);
        var _1f = "<form id=\"" + _1a + "\" style=\"" + _1d + "\">" + "<input type=\"text\" style=\"" + _1e + "\" id=\"" + _1b + "\" value=\"[]\"/>" + "<input type=\"text\" style=\"" + _1e + "\" id=\"" + _1c + "\" value=\"\"/>" + "</form>";
        document.write(_1f);
        this.safariStack = document.getElementById(_1b);
        this.safariLength = document.getElementById(_1c);
        if (!historyStorage.hasKey(this.PAGELOADEDSTRING)) {
            this.safariHistoryStartPoint = history.length;
            this.safariLength.value = this.safariHistoryStartPoint;
        }
        else {
            this.safariHistoryStartPoint = this.safariLength.value;
        }
    },
    getSafariStack: function() {
        var r = this.safariStack.value;
        return historyStorage.fromJSON(r);
    },
    getSafariState: function() {
        var _21 = this.getSafariStack();
        var _22 = _21[history.length - this.safariHistoryStartPoint - 1];
        return _22;
    },
    putSafariState: function(_23) {
        var _24 = this.getSafariStack();
        _24[history.length - this.safariHistoryStartPoint] = _23;
        this.safariStack.value = historyStorage.toJSON(_24);
    },
    fireHistoryEvent: function(_25) {
        var _26 = historyStorage.get(_25);
        this.listener.call(null, _25, _26);
    },
    checkLocation: function() {
        if (!this.isIE && this.ignoreLocationChange) {
            this.ignoreLocationChange = false;
            return;
        }
        if (!this.isIE && this.ieAtomicLocationChange) {
            return;
        }
        var _27 = this.getCurrentLocation();
        if (_27 == this.currentLocation) {
            return;
        }
        this.ieAtomicLocationChange = true;
        if (this.isIE && this.getIframeHash() != _27) {
            this.iframe.src = "blank.html?" + _27;
        }
        else {
            if (this.isIE) {
                return;
            }
        }
        this.currentLocation = _27;
        this.ieAtomicLocationChange = false;
        this.fireHistoryEvent(_27);
    },
    getIframeHash: function() {
        var doc = this.iframe.contentWindow.document;
        var _29 = String(doc.location.search);
        if (_29.length == 1 && _29.charAt(0) == "?") {
            _29 = "";
        }
        else {
            if (_29.length >= 2 && _29.charAt(0) == "?") {
                _29 = _29.substring(1);
            }
        }
        return _29;
    },
    removeHash: function(_2a) {
        var r;
        if (_2a === null || _2a === undefined) {
            r = null;
        }
        else {
            if (_2a === "") {
                r = "";
            }
            else {
                if (_2a.length == 1 && _2a.charAt(0) == "#") {
                    r = "";
                }
                else {
                    if (_2a.length > 1 && _2a.charAt(0) == "#") {
                        r = _2a.substring(1);
                    }
                    else {
                        r = _2a;
                    }
                }
            }
        }
        return r;
    },
    iframeLoaded: function(_2c) {
        if (this.ignoreLocationChange) {
            this.ignoreLocationChange = false;
            return;
        }
        var _2d = String(_2c.search);
        if (_2d.length == 1 && _2d.charAt(0) == "?") {
            _2d = "";
        }
        else {
            if (_2d.length >= 2 && _2d.charAt(0) == "?") {
                _2d = _2d.substring(1);
            }
        }
        window.location.hash = _2d;
        this.fireHistoryEvent(_2d);
    }
};
window.historyStorage = {
    setup: function(_2e) {
        if (typeof _2e !== "undefined") {
            if (_2e.debugMode) {
                this.debugMode = _2e.debugMode;
            }
            if (_2e.toJSON) {
                this.toJSON = _2e.toJSON;
            }
            if (_2e.fromJSON) {
                this.fromJSON = _2e.fromJSON;
            }
        }
        var _2f = "rshStorageForm";
        var _30 = "rshStorageField";
        var _31 = this.debugMode ? historyStorage.showStyles : historyStorage.hideStyles;
        var _32 = (historyStorage.debugMode ? "width: 800px;height:80px;border:1px solid black;" : historyStorage.hideStyles);
        var _33 = "<form id=\"" + _2f + "\" style=\"" + _31 + "\">" + "<textarea id=\"" + _30 + "\" style=\"" + _32 + "\"></textarea>" + "</form>";
        document.write(_33);
        this.storageField = document.getElementById(_30);
        if (typeof window.opera !== "undefined") {
            this.storageField.focus();
        }
    },
    put: function(key, _35) {
        this.assertValidKey(key);
        if (this.hasKey(key)) {
            this.remove(key);
        }
        this.storageHash[key] = _35;
        this.saveHashTable();
    },
    get: function(key) {
        this.assertValidKey(key);
        this.loadHashTable();
        var _37 = this.storageHash[key];
        if (_37 === undefined) {
            _37 = null;
        }
        return _37;
    },
    remove: function(key) {
        this.assertValidKey(key);
        this.loadHashTable();
        delete this.storageHash[key];
        this.saveHashTable();
    },
    reset: function() {
        this.storageField.value = "";
        this.storageHash = {};
    },
    hasKey: function(key) {
        this.assertValidKey(key);
        this.loadHashTable();
        return (typeof this.storageHash[key] !== "undefined");
    },
    isValidKey: function(key) {
        return (typeof key === "string");
    },
    showStyles: "border:0;margin:0;padding:0;",
    hideStyles: "left:-1000px;top:-1000px;width:1px;height:1px;border:0;position:absolute;",
    debugMode: false,
    storageHash: {},
    hashLoaded: false,
    storageField: null,
    assertValidKey: function(key) {
        var _3c = this.isValidKey(key);
        if (!_3c && this.debugMode) {
            throw new Error("Please provide a valid key for window.historyStorage. Invalid key = " + key + ".");
        }
    },
    loadHashTable: function() {
        if (!this.hashLoaded) {
            var _3d = this.storageField.value;
            if (_3d !== "" && _3d !== null) {
                this.storageHash = this.fromJSON(_3d);
                this.hashLoaded = true;
            }
        }
    },
    saveHashTable: function() {
        this.loadHashTable();
        var _3e = this.toJSON(this.storageHash);
        this.storageField.value = _3e;
    },
    toJSON: function(o) {
        return o.toJSONString();
    },
    fromJSON: function(s) {
        return s.parseJSON();
    }
};
/**
* @version: 1.0 Alpha-1
* @author: Coolite Inc. http://www.coolite.com/
* @date: 2008-05-13
* @copyright: Copyright (c) 2006-2008, Coolite Inc. (http://www.coolite.com/). All rights reserved.
* @license: Licensed under The MIT License. See license.txt and http://www.datejs.com/license/. 
* @website: http://www.datejs.com/
*/
Date.CultureInfo = { name: "en-US", englishName: "English (United States)", nativeName: "English (United States)", dayNames: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"], abbreviatedDayNames: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"], shortestDayNames: ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"], firstLetterDayNames: ["S", "M", "T", "W", "T", "F", "S"], monthNames: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"], abbreviatedMonthNames: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"], amDesignator: "AM", pmDesignator: "PM", firstDayOfWeek: 0, twoDigitYearMax: 2029, dateElementOrder: "mdy", formatPatterns: { shortDate: "M/d/yyyy", longDate: "dddd, MMMM dd, yyyy", shortTime: "h:mm tt", longTime: "h:mm:ss tt", fullDateTime: "dddd, MMMM dd, yyyy h:mm:ss tt", sortableDateTime: "yyyy-MM-ddTHH:mm:ss", universalSortableDateTime: "yyyy-MM-dd HH:mm:ssZ", rfc1123: "ddd, dd MMM yyyy HH:mm:ss GMT", monthDay: "MMMM dd", yearMonth: "MMMM, yyyy" }, regexPatterns: { jan: /^jan(uary)?/i, feb: /^feb(ruary)?/i, mar: /^mar(ch)?/i, apr: /^apr(il)?/i, may: /^may/i, jun: /^jun(e)?/i, jul: /^jul(y)?/i, aug: /^aug(ust)?/i, sep: /^sep(t(ember)?)?/i, oct: /^oct(ober)?/i, nov: /^nov(ember)?/i, dec: /^dec(ember)?/i, sun: /^su(n(day)?)?/i, mon: /^mo(n(day)?)?/i, tue: /^tu(e(s(day)?)?)?/i, wed: /^we(d(nesday)?)?/i, thu: /^th(u(r(s(day)?)?)?)?/i, fri: /^fr(i(day)?)?/i, sat: /^sa(t(urday)?)?/i, future: /^next/i, past: /^last|past|prev(ious)?/i, add: /^(\+|aft(er)?|from|hence)/i, subtract: /^(\-|bef(ore)?|ago)/i, yesterday: /^yes(terday)?/i, today: /^t(od(ay)?)?/i, tomorrow: /^tom(orrow)?/i, now: /^n(ow)?/i, millisecond: /^ms|milli(second)?s?/i, second: /^sec(ond)?s?/i, minute: /^mn|min(ute)?s?/i, hour: /^h(our)?s?/i, week: /^w(eek)?s?/i, month: /^m(onth)?s?/i, day: /^d(ay)?s?/i, year: /^y(ear)?s?/i, shortMeridian: /^(a|p)/i, longMeridian: /^(a\.?m?\.?|p\.?m?\.?)/i, timezone: /^((e(s|d)t|c(s|d)t|m(s|d)t|p(s|d)t)|((gmt)?\s*(\+|\-)\s*\d\d\d\d?)|gmt|utc)/i, ordinalSuffix: /^\s*(st|nd|rd|th)/i, timeContext: /^\s*(\:|a(?!u|p)|p)/i }, timezones: [{ name: "UTC", offset: "-000" }, { name: "GMT", offset: "-000" }, { name: "EST", offset: "-0500" }, { name: "EDT", offset: "-0400" }, { name: "CST", offset: "-0600" }, { name: "CDT", offset: "-0500" }, { name: "MST", offset: "-0700" }, { name: "MDT", offset: "-0600" }, { name: "PST", offset: "-0800" }, { name: "PDT", offset: "-0700"}] };
(function() {
    var $D = Date, $P = $D.prototype, $C = $D.CultureInfo, p = function(s, l) {
        if (!l) { l = 2; }
        return ("000" + s).slice(l * -1);
    }; $P.clearTime = function() { this.setHours(0); this.setMinutes(0); this.setSeconds(0); this.setMilliseconds(0); return this; }; $P.setTimeToNow = function() { var n = new Date(); this.setHours(n.getHours()); this.setMinutes(n.getMinutes()); this.setSeconds(n.getSeconds()); this.setMilliseconds(n.getMilliseconds()); return this; }; $D.today = function() { return new Date().clearTime(); }; $D.compare = function(date1, date2) { if (isNaN(date1) || isNaN(date2)) { throw new Error(date1 + " - " + date2); } else if (date1 instanceof Date && date2 instanceof Date) { return (date1 < date2) ? -1 : (date1 > date2) ? 1 : 0; } else { throw new TypeError(date1 + " - " + date2); } }; $D.equals = function(date1, date2) { return (date1.compareTo(date2) === 0); }; $D.getDayNumberFromName = function(name) {
        var n = $C.dayNames, m = $C.abbreviatedDayNames, o = $C.shortestDayNames, s = name.toLowerCase(); for (var i = 0; i < n.length; i++) { if (n[i].toLowerCase() == s || m[i].toLowerCase() == s || o[i].toLowerCase() == s) { return i; } }
        return -1;
    }; $D.getMonthNumberFromName = function(name) {
        var n = $C.monthNames, m = $C.abbreviatedMonthNames, s = name.toLowerCase(); for (var i = 0; i < n.length; i++) { if (n[i].toLowerCase() == s || m[i].toLowerCase() == s) { return i; } }
        return -1;
    }; $D.isLeapYear = function(year) { return ((year % 4 === 0 && year % 100 !== 0) || year % 400 === 0); }; $D.getDaysInMonth = function(year, month) { return [31, ($D.isLeapYear(year) ? 29 : 28), 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month]; }; $D.getTimezoneAbbreviation = function(offset) {
        var z = $C.timezones, p; for (var i = 0; i < z.length; i++) { if (z[i].offset === offset) { return z[i].name; } }
        return null;
    }; $D.getTimezoneOffset = function(name) {
        var z = $C.timezones, p; for (var i = 0; i < z.length; i++) { if (z[i].name === name.toUpperCase()) { return z[i].offset; } }
        return null;
    }; $P.clone = function() { return new Date(this.getTime()); }; $P.compareTo = function(date) { return Date.compare(this, date); }; $P.equals = function(date) { return Date.equals(this, date || new Date()); }; $P.between = function(start, end) { return this.getTime() >= start.getTime() && this.getTime() <= end.getTime(); }; $P.isAfter = function(date) { return this.compareTo(date || new Date()) === 1; }; $P.isBefore = function(date) { return (this.compareTo(date || new Date()) === -1); }; $P.isToday = function() { return this.isSameDay(new Date()); }; $P.isSameDay = function(date) { return this.clone().clearTime().equals(date.clone().clearTime()); }; $P.addMilliseconds = function(value) { this.setMilliseconds(this.getMilliseconds() + value); return this; }; $P.addSeconds = function(value) { return this.addMilliseconds(value * 1000); }; $P.addMinutes = function(value) { return this.addMilliseconds(value * 60000); }; $P.addHours = function(value) { return this.addMilliseconds(value * 3600000); }; $P.addDays = function(value) { this.setDate(this.getDate() + value); return this; }; $P.addWeeks = function(value) { return this.addDays(value * 7); }; $P.addMonths = function(value) { var n = this.getDate(); this.setDate(1); this.setMonth(this.getMonth() + value); this.setDate(Math.min(n, $D.getDaysInMonth(this.getFullYear(), this.getMonth()))); return this; }; $P.addYears = function(value) { return this.addMonths(value * 12); }; $P.add = function(config) {
        if (typeof config == "number") { this._orient = config; return this; }
        var x = config; if (x.milliseconds) { this.addMilliseconds(x.milliseconds); }
        if (x.seconds) { this.addSeconds(x.seconds); }
        if (x.minutes) { this.addMinutes(x.minutes); }
        if (x.hours) { this.addHours(x.hours); }
        if (x.weeks) { this.addWeeks(x.weeks); }
        if (x.months) { this.addMonths(x.months); }
        if (x.years) { this.addYears(x.years); }
        if (x.days) { this.addDays(x.days); }
        return this;
    }; var $y, $m, $d; $P.getWeek = function() {
        var a, b, c, d, e, f, g, n, s, w; $y = (!$y) ? this.getFullYear() : $y; $m = (!$m) ? this.getMonth() + 1 : $m; $d = (!$d) ? this.getDate() : $d; if ($m <= 2) { a = $y - 1; b = (a / 4 | 0) - (a / 100 | 0) + (a / 400 | 0); c = ((a - 1) / 4 | 0) - ((a - 1) / 100 | 0) + ((a - 1) / 400 | 0); s = b - c; e = 0; f = $d - 1 + (31 * ($m - 1)); } else { a = $y; b = (a / 4 | 0) - (a / 100 | 0) + (a / 400 | 0); c = ((a - 1) / 4 | 0) - ((a - 1) / 100 | 0) + ((a - 1) / 400 | 0); s = b - c; e = s + 1; f = $d + ((153 * ($m - 3) + 2) / 5) + 58 + s; }
        g = (a + b) % 7; d = (f + g - e) % 7; n = (f + 3 - d) | 0; if (n < 0) { w = 53 - ((g - s) / 5 | 0); } else if (n > 364 + s) { w = 1; } else { w = (n / 7 | 0) + 1; }
        $y = $m = $d = null; return w;
    }; $P.getISOWeek = function() { $y = this.getUTCFullYear(); $m = this.getUTCMonth() + 1; $d = this.getUTCDate(); return p(this.getWeek()); }; $P.setWeek = function(n) { return this.moveToDayOfWeek(1).addWeeks(n - this.getWeek()); }; $D._validate = function(n, min, max, name) {
        if (typeof n == "undefined") { return false; } else if (typeof n != "number") { throw new TypeError(n + " is not a Number."); } else if (n < min || n > max) { throw new RangeError(n + " is not a valid value for " + name + "."); }
        return true;
    }; $D.validateMillisecond = function(value) { return $D._validate(value, 0, 999, "millisecond"); }; $D.validateSecond = function(value) { return $D._validate(value, 0, 59, "second"); }; $D.validateMinute = function(value) { return $D._validate(value, 0, 59, "minute"); }; $D.validateHour = function(value) { return $D._validate(value, 0, 23, "hour"); }; $D.validateDay = function(value, year, month) { return $D._validate(value, 1, $D.getDaysInMonth(year, month), "day"); }; $D.validateMonth = function(value) { return $D._validate(value, 0, 11, "month"); }; $D.validateYear = function(value) { return $D._validate(value, 0, 9999, "year"); }; $P.set = function(config) {
        if ($D.validateMillisecond(config.millisecond)) { this.addMilliseconds(config.millisecond - this.getMilliseconds()); }
        if ($D.validateSecond(config.second)) { this.addSeconds(config.second - this.getSeconds()); }
        if ($D.validateMinute(config.minute)) { this.addMinutes(config.minute - this.getMinutes()); }
        if ($D.validateHour(config.hour)) { this.addHours(config.hour - this.getHours()); }
        if ($D.validateMonth(config.month)) { this.addMonths(config.month - this.getMonth()); }
        if ($D.validateYear(config.year)) { this.addYears(config.year - this.getFullYear()); }
        if ($D.validateDay(config.day, this.getFullYear(), this.getMonth())) { this.addDays(config.day - this.getDate()); }
        if (config.timezone) { this.setTimezone(config.timezone); }
        if (config.timezoneOffset) { this.setTimezoneOffset(config.timezoneOffset); }
        if (config.week && $D._validate(config.week, 0, 53, "week")) { this.setWeek(config.week); }
        return this;
    }; $P.moveToFirstDayOfMonth = function() { return this.set({ day: 1 }); }; $P.moveToLastDayOfMonth = function() { return this.set({ day: $D.getDaysInMonth(this.getFullYear(), this.getMonth()) }); }; $P.moveToNthOccurrence = function(dayOfWeek, occurrence) {
        var shift = 0; if (occurrence > 0) { shift = occurrence - 1; }
        else if (occurrence === -1) {
            this.moveToLastDayOfMonth(); if (this.getDay() !== dayOfWeek) { this.moveToDayOfWeek(dayOfWeek, -1); }
            return this;
        }
        return this.moveToFirstDayOfMonth().addDays(-1).moveToDayOfWeek(dayOfWeek, +1).addWeeks(shift);
    }; $P.moveToDayOfWeek = function(dayOfWeek, orient) { var diff = (dayOfWeek - this.getDay() + 7 * (orient || +1)) % 7; return this.addDays((diff === 0) ? diff += 7 * (orient || +1) : diff); }; $P.moveToMonth = function(month, orient) { var diff = (month - this.getMonth() + 12 * (orient || +1)) % 12; return this.addMonths((diff === 0) ? diff += 12 * (orient || +1) : diff); }; $P.getOrdinalNumber = function() { return Math.ceil((this.clone().clearTime() - new Date(this.getFullYear(), 0, 1)) / 86400000) + 1; }; $P.getTimezone = function() { return $D.getTimezoneAbbreviation(this.getUTCOffset()); }; $P.setTimezoneOffset = function(offset) { var here = this.getTimezoneOffset(), there = Number(offset) * -6 / 10; return this.addMinutes(there - here); }; $P.setTimezone = function(offset) { return this.setTimezoneOffset($D.getTimezoneOffset(offset)); }; $P.hasDaylightSavingTime = function() { return (Date.today().set({ month: 0, day: 1 }).getTimezoneOffset() !== Date.today().set({ month: 6, day: 1 }).getTimezoneOffset()); }; $P.isDaylightSavingTime = function() { return (this.hasDaylightSavingTime() && new Date().getTimezoneOffset() === Date.today().set({ month: 6, day: 1 }).getTimezoneOffset()); }; $P.getUTCOffset = function() { var n = this.getTimezoneOffset() * -10 / 6, r; if (n < 0) { r = (n - 10000).toString(); return r.charAt(0) + r.substr(2); } else { r = (n + 10000).toString(); return "+" + r.substr(1); } }; $P.getElapsed = function(date) { return (date || new Date()) - this; }; if (!$P.toISOString) {
        $P.toISOString = function() {
            function f(n) { return n < 10 ? '0' + n : n; }
            return '"' + this.getUTCFullYear() + '-' +
f(this.getUTCMonth() + 1) + '-' +
f(this.getUTCDate()) + 'T' +
f(this.getUTCHours()) + ':' +
f(this.getUTCMinutes()) + ':' +
f(this.getUTCSeconds()) + 'Z"';
        };
    }
    $P._toString = $P.toString; $P.toString = function(format) {
        var x = this; if (format && format.length == 1) { var c = $C.formatPatterns; x.t = x.toString; switch (format) { case "d": return x.t(c.shortDate); case "D": return x.t(c.longDate); case "F": return x.t(c.fullDateTime); case "m": return x.t(c.monthDay); case "r": return x.t(c.rfc1123); case "s": return x.t(c.sortableDateTime); case "t": return x.t(c.shortTime); case "T": return x.t(c.longTime); case "u": return x.t(c.universalSortableDateTime); case "y": return x.t(c.yearMonth); } }
        var ord = function(n) { switch (n * 1) { case 1: case 21: case 31: return "st"; case 2: case 22: return "nd"; case 3: case 23: return "rd"; default: return "th"; } }; return format ? format.replace(/(\\)?(dd?d?d?|MM?M?M?|yy?y?y?|hh?|HH?|mm?|ss?|tt?|S)/g, function(m) {
            if (m.charAt(0) === "\\") { return m.replace("\\", ""); }
            x.h = x.getHours; switch (m) { case "hh": return p(x.h() < 13 ? (x.h() === 0 ? 12 : x.h()) : (x.h() - 12)); case "h": return x.h() < 13 ? (x.h() === 0 ? 12 : x.h()) : (x.h() - 12); case "HH": return p(x.h()); case "H": return x.h(); case "mm": return p(x.getMinutes()); case "m": return x.getMinutes(); case "ss": return p(x.getSeconds()); case "s": return x.getSeconds(); case "yyyy": return p(x.getFullYear(), 4); case "yy": return p(x.getFullYear()); case "dddd": return $C.dayNames[x.getDay()]; case "ddd": return $C.abbreviatedDayNames[x.getDay()]; case "dd": return p(x.getDate()); case "d": return x.getDate(); case "MMMM": return $C.monthNames[x.getMonth()]; case "MMM": return $C.abbreviatedMonthNames[x.getMonth()]; case "MM": return p((x.getMonth() + 1)); case "M": return x.getMonth() + 1; case "t": return x.h() < 12 ? $C.amDesignator.substring(0, 1) : $C.pmDesignator.substring(0, 1); case "tt": return x.h() < 12 ? $C.amDesignator : $C.pmDesignator; case "S": return ord(x.getDate()); default: return m; } 
        }) : this._toString();
    };
} ());
(function() {
    var $D = Date, $P = $D.prototype, $C = $D.CultureInfo, $N = Number.prototype; $P._orient = +1; $P._nth = null; $P._is = false; $P._same = false; $P._isSecond = false; $N._dateElement = "day"; $P.next = function() { this._orient = +1; return this; }; $D.next = function() { return $D.today().next(); }; $P.last = $P.prev = $P.previous = function() { this._orient = -1; return this; }; $D.last = $D.prev = $D.previous = function() { return $D.today().last(); }; $P.is = function() { this._is = true; return this; }; $P.same = function() { this._same = true; this._isSecond = false; return this; }; $P.today = function() { return this.same().day(); }; $P.weekday = function() {
        if (this._is) { this._is = false; return (!this.is().sat() && !this.is().sun()); }
        return false;
    }; $P.at = function(time) { return (typeof time === "string") ? $D.parse(this.toString("d") + " " + time) : this.set(time); }; $N.fromNow = $N.after = function(date) { var c = {}; c[this._dateElement] = this; return ((!date) ? new Date() : date.clone()).add(c); }; $N.ago = $N.before = function(date) { var c = {}; c[this._dateElement] = this * -1; return ((!date) ? new Date() : date.clone()).add(c); }; var dx = ("sunday monday tuesday wednesday thursday friday saturday").split(/\s/), mx = ("january february march april may june july august september october november december").split(/\s/), px = ("Millisecond Second Minute Hour Day Week Month Year").split(/\s/), pxf = ("Milliseconds Seconds Minutes Hours Date Week Month FullYear").split(/\s/), nth = ("final first second third fourth fifth").split(/\s/), de; $P.toObject = function() {
        var o = {}; for (var i = 0; i < px.length; i++) { o[px[i].toLowerCase()] = this["get" + pxf[i]](); }
        return o;
    }; $D.fromObject = function(config) { config.week = null; return Date.today().set(config); }; var df = function(n) {
        return function() {
            if (this._is) { this._is = false; return this.getDay() == n; }
            if (this._nth !== null) {
                if (this._isSecond) { this.addSeconds(this._orient * -1); }
                this._isSecond = false; var ntemp = this._nth; this._nth = null; var temp = this.clone().moveToLastDayOfMonth(); this.moveToNthOccurrence(n, ntemp); if (this > temp) { throw new RangeError($D.getDayName(n) + " does not occur " + ntemp + " times in the month of " + $D.getMonthName(temp.getMonth()) + " " + temp.getFullYear() + "."); }
                return this;
            }
            return this.moveToDayOfWeek(n, this._orient);
        };
    }; var sdf = function(n) {
        return function() {
            var t = $D.today(), shift = n - t.getDay(); if (n === 0 && $C.firstDayOfWeek === 1 && t.getDay() !== 0) { shift = shift + 7; }
            return t.addDays(shift);
        };
    }; for (var i = 0; i < dx.length; i++) { $D[dx[i].toUpperCase()] = $D[dx[i].toUpperCase().substring(0, 3)] = i; $D[dx[i]] = $D[dx[i].substring(0, 3)] = sdf(i); $P[dx[i]] = $P[dx[i].substring(0, 3)] = df(i); }
    var mf = function(n) {
        return function() {
            if (this._is) { this._is = false; return this.getMonth() === n; }
            return this.moveToMonth(n, this._orient);
        };
    }; var smf = function(n) { return function() { return $D.today().set({ month: n, day: 1 }); }; }; for (var j = 0; j < mx.length; j++) { $D[mx[j].toUpperCase()] = $D[mx[j].toUpperCase().substring(0, 3)] = j; $D[mx[j]] = $D[mx[j].substring(0, 3)] = smf(j); $P[mx[j]] = $P[mx[j].substring(0, 3)] = mf(j); }
    var ef = function(j) {
        return function() {
            if (this._isSecond) { this._isSecond = false; return this; }
            if (this._same) {
                this._same = this._is = false; var o1 = this.toObject(), o2 = (arguments[0] || new Date()).toObject(), v = "", k = j.toLowerCase(); for (var m = (px.length - 1); m > -1; m--) {
                    v = px[m].toLowerCase(); if (o1[v] != o2[v]) { return false; }
                    if (k == v) { break; } 
                }
                return true;
            }
            if (j.substring(j.length - 1) != "s") { j += "s"; }
            return this["add" + j](this._orient);
        };
    }; var nf = function(n) { return function() { this._dateElement = n; return this; }; }; for (var k = 0; k < px.length; k++) { de = px[k].toLowerCase(); $P[de] = $P[de + "s"] = ef(px[k]); $N[de] = $N[de + "s"] = nf(de); }
    $P._ss = ef("Second"); var nthfn = function(n) {
        return function(dayOfWeek) {
            if (this._same) { return this._ss(arguments[0]); }
            if (dayOfWeek || dayOfWeek === 0) { return this.moveToNthOccurrence(dayOfWeek, n); }
            this._nth = n; if (n === 2 && (dayOfWeek === undefined || dayOfWeek === null)) { this._isSecond = true; return this.addSeconds(this._orient); }
            return this;
        };
    }; for (var l = 0; l < nth.length; l++) { $P[nth[l]] = (l === 0) ? nthfn(-1) : nthfn(l); } 
} ());
(function() {
    Date.Parsing = { Exception: function(s) { this.message = "Parse error at '" + s.substring(0, 10) + " ...'"; } }; var $P = Date.Parsing; var _ = $P.Operators = { rtoken: function(r) { return function(s) { var mx = s.match(r); if (mx) { return ([mx[0], s.substring(mx[0].length)]); } else { throw new $P.Exception(s); } }; }, token: function(s) { return function(s) { return _.rtoken(new RegExp("^\s*" + s + "\s*"))(s); }; }, stoken: function(s) { return _.rtoken(new RegExp("^" + s)); }, until: function(p) {
        return function(s) {
            var qx = [], rx = null; while (s.length) {
                try { rx = p.call(this, s); } catch (e) { qx.push(rx[0]); s = rx[1]; continue; }
                break;
            }
            return [qx, s];
        };
    }, many: function(p) {
        return function(s) {
            var rx = [], r = null; while (s.length) {
                try { r = p.call(this, s); } catch (e) { return [rx, s]; }
                rx.push(r[0]); s = r[1];
            }
            return [rx, s];
        };
    }, optional: function(p) {
        return function(s) {
            var r = null; try { r = p.call(this, s); } catch (e) { return [null, s]; }
            return [r[0], r[1]];
        };
    }, not: function(p) {
        return function(s) {
            try { p.call(this, s); } catch (e) { return [null, s]; }
            throw new $P.Exception(s);
        };
    }, ignore: function(p) { return p ? function(s) { var r = null; r = p.call(this, s); return [null, r[1]]; } : null; }, product: function() {
        var px = arguments[0], qx = Array.prototype.slice.call(arguments, 1), rx = []; for (var i = 0; i < px.length; i++) { rx.push(_.each(px[i], qx)); }
        return rx;
    }, cache: function(rule) {
        var cache = {}, r = null; return function(s) {
            try { r = cache[s] = (cache[s] || rule.call(this, s)); } catch (e) { r = cache[s] = e; }
            if (r instanceof $P.Exception) { throw r; } else { return r; } 
        };
    }, any: function() {
        var px = arguments; return function(s) {
            var r = null; for (var i = 0; i < px.length; i++) {
                if (px[i] == null) { continue; }
                try { r = (px[i].call(this, s)); } catch (e) { r = null; }
                if (r) { return r; } 
            }
            throw new $P.Exception(s);
        };
    }, each: function() {
        var px = arguments; return function(s) {
            var rx = [], r = null; for (var i = 0; i < px.length; i++) {
                if (px[i] == null) { continue; }
                try { r = (px[i].call(this, s)); } catch (e) { throw new $P.Exception(s); }
                rx.push(r[0]); s = r[1];
            }
            return [rx, s];
        };
    }, all: function() { var px = arguments, _ = _; return _.each(_.optional(px)); }, sequence: function(px, d, c) {
        d = d || _.rtoken(/^\s*/); c = c || null; if (px.length == 1) { return px[0]; }
        return function(s) {
            var r = null, q = null; var rx = []; for (var i = 0; i < px.length; i++) {
                try { r = px[i].call(this, s); } catch (e) { break; }
                rx.push(r[0]); try { q = d.call(this, r[1]); } catch (ex) { q = null; break; }
                s = q[1];
            }
            if (!r) { throw new $P.Exception(s); }
            if (q) { throw new $P.Exception(q[1]); }
            if (c) { try { r = c.call(this, r[1]); } catch (ey) { throw new $P.Exception(r[1]); } }
            return [rx, (r ? r[1] : s)];
        };
    }, between: function(d1, p, d2) { d2 = d2 || d1; var _fn = _.each(_.ignore(d1), p, _.ignore(d2)); return function(s) { var rx = _fn.call(this, s); return [[rx[0][0], r[0][2]], rx[1]]; }; }, list: function(p, d, c) { d = d || _.rtoken(/^\s*/); c = c || null; return (p instanceof Array ? _.each(_.product(p.slice(0, -1), _.ignore(d)), p.slice(-1), _.ignore(c)) : _.each(_.many(_.each(p, _.ignore(d))), px, _.ignore(c))); }, set: function(px, d, c) {
        d = d || _.rtoken(/^\s*/); c = c || null; return function(s) {
            var r = null, p = null, q = null, rx = null, best = [[], s], last = false; for (var i = 0; i < px.length; i++) {
                q = null; p = null; r = null; last = (px.length == 1); try { r = px[i].call(this, s); } catch (e) { continue; }
                rx = [[r[0]], r[1]]; if (r[1].length > 0 && !last) { try { q = d.call(this, r[1]); } catch (ex) { last = true; } } else { last = true; }
                if (!last && q[1].length === 0) { last = true; }
                if (!last) {
                    var qx = []; for (var j = 0; j < px.length; j++) { if (i != j) { qx.push(px[j]); } }
                    p = _.set(qx, d).call(this, q[1]); if (p[0].length > 0) { rx[0] = rx[0].concat(p[0]); rx[1] = p[1]; } 
                }
                if (rx[1].length < best[1].length) { best = rx; }
                if (best[1].length === 0) { break; } 
            }
            if (best[0].length === 0) { return best; }
            if (c) {
                try { q = c.call(this, best[1]); } catch (ey) { throw new $P.Exception(best[1]); }
                best[1] = q[1];
            }
            return best;
        };
    }, forward: function(gr, fname) { return function(s) { return gr[fname].call(this, s); }; }, replace: function(rule, repl) { return function(s) { var r = rule.call(this, s); return [repl, r[1]]; }; }, process: function(rule, fn) { return function(s) { var r = rule.call(this, s); return [fn.call(this, r[0]), r[1]]; }; }, min: function(min, rule) {
        return function(s) {
            var rx = rule.call(this, s); if (rx[0].length < min) { throw new $P.Exception(s); }
            return rx;
        };
    } 
    }; var _generator = function(op) {
        return function() {
            var args = null, rx = []; if (arguments.length > 1) { args = Array.prototype.slice.call(arguments); } else if (arguments[0] instanceof Array) { args = arguments[0]; }
            if (args) { for (var i = 0, px = args.shift(); i < px.length; i++) { args.unshift(px[i]); rx.push(op.apply(null, args)); args.shift(); return rx; } } else { return op.apply(null, arguments); } 
        };
    }; var gx = "optional not ignore cache".split(/\s/); for (var i = 0; i < gx.length; i++) { _[gx[i]] = _generator(_[gx[i]]); }
    var _vector = function(op) { return function() { if (arguments[0] instanceof Array) { return op.apply(null, arguments[0]); } else { return op.apply(null, arguments); } }; }; var vx = "each any all".split(/\s/); for (var j = 0; j < vx.length; j++) { _[vx[j]] = _vector(_[vx[j]]); } 
} ()); (function() {
    var $D = Date, $P = $D.prototype, $C = $D.CultureInfo; var flattenAndCompact = function(ax) {
        var rx = []; for (var i = 0; i < ax.length; i++) { if (ax[i] instanceof Array) { rx = rx.concat(flattenAndCompact(ax[i])); } else { if (ax[i]) { rx.push(ax[i]); } } }
        return rx;
    }; $D.Grammar = {}; $D.Translator = { hour: function(s) { return function() { this.hour = Number(s); }; }, minute: function(s) { return function() { this.minute = Number(s); }; }, second: function(s) { return function() { this.second = Number(s); }; }, meridian: function(s) { return function() { this.meridian = s.slice(0, 1).toLowerCase(); }; }, timezone: function(s) { return function() { var n = s.replace(/[^\d\+\-]/g, ""); if (n.length) { this.timezoneOffset = Number(n); } else { this.timezone = s.toLowerCase(); } }; }, day: function(x) { var s = x[0]; return function() { this.day = Number(s.match(/\d+/)[0]); }; }, month: function(s) { return function() { this.month = (s.length == 3) ? "jan feb mar apr may jun jul aug sep oct nov dec".indexOf(s) / 4 : Number(s) - 1; }; }, year: function(s) { return function() { var n = Number(s); this.year = ((s.length > 2) ? n : (n + (((n + 2000) < $C.twoDigitYearMax) ? 2000 : 1900))); }; }, rday: function(s) { return function() { switch (s) { case "yesterday": this.days = -1; break; case "tomorrow": this.days = 1; break; case "today": this.days = 0; break; case "now": this.days = 0; this.now = true; break; } }; }, finishExact: function(x) {
        x = (x instanceof Array) ? x : [x]; for (var i = 0; i < x.length; i++) { if (x[i]) { x[i].call(this); } }
        var now = new Date(); if ((this.hour || this.minute) && (!this.month && !this.year && !this.day)) { this.day = now.getDate(); }
        if (!this.year) { this.year = now.getFullYear(); }
        if (!this.month && this.month !== 0) { this.month = now.getMonth(); }
        if (!this.day) { this.day = 1; }
        if (!this.hour) { this.hour = 0; }
        if (!this.minute) { this.minute = 0; }
        if (!this.second) { this.second = 0; }
        if (this.meridian && this.hour) { if (this.meridian == "p" && this.hour < 12) { this.hour = this.hour + 12; } else if (this.meridian == "a" && this.hour == 12) { this.hour = 0; } }
        if (this.day > $D.getDaysInMonth(this.year, this.month)) { throw new RangeError(this.day + " is not a valid value for days."); }
        var r = new Date(this.year, this.month, this.day, this.hour, this.minute, this.second); if (this.timezone) { r.set({ timezone: this.timezone }); } else if (this.timezoneOffset) { r.set({ timezoneOffset: this.timezoneOffset }); }
        return r;
    }, finish: function(x) {
        x = (x instanceof Array) ? flattenAndCompact(x) : [x]; if (x.length === 0) { return null; }
        for (var i = 0; i < x.length; i++) { if (typeof x[i] == "function") { x[i].call(this); } }
        var today = $D.today(); if (this.now && !this.unit && !this.operator) { return new Date(); } else if (this.now) { today = new Date(); }
        var expression = !!(this.days && this.days !== null || this.orient || this.operator); var gap, mod, orient; orient = ((this.orient == "past" || this.operator == "subtract") ? -1 : 1); if (!this.now && "hour minute second".indexOf(this.unit) != -1) { today.setTimeToNow(); }
        if (this.month || this.month === 0) { if ("year day hour minute second".indexOf(this.unit) != -1) { this.value = this.month + 1; this.month = null; expression = true; } }
        if (!expression && this.weekday && !this.day && !this.days) {
            var temp = Date[this.weekday](); this.day = temp.getDate(); if (!this.month) { this.month = temp.getMonth(); }
            this.year = temp.getFullYear();
        }
        if (expression && this.weekday && this.unit != "month") { this.unit = "day"; gap = ($D.getDayNumberFromName(this.weekday) - today.getDay()); mod = 7; this.days = gap ? ((gap + (orient * mod)) % mod) : (orient * mod); }
        if (this.month && this.unit == "day" && this.operator) { this.value = (this.month + 1); this.month = null; }
        if (this.value != null && this.month != null && this.year != null) { this.day = this.value * 1; }
        if (this.month && !this.day && this.value) { today.set({ day: this.value * 1 }); if (!expression) { this.day = this.value * 1; } }
        if (!this.month && this.value && this.unit == "month" && !this.now) { this.month = this.value; expression = true; }
        if (expression && (this.month || this.month === 0) && this.unit != "year") { this.unit = "month"; gap = (this.month - today.getMonth()); mod = 12; this.months = gap ? ((gap + (orient * mod)) % mod) : (orient * mod); this.month = null; }
        if (!this.unit) { this.unit = "day"; }
        if (!this.value && this.operator && this.operator !== null && this[this.unit + "s"] && this[this.unit + "s"] !== null) { this[this.unit + "s"] = this[this.unit + "s"] + ((this.operator == "add") ? 1 : -1) + (this.value || 0) * orient; } else if (this[this.unit + "s"] == null || this.operator != null) {
            if (!this.value) { this.value = 1; }
            this[this.unit + "s"] = this.value * orient;
        }
        if (this.meridian && this.hour) { if (this.meridian == "p" && this.hour < 12) { this.hour = this.hour + 12; } else if (this.meridian == "a" && this.hour == 12) { this.hour = 0; } }
        if (this.weekday && !this.day && !this.days) { var temp = Date[this.weekday](); this.day = temp.getDate(); if (temp.getMonth() !== today.getMonth()) { this.month = temp.getMonth(); } }
        if ((this.month || this.month === 0) && !this.day) { this.day = 1; }
        if (!this.orient && !this.operator && this.unit == "week" && this.value && !this.day && !this.month) { return Date.today().setWeek(this.value); }
        if (expression && this.timezone && this.day && this.days) { this.day = this.days; }
        return (expression) ? today.add(this) : today.set(this);
    } 
    }; var _ = $D.Parsing.Operators, g = $D.Grammar, t = $D.Translator, _fn; g.datePartDelimiter = _.rtoken(/^([\s\-\.\,\/\x27]+)/); g.timePartDelimiter = _.stoken(":"); g.whiteSpace = _.rtoken(/^\s*/); g.generalDelimiter = _.rtoken(/^(([\s\,]|at|@|on)+)/); var _C = {}; g.ctoken = function(keys) {
        var fn = _C[keys]; if (!fn) {
            var c = $C.regexPatterns; var kx = keys.split(/\s+/), px = []; for (var i = 0; i < kx.length; i++) { px.push(_.replace(_.rtoken(c[kx[i]]), kx[i])); }
            fn = _C[keys] = _.any.apply(null, px);
        }
        return fn;
    }; g.ctoken2 = function(key) { return _.rtoken($C.regexPatterns[key]); }; g.h = _.cache(_.process(_.rtoken(/^(0[0-9]|1[0-2]|[1-9])/), t.hour)); g.hh = _.cache(_.process(_.rtoken(/^(0[0-9]|1[0-2])/), t.hour)); g.H = _.cache(_.process(_.rtoken(/^([0-1][0-9]|2[0-3]|[0-9])/), t.hour)); g.HH = _.cache(_.process(_.rtoken(/^([0-1][0-9]|2[0-3])/), t.hour)); g.m = _.cache(_.process(_.rtoken(/^([0-5][0-9]|[0-9])/), t.minute)); g.mm = _.cache(_.process(_.rtoken(/^[0-5][0-9]/), t.minute)); g.s = _.cache(_.process(_.rtoken(/^([0-5][0-9]|[0-9])/), t.second)); g.ss = _.cache(_.process(_.rtoken(/^[0-5][0-9]/), t.second)); g.hms = _.cache(_.sequence([g.H, g.m, g.s], g.timePartDelimiter)); g.t = _.cache(_.process(g.ctoken2("shortMeridian"), t.meridian)); g.tt = _.cache(_.process(g.ctoken2("longMeridian"), t.meridian)); g.z = _.cache(_.process(_.rtoken(/^((\+|\-)\s*\d\d\d\d)|((\+|\-)\d\d\:?\d\d)/), t.timezone)); g.zz = _.cache(_.process(_.rtoken(/^((\+|\-)\s*\d\d\d\d)|((\+|\-)\d\d\:?\d\d)/), t.timezone)); g.zzz = _.cache(_.process(g.ctoken2("timezone"), t.timezone)); g.timeSuffix = _.each(_.ignore(g.whiteSpace), _.set([g.tt, g.zzz])); g.time = _.each(_.optional(_.ignore(_.stoken("T"))), g.hms, g.timeSuffix); g.d = _.cache(_.process(_.each(_.rtoken(/^([0-2]\d|3[0-1]|\d)/), _.optional(g.ctoken2("ordinalSuffix"))), t.day)); g.dd = _.cache(_.process(_.each(_.rtoken(/^([0-2]\d|3[0-1])/), _.optional(g.ctoken2("ordinalSuffix"))), t.day)); g.ddd = g.dddd = _.cache(_.process(g.ctoken("sun mon tue wed thu fri sat"), function(s) { return function() { this.weekday = s; }; })); g.M = _.cache(_.process(_.rtoken(/^(1[0-2]|0\d|\d)/), t.month)); g.MM = _.cache(_.process(_.rtoken(/^(1[0-2]|0\d)/), t.month)); g.MMM = g.MMMM = _.cache(_.process(g.ctoken("jan feb mar apr may jun jul aug sep oct nov dec"), t.month)); g.y = _.cache(_.process(_.rtoken(/^(\d\d?)/), t.year)); g.yy = _.cache(_.process(_.rtoken(/^(\d\d)/), t.year)); g.yyy = _.cache(_.process(_.rtoken(/^(\d\d?\d?\d?)/), t.year)); g.yyyy = _.cache(_.process(_.rtoken(/^(\d\d\d\d)/), t.year)); _fn = function() { return _.each(_.any.apply(null, arguments), _.not(g.ctoken2("timeContext"))); }; g.day = _fn(g.d, g.dd); g.month = _fn(g.M, g.MMM); g.year = _fn(g.yyyy, g.yy); g.orientation = _.process(g.ctoken("past future"), function(s) { return function() { this.orient = s; }; }); g.operator = _.process(g.ctoken("add subtract"), function(s) { return function() { this.operator = s; }; }); g.rday = _.process(g.ctoken("yesterday tomorrow today now"), t.rday); g.unit = _.process(g.ctoken("second minute hour day week month year"), function(s) { return function() { this.unit = s; }; }); g.value = _.process(_.rtoken(/^\d\d?(st|nd|rd|th)?/), function(s) { return function() { this.value = s.replace(/\D/g, ""); }; }); g.expression = _.set([g.rday, g.operator, g.value, g.unit, g.orientation, g.ddd, g.MMM]); _fn = function() { return _.set(arguments, g.datePartDelimiter); }; g.mdy = _fn(g.ddd, g.month, g.day, g.year); g.ymd = _fn(g.ddd, g.year, g.month, g.day); g.dmy = _fn(g.ddd, g.day, g.month, g.year); g.date = function(s) { return ((g[$C.dateElementOrder] || g.mdy).call(this, s)); }; g.format = _.process(_.many(_.any(_.process(_.rtoken(/^(dd?d?d?|MM?M?M?|yy?y?y?|hh?|HH?|mm?|ss?|tt?|zz?z?)/), function(fmt) { if (g[fmt]) { return g[fmt]; } else { throw $D.Parsing.Exception(fmt); } }), _.process(_.rtoken(/^[^dMyhHmstz]+/), function(s) { return _.ignore(_.stoken(s)); }))), function(rules) { return _.process(_.each.apply(null, rules), t.finishExact); }); var _F = {}; var _get = function(f) { return _F[f] = (_F[f] || g.format(f)[0]); }; g.formats = function(fx) {
        if (fx instanceof Array) {
            var rx = []; for (var i = 0; i < fx.length; i++) { rx.push(_get(fx[i])); }
            return _.any.apply(null, rx);
        } else { return _get(fx); } 
    }; g._formats = g.formats(["\"yyyy-MM-ddTHH:mm:ssZ\"", "yyyy-MM-ddTHH:mm:ssZ", "yyyy-MM-ddTHH:mm:ssz", "yyyy-MM-ddTHH:mm:ss", "yyyy-MM-ddTHH:mmZ", "yyyy-MM-ddTHH:mmz", "yyyy-MM-ddTHH:mm", "ddd, MMM dd, yyyy H:mm:ss tt", "ddd MMM d yyyy HH:mm:ss zzz", "MMddyyyy", "ddMMyyyy", "Mddyyyy", "ddMyyyy", "Mdyyyy", "dMyyyy", "yyyy", "Mdyy", "dMyy", "d"]); g._start = _.process(_.set([g.date, g.time, g.expression], g.generalDelimiter, g.whiteSpace), t.finish); g.start = function(s) {
        try { var r = g._formats.call({}, s); if (r[1].length === 0) { return r; } } catch (e) { }
        return g._start.call({}, s);
    }; $D._parse = $D.parse; $D.parse = function(s) {
        var r = null; if (!s) { return null; }
        if (s instanceof Date) { return s; }
        try { r = $D.Grammar.start.call({}, s.replace(/^\s*(\S*(\s+\S+)*)\s*$/, "$1")); } catch (e) { return null; }
        return ((r[1].length === 0) ? r[0] : null);
    }; $D.getParseFunction = function(fx) {
        var fn = $D.Grammar.formats(fx); return function(s) {
            var r = null; try { r = fn.call({}, s); } catch (e) { return null; }
            return ((r[1].length === 0) ? r[0] : null);
        };
    }; $D.parseExact = function(s, fx) { return $D.getParseFunction(fx)(s); };
} ());

// LAB.js (LABjs :: Loading And Blocking JavaScript)
// v0.5.1 (c) Kyle Simpson
// MIT License

(function(global) {
    global.$LAB = function() {
        var _scripts = [{}],
        doc = global.document,
        _which = "head",
        _append_to = {
            "head": doc.getElementsByTagName("head"),
            "body": doc.getElementsByTagName("body")
        },
        _ready = [false],
        _load_level = 0,
        _wait = [],
        publicAPI = null;

        if (typeof _append_to["head"] !== "undefined" && _append_to["head"] !== null && _append_to["head"].length > 0) _append_to["head"] = _append_to["head"][0];
        else _append_to["head"] = null;
        if (typeof _append_to["body"] !== "undefined" && _append_to["body"] !== null && _append_to["body"].length > 0) _append_to["body"] = _append_to["body"][0];
        else _append_to["body"] = null;

        function handleScriptLoad(level, scriptentry) {
            if ((this.readyState && this.readyState !== "complete" && this.readyState !== "loaded") || scriptentry.done) { return; }
            this.onload = this.onreadystatechange = null; // prevent memory leak
            scriptentry.done = true;
            for (var i in _scripts[level]) {
                if (!(_scripts[level][i].done)) {
                    return false;
                }
            }
            _load_level++;
            _ready[level] = true;
            for (var j = 0; j < _wait[level].length; j++) {
                _wait[level][j]();
                _wait[level][j] = false;
            }
            _wait[level] = [];
        }

        function initHashes() {
            if (typeof _scripts[_load_level] === "undefined") _scripts[_load_level] = false;
            if (typeof _wait[_load_level] === "undefined") _wait[_load_level] = [];
            if (typeof _ready[_load_level] === "undefined") _ready[_load_level] = false;
        }

        function loadScript(src, type, language) {
            if (typeof type == "undefined") { var type = "text/javascript"; }
            if (typeof language == "undefined") { var language = "javascript"; }
            initHashes();
            for (var i = 0; i <= _load_level; i++) {
                if (_scripts[i] && typeof _scripts[i][src] !== "undefined") return false;
            }
            var docScripts = doc.getElementsByTagName("script"), scrRegEx = new RegExp("^(.*/)?" + src.replace(".", "\\.") + "(\\?.*)?$", "i");
            for (var i = 0; i < docScripts.length; i++) {
                scrRegEx.lastIndex = 0; // reset the regex each time so it's reusable!
                if (typeof docScripts[i].src == "string" && docScripts[i].src.match(scrRegEx)) return false;
            }
            if (!_scripts[_load_level]) _scripts[_load_level] = {};
            _scripts[_load_level][src] = { done: false };
            (function(__which, level) {
                setTimeout(function() {
                    var __append = null;
                    if (((__append = _append_to[__which]) === null) && ((__append = doc.getElementsByTagName(__which)[0]) === null)) {
                        setTimeout(function() { arguments.callee.call(null, __which); }, 25);
                        return;
                    }
                    var scriptElem = doc.createElement("script");
                    scriptElem.setAttribute("type", type);
                    scriptElem.setAttribute("language", language);
                    scriptElem.setAttribute("src", src);
                    scriptElem.onload = scriptElem.onreadystatechange = function() { handleScriptLoad.call(scriptElem, level, _scripts[level][src]); };
                    __append.appendChild(scriptElem);
                }, 0);
            })(_which, _load_level);
            _ready[_load_level] = false;
        }

        publicAPI = {
            ready: function() {
                for (var i = 0; i < _ready.length; i++) {
                    if (_scripts[i] && !_ready[i]) return false;
                }
                return true;
            },
            script: function() {
                for (var i = 0; i < arguments.length; i++) {
                    if (arguments[i].constructor == Array) {
                        arguments.callee.apply(null, arguments[i]);
                    }
                    else if (typeof arguments[i] == "object") {
                        loadScript(arguments[i].src, arguments[i].type, arguments.language);
                    }
                    else if (typeof arguments[i] == "string") {
                        loadScript(arguments[i]);
                    }
                }
                return publicAPI;
            },
            block: function(func) {
                initHashes();
                if (_scripts[_load_level] && !_ready[_load_level]) _wait[_load_level].push(func);
                else setTimeout(func, 0);
                return publicAPI;
            },
            toHEAD: function() { _which = "head"; return publicAPI; },
            toBODY: function() { _which = "body"; return publicAPI; }
        };
        return publicAPI;
    } ();
})(window);
