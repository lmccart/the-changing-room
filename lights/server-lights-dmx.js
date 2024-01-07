const DMX = require('dmx');
const fs = require('fs');
const colors = JSON.parse(fs.readFileSync('static/data/data.json'))['lights'];
let api;
const lights = false;//true;
let lightsInit = false;
let curEmotion;

const dmx = new DMX();
const universe = dmx.addUniverse('tcr', 'null'); // dmx.addUniverse(name, driver, device_id, options)

// I think I need to put Lines 1, 9-10 in server.js and pass universe as a param into playEmotion and stopAll

const playEmotion = (emotion) => {
  curEmotion = emotion;
  if (!lights || !lightsInit) return;
  
  let hex = colors[emotion.base].substring(1);
  let avgHex = avgcolor(hex, 'FFFFFF', 0.65 + emotion.level * 0.05);
  let rgb = hex2rgb(avgHex); // rgb.r, rgb.g, rgb.b

  let sat = 0;//emotion.level * 8 + 13;
  console.log(`LIGHTS: Setting group light state to ${hex} ${sat}`);

  // Need to get list of all channels that control red, green, blue, etc.
  let channelsUpdate = {
    r1: rgb.r,
    r2: rgb.r,
    r3: rgb.r,
    g1: rgb.g,
    g2: rgb.g,
    g3: rgb.g,
    b1: rgb.b,
    b2: rgb.b,
    b3: rgb.b,
  };

  universe.update(channelsUpdate);
  // for each channel in red, dmx.update(universe, channel, rgb.r) and so on
};

const stopAll = () => {
  console.log('stop lights');
  universe.updateAll(0);
};

const hex2rgb = (hex) => {
  var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16) / 255,
    g: parseInt(result[2], 16) / 255,
    b: parseInt(result[3], 16) / 255
  } : null;
};

module.exports.playEmotion = playEmotion;
module.exports.stopAll = stopAll;
