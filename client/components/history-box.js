
var d = React.DOM
  , HistoryItem = require('./history-item')

var HistoryBox = module.exports = React.createClass({
  displayName: 'HistoryBox',
  getDefaultProps: function () {
    return {
      manager: null,
      personHref: function () {}
    }
  },
  getInitialState: function () {
    return {
      items: []
    }
  },
  componentDidMount: function () {
    this.props.manager.on('history', this.gotData)
  },
  componentWillUnmount: function () {
    this.props.manager.off('history', this.gotData)
  },
  gotData: function (data) {
    this.setState({items: data.items || []})
  },
  render: function () {
    return d.div(
      {className: 'history-box'},
      d.h2({className: 'history-box__title'}, 'Recent Actions'),
      this.state.items.map(function (item) {
        if (!item.display) return false
        return HistoryItem({
          value: item,
          personHref: this.props.personHref
        })
      }.bind(this))
    )
  }
})

