import $ from 'jquery';
import '../css/07-rotating-double.scss';
import './shared.js';

let currentMode;
setMode('reflection'); // passive
// checkModeToggle();
// setInterval(checkModeToggle, 100);

window.soundType = 'mute';
window.init = () => {
  console.log('init');
  socket.on('emotion:update', (msg) => {
    console.log('EMOTION:UPDATE');
  });

};

function setMode(m) {
  currentMode = m;

  if (currentMode === 'reflection') {
    $('#passive-section').hide();
    $('#reflection-section').show();
  } else {
    $('#passive-section').show();
    $('#reflection-section').hide();
  }
}

function checkModeToggle() {
  const mins = new Date().getMinutes();
  // even - reflection, odd - passive
  if (mins%2 === 0 && currentMode !== 'reflection') {
    setMode('reflection');
  } else if (mins%2 === 1 && currentMode !== 'passive') {
    setMode('passive')
  }
}