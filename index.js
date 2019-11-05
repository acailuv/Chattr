var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var mysql = require('mysql');
var fs = require('fs');
var dl = require('delivery')
var randomString = require('randomstring');

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
        type VARCHAR(10)
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
    let room = io.sockets.adapter.rooms[inRoom];

    if (room != undefined) {
        let clients = room.sockets;

        for (let clientId in clients) {

            let clientSocket = io.sockets.connected[clientId];
            usernames.push(clientSocket.username);

        }
    }

    return usernames;
}

// More-than-once functions.
// [?]: More-than-once functions are a set of code that are used more than once.

//---------------------------------------------- End of More-than-once functions

io.on('connection', function(socket) {

    // Default values that will be replace when logging in.
    socket.username = "NoName";
    socket.room = "world";

    // Welcoming message and stuff
    socket.join(socket.room);
    io.in(socket.room).emit('joinRoom', socket.username);
    io.in(socket.room).emit('refreshUserList', getUsernames(socket.room));
    socket.emit('refreshRoomName', socket.room);
    socket.emit('dataUpdate', ['clientUsername'], ['"' + socket.username + '"']);

    // Send Message
    socket.on('sendMessage', function(msg) {
        query = `INSERT INTO chat_log
            VALUES (
                ?,
                ?,
                ?,
                "message"
            );`;
        db.query(query,
            [
                socket.username,
                socket.room,
                msg
            ],
            function(err) {
                if (err) throw err;
            }
        );
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
    // -- Create New Room
    socket.on('createRoom', function(roomId, pwd) {
        query = `INSERT INTO rooms
            VALUES (
                ?,
                ?
            );`;
        db.query(query,
            [
                roomId,
                pwd
            ],
            function(err) {
                if (err) throw err;
            }
        );
    });
    // -- Check Room Availability and Password
    socket.on('checkRoomCredentials', function(roomId, password) {
        var ROOM_FOUND = false;
        var PASSWORD_AUTH = false;

        query = `SELECT password
            FROM rooms
            WHERE room_id = ?`;
        db.query(query,
            [
                roomId
            ],
            function(err, result) {
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
            }
        );
    });
    // -- Check Room Availability
    socket.on('checkRoomAvailability', function(roomId) {
        var ROOM_FOUND = false;

        query = `SELECT *
            FROM rooms
            WHERE room_id = ?`;
        db.query(query,
            [
                roomId
            ],
            function(err, result) {
                if (err) throw err;
                if (result.length == 0) {
                    ROOM_FOUND = false;
                } else {
                    ROOM_FOUND = true;
                }
                socket.emit('dataUpdate', ['ROOM_FOUND'], [ROOM_FOUND]);
            }
        );
    });
    // -- Get Message History
    socket.on('getMessageHistory', function(roomId) {
        query = `SELECT user_id, message, type
            FROM chat_log
            WHERE room_id = ?`;
        db.query(query,
            [
                roomId
            ],
            function(err, result) {
                if (err) throw err;
                socket.emit('setMessageHistory', result);
            }
        );
    });

    // Disconnect
    socket.on('disconnect', function() {
        io.in(socket.room).emit('disconnect', socket.username);
        io.in(socket.room).emit('refreshUserList', getUsernames(socket.room));
    });

    // File Upload
    var delivery = dl.listen(socket);
    delivery.on('receive.success', function(file){
        var key;
        var url;
        do {
            key = "_" + randomString.generate();
        } while(fs.existsSync('files/'+file.name+key));

        url = 'files/'+file.name+key

        fs.writeFile(url, file.buffer, function(err){
            if(err) throw err;
        });

        query = `INSERT INTO chat_log
            VALUES (
                ?,
                ?,
                ?,
                "file"
            );`;
        db.query(query,
            [
                socket.username,
                socket.room,
                url
            ],
            function(err) {
                if (err) throw err;
            }
        );

        io.in(socket.room).emit('sendFile', socket.username, file.name, key);
    });

    // File Download
    socket.on('getFile', function(fileName, key) {

        var url = 'files/'+fileName+key;

        fs.readFile(url, function(err, data) {
            if (err) throw err;
            socket.emit('downloadFile', fileName, data);
        });
    });

});

http.listen(3000, function(){
    console.log('listening on *:' + 3000);
});