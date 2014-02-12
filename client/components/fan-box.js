
var d = React.DOM
  , Fan = require('fan')
  , classes = require('./classes')
  , Tip = require('tip')

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
  getDefaultProps: function () {
    return {
      sweep: Math.PI*4/3,
      width: 500,
      gens: 6,
      padding: 5
    }
  },
  getHeight: function () {
    var r = this.props.width / 2 - this.props.padding
      , iw = r / this.props.gens
      , a = this.props.sweep / 2 - Math.PI / 2
    return r + r * Math.sin(a) + this.props.padding * 2
  },
  render: function () {
    var height = this.getHeight()
      , r = this.props.width / 2
      , transform = 'translate(' + this.props.width/2 + ', ' + r + ')'
    return d.svg({
      className: 'fan-box show-completion',
      width: this.props.width,
      height: height
    }, Fan({
      attr: 'rels',
      getClasses: nodeClasses,
      hoverTips: nodeTip,
      onClick: this.props.onClick,
      onRightClick: this.props.onRightClick,
      transform: transform,
      manager: this.props.manager,
      id: this.props.pid,
      options: {
        width: r / this.props.gens,
        doubleWidth: false,
        sweep: this.props.sweep,
        offset: 0,
      }
    }))
  }
})

