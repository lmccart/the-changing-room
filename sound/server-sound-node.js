const path = require('path');
const { spawn } = require('child_process');
let child;
let volume = 50;

const init = (s, e) => {
  return this;
};

const playEmotion = (emotion) => {
  let track = path.resolve(__dirname, `./sounds/${emotion.base}.mp3`);
  playAudio(track);
};

const playEmotionReflection = (emotion) => {
  let track = path.resolve(__dirname, `./sounds-reflection/${emotion.base}-${emotion.name}.mp3`);
  playAudio(track);
};

const playAudio = (track) => {
  stopAll();
  child = spawn('/usr/local/bin/ffplay', ['-i', track, '-loglevel', 'quiet', '-autoexit', '-nodisp', '-volume', volume]);
  child.stdout.on('data', data => {});
  child.stderr.on('data', data => { console.log(`stderr: ${data}`); });
  child.on('error', (error) => { console.log(`error: ${error.message}`); });
  child.on('close', code => { console.log(`child process exited with code ${code}`); });
  console.log(`SOUND: environment playing ${track}`);
};

const stopAll = () => {
  if (child) {
    child.stdin.pause();
    child.kill();
  }
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