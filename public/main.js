var socket = io();
var encryptionKey;
var iv;

socket.on('encryptionParams', function(params){
    encryptionKey = CryptoJS.enc.Hex.parse(params.encryptionKey);
    iv = CryptoJS.enc.Hex.parse(params.iv);
});
const room = window.location.pathname.split('/').pop();
socket.emit('join room', room);
socket.on('user joined', ()=>{
    var joinMessage = '유저가 입장했습니다.'
    appendSystemMessage(joinMessage);
    console.log(joinMessage);
});
socket.on('user left',()=>{
    var leftMessage = '유저가 퇴장했습니다'
    appendSystemMessage(leftMessage);
});
// 채팅창에 시스템 메시지 추가
function appendSystemMessage(message) {
    $('#messages').append($('<li>').text(message).addClass('system-message'));
    scrollToBottom();
}
function encryptMessage(message) {
    var encrypted = CryptoJS.AES.encrypt(message, encryptionKey, { iv: iv });
    return encrypted.toString();
}
function decryptMessage(encryptedMessage) {
    var decrypted = CryptoJS.AES.decrypt(encryptedMessage, encryptionKey, { iv: iv });
    return decrypted.toString(CryptoJS.enc.Utf8);
}
// 파일 선택 시 모달 표시
$('#fileInput').change(function() {
    var file = $('#fileInput')[0].files[0];
    $('#fileName').text(file.name);
    $('#sendFileModal').modal('show');
});

// 파일 전송 확인 버튼 클릭 시 처리
$('#confirmSendFile').click(function() {
    var file = $('#fileInput')[0].files[0];
    if (!file) {
        return; // 파일이 선택되지 않은 경우 처리 중지
    }

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
            var message = $('#input').val().trim();
            var encryptedMessage = encryptMessage(message);
            socket.emit('chat message', { room, message: encryptedMessage, fileUrl: data.fileUrl });
            $('#input').val('');
            $('#fileInput').val('');
            if (file.type.startsWith('image/')) {
                $('#messages').append($('<li>').html(message + ' <a href="' + data.fileUrl + '" data-lightbox="image-1"><img src="' + data.fileUrl + '" style="max-width: 200px;"></a>').addClass('me'));
                scrollToBottomAfterImageLoad();
            }else if (file.type.startsWith('video/')) {
                $('#messages').append($('<li>').html(`${message} <video controls style="max-width: 200px;"><source src="${data.fileUrl}" type="${file.type}">Your browser does not support the video tag.</video>`).addClass('me'));
                scrollToBottom();
            } else {
                $('#messages').append($('<li>').text(message + ' (파일: ' + file.name + ')').addClass('me'));
                scrollToBottom();
            }
            $('#sendFileModal').modal('hide'); // 모달 닫기
        },
        error: function(err) {
            console.error('파일 업로드 오류:', err);
        }
    });
});

// 채팅 메시지 처리
$('#form').submit(function(e) {
    e.preventDefault();
    var message = $('#input').val().trim();
    if (message === "") {
        return false; 
    }
    var encryptedMessage = encryptMessage(message);
    socket.emit('chat message', { room, message: encryptedMessage });
    $('#input').val('');
    $('#messages').append($('<li>').text(message).addClass('me'));
    scrollToBottom();
    return false;
});

// 채팅 메시지 수신 처리
socket.on('chat message', function(data) {
    var message = data.message;
    var user = data.user;
    var fileUrl = data.fileUrl;
    var messageText = decryptMessage(message);
    if (fileUrl) {
        if (fileUrl.match(/\.(jpeg|jpg|gif|png)$/) != null) {
            messageText += ' <a href="' + fileUrl + '" data-lightbox="image-1"><img src="' + fileUrl + '" style="max-width: 200px;"></a>';
            $('#messages').append($('<li>').html(messageText).addClass('others'));
            scrollToBottomAfterImageLoad();
        }else if (fileUrl.match(/\.(mp4|webm|ogg)$/) != null) {
            messageText += ` <video controls style="max-width: 200px;"><source src="${fileUrl}" type="video/mp4">Your browser does not support the video tag.</video>`;
            $('#messages').append($('<li>').html(messageText).addClass('others'));
            scrollToBottom();
        } 
        else {
            messageText += ' <a href="' + fileUrl + '" target="_blank">파일 다운로드</a>';
            $('#messages').append($('<li>').html(messageText).addClass('others'));
            scrollToBottom();
        }
    } else {
        $('#messages').append($('<li>').text(messageText).addClass('others'));
        scrollToBottom();
    }
});
$('#leaveRoomBtn').click(function() {
    socket.emit('leave room', room); // 방에서 나가는 이벤트 발생
    window.location.href = '/'; // 메인 페이지로 이동 (예시)
});
// 화면 아래로 스크롤
function scrollToBottom() {
    var chatBox = document.getElementById("chat-box");
    chatBox.scrollTop = chatBox.scrollHeight;
}

// 이미지 로드 후 화면 아래로 스크롤
function scrollToBottomAfterImageLoad() {
    var images = document.querySelectorAll('#messages img');
    var lastImage = images[images.length - 1];
    lastImage.onload = scrollToBottom;
}
