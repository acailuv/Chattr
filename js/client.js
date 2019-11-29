// GLOBAL VARIABLES
var socket = io();
var clientId, clientUsername = "", clientRoom = "";
socket.on('connect', function() {
    clientId = socket.id;
});
var delivery = new Delivery(socket);
var PASSWORD_AUTH = false; // Correct password? (true/false)
var ROOM_FOUND = false; // Room found in database? (true/false)
var MESSAGE_HISTORY_BUFFER = []; // All the messages in the room (array)

// More-than-once functions.
// [?]: More-than-once functions are a set of code that are used more than once.

// -- Send Message
function appendMessage($separator, msg, senderUsername) {
    if (senderUsername == clientUsername) {
        $('#messages').append(
            $('<div class="speech-bubble right bg-success">').append([
                $('<div class="username"/>').text("You"),
                $separator,
                $('<div class="content"/>').text(msg)
            ])
        );
    } else {
        $('#messages').append(
            $('<div class="speech-bubble left" style="background: whitesmoke;">').append([
                $('<div class="username"/>').text(senderUsername),
                $separator,
                $('<div class="content"/>').text(msg)
            ])
        );
    }
}
function sendMessageHandler(username, msg) {
    let $separator = $('<div style="border-top: 1px solid rgba(0,0,0,0.2);"/>');
    appendMessage($separator, msg, username);
    let messages = document.getElementById('messages');
    messages.scrollTo({
        top: messages.scrollHeight,
        behavior: 'smooth'
    });
}

// -- Send Private Message
function appendPrivateMessage($separator, msg, senderUsername) {
    if (senderUsername == clientUsername) {
        $('#messages').append(
            $('<div class="speech-bubble right private bg-info">').append([
                $('<div class="username"/>').text("You"),
                $separator,
                $('<div class="content"/>').text(msg)
            ])
        );
    } else {
        $('#messages').append(
            $('<div class="speech-bubble left private bg-info">').append([
                $('<div class="username"/>').text(senderUsername),
                $separator,
                $('<div class="content"/>').text(msg)
            ])
        );
    }
}
function sendPrivateMessageHandler(username, msg) {
    let $separator = $('<div style="border-top: 1px solid rgba(0,0,0,0.2);"/>');
    appendPrivateMessage($separator, msg, username);
    let messages = document.getElementById('messages');
    messages.scrollTo({
        top: messages.scrollHeight,
        behavior: 'smooth'
    });
}

// -- Send File
function appendMessageFile($separator, content, senderUsername) {
    if (senderUsername == clientUsername) {
        $('#messages').append(
            $('<div class="speech-bubble right bg-success">').append([
                $('<div class="username"/>').text("You"),
                $separator,
                $('<div class="content"/>').html(content)
            ])
        );
    } else {
        $('#messages').append(
            $('<div class="speech-bubble left" style="background: whitesmoke;">').append([
                $('<div class="username"/>').text(senderUsername),
                $separator,
                $('<div class="content"/>').html(content)
            ])
        );
    }
}

function sendFileHandler(username, fileName, key) {
    let $separator = $('<div style="border-top: 1px solid rgba(0,0,0,0.2);"/>');
    let content = 
        `<article style="margin-top: 16px;">`+
            `<span class="fa fa-file-alt fa-lg"> </span><a style="font-size: 16px;" href="#" id="fileName" onclick="downloadFile(this.parentElement)">`+fileName+`</a>` + 
            `<span id="key" hidden>`+key+`</span><br>` + 
        `</article>`;

    appendMessageFile($separator, content, username);
    
    let messages = document.getElementById('messages');
    messages.scrollTo({
        top: messages.scrollHeight,
        behavior: 'smooth'
    });
}

//---------------------------------------------- End of More-than-once functions



// Callback functions.
// [?]: Callback functions are functions that are bound to certain elements.

// -- Check Room Credentials from Server
function checkRoomCredentials(roomId, pwd) {
    socket.emit('checkRoomCredentials', roomId.value, pwd.value);
}

// -- Check Room availability from server
function checkRoomAvailability(roomId) {
    socket.emit('checkRoomAvailability', roomId.value);
}

function checkPrivateMessageForm() {
    var username = document.getElementById('privateMessageUsername');
    var message = document.getElementById('privateMessage');

    if (username.value != '' && message.value != '') {
        document.getElementById('sendPrivateMessage').disabled = false;
    } else {
        document.getElementById('sendPrivateMessage').disabled = true;
    }
}

// -- Download File
function downloadFile(article) {
    var childs = article.children;
    var fileName, key;
    for (var i in childs) {
        if (childs[i].id == "fileName") {
            fileName = childs[i].innerHTML;
        }
        if (childs[i].id == "key") {
            key = childs[i].innerHTML;
            break;
        }
    }
    socket.emit('getFile', fileName, key);
}

//---------------------------------------------- End of Callback functions

