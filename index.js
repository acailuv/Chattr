var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var mysql = require('mysql');
var fs = require('fs');
var dl = require('delivery')


// Database Initialization
var db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'chattr'
});

db.connect(function(err) {
    if (err) throw err;

    query = `CREATE TABLE IF NOT EXISTS chat_log (
        user_id varchar(32) NOT NULL,
        room_id varchar(32),
        message LONGTEXT,
        datetime DATETIME
    )`;
    db.query(query, function(err) {
        if (err) throw err;
    });

    query = `CREATE TABLE IF NOT EXISTS rooms (
        room_id varchar(32) NOT NULL,
        password varchar(32),
        PRIMARY KEY (room_id)
    )`;
    db.query(query, function(err) {
        if (err) throw err;
    });

    query = `CREATE TABLE IF NOT EXISTS users (
        user_id varchar(32) NOT NULL,
        password varchar(32),
        PRIMARY KEY (user_id)
    )`;
    db.query(query, function(err) {
        if (err) throw err;
    });
});

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

    // Welcoming message and stuff
    socket.join(socket.room);
    io.in(socket.room).emit('joinRoom', socket.username);
    io.in(socket.room).emit('refreshUserList', getUsernames(socket.room));
    socket.emit('refreshRoomName', socket.room);

    // Send Message
    socket.on('sendMessage', function(msg) {
        query = `INSERT INTO chat_log VALUES (
            "`+socket.username+`",
            "`+socket.room+`",
            "`+msg+`",
            NOW()
        );`;
        db.query(query, function(err) {
            if (err) throw err;
        });
        io.in(socket.room).emit('sendMessage', socket.username, msg);
    });

    // Change Room
    socket.on('changeRoom', function(newRoom) {
        socket.to(socket.room).emit('leaveRoom', socket.username);
        socket.room = newRoom;
        socket.leaveAll();
        socket.join(socket.room);
        io.in(socket.room).emit('joinRoom', socket.username);
        io.in(socket.room).emit('refreshUserList', getUsernames(socket.room));
        socket.emit('refreshRoomName', socket.room);
    });
    // -- Check Room Password
    socket.on('checkRoomCredentials', function(roomId, password) {
        let ROOM_FOUND = false;
        let PASSWORD_AUTH = false;

        query = `SELECT password
            FROM rooms
            WHERE room_id = "` + roomId + `"`;
        db.query(query, function(err, result) {
            if (err) throw err;

            if (result.length == 0) {
                ROOM_FOUND = false;
            } else {
                ROOM_FOUND = true;
                let correctPassword = result[0].password;
                if (password == correctPassword) {
                    PASSWORD_AUTH = true;
                } else {
                    PASSWORD_AUTH = false;
                }
            }
            socket.emit('dataUpdate', ['ROOM_FOUND', 'PASSWORD_AUTH'], [ROOM_FOUND, PASSWORD_AUTH]);
        });
    });
    // -- Get Message History
    socket.on('getMessageHistory', function(roomId) {
        query = `SELECT user_id, message, datetime
            FROM chat_log
            WHERE room_id = "` + roomId + `"`;
        console.log(query);
        db.query(query, function(err, result) {
            if (err) throw err;
            console.log(result);
            socket.emit('dataUpdate', ['MESSAGE_HISTORY_BUFFER'], [result]);
        });
    });

    // Disconnect
    socket.on('disconnect', function() {
        io.in(socket.room).emit('disconnect', socket.username);
    });

    // File Transfer
    var delivery = dl.listen(socket);
    delivery.on('receive.success', function(file){
        fs.writeFile("files/"+file.name, file.buffer, function(err){
            if(err) throw err;
        });
    });
    

});

http.listen(3000, function(){
    console.log('listening on *:' + 3000);
});