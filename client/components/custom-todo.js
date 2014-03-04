
var d = React.DOM
  , todos = require('api').todos
  , Note = require('./person-note')

var CheckBox = React.createClass({
  getDefaultProps: function () {
    return {
      checked: false,
      onChange: function () {}
    }
  },
  render: function () {
    return d.i({
      onClick: this.props.onChange,
      className: 'check-box fa fa-' + (this.props.checked ? 'check-' : '') + 'square-o'
    })
  }
})

var CustomTodo = module.exports = React.createClass({
  displayName: 'CustomTodo',
  getDefaultProps: function () {
    return {
      startOpen: false,
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
  componentDidUpdate: function (props) {
    if (this.props.data.title !== this.state.title) {
      this.setState({title: this.props.data.title})
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
        d.span({
          className: 'todo__title'
        }, this.props.data.title)
      )
    }
    return d.div({
        className: cls,
      },
      d.div(
        {
          className: 'todo__head',
          onClick: this.toggleOpen
        },
        CheckBox({
          onChange: this.toggleDone,
          checked: !!this.props.data.completed
        }),
        d.input({
          className: 'todo__title custom-todo__input',
          ref: 'title',
          value: this.state.title,
          onChange: this.changeTitle,
          onClick: function (e) {e.stopPropagation()},
          onBlur: this.setTitle,
          onKeyDown: this.titleKey
        })
      ),
      Note({
        className: 'todo__note',
        value: this.props.data.note || '',
        onChange: this.props.changeNote
      }),
      d.button({
        className: 'todo__hard' + (this.props.data.hard ? ' todo__hard--depressed' : ''),
        onClick: this.props.onHard
      }, !this.props.data.hard ? 'Mark as hard' : 'Unmark as hard')
    )
  }
})


