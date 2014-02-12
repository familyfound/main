
module.exports = {
  completion: function (data) {
    if (data.data === null) {
      return 'c-not-evaluated'
    }
    if (!data.data) return false
    if (data.data.completed || !data.data.todos.length) {
      return 'c-completed'
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

