
var d = React.DOM

var Star = module.exports = React.createClass({
  render: function () {
    return d.i({
      className: 'star' + (this.props.value ? ' star-filled' : ''),
      onClick: this.props.onChange
    })
  }
})

