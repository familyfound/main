
var express = require('express')
  , cors = require('cors')
  , app = express()
  , server = require('http').createServer(app)
  , io = require('socket.io').listen(server)

  , api = require('api')

  , config = require('./lib/config')
  , auth = require('fsauth')(config.host)

io.set('log level', 1)
app.use(cors())
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(express.cookieParser(config.secret));
app.use(express.session());

auth.addRoutes(app, {
  redirect: config.host + '/oauth/connect',
  check_login_path: '/auth/check-login',
  callback_path: '/oauth/connect',
  logout_redirect: '/',
  logout_path: '/logout',
  key: config.fs_key
})

app.use(function (req, res, next) {
  var protocol = req.headers['x-forwarded-proto'] || req.protocol
    , host = protocol + '://' + req.headers.host
  if (host !== config.host) {
    console.warn('Redirecting to expected hostname')
    return res.redirect(config.host)
  }
  next()
})
app.use(express.static(__dirname + '/web'))

// now the sockets will talk
api(config.mongo, io, app)

server.listen(config.port, function () {
  console.log('listening')
})


