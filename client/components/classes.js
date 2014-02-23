
var todos = require('api').todos

function todosLeft(data) {
  if (data.completed) return 0
  if (!data.todos.length) return 0
  var left = 0
    , hard = 0
    , justCleanup = true
  for (var i=0; i<data.todos.length; i++) {
    if (data.todos[i].completed) continue;
    if (data.todos[i].hard) hard++;
    else left++;
    if (!todos.types[data.todos[i].type].cleanup) {
      justCleanup = false
    }
  }
  if (!left && !hard) return 0
  return {
    left: left,
    justCleanup: justCleanup,
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
      if (todos.justCleanup) {
        return 'c-just-cleanup'
      }
      return 'c-has-todos'
    },
    children: function (data) {
      if (data.rels.display.lifespan.match(/Living/)) return 'ch-living'
      var l = data.rels.children.length
      for (var i=1; i<5; i++) {
        if (i*3 > l) return 'ch-' + (i*3)
      }
      return 'ch-lots'
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
      'c-just-cleanup': 'Cleanup',
      'c-has-todos': 'Research'
    },
    children: {
      'ch-living': 'Living',
      'ch-3': '<3',
      'ch-6': '<6',
      'ch-9': '<9',
      'ch-12': '<12',
      'ch-lots': 'Lots'
    },
    age: {
      'a-living': 'Living',
      'a-young': '0-29',
      'a-middle': '30-59',
      'a-old': '60-79',
      'a-ancient': '80+',
      'a-unknown': 'Unknown',
    },
    sources: {
      's-living': 'Living',
      's-none': 'None',
      's-few': '< 3',
      's-some': '< 6',
      's-many': '6 +',
      's-unknown': 'Not Evaluated',
    }
  }
}


