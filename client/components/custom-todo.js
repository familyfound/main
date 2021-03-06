
var d = React.DOM
  , todos = require('api').todos
  , Note = require('./person-note')
  , CheckBox = require('./check-box')

var CustomTodo = module.exports = React.createClass({
  displayName: 'CustomTodo',
  getDefaultProps: function () {
    return {
      startOpen: false,
      onRemove: function () {},
      onTitle: function () {},
      onDone: function () {},
      onHard: function () {},
      onNote: function () {},
      data: {}
    }
  },
  getInitialState: function () {
    return {
      open: this.props.startOpen,
      title: this.props.data.title || ''
    }
  },
  componentDidUpdate: function (props, state) {
    if (props.data.title !== this.props.data.title) {
      return this.setState({title: this.props.data.title})
    }
    if (!state.open && this.state.open) {
      var node = this.refs.title.getDOMNode()
      node.selectionStart = node.selectionEnd = node.value.length
      node.focus()
      node.selectionStart = node.selectionEnd = node.value.length
    }
  },
  toggleDone: function (e) {
    if (!this.props.data.completed) this.setState({open: false})
    this.props.onDone()
    e.stopPropagation()
    return false
  },
  changeTitle: function (e) {
    this.setState({title: e.target.value})
  },
  setTitle: function () {
    if (this.state.title === this.props.data.title) return
    this.props.onTitle(this.state.title)
  },
  toggleOpen: function () {
    this.setState({open: !this.state.open})
  },
  titleKey: function (e) {
    if (e.keyCode === 13) this.refs.title.getDOMNode().blur()
  },
  render: function () {
    var cls = 'todo custom-todo'
    if (this.props.data.completed) {
      if (this.props.data.hard) {
        cls += ' todo--hard-completed'
      } else {
        cls += ' todo--completed'
      }
    } else if (this.props.data.hard) {
      cls += ' todo--hard'
    }
    if (!this.state.open) {
      return d.div(
        {
          className: cls + ' todo--collapsed',
          onClick: this.toggleOpen
        },
        d.i({
          className: 'custom-todo__collapse fa fa-angle-up',
          onClick: this.toggleOpen
        }),
        d.span({
          className: 'todo__title'
        }, this.props.data.title),
        this.props.data.note && d.i({
          className: 'todo__has-note fa fa-pencil'
        })
      )
    }
    return d.div({
        className: cls,
      },
      d.div(
        {
          className: 'todo__head',
        },
        d.input({
          className: 'todo__title custom-todo__input',
          ref: 'title',
          value: this.state.title,
          onChange: this.changeTitle,
          onClick: function (e) {e.stopPropagation()},
          onBlur: this.setTitle,
          onKeyDown: this.titleKey
        }),
        CheckBox({
          onChange: this.toggleDone,
          checked: !!this.props.data.completed
        }),
        d.i({
          className: 'custom-todo__collapse fa fa-angle-down',
          onClick: this.toggleOpen
        })
      ),
      Note({
        className: 'todo__note',
        value: this.props.data.note || '',
        onChange: this.props.onNote
      }),
      d.button({
        className: 'todo__hard' + (this.props.data.hard ? ' todo__hard--depressed' : ''),
        onClick: this.props.onHard
      }, !this.props.data.hard ? 'Mark as hard' : 'Unmark as hard'),
      d.button({
        className: 'todo__remove',
        onClick: this.props.onRemove
      }, 'remove')
    )
  }
})


