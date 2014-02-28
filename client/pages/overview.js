
var FanBox = require('../components/fan-box')
  , HistoryBox = require('../components/history-box')
  , StarBox = require('../components/star-box')
  , TodoPeople = require('../components/todo-people')
  , TodoPerson = require('../components/todo-person')
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
          treeHref: this.props.treeHref,
          loading: this.props.loading,
          loadMoreTodos: this.props.loadMoreTodos
/*        }),
        ResearchJournal({
          manager: this.props.manager,
*/      })
      ),
      d.div(
        {className: 'overview__others'},

        FanBox({
          id: this.props.pid,
          manager: this.props.manager,
          loading: this.props.loading,
          overviewPerson: this.props.overviewPerson,
          treeHref: this.props.treeHref,
          viewPerson: this.props.viewPerson
        }),

        StarBox({
          stars: this.props.stars,
          manager: this.props.manager,
          personHref: this.props.personHref,
        }),

        HistoryBox({
          manager: this.props.manager,
          personHref: this.props.personHref,
        })
      )
    )
  }
})

