
var FanBox = require('../components/fan-box')
  , HistoryBox = require('../components/history-box')
  , TodoPeople = require('../components/todo-people')
  , d = React.DOM

var OverviewPage = module.exports = React.createClass({
  displayName: 'OverviewPage',
  render: function () {
    return d.div(
      { className: 'overview' },
      d.div(
        {className: 'overview__todo'},
        TodoPeople({
          manager: this.props.manager,
          people: this.props.todoPeople,
          overviewPerson: this.props.overviewPerson,
          removePerson: this.props.removeTodoPerson,
          personHref: this.props.personHref,
          loading: this.props.loading,
          loadMoreTodos: this.props.loadMoreTodos
/*        }),
        ResearchJournal({
          manager: this.props.manager,
*/      })
      ),
      d.div(
        {className: 'overview__fan'},
        FanBox({
          pid: this.props.pid,
          manager: this.props.manager,
          loading: this.props.loading,
          overviewPerson: this.props.overviewPerson,
          viewPerson: this.props.viewPerson
        }),
        HistoryBox({
          history: this.props.history
        })
      )
    )
  }
})

