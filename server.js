require('dotenv').config();
const fs = require('fs');
const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

const Sound = require('./sound');
const Lights = require('./lights');

let curEmotion;

// Webpack setup for hot reloading dev environment
const webpack = require('webpack');
const webpackConfig = require('./webpack.config');
const compiler = webpack(webpackConfig);

app.use(require("webpack-dev-middleware")(compiler, {
  publicPath: webpackConfig.output.publicPath,
  writeToDisk: true,
}));

app.use(require("webpack-hot-middleware")(compiler, {
  path: '/__webpack_hmr', heartbeat: 10 * 1000
}));

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
    Lights.playEmotion(curEmotion);
  });

  socket.on('chat:send', function(msg){
    // called by area 04 when user hits "send" on a chat message
    // message data gets modified based on emotion edit rules, and emitted to all clients on 04-convo1 page
    // TODO implement text modification
    io.emit('chat:new', msg);
  });
});

// SERVER SETUP
app.use('/', express.static('dist'));
app.use('/data', express.static('data'));
app.get('/emotions', (req, res) => { res.json(emotions); });

// responds with array of image urls for base emotion
app.get('/images/:baseEmotion/manifest', (req, res) => {
  try {
    const baseEmotion = req.params.baseEmotion;

    if (!baseEmotion) {
      throw new Error('No emotion in url');
    }
    const files = fs.readdirSync(`./static/images/${baseEmotion}`)

    // get rid of hidden files (.DS_STORE, etc)
    const imageFiles = files.filter(item => !(/(^|\/)\.[^\/\.]/g).test(item));

    // URL client can use to get the image in css or img src attribute
    const staticURLPrefix = `/static/images/${baseEmotion}/`;

    const finalURLs = [];
    imageFiles.forEach(file => {
      finalURLs.push(staticURLPrefix + encodeURI(file));
    })

    res.status(200).send(JSON.stringify(finalURLs));

  } catch (err) {
    console.log(err);
    res.status(400).send(err.message);
  }
});

http.listen(3000, () => { console.debug('listening on *:3000'); });
