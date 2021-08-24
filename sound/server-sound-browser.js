let io;
let volume = 100;
let initialized = false;

const setup = (i, e) => {
  if (initialized) return;
  initialized = true;
  io = i;
  playEmotion(e);
  playEmotionReflection(e);
};


const playEmotion = (emotion) => {
  let track = process.env.HTTPS_SERVER + 'sound/sounds/' + emotion.base + '.mp3';
  io.emit('sound:play', {track: track, soundType: 'environment', vol: volume / 100});
  console.log(`SOUND: environment playing ${track}`);
};

const playEmotionReflection = (emotion) => {
  let reflectionTrack = process.env.HTTPS_SERVER + 'sound/sounds-reflection/' + emotion.base + '-' + emotion.name + '.mp3';
  io.emit('sound:play', {track: reflectionTrack, soundType: 'reflection', vol: volume / 100});
  console.log(`SOUND: playing reflection ${reflectionTrack}`);
};

const stopAll = () => {
  io.emit('sound:stop');
  console.log('SOUND: stop');
};

const setVolume = (val) => {
  if (typeof volume !== 'number') return;
  volume = val;
  io.emit('sound:volume', {vol: volume / 100});
  console.log(`SOUND: setting volume to ${val}`);
};

module.exports.setup = setup;
module.exports.playEmotion = playEmotion;
module.exports.playEmotionReflection = playEmotionReflection;
module.exports.stopAll = stopAll;
module.exports.setVolume = setVolume;