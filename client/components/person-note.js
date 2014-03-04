
var d = React.DOM

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
          className: 'note__empty',
          onClick: this.open
        }, 'Click to add a note')
      }
      return d.span({
        className: 'note__static'
      }, this.state.text)
    }
    return d.textarea({
      className: 'note__input',
      ref: 'input',
      value: this.state.text,
      onChange: this.onChange,
      onBlur: this.action
    })
  },
  onChange: function (e) {
    this.setState({text: e.target.value})
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
      onClick: this.action
    }))
  }
})


