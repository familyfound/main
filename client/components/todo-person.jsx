/** @jsx React.DOM */

var Star = require('./star')
  , Todo = require('./todo')
  , PersonNote = require('./person-note')
  , d = React.DOM
  , searchItems = require('./searches').searchItems
  , relationship = require('./relationship.js')
  , Droplist = require('./droplist')

function findTodo(todos, type, key) {
  for (var i in todos) {
    if (todos[i].type === type && (!key || todos[i].key === key)) {return i}
  }
  return -1
}


function makeDropicon(person) {
  return Droplist({
    items: searchItems(person)
  })
}

var TodoPerson = module.exports = React.createClass({
  displayName: 'TodoPerson',
  getDefaultProps: function () {
    return {
      manager: null,
      id: null,
      showHard: false,
      personHref: '',
      showAnyway: false,
      initialData: {}
    }
  },
  getInitialState: function () {
    return {person: this.props.initialData}
  },
  componentDidMount: function () {
    if (!this.props.manager) return
    this.props.manager.on(this.props.id, this.gotData)
  },
  componentWillUnmount: function () {
    if (!this.props.manager) return
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

  todoNote: function (type, key, value) {
    var todos = this.state.person.data.todos
      , ix = findTodo(todos, type, key)
    if (ix === -1) {
      console.error('tried to mark', type, 'as done but not found')
      return
    }
    todos[ix].note = value
    // ughhh mutating state...
    this.setState({person: this.state.person})
    if (!this.props.manager) return
    this.props.manager.setTodoNote(this.props.id, type, key, value)
  },

  onDone: function (type, key) {
    var todos = this.state.person.data.todos
      , ix = findTodo(todos, type, key)
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
    if (!this.props.manager) return
    this.props.manager.setTodoDone(this.props.id, type, key, todos[ix].completed)
  },

  onHard: function (type, key) {
    var todos = this.state.person.data.todos
      , ix = findTodo(todos, type, key)
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
    if (!this.props.manager) return
    this.props.manager.setTodoHard(this.props.id, type, key, todos[ix].hard)
  },

  onComplete: function () {
    var data = this.state.person.data
    if (data.completed) {
      data.completed = false
    } else {
      data.completed = new Date()
    }
    this.setState({person: this.state.person})
    if (!this.props.manager) return
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
    if (!this.props.manager) return
    this.props.manager.setStarred(this.props.id, data.starred)
  },

  changeNote: function (text) {
    this.state.person.data.note = text
    this.setState({person: this.state.person})
    if (!this.props.manager) return
    this.props.manager.setNote(this.props.id, text)
  },

  getState: function () {
    var hard = []
      , todos = []
    if (this.state.person.data.completed) {
      return 'completed'
    }
    if (!this.state.person.data.todos) {
      return 'no todos'
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
    if (!this.state.person || !this.state.person.data) {
      return <div>Loading</div>
    }
    var person = this.state.person
      , display = (person.rels || person.data).display
      , place = display.birthPlace || display.deathPlace
      , showAnyway = this.props.showAnyway

    if (!showAnyway && person.data.completed) {
      return (
        <div className='todo-person todo-person--completed'>
          <span className='todo-person__s-name'>{display.name || '[No Name]'}</span>
          marked as complete.
          <button className='todo-person__undo' onClick={this.onComplete}>Undo</button>
        </div>
      )
    }
    var status = this.getState()

    if (!showAnyway && status === 'no todos') {
      return (
        <div className='todo-person todo-person--no-todos'>
          <span className='todo-person__s-name'>{display.name || '[No Name]'}</span> finished!
        </div>
      )
    }
    if (!showAnyway && status === 'hard todos' && !this.props.showHard) {
      return (
        <div className='todo-person todo-person--hard-todos'>
          <span className='todo-person__s-name'>{display.name || '[No Name]'}</span>
          has only "hard" items.
        </div>
      )
    }
          // {makeDropicon(person)}
    return (
      <div className='todo-person'>
        <div className='todo-person__top'>
          <Star
            className='todo-person__star'
            value={person.data.starred}
            onChange={this.onStar}/>
          <a className='todo-person__name' href={this.props.personHref}>
            {display.name || '[No Name]'}
          </a>
          <div className='todo-person__lifespan'>
            {display.lifespan}
          </div>
          <a target='_blank' href={'https://familysearch.org/tree/#view=ancestor&person=' + person.data.id}>
            {person.data.id} on fs <i className='glyphicon glyphicon-new-window'/>
          </a>
        </div>
        <div className='todo-person__bottom'>
          <span className='todo-person__place'>
            {place || 'No recorded locations'}
          </span>
          <div className='todo-person__relation'>
            {person.data.lineage && relationship.text(display.gender, person.data.lineage.length)}
          </div>
        </div>
        <h4 className='todo-person__tasks-title'>Tasks</h4>
        <ul className='todo-person__todos'>
          {person.data.todos && person.data.todos.map(function (todo) {
            return (
              <li className='todo-person__todo' key={todo.type + ':' + todo.key}>{
                Todo({
                  data: todo,
                  onDone: this.onDone.bind(null, todo.type, todo.key),
                  onHard: this.onHard.bind(null, todo.type, todo.key),
                  changeNote: this.todoNote.bind(null, todo.type, todo.key)
                })
              }</li>
            )
          }.bind(this))}
        </ul>
      </div>
    )
  }
})

