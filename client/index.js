
var LoginPage = require('login-page')

React.renderComponent(LoginPage({checkPath: '/auth/check-login'})

var App = React.createClass({
  getInitialState: function () {
    return {
      token: null
    }
  },
  gotToken: function (token) {
    this.setState({token: token})
  },
  render: function () {
    if (!this.state.token) {
      return LoginPage({
        checkPage: this.props.checkPage,
        gotToken: this.gotToken
      })
    }
    return View({token: this.state.token})
  }
})

