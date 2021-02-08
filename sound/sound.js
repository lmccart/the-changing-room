const { DeviceDiscovery, Sonos } = require('sonos');

const areas = {
  rest: false,
  reflection: false
};
let initialized = false;

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
        } else {
          areas.rest = newDevice;
        }
      });
      console.log(areas);
    });
  }
});

const playEmotion = (emotion) => {
  if (!areas.rest) return;
  let track = process.env.HTTP_SERVER + 'sound/sounds/' + emotion.base + '.wav';
  areas.rest.setVolume(15);
  // areas.rest.setVolume(70 + emotion.level * 10);
  areas.rest.play(track).then(() => { console.log('SOUND: rest playing '+track); }).catch(err => { console.log(err) })
};

const playEmotionReflection = (emotion) => {
  if (!areas.reflection) return;
  console.log('play emotion');
  let reflectionTrack = process.env.HTTP_SERVER + 'sound/sounds-reflection/' + emotion.base + '-' + emotion.name + '.wav';
  // areas.reflection.setVolume(70 + emotion.level * 10);
  areas.reflection.setVolume(15);
  areas.reflection.play(reflectionTrack).then(() => { console.log('SOUND: reflection playing '+reflectionTrack); }).catch(err => { console.log(err) })
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