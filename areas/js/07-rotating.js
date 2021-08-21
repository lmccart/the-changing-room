import $ from 'jquery';
import '../css/07-rotating.scss';
import './shared.js';

window.soundEnabled = true;

window.init = () => {
  console.log('init');
  
  // socket.on('reflection:restart', (msg) => {
  //   console.log(msg);
  // });
  // socket.on('emotion:update', (msg) => {
  //   window.soundType === msg.soundType;
  //   setMode(msg.soundType);
  // });
};


// function setMode(m) {
//   console.log('set mode ', m);
//   window.soundType = m;
//   if (window.soundType === 'reflection') {
//     $('#passive-section').hide();
//     $('#reflection-section').show();
//   } else {
//     $('#passive-section').show();
//     $('#reflection-section').hide();
//   }
// }

