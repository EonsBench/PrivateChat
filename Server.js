const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const dotenv = require('dotenv');
const multer = require('multer');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

dotenv.config();

const port = process.env.PORT || 3000;

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, 'public/uploads'));
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage });

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

app.post('/upload', upload.single('file'), (req, res) => {
  if (req.file) {
    const fileUrl = `/uploads/${req.file.filename}`;
    res.json({ fileUrl });
  } else {
    res.status(400).json({ error: 'No file uploaded' });
  }
});

io.on('connection', (socket) => {
  console.log('a user connected');
  const randomNickname = 'User' + Math.floor(Math.random() * 1000);
  socket.nickname = randomNickname;
  console.log('Nickname set:', socket.nickname);

  socket.on('disconnect', () => {
    console.log('user disconnected');
  });

  socket.on('chat message', (data) => {
    const { message, fileUrl } = data;
    socket.broadcast.emit('chat message', { user: socket.nickname, message, fileUrl });
  });
});

server.listen(port, () => {
  console.log(`Server is Running on ${port}`);
});
