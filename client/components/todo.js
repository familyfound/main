
var d = React.DOM
  , todos = require('api').todos
  , Note = require('./person-note')

var CheckBox = React.createClass({
  getDefaultProps: function () {
    return {
      checked: false,
      onChange: function () {}
    }
  },
  render: function () {
    return d.i({
      onClick: this.props.onChange,
      className: 'check-box fa fa-' + (this.props.checked ? 'check-' : '') + 'square-o'
    })
  }
})

var Todo = module.exports = React.createClass({
  getDefaultProps: function () {
    return {
      startOpen: false,
      onDone: function () {
      }
    }
  },
  getInitialState: function () {
    return {
      open: this.props.startOpen
    }
  },
  toggleDone: function (e) {
    this.props.onDone()
    e.stopPropagation()
    return false
  },
  getTitle: function () {
    var tpl = todos.titles[this.props.data.type]
      , items = this.props.data.data
    if (items && 'undefined' !== typeof items.args) {
      items = items.args
    }
    if (!Array.isArray(items)) {
      items = [items];
    } else {
      items = items.slice()
    }
    return tpl.replace(/\{\}/g, function () {
      return items.shift()
    })
  },
  getLinks: function () {
    if (!this.props.data.data || !this.props.data.data.links) return false
    var links = this.props.data.data.links
    return d.ul({className: 'todo__links'},
      Object.keys(links).map(function (link) {
        return d.li({className: 'todo__link-item'},
          d.a({
            className: 'todo__link',
            target: '_blank',
            href: links[link]
          },
          d.i({className: 'fa fa-arrow-right'}),
          link
          )
        )
      })
    )
  },
  toggleOpen: function () {
    this.setState({open: !this.state.open})
  },
  render: function () {
    var cls = 'todo'
      , ttype = todos.types[this.props.data.type]
    if (this.props.data.completed) {
      if (this.props.data.hard) {
        cls += ' todo--hard-completed'
      } else {
        cls += ' todo--completed'
      }
    } else if (this.props.data.hard) {
      cls += ' todo--hard'
    }
    if (!this.state.open) {
      return d.div(
        {
          className: cls + ' todo--collapsed',
          onClick: this.toggleOpen
        },
        d.span({
          className: 'todo__title'
        }, this.getTitle())
      )
    }
    return d.div({
        className: cls,
      },
      d.div(
        {
          className: 'todo__head',
          onClick: this.toggleOpen
        },
        CheckBox({
          onChange: this.toggleDone,
          checked: !!this.props.data.completed
        }),
        d.span({
          className: 'todo__title'
        }, this.getTitle())
      ),
      Note({
        className: 'todo__note',
        text: this.props.data.note || '',
        onChange: this.props.changeNote
      }),
      this.getLinks(),
      ttype.help && d.span({
        className: 'todo__explanation',
      }, ttype.help),
      d.button({
        className: 'todo__hard' + (this.props.data.hard ? ' todo__hard--depressed' : ''),
        onClick: this.props.onHard
      }, !this.props.data.hard ? 'Mark as hard' : 'Unmark as hard'),
      ttype.help_link && d.a(
        {
          className: 'todo__help-button',
          href: ttype.help_link,
          target: '_blank'
        },
        d.i({className: 'fa fa-question-circle'}),
        'More help'
      )
    )
  }
})

