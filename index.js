'use strict';

var os = require('os');
// var nodeStatic = require('node-static');
var express = require('express');
var app = express();
var https = require('https');
// var https = require('https');
var fs = require('fs');

console.log(__dirname + '/public')
app.use(express.static(__dirname + '/public'));

const options = {
  key: fs.readFileSync('188.166.228.107.key'),
  cert: fs.readFileSync('188.166.228.107.cert'),
  // requestCert: false,
  // rejectUnauthorized: false
  // key: fs.readFileSync('C:/devs/xampp/apache/conf/ssl.key/server.key'),
  // cert: fs.readFileSync('C:/devs/xampp/apache/conf/ssl.crt/server.crt')
};

var server = https.createServer(options, app);

server.listen(8080);
var io = require('socket.io')(server);

app.use(function (req, res, next) {
  console.log('Time:', Date.now());
  res.header('Access-Control-Allow-Origin-', "*"); 
  res.header('Access-Control-Allow-Methods­','GET,PUT,POST,DELETE'); 
  res.header('Access-Control-Allow-Headers­', 'Content-Type'); 
  next();
}); 


io.on('connection', function(socket) {
  console.log("io connect success");
  // convenience function to log server messages on the client
  function log() {
    var array = ['Message from server:'];
    array.push.apply(array, arguments);
    socket.emit('log', array);
  }

	socket.on('error', function (reason){
        console.error('Unable to connect Socket.IO', reason);
    });

  socket.on('message', function(message) {
    log('Client said: ', message);
    // for a real app, would be room-only (not broadcast)
    socket.broadcast.emit('message', message);
  });

  socket.on('create or join', function(room) {
    log('Received request to create or join room ' + room);

    var numClients = io.sockets.sockets.length;
    console.log("io.length", io.sockets.sockets.length)
    log('Room ' + room + ' now has ' + numClients + ' client(s)');

    if (numClients === 1) {
      socket.join(room);
      log('Client ID ' + socket.id + ' created room ' + room);
      socket.emit('created', room, socket.id);

    } else if (numClients === 2) {
      log('Client ID ' + socket.id + ' joined room ' + room);
      io.in(room).emit('join', room);
      socket.join(room);
      socket.emit('joined', room, socket.id);
      io.in(room).emit('ready');
    } else { // max two clients
      socket.emit('full', room);
    }
  });

  socket.on('ipaddr', function() {
    var ifaces = os.networkInterfaces();
    for (var dev in ifaces) {
      ifaces[dev].forEach(function(details) {
        if (details.family === 'IPv4' && details.address !== '127.0.0.1') {
          socket.emit('ipaddr', details.address);
        }
      });
    }
  });

  socket.on('getTurnServer', function(turnUrl){
    console.log('getting turn server');
    https.get(turnUrl, (res) => {
      
      res.on('data', (chunk) => {
        var texts = chunk.toString('utf8');
	sendTurnUrl(texts);
	// process utf8 text chunk
      });

    }).on('error', (e) => {
      console.error(e);
    });
  });

  function sendTurnUrl(texts){
	console.log(" texts", texts);
	console.log(" type", typeof texts);
  	var socket = io.emit('responeTurnServer', {res: texts});
	console.log(socket);
  }

  socket.on('bye', function(){
    console.log('received bye');
  });

});
