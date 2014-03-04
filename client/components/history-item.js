
var d = React.DOM
  , relationship = require('./relationship.js')

  , todos = require('api').todos

function historyTodoName(item) {
  if (item.key === 'hard') {
    return (item.value ? '' : 'un') + 'marked task "' + todos.types[item.todo].title.replace('{}', '') + '" as hard'
  }
  if (item.value) {
    return todos.types[item.todo].history
  }
  return 'marked task "' + todos.types[item.todo].title.replace('{}', '') + '" as incomplete'
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
      var text = item.value
      if (text.length > 50) text = text.slice(0, 47) + '...'
      return 'Changed note to "' + text + '"'
    },
    customTodos: function (item) {
      return 'Changed custom tasks'
    }
  }
  return names[item.key](item)
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
  render: function () {
    var display = this.props.value.display
      , relation = relationship.text(display.gender, display.generation)
      , whatHappened = historyName(this.props.value)
    return d.div(
      {className: 'history-item'},
      d.div(
        {className: 'history-item__top'},
        d.span(
          {className: 'history-item__thing'},
          capFirst(whatHappened)
        ),
        ' on ',
        d.a({
          className: 'history-item__name',
          href: this.props.personHref(this.props.value.id),
        }, display.name),
        d.span(
          {className: 'history-item__date'},
          moment(this.props.value.date).fromNow()
        )
      ),
      d.a(
        {
          target: '_blank',
          href: 'https://familysearch.org/tree/#view=ancestor&person=' + this.props.value.id
        },
        this.props.value.id + ' on familysearch.org ',
        d.i({className: 'glyphicon glyphicon-new-window'})
      ),
      d.br(),
      d.span(
        {className: 'history-item__relation'},
        relation
      ),
      d.span(
        {className: 'history-item__lifespan'},
        display.lifespan
      )
    )
  }
})

