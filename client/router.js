
var Backbone = require('backbone')
  , _ = require('lodash')

function findall(rx, str) {
  var found = []
  str.replace(rx, function (match) {
    found.push(match)
    return ''
  })
  return found
}

function objDictFromRoute(route, args) {
  var names = findall(/:\w+/g, route)
    , obj = {}
  for (var i=0; i<names.length; i++) {
    obj[names[i]] = args[i]
  }
  return obj
}

module.exports = {
  getInitialState: function () {
    return {
      _route: {}
    }
  },
  getRoute: function () {
    return this.state._route
  },
  setRoute: function (dest) {
    if ('string' !== typeof dest) {
      dest = this._findRouteForObj(dest)
    }
    Backbone.history.navigate(dest, {trigger: true})
  },
  setupRoutes: function () {
    var that = this
      , routes = this.routes
    if ('function' === typeof routes) {
      routes = routes()
    }
    Object.keys(routes).forEach(function (route) {
      var rx = Backbone.Router._routeToRegExp(route)
        , name = routes[route]
      Backbone.history.route(rx, function (fragment) {
        var args = Backbone.Router._extractParameters(rx, fragment)
          , obj = objDictFromRoute(route, args)
        obj.name = name
        that.setState({
          _route: obj
        })
        Backbone.history.trigger('route', null, name, args)
      })
    })
  },
  componentDidMount: function () {
    this.setupRoutes()
    Backbone.history.start()
  }
}

