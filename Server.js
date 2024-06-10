import express from 'express';
import http from 'http';
import {Server} from Socket.io;
import { generateKeyPairSync, privateDecrypt } from 'crypto';

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const port = process.env.PORT || 3000;
app.listen(port, ()=>{
    console.log('Server is Running');
})