
var d = React.DOM
  , TodoPerson = require('./todo-person')

var TodoPeople = module.exports = React.createClass({
  getInitialState: function () {
    return {
    }
  },
  updateListeners: function (prev) {
    var data = {}
    prev = prev || []
    this.props.people.forEach(function (id) {
      if (prev.indexOf(id) !== -1) return
      this._listeners[id] = function (person) {
        var s = {}
        s[id] = person
        this.setState(s)
      }.bind(this)
      this.props.manager.on(id, this._listeners[id])
    }.bind(this))
    prev.forEach(function (id) {
      if (this.props.people.indexOf(id) !== -1) return
      this.props.manager.off(id, this._listeners[id])
      delete this._listeners[id]
    }.bind(this))
  },
  componentDidMount: function () {
    this._listeners = {}
    this.updateListeners()
  },
  componentDidUpdate: function (prevProps) {
    this.updateListeners(prevProps.people)
    // var people = this.sortedPeople()
    // if (!people.length) this.props.noMorePeople()
  },
  onComplete: function (id) {
    var data = this.state[id] && this.state[id].data || {}
    data.completed = new Date()
    var s = {}
    s[id] = data
    this.setState(s)
    this.props.manager.setCompleted(id, new Date())
    // if (this.sortedPeople().length === 0) this.props.loadMorePeople()
  },
  onStar: function (id) {
    var data = this.state[id] && this.state[id].data || {}
    data.starred = new Date()
    var s = {}
    s[id] = data
    this.setState(s)
    this.props.manager.setAttr(id, 'data', data, function () {})
  },
  toDone: function (id, type) {
    var data = this.state[id] && this.state[id].data || {}
    if (!data.todos) return
    for (var i=0; i<data.todos.length; i++) {
      if (data.todos[i].type === type) {
        if (data.todos[i].completed) data.todos[i].completed = false
        else data.todos[i].completed = new Date()
        break
      }
    }
    var s = {}
    s[id] = data
    this.setState(s)
    this.props.manager.todoHard(id, type, data.todos[i].completed)
    // if (this.sortedPeople().length === 0) this.props.loadMorePeople()
  },
  toHard: function (id, type) {
  },
  sortedPeople: function () {
    var people = []
      , data
      , id
    for (var i in this.props.people) {
      id = this.props.people[i]
      data = this.state[id]
      if (data && data.data && data.data.completed) continue;
      if (!data || !data.data || !data.data.todos || !data.data.todos.length) continue;
      people.push([id, data])
    }
    return people
  },
  render: function () {
    return d.ul({
      className: 'todo-people',
    },
    this.sortedPeople().map(function (person) {
      var id = person[0]
      return TodoPerson({
        overviewPerson: this.props.overviewPerson,
        viewPerson: this.props.viewPerson,
        onComplete: this.onComplete.bind(null, id),
        onStar: this.onStar.bind(null, id),
        toDone: this.toDone.bind(null, id),
        toHard: this.toHard.bind(null, id),
        data: person[1]
      })
    }.bind(this)))
  }
})

