var socket = io();

$('form').submit(function() {
  var message = $('#input').val();
  socket.emit('chat message', message);
  $('#input').val('');
  $('#messages').append($('<li>').text('You: ' + message).addClass('me'));
  return false;
});

socket.on('chat message', function(data) {
  $('#messages').append($('<li>').text(data.user + ': ' + data.message).addClass('others'));
});