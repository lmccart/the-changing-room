const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
app.use('/', express.static('areas'))

const log4js = require("log4js");

log4js.configure({
  appenders: {
    emotionLogs: { type: 'file', filename: 'emotion.log' },
    chatLogs: { type: 'file', filename: 'chat.log' },
    consoleLogs: { type: 'file', filename: 'console.log' },
    console: { type: 'console' }
  },
  categories: {
    emotion: { appenders: ['emotionLogs'], level: 'ALL' },
    chat: { appenders: ['chatLogs'], level: 'ALL' },
    default: { appenders: ['console', 'consoleLogs'], level: 'ALL' }
  }
});


const console = log4js.getLogger();
const emotionLogger = log4js.getLogger('emotion');
const chatLogger = log4js.getLogger('chat');

io.on('connection', (socket) => {
  console.debug('user connected: ' + socket.id);
  socket.on('disconnect', () => { console.debug('user disconnected: ' + socket.id); });

  socket.on('emotion update', function(msg){
    io.emit('emotion update', msg);
    console.debug(msg);
    emotionLogger.info(msg);
  });
});


http.listen(3000, () => {
  console.debug('listening on *:3000');
});