const { DeviceDiscovery, Sonos } = require('sonos');

const quiet = false;
const areas = {
  rest: [],
  reflection: []
};

DeviceDiscovery((foundDevice) => {
  if (hasDevice(foundDevice)) return;
  const newDevice = new Sonos(foundDevice.host);
  newDevice.getZoneAttrs().then(attr => {
    console.log(`SOUND: found device at ${foundDevice.host} ${attr.CurrentZoneName}`);
    newDevice.name = attr.CurrentZoneName;
    newDevice.host = foundDevice.host;
    if (attr.CurrentZoneName === 'Digital Art Gallery') {
      areas.reflection.push(newDevice);
    } else {
      areas.rest.push(newDevice);
    }
  });
});

const playEmotion = (emotion) => {
  if (!areas.rest) return;
  let track = process.env.HTTP_SERVER + 'sound/sounds/' + emotion.base + '.wav';
  for (let device of areas.rest) {
    if (quiet) device.setVolume(0);
    device.play(track).then(() => { console.log(`SOUND: rest ${device.name} ${device.host} playing ${track}`); }).catch(err => { console.log(err) })
  }
};

const playEmotionReflection = (emotion) => {
  if (!areas.reflection) return;
  console.log('play emotion');
  let reflectionTrack = process.env.HTTP_SERVER + 'sound/sounds-reflection/' + emotion.base + '-' + emotion.name + '.wav';
  for (let device of areas.reflection) {
    if (quiet) device.setVolume(0);
    device.play(reflectionTrack).then(() => { console.log(`SOUND: reflection ${device.name} ${device.host} playing ${reflectionTrack}`); }).catch(err => { console.log(err) })
  }
};

const stopAll = () => {
  console.debug('stop sound');
  for (let device of areas.rest) {
    device.stop();
  }
  for (let device of areas.reflection) {
    device.stop();
  }
}

function hasDevice(device) {
  for (let d of areas.rest) {
    if (d.host === device.host) return true;
  }
  for (let d of areas.reflection) {
    if (d.host === device.host) return true;
  }
  return false;
}

module.exports.playEmotion = playEmotion;
module.exports.playEmotionReflection = playEmotionReflection;
module.exports.stopAll = stopAll;