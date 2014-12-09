/** @jsx React.DOM */

var fsauth = require('fsauth')

var LoginPage = module.exports = React.createClass({
  displayName: 'LoginPage',
  getDefaultProps: function () {
    return {
      checkPath: '/auth/check-login',
      codePath: '/auth/get-code',
      authorized: function () {}
    }
  },
  getInitialState: function () {
    return {
      status: 'loading',
      auth_url: null,
      error: false,
      data: {},
    }
  },
  componentWillMount: function () {
    this.setState({
      status: 'loading'
    })
    fsauth(this.props.checkPath, this.props.codePath, function (err, token, data) {
      if (err) {
        this.setState({
          status: 'error',
          error: err
        })
        return
      }
      this.setState({
        status: 'done',
        data: data,
        error: err
      })
      this.props.authorized(token, data)
    }.bind(this))
  },
  center: function () {
    if (this.state.status === 'loading') {
      return (
        React.DOM.div( {className:"login-page__loading"}, 
          "Loading ", React.DOM.i( {className:"login-page__loading-indicator"})
        )
      )
    }
    if (this.state.status === 'error') {
      return (
        React.DOM.div( {className:"login-page__error"}, 
          React.DOM.h3( {className:"login-page__error__title"}, 
            "An error occurred while logging in."
          ),
          "Try ", React.DOM.a( {href:"/", className:"login-page__reload"}, "reloading"), " the"+' '+
          "page or please ", React.DOM.a( {href:"https://github.com/familyfound/familyfound/issues"}, "report this problem"),"."
        )
      )
    }
    if (this.state.status === 'done') {
      return (
        React.DOM.h3( {className:"login-page__done"}, "Successfully logged in!")
      )
    }
    return (
      React.DOM.iframe( {className:"login-page__iframe", src:this.state.auth_url + '&template=mobile'})
    )
  },
  render: function () {
    return (
      React.DOM.div( {className:"login-page"}, 
        React.DOM.section( {className:"login-page__left"}
        ),
        React.DOM.section( {className:"login-page__middle"}, 
          this.center()
        ),
        React.DOM.section( {className:"login-page__right"}
        )
      )
    )
  },
})
