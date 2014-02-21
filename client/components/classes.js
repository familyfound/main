
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
  tests: {
    completion: function (data) {
      if (!data.data || !data.data.todos) {
        return 'c-not-evaluated'
      }
      var todos = todosLeft(data.data)
      if (!todos) {
        return 'c-completed'
      }
      if (!todos.left) {
        return 'c-just-hard'
      }
      return 'c-has-todos'
    },
    children: function (data) {
      if (data.rels.display.lifespan.match(/Living/)) return 'ch-living'
      switch (data.rels.children.length) {
        case 0:
        case 1:
          return 'ch-very-few'
        case 2:
          return 'ch-few'
        default:
          return 'ch-several'
      }
    },
    age: function (data) {
      var display = data.rels.display
      if (display.lifespan.match(/Living/)) return 'a-living'
      if (!display.age) return 'a-unknown'
      if (display.age < 30) return 'a-young'
      if (display.age < 60) return 'a-middle'
      if (display.age < 80) return 'a-old'
      return 'a-ancient'
    },
    sources: function (data) {
      if (data.rels.display.lifespan.match(/Living/)) return 's-living'
      if (!data.more || !data.more.sources) return 's-unknown'
      var n = data.more.sources.length
      if (!n) return 's-none'
      if (n < 3) return 's-few'
      if (n < 6) return 's-some'
      return 's-many'
    },
  },
  options: {
    completion: {
      'c-not-evaluated': 'Not Evaluated',
      'c-completed': 'Completed',
      'c-just-hard': 'Just Hard',
      'c-has-todos': 'Has Tasks'
    },
    children: {
      'ch-living': 'Living',
      'ch-very-few': 'Very Few',
      'ch-few': 'Few',
      'ch-several': 'Several'
    },
    age: {
      'a-living': 'Living',
      'a-young': 'Young',
      'a-middle': 'Middle',
      'a-old': 'Old',
      'a-ancient': 'Ancient',
      'a-unknown': 'Unknown',
    },
    sources: {
      's-living': 'Living',
      's-none': 'None',
      's-few': 'Few',
      's-some': 'Some',
      's-many': 'Many',
      's-unknown': 'Not Evaluated',
    }
  }
}


