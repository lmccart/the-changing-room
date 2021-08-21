import $ from 'jquery';
import '../css/07-rotating.scss';
import './shared.js';

window.init = () => {
  console.log('init');
  
  socket.on('rotating:mode', (msg) => {
    console.log(msg);
    if (msg.mode === 'reflection') {
      $('#passive-section').hide();
      $('#reflection-section').show();
    } else {
      $('#passive-section').show();
      $('#reflection-section').hide();
    }
  });
};

