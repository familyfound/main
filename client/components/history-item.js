
var d = React.DOM
  , relationship = require('./relationship.js')

  , todos = require('api').todos

function historyTodoInfo(item) {
  var title = todos.types[item.todo].title.replace('{}', '')
  if (item.key === 'hard') {
    return {
      // title: (item.value ? '' : 'un') + 'marked task as hard',
      title: (item.value ? '' : 'un') + 'marked task "' + title + '" as hard',
      icon: item.value ? 'fa-meh-o' : 'fa-smile-o'
    }
  }
  if (item.key === 'note') {
    return {
      title: 'Changed note on task "' + title + '"',
      icon: 'fa-pencil-square-o',
      body: item.value
    }
  }
  if (item.value) {
    return {
      title: todos.types[item.todo].history,
      icon: 'fa-check-square-o'
    }
  }
  return {
    // title: 'Marked task as incomplete'
    title: 'Marked task "' + todos.types[item.todo].title.replace('{}', '') + '" as incomplete',
    icon: 'fa-square-o'
  }
}

function historyInfo(item) {
  if (item.todo) {
    return historyTodoInfo(item)
  }
  var names = {
    starred: function (item) {
      return {
        title: (item.value ? '' : 'un') + 'starred',
        icon: 'fa-star' + (item.value ? '' : '-o')
      }
    },
    note: function (item) {
      return {
        title: 'Changed note',
        icon: 'fa-pencil',
        body: item.value
      }
    },
    customTodos: function (item) {
      return {
        title: 'Changed custom tasks',
        icon: 'fa-plus-square-o'
      }
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

    return d.div(
      {className: 'history-item'},
      d.div(
        {className: 'history-item__top'},
        d.span(
          {className: 'history-item__date'},
          moment(this.props.value.actions[0].date).fromNow()
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
      this.props.value.actions.map(function (action) {
        var info = historyInfo(action)
        return d.div(
          {className: 'history-item__action'},
          d.i({
            className: 'fa fa-fw ' + info.icon
          }),
          d.span(
            {className: 'history-item__action-title'},
            capFirst(info.title) + ' '
          ),
          d.div(
            {className: 'history-item__action-body'},
            info.body
          )
        )
      })
    )
  }
})

