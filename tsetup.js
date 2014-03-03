
var glob = require('glob')
  , fs = require('fs')
  , mkdirp = require('mkdirp')
  , browserify = require('browserify')

glob('./test/client/fixtures/*.js', function (err, items) {
  var text = '<html><body><h1>Things</h2>'
  items.forEach(function (item) {
    var last = item.split('/').pop()
      , bare = last.split('.')[0]
      , dir = 'test/client/' + bare
    mkdirp.sync('test/client/' + bare)
    fs.writeFileSync(dir + '/lib.js', 'window.component = require("main/client/components/' + bare + '");')
    text += '<a href="' + bare + '/index.html">' + bare + '</a><br>'

    var b = browserify()
    b.add(item)
    b.require(item, {expose: 'fixtures'})
    var str = fs.createWriteStream('./test/client/' + bare + '/fixture.js')
    b.bundle({standalone: 'data'}).pipe(str)
  })
  text += '</body></html>'
  fs.writeFileSync('test/client/index.html', text)
})

