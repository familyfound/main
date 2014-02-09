
var d = React.DOM
  , Fan = require('fan')

var FanBox = module.exports = React.createClass({
  render: function () {
    return Fan({
      attr: 'rels',
      transform: 'translate(130,130)',
      manager: this.props.manager,
      id: this.props.pid
    })
  }
})

