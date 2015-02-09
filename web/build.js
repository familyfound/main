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
  this.text = this.req.method !='HEAD' \n\
     ? this.xhr.responseText \n\
     : null;\n\
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
  return parse && str && str.length\n\
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
  var url = req.url;\n\
\n\
  var msg = 'cannot ' + method + ' ' + url + ' (' + this.status + ')';\n\
  var err = new Error(msg);\n\
  err.status = this.status;\n\
  err.method = method;\n\
  err.url = url;\n\
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
    var err = null;\n\
    var res = null;\n\
\n\
    try {\n\
      res = new Response(self); \n\
    } catch(e) {\n\
      err = new Error('Parser is unable to parse the response');\n\
      err.parse = true;\n\
      err.original = e;\n\
    }\n\
\n\
    if (res) {\n\
      self.emit('response', res);\n\
    }\n\
\n\
    self.callback(err, res);\n\
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
 * Allow for extension\n\
 */\n\
\n\
Request.prototype.use = function(fn) {\n\
  fn(this);\n\
  return this;\n\
}\n\
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
 * Remove header `field`.\n\
 *\n\
 * Example:\n\
 *\n\
 *      req.get('/')\n\
 *        .unset('User-Agent')\n\
 *        .end(callback);\n\
 *\n\
 * @param {String} field\n\
 * @return {Request} for chaining\n\
 * @api public\n\
 */\n\
\n\
Request.prototype.unset = function(field){\n\
  delete this._header[field.toLowerCase()];\n\
  delete this.header[field];\n\
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
 * Write the field `name` and `val` for \"multipart/form-data\"\n\
 * request bodies.\n\
 *\n\
 * ``` js\n\
 * request.post('/upload')\n\
 *   .field('foo', 'bar')\n\
 *   .end(callback);\n\
 * ```\n\
 *\n\
 * @param {String} name\n\
 * @param {String|Blob|File} val\n\
 * @return {Request} for chaining\n\
 * @api public\n\
 */\n\
\n\
Request.prototype.field = function(name, val){\n\
  if (!this._formData) this._formData = new FormData();\n\
  this._formData.append(name, val);\n\
  return this;\n\
};\n\
\n\
/**\n\
 * Queue the given `file` as an attachment to the specified `field`,\n\
 * with optional `filename`.\n\
 *\n\
 * ``` js\n\
 * request.post('/upload')\n\
 *   .attach(new Blob(['<a id=\"a\"><b id=\"b\">hey!</b></a>'], { type: \"text/html\"}))\n\
 *   .end(callback);\n\
 * ```\n\
 *\n\
 * @param {String} field\n\
 * @param {Blob|File} file\n\
 * @param {String} filename\n\
 * @return {Request} for chaining\n\
 * @api public\n\
 */\n\
\n\
Request.prototype.attach = function(field, file, filename){\n\
  if (!this._formData) this._formData = new FormData();\n\
  this._formData.append(field, file, filename);\n\
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
  this.clearTimeout();\n\
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
  var data = this._formData || this._data;\n\
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
  this.emit('request', this);\n\
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
    if (err) return done(err);\n\
    if (res.status >= 300 || res.status < 200) {\n\
      return done(res.text)\n\
    }\n\
    if (res.status == 200) {\n\
      return done(null, res.header['oauth-access-token'], res.body);\n\
    }\n\
\n\
    modal(function () {\n\
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
    })\n\
  });\n\
\n\
}\n\
\n\
var Modal = React.createClass({\n\
  render: function () {\n\
    return React.DOM.div({\n\
        style: {\n\
          position: 'fixed',\n\
          backgroundColor: 'white',\n\
          top: 0,\n\
          left: 0,\n\
          right: 0,\n\
          bottom: 0,\n\
        }\n\
      },\n\
      React.DOM.button({\n\
        onClick: this.props.action,\n\
        style: {\n\
          margin: '100px auto',\n\
          backgroundColor: '#5C64FF',\n\
          border: '1px solid #ccc',\n\
          borderRadius: '10px',\n\
          fontSize: '25px',\n\
          fontWeight: 'bold',\n\
          padding: '10px 20px',\n\
          backgroundImage: 'linear-gradient(to bottom, rgb(16, 62, 247), rgb(37, 47, 115))',\n\
          color: 'rgb(234, 227, 255)',\n\
          display: 'block',\n\
        }\n\
      }, this.props.title)\n\
    )\n\
  }\n\
})\n\
\n\
function modal(done) {\n\
  var node = document.createElement('div')\n\
  document.body.appendChild(node)\n\
  React.renderComponent(Modal({\n\
    title: 'Login with FamilySearch',\n\
    action: function () {\n\
      node.parentNode.removeChild(node)\n\
      done()\n\
    },\n\
  }), node)\n\
}\n\
\n\
/*\n\
var modal = module.exports.modal = function (check_url, next) {\n\
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
*/\n\
\n\
\n\
/**\n\
 * Expect an external window to be done sometime soon\n\
 */\n\
function waitForWindow(child, initial, step, done) {\n\
  if (arguments.length === 2) {\n\
    done = initial\n\
    initial = 500\n\
    step = 100\n\
  }\n\
  waitFor(initial, step, function () {\n\
    if (child.closed) {\n\
      done(new Error('User aborder auth'))\n\
      return true\n\
    }\n\
    try {\n\
      var m = child.location.search;\n\
    } catch (e) {\n\
      return false\n\
    }\n\
    if (child.location.origin !== this.location.origin) return false\n\
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
      ;[].forEach.call(this.tip.inner.childNodes, function (node) {\n\
        node.parentNode.removeChild(node)\n\
      })\n\
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
"//     Underscore.js 1.7.0\n\
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
  // Save bytes in the minified (but not gzipped) version:\n\
  var ArrayProto = Array.prototype, ObjProto = Object.prototype, FuncProto = Function.prototype;\n\
\n\
  // Create quick reference variables for speed access to core prototypes.\n\
  var\n\
    push             = ArrayProto.push,\n\
    slice            = ArrayProto.slice,\n\
    toString         = ObjProto.toString,\n\
    hasOwnProperty   = ObjProto.hasOwnProperty;\n\
\n\
  // All **ECMAScript 5** native function implementations that we hope to use\n\
  // are declared here.\n\
  var\n\
    nativeIsArray      = Array.isArray,\n\
    nativeKeys         = Object.keys,\n\
    nativeBind         = FuncProto.bind,\n\
    nativeCreate       = Object.create;\n\
\n\
  // Reusable constructor function for prototype setting.\n\
  var Ctor = function(){};\n\
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
  // the browser, add `_` as a global object.\n\
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
  _.VERSION = '1.7.0';\n\
\n\
  // Internal function that returns an efficient (for current engines) version\n\
  // of the passed-in callback, to be repeatedly applied in other Underscore\n\
  // functions.\n\
  var optimizeCb = function(func, context, argCount) {\n\
    if (context === void 0) return func;\n\
    switch (argCount == null ? 3 : argCount) {\n\
      case 1: return function(value) {\n\
        return func.call(context, value);\n\
      };\n\
      case 2: return function(value, other) {\n\
        return func.call(context, value, other);\n\
      };\n\
      case 3: return function(value, index, collection) {\n\
        return func.call(context, value, index, collection);\n\
      };\n\
      case 4: return function(accumulator, value, index, collection) {\n\
        return func.call(context, accumulator, value, index, collection);\n\
      };\n\
    }\n\
    return function() {\n\
      return func.apply(context, arguments);\n\
    };\n\
  };\n\
\n\
  // A mostly-internal function to generate callbacks that can be applied\n\
  // to each element in a collection, returning the desired result — either\n\
  // identity, an arbitrary callback, a property matcher, or a property accessor.\n\
  var cb = function(value, context, argCount) {\n\
    if (value == null) return _.identity;\n\
    if (_.isFunction(value)) return optimizeCb(value, context, argCount);\n\
    if (_.isObject(value)) return _.matches(value);\n\
    return _.property(value);\n\
  };\n\
  _.iteratee = function(value, context) {\n\
    return cb(value, context, Infinity);\n\
  };\n\
\n\
  // An internal function for creating assigner functions.\n\
  var createAssigner = function(keysFunc) {\n\
    return function(obj) {\n\
      var length = arguments.length;\n\
      if (length < 2 || obj == null) return obj;\n\
      for (var index = 0; index < length; index++) {\n\
        var source = arguments[index],\n\
            keys = keysFunc(source),\n\
            l = keys.length;\n\
        for (var i = 0; i < l; i++) {\n\
          var key = keys[i];\n\
          obj[key] = source[key];\n\
        }\n\
      }\n\
      return obj;\n\
    };\n\
  };\n\
\n\
  // An internal function for creating a new object that inherts from another.\n\
  var baseCreate = function(prototype) {\n\
    if (!_.isObject(prototype)) return {};\n\
    if (nativeCreate) return nativeCreate(prototype);\n\
    Ctor.prototype = prototype;\n\
    var result = new Ctor;\n\
    Ctor.prototype = null;\n\
    return result;\n\
  };\n\
\n\
  // Collection Functions\n\
  // --------------------\n\
\n\
  // The cornerstone, an `each` implementation, aka `forEach`.\n\
  // Handles raw objects in addition to array-likes. Treats all\n\
  // sparse array-likes as if they were dense.\n\
  _.each = _.forEach = function(obj, iteratee, context) {\n\
    if (obj == null) return obj;\n\
    iteratee = optimizeCb(iteratee, context);\n\
    var i, length = obj.length;\n\
    if (length === +length) {\n\
      for (i = 0; i < length; i++) {\n\
        iteratee(obj[i], i, obj);\n\
      }\n\
    } else {\n\
      var keys = _.keys(obj);\n\
      for (i = 0, length = keys.length; i < length; i++) {\n\
        iteratee(obj[keys[i]], keys[i], obj);\n\
      }\n\
    }\n\
    return obj;\n\
  };\n\
\n\
  // Return the results of applying the iteratee to each element.\n\
  _.map = _.collect = function(obj, iteratee, context) {\n\
    if (obj == null) return [];\n\
    iteratee = cb(iteratee, context);\n\
    var keys = obj.length !== +obj.length && _.keys(obj),\n\
        length = (keys || obj).length,\n\
        results = Array(length),\n\
        currentKey;\n\
    for (var index = 0; index < length; index++) {\n\
      currentKey = keys ? keys[index] : index;\n\
      results[index] = iteratee(obj[currentKey], currentKey, obj);\n\
    }\n\
    return results;\n\
  };\n\
\n\
  // **Reduce** builds up a single result from a list of values, aka `inject`,\n\
  // or `foldl`.\n\
  _.reduce = _.foldl = _.inject = function(obj, iteratee, memo, context) {\n\
    if (obj == null) obj = [];\n\
    iteratee = optimizeCb(iteratee, context, 4);\n\
    var keys = obj.length !== +obj.length && _.keys(obj),\n\
        length = (keys || obj).length,\n\
        index = 0, currentKey;\n\
    if (arguments.length < 3) {\n\
      memo = obj[keys ? keys[index++] : index++];\n\
    }\n\
    for (; index < length; index++) {\n\
      currentKey = keys ? keys[index] : index;\n\
      memo = iteratee(memo, obj[currentKey], currentKey, obj);\n\
    }\n\
    return memo;\n\
  };\n\
\n\
  // The right-associative version of reduce, also known as `foldr`.\n\
  _.reduceRight = _.foldr = function(obj, iteratee, memo, context) {\n\
    if (obj == null) obj = [];\n\
    iteratee = optimizeCb(iteratee, context, 4);\n\
    var keys = obj.length !== + obj.length && _.keys(obj),\n\
        index = (keys || obj).length,\n\
        currentKey;\n\
    if (arguments.length < 3) {\n\
      memo = obj[keys ? keys[--index] : --index];\n\
    }\n\
    while (index-- > 0) {\n\
      currentKey = keys ? keys[index] : index;\n\
      memo = iteratee(memo, obj[currentKey], currentKey, obj);\n\
    }\n\
    return memo;\n\
  };\n\
\n\
  // Return the first value which passes a truth test. Aliased as `detect`.\n\
  _.find = _.detect = function(obj, predicate, context) {\n\
    var key;\n\
    if (obj.length === +obj.length) {\n\
      key = _.findIndex(obj, predicate, context);\n\
    } else {\n\
      key = _.findKey(obj, predicate, context);\n\
    }\n\
    if (key !== void 0 && key !== -1) return obj[key];\n\
  };\n\
\n\
  // Return all the elements that pass a truth test.\n\
  // Aliased as `select`.\n\
  _.filter = _.select = function(obj, predicate, context) {\n\
    var results = [];\n\
    if (obj == null) return results;\n\
    predicate = cb(predicate, context);\n\
    _.each(obj, function(value, index, list) {\n\
      if (predicate(value, index, list)) results.push(value);\n\
    });\n\
    return results;\n\
  };\n\
\n\
  // Return all the elements for which a truth test fails.\n\
  _.reject = function(obj, predicate, context) {\n\
    return _.filter(obj, _.negate(cb(predicate)), context);\n\
  };\n\
\n\
  // Determine whether all of the elements match a truth test.\n\
  // Aliased as `all`.\n\
  _.every = _.all = function(obj, predicate, context) {\n\
    if (obj == null) return true;\n\
    predicate = cb(predicate, context);\n\
    var keys = obj.length !== +obj.length && _.keys(obj),\n\
        length = (keys || obj).length,\n\
        index, currentKey;\n\
    for (index = 0; index < length; index++) {\n\
      currentKey = keys ? keys[index] : index;\n\
      if (!predicate(obj[currentKey], currentKey, obj)) return false;\n\
    }\n\
    return true;\n\
  };\n\
\n\
  // Determine if at least one element in the object matches a truth test.\n\
  // Aliased as `any`.\n\
  _.some = _.any = function(obj, predicate, context) {\n\
    if (obj == null) return false;\n\
    predicate = cb(predicate, context);\n\
    var keys = obj.length !== +obj.length && _.keys(obj),\n\
        length = (keys || obj).length,\n\
        index, currentKey;\n\
    for (index = 0; index < length; index++) {\n\
      currentKey = keys ? keys[index] : index;\n\
      if (predicate(obj[currentKey], currentKey, obj)) return true;\n\
    }\n\
    return false;\n\
  };\n\
\n\
  // Determine if the array or object contains a given value (using `===`).\n\
  // Aliased as `includes` and `include`.\n\
  _.contains = _.includes = _.include = function(obj, target, fromIndex) {\n\
    if (obj == null) return false;\n\
    if (obj.length !== +obj.length) obj = _.values(obj);\n\
    return _.indexOf(obj, target, typeof fromIndex == 'number' && fromIndex) >= 0;\n\
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
  // Return the maximum element (or element-based computation).\n\
  _.max = function(obj, iteratee, context) {\n\
    var result = -Infinity, lastComputed = -Infinity,\n\
        value, computed;\n\
    if (iteratee == null && obj != null) {\n\
      obj = obj.length === +obj.length ? obj : _.values(obj);\n\
      for (var i = 0, length = obj.length; i < length; i++) {\n\
        value = obj[i];\n\
        if (value > result) {\n\
          result = value;\n\
        }\n\
      }\n\
    } else {\n\
      iteratee = cb(iteratee, context);\n\
      _.each(obj, function(value, index, list) {\n\
        computed = iteratee(value, index, list);\n\
        if (computed > lastComputed || computed === -Infinity && result === -Infinity) {\n\
          result = value;\n\
          lastComputed = computed;\n\
        }\n\
      });\n\
    }\n\
    return result;\n\
  };\n\
\n\
  // Return the minimum element (or element-based computation).\n\
  _.min = function(obj, iteratee, context) {\n\
    var result = Infinity, lastComputed = Infinity,\n\
        value, computed;\n\
    if (iteratee == null && obj != null) {\n\
      obj = obj.length === +obj.length ? obj : _.values(obj);\n\
      for (var i = 0, length = obj.length; i < length; i++) {\n\
        value = obj[i];\n\
        if (value < result) {\n\
          result = value;\n\
        }\n\
      }\n\
    } else {\n\
      iteratee = cb(iteratee, context);\n\
      _.each(obj, function(value, index, list) {\n\
        computed = iteratee(value, index, list);\n\
        if (computed < lastComputed || computed === Infinity && result === Infinity) {\n\
          result = value;\n\
          lastComputed = computed;\n\
        }\n\
      });\n\
    }\n\
    return result;\n\
  };\n\
\n\
  // Shuffle a collection, using the modern version of the\n\
  // [Fisher-Yates shuffle](http://en.wikipedia.org/wiki/Fisher–Yates_shuffle).\n\
  _.shuffle = function(obj) {\n\
    var set = obj && obj.length === +obj.length ? obj : _.values(obj);\n\
    var length = set.length;\n\
    var shuffled = Array(length);\n\
    for (var index = 0, rand; index < length; index++) {\n\
      rand = _.random(0, index);\n\
      if (rand !== index) shuffled[index] = shuffled[rand];\n\
      shuffled[rand] = set[index];\n\
    }\n\
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
  // Sort the object's values by a criterion produced by an iteratee.\n\
  _.sortBy = function(obj, iteratee, context) {\n\
    iteratee = cb(iteratee, context);\n\
    return _.pluck(_.map(obj, function(value, index, list) {\n\
      return {\n\
        value: value,\n\
        index: index,\n\
        criteria: iteratee(value, index, list)\n\
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
    return function(obj, iteratee, context) {\n\
      var result = {};\n\
      iteratee = cb(iteratee, context);\n\
      _.each(obj, function(value, index) {\n\
        var key = iteratee(value, index, obj);\n\
        behavior(result, value, key);\n\
      });\n\
      return result;\n\
    };\n\
  };\n\
\n\
  // Groups the object's values by a criterion. Pass either a string attribute\n\
  // to group by, or a function that returns the criterion.\n\
  _.groupBy = group(function(result, value, key) {\n\
    if (_.has(result, key)) result[key].push(value); else result[key] = [value];\n\
  });\n\
\n\
  // Indexes the object's values by a criterion, similar to `groupBy`, but for\n\
  // when you know that your index values will be unique.\n\
  _.indexBy = group(function(result, value, key) {\n\
    result[key] = value;\n\
  });\n\
\n\
  // Counts instances of an object that group by a certain criterion. Pass\n\
  // either a string attribute to count by, or a function that returns the\n\
  // criterion.\n\
  _.countBy = group(function(result, value, key) {\n\
    if (_.has(result, key)) result[key]++; else result[key] = 1;\n\
  });\n\
\n\
  // Use a comparator function to figure out the smallest index at which\n\
  // an object should be inserted so as to maintain order. Uses binary search.\n\
  _.sortedIndex = function(array, obj, iteratee, context) {\n\
    iteratee = cb(iteratee, context, 1);\n\
    var value = iteratee(obj);\n\
    var low = 0, high = array.length;\n\
    while (low < high) {\n\
      var mid = low + high >>> 1;\n\
      if (iteratee(array[mid]) < value) low = mid + 1; else high = mid;\n\
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
    return obj.length === +obj.length ? obj.length : _.keys(obj).length;\n\
  };\n\
\n\
  // Split a collection into two arrays: one whose elements all satisfy the given\n\
  // predicate, and one whose elements all do not satisfy the predicate.\n\
  _.partition = function(obj, predicate, context) {\n\
    predicate = cb(predicate, context);\n\
    var pass = [], fail = [];\n\
    _.each(obj, function(value, key, obj) {\n\
      (predicate(value, key, obj) ? pass : fail).push(value);\n\
    });\n\
    return [pass, fail];\n\
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
    if (n == null || guard) return array[0];\n\
    return _.initial(array, array.length - n);\n\
  };\n\
\n\
  // Returns everything but the last entry of the array. Especially useful on\n\
  // the arguments object. Passing **n** will return all the values in\n\
  // the array, excluding the last N. The **guard** check allows it to work with\n\
  // `_.map`.\n\
  _.initial = function(array, n, guard) {\n\
    return slice.call(array, 0, Math.max(0, array.length - (n == null || guard ? 1 : n)));\n\
  };\n\
\n\
  // Get the last element of an array. Passing **n** will return the last N\n\
  // values in the array. The **guard** check allows it to work with `_.map`.\n\
  _.last = function(array, n, guard) {\n\
    if (array == null) return void 0;\n\
    if (n == null || guard) return array[array.length - 1];\n\
    return _.rest(array, Math.max(0, array.length - n));\n\
  };\n\
\n\
  // Returns everything but the first entry of the array. Aliased as `tail` and `drop`.\n\
  // Especially useful on the arguments object. Passing an **n** will return\n\
  // the rest N values in the array. The **guard**\n\
  // check allows it to work with `_.map`.\n\
  _.rest = _.tail = _.drop = function(array, n, guard) {\n\
    return slice.call(array, n == null || guard ? 1 : n);\n\
  };\n\
\n\
  // Trim out all falsy values from an array.\n\
  _.compact = function(array) {\n\
    return _.filter(array, _.identity);\n\
  };\n\
\n\
  // Internal implementation of a recursive `flatten` function.\n\
  var flatten = function(input, shallow, strict, startIndex) {\n\
    var output = [], idx = 0, value;\n\
    for (var i = startIndex || 0, length = input && input.length; i < length; i++) {\n\
      value = input[i];\n\
      if (value && value.length >= 0 && (_.isArray(value) || _.isArguments(value))) {\n\
        //flatten current level of array or arguments object\n\
        if (!shallow) value = flatten(value, shallow, strict);\n\
        var j = 0, len = value.length;\n\
        output.length += len;\n\
        while (j < len) {\n\
          output[idx++] = value[j++];\n\
        }\n\
      } else if (!strict) {\n\
        output[idx++] = value;\n\
      }\n\
    }\n\
    return output;\n\
  };\n\
\n\
  // Flatten out an array, either recursively (by default), or just one level.\n\
  _.flatten = function(array, shallow) {\n\
    return flatten(array, shallow, false);\n\
  };\n\
\n\
  // Return a version of the array that does not contain the specified value(s).\n\
  _.without = function(array) {\n\
    return _.difference(array, slice.call(arguments, 1));\n\
  };\n\
\n\
  // Produce a duplicate-free version of the array. If the array has already\n\
  // been sorted, you have the option of using a faster algorithm.\n\
  // Aliased as `unique`.\n\
  _.uniq = _.unique = function(array, isSorted, iteratee, context) {\n\
    if (array == null) return [];\n\
    if (!_.isBoolean(isSorted)) {\n\
      context = iteratee;\n\
      iteratee = isSorted;\n\
      isSorted = false;\n\
    }\n\
    if (iteratee != null) iteratee = cb(iteratee, context);\n\
    var result = [];\n\
    var seen = [];\n\
    for (var i = 0, length = array.length; i < length; i++) {\n\
      var value = array[i],\n\
          computed = iteratee ? iteratee(value, i, array) : value;\n\
      if (isSorted) {\n\
        if (!i || seen !== computed) result.push(value);\n\
        seen = computed;\n\
      } else if (iteratee) {\n\
        if (!_.contains(seen, computed)) {\n\
          seen.push(computed);\n\
          result.push(value);\n\
        }\n\
      } else if (!_.contains(result, value)) {\n\
        result.push(value);\n\
      }\n\
    }\n\
    return result;\n\
  };\n\
\n\
  // Produce an array that contains the union: each distinct element from all of\n\
  // the passed-in arrays.\n\
  _.union = function() {\n\
    return _.uniq(flatten(arguments, true, true));\n\
  };\n\
\n\
  // Produce an array that contains every item shared between all the\n\
  // passed-in arrays.\n\
  _.intersection = function(array) {\n\
    if (array == null) return [];\n\
    var result = [];\n\
    var argsLength = arguments.length;\n\
    for (var i = 0, length = array.length; i < length; i++) {\n\
      var item = array[i];\n\
      if (_.contains(result, item)) continue;\n\
      for (var j = 1; j < argsLength; j++) {\n\
        if (!_.contains(arguments[j], item)) break;\n\
      }\n\
      if (j === argsLength) result.push(item);\n\
    }\n\
    return result;\n\
  };\n\
\n\
  // Take the difference between one array and a number of other arrays.\n\
  // Only the elements present in just the first array will remain.\n\
  _.difference = function(array) {\n\
    var rest = flatten(arguments, true, true, 1);\n\
    return _.filter(array, function(value){\n\
      return !_.contains(rest, value);\n\
    });\n\
  };\n\
\n\
  // Zip together multiple lists into a single array -- elements that share\n\
  // an index go together.\n\
  _.zip = function(array) {\n\
    if (array == null) return [];\n\
    var length = _.max(arguments, 'length').length;\n\
    var results = Array(length);\n\
    while (length-- > 0) {\n\
      results[length] = _.pluck(arguments, length);\n\
    }\n\
    return results;\n\
  };\n\
\n\
  // Complement of _.zip. Unzip accepts an array of arrays and groups\n\
  // each array's elements on shared indices\n\
  _.unzip = function(array) {\n\
    return _.zip.apply(null, array);\n\
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
  // Return the position of the first occurrence of an item in an array,\n\
  // or -1 if the item is not included in the array.\n\
  // If the array is large and already in sort order, pass `true`\n\
  // for **isSorted** to use binary search.\n\
  _.indexOf = function(array, item, isSorted) {\n\
    var i = 0, length = array && array.length;\n\
    if (typeof isSorted == 'number') {\n\
      i = isSorted < 0 ? Math.max(0, length + isSorted) : isSorted;\n\
    } else if (isSorted && length) {\n\
      i = _.sortedIndex(array, item);\n\
      return array[i] === item ? i : -1;\n\
    }\n\
    for (; i < length; i++) if (array[i] === item) return i;\n\
    return -1;\n\
  };\n\
\n\
  _.lastIndexOf = function(array, item, from) {\n\
    var idx = array ? array.length : 0;\n\
    if (typeof from == 'number') {\n\
      idx = from < 0 ? idx + from + 1 : Math.min(idx, from + 1);\n\
    }\n\
    while (--idx >= 0) if (array[idx] === item) return idx;\n\
    return -1;\n\
  };\n\
\n\
  // Returns the first index on an array-like that passes a predicate test\n\
  _.findIndex = function(array, predicate, context) {\n\
    predicate = cb(predicate, context);\n\
    var length = array != null ? array.length : 0;\n\
    for (var i = 0; i < length; i++) {\n\
      if (predicate(array[i], i, array)) return i;\n\
    }\n\
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
    step = step || 1;\n\
\n\
    var length = Math.max(Math.ceil((stop - start) / step), 0);\n\
    var range = Array(length);\n\
\n\
    for (var idx = 0; idx < length; idx++, start += step) {\n\
      range[idx] = start;\n\
    }\n\
\n\
    return range;\n\
  };\n\
\n\
  // Function (ahem) Functions\n\
  // ------------------\n\
\n\
  // Determines whether to execute a function as a constructor\n\
  // or a normal function with the provided arguments\n\
  var executeBound = function(sourceFunc, boundFunc, context, callingContext, args) {\n\
    if (!(callingContext instanceof boundFunc)) return sourceFunc.apply(context, args);\n\
    var self = baseCreate(sourceFunc.prototype);\n\
    var result = sourceFunc.apply(self, args);\n\
    if (_.isObject(result)) return result;\n\
    return self;\n\
  };\n\
\n\
  // Create a function bound to a given object (assigning `this`, and arguments,\n\
  // optionally). Delegates to **ECMAScript 5**'s native `Function.bind` if\n\
  // available.\n\
  _.bind = function(func, context) {\n\
    if (nativeBind && func.bind === nativeBind) return nativeBind.apply(func, slice.call(arguments, 1));\n\
    if (!_.isFunction(func)) throw new TypeError('Bind must be called on a function');\n\
    var args = slice.call(arguments, 2);\n\
    return function bound() {\n\
      return executeBound(func, bound, context, this, args.concat(slice.call(arguments)));\n\
    };\n\
  };\n\
\n\
  // Partially apply a function by creating a version that has had some of its\n\
  // arguments pre-filled, without changing its dynamic `this` context. _ acts\n\
  // as a placeholder, allowing any combination of arguments to be pre-filled.\n\
  _.partial = function(func) {\n\
    var boundArgs = slice.call(arguments, 1);\n\
    return function bound() {\n\
      var position = 0;\n\
      var args = boundArgs.slice();\n\
      for (var i = 0, length = args.length; i < length; i++) {\n\
        if (args[i] === _) args[i] = arguments[position++];\n\
      }\n\
      while (position < arguments.length) args.push(arguments[position++]);\n\
      return executeBound(func, bound, this, this, args);\n\
    };\n\
  };\n\
\n\
  // Bind a number of an object's methods to that object. Remaining arguments\n\
  // are the method names to be bound. Useful for ensuring that all callbacks\n\
  // defined on an object belong to it.\n\
  _.bindAll = function(obj) {\n\
    var i, length = arguments.length, key;\n\
    if (length <= 1) throw new Error('bindAll must be passed function names');\n\
    for (i = 1; i < length; i++) {\n\
      key = arguments[i];\n\
      obj[key] = _.bind(obj[key], obj);\n\
    }\n\
    return obj;\n\
  };\n\
\n\
  // Memoize an expensive function by storing its results.\n\
  _.memoize = function(func, hasher) {\n\
    var memoize = function(key) {\n\
      var cache = memoize.cache;\n\
      var address = '' + (hasher ? hasher.apply(this, arguments) : key);\n\
      if (!_.has(cache, address)) cache[address] = func.apply(this, arguments);\n\
      return cache[address];\n\
    };\n\
    memoize.cache = {};\n\
    return memoize;\n\
  };\n\
\n\
  // Delays a function for the given number of milliseconds, and then calls\n\
  // it with the arguments supplied.\n\
  _.delay = function(func, wait) {\n\
    var args = slice.call(arguments, 2);\n\
    return setTimeout(function(){\n\
      return func.apply(null, args);\n\
    }, wait);\n\
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
    if (!options) options = {};\n\
    var later = function() {\n\
      previous = options.leading === false ? 0 : _.now();\n\
      timeout = null;\n\
      result = func.apply(context, args);\n\
      if (!timeout) context = args = null;\n\
    };\n\
    return function() {\n\
      var now = _.now();\n\
      if (!previous && options.leading === false) previous = now;\n\
      var remaining = wait - (now - previous);\n\
      context = this;\n\
      args = arguments;\n\
      if (remaining <= 0 || remaining > wait) {\n\
        if (timeout) {\n\
          clearTimeout(timeout);\n\
          timeout = null;\n\
        }\n\
        previous = now;\n\
        result = func.apply(context, args);\n\
        if (!timeout) context = args = null;\n\
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
\n\
      if (last < wait && last >= 0) {\n\
        timeout = setTimeout(later, wait - last);\n\
      } else {\n\
        timeout = null;\n\
        if (!immediate) {\n\
          result = func.apply(context, args);\n\
          if (!timeout) context = args = null;\n\
        }\n\
      }\n\
    };\n\
\n\
    return function() {\n\
      context = this;\n\
      args = arguments;\n\
      timestamp = _.now();\n\
      var callNow = immediate && !timeout;\n\
      if (!timeout) timeout = setTimeout(later, wait);\n\
      if (callNow) {\n\
        result = func.apply(context, args);\n\
        context = args = null;\n\
      }\n\
\n\
      return result;\n\
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
  // Returns a negated version of the passed-in predicate.\n\
  _.negate = function(predicate) {\n\
    return function() {\n\
      return !predicate.apply(this, arguments);\n\
    };\n\
  };\n\
\n\
  // Returns a function that is the composition of a list of functions, each\n\
  // consuming the return value of the function that follows.\n\
  _.compose = function() {\n\
    var args = arguments;\n\
    var start = args.length - 1;\n\
    return function() {\n\
      var i = start;\n\
      var result = args[start].apply(this, arguments);\n\
      while (i--) result = args[i].call(this, result);\n\
      return result;\n\
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
  // Returns a function that will only be executed before being called N times.\n\
  _.before = function(times, func) {\n\
    var memo;\n\
    return function() {\n\
      if (--times > 0) {\n\
        memo = func.apply(this, arguments);\n\
      }\n\
      if (times <= 1) func = null;\n\
      return memo;\n\
    };\n\
  };\n\
\n\
  // Returns a function that will be executed at most one time, no matter how\n\
  // often you call it. Useful for lazy initialization.\n\
  _.once = _.partial(_.before, 2);\n\
\n\
  // Object Functions\n\
  // ----------------\n\
\n\
  // Keys in IE < 9 that won't be iterated by `for key in ...` and thus missed.\n\
  var hasEnumBug = !({toString: null}).propertyIsEnumerable('toString');\n\
  var nonEnumerableProps = ['constructor', 'valueOf', 'isPrototypeOf', 'toString',\n\
                      'propertyIsEnumerable', 'hasOwnProperty', 'toLocaleString'];\n\
\n\
  function collectNonEnumProps(obj, keys) {\n\
    var nonEnumIdx = nonEnumerableProps.length;\n\
    var proto = typeof obj.constructor === 'function' ? FuncProto : ObjProto;\n\
\n\
    while (nonEnumIdx--) {\n\
      var prop = nonEnumerableProps[nonEnumIdx];\n\
      if (prop === 'constructor' ? _.has(obj, prop) : prop in obj &&\n\
        obj[prop] !== proto[prop] && !_.contains(keys, prop)) {\n\
        keys.push(prop);\n\
      }\n\
    }\n\
  }\n\
\n\
  // Retrieve the names of an object's own properties.\n\
  // Delegates to **ECMAScript 5**'s native `Object.keys`\n\
  _.keys = function(obj) {\n\
    if (!_.isObject(obj)) return [];\n\
    if (nativeKeys) return nativeKeys(obj);\n\
    var keys = [];\n\
    for (var key in obj) if (_.has(obj, key)) keys.push(key);\n\
    // Ahem, IE < 9.\n\
    if (hasEnumBug) collectNonEnumProps(obj, keys);\n\
    return keys;\n\
  };\n\
\n\
  // Retrieve all the property names of an object.\n\
  _.keysIn = function(obj) {\n\
    if (!_.isObject(obj)) return [];\n\
    var keys = [];\n\
    for (var key in obj) keys.push(key);\n\
    // Ahem, IE < 9.\n\
    if (hasEnumBug) collectNonEnumProps(obj, keys);\n\
    return keys;\n\
  };\n\
\n\
  // Retrieve the values of an object's properties.\n\
  _.values = function(obj) {\n\
    var keys = _.keys(obj);\n\
    var length = keys.length;\n\
    var values = Array(length);\n\
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
    var pairs = Array(length);\n\
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
  _.extend = createAssigner(_.keysIn);\n\
\n\
  // Assigns a given object with all the own properties in the passed-in object(s)\n\
  // (https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object/assign)\n\
  _.assign = createAssigner(_.keys);\n\
\n\
  // Returns the first key on an object that passes a predicate test\n\
  _.findKey = function(obj, predicate, context) {\n\
    predicate = cb(predicate, context);\n\
    var keys = _.keys(obj), key;\n\
    for (var i = 0, length = keys.length; i < length; i++) {\n\
      key = keys[i];\n\
      if (predicate(obj[key], key, obj)) return key;\n\
    }\n\
  };\n\
\n\
  // Return a copy of the object only containing the whitelisted properties.\n\
  _.pick = function(obj, iteratee, context) {\n\
    var result = {}, key;\n\
    if (obj == null) return result;\n\
    if (_.isFunction(iteratee)) {\n\
      iteratee = optimizeCb(iteratee, context);\n\
      for (key in obj) {\n\
        var value = obj[key];\n\
        if (iteratee(value, key, obj)) result[key] = value;\n\
      }\n\
    } else {\n\
      var keys = flatten(arguments, false, false, 1);\n\
      obj = new Object(obj);\n\
      for (var i = 0, length = keys.length; i < length; i++) {\n\
        key = keys[i];\n\
        if (key in obj) result[key] = obj[key];\n\
      }\n\
    }\n\
    return result;\n\
  };\n\
\n\
   // Return a copy of the object without the blacklisted properties.\n\
  _.omit = function(obj, iteratee, context) {\n\
    if (_.isFunction(iteratee)) {\n\
      iteratee = _.negate(iteratee);\n\
    } else {\n\
      var keys = _.map(flatten(arguments, false, false, 1), String);\n\
      iteratee = function(value, key) {\n\
        return !_.contains(keys, key);\n\
      };\n\
    }\n\
    return _.pick(obj, iteratee, context);\n\
  };\n\
\n\
  // Fill in a given object with default properties.\n\
  _.defaults = function(obj) {\n\
    if (!_.isObject(obj)) return obj;\n\
    for (var i = 1, length = arguments.length; i < length; i++) {\n\
      var source = arguments[i];\n\
      for (var prop in source) {\n\
        if (obj[prop] === void 0) obj[prop] = source[prop];\n\
      }\n\
    }\n\
    return obj;\n\
  };\n\
\n\
  // Creates an object that inherits from the given prototype object.\n\
  // If additional properties are provided then they will be added to the\n\
  // created object.\n\
  _.create = function(prototype, props) {\n\
    var result = baseCreate(prototype);\n\
    if (props) _.assign(result, props);\n\
    return result;\n\
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
    if (a === b) return a !== 0 || 1 / a === 1 / b;\n\
    // A strict comparison is necessary because `null == undefined`.\n\
    if (a == null || b == null) return a === b;\n\
    // Unwrap any wrapped objects.\n\
    if (a instanceof _) a = a._wrapped;\n\
    if (b instanceof _) b = b._wrapped;\n\
    // Compare `[[Class]]` names.\n\
    var className = toString.call(a);\n\
    if (className !== toString.call(b)) return false;\n\
    switch (className) {\n\
      // Strings, numbers, regular expressions, dates, and booleans are compared by value.\n\
      case '[object RegExp]':\n\
      // RegExps are coerced to strings for comparison (Note: '' + /a/i === '/a/i')\n\
      case '[object String]':\n\
        // Primitives and their corresponding object wrappers are equivalent; thus, `\"5\"` is\n\
        // equivalent to `new String(\"5\")`.\n\
        return '' + a === '' + b;\n\
      case '[object Number]':\n\
        // `NaN`s are equivalent, but non-reflexive.\n\
        // Object(NaN) is equivalent to NaN\n\
        if (+a !== +a) return +b !== +b;\n\
        // An `egal` comparison is performed for other numeric values.\n\
        return +a === 0 ? 1 / +a === 1 / b : +a === +b;\n\
      case '[object Date]':\n\
      case '[object Boolean]':\n\
        // Coerce dates and booleans to numeric primitive values. Dates are compared by their\n\
        // millisecond representations. Note that invalid dates with millisecond representations\n\
        // of `NaN` are not equivalent.\n\
        return +a === +b;\n\
    }\n\
\n\
    var areArrays = className === '[object Array]';\n\
    if (!areArrays) {\n\
      if (typeof a != 'object' || typeof b != 'object') return false;\n\
\n\
      // Objects with different constructors are not equivalent, but `Object`s or `Array`s\n\
      // from different frames are.\n\
      var aCtor = a.constructor, bCtor = b.constructor;\n\
      if (aCtor !== bCtor && !(_.isFunction(aCtor) && aCtor instanceof aCtor &&\n\
                               _.isFunction(bCtor) && bCtor instanceof bCtor)\n\
                          && ('constructor' in a && 'constructor' in b)) {\n\
        return false;\n\
      }\n\
    }\n\
    // Assume equality for cyclic structures. The algorithm for detecting cyclic\n\
    // structures is adapted from ES 5.1 section 15.12.3, abstract operation `JO`.\n\
    var length = aStack.length;\n\
    while (length--) {\n\
      // Linear search. Performance is inversely proportional to the number of\n\
      // unique nested structures.\n\
      if (aStack[length] === a) return bStack[length] === b;\n\
    }\n\
\n\
    // Add the first object to the stack of traversed objects.\n\
    aStack.push(a);\n\
    bStack.push(b);\n\
\n\
    // Recursively compare objects and arrays.\n\
    if (areArrays) {\n\
      // Compare array lengths to determine if a deep comparison is necessary.\n\
      length = a.length;\n\
      if (length !== b.length) return false;\n\
      // Deep compare the contents, ignoring non-numeric properties.\n\
      while (length--) {\n\
        if (!(eq(a[length], b[length], aStack, bStack))) return false;\n\
      }\n\
    } else {\n\
      // Deep compare objects.\n\
      var keys = _.keys(a), key;\n\
      length = keys.length;\n\
      // Ensure that both objects contain the same number of properties before comparing deep equality.\n\
      if (_.keys(b).length !== length) return false;\n\
      while (length--) {\n\
        // Deep compare each member\n\
        key = keys[length];\n\
        if (!(_.has(b, key) && eq(a[key], b[key], aStack, bStack))) return false;\n\
      }\n\
    }\n\
    // Remove the first object from the stack of traversed objects.\n\
    aStack.pop();\n\
    bStack.pop();\n\
    return true;\n\
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
    if (_.isArray(obj) || _.isString(obj) || _.isArguments(obj)) return obj.length === 0;\n\
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
    return toString.call(obj) === '[object Array]';\n\
  };\n\
\n\
  // Is a given variable an object?\n\
  _.isObject = function(obj) {\n\
    var type = typeof obj;\n\
    return type === 'function' || type === 'object' && !!obj;\n\
  };\n\
\n\
  // Add some isType methods: isArguments, isFunction, isString, isNumber, isDate, isRegExp, isError.\n\
  _.each(['Arguments', 'Function', 'String', 'Number', 'Date', 'RegExp', 'Error'], function(name) {\n\
    _['is' + name] = function(obj) {\n\
      return toString.call(obj) === '[object ' + name + ']';\n\
    };\n\
  });\n\
\n\
  // Define a fallback version of the method in browsers (ahem, IE < 9), where\n\
  // there isn't any inspectable \"Arguments\" type.\n\
  if (!_.isArguments(arguments)) {\n\
    _.isArguments = function(obj) {\n\
      return _.has(obj, 'callee');\n\
    };\n\
  }\n\
\n\
  // Optimize `isFunction` if appropriate. Work around an IE 11 bug.\n\
  if (typeof /./ !== 'function') {\n\
    _.isFunction = function(obj) {\n\
      return typeof obj == 'function' || false;\n\
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
    return _.isNumber(obj) && obj !== +obj;\n\
  };\n\
\n\
  // Is a given value a boolean?\n\
  _.isBoolean = function(obj) {\n\
    return obj === true || obj === false || toString.call(obj) === '[object Boolean]';\n\
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
    return obj != null && hasOwnProperty.call(obj, key);\n\
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
  // Keep the identity function around for default iteratees.\n\
  _.identity = function(value) {\n\
    return value;\n\
  };\n\
\n\
  // Predicate-generating functions. Often useful outside of Underscore.\n\
  _.constant = function(value) {\n\
    return function() {\n\
      return value;\n\
    };\n\
  };\n\
\n\
  _.noop = function(){};\n\
\n\
  _.property = function(key) {\n\
    return function(obj) {\n\
      return obj == null ? void 0 : obj[key];\n\
    };\n\
  };\n\
\n\
  // Generates a function for a given object that returns a given property (including those of ancestors)\n\
  _.propertyOf = function(obj) {\n\
    return obj == null ? function(){} : function(key) {\n\
      return obj[key];\n\
    };\n\
  };\n\
\n\
  // Returns a predicate for checking whether an object has a given set of `key:value` pairs.\n\
  _.matches = function(attrs) {\n\
    var pairs = _.pairs(attrs), length = pairs.length;\n\
    return function(obj) {\n\
      if (obj == null) return !length;\n\
      obj = new Object(obj);\n\
      for (var i = 0; i < length; i++) {\n\
        var pair = pairs[i], key = pair[0];\n\
        if (pair[1] !== obj[key] || !(key in obj)) return false;\n\
      }\n\
      return true;\n\
    };\n\
  };\n\
\n\
  // Run a function **n** times.\n\
  _.times = function(n, iteratee, context) {\n\
    var accum = Array(Math.max(0, n));\n\
    iteratee = optimizeCb(iteratee, context, 1);\n\
    for (var i = 0; i < n; i++) accum[i] = iteratee(i);\n\
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
  _.now = Date.now || function() {\n\
    return new Date().getTime();\n\
  };\n\
\n\
   // List of HTML entities for escaping.\n\
  var escapeMap = {\n\
    '&': '&amp;',\n\
    '<': '&lt;',\n\
    '>': '&gt;',\n\
    '\"': '&quot;',\n\
    \"'\": '&#x27;',\n\
    '`': '&#x60;'\n\
  };\n\
  var unescapeMap = _.invert(escapeMap);\n\
\n\
  // Functions for escaping and unescaping strings to/from HTML interpolation.\n\
  var createEscaper = function(map) {\n\
    var escaper = function(match) {\n\
      return map[match];\n\
    };\n\
    // Regexes for identifying a key that needs to be escaped\n\
    var source = '(?:' + _.keys(map).join('|') + ')';\n\
    var testRegexp = RegExp(source);\n\
    var replaceRegexp = RegExp(source, 'g');\n\
    return function(string) {\n\
      string = string == null ? '' : '' + string;\n\
      return testRegexp.test(string) ? string.replace(replaceRegexp, escaper) : string;\n\
    };\n\
  };\n\
  _.escape = createEscaper(escapeMap);\n\
  _.unescape = createEscaper(unescapeMap);\n\
\n\
  // If the value of the named `property` is a function then invoke it with the\n\
  // `object` as context; otherwise, return it.\n\
  _.result = function(object, property, fallback) {\n\
    var value = object == null ? void 0 : object[property];\n\
    if (value === void 0) {\n\
      value = fallback;\n\
    }\n\
    return _.isFunction(value) ? value.call(object) : value;\n\
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
    '\\u2028': 'u2028',\n\
    '\\u2029': 'u2029'\n\
  };\n\
\n\
  var escaper = /\\\\|'|\\r|\\n\
|\\u2028|\\u2029/g;\n\
\n\
  var escapeChar = function(match) {\n\
    return '\\\\' + escapes[match];\n\
  };\n\
\n\
  // JavaScript micro-templating, similar to John Resig's implementation.\n\
  // Underscore templating handles arbitrary delimiters, preserves whitespace,\n\
  // and correctly escapes quotes within interpolated code.\n\
  // NB: `oldSettings` only exists for backwards compatibility.\n\
  _.template = function(text, settings, oldSettings) {\n\
    if (!settings && oldSettings) settings = oldSettings;\n\
    settings = _.defaults({}, settings, _.templateSettings);\n\
\n\
    // Combine delimiters into one regular expression via alternation.\n\
    var matcher = RegExp([\n\
      (settings.escape || noMatch).source,\n\
      (settings.interpolate || noMatch).source,\n\
      (settings.evaluate || noMatch).source\n\
    ].join('|') + '|$', 'g');\n\
\n\
    // Compile the template source, escaping string literals appropriately.\n\
    var index = 0;\n\
    var source = \"__p+='\";\n\
    text.replace(matcher, function(match, escape, interpolate, evaluate, offset) {\n\
      source += text.slice(index, offset).replace(escaper, escapeChar);\n\
      index = offset + match.length;\n\
\n\
      if (escape) {\n\
        source += \"'+\\n\
((__t=(\" + escape + \"))==null?'':_.escape(__t))+\\n\
'\";\n\
      } else if (interpolate) {\n\
        source += \"'+\\n\
((__t=(\" + interpolate + \"))==null?'':__t)+\\n\
'\";\n\
      } else if (evaluate) {\n\
        source += \"';\\n\
\" + evaluate + \"\\n\
__p+='\";\n\
      }\n\
\n\
      // Adobe VMs need the match returned to produce the correct offest.\n\
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
      source + 'return __p;\\n\
';\n\
\n\
    try {\n\
      var render = new Function(settings.variable || 'obj', '_', source);\n\
    } catch (e) {\n\
      e.source = source;\n\
      throw e;\n\
    }\n\
\n\
    var template = function(data) {\n\
      return render.call(this, data, _);\n\
    };\n\
\n\
    // Provide the compiled source as a convenience for precompilation.\n\
    var argument = settings.variable || 'obj';\n\
    template.source = 'function(' + argument + '){\\n\
' + source + '}';\n\
\n\
    return template;\n\
  };\n\
\n\
  // Add a \"chain\" function. Start chaining a wrapped Underscore object.\n\
  _.chain = function(obj) {\n\
    var instance = _(obj);\n\
    instance._chain = true;\n\
    return instance;\n\
  };\n\
\n\
  // OOP\n\
  // ---------------\n\
  // If Underscore is called as a function, it returns a wrapped object that\n\
  // can be used OO-style. This wrapper holds altered versions of all the\n\
  // underscore functions. Wrapped objects may be chained.\n\
\n\
  // Helper function to continue chaining intermediate results.\n\
  var result = function(instance, obj) {\n\
    return instance._chain ? _(obj).chain() : obj;\n\
  };\n\
\n\
  // Add your own custom functions to the Underscore object.\n\
  _.mixin = function(obj) {\n\
    _.each(_.functions(obj), function(name) {\n\
      var func = _[name] = obj[name];\n\
      _.prototype[name] = function() {\n\
        var args = [this._wrapped];\n\
        push.apply(args, arguments);\n\
        return result(this, func.apply(_, args));\n\
      };\n\
    });\n\
  };\n\
\n\
  // Add all of the Underscore functions to the wrapper object.\n\
  _.mixin(_);\n\
\n\
  // Add all mutator Array functions to the wrapper.\n\
  _.each(['pop', 'push', 'reverse', 'shift', 'sort', 'splice', 'unshift'], function(name) {\n\
    var method = ArrayProto[name];\n\
    _.prototype[name] = function() {\n\
      var obj = this._wrapped;\n\
      method.apply(obj, arguments);\n\
      if ((name === 'shift' || name === 'splice') && obj.length === 0) delete obj[0];\n\
      return result(this, obj);\n\
    };\n\
  });\n\
\n\
  // Add all accessor Array functions to the wrapper.\n\
  _.each(['concat', 'join', 'slice'], function(name) {\n\
    var method = ArrayProto[name];\n\
    _.prototype[name] = function() {\n\
      return result(this, method.apply(this._wrapped, arguments));\n\
    };\n\
  });\n\
\n\
  // Extracts the result from a wrapped and chained object.\n\
  _.prototype.value = function() {\n\
    return this._wrapped;\n\
  };\n\
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
}.call(this));\n\
//@ sourceURL=jashkenas-underscore/underscore.js"
));
require.register("jashkenas-backbone/backbone.js", Function("exports, require, module",
"//     Backbone.js 1.1.2\n\
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
  var slice = array.slice;\n\
\n\
  // Current version of the library. Keep in sync with `package.json`.\n\
  Backbone.VERSION = '1.1.2';\n\
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
  // `application/json` requests ... this will encode the body as\n\
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
      if (!this._events || !eventsApi(this, 'off', name, [callback, context])) return this;\n\
\n\
      // Remove all callbacks for all events.\n\
      if (!name && !callback && !context) {\n\
        this._events = void 0;\n\
        return this;\n\
      }\n\
\n\
      var names = name ? [name] : _.keys(this._events);\n\
      for (var i = 0, length = names.length; i < length; i++) {\n\
        name = names[i];\n\
\n\
        // Bail out if there are no events stored.\n\
        var events = this._events[name];\n\
        if (!events) continue;\n\
\n\
        // Remove all callbacks for this event.\n\
        if (!callback && !context) {\n\
          delete this._events[name];\n\
          continue;\n\
        }\n\
\n\
        // Find any remaining events.\n\
        var remaining = [];\n\
        for (var j = 0, k = events.length; j < k; j++) {\n\
          var event = events[j];\n\
          if (\n\
            callback && callback !== event.callback &&\n\
            callback !== event.callback._callback ||\n\
            context && context !== event.context\n\
          ) {\n\
            remaining.push(event);\n\
          }\n\
        }\n\
\n\
        // Replace events if there are any remaining.  Otherwise, clean up.\n\
        if (remaining.length) {\n\
          this._events[name] = remaining;\n\
        } else {\n\
          delete this._events[name];\n\
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
    // Inversion-of-control versions of `on` and `once`. Tell *this* object to\n\
    // listen to an event in another object ... keeping track of what it's\n\
    // listening to.\n\
    listenTo: function(obj, name, callback) {\n\
      var listeningTo = this._listeningTo || (this._listeningTo = {});\n\
      var id = obj._listenId || (obj._listenId = _.uniqueId('l'));\n\
      listeningTo[id] = obj;\n\
      if (!callback && typeof name === 'object') callback = this;\n\
      obj.on(name, callback, this);\n\
      return this;\n\
    },\n\
\n\
    listenToOnce: function(obj, name, callback) {\n\
      if (typeof name === 'object') {\n\
        for (var event in name) this.listenToOnce(obj, event, name[event]);\n\
        return this;\n\
      }\n\
      var cb = _.once(function() {\n\
        this.stopListening(obj, name, cb);\n\
        callback.apply(this, arguments);\n\
      });\n\
      cb._callback = callback;\n\
      return this.listenTo(obj, name, cb);\n\
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
      for (var i = 0, length = names.length; i < length; i++) {\n\
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
        for (var i = 0, length = changes.length; i < length; i++) {\n\
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
      if (method === 'patch' && !options.attrs) options.attrs = attrs;\n\
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
        model.stopListening();\n\
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
  var modelMethods = ['keys', 'values', 'pairs', 'invert', 'pick', 'omit', 'chain', 'isEmpty'];\n\
\n\
  // Mix in each Underscore method as a proxy to `Model#attributes`.\n\
  _.each(modelMethods, function(method) {\n\
    if (!_[method]) return;\n\
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
  // more analogous to a table full of data ... or a small slice or page of that\n\
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
      for (var i = 0, length = models.length; i < length; i++) {\n\
        var model = models[i] = this.get(models[i]);\n\
        if (!model) continue;\n\
        var id = this.modelId(model.attributes);\n\
        if (id != null) delete this._byId[id];\n\
        delete this._byId[model.cid];\n\
        var index = this.indexOf(model);\n\
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
      models = singular ? (models ? [models] : []) : models.slice();\n\
      var id, model, attrs, existing, sort;\n\
      var at = options.at;\n\
      if (at < 0) at += this.length + 1;\n\
      var sortable = this.comparator && (at == null) && options.sort !== false;\n\
      var sortAttr = _.isString(this.comparator) ? this.comparator : null;\n\
      var toAdd = [], toRemove = [], modelMap = {};\n\
      var add = options.add, merge = options.merge, remove = options.remove;\n\
      var order = !sortable && add && remove ? [] : false;\n\
      var orderChanged = false;\n\
\n\
      // Turn bare objects into model references, and prevent invalid models\n\
      // from being added.\n\
      for (var i = 0, length = models.length; i < length; i++) {\n\
        attrs = models[i];\n\
\n\
        // If a duplicate is found, prevent it from being added and\n\
        // optionally merge it into the existing model.\n\
        if (existing = this.get(attrs)) {\n\
          if (remove) modelMap[existing.cid] = true;\n\
          if (merge && attrs !== existing) {\n\
            attrs = this._isModel(attrs) ? attrs.attributes : attrs;\n\
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
        if (!model) continue;\n\
        id = this.modelId(model.attributes);\n\
        if (order && (model.isNew() || !modelMap[id])) {\n\
          order.push(model);\n\
\n\
          // Check to see if this is actually a new model at this index.\n\
          orderChanged = orderChanged || !this.models[i] || model.cid !== this.models[i].cid;\n\
        }\n\
\n\
        modelMap[id] = true;\n\
      }\n\
\n\
      // Remove nonexistent models if appropriate.\n\
      if (remove) {\n\
        for (var i = 0, length = this.length; i < length; i++) {\n\
          if (!modelMap[(model = this.models[i]).cid]) toRemove.push(model);\n\
        }\n\
        if (toRemove.length) this.remove(toRemove, options);\n\
      }\n\
\n\
      // See if sorting is needed, update `length` and splice in new models.\n\
      if (toAdd.length || orderChanged) {\n\
        if (sortable) sort = true;\n\
        this.length += toAdd.length;\n\
        if (at != null) {\n\
          for (var i = 0, length = toAdd.length; i < length; i++) {\n\
            this.models.splice(at + i, 0, toAdd[i]);\n\
          }\n\
        } else {\n\
          if (order) this.models.length = 0;\n\
          var orderedModels = order || toAdd;\n\
          for (var i = 0, length = orderedModels.length; i < length; i++) {\n\
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
        var addOpts = at != null ? _.clone(options) : options;\n\
        for (var i = 0, length = toAdd.length; i < length; i++) {\n\
          if (at != null) addOpts.index = at + i;\n\
          (model = toAdd[i]).trigger('add', model, this, addOpts);\n\
        }\n\
        if (sort || orderChanged) this.trigger('sort', this, options);\n\
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
      options = options ? _.clone(options) : {};\n\
      for (var i = 0, length = this.models.length; i < length; i++) {\n\
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
      var id = this.modelId(this._isModel(obj) ? obj.attributes : obj);\n\
      return this._byId[obj] || this._byId[id] || this._byId[obj.cid];\n\
    },\n\
\n\
    // Get the model at the given index.\n\
    at: function(index) {\n\
      if (index < 0) index += this.length;\n\
      return this.models[index];\n\
    },\n\
\n\
    // Return models with matching attributes. Useful for simple cases of\n\
    // `filter`.\n\
    where: function(attrs, first) {\n\
      var matches = _.matches(attrs);\n\
      return this[first ? 'find' : 'filter'](function(model) {\n\
        return matches(model.attributes);\n\
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
      return new this.constructor(this.models, {\n\
        model: this.model,\n\
        comparator: this.comparator\n\
      });\n\
    },\n\
\n\
    // Define how to uniquely identify models in the collection.\n\
    modelId: function (attrs) {\n\
      return attrs[this.model.prototype.idAttribute || 'id'];\n\
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
      if (this._isModel(attrs)) {\n\
        if (!attrs.collection) attrs.collection = this;\n\
        return attrs;\n\
      }\n\
      options = options ? _.clone(options) : {};\n\
      options.collection = this;\n\
      var model = new this.model(attrs, options);\n\
      if (!model.validationError) return model;\n\
      this.trigger('invalid', this, model.validationError, options);\n\
      return false;\n\
    },\n\
\n\
    // Method for checking whether an object should be considered a model for\n\
    // the purposes of adding to the collection.\n\
    _isModel: function (model) {\n\
      return model instanceof Model;\n\
    },\n\
\n\
    // Internal method to create a model's ties to a collection.\n\
    _addReference: function(model, options) {\n\
      this._byId[model.cid] = model;\n\
      var id = this.modelId(model.attributes);\n\
      if (id != null) this._byId[id] = model;\n\
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
      if (event === 'change') {\n\
        var prevId = this.modelId(model.previousAttributes());\n\
        var id = this.modelId(model.attributes);\n\
        if (prevId !== id) {\n\
          if (prevId != null) delete this._byId[prevId];\n\
          if (id != null) this._byId[id] = model;\n\
        }\n\
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
    'lastIndexOf', 'isEmpty', 'chain', 'sample', 'partition'];\n\
\n\
  // Mix in each Underscore method as a proxy to `Collection#models`.\n\
  _.each(methods, function(method) {\n\
    if (!_[method]) return;\n\
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
    if (!_[method]) return;\n\
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
      this._removeElement();\n\
      this.stopListening();\n\
      return this;\n\
    },\n\
\n\
    // Remove this view's element from the document and all event listeners\n\
    // attached to it. Exposed for subclasses using an alternative DOM\n\
    // manipulation API.\n\
    _removeElement: function() {\n\
      this.$el.remove();\n\
    },\n\
\n\
    // Change the view's element (`this.el` property) and re-delegate the\n\
    // view's events on the new element.\n\
    setElement: function(element) {\n\
      this.undelegateEvents();\n\
      this._setElement(element);\n\
      this.delegateEvents();\n\
      return this;\n\
    },\n\
\n\
    // Creates the `this.el` and `this.$el` references for this view using the\n\
    // given `el`. `el` can be a CSS selector or an HTML string, a jQuery\n\
    // context or an element. Subclasses can override this to utilize an\n\
    // alternative DOM manipulation API and are only required to set the\n\
    // `this.el` property.\n\
    _setElement: function(el) {\n\
      this.$el = el instanceof Backbone.$ ? el : Backbone.$(el);\n\
      this.el = this.$el[0];\n\
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
    delegateEvents: function(events) {\n\
      if (!(events || (events = _.result(this, 'events')))) return this;\n\
      this.undelegateEvents();\n\
      for (var key in events) {\n\
        var method = events[key];\n\
        if (!_.isFunction(method)) method = this[events[key]];\n\
        if (!method) continue;\n\
        var match = key.match(delegateEventSplitter);\n\
        this.delegate(match[1], match[2], _.bind(method, this));\n\
      }\n\
      return this;\n\
    },\n\
\n\
    // Add a single event listener to the view's element (or a child element\n\
    // using `selector`). This only works for delegate-able events: not `focus`,\n\
    // `blur`, and not `change`, `submit`, and `reset` in Internet Explorer.\n\
    delegate: function(eventName, selector, listener) {\n\
      this.$el.on(eventName + '.delegateEvents' + this.cid, selector, listener);\n\
    },\n\
\n\
    // Clears all callbacks previously bound to the view by `delegateEvents`.\n\
    // You usually don't need to use this, but may wish to if you have multiple\n\
    // Backbone views attached to the same DOM element.\n\
    undelegateEvents: function() {\n\
      if (this.$el) this.$el.off('.delegateEvents' + this.cid);\n\
      return this;\n\
    },\n\
\n\
    // A finer-grained `undelegateEvents` for removing a single delegated event.\n\
    // `selector` and `listener` are both optional.\n\
    undelegate: function(eventName, selector, listener) {\n\
      this.$el.off(eventName + '.delegateEvents' + this.cid, selector, listener);\n\
    },\n\
\n\
    // Produces a DOM element to be assigned to your view. Exposed for\n\
    // subclasses using an alternative DOM manipulation API.\n\
    _createElement: function(tagName) {\n\
      return document.createElement(tagName);\n\
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
        this.setElement(this._createElement(_.result(this, 'tagName')));\n\
        this._setAttributes(attrs);\n\
      } else {\n\
        this.setElement(_.result(this, 'el'));\n\
      }\n\
    },\n\
\n\
    // Set attributes from a hash on this view's element.  Exposed for\n\
    // subclasses using an alternative DOM manipulation API.\n\
    _setAttributes: function(attributes) {\n\
      this.$el.attr(attributes);\n\
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
    // Pass along `textStatus` and `errorThrown` from jQuery.\n\
    var error = options.error;\n\
    options.error = function(xhr, textStatus, errorThrown) {\n\
      options.textStatus = textStatus;\n\
      options.errorThrown = errorThrown;\n\
      if (error) error.apply(this, arguments);\n\
    };\n\
\n\
    // Make the request, allowing the user to override any Ajax options.\n\
    var xhr = options.xhr = Backbone.ajax(_.extend(params, options));\n\
    model.trigger('request', model, xhr, options);\n\
    return xhr;\n\
  };\n\
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
        if (router.execute(callback, args, name) !== false) {\n\
          router.trigger.apply(router, ['route:' + name].concat(args));\n\
          router.trigger('route', name, args);\n\
          Backbone.history.trigger('route', router, name, args);\n\
        }\n\
      });\n\
      return this;\n\
    },\n\
\n\
    // Execute a route handler with the provided parameters.  This is an\n\
    // excellent place to do pre-route setup or post-route cleanup.\n\
    execute: function(callback, args, name) {\n\
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
      var path = this.location.pathname.replace(/[^\\/]$/, '$&/');\n\
      return path === this.root && !this.getSearch();\n\
    },\n\
\n\
    // In IE6, the hash fragment and search params are incorrect if the\n\
    // fragment contains `?`.\n\
    getSearch: function() {\n\
      var match = this.location.href.replace(/#.*/, '').match(/\\?.+/);\n\
      return match ? match[0] : '';\n\
    },\n\
\n\
    // Gets the true hash value. Cannot use location.hash directly due to bug\n\
    // in Firefox where location.hash will always be decoded.\n\
    getHash: function(window) {\n\
      var match = (window || this).location.href.match(/#(.*)$/);\n\
      return match ? match[1] : '';\n\
    },\n\
\n\
    // Get the pathname and search params, without the root.\n\
    getPath: function() {\n\
      var path = decodeURI(this.location.pathname + this.getSearch());\n\
      var root = this.root.slice(0, -1);\n\
      if (!path.indexOf(root)) path = path.slice(root.length);\n\
      return path.charAt(0) === '/' ? path.slice(1) : path;\n\
    },\n\
\n\
    // Get the cross-browser normalized URL fragment from the path or hash.\n\
    getFragment: function(fragment) {\n\
      if (fragment == null) {\n\
        if (this._hasPushState || !this._wantsHashChange) {\n\
          fragment = this.getPath();\n\
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
      if (History.started) throw new Error('Backbone.history has already been started');\n\
      History.started = true;\n\
\n\
      // Figure out the initial configuration. Do we need an iframe?\n\
      // Is pushState desired ... is it available?\n\
      this.options          = _.extend({root: '/'}, this.options, options);\n\
      this.root             = this.options.root;\n\
      this._wantsHashChange = this.options.hashChange !== false;\n\
      this._hasHashChange   = 'onhashchange' in window;\n\
      this._wantsPushState  = !!this.options.pushState;\n\
      this._hasPushState    = !!(this.options.pushState && this.history && this.history.pushState);\n\
      this.fragment         = this.getFragment();\n\
\n\
      // Normalize root to always include a leading and trailing slash.\n\
      this.root = ('/' + this.root + '/').replace(rootStripper, '/');\n\
\n\
      // Transition from hashChange to pushState or vice versa if both are\n\
      // requested.\n\
      if (this._wantsHashChange && this._wantsPushState) {\n\
\n\
        // If we've started off with a route from a `pushState`-enabled\n\
        // browser, but we're currently in a browser that doesn't support it...\n\
        if (!this._hasPushState && !this.atRoot()) {\n\
          var root = this.root.slice(0, -1) || '/';\n\
          this.location.replace(root + '#' + this.getPath());\n\
          // Return immediately as browser will do redirect to new url\n\
          return true;\n\
\n\
        // Or if we've started out with a hash-based route, but we're currently\n\
        // in a browser where it could be `pushState`-based instead...\n\
        } else if (this._hasPushState && this.atRoot()) {\n\
          this.navigate(this.getHash(), {replace: true});\n\
        }\n\
\n\
      }\n\
\n\
      // Proxy an iframe to handle location events if the browser doesn't\n\
      // support the `hashchange` event, HTML5 history, or the user wants\n\
      // `hashChange` but not `pushState`.\n\
      if (!this._hasHashChange && this._wantsHashChange && (!this._wantsPushState || !this._hasPushState)) {\n\
        var iframe = document.createElement('iframe');\n\
        iframe.src = 'javascript:0';\n\
        iframe.style.display = 'none';\n\
        iframe.tabIndex = -1;\n\
        var body = document.body;\n\
        // Using `appendChild` will throw on IE < 9 if the document is not ready.\n\
        this.iframe = body.insertBefore(iframe, body.firstChild).contentWindow;\n\
        this.iframe.document.open().close();\n\
        this.iframe.location.hash = '#' + this.fragment;\n\
      }\n\
\n\
      // Add a cross-platform `addEventListener` shim for older browsers.\n\
      var addEventListener = window.addEventListener || function (eventName, listener) {\n\
        return attachEvent('on' + eventName, listener);\n\
      };\n\
\n\
      // Depending on whether we're using pushState or hashes, and whether\n\
      // 'onhashchange' is supported, determine how we check the URL state.\n\
      if (this._hasPushState) {\n\
        addEventListener('popstate', this.checkUrl, false);\n\
      } else if (this._wantsHashChange && this._hasHashChange && !this.iframe) {\n\
        addEventListener('hashchange', this.checkUrl, false);\n\
      } else if (this._wantsHashChange) {\n\
        this._checkUrlInterval = setInterval(this.checkUrl, this.interval);\n\
      }\n\
\n\
      if (!this.options.silent) return this.loadUrl();\n\
    },\n\
\n\
    // Disable Backbone.history, perhaps temporarily. Not useful in a real app,\n\
    // but possibly useful for unit testing Routers.\n\
    stop: function() {\n\
      // Add a cross-platform `removeEventListener` shim for older browsers.\n\
      var removeEventListener = window.removeEventListener || function (eventName, listener) {\n\
        return detachEvent('on' + eventName, listener);\n\
      };\n\
\n\
      // Remove window listeners.\n\
      if (this._hasPushState) {\n\
        removeEventListener('popstate', this.checkUrl, false);\n\
      } else if (this._wantsHashChange && this._hasHashChange && !this.iframe) {\n\
        removeEventListener('hashchange', this.checkUrl, false);\n\
      }\n\
\n\
      // Clean up the iframe if necessary.\n\
      if (this.iframe) {\n\
        document.body.removeChild(this.iframe.frameElement);\n\
        this.iframe = null;\n\
      }\n\
\n\
      // Some environments will throw when clearing an undefined interval.\n\
      if (this._checkUrlInterval) clearInterval(this._checkUrlInterval);\n\
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
\n\
      // If the user pressed the back button, the iframe's hash will have\n\
      // changed and we should use that for comparison.\n\
      if (current === this.fragment && this.iframe) {\n\
        current = this.getHash(this.iframe);\n\
      }\n\
\n\
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
      // Normalize the fragment.\n\
      fragment = this.getFragment(fragment || '');\n\
\n\
      // Don't include a trailing slash on the root.\n\
      var root = this.root;\n\
      if (fragment === '' || fragment.charAt(0) === '?') {\n\
        root = root.slice(0, -1) || '/';\n\
      }\n\
      var url = root + fragment;\n\
\n\
      // Strip the hash and decode for matching.\n\
      fragment = decodeURI(fragment.replace(pathStripper, ''));\n\
\n\
      if (this.fragment === fragment) return;\n\
      this.fragment = fragment;\n\
\n\
      // If pushState is available, we use it to set the fragment as a real URL.\n\
      if (this._hasPushState) {\n\
        this.history[options.replace ? 'replaceState' : 'pushState']({}, document.title, url);\n\
\n\
      // If hash changes haven't been explicitly disabled, update the hash\n\
      // fragment to store history.\n\
      } else if (this._wantsHashChange) {\n\
        this._updateHash(this.location, fragment, options.replace);\n\
        if (this.iframe && (fragment !== this.getHash(this.iframe))) {\n\
          // Opening and closing the iframe tricks IE7 and earlier to push a\n\
          // history entry on hash-tag change.  When replace is true, we don't\n\
          // want this.\n\
          if (!options.replace) this.iframe.document.open().close();\n\
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
require.register("lodash-lodash/dist/lodash.compat.js", Function("exports, require, module",
"/**\n\
 * @license\n\
 * Lo-Dash 3.0.0-pre (Custom Build) <https://lodash.com/>\n\
 * Build: `lodash -o ./dist/lodash.compat.js`\n\
 * Copyright 2012-2014 The Dojo Foundation <http://dojofoundation.org/>\n\
 * Based on Underscore.js 1.7.0 <http://underscorejs.org/LICENSE>\n\
 * Copyright 2009-2014 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors\n\
 * Available under MIT license <https://lodash.com/license>\n\
 */\n\
;(function() {\n\
\n\
  /** Used as a safe reference for `undefined` in pre ES5 environments. */\n\
  var undefined;\n\
\n\
  /** Used as the semantic version number. */\n\
  var VERSION = '3.0.0-pre';\n\
\n\
  /** Used to compose bitmasks for wrapper metadata. */\n\
  var BIND_FLAG = 1,\n\
      BIND_KEY_FLAG = 2,\n\
      CURRY_BOUND_FLAG = 4,\n\
      CURRY_FLAG = 8,\n\
      CURRY_RIGHT_FLAG = 16,\n\
      PARTIAL_FLAG = 32,\n\
      PARTIAL_RIGHT_FLAG = 64,\n\
      ARY_FLAG = 128,\n\
      REARG_FLAG = 256;\n\
\n\
  /** Used as default options for `_.trunc`. */\n\
  var DEFAULT_TRUNC_LENGTH = 30,\n\
      DEFAULT_TRUNC_OMISSION = '...';\n\
\n\
  /** Used to detect when a function becomes hot. */\n\
  var HOT_COUNT = 150,\n\
      HOT_SPAN = 16;\n\
\n\
  /** Used to indicate the type of lazy iteratees. */\n\
  var LAZY_FILTER_FLAG = 0,\n\
      LAZY_MAP_FLAG = 1,\n\
      LAZY_WHILE_FLAG = 2;\n\
\n\
  /** Used as the `TypeError` message for \"Functions\" methods. */\n\
  var FUNC_ERROR_TEXT = 'Expected a function';\n\
\n\
  /** Used as the internal argument placeholder. */\n\
  var PLACEHOLDER = '__lodash_placeholder__';\n\
\n\
  /** Used to generate unique IDs. */\n\
  var idCounter = 0;\n\
\n\
  /** Used to match empty string literals in compiled template source. */\n\
  var reEmptyStringLeading = /\\b__p \\+= '';/g,\n\
      reEmptyStringMiddle = /\\b(__p \\+=) '' \\+/g,\n\
      reEmptyStringTrailing = /(__e\\(.*?\\)|\\b__t\\)) \\+\\n\
'';/g;\n\
\n\
  /** Used to match HTML entities and HTML characters. */\n\
  var reEscapedHtml = /&(?:amp|lt|gt|quot|#39|#96);/g,\n\
      reUnescapedHtml = /[&<>\"'`]/g;\n\
\n\
  /** Used to match template delimiters. */\n\
  var reEscape = /<%-([\\s\\S]+?)%>/g,\n\
      reEvaluate = /<%([\\s\\S]+?)%>/g,\n\
      reInterpolate = /<%=([\\s\\S]+?)%>/g;\n\
\n\
  /**\n\
   * Used to match ES6 template delimiters.\n\
   * See the [ES6 spec](http://people.mozilla.org/~jorendorff/es6-draft.html#sec-template-literal-lexical-components)\n\
   * for more details.\n\
   */\n\
  var reEsTemplate = /\\$\\{([^\\\\}]*(?:\\\\.[^\\\\}]*)*)\\}/g;\n\
\n\
  /** Used to match `RegExp` flags from their coerced string values. */\n\
  var reFlags = /\\w*$/;\n\
\n\
  /** Used to detect named functions. */\n\
  var reFuncName = /^\\s*function[ \\n\
\\r\\t]+\\w/;\n\
\n\
  /** Used to detect hexadecimal string values. */\n\
  var reHexPrefix = /^0[xX]/;\n\
\n\
  /** Used to detect host constructors (Safari > 5). */\n\
  var reHostCtor = /^\\[object .+?Constructor\\]$/;\n\
\n\
  /** Used to match latin-1 supplement letters (excluding mathematical operators). */\n\
  var reLatin1 = /[\\xc0-\\xd6\\xd8-\\xde\\xdf-\\xf6\\xf8-\\xff]/g;\n\
\n\
  /** Used to ensure capturing order of template delimiters. */\n\
  var reNoMatch = /($^)/;\n\
\n\
  /**\n\
   * Used to match `RegExp` special characters.\n\
   * See this [article on `RegExp` characters](http://www.regular-expressions.info/characters.html#special)\n\
   * for more details.\n\
   */\n\
  var reRegExpChars = /[.*+?^${}()|[\\]\\/\\\\]/g;\n\
\n\
  /** Used to detect functions containing a `this` reference. */\n\
  var reThis = /\\bthis\\b/;\n\
\n\
  /** Used to match unescaped characters in compiled string literals. */\n\
  var reUnescapedString = /['\\n\
\\r\\u2028\\u2029\\\\]/g;\n\
\n\
  /** Used to match words to create compound words. */\n\
  var reWords = (function() {\n\
    var upper = '[A-Z\\\\xc0-\\\\xd6\\\\xd8-\\\\xde]',\n\
        lower = '[a-z\\\\xdf-\\\\xf6\\\\xf8-\\\\xff]+';\n\
\n\
    return RegExp(upper + '{2,}(?=' + upper + lower + ')|' + upper + '?' + lower + '|' + upper + '+|[0-9]+', 'g');\n\
  }());\n\
\n\
  /** Used to detect and test for whitespace. */\n\
  var whitespace = (\n\
    // Basic whitespace characters.\n\
    ' \\t\\x0b\\f\\xa0\\ufeff' +\n\
\n\
    // Line terminators.\n\
    '\\n\
\\r\\u2028\\u2029' +\n\
\n\
    // Unicode category \"Zs\" space separators.\n\
    '\\u1680\\u180e\\u2000\\u2001\\u2002\\u2003\\u2004\\u2005\\u2006\\u2007\\u2008\\u2009\\u200a\\u202f\\u205f\\u3000'\n\
  );\n\
\n\
  /** Used to assign default `context` object properties. */\n\
  var contextProps = [\n\
    'Array', 'ArrayBuffer', 'Date', 'Error', 'Float32Array', 'Float64Array',\n\
    'Function', 'Int8Array', 'Int16Array', 'Int32Array', 'Math', 'Number',\n\
    'Object', 'RegExp', 'Set', 'String', '_', 'clearTimeout', 'document',\n\
    'isFinite', 'parseInt', 'setTimeout', 'TypeError', 'Uint8Array',\n\
    'Uint8ClampedArray', 'Uint16Array', 'Uint32Array', 'WeakMap',\n\
    'window', 'WinRTError'\n\
  ];\n\
\n\
  /** Used to fix the JScript `[[DontEnum]]` bug. */\n\
  var shadowProps = [\n\
    'constructor', 'hasOwnProperty', 'isPrototypeOf', 'propertyIsEnumerable',\n\
    'toLocaleString', 'toString', 'valueOf'\n\
  ];\n\
\n\
  /** Used to make template sourceURLs easier to identify. */\n\
  var templateCounter = -1;\n\
\n\
  /** `Object#toString` result references. */\n\
  var argsClass = '[object Arguments]',\n\
      arrayClass = '[object Array]',\n\
      boolClass = '[object Boolean]',\n\
      dateClass = '[object Date]',\n\
      errorClass = '[object Error]',\n\
      funcClass = '[object Function]',\n\
      mapClass = '[object Map]',\n\
      numberClass = '[object Number]',\n\
      objectClass = '[object Object]',\n\
      regexpClass = '[object RegExp]',\n\
      setClass = '[object Set]',\n\
      stringClass = '[object String]',\n\
      weakMapClass = '[object WeakMap]';\n\
\n\
  var arrayBufferClass = '[object ArrayBuffer]',\n\
      float32Class = '[object Float32Array]',\n\
      float64Class = '[object Float64Array]',\n\
      int8Class = '[object Int8Array]',\n\
      int16Class = '[object Int16Array]',\n\
      int32Class = '[object Int32Array]',\n\
      uint8Class = '[object Uint8Array]',\n\
      uint8ClampedClass = '[object Uint8ClampedArray]',\n\
      uint16Class = '[object Uint16Array]',\n\
      uint32Class = '[object Uint32Array]';\n\
\n\
  /** Used to identify object classifications that are treated like arrays. */\n\
  var arrayLikeClasses = {};\n\
  arrayLikeClasses[argsClass] =\n\
  arrayLikeClasses[arrayClass] = arrayLikeClasses[float32Class] =\n\
  arrayLikeClasses[float64Class] = arrayLikeClasses[int8Class] =\n\
  arrayLikeClasses[int16Class] = arrayLikeClasses[int32Class] =\n\
  arrayLikeClasses[uint8Class] = arrayLikeClasses[uint8ClampedClass] =\n\
  arrayLikeClasses[uint16Class] = arrayLikeClasses[uint32Class] = true;\n\
  arrayLikeClasses[arrayBufferClass] = arrayLikeClasses[boolClass] =\n\
  arrayLikeClasses[dateClass] = arrayLikeClasses[errorClass] =\n\
  arrayLikeClasses[funcClass] = arrayLikeClasses[mapClass] =\n\
  arrayLikeClasses[numberClass] = arrayLikeClasses[objectClass] =\n\
  arrayLikeClasses[regexpClass] = arrayLikeClasses[setClass] =\n\
  arrayLikeClasses[stringClass] = arrayLikeClasses[weakMapClass] = false;\n\
\n\
  /** Used to identify object classifications that `_.clone` supports. */\n\
  var cloneableClasses = {};\n\
  cloneableClasses[argsClass] = cloneableClasses[arrayClass] =\n\
  cloneableClasses[arrayBufferClass] = cloneableClasses[boolClass] =\n\
  cloneableClasses[dateClass] = cloneableClasses[float32Class] =\n\
  cloneableClasses[float64Class] = cloneableClasses[int8Class] =\n\
  cloneableClasses[int16Class] = cloneableClasses[int32Class] =\n\
  cloneableClasses[numberClass] = cloneableClasses[objectClass] =\n\
  cloneableClasses[regexpClass] = cloneableClasses[stringClass] =\n\
  cloneableClasses[uint8Class] = cloneableClasses[uint8ClampedClass] =\n\
  cloneableClasses[uint16Class] = cloneableClasses[uint32Class] = true;\n\
  cloneableClasses[errorClass] =\n\
  cloneableClasses[funcClass] = cloneableClasses[mapClass] =\n\
  cloneableClasses[setClass] = cloneableClasses[weakMapClass] = false;\n\
\n\
  /** Used as an internal `_.debounce` options object by `_.throttle`. */\n\
  var debounceOptions = {\n\
    'leading': false,\n\
    'maxWait': 0,\n\
    'trailing': false\n\
  };\n\
\n\
  /** Used to map latin-1 supplementary letters to basic latin letters. */\n\
  var deburredLetters = {\n\
    '\\xc0': 'A',  '\\xc1': 'A', '\\xc2': 'A', '\\xc3': 'A', '\\xc4': 'A', '\\xc5': 'A',\n\
    '\\xe0': 'a',  '\\xe1': 'a', '\\xe2': 'a', '\\xe3': 'a', '\\xe4': 'a', '\\xe5': 'a',\n\
    '\\xc7': 'C',  '\\xe7': 'c',\n\
    '\\xd0': 'D',  '\\xf0': 'd',\n\
    '\\xc8': 'E',  '\\xc9': 'E', '\\xca': 'E', '\\xcb': 'E',\n\
    '\\xe8': 'e',  '\\xe9': 'e', '\\xea': 'e', '\\xeb': 'e',\n\
    '\\xcC': 'I',  '\\xcd': 'I', '\\xce': 'I', '\\xcf': 'I',\n\
    '\\xeC': 'i',  '\\xed': 'i', '\\xee': 'i', '\\xef': 'i',\n\
    '\\xd1': 'N',  '\\xf1': 'n',\n\
    '\\xd2': 'O',  '\\xd3': 'O', '\\xd4': 'O', '\\xd5': 'O', '\\xd6': 'O', '\\xd8': 'O',\n\
    '\\xf2': 'o',  '\\xf3': 'o', '\\xf4': 'o', '\\xf5': 'o', '\\xf6': 'o', '\\xf8': 'o',\n\
    '\\xd9': 'U',  '\\xda': 'U', '\\xdb': 'U', '\\xdc': 'U',\n\
    '\\xf9': 'u',  '\\xfa': 'u', '\\xfb': 'u', '\\xfc': 'u',\n\
    '\\xdd': 'Y',  '\\xfd': 'y', '\\xff': 'y',\n\
    '\\xc6': 'Ae', '\\xe6': 'ae',\n\
    '\\xde': 'Th', '\\xfe': 'th',\n\
    '\\xdf': 'ss'\n\
  };\n\
\n\
  /** Used to map characters to HTML entities. */\n\
  var htmlEscapes = {\n\
    '&': '&amp;',\n\
    '<': '&lt;',\n\
    '>': '&gt;',\n\
    '\"': '&quot;',\n\
    \"'\": '&#39;',\n\
    '`': '&#96;'\n\
  };\n\
\n\
  /** Used to map HTML entities to characters. */\n\
  var htmlUnescapes = {\n\
    '&amp;': '&',\n\
    '&lt;': '<',\n\
    '&gt;': '>',\n\
    '&quot;': '\"',\n\
    '&#39;': \"'\",\n\
    '&#96;': '`'\n\
  };\n\
\n\
  /** Used to determine if values are of the language type `Object`. */\n\
  var objectTypes = {\n\
    'function': true,\n\
    'object': true\n\
  };\n\
\n\
  /** Used to escape characters for inclusion in compiled string literals. */\n\
  var stringEscapes = {\n\
    '\\\\': '\\\\',\n\
    \"'\": \"'\",\n\
    '\\n\
': 'n',\n\
    '\\r': 'r',\n\
    '\\u2028': 'u2028',\n\
    '\\u2029': 'u2029'\n\
  };\n\
\n\
  /**\n\
   * Used as a reference to the global object.\n\
   *\n\
   * The `this` value is used if it is the global object to avoid Greasemonkey's\n\
   * restricted `window` object, otherwise the `window` object is used.\n\
   */\n\
  var root = (objectTypes[typeof window] && window !== (this && this.window)) ? window : this;\n\
\n\
  /** Detect free variable `exports`. */\n\
  var freeExports = objectTypes[typeof exports] && exports && !exports.nodeType && exports;\n\
\n\
  /** Detect free variable `module`. */\n\
  var freeModule = objectTypes[typeof module] && module && !module.nodeType && module;\n\
\n\
  /** Detect free variable `global` from Node.js or Browserified code and use it as `root`. */\n\
  var freeGlobal = freeExports && freeModule && typeof global == 'object' && global;\n\
  if (freeGlobal && (freeGlobal.global === freeGlobal || freeGlobal.window === freeGlobal || freeGlobal.self === freeGlobal)) {\n\
    root = freeGlobal;\n\
  }\n\
\n\
  /** Detect the popular CommonJS extension `module.exports`. */\n\
  var moduleExports = freeModule && freeModule.exports === freeExports && freeExports;\n\
\n\
  /*--------------------------------------------------------------------------*/\n\
\n\
  /**\n\
   * A specialized version of `_.forEach` for arrays without support for\n\
   * callback shorthands or `this` binding.\n\
   *\n\
   * @private\n\
   * @param {Array} array The array to iterate over.\n\
   * @param {Function} iteratee The function invoked per iteration.\n\
   * @returns {Array} Returns `array`.\n\
   */\n\
  function arrayEach(array, iteratee) {\n\
    var index = -1,\n\
        length = array.length;\n\
\n\
    while (++index < length) {\n\
      if (iteratee(array[index], index, array) === false) {\n\
        break;\n\
      }\n\
    }\n\
    return array;\n\
  }\n\
\n\
  /**\n\
   * A specialized version of `_.forEachRight` for arrays without support for\n\
   * callback shorthands or `this` binding.\n\
   *\n\
   * @private\n\
   * @param {Array} array The array to iterate over.\n\
   * @param {Function} iteratee The function invoked per iteration.\n\
   * @returns {Array} Returns `array`.\n\
   */\n\
  function arrayEachRight(array, iteratee) {\n\
    var length = array.length;\n\
\n\
    while (length--) {\n\
      if (iteratee(array[length], length, array) === false) {\n\
        break;\n\
      }\n\
    }\n\
    return array;\n\
  }\n\
\n\
  /**\n\
   * A specialized version of `_.every` for arrays without support for callback\n\
   * shorthands or `this` binding.\n\
   *\n\
   * @private\n\
   * @param {Array} array The array to iterate over.\n\
   * @param {Function} predicate The function invoked per iteration.\n\
   * @returns {Array} Returns `true` if all elements pass the predicate check,\n\
   *  else `false`\n\
   */\n\
  function arrayEvery(array, predicate) {\n\
    var index = -1,\n\
        length = array.length;\n\
\n\
    while (++index < length) {\n\
      if (!predicate(array[index], index, array)) {\n\
        return false;\n\
      }\n\
    }\n\
    return true;\n\
  }\n\
\n\
  /**\n\
   * A specialized version of `_.filter` for arrays without support for callback\n\
   * shorthands or `this` binding.\n\
   *\n\
   * @private\n\
   * @param {Array} array The array to iterate over.\n\
   * @param {Function} predicate The function invoked per iteration.\n\
   * @returns {Array} Returns the new filtered array.\n\
   */\n\
  function arrayFilter(array, predicate) {\n\
    var index = -1,\n\
        length = array.length,\n\
        resIndex = -1,\n\
        result = [];\n\
\n\
    while (++index < length) {\n\
      var value = array[index];\n\
      if (predicate(value, index, array)) {\n\
        result[++resIndex] = value;\n\
      }\n\
    }\n\
    return result;\n\
  }\n\
\n\
  /**\n\
   * A specialized version of `_.map` for arrays without support for callback\n\
   * shorthands or `this` binding.\n\
   *\n\
   * @private\n\
   * @param {Array} array The array to iterate over.\n\
   * @param {Function} iteratee The function invoked per iteration.\n\
   * @returns {Array} Returns the new mapped array.\n\
   */\n\
  function arrayMap(array, iteratee) {\n\
    var index = -1,\n\
        length = array.length,\n\
        result = Array(length);\n\
\n\
    while (++index < length) {\n\
      result[index] = iteratee(array[index], index, array);\n\
    }\n\
    return result;\n\
  }\n\
\n\
  /**\n\
   * A specialized version of `_.reduce` for arrays without support for callback\n\
   * shorthands or `this` binding.\n\
   *\n\
   * @private\n\
   * @param {Array} array The array to iterate over.\n\
   * @param {Function} iteratee The function invoked per iteration.\n\
   * @param {*} [accumulator] The initial value.\n\
   * @param {boolean} [initFromArray=false] Specify using the first element of\n\
   *  `array` as the initial value.\n\
   * @returns {*} Returns the accumulated value.\n\
   */\n\
  function arrayReduce(array, iteratee, accumulator, initFromArray) {\n\
    var index = -1,\n\
        length = array.length;\n\
\n\
    if (initFromArray && length) {\n\
      accumulator = array[++index];\n\
    }\n\
    while (++index < length) {\n\
      accumulator = iteratee(accumulator, array[index], index, array);\n\
    }\n\
    return accumulator;\n\
  }\n\
\n\
  /**\n\
   * A specialized version of `_.reduceRight` for arrays without support for\n\
   * callback shorthands or `this` binding.\n\
   *\n\
   * @private\n\
   * @param {Array} array The array to iterate over.\n\
   * @param {Function} iteratee The function invoked per iteration.\n\
   * @param {*} [accumulator] The initial value.\n\
   * @param {boolean} [initFromArray=false] Specify using the last element of\n\
   *  `array` as the initial value.\n\
   * @returns {*} Returns the accumulated value.\n\
   */\n\
  function arrayReduceRight(array, iteratee, accumulator, initFromArray) {\n\
    var length = array.length;\n\
\n\
    if (initFromArray && length) {\n\
      accumulator = array[--length];\n\
    }\n\
    while (length--) {\n\
      accumulator = iteratee(accumulator, array[length], length, array);\n\
    }\n\
    return accumulator;\n\
  }\n\
\n\
  /**\n\
   * A specialized version of `_.some` for arrays without support for callback\n\
   * shorthands or `this` binding.\n\
   *\n\
   * @private\n\
   * @param {Array} array The array to iterate over.\n\
   * @param {Function} predicate The function invoked per iteration.\n\
   * @returns {boolean} Returns `true` if any element passes the predicate check,\n\
   *  else `false`.\n\
   */\n\
  function arraySome(array, predicate) {\n\
    var index = -1,\n\
        length = array.length;\n\
\n\
    while (++index < length) {\n\
      if (predicate(array[index], index, array)) {\n\
        return true;\n\
      }\n\
    }\n\
    return false;\n\
  }\n\
\n\
  /**\n\
   * The base implementation of `compareAscending` which compares values and\n\
   * sorts them in ascending order without guaranteeing a stable sort.\n\
   *\n\
   * @private\n\
   * @param {*} value The value to compare to `other`.\n\
   * @param {*} other The value to compare to `value`.\n\
   * @returns {number} Returns the sort order indicator for `value`.\n\
   */\n\
  function baseCompareAscending(value, other) {\n\
    if (value !== other) {\n\
      var valIsReflexive = value === value,\n\
          othIsReflexive = other === other;\n\
\n\
      if (value > other || !valIsReflexive || (typeof value == 'undefined' && othIsReflexive)) {\n\
        return 1;\n\
      }\n\
      if (value < other || !othIsReflexive || (typeof other == 'undefined' && valIsReflexive)) {\n\
        return -1;\n\
      }\n\
    }\n\
    return 0;\n\
  }\n\
\n\
  /**\n\
   * The base implementation of `_.indexOf` without support for `fromIndex`\n\
   * bounds checks and binary searches.\n\
   *\n\
   * @private\n\
   * @param {Array} array The array to search.\n\
   * @param {*} value The value to search for.\n\
   * @param {number} [fromIndex=0] The index to search from.\n\
   * @returns {number} Returns the index of the matched value, else `-1`.\n\
   */\n\
  function baseIndexOf(array, value, fromIndex) {\n\
    if (value !== value) {\n\
      return indexOfNaN(array, fromIndex);\n\
    }\n\
    var index = (fromIndex || 0) - 1,\n\
        length = array.length;\n\
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
   * The base implementation of `_.slice` without support for `start` and `end`\n\
   * arguments.\n\
   *\n\
   * @private\n\
   * @param {Array} array The array to slice.\n\
   * @returns {Array} Returns the slice of `array`.\n\
   */\n\
  function baseSlice(array) {\n\
    var index = -1,\n\
        length = array ? array.length : 0,\n\
        result = Array(length);\n\
\n\
    while (++index < length) {\n\
      result[index] = array[index];\n\
    }\n\
    return result;\n\
  }\n\
\n\
  /**\n\
   * The base implementation of `_.sortBy` and `_.sortByAll` which uses `comparer`\n\
   * to define the sort order of `array` and replaces criteria objects with their\n\
   * corresponding values.\n\
   *\n\
   * @private\n\
   * @param {Array} array The array to sort.\n\
   * @param {Function} comparer The function to define sort order.\n\
   * @returns {Array} Returns `array`.\n\
   */\n\
  function baseSortBy(array, comparer) {\n\
    var length = array.length;\n\
\n\
    array.sort(comparer);\n\
    while (length--) {\n\
      array[length] = array[length].value;\n\
    }\n\
    return array;\n\
  }\n\
\n\
  /**\n\
   * Used by `_.max` and `_.min` as the default callback for string values.\n\
   *\n\
   * @private\n\
   * @param {string} string The string to inspect.\n\
   * @returns {number} Returns the code unit of the first character of the string.\n\
   */\n\
  function charAtCallback(string) {\n\
    return string.charCodeAt(0);\n\
  }\n\
\n\
  /**\n\
   * Used by `_.trim` and `_.trimLeft` to get the index of the first character\n\
   * of `string` that is not found in `chars`.\n\
   *\n\
   * @private\n\
   * @param {string} string The string to inspect.\n\
   * @param {string} chars The characters to find.\n\
   * @returns {number} Returns the index of the first character not found in `chars`.\n\
   */\n\
  function charsLeftIndex(string, chars) {\n\
    var index = -1,\n\
        length = string.length;\n\
\n\
    while (++index < length && chars.indexOf(string.charAt(index)) > -1) {}\n\
    return index;\n\
  }\n\
\n\
  /**\n\
   * Used by `_.trim` and `_.trimRight` to get the index of the last character\n\
   * of `string` that is not found in `chars`.\n\
   *\n\
   * @private\n\
   * @param {string} string The string to inspect.\n\
   * @param {string} chars The characters to find.\n\
   * @returns {number} Returns the index of the last character not found in `chars`.\n\
   */\n\
  function charsRightIndex(string, chars) {\n\
    var index = string.length;\n\
\n\
    while (index-- && chars.indexOf(string.charAt(index)) > -1) {}\n\
    return index;\n\
  }\n\
\n\
  /**\n\
   * Used by `_.sortBy` to compare transformed elements of a collection and stable\n\
   * sort them in ascending order.\n\
   *\n\
   * @private\n\
   * @param {Object} object The object to compare to `other`.\n\
   * @param {Object} other The object to compare to `object`.\n\
   * @returns {number} Returns the sort order indicator for `object`.\n\
   */\n\
  function compareAscending(object, other) {\n\
    return baseCompareAscending(object.criteria, other.criteria) || (object.index - other.index);\n\
  }\n\
\n\
  /**\n\
   * Used by `_.sortByAll` to compare multiple properties of each element\n\
   * in a collection and stable sort them in ascending order.\n\
   *\n\
   * @private\n\
   * @param {Object} object The object to compare to `other`.\n\
   * @param {Object} other The object to compare to `object`.\n\
   * @returns {number} Returns the sort order indicator for `object`.\n\
   */\n\
  function compareMultipleAscending(object, other) {\n\
    var index = -1,\n\
        objCriteria = object.criteria,\n\
        othCriteria = other.criteria,\n\
        length = objCriteria.length;\n\
\n\
    while (++index < length) {\n\
      var result = baseCompareAscending(objCriteria[index], othCriteria[index]);\n\
      if (result) {\n\
        return result;\n\
      }\n\
    }\n\
    // Fixes an `Array#sort` bug in the JS engine embedded in Adobe applications\n\
    // that causes it, under certain circumstances, to provide the same value\n\
    // for `object` and `other`. See https://github.com/jashkenas/underscore/pull/1247.\n\
    //\n\
    // This also ensures a stable sort in V8 and other engines.\n\
    // See https://code.google.com/p/v8/issues/detail?id=90.\n\
    return object.index - other.index;\n\
  }\n\
\n\
  /**\n\
   * Used by `_.deburr` to convert latin-1 to basic latin letters.\n\
   *\n\
   * @private\n\
   * @param {string} letter The matched letter to deburr.\n\
   * @returns {string} Returns the deburred letter.\n\
   */\n\
  function deburrLetter(letter) {\n\
    return deburredLetters[letter];\n\
  }\n\
\n\
  /**\n\
   * Used by `_.escape` to convert characters to HTML entities.\n\
   *\n\
   * @private\n\
   * @param {string} chr The matched character to escape.\n\
   * @returns {string} Returns the escaped character.\n\
   */\n\
  function escapeHtmlChar(chr) {\n\
    return htmlEscapes[chr];\n\
  }\n\
\n\
  /**\n\
   * Used by `_.template` to escape characters for inclusion in compiled\n\
   * string literals.\n\
   *\n\
   * @private\n\
   * @param {string} chr The matched character to escape.\n\
   * @returns {string} Returns the escaped character.\n\
   */\n\
  function escapeStringChar(chr) {\n\
    return '\\\\' + stringEscapes[chr];\n\
  }\n\
\n\
  /**\n\
   * Gets the index at which the first occurrence of `NaN` is found in `array`.\n\
   * If `fromRight` is provided elements of `array` are iterated from right to left.\n\
   *\n\
   * @private\n\
   * @param {Array} array The array to search.\n\
   * @param {number} [fromIndex] The index to search from.\n\
   * @param {boolean} [fromRight=false] Specify iterating from right to left.\n\
   * @returns {number} Returns the index of the matched `NaN`, else `-1`.\n\
   */\n\
  function indexOfNaN(array, fromIndex, fromRight) {\n\
    var length = array.length,\n\
        index = fromRight ? (fromIndex || length) : ((fromIndex || 0) - 1);\n\
\n\
    while ((fromRight ? index-- : ++index < length)) {\n\
      var other = array[index];\n\
      if (other !== other) {\n\
        return index;\n\
      }\n\
    }\n\
    return -1;\n\
  }\n\
\n\
  /**\n\
   * Checks if `value` is a host object in IE < 9.\n\
   *\n\
   * @private\n\
   * @param {*} value The value to check.\n\
   * @returns {boolean} Returns `true` if `value` is a host object, else `false`.\n\
   */\n\
  var isHostObject = (function() {\n\
    try {\n\
      String({ 'toString': 0 } + '');\n\
    } catch(e) {\n\
      return function() { return false; };\n\
    }\n\
    return function(value) {\n\
      // IE < 9 presents many host objects as `Object` objects that can coerce\n\
      // to strings despite having improperly defined `toString` methods.\n\
      return typeof value.toString != 'function' && typeof (value + '') == 'string';\n\
    };\n\
  }());\n\
\n\
  /**\n\
   * Checks if `value` is valid array-like index.\n\
   *\n\
   * @private\n\
   * @param {*} value The value to check.\n\
   * @param {number} [length] The upper bound of a valid index.\n\
   * @returns {boolean} Returns `true` if `value` is a valid index, else `false`.\n\
   */\n\
  function isIndex(value, length) {\n\
    value = +value;\n\
    return value > -1 && value % 1 == 0 && (length == null || value < length);\n\
  }\n\
\n\
  /**\n\
   * Checks if `value` is object-like.\n\
   *\n\
   * @private\n\
   * @param {*} value The value to check.\n\
   * @returns {boolean} Returns `true` if `value` is object-like, else `false`.\n\
   */\n\
  function isObjectLike(value) {\n\
    return (value && typeof value == 'object') || false;\n\
  }\n\
\n\
  /**\n\
   * Used by `trimmedLeftIndex` and `trimmedRightIndex` to determine if a\n\
   * character code is whitespace.\n\
   *\n\
   * @private\n\
   * @param {number} charCode The character code to inspect.\n\
   * @returns {boolean} Returns `true` if `charCode` is whitespace, else `false`.\n\
   */\n\
  function isWhitespace(charCode) {\n\
    return ((charCode <= 160 && (charCode >= 9 && charCode <= 13) || charCode == 32 || charCode == 160) || charCode == 5760 || charCode == 6158 ||\n\
      (charCode >= 8192 && (charCode <= 8202 || charCode == 8232 || charCode == 8233 || charCode == 8239 || charCode == 8287 || charCode == 12288 || charCode == 65279)));\n\
  }\n\
\n\
  /**\n\
   * Replaces all `placeholder` elements in `array` with an internal placeholder\n\
   * and returns an array of their indexes.\n\
   *\n\
   * @private\n\
   * @param {Array} array The array to modify.\n\
   * @param {*} placeholder The placeholder to replace.\n\
   * @returns {Array} Returns the new array of placeholder indexes.\n\
   */\n\
  function replaceHolders(array, placeholder) {\n\
    var index = -1,\n\
        length = array.length,\n\
        resIndex = -1,\n\
        result = [];\n\
\n\
    while (++index < length) {\n\
      if (array[index] === placeholder) {\n\
        array[index] = PLACEHOLDER;\n\
        result[++resIndex] = index;\n\
      }\n\
    }\n\
    return result;\n\
  }\n\
\n\
  /**\n\
   * An implementation of `_.uniq` optimized for sorted arrays without support\n\
   * for callback shorthands and `this` binding.\n\
   *\n\
   * @private\n\
   * @param {Array} array The array to inspect.\n\
   * @param {Function} [iteratee] The function invoked per iteration.\n\
   * @returns {Array} Returns the new duplicate-value-free array.\n\
   */\n\
  function sortedUniq(array, iteratee) {\n\
    var seen,\n\
        index = -1,\n\
        length = array.length,\n\
        resIndex = -1,\n\
        result = [];\n\
\n\
    while (++index < length) {\n\
      var value = array[index],\n\
          computed = iteratee ? iteratee(value, index, array) : value;\n\
\n\
      if (!index || seen !== computed) {\n\
        seen = computed;\n\
        result[++resIndex] = value;\n\
      }\n\
    }\n\
    return result;\n\
  }\n\
\n\
  /**\n\
   * Used by `_.trim` and `_.trimLeft` to get the index of the first non-whitespace\n\
   * character of `string`.\n\
   *\n\
   * @private\n\
   * @param {string} string The string to inspect.\n\
   * @returns {number} Returns the index of the first non-whitespace character.\n\
   */\n\
  function trimmedLeftIndex(string) {\n\
    var index = -1,\n\
        length = string.length;\n\
\n\
    while (++index < length && isWhitespace(string.charCodeAt(index))) {}\n\
    return index;\n\
  }\n\
\n\
  /**\n\
   * Used by `_.trim` and `_.trimRight` to get the index of the last non-whitespace\n\
   * character of `string`.\n\
   *\n\
   * @private\n\
   * @param {string} string The string to inspect.\n\
   * @returns {number} Returns the index of the last non-whitespace character.\n\
   */\n\
  function trimmedRightIndex(string) {\n\
    var index = string.length;\n\
\n\
    while (index-- && isWhitespace(string.charCodeAt(index))) {}\n\
    return index;\n\
  }\n\
\n\
  /**\n\
   * Used by `_.unescape` to convert HTML entities to characters.\n\
   *\n\
   * @private\n\
   * @param {string} chr The matched character to unescape.\n\
   * @returns {string} Returns the unescaped character.\n\
   */\n\
  function unescapeHtmlChar(chr) {\n\
    return htmlUnescapes[chr];\n\
  }\n\
\n\
  /*--------------------------------------------------------------------------*/\n\
\n\
  /**\n\
   * Create a new pristine `lodash` function using the given `context` object.\n\
   *\n\
   * @static\n\
   * @memberOf _\n\
   * @category Utility\n\
   * @param {Object} [context=root] The context object.\n\
   * @returns {Function} Returns a new `lodash` function.\n\
   * @example\n\
   *\n\
   * _.mixin({ 'add': function(a, b) { return a + b; } }, false);\n\
   *\n\
   * var lodash = _.runInContext();\n\
   * lodash.mixin({ 'sub': function(a, b) { return a - b; } }, false);\n\
   *\n\
   * _.isFunction(_.add);\n\
   * // => true\n\
   *\n\
   * _.isFunction(_.sub);\n\
   * // => false\n\
   *\n\
   * lodash.isFunction(lodash.add);\n\
   * // => false\n\
   *\n\
   * lodash.isFunction(lodash.sub);\n\
   * // => true\n\
   */\n\
  function runInContext(context) {\n\
    // Avoid issues with some ES3 environments that attempt to use values, named\n\
    // after built-in constructors like `Object`, for the creation of literals.\n\
    // ES5 clears this up by stating that literals must use built-in constructors.\n\
    // See http://es5.github.io/#x11.1.5.\n\
    context = context ? _.defaults(root.Object(), context, _.pick(root, contextProps)) : root;\n\
\n\
    /** Native constructor references. */\n\
    var Array = context.Array,\n\
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
    /** Used for native method references. */\n\
    var arrayProto = Array.prototype,\n\
        errorProto = Error.prototype,\n\
        objectProto = Object.prototype,\n\
        stringProto = String.prototype;\n\
\n\
    /** Used to detect DOM support. */\n\
    var document = (document = context.window) && document.document;\n\
\n\
    /** Used to resolve the decompiled source of functions. */\n\
    var fnToString = Function.prototype.toString;\n\
\n\
    /** Used to check objects for own properties. */\n\
    var hasOwnProperty = objectProto.hasOwnProperty;\n\
\n\
    /** Used to restore the original `_` reference in `_.noConflict`. */\n\
    var oldDash = context._;\n\
\n\
    /** Used to resolve the internal `[[Class]]` of values. */\n\
    var toString = objectProto.toString;\n\
\n\
    /** Used to detect if a method is native. */\n\
    var reNative = RegExp('^' +\n\
      escapeRegExp(toString)\n\
      .replace(/toString|(function).*?(?=\\\\\\()| for .+?(?=\\\\\\])/g, '$1.*?') + '$'\n\
    );\n\
\n\
    /** Native method references. */\n\
    var ArrayBuffer = isNative(ArrayBuffer = context.ArrayBuffer) && ArrayBuffer,\n\
        bufferSlice = isNative(bufferSlice = ArrayBuffer && new ArrayBuffer(0).slice) && bufferSlice,\n\
        ceil = Math.ceil,\n\
        clearTimeout = context.clearTimeout,\n\
        floor = Math.floor,\n\
        getPrototypeOf = isNative(getPrototypeOf = Object.getPrototypeOf) && getPrototypeOf,\n\
        push = arrayProto.push,\n\
        propertyIsEnumerable = objectProto.propertyIsEnumerable,\n\
        Set = isNative(Set = context.Set) && Set,\n\
        setTimeout = context.setTimeout,\n\
        splice = arrayProto.splice,\n\
        Uint8Array = isNative(Uint8Array = context.Uint8Array) && Uint8Array,\n\
        unshift = arrayProto.unshift,\n\
        WeakMap = isNative(WeakMap = context.WeakMap) && WeakMap;\n\
\n\
    /** Used to clone array buffers. */\n\
    var Float64Array = (function() {\n\
      // Safari 5 errors when using an array buffer to initialize a typed array\n\
      // where the array buffer's `byteLength` is not a multiple of the typed\n\
      // array's `BYTES_PER_ELEMENT`.\n\
      try {\n\
        var func = isNative(func = context.Float64Array) && func,\n\
            result = new func(new ArrayBuffer(10), 0, 1) && func;\n\
      } catch(e) {}\n\
      return result;\n\
    }());\n\
\n\
    /* Native method references for those with the same name as other `lodash` methods. */\n\
    var nativeCreate = isNative(nativeCreate = Object.create) && nativeCreate,\n\
        nativeIsArray = isNative(nativeIsArray = Array.isArray) && nativeIsArray,\n\
        nativeIsFinite = context.isFinite,\n\
        nativeKeys = isNative(nativeKeys = Object.keys) && nativeKeys,\n\
        nativeMax = Math.max,\n\
        nativeMin = Math.min,\n\
        nativeNow = isNative(nativeNow = Date.now) && nativeNow,\n\
        nativeNumIsFinite = isNative(nativeNumIsFinite = Number.isFinite) && nativeNumIsFinite,\n\
        nativeParseInt = context.parseInt,\n\
        nativeRandom = Math.random;\n\
\n\
    /** Used as references for `-Infinity` and `Infinity`. */\n\
    var NEGATIVE_INFINITY = Number.NEGATIVE_INFINITY,\n\
        POSITIVE_INFINITY = Number.POSITIVE_INFINITY;\n\
\n\
    /** Used as references for the max length and index of an array. */\n\
    var MAX_ARRAY_LENGTH = Math.pow(2, 32) - 1,\n\
        MAX_ARRAY_INDEX =  MAX_ARRAY_LENGTH - 1;\n\
\n\
    /** Used as the size, in bytes, of each Float64Array element. */\n\
    var FLOAT64_BYTES_PER_ELEMENT = Float64Array ? Float64Array.BYTES_PER_ELEMENT : 0;\n\
\n\
    /**\n\
     * Used as the maximum length of an array-like value.\n\
     * See the [ES6 spec](http://people.mozilla.org/~jorendorff/es6-draft.html#sec-tolength)\n\
     * for more details.\n\
     */\n\
    var MAX_SAFE_INTEGER = Math.pow(2, 53) - 1;\n\
\n\
    /** Used to store function metadata. */\n\
    var metaMap = WeakMap && new WeakMap;\n\
\n\
    /** Used to lookup a built-in constructor by `[[Class]]`. */\n\
    var ctorByClass = {};\n\
    ctorByClass[float32Class] = context.Float32Array;\n\
    ctorByClass[float64Class] = context.Float64Array;\n\
    ctorByClass[int8Class] = context.Int8Array;\n\
    ctorByClass[int16Class] = context.Int16Array;\n\
    ctorByClass[int32Class] = context.Int32Array;\n\
    ctorByClass[uint8Class] = context.Uint8Array;\n\
    ctorByClass[uint8ClampedClass] = context.Uint8ClampedArray;\n\
    ctorByClass[uint16Class] = context.Uint16Array;\n\
    ctorByClass[uint32Class] = context.Uint32Array;\n\
\n\
    /** Used to avoid iterating over non-enumerable properties in IE < 9. */\n\
    var nonEnumProps = {};\n\
    nonEnumProps[arrayClass] = nonEnumProps[dateClass] = nonEnumProps[numberClass] = { 'constructor': true, 'toLocaleString': true, 'toString': true, 'valueOf': true };\n\
    nonEnumProps[boolClass] = nonEnumProps[stringClass] = { 'constructor': true, 'toString': true, 'valueOf': true };\n\
    nonEnumProps[errorClass] = nonEnumProps[funcClass] = nonEnumProps[regexpClass] = { 'constructor': true, 'toString': true };\n\
    nonEnumProps[objectClass] = { 'constructor': true };\n\
\n\
    arrayEach(shadowProps, function(key) {\n\
      for (var className in nonEnumProps) {\n\
        if (hasOwnProperty.call(nonEnumProps, className)) {\n\
          var props = nonEnumProps[className];\n\
          props[key] = hasOwnProperty.call(props, key);\n\
        }\n\
      }\n\
    });\n\
\n\
    /*------------------------------------------------------------------------*/\n\
\n\
    /**\n\
     * Creates a `lodash` object which wraps `value` to enable intuitive chaining.\n\
     * The execution of chained methods is deferred until `_#value` is implicitly\n\
     * or explicitly called. Explicit chaining may be enabled by using `_.chain`.\n\
     *\n\
     * Chaining is supported in custom builds as long as the `_#value` method is\n\
     * directly or indirectly included in the build.\n\
     *\n\
     * In addition to Lo-Dash methods, wrappers also have the following `Array` methods:\n\
     * `concat`, `join`, `pop`, `push`, `reverse`, `shift`, `slice`, `sort`, `splice`,\n\
     * and `unshift`\n\
     *\n\
     * The wrapper functions that are chainable by default are:\n\
     * `after`, `ary`, `assign`, `at`, `before`, `bind`, `bindAll`, `bindKey`,\n\
     * `callback`, `chain`, `chunk`, `compact`, `concat`, `constant`, `countBy`,\n\
     * `create`, `curry`, `debounce`, `defaults`, `defer`, `delay`, `difference`,\n\
     * `drop`, `dropRight`, `dropRightWhile`, `dropWhile`, `filter`, `flatten`,\n\
     * `flattenDeep`, `flow`, `flowRight`, `forEach`, `forEachRight`, `forIn`,\n\
     * `forInRight`, `forOwn`, `forOwnRight`, `functions`, `groupBy`, `indexBy`,\n\
     * `initial`, `intersection`, `invert`, `invoke`, `keys`, `keysIn`, `map`,\n\
     * `mapValues`, `matches`, `memoize`, `merge`, `mixin`, `negate`, `noop`,\n\
     * `omit`, `once`, `pairs`, `partial`, `partialRight`, `partition`, `pick`,\n\
     * `pluck`, `property`, `propertyOf`, `pull`, `pullAt`, `push`, `range`,\n\
     * `rearg`, `reject`, `remove`, `rest`, `reverse`, `shuffle`, `slice`, `sort`,\n\
     * `sortBy`, `sortByAll`, `splice`, `take`, `takeRight`, `takeRightWhile`,\n\
     * `takeWhile`, `tap`, `throttle`, `thru`, `times`, `toArray`, `transform`,\n\
     * `union`, `uniq`, `unshift`, `unzip`, `values`, `valuesIn`, `where`,\n\
     * `without`, `wrap`, `xor`, `zip`, and `zipObject`\n\
     *\n\
     * The wrapper functions that are non-chainable by default are:\n\
     * `attempt`, `camelCase`, `capitalize`, `clone`, `cloneDeep`, `deburr`,\n\
     * `endsWith`, `escape`, `escapeRegExp`, `every`, `find`, `findIndex`, `findKey`,\n\
     * `findLast`, `findLastIndex`, `findLastKey`, `findWhere`, `first`, `has`,\n\
     * `identity`, `includes`, `indexOf`, `isArguments`, `isArray`, `isBoolean`,\n\
     * `isDate`, `isElement`, `isEmpty`, `isEqual`, `isError`, `isFinite`,\n\
     * `isFunction`, `isNative`, `isNaN`, `isNull`, `isNumber`, `isObject`,\n\
     * `isPlainObject`, `isRegExp`, `isString`, `isUndefined`, `join`, `kebabCase`,\n\
     * `last`, `lastIndexOf`, `max`, `min`, `noConflict`, `now`, `pad`, `padLeft`,\n\
     * `padRight`, `parseInt`, `pop`, `random`, `reduce`, `reduceRight`, `repeat`,\n\
     * `result`, `runInContext`, `shift`, `size`, `snakeCase`, `some`, `sortedIndex`,\n\
     * `sortedLastIndex`, `startsWith`, `template`, `trim`, `trimLeft`, `trimRight`,\n\
     * `trunc`, `unescape`, `uniqueId`, `value`, and `words`\n\
     *\n\
     * The wrapper function `sample` will return a wrapped value when `n` is provided,\n\
     * otherwise an unwrapped value is returned.\n\
     *\n\
     * @name _\n\
     * @constructor\n\
     * @category Chain\n\
     * @param {*} value The value to wrap in a `lodash` instance.\n\
     * @returns {Object} Returns a `lodash` instance.\n\
     * @example\n\
     *\n\
     * var wrapped = _([1, 2, 3]);\n\
     *\n\
     * // returns an unwrapped value\n\
     * wrapped.reduce(function(sum, n) { return sum + n; });\n\
     * // => 6\n\
     *\n\
     * // returns a wrapped value\n\
     * var squares = wrapped.map(function(n) { return n * n; });\n\
     *\n\
     * _.isArray(squares);\n\
     * // => false\n\
     *\n\
     * _.isArray(squares.value());\n\
     * // => true\n\
     */\n\
    function lodash(value) {\n\
      if (isObjectLike(value) && !isArray(value)) {\n\
        if (value instanceof LodashWrapper) {\n\
          return value;\n\
        }\n\
        if (hasOwnProperty.call(value, '__wrapped__')) {\n\
          return new LodashWrapper(value.__wrapped__, value.__chain__, baseSlice(value.__actions__));\n\
        }\n\
      }\n\
      return new LodashWrapper(value);\n\
    }\n\
\n\
    /**\n\
     * The base constructor for creating `lodash` wrapper objects.\n\
     *\n\
     * @private\n\
     * @param {*} value The value to wrap.\n\
     * @param {boolean} [chainAll=false] Enable chaining for all wrapper methods.\n\
     * @param {Array} [actions=[]] Actions to peform to resolve the unwrapped value.\n\
     */\n\
    function LodashWrapper(value, chainAll, actions) {\n\
      this.__actions__ = actions || [];\n\
      this.__chain__ = !!chainAll;\n\
      this.__wrapped__ = value;\n\
    }\n\
\n\
    /**\n\
     * An object environment feature flags.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @type Object\n\
     */\n\
    var support = lodash.support = {};\n\
\n\
    (function(x) {\n\
      var Ctor = function() { this.x = 1; },\n\
          object = { '0': 1, 'length': 1 },\n\
          props = [];\n\
\n\
      Ctor.prototype = { 'valueOf': 1, 'y': 1 };\n\
      for (var key in new Ctor) { props.push(key); }\n\
\n\
      /**\n\
       * Detect if the `[[Class]]` of `arguments` objects is resolvable\n\
       * (all but Firefox < 4, IE < 9).\n\
       *\n\
       * @memberOf _.support\n\
       * @type boolean\n\
       */\n\
      support.argsClass = toString.call(arguments) == argsClass;\n\
\n\
      /**\n\
       * Detect if `name` or `message` properties of `Error.prototype` are\n\
       * enumerable by default (IE < 9, Safari < 5.1).\n\
       *\n\
       * @memberOf _.support\n\
       * @type boolean\n\
       */\n\
      support.enumErrorProps = propertyIsEnumerable.call(errorProto, 'message') ||\n\
        propertyIsEnumerable.call(errorProto, 'name');\n\
\n\
      /**\n\
       * Detect if `prototype` properties are enumerable by default.\n\
       *\n\
       * Firefox < 3.6, Opera > 9.50 - Opera < 11.60, and Safari < 5.1\n\
       * (if the prototype or a property on the prototype has been set)\n\
       * incorrectly set the `[[Enumerable]]` value of a function's `prototype`\n\
       * property to `true`.\n\
       *\n\
       * @memberOf _.support\n\
       * @type boolean\n\
       */\n\
      support.enumPrototypes = propertyIsEnumerable.call(Ctor, 'prototype');\n\
\n\
      /**\n\
       * Detect if functions can be decompiled by `Function#toString`\n\
       * (all but Firefox OS certified apps, older Opera mobile browsers, and\n\
       * the PlayStation 3; forced `false` for Windows 8 apps).\n\
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
       * Detect if the `[[Class]]` of DOM nodes is resolvable (all but IE < 9).\n\
       *\n\
       * @memberOf _.support\n\
       * @type boolean\n\
       */\n\
      support.nodeClass = toString.call(document) != objectClass;\n\
\n\
      /**\n\
       * Detect if string indexes are non-enumerable\n\
       * (IE < 9, RingoJS, Rhino, Narwhal).\n\
       *\n\
       * @memberOf _.support\n\
       * @type boolean\n\
       */\n\
      support.nonEnumStrings = !propertyIsEnumerable.call('x', 0);\n\
\n\
      /**\n\
       * Detect if properties shadowing those on `Object.prototype` are\n\
       * non-enumerable.\n\
       *\n\
       * In IE < 9 an object's own properties, shadowing non-enumerable ones,\n\
       * are made non-enumerable as well (a.k.a the JScript `[[DontEnum]]` bug).\n\
       *\n\
       * @memberOf _.support\n\
       * @type boolean\n\
       */\n\
      support.nonEnumShadows = !/valueOf/.test(props);\n\
\n\
      /**\n\
       * Detect if own properties are iterated after inherited properties (IE < 9).\n\
       *\n\
       * @memberOf _.support\n\
       * @type boolean\n\
       */\n\
      support.ownLast = props[0] != 'x';\n\
\n\
      /**\n\
       * Detect if `Array#shift` and `Array#splice` augment array-like objects\n\
       * correctly.\n\
       *\n\
       * Firefox < 10, compatibility modes of IE 8, and IE < 9 have buggy Array `shift()`\n\
       * and `splice()` functions that fail to remove the last element, `value[0]`,\n\
       * of array-like objects even though the `length` property is set to `0`.\n\
       * The `shift()` method is buggy in compatibility modes of IE 8, while `splice()`\n\
       * is buggy regardless of mode in IE < 9.\n\
       *\n\
       * @memberOf _.support\n\
       * @type boolean\n\
       */\n\
      support.spliceObjects = (splice.call(object, 0, 1), !object[0]);\n\
\n\
      /**\n\
       * Detect lack of support for accessing string characters by index.\n\
       *\n\
       * IE < 8 can't access characters by index. IE 8 can only access characters\n\
       * by index on string literals, not string objects.\n\
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
       * Detect if `arguments` object indexes are non-enumerable.\n\
       *\n\
       * In Firefox < 4, IE < 9, PhantomJS, and Safari < 5.1 `arguments` object\n\
       * indexes are non-enumerable. Chrome < 25 and Node.js < 0.11.0 treat\n\
       * `arguments` object indexes as non-enumerable and fail `hasOwnProperty`\n\
       * checks for indexes that exceed their function's formal parameters with\n\
       * associated values of `0`.\n\
       *\n\
       * @memberOf _.support\n\
       * @type boolean\n\
       */\n\
      try {\n\
        support.nonEnumArgs = !propertyIsEnumerable.call(arguments, 1);\n\
      } catch(e) {\n\
        support.nonEnumArgs = true;\n\
      }\n\
    }(0, 0));\n\
\n\
    /**\n\
     * By default, the template delimiters used by Lo-Dash are like those in\n\
     * embedded Ruby (ERB). Change the following template settings to use\n\
     * alternative delimiters.\n\
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
    /*------------------------------------------------------------------------*/\n\
\n\
    /**\n\
     * Creates a lazy wrapper object which wraps `value` to enable lazy evaluation.\n\
     *\n\
     * @private\n\
     * @param {*} value The value to wrap.\n\
     */\n\
    function LazyWrapper(value) {\n\
      this.actions = null;\n\
      this.dir = 1;\n\
      this.dropCount = 0;\n\
      this.filtered = false;\n\
      this.iteratees = null;\n\
      this.takeCount = POSITIVE_INFINITY;\n\
      this.views = null;\n\
      this.wrapped = value;\n\
    }\n\
\n\
    /**\n\
     * Creates a clone of the lazy wrapper object.\n\
     *\n\
     * @private\n\
     * @name clone\n\
     * @memberOf LazyWrapper\n\
     * @returns {Object} Returns the cloned `LazyWrapper` object.\n\
     */\n\
    function lazyClone() {\n\
      var actions = this.actions,\n\
          iteratees = this.iteratees,\n\
          views = this.views,\n\
          result = new LazyWrapper(this.wrapped);\n\
\n\
      result.actions = actions ? baseSlice(actions) : null;\n\
      result.dir = this.dir;\n\
      result.dropCount = this.dropCount;\n\
      result.filtered = this.filtered;\n\
      result.iteratees = iteratees ? baseSlice(iteratees) : null;\n\
      result.takeCount = this.takeCount;\n\
      result.views = views ? baseSlice(views) : null;\n\
      return result;\n\
    }\n\
\n\
    /**\n\
     * Reverses the direction of lazy iteration.\n\
     *\n\
     * @private\n\
     * @name reverse\n\
     * @memberOf LazyWrapper\n\
     * @returns {Object} Returns the new reversed `LazyWrapper` object.\n\
     */\n\
    function lazyReverse() {\n\
      var filtered = this.filtered,\n\
          result = filtered ? new LazyWrapper(this) : this.clone();\n\
\n\
      result.dir = this.dir * -1;\n\
      result.filtered = filtered;\n\
      return result;\n\
    }\n\
\n\
    /**\n\
     * Extracts the unwrapped value from its lazy wrapper.\n\
     *\n\
     * @private\n\
     * @name value\n\
     * @memberOf LazyWrapper\n\
     * @returns {*} Returns the unwrapped value.\n\
     */\n\
    function lazyValue() {\n\
      var array = this.wrapped.value();\n\
      if (!isArray(array)) {\n\
        return baseWrapperValue(array, this.actions);\n\
      }\n\
      var dir = this.dir,\n\
          isRight = dir < 0,\n\
          length = array.length,\n\
          view = getView(0, length, this.views),\n\
          start = view.start,\n\
          end = view.end,\n\
          dropCount = this.dropCount,\n\
          takeCount = nativeMin(end - start, this.takeCount - dropCount),\n\
          index = isRight ? end : start - 1,\n\
          iteratees = this.iteratees,\n\
          iterLength = iteratees ? iteratees.length : 0,\n\
          resIndex = 0,\n\
          result = [];\n\
\n\
      outer:\n\
      while (length-- && resIndex < takeCount) {\n\
        index += dir;\n\
\n\
        var iterIndex = -1,\n\
            value = array[index];\n\
\n\
        while (++iterIndex < iterLength) {\n\
          var data = iteratees[iterIndex],\n\
              iteratee = data.iteratee,\n\
              computed = iteratee(value, index, array),\n\
              type = data.type;\n\
\n\
          if (type == LAZY_MAP_FLAG) {\n\
            value = computed;\n\
          } else if (!computed) {\n\
            if (type == LAZY_FILTER_FLAG) {\n\
              continue outer;\n\
            } else {\n\
              break outer;\n\
            }\n\
          }\n\
        }\n\
        if (dropCount) {\n\
          dropCount--;\n\
        } else {\n\
          result[resIndex++] = value;\n\
        }\n\
      }\n\
      return isRight ? result.reverse() : result;\n\
    }\n\
\n\
    /*------------------------------------------------------------------------*/\n\
\n\
    /**\n\
     * Creates a cache object to store key/value pairs.\n\
     *\n\
     * @private\n\
     * @static\n\
     * @name Cache\n\
     * @memberOf _.memoize\n\
     */\n\
    function MapCache() {\n\
      this.__data__ = {};\n\
    }\n\
\n\
    /**\n\
     * Removes `key` and its value from the cache.\n\
     *\n\
     * @private\n\
     * @name delete\n\
     * @memberOf _.memoize.Cache\n\
     * @param {string} key The key of the value to remove.\n\
     * @returns {boolean} Returns `true` if the entry was removed successfully, else `false`.\n\
     */\n\
    function mapDelete(key) {\n\
      return this.has(key) && delete this.__data__[key];\n\
    }\n\
\n\
    /**\n\
     * Gets the cached value for `key`.\n\
     *\n\
     * @private\n\
     * @name get\n\
     * @memberOf _.memoize.Cache\n\
     * @param {string} key The key of the value to retrieve.\n\
     * @returns {*} Returns the cached value.\n\
     */\n\
    function mapGet(key) {\n\
      return key == '__proto__' ? undefined : this.__data__[key];\n\
    }\n\
\n\
    /**\n\
     * Checks if a cached value for `key` exists.\n\
     *\n\
     * @private\n\
     * @name has\n\
     * @memberOf _.memoize.Cache\n\
     * @param {string} key The name of the entry to check.\n\
     * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.\n\
     */\n\
    function mapHas(key) {\n\
      return key != '__proto__' && hasOwnProperty.call(this.__data__, key);\n\
    }\n\
\n\
    /**\n\
     * Adds `value` to `key` of the cache.\n\
     *\n\
     * @private\n\
     * @name set\n\
     * @memberOf _.memoize.Cache\n\
     * @param {string} key The key of the value to cache.\n\
     * @param {*} value The value to cache.\n\
     * @returns {Object} Returns the cache object.\n\
     */\n\
    function mapSet(key, value) {\n\
      if (key != '__proto__') {\n\
        this.__data__[key] = value;\n\
      }\n\
      return this;\n\
    }\n\
\n\
    /*------------------------------------------------------------------------*/\n\
\n\
    /**\n\
     *\n\
     * Creates a cache object to store unique values.\n\
     *\n\
     * @private\n\
     * @param {Array} [values] The values to cache.\n\
     */\n\
    function SetCache(values) {\n\
      var length = values ? values.length : 0;\n\
\n\
      this.data = { 'number': {}, 'set': new Set };\n\
      while (length--) {\n\
        this.push(values[length]);\n\
      }\n\
    }\n\
\n\
    /**\n\
     * Checks if `value` is in `cache` mimicking the return signature of\n\
     * `_.indexOf` by returning `0` if the value is found, else `-1`.\n\
     *\n\
     * @private\n\
     * @param {Object} cache The cache to search.\n\
     * @param {*} value The value to search for.\n\
     * @returns {number} Returns `0` if `value` is found, else `-1`.\n\
     */\n\
    function cacheIndexOf(cache, value) {\n\
      var type = typeof value,\n\
          data = cache.data,\n\
          result = type == 'number' ? data[type][value] : data.set.has(value);\n\
\n\
      return result ? 0 : -1;\n\
    }\n\
\n\
    /**\n\
     * Adds `value` to the cache.\n\
     *\n\
     * @private\n\
     * @name push\n\
     * @memberOf SetCache\n\
     * @param {*} value The value to cache.\n\
     */\n\
    function cachePush(value) {\n\
      var data = this.data,\n\
          type = typeof value;\n\
\n\
      if (type == 'number') {\n\
        data[type][value] = true;\n\
      } else {\n\
        data.set.add(value);\n\
      }\n\
    }\n\
\n\
    /*------------------------------------------------------------------------*/\n\
\n\
    /**\n\
     * A specialized version of `_.max` for arrays without support for iteratees.\n\
     *\n\
     * @private\n\
     * @param {Array} array The array to iterate over.\n\
     * @returns {*} Returns the maximum value.\n\
     */\n\
    function arrayMax(array) {\n\
      var index = -1,\n\
          length = array.length,\n\
          result = NEGATIVE_INFINITY;\n\
\n\
      while (++index < length) {\n\
        var value = array[index];\n\
        if (value > result) {\n\
          result = value;\n\
        }\n\
      }\n\
      return result;\n\
    }\n\
\n\
    /**\n\
     * A specialized version of `_.min` for arrays without support for iteratees.\n\
     *\n\
     * @private\n\
     * @param {Array} array The array to iterate over.\n\
     * @returns {*} Returns the minimum value.\n\
     */\n\
    function arrayMin(array) {\n\
      var index = -1,\n\
          length = array.length,\n\
          result = POSITIVE_INFINITY;\n\
\n\
      while (++index < length) {\n\
        var value = array[index];\n\
        if (value < result) {\n\
          result = value;\n\
        }\n\
      }\n\
      return result;\n\
    }\n\
\n\
    /**\n\
     * Used by `_.defaults` to customize its `_.assign` use.\n\
     *\n\
     * @private\n\
     * @param {*} objectValue The destination object property value.\n\
     * @param {*} sourceValue The source object property value.\n\
     * @returns {*} Returns the value to assign to the destination object.\n\
     */\n\
    function assignDefaults(objectValue, sourceValue) {\n\
      return typeof objectValue == 'undefined' ? sourceValue : objectValue;\n\
    }\n\
\n\
    /**\n\
     * Used by `_.template` to customize its `_.assign` use.\n\
     *\n\
     * **Note:** This method is like `assignDefaults` except that it ignores\n\
     * inherited property values when checking if a property is `undefined`.\n\
     *\n\
     * @private\n\
     * @param {*} objectValue The destination object property value.\n\
     * @param {*} sourceValue The source object property value.\n\
     * @param {string} key The key associated with the object and source values.\n\
     * @param {Object} object The destination object.\n\
     * @returns {*} Returns the value to assign to the destination object.\n\
     */\n\
    function assignOwnDefaults(objectValue, sourceValue, key, object) {\n\
      return (typeof objectValue == 'undefined' || !hasOwnProperty.call(object, key))\n\
        ? sourceValue\n\
        : objectValue;\n\
    }\n\
\n\
    /**\n\
     * The base implementation of `_.assign` without support for argument juggling,\n\
     * multiple sources, and `this` binding.\n\
     *\n\
     * @private\n\
     * @param {Object} object The destination object.\n\
     * @param {Object} source The source object.\n\
     * @param {Function} [customizer] The function to customize assigning values.\n\
     * @returns {Object} Returns the destination object.\n\
     */\n\
    function baseAssign(object, source, customizer) {\n\
      var index = -1,\n\
          props = keys(source),\n\
          length = props.length;\n\
\n\
      while (++index < length) {\n\
        var key = props[index];\n\
        object[key] = customizer\n\
          ? customizer(object[key], source[key], key, object, source)\n\
          : source[key];\n\
      }\n\
      return object;\n\
    }\n\
\n\
    /**\n\
     * The base implementation of `_.at` without support for strings and individual\n\
     * key arguments.\n\
     *\n\
     * @private\n\
     * @param {Array|Object} collection The collection to iterate over.\n\
     * @param {number[]|string[]} [props] The property names or indexes of elements to pick.\n\
     * @returns {Array} Returns the new array of picked elements.\n\
     */\n\
    function baseAt(collection, props) {\n\
      var index = -1,\n\
          length = collection ? collection.length : 0,\n\
          isArr = isLength(length),\n\
          propsLength = props.length,\n\
          result = Array(propsLength);\n\
\n\
      while(++index < propsLength) {\n\
        var key = props[index];\n\
        if (isArr) {\n\
          key = parseFloat(key);\n\
          result[index] = isIndex(key, length) ? collection[key] : undefined;\n\
        } else {\n\
          result[index] = collection[key];\n\
        }\n\
      }\n\
      return result;\n\
    }\n\
\n\
    /**\n\
     * The base implementation of `_.bindAll` without support for individual\n\
     * method name arguments.\n\
     *\n\
     * @private\n\
     * @param {Object} object The object to bind and assign the bound methods to.\n\
     * @param {string[]} methodNames The object method names to bind.\n\
     * @returns {Object} Returns `object`.\n\
     */\n\
    function baseBindAll(object, methodNames) {\n\
      var index = -1,\n\
          length = methodNames.length;\n\
\n\
      while (++index < length) {\n\
        var key = methodNames[index];\n\
        object[key] = createWrapper(object[key], BIND_FLAG, object);\n\
      }\n\
      return object;\n\
    }\n\
\n\
    /**\n\
     * The base implementation of `_.callback`.\n\
     *\n\
     * @private\n\
     * @param {*} [func=_.identity] The value to convert to a callback.\n\
     * @param {*} [thisArg] The `this` binding of the created callback.\n\
     * @param {number} [argCount] The number of arguments the callback accepts.\n\
     * @returns {Function} Returns the new function.\n\
     */\n\
    function baseCallback(func, thisArg, argCount) {\n\
      var type = typeof func;\n\
\n\
      if (type == 'function') {\n\
        if (typeof thisArg == 'undefined') {\n\
          return func;\n\
        }\n\
        var data = getData(func);\n\
        if (typeof data == 'undefined') {\n\
          var support = lodash.support;\n\
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
              // Check if `func` references the `this` keyword and store the result.\n\
              data = reThis.test(source) || isNative(func);\n\
              baseSetData(func, data);\n\
            }\n\
          }\n\
        }\n\
        // Exit early if there are no `this` references or `func` is bound.\n\
        if (data === false || (data !== true && data[1] & BIND_FLAG)) {\n\
          return func;\n\
        }\n\
        switch (argCount) {\n\
          case 1: return function(value) {\n\
            return func.call(thisArg, value);\n\
          };\n\
          case 3: return function(value, index, collection) {\n\
            return func.call(thisArg, value, index, collection);\n\
          };\n\
          case 4: return function(accumulator, value, index, collection) {\n\
            return func.call(thisArg, accumulator, value, index, collection);\n\
          };\n\
          case 5: return function(value, other, key, object, source) {\n\
            return func.call(thisArg, value, other, key, object, source);\n\
          };\n\
        }\n\
        return function() {\n\
          return func.apply(thisArg, arguments);\n\
        };\n\
      }\n\
      if (func == null) {\n\
        return identity;\n\
      }\n\
      // Handle \"_.pluck\" and \"_.where\" style callback shorthands.\n\
      return type == 'object' ? matches(func) : property(func);\n\
    }\n\
\n\
    /**\n\
     * The base implementation of `_.clone` without support for argument juggling\n\
     * and `this` binding.\n\
     *\n\
     * @private\n\
     * @param {*} value The value to clone.\n\
     * @param {boolean} [isDeep=false] Specify a deep clone.\n\
     * @param {Function} [customizer] The function to customize cloning values.\n\
     * @param {string} [key] The key of `value`.\n\
     * @param {Object} [object] The object `value` belongs to.\n\
     * @param {Array} [stackA=[]] Tracks traversed source objects.\n\
     * @param {Array} [stackB=[]] Associates clones with source counterparts.\n\
     * @returns {*} Returns the cloned value.\n\
     */\n\
    function baseClone(value, isDeep, customizer, key, object, stackA, stackB) {\n\
      var result;\n\
      if (customizer) {\n\
        result = object ? customizer(value, key, object) : customizer(value);\n\
      }\n\
      if (typeof result != 'undefined') {\n\
        return result;\n\
      }\n\
      var isArr = isArray(value);\n\
      result = value;\n\
      if (isArr) {\n\
        result = initArrayClone(value, isDeep);\n\
      } else if (isObject(value)) {\n\
        result = initObjectClone(value, isDeep);\n\
        if (result === null) {\n\
          isDeep = false;\n\
          result = {};\n\
        } else if (isDeep) {\n\
          isDeep = toString.call(result) == objectClass;\n\
        }\n\
      }\n\
      if (!isDeep || result === value) {\n\
        return result;\n\
      }\n\
      // Check for circular references and return corresponding clone.\n\
      stackA || (stackA = []);\n\
      stackB || (stackB = []);\n\
\n\
      var length = stackA.length;\n\
      while (length--) {\n\
        if (stackA[length] == value) {\n\
          return stackB[length];\n\
        }\n\
      }\n\
      // Add the source value to the stack of traversed objects and associate it with its clone.\n\
      stackA.push(value);\n\
      stackB.push(result);\n\
\n\
      // Recursively populate clone (susceptible to call stack limits).\n\
      (isArr ? arrayEach : baseForOwn)(value, function(subValue, key) {\n\
        result[key] = baseClone(subValue, isDeep, customizer, key, value, stackA, stackB);\n\
      });\n\
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
    // Fallback for environments without `Object.create`.\n\
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
     * The base implementation of `_.difference` which accepts a single array\n\
     * of values to exclude.\n\
     *\n\
     * @private\n\
     * @param {Array} array The array to inspect.\n\
     * @param {Array} values The values to exclude.\n\
     * @returns {Array} Returns the new array of filtered values.\n\
     */\n\
    function baseDifference(array, values) {\n\
      var length = array ? array.length : 0,\n\
          result = [];\n\
\n\
      if (!length) {\n\
        return result;\n\
      }\n\
      var index = -1,\n\
          indexOf = getIndexOf(),\n\
          isCommon = indexOf == baseIndexOf,\n\
          cache = isCommon && values.length >= 200 && createCache(values),\n\
          valuesLength = values.length;\n\
\n\
      if (cache) {\n\
        indexOf = cacheIndexOf;\n\
        isCommon = false;\n\
        values = cache;\n\
      }\n\
      outer:\n\
      while (++index < length) {\n\
        var value = array[index];\n\
\n\
        if (isCommon && value === value) {\n\
          var valuesIndex = valuesLength;\n\
          while (valuesIndex--) {\n\
            if (values[valuesIndex] === value) {\n\
              continue outer;\n\
            }\n\
          }\n\
          result.push(value);\n\
        }\n\
        else if (indexOf(values, value) < 0) {\n\
          result.push(value);\n\
        }\n\
      }\n\
      return result;\n\
    }\n\
\n\
    /**\n\
     * The base implementation of `_.forEach` without support for callback\n\
     * shorthands and `this` binding.\n\
     *\n\
     * @private\n\
     * @param {Array|Object|string} collection The collection to iterate over.\n\
     * @param {Function} iteratee The function invoked per iteration.\n\
     * @returns {Array|Object|string} Returns `collection`.\n\
     */\n\
    function baseEach(collection, iteratee) {\n\
      var length = collection ? collection.length : 0;\n\
      if (!isLength(length)) {\n\
        return baseForOwn(collection, iteratee);\n\
      }\n\
      var index = -1,\n\
          iterable = toObject(collection);\n\
\n\
      while (++index < length) {\n\
        if (iteratee(iterable[index], index, iterable) === false) {\n\
          break;\n\
        }\n\
      }\n\
      return collection;\n\
    }\n\
\n\
    /**\n\
     * The base implementation of `_.forEachRight` without support for callback\n\
     * shorthands and `this` binding.\n\
     *\n\
     * @private\n\
     * @param {Array|Object|string} collection The collection to iterate over.\n\
     * @param {Function} iteratee The function invoked per iteration.\n\
     * @returns {Array|Object|string} Returns `collection`.\n\
     */\n\
    function baseEachRight(collection, iteratee) {\n\
      var length = collection ? collection.length : 0;\n\
      if (!isLength(length)) {\n\
        return baseForOwnRight(collection, iteratee);\n\
      }\n\
      var iterable = toObject(collection);\n\
      while (length--) {\n\
        if (iteratee(iterable[length], length, iterable) === false) {\n\
          break;\n\
        }\n\
      }\n\
      return collection;\n\
    }\n\
\n\
    /**\n\
     * The base implementation of `_.every` without support for callback\n\
     * shorthands or `this` binding.\n\
     *\n\
     * @private\n\
     * @param {Array|Object|string} collection The collection to iterate over.\n\
     * @param {Function} predicate The function invoked per iteration.\n\
     * @returns {Array} Returns `true` if all elements pass the predicate check,\n\
     *  else `false`\n\
     */\n\
    function baseEvery(collection, predicate) {\n\
      var result = true;\n\
\n\
      baseEach(collection, function(value, index, collection) {\n\
        result = !!predicate(value, index, collection);\n\
        return result;\n\
      });\n\
      return result;\n\
    }\n\
\n\
    /**\n\
     * The base implementation of `_.filter` without support for callback\n\
     * shorthands or `this` binding.\n\
     *\n\
     * @private\n\
     * @param {Array|Object|string} collection The collection to iterate over.\n\
     * @param {Function} predicate The function invoked per iteration.\n\
     * @returns {Array} Returns the new filtered array.\n\
     */\n\
    function baseFilter(collection, predicate) {\n\
      var result = [];\n\
\n\
      baseEach(collection, function(value, index, collection) {\n\
        if (predicate(value, index, collection)) {\n\
          result.push(value);\n\
        }\n\
      });\n\
      return result;\n\
    }\n\
\n\
    /**\n\
     * The base implementation of `_.find`, `_.findLast`, `_.findKey`, and `_.findLastKey`,\n\
     * without support for callback shorthands and `this` binding, which iterates\n\
     * over `collection` using the provided `eachFunc`.\n\
     *\n\
     * @private\n\
     * @param {Array|Object|string} collection The collection to search.\n\
     * @param {Function} predicate The function invoked per iteration.\n\
     * @param {Function} eachFunc The function to iterate over `collection`.\n\
     * @param {boolean} [retKey=false] Specify returning the key of the found\n\
     *  element instead of the element itself.\n\
     * @returns {*} Returns the found element or its key, else `undefined`.\n\
     */\n\
    function baseFind(collection, predicate, eachFunc, retKey) {\n\
      var result;\n\
\n\
      eachFunc(collection, function(value, key, collection) {\n\
        if (predicate(value, key, collection)) {\n\
          result = retKey ? key : value;\n\
          return false;\n\
        }\n\
      });\n\
      return result;\n\
    }\n\
\n\
    /**\n\
     * The base implementation of `_.flatten` with added support for restricting\n\
     * flattening and specifying the start index.\n\
     *\n\
     * @private\n\
     * @param {Array} array The array to flatten.\n\
     * @param {boolean} [isDeep=false] Specify a deep flatten.\n\
     * @param {boolean} [isStrict=false] Restrict flattening to arrays and `arguments` objects.\n\
     * @param {number} [fromIndex=0] The index to start from.\n\
     * @returns {Array} Returns the new flattened array.\n\
     */\n\
    function baseFlatten(array, isDeep, isStrict, fromIndex) {\n\
      var index = (fromIndex || 0) - 1,\n\
          length = array.length,\n\
          resIndex = -1,\n\
          result = [];\n\
\n\
      while (++index < length) {\n\
        var value = array[index];\n\
\n\
        if (isObjectLike(value) && isLength(value.length) && (isArray(value) || isArguments(value))) {\n\
          // Recursively flatten arrays (susceptible to call stack limits).\n\
          if (isDeep) {\n\
            value = baseFlatten(value, isDeep, isStrict);\n\
          }\n\
          var valIndex = -1,\n\
              valLength = value.length;\n\
\n\
          result.length += valLength;\n\
          while (++valIndex < valLength) {\n\
            result[++resIndex] = value[valIndex];\n\
          }\n\
        } else if (!isStrict) {\n\
          result[++resIndex] = value;\n\
        }\n\
      }\n\
      return result;\n\
    }\n\
\n\
    /**\n\
     * The base implementation of `baseForIn` and `baseForOwn` which iterates\n\
     * over `object` properties returned by `keysFunc` invoking `iteratee` for\n\
     * each property. Iterator functions may exit iteration early by explicitly\n\
     * returning `false`.\n\
     *\n\
     * @private\n\
     * @param {Object} object The object to iterate over.\n\
     * @param {Function} iteratee The function invoked per iteration.\n\
     * @param {Function} keysFunc The function to get the keys of `object`.\n\
     * @returns {Object} Returns `object`.\n\
     */\n\
    function baseFor(object, iteratee, keysFunc) {\n\
      var index = -1,\n\
          iterable = toObject(object),\n\
          props = keysFunc(object),\n\
          length = props.length;\n\
\n\
      while (++index < length) {\n\
        var key = props[index];\n\
        if (iteratee(iterable[key], key, iterable) === false) {\n\
          break;\n\
        }\n\
      }\n\
      return object;\n\
    }\n\
\n\
    /**\n\
     * This function is like `baseFor` except that it iterates over properties\n\
     * in the opposite order.\n\
     *\n\
     * @private\n\
     * @param {Object} object The object to iterate over.\n\
     * @param {Function} iteratee The function invoked per iteration.\n\
     * @param {Function} keysFunc The function to get the keys of `object`.\n\
     * @returns {Object} Returns `object`.\n\
     */\n\
    function baseForRight(object, iteratee, keysFunc) {\n\
      var iterable = toObject(object),\n\
          props = keysFunc(object),\n\
          length = props.length;\n\
\n\
      while (length--) {\n\
        var key = props[length];\n\
        if (iteratee(iterable[key], key, iterable) === false) {\n\
          break;\n\
        }\n\
      }\n\
      return object;\n\
    }\n\
\n\
    /**\n\
     * The base implementation of `_.forIn` without support for callback\n\
     * shorthands and `this` binding.\n\
     *\n\
     * @private\n\
     * @param {Object} object The object to iterate over.\n\
     * @param {Function} iteratee The function invoked per iteration.\n\
     * @returns {Object} Returns `object`.\n\
     */\n\
    function baseForIn(object, iteratee) {\n\
      return baseFor(object, iteratee, keysIn);\n\
    }\n\
\n\
    /**\n\
     * The base implementation of `_.forOwn` without support for callback\n\
     * shorthands and `this` binding.\n\
     *\n\
     * @private\n\
     * @param {Object} object The object to iterate over.\n\
     * @param {Function} iteratee The function invoked per iteration.\n\
     * @returns {Object} Returns `object`.\n\
     */\n\
    function baseForOwn(object, iteratee) {\n\
      return baseFor(object, iteratee, keys);\n\
    }\n\
\n\
    /**\n\
     * The base implementation of `_.forOwnRight` without support for callback\n\
     * shorthands and `this` binding.\n\
     *\n\
     * @private\n\
     * @param {Object} object The object to iterate over.\n\
     * @param {Function} iteratee The function invoked per iteration.\n\
     * @returns {Object} Returns `object`.\n\
     */\n\
    function baseForOwnRight(object, iteratee) {\n\
      return baseForRight(object, iteratee, keys);\n\
    }\n\
\n\
    /**\n\
     * The base implementation of `_.functions` which creates an array of\n\
     * `object` function property names filtered from those provided.\n\
     *\n\
     * @private\n\
     * @param {Object} object The object to inspect.\n\
     * @param {Array} props The property names to filter.\n\
     * @returns {Array} Returns the new array of filtered property names.\n\
     */\n\
    function baseFunctions(object, props) {\n\
      var index = -1,\n\
          length = props.length,\n\
          resIndex = -1,\n\
          result = [];\n\
\n\
      while (++index < length) {\n\
        var key = props[index];\n\
        if (isFunction(object[key])) {\n\
          result[++resIndex] = key;\n\
        }\n\
      }\n\
      return result;\n\
    }\n\
\n\
    /**\n\
     * The base implementation of `_.isEqual`, without support for `thisArg`\n\
     * binding, which allows partial \"_.where\" style comparisons.\n\
     *\n\
     * @private\n\
     * @param {*} value The value to compare to `other`.\n\
     * @param {*} other The value to compare to `value`.\n\
     * @param {Function} [customizer] The function to customize comparing values.\n\
     * @param {boolean} [isWhere=false] Specify performing partial comparisons.\n\
     * @param {Array} [stackA=[]] Tracks traversed `value` objects.\n\
     * @param {Array} [stackB=[]] Tracks traversed `other` objects.\n\
     * @returns {boolean} Returns `true` if the values are equivalent, else `false`.\n\
     */\n\
    function baseIsEqual(value, other, customizer, isWhere, stackA, stackB) {\n\
      var result = (customizer && !stackA) ? customizer(value, other) : undefined;\n\
      if (typeof result != 'undefined') {\n\
        return !!result;\n\
      }\n\
      // Exit early for identical values.\n\
      if (value === other) {\n\
        // Treat `+0` vs. `-0` as not equal.\n\
        return value !== 0 || (1 / value == 1 / other);\n\
      }\n\
      var valType = typeof value,\n\
          othType = typeof other;\n\
\n\
      // Exit early for unlike primitive values.\n\
      if (!(valType == 'number' && othType == 'number') && (value == null || other == null ||\n\
          (valType != 'function' && valType != 'object' && othType != 'function' && othType != 'object'))) {\n\
        return false;\n\
      }\n\
      var valClass = toString.call(value),\n\
          valIsArg = valClass == argsClass,\n\
          othClass = toString.call(other),\n\
          othIsArg = othClass == argsClass;\n\
\n\
      if (valIsArg) {\n\
        valClass = objectClass;\n\
      }\n\
      if (othIsArg) {\n\
        othClass = objectClass;\n\
      }\n\
      var valIsArr = arrayLikeClasses[valClass],\n\
          valIsErr = valClass == errorClass,\n\
          valIsObj = valClass == objectClass && !isHostObject(value),\n\
          othIsObj = othClass == objectClass && !isHostObject(other);\n\
\n\
      var isSameClass = valClass == othClass;\n\
      if (isSameClass && valIsArr) {\n\
        var valLength = value.length,\n\
            othLength = other.length;\n\
\n\
        if (valLength != othLength && !(isWhere && othLength > valLength)) {\n\
          return false;\n\
        }\n\
      }\n\
      else {\n\
        // Unwrap `lodash` wrapped values.\n\
        var valWrapped = valIsObj && hasOwnProperty.call(value, '__wrapped__'),\n\
            othWrapped = othIsObj && hasOwnProperty.call(other, '__wrapped__');\n\
\n\
        if (valWrapped || othWrapped) {\n\
          return baseIsEqual(valWrapped ? value.value() : value, othWrapped ? other.value() : other, customizer, isWhere, stackA, stackB);\n\
        }\n\
        if (!isSameClass) {\n\
          return false;\n\
        }\n\
        if (valIsErr || valIsObj) {\n\
          if (!lodash.support.argsClass) {\n\
            valIsArg = isArguments(value);\n\
            othIsArg = isArguments(other);\n\
          }\n\
          // In older versions of Opera, `arguments` objects have `Array` constructors.\n\
          var valCtor = valIsArg ? Object : value.constructor,\n\
              othCtor = othIsArg ? Object : other.constructor;\n\
\n\
          if (valIsErr) {\n\
            // Error objects of different types are not equal.\n\
            if (valCtor.prototype.name != othCtor.prototype.name) {\n\
              return false;\n\
            }\n\
          }\n\
          else {\n\
            var valHasCtor = !valIsArg && hasOwnProperty.call(value, 'constructor'),\n\
                othHasCtor = !othIsArg && hasOwnProperty.call(other, 'constructor');\n\
\n\
            if (valHasCtor != othHasCtor) {\n\
              return false;\n\
            }\n\
            if (!valHasCtor) {\n\
              // Non `Object` object instances with different constructors are not equal.\n\
              if (valCtor != othCtor && ('constructor' in value && 'constructor' in other) &&\n\
                  !(typeof valCtor == 'function' && valCtor instanceof valCtor &&\n\
                    typeof othCtor == 'function' && othCtor instanceof othCtor)) {\n\
                return false;\n\
              }\n\
            }\n\
          }\n\
          var valProps = valIsErr ? ['message', 'name'] : keys(value),\n\
              othProps = valIsErr ? valProps : keys(other);\n\
\n\
          if (valIsArg) {\n\
            valProps.push('length');\n\
          }\n\
          if (othIsArg) {\n\
            othProps.push('length');\n\
          }\n\
          valLength = valProps.length;\n\
          othLength = othProps.length;\n\
          if (valLength != othLength && !isWhere) {\n\
            return false;\n\
          }\n\
        }\n\
        else {\n\
          switch (valClass) {\n\
            case boolClass:\n\
            case dateClass:\n\
              // Coerce dates and booleans to numbers, dates to milliseconds and booleans\n\
              // to `1` or `0` treating invalid dates coerced to `NaN` as not equal.\n\
              return +value == +other;\n\
\n\
            case numberClass:\n\
              // Treat `NaN` vs. `NaN` as equal.\n\
              return (value != +value)\n\
                ? other != +other\n\
                // But, treat `-0` vs. `+0` as not equal.\n\
                : (value == 0 ? ((1 / value) == (1 / other)) : value == +other);\n\
\n\
            case regexpClass:\n\
            case stringClass:\n\
              // Coerce regexes to strings (http://es5.github.io/#x15.10.6.4) and\n\
              // treat strings primitives and string objects as equal.\n\
              return value == String(other);\n\
          }\n\
          return false;\n\
        }\n\
      }\n\
      // Assume cyclic structures are equal.\n\
      // The algorithm for detecting cyclic structures is adapted from ES 5.1\n\
      // section 15.12.3, abstract operation `JO` (http://es5.github.io/#x15.12.3).\n\
      stackA || (stackA = []);\n\
      stackB || (stackB = []);\n\
\n\
      var index = stackA.length;\n\
      while (index--) {\n\
        if (stackA[index] == value) {\n\
          return stackB[index] == other;\n\
        }\n\
      }\n\
      // Add `value` and `other` to the stack of traversed objects.\n\
      stackA.push(value);\n\
      stackB.push(other);\n\
\n\
      // Recursively compare objects and arrays (susceptible to call stack limits).\n\
      result = true;\n\
      if (valIsArr) {\n\
        // Deep compare the contents, ignoring non-numeric properties.\n\
        while (result && ++index < valLength) {\n\
          var valValue = value[index];\n\
          if (isWhere) {\n\
            var othIndex = othLength;\n\
            while (othIndex--) {\n\
              result = baseIsEqual(valValue, other[othIndex], customizer, isWhere, stackA, stackB);\n\
              if (result) {\n\
                break;\n\
              }\n\
            }\n\
          } else {\n\
            var othValue = other[index];\n\
            result = customizer ? customizer(valValue, othValue, index) : undefined;\n\
            if (typeof result == 'undefined') {\n\
              result = baseIsEqual(valValue, othValue, customizer, isWhere, stackA, stackB);\n\
            }\n\
          }\n\
        }\n\
      }\n\
      else {\n\
        while (result && ++index < valLength) {\n\
          var key = valProps[index];\n\
          result = valIsErr || hasOwnProperty.call(other, key);\n\
\n\
          if (result) {\n\
            valValue = value[key];\n\
            othValue = other[key];\n\
            result = customizer ? customizer(valValue, othValue, key) : undefined;\n\
            if (typeof result == 'undefined') {\n\
              result = baseIsEqual(valValue, othValue, customizer, isWhere, stackA, stackB);\n\
            }\n\
          }\n\
        }\n\
      }\n\
      stackA.pop();\n\
      stackB.pop();\n\
\n\
      return !!result;\n\
    }\n\
\n\
    /**\n\
     * The base implementation of `_.invoke` which requires additional arguments\n\
     * be provided as an array of arguments rather than individually.\n\
     *\n\
     * @private\n\
     * @param {Array|Object|string} collection The collection to iterate over.\n\
     * @param {Function|string} methodName The name of the method to invoke or\n\
     *  the function invoked per iteration.\n\
     * @param {Array} [args] The arguments to invoke the method with.\n\
     * @returns {Array} Returns the array of results.\n\
     */\n\
    function baseInvoke(collection, methodName, args) {\n\
      var index = -1,\n\
          isFunc = typeof methodName == 'function',\n\
          length = collection ? collection.length : 0,\n\
          result = isLength(length) ? Array(length) : [];\n\
\n\
      baseEach(collection, function(value) {\n\
        var func = isFunc ? methodName : (value != null && value[methodName]);\n\
        result[++index] = func ? func.apply(value, args) : undefined;\n\
      });\n\
      return result;\n\
    }\n\
\n\
    /**\n\
     * The base implementation of `_.map` without support for callback shorthands\n\
     * or `this` binding.\n\
     *\n\
     * @private\n\
     * @param {Array|Object|string} collection The collection to iterate over.\n\
     * @param {Function} iteratee The function invoked per iteration.\n\
     * @returns {Array} Returns the new mapped array.\n\
     */\n\
    function baseMap(collection, iteratee) {\n\
      var result = [];\n\
\n\
      baseEach(collection, function(value, key, collection) {\n\
        result.push(iteratee(value, key, collection));\n\
      });\n\
      return result;\n\
    }\n\
\n\
    /**\n\
     * The base implementation of `_.merge` without support for argument juggling,\n\
     * multiple sources, and `this` binding.\n\
     *\n\
     * @private\n\
     * @param {Object} object The destination object.\n\
     * @param {Object} source The source object.\n\
     * @param {Function} [customizer] The function to customize merging properties.\n\
     * @param {Array} [stackA=[]] Tracks traversed source objects.\n\
     * @param {Array} [stackB=[]] Associates values with source counterparts.\n\
     * @returns {Object} Returns the destination object.\n\
     */\n\
    function baseMerge(object, source, customizer, stackA, stackB) {\n\
      var isSrcArr = isArrayLike(source);\n\
\n\
      (isSrcArr ? arrayEach : baseForOwn)(source, function(srcValue, key, source) {\n\
        var isArr = isArrayLike(srcValue),\n\
            isObj = isPlainObject(srcValue),\n\
            value = object[key];\n\
\n\
        if (!(isArr || isObj)) {\n\
          result = customizer ? customizer(value, srcValue, key, object, source) : undefined;\n\
          if (typeof result == 'undefined') {\n\
            result = srcValue;\n\
          }\n\
          if (isSrcArr || typeof result != 'undefined') {\n\
            object[key] = result;\n\
          }\n\
          return;\n\
        }\n\
        // Avoid merging previously merged cyclic sources.\n\
        stackA || (stackA = []);\n\
        stackB || (stackB = []);\n\
\n\
        var length = stackA.length;\n\
        while (length--) {\n\
          if (stackA[length] == srcValue) {\n\
            object[key] = stackB[length];\n\
            return;\n\
          }\n\
        }\n\
        var result = customizer ? customizer(value, srcValue, key, object, source) : undefined,\n\
            isDeep = typeof result == 'undefined';\n\
\n\
        if (isDeep) {\n\
          result = isArr\n\
            ? (isArray(value) ? value : [])\n\
            : (isPlainObject(value) ? value : {});\n\
        }\n\
        // Add the source value to the stack of traversed objects and associate\n\
        // it with its merged value.\n\
        stackA.push(srcValue);\n\
        stackB.push(result);\n\
\n\
        // Recursively merge objects and arrays (susceptible to call stack limits).\n\
        if (isDeep) {\n\
          baseMerge(result, srcValue, customizer, stackA, stackB);\n\
        }\n\
        object[key] = result;\n\
      });\n\
      return object;\n\
    }\n\
\n\
    /**\n\
     * The base implementation of `_.pullAt` without support for individual\n\
     * index arguments.\n\
     *\n\
     * @private\n\
     * @param {Array} array The array to modify.\n\
     * @param {number[]} indexes The indexes of elements to remove.\n\
     * @returns {Array} Returns the new array of removed elements.\n\
     */\n\
    function basePullAt(array, indexes) {\n\
      var length = indexes.length,\n\
          result = baseAt(array, indexes);\n\
\n\
      indexes.sort(baseCompareAscending);\n\
      while (length--) {\n\
        var index = parseFloat(indexes[length]);\n\
        if (index != previous && isIndex(index)) {\n\
          var previous = index;\n\
          splice.call(array, index, 1);\n\
        }\n\
      }\n\
      return result;\n\
    }\n\
\n\
    /**\n\
     * The base implementation of `_.random` without support for argument juggling\n\
     * and returning floating-point numbers.\n\
     *\n\
     * @private\n\
     * @param {number} min The minimum possible value.\n\
     * @param {number} max The maximum possible value.\n\
     * @returns {number} Returns the random number.\n\
     */\n\
    function baseRandom(min, max) {\n\
      return min + floor(nativeRandom() * (max - min + 1));\n\
    }\n\
\n\
    /**\n\
     * The base implementation of `_.reduce` and `_.reduceRight` without support\n\
     * for callback shorthands or `this` binding, which iterates over `collection`\n\
     * using the provided `eachFunc`.\n\
     *\n\
     * @private\n\
     * @param {Array|Object|string} collection The collection to iterate over.\n\
     * @param {Function} iteratee The function invoked per iteration.\n\
     * @param {*} accumulator The initial value.\n\
     * @param {boolean} initFromCollection Specify using the first or last element\n\
     *  of `collection` as the initial value.\n\
     * @param {Function} eachFunc The function to iterate over `collection`.\n\
     * @returns {*} Returns the accumulated value.\n\
     */\n\
    function baseReduce(collection, iteratee, accumulator, initFromCollection, eachFunc) {\n\
      eachFunc(collection, function(value, index, collection) {\n\
        accumulator = initFromCollection\n\
          ? (initFromCollection = false, value)\n\
          : iteratee(accumulator, value, index, collection)\n\
      });\n\
      return accumulator;\n\
    }\n\
\n\
    /**\n\
     * The base implementation of `setData` without support for hot loop detection.\n\
     *\n\
     * @private\n\
     * @param {Function} func The function to associate metadata with.\n\
     * @param {*} data The metadata.\n\
     * @returns {Function} Returns `func`.\n\
     */\n\
    var baseSetData = !metaMap ? identity : function(func, data) {\n\
      metaMap.set(func, data);\n\
      return func;\n\
    };\n\
\n\
    /**\n\
     * The base implementation of `_.some` without support for callback shorthands\n\
     * or `this` binding.\n\
     *\n\
     * @private\n\
     * @param {Array|Object|string} collection The collection to iterate over.\n\
     * @param {Function} predicate The function invoked per iteration.\n\
     * @returns {boolean} Returns `true` if any element passes the predicate check,\n\
     *  else `false`.\n\
     */\n\
    function baseSome(collection, predicate) {\n\
      var result;\n\
\n\
      baseEach(collection, function(value, index, collection) {\n\
        result = predicate(value, index, collection);\n\
        return !result;\n\
      });\n\
      return !!result;\n\
    }\n\
\n\
    /**\n\
     * The base implementation of `_.sortedIndex` and `_.sortedLastIndex` without\n\
     * support for callback shorthands and `this` binding.\n\
     *\n\
     * @private\n\
     * @param {Array} array The array to inspect.\n\
     * @param {*} value The value to evaluate.\n\
     * @param {Function} iteratee The function invoked per iteration.\n\
     * @param {boolean} [retHighest=false] Specify returning the highest, instead\n\
     *  of the lowest, index at which a value should be inserted into `array`.\n\
     * @returns {number} Returns the index at which `value` should be inserted\n\
     *  into `array`.\n\
     */\n\
    function baseSortedIndex(array, value, iteratee, retHighest) {\n\
      var low = 0,\n\
          high = array ? array.length : low;\n\
\n\
      value = iteratee(value);\n\
\n\
      var valIsNaN = value !== value,\n\
          valIsUndef = typeof value == 'undefined';\n\
\n\
      while (low < high) {\n\
        var mid = floor((low + high) / 2),\n\
            computed = iteratee(array[mid]),\n\
            isReflexive = computed === computed;\n\
\n\
        if (valIsNaN) {\n\
          var setLow = isReflexive || retHighest;\n\
        } else if (valIsUndef) {\n\
          setLow = isReflexive && (retHighest || typeof computed != 'undefined');\n\
        } else {\n\
          setLow = retHighest ? (computed <= value) : (computed < value);\n\
        }\n\
        if (setLow) {\n\
          low = mid + 1;\n\
        } else {\n\
          high = mid;\n\
        }\n\
      }\n\
      return nativeMin(high, MAX_ARRAY_INDEX);\n\
    }\n\
\n\
    /**\n\
     * The base implementation of `_.uniq` without support for callback shorthands\n\
     * and `this` binding.\n\
     *\n\
     * @private\n\
     * @param {Array} array The array to inspect.\n\
     * @param {Function} [iteratee] The function invoked per iteration.\n\
     * @returns {Array} Returns the new duplicate-value-free array.\n\
     */\n\
    function baseUniq(array, iteratee) {\n\
      var index = -1,\n\
          indexOf = getIndexOf(),\n\
          length = array.length,\n\
          isCommon = indexOf == baseIndexOf,\n\
          isLarge = isCommon && length >= 200,\n\
          seen = isLarge && createCache(),\n\
          result = [];\n\
\n\
      if (seen) {\n\
        indexOf = cacheIndexOf;\n\
        isCommon = false;\n\
      } else {\n\
        isLarge = false;\n\
        seen = iteratee ? [] : result;\n\
      }\n\
      outer:\n\
      while (++index < length) {\n\
        var value = array[index],\n\
            computed = iteratee ? iteratee(value, index, array) : value;\n\
\n\
        if (isCommon && value === value) {\n\
          var seenIndex = seen.length;\n\
          while (seenIndex--) {\n\
            if (seen[seenIndex] === computed) {\n\
              continue outer;\n\
            }\n\
          }\n\
          if (iteratee) {\n\
            seen.push(computed);\n\
          }\n\
          result.push(value);\n\
        }\n\
        else if (indexOf(seen, computed) < 0) {\n\
          if (iteratee || isLarge) {\n\
            seen.push(computed);\n\
          }\n\
          result.push(value);\n\
        }\n\
      }\n\
      return result;\n\
    }\n\
\n\
    /**\n\
     * The base implementation of `_.values` and `_.valuesIn` which creates an\n\
     * array of `object` property values corresponding to the property names\n\
     * returned by `keysFunc`.\n\
     *\n\
     * @private\n\
     * @param {Object} object The object to inspect.\n\
     * @param {Function} keysFunc The function to get the keys of `object`.\n\
     * @returns {Object} Returns the array of property values.\n\
     */\n\
    function baseValues(object, keysFunc) {\n\
      var index = -1,\n\
          props = keysFunc(object),\n\
          length = props.length,\n\
          result = Array(length);\n\
\n\
      while (++index < length) {\n\
        result[index] = object[props[index]];\n\
      }\n\
      return result;\n\
    }\n\
\n\
    /**\n\
     * The base implementation of `wrapperValue` which returns the result of\n\
     * performing a sequence of actions on the unwrapped `value`, where each\n\
     * successive action is supplied the return value of the previous.\n\
     *\n\
     * @private\n\
     * @param {*} value The unwrapped value.\n\
     * @param {Array} actions Actions to peform to resolve the unwrapped value.\n\
     * @returns {*} Returns the resolved unwrapped value.\n\
     */\n\
    function baseWrapperValue(value, actions) {\n\
      var result = value;\n\
      if (result instanceof LazyWrapper) {\n\
        result = result.value();\n\
      }\n\
      var index = -1,\n\
          length = actions.length;\n\
\n\
      while (++index < length) {\n\
        var args = [result],\n\
            action = actions[index],\n\
            object = action.object;\n\
\n\
        push.apply(args, action.args);\n\
        result = object[action.name].apply(object, args);\n\
      }\n\
      return result;\n\
    }\n\
\n\
    /**\n\
     * Creates a clone of the given array buffer.\n\
     *\n\
     * @private\n\
     * @param {ArrayBuffer} buffer The array buffer to clone.\n\
     * @returns {ArrayBuffer} Returns the cloned array buffer.\n\
     */\n\
    function bufferClone(buffer) {\n\
      return bufferSlice.call(buffer, 0);\n\
    }\n\
    if (!bufferSlice) {\n\
      // PhantomJS has `ArrayBuffer` and `Uint8Array` but not `Float64Array`.\n\
      bufferClone = !(ArrayBuffer && Uint8Array) ? constant(null) : function(buffer) {\n\
        var byteLength = buffer.byteLength,\n\
            floatLength = Float64Array ? floor(byteLength / FLOAT64_BYTES_PER_ELEMENT) : 0,\n\
            offset = floatLength * FLOAT64_BYTES_PER_ELEMENT,\n\
            result = new ArrayBuffer(byteLength);\n\
\n\
        if (floatLength) {\n\
          var view = new Float64Array(result, 0, floatLength);\n\
          view.set(new Float64Array(buffer, 0, floatLength));\n\
        }\n\
        if (byteLength != offset) {\n\
          view = new Uint8Array(result, offset);\n\
          view.set(new Uint8Array(buffer, offset));\n\
        }\n\
        return result;\n\
      };\n\
    }\n\
\n\
    /**\n\
     * Used by `_.matches` to clone `source` values, letting uncloneable values\n\
     * passthu instead of returning empty objects.\n\
     *\n\
     * @private\n\
     * @param {*} value The value to clone.\n\
     * @returns {*} Returns the cloned value.\n\
     */\n\
    function clonePassthru(value) {\n\
      return isCloneable(value) ? undefined : value;\n\
    }\n\
\n\
    /**\n\
     * Creates an array that is the composition of partially applied arguments,\n\
     * placeholders, and provided arguments into a single array of arguments.\n\
     *\n\
     * @private\n\
     * @param {Array|Object} args The provided arguments.\n\
     * @param {Array} partials The arguments to prepend to those provided.\n\
     * @param {Array} holders The `partials` placeholder indexes.\n\
     * @returns {Array} Returns the new array of composed arguments.\n\
     */\n\
    function composeArgs(args, partials, holders) {\n\
      var holdersLength = holders.length,\n\
          argsIndex = -1,\n\
          argsLength = nativeMax(args.length - holdersLength, 0),\n\
          leftIndex = -1,\n\
          leftLength = partials.length,\n\
          result = Array(argsLength + leftLength);\n\
\n\
      while (++leftIndex < leftLength) {\n\
        result[leftIndex] = partials[leftIndex];\n\
      }\n\
      while (++argsIndex < holdersLength) {\n\
        result[holders[argsIndex]] = args[argsIndex];\n\
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
     * @param {Array|Object} args The provided arguments.\n\
     * @param {Array} partials The arguments to append to those provided.\n\
     * @param {Array} holders The `partials` placeholder indexes.\n\
     * @returns {Array} Returns the new array of composed arguments.\n\
     */\n\
    function composeArgsRight(args, partials, holders) {\n\
      var holdersIndex = -1,\n\
          holdersLength = holders.length,\n\
          argsIndex = -1,\n\
          argsLength = nativeMax(args.length - holdersLength, 0),\n\
          rightIndex = -1,\n\
          rightLength = partials.length,\n\
          result = Array(argsLength + rightLength);\n\
\n\
      while (++argsIndex < argsLength) {\n\
        result[argsIndex] = args[argsIndex];\n\
      }\n\
      var pad = argsIndex;\n\
      while (++rightIndex < rightLength) {\n\
        result[pad + rightIndex] = partials[rightIndex];\n\
      }\n\
      while (++holdersIndex < holdersLength) {\n\
        result[pad + holders[holdersIndex]] = args[argsIndex++];\n\
      }\n\
      return result;\n\
    }\n\
\n\
    /**\n\
     * Creates a function that aggregates a collection, creating an accumulator\n\
     * object composed from the results of running each element in the collection\n\
     * through `iteratee`. The given setter function sets the keys and values of\n\
     * the accumulator object. If `initializer` is provided it is used to initialize\n\
     * the accumulator object.\n\
     *\n\
     * @private\n\
     * @param {Function} setter The function to set keys and values of the accumulator object.\n\
     * @param {Function} [initializer] The function to initialize the accumulator object.\n\
     * @returns {Function} Returns the new aggregator function.\n\
     */\n\
    function createAggregator(setter, initializer) {\n\
      return function(collection, iteratee, thisArg) {\n\
        iteratee = getCallback(iteratee, thisArg, 3);\n\
\n\
        var result = initializer ? initializer() : {};\n\
        if (isArray(collection)) {\n\
          var index = -1,\n\
              length = collection.length;\n\
\n\
          while (++index < length) {\n\
            var value = collection[index];\n\
            setter(result, value, iteratee(value, index, collection), collection);\n\
          }\n\
        } else {\n\
          baseEach(collection, function(value, key, collection) {\n\
            setter(result, value, iteratee(value, key, collection), collection);\n\
          });\n\
        }\n\
        return result;\n\
      };\n\
    }\n\
\n\
    /**\n\
     * Creates a function that assigns properties of source object(s) to a given\n\
     * destination object.\n\
     *\n\
     * @private\n\
     * @param {Function} assigner The function to handle assigning values.\n\
     * @returns {Function} Returns the new assigner function.\n\
     */\n\
    function createAssigner(assigner) {\n\
      return function() {\n\
        var length = arguments.length,\n\
            object = arguments[0];\n\
\n\
        if (length < 2 || object == null) {\n\
          return object;\n\
        }\n\
        if (length > 3 && isIterateeCall(arguments[1], arguments[2], arguments[3])) {\n\
          length = 2;\n\
        }\n\
        // Juggle arguments.\n\
        if (length > 3 && typeof arguments[length - 2] == 'function') {\n\
          var customizer = baseCallback(arguments[--length - 1], arguments[length--], 5);\n\
        } else if (length > 2 && typeof arguments[length - 1] == 'function') {\n\
          customizer = arguments[--length];\n\
        }\n\
        var index = 0;\n\
        while (++index < length) {\n\
          assigner(object, arguments[index], customizer);\n\
        }\n\
        return object;\n\
      };\n\
    }\n\
\n\
    /**\n\
     * Creates a function that wraps `func` and invokes it with the `this`\n\
     * binding of `thisArg`.\n\
     *\n\
     * @private\n\
     * @param {Function} func The function to bind.\n\
     * @param {*} [thisArg] The `this` binding of `func`.\n\
     * @returns {Function} Returns the new bound function.\n\
     */\n\
    function createBindWrapper(func, thisArg) {\n\
      var Ctor = createCtorWrapper(func);\n\
\n\
      function wrapper() {\n\
        return (this instanceof wrapper ? Ctor : func).apply(thisArg, arguments);\n\
      }\n\
      return wrapper;\n\
    }\n\
\n\
    /**\n\
     * Creates a `Set` cache object to optimize linear searches of large arrays.\n\
     *\n\
     * @private\n\
     * @param {Array} [values] The values to cache.\n\
     * @returns {null|Object} Returns the new cache object if `Set` is supported, else `null`.\n\
     */\n\
    var createCache = !Set ? constant(null) : function(values) {\n\
      return new SetCache(values);\n\
    };\n\
\n\
    /**\n\
     * Creates a function that produces compound words out of the words in a\n\
     * given string.\n\
     *\n\
     * @private\n\
     * @param {Function} callback The function invoked to combine each word.\n\
     * @returns {Function} Returns the new compounder function.\n\
     */\n\
    function createCompounder(callback) {\n\
      return function(string) {\n\
        var index = -1,\n\
            array = words(deburr(string)),\n\
            length = array.length,\n\
            result = '';\n\
\n\
        while (++index < length) {\n\
          result = callback(result, array[index], index);\n\
        }\n\
        return result;\n\
      };\n\
    }\n\
\n\
    /**\n\
     * Creates a function that produces an instance of `Ctor` regardless of\n\
     * whether it was invoked as part of a `new` expression or by `call` or `apply`.\n\
     *\n\
     * @private\n\
     * @param {Function} Ctor The constructor to wrap.\n\
     * @returns {Function} Returns the new wrapped function.\n\
     */\n\
    function createCtorWrapper(Ctor) {\n\
      return function() {\n\
        var thisBinding = baseCreate(Ctor.prototype),\n\
            result = Ctor.apply(thisBinding, arguments);\n\
\n\
        // Mimic the constructor's `return` behavior.\n\
        // See http://es5.github.io/#x13.2.2.\n\
        return isObject(result) ? result : thisBinding;\n\
      };\n\
    }\n\
\n\
    /**\n\
     * Creates a function that wraps `func` and invokes it with optional `this`\n\
     * binding of, partial application, and currying.\n\
     *\n\
     * @private\n\
     * @param {Function|string} func The function or method name to reference.\n\
     * @param {number} bitmask The bitmask of flags. See `createWrapper` for more details.\n\
     * @param {*} [thisArg] The `this` binding of `func`.\n\
     * @param {Array} [partials] The arguments to prepend to those provided to the new function.\n\
     * @param {Array} [holders] The `partials` placeholder indexes.\n\
     * @param {Array} [partialsRight] The arguments to append to those provided to the new function.\n\
     * @param {Array} [holdersRight] The `partialsRight` placeholder indexes.\n\
     * @param {Array} [argPos] The argument positions of the new function.\n\
     * @param {number} [arity] The arity of `func`.\n\
     * @param {number} [ary] The arity cap of `func`.\n\
     * @returns {Function} Returns the new wrapped function.\n\
     */\n\
    function createHybridWrapper(func, bitmask, thisArg, partials, holders, partialsRight, holdersRight, argPos, arity, ary) {\n\
      var isAry = bitmask & ARY_FLAG,\n\
          isBind = bitmask & BIND_FLAG,\n\
          isBindKey = bitmask & BIND_KEY_FLAG,\n\
          isCurry = bitmask & CURRY_FLAG,\n\
          isCurryBound = bitmask & CURRY_BOUND_FLAG,\n\
          isCurryRight = bitmask & CURRY_RIGHT_FLAG;\n\
\n\
      var Ctor = !isBindKey && createCtorWrapper(func),\n\
          key = func;\n\
\n\
      function wrapper() {\n\
        // Avoid `arguments` object use disqualifying optimizations by\n\
        // converting it to an array before providing it to other functions.\n\
        var length = arguments.length,\n\
            index = length,\n\
            args = Array(length);\n\
\n\
        while (index--) {\n\
          args[index] = arguments[index];\n\
        }\n\
        if (partials) {\n\
          args = composeArgs(args, partials, holders);\n\
        }\n\
        if (partialsRight) {\n\
          args = composeArgsRight(args, partialsRight, holdersRight);\n\
        }\n\
        if (isCurry || isCurryRight) {\n\
          var placeholder = wrapper.placeholder,\n\
              argsHolders = replaceHolders(args, placeholder);\n\
\n\
          length -= argsHolders.length;\n\
          if (length < arity) {\n\
            var newArgPos = argPos ? baseSlice(argPos) : null,\n\
                newArity = nativeMax(arity - length, 0),\n\
                newsHolders = isCurry ? argsHolders : null,\n\
                newHoldersRight = isCurry ? null : argsHolders,\n\
                newPartials = isCurry ? args : null,\n\
                newPartialsRight = isCurry ? null : args;\n\
\n\
            bitmask |= (isCurry ? PARTIAL_FLAG : PARTIAL_RIGHT_FLAG);\n\
            bitmask &= ~(isCurry ? PARTIAL_RIGHT_FLAG : PARTIAL_FLAG);\n\
\n\
            if (!isCurryBound) {\n\
              bitmask &= ~(BIND_FLAG | BIND_KEY_FLAG);\n\
            }\n\
            var result = createHybridWrapper(func, bitmask, thisArg, newPartials, newsHolders, newPartialsRight, newHoldersRight, newArgPos, newArity, ary);\n\
            result.placeholder = placeholder;\n\
            return result;\n\
          }\n\
        }\n\
        var thisBinding = isBind ? thisArg : this;\n\
        if (isBindKey) {\n\
          func = thisBinding[key];\n\
        }\n\
        if (argPos) {\n\
          args = arrayReduceRight(argPos, reorder, args);\n\
        }\n\
        if (isAry && ary < args.length) {\n\
          args.length = ary;\n\
        }\n\
        return (this instanceof wrapper ? (Ctor || createCtorWrapper(func)) : func).apply(thisBinding, args);\n\
      }\n\
      return wrapper;\n\
    }\n\
\n\
    /**\n\
     * Creates the pad required for `string` based on the given padding length.\n\
     * The `chars` string may be truncated if the number of padding characters\n\
     * exceeds the padding length.\n\
     *\n\
     * @private\n\
     * @param {string} string The string to create padding for.\n\
     * @param {number} [length=0] The padding length.\n\
     * @param {string} [chars=' '] The string used as padding.\n\
     * @returns {string} Returns the pad for `string`.\n\
     */\n\
    function createPad(string, length, chars) {\n\
      var strLength = string.length;\n\
      length = +length;\n\
\n\
      if (strLength >= length || !nativeIsFinite(length)) {\n\
        return '';\n\
      }\n\
      var padLength = length - strLength;\n\
      chars = chars == null ? ' ' : String(chars);\n\
      return repeat(chars, ceil(padLength / chars.length)).slice(0, padLength);\n\
    }\n\
\n\
    /**\n\
     * Creates a function that wraps `func` and invokes it with the optional `this`\n\
     * binding of `thisArg` and the `partials` prepended to those provided to\n\
     * the wrapper.\n\
     *\n\
     * @private\n\
     * @param {Function} func The function to partially apply arguments to.\n\
     * @param {number} bitmask The bitmask of flags. See `createWrapper` for more details.\n\
     * @param {*} thisArg The `this` binding of `func`.\n\
     * @param {Array} partials The arguments to prepend to those provided to the new function.\n\
     * @returns {Function} Returns the new bound function.\n\
     */\n\
    function createPartialWrapper(func, bitmask, thisArg, partials) {\n\
      var isBind = bitmask & BIND_FLAG,\n\
          Ctor = createCtorWrapper(func);\n\
\n\
      function wrapper() {\n\
        // Avoid `arguments` object use disqualifying optimizations by\n\
        // converting it to an array before providing it `func`.\n\
        var argsIndex = -1,\n\
            argsLength = arguments.length,\n\
            leftIndex = -1,\n\
            leftLength = partials.length,\n\
            args = Array(argsLength + leftLength);\n\
\n\
        while (++leftIndex < leftLength) {\n\
          args[leftIndex] = partials[leftIndex];\n\
        }\n\
        while (argsLength--) {\n\
          args[leftIndex++] = arguments[++argsIndex];\n\
        }\n\
        return (this instanceof wrapper ? Ctor : func).apply(isBind ? thisArg : this, args);\n\
      }\n\
      return wrapper;\n\
    }\n\
\n\
    /**\n\
     * Creates a function that either curries or invokes `func` with optional\n\
     * `this` binding and partially applied arguments.\n\
     *\n\
     * @private\n\
     * @param {Function|string} func The function or method name to reference.\n\
     * @param {number} bitmask The bitmask of flags.\n\
     *  The bitmask may be composed of the following flags:\n\
     *     1 - `_.bind`\n\
     *     2 - `_.bindKey`\n\
     *     4 - `_.curry` or `_.curryRight` of a bound function\n\
     *     8 - `_.curry`\n\
     *    16 - `_.curryRight`\n\
     *    32 - `_.partial`\n\
     *    64 - `_.partialRight`\n\
     *   128 - `_.ary`\n\
     *   256 - `_.rearg`\n\
     * @param {*} [thisArg] The `this` binding of `func`.\n\
     * @param {Array} [partials] The arguments to be partially applied.\n\
     * @param {Array} [holders] The `partials` placeholder indexes.\n\
     * @param {Array} [argPos] The argument positions of the new function.\n\
     * @param {number} [arity] The arity of `func`.\n\
     * @param {number} [ary] The arity cap of `func`.\n\
     * @returns {Function} Returns the new wrapped function.\n\
     */\n\
    function createWrapper(func, bitmask, thisArg, partials, holders, argPos, arity, ary) {\n\
      var isBindKey = bitmask & BIND_KEY_FLAG;\n\
      if (!isBindKey && !isFunction(func)) {\n\
        throw new TypeError(FUNC_ERROR_TEXT);\n\
      }\n\
      var length = partials ? partials.length : 0;\n\
      if (!length) {\n\
        bitmask &= ~(PARTIAL_FLAG | PARTIAL_RIGHT_FLAG);\n\
        partials = holders = null;\n\
      }\n\
      holders = (partials && !holders) ? [] : holders;\n\
      length -= (holders ? holders.length : 0);\n\
\n\
      if (bitmask & PARTIAL_RIGHT_FLAG) {\n\
        var partialsRight = partials,\n\
            holdersRight = holders;\n\
\n\
        partials = holders = null;\n\
      }\n\
      var data = !isBindKey && getData(func),\n\
          newData = [func, bitmask, thisArg, partials, holders, partialsRight, holdersRight, argPos, arity, ary];\n\
\n\
      if (data && data !== true) {\n\
        mergeData(newData, data);\n\
      }\n\
      newData[8] = newData[8] == null\n\
        ? (isBindKey ? 0 : newData[0].length)\n\
        : (nativeMax(newData[8] - length, 0) || 0);\n\
\n\
      bitmask = newData[1];\n\
      if (bitmask == BIND_FLAG) {\n\
        var result = createBindWrapper(newData[0], newData[2]);\n\
      } else if ((bitmask == PARTIAL_FLAG || bitmask == (BIND_FLAG | PARTIAL_FLAG)) && !newData[4].length) {\n\
        result = createPartialWrapper.apply(null, newData);\n\
      } else {\n\
        result = createHybridWrapper.apply(null, newData);\n\
      }\n\
      var setter = data ? baseSetData : setData;\n\
      return setter(result, newData);\n\
    }\n\
\n\
    /**\n\
     * Gets the appropriate \"callback\" function. If the `_.callback` method is\n\
     * customized this function returns the custom method, otherwise it returns\n\
     * the `baseCallback` function. If arguments are provided the chosen function\n\
     * is invoked with them and its result is returned.\n\
     *\n\
     * @private\n\
     * @returns {Function} Returns the chosen function or its result.\n\
     */\n\
    function getCallback(func, thisArg, argCount) {\n\
      var result = lodash.callback || callback;\n\
      result = result === callback ? baseCallback : result;\n\
      return argCount ? result(func, thisArg, argCount) : result;\n\
    }\n\
\n\
    /**\n\
     * Gets metadata for `func`.\n\
     *\n\
     * @private\n\
     * @param {Function} func The function to query.\n\
     * @returns {*} Returns the metadata for `func`.\n\
     */\n\
    var getData = !metaMap ? noop : function(func) {\n\
      return metaMap.get(func);\n\
    };\n\
\n\
    /**\n\
     * Gets the appropriate \"indexOf\" function. If the `_.indexOf` method is\n\
     * customized this function returns the custom method, otherwise it returns\n\
     * the `baseIndexOf` function. If arguments are provided the chosen function\n\
     * is invoked with them and its result is returned.\n\
     *\n\
     * @private\n\
     * @returns {Function|number} Returns the chosen function or its result.\n\
     */\n\
    function getIndexOf(collection, target, fromIndex) {\n\
      var result = lodash.indexOf || indexOf;\n\
      result = result === indexOf ? baseIndexOf : result;\n\
      return collection ? result(collection, target, fromIndex) : result;\n\
    }\n\
\n\
    /**\n\
     * Gets the view, applying any `transforms` to the `start` and `end` positions.\n\
     *\n\
     * @private\n\
     * @param {number} start The start of the view.\n\
     * @param {number} end The end of the view.\n\
     * @param {Array} [transforms] The transformations to apply to the view.\n\
     * @returns {Object} Returns an object containing the `start` and `end`\n\
     *  positions of the view.\n\
     */\n\
    function getView(start, end, transforms) {\n\
      var index = -1,\n\
          length = transforms ? transforms.length : 0;\n\
\n\
      while (++index < length) {\n\
        var data = transforms[index],\n\
            size = data.size;\n\
\n\
        switch (data.type) {\n\
          case 'drop':      start += size; break;\n\
          case 'dropRight': end -= size; break;\n\
          case 'take':      end = nativeMin(end, start + size); break;\n\
          case 'takeRight': start = nativeMax(start, end - size); break;\n\
        }\n\
      }\n\
      return { 'start': start, 'end': end };\n\
    }\n\
\n\
    /**\n\
     * Initializes an array clone.\n\
     *\n\
     * @private\n\
     * @param {Array} array The array to clone.\n\
     * @param {boolean} [isDeep=false] Specify a deep clone.\n\
     * @returns {Array} Returns the initialized array clone.\n\
     */\n\
    function initArrayClone(array, isDeep) {\n\
      var index = -1,\n\
          length = array.length,\n\
          result = new array.constructor(length);\n\
\n\
      if (!isDeep) {\n\
        while (++index < length) {\n\
          result[index] = array[index];\n\
        }\n\
      }\n\
      // Add array properties assigned by `RegExp#exec`.\n\
      if (length && typeof array[0] == 'string' && hasOwnProperty.call(array, 'index')) {\n\
        result.index = array.index;\n\
        result.input = array.input;\n\
      }\n\
      return result;\n\
    }\n\
\n\
    /**\n\
     * Initializes an object clone.\n\
     *\n\
     * @private\n\
     * @param {Object} object The object to clone.\n\
     * @param {boolean} [isDeep=false] Specify a deep clone.\n\
     * @returns {null|Object} Returns the initialized object clone if an object\n\
     *  is cloneable, else `null`.\n\
     */\n\
    function initObjectClone(object, isDeep) {\n\
      if (!isCloneable(object)) {\n\
        return null;\n\
      }\n\
      var Ctor = object.constructor,\n\
          className = toString.call(object),\n\
          isArgs = className == argsClass || (!lodash.support.argsClass && isArguments(object)),\n\
          isObj = className == objectClass;\n\
\n\
      if (isObj && !(typeof Ctor == 'function' && Ctor instanceof Ctor)) {\n\
        Ctor = Object;\n\
      }\n\
      if (isArgs || isObj) {\n\
        var result = isDeep ? new Ctor : baseAssign(new Ctor, object);\n\
        if (isArgs) {\n\
          result.length = object.length;\n\
        }\n\
        return result;\n\
      }\n\
      switch (className) {\n\
        case arrayBufferClass:\n\
          return bufferClone(object);\n\
\n\
        case boolClass:\n\
        case dateClass:\n\
          return new Ctor(+object);\n\
\n\
        case float32Class: case float64Class:\n\
        case int8Class: case int16Class: case int32Class:\n\
        case uint8Class: case uint8ClampedClass: case uint16Class: case uint32Class:\n\
          // Safari 5 mobile incorrectly has `Object` as the constructor of typed arrays.\n\
          if (Ctor instanceof Ctor) {\n\
            Ctor = ctorByClass[className];\n\
          }\n\
          var buffer = object.buffer;\n\
          return new Ctor(isDeep ? bufferClone(buffer) : buffer, object.byteOffset, object.length);\n\
\n\
        case numberClass:\n\
        case stringClass:\n\
          return new Ctor(object);\n\
\n\
        case regexpClass:\n\
          result = new Ctor(object.source, reFlags.exec(object));\n\
          result.lastIndex = object.lastIndex;\n\
      }\n\
      return result;\n\
    }\n\
\n\
    /**\n\
     * Checks if `value` is an array-like object.\n\
     *\n\
     * @private\n\
     * @param {*} value The value to check.\n\
     * @returns {boolean} Returns `true` if `value` is an array-like object, else `false`.\n\
     */\n\
    function isArrayLike(value) {\n\
      return (isObjectLike(value) && isLength(value.length) &&\n\
        (arrayLikeClasses[toString.call(value)] || (!lodash.support.argsClass && isArguments(value)))) || false;\n\
    }\n\
\n\
    /**\n\
     * Checks if `value` is cloneable.\n\
     *\n\
     * @private\n\
     * @param {*} value The value to check.\n\
     * @returns {boolean} Returns `true` if `value` is cloneable, else `false`.\n\
     */\n\
    function isCloneable(value) {\n\
      return (value && cloneableClasses[toString.call(value)] && !isHostObject(value)) || false;\n\
    }\n\
\n\
    /**\n\
     * Checks if the provided arguments are from an iteratee call.\n\
     *\n\
     * @private\n\
     * @param {*} value The potential iteratee value argument.\n\
     * @param {*} index The potential iteratee index or key argument.\n\
     * @param {*} object The potential iteratee object argument.\n\
     * @returns {boolean} Returns `true` if the arguments are from an iteratee call, else `false`.\n\
     */\n\
    function isIterateeCall(value, index, object) {\n\
      if (!isObject(object)) {\n\
        return false;\n\
      }\n\
      var type = typeof index;\n\
      if (type == 'number') {\n\
        var length = object.length,\n\
            prereq = isLength(length) && isIndex(index, length);\n\
      } else {\n\
        prereq = type == 'string';\n\
      }\n\
      return prereq && object[index] === value;\n\
    }\n\
\n\
    /**\n\
     * Checks if `value` is a valid array-like length.\n\
     *\n\
     * @private\n\
     * @param {*} value The value to check.\n\
     * @returns {boolean} Returns `true` if `value` is a valid length, else `false`.\n\
     */\n\
    function isLength(value) {\n\
      return typeof value == 'number' && value > -1 && value <= MAX_SAFE_INTEGER;\n\
    }\n\
\n\
    /**\n\
     * Checks if `value` is suitable for strict equality comparisons, i.e. `===`.\n\
     *\n\
     * @private\n\
     * @param {*} value The value to check.\n\
     * @returns {boolean} Returns `true` if `value` if suitable for strict\n\
     *  equality comparisons, else `false`.\n\
     */\n\
    function isStrictComparable(value) {\n\
      return value === value && (value === 0 ? ((1 / value) > 0) : !isObject(value));\n\
    }\n\
\n\
    /**\n\
     * Merges the function metadata of `source` into `data`.\n\
     *\n\
     * Merging metadata reduces the number of wrappers required to invoke a function.\n\
     * This is possible because methods like `_.bind`, `_.curry`, and `_.partial`\n\
     * may be applied regardless of execution order. Methods like `_.ary` and `_.rearg`\n\
     * augment function arguments, making the order in which they are executed important,\n\
     * preventing the merging of metadata. However, we make an exception for a safe\n\
     * common case where curried functions have `_.ary` and or `_.rearg` applied.\n\
     *\n\
     * @private\n\
     * @param {Array} data The destination metadata.\n\
     * @param {Array} source The source metadata.\n\
     * @returns {Array} Returns `data`.\n\
     */\n\
    function mergeData(data, source) {\n\
      var bitmask = data[1],\n\
          srcBitmask = source[1],\n\
          newBitmask = bitmask | srcBitmask;\n\
\n\
      var arityFlags = ARY_FLAG | REARG_FLAG,\n\
          bindFlags = BIND_FLAG | BIND_KEY_FLAG,\n\
          comboFlags = arityFlags | bindFlags | CURRY_BOUND_FLAG | CURRY_RIGHT_FLAG;\n\
\n\
      var isAry = bitmask & ARY_FLAG && !(srcBitmask & ARY_FLAG),\n\
          isRearg = bitmask & REARG_FLAG && !(srcBitmask & REARG_FLAG),\n\
          argPos = (isRearg ? data : source)[7],\n\
          ary = (isAry ? data : source)[9];\n\
\n\
      var isCommon = !(bitmask >= ARY_FLAG && srcBitmask > bindFlags) &&\n\
        !(bitmask > bindFlags && srcBitmask >= ARY_FLAG);\n\
\n\
      var isCombo = (newBitmask >= arityFlags && newBitmask <= comboFlags) &&\n\
        (bitmask < ARY_FLAG || ((isRearg || isAry) && argPos[0].length <= ary));\n\
\n\
      // Exit early if metadata can't be merged.\n\
      if (!(isCommon || isCombo)) {\n\
        return data;\n\
      }\n\
      // Use source `thisArg` if available.\n\
      if (srcBitmask & BIND_FLAG) {\n\
        data[2] = source[2];\n\
        // Set when currying a bound function.\n\
        newBitmask |= (bitmask & BIND_FLAG) ? 0 : CURRY_BOUND_FLAG;\n\
      }\n\
      // Compose partial arguments.\n\
      var value = source[3];\n\
      if (value) {\n\
        var partials = data[3];\n\
        data[3] = partials ? composeArgs(partials, value, source[4]) : baseSlice(value);\n\
        data[4] = partials ? replaceHolders(data[3], PLACEHOLDER) : baseSlice(source[4]);\n\
      }\n\
      // Compose partial right arguments.\n\
      value = source[5];\n\
      if (value) {\n\
        partials = data[5];\n\
        data[5] = partials ? composeArgsRight(partials, value, source[6]) : baseSlice(value);\n\
        data[6] = partials ? replaceHolders(data[5], PLACEHOLDER) : baseSlice(source[6]);\n\
      }\n\
      // Append argument positions.\n\
      value = source[7];\n\
      if (value) {\n\
        argPos = data[7];\n\
        value = data[7] = baseSlice(value);\n\
        if (argPos) {\n\
          push.apply(value, argPos);\n\
        }\n\
      }\n\
      // Use source `arity` if one is not provided.\n\
      if (data[8] == null) {\n\
        data[8] = source[8];\n\
      }\n\
      // Use source `ary` if it's smaller.\n\
      if (srcBitmask & ARY_FLAG) {\n\
        data[9] = data[9] == null ? source[9] : nativeMin(data[9], source[9]);\n\
      }\n\
      // Use source `func` and merge bitmasks.\n\
      data[0] = source[0];\n\
      data[1] = newBitmask;\n\
\n\
      return data;\n\
    }\n\
\n\
    /**\n\
     * A specialized version of `_.pick` that picks `object` properties\n\
     * specified by the `props` array.\n\
     *\n\
     * @private\n\
     * @param {Object} object The source object.\n\
     * @param {string[]} props The property names to pick.\n\
     * @returns {Object} Returns the new object.\n\
     */\n\
    function pickByArray(object, props) {\n\
      object = toObject(object);\n\
\n\
      var index = -1,\n\
          length = props.length,\n\
          result = {};\n\
\n\
      while (++index < length) {\n\
        var key = props[index];\n\
        if (key in object) {\n\
          result[key] = object[key];\n\
        }\n\
      }\n\
      return result;\n\
    }\n\
\n\
    /**\n\
     * A specialized version of `_.pick` that picks `object` properties `predicate`\n\
     * returns truthy for.\n\
     *\n\
     * @private\n\
     * @param {Object} object The source object.\n\
     * @param {Function} predicate The function invoked per iteration.\n\
     * @returns {Object} Returns the new object.\n\
     */\n\
    function pickByCallback(object, predicate) {\n\
      var result = {};\n\
\n\
      baseForIn(object, function(value, key, object) {\n\
        if (predicate(value, key, object)) {\n\
          result[key] = value;\n\
        }\n\
      });\n\
      return result;\n\
    }\n\
\n\
    /**\n\
     * Reorder `array` according to the specified indexes where the element at\n\
     * the first index is assigned as the first element, the element at\n\
     * the second index is assigned as the second element, and so on.\n\
     *\n\
     * @private\n\
     * @param {Array} array The array to reorder.\n\
     * @param {Array} indexes The arranged array indexes.\n\
     * @returns {Array} Returns `array`.\n\
     */\n\
    function reorder(array, indexes) {\n\
      var arrLength = array.length,\n\
          length = nativeMin(indexes.length, arrLength),\n\
          oldArray = baseSlice(array);\n\
\n\
      while (length--) {\n\
        var index = indexes[length];\n\
        array[length] = isIndex(index, arrLength) ? oldArray[index] : undefined;\n\
      }\n\
      return array;\n\
    }\n\
\n\
    /**\n\
     * Sets metadata for `func`.\n\
     *\n\
     * **Note:** If this function becomes hot, i.e. is invoked a lot in a short\n\
     * period of time, it will trip its breaker and transition to an identity function\n\
     * to avoid garbage collection pauses in V8. See https://code.google.com/p/v8/issues/detail?id=2070.\n\
     *\n\
     * @private\n\
     * @param {Function} func The function to associate metadata with.\n\
     * @param {*} data The metadata.\n\
     * @returns {Function} Returns `func`.\n\
     */\n\
    var setData = (function() {\n\
      var count = 0,\n\
          lastCalled = 0;\n\
\n\
      return function(key, value) {\n\
        var stamp = now ? now() : 0,\n\
            remaining = HOT_SPAN - (stamp - lastCalled);\n\
\n\
        lastCalled = stamp;\n\
        if (remaining > 0) {\n\
          if (++count >= HOT_COUNT) {\n\
            return key;\n\
          }\n\
        } else {\n\
          count = 0;\n\
        }\n\
        return baseSetData(key, value);\n\
      };\n\
    }());\n\
\n\
    /**\n\
     * A fallback implementation of `_.isPlainObject` which checks if `value`\n\
     * is an object created by the `Object` constructor or has a `[[Prototype]]`\n\
     * of `null`.\n\
     *\n\
     * @private\n\
     * @param {*} value The value to check.\n\
     * @returns {boolean} Returns `true` if `value` is a plain object, else `false`.\n\
     */\n\
    function shimIsPlainObject(value) {\n\
      var Ctor,\n\
          support = lodash.support;\n\
\n\
      // Exit early for non `Object` objects.\n\
      if (!(isObjectLike(value) && toString.call(value) == objectClass && !isHostObject(value)) ||\n\
          (!hasOwnProperty.call(value, 'constructor') &&\n\
            (Ctor = value.constructor, typeof Ctor == 'function' && !(Ctor instanceof Ctor))) ||\n\
          (!support.argsClass && isArguments(value))) {\n\
        return false;\n\
      }\n\
      // IE < 9 iterates inherited properties before own properties. If the first\n\
      // iterated property is an object's own property then there are no inherited\n\
      // enumerable properties.\n\
      var result;\n\
      if (support.ownLast) {\n\
        baseForIn(value, function(subValue, key, object) {\n\
          result = hasOwnProperty.call(object, key);\n\
          return false;\n\
        });\n\
        return result !== false;\n\
      }\n\
      // In most environments an object's own properties are iterated before\n\
      // its inherited properties. If the last iterated property is an object's\n\
      // own property then there are no inherited enumerable properties.\n\
      baseForIn(value, function(subValue, key) {\n\
        result = key;\n\
      });\n\
      return typeof result == 'undefined' || hasOwnProperty.call(value, result);\n\
    }\n\
\n\
    /**\n\
     * A fallback implementation of `Object.keys` which creates an array of the\n\
     * own enumerable property names of `object`.\n\
     *\n\
     * @private\n\
     * @param {Object} object The object to inspect.\n\
     * @returns {Array} Returns the array of property names.\n\
     */\n\
    function shimKeys(object) {\n\
      var props = keysIn(object),\n\
          propsLength = props.length,\n\
          length = propsLength && object.length,\n\
          support = lodash.support;\n\
\n\
      var allowIndexes = typeof length == 'number' && length > 0 &&\n\
        (isArray(object) || (support.nonEnumStrings && isString(object)) ||\n\
          (support.nonEnumArgs && isArguments(object)));\n\
\n\
      var index = -1,\n\
          result = [];\n\
\n\
      while (++index < propsLength) {\n\
        var key = props[index];\n\
        if ((allowIndexes && isIndex(key, length)) || hasOwnProperty.call(object, key)) {\n\
          result.push(key);\n\
        }\n\
      }\n\
      return result;\n\
    }\n\
\n\
    /**\n\
     * Converts `value` to an array-like object if it is not one.\n\
     *\n\
     * @private\n\
     * @param {*} value The value to process.\n\
     * @returns {Array|Object} Returns the array-like object.\n\
     */\n\
    function toIterable(value) {\n\
      if (value == null) {\n\
        return [];\n\
      }\n\
      if (!isLength(value.length)) {\n\
        return values(value);\n\
      }\n\
      if (lodash.support.unindexedChars && isString(value)) {\n\
        return value.split('');\n\
      }\n\
      return isObject(value) ? value : Object(value);\n\
    }\n\
\n\
    /**\n\
     * Converts `value` to an object if it is not one.\n\
     *\n\
     * @private\n\
     * @param {*} value The value to process.\n\
     * @returns {Object} Returns the object.\n\
     */\n\
    function toObject(value) {\n\
      if (lodash.support.unindexedChars && isString(value)) {\n\
        var index = -1,\n\
            length = value.length,\n\
            result = Object(value);\n\
\n\
        while (++index < length) {\n\
          result[index] = value.charAt(index);\n\
        }\n\
        return result;\n\
      }\n\
      return isObject(value) ? value : Object(value);\n\
    }\n\
\n\
    /*------------------------------------------------------------------------*/\n\
\n\
    /**\n\
     * Creates an array of elements split into groups the length of `size`.\n\
     * If `collection` can't be split evenly, the final chunk will be the remaining\n\
     * elements.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Array\n\
     * @param {Array} array The array to process.\n\
     * @param {numer} [size=1] The length of each chunk.\n\
     * @param- {Object} [guard] Enables use as a callback for functions like `_.map`.\n\
     * @returns {Array} Returns the new array containing chunks.\n\
     * @example\n\
     *\n\
     * _.chunk(['a', 'b', 'c', 'd'], 2);\n\
     * // => [['a', 'b'], ['c', 'd']]\n\
     *\n\
     * _.chunk(['a', 'b', 'c', 'd'], 3);\n\
     * // => [['a', 'b', 'c'], ['d']]\n\
     */\n\
    function chunk(array, size, guard) {\n\
      if (guard ? isIterateeCall(array, size, guard) : size == null) {\n\
        size = 1;\n\
      } else {\n\
        size = nativeMax(+size || 1, 1);\n\
      }\n\
      var index = 0,\n\
          length = array ? array.length : 0,\n\
          resIndex = -1,\n\
          result = Array(ceil(length / size));\n\
\n\
      while (index < length) {\n\
        result[++resIndex] = slice(array, index, (index += size));\n\
      }\n\
      return result;\n\
    }\n\
\n\
    /**\n\
     * Creates an array with all falsey values removed. The values `false`, `null`,\n\
     * `0`, `\"\"`, `undefined`, and `NaN` are all falsey.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Array\n\
     * @param {Array} array The array to compact.\n\
     * @returns {Array} Returns the new array of filtered values.\n\
     * @example\n\
     *\n\
     * _.compact([0, 1, false, 2, '', 3]);\n\
     * // => [1, 2, 3]\n\
     */\n\
    function compact(array) {\n\
      var index = -1,\n\
          length = array ? array.length : 0,\n\
          resIndex = -1,\n\
          result = [];\n\
\n\
      while (++index < length) {\n\
        var value = array[index];\n\
        if (value) {\n\
          result[++resIndex] = value;\n\
        }\n\
      }\n\
      return result;\n\
    }\n\
\n\
    /**\n\
     * Creates an array excluding all values of the provided arrays using\n\
     * `SameValueZero` for equality comparisons.\n\
     *\n\
     * **Note:** `SameValueZero` comparisons are like strict equality comparisons,\n\
     * e.g. `===`, except that `NaN` matches `NaN`. See the\n\
     * [ES6 spec](https://people.mozilla.org/~jorendorff/es6-draft.html#sec-samevaluezero)\n\
     * for more details.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Array\n\
     * @param {Array} array The array to inspect.\n\
     * @param {...Array} [values] The arrays of values to exclude.\n\
     * @returns {Array} Returns the new array of filtered values.\n\
     * @example\n\
     *\n\
     * _.difference([1, 2, 3], [5, 2, 10]);\n\
     * // => [1, 3]\n\
     */\n\
    function difference() {\n\
      var index = -1,\n\
          length = arguments.length;\n\
\n\
      while (++index < length) {\n\
        var value = arguments[index];\n\
        if (isArray(value) || isArguments(value)) {\n\
          break;\n\
        }\n\
      }\n\
      return baseDifference(value, baseFlatten(arguments, false, true, ++index));\n\
    }\n\
\n\
    /**\n\
     * Creates a slice of `array` with `n` elements dropped from the beginning.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @type Function\n\
     * @category Array\n\
     * @param {Array} array The array to query.\n\
     * @param {number} [n=1] The number of elements to drop.\n\
     * @param- {Object} [guard] Enables use as a callback for functions like `_.map`.\n\
     * @returns {Array} Returns the slice of `array`.\n\
     * @example\n\
     *\n\
     * _.drop([1, 2, 3], 1);\n\
     * // => [2, 3]\n\
     *\n\
     * _.drop([1, 2, 3], 2);\n\
     * // => [3]\n\
     *\n\
     * _.drop([1, 2, 3], 5);\n\
     * // => []\n\
     *\n\
     * _.drop([1, 2, 3], 0);\n\
     * // => [1, 2, 3]\n\
     */\n\
    function drop(array, n, guard) {\n\
      if (guard ? isIterateeCall(array, n, guard) : n == null) {\n\
        n = 1;\n\
      }\n\
      return slice(array, n < 0 ? 0 : n);\n\
    }\n\
\n\
    /**\n\
     * Creates a slice of `array` with `n` elements dropped from the end.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @type Function\n\
     * @category Array\n\
     * @param {Array} array The array to query.\n\
     * @param {number} [n=1] The number of elements to drop.\n\
     * @param- {Object} [guard] Enables use as a callback for functions like `_.map`.\n\
     * @returns {Array} Returns the slice of `array`.\n\
     * @example\n\
     *\n\
     * _.dropRight([1, 2, 3], 1);\n\
     * // => [1, 2]\n\
     *\n\
     * _.dropRight([1, 2, 3], 2);\n\
     * // => [1]\n\
     *\n\
     * _.dropRight([1, 2, 3], 5);\n\
     * // => []\n\
     *\n\
     * _.dropRight([1, 2, 3], 0);\n\
     * // => [1, 2, 3]\n\
     */\n\
    function dropRight(array, n, guard) {\n\
      if (guard ? isIterateeCall(array, n, guard) : n == null) {\n\
        n = 1;\n\
      }\n\
      n = array ? (array.length - (+n || 0)) : 0;\n\
      return slice(array, 0, n < 0 ? 0 : n);\n\
    }\n\
\n\
    /**\n\
     * Creates a slice of `array` excluding elements dropped from the end.\n\
     * Elements are dropped until `predicate` returns falsey. The predicate is\n\
     * bound to `thisArg` and invoked with three arguments; (value, index, array).\n\
     *\n\
     * If a property name is provided for `predicate` the created \"_.pluck\" style\n\
     * callback returns the property value of the given element.\n\
     *\n\
     * If an object is provided for `predicate` the created \"_.where\" style callback\n\
     * returns `true` for elements that have the properties of the given object,\n\
     * else `false`.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @type Function\n\
     * @category Array\n\
     * @param {Array} array The array to query.\n\
     * @param {Function|Object|string} [predicate=_.identity] The function invoked\n\
     *  per element.\n\
     * @param {*} [thisArg] The `this` binding of `predicate`.\n\
     * @returns {Array} Returns the slice of `array`.\n\
     * @example\n\
     *\n\
     * _.dropRightWhile([1, 2, 3], function(n) { return n > 1; });\n\
     * // => [1]\n\
     *\n\
     * var users = [\n\
     *   { 'user': 'barney',  'status': 'busy', 'active': false },\n\
     *   { 'user': 'fred',    'status': 'busy', 'active': true },\n\
     *   { 'user': 'pebbles', 'status': 'away', 'active': true }\n\
     * ];\n\
     *\n\
     * // using \"_.pluck\" callback shorthand\n\
     * _.pluck(_.dropRightWhile(users, 'active'), 'user');\n\
     * // => ['barney']\n\
     *\n\
     * // using \"_.where\" callback shorthand\n\
     * _.pluck(_.dropRightWhile(users, { 'status': 'away' }), 'user');\n\
     * // => ['barney', 'fred']\n\
     */\n\
    function dropRightWhile(array, predicate, thisArg) {\n\
      var length = array ? array.length : 0;\n\
\n\
      predicate = getCallback(predicate, thisArg, 3);\n\
      while (length-- && predicate(array[length], length, array)) {}\n\
      return slice(array, 0, length + 1);\n\
    }\n\
\n\
    /**\n\
     * Creates a slice of `array` excluding elements dropped from the beginning.\n\
     * Elements are dropped until `predicate` returns falsey. The predicate is\n\
     * bound to `thisArg` and invoked with three arguments; (value, index, array).\n\
     *\n\
     * If a property name is provided for `predicate` the created \"_.pluck\" style\n\
     * callback returns the property value of the given element.\n\
     *\n\
     * If an object is provided for `predicate` the created \"_.where\" style callback\n\
     * returns `true` for elements that have the properties of the given object,\n\
     * else `false`.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @type Function\n\
     * @category Array\n\
     * @param {Array} array The array to query.\n\
     * @param {Function|Object|string} [predicate=_.identity] The function invoked\n\
     *  per element.\n\
     * @param {*} [thisArg] The `this` binding of `predicate`.\n\
     * @returns {Array} Returns the slice of `array`.\n\
     * @example\n\
     *\n\
     * _.dropWhile([1, 2, 3], function(n) { return n < 3; });\n\
     * // => [3]\n\
     *\n\
     * var users = [\n\
     *   { 'user': 'barney',  'status': 'busy', 'active': true },\n\
     *   { 'user': 'fred',    'status': 'busy', 'active': false },\n\
     *   { 'user': 'pebbles', 'status': 'away', 'active': true }\n\
     * ];\n\
     *\n\
     * // using \"_.pluck\" callback shorthand\n\
     * _.pluck(_.dropWhile(users, 'active'), 'user');\n\
     * // => ['fred', 'pebbles']\n\
     *\n\
     * // using \"_.where\" callback shorthand\n\
     * _.pluck(_.dropWhile(users, { 'status': 'busy' }), 'user');\n\
     * // => ['pebbles']\n\
     */\n\
    function dropWhile(array, predicate, thisArg) {\n\
      var index = -1,\n\
          length = array ? array.length : 0;\n\
\n\
      predicate = getCallback(predicate, thisArg, 3);\n\
      while (++index < length && predicate(array[index], index, array)) {}\n\
      return slice(array, index);\n\
    }\n\
\n\
    /**\n\
     * This method is like `_.find` except that it returns the index of the first\n\
     * element `predicate` returns truthy for, instead of the element itself.\n\
     *\n\
     * If a property name is provided for `predicate` the created \"_.pluck\" style\n\
     * callback returns the property value of the given element.\n\
     *\n\
     * If an object is provided for `predicate` the created \"_.where\" style callback\n\
     * returns `true` for elements that have the properties of the given object,\n\
     * else `false`.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Array\n\
     * @param {Array} array The array to search.\n\
     * @param {Function|Object|string} [predicate=_.identity] The function invoked\n\
     *  per iteration. If a property name or object is provided it is used to\n\
     *  create a \"_.pluck\" or \"_.where\" style callback respectively.\n\
     * @param {*} [thisArg] The `this` binding of `predicate`.\n\
     * @returns {number} Returns the index of the found element, else `-1`.\n\
     * @example\n\
     *\n\
     * var users = [\n\
     *   { 'user': 'barney',  'age': 36, 'active': false },\n\
     *   { 'user': 'fred',    'age': 40, 'active': true },\n\
     *   { 'user': 'pebbles', 'age': 1,  'active': false }\n\
     * ];\n\
     *\n\
     * _.findIndex(users, function(chr) { return chr.age < 40; });\n\
     * // => 0\n\
     *\n\
     * // using \"_.where\" callback shorthand\n\
     * _.findIndex(users, { 'age': 1 });\n\
     * // => 2\n\
     *\n\
     * // using \"_.pluck\" callback shorthand\n\
     * _.findIndex(users, 'active');\n\
     * // => 1\n\
     */\n\
    function findIndex(array, predicate, thisArg) {\n\
      var index = -1,\n\
          length = array ? array.length : 0;\n\
\n\
      predicate = getCallback(predicate, thisArg, 3);\n\
      while (++index < length) {\n\
        if (predicate(array[index], index, array)) {\n\
          return index;\n\
        }\n\
      }\n\
      return -1;\n\
    }\n\
\n\
    /**\n\
     * This method is like `_.findIndex` except that it iterates over elements\n\
     * of `collection` from right to left.\n\
     *\n\
     * If a property name is provided for `predicate` the created \"_.pluck\" style\n\
     * callback returns the property value of the given element.\n\
     *\n\
     * If an object is provided for `predicate` the created \"_.where\" style callback\n\
     * returns `true` for elements that have the properties of the given object,\n\
     * else `false`.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Array\n\
     * @param {Array} array The array to search.\n\
     * @param {Function|Object|string} [predicate=_.identity] The function invoked\n\
     *  per iteration. If a property name or object is provided it is used to\n\
     *  create a \"_.pluck\" or \"_.where\" style callback respectively.\n\
     * @param {*} [thisArg] The `this` binding of `predicate`.\n\
     * @returns {number} Returns the index of the found element, else `-1`.\n\
     * @example\n\
     *\n\
     * var users = [\n\
     *   { 'user': 'barney',  'age': 36, 'active': true },\n\
     *   { 'user': 'fred',    'age': 40, 'active': false },\n\
     *   { 'user': 'pebbles', 'age': 1,  'active': false }\n\
     * ];\n\
     *\n\
     * _.findLastIndex(users, function(chr) { return chr.age < 40; });\n\
     * // => 2\n\
     *\n\
     * // using \"_.where\" callback shorthand\n\
     * _.findLastIndex(users, { 'age': 40 });\n\
     * // => 1\n\
     *\n\
     * // using \"_.pluck\" callback shorthand\n\
     * _.findLastIndex(users, 'active');\n\
     * // => 0\n\
     */\n\
    function findLastIndex(array, predicate, thisArg) {\n\
      var length = array ? array.length : 0;\n\
\n\
      predicate = getCallback(predicate, thisArg, 3);\n\
      while (length--) {\n\
        if (predicate(array[length], length, array)) {\n\
          return length;\n\
        }\n\
      }\n\
      return -1;\n\
    }\n\
\n\
    /**\n\
     * Gets the first element of `array`.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @alias head\n\
     * @category Array\n\
     * @param {Array} array The array to query.\n\
     * @returns {*} Returns the first element of `array`.\n\
     * @example\n\
     *\n\
     * _.first([1, 2, 3]);\n\
     * // => 1\n\
     *\n\
     * _.first([]);\n\
     * // => undefined\n\
     */\n\
    function first(array) {\n\
      return array ? array[0] : undefined;\n\
    }\n\
\n\
    /**\n\
     * Flattens a nested array. If `isDeep` is `true` the array is recursively\n\
     * flattened, otherwise it is only flattened a single level.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Array\n\
     * @param {Array} array The array to flatten.\n\
     * @param {boolean} [isDeep=false] Specify a deep flatten.\n\
     * @param- {Object} [guard] Enables use as a callback for functions like `_.map`.\n\
     * @returns {Array} Returns the new flattened array.\n\
     * @example\n\
     *\n\
     * _.flatten([1, [2], [3, [[4]]]]);\n\
     * // => [1, 2, 3, [[4]]];\n\
     *\n\
     * // using `isDeep`\n\
     * _.flatten([1, [2], [3, [[4]]]], true);\n\
     * // => [1, 2, 3, 4];\n\
     */\n\
    function flatten(array, isDeep, guard) {\n\
      var length = array ? array.length : 0;\n\
      if (guard && isIterateeCall(array, isDeep, guard)) {\n\
        isDeep = false;\n\
      }\n\
      return length ? baseFlatten(array, isDeep) : [];\n\
    }\n\
\n\
    /**\n\
     * Recursively flattens a nested array.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Array\n\
     * @param {Array} array The array to recursively flatten.\n\
     * @returns {Array} Returns the new flattened array.\n\
     * @example\n\
     *\n\
     * _.flattenDeep([1, [2], [3, [[4]]]]);\n\
     * // => [1, 2, 3, 4];\n\
     */\n\
    function flattenDeep(array) {\n\
      var length = array ? array.length : 0;\n\
      return length ? baseFlatten(array, true) : [];\n\
    }\n\
\n\
    /**\n\
     * Gets the index at which the first occurrence of `value` is found in `array`\n\
     * using `SameValueZero` for equality comparisons. If `fromIndex` is negative,\n\
     * it is used as the offset from the end of `array`. If `array` is sorted\n\
     * providing `true` for `fromIndex` performs a faster binary search.\n\
     *\n\
     * **Note:** `SameValueZero` comparisons are like strict equality comparisons,\n\
     * e.g. `===`, except that `NaN` matches `NaN`. See the\n\
     * [ES6 spec](https://people.mozilla.org/~jorendorff/es6-draft.html#sec-samevaluezero)\n\
     * for more details.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Array\n\
     * @param {Array} array The array to search.\n\
     * @param {*} value The value to search for.\n\
     * @param {boolean|number} [fromIndex=0] The index to search from or `true`\n\
     *  to perform a binary search on a sorted array.\n\
     * @returns {number} Returns the index of the matched value, else `-1`.\n\
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
     * _.indexOf([4, 4, 5, 5, 6, 6], 5, true);\n\
     * // => 2\n\
     */\n\
    function indexOf(array, value, fromIndex) {\n\
      var length = array ? array.length : 0;\n\
      if (!length) {\n\
        return -1;\n\
      }\n\
      if (typeof fromIndex == 'number') {\n\
        fromIndex = fromIndex < 0 ? nativeMax(length + fromIndex, 0) : (fromIndex || 0);\n\
      } else if (fromIndex) {\n\
        var index = sortedIndex(array, value),\n\
            other = array[index];\n\
\n\
        return (value === value ? value === other : other !== other) ? index : -1;\n\
      }\n\
      return baseIndexOf(array, value, fromIndex);\n\
    }\n\
\n\
    /**\n\
     * Gets all but the last element of `array`.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Array\n\
     * @param {Array} array The array to query.\n\
     * @returns {Array} Returns the slice of `array`.\n\
     * @example\n\
     *\n\
     * _.initial([1, 2, 3]);\n\
     * // => [1, 2]\n\
     */\n\
    function initial(array) {\n\
      return dropRight(array, 1);\n\
    }\n\
\n\
    /**\n\
     * Creates an array of unique values in all provided arrays using `SameValueZero`\n\
     * for equality comparisons.\n\
     *\n\
     * **Note:** `SameValueZero` comparisons are like strict equality comparisons,\n\
     * e.g. `===`, except that `NaN` matches `NaN`. See the\n\
     * [ES6 spec](https://people.mozilla.org/~jorendorff/es6-draft.html#sec-samevaluezero)\n\
     * for more details.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Array\n\
     * @param {...Array} [arrays] The arrays to inspect.\n\
     * @returns {Array} Returns the new array of shared values.\n\
     * @example\n\
     *\n\
     * _.intersection([1, 2, 3], [5, 2, 1, 4], [2, 1]);\n\
     * // => [1, 2]\n\
     */\n\
    function intersection() {\n\
      var args = [],\n\
          argsIndex = -1,\n\
          argsLength = arguments.length,\n\
          caches = [],\n\
          indexOf = getIndexOf(),\n\
          isCommon = indexOf == baseIndexOf;\n\
\n\
      while (++argsIndex < argsLength) {\n\
        var value = arguments[argsIndex];\n\
        if (isArray(value) || isArguments(value)) {\n\
          args.push(value);\n\
          caches.push(isCommon && value.length >= 120 && createCache(argsIndex && value));\n\
        }\n\
      }\n\
      argsLength = args.length;\n\
      var array = args[0],\n\
          index = -1,\n\
          length = array ? array.length : 0,\n\
          result = [],\n\
          seen = caches[0];\n\
\n\
      outer:\n\
      while (++index < length) {\n\
        value = array[index];\n\
        if ((seen ? cacheIndexOf(seen, value) : indexOf(result, value)) < 0) {\n\
          argsIndex = argsLength;\n\
          while (--argsIndex) {\n\
            var cache = caches[argsIndex];\n\
            if ((cache ? cacheIndexOf(cache, value) : indexOf(args[argsIndex], value)) < 0) {\n\
              continue outer;\n\
            }\n\
          }\n\
          if (seen) {\n\
            seen.push(value);\n\
          }\n\
          result.push(value);\n\
        }\n\
      }\n\
      return result;\n\
    }\n\
\n\
    /**\n\
     * Gets the last element of `array`.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Array\n\
     * @param {Array} array The array to query.\n\
     * @returns {*} Returns the last element of `array`.\n\
     * @example\n\
     *\n\
     * _.last([1, 2, 3]);\n\
     * // => 3\n\
     */\n\
    function last(array) {\n\
      var length = array ? array.length : 0;\n\
      return length ? array[length - 1] : undefined;\n\
    }\n\
\n\
    /**\n\
     * This method is like `_.indexOf` except that it iterates over elements of\n\
     * `array` from right to left.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Array\n\
     * @param {Array} array The array to search.\n\
     * @param {*} value The value to search for.\n\
     * @param {boolean|number} [fromIndex=array.length-1] The index to search from\n\
     *  or `true` to perform a binary search on a sorted array.\n\
     * @returns {number} Returns the index of the matched value, else `-1`.\n\
     * @example\n\
     *\n\
     * _.lastIndexOf([1, 2, 3, 1, 2, 3], 2);\n\
     * // => 4\n\
     *\n\
     * // using `fromIndex`\n\
     * _.lastIndexOf([1, 2, 3, 1, 2, 3], 2, 3);\n\
     * // => 1\n\
     *\n\
     * // performing a binary search\n\
     * _.lastIndexOf([4, 4, 5, 5, 6, 6], 5, true);\n\
     * // => 3\n\
     */\n\
    function lastIndexOf(array, value, fromIndex) {\n\
      var length = array ? array.length : 0;\n\
      if (!length) {\n\
        return -1;\n\
      }\n\
      var index = length;\n\
      if (typeof fromIndex == 'number') {\n\
        index = (fromIndex < 0 ? nativeMax(length + fromIndex, 0) : nativeMin(fromIndex || 0, length - 1)) + 1;\n\
      } else if (fromIndex) {\n\
        index = sortedLastIndex(array, value) - 1;\n\
        var other = array[index];\n\
        return (value === value ? value === other : other !== other) ? index : -1;\n\
      }\n\
      if (value !== value) {\n\
        return indexOfNaN(array, index, true);\n\
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
     * Removes all provided values from `array` using `SameValueZero` for equality\n\
     * comparisons.\n\
     *\n\
     * **Notes:**\n\
     *  - Unlike `_.without`, this method mutates `array`.\n\
     *  - `SameValueZero` comparisons are like strict equality comparisons,\n\
     *    e.g. `===`, except that `NaN` matches `NaN`. See the\n\
     *    [ES6 spec](https://people.mozilla.org/~jorendorff/es6-draft.html#sec-samevaluezero)\n\
     *    for more details.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Array\n\
     * @param {Array} array The array to modify.\n\
     * @param {...*} [values] The values to remove.\n\
     * @returns {Array} Returns `array`.\n\
     * @example\n\
     *\n\
     * var array = [1, 2, 3, 1, 2, 3];\n\
     * _.pull(array, 2, 3);\n\
     * console.log(array);\n\
     * // => [1, 1]\n\
     */\n\
    function pull() {\n\
      var array = arguments[0];\n\
      if (!(array && array.length)) {\n\
        return array;\n\
      }\n\
      var index = 0,\n\
          indexOf = getIndexOf(),\n\
          length = arguments.length;\n\
\n\
      while (++index < length) {\n\
        var fromIndex = 0,\n\
            value = arguments[index];\n\
\n\
        while ((fromIndex = indexOf(array, value, fromIndex)) > -1) {\n\
          splice.call(array, fromIndex, 1);\n\
        }\n\
      }\n\
      return array;\n\
    }\n\
\n\
    /**\n\
     * Removes elements from `array` corresponding to the specified indexes and\n\
     * returns an array of the removed elements. Indexes may be specified as an\n\
     * array of indexes or as individual arguments.\n\
     *\n\
     * **Note:** Unlike `_.at`, this method mutates `array`.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Array\n\
     * @param {Array} array The array to modify.\n\
     * @param {...(number|number[])} [indexes] The indexes of elements to remove,\n\
     *  specified as individual indexes or arrays of indexes.\n\
     * @returns {Array} Returns the new array of removed elements.\n\
     * @example\n\
     *\n\
     * var array = [5, 10, 15, 20];\n\
     * var evens = _.pullAt(array, [1, 3]);\n\
     *\n\
     * console.log(array);\n\
     * // => [5, 15]\n\
     *\n\
     * console.log(evens);\n\
     * // => [10, 20]\n\
     */\n\
    function pullAt(array) {\n\
      return basePullAt(array || [], baseFlatten(arguments, false, false, 1));\n\
    }\n\
\n\
    /**\n\
     * Removes all elements from `array` that `predicate` returns truthy for\n\
     * and returns an array of the removed elements. The predicate is bound to\n\
     * `thisArg` and invoked with three arguments; (value, index, array).\n\
     *\n\
     * If a property name is provided for `predicate` the created \"_.pluck\" style\n\
     * callback returns the property value of the given element.\n\
     *\n\
     * If an object is provided for `predicate` the created \"_.where\" style callback\n\
     * returns `true` for elements that have the properties of the given object,\n\
     * else `false`.\n\
     *\n\
     * **Note:** Unlike `_.filter`, this method mutates `array`.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Array\n\
     * @param {Array} array The array to modify.\n\
     * @param {Function|Object|string} [predicate=_.identity] The function invoked\n\
     *  per iteration. If a property name or object is provided it is used to\n\
     *  create a \"_.pluck\" or \"_.where\" style callback respectively.\n\
     * @param {*} [thisArg] The `this` binding of `predicate`.\n\
     * @returns {Array} Returns the new array of removed elements.\n\
     * @example\n\
     *\n\
     * var array = [1, 2, 3, 4];\n\
     * var evens = _.remove(array, function(n) { return n % 2 == 0; });\n\
     *\n\
     * console.log(array);\n\
     * // => [1, 3]\n\
     *\n\
     * console.log(evens);\n\
     * // => [2, 4]\n\
     */\n\
    function remove(array, predicate, thisArg) {\n\
      var index = -1,\n\
          length = array ? array.length : 0,\n\
          result = [];\n\
\n\
      predicate = getCallback(predicate, thisArg, 3);\n\
      while (++index < length) {\n\
        var value = array[index];\n\
        if (predicate(value, index, array)) {\n\
          result.push(value);\n\
          splice.call(array, index--, 1);\n\
          length--;\n\
        }\n\
      }\n\
      return result;\n\
    }\n\
\n\
    /**\n\
     * Gets all but the first element of `array`.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @alias tail\n\
     * @category Array\n\
     * @param {Array} array The array to query.\n\
     * @returns {Array} Returns the slice of `array`.\n\
     * @example\n\
     *\n\
     * _.rest([1, 2, 3]);\n\
     * // => [2, 3]\n\
     */\n\
    function rest(array) {\n\
      return drop(array, 1);\n\
    }\n\
\n\
    /**\n\
     * Creates a slice of `array` from `start` up to, but not including, `end`.\n\
     *\n\
     * **Note:** This function is used instead of `Array#slice` to support node\n\
     * lists in IE < 9 and to ensure dense arrays are returned.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Array\n\
     * @param {Array} array The array to slice.\n\
     * @param {number} [start=0] The start position.\n\
     * @param {number} [end=array.length] The end position.\n\
     * @returns {Array} Returns the slice of `array`.\n\
     */\n\
    function slice(array, start, end) {\n\
      var index = -1,\n\
          length = array ? array.length : 0,\n\
          endType = typeof end;\n\
\n\
      if (end && endType != 'number' && isIterateeCall(array, start, end)) {\n\
        start = 0;\n\
        end = length;\n\
      }\n\
      start = start == null ? 0 : (+start || 0);\n\
      if (start < 0) {\n\
        start = -start > length ? 0 : (length + start);\n\
      }\n\
      end = (endType == 'undefined' || end > length) ? length : (+end || 0);\n\
      if (end < 0) {\n\
        end += length;\n\
      }\n\
      if (end && end == length && !start) {\n\
        return baseSlice(array);\n\
      }\n\
      length = start > end ? 0 : (end - start);\n\
\n\
      var result = Array(length);\n\
      while (++index < length) {\n\
        result[index] = array[index + start];\n\
      }\n\
      return result;\n\
    }\n\
\n\
    /**\n\
     * Uses a binary search to determine the lowest index at which a value should\n\
     * be inserted into a given sorted array in order to maintain the sort order\n\
     * of the array. If an iteratee function is provided it is invoked for `value`\n\
     * and each element of `array` to compute their sort ranking. The iteratee\n\
     * is bound to `thisArg` and invoked with one argument; (value).\n\
     *\n\
     * If a property name is provided for `iteratee` the created \"_.pluck\" style\n\
     * callback returns the property value of the given element.\n\
     *\n\
     * If an object is provided for `iteratee` the created \"_.where\" style callback\n\
     * returns `true` for elements that have the properties of the given object,\n\
     * else `false`.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Array\n\
     * @param {Array} array The array to inspect.\n\
     * @param {*} value The value to evaluate.\n\
     * @param {Function|Object|string} [iteratee=_.identity] The function invoked\n\
     *  per iteration. If a property name or object is provided it is used to\n\
     *  create a \"_.pluck\" or \"_.where\" style callback respectively.\n\
     * @param {*} [thisArg] The `this` binding of `iteratee`.\n\
     * @returns {number} Returns the index at which `value` should be inserted\n\
     *  into `array`.\n\
     * @example\n\
     *\n\
     * _.sortedIndex([30, 50], 40);\n\
     * // => 1\n\
     *\n\
     * _.sortedIndex([4, 4, 5, 5, 6, 6], 5);\n\
     * // => 2\n\
     *\n\
     * var dict = { 'data': { 'thirty': 30, 'forty': 40, 'fifty': 50 } };\n\
     *\n\
     * // using an iteratee function\n\
     * _.sortedIndex(['thirty', 'fifty'], 'forty', function(word) {\n\
     *   return this.data[word];\n\
     * }, dict);\n\
     * // => 1\n\
     *\n\
     * // using \"_.pluck\" callback shorthand\n\
     * _.sortedIndex([{ 'x': 30 }, { 'x': 50 }], { 'x': 40 }, 'x');\n\
     * // => 1\n\
     */\n\
    function sortedIndex(array, value, iteratee, thisArg) {\n\
      iteratee = iteratee == null ? identity : getCallback(iteratee, thisArg, 1);\n\
      return baseSortedIndex(array, value, iteratee);\n\
    }\n\
\n\
    /**\n\
     * This method is like `_.sortedIndex` except that it returns the highest\n\
     * index at which a value should be inserted into a given sorted array in\n\
     * order to maintain the sort order of the array.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Array\n\
     * @param {Array} array The array to inspect.\n\
     * @param {*} value The value to evaluate.\n\
     * @param {Function|Object|string} [iteratee=_.identity] The function invoked\n\
     *  per iteration. If a property name or object is provided it is used to\n\
     *  create a \"_.pluck\" or \"_.where\" style callback respectively.\n\
     * @param {*} [thisArg] The `this` binding of `iteratee`.\n\
     * @returns {number} Returns the index at which `value` should be inserted\n\
     *  into `array`.\n\
     * @example\n\
     *\n\
     * _.sortedLastIndex([4, 4, 5, 5, 6, 6], 5);\n\
     * // => 4\n\
     */\n\
    function sortedLastIndex(array, value, iteratee, thisArg) {\n\
      iteratee = iteratee == null ? identity : getCallback(iteratee, thisArg, 1);\n\
      return baseSortedIndex(array, value, iteratee, true);\n\
    }\n\
\n\
    /**\n\
     * Creates a slice of `array` with `n` elements taken from the beginning.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @type Function\n\
     * @category Array\n\
     * @param {Array} array The array to query.\n\
     * @param {number} [n=1] The number of elements to take.\n\
     * @param- {Object} [guard] Enables use as a callback for functions like `_.map`.\n\
     * @returns {Array} Returns the slice of `array`.\n\
     * @example\n\
     *\n\
     * _.take([1, 2, 3], 1);\n\
     * // => [1]\n\
     *\n\
     * _.take([1, 2, 3], 2);\n\
     * // => [1, 2]\n\
     *\n\
     * _.take([1, 2, 3], 5);\n\
     * // => [1, 2, 3]\n\
     *\n\
     * _.take([1, 2, 3], 0);\n\
     * // => []\n\
     */\n\
    function take(array, n, guard) {\n\
      if (guard ? isIterateeCall(array, n, guard) : n == null) {\n\
        n = 1;\n\
      }\n\
      return slice(array, 0, n < 0 ? 0 : n);\n\
    }\n\
\n\
    /**\n\
     * Creates a slice of `array` with `n` elements taken from the end.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @type Function\n\
     * @category Array\n\
     * @param {Array} array The array to query.\n\
     * @param {number} [n=1] The number of elements to take.\n\
     * @param- {Object} [guard] Enables use as a callback for functions like `_.map`.\n\
     * @returns {Array} Returns the slice of `array`.\n\
     * @example\n\
     *\n\
     * _.takeRight([1, 2, 3], 1);\n\
     * // => [3]\n\
     *\n\
     * _.takeRight([1, 2, 3], 2);\n\
     * // => [2, 3]\n\
     *\n\
     * _.takeRight([1, 2, 3], 5);\n\
     * // => [1, 2, 3]\n\
     *\n\
     * _.takeRight([1, 2, 3], 0);\n\
     * // => []\n\
     */\n\
    function takeRight(array, n, guard) {\n\
      if (guard ? isIterateeCall(array, n, guard) : n == null) {\n\
        n = 1;\n\
      }\n\
      n = array ? (array.length - (+n || 0)) : 0;\n\
      return slice(array, n < 0 ? 0 : n);\n\
    }\n\
\n\
    /**\n\
     * Creates a slice of `array` with elements taken from the end. Elements are\n\
     * taken until `predicate` returns falsey. The predicate is bound to `thisArg`\n\
     * and invoked with three arguments; (value, index, array).\n\
     *\n\
     * If a property name is provided for `predicate` the created \"_.pluck\" style\n\
     * callback returns the property value of the given element.\n\
     *\n\
     * If an object is provided for `predicate` the created \"_.where\" style callback\n\
     * returns `true` for elements that have the properties of the given object,\n\
     * else `false`.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @type Function\n\
     * @category Array\n\
     * @param {Array} array The array to query.\n\
     * @param {Function|Object|string} [predicate=_.identity] The function invoked\n\
     *  per element.\n\
     * @param {*} [thisArg] The `this` binding of `predicate`.\n\
     * @returns {Array} Returns the slice of `array`.\n\
     * @example\n\
     *\n\
     * _.takeRightWhile([1, 2, 3], function(n) { return n > 1; });\n\
     * // => [2, 3]\n\
     *\n\
     * var users = [\n\
     *   { 'user': 'barney',  'status': 'busy', 'active': false },\n\
     *   { 'user': 'fred',    'status': 'busy', 'active': true },\n\
     *   { 'user': 'pebbles', 'status': 'away', 'active': true }\n\
     * ];\n\
     *\n\
     * // using \"_.pluck\" callback shorthand\n\
     * _.pluck(_.takeRightWhile(users, 'active'), 'user');\n\
     * // => ['fred', 'pebbles']\n\
     *\n\
     * // using \"_.where\" callback shorthand\n\
     * _.pluck(_.takeRightWhile(users, { 'status': 'away' }), 'user');\n\
     * // => ['pebbles']\n\
     */\n\
    function takeRightWhile(array, predicate, thisArg) {\n\
      var length = array ? array.length : 0;\n\
\n\
      predicate = getCallback(predicate, thisArg, 3);\n\
      while (length-- && predicate(array[length], length, array)) {}\n\
      return slice(array, length + 1);\n\
    }\n\
\n\
    /**\n\
     * Creates a slice of `array` with elements taken from the beginning. Elements\n\
     * are taken until `predicate` returns falsey. The predicate is bound to\n\
     * `thisArg` and invoked with three arguments; (value, index, array).\n\
     *\n\
     * If a property name is provided for `predicate` the created \"_.pluck\" style\n\
     * callback returns the property value of the given element.\n\
     *\n\
     * If an object is provided for `predicate` the created \"_.where\" style callback\n\
     * returns `true` for elements that have the properties of the given object,\n\
     * else `false`.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @type Function\n\
     * @category Array\n\
     * @param {Array} array The array to query.\n\
     * @param {Function|Object|string} [predicate=_.identity] The function invoked\n\
     *  per element.\n\
     * @param {*} [thisArg] The `this` binding of `predicate`.\n\
     * @returns {Array} Returns the slice of `array`.\n\
     * @example\n\
     *\n\
     * _.takeWhile([1, 2, 3], function(n) { return n < 3; });\n\
     * // => [1, 2]\n\
     *\n\
     * var users = [\n\
     *   { 'user': 'barney',  'status': 'busy', 'active': true },\n\
     *   { 'user': 'fred',    'status': 'busy', 'active': false },\n\
     *   { 'user': 'pebbles', 'status': 'away', 'active': true }\n\
     * ];\n\
     *\n\
     * // using \"_.pluck\" callback shorthand\n\
     * _.pluck(_.takeWhile(users, 'active'), 'user');\n\
     * // => ['barney']\n\
     *\n\
     * // using \"_.where\" callback shorthand\n\
     * _.pluck(_.takeWhile(users, { 'status': 'busy' }), 'user');\n\
     * // => ['barney', 'fred']\n\
     */\n\
    function takeWhile(array, predicate, thisArg) {\n\
      var index = -1,\n\
          length = array ? array.length : 0;\n\
\n\
      predicate = getCallback(predicate, thisArg, 3);\n\
      while (++index < length && predicate(array[index], index, array)) {}\n\
      return slice(array, 0, index);\n\
    }\n\
\n\
    /**\n\
     * Creates an array of unique values, in order, of the provided arrays using\n\
     * `SameValueZero` for equality comparisons.\n\
     *\n\
     * **Note:** `SameValueZero` comparisons are like strict equality comparisons,\n\
     * e.g. `===`, except that `NaN` matches `NaN`. See the\n\
     * [ES6 spec](https://people.mozilla.org/~jorendorff/es6-draft.html#sec-samevaluezero)\n\
     * for more details.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Array\n\
     * @param {...Array} [arrays] The arrays to inspect.\n\
     * @returns {Array} Returns the new array of combined values.\n\
     * @example\n\
     *\n\
     * _.union([1, 2, 3], [5, 2, 1, 4], [2, 1]);\n\
     * // => [1, 2, 3, 5, 4]\n\
     */\n\
    function union() {\n\
      return baseUniq(baseFlatten(arguments, false, true));\n\
    }\n\
\n\
    /**\n\
     * Creates a duplicate-value-free version of an array using `SameValueZero`\n\
     * for equality comparisons. Providing `true` for `isSorted` performs a faster\n\
     * search algorithm for sorted arrays. If an iteratee function is provided it\n\
     * is invoked for each value in the array to generate the criterion by which\n\
     * uniqueness is computed. The `iteratee` is bound to `thisArg` and invoked\n\
     * with three arguments; (value, index, array).\n\
     *\n\
     * If a property name is provided for `iteratee` the created \"_.pluck\" style\n\
     * callback returns the property value of the given element.\n\
     *\n\
     * If an object is provided for `iteratee` the created \"_.where\" style callback\n\
     * returns `true` for elements that have the properties of the given object,\n\
     * else `false`.\n\
     *\n\
     * **Note:** `SameValueZero` comparisons are like strict equality comparisons,\n\
     * e.g. `===`, except that `NaN` matches `NaN`. See the\n\
     * [ES6 spec](https://people.mozilla.org/~jorendorff/es6-draft.html#sec-samevaluezero)\n\
     * for more details.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @alias unique\n\
     * @category Array\n\
     * @param {Array} array The array to inspect.\n\
     * @param {boolean} [isSorted=false] Specify the array is sorted.\n\
     * @param {Function|Object|string} [iteratee] The function invoked per iteration.\n\
     *  If a property name or object is provided it is used to create a \"_.pluck\"\n\
     *  or \"_.where\" style callback respectively.\n\
     * @param {*} [thisArg] The `this` binding of `iteratee`.\n\
     * @returns {Array} Returns the new duplicate-value-free array.\n\
     * @example\n\
     *\n\
     * _.uniq([1, 2, 1]);\n\
     * // => [1, 2]\n\
     *\n\
     * // using `isSorted`\n\
     * _.uniq([1, 1, 2], true);\n\
     * // => [1, 2]\n\
     *\n\
     * // using an iteratee function\n\
     * _.uniq([1, 2.5, 1.5, 2], function(n) { return this.floor(n); }, Math);\n\
     * // => [1, 2.5]\n\
     *\n\
     * // using \"_.pluck\" callback shorthand\n\
     * _.uniq([{ 'x': 1 }, { 'x': 2 }, { 'x': 1 }], 'x');\n\
     * // => [{ 'x': 1 }, { 'x': 2 }]\n\
     */\n\
    function uniq(array, isSorted, iteratee, thisArg) {\n\
      var length = array ? array.length : 0;\n\
      if (!length) {\n\
        return [];\n\
      }\n\
      // Juggle arguments.\n\
      if (typeof isSorted != 'boolean' && isSorted != null) {\n\
        thisArg = iteratee;\n\
        iteratee = isIterateeCall(array, isSorted, thisArg) ? null : isSorted;\n\
        isSorted = false;\n\
      }\n\
      if (iteratee != null) {\n\
        iteratee = getCallback(iteratee, thisArg, 3);\n\
      }\n\
      return (isSorted && getIndexOf() == baseIndexOf)\n\
        ? sortedUniq(array, iteratee)\n\
        : baseUniq(array, iteratee);\n\
    }\n\
\n\
    /**\n\
     * This method is like `_.zip` except that it accepts an array of grouped\n\
     * elements and creates an array regrouping the elements to their pre `_.zip`\n\
     * configuration.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Array\n\
     * @param {Array} array The array of grouped elements to process.\n\
     * @returns {Array} Returns the new array of regrouped elements.\n\
     * @example\n\
     *\n\
     * var zipped = _.zip(['fred', 'barney'], [30, 40], [true, false]);\n\
     * // => [['fred', 30, true], ['barney', 40, false]]\n\
     *\n\
     * _.unzip(zipped);\n\
     * // => [['fred', 'barney'], [30, 40], [true, false]]\n\
     */\n\
    function unzip(array) {\n\
      var index = -1,\n\
          length = isObject(length = max(array, 'length')) && length.length || 0,\n\
          result = Array(length);\n\
\n\
      while (++index < length) {\n\
        result[index] = pluck(array, index);\n\
      }\n\
      return result;\n\
    }\n\
\n\
    /**\n\
     * Creates an array excluding all provided values using `SameValueZero` for\n\
     * equality comparisons.\n\
     *\n\
     * **Note:** `SameValueZero` comparisons are like strict equality comparisons,\n\
     * e.g. `===`, except that `NaN` matches `NaN`. See the\n\
     * [ES6 spec](https://people.mozilla.org/~jorendorff/es6-draft.html#sec-samevaluezero)\n\
     * for more details.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Array\n\
     * @param {Array} array The array to filter.\n\
     * @param {...*} [values] The values to exclude.\n\
     * @returns {Array} Returns the new array of filtered values.\n\
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
     * See [Wikipedia](http://en.wikipedia.org/wiki/Symmetric_difference) for\n\
     * more details.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Array\n\
     * @param {...Array} [arrays] The arrays to inspect.\n\
     * @returns {Array} Returns the new array of values.\n\
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
     * of the given arrays, and so on.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Array\n\
     * @param {...Array} [arrays] The arrays to process.\n\
     * @returns {Array} Returns the new array of grouped elements.\n\
     * @example\n\
     *\n\
     * _.zip(['fred', 'barney'], [30, 40], [true, false]);\n\
     * // => [['fred', 30, true], ['barney', 40, false]]\n\
     */\n\
    function zip() {\n\
      var length = arguments.length,\n\
          array = Array(length);\n\
\n\
      while (length--) {\n\
        array[length] = arguments[length];\n\
      }\n\
      return unzip(array);\n\
    }\n\
\n\
    /**\n\
     * Creates an object composed from arrays of property names and values. Provide\n\
     * either a single two dimensional array, e.g. `[[key1, value1], [key2, value2]]`\n\
     * or two arrays, one of property names and one of corresponding values.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @alias object\n\
     * @category Array\n\
     * @param {Array} props The property names.\n\
     * @param {Array} [values=[]] The property values.\n\
     * @returns {Object} Returns the new object.\n\
     * @example\n\
     *\n\
     * _.zipObject(['fred', 'barney'], [30, 40]);\n\
     * // => { 'fred': 30, 'barney': 40 }\n\
     */\n\
    function zipObject(props, values) {\n\
      var index = -1,\n\
          length = props ? props.length : 0,\n\
          result = {};\n\
\n\
      if (!values && length && !isArray(props[0])) {\n\
        values = [];\n\
      }\n\
      while (++index < length) {\n\
        var key = props[index];\n\
        if (values) {\n\
          result[key] = values[index];\n\
        } else if (key) {\n\
          result[key[0]] = key[1];\n\
        }\n\
      }\n\
      return result;\n\
    }\n\
\n\
    /*------------------------------------------------------------------------*/\n\
\n\
    /**\n\
     * Creates a `lodash` object that wraps `value` with explicit method\n\
     * chaining enabled.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Chain\n\
     * @param {*} value The value to wrap.\n\
     * @returns {Object} Returns the new `lodash` object.\n\
     * @example\n\
     *\n\
     * var users = [\n\
     *   { 'user': 'barney',  'age': 36 },\n\
     *   { 'user': 'fred',    'age': 40 },\n\
     *   { 'user': 'pebbles', 'age': 1 }\n\
     * ];\n\
     *\n\
     * var youngest = _.chain(users)\n\
     *   .sortBy('age')\n\
     *   .map(function(chr) { return chr.user + ' is ' + chr.age; })\n\
     *   .first()\n\
     *   .value();\n\
     * // => 'pebbles is 1'\n\
     */\n\
    function chain(value) {\n\
      var result = lodash(value);\n\
      result.__chain__ = true;\n\
      return result;\n\
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
     * @category Chain\n\
     * @param {*} value The value to provide to `interceptor`.\n\
     * @param {Function} interceptor The function to invoke.\n\
     * @param {*} [thisArg] The `this` binding of `interceptor`.\n\
     * @returns {*} Returns `value`.\n\
     * @example\n\
     *\n\
     * _([1, 2, 3])\n\
     *  .tap(function(array) { array.pop(); })\n\
     *  .reverse()\n\
     *  .value();\n\
     * // => [2, 1]\n\
     */\n\
    function tap(value, interceptor, thisArg) {\n\
      interceptor.call(thisArg, value);\n\
      return value;\n\
    }\n\
\n\
    /**\n\
     * This method is like `_.tap` except that it returns the result of `interceptor`.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Chain\n\
     * @param {*} value The value to provide to `interceptor`.\n\
     * @param {Function} interceptor The function to invoke.\n\
     * @param {*} [thisArg] The `this` binding of `interceptor`.\n\
     * @returns {*} Returns the result of `interceptor`.\n\
     * @example\n\
     *\n\
     * _([1, 2, 3])\n\
     *  .last()\n\
     *  .thru(function(value) { return [value]; })\n\
     *  .value();\n\
     * // => [3]\n\
     */\n\
    function thru(value, interceptor, thisArg) {\n\
      return interceptor.call(thisArg, value);\n\
    }\n\
\n\
    /**\n\
     * Enables explicit method chaining on the wrapper object.\n\
     *\n\
     * @name chain\n\
     * @memberOf _\n\
     * @category Chain\n\
     * @returns {*} Returns the `lodash` object.\n\
     * @example\n\
     *\n\
     * var users = [\n\
     *   { 'user': 'barney', 'age': 36 },\n\
     *   { 'user': 'fred',   'age': 40 }\n\
     * ];\n\
     *\n\
     * // without explicit chaining\n\
     * _(users).first();\n\
     * // => { 'user': 'barney', 'age': 36 }\n\
     *\n\
     * // with explicit chaining\n\
     * _(users).chain()\n\
     *   .first()\n\
     *   .pick('user')\n\
     *   .value();\n\
     * // => { 'user': 'barney' }\n\
     */\n\
    function wrapperChain() {\n\
      return chain(this);\n\
    }\n\
\n\
    /**\n\
     * Reverses the wrapped array so the first element becomes the last, the\n\
     * second element becomes the second to last, and so on.\n\
     *\n\
     * **Note:** This method mutates the wrapped array.\n\
     *\n\
     * @name reverse\n\
     * @memberOf _\n\
     * @category Chain\n\
     * @returns {Object} Returns the new reversed `lodash` object.\n\
     * @example\n\
     *\n\
     * var array = [1, 2, 3];\n\
     *\n\
     * _(array).reverse().value()\n\
     * // => [3, 2, 1]\n\
     *\n\
     * console.log(array);\n\
     * // => [3, 2, 1]\n\
     */\n\
    function wrapperReverse() {\n\
      var value = this.__wrapped__;\n\
      if (value instanceof LazyWrapper) {\n\
        return new LodashWrapper(value.reverse());\n\
      }\n\
      return this.thru(function(value) {\n\
        return value.reverse();\n\
      });\n\
    }\n\
\n\
    /**\n\
     * Produces the result of coercing the unwrapped value to a string.\n\
     *\n\
     * @name toString\n\
     * @memberOf _\n\
     * @category Chain\n\
     * @returns {string} Returns the coerced string value.\n\
     * @example\n\
     *\n\
     * _([1, 2, 3]).toString();\n\
     * // => '1,2,3'\n\
     */\n\
    function wrapperToString() {\n\
      return String(this.value());\n\
    }\n\
\n\
    /**\n\
     * Executes the chained sequence to extract the unwrapped value.\n\
     *\n\
     * @name value\n\
     * @memberOf _\n\
     * @alias toJSON, valueOf\n\
     * @category Chain\n\
     * @returns {*} Returns the resolved unwrapped value.\n\
     * @example\n\
     *\n\
     * _([1, 2, 3]).value();\n\
     * // => [1, 2, 3]\n\
     */\n\
    function wrapperValue() {\n\
      return baseWrapperValue(this.__wrapped__, this.__actions__);\n\
    }\n\
\n\
    /*------------------------------------------------------------------------*/\n\
\n\
    /**\n\
     * Creates an array of elements corresponding to the specified keys, or indexes,\n\
     * of `collection`. Keys may be specified as individual arguments or as arrays\n\
     * of keys.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Collection\n\
     * @param {Array|Object|string} collection The collection to iterate over.\n\
     * @param {...(number|number[]|string|string[])} [props] The property names\n\
     *  or indexes of elements to pick, specified individually or in arrays.\n\
     * @returns {Array} Returns the new array of picked elements.\n\
     * @example\n\
     *\n\
     * _.at(['a', 'b', 'c', 'd', 'e'], [0, 2, 4]);\n\
     * // => ['a', 'c', 'e']\n\
     *\n\
     * _.at(['fred', 'barney', 'pebbles'], 0, 2);\n\
     * // => ['fred', 'pebbles']\n\
     */\n\
    function at(collection) {\n\
      if (!collection || isLength(collection.length)) {\n\
        collection = toIterable(collection);\n\
      }\n\
      return baseAt(collection, baseFlatten(arguments, false, false, 1));\n\
    }\n\
\n\
    /**\n\
     * Checks if `value` is in `collection` using `SameValueZero` for equality\n\
     * comparisons. If `fromIndex` is negative, it is used as the offset from\n\
     * the end of `collection`.\n\
     *\n\
     * **Note:** `SameValueZero` comparisons are like strict equality comparisons,\n\
     * e.g. `===`, except that `NaN` matches `NaN`. See the\n\
     * [ES6 spec](https://people.mozilla.org/~jorendorff/es6-draft.html#sec-samevaluezero)\n\
     * for more details.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @alias contains, include\n\
     * @category Collection\n\
     * @param {Array|Object|string} collection The collection to search.\n\
     * @param {*} target The value to search for.\n\
     * @param {number} [fromIndex=0] The index to search from.\n\
     * @returns {boolean} Returns `true` if a matching element is found, else `false`.\n\
     * @example\n\
     *\n\
     * _.includes([1, 2, 3], 1);\n\
     * // => true\n\
     *\n\
     * _.includes([1, 2, 3], 1, 2);\n\
     * // => false\n\
     *\n\
     * _.includes({ 'user': 'fred', 'age': 40 }, 'fred');\n\
     * // => true\n\
     *\n\
     * _.includes('pebbles', 'eb');\n\
     * // => true\n\
     */\n\
    function includes(collection, target, fromIndex) {\n\
      var length = collection ? collection.length : 0;\n\
\n\
      if (!isLength(length)) {\n\
        collection = values(collection);\n\
        length = collection.length;\n\
      }\n\
      if (!length) {\n\
        return false;\n\
      }\n\
      if (typeof fromIndex == 'number') {\n\
        fromIndex = fromIndex < 0 ? nativeMax(length + fromIndex, 0) : (fromIndex || 0);\n\
      } else {\n\
        fromIndex = 0;\n\
      }\n\
      return (typeof collection == 'string' || !isArray(collection) && isString(collection))\n\
        ? (fromIndex < length && collection.indexOf(target, fromIndex) > -1)\n\
        : (getIndexOf(collection, target, fromIndex) > -1);\n\
    }\n\
\n\
    /**\n\
     * Creates an object composed of keys generated from the results of running\n\
     * each element of `collection` through `iteratee`. The corresponding value\n\
     * of each key is the number of times the key was returned by `iteratee`.\n\
     * The `iteratee` is bound to `thisArg` and invoked with three arguments;\n\
     * (value, index|key, collection).\n\
     *\n\
     * If a property name is provided for `iteratee` the created \"_.pluck\" style\n\
     * callback returns the property value of the given element.\n\
     *\n\
     * If an object is provided for `iteratee` the created \"_.where\" style callback\n\
     * returns `true` for elements that have the properties of the given object,\n\
     * else `false`.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Collection\n\
     * @param {Array|Object|string} collection The collection to iterate over.\n\
     * @param {Function|Object|string} [iteratee=_.identity] The function invoked\n\
     *  per iteration. If a property name or object is provided it is used to\n\
     *  create a \"_.pluck\" or \"_.where\" style callback respectively.\n\
     * @param {*} [thisArg] The `this` binding of `iteratee`.\n\
     * @returns {Object} Returns the composed aggregate object.\n\
     * @example\n\
     *\n\
     * _.countBy([4.3, 6.1, 6.4], function(n) { return Math.floor(n); });\n\
     * // => { '4': 1, '6': 2 }\n\
     *\n\
     * _.countBy([4.3, 6.1, 6.4], function(n) { return this.floor(n); }, Math);\n\
     * // => { '4': 1, '6': 2 }\n\
     *\n\
     * _.countBy(['one', 'two', 'three'], 'length');\n\
     * // => { '3': 2, '5': 1 }\n\
     */\n\
    var countBy = createAggregator(function(result, value, key) {\n\
      hasOwnProperty.call(result, key) ? ++result[key] : (result[key] = 1);\n\
    });\n\
\n\
    /**\n\
     * Checks if `predicate` returns truthy for **all** elements of `collection`.\n\
     * The predicate is bound to `thisArg` and invoked with three arguments;\n\
     * (value, index|key, collection).\n\
     *\n\
     * If a property name is provided for `predicate` the created \"_.pluck\" style\n\
     * callback returns the property value of the given element.\n\
     *\n\
     * If an object is provided for `predicate` the created \"_.where\" style callback\n\
     * returns `true` for elements that have the properties of the given object,\n\
     * else `false`.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @alias all\n\
     * @category Collection\n\
     * @param {Array|Object|string} collection The collection to iterate over.\n\
     * @param {Function|Object|string} [predicate=_.identity] The function invoked\n\
     *  per iteration. If a property name or object is provided it is used to\n\
     *  create a \"_.pluck\" or \"_.where\" style callback respectively.\n\
     * @param {*} [thisArg] The `this` binding of `predicate`.\n\
     * @returns {boolean} Returns `true` if all elements pass the predicate check,\n\
     *  else `false`.\n\
     * @example\n\
     *\n\
     * _.every([true, 1, null, 'yes']);\n\
     * // => false\n\
     *\n\
     * var users = [\n\
     *   { 'user': 'barney', 'age': 36 },\n\
     *   { 'user': 'fred',   'age': 40 }\n\
     * ];\n\
     *\n\
     * // using \"_.pluck\" callback shorthand\n\
     * _.every(users, 'age');\n\
     * // => true\n\
     *\n\
     * // using \"_.where\" callback shorthand\n\
     * _.every(users, { 'age': 36 });\n\
     * // => false\n\
     */\n\
    function every(collection, predicate, thisArg) {\n\
      var func = isArray(collection) ? arrayEvery : baseEvery;\n\
      if (typeof predicate != 'function' || typeof thisArg != 'undefined') {\n\
        predicate = getCallback(predicate, thisArg, 3);\n\
      }\n\
      return func(collection, predicate);\n\
    }\n\
\n\
    /**\n\
     * Iterates over elements of `collection`, returning an array of all elements\n\
     * `predicate` returns truthy for. The predicate is bound to `thisArg` and\n\
     * invoked with three arguments; (value, index|key, collection).\n\
     *\n\
     * If a property name is provided for `predicate` the created \"_.pluck\" style\n\
     * callback returns the property value of the given element.\n\
     *\n\
     * If an object is provided for `predicate` the created \"_.where\" style callback\n\
     * returns `true` for elements that have the properties of the given object,\n\
     * else `false`.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @alias select\n\
     * @category Collection\n\
     * @param {Array|Object|string} collection The collection to iterate over.\n\
     * @param {Function|Object|string} [predicate=_.identity] The function invoked\n\
     *  per iteration. If a property name or object is provided it is used to\n\
     *  create a \"_.pluck\" or \"_.where\" style callback respectively.\n\
     * @param {*} [thisArg] The `this` binding of `predicate`.\n\
     * @returns {Array} Returns the new filtered array.\n\
     * @example\n\
     *\n\
     * var evens = _.filter([1, 2, 3, 4], function(n) { return n % 2 == 0; });\n\
     * // => [2, 4]\n\
     *\n\
     * var users = [\n\
     *   { 'user': 'barney', 'age': 36, 'active': false },\n\
     *   { 'user': 'fred',   'age': 40, 'active': true }\n\
     * ];\n\
     *\n\
     * // using \"_.pluck\" callback shorthand\n\
     * _.pluck(_.filter(users, 'active'), 'user');\n\
     * // => ['fred']\n\
     *\n\
     * // using \"_.where\" callback shorthand\n\
     * _.pluck(_.filter(users, { 'age': 36 }), 'user');\n\
     * // => ['barney']\n\
     */\n\
    function filter(collection, predicate, thisArg) {\n\
      var func = isArray(collection) ? arrayFilter : baseFilter;\n\
\n\
      predicate = getCallback(predicate, thisArg, 3);\n\
      return func(collection, predicate);\n\
    }\n\
\n\
    /**\n\
     * Iterates over elements of `collection`, returning the first element\n\
     * `predicate` returns truthy for. The predicate is bound to `thisArg` and\n\
     * invoked with three arguments; (value, index|key, collection).\n\
     *\n\
     * If a property name is provided for `predicate` the created \"_.pluck\" style\n\
     * callback returns the property value of the given element.\n\
     *\n\
     * If an object is provided for `predicate` the created \"_.where\" style callback\n\
     * returns `true` for elements that have the properties of the given object,\n\
     * else `false`.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @alias detect\n\
     * @category Collection\n\
     * @param {Array|Object|string} collection The collection to search.\n\
     * @param {Function|Object|string} [predicate=_.identity] The function invoked\n\
     *  per iteration. If a property name or object is provided it is used to\n\
     *  create a \"_.pluck\" or \"_.where\" style callback respectively.\n\
     * @param {*} [thisArg] The `this` binding of `predicate`.\n\
     * @returns {*} Returns the matched element, else `undefined`.\n\
     * @example\n\
     *\n\
     * var users = [\n\
     *   { 'user': 'barney',  'age': 36, 'active': false },\n\
     *   { 'user': 'fred',    'age': 40, 'active': true },\n\
     *   { 'user': 'pebbles', 'age': 1,  'active': false }\n\
     * ];\n\
     *\n\
     * _.result(_.find(users, function(chr) { return chr.age < 40; }), 'user');\n\
     * // => 'barney'\n\
     *\n\
     * // using \"_.where\" callback shorthand\n\
     * _.result(_.find(users, { 'age': 1 }), 'user');\n\
     * // => 'pebbles'\n\
     *\n\
     * // using \"_.pluck\" callback shorthand\n\
     * _.result(_.find(users, 'active'), 'user');\n\
     * // => 'fred'\n\
     */\n\
    function find(collection, predicate, thisArg) {\n\
      if (isArray(collection)) {\n\
        var index = findIndex(collection, predicate, thisArg);\n\
        return index > -1 ? collection[index] : undefined;\n\
      }\n\
      predicate = getCallback(predicate, thisArg, 3);\n\
      return baseFind(collection, predicate, baseEach);\n\
    }\n\
\n\
    /**\n\
     * This method is like `_.find` except that it iterates over elements of\n\
     * `collection` from right to left.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Collection\n\
     * @param {Array|Object|string} collection The collection to search.\n\
     * @param {Function|Object|string} [predicate=_.identity] The function invoked\n\
     *  per iteration. If a property name or object is provided it is used to\n\
     *  create a \"_.pluck\" or \"_.where\" style callback respectively.\n\
     * @param {*} [thisArg] The `this` binding of `predicate`.\n\
     * @returns {*} Returns the matched element, else `undefined`.\n\
     * @example\n\
     *\n\
     * _.findLast([1, 2, 3, 4], function(n) { return n % 2 == 1; });\n\
     * // => 3\n\
     */\n\
    function findLast(collection, predicate, thisArg) {\n\
      predicate = getCallback(predicate, thisArg, 3);\n\
      return baseFind(collection, predicate, baseEachRight);\n\
    }\n\
\n\
    /**\n\
     * Performs a deep comparison between each element in `collection` and the\n\
     * source object, returning the first element that has equivalent property\n\
     * values.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Collection\n\
     * @param {Array|Object|string} collection The collection to search.\n\
     * @param {Object} source The object of property values to match.\n\
     * @returns {*} Returns the matched element, else `undefined`.\n\
     * @example\n\
     *\n\
     * var users = [\n\
     *   { 'user': 'barney', 'age': 36, 'status': 'busy' },\n\
     *   { 'user': 'fred',   'age': 40, 'status': 'busy' }\n\
     * ];\n\
     *\n\
     * _.result(_.findWhere(users, { 'status': 'busy' }), 'user');\n\
     * // => 'barney'\n\
     *\n\
     * _.result(_.findWhere(users, { 'age': 40 }), 'user');\n\
     * // => 'fred'\n\
     */\n\
    function findWhere(collection, source) {\n\
      return find(collection, matches(source));\n\
    }\n\
\n\
    /**\n\
     * Iterates over elements of `collection` invoking `iteratee` for each element.\n\
     * The `iteratee` is bound to `thisArg` and invoked with three arguments;\n\
     * (value, index|key, collection). Iterator functions may exit iteration early\n\
     * by explicitly returning `false`.\n\
     *\n\
     * **Note:** As with other \"Collections\" methods, objects with a `length` property\n\
     * are iterated like arrays. To avoid this behavior `_.forIn` or `_.forOwn`\n\
     * may be used for object iteration.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @alias each\n\
     * @category Collection\n\
     * @param {Array|Object|string} collection The collection to iterate over.\n\
     * @param {Function} [iteratee=_.identity] The function invoked per iteration.\n\
     * @param {*} [thisArg] The `this` binding of `iteratee`.\n\
     * @returns {Array|Object|string} Returns `collection`.\n\
     * @example\n\
     *\n\
     * _([1, 2, 3]).forEach(function(n) { console.log(n); });\n\
     * // => logs each value from left to right and returns the array\n\
     *\n\
     * _.forEach({ 'one': 1, 'two': 2, 'three': 3 }, function(n, key) { console.log(n, key); });\n\
     * // => logs each value-key pair and returns the object (iteration order is not guaranteed)\n\
     */\n\
    function forEach(collection, iteratee, thisArg) {\n\
      return (typeof iteratee == 'function' && typeof thisArg == 'undefined' && isArray(collection))\n\
        ? arrayEach(collection, iteratee)\n\
        : baseEach(collection, baseCallback(iteratee, thisArg, 3));\n\
    }\n\
\n\
    /**\n\
     * This method is like `_.forEach` except that it iterates over elements of\n\
     * `collection` from right to left.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @alias eachRight\n\
     * @category Collection\n\
     * @param {Array|Object|string} collection The collection to iterate over.\n\
     * @param {Function} [iteratee=_.identity] The function invoked per iteration.\n\
     * @param {*} [thisArg] The `this` binding of `iteratee`.\n\
     * @returns {Array|Object|string} Returns `collection`.\n\
     * @example\n\
     *\n\
     * _([1, 2, 3]).forEachRight(function(n) { console.log(n); }).join(',');\n\
     * // => logs each value from right to left and returns the array\n\
     */\n\
    function forEachRight(collection, iteratee, thisArg) {\n\
      return (typeof iteratee == 'function' && typeof thisArg == 'undefined' && isArray(collection))\n\
        ? arrayEachRight(collection, iteratee)\n\
        : baseEachRight(collection, baseCallback(iteratee, thisArg, 3));\n\
    }\n\
\n\
    /**\n\
     * Creates an object composed of keys generated from the results of running\n\
     * each element of `collection` through `iteratee`. The corresponding\n\
     * value of each key is an array of the elements responsible for generating\n\
     * the key. The `iteratee` is bound to `thisArg` and invoked with three\n\
     * arguments; (value, index|key, collection).\n\
     *\n\
     * If a property name is provided for `iteratee` the created \"_.pluck\" style\n\
     * callback returns the property value of the given element.\n\
     *\n\
     * If an object is provided for `iteratee` the created \"_.where\" style callback\n\
     * returns `true` for elements that have the properties of the given object,\n\
     * else `false`.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Collection\n\
     * @param {Array|Object|string} collection The collection to iterate over.\n\
     * @param {Function|Object|string} [iteratee=_.identity] The function invoked\n\
     *  per iteration. If a property name or object is provided it is used to\n\
     *  create a \"_.pluck\" or \"_.where\" style callback respectively.\n\
     * @param {*} [thisArg] The `this` binding of `iteratee`.\n\
     * @returns {Object} Returns the composed aggregate object.\n\
     * @example\n\
     *\n\
     * _.groupBy([4.2, 6.1, 6.4], function(n) { return Math.floor(n); });\n\
     * // => { '4': [4.2], '6': [6.1, 6.4] }\n\
     *\n\
     * _.groupBy([4.2, 6.1, 6.4], function(n) { return this.floor(n); }, Math);\n\
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
     * each element of `collection` through `iteratee`. The corresponding value\n\
     * of each key is the last element responsible for generating the key. The\n\
     * iteratee function is bound to `thisArg` and invoked with three arguments;\n\
     * (value, index|key, collection).\n\
     *\n\
     * If a property name is provided for `iteratee` the created \"_.pluck\" style\n\
     * callback returns the property value of the given element.\n\
     *\n\
     * If an object is provided for `iteratee` the created \"_.where\" style callback\n\
     * returns `true` for elements that have the properties of the given object,\n\
     * else `false`.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Collection\n\
     * @param {Array|Object|string} collection The collection to iterate over.\n\
     * @param {Function|Object|string} [iteratee=_.identity] The function invoked\n\
     *  per iteration. If a property name or object is provided it is used to\n\
     *  create a \"_.pluck\" or \"_.where\" style callback respectively.\n\
     * @param {*} [thisArg] The `this` binding of `iteratee`.\n\
     * @returns {Object} Returns the composed aggregate object.\n\
     * @example\n\
     *\n\
     * var keyData = [\n\
     *   { 'dir': 'left', 'code': 97 },\n\
     *   { 'dir': 'right', 'code': 100 }\n\
     * ];\n\
     *\n\
     * _.indexBy(keyData, 'dir');\n\
     * // => { 'left': { 'dir': 'left', 'code': 97 }, 'right': { 'dir': 'right', 'code': 100 } }\n\
     *\n\
     * _.indexBy(keyData, function(object) { return String.fromCharCode(object.code); });\n\
     * // => { 'a': { 'dir': 'left', 'code': 97 }, 'd': { 'dir': 'right', 'code': 100 } }\n\
     *\n\
     * _.indexBy(keyData, function(object) { return this.fromCharCode(object.code); }, String);\n\
     * // => { 'a': { 'dir': 'left', 'code': 97 }, 'd': { 'dir': 'right', 'code': 100 } }\n\
     */\n\
    var indexBy = createAggregator(function(result, value, key) {\n\
      result[key] = value;\n\
    });\n\
\n\
    /**\n\
     * Invokes the method named by `methodName` on each element in `collection`,\n\
     * returning an array of the results of each invoked method. Any additional\n\
     * arguments are provided to each invoked method. If `methodName` is a function\n\
     * it is invoked for, and `this` bound to, each element in `collection`.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Collection\n\
     * @param {Array|Object|string} collection The collection to iterate over.\n\
     * @param {Function|string} methodName The name of the method to invoke or\n\
     *  the function invoked per iteration.\n\
     * @param {...*} [args] The arguments to invoke the method with.\n\
     * @returns {Array} Returns the array of results.\n\
     * @example\n\
     *\n\
     * _.invoke([[5, 1, 7], [3, 2, 1]], 'sort');\n\
     * // => [[1, 5, 7], [1, 2, 3]]\n\
     *\n\
     * _.invoke([123, 456], String.prototype.split, '');\n\
     * // => [['1', '2', '3'], ['4', '5', '6']]\n\
     */\n\
    function invoke(collection, methodName) {\n\
      return baseInvoke(collection, methodName, slice(arguments, 2));\n\
    }\n\
\n\
    /**\n\
     * Creates an array of values by running each element in `collection` through\n\
     * `iteratee`. The `iteratee` is bound to `thisArg` and invoked with three\n\
     * arguments; (value, index|key, collection).\n\
     *\n\
     * If a property name is provided for `iteratee` the created \"_.pluck\" style\n\
     * callback returns the property value of the given element.\n\
     *\n\
     * If an object is provided for `iteratee` the created \"_.where\" style callback\n\
     * returns `true` for elements that have the properties of the given object,\n\
     * else `false`.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @alias collect\n\
     * @category Collection\n\
     * @param {Array|Object|string} collection The collection to iterate over.\n\
     * @param {Function|Object|string} [iteratee=_.identity] The function invoked\n\
     *  per iteration. If a property name or object is provided it is used to\n\
     *  create a \"_.pluck\" or \"_.where\" style callback respectively.\n\
     * @param {*} [thisArg] The `this` binding of `iteratee`.\n\
     * @returns {Array} Returns the new mapped array.\n\
     * @example\n\
     *\n\
     * _.map([1, 2, 3], function(n) { return n * 3; });\n\
     * // => [3, 6, 9]\n\
     *\n\
     * _.map({ 'one': 1, 'two': 2, 'three': 3 }, function(n) { return n * 3; });\n\
     * // => [3, 6, 9] (iteration order is not guaranteed)\n\
     *\n\
     * var users = [\n\
     *   { 'user': 'barney' },\n\
     *   { 'user': 'fred' }\n\
     * ];\n\
     *\n\
     * // using \"_.pluck\" callback shorthand\n\
     * _.map(users, 'user');\n\
     * // => ['barney', 'fred']\n\
     */\n\
    function map(collection, iteratee, thisArg) {\n\
      iteratee = getCallback(iteratee, thisArg, 3);\n\
\n\
      var func = isArray(collection) ? arrayMap : baseMap;\n\
      return func(collection, iteratee);\n\
    }\n\
\n\
    /**\n\
     * Retrieves the maximum value of `collection`. If `collection` is empty or\n\
     * falsey `-Infinity` is returned. If an iteratee function is provided it is\n\
     * invoked for each value in `collection` to generate the criterion by which\n\
     * the value is ranked. The `iteratee` is bound to `thisArg` and invoked with\n\
     * three arguments; (value, index, collection).\n\
     *\n\
     * If a property name is provided for `iteratee` the created \"_.pluck\" style\n\
     * callback returns the property value of the given element.\n\
     *\n\
     * If an object is provided for `iteratee` the created \"_.where\" style callback\n\
     * returns `true` for elements that have the properties of the given object,\n\
     * else `false`.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Collection\n\
     * @param {Array|Object|string} collection The collection to iterate over.\n\
     * @param {Function|Object|string} [iteratee] The function invoked per iteration.\n\
     *  If a property name or object is provided it is used to create a \"_.pluck\"\n\
     *  or \"_.where\" style callback respectively.\n\
     * @param {*} [thisArg] The `this` binding of `iteratee`.\n\
     * @returns {*} Returns the maximum value.\n\
     * @example\n\
     *\n\
     * _.max([4, 2, 8, 6]);\n\
     * // => 8\n\
     *\n\
     * _.max([]);\n\
     * // => -Infinity\n\
     *\n\
     * var users = [\n\
     *   { 'user': 'barney', 'age': 36 },\n\
     *   { 'user': 'fred',   'age': 40 }\n\
     * ];\n\
     *\n\
     * _.max(users, function(chr) { return chr.age; });\n\
     * // => { 'user': 'fred', 'age': 40 };\n\
     *\n\
     * // using \"_.pluck\" callback shorthand\n\
     * _.max(users, 'age');\n\
     * // => { 'user': 'fred', 'age': 40 };\n\
     */\n\
    function max(collection, iteratee, thisArg) {\n\
      if (thisArg && isIterateeCall(collection, iteratee, thisArg)) {\n\
        iteratee = null;\n\
      }\n\
      var noIteratee = iteratee == null,\n\
          isArr = noIteratee && isArray(collection),\n\
          isStr = !isArr && isString(collection);\n\
\n\
      if (noIteratee && !isStr) {\n\
        return arrayMax(isArr ? collection : toIterable(collection));\n\
      }\n\
      var computed = NEGATIVE_INFINITY,\n\
          result = computed;\n\
\n\
      iteratee = (noIteratee && isStr)\n\
        ? charAtCallback\n\
        : getCallback(iteratee, thisArg, 3);\n\
\n\
      baseEach(collection, function(value, index, collection) {\n\
        var current = iteratee(value, index, collection);\n\
        if (current > computed || (current === NEGATIVE_INFINITY && current === result)) {\n\
          computed = current;\n\
          result = value;\n\
        }\n\
      });\n\
      return result;\n\
    }\n\
\n\
    /**\n\
     * Retrieves the minimum value of `collection`. If `collection` is empty or\n\
     * falsey `Infinity` is returned. If an iteratee function is provided it is\n\
     * invoked for each value in `collection` to generate the criterion by which\n\
     * the value is ranked. The `iteratee` is bound to `thisArg` and invoked with\n\
     * three arguments; (value, index, collection).\n\
     *\n\
     * If a property name is provided for `iteratee` the created \"_.pluck\" style\n\
     * callback returns the property value of the given element.\n\
     *\n\
     * If an object is provided for `iteratee` the created \"_.where\" style callback\n\
     * returns `true` for elements that have the properties of the given object,\n\
     * else `false`.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Collection\n\
     * @param {Array|Object|string} collection The collection to iterate over.\n\
     * @param {Function|Object|string} [iteratee] The function invoked per iteration.\n\
     *  If a property name or object is provided it is used to create a \"_.pluck\"\n\
     *  or \"_.where\" style callback respectively.\n\
     * @param {*} [thisArg] The `this` binding of `iteratee`.\n\
     * @returns {*} Returns the minimum value.\n\
     * @example\n\
     *\n\
     * _.min([4, 2, 8, 6]);\n\
     * // => 2\n\
     *\n\
     * _.min([]);\n\
     * // => Infinity\n\
     *\n\
     * var users = [\n\
     *   { 'user': 'barney', 'age': 36 },\n\
     *   { 'user': 'fred',   'age': 40 }\n\
     * ];\n\
     *\n\
     * _.min(users, function(chr) { return chr.age; });\n\
     * // => { 'user': 'barney', 'age': 36 };\n\
     *\n\
     * // using \"_.pluck\" callback shorthand\n\
     * _.min(users, 'age');\n\
     * // => { 'user': 'barney', 'age': 36 };\n\
     */\n\
    function min(collection, iteratee, thisArg) {\n\
      if (thisArg && isIterateeCall(collection, iteratee, thisArg)) {\n\
        iteratee = null;\n\
      }\n\
      var noIteratee = iteratee == null,\n\
          isArr = noIteratee && isArray(collection),\n\
          isStr = !isArr && isString(collection);\n\
\n\
      if (noIteratee && !isStr) {\n\
        return arrayMin(isArr ? collection : toIterable(collection));\n\
      }\n\
      var computed = POSITIVE_INFINITY,\n\
          result = computed;\n\
\n\
      iteratee = (noIteratee && isStr)\n\
        ? charAtCallback\n\
        : getCallback(iteratee, thisArg, 3);\n\
\n\
      baseEach(collection, function(value, index, collection) {\n\
        var current = iteratee(value, index, collection);\n\
        if (current < computed || (current === POSITIVE_INFINITY && current === result)) {\n\
          computed = current;\n\
          result = value;\n\
        }\n\
      });\n\
      return result;\n\
    }\n\
\n\
    /**\n\
     * Creates an array of elements split into two groups, the first of which\n\
     * contains elements `predicate` returns truthy for, while the second of which\n\
     * contains elements `predicate` returns falsey for. The predicate is bound\n\
     * to `thisArg` and invoked with three arguments; (value, index|key, collection).\n\
     *\n\
     * If a property name is provided for `predicate` the created \"_.pluck\" style\n\
     * callback returns the property value of the given element.\n\
     *\n\
     * If an object is provided for `predicate` the created \"_.where\" style callback\n\
     * returns `true` for elements that have the properties of the given object,\n\
     * else `false`.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Collection\n\
     * @param {Array|Object|string} collection The collection to iterate over.\n\
     * @param {Function|Object|string} [predicate=_.identity] The function invoked\n\
     *  per iteration. If a property name or object is provided it is used to\n\
     *  create a \"_.pluck\" or \"_.where\" style callback respectively.\n\
     * @param {*} [thisArg] The `this` binding of `predicate`.\n\
     * @returns {Array} Returns the array of grouped elements.\n\
     * @example\n\
     *\n\
     * _.partition([1, 2, 3], function(n) { return n % 2; });\n\
     * // => [[1, 3], [2]]\n\
     *\n\
     * _.partition([1.2, 2.3, 3.4], function(n) { return this.floor(n) % 2; }, Math);\n\
     * // => [[1, 3], [2]]\n\
     *\n\
     * var users = [\n\
     *   { 'user': 'barney',  'age': 36, 'active': false },\n\
     *   { 'user': 'fred',    'age': 40, 'active': true },\n\
     *   { 'user': 'pebbles', 'age': 1,  'active': false }\n\
     * ];\n\
     *\n\
     * // using \"_.where\" callback shorthand\n\
     * _.map(_.partition(users, { 'age': 1 }), function(array) { return _.pluck(array, 'user'); });\n\
     * // => [['pebbles'], ['barney', 'fred']]\n\
     *\n\
     * // using \"_.pluck\" callback shorthand\n\
     * _.map(_.partition(users, 'active'), function(array) { return _.pluck(array, 'user'); });\n\
     * // => [['fred'], ['barney', 'pebbles']]\n\
     */\n\
    var partition = createAggregator(function(result, value, key) {\n\
      result[key ? 0 : 1].push(value);\n\
    }, function() { return [[], []]; });\n\
\n\
    /**\n\
     * Retrieves the value of a specified property from all elements in `collection`.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Collection\n\
     * @param {Array|Object|string} collection The collection to iterate over.\n\
     * @param {string} key The name of the property to pluck.\n\
     * @returns {Array} Returns the property values.\n\
     * @example\n\
     *\n\
     * var users = [\n\
     *   { 'user': 'barney', 'age': 36 },\n\
     *   { 'user': 'fred',   'age': 40 }\n\
     * ];\n\
     *\n\
     * _.pluck(users, 'user');\n\
     * // => ['barney', 'fred']\n\
     *\n\
     * var userIndex = _.indexBy(users, 'user');\n\
     * _.pluck(userIndex, 'age');\n\
     * // => [36, 40] (iteration order is not guaranteed)\n\
     */\n\
    function pluck(collection, key) {\n\
      return map(collection, property(key));\n\
    }\n\
\n\
    /**\n\
     * Reduces `collection` to a value which is the accumulated result of running\n\
     * each element in `collection` through `iteratee`, where each successive\n\
     * invocation is supplied the return value of the previous. If `accumulator`\n\
     * is not provided the first element of `collection` is used as the initial\n\
     * value. The `iteratee` is bound to `thisArg`and invoked with four arguments;\n\
     * (accumulator, value, index|key, collection).\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @alias foldl, inject\n\
     * @category Collection\n\
     * @param {Array|Object|string} collection The collection to iterate over.\n\
     * @param {Function} [iteratee=_.identity] The function invoked per iteration.\n\
     * @param {*} [accumulator] The initial value.\n\
     * @param {*} [thisArg] The `this` binding of `iteratee`.\n\
     * @returns {*} Returns the accumulated value.\n\
     * @example\n\
     *\n\
     * var sum = _.reduce([1, 2, 3], function(sum, n) { return sum + n; });\n\
     * // => 6\n\
     *\n\
     * var mapped = _.reduce({ 'a': 1, 'b': 2, 'c': 3 }, function(result, n, key) {\n\
     *   result[key] = n * 3;\n\
     *   return result;\n\
     * }, {});\n\
     * // => { 'a': 3, 'b': 6, 'c': 9 } (iteration order is not guaranteed)\n\
     */\n\
    function reduce(collection, iteratee, accumulator, thisArg) {\n\
      var func = isArray(collection) ? arrayReduce : baseReduce;\n\
      return func(collection, getCallback(iteratee, thisArg, 4), accumulator, arguments.length < 3, baseEach);\n\
    }\n\
\n\
    /**\n\
     * This method is like `_.reduce` except that it iterates over elements of\n\
     * `collection` from right to left.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @alias foldr\n\
     * @category Collection\n\
     * @param {Array|Object|string} collection The collection to iterate over.\n\
     * @param {Function} [iteratee=_.identity] The function invoked per iteration.\n\
     * @param {*} [accumulator] The initial value.\n\
     * @param {*} [thisArg] The `this` binding of `iteratee`.\n\
     * @returns {*} Returns the accumulated value.\n\
     * @example\n\
     *\n\
     * var array = [[0, 1], [2, 3], [4, 5]];\n\
     * _.reduceRight(array, function(flattened, other) { return flattened.concat(other); }, []);\n\
     * // => [4, 5, 2, 3, 0, 1]\n\
     */\n\
    function reduceRight(collection, iteratee, accumulator, thisArg) {\n\
      var func = isArray(collection) ? arrayReduceRight : baseReduce;\n\
      return func(collection, getCallback(iteratee, thisArg, 4), accumulator, arguments.length < 3, baseEachRight);\n\
    }\n\
\n\
    /**\n\
     * The opposite of `_.filter`; this method returns the elements of `collection`\n\
     * that `predicate` does **not** return truthy for.\n\
     *\n\
     * If a property name is provided for `predicate` the created \"_.pluck\" style\n\
     * callback returns the property value of the given element.\n\
     *\n\
     * If an object is provided for `predicate` the created \"_.where\" style callback\n\
     * returns `true` for elements that have the properties of the given object,\n\
     * else `false`.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Collection\n\
     * @param {Array|Object|string} collection The collection to iterate over.\n\
     * @param {Function|Object|string} [predicate=_.identity] The function invoked\n\
     *  per iteration. If a property name or object is provided it is used to\n\
     *  create a \"_.pluck\" or \"_.where\" style callback respectively.\n\
     * @param {*} [thisArg] The `this` binding of `predicate`.\n\
     * @returns {Array} Returns the new filtered array.\n\
     * @example\n\
     *\n\
     * var odds = _.reject([1, 2, 3, 4], function(n) { return n % 2 == 0; });\n\
     * // => [1, 3]\n\
     *\n\
     * var users = [\n\
     *   { 'user': 'barney', 'age': 36, 'active': false },\n\
     *   { 'user': 'fred',   'age': 40, 'active': true }\n\
     * ];\n\
     *\n\
     * // using \"_.pluck\" callback shorthand\n\
     * _.pluck(_.reject(users, 'active'), 'user');\n\
     * // => ['barney']\n\
     *\n\
     * // using \"_.where\" callback shorthand\n\
     * _.pluck(_.reject(users, { 'age': 36 }), 'user');\n\
     * // => ['fred']\n\
     */\n\
    function reject(collection, predicate, thisArg) {\n\
      var func = isArray(collection) ? arrayFilter : baseFilter;\n\
\n\
      predicate = getCallback(predicate, thisArg, 3);\n\
      return func(collection, function(value, index, collection) {\n\
        return !predicate(value, index, collection);\n\
      });\n\
    }\n\
\n\
    /**\n\
     * Retrieves a random element or `n` random elements from a collection.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Collection\n\
     * @param {Array|Object|string} collection The collection to sample.\n\
     * @param {number} [n] The number of elements to sample.\n\
     * @param- {Object} [guard] Enables use as a callback for functions like `_.map`.\n\
     * @returns {*} Returns the random sample(s).\n\
     * @example\n\
     *\n\
     * _.sample([1, 2, 3, 4]);\n\
     * // => 2\n\
     *\n\
     * _.sample([1, 2, 3, 4], 2);\n\
     * // => [3, 1]\n\
     */\n\
    function sample(collection, n, guard) {\n\
      if (guard ? isIterateeCall(collection, n, guard) : n == null) {\n\
        collection = toIterable(collection);\n\
        var length = collection.length;\n\
        return length > 0 ? collection[baseRandom(0, length - 1)] : undefined;\n\
      }\n\
      var result = shuffle(collection);\n\
      result.length = nativeMin(n < 0 ? 0 : (+n || 0), result.length);\n\
      return result;\n\
    }\n\
\n\
    /**\n\
     * Creates an array of shuffled values, using a version of the Fisher-Yates\n\
     * shuffle. See [Wikipedia](http://en.wikipedia.org/wiki/Fisher-Yates_shuffle)\n\
     * for more details.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Collection\n\
     * @param {Array|Object|string} collection The collection to shuffle.\n\
     * @returns {Array} Returns the new shuffled array.\n\
     * @example\n\
     *\n\
     * _.shuffle([1, 2, 3, 4]);\n\
     * // => [4, 1, 3, 2]\n\
     */\n\
    function shuffle(collection) {\n\
      collection = toIterable(collection);\n\
\n\
      var index = -1,\n\
          length = collection.length,\n\
          result = Array(length);\n\
\n\
      while (++index < length) {\n\
        var rand = baseRandom(0, index);\n\
        if (index != rand) {\n\
          result[index] = result[rand];\n\
        }\n\
        result[rand] = collection[index];\n\
      }\n\
      return result;\n\
    }\n\
\n\
    /**\n\
     * Gets the size of `collection` by returning `collection.length` for\n\
     * array-like values or the number of own enumerable properties for objects.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Collection\n\
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
      return isLength(length) ? length : keys(collection).length;\n\
    }\n\
\n\
    /**\n\
     * Checks if `predicate` returns truthy for **any** element of `collection`.\n\
     * The function returns as soon as it finds a passing value and does not iterate\n\
     * over the entire collection. The predicate is bound to `thisArg` and invoked\n\
     * with three arguments; (value, index|key, collection).\n\
     *\n\
     * If a property name is provided for `predicate` the created \"_.pluck\" style\n\
     * callback returns the property value of the given element.\n\
     *\n\
     * If an object is provided for `predicate` the created \"_.where\" style callback\n\
     * returns `true` for elements that have the properties of the given object,\n\
     * else `false`.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @alias any\n\
     * @category Collection\n\
     * @param {Array|Object|string} collection The collection to iterate over.\n\
     * @param {Function|Object|string} [predicate=_.identity] The function invoked\n\
     *  per iteration. If a property name or object is provided it is used to\n\
     *  create a \"_.pluck\" or \"_.where\" style callback respectively.\n\
     * @param {*} [thisArg] The `this` binding of `predicate`.\n\
     * @returns {boolean} Returns `true` if any element passes the predicate check,\n\
     *  else `false`.\n\
     * @example\n\
     *\n\
     * _.some([null, 0, 'yes', false], Boolean);\n\
     * // => true\n\
     *\n\
     * var users = [\n\
     *   { 'user': 'barney', 'age': 36, 'active': false },\n\
     *   { 'user': 'fred',   'age': 40, 'active': true }\n\
     * ];\n\
     *\n\
     * // using \"_.pluck\" callback shorthand\n\
     * _.some(users, 'active');\n\
     * // => true\n\
     *\n\
     * // using \"_.where\" callback shorthand\n\
     * _.some(users, { 'age': 1 });\n\
     * // => false\n\
     */\n\
    function some(collection, predicate, thisArg) {\n\
      var func = isArray(collection) ? arraySome : baseSome;\n\
      if (typeof predicate != 'function' || typeof thisArg != 'undefined') {\n\
        predicate = getCallback(predicate, thisArg, 3);\n\
      }\n\
      return func(collection, predicate);\n\
    }\n\
\n\
    /**\n\
     * Creates an array of elements, sorted in ascending order by the results of\n\
     * running each element in a collection through `iteratee`. This method performs\n\
     * a stable sort, that is, it preserves the original sort order of equal elements.\n\
     * The `iteratee` is bound to `thisArg` and invoked with three arguments;\n\
     * (value, index|key, collection).\n\
     *\n\
     * If a property name is provided for `iteratee` the created \"_.pluck\" style\n\
     * callback returns the property value of the given element.\n\
     *\n\
     * If an object is provided for `iteratee` the created \"_.where\" style callback\n\
     * returns `true` for elements that have the properties of the given object,\n\
     * else `false`.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Collection\n\
     * @param {Array|Object|string} collection The collection to iterate over.\n\
     * @param {Array|Function|Object|string} [iteratee=_.identity] The function\n\
     *  invoked per iteration. If a property name or an object is provided it is\n\
     *  used to create a \"_.pluck\" or \"_.where\" style callback respectively.\n\
     * @param {*} [thisArg] The `this` binding of `iteratee`.\n\
     * @returns {Array} Returns the new sorted array.\n\
     * @example\n\
     *\n\
     * _.sortBy([1, 2, 3], function(n) { return Math.sin(n); });\n\
     * // => [3, 1, 2]\n\
     *\n\
     * _.sortBy([1, 2, 3], function(n) { return this.sin(n); }, Math);\n\
     * // => [3, 1, 2]\n\
     *\n\
     * var users = [\n\
     *   { 'user': 'fred' },\n\
     *   { 'user': 'pebbles' },\n\
     *   { 'user': 'barney' }\n\
     * ];\n\
     *\n\
     * // using \"_.pluck\" callback shorthand\n\
     * _.pluck(_.sortBy(users, 'user'), 'user');\n\
     * // => ['barney', 'fred', 'pebbles']\n\
     */\n\
    function sortBy(collection, iteratee, thisArg) {\n\
      if (thisArg && isIterateeCall(collection, iteratee, thisArg)) {\n\
        iteratee = null;\n\
      }\n\
      iteratee = getCallback(iteratee, thisArg, 3);\n\
\n\
      var index = -1,\n\
          length = collection ? collection.length : 0,\n\
          result = isLength(length) ? Array(length) : [];\n\
\n\
      baseEach(collection, function(value, key, collection) {\n\
        result[++index] = { 'criteria': iteratee(value, key, collection), 'index': index, 'value': value };\n\
      });\n\
      return baseSortBy(result, compareAscending);\n\
    }\n\
\n\
    /**\n\
     * This method is like `_.sortBy` except that it sorts by property names\n\
     * instead of an iteratee function.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Collection\n\
     * @param {Array|Object|string} collection The collection to iterate over.\n\
     * @param {...(string|string[])} props The property names to sort by,\n\
     *  specified as individual property names or arrays of property names.\n\
     * @returns {Array} Returns the new sorted array.\n\
     * @example\n\
     *\n\
     * var users = [\n\
     *   { 'user': 'barney', 'age': 36 },\n\
     *   { 'user': 'fred',   'age': 40 },\n\
     *   { 'user': 'barney', 'age': 26 },\n\
     *   { 'user': 'fred',   'age': 30 }\n\
     * ];\n\
     *\n\
     * _.map(_.sortByAll(users, ['user', 'age']), _.values);\n\
     * // => [['barney', 26], ['barney', 36], ['fred', 30], ['fred', 40]]\n\
     */\n\
    function sortByAll(collection) {\n\
      var args = arguments;\n\
      if (args.length == 4 && isIterateeCall(args[1], args[2], args[3])) {\n\
        args = [collection, args[1]];\n\
      }\n\
      var index = -1,\n\
          length = collection ? collection.length : 0,\n\
          props = baseFlatten(args, false, false, 1),\n\
          result = isLength(length) ? Array(length) : [];\n\
\n\
      baseEach(collection, function(value, key, collection) {\n\
        var length = props.length,\n\
            criteria = Array(length);\n\
\n\
        while (length--) {\n\
          criteria[length] = value == null ? undefined : value[props[length]];\n\
        }\n\
        result[++index] = { 'criteria': criteria, 'index': index, 'value': value };\n\
      });\n\
      return baseSortBy(result, compareMultipleAscending);\n\
    }\n\
\n\
    /**\n\
     * Converts `collection` to an array.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Collection\n\
     * @param {Array|Object|string} collection The collection to convert.\n\
     * @returns {Array} Returns the new converted array.\n\
     * @example\n\
     *\n\
     * (function() { return _.toArray(arguments).slice(1); })(1, 2, 3, 4);\n\
     * // => [2, 3, 4]\n\
     */\n\
    function toArray(collection) {\n\
      var length = collection ? collection.length : 0;\n\
      if (isLength(length)) {\n\
        return (lodash.support.unindexedChars && isString(collection))\n\
          ? collection.split('')\n\
          : baseSlice(collection);\n\
      }\n\
      return values(collection);\n\
    }\n\
\n\
    /**\n\
     * Performs a deep comparison between each element in `collection` and the\n\
     * source object, returning an array of all elements that have equivalent\n\
     * property values.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Collection\n\
     * @param {Array|Object|string} collection The collection to search.\n\
     * @param {Object} source The object of property values to match.\n\
     * @returns {Array} Returns the new filtered array.\n\
     * @example\n\
     *\n\
     * var users = [\n\
     *   { 'user': 'barney', 'age': 36, 'status': 'busy', 'pets': ['hoppy'] },\n\
     *   { 'user': 'fred',   'age': 40, 'status': 'busy', 'pets': ['baby puss', 'dino'] }\n\
     * ];\n\
     *\n\
     * _.pluck(_.where(users, { 'age': 36 }), 'user');\n\
     * // => ['barney']\n\
     *\n\
     * _.pluck(_.where(users, { 'pets': ['dino'] }), 'user');\n\
     * // => ['fred']\n\
     *\n\
     * _.pluck(_.where(users, { 'status': 'busy' }), 'user');\n\
     * // => ['barney', 'fred']\n\
     */\n\
    function where(collection, source) {\n\
      return filter(collection, matches(source));\n\
    }\n\
\n\
    /*------------------------------------------------------------------------*/\n\
\n\
    /**\n\
     * The opposite of `_.before`; this method creates a function that invokes\n\
     * `func` only after it is called `n` times.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Function\n\
     * @param {number} n The number of calls before `func` is invoked.\n\
     * @param {Function} func The function to restrict.\n\
     * @returns {Function} Returns the new restricted function.\n\
     * @example\n\
     *\n\
     * var saves = ['profile', 'settings'];\n\
     *\n\
     * var done = _.after(saves.length, function() {\n\
     *   console.log('done saving!');\n\
     * });\n\
     *\n\
     * _.forEach(saves, function(type) {\n\
     *   asyncSave({ 'type': type, 'complete': done });\n\
     * });\n\
     * // => logs 'done saving!' after the two async saves have completed\n\
     */\n\
    function after(n, func) {\n\
      if (!isFunction(func)) {\n\
        if (isFunction(n)) {\n\
          var temp = n;\n\
          n = func;\n\
          func = temp;\n\
        } else {\n\
          throw new TypeError(FUNC_ERROR_TEXT);\n\
        }\n\
      }\n\
      n = nativeIsFinite(n = +n) ? n : 0;\n\
      return function() {\n\
        if (--n < 1) {\n\
          return func.apply(this, arguments);\n\
        }\n\
      };\n\
    }\n\
\n\
    /**\n\
     * Creates a function that accepts up to `n` arguments ignoring any\n\
     * additional arguments.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Function\n\
     * @param {Function} func The function to cap arguments for.\n\
     * @param {number} [n=func.length] The arity cap.\n\
     * @param- {Object} [guard] Enables use as a callback for functions like `_.map`.\n\
     * @returns {Function} Returns the new function.\n\
     * @example\n\
     *\n\
     * _.map(['6', '8', '10'], _.ary(parseInt, 1));\n\
     * // => [6, 8, 10]\n\
     */\n\
    function ary(func, n, guard) {\n\
      if (guard && isIterateeCall(func, n, guard)) {\n\
        n = null;\n\
      }\n\
      n = n == null ? func.length : (+n || 0);\n\
      return createWrapper(func, ARY_FLAG, null, null, null, null, null, n);\n\
    }\n\
\n\
    /**\n\
     * Creates a function that invokes `func`, with the `this` binding and arguments\n\
     * of the created function, while it is called less than `n` times. Subsequent\n\
     * calls to the created function return the result of the last `func` invocation.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Function\n\
     * @param {number} n The number of calls at which `func` is no longer invoked.\n\
     * @param {Function} func The function to restrict.\n\
     * @returns {Function} Returns the new restricted function.\n\
     * @example\n\
     *\n\
     * jQuery('#add').on('click', _.before(5, addContactToList));\n\
     * // => allows adding up to 4 contacts to the list\n\
     */\n\
    function before(n, func) {\n\
      var result;\n\
      if (!isFunction(func)) {\n\
        if (isFunction(n)) {\n\
          var temp = n;\n\
          n = func;\n\
          func = temp;\n\
        } else {\n\
          throw new TypeError(FUNC_ERROR_TEXT);\n\
        }\n\
      }\n\
      return function() {\n\
        if (--n > 0) {\n\
          result = func.apply(this, arguments);\n\
        } else {\n\
          func = null;\n\
        }\n\
        return result;\n\
      };\n\
    }\n\
\n\
    /**\n\
     * Creates a function that invokes `func` with the `this` binding of `thisArg`\n\
     * and prepends any additional `_.bind` arguments to those provided to the\n\
     * bound function.\n\
     *\n\
     * The `_.bind.placeholder` value, which defaults to `_` in monolithic builds,\n\
     * may be used as a placeholder for partially applied arguments.\n\
     *\n\
     * **Note:** Unlike native `Function#bind` this method does not set the `length`\n\
     * property of bound functions.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Function\n\
     * @param {Function} func The function to bind.\n\
     * @param {*} [thisArg] The `this` binding of `func`.\n\
     * @param {...*} [args] The arguments to be partially applied.\n\
     * @returns {Function} Returns the new bound function.\n\
     * @example\n\
     *\n\
     * var greet = function(greeting, punctuation) {\n\
     *   return greeting + ' ' + this.user + punctuation;\n\
     * };\n\
     *\n\
     * var object = { 'user': 'fred' };\n\
     *\n\
     * var bound = _.bind(greet, object, 'hi');\n\
     * bound('!');\n\
     * // => 'hi fred!'\n\
     *\n\
     * // using placeholders\n\
     * var bound = _.bind(greet, object, _, '!');\n\
     * bound('hi');\n\
     * // => 'hi fred!'\n\
     */\n\
    function bind(func, thisArg) {\n\
      var bitmask = BIND_FLAG;\n\
      if (arguments.length > 2) {\n\
        var partials = slice(arguments, 2),\n\
            holders = replaceHolders(partials, bind.placeholder);\n\
\n\
        bitmask |= PARTIAL_FLAG;\n\
      }\n\
      return createWrapper(func, bitmask, thisArg, partials, holders);\n\
    }\n\
\n\
    /**\n\
     * Binds methods of an object to the object itself, overwriting the existing\n\
     * method. Method names may be specified as individual arguments or as arrays\n\
     * of method names. If no method names are provided all enumerable function\n\
     * properties, own and inherited, of `object` are bound.\n\
     *\n\
     * **Note:** This method does not set the `length` property of bound functions.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Function\n\
     * @param {Object} object The object to bind and assign the bound methods to.\n\
     * @param {...(string|string[])} [methodNames] The object method names to bind,\n\
     *  specified as individual method names or arrays of method names.\n\
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
     * // => logs 'clicked docs' when the element is clicked\n\
     */\n\
    function bindAll(object) {\n\
      return baseBindAll(object,\n\
        arguments.length > 1\n\
          ? baseFlatten(arguments, false, false, 1)\n\
          : functions(object)\n\
      );\n\
    }\n\
\n\
    /**\n\
     * Creates a function that invokes the method at `object[key]` and prepends\n\
     * any additional `_.bindKey` arguments to those provided to the bound function.\n\
     *\n\
     * This method differs from `_.bind` by allowing bound functions to reference\n\
     * methods that may be redefined or don't yet exist.\n\
     * See [Peter Michaux's article](http://michaux.ca/articles/lazy-function-definition-pattern)\n\
     * for more details.\n\
     *\n\
     * The `_.bindKey.placeholder` value, which defaults to `_` in monolithic\n\
     * builds, may be used as a placeholder for partially applied arguments.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Function\n\
     * @param {Object} object The object the method belongs to.\n\
     * @param {string} key The key of the method.\n\
     * @param {...*} [args] The arguments to be partially applied.\n\
     * @returns {Function} Returns the new bound function.\n\
     * @example\n\
     *\n\
     * var object = {\n\
     *   'user': 'fred',\n\
     *   'greet': function(greeting, punctuation) {\n\
     *     return greeting + ' ' + this.user + punctuation;\n\
     *   }\n\
     * };\n\
     *\n\
     * var bound = _.bindKey(object, 'greet', 'hi');\n\
     * bound('!');\n\
     * // => 'hi fred!'\n\
     *\n\
     * object.greet = function(greeting, punctuation) {\n\
     *   return greeting + 'ya ' + this.user + punctuation;\n\
     * };\n\
     *\n\
     * bound('!');\n\
     * // => 'hiya fred!'\n\
     *\n\
     * // using placeholders\n\
     * var bound = _.bindKey(object, 'greet', _, '!');\n\
     * bound('hi');\n\
     * // => 'hiya fred!'\n\
     */\n\
    function bindKey(object, key) {\n\
      var bitmask = BIND_FLAG | BIND_KEY_FLAG;\n\
      if (arguments.length > 2) {\n\
        var partials = slice(arguments, 2),\n\
            holders = replaceHolders(partials, bindKey.placeholder);\n\
\n\
        bitmask |= PARTIAL_FLAG;\n\
      }\n\
      return createWrapper(key, bitmask, object, partials, holders);\n\
    }\n\
\n\
    /**\n\
     * Creates a function that accepts one or more arguments of `func` that when\n\
     * called either invokes `func` returning its result, if all `func` arguments\n\
     * have been provided, or returns a function that accepts one or more of the\n\
     * remaining `func` arguments, and so on. The arity of `func` can be specified\n\
     * if `func.length` is not sufficient.\n\
     *\n\
     * The `_.curry.placeholder` value, which defaults to `_` in monolithic builds,\n\
     * may be used as a placeholder for provided arguments.\n\
     *\n\
     * **Note:** This method does not set the `length` property of curried functions.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Function\n\
     * @param {Function} func The function to curry.\n\
     * @param {number} [arity=func.length] The arity of `func`.\n\
     * @param- {Object} [guard] Enables use as a callback for functions like `_.map`.\n\
     * @returns {Function} Returns the new curried function.\n\
     * @example\n\
     *\n\
     * var abc = function(a, b, c) {\n\
     *   return [a, b, c];\n\
     * };\n\
     *\n\
     * var curried = _.curry(abc);\n\
     *\n\
     * curried(1)(2)(3);\n\
     * // => [1, 2, 3]\n\
     *\n\
     * curried(1, 2)(3);\n\
     * // => [1, 2, 3]\n\
     *\n\
     * curried(1, 2, 3);\n\
     * // => [1, 2, 3]\n\
     *\n\
     * // using placeholders\n\
     * curried(1)(_, 3)(2);\n\
     * // => [1, 2, 3]\n\
     */\n\
    function curry(func, arity, guard) {\n\
      if (guard && isIterateeCall(func, arity, guard)) {\n\
        arity = null;\n\
      }\n\
      var result = createWrapper(func, CURRY_FLAG, null, null, null, null, arity);\n\
      result.placeholder = curry.placeholder;\n\
      return result;\n\
    }\n\
\n\
    /**\n\
     * This method is like `_.curry` except that arguments are applied to `func`\n\
     * in the manner of `_.partialRight` instead of `_.partial`.\n\
     *\n\
     * The `_.curryRight.placeholder` value, which defaults to `_` in monolithic\n\
     * builds, may be used as a placeholder for provided arguments.\n\
     *\n\
     * **Note:** This method does not set the `length` property of curried functions.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Function\n\
     * @param {Function} func The function to curry.\n\
     * @param {number} [arity=func.length] The arity of `func`.\n\
     * @param- {Object} [guard] Enables use as a callback for functions like `_.map`.\n\
     * @returns {Function} Returns the new curried function.\n\
     * @example\n\
     *\n\
     * var abc = function(a, b, c) {\n\
     *   return [a, b, c];\n\
     * };\n\
     *\n\
     * var curried = _.curryRight(abc);\n\
     *\n\
     * curried(3)(2)(1);\n\
     * // => [1, 2, 3]\n\
     *\n\
     * curried(2, 3)(1);\n\
     * // => [1, 2, 3]\n\
     *\n\
     * curried(1, 2, 3);\n\
     * // => [1, 2, 3]\n\
     *\n\
     * // using placeholders\n\
     * curried(3)(1, _)(2);\n\
     * // => [1, 2, 3]\n\
     */\n\
    function curryRight(func, arity, guard) {\n\
      if (guard && isIterateeCall(func, arity, guard)) {\n\
        arity = null;\n\
      }\n\
      var result = createWrapper(func, CURRY_RIGHT_FLAG, null, null, null, null, guard ? null : arity);\n\
      result.placeholder = curryRight.placeholder;\n\
      return result;\n\
    }\n\
\n\
    /**\n\
     * Creates a function that delays invoking `func` until after `wait` milliseconds\n\
     * have elapsed since the last time it was invoked. The created function comes\n\
     * with a `cancel` method to cancel delayed invocations. Provide an options\n\
     * object to indicate that `func` should be invoked on the leading and/or\n\
     * trailing edge of the `wait` timeout. Subsequent calls to the debounced\n\
     * function return the result of the last `func` invocation.\n\
     *\n\
     * **Note:** If `leading` and `trailing` options are `true`, `func` is invoked\n\
     * on the trailing edge of the timeout only if the the debounced function is\n\
     * invoked more than once during the `wait` timeout.\n\
     *\n\
     * See [David Corbacho's article](http://drupalmotion.com/article/debounce-and-throttle-visual-explanation)\n\
     * for details over the differences between `_.debounce` and `_.throttle`.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Function\n\
     * @param {Function} func The function to debounce.\n\
     * @param {number} wait The number of milliseconds to delay.\n\
     * @param {Object} [options] The options object.\n\
     * @param {boolean} [options.leading=false] Specify invoking on the leading\n\
     *  edge of the timeout.\n\
     * @param {number} [options.maxWait] The maximum time `func` is allowed to be\n\
     *  delayed before it is invoked.\n\
     * @param {boolean} [options.trailing=true] Specify invoking on the trailing\n\
     *  edge of the timeout.\n\
     * @returns {Function} Returns the new debounced function.\n\
     * @example\n\
     *\n\
     * // avoid costly calculations while the window size is in flux\n\
     * jQuery(window).on('resize', _.debounce(calculateLayout, 150));\n\
     *\n\
     * // invoke `sendMail` when the click event is fired, debouncing subsequent calls\n\
     * jQuery('#postbox').on('click', _.debounce(sendMail, 300, {\n\
     *   'leading': true,\n\
     *   'trailing': false\n\
     * });\n\
     *\n\
     * // ensure `batchLog` is invoked once after 1 second of debounced calls\n\
     * var source = new EventSource('/stream');\n\
     * jQuery(source).on('message', _.debounce(batchLog, 250, {\n\
     *   'maxWait': 1000\n\
     * }, false);\n\
     *\n\
     * // cancel a debounced call\n\
     * var todoChanges = _.debounce(batchLog, 1000);\n\
     * Object.observe(models.todo, todoChanges);\n\
     *\n\
     * Object.observe(models, function(changes) {\n\
     *   if (_.find(changes, { 'user': 'todo', 'type': 'delete'})) {\n\
     *     todoChanges.cancel();\n\
     *   }\n\
     * }, ['delete']);\n\
     *\n\
     * // ...at some point `models.todo` is changed\n\
     * models.todo.completed = true;\n\
     *\n\
     * // ...before 1 second has passed `models.todo` is deleted\n\
     * // which cancels the debounced `todoChanges` call\n\
     * delete models.todo;\n\
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
        throw new TypeError(FUNC_ERROR_TEXT);\n\
      }\n\
      wait = wait < 0 ? 0 : wait;\n\
      if (options === true) {\n\
        var leading = true;\n\
        trailing = false;\n\
      } else if (isObject(options)) {\n\
        leading = options.leading;\n\
        maxWait = 'maxWait' in options && nativeMax(+options.maxWait || 0, wait);\n\
        trailing = 'trailing' in options ? options.trailing : trailing;\n\
      }\n\
\n\
      function cancel() {\n\
        if (timeoutId) {\n\
          clearTimeout(timeoutId);\n\
        }\n\
        if (maxTimeoutId) {\n\
          clearTimeout(maxTimeoutId);\n\
        }\n\
        maxTimeoutId = timeoutId = trailingCall = undefined;\n\
      }\n\
\n\
      function delayed() {\n\
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
      }\n\
\n\
      function maxDelayed() {\n\
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
      }\n\
\n\
      function debounced() {\n\
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
      }\n\
      debounced.cancel = cancel;\n\
      return debounced;\n\
    }\n\
\n\
    /**\n\
     * Defers invoking the `func` until the current call stack has cleared. Any\n\
     * additional arguments are provided to `func` when it is invoked.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Function\n\
     * @param {Function} func The function to defer.\n\
     * @param {...*} [args] The arguments to invoke the function with.\n\
     * @returns {number} Returns the timer id.\n\
     * @example\n\
     *\n\
     * _.defer(function(text) { console.log(text); }, 'deferred');\n\
     * // logs 'deferred' after one or more milliseconds\n\
     */\n\
    function defer(func) {\n\
      if (!isFunction(func)) {\n\
        throw new TypeError(FUNC_ERROR_TEXT);\n\
      }\n\
      var args = arguments;\n\
      return setTimeout(function() { func.apply(undefined, slice(args, 1)); }, 1);\n\
    }\n\
\n\
    /**\n\
     * Invokes `func` after `wait` milliseconds. Any additional arguments are\n\
     * provided to `func` when it is invoked.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Function\n\
     * @param {Function} func The function to delay.\n\
     * @param {number} wait The number of milliseconds to delay invocation.\n\
     * @param {...*} [args] The arguments to invoke the function with.\n\
     * @returns {number} Returns the timer id.\n\
     * @example\n\
     *\n\
     * _.delay(function(text) { console.log(text); }, 1000, 'later');\n\
     * // => logs 'later' after one second\n\
     */\n\
    function delay(func, wait) {\n\
      if (!isFunction(func)) {\n\
        throw new TypeError(FUNC_ERROR_TEXT);\n\
      }\n\
      var args = arguments;\n\
      return setTimeout(function() { func.apply(undefined, slice(args, 2)); }, wait);\n\
    }\n\
\n\
    /**\n\
     * Creates a function that returns the result of invoking the provided\n\
     * functions with the `this` binding of the created function, where each\n\
     * successive invocation is supplied the return value of the previous.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Function\n\
     * @param {...Function} [funcs] Functions to invoke.\n\
     * @returns {Function} Returns the new function.\n\
     * @example\n\
     *\n\
     * function add(x, y) {\n\
     *   return x + y;\n\
     * }\n\
     *\n\
     * function square(n) {\n\
     *   return n * n;\n\
     * }\n\
     *\n\
     * var addSquare = _.flow(add, square);\n\
     * addSquare(1, 2);\n\
     * // => 9\n\
     */\n\
    function flow() {\n\
      var funcs = arguments,\n\
          length = funcs.length;\n\
\n\
      if (!length) {\n\
        return function() {};\n\
      }\n\
      if (!arrayEvery(funcs, isFunction)) {\n\
        throw new TypeError(FUNC_ERROR_TEXT);\n\
      }\n\
      return function() {\n\
        var index = 0,\n\
            result = funcs[index].apply(this, arguments);\n\
\n\
        while (++index < length) {\n\
          result = funcs[index].call(this, result);\n\
        }\n\
        return result;\n\
      };\n\
    }\n\
\n\
    /**\n\
     * This method is like `_.flow` except that it creates a function that\n\
     * invokes the provided functions from right to left.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @alias backflow, compose\n\
     * @category Function\n\
     * @param {...Function} [funcs] Functions to invoke.\n\
     * @returns {Function} Returns the new function.\n\
     * @example\n\
     *\n\
     * function add(x, y) {\n\
     *   return x + y;\n\
     * }\n\
     *\n\
     * function square(n) {\n\
     *   return n * n;\n\
     * }\n\
     *\n\
     * var addSquare = _.flowRight(square, add);\n\
     * addSquare(1, 2);\n\
     * // => 9\n\
     */\n\
    function flowRight() {\n\
      var funcs = arguments,\n\
          fromIndex = funcs.length - 1;\n\
\n\
      if (fromIndex < 0) {\n\
        return function() {};\n\
      }\n\
      if (!arrayEvery(funcs, isFunction)) {\n\
        throw new TypeError(FUNC_ERROR_TEXT);\n\
      }\n\
      return function() {\n\
        var index = fromIndex,\n\
            result = funcs[index].apply(this, arguments);\n\
\n\
        while (index--) {\n\
          result = funcs[index].call(this, result);\n\
        }\n\
        return result;\n\
      };\n\
    }\n\
\n\
    /**\n\
     * Creates a function that memoizes the result of `func`. If `resolver` is\n\
     * provided it determines the cache key for storing the result based on the\n\
     * arguments provided to the memoized function. By default, the first argument\n\
     * provided to the memoized function is coerced to a string and used as the\n\
     * cache key. The `func` is invoked with the `this` binding of the memoized\n\
     * function.\n\
     *\n\
     * **Note:** The cache is exposed as the `cache` property on the memoized\n\
     * function. Its creation may be customized by replacing the `_.memoize.Cache`\n\
     * constructor with one whose instances implement the ES6 `Map` method interface\n\
     * of `get`, `has`, and `set`. See the\n\
     * [ES6 spec](https://people.mozilla.org/~jorendorff/es6-draft.html#sec-properties-of-the-map-prototype-object)\n\
     * for more details.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Function\n\
     * @param {Function} func The function to have its output memoized.\n\
     * @param {Function} [resolver] The function to resolve the cache key.\n\
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
     * // modifying the result cache\n\
     * var upperCase = _.memoize(function(string) {\n\
     *   return string.toUpperCase();\n\
     * });\n\
     *\n\
     * upperCase('fred');\n\
     * // => 'FRED'\n\
     *\n\
     * upperCase.cache.set('fred, 'BARNEY');\n\
     * upperCase('fred');\n\
     * // => 'BARNEY'\n\
     */\n\
    function memoize(func, resolver) {\n\
      if (!isFunction(func) || (resolver && !isFunction(resolver))) {\n\
        throw new TypeError(FUNC_ERROR_TEXT);\n\
      }\n\
      var memoized = function() {\n\
        var cache = memoized.cache,\n\
            key = resolver ? resolver.apply(this, arguments) : arguments[0];\n\
\n\
        if (cache.has(key)) {\n\
          return cache.get(key);\n\
        }\n\
        var result = func.apply(this, arguments);\n\
        cache.set(key, result);\n\
        return result;\n\
      };\n\
      memoized.cache = new memoize.Cache;\n\
      return memoized;\n\
    }\n\
\n\
    /**\n\
     * Creates a function that negates the result of the predicate `func`. The\n\
     * `func` predicate is invoked with the `this` binding and arguments of the\n\
     * created function.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Function\n\
     * @param {Function} predicate The predicate to negate.\n\
     * @returns {Function} Returns the new function.\n\
     * @example\n\
     *\n\
     * function isEven(n) {\n\
     *   return n % 2 == 0;\n\
     * }\n\
     *\n\
     * _.filter([1, 2, 3, 4, 5, 6], _.negate(isEven));\n\
     * // => [1, 3, 5]\n\
     */\n\
    function negate(predicate) {\n\
      if (!isFunction(predicate)) {\n\
        throw new TypeError(FUNC_ERROR_TEXT);\n\
      }\n\
      return function() {\n\
        return !predicate.apply(this, arguments);\n\
      };\n\
    }\n\
\n\
    /**\n\
     * Creates a function that is restricted to invoking `func` once. Repeat calls\n\
     * to the function return the value of the first call. The `func` is invoked\n\
     * with the `this` binding of the created function.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @type Function\n\
     * @category Function\n\
     * @param {Function} func The function to restrict.\n\
     * @returns {Function} Returns the new restricted function.\n\
     * @example\n\
     *\n\
     * var initialize = _.once(createApplication);\n\
     * initialize();\n\
     * initialize();\n\
     * // `initialize` invokes `createApplication` once\n\
     */\n\
    var once = createWrapper(before, PARTIAL_FLAG, null, [2]);\n\
\n\
    /**\n\
     * Creates a function that invokes `func` with `partial` arguments prepended\n\
     * to those provided to the new function. This method is like `_.bind` except\n\
     * it does **not** alter the `this` binding.\n\
     *\n\
     * The `_.partial.placeholder` value, which defaults to `_` in monolithic\n\
     * builds, may be used as a placeholder for partially applied arguments.\n\
     *\n\
     * **Note:** This method does not set the `length` property of partially\n\
     * applied functions.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Function\n\
     * @param {Function} func The function to partially apply arguments to.\n\
     * @param {...*} [args] The arguments to be partially applied.\n\
     * @returns {Function} Returns the new partially applied function.\n\
     * @example\n\
     *\n\
     * var greet = function(greeting, name) {\n\
     *   return greeting + ' ' + name;\n\
     * };\n\
     *\n\
     * var sayHelloTo = _.partial(greet, 'hello');\n\
     * sayHelloTo('fred');\n\
     * // => 'hello fred'\n\
     *\n\
     * // using placeholders\n\
     * var greetFred = _.partial(greet, _, 'fred');\n\
     * greetFred('hi');\n\
     * // => 'hi fred'\n\
     */\n\
    function partial(func) {\n\
      var partials = slice(arguments, 1),\n\
          holders = replaceHolders(partials, partial.placeholder);\n\
\n\
      return createWrapper(func, PARTIAL_FLAG, null, partials, holders);\n\
    }\n\
\n\
    /**\n\
     * This method is like `_.partial` except that partially applied arguments\n\
     * are appended to those provided to the new function.\n\
     *\n\
     * The `_.partialRight.placeholder` value, which defaults to `_` in monolithic\n\
     * builds, may be used as a placeholder for partially applied arguments.\n\
     *\n\
     * **Note:** This method does not set the `length` property of partially\n\
     * applied functions.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Function\n\
     * @param {Function} func The function to partially apply arguments to.\n\
     * @param {...*} [args] The arguments to be partially applied.\n\
     * @returns {Function} Returns the new partially applied function.\n\
     * @example\n\
     *\n\
     * var greet = function(greeting, name) {\n\
     *   return greeting + ' ' + name;\n\
     * };\n\
     *\n\
     * var greetFred = _.partialRight(greet, 'fred');\n\
     * greetFred('hi');\n\
     * // => 'hi fred'\n\
     *\n\
     * // using placeholders\n\
     * var sayHelloTo = _.partialRight(greet, 'hello', _);\n\
     * sayHelloTo('fred');\n\
     * // => 'hello fred'\n\
     */\n\
    function partialRight(func) {\n\
      var partials = slice(arguments, 1),\n\
          holders = replaceHolders(partials, partialRight.placeholder);\n\
\n\
      return createWrapper(func, PARTIAL_RIGHT_FLAG, null, partials, holders);\n\
    }\n\
\n\
    /**\n\
     * Creates a function that invokes `func` with arguments arranged according\n\
     * to the specified indexes where the argument value at the first index is\n\
     * provided as the first argument, the argument value at the second index is\n\
     * provided as the second argument, and so on.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Function\n\
     * @param {Function} func The function to rearrange arguments for.\n\
     * @param {...(number|number[])} indexes The arranged argument indexes,\n\
     *  specified as individual indexes or arrays of indexes.\n\
     * @returns {Function} Returns the new function.\n\
     * @example\n\
     *\n\
     * var rearged = _.rearg(function(a, b, c) {\n\
     *   return [a, b, c];\n\
     * }, 2, 0, 1);\n\
     *\n\
     * rearged('b', 'c', 'a')\n\
     * // => ['a', 'b', 'c']\n\
     *\n\
     * var map = _.rearg(_.map, [1, 0]);\n\
     * map(function(n) { return n * 3; }, [1, 2, 3]);\n\
     * // => [3, 6, 9]\n\
     */\n\
    function rearg(func) {\n\
      var indexes = baseFlatten(arguments, false, false, 1);\n\
      return indexes.length\n\
        ? createWrapper(func, REARG_FLAG, null, null, null, [indexes])\n\
        : createWrapper(func);\n\
    }\n\
\n\
    /**\n\
     * Creates a function that only invokes `func` at most once per every `wait`\n\
     * milliseconds. The created function comes with a `cancel` method to cancel\n\
     * delayed invocations. Provide an options object to indicate that `func`\n\
     * should be invoked on the leading and/or trailing edge of the `wait` timeout.\n\
     * Subsequent calls to the throttled function return the result of the last\n\
     * `func` call.\n\
     *\n\
     * **Note:** If `leading` and `trailing` options are `true`, `func` is invoked\n\
     * on the trailing edge of the timeout only if the the throttled function is\n\
     * invoked more than once during the `wait` timeout.\n\
     *\n\
     * See [David Corbacho's article](http://drupalmotion.com/article/debounce-and-throttle-visual-explanation)\n\
     * for details over the differences between `_.throttle` and `_.debounce`.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Function\n\
     * @param {Function} func The function to throttle.\n\
     * @param {number} wait The number of milliseconds to throttle invocations to.\n\
     * @param {Object} [options] The options object.\n\
     * @param {boolean} [options.leading=true] Specify invoking on the leading\n\
     *  edge of the timeout.\n\
     * @param {boolean} [options.trailing=true] Specify invoking on the trailing\n\
     *  edge of the timeout.\n\
     * @returns {Function} Returns the new throttled function.\n\
     * @example\n\
     *\n\
     * // avoid excessively updating the position while scrolling\n\
     * jQuery(window).on('scroll', _.throttle(updatePosition, 100));\n\
     *\n\
     * // invoke `renewToken` when the click event is fired, but not more than once every 5 minutes\n\
     * var throttled =  _.throttle(renewToken, 300000, { 'trailing': false })\n\
     * jQuery('.interactive').on('click', throttled);\n\
     *\n\
     * // cancel a trailing throttled call\n\
     * jQuery(window).on('popstate', throttled.cancel);\n\
     */\n\
    function throttle(func, wait, options) {\n\
      var leading = true,\n\
          trailing = true;\n\
\n\
      if (!isFunction(func)) {\n\
        throw new TypeError(FUNC_ERROR_TEXT);\n\
      }\n\
      if (options === false) {\n\
        leading = false;\n\
      } else if (isObject(options)) {\n\
        leading = 'leading' in options ? !!options.leading : leading;\n\
        trailing = 'trailing' in options ? !!options.trailing : trailing;\n\
      }\n\
      debounceOptions.leading = leading;\n\
      debounceOptions.maxWait = +wait;\n\
      debounceOptions.trailing = trailing;\n\
      return debounce(func, wait, debounceOptions);\n\
    }\n\
\n\
    /**\n\
     * Creates a function that provides `value` to the wrapper function as its\n\
     * first argument. Any additional arguments provided to the function are\n\
     * appended to those provided to the wrapper function. The wrapper is invoked\n\
     * with the `this` binding of the created function.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Function\n\
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
      wrapper = wrapper == null ? identity : wrapper;\n\
      return createWrapper(wrapper, PARTIAL_FLAG, null, [value]);\n\
    }\n\
\n\
    /*------------------------------------------------------------------------*/\n\
\n\
    /**\n\
     * Creates a clone of `value`. If `isDeep` is `true` nested objects are cloned,\n\
     * otherwise they are assigned by reference. If `customizer` is provided it is\n\
     * invoked to produce the cloned values. If `customizer` returns `undefined`\n\
     * cloning is handled by the method instead. The `customizer` is bound to\n\
     * `thisArg` and invoked with two argument; (value, index|key).\n\
     *\n\
     * **Note:** This method is loosely based on the structured clone algorithm.\n\
     * The enumerable properties of `arguments` objects and objects created by\n\
     * constructors other than `Object` are cloned to plain `Object` objects. An\n\
     * empty object is returned for uncloneable values such as functions, DOM nodes,\n\
     * Maps, Sets, and WeakMaps. See the [HTML5 specification](http://www.w3.org/TR/html5/infrastructure.html#internal-structured-cloning-algorithm)\n\
     * for more details.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Lang\n\
     * @param {*} value The value to clone.\n\
     * @param {boolean} [isDeep=false] Specify a deep clone.\n\
     * @param {Function} [customizer] The function to customize cloning values.\n\
     * @param {*} [thisArg] The `this` binding of `customizer`.\n\
     * @returns {*} Returns the cloned value.\n\
     * @example\n\
     *\n\
     * var users = [\n\
     *   { 'user': 'barney' },\n\
     *   { 'user': 'fred' }\n\
     * ];\n\
     *\n\
     * var shallow = _.clone(users);\n\
     * shallow[0] === users[0];\n\
     * // => true\n\
     *\n\
     * var deep = _.clone(users, true);\n\
     * deep[0] === users[0];\n\
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
    function clone(value, isDeep, customizer, thisArg) {\n\
      // Juggle arguments.\n\
      if (typeof isDeep != 'boolean' && isDeep != null) {\n\
        thisArg = customizer;\n\
        customizer = isIterateeCall(value, isDeep, thisArg) ? null : isDeep;\n\
        isDeep = false;\n\
      }\n\
      customizer = typeof customizer == 'function' && baseCallback(customizer, thisArg, 1);\n\
      return baseClone(value, isDeep, customizer);\n\
    }\n\
\n\
    /**\n\
     * Creates a deep clone of `value`. If `customizer` is provided it is invoked\n\
     * to produce the cloned values. If `customizer` returns `undefined` cloning\n\
     * is handled by the method instead. The `customizer` is bound to `thisArg`\n\
     * and invoked with two argument; (value, index|key).\n\
     *\n\
     * **Note:** This method is loosely based on the structured clone algorithm.\n\
     * The enumerable properties of `arguments` objects and objects created by\n\
     * constructors other than `Object` are cloned to plain `Object` objects. An\n\
     * empty object is returned for uncloneable values such as functions, DOM nodes,\n\
     * Maps, Sets, and WeakMaps. See the [HTML5 specification](http://www.w3.org/TR/html5/infrastructure.html#internal-structured-cloning-algorithm)\n\
     * for more details.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Lang\n\
     * @param {*} value The value to deep clone.\n\
     * @param {Function} [customizer] The function to customize cloning values.\n\
     * @param {*} [thisArg] The `this` binding of `customizer`.\n\
     * @returns {*} Returns the deep cloned value.\n\
     * @example\n\
     *\n\
     * var users = [\n\
     *   { 'user': 'barney' },\n\
     *   { 'user': 'fred' }\n\
     * ];\n\
     *\n\
     * var deep = _.cloneDeep(users);\n\
     * deep[0] === users[0];\n\
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
    function cloneDeep(value, customizer, thisArg) {\n\
      customizer = typeof customizer == 'function' && baseCallback(customizer, thisArg, 1);\n\
      return baseClone(value, true, customizer);\n\
    }\n\
\n\
    /**\n\
     * Checks if `value` is classified as an `arguments` object.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Lang\n\
     * @param {*} value The value to check.\n\
     * @returns {boolean} Returns `true` if `value` is correctly classified, else `false`.\n\
     * @example\n\
     *\n\
     * (function() { return _.isArguments(arguments); })();\n\
     * // => true\n\
     *\n\
     * _.isArguments([1, 2, 3]);\n\
     * // => false\n\
     */\n\
    function isArguments(value) {\n\
      var length = isObjectLike(value) ? value.length : undefined;\n\
      return (isLength(length) && toString.call(value) == argsClass) || false;\n\
    }\n\
    // Fallback for environments without a `[[Class]]` for `arguments` objects.\n\
    if (!support.argsClass) {\n\
      isArguments = function(value) {\n\
        var length = isObjectLike(value) ? value.length : undefined;\n\
        return (isLength(length) && hasOwnProperty.call(value, 'callee') &&\n\
          !propertyIsEnumerable.call(value, 'callee')) || false;\n\
      };\n\
    }\n\
\n\
    /**\n\
     * Checks if `value` is classified as an `Array` object.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Lang\n\
     * @param {*} value The value to check.\n\
     * @returns {boolean} Returns `true` if `value` is correctly classified, else `false`.\n\
     * @example\n\
     *\n\
     * _.isArray([1, 2, 3]);\n\
     * // => true\n\
     *\n\
     * (function() { return _.isArray(arguments); })();\n\
     * // => false\n\
     */\n\
    var isArray = nativeIsArray || function(value) {\n\
      return (isObjectLike(value) && isLength(value.length) && toString.call(value) == arrayClass) || false;\n\
    };\n\
\n\
    /**\n\
     * Checks if `value` is classified as a boolean primitive or object.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Lang\n\
     * @param {*} value The value to check.\n\
     * @returns {boolean} Returns `true` if `value` is correctly classified, else `false`.\n\
     * @example\n\
     *\n\
     * _.isBoolean(false);\n\
     * // => true\n\
     *\n\
     * _.isBoolean(null);\n\
     * // => false\n\
     */\n\
    function isBoolean(value) {\n\
      return (value === true || value === false || isObjectLike(value) && toString.call(value) == boolClass) || false;\n\
    }\n\
\n\
    /**\n\
     * Checks if `value` is classified as a `Date` object.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Lang\n\
     * @param {*} value The value to check.\n\
     * @returns {boolean} Returns `true` if `value` is correctly classified, else `false`.\n\
     * @example\n\
     *\n\
     * _.isDate(new Date);\n\
     * // => true\n\
     *\n\
     * _.isDate('Mon April 23 2012');\n\
     * // => false\n\
     */\n\
    function isDate(value) {\n\
      return (isObjectLike(value) && toString.call(value) == dateClass) || false;\n\
    }\n\
\n\
    /**\n\
     * Checks if `value` is a DOM element.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Lang\n\
     * @param {*} value The value to check.\n\
     * @returns {boolean} Returns `true` if `value` is a DOM element, else `false`.\n\
     * @example\n\
     *\n\
     * _.isElement(document.body);\n\
     * // => true\n\
     *\n\
     * _.isElement('<body>');\n\
     * // => false\n\
     */\n\
    function isElement(value) {\n\
      return (value && value.nodeType === 1 && isObjectLike(value) &&\n\
        (lodash.support.nodeClass ? toString.call(value).indexOf('Element') > -1 : isHostObject(value))) || false;\n\
    }\n\
    // Fallback for environments without DOM support.\n\
    if (!support.dom) {\n\
      isElement = function(value) {\n\
        return (value && value.nodeType === 1 && isObjectLike(value) && !isPlainObject(value)) || false;\n\
      };\n\
    }\n\
\n\
    /**\n\
     * Checks if a collection is empty. A value is considered empty unless it is\n\
     * an array-like value with a length greater than `0` or an object with own\n\
     * enumerable properties.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Lang\n\
     * @param {Array|Object|string} value The value to inspect.\n\
     * @returns {boolean} Returns `true` if `value` is empty, else `false`.\n\
     * @example\n\
     *\n\
     * _.isEmpty(null);\n\
     * // => true\n\
     *\n\
     * _.isEmpty(true);\n\
     * // => true\n\
     *\n\
     * _.isEmpty(1);\n\
     * // => true\n\
     *\n\
     * _.isEmpty([1, 2, 3]);\n\
     * // => false\n\
     *\n\
     * _.isEmpty({ 'a': 1 });\n\
     * // => false\n\
     */\n\
    function isEmpty(value) {\n\
      if (value == null) {\n\
        return true;\n\
      }\n\
      var length = value.length;\n\
      if (isLength(length) && (isArray(value) || isString(value) || isArguments(value) ||\n\
          (isObjectLike(value) && isFunction(value.splice)))) {\n\
        return !length;\n\
      }\n\
      return !keys(value).length;\n\
    }\n\
\n\
    /**\n\
     * Performs a deep comparison between two values to determine if they are\n\
     * equivalent. If `customizer` is provided it is invoked to compare values.\n\
     * If `customizer` returns `undefined` comparisons are handled by the method\n\
     * instead. The `customizer` is bound to `thisArg` and invoked with three\n\
     * arguments; (value, other, key).\n\
     *\n\
     * **Note:** This method supports comparing arrays, booleans, `Date` objects,\n\
     * numbers, `Object` objects, regexes, and strings. Functions and DOM nodes\n\
     * are **not** supported. Provide a customizer function to extend support\n\
     * for comparing other values.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Lang\n\
     * @param {*} value The value to compare to `other`.\n\
     * @param {*} other The value to compare to `value`.\n\
     * @param {Function} [customizer] The function to customize comparing values.\n\
     * @param {*} [thisArg] The `this` binding of `customizer`.\n\
     * @returns {boolean} Returns `true` if the values are equivalent, else `false`.\n\
     * @example\n\
     *\n\
     * var object = { 'user': 'fred' };\n\
     * var other = { 'user': 'fred' };\n\
     *\n\
     * object == other;\n\
     * // => false\n\
     *\n\
     * _.isEqual(object, other);\n\
     * // => true\n\
     *\n\
     * var words = ['hello', 'goodbye'];\n\
     * var otherWords = ['hi', 'goodbye'];\n\
     *\n\
     * _.isEqual(words, otherWords, function() {\n\
     *   return _.every(arguments, _.bind(RegExp.prototype.test, /^h(?:i|ello)$/)) || undefined;\n\
     * });\n\
     * // => true\n\
     */\n\
    function isEqual(value, other, customizer, thisArg) {\n\
      customizer = typeof customizer == 'function' && baseCallback(customizer, thisArg, 3);\n\
      return (!customizer && isStrictComparable(value) && isStrictComparable(other))\n\
        ? value === other\n\
        : baseIsEqual(value, other, customizer);\n\
    }\n\
\n\
    /**\n\
     * Checks if `value` is an `Error`, `EvalError`, `RangeError`, `ReferenceError`,\n\
     * `SyntaxError`, `TypeError`, or `URIError` object.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Lang\n\
     * @param {*} value The value to check.\n\
     * @returns {boolean} Returns `true` if `value` is an error object, else `false`.\n\
     * @example\n\
     *\n\
     * _.isError(new Error);\n\
     * // => true\n\
     *\n\
     * _.isError(Error);\n\
     * // => false\n\
     */\n\
    function isError(value) {\n\
      return (isObjectLike(value) && toString.call(value) == errorClass) || false;\n\
    }\n\
\n\
    /**\n\
     * Checks if `value` is a finite primitive number.\n\
     *\n\
     * **Note:** This method is based on ES6 `Number.isFinite`. See the\n\
     * [ES6 spec](http://people.mozilla.org/~jorendorff/es6-draft.html#sec-number.isfinite)\n\
     * for more details.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Lang\n\
     * @param {*} value The value to check.\n\
     * @returns {boolean} Returns `true` if `value` is a finite number, else `false`.\n\
     * @example\n\
     *\n\
     * _.isFinite(10);\n\
     * // => true\n\
     *\n\
     * _.isFinite('10');\n\
     * // => false\n\
     *\n\
     * _.isFinite(true);\n\
     * // => false\n\
     *\n\
     * _.isFinite(Object(10));\n\
     * // => false\n\
     *\n\
     * _.isFinite(Infinity);\n\
     * // => false\n\
     */\n\
    var isFinite = nativeNumIsFinite || function(value) {\n\
      return typeof value == 'number' && nativeIsFinite(value);\n\
    };\n\
\n\
    /**\n\
     * Checks if `value` is classified as a `Function` object.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Lang\n\
     * @param {*} value The value to check.\n\
     * @returns {boolean} Returns `true` if `value` is correctly classified, else `false`.\n\
     * @example\n\
     *\n\
     * _.isFunction(_);\n\
     * // => true\n\
     *\n\
     * _.isFunction(/abc/);\n\
     * // => false\n\
     */\n\
    function isFunction(value) {\n\
      // Avoid a Chakra JIT bug in compatibility modes of IE 11.\n\
      // See https://github.com/jashkenas/underscore/issues/1621.\n\
      return typeof value == 'function' || false;\n\
    }\n\
    // Fallback for environments that return incorrect `typeof` operator results.\n\
    if (isFunction(/x/) || (Uint8Array && !isFunction(Uint8Array))) {\n\
      isFunction = function(value) {\n\
        // The use of `Object#toString` avoids issues with the `typeof` operator\n\
        // in older versions of Chrome and Safari which return 'function' for\n\
        // regexes and Safari 8 equivalents which return 'object' for typed\n\
        // array constructors.\n\
        return toString.call(value) == funcClass;\n\
      };\n\
    }\n\
\n\
    /**\n\
     * Checks if `value` is the language type of `Object`.\n\
     * (e.g. arrays, functions, objects, regexes, `new Number(0)`, and `new String('')`)\n\
     *\n\
     * **Note:** See the [ES5 spec](http://es5.github.io/#x8) for more details.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Lang\n\
     * @param {*} value The value to check.\n\
     * @returns {boolean} Returns `true` if `value` is an object, else `false`.\n\
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
      // Avoid a V8 JIT bug in Chrome 19-20.\n\
      // See https://code.google.com/p/v8/issues/detail?id=2291.\n\
      var type = typeof value;\n\
      return type == 'function' || (value && type == 'object') || false;\n\
    }\n\
\n\
    /**\n\
     * Checks if `value` is `NaN`.\n\
     *\n\
     * **Note:** This method is not the same as native `isNaN` which returns `true`\n\
     * for `undefined` and other non-numeric values. See the [ES5 spec](http://es5.github.io/#x15.1.2.4)\n\
     * for more details.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Lang\n\
     * @param {*} value The value to check.\n\
     * @returns {boolean} Returns `true` if `value` is `NaN`, else `false`.\n\
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
      // (perform the `[[Class]]` check first to avoid errors with some host objects in IE).\n\
      return isNumber(value) && value != +value;\n\
    }\n\
\n\
    /**\n\
     * Checks if `value` is a native function.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Lang\n\
     * @param {*} value The value to check.\n\
     * @returns {boolean} Returns `true` if `value` is a native function, else `false`.\n\
     * @example\n\
     *\n\
     * _.isNative(Array.prototype.push);\n\
     * // => true\n\
     *\n\
     * _.isNative(_);\n\
     * // => false\n\
     */\n\
    function isNative(value) {\n\
      if (value == null) {\n\
        return false;\n\
      }\n\
      if (toString.call(value) == funcClass) {\n\
        return reNative.test(fnToString.call(value));\n\
      }\n\
      return (isObjectLike(value) &&\n\
        (isHostObject(value) ? reNative : reHostCtor).test(value)) || false;\n\
    }\n\
\n\
    /**\n\
     * Checks if `value` is `null`.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Lang\n\
     * @param {*} value The value to check.\n\
     * @returns {boolean} Returns `true` if `value` is `null`, else `false`.\n\
     * @example\n\
     *\n\
     * _.isNull(null);\n\
     * // => true\n\
     *\n\
     * _.isNull(void 0);\n\
     * // => false\n\
     */\n\
    function isNull(value) {\n\
      return value === null;\n\
    }\n\
\n\
    /**\n\
     * Checks if `value` is classified as a `Number` primitive or object.\n\
     *\n\
     * **Note:** To exclude `Infinity`, `-Infinity`, and `NaN`, which are classified\n\
     * as numbers, use the `_.isFinite` method.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Lang\n\
     * @param {*} value The value to check.\n\
     * @returns {boolean} Returns `true` if `value` is correctly classified, else `false`.\n\
     * @example\n\
     *\n\
     * _.isNumber(8.4);\n\
     * // => true\n\
     *\n\
     * _.isNumber(NaN);\n\
     * // => true\n\
     *\n\
     * _.isNumber('8.4');\n\
     * // => false\n\
     */\n\
    function isNumber(value) {\n\
      return typeof value == 'number' || (isObjectLike(value) && toString.call(value) == numberClass) || false;\n\
    }\n\
\n\
    /**\n\
     * Checks if `value` is an object created by the `Object` constructor or has\n\
     * a `[[Prototype]]` of `null`.\n\
     *\n\
     * **Note:** This method assumes objects created by the `Object` constructor\n\
     * have no inherited enumerable properties.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Lang\n\
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
     *\n\
     * _.isPlainObject(Object.create(null));\n\
     * // => true\n\
     */\n\
    var isPlainObject = !getPrototypeOf ? shimIsPlainObject : function(value) {\n\
      if (!(value && toString.call(value) == objectClass) || (!lodash.support.argsClass && isArguments(value))) {\n\
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
     * Checks if `value` is classified as a `RegExp` object.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Lang\n\
     * @param {*} value The value to check.\n\
     * @returns {boolean} Returns `true` if `value` is correctly classified, else `false`.\n\
     * @example\n\
     *\n\
     * _.isRegExp(/abc/);\n\
     * // => true\n\
     *\n\
     * _.isRegExp('/abc/');\n\
     * // => false\n\
     */\n\
    function isRegExp(value) {\n\
      return (isObject(value) && toString.call(value) == regexpClass) || false;\n\
    }\n\
\n\
    /**\n\
     * Checks if `value` is classified as a `String` primitive or object.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Lang\n\
     * @param {*} value The value to check.\n\
     * @returns {boolean} Returns `true` if `value` is correctly classified, else `false`.\n\
     * @example\n\
     *\n\
     * _.isString('abc');\n\
     * // => true\n\
     *\n\
     * _.isString(1);\n\
     * // => false\n\
     */\n\
    function isString(value) {\n\
      return typeof value == 'string' || (isObjectLike(value) && toString.call(value) == stringClass) || false;\n\
    }\n\
\n\
    /**\n\
     * Checks if `value` is `undefined`.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Lang\n\
     * @param {*} value The value to check.\n\
     * @returns {boolean} Returns `true` if `value` is `undefined`, else `false`.\n\
     * @example\n\
     *\n\
     * _.isUndefined(void 0);\n\
     * // => true\n\
     *\n\
     * _.isUndefined(null);\n\
     * // => false\n\
     */\n\
    function isUndefined(value) {\n\
      return typeof value == 'undefined';\n\
    }\n\
\n\
    /*------------------------------------------------------------------------*/\n\
\n\
    /**\n\
     * Assigns own enumerable properties of source object(s) to the destination\n\
     * object. Subsequent sources overwrite property assignments of previous sources.\n\
     * If `customizer` is provided it is invoked to produce the assigned values.\n\
     * The `customizer` is bound to `thisArg` and invoked with five arguments;\n\
     * (objectValue, sourceValue, key, object, source).\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @alias extend\n\
     * @category Object\n\
     * @param {Object} object The destination object.\n\
     * @param {...Object} [sources] The source objects.\n\
     * @param {Function} [customizer] The function to customize assigning values.\n\
     * @param {*} [thisArg] The `this` binding of `customizer`.\n\
     * @returns {Object} Returns the destination object.\n\
     * @example\n\
     *\n\
     * _.assign({ 'user': 'fred' }, { 'age': 40 }, { 'status': 'busy' });\n\
     * // => { 'user': 'fred', 'age': 40, 'status': 'busy' }\n\
     *\n\
     * var defaults = _.partialRight(_.assign, function(value, other) {\n\
     *   return typeof value == 'undefined' ? other : value;\n\
     * });\n\
     *\n\
     * defaults({ 'user': 'barney' }, { 'age': 36 }, { 'user': 'fred', 'status': 'busy' });\n\
     * // => { 'user': 'barney', 'age': 36, 'status': 'busy' }\n\
     */\n\
    var assign = createAssigner(baseAssign);\n\
\n\
    /**\n\
     * Creates an object that inherits from the given `prototype` object. If a\n\
     * `properties` object is provided its own enumerable properties are assigned\n\
     * to the created object.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Object\n\
     * @param {Object} prototype The object to inherit from.\n\
     * @param {Object} [properties] The properties to assign to the object.\n\
     * @param- {Object} [guard] Enables use as a callback for functions like `_.map`.\n\
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
    function create(prototype, properties, guard) {\n\
      var result = baseCreate(prototype);\n\
      if (guard && isIterateeCall(prototype, properties, guard)) {\n\
        properties = null;\n\
      }\n\
      return properties ? baseAssign(result, properties) : result;\n\
    }\n\
\n\
    /**\n\
     * Assigns own enumerable properties of source object(s) to the destination\n\
     * object for all destination properties that resolve to `undefined`. Once a\n\
     * property is set, additional defaults of the same property are ignored.\n\
     *\n\
     * **Note:** See the [documentation example of `_.partialRight`](https://lodash.com/docs#partialRight)\n\
     * for a deep version of this method.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Object\n\
     * @param {Object} object The destination object.\n\
     * @param {...Object} [sources] The source objects.\n\
     * @returns {Object} Returns the destination object.\n\
     * @example\n\
     *\n\
     * _.defaults({ 'user': 'barney' }, { 'age': 36 }, { 'user': 'fred', 'status': 'busy' });\n\
     * // => { 'user': 'barney', 'age': 36, 'status': 'busy' }\n\
     */\n\
    function defaults(object) {\n\
      if (object == null) {\n\
        return object;\n\
      }\n\
      var args = baseSlice(arguments);\n\
      args.push(assignDefaults);\n\
      return assign.apply(undefined, args);\n\
    }\n\
\n\
    /**\n\
     * This method is like `_.findIndex` except that it returns the key of the\n\
     * first element `predicate` returns truthy for, instead of the element itself.\n\
     *\n\
     * If a property name is provided for `predicate` the created \"_.pluck\" style\n\
     * callback returns the property value of the given element.\n\
     *\n\
     * If an object is provided for `predicate` the created \"_.where\" style callback\n\
     * returns `true` for elements that have the properties of the given object,\n\
     * else `false`.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Object\n\
     * @param {Object} object The object to search.\n\
     * @param {Function|Object|string} [predicate=_.identity] The function invoked\n\
     *  per iteration. If a property name or object is provided it is used to\n\
     *  create a \"_.pluck\" or \"_.where\" style callback respectively.\n\
     * @param {*} [thisArg] The `this` binding of `predicate`.\n\
     * @returns {string|undefined} Returns the key of the matched element, else `undefined`.\n\
     * @example\n\
     *\n\
     * var users = {\n\
     *   'barney':  { 'age': 36, 'active': true },\n\
     *   'fred':    { 'age': 40, 'active': false },\n\
     *   'pebbles': { 'age': 1,  'active': true }\n\
     * };\n\
     *\n\
     * _.findKey(users, function(chr) { return chr.age < 40; });\n\
     * // => 'barney' (iteration order is not guaranteed)\n\
     *\n\
     * // using \"_.where\" callback shorthand\n\
     * _.findKey(users, { 'age': 1 });\n\
     * // => 'pebbles'\n\
     *\n\
     * // using \"_.pluck\" callback shorthand\n\
     * _.findKey(users, 'active');\n\
     * // => 'barney'\n\
     */\n\
    function findKey(object, predicate, thisArg) {\n\
      predicate = getCallback(predicate, thisArg, 3);\n\
      return baseFind(object, predicate, baseForOwn, true);\n\
    }\n\
\n\
    /**\n\
     * This method is like `_.findKey` except that it iterates over elements of\n\
     * a collection in the opposite order.\n\
     *\n\
     * If a property name is provided for `predicate` the created \"_.pluck\" style\n\
     * callback returns the property value of the given element.\n\
     *\n\
     * If an object is provided for `predicate` the created \"_.where\" style callback\n\
     * returns `true` for elements that have the properties of the given object,\n\
     * else `false`.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Object\n\
     * @param {Object} object The object to search.\n\
     * @param {Function|Object|string} [predicate=_.identity] The function invoked\n\
     *  per iteration. If a property name or object is provided it is used to\n\
     *  create a \"_.pluck\" or \"_.where\" style callback respectively.\n\
     * @param {*} [thisArg] The `this` binding of `predicate`.\n\
     * @returns {string|undefined} Returns the key of the matched element, else `undefined`.\n\
     * @example\n\
     *\n\
     * var users = {\n\
     *   'barney':  { 'age': 36, 'active': true },\n\
     *   'fred':    { 'age': 40, 'active': false },\n\
     *   'pebbles': { 'age': 1,  'active': true }\n\
     * };\n\
     *\n\
     * _.findLastKey(users, function(chr) { return chr.age < 40; });\n\
     * // => returns `pebbles` assuming `_.findKey` returns `barney`\n\
     *\n\
     * // using \"_.where\" callback shorthand\n\
     * _.findLastKey(users, { 'age': 40 });\n\
     * // => 'fred'\n\
     *\n\
     * // using \"_.pluck\" callback shorthand\n\
     * _.findLastKey(users, 'active');\n\
     * // => 'pebbles'\n\
     */\n\
    function findLastKey(object, predicate, thisArg) {\n\
      predicate = getCallback(predicate, thisArg, 3);\n\
      return baseFind(object, predicate, baseForOwnRight, true);\n\
    }\n\
\n\
    /**\n\
     * Iterates over own and inherited enumerable properties of an object invoking\n\
     * `iteratee` for each property. The `iteratee` is bound to `thisArg` and invoked\n\
     * with three arguments; (value, key, object). Iterator functions may exit\n\
     * iteration early by explicitly returning `false`.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Object\n\
     * @param {Object} object The object to iterate over.\n\
     * @param {Function} [iteratee=_.identity] The function invoked per iteration.\n\
     * @param {*} [thisArg] The `this` binding of `iteratee`.\n\
     * @returns {Object} Returns `object`.\n\
     * @example\n\
     *\n\
     * function Shape() {\n\
     *   this.x = 0;\n\
     *   this.y = 0;\n\
     * }\n\
     *\n\
     * Shape.prototype.z = 0;\n\
     *\n\
     * _.forIn(new Shape, function(value, key) {\n\
     *   console.log(key);\n\
     * });\n\
     * // => logs 'x', 'y', and 'z' (iteration order is not guaranteed)\n\
     */\n\
    function forIn(object, iteratee, thisArg) {\n\
      if (typeof iteratee != 'function' || typeof thisArg != 'undefined') {\n\
        iteratee = baseCallback(iteratee, thisArg, 3);\n\
      }\n\
      return baseFor(object, iteratee, keysIn);\n\
    }\n\
\n\
    /**\n\
     * This method is like `_.forIn` except that it iterates over properties of\n\
     * `object` in the opposite order.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Object\n\
     * @param {Object} object The object to iterate over.\n\
     * @param {Function} [iteratee=_.identity] The function invoked per iteration.\n\
     * @param {*} [thisArg] The `this` binding of `iteratee`.\n\
     * @returns {Object} Returns `object`.\n\
     * @example\n\
     *\n\
     * function Shape() {\n\
     *   this.x = 0;\n\
     *   this.y = 0;\n\
     * }\n\
     *\n\
     * Shape.prototype.z = 0;\n\
     *\n\
     * _.forInRight(new Shape, function(value, key) {\n\
     *   console.log(key);\n\
     * });\n\
     * // => logs 'z', 'y', and 'x' assuming `_.forIn ` logs 'x', 'y', and 'z'\n\
     */\n\
    function forInRight(object, iteratee, thisArg) {\n\
      iteratee = baseCallback(iteratee, thisArg, 3);\n\
      return baseForRight(object, iteratee, keysIn);\n\
    }\n\
\n\
    /**\n\
     * Iterates over own enumerable properties of an object invoking `iteratee`\n\
     * for each property. The `iteratee` is bound to `thisArg` and invoked with\n\
     * three arguments; (value, key, object). Iterator functions may exit iteration\n\
     * early by explicitly returning `false`.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Object\n\
     * @param {Object} object The object to iterate over.\n\
     * @param {Function} [iteratee=_.identity] The function invoked per iteration.\n\
     * @param {*} [thisArg] The `this` binding of `iteratee`.\n\
     * @returns {Object} Returns `object`.\n\
     * @example\n\
     *\n\
     * _.forOwn({ '0': 'zero', '1': 'one', 'length': 2 }, function(n, key) {\n\
     *   console.log(key);\n\
     * });\n\
     * // => logs '0', '1', and 'length' (iteration order is not guaranteed)\n\
     */\n\
    function forOwn(object, iteratee, thisArg) {\n\
      if (typeof iteratee != 'function' || typeof thisArg != 'undefined') {\n\
        iteratee = baseCallback(iteratee, thisArg, 3);\n\
      }\n\
      return baseForOwn(object, iteratee);\n\
    }\n\
\n\
    /**\n\
     * This method is like `_.forOwn` except that it iterates over properties of\n\
     * `object` in the opposite order.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Object\n\
     * @param {Object} object The object to iterate over.\n\
     * @param {Function} [iteratee=_.identity] The function invoked per iteration.\n\
     * @param {*} [thisArg] The `this` binding of `iteratee`.\n\
     * @returns {Object} Returns `object`.\n\
     * @example\n\
     *\n\
     * _.forOwnRight({ '0': 'zero', '1': 'one', 'length': 2 }, function(n, key) {\n\
     *   console.log(key);\n\
     * });\n\
     * // => logs 'length', '1', and '0' assuming `_.forOwn` logs '0', '1', and 'length'\n\
     */\n\
    function forOwnRight(object, iteratee, thisArg) {\n\
      iteratee = baseCallback(iteratee, thisArg, 3);\n\
      return baseForRight(object, iteratee, keys);\n\
    }\n\
\n\
    /**\n\
     * Creates an array of function property names from all enumerable properties,\n\
     * own and inherited, of `object`.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @alias methods\n\
     * @category Object\n\
     * @param {Object} object The object to inspect.\n\
     * @returns {Array} Returns the new array of property names.\n\
     * @example\n\
     *\n\
     * _.functions(_);\n\
     * // => ['all', 'any', 'bind', ...]\n\
     */\n\
    function functions(object) {\n\
      return baseFunctions(object, keysIn(object));\n\
    }\n\
\n\
    /**\n\
     * Checks if the specified property name exists as a direct property of `object`,\n\
     * instead of an inherited property.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Object\n\
     * @param {Object} object The object to inspect.\n\
     * @param {string} key The name of the property to check.\n\
     * @returns {boolean} Returns `true` if `key` is a direct property, else `false`.\n\
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
     * Creates an object composed of the inverted keys and values of `object`.\n\
     * If `object` contains duplicate values, subsequent values overwrite property\n\
     * assignments of previous values unless `multiValue` is `true`.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Object\n\
     * @param {Object} object The object to invert.\n\
     * @param {boolean} [multiValue=false] Allow multiple values per key.\n\
     * @param- {Object} [guard] Enables use as a callback for functions like `_.map`.\n\
     * @returns {Object} Returns the new inverted object.\n\
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
    function invert(object, multiValue, guard) {\n\
      if (guard && isIterateeCall(object, multiValue, guard)) {\n\
        multiValue = null;\n\
      }\n\
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
     * Creates an array of the own enumerable property names of `object`.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Object\n\
     * @param {Object} object The object to inspect.\n\
     * @returns {Array} Returns the array of property names.\n\
     * @example\n\
     *\n\
     * function Shape() {\n\
     *   this.x = 0;\n\
     *   this.y = 0;\n\
     * }\n\
     *\n\
     * Shape.prototype.z = 0;\n\
     *\n\
     * _.keys(new Shape);\n\
     * // => ['x', 'y'] (iteration order is not guaranteed)\n\
     */\n\
    var keys = !nativeKeys ? shimKeys : function(object) {\n\
      if (object) {\n\
        var Ctor = object.constructor,\n\
            length = object.length;\n\
      }\n\
      if ((typeof Ctor == 'function' && Ctor.prototype === object) ||\n\
          (typeof length == 'number' && length > 0) ||\n\
          (lodash.support.enumPrototypes && typeof object == 'function')) {\n\
        return shimKeys(object);\n\
      }\n\
      return isObject(object) ? nativeKeys(object) : [];\n\
    };\n\
\n\
    /**\n\
     * Creates an array of the own and inherited enumerable property names of `object`.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Object\n\
     * @param {Object} object The object to inspect.\n\
     * @returns {Array} Returns the array of property names.\n\
     * @example\n\
     *\n\
     * function Shape() {\n\
     *   this.x = 0;\n\
     *   this.y = 0;\n\
     * }\n\
     *\n\
     * Shape.prototype.z = 0;\n\
     *\n\
     * _.keysIn(new Shape);\n\
     * // => ['x', 'y', 'z'] (iteration order is not guaranteed)\n\
     */\n\
    function keysIn(object) {\n\
      if (object == null) {\n\
        return [];\n\
      }\n\
      if (!isObject(object)) {\n\
        object = Object(object);\n\
      }\n\
      var length = object.length,\n\
          support = lodash.support;\n\
\n\
      length = (typeof length == 'number' && length > 0 &&\n\
        (isArray(object) || (support.nonEnumStrings && isString(object)) ||\n\
          (support.nonEnumArgs && isArguments(object))) && length) || 0;\n\
\n\
      var Ctor = object.constructor,\n\
          index = -1,\n\
          proto = (typeof Ctor == 'function' && Ctor.prototype) || objectProto,\n\
          isProto = proto === object,\n\
          result = Array(length),\n\
          skipIndexes = length > 0,\n\
          skipErrorProps = support.enumErrorProps && (object === errorProto || object instanceof Error),\n\
          skipProto = support.enumPrototypes && typeof object == 'function';\n\
\n\
      while (++index < length) {\n\
        result[index] = String(index);\n\
      }\n\
      // Lo-Dash skips the `constructor` property when it infers it is iterating\n\
      // over a `prototype` object because IE < 9 can't set the `[[Enumerable]]`\n\
      // attribute of an existing property and the `constructor` property of a\n\
      // prototype defaults to non-enumerable.\n\
      for (var key in object) {\n\
        if (!(skipProto && key == 'prototype') &&\n\
            !(skipErrorProps && (key == 'message' || key == 'name')) &&\n\
            !(skipIndexes && isIndex(key, length)) &&\n\
            !(key == 'constructor' && (isProto || !hasOwnProperty.call(object, key)))) {\n\
          result.push(key);\n\
        }\n\
      }\n\
      if (support.nonEnumShadows && object !== objectProto) {\n\
        var className = object === stringProto ? stringClass : object === errorProto ? errorClass : toString.call(object),\n\
            nonEnums = nonEnumProps[className] || nonEnumProps[objectClass];\n\
\n\
        if (className == objectClass) {\n\
          proto = objectProto;\n\
        }\n\
        length = shadowProps.length;\n\
        while (length--) {\n\
          key = shadowProps[length];\n\
          var nonEnum = nonEnums[key];\n\
          if (!(isProto && nonEnum) &&\n\
              (nonEnum ? hasOwnProperty.call(object, key) : object[key] !== proto[key])) {\n\
            result.push(key);\n\
          }\n\
        }\n\
      }\n\
      return result;\n\
    }\n\
\n\
    /**\n\
     * Creates an object with the same keys as `object` and values generated by\n\
     * running each own enumerable property of `object` through `iteratee`. The\n\
     * iteratee function is bound to `thisArg` and invoked with three arguments;\n\
     * (value, key, object).\n\
     *\n\
     * If a property name is provided for `iteratee` the created \"_.pluck\" style\n\
     * callback returns the property value of the given element.\n\
     *\n\
     * If an object is provided for `iteratee` the created \"_.where\" style callback\n\
     * returns `true` for elements that have the properties of the given object,\n\
     * else `false`.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Object\n\
     * @param {Object} object The object to iterate over.\n\
     * @param {Function|Object|string} [iteratee=_.identity] The function invoked\n\
     *  per iteration. If a property name or object is provided it is used to\n\
     *  create a \"_.pluck\" or \"_.where\" style callback respectively.\n\
     * @param {*} [thisArg] The `this` binding of `iteratee`.\n\
     * @returns {Object} Returns the new mapped object.\n\
     * @example\n\
     *\n\
     * _.mapValues({ 'a': 1, 'b': 2, 'c': 3} , function(n) { return n * 3; });\n\
     * // => { 'a': 3, 'b': 6, 'c': 9 }\n\
     *\n\
     * var users = {\n\
     *   'fred':    { 'user': 'fred',    'age': 40 },\n\
     *   'pebbles': { 'user': 'pebbles', 'age': 1 }\n\
     * };\n\
     *\n\
     * // using \"_.pluck\" callback shorthand\n\
     * _.mapValues(users, 'age');\n\
     * // => { 'fred': 40, 'pebbles': 1 }\n\
     */\n\
    function mapValues(object, iteratee, thisArg) {\n\
      iteratee = getCallback(iteratee, thisArg, 3);\n\
\n\
      var result = {}\n\
      baseForOwn(object, function(value, key, object) {\n\
        result[key] = iteratee(value, key, object);\n\
      });\n\
      return result;\n\
    }\n\
\n\
    /**\n\
     * Recursively merges own enumerable properties of the source object(s), that\n\
     * don't resolve to `undefined` into the destination object. Subsequent sources\n\
     * overwrite property assignments of previous sources. If `customizer` is\n\
     * provided it is invoked to produce the merged values of the destination and\n\
     * source properties. If `customizer` returns `undefined` merging is handled\n\
     * by the method instead. The `customizer` is bound to `thisArg` and invoked\n\
     * with five arguments; (objectValue, sourceValue, key, object, source).\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Object\n\
     * @param {Object} object The destination object.\n\
     * @param {...Object} [sources] The source objects.\n\
     * @param {Function} [customizer] The function to customize merging properties.\n\
     * @param {*} [thisArg] The `this` binding of `customizer`.\n\
     * @returns {Object} Returns the destination object.\n\
     * @example\n\
     *\n\
     * var users = {\n\
     *   'data': [{ 'user': 'barney' }, { 'user': 'fred' }]\n\
     * };\n\
     *\n\
     * var ages = {\n\
     *   'data': [{ 'age': 36 }, { 'age': 40 }]\n\
     * };\n\
     *\n\
     * _.merge(users, ages);\n\
     * // => { 'data': [{ 'user': 'barney', 'age': 36 }, { 'user': 'fred', 'age': 40 }] }\n\
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
     * // => { 'fruits': ['apple', 'banana'], 'vegetables': ['beet', 'carrot'] }\n\
     */\n\
    var merge = createAssigner(baseMerge);\n\
\n\
    /**\n\
     * Creates a shallow clone of `object` excluding the specified properties.\n\
     * Property names may be specified as individual arguments or as arrays of\n\
     * property names. If `predicate` is provided it is invoked for each property\n\
     * of `object` omitting the properties `predicate` returns truthy for. The\n\
     * predicate is bound to `thisArg` and invoked with three arguments;\n\
     * (value, key, object).\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Object\n\
     * @param {Object} object The source object.\n\
     * @param {Function|...(string|string[])} [predicate] The function invoked per\n\
     *  iteration or property names to omit, specified as individual property\n\
     *  names or arrays of property names.\n\
     * @param {*} [thisArg] The `this` binding of `predicate`.\n\
     * @returns {Object} Returns the new object.\n\
     * @example\n\
     *\n\
     * _.omit({ 'user': 'fred', 'age': 40 }, 'age');\n\
     * // => { 'user': 'fred' }\n\
     *\n\
     * _.omit({ 'user': 'fred', 'age': 40 }, function(value) {\n\
     *   return typeof value == 'number';\n\
     * });\n\
     * // => { 'user': 'fred' }\n\
     */\n\
    function omit(object, predicate, thisArg) {\n\
      if (object == null) {\n\
        return {};\n\
      }\n\
      if (typeof predicate != 'function') {\n\
        var props = arrayMap(baseFlatten(arguments, false, false, 1), String);\n\
        return pickByArray(object, baseDifference(keysIn(object), props));\n\
      }\n\
      predicate = getCallback(predicate, thisArg, 3);\n\
      return pickByCallback(object, function(value, key, object) {\n\
        return !predicate(value, key, object);\n\
      });\n\
    }\n\
\n\
    /**\n\
     * Creates a two dimensional array of the key-value pairs for `object`,\n\
     * e.g. `[[key1, value1], [key2, value2]]`.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Object\n\
     * @param {Object} object The object to inspect.\n\
     * @returns {Array} Returns the new array of key-value pairs.\n\
     * @example\n\
     *\n\
     * _.pairs({ 'barney': 36, 'fred': 40 });\n\
     * // => [['barney', 36], ['fred', 40]] (iteration order is not guaranteed)\n\
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
     * property names. If `predicate` is provided it is invoked for each property\n\
     * of `object` picking the properties `predicate` returns truthy for. The\n\
     * predicate is bound to `thisArg` and invoked with three arguments;\n\
     * (value, key, object).\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Object\n\
     * @param {Object} object The source object.\n\
     * @param {Function|...(string|string[])} [predicate] The function invoked per\n\
     *  iteration or property names to pick, specified as individual property\n\
     *  names or arrays of property names.\n\
     * @param {*} [thisArg] The `this` binding of `predicate`.\n\
     * @returns {Object} Returns the new object.\n\
     * @example\n\
     *\n\
     * _.pick({ 'user': 'fred', '_userid': 'fred1' }, 'user');\n\
     * // => { 'user': 'fred' }\n\
     *\n\
     * _.pick({ 'user': 'fred', '_userid': 'fred1' }, function(value, key) {\n\
     *   return key.charAt(0) != '_';\n\
     * });\n\
     * // => { 'user': 'fred' }\n\
     */\n\
    function pick(object, predicate, thisArg) {\n\
      if (object == null) {\n\
        return {};\n\
      }\n\
      return typeof predicate == 'function'\n\
        ? pickByCallback(object, getCallback(predicate, thisArg, 3))\n\
        : pickByArray(object, baseFlatten(arguments, false, false, 1));\n\
    }\n\
\n\
    /**\n\
     * An alternative to `_.reduce`; this method transforms `object` to a new\n\
     * `accumulator` object which is the result of running each of its own\n\
     * enumerable properties through `iteratee`, with each invocation potentially\n\
     * mutating the `accumulator` object. The `iteratee` is bound to `thisArg`\n\
     * and invoked with four arguments; (accumulator, value, key, object). Iterator\n\
     * functions may exit iteration early by explicitly returning `false`.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Object\n\
     * @param {Array|Object} object The object to iterate over.\n\
     * @param {Function} [iteratee=_.identity] The function invoked per iteration.\n\
     * @param {*} [accumulator] The custom accumulator value.\n\
     * @param {*} [thisArg] The `this` binding of `iteratee`.\n\
     * @returns {*} Returns the accumulated value.\n\
     * @example\n\
     *\n\
     * var squares = _.transform([1, 2, 3, 4, 5, 6], function(result, n) {\n\
     *   n *= n;\n\
     *   if (n % 2) {\n\
     *     return result.push(n) < 3;\n\
     *   }\n\
     * });\n\
     * // => [1, 9, 25]\n\
     *\n\
     * var mapped = _.transform({ 'a': 1, 'b': 2, 'c': 3 }, function(result, n, key) {\n\
     *   result[key] = n * 3;\n\
     * });\n\
     * // => { 'a': 3, 'b': 6, 'c': 9 }\n\
     */\n\
    function transform(object, iteratee, accumulator, thisArg) {\n\
      iteratee = getCallback(iteratee, thisArg, 4);\n\
\n\
      var isArr = isArrayLike(object);\n\
      if (accumulator == null) {\n\
        if (isArr || isObject(object)) {\n\
          var Ctor = object.constructor;\n\
          if (isArr) {\n\
            accumulator = isArray(object) ? new Ctor : [];\n\
          } else {\n\
            accumulator = baseCreate(typeof Ctor == 'function' && Ctor.prototype);\n\
          }\n\
        } else {\n\
          accumulator = {};\n\
        }\n\
      }\n\
      (isArr ? arrayEach : baseForOwn)(object, function(value, index, object) {\n\
        return iteratee(accumulator, value, index, object);\n\
      });\n\
      return accumulator;\n\
    }\n\
\n\
    /**\n\
     * Creates an array of the own enumerable property values of `object`.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Object\n\
     * @param {Object} object The object to inspect.\n\
     * @returns {Array} Returns the array of property values.\n\
     * @example\n\
     *\n\
     * function Shape(x, y) {\n\
     *   this.x = x;\n\
     *   this.y = y;\n\
     * }\n\
     *\n\
     * Shape.prototype.z = 0;\n\
     *\n\
     * _.values(new Shape(2, 1));\n\
     * // => [2, 1] (iteration order is not guaranteed)\n\
     */\n\
    function values(object) {\n\
      return baseValues(object, keys);\n\
    }\n\
\n\
    /**\n\
     * Creates an array of the own and inherited enumerable property values\n\
     * of `object`.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Object\n\
     * @param {Object} object The object to inspect.\n\
     * @returns {Array} Returns the array of property values.\n\
     * @example\n\
     *\n\
     * function Shape(x, y) {\n\
     *   this.x = x;\n\
     *   this.y = y;\n\
     * }\n\
     *\n\
     * Shape.prototype.z = 0;\n\
     *\n\
     * _.valuesIn(new Shape(2, 1));\n\
     * // => [2, 1, 0] (iteration order is not guaranteed)\n\
     */\n\
    function valuesIn(object) {\n\
      return baseValues(object, keysIn);\n\
    }\n\
\n\
    /*------------------------------------------------------------------------*/\n\
\n\
    /**\n\
     * Converts `string` to camel case.\n\
     * See [Wikipedia](http://en.wikipedia.org/wiki/CamelCase) for more details.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category String\n\
     * @param {string} [string=''] The string to camel case.\n\
     * @returns {string} Returns the camel cased string.\n\
     * @example\n\
     *\n\
     * _.camelCase('Hello world');\n\
     * // => 'helloWorld'\n\
     *\n\
     * _.camelCase('--hello-world');\n\
     * // => 'helloWorld'\n\
     *\n\
     * _.camelCase('__hello_world__');\n\
     * // => 'helloWorld'\n\
     */\n\
    var camelCase = createCompounder(function(result, word, index) {\n\
      word = word.toLowerCase();\n\
      return index ? (result + word.charAt(0).toUpperCase() + word.slice(1)) : word;\n\
    });\n\
\n\
    /**\n\
     * Capitalizes the first character of `string`.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category String\n\
     * @param {string} [string=''] The string to capitalize.\n\
     * @returns {string} Returns the capitalized string.\n\
     * @example\n\
     *\n\
     * _.capitalize('fred');\n\
     * // => 'Fred'\n\
     */\n\
    function capitalize(string) {\n\
      string = string == null ? '' : String(string);\n\
      return string ? (string.charAt(0).toUpperCase() + string.slice(1)) : string;\n\
    }\n\
\n\
    /**\n\
     * Deburrs `string` by converting latin-1 supplementary letters to basic latin letters.\n\
     * See [Wikipedia](http://en.wikipedia.org/wiki/Latin-1_Supplement_(Unicode_block)#Character_table)\n\
     * for more details.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category String\n\
     * @param {string} [string=''] The string to deburr.\n\
     * @returns {string} Returns the deburred string.\n\
     * @example\n\
     *\n\
     * _.deburr('déjà vu');\n\
     * // => 'deja vu'\n\
     */\n\
    function deburr(string) {\n\
      string = string == null ? '' : String(string);\n\
      return string ? string.replace(reLatin1, deburrLetter) : string;\n\
    }\n\
\n\
    /**\n\
     * Checks if `string` ends with the given target string.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category String\n\
     * @param {string} [string=''] The string to search.\n\
     * @param {string} [target] The string to search for.\n\
     * @param {number} [position=string.length] The position to search from.\n\
     * @returns {boolean} Returns `true` if `string` ends with `target`, else `false`.\n\
     * @example\n\
     *\n\
     * _.endsWith('abc', 'c');\n\
     * // => true\n\
     *\n\
     * _.endsWith('abc', 'b');\n\
     * // => false\n\
     *\n\
     * _.endsWith('abc', 'b', 2);\n\
     * // => true\n\
     */\n\
    function endsWith(string, target, position) {\n\
      string = string == null ? '' : String(string);\n\
      target = String(target);\n\
\n\
      var length = string.length;\n\
      position = (typeof position == 'undefined' ? length : nativeMin(position < 0 ? 0 : (+position || 0), length)) - target.length;\n\
      return position >= 0 && string.indexOf(target, position) == position;\n\
    }\n\
\n\
    /**\n\
     * Converts the characters \"&\", \"<\", \">\", '\"', \"'\", and '`', in `string` to\n\
     * their corresponding HTML entities.\n\
     *\n\
     * **Note:** No other characters are escaped. To escape additional characters\n\
     * use a third-party library like [_he_](http://mths.be/he).\n\
     *\n\
     * Though the \">\" character is escaped for symmetry, characters like\n\
     * \">\" and \"/\" don't require escaping in HTML and have no special meaning\n\
     * unless they're part of a tag or unquoted attribute value.\n\
     * See [Mathias Bynens's article](http://mathiasbynens.be/notes/ambiguous-ampersands)\n\
     * (under \"semi-related fun fact\") for more details.\n\
     *\n\
     * Backticks are escaped because in Internet Explorer < 9, they can break out\n\
     * of attribute values or HTML comments. See [#102](http://html5sec.org/#102),\n\
     * [#108](http://html5sec.org/#108), and [#133](http://html5sec.org/#133) of\n\
     * the [HTML5 Security Cheatsheet](http://html5sec.org/) for more details.\n\
     *\n\
     * When working with HTML you should always quote attribute values to reduce\n\
     * XSS vectors. See [Ryan Grove's article](http://wonko.com/post/html-escaping)\n\
     * for more details.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category String\n\
     * @param {string} [string=''] The string to escape.\n\
     * @returns {string} Returns the escaped string.\n\
     * @example\n\
     *\n\
     * _.escape('fred, barney, & pebbles');\n\
     * // => 'fred, barney, &amp; pebbles'\n\
     */\n\
    function escape(string) {\n\
      // Reset `lastIndex` because in IE < 9 `String#replace` does not.\n\
      string = string == null ? '' : String(string);\n\
      return string && (reUnescapedHtml.lastIndex = 0, reUnescapedHtml.test(string))\n\
        ? string.replace(reUnescapedHtml, escapeHtmlChar)\n\
        : string;\n\
    }\n\
\n\
    /**\n\
     * Escapes the `RegExp` special characters \"\\\", \"^\", \"$\", \".\", \"|\", \"?\", \"*\",\n\
     * \"+\", \"(\", \")\", \"[\", \"]\", \"{\" and \"}\" in `string`.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category String\n\
     * @param {string} [string=''] The string to escape.\n\
     * @returns {string} Returns the escaped string.\n\
     * @example\n\
     *\n\
     * _.escapeRegExp('[lodash](https://lodash.com/)');\n\
     * // => '\\[lodash\\]\\(https://lodash\\.com/\\)'\n\
     */\n\
    function escapeRegExp(string) {\n\
      string = string == null ? '' : String(string);\n\
      return string && (reRegExpChars.lastIndex = 0, reRegExpChars.test(string))\n\
        ? string.replace(reRegExpChars, '\\\\$&')\n\
        : string;\n\
    }\n\
\n\
    /**\n\
     * Converts `string` to kebab case (a.k.a. spinal case).\n\
     * See [Wikipedia](http://en.wikipedia.org/wiki/Letter_case#Computers) for\n\
     * more details.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category String\n\
     * @param {string} [string=''] The string to kebab case.\n\
     * @returns {string} Returns the kebab cased string.\n\
     * @example\n\
     *\n\
     * _.kebabCase('Hello world');\n\
     * // => 'hello-world'\n\
     *\n\
     * _.kebabCase('helloWorld');\n\
     * // => 'hello-world'\n\
     *\n\
     * _.kebabCase('__hello_world__');\n\
     * // => 'hello-world'\n\
     */\n\
    var kebabCase = createCompounder(function(result, word, index) {\n\
      return result + (index ? '-' : '') + word.toLowerCase();\n\
    });\n\
\n\
    /**\n\
     * Pads `string` on the left and right sides if it is shorter then the given\n\
     * padding length. The `chars` string may be truncated if the number of padding\n\
     * characters can't be evenly divided by the padding length.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category String\n\
     * @param {string} [string=''] The string to pad.\n\
     * @param {number} [length=0] The padding length.\n\
     * @param {string} [chars=' '] The string used as padding.\n\
     * @returns {string} Returns the padded string.\n\
     * @example\n\
     *\n\
     * _.pad('abc', 8);\n\
     * // => '  abc   '\n\
     *\n\
     * _.pad('abc', 8, '_-');\n\
     * // => '_-abc_-_'\n\
     *\n\
     * _.pad('abc', 3);\n\
     * // => 'abc'\n\
     */\n\
    function pad(string, length, chars) {\n\
      string = string == null ? '' : String(string);\n\
      length = +length;\n\
\n\
      var strLength = string.length;\n\
      if (strLength >= length || !nativeIsFinite(length)) {\n\
        return string;\n\
      }\n\
      var mid = (length - strLength) / 2,\n\
          leftLength = floor(mid),\n\
          rightLength = ceil(mid);\n\
\n\
      chars = createPad('', rightLength, chars);\n\
      return chars.slice(0, leftLength) + string + chars;\n\
    }\n\
\n\
    /**\n\
     * Pads `string` on the left side if it is shorter then the given padding\n\
     * length. The `chars` string may be truncated if the number of padding\n\
     * characters exceeds the padding length.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category String\n\
     * @param {string} [string=''] The string to pad.\n\
     * @param {number} [length=0] The padding length.\n\
     * @param {string} [chars=' '] The string used as padding.\n\
     * @returns {string} Returns the padded string.\n\
     * @example\n\
     *\n\
     * _.padLeft('abc', 6);\n\
     * // => '   abc'\n\
     *\n\
     * _.padLeft('abc', 6, '_-');\n\
     * // => '_-_abc'\n\
     *\n\
     * _.padLeft('abc', 3);\n\
     * // => 'abc'\n\
     */\n\
    function padLeft(string, length, chars) {\n\
      string = string == null ? '' : String(string);\n\
      return string ? (createPad(string, length, chars) + string) : string;\n\
    }\n\
\n\
    /**\n\
     * Pads `string` on the right side if it is shorter then the given padding\n\
     * length. The `chars` string may be truncated if the number of padding\n\
     * characters exceeds the padding length.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category String\n\
     * @param {string} [string=''] The string to pad.\n\
     * @param {number} [length=0] The padding length.\n\
     * @param {string} [chars=' '] The string used as padding.\n\
     * @returns {string} Returns the padded string.\n\
     * @example\n\
     *\n\
     * _.padRight('abc', 6);\n\
     * // => 'abc   '\n\
     *\n\
     * _.padRight('abc', 6, '_-');\n\
     * // => 'abc_-_'\n\
     *\n\
     * _.padRight('abc', 3);\n\
     * // => 'abc'\n\
     */\n\
    function padRight(string, length, chars) {\n\
      string = string == null ? '' : String(string);\n\
      return string ? (string + createPad(string, length, chars)) : string;\n\
    }\n\
\n\
    /**\n\
     * Repeats the given string `n` times.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category String\n\
     * @param {string} [string=''] The string to repeat.\n\
     * @param {number} [n=0] The number of times to repeat the string.\n\
     * @returns {string} Returns the repeated string.\n\
     * @example\n\
     *\n\
     * _.repeat('*', 3);\n\
     * // => '***'\n\
     *\n\
     * _.repeat('abc', 2);\n\
     * // => 'abcabc'\n\
     *\n\
     * _.repeat('abc', 0);\n\
     * // => ''\n\
     */\n\
    function repeat(string, n) {\n\
      var result = '';\n\
      n = +n;\n\
\n\
      if (n < 1 || string == null || !nativeIsFinite(n)) {\n\
        return result;\n\
      }\n\
      string = String(string);\n\
\n\
      // Leverage the exponentiation by squaring algorithm for a faster repeat.\n\
      // See http://en.wikipedia.org/wiki/Exponentiation_by_squaring.\n\
      do {\n\
        if (n % 2) {\n\
          result += string;\n\
        }\n\
        n = floor(n / 2);\n\
        string += string;\n\
      } while (n);\n\
\n\
      return result;\n\
    }\n\
\n\
    /**\n\
     * Converts `string` to snake case.\n\
     * See [Wikipedia](http://en.wikipedia.org/wiki/Snake_case) for more details.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category String\n\
     * @param {string} [string=''] The string to snake case.\n\
     * @returns {string} Returns the snake cased string.\n\
     * @example\n\
     *\n\
     * _.snakeCase('Hello world');\n\
     * // => 'hello_world'\n\
     *\n\
     * _.snakeCase('--hello-world');\n\
     * // => 'hello_world'\n\
     *\n\
     * _.snakeCase('helloWorld');\n\
     * // => 'hello_world'\n\
     */\n\
    var snakeCase = createCompounder(function(result, word, index) {\n\
      return result + (index ? '_' : '') + word.toLowerCase();\n\
    });\n\
\n\
    /**\n\
     * Checks if `string` starts with the given target string.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category String\n\
     * @param {string} [string=''] The string to search.\n\
     * @param {string} [target] The string to search for.\n\
     * @param {number} [position=0] The position to search from.\n\
     * @returns {boolean} Returns `true` if `string` starts with `target`, else `false`.\n\
     * @example\n\
     *\n\
     * _.startsWith('abc', 'a');\n\
     * // => true\n\
     *\n\
     * _.startsWith('abc', 'b');\n\
     * // => false\n\
     *\n\
     * _.startsWith('abc', 'b', 1);\n\
     * // => true\n\
     */\n\
    function startsWith(string, target, position) {\n\
      string = string == null ? '' : String(string);\n\
      position = typeof position == 'undefined' ? 0 : nativeMin(position < 0 ? 0 : (+position || 0), string.length);\n\
      return string.lastIndexOf(target, position) == position;\n\
    }\n\
\n\
    /**\n\
     * Creates a compiled template function that can interpolate data properties\n\
     * in \"interpolate\" delimiters, HTML-escape interpolated data properties in\n\
     * \"escape\" delimiters, and execute JavaScript in \"evaluate\" delimiters. Data\n\
     * properties may be accessed as free variables in the template. If a setting\n\
     * object is provided it takes precedence over `_.templateSettings` values.\n\
     *\n\
     * **Note:** In the development build `_.template` utilizes sourceURLs for easier debugging.\n\
     * See the [HTML5 Rocks article on sourcemaps](http://www.html5rocks.com/en/tutorials/developertools/sourcemaps/#toc-sourceurl)\n\
     * for more details.\n\
     *\n\
     * For more information on precompiling templates see\n\
     * [Lo-Dash's custom builds documentation](https://lodash.com/custom-builds).\n\
     *\n\
     * For more information on Chrome extension sandboxes see\n\
     * [Chrome's extensions documentation](http://developer.chrome.com/stable/extensions/sandboxingEval.html).\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category String\n\
     * @param {string} [string=''] The template string.\n\
     * @param {Object} [options] The options object.\n\
     * @param {RegExp} [options.escape] The HTML \"escape\" delimiter.\n\
     * @param {RegExp} [options.evaluate] The \"evaluate\" delimiter.\n\
     * @param {Object} [options.imports] An object to import into the template as free variables.\n\
     * @param {RegExp} [options.interpolate] The \"interpolate\" delimiter.\n\
     * @param {string} [options.sourceURL] The sourceURL of the template's compiled source.\n\
     * @param {string} [options.variable] The data object variable name.\n\
     * @param- {Object} [otherOptions] Enables the legacy `options` param signature.\n\
     * @returns {Function} Returns the compiled template function.\n\
     * @example\n\
     *\n\
     * // using the \"interpolate\" delimiter to create a compiled template\n\
     * var compiled = _.template('hello <%= user %>!');\n\
     * compiled({ 'user': 'fred' });\n\
     * // => 'hello fred!'\n\
     *\n\
     * // using the HTML \"escape\" delimiter to escape data property values\n\
     * var compiled = _.template('<b><%- value %></b>');\n\
     * compiled({ 'value': '<script>' });\n\
     * // => '<b>&lt;script&gt;</b>'\n\
     *\n\
     * // using the \"evaluate\" delimiter to execute JavaScript and generate HTML\n\
     * var compiled = _.template('<% _.forEach(users, function(user) { %><li><%- user %></li><% }); %>');\n\
     * compiled({ 'users': ['fred', 'barney'] });\n\
     * // => '<li>fred</li><li>barney</li>'\n\
     *\n\
     * // using the internal `print` function in \"evaluate\" delimiters\n\
     * var compiled = _.template('<% print(\"hello \" + user); %>!');\n\
     * compiled({ 'user': 'barney' });\n\
     * // => 'hello barney!'\n\
     *\n\
     * // using the ES6 delimiter as an alternative to the default \"interpolate\" delimiter\n\
     * var compiled = _.template('hello ${ user }!');\n\
     * compiled({ 'user': 'pebbles' });\n\
     * // => 'hello pebbles!'\n\
     *\n\
     * // using custom template delimiters\n\
     * _.templateSettings.interpolate = /{{([\\s\\S]+?)}}/g;\n\
     * var compiled = _.template('hello {{ user }}!');\n\
     * compiled({ 'user': 'mustache' });\n\
     * // => 'hello mustache!'\n\
     *\n\
     * // using backslashes to treat delimiters as plain text\n\
     * var compiled = _.template('<%= \"\\\\<%- value %\\\\>\" %>');\n\
     * compiled({ 'value': 'ignored' });\n\
     * // => '<%- value %>'\n\
     *\n\
     * // using the `imports` option to import `jQuery` as `jq`\n\
     * var text = '<% jq.each(users, function(user) { %><li><%- user %></li><% }); %>';\n\
     * var compiled = _.template(text, { 'imports': { 'jq': jQuery } });\n\
     * compiled({ 'users': ['fred', 'barney'] });\n\
     * // => '<li>fred</li><li>barney</li>'\n\
     *\n\
     * // using the `sourceURL` option to specify a custom sourceURL for the template\n\
     * var compiled = _.template('hello <%= user %>!', { 'sourceURL': '/basic/greeting.jst' });\n\
     * compiled(data);\n\
     * // => find the source of \"greeting.jst\" under the Sources tab or Resources panel of the web inspector\n\
     *\n\
     * // using the `variable` option to ensure a with-statement isn't used in the compiled template\n\
     * var compiled = _.template('hi <%= data.user %>!', { 'variable': 'data' });\n\
     * compiled.source;\n\
     * // => function(data) {\n\
     *   var __t, __p = '';\n\
     *   __p += 'hi ' + ((__t = ( data.user )) == null ? '' : __t) + '!';\n\
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
    function template(string, options, otherOptions) {\n\
      // Based on John Resig's `tmpl` implementation (http://ejohn.org/blog/javascript-micro-templating/)\n\
      // and Laura Doktorova's doT.js (https://github.com/olado/doT).\n\
      var settings = lodash.templateSettings;\n\
\n\
      if (otherOptions && isIterateeCall(string, options, otherOptions)) {\n\
        options = otherOptions = null;\n\
      }\n\
      string = String(string == null ? '' : string);\n\
      options = assign({}, otherOptions || options, settings, assignOwnDefaults);\n\
\n\
      var imports = assign({}, options.imports, settings.imports, assignOwnDefaults),\n\
          importsKeys = keys(imports),\n\
          importsValues = values(imports);\n\
\n\
      var isEscaping,\n\
          isEvaluating,\n\
          index = 0,\n\
          interpolate = options.interpolate || reNoMatch,\n\
          source = \"__p += '\";\n\
\n\
      // Compile the regexp to match each delimiter.\n\
      var reDelimiters = RegExp(\n\
        (options.escape || reNoMatch).source + '|' +\n\
        interpolate.source + '|' +\n\
        (interpolate === reInterpolate ? reEsTemplate : reNoMatch).source + '|' +\n\
        (options.evaluate || reNoMatch).source + '|$'\n\
      , 'g');\n\
\n\
      // Use a sourceURL for easier debugging.\n\
      // See http://www.html5rocks.com/en/tutorials/developertools/sourcemaps/#toc-sourceurl.\n\
      var sourceURL = 'sourceURL' in options ? options.sourceURL : ('/lodash/template/source[' + (++templateCounter) + ']');\n\
      sourceURL = sourceURL ? ('//# sourceURL=' + sourceURL + '\\n\
') : '';\n\
\n\
      string.replace(reDelimiters, function(match, escapeValue, interpolateValue, esTemplateValue, evaluateValue, offset) {\n\
        interpolateValue || (interpolateValue = esTemplateValue);\n\
\n\
        // Escape characters that can't be included in string literals.\n\
        source += string.slice(index, offset).replace(reUnescapedString, escapeStringChar);\n\
\n\
        // Replace delimiters with snippets.\n\
        if (escapeValue) {\n\
          isEscaping = true;\n\
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
        // The JS engine embedded in Adobe products requires returning the `match`\n\
        // string in order to produce the correct `offset` value.\n\
        return match;\n\
      });\n\
\n\
      source += \"';\\n\
\";\n\
\n\
      // If `variable` is not specified, wrap a with-statement around the generated\n\
      // code to add the data object to the top of the scope chain.\n\
      var variable = options.variable;\n\
      if (!variable) {\n\
        source = 'with (obj) {\\n\
' + source + '\\n\
}\\n\
';\n\
      }\n\
      // Cleanup code by stripping empty strings.\n\
      source = (isEvaluating ? source.replace(reEmptyStringLeading, '') : source)\n\
        .replace(reEmptyStringMiddle, '$1')\n\
        .replace(reEmptyStringTrailing, '$1;');\n\
\n\
      // Frame code as the function body.\n\
      source = 'function(' + (variable || 'obj') + ') {\\n\
' +\n\
        (variable\n\
          ? ''\n\
          : 'obj || (obj = {});\\n\
'\n\
        ) +\n\
        \"var __t, __p = ''\" +\n\
        (isEscaping\n\
           ? ', __e = _.escape'\n\
           : ''\n\
        ) +\n\
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
      var result = attempt(function() {\n\
        return Function(importsKeys, sourceURL + 'return ' + source).apply(undefined, importsValues);\n\
      });\n\
\n\
      // Provide the compiled function's source by its `toString` method or\n\
      // the `source` property as a convenience for inlining compiled templates.\n\
      result.source = source;\n\
      if (isError(result)) {\n\
        throw result;\n\
      }\n\
      return result;\n\
    }\n\
\n\
    /**\n\
     * Removes leading and trailing whitespace or specified characters from `string`.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category String\n\
     * @param {string} [string=''] The string to trim.\n\
     * @param {string} [chars=whitespace] The characters to trim.\n\
     * @param- {Object} [guard] Enables use as a callback for functions like `_.map`.\n\
     * @returns {string} Returns the trimmed string.\n\
     * @example\n\
     *\n\
     * _.trim('  fred  ');\n\
     * // => 'fred'\n\
     *\n\
     * _.trim('-_-fred-_-', '_-');\n\
     * // => 'fred'\n\
     */\n\
    function trim(string, chars, guard) {\n\
      string = string == null ? '' : String(string);\n\
      if (!string) {\n\
        return string;\n\
      }\n\
      if (guard ? isIterateeCall(string, chars, guard) : chars == null) {\n\
        return string.slice(trimmedLeftIndex(string), trimmedRightIndex(string) + 1);\n\
      }\n\
      chars = String(chars);\n\
      return string.slice(charsLeftIndex(string, chars), charsRightIndex(string, chars) + 1);\n\
    }\n\
\n\
    /**\n\
     * Removes leading whitespace or specified characters from `string`.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category String\n\
     * @param {string} [string=''] The string to trim.\n\
     * @param {string} [chars=whitespace] The characters to trim.\n\
     * @param- {Object} [guard] Enables use as a callback for functions like `_.map`.\n\
     * @returns {string} Returns the trimmed string.\n\
     * @example\n\
     *\n\
     * _.trimLeft('  fred  ');\n\
     * // => 'fred  '\n\
     *\n\
     * _.trimLeft('-_-fred-_-', '_-');\n\
     * // => 'fred-_-'\n\
     */\n\
    function trimLeft(string, chars, guard) {\n\
      string = string == null ? '' : String(string);\n\
      if (!string) {\n\
        return string;\n\
      }\n\
      if (guard ? isIterateeCall(string, chars, guard) : chars == null) {\n\
        return string.slice(trimmedLeftIndex(string))\n\
      }\n\
      chars = String(chars);\n\
      return string.slice(charsLeftIndex(string, chars));\n\
    }\n\
\n\
    /**\n\
     * Removes trailing whitespace or specified characters from `string`.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category String\n\
     * @param {string} [string=''] The string to trim.\n\
     * @param {string} [chars=whitespace] The characters to trim.\n\
     * @param- {Object} [guard] Enables use as a callback for functions like `_.map`.\n\
     * @returns {string} Returns the trimmed string.\n\
     * @example\n\
     *\n\
     * _.trimRight('  fred  ');\n\
     * // => '  fred'\n\
     *\n\
     * _.trimRight('-_-fred-_-', '_-');\n\
     * // => '-_-fred'\n\
     */\n\
    function trimRight(string, chars, guard) {\n\
      string = string == null ? '' : String(string);\n\
      if (!string) {\n\
        return string;\n\
      }\n\
      if (guard ? isIterateeCall(string, chars, guard) : chars == null) {\n\
        return string.slice(0, trimmedRightIndex(string) + 1)\n\
      }\n\
      chars = String(chars);\n\
      return string.slice(0, charsRightIndex(string, chars) + 1);\n\
    }\n\
\n\
    /**\n\
     * Truncates `string` if it is longer than the given maximum string length.\n\
     * The last characters of the truncated string are replaced with the omission\n\
     * string which defaults to \"...\".\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category String\n\
     * @param {string} [string=''] The string to truncate.\n\
     * @param {Object|number} [options] The options object or maximum string length.\n\
     * @param {number} [options.length=30] The maximum string length.\n\
     * @param {string} [options.omission='...'] The string to indicate text is omitted.\n\
     * @param {RegExp|string} [options.separator] The separator pattern to truncate to.\n\
     * @param- {Object} [guard] Enables use as a callback for functions like `_.map`.\n\
     * @returns {string} Returns the truncated string.\n\
     * @example\n\
     *\n\
     * _.trunc('hi-diddly-ho there, neighborino');\n\
     * // => 'hi-diddly-ho there, neighbo...'\n\
     *\n\
     * _.trunc('hi-diddly-ho there, neighborino', 24);\n\
     * // => 'hi-diddly-ho there, n...'\n\
     *\n\
     * _.trunc('hi-diddly-ho there, neighborino', { 'length': 24, 'separator': ' ' });\n\
     * // => 'hi-diddly-ho there,...'\n\
     *\n\
     * _.trunc('hi-diddly-ho there, neighborino', { 'length': 24, 'separator': /,? +/ });\n\
     * //=> 'hi-diddly-ho there...'\n\
     *\n\
     * _.trunc('hi-diddly-ho there, neighborino', { 'omission': ' [...]' });\n\
     * // => 'hi-diddly-ho there, neig [...]'\n\
     */\n\
    function trunc(string, options, guard) {\n\
      if (guard && isIterateeCall(string, options, guard)) {\n\
        options = null;\n\
      }\n\
      var length = DEFAULT_TRUNC_LENGTH,\n\
          omission = DEFAULT_TRUNC_OMISSION;\n\
\n\
      if (isObject(options)) {\n\
        var separator = 'separator' in options ? options.separator : separator;\n\
        length = 'length' in options ? +options.length || 0 : length;\n\
        omission = 'omission' in options ? String(options.omission) : omission;\n\
      }\n\
      else if (options != null) {\n\
        length = +options || 0;\n\
      }\n\
      string = string == null ? '' : String(string);\n\
      if (length >= string.length) {\n\
        return string;\n\
      }\n\
      var end = length - omission.length;\n\
      if (end < 1) {\n\
        return omission;\n\
      }\n\
      var result = string.slice(0, end);\n\
      if (separator == null) {\n\
        return result + omission;\n\
      }\n\
      if (isRegExp(separator)) {\n\
        if (string.slice(end).search(separator)) {\n\
          var match,\n\
              newEnd,\n\
              substring = string.slice(0, end);\n\
\n\
          if (!separator.global) {\n\
            separator = RegExp(separator.source, (reFlags.exec(separator) || '') + 'g');\n\
          }\n\
          separator.lastIndex = 0;\n\
          while ((match = separator.exec(substring))) {\n\
            newEnd = match.index;\n\
          }\n\
          result = result.slice(0, newEnd == null ? end : newEnd);\n\
        }\n\
      } else if (string.indexOf(separator, end) != end) {\n\
        var index = result.lastIndexOf(separator);\n\
        if (index > -1) {\n\
          result = result.slice(0, index);\n\
        }\n\
      }\n\
      return result + omission;\n\
    }\n\
\n\
    /**\n\
     * The inverse of `_.escape`; this method converts the HTML entities\n\
     * `&amp;`, `&lt;`, `&gt;`, `&quot;`, `&#39;`, and `&#96;` in `string` to their\n\
     * corresponding characters.\n\
     *\n\
     * **Note:** No other HTML entities are unescaped. To unescape additional HTML\n\
     * entities use a third-party library like [_he_](http://mths.be/he).\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category String\n\
     * @param {string} [string=''] The string to unescape.\n\
     * @returns {string} Returns the unescaped string.\n\
     * @example\n\
     *\n\
     * _.unescape('fred, barney, &amp; pebbles');\n\
     * // => 'fred, barney, & pebbles'\n\
     */\n\
    function unescape(string) {\n\
      string = string == null ? '' : String(string);\n\
      return string && (reEscapedHtml.lastIndex = 0, reEscapedHtml.test(string))\n\
        ? string.replace(reEscapedHtml, unescapeHtmlChar)\n\
        : string;\n\
    }\n\
\n\
    /**\n\
     * Splits `string` into an array of its words.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category String\n\
     * @param {string} [string=''] The string to inspect.\n\
     * @param {RegExp|string} [pattern] The pattern to match words.\n\
     * @param- {Object} [guard] Enables use as a callback for functions like `_.map`.\n\
     * @returns {Array} Returns the words of `string`.\n\
     * @example\n\
     *\n\
     * _.words('fred, barney, & pebbles');\n\
     * // => ['fred', 'barney', 'pebbles']\n\
     *\n\
     * _.words('fred, barney, & pebbles', /[^, ]+/g);\n\
     * // => ['fred', 'barney', '&', 'pebbles']\n\
     */\n\
    function words(string, pattern, guard) {\n\
      string = string != null && String(string);\n\
      if (guard && isIterateeCall(string, pattern, guard)) {\n\
        pattern = null;\n\
      }\n\
      return (string && string.match(pattern || reWords)) || [];\n\
    }\n\
\n\
    /*------------------------------------------------------------------------*/\n\
\n\
    /**\n\
     * Attempts to invoke `func`, returning either the result or the caught\n\
     * error object.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Utility\n\
     * @param {*} func The function to attempt.\n\
     * @returns {*} Returns the `func` result or error object.\n\
     * @example\n\
     *\n\
     * // avoid throwing errors for invalid selectors\n\
     * var elements = _.attempt(function() {\n\
     *   return document.querySelectorAll(selector);\n\
     * });\n\
     *\n\
     * if (_.isError(elements)) {\n\
     *   elements = [];\n\
     * }\n\
     */\n\
    function attempt(func) {\n\
      try {\n\
        return func();\n\
      } catch(e) {\n\
        return isError(e) ? e : Error(e);\n\
      }\n\
    }\n\
\n\
    /**\n\
     * Creates a function bound to an optional `thisArg`. If `func` is a property\n\
     * name the created callback returns the property value for a given element.\n\
     * If `func` is an object the created callback returns `true` for elements\n\
     * that contain the equivalent object properties, otherwise it returns `false`.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @alias iteratee\n\
     * @category Utility\n\
     * @param {*} [func=_.identity] The value to convert to a callback.\n\
     * @param {*} [thisArg] The `this` binding of the created callback.\n\
     * @param- {Object} [guard] Enables use as a callback for functions like `_.map`.\n\
     * @returns {Function} Returns the new function.\n\
     * @example\n\
     *\n\
     * var users = [\n\
     *   { 'user': 'barney', 'age': 36 },\n\
     *   { 'user': 'fred',   'age': 40 }\n\
     * ];\n\
     *\n\
     * // wrap to create custom callback shorthands\n\
     * _.callback = _.wrap(_.callback, function(callback, func, thisArg) {\n\
     *   var match = /^(.+?)__([gl]t)(.+)$/.exec(func);\n\
     *   if (!match) {\n\
     *     return callback(func, thisArg);\n\
     *   }\n\
     *   return function(object) {\n\
     *     return match[2] == 'gt' ? object[match[1]] > match[3] : object[match[1]] < match[3];\n\
     *   };\n\
     * });\n\
     *\n\
     * _.filter(users, 'age__gt36');\n\
     * // => [{ 'user': 'fred', 'age': 40 }]\n\
     */\n\
    function callback(func, thisArg, guard) {\n\
      if (guard && isIterateeCall(func, thisArg, guard)) {\n\
        thisArg = null;\n\
      }\n\
      return baseCallback(func, thisArg);\n\
    }\n\
\n\
    /**\n\
     * Creates a function that returns `value`.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Utility\n\
     * @param {*} value The value to return from the new function.\n\
     * @returns {Function} Returns the new function.\n\
     * @example\n\
     *\n\
     * var object = { 'user': 'fred' };\n\
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
     * This method returns the first argument provided to it.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Utility\n\
     * @param {*} value Any value.\n\
     * @returns {*} Returns `value`.\n\
     * @example\n\
     *\n\
     * var object = { 'user': 'fred' };\n\
     * _.identity(object) === object;\n\
     * // => true\n\
     */\n\
    function identity(value) {\n\
      return value;\n\
    }\n\
\n\
    /**\n\
     * Creates a \"_.where\" style predicate function which performs a deep comparison\n\
     * between a given object and the `source` object, returning `true` if the given\n\
     * object has equivalent property values, else `false`.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Utility\n\
     * @param {Object} source The object of property values to match.\n\
     * @returns {Function} Returns the new function.\n\
     * @example\n\
     *\n\
     * var users = [\n\
     *   { 'user': 'fred',   'age': 40 },\n\
     *   { 'user': 'barney', 'age': 36 }\n\
     * ];\n\
     *\n\
     * var matchesAge = _.matches({ 'age': 36 });\n\
     *\n\
     * _.filter(users, matchesAge);\n\
     * // => [{ 'user': 'barney', 'age': 36 }]\n\
     *\n\
     * _.find(users, matchesAge);\n\
     * // => { 'user': 'barney', 'age': 36 }\n\
     */\n\
    function matches(source) {\n\
      var props = keys(source),\n\
          length = props.length;\n\
\n\
      if (length == 1) {\n\
        var key = props[0],\n\
            value = source[key];\n\
\n\
        if (isStrictComparable(value)) {\n\
          return function(object) {\n\
            return object != null && value === object[key] && hasOwnProperty.call(object, key);\n\
          };\n\
        }\n\
      }\n\
      var index = length,\n\
          values = Array(length),\n\
          strictCompareFlags = Array(length);\n\
\n\
      while (index--) {\n\
        value = source[props[index]];\n\
        var isStrict = isStrictComparable(value);\n\
\n\
        values[index] = isStrict ? value : baseClone(value, true, clonePassthru);\n\
        strictCompareFlags[index] = isStrict;\n\
      }\n\
      return function(object) {\n\
        index = length;\n\
        if (object == null) {\n\
          return !index;\n\
        }\n\
        while (index--) {\n\
          if (strictCompareFlags[index]\n\
                ? values[index] !== object[props[index]]\n\
                : !hasOwnProperty.call(object, props[index])\n\
              ) {\n\
            return false;\n\
          }\n\
        }\n\
        index = length;\n\
        while (index--) {\n\
          if (strictCompareFlags[index]\n\
                ? !hasOwnProperty.call(object, props[index])\n\
                : !baseIsEqual(values[index], object[props[index]], null, true)\n\
              ) {\n\
            return false;\n\
          }\n\
        }\n\
        return true;\n\
      };\n\
    }\n\
\n\
    /**\n\
     * Adds all own enumerable function properties of a source object to the\n\
     * destination object. If `object` is a function then methods are added to\n\
     * its prototype as well.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Utility\n\
     * @param {Function|Object} [object=this] object The destination object.\n\
     * @param {Object} source The object of functions to add.\n\
     * @param {Object} [options] The options object.\n\
     * @param {boolean} [options.chain=true] Specify whether the functions added\n\
     *  are chainable.\n\
     * @returns {Function|Object} Returns `object`.\n\
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
          isObj = isObject(source),\n\
          noOpts = options == null,\n\
          props = noOpts && isObj && keys(source),\n\
          methodNames = props && baseFunctions(source, props);\n\
\n\
      if ((props && props.length && !methodNames.length) || (noOpts && !isObj)) {\n\
        if (noOpts) {\n\
          options = source;\n\
        }\n\
        methodNames = false;\n\
        source = object;\n\
        object = this;\n\
      }\n\
      methodNames || (methodNames = baseFunctions(source, keys(source)));\n\
      if (options === false) {\n\
        chain = false;\n\
      } else if (isObject(options) && 'chain' in options) {\n\
        chain = options.chain;\n\
      }\n\
      var index = -1,\n\
          isFunc = isFunction(object),\n\
          length = methodNames.length;\n\
\n\
      while (++index < length) {\n\
        var methodName = methodNames[index];\n\
        object[methodName] = source[methodName];\n\
        if (isFunc) {\n\
          object.prototype[methodName] = (function(methodName) {\n\
            return function() {\n\
              var chainAll = this.__chain__;\n\
              if (chain || chainAll) {\n\
                var result = object(this.__wrapped__);\n\
                (result.__actions__ = baseSlice(this.__actions__)).push({ 'args': arguments, 'object': object, 'name': methodName });\n\
                result.__chain__ = chainAll;\n\
                return result;\n\
              }\n\
              var args = [this.value()];\n\
              push.apply(args, arguments);\n\
              return object[methodName].apply(object, args);\n\
            };\n\
          }(methodName));\n\
        }\n\
      }\n\
      return object;\n\
    }\n\
\n\
    /**\n\
     * Reverts the `_` variable to its previous value and returns a reference to\n\
     * the `lodash` function.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Utility\n\
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
     * @category Utility\n\
     * @example\n\
     *\n\
     * var object = { 'user': 'fred' };\n\
     * _.noop(object) === undefined;\n\
     * // => true\n\
     */\n\
    function noop() {\n\
      // No operation performed.\n\
    }\n\
\n\
    /**\n\
     * Gets the number of milliseconds that have elapsed since the Unix epoch\n\
     * (1 January 1970 00:00:00 UTC).\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Utility\n\
     * @example\n\
     *\n\
     * _.defer(function(stamp) { console.log(_.now() - stamp); }, _.now());\n\
     * // => logs the number of milliseconds it took for the deferred function to be invoked\n\
     */\n\
    var now = nativeNow || function() {\n\
      return new Date().getTime();\n\
    };\n\
\n\
    /**\n\
     * Converts `value` to an integer of the specified radix. If `radix` is\n\
     * `undefined` or `0`, a `radix` of `10` is used unless `value` is a hexadecimal,\n\
     * in which case a `radix` of `16` is used.\n\
     *\n\
     * **Note:** This method aligns with the ES5 implementation of `parseInt`.\n\
     * See the [ES5 spec](http://es5.github.io/#E) for more details.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Utility\n\
     * @param {string} value The value to parse.\n\
     * @param {number} [radix] The radix to interpret `value` by.\n\
     * @param- {Object} [guard] Enables use as a callback for functions like `_.map`.\n\
     * @returns {number} Returns the converted integer.\n\
     * @example\n\
     *\n\
     * _.parseInt('08');\n\
     * // => 8\n\
     */\n\
    function parseInt(value, radix, guard) {\n\
      if (guard && isIterateeCall(value, radix, guard)) {\n\
        radix = 0;\n\
      }\n\
      return nativeParseInt(value, radix);\n\
    }\n\
    // Fallback for environments with pre-ES5 implementations.\n\
    if (nativeParseInt(whitespace + '08') != 8) {\n\
      parseInt = function(value, radix, guard) {\n\
        // Firefox < 21 and Opera < 15 follow ES3 for `parseInt` and\n\
        // Chrome fails to trim leading <BOM> whitespace characters.\n\
        // See https://code.google.com/p/v8/issues/detail?id=3109.\n\
        value = trim(value);\n\
        radix = (guard && isIterateeCall(value, radix, guard)) ? 0 : +radix;\n\
        return nativeParseInt(value, radix || (reHexPrefix.test(value) ? 16 : 10));\n\
      };\n\
    }\n\
\n\
    /**\n\
     * Creates a \"_.pluck\" style function which returns the property value\n\
     * of `key` on a given object.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Utility\n\
     * @param {string} key The name of the property to retrieve.\n\
     * @returns {Function} Returns the new function.\n\
     * @example\n\
     *\n\
     * var users = [\n\
     *   { 'user': 'fred' },\n\
     *   { 'user': 'barney' }\n\
     * ];\n\
     *\n\
     * var getName = _.property('user');\n\
     *\n\
     * _.map(users, getName);\n\
     * // => ['fred', barney']\n\
     *\n\
     * _.pluck(_.sortBy(users, getName), 'user');\n\
     * // => ['barney', 'fred']\n\
     */\n\
    function property(key) {\n\
      key = String(key);\n\
      return function(object) {\n\
        return object == null ? undefined : object[key];\n\
      };\n\
    }\n\
\n\
    /**\n\
     * The inverse of `_.property`; this method creates a function which returns\n\
     * the property value of a given key on `object`.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Utility\n\
     * @param {Object} object The object to inspect.\n\
     * @returns {Function} Returns the new function.\n\
     * @example\n\
     *\n\
     * var object = { 'user': 'fred', 'age': 40, 'active': true };\n\
     * _.map(['active', 'user'], _.propertyOf(object));\n\
     * // => [true, 'fred']\n\
     *\n\
     * var object = { 'a': 3, 'b': 1, 'c': 2 };\n\
     * _.sortBy(['a', 'b', 'c'], _.propertyOf(object));\n\
     * // => ['b', 'c', 'a']\n\
     */\n\
    function propertyOf(object) {\n\
      return function(key) {\n\
        return object == null ? undefined : object[key];\n\
      };\n\
    }\n\
\n\
    /**\n\
     * Produces a random number between `min` and `max` (inclusive). If only one\n\
     * argument is provided a number between `0` and the given number is returned.\n\
     * If `floating` is `true`, or either `min` or `max` are floats, a floating-point\n\
     * number is returned instead of an integer.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Utility\n\
     * @param {number} [min=0] The minimum possible value.\n\
     * @param {number} [max=1] The maximum possible value.\n\
     * @param {boolean} [floating=false] Specify returning a floating-point number.\n\
     * @returns {number} Returns the random number.\n\
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
      if (floating && isIterateeCall(min, max, floating)) {\n\
        max = floating = null;\n\
      }\n\
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
        return nativeMin(min + (rand * (max - min + parseFloat('1e-' + (String(rand).length - 1)))), max);\n\
      }\n\
      return baseRandom(min, max);\n\
    }\n\
\n\
    /**\n\
     * Creates an array of numbers (positive and/or negative) progressing from\n\
     * `start` up to, but not including, `end`. If `start` is less than `end` a\n\
     * zero-length range is created unless a negative `step` is specified.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Utility\n\
     * @param {number} [start=0] The start of the range.\n\
     * @param {number} end The end of the range.\n\
     * @param {number} [step=1] The value to increment or decrement by.\n\
     * @returns {Array} Returns the new array of numbers.\n\
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
      if (step && isIterateeCall(start, end, step)) {\n\
        end = step = null;\n\
      }\n\
      start = +start || 0;\n\
      step = step == null ? 1 : (+step || 0);\n\
\n\
      if (end == null) {\n\
        end = start;\n\
        start = 0;\n\
      } else {\n\
        end = +end || 0;\n\
      }\n\
      // Use `Array(length)` so engines like Chakra and V8 avoid slower modes.\n\
      // See http://youtu.be/XAqIpGU8ZZk#t=17m25s.\n\
      var index = -1,\n\
          length = nativeMax(ceil((end - start) / (step || 1)), 0),\n\
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
     * Resolves the value of property `key` on `object`. If `key` is a function\n\
     * it is invoked with the `this` binding of `object` and its result returned,\n\
     * else the property value is returned. If `object` is `null` or `undefined`\n\
     * then `undefined` is returned. If a default value is provided it is returned\n\
     * if the property value resolves to `undefined`.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Utility\n\
     * @param {Object} object The object to inspect.\n\
     * @param {string} key The name of the property to resolve.\n\
     * @param {*} [defaultValue] The value returned if the property value\n\
     *  resolves to `undefined`.\n\
     * @returns {*} Returns the resolved value.\n\
     * @example\n\
     *\n\
     * var object = {\n\
     *   'user': 'fred',\n\
     *   'age': function() {\n\
     *     return 40;\n\
     *   }\n\
     * };\n\
     *\n\
     * _.result(object, 'user');\n\
     * // => 'fred'\n\
     *\n\
     * _.result(object, 'age');\n\
     * // => 40\n\
     *\n\
     * _.result(object, 'status', 'busy');\n\
     * // => 'busy'\n\
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
     * Invokes the iteratee function `n` times, returning an array of the results\n\
     * of each invocation. The `iteratee` is bound to `thisArg` and invoked with\n\
     * one argument; (index).\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Utility\n\
     * @param {number} n The number of times to invoke `iteratee`.\n\
     * @param {Function} [iteratee=_.identity] The function invoked per iteration.\n\
     * @param {*} [thisArg] The `this` binding of `iteratee`.\n\
     * @returns {Array} Returns the array of results.\n\
     * @example\n\
     *\n\
     * var diceRolls = _.times(3, _.partial(_.random, 1, 6, false));\n\
     * // => [3, 6, 4]\n\
     *\n\
     * _.times(3, function(n) { mage.castSpell(n); });\n\
     * // => invokes `mage.castSpell(n)` three times with `n` of `0`, `1`, and `2` respectively\n\
     *\n\
     * _.times(3, function(n) { this.cast(n); }, mage);\n\
     * // => also invokes `mage.castSpell(n)` three times\n\
     */\n\
    function times(n, iteratee, thisArg) {\n\
      n = +n;\n\
\n\
      // Exit early to avoid a JSC JIT bug in Safari 8\n\
      // where `Array(0)` is treated as `Array(1)`.\n\
      if (n < 1 || !nativeIsFinite(n)) {\n\
        return [];\n\
      }\n\
      iteratee = baseCallback(iteratee, thisArg, 1);\n\
\n\
      var index = -1,\n\
          result = Array(nativeMin(n, MAX_ARRAY_LENGTH));\n\
\n\
      while (++index < n) {\n\
        if (index < MAX_ARRAY_LENGTH) {\n\
          result[index] = iteratee(index);\n\
        } else {\n\
          iteratee(index);\n\
        }\n\
      }\n\
      return result;\n\
    }\n\
\n\
    /**\n\
     * Generates a unique ID. If `prefix` is provided the ID is appended to it.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @category Utility\n\
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
    /*------------------------------------------------------------------------*/\n\
\n\
    // Ensure `new LodashWrapper` is an instance of `lodash`.\n\
    LodashWrapper.prototype = lodash.prototype;\n\
\n\
    // Add functions to the `Map` cache.\n\
    MapCache.prototype['delete'] = mapDelete;\n\
    MapCache.prototype.get = mapGet;\n\
    MapCache.prototype.has = mapHas;\n\
    MapCache.prototype.set = mapSet;\n\
\n\
    // Add functions to the `Set` cache.\n\
    SetCache.prototype.push = cachePush;\n\
\n\
    // Assign cache to `_.memoize`.\n\
    memoize.Cache = MapCache;\n\
\n\
    // Add functions that return wrapped values when chaining.\n\
    lodash.after = after;\n\
    lodash.ary = ary;\n\
    lodash.assign = assign;\n\
    lodash.at = at;\n\
    lodash.before = before;\n\
    lodash.bind = bind;\n\
    lodash.bindAll = bindAll;\n\
    lodash.bindKey = bindKey;\n\
    lodash.callback = callback;\n\
    lodash.chain = chain;\n\
    lodash.chunk = chunk;\n\
    lodash.compact = compact;\n\
    lodash.constant = constant;\n\
    lodash.countBy = countBy;\n\
    lodash.create = create;\n\
    lodash.curry = curry;\n\
    lodash.curryRight = curryRight;\n\
    lodash.debounce = debounce;\n\
    lodash.defaults = defaults;\n\
    lodash.defer = defer;\n\
    lodash.delay = delay;\n\
    lodash.difference = difference;\n\
    lodash.drop = drop;\n\
    lodash.dropRight = dropRight;\n\
    lodash.dropRightWhile = dropRightWhile;\n\
    lodash.dropWhile = dropWhile;\n\
    lodash.filter = filter;\n\
    lodash.flatten = flatten;\n\
    lodash.flattenDeep = flattenDeep;\n\
    lodash.flow = flow;\n\
    lodash.flowRight = flowRight;\n\
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
    lodash.keysIn = keysIn;\n\
    lodash.map = map;\n\
    lodash.mapValues = mapValues;\n\
    lodash.matches = matches;\n\
    lodash.memoize = memoize;\n\
    lodash.merge = merge;\n\
    lodash.mixin = mixin;\n\
    lodash.negate = negate;\n\
    lodash.omit = omit;\n\
    lodash.once = once;\n\
    lodash.pairs = pairs;\n\
    lodash.partial = partial;\n\
    lodash.partialRight = partialRight;\n\
    lodash.partition = partition;\n\
    lodash.pick = pick;\n\
    lodash.pluck = pluck;\n\
    lodash.property = property;\n\
    lodash.propertyOf = propertyOf;\n\
    lodash.pull = pull;\n\
    lodash.pullAt = pullAt;\n\
    lodash.range = range;\n\
    lodash.rearg = rearg;\n\
    lodash.reject = reject;\n\
    lodash.remove = remove;\n\
    lodash.rest = rest;\n\
    lodash.shuffle = shuffle;\n\
    lodash.slice = slice;\n\
    lodash.sortBy = sortBy;\n\
    lodash.sortByAll = sortByAll;\n\
    lodash.take = take;\n\
    lodash.takeRight = takeRight;\n\
    lodash.takeRightWhile = takeRightWhile;\n\
    lodash.takeWhile = takeWhile;\n\
    lodash.tap = tap;\n\
    lodash.throttle = throttle;\n\
    lodash.thru = thru;\n\
    lodash.times = times;\n\
    lodash.toArray = toArray;\n\
    lodash.transform = transform;\n\
    lodash.union = union;\n\
    lodash.uniq = uniq;\n\
    lodash.unzip = unzip;\n\
    lodash.values = values;\n\
    lodash.valuesIn = valuesIn;\n\
    lodash.where = where;\n\
    lodash.without = without;\n\
    lodash.wrap = wrap;\n\
    lodash.xor = xor;\n\
    lodash.zip = zip;\n\
    lodash.zipObject = zipObject;\n\
\n\
    // Add aliases.\n\
    lodash.backflow = flowRight;\n\
    lodash.collect = map;\n\
    lodash.compose = flowRight;\n\
    lodash.each = forEach;\n\
    lodash.eachRight = forEachRight;\n\
    lodash.extend = assign;\n\
    lodash.iteratee = callback;\n\
    lodash.methods = functions;\n\
    lodash.object = zipObject;\n\
    lodash.select = filter;\n\
    lodash.tail = rest;\n\
    lodash.unique = uniq;\n\
\n\
    // Add functions to `lodash.prototype`.\n\
    mixin(lodash, lodash);\n\
\n\
    /*------------------------------------------------------------------------*/\n\
\n\
    // Add functions that return unwrapped values when chaining.\n\
    lodash.attempt = attempt;\n\
    lodash.camelCase = camelCase;\n\
    lodash.capitalize = capitalize;\n\
    lodash.clone = clone;\n\
    lodash.cloneDeep = cloneDeep;\n\
    lodash.deburr = deburr;\n\
    lodash.endsWith = endsWith;\n\
    lodash.escape = escape;\n\
    lodash.escapeRegExp = escapeRegExp;\n\
    lodash.every = every;\n\
    lodash.find = find;\n\
    lodash.findIndex = findIndex;\n\
    lodash.findKey = findKey;\n\
    lodash.findLast = findLast;\n\
    lodash.findLastIndex = findLastIndex;\n\
    lodash.findLastKey = findLastKey;\n\
    lodash.findWhere = findWhere;\n\
    lodash.first = first;\n\
    lodash.has = has;\n\
    lodash.identity = identity;\n\
    lodash.includes = includes;\n\
    lodash.indexOf = indexOf;\n\
    lodash.isArguments = isArguments;\n\
    lodash.isArray = isArray;\n\
    lodash.isBoolean = isBoolean;\n\
    lodash.isDate = isDate;\n\
    lodash.isElement = isElement;\n\
    lodash.isEmpty = isEmpty;\n\
    lodash.isEqual = isEqual;\n\
    lodash.isError = isError;\n\
    lodash.isFinite = isFinite;\n\
    lodash.isFunction = isFunction;\n\
    lodash.isNaN = isNaN;\n\
    lodash.isNative = isNative;\n\
    lodash.isNull = isNull;\n\
    lodash.isNumber = isNumber;\n\
    lodash.isObject = isObject;\n\
    lodash.isPlainObject = isPlainObject;\n\
    lodash.isRegExp = isRegExp;\n\
    lodash.isString = isString;\n\
    lodash.isUndefined = isUndefined;\n\
    lodash.kebabCase = kebabCase;\n\
    lodash.last = last;\n\
    lodash.lastIndexOf = lastIndexOf;\n\
    lodash.max = max;\n\
    lodash.min = min;\n\
    lodash.noConflict = noConflict;\n\
    lodash.noop = noop;\n\
    lodash.now = now;\n\
    lodash.pad = pad;\n\
    lodash.padLeft = padLeft;\n\
    lodash.padRight = padRight;\n\
    lodash.parseInt = parseInt;\n\
    lodash.random = random;\n\
    lodash.reduce = reduce;\n\
    lodash.reduceRight = reduceRight;\n\
    lodash.repeat = repeat;\n\
    lodash.result = result;\n\
    lodash.runInContext = runInContext;\n\
    lodash.size = size;\n\
    lodash.snakeCase = snakeCase;\n\
    lodash.some = some;\n\
    lodash.sortedIndex = sortedIndex;\n\
    lodash.sortedLastIndex = sortedLastIndex;\n\
    lodash.startsWith = startsWith;\n\
    lodash.template = template;\n\
    lodash.trim = trim;\n\
    lodash.trimLeft = trimLeft;\n\
    lodash.trimRight = trimRight;\n\
    lodash.trunc = trunc;\n\
    lodash.unescape = unescape;\n\
    lodash.uniqueId = uniqueId;\n\
    lodash.words = words;\n\
\n\
    // Add aliases.\n\
    lodash.all = every;\n\
    lodash.any = some;\n\
    lodash.contains = includes;\n\
    lodash.detect = find;\n\
    lodash.foldl = reduce;\n\
    lodash.foldr = reduceRight;\n\
    lodash.head = first;\n\
    lodash.include = includes;\n\
    lodash.inject = reduce;\n\
\n\
    mixin(lodash, (function() {\n\
      var source = {};\n\
      baseForOwn(lodash, function(func, methodName) {\n\
        if (!lodash.prototype[methodName]) {\n\
          source[methodName] = func;\n\
        }\n\
      });\n\
      return source;\n\
    }()), false);\n\
\n\
    /*------------------------------------------------------------------------*/\n\
\n\
    // Add functions capable of returning wrapped and unwrapped values when chaining.\n\
    lodash.sample = sample;\n\
\n\
    lodash.prototype.sample = function(n) {\n\
      if (!this.__chain__ && n == null) {\n\
        return lodash.sample(this.value());\n\
      }\n\
      return this.thru(function(value) {\n\
        return lodash.sample(value, n);\n\
      });\n\
    };\n\
\n\
    /*------------------------------------------------------------------------*/\n\
\n\
    /**\n\
     * The semantic version number.\n\
     *\n\
     * @static\n\
     * @memberOf _\n\
     * @type string\n\
     */\n\
    lodash.VERSION = VERSION;\n\
\n\
    // Assign default placeholders.\n\
    arrayEach(['bind', 'bindKey', 'curry', 'curryRight', 'partial', 'partialRight'], function(methodName) {\n\
      lodash[methodName].placeholder = lodash;\n\
    });\n\
\n\
    // Add `LazyWrapper` methods that accept an `iteratee` value.\n\
    arrayEach(['filter', 'map', 'takeWhile'], function(methodName, index) {\n\
      var isFilter = index == LAZY_FILTER_FLAG;\n\
\n\
      LazyWrapper.prototype[methodName] = function(iteratee, thisArg) {\n\
        iteratee = getCallback(iteratee, thisArg, 3);\n\
\n\
        var result = this.clone(),\n\
            filtered = result.filtered,\n\
            iteratees = result.iteratees || (result.iteratees = []);\n\
\n\
        result.filtered = filtered || isFilter || (index == LAZY_WHILE_FLAG && result.dir < 0);\n\
        iteratees.push({ 'iteratee': iteratee, 'type': index });\n\
        return result;\n\
      };\n\
    });\n\
\n\
    // Add `LazyWrapper` methods for `_.drop` and `_.take` variants.\n\
    arrayEach(['drop', 'take'], function(methodName, index) {\n\
      var countName = methodName + 'Count',\n\
          whileName = methodName + 'While';\n\
\n\
      LazyWrapper.prototype[methodName] = function(n) {\n\
        n = n == null ? 1 : nativeMax(+n || 0, 0);\n\
\n\
        var result = this.clone();\n\
        if (result.filtered) {\n\
          var value = result[countName];\n\
          result[countName] = index ? nativeMin(value, n) : (value + n);\n\
        } else {\n\
          var views = result.views || (result.views = []);\n\
          views.push({ 'size': n, 'type': methodName + (result.dir < 0 ? 'Right' : '') });\n\
        }\n\
        return result;\n\
      };\n\
\n\
      LazyWrapper.prototype[methodName + 'Right'] = function(n) {\n\
        return this.reverse()[methodName](n).reverse();\n\
      };\n\
\n\
      LazyWrapper.prototype[methodName + 'RightWhile'] = function(predicate, thisArg) {\n\
        return this.reverse()[whileName](predicate, thisArg).reverse();\n\
      };\n\
    });\n\
\n\
    // Add `LazyWrapper` methods for `_.first` and `_.last`.\n\
    arrayEach(['first', 'last'], function(methodName, index) {\n\
      var takeName = 'take' + (index ? 'Right': '');\n\
\n\
      LazyWrapper.prototype[methodName] = function() {\n\
        return this[takeName](1).value()[0];\n\
      };\n\
    });\n\
\n\
    // Add `LazyWrapper` methods for `_.initial` and `_.rest`.\n\
    arrayEach(['initial', 'rest'], function(methodName, index) {\n\
      var dropName = 'drop' + (index ? '' : 'Right');\n\
\n\
      LazyWrapper.prototype[methodName] = function() {\n\
        return this[dropName](1);\n\
      };\n\
    });\n\
\n\
    // Add `LazyWrapper` methods for `_.pluck` and `_.where`.\n\
    arrayEach(['pluck', 'where'], function(methodName, index) {\n\
      var operationName = index ? 'filter' : 'map',\n\
          createCallback = index ? matches : property;\n\
\n\
      LazyWrapper.prototype[methodName] = function(value) {\n\
        return this[operationName](createCallback(value));\n\
      };\n\
    });\n\
\n\
    LazyWrapper.prototype.dropWhile = function(iteratee, thisArg) {\n\
      iteratee = getCallback(iteratee, thisArg, 3);\n\
\n\
      var done,\n\
          lastIndex,\n\
          isRight = this.dir < 0;\n\
\n\
      return this.filter(function(value, index, array) {\n\
        done = done && (isRight ? index < lastIndex : index > lastIndex);\n\
        lastIndex = index;\n\
        return done || (done = !iteratee(value, index, array));\n\
      });\n\
    };\n\
\n\
    LazyWrapper.prototype.reject = function(iteratee, thisArg) {\n\
      iteratee = getCallback(iteratee, thisArg, 3);\n\
\n\
      return this.filter(function(value, index, array) {\n\
        return !iteratee(value, index, array);\n\
      });\n\
    };\n\
\n\
    LazyWrapper.prototype.slice = function(start, end) {\n\
      start = start == null ? 0 : (+start || 0);\n\
      var result = start < 0 ? this.takeRight(-start) : this.drop(start);\n\
\n\
      if (typeof end != 'undefined') {\n\
        end = (+end || 0);\n\
        result = end < 0 ? result.dropRight(-end) : result.take(end - start);\n\
      }\n\
      return result;\n\
    };\n\
\n\
    // Add `LazyWrapper` methods to `lodash.prototype`.\n\
    baseForOwn(LazyWrapper.prototype, function(func, methodName) {\n\
      var retUnwrapped = /^(?:first|last)$/.test(methodName);\n\
\n\
      lodash.prototype[methodName] = function() {\n\
        var value = this.__wrapped__,\n\
            args = arguments,\n\
            chainAll = this.__chain__,\n\
            isHybrid = !!this.__actions__.length,\n\
            isLazy = value instanceof LazyWrapper,\n\
            onlyLazy = isLazy && !isHybrid;\n\
\n\
        if (retUnwrapped && !chainAll) {\n\
          return onlyLazy\n\
            ? func.call(value)\n\
            : lodash[methodName](this.value());\n\
        }\n\
        var interceptor = function(value) {\n\
          var otherArgs = [value];\n\
          push.apply(otherArgs, args);\n\
          return lodash[methodName].apply(lodash, otherArgs);\n\
        };\n\
        if (isLazy || isArray(value)) {\n\
          var wrapper = onlyLazy ? value : new LazyWrapper(this),\n\
              result = func.apply(wrapper, args);\n\
\n\
          if (!retUnwrapped && (isHybrid || result.actions)) {\n\
            var actions = result.actions || (result.actions = []);\n\
            actions.push({ 'args': [interceptor], 'object': lodash, 'name': 'thru' });\n\
          }\n\
          return new LodashWrapper(result, chainAll);\n\
        }\n\
        return this.thru(interceptor);\n\
      };\n\
    });\n\
\n\
    // Add `Array.prototype` functions to `lodash.prototype`.\n\
    arrayEach(['concat', 'join', 'pop', 'push', 'shift', 'sort', 'splice', 'unshift'], function(methodName) {\n\
      var arrayFunc = arrayProto[methodName],\n\
          chainName = /^(?:push|sort|unshift)$/.test(methodName) ? 'tap' : 'thru',\n\
          fixObjects = !support.spliceObjects && /^(?:pop|shift|splice)$/.test(methodName),\n\
          retUnwrapped = /^(?:join|pop|shift)$/.test(methodName);\n\
\n\
      // Avoid array-like object bugs with `Array#shift` and `Array#splice` in\n\
      // IE < 9, Firefox < 10, Narwhal, and RingoJS.\n\
      var func = !fixObjects ? arrayFunc : function() {\n\
        var result = arrayFunc.apply(this, arguments);\n\
        if (this.length === 0) {\n\
          delete this[0];\n\
        }\n\
        return result;\n\
      };\n\
\n\
      lodash.prototype[methodName] = function() {\n\
        var args = arguments;\n\
        if (retUnwrapped && !this.__chain__) {\n\
          return func.apply(this.value(), args);\n\
        }\n\
        return this[chainName](function(value) {\n\
          return func.apply(value, args);\n\
        });\n\
      };\n\
    });\n\
\n\
    // Add functions to the lazy wrapper.\n\
    LazyWrapper.prototype.clone = lazyClone;\n\
    LazyWrapper.prototype.reverse = lazyReverse;\n\
    LazyWrapper.prototype.value = lazyValue;\n\
\n\
    // Add chaining functions to the lodash wrapper.\n\
    lodash.prototype.chain = wrapperChain;\n\
    lodash.prototype.reverse = wrapperReverse;\n\
    lodash.prototype.toString = wrapperToString;\n\
    lodash.prototype.toJSON = lodash.prototype.valueOf = lodash.prototype.value = wrapperValue;\n\
\n\
    // Add function aliases to the lodash wrapper.\n\
    lodash.prototype.collect = lodash.prototype.map;\n\
    lodash.prototype.head = lodash.prototype.first;\n\
    lodash.prototype.select = lodash.prototype.filter;\n\
    lodash.prototype.tail = lodash.prototype.rest;\n\
\n\
    return lodash;\n\
  }\n\
\n\
  /*--------------------------------------------------------------------------*/\n\
\n\
  // Export Lo-Dash.\n\
  var _ = runInContext();\n\
\n\
  // Some AMD build optimizers like r.js check for condition patterns like the following:\n\
  if (typeof define == 'function' && typeof define.amd == 'object' && define.amd) {\n\
    // Expose Lo-Dash to the global object when an AMD loader is present to avoid\n\
    // errors in cases where Lo-Dash is loaded by a script tag and not intended\n\
    // as an AMD module. See http://requirejs.org/docs/errors.html#mismatch.\n\
    root._ = _;\n\
\n\
    // Define as an anonymous module so, through path mapping, it can be\n\
    // referenced as the \"underscore\" module.\n\
    define(function() {\n\
      return _;\n\
    });\n\
  }\n\
  // Check for `exports` after `define` in case a build optimizer adds an `exports` object.\n\
  else if (freeExports && freeModule) {\n\
    // Export for Node.js or RingoJS.\n\
    if (moduleExports) {\n\
      (freeModule.exports = _)._ = _;\n\
    }\n\
    // Export for Narwhal or Rhino -require.\n\
    else {\n\
      freeExports._ = _;\n\
    }\n\
  }\n\
  else {\n\
    // Export for a browser or Rhino.\n\
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
"function one(selector, el) {\n\
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
  return exports;\n\
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
  if (!el || el.nodeType !== 1) return false;\n\
  if (vendor) return vendor.call(el, selector);\n\
  var nodes = query.all(selector, el.parentNode);\n\
  for (var i = 0; i < nodes.length; ++i) {\n\
    if (nodes[i] == el) return true;\n\
  }\n\
  return false;\n\
}\n\
//@ sourceURL=component-matches-selector/index.js"
));
require.register("component-closest/index.js", Function("exports, require, module",
"var matches = require('matches-selector')\n\
\n\
module.exports = function (element, selector, checkYoSelf, root) {\n\
  element = checkYoSelf ? {parentNode: element} : element\n\
\n\
  root = root || document\n\
\n\
  // Make sure `element !== document` and `element != null`\n\
  // otherwise we get an illegal invocation\n\
  while ((element = element.parentNode) && element !== document) {\n\
    if (matches(element, selector))\n\
      return element\n\
    // After `matches` on the edge case that\n\
    // the selector matches the root\n\
    // (when the root is not the document)\n\
    if (element === root)\n\
      return\n\
  }\n\
}\n\
//@ sourceURL=component-closest/index.js"
));
require.register("component-delegate/index.js", Function("exports, require, module",
"/**\n\
 * Module dependencies.\n\
 */\n\
\n\
var closest = require('closest')\n\
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
    var target = e.target || e.srcElement;\n\
    e.delegateTarget = closest(target, selector, true, el);\n\
    if (e.delegateTarget) fn.call(el, e);\n\
  }, capture);\n\
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
  legend: [1, '<fieldset>', '</fieldset>'],\n\
  tr: [2, '<table><tbody>', '</tbody></table>'],\n\
  col: [2, '<table><tbody></tbody><colgroup>', '</colgroup></table>'],\n\
  _default: [0, '', '']\n\
};\n\
\n\
map.td =\n\
map.th = [3, '<table><tbody><tr>', '</tr></tbody></table>'];\n\
\n\
map.option =\n\
map.optgroup = [1, '<select multiple=\"multiple\">', '</select>'];\n\
\n\
map.thead =\n\
map.tbody =\n\
map.colgroup =\n\
map.caption =\n\
map.tfoot = [1, '<table>', '</table>'];\n\
\n\
map.text =\n\
map.circle =\n\
map.ellipse =\n\
map.line =\n\
map.path =\n\
map.polygon =\n\
map.polyline =\n\
map.rect = [1, '<svg xmlns=\"http://www.w3.org/2000/svg\" version=\"1.1\">','</svg>'];\n\
\n\
/**\n\
 * Parse `html` and return a DOM Node instance, which could be a TextNode,\n\
 * HTML DOM Node of some kind (<div> for example), or a DocumentFragment\n\
 * instance, depending on the contents of the `html` string.\n\
 *\n\
 * @param {String} html - HTML string to \"domify\"\n\
 * @param {Document} doc - The `document` instance to create the Node for\n\
 * @return {DOMNode} the TextNode, DOM Node, or DocumentFragment instance\n\
 * @api private\n\
 */\n\
\n\
function parse(html, doc) {\n\
  if ('string' != typeof html) throw new TypeError('String expected');\n\
\n\
  // default to the global `document` object\n\
  if (!doc) doc = document;\n\
\n\
  // tag name\n\
  var m = /<([\\w:]+)/.exec(html);\n\
  if (!m) return doc.createTextNode(html);\n\
\n\
  html = html.replace(/^\\s+|\\s+$/g, ''); // Remove leading/trailing whitespace\n\
\n\
  var tag = m[1];\n\
\n\
  // body support\n\
  if (tag == 'body') {\n\
    var el = doc.createElement('html');\n\
    el.innerHTML = html;\n\
    return el.removeChild(el.lastChild);\n\
  }\n\
\n\
  // wrap map\n\
  var wrap = map[tag] || map._default;\n\
  var depth = wrap[0];\n\
  var prefix = wrap[1];\n\
  var suffix = wrap[2];\n\
  var el = doc.createElement('div');\n\
  el.innerHTML = prefix + html + suffix;\n\
  while (depth--) el = el.lastChild;\n\
\n\
  // one element\n\
  if (el.firstChild == el.lastChild) {\n\
    return el.removeChild(el.firstChild);\n\
  }\n\
\n\
  // several elements\n\
  var fragment = doc.createDocumentFragment();\n\
  while (el.firstChild) {\n\
    fragment.appendChild(el.removeChild(el.firstChild));\n\
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
"/**\n\
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
  if (!el) throw new Error('A DOM element reference is required');\n\
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
 * Toggle class `name`, can force state via `force`.\n\
 *\n\
 * For browsers that support classList, but do not support `force` yet,\n\
 * the mistake will be detected and corrected.\n\
 *\n\
 * @param {String} name\n\
 * @param {Boolean} force\n\
 * @return {ClassList}\n\
 * @api public\n\
 */\n\
\n\
ClassList.prototype.toggle = function(name, force){\n\
  // classList\n\
  if (this.list) {\n\
    if (\"undefined\" !== typeof force) {\n\
      if (force !== this.list.toggle(name, force)) {\n\
        this.list.toggle(name); // toggle again to correct\n\
      }\n\
    } else {\n\
      this.list.toggle(name);\n\
    }\n\
    return this;\n\
  }\n\
\n\
  // fallback\n\
  if (\"undefined\" !== typeof force) {\n\
    if (!force) {\n\
      this.remove(name);\n\
    } else {\n\
      this.add(name);\n\
    }\n\
  } else {\n\
    if (this.has(name)) {\n\
      this.remove(name);\n\
    } else {\n\
      this.add(name);\n\
    }\n\
  }\n\
\n\
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
require.register("component-type/index.js", Function("exports, require, module",
"\n\
/**\n\
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
    case '[object Function]': return 'function';\n\
    case '[object Date]': return 'date';\n\
    case '[object RegExp]': return 'regexp';\n\
    case '[object Arguments]': return 'arguments';\n\
    case '[object Array]': return 'array';\n\
    case '[object String]': return 'string';\n\
  }\n\
\n\
  if (val === null) return 'null';\n\
  if (val === undefined) return 'undefined';\n\
  if (val && val.nodeType === 1) return 'element';\n\
  if (val === Object(val)) return 'object';\n\
\n\
  return typeof val;\n\
};\n\
//@ sourceURL=component-type/index.js"
));
require.register("component-props/index.js", Function("exports, require, module",
"/**\n\
 * Global Names\n\
 */\n\
\n\
var globals = /\\b(this|Array|Date|Object|Math|JSON)\\b/g;\n\
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
    .match(/[$a-zA-Z_]\\w*/g)\n\
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
"\n\
/**\n\
 * Module Dependencies\n\
 */\n\
\n\
var expr;\n\
try {\n\
  expr = require('props');\n\
} catch(e) {\n\
  expr = require('component-props');\n\
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
  };\n\
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
  };\n\
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
  var match = {};\n\
  for (var key in obj) {\n\
    match[key] = typeof obj[key] === 'string'\n\
      ? defaultToFunction(obj[key])\n\
      : toFunction(obj[key]);\n\
  }\n\
  return function(val){\n\
    if (typeof val !== 'object') return false;\n\
    for (var key in match) {\n\
      if (!(key in val)) return false;\n\
      if (!match[key](val[key])) return false;\n\
    }\n\
    return true;\n\
  };\n\
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
  var val, i, prop;\n\
  for (i = 0; i < props.length; i++) {\n\
    prop = props[i];\n\
    val = '_.' + prop;\n\
    val = \"('function' == typeof \" + val + \" ? \" + val + \"() : \" + val + \")\";\n\
\n\
    // mimic negative lookbehind to avoid problems with nested properties\n\
    str = stripNested(prop, str, val);\n\
  }\n\
\n\
  return str;\n\
}\n\
\n\
/**\n\
 * Mimic negative lookbehind to avoid problems with nested properties.\n\
 *\n\
 * See: http://blog.stevenlevithan.com/archives/mimic-lookbehind-javascript\n\
 *\n\
 * @param {String} prop\n\
 * @param {String} str\n\
 * @param {String} val\n\
 * @return {String}\n\
 * @api private\n\
 */\n\
\n\
function stripNested (prop, str, val) {\n\
  return str.replace(new RegExp('(\\\\.)?' + prop, 'g'), function($0, $1) {\n\
    return $1 ? $0 : val;\n\
  });\n\
}\n\
//@ sourceURL=component-to-function/index.js"
));
require.register("component-each/index.js", Function("exports, require, module",
"\n\
/**\n\
 * Module dependencies.\n\
 */\n\
\n\
try {\n\
  var type = require('type');\n\
} catch (err) {\n\
  var type = require('component-type');\n\
}\n\
\n\
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
require.register("guille-ms.js/index.js", Function("exports, require, module",
"/**\n\
 * Helpers.\n\
 */\n\
\n\
var s = 1000;\n\
var m = s * 60;\n\
var h = m * 60;\n\
var d = h * 24;\n\
var y = d * 365.25;\n\
\n\
/**\n\
 * Parse or format the given `val`.\n\
 *\n\
 * Options:\n\
 *\n\
 *  - `long` verbose formatting [false]\n\
 *\n\
 * @param {String|Number} val\n\
 * @param {Object} options\n\
 * @return {String|Number}\n\
 * @api public\n\
 */\n\
\n\
module.exports = function(val, options){\n\
  options = options || {};\n\
  if ('string' == typeof val) return parse(val);\n\
  return options.long\n\
    ? long(val)\n\
    : short(val);\n\
};\n\
\n\
/**\n\
 * Parse the given `str` and return milliseconds.\n\
 *\n\
 * @param {String} str\n\
 * @return {Number}\n\
 * @api private\n\
 */\n\
\n\
function parse(str) {\n\
  var match = /^((?:\\d+)?\\.?\\d+) *(ms|seconds?|s|minutes?|m|hours?|h|days?|d|years?|y)?$/i.exec(str);\n\
  if (!match) return;\n\
  var n = parseFloat(match[1]);\n\
  var type = (match[2] || 'ms').toLowerCase();\n\
  switch (type) {\n\
    case 'years':\n\
    case 'year':\n\
    case 'y':\n\
      return n * y;\n\
    case 'days':\n\
    case 'day':\n\
    case 'd':\n\
      return n * d;\n\
    case 'hours':\n\
    case 'hour':\n\
    case 'h':\n\
      return n * h;\n\
    case 'minutes':\n\
    case 'minute':\n\
    case 'm':\n\
      return n * m;\n\
    case 'seconds':\n\
    case 'second':\n\
    case 's':\n\
      return n * s;\n\
    case 'ms':\n\
      return n;\n\
  }\n\
}\n\
\n\
/**\n\
 * Short format for `ms`.\n\
 *\n\
 * @param {Number} ms\n\
 * @return {String}\n\
 * @api private\n\
 */\n\
\n\
function short(ms) {\n\
  if (ms >= d) return Math.round(ms / d) + 'd';\n\
  if (ms >= h) return Math.round(ms / h) + 'h';\n\
  if (ms >= m) return Math.round(ms / m) + 'm';\n\
  if (ms >= s) return Math.round(ms / s) + 's';\n\
  return ms + 'ms';\n\
}\n\
\n\
/**\n\
 * Long format for `ms`.\n\
 *\n\
 * @param {Number} ms\n\
 * @return {String}\n\
 * @api private\n\
 */\n\
\n\
function long(ms) {\n\
  return plural(ms, d, 'day')\n\
    || plural(ms, h, 'hour')\n\
    || plural(ms, m, 'minute')\n\
    || plural(ms, s, 'second')\n\
    || ms + ' ms';\n\
}\n\
\n\
/**\n\
 * Pluralization helper.\n\
 */\n\
\n\
function plural(ms, n, name) {\n\
  if (ms < n) return;\n\
  if (ms < n * 1.5) return Math.floor(ms / n) + ' ' + name;\n\
  return Math.ceil(ms / n) + ' ' + name + 's';\n\
}\n\
//@ sourceURL=guille-ms.js/index.js"
));
require.register("visionmedia-debug/browser.js", Function("exports, require, module",
"\n\
/**\n\
 * This is the web browser implementation of `debug()`.\n\
 *\n\
 * Expose `debug()` as the module.\n\
 */\n\
\n\
exports = module.exports = require('./debug');\n\
exports.log = log;\n\
exports.formatArgs = formatArgs;\n\
exports.save = save;\n\
exports.load = load;\n\
exports.useColors = useColors;\n\
\n\
/**\n\
 * Colors.\n\
 */\n\
\n\
exports.colors = [\n\
  'lightseagreen',\n\
  'forestgreen',\n\
  'goldenrod',\n\
  'dodgerblue',\n\
  'darkorchid',\n\
  'crimson'\n\
];\n\
\n\
/**\n\
 * Currently only WebKit-based Web Inspectors, Firefox >= v31,\n\
 * and the Firebug extension (any Firefox version) are known\n\
 * to support \"%c\" CSS customizations.\n\
 *\n\
 * TODO: add a `localStorage` variable to explicitly enable/disable colors\n\
 */\n\
\n\
function useColors() {\n\
  // is webkit? http://stackoverflow.com/a/16459606/376773\n\
  return ('WebkitAppearance' in document.documentElement.style) ||\n\
    // is firebug? http://stackoverflow.com/a/398120/376773\n\
    (window.console && (console.firebug || (console.exception && console.table))) ||\n\
    // is firefox >= v31?\n\
    // https://developer.mozilla.org/en-US/docs/Tools/Web_Console#Styling_messages\n\
    (navigator.userAgent.toLowerCase().match(/firefox\\/(\\d+)/) && parseInt(RegExp.$1, 10) >= 31);\n\
}\n\
\n\
/**\n\
 * Map %j to `JSON.stringify()`, since no Web Inspectors do that by default.\n\
 */\n\
\n\
exports.formatters.j = function(v) {\n\
  return JSON.stringify(v);\n\
};\n\
\n\
\n\
/**\n\
 * Colorize log arguments if enabled.\n\
 *\n\
 * @api public\n\
 */\n\
\n\
function formatArgs() {\n\
  var args = arguments;\n\
  var useColors = this.useColors;\n\
\n\
  args[0] = (useColors ? '%c' : '')\n\
    + this.namespace\n\
    + (useColors ? ' %c' : ' ')\n\
    + args[0]\n\
    + (useColors ? '%c ' : ' ')\n\
    + '+' + exports.humanize(this.diff);\n\
\n\
  if (!useColors) return args;\n\
\n\
  var c = 'color: ' + this.color;\n\
  args = [args[0], c, 'color: inherit'].concat(Array.prototype.slice.call(args, 1));\n\
\n\
  // the final \"%c\" is somewhat tricky, because there could be other\n\
  // arguments passed either before or after the %c, so we need to\n\
  // figure out the correct index to insert the CSS into\n\
  var index = 0;\n\
  var lastC = 0;\n\
  args[0].replace(/%[a-z%]/g, function(match) {\n\
    if ('%%' === match) return;\n\
    index++;\n\
    if ('%c' === match) {\n\
      // we only are interested in the *last* %c\n\
      // (the user may have provided their own)\n\
      lastC = index;\n\
    }\n\
  });\n\
\n\
  args.splice(lastC, 0, c);\n\
  return args;\n\
}\n\
\n\
/**\n\
 * Invokes `console.log()` when available.\n\
 * No-op when `console.log` is not a \"function\".\n\
 *\n\
 * @api public\n\
 */\n\
\n\
function log() {\n\
  // This hackery is required for IE8,\n\
  // where the `console.log` function doesn't have 'apply'\n\
  return 'object' == typeof console\n\
    && 'function' == typeof console.log\n\
    && Function.prototype.apply.call(console.log, console, arguments);\n\
}\n\
\n\
/**\n\
 * Save `namespaces`.\n\
 *\n\
 * @param {String} namespaces\n\
 * @api private\n\
 */\n\
\n\
function save(namespaces) {\n\
  try {\n\
    if (null == namespaces) {\n\
      localStorage.removeItem('debug');\n\
    } else {\n\
      localStorage.debug = namespaces;\n\
    }\n\
  } catch(e) {}\n\
}\n\
\n\
/**\n\
 * Load `namespaces`.\n\
 *\n\
 * @return {String} returns the previously persisted debug modes\n\
 * @api private\n\
 */\n\
\n\
function load() {\n\
  var r;\n\
  try {\n\
    r = localStorage.debug;\n\
  } catch(e) {}\n\
  return r;\n\
}\n\
\n\
/**\n\
 * Enable namespaces listed in `localStorage.debug` initially.\n\
 */\n\
\n\
exports.enable(load());\n\
//@ sourceURL=visionmedia-debug/browser.js"
));
require.register("visionmedia-debug/debug.js", Function("exports, require, module",
"\n\
/**\n\
 * This is the common logic for both the Node.js and web browser\n\
 * implementations of `debug()`.\n\
 *\n\
 * Expose `debug()` as the module.\n\
 */\n\
\n\
exports = module.exports = debug;\n\
exports.coerce = coerce;\n\
exports.disable = disable;\n\
exports.enable = enable;\n\
exports.enabled = enabled;\n\
exports.humanize = require('ms');\n\
\n\
/**\n\
 * The currently active debug mode names, and names to skip.\n\
 */\n\
\n\
exports.names = [];\n\
exports.skips = [];\n\
\n\
/**\n\
 * Map of special \"%n\" handling functions, for the debug \"format\" argument.\n\
 *\n\
 * Valid key names are a single, lowercased letter, i.e. \"n\".\n\
 */\n\
\n\
exports.formatters = {};\n\
\n\
/**\n\
 * Previously assigned color.\n\
 */\n\
\n\
var prevColor = 0;\n\
\n\
/**\n\
 * Previous log timestamp.\n\
 */\n\
\n\
var prevTime;\n\
\n\
/**\n\
 * Select a color.\n\
 *\n\
 * @return {Number}\n\
 * @api private\n\
 */\n\
\n\
function selectColor() {\n\
  return exports.colors[prevColor++ % exports.colors.length];\n\
}\n\
\n\
/**\n\
 * Create a debugger with the given `namespace`.\n\
 *\n\
 * @param {String} namespace\n\
 * @return {Function}\n\
 * @api public\n\
 */\n\
\n\
function debug(namespace) {\n\
\n\
  // define the `disabled` version\n\
  function disabled() {\n\
  }\n\
  disabled.enabled = false;\n\
\n\
  // define the `enabled` version\n\
  function enabled() {\n\
\n\
    var self = enabled;\n\
\n\
    // set `diff` timestamp\n\
    var curr = +new Date();\n\
    var ms = curr - (prevTime || curr);\n\
    self.diff = ms;\n\
    self.prev = prevTime;\n\
    self.curr = curr;\n\
    prevTime = curr;\n\
\n\
    // add the `color` if not set\n\
    if (null == self.useColors) self.useColors = exports.useColors();\n\
    if (null == self.color && self.useColors) self.color = selectColor();\n\
\n\
    var args = Array.prototype.slice.call(arguments);\n\
\n\
    args[0] = exports.coerce(args[0]);\n\
\n\
    if ('string' !== typeof args[0]) {\n\
      // anything else let's inspect with %o\n\
      args = ['%o'].concat(args);\n\
    }\n\
\n\
    // apply any `formatters` transformations\n\
    var index = 0;\n\
    args[0] = args[0].replace(/%([a-z%])/g, function(match, format) {\n\
      // if we encounter an escaped % then don't increase the array index\n\
      if (match === '%%') return match;\n\
      index++;\n\
      var formatter = exports.formatters[format];\n\
      if ('function' === typeof formatter) {\n\
        var val = args[index];\n\
        match = formatter.call(self, val);\n\
\n\
        // now we need to remove `args[index]` since it's inlined in the `format`\n\
        args.splice(index, 1);\n\
        index--;\n\
      }\n\
      return match;\n\
    });\n\
\n\
    if ('function' === typeof exports.formatArgs) {\n\
      args = exports.formatArgs.apply(self, args);\n\
    }\n\
    var logFn = enabled.log || exports.log || console.log.bind(console);\n\
    logFn.apply(self, args);\n\
  }\n\
  enabled.enabled = true;\n\
\n\
  var fn = exports.enabled(namespace) ? enabled : disabled;\n\
\n\
  fn.namespace = namespace;\n\
\n\
  return fn;\n\
}\n\
\n\
/**\n\
 * Enables a debug mode by namespaces. This can include modes\n\
 * separated by a colon and wildcards.\n\
 *\n\
 * @param {String} namespaces\n\
 * @api public\n\
 */\n\
\n\
function enable(namespaces) {\n\
  exports.save(namespaces);\n\
\n\
  var split = (namespaces || '').split(/[\\s,]+/);\n\
  var len = split.length;\n\
\n\
  for (var i = 0; i < len; i++) {\n\
    if (!split[i]) continue; // ignore empty strings\n\
    namespaces = split[i].replace(/\\*/g, '.*?');\n\
    if (namespaces[0] === '-') {\n\
      exports.skips.push(new RegExp('^' + namespaces.substr(1) + '$'));\n\
    } else {\n\
      exports.names.push(new RegExp('^' + namespaces + '$'));\n\
    }\n\
  }\n\
}\n\
\n\
/**\n\
 * Disable debug output.\n\
 *\n\
 * @api public\n\
 */\n\
\n\
function disable() {\n\
  exports.enable('');\n\
}\n\
\n\
/**\n\
 * Returns true if the given mode name is enabled, false otherwise.\n\
 *\n\
 * @param {String} name\n\
 * @return {Boolean}\n\
 * @api public\n\
 */\n\
\n\
function enabled(name) {\n\
  var i, len;\n\
  for (i = 0, len = exports.skips.length; i < len; i++) {\n\
    if (exports.skips[i].test(name)) {\n\
      return false;\n\
    }\n\
  }\n\
  for (i = 0, len = exports.names.length; i < len; i++) {\n\
    if (exports.names[i].test(name)) {\n\
      return true;\n\
    }\n\
  }\n\
  return false;\n\
}\n\
\n\
/**\n\
 * Coerce `val`.\n\
 *\n\
 * @param {Mixed} val\n\
 * @return {Mixed}\n\
 * @api private\n\
 */\n\
\n\
function coerce(val) {\n\
  if (val instanceof Error) return val.stack || val.message;\n\
  return val;\n\
}\n\
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
    debug('converting value: %s into a number', val);\n\
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
  'float': 'cssFloat' in document.documentElement.style ? 'cssFloat' : 'styleFloat'\n\
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
  debug('transform property: %s => %s', prop, style);\n\
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
require.register("ded-domready/ready.js", Function("exports, require, module",
"/*!\n\
  * domready (c) Dustin Diaz 2014 - License MIT\n\
  */\n\
!function (name, definition) {\n\
\n\
  if (typeof module != 'undefined') module.exports = definition()\n\
  else if (typeof define == 'function' && typeof define.amd == 'object') define(definition)\n\
  else this[name] = definition()\n\
\n\
}('domready', function () {\n\
\n\
  var fns = [], listener\n\
    , doc = document\n\
    , hack = doc.documentElement.doScroll\n\
    , domContentLoaded = 'DOMContentLoaded'\n\
    , loaded = (hack ? /^loaded|^c/ : /^loaded|^i|^c/).test(doc.readyState)\n\
\n\
\n\
  if (!loaded)\n\
  doc.addEventListener(domContentLoaded, listener = function () {\n\
    doc.removeEventListener(domContentLoaded, listener)\n\
    loaded = 1\n\
    while (listener = fns.shift()) listener()\n\
  })\n\
\n\
  return function (fn) {\n\
    loaded ? fn() : fns.push(fn)\n\
  }\n\
\n\
});\n\
//@ sourceURL=ded-domready/ready.js"
));
require.register("detects-dom-support/index.js", Function("exports, require, module",
"var domready = require('domready')\n\
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
//@ sourceURL=detects-dom-support/index.js"
));
require.register("component-get-document/index.js", Function("exports, require, module",
"\n\
/**\n\
 * Module exports.\n\
 */\n\
\n\
module.exports = getDocument;\n\
\n\
// defined by w3c\n\
var DOCUMENT_NODE = 9;\n\
\n\
/**\n\
 * Returns the `document` object associated with the given `node`, which may be\n\
 * a DOM element, the Window object, a Selection, a Range. Basically any DOM\n\
 * object that references the Document in some way, this function will find it.\n\
 *\n\
 * @param {Mixed} node - DOM node, selection, or range in which to find the `document` object\n\
 * @return {Document} the `document` object associated with `node`\n\
 * @public\n\
 */\n\
\n\
function getDocument(node) {\n\
  if (node.nodeType === DOCUMENT_NODE) {\n\
    return node;\n\
\n\
  } else if (typeof node.ownerDocument != 'undefined' &&\n\
      node.ownerDocument.nodeType === DOCUMENT_NODE) {\n\
    return node.ownerDocument;\n\
\n\
  } else if (typeof node.document != 'undefined' &&\n\
      node.document.nodeType === DOCUMENT_NODE) {\n\
    return node.document;\n\
\n\
  } else if (node.parentNode) {\n\
    return getDocument(node.parentNode);\n\
\n\
  // Range support\n\
  } else if (node.commonAncestorContainer) {\n\
    return getDocument(node.commonAncestorContainer);\n\
\n\
  } else if (node.startContainer) {\n\
    return getDocument(node.startContainer);\n\
\n\
  // Selection support\n\
  } else if (node.baseNode) {\n\
    return getDocument(node.baseNode);\n\
  }\n\
}\n\
//@ sourceURL=component-get-document/index.js"
));
require.register("component-within-element/index.js", Function("exports, require, module",
"\n\
/**\n\
 * Check if the DOM element `child` is within the given `parent` DOM element.\n\
 *\n\
 * @param {DOMElement|Range} child - the DOM element or Range to check if it's within `parent`\n\
 * @param {DOMElement} parent  - the parent node that `child` could be inside of\n\
 * @return {Boolean} True if `child` is within `parent`. False otherwise.\n\
 * @public\n\
 */\n\
\n\
module.exports = function within (child, parent) {\n\
  // don't throw if `child` is null\n\
  if (!child) return false;\n\
\n\
  // Range support\n\
  if (child.commonAncestorContainer) child = child.commonAncestorContainer;\n\
  else if (child.endContainer) child = child.endContainer;\n\
\n\
  // traverse up the `parentNode` properties until `parent` is found\n\
  var node = child;\n\
  while (node = node.parentNode) {\n\
    if (node == parent) return true;\n\
  }\n\
\n\
  return false;\n\
};\n\
//@ sourceURL=component-within-element/index.js"
));
require.register("timoxley-offset/index.js", Function("exports, require, module",
"var support = require('dom-support')\n\
var getDocument = require('get-document')\n\
var withinElement = require('within-element')\n\
\n\
/**\n\
 * Get offset of a DOM Element or Range within the document.\n\
 *\n\
 * @param {DOMElement|Range} el - the DOM element or Range instance to measure\n\
 * @return {Object} An object with `top` and `left` Number values\n\
 * @public\n\
 */\n\
\n\
module.exports = function offset(el) {\n\
  var doc = getDocument(el)\n\
  if (!doc) return\n\
\n\
  // Make sure it's not a disconnected DOM node\n\
  if (!withinElement(el, doc)) return\n\
\n\
  var body = doc.body\n\
  if (body === el) {\n\
    return bodyOffset(el)\n\
  }\n\
\n\
  var box = { top: 0, left: 0 }\n\
  if ( typeof el.getBoundingClientRect !== \"undefined\" ) {\n\
    // If we don't have gBCR, just use 0,0 rather than error\n\
    // BlackBerry 5, iOS 3 (original iPhone)\n\
    box = el.getBoundingClientRect()\n\
\n\
    if (el.collapsed && box.left === 0 && box.top === 0) {\n\
      // collapsed Range instances sometimes report 0, 0\n\
      // see: http://stackoverflow.com/a/6847328/376773\n\
      var span = doc.createElement(\"span\");\n\
\n\
      // Ensure span has dimensions and position by\n\
      // adding a zero-width space character\n\
      span.appendChild(doc.createTextNode(\"\\u200b\"));\n\
      el.insertNode(span);\n\
      box = span.getBoundingClientRect();\n\
\n\
      // Remove temp SPAN and glue any broken text nodes back together\n\
      var spanParent = span.parentNode;\n\
      spanParent.removeChild(span);\n\
      spanParent.normalize();\n\
    }\n\
  }\n\
\n\
  var docEl = doc.documentElement\n\
  var clientTop  = docEl.clientTop  || body.clientTop  || 0\n\
  var clientLeft = docEl.clientLeft || body.clientLeft || 0\n\
  var scrollTop  = window.pageYOffset || docEl.scrollTop\n\
  var scrollLeft = window.pageXOffset || docEl.scrollLeft\n\
\n\
  return {\n\
    top: box.top  + scrollTop  - clientTop,\n\
    left: box.left + scrollLeft - clientLeft\n\
  }\n\
}\n\
\n\
function bodyOffset(body) {\n\
  var top = body.offsetTop\n\
  var left = body.offsetLeft\n\
\n\
  if (support.doesNotIncludeMarginInBodyOffset) {\n\
    top  += parseFloat(body.style.marginTop || 0)\n\
    left += parseFloat(body.style.marginLeft || 0)\n\
  }\n\
\n\
  return {\n\
    top: top,\n\
    left: left\n\
  }\n\
}\n\
//@ sourceURL=timoxley-offset/index.js"
));
require.register("component-tip/index.js", Function("exports, require, module",
"/**\n\
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
var html = domify(require('./template.html'));\n\
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
    var tip = new Tip(val, options);\n\
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
 * @param {String|Element} content\n\
 * @return {Tip} self\n\
 * @api public\n\
 */\n\
\n\
Tip.prototype.message = function(content){\n\
  if ('string' == typeof content) content = domify(content);\n\
  this.inner.innerHTML = '';\n\
  this.inner.appendChild(content);\n\
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
  if (!this.winEvents) {\n\
    this.winEvents = events(window, this);\n\
    this.winEvents.bind('resize', 'reposition');\n\
    this.winEvents.bind('scroll', 'reposition');\n\
  }\n\
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
\n\
  var tipDims = dimensions(this.el);\n\
  if (!tipDims) throw new Error('could not determine dimensions of Tip element');\n\
  var ew = tipDims.width;\n\
  var eh = tipDims.height;\n\
\n\
  var to = offset(this.target);\n\
  if (!to) throw new Error('could not determine page offset of `target`');\n\
\n\
  var dims = dimensions(this.target);\n\
  if (!dims) throw new Error('could not determine dimensions of `target`');\n\
  var tw = dims.width;\n\
  var th = dims.height;\n\
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
  this.emit('hiding');\n\
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
 * @api public\n\
 */\n\
\n\
Tip.prototype.remove = function(){\n\
  if (this.winEvents) {\n\
    this.winEvents.unbind();\n\
    this.winEvents = null;\n\
  }\n\
  this.emit('hide');\n\
\n\
  var parent = this.el.parentNode;\n\
  if (parent) parent.removeChild(this.el);\n\
  return this;\n\
};\n\
\n\
/**\n\
 * Returns an Object with `width` and `height` values which represent the\n\
 * dimensions of the given `node` which could be a DOM Element, Range, etc.\n\
 *\n\
 * TODO: extract this into a standalone module\n\
 *\n\
 * @private\n\
 */\n\
\n\
function dimensions(node) {\n\
  var dims;\n\
  var ow = node.offsetWidth;\n\
  var oh = node.offsetHeight;\n\
\n\
  // use `offsetWidth` and `offsetHeight` by default if available\n\
  if (ow != null && oh != null) {\n\
    dims = { width: ow, height: oh };\n\
  }\n\
\n\
  // fallback to `getBoundingClientRect()` if available\n\
  if ((!dims || (!dims.width && !dims.height)) &&\n\
      'function' == typeof node.getBoundingClientRect) {\n\
    dims = node.getBoundingClientRect();\n\
  }\n\
\n\
  return dims;\n\
}\n\
//@ sourceURL=component-tip/index.js"
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











































require.register("component-tip/template.html", Function("exports, require, module",
"module.exports = '<div class=\"tip tip-hide\">\\n\
  <div class=\"tip-arrow\"></div>\\n\
  <div class=\"tip-inner\"></div>\\n\
</div>';//@ sourceURL=component-tip/template.html"
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
require.alias("component-bind/index.js", "component-tip/deps/bind/index.js");

require.alias("component-emitter/index.js", "component-tip/deps/emitter/index.js");

require.alias("component-query/index.js", "component-tip/deps/query/index.js");

require.alias("component-events/index.js", "component-tip/deps/events/index.js");
require.alias("component-event/index.js", "component-events/deps/event/index.js");

require.alias("component-delegate/index.js", "component-events/deps/delegate/index.js");
require.alias("component-closest/index.js", "component-delegate/deps/closest/index.js");
require.alias("component-closest/index.js", "component-delegate/deps/closest/index.js");
require.alias("component-matches-selector/index.js", "component-closest/deps/matches-selector/index.js");
require.alias("component-query/index.js", "component-matches-selector/deps/query/index.js");

require.alias("component-closest/index.js", "component-closest/index.js");
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
require.alias("component-type/index.js", "component-each/deps/type/index.js");

require.alias("component-to-function/index.js", "component-each/deps/to-function/index.js");
require.alias("component-props/index.js", "component-to-function/deps/props/index.js");

require.alias("visionmedia-debug/browser.js", "component-css/deps/debug/browser.js");
require.alias("visionmedia-debug/debug.js", "component-css/deps/debug/debug.js");
require.alias("visionmedia-debug/browser.js", "component-css/deps/debug/index.js");
require.alias("guille-ms.js/index.js", "visionmedia-debug/deps/ms/index.js");

require.alias("visionmedia-debug/browser.js", "visionmedia-debug/index.js");
require.alias("ianstormtaylor-to-camel-case/index.js", "component-css/deps/to-camel-case/index.js");
require.alias("ianstormtaylor-to-space-case/index.js", "ianstormtaylor-to-camel-case/deps/to-space-case/index.js");
require.alias("ianstormtaylor-to-no-case/index.js", "ianstormtaylor-to-space-case/deps/to-no-case/index.js");

require.alias("component-within-document/index.js", "component-css/deps/within-document/index.js");

require.alias("component-css/index.js", "component-css/index.js");
require.alias("timoxley-offset/index.js", "component-tip/deps/offset/index.js");
require.alias("detects-dom-support/index.js", "timoxley-offset/deps/dom-support/index.js");
require.alias("ded-domready/ready.js", "detects-dom-support/deps/domready/ready.js");
require.alias("ded-domready/ready.js", "detects-dom-support/deps/domready/index.js");
require.alias("ded-domready/ready.js", "ded-domready/index.js");
require.alias("component-get-document/index.js", "timoxley-offset/deps/get-document/index.js");
require.alias("component-get-document/index.js", "timoxley-offset/deps/get-document/index.js");
require.alias("component-get-document/index.js", "component-get-document/index.js");
require.alias("component-within-element/index.js", "timoxley-offset/deps/within-element/index.js");

require.alias("familyfound-fan/index.js", "familyfound-fan/index.js");
require.alias("familyfound-person-manager/index.js", "main/deps/person-manager/index.js");
require.alias("familyfound-person-manager/index.js", "main/deps/person-manager/index.js");
require.alias("familyfound-person-manager/index.js", "person-manager/index.js");
require.alias("notablemind-manager/index.js", "familyfound-person-manager/deps/manager/index.js");
require.alias("notablemind-manager/index.js", "familyfound-person-manager/deps/manager/index.js");
require.alias("lodash-lodash/dist/lodash.compat.js", "notablemind-manager/deps/lodash/dist/lodash.compat.js");
require.alias("lodash-lodash/dist/lodash.compat.js", "notablemind-manager/deps/lodash/index.js");
require.alias("lodash-lodash/dist/lodash.compat.js", "lodash-lodash/index.js");
require.alias("notablemind-manager/index.js", "notablemind-manager/index.js");
require.alias("lodash-lodash/dist/lodash.compat.js", "familyfound-person-manager/deps/lodash/dist/lodash.compat.js");
require.alias("lodash-lodash/dist/lodash.compat.js", "familyfound-person-manager/deps/lodash/index.js");
require.alias("lodash-lodash/dist/lodash.compat.js", "lodash-lodash/index.js");
require.alias("familyfound-person-manager/index.js", "familyfound-person-manager/index.js");
require.alias("jashkenas-backbone/backbone.js", "main/deps/backbone/backbone.js");
require.alias("jashkenas-backbone/backbone.js", "main/deps/backbone/index.js");
require.alias("jashkenas-backbone/backbone.js", "backbone/index.js");
require.alias("jashkenas-underscore/underscore.js", "jashkenas-backbone/deps/underscore/underscore.js");
require.alias("jashkenas-underscore/underscore.js", "jashkenas-backbone/deps/underscore/index.js");
require.alias("jashkenas-underscore/underscore.js", "jashkenas-underscore/index.js");
require.alias("jashkenas-backbone/backbone.js", "jashkenas-backbone/index.js");
require.alias("lodash-lodash/dist/lodash.compat.js", "main/deps/lodash/dist/lodash.compat.js");
require.alias("lodash-lodash/dist/lodash.compat.js", "main/deps/lodash/index.js");
require.alias("lodash-lodash/dist/lodash.compat.js", "lodash/index.js");
require.alias("lodash-lodash/dist/lodash.compat.js", "lodash-lodash/index.js");
require.alias("component-tip/index.js", "main/deps/tip/index.js");
require.alias("component-tip/index.js", "tip/index.js");
require.alias("component-bind/index.js", "component-tip/deps/bind/index.js");

require.alias("component-emitter/index.js", "component-tip/deps/emitter/index.js");

require.alias("component-query/index.js", "component-tip/deps/query/index.js");

require.alias("component-events/index.js", "component-tip/deps/events/index.js");
require.alias("component-event/index.js", "component-events/deps/event/index.js");

require.alias("component-delegate/index.js", "component-events/deps/delegate/index.js");
require.alias("component-closest/index.js", "component-delegate/deps/closest/index.js");
require.alias("component-closest/index.js", "component-delegate/deps/closest/index.js");
require.alias("component-matches-selector/index.js", "component-closest/deps/matches-selector/index.js");
require.alias("component-query/index.js", "component-matches-selector/deps/query/index.js");

require.alias("component-closest/index.js", "component-closest/index.js");
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
require.alias("component-type/index.js", "component-each/deps/type/index.js");

require.alias("component-to-function/index.js", "component-each/deps/to-function/index.js");
require.alias("component-props/index.js", "component-to-function/deps/props/index.js");

require.alias("visionmedia-debug/browser.js", "component-css/deps/debug/browser.js");
require.alias("visionmedia-debug/debug.js", "component-css/deps/debug/debug.js");
require.alias("visionmedia-debug/browser.js", "component-css/deps/debug/index.js");
require.alias("guille-ms.js/index.js", "visionmedia-debug/deps/ms/index.js");

require.alias("visionmedia-debug/browser.js", "visionmedia-debug/index.js");
require.alias("ianstormtaylor-to-camel-case/index.js", "component-css/deps/to-camel-case/index.js");
require.alias("ianstormtaylor-to-space-case/index.js", "ianstormtaylor-to-camel-case/deps/to-space-case/index.js");
require.alias("ianstormtaylor-to-no-case/index.js", "ianstormtaylor-to-space-case/deps/to-no-case/index.js");

require.alias("component-within-document/index.js", "component-css/deps/within-document/index.js");

require.alias("component-css/index.js", "component-css/index.js");
require.alias("timoxley-offset/index.js", "component-tip/deps/offset/index.js");
require.alias("detects-dom-support/index.js", "timoxley-offset/deps/dom-support/index.js");
require.alias("ded-domready/ready.js", "detects-dom-support/deps/domready/ready.js");
require.alias("ded-domready/ready.js", "detects-dom-support/deps/domready/index.js");
require.alias("ded-domready/ready.js", "ded-domready/index.js");
require.alias("component-get-document/index.js", "timoxley-offset/deps/get-document/index.js");
require.alias("component-get-document/index.js", "timoxley-offset/deps/get-document/index.js");
require.alias("component-get-document/index.js", "component-get-document/index.js");
require.alias("component-within-element/index.js", "timoxley-offset/deps/within-element/index.js");


require.alias("main/client/index.js", "main/index.js");if (typeof exports == "object") {
  module.exports = require("main");
} else if (typeof define == "function" && define.amd) {
  define([], function(){ return require("main"); });
} else {
  this["main"] = require("main");
}})();
