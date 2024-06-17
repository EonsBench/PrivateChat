var socket = io();
var encryptionKey;
var iv;
socket.on('encryptionParams', function(params){
    encryptionKey=CryptoJS.enc.Hex.parse(params.encryptionKey);
    iv=CryptoJS.enc.Hex.parse(params.iv);
    console.log(`key: ${encryptionKey} , iv: ${iv}`);
})
function encryptMessage(message) {
    var encrypted = CryptoJS.AES.encrypt(message, encryptionKey, { iv: iv });
    return encrypted.toString();
}


$('#form').submit(function(e) {
    e.preventDefault();
    var message = $('#input').val();
    var file = $('#fileInput')[0].files[0]; 

    if (file) {
        var formData = new FormData();
        formData.append('file', file);
        formData.append('iv', iv.toString(CryptoJS.enc.Hex)); 

        $.ajax({
            url: '/upload',
            type: 'POST',
            data: formData,
            processData: false,
            contentType: false,
            success: function(data) {
                var encryptedMessage = encryptMessage(message);
                socket.emit('chat message', { message: encryptedMessage, fileUrl: data.fileUrl });
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
        var encryptedMessage = encryptMessage(message);
        socket.emit('chat message', { message: encryptedMessage });
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

