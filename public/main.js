var socket = io();

$('#form').submit(function(e) {
    e.preventDefault();
    var message = $('#input').val();
    var file = $('#fileInput')[0].files[0]; // Get the selected file

    if (file) {
        var formData = new FormData();
        formData.append('file', file);
        
        $.ajax({
            url: '/upload',
            type: 'POST',
            data: formData,
            processData: false,
            contentType: false,
            success: function(data) {
                socket.emit('chat message', { message: message, fileUrl: data.fileUrl });
                $('#input').val('');
                $('#fileInput').val('');
                if (file.type.startsWith('image/')) {
                    $('#messages').append($('<li>').html('You: ' + message + ' <img src="' + data.fileUrl + '" style="max-width: 200px;">').addClass('me'));
                    scrollToBottomAfterImageLoad();
                } else {
                    $('#messages').append($('<li>').text('You: ' + message + ' (File: ' + file.name + ')').addClass('me'));
                    scrollToBottom();
                }
            },
            error: function(err) {
                console.error('File upload error:', err);
            }
        });
    } else {
        socket.emit('chat message', { message: message });
        $('#input').val('');
        $('#messages').append($('<li>').text('You: ' + message).addClass('me'));
        scrollToBottom();
    }
    return false;
});

socket.on('chat message', function(data) {
    var message = data.message;
    var user = data.user;
    var fileUrl = data.fileUrl;
    var messageText = user + ': ' + message;
    if (fileUrl) {
        if (fileUrl.match(/\.(jpeg|jpg|gif|png)$/) != null) {
            messageText += ' <img src="' + fileUrl + '" style="max-width: 200px;">';
            $('#messages').append($('<li>').html(messageText).addClass('others'));
            scrollToBottomAfterImageLoad();
        } else {
            messageText += ' <a href="' + fileUrl + '" target="_blank">Download File</a>';
            $('#messages').append($('<li>').html(messageText).addClass('others'));
            scrollToBottom();
        }
    } else {
        $('#messages').append($('<li>').text(messageText).addClass('others'));
        scrollToBottom();
    }
});

function scrollToBottom() {
    var chatBox = document.getElementById("chat-box");
    chatBox.scrollTop = chatBox.scrollHeight;
}

function scrollToBottomAfterImageLoad() {
    var images = document.querySelectorAll('#messages img');
    var lastImage = images[images.length - 1];
    lastImage.onload = scrollToBottom;
}
