  
var express = require('express')
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.get('/', function(req, res) {
  res.sendFile(__dirname + '/html/index.html');
});

app.get('/chattr.html', function(req, res) {
  res.sendFile(__dirname + "/html/chattr.html");
});

app.use(express.static(__dirname));

// {socket.id : currentUsername}
var onlineUsers = {};

// If user connects
io.on('connection', function(socket) {
  socket.username = "noname";
  socket.room = "world";
  socket.join("world");
  userConnect(socket);

  // If user sends a message
  socket.on('chat message', function(msg) {
    sendMessage(socket, msg);
  });

  // If user changes username
  socket.on('username change', function(username) {
    changeUsername(socket, username);
    socket.username = username;
  });

  // If user disconnects
  socket.on('disconnect', function() {
    clientDisconnect(socket);
    delete onlineUsers[socket.id];
    refreshUserList(socket);
  });

  // Change room
  socket.on('change room', function(roomID) {
    leaveRoom(socket);
    socket.room = roomID;
    socket.leaveAll();
    socket.join(socket.room);
    joinRoom(socket);
    refreshUserList(socket);
  });

  // Refresh username
  socket.on('username refresh', function(newUsername) {
    socket.username = newUsername;
    onlineUsers[socket.id] = newUsername;
    refreshUserList(socket);
  });

});

var refreshUserList = function(socket) {
  let clientsInRoom = io.sockets.adapter.rooms[socket.room];
  let usersInRoom = [];
  for (let client in clientsInRoom) {
    usersInRoom.push(io.sockets.connected[client]);
  }
  console.log(usersInRoom);
  io.emit('pass online users', onlineUsers, usersInRoom);
}

var clientDisconnect = function(socket) {
  io.emit('client disconnect', socket.username);
}

var joinRoom = function(socket) {
  socket.to(socket.room).emit('room join', socket.username);
}

var leaveRoom = function(socket) {
  socket.to(socket.room).emit('room leave', socket.username);
}

var changeUsername = function(socket, username) {
  io.in(socket.room).emit('username change', socket.username, username);
}

var sendMessage = function(socket, msg) {
  io.in(socket.room).emit('chat message', socket.username, socket.id, msg);
}

var userConnect = function(socket) {
  socket.emit('user enter', socket.id);
}

http.listen(3000, function(){
  console.log('listening on *:' + 3000);
});