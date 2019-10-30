var PASSWORD_AUTH = false;
var ROOM_FOUND = false;

// Change Room Button Listener
// Plans for final product:
// > when creating room, store password (if created) to database
// > when a user wants to change room, check database for that room
//   and ask password if that room is pasworded.
function changeRoom (roomId, pwd) {

    /**
     * Change Room:
     * Query from database based on roomId.
     * If not found -> handling
     */
    if (roomId.value == '') {
        alert("Room ID cannot be empty!");
        return false;
    }

    socket.emit('checkRoomCredentials', roomId.value, pwd.value);

    console.log(ROOM_FOUND, PASSWORD_AUTH);

    if (ROOM_FOUND == false) {
        alert("The specified Room ID cannot be found.");
        return false;
    }

    if (PASSWORD_AUTH == false) {
        alert("Wrong password.");
        return false;
    }

    socket.emit('changeRoom', roomId.value);
    $('#messages').empty();
    $('#changeRoomModal').modal('hide');
    // Get message from database here.
    // IF user wants to.

}

// Create Room Button Listener
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
    socket.on('sendMessage', function(username, id, msg) {
        let $separator = $('<div style="border-top: 1px solid rgba(0,0,0,0.2);"/>');

        if (id == sender) {
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

    // Authentication Flag Transfer
    socket.on('authentication', function(authKey, flag) {
        for (var i=0; i<authKey.length; i++) {
            eval(authKey[i] + '=' + flag[i]);
        }
    });

});