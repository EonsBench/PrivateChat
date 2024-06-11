const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const dotenv = require('dotenv');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

dotenv.config();

const port = process.env.PORT;

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', (socket) => {
  console.log('a user connected');
  const randomNickname = 'User'+Math.floor(Math.random()*1000);
  socket.nickname = randomNickname;
  console.log('Nickname set:', socket.nickname);

  socket.on('disconnect', () => {
    console.log('user disconnected');
  });


  // 클라이언트로부터 받은 메시지를 다른 클라이언트들에게 전송
  socket.on('chat message', (msg) => {
    console.log('message: ' + msg);
    socket.broadcast.emit('chat message', { user: socket.nickname, message: msg }); // 닉네임과 메시지를 객체로 전송
  });
});

server.listen(port, () => {
  console.log(`Server is Running on ${port}`);
});
