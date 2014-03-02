
var d = React.DOM

var Star = module.exports = React.createClass({
  render: function () {
    return d.i({
      className: 'fa star fa-star' + (this.props.value ? ' star-filled' : '-o'),
      onClick: this.props.onChange
    })
  }
})

