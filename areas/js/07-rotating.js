import $ from 'jquery';
import '../css/07-rotating.scss';
import './shared.js';

setMode('passive');

window.init = () => {
  console.log('init');
  
  socket.on('emotion:update', (msg) => {
    console.log('EMOTION:UPDATE TOGGLE MODE');
    toggleMode();
  });
};

function toggleMode() {
  let mode = window.soundType === 'reflection' ? 'environment' : 'reflection';
  setMode(mode);
}

function setMode(m) {
  console.log('set mode ', m);
  window.soundType = m;
  if (window.soundType === 'reflection') {
    $('#passive-section').hide();
    $('#reflection-section').show();
  } else {
    $('#passive-section').show();
    $('#reflection-section').hide();
  }
}