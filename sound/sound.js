const { DeviceDiscovery, Sonos } = require('sonos');

const areas = {
  rest: [],
  reflection: []
};

DeviceDiscovery((device) => {
  console.log('SOUND: found device at ' + device.host)
  const newDevice = new Sonos(device.host)
  // newDevice.setPlayMode('CROSSFADE');
  newDevice.getAllGroups().then(groups => {
    groups.forEach(group => {
      newDevice.groupName = group.Name;
      if (group.Name !== 'reflection') {
        areas.reflection.push(newDevice);
      } else {
        areas.rest.push(newDevice);
      }
    });
    console.log(areas);
  });
  newDevice.stop();
});

const playEmotion = (emotion) => {
  console.log(emotion)
  let track = process.env.HTTP_SERVER + 'sound/sounds/' + emotion.base + '.aif';
  let reflectionTrack = process.env.HTTP_SERVER + 'sound/sounds-reflection/' + emotion.base + '-' + emotion.name + '.wav';
  for (area of areas.rest) {
    // area.setVolume(55 + emotion.level * 15);
    area.setVolume(5 + emotion.level * 15);
    area.play(track).then(() => { console.log('SOUND: rest playing '+track); }).catch(err => { console.log(err) })
  }  
  for (area of areas.reflection) {
    // area.setVolume(55 + emotion.level * 15);
    area.setVolume(5 + emotion.level * 15);
    area.play(reflectionTrack).then(() => { console.log('SOUND: reflection playing '+reflectionTrack); }).catch(err => { console.log(err) })
  }
};

module.exports.playEmotion = playEmotion;