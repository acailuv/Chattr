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

// Print all client in a room to console.
function printUsers(inRoom) {
    var clients = io.sockets.adapter.rooms[inRoom].sockets;

    for (var clientId in clients) {

        // this is the socket of each client in the room.
        var clientSocket = io.sockets.connected[clientId];

        // you can do whatever you need with this
        console.log(clientSocket.id + ' :: ' + clientSocket.username);

    }
}

// Get all client in a room.
function getUsernames(inRoom) {
    let usernames = [];
    let clients = io.sockets.adapter.rooms[inRoom].sockets;

    for (let clientId in clients) {

        let clientSocket = io.sockets.connected[clientId];
        usernames.push(clientSocket.username);

    }

    return usernames;
}

io.on('connection', function(socket) {

    // Default values that will be replace when logging in.
    socket.username = "NoName";
    socket.room = "world";
    socket.join(socket.room);
    io.in(socket.room).emit('refreshUserList', getUsernames(socket.room));
    socket.emit('refreshRoomName', socket.room);

    // Send Message
    socket.on('sendMessage', function(msg) {
        io.in(socket.room).emit('sendMessage', socket.username, socket.id, msg);
    });

    // Change Room
    socket.on('changeRoom', function(newRoom) {
        // if room has password, put smth here:
        // ...
        // ...
        socket.to(socket.room).emit('leaveRoom', socket.username);
        socket.room = newRoom;
        socket.leaveAll();
        socket.join(socket.room);
        io.in(socket.room).emit('joinRoom', socket.username);
        io.in(socket.room).emit('refreshUserList', getUsernames(socket.room));
        socket.emit('refreshRoomName', socket.room);
    });

    // Disconnect
    socket.on('disconnect', function() {
        io.in(socket.room).emit('disconnect', socket.username);
    });

    // Change Name (DEBUG ONLY)
    // socket.on('changeUsername', function(newName) {
    //     console.log("Name Change :: " + socket.username + ' -> ' + newName);
    //     socket.username = newName;
    // });

});

http.listen(3000, function(){
    console.log('listening on *:' + 3000);
});