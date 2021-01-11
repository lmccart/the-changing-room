const { DeviceDiscovery, Sonos } = require('sonos');

const lookup = {
  "Kitchen": 0
};
const areas = [];

DeviceDiscovery((device) => {
  console.log('found device at ' + device.host)
  const newDevice = new Sonos(device.host)
  newDevice.setPlayMode('REPEAT_ONE');
  // newDevice.setPlayMode('CROSSFADE');
  newDevice.getAllGroups().then(groups => {
    let id;
    groups.forEach(group => {
      newDevice.groupName = group.Name;
      id = lookup[group.Name];
      areas[id] = newDevice;
    });
  });
  newDevice.stop();
  console.log(newDevice)
});

const playEmotion = (emotion) => {
  console.log(emotion)
  let track = 'http://lmccartbook.local:3000/sounds/'+emotion.base+'.m4a';
  for (area of areas) {
    area.setVolume(10 + emotion.level * 20);
    console.log(40 + emotion.level * 20)
    area.play(track).then(() => { area.seek(4); console.log('now playing'); }).catch(err => { console.log(err) })
  }
};


module.exports.playEmotion = playEmotion;