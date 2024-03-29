require('dotenv').config();
const fs = require('fs');

const key = fs.readFileSync(process.env.SSL_KEY);
const cert = fs.readFileSync(process.env.SSL_CERT);

const express = require('express');
const app = express();
const http = require('http').createServer(app);
const https = require('https').createServer({key: key, cert: cert}, app);
http.listen(3001, () => { console.log('http listening on *:3001'); });
https.listen(3000, () => { console.log('https listening on *:3000'); });
const io = require('socket.io')(https);

const Sound = require('./sound/server-sound-browser');
const Lights = require('./lights/server-lights-dmx');

const { getChatSubData } = require('./server-fileUtils');
let chatSubs;
getChatSubData(process.env.LANG0).then(data => chatSubs = data).catch(err => console.log('error', err));

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

// DATA INIT
const emotions = JSON.parse(fs.readFileSync('all-emotions.json')); // read all emotions
const baseEmotions = generateBases();
const imagesManifest = generateImagesManifest();

const emotionName = fs.readFileSync('current.txt', {encoding:'utf8', flag:'r'}).replace(/\s/g, ''); // remove whitespace
setEmotion(emotionName, true);

// SOCKET
io.on('connection', (socket) => {
  socket.emit('emotion:update', curEmotion);

  socket.on('disconnect', () => { });
  socket.on('emotion:pick', setEmotion);
  socket.on('emotion:get', () => {
    socket.emit('emotion:update', curEmotion);
  });
  socket.on('chat:send', handleChat);
  socket.on('reflection:end', restartReflectionAudio);

  // debug stuff
  socket.on('debug:toggle', msg => { io.emit('debug:toggle', msg); });
  socket.on('debug:reload', msg => { io.emit('debug:reload', msg); });
  socket.on('sound:off', Sound.stopAll);
  socket.on('lights:off', Lights.stopAll);
  socket.on('volume:set', msg => { Sound.setVolume(msg.val); });

  Sound.setup(io, curEmotion);
});

// SERVER SETUP
app.use('/', express.static('dist'));
app.use('/sound', express.static('sound'));
app.use('/images', express.static('images'));
app.use('/videos', express.static('videos'));
app.get('/emotions', (req, res) => { res.json(emotions); });

// responds with array of image urls for base emotion
app.get('/images/:baseEmotion/manifest', (req, res) => {
  try {
    const baseEmotion = req.params.baseEmotion;
    if (!baseEmotion) {
      throw new Error('No emotion in url');
    }
    res.status(200).send(JSON.stringify(imagesManifest[baseEmotion]));
  } catch (err) {
    console.log(err);
    res.status(400).send(err.message);
  }
});

function setEmotion(emotionName, init) {
  console.log('SET EMOTION');
  curEmotion = emotions[emotionName];
  curEmotion.volume = Sound.volume;
  curEmotion.seed = Math.round(Math.random() * 10000);
  console.log(curEmotion);
  Lights.playEmotion(curEmotion);
  if (!init) {
    io.emit('emotion:update', curEmotion);
    fs.writeFileSync('current.txt', emotionName);
    Sound.playEmotion(curEmotion);
    // Sound.playEmotionReflection(curEmotion);
  }
}

function restartReflectionAudio() {
  let opt = { 'seed' : Math.round(Math.random() * 10000)};
  io.emit('reflection:restart', opt);
  // Sound.playEmotionReflection(curEmotion);
}

function handleChat(data) {
  // called by area 04 when user hits "send" on a chat message
  const wordsToSubArray = chatSubs[curEmotion.base];
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

function generateBases() {
  let bases = [];
  Object.keys(emotions)
    .sort()
    .forEach((emotion, i) => {
      let base = emotions[emotion].base;
      if (!bases.includes(base)) {
        bases.push(base);
      }
    });
  return bases;
}


function generateImagesManifest() {
  let manifest = {};

  // GET BASES
  for (let base of baseEmotions) {
    if (!manifest.hasOwnProperty(base)) {
      manifest[base] = [];
      for (let i = 0; i < 3; i++) {
        manifest[base][i] = getAllFiles(`/images/${base}/${i + 1}/`);
      }
    }
  }
  manifest['popups'] = getAllFiles('/images/popups/');
  return manifest;
}

function getAllFiles(dir) {
  const list = [];
  const files = fs.readdirSync(`.${dir}`);
  
  // get rid of hidden files (.DS_STORE, etc)
  const imageFiles = files.filter(item => !(/(^|\/)\.[^\/\.]/g).test(item));

  // URL client can use to get the image in css or img src attribute
  const staticURLPrefix = dir;

  imageFiles.forEach(file => {
    list.push(staticURLPrefix + encodeURI(file));
  });
  return list;
}

// CLEANUP
// function cleanup() {
//   console.log('stop all');
//   Sound.stopAll();
//   Lights.stopAll();
// };

// process.on('cleanup', cleanup);

// // do app specific cleaning before exiting
// process.on('exit', function () {
//   cleanup();
//   process.emit('cleanup');
// });

// // catch ctrl+c event and exit normally
// process.on('SIGINT', function () {
//   console.log('Ctrl-C...');
//   cleanup();
//   process.exit(2);
// });

// //catch uncaught exceptions, trace, then exit normally
// process.on('uncaughtException', function(e) {
//   console.log('Uncaught Exception...');
//   console.log(e.stack);
//   cleanup();
//   process.exit(99);
// });
