
var DataBound = require('./data-bound.js')
  , d = React.DOM
  , relationship = require('./relationship.js')

var Lineage = module.exports = React.createClass({
  displayName: 'Lineage',
  mixins: [DataBound],
  items: function () {
    if (!this.state.data) {
      return d.li({className: 'lineage__loading'}, 'Loading')
    }
    if (!this.state.data.data || !this.state.data.data.lineage) {
      return false
    }
    var line = []
    this.state.data.data.lineage.forEach(function (person, i) {
      line.unshift(d.li(
        {className: 'lineage__person'},
        d.a(
          {href: this.props.treeHref(person.id)},
          d.span({className: 'lineage__person__name'}, person.name),
          d.span({className: 'lineage__person__lifespan'}, person.lifespan),
          // d.span({className: 'lineage__person__gender'}, person.gender),
          d.span({className: 'lineage__person__place'}, person.place),
          d.span({className: 'lineage__person__relation'}, relationship.text(person.gender, i))
        )
      ))
    }.bind(this))
    return line
  },
  render: function () {
    return d.ul(
      {className: 'lineage'},
      this.items()
    )
  }
})

