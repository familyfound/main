
var LoginPage = require('./pages/login')
  , View = require('./view')
  , Manager = require('person-manager')

function isIncompleted(todos) {
  return todos.any(function (t) {return !t.completed})
}

var App = React.createClass({
  getInitialState: function () {
    return {
      token: null,
      todoPeople: [],
      userData: {}
    }
  },
  getDefaultProps: function () {
    return {
      checkPath: '/auth/check-login'
    }
  },
  authorized: function (token, data) {
    var sock = io.connect(location.origin)
    // sock.on('person', this.funCounter)
    sock.on('more_person', this.morePerson)
    sock.emit('authorize', data.personId, token, function () {
      var m = new Manager(sock)
      this.setState({
        manager: m,
        userData: data,
        token: token,
        loadingFan: true,
        loadingTodos: true,
        funCount: 0
      })
      m.load(data.personId, 5, 1, this.loadedFan, this.loadedTodos)
    }.bind(this))
  },
  morePerson: function (id, person) {
    console.log(id, person)
    var todos = this.state.todoPeople.slice()
      , add = person.data.todos.some(function (t) {return !t.completed})
    if (add) {
      todos.push(id)
    }
    this.setState({
      todoPeople: todos,
      funCount: this.state.funCount + 1
    })
  },
  funCounter: function () {
    this.setState({
      funCount: this.state.funCount + 1
    })
  },
  loadedFan: function (count, depth) {
    this.setState({
      loadingFan: false
    })
  },
  loadedTodos: function (count, depth) {
    this.setState({
      loadingTodos: false
    })
  },
  removeTodoPerson: function (id) {
    var pp = this.state.todoPeople.slice()
    pp.splice(pp.indexOf(id), 1)
    this.setState({todoPeople: pp})
  },
  render: function () {
    if (!this.state.token) {
      return LoginPage({
        checkPath: this.props.checkPath,
        authorized: this.authorized
      })
    }
    var loadingText = ''
    if (this.state.loadingTodos || this.state.loadingFan) {
      loadingText = 'Looked through ' + this.state.funCount + ' people';
    }
    return View({
      todoPeople: this.state.todoPeople,
      userData: this.state.userData,
      manager: this.state.manager,
      token: this.state.token,
      loadingText: loadingText,
      removeTodoPerson: this.removeTodoPerson
    })
  }
})

module.exports = function (el) {
  React.renderComponent(App(), el)
}

