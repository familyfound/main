
var main = document.getElementById('main')
  , d = React.DOM

var Collapseable = React.createClass({
  getDefaultProps: function () {
    return {
      startOpen: false,
      head: '',
      body: ''
    }
  },
  getInitialState: function () {
    return {open: this.props.startOpen}
  },
  toggle: function () {
    this.setState({
      open: !this.state.open
    })
  },
  render: function () {
    return d.div(
      {className: 'collapseable'},
      d.span({
        className: 'collapseable__head',
        onClick: this.toggle
      }, this.props.head),
      this.state.open && d.span(
        {className: 'collapseable__body'},
        this.props.body
      )
    )
  },
})

var Data = React.createClass({
  render: function () {
    return Collapseable({
      startOpen: false,
      head: 'Click to show `props`',
      body: d.pre({className: 'fixture__data'}, JSON.stringify(this.props.data, null, 2)),
    })
  }
})

var Fixme = React.createClass({
  render: function () {
    return d.div(
      {className: 'fixtures'},
      this.props.data.map(function (what, i) {
        return d.div(
          {className: 'fixture'},
          d.h2({className: 'fixture__title'}, 'Fixture #' + (i + 1)),
          Data({data: what}),
          component(what)
        )
      })
    )
  }
})

React.renderComponent(Fixme({data: data}), main)

