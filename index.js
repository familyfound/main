

var express = require('express')
  , cors = require('cors')
  , app = express()
  , server = require('http').createServer(app)
  , io = require('socket.io').listen(server)

  , api = require('api')

  , config = require('./lib/config')

app.use(cors())
app.use(express.static(__dirname + '/public'))

setup(config.mongo, io, app)

server.listen(config.port, function () {
  console.log('listening')
})



