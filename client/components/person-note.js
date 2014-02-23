
var d = React.DOM

var PersonNote = module.exports = React.createClass({
  displayName: 'PersonNote',
  getInitialState: function () {
    return {open: false, text: this.props.value}
  },
  componentWillReceiveProps: function (props) {
    if (!this.state.open) {
      this.state.text = props.value
    }
  },
  componentDidUpdate: function (props, state) {
    if (state.open || !this.state.open) return
    this.refs.input.getDOMNode().focus()
  },
  open: function () {
    if (this.state.open) return
    this.setState({open: true})
  },
  body: function () {
    if (!this.state.open) {
      if (!this.state.text) {
        return d.span({
          className: 'person-note__empty',
          onClick: this.open
        }, 'Click to add a note')
      }
      return d.span({
        className: 'person-note__static'
      }, this.state.text)
    }
    return d.textarea({
      className: 'person-note__input',
      ref: 'input',
      value: this.state.text,
      onChange: this.onChange
    })
  },
  onChange: function (e) {
    this.setState({text: e.target.value})
  },
  action: function () {
    if (!this.state.open) return this.open()
    this.setState({open: false})
    if (this.state.text === this.props.text) return
    this.props.onChange(this.state.text)
  },
  render: function () {
    return d.div({
      className: 'person-note' + (this.state.open ? ' person-note--open' : ''),
      onClick: this.open
    }, this.body(), d.button({
      className: 'person-note__button',
      onClick: this.action
    }))
  }
})


