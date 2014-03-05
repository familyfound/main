
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
  grouped: function () {
    var items = this.state.items
      , grouped = []
    for (var i=0; i<items.length; i++) {
      if (grouped.length && items[i].id === grouped[grouped.length-1].id) {
        grouped[grouped.length-1].actions.push(items[i])
        continue;
      }
      grouped.push({
        id: items[i].id,
        display: items[i].display,
        actions: [items[i]]
      })
    }
    return grouped
  },
  render: function () {
    return d.div(
      {className: 'history-box'},
      d.h2({className: 'history-box__title'}, 'Recent Actions'),
      this.grouped().map(function (item) {
        if (!item.display) return false
        return HistoryItem({
          value: item,
          personHref: this.props.personHref
        })
      }.bind(this)),
      !this.state.items.length && d.h4({className: 'history-box__empty'}, 'No recent actions')
    )
  }
})

