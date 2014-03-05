
var d = React.DOM
  , CustomTodo = require('./custom-todo')

var AddTodo = React.createClass({
  displayName: 'AddTodo',
  getDefaultProps: function () {
    return {
      onAdd: function () {}
    }
  },
  getInitialState: function () {
    return {
      text: ''
    }
  },
  focus: function () {
    this.refs.input.getDOMNode().focus()
  },
  onKeyDown: function (e) {
    if (e.keyCode === 13) {
      return this.add()
    }
  },
  add: function () {
    this.props.onAdd(this.state.text)
  },
  onChange: function (e) {
    this.setState({text: e.target.value})
  },
  render: function () {
    return d.div(
      {className: 'add-todo'},
      d.button({
        className: 'add-todo__btn btn btn-sm btn-primary',
        onClick: this.add
      }, d.i({className: 'fa fa-plus'})),
      d.input({
        className: 'add-todo__input',
        onChange: this.onChange,
        onKeyDown: this.onKeyDown,
        value: this.state.text,
        ref: 'input'
      })
    )
  }
})

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
  componentDidUpdate: function (props, state) {
    if (!state.adding && this.state.adding) {
      this.refs.adder.focus()
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
  showAdd: function () {
    this.setState({adding: !this.state.adding})
  },
  onAdd: function (text) {
    if (!text) return this.setState({adding: false})
    this.props.data.unshift({
      title: text,
      created: new Date(),
      completed: false,
      note: '',
      hard: false
    })
    this.setState({adding: false})
    this.props.onChange(this.props.data)
  },
  onRemove: function (i) {
    this.props.data.splice(i, 1);
    this.props.onChange(this.props.data)
  },
  render: function () {
    return d.div(
      {className: 'custom-todos'},
      d.button({
        className: 'custom-todos__add-btn',
        onClick: this.showAdd
      }, 'Add', d.i({className: 'fa fa-plus'})),
      d.h4({className: 'custom-todos__title'}, 'Custom Tasks'),
      d.ul(
        {className: 'custom-todos__list'},
        this.state.adding && AddTodo({onAdd: this.onAdd, ref: 'adder'}),
        this.props.data.map(function (task, i) {
          return d.li(
            {className: 'custom-todos__todo'},
            CustomTodo({
              onTitle: this.todoAttr.bind(null, i, 'title'),
              onNote: this.todoAttr.bind(null, i, 'note'),
              onDone: this.onDone.bind(null, i),
              onHard: this.onHard.bind(null, i),
              onRemove: this.onRemove.bind(null, i),
              data: task,
              key: i
            })
          )
        }.bind(this))
      )
    )
  }
})

