/** @jsx React.DOM */

var d = React.DOM

var Header = module.exports = React.createClass({
  displayName: 'Header',
  render: function () {
    return (
      React.DOM.div( {className:"header"}, 
        "Welcome,",
        React.DOM.span( {className:"header__name"}, 
          this.props.userData.displayName
        ),
        React.DOM.a( {className:"header__logout", href:"/logout"}, "Logout"),
        React.DOM.span( {className:"header__loading"}, 
          this.props.loadingText
        )
      )
    )
  }
})
