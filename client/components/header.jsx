/** @jsx React.DOM */

var d = React.DOM

var Header = module.exports = React.createClass({
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
      </div>
    )
  }
})

