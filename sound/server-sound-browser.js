let socket;
let volume = 50;

const init = (s, e) => {
  socket = s;
  playEmotion(e);
  return this;
};

const playEmotion = (emotion) => {
  let track = process.env.HTTPS_SERVER + 'sound/sounds/' + emotion.base + '.mp3';
  socket.emit('sound:play', {track: track, reflection: false, vol: volume / 100});
  console.log(`SOUND: environment playing ${track}`);
};

const playEmotionReflection = (emotion) => {
  let reflectionTrack = process.env.HTTPS_SERVER + 'sound/sounds-reflection/' + emotion.base + '-' + emotion.name + '.mp3';
  socket.emit('sound:play', {track: reflectionTrack, reflection: true, vol: volume / 100});
  console.log(`SOUND: playing reflection ${reflectionTrack}`);
};

const stopAll = () => {
  socket.emit('sound:stop');
  console.log('SOUND: stop');
};

const setVolume = (val) => {
  if (typeof volume !== 'number') return;
  volume = val;
  console.log(`SOUND: setting volume to ${val}`);
};


module.exports.init = init;
module.exports.playEmotion = playEmotion;
module.exports.playEmotionReflection = playEmotionReflection;
module.exports.stopAll = stopAll;
module.exports.setVolume = setVolume;