/** @jsx React.DOM */

var Star = require('./star')
  , Todo = require('./todo')
  , d = React.DOM
  , searchItems = require('./searches').searchItems
  , relationship = require('./relationship.js')

function findTodo(todos, type) {
  var ix = -1
  for (var i in todos) {
    if (todos[i].type === type) {ix = i; break;}
  }
  return ix
}

var Droplist = React.createClass({displayName: 'Droplist',
  displayName: 'DropList',
  getDefaultProps: function () {
    return {
      className: '',
      items: []
    }
  },
  getInitialState: function () {
    return {
      open: false,
      focused: false,
      active: false
    }
  },
  open: function () {
    this.setState({
      open: true
    })
  },
  toggle: function () {
    if (!this.state.open) return this.open()
    this.setState({open: false})
  },
  close: function (e) {
    if (e && e.suppressed) return
    this.setState({open: false})
  },
  onOpen: function () {
    document.addEventListener('mousedown', this.close)
  },
  componentDidUpdate: function () {
    if (this.state.open) {
      this.onOpen()
    } else {
      document.removeEventListener('mousedown', this.close)
    }
  },
  componentDidMount: function () {
    if (this.state.open) {
      this.onOpen()
    } else {
      document.removeEventListener('mousedown', this.close)
    }
  },
  focus: function () {
    this.setState({open: true})
  },
  suppressMouseDown: function (e) {
    if (!this.state.open) return
    e.preventDefault()
    e.stopPropagation()
    e.nativeEvent.stopPropagation()
    e.nativeEvent.suppressed = true
    return false
  },
  render: function () {
    return (
      d.div({
        tabIndex:0,
        className:'droplist ' + this.props.className + (this.state.open ? ' droplist--open' : ''),
        onMouseDown:this.suppressMouseDown
      }, [
        d.div({className:"droplist__head", onClick: this.toggle}),
        d.ul({className:"droplist__list"},
          this.props.items.map(function (value, i) {
            return (
              d.li({className: 'droplist__item'},
                d.a({href: value.href, target: '_blank', className: 'droplist__link'}, value.title)
              )
            )
          }.bind(this))
        )
      ])
    )
  },
})




function makeDropicon(person) {
  return Droplist({
    items: searchItems(person)
  })
}

var TodoPerson = module.exports = React.createClass({
  displayName: 'TodoPerson',
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
    if (!this.state.person || !this.state.person.rels || !this.state.person.data) {
      return React.DOM.div(null, "Loading")
    }
    var person = this.state.person
      , display = person.rels.display
      , place = display.birthPlace || display.deathPlace

    if (person.data.completed) {
      return (
        React.DOM.div( {className:"todo-person todo-person--completed"}, 
          React.DOM.span( {className:"todo-person__s-name"}, display.name),
          " marked as complete. ",
          React.DOM.button( {className:"todo-person__undo", onClick:this.onComplete}, "Undo")
        )
      )
    }
    var status = this.getState()

    if (status === 'no todos') {
      return (
        React.DOM.div( {className:"todo-person todo-person--no-todos"}, 
          React.DOM.span( {className:"todo-person__s-name"}, display.name), " finished! ",
          React.DOM.a( {href:this.props.personHref}, "View person page")
        )
      )
    }
    if (status === 'hard todos' && !this.props.showHard) {
      return (
        React.DOM.div( {className:"todo-person todo-person--hard-todos"}, 
          React.DOM.span( {className:"todo-person__s-name"}, display.name),
          " has only \"hard\" items. "
        )
      )
    }
    return (
      React.DOM.li( {className:"todo-person"}, 
        React.DOM.div( {className:"todo-person__top"}, 
          Star(
            {className:"todo-person__star",
            value:person.data.starred,
            onChange:this.onStar}),
          React.DOM.a( {className:"todo-person__name", href:this.props.personHref}, 
            display.name
          ),
          React.DOM.div( {className:"todo-person__lifespan"}, 
            display.lifespan
          ),
          React.DOM.a( {target:"_blank", href:'https://familysearch.org/tree/#view=ancestor&person=' + person.data.id}, 
            React.DOM.i( {className:"glyphicon glyphicon-new-window"})
          ),
          makeDropicon(person)
        ),
        React.DOM.div( {className:"todo-person__bottom"}, 
          React.DOM.span( {className:"todo-person__place"}, 
            place || 'No recorded locations'
          ),
          React.DOM.div( {className:"todo-person__relation"}, 
            person.data.lineage && relationship.text(display.gender, person.data.lineage.length)
          )
        ),
        React.DOM.ul( {className:"todo-person__todos"}, 
          person.data.todos && person.data.todos.map(function (todo) {
            return (
              React.DOM.li( {className:"todo-person__todo", key:todo.type}, 
                Todo({
                  data: todo,
                  onDone: this.onDone.bind(null, todo.type),
                  onHard: this.onHard.bind(null, todo.type)
                })
              )
            )
          }.bind(this))
        )
      )
    )
  }
})
