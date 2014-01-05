

var express = require('express')
  , cors = require('cors')
  , app = express()
  , server = require('http').createServer(app)
  , io = require('socket.io').listen(server)

  , api = require('api')

  , config = require('./lib/config')
  , auth = require('fsauth')(config.host)

app.use(cors())
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(express.cookieParser(config.secret));
app.use(express.session());

auth.addRoutes(app, '/auth/check-login', '/auth/callback', config.fs_key)

app.use(express.static(__dirname + '/public'))

// now the sockets will talk
api(config.mongo, io, app)

server.listen(config.port, function () {
  console.log('listening')
})


