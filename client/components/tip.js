
var todos = require('api').todos

module.exports = {
  message: message
}

function todoTitle(data) {
  var tpl = todos.titles[data.type]
    , items = data.data
  if (items && items.args) {
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
}

function todoLines(todos) {
  var lines = []
    , cls = ''
  for (var i=0; i<todos.length; i++) {
    if (todos[i].completed) continue;
    cls = 'tip__todo' + (todos[i].hard ? ' tip__todo--hard' : '')
    lines.push('<span class="' + cls + '">' + todoTitle(todos[i]) + '</span>')
  }
  return lines
}

function message(data) {
  if (!data || !data.rels) return 'loading'
  var display = data.rels.display
    , lines = []
  lines.push('<span class="tip__name">' + display.name + '</span> <em>' + display.lifespan + '</em>')
  if (display.age) {
    lines[0] += ' (' + display.age + ' years)'
  }
  if (display.birthPlace) {
    lines.push('<strong>Born:</strong> ' + display.birthPlace)
  }
  if (display.deathPlace) {
    lines.push('<strong>Died:</strong> ' + display.deathPlace)
  }
  if (data.more && data.more.sources && data.more.sources.length) {
    lines.push(data.more.sources.length + ' sources attached')
  }

  lines.push(data.rels.children.length + ' children recorded')

  if (!data.data) {
    lines.push('Not yet processed')
  } else {
    lines.push('<div className="tip__sep"></div>')
    lines = lines.concat(todoLines(data.data.todos))
    /*
    var todos = todosLeft(data.data)
    if (!todos) {
      lines.push('Research complete!')
    } else {
      if (todos.todos) {
        lines.push('Found ' + (todos.todos + todos.hard) + ' things todo')
        if (todos.hard) {
          lines.push(todos.hard + ' things marked as hard')
        }
      } else {
        lines.push('Found ' + todos.hard + ' things to do, all hard')
      }
    }
    */
  }

  return lines.join('<br/>')
}

