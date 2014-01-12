
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
  personHref: function (pid) {
    return '#person/' + pid
  },
  getInitialState: function () {
    return {loadingText: ''}
  },
  setLoadingText: function (text) {
    this.setState({loadingText: text})
  },
  render: function () {
    var main
      , route = this.getRoute()

    if (route.name === 'person') {
      main = PersonPage({
        id: route[':pid'],
        overviewPerson: this.overviewPerson,
        viewPerson: this.viewPerson,
        manager: this.props.manager,
        loadingText: this.setLoadingText
      })
    } else {
      main = OverviewPage({
        pid: route[':pid'] || this.props.userData.personId,
        overviewPerson: this.overviewPerson,
        todoPeople: this.props.todoPeople,
        personHref: this.personHref,
        manager: this.props.manager,
        setLoadingText: this.setLoadingText,
        removeTodoPerson: this.props.removeTodoPerson
      })
    }

    return d.div(
      { className: 'main-view' },
      Header({
        userData: this.props.userData,
        loadingText: this.props.loadingText
      }),
      main,
      Footer()
    )
  }
})

