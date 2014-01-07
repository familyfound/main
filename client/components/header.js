
var d = React.DOM

var Header = module.exports = React.createClass({
  render: function () {
    return d.h1(null, 'Head me up! ' + this.props.userData.displayName)
  }
})

