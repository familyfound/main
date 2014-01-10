
var LoginPage = require('./pages/login')
  , View = require('./view')
  , Manager = require('person-manager')

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
    sock.on('person', this.funCounter)
    sock.on('more_person', this.morePerson)
    console.log('h on auth')
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
      m.load(data.personId, 1, 10, this.loadedFan, this.loadedTodos)
    }.bind(this))
  },
  morePerson: function (id, person) {
    var todos = this.state.todoPeople.slice()
    if (person.data.todos.length) {
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
  render: function () {
    if (!this.state.token) {
      return LoginPage({
        checkPath: this.props.checkPath,
        authorized: this.authorized
      })
    }
    return View({
      todoPeople: this.state.todoPeople,
      userData: this.state.userData,
      manager: this.state.manager,
      token: this.state.token
    })
  }
})

module.exports = function (el) {
  React.renderComponent(App(), el)
}

