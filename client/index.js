
var LoginPage = require('./pages/login')
  , View = require('./view')

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
    this.setState({
      token: token,
      userData: data
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

