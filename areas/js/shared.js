import $ from 'jquery';
import { getTextColorForBackground } from './lib/imageColorUtils.js';
// this allows for us to do blob.text() 
// which safari doesn't support natively

window.socket = io();

window.curEmotion;

document.title = $('#debug-area').text();
console.log($('#debug-area').text());

// getting colors from the data file
fetch('/data/colors.json').then(res => {
  return res.json();
}).then(colors => {
  window.baseColors = colors;
  window.init();
});

// Helper Functions

window.showLoadingOverlay = (newEmotion, cb) => {

  const colors = window.baseColors[newEmotion.base][newEmotion.level - 1];
  const textColor = getTextColorForBackground(colors[0], colors[1]);
  $('#loading').css('color', textColor);

  $('#loading-emotion').text(newEmotion.name);
  $('#loading').addClass('show');


  // Eventually this way of closing the loading
  // screen should be made opt-in, so in case
  // a page has to do a lot of setup that takes
  // longer than 2 seconds, it can use the 
  // `hideLoadingOverlay` function on its own
  setTimeout(function() {
    hideLoadingOverlay();
    if (typeof cb === 'function') {
      cb(); 
    }
  }, 2000);


};

window.hideLoadingOverlay = () => {
  $('#loading').removeClass('show');
  $('#loading-emotion').empty();
};

// for hot reloading
if (module.hot) {
  module.hot.accept(); 
}
