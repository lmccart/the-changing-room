const fs = require('fs');
const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

const Sound = require('./sound');

let curEmotion;

// LOGGING
const log4js = require("log4js");
log4js.configure({
  appenders: {
    chatLogs: { type: 'file', filename: 'logs/chat.log', daysToKeep: 1, pattern: 'yy-MM-dd.log'  },
    consoleLogs: { type: 'file', filename: 'logs/console.log', daysToKeep: 1, pattern: 'yy-MM-dd.log' },
    console: { type: 'console' }
  },
  categories: {
    chat: { appenders: ['chatLogs'], level: 'ALL' },
    default: { appenders: ['console', 'consoleLogs'], level: 'ALL' }
  }
});
const console = log4js.getLogger();
const chatLogger = log4js.getLogger('chat');

// DATA INIT
const emotions = JSON.parse(fs.readFileSync('all-emotions.json')); // read all emotions
const emotionName = fs.readFileSync('current.txt', {encoding:'utf8', flag:'r'}); 
curEmotion = emotions[emotionName];
console.debug('current emotion: ' + JSON.stringify(curEmotion));

// SOCKET
io.on('connection', (socket) => {
  console.debug('user connected: ' + socket.id);
  socket.emit('emotion:update', curEmotion);
  socket.on('disconnect', () => { console.debug('user disconnected: ' + socket.id); });

  socket.on('emotion:pick', function(emotionName){
    curEmotion = emotions[emotionName];
    io.emit('emotion:update', curEmotion);
    console.debug(curEmotion);
    fs.writeFileSync('current.txt', emotionName);

    Sound.playEmotion(curEmotion);
  });

  socket.on('chat:send', function(msg){
    // called by area 05 when user hits "send" on a chat message
    // message data gets modified based on emotion edit rules, and emitted to all clients on 05-convo1 page
  });
});

// SERVER SETUP
app.use('/', express.static('areas'));
app.get('/emotions', (req, res) => { res.json(emotions); });
http.listen(3000, () => { console.debug('listening on *:3000'); });
