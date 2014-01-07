
var Header = require('./components/header')
  , Footer = require('./components/footer')
  , OverviewPage = require('./pages/overview')
  , PersonPage = require('./pages/person')
  , RouterMixin = require('./router')
  , d = React.DOM

var View = module.exports = React.createClass({
  mixins: [RouterMixin],
  routes: {
    '': 'overview',
    'person/:pid': 'person',
    ':pid': 'overview'
  },
  overviewPerson: function (pid) {
    this.setRoute('' + pid)
  },
  viewPerson: function (pid) {
    this.setRoute('person/' + pid)
  },
  render: function () {
    var main
      , route = this.getRoute()

    if (route.name === 'person') {
      main = PersonPage({
        pid: route.pid,
        overviewPerson: this.overviewPerson,
        viewPerson: this.viewPerson,
        manager: this.manager
      })
    } else {
      main = OverviewPage({
        pid: route.pid || this.props.userData.id,
        overviewPerson: this.overviewPerson,
        viewPerson: this.viewPerson,
        manager: this.manager
      })
    }

    return d.div(
      { className: 'main-view' },
      Header({
        userData: this.props.userData
      }), 
      main,
      Footer()
    )
  }
})

