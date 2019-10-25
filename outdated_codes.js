//////////////////////////////////////////////////////////
// Index.js "Listeners"
/////////////////////////////////////////////////////////

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

socket.on('user enter', function(id) {
    let newUsername = prompt("Choose your username:");
    socket.emit('username refresh', newUsername);
    $('#currentUsername').text(newUsername + '@' + id);
});

////////////////////////////////////////////////////
// Client "Listeners"
///////////////////////////////////////////////////
// Send Button Listener
$('#messageEntry').submit(function(e) {
    e.preventDefault();
    socket.emit('chat message', $('#m').val());
    $('#m').val('');
    return false;
});

// If user sends message
socket.on('chat message', function(username, id, msg) {
console.log(socketId, id);
if (id == socketId) {
    $('#messages').append(
    $('<div class="speech-bubble right">')
        .append([
        $('<span class="username"/>').text(username),
        $('<div style="border: 1px solid rgba(0,0,0,0.2);"/>'),
        $('<span class="content"/>').text(msg)
        ])
    );
} else {
    $('#messages').append(
    $('<div class="speech-bubble left">')
        .append([
        $('<span class="username"/>').text(username),
        $('<div style="border: 1px solid rgba(0,0,0,0.2);"/>'),
        $('<span class="content"/>').text(msg)
        ])
    );
}
//$('#messages').append($('<li>').text(username + '@' + id + "> " + msg));
window.scrollTo(0, document.body.scrollHeight);
});

// If user changes username
socket.on('username change', function(oldUsername, newUsername) {
$('#messages').append($('<li>').html('<i><b>' + oldUsername + '</b>' + ' has changed his/her username to ' + '<b>' + newUsername + '</b></i>'));
window.scrollTo(0, document.body.scrollHeight);
});

// If user disconnects
socket.on('client disconnect', function(username) {
$('#messages').append($('<li>').html('<i><b>' + username + '</b>' + ' has gone offline.</i>'));
});

// If user joins room
socket.on('room join', function(username) {
$('#messages').append($('<li>').html('<i><b>' + username + '</b>' + ' has joined the room.</i>'));
});

// If user leaves room
socket.on('room leave', function(username) {
$('#messages').append($('<li>').html('<i><b>' + username + '</b>' + ' has left the room.</i>'));
});