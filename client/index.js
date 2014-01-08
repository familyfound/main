
var LoginPage = require('./pages/login')
  , View = require('./view')
  , Manager = require('person-manager')

var App = React.createClass({
  getInitialState: function () {
    return {
      token: null,
      userData: {}
    }
  },
  getDefaultProps: function () {
    return {
      checkPath: '/auth/check-login'
    }
  },
  authorized: function (token, data) {
    var sock = io.connect(location.origin)
    sock.on('person', this.funCounter)
    sock.on('more_person', this.funCounter)
    sock.emit('authorize', token, function () {
      var m = new Manager(sock)
      this.setState({
        manager: m,
        userData: data,
        token: token,
        loadingFan: true,
        loadingTodos: true,
        funCount: 0
      })
      m.load(data.personId, 5, 10, this.loadedFan, this.loadedTodos)
    }.bind(this))
  },
  funCounter: function () {
    this.setState({
      funCount: this.state.funCount + 1
    })
  },
  loadedFan: function (count, depth) {
    this.setState({
      loadingFan: false
    })
  },
  loadedTodos: function (count, depth) {
    this.setState({
      loadingTodos: false
    })
  },
  render: function () {
    if (!this.state.token) {
      return LoginPage({
        checkPath: this.props.checkPath,
        authorized: this.authorized
      })
    }
    return View({
      token: this.state.token,
      userData: this.state.userData
    })
  }
})

module.exports = function (el) {
  React.renderComponent(App(), el)
}

