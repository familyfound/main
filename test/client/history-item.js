
var x = require('xon')
  , names = ['Joe Smith', 'Jared Lee Forsyth', 'Dennisson Lott Harris']
  , pid = 'MMMM-XDS'
  , uid = 'ABDF-R43'
  , todos = [
      ['resolve duplicates', 'completed', true],
      ['find name', 'hard', true],
      ['find birth info', 'completed', false],
      ['find sources', 'hard', false]
    ]

/**
  * History item looks like
  * {
  *   id: personId,
  *   user: the user that added it,
  *   key: the attr that changed,
  *   value: the thing that added,
  *   date: data,
  *   display: {
  *     name: str,
  *     lifespan: str,
  *     gender: str,
  *     generation: length of the lineage,
  *   }
  * }
  */
var todo_items = todos.map(function (item) {
  return {
    id: pid,
    user: uid,
    key: item[1],
    value: item[2],
    todo: item[0],
    date: new Date(),
    display: {
      name: names[0],
      lifespan: '1920-2001',
      gender: 'Female',
      generation: 4
    }
  }
})
module.exports = [{
  id: pid,
  user: uid,
  date: new Date(),
  key: 'starred',
  value: false,
  display: {
    name: names[0],
    lifespan: '1830-1910',
    gender: 'Male',
    generation: 2
  }
}, {
  id: pid,
  user: uid,
  date: new Date(),
  key: 'customTodos',
  value: [],
  display: {
    name: names[1],
    lifespan: '1830-1910',
    gender: 'Male',
    generation: 2
  }
}, {
  id: pid,
  user: uid,
  date: new Date(),
  key: 'note',
  value: 'This person has a lot of strange things going on',
  display: {
    name: names[2],
    lifespan: '1830-1910',
    gender: 'Male',
    generation: 2
  }
}].concat(todo_items)



