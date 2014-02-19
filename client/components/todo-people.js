
var d = React.DOM
  , TodoPerson = require('./todo-person')

var TodoPeople = module.exports = React.createClass({
  getInitialState: function () {
    return {showHard: false}
  },
  toggleHard: function () {
    this.setState({showHard: !this.state.showHard})
  },
  render: function () {
    return d.ul({
      className: 'todo-people'
    },
    d.li(
      {},
      d.button(
        {className: 'todo-people__show-hard', onClick: this.toggleHard},
        this.state.showHard ? 'Hide hard people' : 'Show hard people'
      ),
      !this.props.loadedMore && d.button(
        {className: 'todo-people__load-more', onClick: this.props.loadMoreTodos},
        'Find more things'
      )
    ),
    this.props.people.map(function (id) {
      return TodoPerson({
        showHard: this.state.showHard,
        overviewPerson: this.props.overviewPerson,
        viewPerson: this.props.viewPerson,
        manager: this.props.manager,
        personHref: this.props.personHref(id),
        removePerson: this.props.removePerson.bind(null, id),
        id: id
      })
    }.bind(this)),
    !this.props.people.length && d.li({className: 'todo-people__loading'}, 'Searching your tree for things to do...'))
  }
})

