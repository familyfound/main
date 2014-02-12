
var d = React.DOM
  , Fan = require('fan')
  , classes = require('./classes')

function nodeClasses(data) {
  if (!data.rels) return {path: 'not-loaded'};
  var path = []
    , g = []
    , cl
  for (var name in classes) {
    cl = classes[name](data)
    if (cl) path.push(cl)
  }
  return {
    path: path.join(' '),
    g: g.join(' ')
  }
}

function nodeTip(data) {
  return 'Hello brother';
}

var FanBox = module.exports = React.createClass({
  render: function () {
    return d.svg({
      className: 'fan-box show-completion',
      width: 300,
      height: 230
    }, Fan({
      attr: 'rels',
      getClasses: nodeClasses,
      hoverTips: nodeTip,
      onClick: this.props.onClick,
      onRightClick: this.props.onRightClick,
      transform: 'translate(150,150)',
      manager: this.props.manager,
      id: this.props.pid
    }))
  }
})

