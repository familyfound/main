;(function(){

/**
 * Require the given path.
 *
 * @param {String} path
 * @return {Object} exports
 * @api public
 */

function require(path, parent, orig) {
  var resolved = require.resolve(path);

  // lookup failed
  if (null == resolved) {
    orig = orig || path;
    parent = parent || 'root';
    var err = new Error('Failed to require "' + orig + '" from "' + parent + '"');
    err.path = orig;
    err.parent = parent;
    err.require = true;
    throw err;
  }

  var module = require.modules[resolved];

  // perform real require()
  // by invoking the module's
  // registered function
  if (!module._resolving && !module.exports) {
    var mod = {};
    mod.exports = {};
    mod.client = mod.component = true;
    module._resolving = true;
    module.call(this, mod.exports, require.relative(resolved), mod);
    delete module._resolving;
    module.exports = mod.exports;
  }

  return module.exports;
}

/**
 * Registered modules.
 */

require.modules = {};

/**
 * Registered aliases.
 */

require.aliases = {};

/**
 * Resolve `path`.
 *
 * Lookup:
 *
 *   - PATH/index.js
 *   - PATH.js
 *   - PATH
 *
 * @param {String} path
 * @return {String} path or null
 * @api private
 */

require.resolve = function(path) {
  if (path.charAt(0) === '/') path = path.slice(1);

  var paths = [
    path,
    path + '.js',
    path + '.json',
    path + '/index.js',
    path + '/index.json'
  ];

  for (var i = 0; i < paths.length; i++) {
    var path = paths[i];
    if (require.modules.hasOwnProperty(path)) return path;
    if (require.aliases.hasOwnProperty(path)) return require.aliases[path];
  }
};

/**
 * Normalize `path` relative to the current path.
 *
 * @param {String} curr
 * @param {String} path
 * @return {String}
 * @api private
 */

require.normalize = function(curr, path) {
  var segs = [];

  if ('.' != path.charAt(0)) return path;

  curr = curr.split('/');
  path = path.split('/');

  for (var i = 0; i < path.length; ++i) {
    if ('..' == path[i]) {
      curr.pop();
    } else if ('.' != path[i] && '' != path[i]) {
      segs.push(path[i]);
    }
  }

  return curr.concat(segs).join('/');
};

/**
 * Register module at `path` with callback `definition`.
 *
 * @param {String} path
 * @param {Function} definition
 * @api private
 */

require.register = function(path, definition) {
  require.modules[path] = definition;
};

/**
 * Alias a module definition.
 *
 * @param {String} from
 * @param {String} to
 * @api private
 */

require.alias = function(from, to) {
  if (!require.modules.hasOwnProperty(from)) {
    throw new Error('Failed to alias "' + from + '", it does not exist');
  }
  require.aliases[to] = from;
};

/**
 * Return a require function relative to the `parent` path.
 *
 * @param {String} parent
 * @return {Function}
 * @api private
 */

require.relative = function(parent) {
  var p = require.normalize(parent, '..');

  /**
   * lastIndexOf helper.
   */

  function lastIndexOf(arr, obj) {
    var i = arr.length;
    while (i--) {
      if (arr[i] === obj) return i;
    }
    return -1;
  }

  /**
   * The relative require() itself.
   */

  function localRequire(path) {
    var resolved = localRequire.resolve(path);
    return require(resolved, parent, path);
  }

  /**
   * Resolve relative to the parent.
   */

  localRequire.resolve = function(path) {
    var c = path.charAt(0);
    if ('/' == c) return path.slice(1);
    if ('.' == c) return require.normalize(p, path);

    // resolve deps by returning
    // the dep in the nearest "deps"
    // directory
    var segs = parent.split('/');
    var i = lastIndexOf(segs, 'deps') + 1;
    if (!i) i = 0;
    path = segs.slice(0, i + 1).join('/') + '/deps/' + path;
    return path;
  };

  /**
   * Check if module is defined at `path`.
   */

  localRequire.exists = function(path) {
    return require.modules.hasOwnProperty(localRequire.resolve(path));
  };

  return localRequire;
};
require.register("component-emitter/index.js", Function("exports, require, module",
"\n\
/**\n\
 * Expose `Emitter`.\n\
 */\n\
\n\
module.exports = Emitter;\n\
\n\
/**\n\
 * Initialize a new `Emitter`.\n\
 *\n\
 * @api public\n\
 */\n\
\n\
function Emitter(obj) {\n\
  if (obj) return mixin(obj);\n\
};\n\
\n\
/**\n\
 * Mixin the emitter properties.\n\
 *\n\
 * @param {Object} obj\n\
 * @return {Object}\n\
 * @api private\n\
 */\n\
\n\
function mixin(obj) {\n\
  for (var key in Emitter.prototype) {\n\
    obj[key] = Emitter.prototype[key];\n\
  }\n\
  return obj;\n\
}\n\
\n\
/**\n\
 * Listen on the given `event` with `fn`.\n\
 *\n\
 * @param {String} event\n\
 * @param {Function} fn\n\
 * @return {Emitter}\n\
 * @api public\n\
 */\n\
\n\
Emitter.prototype.on =\n\
Emitter.prototype.addEventListener = function(event, fn){\n\
  this._callbacks = this._callbacks || {};\n\
  (this._callbacks[event] = this._callbacks[event] || [])\n\
    .push(fn);\n\
  return this;\n\
};\n\
\n\
/**\n\
 * Adds an `event` listener that will be invoked a single\n\
 * time then automatically removed.\n\
 *\n\
 * @param {String} event\n\
 * @param {Function} fn\n\
 * @return {Emitter}\n\
 * @api public\n\
 */\n\
\n\
Emitter.prototype.once = function(event, fn){\n\
  var self = this;\n\
  this._callbacks = this._callbacks || {};\n\
\n\
  function on() {\n\
    self.off(event, on);\n\
    fn.apply(this, arguments);\n\
  }\n\
\n\
  on.fn = fn;\n\
  this.on(event, on);\n\
  return this;\n\
};\n\
\n\
/**\n\
 * Remove the given callback for `event` or all\n\
 * registered callbacks.\n\
 *\n\
 * @param {String} event\n\
 * @param {Function} fn\n\
 * @return {Emitter}\n\
 * @api public\n\
 */\n\
\n\
Emitter.prototype.off =\n\
Emitter.prototype.removeListener =\n\
Emitter.prototype.removeAllListeners =\n\
Emitter.prototype.removeEventListener = function(event, fn){\n\
  this._callbacks = this._callbacks || {};\n\
\n\
  // all\n\
  if (0 == arguments.length) {\n\
    this._callbacks = {};\n\
    return this;\n\
  }\n\
\n\
  // specific event\n\
  var callbacks = this._callbacks[event];\n\
  if (!callbacks) return this;\n\
\n\
  // remove all handlers\n\
  if (1 == arguments.length) {\n\
    delete this._callbacks[event];\n\
    return this;\n\
  }\n\
\n\
  // remove specific handler\n\
  var cb;\n\
  for (var i = 0; i < callbacks.length; i++) {\n\
    cb = callbacks[i];\n\
    if (cb === fn || cb.fn === fn) {\n\
      callbacks.splice(i, 1);\n\
      break;\n\
    }\n\
  }\n\
  return this;\n\
};\n\
\n\
/**\n\
 * Emit `event` with the given args.\n\
 *\n\
 * @param {String} event\n\
 * @param {Mixed} ...\n\
 * @return {Emitter}\n\
 */\n\
\n\
Emitter.prototype.emit = function(event){\n\
  this._callbacks = this._callbacks || {};\n\
  var args = [].slice.call(arguments, 1)\n\
    , callbacks = this._callbacks[event];\n\
\n\
  if (callbacks) {\n\
    callbacks = callbacks.slice(0);\n\
    for (var i = 0, len = callbacks.length; i < len; ++i) {\n\
      callbacks[i].apply(this, args);\n\
    }\n\
  }\n\
\n\
  return this;\n\
};\n\
\n\
/**\n\
 * Return array of callbacks for `event`.\n\
 *\n\
 * @param {String} event\n\
 * @return {Array}\n\
 * @api public\n\
 */\n\
\n\
Emitter.prototype.listeners = function(event){\n\
  this._callbacks = this._callbacks || {};\n\
  return this._callbacks[event] || [];\n\
};\n\
\n\
/**\n\
 * Check if this emitter has `event` handlers.\n\
 *\n\
 * @param {String} event\n\
 * @return {Boolean}\n\
 * @api public\n\
 */\n\
\n\
Emitter.prototype.hasListeners = function(event){\n\
  return !! this.listeners(event).length;\n\
};\n\
//@ sourceURL=component-emitter/index.js"
));
require.register("component-reduce/index.js", Function("exports, require, module",
"\n\
/**\n\
 * Reduce `arr` with `fn`.\n\
 *\n\
 * @param {Array} arr\n\
 * @param {Function} fn\n\
 * @param {Mixed} initial\n\
 *\n\
 * TODO: combatible error handling?\n\
 */\n\
\n\
module.exports = function(arr, fn, initial){  \n\
  var idx = 0;\n\
  var len = arr.length;\n\
  var curr = arguments.length == 3\n\
    ? initial\n\
    : arr[idx++];\n\
\n\
  while (idx < len) {\n\
    curr = fn.call(null, curr, arr[idx], ++idx, arr);\n\
  }\n\
  \n\
  return curr;\n\
};//@ sourceURL=component-reduce/index.js"
));
require.register("visionmedia-superagent/lib/client.js", Function("exports, require, module",
"/**\n\
 * Module dependencies.\n\
 */\n\
\n\
var Emitter = require('emitter');\n\
var reduce = require('reduce');\n\
\n\
/**\n\
 * Root reference for iframes.\n\
 */\n\
\n\
var root = 'undefined' == typeof window\n\
  ? this\n\
  : window;\n\
\n\
/**\n\
 * Noop.\n\
 */\n\
\n\
function noop(){};\n\
\n\
/**\n\
 * Check if `obj` is a host object,\n\
 * we don't want to serialize these :)\n\
 *\n\
 * TODO: future proof, move to compoent land\n\
 *\n\
 * @param {Object} obj\n\
 * @return {Boolean}\n\
 * @api private\n\
 */\n\
\n\
function isHost(obj) {\n\
  var str = {}.toString.call(obj);\n\
\n\
  switch (str) {\n\
    case '[object File]':\n\
    case '[object Blob]':\n\
    case '[object FormData]':\n\
      return true;\n\
    default:\n\
      return false;\n\
  }\n\
}\n\
\n\
/**\n\
 * Determine XHR.\n\
 */\n\
\n\
function getXHR() {\n\
  if (root.XMLHttpRequest\n\
    && ('file:' != root.location.protocol || !root.ActiveXObject)) {\n\
    return new XMLHttpRequest;\n\
  } else {\n\
    try { return new ActiveXObject('Microsoft.XMLHTTP'); } catch(e) {}\n\
    try { return new ActiveXObject('Msxml2.XMLHTTP.6.0'); } catch(e) {}\n\
    try { return new ActiveXObject('Msxml2.XMLHTTP.3.0'); } catch(e) {}\n\
    try { return new ActiveXObject('Msxml2.XMLHTTP'); } catch(e) {}\n\
  }\n\
  return false;\n\
}\n\
\n\
/**\n\
 * Removes leading and trailing whitespace, added to support IE.\n\
 *\n\
 * @param {String} s\n\
 * @return {String}\n\
 * @api private\n\
 */\n\
\n\
var trim = ''.trim\n\
  ? function(s) { return s.trim(); }\n\
  : function(s) { return s.replace(/(^\\s*|\\s*$)/g, ''); };\n\
\n\
/**\n\
 * Check if `obj` is an object.\n\
 *\n\
 * @param {Object} obj\n\
 * @return {Boolean}\n\
 * @api private\n\
 */\n\
\n\
function isObject(obj) {\n\
  return obj === Object(obj);\n\
}\n\
\n\
/**\n\
 * Serialize the given `obj`.\n\
 *\n\
 * @param {Object} obj\n\
 * @return {String}\n\
 * @api private\n\
 */\n\
\n\
function serialize(obj) {\n\
  if (!isObject(obj)) return obj;\n\
  var pairs = [];\n\
  for (var key in obj) {\n\
    if (null != obj[key]) {\n\
      pairs.push(encodeURIComponent(key)\n\
        + '=' + encodeURIComponent(obj[key]));\n\
    }\n\
  }\n\
  return pairs.join('&');\n\
}\n\
\n\
/**\n\
 * Expose serialization method.\n\
 */\n\
\n\
 request.serializeObject = serialize;\n\
\n\
 /**\n\
  * Parse the given x-www-form-urlencoded `str`.\n\
  *\n\
  * @param {String} str\n\
  * @return {Object}\n\
  * @api private\n\
  */\n\
\n\
function parseString(str) {\n\
  var obj = {};\n\
  var pairs = str.split('&');\n\
  var parts;\n\
  var pair;\n\
\n\
  for (var i = 0, len = pairs.length; i < len; ++i) {\n\
    pair = pairs[i];\n\
    parts = pair.split('=');\n\
    obj[decodeURIComponent(parts[0])] = decodeURIComponent(parts[1]);\n\
  }\n\
\n\
  return obj;\n\
}\n\
\n\
/**\n\
 * Expose parser.\n\
 */\n\
\n\
request.parseString = parseString;\n\
\n\
/**\n\
 * Default MIME type map.\n\
 *\n\
 *     superagent.types.xml = 'application/xml';\n\
 *\n\
 */\n\
\n\
request.types = {\n\
  html: 'text/html',\n\
  json: 'application/json',\n\
  xml: 'application/xml',\n\
  urlencoded: 'application/x-www-form-urlencoded',\n\
  'form': 'application/x-www-form-urlencoded',\n\
  'form-data': 'application/x-www-form-urlencoded'\n\
};\n\
\n\
/**\n\
 * Default serialization map.\n\
 *\n\
 *     superagent.serialize['application/xml'] = function(obj){\n\
 *       return 'generated xml here';\n\
 *     };\n\
 *\n\
 */\n\
\n\
 request.serialize = {\n\
   'application/x-www-form-urlencoded': serialize,\n\
   'application/json': JSON.stringify\n\
 };\n\
\n\
 /**\n\
  * Default parsers.\n\
  *\n\
  *     superagent.parse['application/xml'] = function(str){\n\
  *       return { object parsed from str };\n\
  *     };\n\
  *\n\
  */\n\
\n\
request.parse = {\n\
  'application/x-www-form-urlencoded': parseString,\n\
  'application/json': JSON.parse\n\
};\n\
\n\
/**\n\
 * Parse the given header `str` into\n\
 * an object containing the mapped fields.\n\
 *\n\
 * @param {String} str\n\
 * @return {Object}\n\
 * @api private\n\
 */\n\
\n\
function parseHeader(str) {\n\
  var lines = str.split(/\\r?\\n\
/);\n\
  var fields = {};\n\
  var index;\n\
  var line;\n\
  var field;\n\
  var val;\n\
\n\
  lines.pop(); // trailing CRLF\n\
\n\
  for (var i = 0, len = lines.length; i < len; ++i) {\n\
    line = lines[i];\n\
    index = line.indexOf(':');\n\
    field = line.slice(0, index).toLowerCase();\n\
    val = trim(line.slice(index + 1));\n\
    fields[field] = val;\n\
  }\n\
\n\
  return fields;\n\
}\n\
\n\
/**\n\
 * Return the mime type for the given `str`.\n\
 *\n\
 * @param {String} str\n\
 * @return {String}\n\
 * @api private\n\
 */\n\
\n\
function type(str){\n\
  return str.split(/ *; */).shift();\n\
};\n\
\n\
/**\n\
 * Return header field parameters.\n\
 *\n\
 * @param {String} str\n\
 * @return {Object}\n\
 * @api private\n\
 */\n\
\n\
function params(str){\n\
  return reduce(str.split(/ *; */), function(obj, str){\n\
    var parts = str.split(/ *= */)\n\
      , key = parts.shift()\n\
      , val = parts.shift();\n\
\n\
    if (key && val) obj[key] = val;\n\
    return obj;\n\
  }, {});\n\
};\n\
\n\
/**\n\
 * Initialize a new `Response` with the given `xhr`.\n\
 *\n\
 *  - set flags (.ok, .error, etc)\n\
 *  - parse header\n\
 *\n\
 * Examples:\n\
 *\n\
 *  Aliasing `superagent` as `request` is nice:\n\
 *\n\
 *      request = superagent;\n\
 *\n\
 *  We can use the promise-like API, or pass callbacks:\n\
 *\n\
 *      request.get('/').end(function(res){});\n\
 *      request.get('/', function(res){});\n\
 *\n\
 *  Sending data can be chained:\n\
 *\n\
 *      request\n\
 *        .post('/user')\n\
 *        .send({ name: 'tj' })\n\
 *        .end(function(res){});\n\
 *\n\
 *  Or passed to `.send()`:\n\
 *\n\
 *      request\n\
 *        .post('/user')\n\
 *        .send({ name: 'tj' }, function(res){});\n\
 *\n\
 *  Or passed to `.post()`:\n\
 *\n\
 *      request\n\
 *        .post('/user', { name: 'tj' })\n\
 *        .end(function(res){});\n\
 *\n\
 * Or further reduced to a single call for simple cases:\n\
 *\n\
 *      request\n\
 *        .post('/user', { name: 'tj' }, function(res){});\n\
 *\n\
 * @param {XMLHTTPRequest} xhr\n\
 * @param {Object} options\n\
 * @api private\n\
 */\n\
\n\
function Response(req, options) {\n\
  options = options || {};\n\
  this.req = req;\n\
  this.xhr = this.req.xhr;\n\
  this.text = this.xhr.responseText;\n\
  this.setStatusProperties(this.xhr.status);\n\
  this.header = this.headers = parseHeader(this.xhr.getAllResponseHeaders());\n\
  // getAllResponseHeaders sometimes falsely returns \"\" for CORS requests, but\n\
  // getResponseHeader still works. so we get content-type even if getting\n\
  // other headers fails.\n\
  this.header['content-type'] = this.xhr.getResponseHeader('content-type');\n\
  this.setHeaderProperties(this.header);\n\
  this.body = this.req.method != 'HEAD'\n\
    ? this.parseBody(this.text)\n\
    : null;\n\
}\n\
\n\
/**\n\
 * Get case-insensitive `field` value.\n\
 *\n\
 * @param {String} field\n\
 * @return {String}\n\
 * @api public\n\
 */\n\
\n\
Response.prototype.get = function(field){\n\
  return this.header[field.toLowerCase()];\n\
};\n\
\n\
/**\n\
 * Set header related properties:\n\
 *\n\
 *   - `.type` the content type without params\n\
 *\n\
 * A response of \"Content-Type: text/plain; charset=utf-8\"\n\
 * will provide you with a `.type` of \"text/plain\".\n\
 *\n\
 * @param {Object} header\n\
 * @api private\n\
 */\n\
\n\
Response.prototype.setHeaderProperties = function(header){\n\
  // content-type\n\
  var ct = this.header['content-type'] || '';\n\
  this.type = type(ct);\n\
\n\
  // params\n\
  var obj = params(ct);\n\
  for (var key in obj) this[key] = obj[key];\n\
};\n\
\n\
/**\n\
 * Parse the given body `str`.\n\
 *\n\
 * Used for auto-parsing of bodies. Parsers\n\
 * are defined on the `superagent.parse` object.\n\
 *\n\
 * @param {String} str\n\
 * @return {Mixed}\n\
 * @api private\n\
 */\n\
\n\
Response.prototype.parseBody = function(str){\n\
  var parse = request.parse[this.type];\n\
  return parse\n\
    ? parse(str)\n\
    : null;\n\
};\n\
\n\
/**\n\
 * Set flags such as `.ok` based on `status`.\n\
 *\n\
 * For example a 2xx response will give you a `.ok` of __true__\n\
 * whereas 5xx will be __false__ and `.error` will be __true__. The\n\
 * `.clientError` and `.serverError` are also available to be more\n\
 * specific, and `.statusType` is the class of error ranging from 1..5\n\
 * sometimes useful for mapping respond colors etc.\n\
 *\n\
 * \"sugar\" properties are also defined for common cases. Currently providing:\n\
 *\n\
 *   - .noContent\n\
 *   - .badRequest\n\
 *   - .unauthorized\n\
 *   - .notAcceptable\n\
 *   - .notFound\n\
 *\n\
 * @param {Number} status\n\
 * @api private\n\
 */\n\
\n\
Response.prototype.setStatusProperties = function(status){\n\
  var type = status / 100 | 0;\n\
\n\
  // status / class\n\
  this.status = status;\n\
  this.statusType = type;\n\
\n\
  // basics\n\
  this.info = 1 == type;\n\
  this.ok = 2 == type;\n\
  this.clientError = 4 == type;\n\
  this.serverError = 5 == type;\n\
  this.error = (4 == type || 5 == type)\n\
    ? this.toError()\n\
    : false;\n\
\n\
  // sugar\n\
  this.accepted = 202 == status;\n\
  this.noContent = 204 == status || 1223 == status;\n\
  this.badRequest = 400 == status;\n\
  this.unauthorized = 401 == status;\n\
  this.notAcceptable = 406 == status;\n\
  this.notFound = 404 == status;\n\
  this.forbidden = 403 == status;\n\
};\n\
\n\
/**\n\
 * Return an `Error` representative of this response.\n\
 *\n\
 * @return {Error}\n\
 * @api public\n\
 */\n\
\n\
Response.prototype.toError = function(){\n\
  var req = this.req;\n\
  var method = req.method;\n\
  var path = req.path;\n\
\n\
  var msg = 'cannot ' + method + ' ' + path + ' (' + this.status + ')';\n\
  var err = new Error(msg);\n\
  err.status = this.status;\n\
  err.method = method;\n\
  err.path = path;\n\
\n\
  return err;\n\
};\n\
\n\
/**\n\
 * Expose `Response`.\n\
 */\n\
\n\
request.Response = Response;\n\
\n\
/**\n\
 * Initialize a new `Request` with the given `method` and `url`.\n\
 *\n\
 * @param {String} method\n\
 * @param {String} url\n\
 * @api public\n\
 */\n\
\n\
function Request(method, url) {\n\
  var self = this;\n\
  Emitter.call(this);\n\
  this._query = this._query || [];\n\
  this.method = method;\n\
  this.url = url;\n\
  this.header = {};\n\
  this._header = {};\n\
  this.on('end', function(){\n\
    var res = new Response(self);\n\
    if ('HEAD' == method) res.text = null;\n\
    self.callback(null, res);\n\
  });\n\
}\n\
\n\
/**\n\
 * Mixin `Emitter`.\n\
 */\n\
\n\
Emitter(Request.prototype);\n\
\n\
/**\n\
 * Set timeout to `ms`.\n\
 *\n\
 * @param {Number} ms\n\
 * @return {Request} for chaining\n\
 * @api public\n\
 */\n\
\n\
Request.prototype.timeout = function(ms){\n\
  this._timeout = ms;\n\
  return this;\n\
};\n\
\n\
/**\n\
 * Clear previous timeout.\n\
 *\n\
 * @return {Request} for chaining\n\
 * @api public\n\
 */\n\
\n\
Request.prototype.clearTimeout = function(){\n\
  this._timeout = 0;\n\
  clearTimeout(this._timer);\n\
  return this;\n\
};\n\
\n\
/**\n\
 * Abort the request, and clear potential timeout.\n\
 *\n\
 * @return {Request}\n\
 * @api public\n\
 */\n\
\n\
Request.prototype.abort = function(){\n\
  if (this.aborted) return;\n\
  this.aborted = true;\n\
  this.xhr.abort();\n\
  this.clearTimeout();\n\
  this.emit('abort');\n\
  return this;\n\
};\n\
\n\
/**\n\
 * Set header `field` to `val`, or multiple fields with one object.\n\
 *\n\
 * Examples:\n\
 *\n\
 *      req.get('/')\n\
 *        .set('Accept', 'application/json')\n\
 *        .set('X-API-Key', 'foobar')\n\
 *        .end(callback);\n\
 *\n\
 *      req.get('/')\n\
 *        .set({ Accept: 'application/json', 'X-API-Key': 'foobar' })\n\
 *        .end(callback);\n\
 *\n\
 * @param {String|Object} field\n\
 * @param {String} val\n\
 * @return {Request} for chaining\n\
 * @api public\n\
 */\n\
\n\
Request.prototype.set = function(field, val){\n\
  if (isObject(field)) {\n\
    for (var key in field) {\n\
      this.set(key, field[key]);\n\
    }\n\
    return this;\n\
  }\n\
  this._header[field.toLowerCase()] = val;\n\
  this.header[field] = val;\n\
  return this;\n\
};\n\
\n\
/**\n\
 * Get case-insensitive header `field` value.\n\
 *\n\
 * @param {String} field\n\
 * @return {String}\n\
 * @api private\n\
 */\n\
\n\
Request.prototype.getHeader = function(field){\n\
  return this._header[field.toLowerCase()];\n\
};\n\
\n\
/**\n\
 * Set Content-Type to `type`, mapping values from `request.types`.\n\
 *\n\
 * Examples:\n\
 *\n\
 *      superagent.types.xml = 'application/xml';\n\
 *\n\
 *      request.post('/')\n\
 *        .type('xml')\n\
 *        .send(xmlstring)\n\
 *        .end(callback);\n\
 *\n\
 *      request.post('/')\n\
 *        .type('application/xml')\n\
 *        .send(xmlstring)\n\
 *        .end(callback);\n\
 *\n\
 * @param {String} type\n\
 * @return {Request} for chaining\n\
 * @api public\n\
 */\n\
\n\
Request.prototype.type = function(type){\n\
  this.set('Content-Type', request.types[type] || type);\n\
  return this;\n\
};\n\
\n\
/**\n\
 * Set Accept to `type`, mapping values from `request.types`.\n\
 *\n\
 * Examples:\n\
 *\n\
 *      superagent.types.json = 'application/json';\n\
 *\n\
 *      request.get('/agent')\n\
 *        .accept('json')\n\
 *        .end(callback);\n\
 *\n\
 *      request.get('/agent')\n\
 *        .accept('application/json')\n\
 *        .end(callback);\n\
 *\n\
 * @param {String} accept\n\
 * @return {Request} for chaining\n\
 * @api public\n\
 */\n\
\n\
Request.prototype.accept = function(type){\n\
  this.set('Accept', request.types[type] || type);\n\
  return this;\n\
};\n\
\n\
/**\n\
 * Set Authorization field value with `user` and `pass`.\n\
 *\n\
 * @param {String} user\n\
 * @param {String} pass\n\
 * @return {Request} for chaining\n\
 * @api public\n\
 */\n\
\n\
Request.prototype.auth = function(user, pass){\n\
  var str = btoa(user + ':' + pass);\n\
  this.set('Authorization', 'Basic ' + str);\n\
  return this;\n\
};\n\
\n\
/**\n\
* Add query-string `val`.\n\
*\n\
* Examples:\n\
*\n\
*   request.get('/shoes')\n\
*     .query('size=10')\n\
*     .query({ color: 'blue' })\n\
*\n\
* @param {Object|String} val\n\
* @return {Request} for chaining\n\
* @api public\n\
*/\n\
\n\
Request.prototype.query = function(val){\n\
  if ('string' != typeof val) val = serialize(val);\n\
  if (val) this._query.push(val);\n\
  return this;\n\
};\n\
\n\
/**\n\
 * Send `data`, defaulting the `.type()` to \"json\" when\n\
 * an object is given.\n\
 *\n\
 * Examples:\n\
 *\n\
 *       // querystring\n\
 *       request.get('/search')\n\
 *         .end(callback)\n\
 *\n\
 *       // multiple data \"writes\"\n\
 *       request.get('/search')\n\
 *         .send({ search: 'query' })\n\
 *         .send({ range: '1..5' })\n\
 *         .send({ order: 'desc' })\n\
 *         .end(callback)\n\
 *\n\
 *       // manual json\n\
 *       request.post('/user')\n\
 *         .type('json')\n\
 *         .send('{\"name\":\"tj\"})\n\
 *         .end(callback)\n\
 *\n\
 *       // auto json\n\
 *       request.post('/user')\n\
 *         .send({ name: 'tj' })\n\
 *         .end(callback)\n\
 *\n\
 *       // manual x-www-form-urlencoded\n\
 *       request.post('/user')\n\
 *         .type('form')\n\
 *         .send('name=tj')\n\
 *         .end(callback)\n\
 *\n\
 *       // auto x-www-form-urlencoded\n\
 *       request.post('/user')\n\
 *         .type('form')\n\
 *         .send({ name: 'tj' })\n\
 *         .end(callback)\n\
 *\n\
 *       // defaults to x-www-form-urlencoded\n\
  *      request.post('/user')\n\
  *        .send('name=tobi')\n\
  *        .send('species=ferret')\n\
  *        .end(callback)\n\
 *\n\
 * @param {String|Object} data\n\
 * @return {Request} for chaining\n\
 * @api public\n\
 */\n\
\n\
Request.prototype.send = function(data){\n\
  var obj = isObject(data);\n\
  var type = this.getHeader('Content-Type');\n\
\n\
  // merge\n\
  if (obj && isObject(this._data)) {\n\
    for (var key in data) {\n\
      this._data[key] = data[key];\n\
    }\n\
  } else if ('string' == typeof data) {\n\
    if (!type) this.type('form');\n\
    type = this.getHeader('Content-Type');\n\
    if ('application/x-www-form-urlencoded' == type) {\n\
      this._data = this._data\n\
        ? this._data + '&' + data\n\
        : data;\n\
    } else {\n\
      this._data = (this._data || '') + data;\n\
    }\n\
  } else {\n\
    this._data = data;\n\
  }\n\
\n\
  if (!obj) return this;\n\
  if (!type) this.type('json');\n\
  return this;\n\
};\n\
\n\
/**\n\
 * Invoke the callback with `err` and `res`\n\
 * and handle arity check.\n\
 *\n\
 * @param {Error} err\n\
 * @param {Response} res\n\
 * @api private\n\
 */\n\
\n\
Request.prototype.callback = function(err, res){\n\
  var fn = this._callback;\n\
  if (2 == fn.length) return fn(err, res);\n\
  if (err) return this.emit('error', err);\n\
  fn(res);\n\
};\n\
\n\
/**\n\
 * Invoke callback with x-domain error.\n\
 *\n\
 * @api private\n\
 */\n\
\n\
Request.prototype.crossDomainError = function(){\n\
  var err = new Error('Origin is not allowed by Access-Control-Allow-Origin');\n\
  err.crossDomain = true;\n\
  this.callback(err);\n\
};\n\
\n\
/**\n\
 * Invoke callback with timeout error.\n\
 *\n\
 * @api private\n\
 */\n\
\n\
Request.prototype.timeoutError = function(){\n\
  var timeout = this._timeout;\n\
  var err = new Error('timeout of ' + timeout + 'ms exceeded');\n\
  err.timeout = timeout;\n\
  this.callback(err);\n\
};\n\
\n\
/**\n\
 * Enable transmission of cookies with x-domain requests.\n\
 *\n\
 * Note that for this to work the origin must not be\n\
 * using \"Access-Control-Allow-Origin\" with a wildcard,\n\
 * and also must set \"Access-Control-Allow-Credentials\"\n\
 * to \"true\".\n\
 *\n\
 * @api public\n\
 */\n\
\n\
Request.prototype.withCredentials = function(){\n\
  this._withCredentials = true;\n\
  return this;\n\
};\n\
\n\
/**\n\
 * Initiate request, invoking callback `fn(res)`\n\
 * with an instanceof `Response`.\n\
 *\n\
 * @param {Function} fn\n\
 * @return {Request} for chaining\n\
 * @api public\n\
 */\n\
\n\
Request.prototype.end = function(fn){\n\
  var self = this;\n\
  var xhr = this.xhr = getXHR();\n\
  var query = this._query.join('&');\n\
  var timeout = this._timeout;\n\
  var data = this._data;\n\
\n\
  // store callback\n\
  this._callback = fn || noop;\n\
\n\
  // state change\n\
  xhr.onreadystatechange = function(){\n\
    if (4 != xhr.readyState) return;\n\
    if (0 == xhr.status) {\n\
      if (self.aborted) return self.timeoutError();\n\
      return self.crossDomainError();\n\
    }\n\
    self.emit('end');\n\
  };\n\
\n\
  // progress\n\
  if (xhr.upload) {\n\
    xhr.upload.onprogress = function(e){\n\
      e.percent = e.loaded / e.total * 100;\n\
      self.emit('progress', e);\n\
    };\n\
  }\n\
\n\
  // timeout\n\
  if (timeout && !this._timer) {\n\
    this._timer = setTimeout(function(){\n\
      self.abort();\n\
    }, timeout);\n\
  }\n\
\n\
  // querystring\n\
  if (query) {\n\
    query = request.serializeObject(query);\n\
    this.url += ~this.url.indexOf('?')\n\
      ? '&' + query\n\
      : '?' + query;\n\
  }\n\
\n\
  // initiate request\n\
  xhr.open(this.method, this.url, true);\n\
\n\
  // CORS\n\
  if (this._withCredentials) xhr.withCredentials = true;\n\
\n\
  // body\n\
  if ('GET' != this.method && 'HEAD' != this.method && 'string' != typeof data && !isHost(data)) {\n\
    // serialize stuff\n\
    var serialize = request.serialize[this.getHeader('Content-Type')];\n\
    if (serialize) data = serialize(data);\n\
  }\n\
\n\
  // set header fields\n\
  for (var field in this.header) {\n\
    if (null == this.header[field]) continue;\n\
    xhr.setRequestHeader(field, this.header[field]);\n\
  }\n\
\n\
  // send stuff\n\
  xhr.send(data);\n\
  return this;\n\
};\n\
\n\
/**\n\
 * Expose `Request`.\n\
 */\n\
\n\
request.Request = Request;\n\
\n\
/**\n\
 * Issue a request:\n\
 *\n\
 * Examples:\n\
 *\n\
 *    request('GET', '/users').end(callback)\n\
 *    request('/users').end(callback)\n\
 *    request('/users', callback)\n\
 *\n\
 * @param {String} method\n\
 * @param {String|Function} url or callback\n\
 * @return {Request}\n\
 * @api public\n\
 */\n\
\n\
function request(method, url) {\n\
  // callback\n\
  if ('function' == typeof url) {\n\
    return new Request('GET', method).end(url);\n\
  }\n\
\n\
  // url first\n\
  if (1 == arguments.length) {\n\
    return new Request('GET', method);\n\
  }\n\
\n\
  return new Request(method, url);\n\
}\n\
\n\
/**\n\
 * GET `url` with optional callback `fn(res)`.\n\
 *\n\
 * @param {String} url\n\
 * @param {Mixed|Function} data or fn\n\
 * @param {Function} fn\n\
 * @return {Request}\n\
 * @api public\n\
 */\n\
\n\
request.get = function(url, data, fn){\n\
  var req = request('GET', url);\n\
  if ('function' == typeof data) fn = data, data = null;\n\
  if (data) req.query(data);\n\
  if (fn) req.end(fn);\n\
  return req;\n\
};\n\
\n\
/**\n\
 * HEAD `url` with optional callback `fn(res)`.\n\
 *\n\
 * @param {String} url\n\
 * @param {Mixed|Function} data or fn\n\
 * @param {Function} fn\n\
 * @return {Request}\n\
 * @api public\n\
 */\n\
\n\
request.head = function(url, data, fn){\n\
  var req = request('HEAD', url);\n\
  if ('function' == typeof data) fn = data, data = null;\n\
  if (data) req.send(data);\n\
  if (fn) req.end(fn);\n\
  return req;\n\
};\n\
\n\
/**\n\
 * DELETE `url` with optional callback `fn(res)`.\n\
 *\n\
 * @param {String} url\n\
 * @param {Function} fn\n\
 * @return {Request}\n\
 * @api public\n\
 */\n\
\n\
request.del = function(url, fn){\n\
  var req = request('DELETE', url);\n\
  if (fn) req.end(fn);\n\
  return req;\n\
};\n\
\n\
/**\n\
 * PATCH `url` with optional `data` and callback `fn(res)`.\n\
 *\n\
 * @param {String} url\n\
 * @param {Mixed} data\n\
 * @param {Function} fn\n\
 * @return {Request}\n\
 * @api public\n\
 */\n\
\n\
request.patch = function(url, data, fn){\n\
  var req = request('PATCH', url);\n\
  if ('function' == typeof data) fn = data, data = null;\n\
  if (data) req.send(data);\n\
  if (fn) req.end(fn);\n\
  return req;\n\
};\n\
\n\
/**\n\
 * POST `url` with optional `data` and callback `fn(res)`.\n\
 *\n\
 * @param {String} url\n\
 * @param {Mixed} data\n\
 * @param {Function} fn\n\
 * @return {Request}\n\
 * @api public\n\
 */\n\
\n\
request.post = function(url, data, fn){\n\
  var req = request('POST', url);\n\
  if ('function' == typeof data) fn = data, data = null;\n\
  if (data) req.send(data);\n\
  if (fn) req.end(fn);\n\
  return req;\n\
};\n\
\n\
/**\n\
 * PUT `url` with optional `data` and callback `fn(res)`.\n\
 *\n\
 * @param {String} url\n\
 * @param {Mixed|Function} data or fn\n\
 * @param {Function} fn\n\
 * @return {Request}\n\
 * @api public\n\
 */\n\
\n\
request.put = function(url, data, fn){\n\
  var req = request('PUT', url);\n\
  if ('function' == typeof data) fn = data, data = null;\n\
  if (data) req.send(data);\n\
  if (fn) req.end(fn);\n\
  return req;\n\
};\n\
\n\
/**\n\
 * Expose `request`.\n\
 */\n\
\n\
module.exports = request;\n\
//@ sourceURL=visionmedia-superagent/lib/client.js"
));
require.register("familyfound-fsauth/client.js", Function("exports, require, module",
"\n\
// client-side\n\
\n\
var request = require('superagent')\n\
\n\
module.exports = function (check_url, code_url, done) {\n\
\n\
  request.get(check_url, function (err, res) {\n\
    if (err) return onUrl(err);\n\
    if (res.status >= 300 || res.status < 200) {\n\
      return onUrl(res.text)\n\
    }\n\
    if (res.status == 200) {\n\
      return done(null, res.header['oauth-access-token'], res.body);\n\
    }\n\
\n\
    var created = window.open(res.header['oauth-authorize-url'], 'FamilySearch Auth', 'width=400,height=600')\n\
\n\
    waitForWindow(created, function (err) {\n\
      if (err) return done(err)\n\
      var search = params(created.location.search.slice(1))\n\
      request.post(code_url)\n\
        .query({'code': search.code})\n\
        .end(function (err, res) {\n\
          if (err) return done(err)\n\
          created.close()\n\
          done(null, res.header['oauth-access-token'], res.body)\n\
        })\n\
    })\n\
  });\n\
\n\
}\n\
\n\
module.exports.modal = function (check_url, next) {\n\
  module.exports(check_url, function (err, url) {\n\
    if (err) return next(err)\n\
    showDialog(url)\n\
  }, function (err, token, data) {\n\
    dialog.parentNode.removeChild(dialog)\n\
    next(err, token, data)\n\
  })\n\
}\n\
\n\
function showDialog(url, modal) {\n\
  var node = document.createElement('iframe');\n\
  node.src = url + '&template=mobile';\n\
  node.className = 'fsauth' + (modal ? ' modal' : '')\n\
  document.body.appendChild(node)\n\
  return node\n\
}\n\
\n\
\n\
/**\n\
 * Expect an external window to be done sometime soon\n\
 */\n\
function waitForWindow(window, initial, step, done) {\n\
  if (arguments.length === 2) {\n\
    done = initial\n\
    initial = 500\n\
    step = 100\n\
  }\n\
  waitFor(initial, step, function () {\n\
    if (window.closed) {\n\
      done(new Error('User aborder auth'))\n\
      return true\n\
    }\n\
    try {\n\
      var m = window.location.search;\n\
    } catch (e) {\n\
      return false\n\
    }\n\
    done()\n\
    return true\n\
  })\n\
}\n\
\n\
// wait for something to happen\n\
function waitFor(start, ival, done) {\n\
  setTimeout(function () {\n\
    if (done()) return\n\
    var clear = setInterval(function () {\n\
      if (done()) {\n\
        clearInterval(clear)\n\
      }\n\
    }, ival)\n\
  }, start)\n\
}\n\
\n\
var chrs = '0123456789abcdefghijklmnopqrtsuvwxyz'\n\
function uuid(num) {\n\
  num = num || 32\n\
  var res = ''\n\
  for (var i=0; i<num; i++) {\n\
    res += chrs[parseInt(Math.random() * chrs.length)]\n\
  }\n\
  return res\n\
}\n\
\n\
function params(what) {\n\
  if ('string' === typeof what) return parseParams(what)\n\
  return Object.keys(what).map(function (name) {return name + '=' + encodeURIComponent(what[name])}).join('&');\n\
}\n\
\n\
function parseParams(what) {\n\
  var obj = {}\n\
  what.split('&').forEach(function (part) {\n\
    var subs = part.split('=')\n\
    obj[subs[0]] = decodeURIComponent(subs.slice(1).join('='))\n\
  })\n\
  return obj\n\
}\n\
\n\
\n\
//@ sourceURL=familyfound-fsauth/client.js"
));
require.register("familyfound-api/client/index.js", Function("exports, require, module",
"\n\
var todos = require('../lib/todos')\n\
  , utils = require('./utils')\n\
\n\
module.exports = {\n\
  todos: {\n\
    map: todos,\n\
    titles: utils.getTodoTitles(todos),\n\
    types: utils.typeMap(todos)\n\
  }\n\
}\n\
\n\
//@ sourceURL=familyfound-api/client/index.js"
));
require.register("familyfound-api/lib/fslinks.js", Function("exports, require, module",
"\n\
module.exports = {\n\
  simpleSearch: simpleSearch,\n\
  merge: merge,\n\
  personPage: personPage\n\
}\n\
\n\
function getYear(text) {\n\
  return parseInt((text || '').match(/\\d{4}/))\n\
}\n\
\n\
function fsQuery(person) {\n\
  var display = person.rels.display\n\
    , parts = display.name.split(' ')\n\
    , lastName = parts.pop()\n\
    , firstNames = parts.join(' ')\n\
  var query = '+givenname:\"' + firstNames + '\"~+surname:\"' + lastName + '\"~+birth_place:\"' + display.birthPlace + '\"~'\n\
    , birthYear\n\
  if (display.birthDate && (birthYear = getYear(display.birthDate))) {\n\
    query += '+birth_year:' + (birthYear - 2) + '-' + (birthYear + 2) + '~'\n\
  }\n\
  return query\n\
}\n\
\n\
function simpleSearch(person, records) {\n\
  var display = person.rels.display\n\
    , parts = display.name.split(' ')\n\
    , lastName = parts.pop()\n\
    , firstNames = parts.join(' ')\n\
  var query = '+givenname:\"' + firstNames + '\"~+surname:\"' + lastName + '\"~+birth_place:\"' + display.birthPlace + '\"~'\n\
    , birthYear\n\
  if (display.birthDate && (birthYear = getYear(display.birthDate))) {\n\
    query += '+birth_year:' + (birthYear - 2) + '-' + (birthYear + 2) + '~'\n\
  }\n\
  if (records) {\n\
    query += ' +record_type:(' + records.join(' ') + ')'\n\
  }\n\
  return 'https://familysearch.org/search/record/results#count=20&query=' + encodeURIComponent(query)\n\
}\n\
\n\
function merge(pid, oid) {\n\
  return 'https://familysearch.org/tree/#view=merge&person=' + pid + '&otherPerson=' + oid\n\
}\n\
\n\
function personPage(pid) {\n\
  return 'https://familysearch.org/tree/#view=ancestor&person=' + pid\n\
}\n\
\n\
\n\
//@ sourceURL=familyfound-api/lib/fslinks.js"
));
require.register("familyfound-api/client/utils.js", Function("exports, require, module",
"\n\
module.exports = {\n\
  getTodoTitles: getTodoTitles,\n\
  typeMap: typeMap\n\
}\n\
\n\
function typeMap(todos) {\n\
  var titles = {}\n\
  for (var section in todos) {\n\
    for (var key in todos[section]) {\n\
      titles[key] = todos[section][key]\n\
    }\n\
  }\n\
  return titles\n\
}\n\
\n\
function getTodoTitles(todos) {\n\
  var titles = {}\n\
  for (var section in todos) {\n\
    for (var key in todos[section]) {\n\
      titles[key] = todos[section][key].title\n\
    }\n\
  }\n\
  return titles\n\
}\n\
\n\
//@ sourceURL=familyfound-api/client/utils.js"
));
require.register("familyfound-api/lib/todos.js", Function("exports, require, module",
"\n\
var links = require('./fslinks')\n\
  , MIN_SOURCES = 3\n\
  , MIN_PARENTING_AGE = 15\n\
  , MIN_CHILDREN = 3\n\
  , THIS_YEAR = new Date().getFullYear()\n\
  , MIN_FIND_CHILDREN = 130 // must be born more than x years ago to get a \"Find children\"\n\
  , MAX_CHILDREN = {\n\
      'Male': 30,\n\
      'Female': 15\n\
    }\n\
  , MAX_MARRIAGES = {\n\
      'Male': 10,\n\
      'Female': 5\n\
    }\n\
\n\
/**\n\
 * All of the todos\n\
 */\n\
\n\
function ageRange(range) {\n\
  var parts = range.split('-')\n\
  return parts.map(function (p) {\n\
    return parseInt(p, 10) || false\n\
  })\n\
}\n\
\n\
module.exports = {\n\
  information: {\n\
    'resolve duplicates': {\n\
      title: 'Possible duplicate: {}',\n\
      history: 'Resolved duplicate',\n\
      help: 'Click \"resolve\" to look at this person compared to the possible duplicate. If you determine they are the same person, merge them together, otherwise mark \"not a match\".',\n\
      help_link: 'https://help.familysearch.org/kb/UserGuide/en/tree/t_tree_combining_separating_records.html',\n\
      // about: \"Queries FamilySearch for possible duplicates, filtered against those that have been marked 'not a match'\",\n\
      cleanup: true,\n\
      multi: true,\n\
      check: function (person) {\n\
        if (!person.more.duplicates || !person.more.duplicates.length) return false\n\
        var res = {}\n\
        person.more.duplicates.map(function (dup) {\n\
          var title = dup.title.replace(/^Person /, '').replace('(', '\"').replace(')', '\"')\n\
          res[dup.id] = {\n\
            links: {\n\
              'Click to resolve': links.merge(person.rels.id, dup.id)\n\
            },\n\
            args: title\n\
          }\n\
        })\n\
        return res\n\
      }\n\
    },\n\
    'find name': {\n\
      title: 'Find name',\n\
      history: 'Found name',\n\
      help: \"Search in records of relatives for this person's name.\",\n\
      check: function (person) {\n\
        return !person.rels.display.name && {\n\
          args: !person.rels.display.name,\n\
          links: {\n\
            'search records': links.simpleSearch(person)\n\
          }\n\
        }\n\
      }\n\
    },\n\
    'find birth info': {\n\
      title: 'Find birth {}',\n\
      history: 'Found birth information',\n\
      help: \"This information is most likely to be found on a birth record or census record, but many other records can also be helpful.\",\n\
      help_link: 'https://familysearch.org/ask/productSupport#/How-to-find-an-ancestor-using-FamilySearch-org-Search-1381813529455',\n\
      check: function (person) {\n\
        var tofind = []\n\
        if (!person.rels.display.birthDate) {\n\
          tofind.push('date')\n\
        }\n\
        if (!person.rels.display.birthPlace) {\n\
          tofind.push('place')\n\
        }\n\
        if (!tofind.length) return false\n\
        return {\n\
          args: tofind.join(' and '),\n\
          links: {\n\
            'search records': links.simpleSearch(person)\n\
          }\n\
        }\n\
      }\n\
    },\n\
    'find death info': {\n\
      title: 'Find death {}',\n\
      history: 'Found death {}',\n\
      help: \"If you can find a death record, that is the best. Otherwise, you might find information in an obituary or biography.\",\n\
      help_link: \"https://familysearch.org/learn/wiki/en/How_to_Find_United_States_Death_Records\",\n\
      check: function (person) {\n\
        if (person.rels.display.lifespan.match(/Living/)) return false\n\
        var tofind = []\n\
        if (!person.rels.display.deathDate) {\n\
          tofind.push('date')\n\
        }\n\
        if (!person.rels.display.deathPlace) {\n\
          tofind.push('place')\n\
        }\n\
        if (!tofind.length) return false\n\
        return {\n\
          args: tofind.join(' and '),\n\
          links: {\n\
            'search for records': links.simpleSearch(person, [2,4,5,6,7])\n\
          }\n\
        }\n\
      }\n\
    },\n\
    'death before birth': {\n\
      title: 'Death date {} years before birth date',\n\
      history: 'Fixed date inconsistency',\n\
      help: \"Something's wrong here; figure out which date is (more) correct, and adjust the other accordingly\",\n\
      cleanup: true,\n\
      check: function (person) {\n\
        var range = ageRange(person.rels.display.lifespan)\n\
        if (range[0] === false || range[1] === false) return false\n\
        if (range[0] <= range[1]) return false\n\
        return {\n\
          args: range[0] - range[1],\n\
          links: {\n\
            'go to his page': links.personPage(person.rels.id)\n\
          }\n\
        }\n\
      }\n\
    }\n\
  },\n\
  sources: {\n\
    'find sources': {\n\
      title: 'Look for sources (only {} attached)',\n\
      history: 'Looked for sources',\n\
      help: \"Finding sources for people is a key research activity. As you find sources, you will be able to correct possible data inconsistencies, and more importantly you might find relatives who have been missed. Attaching sources also adds validity to a record.\",\n\
      help_link: 'https://familysearch.org/ask/productSupport#/How-to-find-an-ancestor-using-FamilySearch-org-Search-1381813529455',\n\
      check: function (person) {\n\
        // TODO: should \"minimum number of sources\" be configurable?\n\
        if (person.rels.display.lifespan.match(/Living/)) return false\n\
        var sources = person.more.sources ? person.more.sources.length : 0\n\
        if (sources >= MIN_SOURCES) return false\n\
        return {\n\
          args: sources,\n\
          links: {\n\
            'simple search': links.simpleSearch(person)\n\
          }\n\
        }\n\
      },\n\
    },\n\
  },\n\
  relationships: {\n\
    'child to more than one spouse': {\n\
      title: 'The child {} is associated with more than one spouse',\n\
      history: 'Fixed problem with a child & multiple spouses',\n\
      help: \"A child should (generally) only have one set of parents. It is often the case that the multiple parents are in fact duplicates of each other, which can then be merged.\",\n\
      help_link: 'http://broadcast.lds.org/elearning/fhd/Community/en/FamilyTreeCurriculum/level02/relationships/Duplicate%20Spouses%20Merge.mp4',\n\
      cleanup: true,\n\
      check: function (person) {\n\
        var seen = []\n\
          , it = false\n\
          , mult = Object.keys(person.rels.families).some(function (spouse) {\n\
              return person.rels.families[spouse].slice(spouse === 'unknown' ? 0 : 1).some(function (child) {\n\
                if (seen.indexOf(child) !== -1) {\n\
                  it = child\n\
                  return true\n\
                }\n\
                seen.push(child)\n\
                return false\n\
              })\n\
            })\n\
        return it && {\n\
          args: it,\n\
          links: {\n\
            \"go to the child's person page\": links.personPage(it)\n\
          }\n\
        }\n\
      },\n\
    },\n\
    'parent of self': {\n\
      title: \"I'm my own grandpa\",\n\
      history: 'Cleared up \"I\\'m my own grandpa\" syndrome',\n\
      help: \"This person is listed as their own parent. Remove the relationship and check for other inconsistencies\",\n\
      help_link: 'https://help.familysearch.org/kb/UserGuide/en/tree/t_tree_adding_correcting_information.html',\n\
      cleanup: true,\n\
      check: function (person) {\n\
        return person.rels.parents.indexOf(person.rels.id) !== -1 && {\n\
          args: true,\n\
          links: {\n\
            'Go to the person page': links.personPage(person.rels.id)\n\
          }\n\
        }\n\
      },\n\
    },\n\
    'fix multiple parents': {\n\
      title: 'Fix multiple parents',\n\
      history: 'Cleared up multiple parents issue',\n\
      help: \"A child should (generally) only have one set of parents. It is often the case that the multiple parents are in fact duplicates of each other, which can then be merged.\",\n\
      help_link: 'http://broadcast.lds.org/elearning/fhd/Community/en/FamilyTreeCurriculum/level02/relationships/Duplicate%20Spouses%20Merge.mp4',\n\
      cleanup: true,\n\
      check: function (person) {\n\
        return !!person.rels.multipleParents && {\n\
          args: true,\n\
          links: {\n\
            'Resolve this on the person page': links.personPage(person.rels.id)\n\
          }\n\
        }\n\
      }\n\
    },\n\
    'find children': {\n\
      title: 'Look for more children (only {} recorded)',\n\
      history: 'Looked for more children',\n\
      help: \"When a couple in the tree has few children listed, it is likely that the person doing the research merely concerned themselves with the direct line and didn't (or couldn't) find all of the other children. Census and birth records can be particularly helpful in finding more children.\",\n\
      help_link: 'https://familysearch.org/learningcenter/lesson/easy-steps-to-descendancy-research/877',\n\
      check: function (person) {\n\
        if (person.rels.display.lifespan.match(/Living/)) return false\n\
        var range = ageRange(person.rels.display.lifespan)\n\
        if (range[0] > THIS_YEAR - MIN_FIND_CHILDREN) {\n\
          return false\n\
        }\n\
        var totalChildren = 0\n\
        Object.keys(person.rels.families).forEach(function (spouse) {\n\
          totalChildren += person.rels.families[spouse].slice(spouse === 'unknown' ? 0 : 1).length\n\
        })\n\
        if (totalChildren >= MIN_CHILDREN) return false\n\
        return {\n\
          args: totalChildren,\n\
          links: {\n\
            'Search records': links.simpleSearch(person)\n\
          }\n\
        }\n\
      }\n\
    },\n\
\n\
    // WORK HERE\n\
    //\n\
    'find mother': {\n\
      title: 'Find mother',\n\
      history: 'Found mother',\n\
      help: \"You might find information about the mother's name on a marriage record or death record, in addition to the usual census and birth records\",\n\
      check: function (person) {\n\
        return !person.rels.mother && {\n\
          args: true,\n\
          links: {\n\
            'Find records': links.simpleSearch(person)\n\
          }\n\
        }\n\
      }\n\
    },\n\
    'find father': {\n\
      title: 'Find father',\n\
      history: 'Found father',\n\
      help: \"You might find information about the father's name on a marriage record or death record, in addition to the usual census and birth records.\",\n\
      check: function (person) {\n\
        return !person.rels.father && {\n\
          args: true,\n\
          links: {\n\
            'Find records': links.simpleSearch(person)\n\
          }\n\
        }\n\
      }\n\
    },\n\
    'verify number of children': {\n\
      title: 'Unusuallly many children ({} recorded)',\n\
      history: 'Verified number of children (unusually high)',\n\
      help: \"While very large families did happen, it might also be the case that there are several duplicate children, or that unrelated children were added by accident, perhaps through an erroneous merge.\",\n\
      cleanup: true,\n\
      check: function (person) {\n\
        if (person.rels.children.length <= MAX_CHILDREN[person.rels.display.gender]) return false\n\
        return {\n\
          args: person.rels.children.length,\n\
          links: {\n\
            'Check the children for duplicates or other errors': links.personPage(person.rels.id)\n\
          }\n\
        }\n\
      }\n\
    },\n\
    'children with unknown spouse': {\n\
      title: 'Children with unknown spouse',\n\
      history: 'Cleared up children w/ unknown spouse',\n\
      help: \"Verify the relationships with the children (check other spouses especially), and then look for records to find the spouse's name and information.\",\n\
      check: function (person) {\n\
        return !!person.rels.families.unknown && {\n\
          args: true,\n\
          links: {\n\
            'Look at relationships on the person page': links.personPage(person.rels.id),\n\
            'Search for records': links.simpleSearch(person)\n\
          }\n\
        }\n\
      }\n\
    },\n\
    'abnormallly many marriages': {\n\
      title: 'Unusually many spouses ({} listed)',\n\
      history: 'Verified unusually high number of spouses',\n\
      help: \"Check for duplicate spouses or information inconsistencies, and then try to find marriage records to substantiate the relationships that are left.\",\n\
      cleanup: true,\n\
      check: function (person) {\n\
        if (person.rels.spouses.length <= MAX_MARRIAGES[person.rels.display.gender]) return false\n\
        return person.rels.spouses.length && {\n\
          args: true,\n\
          links: {\n\
            'Look at relationships on the person page': links.personPage(person.rels.id)\n\
          }\n\
        }\n\
      }\n\
    },\n\
    'died to young to have children': {\n\
      title: 'Died at {}; too young to have {} children',\n\
      cleanup: true,\n\
      help: \"It's likely that either the birth or death date are wrong.\",\n\
      check: function (person) {\n\
        var range = ageRange(person.rels.display.lifespan)\n\
        if (range[0] === false || range[1] === false) return false\n\
        var age = range[1] - range[0]\n\
        if (person.rels.children.length + MIN_PARENTING_AGE <= age) {\n\
          return false\n\
        }\n\
        return {\n\
          args: [age, person.rels.children.length],\n\
          links: {\n\
            \"Verify this person's information\": links.personPage(person.rels.id)\n\
          }\n\
        }\n\
      }\n\
    },\n\
    /** TODO: checks that involve the ages of relatives.\n\
     * Child born after parent's death\n\
     * Child born before parent was 15\n\
     * Person died before their marriage\n\
     * Person married before they were 15\n\
     *\n\
    'child born before parent was of age': {\n\
      title: 'Child born before parent was ' + MIN_PARENTING_AGE,\n\
      check: function (person) {\n\
      }\n\
    }\n\
     */\n\
  },\n\
  temple: {\n\
    // TODO: get the data running & figure out what todos we want\n\
  },\n\
  artifacts: {\n\
    // TODO: get the data running... is this important enough to warrant\n\
    // todozing?\n\
  }\n\
}\n\
\n\
\n\
//@ sourceURL=familyfound-api/lib/todos.js"
));
require.register("familyfound-fan/index.js", Function("exports, require, module",
"\n\
module.exports = require('./node')\n\
\n\
\n\
//@ sourceURL=familyfound-fan/index.js"
));
require.register("familyfound-fan/node.js", Function("exports, require, module",
"\n\
var d = React.DOM\n\
  , utils = require('./utils')\n\
  , Tip = require('tip')\n\
\n\
var setSvgContents = function (node, text) {\n\
  var d = document.createElement('div')\n\
  d.innerHTML = \"<svg id='wrapper' xmlns='http://www.w3.org/2000/svg'>\" + text + \"</svg>\"\n\
  ;[].slice.call(node.childNodes).forEach(function (n) {\n\
    node.removeChild(n)\n\
  })\n\
  ;[].slice.call(d.firstChild.childNodes).forEach(function (n) {\n\
    node.appendChild(n)\n\
  })\n\
}\n\
\n\
var SVGAnimatedCircle = React.createClass({\n\
  anim: function () {\n\
    var pos = this.props.cx + ' ' + this.props.cy\n\
    return  '<animateTransform attributeName=\"transform\" type=\"rotate\" from=\"0 ' + pos + '\" to=\"360 ' + pos + '\" dur=\"1s\" repeatCount=\"indefinite\"/>'\n\
  },\n\
  componentDidMount: function () {\n\
    setSvgContents(this.getDOMNode(), this.anim())\n\
  },\n\
  componentDidUpdate: function () {\n\
    setSvgContents(this.getDOMNode(), this.anim())\n\
  },\n\
  render: function () {\n\
    return this.transferPropsTo(d.circle({\n\
      cx: this.props.cx + this.props.rx,\n\
      cy: this.props.cy\n\
    }))\n\
  }\n\
})\n\
\n\
var SVGText = React.createClass({\n\
  componentDidMount: function () {\n\
    this.getDOMNode().textContent = this.props.textContent\n\
  },\n\
  componentDidUpdate: function () {\n\
    this.getDOMNode().textContent = this.props.textContent\n\
  },\n\
  render: function () {\n\
    return this.transferPropsTo(d.text(null))\n\
  }\n\
})\n\
\n\
var TextPath = React.createClass({\n\
  componentDidMount: function () {\n\
    var text = '<textPath class=\"fan__over-title__text\" xlink:href=\"' + this.props.pathHref + '\" startOffset=\"' + this.props.startOffset + '\">' + this.props.textContent + '</textPath>'\n\
    var node = this.getDOMNode()\n\
    setSvgContents(node, text)\n\
  },\n\
  componentDidUpdate: function () {\n\
    var text = '<textPath class=\"fan__over-title__text\" xlink:href=\"' + this.props.pathHref + '\" startOffset=\"' + this.props.startOffset + '\">' + this.props.textContent + '</textPath>'\n\
    var node = this.getDOMNode()\n\
    setSvgContents(node, text)\n\
  },\n\
  render: function () {\n\
    return this.transferPropsTo(d.text(null))\n\
  }\n\
})\n\
\n\
function tipPosition(x, y, ew, eh, pos) {\n\
  var pad = 15;\n\
  switch (pos) {\n\
    case 'top':\n\
      return {\n\
        top: y - eh - pad,\n\
        left: x - ew / 2\n\
      }\n\
    case 'bottom':\n\
      return {\n\
        top: y + pad,\n\
        left: x - ew / 2\n\
      }\n\
    case 'right':\n\
      return {\n\
        top: y - eh / 2,\n\
        left: x + pad\n\
      }\n\
    case 'left':\n\
      return {\n\
        top: y - eh / 2,\n\
        left: x - ew - pad\n\
      }\n\
    case 'top left':\n\
      return {\n\
        top: y - eh,\n\
        left: x - ew + pad\n\
      }\n\
    case 'top right':\n\
      return {\n\
        top: y - eh,\n\
        left: x - pad\n\
      }\n\
    case 'bottom left':\n\
      return {\n\
        top: y,\n\
        left: x - ew + pad\n\
      }\n\
    case 'bottom right':\n\
      return {\n\
        top: y,\n\
        left: x - pad\n\
      }\n\
    default:\n\
      throw new Error('invalid position \"' + pos + '\"');\n\
  }\n\
}\n\
\n\
function positionTip(x, y, tip) {\n\
  tip.show(x, y)\n\
  var ew = tip.el.clientWidth\n\
    , eh = tip.el.clientHeight\n\
    , dir = tip.suggested('right', {left: x, top: y}) || 'right'\n\
    , xy = tipPosition(x, y, ew, eh, dir)\n\
  tip.position(dir)\n\
  tip.show(xy.left, xy.top)\n\
}\n\
\n\
var Node = module.exports = React.createClass({\n\
  displayName: 'FanNode',\n\
  getDefaultProps: function () {\n\
    return {\n\
      id: null,\n\
      manager: null,\n\
      transform: undefined,\n\
      getClasses: function () {},\n\
      onClick: function () {},\n\
      mainTitle: function () {},\n\
      overTitle: function () {},\n\
      tip: false,\n\
      attr: null,\n\
      gen: 0,\n\
      pos: 0,\n\
      options: {\n\
        sweep: Math.PI*4/3,\n\
        offset: 0,\n\
        width: 40,\n\
        doubleWidth: false\n\
      }\n\
    }\n\
  },\n\
  getInitialState: function () {\n\
    return {\n\
      data: {},\n\
    }\n\
  },\n\
  shouldComponentUpdate: function (props, state) {\n\
    return this.props.id !== props.id || this.state.data !== state.data || props.options.width !== this.props.options.width\n\
  },\n\
  componentDidMount: function () {\n\
    this.tip = new Tip('loading')\n\
    if (!this.props.manager) return\n\
    this.props.manager.on(this.props.id, this.gotData)\n\
  },\n\
  componentWillUnmount: function () {\n\
    if (this.tip) this.tip.hide()\n\
    if (!this.props.manager) return\n\
    this.props.manager.off(this.props.id, this.gotData)\n\
  },\n\
  gotData: function (data) {\n\
    this.setState({data: data})\n\
  },\n\
  showTip: function (e) {\n\
    positionTip(e.pageX, e.pageY, this.tip)\n\
  },\n\
  hideTip: function () {\n\
    this.tip.hide()\n\
  },\n\
  componentWillReceiveProps: function (props) {\n\
    if (props.id !== this.props.id) {\n\
      if (!this.props.manager) return\n\
      this.props.manager.off(this.props.id, this.gotData)\n\
      this.props.manager.on(props.id, this.gotData)\n\
    }\n\
  },\n\
  componentDidUpdate: function () {\n\
    if (this.tip && this.props.tip) {\n\
      this.tip.message(this.props.tip(this.state.data))\n\
    }\n\
  },\n\
  onClick: function () {\n\
    if (this.tip) this.tip.hide()\n\
    this.props.onClick(this.props.id, this.state.data)\n\
  },\n\
  mainTitle: function () {\n\
    var x = 0\n\
      , y = this.props.options.width * 2\n\
      , title = this.props.mainTitle(this.state.data, x, y)\n\
    if (!title) return\n\
    if ('string' !== typeof title) {\n\
      return title\n\
    }\n\
    return SVGText({\n\
      className: 'fan__main-title',\n\
      style: {\n\
        fontSize: this.props.options.width/2\n\
      },\n\
      x: x,\n\
      y: y,\n\
      textContent: title\n\
    })\n\
  },\n\
  textPath: function () {\n\
    var path = utils.textPath({x: 0, y: 0}, this.props.gen, this.props.pos, this.props.options)\n\
      , txt = utils.pathToString(path)\n\
    return d.path({\n\
      className: 'fan__text-path',\n\
      id: 'fan-' + this.props.gen + '-' + this.props.pos,\n\
      style: {display: 'none'},\n\
      d: txt\n\
    })\n\
  },\n\
  textBack: function () {\n\
    var path = utils.textBack({x: 0, y: 0}, this.props.gen, this.props.pos, this.props.options)\n\
      , txt = utils.pathToString(path)\n\
    return d.path({\n\
      className: 'fan__text-back',\n\
      d: txt\n\
    })\n\
  },\n\
  textText: function () {\n\
    var text = this.props.overTitle(this.state.data)\n\
      , scale = [0, 1.1, 1.3, 2]\n\
    if (!text) return\n\
    return TextPath({\n\
      className: 'fan__over-title',\n\
      style: {\n\
        fontSize: this.props.options.width/3/scale[this.props.gen],\n\
      },\n\
      pathHref: '#fan-' + this.props.gen + '-' + this.props.pos,\n\
      startOffset: '50%',\n\
      textContent: text\n\
    })\n\
  },\n\
  loading: function () {\n\
    if (!this.state.data || !this.state.data.loading) return false\n\
    var pos = utils.arcCenter({x: 0, y: 0}, this.props.gen, this.props.pos, this.props.options)\n\
      , r = this.props.options.width / 8\n\
    return [\n\
      SVGAnimatedCircle({\n\
        cx: pos.pos.x,\n\
        cy: pos.pos.y,\n\
        rx: r * 2,\n\
        r: r,\n\
        style: {\n\
          fill: 'rgba(0, 0, 0, .6)'\n\
        }\n\
      }),\n\
      SVGAnimatedCircle({\n\
        cx: pos.pos.x,\n\
        cy: pos.pos.y,\n\
        rx: -r * 2,\n\
        r: r,\n\
        style: {\n\
          fill: 'rgba(0, 0, 0, .6)'\n\
        }\n\
      })\n\
    ]\n\
  },\n\
  render: function () {\n\
    var data = this.state.data\n\
      , classes = this.props.getClasses(data) || {}\n\
      , parents = []\n\
    if (this.props.attr && data[this.props.attr]) {\n\
      data = data[this.props.attr]\n\
    }\n\
    if (data.father && this.props.gens > this.props.gen + 1) {\n\
      parents.push(Node({\n\
        key: data.father,\n\
        id: data.father,\n\
        ref: 'father',\n\
        className: 'father',\n\
        attr: this.props.attr,\n\
        getClasses: this.props.getClasses,\n\
        onClick: this.props.onClick,\n\
        overTitle: this.props.overTitle,\n\
        tip: this.props.tip,\n\
        manager: this.props.manager,\n\
        gens: this.props.gens,\n\
        gen: this.props.gen + 1,\n\
        pos: this.props.pos * 2,\n\
        options: this.props.options\n\
      }))\n\
    }\n\
    if (data.mother && this.props.gens > this.props.gen + 1) {\n\
      parents.push(Node({\n\
        key: data.mother,\n\
        id: data.mother,\n\
        ref: 'mother',\n\
        className: 'mother',\n\
        attr: this.props.attr,\n\
        manager: this.props.manager,\n\
        getClasses: this.props.getClasses,\n\
        overTitle: this.props.overTitle,\n\
        onClick: this.props.onClick,\n\
        tip: this.props.tip,\n\
        gens: this.props.gens,\n\
        gen: this.props.gen + 1,\n\
        pos: this.props.pos * 2 + 1,\n\
        options: this.props.options\n\
      }))\n\
    }\n\
    var cls = 'node ' + classes.path\n\
      , showText = this.props.gen > 0 && this.props.gen < 4\n\
    return d.g({\n\
        fill: 'none',\n\
        stroke: 'none',\n\
        transform: this.props.transform,\n\
        className: this.props.className + ' ' + (classes.g || '')\n\
      }, [\n\
      d.path({\n\
        className: cls,\n\
        onMouseEnter: this.props.tip && this.showTip,\n\
        onMouseMove: this.props.tip && this.showTip,\n\
        onMouseLeave: this.props.tip && this.hideTip,\n\
        onClick: this.onClick,\n\
        ref: 'path',\n\
        d: utils.pathToString(utils.nodePath({x: 0, y: 0}, this.props.gen, this.props.pos, this.props.options))\n\
      }),\n\
      this.loading(),\n\
      showText && this.textPath(),\n\
      showText && this.textBack(),\n\
      showText && this.textText(),\n\
      this.props.gen === 0 && this.mainTitle(),\n\
      parents\n\
    ])\n\
  },\n\
})\n\
\n\
//@ sourceURL=familyfound-fan/node.js"
));
require.register("familyfound-fan/utils.js", Function("exports, require, module",
"\n\
module.exports = {\n\
  nodePath: nodePath,\n\
  arcCenter: arcCenter,\n\
  pathToString: pathToString,\n\
  radialLine: radialLine,\n\
  childTop: childTop,\n\
  textPath: textPath,\n\
  textBack: textBack\n\
}\n\
\n\
// take a list of path commmands and return a string\n\
function pathToString(items) {\n\
  return items.map(function (item) {\n\
    if (item[0].toLowerCase() == 'a') {\n\
      return (item[0] +\n\
              item[1] + ',' + item[2] + ' ' + // radii\n\
              item[3] + ' ' +\n\
              item[4] + ',' + item[5] + ' ' + // large arc, sweep\n\
              item[6] + ',' + item[7]);       // final pos\n\
    }\n\
    return item[0] + item[1] + ',' + item[2];\n\
  }).join('');\n\
}\n\
\n\
// return the position reached by going length in angle direction from pos\n\
function pointAngle(pos, angle, length) {\n\
  return {\n\
    x: pos.x + Math.cos(angle) * length,\n\
    y: pos.y + Math.sin(angle) * length\n\
  };\n\
}\n\
\n\
// two points, for going to lengths w/ the same direction and starting pos\n\
function pointsAngle(pos, angle, len1, len2) {\n\
  return [pointAngle(pos, angle, len1),\n\
          pointAngle(pos, angle, len2)];\n\
}\n\
\n\
function genWidth(width, gen, doubleWidth, extend) {\n\
  var res;\n\
  if (!doubleWidth || gen <= 4) res = width * gen\n\
  else res = width * gen + width * (gen - 4)\n\
  if (extend && !isNaN(extend) && 'number' === typeof extend) {\n\
    res += extend * width * (doubleWidth && gen > 4 ? 2 : 1);\n\
  }\n\
  return res;\n\
}\n\
\n\
// find the appropriate center for the arc\n\
function arcCenter(center, gen, pos, options) {\n\
  var start = - options.sweep/2 - Math.PI/2 + options.offset\n\
    , segs = options.sweep / (Math.pow(2, gen))\n\
    , innerRadius = genWidth(options.width, gen, options.doubleWidth)\n\
    , outerRadius = genWidth(options.width, gen + 1, options.doubleWidth)\n\
    , middleRadius = (outerRadius + innerRadius) / 2\n\
    , angle = start + (pos + 0.5) * segs\n\
    , point = pointAngle(center, start + (pos + 0.5) * segs, middleRadius);\n\
  if (pos < Math.pow(2, gen) / 2) {\n\
    angle += Math.PI;\n\
    if (gen < 4) {\n\
      angle -= Math.PI / 2;\n\
    }\n\
  } else if (gen < 4) {\n\
    angle += Math.PI / 2;\n\
  }\n\
    \n\
  if (gen === 0) point = center;\n\
  return {\n\
    pos: point,\n\
    angle: angle\n\
  };\n\
}\n\
\n\
// \n\
// options:\n\
//  - sweep: total length\n\
//  - offset: 0 - fan points up\n\
//  - width: the width of each ring\n\
//  - doubleWidth: whether rings after the 3rd generation should be doubly\n\
//    thick (nice if you want names to fit on them)\n\
//\n\
function nodePath(center, gen, pos, options) {\n\
  var start = - options.sweep/2 - Math.PI/2 + options.offset\n\
    , segs = options.sweep / (Math.pow(2, gen))\n\
    , innerRadius = genWidth(options.width, gen, options.doubleWidth, options.start)\n\
    , outerRadius = genWidth(options.width, gen + 1, options.doubleWidth, -(1 - options.extend - options.start))\n\
    , left = pointsAngle(center, start + pos * segs, innerRadius, outerRadius)\n\
    , right = pointsAngle(center, start + (pos + 1) * segs, innerRadius, outerRadius);\n\
  if (options.centerCircle && gen === 0) { // circle me\n\
    return [\n\
      ['M', center.x, center.y],\n\
      ['m', -outerRadius, 0],\n\
      ['a', outerRadius, outerRadius, 0, 1, 0, outerRadius * 2, 0],\n\
      ['a', outerRadius, outerRadius, 0, 1, 0, - outerRadius * 2, 0]\n\
    ];\n\
  }\n\
  return [\n\
    ['M', left[0].x, left[0].y],\n\
    ['L', left[1].x, left[1].y],\n\
    ['A', outerRadius, outerRadius, 0, gen === 0 ? 1 : 0, 1, right[1].x, right[1].y],\n\
    ['L', right[0].x, right[0].y],\n\
    ['A', innerRadius, innerRadius, 0, 0, 0, left[0].x, left[0].y]\n\
  ];\n\
}\n\
\n\
function midPoint(points) {\n\
  var p1 = points[0]\n\
    , p2 = points[1]\n\
  return {\n\
    x: (p2.x + p1.x)/2,\n\
    y: (p2.y + p1.y)/2\n\
  }\n\
}\n\
\n\
function shrink(poss, by) {\n\
  var xs = shrink1(poss[0].x, poss[1].x, by)\n\
    , ys = shrink1(poss[0].y, poss[1].y, by)\n\
  return [{\n\
    x: xs[0],\n\
    y: ys[0]\n\
  }, {\n\
    x: xs[1],\n\
    y: ys[1]\n\
  }]\n\
}\n\
\n\
function shrink1(a, b, by) {\n\
  var m = (1 - by) / 2\n\
    , diff = b - a\n\
  return [\n\
    b - diff * m,\n\
    a + diff * m\n\
  ]\n\
}\n\
\n\
function textBack(center, gen, pos, options) {\n\
  var start = - options.sweep/2 - Math.PI/2 + options.offset\n\
    , segs = options.sweep / (Math.pow(2, gen))\n\
    , innerRadius = genWidth(options.width, gen, options.doubleWidth, options.start)\n\
    , outerRadius = genWidth(options.width, gen + 1, options.doubleWidth, -(1 - options.extend - options.start))\n\
    , left = pointsAngle(center, start + pos * segs, innerRadius, outerRadius)\n\
    , right = pointsAngle(center, start + (pos + 1) * segs, innerRadius, outerRadius)\n\
    , sleft = shrink(left, 0.6)\n\
    , sright = shrink(right, 0.6)\n\
    , srad = shrink1(innerRadius, outerRadius, 0.6)\n\
  innerRadius = srad[0]\n\
  outerRadius = srad[1]\n\
  left = sleft\n\
  right = sright\n\
\n\
  if (options.centerCircle && gen === 0) { // circle me\n\
    return [\n\
      ['M', center.x, center.y],\n\
      ['m', -outerRadius, 0],\n\
      ['a', outerRadius, outerRadius, 0, 1, 0, outerRadius * 2, 0],\n\
      ['a', outerRadius, outerRadius, 0, 1, 0, - outerRadius * 2, 0]\n\
    ];\n\
  }\n\
  return [\n\
    ['M', left[0].x, left[0].y],\n\
    ['L', left[1].x, left[1].y],\n\
    ['A', outerRadius, outerRadius, 0, gen === 0 ? 1 : 0, 1, right[1].x, right[1].y],\n\
    ['L', right[0].x, right[0].y],\n\
    ['A', innerRadius, innerRadius, 0, 0, 0, left[0].x, left[0].y]\n\
  ];\n\
}\n\
\n\
function textPath(center, gen, pos, options) {\n\
  var start = - options.sweep/2 - Math.PI/2 + options.offset\n\
    , segs = options.sweep / (Math.pow(2, gen))\n\
    , innerRadius = genWidth(options.width, gen, options.doubleWidth, options.start)\n\
    , outerRadius = genWidth(options.width, gen + 1, options.doubleWidth, -(1 - options.extend - options.start))\n\
    , middleRadius = (outerRadius + innerRadius) / 2\n\
    , left = pointsAngle(center, start + pos * segs, innerRadius, outerRadius)\n\
    , right = pointsAngle(center, start + (pos + 1) * segs, innerRadius, outerRadius)\n\
    , mleft = midPoint(left)\n\
    , mright = midPoint(right)\n\
  return [\n\
    ['M', mleft.x, mleft.y],\n\
    ['A', middleRadius, middleRadius, 0, 0, 1, mright.x, mright.y],\n\
  ]\n\
}\n\
\n\
function radialLine(center, gen1, gen2, num, options) {\n\
  var start = - options.sweep/2 - Math.PI/2 + options.offset\n\
    , begin = genWidth(options.width, gen1, options.doubleWidth)\n\
    , end = genWidth(options.width, gen2, options.doubleWidth)\n\
    , segs = options.sweep / Math.pow(2, gen1)\n\
    , line = pointsAngle(center, start + segs * num, begin, end);\n\
  return [\n\
    ['M', line[0].x, line[0].y],\n\
    ['L', line[1].x, line[1].y]\n\
  ];\n\
}\n\
\n\
function childTop(ccounts, i, width, horiz) {\n\
  var top = 0;\n\
  for (var j = 0; j < ccounts.length; j++) {\n\
    top += width * Math.ceil(ccounts[j] / horiz);\n\
    top += width / 4;\n\
  }\n\
  return Math.floor(i / horiz) * width + top + width * 3 / 2;\n\
}\n\
\n\
//@ sourceURL=familyfound-fan/utils.js"
));
require.register("notablemind-manager/index.js", Function("exports, require, module",
"\n\
var _ = require('lodash')\n\
\n\
module.exports = Manager\n\
\n\
function Manager(options) {\n\
  this._pending = {}\n\
  this._map = {}\n\
  this._on = {}\n\
  options = options || {}\n\
  if (options.genId) this.genId = options.genId\n\
  if (options.defaultNode) this.defaultNode = options.defaultNode\n\
  if (options.handleError) this.handleError = options.handleError\n\
}\n\
\n\
Manager.prototype = {\n\
  // Override these to make an actual backend, not just a cache\n\
  defaultNode: {},\n\
  genId: function () {\n\
    throw new Error('genId must be overridden')\n\
  },\n\
  newNode: function (data) {\n\
    var id = this.genId()\n\
    this._map[id] = _.extend({}, this.defaultNode, data)\n\
    return id\n\
  },\n\
  setAttr: function (id, attr, data, done) {\n\
    if (!this._map[id]) this._map[id] = {}\n\
    this._map[id][attr] = data\n\
    done && done(null, this._map[id])\n\
  },\n\
  setter: function (id, data, done) {\n\
    this._map[id] = data\n\
    done(null, this._map[id])\n\
  },\n\
  getter: function (id, done) {\n\
    done(null, {})\n\
  },\n\
  handleError: function (err, id) {\n\
    console.error('Failed to fetch', id, err, err.message)\n\
  },\n\
  // this stuff is good\n\
  on: function (id, attr, handler) {\n\
    if (handler === undefined) {\n\
      handler = attr\n\
      attr = null\n\
    }\n\
    if (!this._on[id]) {\n\
      this._on[id] = []\n\
    }\n\
    if (attr) {\n\
      this._on[id].push([handler, attr])\n\
    } else {\n\
      this._on[id].push(handler)\n\
    }\n\
    if (this._map[id]) return handler(attr ? this._map[id][attr] : this._map[id])\n\
    if (this._pending[id]) return\n\
    this.fetch(id)\n\
  },\n\
  off: function (id, attr, handler) {\n\
    if (!this._on[id]) return false\n\
    if (handler === undefined) {\n\
      handler = attr\n\
      attr = null\n\
    }\n\
    var idx\n\
    if (!attr) {\n\
      idx = this._on[id].indexOf(handler)\n\
      if (idx === -1) return false\n\
      this._on[id].splice(idx, 1)\n\
      return true\n\
    }\n\
    for (var i=0; i<this._on[id].length; i++) {\n\
      if (this._on[id][i][0] === handler && this._on[id][i][1] === attr) {\n\
        this._on[id].splice(i, 1)\n\
        return true\n\
      }\n\
    }\n\
    return false\n\
  },\n\
  set: function (id, attr, data) {\n\
    // both will return the full object\n\
    var doattr = arguments.length === 3\n\
    var done = function (err, ndata) {\n\
      if (err) return this.handleError(err, id)\n\
      if (doattr) {\n\
        if (_.isEqual(data, ndata[attr])) return\n\
      } else if (_.isEqual(data, ndata)) {\n\
        return\n\
      }\n\
      this.got(id, ndata)\n\
    }.bind(this)\n\
    if (doattr) {\n\
      this.setAttr(id, attr, data, done)\n\
    } else {\n\
      this.setter(id, attr, done)\n\
    }\n\
  },\n\
  fetch: function (id) {\n\
    this._pending[id] = true\n\
    this.getter(id, function (err, data) {\n\
      this._pending[id] = false\n\
      if (err) return this.handleError(err, id)\n\
      this.got(id, data)\n\
    }.bind(this))\n\
  },\n\
  got: function (id, data) {\n\
    if (undefined === data) return console.warn('item not found', id)\n\
    if (this._map[id]) {\n\
      _.extend(this._map[id], data)\n\
      data = _.extend({}, this._map[id])\n\
    } else {\n\
      this._map[id] = data\n\
    }\n\
    this.trigger(id, data)\n\
  },\n\
  trigger: function (id, data) {\n\
    if (!this._on[id]) return\n\
    for (var i=0; i<this._on[id].length; i++) {\n\
      if (Array.isArray(this._on[id][i])) {\n\
        this._on[id][i][0](data[this._on[id][i][1]])\n\
      } else {\n\
        this._on[id][i](data)\n\
      }\n\
    }\n\
  }\n\
}\n\
\n\
\n\
//@ sourceURL=notablemind-manager/index.js"
));
require.register("familyfound-person-manager/index.js", Function("exports, require, module",
"\n\
var _ = require('lodash')\n\
  , BaseManager = require('manager')\n\
\n\
module.exports = Manager\n\
\n\
function Manager(io) {\n\
  this.io = io\n\
  BaseManager.call(this, {\n\
    defaultNode: {\n\
      data:{},\n\
      rels:{},\n\
      more:{}\n\
    }\n\
  })\n\
  this.listen()\n\
}\n\
\n\
Manager.prototype = _.extend({}, BaseManager.prototype, {\n\
  listen: function () {\n\
    var that = this\n\
    this.io.on('person', function (id, person) {\n\
      that.got(id, person)\n\
    })\n\
    this.io.on('person:more', function (id, person) {\n\
      person.loading = false\n\
      that.got(id, person)\n\
    })\n\
    this.io.on('person:loading', function (id) {\n\
      that.got(id, {loading: true})\n\
    })\n\
    this.io.on('history', function (items) {\n\
      that.got('history', {items: items})\n\
    })\n\
    this.io.on('history:item', function (item) {\n\
      if (!that._map.history) that._map.history = {items:[]}\n\
      if (!that._map.history.items) that._map.history.items = []\n\
      that._map.history.items.unshift(item)\n\
      that.trigger('history', that._map.history)\n\
    })\n\
    this.io.on('starred', function (items) {\n\
      var ids = items.map(function (item) {\n\
        that.got(item.id, {data: item})\n\
        return item.id\n\
      })\n\
      that.got('starred', {ids: ids})\n\
    })\n\
  },\n\
\n\
  load: function (id, gens, npeople) {\n\
    this.io.emit('get:pedigree', id, gens)\n\
    this.io.emit('get:todos', id, npeople)\n\
  },\n\
  set: function (id, data, done) {\n\
    console.error('tried to set', id, data)\n\
  },\n\
  setAttr: function (id, attr, data, done) {\n\
    if (attr !== 'data') \n\
    console.error('tried to set', id, attr, data)\n\
  },\n\
  gotData: function (id, data) {\n\
    var person = this._map[id]\n\
    person.data = data\n\
    this.got(id, person)\n\
  },\n\
\n\
  setCustomTodos: function (id, todos) {\n\
    this.io.emit('set:custom-todos', id, todos, function (person) {\n\
      if (person) this.gotData(id, person)\n\
    }.bind(this))\n\
  },\n\
  setNote: function (id, text) {\n\
    this.io.emit('set:note', id, text, function (person) {\n\
      if (person) this.gotData(id, person)\n\
    }.bind(this))\n\
  },\n\
  setCompleted: function (id, val) {\n\
    this.io.emit('set:completed', id, val, function (person) {\n\
      if (person) this.gotData(id, person)\n\
    }.bind(this))\n\
  },\n\
  setStarred: function (id, val) {\n\
    this.io.emit('set:starred', id, val, function (person) {\n\
      this.updateStars(id, val)\n\
      if (person) this.gotData(id, person)\n\
    }.bind(this))\n\
  },\n\
\n\
  setTodoNote: function (id, type, key, val) {\n\
    this.io.emit('set:todo:note', id, type, key, val, function (person) {\n\
      if (person) this.gotData(id, person)\n\
    }.bind(this))\n\
  },\n\
  setTodoDone: function (id, type, key, val) {\n\
    this.io.emit('set:todo:done', id, type, key, val, function (person) {\n\
      if (person) this.gotData(id, person)\n\
    }.bind(this))\n\
  },\n\
  setTodoHard: function (id, type, key, val) {\n\
    this.io.emit('set:todo:hard', id, type, key, val, function (person) {\n\
      if (person) this.gotData(id, person)\n\
    }.bind(this))\n\
  },\n\
\n\
  updateStars: function (id, val) {\n\
    var ids = this._map.starred.ids\n\
    if (!val) {\n\
      var idx = ids.indexOf(id)\n\
      if (idx !== -1) {\n\
        ids.splice(idx, 1)\n\
      }\n\
    } else {\n\
      ids.unshift(id)\n\
    }\n\
    this.got('starred', {ids: ids})\n\
  }\n\
})\n\
\n\
//@ sourceURL=familyfound-person-manager/index.js"
));
require.register("jashkenas-underscore/underscore.js", Function("exports, require, module",
"//     Underscore.js 1.6.0\n\
//     http://underscorejs.org\n\
//     (c) 2009-2014 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors\n\
//     Underscore may be freely distributed under the MIT license.\n\
\n\
(function() {\n\
\n\
  // Baseline setup\n\
  // --------------\n\
\n\
  // Establish the root object, `window` in the browser, or `exports` on the server.\n\
  var root = this;\n\
\n\
  // Save the previous value of the `_` variable.\n\
  var previousUnderscore = root._;\n\
\n\
  // Establish the object that gets returned to break out of a loop iteration.\n\
  var breaker = {};\n\
\n\
  // Save bytes in the minified (but not gzipped) version:\n\
  var ArrayProto = Array.prototype, ObjProto = Object.prototype, FuncProto = Function.prototype;\n\
\n\
  // Create quick reference variables for speed access to core prototypes.\n\
  var\n\
    push             = ArrayProto.push,\n\
    slice            = ArrayProto.slice,\n\
    concat           = ArrayProto.concat,\n\
    toString         = ObjProto.toString,\n\
    hasOwnProperty   = ObjProto.hasOwnProperty;\n\
\n\
  // All **ECMAScript 5** native function implementations that we hope to use\n\
  // are declared here.\n\
  var\n\
    nativeForEach      = ArrayProto.forEach,\n\
    nativeMap          = ArrayProto.map,\n\
    nativeReduce       = ArrayProto.reduce,\n\
    nativeReduceRight  = ArrayProto.reduceRight,\n\
    nativeFilter       = ArrayProto.filter,\n\
    nativeEvery        = ArrayProto.every,\n\
    nativeSome         = ArrayProto.some,\n\
    nativeIndexOf      = ArrayProto.indexOf,\n\
    nativeLastIndexOf  = ArrayProto.lastIndexOf,\n\
    nativeIsArray      = Array.isArray,\n\
    nativeKeys         = Object.keys,\n\
    nativeBind         = FuncProto.bind;\n\
\n\
  // Create a safe reference to the Underscore object for use below.\n\
  var _ = function(obj) {\n\
    if (obj instanceof _) return obj;\n\
    if (!(this instanceof _)) return new _(obj);\n\
    this._wrapped = obj;\n\
  };\n\
\n\
  // Export the Underscore object for **Node.js**, with\n\
  // backwards-compatibility for the old `require()` API. If we're in\n\
  // the browser, add `_` as a global object via a string identifier,\n\
  // for Closure Compiler \"advanced\" mode.\n\
  if (typeof exports !== 'undefined') {\n\
    if (typeof module !== 'undefined' && module.exports) {\n\
      exports = module.exports = _;\n\
    }\n\
    exports._ = _;\n\
  } else {\n\
    root._ = _;\n\
  }\n\
\n\
  // Current version.\n\
  _.VERSION = '1.6.0';\n\
\n\
  // Collection Functions\n\
  // --------------------\n\
\n\
  // The cornerstone, an `each` implementation, aka `forEach`.\n\
  // Handles objects with the built-in `forEach`, arrays, and raw objects.\n\
  // Delegates to **ECMAScript 5**'s native `forEach` if available.\n\
  var each = _.each = _.forEach = function(obj, iterator, context) {\n\
    if (obj == null) return obj;\n\
    if (nativeForEach && obj.forEach === nativeForEach) {\n\
      obj.forEach(iterator, context);\n\
    } else if (obj.length === +obj.length) {\n\
      for (var i = 0, length = obj.length; i < length; i++) {\n\
        if (iterator.call(context, obj[i], i, obj) === breaker) return;\n\
      }\n\
    } else {\n\
      var keys = _.keys(obj);\n\
      for (var i = 0, length = keys.length; i < length; i++) {\n\
        if (iterator.call(context, obj[keys[i]], keys[i], obj) === breaker) return;\n\
      }\n\
    }\n\
    return obj;\n\
  };\n\
\n\
  // Return the results of applying the iterator to each element.\n\
  // Delegates to **ECMAScript 5**'s native `map` if available.\n\
  _.map = _.collect = function(obj, iterator, context) {\n\
    var results = [];\n\
    if (obj == null) return results;\n\
    if (nativeMap && obj.map === nativeMap) return obj.map(iterator, context);\n\
    each(obj, function(value, index, list) {\n\
      results.push(iterator.call(context, value, index, list));\n\
    });\n\
    return results;\n\
  };\n\
\n\
  var reduceError = 'Reduce of empty array with no initial value';\n\
\n\
  // **Reduce** builds up a single result from a list of values, aka `inject`,\n\
  // or `foldl`. Delegates to **ECMAScript 5**'s native `reduce` if available.\n\
  _.reduce = _.foldl = _.inject = function(obj, iterator, memo, context) {\n\
    var initial = arguments.length > 2;\n\
    if (obj == null) obj = [];\n\
    if (nativeReduce && obj.reduce === nativeReduce) {\n\
      if (context) iterator = _.bind(iterator, context);\n\
      return initial ? obj.reduce(iterator, memo) : obj.reduce(iterator);\n\
    }\n\
    each(obj, function(value, index, list) {\n\
      if (!initial) {\n\
        memo = value;\n\
        initial = true;\n\
      } else {\n\
        memo = iterator.call(context, memo, value, index, list);\n\
      }\n\
    });\n\
    if (!initial) throw new TypeError(reduceError);\n\
    return memo;\n\
  };\n\
\n\
  // The right-associative version of reduce, also known as `foldr`.\n\
  // Delegates to **ECMAScript 5**'s native `reduceRight` if available.\n\
  _.reduceRight = _.foldr = function(obj, iterator, memo, context) {\n\
    var initial = arguments.length > 2;\n\
    if (obj == null) obj = [];\n\
    if (nativeReduceRight && obj.reduceRight === nativeReduceRight) {\n\
      if (context) iterator = _.bind(iterator, context);\n\
      return initial ? obj.reduceRight(iterator, memo) : obj.reduceRight(iterator);\n\
    }\n\
    var length = obj.length;\n\
    if (length !== +length) {\n\
      var keys = _.keys(obj);\n\
      length = keys.length;\n\
    }\n\
    each(obj, function(value, index, list) {\n\
      index = keys ? keys[--length] : --length;\n\
      if (!initial) {\n\
        memo = obj[index];\n\
        initial = true;\n\
      } else {\n\
        memo = iterator.call(context, memo, obj[index], index, list);\n\
      }\n\
    });\n\
    if (!initial) throw new TypeError(reduceError);\n\
    return memo;\n\
  };\n\
\n\
  // Return the first value which passes a truth test. Aliased as `detect`.\n\
  _.find = _.detect = function(obj, predicate, context) {\n\
    var result;\n\
    any(obj, function(value, index, list) {\n\
      if (predicate.call(context, value, index, list)) {\n\
        result = value;\n\
        return true;\n\
      }\n\
    });\n\
    return result;\n\
  };\n\
\n\
  // Return all the elements that pass a truth test.\n\
  // Delegates to **ECMAScript 5**'s native `filter` if available.\n\
  // Aliased as `select`.\n\
  _.filter = _.select = function(obj, predicate, context) {\n\
    var results = [];\n\
    if (obj == null) return results;\n\
    if (nativeFilter && obj.filter === nativeFilter) return obj.filter(predicate, context);\n\
    each(obj, function(value, index, list) {\n\
      if (predicate.call(context, value, index, list)) results.push(value);\n\
    });\n\
    return results;\n\
  };\n\
\n\
  // Return all the elements for which a truth test fails.\n\
  _.reject = function(obj, predicate, context) {\n\
    return _.filter(obj, function(value, index, list) {\n\
      return !predicate.call(context, value, index, list);\n\
    }, context);\n\
  };\n\
\n\
  // Determine whether all of the elements match a truth test.\n\
  // Delegates to **ECMAScript 5**'s native `every` if available.\n\
  // Aliased as `all`.\n\
  _.every = _.all = function(obj, predicate, context) {\n\
    predicate || (predicate = _.identity);\n\
    var result = true;\n\
    if (obj == null) return result;\n\
    if (nativeEvery && obj.every === nativeEvery) return obj.every(predicate, context);\n\
    each(obj, function(value, index, list) {\n\
      if (!(result = result && predicate.call(context, value, index, list))) return breaker;\n\
    });\n\
    return !!result;\n\
  };\n\
\n\
  // Determine if at least one element in the object matches a truth test.\n\
  // Delegates to **ECMAScript 5**'s native `some` if available.\n\
  // Aliased as `any`.\n\
  var any = _.some = _.any = function(obj, predicate, context) {\n\
    predicate || (predicate = _.identity);\n\
    var result = false;\n\
    if (obj == null) return result;\n\
    if (nativeSome && obj.some === nativeSome) return obj.some(predicate, context);\n\
    each(obj, function(value, index, list) {\n\
      if (result || (result = predicate.call(context, value, index, list))) return breaker;\n\
    });\n\
    return !!result;\n\
  };\n\
\n\
  // Determine if the array or object contains a given value (using `===`).\n\
  // Aliased as `include`.\n\
  _.contains = _.include = function(obj, target) {\n\
    if (obj == null) return false;\n\
    if (nativeIndexOf && obj.indexOf === nativeIndexOf) return obj.indexOf(target) != -1;\n\
    return any(obj, function(value) {\n\
      return value === target;\n\
    });\n\
  };\n\
\n\
  // Invoke a method (with arguments) on every item in a collection.\n\
  _.invoke = function(obj, method) {\n\
    var args = slice.call(arguments, 2);\n\
    var isFunc = _.isFunction(method);\n\
    return _.map(obj, function(value) {\n\
      return (isFunc ? method : value[method]).apply(value, args);\n\
    });\n\
  };\n\
\n\
  // Convenience version of a common use case of `map`: fetching a property.\n\
  _.pluck = function(obj, key) {\n\
    return _.map(obj, _.property(key));\n\
  };\n\
\n\
  // Convenience version of a common use case of `filter`: selecting only objects\n\
  // containing specific `key:value` pairs.\n\
  _.where = function(obj, attrs) {\n\
    return _.filter(obj, _.matches(attrs));\n\
  };\n\
\n\
  // Convenience version of a common use case of `find`: getting the first object\n\
  // containing specific `key:value` pairs.\n\
  _.findWhere = function(obj, attrs) {\n\
    return _.find(obj, _.matches(attrs));\n\
  };\n\
\n\
  // Return the maximum element or (element-based computation).\n\
  // Can't optimize arrays of integers longer than 65,535 elements.\n\
  // See [WebKit Bug 80797](https://bugs.webkit.org/show_bug.cgi?id=80797)\n\
  _.max = function(obj, iterator, context) {\n\
    if (!iterator && _.isArray(obj) && obj[0] === +obj[0] && obj.length < 65535) {\n\
      return Math.max.apply(Math, obj);\n\
    }\n\
    var result = -Infinity, lastComputed = -Infinity;\n\
    each(obj, function(value, index, list) {\n\
      var computed = iterator ? iterator.call(context, value, index, list) : value;\n\
      if (computed > lastComputed) {\n\
        result = value;\n\
        lastComputed = computed;\n\
      }\n\
    });\n\
    return result;\n\
  };\n\
\n\
  // Return the minimum element (or element-based computation).\n\
  _.min = function(obj, iterator, context) {\n\
    if (!iterator && _.isArray(obj) && obj[0] === +obj[0] && obj.length < 65535) {\n\
      return Math.min.apply(Math, obj);\n\
    }\n\
    var result = Infinity, lastComputed = Infinity;\n\
    each(obj, function(value, index, list) {\n\
      var computed = iterator ? iterator.call(context, value, index, list) : value;\n\
      if (computed < lastComputed) {\n\
        result = value;\n\
        lastComputed = computed;\n\
      }\n\
    });\n\
    return result;\n\
  };\n\
\n\
  // Shuffle an array, using the modern version of the\n\
  // [Fisher-Yates shuffle](http://en.wikipedia.org/wiki/Fisher–Yates_shuffle).\n\
  _.shuffle = function(obj) {\n\
    var rand;\n\
    var index = 0;\n\
    var shuffled = [];\n\
    each(obj, function(value) {\n\
      rand = _.random(index++);\n\
      shuffled[index - 1] = shuffled[rand];\n\
      shuffled[rand] = value;\n\
    });\n\
    return shuffled;\n\
  };\n\
\n\
  // Sample **n** random values from a collection.\n\
  // If **n** is not specified, returns a single random element.\n\
  // The internal `guard` argument allows it to work with `map`.\n\
  _.sample = function(obj, n, guard) {\n\
    if (n == null || guard) {\n\
      if (obj.length !== +obj.length) obj = _.values(obj);\n\
      return obj[_.random(obj.length - 1)];\n\
    }\n\
    return _.shuffle(obj).slice(0, Math.max(0, n));\n\
  };\n\
\n\
  // An internal function to generate lookup iterators.\n\
  var lookupIterator = function(value) {\n\
    if (value == null) return _.identity;\n\
    if (_.isFunction(value)) return value;\n\
    return _.property(value);\n\
  };\n\
\n\
  // Sort the object's values by a criterion produced by an iterator.\n\
  _.sortBy = function(obj, iterator, context) {\n\
    iterator = lookupIterator(iterator);\n\
    return _.pluck(_.map(obj, function(value, index, list) {\n\
      return {\n\
        value: value,\n\
        index: index,\n\
        criteria: iterator.call(context, value, index, list)\n\
      };\n\
    }).sort(function(left, right) {\n\
      var a = left.criteria;\n\
      var b = right.criteria;\n\
      if (a !== b) {\n\
        if (a > b || a === void 0) return 1;\n\
        if (a < b || b === void 0) return -1;\n\
      }\n\
      return left.index - right.index;\n\
    }), 'value');\n\
  };\n\
\n\
  // An internal function used for aggregate \"group by\" operations.\n\
  var group = function(behavior) {\n\
    return function(obj, iterator, context) {\n\
      var result = {};\n\
      iterator = lookupIterator(iterator);\n\
      each(obj, function(value, index) {\n\
        var key = iterator.call(context, value, index, obj);\n\
        behavior(result, key, value);\n\
      });\n\
      return result;\n\
    };\n\
  };\n\
\n\
  // Groups the object's values by a criterion. Pass either a string attribute\n\
  // to group by, or a function that returns the criterion.\n\
  _.groupBy = group(function(result, key, value) {\n\
    _.has(result, key) ? result[key].push(value) : result[key] = [value];\n\
  });\n\
\n\
  // Indexes the object's values by a criterion, similar to `groupBy`, but for\n\
  // when you know that your index values will be unique.\n\
  _.indexBy = group(function(result, key, value) {\n\
    result[key] = value;\n\
  });\n\
\n\
  // Counts instances of an object that group by a certain criterion. Pass\n\
  // either a string attribute to count by, or a function that returns the\n\
  // criterion.\n\
  _.countBy = group(function(result, key) {\n\
    _.has(result, key) ? result[key]++ : result[key] = 1;\n\
  });\n\
\n\
  // Use a comparator function to figure out the smallest index at which\n\
  // an object should be inserted so as to maintain order. Uses binary search.\n\
  _.sortedIndex = function(array, obj, iterator, context) {\n\
    iterator = lookupIterator(iterator);\n\
    var value = iterator.call(context, obj);\n\
    var low = 0, high = array.length;\n\
    while (low < high) {\n\
      var mid = (low + high) >>> 1;\n\
      iterator.call(context, array[mid]) < value ? low = mid + 1 : high = mid;\n\
    }\n\
    return low;\n\
  };\n\
\n\
  // Safely create a real, live array from anything iterable.\n\
  _.toArray = function(obj) {\n\
    if (!obj) return [];\n\
    if (_.isArray(obj)) return slice.call(obj);\n\
    if (obj.length === +obj.length) return _.map(obj, _.identity);\n\
    return _.values(obj);\n\
  };\n\
\n\
  // Return the number of elements in an object.\n\
  _.size = function(obj) {\n\
    if (obj == null) return 0;\n\
    return (obj.length === +obj.length) ? obj.length : _.keys(obj).length;\n\
  };\n\
\n\
  // Array Functions\n\
  // ---------------\n\
\n\
  // Get the first element of an array. Passing **n** will return the first N\n\
  // values in the array. Aliased as `head` and `take`. The **guard** check\n\
  // allows it to work with `_.map`.\n\
  _.first = _.head = _.take = function(array, n, guard) {\n\
    if (array == null) return void 0;\n\
    if ((n == null) || guard) return array[0];\n\
    if (n < 0) return [];\n\
    return slice.call(array, 0, n);\n\
  };\n\
\n\
  // Returns everything but the last entry of the array. Especially useful on\n\
  // the arguments object. Passing **n** will return all the values in\n\
  // the array, excluding the last N. The **guard** check allows it to work with\n\
  // `_.map`.\n\
  _.initial = function(array, n, guard) {\n\
    return slice.call(array, 0, array.length - ((n == null) || guard ? 1 : n));\n\
  };\n\
\n\
  // Get the last element of an array. Passing **n** will return the last N\n\
  // values in the array. The **guard** check allows it to work with `_.map`.\n\
  _.last = function(array, n, guard) {\n\
    if (array == null) return void 0;\n\
    if ((n == null) || guard) return array[array.length - 1];\n\
    return slice.call(array, Math.max(array.length - n, 0));\n\
  };\n\
\n\
  // Returns everything but the first entry of the array. Aliased as `tail` and `drop`.\n\
  // Especially useful on the arguments object. Passing an **n** will return\n\
  // the rest N values in the array. The **guard**\n\
  // check allows it to work with `_.map`.\n\
  _.rest = _.tail = _.drop = function(array, n, guard) {\n\
    return slice.call(array, (n == null) || guard ? 1 : n);\n\
  };\n\
\n\
  // Trim out all falsy values from an array.\n\
  _.compact = function(array) {\n\
    return _.filter(array, _.identity);\n\
  };\n\
\n\
  // Internal implementation of a recursive `flatten` function.\n\
  var flatten = function(input, shallow, strict, output) {\n\
    if (shallow && _.every(input, _.isArray)) {\n\
      return concat.apply(output, input);\n\
    }\n\
    for (var i = 0, length = input.length; i < length; i++) {\n\
      var value = input[i];\n\
      if (!_.isArray(value) && !_.isArguments(value)) {\n\
        if (!strict) output.push(value);\n\
      } else if (shallow) {\n\
        push.apply(output, value);\n\
      } else {\n\
        flatten(value, shallow, strict, output);\n\
      }\n\
    }\n\
    return output;\n\
  };\n\
\n\
  // Flatten out an array, either recursively (by default), or just one level.\n\
  _.flatten = function(array, shallow) {\n\
    return flatten(array, shallow, false, []);\n\
  };\n\
\n\
  // Return a version of the array that does not contain the specified value(s).\n\
  _.without = function(array) {\n\
    return _.difference(array, slice.call(arguments, 1));\n\
  };\n\
\n\
  // Split an array into two arrays: one whose elements all satisfy the given\n\
  // predicate, and one whose elements all do not satisfy the predicate.\n\
  _.partition = function(obj, predicate, context) {\n\
    predicate = lookupIterator(predicate);\n\
    var pass = [], fail = [];\n\
    each(obj, function(elem) {\n\
      (predicate.call(context, elem) ? pass : fail).push(elem);\n\
    });\n\
    return [pass, fail];\n\
  };\n\
\n\
  // Produce a duplicate-free version of the array. If the array has already\n\
  // been sorted, you have the option of using a faster algorithm.\n\
  // Aliased as `unique`.\n\
  _.uniq = _.unique = function(array, isSorted, iterator, context) {\n\
    if (_.isFunction(isSorted)) {\n\
      context = iterator;\n\
      iterator = isSorted;\n\
      isSorted = false;\n\
    }\n\
    var initial = iterator ? _.map(array, iterator, context) : array;\n\
    var results = [];\n\
    var seen = [];\n\
    each(initial, function(value, index) {\n\
      if (isSorted ? (!index || seen[seen.length - 1] !== value) : !_.contains(seen, value)) {\n\
        seen.push(value);\n\
        results.push(array[index]);\n\
      }\n\
    });\n\
    return results;\n\
  };\n\
\n\
  // Produce an array that contains the union: each distinct element from all of\n\
  // the passed-in arrays.\n\
  _.union = function() {\n\
    return _.uniq(flatten(arguments, true, true, []));\n\
  };\n\
\n\
  // Produce an array that contains every item shared between all the\n\
  // passed-in arrays.\n\
  _.intersection = function(array) {\n\
    var rest = slice.call(arguments, 1);\n\
    return _.filter(_.uniq(array), function(item) {\n\
      return _.every(rest, function(other) {\n\
        return _.contains(other, item);\n\
      });\n\
    });\n\
  };\n\
\n\
  // Take the difference between one array and a number of other arrays.\n\
  // Only the elements present in just the first array will remain.\n\
  _.difference = function(array) {\n\
    var rest = flatten(slice.call(arguments, 1), true, true, []);\n\
    return _.filter(array, function(value){ return !_.contains(rest, value); });\n\
  };\n\
\n\
  // Zip together multiple lists into a single array -- elements that share\n\
  // an index go together.\n\
  _.zip = function() {\n\
    var length = _.max(_.pluck(arguments, 'length').concat(0));\n\
    var results = new Array(length);\n\
    for (var i = 0; i < length; i++) {\n\
      results[i] = _.pluck(arguments, '' + i);\n\
    }\n\
    return results;\n\
  };\n\
\n\
  // Converts lists into objects. Pass either a single array of `[key, value]`\n\
  // pairs, or two parallel arrays of the same length -- one of keys, and one of\n\
  // the corresponding values.\n\
  _.object = function(list, values) {\n\
    if (list == null) return {};\n\
    var result = {};\n\
    for (var i = 0, length = list.length; i < length; i++) {\n\
      if (values) {\n\
        result[list[i]] = values[i];\n\
      } else {\n\
        result[list[i][0]] = list[i][1];\n\
      }\n\
    }\n\
    return result;\n\
  };\n\
\n\
  // If the browser doesn't supply us with indexOf (I'm looking at you, **MSIE**),\n\
  // we need this function. Return the position of the first occurrence of an\n\
  // item in an array, or -1 if the item is not included in the array.\n\
  // Delegates to **ECMAScript 5**'s native `indexOf` if available.\n\
  // If the array is large and already in sort order, pass `true`\n\
  // for **isSorted** to use binary search.\n\
  _.indexOf = function(array, item, isSorted) {\n\
    if (array == null) return -1;\n\
    var i = 0, length = array.length;\n\
    if (isSorted) {\n\
      if (typeof isSorted == 'number') {\n\
        i = (isSorted < 0 ? Math.max(0, length + isSorted) : isSorted);\n\
      } else {\n\
        i = _.sortedIndex(array, item);\n\
        return array[i] === item ? i : -1;\n\
      }\n\
    }\n\
    if (nativeIndexOf && array.indexOf === nativeIndexOf) return array.indexOf(item, isSorted);\n\
    for (; i < length; i++) if (array[i] === item) return i;\n\
    return -1;\n\
  };\n\
\n\
  // Delegates to **ECMAScript 5**'s native `lastIndexOf` if available.\n\
  _.lastIndexOf = function(array, item, from) {\n\
    if (array == null) return -1;\n\
    var hasIndex = from != null;\n\
    if (nativeLastIndexOf && array.lastIndexOf === nativeLastIndexOf) {\n\
      return hasIndex ? array.lastIndexOf(item, from) : array.lastIndexOf(item);\n\
    }\n\
    var i = (hasIndex ? from : array.length);\n\
    while (i--) if (array[i] === item) return i;\n\
    return -1;\n\
  };\n\
\n\
  // Generate an integer Array containing an arithmetic progression. A port of\n\
  // the native Python `range()` function. See\n\
  // [the Python documentation](http://docs.python.org/library/functions.html#range).\n\
  _.range = function(start, stop, step) {\n\
    if (arguments.length <= 1) {\n\
      stop = start || 0;\n\
      start = 0;\n\
    }\n\
    step = arguments[2] || 1;\n\
\n\
    var length = Math.max(Math.ceil((stop - start) / step), 0);\n\
    var idx = 0;\n\
    var range = new Array(length);\n\
\n\
    while(idx < length) {\n\
      range[idx++] = start;\n\
      start += step;\n\
    }\n\
\n\
    return range;\n\
  };\n\
\n\
  // Function (ahem) Functions\n\
  // ------------------\n\
\n\
  // Reusable constructor function for prototype setting.\n\
  var ctor = function(){};\n\
\n\
  // Create a function bound to a given object (assigning `this`, and arguments,\n\
  // optionally). Delegates to **ECMAScript 5**'s native `Function.bind` if\n\
  // available.\n\
  _.bind = function(func, context) {\n\
    var args, bound;\n\
    if (nativeBind && func.bind === nativeBind) return nativeBind.apply(func, slice.call(arguments, 1));\n\
    if (!_.isFunction(func)) throw new TypeError;\n\
    args = slice.call(arguments, 2);\n\
    return bound = function() {\n\
      if (!(this instanceof bound)) return func.apply(context, args.concat(slice.call(arguments)));\n\
      ctor.prototype = func.prototype;\n\
      var self = new ctor;\n\
      ctor.prototype = null;\n\
      var result = func.apply(self, args.concat(slice.call(arguments)));\n\
      if (Object(result) === result) return result;\n\
      return self;\n\
    };\n\
  };\n\
\n\
  // Partially apply a function by creating a version that has had some of its\n\
  // arguments pre-filled, without changing its dynamic `this` context. _ acts\n\
  // as a placeholder, allowing any combination of arguments to be pre-filled.\n\
  _.partial = function(func) {\n\
    var boundArgs = slice.call(arguments, 1);\n\
    return function() {\n\
      var position = 0;\n\
      var args = boundArgs.slice();\n\
      for (var i = 0, length = args.length; i < length; i++) {\n\
        if (args[i] === _) args[i] = arguments[position++];\n\
      }\n\
      while (position < arguments.length) args.push(arguments[position++]);\n\
      return func.apply(this, args);\n\
    };\n\
  };\n\
\n\
  // Bind a number of an object's methods to that object. Remaining arguments\n\
  // are the method names to be bound. Useful for ensuring that all callbacks\n\
  // defined on an object belong to it.\n\
  _.bindAll = function(obj) {\n\
    var funcs = slice.call(arguments, 1);\n\
    if (funcs.length === 0) throw new Error('bindAll must be passed function names');\n\
    each(funcs, function(f) { obj[f] = _.bind(obj[f], obj); });\n\
    return obj;\n\
  };\n\
\n\
  // Memoize an expensive function by storing its results.\n\
  _.memoize = function(func, hasher) {\n\
    var memo = {};\n\
    hasher || (hasher = _.identity);\n\
    return function() {\n\
      var key = hasher.apply(this, arguments);\n\
      return _.has(memo, key) ? memo[key] : (memo[key] = func.apply(this, arguments));\n\
    };\n\
  };\n\
\n\
  // Delays a function for the given number of milliseconds, and then calls\n\
  // it with the arguments supplied.\n\
  _.delay = function(func, wait) {\n\
    var args = slice.call(arguments, 2);\n\
    return setTimeout(function(){ return func.apply(null, args); }, wait);\n\
  };\n\
\n\
  // Defers a function, scheduling it to run after the current call stack has\n\
  // cleared.\n\
  _.defer = function(func) {\n\
    return _.delay.apply(_, [func, 1].concat(slice.call(arguments, 1)));\n\
  };\n\
\n\
  // Returns a function, that, when invoked, will only be triggered at most once\n\
  // during a given window of time. Normally, the throttled function will run\n\
  // as much as it can, without ever going more than once per `wait` duration;\n\
  // but if you'd like to disable the execution on the leading edge, pass\n\
  // `{leading: false}`. To disable execution on the trailing edge, ditto.\n\
  _.throttle = function(func, wait, options) {\n\
    var context, args, result;\n\
    var timeout = null;\n\
    var previous = 0;\n\
    options || (options = {});\n\
    var later = function() {\n\
      previous = options.leading === false ? 0 : _.now();\n\
      timeout = null;\n\
      result = func.apply(context, args);\n\
      context = args = null;\n\
    };\n\
    return function() {\n\
      var now = _.now();\n\
      if (!previous && options.leading === false) previous = now;\n\
      var remaining = wait - (now - previous);\n\
      context = this;\n\
      args = arguments;\n\
      if (remaining <= 0) {\n\
        clearTimeout(timeout);\n\
        timeout = null;\n\
        previous = now;\n\
        result = func.apply(context, args);\n\
        context = args = null;\n\
      } else if (!timeout && options.trailing !== false) {\n\
        timeout = setTimeout(later, remaining);\n\
      }\n\
      return result;\n\
    };\n\
  };\n\
\n\
  // Returns a function, that, as long as it continues to be invoked, will not\n\
  // be triggered. The function will be called after it stops being called for\n\
  // N milliseconds. If `immediate` is passed, trigger the function on the\n\
  // leading edge, instead of the trailing.\n\
  _.debounce = function(func, wait, immediate) {\n\
    var timeout, args, context, timestamp, result;\n\
\n\
    var later = function() {\n\
      var last = _.now() - timestamp;\n\
      if (last < wait) {\n\
        timeout = setTimeout(later, wait - last);\n\
      } else {\n\
        timeout = null;\n\
        if (!immediate) {\n\
          result = func.apply(context, args);\n\
          context = args = null;\n\
        }\n\
      }\n\
    };\n\
\n\
    return function() {\n\
      context = this;\n\
      args = arguments;\n\
      timestamp = _.now();\n\
      var callNow = immediate && !timeout;\n\
      if (!timeout) {\n\
        timeout = setTimeout(later, wait);\n\
      }\n\
      if (callNow) {\n\
        result = func.apply(context, args);\n\
        context = args = null;\n\
      }\n\
\n\
      return result;\n\
    };\n\
  };\n\
\n\
  // Returns a function that will be executed at most one time, no matter how\n\
  // often you call it. Useful for lazy initialization.\n\
  _.once = function(func) {\n\
    var ran = false, memo;\n\
    return function() {\n\
      if (ran) return memo;\n\
      ran = true;\n\
      memo = func.apply(this, arguments);\n\
      func = null;\n\
      return memo;\n\
    };\n\
  };\n\
\n\
  // Returns the first function passed as an argument to the second,\n\
  // allowing you to adjust arguments, run code before and after, and\n\
  // conditionally execute the original function.\n\
  _.wrap = function(func, wrapper) {\n\
    return _.partial(wrapper, func);\n\
  };\n\
\n\
  // Returns a function that is the composition of a list of functions, each\n\
  // consuming the return value of the function that follows.\n\
  _.compose = function() {\n\
    var funcs = arguments;\n\
    return function() {\n\
      var args = arguments;\n\
      for (var i = funcs.length - 1; i >= 0; i--) {\n\
        args = [funcs[i].apply(this, args)];\n\
      }\n\
      return args[0];\n\
    };\n\
  };\n\
\n\
  // Returns a function that will only be executed after being called N times.\n\
  _.after = function(times, func) {\n\
    return function() {\n\
      if (--times < 1) {\n\
        return func.apply(this, arguments);\n\
      }\n\
    };\n\
  };\n\
\n\
  // Object Functions\n\
  // ----------------\n\
\n\
  // Retrieve the names of an object's properties.\n\
  // Delegates to **ECMAScript 5**'s native `Object.keys`\n\
  _.keys = function(obj) {\n\
    if (!_.isObject(obj)) return [];\n\
    if (nativeKeys) return nativeKeys(obj);\n\
    var keys = [];\n\
    for (var key in obj) if (_.has(obj, key)) keys.push(key);\n\
    return keys;\n\
  };\n\
\n\
  // Retrieve the values of an object's properties.\n\
  _.values = function(obj) {\n\
    var keys = _.keys(obj);\n\
    var length = keys.length;\n\
    var values = new Array(length);\n\
    for (var i = 0; i < length; i++) {\n\
      values[i] = obj[keys[i]];\n\
    }\n\
    return values;\n\
  };\n\
\n\
  // Convert an object into a list of `[key, value]` pairs.\n\
  _.pairs = function(obj) {\n\
    var keys = _.keys(obj);\n\
    var length = keys.length;\n\
    var pairs = new Array(length);\n\
    for (var i = 0; i < length; i++) {\n\
      pairs[i] = [keys[i], obj[keys[i]]];\n\
    }\n\
    return pairs;\n\
  };\n\
\n\
  // Invert the keys and values of an object. The values must be serializable.\n\
  _.invert = function(obj) {\n\
    var result = {};\n\
    var keys = _.keys(obj);\n\
    for (var i = 0, length = keys.length; i < length; i++) {\n\
      result[obj[keys[i]]] = keys[i];\n\
    }\n\
    return result;\n\
  };\n\
\n\
  // Return a sorted list of the function names available on the object.\n\
  // Aliased as `methods`\n\
  _.functions = _.methods = function(obj) {\n\
    var names = [];\n\
    for (var key in obj) {\n\
      if (_.isFunction(obj[key])) names.push(key);\n\
    }\n\
    return names.sort();\n\
  };\n\
\n\
  // Extend a given object with all the properties in passed-in object(s).\n\
  _.extend = function(obj) {\n\
    each(slice.call(arguments, 1), function(source) {\n\
      if (source) {\n\
        for (var prop in source) {\n\
          obj[prop] = source[prop];\n\
        }\n\
      }\n\
    });\n\
    return obj;\n\
  };\n\
\n\
  // Return a copy of the object only containing the whitelisted properties.\n\
  _.pick = function(obj) {\n\
    var copy = {};\n\
    var keys = concat.apply(ArrayProto, slice.call(arguments, 1));\n\
    each(keys, function(key) {\n\
      if (key in obj) copy[key] = obj[key];\n\
    });\n\
    return copy;\n\
  };\n\
\n\
   // Return a copy of the object without the blacklisted properties.\n\
  _.omit = function(obj) {\n\
    var copy = {};\n\
    var keys = concat.apply(ArrayProto, slice.call(arguments, 1));\n\
    for (var key in obj) {\n\
      if (!_.contains(keys, key)) copy[key] = obj[key];\n\
    }\n\
    return copy;\n\
  };\n\
\n\
  // Fill in a given object with default properties.\n\
  _.defaults = function(obj) {\n\
    each(slice.call(arguments, 1), function(source) {\n\
      if (source) {\n\
        for (var prop in source) {\n\
          if (obj[prop] === void 0) obj[prop] = source[prop];\n\
        }\n\
      }\n\
    });\n\
    return obj;\n\
  };\n\
\n\
  // Create a (shallow-cloned) duplicate of an object.\n\
  _.clone = function(obj) {\n\
    if (!_.isObject(obj)) return obj;\n\
    return _.isArray(obj) ? obj.slice() : _.extend({}, obj);\n\
  };\n\
\n\
  // Invokes interceptor with the obj, and then returns obj.\n\
  // The primary purpose of this method is to \"tap into\" a method chain, in\n\
  // order to perform operations on intermediate results within the chain.\n\
  _.tap = function(obj, interceptor) {\n\
    interceptor(obj);\n\
    return obj;\n\
  };\n\
\n\
  // Internal recursive comparison function for `isEqual`.\n\
  var eq = function(a, b, aStack, bStack) {\n\
    // Identical objects are equal. `0 === -0`, but they aren't identical.\n\
    // See the [Harmony `egal` proposal](http://wiki.ecmascript.org/doku.php?id=harmony:egal).\n\
    if (a === b) return a !== 0 || 1 / a == 1 / b;\n\
    // A strict comparison is necessary because `null == undefined`.\n\
    if (a == null || b == null) return a === b;\n\
    // Unwrap any wrapped objects.\n\
    if (a instanceof _) a = a._wrapped;\n\
    if (b instanceof _) b = b._wrapped;\n\
    // Compare `[[Class]]` names.\n\
    var className = toString.call(a);\n\
    if (className != toString.call(b)) return false;\n\
    switch (className) {\n\
      // Strings, numbers, dates, and booleans are compared by value.\n\
      case '[object String]':\n\
        // Primitives and their corresponding object wrappers are equivalent; thus, `\"5\"` is\n\
        // equivalent to `new String(\"5\")`.\n\
        return a == String(b);\n\
      case '[object Number]':\n\
        // `NaN`s are equivalent, but non-reflexive. An `egal` comparison is performed for\n\
        // other numeric values.\n\
        return a != +a ? b != +b : (a == 0 ? 1 / a == 1 / b : a == +b);\n\
      case '[object Date]':\n\
      case '[object Boolean]':\n\
        // Coerce dates and booleans to numeric primitive values. Dates are compared by their\n\
        // millisecond representations. Note that invalid dates with millisecond representations\n\
        // of `NaN` are not equivalent.\n\
        return +a == +b;\n\
      // RegExps are compared by their source patterns and flags.\n\
      case '[object RegExp]':\n\
        return a.source == b.source &&\n\
               a.global == b.global &&\n\
               a.multiline == b.multiline &&\n\
               a.ignoreCase == b.ignoreCase;\n\
    }\n\
    if (typeof a != 'object' || typeof b != 'object') return false;\n\
    // Assume equality for cyclic structures. The algorithm for detecting cyclic\n\
    // structures is adapted from ES 5.1 section 15.12.3, abstract operation `JO`.\n\
    var length = aStack.length;\n\
    while (length--) {\n\
      // Linear search. Performance is inversely proportional to the number of\n\
      // unique nested structures.\n\
      if (aStack[length] == a) return bStack[length] == b;\n\
    }\n\
    // Objects with different constructors are not equivalent, but `Object`s\n\
    // from different frames are.\n\
    var aCtor = a.constructor, bCtor = b.constructor;\n\
    if (aCtor !== bCtor && !(_.isFunction(aCtor) && (aCtor instanceof aCtor) &&\n\
                             _.isFunction(bCtor) && (bCtor instanceof bCtor))\n\
                        && ('constructor' in a && 'constructor' in b)) {\n\
      return false;\n\
    }\n\
    // Add the first object to the stack of traversed objects.\n\
    aStack.push(a);\n\
    bStack.push(b);\n\
    var size = 0, result = true;\n\
    // Recursively compare objects and arrays.\n\
    if (className == '[object Array]') {\n\
      // Compare array lengths to determine if a deep comparison is necessary.\n\
      size = a.length;\n\
      result = size == b.length;\n\
      if (result) {\n\
        // Deep compare the contents, ignoring non-numeric properties.\n\
        while (size--) {\n\
          if (!(result = eq(a[size], b[size], aStack, bStack))) break;\n\
        }\n\
      }\n\
    } else {\n\
      // Deep compare objects.\n\
      for (var key in a) {\n\
        if (_.has(a, key)) {\n\
          // Count the expected number of properties.\n\
          size++;\n\
          // Deep compare each member.\n\
          if (!(result = _.has(b, key) && eq(a[key], b[key], aStack, bStack))) break;\n\
        }\n\
      }\n\
      // Ensure that both objects contain the same number of properties.\n\
      if (result) {\n\
        for (key in b) {\n\
          if (_.has(b, key) && !(size--)) break;\n\
        }\n\
        result = !size;\n\
      }\n\
    }\n\
    // Remove the first object from the stack of traversed objects.\n\
    aStack.pop();\n\
    bStack.pop();\n\
    return result;\n\
  };\n\
\n\
  // Perform a deep comparison to check if two objects are equal.\n\
  _.isEqual = function(a, b) {\n\
    return eq(a, b, [], []);\n\
  };\n\
\n\
  // Is a given array, string, or object empty?\n\
  // An \"empty\" object has no enumerable own-properties.\n\
  _.isEmpty = function(obj) {\n\
    if (obj == null) return true;\n\
    if (_.isArray(obj) || _.isString(obj)) return obj.length === 0;\n\
    for (var key in obj) if (_.has(obj, key)) return false;\n\
    return true;\n\
  };\n\
\n\
  // Is a given value a DOM element?\n\
  _.isElement = function(obj) {\n\
    return !!(obj && obj.nodeType === 1);\n\
  };\n\
\n\
  // Is a given value an array?\n\
  // Delegates to ECMA5's native Array.isArray\n\
  _.isArray = nativeIsArray || function(obj) {\n\
    return toString.call(obj) == '[object Array]';\n\
  };\n\
\n\
  // Is a given variable an object?\n\
  _.isObject = function(obj) {\n\
    return obj === Object(obj);\n\
  };\n\
\n\
  // Add some isType methods: isArguments, isFunction, isString, isNumber, isDate, isRegExp.\n\
  each(['Arguments', 'Function', 'String', 'Number', 'Date', 'RegExp'], function(name) {\n\
    _['is' + name] = function(obj) {\n\
      return toString.call(obj) == '[object ' + name + ']';\n\
    };\n\
  });\n\
\n\
  // Define a fallback version of the method in browsers (ahem, IE), where\n\
  // there isn't any inspectable \"Arguments\" type.\n\
  if (!_.isArguments(arguments)) {\n\
    _.isArguments = function(obj) {\n\
      return !!(obj && _.has(obj, 'callee'));\n\
    };\n\
  }\n\
\n\
  // Optimize `isFunction` if appropriate.\n\
  if (typeof (/./) !== 'function') {\n\
    _.isFunction = function(obj) {\n\
      return typeof obj === 'function';\n\
    };\n\
  }\n\
\n\
  // Is a given object a finite number?\n\
  _.isFinite = function(obj) {\n\
    return isFinite(obj) && !isNaN(parseFloat(obj));\n\
  };\n\
\n\
  // Is the given value `NaN`? (NaN is the only number which does not equal itself).\n\
  _.isNaN = function(obj) {\n\
    return _.isNumber(obj) && obj != +obj;\n\
  };\n\
\n\
  // Is a given value a boolean?\n\
  _.isBoolean = function(obj) {\n\
    return obj === true || obj === false || toString.call(obj) == '[object Boolean]';\n\
  };\n\
\n\
  // Is a given value equal to null?\n\
  _.isNull = function(obj) {\n\
    return obj === null;\n\
  };\n\
\n\
  // Is a given variable undefined?\n\
  _.isUndefined = function(obj) {\n\
    return obj === void 0;\n\
  };\n\
\n\
  // Shortcut function for checking if an object has a given property directly\n\
  // on itself (in other words, not on a prototype).\n\
  _.has = function(obj, key) {\n\
    return hasOwnProperty.call(obj, key);\n\
  };\n\
\n\
  // Utility Functions\n\
  // -----------------\n\
\n\
  // Run Underscore.js in *noConflict* mode, returning the `_` variable to its\n\
  // previous owner. Returns a reference to the Underscore object.\n\
  _.noConflict = function() {\n\
    root._ = previousUnderscore;\n\
    return this;\n\
  };\n\
\n\
  // Keep the identity function around for default iterators.\n\
  _.identity = function(value) {\n\
    return value;\n\
  };\n\
\n\
  _.constant = function(value) {\n\
    return function () {\n\
      return value;\n\
    };\n\
  };\n\
\n\
  _.property = function(key) {\n\
    return function(obj) {\n\
      return obj[key];\n\
    };\n\
  };\n\
\n\
  // Returns a predicate for checking whether an object has a given set of `key:value` pairs.\n\
  _.matches = function(attrs) {\n\
    return function(obj) {\n\
      if (obj === attrs) return true; //avoid comparing an object to itself.\n\
      for (var key in attrs) {\n\
        if (attrs[key] !== obj[key])\n\
          return false;\n\
      }\n\
      return true;\n\
    }\n\
  };\n\
\n\
  // Run a function **n** times.\n\
  _.times = function(n, iterator, context) {\n\
    var accum = Array(Math.max(0, n));\n\
    for (var i = 0; i < n; i++) accum[i] = iterator.call(context, i);\n\
    return accum;\n\
  };\n\
\n\
  // Return a random integer between min and max (inclusive).\n\
  _.random = function(min, max) {\n\
    if (max == null) {\n\
      max = min;\n\
      min = 0;\n\
    }\n\
    return min + Math.floor(Math.random() * (max - min + 1));\n\
  };\n\
\n\
  // A (possibly faster) way to get the current timestamp as an integer.\n\
  _.now = Date.now || function() { return new Date().getTime(); };\n\
\n\
  // List of HTML entities for escaping.\n\
  var entityMap = {\n\
    escape: {\n\
      '&': '&amp;',\n\
      '<': '&lt;',\n\
      '>': '&gt;',\n\
      '\"': '&quot;',\n\
      \"'\": '&#x27;'\n\
    }\n\
  };\n\
  entityMap.unescape = _.invert(entityMap.escape);\n\
\n\
  // Regexes containing the keys and values listed immediately above.\n\
  var entityRegexes = {\n\
    escape:   new RegExp('[' + _.keys(entityMap.escape).join('') + ']', 'g'),\n\
    unescape: new RegExp('(' + _.keys(entityMap.unescape).join('|') + ')', 'g')\n\
  };\n\
\n\
  // Functions for escaping and unescaping strings to/from HTML interpolation.\n\
  _.each(['escape', 'unescape'], function(method) {\n\
    _[method] = function(string) {\n\
      if (string == null) return '';\n\
      return ('' + string).replace(entityRegexes[method], function(match) {\n\
        return entityMap[method][match];\n\
      });\n\
    };\n\
  });\n\
\n\
  // If the value of the named `property` is a function then invoke it with the\n\
  // `object` as context; otherwise, return it.\n\
  _.result = function(object, property) {\n\
    if (object == null) return void 0;\n\
    var value = object[property];\n\
    return _.isFunction(value) ? value.call(object) : value;\n\
  };\n\
\n\
  // Add your own custom functions to the Underscore object.\n\
  _.mixin = function(obj) {\n\
    each(_.functions(obj), function(name) {\n\
      var func = _[name] = obj[name];\n\
      _.prototype[name] = function() {\n\
        var args = [this._wrapped];\n\
        push.apply(args, arguments);\n\
        return result.call(this, func.apply(_, args));\n\
      };\n\
    });\n\
  };\n\
\n\
  // Generate a unique integer id (unique within the entire client session).\n\
  // Useful for temporary DOM ids.\n\
  var idCounter = 0;\n\
  _.uniqueId = function(prefix) {\n\
    var id = ++idCounter + '';\n\
    return prefix ? prefix + id : id;\n\
  };\n\
\n\
  // By default, Underscore uses ERB-style template delimiters, change the\n\
  // following template settings to use alternative delimiters.\n\
  _.templateSettings = {\n\
    evaluate    : /<%([\\s\\S]+?)%>/g,\n\
    interpolate : /<%=([\\s\\S]+?)%>/g,\n\
    escape      : /<%-([\\s\\S]+?)%>/g\n\
  };\n\
\n\
  // When customizing `templateSettings`, if you don't want to define an\n\
  // interpolation, evaluation or escaping regex, we need one that is\n\
  // guaranteed not to match.\n\
  var noMatch = /(.)^/;\n\
\n\
  // Certain characters need to be escaped so that they can be put into a\n\
  // string literal.\n\
  var escapes = {\n\
    \"'\":      \"'\",\n\
    '\\\\':     '\\\\',\n\
    '\\r':     'r',\n\
    '\\n\
':     'n',\n\
    '\\t':     't',\n\
    '\\u2028': 'u2028',\n\
    '\\u2029': 'u2029'\n\
  };\n\
\n\
  var escaper = /\\\\|'|\\r|\\n\
|\\t|\\u2028|\\u2029/g;\n\
\n\
  // JavaScript micro-templating, similar to John Resig's implementation.\n\
  // Underscore templating handles arbitrary delimiters, preserves whitespace,\n\
  // and correctly escapes quotes within interpolated code.\n\
  _.template = function(text, data, settings) {\n\
    var render;\n\
    settings = _.defaults({}, settings, _.templateSettings);\n\
\n\
    // Combine delimiters into one regular expression via alternation.\n\
    var matcher = new RegExp([\n\
      (settings.escape || noMatch).source,\n\
      (settings.interpolate || noMatch).source,\n\
      (settings.evaluate || noMatch).source\n\
    ].join('|') + '|$', 'g');\n\
\n\
    // Compile the template source, escaping string literals appropriately.\n\
    var index = 0;\n\
    var source = \"__p+='\";\n\
    text.replace(matcher, function(match, escape, interpolate, evaluate, offset) {\n\
      source += text.slice(index, offset)\n\
        .replace(escaper, function(match) { return '\\\\' + escapes[match]; });\n\
\n\
      if (escape) {\n\
        source += \"'+\\n\
((__t=(\" + escape + \"))==null?'':_.escape(__t))+\\n\
'\";\n\
      }\n\
      if (interpolate) {\n\
        source += \"'+\\n\
((__t=(\" + interpolate + \"))==null?'':__t)+\\n\
'\";\n\
      }\n\
      if (evaluate) {\n\
        source += \"';\\n\
\" + evaluate + \"\\n\
__p+='\";\n\
      }\n\
      index = offset + match.length;\n\
      return match;\n\
    });\n\
    source += \"';\\n\
\";\n\
\n\
    // If a variable is not specified, place data values in local scope.\n\
    if (!settings.variable) source = 'with(obj||{}){\\n\
' + source + '}\\n\
';\n\
\n\
    source = \"var __t,__p='',__j=Array.prototype.join,\" +\n\
      \"print=function(){__p+=__j.call(arguments,'');};\\n\
\" +\n\
      source + \"return __p;\\n\
\";\n\
\n\
    try {\n\
      render = new Function(settings.variable || 'obj', '_', source);\n\
    } catch (e) {\n\
      e.source = source;\n\
      throw e;\n\
    }\n\
\n\
    if (data) return render(data, _);\n\
    var template = function(data) {\n\
      return render.call(this, data, _);\n\
    };\n\
\n\
    // Provide the compiled function source as a convenience for precompilation.\n\
    template.source = 'function(' + (settings.variable || 'obj') + '){\\n\
' + source + '}';\n\
\n\
    return template;\n\
  };\n\
\n\
  // Add a \"chain\" function, which will delegate to the wrapper.\n\
  _.chain = function(obj) {\n\
    return _(obj).chain();\n\
  };\n\
\n\
  // OOP\n\
  // ---------------\n\
  // If Underscore is called as a function, it returns a wrapped object that\n\
  // can be used OO-style. This wrapper holds altered versions of all the\n\
  // underscore functions. Wrapped objects may be chained.\n\
\n\
  // Helper function to continue chaining intermediate results.\n\
  var result = function(obj) {\n\
    return this._chain ? _(obj).chain() : obj;\n\
  };\n\
\n\
  // Add all of the Underscore functions to the wrapper object.\n\
  _.mixin(_);\n\
\n\
  // Add all mutator Array functions to the wrapper.\n\
  each(['pop', 'push', 'reverse', 'shift', 'sort', 'splice', 'unshift'], function(name) {\n\
    var method = ArrayProto[name];\n\
    _.prototype[name] = function() {\n\
      var obj = this._wrapped;\n\
      method.apply(obj, arguments);\n\
      if ((name == 'shift' || name == 'splice') && obj.length === 0) delete obj[0];\n\
      return result.call(this, obj);\n\
    };\n\
  });\n\
\n\
  // Add all accessor Array functions to the wrapper.\n\
  each(['concat', 'join', 'slice'], function(name) {\n\
    var method = ArrayProto[name];\n\
    _.prototype[name] = function() {\n\
      return result.call(this, method.apply(this._wrapped, arguments));\n\
    };\n\
  });\n\
\n\
  _.extend(_.prototype, {\n\
\n\
    // Start chaining a wrapped Underscore object.\n\
    chain: function() {\n\
      this._chain = true;\n\
      return this;\n\
    },\n\
\n\
    // Extracts the result from a wrapped and chained object.\n\
    value: function() {\n\
      return this._wrapped;\n\
    }\n\
\n\
  });\n\
\n\
  // AMD registration happens at the end for compatibility with AMD loaders\n\
  // that may not enforce next-turn semantics on modules. Even though general\n\
  // practice for AMD registration is to be anonymous, underscore registers\n\
  // as a named module because, like jQuery, it is a base library that is\n\
  // popular enough to be bundled in a third party lib, but not be part of\n\
  // an AMD load request. Those cases could generate an error when an\n\
  // anonymous define() is called outside of a loader request.\n\
  if (typeof define === 'function' && define.amd) {\n\
    define('underscore', [], function() {\n\
      return _;\n\
    });\n\
  }\n\
}).call(this);\n\
//@ sourceURL=jashkenas-underscore/underscore.js"
));
require.register("jashkenas-underscore/underscore-min.js", Function("exports, require, module",
"//     Underscore.js 1.6.0\n\
//     http://underscorejs.org\n\
//     (c) 2009-2014 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors\n\
//     Underscore may be freely distributed under the MIT license.\n\
(function(){var n=this,t=n._,r={},e=Array.prototype,u=Object.prototype,i=Function.prototype,a=e.push,o=e.slice,c=e.concat,l=u.toString,f=u.hasOwnProperty,s=e.forEach,p=e.map,h=e.reduce,v=e.reduceRight,g=e.filter,d=e.every,m=e.some,y=e.indexOf,b=e.lastIndexOf,x=Array.isArray,w=Object.keys,_=i.bind,j=function(n){return n instanceof j?n:this instanceof j?void(this._wrapped=n):new j(n)};\"undefined\"!=typeof exports?(\"undefined\"!=typeof module&&module.exports&&(exports=module.exports=j),exports._=j):n._=j,j.VERSION=\"1.6.0\";var A=j.each=j.forEach=function(n,t,e){if(null==n)return n;if(s&&n.forEach===s)n.forEach(t,e);else if(n.length===+n.length){for(var u=0,i=n.length;i>u;u++)if(t.call(e,n[u],u,n)===r)return}else for(var a=j.keys(n),u=0,i=a.length;i>u;u++)if(t.call(e,n[a[u]],a[u],n)===r)return;return n};j.map=j.collect=function(n,t,r){var e=[];return null==n?e:p&&n.map===p?n.map(t,r):(A(n,function(n,u,i){e.push(t.call(r,n,u,i))}),e)};var O=\"Reduce of empty array with no initial value\";j.reduce=j.foldl=j.inject=function(n,t,r,e){var u=arguments.length>2;if(null==n&&(n=[]),h&&n.reduce===h)return e&&(t=j.bind(t,e)),u?n.reduce(t,r):n.reduce(t);if(A(n,function(n,i,a){u?r=t.call(e,r,n,i,a):(r=n,u=!0)}),!u)throw new TypeError(O);return r},j.reduceRight=j.foldr=function(n,t,r,e){var u=arguments.length>2;if(null==n&&(n=[]),v&&n.reduceRight===v)return e&&(t=j.bind(t,e)),u?n.reduceRight(t,r):n.reduceRight(t);var i=n.length;if(i!==+i){var a=j.keys(n);i=a.length}if(A(n,function(o,c,l){c=a?a[--i]:--i,u?r=t.call(e,r,n[c],c,l):(r=n[c],u=!0)}),!u)throw new TypeError(O);return r},j.find=j.detect=function(n,t,r){var e;return k(n,function(n,u,i){return t.call(r,n,u,i)?(e=n,!0):void 0}),e},j.filter=j.select=function(n,t,r){var e=[];return null==n?e:g&&n.filter===g?n.filter(t,r):(A(n,function(n,u,i){t.call(r,n,u,i)&&e.push(n)}),e)},j.reject=function(n,t,r){return j.filter(n,function(n,e,u){return!t.call(r,n,e,u)},r)},j.every=j.all=function(n,t,e){t||(t=j.identity);var u=!0;return null==n?u:d&&n.every===d?n.every(t,e):(A(n,function(n,i,a){return(u=u&&t.call(e,n,i,a))?void 0:r}),!!u)};var k=j.some=j.any=function(n,t,e){t||(t=j.identity);var u=!1;return null==n?u:m&&n.some===m?n.some(t,e):(A(n,function(n,i,a){return u||(u=t.call(e,n,i,a))?r:void 0}),!!u)};j.contains=j.include=function(n,t){return null==n?!1:y&&n.indexOf===y?n.indexOf(t)!=-1:k(n,function(n){return n===t})},j.invoke=function(n,t){var r=o.call(arguments,2),e=j.isFunction(t);return j.map(n,function(n){return(e?t:n[t]).apply(n,r)})},j.pluck=function(n,t){return j.map(n,j.property(t))},j.where=function(n,t){return j.filter(n,j.matches(t))},j.findWhere=function(n,t){return j.find(n,j.matches(t))},j.max=function(n,t,r){if(!t&&j.isArray(n)&&n[0]===+n[0]&&n.length<65535)return Math.max.apply(Math,n);var e=-1/0,u=-1/0;return A(n,function(n,i,a){var o=t?t.call(r,n,i,a):n;o>u&&(e=n,u=o)}),e},j.min=function(n,t,r){if(!t&&j.isArray(n)&&n[0]===+n[0]&&n.length<65535)return Math.min.apply(Math,n);var e=1/0,u=1/0;return A(n,function(n,i,a){var o=t?t.call(r,n,i,a):n;u>o&&(e=n,u=o)}),e},j.shuffle=function(n){var t,r=0,e=[];return A(n,function(n){t=j.random(r++),e[r-1]=e[t],e[t]=n}),e},j.sample=function(n,t,r){return null==t||r?(n.length!==+n.length&&(n=j.values(n)),n[j.random(n.length-1)]):j.shuffle(n).slice(0,Math.max(0,t))};var E=function(n){return null==n?j.identity:j.isFunction(n)?n:j.property(n)};j.sortBy=function(n,t,r){return t=E(t),j.pluck(j.map(n,function(n,e,u){return{value:n,index:e,criteria:t.call(r,n,e,u)}}).sort(function(n,t){var r=n.criteria,e=t.criteria;if(r!==e){if(r>e||r===void 0)return 1;if(e>r||e===void 0)return-1}return n.index-t.index}),\"value\")};var F=function(n){return function(t,r,e){var u={};return r=E(r),A(t,function(i,a){var o=r.call(e,i,a,t);n(u,o,i)}),u}};j.groupBy=F(function(n,t,r){j.has(n,t)?n[t].push(r):n[t]=[r]}),j.indexBy=F(function(n,t,r){n[t]=r}),j.countBy=F(function(n,t){j.has(n,t)?n[t]++:n[t]=1}),j.sortedIndex=function(n,t,r,e){r=E(r);for(var u=r.call(e,t),i=0,a=n.length;a>i;){var o=i+a>>>1;r.call(e,n[o])<u?i=o+1:a=o}return i},j.toArray=function(n){return n?j.isArray(n)?o.call(n):n.length===+n.length?j.map(n,j.identity):j.values(n):[]},j.size=function(n){return null==n?0:n.length===+n.length?n.length:j.keys(n).length},j.first=j.head=j.take=function(n,t,r){return null==n?void 0:null==t||r?n[0]:0>t?[]:o.call(n,0,t)},j.initial=function(n,t,r){return o.call(n,0,n.length-(null==t||r?1:t))},j.last=function(n,t,r){return null==n?void 0:null==t||r?n[n.length-1]:o.call(n,Math.max(n.length-t,0))},j.rest=j.tail=j.drop=function(n,t,r){return o.call(n,null==t||r?1:t)},j.compact=function(n){return j.filter(n,j.identity)};var M=function(n,t,r){return t&&j.every(n,j.isArray)?c.apply(r,n):(A(n,function(n){j.isArray(n)||j.isArguments(n)?t?a.apply(r,n):M(n,t,r):r.push(n)}),r)};j.flatten=function(n,t){return M(n,t,[])},j.without=function(n){return j.difference(n,o.call(arguments,1))},j.partition=function(n,t){var r=[],e=[];return A(n,function(n){(t(n)?r:e).push(n)}),[r,e]},j.uniq=j.unique=function(n,t,r,e){j.isFunction(t)&&(e=r,r=t,t=!1);var u=r?j.map(n,r,e):n,i=[],a=[];return A(u,function(r,e){(t?e&&a[a.length-1]===r:j.contains(a,r))||(a.push(r),i.push(n[e]))}),i},j.union=function(){return j.uniq(j.flatten(arguments,!0))},j.intersection=function(n){var t=o.call(arguments,1);return j.filter(j.uniq(n),function(n){return j.every(t,function(t){return j.contains(t,n)})})},j.difference=function(n){var t=c.apply(e,o.call(arguments,1));return j.filter(n,function(n){return!j.contains(t,n)})},j.zip=function(){for(var n=j.max(j.pluck(arguments,\"length\").concat(0)),t=new Array(n),r=0;n>r;r++)t[r]=j.pluck(arguments,\"\"+r);return t},j.object=function(n,t){if(null==n)return{};for(var r={},e=0,u=n.length;u>e;e++)t?r[n[e]]=t[e]:r[n[e][0]]=n[e][1];return r},j.indexOf=function(n,t,r){if(null==n)return-1;var e=0,u=n.length;if(r){if(\"number\"!=typeof r)return e=j.sortedIndex(n,t),n[e]===t?e:-1;e=0>r?Math.max(0,u+r):r}if(y&&n.indexOf===y)return n.indexOf(t,r);for(;u>e;e++)if(n[e]===t)return e;return-1},j.lastIndexOf=function(n,t,r){if(null==n)return-1;var e=null!=r;if(b&&n.lastIndexOf===b)return e?n.lastIndexOf(t,r):n.lastIndexOf(t);for(var u=e?r:n.length;u--;)if(n[u]===t)return u;return-1},j.range=function(n,t,r){arguments.length<=1&&(t=n||0,n=0),r=arguments[2]||1;for(var e=Math.max(Math.ceil((t-n)/r),0),u=0,i=new Array(e);e>u;)i[u++]=n,n+=r;return i};var R=function(){};j.bind=function(n,t){var r,e;if(_&&n.bind===_)return _.apply(n,o.call(arguments,1));if(!j.isFunction(n))throw new TypeError;return r=o.call(arguments,2),e=function(){if(!(this instanceof e))return n.apply(t,r.concat(o.call(arguments)));R.prototype=n.prototype;var u=new R;R.prototype=null;var i=n.apply(u,r.concat(o.call(arguments)));return Object(i)===i?i:u}},j.partial=function(n){var t=o.call(arguments,1);return function(){for(var r=0,e=t.slice(),u=0,i=e.length;i>u;u++)e[u]===j&&(e[u]=arguments[r++]);for(;r<arguments.length;)e.push(arguments[r++]);return n.apply(this,e)}},j.bindAll=function(n){var t=o.call(arguments,1);if(0===t.length)throw new Error(\"bindAll must be passed function names\");return A(t,function(t){n[t]=j.bind(n[t],n)}),n},j.memoize=function(n,t){var r={};return t||(t=j.identity),function(){var e=t.apply(this,arguments);return j.has(r,e)?r[e]:r[e]=n.apply(this,arguments)}},j.delay=function(n,t){var r=o.call(arguments,2);return setTimeout(function(){return n.apply(null,r)},t)},j.defer=function(n){return j.delay.apply(j,[n,1].concat(o.call(arguments,1)))},j.throttle=function(n,t,r){var e,u,i,a=null,o=0;r||(r={});var c=function(){o=r.leading===!1?0:j.now(),a=null,i=n.apply(e,u),e=u=null};return function(){var l=j.now();o||r.leading!==!1||(o=l);var f=t-(l-o);return e=this,u=arguments,0>=f?(clearTimeout(a),a=null,o=l,i=n.apply(e,u),e=u=null):a||r.trailing===!1||(a=setTimeout(c,f)),i}},j.debounce=function(n,t,r){var e,u,i,a,o,c=function(){var l=j.now()-a;t>l?e=setTimeout(c,t-l):(e=null,r||(o=n.apply(i,u),i=u=null))};return function(){i=this,u=arguments,a=j.now();var l=r&&!e;return e||(e=setTimeout(c,t)),l&&(o=n.apply(i,u),i=u=null),o}},j.once=function(n){var t,r=!1;return function(){return r?t:(r=!0,t=n.apply(this,arguments),n=null,t)}},j.wrap=function(n,t){return j.partial(t,n)},j.compose=function(){var n=arguments;return function(){for(var t=arguments,r=n.length-1;r>=0;r--)t=[n[r].apply(this,t)];return t[0]}},j.after=function(n,t){return function(){return--n<1?t.apply(this,arguments):void 0}},j.keys=function(n){if(!j.isObject(n))return[];if(w)return w(n);var t=[];for(var r in n)j.has(n,r)&&t.push(r);return t},j.values=function(n){for(var t=j.keys(n),r=t.length,e=new Array(r),u=0;r>u;u++)e[u]=n[t[u]];return e},j.pairs=function(n){for(var t=j.keys(n),r=t.length,e=new Array(r),u=0;r>u;u++)e[u]=[t[u],n[t[u]]];return e},j.invert=function(n){for(var t={},r=j.keys(n),e=0,u=r.length;u>e;e++)t[n[r[e]]]=r[e];return t},j.functions=j.methods=function(n){var t=[];for(var r in n)j.isFunction(n[r])&&t.push(r);return t.sort()},j.extend=function(n){return A(o.call(arguments,1),function(t){if(t)for(var r in t)n[r]=t[r]}),n},j.pick=function(n){var t={},r=c.apply(e,o.call(arguments,1));return A(r,function(r){r in n&&(t[r]=n[r])}),t},j.omit=function(n){var t={},r=c.apply(e,o.call(arguments,1));for(var u in n)j.contains(r,u)||(t[u]=n[u]);return t},j.defaults=function(n){return A(o.call(arguments,1),function(t){if(t)for(var r in t)n[r]===void 0&&(n[r]=t[r])}),n},j.clone=function(n){return j.isObject(n)?j.isArray(n)?n.slice():j.extend({},n):n},j.tap=function(n,t){return t(n),n};var S=function(n,t,r,e){if(n===t)return 0!==n||1/n==1/t;if(null==n||null==t)return n===t;n instanceof j&&(n=n._wrapped),t instanceof j&&(t=t._wrapped);var u=l.call(n);if(u!=l.call(t))return!1;switch(u){case\"[object String]\":return n==String(t);case\"[object Number]\":return n!=+n?t!=+t:0==n?1/n==1/t:n==+t;case\"[object Date]\":case\"[object Boolean]\":return+n==+t;case\"[object RegExp]\":return n.source==t.source&&n.global==t.global&&n.multiline==t.multiline&&n.ignoreCase==t.ignoreCase}if(\"object\"!=typeof n||\"object\"!=typeof t)return!1;for(var i=r.length;i--;)if(r[i]==n)return e[i]==t;var a=n.constructor,o=t.constructor;if(a!==o&&!(j.isFunction(a)&&a instanceof a&&j.isFunction(o)&&o instanceof o)&&\"constructor\"in n&&\"constructor\"in t)return!1;r.push(n),e.push(t);var c=0,f=!0;if(\"[object Array]\"==u){if(c=n.length,f=c==t.length)for(;c--&&(f=S(n[c],t[c],r,e)););}else{for(var s in n)if(j.has(n,s)&&(c++,!(f=j.has(t,s)&&S(n[s],t[s],r,e))))break;if(f){for(s in t)if(j.has(t,s)&&!c--)break;f=!c}}return r.pop(),e.pop(),f};j.isEqual=function(n,t){return S(n,t,[],[])},j.isEmpty=function(n){if(null==n)return!0;if(j.isArray(n)||j.isString(n))return 0===n.length;for(var t in n)if(j.has(n,t))return!1;return!0},j.isElement=function(n){return!(!n||1!==n.nodeType)},j.isArray=x||function(n){return\"[object Array]\"==l.call(n)},j.isObject=function(n){return n===Object(n)},A([\"Arguments\",\"Function\",\"String\",\"Number\",\"Date\",\"RegExp\"],function(n){j[\"is\"+n]=function(t){return l.call(t)==\"[object \"+n+\"]\"}}),j.isArguments(arguments)||(j.isArguments=function(n){return!(!n||!j.has(n,\"callee\"))}),\"function\"!=typeof/./&&(j.isFunction=function(n){return\"function\"==typeof n}),j.isFinite=function(n){return isFinite(n)&&!isNaN(parseFloat(n))},j.isNaN=function(n){return j.isNumber(n)&&n!=+n},j.isBoolean=function(n){return n===!0||n===!1||\"[object Boolean]\"==l.call(n)},j.isNull=function(n){return null===n},j.isUndefined=function(n){return n===void 0},j.has=function(n,t){return f.call(n,t)},j.noConflict=function(){return n._=t,this},j.identity=function(n){return n},j.constant=function(n){return function(){return n}},j.property=function(n){return function(t){return t[n]}},j.matches=function(n){return function(t){if(t===n)return!0;for(var r in n)if(n[r]!==t[r])return!1;return!0}},j.times=function(n,t,r){for(var e=Array(Math.max(0,n)),u=0;n>u;u++)e[u]=t.call(r,u);return e},j.random=function(n,t){return null==t&&(t=n,n=0),n+Math.floor(Math.random()*(t-n+1))},j.now=Date.now||function(){return(new Date).getTime()};var T={escape:{\"&\":\"&amp;\",\"<\":\"&lt;\",\">\":\"&gt;\",'\"':\"&quot;\",\"'\":\"&#x27;\"}};T.unescape=j.invert(T.escape);var I={escape:new RegExp(\"[\"+j.keys(T.escape).join(\"\")+\"]\",\"g\"),unescape:new RegExp(\"(\"+j.keys(T.unescape).join(\"|\")+\")\",\"g\")};j.each([\"escape\",\"unescape\"],function(n){j[n]=function(t){return null==t?\"\":(\"\"+t).replace(I[n],function(t){return T[n][t]})}}),j.result=function(n,t){if(null==n)return void 0;var r=n[t];return j.isFunction(r)?r.call(n):r},j.mixin=function(n){A(j.functions(n),function(t){var r=j[t]=n[t];j.prototype[t]=function(){var n=[this._wrapped];return a.apply(n,arguments),z.call(this,r.apply(j,n))}})};var N=0;j.uniqueId=function(n){var t=++N+\"\";return n?n+t:t},j.templateSettings={evaluate:/<%([\\s\\S]+?)%>/g,interpolate:/<%=([\\s\\S]+?)%>/g,escape:/<%-([\\s\\S]+?)%>/g};var q=/(.)^/,B={\"'\":\"'\",\"\\\\\":\"\\\\\",\"\\r\":\"r\",\"\\n\
\":\"n\",\"\t\":\"t\",\"\\u2028\":\"u2028\",\"\\u2029\":\"u2029\"},D=/\\\\|'|\\r|\\n\
|\\t|\\u2028|\\u2029/g;j.template=function(n,t,r){var e;r=j.defaults({},r,j.templateSettings);var u=new RegExp([(r.escape||q).source,(r.interpolate||q).source,(r.evaluate||q).source].join(\"|\")+\"|$\",\"g\"),i=0,a=\"__p+='\";n.replace(u,function(t,r,e,u,o){return a+=n.slice(i,o).replace(D,function(n){return\"\\\\\"+B[n]}),r&&(a+=\"'+\\n\
((__t=(\"+r+\"))==null?'':_.escape(__t))+\\n\
'\"),e&&(a+=\"'+\\n\
((__t=(\"+e+\"))==null?'':__t)+\\n\
'\"),u&&(a+=\"';\\n\
\"+u+\"\\n\
__p+='\"),i=o+t.length,t}),a+=\"';\\n\
\",r.variable||(a=\"with(obj||{}){\\n\
\"+a+\"}\\n\
\"),a=\"var __t,__p='',__j=Array.prototype.join,\"+\"print=function(){__p+=__j.call(arguments,'');};\\n\
\"+a+\"return __p;\\n\
\";try{e=new Function(r.variable||\"obj\",\"_\",a)}catch(o){throw o.source=a,o}if(t)return e(t,j);var c=function(n){return e.call(this,n,j)};return c.source=\"function(\"+(r.variable||\"obj\")+\"){\\n\
\"+a+\"}\",c},j.chain=function(n){return j(n).chain()};var z=function(n){return this._chain?j(n).chain():n};j.mixin(j),A([\"pop\",\"push\",\"reverse\",\"shift\",\"sort\",\"splice\",\"unshift\"],function(n){var t=e[n];j.prototype[n]=function(){var r=this._wrapped;return t.apply(r,arguments),\"shift\"!=n&&\"splice\"!=n||0!==r.length||delete r[0],z.call(this,r)}}),A([\"concat\",\"join\",\"slice\"],function(n){var t=e[n];j.prototype[n]=function(){return z.call(this,t.apply(this._wrapped,arguments))}}),j.extend(j.prototype,{chain:function(){return this._chain=!0,this},value:function(){return this._wrapped}}),\"function\"==typeof define&&define.amd&&define(\"underscore\",[],function(){return j})}).call(this);\n\
//# sourceMappingURL=underscore-min.map//@ sourceURL=jashkenas-underscore/underscore-min.js"
));
require.register("jashkenas-backbone/backbone.js", Function("exports, require, module",
"//     Backbone.js 1.1.1\n\
\n\
//     (c) 2010-2014 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors\n\
//     Backbone may be freely distributed under the MIT license.\n\
//     For all details and documentation:\n\
//     http://backbonejs.org\n\
\n\
(function(root, factory) {\n\
\n\
  // Set up Backbone appropriately for the environment. Start with AMD.\n\
  if (typeof define === 'function' && define.amd) {\n\
    define(['underscore', 'jquery', 'exports'], function(_, $, exports) {\n\
      // Export global even in AMD case in case this script is loaded with\n\
      // others that may still expect a global Backbone.\n\
      root.Backbone = factory(root, exports, _, $);\n\
    });\n\
\n\
  // Next for Node.js or CommonJS. jQuery may not be needed as a module.\n\
  } else if (typeof exports !== 'undefined') {\n\
    var _ = require('underscore');\n\
    factory(root, exports, _);\n\
\n\
  // Finally, as a browser global.\n\
  } else {\n\
    root.Backbone = factory(root, {}, root._, (root.jQuery || root.Zepto || root.ender || root.$));\n\
  }\n\
\n\
}(this, function(root, Backbone, _, $) {\n\
\n\
  // Initial Setup\n\
  // -------------\n\
\n\
  // Save the previous value of the `Backbone` variable, so that it can be\n\
  // restored later on, if `noConflict` is used.\n\
  var previousBackbone = root.Backbone;\n\
\n\
  // Create local references to array methods we'll want to use later.\n\
  var array = [];\n\
  var push = array.push;\n\
  var slice = array.slice;\n\
  var splice = array.splice;\n\
\n\
  // Current version of the library. Keep in sync with `package.json`.\n\
  Backbone.VERSION = '1.1.1';\n\
\n\
  // For Backbone's purposes, jQuery, Zepto, Ender, or My Library (kidding) owns\n\
  // the `$` variable.\n\
  Backbone.$ = $;\n\
\n\
  // Runs Backbone.js in *noConflict* mode, returning the `Backbone` variable\n\
  // to its previous owner. Returns a reference to this Backbone object.\n\
  Backbone.noConflict = function() {\n\
    root.Backbone = previousBackbone;\n\
    return this;\n\
  };\n\
\n\
  // Turn on `emulateHTTP` to support legacy HTTP servers. Setting this option\n\
  // will fake `\"PATCH\"`, `\"PUT\"` and `\"DELETE\"` requests via the `_method` parameter and\n\
  // set a `X-Http-Method-Override` header.\n\
  Backbone.emulateHTTP = false;\n\
\n\
  // Turn on `emulateJSON` to support legacy servers that can't deal with direct\n\
  // `application/json` requests ... will encode the body as\n\
  // `application/x-www-form-urlencoded` instead and will send the model in a\n\
  // form param named `model`.\n\
  Backbone.emulateJSON = false;\n\
\n\
  // Backbone.Events\n\
  // ---------------\n\
\n\
  // A module that can be mixed in to *any object* in order to provide it with\n\
  // custom events. You may bind with `on` or remove with `off` callback\n\
  // functions to an event; `trigger`-ing an event fires all callbacks in\n\
  // succession.\n\
  //\n\
  //     var object = {};\n\
  //     _.extend(object, Backbone.Events);\n\
  //     object.on('expand', function(){ alert('expanded'); });\n\
  //     object.trigger('expand');\n\
  //\n\
  var Events = Backbone.Events = {\n\
\n\
    // Bind an event to a `callback` function. Passing `\"all\"` will bind\n\
    // the callback to all events fired.\n\
    on: function(name, callback, context) {\n\
      if (!eventsApi(this, 'on', name, [callback, context]) || !callback) return this;\n\
      this._events || (this._events = {});\n\
      var events = this._events[name] || (this._events[name] = []);\n\
      events.push({callback: callback, context: context, ctx: context || this});\n\
      return this;\n\
    },\n\
\n\
    // Bind an event to only be triggered a single time. After the first time\n\
    // the callback is invoked, it will be removed.\n\
    once: function(name, callback, context) {\n\
      if (!eventsApi(this, 'once', name, [callback, context]) || !callback) return this;\n\
      var self = this;\n\
      var once = _.once(function() {\n\
        self.off(name, once);\n\
        callback.apply(this, arguments);\n\
      });\n\
      once._callback = callback;\n\
      return this.on(name, once, context);\n\
    },\n\
\n\
    // Remove one or many callbacks. If `context` is null, removes all\n\
    // callbacks with that function. If `callback` is null, removes all\n\
    // callbacks for the event. If `name` is null, removes all bound\n\
    // callbacks for all events.\n\
    off: function(name, callback, context) {\n\
      var retain, ev, events, names, i, l, j, k;\n\
      if (!this._events || !eventsApi(this, 'off', name, [callback, context])) return this;\n\
      if (!name && !callback && !context) {\n\
        this._events = void 0;\n\
        return this;\n\
      }\n\
      names = name ? [name] : _.keys(this._events);\n\
      for (i = 0, l = names.length; i < l; i++) {\n\
        name = names[i];\n\
        if (events = this._events[name]) {\n\
          this._events[name] = retain = [];\n\
          if (callback || context) {\n\
            for (j = 0, k = events.length; j < k; j++) {\n\
              ev = events[j];\n\
              if ((callback && callback !== ev.callback && callback !== ev.callback._callback) ||\n\
                  (context && context !== ev.context)) {\n\
                retain.push(ev);\n\
              }\n\
            }\n\
          }\n\
          if (!retain.length) delete this._events[name];\n\
        }\n\
      }\n\
\n\
      return this;\n\
    },\n\
\n\
    // Trigger one or many events, firing all bound callbacks. Callbacks are\n\
    // passed the same arguments as `trigger` is, apart from the event name\n\
    // (unless you're listening on `\"all\"`, which will cause your callback to\n\
    // receive the true name of the event as the first argument).\n\
    trigger: function(name) {\n\
      if (!this._events) return this;\n\
      var args = slice.call(arguments, 1);\n\
      if (!eventsApi(this, 'trigger', name, args)) return this;\n\
      var events = this._events[name];\n\
      var allEvents = this._events.all;\n\
      if (events) triggerEvents(events, args);\n\
      if (allEvents) triggerEvents(allEvents, arguments);\n\
      return this;\n\
    },\n\
\n\
    // Tell this object to stop listening to either specific events ... or\n\
    // to every object it's currently listening to.\n\
    stopListening: function(obj, name, callback) {\n\
      var listeningTo = this._listeningTo;\n\
      if (!listeningTo) return this;\n\
      var remove = !name && !callback;\n\
      if (!callback && typeof name === 'object') callback = this;\n\
      if (obj) (listeningTo = {})[obj._listenId] = obj;\n\
      for (var id in listeningTo) {\n\
        obj = listeningTo[id];\n\
        obj.off(name, callback, this);\n\
        if (remove || _.isEmpty(obj._events)) delete this._listeningTo[id];\n\
      }\n\
      return this;\n\
    }\n\
\n\
  };\n\
\n\
  // Regular expression used to split event strings.\n\
  var eventSplitter = /\\s+/;\n\
\n\
  // Implement fancy features of the Events API such as multiple event\n\
  // names `\"change blur\"` and jQuery-style event maps `{change: action}`\n\
  // in terms of the existing API.\n\
  var eventsApi = function(obj, action, name, rest) {\n\
    if (!name) return true;\n\
\n\
    // Handle event maps.\n\
    if (typeof name === 'object') {\n\
      for (var key in name) {\n\
        obj[action].apply(obj, [key, name[key]].concat(rest));\n\
      }\n\
      return false;\n\
    }\n\
\n\
    // Handle space separated event names.\n\
    if (eventSplitter.test(name)) {\n\
      var names = name.split(eventSplitter);\n\
      for (var i = 0, l = names.length; i < l; i++) {\n\
        obj[action].apply(obj, [names[i]].concat(rest));\n\
      }\n\
      return false;\n\
    }\n\
\n\
    return true;\n\
  };\n\
\n\
  // A difficult-to-believe, but optimized internal dispatch function for\n\
  // triggering events. Tries to keep the usual cases speedy (most internal\n\
  // Backbone events have 3 arguments).\n\
  var triggerEvents = function(events, args) {\n\
    var ev, i = -1, l = events.length, a1 = args[0], a2 = args[1], a3 = args[2];\n\
    switch (args.length) {\n\
      case 0: while (++i < l) (ev = events[i]).callback.call(ev.ctx); return;\n\
      case 1: while (++i < l) (ev = events[i]).callback.call(ev.ctx, a1); return;\n\
      case 2: while (++i < l) (ev = events[i]).callback.call(ev.ctx, a1, a2); return;\n\
      case 3: while (++i < l) (ev = events[i]).callback.call(ev.ctx, a1, a2, a3); return;\n\
      default: while (++i < l) (ev = events[i]).callback.apply(ev.ctx, args); return;\n\
    }\n\
  };\n\
\n\
  var listenMethods = {listenTo: 'on', listenToOnce: 'once'};\n\
\n\
  // Inversion-of-control versions of `on` and `once`. Tell *this* object to\n\
  // listen to an event in another object ... keeping track of what it's\n\
  // listening to.\n\
  _.each(listenMethods, function(implementation, method) {\n\
    Events[method] = function(obj, name, callback) {\n\
      var listeningTo = this._listeningTo || (this._listeningTo = {});\n\
      var id = obj._listenId || (obj._listenId = _.uniqueId('l'));\n\
      listeningTo[id] = obj;\n\
      if (!callback && typeof name === 'object') callback = this;\n\
      obj[implementation](name, callback, this);\n\
      return this;\n\
    };\n\
  });\n\
\n\
  // Aliases for backwards compatibility.\n\
  Events.bind   = Events.on;\n\
  Events.unbind = Events.off;\n\
\n\
  // Allow the `Backbone` object to serve as a global event bus, for folks who\n\
  // want global \"pubsub\" in a convenient place.\n\
  _.extend(Backbone, Events);\n\
\n\
  // Backbone.Model\n\
  // --------------\n\
\n\
  // Backbone **Models** are the basic data object in the framework --\n\
  // frequently representing a row in a table in a database on your server.\n\
  // A discrete chunk of data and a bunch of useful, related methods for\n\
  // performing computations and transformations on that data.\n\
\n\
  // Create a new model with the specified attributes. A client id (`cid`)\n\
  // is automatically generated and assigned for you.\n\
  var Model = Backbone.Model = function(attributes, options) {\n\
    var attrs = attributes || {};\n\
    options || (options = {});\n\
    this.cid = _.uniqueId('c');\n\
    this.attributes = {};\n\
    if (options.collection) this.collection = options.collection;\n\
    if (options.parse) attrs = this.parse(attrs, options) || {};\n\
    attrs = _.defaults({}, attrs, _.result(this, 'defaults'));\n\
    this.set(attrs, options);\n\
    this.changed = {};\n\
    this.initialize.apply(this, arguments);\n\
  };\n\
\n\
  // Attach all inheritable methods to the Model prototype.\n\
  _.extend(Model.prototype, Events, {\n\
\n\
    // A hash of attributes whose current and previous value differ.\n\
    changed: null,\n\
\n\
    // The value returned during the last failed validation.\n\
    validationError: null,\n\
\n\
    // The default name for the JSON `id` attribute is `\"id\"`. MongoDB and\n\
    // CouchDB users may want to set this to `\"_id\"`.\n\
    idAttribute: 'id',\n\
\n\
    // Initialize is an empty function by default. Override it with your own\n\
    // initialization logic.\n\
    initialize: function(){},\n\
\n\
    // Return a copy of the model's `attributes` object.\n\
    toJSON: function(options) {\n\
      return _.clone(this.attributes);\n\
    },\n\
\n\
    // Proxy `Backbone.sync` by default -- but override this if you need\n\
    // custom syncing semantics for *this* particular model.\n\
    sync: function() {\n\
      return Backbone.sync.apply(this, arguments);\n\
    },\n\
\n\
    // Get the value of an attribute.\n\
    get: function(attr) {\n\
      return this.attributes[attr];\n\
    },\n\
\n\
    // Get the HTML-escaped value of an attribute.\n\
    escape: function(attr) {\n\
      return _.escape(this.get(attr));\n\
    },\n\
\n\
    // Returns `true` if the attribute contains a value that is not null\n\
    // or undefined.\n\
    has: function(attr) {\n\
      return this.get(attr) != null;\n\
    },\n\
\n\
    // Set a hash of model attributes on the object, firing `\"change\"`. This is\n\
    // the core primitive operation of a model, updating the data and notifying\n\
    // anyone who needs to know about the change in state. The heart of the beast.\n\
    set: function(key, val, options) {\n\
      var attr, attrs, unset, changes, silent, changing, prev, current;\n\
      if (key == null) return this;\n\
\n\
      // Handle both `\"key\", value` and `{key: value}` -style arguments.\n\
      if (typeof key === 'object') {\n\
        attrs = key;\n\
        options = val;\n\
      } else {\n\
        (attrs = {})[key] = val;\n\
      }\n\
\n\
      options || (options = {});\n\
\n\
      // Run validation.\n\
      if (!this._validate(attrs, options)) return false;\n\
\n\
      // Extract attributes and options.\n\
      unset           = options.unset;\n\
      silent          = options.silent;\n\
      changes         = [];\n\
      changing        = this._changing;\n\
      this._changing  = true;\n\
\n\
      if (!changing) {\n\
        this._previousAttributes = _.clone(this.attributes);\n\
        this.changed = {};\n\
      }\n\
      current = this.attributes, prev = this._previousAttributes;\n\
\n\
      // Check for changes of `id`.\n\
      if (this.idAttribute in attrs) this.id = attrs[this.idAttribute];\n\
\n\
      // For each `set` attribute, update or delete the current value.\n\
      for (attr in attrs) {\n\
        val = attrs[attr];\n\
        if (!_.isEqual(current[attr], val)) changes.push(attr);\n\
        if (!_.isEqual(prev[attr], val)) {\n\
          this.changed[attr] = val;\n\
        } else {\n\
          delete this.changed[attr];\n\
        }\n\
        unset ? delete current[attr] : current[attr] = val;\n\
      }\n\
\n\
      // Trigger all relevant attribute changes.\n\
      if (!silent) {\n\
        if (changes.length) this._pending = options;\n\
        for (var i = 0, l = changes.length; i < l; i++) {\n\
          this.trigger('change:' + changes[i], this, current[changes[i]], options);\n\
        }\n\
      }\n\
\n\
      // You might be wondering why there's a `while` loop here. Changes can\n\
      // be recursively nested within `\"change\"` events.\n\
      if (changing) return this;\n\
      if (!silent) {\n\
        while (this._pending) {\n\
          options = this._pending;\n\
          this._pending = false;\n\
          this.trigger('change', this, options);\n\
        }\n\
      }\n\
      this._pending = false;\n\
      this._changing = false;\n\
      return this;\n\
    },\n\
\n\
    // Remove an attribute from the model, firing `\"change\"`. `unset` is a noop\n\
    // if the attribute doesn't exist.\n\
    unset: function(attr, options) {\n\
      return this.set(attr, void 0, _.extend({}, options, {unset: true}));\n\
    },\n\
\n\
    // Clear all attributes on the model, firing `\"change\"`.\n\
    clear: function(options) {\n\
      var attrs = {};\n\
      for (var key in this.attributes) attrs[key] = void 0;\n\
      return this.set(attrs, _.extend({}, options, {unset: true}));\n\
    },\n\
\n\
    // Determine if the model has changed since the last `\"change\"` event.\n\
    // If you specify an attribute name, determine if that attribute has changed.\n\
    hasChanged: function(attr) {\n\
      if (attr == null) return !_.isEmpty(this.changed);\n\
      return _.has(this.changed, attr);\n\
    },\n\
\n\
    // Return an object containing all the attributes that have changed, or\n\
    // false if there are no changed attributes. Useful for determining what\n\
    // parts of a view need to be updated and/or what attributes need to be\n\
    // persisted to the server. Unset attributes will be set to undefined.\n\
    // You can also pass an attributes object to diff against the model,\n\
    // determining if there *would be* a change.\n\
    changedAttributes: function(diff) {\n\
      if (!diff) return this.hasChanged() ? _.clone(this.changed) : false;\n\
      var val, changed = false;\n\
      var old = this._changing ? this._previousAttributes : this.attributes;\n\
      for (var attr in diff) {\n\
        if (_.isEqual(old[attr], (val = diff[attr]))) continue;\n\
        (changed || (changed = {}))[attr] = val;\n\
      }\n\
      return changed;\n\
    },\n\
\n\
    // Get the previous value of an attribute, recorded at the time the last\n\
    // `\"change\"` event was fired.\n\
    previous: function(attr) {\n\
      if (attr == null || !this._previousAttributes) return null;\n\
      return this._previousAttributes[attr];\n\
    },\n\
\n\
    // Get all of the attributes of the model at the time of the previous\n\
    // `\"change\"` event.\n\
    previousAttributes: function() {\n\
      return _.clone(this._previousAttributes);\n\
    },\n\
\n\
    // Fetch the model from the server. If the server's representation of the\n\
    // model differs from its current attributes, they will be overridden,\n\
    // triggering a `\"change\"` event.\n\
    fetch: function(options) {\n\
      options = options ? _.clone(options) : {};\n\
      if (options.parse === void 0) options.parse = true;\n\
      var model = this;\n\
      var success = options.success;\n\
      options.success = function(resp) {\n\
        if (!model.set(model.parse(resp, options), options)) return false;\n\
        if (success) success(model, resp, options);\n\
        model.trigger('sync', model, resp, options);\n\
      };\n\
      wrapError(this, options);\n\
      return this.sync('read', this, options);\n\
    },\n\
\n\
    // Set a hash of model attributes, and sync the model to the server.\n\
    // If the server returns an attributes hash that differs, the model's\n\
    // state will be `set` again.\n\
    save: function(key, val, options) {\n\
      var attrs, method, xhr, attributes = this.attributes;\n\
\n\
      // Handle both `\"key\", value` and `{key: value}` -style arguments.\n\
      if (key == null || typeof key === 'object') {\n\
        attrs = key;\n\
        options = val;\n\
      } else {\n\
        (attrs = {})[key] = val;\n\
      }\n\
\n\
      options = _.extend({validate: true}, options);\n\
\n\
      // If we're not waiting and attributes exist, save acts as\n\
      // `set(attr).save(null, opts)` with validation. Otherwise, check if\n\
      // the model will be valid when the attributes, if any, are set.\n\
      if (attrs && !options.wait) {\n\
        if (!this.set(attrs, options)) return false;\n\
      } else {\n\
        if (!this._validate(attrs, options)) return false;\n\
      }\n\
\n\
      // Set temporary attributes if `{wait: true}`.\n\
      if (attrs && options.wait) {\n\
        this.attributes = _.extend({}, attributes, attrs);\n\
      }\n\
\n\
      // After a successful server-side save, the client is (optionally)\n\
      // updated with the server-side state.\n\
      if (options.parse === void 0) options.parse = true;\n\
      var model = this;\n\
      var success = options.success;\n\
      options.success = function(resp) {\n\
        // Ensure attributes are restored during synchronous saves.\n\
        model.attributes = attributes;\n\
        var serverAttrs = model.parse(resp, options);\n\
        if (options.wait) serverAttrs = _.extend(attrs || {}, serverAttrs);\n\
        if (_.isObject(serverAttrs) && !model.set(serverAttrs, options)) {\n\
          return false;\n\
        }\n\
        if (success) success(model, resp, options);\n\
        model.trigger('sync', model, resp, options);\n\
      };\n\
      wrapError(this, options);\n\
\n\
      method = this.isNew() ? 'create' : (options.patch ? 'patch' : 'update');\n\
      if (method === 'patch') options.attrs = attrs;\n\
      xhr = this.sync(method, this, options);\n\
\n\
      // Restore attributes.\n\
      if (attrs && options.wait) this.attributes = attributes;\n\
\n\
      return xhr;\n\
    },\n\
\n\
    // Destroy this model on the server if it was already persisted.\n\
    // Optimistically removes the model from its collection, if it has one.\n\
    // If `wait: true` is passed, waits for the server to respond before removal.\n\
    destroy: function(options) {\n\
      options = options ? _.clone(options) : {};\n\
      var model = this;\n\
      var success = options.success;\n\
\n\
      var destroy = function() {\n\
        model.trigger('destroy', model, model.collection, options);\n\
      };\n\
\n\
      options.success = function(resp) {\n\
        if (options.wait || model.isNew()) destroy();\n\
        if (success) success(model, resp, options);\n\
        if (!model.isNew()) model.trigger('sync', model, resp, options);\n\
      };\n\
\n\
      if (this.isNew()) {\n\
        options.success();\n\
        return false;\n\
      }\n\
      wrapError(this, options);\n\
\n\
      var xhr = this.sync('delete', this, options);\n\
      if (!options.wait) destroy();\n\
      return xhr;\n\
    },\n\
\n\
    // Default URL for the model's representation on the server -- if you're\n\
    // using Backbone's restful methods, override this to change the endpoint\n\
    // that will be called.\n\
    url: function() {\n\
      var base =\n\
        _.result(this, 'urlRoot') ||\n\
        _.result(this.collection, 'url') ||\n\
        urlError();\n\
      if (this.isNew()) return base;\n\
      return base.replace(/([^\\/])$/, '$1/') + encodeURIComponent(this.id);\n\
    },\n\
\n\
    // **parse** converts a response into the hash of attributes to be `set` on\n\
    // the model. The default implementation is just to pass the response along.\n\
    parse: function(resp, options) {\n\
      return resp;\n\
    },\n\
\n\
    // Create a new model with identical attributes to this one.\n\
    clone: function() {\n\
      return new this.constructor(this.attributes);\n\
    },\n\
\n\
    // A model is new if it has never been saved to the server, and lacks an id.\n\
    isNew: function() {\n\
      return !this.has(this.idAttribute);\n\
    },\n\
\n\
    // Check if the model is currently in a valid state.\n\
    isValid: function(options) {\n\
      return this._validate({}, _.extend(options || {}, { validate: true }));\n\
    },\n\
\n\
    // Run validation against the next complete set of model attributes,\n\
    // returning `true` if all is well. Otherwise, fire an `\"invalid\"` event.\n\
    _validate: function(attrs, options) {\n\
      if (!options.validate || !this.validate) return true;\n\
      attrs = _.extend({}, this.attributes, attrs);\n\
      var error = this.validationError = this.validate(attrs, options) || null;\n\
      if (!error) return true;\n\
      this.trigger('invalid', this, error, _.extend(options, {validationError: error}));\n\
      return false;\n\
    }\n\
\n\
  });\n\
\n\
  // Underscore methods that we want to implement on the Model.\n\
  var modelMethods = ['keys', 'values', 'pairs', 'invert', 'pick', 'omit'];\n\
\n\
  // Mix in each Underscore method as a proxy to `Model#attributes`.\n\
  _.each(modelMethods, function(method) {\n\
    Model.prototype[method] = function() {\n\
      var args = slice.call(arguments);\n\
      args.unshift(this.attributes);\n\
      return _[method].apply(_, args);\n\
    };\n\
  });\n\
\n\
  // Backbone.Collection\n\
  // -------------------\n\
\n\
  // If models tend to represent a single row of data, a Backbone Collection is\n\
  // more analagous to a table full of data ... or a small slice or page of that\n\
  // table, or a collection of rows that belong together for a particular reason\n\
  // -- all of the messages in this particular folder, all of the documents\n\
  // belonging to this particular author, and so on. Collections maintain\n\
  // indexes of their models, both in order, and for lookup by `id`.\n\
\n\
  // Create a new **Collection**, perhaps to contain a specific type of `model`.\n\
  // If a `comparator` is specified, the Collection will maintain\n\
  // its models in sort order, as they're added and removed.\n\
  var Collection = Backbone.Collection = function(models, options) {\n\
    options || (options = {});\n\
    if (options.model) this.model = options.model;\n\
    if (options.comparator !== void 0) this.comparator = options.comparator;\n\
    this._reset();\n\
    this.initialize.apply(this, arguments);\n\
    if (models) this.reset(models, _.extend({silent: true}, options));\n\
  };\n\
\n\
  // Default options for `Collection#set`.\n\
  var setOptions = {add: true, remove: true, merge: true};\n\
  var addOptions = {add: true, remove: false};\n\
\n\
  // Define the Collection's inheritable methods.\n\
  _.extend(Collection.prototype, Events, {\n\
\n\
    // The default model for a collection is just a **Backbone.Model**.\n\
    // This should be overridden in most cases.\n\
    model: Model,\n\
\n\
    // Initialize is an empty function by default. Override it with your own\n\
    // initialization logic.\n\
    initialize: function(){},\n\
\n\
    // The JSON representation of a Collection is an array of the\n\
    // models' attributes.\n\
    toJSON: function(options) {\n\
      return this.map(function(model){ return model.toJSON(options); });\n\
    },\n\
\n\
    // Proxy `Backbone.sync` by default.\n\
    sync: function() {\n\
      return Backbone.sync.apply(this, arguments);\n\
    },\n\
\n\
    // Add a model, or list of models to the set.\n\
    add: function(models, options) {\n\
      return this.set(models, _.extend({merge: false}, options, addOptions));\n\
    },\n\
\n\
    // Remove a model, or a list of models from the set.\n\
    remove: function(models, options) {\n\
      var singular = !_.isArray(models);\n\
      models = singular ? [models] : _.clone(models);\n\
      options || (options = {});\n\
      var i, l, index, model;\n\
      for (i = 0, l = models.length; i < l; i++) {\n\
        model = models[i] = this.get(models[i]);\n\
        if (!model) continue;\n\
        delete this._byId[model.id];\n\
        delete this._byId[model.cid];\n\
        index = this.indexOf(model);\n\
        this.models.splice(index, 1);\n\
        this.length--;\n\
        if (!options.silent) {\n\
          options.index = index;\n\
          model.trigger('remove', model, this, options);\n\
        }\n\
        this._removeReference(model, options);\n\
      }\n\
      return singular ? models[0] : models;\n\
    },\n\
\n\
    // Update a collection by `set`-ing a new list of models, adding new ones,\n\
    // removing models that are no longer present, and merging models that\n\
    // already exist in the collection, as necessary. Similar to **Model#set**,\n\
    // the core operation for updating the data contained by the collection.\n\
    set: function(models, options) {\n\
      options = _.defaults({}, options, setOptions);\n\
      if (options.parse) models = this.parse(models, options);\n\
      var singular = !_.isArray(models);\n\
      models = singular ? (models ? [models] : []) : _.clone(models);\n\
      var i, l, id, model, attrs, existing, sort;\n\
      var at = options.at;\n\
      var targetModel = this.model;\n\
      var sortable = this.comparator && (at == null) && options.sort !== false;\n\
      var sortAttr = _.isString(this.comparator) ? this.comparator : null;\n\
      var toAdd = [], toRemove = [], modelMap = {};\n\
      var add = options.add, merge = options.merge, remove = options.remove;\n\
      var order = !sortable && add && remove ? [] : false;\n\
\n\
      // Turn bare objects into model references, and prevent invalid models\n\
      // from being added.\n\
      for (i = 0, l = models.length; i < l; i++) {\n\
        attrs = models[i] || {};\n\
        if (attrs instanceof Model) {\n\
          id = model = attrs;\n\
        } else {\n\
          id = attrs[targetModel.prototype.idAttribute || 'id'];\n\
        }\n\
\n\
        // If a duplicate is found, prevent it from being added and\n\
        // optionally merge it into the existing model.\n\
        if (existing = this.get(id)) {\n\
          if (remove) modelMap[existing.cid] = true;\n\
          if (merge) {\n\
            attrs = attrs === model ? model.attributes : attrs;\n\
            if (options.parse) attrs = existing.parse(attrs, options);\n\
            existing.set(attrs, options);\n\
            if (sortable && !sort && existing.hasChanged(sortAttr)) sort = true;\n\
          }\n\
          models[i] = existing;\n\
\n\
        // If this is a new, valid model, push it to the `toAdd` list.\n\
        } else if (add) {\n\
          model = models[i] = this._prepareModel(attrs, options);\n\
          if (!model) continue;\n\
          toAdd.push(model);\n\
          this._addReference(model, options);\n\
        }\n\
\n\
        // Do not add multiple models with the same `id`.\n\
        model = existing || model;\n\
        if (order && (model.isNew() || !modelMap[model.id])) order.push(model);\n\
        modelMap[model.id] = true;\n\
      }\n\
\n\
      // Remove nonexistent models if appropriate.\n\
      if (remove) {\n\
        for (i = 0, l = this.length; i < l; ++i) {\n\
          if (!modelMap[(model = this.models[i]).cid]) toRemove.push(model);\n\
        }\n\
        if (toRemove.length) this.remove(toRemove, options);\n\
      }\n\
\n\
      // See if sorting is needed, update `length` and splice in new models.\n\
      if (toAdd.length || (order && order.length)) {\n\
        if (sortable) sort = true;\n\
        this.length += toAdd.length;\n\
        if (at != null) {\n\
          for (i = 0, l = toAdd.length; i < l; i++) {\n\
            this.models.splice(at + i, 0, toAdd[i]);\n\
          }\n\
        } else {\n\
          if (order) this.models.length = 0;\n\
          var orderedModels = order || toAdd;\n\
          for (i = 0, l = orderedModels.length; i < l; i++) {\n\
            this.models.push(orderedModels[i]);\n\
          }\n\
        }\n\
      }\n\
\n\
      // Silently sort the collection if appropriate.\n\
      if (sort) this.sort({silent: true});\n\
\n\
      // Unless silenced, it's time to fire all appropriate add/sort events.\n\
      if (!options.silent) {\n\
        for (i = 0, l = toAdd.length; i < l; i++) {\n\
          (model = toAdd[i]).trigger('add', model, this, options);\n\
        }\n\
        if (sort || (order && order.length)) this.trigger('sort', this, options);\n\
      }\n\
\n\
      // Return the added (or merged) model (or models).\n\
      return singular ? models[0] : models;\n\
    },\n\
\n\
    // When you have more items than you want to add or remove individually,\n\
    // you can reset the entire set with a new list of models, without firing\n\
    // any granular `add` or `remove` events. Fires `reset` when finished.\n\
    // Useful for bulk operations and optimizations.\n\
    reset: function(models, options) {\n\
      options || (options = {});\n\
      for (var i = 0, l = this.models.length; i < l; i++) {\n\
        this._removeReference(this.models[i], options);\n\
      }\n\
      options.previousModels = this.models;\n\
      this._reset();\n\
      models = this.add(models, _.extend({silent: true}, options));\n\
      if (!options.silent) this.trigger('reset', this, options);\n\
      return models;\n\
    },\n\
\n\
    // Add a model to the end of the collection.\n\
    push: function(model, options) {\n\
      return this.add(model, _.extend({at: this.length}, options));\n\
    },\n\
\n\
    // Remove a model from the end of the collection.\n\
    pop: function(options) {\n\
      var model = this.at(this.length - 1);\n\
      this.remove(model, options);\n\
      return model;\n\
    },\n\
\n\
    // Add a model to the beginning of the collection.\n\
    unshift: function(model, options) {\n\
      return this.add(model, _.extend({at: 0}, options));\n\
    },\n\
\n\
    // Remove a model from the beginning of the collection.\n\
    shift: function(options) {\n\
      var model = this.at(0);\n\
      this.remove(model, options);\n\
      return model;\n\
    },\n\
\n\
    // Slice out a sub-array of models from the collection.\n\
    slice: function() {\n\
      return slice.apply(this.models, arguments);\n\
    },\n\
\n\
    // Get a model from the set by id.\n\
    get: function(obj) {\n\
      if (obj == null) return void 0;\n\
      return this._byId[obj] || this._byId[obj.id] || this._byId[obj.cid];\n\
    },\n\
\n\
    // Get the model at the given index.\n\
    at: function(index) {\n\
      return this.models[index];\n\
    },\n\
\n\
    // Return models with matching attributes. Useful for simple cases of\n\
    // `filter`.\n\
    where: function(attrs, first) {\n\
      if (_.isEmpty(attrs)) return first ? void 0 : [];\n\
      return this[first ? 'find' : 'filter'](function(model) {\n\
        for (var key in attrs) {\n\
          if (attrs[key] !== model.get(key)) return false;\n\
        }\n\
        return true;\n\
      });\n\
    },\n\
\n\
    // Return the first model with matching attributes. Useful for simple cases\n\
    // of `find`.\n\
    findWhere: function(attrs) {\n\
      return this.where(attrs, true);\n\
    },\n\
\n\
    // Force the collection to re-sort itself. You don't need to call this under\n\
    // normal circumstances, as the set will maintain sort order as each item\n\
    // is added.\n\
    sort: function(options) {\n\
      if (!this.comparator) throw new Error('Cannot sort a set without a comparator');\n\
      options || (options = {});\n\
\n\
      // Run sort based on type of `comparator`.\n\
      if (_.isString(this.comparator) || this.comparator.length === 1) {\n\
        this.models = this.sortBy(this.comparator, this);\n\
      } else {\n\
        this.models.sort(_.bind(this.comparator, this));\n\
      }\n\
\n\
      if (!options.silent) this.trigger('sort', this, options);\n\
      return this;\n\
    },\n\
\n\
    // Pluck an attribute from each model in the collection.\n\
    pluck: function(attr) {\n\
      return _.invoke(this.models, 'get', attr);\n\
    },\n\
\n\
    // Fetch the default set of models for this collection, resetting the\n\
    // collection when they arrive. If `reset: true` is passed, the response\n\
    // data will be passed through the `reset` method instead of `set`.\n\
    fetch: function(options) {\n\
      options = options ? _.clone(options) : {};\n\
      if (options.parse === void 0) options.parse = true;\n\
      var success = options.success;\n\
      var collection = this;\n\
      options.success = function(resp) {\n\
        var method = options.reset ? 'reset' : 'set';\n\
        collection[method](resp, options);\n\
        if (success) success(collection, resp, options);\n\
        collection.trigger('sync', collection, resp, options);\n\
      };\n\
      wrapError(this, options);\n\
      return this.sync('read', this, options);\n\
    },\n\
\n\
    // Create a new instance of a model in this collection. Add the model to the\n\
    // collection immediately, unless `wait: true` is passed, in which case we\n\
    // wait for the server to agree.\n\
    create: function(model, options) {\n\
      options = options ? _.clone(options) : {};\n\
      if (!(model = this._prepareModel(model, options))) return false;\n\
      if (!options.wait) this.add(model, options);\n\
      var collection = this;\n\
      var success = options.success;\n\
      options.success = function(model, resp) {\n\
        if (options.wait) collection.add(model, options);\n\
        if (success) success(model, resp, options);\n\
      };\n\
      model.save(null, options);\n\
      return model;\n\
    },\n\
\n\
    // **parse** converts a response into a list of models to be added to the\n\
    // collection. The default implementation is just to pass it through.\n\
    parse: function(resp, options) {\n\
      return resp;\n\
    },\n\
\n\
    // Create a new collection with an identical list of models as this one.\n\
    clone: function() {\n\
      return new this.constructor(this.models);\n\
    },\n\
\n\
    // Private method to reset all internal state. Called when the collection\n\
    // is first initialized or reset.\n\
    _reset: function() {\n\
      this.length = 0;\n\
      this.models = [];\n\
      this._byId  = {};\n\
    },\n\
\n\
    // Prepare a hash of attributes (or other model) to be added to this\n\
    // collection.\n\
    _prepareModel: function(attrs, options) {\n\
      if (attrs instanceof Model) return attrs;\n\
      options = options ? _.clone(options) : {};\n\
      options.collection = this;\n\
      var model = new this.model(attrs, options);\n\
      if (!model.validationError) return model;\n\
      this.trigger('invalid', this, model.validationError, options);\n\
      return false;\n\
    },\n\
\n\
    // Internal method to create a model's ties to a collection.\n\
    _addReference: function(model, options) {\n\
      this._byId[model.cid] = model;\n\
      if (model.id != null) this._byId[model.id] = model;\n\
      if (!model.collection) model.collection = this;\n\
      model.on('all', this._onModelEvent, this);\n\
    },\n\
\n\
    // Internal method to sever a model's ties to a collection.\n\
    _removeReference: function(model, options) {\n\
      if (this === model.collection) delete model.collection;\n\
      model.off('all', this._onModelEvent, this);\n\
    },\n\
\n\
    // Internal method called every time a model in the set fires an event.\n\
    // Sets need to update their indexes when models change ids. All other\n\
    // events simply proxy through. \"add\" and \"remove\" events that originate\n\
    // in other collections are ignored.\n\
    _onModelEvent: function(event, model, collection, options) {\n\
      if ((event === 'add' || event === 'remove') && collection !== this) return;\n\
      if (event === 'destroy') this.remove(model, options);\n\
      if (model && event === 'change:' + model.idAttribute) {\n\
        delete this._byId[model.previous(model.idAttribute)];\n\
        if (model.id != null) this._byId[model.id] = model;\n\
      }\n\
      this.trigger.apply(this, arguments);\n\
    }\n\
\n\
  });\n\
\n\
  // Underscore methods that we want to implement on the Collection.\n\
  // 90% of the core usefulness of Backbone Collections is actually implemented\n\
  // right here:\n\
  var methods = ['forEach', 'each', 'map', 'collect', 'reduce', 'foldl',\n\
    'inject', 'reduceRight', 'foldr', 'find', 'detect', 'filter', 'select',\n\
    'reject', 'every', 'all', 'some', 'any', 'include', 'contains', 'invoke',\n\
    'max', 'min', 'toArray', 'size', 'first', 'head', 'take', 'initial', 'rest',\n\
    'tail', 'drop', 'last', 'without', 'difference', 'indexOf', 'shuffle',\n\
    'lastIndexOf', 'isEmpty', 'chain', 'sample'];\n\
\n\
  // Mix in each Underscore method as a proxy to `Collection#models`.\n\
  _.each(methods, function(method) {\n\
    Collection.prototype[method] = function() {\n\
      var args = slice.call(arguments);\n\
      args.unshift(this.models);\n\
      return _[method].apply(_, args);\n\
    };\n\
  });\n\
\n\
  // Underscore methods that take a property name as an argument.\n\
  var attributeMethods = ['groupBy', 'countBy', 'sortBy', 'indexBy'];\n\
\n\
  // Use attributes instead of properties.\n\
  _.each(attributeMethods, function(method) {\n\
    Collection.prototype[method] = function(value, context) {\n\
      var iterator = _.isFunction(value) ? value : function(model) {\n\
        return model.get(value);\n\
      };\n\
      return _[method](this.models, iterator, context);\n\
    };\n\
  });\n\
\n\
  // Backbone.View\n\
  // -------------\n\
\n\
  // Backbone Views are almost more convention than they are actual code. A View\n\
  // is simply a JavaScript object that represents a logical chunk of UI in the\n\
  // DOM. This might be a single item, an entire list, a sidebar or panel, or\n\
  // even the surrounding frame which wraps your whole app. Defining a chunk of\n\
  // UI as a **View** allows you to define your DOM events declaratively, without\n\
  // having to worry about render order ... and makes it easy for the view to\n\
  // react to specific changes in the state of your models.\n\
\n\
  // Creating a Backbone.View creates its initial element outside of the DOM,\n\
  // if an existing element is not provided...\n\
  var View = Backbone.View = function(options) {\n\
    this.cid = _.uniqueId('view');\n\
    options || (options = {});\n\
    _.extend(this, _.pick(options, viewOptions));\n\
    this._ensureElement();\n\
    this.initialize.apply(this, arguments);\n\
    this.delegateEvents();\n\
  };\n\
\n\
  // Cached regex to split keys for `delegate`.\n\
  var delegateEventSplitter = /^(\\S+)\\s*(.*)$/;\n\
\n\
  // List of view options to be merged as properties.\n\
  var viewOptions = ['model', 'collection', 'el', 'id', 'attributes', 'className', 'tagName', 'events'];\n\
\n\
  // Set up all inheritable **Backbone.View** properties and methods.\n\
  _.extend(View.prototype, Events, {\n\
\n\
    // The default `tagName` of a View's element is `\"div\"`.\n\
    tagName: 'div',\n\
\n\
    // jQuery delegate for element lookup, scoped to DOM elements within the\n\
    // current view. This should be preferred to global lookups where possible.\n\
    $: function(selector) {\n\
      return this.$el.find(selector);\n\
    },\n\
\n\
    // Initialize is an empty function by default. Override it with your own\n\
    // initialization logic.\n\
    initialize: function(){},\n\
\n\
    // **render** is the core function that your view should override, in order\n\
    // to populate its element (`this.el`), with the appropriate HTML. The\n\
    // convention is for **render** to always return `this`.\n\
    render: function() {\n\
      return this;\n\
    },\n\
\n\
    // Remove this view by taking the element out of the DOM, and removing any\n\
    // applicable Backbone.Events listeners.\n\
    remove: function() {\n\
      this.$el.remove();\n\
      this.stopListening();\n\
      return this;\n\
    },\n\
\n\
    // Change the view's element (`this.el` property), including event\n\
    // re-delegation.\n\
    setElement: function(element, delegate) {\n\
      if (this.$el) this.undelegateEvents();\n\
      this.$el = element instanceof Backbone.$ ? element : Backbone.$(element);\n\
      this.el = this.$el[0];\n\
      if (delegate !== false) this.delegateEvents();\n\
      return this;\n\
    },\n\
\n\
    // Set callbacks, where `this.events` is a hash of\n\
    //\n\
    // *{\"event selector\": \"callback\"}*\n\
    //\n\
    //     {\n\
    //       'mousedown .title':  'edit',\n\
    //       'click .button':     'save',\n\
    //       'click .open':       function(e) { ... }\n\
    //     }\n\
    //\n\
    // pairs. Callbacks will be bound to the view, with `this` set properly.\n\
    // Uses event delegation for efficiency.\n\
    // Omitting the selector binds the event to `this.el`.\n\
    // This only works for delegate-able events: not `focus`, `blur`, and\n\
    // not `change`, `submit`, and `reset` in Internet Explorer.\n\
    delegateEvents: function(events) {\n\
      if (!(events || (events = _.result(this, 'events')))) return this;\n\
      this.undelegateEvents();\n\
      for (var key in events) {\n\
        var method = events[key];\n\
        if (!_.isFunction(method)) method = this[events[key]];\n\
        if (!method) continue;\n\
\n\
        var match = key.match(delegateEventSplitter);\n\
        var eventName = match[1], selector = match[2];\n\
        method = _.bind(method, this);\n\
        eventName += '.delegateEvents' + this.cid;\n\
        if (selector === '') {\n\
          this.$el.on(eventName, method);\n\
        } else {\n\
          this.$el.on(eventName, selector, method);\n\
        }\n\
      }\n\
      return this;\n\
    },\n\
\n\
    // Clears all callbacks previously bound to the view with `delegateEvents`.\n\
    // You usually don't need to use this, but may wish to if you have multiple\n\
    // Backbone views attached to the same DOM element.\n\
    undelegateEvents: function() {\n\
      this.$el.off('.delegateEvents' + this.cid);\n\
      return this;\n\
    },\n\
\n\
    // Ensure that the View has a DOM element to render into.\n\
    // If `this.el` is a string, pass it through `$()`, take the first\n\
    // matching element, and re-assign it to `el`. Otherwise, create\n\
    // an element from the `id`, `className` and `tagName` properties.\n\
    _ensureElement: function() {\n\
      if (!this.el) {\n\
        var attrs = _.extend({}, _.result(this, 'attributes'));\n\
        if (this.id) attrs.id = _.result(this, 'id');\n\
        if (this.className) attrs['class'] = _.result(this, 'className');\n\
        var $el = Backbone.$('<' + _.result(this, 'tagName') + '>').attr(attrs);\n\
        this.setElement($el, false);\n\
      } else {\n\
        this.setElement(_.result(this, 'el'), false);\n\
      }\n\
    }\n\
\n\
  });\n\
\n\
  // Backbone.sync\n\
  // -------------\n\
\n\
  // Override this function to change the manner in which Backbone persists\n\
  // models to the server. You will be passed the type of request, and the\n\
  // model in question. By default, makes a RESTful Ajax request\n\
  // to the model's `url()`. Some possible customizations could be:\n\
  //\n\
  // * Use `setTimeout` to batch rapid-fire updates into a single request.\n\
  // * Send up the models as XML instead of JSON.\n\
  // * Persist models via WebSockets instead of Ajax.\n\
  //\n\
  // Turn on `Backbone.emulateHTTP` in order to send `PUT` and `DELETE` requests\n\
  // as `POST`, with a `_method` parameter containing the true HTTP method,\n\
  // as well as all requests with the body as `application/x-www-form-urlencoded`\n\
  // instead of `application/json` with the model in a param named `model`.\n\
  // Useful when interfacing with server-side languages like **PHP** that make\n\
  // it difficult to read the body of `PUT` requests.\n\
  Backbone.sync = function(method, model, options) {\n\
    var type = methodMap[method];\n\
\n\
    // Default options, unless specified.\n\
    _.defaults(options || (options = {}), {\n\
      emulateHTTP: Backbone.emulateHTTP,\n\
      emulateJSON: Backbone.emulateJSON\n\
    });\n\
\n\
    // Default JSON-request options.\n\
    var params = {type: type, dataType: 'json'};\n\
\n\
    // Ensure that we have a URL.\n\
    if (!options.url) {\n\
      params.url = _.result(model, 'url') || urlError();\n\
    }\n\
\n\
    // Ensure that we have the appropriate request data.\n\
    if (options.data == null && model && (method === 'create' || method === 'update' || method === 'patch')) {\n\
      params.contentType = 'application/json';\n\
      params.data = JSON.stringify(options.attrs || model.toJSON(options));\n\
    }\n\
\n\
    // For older servers, emulate JSON by encoding the request into an HTML-form.\n\
    if (options.emulateJSON) {\n\
      params.contentType = 'application/x-www-form-urlencoded';\n\
      params.data = params.data ? {model: params.data} : {};\n\
    }\n\
\n\
    // For older servers, emulate HTTP by mimicking the HTTP method with `_method`\n\
    // And an `X-HTTP-Method-Override` header.\n\
    if (options.emulateHTTP && (type === 'PUT' || type === 'DELETE' || type === 'PATCH')) {\n\
      params.type = 'POST';\n\
      if (options.emulateJSON) params.data._method = type;\n\
      var beforeSend = options.beforeSend;\n\
      options.beforeSend = function(xhr) {\n\
        xhr.setRequestHeader('X-HTTP-Method-Override', type);\n\
        if (beforeSend) return beforeSend.apply(this, arguments);\n\
      };\n\
    }\n\
\n\
    // Don't process data on a non-GET request.\n\
    if (params.type !== 'GET' && !options.emulateJSON) {\n\
      params.processData = false;\n\
    }\n\
\n\
    // If we're sending a `PATCH` request, and we're in an old Internet Explorer\n\
    // that still has ActiveX enabled by default, override jQuery to use that\n\
    // for XHR instead. Remove this line when jQuery supports `PATCH` on IE8.\n\
    if (params.type === 'PATCH' && noXhrPatch) {\n\
      params.xhr = function() {\n\
        return new ActiveXObject(\"Microsoft.XMLHTTP\");\n\
      };\n\
    }\n\
\n\
    // Make the request, allowing the user to override any Ajax options.\n\
    var xhr = options.xhr = Backbone.ajax(_.extend(params, options));\n\
    model.trigger('request', model, xhr, options);\n\
    return xhr;\n\
  };\n\
\n\
  var noXhrPatch =\n\
    typeof window !== 'undefined' && !!window.ActiveXObject &&\n\
      !(window.XMLHttpRequest && (new XMLHttpRequest).dispatchEvent);\n\
\n\
  // Map from CRUD to HTTP for our default `Backbone.sync` implementation.\n\
  var methodMap = {\n\
    'create': 'POST',\n\
    'update': 'PUT',\n\
    'patch':  'PATCH',\n\
    'delete': 'DELETE',\n\
    'read':   'GET'\n\
  };\n\
\n\
  // Set the default implementation of `Backbone.ajax` to proxy through to `$`.\n\
  // Override this if you'd like to use a different library.\n\
  Backbone.ajax = function() {\n\
    return Backbone.$.ajax.apply(Backbone.$, arguments);\n\
  };\n\
\n\
  // Backbone.Router\n\
  // ---------------\n\
\n\
  // Routers map faux-URLs to actions, and fire events when routes are\n\
  // matched. Creating a new one sets its `routes` hash, if not set statically.\n\
  var Router = Backbone.Router = function(options) {\n\
    options || (options = {});\n\
    if (options.routes) this.routes = options.routes;\n\
    this._bindRoutes();\n\
    this.initialize.apply(this, arguments);\n\
  };\n\
\n\
  // Cached regular expressions for matching named param parts and splatted\n\
  // parts of route strings.\n\
  var optionalParam = /\\((.*?)\\)/g;\n\
  var namedParam    = /(\\(\\?)?:\\w+/g;\n\
  var splatParam    = /\\*\\w+/g;\n\
  var escapeRegExp  = /[\\-{}\\[\\]+?.,\\\\\\^$|#\\s]/g;\n\
\n\
  // Set up all inheritable **Backbone.Router** properties and methods.\n\
  _.extend(Router.prototype, Events, {\n\
\n\
    // Initialize is an empty function by default. Override it with your own\n\
    // initialization logic.\n\
    initialize: function(){},\n\
\n\
    // Manually bind a single named route to a callback. For example:\n\
    //\n\
    //     this.route('search/:query/p:num', 'search', function(query, num) {\n\
    //       ...\n\
    //     });\n\
    //\n\
    route: function(route, name, callback) {\n\
      if (!_.isRegExp(route)) route = this._routeToRegExp(route);\n\
      if (_.isFunction(name)) {\n\
        callback = name;\n\
        name = '';\n\
      }\n\
      if (!callback) callback = this[name];\n\
      var router = this;\n\
      Backbone.history.route(route, function(fragment) {\n\
        var args = router._extractParameters(route, fragment);\n\
        router.execute(callback, args);\n\
        router.trigger.apply(router, ['route:' + name].concat(args));\n\
        router.trigger('route', name, args);\n\
        Backbone.history.trigger('route', router, name, args);\n\
      });\n\
      return this;\n\
    },\n\
\n\
    // Execute a route handler with the provided parameters.  This is an\n\
    // excellent place to do pre-route setup or post-route cleanup.\n\
    execute: function(callback, args) {\n\
      if (callback) callback.apply(this, args);\n\
    },\n\
\n\
    // Simple proxy to `Backbone.history` to save a fragment into the history.\n\
    navigate: function(fragment, options) {\n\
      Backbone.history.navigate(fragment, options);\n\
      return this;\n\
    },\n\
\n\
    // Bind all defined routes to `Backbone.history`. We have to reverse the\n\
    // order of the routes here to support behavior where the most general\n\
    // routes can be defined at the bottom of the route map.\n\
    _bindRoutes: function() {\n\
      if (!this.routes) return;\n\
      this.routes = _.result(this, 'routes');\n\
      var route, routes = _.keys(this.routes);\n\
      while ((route = routes.pop()) != null) {\n\
        this.route(route, this.routes[route]);\n\
      }\n\
    },\n\
\n\
    // Convert a route string into a regular expression, suitable for matching\n\
    // against the current location hash.\n\
    _routeToRegExp: function(route) {\n\
      route = route.replace(escapeRegExp, '\\\\$&')\n\
                   .replace(optionalParam, '(?:$1)?')\n\
                   .replace(namedParam, function(match, optional) {\n\
                     return optional ? match : '([^/?]+)';\n\
                   })\n\
                   .replace(splatParam, '([^?]*?)');\n\
      return new RegExp('^' + route + '(?:\\\\?([\\\\s\\\\S]*))?$');\n\
    },\n\
\n\
    // Given a route, and a URL fragment that it matches, return the array of\n\
    // extracted decoded parameters. Empty or unmatched parameters will be\n\
    // treated as `null` to normalize cross-browser behavior.\n\
    _extractParameters: function(route, fragment) {\n\
      var params = route.exec(fragment).slice(1);\n\
      return _.map(params, function(param, i) {\n\
        // Don't decode the search params.\n\
        if (i === params.length - 1) return param || null;\n\
        return param ? decodeURIComponent(param) : null;\n\
      });\n\
    }\n\
\n\
  });\n\
\n\
  // Backbone.History\n\
  // ----------------\n\
\n\
  // Handles cross-browser history management, based on either\n\
  // [pushState](http://diveintohtml5.info/history.html) and real URLs, or\n\
  // [onhashchange](https://developer.mozilla.org/en-US/docs/DOM/window.onhashchange)\n\
  // and URL fragments. If the browser supports neither (old IE, natch),\n\
  // falls back to polling.\n\
  var History = Backbone.History = function() {\n\
    this.handlers = [];\n\
    _.bindAll(this, 'checkUrl');\n\
\n\
    // Ensure that `History` can be used outside of the browser.\n\
    if (typeof window !== 'undefined') {\n\
      this.location = window.location;\n\
      this.history = window.history;\n\
    }\n\
  };\n\
\n\
  // Cached regex for stripping a leading hash/slash and trailing space.\n\
  var routeStripper = /^[#\\/]|\\s+$/g;\n\
\n\
  // Cached regex for stripping leading and trailing slashes.\n\
  var rootStripper = /^\\/+|\\/+$/g;\n\
\n\
  // Cached regex for detecting MSIE.\n\
  var isExplorer = /msie [\\w.]+/;\n\
\n\
  // Cached regex for removing a trailing slash.\n\
  var trailingSlash = /\\/$/;\n\
\n\
  // Cached regex for stripping urls of hash.\n\
  var pathStripper = /#.*$/;\n\
\n\
  // Has the history handling already been started?\n\
  History.started = false;\n\
\n\
  // Set up all inheritable **Backbone.History** properties and methods.\n\
  _.extend(History.prototype, Events, {\n\
\n\
    // The default interval to poll for hash changes, if necessary, is\n\
    // twenty times a second.\n\
    interval: 50,\n\
\n\
    // Are we at the app root?\n\
    atRoot: function() {\n\
      return this.location.pathname.replace(/[^\\/]$/, '$&/') === this.root;\n\
    },\n\
\n\
    // Gets the true hash value. Cannot use location.hash directly due to bug\n\
    // in Firefox where location.hash will always be decoded.\n\
    getHash: function(window) {\n\
      var match = (window || this).location.href.match(/#(.*)$/);\n\
      return match ? match[1] : '';\n\
    },\n\
\n\
    // Get the cross-browser normalized URL fragment, either from the URL,\n\
    // the hash, or the override.\n\
    getFragment: function(fragment, forcePushState) {\n\
      if (fragment == null) {\n\
        if (this._hasPushState || !this._wantsHashChange || forcePushState) {\n\
          fragment = decodeURI(this.location.pathname + this.location.search);\n\
          var root = this.root.replace(trailingSlash, '');\n\
          if (!fragment.indexOf(root)) fragment = fragment.slice(root.length);\n\
        } else {\n\
          fragment = this.getHash();\n\
        }\n\
      }\n\
      return fragment.replace(routeStripper, '');\n\
    },\n\
\n\
    // Start the hash change handling, returning `true` if the current URL matches\n\
    // an existing route, and `false` otherwise.\n\
    start: function(options) {\n\
      if (History.started) throw new Error(\"Backbone.history has already been started\");\n\
      History.started = true;\n\
\n\
      // Figure out the initial configuration. Do we need an iframe?\n\
      // Is pushState desired ... is it available?\n\
      this.options          = _.extend({root: '/'}, this.options, options);\n\
      this.root             = this.options.root;\n\
      this._wantsHashChange = this.options.hashChange !== false;\n\
      this._wantsPushState  = !!this.options.pushState;\n\
      this._hasPushState    = !!(this.options.pushState && this.history && this.history.pushState);\n\
      var fragment          = this.getFragment();\n\
      var docMode           = document.documentMode;\n\
      var oldIE             = (isExplorer.exec(navigator.userAgent.toLowerCase()) && (!docMode || docMode <= 7));\n\
\n\
      // Normalize root to always include a leading and trailing slash.\n\
      this.root = ('/' + this.root + '/').replace(rootStripper, '/');\n\
\n\
      if (oldIE && this._wantsHashChange) {\n\
        var frame = Backbone.$('<iframe src=\"javascript:0\" tabindex=\"-1\">');\n\
        this.iframe = frame.hide().appendTo('body')[0].contentWindow;\n\
        this.navigate(fragment);\n\
      }\n\
\n\
      // Depending on whether we're using pushState or hashes, and whether\n\
      // 'onhashchange' is supported, determine how we check the URL state.\n\
      if (this._hasPushState) {\n\
        Backbone.$(window).on('popstate', this.checkUrl);\n\
      } else if (this._wantsHashChange && ('onhashchange' in window) && !oldIE) {\n\
        Backbone.$(window).on('hashchange', this.checkUrl);\n\
      } else if (this._wantsHashChange) {\n\
        this._checkUrlInterval = setInterval(this.checkUrl, this.interval);\n\
      }\n\
\n\
      // Determine if we need to change the base url, for a pushState link\n\
      // opened by a non-pushState browser.\n\
      this.fragment = fragment;\n\
      var loc = this.location;\n\
\n\
      // Transition from hashChange to pushState or vice versa if both are\n\
      // requested.\n\
      if (this._wantsHashChange && this._wantsPushState) {\n\
\n\
        // If we've started off with a route from a `pushState`-enabled\n\
        // browser, but we're currently in a browser that doesn't support it...\n\
        if (!this._hasPushState && !this.atRoot()) {\n\
          this.fragment = this.getFragment(null, true);\n\
          this.location.replace(this.root + '#' + this.fragment);\n\
          // Return immediately as browser will do redirect to new url\n\
          return true;\n\
\n\
        // Or if we've started out with a hash-based route, but we're currently\n\
        // in a browser where it could be `pushState`-based instead...\n\
        } else if (this._hasPushState && this.atRoot() && loc.hash) {\n\
          this.fragment = this.getHash().replace(routeStripper, '');\n\
          this.history.replaceState({}, document.title, this.root + this.fragment);\n\
        }\n\
\n\
      }\n\
\n\
      if (!this.options.silent) return this.loadUrl();\n\
    },\n\
\n\
    // Disable Backbone.history, perhaps temporarily. Not useful in a real app,\n\
    // but possibly useful for unit testing Routers.\n\
    stop: function() {\n\
      Backbone.$(window).off('popstate', this.checkUrl).off('hashchange', this.checkUrl);\n\
      clearInterval(this._checkUrlInterval);\n\
      History.started = false;\n\
    },\n\
\n\
    // Add a route to be tested when the fragment changes. Routes added later\n\
    // may override previous routes.\n\
    route: function(route, callback) {\n\
      this.handlers.unshift({route: route, callback: callback});\n\
    },\n\
\n\
    // Checks the current URL to see if it has changed, and if it has,\n\
    // calls `loadUrl`, normalizing across the hidden iframe.\n\
    checkUrl: function(e) {\n\
      var current = this.getFragment();\n\
      if (current === this.fragment && this.iframe) {\n\
        current = this.getFragment(this.getHash(this.iframe));\n\
      }\n\
      if (current === this.fragment) return false;\n\
      if (this.iframe) this.navigate(current);\n\
      this.loadUrl();\n\
    },\n\
\n\
    // Attempt to load the current URL fragment. If a route succeeds with a\n\
    // match, returns `true`. If no defined routes matches the fragment,\n\
    // returns `false`.\n\
    loadUrl: function(fragment) {\n\
      fragment = this.fragment = this.getFragment(fragment);\n\
      return _.any(this.handlers, function(handler) {\n\
        if (handler.route.test(fragment)) {\n\
          handler.callback(fragment);\n\
          return true;\n\
        }\n\
      });\n\
    },\n\
\n\
    // Save a fragment into the hash history, or replace the URL state if the\n\
    // 'replace' option is passed. You are responsible for properly URL-encoding\n\
    // the fragment in advance.\n\
    //\n\
    // The options object can contain `trigger: true` if you wish to have the\n\
    // route callback be fired (not usually desirable), or `replace: true`, if\n\
    // you wish to modify the current URL without adding an entry to the history.\n\
    navigate: function(fragment, options) {\n\
      if (!History.started) return false;\n\
      if (!options || options === true) options = {trigger: !!options};\n\
\n\
      var url = this.root + (fragment = this.getFragment(fragment || ''));\n\
\n\
      // Strip the hash for matching.\n\
      fragment = fragment.replace(pathStripper, '');\n\
\n\
      if (this.fragment === fragment) return;\n\
      this.fragment = fragment;\n\
\n\
      // Don't include a trailing slash on the root.\n\
      if (fragment === '' && url !== '/') url = url.slice(0, -1);\n\
\n\
      // If pushState is available, we use it to set the fragment as a real URL.\n\
      if (this._hasPushState) {\n\
        this.history[options.replace ? 'replaceState' : 'pushState']({}, document.title, url);\n\
\n\
      // If hash changes haven't been explicitly disabled, update the hash\n\
      // fragment to store history.\n\
      } else if (this._wantsHashChange) {\n\
        this._updateHash(this.location, fragment, options.replace);\n\
        if (this.iframe && (fragment !== this.getFragment(this.getHash(this.iframe)))) {\n\
          // Opening and closing the iframe tricks IE7 and earlier to push a\n\
          // history entry on hash-tag change.  When replace is true, we don't\n\
          // want this.\n\
          if(!options.replace) this.iframe.document.open().close();\n\
          this._updateHash(this.iframe.location, fragment, options.replace);\n\
        }\n\
\n\
      // If you've told us that you explicitly don't want fallback hashchange-\n\
      // based history, then `navigate` becomes a page refresh.\n\
      } else {\n\
        return this.location.assign(url);\n\
      }\n\
      if (options.trigger) return this.loadUrl(fragment);\n\
    },\n\
\n\
    // Update the hash location, either replacing the current entry, or adding\n\
    // a new one to the browser history.\n\
    _updateHash: function(location, fragment, replace) {\n\
      if (replace) {\n\
        var href = location.href.replace(/(javascript:|#).*$/, '');\n\
        location.replace(href + '#' + fragment);\n\
      } else {\n\
        // Some browsers require that `hash` contains a leading #.\n\
        location.hash = '#' + fragment;\n\
      }\n\
    }\n\
\n\
  });\n\
\n\
  // Create the default Backbone.history.\n\
  Backbone.history = new History;\n\
\n\
  // Helpers\n\
  // -------\n\
\n\
  // Helper function to correctly set up the prototype chain, for subclasses.\n\
  // Similar to `goog.inherits`, but uses a hash of prototype properties and\n\
  // class properties to be extended.\n\
  var extend = function(protoProps, staticProps) {\n\
    var parent = this;\n\
    var child;\n\
\n\
    // The constructor function for the new subclass is either defined by you\n\
    // (the \"constructor\" property in your `extend` definition), or defaulted\n\
    // by us to simply call the parent's constructor.\n\
    if (protoProps && _.has(protoProps, 'constructor')) {\n\
      child = protoProps.constructor;\n\
    } else {\n\
      child = function(){ return parent.apply(this, arguments); };\n\
    }\n\
\n\
    // Add static properties to the constructor function, if supplied.\n\
    _.extend(child, parent, staticProps);\n\
\n\
    // Set the prototype chain to inherit from `parent`, without calling\n\
    // `parent`'s constructor function.\n\
    var Surrogate = function(){ this.constructor = child; };\n\
    Surrogate.prototype = parent.prototype;\n\
    child.prototype = new Surrogate;\n\
\n\
    // Add prototype properties (instance properties) to the subclass,\n\
    // if supplied.\n\
    if (protoProps) _.extend(child.prototype, protoProps);\n\
\n\
    // Set a convenience property in case the parent's prototype is needed\n\
    // later.\n\
    child.__super__ = parent.prototype;\n\
\n\
    return child;\n\
  };\n\
\n\
  // Set up inheritance for the model, collection, router, view and history.\n\
  Model.extend = Collection.extend = Router.extend = View.extend = History.extend = extend;\n\
\n\
  // Throw an error when a URL is needed, and none is supplied.\n\
  var urlError = function() {\n\
    throw new Error('A \"url\" property or function must be specified');\n\
  };\n\
\n\
  // Wrap an optional error callback with a fallback error event.\n\
  var wrapError = function(model, options) {\n\
    var error = options.error;\n\
    options.error = function(resp) {\n\
      if (error) error(model, resp, options);\n\
      model.trigger('error', model, resp, options);\n\
    };\n\
  };\n\
\n\
  return Backbone;\n\
\n\
}));\n\
//@ sourceURL=jashkenas-backbone/backbone.js"
));
require.register("lodash-lodash/index.js", Function("exports, require, module",
"module.exports = require('./dist/lodash.compat.js');//@ sourceURL=lodash-lodash/index.js"
));
require.register("lodash-lodash/dist/lodash.compat.js", Function("exports, require, module",
"/**\n\
 * @license\n\
 * Lo-Dash 2.4.1 (Custom Build) <http://lodash.com/>\n\
 * Build: `lodash -o ./dist/lodash.compat.js`\n\
 * Copyright 2012-2014 The Dojo Foundation <http://dojofoundation.org/>\n\
 * Based on Underscore.js 1.6.0 <http://underscorejs.org/LICENSE>\n\
 * Copyright 2009-2013 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors\n\
 * Available under MIT license <http://lodash.com/license>\n\
 */\n\
;(function() {\n\
\n\
  /** Used as a safe reference for `undefined` in pre ES5 environments */\n\
  var undefined;\n\
\n\
  /** Used to compose bitmasks for wrapper metadata */\n\
  var BIND_FLAG = 1,\n\
      BIND_KEY_FLAG = 2,\n\
      CURRY_FLAG = 4,\n\
      CURRY_BOUND_FLAG = 8,\n\
      PARTIAL_FLAG = 16,\n\
      PARTIAL_RIGHT_FLAG = 32;\n\
\n\
  /** Used as the size when optimizations are enabled for arrays */\n\
  var LARGE_ARRAY_SIZE = 40;\n\
\n\
  /** Used as the max size of the `arrayPool` and `objectPool` */\n\
  var MAX_POOL_SIZE = 40;\n\
\n\
  /** Used as the semantic version number */\n\
  var version = '2.4.1';\n\
\n\
  /** Used as the property name for wrapper metadata */\n\
  var expando = '__lodash@' + version + '__';\n\
\n\
  /** Used to generate unique IDs */\n\
  var idCounter = 0;\n\
\n\
  /** Used to match empty string literals in compiled template source */\n\
  var reEmptyStringLeading = /\\b__p \\+= '';/g,\n\
      reEmptyStringMiddle = /\\b(__p \\+=) '' \\+/g,\n\
      reEmptyStringTrailing = /(__e\\(.*?\\)|\\b__t\\)) \\+\\n\
'';/g;\n\
\n\
  /** Used to match HTML entities and HTML characters */\n\
  var reEscapedHtml = /&(?:amp|lt|gt|quot|#39);/g,\n\
      reUnescapedHtml = /[&<>\"']/g;\n\
\n\
  /** Used to match template delimiters */\n\
  var reEscape = /<%-([\\s\\S]+?)%>/g,\n\
      reEvaluate = /<%([\\s\\S]+?)%>/g,\n\
      reInterpolate = /<%=([\\s\\S]+?)%>/g;\n\
\n\
  /**\n\
   * Used to match ES6 template delimiters\n\
   * http://people.mozilla.org/~jorendorff/es6-draft.html#sec-literals-string-literals\n\
   */\n\
  var reEsTemplate = /\\$\\{([^\\\\}]*(?:\\\\.[^\\\\}]*)*)\\}/g;\n\
\n\
  /** Used to match regexp flags from their coerced string values */\n\
  var reFlags = /\\w*$/;\n\
\n\
  /** Used to detected named functions */\n\
  var reFuncName = /^\\s*function[ \\n\
\\r\\t]+\\w/;\n\
\n\
  /** Used to detect hexadecimal string values */\n\
  var reHexPrefix = /^0[xX]/;\n\
\n\
  /** Used to ensure capturing order of template delimiters */\n\
  var reNoMatch = /($^)/;\n\
\n\
  /** Used to detect functions containing a `this` reference */\n\
  var reThis = /\\bthis\\b/;\n\
\n\
  /** Used to match unescaped characters in compiled string literals */\n\
  var reUnescapedString = /['\\n\
\\r\\t\\u2028\\u2029\\\\]/g;\n\
\n\
  /** Used to detect and test whitespace */\n\
  var whitespace = (\n\
    // whitespace\n\
    ' \\t\\x0B\\f\\xA0\\ufeff' +\n\
\n\
    // line terminators\n\
    '\\n\
\\r\\u2028\\u2029' +\n\
\n\
    // unicode category \"Zs\" space separators\n\
    '\\u1680\\u180E\\u2000\\u2001\\u2002\\u2003\\u2004\\u2005\\u2006\\u2007\\u2008\\u2009\\u200a\\u202f\\u205f\\u3000'\n\
  );\n\
\n\
  /** Used to pool arrays and objects used internally */\n\
  var arrayPool = [],\n\
      objectPool = [];\n\
\n\
  /** Used to assign default `context` object properties */\n\
  var contextProps = [\n\
    'Array', 'Boolean', 'Date', 'Error', 'Function', 'Math', 'Number', 'Object',\n\
    'RegExp', 'Set', 'String', '_', 'clearTimeout', 'document', 'isFinite', 'isNaN',\n\
    'parseInt', 'setTimeout', 'TypeError', 'window', 'WinRTError'\n\
  ];\n\
\n\
  /** Used to fix the JScript [[DontEnum]] bug */\n\
  var shadowedProps = [\n\
    'constructor', 'hasOwnProperty', 'isPrototypeOf', 'propertyIsEnumerable',\n\
    'toLocaleString', 'toString', 'valueOf'\n\
  ];\n\
\n\
  /** Used to make template sourceURLs easier to identify */\n\
  var templateCounter = 0;\n\
\n\
  /** `Object#toString` result shortcuts */\n\
  var argsClass = '[object Arguments]',\n\
      arrayClass = '[object Array]',\n\
      boolClass = '[object Boolean]',\n\
      dateClass = '[object Date]',\n\
      errorClass = '[object Error]',\n\
      funcClass = '[object Function]',\n\
      numberClass = '[object Number]',\n\
      objectClass = '[object Object]',\n\
      regexpClass = '[object RegExp]',\n\
      stringClass = '[object String]';\n\
\n\
  /** Used to identify object classifications that `_.clone` supports */\n\
  var cloneableClasses = {};\n\
  cloneableClasses[funcClass] = false;\n\
  cloneableClasses[argsClass] = cloneableClasses[arrayClass] =\n\
  cloneableClasses[boolClass] = cloneableClasses[dateClass] =\n\
  cloneableClasses[numberClass] = cloneableClasses[objectClass] =\n\
  cloneableClasses[regexpClass] = cloneableClasses[stringClass] = true;\n\
\n\
  /** Used as an internal `_.debounce` options object */\n\
  var debounceOptions = {\n\
    'leading': false,\n\
    'maxWait': 0,\n\
    'trailing': false\n\
  };\n\
\n\
  /** Used as the property descriptor for wrapper metadata */\n\
  var descriptor = {\n\
    'configurable': false,\n\
    'enumerable': false,\n\
    'value': null,\n\
    'writable': false\n\
  };\n\
\n\
  /**\n\
   * Used to convert characters to HTML entities.\n\
   *\n\
   * Note: Though the \">\" character is escaped for symmetry, characters like\n\
   * \">\", \"`\", and \"/\" don't require escaping in HTML and have no special meaning\n\
   * unless they're part of a tag or unquoted attribute value.\n\
   * See [Mathias' article](http://mathiasbynens.be/notes/ambiguous-ampersands)\n\
   * (under \"semi-related fun fact\") for more details.\n\
   */\n\
  var htmlEscapes = {\n\
    '&': '&amp;',\n\
    '<': '&lt;',\n\
    '>': '&gt;',\n\
    '\"': '&quot;',\n\
    \"'\": '&#39;'\n\
  };\n\
\n\
  /** Used to convert HTML entities to characters */\n\
  var htmlUnescapes = {\n\
    '&amp;': '&',\n\
    '&lt;': '<',\n\
    '&gt;': '>',\n\
    '&quot;': '\"',\n\
    '&#39;': \"'\"\n\
  };\n\
\n\
  /** Used to determine if values are of the language type Object */\n\
  var objectTypes = {\n\
    'function': true,\n\
    'object': true\n\
  };\n\
\n\
  /** Used to escape characters for inclusion in compiled string literals */\n\
  var stringEscapes = {\n\
    '\\\\': '\\\\',\n\
    \"'\": \"'\",\n\
    '\\n\
': 'n',\n\
    '\\r': 'r',\n\
    '\\t': 't',\n\
    '\\u2028': 'u2028',\n\
    '\\u2029': 'u2029'\n\
  };\n\
\n\
  /** Used as a reference to the global object */\n\
  var root = (objectTypes[typeof window] && window) || this;\n\
\n\
  /** Detect free variable `exports` */\n\
  var freeExports = objectTypes[typeof exports] && exports && !exports.nodeType && exports;\n\
\n\
  /** Detect free variable `module` */\n\
  var freeModule = objectTypes[typeof module] && module && !module.nodeType && module;\n\
\n\
  /** Detect free variable `global` from Node.js or Browserified code and use it as `root` */\n\
  var freeGlobal = freeExports && freeModule && typeof global == 'object' && global;\n\
  if (freeGlobal && (freeGlobal.global === freeGlobal || freeGlobal.window === freeGlobal || freeGlobal.self === freeGlobal)) {\n\
    root = freeGlobal;\n\
  }\n\
\n\
  /** Detect the popular CommonJS extension `module.exports` */\n\
  var moduleExports = freeModule && freeModule.exports === freeExports && freeExports;\n\
\n\
  /*--------------------------------------------------------------------------*/\n\
\n\
  /**\n\
   * The base implementation of `compareAscending` used to compare values and\n\
   * sort them in ascending order without guaranteeing a stable sort.\n\
   *\n\
   * @private\n\
   * @param {*} a The value to compare to `b`.\n\
   * @param {*} b The value to compare to `a`.\n\
   * @returns {number} Returns the sort order indicator for `a`.\n\
   */\n\
  function baseCompareAscending(a, b) {\n\
    if (a !== b) {\n\
      if (a > b || typeof a == 'undefined') {\n\
        return 1;\n\
      }\n\
      if (a < b || typeof b == 'undefined') {\n\
        return -1;\n\
      }\n\
    }\n\
    return 0;\n\
  }\n\
\n\
  /**\n\
   * The base implementation of `_.indexOf` without support for binary searches.\n\
   *\n\
   * @private\n\
   * @param {Array} array The array to search.\n\
   * @param {*} value The value to search for.\n\
   * @param {number} [fromIndex=0] The index to search from.\n\
   * @returns {number} Returns the index of the matched value or `-1`.\n\
   */\n\
  function baseIndexOf(array, value, fromIndex) {\n\
    var index = (fromIndex || 0) - 1,\n\
        length = array ? array.length : 0;\n\
\n\
    while (++index < length) {\n\
      if (array[index] === value) {\n\
        return index;\n\
      }\n\
    }\n\
    return -1;\n\
  }\n\
\n\
  /**\n\
   * An implementation of `_.contains` for cache objects that mimics the return\n\
   * signature of `_.indexOf` by returning `0` if the value is found, else `-1`.\n\
   *\n\
   * @private\n\
   * @param {Object} cache The cache object to inspect.\n\
   * @param {*} value The value to search for.\n\
   * @returns {number} Returns `0` if `value` is found, else `-1`.\n\
   */\n\
  function cacheIndexOf(cache, value) {\n\
    return cache.has(value) ? 0 : -1;\n\
  }\n\
\n\
  /**\n\
   * Used by `_.max` and `_.min` as the default callback when a given\n\
   * collection is a string value.\n\
   *\n\
   * @private\n\
   * @param {string} value The character to inspect.\n\
   * @returns {number} Returns the code unit of given character.\n\
   */\n\
  function charAtCallback(value) {\n\
    return value.charCodeAt(0);\n\
  }\n\
\n\
  /**\n\
   * Gets the index of the first character of `string` that is not found in `chars`.\n\
   *\n\
   * @private\n\
   * @param {string} string The string to inspect.\n\
   * @returns {number} Returns the index of the first character not found in `chars`.\n\
   */\n\
  function charsLeftIndex(string, chars) {\n\
    var index = -1,\n\
        length = string.length;\n\
\n\
    while (++index < length) {\n\
      if (chars.indexOf(string.charAt(index)) < 0) {\n\
        break;\n\
      }\n\
    }\n\
    return index;\n\
  }\n\
\n\
  /**\n\
   * Gets the index of the last character of `string` that is not found in `chars`.\n\
   *\n\
   * @private\n\
   * @param {string} string The string to inspect.\n\
   * @returns {number} Returns the index of the last character not found in `chars`.\n\
   */\n\
  function charsRightIndex(string, chars) {\n\
    var index = string.length;\n\
    while (index--) {\n\
      if (chars.indexOf(string.charAt(index)) < 0) {\n\
        break;\n\
      }\n\
    }\n\
    return index;\n\
  }\n\
\n\
  /**\n\
   * Used by `sortBy` to compare transformed elements of a collection and stable\n\
   * sort them in ascending order.\n\
   *\n\
   * @private\n\
   * @param {Object} a The object to compare to `b`.\n\
   * @param {Object} b The object to compare to `a`.\n\
   * @returns {number} Returns the sort order indicator for `a`.\n\
   */\n\
  function compareAscending(a, b) {\n\
    return baseCompareAscending(a.criteria, b.criteria) || a.index - b.index;\n\
  }\n\
\n\
  /**\n\
   * Used by `sortBy` to compare multiple properties of each element in a\n\
   * collection and stable sort them in ascending order.\n\
   *\n\
   * @private\n\
   * @param {Object} a The object to compare to `b`.\n\
   * @param {Object} b The object to compare to `a`.\n\
   * @returns {number} Returns the sort order indicator for `a`.\n\
   */\n\
  function compareMultipleAscending(a, b) {\n\
    var ac = a.criteria,\n\
        bc = b.criteria,\n\
        index = -1,\n\
        length = ac.length;\n\
\n\
    while (++index < length) {\n\
      var result = baseCompareAscending(ac[index], bc[index]);\n\
      if (result) {\n\
        return result;\n\
      }\n\
    }\n\
    // Fixes an `Array#sort` bug in the JS engine embedded in Adobe applications\n\
    // that causes it, under certain circumstances, to provided the same value\n\
    // for `a` and `b`. See https://github.com/jashkenas/underscore/pull/1247\n\
    //\n\
    // This also ensures a stable sort in V8 and other engines.\n\
    // See https://code.google.com/p/v8/issues/detail?id=90\n\
    return a.index - b.index;\n\
  }\n\
\n\
  /**\n\
   * Used by `escape` to convert characters to HTML entities.\n\
   *\n\
   * @private\n\
   * @param {string} match The matched character to escape.\n\
   * @returns {string} Returns the escaped character.\n\
   */\n\
  function escapeHtmlChar(match) {\n\
    return htmlEscapes[match];\n\
  }\n\
\n\
  /**\n\
   * Used by `template` to escape characters for inclusion in compiled\n\
   * string literals.\n\
   *\n\
   * @private\n\
   * @param {string} match The matched character to escape.\n\
   * @returns {string} Returns the escaped character.\n\
   */\n\
  function escapeStringChar(match) {\n\
    return '\\\\' + stringEscapes[match];\n\
  }\n\
\n\
  /**\n\
   * Gets an array from the array pool or creates a new one if the pool is empty.\n\
   *\n\
   * @private\n\
   * @returns {Array} The array from the pool.\n\
   */\n\
  function getArray() {\n\
    return arrayPool.pop() || [];\n\
  }\n\
\n\
  /**\n\
   * Gets an object from the object pool or creates a new one if the pool is empty.\n\
   *\n\
   * @private\n\
   * @returns {Object} The object from the pool.\n\
   */\n\
  function getObject() {\n\
    return objectPool.pop() || {\n\
      'criteria': null,\n\
      'index': 0,\n\
      'value': null\n\
    };\n\
  }\n\
\n\
  /**\n\
   * Checks if `value` is a DOM node in IE < 9.\n\
   *\n\
   * @private\n\
   * @param {*} value The value to check.\n\
   * @returns {boolean} Returns `true` if the `value` is a DOM node, else `false`.\n\
   */\n\
  function isNode(value) {\n\
    // IE < 9 presents DOM nodes as `Object` objects except they have `toString`\n\
    // methods that are `typeof` \"string\" and still can coerce nodes to strings\n\
    return typeof value.toString != 'function' && typeof (value + '') == 'string';\n\
  }\n\
\n\
  /**\n\
   * Releases `array` back to the array pool.\n\
   *\n\
   * @private\n\
   * @param {Array} array The array to release.\n\
   */\n\
  function releaseArray(array) {\n\
    array.length = 0;\n\
    if (arrayPool.length < MAX_POOL_SIZE) {\n\
      arrayPool.push(array);\n\
    }\n\
  }\n\
\n\
  /**\n\
   * Releases `object` back to the object pool.\n\
   *\n\
   * @private\n\
   * @param {Object} object The object to release.\n\
   */\n\
  function releaseObject(object) {\n\
    object.criteria = object.value = null;\n\
    if (objectPool.length < MAX_POOL_SIZE) {\n\
      objectPool.push(object);\n\
    }\n\
  }\n\
\n\
  /**\n\
   * A fallback implementation of `trim` to remove leading and trailing\n\
   * whitespace or specified characters from `string`.\n\
   *\n\
   * @private\n\
   * @param {string} string The string to trim.\n\
   * @param {string} [chars=whitespace] The characters to trim.\n\
   * @returns {string} Returns the trimmed string.\n\
   */\n\
  function shimTrim(string, chars) {\n\
    string = string == null ? '' : String(string);\n\
    if (!string) {\n\
      return string;\n\
    }\n\
    if (chars == null) {\n\
      return string.slice(trimmedLeftIndex(string), trimmedRightIndex(string) + 1);\n\
    }\n\
    chars = String(chars);\n\
    return string.slice(charsLeftIndex(string, chars), charsRightIndex(string, chars) + 1);\n\
  }\n\
\n\
  /**\n\
   * A fallback implementation of `trimLeft` to remove leading whitespace or\n\
   * specified characters from `string`.\n\
   *\n\
   * @private\n\
   * @param {string} string The string to trim.\n\
   * @param {string} [chars=whitespace] The characters to trim.\n\
   * @returns {string} Returns the trimmed string.\n\
   */\n\
  function shimTrimLeft(string, chars) {\n\
    string = string == null ? '' : String(string);\n\
    if (!string) {\n\
      return string;\n\
    }\n\
    if (chars == null) {\n\
      return string.slice(trimmedLeftIndex(string))\n\
    }\n\
    chars = String(chars);\n\
    return string.slice(charsLeftIndex(string, chars));\n\
  }\n\
\n\
  /**\n\
   * A fallback implementation of `trimRight` to remove trailing whitespace or\n\
   * specified characters from `string`.\n\
   *\n\
   * @private\n\
   * @param {string} string The string to trim.\n\
   * @param {string} [chars=whitespace] The characters to trim.\n\
   * @returns {string} Returns the trimmed string.\n\
   */\n\
  function shimTrimRight(string, chars) {\n\
    string = string == null ? '' : String(string);\n\
    if (!string) {\n\
      return string;\n\
    }\n\
    if (chars == null) {\n\
      return string.slice(0, trimmedRightIndex(string) + 1)\n\
    }\n\
    chars = String(chars);\n\
    return string.slice(0, charsRightIndex(string, chars) + 1);\n\
  }\n\
\n\
  /**\n\
   * Gets the index of the first non-whitespace character of `string`.\n\
   *\n\
   * @private\n\
   * @param {string} string The string to inspect.\n\
   * @returns {number} Returns the index of the first non-whitespace character.\n\
   */\n\
  function trimmedLeftIndex(string) {\n\
    var index = -1,\n\
        length = string.length;\n\
\n\
    while (++index < length) {\n\
      var c = string.charCodeAt(index);\n\
      if (!((c <= 160 && (c >= 9 && c <= 13) || c == 32 || c == 160) || c == 5760 || c == 6158 ||\n\
          (c >= 8192 && (c <= 8202 || c == 8232 || c == 8233 || c == 8239 || c == 8287 || c == 12288 || c == 65279)))) {\n\
        break;\n\
      }\n\
    }\n\
    return index;\n\
  }\n\
\n\
  /**\n\
   * Gets the index of the last non-whitespace character of `string`.\n\
   *\n\
   * @private\n\
   * @param {string} string The string to inspect.\n\
   * @returns {number} Returns the index of the last non-whitespace character.\n\
   */\n\
  function trimmedRightIndex(string) {\n\
    var index = string.length;\n\
    while (index--) {\n\
      var c = string.charCodeAt(index);\n\
      if (!((c <= 160 && (c >= 9 && c <= 13) || c == 32 || c == 160) || c == 5760 || c == 6158 ||\n\
          (c >= 8192 && (c <= 8202 || c == 8232 || c == 8233 || c == 8239 || c == 8287 || c == 12288 || c == 65279)))) {\n\
        break;\n\
      }\n\
    }\n\
    return index;\n\
  }\n\
\n\
  /**\n\
   * Used by `unescape` to convert HTML entities to characters.\n\
   *\n\
   * @private\n\
   * @param {string} match The matched character to unescape.\n\
   * @returns {string} Returns the unescaped character.\n\
   */\n\
  function unescapeHtmlChar(match) {\n\
    return htmlUnescapes[match];\n\
  }\n\
\n\
  /*--------------------------------------------------------------------------*/\n\
\n\
  /**\n\
   * Create a new `lodash` function using the given context object.\n\
   *\n\
   * @static\n\
   * @memberOf _\n\
   * @category Utilities\n\
   * @param {Object} [context=root] The context object.\n\
   * @returns {Function} Returns a new `lodash` function.\n\
   */\n\
  function runInContext(context) {\n\
    // Avoid issues with some ES3 environments that attempt to use values, named\n\
    // after built-in constructors like `Object`, for the creation of literals.\n\
    // ES5 clears this up by stating that literals must use built-in constructors.\n\
    // See http://es5.github.io/#x11.1.5.\n\
    context = context ? _.defaults(root.Object(), context, _.pick(root, contextProps)) : root;\n\
\n\
    /** Native constructor references */\n\
    var Array = context.Array,\n\
        Boolean = context.Boolean,\n\
        Date = context.Date,\n\
        Error = context.Error,\n\
        Function = context.Function,\n\
        Math = context.Math,\n\
        Number = context.Number,\n\
        Object = context.Object,\n\
        RegExp = context.RegExp,\n\
        String = context.String,\n\
        TypeError = context.TypeError;\n\
\n\
    /** Used for native method references */\n\
    var arrayRef = Array.prototype,\n\
        errorProto = Error.prototype,\n\
        objectProto = Object.prototype,\n\
        stringProto = String.prototype;\n\
\n\
    /** Used to detect DOM support */\n\
    var document = (document = context.window) && document.document;\n\
\n\
    /** Used to restore the original `_` reference in `noConflict` */\n\
    var oldDash = context._;\n\
\n\
    /** Used to resolve the internal [[Class]] of values */\n\
    var toString = objectProto.toString;\n\
\n\
    /** Used to detect if a method is native */\n\
    var reNative = RegExp('^' +\n\
      String(toString)\n\
        .replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&')\n\
        .replace(/toString|(function).*?(?=\\\\\\()| for .+?(?=\\\\\\])/g, '$1.*?') + '$'\n\
    );\n\
\n\
    /** Native method shortcuts */\n\
    var ceil = Math.ceil,\n\
        clearTimeout = context.clearTimeout,\n\
        floor = Math.floor,\n\
        fnToString = Function.prototype.toString,\n\
        getPrototypeOf = isNative(getPrototypeOf = Object.getPrototypeOf) && getPrototypeOf,\n\
        hasOwnProperty = objectProto.hasOwnProperty,\n\
        push = arrayRef.push,\n\
        propertyIsEnumerable = objectProto.propertyIsEnumerable,\n\
        Set = isNative(Set = context.Set) && Set,\n\
        setTimeout = context.setTimeout,\n\
        splice = arrayRef.splice,\n\
        unshift = arrayRef.unshift;\n\
\n\
    /** Used to set meta data on functions */\n\
    var defineProperty = (function() {\n\
      // IE 8 only accepts DOM elements\n\
      try {\n\
        var o = {},\n\
            func = isNative(func = Object.defineProperty) && func,\n\
            result = func(o, o, o) && func;\n\
      } catch(e) { }\n\
      return result;\n\
    }());\n\
\n\
    /* Native method shortcuts for methods with the same name as other `lodash` methods */\n\
    var nativeContains = isNative(nativeContains = stringProto.contains) && nativeContains,\n\
        nativeCreate = isNative(nativeCreate = Object.create) && nativeCreate,\n\
        nativeIsArray = isNative(nativeIsArray = Array.isArray) && nativeIsArray,\n\
        nativeIsFinite = context.isFinite,\n\
        nativeIsNaN = context.isNaN,\n\
        nativeKeys = isNative(nativeKeys = Object.keys) && nativeKeys,\n\
        nativeMax = Math.max,\n\
        nativeMin = Math.min,\n\
        nativeNow = isNative(nativeNow = Date.now) && nativeNow,\n\
        nativeParseInt = context.parseInt,\n\
        nativeRandom = Math.random,\n\
        nativeTrim = isNative(nativeTrim = stringProto.trim) && !nativeTrim.call(whitespace) && nativeTrim,\n\
        nativeTrimLeft = isNative(nativeTrimLeft = stringProto.trimLeft) && !nativeTrimLeft.call(whitespace) && nativeTrimLeft,\n\
        nativeTrimRight = isNative(nativeTrimRight = stringProto.trimRight) && !nativeTrimRight.call(whitespace) && nativeTrimRight;\n\
\n\
    /** Used to lookup a built-in constructor by [[Class]] */\n\
    var ctorByClass = {};\n\
    ctorByClass[arrayClass] = Array;\n\
    ctorByClass[boolClass] = Boolean;\n\
    ctorByClass[dateClass] = Date;\n\
    ctorByClass[funcClass] = Function;\n\
    ctorByClass[objectClass] = Object;\n\
    ctorByClass[numberClass] = Number;\n\
    ctorByClass[regexpClass] = RegExp;\n\
    ctorByClass[stringClass] = String;\n\
\n\
    /** Used to avoid iterating non-enumerable properties in IE < 9 */\n\
    var nonEnumProps = {};\n\
    nonEnumProps[arrayClass] = nonEnumProps[dateClass] = nonEnumProps[numberClass] = { 'constructor': true, 'toLocaleString': true, 'toString': true, 'valueOf': true };\n\
    nonEnumProps[boolClass] = nonEnumProps[stringClass] = { 'constructor': true, 'toString': true, 'valueOf': true };\n\
    nonEnumProps[errorClass] = nonEnumProps[funcClass] = nonEnumProps[regexpClass] = { 'constructor': true, 'toString': true };\n\
    nonEnumProps[objectClass] = { 'constructor': true };\n\
\n\
    (function() {\n\
      var length = shadowedProps.length;\n\
      while (length--) {\n\
        var key = shadowedProps[length];\n\
        for (var className in nonEnumProps) {\n\
          if (hasOwnProperty.call(nonEnumProps, className) && !hasOwnProperty.call(nonEnumProps[className], key)) {\n\
            nonEnumProps[className][key] = false;\n\
          }\n\
        }\n\
      }\n\
    }());\n\
\n\
    /*--------------------------------------------------------------------------*/\n\
\n\
    /**\n\
     * Creates a `lodash` object which wraps the given value to enable intuitive\n\
     * method chaining.\n\
     *\n\
     * In addition to Lo-Dash methods, wrappers also have the following `Array` methods:\n\
     * `concat`, `join`, `pop`, `push`, `reverse`, `shift`, `slice`, `sort`, `splice`,\n\
     * and `unshift`\n\
     *\n\
     * Chaining is supported in custom builds as long as the `value` method is\n\
     * implicitly or explicitly included in the build.\n\
     *\n\
     * The chainable wrapper functions are:\n\
     * `after`, `assign`, `bind`, `bindAll`, `bindKey`, `chain`, `compact`,\n\
     * `compose`, `concat`, `constant`, `countBy`, `create`, `createCallback`,\n\
     * `curry`, `debounce`, `defaults`, `defer`, `delay`, `difference`, `filter`,\n\
     * `flatten`, `forEach`, `forEachRight`, `forIn`, `forInRight`, `forOwn`,\n\
     * `forOwnRight`, `functions`, `groupBy`, `indexBy`, `initial`, `intersection`,\n\
     * `invert`, `invoke`, `keys`, `map`, `mapValues`, `matches`, `max`, `memoize`,\n\
     * `merge`, `min`, `noop`, `object`, `omit`, `once`, `pairs`, `partial`,\n\
     * `partialRight`, `pick`, `pluck`, `property`, `pull`, `push`, `range`,\n\
     * `reject`, `remove`, `rest`, `reverse`, `shuffle`, `slice`, `sort`, `sortBy`,\n\
     * `splice`, `tap`, `throttle`, `times`, `toArray`, `transform`, `union`,\n\
     * `uniq`, `unshift`, `unzip`, `values`, `where`, `without`, `wrap`, `xor`,\n\
     * and `zip`\n\
     *\n\
     * The non-chainable wrapper functions are:\n\
     * `capitalize`, `clone`, `cloneDeep`, `contains`, `escape`, `every`, `find`,\n\
     * `findIndex`, `findKey`, `findLast`, `findLastIndex`, `findLastKey`, `has`,\n\
     * `identity`, `indexOf`, `isArguments`, `isArray`, `isBoolean`, `isDate`,\n\
     * `isElement`, `isEmpty`, `isEqual`, `isFinite`, `isFunction`, `isNaN`,\n\
     * `isNull`, `isNumber`, `isObject`, `isPlainObject`, `isRegExp`, `isString`,\n\
     * `isUndefined`, `join`, `lastIndexOf`, `mixin`, `noConflict`, `now`,\n\
     * `parseInt`, `pop`, `random`, `reduce`, `reduceRight`, `result`, `shift`,\n\
     * `size`, `some`, `sortedIndex`, `runInContext`, `template`, `trim`,\n\
     * `trimLeft`, `trimRight`, `unescape`, `uniqueId`, and `value`\n\
     *\n\
     * The wrapper functions `first`, `last`, and `sample` return wrapped values\n\
     * when `n` is provided, otherwise they return unwrapped values.\n\
     *\n\
     * Explicit chaining can be enabled by using the `_.chain` method.\n\
     *\n\
     * @name _\n\
     * @constructor\n\
     * @category Chaining\n\
     * @param {*} value The value to wrap in a `lodash` instance.\n\
     * @returns {Object} Returns a `lodash` instance.\n\
     * @example\n\
     *\n\
     * var wrapped = _([1, 2, 3]);\n\
     *\n\
     * // returns an unwrapped value\n\
     * wrapped.reduce(function(sum, num) {\n\
     *   return sum + num;\n\
     * });\n\
     * // => 6\n\
     *\n\
     * // returns a wrapped value\n\
     * var squares = wrapped.map(function(num) {\n\
     *   return num * num;\n\
     * });\n\
     *\n\
     * _.isArray(squares);\n\
     * // => false\n\
     *\n\
     * _.isArray(squares.value());\n\
     * // => true\n\
     */\n\
    function lodash(value) {\n\
      // don't wrap if already wrapped, even if wrapped by a different `lodash` constructor\n\
      return (value && typeof value == 'object' && !isArray(value) && hasOwnProperty.call(value, '__wrapped__'))\n\
       ? value\n\
       : new lodashWrapper(value);\n\
    }\n\
\n\
    /**\n\
     * A fast path for creating `lodash` wrapper objects.\n\
     *\n\
     * @private\n\
     * @param {*} value The value to wrap in a `lodash` instance.\n\
     * @param {boolean} [chainAll=false] A flag to enable chaining for all methods\n\
     * @returns {Object} Returns a `lodash` instance.\n\
     */\n\
    function lodashWrapper(value, chainAll) {\n\
      this.__chain__ = !!chainAll;\n\
      this.__wrapped__ = value;\n\
    }\n\
    // ensure `new lodashWrapper` is an instance of `lodash`\n\
    lodashWrapper.prototype = lodash.prototype;\n\
\n\
    /**\n\
     * An object used to flag environments features.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @type Object\n\
     */\n\
    var support = lodash.support = {};\n\
\n\
    (function() {\n\
      var ctor = function() { this.x = 1; },\n\
          object = { '0': 1, 'length': 1 },\n\
          props = [];\n\
\n\
      ctor.prototype = { 'valueOf': 1, 'y': 1 };\n\
      for (var key in new ctor) { props.push(key); }\n\
      for (key in arguments) { }\n\
\n\
      /**\n\
       * Detect if an `arguments` object's [[Class]] is resolvable (all but Firefox < 4, IE < 9).\n\
       *\n\
       * @memberOf _.support\n\
       * @type boolean\n\
       */\n\
      support.argsClass = toString.call(arguments) == argsClass;\n\
\n\
      /**\n\
       * Detect if `arguments` objects are `Object` objects (all but Narwhal and Opera < 10.5).\n\
       *\n\
       * @memberOf _.support\n\
       * @type boolean\n\
       */\n\
      support.argsObject = arguments.constructor == Object && !(arguments instanceof Array);\n\
\n\
      /**\n\
       * Detect if `name` or `message` properties of `Error.prototype` are\n\
       * enumerable by default. (IE < 9, Safari < 5.1)\n\
       *\n\
       * @memberOf _.support\n\
       * @type boolean\n\
       */\n\
      support.enumErrorProps = propertyIsEnumerable.call(errorProto, 'message') || propertyIsEnumerable.call(errorProto, 'name');\n\
\n\
      /**\n\
       * Detect if `prototype` properties are enumerable by default.\n\
       *\n\
       * Firefox < 3.6, Opera > 9.50 - Opera < 11.60, and Safari < 5.1\n\
       * (if the prototype or a property on the prototype has been set)\n\
       * incorrectly sets a function's `prototype` property [[Enumerable]]\n\
       * value to `true`.\n\
       *\n\
       * @memberOf _.support\n\
       * @type boolean\n\
       */\n\
      support.enumPrototypes = propertyIsEnumerable.call(ctor, 'prototype');\n\
\n\
      /**\n\
       * Detect if functions can be decompiled by `Function#toString`\n\
       * (all but PS3 and older Opera mobile browsers & avoided in Windows 8 apps).\n\
       *\n\
       * @memberOf _.support\n\
       * @type boolean\n\
       */\n\
      support.funcDecomp = !isNative(context.WinRTError) && reThis.test(runInContext);\n\
\n\
      /**\n\
       * Detect if `Function#name` is supported (all but IE).\n\
       *\n\
       * @memberOf _.support\n\
       * @type boolean\n\
       */\n\
      support.funcNames = typeof Function.name == 'string';\n\
\n\
      /**\n\
       * Detect if `arguments` object indexes are non-enumerable\n\
       * (Firefox < 4, IE < 9, PhantomJS, Safari < 5.1).\n\
       *\n\
       * @memberOf _.support\n\
       * @type boolean\n\
       */\n\
      support.nonEnumArgs = key != 0;\n\
\n\
      /**\n\
       * Detect if properties shadowing those on `Object.prototype` are non-enumerable.\n\
       *\n\
       * In IE < 9 an objects own properties, shadowing non-enumerable ones, are\n\
       * made non-enumerable as well (a.k.a the JScript [[DontEnum]] bug).\n\
       *\n\
       * @memberOf _.support\n\
       * @type boolean\n\
       */\n\
      support.nonEnumShadows = !/valueOf/.test(props);\n\
\n\
      /**\n\
       * Detect if own properties are iterated after inherited properties (all but IE < 9).\n\
       *\n\
       * @memberOf _.support\n\
       * @type boolean\n\
       */\n\
      support.ownLast = props[0] != 'x';\n\
\n\
      /**\n\
       * Detect if `Array#shift` and `Array#splice` augment array-like objects correctly.\n\
       *\n\
       * Firefox < 10, IE compatibility mode, and IE < 9 have buggy Array `shift()`\n\
       * and `splice()` functions that fail to remove the last element, `value[0]`,\n\
       * of array-like objects even though the `length` property is set to `0`.\n\
       * The `shift()` method is buggy in IE 8 compatibility mode, while `splice()`\n\
       * is buggy regardless of mode in IE < 9 and buggy in compatibility mode in IE 9.\n\
       *\n\
       * @memberOf _.support\n\
       * @type boolean\n\
       */\n\
      support.spliceObjects = (splice.call(object, 0, 1), !object[0]);\n\
\n\
      /**\n\
       * Detect lack of support for accessing string characters by index.\n\
       *\n\
       * IE < 8 can't access characters by index and IE 8 can only access\n\
       * characters by index on string literals.\n\
       *\n\
       * @memberOf _.support\n\
       * @type boolean\n\
       */\n\
      support.unindexedChars = ('x'[0] + Object('x')[0]) != 'xx';\n\
\n\
      /**\n\
       * Detect if the DOM is supported.\n\
       *\n\
       * @memberOf _.support\n\
       * @type boolean\n\
       */\n\
      try {\n\
        support.dom = document.createDocumentFragment().nodeType === 11;\n\
      } catch(e) {\n\
        support.dom = false;\n\
      }\n\
\n\
      /**\n\
       * Detect if a DOM node's [[Class]] is resolvable (all but IE < 9)\n\
       * and that the JS engine errors when attempting to coerce an object to\n\
       * a string without a `toString` function.\n\
       *\n\
       * @memberOf _.support\n\
       * @type boolean\n\
       */\n\
      try {\n\
        support.nodeClass = !(toString.call(document) == objectClass && !({ 'toString': 0 } + ''));\n\
      } catch(e) {\n\
        support.nodeClass = true;\n\
      }\n\
    }(1));\n\
\n\
    /**\n\
     * By default, the template delimiters used by Lo-Dash are similar to those in\n\
     * embedded Ruby (ERB). Change the following template settings to use alternative\n\
     * delimiters.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @type Object\n\
     */\n\
    lodash.templateSettings = {\n\
\n\
      /**\n\
       * Used to detect `data` property values to be HTML-escaped.\n\
       *\n\
       * @memberOf _.templateSettings\n\
       * @type RegExp\n\
       */\n\
      'escape': reEscape,\n\
\n\
      /**\n\
       * Used to detect code to be evaluated.\n\
       *\n\
       * @memberOf _.templateSettings\n\
       * @type RegExp\n\
       */\n\
      'evaluate': reEvaluate,\n\
\n\
      /**\n\
       * Used to detect `data` property values to inject.\n\
       *\n\
       * @memberOf _.templateSettings\n\
       * @type RegExp\n\
       */\n\
      'interpolate': reInterpolate,\n\
\n\
      /**\n\
       * Used to reference the data object in the template text.\n\
       *\n\
       * @memberOf _.templateSettings\n\
       * @type string\n\
       */\n\
      'variable': '',\n\
\n\
      /**\n\
       * Used to import variables into the compiled template.\n\
       *\n\
       * @memberOf _.templateSettings\n\
       * @type Object\n\
       */\n\
      'imports': {\n\
\n\
        /**\n\
         * A reference to the `lodash` function.\n\
         *\n\
         * @memberOf _.templateSettings.imports\n\
         * @type Function\n\
         */\n\
        '_': lodash\n\
      }\n\
    };\n\
\n\
    /*--------------------------------------------------------------------------*/\n\
\n\
    /**\n\
     * The template used to create iterator functions.\n\
     *\n\
     * @private\n\
     * @param {Object} data The data object used to populate the text.\n\
     * @returns {string} Returns the interpolated text.\n\
     */\n\
    var iteratorTemplate = function(obj) {\n\
\n\
      var __p = 'var result = ' +\n\
      (obj.init) +\n\
      ';\\n\
if (!isObject(object)) {\\n\
  return result;\\n\
}';\n\
       if (support.nonEnumArgs) {\n\
      __p += '\\n\
var length = object.length;\\n\
if (length && isArguments(object)) {\\n\
  key = -1;\\n\
  while (++key < length) {\\n\
    key += \\'\\';\\n\
    ' +\n\
      (obj.loop) +\n\
      ';\\n\
  }\\n\
  return result;\\n\
}';\n\
       }\n\
\n\
       if (support.enumPrototypes) {\n\
      __p += '\\n\
var skipProto = typeof object == \\'function\\';\\n\
';\n\
       }\n\
\n\
       if (support.enumErrorProps) {\n\
      __p += '\\n\
var skipErrorProps = object === errorProto || object instanceof Error;\\n\
';\n\
       }\n\
\n\
      var conditions = [];\n\
      if (support.enumPrototypes) { conditions.push('!(skipProto && key == \\'prototype\\')'); }\n\
      if (support.enumErrorProps) { conditions.push('!(skipErrorProps && (key == \\'message\\' || key == \\'name\\'))'); }\n\
      __p += '\\n\
for (var key in object) {\\n\
';\n\
        if (obj.useHas) { conditions.push('hasOwnProperty.call(object, key)'); }\n\
        if (conditions.length) {\n\
      __p += '  if (' +\n\
      (conditions.join(' && ')) +\n\
      ') {\\n\
  ';\n\
       }\n\
      __p +=\n\
      (obj.loop) +\n\
      ';  ';\n\
       if (conditions.length) {\n\
      __p += '\\n\
  }';\n\
       }\n\
      __p += '\\n\
}\\n\
';\n\
       if (support.nonEnumShadows) {\n\
      __p += '\\n\
if (object !== objectProto) {\\n\
  var ctor = object.constructor,\\n\
      isProto = object === (ctor && ctor.prototype),\\n\
      className = object === stringProto ? stringClass : object === errorProto ? errorClass : toString.call(object),\\n\
      nonEnum = nonEnumProps[className];\\n\
  ';\n\
       for (var index = 0; index < 7; index++) {\n\
      __p += '\\n\
  key = \\'' +\n\
      (obj.shadowedProps[index]) +\n\
      '\\';\\n\
  if ((!(isProto && nonEnum[key]) && hasOwnProperty.call(object, key))';\n\
            if (!obj.useHas) {\n\
      __p += ' || (!nonEnum[key] && object[key] !== objectProto[key])';\n\
       }\n\
      __p += ') {\\n\
    ' +\n\
      (obj.loop) +\n\
      ';\\n\
  }  ';\n\
       }\n\
      __p += '\\n\
}';\n\
       }\n\
      __p += '\\n\
return result;';\n\
\n\
      return __p\n\
    };\n\
\n\
    /*--------------------------------------------------------------------------*/\n\
\n\
    /**\n\
     * The base implementation of `_.bind` that creates the bound function and\n\
     * sets its meta data.\n\
     *\n\
     * @private\n\
     * @param {Array} data The metadata array.\n\
     * @returns {Function} Returns the new bound function.\n\
     */\n\
    function baseBind(data) {\n\
      var func = data[0],\n\
          thisArg = data[3],\n\
          partialArgs = data[4],\n\
          partialHolders = data[6];\n\
\n\
      function bound() {\n\
        // `Function#bind` spec\n\
        // http://es5.github.io/#x15.3.4.5\n\
        if (partialArgs) {\n\
          // avoid `arguments` object use disqualifying optimizations by\n\
          // converting it to an array before passing it to `composeArgs`\n\
          var index = -1,\n\
               length = arguments.length,\n\
               args = Array(length);\n\
\n\
          while (++index < length) {\n\
            args[index] = arguments[index];\n\
          }\n\
          args = composeArgs(partialArgs, partialHolders, args);\n\
        }\n\
        // mimic the constructor's `return` behavior\n\
        // http://es5.github.io/#x13.2.2\n\
        if (this instanceof bound) {\n\
          // ensure `new bound` is an instance of `func`\n\
          var thisBinding = baseCreate(func.prototype),\n\
              result = func.apply(thisBinding, args || arguments);\n\
          return isObject(result) ? result : thisBinding;\n\
        }\n\
        return func.apply(thisArg, args || arguments);\n\
      }\n\
      setData(bound, data);\n\
      return bound;\n\
    }\n\
\n\
    /**\n\
     * The base implementation of `_.clone` without argument juggling or support\n\
     * for `thisArg` binding.\n\
     *\n\
     * @private\n\
     * @param {*} value The value to clone.\n\
     * @param {boolean} [isDeep=false] Specify a deep clone.\n\
     * @param {Function} [callback] The function to customize cloning values.\n\
     * @param {Array} [stackA=[]] Tracks traversed source objects.\n\
     * @param {Array} [stackB=[]] Associates clones with source counterparts.\n\
     * @returns {*} Returns the cloned value.\n\
     */\n\
    function baseClone(value, isDeep, callback, stackA, stackB) {\n\
      if (callback) {\n\
        var result = callback(value);\n\
        if (typeof result != 'undefined') {\n\
          return result;\n\
        }\n\
      }\n\
      // inspect [[Class]]\n\
      var isObj = isObject(value);\n\
      if (isObj) {\n\
        var className = toString.call(value);\n\
        if (!cloneableClasses[className] || (!support.nodeClass && isNode(value))) {\n\
          return value;\n\
        }\n\
        var ctor = ctorByClass[className];\n\
        switch (className) {\n\
          case boolClass:\n\
          case dateClass:\n\
            return new ctor(+value);\n\
\n\
          case numberClass:\n\
          case stringClass:\n\
            return new ctor(value);\n\
\n\
          case regexpClass:\n\
            result = ctor(value.source, reFlags.exec(value));\n\
            result.lastIndex = value.lastIndex;\n\
            return result;\n\
        }\n\
      } else {\n\
        return value;\n\
      }\n\
      var isArr = isArray(value);\n\
      if (isDeep) {\n\
        // check for circular references and return corresponding clone\n\
        var initedStack = !stackA;\n\
        stackA || (stackA = getArray());\n\
        stackB || (stackB = getArray());\n\
\n\
        var length = stackA.length;\n\
        while (length--) {\n\
          if (stackA[length] == value) {\n\
            return stackB[length];\n\
          }\n\
        }\n\
        result = isArr ? ctor(value.length) : {};\n\
      }\n\
      else {\n\
        result = isArr ? slice(value) : assign({}, value);\n\
      }\n\
      // add array properties assigned by `RegExp#exec`\n\
      if (isArr) {\n\
        if (hasOwnProperty.call(value, 'index')) {\n\
          result.index = value.index;\n\
        }\n\
        if (hasOwnProperty.call(value, 'input')) {\n\
          result.input = value.input;\n\
        }\n\
      }\n\
      // exit for shallow clone\n\
      if (!isDeep) {\n\
        return result;\n\
      }\n\
      // add the source value to the stack of traversed objects\n\
      // and associate it with its clone\n\
      stackA.push(value);\n\
      stackB.push(result);\n\
\n\
      // recursively populate clone (susceptible to call stack limits)\n\
      (isArr ? baseEach : baseForOwn)(value, function(objValue, key) {\n\
        result[key] = baseClone(objValue, isDeep, callback, stackA, stackB);\n\
      });\n\
\n\
      if (initedStack) {\n\
        releaseArray(stackA);\n\
        releaseArray(stackB);\n\
      }\n\
      return result;\n\
    }\n\
\n\
    /**\n\
     * The base implementation of `_.create` without support for assigning\n\
     * properties to the created object.\n\
     *\n\
     * @private\n\
     * @param {Object} prototype The object to inherit from.\n\
     * @returns {Object} Returns the new object.\n\
     */\n\
    function baseCreate(prototype) {\n\
      return isObject(prototype) ? nativeCreate(prototype) : {};\n\
    }\n\
    // fallback for environments without `Object.create`\n\
    if (!nativeCreate) {\n\
      baseCreate = (function() {\n\
        function Object() {}\n\
        return function(prototype) {\n\
          if (isObject(prototype)) {\n\
            Object.prototype = prototype;\n\
            var result = new Object;\n\
            Object.prototype = null;\n\
          }\n\
          return result || context.Object();\n\
        };\n\
      }());\n\
    }\n\
\n\
    /**\n\
     * The base implementation of `_.createCallback` without support for creating\n\
     * \"_.pluck\" or \"_.where\" style callbacks.\n\
     *\n\
     * @private\n\
     * @param {*} [func=identity] The value to convert to a callback.\n\
     * @param {*} [thisArg] The `this` binding of the created callback.\n\
     * @param {number} [argCount] The number of arguments the callback accepts.\n\
     * @returns {Function} Returns a callback function.\n\
     */\n\
    function baseCreateCallback(func, thisArg, argCount) {\n\
      if (typeof func != 'function') {\n\
        return identity;\n\
      }\n\
      // exit early for no `thisArg` or already bound by `Function#bind`\n\
      if (typeof thisArg == 'undefined' || !('prototype' in func)) {\n\
        return func;\n\
      }\n\
      var data = func[expando];\n\
      if (typeof data == 'undefined') {\n\
        if (support.funcNames) {\n\
          data = !func.name;\n\
        }\n\
        data = data || !support.funcDecomp;\n\
        if (!data) {\n\
          var source = fnToString.call(func);\n\
          if (!support.funcNames) {\n\
            data = !reFuncName.test(source);\n\
          }\n\
          if (!data) {\n\
            // checks if `func` references the `this` keyword and stores the result\n\
            data = reThis.test(source);\n\
            setData(func, data);\n\
          }\n\
        }\n\
      }\n\
      // exit early if there are no `this` references or `func` is bound\n\
      if (data === false || (data !== true && data[1] & BIND_FLAG)) {\n\
        return func;\n\
      }\n\
      switch (argCount) {\n\
        case 1: return function(value) {\n\
          return func.call(thisArg, value);\n\
        };\n\
        case 2: return function(a, b) {\n\
          return func.call(thisArg, a, b);\n\
        };\n\
        case 3: return function(value, index, collection) {\n\
          return func.call(thisArg, value, index, collection);\n\
        };\n\
        case 4: return function(accumulator, value, index, collection) {\n\
          return func.call(thisArg, accumulator, value, index, collection);\n\
        };\n\
      }\n\
      return bind(func, thisArg);\n\
    }\n\
\n\
    /**\n\
     * The base implementation of `createWrapper` that creates the wrapper and\n\
     * sets its meta data.\n\
     *\n\
     * @private\n\
     * @param {Array} data The metadata array.\n\
     * @returns {Function} Returns the new function.\n\
     */\n\
    function baseCreateWrapper(data) {\n\
      var func = data[0],\n\
          bitmask = data[1],\n\
          arity = data[2],\n\
          thisArg = data[3],\n\
          partialArgs = data[4],\n\
          partialRightArgs = data[5],\n\
          partialHolders = data[6],\n\
          partialRightHolders = data[7];\n\
\n\
      var isBind = bitmask & BIND_FLAG,\n\
          isBindKey = bitmask & BIND_KEY_FLAG,\n\
          isCurry = bitmask & CURRY_FLAG,\n\
          isCurryBound = bitmask & CURRY_BOUND_FLAG,\n\
          key = func;\n\
\n\
      function bound() {\n\
        var index = -1,\n\
            length = arguments.length,\n\
            args = Array(length);\n\
\n\
        while (++index < length) {\n\
          args[index] = arguments[index];\n\
        }\n\
        if (partialArgs) {\n\
          args = composeArgs(partialArgs, partialHolders, args);\n\
        }\n\
        if (partialRightArgs) {\n\
          args = composeArgsRight(partialRightArgs, partialRightHolders, args);\n\
        }\n\
        if (isCurry && length < arity) {\n\
          bitmask |= PARTIAL_FLAG;\n\
          bitmask &= ~PARTIAL_RIGHT_FLAG\n\
          if (!isCurryBound) {\n\
            bitmask &= ~(BIND_FLAG | BIND_KEY_FLAG);\n\
          }\n\
          var newArity = nativeMax(0, arity - length);\n\
          return baseCreateWrapper([func, bitmask, newArity, thisArg, args, null, []]);\n\
        }\n\
        var thisBinding = isBind ? thisArg : this;\n\
        if (isBindKey) {\n\
          func = thisBinding[key];\n\
        }\n\
        if (this instanceof bound) {\n\
          thisBinding = baseCreate(func.prototype);\n\
          var result = func.apply(thisBinding, args);\n\
          return isObject(result) ? result : thisBinding;\n\
        }\n\
        return func.apply(thisBinding, args);\n\
      }\n\
      setData(bound, data);\n\
      return bound;\n\
    }\n\
\n\
    /**\n\
     * The base implementation of `_.difference` that accepts a single array\n\
     * of values to exclude.\n\
     *\n\
     * @private\n\
     * @param {Array} array The array to process.\n\
     * @param {Array} [values] The array of values to exclude.\n\
     * @returns {Array} Returns a new array of filtered values.\n\
     */\n\
    function baseDifference(array, values) {\n\
      var index = -1,\n\
          indexOf = getIndexOf(),\n\
          length = array ? array.length : 0,\n\
          result = [];\n\
\n\
      if (createCache && values && indexOf === baseIndexOf && values.length >= LARGE_ARRAY_SIZE) {\n\
        indexOf = cacheIndexOf;\n\
        values = createCache(values);\n\
      }\n\
      while (++index < length) {\n\
        var value = array[index];\n\
        if (indexOf(values, value) < 0) {\n\
          result.push(value);\n\
        }\n\
      }\n\
      return result;\n\
    }\n\
\n\
    /**\n\
     * The base implementation of `_.forEach` without support for callback\n\
     * shorthands or `thisArg` binding.\n\
     *\n\
     * @private\n\
     * @param {Array|Object|string} collection The collection to iterate over.\n\
     * @param {Function} callback The function called per iteration.\n\
     * @returns {Array|Object|string} Returns `collection`.\n\
     */\n\
    function baseEach(collection, callback) {\n\
      var index = -1,\n\
          iterable = collection,\n\
          length = collection ? collection.length : 0;\n\
\n\
      if (typeof length == 'number') {\n\
        if (support.unindexedChars && isString(iterable)) {\n\
          iterable = iterable.split('');\n\
        }\n\
        while (++index < length) {\n\
          if (callback(iterable[index], index, collection) === false) {\n\
            break;\n\
          }\n\
        }\n\
      } else {\n\
        baseForOwn(collection, callback);\n\
      }\n\
      return collection;\n\
    }\n\
\n\
    /**\n\
     * The base implementation of `_.forEachRight` without support for callback\n\
     * shorthands or `thisArg` binding.\n\
     *\n\
     * @private\n\
     * @param {Array|Object|string} collection The collection to iterate over.\n\
     * @param {Function} callback The function called per iteration.\n\
     * @returns {Array|Object|string} Returns `collection`.\n\
     */\n\
    function baseEachRight(collection, callback) {\n\
      var iterable = collection,\n\
          length = collection ? collection.length : 0;\n\
\n\
      if (typeof length == 'number') {\n\
        if (support.unindexedChars && isString(iterable)) {\n\
          iterable = iterable.split('');\n\
        }\n\
        while (length--) {\n\
          if (callback(iterable[length], length, collection) === false) {\n\
            break;\n\
          }\n\
        }\n\
      } else {\n\
        baseForOwnRight(collection, callback);\n\
      }\n\
      return collection;\n\
    }\n\
\n\
    /**\n\
     * The base implementation of `_.flatten` without support for callback\n\
     * shorthands or `thisArg` binding.\n\
     *\n\
     * @private\n\
     * @param {Array} array The array to flatten.\n\
     * @param {boolean} [isShallow=false] A flag to restrict flattening to a single level.\n\
     * @param {boolean} [isStrict=false] A flag to restrict flattening to arrays and `arguments` objects.\n\
     * @param {number} [fromIndex=0] The index to start from.\n\
     * @returns {Array} Returns a new flattened array.\n\
     */\n\
    function baseFlatten(array, isShallow, isStrict, fromIndex) {\n\
      var index = (fromIndex || 0) - 1,\n\
          length = array ? array.length : 0,\n\
          result = [];\n\
\n\
      while (++index < length) {\n\
        var value = array[index];\n\
\n\
        if (value && typeof value == 'object' && typeof value.length == 'number'\n\
            && (isArray(value) || isArguments(value))) {\n\
          // recursively flatten arrays (susceptible to call stack limits)\n\
          if (!isShallow) {\n\
            value = baseFlatten(value, isShallow, isStrict);\n\
          }\n\
          var valIndex = -1,\n\
              valLength = value.length,\n\
              resIndex = result.length;\n\
\n\
          result.length += valLength;\n\
          while (++valIndex < valLength) {\n\
            result[resIndex++] = value[valIndex];\n\
          }\n\
        } else if (!isStrict) {\n\
          result.push(value);\n\
        }\n\
      }\n\
      return result;\n\
    }\n\
\n\
    /**\n\
     * The base implementation of `_.forOwn` without support for callback\n\
     * shorthands or `thisArg` binding.\n\
     *\n\
     * @private\n\
     * @param {Object} object The object to iterate over.\n\
     * @param {Function} callback The function called per iteration.\n\
     * @returns {Object} Returns `object`.\n\
     */\n\
    function baseForOwn(object, callback) {\n\
      var index = -1,\n\
          props = keys(object),\n\
          length = props.length;\n\
\n\
      while (++index < length) {\n\
        var key = props[index];\n\
        if (callback(object[key], key, object) === false) {\n\
          break;\n\
        }\n\
      }\n\
      return object;\n\
    }\n\
\n\
    /**\n\
     * The base implementation of `_.forOwnRight` without support for callback\n\
     * shorthands or `thisArg` binding.\n\
     *\n\
     * @private\n\
     * @param {Object} object The object to iterate over.\n\
     * @param {Function} callback The function called per iteration.\n\
     * @returns {Object} Returns `object`.\n\
     */\n\
    function baseForOwnRight(object, callback) {\n\
      var props = keys(object),\n\
          length = props.length;\n\
\n\
      while (length--) {\n\
        var key = props[length];\n\
        if (callback(object[key], key, object) === false) {\n\
          break;\n\
        }\n\
      }\n\
      return object;\n\
    }\n\
\n\
    /**\n\
     * The base implementation of `_.isEqual`, without support for `thisArg` binding,\n\
     * that allows partial \"_.where\" style comparisons.\n\
     *\n\
     * @private\n\
     * @param {*} a The value to compare.\n\
     * @param {*} b The other value to compare.\n\
     * @param {Function} [callback] The function to customize comparing values.\n\
     * @param {Function} [isWhere=false] A flag to indicate performing partial comparisons.\n\
     * @param {Array} [stackA=[]] Tracks traversed `a` objects.\n\
     * @param {Array} [stackB=[]] Tracks traversed `b` objects.\n\
     * @returns {boolean} Returns `true` if the values are equivalent, else `false`.\n\
     */\n\
    function baseIsEqual(a, b, callback, isWhere, stackA, stackB) {\n\
      // used to indicate that when comparing objects, `a` has at least the properties of `b`\n\
      if (callback) {\n\
        var result = callback(a, b);\n\
        if (typeof result != 'undefined') {\n\
          return !!result;\n\
        }\n\
      }\n\
      // exit early for identical values\n\
      if (a === b) {\n\
        // treat `+0` vs. `-0` as not equal\n\
        return a !== 0 || (1 / a == 1 / b);\n\
      }\n\
      var type = typeof a,\n\
          otherType = typeof b;\n\
\n\
      // exit early for unlike primitive values\n\
      if (a === a &&\n\
          !(a && (type == 'function' || type == 'object')) &&\n\
          !(b && (otherType == 'function' || otherType == 'object'))) {\n\
        return false;\n\
      }\n\
      // exit early for `null` and `undefined` avoiding ES3's Function#call behavior\n\
      // http://es5.github.io/#x15.3.4.4\n\
      if (a == null || b == null) {\n\
        return a === b;\n\
      }\n\
      // compare [[Class]] names\n\
      var className = toString.call(a),\n\
          otherClass = toString.call(b);\n\
\n\
      if (className == argsClass) {\n\
        className = objectClass;\n\
      }\n\
      if (otherClass == argsClass) {\n\
        otherClass = objectClass;\n\
      }\n\
      if (className != otherClass) {\n\
        return false;\n\
      }\n\
      switch (className) {\n\
        case boolClass:\n\
        case dateClass:\n\
          // coerce dates and booleans to numbers, dates to milliseconds and booleans\n\
          // to `1` or `0` treating invalid dates coerced to `NaN` as not equal\n\
          return +a == +b;\n\
\n\
        case numberClass:\n\
          // treat `NaN` vs. `NaN` as equal\n\
          return (a != +a)\n\
            ? b != +b\n\
            // but treat `+0` vs. `-0` as not equal\n\
            : (a == 0 ? (1 / a == 1 / b) : a == +b);\n\
\n\
        case regexpClass:\n\
        case stringClass:\n\
          // coerce regexes to strings (http://es5.github.io/#x15.10.6.4)\n\
          // treat string primitives and their corresponding object instances as equal\n\
          return a == String(b);\n\
      }\n\
      var isArr = className == arrayClass;\n\
      if (!isArr) {\n\
        // unwrap any `lodash` wrapped values\n\
        var aWrapped = hasOwnProperty.call(a, '__wrapped__'),\n\
            bWrapped = hasOwnProperty.call(b, '__wrapped__');\n\
\n\
        if (aWrapped || bWrapped) {\n\
          return baseIsEqual(aWrapped ? a.__wrapped__ : a, bWrapped ? b.__wrapped__ : b, callback, isWhere, stackA, stackB);\n\
        }\n\
        // exit for functions and DOM nodes\n\
        if (className != objectClass || (!support.nodeClass && (isNode(a) || isNode(b)))) {\n\
          return false;\n\
        }\n\
        // in older versions of Opera, `arguments` objects have `Array` constructors\n\
        var ctorA = !support.argsObject && isArguments(a) ? Object : a.constructor,\n\
            ctorB = !support.argsObject && isArguments(b) ? Object : b.constructor;\n\
\n\
        // non `Object` object instances with different constructors are not equal\n\
        if (ctorA != ctorB &&\n\
              !(hasOwnProperty.call(a, 'constructor') && hasOwnProperty.call(b, 'constructor')) &&\n\
              !(isFunction(ctorA) && ctorA instanceof ctorA && isFunction(ctorB) && ctorB instanceof ctorB) &&\n\
              ('constructor' in a && 'constructor' in b)\n\
            ) {\n\
          return false;\n\
        }\n\
      }\n\
      // assume cyclic structures are equal\n\
      // the algorithm for detecting cyclic structures is adapted from ES 5.1\n\
      // section 15.12.3, abstract operation `JO` (http://es5.github.io/#x15.12.3)\n\
      var initedStack = !stackA;\n\
      stackA || (stackA = getArray());\n\
      stackB || (stackB = getArray());\n\
\n\
      var length = stackA.length;\n\
      while (length--) {\n\
        if (stackA[length] == a) {\n\
          return stackB[length] == b;\n\
        }\n\
      }\n\
      var size = 0;\n\
      result = true;\n\
\n\
      // add `a` and `b` to the stack of traversed objects\n\
      stackA.push(a);\n\
      stackB.push(b);\n\
\n\
      // recursively compare objects and arrays (susceptible to call stack limits)\n\
      if (isArr) {\n\
        // compare lengths to determine if a deep comparison is necessary\n\
        length = a.length;\n\
        size = b.length;\n\
        result = size == length;\n\
\n\
        if (result || isWhere) {\n\
          // deep compare the contents, ignoring non-numeric properties\n\
          while (size--) {\n\
            var index = length,\n\
                value = b[size];\n\
\n\
            if (isWhere) {\n\
              while (index--) {\n\
                if ((result = baseIsEqual(a[index], value, callback, isWhere, stackA, stackB))) {\n\
                  break;\n\
                }\n\
              }\n\
            } else if (!(result = baseIsEqual(a[size], value, callback, isWhere, stackA, stackB))) {\n\
              break;\n\
            }\n\
          }\n\
        }\n\
      }\n\
      else {\n\
        // deep compare objects using `forIn`, instead of `forOwn`, to avoid `Object.keys`\n\
        // which, in this case, is more costly\n\
        baseForIn(b, function(value, key, b) {\n\
          if (hasOwnProperty.call(b, key)) {\n\
            // count the number of properties.\n\
            size++;\n\
            // deep compare each property value.\n\
            return (result = hasOwnProperty.call(a, key) && baseIsEqual(a[key], value, callback, isWhere, stackA, stackB));\n\
          }\n\
        });\n\
\n\
        if (result && !isWhere) {\n\
          // ensure both objects have the same number of properties\n\
          baseForIn(a, function(value, key, a) {\n\
            if (hasOwnProperty.call(a, key)) {\n\
              // `size` will be `-1` if `a` has more properties than `b`\n\
              return (result = --size > -1);\n\
            }\n\
          });\n\
        }\n\
      }\n\
      stackA.pop();\n\
      stackB.pop();\n\
\n\
      if (initedStack) {\n\
        releaseArray(stackA);\n\
        releaseArray(stackB);\n\
      }\n\
      return result;\n\
    }\n\
\n\
    /**\n\
     * The base implementation of `_.merge` without argument juggling or support\n\
     * for `thisArg` binding.\n\
     *\n\
     * @private\n\
     * @param {Object} object The destination object.\n\
     * @param {Object} source The source object.\n\
     * @param {Function} [callback] The function to customize merging properties.\n\
     * @param {Array} [stackA=[]] Tracks traversed source objects.\n\
     * @param {Array} [stackB=[]] Associates values with source counterparts.\n\
     */\n\
    function baseMerge(object, source, callback, stackA, stackB) {\n\
      (isArray(source) ? baseEach : baseForOwn)(source, function(source, key) {\n\
        var found,\n\
            isArr,\n\
            result = source,\n\
            value = object[key];\n\
\n\
        if (source && ((isArr = isArray(source)) || isPlainObject(source))) {\n\
          // avoid merging previously merged cyclic sources\n\
          var stackLength = stackA.length;\n\
          while (stackLength--) {\n\
            if ((found = stackA[stackLength] == source)) {\n\
              value = stackB[stackLength];\n\
              break;\n\
            }\n\
          }\n\
          if (!found) {\n\
            var isShallow;\n\
            if (callback) {\n\
              result = callback(value, source);\n\
              if ((isShallow = typeof result != 'undefined')) {\n\
                value = result;\n\
              }\n\
            }\n\
            if (!isShallow) {\n\
              value = isArr\n\
                ? (isArray(value) ? value : [])\n\
                : (isPlainObject(value) ? value : {});\n\
            }\n\
            // add `source` and associated `value` to the stack of traversed objects\n\
            stackA.push(source);\n\
            stackB.push(value);\n\
\n\
            // recursively merge objects and arrays (susceptible to call stack limits)\n\
            if (!isShallow) {\n\
              baseMerge(value, source, callback, stackA, stackB);\n\
            }\n\
          }\n\
        }\n\
        else {\n\
          if (callback) {\n\
            result = callback(value, source);\n\
            if (typeof result == 'undefined') {\n\
              result = source;\n\
            }\n\
          }\n\
          if (typeof result != 'undefined') {\n\
            value = result;\n\
          }\n\
        }\n\
        object[key] = value;\n\
      });\n\
    }\n\
\n\
    /**\n\
     * The base implementation of `_.random` without argument juggling or support\n\
     * for returning floating-point numbers.\n\
     *\n\
     * @private\n\
     * @param {number} min The minimum possible value.\n\
     * @param {number} max The maximum possible value.\n\
     * @returns {number} Returns a random number.\n\
     */\n\
    function baseRandom(min, max) {\n\
      return min + floor(nativeRandom() * (max - min + 1));\n\
    }\n\
\n\
    /**\n\
     * The base implementation of `_.uniq` without support for callback shorthands\n\
     * or `thisArg` binding.\n\
     *\n\
     * @private\n\
     * @param {Array} array The array to process.\n\
     * @param {boolean} [isSorted=false] A flag to indicate that `array` is sorted.\n\
     * @param {Function} [callback] The function called per iteration.\n\
     * @returns {Array} Returns a duplicate-value-free array.\n\
     */\n\
    function baseUniq(array, isSorted, callback) {\n\
      var index = -1,\n\
          indexOf = getIndexOf(),\n\
          length = array ? array.length : 0,\n\
          isLarge = createCache && !isSorted && indexOf === baseIndexOf && length >= LARGE_ARRAY_SIZE,\n\
          result = [];\n\
\n\
      if (isLarge) {\n\
        var seen = createCache();\n\
        indexOf = cacheIndexOf;\n\
      } else {\n\
        seen = callback ? getArray() : result;\n\
      }\n\
      while (++index < length) {\n\
        var value = array[index],\n\
            computed = callback ? callback(value, index, array) : value;\n\
\n\
        if (isSorted\n\
              ? !index || seen[seen.length - 1] !== computed\n\
              : indexOf(seen, computed) < 0\n\
            ) {\n\
          if (callback || isLarge) {\n\
            seen.push(computed);\n\
          }\n\
          result.push(value);\n\
        }\n\
      }\n\
      if (!isLarge && callback) {\n\
        releaseArray(seen);\n\
      }\n\
      return result;\n\
    }\n\
\n\
    /**\n\
     * Creates an array that is the composition of partially applied arguments,\n\
     * placeholders, and provided arguments into a single array of arguments.\n\
     *\n\
     * @private\n\
     * @param {Array} partialArg An array of arguments to prepend to those provided.\n\
     * @param {Array} partialHolders An array of `partialArgs` placeholder indexes.\n\
     * @param {Array|Object} args The provided arguments.\n\
     * @returns {Array} Returns a new array of composed arguments.\n\
     */\n\
    function composeArgs(partialArgs, partialHolders, args) {\n\
      var holdersLength = partialHolders.length,\n\
          argsIndex = -1,\n\
          argsLength = nativeMax(args.length - holdersLength, 0),\n\
          leftIndex = -1,\n\
          leftLength = partialArgs.length,\n\
          result = Array(argsLength + leftLength);\n\
\n\
      while (++leftIndex < leftLength) {\n\
        result[leftIndex] = partialArgs[leftIndex];\n\
      }\n\
      while (++argsIndex < holdersLength) {\n\
        result[partialHolders[argsIndex]] = args[argsIndex];\n\
      }\n\
      while (argsLength--) {\n\
        result[leftIndex++] = args[argsIndex++];\n\
      }\n\
      return result;\n\
    }\n\
\n\
    /**\n\
     * This function is like `composeArgs` except that the arguments composition\n\
     * is tailored for `_.partialRight`.\n\
     *\n\
     * @private\n\
     * @param {Array} partialRightArg An array of arguments to append to those provided.\n\
     * @param {Array} partialHolders An array of `partialRightArgs` placeholder indexes.\n\
     * @param {Array|Object} args The provided arguments.\n\
     * @returns {Array} Returns a new array of composed arguments.\n\
     */\n\
    function composeArgsRight(partialRightArgs, partialRightHolders, args) {\n\
      var holdersIndex = -1,\n\
          holdersLength = partialRightHolders.length,\n\
          argsIndex = -1,\n\
          argsLength = nativeMax(args.length - holdersLength, 0),\n\
          rightIndex = -1,\n\
          rightLength = partialRightArgs.length,\n\
          result = Array(argsLength + rightLength);\n\
\n\
      while (++argsIndex < argsLength) {\n\
        result[argsIndex] = args[argsIndex];\n\
      }\n\
      var pad = argsIndex;\n\
      while (++rightIndex < rightLength) {\n\
        result[pad + rightIndex] = partialRightArgs[rightIndex];\n\
      }\n\
      while (++holdersIndex < holdersLength) {\n\
        result[pad + partialRightHolders[holdersIndex]] = args[argsIndex++];\n\
      }\n\
      return result;\n\
    }\n\
\n\
    /**\n\
     * Creates a function that aggregates a collection, creating an object or\n\
     * array composed from the results of running each element of the collection\n\
     * through a callback. The given `setter` function sets the keys and values\n\
     * of the composed object or array.\n\
     *\n\
     * @private\n\
     * @param {Function} setter The setter function.\n\
     * @param {boolean} [retArray=false] A flag to indicate that the aggregator\n\
     *  function should return an array.\n\
     * @returns {Function} Returns the new aggregator function.\n\
     */\n\
    function createAggregator(setter, retArray) {\n\
      return function(collection, callback, thisArg) {\n\
        var result = retArray ? [[], []] : {};\n\
\n\
        callback = lodash.createCallback(callback, thisArg, 3);\n\
        if (isArray(collection)) {\n\
          var index = -1,\n\
              length = collection.length;\n\
\n\
          while (++index < length) {\n\
            var value = collection[index];\n\
            setter(result, value, callback(value, index, collection), collection);\n\
          }\n\
        } else {\n\
          baseEach(collection, function(value, key, collection) {\n\
            setter(result, value, callback(value, key, collection), collection);\n\
          });\n\
        }\n\
        return result;\n\
      };\n\
    }\n\
\n\
    /**\n\
     * Creates a cache object to optimize linear searches of large arrays.\n\
     *\n\
     * @private\n\
     * @param {Array} [array=[]] The array to search.\n\
     * @returns {Object} Returns the cache object.\n\
     */\n\
    var createCache = Set && function(array) {\n\
      var cache = new Set,\n\
          length = array ? array.length : 0;\n\
\n\
      cache.push = cache.add;\n\
      while (length--) {\n\
        cache.push(array[length]);\n\
      }\n\
      return cache;\n\
    };\n\
\n\
    /**\n\
     * Creates a function that, when called, either curries or invokes `func`\n\
     * with an optional `this` binding and partially applied arguments.\n\
     *\n\
     * @private\n\
     * @param {Function|string} func The function or method name to reference.\n\
     * @param {number} bitmask The bitmask of flags to compose.\n\
     *  The bitmask may be composed of the following flags:\n\
     *  1  - `_.bind`\n\
     *  2  - `_.bindKey`\n\
     *  4  - `_.curry`\n\
     *  8  - `_.curry` (bound)\n\
     *  16 - `_.partial`\n\
     *  32 - `_.partialRight`\n\
     * @param {number} [arity] The arity of `func`.\n\
     * @param {*} [thisArg] The `this` binding of `func`.\n\
     * @param {Array} [partialArgs] An array of arguments to prepend to those\n\
     *  provided to the new function.\n\
     * @param {Array} [partialRightArgs] An array of arguments to append to those\n\
     *  provided to the new function.\n\
     * @param {Array} [partialHolders] An array of `partialArgs` placeholder indexes.\n\
     * @param {Array} [partialRightHolders] An array of `partialRightArgs` placeholder indexes.\n\
     * @returns {Function} Returns the new function.\n\
     */\n\
    function createWrapper(func, bitmask, arity, thisArg, partialArgs, partialRightArgs, partialHolders, partialRightHolders) {\n\
      var isBind = bitmask & BIND_FLAG,\n\
          isBindKey = bitmask & BIND_KEY_FLAG,\n\
          isPartial = bitmask & PARTIAL_FLAG,\n\
          isPartialRight = bitmask & PARTIAL_RIGHT_FLAG;\n\
\n\
      if (!isBindKey && !isFunction(func)) {\n\
        throw new TypeError;\n\
      }\n\
      if (isPartial && !partialArgs.length) {\n\
        bitmask &= ~PARTIAL_FLAG;\n\
        isPartial = partialArgs = false;\n\
      }\n\
      if (isPartialRight && !partialRightArgs.length) {\n\
        bitmask &= ~PARTIAL_RIGHT_FLAG;\n\
        isPartialRight = partialRightArgs = false;\n\
      }\n\
      var data = !isBindKey && func[expando];\n\
      if (data && data !== true) {\n\
        // shallow clone `data`\n\
        data = slice(data);\n\
\n\
        // clone partial left arguments\n\
        if (data[4]) {\n\
          data[4] = slice(data[4]);\n\
        }\n\
        // clone partial right arguments\n\
        if (data[5]) {\n\
          data[5] = slice(data[5]);\n\
        }\n\
        // set arity if provided\n\
        if (typeof arity == 'number') {\n\
          data[2] = arity;\n\
        }\n\
        // set `thisArg` if not previously bound\n\
        var bound = data[1] & BIND_FLAG;\n\
        if (isBind && !bound) {\n\
          data[3] = thisArg;\n\
        }\n\
        // set if currying a bound function\n\
        if (!isBind && bound) {\n\
          bitmask |= CURRY_BOUND_FLAG;\n\
        }\n\
        // append partial left arguments\n\
        if (isPartial) {\n\
          if (data[4]) {\n\
            push.apply(data[4], partialArgs);\n\
          } else {\n\
            data[4] = partialArgs;\n\
          }\n\
        }\n\
        // prepend partial right arguments\n\
        if (isPartialRight) {\n\
          if (data[5]) {\n\
            unshift.apply(data[5], partialRightArgs);\n\
          } else {\n\
            data[5] = partialRightArgs;\n\
          }\n\
        }\n\
        // merge flags\n\
        data[1] |= bitmask;\n\
        return createWrapper.apply(null, data);\n\
      }\n\
      if (arity == null) {\n\
        arity = isBindKey ? 0 : func.length;\n\
      } else if (arity < 0) {\n\
        arity = 0;\n\
      }\n\
      if (isPartial) {\n\
        partialHolders = [];\n\
      }\n\
      if (isPartialRight) {\n\
        partialRightHolders = [];\n\
      }\n\
      // fast path for `_.bind`\n\
      data = [func, bitmask, arity, thisArg, partialArgs, partialRightArgs, partialHolders, partialRightHolders];\n\
      return (bitmask == BIND_FLAG || bitmask == (BIND_FLAG | PARTIAL_FLAG))\n\
        ? baseBind(data)\n\
        : baseCreateWrapper(data);\n\
    }\n\
\n\
    /**\n\
     * Creates compiled iteration functions.\n\
     *\n\
     * @private\n\
     * @param {Object} [options] The compile options object.\n\
     * @param {string} [options.args] A comma separated string of iteration function arguments.\n\
     * @param {string} [options.init] The string representation of the initial `result` value.\n\
     * @param {string} [options.loop] Code to execute in the object loop.\n\
     * @param {boolean} [options.useHas] Specify using `hasOwnProperty` checks in the object loop.\n\
     * @returns {Function} Returns the compiled function.\n\
     */\n\
    function createIterator(options) {\n\
      options.shadowedProps = shadowedProps;\n\
\n\
      // create the function factory\n\
      var factory = Function(\n\
          'errorClass, errorProto, hasOwnProperty, isArguments, isObject, objectProto, ' +\n\
          'nonEnumProps, stringClass, stringProto, toString',\n\
        'return function(' + options.args + ') {\\n\
' + iteratorTemplate(options) + '\\n\
}'\n\
      );\n\
\n\
      // return the compiled function\n\
      return factory(\n\
        errorClass, errorProto, hasOwnProperty, isArguments, isObject, objectProto,\n\
        nonEnumProps, stringClass, stringProto, toString\n\
      );\n\
    }\n\
\n\
    /**\n\
     * Gets the appropriate \"indexOf\" function. If the `_.indexOf` method is\n\
     * customized this method returns the custom method, otherwise it returns\n\
     * the `baseIndexOf` function.\n\
     *\n\
     * @private\n\
     * @returns {Function} Returns the \"indexOf\" function.\n\
     */\n\
    function getIndexOf() {\n\
      var result = (result = lodash.indexOf) === indexOf ? baseIndexOf : result;\n\
      return result;\n\
    }\n\
\n\
    /**\n\
     * Checks if `value` is a native function.\n\
     *\n\
     * @private\n\
     * @param {*} value The value to check.\n\
     * @returns {boolean} Returns `true` if the `value` is a native function, else `false`.\n\
     */\n\
    function isNative(value) {\n\
      return typeof value == 'function' && reNative.test(fnToString.call(value));\n\
    }\n\
\n\
    /**\n\
     * Sets wrapper metadata on a given function.\n\
     *\n\
     * @private\n\
     * @param {Function} func The function to set data on.\n\
     * @param {Array} value The data array to set.\n\
     */\n\
    var setData = !defineProperty ? noop : function(func, value) {\n\
      descriptor.value = value;\n\
      defineProperty(func, expando, descriptor);\n\
    };\n\
\n\
    /**\n\
     * A fallback implementation of `isPlainObject` which checks if a given value\n\
     * is an object created by the `Object` constructor, assuming objects created\n\
     * by the `Object` constructor have no inherited enumerable properties and that\n\
     * there are no `Object.prototype` extensions.\n\
     *\n\
     * @private\n\
     * @param {*} value The value to check.\n\
     * @returns {boolean} Returns `true` if `value` is a plain object, else `false`.\n\
     */\n\
    function shimIsPlainObject(value) {\n\
      var ctor,\n\
          result;\n\
\n\
      // avoid non Object objects, `arguments` objects, and DOM elements\n\
      if (!(value && toString.call(value) == objectClass) ||\n\
          (!hasOwnProperty.call(value, 'constructor') &&\n\
            (ctor = value.constructor, isFunction(ctor) && !(ctor instanceof ctor))) ||\n\
          (!support.argsClass && isArguments(value)) ||\n\
          (!support.nodeClass && isNode(value))) {\n\
        return false;\n\
      }\n\
      // IE < 9 iterates inherited properties before own properties. If the first\n\
      // iterated property is an object's own property then there are no inherited\n\
      // enumerable properties.\n\
      if (support.ownLast) {\n\
        baseForIn(value, function(value, key, object) {\n\
          result = hasOwnProperty.call(object, key);\n\
          return false;\n\
        });\n\
        return result !== false;\n\
      }\n\
      // In most environments an object's own properties are iterated before\n\
      // its inherited properties. If the last iterated property is an object's\n\
      // own property then there are no inherited enumerable properties.\n\
      baseForIn(value, function(value, key) {\n\
        result = key;\n\
      });\n\
      return typeof result == 'undefined' || hasOwnProperty.call(value, result);\n\
    }\n\
\n\
    /*--------------------------------------------------------------------------*/\n\
\n\
    /**\n\
     * Checks if `value` is an `arguments` object.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Objects\n\
     * @param {*} value The value to check.\n\
     * @returns {boolean} Returns `true` if the `value` is an `arguments` object, else `false`.\n\
     * @example\n\
     *\n\
     * (function() { return _.isArguments(arguments); })(1, 2, 3);\n\
     * // => true\n\
     *\n\
     * _.isArguments([1, 2, 3]);\n\
     * // => false\n\
     */\n\
    function isArguments(value) {\n\
      return value && typeof value == 'object' && typeof value.length == 'number' &&\n\
        toString.call(value) == argsClass || false;\n\
    }\n\
    // fallback for environments that can't detect `arguments` objects by [[Class]]\n\
    if (!support.argsClass) {\n\
      isArguments = function(value) {\n\
        return value && typeof value == 'object' && typeof value.length == 'number' &&\n\
          hasOwnProperty.call(value, 'callee') && !propertyIsEnumerable.call(value, 'callee') || false;\n\
      };\n\
    }\n\
\n\
    /**\n\
     * The base implementation of `_.forIn` without support for callback\n\
     * shorthands or `thisArg` binding.\n\
     *\n\
     * @private\n\
     * @param {Object} object The object to iterate over.\n\
     * @param {Function} callback The function called per iteration.\n\
     * @returns {Object} Returns `object`.\n\
     */\n\
    var baseForIn = createIterator({\n\
      'args': 'object, callback',\n\
      'init': 'object',\n\
      'loop': 'if (callback(object[key], key, object) === false) {\\n\
    return result;\\n\
  }',\n\
      'useHas': false\n\
    });\n\
\n\
    /**\n\
     * A fallback implementation of `Object.keys` which produces an array of the\n\
     * given object's own enumerable property names.\n\
     *\n\
     * @private\n\
     * @type Function\n\
     * @param {Object} object The object to inspect.\n\
     * @returns {Array} Returns an array of property names.\n\
     */\n\
    var shimKeys = createIterator({\n\
      'args': 'object',\n\
      'init': '[]',\n\
      'loop': 'result.push(key)',\n\
      'useHas': true\n\
    });\n\
\n\
    /*--------------------------------------------------------------------------*/\n\
\n\
    /**\n\
     * Creates an array with all falsey values removed. The values `false`, `null`,\n\
     * `0`, `\"\"`, `undefined`, and `NaN` are all falsey.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Arrays\n\
     * @param {Array} array The array to compact.\n\
     * @returns {Array} Returns a new array of filtered values.\n\
     * @example\n\
     *\n\
     * _.compact([0, 1, false, 2, '', 3]);\n\
     * // => [1, 2, 3]\n\
     */\n\
    function compact(array) {\n\
      var index = -1,\n\
          length = array ? array.length : 0,\n\
          resIndex = 0,\n\
          result = [];\n\
\n\
      while (++index < length) {\n\
        var value = array[index];\n\
        if (value) {\n\
          result[resIndex++] = value;\n\
        }\n\
      }\n\
      return result;\n\
    }\n\
\n\
    /**\n\
     * Creates an array excluding all values of the provided arrays using strict\n\
     * equality for comparisons, i.e. `===`.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Arrays\n\
     * @param {Array} array The array to process.\n\
     * @param {...Array} [values] The arrays of values to exclude.\n\
     * @returns {Array} Returns a new array of filtered values.\n\
     * @example\n\
     *\n\
     * _.difference([1, 2, 3], [5, 2, 10]);\n\
     * // => [1, 3]\n\
     */\n\
    function difference(array) {\n\
      return baseDifference(array, baseFlatten(arguments, true, true, 1));\n\
    }\n\
\n\
    /**\n\
     * This method is like `_.find` except that it returns the index of the first\n\
     * element that passes the callback check, instead of the element itself.\n\
     *\n\
     * If a property name is provided for `callback` the created \"_.pluck\" style\n\
     * callback will return the property value of the given element.\n\
     *\n\
     * If an object is provided for `callback` the created \"_.where\" style callback\n\
     * will return `true` for elements that have the properties of the given object,\n\
     * else `false`.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Arrays\n\
     * @param {Array} array The array to search.\n\
     * @param {Function|Object|string} [callback=identity] The function called\n\
     *  per iteration. If a property name or object is provided it will be used\n\
     *  to create a \"_.pluck\" or \"_.where\" style callback, respectively.\n\
     * @param {*} [thisArg] The `this` binding of `callback`.\n\
     * @returns {number} Returns the index of the found element, else `-1`.\n\
     * @example\n\
     *\n\
     * var characters = [\n\
     *   { 'name': 'barney',  'age': 36 },\n\
     *   { 'name': 'fred',    'age': 40, 'blocked': true },\n\
     *   { 'name': 'pebbles', 'age': 1 }\n\
     * ];\n\
     *\n\
     * _.findIndex(characters, function(chr) {\n\
     *   return chr.age < 20;\n\
     * });\n\
     * // => 2\n\
     *\n\
     * // using \"_.where\" callback shorthand\n\
     * _.findIndex(characters, { 'age': 36 });\n\
     * // => 0\n\
     *\n\
     * // using \"_.pluck\" callback shorthand\n\
     * _.findIndex(characters, 'blocked');\n\
     * // => 1\n\
     */\n\
    function findIndex(array, callback, thisArg) {\n\
      var index = -1,\n\
          length = array ? array.length : 0;\n\
\n\
      callback = lodash.createCallback(callback, thisArg, 3);\n\
      while (++index < length) {\n\
        if (callback(array[index], index, array)) {\n\
          return index;\n\
        }\n\
      }\n\
      return -1;\n\
    }\n\
\n\
    /**\n\
     * This method is like `_.findIndex` except that it iterates over elements\n\
     * of a `collection` from right to left.\n\
     *\n\
     * If a property name is provided for `callback` the created \"_.pluck\" style\n\
     * callback will return the property value of the given element.\n\
     *\n\
     * If an object is provided for `callback` the created \"_.where\" style callback\n\
     * will return `true` for elements that have the properties of the given object,\n\
     * else `false`.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Arrays\n\
     * @param {Array} array The array to search.\n\
     * @param {Function|Object|string} [callback=identity] The function called\n\
     *  per iteration. If a property name or object is provided it will be used\n\
     *  to create a \"_.pluck\" or \"_.where\" style callback, respectively.\n\
     * @param {*} [thisArg] The `this` binding of `callback`.\n\
     * @returns {number} Returns the index of the found element, else `-1`.\n\
     * @example\n\
     *\n\
     * var characters = [\n\
     *   { 'name': 'barney',  'age': 36, 'blocked': true },\n\
     *   { 'name': 'fred',    'age': 40 },\n\
     *   { 'name': 'pebbles', 'age': 1,  'blocked': true }\n\
     * ];\n\
     *\n\
     * _.findLastIndex(characters, function(chr) {\n\
     *   return chr.age > 30;\n\
     * });\n\
     * // => 1\n\
     *\n\
     * // using \"_.where\" callback shorthand\n\
     * _.findLastIndex(characters, { 'age': 36 });\n\
     * // => 0\n\
     *\n\
     * // using \"_.pluck\" callback shorthand\n\
     * _.findLastIndex(characters, 'blocked');\n\
     * // => 2\n\
     */\n\
    function findLastIndex(array, callback, thisArg) {\n\
      var length = array ? array.length : 0;\n\
\n\
      callback = lodash.createCallback(callback, thisArg, 3);\n\
      while (length--) {\n\
        if (callback(array[length], length, array)) {\n\
          return length;\n\
        }\n\
      }\n\
      return -1;\n\
    }\n\
\n\
    /**\n\
     * Gets the first element or first `n` elements of an array. If a callback\n\
     * is provided elements at the beginning of the array are returned as long\n\
     * as the callback returns truey. The callback is bound to `thisArg` and\n\
     * invoked with three arguments; (value, index, array).\n\
     *\n\
     * If a property name is provided for `callback` the created \"_.pluck\" style\n\
     * callback will return the property value of the given element.\n\
     *\n\
     * If an object is provided for `callback` the created \"_.where\" style callback\n\
     * will return `true` for elements that have the properties of the given object,\n\
     * else `false`.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @alias head, take\n\
     * @category Arrays\n\
     * @param {Array} array The array to query.\n\
     * @param {Function|Object|number|string} [callback] The function called\n\
     *  per element or the number of elements to return. If a property name or\n\
     *  object is provided it will be used to create a \"_.pluck\" or \"_.where\"\n\
     *  style callback, respectively.\n\
     * @param {*} [thisArg] The `this` binding of `callback`.\n\
     * @returns {*} Returns the first element(s) of `array`.\n\
     * @example\n\
     *\n\
     * _.first([1, 2, 3]);\n\
     * // => 1\n\
     *\n\
     * // returns the first two elements\n\
     * _.first([1, 2, 3], 2);\n\
     * // => [1, 2]\n\
     *\n\
     * // returns elements from the beginning until the callback result is falsey\n\
     * _.first([1, 2, 3], function(num) {\n\
     *   return num < 3;\n\
     * });\n\
     * // => [1, 2]\n\
     *\n\
     * var characters = [\n\
     *   { 'name': 'barney',  'employer': 'slate', 'blocked': true },\n\
     *   { 'name': 'fred',    'employer': 'slate' },\n\
     *   { 'name': 'pebbles', 'employer': 'na',    'blocked': true }\n\
     * ];\n\
     *\n\
     * // using \"_.pluck\" callback shorthand\n\
     * _.first(characters, 'blocked');\n\
     * // => [{ 'name': 'barney', 'employer': 'slate', 'blocked': true }]\n\
     *\n\
     * // using \"_.where\" callback shorthand\n\
     * _.pluck(_.first(characters, { 'employer': 'slate' }), 'name');\n\
     * // => ['barney', 'fred']\n\
     */\n\
    function first(array, callback, thisArg) {\n\
      var n = 0,\n\
          length = array ? array.length : 0;\n\
\n\
      if (typeof callback != 'number' && callback != null) {\n\
        var index = -1;\n\
        callback = lodash.createCallback(callback, thisArg, 3);\n\
        while (++index < length && callback(array[index], index, array)) {\n\
          n++;\n\
        }\n\
      } else {\n\
        n = callback;\n\
        if (n == null || thisArg) {\n\
          return array ? array[0] : undefined;\n\
        }\n\
      }\n\
      return slice(array, 0, n > 0 ? n : 0);\n\
    }\n\
\n\
    /**\n\
     * Flattens a nested array (the nesting can be to any depth). If `isShallow`\n\
     * is truey, the array will only be flattened a single level. If a callback\n\
     * is provided each element of the array is passed through the callback before\n\
     * flattening. The callback is bound to `thisArg` and invoked with three\n\
     * arguments; (value, index, array).\n\
     *\n\
     * If a property name is provided for `callback` the created \"_.pluck\" style\n\
     * callback will return the property value of the given element.\n\
     *\n\
     * If an object is provided for `callback` the created \"_.where\" style callback\n\
     * will return `true` for elements that have the properties of the given object,\n\
     * else `false`.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Arrays\n\
     * @param {Array} array The array to flatten.\n\
     * @param {boolean} [isShallow=false] A flag to restrict flattening to a single level.\n\
     * @param {Function|Object|string} [callback=identity] The function called\n\
     *  per iteration. If a property name or object is provided it will be used\n\
     *  to create a \"_.pluck\" or \"_.where\" style callback, respectively.\n\
     * @param {*} [thisArg] The `this` binding of `callback`.\n\
     * @returns {Array} Returns a new flattened array.\n\
     * @example\n\
     *\n\
     * _.flatten([1, [2], [3, [[4]]]]);\n\
     * // => [1, 2, 3, 4];\n\
     *\n\
     * // using `isShallow`\n\
     * _.flatten([1, [2], [3, [[4]]]], true);\n\
     * // => [1, 2, 3, [[4]]];\n\
     *\n\
     * var characters = [\n\
     *   { 'name': 'barney', 'age': 30, 'pets': ['hoppy'] },\n\
     *   { 'name': 'fred',   'age': 40, 'pets': ['baby puss', 'dino'] }\n\
     * ];\n\
     *\n\
     * // using \"_.pluck\" callback shorthand\n\
     * _.flatten(characters, 'pets');\n\
     * // => ['hoppy', 'baby puss', 'dino']\n\
     */\n\
    function flatten(array, isShallow, callback, thisArg) {\n\
      var type = typeof isShallow;\n\
\n\
      // juggle arguments\n\
      if (type != 'boolean' && isShallow != null) {\n\
        thisArg = callback;\n\
        callback = isShallow;\n\
        isShallow = false;\n\
\n\
        // enables use as a callback for functions like `_.map`\n\
        if ((type == 'number' || type == 'string') && thisArg && thisArg[callback] === array) {\n\
          callback = null;\n\
        }\n\
      }\n\
      if (callback != null) {\n\
        array = map(array, callback, thisArg);\n\
      }\n\
      return baseFlatten(array, isShallow);\n\
    }\n\
\n\
    /**\n\
     * Gets the index at which the first occurrence of `value` is found using\n\
     * strict equality for comparisons, i.e. `===`. If the array is already sorted\n\
     * providing `true` for `fromIndex` will run a faster binary search.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Arrays\n\
     * @param {Array} array The array to search.\n\
     * @param {*} value The value to search for.\n\
     * @param {boolean|number} [fromIndex=0] The index to search from or `true`\n\
     *  to perform a binary search on a sorted array.\n\
     * @returns {number} Returns the index of the matched value or `-1`.\n\
     * @example\n\
     *\n\
     * _.indexOf([1, 2, 3, 1, 2, 3], 2);\n\
     * // => 1\n\
     *\n\
     * // using `fromIndex`\n\
     * _.indexOf([1, 2, 3, 1, 2, 3], 2, 3);\n\
     * // => 4\n\
     *\n\
     * // performing a binary search\n\
     * _.indexOf([1, 1, 2, 2, 3, 3], 2, true);\n\
     * // => 2\n\
     */\n\
    function indexOf(array, value, fromIndex) {\n\
      var length = array ? array.length : 0;\n\
      if (typeof fromIndex == 'number') {\n\
        fromIndex = (fromIndex < 0 ? nativeMax(0, length + fromIndex) : fromIndex || 0);\n\
      } else if (fromIndex) {\n\
        var index = sortedIndex(array, value);\n\
        return (length && array[index] === value) ? index : -1;\n\
      }\n\
      return baseIndexOf(array, value, fromIndex);\n\
    }\n\
\n\
    /**\n\
     * Gets all but the last element or last `n` elements of an array. If a\n\
     * callback is provided elements at the end of the array are excluded from\n\
     * the result as long as the callback returns truey. The callback is bound\n\
     * to `thisArg` and invoked with three arguments; (value, index, array).\n\
     *\n\
     * If a property name is provided for `callback` the created \"_.pluck\" style\n\
     * callback will return the property value of the given element.\n\
     *\n\
     * If an object is provided for `callback` the created \"_.where\" style callback\n\
     * will return `true` for elements that have the properties of the given object,\n\
     * else `false`.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Arrays\n\
     * @param {Array} array The array to query.\n\
     * @param {Function|Object|number|string} [callback=1] The function called\n\
     *  per element or the number of elements to exclude. If a property name or\n\
     *  object is provided it will be used to create a \"_.pluck\" or \"_.where\"\n\
     *  style callback, respectively.\n\
     * @param {*} [thisArg] The `this` binding of `callback`.\n\
     * @returns {Array} Returns a slice of `array`.\n\
     * @example\n\
     *\n\
     * _.initial([1, 2, 3]);\n\
     * // => [1, 2]\n\
     *\n\
     * // excludes the last two elements\n\
     * _.initial([1, 2, 3], 2);\n\
     * // => [1]\n\
     *\n\
     * // excludes elements from the end until the callback fails\n\
     * _.initial([1, 2, 3], function(num) {\n\
     *   return num > 1;\n\
     * });\n\
     * // => [1]\n\
     *\n\
     * var characters = [\n\
     *   { 'name': 'barney',  'employer': 'slate' },\n\
     *   { 'name': 'fred',    'employer': 'slate', 'blocked': true },\n\
     *   { 'name': 'pebbles', 'employer': 'na',    'blocked': true }\n\
     * ];\n\
     *\n\
     * // using \"_.pluck\" callback shorthand\n\
     * _.initial(characters, 'blocked');\n\
     * // => [{ 'name': 'barney',  'blocked': false, 'employer': 'slate' }]\n\
     *\n\
     * // using \"_.where\" callback shorthand\n\
     * _.pluck(_.initial(characters, { 'employer': 'na' }), 'name');\n\
     * // => ['barney', 'fred']\n\
     */\n\
    function initial(array, callback, thisArg) {\n\
      var n = 0,\n\
          length = array ? array.length : 0;\n\
\n\
      if (typeof callback != 'number' && callback != null) {\n\
        var index = length;\n\
        callback = lodash.createCallback(callback, thisArg, 3);\n\
        while (index-- && callback(array[index], index, array)) {\n\
          n++;\n\
        }\n\
      } else {\n\
        n = (callback == null || thisArg) ? 1 : callback || n;\n\
      }\n\
      n = length - n;\n\
      return slice(array, 0, n > 0 ? n : 0);\n\
    }\n\
\n\
    /**\n\
     * Creates an array of unique values present in all provided arrays using\n\
     * strict equality for comparisons, i.e. `===`.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Arrays\n\
     * @param {...Array} [array] The arrays to inspect.\n\
     * @returns {Array} Returns an array of shared values.\n\
     * @example\n\
     *\n\
     * _.intersection([1, 2, 3], [5, 2, 1, 4], [2, 1]);\n\
     * // => [1, 2]\n\
     */\n\
    function intersection() {\n\
      var args = [],\n\
          argsIndex = -1,\n\
          argsLength = arguments.length,\n\
          caches = getArray(),\n\
          indexOf = getIndexOf(),\n\
          largePrereq = createCache && indexOf === baseIndexOf,\n\
          seen = getArray();\n\
\n\
      while (++argsIndex < argsLength) {\n\
        var value = arguments[argsIndex];\n\
        if (isArray(value) || isArguments(value)) {\n\
          args.push(value);\n\
          caches.push(largePrereq && value.length >= LARGE_ARRAY_SIZE &&\n\
            createCache(argsIndex ? args[argsIndex] : seen));\n\
        }\n\
      }\n\
      var array = args[0],\n\
          index = -1,\n\
          length = array ? array.length : 0,\n\
          result = [];\n\
\n\
      outer:\n\
      while (++index < length) {\n\
        var cache = caches[0];\n\
        value = array[index];\n\
\n\
        if ((cache ? cacheIndexOf(cache, value) : indexOf(seen, value)) < 0) {\n\
          argsIndex = argsLength;\n\
          (cache || seen).push(value);\n\
          while (--argsIndex) {\n\
            cache = caches[argsIndex];\n\
            if ((cache ? cacheIndexOf(cache, value) : indexOf(args[argsIndex], value)) < 0) {\n\
              continue outer;\n\
            }\n\
          }\n\
          result.push(value);\n\
        }\n\
      }\n\
      releaseArray(caches);\n\
      releaseArray(seen);\n\
      return result;\n\
    }\n\
\n\
    /**\n\
     * Gets the last element or last `n` elements of an array. If a callback is\n\
     * provided elements at the end of the array are returned as long as the\n\
     * callback returns truey. The callback is bound to `thisArg` and invoked\n\
     * with three arguments; (value, index, array).\n\
     *\n\
     * If a property name is provided for `callback` the created \"_.pluck\" style\n\
     * callback will return the property value of the given element.\n\
     *\n\
     * If an object is provided for `callback` the created \"_.where\" style callback\n\
     * will return `true` for elements that have the properties of the given object,\n\
     * else `false`.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Arrays\n\
     * @param {Array} array The array to query.\n\
     * @param {Function|Object|number|string} [callback] The function called\n\
     *  per element or the number of elements to return. If a property name or\n\
     *  object is provided it will be used to create a \"_.pluck\" or \"_.where\"\n\
     *  style callback, respectively.\n\
     * @param {*} [thisArg] The `this` binding of `callback`.\n\
     * @returns {*} Returns the last element(s) of `array`.\n\
     * @example\n\
     *\n\
     * _.last([1, 2, 3]);\n\
     * // => 3\n\
     *\n\
     * // returns the last two elements\n\
     * _.last([1, 2, 3], 2);\n\
     * // => [2, 3]\n\
     *\n\
     * // returns elements from the end until the callback fails\n\
     * _.last([1, 2, 3], function(num) {\n\
     *   return num > 1;\n\
     * });\n\
     * // => [2, 3]\n\
     *\n\
     * var characters = [\n\
     *   { 'name': 'barney',  'employer': 'slate' },\n\
     *   { 'name': 'fred',    'employer': 'slate', 'blocked': true },\n\
     *   { 'name': 'pebbles', 'employer': 'na',    'blocked': true }\n\
     * ];\n\
     *\n\
     * // using \"_.pluck\" callback shorthand\n\
     * _.pluck(_.last(characters, 'blocked'), 'name');\n\
     * // => ['fred', 'pebbles']\n\
     *\n\
     * // using \"_.where\" callback shorthand\n\
     * _.last(characters, { 'employer': 'na' });\n\
     * // => [{ 'name': 'pebbles', 'employer': 'na', 'blocked': true }]\n\
     */\n\
    function last(array, callback, thisArg) {\n\
      var n = 0,\n\
          length = array ? array.length : 0;\n\
\n\
      if (typeof callback != 'number' && callback != null) {\n\
        var index = length;\n\
        callback = lodash.createCallback(callback, thisArg, 3);\n\
        while (index-- && callback(array[index], index, array)) {\n\
          n++;\n\
        }\n\
      } else {\n\
        n = callback;\n\
        if (n == null || thisArg) {\n\
          return array ? array[length - 1] : undefined;\n\
        }\n\
      }\n\
      n = length - n;\n\
      return slice(array,  n > 0 ? n : 0);\n\
    }\n\
\n\
    /**\n\
     * Gets the index at which the last occurrence of `value` is found using strict\n\
     * equality for comparisons, i.e. `===`. If `fromIndex` is negative, it is used\n\
     * as the offset from the end of the collection.\n\
     *\n\
     * If a property name is provided for `callback` the created \"_.pluck\" style\n\
     * callback will return the property value of the given element.\n\
     *\n\
     * If an object is provided for `callback` the created \"_.where\" style callback\n\
     * will return `true` for elements that have the properties of the given object,\n\
     * else `false`.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Arrays\n\
     * @param {Array} array The array to search.\n\
     * @param {*} value The value to search for.\n\
     * @param {number} [fromIndex=array.length-1] The index to search from.\n\
     * @returns {number} Returns the index of the matched value or `-1`.\n\
     * @example\n\
     *\n\
     * _.lastIndexOf([1, 2, 3, 1, 2, 3], 2);\n\
     * // => 4\n\
     *\n\
     * // using `fromIndex`\n\
     * _.lastIndexOf([1, 2, 3, 1, 2, 3], 2, 3);\n\
     * // => 1\n\
     */\n\
    function lastIndexOf(array, value, fromIndex) {\n\
      var index = array ? array.length : 0;\n\
      if (typeof fromIndex == 'number') {\n\
        index = (fromIndex < 0 ? nativeMax(0, index + fromIndex) : nativeMin(fromIndex, index - 1)) + 1;\n\
      }\n\
      while (index--) {\n\
        if (array[index] === value) {\n\
          return index;\n\
        }\n\
      }\n\
      return -1;\n\
    }\n\
\n\
    /**\n\
     * Removes all provided values from `array` using strict equality for\n\
     * comparisons, i.e. `===`.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Arrays\n\
     * @param {Array} array The array to modify.\n\
     * @param {...*} [value] The values to remove.\n\
     * @returns {Array} Returns `array`.\n\
     * @example\n\
     *\n\
     * var array = [1, 2, 3, 1, 2, 3];\n\
     * _.pull(array, 2, 3);\n\
     * console.log(array);\n\
     * // => [1, 1]\n\
     */\n\
    function pull(array) {\n\
      var argsIndex = 0,\n\
          argsLength = arguments.length,\n\
          length = array ? array.length : 0;\n\
\n\
      while (++argsIndex < argsLength) {\n\
        var index = -1,\n\
            value = arguments[argsIndex];\n\
\n\
        while (++index < length) {\n\
          if (array[index] === value) {\n\
            splice.call(array, index--, 1);\n\
            length--;\n\
          }\n\
        }\n\
      }\n\
      return array;\n\
    }\n\
\n\
    /**\n\
     * Creates an array of numbers (positive and/or negative) progressing from\n\
     * `start` up to but not including `end`. If `start` is less than `stop` a\n\
     * zero-length range is created unless a negative `step` is specified.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Arrays\n\
     * @param {number} [start=0] The start of the range.\n\
     * @param {number} end The end of the range.\n\
     * @param {number} [step=1] The value to increment or decrement by.\n\
     * @returns {Array} Returns a new range array.\n\
     * @example\n\
     *\n\
     * _.range(4);\n\
     * // => [0, 1, 2, 3]\n\
     *\n\
     * _.range(1, 5);\n\
     * // => [1, 2, 3, 4]\n\
     *\n\
     * _.range(0, 20, 5);\n\
     * // => [0, 5, 10, 15]\n\
     *\n\
     * _.range(0, -4, -1);\n\
     * // => [0, -1, -2, -3]\n\
     *\n\
     * _.range(1, 4, 0);\n\
     * // => [1, 1, 1]\n\
     *\n\
     * _.range(0);\n\
     * // => []\n\
     */\n\
    function range(start, end, step) {\n\
      start = +start || 0;\n\
      step = typeof step == 'number' ? step : (+step || 1);\n\
\n\
      if (end == null) {\n\
        end = start;\n\
        start = 0;\n\
      }\n\
      // use `Array(length)` so engines like Chakra and V8 avoid slower modes\n\
      // http://youtu.be/XAqIpGU8ZZk#t=17m25s\n\
      var index = -1,\n\
          length = nativeMax(0, ceil((end - start) / (step || 1))),\n\
          result = Array(length);\n\
\n\
      while (++index < length) {\n\
        result[index] = start;\n\
        start += step;\n\
      }\n\
      return result;\n\
    }\n\
\n\
    /**\n\
     * Removes all elements from an array that the callback returns truey for\n\
     * and returns an array of removed elements. The callback is bound to `thisArg`\n\
     * and invoked with three arguments; (value, index, array).\n\
     *\n\
     * If a property name is provided for `callback` the created \"_.pluck\" style\n\
     * callback will return the property value of the given element.\n\
     *\n\
     * If an object is provided for `callback` the created \"_.where\" style callback\n\
     * will return `true` for elements that have the properties of the given object,\n\
     * else `false`.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Arrays\n\
     * @param {Array} array The array to modify.\n\
     * @param {Function|Object|string} [callback=identity] The function called\n\
     *  per iteration. If a property name or object is provided it will be used\n\
     *  to create a \"_.pluck\" or \"_.where\" style callback, respectively.\n\
     * @param {*} [thisArg] The `this` binding of `callback`.\n\
     * @returns {Array} Returns a new array of removed elements.\n\
     * @example\n\
     *\n\
     * var array = [1, 2, 3, 4, 5, 6];\n\
     * var evens = _.remove(array, function(num) { return num % 2 == 0; });\n\
     *\n\
     * console.log(array);\n\
     * // => [1, 3, 5]\n\
     *\n\
     * console.log(evens);\n\
     * // => [2, 4, 6]\n\
     */\n\
    function remove(array, callback, thisArg) {\n\
      var index = -1,\n\
          length = array ? array.length : 0,\n\
          result = [];\n\
\n\
      callback = lodash.createCallback(callback, thisArg, 3);\n\
      while (++index < length) {\n\
        var value = array[index];\n\
        if (callback(value, index, array)) {\n\
          result.push(value);\n\
          splice.call(array, index--, 1);\n\
          length--;\n\
        }\n\
      }\n\
      return result;\n\
    }\n\
\n\
    /**\n\
     * The opposite of `_.initial`; this method gets all but the first element or\n\
     * first `n` elements of an array. If a callback function is provided elements\n\
     * at the beginning of the array are excluded from the result as long as the\n\
     * callback returns truey. The callback is bound to `thisArg` and invoked\n\
     * with three arguments; (value, index, array).\n\
     *\n\
     * If a property name is provided for `callback` the created \"_.pluck\" style\n\
     * callback will return the property value of the given element.\n\
     *\n\
     * If an object is provided for `callback` the created \"_.where\" style callback\n\
     * will return `true` for elements that have the properties of the given object,\n\
     * else `false`.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @alias drop, tail\n\
     * @category Arrays\n\
     * @param {Array} array The array to query.\n\
     * @param {Function|Object|number|string} [callback=1] The function called\n\
     *  per element or the number of elements to exclude. If a property name or\n\
     *  object is provided it will be used to create a \"_.pluck\" or \"_.where\"\n\
     *  style callback, respectively.\n\
     * @param {*} [thisArg] The `this` binding of `callback`.\n\
     * @returns {Array} Returns a slice of `array`.\n\
     * @example\n\
     *\n\
     * _.rest([1, 2, 3]);\n\
     * // => [2, 3]\n\
     *\n\
     * // excludes the first two elements\n\
     * _.rest([1, 2, 3], 2);\n\
     * // => [3]\n\
     *\n\
     * // excludes elements from the beginning until the callback fails\n\
     * _.rest([1, 2, 3], function(num) {\n\
     *   return num < 3;\n\
     * });\n\
     * // => [3]\n\
     *\n\
     * var characters = [\n\
     *   { 'name': 'barney',  'employer': 'slate', 'blocked': true },\n\
     *   { 'name': 'fred',    'employer': 'slate' },\n\
     *   { 'name': 'pebbles', 'employer': 'na',    'blocked': true }\n\
     * ];\n\
     *\n\
     * // using \"_.pluck\" callback shorthand\n\
     * _.pluck(_.rest(characters, 'blocked'), 'name');\n\
     * // => ['fred', 'pebbles']\n\
     *\n\
     * // using \"_.where\" callback shorthand\n\
     * _.rest(characters, { 'employer': 'slate' });\n\
     * // => [{ 'name': 'pebbles', 'employer': 'na', 'blocked': true }]\n\
     */\n\
    function rest(array, callback, thisArg) {\n\
      if (typeof callback != 'number' && callback != null) {\n\
        var n = 0,\n\
            index = -1,\n\
            length = array ? array.length : 0;\n\
\n\
        callback = lodash.createCallback(callback, thisArg, 3);\n\
        while (++index < length && callback(array[index], index, array)) {\n\
          n++;\n\
        }\n\
      } else if (callback == null || thisArg) {\n\
        n = 1;\n\
      } else {\n\
        n = callback > 0 ? callback : 0;\n\
      }\n\
      return slice(array, n);\n\
    }\n\
\n\
    /**\n\
     * Slices `array` from the `start` index up to, but not including, the `end` index.\n\
     *\n\
     * Note: This function is used instead of `Array#slice` to support node lists\n\
     * in IE < 9 and to ensure dense arrays are returned.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Arrays\n\
     * @param {Array} array The array to slice.\n\
     * @param {number} [start=0] The start index.\n\
     * @param {number} [end=array.length] The end index.\n\
     * @returns {Array} Returns the new array.\n\
     */\n\
    function slice(array, start, end) {\n\
      var index = -1,\n\
          length = array ? array.length : 0;\n\
\n\
      if (typeof start == 'undefined') {\n\
        start = 0;\n\
      } else if (start < 0) {\n\
        start = nativeMax(length + start, 0);\n\
      } else if (start > length) {\n\
        start = length;\n\
      }\n\
      if (typeof end == 'undefined') {\n\
        end = length;\n\
      } else if (end < 0) {\n\
        end = nativeMax(length + end, 0);\n\
      } else if (end > length) {\n\
        end = length;\n\
      }\n\
      length = end - start || 0;\n\
\n\
      var result = Array(length);\n\
      while (++index < length) {\n\
        result[index] = array[start + index];\n\
      }\n\
      return result;\n\
    }\n\
\n\
    /**\n\
     * Uses a binary search to determine the smallest index at which a value\n\
     * should be inserted into a given sorted array in order to maintain the sort\n\
     * order of the array. If a callback is provided it will be executed for\n\
     * `value` and each element of `array` to compute their sort ranking. The\n\
     * callback is bound to `thisArg` and invoked with one argument; (value).\n\
     *\n\
     * If a property name is provided for `callback` the created \"_.pluck\" style\n\
     * callback will return the property value of the given element.\n\
     *\n\
     * If an object is provided for `callback` the created \"_.where\" style callback\n\
     * will return `true` for elements that have the properties of the given object,\n\
     * else `false`.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Arrays\n\
     * @param {Array} array The array to inspect.\n\
     * @param {*} value The value to evaluate.\n\
     * @param {Function|Object|string} [callback=identity] The function called\n\
     *  per iteration. If a property name or object is provided it will be used\n\
     *  to create a \"_.pluck\" or \"_.where\" style callback, respectively.\n\
     * @param {*} [thisArg] The `this` binding of `callback`.\n\
     * @returns {number} Returns the index at which `value` should be inserted\n\
     *  into `array`.\n\
     * @example\n\
     *\n\
     * _.sortedIndex([20, 30, 50], 40);\n\
     * // => 2\n\
     *\n\
     * var dict = {\n\
     *   'wordToNumber': { 'twenty': 20, 'thirty': 30, 'fourty': 40, 'fifty': 50 }\n\
     * };\n\
     *\n\
     * // using `callback`\n\
     * _.sortedIndex(['twenty', 'thirty', 'fifty'], 'fourty', function(word) {\n\
     *   return dict.wordToNumber[word];\n\
     * });\n\
     * // => 2\n\
     *\n\
     * // using `callback` with `thisArg`\n\
     * _.sortedIndex(['twenty', 'thirty', 'fifty'], 'fourty', function(word) {\n\
     *   return this.wordToNumber[word];\n\
     * }, dict);\n\
     * // => 2\n\
     *\n\
     * // using \"_.pluck\" callback shorthand\n\
     * _.sortedIndex([{ 'x': 20 }, { 'x': 30 }, { 'x': 50 }], { 'x': 40 }, 'x');\n\
     * // => 2\n\
     */\n\
    function sortedIndex(array, value, callback, thisArg) {\n\
      var low = 0,\n\
          high = array ? array.length : low;\n\
\n\
      // explicitly reference `identity` for better inlining in Firefox\n\
      callback = callback ? lodash.createCallback(callback, thisArg, 1) : identity;\n\
      value = callback(value);\n\
\n\
      while (low < high) {\n\
        var mid = (low + high) >>> 1;\n\
        (callback(array[mid]) < value)\n\
          ? low = mid + 1\n\
          : high = mid;\n\
      }\n\
      return low;\n\
    }\n\
\n\
    /**\n\
     * Creates an array of unique values, in order, of the provided arrays using\n\
     * strict equality for comparisons, i.e. `===`.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Arrays\n\
     * @param {...Array} [array] The arrays to inspect.\n\
     * @returns {Array} Returns an array of combined values.\n\
     * @example\n\
     *\n\
     * _.union([1, 2, 3], [5, 2, 1, 4], [2, 1]);\n\
     * // => [1, 2, 3, 5, 4]\n\
     */\n\
    function union() {\n\
      return baseUniq(baseFlatten(arguments, true, true));\n\
    }\n\
\n\
    /**\n\
     * Creates a duplicate-value-free version of an array using strict equality\n\
     * for comparisons, i.e. `===`. If the array is sorted, providing\n\
     * `true` for `isSorted` will use a faster algorithm. If a callback is provided\n\
     * each element of `array` is passed through the callback before uniqueness\n\
     * is computed. The callback is bound to `thisArg` and invoked with three\n\
     * arguments; (value, index, array).\n\
     *\n\
     * If a property name is provided for `callback` the created \"_.pluck\" style\n\
     * callback will return the property value of the given element.\n\
     *\n\
     * If an object is provided for `callback` the created \"_.where\" style callback\n\
     * will return `true` for elements that have the properties of the given object,\n\
     * else `false`.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @alias unique\n\
     * @category Arrays\n\
     * @param {Array} array The array to process.\n\
     * @param {boolean} [isSorted=false] A flag to indicate that `array` is sorted.\n\
     * @param {Function|Object|string} [callback=identity] The function called\n\
     *  per iteration. If a property name or object is provided it will be used\n\
     *  to create a \"_.pluck\" or \"_.where\" style callback, respectively.\n\
     * @param {*} [thisArg] The `this` binding of `callback`.\n\
     * @returns {Array} Returns a duplicate-value-free array.\n\
     * @example\n\
     *\n\
     * _.uniq([1, 2, 1, 3, 1]);\n\
     * // => [1, 2, 3]\n\
     *\n\
     * // using `isSorted`\n\
     * _.uniq([1, 1, 2, 2, 3], true);\n\
     * // => [1, 2, 3]\n\
     *\n\
     * // using `callback`\n\
     * _.uniq(['A', 'b', 'C', 'a', 'B', 'c'], function(letter) { return letter.toLowerCase(); });\n\
     * // => ['A', 'b', 'C']\n\
     *\n\
     * // using `callback` with `thisArg`\n\
     * _.uniq([1, 2.5, 3, 1.5, 2, 3.5], function(num) { return this.floor(num); }, Math);\n\
     * // => [1, 2.5, 3]\n\
     *\n\
     * // using \"_.pluck\" callback shorthand\n\
     * _.uniq([{ 'x': 1 }, { 'x': 2 }, { 'x': 1 }], 'x');\n\
     * // => [{ 'x': 1 }, { 'x': 2 }]\n\
     */\n\
    function uniq(array, isSorted, callback, thisArg) {\n\
      var type = typeof isSorted;\n\
\n\
      // juggle arguments\n\
      if (type != 'boolean' && isSorted != null) {\n\
        thisArg = callback;\n\
        callback = isSorted;\n\
        isSorted = false;\n\
\n\
        // enables use as a callback for functions like `_.map`\n\
        if ((type == 'number' || type == 'string') && thisArg && thisArg[callback] === array) {\n\
          callback = null;\n\
        }\n\
      }\n\
      if (callback != null) {\n\
        callback = lodash.createCallback(callback, thisArg, 3);\n\
      }\n\
      return baseUniq(array, isSorted, callback);\n\
    }\n\
\n\
    /**\n\
     * Creates an array excluding all provided values using strict equality for\n\
     * comparisons, i.e. `===`.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Arrays\n\
     * @param {Array} array The array to filter.\n\
     * @param {...*} [value] The values to exclude.\n\
     * @returns {Array} Returns a new array of filtered values.\n\
     * @example\n\
     *\n\
     * _.without([1, 2, 1, 0, 3, 1, 4], 0, 1);\n\
     * // => [2, 3, 4]\n\
     */\n\
    function without(array) {\n\
      return baseDifference(array, slice(arguments, 1));\n\
    }\n\
\n\
    /**\n\
     * Creates an array that is the symmetric difference of the provided arrays.\n\
     * See [Wikipedia](http://en.wikipedia.org/wiki/Symmetric_difference) for more details.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Arrays\n\
     * @param {...Array} [array] The arrays to inspect.\n\
     * @returns {Array} Returns an array of values.\n\
     * @example\n\
     *\n\
     * _.xor([1, 2, 3], [5, 2, 1, 4]);\n\
     * // => [3, 5, 4]\n\
     *\n\
     * _.xor([1, 2, 5], [2, 3, 5], [3, 4, 5]);\n\
     * // => [1, 4, 5]\n\
     */\n\
    function xor() {\n\
      var index = -1,\n\
          length = arguments.length;\n\
\n\
      while (++index < length) {\n\
        var array = arguments[index];\n\
        if (isArray(array) || isArguments(array)) {\n\
          var result = result\n\
            ? baseDifference(result, array).concat(baseDifference(array, result))\n\
            : array;\n\
        }\n\
      }\n\
      return result ? baseUniq(result) : [];\n\
    }\n\
\n\
    /**\n\
     * Creates an array of grouped elements, the first of which contains the first\n\
     * elements of the given arrays, the second of which contains the second elements\n\
     * of the given arrays, and so on. If a zipped value is provided its corresponding\n\
     * unzipped value will be returned.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @alias unzip\n\
     * @category Arrays\n\
     * @param {...Array} [array] Arrays to process.\n\
     * @returns {Array} Returns a new array of grouped elements.\n\
     * @example\n\
     *\n\
     * _.zip(['fred', 'barney'], [30, 40], [true, false]);\n\
     * // => [['fred', 30, true], ['barney', 40, false]]\n\
     *\n\
     * _.unzip([['fred', 30, true], ['barney', 40, false]]);\n\
     * // => [['fred', 'barney'], [30, 40], [true, false]]\n\
     */\n\
    function zip() {\n\
      var array = arguments.length > 1 ? arguments : arguments[0],\n\
          index = -1,\n\
          length = array ? max(pluck(array, 'length')) : 0,\n\
          result = Array(length < 0 ? 0 : length);\n\
\n\
      while (++index < length) {\n\
        result[index] = pluck(array, index);\n\
      }\n\
      return result;\n\
    }\n\
\n\
    /**\n\
     * Creates an object composed from arrays of `keys` and `values`. Provide\n\
     * either a single two dimensional array, i.e. `[[key1, value1], [key2, value2]]`\n\
     * or two arrays, one of `keys` and one of corresponding `values`.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @alias object\n\
     * @category Arrays\n\
     * @param {Array} keys The array of keys.\n\
     * @param {Array} [values=[]] The array of values.\n\
     * @returns {Object} Returns an object composed of the given keys and\n\
     *  corresponding values.\n\
     * @example\n\
     *\n\
     * _.zipObject(['fred', 'barney'], [30, 40]);\n\
     * // => { 'fred': 30, 'barney': 40 }\n\
     */\n\
    function zipObject(keys, values) {\n\
      var index = -1,\n\
          length = keys ? keys.length : 0,\n\
          result = {};\n\
\n\
      if (!values && length && !isArray(keys[0])) {\n\
        values = [];\n\
      }\n\
      while (++index < length) {\n\
        var key = keys[index];\n\
        if (values) {\n\
          result[key] = values[index];\n\
        } else if (key) {\n\
          result[key[0]] = key[1];\n\
        }\n\
      }\n\
      return result;\n\
    }\n\
\n\
    /*--------------------------------------------------------------------------*/\n\
\n\
    /**\n\
     * Creates a `lodash` object that wraps `value` with explicit method\n\
     * chaining enabled.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Chaining\n\
     * @param {*} value The value to wrap.\n\
     * @returns {Object} Returns the wrapper object.\n\
     * @example\n\
     *\n\
     * var characters = [\n\
     *   { 'name': 'barney',  'age': 36 },\n\
     *   { 'name': 'fred',    'age': 40 },\n\
     *   { 'name': 'pebbles', 'age': 1 }\n\
     * ];\n\
     *\n\
     * var youngest = _.chain(characters)\n\
     *     .sortBy('age')\n\
     *     .map(function(chr) { return chr.name + ' is ' + chr.age; })\n\
     *     .first()\n\
     *     .value();\n\
     * // => 'pebbles is 1'\n\
     */\n\
    function chain(value) {\n\
      value = new lodashWrapper(value);\n\
      value.__chain__ = true;\n\
      return value;\n\
    }\n\
\n\
    /**\n\
     * This method invokes `interceptor` and returns `value`. The interceptor is\n\
     * bound to `thisArg` and invoked with one argument; (value). The purpose of\n\
     * this method is to \"tap into\" a method chain in order to perform operations\n\
     * on intermediate results within the chain.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Chaining\n\
     * @param {*} value The value to provide to `interceptor`.\n\
     * @param {Function} interceptor The function to invoke.\n\
     * @param {*} [thisArg] The `this` binding of `interceptor`.\n\
     * @returns {*} Returns `value`.\n\
     * @example\n\
     *\n\
     * _([1, 2, 3, 4])\n\
     *  .tap(function(array) { array.pop(); })\n\
     *  .reverse()\n\
     *  .value();\n\
     * // => [3, 2, 1]\n\
     */\n\
    function tap(value, interceptor, thisArg) {\n\
      interceptor.call(thisArg, value);\n\
      return value;\n\
    }\n\
\n\
    /**\n\
     * Enables explicit method chaining on the wrapper object.\n\
     *\n\
     * @name chain\n\
     * @memberOf _\n\
     * @category Chaining\n\
     * @returns {*} Returns the wrapper object.\n\
     * @example\n\
     *\n\
     * var characters = [\n\
     *   { 'name': 'barney', 'age': 36 },\n\
     *   { 'name': 'fred',   'age': 40 }\n\
     * ];\n\
     *\n\
     * // without explicit chaining\n\
     * _(characters).first();\n\
     * // => { 'name': 'barney', 'age': 36 }\n\
     *\n\
     * // with explicit chaining\n\
     * _(characters).chain()\n\
     *   .first()\n\
     *   .pick('age')\n\
     *   .value();\n\
     * // => { 'age': 36 }\n\
     */\n\
    function wrapperChain() {\n\
      this.__chain__ = true;\n\
      return this;\n\
    }\n\
\n\
    /**\n\
     * Produces the `toString` result of the wrapped value.\n\
     *\n\
     * @name toString\n\
     * @memberOf _\n\
     * @category Chaining\n\
     * @returns {string} Returns the string result.\n\
     * @example\n\
     *\n\
     * _([1, 2, 3]).toString();\n\
     * // => '1,2,3'\n\
     */\n\
    function wrapperToString() {\n\
      return String(this.__wrapped__);\n\
    }\n\
\n\
    /**\n\
     * Extracts the wrapped value.\n\
     *\n\
     * @name valueOf\n\
     * @memberOf _\n\
     * @alias value\n\
     * @category Chaining\n\
     * @returns {*} Returns the wrapped value.\n\
     * @example\n\
     *\n\
     * _([1, 2, 3]).valueOf();\n\
     * // => [1, 2, 3]\n\
     */\n\
    function wrapperValueOf() {\n\
      return this.__wrapped__;\n\
    }\n\
\n\
    /*--------------------------------------------------------------------------*/\n\
\n\
    /**\n\
     * Creates an array of elements from the specified indexes, or keys, of the\n\
     * `collection`. Indexes may be specified as individual arguments or as arrays\n\
     * of indexes.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Collections\n\
     * @param {Array|Object|string} collection The collection to iterate over.\n\
     * @param {...(number|number[]|string|string[])} [index] The indexes of `collection`\n\
     *   to retrieve, specified as individual indexes or arrays of indexes.\n\
     * @returns {Array} Returns a new array of elements corresponding to the\n\
     *  provided indexes.\n\
     * @example\n\
     *\n\
     * _.at(['a', 'b', 'c', 'd', 'e'], [0, 2, 4]);\n\
     * // => ['a', 'c', 'e']\n\
     *\n\
     * _.at(['fred', 'barney', 'pebbles'], 0, 2);\n\
     * // => ['fred', 'pebbles']\n\
     */\n\
    function at(collection, guard) {\n\
      var args = arguments,\n\
          index = -1,\n\
          props = baseFlatten(args, true, false, 1),\n\
          length = props.length,\n\
          type = typeof guard;\n\
\n\
      // enables use as a callback for functions like `_.map`\n\
      if ((type == 'number' || type == 'string') && args[2] && args[2][guard] === collection) {\n\
        length = 1;\n\
      }\n\
      if (support.unindexedChars && isString(collection)) {\n\
        collection = collection.split('');\n\
      }\n\
      var result = Array(length);\n\
      while(++index < length) {\n\
        result[index] = collection[props[index]];\n\
      }\n\
      return result;\n\
    }\n\
\n\
    /**\n\
     * Checks if a given value is present in a collection using strict equality\n\
     * for comparisons, i.e. `===`. If `fromIndex` is negative, it is used as the\n\
     * offset from the end of the collection.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @alias include\n\
     * @category Collections\n\
     * @param {Array|Object|string} collection The collection to iterate over.\n\
     * @param {*} target The value to check for.\n\
     * @param {number} [fromIndex=0] The index to search from.\n\
     * @returns {boolean} Returns `true` if the `target` element is found, else `false`.\n\
     * @example\n\
     *\n\
     * _.contains([1, 2, 3], 1);\n\
     * // => true\n\
     *\n\
     * _.contains([1, 2, 3], 1, 2);\n\
     * // => false\n\
     *\n\
     * _.contains({ 'name': 'fred', 'age': 40 }, 'fred');\n\
     * // => true\n\
     *\n\
     * _.contains('pebbles', 'eb');\n\
     * // => true\n\
     */\n\
    function contains(collection, target, fromIndex) {\n\
      var length = collection ? collection.length : 0;\n\
      fromIndex = typeof fromIndex == 'number' ? fromIndex : 0;\n\
\n\
      if (typeof length == 'number') {\n\
        if (fromIndex >= length) {\n\
          return false;\n\
        }\n\
        if (typeof collection == 'string' || !isArray(collection) && isString(collection)) {\n\
          return nativeContains\n\
            ? nativeContains.call(collection, target, fromIndex)\n\
            : collection.indexOf(target, fromIndex) > -1;\n\
        }\n\
        var indexOf = getIndexOf();\n\
        fromIndex = (fromIndex < 0 ? nativeMax(0, length + fromIndex) : fromIndex) || 0;\n\
        return indexOf(collection, target, fromIndex) > -1;\n\
      }\n\
      var index = -1,\n\
          result = false;\n\
\n\
      baseEach(collection, function(value) {\n\
        if (++index >= fromIndex) {\n\
          return !(result = value === target);\n\
        }\n\
      });\n\
\n\
      return result;\n\
    }\n\
\n\
    /**\n\
     * Creates an object composed of keys generated from the results of running\n\
     * each element of `collection` through the callback. The corresponding value\n\
     * of each key is the number of times the key was returned by the callback.\n\
     * The callback is bound to `thisArg` and invoked with three arguments;\n\
     * (value, index|key, collection).\n\
     *\n\
     * If a property name is provided for `callback` the created \"_.pluck\" style\n\
     * callback will return the property value of the given element.\n\
     *\n\
     * If an object is provided for `callback` the created \"_.where\" style callback\n\
     * will return `true` for elements that have the properties of the given object,\n\
     * else `false`.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Collections\n\
     * @param {Array|Object|string} collection The collection to iterate over.\n\
     * @param {Function|Object|string} [callback=identity] The function called\n\
     *  per iteration. If a property name or object is provided it will be used\n\
     *  to create a \"_.pluck\" or \"_.where\" style callback, respectively.\n\
     * @param {*} [thisArg] The `this` binding of `callback`.\n\
     * @returns {Object} Returns the composed aggregate object.\n\
     * @example\n\
     *\n\
     * _.countBy([4.3, 6.1, 6.4], function(num) { return Math.floor(num); });\n\
     * // => { '4': 1, '6': 2 }\n\
     *\n\
     * _.countBy([4.3, 6.1, 6.4], function(num) { return this.floor(num); }, Math);\n\
     * // => { '4': 1, '6': 2 }\n\
     *\n\
     * _.countBy(['one', 'two', 'three'], 'length');\n\
     * // => { '3': 2, '5': 1 }\n\
     */\n\
    var countBy = createAggregator(function(result, value, key) {\n\
      (hasOwnProperty.call(result, key) ? result[key]++ : result[key] = 1);\n\
    });\n\
\n\
    /**\n\
     * Checks if the callback returns truey value for **all** elements of a\n\
     * collection. The callback is bound to `thisArg` and invoked with three\n\
     * arguments; (value, index|key, collection).\n\
     *\n\
     * If a property name is provided for `callback` the created \"_.pluck\" style\n\
     * callback will return the property value of the given element.\n\
     *\n\
     * If an object is provided for `callback` the created \"_.where\" style callback\n\
     * will return `true` for elements that have the properties of the given object,\n\
     * else `false`.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @alias all\n\
     * @category Collections\n\
     * @param {Array|Object|string} collection The collection to iterate over.\n\
     * @param {Function|Object|string} [callback=identity] The function called\n\
     *  per iteration. If a property name or object is provided it will be used\n\
     *  to create a \"_.pluck\" or \"_.where\" style callback, respectively.\n\
     * @param {*} [thisArg] The `this` binding of `callback`.\n\
     * @returns {boolean} Returns `true` if all elements passed the callback check,\n\
     *  else `false`.\n\
     * @example\n\
     *\n\
     * _.every([true, 1, null, 'yes']);\n\
     * // => false\n\
     *\n\
     * var characters = [\n\
     *   { 'name': 'barney', 'age': 36 },\n\
     *   { 'name': 'fred',   'age': 40 }\n\
     * ];\n\
     *\n\
     * // using \"_.pluck\" callback shorthand\n\
     * _.every(characters, 'age');\n\
     * // => true\n\
     *\n\
     * // using \"_.where\" callback shorthand\n\
     * _.every(characters, { 'age': 36 });\n\
     * // => false\n\
     */\n\
    function every(collection, callback, thisArg) {\n\
      var result = true;\n\
\n\
      callback = lodash.createCallback(callback, thisArg, 3);\n\
      if (isArray(collection)) {\n\
        var index = -1,\n\
            length = collection.length;\n\
\n\
        while (++index < length) {\n\
          if (!callback(collection[index], index, collection)) {\n\
            return false;\n\
          }\n\
        }\n\
      } else {\n\
        baseEach(collection, function(value, index, collection) {\n\
          return (result = !!callback(value, index, collection));\n\
        });\n\
      }\n\
      return result;\n\
    }\n\
\n\
    /**\n\
     * Iterates over elements of a collection, returning an array of all elements\n\
     * the callback returns truey for. The callback is bound to `thisArg` and\n\
     * invoked with three arguments; (value, index|key, collection).\n\
     *\n\
     * If a property name is provided for `callback` the created \"_.pluck\" style\n\
     * callback will return the property value of the given element.\n\
     *\n\
     * If an object is provided for `callback` the created \"_.where\" style callback\n\
     * will return `true` for elements that have the properties of the given object,\n\
     * else `false`.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @alias select\n\
     * @category Collections\n\
     * @param {Array|Object|string} collection The collection to iterate over.\n\
     * @param {Function|Object|string} [callback=identity] The function called\n\
     *  per iteration. If a property name or object is provided it will be used\n\
     *  to create a \"_.pluck\" or \"_.where\" style callback, respectively.\n\
     * @param {*} [thisArg] The `this` binding of `callback`.\n\
     * @returns {Array} Returns a new array of elements that passed the callback check.\n\
     * @example\n\
     *\n\
     * var evens = _.filter([1, 2, 3, 4], function(num) { return num % 2 == 0; });\n\
     * // => [2, 4]\n\
     *\n\
     * var characters = [\n\
     *   { 'name': 'barney', 'age': 36 },\n\
     *   { 'name': 'fred',   'age': 40, 'blocked': true }\n\
     * ];\n\
     *\n\
     * // using \"_.pluck\" callback shorthand\n\
     * _.filter(characters, 'blocked');\n\
     * // => [{ 'name': 'fred', 'age': 40, 'blocked': true }]\n\
     *\n\
     * // using \"_.where\" callback shorthand\n\
     * _.filter(characters, { 'age': 36 });\n\
     * // => [{ 'name': 'barney', 'age': 36 }]\n\
     */\n\
    function filter(collection, callback, thisArg) {\n\
      var result = [];\n\
\n\
      callback = lodash.createCallback(callback, thisArg, 3);\n\
      if (isArray(collection)) {\n\
        var index = -1,\n\
            length = collection.length;\n\
\n\
        while (++index < length) {\n\
          var value = collection[index];\n\
          if (callback(value, index, collection)) {\n\
            result.push(value);\n\
          }\n\
        }\n\
      } else {\n\
        baseEach(collection, function(value, index, collection) {\n\
          if (callback(value, index, collection)) {\n\
            result.push(value);\n\
          }\n\
        });\n\
      }\n\
      return result;\n\
    }\n\
\n\
    /**\n\
     * Iterates over elements of a collection, returning the first element that\n\
     * the callback returns truey for. The callback is bound to `thisArg` and\n\
     * invoked with three arguments; (value, index|key, collection).\n\
     *\n\
     * If a property name is provided for `callback` the created \"_.pluck\" style\n\
     * callback will return the property value of the given element.\n\
     *\n\
     * If an object is provided for `callback` the created \"_.where\" style callback\n\
     * will return `true` for elements that have the properties of the given object,\n\
     * else `false`.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @alias detect, findWhere\n\
     * @category Collections\n\
     * @param {Array|Object|string} collection The collection to iterate over.\n\
     * @param {Function|Object|string} [callback=identity] The function called\n\
     *  per iteration. If a property name or object is provided it will be used\n\
     *  to create a \"_.pluck\" or \"_.where\" style callback, respectively.\n\
     * @param {*} [thisArg] The `this` binding of `callback`.\n\
     * @returns {*} Returns the found element, else `undefined`.\n\
     * @example\n\
     *\n\
     * var characters = [\n\
     *   { 'name': 'barney',  'age': 36 },\n\
     *   { 'name': 'fred',    'age': 40, 'blocked': true },\n\
     *   { 'name': 'pebbles', 'age': 1 }\n\
     * ];\n\
     *\n\
     * _.find(characters, function(chr) {\n\
     *   return chr.age < 40;\n\
     * });\n\
     * // => { 'name': 'barney', 'age': 36 }\n\
     *\n\
     * // using \"_.where\" callback shorthand\n\
     * _.find(characters, { 'age': 1 });\n\
     * // =>  { 'name': 'pebbles', 'age': 1 }\n\
     *\n\
     * // using \"_.pluck\" callback shorthand\n\
     * _.find(characters, 'blocked');\n\
     * // => { 'name': 'fred', 'age': 40, 'blocked': true }\n\
     */\n\
    function find(collection, callback, thisArg) {\n\
      callback = lodash.createCallback(callback, thisArg, 3);\n\
      if (isArray(collection)) {\n\
        var index = -1,\n\
            length = collection.length;\n\
\n\
        while (++index < length) {\n\
          var value = collection[index];\n\
          if (callback(value, index, collection)) {\n\
            return value;\n\
          }\n\
        }\n\
      } else {\n\
        var result;\n\
        baseEach(collection, function(value, index, collection) {\n\
          if (callback(value, index, collection)) {\n\
            result = value;\n\
            return false;\n\
          }\n\
        });\n\
        return result;\n\
      }\n\
    }\n\
\n\
    /**\n\
     * This method is like `_.find` except that it iterates over elements\n\
     * of a `collection` from right to left.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Collections\n\
     * @param {Array|Object|string} collection The collection to iterate over.\n\
     * @param {Function|Object|string} [callback=identity] The function called\n\
     *  per iteration. If a property name or object is provided it will be used\n\
     *  to create a \"_.pluck\" or \"_.where\" style callback, respectively.\n\
     * @param {*} [thisArg] The `this` binding of `callback`.\n\
     * @returns {*} Returns the found element, else `undefined`.\n\
     * @example\n\
     *\n\
     * _.findLast([1, 2, 3, 4], function(num) {\n\
     *   return num % 2 == 1;\n\
     * });\n\
     * // => 3\n\
     */\n\
    function findLast(collection, callback, thisArg) {\n\
      var result;\n\
\n\
      callback = lodash.createCallback(callback, thisArg, 3);\n\
      baseEachRight(collection, function(value, index, collection) {\n\
        if (callback(value, index, collection)) {\n\
          result = value;\n\
          return false;\n\
        }\n\
      });\n\
      return result;\n\
    }\n\
\n\
    /**\n\
     * Iterates over elements of a collection, executing the callback for each\n\
     * element. The callback is bound to `thisArg` and invoked with three arguments;\n\
     * (value, index|key, collection). Callbacks may exit iteration early by\n\
     * explicitly returning `false`.\n\
     *\n\
     * Note: As with other \"Collections\" methods, objects with a `length` property\n\
     * are iterated like arrays. To avoid this behavior `_.forIn` or `_.forOwn`\n\
     * may be used for object iteration.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @alias each\n\
     * @category Collections\n\
     * @param {Array|Object|string} collection The collection to iterate over.\n\
     * @param {Function} [callback=identity] The function called per iteration.\n\
     * @param {*} [thisArg] The `this` binding of `callback`.\n\
     * @returns {Array|Object|string} Returns `collection`.\n\
     * @example\n\
     *\n\
     * _([1, 2, 3]).forEach(function(num) { console.log(num); }).join(',');\n\
     * // => logs each number and returns '1,2,3'\n\
     *\n\
     * _.forEach({ 'one': 1, 'two': 2, 'three': 3 }, function(num) { console.log(num); });\n\
     * // => logs each number and returns the object (property order is not guaranteed across environments)\n\
     */\n\
    function forEach(collection, callback, thisArg) {\n\
      if (callback && typeof thisArg == 'undefined' && isArray(collection)) {\n\
        var index = -1,\n\
            length = collection.length;\n\
\n\
        while (++index < length) {\n\
          if (callback(collection[index], index, collection) === false) {\n\
            break;\n\
          }\n\
        }\n\
      } else {\n\
        baseEach(collection, baseCreateCallback(callback, thisArg, 3));\n\
      }\n\
      return collection;\n\
    }\n\
\n\
    /**\n\
     * This method is like `_.forEach` except that it iterates over elements\n\
     * of a `collection` from right to left.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @alias eachRight\n\
     * @category Collections\n\
     * @param {Array|Object|string} collection The collection to iterate over.\n\
     * @param {Function} [callback=identity] The function called per iteration.\n\
     * @param {*} [thisArg] The `this` binding of `callback`.\n\
     * @returns {Array|Object|string} Returns `collection`.\n\
     * @example\n\
     *\n\
     * _([1, 2, 3]).forEachRight(function(num) { console.log(num); }).join(',');\n\
     * // => logs each number from right to left and returns '3,2,1'\n\
     */\n\
    function forEachRight(collection, callback, thisArg) {\n\
      if (callback && typeof thisArg == 'undefined' && isArray(collection)) {\n\
        var length = collection.length;\n\
        while (length--) {\n\
          if (callback(collection[length], length, collection) === false) {\n\
            break;\n\
          }\n\
        }\n\
      } else {\n\
        baseEachRight(collection, baseCreateCallback(callback, thisArg, 3));\n\
      }\n\
      return collection;\n\
    }\n\
\n\
    /**\n\
     * Creates an object composed of keys generated from the results of running\n\
     * each element of a collection through the callback. The corresponding value\n\
     * of each key is an array of the elements responsible for generating the key.\n\
     * The callback is bound to `thisArg` and invoked with three arguments;\n\
     * (value, index|key, collection).\n\
     *\n\
     * If a property name is provided for `callback` the created \"_.pluck\" style\n\
     * callback will return the property value of the given element.\n\
     *\n\
     * If an object is provided for `callback` the created \"_.where\" style callback\n\
     * will return `true` for elements that have the properties of the given object,\n\
     * else `false`.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Collections\n\
     * @param {Array|Object|string} collection The collection to iterate over.\n\
     * @param {Function|Object|string} [callback=identity] The function called\n\
     *  per iteration. If a property name or object is provided it will be used\n\
     *  to create a \"_.pluck\" or \"_.where\" style callback, respectively.\n\
     * @param {*} [thisArg] The `this` binding of `callback`.\n\
     * @returns {Object} Returns the composed aggregate object.\n\
     * @example\n\
     *\n\
     * _.groupBy([4.2, 6.1, 6.4], function(num) { return Math.floor(num); });\n\
     * // => { '4': [4.2], '6': [6.1, 6.4] }\n\
     *\n\
     * _.groupBy([4.2, 6.1, 6.4], function(num) { return this.floor(num); }, Math);\n\
     * // => { '4': [4.2], '6': [6.1, 6.4] }\n\
     *\n\
     * // using \"_.pluck\" callback shorthand\n\
     * _.groupBy(['one', 'two', 'three'], 'length');\n\
     * // => { '3': ['one', 'two'], '5': ['three'] }\n\
     */\n\
    var groupBy = createAggregator(function(result, value, key) {\n\
      if (hasOwnProperty.call(result, key)) {\n\
        result[key].push(value);\n\
      } else {\n\
        result[key] = [value];\n\
      }\n\
    });\n\
\n\
    /**\n\
     * Creates an object composed of keys generated from the results of running\n\
     * each element of the collection through the given callback. The corresponding\n\
     * value of each key is the last element responsible for generating the key.\n\
     * The callback is bound to `thisArg` and invoked with three arguments;\n\
     * (value, index|key, collection).\n\
     *\n\
     * If a property name is provided for `callback` the created \"_.pluck\" style\n\
     * callback will return the property value of the given element.\n\
     *\n\
     * If an object is provided for `callback` the created \"_.where\" style callback\n\
     * will return `true` for elements that have the properties of the given object,\n\
     * else `false`.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Collections\n\
     * @param {Array|Object|string} collection The collection to iterate over.\n\
     * @param {Function|Object|string} [callback=identity] The function called\n\
     *  per iteration. If a property name or object is provided it will be used\n\
     *  to create a \"_.pluck\" or \"_.where\" style callback, respectively.\n\
     * @param {*} [thisArg] The `this` binding of `callback`.\n\
     * @returns {Object} Returns the composed aggregate object.\n\
     * @example\n\
     *\n\
     * var keys = [\n\
     *   { 'dir': 'left', 'code': 97 },\n\
     *   { 'dir': 'right', 'code': 100 }\n\
     * ];\n\
     *\n\
     * _.indexBy(keys, 'dir');\n\
     * // => { 'left': { 'dir': 'left', 'code': 97 }, 'right': { 'dir': 'right', 'code': 100 } }\n\
     *\n\
     * _.indexBy(keys, function(key) { return String.fromCharCode(key.code); });\n\
     * // => { 'a': { 'dir': 'left', 'code': 97 }, 'd': { 'dir': 'right', 'code': 100 } }\n\
     *\n\
     * _.indexBy(characters, function(key) { this.fromCharCode(key.code); }, String);\n\
     * // => { 'a': { 'dir': 'left', 'code': 97 }, 'd': { 'dir': 'right', 'code': 100 } }\n\
     */\n\
    var indexBy = createAggregator(function(result, value, key) {\n\
      result[key] = value;\n\
    });\n\
\n\
    /**\n\
     * Invokes the method named by `methodName` on each element in the `collection`\n\
     * returning an array of the results of each invoked method. Additional arguments\n\
     * will be provided to each invoked method. If `methodName` is a function it\n\
     * will be invoked for, and `this` bound to, each element in the `collection`.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Collections\n\
     * @param {Array|Object|string} collection The collection to iterate over.\n\
     * @param {Function|string} methodName The name of the method to invoke or\n\
     *  the function invoked per iteration.\n\
     * @param {...*} [args] Arguments to invoke the method with.\n\
     * @returns {Array} Returns a new array of the results of each invoked method.\n\
     * @example\n\
     *\n\
     * _.invoke([[5, 1, 7], [3, 2, 1]], 'sort');\n\
     * // => [[1, 5, 7], [1, 2, 3]]\n\
     *\n\
     * _.invoke([123, 456], String.prototype.split, '');\n\
     * // => [['1', '2', '3'], ['4', '5', '6']]\n\
     */\n\
    function invoke(collection, methodName) {\n\
      var index = -1,\n\
          isFunc = typeof methodName == 'function',\n\
          length = collection ? collection.length : 0,\n\
          result = Array(typeof length == 'number' ? length : 0);\n\
\n\
      if (arguments.length < 3 && isArray(collection)) {\n\
        while (++index < length) {\n\
          var value = collection[index];\n\
          result[index] = isFunc ? methodName.call(value) : value[methodName]();\n\
        }\n\
      } else {\n\
        var args = slice(arguments, 2);\n\
        baseEach(collection, function(value) {\n\
          result[++index] = (isFunc ? methodName : value[methodName]).apply(value, args);\n\
        });\n\
      }\n\
      return result;\n\
    }\n\
\n\
    /**\n\
     * Creates an array of values by running each element in the collection\n\
     * through the callback. The callback is bound to `thisArg` and invoked with\n\
     * three arguments; (value, index|key, collection).\n\
     *\n\
     * If a property name is provided for `callback` the created \"_.pluck\" style\n\
     * callback will return the property value of the given element.\n\
     *\n\
     * If an object is provided for `callback` the created \"_.where\" style callback\n\
     * will return `true` for elements that have the properties of the given object,\n\
     * else `false`.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @alias collect\n\
     * @category Collections\n\
     * @param {Array|Object|string} collection The collection to iterate over.\n\
     * @param {Function|Object|string} [callback=identity] The function called\n\
     *  per iteration. If a property name or object is provided it will be used\n\
     *  to create a \"_.pluck\" or \"_.where\" style callback, respectively.\n\
     * @param {*} [thisArg] The `this` binding of `callback`.\n\
     * @returns {Array} Returns a new array of the results of each `callback` execution.\n\
     * @example\n\
     *\n\
     * _.map([1, 2, 3], function(num) { return num * 3; });\n\
     * // => [3, 6, 9]\n\
     *\n\
     * _.map({ 'one': 1, 'two': 2, 'three': 3 }, function(num) { return num * 3; });\n\
     * // => [3, 6, 9] (property order is not guaranteed across environments)\n\
     *\n\
     * var characters = [\n\
     *   { 'name': 'barney', 'age': 36 },\n\
     *   { 'name': 'fred',   'age': 40 }\n\
     * ];\n\
     *\n\
     * // using \"_.pluck\" callback shorthand\n\
     * _.map(characters, 'name');\n\
     * // => ['barney', 'fred']\n\
     */\n\
    function map(collection, callback, thisArg) {\n\
      var index = -1,\n\
          length = collection ? collection.length : 0,\n\
          result = Array(typeof length == 'number' ? length : 0);\n\
\n\
      callback = lodash.createCallback(callback, thisArg, 3);\n\
      if (isArray(collection)) {\n\
        while (++index < length) {\n\
          result[index] = callback(collection[index], index, collection);\n\
        }\n\
      } else {\n\
        baseEach(collection, function(value, key, collection) {\n\
          result[++index] = callback(value, key, collection);\n\
        });\n\
      }\n\
      return result;\n\
    }\n\
\n\
    /**\n\
     * Retrieves the maximum value of a collection. If the collection is empty or\n\
     * falsey `-Infinity` is returned. If a callback is provided it will be executed\n\
     * for each value in the collection to generate the criterion by which the value\n\
     * is ranked. The callback is bound to `thisArg` and invoked with three\n\
     * arguments; (value, index, collection).\n\
     *\n\
     * If a property name is provided for `callback` the created \"_.pluck\" style\n\
     * callback will return the property value of the given element.\n\
     *\n\
     * If an object is provided for `callback` the created \"_.where\" style callback\n\
     * will return `true` for elements that have the properties of the given object,\n\
     * else `false`.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Collections\n\
     * @param {Array|Object|string} collection The collection to iterate over.\n\
     * @param {Function|Object|string} [callback=identity] The function called\n\
     *  per iteration. If a property name or object is provided it will be used\n\
     *  to create a \"_.pluck\" or \"_.where\" style callback, respectively.\n\
     * @param {*} [thisArg] The `this` binding of `callback`.\n\
     * @returns {*} Returns the maximum value.\n\
     * @example\n\
     *\n\
     * _.max([4, 2, 8, 6]);\n\
     * // => 8\n\
     *\n\
     * var characters = [\n\
     *   { 'name': 'barney', 'age': 36 },\n\
     *   { 'name': 'fred',   'age': 40 }\n\
     * ];\n\
     *\n\
     * _.max(characters, function(chr) { return chr.age; });\n\
     * // => { 'name': 'fred', 'age': 40 };\n\
     *\n\
     * // using \"_.pluck\" callback shorthand\n\
     * _.max(characters, 'age');\n\
     * // => { 'name': 'fred', 'age': 40 };\n\
     */\n\
    function max(collection, callback, thisArg) {\n\
      var computed = -Infinity,\n\
          result = computed,\n\
          type = typeof callback;\n\
\n\
      // enables use as a callback for functions like `_.map`\n\
      if ((type == 'number' || type == 'string') && thisArg && thisArg[callback] === collection) {\n\
        callback = null;\n\
      }\n\
      if (callback == null && isArray(collection)) {\n\
        var index = -1,\n\
            length = collection.length;\n\
\n\
        while (++index < length) {\n\
          var value = collection[index];\n\
          if (value > result) {\n\
            result = value;\n\
          }\n\
        }\n\
      } else {\n\
        callback = (callback == null && isString(collection))\n\
          ? charAtCallback\n\
          : lodash.createCallback(callback, thisArg, 3);\n\
\n\
        baseEach(collection, function(value, index, collection) {\n\
          var current = callback(value, index, collection);\n\
          if (current > computed) {\n\
            computed = current;\n\
            result = value;\n\
          }\n\
        });\n\
      }\n\
      return result;\n\
    }\n\
\n\
    /**\n\
     * Retrieves the minimum value of a collection. If the collection is empty or\n\
     * falsey `Infinity` is returned. If a callback is provided it will be executed\n\
     * for each value in the collection to generate the criterion by which the value\n\
     * is ranked. The callback is bound to `thisArg` and invoked with three\n\
     * arguments; (value, index, collection).\n\
     *\n\
     * If a property name is provided for `callback` the created \"_.pluck\" style\n\
     * callback will return the property value of the given element.\n\
     *\n\
     * If an object is provided for `callback` the created \"_.where\" style callback\n\
     * will return `true` for elements that have the properties of the given object,\n\
     * else `false`.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Collections\n\
     * @param {Array|Object|string} collection The collection to iterate over.\n\
     * @param {Function|Object|string} [callback=identity] The function called\n\
     *  per iteration. If a property name or object is provided it will be used\n\
     *  to create a \"_.pluck\" or \"_.where\" style callback, respectively.\n\
     * @param {*} [thisArg] The `this` binding of `callback`.\n\
     * @returns {*} Returns the minimum value.\n\
     * @example\n\
     *\n\
     * _.min([4, 2, 8, 6]);\n\
     * // => 2\n\
     *\n\
     * var characters = [\n\
     *   { 'name': 'barney', 'age': 36 },\n\
     *   { 'name': 'fred',   'age': 40 }\n\
     * ];\n\
     *\n\
     * _.min(characters, function(chr) { return chr.age; });\n\
     * // => { 'name': 'barney', 'age': 36 };\n\
     *\n\
     * // using \"_.pluck\" callback shorthand\n\
     * _.min(characters, 'age');\n\
     * // => { 'name': 'barney', 'age': 36 };\n\
     */\n\
    function min(collection, callback, thisArg) {\n\
      var computed = Infinity,\n\
          result = computed,\n\
          type = typeof callback;\n\
\n\
      // enables use as a callback for functions like `_.map`\n\
      if ((type == 'number' || type == 'string') && thisArg && thisArg[callback] === collection) {\n\
        callback = null;\n\
      }\n\
      if (callback == null && isArray(collection)) {\n\
        var index = -1,\n\
            length = collection.length;\n\
\n\
        while (++index < length) {\n\
          var value = collection[index];\n\
          if (value < result) {\n\
            result = value;\n\
          }\n\
        }\n\
      } else {\n\
        callback = (callback == null && isString(collection))\n\
          ? charAtCallback\n\
          : lodash.createCallback(callback, thisArg, 3);\n\
\n\
        baseEach(collection, function(value, index, collection) {\n\
          var current = callback(value, index, collection);\n\
          if (current < computed) {\n\
            computed = current;\n\
            result = value;\n\
          }\n\
        });\n\
      }\n\
      return result;\n\
    }\n\
\n\
    /**\n\
     * Creates an array of elements split into two groups, the first of which\n\
     * contains elements the callback returns truey for, while the second of which\n\
     * contains elements the callback returns falsey for. The callback is bound\n\
     * to `thisArg` and invoked with three arguments; (value, index|key, collection).\n\
     *\n\
     * If a property name is provided for `callback` the created \"_.pluck\" style\n\
     * callback will return the property value of the given element.\n\
     *\n\
     * If an object is provided for `callback` the created \"_.where\" style callback\n\
     * will return `true` for elements that have the properties of the given object,\n\
     * else `false`.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Collections\n\
     * @param {Array|Object|string} collection The collection to iterate over.\n\
     * @param {Function|Object|string} [callback=identity] The function called\n\
     *  per iteration. If a property name or object is provided it will be used\n\
     *  to create a \"_.pluck\" or \"_.where\" style callback, respectively.\n\
     * @param {*} [thisArg] The `this` binding of `callback`.\n\
     * @returns {Array} Returns a new array of grouped elements.\n\
     * @example\n\
     *\n\
     * _.partition([1, 2, 3], function(num) { return num % 2; });\n\
     * // => [[1, 3], [2]]\n\
     *\n\
     * _.partition([1.2, 2.3, 3.4], function(num) { return this.floor(num) % 2; }, Math);\n\
     * // => [[1, 3], [2]]\n\
     *\n\
     * var characters = [\n\
     *   { 'name': 'barney',  'age': 36 },\n\
     *   { 'name': 'fred',    'age': 40, 'blocked': true },\n\
     *   { 'name': 'pebbles', 'age': 1 }\n\
     * ];\n\
     *\n\
     * // using \"_.where\" callback shorthand\n\
     * _.map(_.partition(characters, { 'age': 1 }), function(array) { return _.pluck(array, 'name'); });\n\
     * // => [['pebbles'], ['barney', 'fred']]\n\
     *\n\
     * // using \"_.pluck\" callback shorthand\n\
     * _.map(_.partition(characters, 'blocked'), function(array) { return _.pluck(array, 'name'); });\n\
     * // => [['fred'], ['barney', 'pebbles']]\n\
     */\n\
    var partition = createAggregator(function(result, value, key) {\n\
      result[key ? 0 : 1].push(value);\n\
    }, true);\n\
\n\
    /**\n\
     * Retrieves the value of a specified property from all elements in the collection.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @type Function\n\
     * @category Collections\n\
     * @param {Array|Object|string} collection The collection to iterate over.\n\
     * @param {string} key The name of the property to pluck.\n\
     * @returns {Array} Returns a new array of property values.\n\
     * @example\n\
     *\n\
     * var characters = [\n\
     *   { 'name': 'barney', 'age': 36 },\n\
     *   { 'name': 'fred',   'age': 40 }\n\
     * ];\n\
     *\n\
     * _.pluck(characters, 'name');\n\
     * // => ['barney', 'fred']\n\
     */\n\
    var pluck = map;\n\
\n\
    /**\n\
     * Reduces a collection to a value which is the accumulated result of running\n\
     * each element in the collection through the callback, where each successive\n\
     * callback execution consumes the return value of the previous execution. If\n\
     * `accumulator` is not provided the first element of the collection will be\n\
     * used as the initial `accumulator` value. The callback is bound to `thisArg`\n\
     * and invoked with four arguments; (accumulator, value, index|key, collection).\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @alias foldl, inject\n\
     * @category Collections\n\
     * @param {Array|Object|string} collection The collection to iterate over.\n\
     * @param {Function} [callback=identity] The function called per iteration.\n\
     * @param {*} [accumulator] Initial value of the accumulator.\n\
     * @param {*} [thisArg] The `this` binding of `callback`.\n\
     * @returns {*} Returns the accumulated value.\n\
     * @example\n\
     *\n\
     * var sum = _.reduce([1, 2, 3], function(sum, num) {\n\
     *   return sum + num;\n\
     * });\n\
     * // => 6\n\
     *\n\
     * var mapped = _.reduce({ 'a': 1, 'b': 2, 'c': 3 }, function(result, num, key) {\n\
     *   result[key] = num * 3;\n\
     *   return result;\n\
     * }, {});\n\
     * // => { 'a': 3, 'b': 6, 'c': 9 }\n\
     */\n\
    function reduce(collection, callback, accumulator, thisArg) {\n\
      var noaccum = arguments.length < 3;\n\
\n\
      callback = lodash.createCallback(callback, thisArg, 4);\n\
      if (isArray(collection)) {\n\
        var index = -1,\n\
            length = collection.length;\n\
\n\
        if (noaccum && length) {\n\
          accumulator = collection[++index];\n\
        }\n\
        while (++index < length) {\n\
          accumulator = callback(accumulator, collection[index], index, collection);\n\
        }\n\
      } else {\n\
        baseEach(collection, function(value, index, collection) {\n\
          accumulator = noaccum\n\
            ? (noaccum = false, value)\n\
            : callback(accumulator, value, index, collection)\n\
        });\n\
      }\n\
      return accumulator;\n\
    }\n\
\n\
    /**\n\
     * This method is like `_.reduce` except that it iterates over elements\n\
     * of a `collection` from right to left.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @alias foldr\n\
     * @category Collections\n\
     * @param {Array|Object|string} collection The collection to iterate over.\n\
     * @param {Function} [callback=identity] The function called per iteration.\n\
     * @param {*} [accumulator] Initial value of the accumulator.\n\
     * @param {*} [thisArg] The `this` binding of `callback`.\n\
     * @returns {*} Returns the accumulated value.\n\
     * @example\n\
     *\n\
     * var list = [[0, 1], [2, 3], [4, 5]];\n\
     * var flat = _.reduceRight(list, function(a, b) { return a.concat(b); }, []);\n\
     * // => [4, 5, 2, 3, 0, 1]\n\
     */\n\
    function reduceRight(collection, callback, accumulator, thisArg) {\n\
      var noaccum = arguments.length < 3;\n\
\n\
      callback = lodash.createCallback(callback, thisArg, 4);\n\
      baseEachRight(collection, function(value, index, collection) {\n\
        accumulator = noaccum\n\
          ? (noaccum = false, value)\n\
          : callback(accumulator, value, index, collection);\n\
      });\n\
      return accumulator;\n\
    }\n\
\n\
    /**\n\
     * The opposite of `_.filter`; this method returns the elements of a\n\
     * collection that the callback does **not** return truey for.\n\
     *\n\
     * If a property name is provided for `callback` the created \"_.pluck\" style\n\
     * callback will return the property value of the given element.\n\
     *\n\
     * If an object is provided for `callback` the created \"_.where\" style callback\n\
     * will return `true` for elements that have the properties of the given object,\n\
     * else `false`.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Collections\n\
     * @param {Array|Object|string} collection The collection to iterate over.\n\
     * @param {Function|Object|string} [callback=identity] The function called\n\
     *  per iteration. If a property name or object is provided it will be used\n\
     *  to create a \"_.pluck\" or \"_.where\" style callback, respectively.\n\
     * @param {*} [thisArg] The `this` binding of `callback`.\n\
     * @returns {Array} Returns a new array of elements that failed the callback check.\n\
     * @example\n\
     *\n\
     * var odds = _.reject([1, 2, 3, 4], function(num) { return num % 2 == 0; });\n\
     * // => [1, 3]\n\
     *\n\
     * var characters = [\n\
     *   { 'name': 'barney', 'age': 36 },\n\
     *   { 'name': 'fred',   'age': 40, 'blocked': true }\n\
     * ];\n\
     *\n\
     * // using \"_.pluck\" callback shorthand\n\
     * _.reject(characters, 'blocked');\n\
     * // => [{ 'name': 'barney', 'age': 36 }]\n\
     *\n\
     * // using \"_.where\" callback shorthand\n\
     * _.reject(characters, { 'age': 36 });\n\
     * // => [{ 'name': 'fred', 'age': 40, 'blocked': true }]\n\
     */\n\
    function reject(collection, callback, thisArg) {\n\
      callback = lodash.createCallback(callback, thisArg, 3);\n\
      return filter(collection, function(value, index, collection) {\n\
        return !callback(value, index, collection);\n\
      });\n\
    }\n\
\n\
    /**\n\
     * Retrieves a random element or `n` random elements from a collection.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Collections\n\
     * @param {Array|Object|string} collection The collection to sample.\n\
     * @param {number} [n] The number of elements to sample.\n\
     * @param- {Object} [guard] Enables use as a callback for functions like `_.map`.\n\
     * @returns {*} Returns the random sample(s) of `collection`.\n\
     * @example\n\
     *\n\
     * _.sample([1, 2, 3, 4]);\n\
     * // => 2\n\
     *\n\
     * _.sample([1, 2, 3, 4], 2);\n\
     * // => [3, 1]\n\
     */\n\
    function sample(collection, n, guard) {\n\
      if (collection && typeof collection.length != 'number') {\n\
        collection = values(collection);\n\
      } else if (support.unindexedChars && isString(collection)) {\n\
        collection = collection.split('');\n\
      }\n\
      if (n == null || guard) {\n\
        return collection ? collection[baseRandom(0, collection.length - 1)] : undefined;\n\
      }\n\
      var result = shuffle(collection);\n\
      result.length = nativeMin(nativeMax(0, n), result.length);\n\
      return result;\n\
    }\n\
\n\
    /**\n\
     * Creates an array of shuffled values, using a version of the Fisher-Yates\n\
     * shuffle. See [Wikipedia](http://en.wikipedia.org/wiki/Fisher-Yates_shuffle) for more details.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Collections\n\
     * @param {Array|Object|string} collection The collection to shuffle.\n\
     * @returns {Array} Returns a new shuffled collection.\n\
     * @example\n\
     *\n\
     * _.shuffle([1, 2, 3, 4]);\n\
     * // => [4, 1, 3, 2]\n\
     */\n\
    function shuffle(collection) {\n\
      var index = -1,\n\
          length = collection ? collection.length : 0,\n\
          result = Array(typeof length == 'number' ? length : 0);\n\
\n\
      baseEach(collection, function(value) {\n\
        var rand = baseRandom(0, ++index);\n\
        result[index] = result[rand];\n\
        result[rand] = value;\n\
      });\n\
\n\
      return result;\n\
    }\n\
\n\
    /**\n\
     * Gets the size of the `collection` by returning `collection.length` for arrays\n\
     * and array-like objects or the number of own enumerable properties for objects.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Collections\n\
     * @param {Array|Object|string} collection The collection to inspect.\n\
     * @returns {number} Returns `collection.length` or number of own enumerable properties.\n\
     * @example\n\
     *\n\
     * _.size([1, 2]);\n\
     * // => 2\n\
     *\n\
     * _.size({ 'one': 1, 'two': 2, 'three': 3 });\n\
     * // => 3\n\
     *\n\
     * _.size('pebbles');\n\
     * // => 7\n\
     */\n\
    function size(collection) {\n\
      var length = collection ? collection.length : 0;\n\
      return typeof length == 'number' ? length : keys(collection).length;\n\
    }\n\
\n\
    /**\n\
     * Checks if the callback returns a truey value for **any** element of a\n\
     * collection. The function returns as soon as it finds a passing value and\n\
     * does not iterate over the entire collection. The callback is bound to\n\
     * `thisArg` and invoked with three arguments; (value, index|key, collection).\n\
     *\n\
     * If a property name is provided for `callback` the created \"_.pluck\" style\n\
     * callback will return the property value of the given element.\n\
     *\n\
     * If an object is provided for `callback` the created \"_.where\" style callback\n\
     * will return `true` for elements that have the properties of the given object,\n\
     * else `false`.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @alias any\n\
     * @category Collections\n\
     * @param {Array|Object|string} collection The collection to iterate over.\n\
     * @param {Function|Object|string} [callback=identity] The function called\n\
     *  per iteration. If a property name or object is provided it will be used\n\
     *  to create a \"_.pluck\" or \"_.where\" style callback, respectively.\n\
     * @param {*} [thisArg] The `this` binding of `callback`.\n\
     * @returns {boolean} Returns `true` if any element passed the callback check,\n\
     *  else `false`.\n\
     * @example\n\
     *\n\
     * _.some([null, 0, 'yes', false], Boolean);\n\
     * // => true\n\
     *\n\
     * var characters = [\n\
     *   { 'name': 'barney', 'age': 36 },\n\
     *   { 'name': 'fred',   'age': 40, 'blocked': true }\n\
     * ];\n\
     *\n\
     * // using \"_.pluck\" callback shorthand\n\
     * _.some(characters, 'blocked');\n\
     * // => true\n\
     *\n\
     * // using \"_.where\" callback shorthand\n\
     * _.some(characters, { 'age': 1 });\n\
     * // => false\n\
     */\n\
    function some(collection, callback, thisArg) {\n\
      var result;\n\
\n\
      callback = lodash.createCallback(callback, thisArg, 3);\n\
      if (isArray(collection)) {\n\
        var index = -1,\n\
            length = collection.length;\n\
\n\
        while (++index < length) {\n\
          if (callback(collection[index], index, collection)) {\n\
            return true;\n\
          }\n\
        }\n\
      } else {\n\
        baseEach(collection, function(value, index, collection) {\n\
          return !(result = callback(value, index, collection));\n\
        });\n\
      }\n\
      return !!result;\n\
    }\n\
\n\
    /**\n\
     * Creates an array of elements, sorted in ascending order by the results of\n\
     * running each element in a collection through the callback. This method\n\
     * performs a stable sort, that is, it will preserve the original sort order\n\
     * of equal elements. The callback is bound to `thisArg` and invoked with\n\
     * three arguments; (value, index|key, collection).\n\
     *\n\
     * If a property name is provided for `callback` the created \"_.pluck\" style\n\
     * callback will return the property value of the given element.\n\
     *\n\
     * If an array of property names is provided for `callback` the collection\n\
     * will be sorted by each property value.\n\
     *\n\
     * If an object is provided for `callback` the created \"_.where\" style callback\n\
     * will return `true` for elements that have the properties of the given object,\n\
     * else `false`.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Collections\n\
     * @param {Array|Object|string} collection The collection to iterate over.\n\
     * @param {Array|Function|Object|string} [callback=identity] The function called\n\
     *  per iteration. If a property name or object is provided it will be used\n\
     *  to create a \"_.pluck\" or \"_.where\" style callback, respectively.\n\
     * @param {*} [thisArg] The `this` binding of `callback`.\n\
     * @returns {Array} Returns a new array of sorted elements.\n\
     * @example\n\
     *\n\
     * _.sortBy([1, 2, 3], function(num) { return Math.sin(num); });\n\
     * // => [3, 1, 2]\n\
     *\n\
     * _.sortBy([1, 2, 3], function(num) { return this.sin(num); }, Math);\n\
     * // => [3, 1, 2]\n\
     *\n\
     * var characters = [\n\
     *   { 'name': 'barney',  'age': 36 },\n\
     *   { 'name': 'fred',    'age': 40 },\n\
     *   { 'name': 'barney',  'age': 26 },\n\
     *   { 'name': 'fred',    'age': 30 }\n\
     * ];\n\
     *\n\
     * // using \"_.pluck\" callback shorthand\n\
     * _.map(_.sortBy(characters, 'age'), _.values);\n\
     * // => [['barney', 26], ['fred', 30], ['barney', 36], ['fred', 40]]\n\
     *\n\
     * // sorting by multiple properties\n\
     * _.map(_.sortBy(characters, ['name', 'age']), _.values);\n\
     * // = > [['barney', 26], ['barney', 36], ['fred', 30], ['fred', 40]]\n\
     */\n\
    function sortBy(collection, callback, thisArg) {\n\
      var index = -1,\n\
          multi = callback && isArray(callback),\n\
          length = collection ? collection.length : 0,\n\
          result = Array(typeof length == 'number' ? length : 0);\n\
\n\
      if (!multi) {\n\
        callback = lodash.createCallback(callback, thisArg, 3);\n\
      }\n\
      baseEach(collection, function(value, key, collection) {\n\
        if (multi) {\n\
          var length = callback.length,\n\
              criteria = Array(length);\n\
\n\
          while (length--) {\n\
            criteria[length] = value[callback[length]];\n\
          }\n\
        } else {\n\
          criteria = callback(value, key, collection);\n\
        }\n\
        var object = result[++index] = getObject();\n\
        object.criteria = criteria;\n\
        object.index = index;\n\
        object.value = value;\n\
      });\n\
\n\
      length = result.length;\n\
      result.sort(multi ? compareMultipleAscending : compareAscending);\n\
      while (length--) {\n\
        var object = result[length];\n\
        result[length] = object.value;\n\
        releaseObject(object);\n\
      }\n\
      return result;\n\
    }\n\
\n\
    /**\n\
     * Converts the `collection` to an array.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Collections\n\
     * @param {Array|Object|string} collection The collection to convert.\n\
     * @returns {Array} Returns the new converted array.\n\
     * @example\n\
     *\n\
     * (function() { return _.toArray(arguments).slice(1); })(1, 2, 3, 4);\n\
     * // => [2, 3, 4]\n\
     */\n\
    function toArray(collection) {\n\
      if (collection && typeof collection.length == 'number') {\n\
        return (support.unindexedChars && isString(collection))\n\
          ? collection.split('')\n\
          : slice(collection);\n\
      }\n\
      return values(collection);\n\
    }\n\
\n\
    /**\n\
     * Performs a deep comparison between each element in `collection` and the\n\
     * `source` object, returning an array of all elements that have equivalent\n\
     * property values.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @type Function\n\
     * @category Collections\n\
     * @param {Array|Object|string} collection The collection to iterate over.\n\
     * @param {Object} source The object of property values to filter by.\n\
     * @returns {Array} Returns a new array of elements that have the given properties.\n\
     * @example\n\
     *\n\
     * var characters = [\n\
     *   { 'name': 'barney', 'age': 36, 'pets': ['hoppy'] },\n\
     *   { 'name': 'fred',   'age': 40, 'pets': ['baby puss', 'dino'] }\n\
     * ];\n\
     *\n\
     * _.where(characters, { 'age': 36 });\n\
     * // => [{ 'name': 'barney', 'age': 36, 'pets': ['hoppy'] }]\n\
     *\n\
     * _.where(characters, { 'pets': ['dino'] });\n\
     * // => [{ 'name': 'fred', 'age': 40, 'pets': ['baby puss', 'dino'] }]\n\
     */\n\
    var where = filter;\n\
\n\
    /*--------------------------------------------------------------------------*/\n\
\n\
    /**\n\
     * Creates a function that executes `func`, with  the `this` binding and\n\
     * arguments of the created function, only after being called `n` times.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Functions\n\
     * @param {number} n The number of times the function must be called before\n\
     *  `func` is executed.\n\
     * @param {Function} func The function to restrict.\n\
     * @returns {Function} Returns the new restricted function.\n\
     * @example\n\
     *\n\
     * var saves = ['profile', 'settings'];\n\
     *\n\
     * var done = _.after(saves.length, function() {\n\
     *   console.log('Done saving!');\n\
     * });\n\
     *\n\
     * _.forEach(saves, function(type) {\n\
     *   asyncSave({ 'type': type, 'complete': done });\n\
     * });\n\
     * // => logs 'Done saving!', after all saves have completed\n\
     */\n\
    function after(n, func) {\n\
      if (!isFunction(func)) {\n\
        throw new TypeError;\n\
      }\n\
      return function() {\n\
        if (--n < 1) {\n\
          return func.apply(this, arguments);\n\
        }\n\
      };\n\
    }\n\
\n\
    /**\n\
     * Creates a function that, when called, invokes `func` with the `this`\n\
     * binding of `thisArg` and prepends any additional `bind` arguments to those\n\
     * provided to the bound function.\n\
     *\n\
     * Note: Unlike native `Function#bind` this method does not set the `length`\n\
     * property of bound functions.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Functions\n\
     * @param {Function} func The function to bind.\n\
     * @param {*} [thisArg] The `this` binding of `func`.\n\
     * @param {...*} [args] Arguments to be partially applied.\n\
     * @returns {Function} Returns the new bound function.\n\
     * @example\n\
     *\n\
     * var func = function(greeting) {\n\
     *   return greeting + ' ' + this.name;\n\
     * };\n\
     *\n\
     * func = _.bind(func, { 'name': 'fred' }, 'hi');\n\
     * func();\n\
     * // => 'hi fred'\n\
     */\n\
    function bind(func, thisArg) {\n\
      if (arguments.length < 3) {\n\
        return createWrapper(func, BIND_FLAG, null, thisArg);\n\
      }\n\
      if (func) {\n\
        var arity = func[expando] ? func[expando][2] : func.length,\n\
            partialArgs = slice(arguments, 2);\n\
\n\
        arity -= partialArgs.length;\n\
      }\n\
      return createWrapper(func, BIND_FLAG | PARTIAL_FLAG, arity, thisArg, partialArgs);\n\
    }\n\
\n\
    /**\n\
     * Binds methods of an object to the object itself, overwriting the existing\n\
     * method. Method names may be specified as individual arguments or as arrays\n\
     * of method names. If no method names are provided all the function properties\n\
     * of `object` will be bound.\n\
     *\n\
     * Note: This method does not set the `length` property of bound functions.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Functions\n\
     * @param {Object} object The object to bind and assign the bound methods to.\n\
     * @param {...string} [methodName] The object method names to\n\
     *  bind, specified as individual method names or arrays of method names.\n\
     * @returns {Object} Returns `object`.\n\
     * @example\n\
     *\n\
     * var view = {\n\
     *   'label': 'docs',\n\
     *   'onClick': function() { console.log('clicked ' + this.label); }\n\
     * };\n\
     *\n\
     * _.bindAll(view);\n\
     * jQuery('#docs').on('click', view.onClick);\n\
     * // => logs 'clicked docs', when the button is clicked\n\
     */\n\
    function bindAll(object) {\n\
      var funcs = arguments.length > 1 ? baseFlatten(arguments, true, false, 1) : functions(object),\n\
          index = -1,\n\
          length = funcs.length;\n\
\n\
      while (++index < length) {\n\
        var key = funcs[index];\n\
        object[key] = createWrapper(object[key], BIND_FLAG, null, object);\n\
      }\n\
      return object;\n\
    }\n\
\n\
    /**\n\
     * Creates a function that, when called, invokes the method at `object[key]`\n\
     * and prepends any additional `bindKey` arguments to those provided to the bound\n\
     * function. This method differs from `_.bind` by allowing bound functions to\n\
     * reference methods that will be redefined or don't yet exist.\n\
     * See [Peter Michaux's article](http://michaux.ca/articles/lazy-function-definition-pattern)\n\
     * for more details.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Functions\n\
     * @param {Object} object The object the method belongs to.\n\
     * @param {string} key The key of the method.\n\
     * @param {...*} [args] Arguments to be partially applied.\n\
     * @returns {Function} Returns the new bound function.\n\
     * @example\n\
     *\n\
     * var object = {\n\
     *   'name': 'fred',\n\
     *   'greet': function(greeting) {\n\
     *     return greeting + ' ' + this.name;\n\
     *   }\n\
     * };\n\
     *\n\
     * var func = _.bindKey(object, 'greet', 'hi');\n\
     * func();\n\
     * // => 'hi fred'\n\
     *\n\
     * object.greet = function(greeting) {\n\
     *   return greeting + 'ya ' + this.name + '!';\n\
     * };\n\
     *\n\
     * func();\n\
     * // => 'hiya fred!'\n\
     */\n\
    function bindKey(object, key) {\n\
      return arguments.length < 3\n\
        ? createWrapper(key, BIND_FLAG | BIND_KEY_FLAG, null, object)\n\
        : createWrapper(key, BIND_FLAG | BIND_KEY_FLAG | PARTIAL_FLAG, null, object, slice(arguments, 2));\n\
    }\n\
\n\
    /**\n\
     * Creates a function that is the composition of the provided functions,\n\
     * where each function consumes the return value of the function that follows.\n\
     * For example, composing the functions `f()`, `g()`, and `h()` produces `f(g(h()))`.\n\
     * Each function is executed with the `this` binding of the composed function.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Functions\n\
     * @param {...Function} [func] Functions to compose.\n\
     * @returns {Function} Returns the new composed function.\n\
     * @example\n\
     *\n\
     * var realNameMap = {\n\
     *   'pebbles': 'penelope'\n\
     * };\n\
     *\n\
     * var format = function(name) {\n\
     *   name = realNameMap[name.toLowerCase()] || name;\n\
     *   return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();\n\
     * };\n\
     *\n\
     * var greet = function(formatted) {\n\
     *   return 'Hiya ' + formatted + '!';\n\
     * };\n\
     *\n\
     * var welcome = _.compose(greet, format);\n\
     * welcome('pebbles');\n\
     * // => 'Hiya Penelope!'\n\
     */\n\
    function compose() {\n\
      var funcs = arguments,\n\
          funcsLength = funcs.length,\n\
          length = funcsLength;\n\
\n\
      while (length--) {\n\
        if (!isFunction(funcs[length])) {\n\
          throw new TypeError;\n\
        }\n\
      }\n\
      return function() {\n\
        var length = funcsLength - 1,\n\
            result = funcs[length].apply(this, arguments);\n\
\n\
        while (length--) {\n\
          result = funcs[length].call(this, result);\n\
        }\n\
        return result;\n\
      };\n\
    }\n\
\n\
    /**\n\
     * Creates a function which accepts one or more arguments of `func` that when\n\
     * invoked either executes `func` returning its result, if all `func` arguments\n\
     * have been provided, or returns a function that accepts one or more of the\n\
     * remaining `func` arguments, and so on. The arity of `func` can be specified\n\
     * if `func.length` is not sufficient.\n\
     *\n\
     * Note: This method does not set the `length` property of curried functions.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Functions\n\
     * @param {Function} func The function to curry.\n\
     * @param {number} [arity=func.length] The arity of `func`.\n\
     * @returns {Function} Returns the new curried function.\n\
     * @example\n\
     *\n\
     * var curried = _.curry(function(a, b, c) {\n\
     *   console.log(a + b + c);\n\
     * });\n\
     *\n\
     * curried(1)(2)(3);\n\
     * // => 6\n\
     *\n\
     * curried(1, 2)(3);\n\
     * // => 6\n\
     *\n\
     * curried(1, 2, 3);\n\
     * // => 6\n\
     */\n\
    function curry(func, arity) {\n\
      if (typeof arity != 'number') {\n\
        arity = +arity || (func ? func.length : 0);\n\
      }\n\
      return createWrapper(func, CURRY_FLAG, arity);\n\
    }\n\
\n\
    /**\n\
     * Creates a function that will delay the execution of `func` until after\n\
     * `wait` milliseconds have elapsed since the last time it was invoked.\n\
     * Provide an options object to indicate that `func` should be invoked on\n\
     * the leading and/or trailing edge of the `wait` timeout. Subsequent calls\n\
     * to the debounced function will return the result of the last `func` call.\n\
     *\n\
     * Note: If `leading` and `trailing` options are `true` `func` will be called\n\
     * on the trailing edge of the timeout only if the the debounced function is\n\
     * invoked more than once during the `wait` timeout.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Functions\n\
     * @param {Function} func The function to debounce.\n\
     * @param {number} wait The number of milliseconds to delay.\n\
     * @param {Object} [options] The options object.\n\
     * @param {boolean} [options.leading=false] Specify execution on the leading edge of the timeout.\n\
     * @param {number} [options.maxWait] The maximum time `func` is allowed to be delayed before it's called.\n\
     * @param {boolean} [options.trailing=true] Specify execution on the trailing edge of the timeout.\n\
     * @returns {Function} Returns the new debounced function.\n\
     * @example\n\
     *\n\
     * // avoid costly calculations while the window size is in flux\n\
     * var lazyLayout = _.debounce(calculateLayout, 150);\n\
     * jQuery(window).on('resize', lazyLayout);\n\
     *\n\
     * // execute `sendMail` when the click event is fired, debouncing subsequent calls\n\
     * jQuery('#postbox').on('click', _.debounce(sendMail, 300, {\n\
     *   'leading': true,\n\
     *   'trailing': false\n\
     * });\n\
     *\n\
     * // ensure `batchLog` is executed once after 1 second of debounced calls\n\
     * var source = new EventSource('/stream');\n\
     * source.addEventListener('message', _.debounce(batchLog, 250, {\n\
     *   'maxWait': 1000\n\
     * }, false);\n\
     */\n\
    function debounce(func, wait, options) {\n\
      var args,\n\
          maxTimeoutId,\n\
          result,\n\
          stamp,\n\
          thisArg,\n\
          timeoutId,\n\
          trailingCall,\n\
          lastCalled = 0,\n\
          maxWait = false,\n\
          trailing = true;\n\
\n\
      if (!isFunction(func)) {\n\
        throw new TypeError;\n\
      }\n\
      wait = nativeMax(0, wait) || 0;\n\
      if (options === true) {\n\
        var leading = true;\n\
        trailing = false;\n\
      } else if (isObject(options)) {\n\
        leading = options.leading;\n\
        maxWait = 'maxWait' in options && (nativeMax(wait, options.maxWait) || 0);\n\
        trailing = 'trailing' in options ? options.trailing : trailing;\n\
      }\n\
      var delayed = function() {\n\
        var remaining = wait - (now() - stamp);\n\
        if (remaining <= 0 || remaining > wait) {\n\
          if (maxTimeoutId) {\n\
            clearTimeout(maxTimeoutId);\n\
          }\n\
          var isCalled = trailingCall;\n\
          maxTimeoutId = timeoutId = trailingCall = undefined;\n\
          if (isCalled) {\n\
            lastCalled = now();\n\
            result = func.apply(thisArg, args);\n\
            if (!timeoutId && !maxTimeoutId) {\n\
              args = thisArg = null;\n\
            }\n\
          }\n\
        } else {\n\
          timeoutId = setTimeout(delayed, remaining);\n\
        }\n\
      };\n\
\n\
      var maxDelayed = function() {\n\
        if (timeoutId) {\n\
          clearTimeout(timeoutId);\n\
        }\n\
        maxTimeoutId = timeoutId = trailingCall = undefined;\n\
        if (trailing || (maxWait !== wait)) {\n\
          lastCalled = now();\n\
          result = func.apply(thisArg, args);\n\
          if (!timeoutId && !maxTimeoutId) {\n\
            args = thisArg = null;\n\
          }\n\
        }\n\
      };\n\
\n\
      return function() {\n\
        args = arguments;\n\
        stamp = now();\n\
        thisArg = this;\n\
        trailingCall = trailing && (timeoutId || !leading);\n\
\n\
        if (maxWait === false) {\n\
          var leadingCall = leading && !timeoutId;\n\
        } else {\n\
          if (!maxTimeoutId && !leading) {\n\
            lastCalled = stamp;\n\
          }\n\
          var remaining = maxWait - (stamp - lastCalled),\n\
              isCalled = remaining <= 0 || remaining > maxWait;\n\
\n\
          if (isCalled) {\n\
            if (maxTimeoutId) {\n\
              maxTimeoutId = clearTimeout(maxTimeoutId);\n\
            }\n\
            lastCalled = stamp;\n\
            result = func.apply(thisArg, args);\n\
          }\n\
          else if (!maxTimeoutId) {\n\
            maxTimeoutId = setTimeout(maxDelayed, remaining);\n\
          }\n\
        }\n\
        if (isCalled && timeoutId) {\n\
          timeoutId = clearTimeout(timeoutId);\n\
        }\n\
        else if (!timeoutId && wait !== maxWait) {\n\
          timeoutId = setTimeout(delayed, wait);\n\
        }\n\
        if (leadingCall) {\n\
          isCalled = true;\n\
          result = func.apply(thisArg, args);\n\
        }\n\
        if (isCalled && !timeoutId && !maxTimeoutId) {\n\
          args = thisArg = null;\n\
        }\n\
        return result;\n\
      };\n\
    }\n\
\n\
    /**\n\
     * Defers executing the `func` function until the current call stack has cleared.\n\
     * Additional arguments will be provided to `func` when it is invoked.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Functions\n\
     * @param {Function} func The function to defer.\n\
     * @param {...*} [args] Arguments to invoke the function with.\n\
     * @returns {number} Returns the timer id.\n\
     * @example\n\
     *\n\
     * _.defer(function(text) { console.log(text); }, 'deferred');\n\
     * // logs 'deferred' after one or more milliseconds\n\
     */\n\
    function defer(func) {\n\
      if (!isFunction(func)) {\n\
        throw new TypeError;\n\
      }\n\
      var args = slice(arguments, 1);\n\
      return setTimeout(function() { func.apply(undefined, args); }, 1);\n\
    }\n\
\n\
    /**\n\
     * Executes the `func` function after `wait` milliseconds. Additional arguments\n\
     * will be provided to `func` when it is invoked.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Functions\n\
     * @param {Function} func The function to delay.\n\
     * @param {number} wait The number of milliseconds to delay execution.\n\
     * @param {...*} [args] Arguments to invoke the function with.\n\
     * @returns {number} Returns the timer id.\n\
     * @example\n\
     *\n\
     * _.delay(function(text) { console.log(text); }, 1000, 'later');\n\
     * // => logs 'later' after one second\n\
     */\n\
    function delay(func, wait) {\n\
      if (!isFunction(func)) {\n\
        throw new TypeError;\n\
      }\n\
      var args = slice(arguments, 2);\n\
      return setTimeout(function() { func.apply(undefined, args); }, wait);\n\
    }\n\
\n\
    /**\n\
     * Creates a function that memoizes the result of `func`. If `resolver` is\n\
     * provided it will be used to determine the cache key for storing the result\n\
     * based on the arguments provided to the memoized function. By default, the\n\
     * first argument provided to the memoized function is used as the cache key.\n\
     * The `func` is executed with the `this` binding of the memoized function.\n\
     * The result cache is exposed as the `cache` property on the memoized function.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Functions\n\
     * @param {Function} func The function to have its output memoized.\n\
     * @param {Function} [resolver] A function used to resolve the cache key.\n\
     * @returns {Function} Returns the new memoizing function.\n\
     * @example\n\
     *\n\
     * var fibonacci = _.memoize(function(n) {\n\
     *   return n < 2 ? n : fibonacci(n - 1) + fibonacci(n - 2);\n\
     * });\n\
     *\n\
     * fibonacci(9)\n\
     * // => 34\n\
     *\n\
     * var data = {\n\
     *   'fred': { 'name': 'fred', 'age': 40 },\n\
     *   'pebbles': { 'name': 'pebbles', 'age': 1 }\n\
     * };\n\
     *\n\
     * // modifying the result cache\n\
     * var get = _.memoize(function(name) { return data[name]; }, _.identity);\n\
     * get('pebbles');\n\
     * // => { 'name': 'pebbles', 'age': 1 }\n\
     *\n\
     * get.cache.pebbles.name = 'penelope';\n\
     * get('pebbles');\n\
     * // => { 'name': 'penelope', 'age': 1 }\n\
     */\n\
    function memoize(func, resolver) {\n\
      if (!isFunction(func)) {\n\
        throw new TypeError;\n\
      }\n\
      var memoized = function() {\n\
        var cache = memoized.cache,\n\
            key = resolver ? resolver.apply(this, arguments) : '_' + arguments[0];\n\
\n\
        return hasOwnProperty.call(cache, key)\n\
          ? cache[key]\n\
          : (cache[key] = func.apply(this, arguments));\n\
      }\n\
      memoized.cache = {};\n\
      return memoized;\n\
    }\n\
\n\
    /**\n\
     * Creates a function that is restricted to execute `func` once. Repeat calls to\n\
     * the function will return the value of the first call. The `func` is executed\n\
     * with the `this` binding of the created function.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Functions\n\
     * @param {Function} func The function to restrict.\n\
     * @returns {Function} Returns the new restricted function.\n\
     * @example\n\
     *\n\
     * var initialize = _.once(createApplication);\n\
     * initialize();\n\
     * initialize();\n\
     * // `initialize` executes `createApplication` once\n\
     */\n\
    function once(func) {\n\
      var ran,\n\
          result;\n\
\n\
      if (!isFunction(func)) {\n\
        throw new TypeError;\n\
      }\n\
      return function() {\n\
        if (ran) {\n\
          return result;\n\
        }\n\
        ran = true;\n\
        result = func.apply(this, arguments);\n\
\n\
        // clear the `func` variable so the function may be garbage collected\n\
        func = null;\n\
        return result;\n\
      };\n\
    }\n\
\n\
    /**\n\
     * Creates a function that, when called, invokes `func` with any additional\n\
     * `partial` arguments prepended to those provided to the new function. This\n\
     * method is similar to `_.bind` except it does **not** alter the `this` binding.\n\
     *\n\
     * Note: This method does not set the `length` property of partially applied\n\
     * functions.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Functions\n\
     * @param {Function} func The function to partially apply arguments to.\n\
     * @param {...*} [args] Arguments to be partially applied.\n\
     * @returns {Function} Returns the new partially applied function.\n\
     * @example\n\
     *\n\
     * var greet = function(greeting, name) { return greeting + ' ' + name; };\n\
     * var hi = _.partial(greet, 'hi');\n\
     * hi('fred');\n\
     * // => 'hi fred'\n\
     */\n\
    function partial(func) {\n\
      if (func) {\n\
        var arity = func[expando] ? func[expando][2] : func.length,\n\
            partialArgs = slice(arguments, 1);\n\
\n\
        arity -= partialArgs.length;\n\
      }\n\
      return createWrapper(func, PARTIAL_FLAG, arity, null, partialArgs);\n\
    }\n\
\n\
    /**\n\
     * This method is like `_.partial` except that partially applied arguments\n\
     * are appended to those provided to the new function.\n\
     *\n\
     * Note: This method does not set the `length` property of partially applied\n\
     * functions.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Functions\n\
     * @param {Function} func The function to partially apply arguments to.\n\
     * @param {...*} [args] Arguments to be partially applied.\n\
     * @returns {Function} Returns the new partially applied function.\n\
     * @example\n\
     *\n\
     * var defaultsDeep = _.partialRight(_.merge, _.defaults);\n\
     *\n\
     * var options = {\n\
     *   'variable': 'data',\n\
     *   'imports': { 'jq': $ }\n\
     * };\n\
     *\n\
     * defaultsDeep(options, _.templateSettings);\n\
     *\n\
     * options.variable\n\
     * // => 'data'\n\
     *\n\
     * options.imports\n\
     * // => { '_': _, 'jq': $ }\n\
     */\n\
    function partialRight(func) {\n\
      if (func) {\n\
        var arity = func[expando] ? func[expando][2] : func.length,\n\
            partialRightArgs = slice(arguments, 1);\n\
\n\
        arity -= partialRightArgs.length;\n\
      }\n\
      return createWrapper(func, PARTIAL_RIGHT_FLAG, arity, null, null, partialRightArgs);\n\
    }\n\
\n\
    /**\n\
     * Creates a function that, when executed, will only call the `func` function\n\
     * at most once per every `wait` milliseconds. Provide an options object to\n\
     * indicate that `func` should be invoked on the leading and/or trailing edge\n\
     * of the `wait` timeout. Subsequent calls to the throttled function will\n\
     * return the result of the last `func` call.\n\
     *\n\
     * Note: If `leading` and `trailing` options are `true` `func` will be called\n\
     * on the trailing edge of the timeout only if the the throttled function is\n\
     * invoked more than once during the `wait` timeout.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Functions\n\
     * @param {Function} func The function to throttle.\n\
     * @param {number} wait The number of milliseconds to throttle executions to.\n\
     * @param {Object} [options] The options object.\n\
     * @param {boolean} [options.leading=true] Specify execution on the leading edge of the timeout.\n\
     * @param {boolean} [options.trailing=true] Specify execution on the trailing edge of the timeout.\n\
     * @returns {Function} Returns the new throttled function.\n\
     * @example\n\
     *\n\
     * // avoid excessively updating the position while scrolling\n\
     * var throttled = _.throttle(updatePosition, 100);\n\
     * jQuery(window).on('scroll', throttled);\n\
     *\n\
     * // execute `renewToken` when the click event is fired, but not more than once every 5 minutes\n\
     * jQuery('.interactive').on('click', _.throttle(renewToken, 300000, {\n\
     *   'trailing': false\n\
     * }));\n\
     */\n\
    function throttle(func, wait, options) {\n\
      var leading = true,\n\
          trailing = true;\n\
\n\
      if (!isFunction(func)) {\n\
        throw new TypeError;\n\
      }\n\
      if (options === false) {\n\
        leading = false;\n\
      } else if (isObject(options)) {\n\
        leading = 'leading' in options ? options.leading : leading;\n\
        trailing = 'trailing' in options ? options.trailing : trailing;\n\
      }\n\
      debounceOptions.leading = leading;\n\
      debounceOptions.maxWait = wait;\n\
      debounceOptions.trailing = trailing;\n\
\n\
      return debounce(func, wait, debounceOptions);\n\
    }\n\
\n\
    /**\n\
     * Creates a function that provides `value` to the wrapper function as its\n\
     * first argument. Additional arguments provided to the function are appended\n\
     * to those provided to the wrapper function. The wrapper is executed with\n\
     * the `this` binding of the created function.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Functions\n\
     * @param {*} value The value to wrap.\n\
     * @param {Function} wrapper The wrapper function.\n\
     * @returns {Function} Returns the new function.\n\
     * @example\n\
     *\n\
     * var p = _.wrap(_.escape, function(func, text) {\n\
     *   return '<p>' + func(text) + '</p>';\n\
     * });\n\
     *\n\
     * p('fred, barney, & pebbles');\n\
     * // => '<p>fred, barney, &amp; pebbles</p>'\n\
     */\n\
    function wrap(value, wrapper) {\n\
      return createWrapper(wrapper, PARTIAL_FLAG, null, null, [value]);\n\
    }\n\
\n\
    /*--------------------------------------------------------------------------*/\n\
\n\
    /**\n\
     * Assigns own enumerable properties of source object(s) to the destination\n\
     * object. Subsequent sources will overwrite property assignments of previous\n\
     * sources. If a callback is provided it will be executed to produce the\n\
     * assigned values. The callback is bound to `thisArg` and invoked with two\n\
     * arguments; (objectValue, sourceValue).\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @alias extend\n\
     * @category Objects\n\
     * @param {Object} object The destination object.\n\
     * @param {...Object} [source] The source objects.\n\
     * @param {Function} [callback] The function to customize assigning values.\n\
     * @param {*} [thisArg] The `this` binding of `callback`.\n\
     * @returns {Object} Returns the destination object.\n\
     * @example\n\
     *\n\
     * _.assign({ 'name': 'fred' }, { 'employer': 'slate' });\n\
     * // => { 'name': 'fred', 'employer': 'slate' }\n\
     *\n\
     * var defaults = _.partialRight(_.assign, function(a, b) {\n\
     *   return typeof a == 'undefined' ? b : a;\n\
     * });\n\
     *\n\
     * defaults({ 'name': 'barney' }, { 'name': 'fred', 'employer': 'slate' });\n\
     * // => { 'name': 'barney', 'employer': 'slate' }\n\
     */\n\
    function assign(object, source, guard) {\n\
      var args = arguments,\n\
          argsIndex = 0,\n\
          argsLength = args.length,\n\
          type = typeof guard;\n\
\n\
      // enables use as a callback for functions like `_.reduce`\n\
      if ((type == 'number' || type == 'string') && args[3] && args[3][guard] === source) {\n\
        argsLength = 2;\n\
      }\n\
      // juggle arguments\n\
      if (argsLength > 3 && typeof args[argsLength - 2] == 'function') {\n\
        var callback = baseCreateCallback(args[--argsLength - 1], args[argsLength--], 2);\n\
      } else if (argsLength > 2 && typeof args[argsLength - 1] == 'function') {\n\
        callback = args[--argsLength];\n\
      }\n\
      while (++argsIndex < argsLength) {\n\
        source = args[argsIndex];\n\
        if (isObject(source)) {\n\
          var index = -1,\n\
              props = keys(source),\n\
              length = props.length;\n\
\n\
          while (++index < length) {\n\
            var key = props[index];\n\
            object[key] = callback ? callback(object[key], source[key]) : source[key];\n\
          }\n\
        }\n\
      }\n\
      return object;\n\
    }\n\
\n\
    /**\n\
     * Creates a clone of `value`. If `isDeep` is `true` nested objects will also\n\
     * be cloned, otherwise they will be assigned by reference. If a callback\n\
     * is provided it will be executed to produce the cloned values. If the\n\
     * callback returns `undefined` cloning will be handled by the method instead.\n\
     * The callback is bound to `thisArg` and invoked with one argument; (value).\n\
     *\n\
     * Note: This method is loosely based on the structured clone algorithm. Functions\n\
     * and DOM nodes are **not** cloned. The enumerable properties of `arguments` objects and\n\
     * objects created by constructors other than `Object` are cloned to plain `Object` objects.\n\
     * See the [HTML5 specification](http://www.w3.org/TR/html5/infrastructure.html#internal-structured-cloning-algorithm)\n\
     * for more details.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Objects\n\
     * @param {*} value The value to clone.\n\
     * @param {boolean} [isDeep=false] Specify a deep clone.\n\
     * @param {Function} [callback] The function to customize cloning values.\n\
     * @param {*} [thisArg] The `this` binding of `callback`.\n\
     * @returns {*} Returns the cloned value.\n\
     * @example\n\
     *\n\
     * var characters = [\n\
     *   { 'name': 'barney', 'age': 36 },\n\
     *   { 'name': 'fred',   'age': 40 }\n\
     * ];\n\
     *\n\
     * var shallow = _.clone(characters);\n\
     * shallow[0] === characters[0];\n\
     * // => true\n\
     *\n\
     * var deep = _.clone(characters, true);\n\
     * deep[0] === characters[0];\n\
     * // => false\n\
     *\n\
     * _.mixin({\n\
     *   'clone': _.partialRight(_.clone, function(value) {\n\
     *     return _.isElement(value) ? value.cloneNode(false) : undefined;\n\
     *   })\n\
     * });\n\
     *\n\
     * var clone = _.clone(document.body);\n\
     * clone.childNodes.length;\n\
     * // => 0\n\
     */\n\
    function clone(value, isDeep, callback, thisArg) {\n\
      var type = typeof isDeep;\n\
\n\
      // juggle arguments\n\
      if (type != 'boolean' && isDeep != null) {\n\
        thisArg = callback;\n\
        callback = isDeep;\n\
        isDeep = false;\n\
\n\
        // enables use as a callback for functions like `_.map`\n\
        if ((type == 'number' || type == 'string') && thisArg && thisArg[callback] === value) {\n\
          callback = null;\n\
        }\n\
      }\n\
      return baseClone(value, isDeep, typeof callback == 'function' && baseCreateCallback(callback, thisArg, 1));\n\
    }\n\
\n\
    /**\n\
     * Creates a deep clone of `value`. If a callback is provided it will be\n\
     * executed to produce the cloned values. If the callback returns `undefined`\n\
     * cloning will be handled by the method instead. The callback is bound to\n\
     * `thisArg` and invoked with one argument; (value).\n\
     *\n\
     * Note: This method is loosely based on the structured clone algorithm. Functions\n\
     * and DOM nodes are **not** cloned. The enumerable properties of `arguments` objects and\n\
     * objects created by constructors other than `Object` are cloned to plain `Object` objects.\n\
     * See the [HTML5 specification](http://www.w3.org/TR/html5/infrastructure.html#internal-structured-cloning-algorithm)\n\
     * for more details.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Objects\n\
     * @param {*} value The value to deep clone.\n\
     * @param {Function} [callback] The function to customize cloning values.\n\
     * @param {*} [thisArg] The `this` binding of `callback`.\n\
     * @returns {*} Returns the deep cloned value.\n\
     * @example\n\
     *\n\
     * var characters = [\n\
     *   { 'name': 'barney', 'age': 36 },\n\
     *   { 'name': 'fred',   'age': 40 }\n\
     * ];\n\
     *\n\
     * var deep = _.cloneDeep(characters);\n\
     * deep[0] === characters[0];\n\
     * // => false\n\
     *\n\
     * var view = {\n\
     *   'label': 'docs',\n\
     *   'node': element\n\
     * };\n\
     *\n\
     * var clone = _.cloneDeep(view, function(value) {\n\
     *   return _.isElement(value) ? value.cloneNode(true) : undefined;\n\
     * });\n\
     *\n\
     * clone.node == view.node;\n\
     * // => false\n\
     */\n\
    function cloneDeep(value, callback, thisArg) {\n\
      return baseClone(value, true, typeof callback == 'function' && baseCreateCallback(callback, thisArg, 1));\n\
    }\n\
\n\
    /**\n\
     * Creates an object that inherits from the given `prototype` object. If a\n\
     * `properties` object is provided its own enumerable properties are assigned\n\
     * to the created object.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Objects\n\
     * @param {Object} prototype The object to inherit from.\n\
     * @param {Object} [properties] The properties to assign to the object.\n\
     * @returns {Object} Returns the new object.\n\
     * @example\n\
     *\n\
     * function Shape() {\n\
     *   this.x = 0;\n\
     *   this.y = 0;\n\
     * }\n\
     *\n\
     * function Circle() {\n\
     *   Shape.call(this);\n\
     * }\n\
     *\n\
     * Circle.prototype = _.create(Shape.prototype, { 'constructor': Circle });\n\
     *\n\
     * var circle = new Circle;\n\
     * circle instanceof Circle;\n\
     * // => true\n\
     *\n\
     * circle instanceof Shape;\n\
     * // => true\n\
     */\n\
    function create(prototype, properties) {\n\
      var result = baseCreate(prototype);\n\
      return properties ? assign(result, properties) : result;\n\
    }\n\
\n\
    /**\n\
     * Assigns own enumerable properties of source object(s) to the destination\n\
     * object for all destination properties that resolve to `undefined`. Once a\n\
     * property is set, additional defaults of the same property will be ignored.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Objects\n\
     * @param {Object} object The destination object.\n\
     * @param {...Object} [source] The source objects.\n\
     * @param- {Object} [guard] Enables use as a callback for functions like `_.reduce`.\n\
     * @returns {Object} Returns the destination object.\n\
     * @example\n\
     *\n\
     * _.defaults({ 'name': 'barney' }, { 'name': 'fred', 'employer': 'slate' });\n\
     * // => { 'name': 'barney', 'employer': 'slate' }\n\
     */\n\
    function defaults(object, source, guard) {\n\
      var args = arguments,\n\
          argsIndex = 0,\n\
          argsLength = args.length,\n\
          type = typeof guard;\n\
\n\
      // enables use as a callback for functions like `_.reduce`\n\
      if ((type == 'number' || type == 'string') && args[3] && args[3][guard] === source) {\n\
        argsLength = 2;\n\
      }\n\
      while (++argsIndex < argsLength) {\n\
        source = args[argsIndex];\n\
        if (isObject(source)) {\n\
          var index = -1,\n\
              props = keys(source),\n\
              length = props.length;\n\
\n\
          while (++index < length) {\n\
            var key = props[index];\n\
            if (typeof object[key] == 'undefined') {\n\
              object[key] = source[key];\n\
            }\n\
          }\n\
        }\n\
      }\n\
      return object;\n\
    }\n\
\n\
    /**\n\
     * This method is like `_.findIndex` except that it returns the key of the\n\
     * first element that passes the callback check, instead of the element itself.\n\
     *\n\
     * If a property name is provided for `callback` the created \"_.pluck\" style\n\
     * callback will return the property value of the given element.\n\
     *\n\
     * If an object is provided for `callback` the created \"_.where\" style callback\n\
     * will return `true` for elements that have the properties of the given object,\n\
     * else `false`.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Objects\n\
     * @param {Object} object The object to search.\n\
     * @param {Function|Object|string} [callback=identity] The function called per\n\
     *  iteration. If a property name or object is provided it will be used to\n\
     *  create a \"_.pluck\" or \"_.where\" style callback, respectively.\n\
     * @param {*} [thisArg] The `this` binding of `callback`.\n\
     * @returns {string|undefined} Returns the key of the found element, else `undefined`.\n\
     * @example\n\
     *\n\
     * var characters = {\n\
     *   'barney': { 'age': 36 },\n\
     *   'fred': { 'age': 40, 'blocked': true },\n\
     *   'pebbles': { 'age': 1 }\n\
     * };\n\
     *\n\
     * _.findKey(characters, function(chr) {\n\
     *   return chr.age < 40;\n\
     * });\n\
     * // => 'barney' (property order is not guaranteed across environments)\n\
     *\n\
     * // using \"_.where\" callback shorthand\n\
     * _.findKey(characters, { 'age': 1 });\n\
     * // => 'pebbles'\n\
     *\n\
     * // using \"_.pluck\" callback shorthand\n\
     * _.findKey(characters, 'blocked');\n\
     * // => 'fred'\n\
     */\n\
    function findKey(object, callback, thisArg) {\n\
      var result;\n\
\n\
      callback = lodash.createCallback(callback, thisArg, 3);\n\
      baseForOwn(object, function(value, key, object) {\n\
        if (callback(value, key, object)) {\n\
          result = key;\n\
          return false;\n\
        }\n\
      });\n\
      return result;\n\
    }\n\
\n\
    /**\n\
     * This method is like `_.findKey` except that it iterates over elements\n\
     * of a `collection` in the opposite order.\n\
     *\n\
     * If a property name is provided for `callback` the created \"_.pluck\" style\n\
     * callback will return the property value of the given element.\n\
     *\n\
     * If an object is provided for `callback` the created \"_.where\" style callback\n\
     * will return `true` for elements that have the properties of the given object,\n\
     * else `false`.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Objects\n\
     * @param {Object} object The object to search.\n\
     * @param {Function|Object|string} [callback=identity] The function called per\n\
     *  iteration. If a property name or object is provided it will be used to\n\
     *  create a \"_.pluck\" or \"_.where\" style callback, respectively.\n\
     * @param {*} [thisArg] The `this` binding of `callback`.\n\
     * @returns {string|undefined} Returns the key of the found element, else `undefined`.\n\
     * @example\n\
     *\n\
     * var characters = {\n\
     *   'barney': { 'age': 36, 'blocked': true },\n\
     *   'fred': { 'age': 40 },\n\
     *   'pebbles': { 'age': 1, 'blocked': true }\n\
     * };\n\
     *\n\
     * _.findLastKey(characters, function(chr) {\n\
     *   return chr.age < 40;\n\
     * });\n\
     * // => returns `pebbles`, assuming `_.findKey` returns `barney`\n\
     *\n\
     * // using \"_.where\" callback shorthand\n\
     * _.findLastKey(characters, { 'age': 40 });\n\
     * // => 'fred'\n\
     *\n\
     * // using \"_.pluck\" callback shorthand\n\
     * _.findLastKey(characters, 'blocked');\n\
     * // => 'pebbles'\n\
     */\n\
    function findLastKey(object, callback, thisArg) {\n\
      var result;\n\
\n\
      callback = lodash.createCallback(callback, thisArg, 3);\n\
      baseForOwnRight(object, function(value, key, object) {\n\
        if (callback(value, key, object)) {\n\
          result = key;\n\
          return false;\n\
        }\n\
      });\n\
      return result;\n\
    }\n\
\n\
    /**\n\
     * Iterates over own and inherited enumerable properties of an object,\n\
     * executing the callback for each property. The callback is bound to `thisArg`\n\
     * and invoked with three arguments; (value, key, object). Callbacks may exit\n\
     * iteration early by explicitly returning `false`.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @type Function\n\
     * @category Objects\n\
     * @param {Object} object The object to iterate over.\n\
     * @param {Function} [callback=identity] The function called per iteration.\n\
     * @param {*} [thisArg] The `this` binding of `callback`.\n\
     * @returns {Object} Returns `object`.\n\
     * @example\n\
     *\n\
     * function Shape() {\n\
     *   this.x = 0;\n\
     *   this.y = 0;\n\
     * }\n\
     *\n\
     * Shape.prototype.move = function(x, y) {\n\
     *   this.x += x;\n\
     *   this.y += y;\n\
     * };\n\
     *\n\
     * _.forIn(new Shape, function(value, key) {\n\
     *   console.log(key);\n\
     * });\n\
     * // => logs 'x', 'y', and 'move' (property order is not guaranteed across environments)\n\
     */\n\
    function forIn(object, callback, thisArg) {\n\
      callback = callback && typeof thisArg == 'undefined' ? callback : baseCreateCallback(callback, thisArg, 3);\n\
      return baseForIn(object, callback);\n\
    }\n\
\n\
    /**\n\
     * This method is like `_.forIn` except that it iterates over elements\n\
     * of a `collection` in the opposite order.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Objects\n\
     * @param {Object} object The object to iterate over.\n\
     * @param {Function} [callback=identity] The function called per iteration.\n\
     * @param {*} [thisArg] The `this` binding of `callback`.\n\
     * @returns {Object} Returns `object`.\n\
     * @example\n\
     *\n\
     * function Shape() {\n\
     *   this.x = 0;\n\
     *   this.y = 0;\n\
     * }\n\
     *\n\
     * Shape.prototype.move = function(x, y) {\n\
     *   this.x += x;\n\
     *   this.y += y;\n\
     * };\n\
     *\n\
     * _.forInRight(new Shape, function(value, key) {\n\
     *   console.log(key);\n\
     * });\n\
     * // => logs 'move', 'y', and 'x' assuming `_.forIn ` logs 'x', 'y', and 'move'\n\
     */\n\
    function forInRight(object, callback, thisArg) {\n\
      var pairs = [];\n\
      baseForIn(object, function(value, key) {\n\
        pairs.push(key, value);\n\
      });\n\
\n\
      var length = pairs.length;\n\
      callback = baseCreateCallback(callback, thisArg, 3);\n\
      while (length--) {\n\
        if (callback(pairs[length--], pairs[length], object) === false) {\n\
          break;\n\
        }\n\
      }\n\
      return object;\n\
    }\n\
\n\
    /**\n\
     * Iterates over own enumerable properties of an object, executing the callback\n\
     * for each property. The callback is bound to `thisArg` and invoked with three\n\
     * arguments; (value, key, object). Callbacks may exit iteration early by\n\
     * explicitly returning `false`.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Objects\n\
     * @param {Object} object The object to iterate over.\n\
     * @param {Function} [callback=identity] The function called per iteration.\n\
     * @param {*} [thisArg] The `this` binding of `callback`.\n\
     * @returns {Object} Returns `object`.\n\
     * @example\n\
     *\n\
     * _.forOwn({ '0': 'zero', '1': 'one', 'length': 2 }, function(num, key) {\n\
     *   console.log(key);\n\
     * });\n\
     * // => logs '0', '1', and 'length' (property order is not guaranteed across environments)\n\
     */\n\
    function forOwn(object, callback, thisArg) {\n\
      callback = callback && typeof thisArg == 'undefined' ? callback : baseCreateCallback(callback, thisArg, 3);\n\
      return baseForOwn(object, callback);\n\
    }\n\
\n\
    /**\n\
     * This method is like `_.forOwn` except that it iterates over elements\n\
     * of a `collection` in the opposite order.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Objects\n\
     * @param {Object} object The object to iterate over.\n\
     * @param {Function} [callback=identity] The function called per iteration.\n\
     * @param {*} [thisArg] The `this` binding of `callback`.\n\
     * @returns {Object} Returns `object`.\n\
     * @example\n\
     *\n\
     * _.forOwnRight({ '0': 'zero', '1': 'one', 'length': 2 }, function(num, key) {\n\
     *   console.log(key);\n\
     * });\n\
     * // => logs 'length', '1', and '0' assuming `_.forOwn` logs '0', '1', and 'length'\n\
     */\n\
    function forOwnRight(object, callback, thisArg) {\n\
      var props = keys(object),\n\
          length = props.length;\n\
\n\
      callback = baseCreateCallback(callback, thisArg, 3);\n\
      while (length--) {\n\
        var key = props[length];\n\
        if (callback(object[key], key, object) === false) {\n\
          break;\n\
        }\n\
      }\n\
      return object;\n\
    }\n\
\n\
    /**\n\
     * Creates a sorted array of property names of all enumerable properties,\n\
     * own and inherited, of `object` that have function values.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @alias methods\n\
     * @category Objects\n\
     * @param {Object} object The object to inspect.\n\
     * @returns {Array} Returns an array of property names that have function values.\n\
     * @example\n\
     *\n\
     * _.functions(_);\n\
     * // => ['all', 'any', 'bind', 'bindAll', 'clone', 'compact', 'compose', ...]\n\
     */\n\
    function functions(object) {\n\
      var result = [];\n\
      baseForIn(object, function(value, key) {\n\
        if (isFunction(value)) {\n\
          result.push(key);\n\
        }\n\
      });\n\
      return result.sort();\n\
    }\n\
\n\
    /**\n\
     * Checks if the specified property name exists as a direct property of `object`,\n\
     * instead of an inherited property.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Objects\n\
     * @param {Object} object The object to inspect.\n\
     * @param {string} key The name of the property to check.\n\
     * @returns {boolean} Returns `true` if key is a direct property, else `false`.\n\
     * @example\n\
     *\n\
     * _.has({ 'a': 1, 'b': 2, 'c': 3 }, 'b');\n\
     * // => true\n\
     */\n\
    function has(object, key) {\n\
      return object ? hasOwnProperty.call(object, key) : false;\n\
    }\n\
\n\
    /**\n\
     * Creates an object composed of the inverted keys and values of the given\n\
     * object. If the given object contains duplicate values, subsequent values\n\
     * will overwrite property assignments of previous values unless `multiValue`\n\
     * is `true`.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Objects\n\
     * @param {Object} object The object to invert.\n\
     * @param {boolean} [multiValue=false] Allow multiple values per key.\n\
     * @returns {Object} Returns the created inverted object.\n\
     * @example\n\
     *\n\
     * _.invert({ 'first': 'fred', 'second': 'barney' });\n\
     * // => { 'fred': 'first', 'barney': 'second' }\n\
     *\n\
     * // without `multiValue`\n\
     * _.invert({ 'first': 'fred', 'second': 'barney', 'third': 'fred' });\n\
     * // => { 'fred': 'third', 'barney': 'second' }\n\
     *\n\
     * // with `multiValue`\n\
     * _.invert({ 'first': 'fred', 'second': 'barney', 'third': 'fred' }, true);\n\
     * // => { 'fred': ['first', 'third'], 'barney': ['second'] }\n\
     */\n\
    function invert(object, multiValue) {\n\
      var index = -1,\n\
          props = keys(object),\n\
          length = props.length,\n\
          result = {};\n\
\n\
      while (++index < length) {\n\
        var key = props[index],\n\
            value = object[key];\n\
\n\
        if (multiValue) {\n\
          if (hasOwnProperty.call(result, value)) {\n\
            result[value].push(key);\n\
          } else {\n\
            result[value] = [key];\n\
          }\n\
        }\n\
        else {\n\
          result[value] = key;\n\
        }\n\
      }\n\
      return result;\n\
    }\n\
\n\
    /**\n\
     * Checks if `value` is an array.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @type Function\n\
     * @category Objects\n\
     * @param {*} value The value to check.\n\
     * @returns {boolean} Returns `true` if the `value` is an array, else `false`.\n\
     * @example\n\
     *\n\
     * (function() { return _.isArray(arguments); })();\n\
     * // => false\n\
     *\n\
     * _.isArray([1, 2, 3]);\n\
     * // => true\n\
     */\n\
    var isArray = nativeIsArray || function(value) {\n\
      return value && typeof value == 'object' && typeof value.length == 'number' &&\n\
        toString.call(value) == arrayClass || false;\n\
    };\n\
\n\
    /**\n\
     * Checks if `value` is a boolean value.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Objects\n\
     * @param {*} value The value to check.\n\
     * @returns {boolean} Returns `true` if the `value` is a boolean value, else `false`.\n\
     * @example\n\
     *\n\
     * _.isBoolean(null);\n\
     * // => false\n\
     */\n\
    function isBoolean(value) {\n\
      return value === true || value === false ||\n\
        value && typeof value == 'object' && toString.call(value) == boolClass || false;\n\
    }\n\
\n\
    /**\n\
     * Checks if `value` is a date.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Objects\n\
     * @param {*} value The value to check.\n\
     * @returns {boolean} Returns `true` if the `value` is a date, else `false`.\n\
     * @example\n\
     *\n\
     * _.isDate(new Date);\n\
     * // => true\n\
     */\n\
    function isDate(value) {\n\
      return value && typeof value == 'object' && toString.call(value) == dateClass || false;\n\
    }\n\
\n\
    /**\n\
     * Checks if `value` is a DOM element.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Objects\n\
     * @param {*} value The value to check.\n\
     * @returns {boolean} Returns `true` if the `value` is a DOM element, else `false`.\n\
     * @example\n\
     *\n\
     * _.isElement(document.body);\n\
     * // => true\n\
     */\n\
    function isElement(value) {\n\
      return value && typeof value == 'object' && value.nodeType === 1 &&\n\
        (support.nodeClass ? toString.call(value).indexOf('Element') > -1 : isNode(value)) || false;\n\
    }\n\
    // fallback for environments without DOM support\n\
    if (!support.dom) {\n\
      isElement = function(value) {\n\
        return value && typeof value == 'object' && value.nodeType === 1 &&\n\
          !isPlainObject(value) || false;\n\
      };\n\
    }\n\
\n\
    /**\n\
     * Checks if `value` is empty. Arrays, strings, or `arguments` objects with a\n\
     * length of `0` and objects with no own enumerable properties are considered\n\
     * \"empty\".\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Objects\n\
     * @param {Array|Object|string} value The value to inspect.\n\
     * @returns {boolean} Returns `true` if the `value` is empty, else `false`.\n\
     * @example\n\
     *\n\
     * _.isEmpty([1, 2, 3]);\n\
     * // => false\n\
     *\n\
     * _.isEmpty({});\n\
     * // => true\n\
     *\n\
     * _.isEmpty('');\n\
     * // => true\n\
     */\n\
    function isEmpty(value) {\n\
      var result = true;\n\
      if (!value) {\n\
        return result;\n\
      }\n\
      var className = toString.call(value),\n\
          length = value.length;\n\
\n\
      if ((className == arrayClass || className == stringClass ||\n\
          (support.argsClass ? className == argsClass : isArguments(value))) ||\n\
          (className == objectClass && typeof length == 'number' && isFunction(value.splice))) {\n\
        return !length;\n\
      }\n\
      baseForOwn(value, function() {\n\
        return (result = false);\n\
      });\n\
      return result;\n\
    }\n\
\n\
    /**\n\
     * Performs a deep comparison between two values to determine if they are\n\
     * equivalent to each other. If a callback is provided it will be executed\n\
     * to compare values. If the callback returns `undefined` comparisons will\n\
     * be handled by the method instead. The callback is bound to `thisArg` and\n\
     * invoked with two arguments; (a, b).\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Objects\n\
     * @param {*} a The value to compare.\n\
     * @param {*} b The other value to compare.\n\
     * @param {Function} [callback] The function to customize comparing values.\n\
     * @param {*} [thisArg] The `this` binding of `callback`.\n\
     * @returns {boolean} Returns `true` if the values are equivalent, else `false`.\n\
     * @example\n\
     *\n\
     * var object = { 'name': 'fred' };\n\
     * var copy = { 'name': 'fred' };\n\
     *\n\
     * object == copy;\n\
     * // => false\n\
     *\n\
     * _.isEqual(object, copy);\n\
     * // => true\n\
     *\n\
     * var words = ['hello', 'goodbye'];\n\
     * var otherWords = ['hi', 'goodbye'];\n\
     *\n\
     * _.isEqual(words, otherWords, function(a, b) {\n\
     *   var reGreet = /^(?:hello|hi)$/i,\n\
     *       aGreet = _.isString(a) && reGreet.test(a),\n\
     *       bGreet = _.isString(b) && reGreet.test(b);\n\
     *\n\
     *   return (aGreet || bGreet) ? (aGreet == bGreet) : undefined;\n\
     * });\n\
     * // => true\n\
     */\n\
    function isEqual(a, b, callback, thisArg) {\n\
      return baseIsEqual(a, b, typeof callback == 'function' && baseCreateCallback(callback, thisArg, 2));\n\
    }\n\
\n\
    /**\n\
     * Checks if `value` is, or can be coerced to, a finite number.\n\
     *\n\
     * Note: This method is not the same as native `isFinite` which will return\n\
     * `true` for booleans and empty strings. See the [ES5 spec](http://es5.github.io/#x15.1.2.5)\n\
     * for more details.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Objects\n\
     * @param {*} value The value to check.\n\
     * @returns {boolean} Returns `true` if the `value` is finite, else `false`.\n\
     * @example\n\
     *\n\
     * _.isFinite(-101);\n\
     * // => true\n\
     *\n\
     * _.isFinite('10');\n\
     * // => true\n\
     *\n\
     * _.isFinite(true);\n\
     * // => false\n\
     *\n\
     * _.isFinite('');\n\
     * // => false\n\
     *\n\
     * _.isFinite(Infinity);\n\
     * // => false\n\
     */\n\
    function isFinite(value) {\n\
      return nativeIsFinite(value) && !nativeIsNaN(parseFloat(value));\n\
    }\n\
\n\
    /**\n\
     * Checks if `value` is a function.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Objects\n\
     * @param {*} value The value to check.\n\
     * @returns {boolean} Returns `true` if the `value` is a function, else `false`.\n\
     * @example\n\
     *\n\
     * _.isFunction(_);\n\
     * // => true\n\
     */\n\
    function isFunction(value) {\n\
      return typeof value == 'function';\n\
    }\n\
    // fallback for older versions of Chrome and Safari\n\
    if (isFunction(/x/)) {\n\
      isFunction = function(value) {\n\
        return typeof value == 'function' && toString.call(value) == funcClass;\n\
      };\n\
    }\n\
\n\
    /**\n\
     * Checks if `value` is the language type of Object.\n\
     * (e.g. arrays, functions, objects, regexes, `new Number(0)`, and `new String('')`)\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Objects\n\
     * @param {*} value The value to check.\n\
     * @returns {boolean} Returns `true` if the `value` is an object, else `false`.\n\
     * @example\n\
     *\n\
     * _.isObject({});\n\
     * // => true\n\
     *\n\
     * _.isObject([1, 2, 3]);\n\
     * // => true\n\
     *\n\
     * _.isObject(1);\n\
     * // => false\n\
     */\n\
    function isObject(value) {\n\
      // check if the value is the ECMAScript language type of Object\n\
      // http://es5.github.io/#x8\n\
      // and avoid a V8 bug\n\
      // https://code.google.com/p/v8/issues/detail?id=2291\n\
      var type = typeof value;\n\
      return value && (type == 'function' || type == 'object') || false;\n\
    }\n\
\n\
    /**\n\
     * Checks if `value` is `NaN`.\n\
     *\n\
     * Note: This method is not the same as native `isNaN` which will return `true`\n\
     * for `undefined` and other non-numeric values. See the [ES5 spec](http://es5.github.io/#x15.1.2.4)\n\
     * for more details.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Objects\n\
     * @param {*} value The value to check.\n\
     * @returns {boolean} Returns `true` if the `value` is `NaN`, else `false`.\n\
     * @example\n\
     *\n\
     * _.isNaN(NaN);\n\
     * // => true\n\
     *\n\
     * _.isNaN(new Number(NaN));\n\
     * // => true\n\
     *\n\
     * isNaN(undefined);\n\
     * // => true\n\
     *\n\
     * _.isNaN(undefined);\n\
     * // => false\n\
     */\n\
    function isNaN(value) {\n\
      // `NaN` as a primitive is the only value that is not equal to itself\n\
      // (perform the [[Class]] check first to avoid errors with some host objects in IE)\n\
      return isNumber(value) && value != +value;\n\
    }\n\
\n\
    /**\n\
     * Checks if `value` is `null`.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Objects\n\
     * @param {*} value The value to check.\n\
     * @returns {boolean} Returns `true` if the `value` is `null`, else `false`.\n\
     * @example\n\
     *\n\
     * _.isNull(null);\n\
     * // => true\n\
     *\n\
     * _.isNull(undefined);\n\
     * // => false\n\
     */\n\
    function isNull(value) {\n\
      return value === null;\n\
    }\n\
\n\
    /**\n\
     * Checks if `value` is a number.\n\
     *\n\
     * Note: `NaN` is considered a number. See the [ES5 spec](http://es5.github.io/#x8.5)\n\
     * for more details.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Objects\n\
     * @param {*} value The value to check.\n\
     * @returns {boolean} Returns `true` if the `value` is a number, else `false`.\n\
     * @example\n\
     *\n\
     * _.isNumber(8.4 * 5);\n\
     * // => true\n\
     */\n\
    function isNumber(value) {\n\
      var type = typeof value;\n\
      return type == 'number' ||\n\
        value && type == 'object' && toString.call(value) == numberClass || false;\n\
    }\n\
\n\
    /**\n\
     * Checks if `value` is an object created by the `Object` constructor.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Objects\n\
     * @param {*} value The value to check.\n\
     * @returns {boolean} Returns `true` if `value` is a plain object, else `false`.\n\
     * @example\n\
     *\n\
     * function Shape() {\n\
     *   this.x = 0;\n\
     *   this.y = 0;\n\
     * }\n\
     *\n\
     * _.isPlainObject(new Shape);\n\
     * // => false\n\
     *\n\
     * _.isPlainObject([1, 2, 3]);\n\
     * // => false\n\
     *\n\
     * _.isPlainObject({ 'x': 0, 'y': 0 });\n\
     * // => true\n\
     */\n\
    var isPlainObject = !getPrototypeOf ? shimIsPlainObject : function(value) {\n\
      if (!(value && toString.call(value) == objectClass) || (!support.argsClass && isArguments(value))) {\n\
        return false;\n\
      }\n\
      var valueOf = value.valueOf,\n\
          objProto = isNative(valueOf) && (objProto = getPrototypeOf(valueOf)) && getPrototypeOf(objProto);\n\
\n\
      return objProto\n\
        ? (value == objProto || getPrototypeOf(value) == objProto)\n\
        : shimIsPlainObject(value);\n\
    };\n\
\n\
    /**\n\
     * Checks if `value` is a regular expression.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Objects\n\
     * @param {*} value The value to check.\n\
     * @returns {boolean} Returns `true` if the `value` is a regular expression, else `false`.\n\
     * @example\n\
     *\n\
     * _.isRegExp(/fred/);\n\
     * // => true\n\
     */\n\
    function isRegExp(value) {\n\
      var type = typeof value;\n\
      return value && (type == 'function' || type == 'object') &&\n\
        toString.call(value) == regexpClass || false;\n\
    }\n\
\n\
    /**\n\
     * Checks if `value` is a string.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Objects\n\
     * @param {*} value The value to check.\n\
     * @returns {boolean} Returns `true` if the `value` is a string, else `false`.\n\
     * @example\n\
     *\n\
     * _.isString('fred');\n\
     * // => true\n\
     */\n\
    function isString(value) {\n\
      return typeof value == 'string' ||\n\
        value && typeof value == 'object' && toString.call(value) == stringClass || false;\n\
    }\n\
\n\
    /**\n\
     * Checks if `value` is `undefined`.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Objects\n\
     * @param {*} value The value to check.\n\
     * @returns {boolean} Returns `true` if the `value` is `undefined`, else `false`.\n\
     * @example\n\
     *\n\
     * _.isUndefined(void 0);\n\
     * // => true\n\
     */\n\
    function isUndefined(value) {\n\
      return typeof value == 'undefined';\n\
    }\n\
\n\
    /**\n\
     * Creates an array composed of the own enumerable property names of an object.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Objects\n\
     * @param {Object} object The object to inspect.\n\
     * @returns {Array} Returns an array of property names.\n\
     * @example\n\
     *\n\
     * _.keys({ 'one': 1, 'two': 2, 'three': 3 });\n\
     * // => ['one', 'two', 'three'] (property order is not guaranteed across environments)\n\
     */\n\
    var keys = !nativeKeys ? shimKeys : function(object) {\n\
      if (!isObject(object)) {\n\
        return [];\n\
      }\n\
      if ((support.enumPrototypes && typeof object == 'function') ||\n\
          (support.nonEnumArgs && object.length && isArguments(object))) {\n\
        return shimKeys(object);\n\
      }\n\
      return nativeKeys(object);\n\
    };\n\
\n\
    /**\n\
     * Creates an object with the same keys as `object` and values generated by\n\
     * running each own enumerable property of `object` through the callback.\n\
     * The callback is bound to `thisArg` and invoked with three arguments;\n\
     * (value, key, object).\n\
     *\n\
     * If a property name is provided for `callback` the created \"_.pluck\" style\n\
     * callback will return the property value of the given element.\n\
     *\n\
     * If an object is provided for `callback` the created \"_.where\" style callback\n\
     * will return `true` for elements that have the properties of the given object,\n\
     * else `false`.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Objects\n\
     * @param {Object} object The object to iterate over.\n\
     * @param {Function|Object|string} [callback=identity] The function called\n\
     *  per iteration. If a property name or object is provided it will be used\n\
     *  to create a \"_.pluck\" or \"_.where\" style callback, respectively.\n\
     * @param {*} [thisArg] The `this` binding of `callback`.\n\
     * @returns {Object} Returns a new object with values of the results of each `callback` execution.\n\
     * @example\n\
     *\n\
     * _.mapValues({ 'a': 1, 'b': 2, 'c': 3} , function(num) { return num * 3; });\n\
     * // => { 'a': 3, 'b': 6, 'c': 9 }\n\
     *\n\
     * var characters = {\n\
     *   'fred': { 'name': 'fred', 'age': 40 },\n\
     *   'pebbles': { 'name': 'pebbles', 'age': 1 }\n\
     * };\n\
     *\n\
     * // using \"_.pluck\" callback shorthand\n\
     * _.mapValues(characters, 'age');\n\
     * // => { 'fred': 40, 'pebbles': 1 }\n\
     */\n\
    function mapValues(object, callback, thisArg) {\n\
      var result = {};\n\
\n\
      callback = lodash.createCallback(callback, thisArg, 3);\n\
      baseForOwn(object, function(value, key, object) {\n\
        result[key] = callback(value, key, object);\n\
      });\n\
      return result;\n\
    }\n\
\n\
    /**\n\
     * Recursively merges own enumerable properties of the source object(s), that\n\
     * don't resolve to `undefined` into the destination object. Subsequent sources\n\
     * will overwrite property assignments of previous sources. If a callback is\n\
     * provided it will be executed to produce the merged values of the destination\n\
     * and source properties. If the callback returns `undefined` merging will\n\
     * be handled by the method instead. The callback is bound to `thisArg` and\n\
     * invoked with two arguments; (objectValue, sourceValue).\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Objects\n\
     * @param {Object} object The destination object.\n\
     * @param {...Object} [source] The source objects.\n\
     * @param {Function} [callback] The function to customize merging properties.\n\
     * @param {*} [thisArg] The `this` binding of `callback`.\n\
     * @returns {Object} Returns the destination object.\n\
     * @example\n\
     *\n\
     * var names = {\n\
     *   'characters': [\n\
     *     { 'name': 'barney' },\n\
     *     { 'name': 'fred' }\n\
     *   ]\n\
     * };\n\
     *\n\
     * var ages = {\n\
     *   'characters': [\n\
     *     { 'age': 36 },\n\
     *     { 'age': 40 }\n\
     *   ]\n\
     * };\n\
     *\n\
     * _.merge(names, ages);\n\
     * // => { 'characters': [{ 'name': 'barney', 'age': 36 }, { 'name': 'fred', 'age': 40 }] }\n\
     *\n\
     * var food = {\n\
     *   'fruits': ['apple'],\n\
     *   'vegetables': ['beet']\n\
     * };\n\
     *\n\
     * var otherFood = {\n\
     *   'fruits': ['banana'],\n\
     *   'vegetables': ['carrot']\n\
     * };\n\
     *\n\
     * _.merge(food, otherFood, function(a, b) {\n\
     *   return _.isArray(a) ? a.concat(b) : undefined;\n\
     * });\n\
     * // => { 'fruits': ['apple', 'banana'], 'vegetables': ['beet', 'carrot] }\n\
     */\n\
    function merge(object, source, guard) {\n\
      if (!isObject(object)) {\n\
        return object;\n\
      }\n\
      var args = arguments,\n\
          length = args.length,\n\
          type = typeof guard;\n\
\n\
      // enables use as a callback for functions like `_.reduce`\n\
      if ((type == 'number' || type == 'string') && args[3] && args[3][guard] === source) {\n\
        length = 2;\n\
      }\n\
      // juggle arguments\n\
      if (length > 3 && typeof args[length - 2] == 'function') {\n\
        var callback = baseCreateCallback(args[--length - 1], args[length--], 2);\n\
      } else if (length > 2 && typeof args[length - 1] == 'function') {\n\
        callback = args[--length];\n\
      }\n\
      var sources = slice(arguments, 1, length),\n\
          index = -1,\n\
          stackA = getArray(),\n\
          stackB = getArray();\n\
\n\
      while (++index < length) {\n\
        baseMerge(object, sources[index], callback, stackA, stackB);\n\
      }\n\
      releaseArray(stackA);\n\
      releaseArray(stackB);\n\
      return object;\n\
    }\n\
\n\
    /**\n\
     * Creates a shallow clone of `object` excluding the specified properties.\n\
     * Property names may be specified as individual arguments or as arrays of\n\
     * property names. If a callback is provided it will be executed for each\n\
     * property of `object` omitting the properties the callback returns truey\n\
     * for. The callback is bound to `thisArg` and invoked with three arguments;\n\
     * (value, key, object).\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Objects\n\
     * @param {Object} object The source object.\n\
     * @param {Function|...string|string[]} [callback] The function called per\n\
     *  iteration or property names to omit, specified as individual property\n\
     *  names or arrays of property names.\n\
     * @param {*} [thisArg] The `this` binding of `callback`.\n\
     * @returns {Object} Returns an object without the omitted properties.\n\
     * @example\n\
     *\n\
     * _.omit({ 'name': 'fred', 'age': 40 }, 'age');\n\
     * // => { 'name': 'fred' }\n\
     *\n\
     * _.omit({ 'name': 'fred', 'age': 40 }, function(value) {\n\
     *   return typeof value == 'number';\n\
     * });\n\
     * // => { 'name': 'fred' }\n\
     */\n\
    function omit(object, callback, thisArg) {\n\
      var result = {};\n\
\n\
      if (typeof callback != 'function') {\n\
        var omitProps = baseFlatten(arguments, true, false, 1),\n\
            length = omitProps.length;\n\
\n\
        while (length--) {\n\
          omitProps[length] = String(omitProps[length]);\n\
        }\n\
        var props = [];\n\
        baseForIn(object, function(value, key) {\n\
          props.push(key);\n\
        });\n\
\n\
        var index = -1;\n\
        props = baseDifference(props, omitProps);\n\
        length = props.length;\n\
\n\
        while (++index < length) {\n\
          var key = props[index];\n\
          result[key] = object[key];\n\
        }\n\
      } else {\n\
        callback = lodash.createCallback(callback, thisArg, 3);\n\
        baseForIn(object, function(value, key, object) {\n\
          if (!callback(value, key, object)) {\n\
            result[key] = value;\n\
          }\n\
        });\n\
      }\n\
      return result;\n\
    }\n\
\n\
    /**\n\
     * Creates a two dimensional array of an object's key-value pairs,\n\
     * i.e. `[[key1, value1], [key2, value2]]`.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Objects\n\
     * @param {Object} object The object to inspect.\n\
     * @returns {Array} Returns new array of key-value pairs.\n\
     * @example\n\
     *\n\
     * _.pairs({ 'barney': 36, 'fred': 40 });\n\
     * // => [['barney', 36], ['fred', 40]] (property order is not guaranteed across environments)\n\
     */\n\
    function pairs(object) {\n\
      var index = -1,\n\
          props = keys(object),\n\
          length = props.length,\n\
          result = Array(length);\n\
\n\
      while (++index < length) {\n\
        var key = props[index];\n\
        result[index] = [key, object[key]];\n\
      }\n\
      return result;\n\
    }\n\
\n\
    /**\n\
     * Creates a shallow clone of `object` composed of the specified properties.\n\
     * Property names may be specified as individual arguments or as arrays of\n\
     * property names. If a callback is provided it will be executed for each\n\
     * property of `object` picking the properties the callback returns truey\n\
     * for. The callback is bound to `thisArg` and invoked with three arguments;\n\
     * (value, key, object).\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Objects\n\
     * @param {Object} object The source object.\n\
     * @param {Function|...string|string[]} [callback] The function called per\n\
     *  iteration or property names to pick, specified as individual property\n\
     *  names or arrays of property names.\n\
     * @param {*} [thisArg] The `this` binding of `callback`.\n\
     * @returns {Object} Returns an object composed of the picked properties.\n\
     * @example\n\
     *\n\
     * _.pick({ 'name': 'fred', '_userid': 'fred1' }, 'name');\n\
     * // => { 'name': 'fred' }\n\
     *\n\
     * _.pick({ 'name': 'fred', '_userid': 'fred1' }, function(value, key) {\n\
     *   return key.charAt(0) != '_';\n\
     * });\n\
     * // => { 'name': 'fred' }\n\
     */\n\
    function pick(object, callback, thisArg) {\n\
      var result = {};\n\
\n\
      if (typeof callback != 'function') {\n\
        var index = -1,\n\
            props = baseFlatten(arguments, true, false, 1),\n\
            length = isObject(object) ? props.length : 0;\n\
\n\
        while (++index < length) {\n\
          var key = props[index];\n\
          if (key in object) {\n\
            result[key] = object[key];\n\
          }\n\
        }\n\
      } else {\n\
        callback = lodash.createCallback(callback, thisArg, 3);\n\
        baseForIn(object, function(value, key, object) {\n\
          if (callback(value, key, object)) {\n\
            result[key] = value;\n\
          }\n\
        });\n\
      }\n\
      return result;\n\
    }\n\
\n\
    /**\n\
     * An alternative to `_.reduce`; this method transforms `object` to a new\n\
     * `accumulator` object which is the result of running each of its own\n\
     * enumerable properties through a callback, with each callback execution\n\
     * potentially mutating the `accumulator` object. The callback is bound to\n\
     * `thisArg` and invoked with four arguments; (accumulator, value, key, object).\n\
     * Callbacks may exit iteration early by explicitly returning `false`.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Objects\n\
     * @param {Array|Object} object The object to iterate over.\n\
     * @param {Function} [callback=identity] The function called per iteration.\n\
     * @param {*} [accumulator] The custom accumulator value.\n\
     * @param {*} [thisArg] The `this` binding of `callback`.\n\
     * @returns {*} Returns the accumulated value.\n\
     * @example\n\
     *\n\
     * var squares = _.transform([1, 2, 3, 4, 5, 6, 7, 8], function(result, num) {\n\
     *   num *= num;\n\
     *   if (num % 2) {\n\
     *     return result.push(num) < 3;\n\
     *   }\n\
     * });\n\
     * // => [1, 9, 25]\n\
     *\n\
     * var mapped = _.transform({ 'a': 1, 'b': 2, 'c': 3 }, function(result, num, key) {\n\
     *   result[key] = num * 3;\n\
     * });\n\
     * // => { 'a': 3, 'b': 6, 'c': 9 }\n\
     */\n\
    function transform(object, callback, accumulator, thisArg) {\n\
      var isArr = isArray(object);\n\
      if (accumulator == null) {\n\
        if (isArr) {\n\
          accumulator = [];\n\
        } else {\n\
          var ctor = object && object.constructor,\n\
              proto = ctor && ctor.prototype;\n\
\n\
          accumulator = baseCreate(proto);\n\
        }\n\
      }\n\
      if (callback) {\n\
        callback = lodash.createCallback(callback, thisArg, 4);\n\
        (isArr ? baseEach : baseForOwn)(object, function(value, index, object) {\n\
          return callback(accumulator, value, index, object);\n\
        });\n\
      }\n\
      return accumulator;\n\
    }\n\
\n\
    /**\n\
     * Creates an array composed of the own enumerable property values of `object`.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Objects\n\
     * @param {Object} object The object to inspect.\n\
     * @returns {Array} Returns an array of property values.\n\
     * @example\n\
     *\n\
     * _.values({ 'one': 1, 'two': 2, 'three': 3 });\n\
     * // => [1, 2, 3] (property order is not guaranteed across environments)\n\
     */\n\
    function values(object) {\n\
      var index = -1,\n\
          props = keys(object),\n\
          length = props.length,\n\
          result = Array(length);\n\
\n\
      while (++index < length) {\n\
        result[index] = object[props[index]];\n\
      }\n\
      return result;\n\
    }\n\
\n\
    /*--------------------------------------------------------------------------*/\n\
\n\
    /**\n\
     * Converts the first character of `string` to upper case.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Strings\n\
     * @param {string} string The string to capitalize.\n\
     * @returns {string} Returns the capitalized string.\n\
     * @example\n\
     *\n\
     * _.capitalize('fred');\n\
     * // => 'Fred'\n\
     */\n\
    function capitalize(string) {\n\
      if (string == null) {\n\
        return '';\n\
      }\n\
      string = String(string);\n\
      return string.charAt(0).toUpperCase() + string.slice(1);\n\
    }\n\
\n\
    /**\n\
     * Converts the characters \"&\", \"<\", \">\", '\"', and \"'\" in `string` to\n\
     * their corresponding HTML entities.\n\
     *\n\
     * Note: No other characters are escaped. To escape additional characters\n\
     * use a third-party library like [_he_](http://mths.be/he).\n\
     *\n\
     * When working with HTML you should always quote attribute values to reduce\n\
     * XSS vectors. See [Ryan Grove's article](http://wonko.com/post/html-escaping)\n\
     * for more details.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Strings\n\
     * @param {string} string The string to escape.\n\
     * @returns {string} Returns the escaped string.\n\
     * @example\n\
     *\n\
     * _.escape('fred, barney, & pebbles');\n\
     * // => 'fred, barney, &amp; pebbles'\n\
     */\n\
    function escape(string) {\n\
      return string == null ? '' : String(string).replace(reUnescapedHtml, escapeHtmlChar);\n\
    }\n\
\n\
    /**\n\
     * Creates a compiled template function that can interpolate data properties\n\
     * in \"interpolate\" delimiters, HTML-escaped interpolated data properties in\n\
     * \"escape\" delimiters, and execute JavaScript in \"evaluate\" delimiters. If\n\
     * a data object is provided the interpolated template string will be returned.\n\
     * Data properties may be accessed as free variables in the template. If a\n\
     * settings object is provided it will override `_.templateSettings` for the\n\
     * template.\n\
     *\n\
     * Note: In the development build, `_.template` utilizes sourceURLs for easier\n\
     * debugging. See [HTML5 Rocks' article on sourcemaps](http://www.html5rocks.com/en/tutorials/developertools/sourcemaps/#toc-sourceurl)\n\
     * for more details.\n\
     *\n\
     * For more information on precompiling templates see\n\
     * [Lo-Dash's custom builds documentation](http://lodash.com/custom-builds).\n\
     *\n\
     * For more information on Chrome extension sandboxes see\n\
     * [Chrome's extensions documentation](http://developer.chrome.com/stable/extensions/sandboxingEval.html).\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Strings\n\
     * @param {string} text The template text.\n\
     * @param {Object} [data] The data object used to populate the text.\n\
     * @param {Object} [options] The options object.\n\
     * @param {RegExp} [options.escape] The HTML \"escape\" delimiter.\n\
     * @param {RegExp} [options.evaluate] The \"evaluate\" delimiter.\n\
     * @param {Object} [options.imports] An object to import into the template as local variables.\n\
     * @param {RegExp} [options.interpolate] The \"interpolate\" delimiter.\n\
     * @param {string} [options.sourceURL] The sourceURL of the template's compiled source.\n\
     * @param {string} [options.variable] The data object variable name.\n\
     * @returns {Function|string} Returns the interpolated string if a data object\n\
     *  is provided, else it returns a template function.\n\
     * @example\n\
     *\n\
     * // using the \"interpolate\" delimiter to create a compiled template\n\
     * var compiled = _.template('hello <%= name %>');\n\
     * compiled({ 'name': 'fred' });\n\
     * // => 'hello fred'\n\
     *\n\
     * // using the HTML \"escape\" delimiter to escape data property values\n\
     * _.template('<b><%- value %></b>', { 'value': '<script>' });\n\
     * // => '<b>&lt;script&gt;</b>'\n\
     *\n\
     * // using the \"evaluate\" delimiter to execute JavaScript and generate HTML\n\
     * var list = '<% _.forEach(people, function(name) { %><li><%- name %></li><% }); %>';\n\
     * _.template(list, { 'people': ['fred', 'barney'] });\n\
     * // => '<li>fred</li><li>barney</li>'\n\
     *\n\
     * // using the ES6 delimiter as an alternative to the default \"interpolate\" delimiter\n\
     * _.template('hello ${ name }', { 'name': 'pebbles' });\n\
     * // => 'hello pebbles'\n\
     *\n\
     * // using the internal `print` function in \"evaluate\" delimiters\n\
     * _.template('<% print(\"hello \" + name); %>!', { 'name': 'barney' });\n\
     * // => 'hello barney!'\n\
     *\n\
     * // using a custom template delimiters\n\
     * _.templateSettings = {\n\
     *   'interpolate': /{{([\\s\\S]+?)}}/g\n\
     * };\n\
     *\n\
     * _.template('hello {{ name }}!', { 'name': 'mustache' });\n\
     * // => 'hello mustache!'\n\
     *\n\
     * // using the `imports` option to import jQuery\n\
     * var list = '<% jq.each(people, function(name) { %><li><%- name %></li><% }); %>';\n\
     * _.template(list, { 'people': ['fred', 'barney'] }, { 'imports': { 'jq': jQuery } });\n\
     * // => '<li>fred</li><li>barney</li>'\n\
     *\n\
     * // using the `sourceURL` option to specify a custom sourceURL for the template\n\
     * var compiled = _.template('hello <%= name %>', null, { 'sourceURL': '/basic/greeting.jst' });\n\
     * compiled(data);\n\
     * // => find the source of \"greeting.jst\" under the Sources tab or Resources panel of the web inspector\n\
     *\n\
     * // using the `variable` option to ensure a with-statement isn't used in the compiled template\n\
     * var compiled = _.template('hi <%= data.name %>!', null, { 'variable': 'data' });\n\
     * compiled.source;\n\
     * // => function(data) {\n\
     *   var __t, __p = '', __e = _.escape;\n\
     *   __p += 'hi ' + ((__t = ( data.name )) == null ? '' : __t) + '!';\n\
     *   return __p;\n\
     * }\n\
     *\n\
     * // using the `source` property to inline compiled templates for meaningful\n\
     * // line numbers in error messages and a stack trace\n\
     * fs.writeFileSync(path.join(cwd, 'jst.js'), '\\\n\
     *   var JST = {\\\n\
     *     \"main\": ' + _.template(mainText).source + '\\\n\
     *   };\\\n\
     * ');\n\
     */\n\
    function template(text, data, options) {\n\
      // based on John Resig's `tmpl` implementation\n\
      // http://ejohn.org/blog/javascript-micro-templating/\n\
      // and Laura Doktorova's doT.js\n\
      // https://github.com/olado/doT\n\
      var settings = lodash.templateSettings;\n\
      text = String(text || '');\n\
\n\
      // avoid missing dependencies when `iteratorTemplate` is not defined\n\
      options = defaults({}, options, settings);\n\
\n\
      var imports = defaults({}, options.imports, settings.imports),\n\
          importsKeys = keys(imports),\n\
          importsValues = values(imports);\n\
\n\
      var isEvaluating,\n\
          index = 0,\n\
          interpolate = options.interpolate || reNoMatch,\n\
          source = \"__p += '\";\n\
\n\
      // compile the regexp to match each delimiter\n\
      var reDelimiters = RegExp(\n\
        (options.escape || reNoMatch).source + '|' +\n\
        interpolate.source + '|' +\n\
        (interpolate === reInterpolate ? reEsTemplate : reNoMatch).source + '|' +\n\
        (options.evaluate || reNoMatch).source + '|$'\n\
      , 'g');\n\
\n\
      text.replace(reDelimiters, function(match, escapeValue, interpolateValue, esTemplateValue, evaluateValue, offset) {\n\
        interpolateValue || (interpolateValue = esTemplateValue);\n\
\n\
        // escape characters that cannot be included in string literals\n\
        source += text.slice(index, offset).replace(reUnescapedString, escapeStringChar);\n\
\n\
        // replace delimiters with snippets\n\
        if (escapeValue) {\n\
          source += \"' +\\n\
__e(\" + escapeValue + \") +\\n\
'\";\n\
        }\n\
        if (evaluateValue) {\n\
          isEvaluating = true;\n\
          source += \"';\\n\
\" + evaluateValue + \";\\n\
__p += '\";\n\
        }\n\
        if (interpolateValue) {\n\
          source += \"' +\\n\
((__t = (\" + interpolateValue + \")) == null ? '' : __t) +\\n\
'\";\n\
        }\n\
        index = offset + match.length;\n\
\n\
        // the JS engine embedded in Adobe products requires returning the `match`\n\
        // string in order to produce the correct `offset` value\n\
        return match;\n\
      });\n\
\n\
      source += \"';\\n\
\";\n\
\n\
      // if `variable` is not specified, wrap a with-statement around the generated\n\
      // code to add the data object to the top of the scope chain\n\
      var variable = options.variable,\n\
          hasVariable = variable;\n\
\n\
      if (!hasVariable) {\n\
        variable = 'obj';\n\
        source = 'with (' + variable + ') {\\n\
' + source + '\\n\
}\\n\
';\n\
      }\n\
      // cleanup code by stripping empty strings\n\
      source = (isEvaluating ? source.replace(reEmptyStringLeading, '') : source)\n\
        .replace(reEmptyStringMiddle, '$1')\n\
        .replace(reEmptyStringTrailing, '$1;');\n\
\n\
      // frame code as the function body\n\
      source = 'function(' + variable + ') {\\n\
' +\n\
        (hasVariable ? '' : variable + ' || (' + variable + ' = {});\\n\
') +\n\
        \"var __t, __p = '', __e = _.escape\" +\n\
        (isEvaluating\n\
          ? ', __j = Array.prototype.join;\\n\
' +\n\
            \"function print() { __p += __j.call(arguments, '') }\\n\
\"\n\
          : ';\\n\
'\n\
        ) +\n\
        source +\n\
        'return __p\\n\
}';\n\
\n\
      // Use a sourceURL for easier debugging.\n\
      // http://www.html5rocks.com/en/tutorials/developertools/sourcemaps/#toc-sourceurl\n\
      var sourceURL = '\\n\
/*\\n\
//# sourceURL=' + (options.sourceURL || '/lodash/template/source[' + (templateCounter++) + ']') + '\\n\
*/';\n\
\n\
      try {\n\
        var result = Function(importsKeys, 'return ' + source + sourceURL).apply(undefined, importsValues);\n\
      } catch(e) {\n\
        e.source = source;\n\
        throw e;\n\
      }\n\
      if (data) {\n\
        return result(data);\n\
      }\n\
      // provide the compiled function's source by its `toString` method, in\n\
      // supported environments, or the `source` property as a convenience for\n\
      // inlining compiled templates during the build process\n\
      result.source = source;\n\
      return result;\n\
    }\n\
\n\
    /**\n\
     * Removes leading and trailing whitespace or specified characters from `string`.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Strings\n\
     * @param {string} string The string to trim.\n\
     * @param {string} [chars=whitespace] The characters to trim.\n\
     * @returns {string} Returns the trimmed string.\n\
     * @example\n\
     *\n\
     * _.trim('  fred  ');\n\
     * // => 'fred'\n\
     *\n\
     * _.trim('-_-fred-_-', '_-');\n\
     * // => 'fred'\n\
     */\n\
    var trim = !nativeTrim ? shimTrim : function(string, chars) {\n\
      if (string == null) {\n\
        return '';\n\
      }\n\
      return chars == null ? nativeTrim.call(string) : shimTrim(string, chars);\n\
    };\n\
\n\
    /**\n\
     * Removes leading whitespace or specified characters from `string`.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Strings\n\
     * @param {string} string The string to trim.\n\
     * @param {string} [chars=whitespace] The characters to trim.\n\
     * @returns {string} Returns the trimmed string.\n\
     * @example\n\
     *\n\
     * _.trimLeft('  fred  ');\n\
     * // => 'fred  '\n\
     *\n\
     * _.trimLeft('-_-fred-_-', '_-');\n\
     * // => 'fred-_-'\n\
     */\n\
    var trimLeft = !nativeTrimLeft ? shimTrimLeft : function(string, chars) {\n\
      if (string == null) {\n\
        return '';\n\
      }\n\
      return chars == null ? nativeTrimLeft.call(string) : shimTrimLeft(string, chars);\n\
    };\n\
\n\
    /**\n\
     * Removes trailing whitespace or specified characters from `string`.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Strings\n\
     * @param {string} string The string to trim.\n\
     * @param {string} [chars=whitespace] The characters to trim.\n\
     * @returns {string} Returns the trimmed string.\n\
     * @example\n\
     *\n\
     * _.trimRight('  fred  ');\n\
     * // => '  fred'\n\
     *\n\
     * _.trimRight('-_-fred-_-', '_-');\n\
     * // => '-_-fred'\n\
     */\n\
    var trimRight = !nativeTrimRight ? shimTrimRight : function(string, chars) {\n\
      if (string == null) {\n\
        return '';\n\
      }\n\
      return chars == null ? nativeTrimRight.call(string) : shimTrimRight(string, chars);\n\
    };\n\
\n\
    /**\n\
     * The inverse of `_.escape`; this method converts the HTML entities\n\
     * `&amp;`, `&lt;`, `&gt;`, `&quot;`, and `&#39;` in `string` to their\n\
     * corresponding characters.\n\
     *\n\
     * Note: No other HTML entities are unescaped. To unescape additional HTML\n\
     * entities use a third-party library like [_he_](http://mths.be/he).\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Strings\n\
     * @param {string} string The string to unescape.\n\
     * @returns {string} Returns the unescaped string.\n\
     * @example\n\
     *\n\
     * _.unescape('fred, barney &amp; pebbles');\n\
     * // => 'fred, barney & pebbles'\n\
     */\n\
    function unescape(string) {\n\
      if (string == null) {\n\
        return '';\n\
      }\n\
      string = String(string);\n\
      return string.indexOf(';') < 0 ? string : string.replace(reEscapedHtml, unescapeHtmlChar);\n\
    }\n\
\n\
    /*--------------------------------------------------------------------------*/\n\
\n\
    /**\n\
     * Creates a function that returns `value`.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Utilities\n\
     * @param {*} value The value to return from the new function.\n\
     * @returns {Function} Returns the new function.\n\
     * @example\n\
     *\n\
     * var object = { 'name': 'fred' };\n\
     * var getter = _.constant(object);\n\
     * getter() === object;\n\
     * // => true\n\
     */\n\
    function constant(value) {\n\
      return function() {\n\
        return value;\n\
      };\n\
    }\n\
\n\
    /**\n\
     * Produces a callback bound to an optional `thisArg`. If `func` is a property\n\
     * name the created callback will return the property value for a given element.\n\
     * If `func` is an object the created callback will return `true` for elements\n\
     * that contain the equivalent object properties, otherwise it will return `false`.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @alias callback\n\
     * @category Utilities\n\
     * @param {*} [func=identity] The value to convert to a callback.\n\
     * @param {*} [thisArg] The `this` binding of the created callback.\n\
     * @param {number} [argCount] The number of arguments the callback accepts.\n\
     * @returns {Function} Returns a callback function.\n\
     * @example\n\
     *\n\
     * var characters = [\n\
     *   { 'name': 'barney', 'age': 36 },\n\
     *   { 'name': 'fred',   'age': 40 }\n\
     * ];\n\
     *\n\
     * // wrap to create custom callback shorthands\n\
     * _.createCallback = _.wrap(_.createCallback, function(func, callback, thisArg) {\n\
     *   var match = /^(.+?)__([gl]t)(.+)$/.exec(callback);\n\
     *   return !match ? func(callback, thisArg) : function(object) {\n\
     *     return match[2] == 'gt' ? object[match[1]] > match[3] : object[match[1]] < match[3];\n\
     *   };\n\
     * });\n\
     *\n\
     * _.filter(characters, 'age__gt38');\n\
     * // => [{ 'name': 'fred', 'age': 40 }]\n\
     */\n\
    function createCallback(func, thisArg, argCount) {\n\
      var type = typeof func;\n\
      if (type == 'function' || func == null) {\n\
        return (typeof thisArg == 'undefined' || !('prototype' in func)) &&\n\
          func || baseCreateCallback(func, thisArg, argCount);\n\
      }\n\
      // handle \"_.pluck\" and \"_.where\" style callback shorthands\n\
      return type != 'object' ? property(func) : matches(func);\n\
    }\n\
\n\
    /**\n\
     * This method returns the first argument provided to it.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Utilities\n\
     * @param {*} value Any value.\n\
     * @returns {*} Returns `value`.\n\
     * @example\n\
     *\n\
     * var object = { 'name': 'fred' };\n\
     * _.identity(object) === object;\n\
     * // => true\n\
     */\n\
    function identity(value) {\n\
      return value;\n\
    }\n\
\n\
    /**\n\
     * Creates a \"_.where\" style function, which performs a deep comparison\n\
     * between a given object and the `source` object, returning `true` if the\n\
     * given object has equivalent property values, else `false`.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Utilities\n\
     * @param {Object} source The object of property values to match.\n\
     * @returns {Function} Returns the new function.\n\
     * @example\n\
     *\n\
     * var characters = [\n\
     *   { 'name': 'fred',   'age': 40 },\n\
     *   { 'name': 'barney', 'age': 36 }\n\
     * ];\n\
     *\n\
     * var matchesAge = _.matches({ 'age': 36 });\n\
     *\n\
     * _.filter(characters, matchesAge);\n\
     * // => [{ 'name': 'barney', 'age': 36 }]\n\
     *\n\
     * _.find(characters, matchesAge);\n\
     * // => { 'name': 'barney', 'age': 36 }\n\
     */\n\
    function matches(source) {\n\
      source || (source = {});\n\
\n\
      var props = keys(source),\n\
          key = props[0],\n\
          a = source[key];\n\
\n\
      // fast path the common case of providing an object with a single\n\
      // property containing a primitive value\n\
      if (props.length == 1 && a === a && !isObject(a)) {\n\
        return function(object) {\n\
          if (!hasOwnProperty.call(object, key)) {\n\
            return false;\n\
          }\n\
          var b = object[key];\n\
          return a === b && (a !== 0 || (1 / a == 1 / b));\n\
        };\n\
      }\n\
      return function(object) {\n\
        var length = props.length,\n\
            result = false;\n\
\n\
        while (length--) {\n\
          var key = props[length];\n\
          if (!(result = hasOwnProperty.call(object, key) &&\n\
                baseIsEqual(object[key], source[key], null, true))) {\n\
            break;\n\
          }\n\
        }\n\
        return result;\n\
      };\n\
    }\n\
\n\
    /**\n\
     * Adds function properties of a source object to the destination object.\n\
     * If `object` is a function methods will be added to its prototype as well.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Utilities\n\
     * @param {Function|Object} [object=lodash] object The destination object.\n\
     * @param {Object} source The object of functions to add.\n\
     * @param {Object} [options] The options object.\n\
     * @param {boolean} [options.chain=true] Specify whether the functions added are chainable.\n\
     * @example\n\
     *\n\
     * function vowels(string) {\n\
     *   return _.filter(string, function(v) {\n\
     *     return /[aeiou]/i.test(v);\n\
     *   });\n\
     * }\n\
     *\n\
     * _.mixin({ 'vowels': vowels });\n\
     * _.vowels('fred');\n\
     * // => ['e']\n\
     *\n\
     * _('fred').vowels().value();\n\
     * // => ['e']\n\
     *\n\
     * _.mixin({ 'vowels': vowels }, { 'chain': false });\n\
     * _('fred').vowels();\n\
     * // => ['e']\n\
     */\n\
    function mixin(object, source, options) {\n\
      var chain = true,\n\
          methodNames = source && functions(source);\n\
\n\
      if (!source || (!options && !methodNames.length)) {\n\
        if (options == null) {\n\
          options = source;\n\
        }\n\
        source = object;\n\
        object = lodash;\n\
        methodNames = functions(source);\n\
      }\n\
      if (options === false) {\n\
        chain = false;\n\
      } else if (isObject(options) && 'chain' in options) {\n\
        chain = options.chain;\n\
      }\n\
      var index = -1,\n\
          isFunc = isFunction(object),\n\
          length = methodNames ? methodNames.length : 0;\n\
\n\
      while (++index < length) {\n\
        var methodName = methodNames[index],\n\
            func = object[methodName] = source[methodName];\n\
\n\
        if (isFunc) {\n\
          object.prototype[methodName] = (function(func) {\n\
            return function() {\n\
              var chainAll = this.__chain__,\n\
                  value = this.__wrapped__,\n\
                  args = [value];\n\
\n\
              push.apply(args, arguments);\n\
              var result = func.apply(object, args);\n\
              if (chain || chainAll) {\n\
                if (value === result && isObject(result)) {\n\
                  return this;\n\
                }\n\
                result = new object(result);\n\
                result.__chain__ = chainAll;\n\
              }\n\
              return result;\n\
            };\n\
          }(func));\n\
        }\n\
      }\n\
    }\n\
\n\
    /**\n\
     * Reverts the '_' variable to its previous value and returns a reference to\n\
     * the `lodash` function.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Utilities\n\
     * @returns {Function} Returns the `lodash` function.\n\
     * @example\n\
     *\n\
     * var lodash = _.noConflict();\n\
     */\n\
    function noConflict() {\n\
      context._ = oldDash;\n\
      return this;\n\
    }\n\
\n\
    /**\n\
     * A no-operation function.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Utilities\n\
     * @example\n\
     *\n\
     * var object = { 'name': 'fred' };\n\
     * _.noop(object) === undefined;\n\
     * // => true\n\
     */\n\
    function noop() {\n\
      // no operation performed\n\
    }\n\
\n\
    /**\n\
     * Gets the number of milliseconds that have elapsed since the Unix epoch\n\
     * (1 January 1970 00:00:00 UTC).\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Utilities\n\
     * @example\n\
     *\n\
     * var stamp = _.now();\n\
     * _.defer(function() { console.log(_.now() - stamp); });\n\
     * // => logs the number of milliseconds it took for the deferred function to be called\n\
     */\n\
    var now = nativeNow || function() {\n\
      return new Date().getTime();\n\
    };\n\
\n\
    /**\n\
     * Converts `value` to an integer of the specified radix. If `radix` is\n\
     * `undefined` or `0` a `radix` of `10` is used unless the `value` is a\n\
     * hexadecimal, in which case a `radix` of `16` is used.\n\
     *\n\
     * Note: This method avoids differences in native ES3 and ES5 `parseInt`\n\
     * implementations. See the [ES5 spec](http://es5.github.io/#E)\n\
     * for more details.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Utilities\n\
     * @param {string} value The value to parse.\n\
     * @param {number} [radix] The radix used to interpret the value to parse.\n\
     * @returns {number} Returns the new integer value.\n\
     * @example\n\
     *\n\
     * _.parseInt('08');\n\
     * // => 8\n\
     */\n\
    var parseInt = nativeParseInt(whitespace + '08') == 8 ? nativeParseInt : function(value, radix) {\n\
      // Firefox < 21 and Opera < 15 follow ES3  for `parseInt` and\n\
      // Chrome fails to trim leading <BOM> whitespace characters.\n\
      // See https://code.google.com/p/v8/issues/detail?id=3109\n\
      value = trim(value);\n\
      return nativeParseInt(value, +radix || (reHexPrefix.test(value) ? 16 : 10));\n\
    };\n\
\n\
    /**\n\
     * Creates a \"_.pluck\" style function, which returns the `key` value of a\n\
     * given object.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Utilities\n\
     * @param {string} key The name of the property to retrieve.\n\
     * @returns {Function} Returns the new function.\n\
     * @example\n\
     *\n\
     * var characters = [\n\
     *   { 'name': 'fred',   'age': 40 },\n\
     *   { 'name': 'barney', 'age': 36 }\n\
     * ];\n\
     *\n\
     * var getName = _.property('name');\n\
     *\n\
     * _.map(characters, getName);\n\
     * // => ['barney', 'fred']\n\
     *\n\
     * _.sortBy(characters, getName);\n\
     * // => [{ 'name': 'barney', 'age': 36 }, { 'name': 'fred',   'age': 40 }]\n\
     */\n\
    function property(key) {\n\
      return function(object) {\n\
        return object[key];\n\
      };\n\
    }\n\
\n\
    /**\n\
     * Produces a random number between `min` and `max` (inclusive). If only one\n\
     * argument is provided a number between `0` and the given number will be\n\
     * returned. If `floating` is truey or either `min` or `max` are floats a\n\
     * floating-point number will be returned instead of an integer.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Utilities\n\
     * @param {number} [min=0] The minimum possible value.\n\
     * @param {number} [max=1] The maximum possible value.\n\
     * @param {boolean} [floating=false] Specify returning a floating-point number.\n\
     * @returns {number} Returns a random number.\n\
     * @example\n\
     *\n\
     * _.random(0, 5);\n\
     * // => an integer between 0 and 5\n\
     *\n\
     * _.random(5);\n\
     * // => also an integer between 0 and 5\n\
     *\n\
     * _.random(5, true);\n\
     * // => a floating-point number between 0 and 5\n\
     *\n\
     * _.random(1.2, 5.2);\n\
     * // => a floating-point number between 1.2 and 5.2\n\
     */\n\
    function random(min, max, floating) {\n\
      var noMin = min == null,\n\
          noMax = max == null;\n\
\n\
      if (floating == null) {\n\
        if (noMax && typeof min == 'boolean') {\n\
          floating = min;\n\
          min = 1;\n\
        }\n\
        else if (typeof max == 'boolean') {\n\
          floating = max;\n\
          noMax = true;\n\
        }\n\
      }\n\
      if (noMin && noMax) {\n\
        max = 1;\n\
        noMax = false;\n\
      }\n\
      min = +min || 0;\n\
      if (noMax) {\n\
        max = min;\n\
        min = 0;\n\
      } else {\n\
        max = +max || 0;\n\
      }\n\
      if (floating || min % 1 || max % 1) {\n\
        var rand = nativeRandom();\n\
        return nativeMin(min + (rand * (max - min + parseFloat('1e-' + ((rand +'').length - 1)))), max);\n\
      }\n\
      return baseRandom(min, max);\n\
    }\n\
\n\
    /**\n\
     * Resolves the value of property `key` on `object`. If `key` is a function\n\
     * it will be invoked with the `this` binding of `object` and its result\n\
     * returned, else the property value is returned. If `object` is `null` or\n\
     * `undefined` then `undefined` is returned. If a default value is provided\n\
     * it will be returned if the property value resolves to `undefined`.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Utilities\n\
     * @param {Object} object The object to inspect.\n\
     * @param {string} key The name of the property to resolve.\n\
     * @param {*} [defaultValue] The value returned if the property value\n\
     *  resolves to `undefined`.\n\
     * @returns {*} Returns the resolved value.\n\
     * @example\n\
     *\n\
     * var object = {\n\
     *   'name': 'fred',\n\
     *   'age': function() {\n\
     *     return 40;\n\
     *   }\n\
     * };\n\
     *\n\
     * _.result(object, 'name');\n\
     * // => 'fred'\n\
     *\n\
     * _.result(object, 'age');\n\
     * // => 40\n\
     *\n\
     * _.result(object, 'employer', 'slate');\n\
     * // => 'slate'\n\
     */\n\
    function result(object, key, defaultValue) {\n\
      var value = object == null ? undefined : object[key];\n\
      if (typeof value == 'undefined') {\n\
        return defaultValue;\n\
      }\n\
      return isFunction(value) ? object[key]() : value;\n\
    }\n\
\n\
    /**\n\
     * Executes the callback `n` times, returning an array of the results\n\
     * of each callback execution. The callback is bound to `thisArg` and invoked\n\
     * with one argument; (index).\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Utilities\n\
     * @param {number} n The number of times to execute the callback.\n\
     * @param {Function} callback The function called per iteration.\n\
     * @param {*} [thisArg] The `this` binding of `callback`.\n\
     * @returns {Array} Returns an array of the results of each `callback` execution.\n\
     * @example\n\
     *\n\
     * var diceRolls = _.times(3, _.partial(_.random, 1, 6));\n\
     * // => [3, 6, 4]\n\
     *\n\
     * _.times(3, function(n) { mage.castSpell(n); });\n\
     * // => calls `mage.castSpell(n)` three times, passing `n` of `0`, `1`, and `2` respectively\n\
     *\n\
     * _.times(3, function(n) { this.cast(n); }, mage);\n\
     * // => also calls `mage.castSpell(n)` three times\n\
     */\n\
    function times(n, callback, thisArg) {\n\
      n = (n = +n) > -1 ? n : 0;\n\
      var index = -1,\n\
          result = Array(n);\n\
\n\
      callback = baseCreateCallback(callback, thisArg, 1);\n\
      while (++index < n) {\n\
        result[index] = callback(index);\n\
      }\n\
      return result;\n\
    }\n\
\n\
    /**\n\
     * Generates a unique ID. If `prefix` is provided the ID will be appended to it.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Utilities\n\
     * @param {string} [prefix] The value to prefix the ID with.\n\
     * @returns {string} Returns the unique ID.\n\
     * @example\n\
     *\n\
     * _.uniqueId('contact_');\n\
     * // => 'contact_104'\n\
     *\n\
     * _.uniqueId();\n\
     * // => '105'\n\
     */\n\
    function uniqueId(prefix) {\n\
      var id = ++idCounter;\n\
      return String(prefix == null ? '' : prefix) + id;\n\
    }\n\
\n\
    /*--------------------------------------------------------------------------*/\n\
\n\
    // add functions that return wrapped values when chaining\n\
    lodash.after = after;\n\
    lodash.assign = assign;\n\
    lodash.at = at;\n\
    lodash.bind = bind;\n\
    lodash.bindAll = bindAll;\n\
    lodash.bindKey = bindKey;\n\
    lodash.chain = chain;\n\
    lodash.compact = compact;\n\
    lodash.compose = compose;\n\
    lodash.constant = constant;\n\
    lodash.countBy = countBy;\n\
    lodash.create = create;\n\
    lodash.createCallback = createCallback;\n\
    lodash.curry = curry;\n\
    lodash.debounce = debounce;\n\
    lodash.defaults = defaults;\n\
    lodash.defer = defer;\n\
    lodash.delay = delay;\n\
    lodash.difference = difference;\n\
    lodash.filter = filter;\n\
    lodash.flatten = flatten;\n\
    lodash.forEach = forEach;\n\
    lodash.forEachRight = forEachRight;\n\
    lodash.forIn = forIn;\n\
    lodash.forInRight = forInRight;\n\
    lodash.forOwn = forOwn;\n\
    lodash.forOwnRight = forOwnRight;\n\
    lodash.functions = functions;\n\
    lodash.groupBy = groupBy;\n\
    lodash.indexBy = indexBy;\n\
    lodash.initial = initial;\n\
    lodash.intersection = intersection;\n\
    lodash.invert = invert;\n\
    lodash.invoke = invoke;\n\
    lodash.keys = keys;\n\
    lodash.map = map;\n\
    lodash.mapValues = mapValues;\n\
    lodash.matches = matches;\n\
    lodash.max = max;\n\
    lodash.memoize = memoize;\n\
    lodash.merge = merge;\n\
    lodash.min = min;\n\
    lodash.omit = omit;\n\
    lodash.once = once;\n\
    lodash.pairs = pairs;\n\
    lodash.partial = partial;\n\
    lodash.partialRight = partialRight;\n\
    lodash.partition = partition;\n\
    lodash.pick = pick;\n\
    lodash.pluck = pluck;\n\
    lodash.property = property;\n\
    lodash.pull = pull;\n\
    lodash.range = range;\n\
    lodash.reject = reject;\n\
    lodash.remove = remove;\n\
    lodash.rest = rest;\n\
    lodash.shuffle = shuffle;\n\
    lodash.slice = slice;\n\
    lodash.sortBy = sortBy;\n\
    lodash.tap = tap;\n\
    lodash.throttle = throttle;\n\
    lodash.times = times;\n\
    lodash.toArray = toArray;\n\
    lodash.transform = transform;\n\
    lodash.union = union;\n\
    lodash.uniq = uniq;\n\
    lodash.values = values;\n\
    lodash.where = where;\n\
    lodash.without = without;\n\
    lodash.wrap = wrap;\n\
    lodash.xor = xor;\n\
    lodash.zip = zip;\n\
    lodash.zipObject = zipObject;\n\
\n\
    // add aliases\n\
    lodash.callback = createCallback;\n\
    lodash.collect = map;\n\
    lodash.drop = rest;\n\
    lodash.each = forEach;\n\
    lodash.eachRight = forEachRight;\n\
    lodash.extend = assign;\n\
    lodash.methods = functions;\n\
    lodash.object = zipObject;\n\
    lodash.select = filter;\n\
    lodash.tail = rest;\n\
    lodash.unique = uniq;\n\
    lodash.unzip = zip;\n\
\n\
    // add functions to `lodash.prototype`\n\
    mixin(assign({}, lodash));\n\
\n\
    /*--------------------------------------------------------------------------*/\n\
\n\
    // add functions that return unwrapped values when chaining\n\
    lodash.capitalize = capitalize;\n\
    lodash.clone = clone;\n\
    lodash.cloneDeep = cloneDeep;\n\
    lodash.contains = contains;\n\
    lodash.escape = escape;\n\
    lodash.every = every;\n\
    lodash.find = find;\n\
    lodash.findIndex = findIndex;\n\
    lodash.findKey = findKey;\n\
    lodash.findLast = findLast;\n\
    lodash.findLastIndex = findLastIndex;\n\
    lodash.findLastKey = findLastKey;\n\
    lodash.has = has;\n\
    lodash.identity = identity;\n\
    lodash.indexOf = indexOf;\n\
    lodash.isArguments = isArguments;\n\
    lodash.isArray = isArray;\n\
    lodash.isBoolean = isBoolean;\n\
    lodash.isDate = isDate;\n\
    lodash.isElement = isElement;\n\
    lodash.isEmpty = isEmpty;\n\
    lodash.isEqual = isEqual;\n\
    lodash.isFinite = isFinite;\n\
    lodash.isFunction = isFunction;\n\
    lodash.isNaN = isNaN;\n\
    lodash.isNull = isNull;\n\
    lodash.isNumber = isNumber;\n\
    lodash.isObject = isObject;\n\
    lodash.isPlainObject = isPlainObject;\n\
    lodash.isRegExp = isRegExp;\n\
    lodash.isString = isString;\n\
    lodash.isUndefined = isUndefined;\n\
    lodash.lastIndexOf = lastIndexOf;\n\
    lodash.mixin = mixin;\n\
    lodash.noConflict = noConflict;\n\
    lodash.noop = noop;\n\
    lodash.now = now;\n\
    lodash.parseInt = parseInt;\n\
    lodash.random = random;\n\
    lodash.reduce = reduce;\n\
    lodash.reduceRight = reduceRight;\n\
    lodash.result = result;\n\
    lodash.runInContext = runInContext;\n\
    lodash.size = size;\n\
    lodash.some = some;\n\
    lodash.sortedIndex = sortedIndex;\n\
    lodash.template = template;\n\
    lodash.trim = trim;\n\
    lodash.trimLeft = trimLeft;\n\
    lodash.trimRight = trimRight;\n\
    lodash.unescape = unescape;\n\
    lodash.uniqueId = uniqueId;\n\
\n\
    // add aliases\n\
    lodash.all = every;\n\
    lodash.any = some;\n\
    lodash.detect = find;\n\
    lodash.findWhere = find;\n\
    lodash.foldl = reduce;\n\
    lodash.foldr = reduceRight;\n\
    lodash.include = contains;\n\
    lodash.inject = reduce;\n\
\n\
    mixin(function() {\n\
      var source = {}\n\
      baseForOwn(lodash, function(func, methodName) {\n\
        if (!lodash.prototype[methodName]) {\n\
          source[methodName] = func;\n\
        }\n\
      });\n\
      return source;\n\
    }(), false);\n\
\n\
    /*--------------------------------------------------------------------------*/\n\
\n\
    // add functions capable of returning wrapped and unwrapped values when chaining\n\
    lodash.first = first;\n\
    lodash.last = last;\n\
    lodash.sample = sample;\n\
\n\
    // add aliases\n\
    lodash.take = first;\n\
    lodash.head = first;\n\
\n\
    baseForOwn(lodash, function(func, methodName) {\n\
      var callbackable = methodName !== 'sample';\n\
      if (!lodash.prototype[methodName]) {\n\
        lodash.prototype[methodName]= function(n, guard) {\n\
          var chainAll = this.__chain__,\n\
              result = func(this.__wrapped__, n, guard);\n\
\n\
          return !chainAll && (n == null || (guard && !(callbackable && typeof n == 'function')))\n\
            ? result\n\
            : new lodashWrapper(result, chainAll);\n\
        };\n\
      }\n\
    });\n\
\n\
    /*--------------------------------------------------------------------------*/\n\
\n\
    /**\n\
     * The semantic version number.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @type string\n\
     */\n\
    lodash.VERSION = version;\n\
\n\
    // add \"Chaining\" functions to the wrapper\n\
    lodash.prototype.chain = wrapperChain;\n\
    lodash.prototype.toString = wrapperToString;\n\
    lodash.prototype.value = wrapperValueOf;\n\
    lodash.prototype.valueOf = wrapperValueOf;\n\
\n\
    // add `Array` functions that return unwrapped values\n\
    baseEach(['join', 'pop', 'shift'], function(methodName) {\n\
      var func = arrayRef[methodName];\n\
      lodash.prototype[methodName] = function() {\n\
        var chainAll = this.__chain__,\n\
            result = func.apply(this.__wrapped__, arguments);\n\
\n\
        return chainAll\n\
          ? new lodashWrapper(result, chainAll)\n\
          : result;\n\
      };\n\
    });\n\
\n\
    // add `Array` functions that return the existing wrapped value\n\
    baseEach(['push', 'reverse', 'sort', 'unshift'], function(methodName) {\n\
      var func = arrayRef[methodName];\n\
      lodash.prototype[methodName] = function() {\n\
        func.apply(this.__wrapped__, arguments);\n\
        return this;\n\
      };\n\
    });\n\
\n\
    // add `Array` functions that return new wrapped values\n\
    baseEach(['concat', 'splice'], function(methodName) {\n\
      var func = arrayRef[methodName];\n\
      lodash.prototype[methodName] = function() {\n\
        return new lodashWrapper(func.apply(this.__wrapped__, arguments), this.__chain__);\n\
      };\n\
    });\n\
\n\
    // avoid array-like object bugs with `Array#shift` and `Array#splice`\n\
    // in IE < 9, Firefox < 10, Narwhal, and RingoJS\n\
    if (!support.spliceObjects) {\n\
      baseEach(['pop', 'shift', 'splice'], function(methodName) {\n\
        var func = arrayRef[methodName],\n\
            isSplice = methodName == 'splice';\n\
\n\
        lodash.prototype[methodName] = function() {\n\
          var chainAll = this.__chain__,\n\
              value = this.__wrapped__,\n\
              result = func.apply(value, arguments);\n\
\n\
          if (value.length === 0) {\n\
            delete value[0];\n\
          }\n\
          return (chainAll || isSplice)\n\
            ? new lodashWrapper(result, chainAll)\n\
            : result;\n\
        };\n\
      });\n\
    }\n\
\n\
    return lodash;\n\
  }\n\
\n\
  /*--------------------------------------------------------------------------*/\n\
\n\
  // export Lo-Dash\n\
  var _ = runInContext();\n\
\n\
  // some AMD build optimizers like r.js check for condition patterns like the following:\n\
  if (typeof define == 'function' && typeof define.amd == 'object' && define.amd) {\n\
    // Expose Lo-Dash to the global object even when an AMD loader is present in\n\
    // case Lo-Dash is loaded with a RequireJS shim config.\n\
    // See http://requirejs.org/docs/api.html#config-shim\n\
    root._ = _;\n\
\n\
    // define as an anonymous module so, through path mapping, it can be\n\
    // referenced as the \"underscore\" module\n\
    define(function() {\n\
      return _;\n\
    });\n\
  }\n\
  // check for `exports` after `define` in case a build optimizer adds an `exports` object\n\
  else if (freeExports && freeModule) {\n\
    // in Node.js or RingoJS\n\
    if (moduleExports) {\n\
      (freeModule.exports = _)._ = _;\n\
    }\n\
    // in Narwhal or Rhino -require\n\
    else {\n\
      freeExports._ = _;\n\
    }\n\
  }\n\
  else {\n\
    // in a browser or Rhino\n\
    root._ = _;\n\
  }\n\
}.call(this));\n\
//@ sourceURL=lodash-lodash/dist/lodash.compat.js"
));
require.register("component-bind/index.js", Function("exports, require, module",
"/**\n\
 * Slice reference.\n\
 */\n\
\n\
var slice = [].slice;\n\
\n\
/**\n\
 * Bind `obj` to `fn`.\n\
 *\n\
 * @param {Object} obj\n\
 * @param {Function|String} fn or string\n\
 * @return {Function}\n\
 * @api public\n\
 */\n\
\n\
module.exports = function(obj, fn){\n\
  if ('string' == typeof fn) fn = obj[fn];\n\
  if ('function' != typeof fn) throw new Error('bind() requires a function');\n\
  var args = slice.call(arguments, 2);\n\
  return function(){\n\
    return fn.apply(obj, args.concat(slice.call(arguments)));\n\
  }\n\
};\n\
//@ sourceURL=component-bind/index.js"
));
require.register("component-query/index.js", Function("exports, require, module",
"\n\
function one(selector, el) {\n\
  return el.querySelector(selector);\n\
}\n\
\n\
exports = module.exports = function(selector, el){\n\
  el = el || document;\n\
  return one(selector, el);\n\
};\n\
\n\
exports.all = function(selector, el){\n\
  el = el || document;\n\
  return el.querySelectorAll(selector);\n\
};\n\
\n\
exports.engine = function(obj){\n\
  if (!obj.one) throw new Error('.one callback required');\n\
  if (!obj.all) throw new Error('.all callback required');\n\
  one = obj.one;\n\
  exports.all = obj.all;\n\
};\n\
//@ sourceURL=component-query/index.js"
));
require.register("component-event/index.js", Function("exports, require, module",
"var bind = window.addEventListener ? 'addEventListener' : 'attachEvent',\n\
    unbind = window.removeEventListener ? 'removeEventListener' : 'detachEvent',\n\
    prefix = bind !== 'addEventListener' ? 'on' : '';\n\
\n\
/**\n\
 * Bind `el` event `type` to `fn`.\n\
 *\n\
 * @param {Element} el\n\
 * @param {String} type\n\
 * @param {Function} fn\n\
 * @param {Boolean} capture\n\
 * @return {Function}\n\
 * @api public\n\
 */\n\
\n\
exports.bind = function(el, type, fn, capture){\n\
  el[bind](prefix + type, fn, capture || false);\n\
  return fn;\n\
};\n\
\n\
/**\n\
 * Unbind `el` event `type`'s callback `fn`.\n\
 *\n\
 * @param {Element} el\n\
 * @param {String} type\n\
 * @param {Function} fn\n\
 * @param {Boolean} capture\n\
 * @return {Function}\n\
 * @api public\n\
 */\n\
\n\
exports.unbind = function(el, type, fn, capture){\n\
  el[unbind](prefix + type, fn, capture || false);\n\
  return fn;\n\
};//@ sourceURL=component-event/index.js"
));
require.register("component-matches-selector/index.js", Function("exports, require, module",
"/**\n\
 * Module dependencies.\n\
 */\n\
\n\
var query = require('query');\n\
\n\
/**\n\
 * Element prototype.\n\
 */\n\
\n\
var proto = Element.prototype;\n\
\n\
/**\n\
 * Vendor function.\n\
 */\n\
\n\
var vendor = proto.matches\n\
  || proto.webkitMatchesSelector\n\
  || proto.mozMatchesSelector\n\
  || proto.msMatchesSelector\n\
  || proto.oMatchesSelector;\n\
\n\
/**\n\
 * Expose `match()`.\n\
 */\n\
\n\
module.exports = match;\n\
\n\
/**\n\
 * Match `el` to `selector`.\n\
 *\n\
 * @param {Element} el\n\
 * @param {String} selector\n\
 * @return {Boolean}\n\
 * @api public\n\
 */\n\
\n\
function match(el, selector) {\n\
  if (vendor) return vendor.call(el, selector);\n\
  var nodes = query.all(selector, el.parentNode);\n\
  for (var i = 0; i < nodes.length; ++i) {\n\
    if (nodes[i] == el) return true;\n\
  }\n\
  return false;\n\
}\n\
//@ sourceURL=component-matches-selector/index.js"
));
require.register("component-delegate/index.js", Function("exports, require, module",
"\n\
/**\n\
 * Module dependencies.\n\
 */\n\
\n\
var matches = require('matches-selector')\n\
  , event = require('event');\n\
\n\
/**\n\
 * Delegate event `type` to `selector`\n\
 * and invoke `fn(e)`. A callback function\n\
 * is returned which may be passed to `.unbind()`.\n\
 *\n\
 * @param {Element} el\n\
 * @param {String} selector\n\
 * @param {String} type\n\
 * @param {Function} fn\n\
 * @param {Boolean} capture\n\
 * @return {Function}\n\
 * @api public\n\
 */\n\
\n\
exports.bind = function(el, selector, type, fn, capture){\n\
  return event.bind(el, type, function(e){\n\
    if (matches(e.target, selector)) fn(e);\n\
  }, capture);\n\
  return callback;\n\
};\n\
\n\
/**\n\
 * Unbind event `type`'s callback `fn`.\n\
 *\n\
 * @param {Element} el\n\
 * @param {String} type\n\
 * @param {Function} fn\n\
 * @param {Boolean} capture\n\
 * @api public\n\
 */\n\
\n\
exports.unbind = function(el, type, fn, capture){\n\
  event.unbind(el, type, fn, capture);\n\
};\n\
//@ sourceURL=component-delegate/index.js"
));
require.register("component-events/index.js", Function("exports, require, module",
"\n\
/**\n\
 * Module dependencies.\n\
 */\n\
\n\
var events = require('event');\n\
var delegate = require('delegate');\n\
\n\
/**\n\
 * Expose `Events`.\n\
 */\n\
\n\
module.exports = Events;\n\
\n\
/**\n\
 * Initialize an `Events` with the given\n\
 * `el` object which events will be bound to,\n\
 * and the `obj` which will receive method calls.\n\
 *\n\
 * @param {Object} el\n\
 * @param {Object} obj\n\
 * @api public\n\
 */\n\
\n\
function Events(el, obj) {\n\
  if (!(this instanceof Events)) return new Events(el, obj);\n\
  if (!el) throw new Error('element required');\n\
  if (!obj) throw new Error('object required');\n\
  this.el = el;\n\
  this.obj = obj;\n\
  this._events = {};\n\
}\n\
\n\
/**\n\
 * Subscription helper.\n\
 */\n\
\n\
Events.prototype.sub = function(event, method, cb){\n\
  this._events[event] = this._events[event] || {};\n\
  this._events[event][method] = cb;\n\
};\n\
\n\
/**\n\
 * Bind to `event` with optional `method` name.\n\
 * When `method` is undefined it becomes `event`\n\
 * with the \"on\" prefix.\n\
 *\n\
 * Examples:\n\
 *\n\
 *  Direct event handling:\n\
 *\n\
 *    events.bind('click') // implies \"onclick\"\n\
 *    events.bind('click', 'remove')\n\
 *    events.bind('click', 'sort', 'asc')\n\
 *\n\
 *  Delegated event handling:\n\
 *\n\
 *    events.bind('click li > a')\n\
 *    events.bind('click li > a', 'remove')\n\
 *    events.bind('click a.sort-ascending', 'sort', 'asc')\n\
 *    events.bind('click a.sort-descending', 'sort', 'desc')\n\
 *\n\
 * @param {String} event\n\
 * @param {String|function} [method]\n\
 * @return {Function} callback\n\
 * @api public\n\
 */\n\
\n\
Events.prototype.bind = function(event, method){\n\
  var e = parse(event);\n\
  var el = this.el;\n\
  var obj = this.obj;\n\
  var name = e.name;\n\
  var method = method || 'on' + name;\n\
  var args = [].slice.call(arguments, 2);\n\
\n\
  // callback\n\
  function cb(){\n\
    var a = [].slice.call(arguments).concat(args);\n\
    obj[method].apply(obj, a);\n\
  }\n\
\n\
  // bind\n\
  if (e.selector) {\n\
    cb = delegate.bind(el, e.selector, name, cb);\n\
  } else {\n\
    events.bind(el, name, cb);\n\
  }\n\
\n\
  // subscription for unbinding\n\
  this.sub(name, method, cb);\n\
\n\
  return cb;\n\
};\n\
\n\
/**\n\
 * Unbind a single binding, all bindings for `event`,\n\
 * or all bindings within the manager.\n\
 *\n\
 * Examples:\n\
 *\n\
 *  Unbind direct handlers:\n\
 *\n\
 *     events.unbind('click', 'remove')\n\
 *     events.unbind('click')\n\
 *     events.unbind()\n\
 *\n\
 * Unbind delegate handlers:\n\
 *\n\
 *     events.unbind('click', 'remove')\n\
 *     events.unbind('click')\n\
 *     events.unbind()\n\
 *\n\
 * @param {String|Function} [event]\n\
 * @param {String|Function} [method]\n\
 * @api public\n\
 */\n\
\n\
Events.prototype.unbind = function(event, method){\n\
  if (0 == arguments.length) return this.unbindAll();\n\
  if (1 == arguments.length) return this.unbindAllOf(event);\n\
\n\
  // no bindings for this event\n\
  var bindings = this._events[event];\n\
  if (!bindings) return;\n\
\n\
  // no bindings for this method\n\
  var cb = bindings[method];\n\
  if (!cb) return;\n\
\n\
  events.unbind(this.el, event, cb);\n\
};\n\
\n\
/**\n\
 * Unbind all events.\n\
 *\n\
 * @api private\n\
 */\n\
\n\
Events.prototype.unbindAll = function(){\n\
  for (var event in this._events) {\n\
    this.unbindAllOf(event);\n\
  }\n\
};\n\
\n\
/**\n\
 * Unbind all events for `event`.\n\
 *\n\
 * @param {String} event\n\
 * @api private\n\
 */\n\
\n\
Events.prototype.unbindAllOf = function(event){\n\
  var bindings = this._events[event];\n\
  if (!bindings) return;\n\
\n\
  for (var method in bindings) {\n\
    this.unbind(event, method);\n\
  }\n\
};\n\
\n\
/**\n\
 * Parse `event`.\n\
 *\n\
 * @param {String} event\n\
 * @return {Object}\n\
 * @api private\n\
 */\n\
\n\
function parse(event) {\n\
  var parts = event.split(/ +/);\n\
  return {\n\
    name: parts.shift(),\n\
    selector: parts.join(' ')\n\
  }\n\
}\n\
//@ sourceURL=component-events/index.js"
));
require.register("component-domify/index.js", Function("exports, require, module",
"\n\
/**\n\
 * Expose `parse`.\n\
 */\n\
\n\
module.exports = parse;\n\
\n\
/**\n\
 * Wrap map from jquery.\n\
 */\n\
\n\
var map = {\n\
  option: [1, '<select multiple=\"multiple\">', '</select>'],\n\
  optgroup: [1, '<select multiple=\"multiple\">', '</select>'],\n\
  legend: [1, '<fieldset>', '</fieldset>'],\n\
  thead: [1, '<table>', '</table>'],\n\
  tbody: [1, '<table>', '</table>'],\n\
  tfoot: [1, '<table>', '</table>'],\n\
  colgroup: [1, '<table>', '</table>'],\n\
  caption: [1, '<table>', '</table>'],\n\
  tr: [2, '<table><tbody>', '</tbody></table>'],\n\
  td: [3, '<table><tbody><tr>', '</tr></tbody></table>'],\n\
  th: [3, '<table><tbody><tr>', '</tr></tbody></table>'],\n\
  col: [2, '<table><tbody></tbody><colgroup>', '</colgroup></table>'],\n\
  _default: [0, '', '']\n\
};\n\
\n\
/**\n\
 * Parse `html` and return the children.\n\
 *\n\
 * @param {String} html\n\
 * @return {Array}\n\
 * @api private\n\
 */\n\
\n\
function parse(html) {\n\
  if ('string' != typeof html) throw new TypeError('String expected');\n\
\n\
  // tag name\n\
  var m = /<([\\w:]+)/.exec(html);\n\
  if (!m) throw new Error('No elements were generated.');\n\
  var tag = m[1];\n\
\n\
  // body support\n\
  if (tag == 'body') {\n\
    var el = document.createElement('html');\n\
    el.innerHTML = html;\n\
    return el.removeChild(el.lastChild);\n\
  }\n\
\n\
  // wrap map\n\
  var wrap = map[tag] || map._default;\n\
  var depth = wrap[0];\n\
  var prefix = wrap[1];\n\
  var suffix = wrap[2];\n\
  var el = document.createElement('div');\n\
  el.innerHTML = prefix + html + suffix;\n\
  while (depth--) el = el.lastChild;\n\
\n\
  var els = el.children;\n\
  if (1 == els.length) {\n\
    return el.removeChild(els[0]);\n\
  }\n\
\n\
  var fragment = document.createDocumentFragment();\n\
  while (els.length) {\n\
    fragment.appendChild(el.removeChild(els[0]));\n\
  }\n\
\n\
  return fragment;\n\
}\n\
//@ sourceURL=component-domify/index.js"
));
require.register("component-indexof/index.js", Function("exports, require, module",
"module.exports = function(arr, obj){\n\
  if (arr.indexOf) return arr.indexOf(obj);\n\
  for (var i = 0; i < arr.length; ++i) {\n\
    if (arr[i] === obj) return i;\n\
  }\n\
  return -1;\n\
};//@ sourceURL=component-indexof/index.js"
));
require.register("component-classes/index.js", Function("exports, require, module",
"\n\
/**\n\
 * Module dependencies.\n\
 */\n\
\n\
var index = require('indexof');\n\
\n\
/**\n\
 * Whitespace regexp.\n\
 */\n\
\n\
var re = /\\s+/;\n\
\n\
/**\n\
 * toString reference.\n\
 */\n\
\n\
var toString = Object.prototype.toString;\n\
\n\
/**\n\
 * Wrap `el` in a `ClassList`.\n\
 *\n\
 * @param {Element} el\n\
 * @return {ClassList}\n\
 * @api public\n\
 */\n\
\n\
module.exports = function(el){\n\
  return new ClassList(el);\n\
};\n\
\n\
/**\n\
 * Initialize a new ClassList for `el`.\n\
 *\n\
 * @param {Element} el\n\
 * @api private\n\
 */\n\
\n\
function ClassList(el) {\n\
  this.el = el;\n\
  this.list = el.classList;\n\
}\n\
\n\
/**\n\
 * Add class `name` if not already present.\n\
 *\n\
 * @param {String} name\n\
 * @return {ClassList}\n\
 * @api public\n\
 */\n\
\n\
ClassList.prototype.add = function(name){\n\
  // classList\n\
  if (this.list) {\n\
    this.list.add(name);\n\
    return this;\n\
  }\n\
\n\
  // fallback\n\
  var arr = this.array();\n\
  var i = index(arr, name);\n\
  if (!~i) arr.push(name);\n\
  this.el.className = arr.join(' ');\n\
  return this;\n\
};\n\
\n\
/**\n\
 * Remove class `name` when present, or\n\
 * pass a regular expression to remove\n\
 * any which match.\n\
 *\n\
 * @param {String|RegExp} name\n\
 * @return {ClassList}\n\
 * @api public\n\
 */\n\
\n\
ClassList.prototype.remove = function(name){\n\
  if ('[object RegExp]' == toString.call(name)) {\n\
    return this.removeMatching(name);\n\
  }\n\
\n\
  // classList\n\
  if (this.list) {\n\
    this.list.remove(name);\n\
    return this;\n\
  }\n\
\n\
  // fallback\n\
  var arr = this.array();\n\
  var i = index(arr, name);\n\
  if (~i) arr.splice(i, 1);\n\
  this.el.className = arr.join(' ');\n\
  return this;\n\
};\n\
\n\
/**\n\
 * Remove all classes matching `re`.\n\
 *\n\
 * @param {RegExp} re\n\
 * @return {ClassList}\n\
 * @api private\n\
 */\n\
\n\
ClassList.prototype.removeMatching = function(re){\n\
  var arr = this.array();\n\
  for (var i = 0; i < arr.length; i++) {\n\
    if (re.test(arr[i])) {\n\
      this.remove(arr[i]);\n\
    }\n\
  }\n\
  return this;\n\
};\n\
\n\
/**\n\
 * Toggle class `name`.\n\
 *\n\
 * @param {String} name\n\
 * @return {ClassList}\n\
 * @api public\n\
 */\n\
\n\
ClassList.prototype.toggle = function(name){\n\
  // classList\n\
  if (this.list) {\n\
    this.list.toggle(name);\n\
    return this;\n\
  }\n\
\n\
  // fallback\n\
  if (this.has(name)) {\n\
    this.remove(name);\n\
  } else {\n\
    this.add(name);\n\
  }\n\
  return this;\n\
};\n\
\n\
/**\n\
 * Return an array of classes.\n\
 *\n\
 * @return {Array}\n\
 * @api public\n\
 */\n\
\n\
ClassList.prototype.array = function(){\n\
  var str = this.el.className.replace(/^\\s+|\\s+$/g, '');\n\
  var arr = str.split(re);\n\
  if ('' === arr[0]) arr.shift();\n\
  return arr;\n\
};\n\
\n\
/**\n\
 * Check if class `name` is present.\n\
 *\n\
 * @param {String} name\n\
 * @return {ClassList}\n\
 * @api public\n\
 */\n\
\n\
ClassList.prototype.has =\n\
ClassList.prototype.contains = function(name){\n\
  return this.list\n\
    ? this.list.contains(name)\n\
    : !! ~index(this.array(), name);\n\
};\n\
//@ sourceURL=component-classes/index.js"
));
require.register("component-props/index.js", Function("exports, require, module",
"/**\n\
 * Global Names\n\
 */\n\
\n\
var globals = /\\b(Array|Date|Object|Math|JSON)\\b/g;\n\
\n\
/**\n\
 * Return immediate identifiers parsed from `str`.\n\
 *\n\
 * @param {String} str\n\
 * @param {String|Function} map function or prefix\n\
 * @return {Array}\n\
 * @api public\n\
 */\n\
\n\
module.exports = function(str, fn){\n\
  var p = unique(props(str));\n\
  if (fn && 'string' == typeof fn) fn = prefixed(fn);\n\
  if (fn) return map(str, p, fn);\n\
  return p;\n\
};\n\
\n\
/**\n\
 * Return immediate identifiers in `str`.\n\
 *\n\
 * @param {String} str\n\
 * @return {Array}\n\
 * @api private\n\
 */\n\
\n\
function props(str) {\n\
  return str\n\
    .replace(/\\.\\w+|\\w+ *\\(|\"[^\"]*\"|'[^']*'|\\/([^/]+)\\//g, '')\n\
    .replace(globals, '')\n\
    .match(/[a-zA-Z_]\\w*/g)\n\
    || [];\n\
}\n\
\n\
/**\n\
 * Return `str` with `props` mapped with `fn`.\n\
 *\n\
 * @param {String} str\n\
 * @param {Array} props\n\
 * @param {Function} fn\n\
 * @return {String}\n\
 * @api private\n\
 */\n\
\n\
function map(str, props, fn) {\n\
  var re = /\\.\\w+|\\w+ *\\(|\"[^\"]*\"|'[^']*'|\\/([^/]+)\\/|[a-zA-Z_]\\w*/g;\n\
  return str.replace(re, function(_){\n\
    if ('(' == _[_.length - 1]) return fn(_);\n\
    if (!~props.indexOf(_)) return _;\n\
    return fn(_);\n\
  });\n\
}\n\
\n\
/**\n\
 * Return unique array.\n\
 *\n\
 * @param {Array} arr\n\
 * @return {Array}\n\
 * @api private\n\
 */\n\
\n\
function unique(arr) {\n\
  var ret = [];\n\
\n\
  for (var i = 0; i < arr.length; i++) {\n\
    if (~ret.indexOf(arr[i])) continue;\n\
    ret.push(arr[i]);\n\
  }\n\
\n\
  return ret;\n\
}\n\
\n\
/**\n\
 * Map with prefix `str`.\n\
 */\n\
\n\
function prefixed(str) {\n\
  return function(_){\n\
    return str + _;\n\
  };\n\
}\n\
//@ sourceURL=component-props/index.js"
));
require.register("component-to-function/index.js", Function("exports, require, module",
"/**\n\
 * Module Dependencies\n\
 */\n\
\n\
try {\n\
  var expr = require('props');\n\
} catch(e) {\n\
  var expr = require('props-component');\n\
}\n\
\n\
/**\n\
 * Expose `toFunction()`.\n\
 */\n\
\n\
module.exports = toFunction;\n\
\n\
/**\n\
 * Convert `obj` to a `Function`.\n\
 *\n\
 * @param {Mixed} obj\n\
 * @return {Function}\n\
 * @api private\n\
 */\n\
\n\
function toFunction(obj) {\n\
  switch ({}.toString.call(obj)) {\n\
    case '[object Object]':\n\
      return objectToFunction(obj);\n\
    case '[object Function]':\n\
      return obj;\n\
    case '[object String]':\n\
      return stringToFunction(obj);\n\
    case '[object RegExp]':\n\
      return regexpToFunction(obj);\n\
    default:\n\
      return defaultToFunction(obj);\n\
  }\n\
}\n\
\n\
/**\n\
 * Default to strict equality.\n\
 *\n\
 * @param {Mixed} val\n\
 * @return {Function}\n\
 * @api private\n\
 */\n\
\n\
function defaultToFunction(val) {\n\
  return function(obj){\n\
    return val === obj;\n\
  }\n\
}\n\
\n\
/**\n\
 * Convert `re` to a function.\n\
 *\n\
 * @param {RegExp} re\n\
 * @return {Function}\n\
 * @api private\n\
 */\n\
\n\
function regexpToFunction(re) {\n\
  return function(obj){\n\
    return re.test(obj);\n\
  }\n\
}\n\
\n\
/**\n\
 * Convert property `str` to a function.\n\
 *\n\
 * @param {String} str\n\
 * @return {Function}\n\
 * @api private\n\
 */\n\
\n\
function stringToFunction(str) {\n\
  // immediate such as \"> 20\"\n\
  if (/^ *\\W+/.test(str)) return new Function('_', 'return _ ' + str);\n\
\n\
  // properties such as \"name.first\" or \"age > 18\" or \"age > 18 && age < 36\"\n\
  return new Function('_', 'return ' + get(str));\n\
}\n\
\n\
/**\n\
 * Convert `object` to a function.\n\
 *\n\
 * @param {Object} object\n\
 * @return {Function}\n\
 * @api private\n\
 */\n\
\n\
function objectToFunction(obj) {\n\
  var match = {}\n\
  for (var key in obj) {\n\
    match[key] = typeof obj[key] === 'string'\n\
      ? defaultToFunction(obj[key])\n\
      : toFunction(obj[key])\n\
  }\n\
  return function(val){\n\
    if (typeof val !== 'object') return false;\n\
    for (var key in match) {\n\
      if (!(key in val)) return false;\n\
      if (!match[key](val[key])) return false;\n\
    }\n\
    return true;\n\
  }\n\
}\n\
\n\
/**\n\
 * Built the getter function. Supports getter style functions\n\
 *\n\
 * @param {String} str\n\
 * @return {String}\n\
 * @api private\n\
 */\n\
\n\
function get(str) {\n\
  var props = expr(str);\n\
  if (!props.length) return '_.' + str;\n\
\n\
  var val;\n\
  for(var i = 0, prop; prop = props[i]; i++) {\n\
    val = '_.' + prop;\n\
    val = \"('function' == typeof \" + val + \" ? \" + val + \"() : \" + val + \")\";\n\
    str = str.replace(new RegExp(prop, 'g'), val);\n\
  }\n\
\n\
  return str;\n\
}\n\
//@ sourceURL=component-to-function/index.js"
));
require.register("component-type/index.js", Function("exports, require, module",
"/**\n\
 * toString ref.\n\
 */\n\
\n\
var toString = Object.prototype.toString;\n\
\n\
/**\n\
 * Return the type of `val`.\n\
 *\n\
 * @param {Mixed} val\n\
 * @return {String}\n\
 * @api public\n\
 */\n\
\n\
module.exports = function(val){\n\
  switch (toString.call(val)) {\n\
    case '[object Date]': return 'date';\n\
    case '[object RegExp]': return 'regexp';\n\
    case '[object Arguments]': return 'arguments';\n\
    case '[object Array]': return 'array';\n\
    case '[object Error]': return 'error';\n\
  }\n\
\n\
  if (val === null) return 'null';\n\
  if (val === undefined) return 'undefined';\n\
  if (val !== val) return 'nan';\n\
  if (val && val.nodeType === 1) return 'element';\n\
\n\
  return typeof val.valueOf();\n\
};\n\
//@ sourceURL=component-type/index.js"
));
require.register("component-each/index.js", Function("exports, require, module",
"\n\
/**\n\
 * Module dependencies.\n\
 */\n\
\n\
var type = require('type');\n\
var toFunction = require('to-function');\n\
\n\
/**\n\
 * HOP reference.\n\
 */\n\
\n\
var has = Object.prototype.hasOwnProperty;\n\
\n\
/**\n\
 * Iterate the given `obj` and invoke `fn(val, i)`\n\
 * in optional context `ctx`.\n\
 *\n\
 * @param {String|Array|Object} obj\n\
 * @param {Function} fn\n\
 * @param {Object} [ctx]\n\
 * @api public\n\
 */\n\
\n\
module.exports = function(obj, fn, ctx){\n\
  fn = toFunction(fn);\n\
  ctx = ctx || this;\n\
  switch (type(obj)) {\n\
    case 'array':\n\
      return array(obj, fn, ctx);\n\
    case 'object':\n\
      if ('number' == typeof obj.length) return array(obj, fn, ctx);\n\
      return object(obj, fn, ctx);\n\
    case 'string':\n\
      return string(obj, fn, ctx);\n\
  }\n\
};\n\
\n\
/**\n\
 * Iterate string chars.\n\
 *\n\
 * @param {String} obj\n\
 * @param {Function} fn\n\
 * @param {Object} ctx\n\
 * @api private\n\
 */\n\
\n\
function string(obj, fn, ctx) {\n\
  for (var i = 0; i < obj.length; ++i) {\n\
    fn.call(ctx, obj.charAt(i), i);\n\
  }\n\
}\n\
\n\
/**\n\
 * Iterate object keys.\n\
 *\n\
 * @param {Object} obj\n\
 * @param {Function} fn\n\
 * @param {Object} ctx\n\
 * @api private\n\
 */\n\
\n\
function object(obj, fn, ctx) {\n\
  for (var key in obj) {\n\
    if (has.call(obj, key)) {\n\
      fn.call(ctx, key, obj[key]);\n\
    }\n\
  }\n\
}\n\
\n\
/**\n\
 * Iterate array-ish.\n\
 *\n\
 * @param {Array|Object} obj\n\
 * @param {Function} fn\n\
 * @param {Object} ctx\n\
 * @api private\n\
 */\n\
\n\
function array(obj, fn, ctx) {\n\
  for (var i = 0; i < obj.length; ++i) {\n\
    fn.call(ctx, obj[i], i);\n\
  }\n\
}\n\
//@ sourceURL=component-each/index.js"
));
require.register("visionmedia-debug/index.js", Function("exports, require, module",
"if ('undefined' == typeof window) {\n\
  module.exports = require('./lib/debug');\n\
} else {\n\
  module.exports = require('./debug');\n\
}\n\
//@ sourceURL=visionmedia-debug/index.js"
));
require.register("visionmedia-debug/debug.js", Function("exports, require, module",
"\n\
/**\n\
 * Expose `debug()` as the module.\n\
 */\n\
\n\
module.exports = debug;\n\
\n\
/**\n\
 * Create a debugger with the given `name`.\n\
 *\n\
 * @param {String} name\n\
 * @return {Type}\n\
 * @api public\n\
 */\n\
\n\
function debug(name) {\n\
  if (!debug.enabled(name)) return function(){};\n\
\n\
  return function(fmt){\n\
    fmt = coerce(fmt);\n\
\n\
    var curr = new Date;\n\
    var ms = curr - (debug[name] || curr);\n\
    debug[name] = curr;\n\
\n\
    fmt = name\n\
      + ' '\n\
      + fmt\n\
      + ' +' + debug.humanize(ms);\n\
\n\
    // This hackery is required for IE8\n\
    // where `console.log` doesn't have 'apply'\n\
    window.console\n\
      && console.log\n\
      && Function.prototype.apply.call(console.log, console, arguments);\n\
  }\n\
}\n\
\n\
/**\n\
 * The currently active debug mode names.\n\
 */\n\
\n\
debug.names = [];\n\
debug.skips = [];\n\
\n\
/**\n\
 * Enables a debug mode by name. This can include modes\n\
 * separated by a colon and wildcards.\n\
 *\n\
 * @param {String} name\n\
 * @api public\n\
 */\n\
\n\
debug.enable = function(name) {\n\
  try {\n\
    localStorage.debug = name;\n\
  } catch(e){}\n\
\n\
  var split = (name || '').split(/[\\s,]+/)\n\
    , len = split.length;\n\
\n\
  for (var i = 0; i < len; i++) {\n\
    name = split[i].replace('*', '.*?');\n\
    if (name[0] === '-') {\n\
      debug.skips.push(new RegExp('^' + name.substr(1) + '$'));\n\
    }\n\
    else {\n\
      debug.names.push(new RegExp('^' + name + '$'));\n\
    }\n\
  }\n\
};\n\
\n\
/**\n\
 * Disable debug output.\n\
 *\n\
 * @api public\n\
 */\n\
\n\
debug.disable = function(){\n\
  debug.enable('');\n\
};\n\
\n\
/**\n\
 * Humanize the given `ms`.\n\
 *\n\
 * @param {Number} m\n\
 * @return {String}\n\
 * @api private\n\
 */\n\
\n\
debug.humanize = function(ms) {\n\
  var sec = 1000\n\
    , min = 60 * 1000\n\
    , hour = 60 * min;\n\
\n\
  if (ms >= hour) return (ms / hour).toFixed(1) + 'h';\n\
  if (ms >= min) return (ms / min).toFixed(1) + 'm';\n\
  if (ms >= sec) return (ms / sec | 0) + 's';\n\
  return ms + 'ms';\n\
};\n\
\n\
/**\n\
 * Returns true if the given mode name is enabled, false otherwise.\n\
 *\n\
 * @param {String} name\n\
 * @return {Boolean}\n\
 * @api public\n\
 */\n\
\n\
debug.enabled = function(name) {\n\
  for (var i = 0, len = debug.skips.length; i < len; i++) {\n\
    if (debug.skips[i].test(name)) {\n\
      return false;\n\
    }\n\
  }\n\
  for (var i = 0, len = debug.names.length; i < len; i++) {\n\
    if (debug.names[i].test(name)) {\n\
      return true;\n\
    }\n\
  }\n\
  return false;\n\
};\n\
\n\
/**\n\
 * Coerce `val`.\n\
 */\n\
\n\
function coerce(val) {\n\
  if (val instanceof Error) return val.stack || val.message;\n\
  return val;\n\
}\n\
\n\
// persist\n\
\n\
try {\n\
  if (window.localStorage) debug.enable(localStorage.debug);\n\
} catch(e){}\n\
//@ sourceURL=visionmedia-debug/debug.js"
));
require.register("ianstormtaylor-to-no-case/index.js", Function("exports, require, module",
"\n\
/**\n\
 * Expose `toNoCase`.\n\
 */\n\
\n\
module.exports = toNoCase;\n\
\n\
\n\
/**\n\
 * Test whether a string is camel-case.\n\
 */\n\
\n\
var hasSpace = /\\s/;\n\
var hasCamel = /[a-z][A-Z]/;\n\
var hasSeparator = /[\\W_]/;\n\
\n\
\n\
/**\n\
 * Remove any starting case from a `string`, like camel or snake, but keep\n\
 * spaces and punctuation that may be important otherwise.\n\
 *\n\
 * @param {String} string\n\
 * @return {String}\n\
 */\n\
\n\
function toNoCase (string) {\n\
  if (hasSpace.test(string)) return string.toLowerCase();\n\
\n\
  if (hasSeparator.test(string)) string = unseparate(string);\n\
  if (hasCamel.test(string)) string = uncamelize(string);\n\
  return string.toLowerCase();\n\
}\n\
\n\
\n\
/**\n\
 * Separator splitter.\n\
 */\n\
\n\
var separatorSplitter = /[\\W_]+(.|$)/g;\n\
\n\
\n\
/**\n\
 * Un-separate a `string`.\n\
 *\n\
 * @param {String} string\n\
 * @return {String}\n\
 */\n\
\n\
function unseparate (string) {\n\
  return string.replace(separatorSplitter, function (m, next) {\n\
    return next ? ' ' + next : '';\n\
  });\n\
}\n\
\n\
\n\
/**\n\
 * Camelcase splitter.\n\
 */\n\
\n\
var camelSplitter = /(.)([A-Z]+)/g;\n\
\n\
\n\
/**\n\
 * Un-camelcase a `string`.\n\
 *\n\
 * @param {String} string\n\
 * @return {String}\n\
 */\n\
\n\
function uncamelize (string) {\n\
  return string.replace(camelSplitter, function (m, previous, uppers) {\n\
    return previous + ' ' + uppers.toLowerCase().split('').join(' ');\n\
  });\n\
}//@ sourceURL=ianstormtaylor-to-no-case/index.js"
));
require.register("ianstormtaylor-to-space-case/index.js", Function("exports, require, module",
"\n\
var clean = require('to-no-case');\n\
\n\
\n\
/**\n\
 * Expose `toSpaceCase`.\n\
 */\n\
\n\
module.exports = toSpaceCase;\n\
\n\
\n\
/**\n\
 * Convert a `string` to space case.\n\
 *\n\
 * @param {String} string\n\
 * @return {String}\n\
 */\n\
\n\
\n\
function toSpaceCase (string) {\n\
  return clean(string).replace(/[\\W_]+(.|$)/g, function (matches, match) {\n\
    return match ? ' ' + match : '';\n\
  });\n\
}//@ sourceURL=ianstormtaylor-to-space-case/index.js"
));
require.register("ianstormtaylor-to-camel-case/index.js", Function("exports, require, module",
"\n\
var toSpace = require('to-space-case');\n\
\n\
\n\
/**\n\
 * Expose `toCamelCase`.\n\
 */\n\
\n\
module.exports = toCamelCase;\n\
\n\
\n\
/**\n\
 * Convert a `string` to camel case.\n\
 *\n\
 * @param {String} string\n\
 * @return {String}\n\
 */\n\
\n\
\n\
function toCamelCase (string) {\n\
  return toSpace(string).replace(/\\s(\\w)/g, function (matches, letter) {\n\
    return letter.toUpperCase();\n\
  });\n\
}//@ sourceURL=ianstormtaylor-to-camel-case/index.js"
));
require.register("component-within-document/index.js", Function("exports, require, module",
"\n\
/**\n\
 * Check if `el` is within the document.\n\
 *\n\
 * @param {Element} el\n\
 * @return {Boolean}\n\
 * @api private\n\
 */\n\
\n\
module.exports = function(el) {\n\
  var node = el;\n\
  while (node = node.parentNode) {\n\
    if (node == document) return true;\n\
  }\n\
  return false;\n\
};//@ sourceURL=component-within-document/index.js"
));
require.register("component-css/index.js", Function("exports, require, module",
"/**\n\
 * Module Dependencies\n\
 */\n\
\n\
var debug = require('debug')('css');\n\
var set = require('./lib/style');\n\
var get = require('./lib/css');\n\
\n\
/**\n\
 * Expose `css`\n\
 */\n\
\n\
module.exports = css;\n\
\n\
/**\n\
 * Get and set css values\n\
 *\n\
 * @param {Element} el\n\
 * @param {String|Object} prop\n\
 * @param {Mixed} val\n\
 * @return {Element} el\n\
 * @api public\n\
 */\n\
\n\
function css(el, prop, val) {\n\
  if (!el) return;\n\
\n\
  if (undefined !== val) {\n\
    var obj = {};\n\
    obj[prop] = val;\n\
    debug('setting styles %j', obj);\n\
    return setStyles(el, obj);\n\
  }\n\
\n\
  if ('object' == typeof prop) {\n\
    debug('setting styles %j', prop);\n\
    return setStyles(el, prop);\n\
  }\n\
\n\
  debug('getting %s', prop);\n\
  return get(el, prop);\n\
}\n\
\n\
/**\n\
 * Set the styles on an element\n\
 *\n\
 * @param {Element} el\n\
 * @param {Object} props\n\
 * @return {Element} el\n\
 */\n\
\n\
function setStyles(el, props) {\n\
  for (var prop in props) {\n\
    set(el, prop, props[prop]);\n\
  }\n\
\n\
  return el;\n\
}\n\
//@ sourceURL=component-css/index.js"
));
require.register("component-css/lib/css.js", Function("exports, require, module",
"/**\n\
 * Module Dependencies\n\
 */\n\
\n\
var debug = require('debug')('css:css');\n\
var camelcase = require('to-camel-case');\n\
var computed = require('./computed');\n\
var property = require('./prop');\n\
\n\
/**\n\
 * Expose `css`\n\
 */\n\
\n\
module.exports = css;\n\
\n\
/**\n\
 * CSS Normal Transforms\n\
 */\n\
\n\
var cssNormalTransform = {\n\
  letterSpacing: 0,\n\
  fontWeight: 400\n\
};\n\
\n\
/**\n\
 * Get a CSS value\n\
 *\n\
 * @param {Element} el\n\
 * @param {String} prop\n\
 * @param {Mixed} extra\n\
 * @param {Array} styles\n\
 * @return {String}\n\
 */\n\
\n\
function css(el, prop, extra, styles) {\n\
  var hooks = require('./hooks');\n\
  var orig = camelcase(prop);\n\
  var style = el.style;\n\
  var val;\n\
\n\
  prop = property(prop, style);\n\
  var hook = hooks[prop] || hooks[orig];\n\
\n\
  // If a hook was provided get the computed value from there\n\
  if (hook && hook.get) {\n\
    debug('get hook provided. use that');\n\
    val = hook.get(el, true, extra);\n\
  }\n\
\n\
  // Otherwise, if a way to get the computed value exists, use that\n\
  if (undefined == val) {\n\
    debug('fetch the computed value of %s', prop);\n\
    val = computed(el, prop);\n\
  }\n\
\n\
  if ('normal' == val && cssNormalTransform[prop]) {\n\
    val = cssNormalTransform[prop];\n\
    debug('normal => %s', val);\n\
  }\n\
\n\
  // Return, converting to number if forced or a qualifier was provided and val looks numeric\n\
  if ('' == extra || extra) {\n\
    debug('converting value: %s into a number');\n\
    var num = parseFloat(val);\n\
    return true === extra || isNumeric(num) ? num || 0 : val;\n\
  }\n\
\n\
  return val;\n\
}\n\
\n\
/**\n\
 * Is Numeric\n\
 *\n\
 * @param {Mixed} obj\n\
 * @return {Boolean}\n\
 */\n\
\n\
function isNumeric(obj) {\n\
  return !isNan(parseFloat(obj)) && isFinite(obj);\n\
}\n\
//@ sourceURL=component-css/lib/css.js"
));
require.register("component-css/lib/prop.js", Function("exports, require, module",
"/**\n\
 * Module dependencies\n\
 */\n\
\n\
var debug = require('debug')('css:prop');\n\
var camelcase = require('to-camel-case');\n\
var vendor = require('./vendor');\n\
\n\
/**\n\
 * Export `prop`\n\
 */\n\
\n\
module.exports = prop;\n\
\n\
/**\n\
 * Normalize Properties\n\
 */\n\
\n\
var cssProps = {\n\
  'float': 'cssFloat' in document.body.style ? 'cssFloat' : 'styleFloat'\n\
};\n\
\n\
/**\n\
 * Get the vendor prefixed property\n\
 *\n\
 * @param {String} prop\n\
 * @param {String} style\n\
 * @return {String} prop\n\
 * @api private\n\
 */\n\
\n\
function prop(prop, style) {\n\
  prop = cssProps[prop] || (cssProps[prop] = vendor(prop, style));\n\
  debug('transform property: %s => %s');\n\
  return prop;\n\
}\n\
//@ sourceURL=component-css/lib/prop.js"
));
require.register("component-css/lib/swap.js", Function("exports, require, module",
"/**\n\
 * Export `swap`\n\
 */\n\
\n\
module.exports = swap;\n\
\n\
/**\n\
 * Initialize `swap`\n\
 *\n\
 * @param {Element} el\n\
 * @param {Object} options\n\
 * @param {Function} fn\n\
 * @param {Array} args\n\
 * @return {Mixed}\n\
 */\n\
\n\
function swap(el, options, fn, args) {\n\
  // Remember the old values, and insert the new ones\n\
  for (var key in options) {\n\
    old[key] = el.style[key];\n\
    el.style[key] = options[key];\n\
  }\n\
\n\
  ret = fn.apply(el, args || []);\n\
\n\
  // Revert the old values\n\
  for (key in options) {\n\
    el.style[key] = old[key];\n\
  }\n\
\n\
  return ret;\n\
}\n\
//@ sourceURL=component-css/lib/swap.js"
));
require.register("component-css/lib/style.js", Function("exports, require, module",
"/**\n\
 * Module Dependencies\n\
 */\n\
\n\
var debug = require('debug')('css:style');\n\
var camelcase = require('to-camel-case');\n\
var support = require('./support');\n\
var property = require('./prop');\n\
var hooks = require('./hooks');\n\
\n\
/**\n\
 * Expose `style`\n\
 */\n\
\n\
module.exports = style;\n\
\n\
/**\n\
 * Possibly-unitless properties\n\
 *\n\
 * Don't automatically add 'px' to these properties\n\
 */\n\
\n\
var cssNumber = {\n\
  \"columnCount\": true,\n\
  \"fillOpacity\": true,\n\
  \"fontWeight\": true,\n\
  \"lineHeight\": true,\n\
  \"opacity\": true,\n\
  \"order\": true,\n\
  \"orphans\": true,\n\
  \"widows\": true,\n\
  \"zIndex\": true,\n\
  \"zoom\": true\n\
};\n\
\n\
/**\n\
 * Set a css value\n\
 *\n\
 * @param {Element} el\n\
 * @param {String} prop\n\
 * @param {Mixed} val\n\
 * @param {Mixed} extra\n\
 */\n\
\n\
function style(el, prop, val, extra) {\n\
  // Don't set styles on text and comment nodes\n\
  if (!el || el.nodeType === 3 || el.nodeType === 8 || !el.style ) return;\n\
\n\
  var orig = camelcase(prop);\n\
  var style = el.style;\n\
  var type = typeof val;\n\
\n\
  if (!val) return get(el, prop, orig, extra);\n\
\n\
  prop = property(prop, style);\n\
\n\
  var hook = hooks[prop] || hooks[orig];\n\
\n\
  // If a number was passed in, add 'px' to the (except for certain CSS properties)\n\
  if ('number' == type && !cssNumber[orig]) {\n\
    debug('adding \"px\" to end of number');\n\
    val += 'px';\n\
  }\n\
\n\
  // Fixes jQuery #8908, it can be done more correctly by specifying setters in cssHooks,\n\
  // but it would mean to define eight (for every problematic property) identical functions\n\
  if (!support.clearCloneStyle && '' === val && 0 === prop.indexOf('background')) {\n\
    debug('set property (%s) value to \"inherit\"', prop);\n\
    style[prop] = 'inherit';\n\
  }\n\
\n\
  // If a hook was provided, use that value, otherwise just set the specified value\n\
  if (!hook || !hook.set || undefined !== (val = hook.set(el, val, extra))) {\n\
    // Support: Chrome, Safari\n\
    // Setting style to blank string required to delete \"style: x !important;\"\n\
    debug('set hook defined. setting property (%s) to %s', prop, val);\n\
    style[prop] = '';\n\
    style[prop] = val;\n\
  }\n\
\n\
}\n\
\n\
/**\n\
 * Get the style\n\
 *\n\
 * @param {Element} el\n\
 * @param {String} prop\n\
 * @param {String} orig\n\
 * @param {Mixed} extra\n\
 * @return {String}\n\
 */\n\
\n\
function get(el, prop, orig, extra) {\n\
  var style = el.style;\n\
  var hook = hooks[prop] || hooks[orig];\n\
  var ret;\n\
\n\
  if (hook && hook.get && undefined !== (ret = hook.get(el, false, extra))) {\n\
    debug('get hook defined, returning: %s', ret);\n\
    return ret;\n\
  }\n\
\n\
  ret = style[prop];\n\
  debug('getting %s', ret);\n\
  return ret;\n\
}\n\
//@ sourceURL=component-css/lib/style.js"
));
require.register("component-css/lib/hooks.js", Function("exports, require, module",
"/**\n\
 * Module Dependencies\n\
 */\n\
\n\
var each = require('each');\n\
var css = require('./css');\n\
var cssShow = { position: 'absolute', visibility: 'hidden', display: 'block' };\n\
var pnum = (/[+-]?(?:\\d*\\.|)\\d+(?:[eE][+-]?\\d+|)/).source;\n\
var rnumnonpx = new RegExp( '^(' + pnum + ')(?!px)[a-z%]+$', 'i');\n\
var rnumsplit = new RegExp( '^(' + pnum + ')(.*)$', 'i');\n\
var rdisplayswap = /^(none|table(?!-c[ea]).+)/;\n\
var styles = require('./styles');\n\
var support = require('./support');\n\
var swap = require('./swap');\n\
var computed = require('./computed');\n\
var cssExpand = [ \"Top\", \"Right\", \"Bottom\", \"Left\" ];\n\
\n\
/**\n\
 * Height & Width\n\
 */\n\
\n\
each(['width', 'height'], function(name) {\n\
  exports[name] = {};\n\
\n\
  exports[name].get = function(el, compute, extra) {\n\
    if (!compute) return;\n\
    // certain elements can have dimension info if we invisibly show them\n\
    // however, it must have a current display style that would benefit from this\n\
    return 0 == el.offsetWidth && rdisplayswap.test(css(el, 'display'))\n\
      ? swap(el, cssShow, function() { return getWidthOrHeight(el, name, extra); })\n\
      : getWidthOrHeight(el, name, extra);\n\
  }\n\
\n\
  exports[name].set = function(el, val, extra) {\n\
    var styles = extra && styles(el);\n\
    return setPositiveNumber(el, val, extra\n\
      ? augmentWidthOrHeight(el, name, extra, 'border-box' == css(el, 'boxSizing', false, styles), styles)\n\
      : 0\n\
    );\n\
  };\n\
\n\
});\n\
\n\
/**\n\
 * Opacity\n\
 */\n\
\n\
exports.opacity = {};\n\
exports.opacity.get = function(el, compute) {\n\
  if (!compute) return;\n\
  var ret = computed(el, 'opacity');\n\
  return '' == ret ? '1' : ret;\n\
}\n\
\n\
/**\n\
 * Utility: Set Positive Number\n\
 *\n\
 * @param {Element} el\n\
 * @param {Mixed} val\n\
 * @param {Number} subtract\n\
 * @return {Number}\n\
 */\n\
\n\
function setPositiveNumber(el, val, subtract) {\n\
  var matches = rnumsplit.exec(val);\n\
  return matches ?\n\
    // Guard against undefined 'subtract', e.g., when used as in cssHooks\n\
    Math.max(0, matches[1]) + (matches[2] || 'px') :\n\
    val;\n\
}\n\
\n\
/**\n\
 * Utility: Get the width or height\n\
 *\n\
 * @param {Element} el\n\
 * @param {String} prop\n\
 * @param {Mixed} extra\n\
 * @return {String}\n\
 */\n\
\n\
function getWidthOrHeight(el, prop, extra) {\n\
  // Start with offset property, which is equivalent to the border-box value\n\
  var valueIsBorderBox = true;\n\
  var val = prop === 'width' ? el.offsetWidth : el.offsetHeight;\n\
  var styles = computed(el);\n\
  var isBorderBox = support.boxSizing && css(el, 'boxSizing') === 'border-box';\n\
\n\
  // some non-html elements return undefined for offsetWidth, so check for null/undefined\n\
  // svg - https://bugzilla.mozilla.org/show_bug.cgi?id=649285\n\
  // MathML - https://bugzilla.mozilla.org/show_bug.cgi?id=491668\n\
  if (val <= 0 || val == null) {\n\
    // Fall back to computed then uncomputed css if necessary\n\
    val = computed(el, prop, styles);\n\
\n\
    if (val < 0 || val == null) {\n\
      val = el.style[prop];\n\
    }\n\
\n\
    // Computed unit is not pixels. Stop here and return.\n\
    if (rnumnonpx.test(val)) {\n\
      return val;\n\
    }\n\
\n\
    // we need the check for style in case a browser which returns unreliable values\n\
    // for getComputedStyle silently falls back to the reliable el.style\n\
    valueIsBorderBox = isBorderBox && (support.boxSizingReliable() || val === el.style[prop]);\n\
\n\
    // Normalize ', auto, and prepare for extra\n\
    val = parseFloat(val) || 0;\n\
  }\n\
\n\
  // use the active box-sizing model to add/subtract irrelevant styles\n\
  extra = extra || (isBorderBox ? 'border' : 'content');\n\
  val += augmentWidthOrHeight(el, prop, extra, valueIsBorderBox, styles);\n\
  return val + 'px';\n\
}\n\
\n\
/**\n\
 * Utility: Augment the width or the height\n\
 *\n\
 * @param {Element} el\n\
 * @param {String} prop\n\
 * @param {Mixed} extra\n\
 * @param {Boolean} isBorderBox\n\
 * @param {Array} styles\n\
 */\n\
\n\
function augmentWidthOrHeight(el, prop, extra, isBorderBox, styles) {\n\
  // If we already have the right measurement, avoid augmentation,\n\
  // Otherwise initialize for horizontal or vertical properties\n\
  var i = extra === (isBorderBox ? 'border' : 'content') ? 4 : 'width' == prop ? 1 : 0;\n\
  var val = 0;\n\
\n\
  for (; i < 4; i += 2) {\n\
    // both box models exclude margin, so add it if we want it\n\
    if (extra === 'margin') {\n\
      val += css(el, extra + cssExpand[i], true, styles);\n\
    }\n\
\n\
    if (isBorderBox) {\n\
      // border-box includes padding, so remove it if we want content\n\
      if (extra === 'content') {\n\
        val -= css(el, 'padding' + cssExpand[i], true, styles);\n\
      }\n\
\n\
      // at this point, extra isn't border nor margin, so remove border\n\
      if (extra !== 'margin') {\n\
        val -= css(el, 'border' + cssExpand[i] + 'Width', true, styles);\n\
      }\n\
    } else {\n\
      // at this point, extra isn't content, so add padding\n\
      val += css(el, 'padding' + cssExpand[i], true, styles);\n\
\n\
      // at this point, extra isn't content nor padding, so add border\n\
      if (extra !== 'padding') {\n\
        val += css(el, 'border' + cssExpand[i] + 'Width', true, styles);\n\
      }\n\
    }\n\
  }\n\
\n\
  return val;\n\
}\n\
//@ sourceURL=component-css/lib/hooks.js"
));
require.register("component-css/lib/styles.js", Function("exports, require, module",
"/**\n\
 * Expose `styles`\n\
 */\n\
\n\
module.exports = styles;\n\
\n\
/**\n\
 * Get all the styles\n\
 *\n\
 * @param {Element} el\n\
 * @return {Array}\n\
 */\n\
\n\
function styles(el) {\n\
  if (window.getComputedStyle) {\n\
    return el.ownerDocument.defaultView.getComputedStyle(el, null);\n\
  } else {\n\
    return el.currentStyle;\n\
  }\n\
}\n\
//@ sourceURL=component-css/lib/styles.js"
));
require.register("component-css/lib/vendor.js", Function("exports, require, module",
"/**\n\
 * Module Dependencies\n\
 */\n\
\n\
var prefixes = ['Webkit', 'O', 'Moz', 'ms'];\n\
\n\
/**\n\
 * Expose `vendor`\n\
 */\n\
\n\
module.exports = vendor;\n\
\n\
/**\n\
 * Get the vendor prefix for a given property\n\
 *\n\
 * @param {String} prop\n\
 * @param {Object} style\n\
 * @return {String}\n\
 */\n\
\n\
function vendor(prop, style) {\n\
  // shortcut for names that are not vendor prefixed\n\
  if (style[prop]) return prop;\n\
\n\
  // check for vendor prefixed names\n\
  var capName = prop[0].toUpperCase() + prop.slice(1);\n\
  var original = prop;\n\
  var i = prefixes.length;\n\
\n\
  while (i--) {\n\
    prop = prefixes[i] + capName;\n\
    if (prop in style) return prop;\n\
  }\n\
\n\
  return original;\n\
}\n\
//@ sourceURL=component-css/lib/vendor.js"
));
require.register("component-css/lib/support.js", Function("exports, require, module",
"/**\n\
 * Support values\n\
 */\n\
\n\
var reliableMarginRight;\n\
var boxSizingReliableVal;\n\
var pixelPositionVal;\n\
var clearCloneStyle;\n\
\n\
/**\n\
 * Container setup\n\
 */\n\
\n\
var docElem = document.documentElement;\n\
var container = document.createElement('div');\n\
var div = document.createElement('div');\n\
\n\
/**\n\
 * Clear clone style\n\
 */\n\
\n\
div.style.backgroundClip = 'content-box';\n\
div.cloneNode(true).style.backgroundClip = '';\n\
exports.clearCloneStyle = div.style.backgroundClip === 'content-box';\n\
\n\
container.style.cssText = 'border:0;width:0;height:0;position:absolute;top:0;left:-9999px;margin-top:1px';\n\
container.appendChild(div);\n\
\n\
/**\n\
 * Pixel position\n\
 *\n\
 * Webkit bug: https://bugs.webkit.org/show_bug.cgi?id=29084\n\
 * getComputedStyle returns percent when specified for top/left/bottom/right\n\
 * rather than make the css module depend on the offset module, we just check for it here\n\
 */\n\
\n\
exports.pixelPosition = function() {\n\
  if (undefined == pixelPositionVal) computePixelPositionAndBoxSizingReliable();\n\
  return pixelPositionVal;\n\
}\n\
\n\
/**\n\
 * Reliable box sizing\n\
 */\n\
\n\
exports.boxSizingReliable = function() {\n\
  if (undefined == boxSizingReliableVal) computePixelPositionAndBoxSizingReliable();\n\
  return boxSizingReliableVal;\n\
}\n\
\n\
/**\n\
 * Reliable margin right\n\
 *\n\
 * Support: Android 2.3\n\
 * Check if div with explicit width and no margin-right incorrectly\n\
 * gets computed margin-right based on width of container. (#3333)\n\
 * WebKit Bug 13343 - getComputedStyle returns wrong value for margin-right\n\
 * This support function is only executed once so no memoizing is needed.\n\
 *\n\
 * @return {Boolean}\n\
 */\n\
\n\
exports.reliableMarginRight = function() {\n\
  var ret;\n\
  var marginDiv = div.appendChild(document.createElement(\"div\" ));\n\
\n\
  marginDiv.style.cssText = div.style.cssText = divReset;\n\
  marginDiv.style.marginRight = marginDiv.style.width = \"0\";\n\
  div.style.width = \"1px\";\n\
  docElem.appendChild(container);\n\
\n\
  ret = !parseFloat(window.getComputedStyle(marginDiv, null).marginRight);\n\
\n\
  docElem.removeChild(container);\n\
\n\
  // Clean up the div for other support tests.\n\
  div.innerHTML = \"\";\n\
\n\
  return ret;\n\
}\n\
\n\
/**\n\
 * Executing both pixelPosition & boxSizingReliable tests require only one layout\n\
 * so they're executed at the same time to save the second computation.\n\
 */\n\
\n\
function computePixelPositionAndBoxSizingReliable() {\n\
  // Support: Firefox, Android 2.3 (Prefixed box-sizing versions).\n\
  div.style.cssText = \"-webkit-box-sizing:border-box;-moz-box-sizing:border-box;\" +\n\
    \"box-sizing:border-box;padding:1px;border:1px;display:block;width:4px;margin-top:1%;\" +\n\
    \"position:absolute;top:1%\";\n\
  docElem.appendChild(container);\n\
\n\
  var divStyle = window.getComputedStyle(div, null);\n\
  pixelPositionVal = divStyle.top !== \"1%\";\n\
  boxSizingReliableVal = divStyle.width === \"4px\";\n\
\n\
  docElem.removeChild(container);\n\
}\n\
\n\
\n\
//@ sourceURL=component-css/lib/support.js"
));
require.register("component-css/lib/computed.js", Function("exports, require, module",
"/**\n\
 * Module Dependencies\n\
 */\n\
\n\
var debug = require('debug')('css:computed');\n\
var withinDocument = require('within-document');\n\
var styles = require('./styles');\n\
\n\
/**\n\
 * Expose `computed`\n\
 */\n\
\n\
module.exports = computed;\n\
\n\
/**\n\
 * Get the computed style\n\
 *\n\
 * @param {Element} el\n\
 * @param {String} prop\n\
 * @param {Array} precomputed (optional)\n\
 * @return {Array}\n\
 * @api private\n\
 */\n\
\n\
function computed(el, prop, precomputed) {\n\
  var computed = precomputed || styles(el);\n\
  var ret;\n\
  \n\
  if (!computed) return;\n\
\n\
  if (computed.getPropertyValue) {\n\
    ret = computed.getPropertyValue(prop) || computed[prop];\n\
  } else {\n\
    ret = computed[prop];\n\
  }\n\
\n\
  if ('' === ret && !withinDocument(el)) {\n\
    debug('element not within document, try finding from style attribute');\n\
    var style = require('./style');\n\
    ret = style(el, prop);\n\
  }\n\
\n\
  debug('computed value of %s: %s', prop, ret);\n\
\n\
  // Support: IE\n\
  // IE returns zIndex value as an integer.\n\
  return undefined === ret ? ret : ret + '';\n\
}\n\
//@ sourceURL=component-css/lib/computed.js"
));
require.register("enyo-domready/index.js", Function("exports, require, module",
"/*!\n\
 * Copyright (c) 2012 Matias Meno <m@tias.me>\n\
 * \n\
 * Original code (c) by Dustin Diaz 2012 - License MIT\n\
 */\n\
\n\
\n\
/**\n\
 * Expose `domready`.\n\
 */\n\
\n\
module.exports = domready;\n\
\n\
\n\
/**\n\
 *\n\
 * Cross browser implementation of the domready event\n\
 *\n\
 * @param {Function} ready - the callback to be invoked as soon as the dom is fully loaded.\n\
 * @api public\n\
 */\n\
\n\
function domready(ready) {\n\
 var fns = [], fn, f = false\n\
    , doc = document\n\
    , testEl = doc.documentElement\n\
    , hack = testEl.doScroll\n\
    , domContentLoaded = 'DOMContentLoaded'\n\
    , addEventListener = 'addEventListener'\n\
    , onreadystatechange = 'onreadystatechange'\n\
    , readyState = 'readyState'\n\
    , loaded = /^loade|c/.test(doc[readyState])\n\
\n\
  function flush(f) {\n\
    loaded = 1\n\
    while (f = fns.shift()) f()\n\
  }\n\
\n\
  doc[addEventListener] && doc[addEventListener](domContentLoaded, fn = function () {\n\
    doc.removeEventListener(domContentLoaded, fn, f)\n\
    flush()\n\
  }, f)\n\
\n\
\n\
  hack && doc.attachEvent(onreadystatechange, fn = function () {\n\
    if (/^c/.test(doc[readyState])) {\n\
      doc.detachEvent(onreadystatechange, fn)\n\
      flush()\n\
    }\n\
  })\n\
\n\
  return (ready = hack ?\n\
    function (fn) {\n\
      self != top ?\n\
        loaded ? fn() : fns.push(fn) :\n\
        function () {\n\
          try {\n\
            testEl.doScroll('left')\n\
          } catch (e) {\n\
            return setTimeout(function() { ready(fn) }, 50)\n\
          }\n\
          fn()\n\
        }()\n\
    } :\n\
    function (fn) {\n\
      loaded ? fn() : fns.push(fn)\n\
    })\n\
}//@ sourceURL=enyo-domready/index.js"
));
require.register("component-inherit/index.js", Function("exports, require, module",
"\n\
module.exports = function(a, b){\n\
  var fn = function(){};\n\
  fn.prototype = b.prototype;\n\
  a.prototype = new fn;\n\
  a.prototype.constructor = a;\n\
};//@ sourceURL=component-inherit/index.js"
));
require.register("timoxley-assert/index.js", Function("exports, require, module",
"// http://wiki.commonjs.org/wiki/Unit_Testing/1.0\n\
//\n\
// THIS IS NOT TESTED NOR LIKELY TO WORK OUTSIDE V8!\n\
//\n\
// Originally from narwhal.js (http://narwhaljs.org)\n\
// Copyright (c) 2009 Thomas Robinson <280north.com>\n\
//\n\
// Permission is hereby granted, free of charge, to any person obtaining a copy\n\
// of this software and associated documentation files (the 'Software'), to\n\
// deal in the Software without restriction, including without limitation the\n\
// rights to use, copy, modify, merge, publish, distribute, sublicense, and/or\n\
// sell copies of the Software, and to permit persons to whom the Software is\n\
// furnished to do so, subject to the following conditions:\n\
//\n\
// The above copyright notice and this permission notice shall be included in\n\
// all copies or substantial portions of the Software.\n\
//\n\
// THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR\n\
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,\n\
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE\n\
// AUTHORS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN\n\
// ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION\n\
// WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.\n\
\n\
\n\
// Adapted for browser components by Tim Oxley\n\
// from https://github.com/joyent/node/blob/72bc4dcda4cfa99ed064419e40d104bd1b2e0e25/lib/assert.js\n\
\n\
// UTILITY\n\
var inherit = require('inherit');\n\
var pSlice = Array.prototype.slice;\n\
\n\
// 1. The assert module provides functions that throw\n\
// AssertionError's when particular conditions are not met. The\n\
// assert module must conform to the following interface.\n\
\n\
var assert = module.exports = ok;\n\
\n\
// 2. The AssertionError is defined in assert.\n\
// new assert.AssertionError({ message: message,\n\
//                             actual: actual,\n\
//                             expected: expected })\n\
\n\
assert.AssertionError = function AssertionError(options) {\n\
  this.name = 'AssertionError';\n\
  this.message = options.message;\n\
  this.actual = options.actual;\n\
  this.expected = options.expected;\n\
  this.operator = options.operator;\n\
  var stackStartFunction = options.stackStartFunction || fail;\n\
\n\
  if (Error.captureStackTrace) {\n\
    Error.captureStackTrace(this, stackStartFunction);\n\
  }\n\
};\n\
\n\
// assert.AssertionError instanceof Error\n\
inherit(assert.AssertionError, Error);\n\
\n\
function replacer(key, value) {\n\
  if (value === undefined) {\n\
    return '' + value;\n\
  }\n\
  if (typeof value === 'number' && (isNaN(value) || !isFinite(value))) {\n\
    return value.toString();\n\
  }\n\
  if (typeof value === 'function' || value instanceof RegExp) {\n\
    return value.toString();\n\
  }\n\
  return value;\n\
}\n\
\n\
function truncate(s, n) {\n\
  if (typeof s == 'string') {\n\
    return s.length < n ? s : s.slice(0, n);\n\
  } else {\n\
    return s;\n\
  }\n\
}\n\
\n\
assert.AssertionError.prototype.toString = function() {\n\
  if (this.message) {\n\
    return [this.name + ':', this.message].join(' ');\n\
  } else {\n\
    return [\n\
      this.name + ':',\n\
      truncate(JSON.stringify(this.actual, replacer), 128),\n\
      this.operator,\n\
      truncate(JSON.stringify(this.expected, replacer), 128)\n\
    ].join(' ');\n\
  }\n\
};\n\
\n\
// At present only the three keys mentioned above are used and\n\
// understood by the spec. Implementations or sub modules can pass\n\
// other keys to the AssertionError's constructor - they will be\n\
// ignored.\n\
\n\
// 3. All of the following functions must throw an AssertionError\n\
// when a corresponding condition is not met, with a message that\n\
// may be undefined if not provided.  All assertion methods provide\n\
// both the actual and expected values to the assertion error for\n\
// display purposes.\n\
\n\
function fail(actual, expected, message, operator, stackStartFunction) {\n\
  throw new assert.AssertionError({\n\
    message: message,\n\
    actual: actual,\n\
    expected: expected,\n\
    operator: operator,\n\
    stackStartFunction: stackStartFunction\n\
  });\n\
}\n\
\n\
// EXTENSION! allows for well behaved errors defined elsewhere.\n\
assert.fail = fail;\n\
\n\
// 4. Pure assertion tests whether a value is truthy, as determined\n\
// by !!guard.\n\
// assert.ok(guard, message_opt);\n\
// This statement is equivalent to assert.equal(true, !!guard,\n\
// message_opt);. To test strictly for the value true, use\n\
// assert.strictEqual(true, guard, message_opt);.\n\
\n\
function ok(value, message) {\n\
  if (!!!value) fail(value, true, message, '==', assert.ok);\n\
}\n\
assert.ok = ok;\n\
\n\
// 5. The equality assertion tests shallow, coercive equality with\n\
// ==.\n\
// assert.equal(actual, expected, message_opt);\n\
\n\
assert.equal = function equal(actual, expected, message) {\n\
  if (actual != expected) fail(actual, expected, message, '==', assert.equal);\n\
};\n\
\n\
// 6. The non-equality assertion tests for whether two objects are not equal\n\
// with != assert.notEqual(actual, expected, message_opt);\n\
\n\
assert.notEqual = function notEqual(actual, expected, message) {\n\
  if (actual == expected) {\n\
    fail(actual, expected, message, '!=', assert.notEqual);\n\
  }\n\
};\n\
\n\
// 7. The equivalence assertion tests a deep equality relation.\n\
// assert.deepEqual(actual, expected, message_opt);\n\
\n\
assert.deepEqual = function deepEqual(actual, expected, message) {\n\
  if (!_deepEqual(actual, expected)) {\n\
    fail(actual, expected, message, 'deepEqual', assert.deepEqual);\n\
  }\n\
};\n\
\n\
function _deepEqual(actual, expected) {\n\
  // 7.1. All identical values are equivalent, as determined by ===.\n\
  if (actual === expected) {\n\
    return true;\n\
\n\
  // 7.2. If the expected value is a Date object, the actual value is\n\
  // equivalent if it is also a Date object that refers to the same time.\n\
  } else if (actual instanceof Date && expected instanceof Date) {\n\
    return actual.getTime() === expected.getTime();\n\
\n\
  // 7.3 If the expected value is a RegExp object, the actual value is\n\
  // equivalent if it is also a RegExp object with the same source and\n\
  // properties (`global`, `multiline`, `lastIndex`, `ignoreCase`).\n\
  } else if (actual instanceof RegExp && expected instanceof RegExp) {\n\
    return actual.source === expected.source &&\n\
           actual.global === expected.global &&\n\
           actual.multiline === expected.multiline &&\n\
           actual.lastIndex === expected.lastIndex &&\n\
           actual.ignoreCase === expected.ignoreCase;\n\
\n\
  // 7.4. Other pairs that do not both pass typeof value == 'object',\n\
  // equivalence is determined by ==.\n\
  } else if (typeof actual != 'object' && typeof expected != 'object') {\n\
    return actual == expected;\n\
\n\
  // 7.5 For all other Object pairs, including Array objects, equivalence is\n\
  // determined by having the same number of owned properties (as verified\n\
  // with Object.prototype.hasOwnProperty.call), the same set of keys\n\
  // (although not necessarily the same order), equivalent values for every\n\
  // corresponding key, and an identical 'prototype' property. Note: this\n\
  // accounts for both named and indexed properties on Arrays.\n\
  } else {\n\
    return objEquiv(actual, expected);\n\
  }\n\
}\n\
\n\
function isUndefinedOrNull(value) {\n\
  return value === null || value === undefined;\n\
}\n\
\n\
function isArguments(object) {\n\
  return Object.prototype.toString.call(object) == '[object Arguments]';\n\
}\n\
\n\
function objEquiv(a, b) {\n\
  if (isUndefinedOrNull(a) || isUndefinedOrNull(b))\n\
    return false;\n\
  // an identical 'prototype' property.\n\
  if (a.prototype !== b.prototype) return false;\n\
  //~~~I've managed to break Object.keys through screwy arguments passing.\n\
  //   Converting to array solves the problem.\n\
  if (isArguments(a)) {\n\
    if (!isArguments(b)) {\n\
      return false;\n\
    }\n\
    a = pSlice.call(a);\n\
    b = pSlice.call(b);\n\
    return _deepEqual(a, b);\n\
  }\n\
  try {\n\
    var ka = Object.keys(a),\n\
        kb = Object.keys(b),\n\
        key, i;\n\
  } catch (e) {//happens when one is a string literal and the other isn't\n\
    return false;\n\
  }\n\
  // having the same number of owned properties (keys incorporates\n\
  // hasOwnProperty)\n\
  if (ka.length != kb.length)\n\
    return false;\n\
  //the same set of keys (although not necessarily the same order),\n\
  ka.sort();\n\
  kb.sort();\n\
  //~~~cheap key test\n\
  for (i = ka.length - 1; i >= 0; i--) {\n\
    if (ka[i] != kb[i])\n\
      return false;\n\
  }\n\
  //equivalent values for every corresponding key, and\n\
  //~~~possibly expensive deep test\n\
  for (i = ka.length - 1; i >= 0; i--) {\n\
    key = ka[i];\n\
    if (!_deepEqual(a[key], b[key])) return false;\n\
  }\n\
  return true;\n\
}\n\
\n\
// 8. The non-equivalence assertion tests for any deep inequality.\n\
// assert.notDeepEqual(actual, expected, message_opt);\n\
\n\
assert.notDeepEqual = function notDeepEqual(actual, expected, message) {\n\
  if (_deepEqual(actual, expected)) {\n\
    fail(actual, expected, message, 'notDeepEqual', assert.notDeepEqual);\n\
  }\n\
};\n\
\n\
// 9. The strict equality assertion tests strict equality, as determined by ===.\n\
// assert.strictEqual(actual, expected, message_opt);\n\
\n\
assert.strictEqual = function strictEqual(actual, expected, message) {\n\
  if (actual !== expected) {\n\
    fail(actual, expected, message, '===', assert.strictEqual);\n\
  }\n\
};\n\
\n\
// 10. The strict non-equality assertion tests for strict inequality, as\n\
// determined by !==.  assert.notStrictEqual(actual, expected, message_opt);\n\
\n\
assert.notStrictEqual = function notStrictEqual(actual, expected, message) {\n\
  if (actual === expected) {\n\
    fail(actual, expected, message, '!==', assert.notStrictEqual);\n\
  }\n\
};\n\
\n\
function expectedException(actual, expected) {\n\
  if (!actual || !expected) {\n\
    return false;\n\
  }\n\
\n\
  if (expected instanceof RegExp) {\n\
    return expected.test(actual);\n\
  } else if (actual instanceof expected) {\n\
    return true;\n\
  } else if (expected.call({}, actual) === true) {\n\
    return true;\n\
  }\n\
\n\
  return false;\n\
}\n\
\n\
function _throws(shouldThrow, block, expected, message) {\n\
  var actual;\n\
\n\
  if (typeof expected === 'string') {\n\
    message = expected;\n\
    expected = null;\n\
  }\n\
\n\
  try {\n\
    block();\n\
  } catch (e) {\n\
    actual = e;\n\
  }\n\
\n\
  message = (expected && expected.name ? ' (' + expected.name + ').' : '.') +\n\
            (message ? ' ' + message : '.');\n\
\n\
  if (shouldThrow && !actual) {\n\
    fail(actual, expected, 'Missing expected exception' + message);\n\
  }\n\
\n\
  if (!shouldThrow && expectedException(actual, expected)) {\n\
    fail(actual, expected, 'Got unwanted exception' + message);\n\
  }\n\
\n\
  if ((shouldThrow && actual && expected &&\n\
      !expectedException(actual, expected)) || (!shouldThrow && actual)) {\n\
    throw actual;\n\
  }\n\
}\n\
\n\
// 11. Expected to throw an error:\n\
// assert.throws(block, Error_opt, message_opt);\n\
\n\
assert.throws = function(block, /*optional*/error, /*optional*/message) {\n\
  _throws.apply(this, [true].concat(pSlice.call(arguments)));\n\
};\n\
\n\
// EXTENSION! This is annoying to write outside this module.\n\
assert.doesNotThrow = function(block, /*optional*/message) {\n\
  _throws.apply(this, [false].concat(pSlice.call(arguments)));\n\
};\n\
\n\
assert.ifError = function(err) { if (err) {throw err;}};\n\
//@ sourceURL=timoxley-assert/index.js"
));
require.register("timoxley-dom-support/index.js", Function("exports, require, module",
"var domready = require('domready')()\n\
\n\
module.exports = (function() {\n\
\n\
\tvar support,\n\
\t\tall,\n\
\t\ta,\n\
\t\tselect,\n\
\t\topt,\n\
\t\tinput,\n\
\t\tfragment,\n\
\t\teventName,\n\
\t\ti,\n\
\t\tisSupported,\n\
\t\tclickFn,\n\
\t\tdiv = document.createElement(\"div\");\n\
\n\
\t// Setup\n\
\tdiv.setAttribute( \"className\", \"t\" );\n\
\tdiv.innerHTML = \"  <link/><table></table><a href='/a'>a</a><input type='checkbox'/>\";\n\
\n\
\t// Support tests won't run in some limited or non-browser environments\n\
\tall = div.getElementsByTagName(\"*\");\n\
\ta = div.getElementsByTagName(\"a\")[ 0 ];\n\
\tif ( !all || !a || !all.length ) {\n\
\t\treturn {};\n\
\t}\n\
\n\
\t// First batch of tests\n\
\tselect = document.createElement(\"select\");\n\
\topt = select.appendChild( document.createElement(\"option\") );\n\
\tinput = div.getElementsByTagName(\"input\")[ 0 ];\n\
\n\
\ta.style.cssText = \"top:1px;float:left;opacity:.5\";\n\
\tsupport = {\n\
\t\t// IE strips leading whitespace when .innerHTML is used\n\
\t\tleadingWhitespace: ( div.firstChild.nodeType === 3 ),\n\
\n\
\t\t// Make sure that tbody elements aren't automatically inserted\n\
\t\t// IE will insert them into empty tables\n\
\t\ttbody: !div.getElementsByTagName(\"tbody\").length,\n\
\n\
\t\t// Make sure that link elements get serialized correctly by innerHTML\n\
\t\t// This requires a wrapper element in IE\n\
\t\thtmlSerialize: !!div.getElementsByTagName(\"link\").length,\n\
\n\
\t\t// Get the style information from getAttribute\n\
\t\t// (IE uses .cssText instead)\n\
\t\tstyle: /top/.test( a.getAttribute(\"style\") ),\n\
\n\
\t\t// Make sure that URLs aren't manipulated\n\
\t\t// (IE normalizes it by default)\n\
\t\threfNormalized: ( a.getAttribute(\"href\") === \"/a\" ),\n\
\n\
\t\t// Make sure that element opacity exists\n\
\t\t// (IE uses filter instead)\n\
\t\t// Use a regex to work around a WebKit issue. See #5145\n\
\t\topacity: /^0.5/.test( a.style.opacity ),\n\
\n\
\t\t// Verify style float existence\n\
\t\t// (IE uses styleFloat instead of cssFloat)\n\
\t\tcssFloat: !!a.style.cssFloat,\n\
\n\
\t\t// Make sure that if no value is specified for a checkbox\n\
\t\t// that it defaults to \"on\".\n\
\t\t// (WebKit defaults to \"\" instead)\n\
\t\tcheckOn: ( input.value === \"on\" ),\n\
\n\
\t\t// Make sure that a selected-by-default option has a working selected property.\n\
\t\t// (WebKit defaults to false instead of true, IE too, if it's in an optgroup)\n\
\t\toptSelected: opt.selected,\n\
\n\
\t\t// Test setAttribute on camelCase class. If it works, we need attrFixes when doing get/setAttribute (ie6/7)\n\
\t\tgetSetAttribute: div.className !== \"t\",\n\
\n\
\t\t// Tests for enctype support on a form (#6743)\n\
\t\tenctype: !!document.createElement(\"form\").enctype,\n\
\n\
\t\t// Makes sure cloning an html5 element does not cause problems\n\
\t\t// Where outerHTML is undefined, this still works\n\
\t\thtml5Clone: document.createElement(\"nav\").cloneNode( true ).outerHTML !== \"<:nav></:nav>\",\n\
\n\
\t\t// jQuery.support.boxModel DEPRECATED in 1.8 since we don't support Quirks Mode\n\
\t\tboxModel: ( document.compatMode === \"CSS1Compat\" ),\n\
\n\
\t\t// Will be defined later\n\
\t\tsubmitBubbles: true,\n\
\t\tchangeBubbles: true,\n\
\t\tfocusinBubbles: false,\n\
\t\tdeleteExpando: true,\n\
\t\tnoCloneEvent: true,\n\
\t\tinlineBlockNeedsLayout: false,\n\
\t\tshrinkWrapBlocks: false,\n\
\t\treliableMarginRight: true,\n\
\t\tboxSizingReliable: true,\n\
\t\tpixelPosition: false\n\
\t};\n\
\n\
\t// Make sure checked status is properly cloned\n\
\tinput.checked = true;\n\
\tsupport.noCloneChecked = input.cloneNode( true ).checked;\n\
\n\
\t// Make sure that the options inside disabled selects aren't marked as disabled\n\
\t// (WebKit marks them as disabled)\n\
\tselect.disabled = true;\n\
\tsupport.optDisabled = !opt.disabled;\n\
\n\
\t// Test to see if it's possible to delete an expando from an element\n\
\t// Fails in Internet Explorer\n\
\ttry {\n\
\t\tdelete div.test;\n\
\t} catch( e ) {\n\
\t\tsupport.deleteExpando = false;\n\
\t}\n\
\n\
\tif ( !div.addEventListener && div.attachEvent && div.fireEvent ) {\n\
\t\tdiv.attachEvent( \"onclick\", clickFn = function() {\n\
\t\t\t// Cloning a node shouldn't copy over any\n\
\t\t\t// bound event handlers (IE does this)\n\
\t\t\tsupport.noCloneEvent = false;\n\
\t\t});\n\
\t\tdiv.cloneNode( true ).fireEvent(\"onclick\");\n\
\t\tdiv.detachEvent( \"onclick\", clickFn );\n\
\t}\n\
\n\
\t// Check if a radio maintains its value\n\
\t// after being appended to the DOM\n\
\tinput = document.createElement(\"input\");\n\
\tinput.value = \"t\";\n\
\tinput.setAttribute( \"type\", \"radio\" );\n\
\tsupport.radioValue = input.value === \"t\";\n\
\n\
\tinput.setAttribute( \"checked\", \"checked\" );\n\
\n\
\t// #11217 - WebKit loses check when the name is after the checked attribute\n\
\tinput.setAttribute( \"name\", \"t\" );\n\
\n\
\tdiv.appendChild( input );\n\
\tfragment = document.createDocumentFragment();\n\
\tfragment.appendChild( div.lastChild );\n\
\n\
\t// WebKit doesn't clone checked state correctly in fragments\n\
\tsupport.checkClone = fragment.cloneNode( true ).cloneNode( true ).lastChild.checked;\n\
\n\
\t// Check if a disconnected checkbox will retain its checked\n\
\t// value of true after appended to the DOM (IE6/7)\n\
\tsupport.appendChecked = input.checked;\n\
\n\
\tfragment.removeChild( input );\n\
\tfragment.appendChild( div );\n\
\n\
\t// Technique from Juriy Zaytsev\n\
\t// http://perfectionkills.com/detecting-event-support-without-browser-sniffing/\n\
\t// We only care about the case where non-standard event systems\n\
\t// are used, namely in IE. Short-circuiting here helps us to\n\
\t// avoid an eval call (in setAttribute) which can cause CSP\n\
\t// to go haywire. See: https://developer.mozilla.org/en/Security/CSP\n\
\tif ( !div.addEventListener ) {\n\
\t\tfor ( i in {\n\
\t\t\tsubmit: true,\n\
\t\t\tchange: true,\n\
\t\t\tfocusin: true\n\
\t\t}) {\n\
\t\t\teventName = \"on\" + i;\n\
\t\t\tisSupported = ( eventName in div );\n\
\t\t\tif ( !isSupported ) {\n\
\t\t\t\tdiv.setAttribute( eventName, \"return;\" );\n\
\t\t\t\tisSupported = ( typeof div[ eventName ] === \"function\" );\n\
\t\t\t}\n\
\t\t\tsupport[ i + \"Bubbles\" ] = isSupported;\n\
\t\t}\n\
\t}\n\
\n\
\t// Run tests that need a body at doc ready\n\
\tdomready(function() {\n\
\t\tvar container, div, tds, marginDiv,\n\
\t\t\tdivReset = \"padding:0;margin:0;border:0;display:block;overflow:hidden;box-sizing:content-box;-moz-box-sizing:content-box;-webkit-box-sizing:content-box;\",\n\
\t\t\tbody = document.getElementsByTagName(\"body\")[0];\n\
\n\
\t\tif ( !body ) {\n\
\t\t\t// Return for frameset docs that don't have a body\n\
\t\t\treturn;\n\
\t\t}\n\
\n\
\t\tcontainer = document.createElement(\"div\");\n\
\t\tcontainer.style.cssText = \"visibility:hidden;border:0;width:0;height:0;position:static;top:0;margin-top:1px\";\n\
\t\tbody.insertBefore( container, body.firstChild );\n\
\n\
\t\t// Construct the test element\n\
\t\tdiv = document.createElement(\"div\");\n\
\t\tcontainer.appendChild( div );\n\
\n\
    //Check if table cells still have offsetWidth/Height when they are set\n\
    //to display:none and there are still other visible table cells in a\n\
    //table row; if so, offsetWidth/Height are not reliable for use when\n\
    //determining if an element has been hidden directly using\n\
    //display:none (it is still safe to use offsets if a parent element is\n\
    //hidden; don safety goggles and see bug #4512 for more information).\n\
    //(only IE 8 fails this test)\n\
\t\tdiv.innerHTML = \"<table><tr><td></td><td>t</td></tr></table>\";\n\
\t\ttds = div.getElementsByTagName(\"td\");\n\
\t\ttds[ 0 ].style.cssText = \"padding:0;margin:0;border:0;display:none\";\n\
\t\tisSupported = ( tds[ 0 ].offsetHeight === 0 );\n\
\n\
\t\ttds[ 0 ].style.display = \"\";\n\
\t\ttds[ 1 ].style.display = \"none\";\n\
\n\
\t\t// Check if empty table cells still have offsetWidth/Height\n\
\t\t// (IE <= 8 fail this test)\n\
\t\tsupport.reliableHiddenOffsets = isSupported && ( tds[ 0 ].offsetHeight === 0 );\n\
\n\
\t\t// Check box-sizing and margin behavior\n\
\t\tdiv.innerHTML = \"\";\n\
\t\tdiv.style.cssText = \"box-sizing:border-box;-moz-box-sizing:border-box;-webkit-box-sizing:border-box;padding:1px;border:1px;display:block;width:4px;margin-top:1%;position:absolute;top:1%;\";\n\
\t\tsupport.boxSizing = ( div.offsetWidth === 4 );\n\
\t\tsupport.doesNotIncludeMarginInBodyOffset = ( body.offsetTop !== 1 );\n\
\n\
\t\t// NOTE: To any future maintainer, we've window.getComputedStyle\n\
\t\t// because jsdom on node.js will break without it.\n\
\t\tif ( window.getComputedStyle ) {\n\
\t\t\tsupport.pixelPosition = ( window.getComputedStyle( div, null ) || {} ).top !== \"1%\";\n\
\t\t\tsupport.boxSizingReliable = ( window.getComputedStyle( div, null ) || { width: \"4px\" } ).width === \"4px\";\n\
\n\
\t\t\t// Check if div with explicit width and no margin-right incorrectly\n\
\t\t\t// gets computed margin-right based on width of container. For more\n\
\t\t\t// info see bug #3333\n\
\t\t\t// Fails in WebKit before Feb 2011 nightlies\n\
\t\t\t// WebKit Bug 13343 - getComputedStyle returns wrong value for margin-right\n\
\t\t\tmarginDiv = document.createElement(\"div\");\n\
\t\t\tmarginDiv.style.cssText = div.style.cssText = divReset;\n\
\t\t\tmarginDiv.style.marginRight = marginDiv.style.width = \"0\";\n\
\t\t\tdiv.style.width = \"1px\";\n\
\t\t\tdiv.appendChild( marginDiv );\n\
\t\t\tsupport.reliableMarginRight =\n\
\t\t\t\t!parseFloat( ( window.getComputedStyle( marginDiv, null ) || {} ).marginRight );\n\
\t\t}\n\
\n\
\t\tif ( typeof div.style.zoom !== \"undefined\" ) {\n\
\t\t\t// Check if natively block-level elements act like inline-block\n\
\t\t\t// elements when setting their display to 'inline' and giving\n\
\t\t\t// them layout\n\
\t\t\t// (IE < 8 does this)\n\
\t\t\tdiv.innerHTML = \"\";\n\
\t\t\tdiv.style.cssText = divReset + \"width:1px;padding:1px;display:inline;zoom:1\";\n\
\t\t\tsupport.inlineBlockNeedsLayout = ( div.offsetWidth === 3 );\n\
\n\
\t\t\t// Check if elements with layout shrink-wrap their children\n\
\t\t\t// (IE 6 does this)\n\
\t\t\tdiv.style.display = \"block\";\n\
\t\t\tdiv.style.overflow = \"visible\";\n\
\t\t\tdiv.innerHTML = \"<div></div>\";\n\
\t\t\tdiv.firstChild.style.width = \"5px\";\n\
\t\t\tsupport.shrinkWrapBlocks = ( div.offsetWidth !== 3 );\n\
\n\
\t\t\tcontainer.style.zoom = 1;\n\
\t\t}\n\
\n\
\t\t// Null elements to avoid leaks in IE\n\
\t\tbody.removeChild( container );\n\
\t\tcontainer = div = tds = marginDiv = null;\n\
\t});\n\
\n\
\t// Null elements to avoid leaks in IE\n\
\tfragment.removeChild( div );\n\
\tall = a = select = opt = input = fragment = div = null;\n\
\n\
\treturn support;\n\
})();\n\
\n\
//@ sourceURL=timoxley-dom-support/index.js"
));
require.register("timoxley-offset/index.js", Function("exports, require, module",
"var support = require('dom-support')\n\
var contains = require('within-document')\n\
\n\
module.exports = function offset(el) {\n\
\tvar box = { top: 0, left: 0 }\n\
  var doc = el && el.ownerDocument\n\
\n\
\tif (!doc) {\n\
    console.warn('no document!')\n\
\t\treturn\n\
\t}\n\
\n\
\t// Make sure it's not a disconnected DOM node\n\
\tif (!contains(el)) {\n\
\t\treturn box\n\
\t}\n\
\n\
  var body = doc.body\n\
\tif (body === el) {\n\
\t\treturn bodyOffset(el)\n\
\t}\n\
\n\
\tvar docEl = doc.documentElement\n\
\n\
\t// If we don't have gBCR, just use 0,0 rather than error\n\
\t// BlackBerry 5, iOS 3 (original iPhone)\n\
\tif ( typeof el.getBoundingClientRect !== \"undefined\" ) {\n\
\t\tbox = el.getBoundingClientRect()\n\
\t}\n\
\n\
\tvar clientTop  = docEl.clientTop  || body.clientTop  || 0\n\
\tvar clientLeft = docEl.clientLeft || body.clientLeft || 0\n\
\tvar scrollTop  = window.pageYOffset || docEl.scrollTop\n\
\tvar scrollLeft = window.pageXOffset || docEl.scrollLeft\n\
\n\
\treturn {\n\
\t\ttop: box.top  + scrollTop  - clientTop,\n\
\t\tleft: box.left + scrollLeft - clientLeft\n\
\t}\n\
}\n\
\n\
function bodyOffset(body) {\n\
\tvar top = body.offsetTop\n\
\tvar left = body.offsetLeft\n\
\n\
\tif (support.doesNotIncludeMarginInBodyOffset) {\n\
\t\ttop  += parseFloat(body.style.marginTop || 0)\n\
\t\tleft += parseFloat(body.style.marginLeft || 0)\n\
\t}\n\
\n\
\treturn {\n\
    top: top,\n\
    left: left\n\
  }\n\
}\n\
//@ sourceURL=timoxley-offset/index.js"
));
require.register("component-tip/index.js", Function("exports, require, module",
"\n\
/**\n\
 * Module dependencies.\n\
 */\n\
\n\
var bind = require('bind');\n\
var Emitter = require('emitter');\n\
var events = require('events');\n\
var query = require('query');\n\
var domify = require('domify');\n\
var classes = require('classes');\n\
var css = require('css');\n\
var html = domify(require('./template'));\n\
var offset = require('offset');\n\
\n\
/**\n\
 * Expose `Tip`.\n\
 */\n\
\n\
module.exports = Tip;\n\
\n\
/**\n\
 * Apply the average use-case of simply\n\
 * showing a tool-tip on `el` hover.\n\
 *\n\
 * Options:\n\
 *\n\
 *  - `delay` hide delay in milliseconds [0]\n\
 *  - `value` defaulting to the element's title attribute\n\
 *\n\
 * @param {Mixed} elem\n\
 * @param {Object|String} options or value\n\
 * @api public\n\
 */\n\
\n\
function tip(elem, options) {\n\
  if ('string' == typeof options) options = { value : options };\n\
  var els = ('string' == typeof elem) ? query.all(elem) : [elem];\n\
  for(var i = 0, el; el = els[i]; i++) {\n\
    var val = options.value || el.getAttribute('title');\n\
    var tip = new Tip(val);\n\
    el.setAttribute('title', '');\n\
    tip.cancelHideOnHover();\n\
    tip.attach(el);\n\
  }\n\
}\n\
\n\
/**\n\
 * Initialize a `Tip` with the given `content`.\n\
 *\n\
 * @param {Mixed} content\n\
 * @api public\n\
 */\n\
\n\
function Tip(content, options) {\n\
  options = options || {};\n\
  if (!(this instanceof Tip)) return tip(content, options);\n\
  Emitter.call(this);\n\
  this.classname = '';\n\
  this.delay = options.delay || 300;\n\
  this.el = html.cloneNode(true);\n\
  this.events = events(this.el, this);\n\
  this.winEvents = events(window, this);\n\
  this.classes = classes(this.el);\n\
  this.inner = query('.tip-inner', this.el);\n\
  this.message(content);\n\
  this.position('top');\n\
  if (Tip.effect) this.effect(Tip.effect);\n\
}\n\
\n\
/**\n\
 * Mixin emitter.\n\
 */\n\
\n\
Emitter(Tip.prototype);\n\
\n\
/**\n\
 * Set tip `content`.\n\
 *\n\
 * @param {String|jQuery|Element} content\n\
 * @return {Tip} self\n\
 * @api public\n\
 */\n\
\n\
Tip.prototype.message = function(content){\n\
  this.inner.innerHTML = content;\n\
  return this;\n\
};\n\
\n\
/**\n\
 * Attach to the given `el` with optional hide `delay`.\n\
 *\n\
 * @param {Element} el\n\
 * @param {Number} delay\n\
 * @return {Tip}\n\
 * @api public\n\
 */\n\
\n\
Tip.prototype.attach = function(el){\n\
  var self = this;\n\
  this.target = el;\n\
  this.handleEvents = events(el, this);\n\
  this.handleEvents.bind('mouseover');\n\
  this.handleEvents.bind('mouseout');\n\
  return this;\n\
};\n\
\n\
/**\n\
 * On mouse over\n\
 *\n\
 * @param {Event} e\n\
 * @return {Tip}\n\
 * @api private\n\
 */\n\
\n\
Tip.prototype.onmouseover = function() {\n\
  this.show(this.target);\n\
  this.cancelHide();\n\
};\n\
\n\
/**\n\
 * On mouse out\n\
 *\n\
 * @param {Event} e\n\
 * @return {Tip}\n\
 * @api private\n\
 */\n\
\n\
Tip.prototype.onmouseout = function() {\n\
  this.hide(this.delay);\n\
};\n\
\n\
/**\n\
 * Cancel hide on hover, hide with the given `delay`.\n\
 *\n\
 * @param {Number} delay\n\
 * @return {Tip}\n\
 * @api public\n\
 */\n\
\n\
Tip.prototype.cancelHideOnHover = function(){\n\
  this.events.bind('mouseover', 'cancelHide');\n\
  this.events.bind('mouseout', 'hide');\n\
  return this;\n\
};\n\
\n\
/**\n\
 * Set the effect to `type`.\n\
 *\n\
 * @param {String} type\n\
 * @return {Tip}\n\
 * @api public\n\
 */\n\
\n\
Tip.prototype.effect = function(type){\n\
  this._effect = type;\n\
  this.classes.add(type);\n\
  return this;\n\
};\n\
\n\
/**\n\
 * Set position:\n\
 *\n\
 *  - `top`\n\
 *  - `top left`\n\
 *  - `top right`\n\
 *  - `bottom`\n\
 *  - `bottom left`\n\
 *  - `bottom right`\n\
 *  - `left`\n\
 *  - `right`\n\
 *\n\
 * @param {String} pos\n\
 * @param {Object} options\n\
 * @return {Tip}\n\
 * @api public\n\
 */\n\
\n\
Tip.prototype.position = function(pos, options){\n\
  options = options || {};\n\
  this._position = pos;\n\
  this._auto = false != options.auto;\n\
  this.replaceClass(pos);\n\
  this.emit('reposition');\n\
  return this;\n\
};\n\
\n\
/**\n\
 * Show the tip attached to `el`.\n\
 *\n\
 * Emits \"show\" (el) event.\n\
 *\n\
 * @param {String|Element|Number} el or x\n\
 * @param {Number} [y]\n\
 * @return {Tip}\n\
 * @api public\n\
 */\n\
\n\
Tip.prototype.show = function(el){\n\
  if ('string' == typeof el) el = query(el);\n\
\n\
  // show it\n\
  this.target = el;\n\
  document.body.appendChild(this.el);\n\
  this.classes.add('tip-' + this._position.replace(/\\s+/g, '-'));\n\
  this.classes.remove('tip-hide');\n\
\n\
  // x,y\n\
  if ('number' == typeof el) {\n\
    var x = arguments[0];\n\
    var y = arguments[1];\n\
    this.emit('show');\n\
    css(this.el, {\n\
      top: y,\n\
      left: x\n\
    });\n\
    return this;\n\
  }\n\
\n\
  // el\n\
  this.reposition();\n\
  this.emit('show', this.target);\n\
\n\
  this.winEvents.bind('resize', 'reposition');\n\
  this.winEvents.bind('scroll', 'reposition');\n\
\n\
  return this;\n\
};\n\
\n\
/**\n\
 * Reposition the tip if necessary.\n\
 *\n\
 * @api private\n\
 */\n\
\n\
Tip.prototype.reposition = function(){\n\
  var pos = this._position;\n\
  var off = this.offset(pos);\n\
  var newpos = this._auto && this.suggested(pos, off);\n\
  if (newpos) off = this.offset(pos = newpos);\n\
  this.replaceClass(pos);\n\
  this.emit('reposition');\n\
  css(this.el, off);\n\
};\n\
\n\
/**\n\
 * Compute the \"suggested\" position favouring `pos`.\n\
 * Returns undefined if no suggestion is made.\n\
 *\n\
 * @param {String} pos\n\
 * @param {Object} offset\n\
 * @return {String}\n\
 * @api private\n\
 */\n\
\n\
Tip.prototype.suggested = function(pos, off){\n\
  var el = this.el;\n\
\n\
  var ew = el.clientWidth;\n\
  var eh = el.clientHeight;\n\
  var top = window.scrollY;\n\
  var left = window.scrollX;\n\
  var w = window.innerWidth;\n\
  var h = window.innerHeight;\n\
\n\
  // too low\n\
  if (off.top + eh > top + h) return 'top';\n\
\n\
  // too high\n\
  if (off.top < top) return 'bottom';\n\
\n\
  // too far to the right\n\
  if (off.left + ew > left + w) return 'left';\n\
\n\
  // too far to the left\n\
  if (off.left < left) return 'right';\n\
};\n\
\n\
/**\n\
 * Replace position class `name`.\n\
 *\n\
 * @param {String} name\n\
 * @api private\n\
 */\n\
\n\
Tip.prototype.replaceClass = function(name){\n\
  name = name.split(' ').join('-');\n\
  var classname = this.classname + ' tip tip-' + name;\n\
  if (this._effect) classname += ' ' + this._effect;\n\
  this.el.setAttribute('class', classname);\n\
};\n\
\n\
/**\n\
 * Compute the offset for `.target`\n\
 * based on the given `pos`.\n\
 *\n\
 * @param {String} pos\n\
 * @return {Object}\n\
 * @api private\n\
 */\n\
\n\
Tip.prototype.offset = function(pos){\n\
  var pad = 15;\n\
  var el = this.el;\n\
  var target = this.target;\n\
\n\
  var ew = el.clientWidth;\n\
  var eh = el.clientHeight;\n\
\n\
  var to = offset(target);\n\
  var tw = target.clientWidth;\n\
  var th = target.clientHeight;\n\
\n\
  switch (pos) {\n\
    case 'top':\n\
      return {\n\
        top: to.top - eh,\n\
        left: to.left + tw / 2 - ew / 2\n\
      }\n\
    case 'bottom':\n\
      return {\n\
        top: to.top + th,\n\
        left: to.left + tw / 2 - ew / 2\n\
      }\n\
    case 'right':\n\
      return {\n\
        top: to.top + th / 2 - eh / 2,\n\
        left: to.left + tw\n\
      }\n\
    case 'left':\n\
      return {\n\
        top: to.top + th / 2 - eh / 2,\n\
        left: to.left - ew\n\
      }\n\
    case 'top left':\n\
      return {\n\
        top: to.top - eh,\n\
        left: to.left + tw / 2 - ew + pad\n\
      }\n\
    case 'top right':\n\
      return {\n\
        top: to.top - eh,\n\
        left: to.left + tw / 2 - pad\n\
      }\n\
    case 'bottom left':\n\
      return {\n\
        top: to.top + th,\n\
        left: to.left + tw / 2 - ew + pad\n\
      }\n\
    case 'bottom right':\n\
      return {\n\
        top: to.top + th,\n\
        left: to.left + tw / 2 - pad\n\
      }\n\
    default:\n\
      throw new Error('invalid position \"' + pos + '\"');\n\
  }\n\
};\n\
\n\
/**\n\
 * Cancel the `.hide()` timeout.\n\
 *\n\
 * @api private\n\
 */\n\
\n\
Tip.prototype.cancelHide = function(){\n\
  clearTimeout(this._hide);\n\
};\n\
\n\
/**\n\
 * Hide the tip with optional `ms` delay.\n\
 *\n\
 * Emits \"hide\" event.\n\
 *\n\
 * @param {Number} ms\n\
 * @return {Tip}\n\
 * @api public\n\
 */\n\
\n\
Tip.prototype.hide = function(ms){\n\
  var self = this;\n\
\n\
  // duration\n\
  if (ms) {\n\
    this._hide = setTimeout(bind(this, this.hide), ms);\n\
    return this;\n\
  }\n\
\n\
  // hide\n\
  this.classes.add('tip-hide');\n\
  if (this._effect) {\n\
    setTimeout(bind(this, this.remove), 300);\n\
  } else {\n\
    self.remove();\n\
  }\n\
\n\
  return this;\n\
};\n\
\n\
/**\n\
 * Hide the tip without potential animation.\n\
 *\n\
 * @return {Tip}\n\
 * @api\n\
 */\n\
\n\
Tip.prototype.remove = function(){\n\
  this.winEvents.unbind('resize', 'reposition');\n\
  this.winEvents.unbind('scroll', 'reposition');\n\
  this.emit('hide');\n\
\n\
  var parent = this.el.parentNode;\n\
  if (parent) parent.removeChild(this.el);\n\
  return this;\n\
};\n\
//@ sourceURL=component-tip/index.js"
));
require.register("component-tip/template.js", Function("exports, require, module",
"module.exports = '<div class=\"tip tip-hide\">\\n\
  <div class=\"tip-arrow\"></div>\\n\
  <div class=\"tip-inner\"></div>\\n\
</div>';//@ sourceURL=component-tip/template.js"
));

require.register("main/client/index.js", Function("exports, require, module",
"\n\
var LoginPage = require('./pages/login')\n\
  , View = require('./view')\n\
  , RouterMixin = require('./router')\n\
\n\
  , Manager = require('person-manager')\n\
\n\
function isIncompleted(todos) {\n\
  return todos.any(function (t) {return !t.completed})\n\
}\n\
\n\
var App = React.createClass({\n\
  displayName: 'App',\n\
  getInitialState: function () {\n\
    return {\n\
      token: null,\n\
      sock: null,\n\
      manager: null,\n\
      userData: {},\n\
    }\n\
  },\n\
  getDefaultProps: function () {\n\
    return {\n\
      checkPath: '/auth/check-login'\n\
    }\n\
  },\n\
  authorized: function (token, data) {\n\
    var sock = io.connect(location.origin)\n\
    sock.emit('authorize', data.personId, token, function () {\n\
      var m = new Manager(sock)\n\
      this.setState({\n\
        manager: m,\n\
        sock: sock,\n\
        userData: data,\n\
        token: token,\n\
      })\n\
      // this.loadPerson(data.personId)\n\
    }.bind(this))\n\
  },\n\
  render: function () {\n\
    if (!this.state.token) {\n\
      return LoginPage({\n\
        checkPath: this.props.checkPath,\n\
        authorized: this.authorized\n\
      })\n\
    }\n\
    return View({\n\
      userData: this.state.userData,\n\
      manager: this.state.manager,\n\
      sock: this.state.sock\n\
    })\n\
  }\n\
})\n\
\n\
module.exports = function (el) {\n\
  React.renderComponent(App(), el)\n\
}\n\
\n\
//@ sourceURL=main/client/index.js"
));
require.register("main/client/view.js", Function("exports, require, module",
"\n\
var Header = require('./components/header')\n\
  , Footer = require('./components/footer')\n\
  , OverviewPage = require('./pages/overview')\n\
  , PersonPage = require('./pages/person')\n\
  , RouterMixin = require('./router')\n\
  , d = React.DOM\n\
\n\
var View = module.exports = React.createClass({\n\
  displayName: 'View',\n\
  mixins: [RouterMixin],\n\
  routes: {\n\
    '': 'overview',\n\
    'person/:pid': 'person',\n\
    ':pid': 'overview'\n\
  },\n\
  getInitialState: function () {\n\
    return {\n\
      numPeople: 0,\n\
      numMorePeople: 0,\n\
      todoPeople: null,\n\
      loadingText: ''\n\
    }\n\
  },\n\
  getDefaultProps: function () {\n\
    return {\n\
      checkPath: '/auth/check-login',\n\
      manager: null\n\
    }\n\
  },\n\
\n\
  componentDidMount: function () {\n\
    if (this.props.sock) {\n\
      for (var name in this.sevents) {\n\
        this.props.sock.on(name, this[this.sevents[name]])\n\
      }\n\
    }\n\
  },\n\
\n\
  componentDidUpdate: function (props, state) {\n\
    var name\n\
    if (this.props.sock !== props.sock) {\n\
      if (props.sock) {\n\
        for (name in this.sevents) {\n\
          props.sock.off(name, this[this.sevents[name]])\n\
        }\n\
      }\n\
      if (this.props.sock) {\n\
        for (name in this.sevents) {\n\
          this.props.sock.on(name, this[this.sevents[name]])\n\
        }\n\
      }\n\
    }\n\
    if (this.state.todoPeople === null || state._route[':pid'] !== this.state._route[':pid']) {\n\
      this.loadPerson(this.currentId())\n\
    }\n\
  },\n\
  currentId: function () {\n\
    return this.state._route[':pid'] || this.props.userData.personId\n\
  },\n\
\n\
  loadPerson: function (id) {\n\
    this.setState({\n\
      todoPeople: [],\n\
      loadingFan: true,\n\
      loadingTodos: true,\n\
      numPeople: 0,\n\
      numMorePeople: 0,\n\
      loadedMore: false\n\
    })\n\
    this.props.manager.load(id, 5, 5)\n\
  },\n\
  loadMoreTodos: function () {\n\
    this.setState({\n\
      todoPeople: [],\n\
      loadingTodos: true,\n\
      numMorePeople: 0,\n\
      loadedMore: true\n\
    })\n\
    this.props.sock.emit('get:todos', this.currentId(), 10)\n\
  },\n\
\n\
  // Socket event handlers\n\
  // Hmm should this be factored out?\n\
  sevents: {\n\
    'person': 'onPerson',\n\
    'person:more': 'onMorePerson',\n\
    'pedigree:done': 'donePedigree',\n\
    'todos:done': 'doneTodos'\n\
  },\n\
  onPerson: function (id, person, num) {\n\
    this.setState({\n\
      numPeople: num\n\
    })\n\
  },\n\
  onMorePerson: function (id, person, num) {\n\
    // console.log(id, person)\n\
    var todos = this.state.todoPeople.slice()\n\
      , add = person.data.todos.some(function (t) {return t && !t.completed})\n\
    if (add) {\n\
      todos.push(id)\n\
    }\n\
    this.setState({\n\
      todoPeople: todos,\n\
      numMorePeople: num\n\
    })\n\
  },\n\
  donePedigree: function (count, time) {\n\
    if (count < this.state.numPeople) {\n\
      count = this.state.numPeople\n\
    }\n\
    this.setState({\n\
      loadingFan: false,\n\
      numPeople: count\n\
    })\n\
  },\n\
  doneTodos: function (count, time) {\n\
    if (count < this.state.numMorePeople) {\n\
      count = this.state.numMorePeople\n\
    }\n\
    this.setState({\n\
      loadingTodos: false,\n\
      numMorePeople: count\n\
    })\n\
  },\n\
\n\
  removeTodoPerson: function (id) {\n\
    var pp = this.state.todoPeople.slice()\n\
    pp.splice(pp.indexOf(id), 1)\n\
    this.setState({todoPeople: pp})\n\
  },\n\
\n\
  overviewPerson: function (pid) {\n\
    this.setRoute('' + pid)\n\
  },\n\
  personHref: function (pid) {\n\
    return this.treeHref(pid)\n\
    // return '#person/' + pid\n\
  },\n\
  treeHref: function (pid) {\n\
    return '#' + pid\n\
  },\n\
\n\
  // display things\n\
\n\
  mainPage: function () {\n\
    var route = this.getRoute()\n\
    if (route.name === 'person') {\n\
      return PersonPage({\n\
        id: route[':pid'],\n\
        // overviewPerson: this.overviewPerson,\n\
        viewPerson: this.viewPerson,\n\
        manager: this.props.manager,\n\
        loadingText: this.setLoadingText\n\
      })\n\
    }\n\
    return OverviewPage({\n\
      pid: route[':pid'] || this.props.userData.personId,\n\
\n\
      // callbacks\n\
      overviewPerson: this.overviewPerson,\n\
      loadMoreTodos: this.loadMoreTodos,\n\
      personHref: this.personHref,\n\
      treeHref: this.treeHref,\n\
      manager: this.props.manager,\n\
      setLoadingText: this.setLoadingText,\n\
      removeTodoPerson: this.removeTodoPerson,\n\
\n\
      // data\n\
      todoPeople: this.state.todoPeople || [],\n\
      loading: {\n\
        more: this.state.loadedMore,\n\
        npeople: this.state.numPeople,\n\
        morepeople: this.state.numMorePeople,\n\
        fan: this.state.loadingFan,\n\
        todos: this.state.loadingTodos\n\
      }\n\
    })\n\
  },\n\
\n\
  loadingText: function () {\n\
    var text = ''\n\
    if (this.state.loadingFan) {\n\
      text += 'Loading Fan: ' + this.state.numPeople + ' '\n\
    }\n\
    /*\n\
    if (this.state.loadingTodos) {\n\
      var got = this.state.todoPeople.length\n\
        , left = (this.state.loadedMore ? 10 : 5) - got\n\
      text += 'Finding Tasks: ' + this.state.numMorePeople + ' searched'\n\
      text += '; Found ' + got + ', looking for ' + left + ' more'\n\
    }\n\
    */\n\
    return text\n\
  },\n\
\n\
  render: function () {\n\
    return d.div(\n\
      { className: 'main-view' },\n\
      Header({\n\
        pid: this.currentId(),\n\
        manager: this.props.manager,\n\
        userData: this.props.userData,\n\
        loadingText: this.loadingText(),\n\
        personHref: this.personHref\n\
      }),\n\
      this.mainPage(),\n\
      Footer()\n\
    )\n\
  }\n\
})\n\
\n\
//@ sourceURL=main/client/view.js"
));
require.register("main/client/router.js", Function("exports, require, module",
"\n\
var Backbone = require('backbone')\n\
  , _ = require('lodash')\n\
\n\
Backbone.$ = $\n\
\n\
function findall(rx, str) {\n\
  var found = []\n\
  str.replace(rx, function (match) {\n\
    found.push(match)\n\
    return ''\n\
  })\n\
  return found\n\
}\n\
\n\
function objDictFromRoute(route, args) {\n\
  var names = findall(/:\\w+/g, route)\n\
    , obj = {}\n\
  for (var i=0; i<names.length; i++) {\n\
    obj[names[i]] = args[i]\n\
  }\n\
  return obj\n\
}\n\
\n\
module.exports = {\n\
  getInitialState: function () {\n\
    return {\n\
      _route: {}\n\
    }\n\
  },\n\
  getRoute: function () {\n\
    return this.state._route\n\
  },\n\
  setRoute: function (dest) {\n\
    if ('string' !== typeof dest) {\n\
      dest = this._findRouteForObj(dest)\n\
    }\n\
    Backbone.history.navigate(dest, {trigger: true})\n\
  },\n\
  setupRoutes: function () {\n\
    var that = this\n\
      , routes = this.routes\n\
    if ('function' === typeof routes) {\n\
      routes = routes()\n\
    }\n\
    Object.keys(routes).forEach(function (route) {\n\
      var rx = Backbone.Router.prototype._routeToRegExp(route)\n\
        , name = routes[route]\n\
      Backbone.history.route(rx, function (fragment) {\n\
        var args = Backbone.Router.prototype._extractParameters(rx, fragment)\n\
          , obj = objDictFromRoute(route, args)\n\
        obj.name = name\n\
        that.setState({\n\
          _route: obj\n\
        })\n\
        Backbone.history.trigger('route', null, name, args)\n\
      })\n\
    })\n\
  },\n\
  componentDidMount: function () {\n\
    this.setupRoutes()\n\
    Backbone.history.start()\n\
  }\n\
}\n\
\n\
//@ sourceURL=main/client/router.js"
));
require.register("main/client/pages/login.js", Function("exports, require, module",
"/** @jsx React.DOM */\n\
\n\
var fsauth = require('fsauth')\n\
\n\
var LoginPage = module.exports = React.createClass({\n\
  displayName: 'LoginPage',\n\
  getDefaultProps: function () {\n\
    return {\n\
      checkPath: '/auth/check-login',\n\
      codePath: '/auth/get-code',\n\
      authorized: function () {}\n\
    }\n\
  },\n\
  getInitialState: function () {\n\
    return {\n\
      status: 'loading',\n\
      auth_url: null,\n\
      error: false,\n\
      data: {},\n\
    }\n\
  },\n\
  componentWillMount: function () {\n\
    this.setState({\n\
      status: 'loading'\n\
    })\n\
    fsauth(this.props.checkPath, this.props.codePath, function (err, token, data) {\n\
      if (err) {\n\
        this.setState({\n\
          status: 'error',\n\
          error: err\n\
        })\n\
        return\n\
      }\n\
      this.setState({\n\
        status: 'done',\n\
        data: data,\n\
        error: err\n\
      })\n\
      this.props.authorized(token, data)\n\
    }.bind(this))\n\
  },\n\
  center: function () {\n\
    if (this.state.status === 'loading') {\n\
      return (\n\
        React.DOM.div( {className:\"login-page__loading\"}, \n\
          \"Loading \", React.DOM.i( {className:\"login-page__loading-indicator\"})\n\
        )\n\
      )\n\
    }\n\
    if (this.state.status === 'error') {\n\
      return (\n\
        React.DOM.div( {className:\"login-page__error\"}, \n\
          React.DOM.h3( {className:\"login-page__error__title\"}, \n\
            \"An error occurred while logging in.\"\n\
          ),\n\
          \"Try \", React.DOM.a( {href:\"/\", className:\"login-page__reload\"}, \"reloading\"), \" the\"+' '+\n\
          \"page or please \", React.DOM.a( {href:\"https://github.com/familyfound/familyfound/issues\"}, \"report this problem\"),\".\"\n\
        )\n\
      )\n\
    }\n\
    if (this.state.status === 'done') {\n\
      return (\n\
        React.DOM.h3( {className:\"login-page__done\"}, \"Successfully logged in!\")\n\
      )\n\
    }\n\
    return (\n\
      React.DOM.iframe( {className:\"login-page__iframe\", src:this.state.auth_url + '&template=mobile'})\n\
    )\n\
  },\n\
  render: function () {\n\
    return (\n\
      React.DOM.div( {className:\"login-page\"}, \n\
        React.DOM.section( {className:\"login-page__left\"}\n\
        ),\n\
        React.DOM.section( {className:\"login-page__middle\"}, \n\
          this.center()\n\
        ),\n\
        React.DOM.section( {className:\"login-page__right\"}\n\
        )\n\
      )\n\
    )\n\
  },\n\
})\n\
//@ sourceURL=main/client/pages/login.js"
));
require.register("main/client/pages/person.js", Function("exports, require, module",
"\n\
var VitalInfo = require('../components/vital-info')\n\
  , ResearchNotes = require('../components/research-notes')\n\
  , ActionButtons = require('../components/action-buttons')\n\
  , Searcher = require('../components/searcher')\n\
  , d = React.DOM\n\
  , searchItems = require('../components/searches').searchItems\n\
\n\
var PersonPage = module.exports = React.createClass({\n\
  displayName: 'PersonPage',\n\
\n\
  getInitialState: function () {\n\
    return {person: null, loading: false}\n\
  },\n\
  componentDidMount: function () {\n\
    this.props.manager.on(this.props.id, this.gotData)\n\
  },\n\
  componentWillUnmount: function () {\n\
    this.props.manager.off(this.props.id, this.gotData)\n\
  },\n\
  componentDidUpdate: function (prevProps) {\n\
    if (prevProps.id !== this.props.id) {\n\
      this.props.manager.off(prevProps.id, this.gotData)\n\
      this.props.manager.on(this.props.id, this.gotData)\n\
    }\n\
  },\n\
  gotData: function (data) {\n\
    this.setState({person: data})\n\
  },\n\
  render: function () {\n\
    var person = (this.state.person && this.state.person.rels) ? this.state.person : false\n\
    return d.div(\n\
      {className: 'person-page'},\n\
      /*\n\
      d.div(\n\
        {className: 'person-page__top'},\n\
        d.div(\n\
          {className: 'person-page__top-left'},\n\
          TodoList({\n\
            pid: this.props.pid,\n\
            manager: this.props.manager\n\
          }),\n\
          ResearchNotes({\n\
            pid: this.props.pid,\n\
            manager: this.props.manager\n\
          })\n\
        ),\n\
        d.div(\n\
          {className: 'person-page__top-right'},\n\
          ActionButtons({\n\
            pid: this.props.pid,\n\
            manager: this.props.manager\n\
          }),\n\
          VitalInfo({\n\
            model: this.state.personDisplay\n\
          })\n\
        )\n\
      ),\n\
      */\n\
      d.a({href: '#'}, 'Home'),\n\
      this.state.loading && 'Loading...',\n\
      person && d.div(\n\
        {className: 'person-page__vitals'},\n\
        person.rels.display.name\n\
      ),\n\
      person && searchItems(person).map(function (item) {\n\
        return Searcher({item: item, key: item.href})\n\
      })\n\
      // d.h3(null, 'family info here')\n\
    )\n\
  }\n\
})\n\
//@ sourceURL=main/client/pages/person.js"
));
require.register("main/client/pages/overview.js", Function("exports, require, module",
"\n\
var FanBox = require('../components/fan-box')\n\
  , HistoryBox = require('../components/history-box')\n\
  , StarBox = require('../components/star-box')\n\
  , TodoPeople = require('../components/todo-people')\n\
  , TodoPerson = require('../components/todo-person')\n\
  , d = React.DOM\n\
\n\
var OverviewPage = module.exports = React.createClass({\n\
  displayName: 'OverviewPage',\n\
  render: function () {\n\
    return d.div(\n\
      { className: 'overview' },\n\
      d.div(\n\
        {className: 'overview__todo'},\n\
        TodoPeople({\n\
          manager: this.props.manager,\n\
          people: this.props.todoPeople,\n\
          overviewPerson: this.props.overviewPerson,\n\
          removePerson: this.props.removeTodoPerson,\n\
          personHref: this.props.personHref,\n\
          treeHref: this.props.treeHref,\n\
          loading: this.props.loading,\n\
          loadMoreTodos: this.props.loadMoreTodos\n\
/*        }),\n\
        ResearchJournal({\n\
          manager: this.props.manager,\n\
*/      })\n\
      ),\n\
      d.div(\n\
        {className: 'overview__others'},\n\
\n\
        FanBox({\n\
          id: this.props.pid,\n\
          manager: this.props.manager,\n\
          loading: this.props.loading,\n\
          overviewPerson: this.props.overviewPerson,\n\
          treeHref: this.props.treeHref,\n\
          viewPerson: this.props.viewPerson\n\
        }),\n\
\n\
        d.div(\n\
          {className: 'overview__lists'},\n\
          StarBox({\n\
            stars: this.props.stars,\n\
            manager: this.props.manager,\n\
            personHref: this.props.personHref,\n\
          }),\n\
\n\
          HistoryBox({\n\
            manager: this.props.manager,\n\
            personHref: this.props.personHref,\n\
          })\n\
        )\n\
      )\n\
    )\n\
  }\n\
})\n\
\n\
//@ sourceURL=main/client/pages/overview.js"
));
require.register("main/client/components/action-buttons.js", Function("exports, require, module",
"\n\
var d = React.DOM\n\
\n\
var ActionButtons = module.exports = React.createClass({\n\
  render: function () {\n\
    return d.div(null, 'Some buttonz')\n\
  }\n\
})\n\
\n\
//@ sourceURL=main/client/components/action-buttons.js"
));
require.register("main/client/components/tip.js", Function("exports, require, module",
"\n\
var todos = require('api').todos\n\
  , relationship = require('./relationship.js')\n\
\n\
module.exports = {\n\
  message: message,\n\
  shortMessage: shortMessage\n\
}\n\
\n\
function todoTitle(data) {\n\
  var tpl = todos.titles[data.type]\n\
    , items = data.data\n\
  if (items && 'undefined' !== typeof items.args) {\n\
    items = items.args\n\
  }\n\
  if (!Array.isArray(items)) {\n\
    items = [items];\n\
  } else {\n\
    items = items.slice()\n\
  }\n\
  return tpl.replace(/\\{\\}/g, function () {\n\
    return items.shift()\n\
  })\n\
}\n\
\n\
function todoLines(todos) {\n\
  var lines = []\n\
    , cls = ''\n\
  for (var i=0; i<todos.length; i++) {\n\
    if (todos[i].completed) continue;\n\
    cls = 'tip__todo' + (todos[i].hard ? ' tip__todo--hard' : '')\n\
    lines.push('<span class=\"' + cls + '\">' + todoTitle(todos[i]) + '</span>')\n\
  }\n\
  return lines\n\
}\n\
\n\
function shortMessage(data) {\n\
  if (!data || !data.rels) return 'loading'\n\
  var display = data.rels.display\n\
    , lines = []\n\
  lines.push('<span class=\"tip__name\">' + (display.name || '[No Name]') + '</span> <em>' + display.lifespan + '</em>')\n\
  if (display.age) {\n\
    lines[0] += ' (' + display.age + ' years)'\n\
  }\n\
  var place = display.birthPlace || display.deathPlace || 'No places recorded'\n\
  lines.push('<span class=\"tip__place\">' + place + '</span>')\n\
  if (data.data && data.data.lineage) {\n\
    lines.push('<span class=\"tip__relationship\">' + relationship.text(display.gender, data.data.lineage.length) + '</span>')\n\
  }\n\
  return lines.join('<br/>')\n\
}\n\
\n\
function message(data) {\n\
  if (!data || !data.rels) return 'loading'\n\
  var display = data.rels.display\n\
    , lines = []\n\
  lines.push('<span class=\"tip__name\">' + (display.name || '[No Name]') + '</span> <em>' + display.lifespan + '</em>')\n\
  if (display.age) {\n\
    lines[0] += ' (' + display.age + ' years)'\n\
  }\n\
  if (data.data && data.data.lineage) {\n\
    lines.push('<span class=\"tip__relationship\">' + relationship.text(display.gender, data.data.lineage.length) + '</span>')\n\
  }\n\
  if (display.birthPlace) {\n\
    lines.push('<strong>Born:</strong> ' + display.birthPlace)\n\
  }\n\
  if (display.deathPlace) {\n\
    lines.push('<strong>Died:</strong> ' + display.deathPlace)\n\
  }\n\
  if (data.more && data.more.sources && data.more.sources.length) {\n\
    lines.push(data.more.sources.length + ' sources attached')\n\
  }\n\
\n\
  lines.push(data.rels.children.length + ' children recorded')\n\
\n\
  if (!data.data || !data.data.todos) {\n\
    lines.push('<span class=\"tip__not-processed\">Not yet processed</span>')\n\
  } else {\n\
    lines.push('<div className=\"tip__sep\"></div>')\n\
    lines = lines.concat(todoLines(data.data.todos))\n\
    /*\n\
    var todos = todosLeft(data.data)\n\
    if (!todos) {\n\
      lines.push('Research complete!')\n\
    } else {\n\
      if (todos.todos) {\n\
        lines.push('Found ' + (todos.todos + todos.hard) + ' things todo')\n\
        if (todos.hard) {\n\
          lines.push(todos.hard + ' things marked as hard')\n\
        }\n\
      } else {\n\
        lines.push('Found ' + todos.hard + ' things to do, all hard')\n\
      }\n\
    }\n\
    */\n\
  }\n\
\n\
  return lines.join('<br/>')\n\
}\n\
\n\
//@ sourceURL=main/client/components/tip.js"
));
require.register("main/client/components/fan-box.js", Function("exports, require, module",
"\n\
var d = React.DOM\n\
  , Fan = require('fan')\n\
  , TodoPerson = require('./todo-person')\n\
  , classes = require('./classes')\n\
  , Tip = require('tip')\n\
  , tipMessage = require('./tip').shortMessage\n\
  , Lineage = require('./lineage.js')\n\
\n\
function mainTitle(node, x, y) {\n\
  if (!node || !node.rels) return false\n\
  return node.rels.display.name\n\
}\n\
\n\
function nodeTitle(node) {\n\
  if (!node || !node.rels) return false\n\
  return node.rels.display.name\n\
}\n\
\n\
function nodeClasses(data) {\n\
  if (!data.rels) return {path: 'not-loaded'};\n\
  var path = []\n\
    , g = []\n\
    , cl\n\
  for (var name in classes.tests) {\n\
    cl = classes.tests[name](data)\n\
    if (cl) path.push(cl)\n\
  }\n\
  return {\n\
    path: path.join(' '),\n\
    g: g.join(' ')\n\
  }\n\
}\n\
\n\
function classOptions(current) {\n\
  var options = classes.options[current.split('-')[1]]\n\
    , children = []\n\
  for (var name in options) {\n\
    children.push(d.li(\n\
      {className: 'fan-key-item'}, \n\
      d.span({className: 'fan-key__color ' + name}),\n\
      d.span({className: 'fan-key__label'}, options[name])\n\
    ))\n\
  }\n\
  return d.ul({className: 'fan-key'}, children)\n\
}\n\
\n\
var showz = {\n\
  'show-completion': 'Completion',\n\
  'show-children': 'Children',\n\
  'show-sources': 'Sources',\n\
  'show-age': 'Lifespan',\n\
  'show-origin': 'Country',\n\
  'show-modified': 'Last Worked On'\n\
}\n\
\n\
function showButtons(showing, show) {\n\
  var buttons = []\n\
  for (var name in showz) {\n\
    buttons.push(d.button({\n\
      className: 'fan__btn btn btn-default' + (showing === name ? ' fan__btn--active':''),\n\
      onClick: show.bind(null, name),\n\
      disabled: showing === name\n\
    }, showz[name]))\n\
  }\n\
  return d.div.apply(d, [{}].concat(buttons))\n\
}\n\
\n\
var FanBox = module.exports = React.createClass({\n\
  displayName: 'FanBox',\n\
  getDefaultProps: function () {\n\
    return {\n\
      sweep: Math.PI*4/3,\n\
      overviewPerson: function () {},\n\
      defaultWidth: 500,\n\
      margin: 20,\n\
      gens: 6,\n\
      padding: 5\n\
    }\n\
  },\n\
  getInitialState: function () {\n\
    return {\n\
      width: this.props.defaultWidth,\n\
      showing: 'show-completion'\n\
    }\n\
  },\n\
  resize: function () {\n\
    var w = this.getDOMNode().clientWidth - this.props.margin * 2\n\
    if (w !== this.state.width) {\n\
      this.setState({width: w})\n\
    }\n\
  },\n\
  componentDidMount: function () {\n\
    this.resize()\n\
    window.addEventListener('resize', this.resize)\n\
  },\n\
  componentWillUnmount: function () {\n\
    window.removeEventListener('resize', this.resize)\n\
  },\n\
  getHeight: function () {\n\
    var r = this.state.width / 2 - this.props.padding\n\
      , iw = r / this.props.gens\n\
      , a = this.props.sweep / 2 - Math.PI / 2\n\
    return r + r * Math.sin(a) + this.props.padding * 2\n\
  },\n\
  setShow: function (what) {\n\
    this.setState({showing: what})\n\
  },\n\
  render: function () {\n\
    var height = this.getHeight()\n\
      , r = this.state.width / 2\n\
      , transform = 'translate(' + this.state.width/2 + ', ' + r + ')'\n\
\n\
    return d.div(\n\
      {className: 'fan-box ' + this.state.showing,},\n\
\n\
      showButtons(this.state.showing, this.setShow),\n\
      classOptions(this.state.showing),\n\
\n\
      d.svg({\n\
        width: this.state.width,\n\
        height: height\n\
      }, Fan({\n\
        attr: 'rels',\n\
\n\
        // statics\n\
        transform: transform,\n\
        tip: tipMessage,\n\
        gens: this.props.gens,\n\
\n\
        // other statics\n\
        options: {\n\
          width: r / this.props.gens,\n\
          doubleWidth: false,\n\
          sweep: this.props.sweep,\n\
          offset: 0,\n\
        },\n\
\n\
        // functions\n\
        getClasses: nodeClasses,\n\
        mainTitle: mainTitle,\n\
        overTitle: nodeTitle,\n\
        \n\
        // event callbacks\n\
        onClick: this.props.overviewPerson,\n\
        onRightClick: this.props.onRightClick,\n\
\n\
        // other stuff\n\
        manager: this.props.manager,\n\
        id: this.props.id,\n\
      })),\n\
\n\
      TodoPerson({\n\
        manager: this.props.manager,\n\
        id: this.props.id,\n\
        showAnyway: true\n\
      }),\n\
\n\
      Lineage({\n\
        id: this.props.id,\n\
        manager: this.props.manager,\n\
        treeHref: this.props.treeHref\n\
      })\n\
    )\n\
  }\n\
})\n\
\n\
//@ sourceURL=main/client/components/fan-box.js"
));
require.register("main/client/components/lineage.js", Function("exports, require, module",
"\n\
var DataBound = require('./data-bound.js')\n\
  , d = React.DOM\n\
  , relationship = require('./relationship.js')\n\
\n\
var Lineage = module.exports = React.createClass({\n\
  displayName: 'Lineage',\n\
  mixins: [DataBound],\n\
  items: function () {\n\
    if (!this.state.data) {\n\
      return d.li({className: 'lineage__loading'}, 'Loading')\n\
    }\n\
    if (!this.state.data.data || !this.state.data.data.lineage) {\n\
      return false\n\
    }\n\
    var line = []\n\
    this.state.data.data.lineage.forEach(function (person, i) {\n\
      line.unshift(d.li(\n\
        {className: 'lineage__person'},\n\
        d.a(\n\
          {href: this.props.treeHref(person.id)},\n\
          d.span({className: 'lineage__person__name'}, person.name),\n\
          d.span({className: 'lineage__person__lifespan'}, person.lifespan),\n\
          // d.span({className: 'lineage__person__gender'}, person.gender),\n\
          d.span({className: 'lineage__person__place'}, person.place),\n\
          d.span({className: 'lineage__person__relation'}, relationship.text(person.gender, i))\n\
        )\n\
      ))\n\
    }.bind(this))\n\
    return line\n\
  },\n\
  render: function () {\n\
    return d.ul(\n\
      {className: 'lineage'},\n\
      this.items()\n\
    )\n\
  }\n\
})\n\
\n\
//@ sourceURL=main/client/components/lineage.js"
));
require.register("main/client/components/droplist.js", Function("exports, require, module",
"\n\
var d = React.DOM\n\
\n\
var Droplist = module.exports = React.createClass({\n\
  displayName: 'DropList',\n\
  getDefaultProps: function () {\n\
    return {\n\
      className: '',\n\
      items: []\n\
    }\n\
  },\n\
  getInitialState: function () {\n\
    return {\n\
      open: false,\n\
      focused: false,\n\
      active: false\n\
    }\n\
  },\n\
  open: function () {\n\
    this.setState({\n\
      open: true\n\
    })\n\
  },\n\
  toggle: function () {\n\
    if (!this.state.open) return this.open()\n\
    this.setState({open: false})\n\
  },\n\
  close: function (e) {\n\
    if (e && e.suppressed) return\n\
    this.setState({open: false})\n\
  },\n\
  onOpen: function () {\n\
    document.addEventListener('mousedown', this.close)\n\
  },\n\
  componentDidUpdate: function () {\n\
    if (this.state.open) {\n\
      this.onOpen()\n\
    } else {\n\
      document.removeEventListener('mousedown', this.close)\n\
    }\n\
  },\n\
  componentDidMount: function () {\n\
    if (this.state.open) {\n\
      this.onOpen()\n\
    } else {\n\
      document.removeEventListener('mousedown', this.close)\n\
    }\n\
  },\n\
  focus: function () {\n\
    this.setState({open: true})\n\
  },\n\
  suppressMouseDown: function (e) {\n\
    if (!this.state.open) return\n\
    e.preventDefault()\n\
    e.stopPropagation()\n\
    e.nativeEvent.stopPropagation()\n\
    e.nativeEvent.suppressed = true\n\
    return false\n\
  },\n\
  render: function () {\n\
    return (\n\
      d.div({\n\
        tabIndex:0,\n\
        className:'droplist ' + this.props.className + (this.state.open ? ' droplist--open' : ''),\n\
        onMouseDown:this.suppressMouseDown\n\
      }, [\n\
        d.div({className:\"droplist__head\", onClick: this.toggle}),\n\
        d.ul({className:\"droplist__list\"},\n\
          this.props.items.map(function (value, i) {\n\
            return (\n\
              d.li({className: 'droplist__item'},\n\
                d.a({href: value.href, target: '_blank', className: 'droplist__link'}, value.title)\n\
              )\n\
            )\n\
          }.bind(this))\n\
        )\n\
      ])\n\
    )\n\
  },\n\
})\n\
\n\
\n\
\n\
//@ sourceURL=main/client/components/droplist.js"
));
require.register("main/client/components/classes.js", Function("exports, require, module",
"\n\
var todos = require('api').todos\n\
\n\
function todosLeft(data) {\n\
  if (data.completed) return 0\n\
  if (!data.todos.length) return 0\n\
  var left = 0\n\
    , hard = 0\n\
    , justCleanup = true\n\
  for (var i=0; i<data.todos.length; i++) {\n\
    if (data.todos[i].completed) continue;\n\
    if (data.todos[i].hard) hard++;\n\
    else left++;\n\
    if (!todos.types[data.todos[i].type].cleanup) {\n\
      justCleanup = false\n\
    }\n\
  }\n\
  if (!left && !hard) return 0\n\
  return {\n\
    left: left,\n\
    justCleanup: justCleanup,\n\
    hard: hard\n\
  }\n\
}\n\
\n\
var placeLists = {\n\
  'o-us': [\n\
    'United States',\n\
    'Alaska',\n\
    'Alabama',\n\
    'Arkansas',\n\
    'American Samoa',\n\
    'Arizona',\n\
    'California',\n\
    'Colorado',\n\
    'Connecticut',\n\
    'District of Columbia',\n\
    'Delaware',\n\
    'Florida',\n\
    'Georgia',\n\
    'Guam',\n\
    'Hawaii',\n\
    'Iowa',\n\
    'Idaho',\n\
    'Illinois',\n\
    'Indiana',\n\
    'Kansas',\n\
    'Kentucky',\n\
    'Louisiana',\n\
    'Massachusetts',\n\
    'Maryland',\n\
    'Maine',\n\
    'Michigan',\n\
    'Minnesota',\n\
    'Missouri',\n\
    'Northern Mariana Islands',\n\
    'Mississippi',\n\
    'Montana',\n\
    'National',\n\
    'North Carolina',\n\
    'North Dakota',\n\
    'Nebraska',\n\
    'New Hampshire',\n\
    'New Jersey',\n\
    'New Mexico',\n\
    'Nevada',\n\
    'New York',\n\
    'Ohio',\n\
    'Oklahoma',\n\
    'Oregon',\n\
    'Pennsylvania',\n\
    'Puerto Rico',\n\
    'Rhode Island',\n\
    'South Carolina',\n\
    'South Dakota',\n\
    'Tennessee',\n\
    'Texas',\n\
    'Utah',\n\
    'Virginia',\n\
    'Virgin Islands',\n\
    'Vermont',\n\
    'Washington',\n\
    'Wisconsin',\n\
    'West Virginia',\n\
    'Wyoming'\n\
  ],\n\
  'o-gb': [\n\
    'Britain',\n\
    'Ireland',\n\
    'Scotland',\n\
    'England'\n\
  ],\n\
  'o-eu': [\n\
    'Albania',\n\
    'Andorra',\n\
    'Armenia',\n\
    'Austria',\n\
    'Azerbaijan',\n\
    'Belarus',\n\
    'Belgium',\n\
    'Bosnia',\n\
    'Herzegovina',\n\
    'Bulgaria',\n\
    'Croatia',\n\
    'Cyprus',\n\
    'Czech Republic',\n\
    'Denmark',\n\
    'Estonia',\n\
    'Finland',\n\
    'France',\n\
    'Georgia',\n\
    'Germany',\n\
    'Greece',\n\
    'Hungary',\n\
    'Iceland',\n\
    'Ireland',\n\
    'Italy',\n\
    'Kosovo',\n\
    'Latvia',\n\
    'Liechtenstein',\n\
    'Lithuania',\n\
    'Luxembourg',\n\
    'Macedonia',\n\
    'Malta',\n\
    'Moldova',\n\
    'Monaco',\n\
    'Montenegro',\n\
    'The Netherlands',\n\
    'Norway',\n\
    'Poland',\n\
    'Portugal',\n\
    'Romania',\n\
    'Russia',\n\
    'San Marino',\n\
    'Serbia',\n\
    'Slovakia',\n\
    'Slovenia',\n\
    'Spain',\n\
    'Sweden',\n\
    'Switzerland',\n\
    'Turkey',\n\
    'Ukraine',\n\
    'United Kingdom',\n\
    'Vatican',\n\
  ]\n\
}\n\
\n\
function originClass(place) {\n\
  place = place.toLowerCase()\n\
  for (var cls in placeLists) {\n\
    for (var i in placeLists[cls]) {\n\
      if (place.indexOf(placeLists[cls][i].toLowerCase()) !== -1) return cls\n\
    }\n\
  }\n\
  return 'o-other'\n\
}\n\
\n\
module.exports = {\n\
  tests: {\n\
    completion: function (data) {\n\
      if (!data.data || !data.data.todos) {\n\
        return 'c-not-evaluated'\n\
      }\n\
      if (data.data.starred) return 'c-starred'\n\
      var todos = todosLeft(data.data)\n\
      if (!todos) {\n\
        return 'c-completed'\n\
      }\n\
      if (!todos.left) {\n\
        return 'c-just-hard'\n\
      }\n\
      if (todos.justCleanup) {\n\
        return 'c-just-cleanup'\n\
      }\n\
      return 'c-has-todos'\n\
    },\n\
    children: function (data) {\n\
      if (data.rels.display.lifespan.match(/Living/)) return 'ch-living'\n\
      var l = data.rels.children.length\n\
      for (var i=1; i<5; i++) {\n\
        if (i*3 > l) return 'ch-' + (i*3)\n\
      }\n\
      return 'ch-lots'\n\
    },\n\
    age: function (data) {\n\
      var display = data.rels.display\n\
      if (display.lifespan.match(/Living/)) return 'a-living'\n\
      if (!display.age) return 'a-unknown'\n\
      if (display.age < 30) return 'a-young'\n\
      if (display.age < 60) return 'a-middle'\n\
      if (display.age < 80) return 'a-old'\n\
      return 'a-ancient'\n\
    },\n\
    sources: function (data) {\n\
      if (data.rels.display.lifespan.match(/Living/)) return 's-living'\n\
      if (!data.more || !data.more.sources) return 's-unknown'\n\
      var n = data.more.sources.length\n\
      if (!n) return 's-none'\n\
      if (n < 3) return 's-few'\n\
      if (n < 6) return 's-some'\n\
      return 's-many'\n\
    },\n\
    modified: function (data) {\n\
      var date = data.data.modified\n\
      if (!date) return 'm-never'\n\
      var diff = new Date().getTime() - new Date(date).getTime()\n\
      if (diff < 24 * 60 * 60 * 1000) {\n\
        return 'm-day'\n\
      }\n\
      if (diff < 7 * 24 * 60 * 60 * 1000) {\n\
        return 'm-week'\n\
      }\n\
      if (diff < 31 * 7 * 24 * 60 * 60 * 1000) {\n\
        return 'm-month'\n\
      }\n\
      return 'm-long'\n\
    },\n\
    origin: function (data) {\n\
      var place = data.rels.display.birthPlace || data.rels.display.deathPlace\n\
      if (!place) return 'o-unknown'\n\
      return originClass(place)\n\
    },\n\
  },\n\
  options: {\n\
    completion: {\n\
      'c-not-evaluated': 'Not Evaluated',\n\
      'c-completed': 'Completed',\n\
      'c-just-hard': 'Just Hard',\n\
      'c-just-cleanup': 'Cleanup',\n\
      'c-has-todos': 'Research',\n\
      'c-starred': 'Starred'\n\
    },\n\
    children: {\n\
      'ch-living': 'Living',\n\
      'ch-3': '<3',\n\
      'ch-6': '<6',\n\
      'ch-9': '<9',\n\
      'ch-12': '<12',\n\
      'ch-lots': 'Lots'\n\
    },\n\
    age: {\n\
      'a-living': 'Living',\n\
      'a-young': '0-29',\n\
      'a-middle': '30-59',\n\
      'a-old': '60-79',\n\
      'a-ancient': '80+',\n\
      'a-unknown': 'Unknown',\n\
    },\n\
    sources: {\n\
      's-living': 'Living',\n\
      's-none': 'None',\n\
      's-few': '< 3',\n\
      's-some': '< 6',\n\
      's-many': '6 +',\n\
      's-unknown': 'Not Evaluated',\n\
    },\n\
    modified: {\n\
      'm-day': 'Today',\n\
      'm-week': 'This week',\n\
      'm-month': 'Less than a month',\n\
      'm-long': 'More than a month',\n\
      'm-never': 'Never'\n\
    },\n\
    origin: {\n\
      'o-us': 'United States',\n\
      // 'o-sa': 'South America',\n\
      'o-gb': 'British Isles',\n\
      'o-eu': 'Europe',\n\
      'o-other': 'Other',\n\
      'o-unknown': 'Unknown'\n\
    }\n\
  }\n\
}\n\
\n\
\n\
//@ sourceURL=main/client/components/classes.js"
));
require.register("main/client/components/relationship.js", Function("exports, require, module",
"\n\
module.exports = {\n\
  calculate: calculate,\n\
  text: relationshipText\n\
}\n\
\n\
function relationshipText(gender, lineage_len) {\n\
  var rel = calculate(gender, lineage_len)\n\
  if (lineage_len) rel = 'Your ' + rel\n\
  return rel\n\
}\n\
\n\
function nth(num) {\n\
  if (num > 3 && num < 21) return 'th'\n\
  return ['th', 'st', 'nd', 'rd'][num % 10]\n\
}\n\
\n\
function calculate(gender, lineage_len) {\n\
  var names = {\n\
    0: {\n\
      Male: \"It's You!\",\n\
      Female: \"It's You!\"\n\
    },\n\
    1: {\n\
      Male: 'Father',\n\
      Female: 'Mother'\n\
    },\n\
    2: {\n\
      Male: 'Grandfather',\n\
      Female: 'Grandmother'\n\
    },\n\
    3: {\n\
      Male: 'Great-Grandfather',\n\
      Female: 'Great-Grandmother'\n\
    }\n\
  }\n\
  if (lineage_len < 4) {\n\
    return names[lineage_len][gender]\n\
  }\n\
  var num = lineage_len - 2\n\
  return num + nth(num) + ' ' + names[3][gender]\n\
}\n\
\n\
//@ sourceURL=main/client/components/relationship.js"
));
require.register("main/client/components/data-bound.js", Function("exports, require, module",
"\n\
module.exports = {\n\
  getInitialState: function () {\n\
    return {\n\
      data: this.props.initialData\n\
    }\n\
  },\n\
  getDefaultProps: function () {\n\
    return {\n\
      id: null,\n\
      manager: null,\n\
      initialData: null\n\
    }\n\
  },\n\
  componentDidMount: function () {\n\
    if (!this.props.manager) return\n\
    this.props.manager.on(this.props.id, this.gotData)\n\
  },\n\
  componentWillUnmount: function () {\n\
    if (!this.props.manager) return\n\
    this.props.manager.off(this.props.id, this.gotData)\n\
  },\n\
  componentWillReceiveProps: function (props) {\n\
    if (props.id === this.props.id) return\n\
    if (!this.props.manager) return\n\
    this.props.manager.off(this.props.id, this.gotData)\n\
    this.props.manager.on(props.id, this.gotData)\n\
  },\n\
  gotData: function (data) {\n\
    this.setState({data: data})\n\
  },\n\
}\n\
\n\
//@ sourceURL=main/client/components/data-bound.js"
));
require.register("main/client/components/searches.js", Function("exports, require, module",
"\n\
module.exports = {\n\
  searchItems: searchItems,\n\
  fsQuery: fsQuery\n\
}\n\
\n\
function getYear(text) {\n\
  return parseInt((text || '').match(/\\d{4}/))\n\
}\n\
\n\
function fsQuery(person) {\n\
  var display = person.rels.display\n\
    , parts = display.name.split(' ')\n\
    , lastName = parts.pop()\n\
    , firstNames = parts.join(' ')\n\
  var query = '+givenname:\"' + firstNames + '\"~+surname:\"' + lastName + '\"~+birth_place:\"' + display.birthPlace + '\"~'\n\
    , birthYear\n\
  if (display.birthDate && (birthYear = getYear(display.birthDate))) {\n\
    query += '+birth_year:' + (birthYear - 2) + '-' + (birthYear + 2) + '~'\n\
  }\n\
  return query\n\
}\n\
\n\
function familySearch(person) {\n\
  var display = person.rels.display\n\
    , parts = display.name.split(' ')\n\
    , lastName = parts.pop()\n\
    , firstNames = parts.join(' ')\n\
  var query = '+givenname:\"' + firstNames + '\"~+surname:\"' + lastName + '\"~+birth_place:\"' + display.birthPlace + '\"~'\n\
    , birthYear\n\
  if (display.birthDate && (birthYear = getYear(display.birthDate))) {\n\
    query += '+birth_year:' + (birthYear - 2) + '-' + (birthYear + 2) + '~'\n\
  }\n\
  return 'https://familysearch.org/search/record/results#count=20&query=' + encodeURIComponent(query)\n\
}\n\
\n\
function familySearchAdv(person) {\n\
\n\
}\n\
\n\
\n\
var states = {\n\
  'AK': 'Alaska',\n\
  'AL': 'Alabama',\n\
  'AR': 'Arkansas',\n\
  'AS': 'American Samoa',\n\
  'AZ': 'Arizona',\n\
  'CA': 'California',\n\
  'CO': 'Colorado',\n\
  'CT': 'Connecticut',\n\
  'DC': 'District of Columbia',\n\
  'DE': 'Delaware',\n\
  'FL': 'Florida',\n\
  'GA': 'Georgia',\n\
  'GU': 'Guam',\n\
  'HI': 'Hawaii',\n\
  'IA': 'Iowa',\n\
  'ID': 'Idaho',\n\
  'IL': 'Illinois',\n\
  'IN': 'Indiana',\n\
  'KS': 'Kansas',\n\
  'KY': 'Kentucky',\n\
  'LA': 'Louisiana',\n\
  'MA': 'Massachusetts',\n\
  'MD': 'Maryland',\n\
  'ME': 'Maine',\n\
  'MI': 'Michigan',\n\
  'MN': 'Minnesota',\n\
  'MO': 'Missouri',\n\
  'MP': 'Northern Mariana Islands',\n\
  'MS': 'Mississippi',\n\
  'MT': 'Montana',\n\
  'NA': 'National',\n\
  'NC': 'North Carolina',\n\
  'ND': 'North Dakota',\n\
  'NE': 'Nebraska',\n\
  'NH': 'New Hampshire',\n\
  'NJ': 'New Jersey',\n\
  'NM': 'New Mexico',\n\
  'NV': 'Nevada',\n\
  'NY': 'New York',\n\
  'OH': 'Ohio',\n\
  'OK': 'Oklahoma',\n\
  'OR': 'Oregon',\n\
  'PA': 'Pennsylvania',\n\
  'PR': 'Puerto Rico',\n\
  'RI': 'Rhode Island',\n\
  'SC': 'South Carolina',\n\
  'SD': 'South Dakota',\n\
  'TN': 'Tennessee',\n\
  'TX': 'Texas',\n\
  'UT': 'Utah',\n\
  'VA': 'Virginia',\n\
  'VI': 'Virgin Islands',\n\
  'VT': 'Vermont',\n\
  'WA': 'Washington',\n\
  'WI': 'Wisconsin',\n\
  'WV': 'West Virginia',\n\
  'WY': 'Wyoming'\n\
}\n\
\n\
function isUS(birth, death) {\n\
  var us = /united states/i\n\
    , r\n\
  birth = birth || ''\n\
  death = death || ''\n\
  if (birth.match(us) || death.match(us)) return true\n\
  for (var a in states) {\n\
    r = new RegExp(states[a], 'i')\n\
    if (birth.match(r) || death.match(r)) return true\n\
  }\n\
  return false\n\
}\n\
\n\
var census_years = {\n\
  1900: 1325221,\n\
  1910: 1727033,\n\
  1920: 1488411,\n\
  1930: 1810731,\n\
  1940: 2000219,\n\
  1880: 1417683,\n\
  1870: 1438024,\n\
  1860: 1473181,\n\
  1850: 1401638,\n\
  1840: 1786457,\n\
  1830: 1803958,\n\
  1820: 1803955,\n\
  1810: 1803765,\n\
  1800: 1804228,\n\
  1790: 1803959\n\
}\n\
\n\
function search_collection(person, cid) {\n\
  return familySearch(person) + '&collection_id=' + cid\n\
}\n\
\n\
function getCensuses(person) {\n\
  var display = person.rels.display\n\
    , censai = []\n\
    , deathYear = getYear(display.deathDate)\n\
    , birthYear = getYear(display.birthDate)\n\
    , base = ''\n\
  if (!isUS(display.birthPlace, display.deathPlace)) return []\n\
  if (deathYear && !birthYear) {\n\
    birthYear = deathYear - 70\n\
  }\n\
  if (birthYear && !deathYear) {\n\
    deathYear = birthYear + 70\n\
  }\n\
  if (!birthYear) return []\n\
  base = familySearch(person)\n\
  for (var year in census_years) {\n\
    if (birthYear - 5 < parseInt(year) && deathYear + 5 > parseInt(year)) {\n\
      censai.push({\n\
        href: base + '&collection_id=' + census_years[year],\n\
        title: year + ' US Census'\n\
      })\n\
    }\n\
  }\n\
  return censai\n\
}\n\
\n\
function billionGraves(person) {\n\
  var display = person.rels.display\n\
    , parts = display.name.split(' ')\n\
    , lastName = parts.pop()\n\
    , firstNames = parts.join('+')\n\
    , birthYear\n\
    , deathYear\n\
    , query = 'http://billiongraves.com/pages/search/#given_names=' + firstNames + '&family_names=' + lastName + '&year_range=5&lim=0&num=10&action=search'\n\
  if (display.birthDate && (birthYear = getYear(display.birthDate))) {\n\
    query += '&birth_year=' + birthYear\n\
  }\n\
  if (display.deathDate && (deathYear = getYear(display.deathDate))) {\n\
    query += '&death_year=' + deathYear\n\
  }\n\
  return query\n\
}\n\
\n\
function searchItems(person) {\n\
  return [\n\
    {\n\
      href: familySearch(person),\n\
      title: 'FamilySearch simple search'\n\
    },\n\
    /*{\n\
      href: familySearchAdv(person),\n\
      title: 'FamilySearch advanced search'\n\
    },*/\n\
    {\n\
      href: billionGraves(person),\n\
      title: 'Billion Graves search'\n\
    }\n\
  ].concat(getCensuses(person))\n\
}//@ sourceURL=main/client/components/searches.js"
));
require.register("main/client/components/searcher.js", Function("exports, require, module",
"\n\
var d = React.DOM\n\
\n\
module.exports = React.createClass({\n\
  getInitialState: function () {\n\
    return {open: false, iopen: false}\n\
  },\n\
  toggle: function () {\n\
    this.setState({open: !this.state.open, iopen: true})\n\
  },\n\
  render: function () {\n\
    return d.div(\n\
      {\n\
        className: 'searcher' + (this.state.open ? ' searcher--open' : '')\n\
      },\n\
      d.span({\n\
        className: 'searcher__title',\n\
        onClick: this.toggle,\n\
      }, this.props.item.title),\n\
      d.iframe({\n\
        className: 'searcher__iframe',\n\
        src: this.state.iopen ? this.props.item.href : ''\n\
      })\n\
    )\n\
  }\n\
})//@ sourceURL=main/client/components/searcher.js"
));
require.register("main/client/components/star.js", Function("exports, require, module",
"\n\
var d = React.DOM\n\
\n\
var Star = module.exports = React.createClass({\n\
  render: function () {\n\
    return d.i({\n\
      className: 'fa star fa-star' + (this.props.value ? ' star-filled' : '-o'),\n\
      onClick: this.props.onChange\n\
    })\n\
  }\n\
})\n\
\n\
//@ sourceURL=main/client/components/star.js"
));
require.register("main/client/components/todo.js", Function("exports, require, module",
"\n\
var d = React.DOM\n\
  , todos = require('api').todos\n\
  , Note = require('./person-note')\n\
  , CheckBox = require('./check-box')\n\
\n\
var Todo = module.exports = React.createClass({\n\
  getDefaultProps: function () {\n\
    return {\n\
      startOpen: false,\n\
      onDone: function () {\n\
      }\n\
    }\n\
  },\n\
  getInitialState: function () {\n\
    return {\n\
      open: this.props.startOpen\n\
    }\n\
  },\n\
  toggleDone: function (e) {\n\
    if (!this.props.data.completed) this.setState({open: false})\n\
    this.props.onDone()\n\
    e.stopPropagation()\n\
    return false\n\
  },\n\
  getTitle: function () {\n\
    var tpl = todos.titles[this.props.data.type]\n\
      , items = this.props.data.data\n\
    if (items && 'undefined' !== typeof items.args) {\n\
      items = items.args\n\
    }\n\
    if (!Array.isArray(items)) {\n\
      items = [items];\n\
    } else {\n\
      items = items.slice()\n\
    }\n\
    return tpl.replace(/\\{\\}/g, function () {\n\
      return items.shift()\n\
    })\n\
  },\n\
  getLinks: function () {\n\
    if (!this.props.data.data || !this.props.data.data.links) return false\n\
    var links = this.props.data.data.links\n\
    return d.ul({className: 'todo__links'},\n\
      Object.keys(links).map(function (link) {\n\
        return d.li({className: 'todo__link-item'},\n\
          d.a({\n\
            className: 'todo__link',\n\
            target: '_blank',\n\
            href: links[link]\n\
          },\n\
          d.i({className: 'fa fa-arrow-right'}),\n\
          link\n\
          )\n\
        )\n\
      })\n\
    )\n\
  },\n\
  toggleOpen: function () {\n\
    this.setState({open: !this.state.open})\n\
  },\n\
  render: function () {\n\
    var cls = 'todo'\n\
      , ttype = todos.types[this.props.data.type]\n\
    if (this.props.data.completed) {\n\
      if (this.props.data.hard) {\n\
        cls += ' todo--hard-completed'\n\
      } else {\n\
        cls += ' todo--completed'\n\
      }\n\
    } else if (this.props.data.hard) {\n\
      cls += ' todo--hard'\n\
    }\n\
    if (!this.state.open) {\n\
      return d.div(\n\
        {\n\
          className: cls + ' todo--collapsed',\n\
          onClick: this.toggleOpen\n\
        },\n\
        d.span({\n\
          className: 'todo__title'\n\
        }, this.getTitle()),\n\
        this.props.data.note && d.i({\n\
          className: 'todo__has-note fa fa-pencil'\n\
        })\n\
      )\n\
    }\n\
    return d.div({\n\
        className: cls,\n\
      },\n\
      d.div(\n\
        {\n\
          className: 'todo__head',\n\
          onClick: this.toggleOpen\n\
        },\n\
        CheckBox({\n\
          onChange: this.toggleDone,\n\
          checked: !!this.props.data.completed\n\
        }),\n\
        d.span({\n\
          className: 'todo__title'\n\
        }, this.getTitle())\n\
      ),\n\
      Note({\n\
        className: 'todo__note',\n\
        value: this.props.data.note || '',\n\
        onChange: this.props.changeNote\n\
      }),\n\
      this.getLinks(),\n\
      ttype.help && d.span({\n\
        className: 'todo__explanation',\n\
      }, ttype.help),\n\
      d.button({\n\
        className: 'todo__hard' + (this.props.data.hard ? ' todo__hard--depressed' : ''),\n\
        onClick: this.props.onHard\n\
      }, !this.props.data.hard ? 'Mark as hard' : 'Unmark as hard'),\n\
      ttype.help_link && d.a(\n\
        {\n\
          className: 'todo__help-button',\n\
          href: ttype.help_link,\n\
          target: '_blank'\n\
        },\n\
        d.i({className: 'fa fa-question-circle'}),\n\
        'More help'\n\
      )\n\
    )\n\
  }\n\
})\n\
\n\
//@ sourceURL=main/client/components/todo.js"
));
require.register("main/client/components/footer.js", Function("exports, require, module",
"\n\
var d = React.DOM\n\
\n\
var Footer = module.exports = React.createClass({\n\
  displayName: 'Footer',\n\
  render: function () {\n\
    return d.span(null, \"Don't stop believing\")\n\
  }\n\
})\n\
\n\
//@ sourceURL=main/client/components/footer.js"
));
require.register("main/client/components/header.js", Function("exports, require, module",
"/** @jsx React.DOM */\n\
\n\
var d = React.DOM\n\
  , Breadcrumb = require('./breadcrumb')\n\
\n\
var Header = module.exports = React.createClass({\n\
  displayName: 'Header',\n\
  render: function () {\n\
    return (\n\
      React.DOM.div( {className:\"header\"}, \n\
        \"Welcome,\",\n\
        React.DOM.span( {className:\"header__name\"}, \n\
          this.props.userData.displayName\n\
        ),\n\
        React.DOM.a( {className:\"header__logout\", href:\"/logout\"}, \"Logout\"),\n\
        React.DOM.span( {className:\"header__loading\"}, \n\
          this.props.loadingText\n\
        ),\n\
        Breadcrumb( {manager:this.props.manager, id:this.props.pid, personHref:this.props.personHref})\n\
      )\n\
    )\n\
  }\n\
})\n\
//@ sourceURL=main/client/components/header.js"
));
require.register("main/client/components/breadcrumb.js", Function("exports, require, module",
"\n\
var d = React.DOM\n\
  , DataBound = require('./data-bound')\n\
\n\
var Breadcrumb = module.exports = React.createClass({\n\
  mixins: [DataBound],\n\
  displayName: 'Breadcrumb',\n\
  getDefaultProps: function () {\n\
    return {\n\
      personHref: function () {return '#here'}\n\
    }\n\
  },\n\
  render: function () {\n\
    if (!this.state.data || !this.state.data.data || !this.state.data.data.lineage.length) {\n\
      return d.ul({className: 'breadcrumb breadcrumb--empty'})\n\
    }\n\
    var items = this.state.data.data.lineage\n\
      , display = this.state.data.rels.display\n\
      , people = []\n\
    items = items.concat([{\n\
      isHead: true,\n\
      name: display.name,\n\
      id: display.id\n\
    }])\n\
    for (var i=0; i<items.length; i++) {\n\
      people.push(d.li(\n\
        {className: 'breadcrumb__item' + (items[i].isHead ? ' breadcrumb__item--head' : '')},\n\
        d.a({\n\
          href: items[i].isHead ? undefined : this.props.personHref(items[i].id),\n\
        }, items[i].name)\n\
      ))\n\
      if (items.length > 4 && i < items.length - 4) {\n\
        i = items.length - 4;\n\
        people.push(d.span({className: 'breadcrumb__dotdotdot'}))\n\
      }\n\
    }\n\
    return d.ul(\n\
      {className: 'breadcrumb'},\n\
      people\n\
    )\n\
  }\n\
})\n\
\n\
\n\
//@ sourceURL=main/client/components/breadcrumb.js"
));
require.register("main/client/components/star-box.js", Function("exports, require, module",
"\n\
var d = React.DOM\n\
  , TodoPerson = require('./todo-person')\n\
\n\
var StarBox = module.exports = React.createClass({\n\
  displayName: 'StarBox',\n\
  getDefaultProps: function () {\n\
    return {\n\
      manager: null,\n\
      overviewPerson: function () {}\n\
    }\n\
  },\n\
  getInitialState: function () {\n\
    return {\n\
      ids: []\n\
    }\n\
  },\n\
  componentDidMount: function () {\n\
    this.props.manager.on('starred', this.gotData)\n\
  },\n\
  componentWillUnmount: function () {\n\
    this.props.manager.off('starred', this.gotData)\n\
  },\n\
  gotData: function (data) {\n\
    this.setState({ids: data.ids || []})\n\
  },\n\
  render: function () {\n\
    return d.div(\n\
      {className: 'star-box'},\n\
      d.h2({className: 'star-box__title'}, 'Starred People'),\n\
      this.state.ids.map(function (id) {\n\
        return TodoPerson({\n\
          showAnyway: true,\n\
          personHref: this.props.personHref(id),\n\
          viewPerson: this.props.viewPerson,\n\
          manager: this.props.manager,\n\
          id: id\n\
        })\n\
      }.bind(this)),\n\
      !this.state.ids.length && d.h4({className: 'star-box__empty'}, 'No starred people')\n\
    )\n\
  }\n\
})\n\
\n\
\n\
//@ sourceURL=main/client/components/star-box.js"
));
require.register("main/client/components/history-box.js", Function("exports, require, module",
"\n\
var d = React.DOM\n\
  , HistoryItem = require('./history-item')\n\
\n\
var HistoryBox = module.exports = React.createClass({\n\
  displayName: 'HistoryBox',\n\
  getDefaultProps: function () {\n\
    return {\n\
      manager: null,\n\
      personHref: function () {}\n\
    }\n\
  },\n\
  getInitialState: function () {\n\
    return {\n\
      items: []\n\
    }\n\
  },\n\
  componentDidMount: function () {\n\
    this.props.manager.on('history', this.gotData)\n\
  },\n\
  componentWillUnmount: function () {\n\
    this.props.manager.off('history', this.gotData)\n\
  },\n\
  gotData: function (data) {\n\
    this.setState({items: data.items || []})\n\
  },\n\
  grouped: function () {\n\
    var items = this.state.items\n\
      , grouped = []\n\
    for (var i=0; i<items.length; i++) {\n\
      if (grouped.length && items[i].id === grouped[grouped.length-1].id) {\n\
        grouped[grouped.length-1].actions.push(items[i])\n\
        continue;\n\
      }\n\
      grouped.push({\n\
        id: items[i].id,\n\
        display: items[i].display,\n\
        actions: [items[i]]\n\
      })\n\
    }\n\
    return grouped\n\
  },\n\
  render: function () {\n\
    return d.div(\n\
      {className: 'history-box'},\n\
      d.h2({className: 'history-box__title'}, 'Recent Actions'),\n\
      this.grouped().map(function (item) {\n\
        if (!item.display) return false\n\
        return HistoryItem({\n\
          value: item,\n\
          personHref: this.props.personHref\n\
        })\n\
      }.bind(this)),\n\
      !this.state.items.length && d.h4({className: 'history-box__empty'}, 'No recent actions')\n\
    )\n\
  }\n\
})\n\
\n\
//@ sourceURL=main/client/components/history-box.js"
));
require.register("main/client/components/history-item.js", Function("exports, require, module",
"\n\
var d = React.DOM\n\
  , relationship = require('./relationship.js')\n\
\n\
  , todos = require('api').todos\n\
\n\
function historyTodoInfo(item) {\n\
  var title = todos.types[item.todo].title.replace('{}', '')\n\
  if (item.key === 'hard') {\n\
    return {\n\
      // title: (item.value ? '' : 'un') + 'marked task as hard',\n\
      title: (item.value ? '' : 'un') + 'marked task \"' + title + '\" as hard',\n\
      icon: item.value ? 'fa-meh-o' : 'fa-smile-o'\n\
    }\n\
  }\n\
  if (item.key === 'note') {\n\
    return {\n\
      title: 'Changed note on task \"' + title + '\"',\n\
      icon: 'fa-pencil-square-o',\n\
      body: item.value\n\
    }\n\
  }\n\
  if (item.value) {\n\
    return {\n\
      title: todos.types[item.todo].history,\n\
      icon: 'fa-check-square-o'\n\
    }\n\
  }\n\
  return {\n\
    // title: 'Marked task as incomplete'\n\
    title: 'Marked task \"' + todos.types[item.todo].title.replace('{}', '') + '\" as incomplete',\n\
    icon: 'fa-square-o'\n\
  }\n\
}\n\
\n\
function historyInfo(item) {\n\
  if (item.todo) {\n\
    return historyTodoInfo(item)\n\
  }\n\
  var names = {\n\
    starred: function (item) {\n\
      return {\n\
        title: (item.value ? '' : 'un') + 'starred',\n\
        icon: 'fa-star' + (item.value ? '' : '-o')\n\
      }\n\
    },\n\
    note: function (item) {\n\
      return {\n\
        title: 'Changed note',\n\
        icon: 'fa-pencil',\n\
        body: item.value\n\
      }\n\
    },\n\
    customTodos: function (item) {\n\
      return {\n\
        title: 'Changed custom tasks',\n\
        icon: 'fa-plus-square-o'\n\
      }\n\
    }\n\
  }\n\
  return names[item.key](item)\n\
}\n\
\n\
function capFirst(str) {\n\
  return str[0].toUpperCase() + str.slice(1)\n\
}\n\
\n\
var HistoryItem = module.exports = React.createClass({\n\
  displayName: 'HistoryItem',\n\
  getDefaultProps: function () {\n\
    return {\n\
      value: {},\n\
      personHref: function () {return '#nope'}\n\
    }\n\
  },\n\
  render: function () {\n\
    var display = this.props.value.display\n\
      , relation = relationship.text(display.gender, display.generation)\n\
\n\
    return d.div(\n\
      {className: 'history-item'},\n\
      d.div(\n\
        {className: 'history-item__top'},\n\
        d.span(\n\
          {className: 'history-item__date'},\n\
          moment(this.props.value.actions[0].date).fromNow()\n\
        ),\n\
        d.a({\n\
          className: 'history-item__name',\n\
          href: this.props.personHref(this.props.value.id),\n\
        }, display.name),\n\
        d.span(\n\
          {className: 'history-item__lifespan'},\n\
          display.lifespan\n\
        )\n\
      ),\n\
      d.div(\n\
        {className: 'history-item__extra'},\n\
        d.a(\n\
          {\n\
            className: 'hisotry-item__fsorg',\n\
            target: '_blank',\n\
            href: 'https://familysearch.org/tree/#view=ancestor&person=' + this.props.value.id\n\
          },\n\
          'View on FamilySearch.org: ' + this.props.value.id + ''\n\
        ),\n\
        d.div(\n\
          {className: 'history-item__relation'},\n\
          relation\n\
        )\n\
      ),\n\
      this.props.value.actions.map(function (action) {\n\
        var info = historyInfo(action)\n\
        return d.div(\n\
          {className: 'history-item__action'},\n\
          d.i({\n\
            className: 'fa fa-fw ' + info.icon\n\
          }),\n\
          d.span(\n\
            {className: 'history-item__action-title'},\n\
            capFirst(info.title) + ' '\n\
          ),\n\
          d.div(\n\
            {className: 'history-item__action-body'},\n\
            info.body\n\
          )\n\
        )\n\
      })\n\
    )\n\
  }\n\
})\n\
\n\
//@ sourceURL=main/client/components/history-item.js"
));
require.register("main/client/components/research-notes.js", Function("exports, require, module",
"\n\
var d = React.DOM\n\
\n\
var ResearchNotes = React.createClass({\n\
  render: function () {\n\
    return d.textarea({placeholder: 'Awesome Notez'})\n\
  }\n\
})\n\
\n\
//@ sourceURL=main/client/components/research-notes.js"
));
require.register("main/client/components/todo-people.js", Function("exports, require, module",
"\n\
var d = React.DOM\n\
  , TodoPerson = require('./todo-person')\n\
\n\
var TodoPeople = module.exports = React.createClass({\n\
  getInitialState: function () {\n\
    return {open: false}\n\
  },\n\
  loadingMessage: function () {\n\
    if (!this.props.loading.todos) return false\n\
    var got = this.props.people.length\n\
      , searched = this.props.loading.morepeople\n\
      , want = this.props.loading.more ? 10 : 5\n\
      , left = want - got\n\
      , noun = left === 1 ? 'person' : 'people'\n\
    if (left < 0) left = 0\n\
    return d.div({\n\
      className: 'todo-people__load-status'\n\
    }, 'Looking for ' + left + ' more ' + noun + '. Searched through ' + searched)\n\
  },\n\
  loadMore: function () {\n\
    if (this.props.loading.todos || this.props.loading.more) return\n\
    return d.button({\n\
      className: 'btn btn-default todo-people__load-more',\n\
      onClick: this.props.loadMoreTodos,\n\
      disabled: this.props.loading.todos\n\
    }, 'Look for more')\n\
  },\n\
  toggleOpen: function () {\n\
    this.setState({open: !this.state.open})\n\
  },\n\
  render: function () {\n\
    return d.div({\n\
      className: 'todo-people' + (this.state.open ? ' todo-people--open' : '')\n\
    },\n\
    d.h2(\n\
      {className: 'todo-people__title', onClick: this.toggleOpen},\n\
      d.i({className: 'todo-people__caret fa fa-fw fa-angle-' + (this.state.open ? 'down' : 'right')}),\n\
      'People to work on'\n\
    ),\n\
    d.div(\n\
      {className: 'todo-buttons'},\n\
      this.loadMore(),\n\
      this.loadingMessage()\n\
    ),\n\
    d.ul(\n\
      {className: 'todo-people__list'},\n\
      this.props.people.map(function (id) {\n\
        return d.li({key: id},\n\
          TodoPerson({\n\
            overviewPerson: this.props.overviewPerson,\n\
            viewPerson: this.props.viewPerson,\n\
            manager: this.props.manager,\n\
            personHref: this.props.personHref(id),\n\
            removePerson: this.props.removePerson.bind(null, id),\n\
            id: id\n\
          }))\n\
      }.bind(this)),\n\
      !this.props.people.length && d.li({className: 'todo-people__loading'}, 'Searching your tree for things to do...'))\n\
    )\n\
  }\n\
})\n\
\n\
//@ sourceURL=main/client/components/todo-people.js"
));
require.register("main/client/components/todo-person.js", Function("exports, require, module",
"/** @jsx React.DOM */\n\
\n\
var Star = require('./star')\n\
  , Todo = require('./todo')\n\
  , PersonNote = require('./person-note')\n\
  , d = React.DOM\n\
  , searchItems = require('./searches').searchItems\n\
  , relationship = require('./relationship.js')\n\
  , Droplist = require('./droplist')\n\
\n\
  , CustomTodos = require('./custom-todos')\n\
\n\
function findTodo(todos, type, key) {\n\
  for (var i in todos) {\n\
    if (todos[i].type === type && (!key || todos[i].key === key)) {return i}\n\
  }\n\
  return -1\n\
}\n\
\n\
\n\
function makeDropicon(person) {\n\
  return Droplist({\n\
    items: searchItems(person)\n\
  })\n\
}\n\
\n\
var TodoPerson = module.exports = React.createClass({\n\
  displayName: 'TodoPerson',\n\
  getDefaultProps: function () {\n\
    return {\n\
      manager: null,\n\
      id: null,\n\
      showHard: false,\n\
      personHref: '',\n\
      showAnyway: false,\n\
      initialData: {}\n\
    }\n\
  },\n\
  getInitialState: function () {\n\
    return {person: this.props.initialData}\n\
  },\n\
  componentDidMount: function () {\n\
    if (!this.props.manager) return\n\
    this.props.manager.on(this.props.id, this.gotData)\n\
  },\n\
  componentWillUnmount: function () {\n\
    if (!this.props.manager) return\n\
    this.props.manager.off(this.props.id, this.gotData)\n\
  },\n\
  componentDidUpdate: function (prevProps) {\n\
    if (prevProps.id !== this.props.id) {\n\
      this.props.manager.off(prevProps.id, this.gotData)\n\
      this.props.manager.on(this.props.id, this.gotData)\n\
    }\n\
  },\n\
  gotData: function (data) {\n\
    this.setState({person: data})\n\
  },\n\
\n\
  todoNote: function (type, key, value) {\n\
    var todos = this.state.person.data.todos\n\
      , ix = findTodo(todos, type, key)\n\
    if (ix === -1) {\n\
      console.error('tried to mark', type, 'as done but not found')\n\
      return\n\
    }\n\
    todos[ix].note = value\n\
    // ughhh mutating state...\n\
    this.setState({person: this.state.person})\n\
    if (!this.props.manager) return\n\
    this.props.manager.setTodoNote(this.props.id, type, key, value)\n\
  },\n\
\n\
  onDone: function (type, key) {\n\
    var todos = this.state.person.data.todos\n\
      , ix = findTodo(todos, type, key)\n\
    if (ix === -1) {\n\
      console.error('tried to mark', type, 'as done but not found')\n\
      return\n\
    }\n\
    if (todos[ix].completed) {\n\
      todos[ix].completed = false\n\
    } else {\n\
      todos[ix].completed = new Date()\n\
    }\n\
    // ughhh mutating state...\n\
    this.setState({person: this.state.person})\n\
    if (!this.props.manager) return\n\
    this.props.manager.setTodoDone(this.props.id, type, key, todos[ix].completed)\n\
  },\n\
\n\
  onHard: function (type, key) {\n\
    var todos = this.state.person.data.todos\n\
      , ix = findTodo(todos, type, key)\n\
    if (ix === -1) {\n\
      console.error('tried to mark', type, 'as done but not found')\n\
      return\n\
    }\n\
    if (todos[ix].hard) {\n\
      todos[ix].hard = false\n\
    } else {\n\
      todos[ix].hard = new Date()\n\
    }\n\
    // ughhh mutating state...\n\
    this.setState({person: this.state.person})\n\
    if (!this.props.manager) return\n\
    this.props.manager.setTodoHard(this.props.id, type, key, todos[ix].hard)\n\
  },\n\
\n\
  onComplete: function () {\n\
    var data = this.state.person.data\n\
    if (data.completed) {\n\
      data.completed = false\n\
    } else {\n\
      data.completed = new Date()\n\
    }\n\
    this.setState({person: this.state.person})\n\
    if (!this.props.manager) return\n\
    this.props.manager.setCompleted(this.props.id, data.completed)\n\
    // if (this.sortedPeople().length === 0) this.props.loadMorePeople()\n\
  },\n\
\n\
  onStar: function () {\n\
    var data = this.state.person.data\n\
    if (data.starred) {\n\
      data.starred = false\n\
    } else {\n\
      data.starred = new Date()\n\
    }\n\
    this.setState({person: this.state.person})\n\
    if (!this.props.manager) return\n\
    this.props.manager.setStarred(this.props.id, data.starred)\n\
  },\n\
\n\
  changeNote: function (text) {\n\
    this.state.person.data.note = text\n\
    this.setState({person: this.state.person})\n\
    if (!this.props.manager) return\n\
    this.props.manager.setNote(this.props.id, text)\n\
  },\n\
\n\
  changeCustom: function (todos) {\n\
    this.state.person.data.customTodos = todos\n\
    this.setState({person: this.state.person})\n\
    if (!this.props.manager) return\n\
    this.props.manager.setCustomTodos(this.props.id, todos)\n\
  },\n\
\n\
  getState: function () {\n\
    var hard = []\n\
      , todos = []\n\
    if (this.state.person.data.completed) {\n\
      return 'completed'\n\
    }\n\
    if (!this.state.person.data.todos) {\n\
      return 'no todos'\n\
    }\n\
    this.state.person.data.todos.forEach(function (todo){\n\
      if (todo.completed) return\n\
      if (todo.hard) {\n\
        hard.push(todo)\n\
        return\n\
      }\n\
      todos.push(todo)\n\
    })\n\
    if (todos.length) return 'todos'\n\
    if (hard.length) return 'hard todos'\n\
    return 'no todos'\n\
  },\n\
\n\
  render: function () {\n\
    if (!this.state.person || !this.state.person.data) {\n\
      return React.DOM.div(null, \"Loading\")\n\
    }\n\
    var person = this.state.person\n\
      , display = (person.rels || person.data).display\n\
      , place = display.birthPlace || display.deathPlace\n\
      , showAnyway = this.props.showAnyway\n\
\n\
    if (!showAnyway && person.data.completed) {\n\
      return (\n\
        React.DOM.div( {className:\"todo-person todo-person--completed\"}, \n\
          React.DOM.span( {className:\"todo-person__s-name\"}, display.name || '[No Name]'),\n\
          \" marked as complete. \",\n\
          React.DOM.button( {className:\"todo-person__undo\", onClick:this.onComplete}, \"Undo\")\n\
        )\n\
      )\n\
    }\n\
    var status = this.getState()\n\
\n\
    if (!showAnyway && status === 'no todos') {\n\
      return (\n\
        React.DOM.div( {className:\"todo-person todo-person--no-todos\"}, \n\
          React.DOM.span( {className:\"todo-person__s-name\"}, display.name || '[No Name]'), \" finished! \"\n\
        )\n\
      )\n\
    }\n\
    /*\n\
    if (!showAnyway && status === 'hard todos' && !this.props.showHard) {\n\
      return (\n\
        <div className='todo-person todo-person--hard-todos'>\n\
          <span className='todo-person__s-name'>{display.name || '[No Name]'}</span>\n\
          has only \"hard\" items.\n\
        </div>\n\
      )\n\
    }\n\
          // {makeDropicon(person)}\n\
    */\n\
    return (\n\
      React.DOM.div( {className:\"todo-person\"}, \n\
        React.DOM.div( {className:\"todo-person__top\"}, \n\
          Star(\n\
            {className:\"todo-person__star\",\n\
            value:person.data.starred,\n\
            onChange:this.onStar}),\n\
          React.DOM.a( {className:\"todo-person__name\", href:this.props.personHref}, \n\
            display.name || '[No Name]'\n\
          ),\n\
          React.DOM.div( {className:\"todo-person__lifespan\"}, \n\
            display.lifespan\n\
          )\n\
        ),\n\
        React.DOM.div( {className:\"todo-person__bottom\"}, \n\
          React.DOM.div( {className:\"todo-person__place\"}, \n\
            place || 'No recorded locations'\n\
          ),\n\
          React.DOM.div( {className:\"todo-person__relation\"}, \n\
            person.data.lineage && relationship.text(display.gender, person.data.lineage.length)\n\
          )\n\
        ),\n\
        !!(person.data.todos && person.data.todos.length) && d.h4({className: 'todo-person__tasks-title'}, 'Tasks'),\n\
        React.DOM.ul( {className:\"todo-person__todos\"}, \n\
          person.data.todos && person.data.todos.map(function (todo) {\n\
            return (\n\
              React.DOM.li( {className:\"todo-person__todo\", key:todo.type + ':' + todo.key}, \n\
                Todo({\n\
                  data: todo,\n\
                  onDone: this.onDone.bind(null, todo.type, todo.key),\n\
                  onHard: this.onHard.bind(null, todo.type, todo.key),\n\
                  changeNote: this.todoNote.bind(null, todo.type, todo.key)\n\
                })\n\
              )\n\
            )\n\
          }.bind(this))\n\
        ),\n\
        CustomTodos({data: person.data.customTodos, onChange: this.changeCustom}),\n\
        React.DOM.a( {className:\"todo-person__fsorg\", target:\"_blank\", href:'https://familysearch.org/tree/#view=ancestor&person=' + person.data.id}, \n\
          \" View on familysearch.org: \", person.data.id\n\
        )\n\
      )\n\
    )\n\
  }\n\
})\n\
//@ sourceURL=main/client/components/todo-person.js"
));
require.register("main/client/components/custom-todos.js", Function("exports, require, module",
"\n\
var d = React.DOM\n\
  , CustomTodo = require('./custom-todo')\n\
\n\
var AddTodo = React.createClass({\n\
  displayName: 'AddTodo',\n\
  getDefaultProps: function () {\n\
    return {\n\
      onAdd: function () {}\n\
    }\n\
  },\n\
  getInitialState: function () {\n\
    return {\n\
      text: ''\n\
    }\n\
  },\n\
  focus: function () {\n\
    this.refs.input.getDOMNode().focus()\n\
  },\n\
  onKeyDown: function (e) {\n\
    if (e.keyCode === 13) {\n\
      return this.add()\n\
    }\n\
  },\n\
  add: function () {\n\
    this.props.onAdd(this.state.text)\n\
  },\n\
  onChange: function (e) {\n\
    this.setState({text: e.target.value})\n\
  },\n\
  render: function () {\n\
    return d.div(\n\
      {className: 'add-todo'},\n\
      d.button({\n\
        className: 'add-todo__btn btn btn-sm btn-primary',\n\
        onClick: this.add\n\
      }, d.i({className: 'fa fa-plus'})),\n\
      d.input({\n\
        className: 'add-todo__input',\n\
        onChange: this.onChange,\n\
        onKeyDown: this.onKeyDown,\n\
        value: this.state.text,\n\
        ref: 'input'\n\
      })\n\
    )\n\
  }\n\
})\n\
\n\
var CustomTodos = module.exports = React.createClass({\n\
  displayName: 'CustomTodos',\n\
  getDefaultProps: function () {\n\
    return {\n\
      onChange: function () {},\n\
      data: []\n\
    }\n\
  },\n\
  getInitialState: function () {\n\
    return {\n\
      adding: false\n\
    }\n\
  },\n\
  componentDidUpdate: function (props, state) {\n\
    if (!state.adding && this.state.adding) {\n\
      this.refs.adder.focus()\n\
    }\n\
  },\n\
  onDone: function (i) {\n\
    var value = !this.props.data[i].completed && new Date()\n\
    this.todoAttr(i, 'completed', value)\n\
  },\n\
  onHard: function (i) {\n\
    var value = !this.props.data[i].hard && new Date()\n\
    this.todoAttr(i, 'hard', value)\n\
  },\n\
  todoAttr: function (i, what, value) {\n\
    this.props.data[i][what] = value\n\
    this.props.onChange(this.props.data)\n\
  },\n\
  showAdd: function () {\n\
    this.setState({adding: !this.state.adding})\n\
  },\n\
  onAdd: function (text) {\n\
    if (!text) return this.setState({adding: false})\n\
    this.props.data.unshift({\n\
      title: text,\n\
      created: new Date(),\n\
      completed: false,\n\
      note: '',\n\
      hard: false\n\
    })\n\
    this.setState({adding: false})\n\
    this.props.onChange(this.props.data)\n\
  },\n\
  onRemove: function (i) {\n\
    this.props.data.splice(i, 1);\n\
    this.props.onChange(this.props.data)\n\
  },\n\
  render: function () {\n\
    return d.div(\n\
      {className: 'custom-todos'},\n\
      d.button({\n\
        className: 'custom-todos__add-btn',\n\
        onClick: this.showAdd\n\
      }, 'Add', d.i({className: 'fa fa-plus'})),\n\
      d.h4({className: 'custom-todos__title'}, 'Custom Tasks'),\n\
      d.ul(\n\
        {className: 'custom-todos__list'},\n\
        this.state.adding && AddTodo({onAdd: this.onAdd, ref: 'adder'}),\n\
        this.props.data.map(function (task, i) {\n\
          return d.li(\n\
            {className: 'custom-todos__todo'},\n\
            CustomTodo({\n\
              onTitle: this.todoAttr.bind(null, i, 'title'),\n\
              onNote: this.todoAttr.bind(null, i, 'note'),\n\
              onDone: this.onDone.bind(null, i),\n\
              onHard: this.onHard.bind(null, i),\n\
              onRemove: this.onRemove.bind(null, i),\n\
              data: task,\n\
              key: i\n\
            })\n\
          )\n\
        }.bind(this))\n\
      )\n\
    )\n\
  }\n\
})\n\
\n\
//@ sourceURL=main/client/components/custom-todos.js"
));
require.register("main/client/components/custom-todo.js", Function("exports, require, module",
"\n\
var d = React.DOM\n\
  , todos = require('api').todos\n\
  , Note = require('./person-note')\n\
  , CheckBox = require('./check-box')\n\
\n\
var CustomTodo = module.exports = React.createClass({\n\
  displayName: 'CustomTodo',\n\
  getDefaultProps: function () {\n\
    return {\n\
      startOpen: false,\n\
      onRemove: function () {},\n\
      onTitle: function () {},\n\
      onDone: function () {},\n\
      onHard: function () {},\n\
      onNote: function () {},\n\
      data: {}\n\
    }\n\
  },\n\
  getInitialState: function () {\n\
    return {\n\
      open: this.props.startOpen,\n\
      title: this.props.data.title || ''\n\
    }\n\
  },\n\
  componentDidUpdate: function (props, state) {\n\
    if (props.data.title !== this.props.data.title) {\n\
      return this.setState({title: this.props.data.title})\n\
    }\n\
    if (!state.open && this.state.open) {\n\
      var node = this.refs.title.getDOMNode()\n\
      node.selectionStart = node.selectionEnd = node.value.length\n\
      node.focus()\n\
      node.selectionStart = node.selectionEnd = node.value.length\n\
    }\n\
  },\n\
  toggleDone: function (e) {\n\
    if (!this.props.data.completed) this.setState({open: false})\n\
    this.props.onDone()\n\
    e.stopPropagation()\n\
    return false\n\
  },\n\
  changeTitle: function (e) {\n\
    this.setState({title: e.target.value})\n\
  },\n\
  setTitle: function () {\n\
    if (this.state.title === this.props.data.title) return\n\
    this.props.onTitle(this.state.title)\n\
  },\n\
  toggleOpen: function () {\n\
    this.setState({open: !this.state.open})\n\
  },\n\
  titleKey: function (e) {\n\
    if (e.keyCode === 13) this.refs.title.getDOMNode().blur()\n\
  },\n\
  render: function () {\n\
    var cls = 'todo custom-todo'\n\
    if (this.props.data.completed) {\n\
      if (this.props.data.hard) {\n\
        cls += ' todo--hard-completed'\n\
      } else {\n\
        cls += ' todo--completed'\n\
      }\n\
    } else if (this.props.data.hard) {\n\
      cls += ' todo--hard'\n\
    }\n\
    if (!this.state.open) {\n\
      return d.div(\n\
        {\n\
          className: cls + ' todo--collapsed',\n\
          onClick: this.toggleOpen\n\
        },\n\
        d.i({\n\
          className: 'custom-todo__collapse fa fa-angle-up',\n\
          onClick: this.toggleOpen\n\
        }),\n\
        d.span({\n\
          className: 'todo__title'\n\
        }, this.props.data.title),\n\
        this.props.data.note && d.i({\n\
          className: 'todo__has-note fa fa-pencil'\n\
        })\n\
      )\n\
    }\n\
    return d.div({\n\
        className: cls,\n\
      },\n\
      d.div(\n\
        {\n\
          className: 'todo__head',\n\
        },\n\
        d.input({\n\
          className: 'todo__title custom-todo__input',\n\
          ref: 'title',\n\
          value: this.state.title,\n\
          onChange: this.changeTitle,\n\
          onClick: function (e) {e.stopPropagation()},\n\
          onBlur: this.setTitle,\n\
          onKeyDown: this.titleKey\n\
        }),\n\
        CheckBox({\n\
          onChange: this.toggleDone,\n\
          checked: !!this.props.data.completed\n\
        }),\n\
        d.i({\n\
          className: 'custom-todo__collapse fa fa-angle-down',\n\
          onClick: this.toggleOpen\n\
        })\n\
      ),\n\
      Note({\n\
        className: 'todo__note',\n\
        value: this.props.data.note || '',\n\
        onChange: this.props.onNote\n\
      }),\n\
      d.button({\n\
        className: 'todo__hard' + (this.props.data.hard ? ' todo__hard--depressed' : ''),\n\
        onClick: this.props.onHard\n\
      }, !this.props.data.hard ? 'Mark as hard' : 'Unmark as hard'),\n\
      d.button({\n\
        className: 'todo__remove',\n\
        onClick: this.props.onRemove\n\
      }, 'remove')\n\
    )\n\
  }\n\
})\n\
\n\
\n\
//@ sourceURL=main/client/components/custom-todo.js"
));
require.register("main/client/components/check-box.js", Function("exports, require, module",
"\n\
var d = React.DOM\n\
\n\
var CheckBox = module.exports = React.createClass({\n\
  getDefaultProps: function () {\n\
    return {\n\
      checked: false,\n\
      onChange: function () {}\n\
    }\n\
  },\n\
  render: function () {\n\
    return d.button({\n\
      onClick: this.props.onChange,\n\
      className: 'check-button btn btn-primary ' + (this.props.checked ? 'active' : '')\n\
    }, !this.props.checked ? 'mark done' : 'mark not done')\n\
  }\n\
})\n\
//@ sourceURL=main/client/components/check-box.js"
));
require.register("main/client/components/person-note.js", Function("exports, require, module",
"\n\
var d = React.DOM\n\
  , utils = require('../../lib/utils')\n\
\n\
var Note = module.exports = React.createClass({\n\
  displayName: 'Note',\n\
  getDefaultProps: function () {\n\
    return {\n\
      className: '',\n\
      onChange: function () {},\n\
      text: ''\n\
    }\n\
  },\n\
  getInitialState: function () {\n\
    return {\n\
      open: false, text: this.props.value,\n\
      onChange: function () {}\n\
    }\n\
  },\n\
  componentWillReceiveProps: function (props) {\n\
    if (!this.state.open) {\n\
      this.state.text = props.value\n\
    }\n\
  },\n\
  componentDidUpdate: function (props, state) {\n\
    if (state.open || !this.state.open) return\n\
    var node = this.refs.input.getDOMNode()\n\
    node.focus()\n\
    node.selectionEnd = node.selectionStart = node.value.length\n\
  },\n\
  open: function () {\n\
    if (this.state.open) return\n\
    this.setState({open: true})\n\
  },\n\
  staticContent: function () {\n\
    var items = utils.findLinks(this.state.text).map(function (chunk) {\n\
      if (Array.isArray(chunk)) {\n\
        return d.a({\n\
          href: chunk[0],\n\
          target: '_blank'\n\
        }, chunk[1])\n\
      }\n\
      return chunk\n\
    })\n\
    return d.span.apply(d, [{\n\
      className: 'note__static'\n\
    }].concat(items))\n\
  },\n\
  body: function () {\n\
    if (!this.state.open) {\n\
      if (!this.state.text) {\n\
        return d.span({\n\
          className: 'note__empty',\n\
          onClick: this.open\n\
        }, 'Click to add a note')\n\
      }\n\
      return this.staticContent()\n\
    }\n\
    return d.textarea({\n\
      className: 'note__input',\n\
      ref: 'input',\n\
      value: this.state.text,\n\
      onChange: this.onChange,\n\
      onKeyDown: this.onKeyDown,\n\
      onBlur: this.action\n\
    })\n\
  },\n\
  onKeyDown: function (e) {\n\
    if (e.keyCode === 13 && e.shiftKey) {\n\
      this.action()\n\
    }\n\
  },\n\
  onChange: function (e) {\n\
    this.setState({text: e.target.value})\n\
  },\n\
  onDown: function (e) {\n\
    if (this.state.open) {\n\
      e.preventDefault()\n\
      e.stopPropagation()\n\
    }\n\
  },\n\
  action: function () {\n\
    if (!this.state.open) return this.open()\n\
    this.setState({open: false})\n\
    if (this.state.text === this.props.value) return\n\
    this.props.onChange(this.state.text)\n\
  },\n\
  render: function () {\n\
    var cname = this.props.className + ' note' \n\
    if (this.state.open) cname += ' note--open' \n\
    if (!this.props.value) cname += ' note--empty' \n\
    return d.div({\n\
      className: cname,\n\
      onClick: this.open\n\
    }, this.body(), d.button({\n\
      className: 'note__button',\n\
      onClick: this.action,\n\
      onMouseDown: this.onDown\n\
    }))\n\
  }\n\
})\n\
\n\
\n\
//@ sourceURL=main/client/components/person-note.js"
));
require.register("main/client/components/vital-info.js", Function("exports, require, module",
"\n\
var d = React.DOM\n\
\n\
var VitalInfo = React.createClass({\n\
  displayName: 'VitalInfo',\n\
  render: function () {\n\
    return d.div(null, 'Vitalz')\n\
  }\n\
})\n\
\n\
//@ sourceURL=main/client/components/vital-info.js"
));
require.register("main/lib/utils.js", Function("exports, require, module",
"\n\
module.exports = {\n\
  findLinks: findLinks\n\
}\n\
\n\
var linkRxs = {\n\
  '(https://)?(familysearch\\\\.org/pal:/([^/]+)/([A-Z0-9a-z-]+))': {\n\
    title: 'Record ($3/$4)',\n\
    href: 'https://$2'\n\
  },\n\
  '(https://)?(familysearch\\\\.org/tree/#view=ancestor&person=([A-Z0-9]{4}-[A-Z0-9]{3}))': {\n\
    title: 'Person ($3)',\n\
    href: 'https://$2'\n\
  },\n\
  '\\\\b[A-Z0-9]{4}-[A-Z0-9]{3}\\\\b': {\n\
    title: 'Person ($0)',\n\
    href: 'https://familysearch.org/tree/#view=ancestor&person=$0'\n\
  }\n\
}\n\
\n\
function fillMatch(text, match) {\n\
  return text.replace(/\\$(\\d+)/g, function (full, num) {\n\
    return match[+num]\n\
  })\n\
}\n\
\n\
function nextForRx(text, rx) {\n\
  var match = text.match(new RegExp(rx))\n\
  if (!match) return false\n\
  return [text.slice(0, match.index), text.slice(match.index + match[0].length), fillMatch(linkRxs[rx].href, match), fillMatch(linkRxs[rx].title, match)]\n\
}\n\
\n\
function findLinks(text) {\n\
  var chunks = [text]\n\
  for (var rx in linkRxs) {\n\
    chunks = doRx(chunks, rx)\n\
  }\n\
  return chunks\n\
}\n\
\n\
function findRx(text, rx) {\n\
  var chunks = []\n\
    , next\n\
  while (next = nextForRx(text, rx)) {\n\
    chunks.push(next[0])\n\
    text = next[1]\n\
    chunks.push(next.slice(2))\n\
  }\n\
  if (text.length) chunks.push(text)\n\
  return chunks\n\
}\n\
\n\
function doRx(chunks, rx) {\n\
  var res = []\n\
  for (var i in chunks) {\n\
    if (Array.isArray(chunks[i])) {\n\
      res.push(chunks[i])\n\
      continue;\n\
    }\n\
    res = res.concat(findRx(chunks[i], rx))\n\
  }\n\
  return res\n\
}\n\
\n\
\n\
//@ sourceURL=main/lib/utils.js"
));










































require.alias("familyfound-fsauth/client.js", "main/deps/fsauth/client.js");
require.alias("familyfound-fsauth/client.js", "main/deps/fsauth/index.js");
require.alias("familyfound-fsauth/client.js", "fsauth/index.js");
require.alias("visionmedia-superagent/lib/client.js", "familyfound-fsauth/deps/superagent/lib/client.js");
require.alias("visionmedia-superagent/lib/client.js", "familyfound-fsauth/deps/superagent/index.js");
require.alias("component-emitter/index.js", "visionmedia-superagent/deps/emitter/index.js");

require.alias("component-reduce/index.js", "visionmedia-superagent/deps/reduce/index.js");

require.alias("visionmedia-superagent/lib/client.js", "visionmedia-superagent/index.js");
require.alias("familyfound-fsauth/client.js", "familyfound-fsauth/index.js");
require.alias("familyfound-api/client/index.js", "main/deps/api/client/index.js");
require.alias("familyfound-api/lib/fslinks.js", "main/deps/api/lib/fslinks.js");
require.alias("familyfound-api/client/utils.js", "main/deps/api/client/utils.js");
require.alias("familyfound-api/lib/todos.js", "main/deps/api/lib/todos.js");
require.alias("familyfound-api/client/index.js", "main/deps/api/index.js");
require.alias("familyfound-api/client/index.js", "api/index.js");
require.alias("familyfound-api/client/index.js", "familyfound-api/index.js");
require.alias("familyfound-fan/index.js", "main/deps/fan/index.js");
require.alias("familyfound-fan/node.js", "main/deps/fan/node.js");
require.alias("familyfound-fan/utils.js", "main/deps/fan/utils.js");
require.alias("familyfound-fan/index.js", "main/deps/fan/index.js");
require.alias("familyfound-fan/index.js", "fan/index.js");
require.alias("component-tip/index.js", "familyfound-fan/deps/tip/index.js");
require.alias("component-tip/template.js", "familyfound-fan/deps/tip/template.js");
require.alias("component-bind/index.js", "component-tip/deps/bind/index.js");

require.alias("component-emitter/index.js", "component-tip/deps/emitter/index.js");

require.alias("component-query/index.js", "component-tip/deps/query/index.js");

require.alias("component-events/index.js", "component-tip/deps/events/index.js");
require.alias("component-event/index.js", "component-events/deps/event/index.js");

require.alias("component-delegate/index.js", "component-events/deps/delegate/index.js");
require.alias("component-matches-selector/index.js", "component-delegate/deps/matches-selector/index.js");
require.alias("component-query/index.js", "component-matches-selector/deps/query/index.js");

require.alias("component-event/index.js", "component-delegate/deps/event/index.js");

require.alias("component-domify/index.js", "component-tip/deps/domify/index.js");

require.alias("component-classes/index.js", "component-tip/deps/classes/index.js");
require.alias("component-indexof/index.js", "component-classes/deps/indexof/index.js");

require.alias("component-css/index.js", "component-tip/deps/css/index.js");
require.alias("component-css/lib/css.js", "component-tip/deps/css/lib/css.js");
require.alias("component-css/lib/prop.js", "component-tip/deps/css/lib/prop.js");
require.alias("component-css/lib/swap.js", "component-tip/deps/css/lib/swap.js");
require.alias("component-css/lib/style.js", "component-tip/deps/css/lib/style.js");
require.alias("component-css/lib/hooks.js", "component-tip/deps/css/lib/hooks.js");
require.alias("component-css/lib/styles.js", "component-tip/deps/css/lib/styles.js");
require.alias("component-css/lib/vendor.js", "component-tip/deps/css/lib/vendor.js");
require.alias("component-css/lib/support.js", "component-tip/deps/css/lib/support.js");
require.alias("component-css/lib/computed.js", "component-tip/deps/css/lib/computed.js");
require.alias("component-css/index.js", "component-tip/deps/css/index.js");
require.alias("component-each/index.js", "component-css/deps/each/index.js");
require.alias("component-to-function/index.js", "component-each/deps/to-function/index.js");
require.alias("component-props/index.js", "component-to-function/deps/props/index.js");

require.alias("component-type/index.js", "component-each/deps/type/index.js");

require.alias("visionmedia-debug/index.js", "component-css/deps/debug/index.js");
require.alias("visionmedia-debug/debug.js", "component-css/deps/debug/debug.js");

require.alias("ianstormtaylor-to-camel-case/index.js", "component-css/deps/to-camel-case/index.js");
require.alias("ianstormtaylor-to-space-case/index.js", "ianstormtaylor-to-camel-case/deps/to-space-case/index.js");
require.alias("ianstormtaylor-to-no-case/index.js", "ianstormtaylor-to-space-case/deps/to-no-case/index.js");

require.alias("component-within-document/index.js", "component-css/deps/within-document/index.js");

require.alias("component-css/index.js", "component-css/index.js");
require.alias("timoxley-offset/index.js", "component-tip/deps/offset/index.js");
require.alias("timoxley-dom-support/index.js", "timoxley-offset/deps/dom-support/index.js");
require.alias("enyo-domready/index.js", "timoxley-dom-support/deps/domready/index.js");

require.alias("timoxley-assert/index.js", "timoxley-dom-support/deps/assert/index.js");
require.alias("component-inherit/index.js", "timoxley-assert/deps/inherit/index.js");

require.alias("component-within-document/index.js", "timoxley-offset/deps/within-document/index.js");

require.alias("familyfound-fan/index.js", "familyfound-fan/index.js");
require.alias("familyfound-person-manager/index.js", "main/deps/person-manager/index.js");
require.alias("familyfound-person-manager/index.js", "main/deps/person-manager/index.js");
require.alias("familyfound-person-manager/index.js", "person-manager/index.js");
require.alias("notablemind-manager/index.js", "familyfound-person-manager/deps/manager/index.js");
require.alias("notablemind-manager/index.js", "familyfound-person-manager/deps/manager/index.js");
require.alias("lodash-lodash/index.js", "notablemind-manager/deps/lodash/index.js");
require.alias("lodash-lodash/dist/lodash.compat.js", "notablemind-manager/deps/lodash/dist/lodash.compat.js");

require.alias("notablemind-manager/index.js", "notablemind-manager/index.js");
require.alias("lodash-lodash/index.js", "familyfound-person-manager/deps/lodash/index.js");
require.alias("lodash-lodash/dist/lodash.compat.js", "familyfound-person-manager/deps/lodash/dist/lodash.compat.js");

require.alias("familyfound-person-manager/index.js", "familyfound-person-manager/index.js");
require.alias("jashkenas-backbone/backbone.js", "main/deps/backbone/backbone.js");
require.alias("jashkenas-backbone/backbone.js", "main/deps/backbone/index.js");
require.alias("jashkenas-backbone/backbone.js", "backbone/index.js");
require.alias("jashkenas-underscore/underscore.js", "jashkenas-backbone/deps/underscore/underscore.js");
require.alias("jashkenas-underscore/underscore-min.js", "jashkenas-backbone/deps/underscore/underscore-min.js");
require.alias("jashkenas-underscore/underscore.js", "jashkenas-backbone/deps/underscore/index.js");
require.alias("jashkenas-underscore/underscore.js", "jashkenas-underscore/index.js");
require.alias("jashkenas-backbone/backbone.js", "jashkenas-backbone/index.js");
require.alias("lodash-lodash/index.js", "main/deps/lodash/index.js");
require.alias("lodash-lodash/dist/lodash.compat.js", "main/deps/lodash/dist/lodash.compat.js");
require.alias("lodash-lodash/index.js", "lodash/index.js");

require.alias("component-tip/index.js", "main/deps/tip/index.js");
require.alias("component-tip/template.js", "main/deps/tip/template.js");
require.alias("component-tip/index.js", "tip/index.js");
require.alias("component-bind/index.js", "component-tip/deps/bind/index.js");

require.alias("component-emitter/index.js", "component-tip/deps/emitter/index.js");

require.alias("component-query/index.js", "component-tip/deps/query/index.js");

require.alias("component-events/index.js", "component-tip/deps/events/index.js");
require.alias("component-event/index.js", "component-events/deps/event/index.js");

require.alias("component-delegate/index.js", "component-events/deps/delegate/index.js");
require.alias("component-matches-selector/index.js", "component-delegate/deps/matches-selector/index.js");
require.alias("component-query/index.js", "component-matches-selector/deps/query/index.js");

require.alias("component-event/index.js", "component-delegate/deps/event/index.js");

require.alias("component-domify/index.js", "component-tip/deps/domify/index.js");

require.alias("component-classes/index.js", "component-tip/deps/classes/index.js");
require.alias("component-indexof/index.js", "component-classes/deps/indexof/index.js");

require.alias("component-css/index.js", "component-tip/deps/css/index.js");
require.alias("component-css/lib/css.js", "component-tip/deps/css/lib/css.js");
require.alias("component-css/lib/prop.js", "component-tip/deps/css/lib/prop.js");
require.alias("component-css/lib/swap.js", "component-tip/deps/css/lib/swap.js");
require.alias("component-css/lib/style.js", "component-tip/deps/css/lib/style.js");
require.alias("component-css/lib/hooks.js", "component-tip/deps/css/lib/hooks.js");
require.alias("component-css/lib/styles.js", "component-tip/deps/css/lib/styles.js");
require.alias("component-css/lib/vendor.js", "component-tip/deps/css/lib/vendor.js");
require.alias("component-css/lib/support.js", "component-tip/deps/css/lib/support.js");
require.alias("component-css/lib/computed.js", "component-tip/deps/css/lib/computed.js");
require.alias("component-css/index.js", "component-tip/deps/css/index.js");
require.alias("component-each/index.js", "component-css/deps/each/index.js");
require.alias("component-to-function/index.js", "component-each/deps/to-function/index.js");
require.alias("component-props/index.js", "component-to-function/deps/props/index.js");

require.alias("component-type/index.js", "component-each/deps/type/index.js");

require.alias("visionmedia-debug/index.js", "component-css/deps/debug/index.js");
require.alias("visionmedia-debug/debug.js", "component-css/deps/debug/debug.js");

require.alias("ianstormtaylor-to-camel-case/index.js", "component-css/deps/to-camel-case/index.js");
require.alias("ianstormtaylor-to-space-case/index.js", "ianstormtaylor-to-camel-case/deps/to-space-case/index.js");
require.alias("ianstormtaylor-to-no-case/index.js", "ianstormtaylor-to-space-case/deps/to-no-case/index.js");

require.alias("component-within-document/index.js", "component-css/deps/within-document/index.js");

require.alias("component-css/index.js", "component-css/index.js");
require.alias("timoxley-offset/index.js", "component-tip/deps/offset/index.js");
require.alias("timoxley-dom-support/index.js", "timoxley-offset/deps/dom-support/index.js");
require.alias("enyo-domready/index.js", "timoxley-dom-support/deps/domready/index.js");

require.alias("timoxley-assert/index.js", "timoxley-dom-support/deps/assert/index.js");
require.alias("component-inherit/index.js", "timoxley-assert/deps/inherit/index.js");

require.alias("component-within-document/index.js", "timoxley-offset/deps/within-document/index.js");


require.alias("main/client/index.js", "main/index.js");if (typeof exports == "object") {
  module.exports = require("main");
} else if (typeof define == "function" && define.amd) {
  define([], function(){ return require("main"); });
} else {
  this["main"] = require("main");
}})();