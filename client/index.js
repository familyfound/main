
var LoginPage = require('./pages/login')
  , View = require('./view')
  , RouterMixin = require('./router')

  , Manager = require('person-manager')

function isIncompleted(todos) {
  return todos.any(function (t) {return !t.completed})
}

var App = React.createClass({
  displayName: 'App',
  getInitialState: function () {
    return {
      token: null,
      sock: null,
      manager: null,
      userData: {},
    }
  },
  getDefaultProps: function () {
    return {
      checkPath: '/auth/check-login'
    }
  },
  authorized: function (token, data) {
    var sock = io.connect(location.origin)
    sock.emit('authorize', data.personId, token, function () {
      var m = new Manager(sock)
      this.setState({
        manager: m,
        sock: sock,
        userData: data,
        token: token,
      })
      // this.loadPerson(data.personId)
    }.bind(this))
  },
  render: function () {
    if (!this.state.token) {
      return LoginPage({
        checkPath: this.props.checkPath,
        authorized: this.authorized
      })
    }
    return View({
      userData: this.state.userData,
      manager: this.state.manager,
      sock: this.state.sock
    })
  }
})

module.exports = function (el) {
  React.renderComponent(App(), el)
}

