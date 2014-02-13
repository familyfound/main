
var TodoList = require('../components/todo-list')
  , VitalInfo = require('../components/vital-info')
  , ResearchNotes = require('../components/research-notes')
  , ActionButtons = require('../components/action-buttons')
  , Searcher = require('../components/searcher')
  , d = React.DOM
  , searchItems = require('../components/searches').searchItems

var PersonPage = module.exports = React.createClass({
  displayName: 'PersonPage',

  getInitialState: function () {
    return {person: null, loading: false}
  },
  componentDidMount: function () {
    this.props.manager.on(this.props.id, this.gotData)
  },
  componentWillUnmount: function () {
    this.props.manager.off(this.props.id, this.gotData)
  },
  componentDidUpdate: function (prevProps) {
    if (prevProps.id !== this.props.id) {
      this.props.manager.off(prevProps.id, this.gotData)
      this.props.manager.on(this.props.id, this.gotData)
    }
  },
  gotData: function (data) {
    this.setState({person: data})
  },
  render: function () {
    var person = (this.state.person && this.state.person.rels) ? this.state.person : false
    return d.div(
      {className: 'person-page'},
      /*
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
      */
      d.a({href: '#'}, 'Home'),
      this.state.loading && 'Loading...',
      person && d.div(
        {className: 'person-page__vitals'},
        person.rels.display.name
      ),
      person && searchItems(person).map(function (item) {
        return Searcher({item: item, key: item.href})
      })
      // d.h3(null, 'family info here')
    )
  }
})
