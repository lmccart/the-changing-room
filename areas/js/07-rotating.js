import $ from 'jquery';
import '../css/07-rotating.scss';
import './shared.js';

let currentMode;
setMode('passive');

window.soundType = 'mute';
window.init = () => {
  console.log('init');
  
  socket.on('emotion:update', (msg) => {
    console.log('EMOTION:UPDATE TOGGLE MODE');
    toggleMode();
  });
};

function toggleMode() {
  let currentMode = currentMode == 'reflection' ? 'environment' : 'reflection';
  setMode(currentMode);
}

function setMode(m) {
  currentMode = m;
  console.log('set mode ', currentMode);
  if (window.soundType === 'reflection') {
    $('#passive-section').hide();
    $('#reflection-section').show();
  } else {
    $('#passive-section').show();
    $('#reflection-section').hide();
  }
}