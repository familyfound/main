
function todosLeft(data) {
  if (data.completed) return 0
  if (!data.todos.length) return 0
  var left = 0
    , hard = 0
  for (var i=0; i<data.todos.length; i++) {
    if (data.todos[i].completed) continue;
    if (data.todos[i].hard) hard++;
    else left++;
  }
  if (!left && !hard) return 0
  return {
    left: left,
    hard: hard
  }
}

module.exports = {
  completion: function (data) {
    if (data.data === null) {
      return 'c-not-evaluated'
    }
    if (!data.data) return false
    var todos = todosLeft(data.data)
    if (!todos) {
      return 'c-completed'
    }
    if (!todos.left) {
      return 'c-just-hard'
    }
    return 'c-has-todos'
  },
  'num-children': function (data) {
    if (!data.rels) return false
    switch (data.rels.children.length) {
      case 0:
      case 1:
        return 'ch-very-few'
      case 2:
        return 'ch-few'
      default:
        return 'ch-several'
    }
  }
}

