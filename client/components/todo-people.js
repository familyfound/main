
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
    return d.div({
      className: 'todo-people'
    },
    d.h2({className: 'todo-people__title'}, 'People to work on'),
    d.div(
      {className: 'todo-buttons'},
      d.button(
        {className: 'btn btn-default todo-people__show-hard', onClick: this.toggleHard},
        this.state.showHard ? 'Hide hard people' : 'Show hard people'
      ),
      !this.props.loading.more && d.button(
        {className: 'btn btn-default todo-people__load-more', onClick: this.props.loadMoreTodos},
        'Keep Searching'
      )
    ),
    d.ul(
      {className: 'todo-people__list'},
      this.props.people.map(function (id) {
        return d.li({key: id},
          TodoPerson({
          showHard: this.state.showHard,
          overviewPerson: this.props.overviewPerson,
          viewPerson: this.props.viewPerson,
          manager: this.props.manager,
          personHref: this.props.personHref(id),
          removePerson: this.props.removePerson.bind(null, id),
          id: id
        }))
      }.bind(this)),
      !this.props.people.length && d.li({className: 'todo-people__loading'}, 'Searching your tree for things to do...'))
    )
  }
})

