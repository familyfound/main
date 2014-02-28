
var d = React.DOM
  , TodoPerson = require('./todo-person')

var StarBox = module.exports = React.createClass({
  displayName: 'StarBox',
  getDefaultProps: function () {
    return {
      manager: null,
      personHref: function () {}
    }
  },
  getInitialState: function () {
    return {
      ids: []
    }
  },
  componentDidMount: function () {
    this.props.manager.on('starred', this.gotData)
  },
  componentWillUnmount: function () {
    this.props.manager.off('starred', this.gotData)
  },
  gotData: function (data) {
    this.setState({ids: data.ids || []})
  },
  render: function () {
    return d.div(
      {className: 'star-box'},
      this.state.ids.map(function (id) {
        return TodoPerson({
          showAnyway: true,
          overviewPerson: this.props.overviewPerson,
          viewPerson: this.props.viewPerson,
          manager: this.props.manager,
          personHref: this.props.personHref(id),
          removePerson: this.props.removePerson.bind(null, id),
          id: id
        })
      }.bind(this))
    )
  }
})


