
var d = React.DOM

module.exports = React.createClass({
  getInitialState: function () {
    return {open: false, iopen: false}
  },
  toggle: function () {
    this.setState({open: !this.state.open, iopen: true})
  },
  render: function () {
    return d.div(
      {
        className: 'searcher' + (this.state.open ? ' searcher--open' : '')
      },
      d.span({
        className: 'searcher__title',
        onClick: this.toggle,
      }, this.props.item.title),
      d.iframe({
        className: 'searcher__iframe',
        src: this.state.iopen ? this.props.item.href : ''
      })
    )
  }
})