import $ from 'jquery';
import '../css/07-rotating-double.scss';
import './shared.js';

let currentMode;
let screenId = window.location.href.includes('index0') ? 0 : 1;
console.log(screenId);
window.soundType = 'mute';

window.init = () => {
  console.log('init');

  checkModeToggle();

  socket.on('emotion:update', (msg) => {
    console.log('EMOTION:UPDATE');
    checkModeToggle();
  });


};

function setMode(m) {
  currentMode = m;
  if (currentMode === 'reflection') {
    // $('#passive-section').hide();
    // $('#reflection-section').show();

    $('body').html('');
    $('body').append(`
    <section id='reflection-section' style='display:block;'>
      <iframe id='reflection-iframe' src='/02-reflection?screen=${screenId}'></iframe>
    </section>`);


  } else {
    // $('#passive-section').show();
    // $('#reflection-section').hide();

    $('body').html('');
    $('body').append(`
    <section id='passive-section' style='display:block;'>
      <iframe id='passive-iframe' src='/06-passive'></iframe>
    </section>`);

  }
}

function checkModeToggle() {
  const mins = new Date().getSeconds() % 2;
  console.log('check mode toggle', mins);
  // even - reflection, odd - passive
  if (mins === 0 && currentMode !== 'reflection') {
    setMode('reflection');
  } else if (mins === 1 && currentMode !== 'passive') {
    setMode('passive')
  }
}

