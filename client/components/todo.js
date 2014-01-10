
var d = React.DOM

var Todo = module.exports = React.createClass({
  render: function () {
    var cls = 'todo'
    if (this.props.data.completed) cls += ' todo--completed'
    if (this.props.data.hard) cls += ' todo--hard'
    return d.div({
        className: cls
      },
      d.input({
        className: 'todo__box',
        type: 'checkbox',
        value: !!this.props.data.completed,
        onChange: this.props.onDone,
      }),
      d.span({
        className: 'todo__title',
      }, this.props.data.type),
      d.button({
        className: 'todo__hard' + (this.props.data.hard ? ' todo__hard--depressed' : ''),
        onClick: this.props.onHard
      }, 'Hard')
    )
  }
})

