import $ from 'jquery';
import '../css/07-rotating-single.scss';
import './shared.js';

let currentMode;
setMode('reflection');
// checkModeToggle();
// setInterval(checkModeToggle, 100);

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
    if (!window.location.href.includes('screen2')) window.soundType = 'reflection';
  } else {
    $('#passive-section').show();
    $('#reflection-section').hide();
    window.soundType = 'mute';
  }
  console.log('set mode ', currentMode, ' soundType ', window.soundType);
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