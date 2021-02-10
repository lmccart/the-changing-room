const { DeviceDiscovery, Sonos } = require('sonos');

const quiet = false;
const areas = {
  rest: [],
  reflection: []
};

<<<<<<< HEAD
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
=======
DeviceDiscovery((device) => {
  console.log('SOUND: found device at ' + device.host);

  if (!initialized) {
    initialized = true;
    const searchDevice = new Sonos(device.host);
    searchDevice.getAllGroups().then(groups => {
      groups.forEach(group => {
        const newDevice = new Sonos(group.host);
        newDevice.setPlayMode('REPEAT_ONE');
        if (group.Name === 'Digital Art Gallery') {
          areas.reflection = newDevice;
          areas.reflection.setVolume(90);
        } else {
          areas.rest = newDevice;
          areas.rest.setVolume(85);
        }
      });
      console.log(areas);
    });
  }
>>>>>>> c8caf0ec943f54182c058bbffb641f8c8949e72d
});

const playEmotion = (emotion) => {
  if (!areas.rest) return;
  let track = process.env.HTTP_SERVER + 'sound/sounds/' + emotion.base + '.wav';
<<<<<<< HEAD
  for (let device of areas.rest) {
    if (quiet) device.setVolume(0);
    device.play(track).then(() => { console.log(`SOUND: rest ${device.name} ${device.host} playing ${track}`); }).catch(err => { console.log(err) })
  }
=======
  if (quiet) areas.rest.setVolume(0);
  else areas.rest.play(track).then(() => { console.log('SOUND: rest playing '+track); }).catch(err => { console.log(err) })
>>>>>>> c8caf0ec943f54182c058bbffb641f8c8949e72d
};

const playEmotionReflection = (emotion) => {
  if (!areas.reflection) return;
  console.log('play emotion');
  let reflectionTrack = process.env.HTTP_SERVER + 'sound/sounds-reflection/' + emotion.base + '-' + emotion.name + '.wav';
<<<<<<< HEAD
  for (let device of areas.reflection) {
    if (quiet) device.setVolume(0);
    device.play(reflectionTrack).then(() => { console.log(`SOUND: reflection ${device.name} ${device.host} playing ${reflectionTrack}`); }).catch(err => { console.log(err) })
  }
=======
  if (quiet) areas.reflection.setVolume(0);
  else areas.reflection.play(reflectionTrack).then(() => { console.log('SOUND: reflection playing '+reflectionTrack); }).catch(err => { console.log(err) })
>>>>>>> c8caf0ec943f54182c058bbffb641f8c8949e72d
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