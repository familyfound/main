/** @jsx React.DOM */

var d = React.DOM
  , Breadcrumb = require('./breadcrumb')

var Header = module.exports = React.createClass({
  displayName: 'Header',
  render: function () {
    return (
      <div className="header">
        Welcome,
        <span className='header__name'>
          {this.props.userData.displayName}
        </span>
        <a className='header__logout' href='/logout'>Logout</a>
        <span className='header__loading'>
          {this.props.loadingText}
        </span>
        <Breadcrumb manager={this.props.manager} id={this.props.pid} personHref={this.props.personHref}/>
      </div>
    )
  }
})

