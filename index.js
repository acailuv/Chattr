  
var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

app.get('/chattr.html', function(req, res) {
  res.sendFile(__dirname + "/chattr.html");
});

io.on('connection', function(socket){
  console.log('connected');
  socket.username = "null";

  socket.on('chat message', function(msg){
    console.log("message received: " + msg);
    io.emit('chat message', socket.username, msg);
  });

  socket.on('username', function(username) {
    socket.username = username;
    console.log(username, socket.username);
  });

  socket.on('disconnect', function(){
    console.log('user disconnected');
  });
});

http.listen(3000, function(){
  console.log('listening on *:' + 3000);
});