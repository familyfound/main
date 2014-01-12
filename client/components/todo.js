
var d = React.DOM

  , todos = require('api').todos

var Todo = module.exports = React.createClass({
  onClick: function (e) {
    if (e.target !== this.getDOMNode()) return
    this.props.onDone()
  },
  render: function () {
    var cls = 'todo'
    if (this.props.data.completed) {
      if (this.props.data.hard) {
        cls += ' todo--hard-completed'
      } else {
        cls += ' todo--completed'
      }
    } else if (this.props.data.hard) {
      cls += ' todo--hard'
    }
    return d.div({
        className: cls,
        onClick: this.onClick
      },
      d.button({
        className: 'todo__hard' + (this.props.data.hard ? ' todo__hard--depressed' : ''),
        onClick: this.props.onHard
      }, 'Hard'),
      d.input({
        className: 'todo__box',
        type: 'checkbox',
        checked: !!this.props.data.completed,
        onChange: this.props.onDone,
      }),
      d.span({
        className: 'todo__title',
        onClick: this.props.onDone,
      }, todos.titles[this.props.data.type])
    )
  }
})

