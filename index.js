  
var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.get('/', function(req, res) {
  res.sendFile(__dirname + '/index.html');
});

app.get('/chattr.html', function(req, res) {
  res.sendFile(__dirname + "/chattr.html");
});

// If user connects
io.on('connection', function(socket) {
  socket.username = "noname";

  // If user sends a message
  socket.on('chat message', function(msg) {
    io.emit('chat message', socket.username, msg);
  });

  // If user changes username
  socket.on('username', function(username) {
    io.emit('username change', socket.username, username);
    socket.username = username;
  });

  // If user disconnects
  socket.on('disconnect', function() {
    io.emit('client disconnect', socket.username);
  });
});

http.listen(3000, function(){
  console.log('listening on *:' + 3000);
});