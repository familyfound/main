/** @jsx React.DOM */

var Star = require('./star')
  , Todo = require('./todo')

function findTodo(todos, type) {
  var ix = -1
  for (var i in todos) {
    if (todos[i].type === type) {ix = i; break;}
  }
  return ix
}

var TodoPerson = module.exports = React.createClass({
  getInitialState: function () {
    return {person: {}}
  },
  componentDidMount: function () {
    this.props.manager.on(this.props.id, this.gotData)
  },
  componentWillUnmount: function () {
    this.props.manager.off(this.props.id, this.gotData)
  },
  componentDidUpdate: function (prevProps) {
    if (prevProps.id !== this.props.id) {
      this.props.manager.off(prevProps.id, this.gotData)
      this.props.manager.on(this.props.id, this.gotData)
    }
  },
  gotData: function (data) {
    this.setState({person: data})
  },
  onDone: function (type) {
    var todos = this.state.person.data.todos
      , ix = findTodo(todos, type)
    if (ix === -1) {
      console.error('tried to mark', type, 'as done but not found')
      return
    }
    if (todos[ix].completed) {
      todos[ix].completed = false
    } else {
      todos[ix].completed = new Date()
    }
    // ughhh mutating state...
    this.setState({person: this.state.person})
    this.props.manager.setTodoDone(this.props.id, type, todos[ix].completed)
  },
  onHard: function (type) {
    var todos = this.state.person.data.todos
      , ix = findTodo(todos, type)
    if (ix === -1) {
      console.error('tried to mark', type, 'as done but not found')
      return
    }
    if (todos[ix].hard) {
      todos[ix].hard = false
    } else {
      todos[ix].hard = new Date()
    }
    // ughhh mutating state...
    this.setState({person: this.state.person})
    this.props.manager.setTodoHard(this.props.id, type, todos[ix].hard)
  },

  onComplete: function () {
    var data = this.state.person.data
    if (data.completed) {
      data.completed = false
    } else {
      data.completed = new Date()
    }
    this.setState({person: this.state.person})
    this.props.manager.setCompleted(this.props.id, data.completed)
    // if (this.sortedPeople().length === 0) this.props.loadMorePeople()
  },

  onStar: function () {
    var data = this.state.person.data
    if (data.starred) {
      data.starred = false
    } else {
      data.starred = new Date()
    }
    this.setState({person: this.state.person})
    this.props.manager.setStarred(this.props.id, data.starred)
  },

  getState: function () {
    var hard = []
      , todos = []
    if (this.state.person.data.completed) {
      return 'completed'
    }
    this.state.person.data.todos.forEach(function (todo){
      if (todo.completed) return
      if (todo.hard) {
        hard.push(todo)
        return
      }
      todos.push(todo)
    })
    if (todos.length) return 'todos'
    if (hard.length) return 'hard todos'
    return 'no todos'
  },

  render: function () {
    if (!this.state.person || !this.state.person.rels) {
      return <div>Loading</div>
    }
    var person = this.state.person
      , display = person.rels.display
      , place = display.birthPlace || display.deathPlace

    if (person.data.completed) {
      return (
        <div className='todo-person todo-person--completed'>
          <span className='todo-person__s-name'>{display.name}</span>
          marked as complete.
          <button className='todo-person__undo' onClick={this.onComplete}>Undo</button>
        </div>
      )
    }
    var status = this.getState()

    if (status === 'no todos') {
      return (
        <div className='todo-person todo-person--no-todos'>
          <span className='todo-person__s-name'>{display.name}</span> finished!
          <a href={this.props.personHref}>View person page</a>
        </div>
      )
    }
    if (status === 'hard todos' && !this.props.showHard) {
      return (
        <div className='todo-person todo-person--hard-todos'>
          <span className='todo-person__s-name'>{display.name}</span>
          has only "hard" items.
        </div>
      )
    }
    return (
      <div className='todo-person'>
        <div className='todo-person__top'>
          <button
            className='todo-person__complete'
            onClick={this.onComplete}>
            Complete / Ignore
          </button>
          <Star
            className='todo-person__star'
            value={person.data.starred}
            onChange={this.onStar}/>
          <span className='todo-person__name'>
            {display.name}
          </span>
          <div className='todo-person__lifespan'>
            {display.lifespan}
          </div>
        </div>
        <div className='todo-person__bottom'>
          <span className='todo-person__place'>
            {place || 'No recorded locations'}
          </span>
        </div>
        <ul className='todo-person__todos'>
          {person.data.todos && person.data.todos.map(function (todo) {
            return (
              <li className='todo-person__todo' key={todo.type}>{
                Todo({
                  data: todo,
                  onDone: this.onDone.bind(null, todo.type),
                  onHard: this.onHard.bind(null, todo.type)
                })
              }</li>
            )
          }.bind(this))}
        </ul>
      </div>
    )
  }
})

