/** @jsx React.DOM */

var LoginPage = React.createClass({
  getDefaultProps: function () {
    return {
      checkPage: '/auth/check-login',
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
    fsauth(this.props.checkPage, function (err, url) {
      this.setState({
        status: 'oauth',
        auth_url: url,
        error: err
      })
    }.bind(this), function (err, token, data) {
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
        <div className='login-page__loading'>
          Loading <i className='login-page__loading-indicator'/>
        </div>
      )
    }
    if (this.state.status === 'error') {
      return (
        <div className='login-page__error'>
          <h3 className='login-page__error__title'>
            An error occurred while logging in.
          </h3>
          Try <a href='/' className='login-page__reload'>reloading</a> the
          page or please <a href='https://github.com/familyfound/familyfound/issues'>report this problem</a>.
        </div>
      )
    }
    if (this.state.status === 'done') {
      return (
        <h3 className='login-page__done'>Successfully logged in!</h3>
      )
    }
    return (
      <iframe className='login-page__iframe' src={this.state.auth_url}/>
    )
  },
  render: function () {
    return (
      <div className='login-page'>
        <section className='login-page__left'>
        </section>
        <section className='login-page__middle'>
          {this.center()}
        </section>
        <section className='login-page__right'>
        </section>
      </div>
    )
  },
})

