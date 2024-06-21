const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const dotenv = require('dotenv');
const multer = require('multer');
const crypto = require('crypto');
const helmet = require('helmet');
const {v4:uuidv4} = require('uuid');
const schedule = require('node-schedule');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

dotenv.config();

const port = process.env.PORT;

let encryptionKey;
let iv;

crypto.randomBytes(16,(err,keyBuffer)=>{
  if(err) throw err;
  encryptionKey=keyBuffer;
})
crypto.randomBytes(16,(err,ivBuffer)=>{
  if(err) throw err;
  iv=ivBuffer;
})
schedule.scheduleJob('0 0 * * *', function(){
    const directory = path.join(__dirname, 'public', 'uploads');
    fs.readdir(directory, (err, files)=>{
        if(err) throw err;
        for(const file of files){
            fs.unlink(path.join(directory, file), err=>{
                if(err) throw err;
                console.log(`Deleted Files`);
            });
        }
    })
})
function fileFilter(req, file, cb) {
    const fileType = !/\.(exe|msi)$/i.test(path.extname(file.originalname).toLowerCase());
    if (fileType) {
        cb(null, true);
    } else {
        cb(new Error('허용되지 않는 파일 유형입니다.'));
    }
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, 'public/uploads'));
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ 
    storage: storage,
    limits: {fileSize: 1024*1024*5},
    fileFilter: fileFilter
 });

app.use(express.static(path.join(__dirname, 'public')));
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "https://code.jquery.com", "https://cdnjs.cloudflare.com", "https://stackpath.bootstrapcdn.com"]
        }
      }
}));

let chatRooms = [];

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

app.get('/chat/:rooms', (req,res)=>{
    res.sendFile(__dirname + '/public/chat.html');
});
app.post('/create-room',(req,res)=>{
    const roomName = `Room${uuidv4()}`;
    chatRooms.push(roomName);
    res.json({roomName});
});
app.get('/rooms',(req,res)=>{
    res.json(chatRooms);
})
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
    const uuid = uuidv4();
    const randomNickname = 'User' + uuid;
    socket.nickname = randomNickname;
    console.log('Nickname set:', socket.nickname);
    socket.emit('encryptionParams', { encryptionKey: encryptionKey.toString('hex'), iv: iv.toString('hex')});
    socket.on('disconnect', () => {
        console.log('user disconnected');
        if(socket.room){
            socket.leave(socket.room);
            socket.broadcast.to(socket.room).emit('user left',{nickname: socket.nickname});
            socket.room = null;
        }
        //socket.to(room).broadcast.emit('user left', {nickname: socket.nickname});
    });

    socket.on('chat message', (data) => {
      const encryptedMessage = data.message;
      const decryptedMessage = decryptMessage(encryptedMessage); 
      const sendMessage = encryptMessage(decryptedMessage);
      const { fileUrl, room } = data;

      socket.broadcast.to(room).emit('chat message', { user: socket.nickname, message: sendMessage, fileUrl });
    });
    socket.on('join room', (room)=>{
        socket.join(room);
        socket.room = room;
        console.log(`${socket.nickname}: join ${room}`);
        socket.broadcast.to(room).emit('user joined', {nickname: socket.nickname});
    });
    socket.on('leave room',(req,res)=>{
        if(socket.room){
            socket.leave(socket.room);
            socket.broadcast.to(socket.room).emit('user left',{nickname: socket.nickname});
            socket.room = null;
        }
    });
});

server.listen(port, () => {
    console.log(`Server is Running on ${port}`);
});
function decryptMessage(encryptedMessage) {
  const decipher = crypto.createDecipheriv('aes-128-cbc', encryptionKey, iv);
  let decrypted = decipher.update(encryptedMessage, 'base64', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}
function encryptMessage(decryptedMessage){
    const cipher = crypto.createCipheriv('aes-128-cbc', encryptionKey, iv);
    let encrypted = cipher.update(decryptedMessage,'utf8','base64');
    encrypted += cipher.final('base64');
    return encrypted;
}