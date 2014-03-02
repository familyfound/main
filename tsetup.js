
var glob = require('glob')
  , browserify = require('browserify')

glob('./test/client/*.js', function (err, items) {
  items.forEach(function (item) {
    var last = item.split('/').pop()
      , b = browserify()
    b.add(item)
    b.require(item, {expose: 'fixtures'})
    b.require('./client/components/' + last, {expose: 'component'})
    b.bundle().pipe(fs.createWriteStream('./test/client/build/' + last))
  })
})

