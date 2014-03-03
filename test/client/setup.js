
var main = document.getElementById('main')
  , d = React.DOM

var Fixme = React.createClass({
  render: function () {
    return d.div(
      {className: 'fixtures'},
      this.props.data.map(function (what, i) {
        return d.div(
          {className: 'fixture'},
          d.h2({className: 'fixture__title'}, 'Fixture #' + (i + 1)),
          d.pre({className: 'fixture__data'}, JSON.stringify(what, null, 2)),
          component(what)
        )
      })
    )
  }
})

React.renderComponent(Fixme({data: data}), main)