// Change Room
function changeRoom (roomId) {

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
    if (document.getElementById('getMessageHistory').checked == true) {
        socket.emit('getMessageHistory', roomId.value);
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

    if (ROOM_FOUND == true) {
        alert("Room ID has already been used.");
        return false;
    }

    socket.emit('createRoom', roomId.value, confirmation.value);
    socket.emit('changeRoom', roomId.value);

    $('#createRoomModal').modal('hide');
    $('#messages').empty();
    $('#roomIdOnCreate').val('');
    $('#roomPasswordOnCreate').val('');
    $('#roomPasswordConfirmation').val('');
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
    let roomIdOnCreate = document.getElementById('roomIdOnCreate');
    let pwdOnCreate = document.getElementById('roomPasswordOnCreate');
    let confirmation = document.getElementById('roomPasswordConfirmation');
    $('button#createRoom').on('click', function(e) {
        createRoom(roomIdOnCreate, pwdOnCreate, confirmation);
    });

    // Change Room Listener
    let roomIdOnChange = document.getElementById('roomIdOnChange');
    $('button#changeRoom').on('click', function(e) {
        changeRoom(roomIdOnChange);
    });

    // Sync Message Button Listener
    $('#syncButton').on('click', function() {
        socket.emit('getMessageHistory', clientRoom);
    });

    // Send Message
    socket.on('sendMessage', function(username, msg) {
        sendMessageHandler(username, msg);
    });
    // -- Send Private Message
    socket.on('sendPrivateMessage', function sendPrivateMessage(senderUsername, msg, recipientFound) {
        if (!recipientFound) {
            alert('There is not any user with that username in this room.');
        } else {
            $('#privateChatModal').modal('hide');
            sendPrivateMessageHandler(senderUsername, msg);
        }
    })

    // Send File
    socket.on('sendFile', function(username, fileName, key) {
        sendFileHandler(username, fileName, key);
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
            $('#userList').append([
                $('<li class="list-group-item bg-dark" style="font-family: Consolas; font-size: 16px;">').html("<span class='fa fa-user'></span> " + usernames[i])
            ]);
        }
    });

    // Refresh Room Name
    socket.on('refreshRoomName', function(currentRoom) {
        $('p#roomName').text(currentRoom);
        clientRoom = currentRoom;

        // IF you want real-time sync (even when refresh)
        // socket.emit('getMessageHistory', clientRoom);
    });

    // Disconnect
    socket.on('disconnect', function(username) {
        $('#messages').append($('<div class="announcement"/>').html('<i><b>' + username + '</b>' + ' has gone offline.</i>'));
    });

    // dataUpdate: Sending data to update client's variables.
    socket.on('dataUpdate', function(dataSet, valueSet) {
        for (var i=0; i<dataSet.length; i++) {
            let evalString = dataSet[i] + ' = ' + valueSet[i];
            // console.log('Evaluated ->', evalString);
            eval(evalString);
        }
    });
    socket.on('setMessageHistory', function(messageHistory) {
        $('#messages').empty();
        MESSAGE_HISTORY_BUFFER = messageHistory;
        MESSAGE_HISTORY_BUFFER.forEach(chat => {
            if (chat.type == 'message') {
                sendMessageHandler(chat.user_id, chat.message);
            } else if (chat.type == 'file') {
                chat.message = chat.message.replace('files/', '');
                var fileName = chat.message.split("_")[0];
                var key = "_" + chat.message.split("_")[1];
                sendFileHandler(chat.user_id, fileName, key);
            } else {
                var whisperUser = chat.type.split(" ");
                if (whisperUser.includes(clientUsername)) {
                    sendPrivateMessageHandler(chat.user_id, chat.message);
                }
            }
        });
    });
    // Redirect to home page after session expires
    socket.on('redirect', function(destination) {
        window.location.href = destination
    })

    // Private Messaging
    $("#sendPrivateMessage").click(function sendPrivateMessageListener(e) {
        e.preventDefault();

        var recipient = $("#privateMessageUsername").val();
        var message = $("#privateMessage").val();

        if (recipient == clientUsername) {
            alert('You cannot send a private message to yourself.');
            return;
        }

        $("#privateMessage").val('');

        socket.emit('privateMessage', recipient, message);
    });
    $('#privateChatModal').on('shown.bs.modal', function (e) {
        var recipient = document.getElementById("privateMessageUsername");
        var message = document.getElementById("privateMessage");

        if (recipient.value != '') {
            message.focus();
        } else {
            recipient.focus();
        }
    });

    // Autofocus When Private Messaging
    $("#privateMessageButton").click(function() {
        if ($("#privateMessageUsername").val() != '') {
            document.getElementById("privateMessage").focus();
        }
    });

    // File Upload
    delivery.on('delivery.connect',function(delivery){
        $("#submitUpload").click(function(evt){
            evt.preventDefault();
            var file = $("#fileUpload")[0].files[0];
            delivery.send(file);
        });
    });
    delivery.on('send.success',function(){
        alert("File transfer successful!");
        $('#fileUpload').val('');
        $('#uploadModal').modal('hide');
    });

    // File Download
    socket.on('downloadFile', function(fileName, dataBuffer) {
        download(dataBuffer, fileName, function(err) {
            if (err) err;
        });
    });

});