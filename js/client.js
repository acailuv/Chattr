// Change Name (DEBUG ONLY)
// function changeName () {
//     let newName = prompt("New Name:");
//     socket.emit('changeUsername', newName);
// }

// Change Room (DEBUG ONLY)
// Plans for final product:
// > when creating room, store password (if created) to database
// > when a user wants to change room, check database for that room
//   and ask password if that room is pasworded.
function changeRoom () {
    let newRoom = prompt("New Room:");
    if (newRoom != null) {
        socket.emit('changeRoom', newRoom);
        $('#messages').empty();
        // Get message from database here.
        // IF user wants to.
    }
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
    // Later...
    // ...

    // Change Room Listener
    // Later...
    // ...

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
                $('<li class="list-group-item fa fa-user bg-secondary"/>').text(' ' + usernames[i])
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
    });

});