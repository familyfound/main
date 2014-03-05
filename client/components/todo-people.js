
var d = React.DOM
  , TodoPerson = require('./todo-person')

var TodoPeople = module.exports = React.createClass({
  getInitialState: function () {
    return {}
  },
  loadingMessage: function () {
    if (!this.props.loading.todos) return false
    var got = this.props.people.length
      , searched = this.props.loading.morepeople
      , want = this.props.loading.more ? 10 : 5
      , left = want - got
      , noun = left === 1 ? 'person' : 'people'
    if (left < 0) left = 0
    return d.div({
      className: 'todo-people__load-status'
    }, 'Looking for ' + left + ' more ' + noun + '. Searched through ' + searched)
  },
  loadMore: function () {
    if (this.props.loading.todos || this.props.loading.more) return
    return d.button({
      className: 'btn btn-default todo-people__load-more',
      onClick: this.props.loadMoreTodos,
      disabled: this.props.loading.todos
    }, 'Look for more')
  },
  render: function () {
    return d.div({
      className: 'todo-people'
    },
    d.h2({className: 'todo-people__title'}, 'People to work on'),
    d.div(
      {className: 'todo-buttons'},
      this.loadMore(),
      this.loadingMessage()
    ),
    d.ul(
      {className: 'todo-people__list'},
      this.props.people.map(function (id) {
        return d.li({key: id},
          TodoPerson({
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

