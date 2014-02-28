
var d = React.DOM

var Droplist = module.exports = React.createClass({
  displayName: 'DropList',
  getDefaultProps: function () {
    return {
      className: '',
      items: []
    }
  },
  getInitialState: function () {
    return {
      open: false,
      focused: false,
      active: false
    }
  },
  open: function () {
    this.setState({
      open: true
    })
  },
  toggle: function () {
    if (!this.state.open) return this.open()
    this.setState({open: false})
  },
  close: function (e) {
    if (e && e.suppressed) return
    this.setState({open: false})
  },
  onOpen: function () {
    document.addEventListener('mousedown', this.close)
  },
  componentDidUpdate: function () {
    if (this.state.open) {
      this.onOpen()
    } else {
      document.removeEventListener('mousedown', this.close)
    }
  },
  componentDidMount: function () {
    if (this.state.open) {
      this.onOpen()
    } else {
      document.removeEventListener('mousedown', this.close)
    }
  },
  focus: function () {
    this.setState({open: true})
  },
  suppressMouseDown: function (e) {
    if (!this.state.open) return
    e.preventDefault()
    e.stopPropagation()
    e.nativeEvent.stopPropagation()
    e.nativeEvent.suppressed = true
    return false
  },
  render: function () {
    return (
      d.div({
        tabIndex:0,
        className:'droplist ' + this.props.className + (this.state.open ? ' droplist--open' : ''),
        onMouseDown:this.suppressMouseDown
      }, [
        d.div({className:"droplist__head", onClick: this.toggle}),
        d.ul({className:"droplist__list"},
          this.props.items.map(function (value, i) {
            return (
              d.li({className: 'droplist__item'},
                d.a({href: value.href, target: '_blank', className: 'droplist__link'}, value.title)
              )
            )
          }.bind(this))
        )
      ])
    )
  },
})



