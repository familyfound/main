
var d = React.DOM
  , Fan = require('fan')
  , classes = require('./classes')
  , Tip = require('tip')
  , tipMessage = require('./tip').message
  , Lineage = require('./lineage.js')

function mainTitle(node, x, y) {
  if (!node || !node.rels) return false
  return node.rels.display.name
}

function nodeTitle(node) {
  if (!node || !node.rels) return false
  return node.rels.display.name
}

function nodeClasses(data) {
  if (!data.rels) return {path: 'not-loaded'};
  var path = []
    , g = []
    , cl
  for (var name in classes.tests) {
    cl = classes.tests[name](data)
    if (cl) path.push(cl)
  }
  return {
    path: path.join(' '),
    g: g.join(' ')
  }
}

function classOptions(current) {
  var options = classes.options[current.split('-')[1]]
    , children = []
  for (var name in options) {
    children.push(d.li(
      {className: 'fan-key-item'}, 
      d.span({className: 'fan-key__color ' + name}),
      d.span({className: 'fan-key__label'}, options[name])
    ))
  }
  return d.ul({className: 'fan-key'}, children)
}

var showz = {
  'show-completion': 'Completion',
  'show-children': 'Children',
  'show-sources': 'Sources',
  'show-age': 'Lifespan',
  'show-origin': 'Country',
  'show-modified': 'Last Worked On'
}

function showButtons(showing, show) {
  var buttons = []
  for (var name in showz) {
    buttons.push(d.button({
      className: 'fan__btn btn btn-default' + (showing === name ? ' fan__btn--active':''),
      onClick: show.bind(null, name),
      disabled: showing === name
    }, showz[name]))
  }
  return d.div.apply(d, [{}].concat(buttons))
}

var FanBox = module.exports = React.createClass({
  displayName: 'FanBox',
  getDefaultProps: function () {
    return {
      sweep: Math.PI*4/3,
      overviewPerson: function () {},
      defaultWidth: 500,
      margin: 20,
      gens: 6,
      padding: 5
    }
  },
  getInitialState: function () {
    return {
      width: this.props.defaultWidth,
      showing: 'show-completion'
    }
  },
  resize: function () {
    var w = this.getDOMNode().clientWidth - this.props.margin * 2
    if (w !== this.state.width) {
      this.setState({width: w})
    }
  },
  componentDidMount: function () {
    this.resize()
    window.addEventListener('resize', this.resize)
  },
  componentWillUnmount: function () {
    window.removeEventListener('resize', this.resize)
  },
  getHeight: function () {
    var r = this.state.width / 2 - this.props.padding
      , iw = r / this.props.gens
      , a = this.props.sweep / 2 - Math.PI / 2
    return r + r * Math.sin(a) + this.props.padding * 2
  },
  setShow: function (what) {
    this.setState({showing: what})
  },
  render: function () {
    var height = this.getHeight()
      , r = this.state.width / 2
      , transform = 'translate(' + this.state.width/2 + ', ' + r + ')'
    return d.div({
      className: 'fan-box ' + this.state.showing,
    },
      showButtons(this.state.showing, this.setShow),
      classOptions(this.state.showing),
      d.svg({
        width: this.state.width,
        height: height
      }, Fan({
        attr: 'rels',
        getClasses: nodeClasses,
        tip: tipMessage,
        gens: this.props.gens,
        onClick: this.props.overviewPerson,
        onRightClick: this.props.onRightClick,
        mainTitle: mainTitle,
        overTitle: nodeTitle,
        transform: transform,
        manager: this.props.manager,
        id: this.props.id,
        options: {
          width: r / this.props.gens,
          doubleWidth: false,
          sweep: this.props.sweep,
          offset: 0,
        }
      })),
      Lineage({
        id: this.props.id,
        manager: this.props.manager,
        treeHref: this.props.treeHref
      })
    )
  }
})

