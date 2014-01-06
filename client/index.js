
var LoginPage = require('login-page')

var App = React.createClass({
  getInitialState: function () {
    return {
      token: null
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
        checkPage: this.props.checkPage,
        authorized: this.authorized
      })
    }
    return View({token: this.state.token})
  }
})

React.renderComponent(LoginPage({checkPath: '/auth/check-login'})

