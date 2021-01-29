import $ from 'jquery';
import { getTextColorForBackground, addSvgFilterForElement } from './lib/imageColorUtils.js';


window.loadingDur = 3000;
window.loadingFadeDur = 300;

window.socket = io();

document.title = $('#debug-area').text();
console.log($('#debug-area').text());

// getting colors from the data file
fetch('/static/data/colors.json').then(res => {
  return res.json();
}).then(colors => {
  window.baseColors = colors;
  if (window.init) {
    window.init();
  }
});

window.showLoadingOverlay = (newEmotion) => {
  const colors = window.baseColors[newEmotion.base][newEmotion.level - 1];
  const textColor = getTextColorForBackground(colors[0], colors[1]);
  $('#loading').css('color', textColor);

  $('#loading-emotion').text(newEmotion.name);
  $('#loading').fadeIn(window.loadingFadeDur);


  setTimeout(function() {
    $('#loading').fadeOut(window.loadingFadeDur);
    $('#loading-emotion').empty();
    if (window.loadingComplete) {
      window.loadingComplete();
    }
  }, loadingDur);
  return [window.loadingFadeDur, window.loadingDur];
};


window.switchBackgrounds = (imgUrls, fadeDur, colors) => {

  const bgToHide = $('#background-1').is(':visible') ? $('#background-1') : $('#background-2');
  const bgToShow = $('#background-1').is(':visible') ? $('#background-2') : $('#background-1');

  if (colors) {
    let svgId = addSvgFilterForElement(bgToShow, colors);
    let oldSvgId = bgToShow.data('svgId');
    $(`#${oldSvgId}`).remove();
    bgToShow.data('svgId', svgId);
  }
  
  const imgUrl = imgUrls[Math.floor(Math.random() * imgUrls.length)];
  bgToShow.css('background-image', `url(${imgUrl})`);
  $('#loader').attr('src', imgUrl).off();
  $('#loader').attr('src', imgUrl).on('load', function() {
    console.log('loaded: ', imgUrl);
    bgToShow.fadeIn(fadeDur);
    bgToHide.fadeOut(fadeDur);
  });
};


// for hot reloading
if (module.hot) {
  module.hot.accept(); 
}

