
var d = React.DOM
  , utils = require('../../lib/utils')

var Note = module.exports = React.createClass({
  displayName: 'Note',
  getDefaultProps: function () {
    return {
      className: '',
      onChange: function () {},
      text: ''
    }
  },
  getInitialState: function () {
    return {
      open: false, text: this.props.value,
      onChange: function () {}
    }
  },
  componentWillReceiveProps: function (props) {
    if (!this.state.open) {
      this.state.text = props.value
    }
  },
  componentDidUpdate: function (props, state) {
    if (state.open || !this.state.open) return
    var node = this.refs.input.getDOMNode()
    node.focus()
    node.selectionEnd = node.selectionStart = node.value.length
  },
  open: function () {
    if (this.state.open) return
    this.setState({open: true})
  },
  staticContent: function () {
    var items = utils.findLinks(this.state.text).map(function (chunk) {
      if (Array.isArray(chunk)) {
        return d.a({
          href: chunk[0],
          target: '_blank'
        }, chunk[1])
      }
      return chunk
    })
    return d.span.apply(d, [{
      className: 'note__static'
    }].concat(items))
  },
  body: function () {
    if (!this.state.open) {
      if (!this.state.text) {
        return d.span({
          className: 'note__empty',
          onClick: this.open
        }, 'Click to add a note')
      }
      return this.staticContent()
    }
    return d.textarea({
      className: 'note__input',
      ref: 'input',
      value: this.state.text,
      onChange: this.onChange,
      onKeyDown: this.onKeyDown,
      onBlur: this.action
    })
  },
  onKeyDown: function (e) {
    if (e.keyCode === 13 && e.shiftKey) {
      this.action()
    }
  },
  onChange: function (e) {
    this.setState({text: e.target.value})
  },
  onDown: function (e) {
    if (this.state.open) {
      e.preventDefault()
      e.stopPropagation()
    }
  },
  action: function () {
    if (!this.state.open) return this.open()
    this.setState({open: false})
    if (this.state.text === this.props.value) return
    this.props.onChange(this.state.text)
  },
  render: function () {
    var cname = this.props.className + ' note' 
    if (this.state.open) cname += ' note--open' 
    if (!this.props.value) cname += ' note--empty' 
    return d.div({
      className: cname,
      onClick: this.open
    }, this.body(), d.button({
      className: 'note__button',
      onClick: this.action,
      onMouseDown: this.onDown
    }))
  }
})


