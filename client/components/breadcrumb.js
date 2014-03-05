
var d = React.DOM
  , DataBound = require('./data-bound')

var Breadcrumb = module.exports = React.createClass({
  mixins: [DataBound],
  displayName: 'Breadcrumb',
  getDefaultProps: function () {
    return {
      personHref: function () {return '#here'}
    }
  },
  render: function () {
    if (!this.state.data || !this.state.data.data || !this.state.data.data.lineage.length) {
      return d.ul({className: 'breadcrumb breadcrumb--empty'})
    }
    var items = this.state.data.data.lineage
      , display = this.state.data.rels.display
      , people = []
    items = items.concat([{
      isHead: true,
      name: display.name,
      id: display.id
    }])
    for (var i=0; i<items.length; i++) {
      people.push(d.li(
        {className: 'breadcrumb__item' + (items[i].isHead ? ' breadcrumb__item--head' : '')},
        d.a({
          href: items[i].isHead ? undefined : this.props.personHref(items[i].id),
        }, items[i].name)
      ))
      if (items.length > 4 && i < items.length - 4) {
        i = items.length - 4;
        people.push(d.span({className: 'breadcrumb__dotdotdot'}))
      }
    }
    return d.ul(
      {className: 'breadcrumb'},
      people
    )
  }
})


