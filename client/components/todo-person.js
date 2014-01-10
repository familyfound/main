/** @jsx React.DOM */

var Star = require('./star')
  , Todo = require('./todo')

var TodoPerson = module.exports = React.createClass({
  render: function () {
    var person = this.props.data
      , display = person.rels.display
      , place = display.birthPlace || display.deathPlace
    return (
      React.DOM.div( {className:"todo-person"}, 
        React.DOM.div( {className:"todo-person__top"}, 
          React.DOM.div( {className:"todo-person__name"}, 
            display.name
          ),
          Star(
            {className:"todo-person__star",
            value:person.data.starred,
            onChange:this.props.onStar})
        ),
        React.DOM.div( {className:"todo-person__bottom"}, 
          React.DOM.div( {className:"todo-person__lifespan"}, 
            display.lifespan
          ),
          React.DOM.div( {className:"todo-person__place"}, 
            place
          ),
          React.DOM.button(
            {className:"todo-person__complete",
            onClick:this.props.onComplete}, 
            " Complete / Ignore "
          )
        ),
        React.DOM.ul( {className:"todo-person__todos"}, 
          person.data.todos && person.data.todos.map(function (todo) {
            return (
              React.DOM.li( {className:"todo-person__todo", key:todo.type}, 
                Todo({
                  data: todo,
                  onDone: this.props.toDone.bind(null, todo.type),
                  onHard: this.props.toHard.bind(null, todo.type)
                })
              )
            )
          }.bind(this))
        )
      )
    )
  }
})
