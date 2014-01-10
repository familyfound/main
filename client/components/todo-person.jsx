/** @jsx React.DOM */

var Star = require('./star')
  , Todo = require('./todo')

var TodoPerson = module.exports = React.createClass({
  render: function () {
    var person = this.props.data
      , display = person.rels.display
      , place = display.birthPlace || display.deathPlace
    return (
      <div className='todo-person'>
        <div className='todo-person__top'>
          <div className='todo-person__name'>
            {display.name}
          </div>
          <Star
            className='todo-person__star'
            value={person.data.starred}
            onChange={this.props.onStar}/>
        </div>
        <div className='todo-person__bottom'>
          <div className='todo-person__lifespan'>
            {display.lifespan}
          </div>
          <div className='todo-person__place'>
            {place}
          </div>
          <button
            className='todo-person__complete'
            onClick={this.props.onComplete}>
            Complete / Ignore
          </button>
        </div>
        <ul className='todo-person__todos'>
          {person.data.todos && person.data.todos.map(function (todo) {
            return (
              <li className='todo-person__todo' key={todo.type}>{
                Todo({
                  data: todo,
                  onDone: this.props.toDone.bind(null, todo.type),
                  onHard: this.props.toHard.bind(null, todo.type)
                })
              }</li>
            )
          }.bind(this))}
        </ul>
      </div>
    )
  }
})

