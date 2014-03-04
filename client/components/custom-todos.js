
var d = React.DOM
  , CustomTodo = require('./custom-todo')

var CustomTodos = module.exports = React.createClass({
  displayName: 'CustomTodos',
  getDefaultProps: function () {
    return {
      onChange: function () {},
      data: []
    }
  },
  getInitialState: function () {
    return {
      adding: false
    }
  },
  onDone: function (i) {
    var value = !this.props.data[i].completed && new Date()
    this.todoAttr(i, 'completed', value)
  },
  onHard: function (i) {
    var value = !this.props.data[i].hard && new Date()
    this.todoAttr(i, 'hard', value)
  },
  todoAttr: function (i, what, value) {
    this.props.data[i][what] = value
    this.props.onChange(this.props.data)
  },
  render: function () {
    return d.div(
      {className: 'custom-todos'},
      d.button(
        {className: 'custom-todos__add-btn btn btn-default'},
        'Add',
        d.i({className: 'fa fa-plus'})
      ),
      d.h4({className: 'custom-todos__title'}, 'Custom Tasks'),
      d.ul(
        {className: 'custom-todos__list'},
        this.props.data.map(function (task, i) {
          return d.li(
            {className: 'custom-todos__todo'},
            CustomTodo({
              onTitle: this.todoAttr.bind(null, i, 'title'),
              onNote: this.todoAttr.bind(null, i, 'note'),
              onDone: this.onDone.bind(null, i),
              onHard: this.onHard.bind(null, i),
              data: task,
              key: i
            })
          )
        }.bind(this))
      )
    )
  }
})

