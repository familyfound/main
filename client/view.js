
var Header = require('./components/header')
  , Footer = require('./components/footer')
  , OverviewPage = require('./pages/overview')
  , PersonPage = require('./pages/person')
  , RouterMixin = require('./router')
  , d = React.DOM

var View = module.exports = React.createClass({
  displayName: 'View',
  mixins: [RouterMixin],
  routes: {
    '': 'overview',
    'person/:pid': 'person',
    ':pid': 'overview'
  },
  getInitialState: function () {
    return {
      numPeople: 0,
      numMorePeople: 0,
      todoPeople: null,
      loadingText: ''
    }
  },
  getDefaultProps: function () {
    return {
      checkPath: '/auth/check-login',
      manager: null
    }
  },

  componentDidMount: function () {
    if (this.props.sock) {
      for (var name in this.sevents) {
        this.props.sock.on(name, this[this.sevents[name]])
      }
    }
  },

  componentDidUpdate: function (props, state) {
    var name
    if (this.props.sock !== props.sock) {
      if (props.sock) {
        for (name in this.sevents) {
          props.sock.off(name, this[this.sevents[name]])
        }
      }
      if (this.props.sock) {
        for (name in this.sevents) {
          this.props.sock.on(name, this[this.sevents[name]])
        }
      }
    }
    if (this.state.todoPeople === null || state._route[':pid'] !== this.state._route[':pid']) {
      this.loadPerson(this.currentId())
    }
  },
  currentId: function () {
    return this.state._route[':pid'] || this.props.userData.personId
  },

  loadPerson: function (id) {
    this.setState({
      todoPeople: [],
      loadingFan: true,
      loadingTodos: true,
      numPeople: 0,
      numMorePeople: 0,
      loadedMore: false
    })
    this.props.manager.load(id, 5, 5)
  },
  loadMoreTodos: function () {
    this.setState({
      todoPeople: [],
      loadingTodos: true,
      numMorePeople: 0,
      loadedMore: true
    })
    this.props.sock.emit('get:todos', this.currentId(), 10)
  },

  // Socket event handlers
  // Hmm should this be factored out?
  sevents: {
    'person': 'onPerson',
    'person:more': 'onMorePerson',
    'pedigree:done': 'donePedigree',
    'todos:done': 'doneTodos'
  },
  onPerson: function (id, person, num) {
    this.setState({
      numPeople: num
    })
  },
  onMorePerson: function (id, person, num) {
    console.log(id, person)
    var todos = this.state.todoPeople.slice()
      , add = person.data.todos.some(function (t) {return t && !t.completed})
    if (add) {
      todos.push(id)
    }
    this.setState({
      todoPeople: todos,
      numMorePeople: num
    })
  },
  donePedigree: function (count, time) {
    if (count < this.state.numPeople) {
      count = this.state.numPeople
    }
    this.setState({
      loadingFan: false,
      numPeople: count
    })
  },
  doneTodos: function (count, time) {
    if (count < this.state.numMorePeople) {
      count = this.state.numMorePeople
    }
    this.setState({
      loadingTodos: false,
      numMorePeople: count
    })
  },

  removeTodoPerson: function (id) {
    var pp = this.state.todoPeople.slice()
    pp.splice(pp.indexOf(id), 1)
    this.setState({todoPeople: pp})
  },

  overviewPerson: function (pid) {
    this.setRoute('' + pid)
  },
  personHref: function (pid) {
    return '#person/' + pid
  },

  // display things

  mainPage: function () {
    var route = this.getRoute()
    if (route.name === 'person') {
      return PersonPage({
        id: route[':pid'],
        // overviewPerson: this.overviewPerson,
        viewPerson: this.viewPerson,
        manager: this.props.manager,
        loadingText: this.setLoadingText
      })
    }
    return OverviewPage({
      pid: route[':pid'] || this.props.userData.personId,
      overviewPerson: this.overviewPerson,
      todoPeople: this.state.todoPeople || [],
      loadMoreTodos: this.loadMoreTodos,
      loadedMore: this.state.loadedMore,
      personHref: this.personHref,
      manager: this.props.manager,
      setLoadingText: this.setLoadingText,
      removeTodoPerson: this.removeTodoPerson
    })
  },

  loadingText: function () {
    var text = ''
    if (this.state.loadingFan) {
      text += 'Loading Fan: ' + this.state.numPeople + ' '
    }
    if (this.state.loadingTodos) {
      text += 'Loading Todos: ' + this.state.numMorePeople + ' searched'
    }
    return text
  },

  render: function () {
    return d.div(
      { className: 'main-view' },
      Header({
        userData: this.props.userData,
        loadingText: this.loadingText()
      }),
      this.mainPage(),
      Footer()
    )
  }
})

