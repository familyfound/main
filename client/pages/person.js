
var TodoList = require('../components/todo-list')
  , VitalInfo = require('../components/vital-info')
  , ResearchNotes = require('../components/research-notes')
  , ActionButtons = require('../components/action-buttons')
  , d = React.DOM

var PersonPage = module.exports = React.createClass({
  render: function () {
    return d.div(
      {className: 'person-page'},
      d.div(
        {className: 'person-page__top'},
        d.div(
          {className: 'person-page__top-left'},
          TodoList({
            pid: this.props.pid,
            manager: this.props.manager
          }),
          ResearchNotes({
            pid: this.props.pid,
            manager: this.props.manager
          })
        ),
        d.div(
          {className: 'person-page__top-right'},
          ActionButtons({
            pid: this.props.pid,
            manager: this.props.manager
          }),
          VitalInfo({
            model: this.state.personDisplay
          })
        )
      ),
      d.h3(null, 'family info here')
    )
  }
})

