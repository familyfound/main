
var d = React.DOM
  , TodoPerson = require('./todo-person')

var StarBox = module.exports = React.createClass({
  displayName: 'StarBox',
  getDefaultProps: function () {
    return {
      manager: null,
      overviewPerson: function () {}
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
      d.h2({className: 'star-box__title'}, 'Starred People'),
      this.state.ids.map(function (id) {
        return TodoPerson({
          showAnyway: true,
          personHref: this.props.personHref(id),
          viewPerson: this.props.viewPerson,
          manager: this.props.manager,
          id: id
        })
      }.bind(this))
    )
  }
})


