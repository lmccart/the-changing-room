const DMX = require('dmx');
const fs = require('fs');
const colors = JSON.parse(fs.readFileSync('static/data/data.json'))['lights'];
let api;
let curEmotion;

const dmx = new DMX();
// ls /dev/tty.*
const universe = dmx.addUniverse('tcr', 'enttec-usb-dmx-pro', '/dev/tty.usbserial-EN252270');

const playEmotion = (emotion) => {
  curEmotion = emotion;
  
  let hex = colors[emotion.base].substring(1);
  // let avgHex = avgcolor(hex, 'FFFFFF', 0.65 + emotion.level * 0.05);
  let rgb = HSLToRGB(hexToHSL(hex)); // rgb.r, rgb.g, rgb.b

  let sat = 0;//emotion.level * 8 + 13;
  console.log(`LIGHTS: Setting group light state to ${hex} ${sat}`);

  console.log(rgb);
  // Need to get list of all channels that control red, green, blue, etc.
  // test: 1 brightness, 2 red, 3 green, 4 blue, 5 cool white, 6 program, 7 shutter/strobe

  console.log(typeof rgb.r);
  let channelsUpdate = {
    1: 100,
    2: rgb.r,
    3: rgb.g,
    4: rgb.b,
    5: 50,
    6: 0,
    7: 0,
    8: 0,
    9: 0,
    10: rgb.r,
    11: rgb.g,
    12: rgb.b,
    13: 0
  };

  // universe.update(channelsUpdate);
  dmx.update('tcr', channelsUpdate);
  // universe.updateAll(0);
  // dmx.update('tcr', channelsUpdate);
};

const stopAll = () => {
  console.log('stop lights');
  universe.updateAll(0);
};

function avgcolor(color1, color2, ratio) {
  var hex = function(x) {
    x = x.toString(16);
    return (x.length === 1) ? '0' + x : x;
  };
  
  var r = Math.ceil(parseInt(color1.substring(0,2), 16) * ratio + parseInt(color2.substring(0,2), 16) * (1 - ratio));
  var g = Math.ceil(parseInt(color1.substring(2,4), 16) * ratio + parseInt(color2.substring(2,4), 16) * (1 - ratio));
  var b = Math.ceil(parseInt(color1.substring(4,6), 16) * ratio + parseInt(color2.substring(4,6), 16) * (1 - ratio));
  
  var middle = hex(r) + hex(g) + hex(b);
  // console.log(r, g, b);
  // console.log(color1, color2, middle);
  return middle;
}

const hex2rgb = (hex) => {
  var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
};

function hexToHSL(hex) {
  console.log('hex:', hex);
  // Convert hex to RGB first
  let r = 0, g = 0, b = 0;
  if (hex.length === 4) {
    r = '0x' + hex[1] + hex[1];
    g = '0x' + hex[2] + hex[2];
    b = '0x' + hex[3] + hex[3];
  } else if (hex.length === 6) {
    r = '0x' + hex[0] + hex[1];
    g = '0x' + hex[2] + hex[3];
    b = '0x' + hex[4] + hex[5];
  }

  // Then to HSL
  r /= 255;
  g /= 255;
  b /= 255;

  console.log('initial rgb', {r, g, b});

  let cmin = Math.min(r,g,b),
    cmax = Math.max(r,g,b),
    delta = cmax - cmin,
    h = 0,
    s = 0,
    l = 0;

  if (delta === 0)
  { h = 0; }
  else if (cmax === r)
  { h = ((g - b) / delta) % 6; }
  else if (cmax === g)
  { h = (b - r) / delta + 2; }
  else
  { h = (r - g) / delta + 4; }

  h = Math.round(h * 60);

  if (h < 0)
  { h += 360; }

  l = (cmax + cmin) / 2;
  s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));
  s = +(s * 100).toFixed(1);
  l = +(l * 100).toFixed(1);

  return {h, s, l};
}

function HSLToRGB(hsl) {
  console.log({h, s, l});
  // Must be fractions of 1
  var h = hsl.h;
  var s = hsl.s / 100;
  s = 1; // playing with turning up saturation all the way
  var l = hsl.l / 100;
  l = 0.5; // playing with lowering lightness

  let c = (1 - Math.abs(2 * l - 1)) * s,
    x = c * (1 - Math.abs((h / 60) % 2 - 1)),
    m = l - c / 2,
    r = 0,
    g = 0,
    b = 0;

  if (0 <= h && h < 60) {
    r = c; g = x; b = 0;  
  } else if (60 <= h && h < 120) {
    r = x; g = c; b = 0;
  } else if (120 <= h && h < 180) {
    r = 0; g = c; b = x;
  } else if (180 <= h && h < 240) {
    r = 0; g = x; b = c;
  } else if (240 <= h && h < 300) {
    r = x; g = 0; b = c;
  } else if (300 <= h && h < 360) {
    r = c; g = 0; b = x;
  }
  console.log({r, g, b});
  r = Math.round((r + m) * 255);
  g = Math.round((g + m) * 255);
  b = Math.round((b + m) * 255);
  
  console.log({r, g, b});
  return {r, g, b};
}

module.exports.playEmotion = playEmotion;
module.exports.stopAll = stopAll;
