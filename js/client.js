// GLOBAL VARIABLES
var socket = io();
var sender;
socket.on('connect', function() {
    sender = socket.username;
    username = socket.username;
});
var delivery = new Delivery(socket);
var PASSWORD_AUTH = false; // Correct password? (true/false)
var ROOM_FOUND = false; // Room found in database? (true/false)
var MESSAGE_HISTORY_BUFFER = []; // All the messages in the room (array)

// More-than-once functions.
// [?]: More-than-once functions are a set of code that are used more than once.
// -- Send Message
function sendMessageHandler(username, msg) {
    let $separator = $('<div style="border-top: 1px solid rgba(0,0,0,0.2);"/>');

        if (username == sender) {
            $('#messages').append(
                $('<div class="speech-bubble right bg-success">').append([
                    $('<div class="username"/>').text("You"),
                    $separator,
                    $('<div class="content"/>').text(msg)
                ])
            );
        } else {
            $('#messages').append(
                $('<div class="speech-bubble left bg-light">').append([
                    $('<div class="username"/>').text(username),
                    $separator,
                    $('<div class="content"/>').text(msg)
                ])
            );
        }
        let messages = document.getElementById('messages');
        messages.scrollTo({
            top: messages.scrollHeight,
            behavior: 'smooth'
        });
}
//---------- End of More-than-once functions


// Check Room Credentials from Server
function checkRoomCredentials(roomId, pwd) {
    socket.emit('checkRoomCredentials', roomId.value, pwd.value);
    console.log(ROOM_FOUND, PASSWORD_AUTH);
}

// Change Room
function changeRoom (roomId, pwd) {

    if (roomId.value == '') {
        alert("Room ID cannot be empty!");
        return false;
    }

    if (ROOM_FOUND == false) {
        alert("The specified Room ID cannot be found.");
        return false;
    }

    if (PASSWORD_AUTH == false) {
        alert("Wrong password.");
        return false;
    }

    socket.emit('changeRoom', roomId.value);

    // Get message from database IF needed.
    if (document.getElementById('getMessageHistory').checked) {
        socket.emit('getMessageHistory', roomId.value);
        MESSAGE_HISTORY_BUFFER.forEach(chat => {
            sendMessageHandler(chat.user_id, chat.message);
        });
    }

    $('#changeRoomModal').modal('hide');
    $('#messages').empty();
    $('#roomIdOnChange').val('');
    $('#roomPasswordOnChange').val('');
}

// Create Room
function createRoom (roomId, pwd, confirmation) {

    if (pwd.value != confirmation.value) {
        alert("Passwords does not match. Please try again.");
        return false;
    }

    if (roomId.value == '') {
        alert("Room ID cannot be empty!");
        return false;
    }

    /**
     * Create a room:
     * > Check if room already exists (incl. handling).
     * > Query to database -> (creatorID(user that created the room), roomName, password(if exists))
     * > Put these [HERE]
     */

    socket.emit('changeRoom', newRoom);
    $('#messages').empty();
}


// Start of JQuery
$(document).ready(function() {

    // Initialize Tooltip
    $(function () {
        $('[data-toggle="tooltip"]').tooltip()
    })

    // Message Form Listener
    $('#messageForm').submit(function(e) {
        e.preventDefault();
        if ($('#messageBox').val() != '') {
            socket.emit('sendMessage', $('#messageBox').val());
            $('#messageBox').val('');
        }
    });

    // Create Room Listener
    let roomId = document.getElementById('roomIdOnCreate');
    let pwd = document.getElementById('roomPasswordOnCreate');
    let confirmation = document.getElementById('roomPasswordConfirmation');
    $('button#createRoom').on('click', function(e) {
        createRoom(roomId, pwd, confirmation);
    });

    // Change Room Listener
    roomId = document.getElementById('roomIdOnChange');
    pwd = document.getElementById('roomPasswordOnChange');
    $('button#changeRoom').on('click', function(e) {
        changeRoom(roomId, pwd);
    });

    // Send Message
    socket.on('sendMessage', function(username, msg) {
        sendMessageHandler(username, msg);
    });

    // Join Room
    socket.on('joinRoom', function(username) {
        $('#messages').append(
            $('<div class="announcement"/>').html('<i><b>' + username + '</b>' + ' has joined the room.</i>')
        );
    });

    // Leave Room
    socket.on('leaveRoom', function(username) {
        $('#messages').append(
            $('<div class="announcement"/>').html('<i><b>' + username + '</b>' + ' has left the room.</i>')
        );
    });

    // Refresh users list
    socket.on('refreshUserList', function(usernames) {
        $('#userList').empty();
        for (let i in usernames) {
            $('#userList').append([,
                $('<li class="list-group-item fa fa-user bg-dark"/>').text(' ' + usernames[i])
            ]);
        }
    });

    // Refresh Room Name
    socket.on('refreshRoomName', function(currentRoom) {
        $('p#roomName').text(currentRoom);
    });

    // Disconnect
    socket.on('disconnect', function(username) {
        $('#messages').append($('<div class="announcement"/>').html('<i><b>' + username + '</b>' + ' has gone offline.</i>'));
        
        // Refreshing User List
        $('#userList').empty();
        for (let i in usernames) {
            $('#userList').append([,
                $('<li class="list-group-item fa fa-user bg-dark"/>').text(' ' + usernames[i])
            ]);
        }
    });

    // dataSend: Sending data to update client's variables.
    socket.on('dataUpdate', function(dataSet, valueSet) {
        for (var i=0; i<dataSet.length; i++) {
            eval(dataSet[i] + ' = ' + valueSet[i]);
        }
    });

    // File Transfer
    delivery.on('delivery.connect',function(delivery){
        $("#submitUpload").click(function(evt){
            var file = $("#fileUpload")[0].files[0];
            delivery.send(file);
            evt.preventDefault();
        });
    });

    delivery.on('send.success',function(fileUID){
        alert("File transfer successful!");
        $('#fileUpload').val('');
        $('#uploadModal').modal('hide');
    });

});