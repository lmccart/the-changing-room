const { DeviceDiscovery, Sonos } = require('sonos');

const lookup = {
  'Bedroom': 0
};
const areas = [];

DeviceDiscovery((device) => {
  console.log('SOUND: found device at ' + device.host)
  const newDevice = new Sonos(device.host)
  // newDevice.setPlayMode('CROSSFADE');
  newDevice.getAllGroups().then(groups => {
    let id;
    groups.forEach(group => {
      newDevice.groupName = group.Name;
      id = lookup[group.Name];
      areas[id] = newDevice;
      if (typeof id === 'undefined') {
        console.log('SOUND: id NOT FOUND');
      }
    });
  });
  newDevice.stop();
});

const playEmotion = (emotion) => {
  console.log(emotion)
  let track = 'http://lmccartbook.local:3001/sound/sounds/'+emotion.base+'.aif';
  for (area of areas) {
    console.log(area);
    // area.setPlayMode('REPEAT_ONE');
    area.setVolume(55 + emotion.level * 15);
    area.play(track).then(() => { console.log('SOUND: now playing '+track); }).catch(err => { console.log(err) })
  }
};

module.exports.playEmotion = playEmotion;