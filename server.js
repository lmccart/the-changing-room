require('dotenv').config();
const fs = require('fs');

// const key = fs.readFileSync('./localhost+1.pem');
// const cert = fs.readFileSync('./localhost+1-key.pem');
const key = fs.readFileSync('./lmccartbook.local+4-key.pem');
const cert = fs.readFileSync('./lmccartbook.local+4.pem');

const express = require('express');
const app = express();
const http = require('http').createServer(app);
const https = require('https').createServer({key: key, cert: cert}, app);
http.listen(3001, () => { console.debug('http listening on *:3001'); });
https.listen(3000, () => { console.debug('https listening on *:3000'); });
const io = require('socket.io')(https);

const Sound = require('./sound/sound');
const Lights = require('./lights');

const { getChatSubData } = require('./fileUtils');
let chatSubs;
getChatSubData().then(data => chatSubs = data).catch(err => console.log('error', err));

let curEmotion;

// Webpack setup for hot reloading dev environment
const webpack = require('webpack');
const webpackConfig = require('./webpack.config');
const compiler = webpack(webpackConfig);

app.use(require('webpack-dev-middleware')(compiler, {
  publicPath: webpackConfig.output.publicPath,
  writeToDisk: true,
}));

app.use(require('webpack-hot-middleware')(compiler, {
  path: '/__webpack_hmr', heartbeat: 10 * 1000
}));

// LOGGING
const log4js = require('log4js');
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
const emotionName = fs.readFileSync('current.txt', {encoding:'utf8', flag:'r'}).replace(/\s/g, '');  // remove whitespace
setEmotion(emotionName, true);

// SOCKET
io.on('connection', (socket) => {
  console.debug('user connected: ' + socket.id);
  socket.emit('emotion:update', curEmotion);

  socket.on('disconnect', () => { console.debug('user disconnected: ' + socket.id); });
  socket.on('emotion:pick', setEmotion);
  socket.on('reflection:end', restartReflectionAudio);
  socket.on('emotion:get', function() {
    socket.emit('emotion:update', curEmotion);
  });
  socket.on('chat:send', handleChat);
});

// SERVER SETUP
app.use('/', express.static('dist'));
app.use('/sound', express.static('sound'));
app.use('/images', express.static('images'));
app.get('/emotions', (req, res) => { res.json(emotions); });

// responds with array of image urls for base emotion
app.get('/images/:baseEmotion/manifest', (req, res) => {
  try {
    const baseEmotion = req.params.baseEmotion;

    if (!baseEmotion) {
      throw new Error('No emotion in url');
    }
    const files = fs.readdirSync(`./images/${baseEmotion}`)

    // get rid of hidden files (.DS_STORE, etc)
    const imageFiles = files.filter(item => !(/(^|\/)\.[^\/\.]/g).test(item));

    // URL client can use to get the image in css or img src attribute
    const staticURLPrefix = `/images/${baseEmotion}/`;

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

// responds with array of image urls for base emotion
app.get('/images/popups/manifest', (req, res) => {
  try {
    const baseEmotion = req.params.baseEmotion;

    if (!baseEmotion) {
      throw new Error('No emotion in url');
    }
    const files = fs.readdirSync(`./images/popups/`)

    // get rid of hidden files (.DS_STORE, etc)
    const imageFiles = files.filter(item => !(/(^|\/)\.[^\/\.]/g).test(item));

    // URL client can use to get the image in css or img src attribute
    const staticURLPrefix = `/images/popups/`;

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

function setEmotion(emotionName, init) {
  curEmotion = emotions[emotionName];
  console.debug(curEmotion);
  Sound.playEmotion(curEmotion);
  Lights.playEmotion(curEmotion);
  if (!init) {
    io.emit('emotion:update', curEmotion);
    fs.writeFileSync('current.txt', emotionName);
  }
}

function restartReflectionAudio() {
  // TODO: restart of reflection audio
  let opt = { 'seed' : Math.random() * 1000 };
  io.emit('reflection:restart', JSON.stringify(opt)); 
}

function handleChat(data) {
  // called by area 04 when user hits "send" on a chat message
  const wordsToSubArray = chatSubs[curEmotion.base]
  const subArray = chatSubs[`${curEmotion.base}-subs`];

  // splits message into array of words, spaces and punctuation marks
  const msgWordArray = data.original.split(/([\.!\?\,\-])|([\s])/g);
  for (let index = 0; index < msgWordArray.length; index++) {
    const currentWord = msgWordArray[index];
    const matchedIndex = wordsToSubArray.findIndex(word => currentWord && (word.toLowerCase() === currentWord.toLowerCase()));
    
    if (matchedIndex >= 0) {
      msgWordArray[index] = subArray[matchedIndex];
    }
  }
  data.modified = msgWordArray.join('');
  io.emit('chat:new', data);
}
