
var FanBox = require('../components/fan-box')
  , HistoryBox = require('../components/history-box')
  , TodoPeople = require('../components/todo-people')
  , d = React.DOM

var OverviewPage = module.exports = React.createClass({
  render: function () {
    return d.div(
      { className: 'overview' },
      d.div(
        {className: 'overview__top'},
        FanBox({
          pid: this.props.pid,
          manager: this.props.manager,
          overviewPerson: this.props.overviewPerson,
          viewPerson: this.props.viewPerson
        }),
        HistoryBox({
          history: this.props.history
        })
      ),
      d.div(
        {className: 'overview__bottom'},
        TodoPeople({
          manager: this.props.manager,
          people: this.props.todoPeople,
          overviewPerson: this.props.overviewPerson,
          viewPerson: this.props.viewPerson
        })
      )
    )
  }
})

