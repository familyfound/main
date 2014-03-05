
var d = React.DOM
  , relationship = require('./relationship.js')

  , todos = require('api').todos

function historyTodoName(item) {
  var title = todos.types[item.todo].title.replace('{}', '')
  if (item.key === 'hard') {
    return (item.value ? '' : 'un') + 'marked task as hard'
    // return (item.value ? '' : 'un') + 'marked task "' + title + '" as hard'
  }
  if (item.key === 'note') {
    return 'Changed note'
    // return 'Added a note to "' + title + '"'
  }
  if (item.value) {
    return 'Completed task'
    // return todos.types[item.todo].history
  }
  return 'Marked task as incomplete'
  // return 'marked task "' + todos.types[item.todo].title.replace('{}', '') + '" as incomplete'
}

function historyName(item) {
  if (item.todo) {
    return historyTodoName(item)
  }
  var names = {
    starred: function (item) {
      return (item.value ? '' : 'un') + 'starred'
    },
    note: function (item) {
      return 'Changed note'
      // var text = item.value
      // if (text.length > 50) text = text.slice(0, 47) + '...'
      // return 'Changed note to "' + text + '"'
    },
    customTodos: function (item) {
      return 'Changed custom tasks'
    }
  }
  return names[item.key](item)
}

function historyBody(item) {
  var names = {
    note: function (item) {
      return item.value
    }
  }
  if (names[item.key]) return names[item.key](item)
  return false
}

function capFirst(str) {
  return str[0].toUpperCase() + str.slice(1)
}

var HistoryItem = module.exports = React.createClass({
  displayName: 'HistoryItem',
  getDefaultProps: function () {
    return {
      value: {},
      personHref: function () {return '#nope'}
    }
  },
  getInitialState: function () {
    return {
      open: false
    }
  },
  toggleOpen: function () {
    this.setState({open: !this.state.open})
  },
  render: function () {
    var display = this.props.value.display
      , relation = relationship.text(display.gender, display.generation)
      , whatHappened = historyName(this.props.value)
      , body = historyBody(this.props.value)

    return d.div(
      {className: 'history-item' + (this.state.open ? ' history-item--open' : ''), onClick: this.toggleOpen},
      d.div(
        {className: 'history-item__top'},
        d.span(
          {className: 'history-item__date'},
          moment(this.props.value.date).fromNow()
        ),
        d.a({
          className: 'history-item__name',
          href: this.props.personHref(this.props.value.id),
        }, display.name),
        d.span(
          {className: 'history-item__lifespan'},
          display.lifespan
        )
      ),
      d.div(
        {className: 'history-item__extra'},
        d.a(
          {
            className: 'hisotry-item__fsorg',
            target: '_blank',
            href: 'https://familysearch.org/tree/#view=ancestor&person=' + this.props.value.id
          },
          'View on FamilySearch.org: ' + this.props.value.id + ''
        ),
        d.div(
          {className: 'history-item__relation'},
          relation
        )
      ),
      d.div(
        {className: 'history-item__action'},
        d.span(
          {className: 'history-item__action-title'},
          capFirst(whatHappened) + ' '
        ),
        d.div(
          {className: 'history-item__action-body'},
          body
        )
      )
    )
  }
})

