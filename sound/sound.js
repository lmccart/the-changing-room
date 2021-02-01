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
        areas.reflection.push(newDevice); // temp
      } else {
        areas.rest.push(newDevice);
      }
    });
    console.log(areas);
  });
  newDevice.stop();
});

const playEmotion = (emotion) => {
  let track = process.env.HTTP_SERVER + 'sound/sounds/' + emotion.base + '.aif';
  for (area of areas.rest) {
    area.setVolume(30);
    // area.setVolume(55 + emotion.level * 15);
    area.play(track).then(() => { console.log('SOUND: rest playing '+track); }).catch(err => { console.log(err) })
  }
};

const playEmotionReflection = (emotion) => {
  // let reflectionTrack = process.env.HTTP_SERVER + 'sound/sounds-reflection/' + emotion.base + '-' + emotion.name + '.wav';
  let reflectionTrack = process.env.HTTP_SERVER + 'sound/sounds-reflection/angry-annoyed.wav';
  for (area of areas.reflection) {
    // area.setVolume(55 + emotion.level * 15);
    area.setVolume(30);
    area.play(reflectionTrack).then(() => { console.log('SOUND: reflection playing '+reflectionTrack); }).catch(err => { console.log(err) })
  }
};

const stopAll = () => {
  // console.debug('stop sound');
  // for (area of areas.rest) {
  //   area.stop();
  // }  
  // for (area of areas.reflection) {
  //   area.stop();
  // } 
}

module.exports.playEmotion = playEmotion;
module.exports.playEmotionReflection = playEmotionReflection;
module.exports.stopAll = stopAll;