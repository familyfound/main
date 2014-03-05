
var d = React.DOM

var CheckBox = module.exports = React.createClass({
  getDefaultProps: function () {
    return {
      checked: false,
      onChange: function () {}
    }
  },
  render: function () {
    return d.button({
      onClick: this.props.onChange,
      className: 'check-button btn btn-primary ' + (this.props.checked ? 'active' : '')
    }, !this.props.checked ? 'mark done' : 'mark not done')
  }
})
